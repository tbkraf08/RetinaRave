# v85 — what did the user hear in Vienna-bar-line-only.wav (60-112 s)?  "in the beginning the grid is off, feels too
# slow. I think it ends up catching up near the end."  H1 local drift (per-beat residual vs time), H2 the bar line
# (bar fold + small-kernel novelty in the dream), H3 the render (WAV vs PCM alignment, click placement).
#   python3 tools/truth/v85-resid.py        -> tools/work/v85/vienna-resid.png + vienna-resid.json
import json, os, sys, wave, numpy as np
from scipy.signal import butter, filtfilt, find_peaks, stft
from scipy.ndimage import gaussian_filter1d
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'); ROOT = os.path.abspath(ROOT)
T = 'Vienna'; A, Bw = 55.0, 115.0
d = json.load(open(f'{ROOT}/tools/truth/{T}.json')); B = np.array(d['beats'], float); DB = np.array(d['downbeats'], float)
P = float(np.median(np.diff(B))); dbi = np.searchsorted(B, DB - 1e-4)
m = json.load(open(f'{ROOT}/tools/work/{T}.f32.json')); SR = m['sr']
x = np.fromfile(f'{ROOT}/tools/work/{T}.f32', dtype=np.float32).astype(np.float64)
out = {}
# ---------------- H1: per-beat residual, zero-phase band envelope, 20 % crossing (the §72 / v83-hand method) --------
LANE = {'low': (40, 150), 'mid': (150, 800), 'high': (5000, 12000), 'all': (40, 12000)}
def zenv(a_, b_):
    bb, aa = butter(2, [a_ / (SR / 2), b_ / (SR / 2)], btype='band'); y = filtfilt(bb, aa, x)
    b2, a2 = butter(2, 30 / (SR / 2)); return filtfilt(b2, a2, np.abs(y))
W = 0.150
def resid(E, t):
    i0, i1 = int((t - W) * SR), int((t + W) * SR); seg = E[i0:i1]; p = int(seg.argmax())
    flo = seg[:max(1, p)].min() if p else seg[0]; snr = seg[p] / (flo + 1e-12)
    lev = flo + 0.2 * (seg[p] - flo); k = p
    while k > 0 and seg[k] > lev: k -= 1
    f = (lev - seg[k]) / (seg[k + 1] - seg[k]) if k + 1 <= p and seg[k + 1] > seg[k] else 0.0
    return ((i0 + k + f) / SR - t) * 1e3, ((i0 + p) / SR - t) * 1e3, float(snr)
sel = B[(B >= A) & (B <= Bw)]
H1 = {}
for lane, (lo, hi) in LANE.items():
    E = zenv(lo, hi); rows = []
    for t in sel:
        r20, rpk, snr = resid(E, t); rows.append((float(t), r20, rpk, snr))
    H1[lane] = rows
out['H1'] = H1
def summarise(rows, snr_min=3.0):
    t = np.array([r[0] for r in rows]); r = np.array([r[1] for r in rows]); s = np.array([r[3] for r in rows]); ok = s >= snr_min
    return t[ok], r[ok]
print(f"H1  residual = attack(20 % crossing) - grid beat, ms; NEGATIVE = music BEFORE the click = grid LATE = 'too slow'. snr>=3 only")
print(f"{'lane':5} {'n':>3} {'60-85 med':>10} {'85-112 med':>11} {'fit60-85 ms@60..85':>22} {'slope ms/s':>11}  per-10s medians 55..115")
for lane in LANE:
    t, r = summarise(H1[lane])
    a = (t < 85.3); b = (t >= 85.3)
    pa = np.polyfit(t[a], r[a], 1) if a.sum() > 3 else (np.nan, np.nan)
    tens = [(s, float(np.median(r[(t >= s) & (t < s + 10)])) if ((t >= s) & (t < s + 10)).sum() >= 3 else None) for s in range(55, 115, 10)]
    print(f"{lane:5} {len(t):>3} {np.median(r[a]) if a.any() else np.nan:>+10.1f} {np.median(r[b]) if b.any() else np.nan:>+11.1f} "
          f"{np.polyval(pa, 60):>+8.1f} .. {np.polyval(pa, 85):>+8.1f}   {pa[0]:>+9.3f}   " + ' '.join(f"{s}:{'  -' if v is None else f'{v:+.0f}'}" for s, v in tens))
    out[f'H1_{lane}_tens'] = tens
