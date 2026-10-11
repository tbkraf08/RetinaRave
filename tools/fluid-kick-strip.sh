#!/bin/bash
# Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
# use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
# Source: https://github.com/tbkraf08/RetinaRave
# The KICK STRIP — the TRAVEL ruler (DECISIONS §116 S2; HARNESS "## Fluid"; FLUID2-PLAN §4 S2): per kick, does the hit launch something
# that travels? One deterministic whole-track run (at=<start>, CLOCK=1 GPU=1, keyed on __FRAME: heard t = at + (frame − 2)/60 — rule 1,
# frame0 must read 2) of FLUID (scene 12, the control) or FLUID2 (scene 13, the band grammar; K2= picks the kick's shape) on the LIVE lanes
# (&map=0 by default). Per kick at heard time t (its kickEvt frame F) four MOMENTS — pre (the frame before the hit), +0 (the hit landed),
# +½ beat, +1 beat — and per moment three shots on consecutive frames: the composite (the eye, dbg 0) at D − 1, the DYE (CARD.fluid.dbg = 1:
# the dye encoded pow 1/2.2 full-screen, the velocity inset bottom-right) at D, the velocity alone (dbg 2, 0.5 + v) at D + 1 — the dbg
# overlay is drawn after the chain, so it never feeds back and the sim is the same run. D = F − 2 / F + 1 / F + round(beat·30) / F + round(beat·60).
#   [K2='{"KICK_SHAPE":3}'] [K=json] [MAP=0|1] [X=0.54] [BEAT=0.4286] PORT=89xx tools/fluid-kick-strip.sh <track> <scene 12|13> <tag> "<kick t …>" [at=0]
#     → tools/work/fluid2/kick/<track>-s<scene>-<tag>/<tag>-KK-{pre,k0,kh,k1}{,d,v}.jpg, evals.txt, and travel.txt — per kick:
#       "KK t amp | hPre h0 hh h1 | w0 wh w1 | trail1 area1 | sp0 sph sp1 | step0 stepMax | grey0 greyPre" where
#       h = the new ink's HEIGHT above the kick's place (screen heights; y up) from the dye shot's Δ = L − L(pre) (3×3 box-smoothed, the dbg inset
#           masked) in the COLUMN x ± .05: the positive-mass profile over the rows above the kick's place — hc = the mass CENTROID's height (the
#           travel: where the new ink is), h90 = the height below which 90 % of the mass lies (the front); no connectivity, so the whole pool's
#           motion under the field cannot merge the plume with the background (the p50 over the kicks absorbs what moves anyway);
#       w = the width (uv) of the contiguous run of Δ > 10 through the column, the p50 over the rows between hc − .05 and h90 (the blob's width —
#           a pair that travels stays compact, a smeared push widens), trail = h90 − h10 (the new ink's vertical extent in the column),
#           area = pixels of Δ > 10 in the band x ± .25 above the kick's place / (W·H) — at +1 beat (w and hc at +0 / +½ too);
#       sp = the S1 speed metric over the band x ± .25 of the velocity shot (Σ|vx| + |vy| per texel, uv/s);
#       step0 = |grey(+0) − grey(pre)| / 255 of the composites (the §1.9 step at the hit), stepMax the largest step among the kick's four;
#       and the summary lines: p50 (and p10 / p90) of hc / h90 at +½ and +1, w1, trail1, area1, sp, step0 over the kicks (a kick whose step0
#       is above .1 — the drop's own clear frame — is listed but left out of the summaries), then over the RETURN kicks (t < RET_T, default
#       73 — the drop's return) and the GROOVE kicks (t ≥ RET_T) separately.
#   X = the kick's x (the sub's place on the tonic axis: `fluid-replay.js … events` prints `sub x=`; RaindropsOnRoses .54). BEAT = the beat (s).
#   RaindropsOnRoses starts at 24 s (windows.json `start`): pass at=24. One Chrome at a time. GREYONLY=1 recomputes travel.txt on shots taken.
#   LANE=snare (§116 S3): the same strip keyed on SNARE times — the evals line carries snareAmp / snareAge and CARD.fluid.snare, the shots go
#   under tools/work/fluid2/snare/, and the SIDEWAYS ruler tools/fluid-snare-travel.py reads them (the dye ruler below still runs, unread).
cd "$(dirname "$0")/.." || exit 1
T=$1; SC=$2; TAG=$3; KICKS=$4; AT=${5:-0}; PORT=${PORT:-8978}; MAP=${MAP:-0}; X=${X:-0.54}; BEAT=${BEAT:-0.428571}; KY=${KY:-0.06}; RET_T=${RET_T:-73}; LANE=${LANE:-kick}
[ -z "$T" ] || [ -z "$SC" ] || [ -z "$TAG" ] || [ -z "$KICKS" ] && { echo "usage: [K2=json] [K=json] [MAP=0|1] [X=] [BEAT=] PORT=89xx tools/fluid-kick-strip.sh <track> <scene> <tag> \"<kick t …>\" [at]"; exit 2; }
D=tools/work/fluid2/$LANE/$T-s$SC-$TAG; mkdir -p $D
MH=""; [ "$MAP" = 0 ] && MH="&map=0"
# the shot list: KK:moment:kind:frame, monotone in frame (the clock pauses at each; dbg is set before the frame renders)
LIST=$(python3 -c "
kicks = [float(t) for t in '$KICKS'.split()]; at = float('$AT'); beat = float('$BEAT')
out = []
for k, t in enumerate(kicks):
    F = 2 + round((t - at) * 60)
    for m, D in (('pre', F - 2), ('k0', F + 1), ('kh', F + round(beat * 30)), ('k1', F + round(beat * 60))):
        for kind, off, dbg in (('', -1, 0), ('d', 0, 1), ('v', 1, 2)): out.append('%02d:%s:%s:%d:%d:%.3f' % (k, m, kind, D + off, dbg, t))
print(' '.join(out))")
S='[{"until":"window.CARD"}'
[ -n "$K2" ] && S="$S,{\"eval\":\"JSON.stringify(Object.assign(CARD.fluid.K2,$(echo "$K2" | sed 's/"/\\"/g')))\"}"
[ -n "$K" ] && S="$S,{\"eval\":\"JSON.stringify(Object.assign(CARD.fluid.K,$(echo "$K" | sed 's/"/\\"/g')))\"}"
S="$S,{\"until\":\"CARD.ENGINE.AU.file&&CARD.ENGINE.AU.file.open\",\"timeout\":300000},{\"eval\":\"JSON.stringify({f0:CARD.ENGINE.AU.file.frame0,dur:CARD.ENGINE.AU.file.dur,sc:CARD.SC.cur,grammar:CARD.fluid.grammar,fluid:CARD.fluid&&{on:CARD.fluid.on,tier:CARD.fluid.tier,sim:[CARD.fluid.simW,CARD.fluid.simH]},K2:CARD.fluid.K2})\"}"
for item in $LIST; do IFS=: read KK M KIND F DBG TT <<< "$item"
  S="$S,{\"eval\":\"CARD.fluid.dbg=$DBG\"},{\"until\":\"window.__FRAME>=$F\",\"timeout\":900000},{\"shot\":\"$TAG-$KK-$M$KIND\"}"
  [ "$KIND" = "" ] && S="$S,{\"eval\":\"'$KK $M $TT '+CARD.MS.heardT.toFixed(3)+' '+CARD.MS.${LANE}Amp.toFixed(3)+' '+CARD.MS.${LANE}Age.toFixed(3)+' '+CARD.fluid.heave.toFixed(3)+' '+CARD.fluid.params.dyeDiss.toFixed(2)+' '+JSON.stringify(CARD.fluid.$LANE)\"}"
done
S="$S,{\"eval\":\"CARD.fluid.dbg=0\"},{\"eval\":\"JSON.stringify({f0:CARD.ENGINE.AU.file.frame0,frame:window.__FRAME,errs:CARD.ERRS,bad:CARD.nonFinite(),steps:CARD.fluid&&CARD.fluid.steps})\"}]"
TS=$(date +%s)
[ -n "$GREYONLY" ] || CLOCK=1 GPU=1 OUT=$D PORT=$PORT node tools/cdp.js "test&track=$T&at=$AT&scene=$SC$MH" "$S" 2>&1 | grep -E 'EVAL|TIMEOUT|EXC|console.error' | sed 's/.*=> //' > $D/evals.txt
python3 - "$D" "$TAG" "$X" "$KY" "$RET_T" > $D/travel.txt <<'PY'
import sys, re, math, json, numpy as np; from PIL import Image, ImageFilter; from scipy import ndimage
d, tag, X, KY, RET = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5])
ev = {}
for l in open(f'{d}/evals.txt'):
    l = l.strip().strip('"')
    m = re.match(r'^(\d\d) (pre|k0|kh|k1) (\S+) (\S+) (\S+) (\S+) (\S+) (\S+) (.*)$', l)   # kickAge reads −.003 on the hit's frame (the display lead)
    if m: ev[(m.group(1), m.group(2))] = m.groups()[2:]
