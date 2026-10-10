#!/usr/bin/env python3
# Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
# use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
# Source: https://github.com/tbkraf08/RetinaRave
# The TRAVEL ruler over a kick strip's shots (tools/fluid-kick-strip.sh; DECISIONS §116 S2; HARNESS "## Fluid"): per kick, where the hit's
# push IS at +0 / +½ / +1 beat — read on the VELOCITY shot (CARD.fluid.dbg = 2: 0.5 + v, ±0.5 uv/s spans the byte, clipped beyond), not on the
# dye: a groove's pool is full of moving ink, and a Δ of the dye against the pre-kick shot over 13–26 frames is the pool's advection, not the
# plume (the first ruler, §116 S2, read the column's middle under every field). The kick is an UPWARD impulse (or, launched sideways, a
# pair that goes outward), so the mass that reads it is the velocity's magnitude ABOVE the pool's own: in the band x ± BAND (default .3)
# above the kick's place, per texel u = max(vy, 0) (the up-velocity: FLUID's breath and FLUID2's heave push the centre DOWN, so what goes up
# at the centre is the hit's) and s = |v| − |v_pre| (the speed the hit added; the pre shot two frames before the hit):
#   U      = Σ u over the band (uv/s · texels / 1000 — the up-mass: 0 when the field has swallowed the plume),  ΔU = U − U_pre;
#   hc     = U's mass centroid height above the kick's place (screen heights; y up) — the travel; h90 the height under which 90 % of U lies
#            (the front), trail = h90 − h10 (the plume's vertical extent); xc = U's centroid's horizontal offset from the kick's x (uv) and
#            d = √(xc² + hc²) the DISTANCE travelled from the launch (a sideways launch leaves the column: d reads it, hc alone would not);
#   w      = the width (uv) of the contiguous run of u > .05 through the centroid's column, the p50 over the rows between hc − .05 and h90
#            (a pair that travels stays compact, a smeared push widens);
#   sp     = the S1 speed metric over the band (Σ|vx| + |vy| per texel, uv/s) — the pool's own motion there.
#   The composite shots give step0 = |grey(+0) − grey(pre)| / 255 (the §1.9 step at the hit) and stepMax over the kick's four; grey0.
#   python3 tools/fluid-kick-travel.py <dir> <tag> [X=0.54] [KY=0.06] [RET_T=73] [BAND=0.3]  → travel.txt on stdout: one line per kick
#     "KK t amp | U pre/0/½/1 | hc 0/½/1 | h90 ½/1 | d ½/1 | w 0/½/1 | trail1 | sp pre/0/½/1 | step0 stepMax | grey0 greyPre | heave kick"
#   and the summary lines (p50, with p10–p90 on the travel columns) over the kicks whose step0 ≤ .1 (the drop's own clear frame is listed
#   but left out), then the RETURN kicks (t < RET_T) and the GROOVE kicks (t ≥ RET_T) separately.
import sys, re, numpy as np; from PIL import Image
d, tag = sys.argv[1], sys.argv[2]
X = float(sys.argv[3]) if len(sys.argv) > 3 else 0.54; KY = float(sys.argv[4]) if len(sys.argv) > 4 else 0.06
RET = float(sys.argv[5]) if len(sys.argv) > 5 else 73; BAND = float(sys.argv[6]) if len(sys.argv) > 6 else 0.3
ev = {}
for l in open(f'{d}/evals.txt'):
    l = l.strip().strip('"')
    m = re.match(r'^(\d\d) (pre|k0|kh|k1) (\S+) (\S+) (\S+) (\S+) (\S+) (\S+) (.*)$', l)   # kickAge reads −.003 on the hit's frame (the display lead)
    if m: ev[(m.group(1), m.group(2))] = m.groups()[2:]
def vel(f):
    try: im = np.asarray(Image.open(f).convert('RGB'), dtype=np.float32)
    except Exception: return None
    return (im[..., 0] - 127.5) / 255, (im[..., 1] - 127.5) / 255   # vx, vy in uv/s (±.5 spans the byte)
def grey(f):
    try: return float(np.asarray(Image.open(f).convert('L'), dtype=np.float32).mean())
    except Exception: return float('nan')
