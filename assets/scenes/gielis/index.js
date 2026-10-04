// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// GIELIS (v0.14, id 10, no digit key — `n` cycles to it, or &scene=10) — "the superformula nest that breathes with the
// music". Twelve pitch classes as twelve nested 3D supershapes drawn as latitude rings of strokes: the interval above
// the key sets each family's lobe count, the beat pinches them all down to a star and the silence lets them relax back
// to their resting lobes (pass 1: the rest state shows the species, it is not a circle). Built on TORUS2's music-to-visual model (id 3, the user's favourite mapping — DECISIONS §36/§37) from
// docs/workers/brief-gielis.md; the numerics are assets/math/gielis.js, the ruler Green's theorem. Forced-only until the
// user approves it: score() is 0, so the director never picks it and the reference md5s of ids 0–9 stay where they are.
// §93 (2026-10-04): on the user's word GIELIS bids — see score().
//
// This file: the scene object, the camera, and the MS → uniform mapping (TORUS2's index.js:159–177 is the model).
// nest.js: the families, the species, the breath, the lean templates, the waves, the ruler. shaders.js: the GLSL.
import { mkVS, mkFS } from './shaders.js';
import { mkAnchor } from '../../math/keycolour.js';
import { mkNudge } from '../../math/nudge.js';
import { BANDS, SLOTS } from '../../math/waves.js';
import { HELP } from './help.js';
import {
  N, updateNest, resetNest, measureQ, witnessR, waveUpload, segsOf, train, live, positions,
  RINGS, PHI_MAX, FLOOR, FIBMAX, N1_PHI, MERID, WAVEW, WAVED, WAVEP, WAVE0, SEGT, N1_REST, press, TWIST, MORPHK, TEMPLATE_NAMES,
} from './nest.js';

const TAU = Math.PI * 2;
// --- the camera and the stroke (spec 5) — named manual settings, never magic numbers in a shader ---
const FOV = 1.95;       // focal length 1/tan(fov/2), fov ≈ 54°
const CAM_EL = 0.55;    // a fixed elevation, radians
const FILL0 = 0.6;      // the resting fill of the short edge (the `size` parameter's resting value; CAM_D 3.2 = FOV/FILL0)
const FILLMAX = 0.85;   // the nest never fills more than this, so nothing crops in portrait
const RAD = 1.0;        // the nest's own radius: SIZE0 + SIZEK at chroma 1
const WPX = 2.6;        // stroke width in px at 720 p at the framing distance
const GLOWQ = 0.4;      // hush / calm dim the brightness floor by this much
const BOUNCE = 0.05;    // the beat's second thump, on the camera distance — 5 % and visible (TORUS2's, the user's number)

const KC = mkAnchor();
const NG = mkNudge();   // the beat nudge, per caller (math/nudge.js): 1/16 of a turn per beat, eased ~0.3 s
const WB = new Float32Array(BANDS * SLOTS);   // wave ages in beats, uploaded every frame
const WA = new Float32Array(BANDS * SLOTS);   // …their amplitudes at launch …
const WH = new Float32Array(BANDS * SLOTS);   // …and the hue each one carries (the note)
const MOOD = new Float32Array(3);
const CAM = [0, CAM_EL, 3.2, FOV];
const CPATH = [0, 0];
const PV = { turn: 0 };                          // the last frame's parameter values, for hooks.info()
const O = { key: 0, tier: 3, pinch: -1, tPin: -1, still: 0, hueOf: null };   // the pins, the tier and the hue map
let QS = 0.6, TIER = 3, ASP = 16 / 9, SPREAD = 0.5, STROKE = 2.6;
let STILL = 0, KEYPIN = null, N1PIN = -1, TPIN = -1, LAST = null;

// The hue coordinate of pitch class pc, as the shader reads it: the anchor is the MIDDLE of the twelve hues.
const hueOf = (pc) => pc / 12 - 0.5;

