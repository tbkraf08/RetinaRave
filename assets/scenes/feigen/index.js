// FEIGEN (id 6) — an endless dive down the real axis of the Mandelbrot set toward the Feigenbaum point, lifted from
// synapse scene 6. One unit of level L is one Feigenbaum factor delta = 4.669...; the period-doubling cascade is
// asymptotically self-similar under exactly that factor, so level L+1 looks like level L and the zoom can loop forever.
//
// v0.2 §16: the picture is no longer recomputed every frame. The field does not move — only the camera does — so the
// mathematics is rendered once per zoom rung (`ladder.js`, `field.js`) into a target of its own, progressively, a
// bounded band of rows per draw, one rung ahead of the dive; every frame the colour pass (`colour.js`) samples the
// built rung through the current camera and does the music. Steady state is a colour pass plus one slice of the next
// rung at ANY depth, instead of 30*L^2 iterations per pixel per frame. See help.why / help.math.
import { FS_FIELD } from './field.js';
import { FS_COLOUR } from './colour.js';
import * as LD from './ladder.js';

const C_FEIG = -1.401155189092051;    // the Feigenbaum point: the accumulation of the period-doubling cascade
const DELTA_F = LD.DELTA;             // Feigenbaum's delta: the ratio the cascade (and so this zoom) is self-similar by
const FEIG_MAX = [3.4, 4, 4.6, 5];    // how deep the dive is allowed to go per quality tier (the 512-tap reference orbit)

// Everything update() reads out of MS / LOOK, held for draw(). No hidden timers: every entry traces to MS.
const S = {
  feigL: 0, tricorn: 0,
  cx: 0, cy: 0, width: 3.2, rot: 0,
  lvl: 0, kick: 0, drop: 0, hat: 0, flow: 0, midS: 0, tension: 0, alive: 0, histRow: 0,
  hue: 0, sat: 1, bri: 1, invert: 0, clipdbg: 0,
};
// The ladder's GL side: three rung slots (the rung on screen, the one being built, the one the cross-fade still
// reads) plus one quarter-resolution target for rule 3. Nothing here is keyed on wall time — only on feigL, the
// tier, and the draw counter, which is what keeps #test bit-identical with the progressive schedule running.
const F = {
  aspect: 16 / 9, tw: 0, th: 0, cw: 0, ch: 0, dens: 0,
  slots: [LD.mkSlot(), LD.mkSlot(), LD.mkSlot()], coarse: { r: -1, tricorn: 0, ok: false, rect: null }, ctex: null,
  draws: 0, blendK: 0, prevIdx: -1, key: '', cur: null, prev: null, plan: null,
  standin: 1, jump: 1, pinTric: 0, logR: -1, logHow: '',
};
let CTX = null, PF = null, ORB = null;   // ctx, the field program, the reference-orbit texture
let prevKick = 0;    // rising edge of MS.kick: the wrap hides itself in a hit
let wasLogical = false;

