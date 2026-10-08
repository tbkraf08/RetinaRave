// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// NAV2's legibility pass — exposure and colour (DECISIONS §99, 2026-10-08; docs/plans/NAV2-RETUNE-PLAN.md step 1). The three
// brightness terms nav-review §3 named, each behind its own knob so the user can A/B one at a time on id 8 (id 0 is the
// old look whole): the exposure KNEE (`K2.lum`, uLum / uExtG — the old NAV2 pass-6 knee, back), the SMOULDER on true
// loudness instead of the root (`K2.smo`, uSmo: baseLight() of §63 through loudlight.js, the par window widened to a
// gradient and its gain capped), the boundary FLASH on the snare lane with less white (`K2.fl`, uFl), and COLOUR ON KEY
// (`K2.key`: the key hue of keycolour.js — the recipe TORUS2 / GIELIS use — with a step per phrase instead of the drift).
// Pure state + numbers: no GL. index.js uploads what is here; the shader's rest (every knob 0) is NAV's bytes.
import { mix, sstep, ema, frac } from '../../math/util.js';
import { mkAnchor, WARM, COOL, PULL, wrap } from '../../math/keycolour.js';
import { baseLight } from '../../math/loudlight.js';

// the knobs: &n2lum=0 (knee off) · &n2smo=0 (the old par² smoulder) · &n2fl=0 (the old flash) · &n2ext=0 (no exterior dim) · &n2key=0 (the old hue drift)
export const K2 = { lum: 1, smo: 1, fl: 1, ext: 1, key: 1 };
// The numbers are §99's sweep (DECISIONS §99, `tools/lumtrace.js --x=` one run per setting on the long runs' own frames): the
// old NAV2 pass-6 knee (0.2, 3) with its .35 exterior dim read the loudest rows DARKEST (SeeYouDrop 40-45 medY .102 against the
// baseline's .318, CyborgNinja's post-drop dust .059 against .213) — a dim keeps a flat wash flat, only darker; what reads is a
// gentle knee, no dim, and the halo's reach narrowed a little while c is outside the set.
export const LUM_IN = [0.3, 1.5];    // uLum.xy: the interior's luminance knee (L0, K): col /= 1 + K·max(0, L − L0)
export const LUM_EX = [0.45, 1.5];   // uLum.zw: the exterior's — it only takes the top off the dust / flash wash (clipMx .176 → .002)
export const EXT = { GAIN: 1, SHARP: 1.5, TAU: 0.5 };   // outside the set (the drop's dust: every pixel is near the Cantor dust,
                                     // the halo term is 1 everywhere) the exterior's gain eases to GAIN (uExtG; 1 = no dim) and the
                                     // halo's reach 1/(1 + .011 e) narrows to 1/(1 + .011 e · SHARP) (uExtK) over TAU s. SHARP 4
                                     // halved the dust's light (halo² .28 against .67 at 20 px); 1.5 keeps its edges and its glow
export const SMO = { LO: 0.12, HI: 0.4, R0: 0.5, R1: 0.98 };   // the smoulder's gain LO..HI on the base light; its ρ window
export const FL = { WHITE: 0.15, ON: 0.3, HIT: 0.4, TAU: 0.14 };   // the flash: white share (was .4), always-on, snare gain, decay
export const STEP = 1 / 12;          // the per-phrase hue step: a twelfth of a turn = one fifth on the wheel, the key's neighbours
const STEPS = [0, 1, 0, -1];         // the walk: key, dominant side, key, subdominant side — back on the key every other phrase

const A = mkAnchor();
export const L2 = {
  hueT: 0,    // the hue index.js puts in uPal.x / uTint / the dots / the PiP (hsv convention: .33 green, like LOOK.hueT)
  base: 1,    // baseLight(): the track's own loudness ladder, 0..1
  smo: 0,     // the smoulder's gain this frame (the shader multiplies by (.3 + .7 bands))
  extG: 1,    // uExtG
  extK: 1,    // uExtK
  fl: 0,      // the snare flash envelope (snareAmp on snareEvt, decaying over FL.TAU)
  off: 0,     // the eased phrase step, in turns
  phr: 0,     // phrases counted (wraps of phrase16Pos)
  lastPos: 0,
  key: 0, mode: 0, conf: 0,   // the anchor's read-back for the hud / n2info
  pin: null,  // hooks.key: {k, m} or null
};

export function reset2() {
  A.reset();
  L2.hueT = 0; L2.base = 1; L2.smo = 0; L2.extG = 1; L2.extK = 1; L2.fl = 0; L2.off = 0; L2.phr = 0; L2.lastPos = 0;
}