// One point projected the way the vertex shader projects it, for the continuity monitor's 2-vector (spec 3): the
// witness point (nest.js witnessR) carried round by the yaw, in normalised screen coordinates.
function screenOf(x, y, z) {
  const cy = Math.cos(CAM[0]), sy = Math.sin(CAM[0]), cp = Math.cos(CAM[1]), sp = Math.sin(CAM[1]);
  const e = [CAM[2] * cp * cy, CAM[2] * cp * sy, CAM[2] * sp];
  const fl = Math.hypot(e[0], e[1], e[2]) || 1;
  const f = [-e[0] / fl, -e[1] / fl, -e[2] / fl];
  const rl = Math.hypot(f[1], -f[0]) || 1;
  const r = [f[1] / rl, -f[0] / rl, 0];
  const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
  const q = [x - e[0], y - e[1], z - e[2]];
  const vz = q[0] * f[0] + q[1] * f[1] + q[2] * f[2];
  if (!(vz > 1e-3)) return;
  CPATH[0] = (CAM[3] * (q[0] * r[0] + q[1] * r[1] + q[2] * r[2])) / Math.max(1, ASP) / vz;
  CPATH[1] = (CAM[3] * (q[0] * u[0] + q[1] * u[1] + q[2] * u[2])) / vz;
}

// test hook: the live look numbers, so a shot can be read as numbers as well as pixels
function info() {
  const m = [];
  for (let s = 0; s < FIBMAX; s++) m.push(N.pc[s] + ':' + +N.sMA[s].toFixed(3) + '/q' + N.sQ[s]);
  return JSON.stringify({
    n1: +N.n1.toFixed(4), pinch: N1PIN, Q: +N.Q.toFixed(4), loudest: N.loudest, m, draw: N.draw, seg: N.segPer, segM: N.segM, merid: MERID, segs: N.segs,
    morph: +N.morph.toFixed(4), template: TEMPLATE_NAMES[N.template], tFade: +N.tFade.toFixed(3), lean: [+N.lean[0].toFixed(3), +N.lean[1].toFixed(3), +N.lean[2].toFixed(3), +N.lean[3].toFixed(3)],
    leanL: [+N.leanK[N.loudest * 4].toFixed(3), +N.leanK[N.loudest * 4 + 1].toFixed(3), +N.leanK[N.loudest * 4 + 2].toFixed(3), +N.leanK[N.loudest * 4 + 3].toFixed(3)],
    leans: Array.from({ length: FIBMAX }, (_, s) => N.pc[s] + ':' + +N.sLean[s * 4].toFixed(2) + '/' + +N.sLean[s * 4 + 1].toFixed(2)), open: Array.from(N.sOpen), collapse: +N.collapse.toFixed(4), slip: +N.slip.toFixed(4), twist: +N.twist.toFixed(4), key: KC.OUT.key, mode: KC.OUT.mode, hue: +KC.OUT.hue.toFixed(4),
    sat: +KC.OUT.sat.toFixed(3), spread: +SPREAD.toFixed(3), beat: +N.beatNow.toFixed(3), press: +N.press.toFixed(4),
    med: +N.med.toFixed(4), flash: +N.flash.toFixed(4), shim: +N.shim.toFixed(4), turn: +CAM[0].toFixed(4), turnT: +PV.turn.toFixed(4), bounce: +N.bounce.toFixed(4), wave: +N.wave.toFixed(4), fibF: +N.fibF.toFixed(3),
    size: +N.fill.toFixed(4), dist: +CAM[2].toFixed(3), tier: TIER, still: STILL,
    live: live(N.beatNow), kick: positions(0, N.beatNow), snare: positions(1, N.beatNow), hat: positions(2, N.beatNow),
  });
}
// Green's ruler on the loudest family (nest.js measureQ) — read only, never a pin (CONTRACTS §1.4).
const green = () => ({ Q: +N.Q.toFixed(6), A: +N.A.toFixed(6), L: +N.L.toFixed(6), n1: +N.n1.toFixed(4), m: N.mA[N.loudest] });
// &still=1 / hooks.still(1) — every uniform a later step introduces at its rest value: the no-op gate of every visual commit
const still = (v) => { STILL = v === undefined || v === '' ? 1 : +v; };
// two arguments, so it is reached as CARD.REG[10].scene.hooks.key(k, mode) (CONTRACTS §1.4): pin key / mode inside our
// own update — MS is never written. It moves the colours AND the shapes, because both are read off the same key.
function key(k, m) {
  KEYPIN = k === null || k === undefined || k < 0 ? null : { k: (((k | 0) % 12) + 12) % 12, m: (m | 0) ? 1 : 0 };
  return JSON.stringify(KEYPIN);
}

