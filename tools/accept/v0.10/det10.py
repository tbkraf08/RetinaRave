#!/usr/bin/env python3
# MAXWELL trace on a real track (headed, tab capture): hooks.energy() / hooks.train() / hooks.probe() of id 9 (the field's
# energy from the readback band, the measured ring spacings per band, centre/rim luminance + the charges' hues + the loop
# gap) + the MS fields the sources read, every 2 s for 80 s. usage: det10.py <track> <tag>   -> prints D {...} lines
import json, os, subprocess, sys, datetime
S = '/tmp/claude-1000/-home-toma-Documents-Kraftek-Eigenwobble/27248ddc-51de-4808-9488-854a1980691e/scratchpad'
track, tag = sys.argv[1], sys.argv[2]
INFO = ("(()=>{const h=CARD.REG[9].scene.hooks,S=CARD.MS;const J=(f)=>{try{const v=f();return typeof v==='string'?JSON.parse(v):v}catch(e){return String(e)}};"
        "return 'D '+JSON.stringify({t:+(performance.now()/1000).toFixed(1),au:CARD.ENGINE.AU.mode,bpm:+S.bpm.toFixed(1),bc:+(S.beatCount+S.beatPhase).toFixed(2),"
        "bass:+S.bass.toFixed(2),sub:+S.sub.toFixed(2),kick:+S.kick.toFixed(2),snare:+S.snare.toFixed(2),hat:+S.hat.toFixed(2),key:S.key,mode:S.mode,kc:+S.keyConf.toFixed(2),"
        "chroma:S.chroma?Array.from(S.chroma).map(x=>+x.toFixed(2)):null,arc:S.arc,alt:S.sectionAlt,build:+S.build.toFixed(2),drop:+S.dropEnv.toFixed(2),q:CARD.Q.q,ms:+CARD.ENGINE.ms.toFixed(2),"
        "energy:J(()=>h.energy()),train:J(()=>h.train()),probe:J(()=>h.probe()),hud:CARD.REG[9].scene.hud?CARD.REG[9].scene.hud():''})})()")
steps = [{"until": "window.CARD"}, {"wait": 1000},
         {"tab": f"file://{S}/music/{track}.mp3", "window": {"left": 2000, "top": 100, "width": 640, "height": 360}}, {"wait": 2000},
         {"evalTab": "(()=>{const v=document.querySelector('video,audio');return 'TAB '+location.href+' '+(v?[v.paused,+v.currentTime.toFixed(1)]:'none')})()"},
         {"activate": "main"}, {"wait": 500}, {"clickSel": "#go"}, {"wait": 6000}, {"key": "9"}, {"key": "n"}, {"wait": 1500}]
for i in range(40): steps += [{"eval": INFO}, {"wait": 2000}]
steps.append({"eval": "JSON.stringify({errs:CARD.ERRS,bad:CARD.nonFinite(),au:CARD.ENGINE.AU.mode,scene:CARD.SC.logical})"})
print(f"### det {tag} {track} {datetime.datetime.now():%H:%M:%S}", flush=True)
env = dict(os.environ, HEADED='1', WIN='1920,1080', WINPOS='0,0', CAPTITLE=track, GPU='1', OUT='tools/accept/v0.10')
p = subprocess.run(['node', 'tools/cdp.js', 'real', json.dumps(steps)], cwd='/home/toma/Documents/Kraftek/RetinaRave', env=env, capture_output=True, text=True)
for l in (p.stdout + p.stderr).split('\n'):
    if l.startswith('EVAL'):
        v = l.split('=> ', 1)[1]
        try: v = json.loads(v)
        except Exception: pass
        print(v if isinstance(v, str) else json.dumps(v), flush=True)
    elif '[EXC]' in l or 'TIMEOUT' in l: print(l[:300], flush=True)
print(f"### end {datetime.datetime.now():%H:%M:%S}", flush=True)
