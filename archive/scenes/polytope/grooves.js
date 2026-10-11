// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// POLYTOPE — a groove per band (brief-polytope-dance spec 1; the user: "should extract grooves from bass, mid, highs").
//
// A groove is an ONSET TRAIN, not a level and not a learned pattern: the scene watches `bass`, `mid` and `high`
// itself, and every time one of them RISES over its own ~0.4 s average by more than that band's threshold it files
// the beat it happened on. The pattern is then simply the spacing of the last eight entries. `kick`/`snare`/`hat`
// are a confirming VOTE (×1 with, ×VOTE without) and never the only source, so a track whose drums the extractor
// cannot name still has a groove.
//
// The clock is musical — `beatCount + beatPhase`, never a wall clock — so an entry filed at beat B sits for ever
// after at age `beatNow − B`, and a set that runs for an hour never drifts. While `gridTrust` is high the launch
// beat is snapped to the nearest 16th, which makes a four-on-the-floor read as exactly four evenly spaced bumps
// instead of four nearly-even ones.
//
// Every consumer reads these three trains: dance.js nudges a rotation plane per entry, and poly4.js's `emit` paints
// a bump wherever an entry's age lands along an edge (one edge length per bar, `t = (age/4) mod 1`). Because the
// launches are hits and the speed is fixed, the rhythm becomes the spacing of the bumps along every edge.
//
// Retuning: THR_BASS / THR_MID / THR_HIGH below are the three numbers the orchestrator moves on real music. They are
// a rise over the band's own running mean, so they are loudness-independent; raise one if a band's train saturates
// (`hooks.info().bass.n` climbing every frame), lower it if the train is dead.

export const BANDS = 3;        // 0 bass · 1 mid · 2 high
export const SLOTS = 8;        // the last 8 launches per band
export const LIFE = 8;         // beats a bump lives (two bars at 4/4) — past this the slot reads as empty

