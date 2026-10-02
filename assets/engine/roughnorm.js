// The roughness normaliser behind `tension` (DECISIONS §81, docs/plans/TONGUES-PITCH-PLAN.md phase 2). Pure: no DOM, no
// GL, node-importable (tools/test_rough.js).
//
// `rough` (features-slow.js: Sethares roughness of the strongest partials, 0.01-0.07 on the five test tracks) is turned
// into `tension` by where it sits between two references of ITS OWN recent past: the p10 and the p98 of the last
// W = 30 s, so the field means "how rough, relative to this track lately". Until v0.28 the references were a pair of
// one-sided followers (`rLo` creeping up at 0.002/step + 1e-5, `rHi` leaping onto any maximum and leaking back at
// 0.002/step, ~17 s): a single spike set the ceiling for the next quarter minute and a long quiet stretch dragged the
// floor under everything that followed, so the same roughness read 0.43 in one section and 0.32 in a louder one
// (SeeYouDrop's second void against its drop, raw 0.0302 vs 0.0310 — the old normaliser put the void ABOVE the drop).
// A window has no attack / release asymmetry: what left the window is forgotten, what is in it counts once.
//
// WHY p98 AND NOT p90. Roughness is spiky — its p90 sits ~1.8x its median, its p98 ~3x — and the old ceiling was a
// max follower, in effect a p99+. p98 is the quantile that leaves the five tracks' whole-track MEDIANS where the old
// normaliser had them (SeeYouDrop 0.324 vs 0.325, Vienna 0.291 vs 0.277), so no scene's groove moves; the SECTIONS
// move (the void, the dream, a drop bar) because the references no longer depend on the order events happened in.
//
// COLD START (§67 / §75's lesson: no partial-window attack, an honest prior). The references are a blend of a PRIOR
// pair (0.010 / 0.050 — the five tracks' own p10 / p98, tools/work/pitch) and the window's measured quantiles, by how
// much of SEED = 5 s the window spans: the first frame reads against the prior exactly, the window owns the references
// from 5 s on, and nothing recursive is seeded from the first spike (the old `rHi` leapt onto SeeYouDrop's 0.071 on
// its fourth frame and kept it for 17 s).
//
// The histogram is 256 bins of 0.0005 (0 .. 0.128; rough above it clips into the last bin), the ring holds up to
// 2048 samples and evicts by TIME (the slow stage runs every other frame — 30/s at 60 Hz, 60/s at 120 — so a count
// would make the window display-rate dependent). A quantile is a 256-bin scan; three per slow frame.
//
// `&rough=0` (ROUGHK.win false) is the old follower pair, exactly — the A/B and the md5 receipt.
export const ROUGHK = {
  win: true,      // the windowed normaliser (false: the pre-§81 rLo / rHi followers)
  W: 30,          // s: the window
  LO: 0.1,        // the floor's quantile
  HI: 0.98,       // the ceiling's quantile
  FLOOR: 0.01,    // the least span (hi - lo) the roughness is divided by (a flat stretch does not amplify its own noise)
  PLO: 0.010,     // the prior floor (the five tracks' p10 of rough)
  PHI: 0.050,     // the prior ceiling (their p98)
  SEED: 5,        // s: the window owns the references once it spans this long
};
const BINS = 256, BW = 0.0005, N = 2048;

export class RoughNorm {
  constructor(K = ROUGHK) {
    this.K = K;
    this.bin = new Int16Array(N); this.at = new Float64Array(N); this.hist = new Int32Array(BINS);
    this.head = 0; this.tail = 0; this.n = 0;      // ring: [tail, head) modulo N
    this.lo = K.PLO; this.hi = K.PHI; this.t0 = -1;
  }
  // The quantile q of the window (a bin centre; the lowest bin whose cumulative count reaches ceil(q n)).
  quant(q) {
    const want = Math.max(1, Math.ceil(q * this.n)); let c = 0;
    for (let b = 0; b < BINS; b++) { c += this.hist[b]; if (c >= want) return (b + 0.5) * BW; }
    return (BINS - 0.5) * BW;
  }
  // One roughness sample at time t (s). Returns this; read .lo / .hi after.
  push(r, t) {
    const K = this.K;
    if (this.t0 < 0 || t < this.at[(this.head + N - 1) % N] - 1e-9) this.reset(t);   // the first sample, or time went backwards
    const b = Math.max(0, Math.min(BINS - 1, Math.floor(r / BW)));
    if (this.n === N) this.pop();
    this.bin[this.head] = b; this.at[this.head] = t; this.head = (this.head + 1) % N; this.n++; this.hist[b]++;
    while (this.n > 1 && this.at[this.tail] < t - K.W) this.pop();
    const span = this.n > 1 ? t - this.at[this.tail] : 0;
    const f = Math.min(1, span / K.SEED);
    const lo = this.quant(K.LO), hi = this.quant(K.HI);
    this.lo = K.PLO + (lo - K.PLO) * f;
    this.hi = K.PHI + (hi - K.PHI) * f;
    if (this.hi < this.lo + K.FLOOR) this.hi = this.lo + K.FLOOR;
    return this;
  }
  pop() { this.hist[this.bin[this.tail]]--; this.tail = (this.tail + 1) % N; this.n--; }
  reset(t) { this.hist.fill(0); this.head = this.tail = 0; this.n = 0; this.t0 = t; this.lo = this.K.PLO; this.hi = this.K.PHI; }
  // Where r sits between the references, 0..1.
  map(r) { const y = (r - this.lo) / (this.hi - this.lo); return y < 0 ? 0 : y > 1 ? 1 : y; }
}
