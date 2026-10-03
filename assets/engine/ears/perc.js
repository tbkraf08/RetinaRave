// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// Percussion: a causal HPSS-lite (a short running median of each band's dB envelope is the harmonic part; what rises above
// it is percussive) and one onset stream per class — EXCEPT the LOW lane, which is a 60-150 Hz band graded on its RISE
// (see "THE LOW LANE" below, DECISIONS §68), and the SNARE lane, which is the two mid bands' RISE (DECISIONS §69).
// Only the HAT still runs the HPSS-lite flux. THE rule that matters on this music: a kick needs the beater click —
// a 2.5-8 kHz transient within CLICK_W hops of the low onset. A bare low onset is an 808 note start and belongs to subNoteEvt.
//
// Two things were measured and rejected here: a 128-sample hop (finer timing, but 2-5x the false onsets, kick F 0.21-0.61
// against 0.73 at 512) and integrating each band over several hops (it smears the attack; kick F fell from 0.71 to 0.52).
import { Band, RunMedian, Quantile, clamp01 } from './dsp.js';

export const PHOP = 512;             // the analysis hop, in samples (11.6 ms at 44.1 kHz, 10.7 ms at 48 kHz)
// BANDS[2] is the LOW LANE's own band and nothing else reads it (map.js leaves it out of every energy sum as a
// duplicate of 22-70 + 70-150). §68 moved it 40-150 -> 60-150: a 4th-order high-pass at 40 Hz passes a D#1 / F#1
// 808 drone (38.9 / 46.3 Hz) at full level, so on Vienna the lane's band WAS the drone and the kick a soft thud
// inside it. 60 Hz puts the two fundamentals 15 and 9 dB down and still clears the 150-800 Hz rim / clap.
export const BANDS = [[22, 70], [70, 150], [60, 150], [150, 600], [150, 2500], [2500, 8000], [5000, 12000]];
// the four low bands need steep skirts (the sub, the bass and the kick band are within an octave of each other and of the
// 150-600 Hz harmonic band that `subPure` divides by); the three upper bands are more than two octaves wide, so wide is fine
export const BAND_KIND = ['steep', 'steep', 'steep', 'steep', 'wide', 'wide', 'wide'];
export const B_SUB = 0, B_LOWBASS = 1, B_KICK = 2, B_HARM = 3, B_SNARE = 4, B_CLICK = 5, B_HAT = 6;
export const INT_N = [1, 1, 1, 1, 1, 1, 1];      // hops each band integrates (measured: > 1 smears the attack and costs F)
export const MED_N = 9;              // the harmonic median window, in hops (~105 ms)
export const THR_K = 3.0;            // flux threshold = running mean + THR_K * running deviation of the band's flux
export const THR_FLOOR = [1.2, 1.2, 1.2];        // ... and never under this many dB, per class (kick, snare, hat).
// [0] is DEAD since §68 and [1] since §69: neither the low nor the snare lane uses `fire()` at all, and `thrK` now
// reaches the HAT alone. Kept so the three arrays stay class-indexed.
export const CLICK_FLOOR = 1.0;      // the same floor for the beater-click band
// A kick also has a BODY: 150-600 Hz rises with it. A pure 808 (h/f 0.05 on this track) has none, so requiring the body as
// well as the beater is what separates a kick from an 808 note start far better than the 2.5-8 kHz click alone (hats fire
// every ~0.1 s, so a 15-25 ms click window catches one by luck a quarter of the time).
export const BODY_REQ = false;    // measured: requiring the body cost F (0.73 -> 0.62) without reliably cutting bare hits
export const BODY_FLOOR = 0.8;
export const BODY_W = 0.035;         // the body may lag the beater: a kick's 150-600 Hz thud decays over tens of ms
// per-class refractory (s); [0] is the LOW lane's (fireLow, §68) and [1] the SNARE lane's (fireSnare, §69).
// [1] 0.060 -> 0.075: a rise against an 8-hop baseline still reads ~7/8 of itself on the hop after a hit, so the
// lane needs the refractory explicitly. Swept (§69): 0.060 costs 0.045 of the mean F, 0.070 / 0.075 / 0.085 / 0.100
// are equal to three decimals. 0.075 is the shortest of those — 0.085 would block a 16th above 176 BPM, and no
// track here goes there, which is exactly why the margin is taken on the material we do not have.
export const REFRACT = [0.085, 0.075, 0.045];
// The beater window. The truth tool's own definition is 15 ms; measured on SeeYouDrop, 15 ms gives kick F 0.37 on 25-45 s with
// 6.0 % of kicks on a truth bare808 (chance is 5.3 %: a 15 ms window around 275 bare onsets covers 5.3 % of 157 s), and 25 ms
// gives F 0.73 with 12.6 %. 25 ms is chosen: it matches the truth's kick COUNT (207 against 229) and gives a usable channel.
export const CLICK_W = 0.025;
// THE KNOBS (§90): the beater gate's two constants as a mutable object so a node tool (PERCK='{"clickW":0.035}' in
// drums-node.js) or the page (&clickw=<ms> / &clickf=<dB>, core/harness.js) can A/B them on the FIRST ears instance — the one
// the scenes read; `o` in the constructor still wins per instance (the tuning sweeps' second instance).
export const PERCK = { clickW: CLICK_W, clickFloor: CLICK_FLOOR,
  // THE CLOCK-LINE RULE (§90, IBelongHere 0:47): a CLICKLESS low onset is a kick when it lands ON the PCM clock's beat line —
  // |phase - round(phase)| < linePh beat with the clock's confidence >= lineConf — read through `PercTrack.line` (a hook the
  // clock stage attaches: clock.js lineHook(); null in a bare PercTrack = the rule is off). lineSub 2 = the 8th line too.
  // Measured first offline (tools/work/v90/linesim.py on the six truth tracks, the base traces joined with the clock's):
  // IBelongHere's soft deep-house kick under its A1 pedal has no beater click inside 45 ms (CLICK_W 35 / 45 ms lift its kick
  // recall 0.40 -> 0.42 and cost SeeYouDrop P 0.79 -> 0.66), while the low lane hears 90 % of it; on the line at this gate
  // the kick lane reads F 0.55 -> 0.67 and every other track's F rises too (CyborgNinja 0.90 -> 0.95), with 3.9 % of
  // SeeYouDrop's kicks on a bare 808 note start (§68's guard: 6 %). The 8th line reads 0.70 on IBelongHere but 17 % of
  // SeeYouDrop's kicks on 808 notes — a knob, off. lineKick 0 / &kline=0 = the §68-§69 lane exactly.
  lineKick: 1, linePh: 0.06, lineConf: 0.85, lineSub: 1 };
