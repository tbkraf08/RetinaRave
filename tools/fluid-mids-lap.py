#!/usr/bin/env python3
# Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
# use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
# Source: https://github.com/tbkraf08/RetinaRave
# The MIDS ruler (DECISIONS §116 S3; HARNESS "## Fluid"; FLUID2-PLAN §4 S3): does the pool's TEXTURE follow the mid band? Read on a field
# strip's VELOCITY shots (tools/fluid-field-strip.sh: `<tag>-NNv.jpg`, CARD.fluid.dbg = 2 — 0.5 + v, ±0.5 uv/s spans the byte; the evals
# line's `mid curl midsPos` since S3). Per shot, over the pool (vx, vy from the R / G channels):
#   lap   = mean |∇²vx| + |∇²vy| (the 3×3 Laplacian, uv/s per texel²): the velocity's SMALL-SCALE energy — tight curls read high, a laminar
#           field low — the number the plan names;
#   speed = mean |vx| + |vy| (S1's metric): the pool's own motion — a still pool reads a low Laplacian whatever its confinement, so
#   ratio = lap / speed is the small-scale share of the motion (the texture per unit of motion: what the confinement moves);
#   curlM = mean |∂vy/∂x − ∂vx/∂y| (the curl's magnitude, the same differences) — a second reading of the same thing;
#   the composite's grey (the §106 metric) beside.
#   python3 tools/fluid-mids-lap.py <dir> <tag> [name=a-b,c-d …]  → mids.txt on stdout: one line per shot
#     "NN t mid curl pos | lap speed ratio curlM | grey" and one summary line per named WINDOW (p50 of each column over its shots) plus
#     "margin": for every pair of windows named dense* / thin* the p50 ratio of dense over thin (≥ 1 = the dense window has the finer texture).
import sys, re, numpy as np; from PIL import Image
d, tag = sys.argv[1], sys.argv[2]
wins = []
for a in sys.argv[3:]:
    name, spans = a.split('='); wins.append((name, [tuple(map(float, s.split('-'))) for s in spans.split(',')]))
ev = {}
for l in open(f'{d}/evals.txt'):
    l = l.strip().strip('"')
    m = re.match(r'^(\d\d) ([\d.]+) ([\d.]+) ([\d.]+) (\S+) (\S+) (\S+) (\S+)(?: (\S+) (\S+) (\S+)(?: .*)?)?$', l)   # §116 S4: `high highS grain dip` may follow
    if m: ev[m.group(1)] = m.groups()[1:]
def vel(f):
    im = np.asarray(Image.open(f).convert('RGB'), dtype=np.float32)
    return (im[..., 0] - 127.5) / 255, (im[..., 1] - 127.5) / 255
def lap(a):
    L = -4 * a[1:-1, 1:-1] + a[:-2, 1:-1] + a[2:, 1:-1] + a[1:-1, :-2] + a[1:-1, 2:]
    return float(np.abs(L).mean())
rows = []
for nn in sorted(ev):
    t = float(ev[nn][0]); mid = float(ev[nn][7]) if ev[nn][7] else float('nan'); curl = float(ev[nn][8]) if ev[nn][8] else float('nan'); pos = ev[nn][9] or '-'
    try:
        vx, vy = vel(f'{d}/{tag}-{nn}v.jpg')
        lp = lap(vx) + lap(vy); sp = float(np.abs(vx).mean() + np.abs(vy).mean())
        cm = float(np.abs((vy[1:-1, 2:] - vy[1:-1, :-2]) - (vx[2:, 1:-1] - vx[:-2, 1:-1])).mean() / 2)
        grey = float(np.asarray(Image.open(f'{d}/{tag}-{nn}.jpg').convert('L'), dtype=np.float32).mean())
    except Exception: lp = sp = cm = grey = float('nan')
    rows.append(dict(nn=nn, t=t, mid=mid, curl=curl, pos=pos, lap=lp, speed=sp, ratio=lp / sp if sp > 1e-6 else float('nan'), curlM=cm, grey=grey))
    print(f"{nn} {t:.2f} {mid:.3f} {curl:.1f} {pos} | {lp:.5f} {sp:.4f} {lp / sp if sp > 1e-6 else float('nan'):.3f} {cm:.5f} | {grey:.1f}")
q = lambda a, p=.5: (sorted(a)[min(len(a) - 1, int(p * len(a)))] if a else float('nan'))
W = {}
for name, spans in wins:
    rs = [r for r in rows if any(a <= r['t'] < b for a, b in spans) and not np.isnan(r['lap'])]
    W[name] = {k: q([r[k] for r in rs]) for k in ('mid', 'curl', 'lap', 'speed', 'ratio', 'curlM', 'grey')}; W[name]['n'] = len(rs)
    w = W[name]
    print(f"# {tag} {name}: n {w['n']} · mid {w['mid']:.3f} · curl {w['curl']:.1f} · lap {w['lap']:.5f} · speed {w['speed']:.4f} · ratio {w['ratio']:.3f} · curlM {w['curlM']:.5f} · grey {w['grey']:.1f}")
for dn in [n for n in W if n.startswith('dense')]:
    for tn in [n for n in W if n.startswith('thin')]:
        a, b = W[dn], W[tn]
        if a['n'] and b['n']: print(f"# {tag} margin {dn}/{tn}: lap {a['lap'] / b['lap']:.2f} · ratio {a['ratio'] / b['ratio']:.2f} · curlM {a['curlM'] / b['curlM']:.2f} · speed {a['speed'] / b['speed']:.2f}")
