// ARNOLD TONGUES — a circle-map phase-locking descriptor on the PCM clock's own onset stream (docs/plans/TONGUES-PLAN.md,
// DECISIONS §76). Pure: no DOM, no clock, no MS — fed per 512-sample hop by Clock.hop() (clock.js) with the clock's two
// band fluxes and its own beat position; node-importable (tools/test_tongues.js, tools/tongues-node.js).
//
// THE OSCILLATOR. A bank of sine circle maps, one per rational / log-spaced ratio Ω_i of the clock's beat rate f_beat:
//     θ_i += f_i·dt − (K/2π)·ô_i·sin(2πθ_i)        f_i = Ω_i·f_beat,  ô_i = nov / (ema(nov) · hops per cycle of i)
//     λ_i += ln|1 − K·ô_i·cos(2πθ_i)|              the Lyapunov sum, per hop
// nov is the band flux's NOVELTY — the flux minus a causal BASE_TAU baseline, rectified (tempo.js removes a 1 s running mean
// for the same reason: a DC drive in sin(2πθ) distorts the rotation and locks to nothing; the probe fed the raw strength
// first and nothing locked, d ≤ 0.02 everywhere). ô sums to ~1 per oscillator cycle on average, so K means what it means in
// the sine circle map. On a click train at the oscillator's period this IS θₙ₊₁ = θₙ + Ω − (K/2π)sin(2πθₙ).
//
// THE WINDOW. The cumulative θ and λ are snapshotted at every clock BEAT (the clock's own beat position crossing an integer,
// in audio time) into a ring of the last WIN beats; the trailing WIN-beat window gives per oscillator
//     ρ_i = Δθ_i / WIN                          the winding number in beats (1 = the clock's beat)
//     d_i = (1 − exp(Δλ_i / (Ω_i·WIN))) / K      the TONGUE DEPTH, 0 at the tongue's edge, 1 at its centre: at a fixed
//                                               point λ = ln(1 − K cos 2πθ*), so d = cos 2πθ*; an unlocked oscillator ≈ 0
// A tongue p/q = the contiguous run of bank oscillators with |ρ − p/q| < TOL and d > DMIN around the exact p/q oscillator;
// its WIDTH (octaves of Ω) is the robustness to tempo drift, its depth the run's max d, and the implied K = 2π·(the 1:1
// run's half-width in Ω). Two banks: the MID band (150–2500 Hz, the §69 snare lane's band — the ladder, the depths, the
// swing) and the LOW band (40–150 Hz, §59's lattice band — `tongueLat`: the Ω = 1 oscillator's phase against the clock's
// line, with its depth as the confidence). The probe (tools/truth/tongues/probe.py, the plan §3) measured why: on the full
// flux the 2:1 tongue is deeper than 1:1 on all five truth tracks (the 8th-note hats are the most complete click train in
// the music), so depth does not decide the octave — that stays with §61's `alive` rule; the bank supplies the LADDER.
// A re-seat or a lattice move (clock.js reseat() / lattice()) jumps the beat position: the phases run on, the ring is
// cleared (the windows would be the wrong width), `tongueOn` reads 0 until WIN beats have passed again.
export const TONGUEK = {
  on: true,          // &tongues=0 / ENGINE.TONGUEK.on = false: no bank runs, tongueOn reads -1 (the A/B switch, loudAbs's convention)
  K: 1,              // the coupling: d is a property of the drive, not of K (Vienna d₁:₁ 0.28 / 0.27 / 0.29 at 0.5 / 1 / 2); K 2 overlaps the tongues
  OCT_STEP: 1 / 16,  // the log-spaced bank's spacing (octaves) on Ω ∈ [0.25, 4], plus every p/q with q ≤ QMAX (the probe's; 1/8 quantises the 1:1 run's 0.187 oct to 0.125 and 3:1 wins Vienna's ladder on ties)
  QMAX: 4,
  TOL: 0.02,         // |ρ − p/q| for "on the tongue" (a 16-beat window resolves 1/16 per slip)
  DMIN: 0.05,        // a run needs this much depth to count as locked
  WIN: 16,           // beats per window (a depth needs ≥ 2 cycles; 16 beats at 90 BPM is the user's 10.7 s grain)
  BASE_TAU: 0.5,     // s: the novelty baseline (an EMA ~ a 1 s running mean)
  EMA_TAU: 8,        // s: the drive normaliser's memory
  EASE: 0.3,         // s: tongueDepth's ease per frame (features-tongues.js)
  LAT_DMIN: 0.06,    // a consumer reads tongueLat only above this tongueLatConf (§59's own margin)
  SW_BINS: 64,       // the swing histogram's bins over the Ω = 1 oscillator's phase
  SW_MIN: 0.25,      // the off-8th's bin must carry this share of the beat's own peak bin to count (else: straight, 1.0)
  JUMP: 0.3,         // beats: a hop whose beat advance is this far from rate x dt is a re-seat / a lattice move — the windows are void
};
export const TONGUE_FIELDS = ['tongueP', 'tongueQ', 'tongueDepth', 'tongueK', 'tongueAmbig', 'tongue11', 'tongue21', 'tongue41',
  'tongueLat', 'tongueLatConf', 'swing', 'tongueOn'];
