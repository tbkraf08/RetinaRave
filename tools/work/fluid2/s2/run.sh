#!/bin/bash
# the S2 kick strips on RaindropsOnRoses only (the user: "only tune with Raindrops, don't do full sweep"), one Chrome at a time, PORT 8978
# the 14 kicks: the drop 2 return 68.567 (the confirmation frame: the drop's impulse + the shockwave under it) … 72.650, the groove 77.583 … 101.583
# (each with ≥ .6 s to the next kick so +1 beat is its own; the double-time neighbours sit in the pre shot)
cd /home/toma/Documents/Kraftek/RetinaRave-wt-fluid2 || exit 1
export PORT=8978 X=0.54 BEAT=0.428571
KICKS="68.567 69.217 69.867 70.717 71.367 72.650 77.583 78.867 84.433 87.867 89.150 98.150 99.433 101.583"
run() { local sc=$1 tag=$2; echo "== $(date +%T) RaindropsOnRoses s$sc $tag K2=$K2"; tools/fluid-kick-strip.sh RaindropsOnRoses $sc $tag "$KICKS" 24 2>&1 | tail -4; }
for spec in "$@"; do sc=${spec%%:*}; rest=${spec#*:}; tag=${rest%%:*}; k2=${rest#*:}; [ "$k2" = "$tag" ] && k2=""; K2="$k2" run $sc $tag; done
echo "== done $(date +%T)"
