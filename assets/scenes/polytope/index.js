// POLYTOPE — the regular 4-polytopes as tilings of the 3-sphere, turned by a double rotation in SO(4) and
// projected stereographically into the room. Edges are subdivided on S^3, so every edge arrives as a circular
// arc: nothing is drawn curved, the projection does it. Drawn with the core line renderer (path A, CONTRACTS §1.12).
import { clamp, ema } from '../../math/util.js';
import * as CO from './colour.js';
import { HELP } from './help.js';
import * as DA from './dance.js';
import * as GR from './grooves.js';
import { GATE, get4, emit, mvpMat, poleMargin, rotate4, sweepTarget } from './poly4.js';

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
const GLOW0 = 0.35;              // a sector's brightness floor: what an unsounded pitch class still shows (spec 5)
const GLOWQ = 0.4;               // hush / calm lower the floor by this much (TORUS2's number)
// spec 6, growth in two stages. Stage 1 (build 0 → 0.5) rounds the arcs: the subdivision rises from SUBLO of the
// tier's own value to all of it — never past it, so the music can never raise the tier budget (§1.4) and the
// worst-case segment count does not move. Re-cutting an edge is the one discontinuity §1.12 sanctions for a
// `continuous` scene, and grooves.fillProfile conserves the bumps' ink across it, so the beads do not flash.
const SUBLO = 0.7;
const SUBTC = 0.35;              // seconds (three of them ≈ the 1 s the brief asks for)
const SUBAR = 0.3;               // how much `arousal` counts toward stage 1 on top of the build (TORUS2's number)
// Stage 2 (build 0.5 → 1) grows the figure. SIZE0 is today's resting size; the cap is SIZE0 + the three terms.
const SIZE0 = 0.95;
const SIZEI = 0.10;              // intensity
const SIZEA = 0.05;              // arousal
const SIZEB = 0.10;              // the second half of the build (the four terms cap `size` at exactly 1.20)

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
let prevPhrase = 0;   // spec 3: phrase16Pos wraps (decreases) at a phrase boundary — that is one of the cues
let sweepForce = 0;   // hooks.sweep(): fire one on the next update, ignoring the arc gate and the spacing
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
  o.colour = CO.info();
  return JSON.stringify(o);
}

// test hook: the motion numbers of spec 2, read frame by frame across a bar
const motion = DA.motion;

// test hook: fire an inside-out sweep on the next frame, whatever the arc and whenever the last one was
function sweep() {
  sweepForce = 1;
  return 1;
}

