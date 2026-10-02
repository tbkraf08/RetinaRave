// Test harness: window.CARD, CARD.fix, #test / &scene= / &fake=0 / &demo= / &trans= / &colour= / &route= / &post= / &param= / &k= / &kmood= / &track= / &at= / &sync= / &lead= / &disp= / &map= / &det= / &clock= / &loud= / &tongues= / scene hooks (&baby=), CARD.log, bench.
// Mirrors cardioid3's CARD object so tools/parity.js can dump the same fields from both.
import { ENGINE } from '../engine/engine.js';
import { MS, XS } from '../engine/state.js';
import { GROOVE } from '../engine/groove.js';
import { FEATS } from '../engine/feats.js';
import { LOUDK } from '../engine/loud.js';   // &loud=0: the true-loudness stage's switch (a leaf module — see loud.js on why it is not on ENGINE)
import { TONGUEK } from '../engine/clock/tongues.js';   // &tongues=0: the tongues stage's switch (§76; the same convention)
import { ROUGHK } from '../engine/roughnorm.js';   // &rough=0: tension's pre-§81 normaliser (the rLo / rHi follower pair)
import { SC, REG, SCENES, TRANSITIONS, goScene, renderScene, setTransition, setColour } from './scenes.js';
import { Q } from './quality.js';
import { FX, EFFECTS, CHAIN } from './post.js';
import { G, ERRS, ETEX } from './gl.js';
import { LOOK } from './look.js';
import { HELP } from './help.js';
import { TOUCH } from './touch.js'; // v0.6: swipe/hold counters
import { LANDING } from './landing.js'; // v0.8.1: the landing tiles' state (peek / picked / tiles)
import { HASH, TEST } from './hash.js';
import { restore as restorePanel } from './panel.js';
import { MANUAL, manual, applyPosts, postString, POST_PARAMS, snapshotDefaults, resetManual } from './manual.js';
import { ROUTES, ROUTE, setRoute, clearRoutes, routesJSON, loadRoutes, applyRoutes, routesString, parseRoute, serialiseRoute, sources, view, pulse } from './route.js';
import { setClock } from '../engine/features-clock.js';
import { PROUTES, PROUTE, setParam, clearParams, applyParams, paramsString, paramsOf, paramDeps, paramSources, derived } from './params.js';
import { getGrid } from '../math/mandel.js';

export { HASH, TEST }; // parsed in hash.js (a leaf the panel can read too)