def L(f):
    try: return np.asarray(Image.open(f).convert('L'), dtype=np.float32)
    except Exception: return None
def front(Ld, Lp):
    H, W = Ld.shape
    c0, c1 = int((X - .25) * W), int((X + .25) * W); n0, n1 = int((X - .05) * W), int((X + .05) * W)
    rf = int((1 - KY) * H)   # the kick's place as a row (y up → rows down)
    D = Ld - Lp
    D[int(0.66 * H):, int(0.66 * W):] = 0   # the dbg inset (bottom-right 34 %): never the pool
    D = ndimage.uniform_filter(D, 3)
    prof = np.clip(D[:rf, n0:n1], 0, None).mean(axis=1)   # the column's positive-mass profile, rows 0 (top) … rf (the floor)
    tot = prof.sum()
    if tot <= 1e-6: return 0.0, 0.0, 0.0, 0.0, 0.0
    yrow = 1 - (np.arange(rf) + 0.5) / H - KY   # each row's height above the kick's place
    hc = float((prof * yrow).sum() / tot)
    cum = np.cumsum(prof[::-1])[::-1] / tot   # the mass at or above each row (from the top): row r has cum[r] = Σ_{i ≤ r} … no — from the floor up
    up = np.cumsum(prof[::-1]) / tot          # up[j] = the mass from the floor up through row rf − 1 − j
    def hq(q):
        j = int(np.searchsorted(up, q)); j = min(j, rf - 1); return float(yrow[rf - 1 - j])
    h90, h10 = hq(0.9), hq(0.1)
    # the width: the contiguous run of Δ > 10 through the column, per row between hc − .05 and h90
    M = D > 10; xs = int(X * W); ws = []
    r1 = max(0, int((1 - (h90 + KY)) * H)); r0 = min(rf - 1, int((1 - (max(hc - .05, 0) + KY)) * H))
    for r in range(r1, r0 + 1):
        if not M[r, xs]: continue
        a = xs
        while a > c0 and M[r, a - 1]: a -= 1
        b = xs
        while b < c1 - 1 and M[r, b + 1]: b += 1
        ws.append((b - a + 1) / W)
    w = float(np.median(ws)) if ws else 0.0
    ar = float(M[:rf, c0:c1].sum() / (W * H))
    return hc, h90, w, max(0.0, h90 - h10), ar
