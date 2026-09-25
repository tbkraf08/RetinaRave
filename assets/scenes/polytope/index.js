// POLYTOPE — the regular 4-polytopes as tilings of the 3-sphere, turned by a double rotation in SO(4) and
// projected stereographically into the room. Edges are subdivided on S^3, so every edge arrives as a circular
// arc: nothing is drawn curved, the projection does it. Drawn with the core line renderer (path A, CONTRACTS §1.12).
import { clamp, ema } from '../../math/util.js';
import * as DA from './dance.js';
import * as GR from './grooves.js';
import { GATE, get4, emit, mvpMat, poleMargin, rotate4 } from './poly4.js';

const SUB = [3, 4, 6, 8];        // subdivisions per edge by tier (small polytopes)
const SUBB = [2, 3, 4, 5];       // ... for the 600/120-cell: 720–1200 edges, so fewer pieces each
const CAP = 16384;               // segment capacity (worst case is a cast cross-fade; steady state ≈ 7 k)
const D = 4.5;                   // eye distance
const FOCAL = 1 / Math.tan((50 * Math.PI / 180) / 2);
const NEAR = 0.1;
const SCALE = 0.9;               // overall fit of the projected image in the frame
const GAIN = 1.8;                // stroke gain, as synapse's uLineGain carried 1.5 on the star scenes
const BIG = '@big';              // resolved to the 600-cell or (tier ≥ 2) the 120-cell
const TAU = Math.PI * 2;
const TURNB = 16;                // beats per full turn of the xy (bass) plane — the user's own number
const TURNB2 = 32;               // ... of the zw (mid) plane, so the two invariant planes never phase-lock
const MAXSUB = 8;                // the largest entry of SUB — the bump profiles are sized for it once, in init
// spec 4, lean 13: what a bump does to the piece it sits on, at groove 1. Brightness is the loud one; the width
// pulse is what makes a bump read as a THICKENING travelling round the cage rather than only a brighter patch.
const PBRI = 1.7;
const PWID = 0.9;
const PDIP = 0.3;                // how far BELOW normal a piece with no bump on it sits, at groove 1
const GROOVE0 = 0.8;             // the resting amplitude of the whole thing (becomes the `groove` param, spec 7)

// cast: [inner, outer]. s = scale, w = width scale, i = intensity, ta = palette coordinate.
const CASTS = [
  [{ k: 'tess', s: 0.8, w: 1, i: 1, ta: 0.15, sub: 0 }, { k: 'c24', s: 1.18, w: 0.6, i: 0.7, ta: 0.55, sub: 0 }],
  [{ k: 'c600', s: 1.02, w: 0.85, i: 0.95, ta: 0.2, sub: 1 }],
  [{ k: 'c24', s: 0.72, w: 1, i: 1, ta: 0.15, sub: 0 }, { k: BIG, s: 1.14, w: 0.5, i: 0.55, ta: 0.55, sub: 1 }],
];

