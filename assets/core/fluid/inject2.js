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
// its own return fields — S1 the sub as a field (`k: 'sub'` out, a heave / swirl in), S2 the kick's travelling mass (`'dip'`,
// `'stroke'`, `'jet'`), S3 the mids as material (curl from `mid`), S4 the highs as the surface (noise, the dip, the light), S5
// the pen, S6 time. Whatever FLUID-DROP item 2 adds to plan() / fluid.js (the freeze, the ring of frames) reaches both grammars
// through this call — the precedence written now: a `dtSim` of 0 from the base wins over any grammar-2 `dtSim` (fluid.js multiplies).
// Grammar 2's OWN state (the fields beside `base`) starts cold on the first FLUID2 frame — every one of them must be a transient
// or ease from its neutral value, so the switch is never a cut.
// S0 (this commit): the IDENTITY — plan() returns the base plan untouched; mkState() = { base: null } (fluid.js sets base to the
// shared state; a standalone replay — fluid-tracks.js / fluid-replay.js / test_fluid — gets a fresh base on the first call);
// K = {} (no constants yet; `K2=` / `FLUIDK2=` reach it, `FLUIDK=` reaches inject.js's K, which plan() inherits); FLUID_FEATS =
// inject.js's list (check.js: every read in THIS file must be in it, and the base's list counts as read — plan() reads them).
// The proof that the switch is free is §116's: s13's 58 real-md5 lines = s12's hash for hash, the roster's 174 and FLUID's 58 unmoved.
import { plan as planBase, mkState as mkStateBase, FLUID_FEATS as FEATS_BASE } from './inject.js';

export const FLUID_FEATS = [...FEATS_BASE];   // S1+: ∪ this grammar's own reads (appended here, never removed — the base reads them)

// The band grammar's constants (K2), one table — empty at S0. The base's K (inject.js) is inherited through planBase().
export const K = {};

// { base: inject.js's state (SHARED with the pool grammar — fluid.js sets it; null = make one on the first plan), …this grammar's own }
export const mkState = () => ({ base: null });

// plan(S, dt, st) → the same shape as inject.js's plan() (its fields, plus this grammar's own from S1 on). S0: the identity.
export function plan(S, dt, st) {
  if (!st.base) st.base = mkStateBase();
  const R = planBase(S, dt, st.base);
  return R;
}
