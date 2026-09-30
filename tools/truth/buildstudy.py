#!/usr/bin/env python3
"""The BUILD CANDIDATE STUDY (live step 4 B.1, docs/AUDIT-live-grid.md "Step 4 — build / drop"): which causal signals rise /
change reliably in the 16 bars before a truth drop and not elsewhere — at which grain, how many beats ahead, with what
signature. numpy only. Reads the node traces of tools/build-node.js (the page trace format; any trace carrying the columns).

    python3 tools/truth/buildstudy.py tools/work/build/node-*.json [--pre 16] [--top 25] [--md out.md] [--png dir] [--sig]
    python3 tools/truth/buildstudy.py tools/work/build/node-*.json --arms      # the B.2 candidate arm rules, dropcheck-graded

Per candidate x (a level, or an event column turned into a rate), per GRAIN g in 8, 5, 3, 2, 1, 0.569, 0.224 s (the user's
analysis grains), three CAUSAL transforms (trailing windows only):
  lvl   the mean of x over the last g s
  rise  lvl(t) - lvl(t - g): the change across one grain
  dev   lvl(t) - the mean over the last 32 s (the track's recent state, what a live detector can know)
  rel   lvl(t) / that 32 s mean (scale-free across tracks; levels >= 0)
Frames in [D - PRE bars, D) of a truth drop D are PRE (--pre, default 16; 4 = the last phrase quarter); every other frame (after the first 10 s) is ELSEWHERE. The truth grid
(bar = 4 local beats) is used to LABEL only. Scores:
  AUC       P(x at a PRE frame > x at an ELSEWHERE frame), per drop track and pooled; reported as the directional
            AUC (>= 0.5) with the sign (+ = higher before drops, - = lower). `min` = the worst drop track.
  CN fpr    the threshold at the pooled PRE median (half the PRE frames above it, in the candidate's direction): the share
            of CyborgNinja frames (no drop — the false-alarm control) and of drop-track ELSEWHERE frames past it.
  lead      per drop, beats before D that the transform stays past the ELSEWHERE p90 (CyborgNinja included) up to D - 1
            beat (dropcheck.py's run rule: gaps <= 1 beat bridged), and that arm rule's false arms / min (dropcheck's:
            no drop within 16 bars of the onset) on the drop tracks and on CyborgNinja.
--arms grades the candidate ARM RULES (ARMS below — causal: trailing means only) the way dropcheck.py grades a field:
anticipation per drop, false arms / min on the drop tracks and on CyborgNinja, armed %, and each run's span (s).
--sig prints per drop the 16 bars before it, one row per candidate, each bar's mean as a percentile of that track's
ELSEWHERE frames (so 90 = higher than 90 % of the non-build time).
"""
import json, os, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from dropcheck import Truth, grade_level  # noqa: E402

GRAINS = [8, 5, 3, 2, 1, 0.569, 0.224]
PRE_BARS, SKIP, BASE = 16, 10.0, 32.0
LEVELS = ['denK', 'denS', 'denH', 'subGate', 'subPure', 'subConf', 'bassReg', 'lpSweep', 'width', 'pulse',
          'synTension', 'hush', 'riser', 'roll', 'hp', 'swell', 'gap', 'synAll', 'synEvS', 'dropConf', 'gridTrust', 'phraseConf',
          'eFast', 'eShort', 'eMed', 'eLong', 'bassS', 'midS', 'highS', 'sub', 'lvl', 'centroid', 'flux', 'novelty', 'foote',
          'kickGap', 'bShort', 'bLong', 'rollRate', 'dens', 'densSlow', 'calm',
          'build', 'buildPk', 'eS', 'eM', 'eL', 'absentT', 'onsetRate', 'tension', 'bass', 'high', 'highM', 'presence']
EVENTS = ['subIn', 'subOut', 'kickEvt', 'snareEvt', 'hatEvt', 'synBoundaryEvt']
SIG = ['denK', 'denS', 'denH', 'subGate', 'lpSweep', 'width', 'bassS', 'highS', 'lvl', 'centroid', 'riser', 'rollRate', 'synTension',
       'build', 'kickGap', 'eShort']

