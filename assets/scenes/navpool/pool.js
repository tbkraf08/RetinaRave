// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// NAVPOOL's stirring (DECISIONS §149) — the set's dance moves the scene's own pool (pool-sim.js, the set's edge its wall). The ink enters where the dynamics
// live: the CRITICAL ORBIT z₀ = 0, z₁ = c, z₂ = c² + c, … of the c the ball has rolled to. While c is in M that orbit never
// escapes, so every point of it lies in the filled Julia set — the interior this scene paints with the pool (shaders-v2.js).
// Each point is mapped plane → screen by the inverse of the shader's view map (z = xy + s·rot(w)·p, p = (2uv − 1)·(aspect, 1)),
// and a droplet of ink is dropped there in the key's hue (§151: ink only — it was thrown along the orbit's step z_{n+1} − z_n, and those
// thrusts wrapped round the attracting cycle into a vortex). The mid band sets how much ink per second (the `stir` parameter), the kick drops a stronger burst on the first orbit points, the drop (the live slam, the map's line,
// the energy shift — implode.js's three) a ring outward from the centre, as FLUID2's. At most ORB_MAX droplets a frame from the
// orbit. No Math.random: which orbit point a droplet takes walks the golden ratio on this module's own count (FLUID2's sparkle).
// Only an ON-SCREEN NAVPOOL splats (the visibility gate is FLUID2's, on env.SC).
import { TAU, clamp, frac, hsv } from '../../math/util.js';

export const PK = {
  ORB_LEN: 24,     // the orbit points a droplet may take (z₁ … z₂₄): past ~20 they sit on the attracting cycle
  ORB_MAX: 8,      // droplets a frame from the orbit, the kick's included
  RATE: 40,        // droplets per second at stir 1 (the mid band), × presence
  RATE0: 0.15,     // the floor of the rate under stir: a quiet piece still breathes
  INK: 0.012,      // its ink (linear) at stir 1
  RAD: 1.5,        // its radius × the grammar's splat radius
  HUE: 0.08,       // the hue spread along the orbit around the key hue
  KICK_N: 6,       // the kick: an ink burst on the first KICK_N orbit points (§151: ink only — no thrust) …
  KICK_INK: 0.035, // … with this much ink
  KICK_RAD: 3,     // … this wide (× the grammar's radius)
  RING_N: 8,       // the drop: RING_N droplets on a ring round the centre, outward (FLUID2's ring: 6, .22, 1.6, grey)
  RING_R: 0.18,
  RING_V: 1.6,
  RING_INK: 0.05,
  RING_RAD: 3,
  RING_TC: 0.5,    // the ring's envelope (hud)
  FLOOR: 0.012,    // the ink floor per second in every fluid cell at stir 1 (× (0.3 + stir) × presence): the basin the wall sculpts
};
const GOLD = 0.6180339887;
export const POOL = { vis: 0, on: 0, n: 0, acc: 0, nSplat: 0, kicks: 0, rings: 0, ring: 0, total: 0 };
const ZX = new Float64Array(PK.ORB_LEN + 2), ZY = new Float64Array(PK.ORB_LEN + 2);

// z ↦ uv: the inverse of the shader's view map. Returns false off screen.
function toUv(x, y, V, asp, out) {
  const dx = x - V[0], dy = y - V[1], c = Math.cos(V[3]), s = Math.sin(V[3]);
  out[0] = ((c * dx + s * dy) / V[2] / asp + 1) / 2;
  out[1] = ((-s * dx + c * dy) / V[2] + 1) / 2;
  return out[0] > 0.01 && out[0] < 0.99 && out[1] > 0.01 && out[1] < 0.99;
}
const UV = [0, 0, 0, 0];

