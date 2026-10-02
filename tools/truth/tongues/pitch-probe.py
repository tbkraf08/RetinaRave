#!/usr/bin/env python3
"""Arnold tongues on PITCH — the feasibility probe for docs/plans/TONGUES-PITCH-PLAN.md (2026-10-02).

The brief: the same circle map as the rhythm bank (probe.py), with Omega the frequency RATIO of two partials. A pair
of partials inside the p/q tongue phase-locks (fusion, consonance); just outside it drifts quasi-periodically
(beating). Tongue width ~ K^q is the mistuning tolerance, so consonance follows the Farey order 2:1 > 3:2 > 4:3 >
5:4 ... and equal temperament works because the ET fifth (1.4983) sits well inside the 3:2 tongue at any realistic K.

Measurement for the plan, not a build: nothing under assets/ is read. Per track:
  1. spectrum: NFFT 8192 (5.86 Hz bins, the engine's slow analyser) at HOP 2048 (42.7 ms) on the 48 kHz PCM mono
     downmix; peak-pick 60-5000 Hz exactly as features-slow.js does (local maxima, parabolic bin, the strongest 12
     above 4 % of the frame's max); the truth's 100 fps YIN sub f0 (contour.f0td) is ADDED as a precise low partial
     with the 25-120 Hz band's amplitude (a 5.86 Hz bin cannot place a 38 Hz root to a semitone; the engine's ears
     have the same YIN).
  2. the tongue table: for K on a grid and Omega on a fine grid over [0, 1), the sine circle map's p/q tongue is the
     Omega interval where a period-q orbit exists (f^q(theta) - theta - p changes sign on a theta grid) — exact, no
     rotation-number estimate; the 13 rationals with q <= 6 in [1, 2].
  3. per frame, every pair of partials (i < j): r = f_j / f_i folded into [1, 2) (octave equivalence), weight
     w = min(a_i, a_j) (Sethares' weighting, so the control and the bank share weights). At the default K0: the
     tongue holding r (lowest q on overlap), depth d = 1 - |Omega - centre| / half-width (1 centre, 0 edge), cents to
     the nearer edge (robustness), the pair's implied K = the smallest K on the grid at which r locks to any q <= 6.
       fusion      = sum w d [inside] / sum w              (lock share; 1 - fusion = harmTension, the ambiguity)
       consonance  = sum w d / q / sum w                   (depth in Farey order: octave 1, fifth 1/2, fourth 1/3, ...)
       beating     = sum w [outside] / sum w               (the share of pair energy with no tongue at K0)
       modeShade   = (M - m) / (M + m), M = w d over 5/4 and 5/3, m = w d over 6/5 and 8/5  (major +, minor -)
       pitchK      = w-weighted median of the pairs' implied K
     and the CONTROL from the same partials: Sethares roughness exactly as features-slow.js (r), plus `tension~`,
     r through the engine's rLo/rHi follower (0.002 per step toward r, floor rLo + 0.03).
  4. aggregation: per beat and per bar (median over frames), per truth section (p50), the drop lead test of probe.py
     (trailing W-beat windows ending at beats -4..-1, z against the 32 beats ending 16 beats earlier, FA = share of
     all other beats whose rolling |z| reaches the same max), the per-track CyborgNinja false-alarm rate at |z| >= 3,
     and modeShade against the truth tonic's mode (per track) and against SeeYouDrop's annotated sub walk
     C#1 A1 F#1 E1 = i VI iv III (per bar: minor-degree bars vs major-degree bars).

    python3 tools/truth/tongues/pitch-probe.py [Track ...] [--K 0.5] [--md out.md] [--et]
writes tools/work/tongues/<T>.pitch.json and prints the plan's tables. --et prints the equal-temperament table only.
"""
import json
import math
import os
import sys
from fractions import Fraction

import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
WORK = os.path.join(ROOT, 'tools', 'work')
OUT = os.path.join(WORK, 'tongues')
TRUTH = os.path.join(ROOT, 'tools', 'truth')
TRACKS = ['SeeYouDrop', 'CyborgNinja', 'WhoLikesToParty', 'Malicious', 'Vienna']

