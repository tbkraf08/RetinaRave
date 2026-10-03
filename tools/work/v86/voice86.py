#!/usr/bin/env python3
"""§86 ruler: MANDALA's three voices on a dust-trace.js trace, against the truth (tools/truth/<T>.kick.json / .snare.json /
<T>.json onsets.high) at ±50 ms (§64's tolerance). Per voice: fires/s vs the truth's rate, P (the share of fires that are
truth hits), the §58 coverage (the share of truth hits with a fire), the share of fires at the voice's floor (amp <= floor
+ 1e-6), the share landing on the truth's 16th grid (within 1/32 beat of a bpm_grid 16th), the LAG p50 (the first frame
the envelope rises after a truth onset, ms), and LEGIBILITY: the annulus lift per fire (lumC for the kick, lumM for the
snare, lumR for the hat: peak in the 4 frames from the fire minus the frame before) against the annulus's own frame noise
(|d| p50, §80's rule: >= 2x).    usage: voice86.py <trace.json>[:t0:t1] [...]"""
import json, os, sys
import numpy as np
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))
TOL = 0.05
FLOOR = {'K': 0.25, 'S': 0.25, 'H': 0.2}

def match(det, ref, tol):
    used = np.zeros(len(ref), bool); tp = 0; lag = []
    for d in det:
        j, best = -1, tol + 1
        for i, r in enumerate(ref):
            if used[i]: continue
            e = abs(d - r)
            if e <= tol and e < best: best, j = e, i
        if j >= 0: used[j] = True; tp += 1; lag.append(d - ref[j])
    return tp, used

for spec in sys.argv[1:]:
    parts = spec.split(':'); p = parts[0]
    d = json.load(open(p)); C = d['cols']; t = np.array(d['t'], float); T = d['track']
    g = lambda k: np.array([np.nan if x is None else x for x in C[k]], float)
    t0, t1 = (float(parts[1]), float(parts[2])) if len(parts) == 3 else (t[0], t[-1])
    m = (t >= t0) & (t <= t1); dur = t1 - t0
    tj = json.load(open(os.path.join(ROOT, 'tools', 'truth', T + '.json')))
    grid = np.array(tj.get('bpm_grid', {}).get('beats', tj.get('beats', [])), float) if isinstance(tj.get('bpm_grid'), dict) else np.array(tj.get('beats', []), float)
    truth = {}
    for v, f in (('K', 'kick'), ('S', 'snare')):
        fp = os.path.join(ROOT, 'tools', 'truth', '%s.%s.json' % (T, f))
        truth[v] = np.array(json.load(open(fp))['t'], float) if os.path.exists(fp) else np.array([])
    truth['H'] = np.array(tj['onsets']['high'], float)
    print('%s %s %.1f-%.1f s (%d frames)' % (os.path.basename(p), T, t0, t1, m.sum()))
    # the 16th grid from the truth beats
    g16 = np.array([])
    if len(grid) > 1:
        g16 = (grid[:-1][:, None] + (grid[1:] - grid[:-1])[:, None] * np.array([0, .25, .5, .75])[None, :]).ravel() if grid.ndim == 1 else np.array([])
    for v, lumk in (('K', 'lumC'), ('S', 'lumM'), ('H', 'lumR')):
        fn = g('d_f' + v); amp = g('d_a' + v); env = g('d_v' + v.lower()); L = g(lumk)
        idx = np.where(np.diff(fn) > 0.5)[0] + 1; idx = idx[m[idx]]
        ft = t[idx]; ref = truth[v]; ref = ref[(ref >= t0) & (ref <= t1)]
        tp, used = match(ft, ref, TOL)
        P = tp / max(1, len(ft)); cov = used.mean() if len(ref) else float('nan')
        floor = np.mean(amp[idx] <= FLOOR[v] + 1e-6) if len(idx) else float('nan')
        ongrid = np.mean([np.min(np.abs(g16 - x)) <= (np.median(np.diff(grid)) / 32) for x in ft]) if len(g16) and len(ft) else float('nan')
        # lag: for each truth onset, the first frame after it (within 150 ms) where the envelope rises
        lags = []
        for r in ref:
            i = np.searchsorted(t, r)
            for j in range(max(1, i - 1), min(len(t), i + 9)):
                if env[j] > env[j - 1] + 1e-6: lags.append(1000 * (t[j] - r)); break
        lift = []
        for i in idx:
            if i < 1 or i + 4 > len(t): continue
            lift.append(np.nanmax(L[i:i + 4]) - L[i - 1])
        noise = np.nanmedian(np.abs(np.diff(L[m])))
        print('   %s fires %3d (%.2f /s, truth %.2f /s) P %.2f cov %.2f floor %.2f grid %.2f · lag p50 %+5.1f ms (n %d of %d) · %s lift/fire p50 %.2f mean %.2f vs noise %.2f = %.1fx'
              % (v, len(ft), len(ft) / dur, len(ref) / dur, P, cov, floor, ongrid, np.median(lags) if lags else float('nan'), len(lags), len(ref), lumk,
                 np.median(lift) if lift else float('nan'), np.mean(lift) if lift else float('nan'), noise, (np.median(lift) / noise) if lift and noise > 0 else float('nan')))
