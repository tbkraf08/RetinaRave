// NAV2's beat: the press, the note, the interior's speed cap and its slew — moved out of nav2.js at the 500-line hard cap
// (v0.13 pass 8; nav2.js was 473 lines). A pure move: the same operations in the same order, s8 md5 identical. Imports detect.js
// and math/util alone, so nav2.js -> beat.js -> detect.js is a chain, never a cycle (tools/check.js fails on cycles); the wall's
// RHO_CAP is passed in, because the wall is nav2.js's. Every constant is named here with the user's words beside it.
import { TAU, clamp, mix } from '../../math/util.js';
import { DET } from './detect.js';

export const RHO_REST = 0.30;    // where the ball rests with NO BEAT and no wind (v0.13, the user on SeeYouDrop: "no
                                 // beat == more of a circle (some variation), as the beat happens it spirals in
                                 // showing the complexity"). At |lambda| 0.3 the Julia set is a quasi-circle (Green's
                                 // ruler, green.js: Q 0.99 at rho 0.2, 0.93 at 0.5, 0.81 at 0.8, 0.72 at 0.95 along
                                 // the 1/3 root); the melody still turns it, so the wobble moves. v0.8's RHO_FREE 0.91
                                 // rested c ON the rim for brightness (its luminance table is in DECISIONS §39) and
                                 // the set was always arms — the beat could only nudge it (K_HIT 0.35).
export const BUMP_K = 1.0;       // the beat's press: a kick at full strength takes rhoT from RHO_REST to RHO_BEAT
export const PULSE_K = 0.4;      // ... and the beat's DENSITY holds part of that between the kicks. 0.8 in the first
                                 // cut held rho at ~0.74 between kicks on SeeYouDrop, so the outline hardly moved
                                 // ("should be bumping in some way with each beat"); 0.4 lets it fall to ~0.6
export const RHO_E = 0.04;       // ... plus this much at full energy (detect.js E): the peak presses closer to the rim
export const NOTE_V = 8.0;       // 1/s — the beat's NOTE: on a hit the bass note's pitch class names an internal angle
                                 // ((k + 0.5)/12 around the cardioid) and c is pulled AROUND the rim toward it at this
                                 // rate x bump, so each beat closes the set up into that note's own species ("each
                                 // beat should make the set close up (different pitches are different shapes)", the
                                 // user on SeeYouDrop). The wall keeps the radius; a note across a root is a gate's job
export const NOTE_MIN = 0.08;    // below this much bass chroma there is no note: the melody's wish stands
// v0.13 pass 6 (the user: "the beat causes the set (the black circle in the middle) to collapse into interesting shapes,
// then the silence rebounds to the circle"; "why do different sounds look so similar?"): the collapse is the PINCH — the
// filled Julia set of c near the root at internal angle p/q with |lambda| -> 1 is q-fold beaded (1/2 the basilica, 1/3 the
// rabbit), and the necks close only as rho -> 1. Pass 4 put the notes at (k + 1/2)/12, BETWEEN the roots by construction, and
// capped the beat at 0.93 — every note was a dimpled circle. Now the twelve pitch classes are the twelve simplest roots,
// ascending with pitch around the cardioid, and the beat presses to the cap. The wall (probe(): the period must not
// change) keeps c in the cardioid, so the silence still rebounds to the circle; gates are locked while a note drives
// (gateTick: NOTE_LOCK), because a period-q bulb never rounds again (Q ~0.65 flat).
export const NOTE_ANG = [1 / 6, 1 / 5, 1 / 4, 1 / 3, 2 / 5, 1 / 2, 3 / 5, 2 / 3, 3 / 4, 4 / 5, 5 / 6, 6 / 7];
export const NOTE_LOCK = 0.1;    // the beat density (detect.js pulse) above which a latched note locks the gates
export const RHO_BEAT = 0.985;   // the most the BEAT may press to: the cap itself (pass 6). 0.93 in passes 2–5, capped
                                 // under the smoulder (par = sstep(PAR_LO, PAR_HI, rho), squared in the shader) which
                                 // washed the interior out on every kick ("a little too bright"); the smoulder is now
                                 // the WIND's alone (PAR_WIND), so the beat may reach the pinch with the interior dark
