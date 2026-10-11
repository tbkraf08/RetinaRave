// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// FEIGEN's zoom ladder (v0.2 §16): rung geometry, rung resolution and the progressive tile schedule.
// Pure JS — no `gl`, no `MS`, no clock, no Math.random(). Everything here is a function of (L, tier, aspect, the slot
// records) alone, which is what makes the progressive build bit-identical between runs. Node test:
// `tools/test_feigen_ladder.js`.
//
// A rung is a fixed rectangle of parameter space (offsets from c_inf) rendered ONCE at a fixed resolution and then
// sampled every frame through the moving camera. One rung is a factor 2 in the base view width, i.e. LR = ln2/ln(delta)
// levels of the dive. The camera inside a rung only ever shrinks or wobbles within a bounded envelope, so one
// rectangle per rung covers every view the music can ask for — including every view of every DEEPER rung, which is
// what makes a coarser rung a usable fallback while a finer one is still building.

export const DELTA = 4.669201609102990;               // Feigenbaum's delta: one level of the dive
export const LR = Math.LN2 / Math.log(DELTA);         // 0.4499460... levels per rung (a factor 2 in the width)
export const W0 = 3.2;                                // the unmodulated view height at L = 0

// the wd modulation envelope, from update(): wd = base * (1 + .25*tension - .18*dropEnv - .03*kick)
export const MOD_MAX = 1.25, MOD_MIN = 1 - 0.18 - 0.03;
// the centre wobble and the roll, from update(): cx = wd*(.30 +- .02), cy = wd*(+-.03), rot = +-.04
export const CX_LO = 0.28, CX_HI = 0.32, CY_ABS = 0.03, ROT_ABS = 0.04;
// a hair of slack so the extreme view's corners are strictly inside the rectangle, never on it (0.4% of the texels)
export const PAD = 1.004;

export const DENS = 2;                                // field texels per view pixel at the rung's base width
export const MAX_TEXELS = 6e6;                        // per rung (upper half-plane only)
export const BUDGET = [6e6, 9e6, 12e6, 18e6];         // texel-iterations per draw() by ctx.tier()
export const COARSE_DIV = 4;                          // rule 3: the burst is a quarter of the rung per side
export const BLEND_DRAWS = 30;                        // a rung change cross-fades in field space over this many draws
export const STANDIN_MAX = 3;                         // rule 1: how far the virtual level may reach, in whole levels

export function rungOf(L) { return Math.max(0, Math.floor(L / LR)); }
export function baseWidth(r) { return W0 * Math.pow(2, -r); }
// the tier-3 iteration count for the DEEPEST level the rung serves: with the field amortised the tier buys work per
// frame (BUDGET), never iterations, so the mathematics no longer changes with the quality knob.
export function iterFor(r) { const L = (r + 1) * LR; return Math.min(500, Math.floor((70 + 30 * L * L) * 1.25)); }

// The view is `wd` TALL and `aspect*wd` wide (the shader's p = (gl_FragCoord.xy - .5*uRes)/uRes.y), rolled by
// +-ROT_ABS. Half-extents of the rolled view rectangle, per unit of wd.
export function halfExtents(aspect) {
  const c = Math.cos(ROT_ABS), s = Math.abs(Math.sin(ROT_ABS));
  return { hx: 0.5 * aspect * c + 0.5 * s, hy: 0.5 * aspect * s + 0.5 * c };
}
// The rung rectangle in units of the rung's base width. Every term scales with wd, and wd <= MOD_MAX*W inside the
// rung, so the widest admissible view is the one that decides the rectangle — and any smaller view is inside it.
export function rectShape(aspect) {
  const h = halfExtents(aspect);
  const m = MOD_MAX * PAD;
  return { x0: m * (CX_LO - h.hx), x1: m * (CX_HI + h.hx), y1: m * (CY_ABS + h.hy) };
}
// Upper half-plane only: both M and the tricorn are symmetric under c -> conj(c) (the reference orbit is real) and the
// colouring's two `ea` reads are symmetric under ea -> 1 - ea, so sampling |y| is exact and halves the memory.
export function rungRect(r, aspect) {
  const W = baseWidth(r), s = rectShape(aspect);
  return { x0: s.x0 * W, x1: s.x1 * W, y1: s.y1 * W, w: W };
}
// Resolution: DENS x the view's texel density at the base width. The view resolves ph pixels over wd of parameter
// space, so DENS*ph texels per W_r; capped at MAX_TEXELS and at MAX_TEXTURE_SIZE per side (the density falls to fit).
export function rungSize(aspect, ph, maxSide, maxTexels) {
  const s = rectShape(aspect), sw = s.x1 - s.x0, sh = s.y1, cap = maxTexels || MAX_TEXELS;
  let dens = DENS * ph;
  const k = Math.min(1, maxSide / (sw * dens), maxSide / (sh * dens), Math.sqrt(cap / (sw * sh * dens * dens)));
  dens *= k;
  return { tw: Math.max(16, Math.floor(sw * dens)), th: Math.max(8, Math.floor(sh * dens)), dens: dens / ph };
}
export function rowsPerFrame(budget, tw, iter) { return Math.max(1, Math.floor(budget / (tw * iter))); }

