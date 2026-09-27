// NAV2's detectors (docs/workers/brief-nav2.md §3): pure followers of MS, no wall clock, no Math.random. Every
// constant is a named manual setting at the top of this module — these are the leans the user retunes first.
//
// pitch    only the MOTION of the spectral centroid lifts the blob (a bright mix must not park it high)
// sweep    a filter sweep / riser over seconds: riser, hp, or the centroid's own climb
// roll     a drum roll / snare build: MS.roll, or the onset rate above a floor (real audio only)
// scratch  "that dj scratch sound": a fast pitch BEND whose sign FLIPS, gated on spectral flux and hit energy
// swirl    the soft-OR of the three: what the user hears as "a swirl"
// wind     the pre-drop wind-up, on synapse's drop countdown (NOT `build` alone); a drop RELEASES it, a fake-out does not
// spin     the frame's turn rate: the swirl plus the square of the wind, released by the drop
import { clamp, ema, sstep } from '../../math/util.js';

export const PITCH_K = 2.5;      // gain from centroid motion to pitch height
export const C_TAU = 4.0;        // s — the centroid's own long mean: the high-pass that makes pitch a motion
// A sweep is a SUSTAINED MONOTONE CLIMB of the centroid, not a big derivative. The v0.8 headed trace (a real track at
// 160 bpm, 40 samples) showed the raw-derivative form saturating: |trend|/0.12 fired on ordinary jitter — the centroid
// moved 0.31 <-> 0.87 between 2 s samples — so sweep read 0.52-0.99 on every sample while the engine's own `riser` was
// 0 on 35 of 40 and `hp` on 39 of 40. The run below is broken by any fall of SW_DROP, must last SW_MINT before it
// counts, and is scaled by its own RATE, so the track's slow drift (0.036 units/s) reads a fraction of a real filter
// sweep (0.12-0.19 units/s) instead of the same 1.0.
export const SW_SM = 0.30;       // s — ema on the centroid before the run test (kills frame-level noise)
export const SW_DROP = 0.035;    // a fall this far below the run's peak ends the run
export const SW_RISE = 0.28;     // the total climb that reads a full sweep
export const SW_MINT = 1.2;      // s of sustained climbing before a climb counts at all
export const SW_MAXT = 2.0;      // s ... and counts fully
export const SW_RATE = 0.10;     // centroid units/s — the rate a real filter sweep climbs at
export const SW_CW = 0.85;       // how much of `sweep` the CENTROID path may claim on its own. It is capped below 1
                                 // on purpose: on Who Likes to Party the centroid really does swing 0.53 <-> 0.77
                                 // every four seconds, which has the size AND the rate of a filter sweep, so no causal
                                 // detector reading the centroid alone can separate the two. Only the engine's own
                                 // `riser` / `hp` — which see the spectrum, not one number — may drive sweep to 1.
export const SW_A = 0.25;        // s — sweep attack
export const SW_R = 0.60;        // s — sweep release
export const RO_A = 0.30;        // s — roll attack
export const RO_R = 0.80;        // s — roll release
export const OR_LO = 5.0;        // onsets/s below which a roll is not a roll
export const OR_SC = 6.0;        // onsets/s from that floor to a full roll
export const SCR_SLEW = 0.55;    // |pitch velocity| (units/s) above which a move is a BEND
export const SCR_TAU = 0.35;     // s — the flick counter's own decay
export const SCR_N0 = 1.5;       // flicks/s below which nothing is a scratch
export const SCR_NS = 2.5;       // flicks/s from there to a full scratch
export const SCR_GATE = 0.35;    // the gate's floor: a scratch needs energy behind it
export const FLUX_TAU = 2.0;     // s — the self-normalising peak the flux gate divides by
export const WIND_BEATS = 8.0;   // beats of countdown over which the wind-up builds
export const W_TAU = 0.40;       // s — the wind's own ema
export const W_FAKE = 2.5;       // s — after a fake-out the tension LEAKS out instead of releasing
export const FAKE_HOLD = 0.5;    // s (one beat at 124 bpm) the slow ema is held after a fake-out
export const REL_TAU = 0.45;     // s — the release follower of dropEnv
export const SPIN_SW = 0.3;      // rad/s per unit swirl. 0.6 in v0.8; halved after the user's look at SeeYouDrop
                                 // ("at 1:04 it starts to get swirly"): the post-drop synths read swirl 0.93-1.0 and
                                 // the frame turned at 0.66-0.79 rad/s
