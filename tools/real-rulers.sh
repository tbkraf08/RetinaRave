#!/bin/bash
# Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
# use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
# Source: https://github.com/tbkraf08/RetinaRave
# REAL-TRACK behaviour rulers for EVERY scene on EVERY library track (DECISIONS §109; HARNESS "Real-music acceptance"): one deterministic
# run per scene × track on the track's `rulers` window (tools/truth/windows.json: 60 s from 20 s before the loudest 30 s — SeeYouDrop
# 40 → 100 s; the pad take 0 → 24.4 s; cold at `from`, CLOCK=1, the five rules) through tools/lumtrace.js with its three rulers —
# the luminance ruler (10 fps: clipFrac ≥ .25 frames, median Y, grad), the picture's continuity (--jump=1, every frame: the monitor's
# spike rule on mean |ΔY| outside event frames + 0.3 s; black frames) and the continuity monitor on the scene's OWN state (--mon=1,
# CARD.NAV = REG[id].scene.state where it is monitor-shaped) — into ONE table.
#   GPU=1 PORT=88xx tools/real-rulers.sh <tag>      -> tools/work/rulers-<tag>/s<id>-<track>.{csv,txt,json,log} + the table on stdout
#   the DEFAULT (tools/accept.sh): SCENES = the roster (0 1 3 12; FLUID bids since §114) on every track + the take; FULL=1 = every registered id.
#   scope: SCENES="0 3" TRACKS="SeeYouDrop rec"; MAP=0 runs the live lanes (&map=0; the take always does); PAR=2 two scene lanes
#   (PORT, PORT+1 — never while a bench runs).  RECWAV=<dir with rec.wav> (default tools/work/fluid-diag/music).  TABLE=1 re-tabulates
#   the runs already in tools/work/rulers-<tag>/ without running (the FAIL rules applied again).
# FAIL rules (§109's picks, from what HARNESS already defines): mon viol non-empty · jump viol non-empty · black frames > 5 % of the
# window (the §107 clear is one beat) · clipFrac ≥ 0.25 on > 2 % of the sampled frames (the NAV complaint's worst frame read 0.176, §99)
# · page errs / nonFinite. A scene that FAILS is a FINDING (record it in DECISIONS §109's open list; do not retune it here). A track with
# `gate: false` in windows.json (Malicious — the user: "can ignore malicious until I validate the ruler") prints its FAIL as a note.
cd "$(dirname "$0")/.." || exit 1
TAG=$1; [ -z "$TAG" ] && { echo "usage: GPU=1 PORT=88xx tools/real-rulers.sh <tag>"; exit 2; }
PORT=${PORT:-8941}; PAR=${PAR:-1}
ALLIDS=$(grep -hoE "^ {2,6}(\{ )?id: [0-9]+" assets/scenes/*/index.js | grep -oE "[0-9]+$" | sort -n)
if [ -n "$FULL" ]; then SCENES=${SCENES:-$ALLIDS}; else SCENES=${SCENES:-0 1 3 12}; fi
TRACKS=${TRACKS:-$(python3 -c "import json;print(' '.join(json.load(open('tools/truth/windows.json'))['tracks']))")}
RECWAV=${RECWAV:-tools/work/fluid-diag/music}
has() { case " $1 " in *" $2 "*) return 0;; esac; return 1; }
if has "$TRACKS" rec && [ ! -f $RECWAV/rec.wav ]; then echo "skip rec: no $RECWAV/rec.wav (the §108 take)"; TRACKS=$(echo " $TRACKS " | sed 's/ rec / /'); fi
D=tools/work/rulers-$TAG; mkdir -p $D
[ -n "$TABLE" ] && SCENES=$(ls $D/s*.json 2>/dev/null | sed 's|.*/s\([0-9]*\)-.*|\1|' | sort -nu | tr '\n' ' ')
row() {   # row <scene> <track>: the table line from lumtrace's .json; exit 1 on a FAIL
  node -e "
    const R=JSON.parse(require('fs').readFileSync('$D/s$1-$2.json','utf8')),J=R.J,M=R.MON,fails=[];
    if(M&&M.viol.length)fails.push('mon viol '+JSON.stringify(M.viol).slice(0,90));
    if(J.viol.length)fails.push('jump viol '+JSON.stringify(J.viol).slice(0,90));
    if(J.black>0.05*(J.n+1))fails.push('black '+J.black);
    if(R.clip25>0.02*R.frames)fails.push('clip25 '+R.clip25);
    if(R.pageErrs&&R.pageErrs.length)fails.push('errs '+JSON.stringify(R.pageErrs).slice(0,60));
    if(R.nonFinite&&R.nonFinite.length)fails.push('nonFinite '+R.nonFinite.join(','));
    const p=(v,w)=>String(v).padEnd(w);
    const gate=(JSON.parse(require('fs').readFileSync('tools/truth/windows.json','utf8')).tracks[R.track]||{}).gate!==false;   // Malicious: not a gate (windows.py NO_GATE)
    console.log(p(R.scene,3)+' '+p(R.name,9)+' '+p(R.track,15)+' '+p(R.from+'-'+R.to,9)+' '+p(R.cuts,10)+' | '+p(R.frames,5)+' '+p(R.clip25,5)+' '+p(R.medY.toFixed(3),6)+' '+p(R.grad.toFixed(4),6)+' | '+p(J.n,5)+' '+p(J.max.toFixed(3),6)+' '+p(J.viol.length,5)+' '+p(J.black,5)+' | '+p(M?M.n:'-',5)+' '+p(M?M.max:'-',6)+' '+p(M?M.viol.length:'-',5)+' | '+(fails.length?(gate?'FAIL ':'note (not a gate) ')+fails.join('; '):'ok'));
    process.exit(fails.length&&gate?1:0)"
}
lane() {   # lane <k>: the k-th of every PAR scenes, on PORT+k
  local k=$1 port=$((PORT + k)) j=0 i t
  for i in $SCENES; do
    if [ $((j % PAR)) = $k ]; then for t in $TRACKS; do
      local fr to mx="" music=""; fr=$(python3 -c "import json;print(json.load(open('tools/truth/windows.json'))['tracks']['$t']['rulers']['from'])"); to=$(python3 -c "import json;print(json.load(open('tools/truth/windows.json'))['tracks']['$t']['rulers']['to'])")
      [ "${MAP:-1}" = 0 ] || [ "$t" = rec ] && mx="--map=0"; [ "$t" = rec ] && music=$PWD/$RECWAV
      [ -n "$TABLE" ] || MUSIC=$music node tools/lumtrace.js $t --scene=$i --from=$fr --to=$to --warm=0 --fps=10 --sheet=0 --jump=1 --mon=1 $mx --port=$port --out=$D/s$i-$t > $D/s$i-$t.out 2>&1
      if [ -f $D/s$i-$t.json ]; then row $i $t; else echo "$i $t FAIL no result ($(tail -2 $D/s$i-$t.out | tr '\n' ' ' | cut -c1-160))"; fi
    done; fi
    j=$((j + 1))
  done
}
T0=$(date +%s)
printf '%-3s %-9s %-15s %-9s %-10s | %-5s %-5s %-6s %-6s | %-5s %-6s %-5s %-5s | %-5s %-6s %-5s | %s\n' id scene track window cuts frames clip25 medY grad jumpN jumpMx jviol black monN monMx mviol verdict | tee $D/table.txt
for ((k = 0; k < PAR; k++)); do lane $k > $D/lane$k.txt & done; wait
cat $D/lane*.txt | sort -k1,1n -k3,3 | tee -a $D/table.txt
NF=$(grep -c FAIL $D/table.txt)
echo "real-rulers $TAG: $(echo $SCENES | wc -w) scenes × $(echo $TRACKS | wc -w) tracks, $NF FAIL, $(( $(date +%s) - T0 )) s wall (map ${MAP:-1}, PAR $PAR)" | tee -a $D/table.txt
