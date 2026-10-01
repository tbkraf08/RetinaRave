// DUST — the transient voices and the slow envelopes (DECISIONS §57 steps 2 and 3).
//
// The brief: "Transients (kick/snare) produce sharp, fast-attack/slow-decay impulses driven by band-limited onset
// detection." A 60 Hz level cannot do that on its own — synapse's `kick` is a follower whose shape is the
// follower's, not the hit's — and CONTRACTS §1.18 says a fast motion is a function of the onset's AGE, so that it
// is right to the sub-frame rather than to the frame it was noticed on.
//
// MEASURED FIRST (tools/dust-trace.js, SeeYouDrop 20–110 s, `&map=0`, the causal path, 5401 frames): the reactive
// drums v2 levels and the ears' ages are NOT always the same onsets. At a rising edge of the level, the matching
// age reads
//     kick2 / kickAge    p50   +7 ms  (p10  −4, p90 1720)  · 224 edges, 4 with no fresh age at all
//     snare2 / snareAge  p50 +101 ms  (p10  −3, p90  389)  · 143 edges
//     hat2  / hatAge     p50  +92 ms  (p10  −5, p90  395)  · 261 edges
// — the v2 kick IS the ears' low lane (§51) and agrees to within a frame; the v2 snare and hat are synapse's, and
// the ears' snare / hat come from a different picker. So each voice keeps its OWN age: the level's rising edge
// resets it (an attack can never be missed) and the engine's age SEEDS it when that age is fresh (< FRESH s), which
// is where the sub-frame placement comes from. Everything after the attack is a function of that age alone, and
// `Math.max(…, lvl)` underneath is the safety net: a hit whose age went astray still shows at the level's own size.

const THR = 0.18;                // what counts as a hit: drumcheck's own "level rising edges >= 0.18" (§51)
const FRESH = 0.06;              // an engine age this close to the edge is the same onset, and seeds the voice.
// 0.04 was the det-path number (kick p50 +7 ms). The AUDIBLE capture run (SeeYouDrop 40–112 s, &sync=27, DUST forced,
// tools/work/caplag/SeeYouDrop-cap-sync27-scene-1-fx.json) put the age at the level's edge in the 40–60 ms band for
// ALL three voices (kick 32 of 184 edges, snare 87 of 145, hat 150 of 261, and NONE under 40 for snare / hat) — one
// heard-time step later than det — so at 0.04 a live hit was placed on its frame, ~45 ms late to the ear. No two
// logged kicks were within 80 ms, so 0.06 cannot pick up the previous hit; 60–80 (hat 29, snare 21) stays unseeded.

// THE ATTACK FIRES ON WHICHEVER COMES FIRST (§58 task B). The level's rising edge is one detector and the ears'
// event is another, and they are not the same picker (§51: the v2 kick IS the ears' low lane, the v2 snare and hat are
// synapse's). Graded against the TRUTH onsets on SeeYouDrop 20–110 s `&map=0` (tools/truth/drumcheck.py), neither is
// late — the matched hits read ears +3 / v2 +4 ms (kick), ears +0 / v2 −13 (snare), ears +2 / v2 −11 (hat) — but they
// MISS different hits: recall ears 0.35 / v2 0.50 (kick), 0.71 / 0.50 (snare), 0.82 / 0.70 (hat). So §57's "+101 ms"
// was never a lag; it was the last ears' snare being a DIFFERENT onset from the one the level was confirming. What
// the union buys is coverage — and, on the capture path, the earlier of the two (§57 addendum: at every level edge the
// engine's age sits in the 40–60 ms band).
//
// The event only PLACES the hit; the level still SIZES it. The ears' velocity saturates (§51: `kickVel` p50 1.0, "the
// uniform brightness of the predicted route"), so it is not read here: a fire starts at the floor and the level's own
// edge raises the amplitude when it arrives, without moving the age. A hit the level never confirms therefore stays
// small — a false positive costs a flicker, not a flash.
export const REFRACT = 0.06;     // s: the event and the level's edge for one hit must never fire twice (no two logged
// kicks were within 80 ms on the capture path, §57 addendum), and it also stops the level's own chatter (184 edges
// for 120 logged kicks there).

