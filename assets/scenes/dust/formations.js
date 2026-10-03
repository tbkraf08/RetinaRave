// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// DUST — which shape the swarm pours into, and the memory that brings a section's shape back (§57 step 4).
//
// The four formations used to be a shuffle: every 64 kicks, jump 1..3 shapes on. They are the scene's reading of
// where the song is now, chosen from what the engine already knows:
//
//   0 sphere   the intro, and any stretch well under the track's running loudest — the cloud at rest
//   2 galaxy   the groove — three arms that shear a little on every beat
//   1 torus    the build — a ring whose tube thins to a wire through the void (shaders.js, step 3)
//   3 ribbon   the breakdown, or a lone voice — the waveform itself and nothing else
//
// and the drop BURSTS the torus into the galaxy: the one change allowed to land off the phrase line, with the
// re-pour on `dropEnv` the scene has always had.
//
// MEASURED, and the first thing measured was the field that was NOT used. `eM / eMax` looked like the way to read
// "low energy" without the track map — but `eMax` is the loudest `eM` seen LATELY and follows it: over SeeYouDrop
// 20-110 s the ratio reads p05 0.700, p25 0.972, p50 1.000 (`&map=0`), so it separates nothing. `lvl` is worse: the
// AGC flattens it (a quiet verse is as bright as the drop). What does separate, measured over SeeYouDrop 0-40 s per
// 4 s — `eM` 0.30 0.55 0.68 0.75 0.84 0.88 through the intro against 0.80-0.88 in the groove, `subGate` 0.14 0.00
// 0.00 0.78 1.00 1.00 (no sub at all for the first 12 s), `denK` 1.5 0.5 1.5 0.5 vs 2.0-2.3 — is the absolute `eM`
// and whether the bass is sounding at all. The honest dynamic-range work (`eM` against the TRACK's peak, not a
// running one) is pass 2; this is what pass 1 can measure.
//
// No new shapes in pass 1: these are the four the scene has always had.

export const SPHERE = 0, TORUS = 1, GALAXY = 2, RIBBON = 3;

// Where each shape keeps its MID band, in scene units (§58 task A). A grain's band rank is now its radius
// (shaders.js form()), so the mid band is a shell, and this is that shell's radius at the band weight's own centre
// (`wMid` peaks at fx = .46, which is band rank .594):
//   sphere  1.05 * (.05 + .95 * cbrt(.594))          = 0.89
//   torus   1.1 + .38 * cos(pi * (1 - .594))         = 1.21
//   galaxy  sqrt(.594) * 1.7 + .05                   = 1.36
//   ribbon  (.02 + .98 * .594) * 1.9                 = 1.14
// The snare's ring is launched from HERE rather than from the origin, so it lands on the body on the hit's own frame
// instead of when a shell expanding from nothing happens to arrive (0.24 s in the sphere, 0.21 s in the torus).
export const MIDR = [0.89, 1.21, 1.36, 1.14];

// The mid-band radius of the shape on screen — the pour's own mix of the two it is between.
export function midR(a, b, tt) {
  return MIDR[a] + (MIDR[b] - MIDR[a]) * Math.max(0, Math.min(1, tt));
}

// The thresholds, each read off tools/work/d/syd-*.json and cn-*.json (SeeYouDrop 20–110 s and CyborgNinja
// 20–80 s, `&map=0`) — see docs/workers/DUST-OVERHAUL-PASS1.md for the distributions they come from.
export const K = {
  build: 0.35,     // buildLive above this is the void: the torus
  lone: 1.6,       // no sub sounding AND fewer than this many kicks a second is a lone voice: the ribbon
  low: 0.74,       // eM below this is quiet for this track: the sphere
};

// Which shape the music is asking for right now. A pure function of MS — no state, no hysteresis: the CALLER only
// asks on a seam (grid.js), so the answer is only ever read four or five times a minute and cannot chatter.
export function shapeFor(MS) {
  if (MS.buildLive > K.build) return TORUS;
  if (!MS.subGate && MS.denK < K.lone) return RIBBON;
  if (MS.eM < K.low) return SPHERE;
  return GALAXY;
}

// The section memory. The director already files each scene's `look` per section and restores it on a return
// (CONTRACTS §1.11), but that lands at the next soft switch, a few beats after the boundary; the bar store's
// `barReturnEvt` lands on the return's FIRST bar. So the scene keeps the same memory under the same key
// (`sectionAlt`) and pours back the moment the store recognises the material.
//
// MEASURED, and it is why there is a fallback: `sectionAlt` never repeats on either test track (SeeYouDrop
// 20-110 s 2 -> 3 -> 4 -> 5, CyborgNinja 20-80 s 1 -> 2 -> 3), and `sectionReturn` is 0 for every frame of
// SeeYouDrop while `barReturnEvt` fires twice (90.35 s, 107.67 s). So the return signals exist but the key does not
// say WHICH earlier material is coming back. The sectionAlt entry is the contract and is used when it is there;
// otherwise the return pours into the last shape filed under a DIFFERENT section — the shape we had before the one
// we are leaving, which is what "a return of material from at least 8 bars back" means when nothing names it.
export function mkMem() { return { by: {}, alt: -2, last: -1, lastAlt: -2, prev: -1 }; }

export function file(M, MS, shape) {
  const k = MS.sectionAlt;
  if (k < 0) return;
  M.by[k] = shape;
  if (k !== M.lastAlt) { M.prev = M.last; M.lastAlt = k; }
  M.last = shape;
}

// -1 = nothing to go back to.
export function recall(M, MS) {
  const k = MS.sectionAlt;
  if (k >= 0 && M.by[k] !== undefined) return M.by[k];
  return M.prev;
}

// Did the section just change, and is this new one a return of an earlier one? `barReturnEvt` is the bar store's
// answer on the first bar; `sectionReturn` is synapse's, a few beats later — either will do, and the memory makes
// the second a no-op when the first already acted.
export function returning(M, MS) {
  const alt = MS.sectionAlt;
  const changed = alt !== M.alt;
  M.alt = alt;
  return MS.barReturnEvt || (changed && MS.sectionReturn > 0.5);
}
