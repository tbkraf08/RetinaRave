# v85 — the dream section (66.669-85.336) under the 90 grid: what pulse is there, where is its phase, and where do the
# chord / phrase changes fall on the grid's bar?  -> stdout + tools/work/v85/vienna-dream.png
import json, os, numpy as np
from scipy.signal import butter, filtfilt, stft
from scipy.ndimage import gaussian_filter1d
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
d = json.load(open(f'{ROOT}/tools/truth/Vienna.json')); B = np.array(d['beats'], float); DB = np.array(d['downbeats'], float)
P = float(np.median(np.diff(B))); dbi = np.searchsorted(B, DB - 1e-4)
SR = json.load(open(f'{ROOT}/tools/work/Vienna.f32.json'))['sr']; x = np.fromfile(f'{ROOT}/tools/work/Vienna.f32', dtype=np.float32).astype(np.float64)
# ---- 1. the pulse in the dream: onset strength (spectral flux, 10 ms hop) -> ACF over 66.7-85.3 and over 85.3-112
NFFT, HOP = 2048, 441; fps = SR / HOP
f, t, Z = stft(x, fs=SR, nperseg=NFFT, noverlap=NFFT - HOP, boundary=None, padded=False); A = np.abs(Z)
def flux(lo, hi):
    S = np.log1p(100 * A[(f >= lo) & (f < hi)]); fl = np.maximum(0, np.diff(S, axis=1)).sum(0); fl = np.concatenate([[0], fl])
    return fl - gaussian_filter1d(fl, 20)
F = {'full': flux(30, 12000), 'low': flux(30, 150), 'mid': flux(150, 2500), 'high': flux(2500, 12000)}
print("1. PULSE: ACF of onset strength; the top 4 lags (s) with their height, per band and window")
lags_s = np.arange(int(0.15 * fps), int(3.0 * fps))
for (t0, t1) in ((66.669, 85.336), (60.0, 66.669), (85.336, 112.0)):
    i0, i1 = int(t0 * fps), int(t1 * fps)
    for k, fl in F.items():
        s = fl[i0:i1] - fl[i0:i1].mean(); ac = np.array([np.dot(s[:-L], s[L:]) for L in lags_s]) / np.dot(s, s)
        # local maxima
        pk = [j for j in range(1, len(ac) - 1) if ac[j] > ac[j - 1] and ac[j] > ac[j + 1]]
        pk = sorted(pk, key=lambda j: -ac[j])[:5]
        print(f"  {t0:.1f}-{t1:.1f} {k:5} " + '  '.join(f"{lags_s[j] / fps:.3f}s({ac[j]:+.2f})" for j in sorted(pk)) + f"   | at P {ac[np.argmin(np.abs(lags_s / fps - P))]:+.2f}, P/2 {ac[np.argmin(np.abs(lags_s / fps - P / 2))]:+.2f}, 2P {ac[np.argmin(np.abs(lags_s / fps - 2 * P))]:+.2f}, 4P {ac[np.argmin(np.abs(lags_s / fps - 4 * P))]:+.2f}")
# ---- 2. phase of the dream's pulse against the grid: fold onset strength on the beat (12 bins) and on the bar (16 bins)
print("\n2. PHASE: onset strength folded on the grid's BEAT (12 bins of P/12 = 55 ms; bin 0 = the grid line) and on the BAR (16 bins = 16ths; bin 0 = the downbeat)")
for (t0, t1) in ((66.669, 85.336), (85.336, 112.0)):
    i0, i1 = int(t0 * fps), int(t1 * fps); tt = t[i0:i1]
    for k in ('full', 'low', 'high'):
        s = np.maximum(0, F[k][i0:i1]); ph = ((tt - B[0]) / P) % 1.0; h = np.array([s[(ph >= j / 12) & (ph < (j + 1) / 12)].sum() for j in range(12)]); h /= h.max()
        # bar fold
        ib = np.clip(np.searchsorted(DB, tt, side='right') - 1, 0, len(DB) - 1); phb = (tt - DB[ib]) / (4 * P)
        hb = np.array([s[(phb >= j / 16) & (phb < (j + 1) / 16)].sum() for j in range(16)]); hb /= hb.max()
        print(f"  {t0:.1f}-{t1:.1f} {k:5} beat {' '.join(f'{v:.2f}' for v in h)}  argmax bin {int(h.argmax())} ({int(h.argmax()) * P / 12 * 1e3:.0f} ms after the line)")
        print(f"  {'':11} {'':5} bar  {' '.join(f'{v:.2f}' for v in hb)}  (16ths; beats start at bins 0 4 8 12) argmax 16th {int(hb.argmax())} = beat {int(hb.argmax()) // 4 + 1} +{int(hb.argmax()) % 4}/4")
