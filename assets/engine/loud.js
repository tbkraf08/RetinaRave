// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// TRUE LOUDNESS, causally, on the PCM bus — ITU-R BS.1770-4 K-weighting (docs/plans/LOUDNESS-PLAN.md, DECISIONS §63).
// Pure DSP: no DOM, no window, no clock, no Math.random, no imports — so tools/test_loud.js runs it in node and
// assets/engine/features-loud.js is the only thing that knows about MS. Blocks of 512 stereo samples go in, one reused
// `out` object comes out, evaluated at HEARD time exactly as the ears are.
//
// WHY THIS EXISTS. Every energy the engine publishes is AGC-normalised — the band followers divide by a running peak
// with a 14 s release (`synapse/dsp.js`), and 14 s is shorter than a dubstep breakdown, so by the end of one the peak
// has decayed onto the breakdown's own level and `eM` reads near full. On SeeYouDrop's breakdown 2 -> drop 2 pair
// `eM` reads x0.994 where the music is +2.88 LU (x1.94 in power) louder. An AGC is right for a DETECTOR (a kick is a
// kick at any master level) and wrong for "how bright is the picture right now", which is the only question these
// fields answer. Nothing in features.js / synapse/ / ears/ / clock/ changes.
//
// THE MEASURE. Two biquads per channel (a +4 dB high shelf, then the RLB high-pass) and a mean square:
//     L = -0.691 + 10 * log10( sum_ch G_ch * mean(y_ch^2) ),   G_L = G_R = 1.0
// Windows: momentary 400 ms, short-term 3 s. BS.1770-4 tabulates the coefficients at 48 kHz ONLY; `kcoef(sr)` derives
// them from the two analog prototypes by the spec's bilinear recipe, which reproduces that table to 9e-16 (asserted by
// tools/test_loud.js `coef48` and by tools/truth/trackmap.py's own copy) — the engine sees 44.1 and 48 and must not
// hold a one-rate table.
//
// WHY A CUMULATIVE SUM AND NOT AN EMA. A window is then two subtractions, the value at `t` is EXACTLY the mean square
// over (t - W, t] — the same quantity the offline reference computes — and reading it at heard time is free, which is
// what makes the stage gradeable: measured 0.000-0.006 LU per frame against a sample-exact reference over five
// tracks (tools/test_loud.js --truth). An EMA has no window at all to grade.
//
// GAIN INVARIANCE IS THE POINT. `loudM` / `loudS` / `loudPk` are absolute only when the source's gain is known (file,
// demo); on the capture path the gain is the TAB's, set by the user's OS/browser mixer. `loudRel` and `loudRange` are
// differences of two loudnesses, so a constant gain g adds 20*log10(g) to both terms and cancels: a scene that reads
// only `loudRel` behaves identically in file and capture mode. That is why `loudRel` is the field scenes are told to
// use, and why `loudPk` has NO absolute floor (an absolute floor would make a quietly mastered track permanently
// darker, which is the AGC's own sin inverted) — the warm-up guard below is relative instead.
//
// WHY THE PEAK WAITS FOR A FULL WINDOW (DECISIONS §67, the defect §65 open item 1 found). `loudM` and `loudS` are
// read-only functions of the ring and may be answered from a partial window — that is the honest causal answer and
// the warm-up guard covers the first seconds of it. The PEAK HOLD and the RANGE HISTOGRAM are RECURSIVE STATE: what
// they take in on the first block they keep. An instant attack fed a 32-sample "3 s" window is therefore a seed, and
// on a file that starts on a transient it is a wrong one that nothing can undo: SeeYouDrop's first block read
// **+0.97 LKFS** against a true track maximum `loudS` of **-1.69**, and at PK_REL (0.02 LU/s) the hold needed 147 s
// to walk 2.66 LU off — longer than the track. At 100 s `loudPk` was still 1.46 LU too high, which is 1.46/7 = 0.21
// of every base light on that track (`assets/math/loudlight.js`). The other four tracks start in silence and were
// unaffected, which is why §63's synthetic `peak` case missed it. BS.1770-4 measures COMPLETE gating blocks only, and
// that is the fix: the hold and the histogram attack only once `zAt` reports `W * sr` samples behind `t`. Measured
// alternatives, both rejected as strictly worse or equal: weighting the partial window by its fill (zero-padding the
// mean) is IDENTICAL from the moment the window fills and is dominated by the warm-up guard before it, so it buys
// nothing for an extra term; seeding from the gated momentary (400 ms) re-introduces the overshoot, because a
// transient's 400 ms loudness is the thing that was too loud in the first place.

