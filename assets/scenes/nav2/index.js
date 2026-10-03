// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// NAV2 (v0.8, id 8, key 9): "the melody draws the path" — the successor to NAV, built from docs/workers/brief-nav2.md.
// Where NAV chooses among tables (12 bulbs by interval, 3 baby copies, 14 Misiurewicz points) and walks a chart inside
// the choice, NAV2 has no tables and no charts: c is a ball rolling inside M (nav2.js), pitch is up, the build presses it
// against the boundary until the Koenigs arms wind up, and the drop is the one cut. NAV (id 0) stays home and untouched.
import { clamp, sstep, ema, frac, Spring } from '../../math/util.js';
import { N2, updateNav2, resetNav2, Y_AMP, X_HOME, X_AMP, LIFT } from './nav2.js';
import { DET, resetDet, updateDet, WIND_BEATS, SPIN_SW, SPIN_W, SLIDE, SLIDE_A } from './detect.js';
import { FS_JULIA_V2, FS_MANDEL_V2, VS_PT, FS_PT } from './shaders.js';
import { measure, resetGreen, G as GREEN } from './green.js';

const modes = new Float32Array(16), pipPath = new Float32Array(96);
const PIP = { cx: new Spring(-0.6, 1.5), cy: new Spring(0, 1.5), sc: new Spring(Math.log(1.5), 1.6), a: 0 };
let ctx, pt, B_ORB, LAST = null, LENV = null;
const ITER_LO = 0.5;      // NAV's split iteration budget (docs/workers/nav-iter.md) — the same fraction
const TRAP_0 = 0.35;      // the orbit trap's ring, inline (not a parameter: six is the cap)
const TRAP_K = 0.9;
const DOTS_0 = 1;         // the critical-orbit dot size, inline
const PIP_LO = 0.05;      // the picture-in-picture's presence gate, inline
const PIP_HI = 0.3;
const ROUND_G = 0.8;      // v0.13: how much the picture brightens as the set rounds (uRound; 1 + ROUND_G*(1-rho)).
const BUMP_H = 1.5;       // v0.13: how far the exterior halo reaches off the edge on a full bump (uBump; 1 + BUMP_H*bump)
                          // 1.5 in the first cut: "a little too bright (detail is getting washed out)" — the user
const LUM_IN = [0.2, 3];  // pass 6 (uLum.xy): the interior's luminance knee (L0, K) — the set stays dark whatever the palette's
                          // phase: the green frames read a centre of 0.36-0.47 (a bright banded interior) where the blue ones
                          // read 0.03-0.05 and NAV's collapse at 38-42 s is dark. (0.12, 6) in pass 6 flattened the bands to one
                          // dark tone ("a bit too muted now, almost pastel", the user); (0.2, 3) keeps the gradation to 0.2
                          // and brings a 0.5 to 0.26
const LUM_EX = [1, 0];    // (uLum.zw): the exterior's — OFF (an exact identity). (0.35, 2) in pass 6 compressed the halo's peaks
                          // and that is the pastel the user saw: "I like the bright / glowy look"
const EXT_DIM = 0.35;     // pass 6 (uExtG): the exterior branch's gain while c is OUTSIDE the set (the drop's dust), eased over
const EXT_DIM_TAU = 0.5;  // this many seconds so the bridge home does not pop; inside the set the halo keeps its full light.
                          // The dust frames after the 58 s drop read a centre of 0.39-0.58 with the knee alone (the halo
                          // term is 1 wherever the dust is near, i.e. everywhere), the interior's frames 0.03-0.22.
                          // Pass 7: 0.35 — with the exterior KNEE gone (the halo's glow back, the user: "I like the bright /
                          // glowy look") the dust read 0.55-0.67 again at 0.6; the dim alone must carry it (-> ~0.35)
let extG = 1;
let STILL = 0;            // &still=1 / hooks.still(1): every NAV2-only uniform at its rest value (an IEEE identity)

