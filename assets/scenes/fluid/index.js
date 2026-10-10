// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// Solver after Pavel Dobryakov, WebGL-Fluid-Simulation (MIT, 2017) — https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
// FLUID (id 12, "slot 13"; FLUID-PLAN Step 3, DECISIONS §106) — the fluid substrate shown as itself: the pool of ink every
// other scene rides (core/fluid/, DECISIONS §104; the feedback pass back-traces every trail along its velocity, §105), lit
// as a liquid surface. Forced-only (score() 0, §93's roster rule; no digit key — `n` cycles to it, or &scene=12).
//
// WHAT IS WHOSE. The music → pool grammar is the CORE's (core/fluid/inject.js, its reads in FLUID_FEATS, shown in the help
// view's part B): the sub is where the ink enters, the kick lifts it, the snare shears it, the hats are droplets, the key is
// its colour, the beat kneads it, the filter makes it syrup, the void lets it accumulate, the live drop clears it — and, since
// §113, THROWS it: the confirmed drop fires the grammar's SHOCKWAVE, a radial velocity ring from the screen's centre out at one
// screen radius per beat (the ink thrown outward, the centre clean, refilled by the drop's kicks). This scene READS the dye
// (ctx.engineTex.dye, linear) and draws it in one pass (shaders.js); it adds one injection of its own through ctx.fluid.splat,
// gated on being on screen (the pool is one under every scene): a sparkle on the surface while the hats are up. Its own reads
// are exactly `feats`: the loudness ladder for the exposure (math/loudlight.js, as NAV2), the hats and presence. The §106 ring
// of six droplets on the drop is GONE (§113): it was six point-pushes standing in for the velocity ring the substrate now has —
// one ring, not two; `kick.x` (the monitor's one declared cut) is now the shockwave's envelope, raised on the frame the
// grammar's clear fires (`ctx.fluid.params.dyeDiss` reaching the clear's value — §111 item 5's confirmed drop; one per bar).
// A scene must not import core/fluid (check.js): everything through ctx.fluid. The plan's `ctx.fluid.params.curl += 10` is
// NOT done: the step runs BEFORE update() and rewrites params from the grammar, so a scene's write there is overwritten before
// any step reads it (reported, §106).
//
// Under &fluid=0 / key W / no float render targets the dye is the 1×1 black placeholder: draw() paints the empty pool's
// idle (faint rings on musical time) and hud() says why. Nothing here reads a wall clock or Math.random: the sparkle's x
// walks the golden ratio on the scene's own count.
import { clamp, ema, frac } from '../../math/util.js';
import { baseLight } from '../../math/loudlight.js';
import { SHOW_FS } from './shaders.js';
import { HELP } from './help.js';

const EXPO0 = 0.5;         // the exposure at the bottom of the track's loudness ladder …
const EXPO1 = 0.9;         // … and what the top adds (a drop at the track's loudest lights the pool at 1.4)
const EXPOTC = 0.12;       // the exposure's ease: baseLight() is continuous, the ease is inertia the eye expects of light
const SPEC = 0.6;          // the highlight's gain
const RELIEF = 24;         // the gradient's gain: ink differs by hundredths over two dye texels, the normal needs ×24 to tilt
const PORT0 = 0.88;        // the porthole feather, inner radius on the frame's superellipse …
const PORT1 = 1.04;        // … and outer: the corners and the walls are outside the picture
const RING_TC = 0.5;       // the drop's envelope for the hud / monitor (the monitor's declared cut): raised on the grammar's confirmed clear —
                           //   §113: the shockwave's frame; the §106 six-droplet ring that fired here is gone (the substrate's ring replaces it)
const HAT_ON = 0.3;        // the sparkle: while hat2 is above this (the grammar's own gate) …
const HAT_GAP = 0.05;      // … one droplet every 50 ms, never two in a frame
const HAT_Y = 0.93;        // at the surface
const HAT_V = -0.12;       // falling, uv/s
const HAT_DYE = 0.2;       // its ink at hat2 1 (white-ish: a sparkle, not the key)
const HAT_RAD = 0.4;       // its radius × the grammar's
const GOLD = 0.6180339887; // the sparkle's x walks the golden ratio across 0.15..0.85 on the scene's own count

const CLEAR_DD = 12;       // §111: the grammar's DROP_DISS — the frame dyeDiss first reads this is the confirmed drop (inject.js's clear)
const U = { expo: 1, vis: 0, ring: 0, hatT: 0, nHat: 0, on: 0, relief: RELIEF, nSplat: 0, clearing: 0 };

// read-only hooks (CONTRACTS §1.4: a hook that reports must not mutate)
function flinfo() {
  return JSON.stringify({ expo: +U.expo.toFixed(4), vis: +U.vis.toFixed(3), ring: +U.ring.toFixed(3), nHat: U.nHat, on: U.on, relief: U.relief, nSplat: U.nSplat });
}
function fldbg() { // the step's numbers, through ctx.fluid (the plan's hook)
  const F = SELF.ctx && SELF.ctx.fluid;
  if (!F) return JSON.stringify({ on: false });
  return JSON.stringify({ on: F.on, avail: F.avail, ms: +F.ms.toFixed(3), tier: F.tier, sim: [F.simW, F.simH], dye: [F.dyeW, F.dyeH], nSplat: F.nSplat, steps: F.steps, params: F.params });
}

