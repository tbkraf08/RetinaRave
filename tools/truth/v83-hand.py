# v83 hand montage (the §72 method, tools/work/v72/hand3.py, re-cut for validation): 16 beats SPREAD across the track
# (the best on-beat attack in each of 16 equal beat-index bins), the waveform +-60 ms around each, the grid's line as
# it ships (black), the lane's zero-phase envelope (red), the marks (dotted). Three estimators per mark from the
# NATIVE 44.1 kHz mono dump: the 20 % crossing (t20), the envelope peak (tpk), the 100 Hz-HP |x| departure (dep).
# The implied correction = median t20 minus the same estimator's calibration on the four validated grids (§72 CAL).
#   python3 tools/work/v83/hand.py <Track> [low|mid|high]      -> tools/work/v83/hand-<T>[-lane].png + .json
import json, os, sys, numpy as np
from scipy.signal import butter, filtfilt
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
W = 0.060
LANE = {'low': (40, 150), 'mid': (150, 800), 'high': (5000, 12000)}
CAL = {'low': 8.2, 'mid': 0.4, 'high': -2.1}            # §72 ruler_a/shift control mean per band
TRK = sys.argv[1]; lane = sys.argv[2] if len(sys.argv) > 2 else 'high'; N = 16
m = json.load(open(f'{ROOT}/tools/work/{TRK}.f32.json')); SR = m['sr']
x = np.fromfile(f'{ROOT}/tools/work/{TRK}.f32', dtype=np.float32).astype(np.float64)
B = np.array(json.load(open(f'{ROOT}/tools/truth/{TRK}.json'))['beats'], float)
lo, hi = LANE[lane]
def zenv(a_, b_):
    bb, aa = butter(2, [a_ / (SR / 2), b_ / (SR / 2)], btype='band'); y = filtfilt(bb, aa, x)
    b2, a2 = butter(2, 30 / (SR / 2)); return filtfilt(b2, a2, np.abs(y))
E = zenv(lo, hi)
bb, aa = butter(4, 100 / (SR / 2), btype='high'); XHP = filtfilt(bb, aa, x)
def one(gb):
    t = gb; i0, i1 = int((t - 0.070) * SR), int((t + 0.070) * SR)
    if i0 < 0 or i1 > len(E): return None
    seg = E[i0:i1]; p = int(seg.argmax()); flo = seg[:max(1, p)].min() if p else seg[0]
    snr = seg[p] / (flo + 1e-12); lev = flo + 0.2 * (seg[p] - flo); k = p
    while k > 0 and seg[k] > lev: k -= 1
    f = (lev - seg[k]) / (seg[k + 1] - seg[k]) if k + 1 <= p and seg[k + 1] > seg[k] else 0.0
    t20 = (i0 + k + f) / SR; tpk = (i0 + p) / SR
    j = int(t20 * SR); f0, f1 = j - int(0.045 * SR), j - int(0.005 * SR)
    fl = np.median(np.abs(XHP[max(0, f0):max(1, f1)])) + 1e-9
    s = np.abs(XHP[j - int(0.020 * SR):j + int(0.020 * SR)])
    dep = (j - int(0.020 * SR) + int(np.argmax(s > 6 * fl))) / SR if s.max() > 6 * fl else np.nan
    return t20, tpk, dep, float(snr), abs(tpk - t) <= 0.035
cand = {}
for k, gb in enumerate(B):
    r = one(gb)
    if r and r[4] and r[3] > 2.0: cand[k] = (r[3], k, gb, r)
pick = []
edges = np.linspace(0, len(B), N + 1)
for i in range(N):
    ks = [k for k in cand if edges[i] <= k < edges[i + 1]]
    if ks: pick.append(cand[max(ks, key=lambda k: cand[k][0])])
print(f"{TRK} hand montage, lane {lane} ({lo}-{hi} Hz): {len(pick)} marks from {len(cand)} on-beat candidates of {len(B)} beats; sr {SR}")
print(f"{'beat':>5}{'grid s':>10}{'snr':>7}{'t20 ms':>9}{'tpk ms':>9}{'dep ms':>9}   (ms = mark - grid beat as it ships)")
for snr, k, gb, r in pick:
    print(f"{k:5d}{gb:10.4f}{snr:7.1f}{(r[0] - gb) * 1e3:+9.1f}{(r[1] - gb) * 1e3:+9.1f}" + (f"{(r[2] - gb) * 1e3:+9.1f}" if np.isfinite(r[2]) else f"{'-':>9}"))