// Once per update(), after updateNav / update2. S the scene's MS view, SC env.SC, id this scene's id, F the solver (pool-sim.js SIM), c the drawn c,
// V the view the shader drew last frame [x, y, scale, rot], asp the aspect, hue the key hue (look2.js L2.hueT), stir the parameter.
export function stepPool(dt, S, SC, id, F, c, V, asp, hue, stir) {
  const trans = SC.next >= 0;
  POOL.vis = (SC.cur === id ? 1 - (trans ? SC.m : 0) : 0) + (SC.next === id ? SC.m : 0);
  POOL.on = F && F.on ? 1 : 0;
  POOL.ring = Math.max(0, POOL.ring - dt / PK.RING_TC);
  POOL.nSplat = 0;
  if (!(POOL.vis > 0 && POOL.on)) return;
  const g = S.presence, rad = F.params.radius;
  if (F.floor) {
    const fc = hsv(frac(hue), 0.6, PK.FLOOR * (0.3 + stir) * g);
    F.floor[0] = fc[0];
    F.floor[1] = fc[1];
    F.floor[2] = fc[2];
  }
  // the critical orbit; a point past |z| 2 escapes (c outside M on the drop): the orbit stops there
  let len = 0;
  ZX[0] = 0;
  ZY[0] = 0;
  for (let i = 1; i < ZX.length; i++) {
    const x = ZX[i - 1], y = ZY[i - 1];
    ZX[i] = x * x - y * y + c[0];
    ZY[i] = 2 * x * y + c[1];
    if (ZX[i] * ZX[i] + ZY[i] * ZY[i] > 4) break;
    len = i;
  }
  let budget = PK.ORB_MAX;
  if (S.kickEvt && 'kick' in F) F.kick = Math.max(F.kick, clamp(S.kickAmp, 0, 1) * g);   // unit 2: the wall's shove (pool-sim.js KICK_WALL)
  if (S.kickEvt && len > 1) {   // the kick: a burst along the first orbit points, sized by the kick
    POOL.kicks++;
    const a = clamp(S.kickAmp, 0, 1) * g;
    for (let i = 1; i <= Math.min(PK.KICK_N, len - 1) && budget > 0; i++) {
      if (!toUv(ZX[i], ZY[i], V, asp, UV)) continue;
      const col = hsv(frac(hue + PK.HUE * (i / PK.KICK_N - 0.5)), 0.8, PK.KICK_INK * a);
      F.splat(UV[0], UV[1], 0, 0, col, rad * PK.KICK_RAD);   // §151: ink only (the thrust along the orbit's step wrapped round the cycle: a curl burst)
      budget--;
      POOL.nSplat++;
    }
  }
  POOL.acc = Math.min(POOL.acc + PK.RATE * (PK.RATE0 + stir) * g * dt, PK.ORB_MAX);
  while (POOL.acc >= 1 && budget > 0 && len > 1) {   // the stir: one droplet per orbit point the golden walk picks
    POOL.acc -= 1;
    POOL.n++;
    const i = 1 + Math.floor(frac(POOL.n * GOLD) * (len - 1));
    if (!toUv(ZX[i], ZY[i], V, asp, UV)) continue;
    const col = hsv(frac(hue + PK.HUE * (i / len - 0.5)), 0.75, PK.INK * (0.3 + stir) * g);
    F.splat(UV[0], UV[1], 0, 0, col, rad * PK.RAD);   // §151: ink only — the orbit's thrusts wrapped round the attracting cycle (a vortex driven by mid × presence)
    budget--;
    POOL.nSplat++;
  }
  if (S.dropLiveEvt || S.mapDropEvt || S.shiftEvt) {   // the drop: a ring outward from the centre (the set's centre: z = 0 is the view's centre)
    POOL.rings++;
    POOL.ring = 1;
    for (let i = 0; i < PK.RING_N; i++) {
      const a = TAU * (i + 0.5) / PK.RING_N, cx = Math.cos(a), sy = Math.sin(a), k = PK.RING_INK * g;
      const col = hsv(frac(hue + i / PK.RING_N * 0.25), 0.6, k);
      F.splat(0.5 + PK.RING_R * cx / asp, 0.5 + PK.RING_R * sy, PK.RING_V * g * cx / asp, PK.RING_V * g * sy, col, rad * PK.RING_RAD);
      POOL.nSplat++;
    }
  }
  POOL.total += POOL.nSplat;
}

// Harness knob (hooks.nppk, `&nppk=V:0,KICK_V:0`): set the stirring's numbers by name for an A/B (§151, as pool-sim.js knobSim).
export function knobPool(v) {
  for (const kv of String(v).split(',')) {
    const [k, x] = kv.split(':');
    if (k in PK && typeof PK[k] === 'number' && Number.isFinite(+x)) PK[k] = +x;
  }
}

// §151 harness only (hooks.npspin, index.js): a controlled turn of the view — for the next `frames` update()s θs += rate·dt, added to the drawn
// rotation (the picture and the mask turn together); after the window θs HOLDS. 0 by default (the scene bit-exact).
export const SPIN = { rate: 0, left: 0, th: 0 };
export function knobSpin(rate, frames) {
  if (typeof rate === 'string' && frames === undefined) [rate, frames] = rate.split(',');
  const r = +rate, n = frames === undefined || frames === '' ? 60 : Math.round(+frames);
  if (!Number.isFinite(r) || !Number.isFinite(n)) return;
  SPIN.rate = r;
  SPIN.left = Math.max(0, n);
}
