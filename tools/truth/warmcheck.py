#!/usr/bin/env python3
"""The WARM-UP ruler (live step 3 warm-up, 2026-09-28, docs/AUDIT-live-grid.md "Step 3 — warm-up"): how right the predicted
hits are in the first seconds after a cold start, against later, and how long the store stays quiet. numpy only.

    python3 tools/truth/warmcheck.py <dir>                 # every <Track>-cold*.json / <Track>-whole.json replay in <dir>
    python3 tools/truth/warmcheck.py --clock <cold.json>:<warm.json>:<t0> ...   # the v3 heard-grid lag, cold vs warm

Rows per track: `first 12 s` = P (share within +-30 ms of a truth onset) and median lag of the releases in the 12 s after
each cold trace's FIRST release, summed over the cold starts; `after` = P of the rest of each cold trace; `quiet` = seconds
from the trace's first frame to its first release, per cold start; `warm, same s` = the whole-track run's P inside exactly those early windows (the same audio, a warm store: the
target); `whole` = F / P / n over a whole-track trace (the steady
state, which must not fall). --clock bins the v3 beat line (heard grid: raw + the det lead) against the truth per 4 s since
t0, the cold trace beside the warm one over the same audio — the clocks' own settling (hypothesis 4).
Traces: tools/warm-rec.sh records them (det, &map=0&lead=0), tools/warm-ruler.sh replays them through the current tree.
"""
import json, os, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from compare import match, evframes, TOL_EV  # noqa: E402
from predcheck import CLS  # noqa: E402

FIRST = 12.0

def ld(p): return json.load(open(p))
def truth(tr): return ld(os.path.join(HERE, f"{tr['track']}.json"))
def rel_of(tr, cls): return np.array(tr['t'])[evframes(tr['cols']['pred' + cls.capitalize() + 'Evt'])]

def cold(paths, tag, warm=None):
    agg = {c: [0, 0, []] for c, _ in CLS}; late = {c: [0, 0] for c, _ in CLS}; quiet = []; wins = []
    for p in paths:
        tr = ld(p); T = truth(tr); t0 = tr['t'][0]
        firsts = [r[0] for r in (rel_of(tr, c) for c, _ in CLS) if len(r)]
        if not firsts: quiet.append(None); continue
        f = min(firsts); quiet.append(f - t0); wins.append((f, f + FIRST))
        for cls, key in CLS:
            ref = np.array(T['onsets'][key]); r = rel_of(tr, cls)
            pairs, _, _ = match(r, ref, TOL_EV); good = {a: a - b for a, b in pairs}
            e = r[r < f + FIRST]; agg[cls][0] += len(e); agg[cls][1] += sum(a in good for a in e); agg[cls][2] += [good[a] for a in e if a in good]
            l = r[r >= f + FIRST]; late[cls][0] += len(l); late[cls][1] += sum(a in good for a in l); late[cls] += [good[a] for a in l if a in good]
    s = ' · '.join(f'{c} {agg[c][1]}/{agg[c][0]}={agg[c][1] / max(1, agg[c][0]):.2f} ({1000 * np.median(agg[c][2]) if agg[c][2] else 0:+.0f} ms)' for c, _ in CLS)
    s2 = ' · '.join(f'{c} {late[c][1] / max(1, late[c][0]):.2f} ({1000 * np.median(late[c][2:]) if late[c][2:] else 0:+.0f} ms)' for c, _ in CLS)
    allp = sum(agg[c][1] for c in agg) / max(1, sum(agg[c][0] for c in agg))
    print(f'{tag:11s} first {FIRST:g} s: {s} | all {allp:.2f} || after: {s2} || quiet s: ' + ' '.join('-' if x is None else f'{x:.1f}' for x in quiet))
    if warm and wins:                       # the warm run on the SAME audio: the target the first seconds are held to
        tr = ld(warm); T = truth(tr); out = []; na = ta = 0
        for cls, key in CLS:
            ref = np.array(T['onsets'][key]); r = rel_of(tr, cls); pairs, _, _ = match(r, ref, TOL_EV); good = {a for a, _ in pairs}
            e = [a for a in r if any(w0 <= a < w1 for w0, w1 in wins)]; n = len(e); tp = sum(a in good for a in e); na += n; ta += tp
            out.append(f'{cls} {tp}/{n}={tp / max(1, n):.2f}')
        print(f'{"":11s} warm, same s: ' + ' · '.join(out) + f' | all {ta / max(1, na):.2f}')

def whole(p, tag):
    tr = ld(p); T = truth(tr); out = []
    for cls, key in CLS:
        ref = np.array(T['onsets'][key]); r = rel_of(tr, cls); pairs, _, _ = match(r, ref, TOL_EV)
        P = len(pairs) / max(1, len(r)); R = len(pairs) / max(1, len(ref)); F = 2 * P * R / max(1e-9, P + R)
        out.append(f'{cls} F {F:.2f} P {P:.2f} n {len(r)}')
    print(f'{tag:11s} whole: ' + ' · '.join(out))

def clock_lag(tr, t0, t1):
    T = truth(tr); b = np.array(T['beats']); t = np.array(tr['t'])
    g = lambda k: np.array([np.nan if x is None else x for x in tr['cols'][k]], float)
    bp, bpm = g('beatPhase'), g('bpm')
    m = (t >= t0) & (t < t1) & (t > b[0]) & (t < b[-1]); t, bp, bpm = t[m], bp[m], bpm[m]
    k = np.searchsorted(b, t) - 1; P = b[k + 1] - b[k]; phi = (t - b[k]) / P
    ok = abs(bpm / (60 / P) - 1) < 0.02
    hp = bp - (tr.get('detLead') or 0.0427) * bpm / 60
    return t, ((phi - hp + 0.5) % 1 - 0.5) * P * 1000, ok

def clock(args, W=4.0):
    for arg in args:
        c, w, t0 = arg.split(':'); t0 = float(t0)
        tc, dc, oc = clock_lag(ld(c), t0, t0 + 40); tw, dw, ow = clock_lag(ld(w), t0, t0 + 40)
        print(f'{os.path.basename(c)} from {t0}: v3 heard-grid lag, median ms (in-octave share)   cold | warm')
        f = lambda d, o, m: f'{np.median(d[m & o]):+5.0f} ({100 * np.mean(o[m]):3.0f} %)' if (m & o).sum() else '   -  (  0 %)'
        for i in range(10):
            a = (tc >= t0 + i * W) & (tc < t0 + (i + 1) * W); b_ = (tw >= t0 + i * W) & (tw < t0 + (i + 1) * W)
            print(f'  {i * W:4.0f}-{(i + 1) * W:<4.0f}s  {f(dc, oc, a)} | {f(dw, ow, b_)}')

if __name__ == '__main__':
    a = sys.argv[1:]
    if not a: print(__doc__); sys.exit(2)
    if a[0] == '--clock': clock(a[1:]); sys.exit(0)
    d = a[0]; names = sorted(x for x in os.listdir(d) if x.endswith('.json'))
    for tk in sorted({x.split('-cold')[0].replace('rp-', '') for x in names if '-cold' in x}):
        w = [x for x in names if x.replace('rp-', '') == f'{tk}-whole.json']
        cold([os.path.join(d, x) for x in names if x.replace('rp-', '').startswith(f'{tk}-cold')], tk, os.path.join(d, w[0]) if w else None)
        if w: whole(os.path.join(d, w[0]), tk)