// tc: the voice's decay in seconds (longer than the level's own, which is what "slow decay" means).
// floor: the smallest amplitude a hit is allowed to have, so a soft hit is still a hit.
// `n` counts the fires and `src` says what fired the last one (1 = the ears' event, 2 = the level's edge, 3 = both on
// one frame) — read-only bookkeeping for tools/dust-trace.js (§64 task 1), never read by the look.
export function mkVoice(tc, floor) {
  return { e: 0, amp: 0, age: 99, prev: 0, since: 99, lastA: 99, n: 0, src: 0, tc, floor };
}

// TRIGGER QUALITY — THE HAT, AND THE SWELL THAT IS NOT A STICK (§64 task 1, the user: "the high hat that starts at
// 0:25-1:00 still seems jerky also (wonder if the sparkly / dreamy sounds are interfering in the high section?)").
//
// MEASURED (tools/dust-trace.js, DUST, `&map=0`, the truth's `high` onsets within +-50 ms): on Vienna 20-110 s the hat
// voice fires 310 times for 224 truth hats and only **59 %** of those fires are hats. The 127 that are not land a
// median **103 ms off the 8th-note line** (the real ones land 3 ms off) and they happen where `highS` reads **0.63
// against the real hats' 0.27** and is RISING (highS minus its own 2 s EMA: +0.058 at a false event, 0.000 at a real
// one). The user's guess was right, and the mechanism is in the picker: `ears/perc.js` is an HPSS-lite whose harmonic
// part is a RUNNING MEDIAN of the band's dB envelope, and a median lags a swell — so the leading edge of a pad, an arp
// or a reverb tail rises above it and is published as a percussive onset. Per track, the share of the ears' hat events
// the level confirms (`hat2` >= 0.10 within +-2 frames) is 90 % of the REAL ones and 2 % of the false ones on Vienna,
// 75 / 30 % on SeeYouDrop, 98 % / — on CyborgNinja (which has no false ones at all).
//
// THE FIX IS THE EVENT'S TRIGGER, NOT THE PICKER (the picker is an engine item, docs/OPEN-ITEMS.md): the ears' hat
// EVENT does not fire the voice while the high band is more than R times its own TC-second average — a band that is
// getting louder on its own is a swell, and a swell's edge is not a stick. The level's rising edge still fires the
// voice there (it is the precise picker: P 0.96-0.99 on all three tracks), and the ears' AGE still places a hit the
// level confirms, so nothing about the timing moves.
//
// WHAT THE RATIO BUYS, on the page (fires/s · P · §58 coverage · fires at the floor · fires on the truth's 16th grid):
//   Vienna 20-110      3.44 0.59 96.8 % 49 % 76.8 %  ->  **2.38 0.80** 91.9 % **26 % 88.8 %**   (truth 2.49 hats/s)
//   Vienna 85-107      4.32 0.60 95.4 % 45 % 76.8 %  ->  **3.23 0.77** 93.8 % **27 % 88.7 %**   (the double time, truth 3.00/s)
//   SeeYouDrop 20-110  4.33 0.71 95.9 % 51 % 80.0 %  ->    3.91 **0.74** **94.9 %** 44 % 80.7 %  (the §58 window, floor 93 %)
//   CyborgNinja 20-50  7.63 0.99 94.7 %  8 % 79.5 %  ->    7.57   0.99    94.7 %     7 % 79.3 %  (227 of 229: no swells)
// On Vienna the median gap between flashes becomes the 8th note itself — 250 -> **333 ms**, against the truth's 325 — and
// the rim's own picture is untouched where it was right: lumR p95/p05 range 4.572 -> 4.632 (SeeYouDrop 4.196 -> 4.199,
// CyborgNinja 2.794 unchanged), |dlumR| p50 1.420 -> 1.419 / 2.431 -> 2.438 / 2.546 -> 2.547. The fires that survive are
// bigger (amp p50 0.229 -> 0.374 on Vienna, the matched ones 0.522 -> 0.659) because the ones that went were the floor.
// R 1.03 takes SeeYouDrop's coverage to 92.2 % (under the floor) for one more point of Vienna's precision; R 1.08 gives
// SeeYouDrop 94.6 % back for three points of Vienna's. 1.05 is the knee. TC 2 s was measured against 1, 3, 5, 8 and 12:
// at the same SeeYouDrop coverage they all reach Vienna 0.75-0.81, and 2 s has the most SeeYouDrop margin.
//
// REJECTED, with the number that rejected it:
//  · THE DIFFERENCE form the brief proposed (`highS` minus a slow EMA of itself, "a real step above the bed"): it
//    discriminates (real +0.000 / false +0.058) but its operating point does not travel — the bed is 0.28 on Vienna and
//    0.62 on SeeYouDrop, so one absolute step is 7 % of the band on one track and 3 % on the other, and the threshold
//    that cleans Vienna (0.02) takes SeeYouDrop's coverage to 92.2 %. The RATIO is the same idea, normalised.
//  · DROPPING `hat2`'S EDGE and keeping the ears alone (the brief's first candidate): the ears ARE the unreliable half
//    here — Vienna 3.44 -> 3.08 fires/s at P 0.59 -> **0.56** and 55 % of the fires at the floor; SeeYouDrop 0.71 ->
//    0.72 with 66 % at the floor. The level's edge is the half worth keeping, not the half worth dropping.
//  · THE EARS' EVENT GATED ON `hat2` CONFIRMING IT (the cleanest discriminator by AUC: 0.93 Vienna, 0.99 Vienna 85-107,
//    0.77 SeeYouDrop): Vienna P 0.59 -> 0.95, but SeeYouDrop's coverage falls to 85.4 % — half of its real hats are
//    invisible to synapse's picker, which is the whole reason §58 took the union. Same for the edge alone (85.4 %).
//  · A SELF-CALIBRATING version of that gate (require confirmation only while the level's own recent hits are loud — a
//    20 s peak-hold of the confirmed amplitude, 0.74 on Vienna against 0.34 on SeeYouDrop over 20-50 s): over the FULL
//    20-110 s window SeeYouDrop's hold reads 0.52 (p50) and the gate switches on there too — coverage 92.2 %.
//  · A SMALLER FLOOR for an unconfirmed fire (0.08 instead of 0.20): it keeps every coverage number, because the
//    envelope still rises, and it dims SeeYouDrop's real-but-unconfirmed hats (amp p50 0.22 there) by the same factor
//    as Vienna's false ones. It makes the metric pass without making the picture better.
//  · A RATE LIMIT (§61 already rejected it): at 8 Hz, Vienna P 0.59 -> 0.63 and CyborgNinja loses 69 of 229 fires.
export const BED = { R: 1.05, TC: 2.0 };
export function mkBed() { return { s: 0 }; }
// true when the band is swelling. The EMA includes this frame's sample, so a step up is seen on the frame it happens.
export function bed(v, dt, x) {
  const y = +x || 0;
  v.s += (y - v.s) * (1 - Math.exp(-dt / BED.TC));
  return v.s > 1e-6 && y > BED.R * v.s;
}

