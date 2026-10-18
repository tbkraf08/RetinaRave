#!/bin/bash
# CLOCK=1 f360/f840 shots of every registered scene → tools/work/<tag>-s<i>-f<N>.jpg + md5 list
# usage: tools/scene-md5.sh <tag> [extra hash params, e.g. '&histfull=1']     IDS="3" (or "3 7") shoots only those ids — a scene-folder
# change is proven on its own lines (HARNESS "What to re-prove"); the full list is for main.js / core / engine changes.
# §118 (2026-10-11, the lean-down): the registry is 6 scenes on dense ids — fluid 0, fluid2 1, nav2 2, dust 3, torus2 4, mandala 5 —
# so a full list was 12 lines; §140 added nav3 at id 6 (key 7, forced-only): 7 scenes, 14 lines. The references in tools/accept/v0.3*/ carry the NEW names (the hashes never moved: the renumber is a
# registration order, not a pixel). The DRUM variant went with the archived nav, so the id grep no longer finds a variant id.
cd "$(dirname "$0")/.." || exit 1
TAG=$1; X=$2
mkdir -p tools/work   # a fresh worktree has no tools/work (colour-slot worker)
IDS=${IDS:-$(grep -hoE "^ {2,6}(\{ )?id: [0-9]+" assets/scenes/*/index.js | grep -oE "[0-9]+$" | sort -n)}   # scene ids and variant ids (DRUM 4 — v0.5 item 2 found the old grep blind to variants)
: > tools/work/$TAG-md5.txt
for i in $IDS; do
  CLOCK=1 GPU=1 OUT=tools/work node tools/cdp.js "test&scene=$i$X" "[{\"until\":\"window.CARD\"},{\"until\":\"window.__FRAME>=360\"},{\"shot\":\"$TAG-s$i-f360\"},{\"until\":\"window.__FRAME>=840\"},{\"shot\":\"$TAG-s$i-f840\"},{\"eval\":\"'scene $i errs '+JSON.stringify(CARD.ERRS)+' hop '+CARD.ENGINE.tex.hop+' row '+CARD.ENGINE.tex.row\"}]" | grep EVAL | sed 's/.*=> //'
  md5sum tools/work/$TAG-s$i-f360.jpg tools/work/$TAG-s$i-f840.jpg | sed "s|tools/work/$TAG-||" >> tools/work/$TAG-md5.txt
done
cat tools/work/$TAG-md5.txt
