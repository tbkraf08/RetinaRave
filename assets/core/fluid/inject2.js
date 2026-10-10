// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// Solver after Pavel Dobryakov, WebGL-Fluid-Simulation (MIT, 2017) — https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
// The BAND grammar (FLUID2-PLAN §2, DECISIONS §116): the second MS → force grammar of the one pool, chosen by the scene that owns
// the pool (a card's `fluid: { grammar: 'bands' }` — FLUID2, id 13; core/fluid/grammar.js is the table, fluid.js dispatches, loop.js
// names the owner). PURE, the same module interface as inject.js (`plan, mkState, K, FLUID_FEATS`), so tools/fluid-tracks.js and
// tools/fluid-replay.js replay it through `INJECT=assets/core/fluid/inject2.js` unchanged.
//
// HOW IT COMPOSES. plan(S, dt, st) runs inject.js's plan() FIRST, on `st.base` — the SAME state object fluid.js hands the pool
// grammar (fluid.js: `st2.base = st`), so the §111 machinery (the key pin and its evidence, the lanes' rank buffers, the hat bucket,
// the ink rate, the confirmed clear and its refractory, the §113 shockwave's countdown, the midRing, the void's latch) keeps running
// across a scene switch in BOTH directions: the frame a roster scene takes the pool back, the pool grammar's state is warm. Then
// it edits the result BY KIND (`k` on every splat): it removes the kinds it replaces, appends its own, rewrites `params`, adds
// its own return fields — S1 the sub as a field (below), S2 the kick's travelling mass (`'dip'`, `'stroke'`, `'jet'`), S3 the mids
// as material (curl from `mid`), S4 the highs as the surface (noise, the dip, the light), S5 the pen, S6 time. Whatever FLUID-DROP
// item 2 adds to plan() / fluid.js (the freeze, the ring of frames) reaches both grammars through this call — the precedence written
// now: a `dtSim` of 0 from the base wins over any grammar-2 `dtSim` (fluid.js multiplies).
// Grammar 2's OWN state (the fields beside `base`) starts cold on the first FLUID2 frame — every one of them is a transient
// or eases from its neutral value, so the switch is never a cut (S1: the envelopes start AT the frame's sub, the ink rate at the
// base's warm rate — no burst on the switch).
//
// S1 — THE SUB IS A FIELD, NEVER A DOT (FLUID2-PLAN §4 S1; the user: "the whole pool heaves with the sub's envelope, gravity flips;
// its presence deserves the same scale as its absence (the void): global"). The §104 emitter's jet (`k: 'sub'`, +SUB_V per frame at
// the bass note's place) is a point source; here its VELOCITY is gone and the sub enters the solver as two body forces on the velocity
// advect pass, the whole pool at once:
//   the HEAVE  — on the breath's shaped channel (`body`, the cos(π(2x−1)) profile: centre vs edges — a uniform vertical force in a
//                closed pool is a pressure gradient the projection removes, §104's lesson): −HEAVE · (subEnv − subSlow) · g, the sub's
//                envelope (`sub` eased SUB_TAU, a tenth of a beat) against its own slow mean (SUB_SLOW), WITH the breath (centre down:
//                the sub is the pool's weight) — the attack deepens the beat's gravity, the tail eases it, the void's entry (the slow
//                mean above a sub that left) lifts against the breath and STILLS the pool, the drop's return slams it; plus
//                −HEAVE_DC · subEnv — the level as a steady extra gravity while the bass plays (the exploration's fifth switch);
//   the SWIRL  — a solid-body rotation, `uSwirl` on the advect pass (fluid.js; 0 is the byte-identical program path, as the ring's
//                A = 0 is): the angular acceleration SWIRL · subEnv · g, its direction by the bar parity so it never winds up — the
//                whole pool turns with the sub;
//   the FLIP   — gravity flips: the heave's direction by the bar parity (FLIP 1: the attack sinks on one bar, lifts on the next) or by
//                the glide's sign (FLIP 2: a rising bass lifts, a falling one sinks, a held note heaves nothing; GLIDE_K st/s saturates it);
//   the INK    — the emitter's DYE stays (SUB_INK × it, dx = dy = 0: the ink still enters at the bass note's place on the tonic
//                axis, so a sub-only passage is not colourless; the field carries it), spread over SUB_RAD × the radius at 1 / SUB_RAD²
//                the dye (the same ink in the budget's units: a cloud where the jet's dot was); 0 drops the splat. The ink budget (§111)
//                is re-derived over THIS list when the ink differs (the own rate `st.inkRate`, started at the base's warm value).
// What the void does (§111 item 4: the latch, VOID_FLOOR) is the base's and untouched; `st.base.xSub` is still computed by plan()
// (the kick lifts from under it). The defaults below are the strips' pick (DECISIONS §116 S1, the per-track table); the other
// variants stay as K2 switches (`K2=` on the strip tools, `CARD.fluid.K2` live).
import { plan as planBase, mkState as mkStateBase, FLUID_FEATS as FEATS_BASE, K as KB } from './inject.js';
import { clamp, ema } from '../../math/util.js';

