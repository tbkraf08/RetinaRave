// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// NAV2's motion pass — the groove moves c (DECISIONS §100, 2026-10-08; docs/plans/NAV2-RETUNE-PLAN.md step 2). The user:
// "the set doesn't move to the music completely as I'd expect … stuck in defined locations of the set"; on the kick,
// "find the goldilocks, not too much, not too little". Review §2: inside a bulb only `intensity` (the radius) and
// `harmUnw` (±1.3 rad of φ) move c, both slow emas; the beat reached c only through v3's onset picker. Five terms, each
// behind a knob whose rest is NAV's bytes (nav.js / index.js read K3 and take the old line when a term is off):
//   KICK    the Misiurewicz jump fires on the ears' LOW lane (`kickEvt`, placed by `kickAge`), sized by `kickAmp` through
//           §74's sqrt law (floor .31; a size-1 hit = the old .85), NAV's refractory, vetoed in the void and outside INT
//   BREATH  the radius breathes on beatgrid.js's profile (crest ON the line, downbeat ×1.5, the double time's `acc` makes
//           the crest BIGGER, never faster — §78): the chart's h is pressed toward the rim by AMP·crest, relaxing between —
//           on h itself, after the spring (the raised cosine IS the smoothing; through the w 3.5 spring it was a third as big)
//   SUB     `subGate` open → the same press (ρ ↑, the Koenigs arms tighten); shut → the target relaxes toward the bulb's
//           centre. §75's cold start honoured: nothing until the gate has been seen open once in this run
//   PITCH   `subNote` while the gate is open leans φ within the bulb's ±1.3 rad — the interval from the key, up one way,
//           down the other, eased over PITCH.TAU; released slowly when the sub leaves
//   TRAP    the line trap turns π per BAR (a quarter step per beat on the same profile) plus an accent of ACC turns per
//           beat on the crest — not the old half turn per beat that re-threaded every filament each beat
// Pure state + numbers: no GL. A field that is not published (the fake timeline has no sub; node has no lane) leaves its
// term at rest, so every mode runs.
import { clamp, ema } from '../../math/util.js';
import { mkSpin, spin, phiDot } from '../../math/beatgrid.js';

// the knobs: &n2kick=0 (v3's onset picker) · &n2breath=0 · &n2sub=0 · &n2pitch=0 · &n2trap=0 (π per beat); a number list sets the term's numbers AND turns it on
export const K3 = { kick: 1, breath: 1, sub: 1, pitch: 1, trap: 1 };
export const KICK = { THR: 0.45, HOLD: 2, REFR: 0.15, GAIN: 1, VOID: 0.4 };   // THR + HOLD: the goldilocks row of §100's sweep (kickAmp ≥ THR fires; .69–1.29 jumps per bar on the six windows); HOLD: BEATS since the last jump before another may fire (0 = NAV's spring refractory alone; in beats so 90 and 150 BPM get the same jumps per bar); REFR: NAV's `kick.x < .15`; VOID: buildLive at or above = the detector is armed, no jump
export const BREATH = { AMP: 0.3 };            // the press on h at a plain beat's crest (×1.5 on the downbeat, ×(1 + .25 acc) with the double time)
export const SUB = { DEPTH: 0.2, TAU: 0.12 };   // the sub's press (open) / release (shut) on the h target, eased
export const PITCH = { GAIN: 0.6, TAU: 0.15, REL: 0.6 };   // rad of φ at a tritone from the key; the ema while open; the release when the sub leaves
export const TRAP = { ACC: 0.12 };             // turns of extra trap rotation per beat (on the crest), on top of the quarter turn

export const M2 = {
  sp: mkSpin(1),  // the beat profile in beat units: ang grows 1 per beat (1.5 on the downbeat), crest on the line
  ang: 0, crest: 0, breath: 0, subSeen: 0, subE: 0, lean: 0, tight: 0, trapA: 0,
  fires: 0, lastK: 0, since: 99, lastAge: 99,   // the lane's jumps this run, the last size, beats since the last, the age last frame (n2info / the counters)
};

export function reset3() {
  M2.sp = mkSpin(1);
  M2.ang = 0; M2.crest = 0; M2.breath = 0; M2.subSeen = 0; M2.subE = 0; M2.lean = 0; M2.tight = 0; M2.trapA = 0; M2.fires = 0; M2.lastK = 0; M2.since = 99; M2.lastAge = 99;
}