// `veto` (the hat's, above) suppresses the EARS' EVENT as a trigger only: the level's own rising edge still fires the
// voice, and a fire the level makes on the same frame still takes the ears' age for its sub-frame placement.
export function voice(v, dt, lvl, msAge, evt, veto) {
  v.age += dt;
  v.since += dt;
  const a = msAge === undefined || msAge === null ? 99 : msAge;
  const fresh = a >= -0.03 && a < FRESH;              // the ears' onset is this frame's, or a hair before it
  const ev = (!!evt || (fresh && a < v.lastA)) && !veto;   // the event flag, or the age crossing back to fresh
  const edge = lvl >= THR && lvl > v.prev + 0.02;     // a follower steps up on the hit frame only
  if ((ev || edge) && v.since >= REFRACT) {
    v.age = fresh ? Math.max(0, a) : 0;
    v.amp = Math.max(v.floor, lvl);
    v.since = 0;
    v.n++; v.src = (ev ? 1 : 0) | (edge ? 2 : 0);
  } else if (edge && lvl > v.amp) {
    v.amp = lvl;                                      // the level confirms a hit already started: same hit, its size
  }
  v.prev = lvl;
  v.lastA = a;
  v.e = Math.max(v.amp * Math.exp(-v.age / v.tc), lvl);
  return v.e;
}

