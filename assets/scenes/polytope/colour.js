// POLYTOPE — the cage as a colour wheel that turns with the key (brief-polytope-dance spec 5; the user: "I liked
// color tied to circle of fifths"). The anchor maths is TORUS2's, shared through assets/math/keycolour.js.
//
// THE WHEEL. A vertex's angle in the xy plane AFTER the double rotation — the plane the bass drives — is quantised
// to twelve sectors, and sector k is pitch class (7k) mod 12: the circle of fifths laid round the figure, so
// neighbouring sectors are related keys and a modulation to the dominant slides the whole painting by one sector.
// The twelve hues sit at `anchor + spread·(k/12 − ½)`, with `spread` narrowed to 0.30–0.75 and CENTRED on the
// anchor exactly as TORUS2 narrowed it (a full-rainbow spread lets no warm/cool bias read — DECISIONS §36). Because
// the sectors live in the xy plane and the xy plane is what the bass nudges, the wheel ROLLS with the groove.
//
// CONTINUITY. Twelve hard sectors would step a vertex's hue by spread/12 the moment it crosses a boundary, and a
// step is what `cuts: 'continuous'` forbids. The hues are not interpolated (a narrowed wheel has no short way from
// sector 11 back to sector 0 — that is the seam every non-rainbow wheel has); instead the two neighbouring sectors'
// COLOURS are cross-faded in RGB across the last SECB of a sector, which passes through a slight desaturation
// rather than through five sixths of the hue wheel. Nothing jumps and the twelve sectors still read as twelve.
//
// CHROMA lights the sounding notes: a sector's brightness is `glow + (1 − glow)·chroma[pc]`, eased over ~CHTC, so a
// chord glows in three places and a melody walks round the wheel. On #test every chroma bin is zero (DECISIONS §36),
// so the same fallback TORUS2 uses is folded in: pitch class k sits at 2π(7k mod 12)/12 on the circle of fifths and
// is weighted by how close it is to `harmAngle`, blended in continuously by how much energy the real vector carries.
//
// The INNER figure wears the anchor wheel and the OUTER one the same wheel a fifth away (one twelfth of a turn of
// hue), so the two figures are always in a related key — the v0.2 look's `ta` 0.15 / 0.55 split, given a meaning.

import { mkAnchor, sectorPc } from '../../math/keycolour.js';

const TAU = Math.PI * 2;

// --- the manual settings (a named constant at the top, never a magic number below) ---
export const SECN = 12;        // sectors round the xy plane — the twelve pitch classes, and not negotiable
export const SECB = 0.3;       // fraction of a sector spent cross-fading into the next one (the continuity blend)
export const SPREAD0 = 0.30;   // the narrowed spread, TORUS2's: 0.30 at mood.spread 0 …
export const SPREAD1 = 0.45;   // … rising to 0.75 at mood.spread 1, centred on the anchor
export const CHTC = 0.15;      // seconds: how fast a sector's brightness follows the chroma
export const FIFTH = 1 / 12;   // the outer figure's hue offset: one twelfth of a turn = the dominant
export const CHMIN = 0.02;     // below this peak the chroma vector carries nothing and harmAngle stands in
// The saturation law is POLYTOPE's own (`ctx.hsv(hue, mood.sat, v)`), not TORUS2's `0.35 + 0.65·mood.sat`: that
// floor was written for a scene whose fibres are spatially separated by pitch class. All the mode does is lift or
// drop it (SATMAJ / SATMIN from keycolour.js). Honest note: restoring this law did NOT move the pale-picture
// measurement on the loud demos (see the report's friction log — the twelve-hue wheel concentrates the light into
// the few LIT sectors and their bloom halos stack toward white there). GLOW0, SPREAD0/SPREAD1 and index.js's PBRI
// are the knobs if the user finds it pale; the deterministic #test frames measure 0.63-0.80 saturation.

const A = mkAnchor();          // POLYTOPE's own anchor state — never TORUS2's (see keycolour.js)
const CH = new Float32Array(SECN);     // the eased chroma, by pitch class
const IMP = new Float32Array(SECN);
export const IN = new Float32Array(SECN * 3);    // the inner figure's twelve sector colours, premultiplied
export const OUT = new Float32Array(SECN * 3);   // … the outer figure's, a fifth away
export const LIVE = { key: 0, mode: 0, hue: 0, sat: 1, spread: 0.5, lit: 0 };

