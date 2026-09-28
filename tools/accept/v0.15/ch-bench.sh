#!/bin/bash
# CHLADNI's cost, by HARNESS.md "Bench protocol": q pinned .95 through a setInterval, 8 s of settling, n = 300, three
# calls, and NAV (id 0) interleaved in the SAME page so the two pages compare through their own NAV ratios. One Chrome
# at a time; nothing else on the machine.
#   bash tools/accept/v0.15/ch-bench.sh        # -> CHLADNI (11) and TORUS2 (3), each in its own forced page
cd "$(dirname "$0")/../../.." || exit 1
P=${PORT:-8814}
S='[{"until":"window.CARD"},{"eval":"setInterval(function(){CARD.Q.q=0.95;},16),1"},{"wait":9000},
    {"eval":"JSON.stringify({q:CARD.Q.q,tier:CARD.ctx.tier(),pts:CARD.ctx.budget(\"points\"),warm:[CARD.bench(ID,300),CARD.bench(0,300)]})"},
    {"eval":"JSON.stringify({a1:CARD.bench(ID,300),n1:CARD.bench(0,300),a2:CARD.bench(ID,300),n2:CARD.bench(0,300),a3:CARD.bench(ID,300),n3:CARD.bench(0,300)})"}]'
for ID in 11 3; do
  echo "=== scene $ID (forced page, NAV interleaved)"
  PORT=$P GPU=1 OUT=tools/work node tools/cdp.js "test&scene=$ID&ears=1" "${S//ID/$ID}" | grep -a EVAL
done
