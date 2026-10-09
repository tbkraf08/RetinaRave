// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// NAV2 — the navigator's workbench (DECISIONS §97, 2026-10-08, the user: "I like NAV better than NAV2 → reset NAV2 as NAV
// → all work in NAV2"): a clone of NAV (id 0) at id 8, key `9`, forced-only, being retuned step by step
// (docs/plans/NAV2-RETUNE-PLAN.md). nav.js and shaders.js (the OKLCH mapping) are still byte copies of ../nav/'s; this
// file differs from ../nav/index.js in the registration (name, id, home, always, score, no card, no DRUM variant), the
// program names, the `always: false` overlay guard, the hooks (`n2info()` + `green()` for the §46 trace tools; Green's
// ruler green.js survives as a steering fitness) — and since §99 the legibility pass of look2.js (the exposure knee, the
// loudness smoulder, the snare flash, colour on key — four knobs, every one at rest = NAV's bytes) on the v2 Julia shader.
// Every retune lands here and is proven on `IDS="0 8" tools/scene-md5.sh`; id 0 stays the byte-identical control.
import { TAU, clamp, mix, sstep, ema, frac, Spring } from '../../math/util.js';
import { startGridWorker, LG_MIN, LG_MAX } from '../../math/mandel.js';   // LG_*: the exterior potential's own bounds — the `reach` parameter's range
import { NAV, updateNav } from './nav.js';
import { OK_NAV, FS_JULIA, FS_MANDEL, VS_PT, FS_PT } from './shaders.js';
import { FS_JULIA_V2, FS_MANDEL_V2 } from './shaders-v2.js';
import { measure, G as GREEN } from './green.js';   // Green's theorem on c's equipotential: roundness Q, area A, edge speed v (v0.13)
import { K2, L2, LUM_IN, LUM_EX, FL, update2, pinKey, knob } from './look2.js';   // §99: exposure + colour on key, behind &n2lum / &n2smo / &n2fl / &n2ext / &n2key
import { K3, M2, knob3 } from './move2.js';   // §100: the groove moves c — the kick lane, the beat breath, the sub press, the pitch lean, the trap per bar
import { W2, knob4 } from './walk2.js';   // §101: the phrase walk along the Farey ladder, Green's ruler as the fitness, drops that land somewhere new

const modes = new Float32Array(16), pipPath = new Float32Array(96);
const PIP = { cx: new Spring(-0.6, 1.5), cy: new Spring(0, 1.5), sc: new Spring(Math.log(1.5), 1.6), a: 0 };
let ctx, pt, B_ORB;   // the Julia and PiP programs are per colour mapping: this.colour.variants[name]
// The iteration budget is split (docs/workers/nav-iter.md). An orbit whose accumulated derivative has collapsed
// (|(f^n)'| < 1, the shaders' `dd < 1.`) is inside a basin: it can no longer escape, and with no cycle chart
// (uLam.w = 0 — the beat kick hides it) the only thing left that its iterations can still move is the line trap,
// which has long since found its minimum. Such an orbit stops at ITER_LO of the budget; every other pixel keeps
// all of it. .5 is the lowest fraction at which every scene-md5 pair still comes out byte-identical in BOTH colour
// mappings: at .4 the picture is another 8 % cheaper at f1500 but the OKLCH s0-f360 jpg moves (by 2/255 at its
// worst pixel — the flat branch's pow(lw, .73) amplifies a tL difference that v2's linear ramp quantises away),
// and by ~.2 the v2 pair moves too. f1800 is byte-identical at every fraction down to .2 and a third cheaper.
const ITER_LO = 0.5;
let clipDbg = 0;   // #test only (hooks.clipdbg): 1 = write okClip of the shipped (h,L,C) into o.r, 2 = of the flat .11 chroma

