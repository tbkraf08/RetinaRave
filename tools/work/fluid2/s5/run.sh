#!/bin/bash
# the S5 pen strips on RaindropsOnRoses only (the user: "only tune with Raindrops, don't do full sweep"): one field strip 76 → 137 s at 1 fps per
# variant with DYE=1 (composite + velocity + dye per second) over the groove (76–110) and the breakdown (111.4–137.1: the thin 111–116, the pads
# 118–126, the outro 127–137 with the 129.98 s clear); then the highs ruler for the speed / dink / dgrad columns per window (the pen's push is the
# guard: the pool's speed vs the pen-off strip) and the pen's own fields on the evals line. One Chrome at a time, PORT 8978.
# Usage: run.sh '<tag>|<K2 json>' …
cd /home/toma/Documents/Kraftek/RetinaRave-wt-fluid2 || exit 1
export PORT=8978 DYE=1
WIN="groove=76-110 breakdown=111-137 thin=111-116 pads=118-126 outro=127-137"
for spec in "$@"; do IFS='|' read -r tag k2 <<< "$spec"
  echo "== $(date +%T) RaindropsOnRoses s13 $tag K2=$k2"
  K2="$k2" tools/fluid-field-strip.sh RaindropsOnRoses 13 $tag 76 137 1 24 2>&1 | tail -2
  D=tools/work/fluid2/field/RaindropsOnRoses-s13-$tag
  python3 tools/fluid-highs-grain.py $D $tag $WIN > $D/highs.txt; grep '^#' $D/highs.txt
done
echo "== done $(date +%T)"
