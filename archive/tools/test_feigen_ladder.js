// Node test for FEIGEN's zoom ladder (v0.2 §16, acceptance 2). Imports assets/scenes/feigen/ladder.js and nothing
// else — no DOM, no gl. Checks: the rung index and the base width agree with the dive's own wd = 3.2*delta^-L; the
// rung rectangle contains the four rolled corners of every extreme view of the rung (and of the rungs below it); the
// sample transform round-trips; the tile schedule is a pure function of (L, tier) — the same sequence twice.
import * as LD from '../assets/scenes/feigen/ladder.js';

let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } };
const near = (a, b, e, m) => ok(Math.abs(a - b) <= e, m + ' (' + a + ' vs ' + b + ', tol ' + e + ')');

// --- 1. rung index, base width, iteration count
near(LD.LR, 0.4498070, 1e-6, 'LR = ln2/ln(delta)');   // the brief printed 0.449946; ln2/ln(4.669201609102990) is 0.44980697
for (let r = 0; r < 12; r++) {
  ok(LD.rungOf(r * LD.LR + 1e-9) === r, 'rungOf inside rung ' + r);
  ok(LD.rungOf((r + 1) * LD.LR - 1e-9) === r, 'rungOf at the bottom of rung ' + r);
  // the dive's own width 3.2*delta^-L at the top of rung r must be the rung's base width, and half of it at the bottom
  near(LD.W0 * Math.pow(LD.DELTA, -r * LD.LR), LD.baseWidth(r), LD.baseWidth(r) * 1e-9, 'baseWidth r' + r);
  near(LD.W0 * Math.pow(LD.DELTA, -(r + 1) * LD.LR), LD.baseWidth(r) / 2, LD.baseWidth(r) * 1e-9, 'half width at r' + r);
}
ok(LD.rungOf(-1) === 0, 'rungOf clamps at 0');
ok(LD.iterFor(0) === 95 && LD.iterFor(3) === 208 && LD.iterFor(8) === 500, 'iterFor 0/3/8 = ' + [0, 3, 8].map(LD.iterFor));
for (let r = 0; r < 12; r++) ok(LD.iterFor(r) >= LD.iterFor(Math.max(0, r - 1)), 'iterFor rises with depth at r' + r);

// --- 2. containment: the rolled corners of the extreme views of rungs 0, 3, 8 at 16:9 and 4:3
let worst = 1e9;
for (const aspect of [16 / 9, 4 / 3]) {
  const shape = LD.rectShape(aspect);
  for (const r of [0, 3, 8]) {
    const rect = LD.rungRect(r, aspect), W = LD.baseWidth(r);
    // every base width in the rung (top W .. bottom W/2, and two below it) x every modulation x every wobble sign
    for (const base of [W, W * 0.75, W / 2, W / 4, W / 8]) {
      for (const mod of [LD.MOD_MAX, LD.MOD_MIN, 1]) {
        for (const cxf of [LD.CX_LO, LD.CX_HI]) {
          for (const cyf of [-LD.CY_ABS, LD.CY_ABS]) {
            for (const rot of [-LD.ROT_ABS, 0, LD.ROT_ABS]) {
              const wd = base * mod;
              for (const p of LD.viewCorners(aspect, wd, wd * cxf, wd * cyf, rot)) {
                ok(LD.inRect(rect, p), 'corner outside rung ' + r + ' a' + aspect.toFixed(3) + ' wd/W ' + (wd / W).toFixed(3) + ' [' + p + ']');
                if (base >= W / 2) worst = Math.min(worst, (rect.x1 - p[0]) / W, (p[0] - rect.x0) / W, (rect.y1 - Math.abs(p[1])) / W);
              }
            }
          }
        }
      }
    }
    ok(rect.x0 < 0 && rect.x1 > 0 && rect.y1 > 0, 'rect signs r' + r);
    near(rect.x1 / W, shape.x1, 1e-12, 'rect scales with the base width r' + r);
  }
}
ok(worst > 1e-4, 'containment margin strictly positive: ' + worst);

