#!/bin/bash
# FEIGEN cost harness (v0.2 §16): the numbers the worker's report and the orchestrator's acceptance both come from.
# usage: GPU=1 tools/feigen-bench.sh <tag> [levels]      -> prints and writes tools/accept/${ACC:-v0.5}/feigen-bench-<tag>.txt
#   (a) per level (default 1.2 2 3 3.6, set with &feig=), tier 3 (q pinned .95, 8 s settle): CARD.bench(6,300) three
#       times interleaved with CARD.bench(0,300) in the same page (load drift is 2×; only interleaved medians compare),
#       the scene's rt.label / rt.log, glerr. Steady state: the first bench(6,300) is discarded (cold, and after §16 it is
#       the one that finishes the rung).
#   (b) build cost at the deepest level: a tricorn flip invalidates every rung (§16) — `t1` = wall ms of the flip's first
#       two renders (the burst frame + one), `build` = bench(6,60) right after (the mean of the 60 frames that rebuild),
#       against `steady` = bench(6,300) once built. Before §16 a flip costs nothing: t1 ≈ 2·steady, build ≈ steady.
#   (c) seam ratio: CLOCK=1 #test at &feig=$SEAM_L, a shot of every frame 300..340 (5.0–5.67 s of the fake timeline,
#       the sustain: kicks but no drop), mean |Δ| per pixel between consecutive frames (python3 + PIL + numpy):
#       ratio = max / median, with the frame of the max, the RUNG@ lines the scene logged in the window and L per frame.
#       A rung change that is a seam is a spike in this series; the same series before §16 is the kick-flare baseline.
#       Pick SEAM_L so a rung change lands inside the window (the scene's RUNG@ log says; L moves ≈ 0.03 over 40 frames).
cd "$(dirname "$0")/.." || exit 1
TAG=${1:-after}; shift
LEVELS=${*:-1.2 2 3 3.6}
SEAM_L=${SEAM_L:-1.478}
OUTF=tools/accept/${ACC:-v0.5}/feigen-bench-$TAG.txt
mkdir -p tools/accept/${ACC:-v0.5} tools/work/seam-$TAG
{
echo "== feigen-bench $TAG · $(date +%F) · levels $LEVELS · seam L $SEAM_L"
echo "== (a) tier 3 steady state: feigen median of 3 × bench(6,300) | nav median (interleaved) | label | log"
PIN='{"until":"window.CARD"},{"eval":"setInterval(function(){CARD.Q.q=0.95},16);'pin'"},{"wait":8000}'
B='(function(){var b=[],n=[];CARD.bench(6,300);for(var i=0;i<3;i++){b.push(CARD.bench(6,300));n.push(CARD.bench(0,300));}var s=function(a,c){return a-c};b.sort(s);n.sort(s);var S=CARD.REG[6].scene;return \"L \"+S.rt.label+\" feigen \"+b[1].toFixed(2)+\" ms (runs \"+b.map(function(x){return x.toFixed(2)}).join(\"/\")+\") nav \"+n[1].toFixed(2)+\" ms · tier \"+CARD.ctx.tier()+\" q \"+CARD.Q.q.toFixed(2)+\" · log [\"+(S.rt.log||\"\")+\"] glerr \"+CARD.ctx.gl.getError()+\" errs \"+JSON.stringify(CARD.ERRS)})()'
for L in $LEVELS; do
  node tools/cdp.js "test&scene=6&feig=$L" "[$PIN,{\"eval\":\"$B\"}]" | grep -E '^EVAL|^\[EXC\]' | sed 's/^EVAL.*=> //; s/^"//; s/"$//' | grep -v '^pin$\|^undefined$' | grep -v '^pin$\|^undefined$' | sed "s/^/feig=$L: /"
done
echo "== (b) build cost after a tricorn flip at the deepest level (tier 3)"
L=${LEVELS##* }
BB='(function(){CARD.bench(6,300);var steady=CARD.bench(6,300);var t0=performance.now();CARD.hooks.tricorn(1);CARD.bench(6,1);var t1=performance.now()-t0;var build=CARD.bench(6,60);var steady2=CARD.bench(6,300);var S=CARD.REG[6].scene;return \"L \"+S.rt.label+\" steady \"+steady.toFixed(2)+\" ms · flip: first two renders \"+t1.toFixed(2)+\" ms wall, next 60 mean \"+build.toFixed(2)+\" ms, then steady \"+steady2.toFixed(2)+\" ms · log [\"+(S.rt.log||\"\")+\"] glerr \"+CARD.ctx.gl.getError()})()'
node tools/cdp.js "test&scene=6&feig=$L" "[$PIN,{\"eval\":\"$BB\"}]" | grep -E '^EVAL|^\[EXC\]' | sed 's/^EVAL.*=> //; s/^"//; s/"$//' | grep -v '^pin$\|^undefined$' | grep -v '^pin$\|^undefined$' | sed "s/^/feig=$L: /"
echo "== (c) seam ratio: CLOCK=1 &feig=$SEAM_L, frames 300..340"
STEPS='[{"until":"window.CARD"}'
for f in $(seq 300 340); do STEPS="$STEPS,{\"until\":\"window.__FRAME>=$f\"},{\"shot\":\"seam-$TAG/f$f\"},{\"eval\":\"'f$f '+CARD.REG[6].scene.rt.label+' '+(CARD.REG[6].scene.rt.log||'')\"}"; done
STEPS="$STEPS,{\"eval\":\"'RUNG lines: '+CARD.log.filter(function(l){return /RUNG@/.test(l)}).join(' | ')\"}]"
R=$(CLOCK=1 OUT=tools/work node tools/cdp.js "test&scene=6&feig=$SEAM_L" "$STEPS" | grep -E '^EVAL|^\[EXC\]' | sed 's/^EVAL.*=> //; s/^"//; s/"$//' | tr '\n' ' ' | sed 's/ f3/\nf3/g; s/ RUNG/\nRUNG/'); echo "$R"
# the scene logs RUNG@<its draw count> when the rung on screen changes (brief-feigen-field); forced from frame 1 the draw count is the frame
python3 - tools/work/seam-$TAG $(echo "$R" | grep -o 'RUNG@[0-9]*' | grep -o '[0-9]*') <<'EOF'
import sys, os, numpy as np
from PIL import Image
d = sys.argv[1]; rungs = [int(x) for x in sys.argv[2:]]; fs = sorted(f for f in os.listdir(d) if f.endswith('.jpg'))
ims = [np.asarray(Image.open(os.path.join(d, f)).convert('L'), dtype=np.float32) for f in fs]
diffs = [float(np.mean(np.abs(ims[i + 1] - ims[i]))) for i in range(len(ims) - 1)]
names = [fs[i + 1].replace('.jpg', '') for i in range(len(ims) - 1)]
med = float(np.median(diffs)); mx = max(diffs); k = diffs.index(mx)
print('consecutive |Δ| (grey 0..255):', ' '.join('%s:%.2f' % (n[1:], x) for n, x in zip(names, diffs)))
print('seam ratio max/median = %.2f (max %.2f at %s, median %.2f, mean %.2f)' % (mx / med if med else float('inf'), mx, names[k], med, float(np.mean(diffs))))
for r in rungs:
    n = 'f%d' % r
    if n in names: print('RUNG@%d: |Δ| %.2f = %.2f × median (kick flares in this window before §16: f305 4.5, f320 42.5, f334 4.5)' % (r, diffs[names.index(n)], diffs[names.index(n)] / med if med else float('inf')))
    else: print('RUNG@%d is outside the shot window 301..340' % r)
if not rungs: print('no RUNG@ line in the window: no rung change happened between frames 300 and 340 at this SEAM_L (or the scene does not log them)')
EOF
} 2>&1 | tee "$OUTF"
