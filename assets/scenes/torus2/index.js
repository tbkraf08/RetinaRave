// TORUS2 (v0.7) — the Hopf torus that is alive with the music. A from-scratch successor to TORUS (id 3) that keeps the
// Hopf fibration geometry (math/hopf.js, DECISIONS §4) and answers the user's five points of 2026-09-24
// (docs/workers/brief-torus2.md). Forced-only until the user approves it (key 8 / &scene=7): score() returns 0.
// Step 1 of the brief's Process: the inside lights up — a brightness floor, a fog floor, a kick flash on the quiet
// inner families, a hat shimmer along every fibre.
import { fibre, torusRadii } from '../../math/hopf.js';
import { mkVS, mkFS } from './shaders.js';
import { BANDS, SLOTS, fill as wfill, live as wlive, positions as wpos, step as wstep, train } from './waves.js';

const TAU = Math.PI * 2;
const TH0 = 0.12;
const THS = Math.PI / 2 - TH0;
// rotation numbers p/q of the bulbs, indexed by MS.interval (semitones) — the same table NAV uses for its bulbs
const PQ = [[0, 1], [1, 15], [1, 8], [1, 5], [1, 4], [1, 3], [2, 5], [1, 2], [3, 5], [2, 3], [4, 5], [7, 8]];
// Segments per ring per tier. A Villarceau circle under stereographic projection is a round circle, so 48 chords
// already read as smooth; the whole tier budget lives here and never in the number of rings (cuts: 'continuous').
const SEGT = [48, 72, 108, 160];
const FIBN = 12;      // longitude slots per pitch-class family — the grid, fixed, never tier-dependent
// --- the manual settings of the look (a named constant near the top, not a magic number in a shader) ---
const GLOW = 0.18;    // spec 1a: no fibre below this fraction of the loudest family's brightness
const GLOWQ = 0.4;    // spec 6: hush / calm dim the floor by this much
const FLASHT = 0.25;  // spec 1c: the kick flash decays over this many seconds
const SHIM = 0.55;    // spec 1d: shimmer depth at hat 1
const WPX = 2.6;      // stroke width in px at 720 p at the framing distance
// spec 2, per band (kick · snare · hat): the bump's width along the ring parameter, and what it does —
// the kick displaces (a fraction of the fibre's own radius), the snare brightens (×2.5 = 1 + 1.5), the hat ripples.
// the brief's widths 0.12 / 0.04 / 0.02 are the bumps' full widths; the shader's gaussian takes the sigma, ~0.4x
const WAVEW = [0.05, 0.017, 0.008];
// The brief's lean was 6 % of the tube radius; at the nest's framing that is a ~5 px kink nobody can see in a
// 144-ring picture (tools/work/t2-zoom4x4.jpg at 0.06 / 0.08 / 0.14 are indistinguishable). 26 % reads. Retune here.
const WAVE0 = 0.26;   // the kick bump displaces the stroke by this fraction of the fibre's own radius at amplitude 1
const WAVED = [WAVE0, 0.008, 0.01];   // displacement per band — the kick's big slow bump, the hat's tiny ripple
const WAVEP = [1.1, 1.8, 0.5];         // brightness per band — the snare is the sharp bright one (x2.8)

let SEG = 108;        // segments per ring
let KSEG = 640;       // segments on the knot strand (it winds p+q times, so it needs more)

const th = new Float32Array(12);
const ch = new Float32Array(12);
const U = { psi0: 0, alpha: 0, delta: 0, subP: 0, collapse: 0, gain: 0, knotT: 0, knotTh: 1, knotBri: 1, wpx: 2.6, flash: 0, shim: 0, glow: GLOW, briMax: 1, draw: FIBN, beatNow: 0, wave: WAVE0 };
const MOOD = new Float32Array(3);
const WB = new Float32Array(BANDS * SLOTS);   // wave ages in beats, uploaded every frame
const WA = new Float32Array(BANDS * SLOTS);   // wave amplitudes at launch
let SPREAD = 0.5;
let QS = 0.6;
let CAM = [0, 0.3, 5.2, 1.95];
const CEN = [0, 0, 0, 2.4];
const TMP = [0, 0, 0];
let pq = PQ[0];
let loudest = 0;
let fibPin = -1;      // hooks.fib: pin the drawn slot count so a proof shot can show one thread per family

