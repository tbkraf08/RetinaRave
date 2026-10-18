// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// NAV3 — the navigator that ROLLS (docs/workers/brief-nav3.md, 2026-10-17; the user: "clone nav -> review … chart-free
// navigation … parabolic implosion … improve nav clone"): id 6, key `7`, forced-only (score 0). Step 1 (DECISIONS §140) is a byte
// clone of NAV2 (id 2, the home — untouched) by the §97 recipe: this file differs from ../nav2/index.js in the registration, the
// program names, the hook names (`n2*` → `n3*`: hooks are dispatched by NAME across scenes, core/harness.js) and the label; every
// other file is a byte copy (tools/test_nav3.js counts them). Step 2 replaces the table walk (BULBS / BABIES / MISI) with the ball
// rolling inside M on assets/math/field.js (findCycle / rhoGrad / nearestRational); step 3 turns the drop into a parabolic
// implosion (Fatou petals on the way in, the Lavaurs explosion on the way out). `always: false`: updated only while on screen, so
// draw() / overlay() keep the forced-scene first-frame guards (CONTRACTS §1; §97's freeze).
import { TAU, clamp, mix, sstep, ema, frac, Spring } from '../../math/util.js';
import { NAV, updateNav, knob5 } from './nav.js';
import { IMP, OUT3, knobDrop, knobImp } from './implode.js';   // §140 step 3: the implosion's uniforms (uImp / uZ0 / uA / uSig) and knobs   // §140 step 2: the ball rolling inside M on math/field.js — no mandel.js table, no grid worker
import { OK_NAV, FS_JULIA, FS_MANDEL, VS_PT, FS_PT } from './shaders.js';
import { FS_JULIA_V2, FS_MANDEL_V2 } from './shaders-v2.js';
import { measure, G as GREEN } from './green.js';   // Green's theorem on c's equipotential: roundness Q, area A, edge speed v (v0.13)
import { K2, L2, LUM_IN, LUM_EX, FL, update2, pinKey, knob } from './look2.js';   // §99: exposure + colour on key, behind &n3lum / &n3smo / &n3fl / &n3ext / &n3key
import { K3, M2, knob3 } from './move2.js';   // §100: the groove moves c — the kick lane, the beat breath, the sub press, the pitch lean, the trap per bar (a byte copy of nav2's)

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
const ITER_Q = 0.15, ITER_QMAX = 8;   // §140: the Julia budget grows by ITER_Q per unit of period above 1 (a period-7 bulb ×1.9), capped at period 1 + ITER_QMAX; the shader loop's 420 is the hard cap
const IMP_ITER_MUL = 1.2;   // §140 quality: the implosion's iteration budget = IMP_ITER_MUL × the governor's Q.iter (64 + 200 q), capped at OUT3.ITER 320 — 317 at q 1, 228 at q .63 (a first pass at 1.6 / 420 left q at .82–.89 on the drop windows against NAV2's .91), so the governor's answer to the drop's cost is not a halved render scale
const PIP_SIZE = 0.6, PIP_MIN = 0.03;   // §140: the little map's half-width ≈ PIP_SIZE × the component's size, never under PIP_MIN
let clipDbg = 0;   // #test only (hooks.clipdbg): 1 = write okClip of the shipped (h,L,C) into o.r, 2 = of the flat .11 chroma

