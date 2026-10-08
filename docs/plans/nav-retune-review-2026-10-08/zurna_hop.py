#!/usr/bin/env python3
"""Per-0.25 s features over the 92 s Zurna clip + beat grid + tables around the user's timestamps."""
import sys, json, numpy as np
sys.path.insert(0, '/home/toma/Documents/Kraftek/RetinaRave/tools/.pylib')
import soundfile as sf
from scipy.signal import stft, find_peaks

S = '/tmp/claude-1000/-home-toma-Documents-Kraftek-RetinaRave/479e176d-441f-4ed1-b3c5-a08d95fe84cd/scratchpad'
x, sr = sf.read(f'{S}/zurna-92s.wav', dtype='float32')
if x.ndim > 1: x = x.mean(1)
dur = len(x) / sr
MARKS = [32, 33, 38, 42, 43, 47, 58, 70]

# --- fine STFT for onset envelope (10 ms hop) ---
NF, HOP = 2048, 441
f, t, Z = stft(x, sr, nperseg=NF, noverlap=NF - HOP, padded=False, boundary=None)
P = np.abs(Z) ** 2
fps = sr / HOP
L = 10 * np.log10(P + 1e-12)
flux = np.maximum(0, np.diff(L, axis=1)).clip(0, 20)        # dB rise per bin, clipped (super-flux-ish)
def band(lo, hi): return (f >= lo) & (f < hi)
onset_all = flux[band(30, 12000)].mean(0)
onset_low = flux[band(30, 150)].mean(0)
onset_mid = flux[band(150, 2500)].mean(0)
onset_hi  = flux[band(4000, 12000)].mean(0)
tt = t[1:]

# --- tempo via autocorrelation of onset envelope ---
e = onset_all - onset_all.mean()
ac = np.correlate(e, e, 'full')[len(e) - 1:]; ac /= ac[0]
lo, hi = int(fps * 60 / 200), int(fps * 60 / 60)
pk, _ = find_peaks(ac[lo:hi]); cand = sorted(((ac[lo + p], (lo + p) / fps) for p in pk), reverse=True)[:6]
print('tempo candidates (acf, period s, BPM):')
for a, p in cand: print(f'  {a:.3f}  {p:.4f}  {60/p:.2f}')
# pick strongest in 80-180 with octave fold
best = max(cand, key=lambda c: c[0])
per = best[1]
while 60 / per < 80: per /= 2
while 60 / per > 180: per *= 2
# refine period by comb over the whole envelope (local search)
def comb_score(p, ph):
    beats = np.arange(ph, dur, p); idx = np.round(beats * fps).astype(int); idx = idx[(idx > 0) & (idx < len(onset_all))]
    return onset_all[idx].sum()
bestp, bests, bestph = per, -1, 0
for p in np.linspace(per * 0.97, per * 1.03, 241):
    for ph in np.linspace(0, p, 48, endpoint=False):
        s = comb_score(p, ph)
        if s > bests: bests, bestp, bestph = s, p, ph
# fine phase
for ph in np.linspace(bestph - bestp / 48, bestph + bestp / 48, 81):
    s = comb_score(bestp, ph % bestp)
    if s > bests: bests, bestph = s, ph % bestp
BPM = 60 / bestp
beats = np.arange(bestph, dur, bestp)
# downbeat: which beat mod 4 has most low-flux + overall flux
sc = []
for m in range(4):
    idx = np.round(beats[m::4] * fps).astype(int); idx = idx[(idx > 0) & (idx < len(onset_all))]
    sc.append((float(onset_low[idx].mean() * 2 + onset_all[idx].mean()), m))
down_m = max(sc)[1]; med = {}
print(f'\nBPM {BPM:.2f}  period {bestp:.4f} s  first beat {bestph:.3f} s  downbeat mod4={down_m}  (scores {[(round(a,3),m) for a,m in sc]})')
bars = beats[down_m::4]
print('bar lines (s):', ' '.join(f'{b:.2f}' for b in bars))

