// DUST — the transient voices and the slow envelopes (DECISIONS §57 steps 2 and 3). Since §86 the voices themselves —
// THR / FRESH / REFRACT, `voice()` (the union of the ears' event and the level's edge, the lane-alone snare, the §80 gain),
// the hat's swell veto (BED / `bed()`), the accent gain (HATACC / `hatGain`) and the tension envelope (`tens()`, WIND_BAR)
// — are `assets/math/voice.js`, lifted verbatim so MANDALA could read them (a scene imports only math/*, CONTRACTS §0).
// What is DUST's alone stays here: the snare's flash ring and the sub's swell. `import` then `export` (never
// `export … from`: bundle.js cannot rewrite it).
import { BED, FRESH, HATACC, REFRACT, THR, WIND_BAR, bed, hatGain, mkBed, mkTens, mkVoice, tens, voice } from '../../math/voice.js';

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

export { BED, FRESH, HATACC, REFRACT, THR, WIND_BAR, bed, hatGain, mkBed, mkTens, mkVoice, tens, voice };
