#!/usr/bin/env python3
# A window of one real track through NAV2 (key 9), a shot + det13's D line EVERY SECOND: seek the media tab to T0 s and
# read N seconds. usage: OUT=<dir> T0=46 N=24 [KEY=9] [PAUSE=6] python3 tools/accept/v0.13/nav2-window.py <track>
# PAUSE=<s>: the media tab is PAUSED for the first <s> seconds of the window (the shots and D lines go on) — the
# no-beat proof: with nothing playing the bump and its density decay, c falls back to RHO_REST and Q -> 1; then it plays.
# (v0.12's breakdown-window.py with det13's INFO and the key as an env; the D lines are det13.py's shape.)
import json, os, subprocess, sys
src = open('tools/accept/v0.13/det13.py').read()
sys.argv = ['det13.py', sys.argv[1] if len(sys.argv) > 1 else 'SeeYouDrop', 'x']
exec(src.split('steps = [')[0])          # gives FILE, INFO, KEY, track
OUT = os.environ['OUT']; T0 = int(os.environ.get('T0', '46')); N = int(os.environ.get('N', '24')); TAG = os.environ.get('TAG', 'n2w')
PAUSE = int(os.environ.get('PAUSE', '0'))
DT = int(os.environ.get('DT', '1000')); SHOT = os.environ.get('SHOT', '1') != '0'   # DT ms between samples, SHOT=0 for D lines only (a 10 Hz beat trace)
if os.environ.get('MIN') == '1':   # a SHORT D line (t, beat count, bump, rho, Q, kick, note) for a per-frame trace: 200 full INFOs overflow the argv
    INFO = ("(()=>{const h=CARD.REG[8].scene.hooks,i=h.n2info(),S=CARD.MS,g=h.green();const r=(x,k)=>+(+x).toFixed(k);"
            "return 'D '+JSON.stringify({t:r(performance.now()/1000,3),bc:S.beatCount,bp:r(S.beatPhase,2),bump:r(i.bump,2),rho:r(i.rho,3),mode:i.mode,q:i.q,note:i.note,kick:r(S.kick,2),green:{Q:r(g.Q,3)}})})()")
PV = "(()=>{const v=document.querySelector('video,audio');v.%s();return v.paused})()"
CT = "(()=>{const v=document.querySelector('video,audio');return +v.currentTime.toFixed(2)})()"
steps = [{"until": "window.CARD"}, {"wait": 1000},
         {"tab": f"file://{FILE}", "window": {"left": 2000, "top": 100, "width": 640, "height": 360}}, {"wait": 2000},
         {"activate": "main"}, {"wait": 500}, {"clickSel": "#go"}, {"wait": 6000}, {"key": KEY}, {"wait": 1000},
         {"evalTab": f"(()=>{{const v=document.querySelector('video,audio');v.currentTime={T0};return v.currentTime}})()"}, {"wait": 1500}]
if PAUSE > 0: steps.append({"evalTab": PV % 'pause'})
for i in range(N):
    if PAUSE > 0 and i == PAUSE: steps.append({"evalTab": PV % 'play'})
    steps += [{"evalTab": CT}, {"eval": INFO}] + ([{"shot": f"{TAG}-{i:02d}"}] if SHOT else []) + [{"wait": DT}]
steps.append({"eval": "JSON.stringify({errs:CARD.ERRS,au:CARD.ENGINE.AU.mode,scene:CARD.SC.logical})"})
env = dict(os.environ, HEADED='1', WIN='1920,1080', WINPOS='0,0', CAPTITLE=track, GPU='1', PORT=os.environ.get('PORT', '8861'))
p = subprocess.run(['node', 'tools/cdp.js', 'real', json.dumps(steps)], env=env, capture_output=True, text=True)
for l in p.stdout.splitlines():
    if l.startswith('[console'): continue
    print(l)
print(p.stderr[-800:])