# --- coarse 0.25 s hop features ---
HOPC = 0.25; W = 0.5
rows = []
NF2 = 4096
f2, t2, Z2 = stft(x, sr, nperseg=NF2, noverlap=NF2 - 1024, padded=False, boundary=None)
P2 = np.abs(Z2) ** 2
tot = P2[(f2 >= 25) & (f2 < 12000)].sum(0) + 1e-12
cent = (P2[(f2 >= 25) & (f2 < 12000)] * f2[(f2 >= 25) & (f2 < 12000)][:, None]).sum(0) / tot
lowE = P2[(f2 >= 25) & (f2 < 150)].sum(0)
subE = P2[(f2 >= 25) & (f2 < 60)].sum(0)
hiE = P2[(f2 >= 4000) & (f2 < 12000)].sum(0)
midE = P2[(f2 >= 150) & (f2 < 2000)].sum(0)
for tc in np.arange(0, dur - W + 1e-9, HOPC):
    a, b = int(tc * sr), int((tc + W) * sr)
    rms = 20 * np.log10(np.sqrt(np.mean(x[a:b] ** 2)) + 1e-9)
    m2 = (t2 >= tc) & (t2 < tc + W); m1 = (tt >= tc) & (tt < tc + W)
    rows.append(dict(t=tc + W / 2, rms=rms, cen=float(cent[m2].mean()),
                     low=10 * np.log10(lowE[m2].mean() + 1e-12), sub=10 * np.log10(subE[m2].mean() + 1e-12),
                     mid=10 * np.log10(midE[m2].mean() + 1e-12), high=10 * np.log10(hiE[m2].mean() + 1e-12),
                     lowsh=float(lowE[m2].sum() / tot[m2].sum() * 100), hish=float(hiE[m2].sum() / tot[m2].sum() * 100),
                     flux=float(onset_all[m1].mean()), fl_lo=float(onset_low[m1].mean()), fl_mid=float(onset_mid[m1].mean()), fl_hi=float(onset_hi[m1].mean())))
R = {k: np.array([r[k] for r in rows]) for k in rows[0]}
med = {k: float(np.median(R[k])) for k in R if k != 't'}
print('\nclip medians:', {k: round(v, 2) for k, v in med.items()})

def beatpos(ts):
    i = np.searchsorted(beats, ts) - 1
    if i < 0: return 'before grid'
    k = i - down_m; bar = k // 4 + 1; beat = k % 4 + 1
    off = ts - beats[i]
    return f'bar {bar} beat {beat} +{off*1000:.0f} ms (next beat {beats[i+1]:.2f}s)' if i + 1 < len(beats) else f'bar {bar} beat {beat}'

hdr = f"{'t':>6} {'rms':>6} {'cen':>6} {'low':>6} {'sub':>6} {'mid':>6} {'high':>6} {'low%':>5} {'hi%':>5} {'flux':>5} {'fLo':>5} {'fMid':>5} {'fHi':>5}"
def table(lo, hi):
    print(hdr)
    for r in rows:
        if lo <= r['t'] <= hi:
            print(f"{r['t']:6.2f} {r['rms']:6.1f} {r['cen']:6.0f} {r['low']:6.1f} {r['sub']:6.1f} {r['mid']:6.1f} {r['high']:6.1f} {r['lowsh']:5.1f} {r['hish']:5.1f} {r['flux']:5.2f} {r['fl_lo']:5.2f} {r['fl_mid']:5.2f} {r['fl_hi']:5.2f}")

for m in MARKS:
    print(f'\n=== {m} s  ({beatpos(m)}) ===')
    table(m - 2, m + 2)

# --- whole-clip 2 s overview ---
print('\n=== 2 s overview ===')
print(f"{'t':>5} {'rms':>6} {'cen':>6} {'low':>6} {'high':>6} {'low%':>5} {'flux':>5} {'fLo':>5} {'fMid':>5} {'fHi':>5}  bar")
for tc in np.arange(0, dur, 2):
    m = (R['t'] >= tc) & (R['t'] < tc + 2)
    if not m.any(): continue
    print(f"{tc:5.0f} {R['rms'][m].mean():6.1f} {R['cen'][m].mean():6.0f} {R['low'][m].mean():6.1f} {R['high'][m].mean():6.1f} {R['lowsh'][m].mean():5.1f} {R['flux'][m].mean():5.2f} {R['fl_lo'][m].mean():5.2f} {R['fl_mid'][m].mean():5.2f} {R['fl_hi'][m].mean():5.2f}  {beatpos(tc).split(' beat')[0]}")

# --- strongest onsets (events) per 1 s near marks: low kicks / mid snares ---
print('\n=== discrete onsets near marks (time, band, strength) ===')
for nm, env, h in (('LOW', onset_low, 0.8), ('MID', onset_mid, 0.8), ('HI', onset_hi, 0.8)):
    thr = np.percentile(env, 92)
    pk, _ = find_peaks(env, height=thr, distance=int(fps * 0.1))
    for m in MARKS:
        ev = [(tt[p], env[p]) for p in pk if m - 1.5 <= tt[p] <= m + 1.5]
        print(f'{nm} around {m}: ' + ' '.join(f'{a:.2f}({b:.1f})' for a, b in ev))

json.dump(dict(bpm=float(BPM), period=float(bestp), phase=float(bestph), downbeat_mod4=down_m, beats=beats.tolist(), bars=bars.tolist(),
               medians=med, rows=[{k: float(v) for k, v in r.items()} for r in rows]), open(f'{S}/zurna-hop.json', 'w'))
