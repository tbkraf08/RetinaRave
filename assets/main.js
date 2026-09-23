// Boot: engine → core (GL, effects, scenes) → registry → harness → loop.
import { ENGINE } from './engine/engine.js';
import { G, initGL, mkProg, use, tri, tex, dynBuf, upload, mkTarget, freeTarget, addResizeHook, resize, ERRS } from './core/gl.js';
import { Q } from './core/quality.js';
import { LOOK } from './core/look.js';
import { addEffect } from './core/post.js';
import { initScenes, register } from './core/scenes.js';
import { initHUD } from './core/hud.js';
import { initHarness, CARD, TEST } from './core/harness.js';
import { startLoop } from './core/loop.js';
import { hsv } from './math/util.js';

import feedback from './effects/feedback.js';
import bloom from './effects/bloom.js';
import composite from './effects/composite.js';

import nav from './scenes/nav/index.js';

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
  targets: G.RT, Q, LOOK, hsv,
  log: (s) => { if (TEST) CARD.log.push(s); },
};

initScenes();
for (const fx of [feedback, bloom, composite]) addEffect(fx, ctx);
for (const scene of [nav]) {
  const missing = (scene.feats || []).filter((f) => !(f in ENGINE.FEATS));
  if (missing.length) ERRS.push('scene ' + scene.name + ' reads undeclared MS fields: ' + missing.join(','));
  scene.init(ctx);
  register(scene);
}
resize();
initHUD();
initHarness(() => $('landing').classList.add('hide'));
startLoop();