def _m(tk, k, g): return trail(tk['raw'][k], max(1, int(round(g * tk['fps']))))
def _rel(tk, k, g, base=BASE): return _m(tk, k, g) / (np.abs(_m(tk, k, base)) + 1e-3)
ARMS = {   # name -> fn(track) -> bool mask; the numbers of AUDIT-live-grid Step 4 B.1
    'hp 5 s > 0.1': lambda tk: _m(tk, 'hp', 5) > 0.1,
    'hp 5 s > 0.05': lambda tk: _m(tk, 'hp', 5) > 0.05,
    'hp 2 s > 0.2': lambda tk: _m(tk, 'hp', 2) > 0.2,
    'bassS 2 s < 0.6 x its 32 s': lambda tk: _rel(tk, 'bassS', 2) < 0.6,
    'bassS 2 s < 0.4 x its 32 s': lambda tk: _rel(tk, 'bassS', 2) < 0.4,
    'hp 5 s > 0.1 & bassS 2 s < 0.8 x': lambda tk: (_m(tk, 'hp', 5) > 0.1) & (_rel(tk, 'bassS', 2) < 0.8),
    'hp 5 s > 0.1 | bassS 2 s < 0.6 x': lambda tk: (_m(tk, 'hp', 5) > 0.1) | (_rel(tk, 'bassS', 2) < 0.6),
    'subConf 5 s < 0.6 x its 32 s': lambda tk: _rel(tk, 'subConf', 5) < 0.6,
    'subGate 5 s < 0.7 x its 32 s': lambda tk: _rel(tk, 'subGate', 5) < 0.7,
    'v3 build >= 0.5 (baseline)': lambda tk: tk['raw']['build'] >= 0.5,
}

def arms(tks):
    from dropcheck import bridged
    print(f"{'arm rule':34s} {'anticipation beats per drop':34s} {'false/min drop':>14s} {'CN':>5s}  armed % per track")
    for name, fn in ARMS.items():
        ants, fd, fc, md, mc, arm, spans = [], 0, 0, 0.0, 0.0, [], []
        for tk in tks:
            m = fn(tk) & tk['use']; g = grade_level(tk['t'], m, tk['T']); mins = (tk['t'][-1] - SKIP) / 60
            arm.append(f"{tk['track'][:4]} {100 * g['armed']:.1f}")
            if len(tk['T'].drops): ants += g['ant']; fd += g['false']; md += mins
            else: fc += g['false']; mc += mins
            spans += [f"{tk['track'][:4]} {a:.1f}-{b:.1f}" for a, b in bridged(m, tk['t'], tk['T'].beat_med())]
        print(f"{name:34s} {' '.join(f'{a:.1f}' for a in ants):34s} {fd / max(md, 1e-9):14.2f} {fc / max(mc, 1e-9):5.2f}  {' · '.join(arm)}")
        print(f"{'':34s} runs: {', '.join(spans)}")

def trail(x, n):
    """Trailing mean over n frames (causal), the first frames over what exists."""
    c = np.cumsum(np.r_[0.0, x]); i = np.arange(1, len(x) + 1); j = np.maximum(0, i - n)
    return (c[i] - c[j]) / (i - j)

def lag(x, n):
    return np.r_[np.full(n, x[0]), x[:-n]] if n > 0 else x

def auc(pos, neg):
    """Mann-Whitney AUC with ties halved."""
    if not len(pos) or not len(neg): return np.nan
    a = np.r_[pos, neg]; r = np.empty(len(a)); o = np.argsort(a, kind='mergesort'); r[o] = np.arange(1, len(a) + 1)
    s = a[o]; d = np.r_[True, s[1:] != s[:-1], True]; st = np.where(d)[0]
    for k in range(len(st) - 1):
        if st[k + 1] - st[k] > 1: r[o[st[k]:st[k + 1]]] = (st[k] + 1 + st[k + 1]) / 2
    return (r[:len(pos)].sum() - len(pos) * (len(pos) + 1) / 2) / (len(pos) * len(neg))

def load(p, pre_bars=PRE_BARS):
    tr = json.load(open(p)); T = Truth.load(tr['track']); t = np.asarray(tr['t'], float)
    fps = round(1 / np.median(np.diff(t)))
    raw = {}
    for k in LEVELS:
        if k in tr['cols']: raw[k] = np.nan_to_num(np.array([np.nan if v is None else float(v) for v in tr['cols'][k]]))
    for k in EVENTS:
        if k in tr['cols']: raw[k] = np.array([0.0 if v is None else float(v) for v in tr['cols'][k]]) * fps   # a rate: events / s
    pre = np.zeros(len(t), bool)
    for D in T.drops: pre |= (t >= D - pre_bars * 4 * T.beat(D)) & (t < D)
    return dict(track=tr['track'], t=t, fps=fps, T=T, raw=raw, pre=pre, use=t >= SKIP)

