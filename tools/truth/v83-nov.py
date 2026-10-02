# v83 — grid-free Foote novelty (tools/work/v/nov.py generalised): where do the structural boundaries land on the
# grid's BAR? Each novelty peak -> nearest truth beat -> beat-of-bar relative to the grid's downbeats (1 = the grid's
# beat 1). A bar line that is right has the boundaries on beat 1; a bar line two beats off has them on beat 3.
#   KL=<s> python3 tools/work/v83/nov.py <Track>      (KL = kernel half-width, s; default 2 bars)
import os, sys, json, numpy as np
from scipy.signal import stft, find_peaks
from scipy.ndimage import gaussian_filter1d
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'); T = sys.argv[1]
d = json.load(open(f'{ROOT}/tools/truth/{T}.json')); b = np.array(d['beats'], float); db = np.array(d['downbeats'], float)
P = float(np.median(np.diff(b))); dbi = np.searchsorted(b, db - 1e-4)
sr = json.load(open(f'{ROOT}/tools/work/{T}.f32.json'))['sr']; x = np.fromfile(f'{ROOT}/tools/work/{T}.f32', dtype=np.float32)
NFFT = 4096; HOP = 2048
f, t, Z = stft(x, fs=sr, nperseg=NFFT, noverlap=NFFT - HOP, boundary=None, padded=False); A = np.abs(Z)
edges = np.geomspace(25, 12000, 13)
B = np.array([A[(f >= edges[i]) & (f < edges[i + 1])].sum(0) for i in range(12)])
B = np.log1p(B / (B.sum(0) + 1e-9) * 100); B = B / (np.linalg.norm(B, axis=0) + 1e-9)
fps = sr / HOP; S = B.T @ B
KL = float(os.environ.get('KL', 8 * P)); L = int(round(KL * fps))
K = np.ones((2 * L, 2 * L)); K[:L, L:] = -1; K[L:, :L] = -1
nv = np.zeros(S.shape[0])
for i in range(L, S.shape[0] - L): nv[i] = (S[i - L:i + L, i - L:i + L] * K).sum()
nv = gaussian_filter1d(np.maximum(0, nv), 1.0); nv /= nv.max() + 1e-9
pk, _ = find_peaks(nv, height=0.25, distance=int(1.2 * fps)); tp = pk / fps + NFFT / 2 / sr      # frame centre = real time
i = np.clip(np.searchsorted(b, tp), 1, len(b) - 1); d0 = tp - b[i - 1]; d1 = tp - b[i]
k = np.where(np.abs(d0) < np.abs(d1), i - 1, i); o = (tp - b[k]) * 1e3
j = np.searchsorted(dbi, k, side='right') - 1; ph = (k - dbi[np.clip(j, 0, len(dbi) - 1)]) % 4
print(f"{T}: {len(tp)} novelty peaks, kernel half-width {KL:.2f} s ({KL / P / 4:.1f} bars), P {P:.4f}; beat-of-bar 1 = the grid's beat 1")
print('  ' + ' '.join(f'{v:.2f}[{p + 1}{"" if abs(oo) < 0.25 * P * 1e3 else "?"}]' for v, p, oo in zip(tp, ph, o)))
c = np.bincount(ph, minlength=4); print(f"  counts per beat-of-bar 1..4: {c.tolist()}   median |offset to nearest beat| {np.median(np.abs(o)):.0f} ms (random would be {P * 250:.0f})")
