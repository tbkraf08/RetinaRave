// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// SC: scene registry, director (pickScene / precedence), crossfade (through the transition slot), variants, forced/sticky.
// Knows nothing about any specific scene: everything it reads from a scene is a contract slot (docs/CONTRACTS.md).
// Lifted from cardioid3 "SCENES" (goScene / pickScene / updateScenes). v0.2 §10: look memory keyed on synapse's
// sectionAlt, soft switches held to the bar line (DECISIONS §10). v0.2 §11: the mixs pass moved to transitions/mixs.js.
import { clamp, ema, frac } from '../math/util.js';
import { G } from './gl.js';
import { FX } from './post.js';
import { LOOK, headVecs } from './look.js';
import { routeScene, view, isRouted } from './route.js'; // v0.4 routes: the MS view a scene reads (MS itself without routes)
import { paramScene } from './params.js'; // v0.5 params: a scene's visual parameters (validated once here; values handed to update() by the loop)

export const SC = {
  cur: 0, next: -1, m: 0, dur: 2,   // base ids of the two rendered scenes and the crossfade position
  logical: 0,                        // the logical id (a variant has its own id but renders its parent's base)
  variant: null, vT: 0, vmix: 0,     // active variant name, its target (0/1) and the eased mix scenes read
  lastBeat: -99, hist: [0], forced: -1, home: 0,
  mem: {}, prevAlt: -1, altOpen: false, due: -1, // look memory keyed on sectionAlt (§10 A): mem[alt] = {scene, looks}; due = a return whose scene is still owed
  renumberOn: true, renumbers: 0, renumbered: null, filed: null, // v0.3 §21: SC.mem follows synapse's id renumbering (renumberOn=false = the §10 behaviour, for the before/after trace)
  quantise: true, pend: null,            // grid-held soft switch (§10 B): the one pending {id, why, beat0, ...}
  restored: null, switched: null,        // this frame's director records (the harness logs them)
  dwell: [30, 90], since: 0, dwellMin: 30, lands: 0, // §95: a scene stays at least dwellMin s (drawn in dwell at each landing; the first stay, home from the start, gets dwell[0]); since = s on the current scene
};

// REG[id] = { id, base, scene, variant }  (variant = null for a scene's own id)
export const REG = [];
export const SCENES = [];

// Step the forced scene by d from where the eye is now (the logical scene while the director drives) and return the new id.
// A swipe (core/touch.js) and the `n` key (core/hud.js, v0.10 — the number keys ran out at NAV2's `9`) both cycle through
// the registry with it; they hand the id to the landing picker so a press on the card previews like a tile.
export function stepScene(d) {
  const n = REG.length;
  if (!n) return -1;
  const from = SC.forced >= 0 ? SC.forced : SC.logical;
  SC.forced = (from + d + n) % n;
  return SC.forced;
}

export function register(scene) {
  const id = scene.id;
  if (REG[id]) throw new Error('scene id ' + id + ' taken by ' + REG[id].scene.name);
  scene.rt = scene.rt || {};
  routeScene(scene);
  paramScene(scene); // v0.5: checks the params slot (eli5 / range / from reads ⊂ feats) and makes the value object
  REG[id] = { id, base: id, scene, variant: null };
  SCENES.push(scene);
  if (scene.home) SC.home = id;
  if (scene.colour) { // colour slot (CONTRACTS §1.4, v0.3 §26): named colour mappings, one current; the default is the scene's
    const c = scene.colour;
    if (!c.variants || !(c.default in c.variants)) throw new Error('scene ' + scene.name + ': colour.default is not a variant');
    c.cur = c.default;
  }
  for (const v of scene.variants || []) {
    if (REG[v.id]) throw new Error('variant id ' + v.id + ' taken');
    REG[v.id] = { id: v.id, base: id, scene, variant: v };
  }
}

