// NAV2 scene (v0.8, id 8, key 9): "the melody draws the path" — the successor to NAV, built from-scratch by a worker
// from docs/workers/brief-nav2.md (NAV2-SESSION-PROMPT.md). Step 0 (this file as committed by the orchestrator): NAV's
// index.js lifted verbatim minus the DRUM variant, the OKLCH mapping and the gamut probe, so that the registration is a
// proven no-op — s8's md5 lines equal s0's. NAV (id 0) stays home and untouched until the user approves NAV2.
import { TAU, clamp, mix, sstep, ema, frac, Spring } from '../../math/util.js';
import { startGridWorker, LG_MIN, LG_MAX } from '../../math/mandel.js';   // LG_*: the exterior potential's own bounds — the `reach` parameter's range
import { NAV, updateNav } from './core.js';
import { FS_JULIA_V2, FS_MANDEL_V2, VS_PT, FS_PT } from './shaders.js';

const modes = new Float32Array(16), pipPath = new Float32Array(96);
const PIP = { cx: new Spring(-0.6, 1.5), cy: new Spring(0, 1.5), sc: new Spring(Math.log(1.5), 1.6), a: 0 };
let ctx, pt, B_ORB;
const ITER_LO = 0.5;   // NAV's split iteration budget (docs/workers/nav-iter.md) — the same fraction, or the still frame moves

