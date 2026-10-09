#!/bin/bash
# Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
# use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
# Source: https://github.com/tbkraf08/RetinaRave
# The recording replay ruler (DECISIONS §108, HARNESS "## Fluid"): a recorder take's AUDIO is what the engine heard (rec.js taps
# AU.bus), so serve it back as a track on the live lanes and shoot the pool at N fps — the take re-run, frame-exact, after a change.
#   tools/rec-strip.sh <take.webm|rec.wav> <tag> [t0=0] [t1=25] [fps=2] [scene=12] [extra hash]
# 1. ffmpeg extracts the audio once into tools/work/rec/<tag>/music/rec.wav (a .wav given is linked instead);
# 2. CLOCK=1 GPU=1 cdp on 'test&track=rec&at=<t0>&map=0&scene=<scene>' (cold, the live lanes, no map: HARNESS "File source"),
#    one shot per 60/fps frames keyed on __FRAME (heardT = at + (frame − 2)/60 — rule 1 of the four), → tools/work/rec/<tag>/f-<NN>.jpg;
# 3. the whole-frame grey line per shot (PIL convert('L'): the mean — the §106/§107 metric — and the p99, which sees a cloud the
#    mean does not) → tools/work/rec/<tag>/grey.txt (t mean p99), printed. GREYONLY=1 recomputes step 3 on shots already taken.
# PORT=88xx picks the server (cdp spawns serve.js with MUSIC pointing at the take's directory). Nothing here is committed: tools/work/.
cd "$(dirname "$0")/.." || exit 1
SRC=$1; TAG=$2; T0=${3:-0}; T1=${4:-25}; FPS=${5:-2}; SCENE=${6:-12}; X=$7
[ -z "$SRC" ] || [ -z "$TAG" ] && { echo "usage: tools/rec-strip.sh <take.webm|rec.wav> <tag> [t0] [t1] [fps] [scene] [extra hash]"; exit 2; }
D=tools/work/rec/$TAG; mkdir -p $D/music
case "$SRC" in
  *.wav) ln -sf "$(realpath "$SRC")" $D/music/rec.wav ;;
  *) [ -f $D/music/rec.wav ] || ffmpeg -loglevel error -y -i "$SRC" -vn -c:a pcm_s16le $D/music/rec.wav || exit 1 ;;
esac
STEP=$(( 60 / FPS )); N=$(python3 -c "print(int(($T1-$T0)*$FPS)+1)")
S='[{"until":"window.CARD"},{"until":"CARD.ENGINE.AU.file&&CARD.ENGINE.AU.file.open","timeout":300000},{"eval":"JSON.stringify({f0:CARD.ENGINE.AU.file.frame0,sr:CARD.ENGINE.AU.file.sr,dur:CARD.ENGINE.AU.file.dur,mode:CARD.ENGINE.AU.mode,fluid:CARD.fluid&&{on:CARD.fluid.on,tier:CARD.fluid.tier,sim:[CARD.fluid.simW,CARD.fluid.simH]}})"}'
for ((k = 0; k < N; k++)); do F=$(( 2 + k * STEP )); S="$S,{\"until\":\"window.__FRAME>=$F\",\"timeout\":300000},{\"shot\":\"f-$(printf %02d $k)\"}"; done
S="$S,{\"eval\":\"JSON.stringify({heard:CARD.MS.heardT,frame:window.__FRAME,f0:CARD.ENGINE.AU.file.frame0,errs:CARD.ERRS,bad:CARD.nonFinite(),steps:CARD.fluid&&CARD.fluid.steps,dyeDiss:CARD.fluid&&CARD.fluid.params.dyeDiss})\"}]"
[ -n "$GREYONLY" ] || MUSIC=$PWD/$D/music CLOCK=1 GPU=1 OUT=$D node tools/cdp.js "test&track=rec&at=$T0&map=0&scene=$SCENE$X" "$S" | grep -E 'EVAL|TIMEOUT|EXC' | sed 's/.*=> //'
python3 - "$D" "$T0" "$FPS" "$N" > $D/grey.txt <<'EOF'
import sys; from PIL import Image, ImageStat
d, t0, fps, n = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), int(sys.argv[4])
for k in range(n):
    try:
        L = Image.open(f'{d}/f-{k:02d}.jpg').convert('L'); g = ImageStat.Stat(L).mean[0]
        h = L.histogram(); c = 0; tot = sum(h); p99 = 255
        for v, cnt in enumerate(h):
            c += cnt
            if c >= 0.99 * tot: p99 = v; break
    except Exception as e: g = p99 = float('nan')
    print(f'{t0 + k / fps:.2f} {g:.1f} {p99}')
EOF
echo "grey mean ($D/grey.txt): $(awk '{printf "%s ", $2}' $D/grey.txt)"
echo "grey p99: $(awk '{printf "%s ", $3}' $D/grey.txt)"