export const LOUD_OFS = -0.691;            // the spec's offset
export const MOM_W = 0.4, SHORT_W = 3.0;   // the momentary and short-term windows (s)
export const LKFS_MIN = -100;              // the floor a reading is clamped to (digital silence reads -Infinity)

// The knobs, so the tools and the console can sweep them without an edit (tools/test_loud.js, CARD.ENGINE.LOUDK).
export const LOUDK = {
  on: true,         // false (&loud=0) = the stage never runs, `loudAbs` stays -1 and every migrated scene falls back to
                    // its pre-loudness formula. It lives HERE and not on ENGINE because sources/fake.js has to read it
                    // too and engine.js imports fake.js — an `ENGINE.useLoud` would close an import cycle check.js fails.
  RANGE: 18,        // LU: the span `loudRel` maps onto 0..1 below the track's own peak. The EBU-style dynamic window;
                    // the measured section ladders span 1.4-7.8 LU inside it, which is why `loudRange` is published
                    // beside it and a scene that wants the track's OWN contrast expands with it (see DECISIONS §63).
  PK_REL: 0.02,     // LU/s: the peak hold's release — instant attack, then a STRAIGHT LINE IN dB, 3 LU over a 150 s
                    // track. DUST's dyn.js shape, but NOT its time constant: a 25 s exponential on the mean square is
                    // 0.174 dB/s, which forgets 6.6 LU in the 38 s between SeeYouDrop's drop 1 and its breakdown 2 —
                    // more than the whole track's 4.96 LU of range, so the hold would have decayed under the present
                    // loudness and `loudRel` would read 1.000 at both ends of the pair this field exists to separate.
                    // dyn.js got away with 25 s because it held an AGC-normalised 0..1 energy, whose peak barely moves.
  WARM_LU: 5,       // LU: the warm-up guard — until the stream has heard something louder, assume the track will reach
  WARM_T: 25,       // ... this far above what it is playing now, decaying with this time constant (1.54 LU by 25 s,
                    // 0.37 by 65 s, 0.03 by 128 s). Without it the first frames of a track read `loudS == loudPk` and
                    // so `loudRel` 1.0: the intro would be the brightest thing in the song (DECISIONS §60 step 4 paid
                    // for exactly this with DUST's peak floor). It is RELATIVE — `loudS + guard`, not an absolute
                    // floor — so a quietly mastered track is not permanently darker, the AGC's own sin inverted.
                    // 4 LU / 6 s UNTIL §67, where the peak stopped being pre-seeded by a partial window. A causal
                    // hold is the loudest the track HAS BEEN, so every moment that is a NEW loudest reads `loudRel`
                    // 1.0 — and SeeYouDrop's 8-14 s, where the track assembles itself, is a new loudest almost every
                    // frame. At 4 LU / 6 s (gone to 0.03 LU by 30 s, long before a 14 s intro ends) that stretch came
                    // out at 1.177x the GROOVE's luminance in DUST, i.e. the intro brighter than the groove — the
                    // exact failure §60 step 4's 0.84 floor was paid to fix and §65 reported closed at 1.021x. The
                    // guard is the only honest answer to it ("assume there is more to come"). SWEPT 4..6 LU x 6..30 s
                    // on DUST's own luminance over SeeYouDrop 2-40 s (one trace each, tools/work/v67/intro.mjs),
                    // intro / groove 28-40 s:
                    //   LU/s     2-8 s   8-14 s        (the gate is <= 1.0; §60's signed-off 2-8 s is 0.633)
                    //   4 / 6    0.357   1.021         §65, on the broken hold
                    //   4 / 20   0.787   1.177   x
                    //   4 / 30   0.757   1.094   x
                    //   5 / 20   0.673   1.047   x
                    //   5 / 25   0.650   0.984   <-    and 2-8 s lands on §60's own 0.633
                    //   6 / 20   0.556   0.918         clears it, but the first bars go under §60's figure
                    // The cost of a 25 s time constant: a SEEK starts a fresh Loud (`features-loud.js` JUMP), so the
                    // picture warms up over ~25 s after a scrub instead of ~6 (§67 open item 2).
  RANGE_GATE: 40,   // LU below `loudPk`: quieter than this does not enter the range histogram (a silent lead-in is not
                    // dynamic range). Relative, so it is gain-invariant like everything else here.
  RANGE_LO: 10,     // the range percentiles: p10 ...
  RANGE_HI: 95,     // ... and p95 of `loudS` so far
  RANGE_EVERY: 16,  // blocks between percentile scans (~170 ms at 48 kHz); the snapshot holds the last value
};