let keyPin = null;             // hooks.key(k, mode)
let chPin = null;              // hooks.chroma([...12])

export function reset() {
  A.reset();
  CH.fill(0);
  keyPin = null;
  chPin = null;
}

// test hook: pin key / mode inside our own update — MS is never written (CONTRACTS: scenes read MS). Two arguments,
// so it is reached as CARD.REG[5].scene.hooks.key(0, 0) in an eval, never as &key= (CONTRACTS §1.4, v0.7).
export function key(k, m) {
  keyPin = k === null || k === undefined || k < 0 ? null : { k: ((k | 0) % SECN + SECN) % SECN, m: (m | 0) ? 1 : 0 };
  return JSON.stringify(keyPin);
}

// test hook: pin the twelve chroma bins (null releases), so a shot can show a named chord
export function chroma(v) {
  chPin = Array.isArray(v) && v.length === SECN ? Float32Array.from(v, (x) => Math.max(0, Math.min(1, +x || 0))) : null;
  return JSON.stringify(chPin ? Array.from(chPin) : null);
}

// One frame. S is everything read from MS, `mood` is LOOK.mood, `hsv` is ctx.hsv, `glow` the parameter, `bright`
// today's brightness law. Fills IN and OUT with twelve premultiplied RGB triples each.
export function step(dt, S, mood, hsv, glow, bright) {
  const An = A.anchor(dt, S.key, S.mode, S.keyConf, S.valence, S.harmAngle, mood.hue, keyPin, S.modeShade);
  const spread = SPREAD0 + SPREAD1 * mood.spread;
  const sat = Math.min(1.2, mood.sat * An.sat);
  const v = 0.55 + 0.45 * mood.bri;
  // the chroma vector, with TORUS2's harmAngle fallback blended in by how much energy the real one carries
  const C = chPin || S.chroma;
  let sum = 0, mx = 0;
  for (let k = 0; k < SECN; k++) {
    const c = Math.max(0, C[k] || 0);
    sum += c;
    if (c > mx) mx = c;
  }
  const w = mx < CHMIN ? 0 : Math.min(1, 2 * sum);
  const nrm = 1 / Math.max(0.2, mx);
  for (let k = 0; k < SECN; k++) {
    const fifth = (((7 * k) % SECN) / SECN) * TAU;
    IMP[k] = Math.pow(0.5 + 0.5 * Math.cos(S.harmAngle - fifth), 2);
  }
  const e = 1 - Math.exp(-dt / CHTC);
  let lit = 0;
  for (let k = 0; k < SECN; k++) {
    const tgt = Math.min(1, w * Math.max(0, C[k] || 0) * nrm + (1 - w) * IMP[k]);
    CH[k] += (tgt - CH[k]) * e;
    if (CH[k] > 0.5) lit++;
  }
  // the twelve sector colours: hue from the wheel, brightness from the pitch class that sector carries
  for (let k = 0; k < SECN; k++) {
    const pc = sectorPc(k);
    const b = bright * (glow + (1 - glow) * CH[pc]);
    const h = An.hue + spread * (k / SECN - 0.5);
    const ci = hsv(h, sat, v);
    const co = hsv(h + FIFTH, sat, v);
    IN[k * 3] = ci[0] * b;
    IN[k * 3 + 1] = ci[1] * b;
    IN[k * 3 + 2] = ci[2] * b;
    OUT[k * 3] = co[0] * b;
    OUT[k * 3 + 1] = co[1] * b;
    OUT[k * 3 + 2] = co[2] * b;
  }
  LIVE.key = An.key;
  LIVE.mode = An.mode;
  LIVE.hue = An.hue;
  LIVE.sat = sat;
  LIVE.spread = spread;
  LIVE.lit = lit;
  return LIVE;
}

export function info() {
  return {
    key: LIVE.key, mode: LIVE.mode, hue: +LIVE.hue.toFixed(4), sat: +LIVE.sat.toFixed(3), spread: +LIVE.spread.toFixed(3),
    lit: LIVE.lit, pinKey: keyPin, pinChroma: !!chPin,
    ch: Array.from(CH, (x) => +x.toFixed(3)),
    sectors: Array.from({ length: SECN }, (_, k) => sectorPc(k)),
  };
}