export const SPIN_W = 0.25;      // rad/s per unit wind^2 (0.5 in v0.8, halved with SPIN_SW)
export const SPIN_SC = 0.3;      // rad/s per unit of the swirl the PARAM cannot see: scratch (not an MS field) and
                                 // hooks.swirl's pin. Held equal to SPIN_SW so the two halves of the swirl weigh the same.
export const SPIN_TAU = 0.25;    // s — the rate's own ease, so the angle's derivative never jumps
export const SPIN_REL = 0.8;     // how much of the rate the drop's release takes away
export const NORM_TAU = 8.0;     // s — the window the centroid's OBSERVED range is measured over (the span's own
                                 // relaxation is half that). Without it the melody is mapped off a fixed 0.5 midpoint,
                                 // and on a real track whose centroid means 0.46 and spans 0.31-0.87 the wish only ever
                                 // asked for -0.25..+0.48 of Im c and the blob moved +-0.17 (v0.8 headed trace).
export const NORM_MIN = 0.25;    // the smallest span the normaliser will divide by
export const LIFT_TAU = 0.20;    // s — the blob's float ease
export const LIFT_V = 0.35;      // view units of float per unit of pinned pitch (hooks.pitch)
export const LIFT_G = 2.5;       // gain on the HIGH-PASSED lift target: the param's range is the level's, this is the motion's
export const SLIDE = 0.45;       // Koenigs band shift per unit pitch (uKoen.x)
export const SLIDE_A = 1.10;     // Koenigs spoke rotation per unit pitch, radians (uKoen.y)
export const CURL = 0.35;        // gain on the natural tightness per unit wind (uCurl)
export const CURL_SW = 0.30;     // ... and per unit swirl
export const GLOW_H = 0.8;       // how much the smoulder brightens in the hush (uGlow = 1 + GLOW_H*hush)
// --- the beat (v0.13, the user on SeeYouDrop: "the mandelbrot set to bump with the beat. no beat == more of a circle
// (some variation), as the beat happens it spirals in showing the complexity") ---------------------------------
export const BUMP_TAU = 0.35;    // s — a hit's press decays with this constant (a beat at 150 bpm is 0.4 s apart, so
                                 // the press falls to a third between kicks and c breathes in and out with them).
                                 // 0.28 left the pulse too short to reach the rim through K_R and V_MAX (test_nav2
                                 // sweep 2026-09-26: rho peaked 0.88 and no gate opened under a kick on every beat)
export const PULSE_TAU = 2.0;    // s — the beat DENSITY, an ema of the bump: a busy passage keeps c part-way pressed
                                 // between its kicks ("some variation"), a beatless one lets it rest on the circle
export const CURL_B = 0.5;       // gain on the arms' tightness per unit bump: the beat spirals the arms in (uCurl)
export const BUMP_PK_TAU = 3.0;  // s — the beat is read against the track's OWN running kick/hit peak (the user on
                                 // SeeYouDrop: "0-13s ... edge should be bumping on every beat; at 25s it really starts
                                 // moving the edge on every beat" — the engine's `kick` read 0.1-0.3 in the intro and
                                 // 0.2-0.55 in the groove, so a fixed scale bumped it at a third of its size)
export const BUMP_PK_MIN = 0.25; // ... the smallest peak the beat is divided by (silence must not normalise noise up)
export const BUMP_E0 = 0.5;      // ... and the bump is this much at zero energy, 1 at eS 1: the intro's beats bump,
                                 // the drop's bump harder
export const BUMP_IV = 0.3;      // the bump's decay is at most this fraction of the running HIT INTERVAL, so double time
                                 // (SeeYouDrop 1:38: onsets 4.7-5.9 a second) breathes twice as fast instead of pinning
                                 // rho high ("should be moving faster / reacting more", the user). 0.55 left the
                                 // 124 bpm test beat too short to open a gate; 0.7 (tau 0.28 s straight, 0.14 double).
                                 // Pass 7: 0.5 again (tau 0.2 s at 150 bpm) — with the peak HELD for BUMP_HOLD first, the
                                 // shorter decay is what lets the trough between kicks fall (0.84 -> 0.67, the node sweep:
                                 // "still not deforming enough"); 0.4 lost the peak at 150 bpm at V_INT 2.4. Pass 8: 0.3 (tau 0.12 s
                                 // at 150 bpm) with V_INT 3.6 and the growth-rule slew — peak 0.97, trough 0.50, the collapse and
                                 // the near-circle on EVERY beat ("pretty much should be deforming on every beat")