export const ONSET_OFS = 0.5;        // the onset's audio time is (hop end) - ONSET_OFS * hopDur: the transient sits inside the hop
// ... minus a fixed ONSET_LAG. The hop-centre guess above is not enough: the flux at hop i is the RISE from hop i-1 to
// hop i, so a transient that starts anywhere inside hop i-1 is only visible at hop i, and the residual is a LAG, not a
// fraction of a hop. Measured against the truth's onsets (tools/test_ears.js "onset time error vs truth", median over
// the whole track): with ONSET_LAG 0 the causal path is kick +6 / snare +6 / hat +6 ms at 44.1 kHz and +9 / +5 / +5 at
// 48 kHz — near-constant in MILLISECONDS across the two hop lengths, which is why the correction is in seconds.
export const ONSET_LAG = 0.006;
export const DEN_WIN = 1.0;          // den* window (s)
// Ignore flux while a band sits this far under its own running p90 level.
// §73 −34 -> −54. The number is NOT a new judgement about how quiet is quiet: it is the OLD judgement re-expressed
// against a reference that has moved. Until v0.25 `lvl[i]` settled on the band's p10 (dsp.js's swapped weights), so
// the gate sat at p10 − 34 dB and §68 measured it to be a no-op — "swept with and without and on three bands,
// identical to every digit, so it costs nothing and still protects a silent band's noise floor". With the sign
// right `lvl[i]` is the p90, which on this material is 10-30 dB above the p10 per band, so the SAME offset suddenly
// had teeth: it blocked 0.0-24.2 % of hops instead of 0.0-1.1 %, and cost SeeYouDrop 4 of its 192 kicks in the
// ducked 51-56 s bar before drop 1 (kick F 0.40 -> 0.38 against `low`, 0.50 -> 0.48 against `click`) — real hits in
// a high-passed build-up, which is the one thing the gate must not eat. Swept −34 / −44 / −54: of the 60 rows in
// the five-track drum table (5 tracks x {ears, v2} x {kick,snare,hat} x their references), −34 moves 22 rows with
// |dF| up to 0.02, −44 moves 8 with one dF, and **−54 moves 6 rows by 1-3 fires with every F identical**. −54 is
// therefore the offset that keeps §68's measured posture: insurance against a silent band's noise floor, costing
// nothing, now measured from the loud level the comment has always named.
export const GATE_DB = -54;
export const FM_A = 0.02;            // the flux mean / deviation smoothing per hop (~0.6 s)