export const V_INT = 2.4;        // units/s — the interior's own speed cap (pass 7, the user: "still not deforming enough"). The breath
                                 // is bounded by speed x beat: at V_MAX 1.2 the trip from the pinch at the 1/2 root (c -0.735) back
                                 // to rho 0.5 (-0.31) is 0.35 s, a whole beat at 150 bpm, so the trough sat at 0.84 whatever the
                                 // press did (the node sweep, AUDIT §7). The continuity monitor's rule is a SPIKE rule (a step more
                                 // than 2.5x the last + 0.01), not an absolute, so speed is free and acceleration is what A_MAX bounds
export const A_MAX = 30.0;       // units/s^2 — the interior velocity's slew: the first step from rest is A_MAX*dt^2 (0.052 at the
                                 // loop's 1/24 s cap, 0.008 at 60 Hz) and each next step is under 2.5x the last, so no frame rate
                                 // trips the monitor; full speed in 0.08 s. Gates and the walk back to cGood keep V_MAX
export const K_R = 20.0;         // units/s per unit of (rhoT - rho): ONE two-sided radial spring. The wall owns the
                                 // radial direction outright, so there is no separate inward/outward gain. 4 in
                                 // v0.8 (a rest, not a pulse); 10 followed a BUMP_TAU 0.28 s press within a beat; 20 in
                                 // pass 7 ("still not deforming enough"): with the peak held (BUMP_HOLD) a stiffer spring
                                 // no longer costs the peak, and it follows the FALL — the node sweep at 150 bpm, K_R
                                 // 10 -> 20 with BUMP_IV 0.5: peak 0.967 -> 0.985, trough 0.753 -> 0.667, Q through the
                                 // beat 0.72-0.84 -> 0.71-0.87 (the swing doubled). 30 lost the peak at 150 bpm

const OUT = [0, 0];
// One interior frame's beat: the press on the target modulus, the note's pull around the rim, the radial spring, the speed cap
// and the slew. (vx, vy) is the melody's tangential velocity on entry; (nx, ny) the rim's normal; the result is the velocity to move
// by. nav2.js's moveInt then slides it along the wall.
export function beatStep(N, dt, S, nx, ny, vx, vy, cap) {
  const D = DET;
// the beat presses the TARGET modulus (the bump, and its density between kicks); the wind carries it up to the
  // cap for the drop. With none of them c rests at RHO_REST: the circle
  const beat = clamp(BUMP_K * D.bump + PULSE_K * D.pulse, 0, 1);
  const rhoB = Math.min(RHO_BEAT + RHO_E * D.E, cap);
  const rhoT = N.rhoPin >= 0 ? N.rhoPin : mix(mix(RHO_REST, rhoB, beat), cap, D.wind);
  // the beat's note: latched on the hit, its internal angle on the cardioid at the beat's radius
  if (D.onset && S.bchroma) {
    let bk = -1, bv = NOTE_MIN;
    for (let pc = 0; pc < 12; pc++) if (S.bchroma[pc] > bv) { bv = S.bchroma[pc]; bk = pc; }
    N.note = bk;
    if (bk >= 0) {
      const a = TAU * NOTE_ANG[bk], lr = rhoB * Math.cos(a), li = rhoB * Math.sin(a);
      N.noteX = lr / 2 - (lr * lr - li * li) / 4;
      N.noteY = li / 2 - (2 * lr * li) / 4;
    }
  }
  if (N.note >= 0 && N.q === 1) {
    const g = NOTE_V * D.bump;
    vx += (N.noteX - N.cPath[0]) * g;
    vy += (N.noteY - N.cPath[1]) * g;
  }
  const kr = K_R * (rhoT - N.rho);
  vx += kr * nx;
  vy += kr * ny;
  const sp = Math.sqrt(vx * vx + vy * vy);
  if (sp > V_INT) {
    vx *= V_INT / sp;
    vy *= V_INT / sp;
  }
  // the slew: the velocity may change by at most A_MAX*dt a frame, so a kick's step grows from rest instead of jumping
  const ax = vx - N.vx, ay = vy - N.vy, am = Math.sqrt(ax * ax + ay * ay), aCap = A_MAX * dt;
  if (am > aCap) {
    vx = N.vx + ax * aCap / am;
    vy = N.vy + ay * aCap / am;
  }
  N.vx = vx;
  N.vy = vy;
  OUT[0] = vx;
  OUT[1] = vy;
  return OUT;
}
