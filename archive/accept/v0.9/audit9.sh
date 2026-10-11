#!/bin/bash
# v0.9 real-window run: POLYTOPE (key 6) after the dance on one real track through tab capture; usage: audit8.sh <track> <key> <tag>
# same clock times, the probe's frames/black/long, q at 1 Hz, ERRS/nonFinite at the end. usage: audit9.sh <track> <key> <tag>
cd /home/toma/Documents/Kraftek/RetinaRave || exit 1
export OUT=tools/accept/v0.9 GPU=1
SP=/tmp/claude-1000/-home-toma-Documents-Kraftek-Eigenwobble/023fef5e-1ed4-4a95-bae1-211db1c7bb78/scratchpad
TRACK=$1; KEY=$2; TAG=$3
mkdir -p $OUT
PROBE="fetch('/tools/probe.js').then(r=>r.text()).then(eval).then(()=>PROBE.start())"
STAT="{t:+((performance.now()-PROBE.t0)/1000).toFixed(1),bpm:+CARD.MS.bpm.toFixed(2),syn:+CARD.MS.bpmSyn.toFixed(2),key:CARD.MS.key,mode:CARD.MS.mode,keyConf:+CARD.MS.keyConf.toFixed(2),q:CARD.Q.q,ms:+CARD.ENGINE.ms.toFixed(2),hop:CARD.ENGINE.tex.hop,scene:CARD.SC.logical,black:PROBE.black,long:PROBE.long,maxdt:+PROBE.maxdt.toFixed(0),frames:PROBE.n,errs:CARD.ERRS,bad:CARD.nonFinite(),hud:(CARD.REG[CARD.SC.logical].scene.hud?CARD.REG[CARD.SC.logical].scene.hud():'')}"
cat > $SP/audit/$TAG.json <<EOJ
[{"until":"window.CARD"},{"wait":1000},
{"tab":"file://$SP/music/$TRACK.mp3","window":{"left":2000,"top":100,"width":640,"height":360}},{"wait":2000},
{"evalTab":"(()=>{const v=document.querySelector('video,audio');return v?[v.paused,+v.currentTime.toFixed(1),v.duration]:'none'})()"},
{"activate":"main"},{"wait":500},{"eval":"$PROBE"},{"clickSel":"#go"},{"wait":6000},
{"key":"$KEY"},{"wait":2000},
{"eval":"'T8 '+JSON.stringify({mode:CARD.ENGINE.AU.mode,heard:CARD.ENGINE.AU.heard,vp:[innerWidth,innerHeight],dpr:devicePixelRatio,s:$STAT})"},
{"wait":12000},{"shot":"$TAG-20s"},{"eval":"'T20 '+JSON.stringify($STAT)"},
{"wait":20000},{"shot":"$TAG-40s"},{"eval":"'T40 '+JSON.stringify($STAT)"},
{"wait":20000},{"shot":"$TAG-60s"},{"eval":"'T60 '+JSON.stringify($STAT)"},
{"wait":20000},{"shot":"$TAG-80s"},{"eval":"'T80 '+JSON.stringify($STAT)"},
{"eval":"'LONG '+JSON.stringify(PROBE.ev.filter(e=>e.k==='long'||e.k==='black').map(e=>[e.t,e.k,e.dt]))"},
{"eval":"'Q1HZ '+JSON.stringify(PROBE.q1)"},
{"eval":"'END '+JSON.stringify({errs:CARD.ERRS,bad:CARD.nonFinite(),glerr:CARD.glerr,mode:CARD.ENGINE.AU.mode,hop:CARD.ENGINE.tex.hop,summary:JSON.parse(PROBE.summary()).n})"}]
EOJ
echo "### $TAG $TRACK key $KEY $(date +%H:%M:%S)"
env HEADED=1 WIN=1920,1080 WINPOS=0,0 CAPTITLE=$TRACK node tools/cdp.js 'real' "$(cat $SP/audit/$TAG.json)" 2>&1 | grep -v "^\[console" | cut -c1-1500
echo "### end $(date +%H:%M:%S)"
