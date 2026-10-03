// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// MAXWELL — the sources: where the field comes from. Pure arithmetic, no GL, no DOM (node-importable).
//
// v0.12, the user's own sentence — "no sound -> quiet (ie. wave not generated)". **THERE IS NO CARRIER.** Nothing in
// this module oscillates because the music is playing. Every source is a LAUNCH, and a launch happens because
// something HIT; between hits the field has no source term at all, so a lit room with no sound in it is black.
// (v0.10/v0.11 radiated a continuous carrier from all twelve charges, the dipole and the sub's standing current at
// one wavelength the whole time the music played — the steady train the user saw, which had nothing to do with any
// sound — and the `beat` event launched a faint ring when no band had hit, a metronome. Both are gone.)
//
// Gauss's law is still the twelve charges: sector k of the circle of fifths sits at angle 2*pi*k/12 on a ring and
// carries pitch class (7k mod 12) (assets/math/keycolour.js's convention), and the chroma still says how brightly
// each one GLOWS — but a charge only radiates when a launch is placed on it. Ampere-Maxwell is the centre: a kick is
// a z-current pulse there (a ring of B expanding at c), and the dipole is a pair of antiparallel currents whose axis
// is the beat nudge — it too radiates only through a launch routed into it.
//
// Rhythm becomes geometry because every hit is a real launch: the last NSLOT launch STEP COUNTS are kept in one
// shared ring buffer (TORUS2's waves.js, in substeps instead of beats because the field's clock is the substep), and
// the wave equation does the rest. A launch's envelope is a Ricker pulse — (1 - x^2) e^{-x^2/2}, zero mean, so it
// radiates a clean shell instead of a monopole that cannot get away — of a width fixed in GRID HEIGHTS, so the ring
// is the same thickness at every tier. Four kicks a beat apart therefore leave four shells whose spacing is
// S * (substeps per beat); a syncopated bass leaves them uneven. hooks.train() reads those spacings back as numbers.
//
// The launch step is FRACTIONAL: a train pinned to beat t is launched at (the current step) minus the lateness of the
// frame that noticed it, so the spacings are the pattern's and not the frame grid's.
import { sectorPc } from '../../math/keycolour.js';
import { COURANT } from './fdtd.js';
import { BANDN, MAXQ, NB, NOTEA, ONSETA, resetOnsets, scan } from './onsets.js';

export const BANDS = NB;       // 0 kick (the centre) · 1 snare · 2 hat (all twelve) · 3 onset · 4 note — onsets.js
                               // says what fires each one and in whose hue; this module only turns them into shells.
export const NSLOT = 32;       // ONE shared ring of launches, not an array per band: a launch lives about 0.4-0.9 s
                               // (TPKS + LIFES sigmas) and the busiest bar measured is ~15 launches in that window,
                               // so 32 slots never evicts a shell that is still in flight.
// The launch's shape. v0.11's carrier constants (LAM0 CENTK LAMLO RSWEEP WOBA SHIM SHIMM SUBK PSK) are gone with the
// carrier; what the TIMBRE still does is shape the SHELL, which costs nothing and reads at a glance.
export const TSIGH = 0.022;    // a launch's ring thickness, in grid heights, at CENT0 brightness
export const CENT0 = 0.45;     // the centroid that draws TSIGH exactly (the middle of the extractor's range)
export const TSIGK = 1.2;      // ... and how many HALVINGS of the thickness a unit of centroid is worth: bright
                               // music draws thin shells, a sub-heavy track fat ones. It is the thickness and not
                               // the wavelength because there is no wavelength any more — a launch is one shell.
export const SIGLO = 2;        // ... never thinner than this many substeps (the grid must resolve it)
export const DIRTK = 1.8;      // `dirty` puts a SECOND LOBE on the shell: a distorted, growling bass draws as a
export const DIRTD = 2.2;      // doubled ring, the second one this many sigmas behind the first. (In v0.11 `dirty`
                               // added a cosine second harmonic to the carrier's waveform; with the carrier gone the
                               // same growl is a second Ricker trailing the first, which is the thing the eye reads.)
