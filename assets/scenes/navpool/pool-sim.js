// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// Solver after Pavel Dobryakov, WebGL-Fluid-Simulation (MIT, 2017) — https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
// NAVPOOL's OWN fluid (DECISIONS §149 unit 2): a Stam solver like the core substrate's (assets/core/fluid/fluid.js — its tier tables and
// its pass order, read, not imported) in which the JULIA SET'S BOUNDARY IS A SOLID WALL that moves with the dance. Each step: the mask
// (the Julia escape test at the sim grid with the picture's own uniforms) → the splats (pool.js's: the critical orbit, the kick, the drop
// ring) → the wall's velocity in the solid cells → §151 the edge's velocity with inertia → the paddle (the edge pushes a near-wall band
// of the fluid where it is going, one-sided, so the pool coasts on after it stops) → divergence → pressure Jacobi (Neumann at the wall) → gradient →
// advect the velocity → advect the dye (nothing back-traced out of the wall; the dye in the wall fades). No grammar layer: the scene's
// own splats are the forcing. Everything is ctx.mkTarget (RGBA16F, LINEAR, CLAMP); the step runs in draw(), once per update().
// Needs float render targets (ctx.fluid.avail) and honours the user's switch (ctx.fluid.on: key W, &fluid=0): off, nothing runs and the
// interior falls back to NAV3's own.
import * as SH from './pool-shaders.js';

const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);

export const KS = {
  SIM: [64, 96, 128, 128],     // the sim grid's short edge per ctx.tier() — the core's table
  DYE: [256, 384, 512, 512],   // the dye's — the core's
  ITER: [10, 14, 20, 20],      // pressure Jacobi sweeps — the core's
  VEL_DISS: 0.2,     // velocity dissipation per second (the core's)
  DYE_DISS: 0.35,    // dye dissipation per second (the core's 1 emptied a pool fed only by the orbit; .35 holds a swirl ~3 s)
  PRESSURE: 0.8,     // the pressure's warm start (the core's)
  RADIUS: 0.0025,    // the splat's Gaussian radius (the core's params.radius)
  WALL_K: 1,         // the wall's push: × the mask's change per second along its normal (1 = the edge's own speed: more is a net
                     //   compression the projection cannot absorb, and semi-Lagrangian advection loses the ink to it — 4 cost 5× the dye)
  WALL_VMAX: 120,    // … capped (texels/s: ~2 uv/s at the 128 grid — a kick's one-frame jump is a shove, not an explosion)
  FADE_TAU: 0.5,     // ink deep inside the wall (not touching the fluid) is held, fading with this time constant (a kick's dust frame keeps it)
  DYE_THR: 0.3,      // the dye's wall level on the mask (the velocity's is .75): the ink reaches the edge the picture draws
  SQUEEZE: 1,        // the share of the ink the wall sweeps over that lands on the rim (< 1 drains the flickering edge)
  INK_CAP: 0.5,      // a fluid texel's ink is capped here (linear; the picture is white well before): semi-Lagrangian copying is not conservative
  KICK_WALL: 3,      // on a kick the wall pushes (1 + KICK_WALL · the kick's envelope) × its own speed …
  KICK_TAU: 0.12,    // … the envelope's decay, s (a short excess compression: the shove you see, not a lasting one)
  EDGE_TAU: 0.06,    // §151 the paddle: the edge velocity's inertia, s (the one smoothing stage: a 1-frame flicker passes at 24 %, a stop falls to 5 % in .18 s)
  PADDLE_GAIN: 3,    // × the edge's speed (Toma's pick, §151: 1 added too little motion over the removal-only pool — A12)
  PADDLE_K: 8,       // /s: how fast the band's fluid takes up the paddle's speed
  PADDLE_BAND: 4,    // sim cells from the wall the paddle reaches (≤ 8; Toma's pick, §151)
  PADDLE_VMAX: 1.0,  // the paddle speed's cap (height units/s: uv · (asp, 1))
  EDGE_NORM: 1,      // × WALLV's normal speed in the edge's velocity (1 = the plan's: the observed normal motion + the rigid tangential part)
  SPIN_MAX: 6,       // rad/s: the view's spin rate is clamped here (the nod's one-frame jerks reach 12.7)
  GROW_MAX: 4,       // /s: the zoom rate's clamp (the drop's ≤ .099 a frame)
  EDGE_JUMP: 0.5,    // rad: a turn bigger than this in one step is a GAP (a seek / a cut), not a motion
  SLIP: 1,           // §151 (Toma's pick): the velocity's back-trace is mask-weighted as ADYE's — a solid tap reads the cell's own velocity:
                     //   free slip at the staircase wall (0 = the old bilinear blend of the wall's zero tangential velocity, a numerical no-slip drag that ate the coast)
  MAXS: 16,          // splats per draw (the uniform array's size)
  BENCH: 0,          // harness only (&npsim=BENCH:1): step on EVERY draw(), so CARD.bench(7, n) prices the mask + the solver too
};

