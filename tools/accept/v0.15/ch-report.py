#!/usr/bin/env python3
# The nine CHLADNI acceptance windows, scored against tools/truth/SeeYouDrop.json (v0.15, brief-chladni step 7).
# Reads the window traces tools/accept/v0.15/ch-windows.sh wrote (tools/work/ch-w*.json): each carries the engine's
# MS columns (`cols`) AND the scene's own per-frame state (`ch` / `chcols`, from hooks.info()), so a number here is
# what the SCENE did, not a model of it.
#   python3 tools/accept/v0.15/ch-report.py
import json
import os
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..')
W = os.path.join(ROOT, 'tools', 'work')
TRUTH = json.load(open(os.path.join(ROOT, 'tools', 'truth', 'SeeYouDrop.json')))


def load(tag):
    f = os.path.join(W, tag + '.json')
    if not os.path.exists(f):
        return None
    d = json.load(open(f))
    ch = {k: [r[i] for r in d['ch']] for i, k in enumerate(d['chcols'])}
    return ch


def runs(v, t):
    """[(t0, t1, value)] of the constant runs of v."""
    out, cur, t0 = [], None, None
    for i, x in enumerate(v):
        if x != cur:
            if cur is not None:
                out.append((t0, t[i - 1], cur))
            cur, t0 = x, t[i]
    out.append((t0, t[-1], cur))
    return out


def evts(v, t):
    return [t[i] for i, x in enumerate(v) if x]


def match(got, want, tol):
    """greedy nearest match -> (hits, F, errors)"""
    used, errs = set(), []
    for x in want:
        best, bi = 1e9, -1
        for j, y in enumerate(got):
            if j in used:
                continue
            e = abs(y - x)
            if e < best:
                best, bi = e, j
        if bi >= 0 and best <= tol:
            used.add(bi)
            errs.append(got[bi] - x)
    tp = len(used)
    p = tp / len(got) if got else 0.0
    r = tp / len(want) if want else 0.0
    f = 2 * p * r / (p + r) if p + r else 0.0
    return tp, f, errs


