#!/usr/bin/env python3
"""§87 ruler: MANDALA's tension on a dust-trace.js trace. Prints `tight` at the named times, the frames where `rel` fires
(d_rel steps to >= 0.99), the per-bar median `lum` over the 4 bars before each truth drop and the drop frame's lum against
the bar before, `amb` over a window, and the control numbers (max tight, rel fires, frames with Nt != N).
usage: tens87.py <trace.json> [--at t,t,...] [--amb t0:t1] [--drops t,t]"""
import json, sys, os
import numpy as np
a = sys.argv[1:]; p = [x for x in a if x.endswith('.json')][0]
opt = lambda k, d=None: a[a.index(k) + 1] if k in a else d
d = json.load(open(p)); C = d['cols']; t = np.array(d['t'], float); T = d['track']
g = lambda k: np.array([np.nan if x is None else x for x in C[k]], float)
tight = g('d_tight'); rel = g('d_rel'); build = g('d_build'); amb = g('d_amb'); N = g('d_N'); Nt = g('d_Nt'); lum = g('lum'); bc = g('beatCount'); bpm = np.nanmedian(g('bpm'))
tj = json.load(open(os.path.join(os.path.dirname(__file__), '..', '..', 'truth', T + '.json')))
drops = [float(x) for x in opt('--drops').split(',')] if opt('--drops') else list(tj.get('drops', []))
drops = [x for x in drops if t[0] <= x <= t[-1]]
print('%s %s %.1f-%.1f s · tight max %.3f · build max %.3f · amb max %.3f · frames Nt!=N %d / %d · rel fires %d'
      % (os.path.basename(p), T, t[0], t[-1], np.nanmax(tight), np.nanmax(build), np.nanmax(amb), int(np.sum(Nt != N)), len(t), int(np.sum((rel[1:] >= 0.99) & (rel[:-1] < 0.99)))))
if opt('--at'):
    for x in opt('--at').split(','):
        i = np.searchsorted(t, float(x)); i = min(i, len(t) - 1)
        print('   at %6.2f s: tight %.3f build %.3f amb %.3f N %d Nt %d' % (t[i], tight[i], build[i], amb[i], N[i], Nt[i]))
ri = np.where((rel[1:] >= 0.99) & (rel[:-1] < 0.99))[0] + 1
for i in ri: print('   rel = 1 at %.3f s (frame %d)' % (t[i], i))
beat = 60 / bpm
for D in drops:
    i = np.searchsorted(t, D)
    near = ri[np.abs(t[ri] - D) < 0.1]
    print('   drop %.3f: rel fires within ±1 frame: %s' % (D, ', '.join('%+.0f ms' % (1000 * (t[j] - D)) for j in near) or 'NONE'))
    bars = []
    for k in range(4, 0, -1):
        m = (t >= D - k * 4 * beat) & (t < D - (k - 1) * 4 * beat)
        bars.append(np.nanmedian(lum[m]))
    mono = all(bars[j] >= bars[j + 1] for j in range(3))
    # the drop frame: the max lum over the 3 frames from the drop (the slam lands on its frame, the composite the next)
    dl = np.nanmax(lum[i:i + 3]); prev = bars[-1]
    print('      per-bar median lum over the 4 bars before: %s  monotone falling: %s · drop frame lum %.1f = %.2fx the bar before'
          % (' '.join('%.1f' % b for b in bars), 'YES' if mono else 'NO', dl, dl / prev if prev > 0 else float('nan')))
    print('      tight the 4 bars before (median per bar): %s' % ' '.join('%.2f' % np.nanmedian(tight[(t >= D - k * 4 * beat) & (t < D - (k - 1) * 4 * beat)]) for k in range(4, 0, -1)))
if opt('--amb'):
    t0, t1 = [float(x) for x in opt('--amb').split(':')]
    m = (t >= t0) & (t < t1)
    print('   amb over %.1f-%.1f: p10 %.3f p50 %.3f min %.3f · share >= 0.75: %.2f · tight p50 %.3f · tongueAmbig p50 %.3f'
          % (t0, t1, np.nanpercentile(amb[m], 10), np.nanmedian(amb[m]), np.nanmin(amb[m]), np.mean(amb[m] >= 0.75), np.nanmedian(tight[m]),
             np.nanmedian(g('tongueAmbig')[m]) if 'tongueAmbig' in C else float('nan')))
