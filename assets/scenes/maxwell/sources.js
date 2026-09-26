// MAXWELL — the sources: where the field comes from. Pure arithmetic, no GL, no DOM (node-importable).
//
// Gauss's law is the twelve charges: sector k of the circle of fifths sits at angle 2*pi*k/12 on a ring and carries
// pitch class (7k mod 12) (assets/math/keycolour.js's own convention), its charge proportional to that pitch class's
// chroma. A charge OSCILLATES at the carrier frequency, which bpm sets — so the wavelength follows the tempo — and
// radiates. Ampere-Maxwell is the bass: a kick is a z-current pulse at the centre (a ring of B expanding at c) and
// `sub` sets a standing current there.
//
// Rhythm becomes geometry because every hit is a real launch: the last SLOTS launch STEP COUNTS per band are kept
// (TORUS2's waves.js ring buffer, in substeps instead of beats because the field's clock is the substep), and the
// wave equation does the rest. A launch's envelope is a Ricker pulse — (1 - x^2) e^{-x^2/2}, zero mean, so it
// radiates a clean shell instead of a monopole that cannot get away — of a width fixed in GRID HEIGHTS, so the ring
// is the same thickness at every tier. Four kicks a beat apart therefore leave four shells whose spacing is
// S * (substeps per beat); a syncopated bass leaves them uneven. hooks.train() reads those spacings back as numbers.
//
// The launch step is FRACTIONAL: a train pinned to beat t is launched at (the current step) minus the lateness of the
// frame that noticed it, so the spacings are the pattern's and not the frame grid's.
import { COURANT } from './fdtd.js';

export const BANDS = 3;        // 0 kick (the centre current) · 1 snare (the loudest sector) · 2 hat (all twelve)
export const SLOTS = 8;        // the last 8 launches per band
export const HI = 0.45;        // a rising edge: over HI having been under LO. #test sets hat to EXACTLY 0.5, so a
export const LO = 0.25;        // threshold of 0.5 would never fire (HARNESS "Pitfalls").
export const FAINT = 0.30;     // the `beat` event's own faint kick when no band hit came in the last beat
export const LAM0 = 0.155;     // the carrier's wavelength in GRID HEIGHTS at 120 bpm (~6 waves across the plane).
                               // At 0.09 (11 waves) twelve sources interfering read as speckle, not as waves.
export const BPM0 = 120;
export const LAMLO = 0.035;    // the wavelength is never shorter than this (the grid must resolve it)
export const TSIGH = 0.022;    // a launch's ring thickness, in grid heights
export const TPKS = 2.6;       // the pulse peaks this many sigmas after its launch step
export const LIFES = 3.2;      // ... and the slot is live until this many sigmas past the peak
export const CHG = 0.0075;     // per-substep Ez a charge adds at chroma 1 and params.charge 1. A continuous source
                               // in a low-loss cavity integrates: the steady state is the source rate over the loss
                               // rate, so this is ~8x smaller than the first guess (which saturated the picture flat).
export const KICKA = 0.14;     // the centre current's pulse amplitude
export const SNAREA = 0.11;    // the loudest sector's sharp pulse
export const HATA = 0.025;     // the hats' tiny launches on all twelve
export const SHIM = 0.0045;    // the hats' CONTINUOUS shimmer amplitude
export const SHIMM = 3.0;      // ... at this multiple of the carrier frequency
export const SUBK = 0.004;     // the standing current: sub bass at the centre
export const DIPA = 0.030;     // the dipole pair's current amplitude
export const DIPR = 0.40;      // ... its resting share, so the dipole is lit between nudges
export const DIPK = 2.2;       // ... and how much a nudge's angular velocity adds to it
export const RING = 0.34;      // the charges' ring radius in grid heights (inside the cavity, outside the lens)
export const PSK = 0.40;       // how far flowBass/Mid/High drift the three families' phases
export const RSWEEP = 0.45;    // roll / riser sweep the carrier up by this fraction and the drop snaps it back
export const PAT = { '4': [0, 1, 2, 3], synco: [0, 1.5, 2, 3.5] };

