// POLYTOPE — the regular 4-polytopes as tilings of the 3-sphere, turned by a double rotation in SO(4) and
// projected stereographically into the room. Edges are subdivided on S^3, so every edge arrives as a circular
// arc: nothing is drawn curved, the projection does it. Drawn with the core line renderer (path A, CONTRACTS §1.12).
import { clamp, ema } from '../../math/util.js';
import { get4, emit, mvpMat } from './poly4.js';

const SUB = [3, 4, 6, 8];        // subdivisions per edge by tier (small polytopes)
const SUBB = [2, 3, 4, 5];       // ... for the 600/120-cell: 720–1200 edges, so fewer pieces each
const CAP = 16384;               // segment capacity (worst case is a cast cross-fade; steady state ≈ 7 k)
const D = 4.5;                   // eye distance
const FOCAL = 1 / Math.tan((50 * Math.PI / 180) / 2);
const NEAR = 0.1;
const SCALE = 0.9;               // overall fit of the projected image in the frame
const GAIN = 1.8;                // stroke gain, as synapse's uLineGain carried 1.5 on the star scenes
const BIG = '@big';              // resolved to the 600-cell or (tier ≥ 2) the 120-cell

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

export default {
  name: 'polytope',
  id: 5,
  tag: 'regular 4-polytopes on S³, stereographic',
  card: { title: 'POLYTOPE', blurb: 'the regular four-dimensional polytopes, turning on the 3-sphere and cast into three dimensions' }, // landing tile (CONTRACTS §1.17, v0.8.1); the picture is site/thumbs/polytope.jpg from tools/thumbs.sh
  feats: ['flow', 'flowBass', 'flowMid', 'flowHigh', 'tension', 'dropEnv', 'kick', 'hit', 'lvl', 'presence',
    'seed', 'sectionEvt', 'arc', 'regularity', 'clarity', 'calm'],
  cuts: 'continuous',
  rt: {},

  score(MS) {
    if (MS.arc === 'build') return 0;
    return 0.2 + 0.4 * MS.regularity + 0.3 * MS.clarity + 0.2 * MS.calm;
  },

  init(ctx) {
    self = this;
    this.ctx = ctx;
    for (const k of ['tess', 'c24', 'c600', 'c120']) get4(k);   // build the tables now, never mid-frame
    this.L = ctx.lines.mk(CAP);
    this.segs = new Float32Array(CAP * 12);
    this.mvp = new Float32Array(16);
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
    this.p = { a1: 0, a2: 0, a3: 0, g: 1, yaw: 0, pitch: 0, sub: 0, subB: 0, pulse: 1, colIn: [1, 1, 1], colOut: [1, 1, 1] };
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
    this.castMix = Math.min(1, this.castMix + dt);
    // the 120-cell only fits above tier 2; the swap is a discontinuity, so cross-fade it over a second
    const want = this.ctx.tier() >= 2 ? 'c120' : 'c600';
    if (want !== this.big && this.bigMix >= 1) {
      this.bigPrev = this.big;
      this.big = want;
      this.bigMix = 0;
    }
    this.bigMix = Math.min(1, this.bigMix + dt);
    // SO(4): two independent plane rotations plus an xw turn, all on musical time
    p.a1 = 0.1 * MS.flowBass;
    p.a2 = 0.14 * MS.flowMid;
    p.a3 = 0.04 * MS.flowHigh;
    p.g = (1 - 0.3 * MS.tension) * (1 + 0.6 * MS.dropEnv + 0.08 * MS.kick);
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
    const o = { a1: p.a1, a2: p.a2, a3: p.a3, sub: 4, g: 1, eye, fwd: f, wpx: 2, col: p.colIn, alpha: 1 };
    // 2.2 px at the centre of the orbit, falling off as 1/viewZ like any perspective stroke
    const wpx = 2.2 * (h / 720) * D;
    let n = 0;
    // draw a cast with weight ww; during a section cross-fade both casts are drawn, alphas eased
    const cast = (ci, ww) => {
      if (ww <= 0.002) return;
      for (const e of CASTS[ci]) {
        const kinds = e.k === BIG ? (this.bigMix >= 1 ? [[this.big, 1]] : [[this.bigPrev, 1 - this.bigMix], [this.big, this.bigMix]]) : [[e.k, 1]];
        for (const [kind, kw] of kinds) {
          if (kw <= 0.002) continue;
          o.g = e.s * p.g * SCALE;
          o.sub = e.sub ? p.subB : p.sub;
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

  hud() { return this.rt.label + ' · ' + this.nSeg + ' segs'; },

  help: {
    // what each field in `feats` moves on this screen (CONTRACTS §1.13); a field without a line falls back to FEATS[k].drives
    feats: {
      flow: 'the scene clock: the camera\'s orbit and its pitch',
      flowBass: 'the xy rotation of the 4-D double turn',
      flowMid: 'the zw rotation of the double turn',
      flowHigh: 'the extra xw turn',
      tension: 'shrinks the figure and shakes the camera (hashed jitter, never random)',
      dropEnv: 'the figure swells by up to 60 %',
      kick: 'a small swell',
      hit: 'the inner figure\'s strokes pulse thicker',
      lvl: 'stroke brightness',
      presence: 'brightness floor: muted audio still idles visibly',
      seed: 'which cast: tesseract in a 24-cell, the 600-cell, or a 24-cell in the 600- or 120-cell',
      sectionEvt: 'the cast is drawn again only at a section event, and even then cross-faded',
      arc: 'the bid: never auto-picked during a build',
      regularity: 'the bid: steady',
      clarity: 'the bid: tonal',
      calm: 'the bid: unhurried',
    },
    eli5: 'These are the cubes and pyramids of four-dimensional space, seen from the inside. The cage keeps turning itself inside out because a 4-D turn has two independent speeds at once.',
    why: 'Each figure lives on the 3-sphere, the surface of a 4-D ball, and is squashed into our room by the same shadow-casting trick that turns a globe into a flat map: cells near the light source blow up and fade out, cells opposite it shrink. The music sets the two turning speeds (bass and mids), the size (tension and drops) and which figure you get (the section).',
    math: 'Six regular convex 4-polytopes exist; four are here. Vertices are normalised to |v| = 1, so they tile S³; edges are the nearest-neighbour pairs. Each frame a general element of SO(4) — independent rotations in the xy and zw planes (a double rotation, angles 0.1·flowBass and 0.14·flowMid) plus an xw turn — moves them, then stereographic projection from the pole (0,0,0,1), p ↦ (x,y,z)/(1−w), lands them in R³. An edge is subdivided on the sphere, so each piece follows a great circle and the projection sends it to a circular arc: the cells bulge because circles map to circles, not because anything is drawn curved. The pole is the point at infinity — the (1−w) > 0.24 gate and its ramp fade a cell out as it sweeps through. Counts: tesseract 16/32, 24-cell 24/96, 600-cell 120/720, 120-cell 600/1200.',
  },
};