export default {
  name: 'nav2',
  id: 8,
  tag: 'the melody draws the path: pitch moves c through the Mandelbrot set, the build presses it to the boundary, the drop breaks through',
  home: false,      // NAV (id 0) is home until the user approves NAV2 (the swap is NAV2-SESSION-PROMPT step 4)
  always: true,     // step 0 only: updated every frame like NAV so the lift is provable (s8 = s0 pixel for pixel — a forced scene's first draw precedes its first update); the worker sets it false in step 1
  cuts: 'event',    // c jumps only at the drop (pathCut 0 + a mode change); every other frame moves c by <= V_MAX*dt
  feats: ['interval', 'repeat', 'seed', 'beat', 'beatPhase', 'beatCount', 'dropEvt', 'dropStrength', 'dropEnv', 'intensity',
    'build', 'suspension', 'presence', 'harmUnw', 'arc', 'onset', 'hitStrength', 'hit', 'eS', 'eM', 'tension', 'resolveEvt',
    'bass', 'mid', 'high', 'peaks'], // step 0: exactly what core.js, this file and the shaders read (NAV's list minus DRUM's bid)
  state: NAV,
  rt: { c: NAV.c, label: 'nav2', home: true, awayBeat: 0, settledAt: 0, time: 0, log: '' },
  hooks: {
    baby: (i) => { NAV.forceBaby = +i; },
    still: () => {},   // forces every NAV2-only uniform to its rest value (an IEEE identity) — the no-op gate of every worker commit; nothing to force yet
  },
  help: {
    feats: {
      interval: 'which bulb c heads for: the interval picks the p/q bulb (of the baby copy when inside one)',
      repeat: 'a repeated section may dive into a baby copy of M (which one comes from the seed)',
      seed: 'the section\'s constants: which baby copy, the interior angle offset, the exterior angle',
      beat: 'retargeting happens on the beat, never on the root-to-ray bridge; loud beats are counted toward leaving',
      beatPhase: 'the orbit trap\'s rotation and the eased beat clock the picture breathes on',
      beatCount: 'beats since the last exit: settling back inside, which ray to take, the landing time',
      dropEvt: 'the exit: c is thrown out of M along an external ray',
      dropStrength: 'how deep outside the ray lands (log2 of the potential, -2.2 down to -0.5)',
      dropEnv: 'zooms the view out by up to 25 % and lights the exterior dust while the drop rings',
      intensity: 'how deep into the bulb c sits, and the loud count that leads to leaving',
      build: 'parks c at the bulb\'s root (the cusp) while a build runs',
      suspension: 'also parks at the root: a held tension waits at the gateway',
      presence: 'silence freezes c and slows the visual clock; the picture-in-picture fades out',
      harmUnw: 'the interior angle alpha and the exterior angle theta: the harmony walks c around the bulb, and along the rays outside',
      arc: 'sustain counts loud beats toward leaving; peak keeps c outside longer',
      onset: 'a hard hit kicks c toward a Misiurewicz point (into the dendrite) and back',
      hitStrength: 'how far that kick goes',
      hit: 'a flash on the set\'s edge, a slight zoom-in, the bright head of the path in the picture-in-picture',
      eS: 'the exterior depth (with tension) and the amplitude of the (dormant) drum modes',
      eM: 'trail length (feedback decay 0.7 + 0.16 eM)',
      tension: 'the exterior depth: tense music sits further out along the ray',
      resolveEvt: 'a release doubles the visual clock for a moment',
      bass: 'the glow of the set\'s interior, a 5 % zoom-in, the size of the critical-orbit dots',
      mid: 'the radius of the circular orbit trap',
      high: 'the circular trap\'s highlight',
      peaks: 'the four spectral peaks become the four Koenigs modes of the (dormant) drum membrane',
    },
    eli5: 'You are inside the Julia set of one point c. The music walks c around the Mandelbrot set: consonant intervals pick big bulbs, the drop throws c outside along an external ray.',
    why: 'Bulbs are indexed by rotation number p/q, which is the same combinatorics as musical intervals (just ratios). Drops are the only exits from the interior: through parabolic roots onto landing rays. The interior smoulders as the multiplier nears 1 — critical slowing, the orbit taking longer and longer to settle. The colouring is v0.2\'s ramp: a blue exterior, the Koenigs bands lighting the dark interior.',
    math: 'Interior chart: multiplier λ=ρe^{iφ} of the p/q bulb via Newton in (z,c). Exterior chart: inverse Böttcher map on a (θ, log₂G) table. Baby copies: tuning, zoom-matched at the root (hybrid equivalence).',
  },

  score: () => 0,   // forced-only (key 9, &scene=8) until the user approves NAV2: the director never picks it, no reference pick moves (DECISIONS §15)

  post: { fb: { decay: (S) => 0.7 + 0.16 * S.eM }, bloom: { thr: 0.35 }, kaleido: 1 },

  // NAV's parameters verbatim (CONTRACTS §1.16); the worker replaces them with the six of the brief.
  params: {
    trap: { eli5: 'how wide the ring is that the orbit trap lights up', range: [0.35, 1.25], from: (S) => 0.35 + 0.9 * S.mid },
    zoom: { eli5: 'how far the view is pulled back from the Julia set', range: [0.5, 2], from: (S) => (1 - 0.05 * S.bass - 0.07 * S.hit) * (1 + 0.25 * S.dropEnv) },
    dots: { eli5: 'how big the dots of the critical orbit are', range: [0, 3], from: (S) => 1 + S.bass },
    pip: { eli5: 'how visible the little map of the Mandelbrot set is', range: [0, 1], from: (S) => sstep(0.05, 0.3, S.presence) },
    reach: { eli5: 'how far outside the set the drop throws the picture', range: [LG_MIN, LG_MAX], from: (S) => clamp(mix(-2.6, -9, clamp(0.55 * S.eS + 0.5 * S.tension, 0, 1)) + 3.2 * S.dropEnv, LG_MIN, LG_MAX) },
  },

  // One colouring, v0.2's pal() ramp (CONTRACTS §1.4; DECISIONS §26 — OKLCH is an opt-in variant elsewhere, not here yet).
  colour: { default: 'v2', variants: { v2: {} } },

  init(c) {
    ctx = c;
    NAV.log = c.log;
    const CV = this.colour.variants;
    CV.v2.julia = c.mkProg(FS_JULIA_V2, 'julia2-v2');
    CV.v2.mandel = c.mkProg(FS_MANDEL_V2, 'mandel2-v2');
    pt = c.mkProg(VS_PT, FS_PT, 'pt2');
    B_ORB = c.dynBuf(160 * 3, 3);
    startGridWorker();   // one grid per page: math/mandel.js starts the worker once, whichever navigator asks first
  },

  update(dt, S, GROOVE, LOOK, env) {
    const N = NAV, SC = env.SC;
    this._P = env.params;
    if (this.rt.settledAt === 0) N.landed = 0;
    updateNav(dt, env.now, S, { isLogical: SC.logical === this.id, drum: SC.vT > 0.5, P: env.params });
    const rt = this.rt;
    rt.home = N.mode === 'INT';
    rt.awayBeat = N.extBeat;
    rt.settledAt = N.landed || 0;
    rt.cycBase = N.cycBase;
    rt.time = N.vtime;
    rt.label = N.mode + (N.baby ? ' P' + N.baby.P : '') + ' ' + N.bulb.p + '/' + N.bulb.q;
    rt.log = `${N.mode} h${N.h.x.toFixed(2)} lg${N.lg.x.toFixed(1)} par${N.par.toFixed(2)}`;
    this._groove = GROOVE;
    this._S = S;
  },
  draw(tgt, { w, h, vmix, colour }) {
    if (!this._S) return;   // a forced scene is drawn on its first frame before its first update() (loop.js: cur/next are set by the pick after the update pass)
    const gl = ctx.gl, S = this._S, N = NAV, GROOVE = this._groove, LOOK = ctx.LOOK, Q = ctx.Q, asp = w / h, P = this._P;
    const pr = this.colour.variants[colour].julia;
    ctx.use(pr, tgt, w, h);
    const u = pr.u, B = N.baby;
    const cm = B ? Math.hypot(N.c[0] - B.c0[0], N.c[1] - B.c0[1]) / B.size : Math.hypot(N.c[0], N.c[1]);
    const br = S.beatCount + 1 - Math.pow(1 - S.beatPhase, 3);
    const scale = (1.42 + 0.3 * Math.max(0, cm - 0.8)) * P.zoom * (B ? mix(1, 1.7, N.bz.x) / B.A : 1);
    const rotv = GROOVE.rot - (B ? B.argA : 0);
    N.view = [0, 0, scale, rotv];
    gl.uniform2f(u('uC'), N.c[0], N.c[1]);
    gl.uniform4f(u('uView'), 0, 0, scale, rotv);
    const it = Math.min(420, Math.round(Q.iter * (B ? 1.6 : 1)));
    gl.uniform1i(u('uIter'), it);
    gl.uniform1i(u('uIterLo'), Math.round(it * ITER_LO));
    gl.uniform2f(u('uSc'), B ? 1 / B.A : 1, B ? 1 / B.P : 1);
    const ta = Math.PI * br;
    gl.uniform2f(u('uTrapN'), -Math.sin(ta), Math.cos(ta));
    gl.uniform1f(u('uTrapR'), P.trap);
    gl.uniform1f(u('uDrum'), vmix);   // no variant: 0 — the door stays open to re-host DRUM (NAV2-SESSION-PROMPT §2)
    gl.uniform2f(u('uZs'), N.cyc.zs[0], N.cyc.zs[1]);
    gl.uniform4f(u('uLam'), N.cyc.lnr, N.cyc.arg, N.cyc.q, N.cyc.has);
    gl.uniform1f(u('uEps2'), N.cyc.eps2);
    gl.uniform1f(u('uPx'), 2 * scale / h);
    gl.uniform1f(u('uPar'), N.par);
    for (let j = 0; j < 4; j++) {
      const pk = S.peaks[j], f = pk ? pk[0] : 110 * (j + 1), oct = Math.log2(Math.max(f, 30) / 55);
      modes[j * 4] = 2 * (1 + (Math.round(oct * 12) * 7 % 12) % 4);
      modes[j * 4 + 1] = 1 + Math.floor(clamp(oct, 0, 4.9));
      modes[j * 4 + 2] = pk ? clamp(0.35 + 0.65 * (j === 0 ? 1 : pk[1] / S.peaks[0][1]), 0, 1) * (0.3 + 0.7 * S.eS) * S.presence : 0;
      modes[j * 4 + 3] = N.vtime * (1.5 + oct);
    }
    gl.uniform4fv(u('uMode[0]'), modes);
    ctx.tri();
    // critical orbit: the actual dynamics of f_c — crawls near parabolic roots, flies off at the drop
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(pt.p);
    gl.uniform4f(pt.u('uView'), 0, 0, scale, rotv);
    gl.uniform1f(pt.u('uAsp'), asp);
    gl.uniform1f(pt.u('uSize'), h * 0.012 * P.dots);
    const oc = ctx.hsv(frac(LOOK.hue + 0.5), 0.35, 0.5 * LOOK.pal[3]);
    gl.uniform3f(pt.u('uCol'), oc[0], oc[1], oc[2]);
    gl.uniform1f(pt.u('uLine'), 0);
    ctx.upload(B_ORB, N.orbit, 160 * 3);
    gl.bindVertexArray(B_ORB.vao);
    gl.drawArrays(gl.POINTS, 0, 160);
    gl.disable(gl.BLEND);
  },

  // Picture-in-picture: M itself with the path of c. Post-composite, scissored, direct to screen.
  overlay(PW, PH, vis, dt) {
    if (!this._P) return;   // the loop calls every scene's overlay every frame (loop.js); an `always: false` scene has no update() behind it until it is forced or picked
    const gl = ctx.gl, S = this._S, N = NAV, LOOK = ctx.LOOK, Q = ctx.Q, cv = this.colour.cur;
    PIP.a = ema(PIP.a, vis * this._P.pip, dt, 0.5);
    let ex = N.baby ? 0 : 0.05;
    for (let i = 0; i < 96; i += 4) ex = Math.max(ex, Math.hypot(N.path[i * 3] - PIP.cx.x, N.path[i * 3 + 1] - PIP.cy.x));
    PIP.cx.step(N.cPath[0], dt);
    PIP.cy.step(N.cPath[1], dt);
    PIP.sc.step(Math.log(N.baby ? clamp(ex * 1.8 + 0.8 * N.baby.size, 1.4 * N.baby.size, 1.7) : clamp(ex * 1.8 + 0.25, 0.3, 1.7)), dt);
    const pipS = Math.exp(PIP.sc.x);
    if (PIP.a <= 0.01) return;
    const sz = Math.round(Math.min(PW, PH) * 0.24), mg = Math.round(sz * 0.12), x0 = PW - sz - mg, y0 = mg;
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(x0, y0, sz, sz);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    const pr = this.colour.variants[cv].mandel;
    gl.useProgram(pr.p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(x0, y0, sz, sz);
    gl.uniform2f(pr.u('uRes'), sz, sz);
    gl.uniform4fv(pr.u('uPal'), [LOOK.pal[0], 0.2, 0.6, 1]);
    gl.uniform3fv(pr.u('uTint'), LOOK.tint);
    gl.uniform4f(pr.u('uView'), PIP.cx.x, PIP.cy.x, pipS, 0);
    gl.uniform1i(pr.u('uIter'), Math.round(N.baby ? 256 : 90 + 120 * Q.q));
    gl.uniform1f(pr.u('uAlpha'), PIP.a);
    for (let j = 0; j < 32; j++) { // a chart cut is not a path: no segment across it
      pipPath[j * 3] = N.path[j * 9];
      pipPath[j * 3 + 1] = N.path[j * 9 + 1];
      pipPath[j * 3 + 2] = (N.pathCut >= j * 3 && N.pathCut < j * 3 + 3) ? 0 : (1 - j / 32) * (j ? 1 : 1 + S.hit);
    }
    gl.uniform3fv(pr.u('uPath[0]'), pipPath);
    gl.uniform3fv(pr.u('uPc'), ctx.hsv(frac(LOOK.hueT + 0.45), 0.55, 1));
    ctx.tri();
    gl.disable(gl.BLEND);
    gl.disable(gl.SCISSOR_TEST);
  },

  hud() {
    const N = NAV, f = (x) => x.toFixed(2);
    return `nav2 ${N.mode}  c ${N.c[0].toFixed(4)} ${N.c[1].toFixed(4)}  h ${f(N.h.x)} alpha ${N.alpha.x.toFixed(3)}  theta ${N.th.x.toFixed(3)} log2G ${f(N.lg.x)}  par ${f(N.par)} tscale ${f(N.timeScale)}  bulb ${N.bulb.p}/${N.bulb.q}${N.baby ? ' baby P' + N.baby.P : ''}  cycBase ${N.cycBase | 0}`;
  },
};