// Where the family sits in R3 right now. The SU(2) tumble and the pole offset slide the whole nest around the
// stereographic window, so the camera tracks the centroid of a coarse CPU sample (assets/math/hopf.js, the same
// functions the vertex shader ports) and backs off far enough to hold its radius. Both are eased, never cut.
function reframe(dt) {
  let n = 0, cx = 0, cy = 0, cz = 0, s2 = 0;
  const P = [];
  for (let k = 0; k < 12; k++) {
    if (ch[k] < 0.3) continue;                       // only the pitch classes that are actually lit
    for (let j = 0; j < 5; j++) {
      for (let i = 0; i < 5; i++) {
        const p = fibre(th[k], j / 5 * TAU, i / 5 * TAU, U.psi0, U.alpha, U.delta, TMP);
        if (!(Math.hypot(p[0], p[1], p[2]) < 6)) continue;
        P.push(p[0], p[1], p[2]);
        cx += p[0]; cy += p[1]; cz += p[2]; n++;
      }
    }
  }
  if (!n) return;
  cx /= n; cy /= n; cz /= n;
  for (let i = 0; i < P.length; i += 3) s2 += (P[i] - cx) ** 2 + (P[i + 1] - cy) ** 2 + (P[i + 2] - cz) ** 2;
  // second pass: drop the runaway tails, so the frame follows the dense body of the nest and not its spray
  const cut = 1.3 * Math.sqrt(s2 / n);
  let m = 0, dx = 0, dy = 0, dz = 0, far = 0;
  for (let i = 0; i < P.length; i += 3) {
    const q = Math.hypot(P[i] - cx, P[i + 1] - cy, P[i + 2] - cz);
    if (q > cut) continue;
    dx += P[i]; dy += P[i + 1]; dz += P[i + 2]; m++;
    if (q > far) far = q;
  }
  if (m) { cx = dx / m; cy = dy / m; cz = dz / m; }
  const rad = Math.max(1.2, Math.min(3.4, far * 1.15));
  const e = Math.min(1, 2.5 * dt);
  CEN[0] += (cx - CEN[0]) * e;
  CEN[1] += (cy - CEN[1]) * e;
  CEN[2] += (cz - CEN[2]) * e;
  CEN[3] += (rad - CEN[3]) * e;
}

// CPU reference: a few points of one fibre straight out of assets/math/hopf.js, for comparing against the GPU port.
function probe(k) {
  const i = Math.max(0, Math.min(11, k | 0));
  const phi = i * TAU / 12;
  const out = [];
  for (let j = 0; j < 4; j++) out.push(fibre(th[i], phi, j / 4 * TAU, U.psi0, U.alpha, U.delta).map((x) => +x.toFixed(6)));
  return JSON.stringify({ theta: +th[i].toFixed(6), phi: +phi.toFixed(6), psi0: +U.psi0.toFixed(6), alpha: +U.alpha.toFixed(6), delta: +U.delta.toFixed(6), pts: out });
}

// test hook: pin how many fibres per family are drawn (-1 = whatever the music asks for)
function fib(v) {
  fibPin = v > 0 ? Math.min(FIBN, v | 0) : -1;
  return fibPin;
}

// test hook: the live look numbers, so a shot can be read as numbers as well as pixels
function info() {
  return JSON.stringify({ glow: +U.glow.toFixed(4), briMax: +U.briMax.toFixed(4), flash: +U.flash.toFixed(4), shim: +U.shim.toFixed(4), loudest, draw: U.draw, seg: SEG, beat: +U.beatNow.toFixed(3), live: wlive(U.beatNow), kick: wpos(0, U.beatNow), snare: wpos(1, U.beatNow), hat: wpos(2, U.beatNow) });
}

