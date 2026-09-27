#!/usr/bin/env python3
"""Offline ground truth for a real track: what the music contains, measured non-causally from the decoded file.

The realtime engine is judged against this (ENGINE-CHLADNI-SESSION-PROMPT.md). Independent of the engine on purpose:
numpy + scipy + soundfile, whole-file STFTs, no causal constraint, no AGC.

    python3 tools/truth/trackmap.py SeeYouDrop            # table to stdout, JSON to tools/truth/<name>.json
    python3 tools/truth/trackmap.py SeeYouDrop --pcm      # also dump mono float32 PCM to tools/work/<name>.f32 (node tests)
    python3 tools/truth/trackmap.py CyborgNinja Malicious --brief   # one summary line per track
    python3 tools/truth/trackmap.py SeeYouDrop --grains=8,5,3,2,1,0.569,0.224   # the default grains (s); one table per grain

Grains: every grain gets a table in tools/truth/<name>/grain-<g>.txt and a list under "slices" in the JSON (keyed by the grain);
the 5 s table also goes to stdout. A grain uses the longest STFT window <= 40 % of itself (16384 / 8192 / 4096), so a slice is not
smeared across its neighbours. The slice pitch comes from a time-domain YIN (100 ms window, 10 ms hop; `vcd` = voiced fraction of
the slice), which keeps ~0.1 s resolution where a 16k STFT (0.37 s) cannot. `subwob` needs a >= 3 s slice (its lags reach 1.7 s).
Onsets are per second for grains >= 1 s and raw counts below (0.224 s holds 0-2 events). The JSON also carries the 100 Hz YIN
contour (`contour.f0td`, 0 = unvoiced) for frame-by-frame comparison with the engine.

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
from scipy.signal import stft, find_peaks, butter, sosfiltfilt
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

def analyse(path, brief=False, pcm=False, grains=(8, 5, 3, 2, 1, 0.569, 0.224), show=5):
    x, sr = sf.read(path, always_2d=True); mono = x.mean(1); name = os.path.splitext(os.path.basename(path))[0]
    if pcm:
        os.makedirs(os.path.join(HERE, '..', 'work'), exist_ok=True)
        out = os.path.join(HERE, '..', 'work', name + '.f32'); mono.astype(np.float32).tofile(out)
        json.dump({'sr': sr, 'n': len(mono)}, open(out + '.json', 'w')); print('pcm ->', out)
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
    contour['f0td'] = dict(fps=100, t0=round(float(ttd[0]), 3), f0=np.round(np.where(voiced, f0td, 0), 1).tolist(), conf=np.round(conf, 2).tolist())
    out = dict(summary=summ, grains=list(grains), slices=slices, sub_runs=runs, onsets=dict(low=np.round(low, 3).tolist(), click=np.round(kick, 3).tolist(),
               mid=np.round(mid_, 3).tolist(), high=np.round(high_, 3).tolist()), contour=contour)
    jp = os.path.join(HERE, name + '.json'); json.dump(out, open(jp, 'w')); print('\njson ->', os.path.relpath(jp))
    return summ

if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not args: sys.exit(__doc__)
    gr = next((a.split('=', 1)[1] for a in sys.argv if a.startswith('--grains=')), '8,5,3,2,1,0.569,0.224')
    grains = [float(x) if '.' in x else int(x) for x in gr.split(',')]
    for a in args: analyse(find(a), brief='--brief' in sys.argv, pcm='--pcm' in sys.argv, grains=grains, show=5 if 5 in grains else grains[0])