// ---------------------------------------------------------------------------------------------------------------
// THE LOW LANE (DECISIONS §68). Classes 1 and 2 (snare, hat) keep the HPSS-lite flux above. Class 0 — the LOW lane,
// which feeds `kickEvt` / `kickAge` / `kickVel` / `denK` and (through the `low` stream) the reactive drums' `kick2` —
// does NOT, because a running median of the whole band's level cannot see a kick that a continuous sub drone masks.
// Measured on Vienna (90 BPM, a continuous D#1 / F#1 808 drone with NO pulse and a soft thud on beats 1 and 3,
// §66 Q1): the old lane's AUC against the kick lines was 0.511 — chance — and it fired 550 times for 336 kicks at
// P 0.12. The reason is the ONSET FUNCTION, not only the band: `flux = res[i] - res[i-1]` with
// `res = dB - median9(dB)` is a ONE-HOP difference of a median residual, and both halves fail here — the median
// tracks the drone's own slow wobble, and a thud whose attack spans two or three 10.7 ms hops shows only a fraction
// of its rise in any single one of them.
// The lane is now the band's RISE over a short LOCAL baseline: `rise = dB[i] - mean(dB[i-1 .. i-KICK_BASE])`,
// half-wave rectified, against an ABSOLUTE floor in dB. Three properties earn each piece:
//   · a MEAN of the last ~85 ms, not a median of the whole mix: a steady drone contributes the same level to the hop
//     and to its own baseline, so it cancels, while a thud's whole rise shows at once (Vienna AUC 0.511 -> 0.713).
//   · an ABSOLUTE dB floor, with NO adaptive `fm + k*fd` term: a rise is a RATIO, so one number travels across
//     tracks and loudnesses. The adaptive term is what used to cost the recall — on CyborgNinja its own kicks
//     inflate `fd` and suppress the quieter ones (swept: k 3.0 takes CyborgNinja R 0.96 -> 0.53 at the same floor).
//   · the same 85 ms refractory as before, which the rise also enforces by itself: for KICK_BASE hops after a hit
//     the baseline contains the hit, so the rise is negative and rectifies to 0.
// Swept on five tracks against tools/truth/<T>.kick.json (the offline 60-150 Hz rise at the truth beat grid, built
// by tools/truth/kicktruth.py — §66's own method): the floor plateaus over 4.5-6.0 dB (mean F .594 / .605 /
// .604 / .596) and the baseline over 7-9 hops (.589 / .605 / .600), and 10 hops breaks CyborgNinja (P .80).
// 60-150 Hz beats 40-150 (mean F .605 vs .570), 70-150 (.595) and 60-120 (.571).
export const KICK_BASE = 8;          // hops of local baseline the rise is measured against (85 ms at 48 kHz, 93 at 44.1)
export const KICK_RISE = 5.0;        // dB: the rise that IS a low onset. No adaptive term — see above.
// The lane's own onset lag, replacing ONSET_LAG for class 0. A rise against an 85 ms baseline needs the hop to be
// most of the way up before it clears 5 dB, where a 1.2 dB flux floor cleared on the hop that merely CONTAINED the
// attack: measured against the kick truth, the raw median lag went +11/+7/+10/-4/-1 ms (SeeYouDrop / CyborgNinja /
// WhoLikesToParty / Malicious / Vienna) to +14/+9/+12/+3/+13 at ONSET_LAG. The extra 6 ms puts the lane back on the
// flux lane's own clock; like ONSET_LAG it is in SECONDS because the residual is near-constant in milliseconds.
export const KICK_LAG = 0.012;

// ---------------------------------------------------------------------------------------------------------------
// THE SNARE LANE (DECISIONS §69). Class 1 — which feeds `snareEvt` / `snareAge` / `snareVel` / `denS` and DUST's
// flash ring — leaves the HPSS-lite flux for the same reason class 0 did, and for a second one of its own.
//   · the FUNCTION. §64 proved the running median lags a swell on the HIGH band, and the MID band is where the
//     pads, the arps and the reverb tails live: on Vienna the old lane fired 663 times = 3.44 /s against a groove
//     of 1.83 rim / clap / kick-body hits a second, at P 0.22 against the truth `mid` and P 0.37 against §66's own
//     hand-built rim/clap list. A rise over a short LOCAL MEAN cancels a steady layer and shows a stick whole.
//   · the BAND, and why it is TWO. A snare is a body (150-600 Hz) and a noise (up to ~2.5 kHz) at once, and the two
//     references disagree about which band to grade on because each was built on one of them: the truth's `mid` is
//     a 150-2500 Hz list and §69's grid reference a 150-800 Hz one. Measured against BOTH (mean F over the five
//     tracks, mid + snare): 150-2500 alone .647 + .570, 150-600 alone .571 + .594, a new 150-800 filter .615 +
//     .601 — and the plain MEAN of the two EXISTING bands' rises .621 + .609, the best sum of the lot and the only
//     candidate near the top on both. It also needs no new filter: B_HARM and B_SNARE are already in the bank.
//     (MAX of the two is a union and keeps the loose band's false fires, mid .586; MIN is a hard AND and costs
//     CyborgNinja's recall, .628 + .573. The weight sweep 0 / .25 / .4 / .5 / .6 / .75 / 1 plateaus at .25-.6, so
//     the plain half-and-half is the centre, not a fit.)
// Each band's rise is RECTIFIED BEFORE the mean, and level-gated like the flux lane, so a band that is falling
// contributes 0 rather than cancelling the other; measured against the other order, identical to three decimals.
export const SNARE_BASE = 8;         // hops of local baseline, as KICK_BASE (85 ms at 48 kHz). Swept 6 / 7 / 8 / 9:
                                     // the sum of the two mean Fs reads 1.270 / 1.275 / 1.270 / 1.194 — one number
                                     // for both lanes, inside the plateau.