// Transitions (docs/CONTRACTS.md §5): the crossfade pass is a plug-in. Registered by name; one is current (setTransition).
export const TRANSITIONS = {};
let trans = null;
export function addTransition(tr, ctx) {
  tr.init(ctx);
  TRANSITIONS[tr.name] = tr;
  if (!trans) trans = tr;
}
export function setTransition(name) {
  if (!TRANSITIONS[name]) throw new Error('transition ' + name + ' is not registered');
  trans = TRANSITIONS[name];
  return trans;
}
export const currentTransition = () => trans; // read-only: the help view names it (v0.2 §12)

// Colour variant (v0.3 §26): every scene that declares colour.variants[name] switches to it; the rest keep their own
// default. Returns the scenes switched; throws on a name no scene knows (a typo in &colour= must not pass silently).
export function setColour(name) {
  const hit = [];
  for (const sc of SCENES) if (sc.colour && sc.colour.variants[name]) { sc.colour.cur = name; hit.push(sc.name); }
  if (!hit.length) throw new Error('colour variant ' + name + ' is not declared by any scene');
  return hit;
}

export function goScene(id, hard, S) {
  const E = REG[id];
  if (!E) return;
  if (id === SC.logical && SC.next < 0) return;
  SC.vT = E.variant ? 1 : 0;
  SC.variant = E.variant ? E.variant.name : null;
  SC.hist.unshift(id);
  SC.hist.length = Math.min(SC.hist.length, 3);
  SC.logical = id;
  SC.lastBeat = S.beatCount;
  SC.since = 0; // §95: the dwell clock restarts; its minimum is drawn here (deterministic — the traces stay comparable)
  SC.dwellMin = SC.dwell[0] + (SC.dwell[1] - SC.dwell[0]) * frac(Math.sin((++SC.lands) * 12.9898) * 43758.5);
  const b = E.base;
  if (hard) {
    SC.cur = b;
    SC.next = -1;
    SC.m = 0;
    if (!E.variant) SC.vmix = 0;
    FX.glitch = 1;
    return;
  }
  if (b === SC.cur) {
    if (SC.next >= 0) {
      const t = SC.cur;
      SC.cur = SC.next;
      SC.next = t;
      SC.m = 1 - SC.m;
    }
    return;
  }
  if (SC.next >= 0 && SC.m > 0.5) SC.cur = SC.next;
  SC.next = b;
  SC.m = 0;
  SC.dur = clamp(4 * 60 / S.bpm, 1.2, 3);
}

// Highest score wins; a score <= 0 means "never auto-pick now". Per-section seed noise + recency penalty as in v3.
export function pickScene(S) {
  let best = SC.home, bv = -9;
  for (const E of REG) {
    if (!E) continue;
    const V = view(E.scene); // a variant reads its parent's fields, so its parent's view (§1.4)
    const sc = E.variant ? E.variant.score(V, E.scene.rt, SC) : E.scene.score(V, E.scene.rt, SC);
    if (!(sc > 0)) continue;
    let v = sc + 0.1 * frac(Math.sin((S.sectionId + 1) * (E.id + 1) * 12.9898) * 43758.5); // §93: 0.1 (was 0.25) — the bids decide, the hash only breaks ties and keeps a section on one scene
    const hi = SC.hist.indexOf(E.id);
    if (hi === 0) v -= 0.6;
    else if (hi === 1) v -= 0.25;
    if (v > bv) {
      bv = v;
      best = E.id;
    }
  }
  return best;
}