export default {
  name: 'nav2',
  id: 8,
  tag: 'the navigator\'s workbench: a clone of NAV being retuned (bulbs by interval, exterior rays on the drop)',
  // no `card`: no landing tile (CONTRACTS §1.17) while it is a workbench
  home: false,      // NAV (id 0) is the director's home — core/scenes.js:50 keeps the LAST registered home, so a cloned `true` would steal it
  always: true,     // updated every frame like NAV (not forced-only's usual false): loop.js updates the forced scene only from frame 1, and that one missed dt moved every spring — with `true` the s8 pair is NAV's to the byte (§97), and key 1 vs 9 compares the same navigator state
  cuts: 'event',    // c jumps only at drops, chart cuts (pathCut<=2) and beat kicks
  feats: ['interval', 'repeat', 'seed', 'beat', 'beatPhase', 'beatCount', 'dropLiveEvt', 'dropStrength', 'dropEnv', 'intensity',
    'buildLive', 'suspension', 'presence', 'harmUnw', 'arc', 'onset', 'hitStrength', 'hit', 'eS', 'eM', 'tension', 'resolveEvt',
    'bass', 'mid', 'high', 'peaks', // exactly what nav.js, index.js and the shaders read (§12 trimmed 11 v3-era leftovers)
    'snareEvt', 'snareAmp', 'loudRel', 'loudRange', 'loudAbs', 'key', 'mode', 'keyConf', 'valence', 'modeShade', 'harmAngle', 'phrase16Pos', 'bpm', // §99: look2.js
    'kickEvt', 'kickAge', 'kickAmp', 'subGate', 'subNote', 'clockConfPcm', 'barPos', 'tongue21', 'tongue41', 'tongueOn', // §100: move2.js (+ beatgrid.js spin() reads barPos / the tongue ladder)
    'barNovelEvt', 'sectionEvt'], // §101: walk2.js (+ phrase16Pos, loudRel, intensity, presence, harmUnw already above)
  state: NAV,       // ./nav.js's own object — a second module instance, not ../nav/nav.js's; the monitor's shape {mode, cPath, pathCut, kick:{x}, baby}
  rt: { c: NAV.c, label: 'nav2', home: true, awayBeat: 0, settledAt: 0, time: 0, log: '' },
  // no `variants`: NAV's DRUM is id 4 and an id is registered once (core/scenes.js throws on a second)
  hooks: {
    baby: (i) => { NAV.forceBaby = +i; },      // this clone's forceBaby (its own NAV object, above)
    clipdbg: (v) => { clipDbg = +v || 0; },   // the gamut probe of both escape branches, read back through an RGBA8 target
    // §99's knobs (look2.js knob()): &n2lum=0 knee off · &n2smo=0 the old par² smoulder · &n2fl=0 the old flash · &n2ext=0 no
    // exterior dim / halo narrowing · &n2key=0 the old hue drift; a comma list sets a term's numbers (look2.js knob() says which)
    n2lum: (v) => knob('lum', v),
    n2smo: (v) => knob('smo', v),
    n2fl: (v) => knob('fl', v),
    n2ext: (v) => knob('ext', v),
    n2key: (v) => knob('key', v),
    key: pinKey,                              // &key=<0..11>: pin the key (mode by the second argument from the console), as TORUS2 / GIELIS
    // §100's knobs (move2.js knob3()): &n2kick=0 v3's onset picker · =THR[,REFR,GAIN,VOID] the lane's numbers · &n2breath=AMP · &n2sub=DEPTH · &n2pitch=GAIN · &n2trap=0 the old π per beat / =ACC
    n2kick: (v) => knob3('kick', v),
    n2breath: (v) => knob3('breath', v),
    n2sub: (v) => knob3('sub', v),
    n2pitch: (v) => knob3('pitch', v),
    n2trap: (v) => knob3('trap', v),
    // §101's knobs (walk2.js knob4()): &n2walk=0 the species only (NAV) · =DEPTH[,MINSIZE[,PER]] · &n2green=0 no ruler in the choice / no early step · =W[,QMAX[,BARS]] · &n2drop=0 NAV's launch ray + θ target
    n2walk: (v) => knob4('walk', v),
    n2green: (v) => knob4('green', v),
    n2drop: (v) => knob4('drop', v),
    // Green's theorem on c's equipotential (green.js), measured every update(): {Q, A, L, v, dA, R, ok, n} — the §46 trace
    // tools (tools/accept/v0.13/nav2-window.py, det13.py) read it as hooks.green()
    green: () => GREEN,
    // the navigator's state in one object, for the same tools' `hooks.n2info()` line (every field NAV's hud() prints, plus
    // the chart coordinates): mode, c, h, alpha, rho = |λ| (1 − h is not it — h is the depth spring; rho comes from the cycle),
    // phi, par, bulb p/q, baby P, kick, theta, lg, cPath, pathCut, cyc has/q
    n2info: () => ({
      mode: NAV.mode, c: [NAV.c[0], NAV.c[1]], cPath: [NAV.cPath[0], NAV.cPath[1]], h: NAV.h.x, alpha: NAV.alpha.x,
      rho: Math.exp(NAV.cyc.lnr), phi: NAV.phi.x, par: NAV.par, bulb: NAV.bulb.p + '/' + NAV.bulb.q, q: NAV.cyc.q, has: NAV.cyc.has,
      baby: NAV.baby ? NAV.baby.P : 0, kick: NAV.kick.x, theta: NAV.th.x, lg: NAV.lg.x, pathCut: NAV.pathCut, tscale: NAV.timeScale,
      cycBase: NAV.cycBase | 0, extBeat: NAV.extBeat, loudBeats: NAV.loudBeats,
      hueT: L2.hueT, base: L2.base, smo: L2.smo, extG: L2.extG, extK: L2.extK, fl: L2.fl, key: L2.key, keyMode: L2.mode, keyConf: L2.conf, phr: L2.phr,   // §99
      tight: M2.tight, breath: M2.breath, crest: M2.crest, subE: M2.subE, subSeen: M2.subSeen, lean: M2.lean, trapA: M2.trapA, fires: M2.fires, lastK: M2.lastK, acc: M2.sp.acc,   // §100
      wk: W2.k, wplace: W2.place ? W2.place.p + '/' + W2.place.q : '', wcands: W2.cands.join(' '), wpick: W2.pick, wq: W2.qPred, wsteps: W2.steps, wdue: W2.due, wdwell: W2.dwell, wearly: W2.early, wover: W2.over, wdrops: W2.drops, wbase: W2.base, Q: GREEN.Q,   // §101
    }),
  },
  help: {
    // what each field in `feats` moves on this screen (CONTRACTS §1.13); a field without a line falls back to FEATS[k].drives
    feats: {
      interval: 'which bulb c heads for: the interval picks the p/q bulb (of the baby copy when inside one) — the SPECIES; §101\'s walk visits its Farey neighbours phrase by phrase',
      repeat: 'a repeated section may dive into a baby copy of M (which one comes from the seed)',
      seed: 'the section\'s constants: which baby copy, the interior angle offset, the exterior angle',
      beat: 'retargeting happens on the beat, never on the root-to-ray bridge; loud beats are counted toward leaving',
      beatPhase: 'the orbit trap\'s rotation and the eased beat clock the picture breathes on',
      beatCount: 'beats since the last exit: settling back inside, which ray to take, the landing time',
      dropLiveEvt: 'the exit: c is thrown out of M along an external ray — the live detector\'s slam (2026-09-29, the user\'s stream-mode A/B: "B looks good", "#1" = NAV only)',
      dropStrength: 'how deep outside the ray lands (log2 of the potential, -2.2 down to -0.5)',
      dropEnv: 'zooms the view out by up to 25 % and lights the exterior dust while the drop rings',
      intensity: 'how deep into the bulb c sits, and the loud count that leads to leaving',
      buildLive: 'parks c at the bulb\'s root (the cusp) while the void before a drop runs (the live build detector, §54; v3\'s build until 2026-09-29)',
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
      snareEvt: 'the flash on the set\'s edge is the snare\'s: the ears\' snare event places it (§99)',
      snareAmp: 'how bright that edge flash is: the size of the last snare',
      loudRel: 'the interior\'s smoulder follows the track\'s own loudness, not the root (§99): loudRel against the range the track has shown',
      loudRange: 'how many LU the track has shown so far: the ladder the smoulder is stretched over (loudlight.js)',
      loudAbs: 'whether the loudness stage runs: when it does not (&loud=0) the smoulder falls back to eS',
      key: 'the hue: the key\'s place on the circle of fifths anchors the palette (keycolour.js, as TORUS2 / GIELIS)',
      mode: 'minor pulls the key hue toward the cool half of the wheel, major toward the warm',
      keyConf: 'how far the key is trusted: below a third the hue slides back to the old drift',
      valence: 'a touch of warmth on the key hue (keycolour.js VALW)',
      modeShade: 'whether THIS bar sits on a major or a minor degree: a per-bar lean of the key hue warm or cool (§82)',
      harmAngle: 'the key hue\'s fallback when no key is trusted: the nearest fifth of the harmony angle',
      phrase16Pos: 'the hue steps a twelfth of a turn around the key hue when the 16-beat phrase wraps, eased over a beat',
      bpm: 'how long that hue step takes to settle (a beat)',
      kickEvt: 'the Misiurewicz jump fires on the ears\' own kick (§100), not v3\'s onset picker: c jump-cuts toward the nearest Misiurewicz point and springs back',
      kickAge: 'places that jump between frames: the spring is stepped by the age on the event frame',
      kickAmp: 'how far the jump goes (the sqrt law of §74, floor .31) and the goldilocks gate: a kick smaller than the threshold does not jump',
      subGate: 'the sub sounding presses c toward the bulb\'s rim (the Koenigs arms tighten); the sub leaving relaxes it toward the centre — nothing until the gate has opened once',
      subNote: 'the bass note leans c\'s internal angle within the bulb: above the key one way, below it the other, a glide becomes a lean',
      clockConfPcm: 'how big the beat breath is allowed to be: the clock\'s own confidence scales the per-beat press of the radius',
      barPos: 'the downbeat: the beat breath and the trap\'s turn take a step and a half on the bar\'s first beat (beatgrid.js)',
      tongue21: 'the double time arriving (a RISE of the 8th-note depth over 16 beats) makes the breath\'s crest bigger — never faster (§78)',
      tongue41: 'the same accent from the 16th-note depth\'s rise',
      tongueOn: 'the accent\'s A/B gate: −1 (the stage off) is the plain profile',
      barNovelEvt: 'a bar that starts something new is a reason to move: the phrase walk takes its step early (§101)',
      sectionEvt: 'a new section is a reason to move: the phrase walk steps (§101)',
    },
    eli5: 'You are inside the Julia set of one point c. The music walks c around the Mandelbrot set: consonant intervals pick big bulbs, the drop throws c outside along an external ray.',
    why: 'Bulbs are indexed by rotation number p/q, which is the same combinatorics as musical intervals (just ratios). Drops are the only exits from the interior: through parabolic roots onto landing rays. The interior smoulders as the multiplier nears 1 — critical slowing, the orbit taking longer and longer to settle. Two colourings: the default is v0.2\'s ramp — a blue exterior, the Koenigs bands lighting the dark interior — and `&colour=oklch` swaps in a perceptual one: inside a component hue is the internal angle arg lambda, one hue for the whole component, and outside it is the escape count — the equipotentials of the set — so the colour comes out as concentric bands that follow the set\'s own outline, in the Julia set and in the picture-in-picture alike.',
    math: 'Interior chart: multiplier λ=ρe^{iφ} of the p/q bulb via Newton in (z,c). Exterior chart: inverse Böttcher map on a (θ, log₂G) table. Baby copies: tuning, zoom-matched at the root (hybrid equivalence).',
  },

  score: () => 0,   // forced-only (key 9, &scene=8; §93's forced-only row): the director never picks the workbench

  post: { fb: { decay: (S) => 0.7 + 0.16 * S.eM }, bloom: { thr: 0.35 }, kaleido: 1 },

  // The visual parameters of this screen, and what feeds each one by default (CONTRACTS §1.16). Every `from(S)` is
  // the expression `draw()` / `nav.js` computed inline before v0.5 — moved verbatim, never rewritten, so the picture
  // is byte-identical while nothing is routed (one commit per move, each proved by the scene-md5 pair + parity).
  params: {
    trap: { eli5: 'how wide the ring is that the orbit trap lights up', range: [0.35, 1.25], from: (S) => 0.35 + 0.9 * S.mid },
    zoom: { eli5: 'how far the view is pulled back from the Julia set', range: [0.5, 2], from: (S) => (1 - 0.05 * S.bass - 0.07 * S.hit) * (1 + 0.25 * S.dropEnv) },
    dots: { eli5: 'how big the dots of the critical orbit are', range: [0, 3], from: (S) => 1 + S.bass },
    pip: { eli5: 'how visible the little map of the Mandelbrot set is', range: [0, 1], from: (S) => sstep(0.05, 0.3, S.presence) },
    // the one parameter nav.js reads (through updateNav's opts): the target of the exterior spring, already clamped to its own range by the expression it was
    reach: { eli5: 'how far outside the set the drop throws the picture', range: [LG_MIN, LG_MAX], from: (S) => clamp(mix(-2.6, -9, clamp(0.55 * S.eS + 0.5 * S.tension, 0, 1)) + 3.2 * S.dropEnv, LG_MIN, LG_MAX) },
  },

  // Two colourings of the same dynamics (CONTRACTS §1.4). `v2` (the default — DECISIONS §26) is v0.2's pal() ramp:
  // a blue exterior with the Koenigs bands inside. `oklch` is §25's perceptual pass, re-aimed by
  // `docs/workers/hue-follows-set.md` (hue = the equipotential outside, arg lambda inside),
  // opt-in with `&colour=oklch`. The post params are the same for both, so neither variant carries one; each holds
  // the two programs init() compiled for it, and only the OKLCH pair declares uClipDbg.
  colour: { default: 'v2', variants: { v2: {}, oklch: {} } },

  init(c) {
    ctx = c;
    NAV.log = c.log;
    const CV = this.colour.variants;
    CV.v2.julia = c.mkProg(FS_JULIA_V2, 'julia2-v2');            // the default: v0.2's pal() ramp, no OKLCH chunk
    CV.v2.mandel = c.mkProg(FS_MANDEL_V2, 'mandel2-v2');
    CV.oklch.julia = c.mkProg(c.oklch + OK_NAV + FS_JULIA, 'julia2');   // §1.14: hue and lightness independent, so arg lambda and |lambda| can drive one each
    CV.oklch.mandel = c.mkProg(c.oklch + OK_NAV + FS_MANDEL, 'mandel2');
    pt = c.mkProg(VS_PT, FS_PT, 'pt2');
    B_ORB = c.dynBuf(160 * 3, 3);
    startGridWorker();   // once per page (mandel.js GRIDW): NAV's init already started it, the table is shared
  },

  update(dt, S, GROOVE, LOOK, env) {
    const N = NAV, SC = env.SC;
    this._P = env.params;   // §1.16: the same object every frame, refreshed before this update(); draw()/overlay() read it back the same frame
    if (this.rt.settledAt === 0) N.landed = 0; // the director consumed the landing (zeroed rt.settledAt)
    updateNav(dt, env.now, S, { isLogical: SC.logical === this.id, drum: SC.vT > 0.5, P: env.params });
    const rt = this.rt;
    rt.home = N.mode === 'INT';
    rt.awayBeat = N.extBeat;
    rt.settledAt = N.landed || 0;
    rt.cycBase = N.cycBase;
    rt.time = N.vtime;
    rt.label = N.mode + (N.baby ? ' P' + N.baby.P : '') + ' ' + N.bulb.p + '/' + N.bulb.q;
    rt.log = `${N.mode} h${N.h.x.toFixed(2)} lg${N.lg.x.toFixed(1)} par${N.par.toFixed(2)}`;
    measure(N.c[0], N.c[1], dt);   // Green's ruler on this frame's c (0.03 ms, pure CPU — no pixel reads it): hooks.green()
    update2(dt, S, N, LOOK);       // §99: the base light, the smoulder, the exterior dim, the snare flash, the key hue
    this._groove = GROOVE;
    this._S = S;
  },
  draw(tgt, { w, h, vmix, colour }) {
    if (!this._S) return;   // always: false — a forced scene is drawn on its first frame before its first update() (CONTRACTS §1)
    const gl = ctx.gl, S = this._S, N = NAV, GROOVE = this._groove, LOOK = ctx.LOOK, Q = ctx.Q, asp = w / h, P = this._P;
    const pr = this.colour.variants[colour].julia;
    ctx.use(pr, tgt, w, h);
    const u = pr.u, B = N.baby;
    const hueT = K2.key ? L2.hueT : LOOK.hueT;   // §99: colour on key — uPal.x and the tint (use() uploaded LOOK's; the knob off leaves them)
    if (K2.key) {
      gl.uniform4f(u('uPal'), hueT, LOOK.pal[1], LOOK.pal[2], LOOK.pal[3]);
      gl.uniform3fv(u('uTint'), ctx.hsv(hueT, 0.75, 1));
    }
    gl.uniform4f(u('uN2'), K2.lum, K2.smo, K2.fl, 0);   // §99's three shader terms, each a knob; all 0 (and uExtG / uExtK 1) = NAV's bytes
    gl.uniform4f(u('uLum'), LUM_IN[0], LUM_IN[1], LUM_EX[0], LUM_EX[1]);
    gl.uniform1f(u('uExtG'), L2.extG);
    gl.uniform1f(u('uExtK'), L2.extK);
    gl.uniform1f(u('uSmo'), L2.smo);
    gl.uniform4f(u('uFl'), FL.WHITE, FL.ON, FL.HIT, L2.fl);
    const cm = B ? Math.hypot(N.c[0] - B.c0[0], N.c[1] - B.c0[1]) / B.size : Math.hypot(N.c[0], N.c[1]);
    // inside a baby the same view is conjugated by w=A z (matched at the cut), then eased out (bz) until the host's decorations frame the copy
    const br = S.beatCount + 1 - Math.pow(1 - S.beatPhase, 3);
    const scale = (1.42 + 0.3 * Math.max(0, cm - 0.8)) * P.zoom * (B ? mix(1, 1.7, N.bz.x) / B.A : 1);
    const rotv = GROOVE.rot - (B ? B.argA : 0);
    N.view = [0, 0, scale, rotv];
    gl.uniform2f(u('uC'), N.c[0], N.c[1]);
    gl.uniform4f(u('uView'), 0, 0, scale, rotv);
    const it = Math.min(420, Math.round(Q.iter * (B ? 1.6 : 1)));
    gl.uniform1i(u('uIter'), it);
    gl.uniform1i(u('uIterLo'), Math.round(it * ITER_LO));   // the short budget of §1.4's split: see ITER_LO
    gl.uniform2f(u('uSc'), B ? 1 / B.A : 1, B ? 1 / B.P : 1);
    const ta = K3.trap ? M2.trapA : Math.PI * br;   // §100: a quarter turn per beat (π per bar) + ACC turns on each crest, beatgrid's profile; off = NAV's half turn per beat
    gl.uniform2f(u('uTrapN'), -Math.sin(ta), Math.cos(ta));
    gl.uniform1f(u('uTrapR'), P.trap);
    gl.uniform1f(u('uDrum'), vmix);
    gl.uniform2f(u('uZs'), N.cyc.zs[0], N.cyc.zs[1]);
    gl.uniform4f(u('uLam'), N.cyc.lnr, N.cyc.arg, N.cyc.q, N.cyc.has);
    gl.uniform1f(u('uEps2'), N.cyc.eps2);
    gl.uniform1f(u('uPx'), 2 * scale / h);
    gl.uniform1f(u('uPar'), N.par); // critical slowing: how close the multiplier is to the unit circle (0 outside / far from a root)
    if (colour === 'oklch') gl.uniform1f(u('uClipDbg'), clipDbg);   // the gamut probe is that mapping's own uniform
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
    const oc = ctx.hsv(frac((K2.key ? L2.hueT : LOOK.hue) + 0.5), 0.35, 0.5 * LOOK.pal[3]);   // §99: the dots follow the key hue too
    gl.uniform3f(pt.u('uCol'), oc[0], oc[1], oc[2]);
    gl.uniform1f(pt.u('uLine'), 0);
    ctx.upload(B_ORB, N.orbit, 160 * 3);
    gl.bindVertexArray(B_ORB.vao);
    gl.drawArrays(gl.POINTS, 0, 160);
    gl.disable(gl.BLEND);
  },

  // Picture-in-picture: M itself with the path of c. Post-composite, scissored, direct to screen.
  overlay(PW, PH, vis, dt) {
    if (!this._P) return;   // always: false — loop.js calls every scene's overlay every frame, updated or not (CONTRACTS §1 line 49)
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
    const hueT = K2.key ? L2.hueT : LOOK.hueT;   // §99: the PiP and its path on the same key hue
    gl.uniform4fv(pr.u('uPal'), [hueT, 0.2, 0.6, 1]);
    gl.uniform3fv(pr.u('uTint'), K2.key ? ctx.hsv(hueT, 0.75, 1) : LOOK.tint);
    gl.uniform4f(pr.u('uView'), PIP.cx.x, PIP.cy.x, pipS, 0);
    gl.uniform1i(pr.u('uIter'), Math.round(N.baby ? 256 : 90 + 120 * Q.q));
    gl.uniform1f(pr.u('uAlpha'), PIP.a);
    if (cv === 'oklch') gl.uniform1f(pr.u('uClipDbg'), clipDbg);
    for (let j = 0; j < 32; j++) { // a chart cut is not a path: no segment across it
      pipPath[j * 3] = N.path[j * 9];
      pipPath[j * 3 + 1] = N.path[j * 9 + 1];
      pipPath[j * 3 + 2] = (N.pathCut >= j * 3 && N.pathCut < j * 3 + 3) ? 0 : (1 - j / 32) * (j ? 1 : 1 + S.hit);
    }
    gl.uniform3fv(pr.u('uPath[0]'), pipPath);
    gl.uniform3fv(pr.u('uPc'), ctx.hsv(frac(hueT + 0.45), 0.55, 1));
    ctx.tri();
    gl.disable(gl.BLEND);
    gl.disable(gl.SCISSOR_TEST);
  },

  hud() {
    const N = NAV, f = (x) => x.toFixed(2);
    return `nav2 ${N.mode}  c ${N.c[0].toFixed(4)} ${N.c[1].toFixed(4)}  h ${f(N.h.x)} alpha ${N.alpha.x.toFixed(3)}  theta ${N.th.x.toFixed(3)} log2G ${f(N.lg.x)}  par ${f(N.par)} tscale ${f(N.timeScale)}  bulb ${N.bulb.p}/${N.bulb.q}${N.baby ? ' baby P' + N.baby.P : ''}  cycBase ${N.cycBase | 0}  key ${L2.key}${L2.mode ? 'm' : 'M'} kc ${L2.conf.toFixed(2)} hue ${L2.hueT.toFixed(3)} base ${L2.base.toFixed(2)} smo ${L2.smo.toFixed(3)}`;
  },
};