NFFT, HOP = 8192, 2048
F_LO, F_HI = 60.0, 5000.0           # features-slow.js: bLo = ceil(60/binS), bHiT = floor(5000/binS)
NPEAK, PK_MIN = 12, 0.04            # the strongest 12 partials above 4 % of the frame's max
SUB_LO, SUB_HI = 25.0, 120.0        # the band whose amplitude the YIN sub partial carries
QMAX = 6
KGRID = np.round(np.arange(0.05, 1.0001, 0.05), 2)
NOM = 6000                          # Omega grid over [0, 1): 1/6000 = 0.29 cents near 1, 0.14 near 2
NTH = 192                           # theta grid for the period-q orbit test
WARM = 8.0


def rationals():
    rs = set()
    for q in range(1, QMAX + 1):
        for p in range(q, 2 * q + 1):
            rs.add(Fraction(p, q))
    return sorted(rs)                                   # 1/1 ... 2/1, 13 of them


def tongue_table():
    """-> {K: {Fraction: (lo, hi)}} on Omega in [0, 1) (Omega = r - 1 for the folded ratio r in [1, 2))"""
    cache = os.path.join(OUT, f'pitch-tongues-q{QMAX}-n{NOM}.json')
    if os.path.exists(cache):
        raw = json.load(open(cache))
        return {float(k): {Fraction(fr): tuple(v) for fr, v in d.items()} for k, d in raw.items()}
    om = np.arange(NOM) / NOM
    th0 = (np.arange(NTH) / NTH)[None, :]
    tab = {}
    for K in KGRID:
        k2pi = K / (2 * math.pi)
        tab[float(K)] = {}
        for fr in rationals():
            p, q = fr.numerator - fr.denominator, fr.denominator          # the folded rational p'/q in [0, 1]
            if fr == 2: p, q = 1, 1
            th = np.broadcast_to(th0, (NOM, NTH)).copy()
            for _ in range(q):
                th = th + om[:, None] - k2pi * np.sin(2 * math.pi * th)
            g = th - th0 - p
            locked = (g.min(axis=1) <= 0) & (g.max(axis=1) >= 0)
            if fr == 1 or fr == 2:                       # the 0/1 tongue wraps: Omega near 0 and near 1 are the same tongue
                lo = om[locked & (om < 0.5)]; hi = om[locked & (om >= 0.5)]
                tab[float(K)][fr] = (float(lo.max()) if len(lo) else 0.0, float(hi.min()) if len(hi) else 1.0)
            else:
                idx = np.flatnonzero(locked)
                tab[float(K)][fr] = (float(om[idx[0]]), float(om[idx[-1]])) if len(idx) else (float(p / q), float(p / q))
    os.makedirs(OUT, exist_ok=True)
    json.dump({str(k): {str(fr): v for fr, v in d.items()} for k, d in tab.items()}, open(cache, 'w'))
    return tab


RATS = rationals()
RV = np.array([float(fr) for fr in RATS])                 # the centres, 1 .. 2 (Omega = RV - 1)
QV = np.array([1 if fr == 2 else fr.denominator for fr in RATS])


def halfwidths(tab):
    """-> HW (nK x nR): the p/q tongue's half-width in Omega at each K, CENTRED on p/q (the sine map's tongues are skewed
    off p/q in bare Omega — at K 0.5 the 5/4 tongue sits at 1.2592-1.2602, the ET third, by coincidence — and a
    measured pair of partials has no bare frequency: Shapira Lots & Stone 2008 order consonance by the WIDTH at p/q)"""
    HW = np.zeros((len(KGRID), len(RATS)))
    for ki, K in enumerate(KGRID):
        for ri, fr in enumerate(RATS):
            lo, hi = tab[float(K)][fr]
            HW[ki, ri] = 0.5 * (lo + (1 - hi)) if (fr == 1 or fr == 2) else 0.5 * (hi - lo)
    return HW


