// Test harness: window.CARD, CARD.fix, #test / &scene= / &fake=0 / &demo= / &trans= / scene hooks (&baby=), CARD.log, bench.
// Mirrors cardioid3's CARD object so tools/parity.js can dump the same fields from both.
import { ENGINE } from '../engine/engine.js';
import { MS } from '../engine/state.js';
import { GROOVE } from '../engine/groove.js';
import { FEATS } from '../engine/feats.js';
import { SC, REG, SCENES, TRANSITIONS, goScene, renderScene, setTransition } from './scenes.js';
import { Q } from './quality.js';
import { FX, EFFECTS } from './post.js';
import { G, ERRS, ETEX } from './gl.js';
import { LOOK } from './look.js';
import { HELP } from './help.js';
import { getGrid } from '../math/mandel.js';

export const HASH = new URLSearchParams(location.hash.slice(1));
export const TEST = HASH.has('test');

// One-pixel readback from a core target: the GPU sync the benches rely on. The targets are RGBA16F when floats are
// available, and a UNSIGNED_BYTE read from a float target is INVALID_OPERATION (rejected before it reaches the GPU,
// so it never synced — every bench before §11 measured submission time); read FLOAT there.
function readback(r) {
  const gl = G.gl;
  gl.bindFramebuffer(gl.FRAMEBUFFER, r.f);
  if (G.FLOAT) gl.readPixels(r.w >> 1, r.h >> 1, 1, 1, gl.RGBA, gl.FLOAT, new Float32Array(4));
  else gl.readPixels(r.w >> 1, r.h >> 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
}

export const CARD = {
  log: [], MS, SC, Q, FX, ERRS, GROOVE, LOOK, ENGINE, SCENES, REG, EFFECTS, TRANSITIONS, FEATS, HELP, TEST, HASH,
  hooks: {},
  frameN: 0,
  get fix() { return ENGINE.fix; },
  set fix(v) { ENGINE.fix = v; },
  get GRID() { return getGrid(); },
  get home() { const E = REG[SC.home]; return E ? E.scene.state : null; }, // the home scene's state (parity/monitor tools)
  goScene: (id, hard) => goScene(id, hard, MS),
  // Micro-benchmark a scene id: ms per full-resolution render, readPixels-synced (Q.q is not a perf verdict headless).
  bench(id, n = 40) {
    const gl = G.gl, T = [G.RT.a, G.RT.b];
    const sync = () => { for (const r of T) readback(r); };
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
  // ms per full-resolution transition pass for every registered transition (v0.2 §11): the current scene into a, the
  // next registered scene into b once, then n passes at m sweeping .2 → .8, readPixels-synced. Disturbs a transition's
  // own per-fade state (the morph's ease) — bench after the shots, not before.
  benchTransition(n = 300) {
    const gl = G.gl, RT = G.RT, w = G.PW, h = G.PH;
    const sync = () => readback(RT.m);
    const other = SCENES.find((s) => s.id !== SC.cur).id;
    renderScene(SC.cur, RT.a, w, h);
    renderScene(other, RT.b, w, h);
    const out = {};
    for (const name in TRANSITIONS) {
      const tr = TRANSITIONS[name];
      const io = { a: RT.a, b: RT.b, m: 0.5, out: RT.m, w, h, sw: w, sh: h, uvS: [(w - 0.5) / w, (h - 0.5) / h], MS, FX, GROOVE, LOOK, dt: 1 / 60 };
      gl.disable(gl.BLEND);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.SCISSOR_TEST);
      tr.run(io);
      sync();
      const t = performance.now();
      for (let i = 0; i < n; i++) {
        io.m = 0.2 + 0.6 * i / n;
        tr.run(io);
        if (i % 8 === 7) sync();
      }
      sync();
      out[name] = (performance.now() - t) / n;
    }
    return out;
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
  if (HASH.has('demo')) ENGINE.demoStyle = HASH.get('demo');
  if (TEST) {
    hideLanding();
    if (HASH.get('fake') === '0') ENGINE.start('demo');
    if (HASH.has('scene')) SC.forced = +HASH.get('scene');
    if (HASH.has('trans')) setTransition(HASH.get('trans')); // A/B between registered transitions (CONTRACTS §5)
    if (HASH.get('histfull') === '1') ETEX.full = true;      // v0.1 whole-hist upload every hop (§13 proof: same md5)
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
    CARD.log.push('SCENE@' + now.toFixed(2) + ' -> ' + SC.logical + ' bar' + S.barPos.toFixed(2) + ' gt' + S.gridTrust.toFixed(2));
  }
  // director records (v0.2 §10): a restored look memory, a soft switch landing (held = beats waited for the grid)
  if (SC.restored) CARD.log.push('RESTORE@' + now.toFixed(2) + ' alt' + SC.restored.alt + ' scene' + SC.restored.scene);
  if (SC.switched) CARD.log.push('SWITCH@' + now.toFixed(2) + ' -> ' + SC.switched.id + ' bar' + S.barPos.toFixed(2) + ' gt' + S.gridTrust.toFixed(2) + ' (held ' + SC.switched.held.toFixed(1) + ' beats, ' + SC.switched.why + ')');
  if (frameN % 60 === 0) {
    const E = REG[SC.cur], rt = E ? E.scene.rt : {};
    CARD.log.push(`${now.toFixed(1)} bpm${S.bpm.toFixed(1)} syn${S.bpmSyn.toFixed(1)} reg${S.regularity.toFixed(2)} ${S.arc} e${S.eS.toFixed(2)}/${S.eM.toFixed(2)} b${S.bass.toFixed(2)} bld${S.build.toFixed(2)} abs${S.absentT.toFixed(1)} ten${S.tension.toFixed(2)} sur${S.surprisal.toFixed(2)}/${(S.surRaw || 0).toFixed(1)} iv${S.interval} cl${S.clarity.toFixed(2)} | ${rt.log || ''} | sc${SC.logical} sec${S.sectionId} alt${S.sectionAlt} ret${S.sectionReturn} bar${S.barPos.toFixed(2)} gt${S.gridTrust.toFixed(2)} q${Q.q.toFixed(2)}`);
  }
  if (frameN % 30 === 0) {
    const e = G.gl.getError();
    if (e) CARD.glerr = e;
  }
}
