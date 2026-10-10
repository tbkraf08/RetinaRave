// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// Solver after Pavel Dobryakov, WebGL-Fluid-Simulation (MIT, 2017) — https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
// The fluid as the engine's SUBSTRATE (FLUID-PLAN Step 1, DECISIONS §104): a Stam solver stepped once per frame right after
// uploadEngineTex (loop.js), publishing ctx.engineTex.vel (RG16F, uv/s) and .dye (RGBA16F, linear colour) on ETEX, and the
// ctx.fluid API {splat, force, ring, params, on, tex}. inject.js is the MS → force grammar (pure); this file owns the GL: the
// ping-pong targets per tier (SIM / DYE short edges with the canvas aspect, re-allocated with a bilinear copy on a tier
// change so the picture never resets), the passes, the &fluiddbg= overlay and the bench. Needs G.FLOAT (EXT_color_buffer_float):
// without it the substrate is OFF — avail false, on false, the two 1×1 black placeholders stay bound so a sampler always binds.
// Step 1 has no consumer: every md5 holds (the proof is in §104). Velocity unit: screen fractions per second, everywhere.
import { G, ETEX, mkProg, use, tex, tri } from '../gl.js';
import { tier } from '../quality.js';
import { ema } from '../../math/util.js';
import { plan, mkState, K } from './inject.js';
import * as SH from './shaders.js';

export const SIM = [64, 96, 128, 128];     // the sim grid's short edge per tier (ctx.tier())
export const DYE = [256, 384, 512, 512];   // the dye's
export const ITER = [10, 14, 20, 20];      // pressure Jacobi iterations per tier
const MAXS = 16;                           // splats per draw (the uniform array's size in shaders.js)

// CARD.fluid (harness) and ctx.fluid (scenes). `on` is the switch (&fluid=0, key W); `avail` says the device can run it at all.
export const FLUID = {
  on: true, avail: false, ms: 0, tier: -1, simW: 0, simH: 0, dyeW: 0, dyeH: 0, nSplat: 0, steps: 0, dbg: 0,
  params: { curl: 30, velDiss: 0.2, dyeDiss: 1, pressure: 0.8, iters: 20, radius: 0.0025 }, // the live values after inject.js; a scene may override for the frame
  tex: null,        // { vel, dye }: the same objects as ctx.engineTex.vel / .dye
  queue: [],        // this frame's splats: {x, y, dx, dy, r, g, b, rad} — inject.js fills it, scenes add through splat(), the step drains it
  body: [0, 0],     // a scene's uniform body force this frame (uv/s²), through force(); the beat's breath is inject.js's and shaped
  wave: null,       // §113 the shockwave this step: {a, r, w} — the grammar's ring (inject.js) or a scene's through ring(); the step applies and clears it
  K,                // the grammar's constants (inject.js), live — harness only: `CARD.fluid.K.FLOOR_DYE = 0` from an eval is a one-knob A/B (§108)
  // splat(x, y, dx, dy, rgb, r?): x y in uv, dx dy in uv/s (added once), rgb linear 0..1, r the radius (default params.radius)
  splat(x, y, dx, dy, rgb, r) { this.queue.push({ x, y, dx, dy, r: rgb[0], g: rgb[1], b: rgb[2], rad: r === undefined ? this.params.radius : r }); },
  force(fx, fy) { this.body[0] += fx; this.body[1] += fy; },
  // ring(a, r, w): §113 the force kind the Gaussian splat cannot express — a radial velocity ring round the screen's centre, A in uv/s at the
  // front r (screen heights from the centre), w wide; SET into the velocity on the next step (the same one-frame caveat as splat). The
  // grammar's own shockwave is applied on the frame it fires; where both are set the larger amplitude wins.
  ring(a, r, w) { if (a > 0 && (!this.wave || a > this.wave.a)) this.wave = { a, r, w: Math.max(1e-3, w) }; },
};

let gl = null, P = {}, st = null, ph = null;
let vel = [null, null], dye = [null, null], prs = [null, null], div = null, curl = null; // [read, write] pairs
let lastW = 0, lastH = 0;

function mkT(w, h, ifmt, fmt, linear) {
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, ifmt, w, h, 0, fmt, gl.HALF_FLOAT, null);
  const fl = linear ? gl.LINEAR : gl.NEAREST;
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, fl], [gl.TEXTURE_MAG_FILTER, fl], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  const f = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, f);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  return { t, f, w, h };
}
const freeT = (r) => { if (r) { gl.deleteTexture(r.t); gl.deleteFramebuffer(r.f); } };
const swap = (p) => { const a = p[0]; p[0] = p[1]; p[1] = a; };