def speed(f):
    try: im = np.asarray(Image.open(f).convert('RGB'), dtype=np.float32)
    except Exception: return float('nan')
    H, W = im.shape[:2]; b = im[:, int((X - .25) * W):int((X + .25) * W)]
    return float((np.abs(b[..., 0] - 127.5).mean() + np.abs(b[..., 1] - 127.5).mean()) / 255)
def grey(f):
    g = L(f); return float(g.mean()) if g is not None else float('nan')
rows = []
for kk in sorted(set(k for k, _ in ev)):
    t, heard, amp, age, heave, dd, kick = ev[(kk, 'k0')]
    P = L(f'{d}/{tag}-{kk}-pred.jpg')
    if P is None: continue
    hc, h9, ws, trs, ars, sps, gs = {}, {}, {}, {}, {}, {}, {}
    for m in ('pre', 'k0', 'kh', 'k1'):
        Ld = L(f'{d}/{tag}-{kk}-{m}d.jpg')
        hc[m], h9[m], ws[m], trs[m], ars[m] = front(Ld, P) if (Ld is not None and m != 'pre') else (0.0, 0.0, 0.0, 0.0, 0.0)
        sps[m] = speed(f'{d}/{tag}-{kk}-{m}v.jpg'); gs[m] = grey(f'{d}/{tag}-{kk}-{m}.jpg')
    step0 = abs(gs['k0'] - gs['pre']) / 255; stepMax = max(abs(gs[b] - gs[a]) for a, b in (('pre', 'k0'), ('k0', 'kh'), ('kh', 'k1'))) / 255
    rows.append(dict(kk=kk, t=float(t), amp=float(amp), hc0=hc['k0'], hch=hc['kh'], hc1=hc['k1'], h90h=h9['kh'], h901=h9['k1'], w0=ws['k0'], wh=ws['kh'], w1=ws['k1'], tr1=trs['k1'], ar1=ars['k1'], sp0=sps['k0'], sph=sps['kh'], sp1=sps['k1'], step0=step0, stepMax=stepMax, g0=gs['k0'], gp=gs['pre'], heave=float(heave), kick=kick))
    print(f"{kk} {float(t):.3f} {float(amp):.2f} | hc {hc['k0']:.3f} {hc['kh']:.3f} {hc['k1']:.3f} | h90 {h9['k0']:.3f} {h9['kh']:.3f} {h9['k1']:.3f} | w {ws['k0']:.3f} {ws['kh']:.3f} {ws['k1']:.3f} | {trs['k1']:.3f} {ars['k1']:.4f} | {sps['k0']:.3f} {sps['kh']:.3f} {sps['k1']:.3f} | {step0:.4f} {stepMax:.4f} | {gs['k0']:.1f} {gs['pre']:.1f} | h{float(heave):+.2f} {kick}")