def feats(tk, k):
    """-> {(transform, grain): array} for candidate k."""
    x, fps = tk['raw'][k], tk['fps']; out = {}; nb = int(BASE * fps)
    base = trail(x, nb)
    for g in GRAINS:
        n = max(1, int(round(g * fps))); m = trail(x, n)
        out[('lvl', g)] = m; out[('rise', g)] = m - lag(m, n); out[('dev', g)] = m - base
        out[('rel', g)] = m / (np.abs(base) + 1e-3)
    return out

def study(paths, top=25, md=None, png=None, sig=False, pre_bars=PRE_BARS):
    tks = [load(p, pre_bars) for p in paths]
    print(f'PRE = the {pre_bars} bars before each truth drop')
    drop_tks = [tk for tk in tks if len(tk['T'].drops)]; cn = [tk for tk in tks if not len(tk['T'].drops)]
    cands = sorted(set().union(*[set(tk['raw']) for tk in tks]), key=lambda k: (LEVELS + EVENTS).index(k))
    rows = []
    for k in cands:
        F = {tk['track']: feats(tk, k) for tk in tks if k in tk['raw']}
        for key in F[drop_tks[0]['track']]:
            per = {}; P, N, C = [], [], []
            for tk in drop_tks:
                v = F[tk['track']][key]; u = tk['use']
                p, n = v[u & tk['pre']], v[u & ~tk['pre']]; per[tk['track']] = auc(p, n); P.append(p); N.append(n)
            for tk in cn: C.append(F[tk['track']][key][tk['use']])
            P, N = np.concatenate(P), np.concatenate(N); C = np.concatenate(C) if C else np.array([])
            A = auc(P, np.r_[N, C]); sgn = 1 if A >= 0.5 else -1
            dirA = lambda a: a if sgn > 0 else 1 - a
            th = np.median(P); past = (lambda v: v > th) if sgn > 0 else (lambda v: v < th)
            rows.append(dict(k=k, tf=key[0], g=key[1], sgn=sgn, A=dirA(A), per={tr: dirA(a) for tr, a in per.items()},
                             mn=min(dirA(a) for a in per.values()), cn=dirA(auc(P, C)) if len(C) else np.nan,
                             fcn=float(past(C).mean()) if len(C) else np.nan, fel=float(past(N).mean())))
    # rank: the pooled AUC (drop-track elsewhere + CN), ties by the worst track
    rows.sort(key=lambda r: (-(r['A'] + 0.5 * r['mn']), r['k']))
    best = {}
    for r in rows:
        if r['k'] not in best: best[r['k']] = r
    ranked = sorted(best.values(), key=lambda r: -(r['A'] + 0.5 * r['mn']))[:top]
    trs = [tk['track'] for tk in drop_tks]
    head = f"{'candidate':12s} {'tf':4s} {'grain':>5s} {'dir':3s} {'AUC':>5s} {'min':>5s} " + ' '.join(f'{t[:10]:>10s}' for t in trs) + \
        f" {'vs CN':>6s} {'CN fpr':>6s} {'else fpr':>8s}  lead beats per drop (p90 elsewhere) · false arms/min drop tracks / CN"
    print(head); lines = ['| candidate | transform | grain s | dir | AUC pooled | min track | ' + ' | '.join(trs) +
                          ' | AUC vs CN | CN frames past | elsewhere past | lead beats per drop |', '|' + '---|' * (10 + len(trs))]
    for r in ranked:
        leads, fd, fc = lead_beats(tks, drop_tks, r)
        ls = ' '.join(f'{x:.0f}' for x in leads) + f' · false/min {fd:.2f} / CN {fc:.2f}'
        print(f"{r['k']:12s} {r['tf']:4s} {r['g']:5.3g} {'+' if r['sgn'] > 0 else '-':3s} {r['A']:5.2f} {r['mn']:5.2f} " +
              ' '.join(f"{r['per'][t]:10.2f}" for t in trs) + f" {r['cn']:6.2f} {r['fcn']:6.2f} {r['fel']:8.2f}  {ls}")
        lines.append(f"| `{r['k']}` | {r['tf']} | {r['g']:.3g} | {'+' if r['sgn'] > 0 else '−'} | {r['A']:.2f} | {r['mn']:.2f} | " +
                     ' | '.join(f"{r['per'][t]:.2f}" for t in trs) + f" | {r['cn']:.2f} | {r['fcn']:.2f} | {r['fel']:.2f} | {ls} |")
    # the grain profile of the top few: the AUC per grain
    print('\nAUC by grain (pooled, directional) for the top candidates:')
    print(f"{'':18s}" + ' '.join(f'{g:>6.3g}' for g in GRAINS))
    for r in ranked[:10]:
        by = {rr['g']: rr['A'] for rr in rows if rr['k'] == r['k'] and rr['tf'] == r['tf']}
        print(f"{r['k'] + ' ' + r['tf']:18s}" + ' '.join(f'{by[g]:6.2f}' for g in GRAINS))
    if md:
        with open(md, 'w') as fh: fh.write('\n'.join(lines) + '\n')
        print('md ->', md)
    if sig: signature(tks, drop_tks)
    if png: plot(tks, png)
    return ranked

