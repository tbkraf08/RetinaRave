// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// The felt beat, as a RATE multiple of the grid beat: 0.5 = half time (SeeYouDrop's drop sections), 1, 2 = double time.
// `pulse = grid beat / felt period`, so a felt period twice the grid beat gives 0.5.
//
// The felt period is the autocorrelation peak of the kick+snare onset train (hats are the subdivision, not the backbeat)
// over the last WIN seconds, at 100 Hz. The GRID beat is NOT something the ears can know — v3's `bpm` owns the grid — so it
// comes in as `opts.beat` (seconds). Without it the ears fall back to BEAT_DEFAULT and `pulse` is only a shape, not a
// multiple; the interface note is in docs/workers/ears.md. Measured on SeeYouDrop: the kick inter-onset interval alone does
// NOT separate the groove from the drop sections (median 2.92 vs 3.35 of the fastest layer — both have kicks at ~2/s), which
// is why this is an ACF and not a ratio of medians.
export const FPS = 100;            // the onset-train rate
export const WIN = 8.0;            // seconds of history the ACF sees
export const LAG_LO = 0.25, LAG_HI = 1.30;       // the felt period is searched here
export const EVERY = 16;           // blocks between ACF evaluations (~0.19 s at 512/44.1k)
export const HOLD = 0.8;           // a new value must persist this long before pulse changes (s)
export const CONF_MIN = 0.10;      // the ACF peak must be at least this strong (normalised) to move pulse
export const BEAT_DEFAULT = 0.5;   // 120 BPM, used only when the host does not supply the grid beat

export class PulseTrack {
  constructor(opts = {}) {
    this.N = Math.round(WIN * FPS);
    this.env = new Float32Array(this.N);
    this.w = 0; this.t0 = null;                    // the 100 Hz index of env[0] of the stream
    this.beat = opts.beat || BEAT_DEFAULT;
    this.k = 0; this.felt = 0; this.conf = 0;
    this.pulse = 1; this.cand = 1; this.candT = -99;
  }
  setBeat(s) { if (s > 0.05 && s < 3) this.beat = s; }
  push(evs) {
    for (let i = 0; i < evs.length; i++) {
      const e = evs[i];
      if (e.type !== 'kick' && e.type !== 'snare') continue;
      const idx = Math.floor(e.t * FPS);
      if (this.t0 === null) this.t0 = idx;
      const k = idx % this.N;
      this.env[k] = Math.max(this.env[k], (e.vel || 0.5) + 0.2);
    }
  }
  hop(t) {
    const idx = Math.floor(t * FPS);
    // clear the slots the ring has just walked past, so old onsets do not linger a whole window later
    while (this.w < idx) { this.w++; this.env[(this.w + 1) % this.N] = 0; }
    if (++this.k < EVERY) return;
    this.k = 0;
    const N = this.N, e = this.env;
    let mean = 0; for (let i = 0; i < N; i++) mean += e[i];
    mean /= N;
    let e0 = 0; for (let i = 0; i < N; i++) { const d = e[i] - mean; e0 += d * d; }
    if (!(e0 > 0)) { this.conf = 0; return; }
    const lo = Math.round(LAG_LO * FPS), hi = Math.min(N - 2, Math.round(LAG_HI * FPS));
    let bl = lo, bv = -1e9, prev = 0, next = 0;
    for (let lag = lo; lag <= hi; lag++) {
      let s = 0;
      for (let i = 0; i + lag < N; i++) s += (e[i] - mean) * (e[i + lag] - mean);
      s /= e0;
      if (s > bv) { bv = s; bl = lag; }
      if (lag === bl + 1) next = s;
      if (lag === bl - 1) prev = s;
    }
    // one parabolic refinement pass around the winner (recomputed: the loop above only keeps the last neighbours seen)
    const at = (lag) => { let s = 0; for (let i = 0; i + lag < N; i++) s += (e[i] - mean) * (e[i + lag] - mean); return s / e0; };
    prev = bl > lo ? at(bl - 1) : bv; next = bl < hi ? at(bl + 1) : bv;
    const den = prev - 2 * bv + next;
    const frac = Math.abs(den) > 1e-9 ? 0.5 * (prev - next) / den : 0;
    this.felt = (bl + Math.max(-1, Math.min(1, frac))) / FPS;
    this.conf = Math.max(0, bv);
    if (this.conf < CONF_MIN || !(this.felt > 0)) return;
    const r = this.beat / this.felt;
    const want = r < 0.75 ? 0.5 : r < 1.5 ? 1 : 2;
    if (want !== this.cand) { this.cand = want; this.candT = t; }
    else if (want !== this.pulse && t - this.candT >= HOLD) this.pulse = want;
  }
}
