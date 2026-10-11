#!/bin/bash
# the S3 mids strips on RaindropsOnRoses only (the user: "only tune with Raindrops, don't do full sweep"): one field strip 60 → 130 s at 1 fps per
# variant (the groove 76–110 dense, the breakdown's first 5 s 111–116 thin, its pads 118–126 dense again, the sub cut 66–67 thin), then the
# Laplacian ruler on the windows. One Chrome at a time, PORT 8978. Usage: run-mids.sh '<scene>:<tag>[:<K2 json>]' …
cd /home/toma/Documents/Kraftek/RetinaRave-wt-fluid2 || exit 1
export PORT=8978
WIN="dense_groove=76-80,96-100 dense_pads=118-126 thin_break=111-116 thin_cut=65.5-68"
for spec in "$@"; do sc=${spec%%:*}; rest=${spec#*:}; tag=${rest%%:*}; k2=${rest#*:}; [ "$k2" = "$tag" ] && k2=""
  echo "== $(date +%T) RaindropsOnRoses s$sc $tag K2=$k2"
  K2="$k2" tools/fluid-field-strip.sh RaindropsOnRoses $sc $tag 60 130 1 24 2>&1 | tail -2
  D=tools/work/fluid2/field/RaindropsOnRoses-s$sc-$tag
  python3 tools/fluid-mids-lap.py $D $tag $WIN > $D/mids.txt; grep '^#' $D/mids.txt
done
echo "== done $(date +%T)"
