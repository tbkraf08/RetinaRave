// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// DUST — the singer's grains, the ribbon as the lone voice (DECISIONS §127; docs/plans/VOX-SCENES-PLAN.md §1 "DUST"), and since
// §138 the voice as the LEAD: the sung register as a BAND that rides the pitch's height (the user on §127's cloud, watching
// TheChain: "feels like it doesn't follow the vocals (more so the instruments)" → "retune dust").
// DUST's grammar is "one frequency band per grain", and a grain's band is its PLACE (shaders.js §58: the band rank is the
// radius in every shape) — so a voice IS bands, and the voice has a place: the grains whose bin sits at the sung pitch's
// first three PARTIALS (voxHz, 2×, 3× on the 256-bin log axis) are LIFTED in the sung note's hue, and the rest of the cloud
// is scaled by (1 − DIM·w): the light is MOVED, never added — habit.js's rule, by a uniform factor rather than a pass. The
// lift's gain is normalised here, on the CPU, from the grains' own density over the axis (fx = .95·u^1.4, so the density in
// fx goes as fx^(−2/7)): the partials' expected share of the grains is p, EVERY grain gives up DIM·w (the shader's factor is
// 1 − DIM·w + gain·vk, the lifted ones included), so the band takes gain = DIM/p and the population mean of the factor is
// exactly 1 at every w — capped at GMAX where p is tiny. (§127 wrote DIM·(1 − p)/p, the budget of a band that is NOT dimmed:
// its mean was 1 − DIM·p = .994 at the hairline's p .024, inside the test's ±.02; at §138's p .085 and DIM .45 it read .957
// and the test caught it. The test's own factor() is the exact sum over the shader's hashed grains, and reads 1.000 now.)
// §138 — WHAT §127 GOT WRONG, measured on TheChain (§137: the shared gate lit on 100 % of the sung time, 7.7 % of the unsung —
// the signal was full and clean, DUST spent it thinly): W .0075 is a shell .009 scene units thick in a 1.7-unit galaxy, a
// HAIRLINE, and its only motion with the melody was RADIAL by a semitone's .011 units — invisible under a two-and-four kit
// whose kick, ring and sparkle drive every other number on screen. Now: (1) the window W is .03 (≈ three semitones' sigma —
// a BAND the eye can hold, ~9 % of the grains at E4, so the light the band takes is ×5–6 and never near the cap); (2) the
// cloud gives up DIM .45 — nearly half its light, the drums' flashes included, so the drums RECEDE under a sustained voice
// and come back within the gate's .3 s release; (3) the band's grains GROW (SZ, on the point size beside the kick's and the
// ring's terms); (4) THE VERTICAL: the pitch's height y01 (the gate's, eased .35 s — the rig's recipe, §121 "pitch seems more
// like a vertical move") moves the whole cloud by Y0·w·(y01 − ½) and the band by Y1 more on top, so the lit hoop floats up
// out of the body on a high note and sinks under it on a low one, riding every rise and fall of the line in every formation
// (the cloud's own axis is radial; §127 could put pitch-as-height in the ribbon alone — and had its sign wrong: the view's up
// is world −y, so §127's ribbon rose on screen for a LOW note; both rises are subtractions in the shader now). The fundamental's partials keep their
// hue but weigh less (A .5 / .25, was .6 / .4): one band moving, not three. Everything still comes through `vox()` — one
// shared gate, no second detector — and a frame at w 0 is bit for bit §127's.
// The RIBBON (formations.js shapeFor(): `!subGate && (denK < lone || voxSec > .5)` → RIBBON) is UNCHANGED, a bonus state:
// opening it on `w` alone would have put IBelongHere (68 % sung, four on the floor) on a line for most of the track and
// thrown the twenty sections of drum grammar away with the shapes; a seam decision stays a section decision. In the ribbon
// the line still rises with the pitch (RIBY) on top of the ride.
// w 0 (voxConf 0: the fake timeline, the traces) = today's bytes: the shader's voice blocks are skipped whole, the ribbon's
// lift is 0, shapeFor(MS, 0) is shapeFor(MS). `&dvox=0` (hooks.dvox) = the pre-§127 cloud on a voiced track too.
// Cost: one vec4 + one vec2 uniform (the slots §127 declared; the ride took uVox.w), ~14 ALU per vertex inside the blocks.
import { mkVox, vox } from '../../math/vox.js';
import { clamp, ema } from '../../math/util.js';

