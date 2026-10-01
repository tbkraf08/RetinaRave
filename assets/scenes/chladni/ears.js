// CHLADNI's EARS — everything that decides what the scene is allowed to hear, and the two pins that let a test lie
// to it. Split out of index.js in §74 (the file passed its 500-line cap); one subject, and update() still has one
// source for the ear block.
//
// The scene reads the ears ONCE per frame through `readEars`, so there is exactly one place that decides what a pin
// means. `#test`'s fake timeline never fills `subNote` / `subGate` / `subPure` / `tonic`, which is why the presets
// exist at all: a headless md5 or a montage says `&ears=1`.

import { NFIG } from '../../math/chladni.js';

const TONTC = 10.0;          // the TONIC is latched over a long window, because a change of tonic re-maps every figure
const TONMIN = 0.60;         // at once: SeeYouDrop's tonic wobbles C# -> A -> F# over 18-25 s and this holds it at C#
const TONMARG = 3.0;         // (the truth's hypothesis) through the whole track. It is not latched at all until TONMIN
                             // evidence has come in — otherwise the FIRST frame with any tonic wins and TONMARG then
                             // defends it — and a challenger must beat the sitting tonic by TONMARG.
const KEYC = 0.25;           // below this tonicConf the old `key` is used instead of `tonic` (Appendix A's fallback)

// The ear block the scene actually reads. `p` = the preset, −1 = the real ears.
export const EARS = { note: -1, cents: 0, conf: 0, pure: 1, gate: 0, sub: 0, bass: 0, eG: 0, reg: 0, tonic: 0, minor: 1, tconf: 0 };
export const PRESETS = [
  { note: 1, cents: 0, conf: 1, pure: 1, gate: 1, sub: 0.85, bass: 0.8, eG: 0.8, reg: 0, tonic: 1, minor: 1, tconf: 1 },   // 1: the groove — a pure 808 on the tonic
  { note: 1, cents: 0, conf: 1, pure: 0.1, gate: 1, sub: 0.8, bass: 0.8, eG: 0.7, reg: 1, tonic: 1, minor: 1, tconf: 1 },  // 2: the intro — a harmonic mid-bass, overhead
  { note: -1, cents: 0, conf: 0, pure: 1, gate: 0, sub: 0, bass: 0, eG: 0.25, reg: 0.5, tonic: 1, minor: 1, tconf: 1 },  // 3: the void — no sub at all
];

// The two pins, and the hooks that set them. PINS.fig is the fractional interval (0..12, fractional allowed) so a
// montage compares FIGURES and not music; PINS.ears names a preset above.
export const PINS = { fig: -1, ears: -1 };

export function figure(v) {
  PINS.fig = v === null || v === undefined || +v < 0 ? -1 : +v % NFIG;
  return PINS.fig;
}

export function ears(v) {
  PINS.ears = v === null || v === undefined || +v < 1 ? -1 : Math.min(PRESETS.length, +v | 0);
  return PINS.ears;
}

// `sc` is the scene: it owns the tonic's vote (`tvote`), the latched tonic (`ton`) and the step (`lastDt`), because
// those are per-instance state and this module is shared.
export function readEars(sc, MS) {
  const P = PINS.ears > 0 ? PRESETS[PINS.ears - 1] : null;
  if (P) {
    Object.assign(EARS, P);
    return EARS;
  }
  EARS.note = MS.subNote | 0;
  EARS.cents = MS.subCents;
  EARS.conf = MS.subConf;
  EARS.pure = MS.subPure;
  EARS.gate = MS.subGate;
  EARS.sub = MS.sub;
  EARS.bass = MS.bass;
  EARS.eG = MS.eG;
  EARS.reg = MS.bassReg;
  // the tonic, latched: a raw reading feeds a slow vote, and a challenger must beat the sitting tonic by TONMARG
  const T = sc.tvote, dec = Math.exp(-sc.lastDt / TONTC);
  for (let k = 0; k < NFIG; k++) T[k] *= dec;
  if (MS.tonic >= 0) T[MS.tonic | 0] += sc.lastDt * Math.max(0.05, MS.tonicConf);
  let bt = 0;
  for (let k = 1; k < NFIG; k++) if (T[k] > T[bt]) bt = k;
  if (T[bt] > TONMIN && (sc.ton < 0 || (bt !== sc.ton && T[bt] > TONMARG * T[sc.ton]))) sc.ton = bt;
  EARS.tonic = sc.ton >= 0 ? sc.ton : MS.tonic >= 0 ? MS.tonic | 0 : MS.keyConf > KEYC ? MS.key | 0 : 0;
  EARS.minor = MS.tonic >= 0 ? MS.tonicMinor | 0 : MS.mode | 0;
  EARS.tconf = MS.tonic >= 0 ? MS.tonicConf : MS.keyConf;
  return EARS;
}