# a grid-free onset list (spectral flux, 20 ms hop) folded on the grid, 180 lattice included
NFFT, HOP = 2048, 441
f, tt, Z = stft(x, fs=SR, nperseg=NFFT, noverlap=NFFT - HOP, boundary=None, padded=False); Am = np.abs(Z)
tt = tt + 0  # scipy stft t is the frame CENTRE already for boundary=None? -> it is nperseg/2 offset included
def flux(lo, hi):
    S = np.log1p(100 * Am[(f >= lo) & (f < hi)]); fl = np.maximum(0, np.diff(S, axis=1)).sum(0); fl = np.concatenate([[0], fl])
    fl = fl - gaussian_filter1d(fl, 25); return fl / (fl.max() + 1e-9)
print("\nH1b grid-free spectral-flux onsets folded on the 90 grid (nearest beat, |off|<=0.25 P), per 10 s, median ms (n)")
for lane, (lo, hi) in (('low', (40, 150)), ('mid', (150, 2500)), ('high', (5000, 12000))):
    fl = flux(lo, hi); pk, pr = find_peaks(fl, height=0.12, distance=int(0.08 * SR / HOP)); tp = tt[pk]
    tp = tp[(tp >= A) & (tp <= Bw)]
    i = np.clip(np.searchsorted(B, tp), 1, len(B) - 1); d0 = tp - B[i - 1]; d1 = tp - B[i]; o = np.where(np.abs(d0) < np.abs(d1), d0, d1)
    half = np.abs(np.abs(o) - P / 2) < 0.08 * P
    on = np.abs(o) <= 0.12 * P
    row = []
    for s in range(55, 115, 10):
        mm = on & (tp >= s) & (tp < s + 10); row.append(f"{s}:{np.median(o[mm]) * 1e3:+.0f}({mm.sum()})" if mm.sum() >= 2 else f"{s}:  -")
    print(f"  {lane:5} {' '.join(row)}   half-beat onsets {half.sum()} vs on-beat {on.sum()} (of {len(tp)})")
# ---------------- H2: the bar line in the dream (60-85) ----------------
print("\nH2  bar fold 60-85 s (the dream) and 85-112 s: band energy RISE per beat-of-bar (1 = the grid's downbeat), mean over bars")
def band_env(lo, hi):
    bb, aa = butter(2, [lo / (SR / 2), hi / (SR / 2)], btype='band'); y = filtfilt(bb, aa, x); b2, a2 = butter(2, 20 / (SR / 2)); return filtfilt(b2, a2, y * y)
envs = {k: band_env(*v) for k, v in (('low', (40, 150)), ('mid', (150, 800)), ('himid', (800, 5000)), ('high', (5000, 12000)))}
def fold(t0, t1, every=4, off=0):
    res = {}
    for lane, E in envs.items():
        acc = np.zeros(every); accR = np.zeros(every); n = 0
        for j, bi in enumerate(dbi):
            if not (t0 <= B[bi] < t1): continue
            for q in range(every):
                k = bi + q + off
                if k + 1 >= len(B): continue
                a0, a1 = int(B[k] * SR), int(B[k + 1] * SR); pre = E[int(B[k] * SR - 0.08 * SR):a0].mean() + 1e-12
                seg = E[a0:a1]; acc[q] += seg.mean(); accR[q] += seg[:int(0.12 * SR)].max() / pre
            n += 1
        res[lane] = (acc / max(n, 1), accR / max(n, 1), n)
    return res
for (t0, t1) in ((60, 85.3), (85.3, 112)):
    r = fold(t0, t1)
    print(f"  {t0}-{t1}: {r['low'][2]} bars")
    for lane in envs:
        e, rr, n = r[lane]; e = e / e.max()
        print(f"    {lane:6} energy 1..4 {' '.join(f'{v:.2f}' for v in e)}   rise 1..4 {' '.join(f'{v:5.1f}' for v in rr)}   argmax energy beat {int(e.argmax()) + 1}, rise beat {int(rr.argmax()) + 1}")
