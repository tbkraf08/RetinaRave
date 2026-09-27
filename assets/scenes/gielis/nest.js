// GIELIS — the nest: twelve pitch classes as twelve nested supershapes, and everything the music does to their shape.
// index.js owns the scene object, the camera and the MS → uniform mapping (TORUS2's index.js:159–177 is the model);
// this file owns
//   1. the twelve families: chroma → size and brightness, with the circle-of-fifths fallback for silence and #test
//   2. the species: family k's lobe count m from the just-intonation ratio of its interval above the key (math/gielis.js)
//   3. the breath: n1 rests where the species is visible and drops to a star on every beat, off the engine's beat GRID
//   4. the section's lean template, the drop's collapse, the build's unwind, the surprise's twist
//   5. the launch ring buffer (math/waves.js, per caller) and the hue each wave carries
//   6. Green's ruler on the loudest family — the only instrument that can see a per-beat pinch (DECISIONS §46)
// Every constant is a named lean at the top, never a magic number in a shader: the user retunes on the first montage.
//
// Process (the brief): the nest AT REST is n1 = N1_REST, the base lean,
// no waves, no flash, no shimmer, no growth. That frame is the `still` reference (hooks.still(1) forces exactly it) and
// every later step keeps it, so a visual step that moves a still frame has moved something it should not have.

import { sf, greenQ, mOf, TAU, N1_MIN } from '../../math/gielis.js';
import { mkWaves, BANDS, SLOTS } from '../../math/waves.js';

// --- the nest (spec 1) ---
export const RINGS = 7;          // latitude rings per family
export const PHI_MAX = 0.85;     // …spanning ±PHI_MAX·π/2 of latitude (the poles are left open)
export const FLOOR = 0.18;       // no family below this fraction of the loudest one's brightness (the `glow` parameter)
export const SIZE0 = 0.25;       // the quietest family's radius …
export const SIZEK = 0.75;       // …and how much more the loudest one takes
// Pass 1: the sub used to fatten a and b. At the deep pinch that is unsafe — r scales as a^(n2/n1), i.e. 1.18^6.67 = 3.1
// at n1 = N1_BEAT, and a > 1 puts a NARROW radial spike at theta = 0 (base = (1/a)^n2 < 1) that a 64-sample normaliser
// cannot see but a drawn ring at phi = 0 lands exactly on: measured, the drawn radius reached 2.85x the family's own.
// The same thing the eye is asked to see — the family fattens with the sub — is now a scale on the family's RADIUS,
// where it is exactly linear and cannot interact with the exponents. a is therefore the template's value throughout
// (1 everywhere; only blade's b is 1.3), which is also what makes the normalisation accurate at 64 samples.
export const SUBK = 0.15;        // the sub bass fattens every family
export const BREATH_B = 0.03;    // and the bar breathes them ±3 %, even in silence
export const FLASHT = 0.25;      // the kick flash's decay (seconds)
export const SHIM = 0.55;        // shimmer depth at hat 1
export const FIBMIN = 6;         // families drawn at rest …
export const FIBMAX = 12;        // …and at build ≥ 0.5
export const FIBTC = 0.25;       // eased, so a family that appears fades in instead of popping
export const PRES0 = 0.05;       // below this presence nothing is drawn at all
// --- the breath (spec 3) ---
// Pass 1, the user's first sentence on the built scene: "shouldn't the superformula be making more shapes?" The answer
// was N1_REST 12: n1 = 12 is a CIRCLE for every m (root Q 0.998, the starriest family 0.991), so the twelve species only
// existed during the fifth of a beat the thump lasted. The rest state now shows the species. Swept in node over the root
// (m 4), the fifth (m 6) and the tritone (m 28/5) at the base lean, against the brief's "root Q about 0.90–0.95":
//   n1  1.6   1.8   2.0   2.2   2.4   3.0  (the brief's lean)   12 (as built)
//   m4  .904  .923  .936  .947  .955  .971                      .998
//   m6  .811  .844  .870  .890  .906  .938                      .996
//   m5.6 .786 .819  .845  .866  .882  .917                      .991
// 3 is still a circle to the eye (root .971); 2.0 puts the root mid-band and every dissonance visibly starry at rest.
export const N1_REST = 2.0;
// …and the beat pinches from there toward a star. 0.6 with the reciprocal law below (N1_MIN 0.5 is the floor and is
// never reached). Swing at the base lean: root .936 → .569, the major 7th .776 → .262 — 0.37–0.51 per beat against the
// brief's ≥ 0.15 gate, where the built 12 → 1.2 gave 0.16–0.41 from a rest that was a circle.
export const N1_BEAT = 0.6;
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
// cuts: 'continuous' means NOTHING on screen ever jumps, so the three event-driven quantities all ATTACK rather than
// step: the drop's collapse, the surprise's twist and the section's ring phase. Fast enough to read as a slam at
// 150 bpm (a beat is 0.4 s), slow enough that the continuity monitor's spike rule is never tripped.
export const ATK = 0.12;         // seconds — the drop's and the twist's attack (0.06 stepped the witness 0.063-0.072 per frame
                                 // on the fake timeline's own drops at 13 s and 37 s: over the monitor's 0.06 spike rule)