export default {
  name: 'torus2',
  id: 7,
  tag: 'hopf fibration, alive — waves on the fibres, key as hue anchor, a nudge per beat, attractors mixed in',
  feats: ['chroma', 'harmAngle', 'interval', 'harmUnw', 'beatPhase', 'beatCount', 'bass', 'sub', 'tension', 'dropEvt', 'dropEnv', 'bpm', 'presence', 'flow', 'intensity', 'kick', 'snare', 'hat', 'beat', 'alive', 'novelty', 'hush', 'calm'],
  cuts: 'continuous',
  rt: {},
  hooks: { probe, info, train, fib },

  // never auto-picked until approved (the replacement gives it TORUS's bid: 0 in builds, else .25 + .45 clarity + .3 regularity)
  score() {
    return 0;
  },

  init(ctx) {
    this.ctx = ctx;
    // path B of the line renderer (§1.12): the vertex shader builds every point, ctx.lines owns the quad and the VAO
    this.pr = ctx.mkProg(mkVS(ctx.lines.VS), mkFS(ctx.lines.FS), 'torus2');
    for (let k = 0; k < 12; k++) {
      th[k] = TH0 + 0.35 * THS;
      ch[k] = 0.35;
    }
  },

  update(dt, MS, GROOVE, LOOK) {
    QS += (this.ctx.Q.q - QS) * Math.min(1, dt * 0.5);   // slow, so the tier does not chatter
    const tier = QS < 0.32 ? 0 : QS < 0.62 ? 1 : QS < 0.86 ? 2 : 3;
    SEG = SEGT[tier];
    U.draw = fibPin > 0 ? fibPin : FIBN;

    // the chroma vector IS the torus family: latitude and brightness of each pitch class. When it carries no energy
    // (silence, and the #test fake timeline, which leaves chroma zeroed) the latitudes come from the harmony the
    // extractor does report: pitch class k sits at 2pi(7k mod 12)/12 on the circle of fifths and is weighted by how
    // close it is to harmAngle. w blends the two continuously, so nothing ever jumps (DECISIONS §4).
    const C = MS.chroma;
    let sum = 0, mxc = 0;
    for (let k = 0; k < 12; k++) {
      const c = Math.max(0, C[k] || 0);
      sum += c;
      if (c > mxc) mxc = c;
    }
    const w = Math.min(1, 2 * sum);
    const nrm = 1 / Math.max(0.2, mxc);
    let mx = -1;
    for (let k = 0; k < 12; k++) {
      const fifth = ((7 * k) % 12) / 12 * TAU;
      const imp = Math.pow(0.5 + 0.5 * Math.cos(MS.harmAngle - fifth), 2);
      const c = Math.min(1, w * Math.max(0, C[k] || 0) * nrm + (1 - w) * imp);
      ch[k] = c;
      th[k] = TH0 + c * THS;
      if (c > mx) { mx = c; loudest = k; }
    }
    U.briMax = 0.05 + 1.35 * mx * mx;                 // the loudest family's brightness: what the floor is a fraction of

    // drop: collapse to the core circle over about one beat, then bloom back
    if (MS.dropEvt) U.collapse = 1;
    U.collapse *= Math.exp(-dt * Math.max(40, MS.bpm || 120) / 60);
    if (U.collapse < 1e-4) U.collapse = 0;

    // spec 2: musical time drives the waves — beatNow never drifts, so a bump launched on a beat stays on its grid
    U.beatNow = MS.beatCount + MS.beatPhase;
    wstep([MS.kick, MS.snare, MS.hat], U.beatNow, MS.beat);
    wfill(WB, WA, U.beatNow);
    U.wave = 0.26 + 0.1 * MS.kick;                 // the kick-wave amplitude (the `wave` parameter of step 7)

    U.psi0 = TAU * ((U.beatNow / 8) % 1);             // one full turn of the Hopf flow per 8 beats
    // The tumble lives in SU(2), not in the camera, and its amplitude is bounded: rotSU2 by alpha moves the base
    // sphere's south pole (the point stereographic projection sends to infinity) to colatitude pi - 2 alpha, and the
    // moment that crosses a family's latitude that whole torus blows up off screen. |alpha| <= 0.18, |delta| <= 0.6.
    U.alpha = 0.18 * Math.sin(GROOVE.rot);
    U.delta = 0.6 * MS.tension;                       // roughness pinches the picture toward the pole
    U.subP = 0.25 * MS.sub;                           // the sub bass fattens the tubes (bass now sets the stroke width)
    U.knotT = (0.5 * MS.harmUnw) % TAU;               // the melody traces the knot (p, q integral: mod TAU is exact)
    pq = PQ[Math.max(0, Math.min(11, MS.interval | 0))];
    U.knotTh = Math.min((th[loudest] * (1 - U.collapse) + 0.05 * U.collapse) * (1 + U.subP), 1.55);
    U.knotBri = 1.5 * (0.4 + 0.6 * MS.intensity);

    // spec 1c: the kick lights the core. Our own follower on MS.kick (which itself decays over 0.16 s), so the flash
    // lasts about FLASHT seconds; the shader weights it by (1 - chroma) so the quiet inner families get it.
    U.flash = Math.max(U.flash * Math.exp(-dt / FLASHT), MS.kick);
    // spec 1d / 6: the hat shimmer, gated by alive (nothing in silence) and lifted by novelty
    U.shim = SHIM * MS.hat * (0.3 + 0.7 * MS.alive) * (0.5 + 0.5 * MS.novelty);
    // spec 6: hush and calm dim the floor
    U.glow = GLOW * (1 - GLOWQ * Math.max(MS.hush, MS.calm));

    KSEG = Math.min(1600, SEG * Math.max(2, pq[0] + pq[1]));
    const p = MS.presence;
    U.gain = Math.min(1, (0.3 + 0.7 * p) * (1 + 0.6 * MS.dropEnv));
    U.wpx = WPX * (1 + 0.6 * MS.bass);

    const m = (LOOK && LOOK.mood) || { hue: 0, sat: 0.7, bri: 0.8, spread: 0.5 };
    MOOD[0] = m.hue;
    MOOD[1] = 0.35 + 0.65 * m.sat;
    MOOD[2] = 0.5 + 0.7 * m.bri;
    SPREAD = 0.55 + 0.7 * m.spread;

    reframe(dt);
    const f = MS.flow;
    CAM = [0.05 * f, 0.46 + 0.16 * Math.sin(0.043 * f), 2.9 * CEN[3], 1.95]; // gentle orbit, fov ~54 deg
    this.rt.time = f;
    this.rt.label = 'hopf ' + pq[0] + '/' + pq[1];
  },

  draw(target, { w, h }) {
    const g = this.ctx.gl;
    const pr = this.pr;
    this.ctx.use(pr, target, w, h);
    g.clearColor(0, 0, 0, 1);
    g.clear(g.COLOR_BUFFER_BIT);
    g.uniform4f(pr.u('uCam'), CAM[0], CAM[1], CAM[2], CAM[3]);
    g.uniform4f(pr.u('uCen'), CEN[0], CEN[1], CEN[2], CEN[3]);
    g.uniform1f(pr.u('uPsi0'), U.psi0);
    g.uniform1f(pr.u('uAlpha'), U.alpha);
    g.uniform1f(pr.u('uDelta'), U.delta);
    g.uniform1f(pr.u('uSubP'), U.subP);
    g.uniform1f(pr.u('uCollapse'), U.collapse);
    g.uniform3f(pr.u('uMood'), MOOD[0], MOOD[1], MOOD[2]);
    g.uniform1f(pr.u('uSpread'), SPREAD);
    g.uniform1f(pr.u('uGain'), U.gain);
    // width in px is uSize / v.z, so the near side of a ring is thicker; uSize is px-at-unit-depth, set so that a
    // stroke at the centroid (view depth ~ uCam.z) is U.wpx px at 720 p.
    g.uniform1f(pr.u('uSize'), U.wpx * Math.max(0.6, h / 720) * CAM[2]);
    g.uniform1i(pr.u('uSeg'), SEG);
    g.uniform1i(pr.u('uFib'), FIBN);
    g.uniform1i(pr.u('uDraw'), U.draw);
    g.uniform1i(pr.u('uKnotN'), KSEG);
    g.uniform2f(pr.u('uKnotPQ'), pq[0], pq[1]);
    g.uniform1f(pr.u('uKnotT'), U.knotT);
    g.uniform1f(pr.u('uKnotTh'), U.knotTh);
    g.uniform2f(pr.u('uKnotBH'), U.knotBri, loudest / 12 + 0.09);
    g.uniform2f(pr.u('uGlowM'), U.glow, U.briMax);
    g.uniform1f(pr.u('uFlashK'), U.flash);
    g.uniform1f(pr.u('uShim'), U.shim);
    g.uniform1fv(pr.u('uWaveB[0]'), WB);
    g.uniform1fv(pr.u('uWaveA[0]'), WA);
    g.uniform3f(pr.u('uWaveW'), WAVEW[0], WAVEW[1], WAVEW[2]);
    g.uniform3f(pr.u('uWaveD'), U.wave, WAVED[1], WAVED[2]);
    g.uniform3f(pr.u('uWaveP'), WAVEP[0], WAVEP[1], WAVEP[2]);
    g.uniform1f(pr.u('uLoud'), loudest);
    g.uniform1fv(pr.u('uTheta[0]'), th);
    g.uniform1fv(pr.u('uChroma[0]'), ch);
    // The fibres of different tori really do occlude each other in R3, so depth + 'over' is the honest picture
    // (DECISIONS §7: additive strokes of opaque width saturate to a white blob at the drop).
    this.ctx.lines.drawN(12 * U.draw * SEG + KSEG, { depth: true, blend: 'over' });
  },

  hud() {
    const { R, r } = torusRadii(th[loudest]);
    return 'torus2 pc' + loudest + ' R=' + R.toFixed(2) + ' r=' + r.toFixed(2) + ' knot ' + pq[0] + ',' + pq[1] + ' fib ' + (12 * U.draw) + ' seg ' + SEG + ' glow ' + U.glow.toFixed(2) + ' waves ' + wlive(U.beatNow);
  },

  post: { fb: { decay: 0.85 }, bloom: { thr: 0.3 }, kaleido: 0, morph: { flow: 0.4 } },
  colour: { default: 'v2', variants: { v2: {} } },

  help: {
    feats: {
      chroma: 'each pitch class\'s latitude and brightness: louder, nearer the equator, a fatter torus',
      harmAngle: 'while the chroma is empty the latitudes come from the circle of fifths around this angle',
      interval: 'the (p, q) of the bright knot strand',
      harmUnw: 'the melody\'s turn slides along the knot',
      beatPhase: 'the Hopf flow: one full turn every 8 beats',
      beatCount: 'the whole beats of that same clock',
      bass: 'how wide every stroke is drawn',
      sub: 'fattens the tubes — the sub bass swells the whole nest',
      tension: 'pushes the projection pole into the picture: the nest pinches',
      dropEvt: 'everything collapses to the core circle',
      dropEnv: 'brighter strokes while the collapse blooms back',
      bpm: 'how fast the collapse recovers (about one beat)',
      presence: 'overall opacity: silence dims the rings',
      flow: 'the scene clock and the camera\'s gentle orbit',
      intensity: 'how bright the melody\'s knot strand burns',
      kick: 'flashes the quiet inner fibres, and launches the big slow bump that travels along every thread',
      snare: 'launches a sharp bright pulse that travels along the loudest family and the knot',
      hat: 'a fine shimmer running round every ring, and tiny fast ripples travelling with it',
      beat: 'a track with no drums still breathes: a faint bump is launched on the beat when no band hit came',
      alive: 'the shimmer only happens while there is sound',
      novelty: 'a timbre change lifts the shimmer',
      hush: 'the silence before a drop dims the brightness floor',
      calm: 'quiet music dims the brightness floor the same way',
    },
    eli5: 'Every ring is one fibre of the Hopf map, as in TORUS, and this version is built to move with the music: nothing inside the nest is allowed to fall dark, every kick flashes the quiet fibres at the core, and the hats run a fine shimmer round each ring.',
    why: 'The first TORUS drew the geometry right but stayed dark inside: a quiet pitch class sat at a twentieth of the brightness of the loud one and disappeared into the fog. Here a brightness floor keeps every fibre visible, the fog only ever dims the far side by half, the kick lights the innermost (quietest) families rather than the loud rim, and the hats shimmer along the ring parameter — so the bass lights the core and the melody lights the rim.',
    math: 'S3 = {(z1,z2) in C2 : |z1|^2+|z2|^2 = 1} fibres over S2 by h(z1,z2) = (2 z1 conj(z2), |z1|^2-|z2|^2). The fibre over (theta, phi) is psi -> e^{i psi}(cos(theta/2) e^{i phi/2}, sin(theta/2) e^{-i phi/2}). Stereographic projection from (0,0,0,1) sends it to the circle (x1,y1,x2)/(1-y2) in R3, and the whole latitude theta onto the torus of revolution R = 1/cos(theta/2), r = tan(theta/2); each such circle is a Villarceau circle of that torus, winding once the long way and once the short way. Distinct fibres are disjoint, so the rings link once each and never cross.',
  },
};