export const LOUD_FIELDS = ['loudM', 'loudS', 'loudPk', 'loudRel', 'loudRange'];

// The 48 kHz table of BS.1770-4, as (b0, b1, b2, a1, a2) with a0 normalised to 1 — the regression anchor, not the path.
export const K48 = {
  shelf: [1.53512485958697, -2.69169618940638, 1.19839281085285, -1.69065929318241, 0.73248077421585],
  hp: [1.0, -2.0, 1.0, -1.99004745483398, 0.99007225036621],
};

// The two K-weighting biquads at `sr`, from the spec's analog prototypes by the bilinear transform.
export function kcoef(sr) {
  const G = 3.999843853973347, Qs = 0.7071752369554196, fs = 1681.974450955533;
  let K = Math.tan(Math.PI * fs / sr);
  const Vh = Math.pow(10, G / 20), Vb = Math.pow(Vh, 0.4996667741545416);
  let a0 = 1 + K / Qs + K * K;
  const shelf = [(Vh + Vb * K / Qs + K * K) / a0, 2 * (K * K - Vh) / a0, (Vh - Vb * K / Qs + K * K) / a0,
    2 * (K * K - 1) / a0, (1 - K / Qs + K * K) / a0];
  const Qh = 0.5003270373238773, fh = 38.13547087602444;
  K = Math.tan(Math.PI * fh / sr);
  a0 = 1 + K / Qh + K * K;
  const hp = [1, -2, 1, 2 * (K * K - 1) / a0, (1 - K / Qh + K * K) / a0];
  return { shelf, hp };
}

// One channel's K-weighting chain: two biquads in transposed direct form II, so the state is two numbers per section.
// The coefficients and the state are SCALAR FIELDS, not arrays: the per-sample loop runs 48 000 times a second per
// channel and an array index costs about 18 % of the stage here (4.26 -> 3.47 µs/block measured, tools/test_loud.js `cost`).
class KChain {
  constructor(c) {
    const a = c.shelf, b = c.hp;
    this.p0 = a[0]; this.p1 = a[1]; this.p2 = a[2]; this.p3 = a[3]; this.p4 = a[4];
    this.q0 = b[0]; this.q1 = b[1]; this.q2 = b[2]; this.q3 = b[3]; this.q4 = b[4];
    this.z0 = 0; this.z1 = 0; this.z2 = 0; this.z3 = 0;
  }
  step(x) {
    const y = this.p0 * x + this.z0;
    this.z0 = this.p1 * x - this.p3 * y + this.z1;
    this.z1 = this.p2 * x - this.p4 * y;
    const w = this.q0 * y + this.z2;
    this.z2 = this.q1 * y - this.q3 * w + this.z3;
    this.z3 = this.q2 * y - this.q4 * w;
    return w;
  }
}

const BINS = 220, BIN_LO = -100, BIN_W = 0.5;            // the range histogram: 0.5 LU bins over -100 .. +10 LKFS