// the shortest xw move that carries a vertex of a figure ON SCREEN through the pole. The tesseract alone cannot
// reach it (its best `den` is 0.2929, outside the gate), so the greatest reach wins and only then the shortest move.
function sweepDelta(p) {
  let best = null;
  for (const k of self.kinds || []) {
    const t = sweepTarget(get4(k), p.a1, p.a2, p.a3, DA.SWEEPTOL);
    if (!best || t.R > best.R + 1e-6 || (Math.abs(t.R - best.R) <= 1e-6 && Math.abs(t.d) < Math.abs(best.d))) best = t;
  }
  return best ? best.d : 0;
}

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
  tag: 'regular 4-polytopes on S³ — the planes lock to the beat and are nudged by the groove, the cage is a wheel of the twelve keys',
  card: { title: 'POLYTOPE', blurb: 'the regular four-dimensional polytopes, turning on the 3-sphere and dancing: the bass shoves the cage round, the rhythm runs in beads along its edges, and the twelve keys are its colours' }, // landing tile (CONTRACTS §1.17, v0.8.1); the picture is site/thumbs/polytope.jpg from tools/thumbs.sh
  feats: ['flow', 'flowHigh', 'tension', 'dropEnv', 'kick', 'hit', 'lvl', 'presence',
    'seed', 'sectionEvt', 'arc', 'regularity', 'clarity', 'calm',
    'bass', 'mid', 'high', 'snare', 'hat', 'beat', 'beatCount', 'beatPhase', 'gridTrust', 'barPos', 'hush',
    'key', 'mode', 'keyConf', 'chroma', 'harmAngle', 'valence',
    'phrase16Pos', 'dropEvt', 'build', 'intensity', 'arousal'],
  cuts: 'continuous',
  rt: {},
  hooks: { train: GR.train, info, motion, pole, cast, sweep, key: CO.key, chroma: CO.chroma },

  score(MS) {
    if (MS.arc === 'build') return 0;
    return 0.2 + 0.4 * MS.regularity + 0.3 * MS.clarity + 0.2 * MS.calm;
  },

  init(ctx) {
    self = this;
    this.ctx = ctx;
    GR.reset();
    DA.reset();
    CO.reset();
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
    this.subF = 1;
    this.p = { a1: 0, a2: 0, a3: 0, g: 1, yaw: 0, pitch: 0, sub: 0, subB: 0, pulse: 1, gbri: 0, gwid: 0, gbase: 1 };
  },

  update(dt, MS, GROOVE, LOOK, env) {
    const P = env.params;   // §1.16: exactly from(view) while nothing is routed
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
    // spec 3: the inside-out sweep is CUED, never chance — a phrase boundary, a section or the drop, and never
    // while nothing has started (`arc` is 'idle'; the enum has no 'intro' value). One per SWEEP_MIN beats.
    const wrapped = MS.phrase16Pos < prevPhrase;
    prevPhrase = MS.phrase16Pos;
    if (sweepForce || ((wrapped || MS.sectionEvt || MS.dropEvt) && P.sweep > 0)
    ) DA.sweepFire(beatNow, sweepDelta(p), sweepForce);
    sweepForce = 0;
    const D = DA.step(dt, {
      turnT: P.turn,
      zwT: ((MS.beatCount / TURNB2) * TAU) % TAU,
      flowHigh: MS.flowHigh,
      bass: MS.bass,
      slow: Math.max(MS.hush, MS.calm),
      beatPhase: MS.beatPhase,
      barPos: MS.barPos,
      sweep: DA.sweepAngle(beatNow) * P.sweep,
      sweepU: DA.sweepProgress(beatNow) * P.sweep,
    });
    p.a1 = D.a1;
    p.a2 = D.a2;
    p.a3 = D.a3;
    // spec 6 stage 2: the resting size comes from intensity and arousal, the second half of the build grows it,
    // and today's tension shrink and 60 % drop swell are untouched.
    const size = P.size;
    p.g = size * (1 - 0.3 * MS.tension) * (1 + 0.6 * MS.dropEnv + 0.08 * MS.kick) * (1 + D.bounce) * (1 + D.breath);
    // camera: a slow orbit on musical time, plus synapse's tension shake — hashed, never Math.random()
    p.yaw = 0.12 * MS.flow;
    p.pitch = 0.3 * Math.sin(0.11 * MS.flow);
    const jit = 0.05 * MS.tension * MS.tension;
    const s = MS.seed.a * 100 + this.fN * 0.7317;
    this.jx = ema(this.jx, (hash1(s) - 0.5) * 2 * jit, dt, 0.05);
    this.jy = ema(this.jy, (hash1(s + 19.19) - 0.5) * 2 * jit, dt, 0.05);
    const t = this.ctx.tier();
    // spec 6 stage 1: the arcs get rounder with the build, toward the tier's own subdivision and never past it
    const gB = Math.min(1, 2 * MS.build + SUBAR * MS.arousal);
    this.subF += (SUBLO + (1 - SUBLO) * gB - this.subF) * (1 - Math.exp(-dt / SUBTC));
    p.sub = Math.max(2, Math.round(SUB[t] * this.subF));
    p.subB = Math.max(2, Math.round(SUBB[t] * this.subF));
    p.pulse = 1 + 0.4 * MS.hit;
    // spec 4: the three trains painted along one edge, sampled where the subdivision already lands
    GR.fillProfile(this.profA, p.sub, beatNow);
    GR.fillProfile(this.profB, p.subB, beatNow);
    p.gbri = PBRI * P.groove;
    p.gwid = PWID * P.groove;
    p.gbase = 1 - PDIP * P.groove;
    const m = LOOK.mood;
    // 0.75·(0.35 + lvl)·presence, with a presence floor so muted audio still idles visibly (§0) instead of black
    const bright = GAIN * 0.75 * (0.35 + MS.lvl) * (0.15 + 0.85 * MS.presence);
    // spec 5: the twelve sector colours of the wheel — the key sets the anchor, chroma lights the sounding notes
    CO.step(dt, MS, m, this.ctx.hsv, P.glow, bright);
    this.rt.time = MS.flow;
    this.rt.label = ['tesseract ⊂ 24-cell', '600-cell', '24-cell ⊂ ' + (this.big === 'c120' ? '120-cell' : '600-cell')][this.cast];
    this.rt.log = 'poly ' + this.rt.label + ' sub ' + p.sub + '/' + p.subB + ' seg ' + this.nSeg + (D.sweep ? ' SWEEP ' + D.sweep.toFixed(2) : '');
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
    const o = { a1: p.a1, a2: p.a2, a3: p.a3, sub: 4, g: 1, eye, fwd: f, wpx: 2, alpha: 1, sec: CO.IN, secn: CO.SECN, secb: CO.SECB, prof: this.profA, gw: [1, 1, 1], gbri: p.gbri, gwid: p.gwid, gbase: p.gbase };
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
          o.sec = e.ta < 0.3 ? CO.IN : CO.OUT;
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

  // The six visual parameters (CONTRACTS §1.16), named for what the eye sees. Every from() is the expression that
  // was inline in update(), moved WHOLE (an expression re-associated is not the same expression), reading only
  // fields in `feats`, pure; update() now reads env.params instead. Proven a no-op: the s5 f360/f840 md5s are the
  // same before and after this commit.
  params: {
    turn: { eli5: 'where the cage has been nudged to, in the turn it makes every sixteen beats', range: [0, 6.2832], from: (MS) => ((MS.beatCount / TURNB) * TAU) % TAU },
    bounce: { eli5: 'how hard the figure thumps on the beat', range: [0, 0.1], from: (MS) => DA.BOUNCE * Math.pow(Math.max(0, Math.cos(TAU * MS.beatPhase)), 4) },
    size: { eli5: 'how much of the screen the figure fills between builds', range: [0.5, 1.2], from: (MS) => SIZE0 + SIZEI * MS.intensity + SIZEA * MS.arousal + SIZEB * Math.min(1, Math.max(0, 2 * MS.build - 1)) },
    groove: { eli5: 'how strongly the rhythm shows as bumps travelling along every edge', range: [0, 1], from: (MS) => GROOVE0 * (0.3 + 0.7 * MS.presence) },
    glow: { eli5: 'how brightly a pitch class that is not sounding is still kept lit', range: [0, 0.6], from: (MS) => GLOW0 * (1 - GLOWQ * Math.max(MS.hush, MS.calm)) },
    // The inside-out sweep's progress is state (it depends on the beat it was cued on), so from() is the STATE-FREE
    // part the contract asks for: whether a sweep may run at all. Written as `a · (cond ? 0 : 1)` and not as a
    // short-circuit, so paramDeps records `arc` (TORUS2, v0.7). update() multiplies the live progress by it, so a
    // route of `c:0` turns sweeps off and a route of `dropEnv` makes them land only on drops.
    sweep: { eli5: 'how far the cage is through turning itself inside out', range: [0, 1], from: (MS) => 1 * (MS.arc === 'idle' ? 0 : 1) },
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

  hud() {
    const C = CO.LIVE;
    return this.rt.label + ' ' + this.nSeg + ' segs · key ' + C.key + (C.mode ? 'm' : 'M') + ' lit ' + C.lit
      + ' · bumps ' + GR.positions(0, beatNow).length + '/' + GR.positions(1, beatNow).length + '/' + GR.positions(2, beatNow).length
      + ' · xy ' + DA.U.a1.toFixed(2) + '→' + DA.U.a1T.toFixed(2) + ' · sweep ' + DA.U.sweep.toFixed(2);
  },

  help: HELP,
};