// The wind-up target, shared by the `wind` and `spin` parameters. Every field is read unconditionally or as a
// multiply by (cond ? 0 : 1), so paramDeps records all four (CONTRACTS §1.16, the TORUS2 short-circuit find).
function windTarget(MS) {
  const dei = MS.dropExpectedIn;
  const count = clamp(1 - Math.max(dei, 0) / WIND_BEATS, 0, 1) * (dei >= 0 ? 1 : 0);
  return clamp(MS.build * (0.35 + 0.25 * MS.tension) + count * (0.45 + 0.55 * MS.tension) + 0.3 * MS.hush, 0, 1);
}

export default {
  name: 'nav2',
  id: 8,
  tag: 'the melody draws the path: pitch moves c through the Mandelbrot set, the build presses it to the boundary, the drop breaks through',
  home: false,      // NAV (id 0) is home until the user approves NAV2
  always: false,    // NAV2 is forced-only: it updates when it is on screen, like every other non-home scene
  cuts: 'event',    // c jumps only at the drop (pathCut 0 + a mode change); every other frame moves c by <= V_MAX*dt
  feats: ['centroid', 'bass', 'high', 'mid', 'riser', 'hp', 'roll', 'onsetRate', 'flux', 'peaks', 'kick', 'bchroma',
    'build', 'tension', 'hush', 'dropExpectedIn', 'fakeoutEvt', 'dropEvt', 'dropStrength', 'dropEnv',
    'beatPhase', 'beatCount', 'hit', 'hitStrength', 'eS', 'eM', 'presence', 'flow', 'seed', 'resolveEvt'],
  state: N2,        // the continuity monitor's shape: {mode, cPath, pathCut, kick:{x}, baby, c}
  rt: { c: N2.c, label: 'nav2', home: true, awayBeat: 0, settledAt: 0, time: 0, log: '' },

  hooks: {
    // &still=1 — every NAV2-only uniform at rest; the no-op gate of every visual commit
    still: (v) => { STILL = v === undefined || v === '' ? 1 : +v; },
    // &pitch=0.8 — pin the pitch height (post-detector: it moves uKoen and the blob's float together)
    pitch: (v) => { DET.pinPitch = v === undefined ? -1 : clamp(+v, 0, 1); },
    scratch: (v) => { DET.pinScratch = v === undefined ? -1 : clamp(+v, 0, 1); },
    swirl: (v) => { DET.pinSwirl = v === undefined ? -1 : clamp(+v, 0, 1); },
    // two arguments: CARD.REG[8].scene.hooks.wish(x, y) — pin the melody's wish, upstream of the spring and the ema
    wish: (x, y) => { DET.pinWish = x === undefined || x === null ? null : [+x, +y]; },
    reset: () => { resetNav2(); resetDet(); resetGreen(); },
    // Green's theorem on c's equipotential (green.js), measured every update(): {Q, A, L, v, dA, R, ok, n} — Q the
    // roundness 4 pi A / L^2 (1 = a circle), v the mean edge speed, dA the area's rate. Meaningful while c is in M
    // (mode INT); outside, the level curve pinches and `ok` says nothing about it, so a trace reads it with the mode.
    green: () => GREEN,
    // &rho=0.9 — pin the radial target, so the picture at a chosen |lambda| can be shot and measured (this is how
    // v0.8's RHO_FREE was chosen; v0.13 rests at RHO_REST and the beat presses from there).
    rho: (v) => { N2.rhoPin = v === undefined ? -1 : clamp(+v, 0, 0.9999); },
    // Measurement only (HARNESS "Bench protocol": CARD.bench cannot see the CPU finder). It calls the scene's own
    // update path n times on the last frame's arguments and returns the MEDIAN in ms. The wall clock here is never
    // read by update/draw/overlay — nothing on screen depends on it — but it DOES advance the navigator's state, so
    // the page it is called in is a measurement page, not a picture.
    timeUpdate: (n) => {
      const k = Math.max(1, Math.round(+n) || 300), t = [];
      if (!LAST || !LENV) return -1;
      const w0 = performance.now();
      for (let i = 0; i < k; i++) {
        const t0 = performance.now();
        updateDet(1 / 60, LAST, LENV.params);
        updateNav2(1 / 60, LENV.now, LAST, { P: LENV.params, isLogical: true });
        t.push(performance.now() - t0);
      }
      const tot = performance.now() - w0;
      t.sort((a, b) => a - b);
      // med is 0 whenever a single call is below the browser's timer resolution; mean over the whole batch is then
      // the number to read (and tools/test_nav2.js measures the same thing in node, where the clock is finer).
      return { med: t[k >> 1], mean: tot / k, tot: tot, n: k };
    },
    n2info: () => ({
      mode: N2.mode, c: [N2.c[0], N2.c[1]], rho: N2.rho, q: N2.q, has: N2.cyc.has, comp: N2.compSize,
      wind: DET.wind, windT: DET.windT, count: DET.count, curl: DET.curl, glow: DET.glow, bump: DET.bump, pulse: DET.pulse,
      ival: DET.ival, E: DET.E, note: N2.note,
      pitch: DET.pitch, lift: DET.lift, sweep: DET.sweep, roll: DET.roll, scratch: DET.scratch, swirl: DET.swirl,
      spin: DET.spin, rate: DET.rate, angle: DET.angle, par: N2.par, lg: N2.lg, pathCut: N2.pathCut, rhoPin: N2.rhoPin,
      gate: N2.gate.on ? N2.gate.p + '/' + N2.gate.q + ':' + N2.gate.ph : '', still: STILL,
      dropExpectedIn: LAST ? LAST.dropExpectedIn : -1, frame: 0,
    }),
  },

  help: {
    feats: {
      centroid: 'the melody: how bright the sound is draws c up and down (only its MOTION, so a bright mix does not park the blob high) and floats the whole blob',
      bass: 'the bass side: bass-heavy music drifts c left toward the period-doubling cascade; also the interior glow, a 5 % zoom-in and the size of the critical-orbit dots',
      high: 'the bright side: bright music drifts c right toward the cusp of the cardioid',
      mid: 'the radius of the circular orbit trap',
      riser: 'a riser is a swirl: the arms curl and the frame starts turning',
      hp: 'a high-pass sweep is a swirl: the same curl and turn',
      roll: 'a drum roll is a swirl: the same curl and turn',
      onsetRate: 'hits per second read as a roll, and arm the scratch gate (real audio only — the fake timeline never fills it)',
      flux: 'the gate on the scratch: a pitch flick only counts when there is a transient behind it',
      peaks: 'the strongest partial is the scratch\'s pitch source, and the four peaks are the four Koenigs modes of the (dormant) drum membrane',
      build: 'the wind-up: c is pressed against the boundary and the arms tighten. A build also closes the gates — a wind-up must never change component',
      tension: 'how much of the build and of the countdown reaches the wind-up',
      hush: 'the silence before the drop tops up the wind-up and brightens the smoulder',
      dropExpectedIn: 'the countdown: eight beats out the wind-up starts pressing c to the rim',
      fakeoutEvt: 'the drop that did not come: the tension leaks out over seconds instead of releasing',
      dropEvt: 'the one cut: c is thrown out of the set along the boundary\'s own normal',
      dropStrength: 'how far outside the ray lands (log2 of the potential, -2.2 up to -0.5)',
      dropEnv: 'zooms the view out by up to 25 %, lights the exterior dust, and releases the frame\'s turn',
      beatPhase: 'the orbit trap\'s rotation and the eased beat clock the picture breathes on',
      beatCount: 'the same clock; a gate needs a beat of held pressure (leaking between the beat\'s pulses), and the drop\'s excursion outside lasts eight beats',
      hit: 'a hit is a beat: it presses c from the resting circle out toward the boundary and the arms spiral in; between hits c breathes back (0.28 s), and how DENSE the hits are holds it part-way out',
      kick: 'the kick is the beat too: the same press as a hit, whichever is stronger',
      bchroma: 'the bass note under each beat names the shape: its pitch class is an internal angle around the cardioid, and the beat pulls c around the rim to it — different pitches, different species',
      hitStrength: 'how hard that hit was: it arms the scratch gate',
      eS: 'how far out along the normal the exterior sits, and the amplitude of the (dormant) drum modes',
      eM: 'trail length (feedback decay 0.7 + 0.16 eM)',
      presence: 'silence freezes the drift, slows the visual clock and fades the picture-in-picture out',
      flow: 'musical time: the bass/bright drift integrates in it, and so does the exterior drift, so silence freezes both',
      seed: 'the section\'s constants: the sign of seed.th is which way the frame stirs',
      resolveEvt: 'a release doubles the visual clock for a moment',
    },
    eli5: 'You are inside the Julia set of one point c, and the melody is driving c. When the tune goes up, c goes up and the whole blob floats with it; the bands and spokes inside slide as it moves. When a build or a swirl comes, c is pressed against the very edge of the Mandelbrot set, where the spiral arms wind tighter and tighter and the frame starts to turn — and the drop is the only thing that breaks through, throwing c outside until the music settles and it walks back in.',
    why: 'NAV navigated by choosing from tables — twelve bulbs by musical interval, three baby copies, fourteen Misiurewicz points — so it could only ever visit places someone had listed, and nothing in it read pitch. Here c is moved by forces instead: the melody pulls, the boundary pushes back, and the pressure of a build is what puts c where the picture is most alive. The boundary is a real wall because inside a hyperbolic component the modulus of the multiplier is a smooth coordinate that reaches exactly 1 at the edge — the exterior distance estimate collapses at a cusp and cannot be used for this. And the tightness of the spiral arms is not an effect: it IS how near c sits to a parabolic root, so pressing c to the rim winds the arms up by construction.',
    math: 'The attracting cycle of an arbitrary interior c is found chart-free: iterate the critical orbit, read the period off a nearest return (q <= 64), polish by Newton on f^q(z) - z; lambda = (f^q)\'(z) falls out of the same pass, and the primitive period is recovered by testing the divisors on the polished point. rho = |lambda| is the interior coordinate (rho -> 1 at the boundary) and central differences of the polish give both grad rho, the wall\'s normal, and dlambda/dc, whose reciprocal is the component\'s size in c. Gates: the internal angle arg lambda / 2pi is addressed by its Farey neighbour p/q with q <= 7; held against the rim, c walks through the parabolic root and the finder re-verifies with period q*k. Outside, the ruler is the Green\'s potential log2 G = log2(log|z_n|) - (n-1) in the same normalisation as the inverse-Boettcher table NAV navigates on, and EXT/HOME follow its gradient. The Koenigs coordinate the interior is coloured by, log|w|/(-ln rho) and arg w - arg(lambda) log|w|/ln rho, is invariant under f^q, so the bands have no seam.',
  },

  score: () => 0,   // forced-only (key 9, &scene=8) until the user approves NAV2: the director never picks it

  post: { fb: { decay: (S) => 0.7 + 0.16 * S.eM }, bloom: { thr: 0.35 }, kaleido: 1 },

  // Six, the cap, named for what the eye sees (CONTRACTS §1.16). trap / dots / pip / reach stay inline expressions.
  params: {
    height: { eli5: 'how high in the set the melody has taken c', range: [-1, 1], from: (MS) => Y_AMP * (MS.centroid - 0.5) },
    side: { eli5: 'how far toward the bass side (left) or the bright side (right)', range: [-1.4, 0.8], from: (MS) => X_HOME + X_AMP * (MS.bass - MS.high) },
    wind: { eli5: 'how hard c is pressed against the boundary: the arms wind up', range: [0, 1], from: (MS) => windTarget(MS) },
    lift: { eli5: 'how far the blob floats up or down with the pitch', range: [-0.3, 0.3], from: (MS) => LIFT * (MS.centroid - 0.45) },
    spin: { eli5: 'how fast the frame is stirred on top of the groove', range: [0, 1.5], from: (MS) => SPIN_SW * (1 - (1 - MS.riser) * (1 - MS.hp) * (1 - MS.roll)) + SPIN_W * windTarget(MS) * windTarget(MS) },
    zoom: { eli5: 'how much of the set is in view: it pumps in on every kick, harder at high energy', range: [0.5, 2], from: (MS) => (1 - 0.05 * MS.bass - 0.07 * MS.hit - (0.03 + 0.06 * MS.eS) * MS.kick) * (1 + 0.25 * MS.dropEnv) },
  },

  colour: { default: 'v2', variants: { v2: {} } },

  init(c) {
    ctx = c;
    N2.log = c.log;
    const CV = this.colour.variants;
    CV.v2.julia = c.mkProg(FS_JULIA_V2, 'julia2-v2');
    CV.v2.mandel = c.mkProg(FS_MANDEL_V2, 'mandel2-v2');
    pt = c.mkProg(VS_PT, FS_PT, 'pt2');
    B_ORB = c.dynBuf(160 * 3, 3);
  },

  update(dt, S, GROOVE, LOOK, env) {
    const N = N2;
    this._P = env.params;
    LAST = S;
    LENV = env;
    if (this.rt.settledAt === 0) N.landed = 0;
    updateDet(dt, S, env.params);
    updateNav2(dt, env.now, S, { P: env.params, isLogical: env.SC.logical === this.id });
    measure(N.c[0], N.c[1], dt);   // Green's ruler on this frame's c (0.03 ms): hooks.green() reads it
    extG = ema(extG, N.mode === 'INT' ? 1 : EXT_DIM, dt, EXT_DIM_TAU);   // the dust's dim (uExtG), eased
    const rt = this.rt;
    rt.home = N.mode === 'INT';
    rt.awayBeat = N.extBeat;
    rt.settledAt = N.landed || 0;
    rt.cycBase = N.cycBase;
    rt.time = N.vtime;
    rt.label = N.mode + ' q' + N.q + (N.gate.on ? ' gate ' + N.gate.p + '/' + N.gate.q : '');
    rt.log = `${N.mode} rho${N.rho.toFixed(3)} q${N.q} w${DET.wind.toFixed(2)} b${DET.bump.toFixed(2)} cu${DET.curl.toFixed(2)} Q${GREEN.Q.toFixed(3)}`;
    this._groove = GROOVE;
    this._S = S;
  },

  draw(tgt, { w, h, vmix, colour }) {
    if (!this._S) return;   // a forced scene is drawn on its first frame before its first update()
    const gl = ctx.gl, S = this._S, N = N2, D = DET, LOOK = ctx.LOOK, Q = ctx.Q, asp = w / h, P = this._P;
    const pr = this.colour.variants[colour].julia;
    ctx.use(pr, tgt, w, h);
    const u = pr.u;
    const cm = Math.hypot(N.c[0], N.c[1]);
    const br = S.beatCount + 1 - Math.pow(1 - S.beatPhase, 3);
    const scale = (1.42 + 0.3 * Math.max(0, cm - 0.8)) * P.zoom;
    const rotv = this._groove.rot + (STILL ? 0 : D.angle);   // the groove's shared angle plus NAV2's own stir
    // The blob floats UP the SCREEN, not up the complex plane: uView.xy is the view's centre in c, so the offset is
    // carried through the same rotation the shader applies to p (z = uView.xy + uView.z*rot(uView.w)*p, and VS_PT's
    // own algebra fixes rot(a) = [[cos,-sin],[sin,cos]]), and negated, because raising the blob lowers the centre.
    const lv = STILL ? 0 : -D.lift * scale, kn = STILL ? 0 : D.pE;
    const vx = -Math.sin(rotv) * lv, vy = Math.cos(rotv) * lv;
    N.view = [vx, vy, scale, rotv];
    gl.uniform2f(u('uC'), N.c[0], N.c[1]);
    gl.uniform4f(u('uView'), vx, vy, scale, rotv);
    gl.uniform2f(u('uKoen'), SLIDE * kn, SLIDE_A * kn);
    gl.uniform1f(u('uCurl'), STILL ? 0 : D.curl);
    gl.uniform1f(u('uGlow'), STILL ? 1 : D.glow);
    gl.uniform1f(u('uRound'), STILL ? 0 : ROUND_G);
    gl.uniform1f(u('uBump'), STILL ? 0 : BUMP_H * D.bump * (1 + D.E));
    if (STILL) gl.uniform4f(u('uLum'), 0, 0, 0, 0);
    else gl.uniform4f(u('uLum'), LUM_IN[0], LUM_IN[1], LUM_EX[0], LUM_EX[1]);
    gl.uniform1f(u('uExtG'), STILL ? 1 : extG);
    const it = Math.min(420, Math.round(Q.iter));
    gl.uniform1i(u('uIter'), it);
    gl.uniform1i(u('uIterLo'), Math.round(it * ITER_LO));
    gl.uniform2f(u('uSc'), 1, 1);
    const ta = Math.PI * br;
    gl.uniform2f(u('uTrapN'), -Math.sin(ta), Math.cos(ta));
    gl.uniform1f(u('uTrapR'), TRAP_0 + TRAP_K * S.mid);
    gl.uniform1f(u('uDrum'), vmix);   // no variant: 0 — the door stays open to re-host DRUM
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
    gl.uniform4f(pt.u('uView'), vx, vy, scale, rotv);   // the orbit dots ride with the blob
    gl.uniform1f(pt.u('uAsp'), asp);
    gl.uniform1f(pt.u('uSize'), h * 0.012 * (DOTS_0 + S.bass));
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
    if (!this._P) return;   // the loop calls every scene's overlay every frame, updated or not
    const gl = ctx.gl, S = this._S, N = N2, LOOK = ctx.LOOK, Q = ctx.Q, cv = this.colour.cur;
    PIP.a = ema(PIP.a, vis * sstep(PIP_LO, PIP_HI, S.presence), dt, 0.5);
    let ex = 0.05;
    for (let i = 0; i < 96; i += 4) ex = Math.max(ex, Math.hypot(N.path[i * 3] - PIP.cx.x, N.path[i * 3 + 1] - PIP.cy.x));
    PIP.cx.step(N.cPath[0], dt);
    PIP.cy.step(N.cPath[1], dt);
    PIP.sc.step(Math.log(clamp(ex * 1.8 + 0.25, 0.3, 1.7)), dt);
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
    gl.uniform1i(pr.u('uIter'), Math.round(90 + 120 * Q.q));
    gl.uniform1f(pr.u('uAlpha'), PIP.a);
    for (let j = 0; j < 32; j++) { // a cut is not a path: no segment across it
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
    const N = N2, D = DET, f = (x) => x.toFixed(2);
    return `nav2 ${N.mode}  c ${N.c[0].toFixed(4)} ${N.c[1].toFixed(4)}  rho ${N.rho.toFixed(4)} q ${N.q} has ${N.cyc.has}  wind ${f(D.wind)} bump ${f(D.bump)} pulse ${f(D.pulse)} Q ${GREEN.Q.toFixed(3)} curl ${f(D.curl)} spin ${f(D.rate)}  pitch ${f(D.pitch)} lift ${D.lift.toFixed(3)}  par ${f(N.par)} tscale ${f(N.timeScale)}${N.gate.on ? '  gate ' + N.gate.p + '/' + N.gate.q : ''}`;
  },
};
