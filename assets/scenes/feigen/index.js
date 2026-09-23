// FEIGEN (id 6) — an endless dive down the real axis of the Mandelbrot set toward the Feigenbaum point, lifted from
// synapse scene 6. One unit of level L is one Feigenbaum factor delta = 4.669...; the period-doubling cascade is
// asymptotically self-similar under exactly that factor, so level L+1 looks like level L and the zoom can loop forever.
// Fullscreen fragment scene: no camera, no geometry, no CPU particles. The only CPU work is the reference orbit, once.
import { FS_FEIGEN } from './shaders.js';

const C_FEIG = -1.401155189092051;    // the Feigenbaum point: the accumulation of the period-doubling cascade
const DELTA_F = 4.669201609102990;    // Feigenbaum's delta: the ratio the cascade (and so this zoom) is self-similar by
const FEIG_MAX = [3.4, 4, 4.6, 5];    // how deep the dive is allowed to go per quality tier (float32 offset precision)
const ITER_TIER = [0.6, 0.8, 1, 1.25];

// Everything update() reads out of MS / LOOK, held for draw(). No hidden timers: every entry traces to MS.
const S = {
  feigL: 0, tricorn: 0,
  cx: 0, cy: 0, width: 3.2, rot: 0, iter: 70,
  lvl: 0, kick: 0, drop: 0, hat: 0, flow: 0, midS: 0, tension: 0, alive: 0, histRow: 0,
  hue: 0, sat: 1, bri: 1, spread: 1, invert: 0,
};
let prevKick = 0;    // rising edge of MS.kick: the wrap hides itself in a hit
let wasLogical = false;

