#!/usr/bin/env python3
# per-BEAT table of a per-frame GIELIS window trace (SCENE=10 DT=16 SHOT=0 MIN=1 nav2-window.py): the n1 trough / peak, the Q
# swing (max − min of the loudest family's Green's Q inside the beat), the share of the beat at rest (Q ≥ REST), the waves alive
# and the kick — the brief's ruler: Q swing ≥ SWING on ≥ 90 % of the beats in the groove, the rest between beats back at Q ≥ REST.
# usage: perbeat14.py <window log> [full]      env SWING=0.15 REST=0.9
import json, os, statistics as st, sys
from collections import OrderedDict
SWING = float(os.environ.get('SWING', '0.15')); REST = float(os.environ.get('REST', '0.9'))
L = open(sys.argv[1]).read().splitlines(); rows = []
for l in L:
    if l.startswith('EVAL ') and '=> "D ' in l: rows.append(json.loads(json.loads(l.split('=> ', 1)[1])[2:]))
if len(rows) < 2: sys.exit('no D lines')
print("samples", len(rows), "span s %.2f" % (rows[-1]['t'] - rows[0]['t']), "mean dt ms %.0f" % (1000 * (rows[-1]['t'] - rows[0]['t']) / (len(rows) - 1)))
B = OrderedDict()
for d in rows: B.setdefault(d['bc'], []).append(d)
out = []
for bc, ds in B.items():
    if len(ds) < 6: continue
    q = [x['Q'] for x in ds if x['Q'] is not None]; n1 = [x['n1'] for x in ds if x['n1'] is not None]
    if not q or not n1: continue
    rest = sum(1 for v in q if v >= REST) / len(q)
    o = dict(bc=bc, n=len(ds), qmin=min(q), qmax=max(q), swing=max(q) - min(q), rest=rest, n1min=min(n1), n1max=max(n1),
             waves=max(x['waves'] or 0 for x in ds), kick=max(x['kick'] or 0 for x in ds), eS=max(x['eS'] or 0 for x in ds))
    out.append(o)
    if len(sys.argv) > 2: print(f"{bc} n{o['n']} kick {o['kick']:.2f} eS {o['eS']:.2f} n1 {o['n1min']:.2f}..{o['n1max']:.2f} Q {o['qmin']:.3f}..{o['qmax']:.3f} swing {o['swing']:.3f} rest {o['rest']:.0%} waves {o['waves']}")
if not out: sys.exit('no full beats')
ok = sum(1 for o in out if o['swing'] >= SWING); back = sum(1 for o in out if o['qmax'] >= REST)
print(f"{sys.argv[1].split('/')[-1]}: beats {len(out)} Q swing med {st.median(o['swing'] for o in out):.3f} beats swing>={SWING}: {ok}/{len(out)} ({ok/len(out):.0%})"
      f" Q rest med {st.median(o['qmax'] for o in out):.3f} beats back to Q>={REST}: {back}/{len(out)} n1 trough med {st.median(o['n1min'] for o in out):.2f}"
      f" waves med {st.median(o['waves'] for o in out):.0f} kick med {st.median(o['kick'] for o in out):.2f}")
