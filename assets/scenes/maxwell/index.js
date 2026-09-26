// MAXWELL (v0.10, id 9) — the four equations that dance: a live 2D Yee-grid FDTD solution of Maxwell's equations in the
// TE mode (Ez, Hx, Hy on ping-pong RGBA16F/32F targets), driven by the music in TORUS2's language — twelve charges on a
// ring by pitch class lit by chroma, a magnetic dipole at the centre that turns one nudge per beat, every hit a real
// wavefront at the speed of light, the section as the medium (lens · mirror cavity · photonic lattice · waveguide), the
// drop a mirror. MAXWELL-SESSION-PROMPT.md is the plan, docs/workers/brief-maxwell.md the brief, docs/workers/maxwell.md
// the worker's report. The physics is gated by tools/test_fdtd.js, not by the picture.
// Forced-only (score 0, key `n` cycles to it) until the user approves it.
import { mkAnchor, sectorHue, sectorPc } from '../../math/keycolour.js';
import { mkNudge } from '../../math/nudge.js';
import { COURANT, DIPD, FS_E, FS_H, GRIDT, mkField, readBand } from './fdtd.js';
import { FS_MED, GEON, GEOTC, NAMES, SIGMAX, VACSIG } from './medium.js';
import { FS_DOWN, FS_SHOW, HALPHA, HW, NLEV, chains, contours, stream } from './render.js';
import * as SRC from './sources.js';
import { HELP } from './help.js';
import { hEnergy, hInfo, hProbe, hRow } from './probe.js';

const TAU = Math.PI * 2;
// --- the manual settings of the look: named constants at the top, never a magic number in a shader ---
const BOUNCE = 0.05;    // the thump on the beat: 5 % of the zoom (the plan's number)
const ZOOM0 = 1.03;     // the resting zoom; intensity / arousal add to it
const ZOOMK = 0.10;
const FGAIN = 3.4;      // how brightly a unit of |E| burns
const GLOWG = 0.85;     // ... and a charge's glow
const FLOOR = 0.010;    // the plane is never pure black: silence still shows the cavity
const MEDVIS = 1.0;     // how visible the medium is
const MIRHOLD = 2.2;    // the drop's mirror is held full on for about a bar ...
const DROPTC = 3.2;     // ... and then relaxes over another, so the whole gesture is about two bars
const CONTC = 0.45;     // the medium's contrast and shear ease over this many seconds
const HUETC = 0.30;     // the charges' hue purity eases (clarity moves fast)
const DSB = 6;          // the H-line downsample block, in cells
const FITK = 0.75;      // the porthole's framing: this much of the grid height across one screen height
const RINGM = 0.368;    // ... but never so close that the charges' ring (0.34 grid heights) is cropped

const U = {
  tier: -1, sub: 2, pend: 0, yaw: 0, yawRate: 0, bounce: 0, zoom: 1, mir: 0, pol: 1, geoA: 0, geoB: 0, geoF: 1,
  geoRot: 0, mirHold: 0, lens: 1.6, shear: 0, sigma: 0, vac: 0, hue: 0, sat: 1, bri: 1, key: 0, mode: 0, pure: 1,
  beatNow: 0, phrase: 0, loud: 0, mx: 0, lam: 0, sig: 0, spb: 0, segs: 0, loops: 0, gap: 0, lab: 0, pulse: 0,
  tw: 0, th: 0, flow: 0, light: 0.7, fit: 144,
};
const GH12 = new Float32Array(12);     // the twelve hues
const Z12 = new Float32Array(12);      // twelve zeros: lab mode silences the charges
const GA12 = new Float32Array(12);     // the twelve glow amplitudes
const SEG = new Float32Array(16384 * 12);   // the path-A upload: 12 floats a segment (CONTRACTS §1.12)
const CSEG = new Float32Array(16384 * 4);   // ... and the same segments in small-grid coordinates, for chains()
let CTX = null, prH = null, prE = null, prM = null, prS = null, prD = null, LN = null;
let F0 = null, F1 = null, CUR = null, MED = null, DS = null;
let GW = 0, GH = 0, DW = 0, DH = 0, ASP = 16 / 9, QS = 0.6, NEED = 1, CLR = 0;
let DSPX = null, APX = null, LTGT = null;
let keyPin = null, medPin = -1, tierPin = -1;
// what probe.js needs to read: the live targets and sizes, refreshed where they change
export const ST = { ctx: null, cur: null, med: null, tgt: null, gw: 0, gh: 0, U, hues: null };
const AN = mkAnchor();
const NG = mkNudge();

