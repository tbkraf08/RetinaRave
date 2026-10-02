# v85 — the BAR LINE per section: (1) chord-change times at 10 ms resolution 56-112 (offset to the nearest grid beat, beat-of-bar);
# (2) per-section fold of the kick-band accent, the high-band accent and the chroma change on the 4 beats of the grid's bar;
# (3) the accent per beat in 56-66.7 (which beat sounds like the one just before the dream).
import json, os, numpy as np
from scipy.signal import stft, find_peaks
from scipy.ndimage import gaussian_filter1d
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
d = json.load(open(f'{ROOT}/tools/truth/Vienna.json')); B = np.array(d['beats'], float); DB = np.array(d['downbeats'], float)
P = float(np.median(np.diff(B))); dbi = np.searchsorted(B, DB - 1e-4)
SR = json.load(open(f'{ROOT}/tools/work/Vienna.f32.json'))['sr']; x = np.fromfile(f'{ROOT}/tools/work/Vienna.f32', dtype=np.float32).astype(np.float64)
NFFT, HOP = 4096, 441; fps = SR / HOP
f, t, Z = stft(x, fs=SR, nperseg=NFFT, noverlap=NFFT - HOP, boundary=None, padded=False); A = np.abs(Z)
midi = 69 + 12 * np.log2(np.maximum(f, 1) / 440); pc = np.round(midi).astype(int) % 12; m_ok = (f >= 60) & (f <= 2000)
C = np.array([np.log1p(A[m_ok & (pc == q)].sum(0)) for q in range(12)]); C = gaussian_filter1d(C, 3, axis=1); C /= np.linalg.norm(C, axis=0) + 1e-9
K = int(0.5 * fps)  # compare the 0.5 s before to the 0.5 s after
cd = np.zeros(C.shape[1])
for i in range(K, C.shape[1] - K):
    a = C[:, i - K:i].mean(1); b = C[:, i:i + K].mean(1); cd[i] = 1 - np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-9)
def nearest(tp):
    i = np.clip(np.searchsorted(B, tp), 1, len(B) - 1); d0 = tp - B[i - 1]; d1 = tp - B[i]; k = np.where(np.abs(d0) < np.abs(d1), i - 1, i)
    j = np.searchsorted(dbi, k, side='right') - 1; bob = (k - dbi[np.clip(j, 0, len(dbi) - 1)]) % 4 + 1; return k, (tp - B[k]) * 1e3, bob
print("1. CHORD CHANGES (chroma, 0.5 s before vs after, 10 ms hop) 56-112: time -> nearest grid beat, offset ms, beat-of-bar")
pk, pr = find_peaks(cd, height=0.04, distance=int(0.8 * fps)); tp = t[pk]; m = (tp >= 56) & (tp <= 112); tp = tp[m]; h = pr['peak_heights'][m]
k, off, bob = nearest(tp)
for v, hh, kk, oo, bb in zip(tp, h, k, off, bob): print(f"   {v:7.2f}  h {hh:.3f}  beat {kk:3} bar {(kk - dbi[0]) // 4:2} bob {bb} off {oo:+5.0f} ms")
print(f"   counts per beat-of-bar 1..4 (|off| < P/4): {np.bincount(bob[np.abs(off) < P * 250] - 1, minlength=4).tolist()}")
# 2. per-section bar phase
def flux(lo, hi):
    S = np.log1p(100 * A[(f >= lo) & (f < hi)]); fl = np.maximum(0, np.diff(S, axis=1)).sum(0); fl = np.concatenate([[0], fl]); return np.maximum(0, fl - gaussian_filter1d(fl, 20))
FL = {'kick 30-150': flux(30, 150), 'snare 150-2500': flux(150, 2500), 'hat 2500-12k': flux(2500, 12000), 'chord-change': cd}
print("\n2. BAR PHASE per section: each signal summed in a +-80 ms window round every grid beat, folded on beat-of-bar 1..4 (normalised); * = the max")
secs = ((0, 21.3), (21.3, 43.5), (43.5, 61.3), (61.3, 66.7), (66.7, 85.3), (85.3, 101.3), (101.3, 112), (112, 145), (145, 192))
W = int(0.08 * fps)
for (t0, t1) in secs:
    ks = [kk for kk in range(len(B)) if t0 <= B[kk] < t1]
    line = f"   {t0:5.1f}-{t1:5.1f} ({len(ks) // 4:2} bars)"
    for name, s in FL.items():
        acc = np.zeros(4)
        for kk in ks:
            i = int(B[kk] * fps); j = np.searchsorted(dbi, kk, side='right') - 1; bb = (kk - dbi[max(j, 0)]) % 4
            acc[bb] += s[max(0, i - W):i + W].max()
        acc /= acc.max() + 1e-9
        line += f"  | {name}: " + ' '.join(f"{v:.2f}{'*' if v == acc.max() else ' '}" for v in acc)
    print(line)
# 3. the accent per beat 56-66.7
print("\n3. ACCENT per beat 56-66.7: flux peak (+-80 ms) per band, beat-of-bar; the loudest events are what the ear takes as the pulse")
for kk in range(len(B)):
    if not (56 <= B[kk] < 66.7): continue
    i = int(B[kk] * fps); j = np.searchsorted(dbi, kk, side='right') - 1; bb = (kk - dbi[max(j, 0)]) % 4 + 1
    vals = {n: s[i - W:i + W].max() for n, s in FL.items() if n != 'chord-change'}
    mx = {n: s[int(56 * fps):int(66.7 * fps)].max() for n, s in FL.items() if n != 'chord-change'}
    print(f"   {B[kk]:7.3f} bob {bb}  " + '  '.join(f"{n.split()[0]:5} {'#' * int(20 * vals[n] / mx[n]):20}" for n in vals))