// dB: the mean rise that IS a snare. No adaptive `fm + k*fd` term, for §68's reason — a rise is a RATIO, so one
// number travels. (Swept here too: k 1 buys 0.02 and k 3 takes CyborgNinja's recall 0.57 -> 0.40.) The floor
// plateaus over 3.5-4.25 dB (sum 1.262 / 1.270 / 1.275 / 1.275); 3.75 is the end of it where CyborgNinja keeps the
// most recall (0.57 against 0.55 at 4.0) and Vienna fires closest to its own rate (1.25 /s against a truth 1.83).
export const SNARE_RISE = 3.75;
// The lane's own onset lag, replacing ONSET_LAG for class 1 — KICK_LAG's story on the mid band. Measured against
// the truth `mid`, the median lag per track at ONSET_LAG is +3 / +5 / +5 / +5 / +4 ms; the extra 4 ms puts it at
// -1 / +1 / +1 / +1 / 0, mean +0.4 ms, which is the OLD lane's own mean to the digit (§58: "ears +0").
export const SNARE_LAG = 0.010;

// ---------------------------------------------------------------------------------------------------------------
// THE HIT'S SIZE: `kickAmp` / `snareAmp` (DECISIONS §70). The two rise lanes already know how hard a hit was — the
// rise itself, in dB — and `kickVel` / `snareVel` divide that rise by `p95[c]`, a RUNNING quantile of the lane's own
// fire magnitudes. In v0.25 that divisor was the lane's **p5**, not its p95, because `dsp.js`'s `Quantile` had its
// two weights swapped and settled on the (1 − q) quantile: the snare lane's estimator sat at 3.86–4.41 dB against a
// true-hit p95 of 7.7–23.1 dB, so 52–91 % of the five tracks' hits read exactly 1.000. That is §51's "the velocity
// saturates, p50 1.0", and §73 fixed it at the source — `*Vel` now spreads p10 0.18-0.63 / p50 0.43-0.76 with
// 7-20 % at the ceiling, which is `*Amp`'s own spread to the digit.
//
// `*Amp` IS STILL THE SIZE A SCENE SHOULD READ, and §73 measured why: `*Vel`'s divisor is a running quantile of
// THIS TRACK's fire magnitudes, so the same 12 dB snare reads 1.00 on Malicious (fire-stream p95 7.5 dB) and 0.55
// on WhoLikesToParty (21.8 dB) — it answers "how hard for this track", which is the right question for a RANK and
// the wrong one for a SIZE that has to look the same on every track. `*Amp` is the rise over a fixed dB SPAN, so
// one absolute mapping travels. Both are published; nothing in §73 moved a scene.
//
//     amp = clamp01(rise_dB / SPAN)
//
// — §68's own principle, one band up: a rise is a RATIO, so one absolute dB number travels across tracks and
// loudnesses. SPAN is each lane's MEDIAN TRACK'S p95 rise at a TRUE hit, rounded (`tools/work/v70/ampsweep.js`,
// every lane fire over the whole of all five tracks matched to `tools/truth/<T>.{snare,kick}.json` at ±50 ms):
//
//   snare, true-hit rise p95 per track 11.9 / 19.4 / 23.1 / 7.7 / 9.0 dB (SeeYouDrop / CyborgNinja /
//     WhoLikesToParty / Malicious / Vienna) → median 11.9 → SPAN 12
//   low,   16.5 / 23.2 / 37.3 / 9.6 / 10.7 dB → median 16.5 → SPAN 16
//
// What that buys, pooled over the five tracks' true hits: snare amp p10 0.34 / p50 0.54 / p95 1.00 with 17 % at the
// ceiling; low 0.34 / 0.55 / 1.00 with 26 %. Per track the p95 reads 0.99 / 1.00 / 1.00 / 0.65 / 0.75 (snare) and
// 1.00 / 1.00 / 1.00 / 0.60 / 0.67 (low) — one absolute mapping cannot put a 7.7 dB track and a 23 dB track both at
// 1, and the median track is the honest centre of that spread. The two SPANs are NOT independently fitted: each
// lane's own FLOOR is 0, so each lane's own threshold maps to itself over the span — 3.75/12 and 5.0/16 are both
// **0.3125**, so "a hit that only just fired" is the same 0.31-sized hit in both lanes and the two channels are
// directly comparable. (Swept: snare SPAN 10 / 12 / 14 / 16 puts the threshold at 0.38 / 0.31 / 0.27 / 0.23 and the
// ceiling share at 23 / 17 / 13 / 9 %; 12 is where the threshold IS the brief's "a soft hit ≈ 0.3". A FLOOR term was
// swept too — 1, 2, 2.5, 3 dB — and only pushes a threshold hit toward invisibility, which is the one thing a
// lane-only trigger must not do.)
export const SNARE_AMP = 12;         // dB of rise that IS a full-sized snare
export const KICK_AMP = 16;          // ... and a full-sized kick
// There is no `hatAmp`: the HAT is the one class still on the HPSS-lite flux (§69), whose onset function is a one-hop
// difference of a median residual and not a rise in dB, so it has no comparable magnitude to publish. `hatVel` keeps
// its meaning and its saturation.

