// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// TORUS (§4) — the Hopf fibration as nested tori of Villarceau circles.
// The 12 pitch classes are 12 base-point families on S2: chroma[k] sets family k's colatitude (louder → nearer the
// equator → fatter torus) and its brightness. Every ring on screen is one genuine fibre; the highlighted strand is the
// (p,q) torus knot picked by MS.interval, the same rotation numbers NAV uses for its bulbs.
// v0.2: every fibre is a continuous closed stroke through ctx.lines (CONTRACTS.md §1.12, path B), depth-tested, so
// the tori occlude each other as they really do in R3. The tier budget is segments per ring; the ring count is fixed.
import { fibre, torusRadii } from '../../math/hopf.js';
import { mkVS, mkFS } from './shaders.js';

const TAU = Math.PI * 2;
const TH0 = 0.12;
const THS = Math.PI / 2 - TH0;
// rotation numbers p/q of the bulbs, indexed by MS.interval (semitones)
const PQ = [[0, 1], [1, 15], [1, 8], [1, 5], [1, 4], [1, 3], [2, 5], [1, 2], [3, 5], [2, 3], [4, 5], [7, 8]];
// Segments per ring per tier. A Villarceau circle under stereographic projection is a round circle, so 48 chords
// already read as smooth; the whole tier budget lives here and never in the number of rings (cuts: 'continuous').
const SEGT = [48, 72, 108, 160];
const FIB = 12;      // fibres (rings) per pitch-class family — fixed, so the tier never adds or removes a ring
let SEG = 108;       // segments per ring
let KSEG = 640;      // segments on the knot strand (it winds p+q times, so it needs more)
let MODE = 1;        // 0 = additive glow, no depth · 1 = opaque strokes, depth-tested (see draw)

const th = new Float32Array(12);
const ch = new Float32Array(12);
const U = { psi0: 0, alpha: 0, delta: 0, bassP: 0, collapse: 0, gain: 0, knotT: 0, knotTh: 1, knotBri: 1, fib: 20, wpx: 2.6 };
const MOOD = new Float32Array(3);
let SPREAD = 0.5;
let QS = 0.6;
let CAM = [0, 0.3, 5.2, 1.95];
const CEN = [0, 0, 0, 2.4];
const TMP = [0, 0, 0];

