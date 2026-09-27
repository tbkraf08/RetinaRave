// GIELIS — the nest: twelve pitch classes as twelve nested supershapes, and everything the music does to their shape.
// index.js owns the scene object, the camera and the MS → uniform mapping (TORUS2's index.js:159–177 is the model);
// this file owns
//   1. the twelve families: chroma → size and brightness, with the circle-of-fifths fallback for silence and #test
//   2. the species: family k's lobe count m from the just-intonation ratio of its interval above the key (math/gielis.js)
//   3. the breath: n1 sits near the circle and drops toward a pinch on every beat, off the engine's beat GRID
//   4. the section's lean template, the drop's collapse, the build's unwind, the surprise's twist
//   5. the launch ring buffer (math/waves.js, per caller) and the hue each wave carries
//   6. Green's ruler on the loudest family — the only instrument that can see a per-beat pinch (DECISIONS §46)
// Every constant is a named lean at the top, never a magic number in a shader: the user retunes on the first montage.
//
// Process (the brief): step 1 draws the nest AT REST — one lobe count M0 for every family, n1 = N1_REST, the base lean,
// no waves, no flash, no shimmer, no growth. That frame is the `still` reference (hooks.still(1) forces exactly it) and
// every later step keeps it, so a visual step that moves a still frame has moved something it should not have.

import { sf, greenQ, M0, TAU } from '../../math/gielis.js';
import { BANDS, SLOTS } from '../../math/waves.js';

// --- the nest (spec 1) ---
export const RINGS = 7;          // latitude rings per family
export const PHI_MAX = 0.85;     // …spanning ±PHI_MAX·π/2 of latitude (the poles are left open)
export const FLOOR = 0.18;       // no family below this fraction of the loudest one's brightness (the `glow` parameter)
export const SIZE0 = 0.25;       // the quietest family's radius …
export const SIZEK = 0.75;       // …and how much more the loudest one takes
export const SUBK = 0.15;        // the sub bass fattens a and b
export const BREATH_B = 0.03;    // and the bar breathes them ±3 %, even in silence
export const FLASHT = 0.25;      // the kick flash's decay (seconds)
export const SHIM = 0.55;        // shimmer depth at hat 1
export const FIBMIN = 6;         // families drawn at rest …
export const FIBMAX = 12;        // …and at build ≥ 0.5
export const FIBTC = 0.25;       // eased, so a family that appears fades in instead of popping
export const PRES0 = 0.05;       // below this presence nothing is drawn at all
// --- the breath (spec 3) ---
export const N1_REST = 12;       // the resting pinch: n1 → ∞ is a circle, 12 already reads as one (Q ≥ 0.987 everywhere)
// The brief's lean was 1.5. Measured (tools/test_gielis.js item 4): at 1.5 the ROOT family (m = 4) swings only 0.106 of
// Q through a beat — under the brief's own ≥ 0.15 gate — while the starry families swing 0.15–0.32. 1.2 puts all twelve
// over it (0.158–0.414). This and BASE below are the two leans changed, both for a measured reason.
export const N1_BEAT = 1.2;
export const HIT_K = 0.3;        // a hit inside the beat deepens the pinch on top of the grid's press
// --- the lean (spec 6) ---
// The brief's resting lean was (n2, n3, a, b) = (2, 2, 1, 1). That is EXACTLY a circle for every m and every n1:
// |cos t|² + |sin t|² = 1, so r = 1^(−1/n1) = 1 — Pythagoras, not taste. The breath would have been a no-op at rest and
// the beat would have deformed nothing until a section pulled the lean off round. (1, 1, 1, 1) is the same family one
// exponent lower: still a circle as n1 → ∞, and the pinch acts.
export const BASE = [1, 1, 1, 1];
export const TEMPLATE_NAMES = ['round', 'petal', 'blade', 'shard'];
export const TEMPLATES = [[1, 1, 1, 1], [1, 4, 1, 1], [4, 1, 1, 1.3], [0.6, 0.6, 1, 1]];
export const MORPHTC = 1.0;      // the lean eases, and a template change cross-fades, over ~1 s
export const MORPHK = 0.9;       // how much of the tension reaches the lean (the `lean` parameter's gain)
export const M_PHI = 4;          // the lobe count of the SECOND curve (the latitude profile), the same for every family,
                                 // so the pitch reads in the equatorial lobes — which is what the ruler measures