// &pinch=1.2 — pin n1, the superformula's pinch, so the shape at a chosen roundness can be shot and measured (NAV2's
// hooks.rho is the same instrument). A read of it is hooks.info().n1; -1 releases it.
const pinch = (v) => { N1PIN = v === undefined || v === '' || +v < 0 ? -1 : +v; return N1PIN; };
// &template=2 — pin which of the four lean templates the section would have picked (-1 releases it)
const template = (v) => { TPIN = v === undefined || v === '' || +v < 0 ? -1 : +v | 0; return TPIN; };
// Measurement only (HARNESS "Bench protocol": CARD.bench cannot see the CPU side — the twelve families, the species
// and the 512-sample Green trace). It re-runs the scene's own CPU path n times on the last frame's arguments and
// returns the MEDIAN in ms. The wall clock here is never read by update/draw — nothing on screen depends on it — but
// it DOES advance the nest's state, so the page it is called in is a measurement page, not a picture.
function timeUpdate(n) {
  const k = Math.max(1, Math.round(+n) || 300), t = [];
  if (!LAST) return -1;
  const w0 = performance.now();
  for (let i = 0; i < k; i++) {
    const t0 = performance.now();
    updateNest(1 / 60, LAST.MS, LAST.P, O);
    measureQ();
    t.push(performance.now() - t0);
  }
  const tot = performance.now() - w0;
  t.sort((a, b) => a - b);
  return { med: t[k >> 1], mean: tot / k, tot, n: k };
}