// Where the family sits in R3 right now. The SU(2) tumble and the pole offset slide the whole nest around the
// stereographic window, so the camera tracks the centroid of a coarse CPU sample (assets/math/hopf.js, the same
// functions the vertex shader ports) and backs off far enough to hold its radius. Both are eased, never cut.
function reframe(dt) {
  let n = 0, cx = 0, cy = 0, cz = 0, s2 = 0;
  const S = [];
  for (let k = 0; k < 12; k++) {
    if (ch[k] < 0.3) continue;                       // only the pitch classes that are actually lit
    for (let j = 0; j < 5; j++) {
      for (let i = 0; i < 5; i++) {
        const p = fibre(th[k], j / 5 * TAU, i / 5 * TAU, U.psi0, U.alpha, U.delta, TMP);
        if (!(Math.hypot(p[0], p[1], p[2]) < 6)) continue;
        S.push(p[0], p[1], p[2]);
        cx += p[0]; cy += p[1]; cz += p[2]; n++;
      }
    }
  }
  if (!n) return;
  cx /= n; cy /= n; cz /= n;
  for (let i = 0; i < S.length; i += 3) s2 += (S[i] - cx) ** 2 + (S[i + 1] - cy) ** 2 + (S[i + 2] - cz) ** 2;
  // second pass: drop the runaway tails, so the frame follows the dense body of the nest and not its spray
  const cut = 1.3 * Math.sqrt(s2 / n);
  let m = 0, dx = 0, dy = 0, dz = 0, far = 0;
  for (let i = 0; i < S.length; i += 3) {
    const q = Math.hypot(S[i] - cx, S[i + 1] - cy, S[i + 2] - cz);
    if (q > cut) continue;
    dx += S[i]; dy += S[i + 1]; dz += S[i + 2]; m++;
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
let pq = PQ[0];
let loudest = 0;

// CPU reference: a few points of one fibre straight out of assets/math/hopf.js, for comparing against the GPU port.
function probe(k) {
  const i = Math.max(0, Math.min(11, k | 0));
  const phi = i * TAU / 12;
  const out = [];
  for (let j = 0; j < 4; j++) out.push(fibre(th[i], phi, j / 4 * TAU, U.psi0, U.alpha, U.delta).map((x) => +x.toFixed(6)));
  return JSON.stringify({ theta: +th[i].toFixed(6), phi: +phi.toFixed(6), psi0: +U.psi0.toFixed(6), alpha: +U.alpha.toFixed(6), delta: +U.delta.toFixed(6), pts: out });
}

// test hook: 0 = additive glow without depth, 1 = depth-tested opaque strokes (the A/B that picked the default)
function lmode(v) {
  MODE = (v | 0) ? 1 : 0;
  return MODE;
}

export default {
  name: 'torus-v1',
  id: 7,
  tag: 'hopf fibration, v1 — every ring is one fibre, nested tori are the chroma (replaced by TORUS2 at id 3, v0.7; forced-only)',
  feats: ['chroma', 'harmAngle', 'interval', 'harmUnw', 'beatPhase', 'beatCount', 'bass', 'tension', 'dropEvt', 'dropEnv', 'bpm', 'presence', 'flow', 'clarity'],
  cuts: 'continuous',
  rt: {},
  hooks: { probe, lmode },

  // v0.7 (DECISIONS §37): the bid (0 in a build, else .25 + .45 clarity + .3 regularity) moved to TORUS2 at id 3; v1 is
  // forced-only (key 8) for one release, then deleting it is a separate decision of the user's.
  score() {
    return 0;
  },

  init(ctx) {
    this.ctx = ctx;
    // path B of the line renderer (§1.12): the vertex shader builds every point, ctx.lines owns the quad and the VAO
    this.pr = ctx.mkProg(mkVS(ctx.lines.VS), mkFS(ctx.lines.FS), 'torus');
    for (let k = 0; k < 12; k++) {
      th[k] = TH0 + 0.35 * THS;
      ch[k] = 0.35;
    }
  },

  update(dt, MS, GROOVE, LOOK, env) {
    QS += (this.ctx.Q.q - QS) * Math.min(1, dt * 0.5);   // slow, so the tier does not chatter
    const tier = QS < 0.32 ? 0 : QS < 0.62 ? 1 : QS < 0.86 ? 2 : 3;
    U.fib = FIB;
    SEG = SEGT[tier];

    // the chroma vector IS the torus family: latitude and brightness of each pitch class.
    // When it carries no energy (silence, and the #test fake timeline, which leaves chroma zeroed) the latitudes come
    // from the harmony the extractor does report: pitch class k sits at 2pi(7k mod 12)/12 on the circle of fifths and
    // is weighted by how close it is to harmAngle. w blends the two continuously, so nothing ever jumps.
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

    // drop: collapse to the core circle over about one beat, then bloom back
    if (MS.dropEvt) U.collapse = 1;
    U.collapse *= Math.exp(-dt * Math.max(40, MS.bpm || 120) / 60);
    if (U.collapse < 1e-4) U.collapse = 0;

    U.psi0 = TAU * (((MS.beatCount + MS.beatPhase) / 8) % 1); // one full turn of the Hopf flow per 8 beats
    // The tumble lives in SU(2), not in the camera. Amplitude is bounded: rotSU2 by alpha moves the base sphere's
    // south pole (the point the stereographic projection sends to infinity) to colatitude pi-2*alpha, and the moment
    // that crosses a family's latitude theta_k <= 1.55 that whole torus blows up off screen. |alpha| <= 0.18 and
    // |delta| <= 0.6 keep the singular direction clear of every family.
    U.alpha = 0.18 * Math.sin(GROOVE.rot);
    U.delta = 0.6 * MS.tension;                       // roughness pinches the picture toward the pole
    U.bassP = 0.25 * MS.bass;                         // fatter tube on the bass
    U.knotT = (0.5 * MS.harmUnw) % TAU;               // the melody traces the knot (p, q integral: mod TAU is exact)
    pq = PQ[Math.max(0, Math.min(11, MS.interval | 0))];
    U.knotTh = Math.min((th[loudest] * (1 - U.collapse) + 0.05 * U.collapse) * (1 + U.bassP), 1.55);
    U.knotBri = 1.5 * (0.4 + 0.6 * (MS.clarity || 0));

    KSEG = Math.min(1600, SEG * Math.max(2, pq[0] + pq[1]));
    const p = MS.presence;
    // a stroke carries the same energy whatever its segment count, so there is no density compensation any more
    U.gain = Math.min(1, (0.3 + 0.7 * p) * (1 + 0.6 * MS.dropEnv));
    U.wpx = 2.6 * (1 + 0.6 * MS.bass);

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
    g.uniform1f(pr.u('uBassP'), U.bassP);
    g.uniform1f(pr.u('uCollapse'), U.collapse);
    g.uniform3f(pr.u('uMood'), MOOD[0], MOOD[1], MOOD[2]);
    g.uniform1f(pr.u('uSpread'), SPREAD);
    g.uniform1f(pr.u('uGain'), U.gain);
    // width in px is uSize / v.z, so the near side of a ring is thicker; uSize is px-at-unit-depth, set so that a
    // stroke at the centroid (view depth ~ uCam.z) is U.wpx px at 720 p.
    g.uniform1f(pr.u('uSize'), U.wpx * Math.max(0.6, h / 720) * CAM[2]);
    g.uniform1i(pr.u('uSeg'), SEG);
    g.uniform1i(pr.u('uFib'), U.fib);
    g.uniform1i(pr.u('uKnotN'), KSEG);
    g.uniform2f(pr.u('uKnotPQ'), pq[0], pq[1]);
    g.uniform1f(pr.u('uKnotT'), U.knotT);
    g.uniform1f(pr.u('uKnotTh'), U.knotTh);
    g.uniform2f(pr.u('uKnotBH'), U.knotBri, loudest / 12 + 0.09);
    g.uniform1fv(pr.u('uTheta[0]'), th);
    g.uniform1fv(pr.u('uChroma[0]'), ch);
    // MODE 1: the fibres of different tori really do occlude each other in R3, so depth + 'over' is the honest
    // picture. MODE 0 is the v0.1 additive glow (order-independent, overlaps brighten) — hooks.lmode flips it.
    this.ctx.lines.drawN(12 * U.fib * SEG + KSEG, MODE ? { depth: true, blend: 'over' } : { blend: 'add' });
  },

  hud() {
    const { R, r } = torusRadii(th[loudest]);
    return 'torus pc' + loudest + ' R=' + R.toFixed(2) + ' r=' + r.toFixed(2) + ' knot ' + pq[0] + ',' + pq[1] + ' fib ' + (12 * U.fib) + ' seg ' + SEG;
  },

  post: { fb: { decay: 0.85 }, bloom: { thr: 0.3 }, kaleido: 0, morph: { flow: 0.4 } }, // morph.flow: the flow field combed the ribbons at 1 (v0.3 §23, montage morph-flow-slot.jpg)

  // One colour mapping, declared (CONTRACTS §1.4) so every scene answers `CARD.colour`, the cast line and the panel's
  // colour select the same way. No `post` on the variant: the scene's own `post` above stays in force.
  colour: { default: 'v2', variants: { v2: {} } },

  help: {
    // what each field in `feats` moves on this screen (CONTRACTS §1.13); a field without a line falls back to FEATS[k].drives
    feats: {
      chroma: 'each pitch class\'s latitude and brightness: louder, nearer the equator, a fatter torus',
      harmAngle: 'while the chroma is empty the latitudes come from the circle of fifths around this angle',
      interval: 'the (p, q) of the bright knot strand',
      harmUnw: 'the melody\'s turn slides along the knot',
      beatPhase: 'the Hopf flow: one full turn every 8 beats',
      beatCount: 'the whole beats of that same clock',
      bass: 'fatter tubes and wider strokes',
      tension: 'pushes the projection pole into the picture: the nest pinches',
      dropEvt: 'everything collapses to the core circle',
      dropEnv: 'brighter strokes while the collapse blooms back',
      bpm: 'how fast the collapse recovers (about one beat)',
      presence: 'overall opacity: silence dims the rings',
      flow: 'the scene clock and the camera\'s gentle orbit',
      clarity: 'the knot strand\'s brightness',
    },
    eli5: 'Every ring is one fibre of the Hopf map: a circle living in the 3-sphere, seen through a stereographic window. Rings whose base points share a latitude of the base sphere all nest on one torus, so you are looking at real geometry, not a decoration.',
    why: 'The twelve pitch classes are twelve latitudes. The louder a pitch class is, the closer its latitude sits to the equator and the fatter its torus, so the chord you hear is literally the shape of the nest. The melody s interval picks the (p,q) of the bright knot strand — the same rotation numbers that pick NAV s bulb. Beats turn the Hopf flow (one turn per eight beats), groove tumbles the family in SU(2), bass fattens the tubes, tension pushes the projection pole into the picture, and a drop collapses everything to the core circle before it blooms back.',
    math: 'S3 = {(z1,z2) in C2 : |z1|^2+|z2|^2 = 1} fibres over S2 by h(z1,z2) = (2 z1 conj(z2), |z1|^2-|z2|^2). The fibre over (theta, phi) is psi -> e^{i psi}(cos(theta/2) e^{i phi/2}, sin(theta/2) e^{-i phi/2}). Stereographic projection from (0,0,0,1) sends it to the circle (x1,y1,x2)/(1-y2) in R3, and the whole latitude theta onto the torus of revolution R = 1/cos(theta/2), r = tan(theta/2) (theta = pi/2 is the Clifford torus, R = sqrt2, r = 1). Each such circle is a Villarceau circle of that torus: it winds once the long way and once the short way. Two fibres never meet because their base points differ, and a point of S3 has exactly one image under h — distinct fibres are disjoint, so the rings link once each and never cross.',
  },
};