export default {
  name: 'feigen',
  id: 6,
  tag: 'Feigenbaum dive · perturbed Mandelbrot, one delta per level',
  // every MS field this scene reads: score() the first four, update()/draw() the rest
  feats: ['arc', 'regularity', 'clarity', 'calm', 'bpm', 'lvl', 'tension', 'alive', 'kick', 'dropEvt', 'sectionEvt',
    'seed', 'flow', 'flowMid', 'bass', 'dropEnv', 'hat', 'midS'],
  // 'event': the zoom itself is scale-free and continuous; the only jump is the tricorn flip on a section event
  cuts: 'event',

  // look memory (CONTRACTS §1.11): a returning section comes back to its own depth and its own conjugation
  look: {
    get: () => [S.feigL, S.tricorn],
    set: (v) => { if (Array.isArray(v)) { S.feigL = +v[0] || 0; S.tricorn = +v[1] ? 1 : 0; } },
  },

  score(MS) {
    if (MS.arc === 'build') return 0;   // home owns builds
    return 0.2 + 0.4 * MS.regularity + 0.25 * MS.clarity + 0.15 * MS.calm;
  },

  init(ctx) {
    this.ctx = ctx;
    this.pr = ctx.mkProg(FS_FEIGEN, 'feigen');
    // The reference orbit Z_n of c_inf, in JS doubles, stored as float32. Only the per-pixel OFFSET needs precision,
    // which is the whole point of the perturbation method — the reference may be single once it is computed exactly.
    const gl = ctx.gl;
    const orb = new Float32Array(512);
    let z = 0;
    for (let i = 0; i < 512; i++) { orb[i] = z; z = z * z + C_FEIG; }
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, 512, 1, 0, gl.RED, gl.FLOAT, orb);   // R32F + texelFetch: no extension in WebGL2
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
    this.orbit = { t };
    S.tricorn = 0;   // no MS yet at init: the first sectionEvt draws it from the seed
  },

  update(dt, MS, GROOVE, LOOK, env) {
    const ctx = this.ctx;
    const m = LOOK.mood;
    // The conjugation is keyed on the section seed, not the drop: this engine's director hard-cuts to the home scene
    // on a drop, so a drop-keyed flip would never be on screen when it happened.
    if (MS.sectionEvt) S.tricorn = Math.floor(MS.seed.a * 1000) % 2;

    // the dive: one delta per unit of L, paced by musical time, faster when loud, slower when tense, frozen in silence
    const period = 60 / Math.max(MS.bpm, 40);
    S.feigL += dt / (32 * period) * (0.25 + 1.5 * MS.lvl) * (1 - 0.8 * MS.tension) * MS.alive;
    const fmax = FEIG_MAX[ctx.tier()];
    if (S.feigL > fmax + 1) S.feigL -= 1;
    if (MS.kick > 0.5 && prevKick <= 0.5 && S.feigL > fmax) S.feigL -= 1;   // self-similar wrap, hidden in a kick
    prevKick = MS.kick;
    if (MS.dropEvt) S.feigL += 1;   // a jump by exactly one delta is self-similar: nearly invisible (see help.why)

    const logical = !!(env && env.SC && env.SC.logical === this.id);
    if (logical && !wasLogical) S.feigL = Math.min(S.feigL, 1.2);   // arrive shallow, so the dive has somewhere to go
    wasLogical = logical;

    const L = S.feigL;
    const wd = 3.2 * Math.pow(DELTA_F, -L) * (1 + 0.25 * MS.tension - 0.18 * MS.dropEnv - 0.03 * MS.kick);
    S.cx = wd * (0.30 + 0.02 * Math.sin(MS.flowMid * 0.2));
    S.cy = wd * 0.03 * Math.sin(MS.flowMid * 0.13);
    S.width = wd;
    S.rot = 0.04 * Math.sin(MS.flowMid * 0.17);
    S.iter = Math.min(500, Math.floor((70 + 30 * L * L) * ITER_TIER[ctx.tier()]));

    S.lvl = MS.lvl;
    S.kick = MS.kick;
    S.drop = MS.dropEnv;
    S.hat = MS.hat;
    S.flow = MS.flow;
    S.midS = MS.midS;
    S.tension = MS.tension;
    S.alive = MS.alive;
    S.histRow = (ctx.engineTex.row - 0.5) / 128;
    S.hue = m.hue;
    S.sat = m.sat;
    S.bri = m.bri;
    S.spread = m.spread;
    S.invert = m.invert;
    this.rt.time = MS.flow;
    this.rt.label = 'L' + S.feigL.toFixed(2);
  },

  draw(target, { w, h }) {
    const ctx = this.ctx;
    const gl = ctx.gl;
    const pr = this.pr;
    ctx.use(pr, target, w, h);
    gl.uniform2f(pr.u('uCentre'), S.cx, S.cy);
    gl.uniform1f(pr.u('uWidth'), S.width);
    gl.uniform1f(pr.u('uTricorn'), S.tricorn);
    gl.uniform1f(pr.u('uRot'), S.rot);
    gl.uniform1i(pr.u('uIter'), S.iter);
    gl.uniform1f(pr.u('uHistRow'), S.histRow);
    gl.uniform1f(pr.u('uLevel'), S.lvl);
    gl.uniform1f(pr.u('uKick'), S.kick);
    gl.uniform1f(pr.u('uDrop'), S.drop);
    gl.uniform1f(pr.u('uHat'), S.hat);
    gl.uniform1f(pr.u('uFlow'), S.flow);
    gl.uniform1f(pr.u('uMidS'), S.midS);
    gl.uniform1f(pr.u('uTension'), S.tension);
    gl.uniform1f(pr.u('uAlive'), S.alive);
    gl.uniform1f(pr.u('uHue'), S.hue);
    gl.uniform1f(pr.u('uSat'), S.sat);
    gl.uniform1f(pr.u('uBri'), S.bri);
    gl.uniform1f(pr.u('uSpread'), S.spread);
    gl.uniform1f(pr.u('uInvert'), S.invert);
    ctx.tex(pr, 'uSpec', 0, ctx.engineTex.spec);
    ctx.tex(pr, 'uHist', 1, ctx.engineTex.hist);
    ctx.tex(pr, 'uOrbit', 2, this.orbit);
    ctx.tri();
  },

  // The set already carries its own symmetry (the cascade repeats down the real axis), so a kaleidoscope on top would
  // fake a symmetry the mathematics does not have — it is off here. Short trails keep the filaments from crawling.
  post: { fb: { decay: 0.55 }, bloom: { thr: 0.3 }, kaleido: 0 },

  rt: {},

  hud() { return 'feigen L' + S.feigL.toFixed(2) + (S.tricorn ? ' tricorn' : ''); },

  // &feig=3&tricorn=1 under #test. Setting the depth also marks the scene as already arrived: otherwise the
  // arrive-shallow clamp above fires on the first frame the hook's scene becomes logical and undoes it.
  hooks: {
    feig(v) { S.feigL = +v; wasLogical = true; },
    tricorn(v) { S.tricorn = +v; },
  },

  help: {
    // what each field in `feats` moves on this screen (CONTRACTS §1.13)
    feats: {
      arc: 'never auto-picked during a build',
      regularity: 'the bid: a steady rhythm',
      clarity: 'the bid: clearly tonal music',
      calm: 'the bid: quiet and unhurried',
      bpm: 'sets the dive\'s clock: one Feigenbaum level per 32 beats at full level',
      lvl: 'how fast the dive falls, and the overall brightness',
      tension: 'slows the dive, widens the view, and lights the interior',
      alive: 'silence freezes the dive and fades to black',
      kick: 'a brightness pulse, a slight zoom in, and the hidden level wrap',
      dropEvt: 'the depth jumps one whole Feigenbaum factor — self-similar, so you barely see it',
      sectionEvt: 'redraws the tricorn flip from the section seed',
      seed: 'decides the flip: conj(z)^2 + c instead of z^2 + c for this section',
      flow: 'the Green\'s-function bands drift outward on musical time',
      flowMid: 'the centre wanders along the axis and the frame rolls a few degrees',
      bass: 'sharpens the filaments and lights the interior trap',
      dropEnv: 'zooms in hard and floods the filaments',
      hat: 'sparkle on the Green bands',
      midS: 'how strongly the spectrogram\'s past shows through the boundary',
    },
    eli5: 'A never-ending zoom into the edge of the Mandelbrot set, falling along its spine toward one exact point. '
      + 'The shape you are falling into repeats: every time you have zoomed in by the same magic factor (about 4.67x) '
      + 'you are looking at a smaller copy of where you started, so the fall can go on forever without ever cutting. '
      + 'The music sets how fast you fall, how bright the filaments burn, and once in a while mirrors the whole set.',
    why: 'The point at the bottom is where the period-doubling cascade piles up — the same cascade that makes a system '
      + 'go from one rhythm to two to four to chaos. Its rungs shrink by a universal constant, so the picture is '
      + 'self-similar under exactly that factor and nothing else. That is the trick the whole scene rests on: when the '
      + 'drop lands the depth jumps by a full level, and because level L+1 is a copy of level L, a jump that large is '
      + 'almost invisible — the scene teleports on the beat and you read it as a flare, not a cut. The same identity '
      + 'lets the dive wrap silently once it reaches the depth its tier can hold: it steps back one level inside a '
      + 'kick. The zoom is exact, not faked, because the arithmetic never zooms: only the offsets do.',
    math: 'c_inf = -1.401155189092051 is the accumulation of the period-doubling cascade of z -> z^2 + c on the real '
      + 'axis; consecutive bifurcation gaps shrink by Feigenbaum\'s delta = 4.669201609, and the cascade is '
      + 'asymptotically self-similar under that factor, so the view width is 3.2*delta^-L. Naive float32 dies at L ~ 4; '
      + 'perturbation theory does not. Write c = c_inf + dc and z_n = Z_n + e_n, where Z_n is the reference orbit of '
      + 'c_inf itself (real, bounded, computed once in double on the CPU and uploaded as a 512-tap R32F texture). '
      + 'Subtracting the two recurrences gives e\' = 2 Z e + e^2 + dc exactly: the huge shared part Z never enters the '
      + 'per-pixel arithmetic, so the only thing float32 must resolve is the small offset, and the zoom is limited by '
      + 'the length of the reference orbit rather than by the mantissa. The tricorn flip z -> conj(z)^2 + c is the '
      + 'antiholomorphic sibling; its real slice is the same real slice, so the SAME reference orbit works and the '
      + 'perturbation becomes e\' = conj(2 Z e + e^2) + dc — one sign. Colour: the exterior distance estimate '
      + 'd = |z| ln|z| / |z\'| with the parameter-plane derivative z\' <- 2 z z\' + 1 (z\'_0 = 0), divided by the view '
      + 'width so it is dimensionless and the loop is seamless; the Green\'s function G = lim 2^-n ln|z_n| gives level '
      + 'sets spaced by doublings, drawn from lG = log2(ln r) - n; and interior pixels are shaded by the orbit trap '
      + 'min|z_n|, which is small exactly where the orbit is nearly periodic.',
  },
};