export class PercTrack {
  // `o` overrides the constants above (thrK, thrFloor, refract, clickW, gateDb, clickFloor, intN, medN, the low
  // lane's kickBase / kickRise / kickLag / kickAmp and the snare lane's snareBase / snareRise / snareLag /
  // snareAmp) — the tuning
  // sweeps use it, the page does not.
  constructor(sr, o = {}) {
    this.sr = sr;
    this.thrK = o.thrK === undefined ? THR_K : o.thrK;
    this.thrFloor = o.thrFloor || THR_FLOOR;
    this.refract = o.refract || REFRACT;
    this.clickW = o.clickW === undefined ? PERCK.clickW : o.clickW;
    this.gateDb = o.gateDb === undefined ? GATE_DB : o.gateDb;
    this.onsetLag = o.onsetLag === undefined ? ONSET_LAG : o.onsetLag;
    this.clickFloor = o.clickFloor === undefined ? PERCK.clickFloor : o.clickFloor;
    this.kBase = Math.max(1, o.kickBase === undefined ? KICK_BASE : o.kickBase | 0);
    this.kRise = o.kickRise === undefined ? KICK_RISE : o.kickRise;
    this.kickLag = o.kickLag === undefined ? KICK_LAG : o.kickLag;
    this.sBase = Math.max(1, o.snareBase === undefined ? SNARE_BASE : o.snareBase | 0);
    this.sRiseThr = o.snareRise === undefined ? SNARE_RISE : o.snareRise;
    this.snareLag = o.snareLag === undefined ? SNARE_LAG : o.snareLag;
    this.sAmp = o.snareAmp === undefined ? SNARE_AMP : o.snareAmp;
    this.kAmp = o.kickAmp === undefined ? KICK_AMP : o.kickAmp;
    this.line = null;                              // §90: the clock-line hook, (t) -> { phase, conf } (clock.js lineHook())
    this.bodyReq = o.bodyReq === undefined ? BODY_REQ : o.bodyReq;
    this.bodyFloor = o.bodyFloor === undefined ? BODY_FLOOR : o.bodyFloor;
    this.bodyW = o.bodyW === undefined ? BODY_W : o.bodyW;
    this.intN = o.intN || INT_N;
    const medN = o.medN === undefined ? MED_N : o.medN;
    this.b = BANDS.map(([lo, hi], i) => new Band(sr, lo, hi, 2, BAND_KIND[i]));
    this.n = 0; this.hopDur = PHOP / sr;
    this.e = new Float32Array(BANDS.length);       // the integrated mean power per band (intN hops)
    this.e1 = new Float32Array(BANDS.length);      // ... and the newest hop alone
    this.hbuf = BANDS.map((_, i) => new Float32Array(this.intN[i]));
    this.hk = new Int32Array(BANDS.length);
    this.db = new Float32Array(BANDS.length);
    this.med = BANDS.map(() => new RunMedian(medN));
    this.res = new Float32Array(BANDS.length);     // the percussive residual, dB
    this.prev = new Float32Array(BANDS.length);
    this.flux = new Float32Array(BANDS.length);
    // §73: the sign fix made this the p90 it is named for. The step is NOT re-fitted — the weights set which
    // DIRECTION is fast, not how fast: the fast leg was step*(1-q) = 0.045 dB/hop down and is now 0.045 dB/hop up,
    // so "~3 s at the 86 Hz hop" still holds, as a peak follower instead of a floor follower. Measured per band
    // over the five tracks, the estimator's own p50 now lands within 0.1-2.4 dB of the track's TRUE p90 (it used to
    // land within 0.1-8.0 dB of the true p10). What DID have to move is `GATE_DB`, the offset read off it — see
    // its own note above.
    this.lvl = BANDS.map(() => new Quantile(0.9, 0.05, 'abs'));      // dB: absolute step, ~3 s at the 86 Hz hop
    this.fm = new Float32Array(BANDS.length);
    this.fd = new Float32Array(BANDS.length);
    // §73: `*Vel`'s divisor, and the one consumer whose CONSTANT had to move with the sign. `p95[c]` is pushed only
    // AT A FIRE, so its stream is a few hundred values per track, and the step has to carry it across the whole
    // range of a lane's fire magnitudes. The old sign made the fast leg DOWNWARD (step*(1-q) = 0.019 dB/fire) and
    // the trip short — from the 16-fire warm-up mean down ~2 dB to the p5 — so 0.02 settled in ~100 fires. With the
    // sign right the trip is UPWARD to the p95, 5-30 dB, which 0.019 dB/fire cannot finish inside a track: at 0.02
    // the estimator still read 7.9 / 15.6 / 25.3 / 8.2 / 6.8 dB against a true fire-stream p95 of 16.5 / 23.2 /
    // 36.5 / 9.1 / 10.2 (the low lane, the five tracks) and 45 % of hits still saturated. **0.2** — the same
    // 1/(rate x settling time) rule with the real distance — puts the estimator within 9-19 % of the true p95 on
    // every lane and track (tools/work/v73/sweep.js p95). Swept 0.02 / 0.05 / 0.1 / 0.2 / 0.4 / 0.8: the ceiling
    // share over the five tracks' TRUE hits falls 39-93 % -> 37 -> 27 -> **7-20 %** -> 5-15 -> 5-11, and past 0.2
    // the estimator starts over-tracking the top so the loudest hits no longer reach 1.000 at all (vel p90 0.88-0.99
    // on three tracks at 0.4). 0.2 is the end of the plateau where a `*Vel` of 1 still MEANS the top of the lane.
    this.p95 = [0, 1, 2].map(() => new Quantile(0.95, 0.2, 'abs'));
    this.vel = new Float32Array(3);
    this.amp = new Float32Array(3);                // the rise lanes' own unsaturated size, 0-1 (§70; [2] is always 0)
    this.den = new Float32Array(3);
    this.kbuf = new Float32Array(this.kBase); this.kk = 0; this.kn = 0;   // the low lane's local baseline ring (dB)
    this.rise = 0;                                 // ... and this hop's rise above it, half-wave rectified (dB)
    this.sbufH = new Float32Array(this.sBase);     // the snare lane's two local baseline rings (dB): 150-600 ...
    this.sbufS = new Float32Array(this.sBase);     // ... and 150-2500
    this.sk = 0; this.sn = 0;
    this.sRise = 0;                                // ... and this hop's MEAN of the two rectified rises (dB)
    this.hist = [[], [], []];                      // onset times per class, last DEN_WIN s
    this.last = [-9, -9, -9]; this.lastLow = -9;   // ... and the LOW lane's own last fire (bare 808s never reach emit)
    this.clickT = -99; this.bodyT = -99; this.pendKick = null;
    this.out = [];                                 // onsets found since the last take()
  }
  // one input sample and its audio time; runs an analysis hop every PHOP samples
  step(x, t) {
    const b = this.b;
    for (let i = 0; i < b.length; i++) b[i].power(x);
    if (++this.n < PHOP) return;
    this.frame(t);
  }
  take() { const o = this.out; this.out = []; return o; }

