#!/usr/bin/env python3
# tabulate det13 / nav2-window D lines (v0.13): a summary line, or the full table with `full`. usage: tab13.py <file> [full]
import json,re,sys,statistics as st
f=sys.argv[1]; full=len(sys.argv)>2
rows=[];ct=None
for l in open(f):
    l=l.rstrip('\n')
    m=re.match(r"EVALTAB .*=> ([\d.]+)$",l)
    if m: ct=float(m.group(1)); continue
    if l.startswith('D '): d=json.loads(l[2:])
    elif l.startswith('EVAL ') and '=> "D ' in l: d=json.loads(json.loads(l.split('=> ',1)[1])[2:])
    else: continue
    d['trk']=ct; rows.append(d)
if not rows: sys.exit('no D lines')
if full:
    print("trk   probe mode  rho   q bump puls ival  E    eS  note kick hit  drop  ds  arc     gate Q      v     ms")
    for d in rows:
        g=d.get('green') or {}
        print(f"{(d['trk'] or 0):5.1f} {d['t']:5.1f} {d['mode']:4} {d['rho']:.3f} {d['q']} {d['bump']:.2f} {d['pulse']:.2f} {d['ival']:.2f} {d['E']:.2f} {d['eS']:.2f} {str(d['note']):>3} {d['kick']:.2f} {d['hit']:.2f} {d['drop']:.2f} {str(d.get('ds')):>4} {str(d.get('arc')):7} {d['gate']!s:4} {g.get('Q')!s:6} {g.get('v')!s:5} {d.get('ms')}")
def q(xs,k): return round(sorted(xs)[int(k*(len(xs)-1))],3)
rho=[d['rho'] for d in rows if d['mode']=='INT']; bump=[d['bump'] for d in rows]; Q=[d['green']['Q'] for d in rows if d.get('green') and d['mode']=='INT' and d['green'].get('Q') is not None]
v=[d['green']['v'] for d in rows if d.get('green') and d['mode']=='INT' and d['green'].get('v') is not None]
notes=sorted({d['note'] for d in rows if d['note'] is not None and d['note']>=0}); modes={}
for d in rows: modes[d['mode']]=modes.get(d['mode'],0)+1
gates=sum(1 for d in rows if d['gate']); ms=[d['ms'] for d in rows if d.get('ms') is not None]
print(f"{f.split('/')[-1]}: n {len(rows)} modes {modes} rho min/med/max {q(rho,0)}/{q(rho,.5)}/{q(rho,1)} bump {q(bump,0)}/{q(bump,.5)}/{q(bump,1)} "
      f"Q {q(Q,0)}/{q(Q,.5)}/{q(Q,1)} v med/max {q(v,.5)}/{q(v,1)} v>0 {sum(1 for x in v if x>0)}/{len(v)} notes {notes} gates {gates} "
      f"kick max {max(d['kick'] for d in rows)} eS {q([d['eS'] for d in rows],0)}/{q([d['eS'] for d in rows],.5)}/{q([d['eS'] for d in rows],1)} ms {max(ms) if ms else None} bpm {rows[-1]['bpm']}")