export default {
  name: 'nav3',
  id: 6,   // key `7` (core/hud.js: digit k forces REG[k − 1]); seventh in main.js's list so REG stays dense 0..6 (§118)
  tag: 'the music rolls c inside the Mandelbrot set with no chart: loud presses it to the rim, pitch lifts it, a build rolls it through a root into a child bulb; the drop implodes the Julia set',
  card: { title: 'NAV3', blurb: 'the navigator that rolls: no chart, no table — the music pushes c inside M and the drop implodes the Julia set' }, // landing tile (CONTRACTS §1.17); the picture is site/thumbs/nav3.jpg (tools/thumbs.sh "6:360")
  home: false,      // NAV2 (id 2) is the home; this is the workbench
  always: false,    // forced-only: updated only while on screen (the brief); draw() / overlay() guard the first frame before the first update()
  cuts: 'event',    // c jumps only at drops, chart cuts (pathCut<=2) and beat kicks
  feats: ['beatPhase', 'beatCount', 'dropLiveEvt', 'mapDropEvt', 'dropEvt', 'dropEnv', 'intensity', 'buildLive', 'suspension', 'presence', 'arc', 'eS', 'eM', 'tension', 'resolveEvt',
    'hit', 'bass', 'mid', 'high', 'peaks', // index.js's draw (the trap turn, the zoom, the dots, the DRUM modes) + nav.js (park, settle, the visual clock)
    'loudRel', 'loudRange', 'loudAbs', 'centroid', 'voxS', 'voxHz', 'voxConf', 'harmAngle', 'key', 'keyConf', 'dropExpectedIn', 'sectionEvt', // §140 nav.js: loud → ρ, pitch → θ (math/vox.js), the key / harmony turn, the gate, the mirror
    'snareEvt', 'snareAmp', 'mode', 'valence', 'modeShade', 'phrase16Pos', 'bpm', // §99: look2.js (+ loudRel loudRange loudAbs key keyConf harmAngle above)
    'onset', 'hitStrength', 'kickEvt', 'kickAge', 'kickAmp', 'subGate', 'subNote', 'clockConfPcm', 'barPos', 'tongue21', 'tongue41', 'tongueOn'], // §100: move2.js (+ beatgrid.js spin() reads barPos / the tongue ladder)
  state: NAV,       // ./nav.js's own object; the monitor's shape {mode, cPath, pathCut, kick:{x}, baby}
  rt: { c: NAV.c, label: 'nav3', home: false, awayBeat: 0, settledAt: 0, time: 0, log: '' },
  // no `variants`: DRUM (id 4, forced-only since §93) stays on ../nav/ — an id is registered once (core/scenes.js throws on a second), and the least churn keeps it with the code that draws it
  hooks: {
    baby3: (i) => { NAV.forceBaby = +i; },     // this clone's forceBaby (its own NAV object, above); `baby3`: hooks are global by name, &baby= stays NAV2's
    clipdbg: (v) => { clipDbg = +v || 0; },   // the gamut probe of both escape branches, read back through an RGBA8 target
    // §99's knobs (look2.js knob()): &n3lum=0 knee off · &n3smo=0 the old par² smoulder · &n3fl=0 the old flash · &n3ext=0 no
    // exterior dim / halo narrowing · &n3key=0 the old hue drift; a comma list sets a term's numbers (look2.js knob() says which)
    n3lum: (v) => knob('lum', v),
    n3smo: (v) => knob('smo', v),
    n3fl: (v) => knob('fl', v),
    n3ext: (v) => knob('ext', v),
    n3key: (v) => knob('key', v),
    key: pinKey,                              // &key=<0..11>: pin the key (mode by the second argument from the console), as TORUS2 / GIELIS
    // §100's knobs (move2.js knob3()): &n3kick=0 v3's onset picker · =THR[,REFR,GAIN,VOID] the lane's numbers · &n3breath=AMP · &n3sub=DEPTH · &n3pitch=GAIN · &n3trap=0 the old π per beat / =ACC
    n3kick: (v) => knob3('kick', v),
    n3breath: (v) => knob3('breath', v),
    n3sub: (v) => knob3('sub', v),
    n3pitch: (v) => knob3('pitch', v),
    n3trap: (v) => knob3('trap', v),
    // §140's knobs (nav.js knob5()): &n3roll=RHO_LO,RHO_HI[,TH0,TH_SPAN[,GAIN,VMAX]] · &n3gate=QMAX,TOL[,BUILD,RISE[,FALL,EXIT_BARS[,DIVE]]] · &n3kick3=LEN
    n3roll: (v) => knob5('roll', v),
    n3gate: (v) => knob5('gate', v),
    n3kick3: (v) => knob5('kick3', v),
    n3dance: (v) => knob5('dance', v),
    n3conv: (v) => knob5('conv', v),         // &n3conv=CONV_RIM,CONV_R0,CONV_MAX — the convergence radius at the rim (the depth pass's band A/B)       // &n3dance=BASS,KICK[,HIT[,TURN[,SWAY[,SNARE]]]] — the §140 retune's reactive dance (nav.js DANCE)
    n3drop: knobDrop,                         // &n3drop=live: the live slam only (NAV2's read); default both detectors (the fake timeline has no live slam)
    n3imp: knobImp,                           // &n3imp=EPS[,EPS_BEAT[,EPS_DROP[,PET_K[,PET_R[,T_IN[,SETTLE]]]]]] — the implosion's numbers (implode.js OUT3)
    // Green's theorem on c's equipotential (green.js), measured every update(): {Q, A, L, v, dA, R, ok, n} — the §46 trace
    // tools (tools/accept/v0.13/nav2-window.py, det13.py) read it as hooks.green()
    green3: () => GREEN,                      // `green3`: &green / CARD.hooks.green stay NAV2's (hooks are global by name)
    // the ball's state in one object for the trace tools (`hooks.n3info()`): mode, the drawn c, the ball, ρ / θ and their targets,
    // the period q, the component's size, the gate's address, the stack depth, the counters (crossings, stalls, fails, time on the rim)
    n3info: () => ({
      mode: NAV.mode, c: [NAV.c[0], NAV.c[1]], ball: [NAV.ball[0], NAV.ball[1]], rho: NAV.rho, th: NAV.th, rhoT: NAV.rhoT.x, thT: NAV.thT.x,
      q: NAV.cyc.q, has: NAV.cyc.has, size: NAV.size, par: NAV.par, gate: NAV.gate.p + '/' + NAV.gate.q, gateErr: NAV.gate.err, gateOn: NAV.gate.on,
      depth: NAV.stack.length, maxQ: NAV.maxQ, crosses: NAV.crosses, stalls: NAV.stalls, fails: NAV.fails, rimT: NAV.rimT, loud: NAV.loud, mirror: NAV.mirror,
      kick: NAV.kick.x, pathCut: NAV.pathCut, tscale: NAV.timeScale, cycBase: NAV.cycBase | 0, extBeat: NAV.extBeat, fell: NAV.fell,
      imp: { x: IMP.x, y: IMP.y, q: IMP.q, R: IMP.R, z0: IMP.z0.slice(), a: Math.hypot(IMP.a[0], IMP.a[1]), eps: IMP.eps, sig: IMP.sig, T: IMP.T, passes: IMP.passes, esc: IMP.esc, escMax: IMP.escMax, passMax: IMP.passMax, fan: IMP.fan, Rp: IMP.Rp, drops: IMP.drops, frames: IMP.frames },   // §140 step 3: the implosion's record (implode.js IMP)
      hueT: L2.hueT, base: L2.base, smo: L2.smo, extG: L2.extG, extK: L2.extK, fl: L2.fl, key: L2.key, keyMode: L2.mode, keyConf: L2.conf, phr: L2.phr,   // §99
      tight: M2.tight, breath: M2.breath, crest: M2.crest, subE: M2.subE, subSeen: M2.subSeen, lean: M2.lean, trapA: M2.trapA, fires: M2.fires, lastK: M2.lastK, acc: M2.sp.acc,   // §100
      Q: GREEN.Q,
    }),
  },
  help: {
    // what each field in `feats` moves on this screen (CONTRACTS §1.13); a field without a line falls back to FEATS[k].drives
    feats: {
      beatPhase: 'the orbit trap\'s rotation and the eased beat clock the picture breathes on',
      beatCount: 'beats since the drop: how long c stays outside before it comes back in',
      dropLiveEvt: 'the drop: c leaves the component through its rim along the wall\'s normal — step 3 makes it the parabolic implosion (the live detector\'s slam)',
      mapDropEvt: 'the file map\'s drop, on its exact bar line, fires the same exit (§107\'s rule: the live slam OR the map\'s line)',
      dropEvt: 'the fake timeline\'s drop fires the same exit — the live detector never arms on #test; &n3drop=live reads the live slam only, as NAV2',
      dropEnv: 'zooms the view out by up to 25 % and lights the exterior dust while the drop rings; the return waits until it has faded',
      intensity: 'the ball\'s step: a bar with more energy closes more of the distance to where the music points per second',
      buildLive: 'the void before a drop presses the ball against the rim and ASKS to go in: at a p/q root the ball crosses into the child bulb (§140)',
      suspension: 'a held tension also presses the ball against the rim (the gateway)',
      presence: 'silence freezes the ball and slows the visual clock; the picture-in-picture fades out',
      arc: 'a peak keeps c outside longer after a drop (48 beats against 8)',
      eS: 'the loudness ladder\'s fallback when the loudness stage is off; the exterior depth; the DRUM modes\' amplitude',
      eM: 'trail length (feedback decay 0.7 + 0.16 eM)',
      tension: 'how far outside the set the drop throws c (the `reach` parameter)',
      resolveEvt: 'a release doubles the visual clock for a moment',
      hit: 'a flash on the set\'s edge, a slight zoom-in, the bright head of the path in the picture-in-picture',
      bass: 'the glow of the set\'s interior, a 5 % zoom-in, the size of the critical-orbit dots',
      mid: 'the radius of the circular orbit trap',
      high: 'the circular trap\'s highlight',
      peaks: 'DRUM: the four spectral peaks become the four Koenigs modes (frequency picks the mode, amplitude its weight)',
      loudRel: 'LOUD IS OUT: the track\'s own loudness ladder sets |λ| — quiet near the component\'s centre (the Koenigs spiral loose), loud against the rim (the spiral tight, the curl); a rise over two bars asks the gate to open, a fall inside a child rolls the ball back out',
      loudRange: 'how many LU the track has shown so far: the ladder the ball\'s radius is stretched over (loudlight.js)',
      loudAbs: 'whether the loudness stage runs: when it does not (&loud=0) the ladder falls back to eS',
      centroid: 'the pitch\'s stand-in when nobody sings: the spectral brightness as a height, lifting c toward the 1/3 bulb',
      voxS: 'PITCH IS UP: while someone sings, the sung pitch\'s height (math/vox.js) sets the internal angle — Im c rises with the pitch on the cardioid; voxS weights it against the centroid',
      voxHz: 'the sung pitch itself, as a height on the voice\'s range (log2 over four octaves from A2)',
      voxConf: 'whether the voice is trusted: 0 (the fake timeline) leaves the centroid in charge',
      harmAngle: 'the harmony\'s place on the circle of fifths leans the internal angle: which part of the rim the ball slides toward',
      key: 'the key\'s tonic picks a sector of the rim (weighted by keyConf); and the hue, as on every scene (keycolour.js)',
      keyConf: 'how far the key is trusted: the rim sector and the key hue fade with it',
      dropExpectedIn: 'a drop expected on the grid asks the gate to open: against the rim at a p/q root, the ball crosses into the child',
      sectionEvt: 'a new section mirrors the rim (θ ↔ 1 − θ): the conjugate picture',
      snareEvt: 'the flash on the set\'s edge is the snare\'s: the ears\' snare event places it (§99)',
      snareAmp: 'how bright that edge flash is: the size of the last snare',
      mode: 'minor pulls the key hue toward the cool half of the wheel, major toward the warm',
      valence: 'a touch of warmth on the key hue (keycolour.js VALW)',
      modeShade: 'whether THIS bar sits on a major or a minor degree: a per-bar lean of the key hue warm or cool (§82)',
      phrase16Pos: 'the hue steps a twelfth of a turn around the key hue when the 16-beat phrase wraps, eased over a beat',
      bpm: 'how long that hue step takes to settle (a beat); the bar clock the gate\'s HOLD and the exit\'s patience count in',
      onset: 'v3\'s onset picker fires the kick when the ears\' lane is not published (move2.js)',
      hitStrength: 'how far that fallback kick goes',
      kickEvt: 'the kick: c jumps OUT through the rim along the wall\'s normal (the Julia set breaks into dust for a frame) and springs back — NAV\'s Misiurewicz jump without the table (§100 lane, §140 target)',
      kickAge: 'places that jump between frames: the spring is stepped by the age on the event frame',
      kickAmp: 'how far the jump goes (the sqrt law of §74, floor .31) and the goldilocks gate: a kick smaller than the threshold does not jump',
      subGate: 'the sub sounding presses the ball toward the rim (the Koenigs arms tighten); the sub leaving relaxes it toward the centre',
      subNote: 'the bass note\'s lean (move2.js) — read, not yet a force on this scene',
      clockConfPcm: 'how big the beat breath is allowed to be: the clock\'s own confidence scales the per-beat press toward the rim',
      barPos: 'the downbeat: the beat breath and the trap\'s turn take a step and a half on the bar\'s first beat (beatgrid.js)',
      tongue21: 'the double time arriving makes the breath\'s crest bigger — never faster (§78)',
      tongue41: 'the same accent from the 16th-note depth\'s rise',
      tongueOn: 'the accent\'s A/B gate: −1 (the stage off) is the plain profile',
    },
    eli5: 'You are inside the Julia set of one point c, and c is a ball rolling inside the Mandelbrot set. Loud music presses it against the wall, a singer lifts it, a build rolls it through a gateway into a smaller copy, and the drop pushes it out through the wall — the Julia set implodes.',
    why: 'Inside a component of M the attracting cycle\'s multiplier λ is a coordinate: |λ| → 1 IS the boundary and arg λ the internal angle, so the music can steer in (|λ|, arg λ) and the point c follows by one complex division — no table of bulbs, every bulb reachable. Where the rim\'s internal angle is a fraction p/q a child bulb hangs by its root; crossing the root multiplies the period by q, and the Julia set grows q new arms. Outside the rim the Julia set is dust: the drop is that crossing, through the parabolic point.',
    math: 'findCycle: the attracting cycle of f_c = z² + c from the critical orbit (nearest return → Newton on f^q(z) − z), λ = (f^q)′(z). log λ is holomorphic in c, so Δc = Δlog λ / (λ′/λ), with λ′ by central differences (field.js rhoGrad). The wall: ∇|λ| projects a step that would pass |λ| = .97. The child: the root is c + n̂ (1 − |λ|)/|∇|λ||, its size 1/(|dλ/dc| q²) (exact on the cardioid: sin(πp/q)/q²), the landing DIVE of that along n̂, verified by findCycle before a frame moves. Drops: step 3 — Fatou coordinates and the Lavaurs phase (Douady–Hubbard, Lavaurs 1989, Shishikura, Inou–Mukherjee).',
  },

  score: () => 0,   // forced-only: the §93 roster (NAV2, DUST, TORUS2, FLUID) is unchanged

  post: { fb: { decay: (S) => 0.7 + 0.16 * S.eM }, bloom: { thr: 0.35 }, kaleido: 0 },   // §102: the kaleidoscope OFF (the user: "it distracts from the beauty of the set") — composite.js's uFx.z = FX.kal · 0, the mirror never mixes in, as TORUS2 / GIELIS / FEIGEN; NAV (id 8) keeps 1

  // The visual parameters of this screen, and what feeds each one by default (CONTRACTS §1.16). Every `from(S)` is
  // the expression `draw()` / `nav.js` computed inline before v0.5 — moved verbatim, never rewritten, so the picture
  // is byte-identical while nothing is routed (one commit per move, each proved by the scene-md5 pair + parity).
  params: {
    trap: { eli5: 'how wide the ring is that the orbit trap lights up', range: [0.35, 1.25], from: (S) => 0.35 + 0.9 * S.mid },
    zoom: { eli5: 'how far the view is pulled back from the Julia set', range: [0.5, 2], from: (S) => (1 - 0.05 * S.bass - 0.07 * S.hit) * (1 + 0.25 * S.dropEnv) },
    dots: { eli5: 'how big the dots of the critical orbit are', range: [0, 3], from: (S) => 1 + S.bass },
    pip: { eli5: 'how visible the little map of the Mandelbrot set is', range: [0, 1], from: (S) => sstep(0.05, 0.3, S.presence) },
    // the one parameter nav.js reads (through updateNav's opts): the drop's depth outside the set, log2 of ε in units of the component's size (§140; nav.js OUT3 / implode.js)
    reach: { eli5: 'how far outside the set the drop throws the picture (log2, in the component\'s own size)', range: [-10, -2], from: (S) => clamp(mix(-8, -4, clamp(0.55 * S.eS + 0.5 * S.tension, 0, 1)) + 1.5 * S.dropEnv, -10, -2) },
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
    CV.v2.julia = c.mkProg(FS_JULIA_V2, 'julia3-v2');            // the default: v0.2's pal() ramp, no OKLCH chunk
    CV.v2.mandel = c.mkProg(FS_MANDEL_V2, 'mandel3-v2');
    CV.oklch.julia = c.mkProg(c.oklch + OK_NAV + FS_JULIA, 'julia3');   // §1.14: hue and lightness independent, so arg lambda and |lambda| can drive one each
    CV.oklch.mandel = c.mkProg(c.oklch + OK_NAV + FS_MANDEL, 'mandel3');
    pt = c.mkProg(VS_PT, FS_PT, 'pt3');
    B_ORB = c.dynBuf(160 * 3, 3);
    // no startGridWorker(): the ball needs no exterior ray table (§140) — NAV2's init starts the shared Worker for itself
  },

  update(dt, S, GROOVE, LOOK, env) {
    const N = NAV, SC = env.SC;
    this._P = env.params;   // §1.16: the same object every frame, refreshed before this update(); draw()/overlay() read it back the same frame
    if (this.rt.settledAt === 0) N.landed = 0; // the director consumed the landing (zeroed rt.settledAt)
    updateNav(dt, env.now, S, { isLogical: SC.logical === this.id, drum: SC.vT > 0.5, P: env.params });
    const rt = this.rt;
    rt.home = false;   // forced-only: never the director's home
    rt.awayBeat = N.extBeat;
    rt.settledAt = N.landed || 0;
    rt.cycBase = N.cycBase;
    rt.time = N.vtime;
    rt.label = N.mode + ' q' + N.cyc.q + (N.stack.length ? ' d' + N.stack.length : '') + ' ' + N.gate.p + '/' + N.gate.q;
    rt.log = `${N.mode} rho${N.rho.toFixed(3)} th${N.th.toFixed(3)} q${N.cyc.q} par${N.par.toFixed(2)}`;
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
    const u = pr.u;
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
    const cm = Math.hypot(N.c[0], N.c[1]);
    const br = S.beatCount + 1 - Math.pow(1 - S.beatPhase, 3);
    const scale = (1.42 + 0.3 * Math.max(0, cm - 0.8)) * P.zoom;   // no baby copies on this scene (§140): the view is M's own, uSc 1
    const rotv = GROOVE.rot;
    N.view = [0, 0, scale, rotv];
    gl.uniform2f(u('uC'), N.c[0], N.c[1]);
    gl.uniform4f(u('uView'), 0, 0, scale, rotv);
    const imp = IMP.x + IMP.y > 0;   // §140 step 3: while the implosion runs the budget is OUT3.ITER and the no-chart short budget is off (the passages need every iteration)
    const it = imp ? Math.min(OUT3.ITER, Math.round(Q.iter * IMP_ITER_MUL)) : Math.min(420, Math.round(Q.iter * (1 + ITER_Q * Math.min(N.cyc.q - 1, ITER_QMAX))));   // §140 quality: the implosion's budget follows the governor (IMP_ITER_MUL × Q.iter, capped at OUT3.ITER) — a flat 420 cost 10–11 ms a frame and pulled q to .63 on the drop windows   // §140: a period-q cycle takes q× the iterations to converge onto one of its points — the budget grows with the period, capped by the loop
    gl.uniform1i(u('uIter'), it);
    gl.uniform1i(u('uIterLo'), imp ? it : Math.round(it * ITER_LO));   // the short budget of §1.4's split: see ITER_LO
    gl.uniform4f(u('uImp'), IMP.x, IMP.y, IMP.q, IMP.R);   // §140 the implosion's layers (implode.js): petal weight, explosion weight, q petals, the gate radius
    gl.uniform2f(u('uZ0'), IMP.z0[0], IMP.z0[1]);
    gl.uniform2f(u('uA'), IMP.a[0], IMP.a[1]);
    gl.uniform1f(u('uSig'), IMP.sig);
    gl.uniform1f(u('uQ0'), OUT3.OUT_RUN * IMP.q0);   // iterates beyond 2R before an entry counts as a passage (implode.js passages())
    gl.uniform2f(u('uSc'), 1, 1);
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
    let ex = 0.05;
    for (let i = 0; i < 96; i += 4) ex = Math.max(ex, Math.hypot(N.path[i * 3] - PIP.cx.x, N.path[i * 3 + 1] - PIP.cy.x));
    PIP.cx.step(N.cPath[0], dt);
    PIP.cy.step(N.cPath[1], dt);
    PIP.sc.step(Math.log(clamp(ex * 1.8 + PIP_SIZE * N.size, PIP_MIN, 1.7)), dt);   // §140: the little map zooms onto the component the ball is in (N.size = 1/|dλ/dc|, the cardioid's is ~.5–1, a 1/7 bulb's ~.01)
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
    gl.uniform1i(pr.u('uIter'), Math.round(N.stack.length ? 256 : 90 + 120 * Q.q));   // deeper in a child the little map is zoomed in: more iterations, as NAV's baby view had
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
    return `nav3 ${N.mode}  c ${N.c[0].toFixed(4)} ${N.c[1].toFixed(4)}  rho ${N.rho.toFixed(3)}→${N.rhoT.x.toFixed(2)} th ${N.th.toFixed(3)}→${frac(N.thT.x).toFixed(2)}  q ${N.cyc.q} depth ${N.stack.length} gate ${N.gate.p}/${N.gate.q}${N.gate.on ? '!' : ''}  par ${f(N.par)} tscale ${f(N.timeScale)}  loud ${f(N.loud)} size ${N.size.toExponential(1)} x${N.crosses} s${N.stalls} f${N.fails}  key ${L2.key}${L2.mode ? 'm' : 'M'} kc ${L2.conf.toFixed(2)} hue ${L2.hueT.toFixed(3)}`;
  },
};
