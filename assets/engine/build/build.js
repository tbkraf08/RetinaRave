// THE LIVE BUILD / DROP DETECTOR (live step 4 B.2, 2026-09-29; docs/AUDIT-live-grid.md "Step 4", DECISIONS §54). Pure: no
// DOM, no clock — node-testable (tools/test_build.js, tools/build-node.js), fed once per frame by features-build.js. Additive:
// `buildLive` / `dropLiveIn` / `dropLiveEvt` are new fields; nothing existing moves, no scene reads them by default.
//
// WHAT IT READS (B.1): live, a drop is announced 2-5 bars ahead by THE VOID — the bass and sub pulled out, the highs left,
// synapse's high-pass sweep evidence `hp` on — identical on all five SeeYouDrop / WhoLikesToParty drops; over 16 bars nothing
// separates. So:
//   void    = (hp's 5 s mean > HP_ARM  or  bassS's 2 s mean < BASS_ARM x its 32 s mean), after MIN_HIST s of music
//   ARM     the void held HOLD bars (gaps <= 1 beat bridged) -> armed on the next BAR LINE of the heard grid
//   level   buildLive = L0 at the arm, ramping with the void's length to 1 at FULL bars; 0 on the slam
//   count   dropLiveIn = beats to the next bar line while armed (every truth drop lands on a downbeat), -1 when not
//   SLAM    dropLiveEvt: a low onset (the ears' 40-150 Hz lane, kick or 808 note start) ON a beat line (+-ON_BEAT) while
//           armed for SLAM_AFTER bars, confirmed by the bass coming back (synapse's bassS >= RET x its 2 s mean as the onset arrived, or its sub
//           >= SUB_RET x its own) within CONF beats of the onset; released on the confirming frame, then disarmed
//   DISARM  the slam; MAX bars armed with no slam (a breakdown, not a void); silence; a seek (the heard beat jumps); a
//           tempo jump (> 4 %). After a slam or a timeout it re-arms only once the void has been gone a bar.
//
// A SECOND ARMING PATH — THE SUB VOID (DECISIONS §64 task 2). A drop whose bass band never leaves is invisible to the rule
// above. Vienna is one: `bassS` reads 0.51-0.83 for the whole track, its 2 s / 32 s ratio bottoms at 0.514 for 4.6 s and is
// back over 0.85 eleven seconds before the drop, and `hp`'s 5 s mean peaks at 0.166 over the same 4.6 s — so the detector
// armed ONCE in 192 s, 69.3-76.3 s, and the first drop is at 85.34. What is out there is the SUB: the ears' causal sub gate
// is shut from 69.7 to 85.8 s (6.02 bars at 90 BPM) and the drop IS the sub note coming back (`sub` 0.356 -> 0.991 on one
// frame, +7 ms from the truth, with two low onsets on the beat line). Measured over all five truth tracks, the longest
// sub-gate-shut run anywhere else is SeeYouDrop's 3.85 bars (before its own drop 1, which the void path already arms 15.9
// beats ahead) and Malicious' 3.37 (twelve runs, 0.70-3.37 bars); WhoLikesToParty and CyborgNinja never shut it for a bar.
// So a FOUR-BAR HOLD on the sub void clears Vienna's 6.02 by 57 % and changes nothing on any other track in the set.
//   SUB VOID = the ears' causal sub gate's 2 s mean < SUBV_OFF, after MIN_HIST, gaps <= 1 beat bridged
//   ARM      once it has held SUBV_HOLD bars, on the next bar line (the same line rule)
//   SLAM     the same on-beat low onset, confirmed by `sub` >= SUBV_RET x its 2 s mean (Vienna reads 2.14 x; the void
//            path's RET 1.75 / SUB_RET 5 cannot see it because the bass never left) and with no SLAM_AFTER wait — the
//            void has already run four bars before this path arms, so the first bass return is not a pickup
// The gate must be the CAUSAL one: in file mode with the map ready `MS.subGate` is the map's (features-ears.js), and this
// stage runs the same inputs in every mode (as it takes the ears' low lane rather than the map's onsets). features-build.js
// passes `EARS.ears.out.subGate`; node and the replay read it from the trace, where it is already causal.
// THE TIME BASE is the bars stage's (DECISIONS §50): B = the v3 beat moved onto heard time with the lead's estimate; an
// onset's position x = B - (T - t) x bpm / 60 (t may be ahead of T by the display lead in file modes: features-build.js).
// THE BAR LINE: v3's own count (beatCount mod 4) until synapse proposes a sure bar phase (barConf >= 0.9, same octave) for
// 8 beats running — then that phase (the bars store's rule). v3's count is arbitrary in stream mode until then.
export const BUILD = {
  HP_ARM: 0.1,     // synapse hp, 5 s mean, above which the void is on (B.1: 5/6 drops, 0 CyborgNinja false at 0.05-0.5)
  BASS_ARM: 0.6,   // bassS 2 s mean below this x its 32 s mean = the void (0 = off)
  MIN_HIST: 32,    // s of music (presence) before anything can arm: a void is relative to what came before it
  HOLD: 0,         // bars the void must hold before it arms
  FULL: 4,         // bars of void at which buildLive reaches 1
  L0: 0.4,         // buildLive on the arm
  MAX: 8,          // bars armed with no slam -> disarm (a breakdown)
  SLAM_AFTER: 1,   // bars armed before a slam counts (a void is 2-5 bars: a bass return inside its first bar is a pickup)
  ON_BEAT: 0.125,  // beats: a slam onset this close to a beat line
  CONF: 0.25,      // beats after the onset in which the bass must come back
  RET: 1.75,          // bassS >= RET x its 2 s mean (as the onset arrived) = the bass is back
  SUB_RET: 5,      // or synapse's sub >= SUB_RET x its 2 s mean (the 808 / sub coming back first; 0 = off)
  PRESENT: 0.15,   // presence below this is silence
  REL: 0.5,        // s: buildLive's decay after a disarm that is not a slam
  SUBV_OFF: 0.2,   // the ears' CAUSAL sub gate, 2 s mean, below which the sub is out (0 = the sub-void path off)
  SUBV_HOLD: 4,    // bars the sub must be out before the sub-void path arms (Vienna 6.02; the longest elsewhere 3.85)
  SUBV_RET: 2,     // on a sub-void arm: sub >= SUBV_RET x its 2 s mean = the sub is back (Vienna's drop reads 2.14)
};
export const BUILD_OUT = ['buildLive', 'dropLiveIn', 'dropLiveEvt'];
const TEMPO_JUMP = 0.04, ANCHOR_BEATS = 8;

