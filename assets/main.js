// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// Boot: engine → core (GL, effects, transitions, scenes) → registry → harness → loop.
import { ENGINE } from './engine/engine.js';
import './engine/features-synapse.js';
import './engine/features-ears.js'; // v0.15: the ears + the track map (additive stage after synapse)
import './engine/features-loud.js'; // true loudness on the PCM bus — loudM / loudS / loudPk / loudRel / loudRange / loudAbs (additive, after the ears; &loud=0 off)
import './engine/features-clock.js'; // live step 6: the beat clock on the PCM bus — bpmPcm / beatPhasePcm / beatCountPcm / beatPcm / clockConfPcm (additive; &clock=pcm / CARD.setClock the switch; after the ears, before bars)
import './engine/features-tongues.js'; // the Arnold tongues on the PCM clock — tongueP/Q / tongueDepth / tongueK / tongueAmbig / tongue11/21/41 / tongueLat(Conf) / swing / tongueOn (additive, shadow; after clock-pcm; &tongues=0 off; §76)
import './engine/features-bars.js'; // live step 3: the bar fingerprint store (additive stage after the ears, before the lead)
import './engine/features-drums.js'; // the reactive drums v2: kick2 / snare2 / hat2 (additive stage after the ears)
import './engine/features-build.js'; // live step 4: the live build / drop detector — buildLive / dropLiveIn / dropLiveEvt (additive, after drums)
import './engine/features-queue.js'; // live step 5: the predicted-event queue — next*In / next*Conf / next*Up / queueN (additive, after build)
import { G, initGL, mkProg, use, tri, tex, dynBuf, upload, mkTarget, freeTarget, addResizeHook, resize, ERRS, ETEX } from './core/gl.js';
import { Q, tier, budget } from './core/quality.js';
import { LOOK } from './core/look.js';
import { addEffect } from './core/post.js';
import { register, addTransition, setTransition } from './core/scenes.js';
import { initLines, VS_CHUNK, FS_CHUNK, mk as mkLines, set as setLines, draw as drawLines, drawN as drawLinesN } from './core/lines.js';
import { initHUD } from './core/hud.js';
import { initTouch } from './core/touch.js';
import { OKLCH_GLSL } from './core/oklch.js';
import { initHarness, CARD, TEST } from './core/harness.js';
import { startLoop } from './core/loop.js';
import { hsv } from './math/util.js';
import { FLUID, initFluid } from './core/fluid/fluid.js'; // the fluid substrate (DECISIONS §104): ctx.fluid, engineTex.vel / .dye
import { GRAMMARS } from './core/fluid/grammar.js'; // §116 the pool's grammars (inject.js 'pool', inject2.js 'bands'): each one's MS reads, checked like a scene's feats

import feedback from './effects/feedback.js';
import bloom from './effects/bloom.js';
import exposure from './effects/exposure.js';
import composite from './effects/composite.js';

import mixs from './transitions/mixs.js';
import morph from './transitions/morph.js';

import fluid from './scenes/fluid/index.js'; // §118 the lean-down (2026-10-11): id 0, key 1 — the fluid substrate shown as itself (§106, FLUID-PLAN Step 3); on the roster since §114 (its own fit bid beside NAV2, DUST, TORUS2)
import fluid2 from './scenes/fluid2/index.js'; // §118: id 1, key 2 — FLUID's pool under the band grammar (its card's `fluid.grammar`, core/fluid/inject2.js; §116, FLUID2-PLAN); forced-only (score 0)
import nav2 from './scenes/nav2/index.js'; // §118: id 2, key 3 — the retuned navigator (§97–§101) and the director's HOME (`home: true`; core/scenes.js register() seats SC.cur there, so a page load still opens on NAV2 as it did when the home was the literal id 0)
import dust from './scenes/dust/index.js'; // §118: id 3, key 4 — the overhauled cloud (§61–§82); on the roster
import torus2 from './scenes/torus2/index.js'; // §118: id 4, key 5 — the Hopf torus (§37); on the roster
import mandala from './scenes/mandala/index.js'; // §118: id 5, key 6 — the box-fold kaleidoscope; forced-only (score 0)
// §118 the lean-down (the user: "I never look at polytope, feigen, maxwell, gielis, chladni, key5-nav, key8-torus, key9-nav, and OK to archive"):
// the eight scenes they named — POLYTOPE, FEIGEN, MAXWELL, GIELIS, CHLADNI, the v0.33 NAV with its DRUM variant, and TORUS v1 —
// moved to archive/scenes/ with their tests, worker docs and accept references. The old → new id map is archive/README.md.

const $ = (id) => document.getElementById(id);

try {
  initGL($('gl'));
} catch (e) {
  $('msg').textContent = 'WebGL2 is not available in this browser.';
  throw e;
}

// The ctx every scene and effect receives (docs/CONTRACTS.md §1.1). Never the module namespace of core/gl.js.
const ctx = {
  gl: G.gl, mkProg, use, tri, tex, dynBuf, upload, mkTarget, freeTarget, onResize: addResizeHook,
  targets: G.RT, Q, tier, budget, LOOK, hsv, engineTex: ETEX, oklch: OKLCH_GLSL, fluid: FLUID,
  lines: { VS: VS_CHUNK, FS: FS_CHUNK, mk: mkLines, set: setLines, draw: drawLines, drawN: drawLinesN },
  log: (s) => { if (TEST) CARD.log.push(s); },
};
CARD.ctx = ctx; // harness only: tools/lines-smoke.js draws through it

initLines();
for (const g in GRAMMARS) { // the substrate's reads are declared per grammar in its FLUID_FEATS (core/fluid/inject.js, inject2.js) and checked here exactly as a scene's feats are below
  const missing = GRAMMARS[g].FLUID_FEATS.filter((f) => !(f in ENGINE.FEATS));
  if (missing.length) ERRS.push('fluid substrate grammar ' + g + ' reads undeclared MS fields: ' + missing.join(','));
}
initFluid(ctx); // before resize(): its targets are allocated on the first resize hook, like an effect's
for (const fx of [feedback, bloom, exposure, composite]) addEffect(fx, ctx);
for (const tr of [mixs, morph]) addTransition(tr, ctx);
setTransition('morph'); // the default transition, chosen on the §11 A/B montage (DECISIONS §11); mixs is v3's, one &trans= away
for (const scene of [fluid, fluid2, nav2, dust, torus2, mandala]) { // §118: the six kept scenes, in id order — REG is dense 0..5 (the arrow keys and `n` cycle it; core/scenes.js stepScene)
  const missing = (scene.feats || []).filter((f) => !(f in ENGINE.FEATS));
  if (missing.length) ERRS.push('scene ' + scene.name + ' reads undeclared MS fields: ' + missing.join(','));
  scene.init(ctx);
  register(scene);
}
resize();
initHUD();
initTouch(); // v0.6: the bottom bar, swipe and hold on a coarse pointer (CSS shows the bar; the listeners cost nothing elsewhere)
document.addEventListener('visibilitychange', () => { if (!document.hidden) ENGINE.resume(); }); // v0.3 resume-hold (ENGINE.md)
initHarness(() => $('landing').classList.add('hide'));
startLoop();