// --- state -------------------------------------------------------------------------------------------------------
const AT = new Float64Array(BANDS * SLOTS);    // launch step per slot (-1e18 = never used)
const AM = new Float64Array(BANDS * SLOTS);    // amplitude at launch
const AW = new Int32Array(BANDS * SLOTS);      // which sector it was launched on (band 1)
const WR = new Int32Array(BANDS);              // next slot to write per band
const PREV = new Float64Array(BANDS);          // last frame's level per band, for the edge detector
export const CX = new Float32Array(12);        // the charges in CELLS (the shader's own coordinates)
export const CY = new Float32Array(12);
export const CA = new Float32Array(12);        // ... and their Ez amplitude this substep
export const W12 = new Float32Array(12);       // the twelve weights (chroma, or the harmAngle fallback)
const FAM = new Float32Array(3);               // the three families' phase drifts
export const OUT = { j: 0, dj: 0, dx: 1, dy: 0, step: 0, sig: 8, lam: 24, spb: 100 };

let mode = null, sched = -1e18, lastHit = -1e18, step = 0;
let ph = 0, dph = 0;           // the carrier's phase and its per-substep increment
let g = { amp: 1, hat: 0, sub: 0, loud: 0, dip: 0, pol: 1, shim: 0 };

export function reset() {
  AT.fill(-1e18);
  AM.fill(0);
  AW.fill(0);
  WR.fill(0);
  PREV.fill(0);
  CA.fill(0);
  lastHit = -1e18;
  sched = -1e18;
  step = 0;
  ph = 0;
  OUT.j = OUT.dj = 0;
  OUT.step = 0;
}
reset();

// hooks.train('4' | 'synco' | null): pin the launches to a pattern on the fake clock, edge detector off.
export function train(v) {
  mode = v === '4' || v === '4x4' ? '4' : v === 'synco' || v === 'sync' ? 'synco' : null;
  reset();
  return mode;
}
export const trainMode = () => mode;
export const stepNow = () => step;

export function launch(band, atStep, amp, sector) {
  const i = band * SLOTS + WR[band];
  AT[i] = atStep;
  AM[i] = amp;
  AW[i] = sector | 0;
  WR[band] = (WR[band] + 1) % SLOTS;
  lastHit = Math.max(lastHit, atStep);
}

// The Ricker envelope of a launch, as a function of its age in substeps.
export function env(age, sig) {
  const x = (age - TPKS * sig) / sig;
  if (x < -TPKS || x > LIFES) return 0;
  return (1 - x * x) * Math.exp(-0.5 * x * x);
}

// One frame of bookkeeping. Called from update() before the substeps run.
//   sub   substeps this frame · gh the grid height in cells · cx, cy the grid centre in cells
//   lev   [kick, snare, hat] · beatNow beatCount + beatPhase · beatEvt MS.beat
//   p     {amp, hat, sub, loud, bpm, dt, sweep, dip, pol, shim, fam:[b,m,h], yawRate}
export function frame(sub, gh, cx, cy, lev, beatNow, beatEvt, p) {
  const sig = Math.max(2, TSIGH * gh / COURANT);
  const spb = sub * (60 / Math.max(40, p.bpm)) / Math.max(1e-4, p.dt);
  let lam = Math.max(LAMLO * gh, LAM0 * gh * BPM0 / Math.max(40, p.bpm) / (1 + RSWEEP * p.sweep));
  // regularity LOCKS the carrier to the grid: a steady rhythm pulls the wavelength to the nearest exact fraction of
  // the distance light covers in one beat, so the wavefronts and the rings line up and the plane reads as standing;
  // an unsteady one lets the carrier sit where the tempo put it.
  const travel = spb * COURANT;
  const nw = Math.max(1, Math.round(travel / lam));
  lam += (travel / nw - lam) * Math.max(0, Math.min(1, p.reg || 0));
  OUT.sig = sig;
  OUT.lam = lam;
  OUT.spb = spb;
  dph = 2 * Math.PI * COURANT / lam;
  g = p;
  for (let k = 0; k < 12; k++) {
    const a = 2 * Math.PI * k / 12;
    CX[k] = cx + RING * gh * Math.cos(a);
    CY[k] = cy + RING * gh * Math.sin(a);
  }
  FAM[0] = PSK * p.fam[0];
  FAM[1] = PSK * p.fam[1];
  FAM[2] = PSK * p.fam[2];
  if (mode) {
    const P = PAT[mode], bar = Math.floor(beatNow / 4);
    for (let b = bar - 1; b <= bar; b++) {
      for (let j = 0; j < P.length; j++) {
        const t = b * 4 + P[j];
        if (t <= beatNow && t > sched) { launch(0, step - (beatNow - t) * spb, 1, -1); sched = t; }
      }
    }
    return;
  }
  for (let b = 0; b < BANDS; b++) {
    const x = lev[b];
    if (x > HI && PREV[b] < LO) launch(b, step, Math.min(1, x), p.loud);
    PREV[b] = x;
  }
  if (beatEvt && step - lastHit > 0.9 * spb) launch(0, step, FAINT, -1);
}