// The snare's flash ring: launched ON THE MID BAND (`r0` = formations.js midR(), §58 task A) and travelling outward
// from there at SPEED, spreading as it goes — a shell you watch leave, not a flash you only infer.
//
// It used to launch at the ORIGIN, which was right only while a grain's band said nothing about where it was: once
// the mid band is a shell at radius r0, a front expanding from nothing does not reach it until r0 / SPEED, and the
// gaussian's own width brings that forward only a little. Measured from the shader's own geometry (the front shows
// where |R − ringR| < 0.83 · ringW): the ring first touched the sphere's mid grains at 0.24 s and the torus's at
// 0.21 s after the hit. Launching it on the band makes that 0 in all four shapes.
export const RING_SPEED = 3.4;
export const RING_W0 = 0.2;
export const RING_WK = 0.5;
export function ringR(v, r0) { return r0 + RING_SPEED * Math.min(v.age, 1.2); }
export function ringW(v) { return RING_W0 + RING_WK * Math.min(v.age, 1.2); }

// The sub: not a transient. A new sub note swells the core and the swell settles back to a held size while the sub
// is still sounding; `subGate` 0 (no bass at all) lets it go entirely — "silence is quiet" (§1.18).
export function mkSub() { return { e: 0, sw: 0, hold: 0 }; }
export function sub(v, dt, MS) {
  if (MS.subNoteEvt) v.sw = 1;
  v.sw *= Math.exp(-dt / 0.5);
  v.hold += ((MS.subGate ? 1 : 0) - v.hold) * (1 - Math.exp(-dt / 0.28));
  v.e = v.hold * (0.35 + 0.65 * v.sw);
  return v.e;
}

// --- step 3: the void, and the release ---
//
// `tension` is v3's roughness — how DISSONANT the music is, not how close a drop is (the scene used to shrink the
// whole cloud with it, which read as a build that never arrived). The build is `buildLive`: the bass pulled out for
// a bar or more, the void before a drop (§54). Measured on SeeYouDrop `&map=0`: it arms 5.6 s before drop 1
// (52.0 → 57.6, reaching 1.00) and 3.2 s before drop 2 (102.4 → 105.6, reaching 0.75), and never on CyborgNinja.
//
// `nextDropIn` is the count-down to the bar line the detector expects the drop on, and measured it never points
// further than ONE BAR ahead (1.56 s at the arm, SeeYouDrop at 150 BPM) — it is the bar count-down while armed, not
// a long runway. So it winds the LAST BAR up on top of the void's own contraction, and nothing more is claimed.
export const WIND_BAR = 1.7;     // s: a count-down longer than this is "not the last bar yet"

export function mkTens() { return { build: 0, wind: 0, rel: 0 }; }

export function tens(v, dt, MS) {
  v.build += (Math.max(0, Math.min(1, MS.buildLive)) - v.build) * (1 - Math.exp(-dt / 0.35));
  const d = MS.nextDropIn;
  const w = d !== undefined && d >= 0 && d < WIND_BAR ? 1 - d / WIND_BAR : 0;
  v.wind += (w * v.build - v.wind) * (1 - Math.exp(-dt / 0.12));   // only while the void is actually on
  if (MS.dropLiveEvt) v.rel = 1;                                   // the slam: everything lets go at once
  v.rel *= Math.exp(-dt / 0.55);
  if (v.rel < 1e-4) v.rel = 0;
  return v;
}
