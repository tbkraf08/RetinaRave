// THE REACTIVE DRUMS v2 (2026-09-28; docs/AUDIT-drums.md). Pure: no DOM, no clock — node-testable (tools/drums-node.js),
// fed once per frame by features-drums.js. Additive: `kick2` / `snare2` / `hat2` are levels shaped like synapse's `kick` /
// `snare` / `hat` (a hit sets the level to its strength, then it decays over the same 0.16 / 0.13 / 0.06 s), so a scene takes
// them by route with no edit; nothing existing changes.
//
// THE KICK is the ears' LOW onsets (every 40-150 Hz percussive onset: a kick or an 808 note start — what the eye sees the
// low end do), not synapse's 30-180 Hz flux peaks (which also fire on bass movement: 741 hits for SeeYouDrop's 504 low
// onsets, P 0.25). Its strength keeps synapse's dynamics: the onset's raw flux ranked among the last RANK_N low onsets
// (so a hit is strong against its own recent hits, at every track loudness), times synapse's bass loudness exactly as
// synapse scales its own kick (0.5 + 0.5 x bass.n). THE SNARE AND HAT stay synapse's (measured better than the ears'), but
// every synapse hit is HELD until its audio is heard: synapse sees the audio `ahead` s before it is heard in file modes
// (the det lead, 42.7 ms) and confirms an onset ~SYN_DELAY after its audio, so it lit up ~11 ms early in det and more in
// real-time file mode; in capture (the audio arrives after it is heard) nothing is held. `ahead` is net of the display lead
// (features-drums.js): with the default 40 ms the det lead's 43 ms leaves nothing to hold — the eye wants the hit ~40 ms
// before the ear (DECISIONS §52).
//
// i = { syn: synapse's A (kick / snare / hat levels, already decayed this frame), bassN: synapse's bass loudness (bands.bass.n),
// low / lowFl: an ears low onset released this frame and its raw dB flux, ahead: s the analysers are ahead of heard time
// (−LEAD.L), dt }.
export const DRUMS = {
  MODE: 2,         // kick source: 0 synapse (held to heard time), 2 the ears' low onsets, 3 both
  RANK_N: 64,      // low onsets in the strength's rank window
  S0: 0.2,         // strength of the weakest hit in the window (the strongest is 1), before the bass loudness
  G: 2.5,          // rank curve (> 1: most hits modest, the strong ones stand out — synapse's distribution)
  SYN_DELAY: 0.031, // s: synapse confirms an onset this long after its audio (measured: det lag −11 ms at the 42.7 ms lead)
  HOLD: 1          // 0: release synapse's hits when synapse finds them (the old timing)
};
export const DRUMS_OUT = ['kick2', 'snare2', 'hat2'];
const TAU = [0.16, 0.13, 0.06];

export class Drums {
  constructor() {
    this.out = { kick2: 0, snare2: 0, hat2: 0 };
    this.pk = [0, 0, 0];               // synapse's levels last frame (a rise above their decay = a synapse hit)
    this.fl = new Float32Array(128); this.fn = 0; this.srt = new Float32Array(128);   // the recent low onsets' flux
    this.q = [];                       // held synapse hits: { c, s, at } (at: the frame time to release on)
    this.T = 0;
  }

  // synapse's hit strength on this frame for class c (0 if none)
  synHit(c, v, dt) {
    const was = this.pk[c] * Math.exp(-dt / TAU[c]);
    this.pk[c] = v;
    return v > was + 1e-4 ? v : 0;
  }

  // a low onset's strength: its flux's rank among the last RANK_N (itself included), on the curve, times the bass loudness
  lowStrength(fl, bassN) {
    const N = Math.min(DRUMS.RANK_N, 128);
    this.fl[this.fn % 128] = fl; this.fn++;
    const n = Math.min(this.fn, N);
    let below = 0;
    for (let k = 0; k < n; k++) if (this.fl[(this.fn - 1 - k) % 128] < fl) below++;
    const ph = Math.max(0, 8 - n);                               // a prior of 8 median hits, gone once 8 real ones are in:
    const r = (below + 0.5 * ph) / (n - 1 + ph || 1);             // the first hits of a stream do not all read "the loudest"
    return (DRUMS.S0 + (1 - DRUMS.S0) * Math.pow(r, DRUMS.G)) * (0.5 + 0.5 * Math.min(1, Math.max(0, bassN)));
  }

  step(i) {
    const o = this.out, dt = i.dt, A = i.syn;
    this.T += dt;
    const hold = DRUMS.HOLD ? Math.max(0, (i.ahead || 0) - DRUMS.SYN_DELAY) : 0;
    const hits = [0, 0, 0];
    // synapse's hits (all three classes), held until heard
    for (let c = 0; c < 3; c++) {
      const s = this.synHit(c, c === 0 ? A.kick : c === 1 ? A.snare : A.hat, dt);
      if (s > 0) { if (hold > 0.5 * dt) this.q.push({ c, s, at: this.T + hold }); else hits[c] = Math.max(hits[c], s); }
    }
    let k = 0;
    for (let j = 0; j < this.q.length; j++) {
      const e = this.q[j];
      if (this.T + 0.5 * dt >= e.at) hits[e.c] = Math.max(hits[e.c], e.s); else this.q[k++] = e;
    }
    this.q.length = k;
    const low = i.low ? this.lowStrength(i.lowFl, i.bassN) : 0;
    const M = DRUMS.MODE;
    const kk = M === 0 ? hits[0] : M === 2 ? low : Math.max(low, hits[0]);
    o.kick2 = Math.max(o.kick2 * Math.exp(-dt / TAU[0]), kk);
    o.snare2 = Math.max(o.snare2 * Math.exp(-dt / TAU[1]), hits[1]);
    o.hat2 = Math.max(o.hat2 * Math.exp(-dt / TAU[2]), hits[2]);
    return o;
  }
}