export const TPKS = 2.6;       // the pulse peaks this many sigmas after its launch step
export const LIFES = 3.2;      // ... and the slot is live until this many sigmas past the peak
export const KICKA = 0.14;     // the centre current's pulse amplitude
export const SNAREA = 0.11;    // the rising sector's sharp pulse
export const HATA = 0.025;     // the hats' tiny launches on all twelve
// ... and the per-band amplitude a SECTOR launch injects, indexed by band (band 0 goes through KICKA at the centre,
// band 2 over all twelve). onsets.js NOTEA / ONSETA say why the two new ones sit where they do.
export const BAMP = [0, SNAREA, HATA, ONSETA, NOTEA];
// The WIDTH of a launch's shell, per band, as a multiple of the frame's OUT.sig (v0.12.1, the user's word on SeeYouDrop's
// breakdown: "more skinnier waves, vs bass fatter waves"). The kick is the fat one and gets fatter with the bass under
// it (x (1 + KWB x bass)); every other sound is a thin shell — a snare half the kick's width, a hat under half. The
// grid floor SIGLO still applies to the product.
export const WSIG = [1, 0.55, 0.45, 0.5, 0.5];
export const KWB = 0.35;
// A centre launch that is not a kick (onsets.js KSIL: a snare, hat or engine onset launched from the CENTRE while the
// kick has been silent — a breakdown's stabs, chops and hats) drives the centre current at this share of a kick's;
// it never feeds the dipole. 0.5 in the first cut was a dot; the thin shell needs nearly a kick's current to read.
export const ONSETC = 0.85;
export const KPUN0 = 0.6;      // the kick current's pulse amplitude is KICKA x (KPUN0 + KPUN1 x punchy): a
export const KPUN1 = 0.8;      // transient-heavy mix hits harder than a compressed one
export const DIPA = 0.030;     // the dipole pair's current amplitude — and it is driven by the CENTRE LAUNCH's own
export const DIPB = 0.35;      // envelope, never by a carrier: a kick radiates a monopole ring plus this much of a
export const DIPK = 2.2;       // two-lobed pattern along the dipole's axis, and a kick that lands on the beat the
                               // dipole turns adds DIPK of the nudge's angular velocity to it. Between kicks the
                               // dipole is a geometry and nothing else. (v0.11's DIPR — a resting share oscillating
                               // at the carrier — was the second continuous source and is gone with the first.)
export const RING = 0.34;      // the charges' ring radius in grid heights (inside the cavity, outside the lens)
// the pinned patterns, in beats of the bar. 'off' is the empty one: no launches at all, which is how a proof can
// stop the drive without stopping the field (the drop's standing-wave hold needs a source-free window, and item A's
// own gate — music playing, nothing hitting, energy 0 — is exactly this pattern).
export const PAT = { '4': [0, 1, 2, 3], '8': [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5], synco: [0, 1.5, 2, 3.5], off: [] };

// --- state -------------------------------------------------------------------------------------------------------
const AT = new Float64Array(NSLOT);            // launch step per slot (-1e18 = never used)
const AM = new Float64Array(NSLOT);            // amplitude at launch (already scaled by params.charge)
const AS = new Float64Array(NSLOT).fill(1);    // shell width at launch, as a multiple of the frame's OUT.sig (WSIG)
const AB = new Int32Array(NSLOT);              // which band launched it
const AW = new Int32Array(NSLOT);              // ... which sector (-1 = the centre)
const AH = new Float64Array(NSLOT);            // ... and the hue it injects, in palette turns
const AF = new Float64Array(NSLOT);            // ... and the frame it was launched on
const Q = new Float64Array(4 * MAXQ);          // one frame's detections: (band, sector, amp, hue) per launch
const PB = new Float64Array(BANDS);            // launches per band SINCE LOAD (reset() does not zero these: the
let NTOT = 0;                                  // trace differences them, and a re-pin must not read as -30)
let WR = 0;                                    // next slot to write
export const CX = new Float32Array(12);        // the charges in CELLS (the shader's own coordinates)
export const CY = new Float32Array(12);
export const CA = new Float32Array(12);        // ... and their Ez amplitude this substep
export const W12 = new Float32Array(12);       // the twelve weights (chroma, or the harmAngle fallback)
export const OUT = { j: 0, dj: 0, dx: 1, dy: 0, step: 0, sig: 8, spb: 100, S: COURANT, khue: 0 };