// a trailing box mean over `win` seconds of (value, dt) samples, time-weighted (the page's frame interval varies)
export class BoxMean {
  constructor(win, cap = 8192) { this.win = win; this.v = new Float64Array(cap); this.d = new Float64Array(cap); this.cap = cap; this.reset(); }
  reset() { this.h = 0; this.n = 0; this.sv = 0; this.sd = 0; }
  push(v, dt) {
    const c = this.cap, i = (this.h + this.n) % c;
    if (this.n === c) { this.sv -= this.v[this.h] * this.d[this.h]; this.sd -= this.d[this.h]; this.h = (this.h + 1) % c; this.n--; }
    this.v[i] = v; this.d[i] = dt; this.n++; this.sv += v * dt; this.sd += dt;
    while (this.n > 1 && this.sd - this.d[this.h] >= this.win) { this.sv -= this.v[this.h] * this.d[this.h]; this.sd -= this.d[this.h]; this.h = (this.h + 1) % c; this.n--; }
    return this.mean;
  }
  get mean() { return this.sd > 0 ? this.sv / this.sd : 0; }
}

export class Build {
  constructor(k = BUILD) {
    this.k = k;
    this.out = { buildLive: 0, dropLiveIn: -1, dropLiveEvt: 0 };
    this.hp5 = new BoxMean(5); this.b2 = new BoxMean(2); this.b32 = new BoxMean(32); this.s2 = new BoxMean(2);
    this.sg2 = new BoxMean(2);
    this.pB = null; this.pBpm = 0;
    this.a = 0; this.aCand = -1; this.aT = 0;       // the bar phase (0..3) and a proposed one
    this.reset();
  }

  // a seek / a new stream: nothing carries across
  reset() {
    this.hp5.reset(); this.b2.reset(); this.b32.reset(); this.s2.reset(); this.sg2.reset();
    this.hist = 0; this.disarm(true); this.rearm = true; this.voidB = 0; this.gapB = 0; this.offB = 0;
    this.svB = 0; this.svGap = 0;
    this.out.buildLive = 0;
  }

  disarm(slam) {
    this.armed = false; this.armB = 0; this.cand = null; this.sv = false;
    this.out.dropLiveIn = -1;
    if (slam) this.out.buildLive = 0;
    this.rearm = false;
  }

  // the bar phase: v3's count, or synapse's sure proposal once it held ANCHOR_BEATS
  phase(p, B) {
    if (p < 0 || p === this.a) { this.aCand = -1; return; }
    if (p !== this.aCand) { this.aCand = p; this.aT = B; return; }
    if (B - this.aT >= ANCHOR_BEATS) { this.a = p; this.aCand = -1; }
  }

