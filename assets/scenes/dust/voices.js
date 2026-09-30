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

// tc: the voice's decay in seconds (longer than the level's own, which is what "slow decay" means).
// floor: the smallest amplitude a hit is allowed to have, so a soft hit is still a hit.
export function mkVoice(tc, floor) {
  return { e: 0, amp: 0, age: 99, prev: 0, tc, floor };
}

export function voice(v, dt, lvl, msAge) {
  v.age += dt;
  if (lvl >= THR && lvl > v.prev + 0.02) {            // the attack: a follower steps up on the hit frame only
    const a = msAge === undefined || msAge === null ? 99 : msAge;
    v.age = a >= -0.03 && a < FRESH ? Math.max(0, a) : 0;
    v.amp = Math.max(v.floor, lvl);
  }
  v.prev = lvl;
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