const TAU = 2 * Math.PI;

// the bank: Ω sorted ascending, and the rationals (p/q, q ≤ QMAX, 0.25..4) with their index in it
export function bank(k = TONGUEK) {
  const set = new Map();
  const add = (v, p, q) => { const key = v.toFixed(9); if (!set.has(key)) set.set(key, { v, p: 0, q: 0 }); if (q) { const e = set.get(key); if (!e.q || q < e.q) { e.p = p; e.q = q; } } };
  for (let x = -2; x <= 2 + 1e-9; x += k.OCT_STEP) add(Math.pow(2, x), 0, 0);
  for (let q = 1; q <= k.QMAX; q++) for (let p = 1; p <= 4 * q; p++) { if (p / q < 0.25 - 1e-9 || p / q > 4 + 1e-9) continue; let g = p, h = q; while (h) { const t = g % h; g = h; h = t; } if (g !== 1) continue; add(p / q, p, q); }
  const om = [...set.values()].sort((a, b) => a.v - b.v);
  const rats = [];
  om.forEach((e, i) => { if (e.q) rats.push({ p: e.p, q: e.q, v: e.v, i }); });
  return { om: Float64Array.from(om, (e) => e.v), rats };
}

// one band's bank: the oscillators, the novelty normaliser, the per-beat snapshot ring
class Bank {
  constructor(om, k) {
    const n = om.length;
    this.om = om; this.k = k; this.n = n;
    this.th = new Float64Array(n); this.lam = new Float64Array(n);
    this.base = NaN; this.ema = 1e-6;
    const W = k.WIN + 1;
    this.rTh = new Float64Array(W * n); this.rLam = new Float64Array(W * n); this.rPh = new Float64Array(W);   // the ring: θ, λ per oscillator, (θ₁ − b) per beat
    this.rho = new Float64Array(n); this.d = new Float64Array(n);
    this.i1 = -1; for (let i = 0; i < n; i++) if (Math.abs(om[i] - 1) < 1e-9) this.i1 = i;
    this.hist = new Float64Array(W * k.SW_BINS);                                                              // the swing histogram per beat
    this.w = 0; this.filled = 0;
  }
  clear() { this.w = 0; this.filled = 0; }
  // one hop: the band flux `o`, dt (s), the beat rate (beats / s), the clock's beat phase (the swing histogram's axis)
  hop(o, dt, bps, ph) {
    const k = this.k, K = k.K, k2pi = K / TAU, om = this.om, th = this.th, lam = this.lam, n = this.n;
    if (!(this.base === this.base)) this.base = o;                                                            // the first hop seeds the baseline (causal)
    const nov = o > this.base ? o - this.base : 0;
    this.base += (o - this.base) * (1 - Math.exp(-dt / k.BASE_TAU));
    this.ema += (nov - this.ema) * (1 - Math.exp(-dt / k.EMA_TAU));
    const n0 = nov / (this.ema > 1e-9 ? this.ema : 1e-9) * bps * dt;                                         // ô_i = n0 · Ω_i
    if (nov <= 0) for (let i = 0; i < n; i++) th[i] += om[i] * bps * dt;                                                     // no drive this hop: free rotation, λ unchanged (half the hops; the sin / cos / log are the cost)
    else for (let i = 0; i < n; i++) {
      const f = om[i] * bps, oh = n0 * om[i], a = TAU * th[i], s = Math.sin(a), c = Math.cos(a);
      const g = 1 - K * oh * c;
      lam[i] += Math.log(g < 0 ? -g : g > 1e-6 ? g : 1e-6);                                                  // a single-hop click of exactly ô = 1 at K 1 is ln 0: floored
      th[i] += f * dt - k2pi * oh * s;
    }
    // the swing histogram: the drive over the CLOCK's beat phase (time-uniform; the oscillator's own phase jumps at every
    // click it is pulled by, and a swung train read 2.0 where 1.5 was played). The beat's own peak is found at read time.
    if (nov > 0) this.hist[(this.w % (k.WIN + 1)) * k.SW_BINS + Math.min(k.SW_BINS - 1, Math.floor(ph * k.SW_BINS))] += nov;
  }
  // a clock beat at beat position b: snapshot, and (once the ring is full) the window
  beat(b) {
    const k = this.k, W = k.WIN + 1, n = this.n, j = this.w % W;
    this.rTh.set(this.th, j * n); this.rLam.set(this.lam, j * n);
    this.rPh[j] = this.i1 >= 0 ? this.th[this.i1] - b : 0;
    this.w++; if (this.filled < W) this.filled++;
    this.hist.fill(0, (this.w % W) * k.SW_BINS, (this.w % W + 1) * k.SW_BINS);                                 // the next beat's histogram starts empty
    if (this.filled < W) return false;
    const i0 = ((this.w - W) % W) * n, i1 = j * n, om = this.om, K = k.K;
    for (let i = 0; i < n; i++) {
      this.rho[i] = (this.rTh[i1 + i] - this.rTh[i0 + i]) / k.WIN;
      const l = (this.rLam[i1 + i] - this.rLam[i0 + i]) / (om[i] * k.WIN), d = (1 - Math.exp(l)) / K;
      this.d[i] = d < 0 ? 0 : d > 1 ? 1 : d;
    }
    return true;
  }
  // the tongue around rational r: [width (oct), depth]
  tongue(r) {
    const k = this.k, om = this.om, rho = this.rho, d = this.d, n = this.n;
    const on = (i) => Math.abs(rho[i] - r.v) < k.TOL && d[i] > k.DMIN;
    if (!on(r.i)) return [0, 0];
    let lo = r.i, hi = r.i;
    while (lo - 1 >= 0 && on(lo - 1)) lo--;
    while (hi + 1 < n && on(hi + 1)) hi++;
    let mx = 0; for (let i = lo; i <= hi; i++) if (d[i] > mx) mx = d[i];
    return [Math.log2(om[hi] / om[lo]) + k.OCT_STEP, mx];
  }
  // the Ω = 1 oscillator's phase against the clock's line over the window: circular mean (cycles, −0.5..0.5) and R
  lat() {
    const W = this.k.WIN + 1; let x = 0, y = 0;
    for (let j = 0; j < W; j++) { const a = TAU * this.rPh[j]; x += Math.cos(a); y += Math.sin(a); }
    return [Math.atan2(y, x) / TAU, Math.hypot(x, y) / W];
  }
  // the off-8th's position inside the beat from the drive's histogram over the clock's phase: -> the eighth-pair ratio (1 straight, 2 triplet), NaN when there is no off-8th mode
  swing() {
    const k = this.k, NB = k.SW_BINS, W = k.WIN + 1, h = new Float64Array(NB);
    for (let j = 0; j < W; j++) for (let b = 0; b < NB; b++) h[b] += this.hist[j * NB + b];
    const at = (b) => h[((b % NB) + NB) % NB];
    // the beat's own peak: the flux's mode within ±0.15 of the clock's line (the line says which of the two peaks is the
    // beat; the flux says where that peak sits, so the band's own lag against the line cancels between the two peaks —
    // read against the line itself the five straight tracks read 1.16–1.30, the hats' flux peaking a hop after the line)
    const r = Math.round(0.15 * NB); let pb = 0; for (let b = -r; b <= r; b++) if (at(b) > at(pb)) pb = b;
    const g = (b) => at(b + pb), pk = g(0);
    const lo = Math.floor(0.4 * NB), hi = Math.floor(0.75 * NB);                                             // the off-8th lives between 0.4 and 0.75 (0.5 straight, 0.667 triplet)
    let j = lo; for (let b = lo; b < hi; b++) if (g(b) > g(j)) j = b;
    const y0 = g(j - 1), y1 = g(j), y2 = g(j + 1), den = y0 - 2 * y1 + y2;
    if (!(y1 > 0) || y1 < k.SW_MIN * pk || y1 < y0 || y1 < y2) return NaN;                                    // no off-8th mode of its own: straight
    const frac = den !== 0 ? 0.5 * (y0 - y2) / den : 0, pos = (j + 0.5 + frac) / NB;                          // the parabolic vertex of the mode
    return pos / (1 - pos);
  }
}