def lead_beats(tks, drop_tks, r):
    """Per drop: beats the transform stays past the ELSEWHERE p90 (drop tracks + CN) up to D - 1 beat; plus the same arm
    rule's false arms / min (dropcheck's rule: an onset with no drop within 16 bars) on the drop tracks and on CN."""
    vals = {tk['track']: feats(tk, r['k'])[(r['tf'], r['g'])] for tk in tks if r['k'] in tk['raw']}
    el = np.concatenate([vals[tk['track']][tk['use'] & ~tk['pre']] for tk in tks if tk['track'] in vals])
    th = np.percentile(el, 90 if r['sgn'] > 0 else 10)
    out, fd, fc, md, mc = [], 0, 0, 0.0, 0.0
    for tk in tks:
        v = vals[tk['track']]; m = ((v > th) if r['sgn'] > 0 else (v < th)) & tk['use']
        g = grade_level(tk['t'], m, tk['T']); mins = (tk['t'][-1] - SKIP) / 60
        if len(tk['T'].drops): out += g['ant']; fd += g['false']; md += mins
        else: fc += g['false']; mc += mins
    return out, fd / max(md, 1e-9), fc / max(mc, 1e-9)

def signature(tks, drop_tks):
    """Per drop: the 16 bars before it, each bar's mean per candidate as a percentile of the track's ELSEWHERE frames."""
    for tk in drop_tks:
        t, T = tk['t'], tk['T']
        for D in T.drops:
            bar = 4 * T.beat(D)
            print(f"\n== {tk['track']} drop {D:.1f} s — bars -16 .. -1 (percentile of the track's elsewhere), then the drop bar")
            print(f"{'':12s}" + ''.join(f'{b:>4d}' for b in range(-16, 1)))
            for k in SIG:
                if k not in tk['raw']: continue
                x = tk['raw'][k]; el = np.sort(x[tk['use'] & ~tk['pre']]); row = []
                for b in range(-16, 1):
                    m = (t >= D + b * bar) & (t < D + (b + 1) * bar)
                    row.append(100 * np.searchsorted(el, x[m].mean()) / len(el) if m.any() else np.nan)
                print(f'{k:12s}' + ''.join(f'{v:4.0f}' for v in row))

def plot(tks, out):
    try:
        import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
    except Exception:
        print('no matplotlib: --png skipped'); return
    os.makedirs(out, exist_ok=True)
    show = ['lvl', 'bassS', 'highS', 'centroid', 'denS', 'denH', 'subGate', 'hp', 'riser', 'build']
    for tk in tks:
        t = tk['t']; fig, ax = plt.subplots(len(show), 1, figsize=(14, 1.1 * len(show)), sharex=True)
        for a, k in zip(ax, show):
            if k not in tk['raw']: continue
            a.plot(t, trail(tk['raw'][k], tk['fps']), lw=0.6, color='#333'); a.set_ylabel(k, rotation=0, ha='right', fontsize=8)
            for D in tk['T'].drops:
                a.axvspan(D - PRE_BARS * 4 * tk['T'].beat(D), D, color='#f4a', alpha=0.15); a.axvline(D, color='#c03', lw=1)
            a.tick_params(labelsize=7)
        ax[-1].set_xlabel('heard s (1 s trailing mean; pink = the 16 bars before a truth drop)')
        fig.suptitle(tk['track']); fig.tight_layout()
        p = os.path.join(out, f"build-{tk['track']}.png"); fig.savefig(p, dpi=90); plt.close(fig); print('png ->', p)

if __name__ == '__main__':
    a = sys.argv[1:]
    if not a: print(__doc__); sys.exit(2)
    opt = lambda k, d=None: a[a.index(k) + 1] if k in a else d
    paths = [x for i, x in enumerate(a) if not x.startswith('--') and (i == 0 or a[i - 1] not in ('--top', '--md', '--png', '--pre'))]
    if '--arms' in a: arms([load(p) for p in paths]); sys.exit(0)
    study(paths, int(opt('--top', 25)), opt('--md'), opt('--png'), '--sig' in a, float(opt('--pre', PRE_BARS)))