export const PHITC = 0.35;       // and the section's ring phase eases over this
// --- the waves (spec 4) ---
export const WAVEW = [0.05, 0.017, 0.008];   // gaussian sigma along the ring parameter per band (kick, snare, hat)
export const WAVE0 = 0.26;       // the kick bump's displacement, a fraction of the family's own radius (TORUS2's — 6 % was invisible)
export const WAVED = [WAVE0, 0.008, 0.01];
export const WAVEP = [1.1, 1.8, 0.5];        // and how much each brightens
// --- the segment budget (CONTRACTS §1.4: a path-B scene's segments per ring are geometry, not budget('segs')) ---
export const SEGT = [16, 26, 38, 52];   // segments per TURN of θ per tier
export const SEGMAX = 96;               // …capped per ring, so a five-turn family cannot blow the total
export const SEGMIN = 12;
// --- the radius normalisation the deep pinch forces (pass 1) -----------------------------------------------------
// r = base^(-1/n1) amplifies any base < 1 by the exponent, and 1/N1_BEAT is now 1.667 instead of 0.833. A lopsided
// lean (blade's b 1.3, and from pass 1 item 2 every family's own n2) makes base < 1 over part of the turn, so the
// family's radius grew instead of pinching: measured over the twelve species × the four templates × the lean extremes
// at n1 = N1_BEAT, the worst rMax hit the R_MAX 4 clamp (blade at morph 1 on a loud family) where the camera frames
// RAD 1. So each family is scaled by 1/max(1, r1max·r2max) of its OWN profile: a pinch now pulls the valleys in and
// leaves the lobe tips at the family's radius — which is what "collapses into interesting shapes" looks like — and
// nothing can ever crop. A symmetric lean has rMax exactly 1, so on those frames the scale is exactly 1.
export const NRM = 64;           // samples of one turn of theta (one turn covers a full period for every m >= 4)
export const NRM_PHI = 33;       // …and of the drawn latitude range (ODD, so phi = 0 — where r2 peaks — is sampled)

const NF = 12;
const SRT = new Float32Array(NF);
const WV = mkWaves();                            // OUR OWN ring buffer — never TORUS2's eight slots (math/waves.js)
const WAGE = new Float32Array(BANDS * SLOTS);    // ages in beats, as mkWaves reports them
const WAMP = new Float32Array(BANDS * SLOTS);    // the amplitude each was launched with
const WHUE = new Float32Array(BANDS * SLOTS);    // OUR own column: the hue coordinate of the launching family
const WOLD = new Float32Array(BANDS * SLOTS);

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
  norm: new Float32Array(NF),      // per PITCH CLASS: 1/max(1, rMax) of its own profile (the pass-1 normalisation)
  sNorm: new Float32Array(NF),     // …and the same in slot order — the uniform payload
  off: new Int32Array(NF + 1),     // cumulative segments per slot — the vertex shader's index
  lean: new Float32Array(4),       // the (n2, n3, a, b) in force
  psi: new Float32Array(3),
  mFade: 0, mKey: -1, tFade: 0,
  n1: N1_REST, Q: 1, A: 0, L: 0,
  loudest: 0, med: 0, briMax: 1,
  fibF: FIBMAX, draw: FIBMAX, segs: 0, open: 0, segPer: 0,
  flash: 0, shim: 0, press: 0, depth: 0,
  template: 0, tPrev: 0, morph: 0, tSel: -2,
  collapse: 0, dropT: 0, slip: 0, twist: 0, twistT: 0, phiOff: 0, phiT: 0, gain: 1,
  beatNow: 0, still: 0, fill: 0.6, phrase: 0, bounce: 0, wave: WAVE0, fat: 1,
};