export class Loud {
  // `ring` ENTRIES of history, one per `sub` samples — 32 by default, sixteen per 512-sample PCM block. 32 is not a
  // taste: at 48 kHz a 60 fps frame is exactly 800 samples and the two windows are exactly 19 200 and 144 000, all
  // multiples of 32, so every page read lands ON a boundary and `cumAt` never interpolates at all. MEASURED against a
  // sample-exact reference over the five tracks (tools/test_loud.js --truth, max |error| per frame, loudM / loudS):
  // sub 512 -> 4.45 / 0.19 LU · 128 -> 0.30 / 0.13 · 64 -> 0.16 / 0.02 · 32 -> 0.006 / 0.000 LU, for 3.53 -> 3.80
  // µs/block. The whole of the stage's error was the block edge, and 0.27 µs buys all of it.
  // The default 12288 entries hold ~8.2 s at 48 kHz = the 3 s short-term window plus ~5.2 s of HEARD-TIME LOOKBACK,
  // which is what the ring length actually buys: `read(t)` needs (t - 3 s) to still be in the ring, so the usable
  // lookback is `ring * sub / sr - SHORT_W`. heardT sits at most DET_LEAD (43 ms) + the display lead behind the newest
  // block, so that is 50x the worst lag; 442 KB of Float64 is the price and it is paid once per stream.
  constructor(sr, opts = {}) {
    this.sr = sr;
    this.k = kcoef(sr);
    this.cL = new KChain(this.k); this.cR = new KChain(this.k);
    this.N = opts.ring || 12288;
    this.SUB = opts.sub || 32;
    this.cs = new Float64Array(this.N);                  // cumulative sum of (yL^2 + yR^2) at each block's END
    this.cn = new Float64Array(this.N);                  // ... and of the sample count
    this.ct = new Float64Array(this.N);                  // ... and the block's end time
    this.hpk = new Float64Array(this.N);                 // the peak hold (MEAN SQUARE, linear) snapshotted per block
    this.hrg = new Float32Array(this.N);                 // ... and the dynamic range so far (LU)
    this.w = 0; this.n = 0;                              // write cursor / entries held
    this.sum = 0; this.cnt = 0;                          // the running cumulative totals
    this.t0 = null; this.tEnd = 0;                       // the stream's first and newest audio time
    this.pk = 0;                                         // the peak hold, mean square
    this.hist = new Uint32Array(BINS); this.histN = 0;
    this.rg = 0; this.since = 0;
    this.blocks = 0;
    this.out = {};
    for (const f of LOUD_FIELDS) this.out[f] = 0;
    this.out.loudM = this.out.loudS = this.out.loudPk = LKFS_MIN;
  }

