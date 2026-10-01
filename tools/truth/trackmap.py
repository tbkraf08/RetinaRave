#!/usr/bin/env python3
"""Offline ground truth for a real track: what the music contains, measured non-causally from the decoded file.

The realtime engine is judged against this (ENGINE-CHLADNI-SESSION-PROMPT.md). Independent of the engine on purpose:
numpy + scipy + soundfile, whole-file STFTs, no causal constraint, no AGC.

    python3 tools/truth/trackmap.py SeeYouDrop            # table to stdout, JSON to tools/truth/<name>.json
    python3 tools/truth/trackmap.py SeeYouDrop --pcm      # also dump mono float32 PCM to tools/work/<name>.f32 (node tests)
    python3 tools/truth/trackmap.py CyborgNinja Malicious --brief   # one summary line per track
    python3 tools/truth/trackmap.py SeeYouDrop --grains=8,5,3,2,1,0.569,0.224   # the default grains (s); one table per grain
    python3 tools/truth/trackmap.py SeeYouDrop --loud    # ONLY the BS.1770 loudness reference -> tools/truth/<name>.loud.json
                                                         # --loud-out=<dir> writes elsewhere; --loud-win=<s> the drop-pair window (5.1)

Grains: every grain gets a table in tools/truth/<name>/grain-<g>.txt and a list under "slices" in the JSON (keyed by the grain);
the 5 s table also goes to stdout. A grain uses the longest STFT window <= 40 % of itself (16384 / 8192 / 4096), so a slice is not
smeared across its neighbours. The slice pitch comes from a time-domain YIN (100 ms window, 10 ms hop; `vcd` = voiced fraction of
the slice), which keeps ~0.1 s resolution where a 16k STFT (0.37 s) cannot. `subwob` needs a >= 3 s slice (its lags reach 1.7 s).
Onsets are per second for grains >= 1 s and raw counts below (0.224 s holds 0-2 events). The JSON also carries the 100 Hz YIN
contour (`contour.f0td`, 0 = unvoiced) for frame-by-frame comparison with the engine.

v0.15 (E0) adds, as new JSON keys and new tables only — every v0.14 key, table and byte is unchanged:
  bpm_grid   the beat grid: a comb ACF with a log-normal tempo prior (centre 135 BPM, sigma 0.7 oct — so 150 wins over 75 on
             SeeYouDrop), an Ellis-2007 dynamic-programming beat tracker on the percussive onset envelope, then a sub-hop
             period+phase refit (a constant-tempo track locks to ~1 ms; if the DP residual is > 60 ms the DP beats are kept).
             `downbeat_mod4` = which beat index mod 4 is the bar line (the low band is loudest on 1, the mid band on 3).
             Live step 3.1: a linear grid is then put on the kicks when they say it is off — `anchor_grid` (the kicks'
             eighth lattice > 25 ms off: re-phase, beat = the lattice with more low flux), `drift_fit` (a linear drift of
             that lattice: re-fit the period), and on that path the bar line comes from beat-level novelty when it is
             decisive. `bpm_grid.anchor` (only when the grid moved) holds the evidence. docs/workers/truth-grid-s3.md.
  beats downbeats                 the grids themselves (s).
  slices["beat"|"bar"|"4bar"]     beat-synchronous grains + tools/truth/<name>/grain-{beat,bar,4bar}.txt. Fixed-time slices cut
             across events (a 5 s slice once made drop 1 look harmonic when it is a pure sine from its first frame); these do not.
  sections   bar-synchronous self-similarity on band shares + purity + voiced share + onset densities + a SUB-INCLUSIVE chroma,
             Foote novelty with a Gaussian checkerboard kernel, boundaries at bar lines, greedy cosine clustering for labels;
             `ret` = 1 when the section repeats an earlier cluster. Printed against <name>.sections.json when that file exists.
  drops      bar-pinned: the bar where the low end (sub+bass) reaches DROP_MIN of its p90 after a bar under DROP_QUIET, and the
             four bars after it are in the top 30 % of bar energy. Not a causal "bass came back" rule.
  tonic      Krumhansl-Kessler on the sub-inclusive chroma (all 24 correlations in `scores`) — this is what settles C# vs G#.
  sub_slides glides in contour.f0td (>= 1 semitone in 0.08-0.5 s, continuous, monotonic, landing on a held note).
  bare808    low onsets with no 2-8 kHz click within 15 ms: an 808 note start, not a kick.
  novelty energy   the Foote curve and the per-bar energy (the macro arc an AGC flattens).
  --pcm      also writes tools/work/<name>.st.f32 (stereo, interleaved float32) + .json {sr,n,ch}; --sr=48000 resamples the dumps
             (resample_poly) to <name>.48000.f32 / .48000.st.f32 so node tests run at both page rates. The ANALYSIS always runs
             at the file's own rate.

Deps: soundfile lives in the gitignored tools/.pylib (python3 -m pip install --target tools/.pylib soundfile).
Tracks: $MUSIC (default ~/Music/RetinaRave), name with or without extension.

Columns (5 s slices): share of 25-12000 Hz energy in sub 25-60 / bass 60-150 / lm 150-400 / mid 400-2k / high 2k-12k (%);
f0 = median YIN pitch of the slice's voiced frames (28-130 Hz), `held` = fraction within half a semitone of it, `vcd` = voiced share;
cen = spectral centroid of 30-600 Hz; h/f = energy 150-600 over 30-150 (0.05 = a sine sub, >1 = a harmonic-rich bass);
subwob = autocorrelation peak period of the 25-60 Hz envelope (s, and in beats), depth = (p90-p10)/p90 of that envelope;
low/click/mid/high = HPSS-percussive onsets per second: low 40-150 Hz (kicks AND 808 note starts), click = low onsets with a mid/high
onset within 15 ms (kick candidates), mid 150-2500 (snares, claps), high 5-12k (hats); dB flux, 5/3/3 dB, level-gated at p95-30 dB.
"""
import json, os, sys
import numpy as np
from scipy.signal import stft, find_peaks, butter, sosfiltfilt, resample_poly
from scipy.ndimage import median_filter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', '.pylib'))
try:
    import soundfile as sf
except ImportError:
    sys.exit('soundfile missing: python3 -m pip install --target tools/.pylib soundfile')