// --- the manual settings (a named constant at the top, never a magic number below) ---
// Measured, not guessed: the detector was run over 50 s per-frame level logs of house / dnb / aba / the fake
// timeline at thresholds 0.10 … 0.25 and scored on entries per beat and the median gap between them. Each value
// below is picked in the FLAT middle of that sweep, so the orchestrator's retune cannot fall off a cliff — with the
// ARMF latch in place the rate is nearly threshold-independent, which is what makes these safe knobs.
// (entries per beat / median gap in beats, at the value chosen)
//   bass 0.18 → house 0.55/1.00 · aba 0.77/1.01 · dnb 0.29/2.00 (a rolling sub rarely falls back) · #test 0.61/1.00
//   mid  0.15 → house 0.60/1.00 · aba 0.71/1.00 · dnb 0.33/2.46 · #test 0.05 (the fake mids are a step, not onsets)
//   high 0.17 → house 0.85/0.98 · aba 0.94/0.60 · dnb 0.49/1.98 · #test 0.01 (likewise)
export const THR_BASS = 0.18;  // how far `bass` must rise over its own 0.4 s mean to count as an onset
export const THR_MID = 0.15;   // ... `mid`
export const THR_HIGH = 0.17;  // ... `high`
export const EMATC = 0.4;      // seconds: the running mean the rise is measured against
export const REFR = 0.25;      // beats between two launches in one band — one 16th (= 15/bpm seconds, exactly)
export const VOTE = 0.6;       // amplitude without the matching drum's confirming vote
// The rise that counts as a FULL-STRENGTH onset. Without it the amplitude is the raw rise, and a typical rise on
// real music is 0.2–0.4 (measured), so every nudge and every bump arrived at a third of its designed size — the bar
// series of spec 2 read 0.002–0.046 rad where lean 13 wants the groove visible at arm's length. 0.45 is the 1st
// percentile of the positive rises on house, i.e. about as hard as that band ever hits.
export const AMPN = 0.45;
export const FAINT = 0.25;     // the `beat`'s own faint bass entry when no band hit came in the last bar
export const GRIDT = 0.5;      // above this `gridTrust` the launch beat snaps to the nearest 16th
// Hysteresis. Without it a band that RAMPS and then HOLDS (a riser, a sustained pad) files an entry every refractory
// until its own mean catches up — six entries for one musical event, measured in tools/test_polytope.js. After a
// launch the detector is disarmed and only re-arms when the rise has fallen back below ARMF of the threshold, so
// one swell is one entry. (TORUS2's HI/LO edge detector is the same idea on the raw level.)
export const ARMF = 0.5;
// A drum "fired" on a rising edge of its decaying impulse. #test sets `hat` to EXACTLY 0.5 (DECISIONS §36), so a
// strict `> 0.5` never fires there: the bar is 0.45, as TORUS2's is.
export const DRUMHI = 0.45;
export const DRUMLO = 0.25;
// spec 4: the bump's width along the edge parameter, per band — the bass a wide slow swell, the mid a sharp pulse,
// the high a tiny fast ripple — and the peak each one reaches at amplitude 1.
//
// The brief's leans were 0.18 / 0.08 / 0.04. An EDGE HAS ONLY sub+1 SAMPLE POINTS (sub ≤ 8, a spacing of 0.125
// along the edge at the best tier) and that is the whole resolution there is. Measured on the live 4x4 profile:
//   0.18  — the four bumps of a bar merge into ONE maximum. Unusable.
//   0.085 — four maxima, but the trough between two bumps 0.25 apart is 0.80 of the peak (each Gaussian is still
//           worth 0.40 of itself at the midpoint), so the beads read as a 1.25x ripple. Too faint for lean 13.
//   0.055 — the trough falls to 0.28 of the peak: a 3x ripple, which reads as a string of beads.
// Below ~0.05 the bump is finer than the mesh and its sampled peak flickers as it travels (the ink is conserved by
// the box convolution in fillProfile, but the peak is not). 0.055 costs about 35 % of peak flicker at 4 Hz, which
// the scene's own feedback trail (post.fb.decay 0.74) smooths. Retune here; the ordering — wide · sharper · tiny —
// is what keeps the three bands apart, together with WHERE they are painted and how often they fire.
export const SIG = [0.055, 0.042, 0.032];
export const PEAK = [1.0, 0.85, 0.45];

const THR = [THR_BASS, THR_MID, THR_HIGH];
// the test train (hooks.train): a fixed pattern replaces the detectors, so a shot can be read as geometry
const PAT = { '4x4': [0, 1, 2, 3], sync: [0, 1.5, 2, 3.5] };

const AT = new Float32Array(BANDS * SLOTS);    // launch beat per slot (−1e9 = never used)
const AM = new Float32Array(BANDS * SLOTS);    // amplitude at launch
const AD = new Float32Array(BANDS * SLOTS);    // 1 if the drum vote fired on that launch
const W = new Int32Array(BANDS);               // next slot to write per band
const EMA = new Float32Array(BANDS);           // the band's running mean
const PRD = new Float32Array(BANDS);           // last frame's drum level, for its edge detector
const DRF = new Float32Array(BANDS);           // frame of that drum's last rising edge
const LAST = new Float32Array(BANDS);          // beat of that band's last launch (the refractory)
const ARM = new Uint8Array(BANDS);             // 1 while the band may fire again (the hysteresis latch)
const NLAU = new Int32Array(BANDS);            // launches since load, for hooks.info
const FIRED = [];                              // the launches filed THIS frame: [band, amp, band, amp, …]
export const fired = () => FIRED;
let lastHit = -1e9;                            // beat of the last launch in any band
let mode = null, sched = -1e9, frameN = 0;