let mode = null, sched = -1e18, step = 0;
let g = { amp: 1, loud: 0, pol: 1, pres: 1, cent: CENT0, dirty: 0, punchy: 0.5, yaw: 0, yawRate: 0 };

export function reset() {
  AT.fill(-1e18);
  AM.fill(0);
  AS.fill(1);
  AB.fill(0);
  AW.fill(0);
  AH.fill(0);
  AF.fill(0);
  WR = 0;
  CA.fill(0);
  resetOnsets();
  sched = -1e18;
  step = 0;
  OUT.j = OUT.dj = 0;
  OUT.step = 0;
}
reset();

// hooks.train('4' | '8' | 'synco' | 'off' | null): pin the launches to a pattern on the fake clock, detector off.
export function train(v) {
  mode = v === '4' || v === '4x4' ? '4' : v === '8' ? '8' : v === 'synco' || v === 'sync' ? 'synco' : v === 'off' ? 'off' : null;
  if (mode !== 'off') reset();
  else { reset(); sched = 1e18; }
  return mode;
}
export const trainMode = () => mode;
export const stepNow = () => step;

export function launch(band, atStep, amp, sector, hue, frame, w) {
  AT[WR] = atStep;
  AM[WR] = amp * (g.amp === undefined ? 1 : g.amp);
  AS[WR] = w > 0 ? w : (WSIG[band | 0] || 1);
  AB[WR] = band | 0;
  AW[WR] = sector | 0;
  AH[WR] = hue || 0;
  AF[WR] = frame || 0;
  WR = (WR + 1) % NSLOT;
  PB[band | 0]++;
  NTOT++;
  if ((sector | 0) === -1) OUT.khue = hue || 0;   // the centre's colour is the last CENTRE launch's (a kick's, or a centre onset's)
}

// hooks.launches() — every launch the scene has made, read as numbers (read-only; tools/accept/v0.12/det12.py reads
// exactly this shape). `n` and `perBand` are cumulative since LOAD, so a trace differences them; `last` is the newest
// LASTN in launch order with the NEWEST LAST; `hue` is in palette turns, the same scale as hooks.mxcol().hues;
// `sector` is 0..11 or -1 for the centre (a kick); `step` is the FRAME a launch was made on; `medium` the geometry
// in force. A hat lights all twelve in their own hues — its `sector` is the rising one, where its colour is counted.
export const LASTN = 16;
export function launches(medium) {
  const last = [];
  for (let i = NSLOT - LASTN; i < NSLOT; i++) {
    const j = (WR + i + NSLOT) % NSLOT;
    if (AT[j] < -1e17) continue;
    last.push({ band: BANDN[AB[j]] || String(AB[j]), sector: AW[j], hue: +AH[j].toFixed(4), amp: +AM[j].toFixed(4), w: +AS[j].toFixed(2), step: AF[j] });
  }
  const perBand = {};
  for (let b = 0; b < BANDS; b++) perBand[BANDN[b]] = PB[b];
  return { n: NTOT, perBand, last, medium: medium === undefined ? -1 : medium };
}

// The Ricker envelope of a launch, as a function of its age in substeps — plus `dirty`'s second lobe behind it.
const rick = (u) => (u < -TPKS || u > LIFES ? 0 : (1 - u * u) * Math.exp(-0.5 * u * u));
export function env(age, sig, d) {
  const x = (age - TPKS * sig) / sig, dd = DIRTK * (d || 0);
  return rick(x) + (dd > 0 ? dd * rick(x - DIRTD) : 0);
}