# the 8-beat (2-bar) fold: is the phrase a 2-bar unit with the accent on bar A or bar B?
r8 = fold(60, 85.3, every=8)
print("  2-bar fold 60-85 (beats 1..8 of a 2-bar pair starting on an EVEN bar index):")
for lane in envs:
    e, rr, n = r8[lane]; e = e / e.max(); print(f"    {lane:6} energy {' '.join(f'{v:.2f}' for v in e)}   rise {' '.join(f'{v:4.1f}' for v in rr)}")
# small-kernel novelty, the mid band only, in the dream: where are the chord/phrase changes?
print("\nH2b Foote novelty (12 log bands, 25-12k) with 1-bar and 2-bar kernels, peaks inside 58-112 -> beat-of-bar and offset to nearest beat")
NF2, HP2 = 4096, 1024
f2, t2, Z2 = stft(x, fs=SR, nperseg=NF2, noverlap=NF2 - HP2, boundary=None, padded=False); A2 = np.abs(Z2)
edges = np.geomspace(25, 12000, 13); Bm = np.array([A2[(f2 >= edges[i]) & (f2 < edges[i + 1])].sum(0) for i in range(12)])
Bm = np.log1p(Bm / (Bm.sum(0) + 1e-9) * 100); Bm = Bm / (np.linalg.norm(Bm, axis=0) + 1e-9); fps = SR / HP2
i0, i1 = int(50 * fps), int(118 * fps); Bs = Bm[:, i0:i1]; S = Bs.T @ Bs; tbase = t2[i0:i1]
H2b = {}
for bars in (1, 2):
    L = int(round(bars * 4 * P * fps)); K = np.ones((2 * L, 2 * L)); K[:L, L:] = -1; K[L:, :L] = -1
    nv = np.zeros(S.shape[0])
    for i in range(L, S.shape[0] - L): nv[i] = (S[i - L:i + L, i - L:i + L] * K).sum()
    nv = gaussian_filter1d(np.maximum(0, nv), 1.0); nv /= nv.max() + 1e-9
    pk, _ = find_peaks(nv, height=0.2, distance=int(1.0 * fps)); tp = tbase[pk]; tp = tp[(tp >= 58) & (tp <= 112)]
    i = np.clip(np.searchsorted(B, tp), 1, len(B) - 1); d0 = tp - B[i - 1]; d1 = tp - B[i]
    k = np.where(np.abs(d0) < np.abs(d1), i - 1, i); o = (tp - B[k]) * 1e3
    j = np.searchsorted(dbi, k, side='right') - 1; ph = (k - dbi[np.clip(j, 0, len(dbi) - 1)]) % 4
    print(f"  kernel {bars} bar: " + ' '.join(f'{v:.2f}[{p + 1}{"" if abs(oo) < 0.25 * P * 1e3 else "?"}]' for v, p, oo in zip(tp, ph, o)) + f"   counts 1..4 {np.bincount(ph, minlength=4).tolist()}")
    H2b[bars] = [(float(v), int(p) + 1, float(oo)) for v, p, oo in zip(tp, ph, o)]
out['H2b'] = H2b
# ---------------- H3: the render ----------------
print("\nH3  the WAV vs the PCM")
w = wave.open(os.path.expanduser('~/Music/RetinaRave-clicks/Vienna-bar-line-only.wav')); SRW = w.getframerate()
y = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').reshape(-1, 2).astype(np.float64) / 32767; w.close()
pcm = np.fromfile(f'{ROOT}/tools/work/{T}.48000.st.f32', dtype=np.float32).reshape(-1, 2).astype(np.float64)
print(f"  WAV sr {SRW}, {len(y) / SRW:.3f} s; PCM sr 48000, {len(pcm) / 48000:.3f} s; mono 44.1k dump {len(x) / SR:.3f} s")
seg = pcm[int(60 * 48000):int(60 * 48000) + 48000 * 5].mean(1); ym = y[:48000 * 5].mean(1)
# lag search +-200 ms by correlation
lags = np.arange(-9600, 9601, 1); best = None
sm = seg[9600:-9600]
corr = np.correlate(ym, sm, mode='valid')  # index k -> ym[k:k+len(sm)] vs sm, sm starts at seg[9600]
kbest = int(corr.argmax()); lag = (kbest - 9600) / 48000
print(f"  correlation: WAV sample 0 = PCM t 60.000 {lag * 1e3:+.3f} ms (0 = exact); corr peak ratio {corr.max() / (np.sort(corr)[-2] + 1e-9):.3f}")
# subtract the track and find the clicks
scale = np.dot(ym, seg) / np.dot(seg, seg); res = y.mean(1) - scale * pcm[int(60 * 48000):int(60 * 48000) + len(y)].mean(1)
bb, aa = butter(4, [800 / 24000, 1300 / 24000], btype='band'); rc = np.abs(filtfilt(bb, aa, res)); rc = gaussian_filter1d(rc, 48)
pk, _ = find_peaks(rc, height=rc.max() * 0.3, distance=48000); tc = pk / 48000 + 60
# the 1 kHz click's envelope peak sits a few ms after onset: use the 20 % crossing before the peak
tcs = []
for p_ in pk:
    s0 = rc[p_ - 480:p_]; lev = s0.min() + 0.2 * (rc[p_] - s0.min()); kk = p_
    while kk > p_ - 480 and rc[kk] > lev: kk -= 1
    tcs.append(kk / 48000 + 60)
