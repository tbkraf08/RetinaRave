// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
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
// A THIRD ARMING PATH — THE AMBIGUITY (DECISIONS §77, docs/plans/TONGUES-PLAN.md phase 3). The tongues stage (engine/clock/
// tongues.js, §76) publishes `tongueAmbig` = 1 − the octave ladder's best tongue depth: the music locks NONE of the clock's
// beat family. Vienna's dream reads ≥ 0.9 for 22 clock beats (72.0–86.0 s) where the sub void arms only at 82.1 (4.9 beats
// of lead, §64); CyborgNinja, WhoLikesToParty and Malicious never hold ≥ 0.8 for 4 beats, SeeYouDrop's outro reaches 7 at
// 0.9 (tools/tongues-node.js --amb). So:
//   AMBIGUITY = tongueOn 1 and tongueAmbig >= AMB_ARM, after MIN_HIST, counted in beats, gaps <= 1 beat bridged
//   ARM       once it has held AMB_HOLD beats, on the next bar line; the slam and the release are the sub-void path's (no
//             SLAM_AFTER wait, the sub's own return confirms); the ambiguity lifting for a beat disarms an ambiguity arm only
// `tongueOn` −1 (the stage off) or an input without the field reads as "not ambiguous": every caller before §77 is unchanged.
// TWO GATES ON A PIANO (DECISIONS §143, docs/workers/brief-drop-piano.md item 1 — the user on NAV3 over Comptine: "47s looks like
// a drop, when really should do a drop viz at 52s"). Measured on the nine page traces and the node traces (tools/work/drop/
// measure3.py, subdiag.mjs, slamdiag.mjs): every one of Comptine's six arms was the SUB-VOID path with the causal sub gate's 32 s
// mean at 0.00 — a piano has no sub, and a sub that was never there cannot have LEFT (the dance tracks' sub-void arms read .62–.98).
// And after every confirmed slam the ears' causal sub gate OPENED within .25 s (SeeYouDrop ×2, WhoLikesToParty ×3, Vienna, Raindrops,
// IBelongHere 179.9) and the loudness ladder (math/loudlight baseLight on loudRel: the track's own 3 s loudness over the range it has
// shown) stood at .53–.99 within a beat — where the false slams had no sub come back (IBelongHere's breakdown 157 / 167, every
// piano slam) or a ladder at .17–.38 (TheChain 86.9: a kick in a quiet passage; Raindrops 129.5: a fill). The ladder's RISE over the
// bar before (the brief's other witness) separated nothing the level did not, and TheChain's fast ladder read +.34 on a hit. So:
//   SUB VOID  arms only when the gate's 32 s mean is at or above SUBV_HAD (the sub WAS there)
//   SLAM      once the bass confirms it, the slam is PENDING until the causal sub gate is at or above SUB_BACK AND the ladder at or
//             above LEVEL — released on that frame (the same frame when both already hold; up to PEND beats later) — and dropped,
//             the arm kept, if PEND beats pass without them. The ladder absent (`&loud=0`, no loud stage) = the level test passes.
// A FOURTH ARMING PATH — THE ENERGY SHIFT (DECISIONS §147, docs/workers/brief-nav3-shift.md item 1; the user on NAV3 over "The Roots",
// a live band at 97 BPM: "what happens at 56 secs … part of it seems off beat"). The engine's shift (engine/shift, §143) fired at 55.12 s
// and the real drop came at 59.05 — a kick at velocity 1 on the beat with the ears' causal sub gate opening 0 → 1 on that frame and the
// ladder at .75–.83 — and nothing armed: hp 0, bassS never left (2 s / 32 s ratio .89), the sub gate's 32 s mean 0.00 (so the sub-void
// path is rightly shut by SUBV_HAD: a sub that was never there has not left), the tongues locked (.66). And no bass-return rule
// could have confirmed it: bassS's peak after the kick .58 against a 2 s mean of .40 (RET needs 1.75×), the sub .99 against .52
// (SUB_RET 5×, SUBV_RET 2×). What the drop HAS is the gate OPENING — §143's own receipt (after every confirmed slam the gate opened
// within .25 s). So:
//   SHIFT    a shiftEvt (the frame before: the shift stage runs after this one) while nothing is armed, after MIN_HIST, arms AT ONCE
//            (not on the bar line: the shift is already a bar late), no SLAM_AFTER wait; buildLive sits at SHIFT_L0 (the void's L0
//            .4 is read as "the void" by DUST at .35, move2's kick veto at .4, NAV2's park at .45 — a shift is not a void; > 0 keeps
//            the shift stage's ARMED rule); the void lifting never releases it; MAX bars, silence, a seek and a tempo jump do
//   SLAM     the same on-beat low onset (ON_BEAT .125 unchanged: the drop kick reads +.100 in this stage's time base — the brief's
//            .14–.17 was the lead-shifted display clock; at .2 the pickup kick a quarter beat before it, −.137, took the candidate
//            and the +.5 rule masked the drop), confirmed (SHIFT_GATE) by the causal sub gate opening and nothing else — its
//            2 s mean under SUBV_OFF as the onset arrived (shut), the gate at or above SUB_BACK now, its 32 s mean under SHIFT_HAD (the
//            sub ARRIVES: .11 at The Roots' drop; a dip inside a sub groove reads .5–.7 — The Roots 78.7 and TheChain 130.7, fills) —
//            then §143's Confirm as every slam
//   A kit whose gate is open through the shift (a groove getting louder) never slams by it: the shift is the scene's to swell on.
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
  ON_BEAT: 0.125,  // beats: a slam onset this close to a beat line (§147 measured and KEPT: The Roots' drop kick reads +.100 in this stage's time base — the trace's beatPhase is the lead-shifted clock, +.069 — and at .2 the pickup kick a quarter beat before it (−.137) became the candidate and masked it)
  CONF: 0.25,      // beats after the onset in which the bass must come back
  RET: 1.75,          // bassS >= RET x its 2 s mean (as the onset arrived) = the bass is back
  SUB_RET: 5,      // or synapse's sub >= SUB_RET x its 2 s mean (the 808 / sub coming back first; 0 = off)
  PRESENT: 0.15,   // presence below this is silence
  REL: 0.5,        // s: buildLive's decay after a disarm that is not a slam
  SUBV_OFF: 0.2,   // the ears' CAUSAL sub gate, 2 s mean, below which the sub is out (0 = the sub-void path off)
  SUBV_HOLD: 4,    // bars the sub must be out before the sub-void path arms (Vienna 6.02; the longest elsewhere 3.85)
  SUBV_RET: 2,     // on a sub-void arm: sub >= SUBV_RET x its 2 s mean = the sub is back (Vienna's drop reads 2.14)
  AMB_ARM: 0.9,    // the tongues' tongueAmbig at or above which the beat is ambiguous (0 = the ambiguity path off; §77)
  AMB_HOLD: 8,     // beats the ambiguity must hold before the path arms (Vienna's dream 22; the longest elsewhere 7)
  SUBV_HAD: 0.3,   // §143: the sub-void path needs a sub that WAS there — the causal gate's 32 s mean at or above this (Comptine 0.00 on every arm; the dance tracks' arms .62–.98); 0 = off
  SUB_BACK: 0.5,   // §143: the slam releases only once the ears' causal sub gate is at or above this (every confirmed drop within .25 s; IBelongHere's breakdown slams and every piano slam never); 0 = off
  LEVEL: 0.5,      // §143: ... and the loudness ladder (baseLight on loudRel) at or above this (confirmed drops .53–.99 within a beat; TheChain's quiet-passage kick .17, Raindrops' fill .38); 0 = off
  LEVEL_RNG: 4,    // §143: LU of range the track must have shown before the level test applies (a mid-track start's ladder is the warm-up guard's, not the track's: confirm.js ladderOf); the tracks that fail it whole (WhoLikesToParty 2.9, Vienna 3.3, CyborgNinja 1.4 LU) had no false slam the level caught
  PEND: 4,         // beats the sub and the ladder may take after the bass-confirmed onset (WhoLikesToParty 131.4 reaches .53 at .5 s, .62 at 1 s) — then the slam is dropped and the arm kept
  SHIFT_ARM: 1,    // §147: 1 = the engine's energy shift (shiftEvt) arms the detector when nothing is armed (The Roots 55.12 → the slam at 59.05); 0 = v0.44 (the three paths above only)
  SHIFT_L0: 0.3,   // §147: buildLive while armed by a shift (under DUST's .35 void, move2's .4 kick veto, NAV2's .45 park; above 0 for the shift stage's ARMED rule)
  SHIFT_GATE: 1,   // §147: 1 = on a shift arm the on-beat onset is confirmed by the causal sub gate OPENING (its 2 s mean under SUBV_OFF as the onset arrived, the gate at or above SUB_BACK now) and by nothing else; 0 = the void paths' bass-return ratios instead (The Roots never slams: its bass never left; TheChain's 130.7 chorus swell does)
  SHIFT_HAD: 0.3,  // §147: ...and only when the sub was NOT there — the gate's 32 s mean under this: the sub ARRIVES (The Roots 59.0: .11; the mirror of SUBV_HAD, whose path owns a sub that left for 4 bars). A dip-and-return inside a sub groove is a fill, not a drop (The Roots 78.7: .54 after 6 s out; TheChain 130.7: .68 — the two slams this rule removes); 0 = off
};
export const BUILD_OUT = ['buildLive', 'dropLiveIn', 'dropLiveEvt'];
import { Confirm } from './confirm.js';   // §143: the slam's confirmation (the sub back, the ladder at a drop's level) — v3's dropEvt takes the same one
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
    this.sg2 = new BoxMean(2); this.sg32 = new BoxMean(32);   // §143: the gate's 32 s mean — was the sub ever there
    this.conf = new Confirm(k);   // §143: the bass-confirmed slam waiting for the sub and the ladder
    this.pB = null; this.pBpm = 0;
    this.a = 0; this.aCand = -1; this.aT = 0;       // the bar phase (0..3) and a proposed one
    this.reset();
  }

  // a seek / a new stream: nothing carries across
  reset() {
    this.hp5.reset(); this.b2.reset(); this.b32.reset(); this.s2.reset(); this.sg2.reset(); this.sg32.reset();
    this.hist = 0; this.disarm(true); this.rearm = true; this.voidB = 0; this.gapB = 0; this.offB = 0;
    this.svB = 0; this.svGap = 0; this.amB = 0; this.amGap = 0;
    this.out.buildLive = 0;
  }

  disarm(slam) {
    this.armed = false; this.armB = 0; this.cand = null; this.conf.clear(); this.sv = false; this.am = false; this.sh = false;   // §147: sh = armed by a shift
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

  // one frame. i = { B, rel, bpm, ok, hp, bassS, sub, subGate, tongueAmbig, tongueOn, anchor, onsets: [{ x }], dt, lad, shift }:
  //   lad  the loudness ladder 0..1 (feed.js; NaN or absent = the loud stage is off: the slam needs no level, §143)
  //   shift  1 on the frame after the engine's shiftEvt (§147: the shift stage runs after this one; absent = no shift arm)
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
    const sgIn = i.subGate === undefined ? 1 : i.subGate, sg2prev = this.sg2.mean, sg2 = this.sg2.push(sgIn, dt), sg32 = this.sg32.push(sgIn, dt);   // §147: sg2prev = the gate's 2 s mean as this frame's onsets arrived
    const lad = i.lad === undefined ? NaN : +i.lad;   // §143: the loudness ladder (NaN = no loud stage)
    const isVoid = this.hist >= k.MIN_HIST && (hp5 > k.HP_ARM || (k.BASS_ARM > 0 && b2 < k.BASS_ARM * b32));
    // the sub void, counted in beats of its own with the same gap bridging
    const isSubVoid = this.hist >= k.MIN_HIST && k.SUBV_OFF > 0 && sg2 < k.SUBV_OFF && (k.SUBV_HAD <= 0 || sg32 >= k.SUBV_HAD);   // §143: a sub that was never there has not left
    if (isSubVoid) { this.svB += dB + this.svGap; this.svGap = 0; }
    else { this.svGap += dB; if (this.svGap > 1) { this.svB = 0; this.svGap = 0; if (this.armed && this.sv) this.disarm(false); } }
    // the ambiguity (§77), the same counting
    const isAmb = this.hist >= k.MIN_HIST && k.AMB_ARM > 0 && i.tongueOn === 1 && i.tongueAmbig >= k.AMB_ARM;
    if (isAmb) { this.amB += dB + this.amGap; this.amGap = 0; }
    else { this.amGap += dB; if (this.amGap > 1) { this.amB = 0; this.amGap = 0; if (this.armed && this.am) this.disarm(false); } }
    // the void's length in beats, gaps <= 1 beat bridged; gone for a bar = over (and re-arming allowed again)
    if (isVoid) { this.voidB += dB + this.gapB; this.gapB = 0; this.offB = 0; }
    else {
      this.gapB += dB; this.offB += dB;
      // the bass/hp void lifting disarms a BASS/HP arm only: a sub-void arm and an ambiguity arm have their own gap
      // counters, and on Vienna the bass void lifted eleven seconds before the drop (§64).
      if (this.gapB > 1) { this.voidB = 0; this.gapB = 0; if (this.armed && !this.sv && !this.am && !this.sh) this.disarm(false); }   // §147: a shift arm has no void to lift
      if (this.offB >= 4) this.rearm = true;
    }
    const bar = (x) => Math.floor((x - this.a) / 4);
    const vOn = this.voidB > 0 && this.voidB >= 4 * k.HOLD;
    const svOn = k.SUBV_OFF > 0 && this.svB >= 4 * k.SUBV_HOLD;
    const amOn = k.AMB_ARM > 0 && this.amB >= k.AMB_HOLD;
    if (!this.armed && this.rearm && (vOn || svOn || amOn) && bar(B) > bar(pB)) {   // armed on a bar line
      this.armed = true; this.armB = 4 * bar(B) + this.a; this.sv = !vOn && svOn; this.am = !vOn && !svOn;   // `sv` / `am`: armed by the sub void / the ambiguity alone
    } else if (!this.armed && this.rearm && k.SHIFT_ARM && i.shift && this.hist >= k.MIN_HIST) {   // §147: the energy shift arms at once
      this.armed = true; this.armB = B; this.sh = true;
    }
    if (this.armed) {
      if (B - this.armB > 4 * k.MAX) { this.disarm(false); this.decay(dt); return o; }  // a breakdown, not a void
      // the slam: an on-beat low onset, confirmed by the bass coming back within CONF beats
      for (const e of i.onsets) {
        if (!this.sv && !this.am && !this.sh && e.x - this.armB < 4 * k.SLAM_AFTER) continue;
        if (Math.abs(e.x - Math.round(e.x)) <= k.ON_BEAT && (!this.cand || e.x > this.cand.x + 0.5)) this.cand = { x: e.x, ref: b2prev, sref: s2prev, gref: sg2prev, g32: sg32 };
      }
      if (this.cand) {
        if (B - this.cand.x > k.CONF) this.cand = null;
        else if ((i.rel === undefined ? B : i.rel) >= this.cand.x - 0.05 && (this.sh && k.SHIFT_GATE > 0
          ? this.cand.gref < k.SUBV_OFF && sgIn >= k.SUB_BACK && (k.SHIFT_HAD <= 0 || this.cand.g32 < k.SHIFT_HAD)   // §147: on a shift arm the sub gate OPENING is THE confirmation — a sub that ARRIVES (SHIFT_HAD), not one back from a fill; the bass-return ratios below are the void paths' (on a shift arm they named TheChain 130.7, a loud chorus's bass swell)
          : (i.bassS >= k.RET * this.cand.ref && this.cand.ref > 0) ||
          (k.SUB_RET > 0 && (i.sub || 0) >= k.SUB_RET * this.cand.sref && this.cand.sref > 0) ||
          ((this.sv || this.am) && k.SUBV_RET > 0 && (i.sub || 0) >= k.SUBV_RET * this.cand.sref && this.cand.sref > 0))) {
          this.conf.arm(this.cand.x);   // §143: the bass is back — the slam is PENDING until the sub is back and the ladder is at a drop's level
          this.cand = null;
        }
      }
      if (this.conf.step(B, sgIn, lad) > 0) { o.dropLiveEvt = 1; this.disarm(true); return o; }   // −1 (PEND beats without them): not a drop; the arm stays
      const vb = Math.max(this.voidB, this.sv ? this.svB : 0, this.am ? this.amB : 0) / 4;
      o.buildLive = this.sh ? k.SHIFT_L0 : Math.min(1, k.L0 + (1 - k.L0) * Math.max(0, vb - k.HOLD) / Math.max(1e-6, k.FULL - k.HOLD));   // §147: a shift arm sits at SHIFT_L0 (no void to ramp with)
      // beats to the next bar line; 0 through the first ON_BEAT after a line (the drop may be landing now; not on the arm's line)
      const r = (((B - this.a) % 4) + 4) % 4;
      o.dropLiveIn = r < k.ON_BEAT && B - this.armB > 1 ? 0 : 4 - r;
    } else this.decay(dt);
    return o;
  }

  decay(dt) { this.out.buildLive *= Math.exp(-dt / this.k.REL); if (this.out.buildLive < 1e-4) this.out.buildLive = 0; }
}
