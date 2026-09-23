// Test harness: window.CARD, CARD.fix, #test / &scene= / &fake=0 / &demo= / scene hooks (&baby=), CARD.log, bench.
// Mirrors cardioid3's CARD object so tools/parity.js can dump the same fields from both.
import { ENGINE } from '../engine/engine.js';
import { MS } from '../engine/state.js';
import { GROOVE } from '../engine/groove.js';
import { FEATS } from '../engine/feats.js';
import { SC, REG, SCENES, goScene, renderScene } from './scenes.js';
import { Q } from './quality.js';
import { FX, EFFECTS } from './post.js';
import { G, ERRS } from './gl.js';
import { LOOK } from './look.js';
import { getGrid } from '../math/mandel.js';

export const HASH = new URLSearchParams(location.hash.slice(1));
export const TEST = HASH.has('test');

export const CARD = {
  log: [], MS, SC, Q, FX, ERRS, GROOVE, LOOK, ENGINE, SCENES, REG, EFFECTS, FEATS, TEST, HASH,
  hooks: {},
  frameN: 0,
  get fix() { return ENGINE.fix; },
  set fix(v) { ENGINE.fix = v; },
  get GRID() { return getGrid(); },
  get home() { const E = REG[SC.home]; return E ? E.scene.state : null; }, // the home scene's state (parity/monitor tools)
  goScene: (id, hard) => goScene(id, hard, MS),
  // Micro-benchmark a scene id: ms per full-resolution render, readPixels-synced (Q.q is not a perf verdict headless).
  bench(id, n = 40) {
    const gl = G.gl, px = new Uint8Array(4), T = [G.RT.a, G.RT.b];
    const sync = () => {
      for (const r of T) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, r.f);
        gl.readPixels(G.PW >> 1, G.PH >> 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      }
    };
    renderScene(id, G.RT.a, G.PW, G.PH);
    sync();
    const t = performance.now();
    for (let i = 0; i < n; i++) {
      LOOK.time += 0.01;
      renderScene(id, T[i & 1], G.PW, G.PH);
      if (i % 8 === 7) sync();
    }
    sync();
    return (performance.now() - t) / n;
  },
  // Every MS number finite? Returns the offending keys (empty = healthy). Used by the real-start-path check.
  nonFinite() {
    const bad = [];
    for (const k in MS) {
      const v = MS[k];
      if (typeof v === 'number' && !isFinite(v)) bad.push(k);
      else if (v && v.length !== undefined && typeof v !== 'string') { for (let i = 0; i < v.length; i++) if (typeof v[i] === 'number' && !isFinite(v[i])) { bad.push(k + '[' + i + ']'); break; } }
    }
    return bad;
  },
};

// Apply the hash to engine + director; expose scene hooks (&<hook>=value for any scene that declares hooks.<hook>).
export function initHarness(hideLanding) {
  window.CARD = CARD;
  ENGINE.fakeOn = TEST && HASH.get('fake') !== '0';
  for (const sc of SCENES) {
    for (const k in sc.hooks || {}) {
      CARD.hooks[k] = sc.hooks[k];
      if (TEST && HASH.has(k)) sc.hooks[k](HASH.get(k));
    }
  }
  if (TEST) {
    hideLanding();
    if (HASH.get('fake') === '0') ENGINE.start('demo');
    if (HASH.has('scene')) SC.forced = +HASH.get('scene');
  }
}

// Per-frame test logging (only under #test).
export function logFrame(S, now, frameN) {
  if (!TEST) return;
  if (S.dropEvt) CARD.log.push('DROP@' + now.toFixed(2) + ' str ' + S.dropStrength.toFixed(2));
  if (S.sectionEvt) CARD.log.push('SECTION@' + now.toFixed(2) + ' ' + S.arc);
  if (S.surpriseEvt) CARD.log.push('SURPRISE@' + now.toFixed(2));
  if (SC.logical !== CARD._ls) {
    CARD._ls = SC.logical;
    CARD.log.push('SCENE@' + now.toFixed(2) + ' -> ' + SC.logical);
  }
  if (frameN % 60 === 0) {
    const E = REG[SC.cur], rt = E ? E.scene.rt : {};
    CARD.log.push(`${now.toFixed(1)} bpm${S.bpm.toFixed(1)} reg${S.regularity.toFixed(2)} ${S.arc} e${S.eS.toFixed(2)}/${S.eM.toFixed(2)} b${S.bass.toFixed(2)} bld${S.build.toFixed(2)} abs${S.absentT.toFixed(1)} ten${S.tension.toFixed(2)} sur${S.surprisal.toFixed(2)}/${(S.surRaw || 0).toFixed(1)} iv${S.interval} cl${S.clarity.toFixed(2)} | ${rt.log || ''} | sc${SC.logical} sec${S.sectionId} q${Q.q.toFixed(2)}`);
  }
  if (frameN % 30 === 0) {
    const e = G.gl.getError();
    if (e) CARD.glerr = e;
  }
}
