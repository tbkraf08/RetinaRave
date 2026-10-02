# v85 — the pad's swell at each dream chord change: when does the NEW chord's chroma energy start (10 %), cross 50 %, arrive (90 %)?
import json, os, numpy as np
from scipy.signal import stft
from scipy.ndimage import gaussian_filter1d
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
d = json.load(open(f'{ROOT}/tools/truth/Vienna.json')); B = np.array(d['beats'], float); DB = np.array(d['downbeats'], float)
SR = json.load(open(f'{ROOT}/tools/work/Vienna.f32.json'))['sr']; x = np.fromfile(f'{ROOT}/tools/work/Vienna.f32', dtype=np.float32).astype(np.float64)
NFFT, HOP = 2048, 220; fps = SR / HOP
f, t, Z = stft(x, fs=SR, nperseg=NFFT, noverlap=NFFT - HOP, boundary=None, padded=False); A = np.abs(Z) ** 2
midi = 69 + 12 * np.log2(np.maximum(f, 1) / 440); pc = np.round(midi).astype(int) % 12; m_ok = (f >= 60) & (f <= 2000)
C = np.array([A[m_ok & (pc == q)].sum(0) for q in range(12)]); C = gaussian_filter1d(C, 2, axis=1)
names = 'C C# D D# E F F# G G# A A# B'.split()
print("chord change (chroma-peak time) -> the pitch classes that GROW across it; the growing classes' summed energy: 10/50/90 % rise times, and the grid beat each sits against")
for tc in (63.03, 64.39, 65.66, 66.92, 68.27, 69.70, 73.70, 74.95, 76.35, 77.59, 78.94, 80.36, 84.36, 85.33, 86.68, 87.98):
    i = int(tc * fps); a = C[:, i - int(0.8 * fps):i - int(0.4 * fps)].mean(1); b = C[:, i + int(0.4 * fps):i + int(0.8 * fps)].mean(1)
    grow = np.where(b > 2.0 * a + 1e-9)[0]
    if len(grow) == 0: grow = [int(np.argmax(b - a))]
    e = C[grow].sum(0); seg = e[i - int(1.0 * fps):i + int(1.0 * fps)]; lo, hi = np.percentile(seg, 5), np.percentile(seg, 95)
    def cross(q):
        lev = lo + q * (hi - lo); j = np.where(seg >= lev)[0]; return (i - int(1.0 * fps) + j[0]) / fps if len(j) else np.nan
    t10, t50, t90 = cross(0.1), cross(0.5), cross(0.9)
    k = int(np.argmin(np.abs(B - t10))); db = int(np.argmin(np.abs(DB - t10)))
    print(f"  {tc:6.2f}  grows {','.join(names[g] for g in grow):10}  10% {t10:7.3f}  50% {t50:7.3f}  90% {t90:7.3f}  rise {1e3 * (t90 - t10):4.0f} ms | 10% vs nearest beat {B[k]:7.3f}: {1e3 * (t10 - B[k]):+5.0f} ms; vs nearest DOWNBEAT {DB[db]:7.3f}: {1e3 * (t10 - DB[db]):+6.0f} ms")
