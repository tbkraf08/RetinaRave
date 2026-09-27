// GIELIS (v0.14, id 10, no digit key — `n` cycles to it, or &scene=10) — "the superformula nest that breathes with the
// music". Twelve pitch classes as twelve nested 3D supershapes drawn as latitude rings of strokes: the interval above
// the key sets each family's lobe count, the beat pinches them all toward a star and the silence lets them relax back
// toward a circle. Built on TORUS2's music-to-visual model (id 3, the user's favourite mapping — DECISIONS §36/§37) from
// docs/workers/brief-gielis.md; the numerics are assets/math/gielis.js, the ruler Green's theorem. Forced-only until the
// user approves it: score() is 0, so the director never picks it and the reference md5s of ids 0–9 stay where they are.
//
// This file: the scene object, the camera, and the MS → uniform mapping (TORUS2's index.js:159–177 is the model).
// nest.js: the families, the species, the breath, the lean templates, the waves, the ruler. shaders.js: the GLSL.
import { mkVS, mkFS } from './shaders.js';
import { mkAnchor } from '../../math/keycolour.js';
import { BANDS, SLOTS } from '../../math/waves.js';
import { HELP } from './help.js';
import {
  N, updateNest, resetNest, measureQ, rimR, waveUpload, segsOf,
  RINGS, PHI_MAX, FLOOR, FIBMAX, M_PHI, WAVEW, WAVED, WAVEP, SEGT, N1_REST,
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

const KC = mkAnchor();
const WB = new Float32Array(BANDS * SLOTS);   // wave ages in beats, uploaded every frame
const WA = new Float32Array(BANDS * SLOTS);   // …their amplitudes at launch …
const WH = new Float32Array(BANDS * SLOTS);   // …and the hue each one carries (the note)
const MOOD = new Float32Array(3);
const CAM = [0, CAM_EL, 3.2, FOV];
const CPATH = [0, 0];
const P = { breath: 1, glow: FLOOR };            // the visual parameters in force this frame
const O = { key: 0, tier: 3, pinch: -1, still: 0 };   // the pins and the tier
let QS = 0.6, TIER = 3, ASP = 16 / 9, SPREAD = 0.5, STROKE = 2.6;
let STILL = 0, KEYPIN = null, N1PIN = -1;

// The hue coordinate of pitch class pc, as the shader reads it: the anchor is the MIDDLE of the twelve hues.
const hueOf = (pc) => pc / 12 - 0.5;

// One point projected the way the vertex shader projects it, for the continuity monitor's 2-vector (spec 3): the
// loudest family's rim at θ = 0, in normalised screen coordinates, which moves with the yaw, the size and the pinch.
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
    n1: +N.n1.toFixed(4), pinch: N1PIN, Q: +N.Q.toFixed(4), loudest: N.loudest, m, draw: N.draw, seg: N.segPer, segs: N.segs,
    morph: +N.morph.toFixed(4), template: N.template, key: KC.OUT.key, mode: KC.OUT.mode, hue: +KC.OUT.hue.toFixed(4),
    sat: +KC.OUT.sat.toFixed(3), spread: +SPREAD.toFixed(3), beat: +N.beatNow.toFixed(3), press: +N.press.toFixed(4),
    med: +N.med.toFixed(4), flash: +N.flash.toFixed(4), shim: +N.shim.toFixed(4), turn: +CAM[0].toFixed(4),
    size: +N.fill.toFixed(4), dist: +CAM[2].toFixed(3), tier: TIER, still: STILL,
    live: 0, kick: [], snare: [], hat: [],
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

export default {
  name: 'gielis',
  id: 10,
  tag: 'superformula nest, breathing — twelve pitch classes as twelve supershapes, the lobes from the interval to the key, a pinch on every beat',
  card: { title: 'GIELIS', blurb: 'the superformula: twelve nested shapes, one per note, that close up on every beat and open again in the silence' },
  feats: ['chroma', 'harmAngle', 'key', 'mode', 'keyConf', 'valence', 'beat', 'beatPhase', 'beatCount', 'bpm', 'barPos',
    'phrase16Pos', 'kick', 'snare', 'hat', 'sub', 'bass', 'eS', 'build', 'tension', 'intensity', 'arousal', 'arc',
    'sectionAlt', 'sectionEvt', 'dropEvt', 'dropEnv', 'surpriseEvt', 'riser', 'roll', 'flowBass', 'flowMid', 'flowHigh',
    'presence', 'hush', 'calm', 'alive', 'novelty'],
  cuts: 'continuous',
  rt: {},
  // the continuity monitor's shape (HARNESS "Continuity monitor"): CARD.NAV = CARD.REG[10].scene.state
  state: { n1: N1_REST, Q: 1, cPath: CPATH, pathCut: 9, kick: { x: 0 }, baby: null, mode: 'nest' },
  hooks: { info, green, still, key, pinch },

  // never auto-picked until the user approves it (DECISIONS §15: a registered scene must not move a reference pick)
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

  update(dt, MS) {
    QS += (this.ctx.Q.q - QS) * Math.min(1, dt * 0.5);       // slow, so the tier does not chatter
    TIER = QS < 0.32 ? 0 : QS < 0.62 ? 1 : QS < 0.86 ? 2 : 3;

    // colour: the key as a hue ANCHOR on the circle of fifths, major warm / minor cool by PULL, the keyConf gate and
    // the ~2 s ease are all inside math/keycolour.js — imported, never re-derived (DECISIONS §36 spec 3).
    const mood = (this.ctx.LOOK && this.ctx.LOOK.mood) || { hue: 0, sat: 0.7, bri: 0.8, spread: 0.5 };
    const A = KC.anchor(dt, MS.key, MS.mode, MS.keyConf, MS.valence, MS.harmAngle, mood.hue, KEYPIN);
    MOOD[0] = A.hue;
    MOOD[1] = Math.min(1.2, (0.35 + 0.65 * mood.sat) * A.sat);
    MOOD[2] = 0.5 + 0.7 * mood.bri;
    SPREAD = 0.3 + 0.45 * mood.spread;

    // The six visual parameters, still written inline: step 8 moves each expression VERBATIM into the params slot
    // (CONTRACTS §1.16) and proves the s10 md5s unmoved by the move.
    P.breath = 0.5 + 0.5 * MS.eS;
    P.glow = FLOOR * (1 - GLOWQ * Math.max(MS.hush, MS.calm));
    O.key = A.key;
    O.tier = TIER;
    O.pinch = N1PIN;
    O.still = STILL;
    updateNest(dt, MS, P, O);
    measureQ();

    // the camera. The nest is centred, so the distance is solved from the fill of the SHORT edge: a point at radius r
    // and view depth d lands at ndc_y = focal·r/d and ndc_x = focal·r/(d·aspect), so the short edge binds at
    // d = focal·r/(fill·min(1, aspect)) — portrait included (the phone is 390×844).
    N.fill = Math.min(FILLMAX, FILL0);
    CAM[0] = 0;
    CAM[1] = CAM_EL;
    CAM[2] = (FOV * RAD) / (N.fill * Math.min(1, ASP));
    STROKE = WPX * (1 + 0.6 * MS.bass) * (0.85 + 0.3 * MS.arousal);
    N.phrase = MS.phrase16Pos;                              // the sixteen-beat phrase the turn is measured against
    screenOf(rimR(), 0, 0);
    this.state.n1 = N.n1;
    this.state.Q = N.Q;
    waveUpload(WB, WA, WH);
    this.rt.time = N.beatNow;
    this.rt.label = 'gielis pc' + N.loudest + ' n1 ' + N.n1.toFixed(1);
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
    g.uniform4f(pr.u('uLean'), N.lean[0], N.lean[1], N.lean[2], N.lean[3]);
    g.uniform1f(pr.u('uN1'), N.n1);
    g.uniform1f(pr.u('uMPhi'), M_PHI);
    g.uniform1f(pr.u('uPhiMax'), PHI_MAX);
    g.uniform1f(pr.u('uThOff'), N.phiOff);
    g.uniform3f(pr.u('uPsi3'), N.psi[0], N.psi[1], N.psi[2]);
    g.uniform1f(pr.u('uSlip'), N.slip);
    g.uniform1f(pr.u('uOpen'), N.open);
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
    g.uniform3f(pr.u('uWaveD'), WAVED[0], WAVED[1], WAVED[2]);
    g.uniform3f(pr.u('uWaveP'), WAVEP[0], WAVEP[1], WAVEP[2]);
    // The shells of different families really do occlude each other in R³, so depth + 'over' is the honest picture
    // (DECISIONS §7: additive strokes of opaque width saturate to a white blob at the drop).
    this.ctx.lines.drawN(N.segs, { depth: true, blend: 'over' });
  },

  hud() {
    return 'gielis pc' + N.loudest + ' m ' + N.mA[N.loudest].toFixed(2) + ' n1 ' + N.n1.toFixed(2) + ' Q ' + N.Q.toFixed(3) +
      ' waves 0 key ' + KC.OUT.key + (KC.OUT.mode ? 'm' : 'M') + ' turn ' + CAM[0].toFixed(2) + ' size ' + N.fill.toFixed(2) +
      ' tmpl ' + N.template + ' morph ' + N.morph.toFixed(2) + ' seg ' + N.segPer + '/' + N.segs + ' t' + TIER;
  },

  post: { fb: { decay: 0.85 }, bloom: { thr: 0.3 }, kaleido: 0, morph: { flow: 0.4 } },
  colour: { default: 'v2', variants: { v2: {} } },

  help: HELP,
};