def et_table(tab, HW, K0):
    ki = int(np.argmin(np.abs(KGRID - K0)))
    rows = []
    names = [('octave', 2.0, Fraction(2)), ('fifth', 2 ** (7 / 12), Fraction(3, 2)), ('fourth', 2 ** (5 / 12), Fraction(4, 3)),
             ('major sixth', 2 ** (9 / 12), Fraction(5, 3)), ('major third', 2 ** (4 / 12), Fraction(5, 4)),
             ('minor sixth', 2 ** (8 / 12), Fraction(8, 5)), ('minor third', 2 ** (3 / 12), Fraction(6, 5)),
             ('minor seventh', 2 ** (10 / 12), Fraction(9, 5)), ('tritone', 2 ** (6 / 12), Fraction(7, 5)),
             ('major second', 2 ** (2 / 12), Fraction(9, 8)), ('minor second', 2 ** (1 / 12), Fraction(16, 15))]
    for name, r, just in names:
        dist = np.abs(r - RV)
        ins = dist[None, :] <= HW                              # (nK, nR)
        kmin = KGRID[int(np.argmax(ins.any(axis=1)))] if ins.any() else float('nan')
        on = np.flatnonzero(ins[ki])
        if len(on):
            j = on[np.argmin(QV[on])]; d = 1 - dist[j] / HW[ki, j]
            cell = f'{RATS[j]} / {d:.2f} / {1200 * math.log2((RV[j] + HW[ki, j]) / r) if r >= RV[j] else 1200 * math.log2(r / (RV[j] - HW[ki, j])):.0f}'
        else:
            cell = 'none'
        ri = RATS.index(just) if just in RATS else -1
        width = f'{1200 * math.log2((float(just) + HW[ki, ri]) / (float(just) - HW[ki, ri])):.0f}' if ri >= 0 else '—'
        rows.append(f'| {name} | {r:.4f} | {just} ({float(just):.4f}) | {1200 * math.log2(r / float(just)):+.1f} | {kmin:.2f} | {cell} | {width} |')
    return rows