# ---- 3. beat-synchronous features 56-88: 12 log bands + chroma; change from the previous beat; where do changes fall?
print("\n3. PHRASE: per-beat 12-band + chroma vectors 56-88 s; dist = cosine distance to the previous beat (a chord / layer change); beat-of-bar 1 = the grid's downbeat")
NF2, HP2 = 4096, 1024
f2, t2, Z2 = stft(x, fs=SR, nperseg=NF2, noverlap=NF2 - HP2, boundary=None, padded=False); A2 = np.abs(Z2)
edges = np.geomspace(30, 12000, 13); Bm = np.array([A2[(f2 >= edges[i]) & (f2 < edges[i + 1])].sum(0) for i in range(12)])
Bm = np.log1p(Bm / (Bm.sum(0) + 1e-9) * 100)
midi = 69 + 12 * np.log2(np.maximum(f2, 1) / 440); pc = np.round(midi).astype(int) % 12; m_ok = (f2 >= 60) & (f2 <= 2000)
C = np.array([np.log1p(A2[m_ok & (pc == q)].sum(0)) for q in range(12)]); C /= np.linalg.norm(C, axis=0) + 1e-9
def beatvec(M, k):
    i0, i1 = np.searchsorted(t2, B[k]), np.searchsorted(t2, B[k + 1]); v = M[:, i0:i1].mean(1); return v / (np.linalg.norm(v) + 1e-9)
ks = [k for k in range(len(B) - 1) if 56 <= B[k] < 88]
rows = []
for k in ks:
    vb, vc = beatvec(Bm, k), beatvec(C, k); pb, pcv = beatvec(Bm, k - 1), beatvec(C, k - 1)
    j = np.searchsorted(dbi, k, side='right') - 1; bob = (k - dbi[j]) % 4 + 1
    e = np.array([np.sqrt(np.mean(x[int(B[k] * SR):int(B[k + 1] * SR)] ** 2))])
    rows.append((B[k], k, bob, 1 - np.dot(vb, pb), 1 - np.dot(vc, pcv), float(e[0]), vc))
mx = max(r[3] for r in rows); mc = max(r[4] for r in rows)
names = 'C C# D D# E F F# G G# A A# B'.split()
for r in rows:
    bar = (r[1] - dbi[0]) // 4
    tone = names[int(np.argmax(r[6]))]
    print(f"  {r[0]:7.3f} beat {r[1]:3} bar {bar:2} bob {r[2]}  timbre-change {'#' * int(30 * r[3] / mx):30} {r[3]:.3f}  chroma-change {'#' * int(20 * r[4] / mc):20} {r[4]:.3f}  rms {r[5]:.3f} top-pc {tone}")
dd = np.array([r[3] for r in rows]); cc = np.array([r[4] for r in rows]); bob = np.array([r[2] for r in rows]); tt_ = np.array([r[0] for r in rows])
for lab, (a, b) in (('60-85.3', (60, 85.3)), ('66.7-85.3', (66.669, 85.3)), ('85.3-88', (85.3, 88))):
    m = (tt_ >= a) & (tt_ < b)
    print(f"  {lab}: mean timbre-change per beat-of-bar 1..4 {' '.join(f'{dd[m & (bob == q)].mean():.3f}' for q in (1, 2, 3, 4))}   chroma-change {' '.join(f'{cc[m & (bob == q)].mean():.3f}' for q in (1, 2, 3, 4))}")
# ---- 4. the sub (808) note runs in 56-90 from the json: where do the sub notes change?
print("\n4. SUB RUNS from Vienna.json (sub_runs / sub_slides) inside 56-90 s, with beat-of-bar of the start")
for key in ('sub_runs', 'sub_slides'):
    v = d.get(key)
    if not v: print(f"  {key}: none"); continue
    print(f"  {key}: {type(v).__name__} len {len(v)}; sample {json.dumps(v[0] if isinstance(v, list) else list(v.items())[0])[:200]}")
    if isinstance(v, list):
        for r in v:
            t0 = r.get('t') if isinstance(r, dict) else r[0]
            if t0 is None or not (56 <= t0 < 90): continue
            k = int(np.clip(np.searchsorted(B, t0), 1, len(B) - 1)); k = k - 1 if abs(t0 - B[k - 1]) < abs(t0 - B[k]) else k
            j = np.searchsorted(dbi, k, side='right') - 1; bob = (k - dbi[j]) % 4 + 1
            print(f"    {json.dumps(r)[:160]}  -> beat {k} bob {bob} off {(t0 - B[k]) * 1e3:+.0f} ms")
# ---- plot: the dream's onset strength with the grid
fig, ax = plt.subplots(3, 1, figsize=(16, 9))
for a, (t0, t1) in zip(ax, ((60, 73), (73, 86), (86, 99))):
    i0, i1 = int(t0 * fps), int(t1 * fps)
    for k, c in (('low', 'C3'), ('mid', 'C0'), ('high', 'C2')): a.plot(t[i0:i1], np.maximum(0, F[k][i0:i1]) / (np.maximum(0, F[k][i0:i1]).max() + 1e-9), lw=0.7, color=c, label=k)
    for b in B[(B >= t0) & (B <= t1)]: a.axvline(b, color='k', lw=0.3, alpha=0.4)
    for b in DB[(DB >= t0) & (DB <= t1)]: a.axvline(b, color='k', lw=1.2, alpha=0.8)
    a.set_xlim(t0, t1); a.set_ylabel('onset strength')
ax[0].legend(fontsize=8); ax[0].set_title('Vienna 60-99 s: spectral-flux onset strength per band; thin = truth beats, thick = truth downbeats (90 BPM grid)')
ax[2].set_xlabel('track time (s)'); plt.tight_layout(); plt.savefig(f'{ROOT}/tools/work/v85/vienna-dream.png', dpi=100)
print("\nwrote tools/work/v85/vienna-dream.png")