export const SIM = {
  avail: 0, on: 0, tier: -1, simW: 0, simH: 0, dyeW: 0, dyeH: 0, steps: 0, nSplat: 0, pend: 0, dt: 0, now: 0, lastNow: 0, offSeen: 0, alloced: 0,
  spin: 0, grow: 0, gaps: 0, prev: [0, 0, 1, 0], rig: [0, 0, 0, 0],   // §151: the edge's raw rigid rates, the gap count, the last step's view, the shader's uRig
  params: { radius: KS.RADIUS },
  floor: [0, 0, 0], // the ink floor per second in every fluid cell (pool.js sets it each update from the mid band; 0 when muted)
  kick: 0,          // the kick's envelope (pool.js sets 1 on kickEvt; decays here)
  qn: 0,            // splats queued this frame (the queue's objects are reused)
  queue: [],
  dye: null,        // the dye's read target {t, w, h} (the picture samples it); a 1×1 black one while off
  splat(x, y, dx, dy, rgb, r) {
    const s = this.queue[this.qn] || (this.queue[this.qn] = { x: 0, y: 0, dx: 0, dy: 0, r: 0, g: 0, b: 0, rad: 0 });
    s.x = x; s.y = y; s.dx = dx; s.dy = dy; s.r = rgb[0]; s.g = rgb[1]; s.b = rgb[2]; s.rad = r === undefined ? this.params.radius : r;
    this.qn++;
  },
};

let ctx = null, gl = null, P = {}, CW = 16, CH = 9, black = null;
let vel = [null, null], dye = [null, null], prs = [null, null], msk = [null, null], div = null, edg = [null, null];
const SA = new Float32Array(KS.MAXS * 4), SC4 = new Float32Array(KS.MAXS * 4);   // the splat uniforms, reused
const swap = (p) => { const a = p[0]; p[0] = p[1]; p[1] = a; };
const grid = (s) => (CW >= CH ? [Math.round(s * CW / CH), s] : [s, Math.round(s * CH / CW)]);

