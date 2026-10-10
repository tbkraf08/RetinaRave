// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// Solver after Pavel Dobryakov, WebGL-Fluid-Simulation (MIT, 2017) — https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
// FLUID2 (id 13; FLUID2-PLAN S0, DECISIONS §116) — FLUID's pool under the BAND grammar: the same substrate (core/fluid/, §104), the
// same show pass (shaders.js, a copy of FLUID's that diverges at S4), the same sparkle — and the scene card names its grammar:
// `fluid: { grammar: 'bands' }` (CONTRACTS §1.4). While FLUID2 owns the pool (SC.next if a fade runs, else SC.cur — loop.js) the step
// plans through core/fluid/inject2.js, whose plan() runs inject.js's plan() on the SHARED base state and edits the result by kind;
// at S0 it was the identity (the §116 proof: s13's 58 real lines = s12's, hash for hash); since S1 the sub is a FIELD — the emitter's
// jet is gone, the whole pool heaves with the sub's envelope on the breath's channel (and may swirl / flip by K2), its ink still entering
// at the bass note's place. S2–S6 make the other bands different KINDS of coupling (the kick a travelling mass, the mids the material,
// the highs the surface, the vocals a pen, time breathing) — all of it in inject2.js, nothing here. Forced-only (`&scene=13`, `n` cycles to it):
// NOT on the director's bid, no fit model, no landing tile until the user asks. A scene must not import core/fluid (check.js):
// everything through ctx.fluid; the dye is read through ctx.engineTex.dye. What FLUID's header says about the pool, the
// sparkle (one frame late — the step precedes update()), the §106 dead params override and the idle under &fluid=0 holds here.
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
  return JSON.stringify({ on: F.on, avail: F.avail, ms: +F.ms.toFixed(3), tier: F.tier, sim: [F.simW, F.simH], dye: [F.dyeW, F.dyeH], nSplat: F.nSplat, steps: F.steps, params: F.params, grammar: F.grammar, heave: +F.heave.toFixed(4), swirl: +F.swirl.toFixed(4), kick: F.kick, mids: F.mids, snare: F.snare });   // §116 S1: the field's values on the last step; S2 the kick, S3 the mids and the snare
}

const SELF = {
  name: 'fluid2',
  id: 13,
  tag: 'FLUID\'s pool under the band grammar — each band a different kind of coupling: the sub a field, the kick a mass that travels, the mids the material, the highs the surface (FLUID2-PLAN; S0 = FLUID to the pixel)',
  fluid: { grammar: 'bands' },   // the grammar slot (CONTRACTS §1.4): core/fluid/inject2.js plans the pool while this scene owns it
  feats: ['loudRel', 'loudRange', 'loudAbs', 'hat2', 'presence'], // FLUID's five own reads; no bid fields (forced-only)
  cuts: 'continuous',
  rt: {},
  hooks: { flinfo, fldbg },
  // the continuity monitor's shape (tools/monitor.js reads CARD.NAV || CARD.home; a run points CARD.NAV here): cPath is the
  // scene's own continuous state — the exposure and the on-screen weight; pathCut 3 = measure every frame (CHLADNI's note);
  // kick.x is the drop's envelope (§113: the shockwave's frame), the one declared cut (it rises on the drop frame)
  state: { mode: 'pool', cPath: [1, 0], pathCut: 3, kick: { x: 0 }, baby: null },

  // forced-only (FLUID2-PLAN §2): not on the roster — `&scene=13`, the `n` key, the panel's force. A bid is the user's word.
  score() { return 0; },

  init(ctx) {
    this.ctx = ctx;
    this.pr = ctx.mkProg(ctx.oklch + SHOW_FS, 'fluid2-show');
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
    const sub = !F || !F.avail ? 'needs float render targets — the pool is empty' : !F.on ? 'substrate off (W) — the pool is empty' : 'step ' + F.ms.toFixed(2) + ' ms splats ' + F.nSplat + ' dd ' + F.params.dyeDiss.toFixed(2) + ' curl ' + F.params.curl.toFixed(0) + ' heave ' + F.heave.toFixed(2) + ' swirl ' + F.swirl.toFixed(2) + (F.mids ? ' mid ' + F.mids.pos.toFixed(2) + (F.mids.mask ? ' mask' : '') : '') + (F.snare && F.snare.kind ? ' snare ' + F.snare.kind + (F.snare.side ? (F.snare.side > 0 ? '→' : '←') : '') : '') + (F.kick && F.kick.n ? ' kick ' + F.kick.shape : '');   // §116 S1: the sub's field; S3 the mids' place (and the mask), the snare's kind
    return 'fluid2 expo' + U.expo.toFixed(2) + ' vis' + U.vis.toFixed(2) + ' ring' + U.ring.toFixed(2) + ' hats' + U.nHat + ' · ' + sub;
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
