// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// The grammar table of the one pool (FLUID2-PLAN §2, DECISIONS §116): which MS → force grammar plans the fluid step is a SLOT
// on the scene card (`fluid: { grammar: '<name>' }`, CONTRACTS §1.4), never a special case in core/. PURE (node-importable:
// tools/test_fluid.js, tools/check.js). Every grammar exports inject.js's interface — `plan, mkState, K, FLUID_FEATS`.
//   'pool'   core/fluid/inject.js  — the default: FLUID (id 12) and every scene without the slot (the roster: §109's advect-off scenes)
//   'bands'  core/fluid/inject2.js — FLUID2 (id 13): the bands as different kinds of coupling
// grammarOf(scene) → the name the OWNER's card declares, 'pool' when it declares none; a name not in the table is 'pool' too
// (check.js FAILS a card naming one, so it never reaches the loop). The owner is loop.js's rule: the incoming scene while a
// crossfade runs (SC.next), else SC.cur — the pool is in its grammar by the time it is fully visible. Deterministic: a function
// of SC alone, which the harness forces; nothing here reads a clock.
import * as pool from './inject.js';
import * as bands from './inject2.js';

export const GRAMMARS = { pool, bands };
export const DEFAULT_GRAMMAR = 'pool';

export function grammarOf(scene) {
  const g = scene && scene.fluid && scene.fluid.grammar;
  return typeof g === 'string' && Object.prototype.hasOwnProperty.call(GRAMMARS, g) ? g : DEFAULT_GRAMMAR;
}

// §135 THE IDLE RULE. §104 stepped the solver under EVERY scene; only a scene that SAMPLES the substrate (ctx.engineTex.dye /
// .vel — FLUID draws the dye, and its post.fb.advect back-traces the trail along the velocity) has anything to show for it, and
// the step is 1.65 ms of GPU per frame at tier 3. So the step is gated on the OWNER's own declaration — `fluid: { reads: true }`
// on the card, DATA on the scene and never an id list in core/ (CONTRACTS §1.4; check.js FAILS a folder that samples the
// substrate without the flag). readsFluid(scene) is that flag; loop.js steps when it is true and idles the pool when it is not.
// A scene may hold the grammar slot without reading the pool (it would plan a field nobody looks at) — allowed, and the slot
// without `reads` is exactly that; the two are independent.
export function readsFluid(scene) {
  return !!(scene && scene.fluid && scene.fluid.reads);
}