// The knobs as hooks: '0' turns a term off (the old NAV line), '' / '1' on with its numbers, a number list sets the numbers and turns it on:
//   n2kick=THR[,HOLD[,REFR[,GAIN[,VOID]]]] · n2breath=AMP · n2sub=DEPTH[,TAU] · n2pitch=GAIN[,TAU[,REL]] · n2trap=ACC
export function knob3(name, v) {
  const s = String(v === undefined || v === null ? '' : v);
  if (s === '0') { K3[name] = 0; return 0; }
  K3[name] = 1;
  const nums = s === '' || s === '1' ? [] : s.split(',').map(Number);
  if (!nums.length || nums.some((x) => !isFinite(x))) return K3[name];
  const set = (T, keys) => keys.forEach((k, i) => { if (i < nums.length) T[k] = nums[i]; });
  if (name === 'kick') set(KICK, ['THR', 'HOLD', 'REFR', 'GAIN', 'VOID']);
  if (name === 'breath') set(BREATH, ['AMP']);
  if (name === 'sub') set(SUB, ['DEPTH', 'TAU']);
  if (name === 'pitch') set(PITCH, ['GAIN', 'TAU', 'REL']);
  if (name === 'trap') set(TRAP, ['ACC']);
  return nums;
}

// Once per updateNav, before the chart: the beat profile, the breath (M2.breath, nav.js applies it to the chart's h), the
// sub press and the pitch lean. Returns the multiplicative tightening of the h TARGET by the sub (+ = toward the rim / root,
// − = toward the centre), 0 when the term rests.
export function tighten(dt, S, N) {
  const sp = M2.sp;
  M2.since += dt * (S.bpm > 40 ? S.bpm : 124) / 60;   // beats since the last jump
  M2.ang = spin(sp, S, dt);
  const pk = (1 - sp.g) * 2 / sp.w;   // the profile's own crest height in steps per beat above the glide
  M2.crest = clamp((sp.step / sp.base) * (phiDot(sp.u, sp.g, sp.w) - sp.g) / pk, 0, 2);   // 1 on a plain beat's line, 1.5 on the downbeat
  M2.trapA = Math.PI * (0.25 + TRAP.ACC) * M2.ang;
  const conf = isFinite(S.clockConfPcm) ? clamp(S.clockConfPcm, 0, 1) : 1;
  M2.breath = K3.breath ? BREATH.AMP * conf * M2.crest : 0;
  const g = S.subGate === true ? 1 : S.subGate === false ? 0 : S.subGate;
  if (g === 1) M2.subSeen = 1;
  const want = K3.sub && M2.subSeen && (g === 0 || g === 1) ? (g ? 1 : -1) : 0;
  M2.subE = ema(M2.subE, want, dt, SUB.TAU);
  const note = S.subNote, open = K3.pitch && g === 1 && isFinite(note) && note >= 0;
  if (open) {
    const d = (((note | 0) - (S.key | 0)) % 12 + 18) % 12 - 6;   // the interval from the key, −6..5 semitones
    M2.lean = ema(M2.lean, PITCH.GAIN * d / 6, dt, PITCH.TAU);
  } else M2.lean = ema(M2.lean, 0, dt, PITCH.REL);
  M2.tight = clamp(SUB.DEPTH * M2.subE, -0.6, 0.6);
  return N.mode === 'INT' ? M2.tight : 0;
}

// The kick gate: the size of the Misiurewicz jump this frame, 0 for none. The lane (K3.kick, and `kickEvt` published)
// fires on the event frame — the flag, OR the age crossing back to fresh (voice.js's rule: a one-frame flag set inside an
// engine frame can be gone by the time a rAF-paced scene reads it; the age cannot) — where `kickAmp` is already the hit it
// belongs to (§74: `kickVel` there is the PREVIOUS hit's). Without the lane, v3's picker exactly as NAV has it. Both keep
// NAV's refractory and the drum / bridge vetoes.
const FRESH = 0.06;   // s: an age under this is "this frame's or a hair before" (voice.js FRESH)
export function kickGate(S, N, park, env) {
  const lane = K3.kick && S.kickEvt !== undefined && S.kickEvt !== null;
  const a = lane && isFinite(S.kickAge) ? S.kickAge : 99, ev = lane && (!!S.kickEvt || (a >= -0.03 && a < FRESH && a < M2.lastAge));
  M2.lastAge = a;
  if (!(N.kick.x < KICK.REFR) || env.drum || N.mode === 'IN' || N.mode === 'OUT') return 0;
  if (!lane) return S.onset && S.hitStrength > 0.55 && S.eS > 0.3 && park < 0.6 ? clamp(0.3 + 0.55 * S.hitStrength, 0, 0.85) * (N.mode === 'INT' ? 1 : 0.5) : 0;
  if (!ev || N.mode !== 'INT' || park >= 0.6 || S.buildLive >= KICK.VOID) return 0;   // the void: a jump reads as a twitch
  const amp = +S.kickAmp || 0;
  if (amp < KICK.THR || M2.since < KICK.HOLD) return 0;
  M2.fires++;
  M2.since = 0;
  M2.lastK = clamp(0.3 + 0.55 * Math.sqrt(Math.max(amp, 0.31)) * KICK.GAIN, 0, 0.85);   // §74's sqrt law: a size-1 hit = NAV's .85
  return M2.lastK;
}
