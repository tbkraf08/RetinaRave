#!/bin/bash
# Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
# use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
# Source: https://github.com/tbkraf08/RetinaRave
# The FIELD STRIP (DECISIONS §116 S1; HARNESS "## Fluid" — the S1 ruler): the pool's MEAN SPEED against the sub band, per track, on one
# deterministic whole-track run (at=<start>, CLOCK=1 GPU=1, keyed on __FRAME: heard t = at + (frame − 2)/60 — rule 1, frame0 must read 2)
# of FLUID (scene 12, the control) or FLUID2 (scene 13, the band grammar) on the LIVE lanes (&map=0 by default: the design target; MAP=1
# the file map). One shot pair per 1/fps s from t0 to t1: the composite (the eye) at frame F, then `CARD.fluid.dbg = 2` and the velocity
# alone at F + 1 (0.5 + v, ±0.5 uv/s spans the byte — the dbg overlay never feeds back: it is drawn after the chain), dbg back to 0.
#   [K2='{"SWIRL":.8}'] [K='{"BODY":0}'] [MAP=0|1] PORT=88xx tools/fluid-field-strip.sh <track> <scene 12|13> <tag> <t0> <t1> [fps=1] [at=0]
#     → tools/work/fluid2/field/<track>-s<scene>-<tag>/<tag>-NN.jpg (the composite), <tag>-NNv.jpg (the velocity), evals.txt, and
#       speed.txt: "NN t heard sub subGate heave swirl dyeDiss speed grey" per shot — speed = PIL's mean of |R − 127.5| + |G − 127.5| over
#       the velocity shot / 255 = Σ|vx| + |vy| per texel in uv/s (a JPEG's noise floor ≈ .005–.01 on a still pool: the control's p10 is the
#       floor), grey = the composite's whole-frame mean (the §106 metric); and one summary line: Pearson r(speed, sub) over the shots,
#       speed p10 / p50 / p90, the coverage (shots with sub > .3 whose speed is above SPEEDFLOOR= — pass the control's p10 — in %).
#   K2 = a one-run override of the band grammar's constants (CARD.fluid.K2, live) applied before the track opens; K = the base's (CARD.fluid.K).
#   RaindropsOnRoses starts at 24 s (windows.json `start`): pass at=24. One Chrome at a time (a shared GPU moves frame0 — §107's pitfall).
#   GREYONLY=1 recomputes speed.txt on shots already taken. Since §116 S3 the evals line carries `mid curl midsPos` after dyeDiss — the
#   MIDS ruler (tools/fluid-mids-lap.py: the velocity's small-scale energy, dense vs thin windows) reads the same strip. Since §116 S4 it
#   carries `high highS grain dip` after those (the HIGHS ruler, tools/fluid-highs-grain.py); DYE=1 takes a THIRD shot per second — the dye
#   itself (`CARD.fluid.dbg = 1`, `<tag>-NNd.jpg` at F + 2: the ink before the light, with the velocity inset bottom-right) for the dye's
#   sharpness; SPEC='{"HI":0}' is a one-run override of FLUID2's specular table (CARD.REG[13].scene.SPEC — the light's A/B on scene 13).
#   Since §116 S5 it carries `penOn penX penY penStep penInk` after the highs' four (the PEN ruler reads the pen's place per shot; the stroke itself is read
#   on the pure replay at 60 fps — tools/work/fluid2/s5/ruler.js).
#   Since §116 S6 it carries `dtSim substeps latched breath void drop` after the pen's five (the TIME ruler: the solver's clock per shot — its
#   mean over a window × the speed = the pool's displacement per wall-second; the clock's trace per frame is the pure ruler's, tools/work/fluid2/s6/ruler.js).
#   Since §116 S7 `WINS="t0-t1 t0-t1 …"` shoots SEVERAL windows at the fps in ONE deterministic run (the arc strip: a track's moments on one
#   clock, no per-window re-run — the state warm through every one); <t0> <t1> then only name the span, and NN is three digits past 99 shots.
cd "$(dirname "$0")/.." || exit 1
T=$1; SC=$2; TAG=$3; T0=$4; T1=$5; FPS=${6:-1}; AT=${7:-0}; PORT=${PORT:-8978}; MAP=${MAP:-0}
[ -z "$T" ] || [ -z "$SC" ] || [ -z "$TAG" ] || [ -z "$T0" ] || [ -z "$T1" ] && { echo "usage: [K2=json] [K=json] [MAP=0|1] PORT=88xx tools/fluid-field-strip.sh <track> <scene> <tag> <t0> <t1> [fps] [at]"; exit 2; }
D=tools/work/fluid2/field/$T-s$SC-$TAG; mkdir -p $D
MH=""; [ "$MAP" = 0 ] && MH="&map=0"
LIST=$(python3 -c "
t0, t1, fps, at = float('$T0'), float('$T1'), float('$FPS'), float('$AT')
wins = [tuple(map(float, w.split('-'))) for w in '$WINS'.split()] or [(t0, t1)]   # §116 S7: several windows in one run
ts = [a + k / fps for a, b in wins for k in range(int(round((b - a) * fps)) + 1)]
w = 3 if len(ts) > 100 else 2
print(' '.join('%0*d:%.3f:%d' % (w, k, t, 2 + round((t - at) * 60)) for k, t in enumerate(ts)))")
S='[{"until":"window.CARD"}'
# the per-shot evals line as ONE page-side helper (§116 S7: 135 shots × the inline line passed Linux's 128 KB single-argument limit — the run died silent)
[ -n "$K2" ] && S="$S,{\"eval\":\"JSON.stringify(Object.assign(CARD.fluid.K2,$(echo "$K2" | sed 's/"/\\"/g')))\"}"
[ -n "$K" ] && S="$S,{\"eval\":\"JSON.stringify(Object.assign(CARD.fluid.K,$(echo "$K" | sed 's/"/\\"/g')))\"}"
[ -n "$SPEC" ] && S="$S,{\"eval\":\"JSON.stringify(Object.assign(CARD.REG[13].scene.SPEC,$(echo "$SPEC" | sed 's/"/\\"/g')))\"}"
S="$S,{\"until\":\"CARD.ENGINE.AU.file&&CARD.ENGINE.AU.file.open\",\"timeout\":300000},{\"eval\":\"JSON.stringify({f0:CARD.ENGINE.AU.file.frame0,dur:CARD.ENGINE.AU.file.dur,sc:CARD.SC.cur,grammar:CARD.fluid.grammar,fluid:CARD.fluid&&{on:CARD.fluid.on,tier:CARD.fluid.tier,sim:[CARD.fluid.simW,CARD.fluid.simH]},K2:CARD.fluid.K2})\"}"
S="$S,{\"eval\":\"window.__fsEv=(nn,tt)=>nn+' '+tt+' '+CARD.MS.heardT.toFixed(3)+' '+CARD.MS.sub.toFixed(3)+' '+CARD.MS.subGate+' '+CARD.fluid.heave.toFixed(4)+' '+CARD.fluid.swirl.toFixed(4)+' '+CARD.fluid.params.dyeDiss.toFixed(2)+' '+(CARD.MS.mid||0).toFixed(3)+' '+CARD.fluid.params.curl.toFixed(1)+' '+(CARD.fluid.mids?CARD.fluid.mids.pos.toFixed(3):'-')+' '+(CARD.MS.high||0).toFixed(3)+' '+(CARD.MS.highS||0).toFixed(3)+' '+(CARD.fluid.highs?CARD.fluid.highs.grain.toFixed(5)+' '+CARD.fluid.highs.dip.toFixed(3):'- -')+' '+(CARD.fluid.pen?CARD.fluid.pen.on+' '+CARD.fluid.pen.x.toFixed(4)+' '+CARD.fluid.pen.y.toFixed(4)+' '+CARD.fluid.pen.step.toFixed(5)+' '+CARD.fluid.pen.ink.toExponential(3):'- - - - -')+' '+CARD.fluid.dtSim.toFixed(4)+' '+CARD.fluid.substeps+' '+(CARD.fluid.time?CARD.fluid.time.latched+' '+CARD.fluid.time.breath.toFixed(3)+' '+CARD.fluid.time.void.toFixed(3)+' '+CARD.fluid.time.drop.toFixed(3):'- - - -');1\"}"
for item in $LIST; do NN=${item%%:*}; R=${item#*:}; TT=${R%%:*}; F=${R##*:}
  S="$S,{\"until\":\"window.__FRAME>=$F\",\"timeout\":900000},{\"shot\":\"$TAG-$NN\"},{\"eval\":\"__fsEv('$NN','$TT')\"},{\"eval\":\"CARD.fluid.dbg=2\"},{\"until\":\"window.__FRAME>=$((F + 1))\",\"timeout\":900000},{\"shot\":\"$TAG-${NN}v\"},{\"eval\":\"CARD.fluid.dbg=0\"}"
  [ "$DYE" = 1 ] && S="$S,{\"eval\":\"CARD.fluid.dbg=1\"},{\"until\":\"window.__FRAME>=$((F + 2))\",\"timeout\":900000},{\"shot\":\"$TAG-${NN}d\"},{\"eval\":\"CARD.fluid.dbg=0\"}"
done
S="$S,{\"eval\":\"JSON.stringify({f0:CARD.ENGINE.AU.file.frame0,frame:window.__FRAME,errs:CARD.ERRS,bad:CARD.nonFinite(),steps:CARD.fluid&&CARD.fluid.steps})\"}]"
TS=$(date +%s)
[ -n "$GREYONLY" ] || CLOCK=1 GPU=1 OUT=$D PORT=$PORT node tools/cdp.js "test&track=$T&at=$AT&scene=$SC$MH" "$S" 2>&1 | grep -E 'EVAL|TIMEOUT|EXC|console.error' | sed 's/.*=> //' > $D/evals.txt
python3 - "$D" "$TAG" "${SPEEDFLOOR:-nan}" > $D/speed.txt <<'PY'
import sys, re, math; from PIL import Image, ImageStat
d, tag, floor = sys.argv[1], sys.argv[2], float(sys.argv[3])
ev = {}
for l in open(f'{d}/evals.txt'):
    l = l.strip().strip('"')
    m = re.match(r'^(\d{2,3}) ([\d.]+) ([\d.]+) ([\d.]+) (\S+) (\S+) (\S+) (\S+)(?: .*)?$', l)   # §116 S3: mid, curl, mids.pos follow (fluid-mids-lap.py reads them)
    if m: ev[m.group(1)] = m.groups()[1:]
rows = []
for nn in sorted(ev):
    t, heard, sub, gate, heave, swirl, dd = ev[nn]
    try:
        V = Image.open(f'{d}/{tag}-{nn}v.jpg').convert('RGB'); r, g, b = V.split()
        sr = ImageStat.Stat(r.point(lambda v: abs(v - 127.5))).mean[0]; sg = ImageStat.Stat(g.point(lambda v: abs(v - 127.5))).mean[0]
        speed = (sr + sg) / 255
        grey = ImageStat.Stat(Image.open(f'{d}/{tag}-{nn}.jpg').convert('L')).mean[0]
    except Exception as e: speed = grey = float('nan')
    rows.append((nn, float(t), float(heard), float(sub), gate, float(heave), float(swirl), float(dd), speed, grey))
    print(f'{nn} {float(t):.2f} {float(heard):.3f} {float(sub):.3f} {gate} {float(heave):.4f} {float(swirl):.4f} {float(dd):.2f} {speed:.4f} {grey:.1f}')
sp = [r[8] for r in rows if not math.isnan(r[8])]; su = [r[3] for r in rows if not math.isnan(r[8])]
n = len(sp)
if n >= 3:
    ms, mu = sum(sp) / n, sum(su) / n
    cov = sum((a - ms) * (b - mu) for a, b in zip(sp, su)); va = sum((a - ms) ** 2 for a in sp); vb = sum((b - mu) ** 2 for b in su)
    r = cov / math.sqrt(va * vb) if va > 0 and vb > 0 else float('nan')
    q = lambda p: sorted(sp)[min(n - 1, int(p * n))]
    up = [x for x in rows if x[3] > 0.3 and not math.isnan(x[8])]
    covg = (100 * sum(1 for x in up if x[8] > floor) / len(up)) if up and not math.isnan(floor) else float('nan')
    print(f'# {tag}: n {n} · r(speed, sub) {r:.3f} · speed p10/p50/p90 {q(.1):.4f}/{q(.5):.4f}/{q(.9):.4f} · sub mean {mu:.2f} · coverage {covg:.0f} % of {len(up)} sub-up shots above floor {floor}')
PY
echo "== $T s$SC $TAG $T0-$T1: $(head -1 $D/evals.txt | cut -c1-110) · $(tail -1 $D/evals.txt | cut -c1-110) · $(grep -c '^[0-9]' $D/speed.txt) shots · $(( $(date +%s) - TS )) s"
tail -1 $D/speed.txt
