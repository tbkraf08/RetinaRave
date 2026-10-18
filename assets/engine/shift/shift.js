// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// THE ENERGY SHIFT (DECISIONS §143, docs/workers/brief-drop-piano.md item 2). The user on NAV3 over Comptine, a solo piano whose
// energy changes fast and has no kick, no sub and no void for the live detector (§54) to read: *"47s looks like a drop, when really
// should do a drop viz at 52s with energy sustained till 1m10s (a little slow (2-4 bars) to detect and show the shift in energy"*.
// A drop is a slam; a SHIFT is the track getting louder for a while — the loudness ladder (§63 / §67 baseLight: the track's own
// loudRel stretched over the range it has shown) stepping up by STEP within BARS bars of the heard grid. Pure: no DOM, no clock —
// node-testable (tools/test_shift.js), replayable through a page trace (tools/work/drop/shift-replay.mjs), fed once per frame by
// features-shift.js. Additive: `shiftEvt` / `shiftHold` are new fields; nothing existing moves, only NAV3 reads them (§143).
//   shiftEvt   one frame: the ladder now is STEP above where it was BARS bars ago (the ring below) and at or above LEVEL, after MIN_HIST s of music,
//              REFR bars after the last shift or confirmed drop, and not while the live detector is armed (ARMED); reactive — about a bar late by construction (the 3 s loudness
//              window plus the bar it is measured over), which the user accepted ("a little slow is the complaint, so sooner is
//              better": BARS 1 is the shortest window that does not fire on a single loud bar)
//   shiftHold  1 from the shift (or a confirmed drop — the slam IS a shift, so the hold rides it and no shift doubles it) while
//              the ladder stays at or above HOLD × the level it stepped to; 0 once it has been under for REL bars, or in silence
//   level      the ladder at the shift (what the hold is measured against); a later shift re-levels it
// THE TIME BASE is the bars stage's (DECISIONS §50): B = the raw v3 beat + the lead's estimate, as engine/build's feed.
export const SHIFT = {
  STEP: 0.3,       // the ladder's rise over BARS bars that names a shift (Comptine 48 → 52 s: 0 → .85; a loud bar inside a groove moves it .1)
  LEVEL: 0.75,     // ... and the ladder must have REACHED this. Comptine's whole-track ladder (the page): the drop at 52 peaks .93, the 1:49 one .86, the opening's .79; its four-second SWELLS peak at .54–.71 (45.1, 91.6 — the user's "too harsh at 1:34" — and 102.3), so .75 sits .04 above the loudest swell and .11 under the softer drop; at .5 the swells chained NAV3's implosions into one 50 s exterior, at .7 the 1:34 swell still fired. The dance tracks' shifts read .84–.92
  ARMED: 1,        // 1: no shift while the live detector is armed (buildLive > 0: a drop is expected and the slam will name it — SeeYouDrop's riser read +.33 a bar before its slam, Vienna's dream +.3 three seconds before); 0: shifts fire regardless
  BARS: 1,         // bars of the heard grid the rise is measured over
  HOLD: 0.5,       // shiftHold stays 1 while the ladder is at or above HOLD × the shift's level
  REL: 0.5,        // bars the ladder must sit under that line before the hold releases (a one-beat dip is a fill, not an end)
  MIN_HIST: 16,    // s of music before the first shift: the loud stage's peak hold and range are the §67 warm-up guard's for its first ~20 s (RaindropsOnRoses fired at 5.0 s on a range of 16.5 LU read off a silent intro); the earliest real shift on the nine tracks is 26 s
  REFR: 2,         // bars after a shift or a confirmed drop before the next shift may fire
  PRESENT: 0.15,   // presence under this is silence: no shift, the hold released, the ring forgotten (the build detector's PRESENT)
  DROP_LEVELS: 1,  // 1: a confirmed drop (dropLiveEvt / mapDropEvt) levels the hold from the ladder and starts the refractory; 0: drops ignored
};
export const SHIFT_OUT = ['shiftEvt', 'shiftHold'];
const CAP = 4096;   // frames of ladder history (68 s at 60 fps — a bar of any tempo the clock names)

// A ring of (beat position, value) samples, one per frame, read back by beat: `at(B)` = the oldest sample at or after B (NaN while
// the ring does not reach back that far). Monotone in B — a seek resets it. Shared by the shift stage and the build detector's
// slam confirmation (engine/build/build.js, §143 item 1).
export class BeatRing {
  constructor(cap = CAP) { this.cap = cap; this.rb = new Float64Array(cap); this.rv = new Float64Array(cap); this.reset(); }
  reset() { this.h = 0; this.n = 0; }
  push(B, v) { const c = this.cap, w = (this.h + this.n) % c; if (this.n === c) this.h = (this.h + 1) % c; else this.n++; this.rb[w] = B; this.rv[w] = v; }
  at(B) {
    const c = this.cap;
    if (this.n === 0 || this.rb[this.h] > B) return NaN;
    let lo = 0, hi = this.n - 1;
    while (lo < hi) { const m = (lo + hi) >> 1; if (this.rb[(this.h + m) % c] < B) lo = m + 1; else hi = m; }
    return this.rv[(this.h + lo) % c];
  }
}

export class Shift {
  constructor(k = SHIFT) {
    this.k = k;
    this.out = { shiftEvt: 0, shiftHold: 0 };
    this.ring = new BeatRing();
    this.reset();
  }
  reset() { this.ring.reset(); this.hist = 0; this.level = 0; this.lastB = -1e9; this.under = -1; this.pB = null; this.out.shiftEvt = 0; this.out.shiftHold = 0; }

  // one frame. i = { B, bpm, ok, lad, drop, armed, dt }: B the heard beat position · bpm the grid's tempo · ok music present ·
  // lad the loudness ladder 0..1 (math/loudlight baseLight) · drop a confirmed drop this frame (dropLiveEvt || mapDropEvt) ·
  // armed the live detector is armed (buildLive > 0) · dt s
  step(i) {
    const o = this.out, k = this.k, B = i.B, dt = i.dt > 0 && i.dt < 0.1 ? i.dt : 1 / 60;
    o.shiftEvt = 0;
    if (!(i.bpm > 0) || !isFinite(B) || !i.ok || !isFinite(i.lad)) { this.reset(); return o; }   // silence / no clock: nothing held, nothing remembered
    if (this.pB !== null && (B < this.pB - 0.5 || B > this.pB + 2)) this.reset();                  // a seek
    this.pB = B;
    this.hist += dt;
    this.ring.push(B, i.lad);
    const ref = this.ring.at(B - 4 * k.BARS), free = B - this.lastB >= 4 * k.REFR;
    if (i.drop && k.DROP_LEVELS) { this.level = Math.max(i.lad, this.level); this.lastB = B; this.under = -1; }
    else if (free && this.hist >= k.MIN_HIST && isFinite(ref) && i.lad - ref >= k.STEP && i.lad >= k.LEVEL && !(k.ARMED && i.armed)) { o.shiftEvt = 1; this.level = i.lad; this.lastB = B; this.under = -1; }
    if (this.level > 0) {
      if (i.lad >= k.HOLD * this.level) this.under = -1;
      else if (this.under < 0) this.under = B;
      if (this.under >= 0 && B - this.under >= 4 * k.REL) this.level = 0;   // released: the next hold needs its own step
    }
    o.shiftHold = this.level > 0 ? 1 : 0;
    return o;
  }
}