// Precedence (v3): forced → drop hard-cuts home → low presence drifts home → build parks home → event-gated soft switches.
// §95 (2026-10-04, the user: "it rotates too quickly through the scenes, let each scene go at least 30-90 seconds"): the
// event branch (surprise, identify, return, phrase, settled) is closed until the scene has been on for SC.dwellMin seconds,
// drawn in SC.dwell = [30, 90] at every landing. A return owed (SC.due) stays armed through it. `&dwell=a[:b]` under #test.
// The home scene's rt slots: home (bool, in its stable state), awayBeat (beat it last left home), settledAt (beat it
// settled back; consumed here).
// Look memory (§10): when a boundary is declared (boundaryEvt) the outgoing section — synapse's sectionAlt as it was
// last frame — is filed in SC.mem with the scene on screen (or the one decided and held for the bar line) and every
// scene's look.get(); when synapse identifies a
// return (sectionAlt changes with sectionReturn 1) the looks are set back and the filed scene is the soft switch's
// target — a trigger that stays armed (SC.due) until the precedence gates let it through, since v3's surprise hard
// cut tends to land two seconds before the identification and its 8-beat spacing would otherwise eat the return.
// Synapse identifies a few beats after the boundary (SC.altOpen tracks that), so nothing is filed or read in between. Before synapse has identified anything (sectionAlt < 0) v3's seed carries the memory: saved on sectionEvt,
// restored on identifyEvt with repeat.
function getLooks() {
  const looks = {};
  let any = false;
  for (const sc of SCENES) if (sc.look) { looks[sc.name] = sc.look.get.call(sc); any = true; }
  return any ? looks : null;
}
function setLooks(looks) {
  if (!looks) return;
  for (const sc of SCENES) if (sc.look && looks[sc.name] !== undefined) sc.look.set.call(sc, looks[sc.name]);
}
function memory(S) {
  SC.renumbered = SC.filed = null;
  if (S.sectionRenumber && SC.renumberOn) { // synapse renumbered its sections (§21): the keys, prevAlt and due follow
    const map = S.sectionRenumber, re = (k) => (k >= 0 && k < map.length ? map[k] : k), old = SC.mem;
    let kept = 0, dropped = 0;
    SC.mem = {};
    for (const k in old) { const n = re(+k); if (n >= 0) { SC.mem[n] = old[k]; kept++; } else dropped++; }
    SC.prevAlt = re(SC.prevAlt); SC.due = re(SC.due);
    SC.renumbers++; SC.renumbered = { map, kept, dropped };
  }
  const alt = S.sectionAlt, prev = SC.prevAlt, moved = alt !== prev;
  SC.restored = null;
  if (S.boundaryEvt) {
    if (SC.altOpen && prev >= 0) { SC.mem[prev] = { scene: SC.pend ? SC.pend.id : SC.logical, looks: getLooks() }; SC.filed = { alt: prev, scene: SC.mem[prev].scene }; } // a switch still held for the bar line counts
    SC.altOpen = false;
    SC.due = -1;
  }
  if (S.sectionEvt) { const l = getLooks(); if (l) S.seed.looks = l; }
  if (moved) { SC.altOpen = alt >= 0; SC.prevAlt = alt; }
  const M = SC.altOpen && S.sectionReturn === 1 ? SC.mem[alt] : null;
  if (M && moved) { setLooks(M.looks); SC.restored = { alt, scene: M.scene }; SC.due = alt; }
  else if (alt < 0 && S.identifyEvt && S.repeat) setLooks(S.seed.looks);
  return { M, ret: !!M && SC.due === alt }; // the owed switch stays a trigger until the precedence gates let it through
}

// Soft switches land on the grid (§10 B): with gridTrust > .5 the decision is held until barPos wraps (for the phrase
// trigger: the bar line that opens a 16-beat phrase), capped at 4 / 16 beats; grid trust lost while waiting fires it
// at once. One slot: a later decision replaces the target (a bar hold replacing a phrase hold restarts the 4-beat
// cap). Hard cuts and home parking are immediate and cancel it.
const onLine = (S, phrase) => S.barPos < 0.1 && (!phrase || S.phrase16Pos < 4);
function softSwitch(S, id, why) {
  const phrase = why === 'phrase';
  if (!SC.quantise || S.gridTrust <= 0.5 || onLine(S, phrase)) return land(S, id, 0, why);
  if (SC.pend) { // one slot: the target follows the latest decision; a phrase hold tightened to a bar hold restarts its 4-beat cap
    SC.pend.id = id; SC.pend.why = why;
    if (!phrase && SC.pend.phrase) { SC.pend.phrase = false; SC.pend.beat0 = S.beatCount + S.beatPhase; }
    return;
  }
  SC.pend = { id, why, phrase, beat0: S.beatCount + S.beatPhase, bar: S.barPos };
}
function land(S, id, held, why) {
  const was = SC.logical;
  goScene(id, false, S);
  if (SC.logical !== was) SC.switched = { id, held, why };
}
function pending(S) {
  const P = SC.pend;
  if (!P) return;
  const held = S.beatCount + S.beatPhase - P.beat0, cap = P.phrase ? 16 : 4;
  const wrapped = S.barPos < P.bar - 2 && S.barPos < 0.5 && (!P.phrase || S.phrase16Pos < 4); // a real wrap lands near 0 (a grid re-vote can jump anywhere)
  P.bar = S.barPos;
  if (wrapped || held >= cap || S.gridTrust <= 0.5) { SC.pend = null; land(S, P.id, held, P.why); }
}

