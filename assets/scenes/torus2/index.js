// TORUS2 (v0.7) — the Hopf torus that is alive with the music. A from-scratch successor to TORUS (id 3) that keeps the
// Hopf fibration geometry (math/hopf.js, DECISIONS §4) and answers the user's five points of 2026-09-24
// (docs/workers/brief-torus2.md). Promoted to id 3 on 2026-09-24 ("torus2 looks good, promote it" — DECISIONS §37): it carries
// TORUS's bid; TORUS v1 lives on as id 7 (torus-v1, forced-only) for one release.
// Step 1 of the brief's Process: the inside lights up — a brightness floor, a fog floor, a kick flash on the quiet
// inner families, a hat shimmer along every fibre.
import { fibre, torusRadii } from '../../math/hopf.js';
import { mkVS, mkFS } from './shaders.js';
import { BANDS, SLOTS, fill as wfill, live as wlive, positions as wpos, step as wstep, train } from './waves.js';
import { COUNT as ATN, EXT as ATEXT, H as ATH, NAMES as ATNAMES } from './attractors.js';
import { anchor } from './colour.js';
import { HELP } from './help.js';
import { BOUNCE, dist, reframe, turn as turnEase } from './motion.js';

const TAU = Math.PI * 2;
const TH0 = 0.12;
const THS = Math.PI / 2 - TH0;
// rotation numbers p/q of the bulbs, indexed by MS.interval (semitones) — the same table NAV uses for its bulbs
const PQ = [[0, 1], [1, 15], [1, 8], [1, 5], [1, 4], [1, 3], [2, 5], [1, 2], [3, 5], [2, 3], [4, 5], [7, 8]];
// Segments per ring per tier. A Villarceau circle under stereographic projection is a round circle, so 48 chords
// already read as smooth; the whole tier budget lives here and never in the number of rings (cuts: 'continuous').
const SEGT = [48, 72, 108, 160];
const FIBN = 12;      // longitude slots per pitch-class family — the grid, fixed, never tier-dependent
// spec 4c, growth stage 1: how many of those slots are actually drawn. The tier never touches this (cuts:
// 'continuous' — a tier flip may only change segments per ring); the build and arousal do, eased over ~0.75 s so a
// ring that appears fades in instead of popping.
const FIBMIN = 6;
const FIBMAX = FIBN;
const FIBTC = 0.25;
const FOV = 1.95;     // focal length 1/tan(fov/2), fov ~54 deg
const MORPHTC = 1.0;  // spec 5: the morph eases over ~1 s, and an attractor change cross-fades over the same
const MORPHK = 0.9;   // how much of the tension reaches the morph
const BREATH = 0.03;  // spec 6: the tube breathes +-3 % over the bar, even in silence
const TWIST = 0.6;    // spec 6: a surprise twists the SU(2) tumble target, inside the |alpha| <= 0.18 bound
const TWISTTC = 0.35; // and eases back over ~1 s (three time constants)
const PSIK = 0.25;    // spec 6: how fast flowBass/Mid/High drive the three family bands' Hopf flows
const UNWIND = 2.5;   // spec 6: radians of phase slip across one ring at riser 1 — the rings open into helices
// --- the manual settings of the look (a named constant near the top, not a magic number in a shader) ---
const GLOW = 0.18;    // spec 1a: no fibre below this fraction of the loudest family's brightness
const GLOWQ = 0.4;    // spec 6: hush / calm dim the floor by this much
const FLASHT = 0.25;  // spec 1c: the kick flash decays over this many seconds
const SHIM = 0.55;    // spec 1d: shimmer depth at hat 1
const WPX = 2.6;      // stroke width in px at 720 p at the framing distance
// spec 2, per band (kick · snare · hat): the bump's width along the ring parameter, and what it does —
// the kick displaces (a fraction of the fibre's own radius), the snare brightens (×2.5 = 1 + 1.5), the hat ripples.
// the brief's widths 0.12 / 0.04 / 0.02 are the bumps' full widths; the shader's gaussian takes the sigma, ~0.4x
const WAVEW = [0.05, 0.017, 0.008];
// The brief's lean was 6 % of the tube radius; at the nest's framing that is a ~5 px kink nobody can see in a
// 144-ring picture (tools/work/t2-zoom4x4.jpg at 0.06 / 0.08 / 0.14 are indistinguishable). 26 % reads. Retune here.
const WAVE0 = 0.26;   // the kick bump displaces the stroke by this fraction of the fibre's own radius at amplitude 1
const WAVED = [WAVE0, 0.008, 0.01];   // displacement per band — the kick's big slow bump, the hat's tiny ripple
const WAVEP = [1.1, 1.8, 0.5];         // brightness per band — the snare is the sharp bright one (x2.8)