export function reset() {
  AT.fill(-1e9);
  AM.fill(0);
  AD.fill(0);
  W.fill(0);
  EMA.fill(0);
  PRD.fill(0);
  DRF.fill(-9);
  LAST.fill(-1e9);
  ARM.fill(1);
  NLAU.fill(0);
  FIRED.length = 0;
  lastHit = -1e9;
  sched = -1e9;
  frameN = 0;
}
reset();

export function launch(band, beat, amp, drum) {
  const i = band * SLOTS + W[band];
  AT[i] = beat;
  AM[i] = amp;
  AD[i] = drum;
  W[band] = (W[band] + 1) % SLOTS;
  FIRED.push(band, amp);
  LAST[band] = beat;
  NLAU[band]++;
  lastHit = Math.max(lastHit, beat);
}

// hooks.train('4x4' | 'sync' | null): pin the BASS train to a pattern on the fake clock. The detectors are off while
// it is set, so the only bumps on screen are the pattern's — four per bar, evenly spaced or not.
export function train(v) {
  mode = v === '4x4' || v === 'sync' ? v : null;
  reset();
  return mode;
}
export const trainMode = () => mode;

// One frame. levels = [bass, mid, high]; drums = [kick, snare, hat]; beatNow = beatCount + beatPhase.
export function step(dt, levels, drums, beatNow, beatEvt, gridTrust) {
  frameN++;
  FIRED.length = 0;
  if (mode) {
    const P = PAT[mode], bar = Math.floor(beatNow / 4);
    for (let b = bar - 1; b <= bar; b++) {
      for (let j = 0; j < P.length; j++) {
        const t = b * 4 + P[j];
        if (t <= beatNow && t > sched) { launch(0, t, 1, 1); sched = t; }
      }
    }
    return;
  }
  const snap = gridTrust > GRIDT;
  const k = 1 - Math.exp(-dt / EMATC);
  for (let b = 0; b < BANDS; b++) {
    const d = drums[b];
    if (d > DRUMHI && PRD[b] < DRUMLO) DRF[b] = frameN;
    PRD[b] = d;
    const x = levels[b];
    const rise = x - EMA[b];                       // measured against the PREVIOUS mean: a spike is a rise
    EMA[b] += (x - EMA[b]) * k;
    if (rise < THR[b] * ARMF) ARM[b] = 1;          // fallen back: one swell may fire once more
    if (ARM[b] && rise > THR[b] && beatNow - LAST[b] >= REFR) {
      const vote = frameN - DRF[b] <= 1 ? 1 : 0;   // the drum's ±1 frame window
      ARM[b] = 0;
      launch(b, snap ? Math.round(4 * beatNow) / 4 : beatNow, Math.min(1, rise / AMPN) * (vote ? 1 : VOTE), vote);
    }
  }
  // a drumless, unpeaked track still breathes: the beat itself files a faint bass entry once a bar goes by unfiled
  if (beatEvt && beatNow - lastHit > 4) launch(0, snap ? Math.round(4 * beatNow) / 4 : beatNow, FAINT, 0);
}

// age of a slot in beats, clamped at 0 (a launch snapped forward sits at the start of its edge until its time comes)
const ageOf = (i, beatNow) => (AT[i] > -1e8 ? Math.max(0, beatNow - AT[i]) : -1);
const liveAt = (i, beatNow) => AT[i] > -1e8 && beatNow - AT[i] > -0.26 && beatNow - AT[i] <= LIFE;

// how many bumps are alive right now, for the HUD
export function live(beatNow) {
  let n = 0;
  for (let i = 0; i < AT.length; i++) if (liveAt(i, beatNow)) n++;
  return n;
}

// where one band's bumps sit along an edge right now (the proof of the spacing, read as numbers)
export function positions(band, beatNow) {
  const out = [];
  for (let s = 0; s < SLOTS; s++) {
    const i = band * SLOTS + s;
    if (liveAt(i, beatNow)) out.push(+((ageOf(i, beatNow) / 4) % 1).toFixed(4));
  }
  return out.sort((a, b) => a - b);
}

