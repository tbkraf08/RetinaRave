#!/bin/bash
# CLOCK=1 f360/f840 shots of every registered scene → tools/work/<tag>-s<i>-f<N>.jpg + md5 list
# usage: tools/scene-md5.sh <tag> [extra hash params, e.g. '&histfull=1']
cd "$(dirname "$0")/.." || exit 1
TAG=$1; X=$2
mkdir -p tools/work   # a fresh worktree has no tools/work (colour-slot worker)
IDS=$(grep -hoE "^ {2,6}(\{ )?id: [0-9]+" assets/scenes/*/index.js | grep -oE "[0-9]+$" | sort -n)   # scene ids and variant ids (DRUM 4 — v0.5 item 2 found the old grep blind to variants)
: > tools/work/$TAG-md5.txt
for i in $IDS; do
  CLOCK=1 GPU=1 OUT=tools/work node tools/cdp.js "test&scene=$i$X" "[{\"until\":\"window.CARD\"},{\"until\":\"window.__FRAME>=360\"},{\"shot\":\"$TAG-s$i-f360\"},{\"until\":\"window.__FRAME>=840\"},{\"shot\":\"$TAG-s$i-f840\"},{\"eval\":\"'scene $i errs '+JSON.stringify(CARD.ERRS)+' hop '+CARD.ENGINE.tex.hop+' row '+CARD.ENGINE.tex.row\"}]" | grep EVAL | sed 's/.*=> //'
  md5sum tools/work/$TAG-s$i-f360.jpg tools/work/$TAG-s$i-f840.jpg | sed "s|tools/work/$TAG-||" >> tools/work/$TAG-md5.txt
done
cat tools/work/$TAG-md5.txt