export const BUMP_HOLD = 0.4;    // pass 6: the press HOLDS its peak for this fraction of the hit interval before it decays,
                                 // so the ball reaches the rim (V_MAX 1.2 needs ~0.2 s from the trough to the pinch at the
                                 // 1/2 root, the farthest); the node sweep (AUDIT-v0.13 §6): without it the press peaked at
                                 // rho 0.88–0.89 whatever K_R did, because a stiffer spring only follows the fall faster.
                                 // 0.3 in passes 6-7; 0.4 in pass 8: the per-frame trace on the real track showed beats whose
                                 // climb from the new low trough (0.5) plus a note change did not finish inside 0.12 s (peaks
                                 // 0.78); 0.16 s does (node: peak 0.983 / trough 0.56 at 150 bpm against 0.971 / 0.52), and more
                                 // speed buys nothing past 3.5 (the sweep: 4.5 and 5.5 identical to the third decimal)
export const GRID_K = 1.0;       // pass 8 (the user: "this is an extreme example and pretty much should be deforming on every
                                 // beat"): every tick of the engine's BEAT GRID (S.beat) presses at least this much x the energy
                                 // term, while a real kick has been heard inside GRID_T. The 10 Hz beat trace on 27-37 s read the
                                 // kick's own press at 0.34-0.76 on 9 of 26 beats (a weak kick against the running peak) and
                                 // the set only half-collapsed there; the grid is the beat the user hears. 1.0: every beat is a
                                 // full press (0.85 left the per-frame peak at 0.95; the kick's own strength shows in the halo)
export const GRID_T = 2.0;       // s — how long after the last real kick (GRID_ARM of the running peak) the grid keeps pressing:
                                 // a breakdown with no kicks lets go inside a bar, and the silence rebounds to the circle
export const GRID_ARM = 0.5;     // the kick / hit, as a fraction of the running peak, that counts as a real kick
export const IV_TAU = 1.5;       // s — the ema of the hit interval
export const E_LO = 0.5;         // energy below this fraction of the track's own peak is no extra energy; at the peak E is 1
                                 // ("1:45 -> this is where the highest energy is, should be reacting more": E lifts the
                                 // halo's reach, the curl and the kick zoom). Pass 6: read against the running peak of eS
                                 // (the user: "energy gain read against the track's own peak") — SeeYouDrop's 1:45 reads
                                 // eS 0.78 against 0.87–0.94 at 1:33–1:39, so a fixed scale gave it E 0.56 where the ear
                                 // hears the peak; against its own peak (E_PK_TAU) both read 1
export const E_PK_TAU = 20;      // s — the energy peak's decay: a section's peak, not a bar's (the beat's own is 3 s)
export const E_PK_MIN = 0.3;     // ... and the smallest peak the energy is divided by

export const DET = {
  pitch: 0.5, pE: 0, lift: 0, sweep: 0, roll: 0, scratch: 0, swirl: 0,
  wind: 0, windT: 0, count: 0, spin: 0, rate: 0, angle: 0, rel: 0, curl: 0, glow: 1, bump: 0, pulse: 0, pk: 0,
  ival: 0.5, tHit: 0, onset: 0, E: 0, ePk: 0, tK: 9,
  hN: 0, climb: 0, runT: 0, runPk: 0, runLo: 0, cSm: -1, hLo: 0, hHi: 0,
  cEma: 0, cPrev: -1, lEma: 0, pvPrev: 0, bendSgn: 0, flicks: 0, fluxPk: 1e-6, hitF: 0,
  fake: 0, dir: 1, seeded: 0,
  pinPitch: -1, pinScratch: -1, pinSwirl: -1, pinWish: null,
};

// The pitch source for the scratch: the faster of the centroid and the strongest partial's octave.
function pitchSrc(S) {
  const pk = S.peaks && S.peaks[0] ? S.peaks[0][0] : 0;
  return pk > 30 ? Math.log2(pk / 55) / 6 : S.centroid;
}

export function resetDet() {
  const D = DET;
  D.pitch = 0.5;
  D.pE = D.lift = D.sweep = D.roll = D.scratch = D.swirl = 0;
  D.wind = D.windT = D.count = D.spin = D.rate = D.angle = D.rel = D.curl = 0;
  D.glow = 1;
  D.cEma = 0;
  D.cPrev = -1;
  D.cSm = -1;
  D.hN = D.climb = D.runT = D.runPk = D.runLo = D.hLo = D.hHi = 0;
  D.lEma = D.pvPrev = D.bendSgn = D.flicks = 0;
  D.fluxPk = 1e-6;
  D.hitF = D.fake = 0;
  D.bump = D.pulse = D.pk = 0;
  D.ival = 0.5; D.tHit = 0; D.onset = 0; D.E = 0; D.ePk = 0; D.tK = 9;
  D.dir = 1;
  D.seeded = 0;
}

