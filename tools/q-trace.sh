#!/bin/bash
# Q trace (v0.2 §16): the adaptive-quality knob q at 1 Hz across a whole demo track, with the scene sequence, so one
# scene's cost shows as what it does to every OTHER scene's tier — the controller is global (core/quality.js: −0.2 per
# half second over 26.5 ms, −0.07 over 18.8 ms, +0.04 per 2.5 s of good frames back). A 17 ms scene therefore lowers
# every scene's tier for ~30 s after it leaves; the trace of q is the disease, the scene's own bench only the symptom.
# usage: GPU=1 tools/q-trace.sh <before|none|after> [styles]     styles: house (120 s) aba (190 s)
#   -> tools/accept/${ACC:-v0.5}/q-<style>-<tag>.txt : RUNS=3 runs, "== run N" separated; each run = the @-events and the 1 Hz
#      lines of the #test log (they end in `sc<id> … q<q>`), plus VISIT@ markers. node tools/q-stats.js summarises.
# ONE Chrome at a time, runs strictly sequential (unlike director-trace.sh): a second instance alone sinks q to 0
# (director-aba-after.txt was traced beside house and sat at q 0.00–0.06 the whole run). Nothing else may load the
# machine while this runs — no worker shots, no bench. The demo synths use Math.random(): three runs, judge on means.
# VISIT=40:70 (default since §118): at 40 s the scene QID (default 0 = FLUID) is forced (a hard cut), released at 70 s into a soft
# switch home (QHOME, default 2 = NAV2). A third field is a DEPTH for a scene that declares `hooks.feig` — FEIGEN did (VISIT=40:70:2.5
# forced scene 6 with the dive at L 2.5); it is archived, so the field is empty by default. The old wording follows:
# at 40 s scene 6 (FEIGEN) was forced (a hard cut) with the dive set to L 2.5 (the depth a
# section of a minute reaches; a visit that starts at the arrival depth stays under L 1.3 for 30 s and costs nothing —
# the first `before` runs showed q untouched), at 70 s released into a soft switch home, so every run has one 30 s deep
# FEIGEN visit at the same place on the clock and the 1 Hz windows [40,70) (during) and [70,100) (after) compare
# across tags. Tag `none` (or NONE=1): FEIGEN's score is made 0 after load (never auto-picked, CONTRACTS §4) and the visit is skipped — the run with FEIGEN as good as unregistered, same clock, same windows.
# VISIT= (empty) traces the director's own picks only. X='&fluid=0' (any extra hash) reaches the page: the fluid substrate's A/B (DECISIONS §104) is
# `X='&fluid=0' tools/q-trace.sh fluidoff` against `tools/q-trace.sh after` — the same visit, the same clock, the substrate off vs on.
cd "$(dirname "$0")/.." || exit 1
TAG=${1:-after}; shift
STYLES=${*:-house aba}
RUNS=${RUNS:-3}
VISIT=${VISIT-40:70}        # §118 (2026-10-11, the lean-down): no depth field by default — FEIGEN and its `hooks.feig` dive are archived
QID=${QID:-0}               # §118: the scene the visit forces, by id (default 0 = FLUID, the costliest roster scene; it was 6 = FEIGEN until the lean-down)
QHOME=${QHOME:-2}          # §118: the id the release returns to (the home, NAV2)
[ "$TAG" = none ] && NONE=1
mkdir -p tools/accept/${ACC:-v0.5}
one() {
  local s=$1 W steps pre
  case $s in aba) W=190000;; house) W=120000;; mix) W=360000;; *) W=120000;; esac
  pre='{"until":"window.CARD"}'
  [ -n "$NONE" ] && pre="$pre,{\"eval\":\"CARD.REG[$QID].scene.score=function(){return 0};'none: scene $QID score 0'\"}"
  if [ -n "$VISIT" ] && [ -z "$NONE" ]; then
    local a=${VISIT%%:*} rest=${VISIT#*:} b L0; b=${rest%%:*}; L0=${rest#*:}; [ "$L0" = "$rest" ] && L0=
    local hook=; [ -n "$L0" ] && hook="CARD.hooks.feig($L0);"   # a depth only where a scene declares that hook (FEIGEN did; §118 archived it)
    steps="[$pre,{\"wait\":$((a*1000))},{\"eval\":\"${hook}CARD.SC.forced=$QID;CARD.log.push('VISIT@'+(performance.now()/1000).toFixed(2)+' -> $QID L$L0');'forced $QID'\"},{\"wait\":$(((b-a)*1000))},{\"eval\":\"CARD.SC.forced=-1;CARD.goScene($QHOME,false);CARD.log.push('VISIT@'+(performance.now()/1000).toFixed(2)+'  -> $QHOME '+(CARD.REG[$QID].scene.rt.label||'')+' '+(CARD.REG[$QID].scene.rt.log||''));'released'\"},{\"wait\":$((W-b*1000))}"
  else
    steps="[$pre,{\"wait\":$W}"
  fi
  steps="$steps,{\"eval\":\"CARD.log.filter(l=>/@|\\\\|/.test(l)).join('\\\\n')\"},{\"eval\":\"'END errs '+JSON.stringify(CARD.ERRS)+' bad '+JSON.stringify(CARD.nonFinite())\"}]"
  node tools/cdp.js "test&fake=0&demo=$s$X" "$steps" | grep -E '^EVAL|^\[EXC\]' | sed 's/^EVAL.*=> //; s/^"//; s/"$//' | sed 's/\\n/\n/g'
}
for s in $STYLES; do
  f="tools/accept/${ACC:-v0.5}/q-$s-$TAG.txt"; : > "$f"
  for r in $(seq 1 "$RUNS"); do
    echo "== run $r ($s, $TAG, visit ${VISIT:-none}${NONE:+, FEIGEN score 0})" >> "$f"
    one "$s" >> "$f"
  done
  echo "== $s → $f ($(wc -l < "$f") lines, $(grep -c '^SCENE@' "$f") SCENE events, $(grep -c '\[EXC\]' "$f") EXC)"
done
node tools/q-stats.js $(for s in $STYLES; do echo "tools/accept/${ACC:-v0.5}/q-$s-$TAG.txt"; done)
