#!/usr/bin/env python3
# Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
# use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
# Source: https://github.com/tbkraf08/RetinaRave
# The SIDEWAYS travel ruler (DECISIONS §116 S3; HARNESS "## Fluid"): per SNARE, does the shear launch something that crosses? Read on a snare
# strip's VELOCITY shots (`LANE=snare tools/fluid-kick-strip.sh …`: pre / +0 / +½ / +1 beat, CARD.fluid.dbg = 2 — 0.5 + v, ±0.5 uv/s spans
# the byte). S2's ruler reads the UP-velocity above the kick's place; a snare's push is horizontal at mid height — from a wall into the
# pool (the jet, `side` ±1 from CARD.fluid.snare on the evals line: x = SX or 1 − SX) or from (.3, .5) / (.7, .5) inward (the pair) — so
# the mass that reads it is the velocity ALONG THE PUSH in the band y = Y ± BAND: per column x the fastest fibre p(x) = the p90 over the
# band's rows of dir·vx, minus the pre shot's (two frames before the hit — the standing flow), clipped ≥ 0: q(x) = max(p − p_pre, 0).
#   P     = Σ q over the launch's half (/ 100 — the directed mass the hit added; how much survives at +½ / +1);
#   peak  = max q in that half (uv/s), xpk = the peak's distance from the launch (the travel of the fastest point);
#   front = the farthest distance from the launch to which q > THR holds continuously from the launch (gaps ≤ 3 % of the width): how far
#           the burst has CROSSED — the pair's number is the larger of its two shears' (each from .3 / .7 toward the centre);
#   M     = Σ max(|vx| − |vx_pre|, 0) over the whole band (/ 1000, the undirected added mass — the busy pool's own change is in it: context);
#   th    = the a-weighted p10–p90 of y of that mass (its thickness); sp = S1's speed metric over the band (the pool's own motion).
#   The composite shots give step0 = |grey(+0) − grey(pre)| / 255 (the §1.9 step at the hit) and stepMax over the four; grey0.
#   python3 tools/fluid-snare-travel.py <dir> <tag> [Y=0.5] [BAND=0.12] [SX=0.02] [THR=0.04]  → travel.txt on stdout: one line per snare
#     "KK t amp kind side | P 0/½/1 | peak 0/½/1 | xpk 0/½/1 | front 0/½/1 | M pre/0/½/1 | th1 | sp pre/1 | step0 stepMax | grey0 greyPre"
#   and the summary line (p50, with p10–p90 on the travel columns) over the snares whose step0 ≤ .1.
import sys, re, json, numpy as np; from PIL import Image
d, tag = sys.argv[1], sys.argv[2]
Y = float(sys.argv[3]) if len(sys.argv) > 3 else 0.5; BAND = float(sys.argv[4]) if len(sys.argv) > 4 else 0.12; SX = float(sys.argv[5]) if len(sys.argv) > 5 else 0.02
THR = float(sys.argv[6]) if len(sys.argv) > 6 else 0.04
ev = {}
for l in open(f'{d}/evals.txt'):
    l = l.strip().strip('"')
    m = re.match(r'^(\d\d) (pre|k0|kh|k1) (\S+) (\S+) (\S+) (\S+) (\S+) (\S+) (.*)$', l)
    if m: ev[(m.group(1), m.group(2))] = m.groups()[2:]
def vel(f):
    try: im = np.asarray(Image.open(f).convert('RGB'), dtype=np.float32)
    except Exception: return None
    return (im[..., 0] - 127.5) / 255, (im[..., 1] - 127.5) / 255
def grey(f):
    try: return float(np.asarray(Image.open(f).convert('L'), dtype=np.float32).mean())
    except Exception: return float('nan')
def wq(x, w, p):
    o = np.argsort(x); c = np.cumsum(w[o]); return float(x[o][min(len(x) - 1, int(np.searchsorted(c, p * c[-1])))])
