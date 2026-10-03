// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// MANDALA — the three transient voices (DECISIONS §86, step 2 of the MANDALA overhaul; the pattern is DUST's §57 / §58 /
// §64 / §70, the voices themselves assets/math/voice.js).
//
// The scene used to read synapse's `kick` LEVEL as the hit (the zoom pulse, the fold constant's shove, the centre flare)
// and `hat` as the trap ring's sparkle: a follower's shape, not the hit's, and no snare at all. Now, exactly DUST's three
// calls (dust/index.js :134 / :141 / :149, one receipt covering both scenes):
//   kick  = voice(vK, dt, kick2, kickAge, kickEvt)                       the union: the ears' event or the v2 level's edge,
//                                                                         whichever comes first; the age places it, the level
//                                                                         sizes it (the prompt's open question 3: DUST's call
//                                                                         exactly, lane-less — `kickAmp` is declared and
//                                                                         traced, not read by the look)
//         -> the FOLD-DEPTH PULSE: `vk.e` is the zoom-in, the shove on c and the centre flare (uKick)
//   snare = voice(vS, dt, snare2, snareAge, snareEvt, false, snareAmp)   the lane alone, at its own size (§70)
//         -> the SEGMENT FLASH (open question 2's default): ONE of the N wedges is lit for the decay, additive, so it
//            cannot jump the picture; which wedge is a hash of the fire count (uSnare, uSnareSeg)
//   hat   = voice(vH, dt, hat2, hatAge, hatEvt, bed(hBed, dt, highS))    the union with the §64 swell veto
//         -> the TRAP-RING GLINT: `vh.e` is the ring's sparkle (uHat)
// The decays (tc) and floors start at DUST's measured numbers (0.24/0.25, 0.30/0.25, 0.09/0.2) and are MANDALA's own
// constants from here. `kick2` / `snare2` / `hat2` stay the floors under the envelopes (`Math.max(…, lvl)` in voice()).
import { bed, hatGain, mkBed, mkTens, mkVoice, tens, voice } from '../../math/voice.js';
import { hash11 } from './grid.js';

export const TC = { K: 0.24, S: 0.30, H: 0.09 };
export const FLOOR = { K: 0.25, S: 0.25, H: 0.2 };

export function mkVoices() {
  return { vK: mkVoice(TC.K, FLOOR.K), vS: mkVoice(TC.S, FLOOR.S), vH: mkVoice(TC.H, FLOOR.H), hBed: mkBed(), hSwell: false, seg: 0, kAmp: 0,
    vT: mkTens(), amb: 0, ambE: 0, tight: 0, Nt: 0, drain: 1 };
}

// One frame. `N` is the current mirror count (grid.js), for the snare's wedge; `acc` the beat's double-time accent (§78,
// beatgrid.js accent21 in `sp.acc`): §80's hat lever, `1 + 0.5·acc` on the glint's size — a layer ARRIVING sparkles harder
// on every stick, never faster (the rate and the timing are the voice's own, math/voice.js). Step 4, §88.
export function voices(V, dt, MS, N, acc) {
  voice(V.vK, dt, MS.kick2, MS.kickAge, MS.kickEvt);
  const n0 = V.vS.n;
  voice(V.vS, dt, MS.snare2, MS.snareAge, MS.snareEvt, false, MS.snareAmp);
  if (V.vS.n !== n0) V.seg = Math.floor(hash11(V.vS.n * 0.731 + 0.17) * N) % N;   // a new flash: its wedge, from the count
  V.hSwell = bed(V.hBed, dt, MS.highS);
  voice(V.vH, dt, MS.hat2, MS.hatAge, MS.hatEvt, V.hSwell, undefined, hatGain(acc));
  V.kAmp = +MS.kickAmp || 0;         // traced (dinfo), never read by the look — open question 3
  return V;
}

// --- step 3: real tension (DECISIONS §87) ---
//
// `tension` is v3's roughness — how dissonant the music is, not how close a drop is; the scene used to zoom OUT on it
// (`+0.5·uTension`), which read as a build that never arrived. The build is `tens()` (math/voice.js, §57 step 3): `build`
// = `buildLive` eased (tau .35), `wind` the last bar (`nextDropIn` < 1.7 s), `rel` the slam (`dropLiveEvt`, tau .55).
// MANDALA adds §77 / §79's AMBIGUITY — the beat the music is not committing to (`tongueAmbig`, Vienna's dream 72–86 s) —
// through TORUS2's dead zone: `amb = max(0, (tongueAmbig − 0.75) / 0.25)`, `tongueOn` 1 only. `tight = max(build, amb)`,
// eased on TIGHT_TC. While it is past the knee the mirror count is N + 1 (odd N — the fold's mod / abs is exact for any
// N and an odd count is itself the visible sign of the void; open question 4's default, +1), the palette drains
// (`sat × (1 − 0.55·tight)`, DUST's number) and the body dims, the inversion clamp tightens (shaders.js). The slam
// springs it all back ON ONE FRAME: `tight` and the build's ease are zeroed on `dropLiveEvt`, and `rel` flares the centre.
// The wedge STEP stays on N (the +1 is a look, not a grid change), so the nudge's numbers cannot move with the tension.
export const AMB0 = 0.75;          // TORUS2's dead zone (§79): under it the ambiguity is a groove's own looseness
export const TIGHT_TC = 0.35;      // s: the ease on the ambiguity (the build's own tau inside tens(), §57)
export const KNEE = { ON: 0.55, OFF: 0.45 };   // the N + 1 hysteresis around the prompt's 0.5
export const DRAIN = 0.55;         // the palette's drain at tight 1 (DUST's)

export function tension(V, dt, MS, N) {
  tens(V.vT, dt, MS);
  V.amb = MS.tongueOn === 1 ? Math.max(0, ((+MS.tongueAmbig || 0) - AMB0) / (1 - AMB0)) : 0;
  // the ambiguity steps once per beat, so it is eased (TIGHT_TC); the build is ALREADY eased inside tens() (tau .35) and is
  // read as it is — a second ease on top of it measured 0.683 at SeeYouDrop's drop 2 against build's own 0.716 (§87)
  if (MS.dropLiveEvt) { V.tight = 0; V.ambE = 0; V.vT.build = 0; V.vT.wind = 0; }   // the slam: everything lets go at once
  else { V.ambE += (V.amb - V.ambE) * (1 - Math.exp(-dt / TIGHT_TC)); V.tight = Math.max(V.vT.build, V.ambE); }
  const up = V.Nt > N;
  V.Nt = (up ? V.tight > KNEE.OFF : V.tight > KNEE.ON) ? N + 1 : N;
  V.drain = 1 - DRAIN * V.tight;
  return V;
}