  // One block. `t0` is the audio time of its FIRST sample, in the engine's time base.
  push(L, R, t0) {
    const n = L.length, sr = this.sr, cL = this.cL, cR = this.cR, SUB = this.SUB;
    if (this.t0 === null) { this.t0 = t0; this.ct[0] = t0; this.cs[0] = 0; this.cn[0] = 0; this.hpk[0] = 0; this.hrg[0] = 0; this.w = 1; this.n = 1; }
    // The cumulative totals go in BEFORE the readouts below, so `zAt(tEnd, …)` sees this block (the window at a block's
    // end must include it), and in SUB-sample steps rather than once per 512: a window edge that cuts a sub-block
    // mis-assigns at most SUB samples of energy, and that is the whole of this stage's error against a sample-exact
    // reference. At 512 the worst frame of five tracks was 4.45 LU (the last 400 ms of SeeYouDrop, at -64 LKFS, where a
    // fade-out's dB is wild); at 128 it is a quarter of that. The per-sample work does not change.
    let s = 0, acc = 0;
    for (let i = 0; i < n; i++) {
      const yl = cL.step(L[i]), yr = cR.step(R ? R[i] : L[i]);
      s += yl * yl + yr * yr;
      if (++acc === SUB) { this.mark(this.sum += s, this.cnt += acc, t0 + (i + 1) / sr); s = 0; acc = 0; }
    }
    const tEnd = t0 + n / sr, dt = this.tEnd > 0 ? tEnd - this.tEnd : n / sr;
    this.tEnd = tEnd;
    if (acc) this.mark(this.sum += s, this.cnt += acc, tEnd);
    const i = (this.w - 1 + this.N) % this.N;                      // the entry the block's own peak / range go on
    // the peak hold, on the SHORT-TERM mean square at this block's end: instant attack, PK_REL LU/s release — but it
    // may only ATTACK on a window the stream has actually filled (see WHY THE PEAK WAITS FOR A FULL WINDOW above).
    const nS = this._ns || (this._ns = [0]);
    const zS = this.zAt(tEnd, SHORT_W, nS);
    const held = this.pk * Math.pow(10, -LOUDK.PK_REL * Math.max(dt, 0) / 10);
    const full = nS[0] >= SHORT_W * sr - 0.5;                      // the 3 s window is complete (dn is exact, see zAt)
    this.pk = full ? Math.max(zS, held) : held;
    // the range histogram: this block's short-term loudness, gated RANGE_GATE LU under the peak so a lead-in is not
    // range — and, for the same reason the peak waits, only once the window it is a percentile OF exists.
    if (full && zS > 0 && this.pk > 0 && zS > this.pk * Math.pow(10, -LOUDK.RANGE_GATE / 10)) {
      const l = LOUD_OFS + 10 * Math.log10(zS), b = Math.floor((l - BIN_LO) / BIN_W);
      if (b >= 0 && b < BINS) { this.hist[b]++; this.histN++; }
    }
    if (--this.since <= 0) { this.since = LOUDK.RANGE_EVERY; this.rg = this.range(); }
    this.hpk[i] = this.pk; this.hrg[i] = this.rg;
    this.blocks++;
  }

  // one cumulative entry at audio time t. The peak / range columns carry the value they had before this block's
  // update; `push` overwrites the block's last entry with the new one, so between two blocks they are a staircase —
  // which is what a quantity that moves 0.02 LU/s deserves.
  mark(sum, cnt, t) {
    const i = this.w;
    this.cs[i] = sum; this.cn[i] = cnt; this.ct[i] = t; this.hpk[i] = this.pk; this.hrg[i] = this.rg;
    this.w = (i + 1) % this.N; if (this.n < this.N) this.n++;
  }

  // p(HI) - p(LO) of the short-term loudness so far, in LU, from the histogram. 0 until there is something to measure.
  range() {
    const N = this.histN;
    if (N < 8) return 0;
    const q = (p) => {
      let want = p / 100 * N, c = 0;
      for (let b = 0; b < BINS; b++) { c += this.hist[b]; if (c >= want) return BIN_LO + (b + 0.5) * BIN_W; }
      return BIN_LO + BINS * BIN_W;
    };
    return Math.max(0, q(LOUDK.RANGE_HI) - q(LOUDK.RANGE_LO));
  }

  // The cumulative (sum, count) at audio time t, linear between the two block boundaries that bracket it.
  cumAt(t, o) {
    const n = this.n;
    if (n === 0) { o[0] = 0; o[1] = 0; return false; }
    const N = this.N, newest = (this.w - 1 + N) % N, oldest = (this.w - n + N) % N;
    if (t >= this.ct[newest]) { o[0] = this.cs[newest]; o[1] = this.cn[newest]; return true; }
    if (t <= this.ct[oldest]) { o[0] = this.cs[oldest]; o[1] = this.cn[oldest]; return false; }
    let lo = 0, hi = n - 1;                              // binary search over the ring's logical order (the ears' device)
    while (lo < hi) { const m = (lo + hi) >> 1; if (this.ct[(oldest + m) % N] < t) lo = m + 1; else hi = m; }
    const b = (oldest + lo) % N, a = (oldest + Math.max(0, lo - 1)) % N;
    const d = this.ct[b] - this.ct[a], f = d > 0 ? (t - this.ct[a]) / d : 0;
    o[0] = this.cs[a] + (this.cs[b] - this.cs[a]) * f;
    o[1] = this.cn[a] + (this.cn[b] - this.cn[a]) * f;
    return true;
  }

