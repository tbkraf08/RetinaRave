// Boot: engine → core (GL, effects, scenes) → registry → harness → loop.
import { ENGINE } from './engine/engine.js';
import './engine/features-synapse.js';
import { G, initGL, mkProg, use, tri, tex, dynBuf, upload, mkTarget, freeTarget, addResizeHook, resize, ERRS, ETEX } from './core/gl.js';
import { Q, tier } from './core/quality.js';
import { LOOK } from './core/look.js';
import { addEffect } from './core/post.js';
import { initScenes, register } from './core/scenes.js';
import { initLines, VS_CHUNK, FS_CHUNK, mk as mkLines, set as setLines, draw as drawLines, drawN as drawLinesN } from './core/lines.js';
import { initHUD } from './core/hud.js';
import { initHarness, CARD, TEST } from './core/harness.js';
import { startLoop } from './core/loop.js';
import { hsv } from './math/util.js';

import feedback from './effects/feedback.js';
import bloom from './effects/bloom.js';
import exposure from './effects/exposure.js';
import composite from './effects/composite.js';

import nav from './scenes/nav/index.js';
import dust from './scenes/dust/index.js';
import mandala from './scenes/mandala/index.js';
import torus from './scenes/torus/index.js';

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
  targets: G.RT, Q, tier, LOOK, hsv, engineTex: ETEX,
  lines: { VS: VS_CHUNK, FS: FS_CHUNK, mk: mkLines, set: setLines, draw: drawLines, drawN: drawLinesN },
  log: (s) => { if (TEST) CARD.log.push(s); },
};
CARD.ctx = ctx; // harness only: tools/lines-smoke.js draws through it

initScenes();
initLines();
for (const fx of [feedback, bloom, exposure, composite]) addEffect(fx, ctx);
for (const scene of [nav, dust, mandala, torus]) {
  const missing = (scene.feats || []).filter((f) => !(f in ENGINE.FEATS));
  if (missing.length) ERRS.push('scene ' + scene.name + ' reads undeclared MS fields: ' + missing.join(','));
  scene.init(ctx);
  register(scene);
}
resize();
initHUD();
initHarness(() => $('landing').classList.add('hide'));
startLoop();