def directed(V, Vp, x0, dir):
    # the fastest fibre along the push per column, the pre's standing flow removed; the launch's half of the width
    vx = V[0]; H, W = vx.shape; r0, r1 = max(0, int((1 - Y - BAND) * H)), min(H, int((1 - Y + BAND) * H))
    p = np.percentile(dir * vx[r0:r1], 90, axis=0); pp = np.percentile(dir * Vp[0][r0:r1], 90, axis=0); q = np.clip(p - pp, 0, None)
    X = (np.arange(W) + 0.5) / W; i0 = int(x0 * W)
    cols = np.arange(i0, W) if dir > 0 else np.arange(i0, -1, -1)
    half = cols[: W // 2]
    P = float(q[half].sum() / 100); peak = float(q[half].max()); xpk = float(abs(X[half[int(np.argmax(q[half]))]] - x0))
    gap = 0; front = 0.0; maxgap = int(0.03 * W)
    for i in cols:
        if q[i] > THR: gap = 0; front = abs(X[i] - x0)
        else:
            gap += 1
            if gap > maxgap: break
    return dict(P=P, peak=peak, xpk=xpk, front=front)
def measure(V, Vp, launches):
    vx, vy = V; H, W = vx.shape; r0, r1 = max(0, int((1 - Y - BAND) * H)), min(H, int((1 - Y + BAND) * H))
    a = np.clip(np.abs(vx[r0:r1]) - np.abs(Vp[0][r0:r1]), 0, None); M = float(a.sum() / 1000); sp = float(np.abs(vx[r0:r1]).mean() + np.abs(vy[r0:r1]).mean())
    th = 0.0
    if M > 1e-6:
        Yr = 1 - (np.arange(r0, r1) + 0.5) / H; wy = a.sum(axis=1); th = wq(Yr, wy, 0.9) - wq(Yr, wy, 0.1)
    best = None
    for x0, dir in launches:
        r = directed(V, Vp, x0, dir)
        if best is None or r['front'] > best['front'] or (r['front'] == best['front'] and r['P'] > best['P']): best = r
    best.update(M=M, th=th, sp=sp); return best
rows = []
for kk in sorted(set(k for k, _ in ev)):
    if (kk, 'k0') not in ev: continue
    t, heard, amp, age, heave, dd, rec = ev[(kk, 'k0')]
    try: R = json.loads(rec.replace('\\"', '"')); kind, side = R.get('kind', ''), R.get('side', 0)
    except Exception: kind, side = '', 0
    launches = [(SX, 1)] if side > 0 else [(1 - SX, -1)] if side < 0 else [(0.3, 1), (0.7, -1)]
    Vp = vel(f'{d}/{tag}-{kk}-prev.jpg')
    if Vp is None: continue
    m, gs = {}, {}
    for mo in ('pre', 'k0', 'kh', 'k1'):
        V = vel(f'{d}/{tag}-{kk}-{mo}v.jpg'); m[mo] = measure(V, Vp, launches) if V is not None else measure(Vp, Vp, launches); gs[mo] = grey(f'{d}/{tag}-{kk}-{mo}.jpg')
    step0 = abs(gs['k0'] - gs['pre']) / 255; stepMax = max(abs(gs[b] - gs[a]) for a, b in (('pre', 'k0'), ('k0', 'kh'), ('kh', 'k1'))) / 255
    r = dict(kk=kk, t=float(t), amp=float(amp), kind=kind or '-', side=side, P0=m['k0']['P'], Ph=m['kh']['P'], P1=m['k1']['P'], pk0=m['k0']['peak'], pkh=m['kh']['peak'], pk1=m['k1']['peak'], xp0=m['k0']['xpk'], xph=m['kh']['xpk'], xp1=m['k1']['xpk'],
             fr0=m['k0']['front'], frh=m['kh']['front'], fr1=m['k1']['front'], Mp=m['pre']['M'], M0=m['k0']['M'], Mh=m['kh']['M'], M1=m['k1']['M'], th1=m['k1']['th'], vpp=m['pre']['sp'], vp1=m['k1']['sp'], step0=step0, stepMax=stepMax, g0=gs['k0'], gp=gs['pre'])
    rows.append(r)
    print(f"{kk} {r['t']:.3f} {r['amp']:.2f} {r['kind']} {r['side']:+d} | P {r['P0']:.3f} {r['Ph']:.3f} {r['P1']:.3f} | peak {r['pk0']:.3f} {r['pkh']:.3f} {r['pk1']:.3f} | xpk {r['xp0']:.3f} {r['xph']:.3f} {r['xp1']:.3f} | front {r['fr0']:.3f} {r['frh']:.3f} {r['fr1']:.3f} | M {r['Mp']:.3f} {r['M0']:.3f} {r['Mh']:.3f} {r['M1']:.3f} | th {r['th1']:.3f} | sp {r['vpp']:.3f} {r['vp1']:.3f} | {step0:.4f} {stepMax:.4f} | {r['g0']:.1f} {r['gp']:.1f}")
q = lambda a, p: (sorted(a)[min(len(a) - 1, int(p * len(a)))] if a else float('nan'))
rs = [r for r in rows if r['step0'] <= 0.1]
if rs:
    f = lambda k, n=3: f"{q([r[k] for r in rs], .5):.{n}f} ({q([r[k] for r in rs], .1):.{n}f}–{q([r[k] for r in rs], .9):.{n}f})"
    p = lambda k, n=3: f"{q([r[k] for r in rs], .5):.{n}f}"
    print(f"# {tag} all: n {len(rs)} · P 0/½/1 {p('P0')}/{p('Ph')}/{p('P1')} · peak 0/½/1 {p('pk0')}/{p('pkh')}/{p('pk1')} · xpk 0/½/1 {p('xp0')}/{p('xph')}/{f('xp1')} · front 0/½/1 {p('fr0')}/{f('frh')}/{f('fr1')} · M pre/0/½/1 {p('Mp')}/{p('M0')}/{p('Mh')}/{p('M1')} · th1 {p('th1')} · sp pre/1 {p('vpp')}/{p('vp1')} · step0 {p('step0', 4)} max {max(r['stepMax'] for r in rs):.4f} · grey0 {p('g0', 1)}")