function build() {
  const ctx = CTX, t = tierPin >= 0 ? tierPin : U.tier < 0 ? 0 : U.tier;
  const G = GRIDT[Math.max(0, Math.min(3, t))];
  GW = G[0];
  GH = G[1];
  U.sub = G[2];
  for (const x of [F0, F1, MED, DS]) if (x) ctx.freeTarget(x);
  F0 = mkField(ctx, GW, GH);
  F1 = mkField(ctx, GW, GH);
  MED = mkField(ctx, GW, GH);
  DW = Math.max(8, Math.round(GW / DSB));
  DH = Math.max(8, Math.round(GH / DSB));
  DS = mkField(ctx, DW, DH);
  DSPX = new Float32Array(4 * DW * DH);
  APX = new Float32Array(DW * DH);
  CUR = F0;
  ST.cur = F0;
  ST.med = MED;
  ST.gw = GW;
  ST.gh = GH;
  NEED = 0;
  CLR = 1;
  U.mx = 0;
}

function clearFields() {
  const g = CTX.gl;
  for (const t of [F0, F1]) {
    g.bindFramebuffer(g.FRAMEBUFFER, t.f);
    g.clearColor(0, 0, 0, 0);
    g.clear(g.COLOR_BUFFER_BIT);
  }
  g.bindFramebuffer(g.FRAMEBUFFER, null);
  CLR = 0;
}

// One substep: Faraday into the other target, then Ampere-Maxwell back. Two passes, and after them the state is in
// the target it started in (a fragment shader cannot read what it writes, hence the ping-pong).
function substep(S) {
  const ctx = CTX, g = ctx.gl;
  SRC.substep();
  const src = CUR, dst = CUR === F0 ? F1 : F0;
  ctx.use(prH, dst, GW, GH);
  ctx.tex(prH, 'uF', 0, src);
  g.uniform2f(prH.u('uSz'), GW, GH);
  g.uniform1f(prH.u('uS'), S);
  ctx.tri();
  ctx.use(prE, src, GW, GH);
  ctx.tex(prE, 'uF', 0, dst);
  ctx.tex(prE, 'uM', 1, MED);
  g.uniform2f(prE.u('uSz'), GW, GH);
  g.uniform1f(prE.u('uS'), S);
  g.uniform1f(prE.u('uLab'), U.lab);
  g.uniform1f(prE.u('uPulse'), U.pulse);
  g.uniform2f(prE.u('uCtr'), GW / 2, GH / 2);
  g.uniform1f(prE.u('uJ'), U.lab ? 0 : SRC.OUT.j);
  g.uniform4f(prE.u('uDip'), U.lab ? 0 : SRC.OUT.dj, SRC.OUT.dx, SRC.OUT.dy, DIPD);
  g.uniform1fv(prE.u('uCX[0]'), SRC.CX);
  g.uniform1fv(prE.u('uCY[0]'), SRC.CY);
  g.uniform1fv(prE.u('uCA[0]'), U.lab ? Z12 : SRC.CA);
  ctx.tri();
  U.pulse = 0;
}

// The H field lines: the downsampled field into DSPX, its stream function into APX, and the contours of that at
// evenly spaced levels (render.js) as path-A segments.
function strokes(target, w, h) {
  const ctx = CTX, g = ctx.gl;
  ctx.use(prD, DS, DW, DH);
  ctx.tex(prD, 'uF', 0, CUR);
  g.uniform2f(prD.u('uSz'), GW, GH);
  g.uniform1f(prD.u('uBlk'), DSB);
  ctx.tri();
  // The WHOLE small target, every frame — not a band of its rows. A banded read leaves DSPX a patchwork of up to
  // DH / BANDF different times, and a time-patchwork H field is NOT divergence-free, so not one streamline closes
  // (measured: loops 0 at every frame of the first run). DW x DH is 1.6 % of the field's texels, the same cost
  // class as one band of the field itself, which is what the brief's budget is about.
  const part = readBand(ctx, DS, 0, DH, DSPX);
  if (part !== DSPX) DSPX.set(part);
  stream(DSPX, DW, DH, APX);
  const tier = Math.max(0, Math.min(3, U.tier < 0 ? 0 : U.tier));
  const cap = ctx.budget('segs');
  const n = contours(APX, DW, DH, NLEV[tier], CSEG, cap);
  const px = HW * Math.max(0.6, h / 720);
  const col = [(0.55 + 0.45 * U.sat) * HALPHA, 0.62 * HALPHA, 0.95 * HALPHA];
  for (let s = 0; s < n; s++) {
    const o = 12 * s;
    for (let e = 0; e < 2; e++) {
      const q = clip(CSEG[4 * s + 2 * e], CSEG[4 * s + 2 * e + 1]);
      SEG[o + 4 * e] = q[0];
      SEG[o + 4 * e + 1] = q[1];
      SEG[o + 4 * e + 2] = 0;
      SEG[o + 4 * e + 3] = px;
    }
    SEG[o + 8] = col[0];
    SEG[o + 9] = col[1];
    SEG[o + 10] = col[2];
    SEG[o + 11] = 1;
  }
  U.segs = n;
  U.nlev = NLEV[tier];
  if (n > 0) {
    ctx.lines.set(LN, SEG, n);
    ctx.lines.draw(LN, target, w, h, { blend: 'add' });
  }
}

