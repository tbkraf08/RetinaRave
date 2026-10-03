#!/usr/bin/env python3
"""§85 ruler: nudge78.py's §61/§66 metrics on MANDALA's `d_rot` (the wedge angle) instead of DUST's `d_spin`, with the design
step taken from the trace itself — MANDALA's step is 2pi/(4N) and N is a column (`d_N`) — plus the N changes with their frame
time and reason (`d_nN` steps, `d_why`: 1 phrase / 2 novel / 4 return) and the downbeat / plain step ratio.
usage: nudge85.py <trace.json> [...]    (COL=d_spin STEPK=32 grades a DUST trace the same way)"""
import json, sys, os
import numpy as np
COL = os.environ.get('COL', 'd_rot')
def grade(t, ang, bc, P):
    v = np.diff(ang) / np.diff(t); tv = 0.5 * (t[1:] + t[:-1])
    a = np.diff(v) / np.diff(tv); ta = 0.5 * (tv[1:] + tv[:-1])
    inc = np.where(np.diff(bc) > 0.5)[0] + 1; bl = t[inc]
    rows = []
    for b in bl:
        if b - 0.5 * P < t[0] or b + 1.5 * P > t[-1]: continue
        m = (tv >= b - 0.5 * P) & (tv < b + 0.5 * P)
        if m.sum() < 6: continue
        vv = v[m]; tt = tv[m]
        ma = np.abs(a)[(ta >= b - 0.5 * P) & (ta < b + 0.5 * P)]
        i0 = np.searchsorted(t, b - 0.5 * P); i1 = np.searchsorted(t, b + 1.5 * P)
        c = ang[i0:i1] - ang[i0]; tot = c[-1]
        if tot <= 1e-9: continue
        c = c / tot; tc = t[i0:i1] - b
        f = lambda q: tc[np.argmax(c >= q)] if (c >= q).any() else np.nan
        rows.append((1000 * (tt[vv.argmax()] - b), vv.max(), vv.min(), np.mean(vv < 0.10 * max(vv.max(), 1e-9)),
                     1000 * f(0.25), 1000 * f(0.5), 1000 * f(0.9), ma.max() if len(ma) else 0))
    R = np.array(rows); M = np.median(R, 0); A = np.array([r[7] for r in rows])
    return ('n=%3d peak@%+5.1f ms vpk %5.3f vmin %5.3f floor/peak %4.1f%% dead %4.1f%% 25/50/90%% %+4.0f/%+4.0f/%+4.0f ms max|a| p50 %5.1f p99 %5.1f max %5.1f'
            % (len(R), M[0], M[1], M[2], 100 * M[2] / max(M[1], 1e-9), 100 * M[3], M[4], M[5], M[6], M[7], np.percentile(A, 99), A.max()))
for fpath in sys.argv[1:]:
    tr = json.load(open(fpath)); C = tr['cols']; t = np.array(tr['t'], float)
    g = lambda k: np.array([np.nan if x is None else x for x in C[k]], float)
    bc = g('beatCount'); bpm = g('bpm'); P = 60 / np.nanmedian(bpm)
    ang = g(COL)
    print('%s  (%d frames, %.1f-%.1f s, clock %.2f BPM)' % (os.path.basename(fpath), len(t), t[0], t[-1], np.nanmedian(bpm)))
    print('   nudge  ' + grade(t, ang, bc, P))
    # the design step: 2pi/(PER*N) from the N column (MANDALA), else STEPK
    if 'd_N' in C:
        N = g('d_N'); per = float(os.environ.get('PER', 4)); step = 2 * np.pi / (per * N)
    else:
        step = np.full(len(t), 2 * np.pi / float(os.environ.get('STEPK', 32)))
    beats = bc[-1] - bc[0]; tot = ang[-1] - ang[0]
    print('   rad/beat over the window %.4f · design STEP (plain) %.4f · STEP*(1+DOWN/4) %.4f · N p50 %d · nN %d -> %d'
          % (tot / beats, np.nanmedian(step), np.nanmedian(step) * 1.125, int(np.nanmedian(N)) if 'd_N' in C else 0,
             int(g('d_nN')[0]) if 'd_nN' in C else 0, int(g('d_nN')[-1]) if 'd_nN' in C else 0))
    st = g('d_nstep') / step; nacc = g('d_nacc') if 'd_nacc' in C else np.zeros(len(t))
    bar = np.floor(bc / 4); bars = sorted(set(bar[np.isfinite(bar)]))
    amp = np.array([st[bar == b].mean() for b in bars]); acc = np.array([nacc[bar == b].mean() for b in bars])
    # per-beat step: the downbeat's step over the plain beats' (barPos < 1 is the downbeat)
    bp = g('barPos'); down = st[(bp < 1)]; plain = st[(bp >= 1)]
    print('   step/STEP per bar: mean %.3f min %.3f max %.3f · downbeat/plain %.3f (%.3f / %.3f) · bars with acc>0 %d / %d · acc max %.2f'
          % (amp.mean(), amp.min(), amp.max(), np.nanmedian(down) / np.nanmedian(plain), np.nanmedian(down), np.nanmedian(plain), (acc > 1e-6).sum(), len(acc), acc.max()))
    if 'd_nN' in C:
        nN = g('d_nN'); why = g('d_why'); N = g('d_N')
        idx = np.where(np.diff(nN) > 0.5)[0] + 1
        W = {1: 'phrase', 2: 'novel', 4: 'return'}
        print('   N changes: %d' % len(idx) + ''.join('  %.2f s N %d->%d (%s)' % (t[i], N[i - 1], N[i], W.get(int(why[i]), '?' + str(int(why[i])))) for i in idx))
        seams = np.where(why > 0)[0]
        print('   seams: %d (phrase %d novel %d return %d)' % (len(seams), (why == 1).sum(), (why == 2).sum(), (why == 4).sum()))
    for k in ('lum', 'lumR', 'lumC'):
        if k in C:
            L = g(k); print('   %-4s p05 %.1f p50 %.1f p95 %.1f  |d%s| p50 %.2f' % (k, np.nanpercentile(L, 5), np.nanmedian(L), np.nanpercentile(L, 95), k, np.nanmedian(np.abs(np.diff(L)))))