export class Tongues {
  constructor(k = TONGUEK) {
    this.k = k;
    const { om, rats } = bank(k);
    this.om = om; this.rats = rats;
    this.mid = new Bank(om, k); this.low = new Bank(Float64Array.of(1), k);                                  // the low band reads only its Ω = 1 oscillator (tongueLat / tongueLatConf): one oscillator, not a ladder
    this.i1 = this.mid.i1; this.i2 = -1; this.i4 = -1;
    for (let i = 0; i < om.length; i++) { if (Math.abs(om[i] - 2) < 1e-9) this.i2 = i; if (Math.abs(om[i] - 4) < 1e-9) this.i4 = i; }
    this.pb = NaN; this.pt = NaN; this.lastN = 0; this.beats = 0; this.hops = 0; this.w11 = 0; this.bestW = 0;
    this.out = { tongueP: 1, tongueQ: 1, tongueDepth: 0, tongueK: 0, tongueAmbig: 1, tongue11: 0, tongue21: 0, tongue41: 0, tongueLat: 0, tongueLatConf: 0, swing: 1, tongueOn: 0 };
  }
  // the windows are void (a re-seat, a lattice move, a seek): the phases run on
  clear() { this.mid.clear(); this.low.clear(); this.out.tongueOn = 0; }
  // one hop at audio time t: the clock's mid / low band fluxes, its beat rate (beats / s) and beat position
  hop(t, mid, low, bps, b) {
    this.hops++;
    const dt = this.pt === this.pt ? t - this.pt : 512 / 48000;
    this.pt = t;
    if (!(bps > 0) || !(dt > 0)) return;
    const ph = b - Math.floor(b);
    this.mid.hop(mid, dt, bps, ph); this.low.hop(low, dt, bps, ph);
    const n = Math.floor(b);
    if (this.pb === this.pb) {
      // a re-seat / a lattice move jumps the line: not motion, the windows are void. An onset's small correction
      // (the Kalman pulls b back by a hundredth) is motion: the beat fires once, when the count first passes a new line.
      if (Math.abs(b - this.pb - bps * dt) > this.k.JUMP) { this.clear(); this.lastN = n; }
      else if (n > this.lastN) { this.beat(b); this.lastN = n; }
    } else this.lastN = n;
    this.pb = b;
  }
  beat(b) {
    this.beats++;
    const full = this.mid.beat(b) & this.low.beat(b);                                                        // both run (no short-circuit): the rings stay in step
    const o = this.out;
    if (!full) { o.tongueOn = 0; return; }
    const M = this.mid;
    // the ladder's winner: the widest tongue, ties to the lower q and then to the lower p (the probe's rule — 1:1 wins 74 %
    // of Vienna's windows against the probe's 82 %; ties to the DEEPER were measured and give 2:1 the tie on every track,
    // which is the plan's own finding that depth does not decide the octave)
    let best = null, bw = -1, bq = 99, bd = -1, w11 = 0;
    for (const r of this.rats) {
      const [w, d] = M.tongue(r);
      if (r.p === 1 && r.q === 1) w11 = w;
      if (w > bw || (w === bw && r.q < bq)) { best = r; bw = w; bq = r.q; bd = d; }
    }
    o.tongueP = best.p; o.tongueQ = best.q; this.w11 = w11; this.bestW = bw;                                   // the 1:1 run's width and the winner's (octaves; tools)
    o.tongue11 = M.d[this.i1]; o.tongue21 = M.d[this.i2]; o.tongue41 = M.d[this.i4];
    o.tongueDepth = o.tongue11;
    const hw = w11 > 0 ? (Math.pow(2, w11 / 2) - Math.pow(2, -w11 / 2)) / 2 : 0, Ki = TAU * hw;
    o.tongueK = Ki > 1 ? 1 : Ki;
    // the tension: 1 − the octave ladder's best depth — the music locks none of the clock's beat family (Vienna's dream reads
    // 1.00 for 16 s; the groove 0.4–0.6). The ladder winner's own depth was measured and rejected for this: on a window where
    // nothing is wide a 1-step run at 0.1 wins the tie and the tension reads 0.85–0.94 where the beat's own depth is 0.00.
    const dl = Math.max(o.tongue11, o.tongue21, o.tongue41);
    o.tongueAmbig = 1 - dl;
    const [ph] = this.low.lat();
    o.tongueLat = ph; o.tongueLatConf = this.low.d[this.low.i1];
    const sw = o.tongue11 > this.k.DMIN ? M.swing() : NaN;                                                   // the Ω = 1 phase means nothing unless it is locked
    o.swing = sw === sw ? Math.min(3, Math.max(0.33, sw)) : 1;
    o.tongueOn = 1;
  }
}
