#!/bin/bash
# Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
# use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
# Source: https://github.com/tbkraf08/RetinaRave
# REAL-TRACK identity references (DECISIONS §109; HARNESS "Real-music acceptance"): the md5 of a scene's frame on REAL MUSIC,
# deterministically (the five rules of "File source": CLOCK=1, frame0 2, the window addressed by __FRAME, heardT = at + (frame − 2)/60),
# for every library track at the windows tools/truth/windows.json derives from each track's own structure (tools/truth/windows.py:
# intro · groove · quiet · build/drop 1 · build/drop 2 — a boundary where a track has no drop) in BOTH map modes: &map=1 the normal
# file mode (the track map's percussion and drops) and &map=0 the live lanes on the same audio (capture / mic / a take) — and the
# user's pad take (rec, &map=0 only: a take has no map). The fake timeline's list (tools/scene-md5.sh) is the fast smoke; a scene
# or engine change is PROVEN here.
#   GPU=1 PORT=88xx tools/real-md5.sh <tag>         -> tools/work/real-<tag>/<name>.jpg + tools/work/real-<tag>-md5.txt (the list)
#   the DEFAULT (tools/accept.sh): SCENES = the roster (0 1 3 12; FLUID bids since §114), every track, both modes, WINDOWS = intro groove build1 drop1
#   (boundary1 on a drop-less track) + the take's intro / chords; FULL=1 = every registered id and every window (quiet, build2, drop2).
#   scope: SCENES="0 3" TRACKS="SeeYouDrop rec" MODES="1" WINDOWS="groove drop1"   — a scene-folder change is proven on its own lines
#   PAR=2 runs two scene lanes at once on PORT and PORT+1 (the md5s do not move: rule 1 holds the clock through the decode — proven
#   at §109 — but every bench does, so never while a bench runs).  RECWAV=<dir with rec.wav> (default tools/work/fluid-diag/music).
# One line per shot: "<md5>  s<id>-<track>-<window>-f<N>-m<map>.jpg", sorted; one status line per run: f0 (must be 2), errs, bad, heard.
# Two runs must cmp-equal (the standing determinism proof); the reference list is tools/accept/$ACC/real-md5-<acc>.txt.
cd "$(dirname "$0")/.." || exit 1
TAG=$1; [ -z "$TAG" ] && { echo "usage: GPU=1 PORT=88xx tools/real-md5.sh <tag>"; exit 2; }
PORT=${PORT:-8921}; PAR=${PAR:-1}
ALLIDS=$(grep -hoE "^ {2,6}(\{ )?id: [0-9]+" assets/scenes/*/index.js | grep -oE "[0-9]+$" | sort -n)
if [ -n "$FULL" ]; then SCENES=${SCENES:-$ALLIDS}; WINDOWS=${WINDOWS:-intro groove quiet build1 drop1 boundary1 build2 drop2 boundary2 chords}
else SCENES=${SCENES:-0 1 3 12}; WINDOWS=${WINDOWS:-intro groove build1 drop1 boundary1 chords}; fi
MODES=${MODES:-1 0}
TRACKS=${TRACKS:-$(python3 -c "import json;print(' '.join(json.load(open('tools/truth/windows.json'))['tracks']))")}
RECWAV=${RECWAV:-tools/work/fluid-diag/music}
D=tools/work/real-$TAG; mkdir -p $D; LIST=tools/work/real-$TAG-md5.txt
has() { case " $1 " in *" $2 "*) return 0;; esac; return 1; }
if has "$TRACKS" rec && [ ! -f $RECWAV/rec.wav ]; then echo "skip rec: no $RECWAV/rec.wav (the §108 take)"; TRACKS=$(echo " $TRACKS " | sed 's/ rec / /'); fi
# the job list: one line per run — "<scene> <track> <at> <map> <name:frame> …" (windows.json's runs, filtered to WINDOWS)
JOBS=$(python3 - "$SCENES" "$TRACKS" "$MODES" "$WINDOWS" <<'EOF'
import json, sys
scenes, tracks, modes, wins = (a.split() for a in sys.argv[1:5])
W = json.load(open('tools/truth/windows.json'))['tracks']
for i in scenes:
    for t in tracks:
        if t not in W: print('no windows for', t, file=sys.stderr); continue
        for m in modes:
            if W[t].get('map0only') and m != '0': continue
            for r in W[t]['runs']:
                sh = [s for s in r['shots'] if s['name'] in wins]
                if sh: print(i, t, '%g' % r['at'], m, ' '.join('%s:%d' % (s['name'], s['f']) for s in sh))
EOF
)
# run <port> <scene> <track> <at> <map> <name:frame …>
run() {
  local port=$1 i=$2 track=$3 at=$4 map=$5; shift 5
  local steps='[{"until":"window.CARD"},{"until":"CARD.ENGINE.AU.file&&CARD.ENGINE.AU.file.open","timeout":300000}' names=() wf
  for wf in "$@"; do local w=${wf%%:*} f=${wf##*:}; local n="s$i-$track-$w-f$f-m$map"; names+=("$n")   # two statements: bash expands a whole `local` line before assigning
    steps="$steps,{\"until\":\"window.__FRAME>=$f\",\"timeout\":900000},{\"shot\":\"$n\"}"
  done
  steps="$steps,{\"eval\":\"JSON.stringify({f0:CARD.ENGINE.AU.file.frame0,heard:+CARD.MS.heardT.toFixed(3),frame:window.__FRAME,errs:CARD.ERRS,bad:CARD.nonFinite(),map:CARD.MS.mapOn,sc:CARD.SC.cur})\"}]"
  local mh=""; [ "$map" = 0 ] && mh="&map=0"
  local music=""; [ "$track" = rec ] && music=$PWD/$RECWAV
  local r; r=$(MUSIC=$music CLOCK=1 GPU=1 OUT=$D PORT=$port node tools/cdp.js "test&track=$track&at=$at&scene=$i$mh" "$steps" 2>&1)
  local ev; ev=$(echo "$r" | grep "^EVAL" | tail -1 | sed 's/.*=> //' | tr -d '\\' | sed 's/^"//; s/"$//')
  local exc; exc=$(echo "$r" | grep -c "^\[EXC\]\|^TIMEOUT\|^\[EVAL-ERR\]")
  echo "s$i $track at=$at map=$map: $ev exc $exc"
  echo "$ev" | grep -q '"f0":2,' || echo "WARN s$i $track at=$at map=$map: frame0 is not 2 — the window is not the reference's (HARNESS rule 1)"
  for n in "${names[@]}"; do [ -f $D/$n.jpg ] && md5sum $D/$n.jpg | sed "s|$D/||" >> $D/md5-lane$((port - PORT)).txt || echo "FAIL no shot $n"; done
}
lane() {   # lane <k>: the jobs whose scene is the k-th of every PAR in SCENES, on PORT+k
  local k=$1 port=$((PORT + k)) j=0 i
  : > $D/md5-lane$k.txt
  for i in $SCENES; do
    if [ $((j % PAR)) = $k ]; then echo "$JOBS" | awk -v s=$i '$1 == s' | while read -r line; do run $port $line; done; fi
    j=$((j + 1))
  done
}
T0=$(date +%s)
for ((k = 0; k < PAR; k++)); do lane $k & done; wait
cat $D/md5-lane*.txt | sort -k2 -V > $LIST
echo "real-md5 $TAG: $(wc -l < $LIST) lines in $LIST · $(echo "$JOBS" | wc -l) runs · scenes $(echo $SCENES | tr ' ' ,) · tracks $(echo $TRACKS | tr ' ' ,) · modes $(echo $MODES | tr ' ' ,) · PAR $PAR · $(( $(date +%s) - T0 )) s wall"
cat $LIST
