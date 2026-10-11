#!/bin/bash
# the S4 highs strips on RaindropsOnRoses only (the user: "only tune with Raindrops, don't do full sweep"): one field strip 60 → 133 s at 1 fps
# per variant with DYE=1 (composite + velocity + dye per second), then the two rulers on the windows: hat_rich 82–91 (hat2 .30–.38, 7–10 hatEvt/s),
# hat_poor 99–102 + 108–110 (hat2 ≤ .07 inside the groove), groove 76–80 + 96–100 (S3's dense groove: the guard's window), thin_break 111–116
# (high .15–.22, highS .03–.06), dense_pads 118–126 (highS .21–.42), outro 127–133 (highS .45–.52 with hat2 0: the air). One Chrome at a time,
# PORT 8978. Usage: run.sh '<tag>|<K2 json>|<SPEC json>' …   (scene 13 always; the fields split on |, JSON has colons)
cd /home/toma/Documents/Kraftek/RetinaRave-wt-fluid2 || exit 1
export PORT=8978 DYE=1
WIN="hat_rich=82-91 hat_poor=99-102,108-110 groove=76-80,96-100 thin_break=111-116 dense_pads=118-126 outro=127-133"
for spec in "$@"; do IFS='|' read -r tag k2 sp <<< "$spec"
  echo "== $(date +%T) RaindropsOnRoses s13 $tag K2=$k2 SPEC=$sp"
  K2="$k2" SPEC="$sp" tools/fluid-field-strip.sh RaindropsOnRoses 13 $tag 60 133 1 24 2>&1 | tail -2
  D=tools/work/fluid2/field/RaindropsOnRoses-s13-$tag
  python3 tools/fluid-highs-grain.py $D $tag $WIN > $D/highs.txt; grep '^#' $D/highs.txt
  python3 tools/fluid-mids-lap.py $D $tag $WIN > $D/mids.txt
done
echo "== done $(date +%T)"