function pass(pr, t, texel) {
  ctx.use(pr, t, t.w, t.h);
  if (texel) gl.uniform2f(pr.u('uTexel'), 1 / t.w, 1 / t.h);
  return pr;
}
function copy(from, to) {
  const pr = pass(P.scale, to);
  ctx.tex(pr, 'uSrc', 0, from);
  gl.uniform1f(pr.u('uK'), 1);
  ctx.tri();
}
function zero(to) {   // §151: a target cleared to 0 (a scale-×0 pass from the 1×1 black)
  const pr = pass(P.scale, to);
  ctx.tex(pr, 'uSrc', 0, black);
  gl.uniform1f(pr.u('uK'), 0);
  ctx.tri();
}
function alloc(tr) {
  const [sw, sh] = grid(KS.SIM[tr]), [dw, dh] = grid(KS.DYE[tr]);
  const nv = [ctx.mkTarget(sw, sh), ctx.mkTarget(sw, sh)], nd = [ctx.mkTarget(dw, dh), ctx.mkTarget(dw, dh)];
  if (vel[0]) {
    copy(vel[0], nv[0]);
    copy(dye[0], nd[0]);
  }
  for (const r of [...vel, ...dye, ...prs, ...msk, ...edg, div]) if (r) ctx.freeTarget(r);
  vel = nv;
  dye = nd;
  prs = [ctx.mkTarget(sw, sh), ctx.mkTarget(sw, sh)];
  msk = [ctx.mkTarget(sw, sh), ctx.mkTarget(sw, sh)];
  div = ctx.mkTarget(sw, sh);
  edg = [ctx.mkTarget(sw, sh), ctx.mkTarget(sw, sh)];
  zero(edg[0]);
  zero(edg[1]);
  SIM.alloced = 1;   // §151: a GAP for the paddle on the next step
  SIM.tier = tr;
  SIM.simW = sw; SIM.simH = sh; SIM.dyeW = dw; SIM.dyeH = dh;
  SIM.dye = dye[0];
}

export function initSim(c) {
  ctx = c;
  gl = c.gl;
  SIM.avail = c.fluid && c.fluid.avail ? 1 : 0;
  black = c.mkTarget(1, 1);
  SIM.dye = black;
  for (const k of ['mask', 'splat', 'wallv', 'edge', 'paddle', 'div', 'scale', 'jacobi', 'grad', 'advect', 'adye']) P[k] = c.mkProg(SH[k.toUpperCase()], 'navpool-' + k);
  c.onResize((w, h) => {
    CW = w;
    CH = h;
    if (SIM.avail && vel[0]) alloc(ctx.tier());   // the grids follow the canvas's aspect (the old picture copied in)
  });
}

// Once per update(): the step runs on the next draw() (a GL pass belongs to draw). on = the user's switch.
export function armSim(dt, on, now) {   // §151: no gate — the confinement is gone (§149's idle gate of it with it); now = env.now (the wall clock)
  SIM.on = SIM.avail && on ? 1 : 0;
  SIM.pend = SIM.on;
  SIM.now = now;
  if (!SIM.on) SIM.offSeen = 1;   // §151: the paddle's GAP on the next step
  SIM.dt = dt;
  if (!SIM.on) SIM.qn = 0;
  SIM.kick *= Math.exp(-dt / KS.KICK_TAU);
}

// §151 the edge's RIGID rates between two views [x, y, scale, rot] (pure: node tests it). dθ wrapped to (−π, π], dγ = ln(s/s'),
// spin / grow clamped (SPIN_MAX / GROW_MAX), vxy the slide (0 today); gap = a turn past EDGE_JUMP or a zoom past e^±.3 (rates 0).
export function edgeRates(view, prev, dt) {
  const T = Math.max(dt, 1e-3), d = view[3] - prev[3], dth = Math.atan2(Math.sin(d), Math.cos(d));
  const dg = Math.log(Math.max(1e-9, view[2]) / Math.max(1e-9, prev[2]));
  const gap = !(Math.abs(dth) <= KS.EDGE_JUMP && Math.abs(dg) <= 0.3);
  if (gap) return { spin: 0, grow: 0, vx: 0, vy: 0, dth, dg, gap: true };
  return { spin: clamp(dth / T, -KS.SPIN_MAX, KS.SPIN_MAX), grow: clamp(dg / T, -KS.GROW_MAX, KS.GROW_MAX), vx: (view[0] - prev[0]) / T, vy: (view[1] - prev[1]) / T, dth, dg, gap: false };
}
// … as the EDGE shader's uRig: [spin, grow, R(−w)·vxy/s] (ṗ = −spin·J·p − grow·p − uRig.zw)
export function rigOf(R, view, out) {
  const c = Math.cos(view[3]), s = Math.sin(view[3]), k = 1 / Math.max(1e-9, view[2]);
  out[0] = R.spin;
  out[1] = R.grow;
  out[2] = (c * R.vx + s * R.vy) * k;
  out[3] = (-s * R.vx + c * R.vy) * k;
  return out;
}
// … the rigid field at uv (uv/s), the shader's uR (node's finite-difference test against pool.js toUv)
export function edgeField(rig, uv, asp) {
  const px = (2 * uv[0] - 1) * asp, py = 2 * uv[1] - 1;
  const dx = rig[0] * py - rig[1] * px - rig[2], dy = -rig[0] * px - rig[1] * py - rig[3];
  return [dx / asp / 2, dy / 2];
}

