#!/usr/bin/env python3
# NAV2 trace on a real track (headed, tab capture), v0.13: det8.py's n2info line plus the beat — MS.kick / hit / beatPhase /
# bass / eS / onsetRate — and NAV2's Green's-theorem readings (hooks.green(): the equipotential's area A, perimeter L,
# roundness Q = 4 pi A / L^2, and the edge speed), every 2 s for 80 s after key 9.
# usage: det13.py <track> <tag>   -> prints D {...} lines. <track> is a file in $MUSIC (default ~/Music/RetinaRave), with or
#        without its extension (.flac .wav .mp3 .m4a .opus .ogg tried in that order) — the v0.12 rule.
import json, os, subprocess, sys, datetime
MUSIC = os.environ.get('MUSIC') or os.path.expanduser('~/Music/RetinaRave')
track, tag = sys.argv[1], sys.argv[2]
def resolve(name):
    if os.path.isfile(os.path.join(MUSIC, name)): return os.path.join(MUSIC, name)
    for e in ('flac', 'wav', 'mp3', 'm4a', 'opus', 'ogg'):
        f = os.path.join(MUSIC, f'{name}.{e}')
        if os.path.isfile(f): return f
    return None
FILE = resolve(track) or resolve(os.path.splitext(track)[0])
if not FILE: sys.exit(f'det13: no {track} in {MUSIC} (tried .flac .wav .mp3 .m4a .opus .ogg)')
track = os.path.splitext(track)[0]
KEY = os.environ.get('KEY', '9')
INFO = ("(()=>{const h=CARD.REG[0].scene.hooks,i=h.n2info(),S=CARD.MS;const g=h.green?h.green():null;"
        "const r=(x,k)=>(x===undefined||x===null||!isFinite(+x))?null:+(+x).toFixed(k);"
        "return 'D '+JSON.stringify({t:r(performance.now()/1000,1),au:CARD.ENGINE.AU.mode,bpm:r(S.bpm,1),mode:i.mode,c:i.c.map(x=>r(x,3)),"
        "rho:r(i.rho,3),q:i.q,has:i.has,wind:r(i.wind,2),bump:r(i.bump,2),pulse:r(i.pulse,2),ival:r(i.ival,2),E:r(i.E,2),note:i.note,curl:r(i.curl,2),pitch:r(i.pitch,2),lift:r(i.lift,3),"
        "swirl:r(i.swirl,2),rate:r(i.rate,2),par:r(i.par,2),gate:i.gate,"
        "kick:r(S.kick,2),hit:r(S.hit,2),bp:r(S.beatPhase,2),bc:S.beatCount,bass:r(S.bass,2),eS:r(S.eS,2),or:r(S.onsetRate,1),"
        "cen:r(S.centroid,3),build:r(S.build,2),hush:r(S.hush,2),drop:r(S.dropEnv,2),dei:r(S.dropExpectedIn,1),ds:r(S.dropStrength,2),arc:S.arc,"
        "green:g?{Q:r(g.Q,4),A:r(g.A,4),L:r(g.L,4),v:r(g.v,3),dA:r(g.dA,4)}:null,"
        "ms:r(CARD.ENGINE.ms,2),errs:CARD.ERRS.length})})()")
steps = [{"until": "window.CARD"}, {"wait": 1000},
         {"tab": f"file://{FILE}", "window": {"left": 2000, "top": 100, "width": 640, "height": 360}}, {"wait": 2000},
         {"evalTab": "(()=>{const v=document.querySelector('video,audio');return 'TAB '+location.href+' '+(v?[v.paused,+v.currentTime.toFixed(1)]:'none')})()"},
         {"activate": "main"}, {"wait": 500}, {"clickSel": "#go"}, {"wait": 6000}, {"key": KEY}, {"wait": 1500}]
for i in range(40): steps += [{"eval": INFO}, {"wait": 2000}]
steps.append({"eval": "JSON.stringify({errs:CARD.ERRS,bad:CARD.nonFinite(),au:CARD.ENGINE.AU.mode,scene:CARD.SC.logical})"})
print(f"### det13 {tag} {track} ({FILE}) key {KEY} {datetime.datetime.now():%H:%M:%S}", flush=True)
env = dict(os.environ, HEADED='1', WIN='1920,1080', WINPOS='0,0', CAPTITLE=track, GPU='1', OUT='tools/accept/v0.13', PORT=os.environ.get('PORT', '8860'))
p = subprocess.run(['node', 'tools/cdp.js', 'real', json.dumps(steps)], cwd='/home/toma/Documents/Kraftek/RetinaRave', env=env, capture_output=True, text=True)
for l in (p.stdout + p.stderr).split('\n'):
    if l.startswith('EVAL'):
        v = l.split('=> ', 1)[1]
        try: v = json.loads(v)
        except Exception: pass
        print(v if isinstance(v, str) else json.dumps(v), flush=True)
    elif '[EXC]' in l or 'TIMEOUT' in l: print(l[:300], flush=True)
print(f"### end {datetime.datetime.now():%H:%M:%S}", flush=True)
