#!/usr/bin/env python3
# MAXWELL trace on a real track (headed, tab capture), v0.11: hooks.energy() / hooks.train() / hooks.probe() of id 9
# (the field's energy from the readback band, the measured ring spacings per band, centre/rim luminance + the charges'
# hues + the loop gap) + the MS fields the sources read, every 2 s for 80 s — same shape as v0.10's det10.py, plus the
# D line now carries: sub, bassFast, centroid, dirty, punchy, presence, alive, absentT from CARD.MS (each guarded with
# a ternary so a field missing from this build prints null, not an exception) and the lit chroma sectors (indices of
# S.chroma above 0.3). And (orchestrator, 2026-09-26) a DOMINANT-HUE read built from the worker's hooks.mxcol():
# `dom` = the w-weighted circular mean palette hue of the colour field along the +x ray beyond r = 8 field cells
# (the centre is skipped — the kick and the dipole are pitchless and carry the key's anchor hue), `exphue` = the
# chroma-weighted circular mean of ALL TWELVE sectors' own hues (NOT just `lit`: on real music no chroma bin clears
# 0.3 in ~95 % of frames, so a lit-only mean has almost no samples — 2026-09-26 headed runs), `tophue` = the
# strongest chroma bin and its hue, `dhue` = the circular distance between `dom` and `exphue` in turns
# (0 = the wave is exactly the colour of the notes that are sounding, 0.5 = opposite), `wmax` = the ray's peak w.
# CAVEAT measured on the 2026-09-26 runs: on real music the chroma vector is near flat, and the twelve hues are laid
# out symmetrically about the key anchor, so `exphue` collapses onto the anchor and `dhue` then only asks "is the
# wave the anchor's colour". Read `dom`'s own spread against the anchor as well; the clean per-note proof is the
# worker's pinned hooks.mxchroma("k") one, not this.
# A PAUSED START matching audit11.sh is inserted after the keys land: pause the media tab, 8 s, one D line preceded
# by the marker PAUSED8S, 2 s more, .play(), marker RESUME, then the 40 x 2 s play loop.
# usage: det11.py <track> <tag>   -> prints D {...} lines
import json, os, subprocess, sys, datetime
S = '/tmp/claude-1000/-home-toma-Documents-Kraftek-Eigenwobble/9498eb8d-7260-49ae-9998-9ccbecbfee90/scratchpad'
track, tag = sys.argv[1], sys.argv[2]
INFO = ("(()=>{const h=CARD.REG[9].scene.hooks,S=CARD.MS;const J=(f)=>{try{const v=f();return typeof v==='string'?JSON.parse(v):v}catch(e){return String(e)}};"
        "const g=(k)=>(S[k]!==undefined&&S[k]!==null&&isFinite(+S[k])?+(+S[k]).toFixed(2):null);"
        "const lit=(S.chroma?Array.from(S.chroma).reduce((a,x,i)=>{if(x>0.3)a.push(i);return a},[]):null);"
        "const mc=J(()=>h.mxcol?h.mxcol():null);"
        "const CM=(a)=>{let x=0,y=0,w=0;for(const p of a){if(!(p[0]>1e-9))continue;x+=p[0]*Math.cos(6.283185307*p[1]);y+=p[0]*Math.sin(6.283185307*p[1]);w+=p[0];}"
        "return w>0?{h:+(((Math.atan2(y,x)/6.283185307)%1+1)%1).toFixed(4),w:+w.toFixed(4),r:+(Math.hypot(x,y)/w).toFixed(3)}:null};"
        "let dom=null,exph=null,dh=null,wmax=null,tophue=null;"
        "if(mc&&mc.ray&&mc.ray.length){dom=CM(mc.ray.filter(p=>p[0]>=8).map(p=>[p[1],p[2]]));wmax=+Math.max.apply(null,mc.ray.map(p=>p[1])).toFixed(4);}"
        "if(mc&&mc.hues&&S.chroma){const a=[];for(let i=0;i<12;i++)a.push([+S.chroma[i],mc.hues[i]]);exph=CM(a);"
        "let bk=0;for(let i=1;i<12;i++)if(S.chroma[i]>S.chroma[bk])bk=i;tophue={k:bk,h:mc.hues[bk],c:+S.chroma[bk].toFixed(3)};}"
        "if(dom&&exph){const d=Math.abs(dom.h-exph.h)%1;dh=+Math.min(d,1-d).toFixed(4);}"
        "return 'D '+JSON.stringify({t:+(performance.now()/1000).toFixed(1),au:CARD.ENGINE.AU.mode,bpm:+S.bpm.toFixed(1),bc:+(S.beatCount+S.beatPhase).toFixed(2),"
        "bass:+S.bass.toFixed(2),kick:+S.kick.toFixed(2),snare:+S.snare.toFixed(2),hat:+S.hat.toFixed(2),key:S.key,mode:S.mode,kc:+S.keyConf.toFixed(2),"
        "chroma:S.chroma?Array.from(S.chroma).map(x=>+x.toFixed(2)):null,lit:lit,arc:S.arc,alt:S.sectionAlt,build:+S.build.toFixed(2),drop:+S.dropEnv.toFixed(2),q:CARD.Q.q,ms:+CARD.ENGINE.ms.toFixed(2),"
        "dom:dom,exphue:exph,tophue:tophue,dhue:dh,wmax:wmax,sub:g('sub'),bassFast:g('bassFast'),centroid:g('centroid'),dirty:g('dirty'),punchy:g('punchy'),presence:g('presence'),alive:g('alive'),absentT:g('absentT'),"
        "energy:J(()=>h.energy()),train:J(()=>h.train()),probe:J(()=>h.probe()),hud:CARD.REG[9].scene.hud?CARD.REG[9].scene.hud():''})})()")