let SEG = 108;        // segments per ring
let KSEG = 640;       // segments on the knot strand (it winds p+q times, so it needs more)

const th = new Float32Array(12);
const ch = new Float32Array(12);
const U = { twist: 0, slip: 0, morph: 0, morphT: 0, turn: 0, turnT: 0, bounce: 0, size: 0.6, fibF: FIBMIN, psi0: 0, alpha: 0, delta: 0, subP: 0, collapse: 0, gain: 0, knotT: 0, knotTh: 1, knotBri: 1, wpx: 2.6, flash: 0, shim: 0, glow: GLOW, briMax: 1, draw: FIBN, beatNow: 0, wave: WAVE0, key: 0, mode: 0, fifth: 0, hue: 0, sat: 1, phrase: 0 };
const MOOD = new Float32Array(3);
const PSI = new Float32Array(3);
const WB = new Float32Array(BANDS * SLOTS);   // wave ages in beats, uploaded every frame
const WA = new Float32Array(BANDS * SLOTS);   // wave amplitudes at launch
let SPREAD = 0.5;
let QS = 0.6;
let CAM = [0, 0.3, 5.2, 1.95];
const CEN = [0, 0, 0, 2.4];
let pq = PQ[0];
let loudest = 0;
let keyPin = null;    // hooks.key(k, mode): pin the key inside update(), never touching MS
let ASP = 16 / 9;
let fibPin = -1;
let morphPin = null;  // hooks.morph(m, which)
let att = 0, attPrev = 0, attFade = 0, attSel = -2;
let pqOff = 0;        // spec 6: sectionEvt rotates the knot table
let unwindPin = -1;   // hooks.unwind(v)      // hooks.fib: pin the drawn slot count so a proof shot can show one thread per family

// CPU reference: a few points of one fibre straight out of assets/math/hopf.js, for comparing against the GPU port.
function probe(k) {
  const i = Math.max(0, Math.min(11, k | 0));
  const phi = i * TAU / 12;
  const out = [];
  for (let j = 0; j < 4; j++) out.push(fibre(th[i], phi, j / 4 * TAU, U.psi0, U.alpha, U.delta).map((x) => +x.toFixed(6)));
  return JSON.stringify({ theta: +th[i].toFixed(6), phi: +phi.toFixed(6), psi0: +U.psi0.toFixed(6), alpha: +U.alpha.toFixed(6), delta: +U.delta.toFixed(6), pts: out });
}

// test hook: pin the riser that unwinds the rings into helices
function unwind(v) {
  unwindPin = v === null || v === undefined || v < 0 ? -1 : Math.min(1, +v);
  return unwindPin;
}

// test hook: pin the morph and which attractor, so the four-shot montage is a controlled comparison
function morph(m, which) {
  morphPin = m === null || m === undefined || m < 0 ? null : { m: Math.min(1, +m), w: ((which | 0) % ATN + ATN) % ATN };
  if (morphPin) { att = morphPin.w; attPrev = morphPin.w; attFade = 0; }
  return JSON.stringify(morphPin);
}