NAMES = 'C C# D D# E F F# G G# A A# B'.split()
def note(h):
    if not h or h <= 0 or not np.isfinite(h): return '-'
    m = int(round(69 + 12 * np.log2(h / 440))); return NAMES[m % 12] + str(m // 12 - 1)

def find(name):
    d = os.environ.get('MUSIC', os.path.expanduser('~/Music/RetinaRave'))
    for ext in ('', '.flac', '.wav', '.mp3', '.ogg'):
        p = os.path.join(d, name + ext)
        if os.path.isfile(p): return p
    sys.exit(f'no track {name} in {d}')

def acpeak(e, fps, lo, hi):
    e = e - e.mean()
    if e.std() < 1e-12: return 0.0
    ac = np.correlate(e, e, 'full')[len(e) - 1:]; ac /= ac[0] + 1e-12
    a, b = int(lo * fps), int(hi * fps); return (a + ac[a:b].argmax()) / fps

# ---------------------------------------------------------------------------------------------------------------------
# E0 (v0.15): the beat / bar grid, bar-synchronous sections, bar-pinned drops, the sub-inclusive tonic, slides, bare 808s.
# Every constant here is named and justified in docs/workers/ears.md; nothing below changes an output that existed in v0.14.
KK_MAJ = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
KK_MIN = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
TEMPO_C, TEMPO_SIG = 60 / 135.0, 0.7    # the log-normal tempo prior: centre 135 BPM, sigma 0.7 octaves (0.80 s loses to 0.40 s)
DP_ALPHA = 680.0                        # Ellis 2007 transition weight (tightness) on the log-period penalty
SEC_KERNEL = 4                          # Foote checkerboard half-width, in bars
SEC_MINBARS = 2                         # a section is at least this many bars
SEC_CLUSTER = 0.35                      # cosine distance under which two segments share a label (a "return")
DROP_QUIET = 0.15                       # the low end counts as absent under this share of the track's loud-section low level
DROP_MIN = 0.55                         # ... and as entered at or above this share
DROP_AFTER_MIN = 0.60                   # the 4 bars after a drop must reach this share of the track's p90 bar energy (an
                                        # absolute share, not a percentile of the distribution: a percentile moves with how
                                        # much of the track is loud, and map/drops.js could not reproduce it)
DROP_DEN_MIN, DROP_DEN_W = 0.30, 8                     # ... AND this share of its p90 kick-candidate density. THIS is what separates a drop
                                        # from a loud bass layer entry: SeeYouDrop's walk at 13 s is as energetic as drop 1
                                        # (mean of the 4 bars after: 0.80 against 0.83 of the track's p90) because the track
                                        # is limited and its sub is 68-79 % of the energy — but the walk has no drums at all.
                                        # An energy gate alone cannot tell them apart at any threshold.
DROP_JUMP, DROP_SOFT, DROP_REFRACT = 0.25, 0.45, 4   # clause 2: a sustained jump (mean of the next 4 bars - the previous 4) with
                                        # the low end loud after and under DROP_SOFT before; at least DROP_REFRACT bars apart
SLIDE_SEMI, SLIDE_MAXT = 1.0, 0.5       # a slide: >= 1 semitone within <= 0.5 s, monotonic, voiced throughout
SLIDE_MINT, SLIDE_MAXJ = 0.08, 1.0      # ... lasting >= 80 ms (an instant re-trigger is a note, not a glide), no frame jumping > 1 semitone
SLIDE_MAXS, SLIDE_HOLD, SLIDE_HTOL = 12.0, 4, 0.4   # ... at most an octave, and the landing note held +-0.4 semitone for 40 ms
CLICK_W = 0.015                         # a low onset is a kick candidate if a mid/high onset is within 15 ms
ANCHOR_MS, ANCHOR_R = 0.025, 0.5        # live step 3.1: re-anchor the linear grid when the kicks' eighth-note lattice sits more
                                        # than 25 ms off it AND the kicks lock to that lattice (resultant >= 0.5). refit_grid
                                        # maximises the BEAT-rate fundamental of the onset envelope; when kicks land on both
                                        # eighths of the beat (CyborgNinja: 330 vs 359 per half) that fundamental cancels and the
                                        # phase falls between them (72 ms off every kick, resultant 0.04 at the beat, 0.96 at the
                                        # eighth). SeeYouDrop's lattice offset is +2.9 ms, so it never enters this branch.
DRIFT_G, DRIFT_MIN, DRIFT_R2 = 8, 16, 0.8   # ... and re-fit the PERIOD when the kicks' lattice offset, measured per 8 s slice
                                        # (>= 6 kicks, resultant >= 0.3), drifts LINEARLY across the track: >= 16 such slices,
                                        # weighted R^2 >= 0.8, and the fitted line moves more than ANCHOR_MS end to end.
                                        # WhoLikesToParty: 32 slices, R^2 0.85, -40 ms (+20 -> -22 ms). SeeYouDrop: 10 slices,
                                        # R^2 0.48 (its kicks are sparse and sectioned), so its hand-checked grid stays.
ANCHOR_NOV_L, ANCHOR_NOV_MARGIN = 16, 1.5   # ... and then the bar line comes from beat-level novelty (a 16-beat step kernel on
                                        # per-beat percussive band levels): the change points of a syncopated pattern land on
                                        # bar lines, while "the low band is loudest on 1" follows the syncopation. Used only
                                        # when the winning beat mod 4 carries >= 1.5x the runner-up's novelty; else downbeat_phase.

def tempo_peak(env, fps, lo=0.25, hi=1.0):
    """Comb ACF with a log-normal tempo prior -> (period s, the score curve, the lags). Picks 0.40 s, not 0.80 s, on SeeYouDrop."""
    a = env - env.mean(); ac = np.correlate(a, a, 'full')[len(a) - 1:]; ac = ac / (ac[0] + 1e-12)
    lags = np.arange(max(2, int(lo * fps)), int(hi * fps))
    c = ac[lags] + 0.6 * ac[np.minimum(2 * lags, len(ac) - 1)] + 0.3 * ac[np.minimum(4 * lags, len(ac) - 1)]
    s = c * np.exp(-0.5 * (np.log2(lags / fps / TEMPO_C) / TEMPO_SIG) ** 2)
    return lags[s.argmax()] / fps, s, lags

def dp_beats(env, fps, per, alpha=DP_ALPHA):
    """Ellis 2007 dynamic-programming beat tracker on the percussive onset envelope. -> FRAME-INDEX times (index / fps),
    hop-quantised. These are NOT real times: frame i of the short STFT is centred at t2[i] = t0 + i / fps (t0 = 1024 / sr
    = 23.2 ms with nperseg 2048, boundary=None), so a caller that writes these out as a beat list must add t0 — which the
    `dpres > 0.06` branch does (DECISIONS §72). `refit_grid` is in the same units and is deliberately NOT corrected: its
    phase is the onset envelope's beat-rate Fourier phase, whose own lag against the attacks happens to cancel t0, and
    that cancellation is MEASURED, track by track, not assumed (§72: adding t0 to the four anchored / refit grids moves
    every one of them 17-25 ms off its own attacks, and SeeYouDrop's refit phase sits +2.9 ms from its kick list as it is)."""
    o = env / (env.std() + 1e-12); o = np.convolve(o, np.hanning(5) / np.hanning(5).sum(), 'same')
    P = per * fps; tmin, tmax = max(1, int(round(P * 0.5))), int(round(P * 2.0))
    F = -alpha * (np.log(np.arange(tmin, tmax + 1) / P) ** 2)
    n = len(o); C = np.full(n, -1e18); B = np.full(n, -1, np.int64); C[:tmin] = o[:tmin]
    for i in range(tmin, n):
        js = np.arange(max(0, i - tmax), i - tmin + 1); sc = C[js] + F[(i - js) - tmin]
        k = int(sc.argmax()); C[i] = o[i] + sc[k]; B[i] = js[k]
    tail = int(round(2 * P)); i = n - tail + int(C[n - tail:].argmax()); out = []
    while i >= 0: out.append(i); i = B[i]
    return np.array(out[::-1]) / fps

def refit_grid(env, fps, per, span=0.012, step=2e-5):
    """Sub-hop period+phase: maximise |<o, e^{2 pi i t / p}>| over p near `per`. A constant-tempo track locks to ~1 ms."""
    t = np.arange(len(env)) / fps; o = env / (env.sum() + 1e-12); best = None
    for p in np.arange(per - span, per + span, step):
        z = (o * np.exp(2j * np.pi * t / p)).sum()
        if best is None or abs(z) > best[1]: best = (p, abs(z), np.angle(z))
    p, r, ang = best; return p, (-ang / (2 * np.pi)) * p % p, r

def downbeat_phase(beats, elow, emid, fps):
    """Which beat index mod 4 is the bar line: the low band is loudest on 1, the mid band on 3. -> (phase, the 4 scores)."""
    gl = lambda e, bt: np.array([e[max(0, i - 1):i + 2].max() for i in np.clip((bt * fps).astype(int), 0, len(e) - 1)])
    lv, mv = gl(elow, beats), gl(emid, beats); sc = []
    for ph in range(4):
        m = np.arange(len(beats)) % 4
        sc.append(float(lv[m == ph].mean() + 0.5 * mv[m == (ph + 2) % 4].mean()))
    return int(np.argmax(sc)), [round(v, 3) for v in sc]

def at_time(e, bt, fps, t0):
    """Envelope peak within +-1 frame of TIME bt. Frame i of the short STFT is centred at t0 + i / fps (t0 = 1024 / sr = 23 ms
    with boundary=None); downbeat_phase indexes int(bt * fps), two frames late — kept there for byte compatibility."""
    i = np.clip(np.round((np.asarray(bt) - t0) * fps).astype(int), 1, len(e) - 2); return np.maximum(np.maximum(e[i - 1], e[i]), e[i + 1])

def anchor_grid(kicks, per, ph, elow, fps, t0):
    """The kicks' eighth-note lattice against the linear grid. -> None when the grid already sits on it (|offset| <= ANCHOR_MS,
    or the kicks do not lock), else (new phase, evidence). Of the two beat lattices an eighth apart, the beat is the one with
    more low-band (40-150 Hz) flux on it. The period is not touched."""
    if len(kicks) < 32: return None
    h = per / 2; z = np.exp(2j * np.pi * (kicks - ph) / h).mean(); off, R = float(np.angle(z) / (2 * np.pi) * h), float(abs(z))
    ev = dict(offset_ms=round(off * 1000, 1), r8=round(R, 3))
    if abs(off) <= ANCHOR_MS or R < ANCHOR_R: return None
    a = (ph + off) % per; cands = [a, (a + h) % per]; tend = t0 + len(elow) / fps; sc = []
    for c in cands:
        bt = c + per * np.arange(int((tend - c) / per)); sc.append(float(at_time(elow, bt, fps, t0).mean()))
    k = int(np.argmax(sc)); ev.update(lattice=[round(v, 4) for v in cands], low_on_beat=[round(v, 3) for v in sc], pick=k,
                                      was=round(float(ph), 5), moved_ms=round(((cands[k] - ph + per / 2) % per - per / 2) * 1000, 1))
    return cands[k], ev

def drift_fit(kicks, per, ph):
    """A linear drift of the kicks' eighth-note lattice against the grid -> None, or (period, phase, evidence) with the drift
    folded into the grid: offset(t) = c0 t + c1 means the kicks sit at ph + n per (1 + c0) + c1 + c0 ph."""
    h = per / 2; ts, os_, ws = [], [], []
    for s in np.arange(0, kicks[-1] if len(kicks) else 0, DRIFT_G):
        m = (kicks >= s) & (kicks < s + DRIFT_G)
        if m.sum() < 6: continue
        z = np.exp(2j * np.pi * (kicks[m] - ph) / h).mean()
        if abs(z) < 0.3: continue
        ts.append(s + DRIFT_G / 2); os_.append(np.angle(z) / (2 * np.pi) * h); ws.append(abs(z) * m.sum())
    if len(ts) < DRIFT_MIN: return None
    ts, os_, ws = map(np.array, (ts, os_, ws)); W = np.sqrt(ws); A = np.c_[ts, np.ones_like(ts)]
    c = np.linalg.lstsq(A * W[:, None], os_ * W, rcond=None)[0]; res = os_ - A @ c
    r2 = float(1 - np.sum(ws * res ** 2) / (np.sum(ws * (os_ - np.average(os_, weights=ws)) ** 2) + 1e-18)); span = float(c[0] * (ts[-1] - ts[0]))
    ev = dict(slices=len(ts), r2=round(r2, 3), span_ms=round(span * 1000, 1), resid_ms=round(float(np.sqrt(np.average(res ** 2, weights=ws))) * 1000, 1))
    if r2 < DRIFT_R2 or abs(span) <= ANCHOR_MS: return None
    p2, ph2 = per * (1 + c[0]), ph + c[1] + c[0] * ph
    ev.update(was=dict(beat=round(float(per), 6), phase=round(float(ph), 5))); return float(p2), float(ph2 % p2), ev

def downbeat_novelty(beats, levels, L=ANCHOR_NOV_L):
    """Beat index mod 4 of the bar line from where the music changes: per-beat log band levels (z-scored), novelty = |mean of
    the next L beats - mean of the previous L|, peaks >= p85 at least L apart, novelty-weighted count per beat mod 4."""
    F = np.array([[np.log10(lv[(tt >= a) & (tt < b)].sum() + 1e-9) for tt, lv in levels] for a, b in zip(beats[:-1], beats[1:])])
    F = (F - F.mean(0)) / (F.std(0) + 1e-9); n = len(F); nov = np.zeros(n)
    for i in range(L, n - L): nov[i] = np.linalg.norm(F[i:i + L].mean(0) - F[i - L:i].mean(0))
    pk, _ = find_peaks(nov, distance=L, height=np.percentile(nov, 85))
    w = np.bincount(pk % 4, weights=nov[pk], minlength=4); o = np.argsort(w)[::-1]
    return int(o[0]), float(w[o[0]] / (w[o[1]] + 1e-9)), [round(float(v), 2) for v in w], [round(float(beats[i]), 3) for i in pk]

def foote(SSM, L=SEC_KERNEL):
    """Foote novelty from a self-similarity matrix with a Gaussian-tapered checkerboard kernel."""
    g = np.exp(-0.5 * (np.arange(-L + 0.5, L) / (L * 0.5)) ** 2); K = np.outer(g, g).copy()
    K[:L, L:] *= -1; K[L:, :L] *= -1; n = len(SSM); nov = np.zeros(n)
    for i in range(n):
        a, b = i - L, i + L
        if a < 0 or b > n: continue
        nov[i] = float((SSM[a:b, a:b] * K).sum())
    return np.maximum(nov, 0)

def cluster_labels(F, thr=SEC_CLUSTER):
    """Greedy cosine clustering of segment feature means; segment i gets the first label within `thr`. -> (labels, ret flags)."""
    U = F / (np.linalg.norm(F, axis=1, keepdims=True) + 1e-12); lab = np.full(len(F), -1); reps = []
    for i in range(len(F)):
        for k, r in enumerate(reps):
            if 1 - float(U[i] @ r) < thr: lab[i] = k; reps[k] = (r + U[i]) / (np.linalg.norm(r + U[i]) + 1e-12); break
        else: lab[i] = len(reps); reps.append(U[i].copy())
    seen = set(); ret = []
    for k in lab: ret.append(int(k in seen)); seen.add(int(k))
    return lab, ret

def kk_tonic(chroma):
    """Krumhansl-Kessler on a chroma that already includes the sub's root. -> (pc, minor, conf, all 24 correlations)."""
    c = chroma - chroma.mean(); sc = []
    for minor in (0, 1):
        pr = KK_MIN if minor else KK_MAJ
        for pc in range(12):
            p = np.roll(pr, pc); p = p - p.mean()
            sc.append(float((c @ p) / (np.linalg.norm(c) * np.linalg.norm(p) + 1e-12)))
    a = np.array(sc); i = int(a.argmax()); srt = np.sort(a)[::-1]
    return i % 12, i // 12, float(max(0.0, (srt[0] - srt[1]) / (abs(srt[0]) + 1e-12))), [round(v, 4) for v in sc]

def find_slides(f0, voiced, fps):
    """A glide: >= SLIDE_SEMI and <= SLIDE_MAXS semitones over SLIDE_MINT..SLIDE_MAXT s, voiced and continuous (no frame jumping
    more than SLIDE_MAXJ semitone — that is an octave error or a re-trigger), monotonic, and landing on a note held
    +-SLIDE_HTOL semitone for SLIDE_HOLD frames. Conservative on purpose: it is the reference `subGlide` is graded against,
    so a false slide costs more than a missed one. -> [{t0,t1,from,to,semi}]."""
    st = 12 * np.log2(np.maximum(f0, 1e-6) / 55.0); out = []; i = 0; n = len(f0)
    W, mn = int(SLIDE_MAXT * fps), int(SLIDE_MINT * fps)
    while i < n - 2:
        if not voiced[i]: i += 1; continue
        j = i; best = None
        while j + 1 < n and j - i < W and voiced[j + 1] and abs(st[j + 1] - st[j]) <= SLIDE_MAXJ:
            j += 1; d = st[j] - st[i]
            if j - i >= mn and SLIDE_SEMI <= abs(d) <= SLIDE_MAXS and (best is None or abs(d) > abs(best[1])): best = (j, d)
        if best:
            j2, d = best; a1 = min(n, j2 + SLIDE_HOLD + 1)
            if (np.all(np.diff(st[i:j2 + 1]) * np.sign(d) > -0.25) and voiced[j2:a1].all() and np.ptp(st[j2:a1]) < SLIDE_HTOL):
                out.append(dict(t0=round(i / fps, 3), t1=round(j2 / fps, 3), semi=round(float(d), 2),
                                **{'from': round(float(f0[i]), 2), 'to': round(float(f0[j2]), 2)}))
                i = j2 + 1; continue
        i += 1
    return out

# ---------------------------------------------------------------------------------------------------------------------
# THE LOUDNESS REFERENCE (--loud, 2026-09-30, docs/plans/LOUDNESS-PLAN.md phase 1). ITU-R BS.1770-4 K-weighting:
# a +4 dB high shelf, then an RLB high-pass, per channel, and a mean square:
#     L = -0.691 + 10*log10( sum_ch G_ch * mean(y_ch^2) ),  G_L = G_R = 1.0
# The spec tabulates the two biquads at 48 kHz ONLY; every other rate comes from the same bilinear recipe below
# (the shelf's analog prototype at fc 1681.974450955533 Hz / Q 0.7071752369554196 / G 3.999843853973347 dB and the
# high-pass's at fc 38.13547087602444 Hz / Q 0.5003270373238773), which reproduces the tabulated 48 kHz constants to
# 1e-12 — asserted by K48 below and by tools/test_loud.js case `coef48`. This is the measure the engine's
# assets/engine/loud.js implements causally; the two are graded against each other to 0.1 LU.
# Nothing here touches any other output of this file: --loud writes ONLY <name>.loud.json and never <name>.json.
K48 = dict(shelf=(1.53512485958697, -2.69169618940638, 1.19839281085285, -1.69065929318241, 0.73248077421585),
           hp=(1.0, -2.0, 1.0, -1.99004745483398, 0.99007225036621))
LOUD_OFS = -0.691                      # the spec's offset, so a full-scale 997 Hz stereo sine reads ~0 LKFS
MOM_W, SHORT_W = 0.4, 3.0              # the momentary and short-term windows (s)
GATE_ABS, GATE_REL = -70.0, -10.0      # the integrated measure's absolute gate (LKFS) and relative gate (LU below the ungated mean)
LOUD_HOP = 0.01                        # the hop the loud.json contours are sampled on (s): 10 ms, ~7 x the engine's frame

def kcoef(sr):
    """The two K-weighting biquads at `sr` as (b0, b1, b2, a1, a2), a0 normalised to 1."""
    import math
    G, Qs, fs_ = 3.999843853973347, 0.7071752369554196, 1681.974450955533
    K = math.tan(math.pi * fs_ / sr)
    Vh = 10 ** (G / 20.0); Vb = Vh ** 0.4996667741545416
    a0 = 1.0 + K / Qs + K * K
    shelf = ((Vh + Vb * K / Qs + K * K) / a0, 2.0 * (K * K - Vh) / a0, (Vh - Vb * K / Qs + K * K) / a0,
             2.0 * (K * K - 1.0) / a0, (1.0 - K / Qs + K * K) / a0)
    Qh, fh = 0.5003270373238773, 38.13547087602444
    K = math.tan(math.pi * fh / sr)
    a0 = 1.0 + K / Qh + K * K
    hp = (1.0, -2.0, 1.0, 2.0 * (K * K - 1.0) / a0, (1.0 - K / Qh + K * K) / a0)
    return dict(shelf=shelf, hp=hp)

def kweight(x, sr):
    """x (n, ch) -> the K-weighted signal, same shape. Zero-phase is WRONG here: the spec's filters are causal IIR."""
    from scipy.signal import lfilter
    c = kcoef(sr); y = np.asarray(x, dtype=np.float64)
    for b0, b1, b2, a1, a2 in (c['shelf'], c['hp']):
        y = lfilter([b0, b1, b2], [1.0, a1, a2], y, axis=0)
    return y

def loud_windows(x, sr, hop=LOUD_HOP):
    """-> (t, momentary, short_term, z400, blocks_t) in LKFS on a `hop` grid, plus the gated integrated loudness.
    The window sums come from a cumulative sum of the K-weighted squares, so a window is two subtractions and the
    value at t is EXACTLY the mean square over (t - W, t] — the same quantity assets/engine/loud.js keeps in its ring."""
    y = kweight(x, sr)
    p = (y * y).sum(1)                                  # sum over channels (G_L = G_R = 1)
    cs = np.concatenate(([0.0], np.cumsum(p, dtype=np.float64)))
    n = len(p); dur = n / sr
    t = np.arange(0.0, dur + 1e-9, hop)
    def win(W):
        i1 = np.clip(np.round(t * sr).astype(np.int64), 0, n)
        i0 = np.clip(i1 - int(round(W * sr)), 0, n)
        m = np.maximum(i1 - i0, 1)
        z = (cs[i1] - cs[i0]) / m
        out = np.full(len(t), -np.inf)
        ok = (z > 0) & (i1 - i0 >= int(round(W * sr)))   # only a FULL window is a reading
        out[ok] = LOUD_OFS + 10 * np.log10(z[ok])
        return out, z
    mom, _ = win(MOM_W); sh, _ = win(SHORT_W)
    # the integrated measure: 400 ms blocks, 75 % overlap, the absolute then the relative gate (BS.1770-4 3.2)
    step = int(round(0.1 * sr)); bl = int(round(MOM_W * sr))
    i0 = np.arange(0, max(1, n - bl + 1), step); i1 = i0 + bl
    zb = (cs[i1] - cs[i0]) / bl
    lb = np.where(zb > 0, LOUD_OFS + 10 * np.log10(np.maximum(zb, 1e-30)), -np.inf)
    a = lb > GATE_ABS
    integ = -np.inf
    if a.any():
        thr = LOUD_OFS + 10 * np.log10(zb[a].mean()) + GATE_REL
        g = a & (lb > thr)
        if g.any(): integ = LOUD_OFS + 10 * np.log10(zb[g].mean())
    return t, mom, sh, cs, float(integ)

def lkfs_window(cs, sr, t0, t1):
    """The window-integrated loudness of [t0, t1] (LKFS) from the cumulative square sum."""
    n = len(cs) - 1
    i0 = int(np.clip(round(t0 * sr), 0, n)); i1 = int(np.clip(round(t1 * sr), 0, n))
    if i1 <= i0: return float('-inf')
    z = (cs[i1] - cs[i0]) / (i1 - i0)
    return float(LOUD_OFS + 10 * np.log10(z)) if z > 0 else float('-inf')

def pct(v, q):
    v = v[np.isfinite(v)]
    return float(np.percentile(v, q)) if len(v) else float('nan')

def loudness(path, outdir=None, win=5.1):
    """--loud: the BS.1770 reference for one track -> <outdir>/<name>.loud.json + the section ladder on stdout.
    Reads tools/truth/<name>.json (sections, drops, beats) when it exists; NEVER writes it."""
    d48 = max(abs(a - b) for k in ('shelf', 'hp') for a, b in zip(kcoef(48000)[k], K48[k]))
    assert d48 < 1e-12, f'the bilinear recipe disagrees with the spec table at 48 kHz by {d48:.2e}'
    x, sr = sf.read(path, always_2d=True)
    if x.shape[1] == 1: x = np.repeat(x, 2, 1)
    name = os.path.splitext(os.path.basename(path))[0]
    t, mom, sh, cs, integ = loud_windows(x, sr)
    dur = x.shape[0] / sr
    tj = os.path.join(HERE, name + '.json')
    T = json.load(open(tj)) if os.path.isfile(tj) else {}
    # A track whose truth has been HAND-CORRECTED wins: `sections_hand` / `drops_user` / `drops_hand` are the
    # annotating worker's bar-snapped numbers (Vienna's at the time of writing), and grading the engine against the
    # automatic drop when the human named a different bar would grade the wrong instant. Read-only, as everything here.
    secs = T.get('sections_hand') or T.get('sections', [])
    drops = T.get('drops_user') or [d['t'] for d in T.get('drops_hand', [])] or T.get('drops', [])
    print(f"{name}: {dur:.1f} s at {sr} Hz, {x.shape[1]} ch — integrated (gated) {integ:+.2f} LKFS; "
          f"short-term p10 {pct(sh, 10):+.2f} / p50 {pct(sh, 50):+.2f} / p95 {pct(sh, 95):+.2f} LKFS "
          f"(range p95-p10 {pct(sh, 95) - pct(sh, 10):.2f} LU)")
    def slab(t0, t1):
        m = (t >= t0) & (t < t1)
        return dict(t0=round(t0, 3), t1=round(t1, 3), lkfs=round(lkfs_window(cs, sr, t0, t1), 3),
                    mom_p50=round(pct(mom[m], 50), 3), short_p50=round(pct(sh[m], 50), 3))
    if secs and 't1' not in secs[0]:                      # `sections_hand` carries t0 / label / id only
        for i, s_ in enumerate(secs):
            s_ = dict(s_); s_['t1'] = secs[i + 1]['t0'] if i + 1 < len(secs) else dur
            s_.setdefault('bars', 0); secs[i] = s_
    ladder = []
    if secs:
        print('\nthe section ladder (bar-synchronous sections of <name>.json; LKFS = the window-integrated loudness):')
        print('   t0      t1     bars id label   LKFS   mom p50  short p50')
        for s_ in secs:
            r = slab(s_['t0'], s_['t1']); r.update(id=s_['id'], label=s_['label'], bars=s_['bars']); ladder.append(r)
            print(f"  {s_['t0']:7.3f} {s_['t1']:7.3f} {s_['bars']:4d} {s_['id']:3d} {s_['label']:5d}  "
                  f"{r['lkfs']:+7.2f}  {r['mom_p50']:+7.2f}  {r['short_p50']:+7.2f}")
    pairs = []
    if drops:
        print(f"\nthe breakdown -> drop pairs ({win} s windows either side of each bar-pinned drop; "
              f"+LU = the drop is louder, which is what an AGC-normalised energy cannot say):")
        print('    drop     breakdown window      drop window        LKFS before / after   dLU   power x')
        for d in drops:
            b0, b1 = max(0.0, d - win), d
            a0, a1 = d, min(dur, d + win)
            lb = lkfs_window(cs, sr, b0, b1); la = lkfs_window(cs, sr, a0, a1)
            mb, ma = pct(mom[(t >= b0) & (t < b1)], 50), pct(mom[(t >= a0) & (t < a1)], 50)
            sb, sa = pct(sh[(t >= b0) & (t < b1)], 50), pct(sh[(t >= a0) & (t < a1)], 50)
            pairs.append(dict(drop=round(d, 3), win=win, before=dict(t0=round(b0, 3), t1=round(b1, 3), lkfs=round(lb, 3), mom_p50=round(mb, 3), short_p50=round(sb, 3)),
                              after=dict(t0=round(a0, 3), t1=round(a1, 3), lkfs=round(la, 3), mom_p50=round(ma, 3), short_p50=round(sa, 3)),
                              d_lu=round(la - lb, 3), d_lu_short=round(sa - sb, 3)))
            print(f"  {d:7.3f}  {b0:7.3f}-{b1:7.3f}  {a0:7.3f}-{a1:7.3f}   {lb:+7.2f} / {la:+7.2f}   "
                  f"{la - lb:+5.2f}  x{10 ** ((la - lb) / 10):.3f}")
    out = dict(track=name, sr=int(sr), ch=int(x.shape[1]), dur=round(dur, 3), hop=LOUD_HOP,
               spec='ITU-R BS.1770-4 K-weighting, G_L = G_R = 1, L = -0.691 + 10 log10 sum_ch mean(y^2)',
               momentary_w=MOM_W, short_w=SHORT_W, integrated=round(integ, 3),
               short=dict(p10=round(pct(sh, 10), 3), p50=round(pct(sh, 50), 3), p90=round(pct(sh, 90), 3), p95=round(pct(sh, 95), 3),
                          range=round(pct(sh, 95) - pct(sh, 10), 3)),
               mom=dict(p10=round(pct(mom, 10), 3), p50=round(pct(mom, 50), 3), p95=round(pct(mom, 95), 3)),
               sections=ladder, pairs=pairs,
               contour=dict(hop=LOUD_HOP, t0=0.0,
                            mom=[None if not np.isfinite(v) else round(float(v), 3) for v in mom],
                            short=[None if not np.isfinite(v) else round(float(v), 3) for v in sh]))
    d = outdir or HERE
    os.makedirs(d, exist_ok=True)
    jp = os.path.join(d, name + '.loud.json'); json.dump(out, open(jp, 'w'))
    print('\nloud json ->', os.path.relpath(jp), f"({os.path.getsize(jp) / 1024:.0f} KB)")
    return out

def analyse(path, brief=False, pcm=False, grains=(8, 5, 3, 2, 1, 0.569, 0.224), show=5, dumpsr=None):
    x, sr = sf.read(path, always_2d=True); mono = x.mean(1); name = os.path.splitext(os.path.basename(path))[0]
    if pcm:
        os.makedirs(os.path.join(HERE, '..', 'work'), exist_ok=True)
        out = os.path.join(HERE, '..', 'work', name + '.f32'); mono.astype(np.float32).tofile(out)
        json.dump({'sr': sr, 'n': len(mono)}, open(out + '.json', 'w')); print('pcm ->', out)
        st = x if x.shape[1] == 2 else np.repeat(x[:, :1], 2, 1); dsr = int(dumpsr or sr)
        if dsr != sr:
            from math import gcd
            g = gcd(dsr, sr); st = resample_poly(st, dsr // g, sr // g, axis=0)
            m2 = resample_poly(mono, dsr // g, sr // g)
            o2 = os.path.join(HERE, '..', 'work', f'{name}.{dsr}.f32'); m2.astype(np.float32).tofile(o2)
            json.dump({'sr': dsr, 'n': len(m2)}, open(o2 + '.json', 'w')); print('pcm ->', o2)
        sp = os.path.join(HERE, '..', 'work', name + ('' if dsr == sr else '.' + str(dsr)) + '.st.f32')
        st.astype(np.float32).ravel().tofile(sp)
        json.dump({'sr': dsr, 'n': st.shape[0], 'ch': 2}, open(sp + '.json', 'w')); print('pcm ->', sp)
    # --- STFTs by window length; a grain uses the longest window <= 40 % of itself (16384 = 0.37 s, 8192 = 0.19 s, 4096 = 0.09 s)
    cache = {}
    def spec(N):
        if N not in cache:
            f, t, Z = stft(mono, sr, nperseg=N, noverlap=N - 1024 if N > 4096 else N - 512, padded=False, boundary=None); P = np.abs(Z) ** 2
            band = lambda lo, hi: P[(f >= lo) & (f < hi)].sum(0)
            m6 = (f >= 30) & (f < 600)
            cache[N] = dict(f=f, t=t, P=P, fps=1 / (t[1] - t[0]), sub=band(25, 60), bass=band(60, 150), lm=band(150, 400), mid=band(400, 2000),
                            hi=band(2000, 12000), tot=band(25, 12000) + 1e-12, cen=(P[m6] * f[m6][:, None]).sum(0) / (P[m6].sum(0) + 1e-12),
                            harm=band(150, 600) / (band(30, 150) + 1e-12))
        return cache[N]
    def win_for(g):
        for N in (16384, 8192, 4096):
            if N / sr <= 0.4 * g: return N
        return 4096
    L6 = spec(16384); f, t, P, fps = L6['f'], L6['t'], L6['P'], L6['fps']
    sub, bass, lm, mid, hi, tot, cen, harm = (L6[k] for k in ('sub', 'bass', 'lm', 'mid', 'hi', 'tot', 'cen', 'harm'))
    # sub f0 on the 16k STFT (2.7 Hz bins, parabolic) — the 10 Hz contour and the note runs
    fr = np.where((f >= 28) & (f < 130))[0]; Lb = np.log(P[fr] + 1e-14); j = np.clip(Lb.argmax(0), 1, len(fr) - 2); c = np.arange(Lb.shape[1])
    a_, b_, c_ = Lb[j - 1, c], Lb[j, c], Lb[j + 1, c]
    f0 = f[fr[j]] + 0.5 * (a_ - c_) / (a_ - 2 * b_ + c_ + 1e-12) * (f[1] - f[0]); f0E = P[fr].max(0)
    # sub f0 in the time domain (YIN, 100 ms windows, 10 ms hop, on a 130 Hz low-pass decimated to sr/20) — the fine-grain pitch
    ytd = sosfiltfilt(butter(6, 130, btype='low', fs=sr, output='sos'), mono)[::20]; ysr = sr / 20
    W, hop, tmin, tmax = int(0.1 * ysr), int(0.01 * ysr), int(ysr / 130), int(ysr / 28) + 1
    nfr = (len(ytd) - W - tmax) // hop; idx = np.arange(nfr)[:, None] * hop + np.arange(W)[None, :]; X = ytd[idx]
    d = np.zeros((nfr, tmax + 1))
    for tau in range(1, tmax + 1): d[:, tau] = ((X - ytd[idx + tau]) ** 2).sum(1)
    cm = d[:, 1:] * np.arange(1, tmax + 1) / (np.cumsum(d[:, 1:], 1) + 1e-12); cm = np.c_[np.ones(nfr), cm]
    seg = cm[:, tmin:tmax]; below = seg < 0.15
    ti = np.where(below.any(1), below.argmax(1), seg.argmin(1)) + tmin
    while True:                                           # walk down to the local minimum after the first dip under the threshold
        nx = np.minimum(ti + 1, tmax); mv = cm[np.arange(nfr), nx] < cm[np.arange(nfr), ti]
        if not mv.any(): break
        ti = np.where(mv, nx, ti)
    r_ = np.arange(nfr)
    for _ in range(2):                                    # octave check: a period half as long that is nearly as good wins (YIN's too-low error)
        h = np.maximum(np.round(ti / 2).astype(int), 1); hb = np.minimum(np.maximum(h - 1, 1), tmax); hn = np.minimum(h + 1, tmax)
        hm = np.select([cm[r_, hb] < cm[r_, h], cm[r_, hn] < cm[r_, h]], [hb, hn], h)
        ti = np.where((hm >= tmin) & (cm[r_, hm] < 0.35), hm, ti)
    ti = np.clip(ti, 2, tmax - 1); y0, y1, y2 = cm[r_, ti - 1], cm[r_, ti], cm[r_, ti + 1]
    tau = ti + 0.5 * (y0 - y2) / (y0 - 2 * y1 + y2 + 1e-12); f0td = ysr / tau; conf = 1 - np.clip(y1, 0, 1)
    rmsl = np.sqrt((X ** 2).mean(1)); ttd = (np.arange(nfr) * hop + W / 2) / ysr
    S4 = spec(4096); share4 = np.interp(ttd, S4['t'], S4['sub'] / S4['tot'])
    voiced = (conf > 0.6) & (rmsl > 0.1 * np.percentile(rmsl, 95)) & ~((f0td < 60) & (share4 < 0.05))   # no sub-range pitch without sub energy
    # --- short STFT + HPSS for the percussion
    n2, h2 = 2048, 512
    f2, t2, Z2 = stft(mono, sr, nperseg=n2, noverlap=n2 - h2, padded=False, boundary=None); S = np.abs(Z2); fps2 = sr / h2
    Sh = median_filter(S, size=(1, 17)); Sp = median_filter(S, size=(17, 1)); Pp = S * (Sp ** 2 / (Sh ** 2 + Sp ** 2 + 1e-12))
    def onsets(lo, hi_, thr):
        L = 10 * np.log10(Pp[(f2 >= lo) & (f2 < hi_)].sum(0) + 1e-10); fl = np.maximum(np.diff(L, prepend=L[0]), 0)
        fl = fl * (L > np.percentile(L, 95) - 30)          # ignore flux more than 30 dB under the band's loud level
        pk, _ = find_peaks(fl, height=thr, distance=int(0.09 * fps2)); return t2[pk]
    low, mid_, high_ = onsets(40, 150, 5), onsets(150, 2500, 3), onsets(5000, 12000, 3)
    # a kick candidate = a low onset with a mid/high percussive onset within 15 ms (the beater click); a bare low onset may be an 808 re-trigger
    click = np.sort(np.r_[mid_, high_]); ix = np.clip(np.searchsorted(click, low), 1, max(1, len(click) - 1))
    near = np.minimum(np.abs(click[ix] - low), np.abs(click[ix - 1] - low)) if len(click) > 1 else np.full(len(low), 9.0)
    kick = low[near < 0.015]; allon = np.sort(np.r_[low, mid_, high_])
    # --- tempo from the loudest 30 s of percussive onsets
    env = np.zeros(int(t2[-1] * 100) + 1); env[(allon * 100).astype(int)] = 1; env = np.convolve(env, np.hanning(7), 'same')
    loud30 = np.array([tot[(t >= s) & (t < s + 30)].sum() for s in range(0, max(1, int(t[-1]) - 30))]); s0 = int(loud30.argmax())
    per = acpeak(env[s0 * 100:(s0 + 30) * 100], 100, 0.25, 1.0)
    loud = tot > np.percentile(tot, 50); r = lambda a, m: 100 * a[m].sum() / tot[m].sum()
    lb = loud & (f0E > np.percentile(f0E[loud], 50)); F0 = float(np.median(f0[lb]))
    held = float(np.mean(np.abs(12 * np.log2(np.maximum(f0[lb], 1) / F0)) < 0.5))
    summ = dict(track=name, seconds=round(float(t[-1]), 1), bpm=round(60 / per, 1), loudest30_from=s0,
                sub=round(r(sub, loud)), bass=round(r(bass, loud)), lm=round(r(lm, loud)), mid=round(r(mid, loud)), high=round(r(hi, loud)),
                f0=round(F0, 1), note=note(F0), held=round(held, 2), centroid=round(float(np.median(cen[loud]))), hf=round(float(np.median(harm[loud])), 2))
    print(f"\n=== {name}  {summ['seconds']} s  tempo {summ['bpm']} bpm (percussive onsets, loudest 30 s from {s0} s)")
    print(f"loud half: sub {summ['sub']}%  bass {summ['bass']}%  lm {summ['lm']}%  mid {summ['mid']}%  high {summ['high']}% | "
          f"bass f0 {F0:.1f} Hz {note(F0)} held {held:.0%} | centroid30-600 {summ['centroid']} Hz  h/f {summ['hf']}")
    if brief: return summ
    # --- the slice tables, one per grain
    gdir = os.path.join(HERE, name); os.makedirs(gdir, exist_ok=True); slices = {}; files = []
    for g in grains:
        N = win_for(g); Sg = spec(N); tg = Sg['t']; rate = g >= 1
        hdr = (f"# {name}  grain {g} s  STFT {N} ({N / sr:.3f} s window)  pitch: YIN 100 ms / 10 ms hop  onsets: {'per second' if rate else 'count in slice'}"
               f"  subwob: {'yes' if g >= 3 else '- (needs >= 3 s)'}\n"
               "   t(s)  sub bass  lm  mid high | f0Hz note held vcd | cen   h/f | subwob beats depth | low click mid high")
        lines = [hdr]; rows = []
        for s in np.arange(0, tg[-1], g):
            m = (tg >= s) & (tg < s + g)
            if m.sum() < 2: break
            rr = lambda a: 100 * Sg[a][m].sum() / Sg['tot'][m].sum()
            vm = voiced & (ttd >= s) & (ttd < s + g); vf = float(vm.sum() / max(1, ((ttd >= s) & (ttd < s + g)).sum()))
            F = float(np.median(f0td[vm])) if vm.sum() >= 3 else 0.0
            hd = float(np.mean(np.abs(12 * np.log2(f0td[vm] / F)) < 0.5)) if F else 0.0
            if g >= 3:
                wp = acpeak(Sg['sub'][m], Sg['fps'], 0.12, min(1.7, g / 2)); sv = Sg['sub'][m]
                dp = float((np.percentile(sv, 90) - np.percentile(sv, 10)) / (np.percentile(sv, 90) + 1e-12))
            else: wp, dp = 0.0, 0.0
            cnt = lambda o: float(((o >= s) & (o < s + g)).sum() / (g if rate else 1))
            row = dict(t=round(float(s), 3), sub=rr('sub'), bass=rr('bass'), lm=rr('lm'), mid=rr('mid'), high=rr('hi'), f0=round(F, 2), note=note(F),
                       held=round(hd, 2), voiced=round(vf, 2), cen=float(np.median(Sg['cen'][m])), hf=float(min(np.median(Sg['harm'][m]), 99)),
                       subwob=wp, depth=dp, low=cnt(low), click=cnt(kick), mid_on=cnt(mid_), high_on=cnt(high_))
            rows.append({k: (round(v, 3) if isinstance(v, float) else v) for k, v in row.items()})
            wob = f"{wp:.3f} {wp / per:5.2f} {dp:4.2f}" if g >= 3 else "    -     -    -"
            on = (f"{row['low']:4.1f} {row['click']:4.1f} {row['mid_on']:4.1f} {row['high_on']:4.1f}" if rate else
                  f"{row['low']:4.0f} {row['click']:4.0f} {row['mid_on']:4.0f} {row['high_on']:4.0f}")
            lines.append(f"{s:7.3f} {row['sub']:4.0f} {row['bass']:4.0f} {row['lm']:4.0f} {row['mid']:4.0f} {row['high']:4.0f} | "
                         f"{F:5.1f} {note(F):4s} {hd:3.0%} {vf:3.0%} | {row['cen']:4.0f} {row['hf']:5.2f} | {wob} | {on}")
        slices[str(g)] = rows
        fp = os.path.join(gdir, f'grain-{g}.txt'); open(fp, 'w').write('\n'.join(lines) + '\n'); files.append(os.path.relpath(fp))
        if g == show: print('\n' + '\n'.join(lines))
    print('\ngrain tables ->', ' '.join(files))
    # sub note runs at 10 Hz ('.' = sub quiet) for the whole track, run-length coded
    share = sub / tot; step = max(1, int(round(fps / 10))); runs = []; prev = None; k = 0; start = 0.0   # '.' = sub under 15 % of the energy
    for i in range(0, len(t), step):
        sym = note(f0[i]) if share[i] > 0.15 else '.'
        if sym != prev:
            if prev is not None: runs.append([round(start, 1), prev, k])
            prev, k, start = sym, 1, float(t[i])
        else: k += 1
    runs.append([round(start, 1), prev, k])
    print("\nsub note runs (start s, note, x steps of 4 hops = 0.093 s held; runs of >= 5 steps shown; '.' = sub under 15 % of the energy):")
    print('  '.join(f"{s0_}s {n_}x{k_}" for s0_, n_, k_ in runs if k_ >= 5))
    contour = dict(fps=10, t=[round(float(v), 2) for v in t[::step]], f0=[round(float(v), 2) for v in f0[::step]],
                   sub=[round(float(v / tot[i]), 3) for i, v in list(enumerate(sub))[::step]], hf=[round(float(min(v, 99)), 3) for v in harm[::step]])
    # `fps=100` is the NOMINAL rate and it is wrong: the hop is int(0.01*ysr) = 22 samples at ysr = sr/20 = 2205, so the
    # real rate is 2205/22 = 100.2273 Hz and the label drifts 358 ms by the end of a 157 s track. Reading the contour at
    # 100 Hz is what made the engine's +-30-cents ruler read 72.7 % when the pitch itself agrees to 1 cent (v0.15 pass 2,
    # docs/workers/ears.md). The v0.14 value stays for byte compatibility; `fpsExact` (and `hop` / `ysr`, so the number is
    # derivable rather than asserted) is the one to read. Frame f is centred at t0 + f/fpsExact.
    contour['f0td'] = dict(fps=100, t0=round(float(ttd[0]), 3), f0=np.round(np.where(voiced, f0td, 0), 1).tolist(), conf=np.round(conf, 2).tolist())
    contour['f0td']['fpsExact'] = round(float(ysr / hop), 6)
    contour['f0td']['hop'] = int(hop); contour['f0td']['ysr'] = float(ysr); contour['f0td']['win'] = int(W)
    out = dict(summary=summ, grains=list(grains), slices=slices, sub_runs=runs, onsets=dict(low=np.round(low, 3).tolist(), click=np.round(kick, 3).tolist(),
               mid=np.round(mid_, 3).tolist(), high=np.round(high_, 3).tolist()), contour=contour)

    # =================== v0.15 E0: the grid, the sections, the drops, the tonic, the slides, the bare 808s ===================
    # onset envelopes from the HPSS-percussive short STFT (fps2 = 86.1 at 44.1 kHz)
    dB = lambda A: 10 * np.log10(A + 1e-10)
    oenv = np.maximum(np.diff(dB(Pp.sum(0)), prepend=0), 0)
    bandenv = lambda lo_, hi_: np.maximum(np.diff(dB(Pp[(f2 >= lo_) & (f2 < hi_)].sum(0)), prepend=0), 0)
    elow, emid, ehigh = bandenv(40, 150), bandenv(150, 2500), bandenv(5000, 12000)
    per0, _, _ = tempo_peak(oenv, fps2)
    bdp = dp_beats(oenv, fps2, per0)
    pg, phg, coh = refit_grid(oenv, fps2, float(np.median(np.diff(bdp))) if len(bdp) > 4 else per0)
    nb = int((t2[-1] - phg) / pg) + 1; beats = phg + pg * np.arange(max(0, nb))
    dpres = float(np.sqrt(np.mean((bdp - beats[np.clip(np.round((bdp - phg) / pg).astype(int), 0, nb - 1)]) ** 2))) if len(bdp) > 4 else 0.0
    dpt0 = None
    if dpres > 0.06:                                       # the linear grid does not fit: the track's tempo moves, keep the DP beats
        # ... IN REAL TIME. dp_beats returns index / fps; frame i is centred at t2[i] = t0 + i / fps, and `dpres` above
        # (a frame-coordinate comparison on both sides) is unaffected by the conversion. DECISIONS §72: without it this
        # branch's grid is t0 = 1024/sr = 23.2 ms EARLY of the audio, which is exactly the +23.3 ms near-delta Malicious'
        # own onset lists read against its own beats, and the +21 ms three independent rulers measure there.
        beats = bdp + t2[0]; pg = float(np.median(np.diff(bdp))); phg = float(beats[0])
        dpt0 = dict(src='dp+t0', t0_ms=round(float(t2[0]) * 1000, 4), sr=int(sr), hop=int(h2), nperseg=int(n2))
    anc = None; anchor = {}
    if dpres <= 0.06:                                      # live step 3.1: put the linear grid on the kicks (phase, then drift)
        ka = kick if len(kick) >= 64 else low; g0 = dict(beat=round(float(pg), 6), phase=round(float(phg), 5))
        a1 = anchor_grid(ka, pg, phg, elow, fps2, t2[0])
        if a1 is not None: phg, anchor['phase'] = a1
        a2 = drift_fit(ka, pg, phg)
        if a2 is not None: pg, phg, anchor['drift'] = a2
        if anchor:
            anc = True; anchor['was'] = g0; nb = int((t2[-1] - phg) / pg) + 1; beats = phg + pg * np.arange(max(0, nb))
    dphase, dscores = downbeat_phase(beats, elow, emid, fps2)
    if anc is not None:
        lv = lambda lo_, hi_: (t2, Pp[(f2 >= lo_) & (f2 < hi_)].sum(0))
        nph, nmargin, nw, npk = downbeat_novelty(beats, [lv(25, 60), lv(40, 150), lv(150, 2500), lv(5000, 12000)])
        anchor.update(downbeat_phase=dict(pick=dphase, scores=dscores), novelty=dict(pick=nph, margin=round(nmargin, 2), weights=nw, peaks=npk))
        if nmargin >= ANCHOR_NOV_MARGIN: dphase = nph
        anchor['downbeat_from'] = 'novelty' if nmargin >= ANCHOR_NOV_MARGIN else 'downbeat_phase'
        print(f"\ngrid re-anchored on the kicks (was beat {anchor['was']['beat']:.6f} s, phase {anchor['was']['phase']:.4f} s):")
        if 'phase' in anchor:
            a_ = anchor['phase']; print(f"  phase: eighth-lattice offset {a_['offset_ms']:+.1f} ms (r {a_['r8']:.2f}), low flux on the two beat "
                                       f"lattices {a_['low_on_beat']} -> moved {a_['moved_ms']:+.1f} ms")
        if 'drift' in anchor: print(f"  drift: {anchor['drift']}")
        print(f"  -> beat {pg:.6f} s, phase {phg:.4f} s; downbeat: downbeat_phase {anchor['downbeat_phase']['pick']} {dscores}, novelty {nph} "
              f"(weights {nw}, margin {nmargin:.2f}) -> {dphase} from {anchor['downbeat_from']}")
    downbeats = beats[dphase::4]; bar = 4 * pg
    print(f"\nbeat grid: {60 / pg:.3f} bpm (beat {pg:.5f} s), phase {phg:.4f} s, coherence {coh:.3f}, "
          f"{len(beats)} beats, DP residual {dpres * 1000:.0f} ms; downbeat = beat index {dphase} mod 4 (scores {dscores}), "
          f"{len(downbeats)} bars of {bar:.4f} s\n  first downbeats: " + ' '.join(f'{v:.3f}' for v in downbeats[:6]))
    # --- beat-synchronous grains: 1 beat, 1 bar, 4 bars (fixed-time slices cut across events; these do not)
    def bsrows(edges, label):
        Sg = spec(4096 if label == 'beat' else 8192 if label == 'bar' else 16384); tg = Sg['t']; rows = []
        lines = [f"# {name}  grain {label} ({len(edges) - 1} slices, bar-synchronous on the {60 / pg:.2f} bpm grid)  STFT {len(Sg['f']) * 2 - 2}"
                 f"\n   t(s)   dur  sub bass  lm  mid high | f0Hz note held vcd | cen   h/f | low click mid high"]
        for a, b in zip(edges[:-1], edges[1:]):
            m = (tg >= a) & (tg < b)
            if m.sum() < 1: continue
            rr = lambda k: 100 * Sg[k][m].sum() / Sg['tot'][m].sum()
            vm = voiced & (ttd >= a) & (ttd < b); nn = max(1, int(((ttd >= a) & (ttd < b)).sum()))
            F = float(np.median(f0td[vm])) if vm.sum() >= 2 else 0.0
            hd = float(np.mean(np.abs(12 * np.log2(f0td[vm] / F)) < 0.5)) if F else 0.0
            cnt = lambda o: float(((o >= a) & (o < b)).sum() / (b - a))
            row = dict(t=round(float(a), 3), dur=round(float(b - a), 3), sub=round(rr('sub'), 3), bass=round(rr('bass'), 3), lm=round(rr('lm'), 3),
                       mid=round(rr('mid'), 3), high=round(rr('hi'), 3), f0=round(F, 2), note=note(F), held=round(hd, 2), voiced=round(vm.sum() / nn, 2),
                       cen=round(float(np.median(Sg['cen'][m])), 2), hf=round(float(min(np.median(Sg['harm'][m]), 99)), 3),
                       low=round(cnt(low), 2), click=round(cnt(kick), 2), mid_on=round(cnt(mid_), 2), high_on=round(cnt(high_), 2))
            rows.append(row)
            lines.append(f"{a:7.3f} {b - a:5.3f} {row['sub']:4.0f} {row['bass']:4.0f} {row['lm']:4.0f} {row['mid']:4.0f} {row['high']:4.0f} | "
                         f"{F:5.1f} {row['note']:4s} {hd:3.0%} {row['voiced']:3.0%} | {row['cen']:4.0f} {row['hf']:5.2f} | "
                         f"{row['low']:4.1f} {row['click']:4.1f} {row['mid_on']:4.1f} {row['high_on']:4.1f}")
        fp = os.path.join(gdir, f'grain-{label}.txt'); open(fp, 'w').write('\n'.join(lines) + '\n')
        return rows, os.path.relpath(fp)
    bfiles = []
    for lab, ed in (('beat', beats), ('bar', downbeats), ('4bar', downbeats[::4])):
        slices[lab], fpp = bsrows(ed, lab); bfiles.append(fpp)
    print('beat-synchronous grain tables ->', ' '.join(bfiles))
    # --- bar features -> SSM -> Foote novelty -> boundaries at bar lines -> cluster labels -> returns
    Sb = spec(8192); tb = Sb['t']
    pcs = np.array([int(round(69 + 12 * np.log2(max(v, 1e-6) / 440))) % 12 for v in f0td])
    ch12 = np.zeros((len(downbeats) - 1, 12)); feat = []
    for i, (a, b) in enumerate(zip(downbeats[:-1], downbeats[1:])):
        m = (tb >= a) & (tb < b)
        if m.sum() < 1: m = np.zeros(len(tb), bool); m[np.argmin(np.abs(tb - a))] = True
        tt = Sb['tot'][m].sum() + 1e-12
        sh = [Sb[k][m].sum() / tt for k in ('sub', 'bass', 'lm', 'mid', 'hi')]
        # a chroma the sub is part of: the 65-2100 Hz spectrum by pitch class, plus the sub's own class weighted by its share
        fm = (Sb['f'] >= 65) & (Sb['f'] < 2100); pcb = np.array([int(round(69 + 12 * np.log2(v / 440))) % 12 for v in Sb['f'][fm]])
        Pm = Sb['P'][fm][:, m].sum(1); c = np.bincount(pcb, weights=Pm, minlength=12)
        vm = voiced & (ttd >= a) & (ttd < b)
        if vm.sum(): c += np.bincount(pcs[vm], minlength=12) / max(1, vm.sum()) * c.sum() * sh[0] * 2.0
        ch12[i] = c / (c.sum() + 1e-12)
        cnt = lambda o: ((o >= a) & (o < b)).sum() / (b - a)
        feat.append(sh + [min(float(np.median(Sb['harm'][m])), 4) / 4, float(vm.sum()) / max(1, int(((ttd >= a) & (ttd < b)).sum())),
                          min(cnt(low), 12) / 12, min(cnt(kick), 6) / 6, min(cnt(mid_), 12) / 12, min(cnt(high_), 12) / 12] + list(ch12[i] * 2))
    F = np.array(feat); Fz = (F - F.mean(0)) / (F.std(0) + 1e-9)
    U = Fz / (np.linalg.norm(Fz, axis=1, keepdims=True) + 1e-12); SSM = U @ U.T
    nov = foote(SSM); thr = nov.mean() + 0.6 * nov.std()
    pk, _ = find_peaks(nov, height=thr, distance=SEC_MINBARS)
    bnd = sorted(set([0] + [int(v) for v in pk] + [len(F)]))
    segs = [(bnd[i], bnd[i + 1]) for i in range(len(bnd) - 1) if bnd[i + 1] - bnd[i] >= 1]
    SF = np.array([Fz[a:b].mean(0) for a, b in segs]); lab, retf = cluster_labels(SF)
    sections = [dict(t0=round(float(downbeats[a]), 3), t1=round(float(downbeats[min(b, len(downbeats) - 1)]), 3), id=i,
                     label=int(lab[i]), ret=int(retf[i]), bars=int(b - a)) for i, (a, b) in enumerate(segs)]
    # --- bar energy (the macro arc) and the bar-pinned drops
    lowE = np.array([Sb['sub'][(tb >= a) & (tb < b)].sum() + Sb['bass'][(tb >= a) & (tb < b)].sum() for a, b in zip(downbeats[:-1], downbeats[1:])])
    barE = np.array([Sb['tot'][(tb >= a) & (tb < b)].sum() for a, b in zip(downbeats[:-1], downbeats[1:])])
    ref = np.percentile(lowE, 90) + 1e-12; lrel = lowE / ref; erel = barE / (np.percentile(barE, 90) + 1e-12)
    drops = []; why = []; last = -99
    # "does this bar carry the BEAT": kick candidates per second. Not energy (SeeYouDrop is limited, so the walk at 13 s and
    # drop 1 have the same bar energy, 0.80 and 0.83 of the p90), not a band share, not the upper-band power — see
    # docs/workers/ears.md for the four measures that were tried and failed. The walk has NO kick and the drops have ~2/s.
    dens = np.array([((kick >= a) & (kick < b)).sum() / (b - a) for a, b in zip(downbeats[:-1], downbeats[1:])], float)
    drel = dens / (np.percentile(dens, 90) + 1e-12)
    aft = np.array([erel[i:i + 4].mean() for i in range(len(erel))])
    aftD = np.array([drel[i:i + DROP_DEN_W].mean() for i in range(len(drel))])
    bef = np.array([erel[max(0, i - 4):i].mean() if i else erel[0] for i in range(len(erel))])
    for i in range(1, len(lrel)):
        # the bars after a drop are among the track's loudest AND carry its drums
        if aft[i] < DROP_AFTER_MIN or aftD[i] < DROP_DEN_MIN or i - last < DROP_REFRACT: continue
        c1 = lrel[i] >= DROP_MIN and lrel[i - 1] < DROP_QUIET                                   # the low end returns from absence
        c2 = lrel[i] >= DROP_MIN and lrel[i - 1] < DROP_SOFT and aft[i] - bef[i] >= DROP_JUMP    # or a large sustained jump
        if c1 or c2: drops.append(float(downbeats[i])); why.append('absence' if c1 else 'jump'); last = i
    print(f"\ndrops (bar-pinned; clause 1 = low end >= {DROP_MIN} of its p90 after a bar under {DROP_QUIET}; clause 2 = a sustained "
          f"energy jump >= {DROP_JUMP} with the low end loud after and under {DROP_SOFT} before; both need the 4 bars after at "
          f"{DROP_AFTER_MIN} of the track p90 energy and {DROP_DEN_MIN} of its p90 onset density, and {DROP_REFRACT} bars since the "
          f"last drop): "
          + (' '.join(f'{v:.3f}({w})' for v, w in zip(drops, why)) or 'none'))
    print(f"  bar low-end level (share of p90) per bar, 0.5 s resolution is the bar: " +
          ' '.join(f'{downbeats[i]:.0f}:{lrel[i]:.2f}' for i in range(0, len(lrel), 8)))
    # --- the tonic, on the whole loud part, sub included
    lm_ = np.percentile(barE, 50); ch = ch12[barE > lm_].mean(0) if (barE > lm_).any() else ch12.mean(0)
    tpc, tmin_, tconf, tsc = kk_tonic(ch)
    print(f"\ntonic: {NAMES[tpc]}{' minor' if tmin_ else ' major'}  conf {tconf:.3f}  (KK on a sub-inclusive chroma over the loud half)")
    top = sorted(range(24), key=lambda i: -tsc[i])[:5]
    print('  top 5: ' + '  '.join(f"{NAMES[i % 12]}{'m' if i // 12 else 'M'} {tsc[i]:+.3f}" for i in top))
    print('  chroma: ' + ' '.join(f'{NAMES[i]}{ch[i]:.3f}' for i in range(12)))
    # --- sub slides and bare 808s
    sl = find_slides(f0td, voiced, 100.0)
    for s_ in sl: s_['t0'] = round(s_['t0'] + float(ttd[0]), 3); s_['t1'] = round(s_['t1'] + float(ttd[0]), 3)
    bare = low[~np.isin(low, kick)]
    print(f"\nsub slides (>= {SLIDE_SEMI} semitone within <= {SLIDE_MAXT} s, monotonic, voiced): {len(sl)} total, "
          f"{sum(1 for s_ in sl if 57.6 <= s_['t0'] < 90)} on 57.6-90 s")
    print('  ' + '  '.join(f"{s_['t0']:.2f}->{s_['t1']:.2f} {s_['semi']:+.1f}st" for s_ in sl[:14]) + (' ...' if len(sl) > 14 else ''))
    print(f"bare 808 note starts (a low onset with no 2-8 kHz click within {CLICK_W * 1000:.0f} ms): {len(bare)} of {len(low)} low onsets "
          f"({100 * len(bare) / max(1, len(low)):.0f} %); kick candidates {len(kick)}")
    out.update(bpm_grid=dict(bpm=round(60 / pg, 4), beat=round(pg, 6), phase=round(phg, 5), coherence=round(coh, 4),
                             dp_residual_ms=round(dpres * 1000, 1), downbeat_mod4=dphase, downbeat_scores=dscores, bar=round(bar, 6),
                             **({} if anc is None else {'anchor': anchor}), **({} if dpt0 is None else {'dp_t0': dpt0})),
               beats=np.round(beats, 4).tolist(), downbeats=np.round(downbeats, 4).tolist(),
               sections=sections, novelty=dict(bars=np.round(downbeats[:len(nov)], 3).tolist(), v=np.round(nov, 4).tolist(), thr=round(float(thr), 4)),
               drops=[round(v, 3) for v in drops], tonic=dict(pc=tpc, name=NAMES[tpc], minor=tmin_, conf=round(tconf, 4), scores=tsc),
               sub_slides=sl, bare808=np.round(bare, 3).tolist(),
               energy=dict(bars=np.round(downbeats[:len(barE)], 3).tolist(), e=np.round(barE / (np.percentile(barE, 98) + 1e-12), 4).tolist(),
                           low=np.round(lrel, 4).tolist()))
    print('\nsections (bar-synchronous, label = cluster id, ret = a return of an earlier section):')
    print('   t0      t1     bars id label ret')
    for s_ in sections: print(f"  {s_['t0']:7.3f} {s_['t1']:7.3f} {s_['bars']:4d} {s_['id']:3d} {s_['label']:5d} {s_['ret']:3d}")
    ap = os.path.join(HERE, name + '.sections.json')                 # the hand annotation, if there is one: boundary by boundary
    if os.path.isfile(ap):
        A = json.load(open(ap)); abn = [s_['t0'] for s_ in A['sections']] + [A['sections'][-1]['t1']]
        auto = np.array([s_['t0'] for s_ in sections] + [sections[-1]['t1']]); ok = 0
        print('\nannotated vs automatic boundaries (truth | auto | delta beats | nearest bar line of the grid):')
        for a_ in abn:
            j = int(np.argmin(np.abs(auto - a_))); d = (auto[j] - a_) / pg
            m = phg + bar * round((a_ - phg) / bar); dm = (m - a_) / pg; ok += abs(d) <= 1.0
            print(f"  {a_:7.2f} | {auto[j]:7.3f} | {d:+6.2f} b | bar line {m:7.3f} ({dm:+.2f} b)"
                  f"{'' if abs(d) <= 1.0 else '   MISS'}{'   (no bar line within 1 beat of the annotation)' if abs(dm) > 1.0 else ''}")
        print(f"  -> {ok} of {len(abn)} annotated boundaries within +-1 beat ({pg:.3f} s); "
              f"{sum(1 for a_ in abn if abs((phg + bar * round((a_ - phg) / bar)) - a_) / pg > 1.0)} of them have no bar line within 1 beat at all")
        import re
        def labat(tm):
            s_ = next((q for q in sections if q['t0'] <= tm < q['t1']), None); return s_['label'] if s_ else -1
        print('  returns (the annotation\'s pairs; a pair is "labelled" when both halves land in the same cluster):')
        for r_ in A.get('returns', []):
            mids = []
            for side in ('a', 'b'):
                v = [float(q) for q in re.findall(r'\d+(?:\.\d+)?', r_[side])][-2:]
                mids.append(sum(v) / 2 if len(v) == 2 else (v[0] if v else 0))
            la, lb = labat(mids[0]), labat(mids[1])
            print(f"    {r_['a']:24s} <-> {r_['b']:24s}  labels {la} / {lb}  {'OK' if la == lb and la >= 0 else 'MISS'}")
    # =========================================================================================================================
    # A HAND ANNOTATION SURVIVES A RE-RUN (DECISIONS §72; the Vienna lesson, §63 phase 1: a `--pcm` re-run destroyed a
    # worker's uncommitted hand truth). `bpm_grid.hand` and the top-level hand keys are a human's work, not the tool's:
    # they are carried over from the file on disk, never computed, and `hand.replaced` is left to say what they replaced.
    HANDK = ('sections_hand', 'drops_hand', 'drops_user', 'drops_user_note', 'drops_tool', 'drops_note',
             'provisional', 'notes', 'feel', 'hand')
    jp = os.path.join(HERE, name + '.json')
    if os.path.isfile(jp):
        old = json.load(open(jp))
        for k in HANDK:
            if k in old and k not in out: out[k] = old[k]
        if 'hand' in old.get('bpm_grid', {}) and 'hand' not in out['bpm_grid']:
            out['bpm_grid']['hand'] = old['bpm_grid']['hand']
            print('  (carried over bpm_grid.hand from the file on disk)')
    json.dump(out, open(jp, 'w')); print('\njson ->', os.path.relpath(jp))
    return summ

if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not args: sys.exit(__doc__)
    gr = next((a.split('=', 1)[1] for a in sys.argv if a.startswith('--grains=')), '8,5,3,2,1,0.569,0.224')
    grains = [float(x) if '.' in x else int(x) for x in gr.split(',')]
    ds = next((int(a.split('=', 1)[1]) for a in sys.argv if a.startswith('--sr=')), None)
    if '--loud' in sys.argv:     # the BS.1770 reference ONLY: writes <name>.loud.json, never <name>.json
        od = next((a.split('=', 1)[1] for a in sys.argv if a.startswith('--loud-out=')), None)
        lw = float(next((a.split('=', 1)[1] for a in sys.argv if a.startswith('--loud-win=')), 5.1))
        for a in args: loudness(find(a), outdir=od, win=lw)
        sys.exit(0)
    for a in args: analyse(find(a), brief='--brief' in sys.argv, pcm='--pcm' in sys.argv, grains=grains, show=5 if 5 in grains else grains[0], dumpsr=ds)
