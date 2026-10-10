#!/bin/bash
# Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
# use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
# Source: https://github.com/tbkraf08/RetinaRave
# The DROP STRIP (DECISIONS §113; HARNESS "## Fluid"): FLUID (scene 12) on a real track, one deterministic whole-track run (at=0, CLOCK=1
# GPU=1, keyed on __FRAME: heard t = (frame − 2)/60 — rule 1, frame0 must read 2), shot every 0.1 s from 1.5 beats before each confirmed
# drop to 1.5 beats after, on the LIVE lanes (&map=0: the design target — the live detector is the whole truth there) or the file map.
#   BEAT=<s> [K='{"SW_K":0}'] PORT=88xx tools/fluid-drop-strip.sh <track> <map 0|1> <tag> "<drop s> …"
#     → tools/work/fluid-drop/<track>-m<map>-<tag>/<shots>.jpg + grey.txt (name t mean p99 centre: the whole-frame grey mean / p99 as §106–§111
#       measured, and the CENTRE grey — the mean inside a disc of radius 0.25·H round the canvas centre, the region the shockwave empties)
#   K = a one-run override of the grammar's constants (CARD.fluid.K, live) applied before the track opens: '{"SW_K":0}' = the §107 spike alone,
#   '{"DROP_DISS":1}' = the shockwave alone; BEAT = the grammar's beat (the clock's 60/bpm on that track: SeeYouDrop .4, Vienna .667, 117.6 bpm .51).
# The drop seconds are the grammar's CONFIRMED clears on that mode's trace (tools/fluid-replay.js / tools/fluid-tracks.js print them), not the
# truth's bar lines. One Chrome at a time: a shared GPU moves frame0 (§107's pitfall). GREYONLY=1 recomputes grey.txt on shots already taken.
cd "$(dirname "$0")/.." || exit 1
T=$1; M=$2; TAG=$3; DROPS=$4; BEAT=${BEAT:-0.5}; PORT=${PORT:-8977}
[ -z "$T" ] || [ -z "$M" ] || [ -z "$TAG" ] || [ -z "$DROPS" ] && { echo "usage: BEAT=<s> [K=json] PORT=88xx tools/fluid-drop-strip.sh <track> <map> <tag> \"<drop s> …\""; exit 2; }
D=tools/work/fluid-drop/$T-m$M-$TAG; mkdir -p $D
MH=""; [ "$M" = 0 ] && MH="&map=0"
LIST=$(python3 - "$DROPS" "$BEAT" <<'PY'
import sys, math
drops, beat = [float(x) for x in sys.argv[1].split()], float(sys.argv[2])
n = math.ceil(1.5 * beat / 0.1)
out = []
for i, d in enumerate(drops):
    for k in range(-n, n + 1): out.append(('drop%d-%06.2f' % (i + 1, d + k * 0.1), d + k * 0.1))
out.sort(key=lambda x: x[1])
print(' '.join('%s:%.3f' % o for o in out))
PY
)
S='[{"until":"window.CARD"}'
[ -n "$K" ] && S="$S,{\"eval\":\"JSON.stringify(Object.assign(CARD.fluid.K,$K))\"}"
S="$S,{\"until\":\"CARD.ENGINE.AU.file&&CARD.ENGINE.AU.file.open\",\"timeout\":300000},{\"eval\":\"JSON.stringify({f0:CARD.ENGINE.AU.file.frame0,dur:CARD.ENGINE.AU.file.dur,fluid:CARD.fluid&&{on:CARD.fluid.on,tier:CARD.fluid.tier,sim:[CARD.fluid.simW,CARD.fluid.simH]},K:{SW_K:CARD.fluid.K.SW_K,DROP_DISS:CARD.fluid.K.DROP_DISS}})\"}"
for item in $LIST; do N=${item%%:*}; TT=${item##*:}; F=$(python3 -c "print(2+round($TT*60))")
  S="$S,{\"until\":\"window.__FRAME>=$F\",\"timeout\":900000},{\"shot\":\"$N\"},{\"eval\":\"'$N f'+window.__FRAME+' heard '+CARD.MS.heardT.toFixed(3)+' dd '+CARD.fluid.params.dyeDiss.toFixed(2)+' wave '+JSON.stringify(CARD.fluid.wave)+' ring '+JSON.parse(CARD.REG[12].scene.hooks.flinfo()).ring\"}"
done
S="$S,{\"eval\":\"JSON.stringify({f0:CARD.ENGINE.AU.file.frame0,frame:window.__FRAME,errs:CARD.ERRS,bad:CARD.nonFinite(),steps:CARD.fluid&&CARD.fluid.steps})\"}]"
T0=$(date +%s)
[ -n "$GREYONLY" ] || CLOCK=1 GPU=1 OUT=$D PORT=$PORT node tools/cdp.js "test&track=$T&at=0&scene=12$MH" "$S" 2>&1 | grep -E 'EVAL|TIMEOUT|EXC|console.error' | sed 's/.*=> //' > $D/evals.txt
python3 - "$D" "$LIST" > $D/grey.txt <<'PY'
import sys; from PIL import Image, ImageStat, ImageDraw
d, items = sys.argv[1], sys.argv[2].split()
for it in items:
    n, t = it.split(':')
    try:
        L = Image.open(f'{d}/{n}.jpg').convert('L'); w, h = L.size; g = ImageStat.Stat(L).mean[0]
        hist = L.histogram(); c = 0; tot = sum(hist); p99 = 255
        for v, cnt in enumerate(hist):
            c += cnt
            if c >= 0.99 * tot: p99 = v; break
        m = Image.new('L', (w, h), 0); r = 0.25 * h; ImageDraw.Draw(m).ellipse((w / 2 - r, h / 2 - r, w / 2 + r, h / 2 + r), fill=255)
        ctr = ImageStat.Stat(L, m).mean[0]
    except Exception as e: g = p99 = ctr = float('nan')
    print(f'{n} {float(t):.2f} {g:.1f} {p99} {ctr:.1f}')
PY
echo "== $T m$M $TAG: $(head -1 $D/evals.txt | cut -c1-120) · $(tail -1 $D/evals.txt | cut -c1-100) · $(wc -l < $D/grey.txt) shots · $(( $(date +%s) - T0 )) s"
echo "centre: $(awk '{printf "%s ", $5}' $D/grey.txt)"
