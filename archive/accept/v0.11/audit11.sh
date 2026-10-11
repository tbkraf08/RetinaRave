#!/bin/bash
# v0.11 real-window run: MAXWELL (id 9, reached by key 9 then n) on one real track through tab capture, with a
# PAUSED START inserted right after the keys land (v0.10's audit10.sh + a pause/resume window): evalTab .pause() the
# media tab, wait 8 s, shot+STAT at the ~8 s mark ('TPAUSE'), wait 2 s more (10 s paused total), .play(), then the
# same clock times as v0.10 (probe's frames/black/long, q at 1 Hz, ERRS/nonFinite at the end).
# evalTab does not need the tab activated first: cdp.js's evalTab step attaches to the target by targetId via its own
# CDP session (Target.attachToTarget + Runtime.evaluate + Target.detachFromTarget) — it never depends on which tab is
# frontmost, so no {"activate":"tab"}/{"activate":"main"} pair is needed around it (confirmed against cdp.js's header
# and its evalTab implementation; v0.10's own evalTab call runs before "activate main" too).
# usage: audit11.sh <track> <tag>
cd /home/toma/Documents/Kraftek/RetinaRave || exit 1
export OUT=tools/accept/v0.11 GPU=1
SP=/tmp/claude-1000/-home-toma-Documents-Kraftek-Eigenwobble/9498eb8d-7260-49ae-9998-9ccbecbfee90/scratchpad
TRACK=$1; TAG=$2
mkdir -p "$OUT" "$SP/audit"
PROBE="fetch('/tools/probe.js').then(r=>r.text()).then(eval).then(()=>PROBE.start())"
STAT="{t:+((performance.now()-PROBE.t0)/1000).toFixed(1),bpm:+CARD.MS.bpm.toFixed(2),syn:+CARD.MS.bpmSyn.toFixed(2),key:CARD.MS.key,mode:CARD.MS.mode,keyConf:+CARD.MS.keyConf.toFixed(2),q:CARD.Q.q,ms:+CARD.ENGINE.ms.toFixed(2),hop:CARD.ENGINE.tex.hop,scene:CARD.SC.logical,black:PROBE.black,long:PROBE.long,maxdt:+PROBE.maxdt.toFixed(0),frames:PROBE.n,errs:CARD.ERRS,bad:CARD.nonFinite(),hud:(CARD.REG[CARD.SC.logical].scene.hud?CARD.REG[CARD.SC.logical].scene.hud():'')}"
if [ -n "$DRY" ]; then
  echo "DRY: json only, no launch"
fi
cat > "$SP/audit/$TAG.json" <<EOJ
[{"until":"window.CARD"},{"wait":1000},
{"tab":"file://$SP/music/$TRACK.mp3","window":{"left":2000,"top":100,"width":640,"height":360}},{"wait":2000},
{"evalTab":"(()=>{const v=document.querySelector('video,audio');return v?[v.paused,+v.currentTime.toFixed(1),v.duration]:'none'})()"},
{"activate":"main"},{"wait":500},{"eval":"$PROBE"},{"clickSel":"#go"},{"wait":6000},
{"key":"9"},{"key":"n"},{"wait":1000},
{"evalTab":"(()=>{const v=document.querySelector('video,audio');if(v)v.pause();return v?v.paused:'none'})()"},
{"wait":8000},{"shot":"$TAG-paused8s"},{"eval":"'TPAUSE '+JSON.stringify($STAT)"},
{"wait":2000},
{"evalTab":"(()=>{const v=document.querySelector('video,audio');if(v)v.play();return v?v.paused:'none'})()"},
{"eval":"'T8 '+JSON.stringify({mode:CARD.ENGINE.AU.mode,heard:CARD.ENGINE.AU.heard,vp:[innerWidth,innerHeight],dpr:devicePixelRatio,s:$STAT})"},
{"wait":12000},{"shot":"$TAG-20s"},{"eval":"'T20 '+JSON.stringify($STAT)"},
{"wait":20000},{"shot":"$TAG-40s"},{"eval":"'T40 '+JSON.stringify($STAT)"},
{"wait":20000},{"shot":"$TAG-60s"},{"eval":"'T60 '+JSON.stringify($STAT)"},
{"wait":20000},{"shot":"$TAG-80s"},{"eval":"'T80 '+JSON.stringify($STAT)"},
{"eval":"'LONG '+JSON.stringify(PROBE.ev.filter(e=>e.k==='long'||e.k==='black').map(e=>[e.t,e.k,e.dt]))"},
{"eval":"'Q1HZ '+JSON.stringify(PROBE.q1)"},
{"eval":"'END '+JSON.stringify({errs:CARD.ERRS,bad:CARD.nonFinite(),glerr:CARD.glerr,mode:CARD.ENGINE.AU.mode,hop:CARD.ENGINE.tex.hop,summary:JSON.parse(PROBE.summary()).n})"}]
EOJ
if [ -n "$DRY" ]; then
  echo "DRY: wrote $SP/audit/$TAG.json, not launching Chrome"
  exit 0
fi
echo "### $TAG $TRACK key 9+n paused-start $(date +%H:%M:%S)"
env HEADED=1 WIN=1920,1080 WINPOS=0,0 CAPTITLE=$TRACK PORT=${PORT:-8840} node tools/cdp.js 'real' "$(cat "$SP/audit/$TAG.json")" 2>&1 | grep -v "^\[console" | cut -c1-1500
echo "### end $(date +%H:%M:%S)"