// The step, from draw(), after the picture: J = the Julia pass's own numbers {c, view, it, itLo, lam, zs, eps2} so the wall IS the set drawn.
export function stepSim(J) {
  if (!SIM.pend && !(KS.BENCH && SIM.on)) {
    if (!SIM.on) SIM.dye = black;
    return;
  }
  SIM.pend = 0;
  const tr = ctx.tier(), dt = SIM.dt;
  if (!vel[0] || tr !== SIM.tier) alloc(tr);
  const sx = vel[0].w, sy = vel[0].h, aspect = CW / Math.max(1, CH), q = SIM.queue, nq = SIM.qn;
  let pr;
  // the mask: msk[0] becomes this frame's, msk[1] keeps the last
  swap(msk);
  pr = pass(P.mask, msk[0]);
  gl.uniform2f(pr.u('uC'), J.c[0], J.c[1]);
  gl.uniform4f(pr.u('uView'), J.view[0], J.view[1], J.view[2], J.view[3]);
  gl.uniform1i(pr.u('uIter'), J.it);
  gl.uniform1i(pr.u('uIterLo'), J.itLo);
  gl.uniform4f(pr.u('uLam'), J.lam[0], J.lam[1], J.lam[2], J.lam[3]);
  gl.uniform2f(pr.u('uZs'), J.zs[0], J.zs[1]);
  gl.uniform1f(pr.u('uEps2'), J.eps2);
  gl.uniform1f(pr.u('uHz'), 2 * J.view[2] / sy);   // one sim cell in the plane: the soft edge's width
  ctx.tri();
  // §151 the edge's rigid rates (RAW: EDGE_TAU is the one smoothing stage), or a GAP: the first step, a re-alloc, the switch off since
  // the last step, a stall / an off-screen gap / a seek (the wall clock's step 50 ms off the clamped dt), a turn past EDGE_JUMP, a zoom
  // past e^±.3. A GAP: the wall stands still this step (msk[1] := msk[0] — the first step's rule generalised; it also drops the old
  // spurious shove on re-entry), the rates 0, edg cleared.
  const R = edgeRates(J.view, SIM.prev, dt);
  const gap = SIM.steps === 0 || SIM.alloced || SIM.offSeen || Math.abs(SIM.now - SIM.lastNow - dt) > 0.05 || R.gap;
  SIM.alloced = 0;
  SIM.offSeen = 0;
  SIM.lastNow = SIM.now;
  for (let i = 0; i < 4; i++) SIM.prev[i] = J.view[i];
  if (gap) {
    SIM.gaps++;
    SIM.spin = SIM.grow = 0;
    SIM.rig.fill(0);
    copy(msk[0], msk[1]);
    zero(edg[0]);
  } else {
    SIM.spin = R.spin;
    SIM.grow = R.grow;
    rigOf(R, J.view, SIM.rig);
  }
  SIM.nSplat = nq;
  if (nq) {
    const A = SA, C = SC4;
    for (let i0 = 0; i0 < nq; i0 += KS.MAXS) {
      const n = Math.min(KS.MAXS, nq - i0);
      for (let i = 0; i < n; i++) {
        const s = q[i0 + i];
        A.set([s.x, s.y, s.dx, s.dy], i * 4);
        C.set([s.r, s.g, s.b, Math.max(1e-5, s.rad)], i * 4);
      }
      let still = true;   // §151: a batch of ink-only splats (dx = dy = 0) skips the velocity pass (adding an exact 0: bit-exact)
      for (let i = 0; i < n; i++) if (q[i0 + i].dx !== 0 || q[i0 + i].dy !== 0) still = false;
      for (const [pair, isDye] of [[vel, 0], [dye, 1]]) {
        if (!isDye && still) continue;
        pr = pass(P.splat, pair[1]);
        ctx.tex(pr, 'uSrc', 0, pair[0]);
        gl.uniform4fv(pr.u('uSplat'), A);
        gl.uniform4fv(pr.u('uCol'), C);
        gl.uniform1i(pr.u('uN'), n);
        gl.uniform1f(pr.u('uAspect'), aspect);
        gl.uniform1i(pr.u('uDye'), isDye);
        ctx.tri();
        swap(pair);
      }
    }
    SIM.qn = 0;
  }
  pr = pass(P.wallv, vel[1], true);   // the wall: a solid cell moves as the set's edge does
  ctx.tex(pr, 'uVel', 0, vel[0]);
  ctx.tex(pr, 'uM', 1, msk[0]);
  ctx.tex(pr, 'uMp', 2, msk[1]);
  gl.uniform2f(pr.u('uScale'), sx, sy);
  gl.uniform1f(pr.u('uDt'), dt);
  gl.uniform2f(pr.u('uWall'), KS.WALL_K * (1 + KS.KICK_WALL * SIM.kick), KS.WALL_VMAX);
  ctx.tri();
  swap(vel);
  pr = pass(P.edge, edg[1], true);   // §151: the edge's velocity with inertia
  ctx.tex(pr, 'uVel', 0, vel[0]);
  ctx.tex(pr, 'uM', 1, msk[0]);
  ctx.tex(pr, 'uE', 2, edg[0]);
  gl.uniform2f(pr.u('uScale'), sx, sy);
  gl.uniform4f(pr.u('uRig'), SIM.rig[0], SIM.rig[1], SIM.rig[2], SIM.rig[3]);
  gl.uniform1f(pr.u('uA'), Math.exp(-dt / Math.max(1e-4, KS.EDGE_TAU)));
  gl.uniform1f(pr.u('uNorm'), KS.EDGE_NORM);
  ctx.tri();
  swap(edg);
  pr = pass(P.paddle, vel[1], true);   // §151: the edge pushes the near-wall band where it is going (one-sided)
  ctx.tex(pr, 'uVel', 0, vel[0]);
  ctx.tex(pr, 'uM', 1, msk[0]);
  ctx.tex(pr, 'uE', 2, edg[0]);
  gl.uniform2f(pr.u('uScale'), sx, sy);
  gl.uniform4f(pr.u('uPad'), KS.PADDLE_GAIN, clamp(Math.round(KS.PADDLE_BAND), 1, 8), KS.PADDLE_VMAX, 1 - Math.exp(-KS.PADDLE_K * dt));
  ctx.tri();
  swap(vel);
  pr = pass(P.div, div, true);
  ctx.tex(pr, 'uVel', 0, vel[0]);
  ctx.tex(pr, 'uM', 1, msk[0]);
  gl.uniform2f(pr.u('uScale'), sx, sy);
  ctx.tri();
  pr = pass(P.scale, prs[1]);
  ctx.tex(pr, 'uSrc', 0, prs[0]);
  gl.uniform1f(pr.u('uK'), KS.PRESSURE);
  ctx.tri();
  swap(prs);
  for (let i = 0; i < KS.ITER[tr]; i++) {
    pr = pass(P.jacobi, prs[1], true);
    ctx.tex(pr, 'uP', 0, prs[0]);
    ctx.tex(pr, 'uDiv', 1, div);
    ctx.tex(pr, 'uM', 2, msk[0]);
    ctx.tri();
    swap(prs);
  }
  pr = pass(P.grad, vel[1], true);
  ctx.tex(pr, 'uP', 0, prs[0]);
  ctx.tex(pr, 'uVel', 1, vel[0]);
  ctx.tex(pr, 'uM', 2, msk[0]);
  gl.uniform2f(pr.u('uScale'), sx, sy);
  ctx.tri();
  swap(vel);
  pr = pass(P.advect, vel[1], true);
  ctx.tex(pr, 'uVel', 0, vel[0]);
  ctx.tex(pr, 'uSrc', 1, vel[0]);
  ctx.tex(pr, 'uM', 2, msk[0]);
  gl.uniform1f(pr.u('uDt'), dt);
  gl.uniform1f(pr.u('uDiss'), KS.VEL_DISS);
  gl.uniform1f(pr.u('uSlip'), KS.SLIP);
  ctx.tri();
  swap(vel);
  pr = pass(P.adye, dye[1], true);
  ctx.tex(pr, 'uVel', 0, vel[0]);
  ctx.tex(pr, 'uSrc', 1, dye[0]);
  ctx.tex(pr, 'uM', 2, msk[0]);
  gl.uniform1f(pr.u('uDt'), dt);
  gl.uniform1f(pr.u('uDiss'), KS.DYE_DISS);
  gl.uniform1f(pr.u('uFade'), Math.exp(-dt / KS.FADE_TAU));
  gl.uniform1f(pr.u('uThr'), KS.DYE_THR);
  gl.uniform1f(pr.u('uSq'), KS.SQUEEZE);
  gl.uniform1f(pr.u('uCap'), KS.INK_CAP);
  gl.uniform3f(pr.u('uFloor'), SIM.floor[0], SIM.floor[1], SIM.floor[2]);
  ctx.tri();
  swap(dye);
  SIM.dye = dye[0];
  SIM.steps++;
}