const hash1 = (x) => {
  const s = Math.sin(x * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
};

const nrm = (v) => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
let self = null;   // §1.11's look.get/set are called on the look object, not the scene — keep a handle

const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

let beatNow = 0;   // beatCount + beatPhase — musical time, the only clock the grooves and the dance ever read
let castPin = -1;  // hooks.cast: the cast is re-picked at every sectionEvt, so a hook that sets it must pin it for
                   // the run or the next section silently undoes it and the shot tests the wrong thing (§1.4).

// test hook: the three trains as numbers (spec 1) — the positions a proof shot is read against, and the per-band
// n / last / ema / thr the orchestrator's real-music trace reads every 2 s to judge a dead or saturated train.
function info() {
  const o = GR.info(beatNow), p = self.p, n1 = p.sub + 1;
  // `prof` is the multiplier `emit` actually applies, piece by piece, along EVERY edge of the inner figure: the
  // bumps per edge, as the numbers the pixels are made of. Band 0 (bass) is the one the pinned trains drive.
  o.sub = p.sub;
  o.prof = Array.from(self.profA.slice(0, n1), (x) => +(p.gbase + p.gbri * x).toFixed(3));
  return JSON.stringify(o);
}

// test hook: the motion numbers of spec 2, read frame by frame across a bar
const motion = DA.motion;

// test hook: pin the cast for the whole run, cross-fade finished — the only way to bench or shoot one figure
// (CARD.bench renders 300 frames with the main thread blocked, so a setInterval cannot hold it).
function cast(v) {
  castPin = v === null || v === undefined || v < 0 ? -1 : clamp(v | 0, 0, 2);
  if (castPin >= 0 && self) { self.castPrev = castPin; self.cast = castPin; self.castMix = 1; }
  return castPin;
}

// test hook: the pole margin of the kinds actually on screen, with and without the dance's xw excursion, and the
// count of vertices the excursion pushed from comfortably outside the gate to inside it (dance.js POLE SAFETY —
// the theorem says 0, always). Re-rotates the shared tables, which every `emit` rewrites next frame anyway, so it
// is free between frames and must not be called from inside one.
function pole() {
  const p = self.p, kinds = self.kinds || [];
  let den = 9, den0 = 9, gated = 0;
  for (const k of kinds) {
    const P = get4(k);
    rotate4(P, p.a1, p.a2, p.a3 - DA.U.exc);
    const base = [];
    for (let i = 0; i < P.N; i++) base.push(1 - P.R[i * 4 + 3]);
    den0 = Math.min(den0, poleMargin(P));
    rotate4(P, p.a1, p.a2, p.a3);
    den = Math.min(den, poleMargin(P));
    for (let i = 0; i < P.N; i++) if (base[i] > GATE + DA.XWMAX && 1 - P.R[i * 4 + 3] <= GATE) gated++;
  }
  return JSON.stringify({ kinds, den: +den.toFixed(5), den0: +den0.toFixed(5), gated, exc: +DA.U.exc.toFixed(5), a3: +p.a3.toFixed(5), gate: GATE });
}

export default {
  name: 'polytope',
  id: 5,
  tag: 'regular 4-polytopes on S³, stereographic',
  card: { title: 'POLYTOPE', blurb: 'the regular four-dimensional polytopes, turning on the 3-sphere and cast into three dimensions' }, // landing tile (CONTRACTS §1.17, v0.8.1); the picture is site/thumbs/polytope.jpg from tools/thumbs.sh
  feats: ['flow', 'flowHigh', 'tension', 'dropEnv', 'kick', 'hit', 'lvl', 'presence',
    'seed', 'sectionEvt', 'arc', 'regularity', 'clarity', 'calm',
    'bass', 'mid', 'high', 'snare', 'hat', 'beat', 'beatCount', 'beatPhase', 'gridTrust', 'barPos', 'hush'],
  cuts: 'continuous',
  rt: {},
  hooks: { train: GR.train, info, motion, pole, cast },

  score(MS) {
    if (MS.arc === 'build') return 0;
    return 0.2 + 0.4 * MS.regularity + 0.3 * MS.clarity + 0.2 * MS.calm;
  },

  init(ctx) {
    self = this;
    this.ctx = ctx;
    GR.reset();
    DA.reset();
    for (const k of ['tess', 'c24', 'c600', 'c120']) get4(k);   // build the tables now, never mid-frame
    this.L = ctx.lines.mk(CAP);
    this.segs = new Float32Array(CAP * 12);
    this.mvp = new Float32Array(16);
    this.profA = new Float32Array(3 * (MAXSUB + 1));   // the bump profiles along one edge, at p.sub …
    this.profB = new Float32Array(3 * (MAXSUB + 1));   // … and at p.subB for the 600/120-cell
    this.cast = 0;
    this.castPrev = 0;
    this.castMix = 1;
    this.big = 'c600';
    this.bigPrev = 'c600';
    this.bigMix = 1;
    this.fN = 0;
    this.jx = 0;
    this.jy = 0;
    this.nSeg = 0;
    this.kinds = [];
    this.p = { a1: 0, a2: 0, a3: 0, g: 1, yaw: 0, pitch: 0, sub: 0, subB: 0, pulse: 1, gbri: 0, gwid: 0, gbase: 1, colIn: [1, 1, 1], colOut: [1, 1, 1] };
  },

  update(dt, MS, GROOVE, LOOK, env) {
    const p = this.p;
    this.fN++;
    // the cast is re-drawn from the section seed, and only on a declared section event (and even then it fades)
    if (MS.sectionEvt) {
      const c = clamp(Math.floor(MS.seed.a * 3), 0, 2);
      if (c !== this.cast) {
        this.castPrev = this.cast;
        this.cast = c;
        this.castMix = 0;
      }
    }
    if (castPin >= 0) { this.cast = castPin; this.castPrev = castPin; this.castMix = 1; }
    this.castMix = Math.min(1, this.castMix + dt);
    // the 120-cell only fits above tier 2; the swap is a discontinuity, so cross-fade it over a second
    const want = this.ctx.tier() >= 2 ? 'c120' : 'c600';
    if (want !== this.big && this.bigMix >= 1) {
      this.bigPrev = this.big;
      this.big = want;
      this.bigMix = 0;
    }
    this.bigMix = Math.min(1, this.bigMix + dt);
    // spec 1: the three onset trains. Musical time only — a bump filed at beat B stays at age beatNow − B for ever.
    beatNow = MS.beatCount + MS.beatPhase;
    GR.step(dt, [MS.bass, MS.mid, MS.high], [MS.kick, MS.snare, MS.hat], beatNow, MS.beat, MS.gridTrust);
    const F = GR.fired();
    for (let i = 0; i < F.length; i += 2) DA.hit(F[i], F[i + 1]);
    // spec 2: SO(4) still, but the two invariant planes now LOCK to the beat count and are NUDGED by the trains —
    // xy a full turn per 16 beats on the bass, zw per 32 on the mids, xw the old drift plus a bounded excursion.
    const D = DA.step(dt, {
      turnT: ((MS.beatCount / TURNB) * TAU) % TAU,
      zwT: ((MS.beatCount / TURNB2) * TAU) % TAU,
      flowHigh: MS.flowHigh,
      bass: MS.bass,
      slow: Math.max(MS.hush, MS.calm),
      beatPhase: MS.beatPhase,
      barPos: MS.barPos,
      sweep: 0,
    });
    p.a1 = D.a1;
    p.a2 = D.a2;
    p.a3 = D.a3;
    p.g = (1 - 0.3 * MS.tension) * (1 + 0.6 * MS.dropEnv + 0.08 * MS.kick) * (1 + D.bounce) * (1 + D.breath);
    // camera: a slow orbit on musical time, plus synapse's tension shake — hashed, never Math.random()
    p.yaw = 0.12 * MS.flow;
    p.pitch = 0.3 * Math.sin(0.11 * MS.flow);
    const jit = 0.05 * MS.tension * MS.tension;
    const s = MS.seed.a * 100 + this.fN * 0.7317;
    this.jx = ema(this.jx, (hash1(s) - 0.5) * 2 * jit, dt, 0.05);
    this.jy = ema(this.jy, (hash1(s + 19.19) - 0.5) * 2 * jit, dt, 0.05);
    const t = this.ctx.tier();
    p.sub = SUB[t];
    p.subB = SUBB[t];
    p.pulse = 1 + 0.4 * MS.hit;
    // spec 4: the three trains painted along one edge, sampled where the subdivision already lands
    GR.fillProfile(this.profA, p.sub, beatNow);
    GR.fillProfile(this.profB, p.subB, beatNow);
    p.gbri = PBRI * GROOVE0;
    p.gwid = PWID * GROOVE0;
    p.gbase = 1 - PDIP * GROOVE0;
    const m = LOOK.mood;
    // 0.75·(0.35 + lvl)·presence, with a presence floor so muted audio still idles visibly (§0) instead of black
    const bright = GAIN * 0.75 * (0.35 + MS.lvl) * (0.15 + 0.85 * MS.presence);
    const v = 0.55 + 0.45 * m.bri;
    const set = (out, ta) => {
      const c = this.ctx.hsv(m.hue + m.spread * ta, m.sat, v);
      out[0] = c[0] * bright;
      out[1] = c[1] * bright;
      out[2] = c[2] * bright;
    };
    set(p.colIn, 0.15);
    set(p.colOut, 0.55);
    this.rt.time = MS.flow;
    this.rt.label = ['tesseract ⊂ 24-cell', '600-cell', '24-cell ⊂ ' + (this.big === 'c120' ? '120-cell' : '600-cell')][this.cast];
    this.rt.log = 'poly ' + this.rt.label + ' sub ' + p.sub + '/' + p.subB + ' seg ' + this.nSeg;
  },

  draw(target, { w, h }) {
    const ctx = this.ctx;
    const gl = ctx.gl;
    const p = this.p;
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    // view basis from the orbit, then the pinhole matrix
    const cp = Math.cos(p.pitch);
    const eye = [D * cp * Math.sin(p.yaw), D * Math.sin(p.pitch), D * cp * Math.cos(p.yaw)];
    const f = nrm([this.jx - eye[0], this.jy - eye[1], -eye[2]]);
    const r = nrm(cross(f, [0, 1, 0]));
    const u = cross(r, f);
    mvpMat(this.mvp, eye, r, u, f, FOCAL, w / h, NEAR);
    const o = { a1: p.a1, a2: p.a2, a3: p.a3, sub: 4, g: 1, eye, fwd: f, wpx: 2, col: p.colIn, alpha: 1, prof: this.profA, gw: [1, 1, 1], gbri: p.gbri, gwid: p.gwid, gbase: p.gbase };
    // 2.2 px at the centre of the orbit, falling off as 1/viewZ like any perspective stroke
    const wpx = 2.2 * (h / 720) * D;
    let n = 0;
    const kindsSeen = new Set();
    // draw a cast with weight ww; during a section cross-fade both casts are drawn, alphas eased
    const cast = (ci, ww) => {
      if (ww <= 0.002) return;
      for (const e of CASTS[ci]) {
        // the mids ride the OUTER cage only (spec 4); a one-figure cast is both, so it takes all three bands
        o.gw[1] = CASTS[ci].length === 1 || e !== CASTS[ci][0] ? 1 : 0;
        const kinds = e.k === BIG ? (this.bigMix >= 1 ? [[this.big, 1]] : [[this.bigPrev, 1 - this.bigMix], [this.big, this.bigMix]]) : [[e.k, 1]];
        for (const [kind, kw] of kinds) {
          if (kw <= 0.002) continue;
          kindsSeen.add(kind);
          o.g = e.s * p.g * SCALE;
          o.sub = e.sub ? p.subB : p.sub;
          o.prof = e.sub ? this.profB : this.profA;
          o.wpx = wpx * e.w * (e === CASTS[ci][0] ? p.pulse : 1);
          o.col = e.ta < 0.3 ? p.colIn : p.colOut;
          o.alpha = e.i * ww * kw;
          n = emit(kind, o, this.segs, n, CAP);
        }
      }
    };
    if (this.castMix < 1) cast(this.castPrev, 1 - this.castMix);
    cast(this.cast, this.castMix);
    this.nSeg = n;
    this.kinds = [...kindsSeen];
    ctx.lines.set(this.L, this.segs, n);
    ctx.lines.draw(this.L, target, w, h, { mvp: this.mvp, depth: true, blend: 'over' });
  },

  post: { fb: { decay: 0.74 }, bloom: { thr: 0.3 }, kaleido: 0 },

  // One colour mapping, declared (CONTRACTS §1.4) so every scene answers `CARD.colour`, the cast line and the panel's
  // colour select the same way. No `post` on the variant: the scene's own `post` above stays in force.
  colour: { default: 'v2', variants: { v2: {} } },

  look: {
    get() { return self.cast; },
    set(v) {
      if (typeof v !== 'number' || v === self.cast) return;
      self.castPrev = self.cast;
      self.cast = clamp(v | 0, 0, 2);
      self.castMix = 0;
    },
  },

  hud() { return this.rt.label + ' · ' + this.nSeg + ' segs · bumps ' + GR.live(beatNow) + ' · xy ' + DA.U.a1.toFixed(2) + '/' + DA.U.a1T.toFixed(2); },

  help: {
    // what each field in `feats` moves on this screen (CONTRACTS §1.13); a field without a line falls back to FEATS[k].drives
    feats: {
      flow: 'the scene clock: the camera\'s orbit and its pitch',
      flowHigh: 'drifts the extra xw turn, the one that carries a cell through the pole',
      tension: 'shrinks the figure and shakes the camera (hashed jitter, never random)',
      dropEnv: 'the figure swells by up to 60 %',
      kick: 'confirms a bass onset (the train counts it at full strength, an unconfirmed rise at 60 %), and a small swell',
      bass: 'the bass groove: every rise over its own average files a bump that travels along every edge',
      mid: 'the mid groove: a sharper bump, on the outer figure only',
      high: 'the high groove: tiny fast ripples everywhere',
      snare: 'confirms a mid onset',
      hat: 'confirms a high onset',
      beat: 'files a faint bass bump when a whole bar went by with no onset, so a drumless track still breathes',
      beatCount: 'the lock: sixteen beats is one turn of the xy plane, thirty-two of the zw plane',
      beatPhase: 'the beat clock the trains are filed on, and the 5 % thump on every beat',
      barPos: 'the bar\'s breath: the figure swells and shrinks 2 % over four beats, even in silence',
      hush: 'the hush before a drop slows every spring, so the figure hangs',
      gridTrust: 'when the grid is trusted the bumps snap to the nearest sixteenth, so a straight groove reads as even',
      hit: 'the inner figure\'s strokes pulse thicker',
      lvl: 'stroke brightness',
      presence: 'brightness floor: muted audio still idles visibly',
      seed: 'which cast: tesseract in a 24-cell, the 600-cell, or a 24-cell in the 600- or 120-cell',
      sectionEvt: 'the cast is drawn again only at a section event, and even then cross-faded',
      arc: 'the bid: never auto-picked during a build',
      regularity: 'the bid: steady',
      clarity: 'the bid: tonal',
      calm: 'slows the springs with the hush, and the bid: unhurried',
    },
    eli5: 'These are the cubes and pyramids of four-dimensional space, seen from the inside. The cage keeps turning itself inside out because a 4-D turn has two independent speeds at once.',
    why: 'Each figure lives on the 3-sphere, the surface of a 4-D ball, and is squashed into our room by the same shadow-casting trick that turns a globe into a flat map: cells near the light source blow up and fade out, cells opposite it shrink. The music sets the two turning speeds (bass and mids), the size (tension and drops) and which figure you get (the section).',
    math: 'Six regular convex 4-polytopes exist; four are here. Vertices are normalised to |v| = 1, so they tile S³; edges are the nearest-neighbour pairs. Each frame a general element of SO(4) — independent rotations in the xy and zw planes (a double rotation, angles 0.1·flowBass and 0.14·flowMid) plus an xw turn — moves them, then stereographic projection from the pole (0,0,0,1), p ↦ (x,y,z)/(1−w), lands them in R³. An edge is subdivided on the sphere, so each piece follows a great circle and the projection sends it to a circular arc: the cells bulge because circles map to circles, not because anything is drawn curved. The pole is the point at infinity — the (1−w) > 0.24 gate and its ramp fade a cell out as it sweeps through. Counts: tesseract 16/32, 24-cell 24/96, 600-cell 120/720, 120-cell 600/1200.',
  },
};
