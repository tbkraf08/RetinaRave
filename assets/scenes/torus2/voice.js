// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// TORUS2 — the knot strand becomes the VOICE (DECISIONS §127; docs/plans/VOX-SCENES-PLAN.md §1 "TORUS2"). The knot is already
// "the melody traces the knot" (knotT off harmUnw, knotTh the loudest family's latitude, knotBri off intensity, its hue the
// loudest class's slot). While someone sings — `w` from the shared gate (math/vox.js: the knee .45 → .85 above the live
// tier's own gates, so a piano's false voice lights little) — three numbers blend by w and nothing else moves:
//   the strand's LATITUDE  → TH0 + THS · (LAT0 + LAT1 · y01): the sung pitch lifts the strand toward the equator — the nest's
//                             own vertical ("pitch seems more like a vertical move", §121), a glide (y01 is eased .35 s);
//   the strand's HUE       → the sung note's slot, pc / 12 − .5 + HUE, where the loudest class's slot sits today;
//   the strand's BRIGHTNESS × (1 + BRI · w);
//   and the sung class's family ring is LIT: ch[pc] = max(ch[pc], w) — its torus brightens; the other eleven keep theirs
//   (the floor keeps its ink; briMax and `loudest` are read before the lift, so the glow floor and the knot's family stand).
// w 0 = today's three lines to the byte: the gate returns w 0 / pc −1 on voxConf 0 (the fake timeline, the traces), so the
// fake s4 pair and every instrumental file-mode line hold. `&t2vox=0` (hooks.t2vox) = today's bytes on a voiced track too.
// Cost none: CPU numbers into uniforms that already exist (uKnotTh, uKnotBH, uChroma).
import { mkVox, vox } from '../../math/vox.js';

export const T2VOX = {
  on: 1,        // hooks.t2vox — the A/B switch (0 = the pre-§127 strand on every frame)
  LAT0: 0.35,   // the strand's latitude at the tonic's height (y01 0), as a fraction of THS
  LAT1: 0.5,    // ... plus this much at the top of the voice's range (y01 1): .35 → .85 of the way to the equator
  BRI: 0.6,     // the strand's brightness lift at w 1
  HUE: 0.09,    // the strand's hue offset from its family's slot (index.js's own + .09, kept)
};

const VX = mkVox();
export const OUT = { w: 0, pc: -1, y01: -1, th: 0, hue: 0, bri: 1 };

// One frame. `ch` is the scene's per-family chroma array (ch[pc] is lifted in place); `thLoud` the loudest family's latitude
// (the strand's base latitude before the collapse and the sub's swell, which index.js applies after), `knotBri0` / `hueSlot0`
// the strand's pre-voice brightness and hue slot. Returns OUT (reused every frame): at w 0 the three are the inputs, exactly.
export function voice(dt, MS, ch, TH0, THS, thLoud, knotBri0, hueSlot0) {
  const V = vox(VX, dt, MS);
  const w = T2VOX.on ? V.w : 0, pc = w > 0 ? V.pc : -1, y01 = pc >= 0 ? V.y01 : -1;
  OUT.w = w; OUT.pc = pc; OUT.y01 = y01;
  if (w > 0 && pc >= 0) {
    OUT.th = thLoud + ((TH0 + THS * (T2VOX.LAT0 + T2VOX.LAT1 * y01)) - thLoud) * w;
    OUT.hue = hueSlot0 + ((pc / 12 - 0.5 + T2VOX.HUE) - hueSlot0) * w;
    OUT.bri = knotBri0 * (1 + T2VOX.BRI * w);
    if (ch[pc] < w) ch[pc] = w;
  } else { OUT.th = thLoud; OUT.hue = hueSlot0; OUT.bri = knotBri0; }
  return OUT;
}