// --- the sampling transform (the colour pass does exactly this in GLSL, with texel centres at i + .5)
export function toTexel(rect, tw, th, x, y) {
  return { fx: (x - rect.x0) / (rect.x1 - rect.x0) * tw - 0.5, fy: Math.abs(y) / rect.y1 * th - 0.5 };
}
export function toParam(rect, tw, th, i, j) {
  return { x: rect.x0 + (i + 0.5) / tw * (rect.x1 - rect.x0), y: (j + 0.5) / th * rect.y1 };
}
// the four corners of a view, in parameter space, offset from c_inf (the roll's sign convention is symmetric)
export function viewCorners(aspect, wd, cx, cy, rot) {
  const c = Math.cos(rot), s = Math.sin(rot), out = [];
  for (const px of [-0.5 * aspect, 0.5 * aspect]) {
    for (const py of [-0.5, 0.5]) out.push([cx + (px * c + py * s) * wd, cy + (-px * s + py * c) * wd]);
  }
  return out;
}
export function inRect(rect, p) { return p[0] >= rect.x0 && p[0] <= rect.x1 && Math.abs(p[1]) <= rect.y1; }

// --- the slot ring and the tile schedule
export function mkSlot() { return { r: -1, tricorn: 0, iter: 0, built: 0 }; }
export function isBuilt(s, r, tric, th) { return !!s && s.r === r && s.tricorn === tric && s.built >= th; }

// Which of the three slots takes rung r. Not r % 3: a drop moves the dive by one level = 2 OR 3 rungs, and with a
// modular map the 3-rung case would have the build overwrite the very slot the stand-in is reading. `busy` is the
// slot on screen and the slot the cross-fade is still reading; everything else is fair game, oldest first.
export function pickSlot(slots, r, tric, busy) {
  for (let i = 0; i < slots.length; i++) if (slots[i].r === r && slots[i].tricorn === tric) return i;
  let best = -1, sc = -1;
  for (let i = 0; i < slots.length; i++) {
    if (busy.indexOf(i) >= 0) continue;
    const v = slots[i].r < 0 ? 1e9 : Math.abs(slots[i].r - r);
    if (v > sc) { sc = v; best = i; }
  }
  if (best < 0) for (let i = 0; i < slots.length; i++) if (busy.indexOf(i) < 0 || i !== busy[0]) { best = i; break; }
  return best;
}
export function findBuilt(slots, r, tric, th) {
  for (let i = 0; i < slots.length; i++) if (isBuilt(slots[i], r, tric, th)) return i;
  return -1;
}
// rule 1: the virtual level. A drop (+1) and the kick-hidden wrap (-1) land on a rung that is not built; the picture
// at L -+ 1 IS the picture at L scaled by delta, so show the built rung of a neighbouring level with its own camera.
export function findStandin(slots, L, tric, th, dir) {
  for (let k = 1; k <= STANDIN_MAX; k++) {
    for (const sg of [dir, -dir]) {
      const Lv = L + sg * k;
      if (Lv < 0) continue;
      const i = findBuilt(slots, rungOf(Lv), tric, th);
      if (i >= 0) return { idx: i, r: rungOf(Lv), k: sg * k };
    }
  }
  return null;
}
// A coarser rung always contains the view (every term of the rectangle scales with the width), so it is the honest
// fallback while a finer one is still building: the true mathematics, magnified, instead of a burst.
export function findCoarser(slots, r, tric, th) {
  for (let k = 1; k <= 5 && r - k >= 0; k++) { const i = findBuilt(slots, r - k, tric, th); if (i >= 0) return i; }
  return -1;
}
// One draw's worth of field work: the rung under construction is the one the dive is in if it is not finished, else
// the next one down. Bounded by the tier's texel-iteration budget, doubled in the last 15% of a rung.
export function planBuild(slots, L, tier, tric, tw, th, busy) {
  const r = rungOf(L);
  let t = r, i = pickSlot(slots, r, tric, busy);
  if (isBuilt(slots[i], r, tric, th)) {
    t = r + 1;
    i = pickSlot(slots, t, tric, busy);
    if (isBuilt(slots[i], t, tric, th)) return null;
  }
  const iter = iterFor(t);
  const fresh = !(slots[i].r === t && slots[i].tricorn === tric);
  const y = fresh ? 0 : slots[i].built;
  let b = BUDGET[tier] || BUDGET[0];
  if (t === r + 1 && L / LR - r > 0.85) b *= 2;
  return { idx: i, r: t, iter, fresh, y, rows: Math.min(th - y, rowsPerFrame(b, tw, iter)) };
}