// P = the scene's visual parameters (env.params): `lift` and `spin` are declared targets, the ease below is state.
export function updateDet(dt, S, P) {
  const D = DET;
  if (D.cPrev < 0) {            // first frame: start the long means AT the signal, so nothing swings on boot
    D.cPrev = S.centroid;
    D.cEma = S.centroid;
    D.cSm = S.centroid;
    D.runPk = D.runLo = S.centroid;
    D.lEma = P.lift;
    D.hLo = P.height - NORM_MIN / 2;
    D.hHi = P.height + NORM_MIN / 2;
  }
  // GROOVE's own rule for a section constant: the sign of seed.th. Read every frame, not latched — a section change
  // flips it, and the RATE is eased below, so the angle itself never jumps.
  D.dir = S.seed.th < 0 ? -1 : 1;
  // --- pitch: the motion of the centroid, not its level -------------------------------------------------
  D.cEma = ema(D.cEma, S.centroid, dt, C_TAU);
  const raw = clamp(0.5 + PITCH_K * (S.centroid - D.cEma), 0, 1);
  D.pitch = D.pinPitch >= 0 ? D.pinPitch : raw;
  const pn = 2 * (D.pitch - 0.5);
  D.pE = ema(D.pE, pn, dt, LIFT_TAU);
  // --- the blob's float: the same high-pass on the declared `lift` target, so uKoen and uView.y move together ---
  D.lEma = ema(D.lEma, P.lift, dt, C_TAU);
  D.lift = ema(D.lift, D.pinPitch >= 0 ? LIFT_V * pn : LIFT_G * (P.lift - D.lEma), dt, LIFT_TAU);
  // --- the melody's height, normalised to the track's OWN observed range --------------------------------
  const sp0 = D.hHi - D.hLo;
  D.hLo = Math.min(P.height, D.hLo + sp0 * dt / NORM_TAU);
  D.hHi = Math.max(P.height, D.hHi - sp0 * dt / NORM_TAU);
  // centred on the window, not anchored at its floor: a FLAT centroid must read the middle (0), and it collapses
  // hLo onto hHi onto the signal itself, which an anchored form would read as -1 (measured on #test's valley).
  const mid = (D.hLo + D.hHi) / 2, half = Math.max((D.hHi - D.hLo) / 2, NORM_MIN / 2);
  D.hN = clamp((P.height - mid) / half, -1, 1);
  // --- sweep: a SUSTAINED MONOTONE CLIMB of the centroid, or the engine's own riser / hp -----------------
  D.cPrev = S.centroid;
  D.cSm = ema(D.cSm, S.centroid, dt, SW_SM);
  if (D.cSm > D.runPk) D.runPk = D.cSm;
  if (D.cSm < D.runPk - SW_DROP) {          // a real reversal ends the run; frame jitter does not
    D.runLo = D.runPk = D.cSm;
    D.runT = 0;
  } else if (D.cSm > D.runLo) D.runT += dt;
  const rise = D.runPk - D.runLo, rate = rise / Math.max(D.runT, 1e-3);
  D.climb = clamp(rise / SW_RISE, 0, 1) * sstep(SW_MINT, SW_MAXT, D.runT) * clamp(rate / SW_RATE, 0, 1);
  const swT = clamp(Math.max(S.riser, S.hp, SW_CW * D.climb), 0, 1);
  D.sweep = ema(D.sweep, swT, dt, swT > D.sweep ? SW_A : SW_R);
  // --- roll: the drum roll / snare build -----------------------------------------------------------------
  const roT = clamp(Math.max(S.roll, (S.onsetRate - OR_LO) / OR_SC), 0, 1);
  D.roll = ema(D.roll, roT, dt, roT > D.roll ? RO_A : RO_R);
  // --- scratch: a bend whose sign flipped, with energy behind it -----------------------------------------
  const ps = pitchSrc(S), pv = (ps - D.pvPrev) / Math.max(dt, 1e-4);
  D.pvPrev = ps;
  const bend = Math.abs(pv) > SCR_SLEW ? (pv > 0 ? 1 : -1) : 0;
  if (bend && D.bendSgn && bend !== D.bendSgn) D.flicks += 1;   // a leaky count; flicks/s = D.flicks / SCR_TAU
  if (bend) D.bendSgn = bend;
  D.flicks = Math.max(0, D.flicks - D.flicks * dt / SCR_TAU);
  D.fluxPk = Math.max(S.flux, D.fluxPk - dt * D.fluxPk / FLUX_TAU);
  D.hitF = ema(D.hitF, Math.max(S.hitStrength, clamp(S.onsetRate / OR_SC, 0, 1)), dt, SCR_TAU);
  const gate = clamp(S.flux / Math.max(D.fluxPk, 1e-6), 0, 1) * clamp(D.hitF / SCR_GATE, 0, 1);
  const scT = clamp((D.flicks / SCR_TAU - SCR_N0) / SCR_NS, 0, 1) * gate;
  D.scratch = D.pinScratch >= 0 ? D.pinScratch : ema(D.scratch, scT, dt, SCR_TAU);
  // --- swirl: the soft-OR the user hears ----------------------------------------------------------------
  D.swirl = D.pinSwirl >= 0 ? D.pinSwirl : 1 - (1 - D.sweep) * (1 - D.roll) * (1 - D.scratch);
  // --- wind: the pre-drop wind-up on synapse's countdown ------------------------------------------------
  const dei = S.dropExpectedIn;
  D.count = clamp(1 - Math.max(dei, 0) / WIND_BEATS, 0, 1) * (dei >= 0 ? 1 : 0);
  D.windT = clamp(P.wind, 0, 1);
  if (S.fakeoutEvt) D.fake = FAKE_HOLD;
  D.fake = Math.max(0, D.fake - dt);
  if (S.dropEvt) D.wind = 0;
  else D.wind = ema(D.wind, D.windT, dt, D.fake > 0 ? W_FAKE : W_TAU);
  // --- the beat: a peak-hold of the kick / the hit with its own decay, and its density ----------------------
  const bt = Math.max(S.kick || 0, S.hit || 0);
  D.pk = Math.max(bt, D.pk * Math.exp(-dt / BUMP_PK_TAU));
  const kN = clamp(bt / Math.max(D.pk, BUMP_PK_MIN), 0, 1), eT = BUMP_E0 + (1 - BUMP_E0) * clamp(S.eS || 0, 0, 1);
  D.tK = kN > GRID_ARM ? 0 : D.tK + dt;
  const hitN = Math.max(kN, S.beat && D.tK < GRID_T ? GRID_K : 0) * eT;   // the kick's own press, or the grid's while kicks are recent
  D.tHit += dt;
  const tau = Math.min(BUMP_TAU, BUMP_IV * D.ival);
  const dec = D.tHit < BUMP_HOLD * D.ival ? D.bump : D.bump * Math.exp(-dt / tau);
  D.onset = hitN > dec + 0.05 && D.tHit > 0.08 ? 1 : 0;   // a NEW hit: above the decaying envelope, not a re-read of the last
  if (D.onset) {
    D.ival = ema(D.ival, clamp(D.tHit, 0.08, 2), 1, IV_TAU / Math.max(D.tHit, 0.08));
    D.tHit = 0;
  }
  D.bump = Math.max(dec, hitN);
  D.ePk = Math.max(S.eS || 0, D.ePk * Math.exp(-dt / E_PK_TAU));
  D.E = clamp(((S.eS || 0) / Math.max(D.ePk, E_PK_MIN) - E_LO) / (1 - E_LO), 0, 1);
  D.pulse = ema(D.pulse, D.bump, dt, PULSE_TAU);
  // --- the release, the spin rate, the angle ------------------------------------------------------------
  D.rel = ema(D.rel, S.dropEnv, dt, REL_TAU);
  // The `spin` parameter carries everything the rate has that is an MS field (riser, hp, roll and the wind-up's own
  // square). scratch and hooks.swirl's pin are NOT MS fields and cannot live in a from(), so they ride on top at the
  // same gain. Routing `spin` therefore drives the frame, and a pinned swirl still turns it for the test.
  D.spin = clamp(P.spin, 0, 2) + SPIN_SC * clamp(D.scratch + (D.pinSwirl >= 0 ? D.pinSwirl : 0), 0, 1);
  const rt = D.dir * D.spin * (1 - SPIN_REL * D.rel);
  D.rate = ema(D.rate, rt, dt, SPIN_TAU);     // the RATE is eased, so the angle integrates and never jumps
  D.angle += D.rate * dt;                     // on dt, not musical time: the param's range is declared in rad/s
  // --- the shader gains --------------------------------------------------------------------------------
  D.curl = CURL * D.wind + CURL_SW * D.swirl + CURL_B * D.bump * (1 + D.E);
  D.glow = 1 + GLOW_H * S.hush;
}
