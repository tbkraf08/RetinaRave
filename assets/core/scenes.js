// SC: scene registry, director (pickScene / precedence), crossfade (mixs), variants, forced/sticky.
// Knows nothing about any specific scene: everything it reads from a scene is a contract slot (docs/CONTRACTS.md).
// Lifted from cardioid3 "SCENES" (goScene / pickScene / updateScenes) + the mixs pass. v0.2 §10: look memory keyed on
// synapse's sectionAlt, soft switches held to the bar line (DECISIONS §10).
import { clamp, ema, frac } from '../math/util.js';
import { G, mkProg, use, tex, tri } from './gl.js';
import { FX } from './post.js';

export const SC = {
  cur: 0, next: -1, m: 0, dur: 2,   // base ids of the two rendered scenes and the crossfade position
  logical: 0,                        // the logical id (a variant has its own id but renders its parent's base)
  variant: null, vT: 0, vmix: 0,     // active variant name, its target (0/1) and the eased mix scenes read
  lastBeat: -99, hist: [0], forced: -1, home: 0,
  mem: {}, prevAlt: -1, altOpen: false, due: -1, // look memory keyed on sectionAlt (§10 A): mem[alt] = {scene, looks}; due = a return whose scene is still owed
  quantise: true, pend: null,            // grid-held soft switch (§10 B): the one pending {id, why, beat0, ...}
  restored: null, switched: null,        // this frame's director records (the harness logs them)
};

// REG[id] = { id, base, scene, variant }  (variant = null for a scene's own id)
export const REG = [];
export const SCENES = [];

export function register(scene) {
  const id = scene.id;
  if (REG[id]) throw new Error('scene id ' + id + ' taken by ' + REG[id].scene.name);
  scene.rt = scene.rt || {};
  REG[id] = { id, base: id, scene, variant: null };
  SCENES.push(scene);
  if (scene.home) SC.home = id;
  for (const v of scene.variants || []) {
    if (REG[v.id]) throw new Error('variant id ' + v.id + ' taken');
    REG[v.id] = { id: v.id, base: id, scene, variant: v };
  }
}

let mixs = null;
const MIXS = `
uniform sampler2D uA,uB;uniform float uM;uniform vec2 uUvS;
vec3 smp(sampler2D s,vec2 uv){return texture(s,clamp(uv,vec2(0.),vec2(1.))*uUvS).rgb;}
void main(){vec2 c=vUv-.5;c.x*=uRes.x/uRes.y;float m=uM*uM*(3.-2.*uM);
  vec2 a=rot(m*.7)*c*(1.-.45*m),b=rot(-(1.-m)*.7)*c*(1.+.8*(1.-m));a.x/=uRes.x/uRes.y;b.x/=uRes.x/uRes.y;
  vec3 A=smp(uA,a+.5),B=smp(uB,b+.5);float la=dot(A,vec3(.33)),lb=dot(B,vec3(.33));
  float k=smoothstep(-.25,.25,(m*1.5-.25)+(lb-la)*.6-(1.-m)*length(c)*.3+m*.0);o=vec4(mix(A,B,clamp(k*step(.001,m),0.,1.)),1.);}`;
export function initScenes() {
  mixs = mkProg(MIXS, 'mixs');
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
    const sc = E.variant ? E.variant.score(S, E.scene.rt, SC) : E.scene.score(S, E.scene.rt, SC);
    if (!(sc > 0)) continue;
    let v = sc + 0.25 * frac(Math.sin((S.sectionId + 1) * (E.id + 1) * 12.9898) * 43758.5);
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
  const alt = S.sectionAlt, prev = SC.prevAlt, moved = alt !== prev;
  SC.restored = null;
  if (S.boundaryEvt) {
    if (SC.altOpen && prev >= 0) SC.mem[prev] = { scene: SC.pend ? SC.pend.id : SC.logical, looks: getLooks() }; // a switch still held for the bar line counts
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
    else if ((inHome || S.beatCount - away >= 16) && S.build < 0.4 && S.beatCount - SC.lastBeat >= 8 && SC.next < 0) {
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
  E.scene.draw(tgt, { w, h, variant: E.variant ? E.variant.name : SC.variant, vmix: SC.vmix });
}

// Scene pass(es) at adaptive resolution (sw, sh) inside the fixed-size targets; returns the source target.
export function drawScenes(sw, sh) {
  const RT = G.RT, trans = SC.next >= 0;
  renderScene(SC.cur, RT.a, sw, sh);
  if (!trans) return RT.a;
  renderScene(SC.next, RT.b, sw, sh);
  use(mixs, RT.m, sw, sh);
  tex(mixs, 'uA', 0, RT.a);
  tex(mixs, 'uB', 1, RT.b);
  G.gl.uniform1f(mixs.u('uM'), SC.m);
  G.gl.uniform2f(mixs.u('uUvS'), (sw - 0.5) / G.PW, (sh - 0.5) / G.PH);
  tri();
  return RT.m;
}

// Visibility of a base scene id on screen (for overlays).
export function visibility(base) {
  const trans = SC.next >= 0;
  return (SC.cur === base ? 1 - (trans ? SC.m : 0) : 0) + (SC.next === base ? SC.m : 0);
}

// The post params of the scene that "owns" the frame (the incoming one past the crossfade midpoint).
export function postParams(S) {
  const sid = SC.next >= 0 && SC.m > 0.5 ? SC.next : SC.cur;
  const p = REG[sid].scene.post;
  return (typeof p === 'function' ? p(S) : p) || {};
}