export const MTC = 0.7;          // a key change cross-fades the two radii over ~2 s (three time constants)
export const UNWIND = 0.35;      // riser / roll drift the rings in latitude: closed rings open into helices
export const DROP_SZ = 0.4;      // the drop collapses the nest to this fraction of its size for about one beat
export const DROP_G = 1.6;       // …and the rebound gains this much brightness on dropEnv
export const PSIK = 0.25;        // flowBass / flowMid / flowHigh advance the low / mid / high families' ring phase
export const TWIST = 0.4;        // a surprise twists the camera elevation by at most this many radians
export const TWISTTC = 0.35;     // and it eases back over ~1 s
// --- the waves (spec 4) ---
export const WAVEW = [0.05, 0.017, 0.008];   // gaussian sigma along the ring parameter per band (kick, snare, hat)
export const WAVE0 = 0.26;       // the kick bump's displacement, a fraction of the family's own radius (TORUS2's — 6 % was invisible)
export const WAVED = [WAVE0, 0.008, 0.01];
export const WAVEP = [1.1, 1.8, 0.5];        // and how much each brightens
// --- the segment budget (CONTRACTS §1.4: a path-B scene's segments per ring are geometry, not budget('segs')) ---
export const SEGT = [16, 26, 38, 52];   // segments per TURN of θ per tier
export const SEGMAX = 96;               // …capped per ring, so a five-turn family cannot blow the total
export const SEGMIN = 12;

const NF = 12;
const SRT = new Float32Array(NF);

export const N = {
  ch: new Float32Array(NF),        // per PITCH CLASS: the family weight (chroma, or the fifths fallback)
  size: new Float32Array(NF),      // its radius
  bri: new Float32Array(NF),       // its brightness
  mA: new Float32Array(NF),        // its lobe count …
  mB: new Float32Array(NF),        // …and the one before the last key change
  qt: new Float32Array(NF),        // turns of θ its ring needs to close
  pc: new Float32Array(NF),        // per DRAWN SLOT (loudness order): which pitch class it is
  sMA: new Float32Array(NF),       // and the same four, in slot order — the uniform payload
  sMB: new Float32Array(NF),
  sQ: new Float32Array(NF),
  sSz: new Float32Array(NF),
  sBr: new Float32Array(NF),
  off: new Int32Array(NF + 1),     // cumulative segments per slot — the vertex shader's index
  lean: new Float32Array(4),       // the (n2, n3, a, b) in force
  psi: new Float32Array(3),
  mFade: 0, mKey: -1, tFade: 0,
  n1: N1_REST, Q: 1, A: 0, L: 0,
  loudest: 0, med: 0, briMax: 1,
  fibF: FIBMAX, draw: FIBMAX, segs: 0, open: 0, segPer: 0,
  flash: 0, shim: 0, press: 0, depth: 0,
  template: 0, tPrev: 0, morph: 0, tSel: -2,
  collapse: 0, slip: 0, twist: 0, phiOff: 0, gain: 1,
  beatNow: 0, still: 0, fill: 0.6, phrase: 0,
};

export const train = () => null;
export const live = () => 0;
export const positions = () => [];

export function resetNest() {
  N.mKey = -1;
  N.n1 = N1_REST;
  N.fibF = FIBMAX;
}

