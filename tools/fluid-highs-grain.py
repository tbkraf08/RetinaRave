#!/usr/bin/env python3
# Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
# use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
# Source: https://github.com/tbkraf08/RetinaRave
# The HIGHS ruler (DECISIONS §116 S4; HARNESS "## Fluid"; FLUID2-PLAN §4 S4): the highs are the SURFACE, never a force on the mass. Read on a
# field strip taken with DYE=1 (tools/fluid-field-strip.sh: per second the composite `<tag>-NN.jpg`, the velocity `<tag>-NNv.jpg` and the
# dye `<tag>-NNd.jpg`; the evals line's `high highS grain dip` since S4). Per shot:
#   speed   = mean |vx| + |vy| over the velocity shot (S1's metric, the GUARD: the grain on vs off must stay within 10 %);
#   lap     = mean |∇²vx| + |∇²vy| (S3's small-scale energy — the grain is this, at the smallest scale);
#   dgrad   = the DYE's mean gradient magnitude (|∂L/∂x| + |∂L/∂y| on the luminance of the dye shot, the velocity inset cropped out —
#             the left 66 % of the frame): the ink's edge sharpness, the plan's number for the dip;
#   dlap    = the dye's mean |∇²L|: its high-pass energy — the grain as the ink carries it;
#   dink    = the dye's mean luminance (the ink on screen: the dip must not buy sharpness with ink);
#   cgrad   = the COMPOSITE's mean gradient magnitude (what the eye sees — the specular moves this, the pool does not);
#   grey    = the composite's whole-frame mean (the §106 metric).
#   python3 tools/fluid-highs-grain.py <dir> <tag> [name=a-b,c-d …]  → one line per shot
#     "NN t high highS grain dip | speed lap | dgrad dlap dink | cgrad grey" and one summary line per named WINDOW (p50 per column).
#   The on / off table is tools/work/fluid2/s4/cmp.py (the same windows over several strips: the ratios variant ÷ control per window).
import sys, re, numpy as np; from PIL import Image
d, tag = sys.argv[1], sys.argv[2]
wins = []
for a in sys.argv[3:]:
    name, spans = a.split('='); wins.append((name, [tuple(map(float, s.split('-'))) for s in spans.split(',')]))
ev = {}
for l in open(f'{d}/evals.txt'):
    l = l.strip().strip('"')
    m = re.match(r'^(\d\d) ([\d.]+) ([\d.]+) ([\d.]+) (\S+) (\S+) (\S+) (\S+) (\S+) (\S+) (\S+) (\S+) (\S+) (\S+) (\S+)(?: .*)?$', l)   # §116 S5: the pen's fields may follow
    if m: ev[m.group(1)] = m.groups()[1:]
def lum(f, crop=True):
    im = np.asarray(Image.open(f).convert('RGB'), dtype=np.float32) / 255
    L = im[..., 0] * .2126 + im[..., 1] * .7152 + im[..., 2] * .0722
    return L[:, : int(L.shape[1] * .66)] if crop else L
def grad(a): return float((np.abs(a[:, 1:] - a[:, :-1]).mean() + np.abs(a[1:, :] - a[:-1, :]).mean()))
def lap(a): return float(np.abs(-4 * a[1:-1, 1:-1] + a[:-2, 1:-1] + a[2:, 1:-1] + a[1:-1, :-2] + a[1:-1, 2:]).mean())
rows = []
for nn in sorted(ev):
    e = ev[nn]; t = float(e[0]); high, highS = float(e[10]), float(e[11]); grain = float(e[12]) if e[12] != '-' else float('nan'); dip = float(e[13]) if e[13] != '-' else float('nan')
    r = dict(nn=nn, t=t, high=high, highS=highS, grain=grain, dip=dip)
    try:
        im = np.asarray(Image.open(f'{d}/{tag}-{nn}v.jpg').convert('RGB'), dtype=np.float32)
        vx, vy = (im[..., 0] - 127.5) / 255, (im[..., 1] - 127.5) / 255
        r['speed'] = float(np.abs(vx).mean() + np.abs(vy).mean()); r['lap'] = lap(vx) + lap(vy)
    except Exception: r['speed'] = r['lap'] = float('nan')
    try:
        D = lum(f'{d}/{tag}-{nn}d.jpg'); r['dgrad'] = grad(D); r['dlap'] = lap(D); r['dink'] = float(D.mean())
    except Exception: r['dgrad'] = r['dlap'] = r['dink'] = float('nan')
    try:
        C = lum(f'{d}/{tag}-{nn}.jpg', crop=False); r['cgrad'] = grad(C); r['grey'] = float(C.mean() * 255)
    except Exception: r['cgrad'] = r['grey'] = float('nan')
    rows.append(r)
    print(f"{nn} {t:.2f} {high:.3f} {highS:.3f} {grain:.5f} {dip:.3f} | {r['speed']:.4f} {r['lap']:.5f} | {r['dgrad']:.5f} {r['dlap']:.5f} {r['dink']:.4f} | {r['cgrad']:.5f} {r['grey']:.1f}")
q = lambda a, p=.5: (sorted(a)[min(len(a) - 1, int(p * len(a)))] if a else float('nan'))
COLS = ('high', 'highS', 'grain', 'dip', 'speed', 'lap', 'dgrad', 'dlap', 'dink', 'cgrad', 'grey')
for name, spans in wins:
    rs = [r for r in rows if any(a <= r['t'] < b for a, b in spans) and not np.isnan(r['speed'])]
    w = {k: q([r[k] for r in rs if not np.isnan(r[k])]) for k in COLS}
    print(f"# {tag} {name}: n {len(rs)} · " + ' · '.join(f'{k} {w[k]:.5f}' for k in COLS))
