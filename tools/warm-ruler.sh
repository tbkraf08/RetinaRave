#!/bin/bash
# Replay every trace tools/warm-rec.sh recorded through the CURRENT tree's bar store, then grade the warm-up
# (tools/truth/warmcheck.py). Seconds. EXTRA='--set ...' is passed to the replay.
#   tools/warm-ruler.sh [tag=cur] [indir=tools/work/warm]      replays -> tools/work/warm-<tag>/
cd "$(dirname "$0")/.."
I=${2:-tools/work/warm}; O=tools/work/warm-${1:-cur}; rm -rf "$O"; mkdir -p "$O"
for f in $I/*-whole.json $I/*-cold*.json; do node tools/bars-replay.js $f $O/rp-$(basename $f) $EXTRA > /dev/null || echo "FAIL $f"; done
python3 tools/truth/warmcheck.py $O