steps = [{"until": "window.CARD"}, {"wait": 1000},
         {"tab": f"file://{S}/music/{track}.mp3", "window": {"left": 2000, "top": 100, "width": 640, "height": 360}}, {"wait": 2000},
         {"evalTab": "(()=>{const v=document.querySelector('video,audio');return 'TAB '+location.href+' '+(v?[v.paused,+v.currentTime.toFixed(1)]:'none')})()"},
         {"activate": "main"}, {"wait": 500}, {"clickSel": "#go"}, {"wait": 6000}, {"key": "9"}, {"key": "n"}, {"wait": 1500},
         {"evalTab": "(()=>{const v=document.querySelector('video,audio');if(v)v.pause();return 'PAUSED '+(v?v.paused:'none')})()"},
         {"wait": 8000}, {"eval": "'PAUSED8S'"}, {"eval": INFO}, {"wait": 2000},
         {"evalTab": "(()=>{const v=document.querySelector('video,audio');if(v)v.play();return 'RESUME '+(v?v.paused:'none')})()"}]
for i in range(40): steps += [{"eval": INFO}, {"wait": 2000}]
steps.append({"eval": "JSON.stringify({errs:CARD.ERRS,bad:CARD.nonFinite(),au:CARD.ENGINE.AU.mode,scene:CARD.SC.logical})"})
print(f"### det {tag} {track} {datetime.datetime.now():%H:%M:%S}", flush=True)
env = dict(os.environ, HEADED='1', WIN='1920,1080', WINPOS='0,0', CAPTITLE=track, GPU='1', OUT='tools/accept/v0.11', PORT=os.environ.get('PORT', '8840'))
p = subprocess.run(['node', 'tools/cdp.js', 'real', json.dumps(steps)], cwd='/home/toma/Documents/Kraftek/RetinaRave', env=env, capture_output=True, text=True)
for l in (p.stdout + p.stderr).split('\n'):
    if l.startswith('EVAL'):
        v = l.split('=> ', 1)[1]
        try: v = json.loads(v)
        except Exception: pass
        print(v if isinstance(v, str) else json.dumps(v), flush=True)
    elif '[EXC]' in l or 'TIMEOUT' in l: print(l[:300], flush=True)
print(f"### end {datetime.datetime.now():%H:%M:%S}", flush=True)