  // one frame. i = { B, rel, bpm, ok, hp, bassS, anchor, onsets: [{ x }], dt }:
  //   B  heard beat position (continuous) · rel  the position events are released at (B + the display lead, beats)
  //   bpm  the grid's tempo · ok  music present (presence)
  //   hp  synapse's high-pass evidence · bassS  synapse's bass level · anchor  a proposed bar phase 0..3 or -1
  //   onsets  the ears' low onsets newly due this frame (x: their heard beat position) · dt  the frame interval (s)
  step(i) {
    const o = this.out, k = this.k, B = i.B, dt = i.dt > 0 && i.dt < 0.1 ? i.dt : 1 / 60;
    o.dropLiveEvt = 0;
    if (!(i.bpm > 0) || !isFinite(B)) { this.disarm(false); this.decay(dt); return o; }
    if (this.pB !== null) {
      if (B < this.pB - 0.5 || B > this.pB + 2) { this.reset(); this.pB = B; this.pBpm = i.bpm; return o; }   // a seek
      if (Math.abs(i.bpm / this.pBpm - 1) > TEMPO_JUMP) { this.disarm(false); this.voidB = this.svB = 0; }      // a tempo jump
    }
    const dB = this.pB === null ? 0 : Math.max(0, B - this.pB), pB = this.pB === null ? B : this.pB;
    this.pB = B; this.pBpm = i.bpm;
    this.phase(i.anchor, B);
    if (!i.ok) { if (this.armed) this.disarm(false); this.voidB = this.svB = 0; this.decay(dt); return o; }   // silence
    this.hist += dt;
    const hp5 = this.hp5.push(i.hp, dt), b2prev = this.b2.mean, b2 = this.b2.push(i.bassS, dt), b32 = this.b32.push(i.bassS, dt);
    const s2prev = this.s2.mean; this.s2.push(i.sub || 0, dt);
    const sg2 = this.sg2.push(i.subGate === undefined ? 1 : i.subGate, dt);
    const isVoid = this.hist >= k.MIN_HIST && (hp5 > k.HP_ARM || (k.BASS_ARM > 0 && b2 < k.BASS_ARM * b32));
    // the sub void, counted in beats of its own with the same gap bridging
    const isSubVoid = this.hist >= k.MIN_HIST && k.SUBV_OFF > 0 && sg2 < k.SUBV_OFF;
    if (isSubVoid) { this.svB += dB + this.svGap; this.svGap = 0; }
    else { this.svGap += dB; if (this.svGap > 1) { this.svB = 0; this.svGap = 0; if (this.armed && this.sv) this.disarm(false); } }
    // the void's length in beats, gaps <= 1 beat bridged; gone for a bar = over (and re-arming allowed again)
    if (isVoid) { this.voidB += dB + this.gapB; this.gapB = 0; this.offB = 0; }
    else {
      this.gapB += dB; this.offB += dB;
      // the bass/hp void lifting disarms a BASS/HP arm only: a sub-void arm has its own gap counter below, and on
      // Vienna the bass void lifted eleven seconds before the drop (§64).
      if (this.gapB > 1) { this.voidB = 0; this.gapB = 0; if (this.armed && !this.sv) this.disarm(false); }
      if (this.offB >= 4) this.rearm = true;
    }
    const bar = (x) => Math.floor((x - this.a) / 4);
    const vOn = this.voidB > 0 && this.voidB >= 4 * k.HOLD;
    const svOn = k.SUBV_OFF > 0 && this.svB >= 4 * k.SUBV_HOLD;
    if (!this.armed && this.rearm && (vOn || svOn) && bar(B) > bar(pB)) {   // armed on a bar line
      this.armed = true; this.armB = 4 * bar(B) + this.a; this.sv = !vOn;   // `sv`: armed by the sub void alone
    }
    if (this.armed) {
      if (B - this.armB > 4 * k.MAX) { this.disarm(false); this.decay(dt); return o; }  // a breakdown, not a void
      // the slam: an on-beat low onset, confirmed by the bass coming back within CONF beats
      for (const e of i.onsets) {
        if (!this.sv && e.x - this.armB < 4 * k.SLAM_AFTER) continue;
        if (Math.abs(e.x - Math.round(e.x)) <= k.ON_BEAT && (!this.cand || e.x > this.cand.x + 0.5)) this.cand = { x: e.x, ref: b2prev, sref: s2prev };
      }
      if (this.cand) {
        if (B - this.cand.x > k.CONF) this.cand = null;
        else if ((i.rel === undefined ? B : i.rel) >= this.cand.x - 0.05 && ((i.bassS >= k.RET * this.cand.ref && this.cand.ref > 0) ||
          (k.SUB_RET > 0 && (i.sub || 0) >= k.SUB_RET * this.cand.sref && this.cand.sref > 0) ||
          (this.sv && k.SUBV_RET > 0 && (i.sub || 0) >= k.SUBV_RET * this.cand.sref && this.cand.sref > 0))) {
          o.dropLiveEvt = 1; this.disarm(true); return o;
        }
      }
      const vb = Math.max(this.voidB, this.sv ? this.svB : 0) / 4;
      o.buildLive = Math.min(1, k.L0 + (1 - k.L0) * Math.max(0, vb - k.HOLD) / Math.max(1e-6, k.FULL - k.HOLD));
      // beats to the next bar line; 0 through the first ON_BEAT after a line (the drop may be landing now; not on the arm's line)
      const r = (((B - this.a) % 4) + 4) % 4;
      o.dropLiveIn = r < k.ON_BEAT && B - this.armB > 1 ? 0 : 4 - r;
    } else this.decay(dt);
    return o;
  }

  decay(dt) { this.out.buildLive *= Math.exp(-dt / this.k.REL); if (this.out.buildLive < 1e-4) this.out.buildLive = 0; }
}
