#!/bin/bash
# Record the warm-up ruler's input traces (live step 3 warm-up; docs/HARNESS.md "Bars"): per track the whole track from 0
# and four COLD starts (WARM=0: the engine starts AT t0, 40 s each), deterministic, the causal path (&map=0), raw clocks
# (&lead=0), carrying the replay's inputs + the page's own pred fields. Two lanes in parallel (never more Chromes than two).
#   tools/warm-rec.sh [outdir=tools/work/warm]        ~7 min; then tools/warm-ruler.sh
cd "$(dirname "$0")/.."
D=${1:-tools/work/warm}; mkdir -p "$D"
F="$(node tools/bars-replay.js --fields),beatSyn,phrase16Pos,sectionAlt,sectionReturn,boundaryEvt,predKickEvt,predSnareEvt,predHatEvt,predConf,barMatch,barNovelEvt,barReturnEvt"
lane() {
  local port=$1 tr=$2 dur=$3; shift 3
  PORT=$port node tools/filetrace.js $tr 0 $dur $D/$tr-whole.json "$F" '&map=0&lead=0' > $D/$tr-whole.log 2>&1
  for s in "$@"; do
    WARM=0 PORT=$port node tools/filetrace.js $tr $s $(python3 -c "print(min($s+40,$dur))") $D/$tr-cold$s.json "$F" '&map=0&lead=0' > $D/$tr-cold$s.log 2>&1
  done
}
# the cold starts: SeeYouDrop groove / drop 1 / groove-return / drop 2; CyborgNinja's section starts (truth sections)
lane ${PORTA:-8861} SeeYouDrop 157.4 25.6 57.6 89.6 105.6 &
lane ${PORTB:-8862} CyborgNinja 179.8 12.02 48.02 84.02 144.02 &
wait
grep -h "frames ·\|WARNING\|no trace" $D/*.log