// The grid for a short edge at the canvas aspect: square texels, the cost set by the short edge and not by DPR.
function grid(short) {
  const W = G.PW, H = G.PH;
  return W >= H ? [Math.round(short * W / H), short] : [short, Math.round(short * H / W)];
}

// (Re)allocate for the tier; the old velocity and dye are copied in bilinearly (the reference's resizeFBO idea).
function alloc(tr) {
  const [sw, sh] = grid(SIM[tr]), [dw, dh] = grid(DYE[tr]);
  const nv = [mkT(sw, sh, gl.RG16F, gl.RG, true), mkT(sw, sh, gl.RG16F, gl.RG, true)];
  const nd = [mkT(dw, dh, gl.RGBA16F, gl.RGBA, true), mkT(dw, dh, gl.RGBA16F, gl.RGBA, true)];
  if (vel[0]) { copy(vel[0], nv[0]); copy(dye[0], nd[0]); }
  for (const r of [...vel, ...dye, ...prs, div, curl]) freeT(r);
  vel = nv;
  dye = nd;
  prs = [mkT(sw, sh, gl.R16F, gl.RED, false), mkT(sw, sh, gl.R16F, gl.RED, false)];
  div = mkT(sw, sh, gl.R16F, gl.RED, false);
  curl = mkT(sw, sh, gl.R16F, gl.RED, false);
  FLUID.tier = tr;
  FLUID.simW = sw; FLUID.simH = sh; FLUID.dyeW = dw; FLUID.dyeH = dh;
  FLUID.params.iters = ITER[tr];
  lastW = G.PW; lastH = G.PH;
  publish();
}
function copy(from, to) {
  const pr = pass(P.scale, to);
  tex(pr, 'uSrc', 0, from);
  gl.uniform1f(pr.u('uK'), 1);
  tri();
}
// What a sampler sees: the live read textures while on, the placeholders while off (the objects never change identity).
function publish() {
  const on = FLUID.avail && FLUID.on;
  const V = ETEX.vel, D = ETEX.dye;
  V.t = on ? vel[0].t : ph.t; V.w = on ? vel[0].w : 1; V.h = on ? vel[0].h : 1;
  D.t = on ? dye[0].t : ph.t; D.w = on ? dye[0].w : 1; D.h = on ? dye[0].h : 1;
  ETEX.simW = on ? vel[0].w : 0; ETEX.simH = on ? vel[0].h : 0; ETEX.dyeW = on ? dye[0].w : 0; ETEX.dyeH = on ? dye[0].h : 0;
}

export function initFluid(ctx) {
  gl = G.gl;
  // the placeholders: 1×1 black, bound whenever the substrate is off or unavailable
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  ph = { t, w: 1, h: 1 };
  ETEX.vel = { t, w: 1, h: 1 };
  ETEX.dye = { t, w: 1, h: 1 };
  FLUID.tex = { vel: ETEX.vel, dye: ETEX.dye };
  FLUID.avail = !!G.FLOAT;
  if (!FLUID.avail) { FLUID.on = false; return; }
  for (const [k, src] of [['splat', SH.SPLAT], ['curl', SH.CURL], ['vort', SH.VORT], ['div', SH.DIV], ['scale', SH.SCALE], ['jacobi', SH.JACOBI], ['grad', SH.GRAD], ['advect', SH.ADVECT], ['dbg', SH.DBG]]) P[k] = mkProg(src, 'fluid-' + k);
  st = mkState();
  ctx.onResize(() => alloc(tier())); // the canvas changed: the grids follow its aspect (the old picture copied in)
}

// The switch (key W, &fluid=0): off = no step, the placeholders bound. On a device without float targets it stays off.
export function setFluid(on) {
  FLUID.on = !!on && FLUID.avail;
  if (vel[0]) publish();
  return FLUID.on;
}

// Bind a program on a target (viewport = the target), with its texel size when the pass is a stencil. Returns the program:
// every uniform below is fetched through this `pr` (check.js's dead-uniform scan reads `tex(pr, 'uX'` and `pr.u('uX')`).
function pass(pr, tgt, texel) {
  use(pr, tgt, tgt.w, tgt.h);
  if (texel) gl.uniform2f(pr.u('uTexel'), 1 / tgt.w, 1 / tgt.h);
  return pr;
}