def measure(V, Vp):
    vx, vy = V; H, W = vy.shape
    c0, c1 = max(0, int((X - BAND) * W)), min(W, int((X + BAND) * W)); rf = int((1 - KY) * H)
    u = np.clip(vy[:rf, c0:c1], 0, None)
    U = float(u.sum() / 1000)
    sp = float((np.abs(vx[:rf, c0:c1]).mean() + np.abs(vy[:rf, c0:c1]).mean()))
    if U < 1e-6: return dict(U=U, hc=0.0, h90=0.0, tr=0.0, xc=0.0, dist=0.0, w=0.0, sp=sp)
    yrow = 1 - (np.arange(rf) + 0.5) / H - KY; xcol = (np.arange(c0, c1) + 0.5) / W - X
    prof = u.sum(axis=1); tot = prof.sum()
    hc = float((prof * yrow).sum() / tot); xc = float((u.sum(axis=0) * xcol).sum() / tot)
    up = np.cumsum(prof[::-1]) / tot
    hq = lambda q: float(yrow[rf - 1 - min(int(np.searchsorted(up, q)), rf - 1)])
    h90, h10 = hq(0.9), hq(0.1)
    xs = min(W - 1, max(0, int((X + xc) * W))); M = vy > 0.05; ws = []
    r1 = max(0, int((1 - (h90 + KY)) * H)); r0 = min(rf - 1, int((1 - (max(hc - .05, 0) + KY)) * H))
    for r in range(r1, r0 + 1):
        if not M[r, xs]: continue
        a = xs
        while a > c0 and M[r, a - 1]: a -= 1
        b = xs
        while b < c1 - 1 and M[r, b + 1]: b += 1
        ws.append((b - a + 1) / W)
    return dict(U=U, hc=hc, h90=h90, tr=max(0.0, h90 - h10), xc=xc, dist=float(np.hypot(xc, hc)), w=float(np.median(ws)) if ws else 0.0, sp=sp)
rows = []
for kk in sorted(set(k for k, _ in ev)):
    if (kk, 'k0') not in ev: continue
    t, heard, amp, age, heave, dd, kick = ev[(kk, 'k0')]
    Vp = vel(f'{d}/{tag}-{kk}-prev.jpg')
    if Vp is None: continue
    m, gs = {}, {}
    for mo in ('pre', 'k0', 'kh', 'k1'):
        V = vel(f'{d}/{tag}-{kk}-{mo}v.jpg'); m[mo] = measure(V, Vp) if V is not None else measure(Vp, Vp); gs[mo] = grey(f'{d}/{tag}-{kk}-{mo}.jpg')
    step0 = abs(gs['k0'] - gs['pre']) / 255; stepMax = max(abs(gs[b] - gs[a]) for a, b in (('pre', 'k0'), ('k0', 'kh'), ('kh', 'k1'))) / 255
    r = dict(kk=kk, t=float(t), amp=float(amp), Up=m['pre']['U'], U0=m['k0']['U'], Uh=m['kh']['U'], U1=m['k1']['U'], hc0=m['k0']['hc'], hch=m['kh']['hc'], hc1=m['k1']['hc'], h90h=m['kh']['h90'], h901=m['k1']['h90'],
             dh=m['kh']['dist'], d1=m['k1']['dist'], w0=m['k0']['w'], wh=m['kh']['w'], w1=m['k1']['w'], tr1=m['k1']['tr'], spp=m['pre']['sp'], sp0=m['k0']['sp'], sph=m['kh']['sp'], sp1=m['k1']['sp'], step0=step0, stepMax=stepMax, g0=gs['k0'], gp=gs['pre'], heave=float(heave), kick=kick)
    r['dU1'] = r['U1'] - r['Up']; r['dUh'] = r['Uh'] - r['Up']
    rows.append(r)
    print(f"{kk} {r['t']:.3f} {r['amp']:.2f} | U {r['Up']:.3f} {r['U0']:.3f} {r['Uh']:.3f} {r['U1']:.3f} | hc {r['hc0']:.3f} {r['hch']:.3f} {r['hc1']:.3f} | h90 {r['h90h']:.3f} {r['h901']:.3f} | d {r['dh']:.3f} {r['d1']:.3f} | w {r['w0']:.3f} {r['wh']:.3f} {r['w1']:.3f} | {r['tr1']:.3f} | sp {r['spp']:.3f} {r['sp0']:.3f} {r['sph']:.3f} {r['sp1']:.3f} | {step0:.4f} {stepMax:.4f} | {r['g0']:.1f} {r['gp']:.1f} | h{r['heave']:+.2f} {kick}")
q = lambda a, p: (sorted(a)[min(len(a) - 1, int(p * len(a)))] if a else float('nan'))
def summ(name, rs):
    rs = [r for r in rs if r['step0'] <= 0.1]
    if not rs: return
    f = lambda k, n=3: f"{q([r[k] for r in rs], .5):.{n}f} ({q([r[k] for r in rs], .1):.{n}f}–{q([r[k] for r in rs], .9):.{n}f})"
    p = lambda k, n=3: f"{q([r[k] for r in rs], .5):.{n}f}"
    print(f"# {tag} {name}: n {len(rs)} · U pre/0/½/1 {p('Up')}/{p('U0')}/{p('Uh')}/{p('U1')} · ΔU½ {f('dUh')} · ΔU1 {f('dU1')} · hc0 {p('hc0')} · hc½ {f('hch')} · hc1 {f('hc1')} · h90½/1 {p('h90h')}/{p('h901')} · d½/1 {p('dh')}/{f('d1')} · w0/½/1 {p('w0')}/{p('wh')}/{f('w1')} · trail1 {p('tr1')} · sp pre/1 {p('spp')}/{p('sp1')} · step0 {p('step0', 4)} max {max(r['stepMax'] for r in rs):.4f} · grey0 {p('g0', 1)}")
summ('all', rows); summ('return', [r for r in rows if r['t'] < RET]); summ('groove', [r for r in rows if r['t'] >= RET])