export const train = WV.train;
export const live = WV.live;
export const positions = WV.positions;

export function resetNest() {
  WV.reset();
  WAGE.fill(-1);
  WOLD.fill(-1);
  WHUE.fill(0);
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

// --- 2. the species ---------------------------------------------------------------------------------------------
// Family k's lobe count is the just-intonation ratio of its interval above the key, scaled by M0 (math/gielis.js). The
// key is keycolour.js's (index.js resolves it): the real key while keyConf is trusted, the nearest fifth of harmAngle
// while it is not — the same gate the hue is on, so the shape logic and the colour logic agree. A rational m does not
// interpolate cleanly (m and m + ε are unrelated shapes), so a key change CROSS-FADES the two radii in the vertex
// shader: mA is the new species, mB the one before it, mFade runs 1 → 0 over MTC.
function species(dt, key) {
  if (key !== N.mKey) {
    N.mB.set(N.mA);
    for (let k = 0; k < NF; k++) {
      const e = mOf(k - key);
      N.mA[k] = e.m;
      N.qt[k] = e.turns;
    }
    N.mFade = N.mKey < 0 ? 0 : 1;      // the first build is not a change
    N.mKey = key;
  }
  N.mFade = Math.max(0, N.mFade - dt / MTC);
}

// --- 3. the breath ----------------------------------------------------------------------------------------------
// TORUS2's thump, read off the engine's beat GRID — never the kick detector, which reads 0.1–0.3 in this track's intro
// and misses a third of the beats (DECISIONS §46 addendum 2). The depth scales with the short-term energy, so 25 s
// presses harder than 0–13 s and the double-time stretch hardest; a hit in the same beat adds HIT_K on top. The whole
// nest breathes together — a per-family phase lag is a retune, not a lean. `press` is the beat's own shape, so it can
// never trip the continuity monitor's spike rule.
export const press = (beatPhase) => Math.pow(Math.max(0, Math.cos(TAU * beatPhase)), 4);
// The press travels along 1/n1, not along n1. 1/n1 IS the exponent of the superformula, and the shape is a circle for
// every n1 above about 4: measured on the fake timeline, a LINEAR ramp N1_REST → N1_BEAT spent two thirds of its travel
// between 12 and 4, where Q moves by 0.007 and the eye sees nothing (the first step-3 series: n1 dipped to 7.8 on every
// beat and Q went 0.9916 → 0.9791). Linear in the exponent, a half press is n1 2.56 and Q 0.92 — a shape. The third
// lean changed, and the only one that is a reparametrisation rather than a number.
export const pinchOf = (d) => 1 / (1 / N1_REST + (1 / N1_BEAT - 1 / N1_REST) * d);

// --- 4. the waves -----------------------------------------------------------------------------------------------
// The ring buffer is math/waves.js's, per caller, so TORUS2's eight slots stay TORUS2's. What is ours is the HUE each
// wave carries — the note, as MAXWELL was validated to do: the launching family's own hue. mkWaves() does the edge
// detection inside step(), so a fresh launch is found by watching the ages it reports: a slot whose age just fell, or
// came alive, was written this frame.
function waves(MS, hueOf) {
  WOLD.set(WAGE);
  WV.step([MS.kick, MS.snare, MS.hat], N.beatNow, MS.beat);
  WV.fill(WAGE, WAMP, N.beatNow);
  for (let i = 0; i < WAGE.length; i++) {
    if (WAGE[i] >= 0 && (WOLD[i] < 0 || WAGE[i] < WOLD[i])) WHUE[i] = hueOf(N.loudest);
  }
}

// The uniform payload of the waves: ages, amplitudes, hues (empty while `still` is pinned).
export function waveUpload(ages, amps, hues) {
  if (N.still) { ages.fill(-1); amps.fill(0); hues.fill(0); return; }
  ages.set(WAGE);
  amps.set(WAMP);
  hues.set(WHUE);
}

// Segments on one ring of slot s: they scale with the family's turns (a five-turn ring covers five times the θ),
// capped so the total stays inside the brief's 8 000 at tier 3. The tier never touches RINGS (cuts: 'continuous').
export const segsOf = (tier, s) => Math.max(SEGMIN, Math.min(SEGMAX, Math.round(SEGT[tier] * N.sQ[s])));

// The pass-1 normalisation: the largest radius this family's own profile reaches, equator × latitude, so the shader can
// divide it out. rMax of a symmetric lean is exactly 1 (base = 1 at t = 0), so this is a no-op on those frames.
export function normOf(m, n1, L, mPhi, n1p) {
  let r1 = 0, r2 = 0;
  for (let j = 0; j < NRM; j++) {
    const v = sf((j / NRM) * TAU, m, n1, L[0], L[1], L[2], L[3]);
    if (v > r1) r1 = v;
  }
  for (let j = 0; j < NRM_PHI; j++) {
    const v = sf((j / (NRM_PHI - 1) - 0.5) * Math.PI * PHI_MAX, mPhi, n1p, L[0], L[1], L[2], L[3]);
    if (v > r2) r2 = v;
  }
  return 1 / Math.max(1, r1 * r2);
}

// --- the frame --------------------------------------------------------------------------------------------------
// P is the six visual parameters (§1.16; inline expressions until step 8 moves them into the slot verbatim).
// O = {key, tier, pinch, tPin, still, hueOf} — the resolved key, the tier, the three pins, and the hue of a
// pitch class (index.js's, because it is the shader's hue coordinate).
export function updateNest(dt, MS, P, O) {
  N.still = O.still;
  families(MS, P.glow);
  species(dt, O.key);
  N.beatNow = MS.beatCount + MS.beatPhase;

  // the drop: collapse for about one beat, then rebound on dropEnv (TORUS2's exp(-dt*bpm/60) release, with an attack)
  if (MS.dropEvt) N.dropT = 1;
  N.dropT *= Math.exp((-dt * Math.max(40, MS.bpm || 120)) / 60);
  N.collapse += (N.dropT - N.collapse) * (1 - Math.exp(-dt / ATK));
  if (N.dropT < 1e-4 && N.collapse < 1e-4) N.collapse = N.dropT = 0;
  if (O.still) N.collapse = N.dropT = 0;

  // the section's lean template, cross-faded over MORPHTC; a returning section returns to its own template, because
  // sectionAlt is synapse's fingerprint id. The amount is the `lean` parameter (MORPHK * tension, 0 in the intro).
  const sel = O.tPin >= 0 ? O.tPin % TEMPLATES.length : MS.sectionAlt < 0 ? 0 : (MS.sectionAlt | 0) % TEMPLATES.length;
  if (sel !== N.tSel) { if (N.tSel !== -2) { N.tPrev = N.template; N.tFade = 1; } N.tSel = sel; N.template = sel; }
  N.tFade = Math.max(0, N.tFade - dt / MORPHTC);
  N.morph += (P.lean - N.morph) * (1 - Math.exp(-dt / MORPHTC));
  if (MS.sectionEvt) N.phiT = ((((MS.sectionAlt | 0) % 12) + 12) % 12) / 12;     // a new section re-picks the rings' phase
  let dph = N.phiT - N.phiOff;
  dph -= Math.round(dph);                                                       // the short way round, in turns
  N.phiOff += dph * (1 - Math.exp(-dt / PHITC));
  const TA = TEMPLATES[N.template], TB = TEMPLATES[N.tPrev], amt = O.still ? 0 : N.morph;
  N.fat = O.still ? 1 : 1 + SUBK * MS.sub + BREATH_B * Math.sin((TAU * MS.barPos) / 4);
  for (let i = 0; i < 4; i++) {
    const t = TA[i] + (TB[i] - TA[i]) * N.tFade;
    N.lean[i] = BASE[i] + (t - BASE[i]) * amt;
  }
  N.open = Math.abs(N.lean[0] - N.lean[1]) > 0.02 || Math.abs(N.lean[2] - N.lean[3]) > 0.02 ? 1 : 0;

  // the breath: n1 sits at N1_REST and every beat presses it toward N1_BEAT
  N.press = press(MS.beatPhase);
  N.depth = P.breath;
  const d = Math.min(1, N.depth * N.press + HIT_K * MS.kick);
  N.n1 = O.still ? N1_REST : Math.max(N1_MIN, pinchOf(d));
  if (N.collapse > 0) N.n1 += (N1_BEAT - N.n1) * N.collapse;
  if (O.pinch >= 0) N.n1 = Math.max(N1_MIN, O.pinch);
  N.gain = MS.presence < PRES0 ? 0 : Math.min(1.6, (0.3 + 0.7 * MS.presence) * (1 + (DROP_G - 1) * MS.dropEnv));

  // the flash on the quiet inner families, and the shimmer along every ring
  N.flash = O.still ? 0 : Math.max(N.flash * Math.exp(-dt / FLASHT), MS.kick);
  N.shim = O.still ? 0 : SHIM * MS.hat * (0.3 + 0.7 * MS.alive) * (0.5 + 0.5 * MS.novelty);
  // the build unwinds the rings toward helices, and the drop's collapse snaps the slip back to zero
  N.slip = O.still ? 0 : UNWIND * Math.max(MS.riser, MS.roll) * (1 - N.collapse);
  if (N.slip > 0.01) N.open = 1;
  if (MS.surpriseEvt && !O.still) N.twistT = 1;
  N.twistT *= Math.exp(-dt / TWISTTC);
  N.twist += (N.twistT - N.twist) * (1 - Math.exp(-dt / ATK));

  // growth stage 1: the drawn family count FIBMIN -> FIBMAX over build 0 -> 0.5, eased so a family that appears fades
  // in instead of popping (stage 2, the camera coming in, is the `size` parameter's and lives in index.js)
  const gB = Math.min(1, 2 * MS.build);
  const fT = O.still ? FIBMAX : FIBMIN + (FIBMAX - FIBMIN) * Math.min(1, gB + 0.3 * MS.arousal);
  N.fibF += (fT - N.fibF) * (1 - Math.exp(-dt / FIBTC));
  N.draw = Math.max(1, Math.min(FIBMAX, Math.ceil(N.fibF - 1e-6)));

  // the ring phase per band: the low (pc 0-3), mid (4-7) and high (8-11) families turn on their rings at their own pace
  const psiB = TAU * ((N.beatNow / 8) % 1);
  N.psi[0] = O.still ? 0 : (psiB + PSIK * MS.flowBass) % TAU;
  N.psi[1] = O.still ? 0 : (psiB + PSIK * MS.flowMid) % TAU;
  N.psi[2] = O.still ? 0 : (psiB + PSIK * MS.flowHigh) % TAU;

  if (!O.still) waves(MS, O.hueOf);

  // the drawn slots in loudness order, and the segment offsets the vertex shader indexes by
  const ord = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].sort((x, y) => N.ch[y] - N.ch[x]);
  for (let k = 0; k < NF; k++) N.norm[k] = normOf(N.mA[k], N.n1, N.lean, M_PHI, N.n1);
  let tot = 0;
  for (let s = 0; s < NF; s++) {
    const k = ord[s];
    N.pc[s] = k;
    N.sMA[s] = N.mA[k];
    N.sMB[s] = N.mB[k];
    N.sQ[s] = N.qt[k] || 1;
    N.sSz[s] = N.size[k] * N.fat * (1 - (1 - DROP_SZ) * N.collapse);
    N.sBr[s] = N.bri[k];
    N.sNorm[s] = N.norm[k];
    N.off[s] = tot;
    if (s < N.draw) tot += RINGS * segsOf(O.tier, s);
  }
  N.off[NF] = tot;
  N.segs = tot;
  N.segPer = segsOf(O.tier, 0);
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

// The continuity monitor's witness (HARNESS "Continuity monitor"). It must be CONTINUOUS in everything the music
// moves, so it cannot be "the loudest family's rim": the loudest family changes by a swap, a discontinuity in the
// witness and not on screen (16 violations in the first 60 s run, every one of them a reorder). Instead: the chroma-
// weighted mean family radius — continuous in chroma — times the mean radius of the SHARED latitude profile at the
// pinch and the lean in force, which every family has, times the drop's collapse. It therefore sees the beat's
// breath, the section's lean, the growth, the drop and the sub's fattening, and never the species.
const WITN = 32;
export function witnessR() {
  let s = 0;
  for (let j = 0; j < WITN; j++) s += sf((j / WITN) * TAU, M_PHI, N.n1, N.lean[0], N.lean[1], N.lean[2], N.lean[3]);
  let w = 0, r = 0;
  for (let k = 0; k < NF; k++) { w += N.ch[k]; r += N.ch[k] * N.size[k] * N.fat * N.norm[k]; }
  return (s / WITN) * (w > 1e-4 ? r / w : SIZE0) * (1 - (1 - DROP_SZ) * N.collapse);
}
export { BANDS, SLOTS };