// One step. dt the loop's (1/60 under CLOCK=1), S the finished MS of this frame, resumed = ENGINE.resumed (the frame's events
// are masked, as FX is cleared). Leaves BLEND / DEPTH_TEST / SCISSOR off (renderScene's entry state).
export function stepFluid(dt, S, resumed) {
  if (!FLUID.avail || !FLUID.on) return;
  const t0 = performance.now();
  const tr = tier();
  if (tr !== FLUID.tier || G.PW !== lastW || G.PH !== lastH) alloc(tr);
  const pm = FLUID.params, q = FLUID.queue;
  let pr;
  let breath = 0;
  if (!resumed) {
    const R = plan(S, dt, st);   // §111: the grammar colours the pool from the key (pinned at KEY_TRUST) and the harmony, never LOOK's mood
    for (const s of R.splats) q.push(s);
    breath = R.body;
    pm.curl = R.params.curl; pm.velDiss = R.params.velDiss; pm.dyeDiss = R.params.dyeDiss; pm.pressure = R.params.pressure; pm.radius = R.params.radius;
    if (R.ring) FLUID.ring(R.ring.a, R.ring.r, R.ring.w);   // §113 the shockwave, this step
  }
  const wave = FLUID.wave;
  FLUID.nSplat = q.length;
  gl.disable(gl.BLEND);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.SCISSOR_TEST);
  const sx = vel[0].w, sy = vel[0].h, aspect = G.PW / G.PH;
  // splats: every one of the frame in one draw per target (chunks of MAXS), velocity then dye. A chunk with no force in it (§108's
  // harmonic floor is dye only, and on a pad it is the frame's only splat) skips the velocity draw: "dye only" then means the
  // velocity target is not touched at all, not "re-written with + 0" (that re-write was measured bit-exact — the s0 md5 pair is the
  // same with and without this skip — so this is a guard and one draw saved per pad frame, not a fix).
  if (q.length) {
    const A = new Float32Array(MAXS * 4), C = new Float32Array(MAXS * 4);
    for (let i0 = 0; i0 < q.length; i0 += MAXS) {
      const n = Math.min(MAXS, q.length - i0);
      let anyV = false;
      for (let i = 0; i < n; i++) { const s = q[i0 + i]; A.set([s.x, s.y, s.dx, s.dy], i * 4); C.set([s.r, s.g, s.b, Math.max(1e-5, s.rad)], i * 4); if (s.dx || s.dy) anyV = true; }
      for (const [pair, isDye] of [[vel, 0], [dye, 1]]) {
        if (!isDye && !anyV) continue;
        pr = pass(P.splat, pair[1]);
        tex(pr, 'uSrc', 0, pair[0]);
        gl.uniform4fv(pr.u('uSplat'), A);
        gl.uniform4fv(pr.u('uCol'), C);
        gl.uniform1i(pr.u('uN'), n);
        gl.uniform1f(pr.u('uAspect'), aspect);
        gl.uniform1i(pr.u('uDye'), isDye);
        tri();
        swap(pair);
      }
    }
    q.length = 0;
  }
  // curl → vorticity confinement
  pr = pass(P.curl, curl, true);
  tex(pr, 'uVel', 0, vel[0]);
  gl.uniform2f(pr.u('uScale'), sx, sy);
  tri();
  pr = pass(P.vort, vel[1], true);
  tex(pr, 'uVel', 0, vel[0]);
  tex(pr, 'uCurl', 1, curl);
  gl.uniform2f(pr.u('uScale'), sx, sy);
  gl.uniform1f(pr.u('uCurlK'), pm.curl);
  gl.uniform1f(pr.u('uDt'), dt);
  tri();
  swap(vel);
  // divergence → pressure (warm-started × pressure, ITER Jacobi sweeps) → projection
  pr = pass(P.div, div, true);
  tex(pr, 'uVel', 0, vel[0]);
  gl.uniform2f(pr.u('uScale'), sx, sy);
  tri();
  pr = pass(P.scale, prs[1]);
  tex(pr, 'uSrc', 0, prs[0]);
  gl.uniform1f(pr.u('uK'), pm.pressure);
  tri();
  swap(prs);
  for (let i = 0; i < pm.iters; i++) {
    pr = pass(P.jacobi, prs[1], true);
    tex(pr, 'uP', 0, prs[0]);
    tex(pr, 'uDiv', 1, div);
    tri();
    swap(prs);
  }
  pr = pass(P.grad, vel[1], true);
  tex(pr, 'uP', 0, prs[0]);
  tex(pr, 'uVel', 1, vel[0]);
  gl.uniform2f(pr.u('uScale'), sx, sy);
  tri();
  swap(vel);
  // advect the velocity (with the breath and a scene's body force), then the dye at its own resolution
  pr = pass(P.advect, vel[1]);
  tex(pr, 'uVel', 0, vel[0]);
  tex(pr, 'uSrc', 1, vel[0]);
  gl.uniform1f(pr.u('uDt'), dt);
  gl.uniform1f(pr.u('uDiss'), pm.velDiss);
  gl.uniform1f(pr.u('uBody'), breath);
  gl.uniform2f(pr.u('uForce'), FLUID.body[0], FLUID.body[1]);
  gl.uniform1f(pr.u('uAspect'), aspect);
  gl.uniform3f(pr.u('uRing'), wave ? wave.a : 0, wave ? wave.r : 0, wave ? wave.w : 1);   // §113: no extra draw — the ring rides the velocity advect
  gl.uniform1i(pr.u('uDye'), 0);
  tri();
  swap(vel);
  pr = pass(P.advect, dye[1]);
  tex(pr, 'uVel', 0, vel[0]);
  tex(pr, 'uSrc', 1, dye[0]);
  gl.uniform1f(pr.u('uDiss'), pm.dyeDiss);
  gl.uniform1f(pr.u('uBody'), 0);
  gl.uniform2f(pr.u('uForce'), 0, 0);
  gl.uniform1f(pr.u('uAspect'), aspect);
  gl.uniform3f(pr.u('uRing'), wave ? wave.a : 0, wave ? wave.r : 0, wave ? wave.w : 1);   // §113: the ring's divergence dilutes / compacts the ink (the shader's dye branch)
  gl.uniform1i(pr.u('uDye'), 1);
  tri();
  swap(dye);
  FLUID.body[0] = FLUID.body[1] = 0;
  FLUID.wave = null;
  FLUID.steps++;
  publish();
  FLUID.ms = ema(FLUID.ms, performance.now() - t0, dt, 1);
}