q = lambda a, p: (sorted(a)[min(len(a) - 1, int(p * len(a)))] if a else float('nan'))
def summ(name, rs):
    rs = [r for r in rs if r['step0'] <= 0.1]
    if not rs: return
    f = lambda k: f"{q([r[k] for r in rs], .5):.3f} ({q([r[k] for r in rs], .1):.3f}–{q([r[k] for r in rs], .9):.3f})"
    print(f"# {tag} {name}: n {len(rs)} · hc0 {q([r['hc0'] for r in rs], .5):.3f} · hc½ {f('hch')} · hc1 {f('hc1')} · h90½ {q([r['h90h'] for r in rs], .5):.3f} · h90₁ {f('h901')} · w0/½/1 {q([r['w0'] for r in rs], .5):.3f}/{q([r['wh'] for r in rs], .5):.3f}/{f('w1')} · trail1 {f('tr1')} · area1 {q([r['ar1'] for r in rs], .5):.4f} · sp0/½/1 {q([r['sp0'] for r in rs], .5):.3f}/{q([r['sph'] for r in rs], .5):.3f}/{q([r['sp1'] for r in rs], .5):.3f} · step0 {q([r['step0'] for r in rs], .5):.4f} max {max(r['stepMax'] for r in rs):.4f} · grey0 {q([r['g0'] for r in rs], .5):.1f}")
summ('all', rows); summ('return', [r for r in rows if r['t'] < RET]); summ('groove', [r for r in rows if r['t'] >= RET])
PY
echo "== $T s$SC $TAG: $(head -1 $D/evals.txt | cut -c1-100) · $(tail -1 $D/evals.txt | cut -c1-120) · $(grep -c '^[0-9]' $D/travel.txt) kicks · $(( $(date +%s) - TS )) s"
grep '^#' $D/travel.txt