// Gauss: the twelve charges' weights, and which sector is the loudest. The chroma vector IS the charge. When it
// carries no energy (silence, and the #test fake timeline, which leaves chroma zeroed) the weights come from the
// harmony the extractor does report: pitch class k sits at 2pi(7k mod 12)/12 on the circle of fifths and is weighted
// by how close it is to harmAngle. `w` blends the two continuously, so nothing ever jumps (TORUS2 index.js:155-175,
// DECISIONS §4). Since v0.12 a weight is a GLOW and a target, never a carrier amplitude: it says how brightly a
// charge burns on the rim and which sector a snare is launched from, and it radiates nothing by itself.
//   C the chroma vector · ha harmAngle · bass · pres presence · pin hooks.mxchroma's sectors (null = off)
export function weights(C, ha, bass, pres, pin) {
  let sum = 0, mxc = 0, loud = 0, mx = -1;
  for (let k = 0; k < 12; k++) { const c = Math.max(0, C[k] || 0); sum += c; if (c > mxc) mxc = c; }
  const w = Math.min(1, 2 * sum), nrm = 1 / Math.max(0.2, mxc);
  for (let k = 0; k < 12; k++) {
    const pc = sectorPc(k);
    const imp = Math.pow(0.5 + 0.5 * Math.cos(ha - ((7 * pc) % 12) / 12 * 2 * Math.PI), 2);
    const band = pc < 4 ? 0.55 + 0.55 * bass : pc < 8 ? 1 : 0.85;
    W12[k] = pin ? (pin.indexOf(k) >= 0 ? 1 : 0) : Math.min(1, (w * Math.max(0, C[pc] || 0) * nrm + (1 - w) * imp * pres) * band);
    if (W12[k] > mx) { mx = W12[k]; loud = k; }
  }
  return loud;
}

// One frame of bookkeeping. Called from update() before the substeps run.
//   sub  substeps this frame · gh the grid height in cells · cx, cy the grid centre in cells
//   p    {lev:[kick,snare,hat], beatNow, amp, cent, dirty, punchy, loud, bpm, dt, light, pol, yaw, yawRate, pres,
//         alive, quiet, frame, kickCount, onset, chroma, bchroma, bpin, hues, anchor, bass, mid, high}
export function frame(sub, gh, cx, cy, p) {
  // the speed in force: params.light scales the Courant number, and EVERYTHING geometric here follows it — the ring
  // radii and the spacings. (The first train trace reported 43.5 cells of spacing from COURANT while the picture
  // showed 34: light was 0.78 that frame.)
  const S = COURANT * (p.light === undefined ? 1 : p.light);
  OUT.S = S;
  OUT.sig = Math.max(SIGLO, TSIGH * gh / S * Math.pow(2, -TSIGK * ((p.cent === undefined ? CENT0 : p.cent) - CENT0)));
  OUT.spb = sub * (60 / Math.max(40, p.bpm)) / Math.max(1e-4, p.dt);
  g = p;
  for (let k = 0; k < 12; k++) {
    const a = 2 * Math.PI * k / 12;
    CX[k] = cx + RING * gh * Math.cos(a);
    CY[k] = cy + RING * gh * Math.sin(a);
  }
  // A pinned train is band 0 from the centre, in the hue the bass note would have carried (hooks.mxchroma pins that
  // bin, so a pinned train is a pinned colour and "did the note's hue travel" has one known answer per shell).
  const khue = p.bpin >= 0 ? p.hues[p.bpin] : p.anchor || 0;
  if (mode) {
    const P = PAT[mode], bar = Math.floor(p.beatNow / 4);
    for (let b = bar - 1; b <= bar; b++) {
      for (let j = 0; j < P.length; j++) {
        const t = b * 4 + P[j];
        if (t <= p.beatNow && t > sched) { launch(0, step - (p.beatNow - t) * OUT.spb, 1, -1, khue, p.frame); sched = t; }
      }
    }
    return;
  }
  const n = scan(p, Q, p.hues, p.anchor || 0);
  const wk = WSIG[0] * (1 + KWB * (p.bass || 0));
  for (let i = 0; i < n; i++) launch(Q[4 * i], step, Q[4 * i + 2], Q[4 * i + 1], Q[4 * i + 3], p.frame, Q[4 * i] === 0 ? wk : 0);
}