export function updateScenes(dt, S) {
  const H = REG[SC.home].scene.rt, inHome = H.home !== false, away = H.awayBeat !== undefined ? H.awayBeat : -99;
  const { M, ret } = memory(S);
  SC.switched = null;
  SC.since += dt;
  if (SC.forced >= 0) {
    SC.pend = null;
    if (SC.logical !== SC.forced) goScene(SC.forced, true, S);
  } else {
    const awayHome = SC.logical !== SC.home;
    if (S.dropEvt) { SC.pend = null; goScene(SC.home, true, S); }
    else if (S.presence < 0.12) {
      SC.pend = null;
      if (awayHome && SC.next < 0) goScene(SC.home, false, S);
    } else if (S.build > 0.55) { // builds park at home, waiting for the drop
      SC.pend = null;
      if (SC.logical !== SC.home) goScene(SC.home, false, S);
    }
    else if ((inHome || S.beatCount - away >= 16) && S.build < 0.4 && S.beatCount - SC.lastBeat >= 8 && SC.next < 0 && SC.since >= SC.dwellMin) { // §95: the event branch waits out the dwell (drops, silence and builds above do not)
      const phrase = S.beat && S.beatCount - SC.lastBeat >= 32 && (S.beatCount - away) % 16 === 0;
      if (S.surpriseEvt) { SC.pend = null; goScene(pickScene(S), true, S); }
      else if (S.identifyEvt || ret || phrase || (H.settledAt && S.beatCount - H.settledAt >= 4)) {
        const why = S.identifyEvt ? 'identify' : ret ? 'return' : phrase ? 'phrase' : 'settled';
        H.settledAt = 0;
        const v3 = S.repeat && S.seed.scene >= 0 && REG[S.seed.scene] ? S.seed.scene : -1;
        const id = M && REG[M.scene] ? M.scene : S.sectionAlt < 0 && v3 >= 0 ? v3 : pickScene(S);
        S.seed.scene = id; // look memory: the one field of MS the director writes (declared in feats.js)
        SC.due = -1;
        softSwitch(S, id, why);
      }
    }
    pending(S);
  }
  if (SC.next >= 0) {
    SC.m += dt / SC.dur;
    if (SC.m >= 1) {
      SC.cur = SC.next;
      SC.next = -1;
      SC.m = 0;
    }
  }
  SC.vmix = ema(SC.vmix, SC.vT, dt, 0.8);
}

// Entry state for draw(): BLEND/DEPTH_TEST/SCISSOR off, target bound, colour NOT cleared, depth cleared to 1.
export function renderScene(id, tgt, w, h) {
  const E = REG[id], gl = G.gl;
  gl.disable(gl.BLEND);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.SCISSOR_TEST);
  if (tgt.d) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, tgt.f);
    gl.depthMask(true);
    gl.clear(gl.DEPTH_BUFFER_BIT);
  }
  const sc = E.scene, arg = { w, h, variant: E.variant ? E.variant.name : SC.variant, vmix: SC.vmix, colour: sc.colour ? sc.colour.cur : null };
  if (!isRouted(sc)) { sc.draw(tgt, arg); return; }
  // v0.4 routes: the HEAD uniforms use() uploads (uBands uBeat uArc uHarm) are direct reads of MS fields the scene declares in
  // feats, so a routed scene's programs get them from its view — swapped into LOOK for this draw only, then restored
  const keep = [LOOK.bands, LOOK.beat, LOOK.arc, LOOK.harm];
  headVecs(view(sc), LOOK);
  sc.draw(tgt, arg);
  [LOOK.bands, LOOK.beat, LOOK.arc, LOOK.harm] = keep;
}

