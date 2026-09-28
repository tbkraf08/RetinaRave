#!/bin/bash
# CHLADNI's remaining proofs: the params slot, the settle instrument on the real track, and the continuity monitor
# over 60 s of deterministic file mode. One Chrome at a time, PORT 8814.
#   bash tools/accept/v0.15/ch-proofs.sh [params|settle|monitor]
cd "$(dirname "$0")/../../.." || exit 1
P=${PORT:-8814}
ONLY=$1

if [ -z "$ONLY" ] || [ "$ONLY" = params ]; then
echo "=== params: the identity (paramsOf == derived, nothing routed) and the six values"
PORT=$P CLOCK=1 GPU=1 OUT=tools/work node tools/cdp.js 'test&scene=11&ears=1' '[{"until":"window.CARD"},{"until":"window.__FRAME>=360"},
  {"eval":"JSON.stringify((function(){var o=CARD.paramsOf(\"chladni\"),r={};for(var k in o){r[k]=[o[k],CARD.derived(\"chladni\",k),o[k]===CARD.derived(\"chladni\",k)];}return r;})())"},
  {"eval":"JSON.stringify(CARD.paramDeps(\"chladni\",\"tilt\"))+\" \"+JSON.stringify(CARD.paramDeps(\"chladni\",\"fog\"))"}]' | grep -a EVAL

echo "=== params: lo / hi pairs for figure and glow (the same CLOCK=1 frame, one routed constant apart)"
for SPEC in 'chladni.figure=c:0' 'chladni.figure=c:5' 'chladni.glow=c:0.15' 'chladni.glow=c:1.5'; do
  TAG=$(echo "$SPEC" | tr '.=:' '---')
  PORT=$P CLOCK=1 GPU=1 OUT=tools/work node tools/cdp.js "test&scene=11&ears=1&figure=0&param=$SPEC" "[{\"until\":\"window.CARD\"},{\"until\":\"window.__FRAME>=360\"},{\"shot\":\"ch-p-$TAG\"},{\"eval\":\"JSON.stringify({errs:CARD.ERRS,p:CARD.paramsOf('chladni')})\"}]" | grep -a EVAL
  md5sum tools/work/ch-p-$TAG.jpg
done
fi

if [ -z "$ONLY" ] || [ "$ONLY" = settle ]; then
echo "=== settle: the sand on the real track, through the walk's figure changes and across one groove kick"
PORT=$P CLOCK=1 GPU=1 OUT=tools/work node tools/cdp.js 'test&track=SeeYouDrop&at=0&scene=11' '[{"until":"window.CARD"},
  {"until":"CARD.ENGINE.AU.file&&CARD.ENGINE.AU.file.open","timeout":300000},
  {"until":"window.__FRAME>=842","timeout":900000},{"eval":"\"settle @13.99 (0.4 s after the C# figure)  \"+CARD.REG[11].scene.hooks.settle()"},
  {"until":"window.__FRAME>=962","timeout":900000},{"eval":"\"settle @15.99 (0.34 s after the A switch)  \"+CARD.REG[11].scene.hooks.settle()"},
  {"until":"window.__FRAME>=1202","timeout":900000},{"eval":"\"settle @19.99 (0.36 s after the F# switch) \"+CARD.REG[11].scene.hooks.settle()"},
  {"until":"window.__FRAME>=1400","timeout":900000},{"eval":"\"settle @23.29 (0.39 s after the E switch)  \"+CARD.REG[11].scene.hooks.settle()"},
  {"until":"window.__FRAME>=1802","timeout":900000},{"eval":"\"settle @30.00 (groove, before a kick)      \"+CARD.REG[11].scene.hooks.settle()"},
  {"until":"window.__FRAME>=1806","timeout":900000},{"eval":"\"settle @30.07 (0.03 s after the kick)     \"+CARD.REG[11].scene.hooks.settle()"},
  {"until":"window.__FRAME>=1814","timeout":900000},{"eval":"\"settle @30.20 (0.17 s after the kick)     \"+CARD.REG[11].scene.hooks.settle()"},
  {"until":"window.__FRAME>=1826","timeout":900000},{"eval":"\"settle @30.40 (0.37 s after the kick)     \"+CARD.REG[11].scene.hooks.settle()"},
  {"eval":"JSON.stringify({errs:CARD.ERRS,bad:CARD.nonFinite(),heard:CARD.MS.heardT})"}]' | grep -a EVAL
fi

if [ -z "$ONLY" ] || [ "$ONLY" = monitor ]; then
echo "=== continuity monitor over 60 s of deterministic file mode (the monitor is pointed at the scene's state)"
MON=$(grep -v '^//' tools/monitor.js | tr '\n' ' ' | sed 's/"/\\"/g')
PORT=$P CLOCK=1 GPU=1 OUT=tools/work node tools/cdp.js 'test&track=SeeYouDrop&at=20&scene=11' "[{\"until\":\"window.CARD\"},
  {\"until\":\"CARD.ENGINE.AU.file&&CARD.ENGINE.AU.file.open\",\"timeout\":300000},
  {\"eval\":\"CARD.NAV=CARD.REG[11].scene.state,'pointed'\"},{\"eval\":\"$MON;'armed'\"},
  {\"until\":\"window.__FRAME>=3602\",\"timeout\":900000},
  {\"eval\":\"JSON.stringify({n:MON.n,fast:MON.fast,max:+MON.max.toFixed(4),viol:MON.viol,heard:CARD.MS.heardT,errs:CARD.ERRS})\"}]" | grep -a EVAL
fi