export const VOXD = {
  on: 1,        // hooks.dvox — the A/B switch (0 = the pre-§127 cloud on every frame)
  DIM: 0.45,    // the cloud gives up this much of its light at w 1 — the drums recede under the voice (§127: .25)
  GMAX: 8,      // the lifted grains' gain cap (p tiny = a pitch where few grains live; with W .03 the gain sits at 4–6 up to C6 — §127: 12)
  W: 0.03,      // the partial window's sigma on the 0..1 log axis — a BAND, ≈ 3 semitones (a semitone is .0092; §127: .0075, a hairline)
  A: [1, 0.5, 0.25],  // the three partials' weights — the fundamental leads (§127: 1, .6, .4)
  Y0: 0.6,      // §138 the RIDE: the whole cloud moves Y0·w·(y01 − ½) scene units up the sung pitch's height (±.3 over the range; a melody lives in ±.2 of y01, so ±.12)
  Y1: 1.6,      // ...and the lit band Y1·vk more on top of that: the hoop floats out of the body on a high note (±.3 more on a melody's ±.2, out of a 1.1-unit sphere)
  SZ: 1.2,      // §138 the band's grains grow by SZ·vk on the point-size sum (the kick's term is 1·kick, the ring's 3·ring)
  RIBY: 0.8,    // the ribbon's rise at the top of the voice's range, in WAVE units (the wave is ±1 → ±.75·(.4 + lvl) scene units; y01 .5 = where it sits today)
  SEC: 8,       // s: voxSec's window — w over a section
  LN: Math.log(16000 / 30),   // the spec axis: bin j is 30·(16000/30)^(j/256) Hz (synapse/analyzer.js)
};

const VX = mkVox();
export const OUT = { w: 0, pc: -1, y01: -1, rank: 0, gain: 0, hueT: 0, ribY: 0, sec: 0, p: 0, ride: 0 };

// where a frequency sits on the 0..1 log axis the grains sample (`fx` in the shader)
export const rankOf = (hz) => clamp(Math.log(hz / 30) / VOXD.LN, 0, 1);
// the grains' density over fx: u uniform on 0..1, fx = .95·u^1.4 → du/dfx = (1/1.4)·(fx/.95)^(1/1.4 − 1)/.95, 0 beyond .95
export const density = (fx) => (fx <= 0 || fx >= 0.95 ? 0 : (1 / 1.4) * Math.pow(fx / 0.95, 1 / 1.4 - 1) / 0.95);
// the partials' expected share of the grains: Σ a_k · ∫ exp(−((fx − f_k)/σ)²) ρ(fx) dfx ≈ Σ a_k · σ√π · ρ(f_k)
export function shareAt(rank) {
  let p = 0;
  for (let k = 0; k < 3; k++) p += VOXD.A[k] * VOXD.W * Math.sqrt(Math.PI) * density(rank + Math.log(k + 1) / VOXD.LN);
  return p;
}

// One frame. Returns OUT (reused): w, pc, y01, the sung pitch's rank, the lifted grains' gain, the note's palette t, the
// ribbon's rise, voxSec, and (§138) the ride w·(y01 − ½) the shader scales by Y0 / Y1. At w 0 every number the shader reads is
// 0 (the blocks are skipped) and sec decays.
export function voice(dt, MS) {
  const V = vox(VX, dt, MS);
  const w = VOXD.on ? V.w : 0, pc = w > 0 ? V.pc : -1;
  OUT.w = w; OUT.pc = pc; OUT.y01 = pc >= 0 ? V.y01 : -1;
  OUT.sec = MS.voxConf > 0 ? ema(OUT.sec, w, dt, VOXD.SEC) : 0;   // no read at all = no section memory either (the exact reset)
  if (OUT.sec < 1e-4) OUT.sec = 0;
  if (w > 0 && pc >= 0 && V.hz > 0) {
    OUT.rank = rankOf(V.hz);
    OUT.p = shareAt(OUT.rank);
    OUT.gain = Math.min(VOXD.GMAX, VOXD.DIM / Math.max(OUT.p, 1e-6));   // §138: DIM/p, not §127's DIM·(1 − p)/p — see the header
    OUT.hueT = pc / 12;
    OUT.ribY = w * (V.y01 - 0.5) * VOXD.RIBY;
    OUT.ride = w * (V.y01 - 0.5);
  } else { OUT.rank = 0; OUT.p = 0; OUT.gain = 0; OUT.hueT = 0; OUT.ribY = 0; OUT.ride = 0; if (pc < 0) OUT.w = 0; }
  return OUT;
}