const CP = [0, 0];
// a small-grid texel -> clip space, through the same view the display pass uses
function clip(x, y) {
  const gx = (x * DSB + 0.5 * DSB - GW / 2) / U.fit, gy = (y * DSB + 0.5 * DSB - GH / 2) / U.fit;
  const c = Math.cos(U.yaw), s = Math.sin(U.yaw);
  const ax = (gx * c - gy * s) * U.zoom, ay = (gx * s + gy * c) * U.zoom;
  CP[0] = 2 * ax / ASP;
  CP[1] = 2 * ay;
  return CP;
}


// --- the test hooks (CONTRACTS §1.4: called as plain functions, the receiver is CARD.hooks — so they are module
// functions here and never reach for `this`). A specific scene's is CARD.REG[9].scene.hooks.<name>(v).
function hTier(v) { tierPin = v === null || v === undefined || +v < 0 ? -1 : Math.max(0, Math.min(3, +v | 0)); NEED = 1; return tierPin; }
function hReset() { SRC.reset(); NG.reset(); AN.reset(); CLR = 1; U.pulse = U.lab; U.mir = 0; U.pol = 1; return 1; }
// vacuum, no absorber, a perfect-conductor wall, no music sources, one pinned gaussian pulse: the twin's own run
function hLab(v) { U.lab = v === null || v === undefined || +v ? 1 : 0; hReset(); return U.lab; }
// hooks.train(v) pins a pattern; hooks.train() with NO argument only reports (calling it to read the numbers must
// not reset the very thing it is reporting — the first train shot was taken one frame after its own hook cleared it).
function hTrain(v) {
  if (v !== undefined) SRC.train(v === '' || v === null ? null : String(v));
  const cr = hRow(ST), gaps = [];
  for (let i = 1; i < cr.length; i++) gaps.push(+(cr[i] - cr[i - 1]).toFixed(2));
  return JSON.stringify({ mode: SRC.trainMode(), rings: SRC.rings(0), spacings: SRC.spacings(0), crests: cr, crestGaps: gaps, sig: +SRC.OUT.sig.toFixed(2), spb: +SRC.OUT.spb.toFixed(2) });
}
function hKey(v) {
  const p = String(v === null || v === undefined ? '' : v).split(',');
  keyPin = p[0] === '' || +p[0] < 0 ? null : { k: ((+p[0] | 0) % 12 + 12) % 12, m: +p[1] ? 1 : 0 };
  return JSON.stringify(keyPin);
}
// hooks.medium(0..3) pins one of the four geometries; GEON or more pins EMPTY SPACE, which is the control every
// measurement of a free wave needs (a ring reflected off the cavity wall is not a ring of the train).
function hMedium(v) { medPin = v === null || v === undefined || +v < 0 ? -1 : +v >= GEON ? -2 : (+v | 0) % GEON; return medPin; }
function hDrop() { U.mir = 1; U.mirHold = MIRHOLD; return 1; }