// --- 3. the sample transform round-trips, the half-plane mirrors, the caps hold
{
  const aspect = 16 / 9, sz = LD.rungSize(aspect, 720, 16384), rect = LD.rungRect(4, aspect);
  for (const ij of [[0, 0], [1, 1], [17, 33], [sz.tw - 1, sz.th - 1], [sz.tw >> 1, sz.th >> 1]]) {
    const p = LD.toParam(rect, sz.tw, sz.th, ij[0], ij[1]), t = LD.toTexel(rect, sz.tw, sz.th, p.x, p.y);
    near(t.fx, ij[0], 1e-6, 'round-trip fx ' + ij[0]);
    near(t.fy, ij[1], 1e-6, 'round-trip fy ' + ij[1]);
  }
  const p = LD.toParam(rect, sz.tw, sz.th, 5, 5);
  near(LD.toTexel(rect, sz.tw, sz.th, p.x, p.y).fy, LD.toTexel(rect, sz.tw, sz.th, p.x, -p.y).fy, 1e-12, 'half-plane mirror');
  ok(sz.tw * sz.th <= LD.MAX_TEXELS, 'rung under the texel cap: ' + sz.tw + 'x' + sz.th);
  const big = LD.rungSize(aspect, 1080, 16384);
  ok(big.tw * big.th <= LD.MAX_TEXELS, 'rung under the cap at 1080p: ' + big.tw + 'x' + big.th + ' dens ' + big.dens.toFixed(3));
  const small = LD.rungSize(aspect, 720, 2048);
  ok(small.tw <= 2048 && small.th <= 2048, 'MAX_TEXTURE_SIZE respected: ' + small.tw + 'x' + small.th);
}

// --- 4. the schedule is a pure function of (L, tier): the same sequence twice, with a drop in it
function run(sz) {
  const slots = [LD.mkSlot(), LD.mkSlot(), LD.mkSlot()], out = [];
  let use = -1, prev = -1, L = 0;
  for (let f = 0; f < 900; f++) {
    L += 0.0022 * (1 + 0.3 * Math.cos(f * 0.017));       // a deterministic stand-in for the dive
    if (f === 400) L += 1;                                // the drop
    const tier = [3, 3, 2, 1][(f >> 8) & 3];
    const p = LD.planBuild(slots, L, tier, 0, sz.tw, sz.th, [use, prev]);
    if (p) {
      const s = slots[p.idx];
      if (p.fresh) { s.r = p.r; s.tricorn = 0; s.iter = p.iter; s.built = 0; }
      s.built += p.rows;
      out.push(f + ':' + p.idx + '/' + p.r + '/' + p.y + '+' + p.rows + '/' + p.iter);
    }
    const r = LD.rungOf(L);
    for (let i = 0; i < 3; i++) if (LD.isBuilt(slots[i], r, 0, sz.th) && use !== i) { prev = use; use = i; }
  }
  return out.join(' ');
}
const SZ = LD.rungSize(16 / 9, 720, 16384);
{
  const a = run(SZ), b = run(SZ);
  ok(a === b, 'schedule deterministic over 900 frames');
  ok(a.split(' ').length > 300, 'schedule did work (' + a.split(' ').length + ' build steps)');
}

// --- 5. a build never lands in the slot that is on screen or in the slot the cross-fade still reads
{
  const slots = [LD.mkSlot(), LD.mkSlot(), LD.mkSlot()];
  slots[0].r = 5; slots[0].built = SZ.th; slots[1].r = 3; slots[1].built = SZ.th;
  const p = LD.planBuild(slots, 5.3 * LD.LR, 3, 0, SZ.tw, SZ.th, [0, 1]);
  ok(p && p.idx === 2, 'build avoids the busy slots (got ' + (p && p.idx) + ')');
}

if (fails) { console.log(fails + ' FAIL'); process.exit(1); }
console.log('ladder OK · LR ' + LD.LR.toFixed(6) + ' · rung at 1280x720 ' + SZ.tw + 'x' + SZ.th
  + ' (' + (SZ.tw * SZ.th / 1e6).toFixed(2) + ' Mpx, ' + (SZ.tw * SZ.th * 8 / 1048576).toFixed(0) + ' MB RGBA16F, dens '
  + SZ.dens.toFixed(3) + ' texel/px) · iter r0/r3/r8 ' + [0, 3, 8].map(LD.iterFor).join('/')
  + ' · rows/frame tier3 ' + LD.rowsPerFrame(LD.BUDGET[3], SZ.tw, 500) + ' at it500, '
  + LD.rowsPerFrame(LD.BUDGET[3], SZ.tw, 142) + ' at it142 · containment margin ' + worst.toFixed(4) + ' W');
