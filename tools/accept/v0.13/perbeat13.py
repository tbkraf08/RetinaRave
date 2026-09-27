#!/usr/bin/env python3
# per-BEAT table of a per-frame nav2-window trace (DT=16 SHOT=0 MIN=1): the press, rho peak / trough, the share of the beat above
# rho 0.9 (the pinch) and below 0.6 (near the circle), the Q swing. usage: perbeat13.py <window log> [full]
import json,re,statistics as st,sys
L=open(sys.argv[1]).read().splitlines(); rows=[]
for l in L:
    if l.startswith('EVAL ') and '=> "D ' in l: rows.append(json.loads(json.loads(l.split('=> ',1)[1])[2:]))
print("samples",len(rows),"span s %.2f"%(rows[-1]['t']-rows[0]['t']),"mean dt ms %.0f"%(1000*(rows[-1]['t']-rows[0]['t'])/(len(rows)-1)))
from collections import OrderedDict
B=OrderedDict()
for d in rows: B.setdefault(d['bc'],[]).append(d)
out=[]
for bc,ds in B.items():
    if len(ds)<6: continue
    pk=max(x['rho'] for x in ds); tr=min(x['rho'] for x in ds); hi=sum(1 for x in ds if x['rho']>0.9)/len(ds); lo=sum(1 for x in ds if x['rho']<0.6)/len(ds)
    out.append((pk,tr,hi,lo,max(x['bump'] for x in ds),min(x['green']['Q'] for x in ds),max(x['green']['Q'] for x in ds)))
    if len(sys.argv)>2: print(f"{bc} n{len(ds)} kick {max(x['kick'] for x in ds):.2f} bump {out[-1][4]:.2f} rho {tr:.3f}..{pk:.3f} >0.9 {hi:.0%} <0.6 {lo:.0%} Q {out[-1][5]:.3f}..{out[-1][6]:.3f}")
print(f"{sys.argv[1].split('/')[-1]}: beats {len(out)} peak med {st.median(o[0] for o in out):.3f} trough med {st.median(o[1] for o in out):.3f} time>0.9 med {st.median(o[2] for o in out):.0%} time<0.6 med {st.median(o[3] for o in out):.0%} Q swing med {st.median(o[6]-o[5] for o in out):.3f} beats Q swing>=0.12: {sum(1 for o in out if o[6]-o[5]>=0.12)}/{len(out)}")
