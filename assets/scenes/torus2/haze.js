// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// TORUS2 — the fog on the tongues (DECISIONS §79; docs/plans/TONGUES-PLAN.md phase 5). Ambiguity hazes the nest,
// resolution clears it: `tongueAmbig` (§76: 1 − the octave ladder's best depth, a 16-beat trailing window stepping once a
// clock beat) reads 0.95–0.98 through Vienna's dream (72–86 s), 0.25–0.35 on CyborgNinja, ≤ 0.69 anywhere on SeeYouDrop
// 20–110 s and ≤ 0.65 in Vienna's own grooves — so the LEVEL separates the dream from every groove in the set with a
// margin (the §78 lean of reading a change over bars does not apply here: SeeYouDrop's breakdown RISES 0.25 → 0.61 over
// 50–55 s, nearly the dream's own rise, and must not haze). The level is a dead zone to LO, full at HI, eased with a slow
// attack (the dream gathers) and a fast release (the beat returns), and the live drop's slam (`dropLiveEvt` — §77 arms
// the detector on this same ambiguity) clears it ON the drop: the trailing window itself takes ~3 beats to fall under LO
// after Vienna's 85.3 s, which the eye would read as the fog lagging the drop. After a slam the fog is held off until the
// window has fallen under LO (or 16 beats, the window's own length — if the ambiguity is still there a bar later, the
// music really is ambiguous and the fog is right to return). `tongueOn` 0 (warming) clears; −1 (`&tongues=0`) is the
// pre-tongues TORUS2 bit for bit: the haze stays exactly 0 and every shader term it touches is behind `if (uHaze > 0.0)`.
// v3's `dropEvt` is NOT the clear: with no track map it fires at 73.3 s on Vienna — inside the dream — and misses 85.3.
export const HAZE = {
  LO: 0.75,     // the dead zone: no fog under this ambiguity (SeeYouDrop's max over 20–110 s is 0.686, CyborgNinja's 0.367)
  HI: 0.95,     // full fog at this ambiguity (Vienna's dream reads 0.95–0.98)
  ATK: 1.5,     // s, the ease in: the dream gathers over a bar and a half
  REL: 0.4,     // s, the ease out: the beat's return, and the slam, clear it inside a beat
  HOLD: 16,     // beats a slam holds the fog off while the trailing window is still falling
  // what a full haze does to the picture — the shader reads these as #defines
  NEAR: 0.5,    // the near shell of the nest, in view depth / camera distance (1 − R/cam ≈ 0.54): the extra fog starts here
  FOGK: 0.6,    // beyond it the depth fog falls this much faster per unit depth: the far side sinks, the near strokes keep their light
  DEEP: 0.30,   // and its floor drops by this much (0.55 → 0.25: TORUS v1's wall was 0.32, here only in the dream)
  SAT: 0.45,    // the colours wash toward their own luminance by this much — the key's hue is still there, paler
  VEIL: 0.045,  // the black behind the nest lifts to this much of the mood palette's own colour: mist, not a void
  BLOOM: 0.15,  // the bloom threshold falls by this much (0.30 → 0.15): the mist scatters the light into soft halos
};

const S = { h: 0, held: 0, holdBeat: 0 };

// the smoothstep of the level: 0 under LO, 1 above HI (a pure function of MS, so it is the `haze` param's from())
export const level = (ambig, on) => {
  const x = Math.min(1, Math.max(0, (ambig - HAZE.LO) / (HAZE.HI - HAZE.LO)));
  return x * x * (3 - 2 * x) * (on === 1 ? 1 : 0);   // × 1.0 is exact; both fields are read on the defaults (CONTRACTS §1.16)
};

// per frame: the eased haze. `target` is env.params.haze (the level, or whatever is routed into it); the slam and the
// warming gate act on top of it. Returns the value draw() uploads.
export function step(dt, target, MS) {
  if (MS.tongueOn !== 1) { S.held = 0; target = 0; }
  else if (MS.dropLiveEvt) { S.held = 1; S.holdBeat = MS.beatCount; }
  if (S.held) {
    if (MS.tongueAmbig < HAZE.LO || MS.beatCount - S.holdBeat >= HAZE.HOLD) S.held = 0;
    else target = 0;
  }
  const tc = target > S.h ? HAZE.ATK : HAZE.REL;
  S.h += (target - S.h) * (1 - Math.exp(-dt / tc));
  if (S.h < 1e-4 && target === 0) S.h = 0;   // so the off path uploads an exact 0 and the shader takes its old branch
  return S.h;
}

export const haze = () => S.h;
export const held = () => S.held;

// the veil: the clear colour behind the nest — palM(0) of shaders.js mirrored (the mood's own hue, lum-mixed by its sat,
// times its bri), scaled by VEIL × haze. Exactly (0, 0, 0) while the haze is 0.
const TAU = Math.PI * 2;
export function veil(MOOD, h, out) {
  const k = HAZE.VEIL * h;
  const r = 0.5 + 0.5 * Math.cos(TAU * MOOD[0]), g = 0.5 + 0.5 * Math.cos(TAU * (MOOD[0] + 0.33)), b = 0.5 + 0.5 * Math.cos(TAU * (MOOD[0] + 0.67));
  const l = 0.3 * r + 0.59 * g + 0.11 * b, s = MOOD[1];
  out[0] = k * MOOD[2] * (l + (r - l) * s);
  out[1] = k * MOOD[2] * (l + (g - l) * s);
  out[2] = k * MOOD[2] * (l + (b - l) * s);
  return out;
}