o20 = np.array([(r[0] - gb) * 1e3 for _, _, gb, r in pick]); tt_ = np.array([gb for _, _, gb, _ in pick])
opk = np.array([(r[1] - gb) * 1e3 for _, _, gb, r in pick])
odp = np.array([(r[2] - gb) * 1e3 for _, _, gb, r in pick]); odp = odp[np.isfinite(odp)]
sl = np.polyfit(tt_, o20, 1)[0] if len(pick) > 3 else np.nan      # ms per second of track = drift
print(f"\n{'estimator':10}{'n':>4}{'median':>9}{'p25':>8}{'p75':>8}{'sd':>7}")
print(f"{'t20':10}{len(o20):4d}{np.median(o20):+9.1f}{np.percentile(o20, 25):+8.1f}{np.percentile(o20, 75):+8.1f}{np.std(o20):7.1f}   implied grid correction {np.median(o20) - CAL[lane]:+.1f} ms (CAL {CAL[lane]:+.1f}); drift {sl * 1e3:+.2f} ms per 1000 s")
print(f"{'tpk':10}{len(opk):4d}{np.median(opk):+9.1f}{np.percentile(opk, 25):+8.1f}{np.percentile(opk, 75):+8.1f}{np.std(opk):7.1f}")
if len(odp): print(f"{'dep':10}{len(odp):4d}{np.median(odp):+9.1f}{np.percentile(odp, 25):+8.1f}{np.percentile(odp, 75):+8.1f}{np.std(odp):7.1f}")
n = min(16, len(pick)); fig, ax = plt.subplots(4, 4, figsize=(18, 10))
for i in range(16):
    a = ax[i // 4][i % 4]
    if i >= n: a.axis('off'); continue
    snr, k, gb, r = pick[i]; i0s, i1s = int((gb - W) * SR), int((gb + W) * SR)
    tt = (np.arange(i0s, i1s) / SR - gb) * 1e3
    a.plot(tt, XHP[i0s:i1s] / (np.abs(XHP[i0s:i1s]).max() + 1e-9), lw=.35, color='#aaa')
    a.plot(tt, E[i0s:i1s] / (E[i0s:i1s].max() + 1e-12), lw=1.3, color='#c33')
    a.axvline(0, color='k', lw=1.5); a.axvline((r[0] - gb) * 1e3, color='#c33', lw=.9, ls=':')
    if np.isfinite(r[2]): a.axvline((r[2] - gb) * 1e3, color='#093', lw=.9, ls=':')
    a.set_title(f'beat {k}  {gb:.3f} s  snr {snr:.0f}  t20 {(r[0] - gb) * 1e3:+.1f} ms', fontsize=8); a.set_ylim(-1.1, 1.1); a.set_xlim(-W * 1e3, W * 1e3)
    a.tick_params(labelsize=6)
fig.suptitle(f'{TRK} hand montage, lane {lane} ({lo}-{hi} Hz): black = the grid as it ships, red = zero-phase envelope, dotted = t20 / departure marks; '
             f't20 median {np.median(o20):+.1f} ms, implied correction {np.median(o20) - CAL[lane]:+.1f} ms', fontsize=10)
fig.tight_layout()
suf = '' if lane == 'high' else f'-{lane}'
fig.savefig(f'{ROOT}/tools/work/v83/hand-{TRK}{suf}.png', dpi=90)
json.dump(dict(track=TRK, lane=lane, cal_ms=CAL[lane], t20_median_ms=round(float(np.median(o20)), 2), implied_ms=round(float(np.median(o20) - CAL[lane]), 2),
               t20_sd_ms=round(float(np.std(o20)), 2), drift_ms_per_1000s=round(float(sl * 1e3), 2),
               marks=[dict(beat=int(k), grid=round(gb, 5), t20_ms=round((r[0] - gb) * 1e3, 2), tpk_ms=round((r[1] - gb) * 1e3, 2),
                           dep_ms=(round((r[2] - gb) * 1e3, 2) if np.isfinite(r[2]) else None), snr=round(r[3], 2)) for _, k, gb, r in pick]),
          open(f'{ROOT}/tools/work/v83/hand-{TRK}{suf}.json', 'w'), indent=1)
print('png ->', f'tools/work/v83/hand-{TRK}{suf}.png')