// Scene pass(es) at adaptive resolution (sw, sh) inside the fixed-size targets; returns the source target. During a
// crossfade both scenes are rendered and the current transition draws the blend (io per CONTRACTS §5; the caller
// supplies MS/GROOVE/LOOK/dt and reads io.uvS back: [1,1] means the transition re-rendered the whole (w, h)).
export function drawScenes(sw, sh, io) {
  const RT = G.RT, gl = G.gl;
  renderScene(SC.cur, RT.a, sw, sh);
  if (SC.next < 0) return RT.a;
  renderScene(SC.next, RT.b, sw, sh);
  io.a = RT.a;
  io.b = RT.b;
  io.m = SC.m;
  io.postA = postOf(SC.cur, io.MS); // each scene's resolved post object: a transition reads its own slots there (§5, e.g. morph.flow)
  io.postB = postOf(SC.next, io.MS);
  io.out = RT.m;
  io.w = G.PW;
  io.h = G.PH;
  io.sw = sw;
  io.sh = sh;
  io.uvS = [(sw - 0.5) / G.PW, (sh - 0.5) / G.PH];
  io.FX = FX;
  gl.disable(gl.BLEND);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.SCISSOR_TEST);
  gl.bindFramebuffer(gl.FRAMEBUFFER, RT.m.f);
  gl.viewport(0, 0, sw, sh);
  return trans.run(io) || RT.m;
}

// Visibility of a base scene id on screen (for overlays).
export function visibility(base) {
  const trans = SC.next >= 0;
  return (SC.cur === base ? 1 - (trans ? SC.m : 0) : 0) + (SC.next === base ? SC.m : 0);
}

// The post params of the scene that "owns" the frame (the incoming one past the crossfade midpoint).
export function postParams(S) {
  return postOf(SC.next >= 0 && SC.m > 0.5 ? SC.next : SC.cur, S);
}
// Manual post overrides (v0.4, core/manual.js owns the setters): MANUAL_POST[sceneName] = { bloom: {thr}, fb: {decay}, kaleido,
// exposure: {on}, glitch (§110: the composite's glitch-row gain for that scene, 0..1, like kaleido a number or fn(MS)) } merged
// over the resolved post below. Empty = the scene's own post object, untouched.
export const MANUAL_POST = {};
function postOf(id, S) {
  const sc = REG[id].scene, cv = sc.colour && sc.colour.variants[sc.colour.cur], V = view(sc);
  const p0 = (cv && cv.post) || sc.post; // a colour variant may carry its own post (FEIGEN's bloom thr differs per mapping)
  let p = (typeof p0 === 'function' ? p0(V) : p0) || {}; // a post fn reads the scene's routed view, as update() does (v0.4)
  if (V !== S) p = nested(p, V); // routed: a nested fn(MS) slot (fb.decay) is resolved against the view, not by the effect against MS
  const m = MANUAL_POST[sc.name];
  if (m) { const o = Object.assign({}, p); for (const k in m) o[k] = m[k] && typeof m[k] === 'object' ? Object.assign({}, p[k], m[k]) : m[k]; p = o; }
  return p;
}
function nested(p, V) {
  const o = {};
  for (const k in p) {
    const v = p[k];
    if (typeof v === 'function') o[k] = v(V);
    else if (v && typeof v === 'object') { o[k] = {}; for (const j in v) o[k][j] = typeof v[j] === 'function' ? v[j](V) : v[j]; }
    else o[k] = v;
  }
  return o;
}
