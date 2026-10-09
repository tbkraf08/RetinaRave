#!/bin/bash
# Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
# use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
# Source: https://github.com/tbkraf08/RetinaRave
# The REAL MS traces the node tests run on (DECISIONS §109; HARNESS "Real-music acceptance"): every recordable MS field, per frame,
# of a deterministic cold-start file run (tools/filetrace.js, WARM=0, the four rules) — what the engine publishes on music, for
# EVERY track in the library (~/Music/RetinaRave: Comptine CyborgNinja IBelongHere Malicious SeeYouDrop Vienna WhoLikesToParty)
# 0 → 110 s in BOTH modes — <Track>-map1.json the normal file mode (the track map: mapDropEvt on the bar line) and <Track>-map0.json
# the same audio on the LIVE lanes (&map=0: the ears causal, the build detector, the queue) — plus rec-map0.json, the user's pad take
# (FLUID-DIAG-2026-10-09, tools/work/fluid-diag/music/rec.wav) 0 → 24.4 s on the live lanes. ~16 MB each (6600 frames × 213 fields),
# ~2 min each — gitignored (tools/truth/traces/*.json); this script re-records them (~30 min for all 15) and tools/test_music.js /
# tools/test_fluid.js say so when one is missing. Two recordings cmp-equal (HARNESS "File source").
#   PORT=88xx tools/traces.sh [names…]        names: <Track>-map1 <Track>-map0 rec-map0 (default: all 15); TRACKS="A B" limits the default
cd "$(dirname "$0")/.." || exit 1
mkdir -p tools/truth/traces
TRACKS=${TRACKS:-Comptine CyborgNinja IBelongHere Malicious SeeYouDrop Vienna WhoLikesToParty}
W=${*:-$(for t in $TRACKS; do echo $t-map1 $t-map0; done) rec-map0}
for n in $W; do
  if [ "$n" = rec-map0 ]; then
    [ -f tools/work/fluid-diag/music/rec.wav ] || { echo "no tools/work/fluid-diag/music/rec.wav (the §108 take: ffmpeg -i <take>.webm -vn -c:a pcm_s16le tools/work/fluid-diag/rec-audio-48k.wav; ln -s ../rec-audio-48k.wav tools/work/fluid-diag/music/rec.wav)"; continue; }
    MUSIC=$PWD/tools/work/fluid-diag/music WARM=0 node tools/filetrace.js rec 0 24.4 tools/truth/traces/rec-map0.json '*' '&map=0'
  else
    t=${n%-map*}; m=${n##*-map}; X=""; [ "$m" = 0 ] && X='&map=0'
    WARM=0 node tools/filetrace.js $t 0 110 tools/truth/traces/$n.json '*' "$X"
  fi
done
ls -la tools/truth/traces/