// spec 4, the whole cost of the pulses: the bump profile along ONE edge, sampled at the sub+1 points the subdivision
// already visits. Nothing finer exists on an edge, so this is exact, not an approximation — and it is 3·(sub+1)·8
// exponentials per frame instead of one per emitted sample (~7 k × 24), which is why the bench barely moves.
// out is a Float32Array of at least 3·(nsub+1); band b's profile is out[b·(nsub+1) + k] for k = 0…nsub.
//
// The bump is BOX-CONVOLVED with one piece's share of the edge (width 1/nsub) before it is sampled: a Gaussian
// through a box of width w is very nearly a Gaussian of σ² + w²/12, with its peak scaled by σ/σ_eff so the INK
// under the bump is conserved. That is what keeps the picture continuous across a tier flip (`cuts: 'continuous'`):
// a coarser subdivision widens and dims each bump instead of letting it flicker between the sample points as it
// travels, and a feature finer than the mesh fades out rather than aliasing.
//
// Each band's row is then made ZERO-MEAN along the edge. This matters more than it looks: without it the multiplier
// `1 + gain·profile` raises the AVERAGE brightness of every stroke as well as modulating it, so a track with a busy
// groove came out about twice as bright overall and saturated to white through the bloom — the exact failure
// DECISIONS §7 warns about, and the first before/after montage showed it on house and aba. Zero-mean, the groove
// only ever redistributes light along an edge: the beads are as strong as ever and the picture's exposure is the
// one the brightness law already chose. (k = nsub is the same point on the edge as k = 0, so the mean runs 0…nsub-1
// and the duplicate endpoint does not weight the average.)
export function fillProfile(out, nsub, beatNow) {
  const n1 = nsub + 1;
  out.fill(0, 0, BANDS * n1);
  const box2 = 1 / (nsub * nsub * 12);
  for (let b = 0; b < BANDS; b++) {
    const sg = Math.sqrt(SIG[b] * SIG[b] + box2), pk = PEAK[b] * (SIG[b] / Math.sqrt(SIG[b] * SIG[b] + box2)), inv = -0.5 / (sg * sg), o = b * n1;
    for (let s = 0; s < SLOTS; s++) {
      const i = b * SLOTS + s;
      if (!liveAt(i, beatNow)) continue;
      const age = ageOf(i, beatNow);
      const a = AM[i] * pk * Math.max(0, 1 - age / LIFE);
      if (a < 0.004) continue;
      const c = (age / 4) % 1;                     // one edge length per bar
      for (let k = 0; k <= nsub; k++) {
        let d = k / nsub - c;
        d -= Math.round(d);                        // the edge parameter wraps: the short way round
        out[o + k] += a * Math.exp(d * d * inv);
      }
    }
    let mean = 0;
    for (let k = 0; k < nsub; k++) mean += out[o + k];
    mean /= nsub;
    for (let k = 0; k <= nsub; k++) out[o + k] -= mean;
  }
  return out;
}

// hooks.info(): the trains as numbers — the positions the shots are read against, plus what the orchestrator's
// real-music trace needs to tell a dead train from a saturated one.
export function info(beatNow) {
  const names = ['bass', 'mid', 'high'];
  const o = { beat: +beatNow.toFixed(3), live: live(beatNow), train: mode };
  for (let b = 0; b < BANDS; b++) {
    const s = (W[b] + SLOTS - 1) % SLOTS, i = b * SLOTS + s;
    o[names[b]] = {
      pos: positions(b, beatNow),
      n: NLAU[b],
      last: AT[i] > -1e8 ? { beat: +AT[i].toFixed(3), amp: +AM[i].toFixed(3), drum: AD[i] | 0 } : null,
      ema: +EMA[b].toFixed(4),
      thr: THR[b],
    };
  }
  return o;
}
