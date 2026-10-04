#!/bin/bash
# Director trace per demo style: every @-event (SECTION / DROP / SCENE / RESTORE / SWITCH) plus the 1 Hz log line
# (sc / sec / alt / ret / bar / gt at the end) from the #test log. usage: GPU=1 tools/director-trace.sh <before|after> [styles...]
#   -> tools/accept/${ACC:-v0.5}/director-<style>-<tag>.txt   styles: aba (190 s) house (120 s) mix (360 s) fake (#test, CLOCK=1, 72 s)
# QOFF=1 turns the grid hold off (CARD.SC.quantise = false right after load) to trace A without B.
# Runs two styles at a time (HARNESS "Tempo traces": never more than two Chrome instances at once).
cd "$(dirname "$0")/.." || exit 1
TAG=${1:-after}; shift
STYLES=${*:-aba house mix fake}
mkdir -p tools/accept/${ACC:-v0.5}
one() {
  local s=$1 W hash steps
  case $s in aba) W=190000;; house) W=120000;; mix) W=360000;; fake) W=72000;; *) W=120000;; esac
  local pre='{"until":"window.CARD"}'; [ -n "$QOFF" ] && pre='{"until":"window.CARD"},{"eval":"CARD.SC.quantise=false"}'
  [ -n "$RENUMOFF" ] && pre='{"until":"window.CARD"},{"eval":"CARD.SC.renumberOn=false"}'   # v0.3 §21: the §10 behaviour (SC.mem keys not renumbered) for the before trace
  if [ "$s" = fake ]; then hash="test${DWELL:+&dwell=$DWELL}"; steps="[$pre,{\"until\":\"window.__FRAME>=4320\",\"timeout\":200000}"; else hash="test&fake=0&demo=$s${DWELL:+&dwell=$DWELL}"; steps="[$pre,{\"wait\":$W}"; fi   # DWELL=0 traces the pre-§95 director
  steps="$steps,{\"eval\":\"CARD.log.filter(l=>/@|\\\\|/.test(l)).join('\\\\n')\"}]"
  if [ "$s" = fake ]; then CLOCK=1 node tools/cdp.js "$hash" "$steps"; else node tools/cdp.js "$hash" "$steps"; fi \
    | grep '^EVAL' | sed 's/^EVAL.*=> //; s/^"//; s/"$//' | sed 's/\\n/\n/g' > "tools/accept/${ACC:-v0.5}/director-$s-$TAG.txt"
}
set -- $STYLES
while [ $# -gt 0 ]; do
  one "$1" & [ -n "$2" ] && one "$2" &
  wait; shift; [ $# -gt 0 ] && shift
done
for s in $STYLES; do f="tools/accept/${ACC:-v0.5}/director-$s-$TAG.txt"; echo "== $s ($(wc -l < "$f") lines)"; grep -c '^SCENE@' "$f" | sed 's/^/SCENE events: /'; grep '^RESTORE@\|^SWITCH@' "$f" | head -3; done