function alloc(w, h) {
  const ctx = CTX, gl = ctx.gl;
  F.aspect = w / Math.max(h, 1);
  const sz = LD.rungSize(F.aspect, h, gl.getParameter(gl.MAX_TEXTURE_SIZE));
  F.tw = sz.tw; F.th = sz.th; F.dens = sz.dens;
  F.cw = Math.max(8, Math.ceil(sz.tw / LD.COARSE_DIV)); F.ch = Math.max(8, Math.ceil(sz.th / LD.COARSE_DIV));
  for (const s of F.slots) { if (s.tex) ctx.freeTarget(s.tex); s.tex = ctx.mkTarget(F.tw, F.th, false, false); }
  if (F.ctex) ctx.freeTarget(F.ctex);
  F.ctex = ctx.mkTarget(F.cw, F.ch, false, false);   // rule 3's quarter-resolution burst target
  invalidate();
}
function invalidate() {
  for (const s of F.slots) { s.r = -1; s.built = 0; }
  F.coarse.ok = false; F.coarse.r = -1; F.key = ''; F.cur = null; F.prev = null; F.prevIdx = -1; F.blendK = 0;
}
function mkSrc(idx, r, how, cx, cy, wd) {
  const s = F.slots[idx];
  return { key: 's' + idx, idx, tex: s.tex, rect: s.rect, sw: F.tw, sh: F.th, cx, cy, wd, r, how };
}
function renderField(tex, tw, th, rect, iter, tric, y, rows) {
  const ctx = CTX, gl = ctx.gl, pr = PF;
  ctx.use(pr, tex, tw, th);
  gl.uniform4f(pr.u('uRect'), rect.x0, rect.x1, rect.y1, 0);
  gl.uniform2f(pr.u('uFieldSz'), tw, th);
  gl.uniform1f(pr.u('uTricorn'), tric);
  gl.uniform1i(pr.u('uIter'), iter);
  ctx.tex(pr, 'uOrbit', 0, ORB);
  gl.enable(gl.SCISSOR_TEST);
  gl.scissor(0, y, tw, rows);
  ctx.tri();
  gl.disable(gl.SCISSOR_TEST);
}
function builtRows(r) {
  for (let i = 0; i < 3; i++) if (F.slots[i].r === r && F.slots[i].tricorn === S.tricorn) return F.slots[i].built;
  return 0;
}

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
    CTX = ctx;
    PF = ctx.mkProg(FS_FIELD, 'feigen-field');
    this.pc = ctx.mkProg(ctx.oklch + FS_COLOUR, 'feigen-colour');   // OKLCH: the chunk goes in front, after HEAD
    // The reference orbit Z_n of c_inf, in JS doubles, stored as float32. Only the per-pixel OFFSET needs precision,
    // which is the whole point of the perturbation method — the reference may be single once it is computed exactly.
    const gl = ctx.gl, orb = new Float32Array(512);
    let z = 0;
    for (let i = 0; i < 512; i++) { orb[i] = z; z = z * z + C_FEIG; }
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, 512, 1, 0, gl.RED, gl.FLOAT, orb);   // R32F + texelFetch: no extension in WebGL2
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
    ORB = { t };
    ctx.onResize(alloc);   // the rung ring lives and dies with the size: allocated before the first frame
  },

  update(dt, MS, GROOVE, LOOK, env) {
    const ctx = this.ctx;
    const m = LOOK.mood;
    // The conjugation is keyed on the section seed, not the drop: this engine's director hard-cuts to the home scene
    // on a drop, so a drop-keyed flip would never be on screen when it happened. It invalidates every rung (they
    // carry the flag) — the one declared cut, so the burst of rule 3 on that frame is honest.
    if (MS.sectionEvt && !F.pinTric) {
      const tc = Math.floor(MS.seed.a * 1000) % 2;
      if (tc !== S.tricorn) { S.tricorn = tc; invalidate(); }
    }

    // the dive: one delta per unit of L, paced by musical time, faster when loud, slower when tense, frozen in silence
    const period = 60 / Math.max(MS.bpm, 40);
    S.feigL += dt / (32 * period) * (0.25 + 1.5 * MS.lvl) * (1 - 0.8 * MS.tension) * MS.alive;
    const fmax = FEIG_MAX[ctx.tier()];
    if (S.feigL > fmax + 1) { S.feigL -= 1; F.jump = -1; }
    if (MS.kick > 0.5 && prevKick <= 0.5 && S.feigL > fmax) { S.feigL -= 1; F.jump = -1; }   // self-similar wrap, hidden in a kick
    prevKick = MS.kick;
    if (MS.dropEvt) { S.feigL += 1; F.jump = 1; }   // a jump by exactly one delta is self-similar (see help.why)

    const logical = !!(env && env.SC && env.SC.logical === this.id);
    if (logical && !wasLogical) S.feigL = Math.min(S.feigL, 1.2);   // arrive shallow, so the dive has somewhere to go
    wasLogical = logical;

    const L = S.feigL;
    const wd = 3.2 * Math.pow(DELTA_F, -L) * (1 + 0.25 * MS.tension - 0.18 * MS.dropEnv - 0.03 * MS.kick);
    S.cx = wd * (0.30 + 0.02 * Math.sin(MS.flowMid * 0.2));
    S.cy = wd * 0.03 * Math.sin(MS.flowMid * 0.13);
    S.width = wd;
    S.rot = 0.04 * Math.sin(MS.flowMid * 0.17);

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
    S.invert = m.invert;
    this.rt.time = MS.flow;
    this.rt.label = 'L' + S.feigL.toFixed(2);
  },

  draw(target, { w, h }) {
    const ctx = this.ctx;
    const gl = ctx.gl;
    const pr = this.pc;
    if (!F.slots[0].tex) alloc(w, h);
    F.draws++;
    const tier = ctx.tier(), L = Math.max(0, S.feigL), r = LD.rungOf(L);

    // --- what to show: the rung itself, else the self-similar stand-in, else a coarser rung, else a burst (rule 3)
    let src = null, cut = false, i = LD.findBuilt(F.slots, r, S.tricorn, F.th);
    if (i >= 0) src = mkSrc(i, r, 'built', S.cx, S.cy, S.width);
    if (!src && F.standin) {
      const st = LD.findStandin(F.slots, L, S.tricorn, F.th, F.jump >= 0 ? -1 : 1);
      if (st) {
        const k = Math.pow(DELTA_F, -st.k);   // the camera of the virtual level: wd*delta^(L-Lv), same roll
        src = mkSrc(st.idx, st.r, 'standin(' + st.k + ')', S.cx * k, S.cy * k, S.width * k);
      }
    }
    if (!src) {
      i = LD.findCoarser(F.slots, r, S.tricorn, F.th);
      if (i >= 0) src = mkSrc(i, F.slots[i].r, 'coarser(' + (r - F.slots[i].r) + ')', S.cx, S.cy, S.width);
    }
    if (!src && F.coarse.ok && F.coarse.r === r && F.coarse.tricorn === S.tricorn) {
      src = { key: 'q' + r, idx: -1, tex: F.ctex, rect: F.coarse.rect, sw: F.cw, sh: F.ch, cx: S.cx, cy: S.cy, wd: S.width, r, how: 'coarse' };
    }
    if (!src) {
      // rule 3: nothing usable — one draw of the whole rung at a quarter of the resolution per side, then refine
      const rect = LD.rungRect(r, F.aspect);
      renderField(F.ctex, F.cw, F.ch, rect, LD.iterFor(r), S.tricorn, 0, F.ch);
      F.coarse.r = r; F.coarse.tricorn = S.tricorn; F.coarse.ok = true; F.coarse.rect = rect;
      src = { key: 'q' + r, idx: -1, tex: F.ctex, rect, sw: F.cw, sh: F.ch, cx: S.cx, cy: S.cy, wd: S.width, r, how: 'coarse' };
      cut = true;
    }

    // --- the cross-fade, in field space: a rung change and the arrival of a rung that was standing in are both
    // resolution fades of the same mathematics. A burst is a declared cut and does not fade.
    if (src.key !== F.key) {
      if (F.key && F.cur && !cut) { F.prev = F.cur; F.prevIdx = F.cur.idx; F.blendK = LD.BLEND_DRAWS; }
      else { F.prev = null; F.prevIdx = -1; F.blendK = 0; }
      F.key = src.key;
    }
    F.cur = src;
    if (F.blendK > 0) { F.blendK--; if (!F.blendK) { F.prev = null; F.prevIdx = -1; } }
    const bl = F.blendK / LD.BLEND_DRAWS;
    const how = bl > 0 ? 'blend' : src.how;
    if (src.r !== F.logR || how !== F.logHow) {
      ctx.log('RUNG@' + F.draws + ' r' + src.r + ' L' + L.toFixed(3) + ' ' + how);
      F.logR = src.r; F.logHow = how;
    }

    // --- one bounded slice of the field: the rung the dive is in if it is unfinished, else the next one down
    if (!cut) {
      const p = LD.planBuild(F.slots, L, tier, S.tricorn, F.tw, F.th, [src.idx, F.prevIdx]);
      F.plan = p;
      if (p) {
        const s = F.slots[p.idx];
        if (p.fresh) { s.r = p.r; s.tricorn = S.tricorn; s.iter = p.iter; s.built = 0; s.rect = LD.rungRect(p.r, F.aspect); }
        renderField(s.tex, F.tw, F.th, s.rect, s.iter, s.tricorn, p.y, p.rows);
        s.built = p.y + p.rows;
      }
    }

    // --- the colour pass: the music, into the target the core handed us
    const pv = F.prev || src;
    ctx.use(pr, target, w, h);
    gl.uniform4f(pr.u('uRect'), src.rect.x0, src.rect.x1, src.rect.y1, 0);
    gl.uniform4f(pr.u('uRect2'), pv.rect.x0, pv.rect.x1, pv.rect.y1, 0);
    gl.uniform2f(pr.u('uSz'), src.sw, src.sh);
    gl.uniform2f(pr.u('uSz2'), pv.sw, pv.sh);
    gl.uniform2f(pr.u('uCentre'), src.cx, src.cy);
    gl.uniform2f(pr.u('uCentre2'), pv.cx, pv.cy);
    gl.uniform1f(pr.u('uWidth'), src.wd);
    gl.uniform1f(pr.u('uWidth2'), pv.wd);
    gl.uniform1f(pr.u('uBlend'), bl);
    gl.uniform1f(pr.u('uRot'), S.rot);
    gl.uniform1f(pr.u('uHistRow'), S.histRow);
    gl.uniform1f(pr.u('uLevel'), S.lvl);
    gl.uniform1f(pr.u('uKick'), S.kick);
    gl.uniform1f(pr.u('uDrop'), S.drop);
    gl.uniform1f(pr.u('uHat'), S.hat);
    gl.uniform1f(pr.u('uFlow'), S.flow);
    gl.uniform1f(pr.u('uMidS'), S.midS);
    gl.uniform1f(pr.u('uTension'), S.tension);
    gl.uniform1f(pr.u('uAlive'), S.alive);
    gl.uniform1f(pr.u('uHue'), S.hue); gl.uniform1f(pr.u('uSat'), S.sat); gl.uniform1f(pr.u('uBri'), S.bri);
    gl.uniform1f(pr.u('uInvert'), S.invert); gl.uniform1f(pr.u('uClipDbg'), S.clipdbg);
    ctx.tex(pr, 'uField', 0, src.tex);
    ctx.tex(pr, 'uField2', 1, pv.tex);
    ctx.tex(pr, 'uSpec', 2, ctx.engineTex.spec);
    ctx.tex(pr, 'uHist', 3, ctx.engineTex.hist);
    ctx.tri();

    this.rt.log = 'r' + r + ' ' + how + ' b' + builtRows(r) + '/' + F.th + ' next r' + (r + 1) + ' b' + builtRows(r + 1)
      + '/' + F.th + ' it' + LD.iterFor(F.plan ? F.plan.r : r) + ' rows' + (F.plan ? F.plan.rows : 0)
      + ' ' + F.tw + 'x' + F.th + ' t' + tier;
  },

  // The set already carries its own symmetry (the cascade repeats down the real axis), so a kaleidoscope on top would
  // fake a symmetry the mathematics does not have — it is off here. Short trails keep the filaments from crawling.
  post: { fb: { decay: 0.55 }, bloom: { thr: 0.6 }, kaleido: 0 }, // bloom 0.3 → 0.6 with the OKLCH pass (§19 worker): the bright pixels are plateaux now, not filaments

  rt: {},

  hud() { return 'feigen L' + S.feigL.toFixed(2) + ' r' + LD.rungOf(Math.max(0, S.feigL)) + (S.tricorn ? ' tricorn' : ''); },

  // &feig=3&tricorn=1&standin=0 under #test. Setting the depth also marks the scene as already arrived: otherwise the
  // arrive-shallow clamp above fires on the first frame the hook's scene becomes logical and undoes it. Hooks fire
  // before init(), so everything they touch lives on these module-level objects, never in init.
  hooks: {
    feig(v) { S.feigL = +v; wasLogical = true; },
    // pinned, or the next sectionEvt redraws the flip from the seed and throws the hook away (as §15's clamp ate &feig)
    tricorn(v) { S.tricorn = +v ? 1 : 0; F.pinTric = 1; invalidate(); },   // a flip invalidates every rung, even a no-op one
    standin(v) { F.standin = +v ? 1 : 0; },
    clipdbg(v) { S.clipdbg = +v || 0; },   // colour.js' gamut (1) and field (2) probes, read back through an RGBA8 target
  },

  help: {
    // what each field in `feats` moves on this screen (CONTRACTS §1.13)
    feats: {
      arc: 'never auto-picked during a build',
      regularity: 'the bid: a steady rhythm',
      clarity: 'the bid: clearly tonal music',
      calm: 'the bid: quiet and unhurried',
      bpm: 'sets the dive\'s clock: one Feigenbaum level per 32 beats at full level',
      lvl: 'how fast the dive falls, and the overall lightness',
      tension: 'slows the dive, widens the view, and lights the interior',
      alive: 'silence freezes the dive and fades to black',
      kick: 'a lightness pulse, a slight zoom in, and the hidden level wrap',
      dropEvt: 'the depth jumps one whole Feigenbaum factor — self-similar, so you barely see it',
      sectionEvt: 'redraws the tricorn flip from the section seed',
      seed: 'decides the flip: conj(z)^2 + c instead of z^2 + c for this section',
      flow: 'the Green\'s-function iso-lightness bands drift outward on musical time',
      flowMid: 'the centre wanders along the axis and the frame rolls a few degrees',
      bass: 'narrows the black boundary edge and lights the interior trap',
      dropEnv: 'zooms in hard and lifts the whole field\'s lightness',
      hat: 'lifts the Green bands\' lightness',
      midS: 'how strongly the spectrogram\'s past lightens the field off the boundary',
    },
    eli5: 'A never-ending zoom into the edge of the Mandelbrot set, falling along its spine toward one exact point. '
      + 'The shape you are falling into repeats: every time you have zoomed in by the same magic factor (about 4.67x) '
      + 'you are looking at a smaller copy of where you started, so the fall can go on forever without ever cutting. '
      + 'The music sets how fast you fall, how bright the filaments burn, and once in a while mirrors the whole set. '
      + 'The picture itself is drawn once for each doubling of the zoom, a few lines at a time, while you are still '
      + 'falling toward it — so however deep you go, each frame only has to colour it in.',
    why: 'The point at the bottom is where the period-doubling cascade piles up — the same cascade that makes a system '
      + 'go from one rhythm to two to four to chaos. Its rungs shrink by a universal constant, so the picture is '
      + 'self-similar under exactly that factor and nothing else. That is the trick the whole scene rests on: when the '
      + 'drop lands the depth jumps by a full level, and because level L+1 is a copy of level L, a jump that large is '
      + 'almost invisible — the scene teleports on the beat and you read it as a flare, not a cut. The same identity '
      + 'lets the dive wrap silently once it reaches the depth its tier can hold: it steps back one level inside a '
      + 'kick. The zoom is exact, not faked, because the arithmetic never zooms: only the offsets do. And it is cheap '
      + 'for the same reason it is seamless. The set does not move; only the camera does, and the camera is an affine '
      + 'map that changes by a fifth of a percent per frame. So the mathematics is computed once per doubling of the '
      + 'zoom — a ladder rung — a bounded band of rows per frame, one rung ahead of the fall, and every frame is a '
      + 'colouring of the rung that is already there. A rung that needs 500 iterations per point just takes more '
      + 'frames to build, and it has six seconds. The cost of the scene stopped depending on how deep it is, which '
      + 'matters because the quality knob is shared: one expensive scene dims every other one for half a minute. '
      + 'And the colour is not a palette laid over it: hue is the external angle, lightness the distance estimate with the Green\'s potential '
      + 'rippling it, chroma the same distance fading to black at the edge — the three coordinates the field already carries. A ray landing on a wake is a '
      + 'line of constant hue, a level set of the potential a ripple of lightness, and the edge stays a pixel '
      + 'wide however deep you fall, because the distance to the set draws it and not a filter.',
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
      + 'min|z_n|, which is small exactly where the orbit is nearly periodic. Amortisation (v0.2 §16): everything in '
      + 'that loop is a function of c alone — n, ln r, ln|z\'|, the escape angle, the trap — so it is a FIELD, and '
      + 'only the colouring depends on the music. The field is rendered per ladder rung: one rung is a factor two in '
      + 'the view width, ln2/ln(delta) = 0.4498 levels, at twice the screen\'s texel density over a rectangle that '
      + 'provably contains every view the modulation can ask for (the upper half-plane only: both sets are symmetric '
      + 'under c -> conj(c) and the colouring is symmetric under ea -> 1 - ea). The per-frame pass fetches four texels '
      + 'and bilinearly blends the DECODED quantities log d and log2 G, which are continuous functions of c where the '
      + 'raw escape count is not, the angle as a unit vector because it wraps, and the interior sign not at all. A '
      + 'rung change cross-fades in field space over 30 frames; a drop stands in with the rung one level up under the '
      + 'camera of that level, which by self-similarity is the same picture.',
  },
};