  // The mean square over (t - W, t], and (in `nout[0]`, if given) the SAMPLE COUNT the mean was taken over — which is
  // how the caller knows whether the window is full. A window the stream cannot fill yet is measured over what there
  // is (>= 32 samples), which is the honest causal answer for `loudM` / `loudS` and keeps the first frames of a track
  // from reading as silence; the offline reference marks those samples "not a full window" and tools/test_loud.js
  // grades only where it has one. `dn` is EXACT at the boundary: `cn` is linear in `t` inside a sub-block, so once the
  // stream is W seconds old `cumAt(t - W)` interpolates to exactly `cnt - W*sr` and `dn` is exactly `W*sr`.
  zAt(t, W, nout) {
    const o = this._o || (this._o = [0, 0]), p = this._p || (this._p = [0, 0]);
    this.cumAt(t, o);
    this.cumAt(t - W, p);
    const dn = o[1] - p[1];
    if (nout) nout[0] = dn;
    return dn >= 32 ? Math.max(0, o[0] - p[0]) / dn : 0;
  }

  // Everything, at heard time. The reused `out` object (or `dst`).
  read(t, dst) {
    const out = dst || this.out;
    // LKFS_MIN is a FLOOR, not just the value digital silence maps to (§67): the first ~70 ms of a file that fades up
    // from silence can read -158 LKFS, which is below the range FEATS publishes for these fields and — because the
    // peak hold is floored and `loudS` was not — was the one way `loudPk` could sit above `loudS` with no guard in it.
    // No graded frame of the five tracks is anywhere near it (min `loudS` -38.6, min `loudM` -86.8 LKFS), so this
    // changes no measured number; it makes the documented range true.
    const lk = (z) => (z > 0 ? Math.max(LKFS_MIN, LOUD_OFS + 10 * Math.log10(z)) : LKFS_MIN);
    out.loudM = lk(this.zAt(t, MOM_W));
    out.loudS = lk(this.zAt(t, SHORT_W));
    // the peak and the range are recursive state, so they come from the per-block snapshot ring, read at t like the
    // ears' continuous fields (the peak interpolated in the LINEAR domain it is held in)
    const n = this.n;
    let pk = this.pk, rg = this.rg;
    if (n > 0) {
      const N = this.N, newest = (this.w - 1 + N) % N, oldest = (this.w - n + N) % N;
      if (t >= this.ct[newest]) { pk = this.hpk[newest]; rg = this.hrg[newest]; }
      else if (t <= this.ct[oldest]) { pk = this.hpk[oldest]; rg = this.hrg[oldest]; }
      else {
        let lo = 0, hi = n - 1;
        while (lo < hi) { const m = (lo + hi) >> 1; if (this.ct[(oldest + m) % N] < t) lo = m + 1; else hi = m; }
        const b = (oldest + lo) % N, a = (oldest + Math.max(0, lo - 1)) % N;
        const d = this.ct[b] - this.ct[a], f = d > 0 ? (t - this.ct[a]) / d : 0;
        pk = this.hpk[a] + (this.hpk[b] - this.hpk[a]) * f;
        rg = this.hrg[a] + (this.hrg[b] - this.hrg[a]) * f;
      }
    }
    let lpk = lk(pk);
    // the warm-up guard (see the header): until something louder has been heard, the peak sits WARM_LU above what is
    // playing, decaying away with the stream's age — so a track's first seconds are not its brightest by construction.
    const age = this.t0 === null ? 0 : Math.max(0, t - this.t0);
    const g = out.loudS + LOUDK.WARM_LU * Math.exp(-age / LOUDK.WARM_T);
    if (out.loudS > LKFS_MIN && g > lpk) lpk = g;
    out.loudPk = lpk;
    const R = LOUDK.RANGE;
    const rel = (out.loudS - lpk + R) / R;
    out.loudRel = out.loudS <= LKFS_MIN ? 0 : rel < 0 ? 0 : rel > 1 ? 1 : rel;
    out.loudRange = rg;
    return out;
  }
}
