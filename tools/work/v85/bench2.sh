#!/bin/bash
# CARD.bench(2,300) interleaved with bench(0,300) (HARNESS "Bench protocol"): q pinned at .95, 8 s settle, the first
# bench(2,300) discarded (cold), three pairs, the medians and the NAV ratio.  usage: bench2.sh <tree> <port> [tag]
TREE=$1; PORT=${2:-8883}; TAG=${3:-bench}
cd "$TREE" || exit 1
PIN='{"until":"window.CARD"},{"eval":"setInterval(function(){CARD.Q.q=0.95},16);'pin'"},{"wait":8000}'
B='(function(){var b=[],n=[];CARD.bench(2,300);for(var i=0;i<3;i++){b.push(CARD.bench(2,300));n.push(CARD.bench(0,300));}var s=function(a,c){return a-c};b.sort(s);n.sort(s);return \"mandala \"+b[1].toFixed(3)+\" ms (runs \"+b.map(function(x){return x.toFixed(3)}).join(\"/\")+\") nav \"+n[1].toFixed(3)+\" ms (runs \"+n.map(function(x){return x.toFixed(3)}).join(\"/\")+\") ratio \"+(b[1]/n[1]).toFixed(3)+\" · q \"+CARD.Q.q.toFixed(2)+\" glerr \"+CARD.ctx.gl.getError()+\" errs \"+JSON.stringify(CARD.ERRS)})()'
GPU=1 PORT=$PORT node tools/cdp.js "test&scene=2" "[$PIN,{\"eval\":\"$B\"}]" | grep -E '^EVAL|^\[EXC\]' | sed 's/^EVAL.*=> //; s/^"//; s/"$//' | grep -v '^pin$\|^undefined$' | sed "s/^/$TAG: /"
