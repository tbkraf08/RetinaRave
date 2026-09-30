// DUST — dynamic range: "quiet is quiet, loud is loud" (DECISIONS §60 step 1).
//
// What it replaces. The cloud's whole brightness was `(.5 + 1.1 * lvl)`, and `lvl` is AGC-normalised: measured over
// SeeYouDrop 20–110 s `&map=0` it reads p05 0.513 / p50 0.882 / p95 0.992, i.e. a 1.5x swing over a track whose
// breakdown is silence with one pad in it and whose drop is the loudest thing on the record. §57 tried `eM / eMax`
// instead and measured it useless (`eMax` is the loudest `eM` seen LATELY and follows it: ratio p25 0.972).
//
// So the reference is built HERE, in the scene, out of the one field that does separate: the absolute `eM`
// (medium-term energy, 2.5 s). A peak hold with an instant attack and a ~25 s release is the TRACK's own loud —
// long enough that a breakdown cannot drag it down inside the breakdown, short enough that a track which really
// does get quieter for a minute is eventually believed. Measured per 2.5 s over SeeYouDrop 20–110 s, `eM` reads
// 0.83–0.91 through the groove, 0.56–0.76 through the two breakdowns and 0.30–0.68 through the first twelve
// seconds of the track (§57's own intro figures) — a 3:1 spread the picture was throwing away.
//
// FLOOR is what stops an intro being blown up: without it the peak at second one IS the intro's own energy, the
// ratio is 1, and the quietest part of the track is drawn at full brightness. 0.70 is just under the resting `eM`
// of both test tracks' grooves (SeeYouDrop p25 0.789, CyborgNinja p05 0.796), so a normal track's groove sits at
// the top of the range from the first frame and only something genuinely quieter than a groove reads quiet.
//
// LO is where the range bottoms out: below 55 % of the track's peak the base of the cloud is at its floor. It is
// not 0, because an energy ratio of 0 is silence and `alive` already handles silence.

export const PK_REL = 25;        // s: the peak's release time constant (instant attack)
export const PK_FLOOR = 0.7;     // the peak can never sit below this — the intro guard
export const LO = 0.55;          // eM/peak at or under this reads fully quiet

// The gains. BASE is the cloud itself — the grains' own spectrum push and the ambient 0.22 — and it carries the
// whole range: at the groove's dyn ~0.88 it lands on 1.47, which is exactly what `(.5 + 1.1 * lvl)` was giving at
// the same moment (lvl p50 0.882), so a groove keeps the brightness the user has already signed off and everything
// quieter falls away from it. HIT is the three transient voices and the sub, and it barely moves: a quiet section's
// kick is still a kick (the brief), so the hits lose 24 % between the groove and the breakdown where the base loses
// 76 %. SZ is the same idea on the grain's own size, and CLOUD on the radius of the whole swarm.
export const BASE0 = 0.22, BASE1 = 1.42;
export const HIT0 = 1.05, HIT1 = 0.45;
export const SZ0 = 0.55, SZ1 = 0.45;
export const CLOUD0 = 0.82, CLOUD1 = 0.18;

export function mkDyn() { return { pk: PK_FLOOR, r: 1, dyn: 1 }; }

// The energy the peak is held on is the SLOW window plus half of whatever the FAST window hears above it:
// `eM + .5 · max(0, eS − eM)`. MEASURED, and this is why neither one alone will do. On `eM` (2.5 s) alone the drop
// is not the loud part of the track: over SeeYouDrop's drops the drive reads 0.75 and 0.70 against 0.91–0.94 through
// the groove, because a 2.5 s mean on the frame of a slam is still half-full of the void the slam came out of. On
// `max(eM, eS)` the drop is right (0.89 / 0.74) but the INTRO is wrong — 0.74 against the groove's 0.88, because
// the first bars of this track are sparse and loud-in-the-moment (`eS` 0.62 against `eM` 0.507 at 2–8 s), so the
// picture opened at almost full brightness. Half a vote to the fast window is the whole sweep's best trade
// (candidates in `tools/work/d2/sim.py`, all four simulated on the recorded music before anything was rendered):
//
//   drive, mean per section       intro 2–8   groove   break 1   void 1   drop 1   break 2   drop 2
//   eM alone                          0.39     0.91      0.53     0.18     0.75     0.70      0.70
//   eM + .5·(eS − eM)  <- this        0.57     0.90      0.51     0.16     0.83     0.67      0.73
//   max(eM, eS)                       0.74     0.88      0.48     0.14     0.89     0.62      0.74
//
// `dropEnv` / `rel` are the floor under the drive, for the same reason at a shorter timescale: a slam must never be
// dimmed by the silence it came out of.
export function dyn(D, dt, MS, rel) {
  const eM = Math.max(0, MS.eM || 0);
  const e = eM + 0.5 * Math.max(0, (MS.eS || 0) - eM);
  const fl = Math.max(PK_FLOOR, e);
  D.pk = e > D.pk ? e : fl + (D.pk - fl) * Math.exp(-dt / PK_REL);
  D.r = e / Math.max(D.pk, 1e-4);
  const d = Math.min(1, Math.max(0, (D.r - LO) / (1 - LO)));
  D.dyn = Math.min(1, Math.max(d, MS.dropEnv || 0, rel || 0));
  return D.dyn;
}
