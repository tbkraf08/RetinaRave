#!/usr/bin/env python3
# POLYTOPE groove-train trace on a real track (headed, tab capture): hooks.info() of id 5 (per band: launches, the last
# launch and its drum vote, the EMA and threshold, the live bump positions) + the MS fields the detectors read, every 2 s
# for 80 s. usage: det9.py <track> <tag>   -> prints D {...} lines (valid JSON after 'D ')
import json, os, subprocess, sys, datetime
S = '/tmp/claude-1000/-home-toma-Documents-Kraftek-Eigenwobble/023fef5e-1ed4-4a95-bae1-211db1c7bb78/scratchpad'
track, tag = sys.argv[1], sys.argv[2]
INFO = ("(()=>{const h=CARD.REG[5].scene.hooks,S=CARD.MS;let i=h.info();try{i=JSON.parse(i)}catch(e){}return 'D '+JSON.stringify({t:+(performance.now()/1000).toFixed(1),"
        "au:CARD.ENGINE.AU.mode,bpm:+S.bpm.toFixed(1),bc:+(S.beatCount+S.beatPhase).toFixed(2),gt:+S.gridTrust.toFixed(2),bass:+S.bass.toFixed(2),mid:+S.mid.toFixed(2),high:+S.high.toFixed(2),"
        "kick:+S.kick.toFixed(2),snare:+S.snare.toFixed(2),hat:+S.hat.toFixed(2),key:S.key,mode:S.mode,kc:+S.keyConf.toFixed(2),arc:S.arc,build:+S.build.toFixed(2),q:CARD.Q.q,info:i,hud:CARD.REG[5].scene.hud()})})()")
steps = [{"until": "window.CARD"}, {"wait": 1000},
         {"tab": f"file://{S}/music/{track}.mp3", "window": {"left": 2000, "top": 100, "width": 640, "height": 360}}, {"wait": 2000},
         {"evalTab": "(()=>{const v=document.querySelector('video,audio');return 'TAB '+location.href+' '+(v?[v.paused,+v.currentTime.toFixed(1)]:'none')})()"},
         {"activate": "main"}, {"wait": 500}, {"clickSel": "#go"}, {"wait": 6000}, {"key": "6"}, {"wait": 1500}]
for i in range(40): steps += [{"eval": INFO}, {"wait": 2000}]
steps.append({"eval": "JSON.stringify({errs:CARD.ERRS,bad:CARD.nonFinite(),au:CARD.ENGINE.AU.mode,scene:CARD.SC.logical})"})
print(f"### det {tag} {track} {datetime.datetime.now():%H:%M:%S}", flush=True)
env = dict(os.environ, HEADED='1', WIN='1920,1080', WINPOS='0,0', CAPTITLE=track, GPU='1', OUT='tools/accept/v0.9')
p = subprocess.run(['node', 'tools/cdp.js', 'real', json.dumps(steps)], cwd='/home/toma/Documents/Kraftek/RetinaRave', env=env, capture_output=True, text=True)
for l in (p.stdout + p.stderr).split('\n'):
    if l.startswith('EVAL'):
        v = l.split('=> ', 1)[1]
        try: v = json.loads(v)
        except Exception: pass
        print(v if isinstance(v, str) else json.dumps(v), flush=True)
    elif '[EXC]' in l or 'TIMEOUT' in l: print(l[:300], flush=True)
print(f"### end {datetime.datetime.now():%H:%M:%S}", flush=True)