tcs = np.array(tcs); db_win = DB[(DB >= 60) & (DB < 112)]
i = np.clip(np.searchsorted(db_win, tcs), 1, len(db_win) - 1); dd = np.where(np.abs(tcs - db_win[i - 1]) < np.abs(tcs - db_win[i]), tcs - db_win[i - 1], tcs - db_win[i]) * 1e3
print(f"  {len(tcs)} clicks found in the WAV, {len(db_win)} json downbeats in 60-112; click - downbeat: median {np.median(dd):+.1f} ms, min {dd.min():+.1f}, max {dd.max():+.1f} (bandpass 20 % crossing; the click itself ramps ~1-2 ms)")
print(f"  first click WAV {tcs[0] - 60:.3f} s = track {tcs[0]:.3f} (json 61.336); last click track {tcs[-1]:.3f} (json {db_win[-1]:.3f})")
out['H3'] = {'lag_ms': lag * 1e3, 'click_minus_downbeat_ms': dd.tolist(), 'clicks': tcs.tolist()}
# ---------------- plot ----------------
fig, ax = plt.subplots(2, 1, figsize=(14, 8), sharex=True)
for lane, c in (('low', 'C3'), ('mid', 'C0'), ('high', 'C2'), ('all', 'k')):
    t, r = summarise(H1[lane]); ax[0].plot(t, r, 'o-', ms=3, lw=0.8, color=c, alpha=0.8, label=f'{lane} ({len(t)} beats snr>=3)')
ax[0].axhline(0, color='k', lw=0.5); ax[0].axvline(85.336, color='r', ls='--', lw=0.8); ax[0].axvline(106.669, color='r', ls='--', lw=0.8); ax[0].axvline(66.669, color='gray', ls=':')
ax[0].set_ylabel('attack - grid beat (ms)\n< 0 = music before the click'); ax[0].legend(fontsize=8); ax[0].set_ylim(-150, 150)
ax[0].set_title('Vienna 55-115 s: per-beat residual (20 % crossing of the zero-phase band envelope) vs the 90 BPM truth grid')
for lane, c in (('low', 'C3'), ('mid', 'C0'), ('high', 'C2')):
    E = envs[lane]; tt_ = np.arange(int(A * SR), int(Bw * SR), 441) / SR; e = E[int(A * SR):int(Bw * SR):441]; ax[1].plot(tt_, np.sqrt(e) / np.sqrt(e).max(), lw=0.6, color=c, label=lane)
for t in DB[(DB >= A) & (DB <= Bw)]: ax[1].axvline(t, color='k', lw=0.9, alpha=0.6)
for t in sel: ax[1].axvline(t, color='k', lw=0.3, alpha=0.3)
ax[1].set_ylabel('band envelope (rms, norm)'); ax[1].set_xlabel('track time (s)'); ax[1].legend(fontsize=8); ax[1].set_xlim(A, Bw)
plt.tight_layout(); plt.savefig(f'{ROOT}/tools/work/v85/vienna-resid.png', dpi=110)
json.dump(out, open(f'{ROOT}/tools/work/v85/vienna-resid.json', 'w'))
print("\nwrote tools/work/v85/vienna-resid.png + .json")
