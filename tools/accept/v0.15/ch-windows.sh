#!/bin/bash
# The nine CHLADNI acceptance windows on SeeYouDrop (docs/workers/brief-chladni.md step 7 / the session prompt Part B).
# One Chrome at a time, PORT 8814, deterministic file mode, every window warmed from t 0 (WARM=999) so the scene's
# tonic latch has the whole track behind it — the same latch a real listening session would have.
#   bash tools/accept/v0.15/ch-windows.sh [only-tag]
cd "$(dirname "$0")/../../.." || exit 1
W() {
  local tag=$1 t0=$2 t1=$3 shots=$4
  if [ -n "$ONLY" ] && [ "$ONLY" != "$tag" ]; then return; fi
  echo "=== $tag  $t0 -> $t1"
  WARM=999 PORT=${PORT:-8814} timeout 1800 node tools/accept/v0.15/chwin.js SeeYouDrop "$t0" "$t1" "$tag" "$shots"
}
ONLY=$1
W ch-w1  13    25    '14.2,17.2,20.6,23.8'                  # 1 the walk: four distinct figures
W ch-w2  25    45    '28.0,30.05,33.0,36.0,40.0,44.0'       # 2 the groove: a leap per kick, the root figure holds
W ch-w3a 44.9  50    '45.5,47.0,48.5,49.6'                  # 3 climb 1: density and the camera rising
W ch-w3b 96    101.5 '96.8,98.2,99.6,100.9'                 # 3 climb 2 (double time)
W ch-w4  49.9  57.6  '50.5,52.5,54.5,56.5,57.4'             # 4 the void: plate silent, sand floating, spiral
W ch-w5a 57.0  59.5  '57.55,57.617,57.65,57.75,58.2,59.0'   # 5 drop 1 on its bar line
W ch-w5b 105.0 107.5 '105.55,105.60,105.65,105.75,106.2,107.0'  # 5 drop 2
W ch-w6  57.6  90    '60.0,66.0,72.0,78.0,84.0,88.0'        # 6 the slides
W ch-w7  105.7 130   '108.0,112.0,116.0,120.0,124.0,128.0'  # 7 the gated drop 2
W ch-w8  134.5 157   '136.0,140.0,144.0,148.0,152.0,156.0'  # 8 the outro
