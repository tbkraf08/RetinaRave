#!/bin/bash
# the S3 snare strips on RaindropsOnRoses only: the groove's 10 isolated strong snares (snareAmp ≥ .9, the next snare ≥ .45 s later, the
# previous ≥ .2 s before — from the trace), pre / +0 / +½ / +1 beat, the sideways ruler. One Chrome at a time, PORT 8978.
cd /home/toma/Documents/Kraftek/RetinaRave-wt-fluid2 || exit 1
export PORT=8978 LANE=snare BEAT=0.428571
SNARES="78.217 83.567 85.067 85.717 88.283 92.567 96.000 98.783 100.717 102.850"
for spec in "$@"; do sc=${spec%%:*}; rest=${spec#*:}; tag=${rest%%:*}; k2=${rest#*:}; [ "$k2" = "$tag" ] && k2=""
  echo "== $(date +%T) RaindropsOnRoses s$sc $tag K2=$k2"
  K2="$k2" tools/fluid-kick-strip.sh RaindropsOnRoses $sc $tag "$SNARES" 24 2>&1 | tail -1
  D=tools/work/fluid2/snare/RaindropsOnRoses-s$sc-$tag; SX=$(python3 -c "import json,sys; print(json.loads(sys.argv[1] or '{}').get('SNARE_X', 0.02))" "$k2")
  python3 tools/fluid-snare-travel.py $D $tag 0.5 0.12 $SX > $D/travel.txt; grep '^#' $D/travel.txt
done
echo "== done $(date +%T)"