// One-pixel readback from a core target: the GPU sync the benches rely on. The targets are RGBA16F when floats are
// available, and a UNSIGNED_BYTE read from a float target is INVALID_OPERATION (rejected before it reaches the GPU,
// so it never synced — every bench before §11 measured submission time); read FLOAT there.
function readback(r) {
  const gl = G.gl;
  gl.bindFramebuffer(gl.FRAMEBUFFER, r.f);
  if (G.FLOAT) gl.readPixels(r.w >> 1, r.h >> 1, 1, 1, gl.RGBA, gl.FLOAT, new Float32Array(4));
  else gl.readPixels(r.w >> 1, r.h >> 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
}

const byName = (name) => { const s = SCENES.find((x) => x.name === name); if (!s) throw new Error('no scene ' + name); return s; };
export const CARD = {
  log: [], MS, SC, Q, FX, CHAIN, ERRS, GROOVE, LOOK, ENGINE, SCENES, REG, EFFECTS, TRANSITIONS, FEATS, HELP, TOUCH, LANDING, TEST, HASH,
  TRACE: ENGINE.TRACE, // v0.15 E1: the per-frame MS recorder (tools/filetrace.js) — CARD.TRACE.start(fields) / .stop()
  LOG: ENGINE.LOG,     // v0.15 E2: the event ring (fileStart / fileEnd, and the ears' onsets later)
  hooks: {},
  frameN: 0,
  get fix() { return ENGINE.fix; },
  set fix(v) { ENGINE.fix = v; },
  get GRID() { return getGrid(); },
  get QUEUE() { return ENGINE.QUEUE ? ENGINE.QUEUE.list : []; }, // live step 5: the predicted-event queue's entries [{ cls, t (heard s), conf }], by t
  setClock,                                                      // live step 6: 'pcm' | 'v3' — which beat clock bpm / beatPhase / beat / beatCount publish (features-clock.js; &clock=pcm under #test)
  get clock() { return ENGINE.CLOCK ? ENGINE.CLOCK.src : 'pcm'; },
  get home() { const E = REG[SC.home]; return E ? E.scene.state : null; }, // the home scene's state (parity/monitor tools)
  goScene: (id, hard) => goScene(id, hard, MS),
  setColour, // colour variant by name for every scene that declares it (CONTRACTS §1.4); &colour=<name> under #test
  get colour() { const o = {}; for (const s of SCENES) if (s.colour) o[s.name] = s.colour.cur; return o; },
  // routes (v0.4, CONTRACTS §1.15): ROUTES[scene][field] = spec · route(scene, field, spec|null) · routes('a.b=c,…') = the &route= grammar ·
  // routesString() back to it · routesJSON()/loadRoutes() the preset · view(name) = the MS a scene reads (=== MS when unrouted) · ROUTE.n/ms
  ROUTES, ROUTE, route: setRoute, clearRoutes, routes: applyRoutes, routesString, routesJSON, loadRoutes, parseRoute, serialiseRoute, sources, pulse,
  view: (name) => view(byName(name)),
  // manual overrides (v0.4, core/manual.js): MANUAL.scene (= SC.forced) / .trans / .colour / .post · manual('scene', 6) · manual('trans', 'mixs') ·
  // manual('colour', scene, variant) · manual('post', scene, 'bloom.thr', 0.3 | null) · posts('scene.bloom.thr=0.3,…') = the &post= grammar
  MANUAL, manual, posts: applyPosts, postString, POST_PARAMS, resetManual,
  // params (v0.5, CONTRACTS §1.16): PROUTES[scene][param] = spec · param(scene, param, spec|null) · params('a.b=c,…') = the &param= grammar ·
  // paramsString() back to it · paramsOf(name) = the live value object update() received · paramDeps(name, p) = the fields from() reads ·
  // derived(name, p) = from(view) now · paramSources() = what may feed one · PROUTE.n
  PROUTES, PROUTE, param: setParam, clearParams, params: applyParams, paramsString, paramSources,
  paramsOf: (name) => paramsOf(byName(name)), paramDeps: (name, p) => paramDeps(byName(name), p), derived: (name, p) => derived(byName(name), p),
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
  snapshotDefaults(); // v0.4: the transition main.js chose and each scene's colour default — what resetManual() returns to
  // v0.15 E1: &track=<name> runs a real track through the REAL extractor from the first frame — it implies fake=0 (the fake
  // timeline never runs when a track is set) and hides the card whatever the hash is. &at=<s> the track second to start at,
  // &det=0/1 forces real-time / deterministic mode (the default is deterministic exactly when cdp's CLOCK=1 shim is there),
  // &sync=<ms> declares SYNC_OFS for capture mode. Works with or without #test: `#track=SeeYouDrop` is a valid page.
  const track = HASH.get('track');
  ENGINE.fakeOn = TEST && HASH.get('fake') !== '0' && !track;
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
    if (HASH.has('colour')) setColour(HASH.get('colour'));     // a scene's colour variant (CONTRACTS §1.4, v0.3 §26)
    if (HASH.get('histfull') === '1') ETEX.full = true;      // v0.1 whole-hist upload every hop (§13 proof: same md5)
    if (HASH.has('linear')) CHAIN.linear = HASH.get('linear') === '1'; // the effect chain's colour space (v0.3 §20)
    if (HASH.has('k')) { CHAIN.k = +HASH.get('k'); if (!(CHAIN.k > 0)) throw new Error('&k= must be a positive number'); }           // v0.5 item 4: the tonemap knee's base
    if (HASH.has('kmood')) { CHAIN.kMood = +HASH.get('kmood'); if (!isFinite(CHAIN.kMood)) throw new Error('&kmood= must be a number'); } // and its mood gain (arousal → harder knee)
    if (HASH.has('route')) applyRoutes(HASH.get('route'));  // v0.4 routes: scene.field=src[*k][+b][~tau][!],… (a bad one throws)
    if (HASH.has('post')) applyPosts(HASH.get('post'));      // v0.4 manual post: scene.bloom.thr=0.3,scene.kaleido=0,… (a bad one throws)
    if (HASH.has('param')) applyParams(HASH.get('param'));  // v0.5 params: scene.param=src[*k][+b][~tau][!] | scene.param=c:0.4,… (a bad one throws)
  } else restorePanel(); // v0.4: the panel's localStorage preset, never under #test (the shots stay deterministic)
  // &sync=<ms> reaches capture / mic mode here (AU.heardT adds it); until 2026-09-28 only startFile applied it, so a
  // capture page could not declare its own lag. Measured with tools/caplag.js clicks (docs/HARNESS.md).
  if (HASH.has('sync') && isFinite(+HASH.get('sync'))) ENGINE.AU.sync = +HASH.get('sync') / 1000;
  // live step 2 (engine/lead.js): the beat / bar / phrase clocks on heard time — on by default since v0.16, &lead=0 turns it
  // off (&lead=1 on), &disp=<ms> sets the display lead in every mode (by default 40 in the file modes / demo, 0 in capture /
  // mic since 2026-09-29; &disp=0 = v0.16)
  if (HASH.has('lead')) ENGINE.LEAD.on = HASH.get('lead') === '1';
  if (HASH.has('disp') && isFinite(+HASH.get('disp'))) ENGINE.LEAD.disp = ENGINE.LEAD.dispLive = +HASH.get('disp') / 1000;
  // live step 3.0: &map=0 skips the file's track map, so the ears stay causal (the live path on a file, deterministic under
  // CLOCK=1) — what every live-mode stage is developed against; the default builds the map as v0.15 did
  if (HASH.has('map')) ENGINE.useMap = HASH.get('map') !== '0';
  // true loudness (engine/loud.js, DECISIONS §63): &loud=0 turns the stage off — loudAbs stays -1 and every migrated
  // scene falls back to the `lvl` / `eM` formula it had before, which is the A/B and the md5 receipt
  if (HASH.has('loud')) LOUDK.on = HASH.get('loud') !== '0';
  // the Arnold tongues (engine/clock/tongues.js, DECISIONS §76): &tongues=0 turns the stage off — tongueOn stays -1, no bank runs
  if (HASH.has('tongues')) TONGUEK.on = HASH.get('tongues') !== '0';
  // tension's normaliser (engine/roughnorm.js, DECISIONS §81): &rough=0 restores the v0.28 rLo / rHi follower pair exactly — the A/B
  if (HASH.has('rough')) ROUGHK.win = HASH.get('rough') !== '0';
  // live step 6: &clock=pcm makes bpm / beatPhase / beat / beatCount publish the PCM beat clock (engine/clock; features-clock.js);
  // pcm is the default since 2026-09-30 (§56 addendum 3); &clock=v3 is v0.19's clock. CARD.setClock('pcm' | 'v3') flips it live.
  if (HASH.has('clock')) setClock(HASH.get('clock'));
  if (track) {
    hideLanding();
    ENGINE.start('file', { src: track, at: +(HASH.get('at') || 0), sync: +(HASH.get('sync') || 0),
      det: HASH.has('det') ? HASH.get('det') === '1' : undefined });
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
  if (SC.filed) CARD.log.push('FILE@' + now.toFixed(2) + ' alt' + SC.filed.alt + ' scene' + SC.filed.scene);
  if (S.sectionRenumber) CARD.log.push('RENUMBER@' + now.toFixed(2) + ' ' + S.sectionRenumber.join(',') + (SC.renumbered ? ' kept' + SC.renumbered.kept + ' dropped' + SC.renumbered.dropped : ' off'));
  if (SC.switched) CARD.log.push('SWITCH@' + now.toFixed(2) + ' -> ' + SC.switched.id + ' bar' + S.barPos.toFixed(2) + ' gt' + S.gridTrust.toFixed(2) + ' (held ' + SC.switched.held.toFixed(1) + ' beats, ' + SC.switched.why + ')');
  if (frameN % 60 === 0) {
    const E = REG[SC.cur], rt = E ? E.scene.rt : {};
    CARD.log.push(`${now.toFixed(1)} bpm${S.bpm.toFixed(1)} syn${S.bpmSyn.toFixed(1)} reg${S.regularity.toFixed(2)} r32${XS._tempoDbg && XS._tempoDbg.rel32 ? XS._tempoDbg.rel32.sc + '/' + XS._tempoDbg.rel32.v + '/' + XS._tempoDbg.rel32.n + '/' + XS._tempoDbg.rel32.s1 + '/' + XS._tempoDbg.rel32.sq : '-'} ${S.arc} e${S.eS.toFixed(2)}/${S.eM.toFixed(2)} b${S.bass.toFixed(2)} bld${S.build.toFixed(2)} abs${S.absentT.toFixed(1)} ten${S.tension.toFixed(2)} sur${S.surprisal.toFixed(2)}/${(S.surRaw || 0).toFixed(1)} iv${S.interval} cl${S.clarity.toFixed(2)} | ${rt.log || ''} | sc${SC.logical} sec${S.sectionId} alt${S.sectionAlt} ret${S.sectionReturn} bar${S.barPos.toFixed(2)} gt${S.gridTrust.toFixed(2)} q${Q.q.toFixed(2)}`);
  }
  if (frameN % 30 === 0) {
    const e = G.gl.getError();
    if (e) CARD.glerr = e;
  }
}