const SELF = {
  name: 'fluid',
  id: 12,
  tag: 'the fluid substrate as itself — a pool of ink lit from above: the bass note is where it enters, kicks lift it, snares shear it, the key colours it, the drop clears it and throws it outward',
  card: { title: 'FLUID', blurb: 'ink in a pool: the bass note is where it enters, every kick lifts it, the snare shears it, the key is its colour' },
  feats: ['loudRel', 'loudRange', 'loudAbs', 'hat2', 'presence'],
  cuts: 'continuous',
  rt: {},
  hooks: { flinfo, fldbg },
  // the continuity monitor's shape (tools/monitor.js reads CARD.NAV || CARD.home; a run points CARD.NAV here): cPath is the
  // scene's own continuous state — the exposure and the on-screen weight; pathCut 3 = measure every frame (CHLADNI's note);
  // kick.x is the drop's envelope (§113: the shockwave's frame), the one declared cut (it rises on the drop frame)
  state: { mode: 'pool', cPath: [1, 0], pathCut: 3, kick: { x: 0 }, baby: null },

  // forced-only (§93's roster rule): the user's eye decides whether it ever bids
  score() {
    return 0;
  },

  init(ctx) {
    this.ctx = ctx;
    this.pr = ctx.mkProg(ctx.oklch + SHOW_FS, 'fluid-show');
  },

  update(dt, MS, GROOVE, LOOK, env) {
    const P = env.params;
    const SC = env.SC, id = this.id, trans = SC.next >= 0;
    U.vis = (SC.cur === id ? 1 - (trans ? SC.m : 0) : 0) + (SC.next === id ? SC.m : 0);
    U.expo = ema(U.expo, P.light, dt, EXPOTC);
    U.relief = P.relief;
    const F = this.ctx.fluid;
    U.on = F && F.on ? 1 : 0;
    U.hatT = Math.max(0, U.hatT - dt);
    U.ring = Math.max(0, U.ring - dt / RING_TC);
    U.nSplat = 0;
    if (U.vis > 0 && U.on) {                       // the pool is one under every scene: only an on-screen FLUID stirs it
      const g = MS.presence, rad = F.params.radius;
      const clearing = F.params.dyeDiss >= CLEAR_DD ? 1 : 0, drop = clearing && !U.clearing;   // §111: the grammar's confirmed clear, on its first frame
      U.clearing = clearing;
      if (drop) U.ring = 1;                        // §113: the grammar's shockwave fires on this frame (its own ring, in the substrate); the envelope for the monitor
      if (MS.hat2 > HAT_ON && U.hatT <= 0) {       // the sparkle: one droplet onto the surface, at most every HAT_GAP
        U.hatT = HAT_GAP;
        U.nHat++;
        const s = clamp((MS.hat2 - HAT_ON) / (1 - HAT_ON), 0, 1) * g, k = HAT_DYE * s;
        F.splat(0.15 + 0.7 * frac(U.nHat * GOLD), HAT_Y, 0, HAT_V * g, [k, k, k * 1.1], rad * HAT_RAD);
        U.nSplat++;
      }
    } else U.clearing = F && F.on && F.params.dyeDiss >= CLEAR_DD ? 1 : 0;   // off screen: track it, never splat
    this.rt.label = 'pool expo ' + U.expo.toFixed(2);
    const st = this.state;
    st.cPath[0] = U.expo;
    st.cPath[1] = U.vis;
    st.kick.x = U.ring;
  },

  draw(target, { w, h }) {
    const ctx = this.ctx, g = ctx.gl, pr = this.pr;
    if (!pr || !pr.p) return;
    const D = ctx.engineTex.dye;                   // the substrate's ink (1×1 black while it is off: the idle below)
    ctx.use(pr, target, w, h);
    ctx.tex(pr, 'uDye', 0, D);
    g.uniform2f(pr.u('uDyeTexel'), 1 / Math.max(1, D.w), 1 / Math.max(1, D.h));
    g.uniform4f(pr.u('uLook'), U.expo, SPEC, U.relief, U.on ? 0 : 1);
    g.uniform2f(pr.u('uPort'), PORT0, PORT1);
    ctx.tri();
  },

  hud() {
    const F = this.ctx && this.ctx.fluid;
    const sub = !F || !F.avail ? 'needs float render targets — the pool is empty' : !F.on ? 'substrate off (W) — the pool is empty' : 'step ' + F.ms.toFixed(2) + ' ms splats ' + F.nSplat + ' dd ' + F.params.dyeDiss.toFixed(2) + ' curl ' + F.params.curl.toFixed(0);
    return 'fluid expo' + U.expo.toFixed(2) + ' vis' + U.vis.toFixed(2) + ' ring' + U.ring.toFixed(2) + ' hats' + U.nHat + ' · ' + sub;
  },

  // the visual parameters (CONTRACTS §1.16): the light on the track's own loudness ladder, and the relief (a manual constant)
  params: {
    light: { eli5: 'how brightly the pool is lit, on the track\'s own loudness ladder', range: [0, 1.6], from: (MS) => EXPO0 + EXPO1 * baseLight(MS.loudRel, MS.loudRange, MS.loudAbs, MS.loudRel) },
    relief: { eli5: 'how deeply the light carves the edges of the ink', range: [0, 80], from: () => RELIEF },
  },

  post: { fb: { decay: 0.35, advect: 1 }, bloom: { thr: 0.5 }, kaleido: 0, morph: { flow: 0.4 } },
  colour: { default: 'v2', variants: { v2: {} } },
  help: HELP,
};
export default SELF;