def med(x):
    x = sorted(x)
    return x[len(x) // 2] if x else float('nan')


FIG = [(1, 2), (3, 7), (3, 5), (1, 5), (2, 4), (2, 3), (3, 4), (1, 3), (2, 5), (1, 4), (1, 6), (4, 5)]
print('CHLADNI — the nine SeeYouDrop windows (file mode, CLOCK=1, WARM from t 0)\n')

# ---- 1. the walk ------------------------------------------------------------
c = load('ch-w1')
if c:
    t = c['t']
    sw = [(r[0], r[2]) for r in runs(c['win'], t)]
    want = [13.0, 16.1, 19.3, 22.6]
    got = [x[0] for x in sw[1:]]
    tp, f, errs = match(got, want, 1.6)
    figs = [FIG[int(round(s)) % 12] for s in [c['s'][min(range(len(t)), key=lambda i: abs(t[i] - x))] for x in (14.2, 17.2, 20.6, 23.8)]]
    print('1  walk 13-25 s — four distinct figures')
    print('   figure switches (win runs): %s' % [(round(a, 3), b) for a, b in sw])
    print('   matched %d/4 of the truth note starts %s; errors (s) %s; median %+.3f' % (tp, want, [round(e, 3) for e in errs], med(errs)))
    print('   the figures at the four shots: %s  distinct %d/4' % (figs, len(set(figs))))
    print('   tonic held: %s' % sorted(set(c['tonic'])))

# ---- 2. the groove ----------------------------------------------------------
c = load('ch-w2')
if c:
    t = c['t']
    ke = evts(c['kickEvt'], t)
    click = [x for x in TRUTH['onsets']['click'] if 25 <= x < 45]
    bare = [x for x in TRUTH['bare808'] if 25 <= x < 45]
    tp, f, errs = match(ke, click, 0.030)
    nb = sum(1 for x in ke if min([abs(x - y) for y in bare] or [9]) <= 0.030 and min([abs(x - y) for y in click] or [9]) > 0.030)
    wr = runs(c['win'], t)
    print('\n2  groove 25-45 s — a leap on every kick, the root figure holds')
    print('   kickEvt %d vs %d truth kick candidates: hits %d, F %.3f, lag median %+.1f ms (p90 %+.1f)'
          % (len(ke), len(click), tp, f, 1000 * med(errs), 1000 * sorted(errs)[int(0.9 * len(errs))] if errs else 0))
    nb2 = sum(1 for x in ke if min([abs(x - y) for y in bare] or [9]) <= 0.030)
    print('   leaps on bare 808 re-triggers and NOT on a kick candidate: %d of %d (%.1f %%); on a bare 808 at all: %d (%.1f %%)'
          % (nb, len(ke), 100.0 * nb / max(1, len(ke)), nb2, 100.0 * nb2 / max(1, len(ke))))
    print('   the leap is placed by kickAge, so its onset frame IS the kickEvt frame (0 frames by construction);'
          ' kickAge on the onset frames: median %.4f s' % med([c['kickAge'][i] for i, x in enumerate(c['kickEvt']) if x]))
    print('   figure switches in 20 s: %d  %s' % (len(wr) - 1, [(round(a, 2), v) for a, _, v in wr]))
    print('   frames on the tonic: %.1f %%' % (100.0 * sum(1 for i in range(len(t)) if c['win'][i] == c['tonic'][i]) / len(t)))

# ---- 3. the climbs ----------------------------------------------------------
g = load('ch-w2')
for tag, lo, hi, name in (('ch-w3a', 44.9, 49.9, 'climb 1'), ('ch-w3b', 96, 101, 'climb 2 (double time)')):
    c = load(tag)
    if not c or not g:
        continue
    t = c['t']
    n = len([x for x in t if lo <= x < hi])
    dur = max(1e-6, n / 60.0)
    dens = (sum(c['kickEvt']) + sum(c['snareEvt']) + sum(c['hatEvt'])) / max(1e-6, (len(t) / 60.0))
    gt = g['t']
    gdur = len(gt) / 60.0
    gdens = (sum(g['kickEvt']) + sum(g['snareEvt']) + sum(g['hatEvt'])) / gdur
    per = lambda cc, k: sum(cc[k]) / (len(cc['t']) / 60.0)
    tr = lambda cls, a, b: len([x for x in TRUTH['onsets'][cls] if a <= x < b]) / (b - a)
    print('\n3  %s %g-%g s — hit density vs the groove, and the camera rising' % (name, lo, hi))
    print('   the scene\'s hits/s %.2f vs the groove\'s %.2f  =  %.2fx  (target >= 2.5x)' % (dens, gdens, dens / gdens))
    print('   per class, this window vs the groove: kick %.2f/%.2f  snare %.2f/%.2f  hat %.2f/%.2f'
          % (per(c, 'kickEvt'), per(g, 'kickEvt'), per(c, 'snareEvt'), per(g, 'snareEvt'), per(c, 'hatEvt'), per(g, 'hatEvt')))
    print('   the TRUTH\'s own onsets/s here vs the groove: mid %.2f/%.2f  high %.2f/%.2f  click %.2f/%.2f  =  mid %.2fx high %.2fx'
          % (tr('mid', lo, hi), tr('mid', 25, 45), tr('high', lo, hi), tr('high', 25, 45), tr('click', lo, hi), tr('click', 25, 45),
             tr('mid', lo, hi) / max(1e-9, tr('mid', 25, 45)), tr('high', lo, hi) / max(1e-9, tr('high', 25, 45))))
    print('   bassReg %.3f -> %.3f, camera pitch %.3f -> %.3f rad, dist %.2f -> %.2f'
          % (c['bassReg'][0], c['bassReg'][-1], c['pitch'][0], c['pitch'][-1], c['dist'][0], c['dist'][-1]))

# ---- 4. the void ------------------------------------------------------------
c = load('ch-w4')
if c:
    t = c['t']
    print('\n4  void 49.9-57.6 s — the plate is silent, the sand floats, the spiral winds in')
    sel = [i for i in range(len(t)) if t[i] >= 50.6]
    print('   plate amplitude over the whole window: max %.4f, mean %.4f' % (max(c['amp']), sum(c['amp']) / len(c['amp'])))
    print('   once the climb has released (from 50.6 s): max %.4f, mean %.4f  (target < 0.05)'
          % (max(c['amp'][i] for i in sel), sum(c['amp'][i] for i in sel) / len(sel)))
    print('   the ring-down: amp crosses 0.05 at heard %.3f s (the void starts 49.9)'
          % next((t[i] for i in range(len(t)) if c['amp'][i] < 0.05), float('nan')))
    print('   lift %.3f -> %.3f   spiral %.3f -> %.3f   buildProg %.3f -> %.3f' %
          (c['lift'][0], c['lift'][-1], c['spiral'][0], c['spiral'][-1], c['buildProg'][0], c['buildProg'][-1]))
    print('   hats in the window: %d  snares %d  kicks %d' % (sum(c['hatEvt']), sum(c['snareEvt']), sum(c['kickEvt'])))
    print('   camera pitch %.3f -> %.3f rad (the build tilts it up)' % (c['pitch'][0], c['pitch'][-1]))

# ---- 5. the drops -----------------------------------------------------------
for tag, want, name in (('ch-w5a', 57.606, 'drop 1'), ('ch-w5b', 105.596, 'drop 2')):
    c = load(tag)
    if not c:
        continue
    t = c['t']
    de = evts(c['mapDropEvt'], t)
    print('\n5  %s — the slam on the drop\'s own bar line' % name)
    if de:
        i = t.index(de[0])
        print('   mapDropEvt at heard %.4f s, truth %.3f, error %+.1f ms = %+.2f frames' % (de[0], want, 1000 * (de[0] - want), (de[0] - want) * 60))
        print('   the scene on that frame: kickAge %.4f (re-armed), kickVel %.2f, amp %.3f -> %.3f over the next 0.5 s'
              % (c['kickAge'][i], c['kickVel'][i], c['amp'][i], c['amp'][min(len(t) - 1, i + 30)]))
    else:
        print('   NO mapDropEvt in the window')

# ---- 6. the slides ----------------------------------------------------------
c = load('ch-w6')
if c:
    t = c['t']
    sl = [s for s in TRUTH['sub_slides'] if 57.6 <= s['t0'] < 90]
    hit = 0
    moves = []
    for s in sl:
        sel = [i for i in range(len(t)) if s['t0'] - 0.1 <= t[i] <= s['t1'] + 0.45]
        if not sel:
            continue
        v = [c['s'][i] for i in sel]
        d = max(v) - min(v)
        if d > 6:
            d = 12 - d
        moves.append(d)
        if d > 0.25:
            hit += 1
    print('\n6  slides 57.6-90 s — every slide is a figure morphing back into the root')
    print('   truth slides in the window: %d; the figure moved > 0.25 semitone on %d of them (%.0f %%)' % (len(sl), hit, 100.0 * hit / max(1, len(sl))))
    print('   median figure movement per slide: %.3f semitones (max %.3f)' % (med(moves), max(moves) if moves else 0))
    print('   frames on the tonic figure: %.1f %%' % (100.0 * sum(1 for i in range(len(t)) if c['win'][i] == c['tonic'][i]) / len(t)))

# ---- 7. the gated drop 2 ----------------------------------------------------
c = load('ch-w7')
if c:
    t = c['t']
    dips, inside = [], False
    for i in range(len(t)):
        if c['gate'][i] < 0.6 and not inside:
            inside, lo, lot = True, c['gate'][i], t[i]
        elif inside:
            if c['gate'][i] < lo:
                lo, lot = c['gate'][i], t[i]
            if c['gate'][i] > 0.8:
                dips.append((lot, lo))
                inside = False
    gaps = [round(dips[i + 1][0] - dips[i][0], 3) for i in range(len(dips) - 1)]
    print('\n7  gated 105.7-130 s — the plate stops on every duck, deepest once a bar')
    print('   gate dips below 0.6: %d in %.1f s  (one per %.2f s; the bar is 1.60 s)' % (len(dips), t[-1] - t[0], (t[-1] - t[0]) / max(1, len(dips))))
    print('   the deepest dip %.3f; median dip %.3f; spacing median %.2f s %s' %
          (min(d[1] for d in dips) if dips else 1, med([d[1] for d in dips]), med(gaps), gaps[:10]))
    print('   amp median %.3f, min %.3f — the figure blinks out and comes back' % (med(c['amp']), min(c['amp'])))

# ---- 8. the outro -----------------------------------------------------------
c = load('ch-w8')
if c:
    t = c['t']
    wr = [(round(a, 2), v) for a, _, v in runs(c['win'], t)]
    print('\n8  outro 134.5-157 s — the fog closes, the walk\'s figures come back, the sand settles')
    print('   lpSweep %.3f -> %.3f  (the scene\'s fog follows it exactly: %.3f -> %.3f)' % (c['lpSweep'][0], c['lpSweep'][-1], c['fog'][0], c['fog'][-1]))
    print('   the walk returns: %s' % wr)
    print('   distinct figures in the outro: %d; plate boundary (0 square, 1 round) %.2f -> %.2f' % (len(set(c['win'])), c['bnd'][0], c['bnd'][-1]))
    print('   amp %.3f -> %.3f' % (c['amp'][0], c['amp'][-1]))

print('\n9  brightness — see tools/work/ch-p95.py on the groove shots (tools/lum.py has no percentile field)')
