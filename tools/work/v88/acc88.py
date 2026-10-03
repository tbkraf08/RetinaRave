#!/usr/bin/env python3
"""§88 ruler: the accent, the glint's lever, the fires' identity, the dynamic range and the hue — on MANDALA's step-4 traces.
usage: acc88.py <s4-syd> <s4-vienna-24-60> <s4-vienna-80-110> <s4-cn> --s2 <dir of the step-2 traces> --before <before-syd> [--dust <dust syd trace>]"""
import json, os, sys, hashlib
import numpy as np
a = sys.argv[1:]; opt = lambda k, d=None: a[a.index(k) + 1] if k in a else d
paths = [x for x in a[:4]]
def load(p):
    d = json.load(open(p)); C = d['cols']; t = np.array(d['t'], float)
    return d, C, t, (lambda k: np.array([np.nan if x is None else x for x in C[k]], float))
md5 = lambda c, k: hashlib.md5(json.dumps(c[k]).encode()).hexdigest()[:8]
for p in paths:
    d, C, t, g = load(p); T = d['track']; name = os.path.basename(p)
    nacc = g('d_nacc'); hG = g('d_hG'); fH = g('d_fH'); aH = g('d_aH'); lumR = g('lumR')
    print('%s %s %.0f-%.0f s · nacc max %.2f · frames nacc>0 %d / %d · hG max %.3f' % (name, T, t[0], t[-1], np.nanmax(nacc), int(np.sum(nacc > 1e-6)), len(t), np.nanmax(hG)))
    # fires md5 against the step-2 trace of the same window
    s2 = os.path.join(opt('--s2', 'tools/work/v86'), name.replace('s4-', 's2-'))
    if os.path.exists(s2):
        c2 = json.load(open(s2))['cols']
        same = all(md5(C, k) == md5(c2, k) for k in ('d_fK', 'd_fS', 'd_fH'))
        print('   fK fS fH md5 vs step 2: %s %s %s · %s' % (md5(C, 'd_fK'), md5(C, 'd_fS'), md5(C, 'd_fH'), 'IDENTICAL' if same else 'DIFFER (%s %s %s)' % tuple(md5(c2, k) for k in ('d_fK', 'd_fS', 'd_fH'))))
    if T == 'Vienna' and t[0] >= 79:
        for (w0, w1, lab) in ((90, 98, '1:30-1:38'), (98, 103, '1:38-1:43'), (103, 110, '1:43-1:50')):
            m = (t >= w0) & (t < w1)
            idx = np.where(np.diff(fH) > 0.5)[0] + 1; idx = idx[m[idx]]
            lift = np.array([np.nanmax(lumR[i:i + 4]) - lumR[i - 1] for i in idx if i >= 1 and i + 4 <= len(t)])
            amp = aH[idx]
            print('   %s: nacc p10 %.2f p50 %.2f max %.2f · hat fires %d (%.2f /s) amp/hit p50 %.3f · lumR lift/hit p50 %.2f mean %.2f vs |dlumR| %.2f = %.1fx · nstep/STEP p50 %.3f'
                  % (lab, np.nanpercentile(nacc[m], 10), np.nanmedian(nacc[m]), np.nanmax(nacc[m]), len(idx), len(idx) / (w1 - w0), np.nanmedian(amp) if len(amp) else float('nan'),
                     np.nanmedian(lift) if len(lift) else float('nan'), np.nanmean(lift) if len(lift) else float('nan'), np.nanmedian(np.abs(np.diff(lumR[m]))),
                     (np.nanmedian(lift) / np.nanmedian(np.abs(np.diff(lumR[m])))) if len(lift) else float('nan'),
                     np.nanmedian(g('d_nstep')[m] / np.minimum(2 * np.pi / (4 * g('d_N')[m]), 2 * np.pi / 32))))
    if T == 'SeeYouDrop':
        lum = g('lum'); bf = json.load(open(opt('--before')))
        lb = np.array(bf['cols']['lum'], float); tb = np.array(bf['t'], float)
        for (w0, w1, lab) in ((90, 105, 'breakdown'), (106, 110, 'drop')):
            print('   lum p50 %-9s after %.1f · before %.1f' % (lab, np.nanmedian(lum[(t >= w0) & (t < w1)]), np.nanmedian(lb[(tb >= w0) & (tb < w1)])))
        r_a = np.nanmedian(lum[(t >= 90) & (t < 105)]) / np.nanmedian(lum[(t >= 106) & (t < 110)]); r_b = np.nanmedian(lb[(tb >= 90) & (tb < 105)]) / np.nanmedian(lb[(tb >= 106) & (tb < 110)])
        print('   breakdown/drop p50 ratio after %.3f · before %.3f · %s' % (r_a, r_b, 'NOT LARGER' if r_a <= r_b else 'LARGER'))
        # nacc at the returns (91.67 / 98.05 / 109.27) and elsewhere
        ret = g('barReturnEvt'); rt_ = t[np.where(ret > 0.5)[0]]
        near = np.zeros(len(t), bool)
        for x in rt_: near |= (t >= x - 0.5) & (t < x + 7)
        print('   nacc max within 7 s after a return %.2f · max elsewhere %.2f · returns at %s' % (np.nanmax(nacc[near]) if near.any() else 0, np.nanmax(nacc[~near]), ['%.2f' % x for x in rt_]))
        # the hue per truth section, against DUST's §80 trace (d_hue), both the keycolour anchor
        tj = json.load(open('tools/truth/SeeYouDrop.json')); hue = g('d_hue'); kc = g('d_kconf')
        du = opt('--dust')
        if du:
            dd = json.load(open(du)); th = np.array(dd['t'], float); hd = np.array([np.nan if x is None else x for x in dd['cols']['d_hue']], float)
            rows = []
            for s in tj['sections']:
                if s['t1'] < t[0] or s['t0'] > t[-1]: continue
                m = (t >= s['t0']) & (t < s['t1']); md = (th >= s['t0']) & (th < s['t1'])
                if m.sum() < 10 or md.sum() < 10: continue
                rows.append('%.1f-%.1f: %.3f / %.3f (kconf %.2f)' % (s['t0'], s['t1'], np.nanmedian(hue[m]) % 1, np.nanmedian(hd[md]) % 1, np.nanmedian(kc[m])))
            print('   hue per truth section MANDALA / DUST (turns, p50): ' + ' · '.join(rows))
    if T == 'CyborgNinja':
        print('   CONTROL: nacc > 0 on %d frames (max %.3f) · hG max %.3f' % (int(np.sum(nacc > 1e-6)), np.nanmax(nacc), np.nanmax(hG)))