export const FLUID_FEATS = [...FEATS_BASE, 'sub'];   // S1: the sub band's level (25–60 Hz, fast) — the envelope's source; ∪ this grammar's own reads, appended, never removed

// The band grammar's constants (K2), one table. The base's K (inject.js) is inherited through planBase().
export const K = {
  HEAVE: 0.6,      // S1 the heave: uv/s² per unit of the envelope's rise above its slow mean, WITH the breath (centre down; BODY .35 is the ruler it reads beside: the
                   //   attack's pulse ±.15–.35 next to the breath's .35 peak — 1.0 + DC .3 read the sub best, r(Δ, sub) .93, but ran every groove 50–60 % faster)
  HEAVE_DC: 0.15,  //   the level as a steady extra gravity, uv/s² per unit subEnv (× .7 on a groove = .1 beside the breath's .13 mean; 0 = the rise alone — the
                   //   rise alone stills the void but lets a steady groove settle back to the pool grammar's speed, DECISIONS §116 S1)
  SUB_TAU: 0.04,   //   s: subEnv = `sub` eased this fast (a tenth of a beat at 150 bpm — the inertia the eye expects, §1.18)
  SUB_SLOW: 2,     //   s: subSlow = subEnv's slow mean; the heave is the rise above it, and SUB_SLOW · subSlow the circulation it leaves
  FLIP: 0,         //   gravity flips: 0 none (a rise deepens the gravity) · 1 by the bar parity (beatCount >> 2 & 1) · 2 by the glide's sign (rising lifts)
  GLIDE_K: 3,      //   st/s at which FLIP 2's sign saturates (clamp(subGlide / GLIDE_K, −1, 1): a held note is no flip)
  SWIRL: 0,        //   the swirl: angular acceleration (1/s², at |p| = 1 in screen heights) × subEnv × g, the direction by the bar parity; 0 = the identical advect path
  SUB_GATE: 0,     //   1: the field only while the base is in its DRUM branch (the sub seen within HARM_BARS bars — §111 item 8); 0: the band alone. The 25–60 Hz
                   //   band reads .4 on Comptine's piano with the gate never open, so the pool sways with its low notes at 0 (+.08 uv/s, r(Δ, sub) .51 — the strips)
  SUB_INK: 1,      //   the emitter's dye kept × this (dx = dy = 0 always: never a jet); 0 drops the 'sub' splat and re-governs the ink
  SUB_RAD: 3,      //   the emitter's radius × this, its dye ÷ this² (the same ink in the budget's area-weighted units): the mouth's ink as a CLOUD, not a dot (1 reads as
                   //   a bright spot at the bass note's place on a drop's return — the strips, §116 S1; the grey moves 1–2 levels either way)
};

// { base: inject.js's state (SHARED with the pool grammar — fluid.js sets it; null = make one on the first plan), …this grammar's own:
//   n the frames planned (0 = cold: the envelopes start at the frame's sub, the ink rate at the base's), subEnv / subSlow the envelopes,
//   inkRate this grammar's own §111 ink rate (ema INK_TAU) over ITS final list }
export const mkState = () => ({ base: null, n: 0, subEnv: 0, subSlow: 0, inkRate: 0 });

