// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// Solver after Pavel Dobryakov, WebGL-Fluid-Simulation (MIT, 2017) — https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
// The BAND grammar slot (FLUID2-PLAN §2, DECISIONS §116; RESET to the identity at §120, 2026-10-11 — the user: "I'm not a fan of fluid2
// (it moves too quickly); reset fluid2 to fluid and let's try something else in fluid2"): the second MS → force grammar of the one pool,
// chosen by the scene that owns the pool (a card's `fluid: { grammar: 'bands' }` — FLUID2, id 1; core/fluid/grammar.js is the table,
// fluid.js dispatches, loop.js names the owner). PURE, the same module interface as inject.js (`plan, mkState, K, FLUID_FEATS`), so
// tools/fluid-tracks.js and tools/fluid-replay.js replay it through `INJECT=assets/core/fluid/inject2.js` unchanged.
//
// HOW IT COMPOSES. plan(S, dt, st) runs inject.js's plan() on `st.base` — the SAME state object fluid.js hands the pool grammar
// (fluid.js: `st2.base = st`), so the §111 machinery (the key pin and its evidence, the lanes' rank buffers, the hat bucket, the ink
// rate, the confirmed clear and its refractory, the §113 shockwave's countdown, the midRing, the void's latch) keeps running across a
// scene switch in BOTH directions. A grammar built here edits the result BY KIND (`k` on every splat): remove the kinds it replaces,
// append its own, rewrite `params`, add its own return fields (fluid.js reads `heave`, `swirl`, `grain`, `highs`, `pen`, `dtSim`,
// `substeps`, `params.curlMask` when present — all optional, each absent = the identical pass). Grammar 2's OWN state (the fields
// beside `base`) starts cold on the first FLUID2 frame — every one of them must be a transient or ease from its neutral value, so
// the switch is never a cut. A `dtSim` of 0 from the base wins over any grammar-2 `dtSim` (fluid.js multiplies).
//
// TODAY: the IDENTITY — plan() returns the base plan untouched, so FLUID2 is FLUID to the pixel (§116 S0's proof: the real-md5 lines
// hash for hash). The §116 S1–S6 band grammar (the sub a field, the kick a vortex pair, the mids the confinement, the highs a grain + a
// dip + the light, the harmony's pen, the solver's clock) lives at ebc372f / v0.37 (`git show v0.37:assets/core/fluid/inject2.js`) and
// is NOT the direction: the user pulled it (§120). K = {} (`K2=` / `FLUIDK2=` reach it, `FLUIDK=` reaches inject.js's K, which plan()
// inherits); FLUID_FEATS = inject.js's list (check.js: every read in THIS file must be in it, and the base's list counts as read).
import { plan as planBase, mkState as mkStateBase, FLUID_FEATS as FEATS_BASE } from './inject.js';

export const FLUID_FEATS = [...FEATS_BASE];   // a grammar's own reads are appended here, never removed — the base reads them

// The band grammar's constants (K2), one table — empty at the identity. The base's K (inject.js) is inherited through planBase().
export const K = {};

// { base: inject.js's state (SHARED with the pool grammar — fluid.js sets it; null = make one on the first plan), …this grammar's own }
export const mkState = () => ({ base: null });

// plan(S, dt, st) → the same shape as inject.js's plan() (its fields, plus this grammar's own when it has any). The identity.
export function plan(S, dt, st) {
  if (!st.base) st.base = mkStateBase();
  return planBase(S, dt, st.base);
}