// The knobs as hooks (&n2lum= &n2smo= &n2fl= &n2ext= &n2key= on #test): '0' turns a term off (the old NAV path), '1' / empty
// turns it on, and a comma list sets its numbers AND turns it on — so a sweep is one URL per setting:
//   n2lum=L0,K[,L0x,Kx] (the interior knee, then the exterior's) · n2smo=LO,HI[,R0,R1] · n2fl=WHITE,ON,HIT · n2ext=GAIN,SHARP[,TAU]
export function knob(name, v) {
  const nums = String(v === undefined ? '' : v).split(',').map(Number);
  const on = v === '0' || v === 0 ? 0 : 1;
  if (name === 'key' || nums.length < 2 || nums.some((x) => !isFinite(x))) { K2[name] = on; return K2[name]; }
  K2[name] = 1;
  if (name === 'lum') { LUM_IN[0] = nums[0]; LUM_IN[1] = nums[1]; if (nums.length >= 4) { LUM_EX[0] = nums[2]; LUM_EX[1] = nums[3]; } }
  if (name === 'smo') { SMO.LO = nums[0]; SMO.HI = nums[1]; if (nums.length >= 4) { SMO.R0 = nums[2]; SMO.R1 = nums[3]; } }
  if (name === 'fl') { FL.WHITE = nums[0]; FL.ON = nums[1]; if (nums.length >= 3) FL.HIT = nums[2]; }
  if (name === 'ext') { EXT.GAIN = nums[0]; EXT.SHARP = nums[1]; if (nums.length >= 3) EXT.TAU = nums[2]; }
  return nums;
}

// hooks.key(k[, m]): pin the key (keyConf 1) inside the scene — &key=7 on #test, as TORUS2 / GIELIS; -1 or empty releases
export function pinKey(k, m) {
  L2.pin = k === null || k === undefined || k === '' || k < 0 ? null : { k: ((k | 0) % 12 + 12) % 12, m: (m | 0) ? 1 : 0 };
  return JSON.stringify(L2.pin);
}

// Once per update(), after updateNav: S is MS, N the navigator, LOOK the engine's palette (its hueT is the old drift).
export function update2(dt, S, N, LOOK) {
  // the smoulder: the base light is the track's own loudness (fallback eS when the loudness stage is off, &loud=0), the
  // ρ window a gradient .5 → .98 instead of the .8 → .98 step that only lit at the root; outside INT the navigator's own
  // par (the bridge's 1 − t, a baby's window) stands in. Gain .12 → .3 on the base light against the old .35 + .3 bass
  L2.base = baseLight(S.loudRel, S.loudRange, S.loudAbs, S.eS);
  const rho = N.cyc.has ? Math.exp(N.cyc.lnr) : 0;
  const pw = N.mode === 'INT' && N.cyc.has ? sstep(SMO.R0, SMO.R1, rho) : N.par;
  L2.smo = mix(SMO.LO, SMO.HI, L2.base) * pw;
  // the exterior's dim and the halo's narrowing while c is outside the set (K2.ext off: both rest at 1, an exact identity)
  const out = N.mode !== 'INT' && K2.ext;
  L2.extG = ema(L2.extG, out ? EXT.GAIN : 1, dt, EXT.TAU);
  L2.extK = ema(L2.extK, out ? EXT.SHARP : 1, dt, EXT.TAU);
  // the flash rides the snare lane: the ears' event places it, snareAmp (§70, held between hits) sizes it
  L2.fl = Math.max(L2.fl * Math.exp(-dt / FL.TAU), S.snareEvt ? (S.snareAmp || 0) : 0);
  // colour on key: the anchor (circle of fifths, mode pull, per-bar shade, keyConf gate — keycolour.js) with the OLD drift as
  // the mood hue it slides back to when the key is not trusted. keycolour's hue is palM's cosine convention (.67 green);
  // NAV's pal()/uTint are hsv's (.33 green) — the mirror image, so hueT = −hue keeps one key one colour across scenes.
  const old = LOOK && isFinite(LOOK.hueT) ? LOOK.hueT : 0;
  const pos = S.phrase16Pos || 0;
  if (pos < L2.lastPos - 8) L2.phr++;   // the 16-beat wrap: one step along the walk
  L2.lastPos = pos;
  const bpm = S.bpm > 40 ? S.bpm : 124;
  L2.off = ema(L2.off, STEPS[L2.phr & 3] * STEP, dt, 60 / bpm / 3);   // settles in ~a beat
  const a = A.anchor(dt, S.key | 0, S.mode | 0, S.keyConf || 0, isFinite(S.valence) ? S.valence : 0.5, S.harmAngle || 0, frac(-old), L2.pin, S.modeShade || 0);
  L2.key = a.key; L2.mode = a.mode; L2.conf = a.conf;
  L2.hueT = K2.key ? frac(-(a.hue + a.conf * L2.off)) : old;
}

// which hsv hue a key lands on at rest (no shade, valence .5): the §99 table of "which keys are green"
export function keyHue(k, m) {
  const hueKey = ((7 * k) % 12) / 12;
  return frac(-(hueKey + PULL * wrap((m ? COOL : WARM) - hueKey)));
}