  frame(t) {
    const nb = BANDS.length, n = this.n; this.n = 0; this.hopDur = n / this.sr;
    for (let i = 0; i < nb; i++) {
      const e1 = this.b[i].take(n); this.e1[i] = e1;
      const N = this.intN[i], hb = this.hbuf[i];
      hb[this.hk[i]] = e1; this.hk[i] = (this.hk[i] + 1) % N;
      let e = 0; for (let q = 0; q < N; q++) e += hb[q];
      e /= N; this.e[i] = e;
      const d = 10 * Math.log10(e + 1e-12); this.db[i] = d;
      const h = this.med[i].push(d); this.res[i] = d - h;
      const p = this.lvl[i].push(d);
      let fl = this.res[i] - this.prev[i]; this.prev[i] = this.res[i];
      if (fl < 0) fl = 0;
      if (d < p + this.gateDb) fl = 0;             // a band far below its own loud level cannot produce an onset
      this.flux[i] = fl;
      this.fm[i] += (fl - this.fm[i]) * FM_A; this.fd[i] += (Math.abs(fl - this.fm[i]) - this.fd[i]) * FM_A;
    }
    // THE LOW LANE (§68): the 60-150 Hz band's rise over the mean of the PREVIOUS kBase hops, rectified. Read from
    // the ring before this hop joins it, so the baseline is strictly the local past; silent until the ring is full.
    {
      const d = this.db[B_KICK], kb = this.kbuf, KB = this.kBase;
      let r = 0;
      if (this.kn >= KB) { let s = 0; for (let q = 0; q < KB; q++) s += kb[q]; r = d - s / KB; }
      // the same gate the flux lane uses: a band far below its own loud level cannot produce an onset
      if (d < this.lvl[B_KICK].v + this.gateDb || r < 0) r = 0;
      this.rise = r;
      kb[this.kk] = d; this.kk = (this.kk + 1) % KB; if (this.kn < KB) this.kn++;
    }
    // THE SNARE LANE (§69): the MEAN of the 150-600 and 150-2500 bands' rises over the mean of the PREVIOUS sBase
    // hops, each rectified and level-gated first. Same ring discipline as the low lane's: read before this hop
    // joins it, silent until the ring is full.
    {
      const SB = this.sBase, bh = this.sbufH, bs = this.sbufS, dh = this.db[B_HARM], ds = this.db[B_SNARE];
      let r = 0;
      if (this.sn >= SB) {
        let sh = 0, ss = 0;
        for (let q = 0; q < SB; q++) { sh += bh[q]; ss += bs[q]; }
        const rh = dh < this.lvl[B_HARM].v + this.gateDb ? 0 : Math.max(0, dh - sh / SB);
        const rs = ds < this.lvl[B_SNARE].v + this.gateDb ? 0 : Math.max(0, ds - ss / SB);
        r = 0.5 * (rh + rs);
      }
      this.sRise = r;
      bh[this.sk] = dh; bs[this.sk] = ds; this.sk = (this.sk + 1) % SB; if (this.sn < SB) this.sn++;
    }
    const ot = t - ONSET_OFS * this.hopDur - this.onsetLag;
    const otK = t - ONSET_OFS * this.hopDur - this.kickLag;     // the low lane's own clock (KICK_LAG, not ONSET_LAG)
    const otS = t - ONSET_OFS * this.hopDur - this.snareLag;    // ... and the snare lane's (SNARE_LAG)
    // the click band decides what a low onset was
    if (this.flux[B_CLICK] > Math.max(this.fm[B_CLICK] + this.thrK * this.fd[B_CLICK], this.clickFloor)) this.clickT = ot;
    if (this.flux[B_HARM] > Math.max(this.fm[B_HARM] + this.thrK * this.fd[B_HARM], this.bodyFloor)) this.bodyT = ot;
    const clicked = ot - this.clickT <= this.clickW && (!this.bodyReq || ot - this.bodyT <= this.bodyW);
    // a low onset held from an earlier hop: confirm it as a kick if the beater has arrived since
    if (this.pendKick !== null) {
      const pk = this.pendKick;
      // §90: a hold that was already emitted on the clock's line becomes a clicked kick in place (the flag drops, so the clock
      // takes it at this hop — exactly when the pre-§90 lane emitted it); a hold that was not is emitted now, as before
      if (clicked) { if (pk.e) pk.e.line = false; else this.emit(0, pk.t, pk.vel, pk.amp); this.pendKick = null; }
      else if (ot - pk.w > this.clickW) this.pendKick = null;   // bare: it was an 808 note start (or stays a line kick)
    }                                             // (`w` is the hold's time on the CLICK band's clock, `t` its own)
    if (this.fireLow(otK)) {
      this.out.push({ type: 'low', t: otK, vel: this.vel[0], fl: this.rise });   // every low-band onset, kick or bare 808
                                                 // note start (fl: its rise in dB — the reactive drums' strength)
      if (clicked) this.emit(0, otK, this.vel[0], this.amp[0]);
      else {   // §90: on the clock's beat line it is a kick NOW (flagged `line`); the hold still waits for the beater either way
        const e = this.onLine(otK) ? this.emit(0, otK, this.vel[0], this.amp[0], true) : null;
        this.pendKick = { t: otK, w: ot, vel: this.vel[0], amp: this.amp[0], e };
      }
    }
    if (this.fireSnare(otS)) this.emit(1, otS, this.vel[1], this.amp[1]);
    if (this.fire(2, B_HAT, ot)) this.emit(2, ot, this.vel[2], 0);   // the hat has no rise, so no amp (§70)
    for (let c = 0; c < 3; c++) {
      const h = this.hist[c];
      while (h.length && t - h[0] > DEN_WIN) h.shift();
      this.den[c] = h.length / DEN_WIN;
    }
  }
  // §90: is audio time t on the PCM clock's beat line (or the 8th line with lineSub 2), with the clock confident? The clock
  // state is the previous block's (the clock stage runs after the ears), predicted to t by the hook; false without a hook.
  onLine(t) {
    const K = PERCK, L = this.line;
    if (!K.lineKick || !L) return false;
    const o = L(t);
    if (!o || !(o.conf >= K.lineConf)) return false;
    const p = o.phase * K.lineSub, w = p - Math.round(p);
    return Math.abs(w) < K.linePh * K.lineSub;
  }
  // the HAT's fire (class 2 is the only one left on the HPSS-lite flux since §69)
  fire(c, band, ot) {
    const fl = this.flux[band], thr = Math.max(this.fm[band] + this.thrK * this.fd[band], this.thrFloor[c]);
    if (fl <= thr || ot - this.last[c] < this.refract[c]) return false;
    this.vel[c] = clamp01(fl / (this.p95[c].push(fl) + 1e-6));
    return true;
  }
  // the LOW lane's own fire (§68): the rise against an absolute dB floor, no adaptive term. `vel[0]` keeps its
  // meaning — the onset's strength as a share of the lane's own running p95 — so `kickVel` is the same quantity.
  // The refractory is the LANE's (`lastLow`), not the confirmed kick's (`last[0]`, set only in `emit`): a bare 808
  // note start never reached `emit`, so under the old flux lane only the adaptive threshold held the low stream
  // apart, and a rise against a mean baseline needs the refractory explicitly — the hop after a hit still reads
  // ~7/8 of its rise, because the hit is only 1 of the 8 hops in that hop's own baseline. Measured: without it the
  // lane fires 1042 / 1035 / 2458 / 1796 / 412 times on the five tracks against 488 / 616 / 1155 / 821 / 290 with.
  fireLow(ot) {
    const r = this.rise;
    if (r <= this.kRise || ot - this.lastLow < this.refract[0]) return false;
    this.lastLow = ot;
    this.vel[0] = clamp01(r / (this.p95[0].push(r) + 1e-6));
    this.amp[0] = clamp01(r / this.kAmp);          // §70: the rise itself over an absolute dB span, no quantile
    return true;
  }
  // the SNARE lane's own fire (§69): the two-band mean rise against an absolute dB floor, no adaptive term.
  // `vel[1]` keeps its meaning — the onset's strength as a share of the lane's own running p95 — so `snareVel` is
  // the same quantity, now measured on the rise instead of the flux. Unlike the low lane this one needs no private
  // `last`: `emit(1)` is unconditional (a snare has no beater gate), so `last[1]` IS the lane's last fire.
  fireSnare(ot) {
    const r = this.sRise;
    if (r <= this.sRiseThr || ot - this.last[1] < this.refract[1]) return false;
    this.vel[1] = clamp01(r / (this.p95[1].push(r) + 1e-6));
    this.amp[1] = clamp01(r / this.sAmp);          // §70: as fireLow
    return true;
  }
  // `amp` RIDES THE EVENT (§70) instead of being read back from the ears' history ring, which is what `vel` does and
  // why `vel` is one hit stale on the release frame: an onset's audio time is (hop end) - half a hop - the lane's lag,
  // ~16 ms BEFORE the hop that found it, so a continuous field interpolated AT that time still holds the previous
  // hit's value. `snareAge` has always been exact for the same reason — it comes from the released event, not the ring
  // — and a SIZE that a scene reads on the frame it fires must be exact in the same way.
  // `line` (§90): the kick was promoted by the clock-line rule. The clock stage does NOT take it as a tick — it is on the line
  // by construction, so it would only confirm the clock's own phase (a self-locking loop; measured: Vienna's clock |p50|
  // 4.8 → 11.3 ms with them fed). The scenes' kick voice takes it like any kick.
  emit(c, t, vel, amp, line = false) {
    this.last[c] = t; this.hist[c].push(t);
    const e = { type: c === 0 ? 'kick' : c === 1 ? 'snare' : 'hat', t, vel, amp, line };
    this.out.push(e);
    return e;
  }
}
