#!/usr/bin/env python3
# NAV2 detector trace on a real track (headed): n2info + the MS fields the detectors read, every 2 s for 80 s.
# usage: det8.py <track> <tag>   -> prints D {...} lines (valid JSON after 'D ')
import json, os, subprocess, sys, datetime
S = '/tmp/claude-1000/-home-toma-Documents-Kraftek-Eigenwobble/fde2e182-a857-4704-be54-ee231551c8e7/scratchpad'
track, tag = sys.argv[1], sys.argv[2]
INFO = ("(()=>{const i=CARD.REG[8].scene.hooks.n2info(),S=CARD.MS;return 'D '+JSON.stringify({t:+(performance.now()/1000).toFixed(1),"
        "au:CARD.ENGINE.AU.mode,bpm:+S.bpm.toFixed(1),mode:i.mode,c:i.c.map(x=>+x.toFixed(3)),rho:+i.rho.toFixed(3),q:i.q,wind:+i.wind.toFixed(2),cnt:+i.count.toFixed(2),"
        "curl:+i.curl.toFixed(2),pitch:+i.pitch.toFixed(2),lift:+i.lift.toFixed(3),sweep:+i.sweep.toFixed(2),roll:+i.roll.toFixed(2),scr:+i.scratch.toFixed(2),"
        "swirl:+i.swirl.toFixed(2),rate:+i.rate.toFixed(2),ang:+i.angle.toFixed(1),gate:i.gate,dei:+S.dropExpectedIn.toFixed(1),riser:+S.riser.toFixed(2),"
        "hp:+S.hp.toFixed(2),mroll:+S.roll.toFixed(2),or:+S.onsetRate.toFixed(1),cen:+S.centroid.toFixed(3),build:+S.build.toFixed(2),tens:+S.tension.toFixed(2),"
        "hush:+S.hush.toFixed(2),drop:+S.dropEnv.toFixed(2)})})()")
steps = [{"until": "window.CARD"}, {"wait": 1000},
         {"tab": f"file://{S}/music/{track}.mp3", "window": {"left": 2000, "top": 100, "width": 640, "height": 360}}, {"wait": 2000},
         {"evalTab": "(()=>{const v=document.querySelector('video,audio');return 'TAB '+location.href+' '+(v?[v.paused,+v.currentTime.toFixed(1)]:'none')})()"},
         {"activate": "main"}, {"wait": 500}, {"clickSel": "#go"}, {"wait": 6000}, {"key": "9"}, {"wait": 1500}]
for i in range(40): steps += [{"eval": INFO}, {"wait": 2000}]
steps.append({"eval": "JSON.stringify({errs:CARD.ERRS,bad:CARD.nonFinite(),au:CARD.ENGINE.AU.mode})"})
print(f"### det {tag} {track} {datetime.datetime.now():%H:%M:%S}", flush=True)
env = dict(os.environ, HEADED='1', WIN='1920,1080', WINPOS='0,0', CAPTITLE=track, GPU='1', OUT='tools/accept/v0.8')
p = subprocess.run(['node', 'tools/cdp.js', 'real', json.dumps(steps)], cwd='/home/toma/Documents/Kraftek/RetinaRave', env=env, capture_output=True, text=True)
for l in (p.stdout + p.stderr).split('\n'):
    if l.startswith('EVAL'):
        v = l.split('=> ', 1)[1]
        try: v = json.loads(v)
        except Exception: pass
        print(v if isinstance(v, str) else json.dumps(v), flush=True)
    elif '[EXC]' in l or 'TIMEOUT' in l: print(l[:300], flush=True)
print(f"### end {datetime.datetime.now():%H:%M:%S}", flush=True)