def load_mono(track):
    p = os.path.join(WORK, f'{track}.48000.st.f32')
    meta = json.load(open(p + '.json'))
    sr, ch = int(meta['sr']), int(meta['ch'])
    x = np.fromfile(p, dtype=np.float32)
    if ch == 2:
        x = x[: (len(x) // 2) * 2].reshape(-1, 2)
        mono = (x[:, 0].astype(np.float64) + x[:, 1].astype(np.float64)) * 0.5
    else:
        mono = x.astype(np.float64)
    return mono, sr


def spectrum(mono, sr):
    """-> mag (nf x NFFT/2), t (frame END times), binS"""
    win = 0.5 - 0.5 * np.cos(2 * np.pi * np.arange(NFFT) / NFFT)
    norm = 2.0 / win.sum()
    pad = np.concatenate([np.zeros(NFFT - HOP), mono])
    nf = (len(pad) - NFFT) // HOP + 1
    idx = np.arange(NFFT)[None, :] + (np.arange(nf) * HOP)[:, None]
    spec = np.fft.rfft(pad[idx] * win[None, :], axis=1)
    mag = (np.abs(spec[:, : NFFT // 2]) * norm).astype(np.float32)
    t = (np.arange(nf) + 1) * HOP / sr
    return mag, t, sr / NFFT


def partials(mag_k, binS, sub_f0, sub_amp):
    """the engine's peak pick on one frame + the YIN sub -> list of (f, a)"""
    bLo, bHi = int(math.ceil(F_LO / binS)), int(math.floor(F_HI / binS))
    m = mag_k[bLo - 1: bHi + 2].astype(np.float64)
    c = m[1:-1]; pv = m[:-2]; nx = m[2:]
    pk = np.flatnonzero((c > pv) & (c >= nx))
    if len(pk) == 0 and sub_f0 <= 0: return []
    vals = c[pk]
    order = np.argsort(-vals)[:NPEAK]
    mx = vals[order[0]] if len(order) else 0.0
    P = []
    for i in order:
        if vals[i] < PK_MIN * mx: break
        b = pk[i]; den = pv[b] - 2 * c[b] + nx[b]
        off = 0.5 * (pv[b] - nx[b]) / den if abs(den) > 1e-12 else 0.0
        P.append(((bLo + b + off) * binS, float(vals[i])))
    if sub_f0 > 0 and sub_amp > 0:
        P = [(f, a) for (f, a) in P if f > SUB_HI or abs(1200 * math.log2(f / sub_f0)) > 100]   # the FFT's own smeared sub goes
        P.append((sub_f0, sub_amp))
    return P


def sethares(P, mx):
    """features-slow.js: pairs of the strongest partials above 4 % of the max, min-amplitude weighted"""
    R = 0.0; W = 0.0
    n = len(P)
    for i in range(n):
        if P[i][1] < PK_MIN * mx: continue
        for j in range(i + 1, n):
            if P[j][1] < PK_MIN * mx: continue
            f1 = min(P[i][0], P[j][0]); df = abs(P[i][0] - P[j][0])
            sx = 0.24 / (0.0207 * f1 + 18.96) * df; a = min(P[i][1], P[j][1])
            R += a * (math.exp(-3.51 * sx) - math.exp(-5.75 * sx)); W += a
    return R / W if W > 0 else 0.0


MAJ = np.array([fr in (Fraction(5, 4), Fraction(5, 3)) for fr in RATS])
MIN = np.array([fr in (Fraction(6, 5), Fraction(8, 5)) for fr in RATS])
EMPTY = dict(fusion=np.nan, cons=np.nan, beating=np.nan, unison=np.nan, mode=np.nan, pitchK=np.nan, edge=np.nan, rough=np.nan, nP=0)


def frame_measures(P, HW, ki):
    """-> the per-frame fields at K index ki (NaN where there is no pair). Vectorised over the frame's pairs."""
    P = sorted(P)
    n = len(P)
    if n < 2: return dict(EMPTY, nP=n)
    f = np.array([x[0] for x in P]); amp = np.array([x[1] for x in P])
    iu, ju = np.triu_indices(n, 1)
    r = f[ju] / f[iu]; w = np.minimum(amp[iu], amp[ju])
    # the UNISON class: an unfolded ratio inside the 1/1 tongue — within K/2pi of equal — is Plomp-Levelt's roughness
    # band (132 cents wide at K 0.5), where the circle map says "fused" and the ear says "rough"; kept apart
    uni = r <= 1 + HW[ki, 0]
    rf = r / 2 ** np.floor(np.log2(r))                    # the fold into [1, 2)
    dist = np.abs(rf[:, None] - RV[None, :])              # (pairs, rationals)
    dist[:, -1] = np.minimum(np.abs(rf - 2.0), rf - 1.0)  # the octave class: a fold landing just above 1 is the same tongue as one just below 2
    ins = dist <= HW[ki][None, :]
    ins[:, 0] = False                                     # the 1/1 column is the unison class (above), never a tongue here
    ins[uni] = False
    # the winner per pair: the lowest q among the tongues holding it
    qv = np.where(ins, QV[None, :], 99)
    j = np.argmin(qv, axis=1); inside = qv[np.arange(len(r)), j] < 99
    hw = HW[ki][j]; d = np.where(inside, 1 - dist[np.arange(len(r)), j] / np.maximum(hw, 1e-12), 0.0)
    d = np.clip(d, 0, 1)
    cents = np.where(inside, 1200 * np.log2((RV[j] + hw) / np.maximum(RV[j] - hw, 1e-9)) * 0.5 * d, 0.0)   # distance to the edge in cents ~ depth x half-width
    # the implied K per pair: the smallest K on the grid whose tongues (q <= QMAX, not the unison class) hold it
    insK = (dist[None, :, :] <= HW[:, None, :])          # (K, pairs, rationals)
    insK[:, :, 0] = False
    anyK = insK.any(axis=2)                               # (K, pairs)
    kmin = np.where(anyK.any(axis=0), KGRID[np.argmax(anyK, axis=0)], 1.0)
    kmin[uni] = KGRID[0]
    W = w.sum()
    if W <= 0: return dict(EMPTY, nP=n)
    wn = w[~uni]; dn = d[~uni]; jn = j[~uni]; inn = inside[~uni]
    Wn = wn.sum()
    fus = float((wn * dn).sum() / Wn) if Wn > 0 else np.nan
    cons = float((wn * dn / QV[jn]).sum() / Wn) if Wn > 0 else np.nan
    beat = float(wn[~inn].sum() / Wn) if Wn > 0 else np.nan
    M = float((wn * dn * MAJ[jn]).sum()); m_ = float((wn * dn * MIN[jn]).sum())
    o = np.argsort(kmin); cw = np.cumsum(w[o]); kmed = float(kmin[o][min(len(o) - 1, int(np.searchsorted(cw, 0.5 * cw[-1])))])
    edge = float((wn * cents[~uni]).sum() / max((wn * inn).sum(), 1e-12))
    return dict(fusion=fus, cons=cons, beating=beat, unison=float(w[uni].sum() / W), mode=(M - m_) / (M + m_) if M + m_ > 1e-12 else 0.0,
                pitchK=kmed, edge=edge, rough=sethares(P, amp.max()), nP=n)


def idx_at(t_hop, t):
    return int(np.searchsorted(t_hop, t, side='right')) - 1


def main(argv):
    a = list(argv)
    def opt(k, dflt):
        if k in a:
            i = a.index(k); v = a[i + 1]; del a[i:i + 2]; return v
        return dflt
    K0 = float(opt('--K', '0.5')); MD = opt('--md', None)
    et_only = '--et' in a
    if et_only: a.remove('--et')
    tracks = a or TRACKS
    tab = tongue_table(); HW = halfwidths(tab); ki = int(np.argmin(np.abs(KGRID - K0)))
    lines = []
    def say(s=''):
        print(s); lines.append(s)
    say(f'# pitch tongues probe — K0 {K0}, q <= {QMAX}, NFFT {NFFT} hop {HOP}, {len(KGRID)} K steps, Omega grid 1/{NOM}')
    say()
    say('## the tongue table at K0 (cents of width, the mistuning tolerance) and the ET intervals')
    say('| K | ' + ' | '.join(str(fr) for fr in RATS) + ' |')
    say('|---|' + '---|' * len(RATS))
    for K in (0.25, 0.5, 0.8, 1.0):
        kj = int(np.argmin(np.abs(KGRID - K)))
        say(f'| {K} | ' + ' | '.join(f'{1200 * math.log2((RV[i] + HW[kj, i]) / (RV[i] - HW[kj, i])):.0f}' for i in range(len(RATS))) + ' |')
    say()
    say('| ET interval | ratio | nearest just | off ¢ | K_min to lock | at K 0.5: tongue / depth / ¢ to edge | tongue width ¢ at K 0.5 |')
    say('|---|---|---|---|---|---|---|')
    for r in et_table(tab, HW, K0): say(r)
    if et_only:
        if MD: open(MD, 'w').write('\n'.join(lines) + '\n')
        return
    FIELDS = ['cons', 'fusion', 'beating', 'unison', 'mode', 'pitchK', 'edge', 'rough', 'tension']
    for tr in tracks:
        truth = json.load(open(os.path.join(TRUTH, f'{tr}.json')))
        g = truth['bpm_grid']; f_beat = g['bpm'] / 60; beats = np.array(truth['beats']); downs = np.array(truth['downbeats'])
        drops = truth.get('drops_user', truth.get('drops', []))
        secs = truth['sections']
        mono, sr = load_mono(tr)
        mag, t_hop, binS = spectrum(mono, sr)
        # the truth's 100 fps YIN sub f0, sampled at each frame's end
        td = truth['contour']['f0td']; f0 = np.array(td['f0'], dtype=float); fps = float(td.get('fpsExact', td['fps'])); t0 = float(td['t0'])
        bS0, bS1 = int(math.ceil(SUB_LO / binS)), int(math.floor(SUB_HI / binS))
        nf = len(t_hop)
        per = {k: np.full(nf, np.nan) for k in FIELDS}; nP = np.zeros(nf, int)
        rLo, rHi = 0.02, 0.12
        for k in range(nf):
            j = int(round((t_hop[k] - 0.5 * NFFT / sr - t0) * fps))
            sf = f0[j] if 0 <= j < len(f0) else 0.0
            sa = float(mag[k, bS0: bS1 + 1].max()) if sf > 0 else 0.0
            P = partials(mag[k], binS, sf, sa)
            m = frame_measures(P, HW, ki)
            for key in ('cons', 'fusion', 'beating', 'unison', 'mode', 'pitchK', 'edge', 'rough'): per[key][k] = m[key]
            nP[k] = m['nP']
            r = m['rough'] if np.isfinite(m['rough']) else 0.0
            rLo = min(rLo + (r - rLo) * 0.002 + 1e-5, r); rHi = max(rHi - (rHi - r) * 0.002, r, rLo + 0.03)
            per['tension'][k] = min(1.0, max(0.0, (r - rLo) / (rHi - rLo)))
        # ---- per beat (median over the beat's frames)
        def agg(tA, tB):
            kA, kB = idx_at(t_hop, tA), idx_at(t_hop, tB)
            if kB <= kA: kB = kA + 1
            return {key: float(np.nanmedian(per[key][kA + 1: kB + 1])) if np.isfinite(per[key][kA + 1: kB + 1]).any() else np.nan for key in FIELDS}
        beat_rows = [agg(b, beats[i + 1]) for i, b in enumerate(beats[:-1])]
        bar_rows = [agg(b, downs[i + 1]) for i, b in enumerate(downs[:-1])]
        say()
        say(f'## {tr} — {g["bpm"]:.2f} BPM, {nf} frames, partials/frame p50 {np.median(nP):.0f}, drops {drops}, truth tonic {truth["tonic"]["name"]}{"m" if truth["tonic"]["minor"] else "M"} (conf {truth["tonic"]["conf"]:.3f})')
        say('| section | t0–t1 | bars | drop? | cons p50 | fusion | beating | unison | harmTension | modeShade | pitchK | ¢ to edge | rough (Sethares) | tension~ |')
        say('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|')
        sec_rows = []
        for s in secs:
            tA, tB = max(s['t0'], WARM), s['t1']
            if tB - tA < 1.0: continue
            kA, kB = idx_at(t_hop, tA), idx_at(t_hop, tB)
            v = {key: float(np.nanmedian(per[key][kA + 1: kB + 1])) for key in FIELDS}
            isdrop = any(abs(d - s['t0']) < 0.6 for d in drops)
            sec_rows.append(dict(id=s['id'], label=s['label'], t0=s['t0'], t1=s['t1'], drop=isdrop, **v))
            say(f'| {s["id"]} (label {s["label"]}{" ret" if s.get("ret") else ""}) | {s["t0"]:.1f}–{s["t1"]:.1f} | {s["bars"]} | {"DROP" if isdrop else ""} | '
                f'{v["cons"]:.3f} | {v["fusion"]:.3f} | {v["beating"]:.3f} | {v["unison"]:.3f} | {1 - v["fusion"]:.3f} | {v["mode"]:+.3f} | {v["pitchK"]:.2f} | {v["edge"]:.0f} | {v["rough"]:.4f} | {v["tension"]:.3f} |')
        # whole-track
        kW = idx_at(t_hop, WARM)
        whole = {key: float(np.nanmedian(per[key][kW:])) for key in FIELDS}
        say(f'whole track from {WARM:.0f} s: cons {whole["cons"]:.3f} · fusion {whole["fusion"]:.3f} · beating {whole["beating"]:.3f} · unison {whole["unison"]:.3f} · modeShade {whole["mode"]:+.3f} '
            f'(p10 {np.nanpercentile(per["mode"][kW:], 10):+.2f}, p90 {np.nanpercentile(per["mode"][kW:], 90):+.2f}) · pitchK {whole["pitchK"]:.2f} · rough {whole["rough"]:.4f} · tension~ {whole["tension"]:.3f}')
        # modeShade per bar: share of bars leaning major / minor
        mb = np.array([r['mode'] for r in bar_rows]); mb = mb[np.isfinite(mb)]
        say(f'modeShade per bar: {np.mean(mb > 0.1) * 100:.0f} % major (> +0.1), {np.mean(mb < -0.1) * 100:.0f} % minor (< −0.1), {np.mean(np.abs(mb) <= 0.1) * 100:.0f} % neither; truth mode {"minor" if truth["tonic"]["minor"] else "major"}')
        # correlation between the bank and the control, per beat
        cb = np.array([[r['cons'], r['fusion'], r['rough'], r['tension'], r['beating']] for r in beat_rows], dtype=float)
        ok = np.isfinite(cb).all(axis=1)
        if ok.sum() > 10:
            c = np.corrcoef(cb[ok].T)
            say(f'per-beat correlation: cons~rough {c[0, 2]:+.2f} · fusion~rough {c[1, 2]:+.2f} · beating~rough {c[4, 2]:+.2f} · cons~tension~ {c[0, 3]:+.2f}')
        # ---- SeeYouDrop's annotated walk: C#1 A1 F#1 E1 = i VI iv III
        if tr == 'SeeYouDrop':
            runs = truth['sub_runs']
            def sub_at(tA, tB):
                best = None; bn = 0
                for (t, note, n) in runs:
                    if t >= tA and t < tB and note != '.' and n > bn: best, bn = note, n
                return best
            grp = {'minor-degree (C#, F#)': [], 'major-degree (A, E)': []}
            for i, b in enumerate(downs[:-1]):
                if not ((12.8 <= b < 25.6) or (131.2 <= b < 156.0)): continue
                nt = sub_at(b, downs[i + 1]); m = bar_rows[i]['mode']
                if nt is None or not np.isfinite(m): continue
                pc = nt.rstrip('0123456789-')
                if pc in ('C#', 'F#'): grp['minor-degree (C#, F#)'].append(m)
                elif pc in ('A', 'E'): grp['major-degree (A, E)'].append(m)
            say('the sub walk (bars 12.8–25.6 and 131–156 s, i VI iv III): ' + ' · '.join(f'{k}: modeShade mean {np.mean(v):+.3f} p50 {np.median(v):+.3f} over {len(v)} bars' for k, v in grp.items() if v))
        # ---- the drop lead test (probe.py's method) on the per-beat series
        say()
        say(f'### drop lead test ({tr}): trailing W-beat windows ending at beats −4..−1; z against the 32 beats ending 16 beats earlier; FA % = share of other beats (> 16 beats from any drop) whose |z| reaches the same max; CN3 = share of beats with |z| >= 3')
        say('| drop | W | field | z at −4 −3 −2 −1 | max abs z | FA % | values at −4..−1 |')
        say('|---|---|---|---|---|---|---|')
        lead = {}; fa3 = {}
        tb = beats[:-1]
        for key in ('cons', 'fusion', 'beating', 'mode', 'pitchK', 'rough', 'tension'):
            series = np.array([r[key] for r in beat_rows], dtype=float)
            for W in (16, 8, 4, 2):
                v = np.array([np.nanmean(series[max(0, i - W + 1): i + 1]) if tb[i] - W / f_beat >= WARM else np.nan for i in range(len(tb))])
                zs = np.full(len(v), np.nan)
                for i in range(48, len(v)):
                    base = v[i - 48: i - 16]; sd = np.nanstd(base)
                    zs[i] = (v[i] - np.nanmean(base)) / sd if sd > 1e-9 else 0.0
                far = np.ones(len(tb), bool)
                for d2 in drops: far &= np.abs(tb - d2) > 16 / f_beat
                fa3[(key, W)] = float(np.nanmean(np.abs(zs[far]) >= 3) * 100) if np.isfinite(zs[far]).any() else float('nan')
                for dr in drops:
                    pre = (tb < dr) & (tb >= dr - 4.5 / f_beat)
                    if not pre.any(): continue
                    zz = zs[pre]
                    if not np.isfinite(zz).any(): continue
                    mz = float(np.nanmax(np.abs(zz)))
                    fa = float(np.nanmean(np.abs(zs[far]) >= max(mz, 1e-9)) * 100)
                    lead.setdefault(f'{dr}', []).append((W, key, [round(float(x), 2) for x in zz], round(fa, 1), [round(float(x), 3) for x in v[pre]], mz))
        for dr, items in lead.items():
            items.sort(key=lambda it: (it[3], -it[5]))
            for (W, key, zz, fa, vv, mz) in items[:6]:
                say(f'| {float(dr):.3f} | {W} | {key} | {" ".join(f"{x:+.1f}" for x in zz)} | {mz:.1f} | {fa:.1f} | {" ".join(f"{x:.3f}" for x in vv)} |')
        # ---- the lead ladder: W = 4, |z| >= 3 — how many consecutive beats before the drop the field is already out (beats
        #      of causal lead), and the share of far beats at |z| >= 3 / 5 / 8 (CyborgNinja's row is the false-arm control)
        say()
        say(f'### lead ladder ({tr}), W 4: lead = consecutive beats ending at −1 with |z| >= 3 (max 32); FA3/5/8 = share of beats > 16 from any drop with |z| >= 3 / 5 / 8; the 4 bars before → the 4 bars after, p50')
        say('| field | ' + ' | '.join(f'lead @ {float(d):.1f}' for d in drops) + ' | FA3 / FA5 / FA8 % | ' + ' | '.join(f'before → after @ {float(d):.1f}' for d in drops) + ' |')
        say('|---|' + '---|' * (2 * len(drops) + 1))
        for key in ('cons', 'fusion', 'beating', 'pitchK', 'rough', 'tension'):
            series = np.array([r[key] for r in beat_rows], dtype=float)
            W = 4
            v = np.array([np.nanmean(series[max(0, i - W + 1): i + 1]) if tb[i] - W / f_beat >= WARM else np.nan for i in range(len(tb))])
            zs = np.full(len(v), np.nan)
            for i in range(48, len(v)):
                base = v[i - 48: i - 16]; sd = np.nanstd(base)
                zs[i] = (v[i] - np.nanmean(base)) / sd if sd > 1e-9 else 0.0
            far = np.ones(len(tb), bool)
            for d2 in drops: far &= np.abs(tb - d2) > 16 / f_beat
            fa = [float(np.nanmean(np.abs(zs[far]) >= th) * 100) for th in (3, 5, 8)]
            leads = []; ba = []
            for dr in drops:
                i1 = int(np.searchsorted(tb, dr)) - 1          # the last beat before the drop
                n = 0
                while i1 - n >= 0 and n < 32 and np.isfinite(zs[i1 - n]) and abs(zs[i1 - n]) >= 3: n += 1
                sign = '+' if n and zs[i1] > 0 else ('−' if n else '')
                leads.append(f'{n}{sign}')
                kb, ka = (tb >= dr - 16 / f_beat) & (tb < dr), (tb >= dr) & (tb < dr + 16 / f_beat)
                ba.append(f'{np.nanmedian(series[kb]):.3f} → {np.nanmedian(series[ka]):.3f}')
            say(f'| {key} | ' + ' | '.join(leads) + f' | {fa[0]:.1f} / {fa[1]:.1f} / {fa[2]:.1f} | ' + ' | '.join(ba) + ' |')
        say('false-alarm share at |z| >= 3 (beats > 16 from any drop), W 16 / 8 / 4: ' + ' · '.join(
            f'{key} {fa3[(key, 16)]:.1f} / {fa3[(key, 8)]:.1f} / {fa3[(key, 4)]:.1f} %' for key in ('cons', 'fusion', 'beating', 'mode', 'rough', 'tension')))
        json.dump(dict(track=tr, K0=K0, bpm=g['bpm'], sections=sec_rows, whole=whole, beats=[dict(t=float(b), **r) for b, r in zip(tb, beat_rows)],
                       fa3={f'{k}:{w}': v for (k, w), v in fa3.items()}), open(os.path.join(OUT, f'{tr}.pitch.json'), 'w'))
    if MD:
        open(MD, 'w').write('\n'.join(lines) + '\n')


if __name__ == '__main__':
    main(sys.argv[1:])