export default {
  name: 'gielis',
  id: 10,
  tag: 'superformula nest, breathing — twelve pitch classes as twelve supershapes, the lobes from the interval to the key, a pinch on every beat',
  card: { title: 'GIELIS', blurb: 'the superformula: twelve nested shapes, one per note, that close up on every beat and open again in the silence' },
  feats: ['chroma', 'harmAngle', 'key', 'mode', 'keyConf', 'valence', 'modeShade', 'beat', 'beatPhase', 'beatCount', 'bpm', 'barPos',
    'phrase16Pos', 'kick', 'snare', 'hat', 'sub', 'bass', 'eS', 'build', 'tension', 'intensity', 'arousal', 'arc',
    'sectionAlt', 'sectionEvt', 'dropEvt', 'dropEnv', 'surpriseEvt', 'riser', 'roll', 'flowBass', 'flowMid', 'flowHigh',
    'presence', 'hush', 'calm', 'alive', 'novelty'],
  cuts: 'continuous',
  rt: {},
  // the continuity monitor's shape (HARNESS "Continuity monitor"): CARD.NAV = CARD.REG[10].scene.state
  state: { n1: N1_REST, Q: 1, cPath: CPATH, pathCut: 9, kick: { x: 0 }, baby: null, mode: 'nest' },
  hooks: { info, green, still, key, pinch, train, template, timeUpdate },

  // GIELIS's territory (§93, 2026-10-04, the user's word): harmonically rich sections where the key is sure — keyConf leads
  // (the ears' tonicConf reads .3–.7 on a right key, so /0.6), clarity second, a little regularity. Never during a build.
  // §93 addendum (2026-10-04, the user: "only rotate through NAV, DUST, TORUS2"): forced-only again. The §93 bid was
  // .2 + .3 clarity + .45 min(1, keyConf/.6) + .1 regularity, 0 in a build.
  score() {
    return 0;
  },

  init(ctx) {
    this.ctx = ctx;
    ctx.onResize((w, h) => { ASP = w / Math.max(1, h); });   // the short edge binds the fill: portrait must not crop
    // path B of the line renderer (§1.12): the vertex shader builds every point, ctx.lines owns the quad and the VAO
    this.pr = ctx.mkProg(mkVS(ctx.lines.VS), mkFS(ctx.lines.FS), 'gielis');
    resetNest();
  },

  update(dt, MS, GROOVE, LOOK, env) {
    QS += (this.ctx.Q.q - QS) * Math.min(1, dt * 0.5);       // slow, so the tier does not chatter
    TIER = QS < 0.32 ? 0 : QS < 0.62 ? 1 : QS < 0.86 ? 2 : 3;

    // colour: the key as a hue ANCHOR on the circle of fifths, major warm / minor cool by PULL, the keyConf gate and
    // the ~2 s ease are all inside math/keycolour.js — imported, never re-derived (DECISIONS §36 spec 3).
    const mood = (this.ctx.LOOK && this.ctx.LOOK.mood) || { hue: 0, sat: 0.7, bri: 0.8, spread: 0.5 };
    const A = KC.anchor(dt, MS.key, MS.mode, MS.keyConf, MS.valence, MS.harmAngle, mood.hue, KEYPIN, MS.modeShade);
    MOOD[0] = A.hue;
    MOOD[1] = Math.min(1.2, (0.35 + 0.65 * mood.sat) * A.sat);
    MOOD[2] = 0.5 + 0.7 * mood.bri;
    SPREAD = 0.3 + 0.45 * mood.spread;

    // The six visual parameters (CONTRACTS §1.16). Every from() below is the expression that was inline here through
    // steps 1-7, moved WHOLE (an expression re-associated is not the same expression — §1.16), reading only fields in
    // `feats`; update() now reads env.params, and the s10 md5s did not move.
    O.key = A.key;
    O.tier = TIER;
    O.pinch = N1PIN;
    O.tPin = TPIN;
    O.still = STILL;
    O.hueOf = hueOf;
    updateNest(dt, MS, env.params, O);
    LAST = { MS, P: env.params };      // what hooks.timeUpdate re-runs
    measureQ();

    // the camera. The nest is centred, so the distance is solved from the fill of the SHORT edge: a point at radius r
    // and view depth d lands at ndc_y = focal·r/d and ndc_x = focal·r/(d·aspect), so the short edge binds at
    // d = focal·r/(fill·min(1, aspect)) — portrait included (the phone is 390×844).
    N.fill = STILL ? FILL0 : Math.min(FILLMAX, env.params.size);
    N.bounce = STILL ? 0 : BOUNCE * press(MS.beatPhase);
    CAM[0] = STILL ? 0 : NG.turn(dt, env.params.turn, Math.max(MS.hush, MS.calm));
    CAM[1] = CAM_EL + TWIST * N.twist;
    CAM[2] = (FOV * RAD) / (N.fill * Math.min(1, ASP)) / (1 + N.bounce);
    STROKE = WPX * (1 + 0.6 * MS.bass) * (0.85 + 0.3 * MS.arousal);
    N.phrase = MS.phrase16Pos;                              // the sixteen-beat phrase the turn is measured against
    screenOf(witnessR(), 0, 0);
    this.state.n1 = N.n1;
    this.state.Q = N.Q;
    waveUpload(WB, WA, WH);
    this.rt.time = N.beatNow;
    this.rt.label = 'gielis pc' + N.loudest + ' n1 ' + N.n1.toFixed(1);
    N.wave = env.params.wave;          // the kick bump's displacement (params.wave)
    PV.turn = env.params.turn;
    this._ready = 1;
  },

  draw(target, { w, h }) {
    const g = this.ctx.gl;
    const pr = this.pr;
    this.ctx.use(pr, target, w, h);
    g.clearColor(0, 0, 0, 1);
    g.clear(g.COLOR_BUFFER_BIT);
    if (!this._ready || !(N.segs > 0)) return;               // a forced scene is drawn once before its first update()
    g.uniform4f(pr.u('uCam'), CAM[0], CAM[1], CAM[2], CAM[3]);
    g.uniform1i(pr.u('uRings'), RINGS);
    g.uniform1i(pr.u('uDraw'), N.draw);
    g.uniform1f(pr.u('uDrawF'), N.fibF);
    g.uniform1iv(pr.u('uOff[0]'), N.off);
    g.uniform1fv(pr.u('uMA[0]'), N.sMA);
    g.uniform1fv(pr.u('uMB[0]'), N.sMB);
    g.uniform1f(pr.u('uMF'), N.mFade);
    g.uniform1fv(pr.u('uQt[0]'), N.sQ);
    g.uniform1fv(pr.u('uPc[0]'), N.pc);
    g.uniform1fv(pr.u('uSz[0]'), N.sSz);
    g.uniform1fv(pr.u('uBr[0]'), N.sBr);
    g.uniform1fv(pr.u('uNorm[0]'), N.sNorm);
    g.uniform4fv(pr.u('uLean[0]'), N.sLean);
    g.uniform1f(pr.u('uN1'), N.n1);
    g.uniform1f(pr.u('uN1Phi'), N1_PHI);
    g.uniform1f(pr.u('uPhiMax'), PHI_MAX);
    g.uniform1fv(pr.u('uSegR[0]'), N.sSeg);
    g.uniform1f(pr.u('uSegM'), N.segM);
    g.uniform1f(pr.u('uMerid'), MERID);
    g.uniform1f(pr.u('uThOff'), STILL ? 0 : N.phiOff);
    g.uniform3f(pr.u('uPsi3'), N.psi[0], N.psi[1], N.psi[2]);
    g.uniform1f(pr.u('uSlip'), N.slip);
    g.uniform1fv(pr.u('uOpen[0]'), N.sOpen);
    g.uniform1f(pr.u('uShim'), N.shim);
    g.uniform1f(pr.u('uFlashK'), N.flash);
    g.uniform1f(pr.u('uMed'), N.med);
    g.uniform1f(pr.u('uGain'), N.gain);
    // width in px is uStroke / v.z, so the near side of a ring is thicker; uStroke is px at unit view depth, set so a
    // stroke at the nest's centre (view depth ≈ uCam.z) is STROKE px at 720 p.
    g.uniform1f(pr.u('uStroke'), STROKE * Math.max(0.6, h / 720) * CAM[2]);
    g.uniform3f(pr.u('uMood'), MOOD[0], MOOD[1], MOOD[2]);
    g.uniform1f(pr.u('uSpread'), SPREAD);
    g.uniform1fv(pr.u('uWaveB[0]'), WB);
    g.uniform1fv(pr.u('uWaveA[0]'), WA);
    g.uniform1fv(pr.u('uWaveH[0]'), WH);
    g.uniform3f(pr.u('uWaveW'), WAVEW[0], WAVEW[1], WAVEW[2]);
    g.uniform3f(pr.u('uWaveD'), N.wave, WAVED[1], WAVED[2]);
    g.uniform3f(pr.u('uWaveP'), WAVEP[0], WAVEP[1], WAVEP[2]);
    // The shells of different families really do occlude each other in R³, so depth + 'over' is the honest picture
    // (DECISIONS §7: additive strokes of opaque width saturate to a white blob at the drop).
    this.ctx.lines.drawN(N.segs, { depth: true, blend: 'over' });
  },

  hud() {
    return 'gielis pc' + N.loudest + ' m ' + N.mA[N.loudest].toFixed(2) + ' n1 ' + N.n1.toFixed(2) + ' Q ' + N.Q.toFixed(3) +
      ' waves ' + live(N.beatNow) + ' key ' + KC.OUT.key + (KC.OUT.mode ? 'm' : 'M') + ' turn ' + CAM[0].toFixed(2) + ' size ' + N.fill.toFixed(2) +
      ' tmpl ' + TEMPLATE_NAMES[N.template] + ' morph ' + N.morph.toFixed(2) + ' seg ' + N.segPer + '+' + MERID + 'x' + N.segM + '/' + N.segs + ' t' + TIER;
  },

  // The six, named for what the eye sees (CONTRACTS §1.16). `wave` reaches the shader through nest.js's WAVED[0].
  params: {
    breath: { eli5: 'how deep every shape pinches on the beat', range: [0, 1], from: (MS) => 0.5 + 0.5 * MS.eS },
    wave: { eli5: 'how deep the bump a kick sends travelling round every ring', range: [0, 0.4], from: (MS) => WAVE0 + 0.1 * MS.kick },
    turn: { eli5: 'where the whole nest has been nudged to, in the turn it makes every sixteen beats', range: [0, 6.2832], from: (MS) => ((MS.beatCount / 16) * TAU) % TAU },
    size: { eli5: 'how much of the screen the nest fills', range: [0.4, 0.9], from: (MS) => 0.58 + 0.1 * MS.intensity + 0.07 * MS.arousal + 0.15 * Math.min(1, Math.max(0, 2 * MS.build - 1)) },
    lean: { eli5: 'how far the lobes are pulled toward the section\'s template', range: [0, 1], from: (MS) => MORPHK * MS.tension * (MS.arc === 'idle' ? 0 : 1) },
    glow: { eli5: 'how brightly the inner shapes are kept lit', range: [0, 0.5], from: (MS) => FLOOR * (1 - GLOWQ * Math.max(MS.hush, MS.calm)) },
  },

  post: { fb: { decay: 0.85 }, bloom: { thr: 0.3 }, kaleido: 0, morph: { flow: 0.4 } },
  colour: { default: 'v2', variants: { v2: {} } },

  help: HELP,
};