// One substep: fill CA / OUT.j / OUT.mx / OUT.my for this substep and advance the clocks.
export function substep() {
  const sig = OUT.sig;
  let jc = SUBK * g.sub * Math.sin(ph);
  for (let k = 0; k < 12; k++) {
    const pc = (7 * k) % 12;
    const f = FAM[(pc / 4) | 0];
    let a = CHG * g.amp * W12[k] * Math.sin(ph + f + 0.37 * k);
    a += SHIM * g.shim * W12[k] * Math.sin(SHIMM * ph + 1.7 * k);
    CA[k] = a;
  }
  for (let b = 0; b < BANDS; b++) {
    for (let s = 0; s < SLOTS; s++) {
      const i = b * SLOTS + s;
      if (AT[i] < -1e17) continue;
      const e = env(step - AT[i], sig);
      if (e === 0) continue;
      const v = e * AM[i];
      if (b === 0) jc += KICKA * v;
      else if (b === 1) CA[AW[i] % 12] += SNAREA * v;
      else for (let k = 0; k < 12; k++) CA[k] += HATA * v;
    }
  }
  OUT.j = jc;
  // The dipole: a pair of antiparallel currents whose AXIS is the eased nudge, oscillating at the carrier. Its
  // current carries a resting share plus the nudge's own angular velocity, so the two lobes glow between beats and
  // flare on the beat the dipole turns. surpriseEvt flips its polarity (g.pol) for one frame's worth of source.
  OUT.dj = DIPA * g.pol * (DIPR + DIPK * Math.abs(g.yawRate)) * Math.sin(ph);
  OUT.dx = Math.cos(g.yaw);
  OUT.dy = Math.sin(g.yaw);
  ph += dph;
  if (ph > 1e6) ph -= 1e6;
  step++;
  OUT.step = step;
}

// The live launches of one band as {age in substeps, radius in cells}: the ring geometry, read as numbers.
export function rings(band) {
  const out = [];
  for (let s = 0; s < SLOTS; s++) {
    const i = band * SLOTS + s, age = step - AT[i];
    if (AT[i] < -1e17 || age < 0) continue;
    const r = (age - TPKS * OUT.sig) * COURANT;
    if (r < -2) continue;
    out.push(+r.toFixed(3));
  }
  return out.sort((a, b) => a - b);
}

// The spacings between consecutive live rings of a band, in cells — the proof that the rhythm is the geometry.
export function spacings(band) {
  const r = rings(band), out = [];
  for (let i = 1; i < r.length; i++) out.push(+(r[i] - r[i - 1]).toFixed(3));
  return out;
}

export function info() {
  return { mode, step, sig: +OUT.sig.toFixed(2), lam: +OUT.lam.toFixed(2), spb: +OUT.spb.toFixed(2), ph: +(ph % (2 * Math.PI)).toFixed(3), j: +OUT.j.toFixed(4), dip: [+OUT.dj.toFixed(4), +OUT.dx.toFixed(3), +OUT.dy.toFixed(3)], kick: rings(0), snare: rings(1), hat: rings(2), space: spacings(0) };
}
