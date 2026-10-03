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
import { bed, mkBed, mkVoice, voice } from '../../math/voice.js';
import { hash11 } from './grid.js';

export const TC = { K: 0.24, S: 0.30, H: 0.09 };
export const FLOOR = { K: 0.25, S: 0.25, H: 0.2 };

export function mkVoices() {
  return { vK: mkVoice(TC.K, FLOOR.K), vS: mkVoice(TC.S, FLOOR.S), vH: mkVoice(TC.H, FLOOR.H), hBed: mkBed(), hSwell: false, seg: 0, kAmp: 0 };
}

// One frame. `N` is the current mirror count (grid.js), for the snare's wedge.
export function voices(V, dt, MS, N) {
  voice(V.vK, dt, MS.kick2, MS.kickAge, MS.kickEvt);
  const n0 = V.vS.n;
  voice(V.vS, dt, MS.snare2, MS.snareAge, MS.snareEvt, false, MS.snareAmp);
  if (V.vS.n !== n0) V.seg = Math.floor(hash11(V.vS.n * 0.731 + 0.17) * N) % N;   // a new flash: its wedge, from the count
  V.hSwell = bed(V.hBed, dt, MS.highS);
  voice(V.vH, dt, MS.hat2, MS.hatAge, MS.hatEvt, V.hSwell);
  V.kAmp = +MS.kickAmp || 0;         // traced (dinfo), never read by the look — open question 3
  return V;
}
