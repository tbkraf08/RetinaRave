// CHLADNI's sand: the particle state, on the GPU, and the one instrument that measures it.
//
// The grains live in a float texture, one texel per grain — (x, y) on the plate, z the height it floats at, w a
// born flag — and are advanced by a fullscreen pass into a second, identical target (ping-pong). Nothing about a
// grain lives on the CPU, so 150 000 grains cost one draw call to move and one to draw.
//
// The texture is allocated ONCE at the top tier's budget and the drawn count follows `ctx.budget('points')`, so a
// tier flip changes how much sand there is and never which texel holds which grain (the state pass addresses its
// texel through gl_FragCoord, not through the viewport). CONTRACTS §1.6 allows a particle count to jump; it does not
// allow the picture to be re-shuffled, and re-allocating would do exactly that.
//
// THE SETTLE INSTRUMENT. `settle()` runs one extra pass that writes 1 per grain within DELTA of a nodal line into an
// RGBA8 target and reads those bytes back (a float target read as UNSIGNED_BYTE is black — CONTRACTS §1.1), then
// averages on the CPU: the fraction of the sand that is ON the figure. It is a pipeline stall, so it is called only
// from a harness eval (`CARD.REG[11].scene.hooks.settle()`), never from update() or draw().

const GW = 512;                   // the state texture's width; the height is whatever the top budget needs
export const TOPBUDGET = 150000;  // ctx.budget('points') at tier 3 (CONTRACTS §1.4) — the allocation is sized to it
export const DELTA = 0.06;        // "within δ of a nodal line": in units of the normalised field, |u| < DELTA

export function mkSand(ctx, progs) {
  const gl = ctx.gl;
  const rows = Math.ceil(TOPBUDGET / GW);
  const A = ctx.mkTarget(GW, rows);
  const B = ctx.mkTarget(GW, rows);
  const M = ctx.mkTarget(GW, rows, true);        // the settle instrument's byte target
  const bytes = new Uint8Array(GW * rows * 4);
  let cur = A, other = B, frame = 0;

  // One state step. `U` is the uniform block index.js fills; `count` the grains actually in play this frame.
  function step(U, count) {
    const pr = progs.sand;
    const used = Math.max(1, Math.ceil(count / GW));
    ctx.use(pr, other, GW, used);
    ctx.tex(pr, 'uPos', 0, cur);
    gl.uniform4f(pr.u('uFig'), U.s, U.h, U.bnd, 0);
    gl.uniform4f(pr.u('uStep'), U.walk, U.desc, frame, U.dt);
    gl.uniform4f(pr.u('uAir'), U.gate, U.amp, U.lift, U.spiral);
    gl.uniform2f(pr.u('uKick'), U.kickAge, U.kickVel);
    gl.uniform2f(pr.u('uGrid'), GW, rows);
    ctx.tri();
    const t = cur;
    cur = other;
    other = t;
    frame = (frame + 1) % 65536;                 // a frame counter, not a clock: the hash needs a moving integer
    return used;
  }

  // The fraction of `count` grains within DELTA of a nodal line, and the mean float height, from one byte readback.
  function settle(U, count) {
    const pr = progs.settle;
    const used = Math.max(1, Math.ceil(count / GW));
    ctx.use(pr, M, GW, used);
    ctx.tex(pr, 'uPos', 0, cur);
    gl.uniform4f(pr.u('uFig'), U.s, U.h, U.bnd, DELTA);
    gl.uniform2f(pr.u('uGrid'), GW, rows);
    ctx.tri();
    gl.bindFramebuffer(gl.FRAMEBUFFER, M.f);
    gl.readPixels(0, 0, GW, used, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const n = Math.min(count, GW * used);
    let on = 0, hz = 0;
    for (let i = 0; i < n; i++) { on += bytes[i * 4] > 127 ? 1 : 0; hz += bytes[i * 4 + 1]; }
    return { n, settled: n ? on / n : 0, delta: DELTA, air: n ? hz / n / 255 : 0 };
  }

  // ctx.mkTarget clears to OPAQUE black, so a fresh target's alpha is 1 and the state pass's "not born yet" test
  // (w < 0.5) would never fire — every grain would sit at (0, 0) for ever. Clear the alpha before the first step.
  function reset() {
    frame = 0;
    for (const t of [A, B]) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, t.f);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clearColor(0, 0, 0, 1);
  }
  reset();

  return {
    grid: [GW, rows],
    tex: () => cur,
    step,
    settle,
    reset,
    free() { ctx.freeTarget(A); ctx.freeTarget(B); ctx.freeTarget(M); },
  };
}