// Harness only (hooks.npwall(), read-only): the wall at work, read back from the GPU. Cells: `rim` = fluid with a solid 4-neighbour,
// `deep` = fluid with no solid within 3 cells, `wall` = solid with a fluid 4-neighbour. Means of the dye's luminance and the speed
// (uv/s), and on the rim the velocity along the inward normal (∇m: > 0 = the ink pushed off the wall, < 0 = driven into it).
// §151 probe: `ke` = mean |v|² (uv²/s²) of the class; `curl` = mean |ω| (1/s), ω = ½[(v_y(x+1) − v_y(x−1))·W − (v_x(y+1) − v_x(y−1))·H]
// (the old CURL pass's stencil) over cells whose 4 neighbours are all fluid — so a rim cell (a solid 4-neighbour by definition) never
// qualifies: rim.curl is read on the BAND behind it (fluid, 4 fluid neighbours, a solid cell within 3: the near-wall cells the paddle
// reaches), counted in rim.nc; deep.curl on the deep cells (deep.nc). Overall: `L` = mean over the fluid cells of (p × v)_z, p = (2uv − 1)(asp, 1),
// v·(asp, 1)·2 (the signed angular momentum about the screen centre, aspect-true), `nf` the fluid-cell count, `nan` the non-finite
// vel / dye components; wall.edge the mean |edg| (the edge's velocity with inertia, uv/s) on the wall cells.
function rd(t, w, h) {
  const a = new Float32Array(w * h * 4);
  gl.bindFramebuffer(gl.FRAMEBUFFER, t.f);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.FLOAT, a);
  return a;
}
export function probeSim() {
  if (!vel[0] || !SIM.steps) return { on: SIM.on, steps: SIM.steps };
  const w = vel[0].w, h = vel[0].h, M = rd(msk[0], w, h), V = rd(vel[0], w, h), Dy = rd(dye[0], dye[0].w, dye[0].h), E = rd(edg[0], w, h);
  const m = (x, y) => M[4 * (Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x)))];
  const fl = (x, y) => m(x, y) > 0.75;
  const vk = (x, y) => 4 * (Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x)));
  const A = { rim: [0, 0, 0, 0, 0, 0, 0, 0], deep: [0, 0, 0, 0, 0, 0, 0, 0], wall: [0, 0, 0, 0, 0, 0, 0, 0] };   // n, Σ dye, Σ speed, Σ v·n, Σ |v|², Σ |ω|, n ω, Σ |edg|
  const asp = w / h;
  let nan = 0, nf = 0, Ls = 0;
  for (let i = 0; i < V.length; i++) if (!Number.isFinite(V[i])) nan++;
  for (let i = 0; i < Dy.length; i++) if (!Number.isFinite(Dy[i])) nan++;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!fl(x, y)) continue;
      const k = 4 * (y * w + x), px = (2 * (x + 0.5) / w - 1) * asp, py = 2 * (y + 0.5) / h - 1;
      nf++;
      Ls += px * (V[k + 1] * 2) - py * (V[k] * asp * 2);
    }
  }
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const k = 4 * (y * w + x), f = fl(x, y), nb = fl(x - 1, y) + fl(x + 1, y) + fl(x, y - 1) + fl(x, y + 1);
      let deep = f;
      for (let j = -3; j <= 3 && deep; j++) for (let i = -3; i <= 3 && deep; i++) if (!fl(x + i, y + j)) deep = false;
      if (f && nb === 4) {   // the curl stencil: all 4 neighbours fluid — deep cells, else the near-wall band (booked to rim)
        const om = 0.5 * ((V[vk(x + 1, y) + 1] - V[vk(x - 1, y) + 1]) * w - (V[vk(x, y + 1)] - V[vk(x, y - 1)]) * h);
        const R = A[deep ? 'deep' : 'rim'];
        R[5] += Math.abs(om);
        R[6]++;
      }
      const kind = f ? (nb < 4 ? 'rim' : deep ? 'deep' : null) : (nb > 0 ? 'wall' : null);
      if (!kind) continue;
      const dx = Math.floor((x + 0.5) / w * dye[0].w), dy = Math.floor((y + 0.5) / h * dye[0].h), q = 4 * (dy * dye[0].w + dx);
      const gx = m(x + 1, y) - m(x - 1, y), gy = m(x, y + 1) - m(x, y - 1), gn = Math.hypot(gx, gy) || 1;
      const R = A[kind];
      R[0]++;
      R[1] += 0.2126 * Dy[q] + 0.7152 * Dy[q + 1] + 0.0722 * Dy[q + 2];
      R[2] += Math.hypot(V[k], V[k + 1]);
      R[3] += (V[k] * gx + V[k + 1] * gy) / gn;
      R[4] += V[k] * V[k] + V[k + 1] * V[k + 1];
      R[7] += Math.hypot(E[k], E[k + 1]);
    }
  }
  const out = { on: SIM.on, steps: SIM.steps, sim: [w, h], L: +(Ls / Math.max(1, nf)).toFixed(7), nf, nan };
  for (const kind in A) {
    const R = A[kind], n = Math.max(1, R[0]);
    out[kind] = { n: R[0], dye: +(R[1] / n).toFixed(4), speed: +(R[2] / n).toFixed(4), vn: +(R[3] / n).toFixed(4), ke: +(R[4] / n).toFixed(6) };
    if (kind === 'wall') out[kind].edge = +(R[7] / n).toFixed(5);   // §151: mean |edg| (uv/s) on the wall cells
    if (kind !== 'wall') { out[kind].curl = +(R[5] / Math.max(1, R[6])).toFixed(4); out[kind].nc = R[6]; }
  }
  return out;
}

// Harness knob (hooks.npsim, `&npsim=WALL_K:4,FADE_TAU:.06`): set the solver's numbers by name for an A/B.
export function knobSim(v) {
  for (const kv of String(v).split(',')) {
    const [k, x] = kv.split(':');
    if (k in KS && typeof KS[k] === 'number' && Number.isFinite(+x)) KS[k] = +x;
  }
}
