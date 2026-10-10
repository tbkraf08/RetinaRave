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
import { FLUID_FEATS } from './core/fluid/inject.js'; // its MS reads, checked like a scene's feats

import feedback from './effects/feedback.js';
import bloom from './effects/bloom.js';
import exposure from './effects/exposure.js';
import composite from './effects/composite.js';

import mixs from './transitions/mixs.js';
import morph from './transitions/morph.js';

import nav from './scenes/nav/index.js'; // §102: id 8, key 9 — the v0.33 navigator, forced-only, kept as the control; DRUM (id 4) stays its variant
import dust from './scenes/dust/index.js';
import mandala from './scenes/mandala/index.js';
import torus from './scenes/torus/index.js';
import polytope from './scenes/polytope/index.js';
import feigen from './scenes/feigen/index.js';
import torus2 from './scenes/torus2/index.js'; // v0.7: id 3, TORUS's bid (DECISIONS §37); torus is torus-v1 at id 7, forced-only
import nav2 from './scenes/nav2/index.js'; // §102 (2026-10-08): id 0, key 1, the director's HOME — the retuned navigator (§97–§101); registered after nav so its `home: true` is the last one (core/scenes.js:50)
import maxwell from './scenes/maxwell/index.js'; // v0.10: id 9, forced-only (score 0; the `n` key cycles to it — the number keys ran out) — MAXWELL-SESSION-PROMPT.md
import gielis from './scenes/gielis/index.js'; // v0.14: id 10, forced-only (score 0; no digit key — `n` cycles to it, or &scene=10) — GIELIS-SESSION-PROMPT.md
import chladni from './scenes/chladni/index.js'; // v0.15: id 11 ("slot 12"), forced-only (score 0; no digit key — `n` cycles to it, or &scene=11) — ENGINE-CHLADNI-SESSION-PROMPT.md
import fluid from './scenes/fluid/index.js'; // §106: id 12 ("slot 13"); on the roster since §114 (its own fit bid beside NAV, DUST, TORUS2; no digit key — `n` cycles to it, or &scene=12) — the fluid substrate shown as itself (FLUID-PLAN Step 3)

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
{ // the substrate's reads are declared in FLUID_FEATS (core/fluid/inject.js) and checked here exactly as a scene's feats are below
  const missing = FLUID_FEATS.filter((f) => !(f in ENGINE.FEATS));
  if (missing.length) ERRS.push('fluid substrate reads undeclared MS fields: ' + missing.join(','));
}
initFluid(ctx); // before resize(): its targets are allocated on the first resize hook, like an effect's
for (const fx of [feedback, bloom, exposure, composite]) addEffect(fx, ctx);
for (const tr of [mixs, morph]) addTransition(tr, ctx);
setTransition('morph'); // the default transition, chosen on the §11 A/B montage (DECISIONS §11); mixs is v3's, one &trans= away
for (const scene of [nav, dust, mandala, torus2, polytope, feigen, torus, nav2, maxwell, gielis, chladni, fluid]) {
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