// plan(S, dt, st) → the same shape as inject.js's plan() (its fields, the 'sub' splat without its velocity) + `heave` (uv/s², what
// was added to `body`), `swirl` (the uniform's value, 1/s²), `subEnv` (the envelope) — the replay rulers read them.
export function plan(S, dt, st) {
  if (!st.base) st.base = mkStateBase();
  const R = planBase(S, dt, st.base);
  const g = R.gain, cold = st.n === 0;
  // the envelopes (cold: at the frame's value — the switch into this grammar mid-track is not a heave)
  const sub = clamp(S.sub || 0, 0, 1);
  st.subEnv = cold ? sub : ema(st.subEnv, sub, dt, K.SUB_TAU);
  st.subSlow = cold ? st.subEnv : ema(st.subSlow, st.subEnv, dt, K.SUB_SLOW);
  // the emitter's dot: its velocity is gone; its ink stays × SUB_INK (0 = the splat is gone)
  const i = R.splats.findIndex((s) => s.k === 'sub');
  let inkChanged = false;
  if (i >= 0) {
    if (K.SUB_INK > 0) {
      const s = R.splats[i]; s.dx = 0; s.dy = 0;
      if (K.SUB_INK !== 1 || K.SUB_RAD !== 1) { const f = K.SUB_INK / (K.SUB_RAD * K.SUB_RAD); s.r *= f; s.g *= f; s.b *= f; s.rad *= K.SUB_RAD; inkChanged = true; }
    } else { R.splats.splice(i, 1); inkChanged = true; }
  }
  // the ink budget over THIS list (§111; the drop's impulse not counted, as the base counts): the own rate starts at the base's warm
  // value and runs the same ema, so with the ink unchanged it IS the base's rate and the base's dyeDiss stands untouched
  let ink = 0;
  for (const s of R.splats) if (s.k !== 'drop') ink += (s.r + s.g + s.b) * (s.rad / KB.RADIUS) ** 2;
  st.inkRate = cold ? R.ink : ema(st.inkRate, ink / dt, dt, KB.INK_TAU);
  if (inkChanged && st.inkRate !== R.ink && !(st.base.clearLeft > 0)) R.params.dyeDiss = R.params.dyeDiss / Math.max(1, R.ink / KB.INK_BUDGET) * Math.max(1, st.inkRate / KB.INK_BUDGET);
  R.ink = st.inkRate;
  // the field: the heave on the breath's channel, the swirl as its own uniform; the bar parity turns the swirl so nothing winds up.
  // The heave's direction (dir +1) is WITH the breath — the sub is the pool's WEIGHT: the attack deepens the gravity the beat already
  // applies (centre down), the void's entry (the slow mean above a sub that left) LIFTS against it and stills the pool, the drop's return
  // slams. The strips settled it (DECISIONS §116 S1): the opposite sign cancelled the breath on every groove, sped every void up and
  // weakened every return. FLIP 1 alternates it by the bar; FLIP 2 reads the glide — a rising bass LIFTS, a falling one sinks, a held note
  // heaves nothing.
  const bar = (S.beatCount >> 2) & 1 ? -1 : 1;
  const dir = K.FLIP === 1 ? bar : K.FLIP === 2 ? -clamp((S.subGlide || 0) / K.GLIDE_K, -1, 1) : 1;
  const gate = K.SUB_GATE ? 1 - R.harmonic : 1;   // SUB_GATE 1: nothing while the base is in its harmonic branch (a piano, a pad — the sub unseen for HARM_BARS bars)
  const heave = -(K.HEAVE * (st.subEnv - st.subSlow) + K.HEAVE_DC * st.subEnv) * g * dir * gate;
  if (heave) R.body += heave;   // 0 adds nothing: the body stays the base's to the bit (the sub silent = the pool grammar's breath)
  const swirl = K.SWIRL * st.subEnv * g * bar * gate;
  st.n++;
  R.heave = heave; R.swirl = swirl; R.subEnv = st.subEnv;
  return R;
}