// test hook: the motion numbers of spec 4, read frame by frame across a bar
function motion() {
  return JSON.stringify({ turn: +U.turn.toFixed(4), turnT: +U.turnT.toFixed(4), bounce: +U.bounce.toFixed(4), size: +U.size.toFixed(4), fib: +U.fibF.toFixed(3), cam: +CAM[2].toFixed(3) });
}

// test hook: pin key / mode (keyConf 1) inside our own update — MS is never written (CONTRACTS: scenes read MS)
function key(k, m) {
  keyPin = k === null || k === undefined || k < 0 ? null : { k: ((k | 0) % 12 + 12) % 12, m: (m | 0) ? 1 : 0 };
  return JSON.stringify(keyPin);
}

// test hook: pin how many fibres per family are drawn (-1 = whatever the music asks for)
function fib(v) {
  fibPin = v > 0 ? Math.min(FIBN, v | 0) : -1;
  return fibPin;
}

// test hook: the live look numbers, so a shot can be read as numbers as well as pixels
function info() {
  return JSON.stringify({ glow: +U.glow.toFixed(4), briMax: +U.briMax.toFixed(4), flash: +U.flash.toFixed(4), shim: +U.shim.toFixed(4), loudest, draw: U.draw, seg: SEG, morph: +U.morph.toFixed(4), slip: +U.slip.toFixed(3), twist: +U.twist.toFixed(3), pqOff, att: ATNAMES[att], fade: +attFade.toFixed(3), key: U.key, mode: U.mode, fifthKey: U.fifth, hue: +U.hue.toFixed(4), sat: +U.sat.toFixed(3), beat: +U.beatNow.toFixed(3), live: wlive(U.beatNow), kick: wpos(0, U.beatNow), snare: wpos(1, U.beatNow), hat: wpos(2, U.beatNow) });
}