// One substep: fill CA / OUT.j / OUT.dj for this substep and advance the clock.
export function substep() {
  const sig = OUT.sig, d = g.dirty || 0;
  let jc = 0, ke = 0;
  CA.fill(0);
  for (let i = 0; i < NSLOT; i++) {
    if (AT[i] < -1e17) continue;
    const e = env(step - AT[i], Math.max(SIGLO, sig * AS[i]), d);
    if (e === 0) continue;
    const v = e * AM[i];
    if (AW[i] === -1) {   // the centre: a kick's current (and the dipole's drive), or another band's at ONSETC of it
      const c = AB[i] === 0 ? v : ONSETC * v;
      if (AB[i] === 0) ke += v;
      jc += KICKA * (KPUN0 + KPUN1 * (g.punchy === undefined ? 0.5 : g.punchy)) * c;
    }
    else if (AB[i] === 2) for (let k = 0; k < 12; k++) CA[k] += HATA * v;
    else CA[((AW[i] % 12) + 12) % 12] += BAMP[AB[i]] * v;
  }
  OUT.j = jc;
  // The dipole: a pair of antiparallel currents whose AXIS is the eased nudge, driven by the CENTRE LAUNCH's own
  // envelope. Its share carries a base plus the nudge's angular velocity, so a kick that lands on the beat the
  // dipole turns comes out two-lobed along the new axis and a kick between nudges is very nearly a plain ring.
  // surpriseEvt flips its polarity (g.pol). With no launch at the centre the dipole radiates nothing at all.
  OUT.dj = DIPA * g.pol * (DIPB + DIPK * Math.abs(g.yawRate)) * ke;
  OUT.dx = Math.cos(g.yaw);
  OUT.dy = Math.sin(g.yaw);
  step++;
  OUT.step = step;
}

// The last RPT launches of one band as radii in cells: the ring geometry, read as numbers. The shell has long since
// passed a radius of a few hundred cells, but the BOOKKEEPING radius is what says the rhythm became the geometry.
// Only the newest RPT are reported: the shared buffer holds 32 (v0.11 had 8 per band) and the oldest of those were
// launched at another tier's substep rate, so their spacings are a different `spb`'s and belong to no comparison.
export const RPT = 8;
export function rings(band) {
  const out = [];
  for (let i = 0; i < NSLOT; i++) {
    const age = step - AT[i];
    if (AT[i] < -1e17 || AB[i] !== band || age < 0) continue;
    const r = (age - TPKS * OUT.sig * AS[i]) * OUT.S;
    if (r < -2) continue;
    out.push(+r.toFixed(3));
  }
  return out.sort((a, b) => a - b).slice(0, RPT);
}

// The spacings between consecutive live rings of a band, in cells — the proof that the rhythm is the geometry.
export function spacings(band) {
  const r = rings(band), out = [];
  for (let i = 1; i < r.length; i++) out.push(+(r[i] - r[i - 1]).toFixed(3));
  return out;
}

export function info() {
  return { mode, step, S: +OUT.S.toFixed(4), amp: +(g.amp || 0).toFixed(3), sig: +OUT.sig.toFixed(2), spb: +OUT.spb.toFixed(2), j: +OUT.j.toFixed(4), dip: [+OUT.dj.toFixed(4), +OUT.dx.toFixed(3), +OUT.dy.toFixed(3)], kick: rings(0), snare: rings(1), hat: rings(2), space: spacings(0) };
}
