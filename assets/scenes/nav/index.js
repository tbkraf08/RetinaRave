// NAV scene: the Julia set of f_c while the music navigates c through the Mandelbrot set. DRUM is its interior
// variant (Koopman modes from the spectral peaks). Overlay: picture-in-picture of M with the path of c.
// Lifted from cardioid3 renderScene id 0 / PiP block, expressed through docs/CONTRACTS.md.
import { TAU, clamp, mix, sstep, ema, frac, Spring } from '../../math/util.js';
import { startGridWorker } from '../../math/mandel.js';
import { NAV, updateNav } from './nav.js';
import { OK_NAV, FS_JULIA, FS_MANDEL, VS_PT, FS_PT } from './shaders.js';

const modes = new Float32Array(16), pipPath = new Float32Array(96);
const PIP = { cx: new Spring(-0.6, 1.5), cy: new Spring(0, 1.5), sc: new Spring(Math.log(1.5), 1.6), a: 0 };
let ctx, julia, mandel, pt, B_ORB;
let clipDbg = 0;   // #test only (hooks.clipdbg): 1 = write okClip of the shipped (h,L,C) into o.r, 2 = of the flat .11 chroma

export default {
  name: 'nav',
  id: 0,
  tag: 'music navigates the Mandelbrot set: bulbs by interval, exterior rays on the drop',
  home: true,       // the director's home scene: drops cut here, builds park here
  always: true,     // updated every frame (the director reads its rt, the PiP path must stay continuous)
  cuts: 'event',    // c jumps only at drops, chart cuts (pathCut<=2) and beat kicks
  feats: ['interval', 'repeat', 'seed', 'beat', 'beatPhase', 'beatCount', 'dropEvt', 'dropStrength', 'dropEnv', 'intensity',
    'build', 'suspension', 'presence', 'harmUnw', 'arc', 'onset', 'hitStrength', 'hit', 'eS', 'eM', 'tension', 'resolveEvt',
    'bass', 'mid', 'high', 'peaks', 'clarity'], // exactly what nav.js, index.js and the shaders read (§12 trimmed 11 v3-era leftovers)
  state: NAV,
  rt: { c: NAV.c, label: 'nav', home: true, awayBeat: 0, settledAt: 0, time: 0, log: '' },
  variants: [{
    id: 4, name: 'drum', tag: 'DRUM: the interior as a membrane, modes from the spectral peaks',
    // v3: eligible only while the navigator is interior with a converged cycle (cycBase, before the kick hides it)
    score: (S, rt) => (rt.home && rt.cycBase ? 0.85 * S.clarity + 0.3 * (1 - S.eM) + 0.1 : 0),
  }],
  hooks: {
    baby: (i) => { NAV.forceBaby = +i; },
    clipdbg: (v) => { clipDbg = +v || 0; },   // the gamut probe of both escape branches, read back through an RGBA8 target
  },
  help: {
    // what each field in `feats` moves on this screen (CONTRACTS §1.13); a field without a line falls back to FEATS[k].drives
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
      eS: 'the exterior depth (with tension) and the amplitude of the DRUM modes',
      eM: 'trail length (feedback decay 0.7 + 0.16 eM); DRUM bids when eM is low',
      tension: 'the exterior depth: tense music sits further out along the ray',
      resolveEvt: 'a release doubles the visual clock for a moment',
      bass: 'the glow of the set\'s interior, a 5 % zoom-in, the size of the critical-orbit dots',
      mid: 'the radius of the circular orbit trap',
      high: 'the circular trap\'s highlight',
      peaks: 'DRUM: the four spectral peaks become the four Koenigs modes (frequency picks the mode, amplitude its weight)',
      clarity: 'DRUM\'s bid: a clear tonal interior with a converged cycle invites the membrane',
    },
    eli5: 'You are inside the Julia set of one point c. The music walks c around the Mandelbrot set: consonant intervals pick big bulbs, the drop throws c outside along an external ray.',
    why: 'Bulbs are indexed by rotation number p/q, which is the same combinatorics as musical intervals (just ratios). Drops are the only exits from the interior: through parabolic roots onto landing rays. The interior smoulders as the multiplier nears 1 — critical slowing, the orbit taking longer and longer to settle. Hue is the angle of the ray you are on: inside a component it is the internal angle arg lambda, outside it is the external angle of the point, which is why a ray in the picture-in-picture and its image in the Julia set share a colour.',
    math: 'Interior chart: multiplier λ=ρe^{iφ} of the p/q bulb via Newton in (z,c). Exterior chart: inverse Böttcher map on a (θ, log₂G) table. Baby copies: tuning, zoom-matched at the root (hybrid equivalence).',
  },

  score: (S) => 0.5 + S.build,

  post: { fb: { decay: (S) => 0.7 + 0.16 * S.eM }, bloom: { thr: 0.35 }, kaleido: 1 },

  init(c) {
    ctx = c;
    NAV.log = c.log;
    julia = c.mkProg(c.oklch + OK_NAV + FS_JULIA, 'julia');   // §1.14: hue and lightness independent, so arg lambda and |lambda| can drive one each
    mandel = c.mkProg(c.oklch + OK_NAV + FS_MANDEL, 'mandel');
    pt = c.mkProg(VS_PT, FS_PT, 'pt');
    B_ORB = c.dynBuf(160 * 3, 3);
    startGridWorker();
  },

  update(dt, S, GROOVE, LOOK, env) {
    const N = NAV, SC = env.SC;
    if (this.rt.settledAt === 0) N.landed = 0; // the director consumed the landing (zeroed rt.settledAt)
    updateNav(dt, env.now, S, { isLogical: SC.logical === this.id, drum: SC.vT > 0.5 });
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
  draw(tgt, { w, h, vmix }) {
    const gl = ctx.gl, S = this._S, N = NAV, GROOVE = this._groove, LOOK = ctx.LOOK, Q = ctx.Q, asp = w / h;
    const pr = julia;
    ctx.use(pr, tgt, w, h);
    const u = pr.u, B = N.baby;
    const cm = B ? Math.hypot(N.c[0] - B.c0[0], N.c[1] - B.c0[1]) / B.size : Math.hypot(N.c[0], N.c[1]);
    // inside a baby the same view is conjugated by w=A z (matched at the cut), then eased out (bz) until the host's decorations frame the copy
    const br = S.beatCount + 1 - Math.pow(1 - S.beatPhase, 3);
    const scale = (1.42 + 0.3 * Math.max(0, cm - 0.8)) * (1 - 0.05 * S.bass - 0.07 * S.hit) * (1 + 0.25 * S.dropEnv) * (B ? mix(1, 1.7, N.bz.x) / B.A : 1);
    const rotv = GROOVE.rot - (B ? B.argA : 0);
    N.view = [0, 0, scale, rotv];
    gl.uniform2f(u('uC'), N.c[0], N.c[1]);
    gl.uniform4f(u('uView'), 0, 0, scale, rotv);
    gl.uniform1i(u('uIter'), Math.min(420, Math.round(Q.iter * (B ? 1.6 : 1))));
    gl.uniform2f(u('uSc'), B ? 1 / B.A : 1, B ? 1 / B.P : 1);
    const ta = Math.PI * br;
    gl.uniform2f(u('uTrapN'), -Math.sin(ta), Math.cos(ta));
    gl.uniform1f(u('uTrapR'), 0.35 + 0.9 * S.mid);
    gl.uniform1f(u('uDrum'), vmix);
    gl.uniform2f(u('uZs'), N.cyc.zs[0], N.cyc.zs[1]);
    gl.uniform4f(u('uLam'), N.cyc.lnr, N.cyc.arg, N.cyc.q, N.cyc.has);
    gl.uniform1f(u('uEps2'), N.cyc.eps2);
    gl.uniform1f(u('uPx'), 2 * scale / h);
    gl.uniform1f(u('uPar'), N.par); // critical slowing: how close the multiplier is to the unit circle (0 outside / far from a root)
    gl.uniform1f(u('uClipDbg'), clipDbg);
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
    gl.uniform1f(pt.u('uSize'), h * 0.012 * (1 + S.bass));
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
    const gl = ctx.gl, S = this._S, N = NAV, LOOK = ctx.LOOK, Q = ctx.Q;
    PIP.a = ema(PIP.a, vis * sstep(0.05, 0.3, S.presence), dt, 0.5);
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
    const pr = mandel;
    gl.useProgram(pr.p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(x0, y0, sz, sz);
    gl.uniform2f(pr.u('uRes'), sz, sz);
    gl.uniform4fv(pr.u('uPal'), [LOOK.pal[0], 0.2, 0.6, 1]);
    gl.uniform3fv(pr.u('uTint'), LOOK.tint);
    gl.uniform4f(pr.u('uView'), PIP.cx.x, PIP.cy.x, pipS, 0);
    gl.uniform1i(pr.u('uIter'), Math.round(N.baby ? 256 : 90 + 120 * Q.q));
    gl.uniform1f(pr.u('uAlpha'), PIP.a);
    gl.uniform1f(pr.u('uClipDbg'), clipDbg);
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
    return `nav ${N.mode}  c ${N.c[0].toFixed(4)} ${N.c[1].toFixed(4)}  h ${f(N.h.x)} alpha ${N.alpha.x.toFixed(3)}  theta ${N.th.x.toFixed(3)} log2G ${f(N.lg.x)}  par ${f(N.par)} tscale ${f(N.timeScale)}  bulb ${N.bulb.p}/${N.bulb.q}${N.baby ? ' baby P' + N.baby.P : ''}  cycBase ${N.cycBase | 0}`;
  },
};
