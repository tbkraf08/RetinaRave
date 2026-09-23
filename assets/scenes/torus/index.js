// TORUS (§4) — the Hopf fibration as nested tori of Villarceau circles.
// The 12 pitch classes are 12 base-point families on S2: chroma[k] sets family k's colatitude (louder → nearer the
// equator → fatter torus) and its brightness. Every ring on screen is one genuine fibre; the highlighted strand is the
// (p,q) torus knot picked by MS.interval, the same rotation numbers NAV uses for its bulbs.
import { fibre, torusRadii } from '../../math/hopf.js';
import { VS, FS } from './shaders.js';

const TAU = Math.PI * 2;
const TH0 = 0.12;
const THS = Math.PI / 2 - TH0;
// rotation numbers p/q of the bulbs, indexed by MS.interval (semitones)
const PQ = [[0, 1], [1, 15], [1, 8], [1, 5], [1, 4], [1, 3], [2, 5], [1, 2], [3, 5], [2, 3], [4, 5], [7, 8]];
const TIER = [20000, 45000, 90000, 150000];
const FIB = 12;      // fibres (rings) per pitch-class family — fixed, so the tier never adds or removes a ring
let PTS = 320;       // points per ring: the whole tier budget goes here, so only the dotting changes
const KNOT_N = 1280; // points on the knot strand

const th = new Float32Array(12);
const ch = new Float32Array(12);
const U = { psi0: 0, alpha: 0, delta: 0, bassP: 0, collapse: 0, gain: 0, knotT: 0, knotTh: 1, knotBri: 1, fib: 20 };
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

export default {
  name: 'torus',
  id: 3,
  tag: 'hopf fibration — every ring is one fibre, nested tori are the chroma',
  feats: ['chroma', 'harmAngle', 'interval', 'harmUnw', 'beatPhase', 'beatCount', 'bass', 'tension', 'dropEvt', 'dropEnv', 'bpm', 'presence', 'flow', 'arc', 'clarity', 'regularity'],
  cuts: 'continuous',
  rt: {},
  hooks: { probe },

  score(MS) {
    return MS.arc === 'build' ? 0 : 0.25 + 0.45 * MS.clarity + 0.3 * MS.regularity;
  },

  init(ctx) {
    this.ctx = ctx;
    this.pr = ctx.mkProg(VS, FS, 'torus');
    this.vao = ctx.gl.createVertexArray(); // empty VAO: every attribute comes from gl_VertexID
    for (let k = 0; k < 12; k++) {
      th[k] = TH0 + 0.35 * THS;
      ch[k] = 0.35;
    }
  },

  update(dt, MS, GROOVE, LOOK, env) {
    QS += (this.ctx.Q.q - QS) * Math.min(1, dt * 0.5);   // slow, so the tier does not chatter
    const tier = QS < 0.32 ? 0 : QS < 0.62 ? 1 : QS < 0.86 ? 2 : 3;
    U.fib = FIB;
    PTS = Math.max(96, Math.round(TIER[tier] / (12 * FIB)));

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

    const p = MS.presence;
    U.gain = 2.2 * (0.22 + 0.78 * p) * (1 + 1.5 * MS.dropEnv) * (320 / PTS);

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
    g.disable(g.DEPTH_TEST);
    g.enable(g.BLEND);
    g.blendFunc(g.ONE, g.ONE);
    g.uniform2f(pr.u('uRes2'), w, h);
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
    g.uniform1f(pr.u('uSize'), 7.5 * Math.max(0.6, h / 720));
    g.uniform1i(pr.u('uPts'), PTS);
    g.uniform1i(pr.u('uFib'), U.fib);
    g.uniform1i(pr.u('uKnotN'), KNOT_N);
    g.uniform2f(pr.u('uKnotPQ'), pq[0], pq[1]);
    g.uniform1f(pr.u('uKnotT'), U.knotT);
    g.uniform1f(pr.u('uKnotTh'), U.knotTh);
    g.uniform2f(pr.u('uKnotBH'), U.knotBri, loudest / 12 + 0.09);
    g.uniform1fv(pr.u('uTheta[0]'), th);
    g.uniform1fv(pr.u('uChroma[0]'), ch);
    g.bindVertexArray(this.vao);
    g.drawArrays(g.POINTS, 0, 12 * U.fib * PTS + KNOT_N);
    g.bindVertexArray(null);
    g.disable(g.BLEND);
    g.blendFunc(g.SRC_ALPHA, g.ONE_MINUS_SRC_ALPHA);
  },

  hud() {
    const { R, r } = torusRadii(th[loudest]);
    return 'torus pc' + loudest + ' R=' + R.toFixed(2) + ' r=' + r.toFixed(2) + ' knot ' + pq[0] + ',' + pq[1] + ' fib ' + (12 * U.fib);
  },

  post: { fb: { decay: 0.85 }, bloom: { thr: 0.3 }, kaleido: 0 },

  help: {
    eli5: 'Every ring is one fibre of the Hopf map: a circle living in the 3-sphere, seen through a stereographic window. Rings whose base points share a latitude of the base sphere all nest on one torus, so you are looking at real geometry, not a decoration.',
    why: 'The twelve pitch classes are twelve latitudes. The louder a pitch class is, the closer its latitude sits to the equator and the fatter its torus, so the chord you hear is literally the shape of the nest. The melody s interval picks the (p,q) of the bright knot strand — the same rotation numbers that pick NAV s bulb. Beats turn the Hopf flow (one turn per eight beats), groove tumbles the family in SU(2), bass fattens the tubes, tension pushes the projection pole into the picture, and a drop collapses everything to the core circle before it blooms back.',
    math: 'S3 = {(z1,z2) in C2 : |z1|^2+|z2|^2 = 1} fibres over S2 by h(z1,z2) = (2 z1 conj(z2), |z1|^2-|z2|^2). The fibre over (theta, phi) is psi -> e^{i psi}(cos(theta/2) e^{i phi/2}, sin(theta/2) e^{-i phi/2}). Stereographic projection from (0,0,0,1) sends it to the circle (x1,y1,x2)/(1-y2) in R3, and the whole latitude theta onto the torus of revolution R = 1/cos(theta/2), r = tan(theta/2) (theta = pi/2 is the Clifford torus, R = sqrt2, r = 1). Each such circle is a Villarceau circle of that torus: it winds once the long way and once the short way. Two fibres never meet because their base points differ, and a point of S3 has exactly one image under h — distinct fibres are disjoint, so the rings link once each and never cross.',
  },
};
