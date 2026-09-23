#!/bin/bash
# Tempo trace per demo style: bpm / bpmSyn / regularity at 1 Hz from the #test log (needs GPU=1 for real-time audio).
# usage: GPU=1 tools/tempo-trace.sh <before|after> [styles...]   -> tools/accept/v0.2/tempo-<style>-<tag>.txt
cd "$(dirname "$0")/.." || exit 1
TAG=${1:-after}; shift
STYLES=${*:-house halftime dnb fakeout aba ambient mix}
mkdir -p tools/accept/v0.2
for s in $STYLES; do
  W=50000; [ "$s" = mix ] && W=360000
  node tools/cdp.js "test&fake=0&demo=$s" "[{\"wait\":$W},{\"eval\":\"CARD.log.filter(l=>/bpm/.test(l)).map(l=>l.split(' ').slice(0,4).join(' ')).join('|')\"},{\"eval\":\"'ms '+CARD.ENGINE.ms.toFixed(3)\"}]" \
    | grep EVAL | sed 's/^EVAL.*=> //; s/^"//; s/"$//' | tr '|' '\n' > "tools/accept/v0.2/tempo-$s-$TAG.txt" &
done
wait
for s in $STYLES; do echo "== $s"; tail -n 3 "tools/accept/v0.2/tempo-$s-$TAG.txt"; done
