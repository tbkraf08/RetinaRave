# v83 — tempo DRIFT and the ears' lanes as a MEAN: (1) the tool's own onset lists (real times) folded at the grid's
# median period P: circular phase per 20 s slice, in ms — a constant row = no drift, a sloping row = the tempo;
# the slope is converted to a BPM correction. (2) the ears' lanes (60 Hz frames, so a MEDIAN is frame-quantised):
# the vel-weighted MEAN offset per lane and over all lanes, inside +-0.15 beat (the §72 ruler (b) number).
import json, os, sys, numpy as np
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
for T in sys.argv[1:]:
    d = json.load(open(f'{ROOT}/tools/truth/{T}.json')); b = np.array(d['beats'], float); P = float(np.median(np.diff(b)))
    # the grid's own phase per slice (it may not be linear: Malicious is a DP list)
    print(f"{T}: P {P:.6f} s = {60 / P:.4f} BPM; phase of each onset list per 20 s slice, ms relative to the GRID's beats (nearest-beat offset mean)")
    sl = np.arange(0, b[-1], 20.0)
    print(f"{'list':8}" + ''.join(f"{int(s):>7}" for s in sl) + "    slope ms/s  -> bpm corr")
    for k in ('low', 'click', 'mid', 'high'):
        t = np.array(d['onsets'][k], float)
        i = np.clip(np.searchsorted(b, t), 1, len(b) - 1); d0 = t - b[i - 1]; d1 = t - b[i]
        o = np.where(np.abs(d0) < np.abs(d1), d0, d1); m = np.abs(o) <= 0.15 * P
        t, o = t[m], o[m] * 1e3
        row, xs, ys = [], [], []
        for s in sl:
            mm = (t >= s) & (t < s + 20)
            if mm.sum() < 8: row.append(None); continue
            v = float(np.median(o[mm])); row.append(v); xs.append(s + 10); ys.append(v)
        slope = np.polyfit(xs, ys, 1)[0] if len(xs) > 3 else np.nan
        # an offset growing by `slope` ms per s means the true period is P*(1 + slope/1000): bpm_true = bpm/(1+slope/1000)
        bc = 60 / P / (1 + slope / 1000) - 60 / P if np.isfinite(slope) else np.nan
        print(f"{k:8}" + ''.join('      -' if v is None else f"{v:+7.1f}" for v in row) + f"    {slope:+9.4f}   {bc:+.4f}")
    tp = f'{ROOT}/tools/work/v83/drums/node-{T}.json'
    tr = json.load(open(tp)); tt = np.array(tr['t'], float); c = tr['cols']
    allo, allw = [], []
    print(f"  ears' lanes, vel-weighted MEAN offset to the nearest truth beat (ms, inside +-0.15 beat):", end='')
    for lane, col, vc in (('kick', 'kickEvt', 'kickVel'), ('snare', 'snareEvt', 'snareVel'), ('hat', 'hatEvt', 'hatVel')):
        ev = np.array(c[col], float) > 0.5; v = np.array(c[vc], float)[ev]; te = tt[ev]
        i = np.clip(np.searchsorted(b, te), 1, len(b) - 1); d0 = te - b[i - 1]; d1 = te - b[i]
        o = np.where(np.abs(d0) < np.abs(d1), d0, d1) * 1e3; m = np.abs(o) <= 0.15 * P * 1e3
        w = np.maximum(v[m], 1e-3); allo.append(o[m]); allw.append(w)
        print(f"  {lane} {np.average(o[m], weights=w):+.1f} (n {m.sum()})", end='')
    o = np.concatenate(allo); w = np.concatenate(allw)
    print(f"  | ALL {np.average(o, weights=w):+.1f} ms (unweighted {o.mean():+.1f}, n {len(o)})\n")