// --- 1. the twelve families -------------------------------------------------------------------------------------
// The chroma vector IS the nest: the loudest pitch class is the outermost and brightest, the quiet ones nest inside.
// When chroma carries no energy (silence, and the #test fake timeline, which leaves it zeroed) the weights come from
// the harmony the extractor does report: pitch class k sits at 2π(7k mod 12)/12 on the circle of fifths and is weighted
// by how close that is to harmAngle. w blends the two continuously, so nothing ever jumps (TORUS2 index.js:159–177).
function families(MS, floor) {
  const C = MS.chroma;
  let sum = 0, mxc = 0;
  for (let k = 0; k < NF; k++) {
    const c = Math.max(0, C[k] || 0);
    sum += c;
    if (c > mxc) mxc = c;
  }
  const w = Math.min(1, 2 * sum), nrm = 1 / Math.max(0.2, mxc);
  let mx = -1;
  for (let k = 0; k < NF; k++) {
    const fifth = (((7 * k) % 12) / 12) * TAU;
    const imp = Math.pow(0.5 + 0.5 * Math.cos(MS.harmAngle - fifth), 2);
    const c = Math.min(1, w * Math.max(0, C[k] || 0) * nrm + (1 - w) * imp);
    N.ch[k] = c;
    N.size[k] = SIZE0 + SIZEK * c;
    if (c > mx) { mx = c; N.loudest = k; }
  }
  N.briMax = 0.05 + 1.35 * mx * mx;
  for (let k = 0; k < NF; k++) N.bri[k] = Math.max(0.05 + 1.35 * N.ch[k] * N.ch[k], floor * N.briMax);
  SRT.set(N.bri);
  SRT.sort();
  N.med = 0.5 * (SRT[5] + SRT[6]);      // the median brightness: the kick will flash everything under it (step 5)
}

// The uniform payload of the waves — empty until step 4.
export function waveUpload(ages, amps, hues) {
  ages.fill(-1);
  amps.fill(0);
  hues.fill(0);
}

// Segments on one ring of slot s: they scale with the family's turns (a five-turn ring covers five times the θ),
// capped so the total stays inside the brief's 8 000 at tier 3. The tier never touches RINGS (cuts: 'continuous').
export const segsOf = (tier, s) => Math.max(SEGMIN, Math.min(SEGMAX, Math.round(SEGT[tier] * N.sQ[s])));

// --- the frame --------------------------------------------------------------------------------------------------
// `floor` is the brightness floor in force (the `glow` parameter's value); `tier` the smoothed quality tier.
export function updateNest(dt, MS, floor, tier) {
  families(MS, floor);
  N.beatNow = MS.beatCount + MS.beatPhase;
  N.n1 = N1_REST;
  for (let i = 0; i < 4; i++) N.lean[i] = BASE[i];
  N.open = 0;
  N.gain = MS.presence < PRES0 ? 0 : Math.min(1.6, (0.3 + 0.7 * MS.presence) * (1 + (DROP_G - 1) * MS.dropEnv));
  N.draw = FIBMAX;
  N.fibF = FIBMAX;

  // the drawn slots in loudness order, and the segment offsets the vertex shader indexes by
  const ord = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].sort((x, y) => N.ch[y] - N.ch[x]);
  let tot = 0;
  for (let s = 0; s < NF; s++) {
    const k = ord[s];
    N.pc[s] = k;
    N.mA[k] = M0;
    N.mB[k] = M0;
    N.qt[k] = 1;
    N.sMA[s] = N.mA[k];
    N.sMB[s] = N.mB[k];
    N.sQ[s] = N.qt[k];
    N.sSz[s] = N.size[k];
    N.sBr[s] = N.bri[k];
    N.off[s] = tot;
    if (s < N.draw) tot += RINGS * segsOf(tier, s);
  }
  N.off[NF] = tot;
  N.segs = tot;
  N.segPer = segsOf(tier, 0);
  return tot;
}

// Green's ruler on the loudest family's equatorial profile, at the lean and the pinch in force this frame.
export function measureQ() {
  const g = greenQ(N.mA[N.loudest], N.n1, N.lean[0], N.lean[1], N.lean[2], N.lean[3]);
  N.Q = g.Q;
  N.A = g.A;
  N.L = g.L;
  return g;
}

// the equatorial radius of the loudest family at θ = 0 — the continuity monitor's 2-vector rides on it
export const rimR = () => sf(0, N.mA[N.loudest], N.n1, N.lean[0], N.lean[1], N.lean[2], N.lean[3]) * N.sSz[0];
export { BANDS, SLOTS };