export default {
  name: 'maxwell',
  id: 9,
  tag: "maxwell's equations, solved live — twelve charges by pitch class, a dipole nudged per beat, hits as wavefronts, the section as the medium",
  card: { title: 'MAXWELL', blurb: "Maxwell's four equations solved live on a grid: twelve charges by pitch class, a magnet turning one notch a beat, and every drum hit a real ripple of light" },
  feats: ['chroma', 'harmAngle', 'key', 'mode', 'keyConf', 'valence', 'kick', 'snare', 'hat', 'beat', 'bpm', 'beatPhase',
    'beatCount', 'barPos', 'phrase16Pos', 'bass', 'sub', 'build', 'intensity', 'arousal', 'tension', 'dropEvt',
    'dropEnv', 'arc', 'sectionAlt', 'sectionEvt', 'surpriseEvt', 'flowBass', 'flowMid', 'flowHigh', 'roll', 'riser',
    'hush', 'calm', 'alive', 'novelty', 'clarity', 'regularity'],
  cuts: 'continuous',
  always: false,
  rt: {},
  score() { return 0; },   // forced-only until the user's word (MAXWELL-SESSION-PROMPT.md step 4)

  hooks: { tier: hTier, lab: hLab, reset: hReset, train: hTrain, key: hKey, medium: hMedium, drop: hDrop, energy: () => hEnergy(ST), probe: () => hProbe(ST), mxinfo: () => hInfo(ST) },

  init(ctx) {
    this.ctx = ctx;
    CTX = ctx;
    ST.ctx = ctx;
    ST.hues = GH12;
    ST.seg = CSEG;
    prH = ctx.mkProg(FS_H, 'maxwell-h');
    prE = ctx.mkProg(FS_E, 'maxwell-e');
    prM = ctx.mkProg(FS_MED, 'maxwell-medium');
    prS = ctx.mkProg(FS_SHOW, 'maxwell-show');
    prD = ctx.mkProg(FS_DOWN, 'maxwell-down');
    LN = ctx.lines.mk(16384);
    ctx.onResize((w, h) => { ASP = w / Math.max(1, h); NEED = 1; });
    for (let k = 0; k < 12; k++) SRC.W12[k] = 0.3;
    this._S = null;
  },

  update(dt, MS, GROOVE, LOOK, env) {
    const P = env.params;
    QS += (this.ctx.Q.q - QS) * Math.min(1, dt * 0.5);              // slow, so the tier does not chatter
    const tier = tierPin >= 0 ? tierPin : QS < 0.32 ? 0 : QS < 0.62 ? 1 : QS < 0.86 ? 2 : 3;
    if (tier !== U.tier) { U.tier = tier; NEED = 1; }
    U.light = P.light;
    U.pend = U.sub;

    // Gauss: the twelve charges. The chroma vector IS the charge. When it carries no energy (silence, and the #test
    // fake timeline, which leaves chroma zeroed) the weights come from the harmony the extractor does report: pitch
    // class k sits at 2pi(7k mod 12)/12 on the circle of fifths and is weighted by how close it is to harmAngle.
    // w blends the two continuously, so nothing ever jumps (TORUS2 index.js:155-175, DECISIONS §4).
    const C = MS.chroma;
    let sum = 0, mxc = 0;
    for (let k = 0; k < 12; k++) { const c = Math.max(0, C[k] || 0); sum += c; if (c > mxc) mxc = c; }
    const w = Math.min(1, 2 * sum), nrm = 1 / Math.max(0.2, mxc);
    let mx = -1;
    for (let k = 0; k < 12; k++) {
      const pc = sectorPc(k);
      const fifth = ((7 * pc) % 12) / 12 * TAU;
      const imp = Math.pow(0.5 + 0.5 * Math.cos(MS.harmAngle - fifth), 2);
      const band = pc < 4 ? 0.55 + 0.55 * MS.bass : pc < 8 ? 1 : 0.85;
      const c = Math.min(1, (w * Math.max(0, C[pc] || 0) * nrm + (1 - w) * imp) * band);
      SRC.W12[k] = c;
      if (c > mx) { mx = c; U.loud = k; }
    }

    // the key as a hue ANCHOR on the circle of fifths, and clarity as the hue PURITY of the twelve
    const m = (LOOK && LOOK.mood) || { hue: 0, sat: 0.7, bri: 0.8, spread: 0.5 };
    const A = AN.anchor(dt, MS.key, MS.mode, MS.keyConf, MS.valence, MS.harmAngle, m.hue, keyPin);
    U.hue = A.hue;
    U.sat = Math.min(1.2, (0.45 + 0.55 * m.sat) * A.sat);
    U.bri = 0.62 + 0.55 * m.bri;
    U.key = A.key;
    U.mode = A.mode;
    U.pure += (0.35 + 0.65 * MS.clarity - U.pure) * (1 - Math.exp(-dt / HUETC));
    const spread = 0.30 + 0.45 * m.spread;
    for (let k = 0; k < 12; k++) GH12[k] = A.hue + (sectorHue(A.hue, k, spread) - A.hue) * U.pure;

    // Faraday: the nudge. The target is read off the beat COUNT so it can never drift; the angle springs to it, and
    // the dipole's moment RATE is that spring's velocity — so it radiates on the nudge and is silent between nudges.
    U.yaw = NG.turn(dt, P.turn, Math.max(MS.hush, MS.calm));
    U.yawRate = NG.rate();
    if (MS.surpriseEvt) U.pol = -U.pol;
    U.bounce = P.bounce;
    U.zoom = ZOOM0 + ZOOMK * (0.6 * MS.intensity + 0.4 * MS.arousal) + U.bounce;

    // the medium is the section, cross-faded so `cuts` stays 'continuous'; the build makes it ring longer and bend harder
    const sel = medPin >= 0 ? medPin : MS.sectionAlt < 0 ? 0 : ((MS.sectionAlt % GEON) + GEON) % GEON;
    if (sel !== U.geoA) { U.geoB = U.geoA; U.geoA = sel; U.geoF = 0; }
    U.geoF = Math.min(1, U.geoF + dt / GEOTC);
    if (MS.sectionEvt) U.geoRot = 0.37 * Math.max(0, MS.sectionAlt | 0);
    const lensT = P.lens * (1 + 0.03 * Math.sin(TAU * MS.barPos / 4));
    U.lens += (lensT - U.lens) * (1 - Math.exp(-dt / CONTC));
    U.shear += (0.55 * MS.tension - U.shear) * (1 - Math.exp(-dt / CONTC));
    U.sigma = MS.arc === 'idle' ? VACSIG : (1 - P.ring) * SIGMAX;
    U.vac = medPin === -2 || MS.arc === "idle" ? 1 : 0;
    // the drop's mirror HOLDS for a bar and then relaxes, rather than decaying from the first frame: while it is
    // full on the plane is closed and lossless and the field genuinely stands (a pure exponential from 1 gave the
    // loss back inside half a second, and the standing wave never had time to form).
    if (MS.dropEvt) { U.mir = 1; U.mirHold = MIRHOLD; }
    if (U.mirHold > 0) U.mirHold -= dt;
    else U.mir *= Math.exp(-dt / DROPTC);
    if (U.mir < 1e-4) U.mir = 0;

    // Ampere-Maxwell: the bass is a current, the hits are launches, bpm is the carrier, regularity locks it to the grid
    U.beatNow = MS.beatCount + MS.beatPhase;
    U.phrase = MS.phrase16Pos;
    U.flow = MS.flowBass + MS.flowMid + MS.flowHigh;
    SRC.frame(U.sub, GH || 144, (GW || 256) / 2, (GH || 144) / 2, [MS.kick, MS.snare, MS.hat], U.beatNow, MS.beat, {
      amp: P.charge, sub: MS.sub, loud: U.loud, bpm: MS.bpm, dt, reg: MS.regularity, light: P.light,
      sweep: Math.max(MS.roll, MS.riser) * (1 - MS.dropEnv), pol: U.pol, yaw: U.yaw, yawRate: U.yawRate,
      shim: MS.hat * (0.3 + 0.7 * MS.alive) * (0.5 + 0.5 * MS.novelty),
      fam: [MS.flowBass, MS.flowMid, MS.flowHigh],
    });
    U.lam = SRC.OUT.lam;
    U.sig = SRC.OUT.sig;
    U.spb = SRC.OUT.spb;
    this.rt.time = MS.flowBass + MS.flowMid;
    this.rt.label = 'fdtd ' + GW + 'x' + GH + ' ' + NAMES[U.geoA];
    this._S = 1;
  },

  draw(target, { w, h }) {
    if (!this._S) return;   // a forced scene is drawn on its first frame before its first update() (CONTRACTS §1)
    const ctx = this.ctx, g = ctx.gl;
    if (NEED) build();
    if (CLR) clearFields();
    LTGT = target;
    ST.tgt = target;
    U.tw = w;
    U.th = h;
    // the medium, one pass per frame (a medium that only eased on a threshold would jump)
    ctx.use(prM, MED, GW, GH);
    g.uniform2f(prM.u('uSz'), GW, GH);
    g.uniform2f(prM.u('uCtr'), GW / 2, GH / 2);
    g.uniform1f(prM.u('uHS'), GH);
    g.uniform3f(prM.u('uGeo'), U.geoA, U.geoB, U.geoF);
    g.uniform4f(prM.u('uMed'), U.lens, U.shear, U.sigma, U.vac);
    g.uniform2f(prM.u('uMir'), U.mir, U.geoRot);
    ctx.tri();
    const S = COURANT * U.light;
    const n = U.pend;
    U.pend = 0;
    for (let i = 0; i < n; i++) substep(S);
    // the picture. The grid is CONTAINED in the viewport: the cells one screen height covers.
    // How many cells one screen height covers. render.js fades the plane to black on a DISC of radius half the grid
    // height, so what the camera turns is a round PORTHOLE and its full turn every sixteen beats sweeps no corners
    // across the frame. FITK frames that disc: it fills the height and is round at the sides. The second term is the
    // portrait rule — on a phone the ring of charges must not be cropped, so the plane letterboxes instead.
    U.fit = Math.max(FITK * GH, 2 * RINGM * GH / Math.max(0.2, ASP));
    ctx.use(prS, target, w, h);
    ctx.tex(prS, 'uF', 0, CUR);
    ctx.tex(prS, 'uM', 1, MED);
    g.uniform2f(prS.u('uSz'), GW, GH);
    g.uniform2f(prS.u('uCtr'), GW / 2, GH / 2);
    g.uniform4f(prS.u('uView'), U.fit, U.yaw, U.zoom, ASP);
    g.uniform4f(prS.u('uCol'), U.hue, U.sat, U.bri, U.hue + 0.5);
    g.uniform4f(prS.u('uGain'), FGAIN, MEDVIS, GLOWG, FLOOR);
    g.uniform1fv(prS.u('uGX[0]'), SRC.CX);
    g.uniform1fv(prS.u('uGY[0]'), SRC.CY);
    for (let k = 0; k < 12; k++) GA12[k] = 0.10 + 0.9 * SRC.W12[k];   // a floor, so all twelve are on the ring
    g.uniform1fv(prS.u('uGA[0]'), GA12);
    g.uniform1fv(prS.u('uGH[0]'), GH12);
    ctx.tri();
    strokes(target, w, h);
    ctx.use(prS, target, w, h);   // leave the target bound with the viewport set, as draw() found it (§1.1)
  },

  overlay() {
    if (!this._S) return;   // loop.js calls every scene's overlay() every frame (project_nav2: an uncaught read froze the clock)
  },

  hud() {
    return 'maxwell ' + GW + 'x' + GH + '/' + U.sub + ' ' + NAMES[U.geoA] + ' eps ' + U.lens.toFixed(2) + ' sig ' + U.sigma.toFixed(3)
      + ' lam ' + U.lam.toFixed(1) + ' mir ' + U.mir.toFixed(2) + ' key ' + U.key + (U.mode ? 'm' : 'M')
      + ' yaw ' + U.yaw.toFixed(2) + ' p16 ' + U.phrase.toFixed(1) + ' segs ' + U.segs + '/' + U.loops + ' gap ' + U.gap;
  },

  // The six visual parameters (CONTRACTS §1.16), named for what the eye sees. Every from() is the expression update()
  // would have written inline, moved whole, reading only fields in `feats`.
  params: {
    light: { eli5: 'how fast light travels, as a fraction of what the grid can carry', range: [0.3, 1], from: (MS) => 0.70 + 0.25 * MS.intensity },
    ring: { eli5: 'how long a wave rings before the space swallows it', range: [0, 1], from: (MS) => 0.55 + 0.35 * MS.build - 0.3 * Math.max(MS.hush, MS.calm) },
    lens: { eli5: 'how hard the medium bends the light', range: [1, 4], from: (MS) => 1.6 + 1.4 * MS.build + 0.6 * MS.tension },
    charge: { eli5: 'how loudly the charges and the dipole radiate', range: [0, 1], from: (MS) => 0.45 + 0.35 * MS.intensity + 0.2 * MS.bass },
    turn: { eli5: 'where the dipole has been nudged to, in the turn it makes every sixteen beats', range: [0, 6.2832], from: (MS) => ((MS.beatCount / 16) * TAU) % TAU },
    bounce: { eli5: 'how hard the cavity thumps on the beat', range: [0, 0.1], from: (MS) => BOUNCE * Math.pow(Math.max(0, Math.cos(TAU * MS.beatPhase)), 4) },
  },

  post: { fb: { decay: 0.72 }, bloom: { thr: 0.28 }, kaleido: 0, morph: { flow: 0.55 } },
  colour: { default: 'v2', variants: { v2: {} } },
  help: HELP,
};