export default {
  name: 'torus2',
  id: 3,
  tag: 'hopf fibration, alive — waves on the fibres, key as hue anchor, a nudge per beat, attractors mixed in',
  card: { title: 'TORUS', blurb: 'the Hopf fibration: circles on the 3-sphere, projected down to where we can see them, waving with the music' }, // landing tile (CONTRACTS §1.17, v0.8.1); the picture is site/thumbs/torus2.jpg from tools/thumbs.sh
  feats: ['chroma', 'harmAngle', 'interval', 'harmUnw', 'beatPhase', 'beatCount', 'bass', 'sub', 'tension', 'dropEvt', 'dropEnv', 'bpm', 'presence', 'flow', 'flowBass', 'flowMid', 'flowHigh', 'barPos', 'surpriseEvt', 'sectionEvt', 'roll', 'riser', 'intensity', 'arc', 'sectionAlt', 'build', 'arousal', 'phrase16Pos', 'key', 'mode', 'keyConf', 'valence', 'kick', 'snare', 'hat', 'beat', 'alive', 'novelty', 'hush', 'calm', 'clarity', 'regularity'],
  cuts: 'continuous',
  rt: {},
  hooks: { probe, info, train, fib, key, motion, morph, unwind },

  // TORUS's bid, verbatim (§4 / §37): never during a build, else clarity and a steady rhythm
  score(MS) {
    return MS.arc === 'build' ? 0 : 0.25 + 0.45 * MS.clarity + 0.3 * MS.regularity;
  },

  init(ctx) {
    this.ctx = ctx;
    ctx.onResize((w, h) => { ASP = w / Math.max(1, h); });   // the short edge binds the fill: portrait must not crop
    // path B of the line renderer (§1.12): the vertex shader builds every point, ctx.lines owns the quad and the VAO
    this.pr = ctx.mkProg(mkVS(ctx.lines.VS), mkFS(ctx.lines.FS), 'torus2');
    for (let k = 0; k < 12; k++) {
      th[k] = TH0 + 0.35 * THS;
      ch[k] = 0.35;
    }
  },

  update(dt, MS, GROOVE, LOOK, env) {
    const P = env.params;     // §1.16: exactly from(view) while nothing is routed — the six below moved verbatim
    QS += (this.ctx.Q.q - QS) * Math.min(1, dt * 0.5);   // slow, so the tier does not chatter
    const tier = QS < 0.32 ? 0 : QS < 0.62 ? 1 : QS < 0.86 ? 2 : 3;
    SEG = SEGT[tier];


    // the chroma vector IS the torus family: latitude and brightness of each pitch class. When it carries no energy
    // (silence, and the #test fake timeline, which leaves chroma zeroed) the latitudes come from the harmony the
    // extractor does report: pitch class k sits at 2pi(7k mod 12)/12 on the circle of fifths and is weighted by how
    // close it is to harmAngle. w blends the two continuously, so nothing ever jumps (DECISIONS §4).
    const C = MS.chroma;
    let sum = 0, mxc = 0;
    for (let k = 0; k < 12; k++) {
      const c = Math.max(0, C[k] || 0);
      sum += c;
      if (c > mxc) mxc = c;
    }
    const w = Math.min(1, 2 * sum);
    const nrm = 1 / Math.max(0.2, mxc);
    let mx = -1;
    for (let k = 0; k < 12; k++) {
      const fifth = ((7 * k) % 12) / 12 * TAU;
      const imp = Math.pow(0.5 + 0.5 * Math.cos(MS.harmAngle - fifth), 2);
      const c = Math.min(1, w * Math.max(0, C[k] || 0) * nrm + (1 - w) * imp);
      ch[k] = c;
      th[k] = TH0 + c * THS;
      if (c > mx) { mx = c; loudest = k; }
    }
    U.briMax = 0.05 + 1.35 * mx * mx;                 // the loudest family's brightness: what the floor is a fraction of

    // drop: collapse to the core circle over about one beat, then bloom back
    if (MS.dropEvt) U.collapse = 1;
    U.collapse *= Math.exp(-dt * Math.max(40, MS.bpm || 120) / 60);
    if (U.collapse < 1e-4) U.collapse = 0;

    // spec 2: musical time drives the waves — beatNow never drifts, so a bump launched on a beat stays on its grid
    U.beatNow = MS.beatCount + MS.beatPhase;
    wstep([MS.kick, MS.snare, MS.hat], U.beatNow, MS.beat);
    wfill(WB, WA, U.beatNow);
    U.wave = P.wave;                                  // the kick bump's displacement (params.wave)

    // one full turn of the Hopf flow per 8 beats, plus a per-band rate: the low (pitch classes 0-3), mid (4-7) and
    // high (8-11) families advance along their rings at flowBass / flowMid / flowHigh instead of one shared flow.
    const psiB = TAU * ((U.beatNow / 8) % 1);
    PSI[0] = (psiB + PSIK * MS.flowBass) % TAU;
    PSI[1] = (psiB + PSIK * MS.flowMid) % TAU;
    PSI[2] = (psiB + PSIK * MS.flowHigh) % TAU;
    U.psi0 = PSI[(loudest / 4) | 0];
    // The tumble lives in SU(2), not in the camera, and its amplitude is bounded: rotSU2 by alpha moves the base
    // sphere's south pole (the point stereographic projection sends to infinity) to colatitude pi - 2 alpha, and the
    // moment that crosses a family's latitude that whole torus blows up off screen. |alpha| <= 0.18, |delta| <= 0.6.
    if (MS.surpriseEvt) U.twist = 1;                  // spec 6: a surprise twists the tumble target and eases back
    U.twist *= Math.exp(-dt / TWISTTC);
    U.alpha = 0.18 * Math.max(-1, Math.min(1, Math.sin(GROOVE.rot) + TWIST * U.twist));
    U.delta = 0.6 * MS.tension;                       // roughness pinches the picture toward the pole
    // the sub bass fattens the tubes (bass now sets the stroke width), and the bar breathes them +-3 % in silence
    U.subP = 0.25 * MS.sub + BREATH * Math.sin(TAU * MS.barPos / 4);
    U.knotT = (0.5 * MS.harmUnw) % TAU;               // the melody traces the knot (p, q integral: mod TAU is exact)
    // spec 6: a section event re-picks the knot — the same interval table, rotated by the section (deterministic)
    if (MS.sectionEvt) pqOff = Math.max(0, MS.sectionAlt | 0);
    pq = PQ[((Math.max(0, Math.min(11, MS.interval | 0)) + pqOff) % 12 + 12) % 12];
    U.knotTh = Math.min((th[loudest] * (1 - U.collapse) + 0.05 * U.collapse) * (1 + U.subP), 1.55);
    U.knotBri = 1.5 * (0.4 + 0.6 * MS.intensity);

    // spec 1c: the kick lights the core. Our own follower on MS.kick (which itself decays over 0.16 s), so the flash
    // lasts about FLASHT seconds; the shader weights it by (1 - chroma) so the quiet inner families get it.
    U.flash = Math.max(U.flash * Math.exp(-dt / FLASHT), MS.kick);
    // spec 1d / 6: the hat shimmer, gated by alive (nothing in silence) and lifted by novelty
    U.shim = SHIM * MS.hat * (0.3 + 0.7 * MS.alive) * (0.5 + 0.5 * MS.novelty);
    // spec 6: hush and calm dim the floor
    U.glow = P.glow;

    KSEG = Math.min(1600, SEG * Math.max(2, pq[0] + pq[1]));
    const p = MS.presence;
    U.gain = Math.min(1, (0.3 + 0.7 * p) * (1 + 0.6 * MS.dropEnv));
    U.wpx = WPX * (1 + 0.6 * MS.bass) * (0.85 + 0.3 * MS.arousal);   // spec 6: arousal sets the resting width
    // spec 6: the build unwinds the rings toward helices, and the drop's collapse snaps the slip back to zero
    U.slip = UNWIND * (unwindPin >= 0 ? unwindPin : Math.max(MS.riser, MS.roll)) * (1 - U.collapse);

    const m = (LOOK && LOOK.mood) || { hue: 0, sat: 0.7, bri: 0.8, spread: 0.5 };
    const A = anchor(dt, MS.key, MS.mode, MS.keyConf, MS.valence, MS.harmAngle, m.hue, keyPin);
    MOOD[0] = A.hue;
    MOOD[1] = Math.min(1.2, (0.35 + 0.65 * m.sat) * A.sat);
    MOOD[2] = 0.5 + 0.7 * m.bri;
    // TORUS spread the twelve families over 0.55..1.25 of a turn — nearly the whole wheel, so the anchor only chose
    // which family got which hue and no mode could read as warm or cool. Narrowed, and centred on the anchor, the
    // twelve hues sit in one half of the wheel and the mode's half is the one you see.
    SPREAD = 0.3 + 0.45 * m.spread;
    U.key = A.key;
    U.mode = A.mode;
    U.fifth = A.fifth;
    U.hue = A.hue;
    U.sat = A.sat;

    // spec 5: which attractor, and how much of it. sectionAlt picks (each section its own shape, a returning section
    // returns to it; -1 before synapse has identified anything). A change cross-fades over ~1 s, never jumps.
    const sel = morphPin ? morphPin.w : MS.sectionAlt < 0 ? 0 : MS.sectionAlt % ATN;
    if (sel !== attSel) { if (attSel !== -2) { attPrev = att; attFade = 1; } attSel = sel; att = sel; }
    attFade = Math.max(0, attFade - dt / MORPHTC);
    // rough, tense music pulls the torus out of shape; the intro is left alone. The arc enum has no 'intro' value
    // (feats.js: idle | valley | sustain | build | peak) — 'idle' is the one that means nothing has started.
    U.morphT = morphPin ? morphPin.m : P.morph;   // MORPHK * tension * (arc is the intro ? 0 : 1)
    U.morph += (U.morphT - U.morph) * (1 - Math.exp(-dt / MORPHTC));
    if (morphPin) U.morph = morphPin.m;

    // spec 4c: growth. Stage 1 (build 0 -> 0.5) raises the fibre count per family, stage 2 (0.5 -> 1) brings the
    // camera in; intensity and arousal set the resting size between builds.
    const gB = Math.min(1, 2 * MS.build);
    U.fibF += (FIBMIN + (FIBMAX - FIBMIN) * Math.min(1, gB + 0.3 * MS.arousal) - U.fibF) * (1 - Math.exp(-dt / FIBTC));
    U.draw = fibPin > 0 ? fibPin : Math.max(1, Math.ceil(U.fibF - 1e-6));
    U.size = P.size;
    // spec 4a: the nudge. The target is read off the beat COUNT, so it can never drift; the angle springs to it with
    // a ~0.3 s time constant (hush / calm double it). Sixteen nudges make one turn — phrase16Pos is the cross-check.
    U.turnT = P.turn;
    U.turn = turnEase(dt, U.turnT, Math.max(MS.hush, MS.calm));
    U.phrase = MS.phrase16Pos;
    // spec 4b: the bounce, 5 % and visible — a thump, not a sine
    U.bounce = P.bounce;

    reframe(dt, th, ch, U.psi0, U.alpha, U.delta, CEN);
    const f = MS.flow;
    CAM = [U.turn, 0.46 + 0.16 * Math.sin(0.043 * f), dist(CEN[3], FOV, U.size, ASP, 1 + U.bounce), FOV];
    this.rt.time = f;
    this.rt.label = 'hopf ' + pq[0] + '/' + pq[1];
  },

  draw(target, { w, h }) {
    const g = this.ctx.gl;
    const pr = this.pr;
    this.ctx.use(pr, target, w, h);
    g.clearColor(0, 0, 0, 1);
    g.clear(g.COLOR_BUFFER_BIT);
    g.uniform4f(pr.u('uCam'), CAM[0], CAM[1], CAM[2], CAM[3]);
    g.uniform4f(pr.u('uCen'), CEN[0], CEN[1], CEN[2], CEN[3]);
    g.uniform1f(pr.u('uPsi0'), U.psi0);
    g.uniform3f(pr.u('uPsi3'), PSI[0], PSI[1], PSI[2]);
    g.uniform1f(pr.u('uSlip'), U.slip);
    g.uniform1f(pr.u('uAlpha'), U.alpha);
    g.uniform1f(pr.u('uDelta'), U.delta);
    g.uniform1f(pr.u('uSubP'), U.subP);
    g.uniform1f(pr.u('uCollapse'), U.collapse);
    g.uniform3f(pr.u('uMood'), MOOD[0], MOOD[1], MOOD[2]);
    g.uniform1f(pr.u('uSpread'), SPREAD);
    g.uniform1f(pr.u('uGain'), U.gain);
    // width in px is uSize / v.z, so the near side of a ring is thicker; uSize is px-at-unit-depth, set so that a
    // stroke at the centroid (view depth ~ uCam.z) is U.wpx px at 720 p.
    g.uniform1f(pr.u('uSize'), U.wpx * Math.max(0.6, h / 720) * CAM[2]);
    g.uniform1i(pr.u('uSeg'), SEG);
    g.uniform1i(pr.u('uFib'), FIBN);
    g.uniform1i(pr.u('uDraw'), U.draw);
    g.uniform1f(pr.u('uFibF'), fibPin > 0 ? fibPin : U.fibF);
    g.uniform1i(pr.u('uKnotN'), KSEG);
    g.uniform2f(pr.u('uKnotPQ'), pq[0], pq[1]);
    g.uniform1f(pr.u('uKnotT'), U.knotT);
    g.uniform1f(pr.u('uKnotTh'), U.knotTh);
    g.uniform2f(pr.u('uKnotBH'), U.knotBri, loudest / 12 - 0.5 + 0.09);
    g.uniform2f(pr.u('uGlowM'), U.glow, U.briMax);
    g.uniform1f(pr.u('uFlashK'), U.flash);
    g.uniform1f(pr.u('uShim'), U.shim);
    g.uniform1fv(pr.u('uWaveB[0]'), WB);
    g.uniform1fv(pr.u('uWaveA[0]'), WA);
    g.uniform3f(pr.u('uWaveW'), WAVEW[0], WAVEW[1], WAVEW[2]);
    g.uniform3f(pr.u('uWaveD'), U.wave, WAVED[1], WAVED[2]);
    g.uniform3f(pr.u('uWaveP'), WAVEP[0], WAVEP[1], WAVEP[2]);
    g.uniform1f(pr.u('uLoud'), loudest);
    g.uniform2f(pr.u('uMorphF'), U.morph, attFade);
    g.uniform3f(pr.u('uAttA'), att, ATEXT[att], ATH[att]);
    g.uniform3f(pr.u('uAttB'), attPrev, ATEXT[attPrev], ATH[attPrev]);
    g.uniform1fv(pr.u('uTheta[0]'), th);
    g.uniform1fv(pr.u('uChroma[0]'), ch);
    // The fibres of different tori really do occlude each other in R3, so depth + 'over' is the honest picture
    // (DECISIONS §7: additive strokes of opaque width saturate to a white blob at the drop).
    this.ctx.lines.drawN(12 * U.draw * SEG + KSEG, { depth: true, blend: 'over' });
  },

  hud() {
    const { R, r } = torusRadii(th[loudest]);
    return 'torus2 pc' + loudest + ' R=' + R.toFixed(2) + ' r=' + r.toFixed(2) + ' knot ' + pq[0] + ',' + pq[1] + ' fib ' + (12 * U.draw) + ' seg ' + SEG + ' glow ' + U.glow.toFixed(2) + ' waves ' + wlive(U.beatNow) + ' key ' + U.key + (U.mode ? 'm' : 'M') + ' turn ' + U.turn.toFixed(2) + ' size ' + U.size.toFixed(2) + ' ' + ATNAMES[att] + ' ' + U.morph.toFixed(2) + ' slip ' + U.slip.toFixed(2);
  },

  // The six visual parameters (CONTRACTS §1.16), named for what the eye sees. Every from() is the expression that
  // was inline in update(), moved whole (an expression re-associated is not the same expression — §1.16), reading
  // only fields in `feats`, and update() now reads env.params instead. A route can feed any of them anything.
  params: {
    turn: { eli5: 'where the whole nest has been nudged to, in the turn it makes every sixteen beats', range: [0, 6.2832], from: (MS) => ((MS.beatCount / 16) * TAU) % TAU },
    bounce: { eli5: 'how hard the nest thumps on the beat', range: [0, 0.1], from: (MS) => BOUNCE * Math.pow(Math.max(0, Math.cos(TAU * MS.beatPhase)), 4) },
    size: { eli5: 'how much of the screen the nest fills', range: [0.4, 0.9], from: (MS) => 0.58 + 0.1 * MS.intensity + 0.07 * MS.arousal + 0.15 * Math.min(1, Math.max(0, 2 * MS.build - 1)) },
    glow: { eli5: 'how brightly the fibres inside the nest are kept lit', range: [0, 0.5], from: (MS) => GLOW * (1 - GLOWQ * Math.max(MS.hush, MS.calm)) },
    morph: { eli5: 'how far the rings are pulled out of shape along a strange attractor', range: [0, 1], from: (MS) => MORPHK * MS.tension * (MS.arc === 'idle' ? 0 : 1) },
    wave: { eli5: 'how deep the bump a kick sends travelling along every thread', range: [0, 0.4], from: (MS) => WAVE0 + 0.1 * MS.kick },
  },

  post: { fb: { decay: 0.85 }, bloom: { thr: 0.3 }, kaleido: 0, morph: { flow: 0.4 } },
  colour: { default: 'v2', variants: { v2: {} } },

  help: HELP,
};