// Harness only (&fluiddbg=1 the dye with the velocity inset bottom-right, 2 the velocity alone): drawn over the composite,
// after the chain and before the overlays — the normal path never calls it (FLUID.dbg is 0 unless the hash sets it).
export function drawFluidDbg() {
  const pr = P.dbg;
  if (!pr) return;
  gl.disable(gl.BLEND);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.SCISSOR_TEST);
  use(pr, null, G.PW, G.PH);
  tex(pr, 'uDye', 0, ETEX.dye);
  tex(pr, 'uVel', 1, ETEX.vel);
  gl.uniform4f(pr.u('uInset'), 0.66, 0, 0.34, 0.34);
  gl.uniform1f(pr.u('uGain'), 1);
  gl.uniform1i(pr.u('uMode'), FLUID.dbg);
  tri();
}

// ms per step at the current tier, readPixels-synced on the dye target (HARNESS "Bench protocol": q pinned, n ≥ 300, medians,
// interleaved with bench(0, 300)). S is the MS to plan from (static during the call — no events fire; the solver's cost is what is measured).
// §113: `ring` ({a, r, w}, optional) is held on every step — the shockwave's cost at the tier (the same program; a uniform branch).
export function benchFluid(n, S, ring) {
  if (!FLUID.avail || !FLUID.on) return -1;
  const sync = () => { gl.bindFramebuffer(gl.FRAMEBUFFER, dye[0].f); gl.readPixels(dye[0].w >> 1, dye[0].h >> 1, 1, 1, gl.RGBA, gl.FLOAT, new Float32Array(4)); };
  const hold = () => { if (ring) FLUID.ring(ring.a, ring.r, ring.w); };
  hold(); stepFluid(1 / 60, S, false);
  sync();
  const t = performance.now();
  for (let i = 0; i < n; i++) {
    hold(); stepFluid(1 / 60, S, false);
    if (i % 8 === 7) sync();
  }
  sync();
  return (performance.now() - t) / n;
}

export const fluidLine = () => (FLUID.avail
  ? (FLUID.on ? `fluid ${FLUID.ms.toFixed(2)} ms  sim ${FLUID.simW}x${FLUID.simH}  dye ${FLUID.dyeW}x${FLUID.dyeH}  tier ${FLUID.tier}  iters ${FLUID.params.iters}  splats ${FLUID.nSplat}  curl ${FLUID.params.curl.toFixed(0)} vd ${FLUID.params.velDiss.toFixed(2)} dd ${FLUID.params.dyeDiss.toFixed(2)}` : 'fluid off (W)')
  : 'fluid unavailable (no float render targets)');
