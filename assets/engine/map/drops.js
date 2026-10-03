// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// Bar-pinned drops, defined by the WHOLE track, not by a causal "the bass came back" rule. A JS port of
// tools/truth/trackmap.py's E0 drops: on SeeYouDrop it must give 57.606 and 105.596 and NOTHING at 9-13 s (the sub's first
// entry at 12.815 is a layer entry into a quiet walk, which the "the bars after are among the track's loudest" gate rejects).
export const QUIET = 0.15;           // the low end counts as absent under this share of its own p90
export const MIN = 0.55;             // ... and as entered at or above this
// The 4 bars after a drop must reach this share of the track's p90 bar energy. An ABSOLUTE share, not a percentile of the
// distribution: a percentile moves with how much of the track is loud, and a p70 gate computed from a filter bank's band
// powers instead of an STFT landed at 0.883 and rejected drop 1's 0.857 by 3 %.
export const AFTER_MIN = 0.60;
// ... AND this share of its p90 percussive-onset density. THIS is what separates a drop from a loud bass layer entry:
// SeeYouDrop's walk at 12.8 s is as energetic as drop 1 (0.85 against 0.86 of the p90) because its sub is 68-79 % of the
// energy, but it has NO drums. An energy gate alone cannot tell them apart by any threshold; the density gate can.
export const DEN_MIN = 0.30;
export const DEN_W = 8;              // the density window, in bars: 4 bars put drop 2 (a gated section whose first two bars
                                     // the kick detector misses) at 0.31 and the walk at 0.19 — too close. 8 bars gives
                                     // 0.38 against 0.19.
export const JUMP = 0.25;            // clause 2: the sustained energy jump (next 4 bars - previous 4, normalised)
export const SOFT = 0.45;            // ... with the low end under this before it
export const REFRACT = 4;            // bars between drops

const pct = (a, q) => { const b = Array.from(a).sort((x, y) => x - y); return b[Math.max(0, Math.min(b.length - 1, Math.floor(q / 100 * b.length)))]; };

// `lowE` and `barE` are per-bar sums (length = nBars); `downbeats` has nBars + 1 entries.
// -> { drops: [t], why: ['absence'|'jump'], lrel, erel }
export function findDrops(lowE, barE, densE, downbeats) {
  const n = lowE.length;
  const lref = pct(lowE, 90) + 1e-12, eref = pct(barE, 90) + 1e-12;
  const lrel = new Float64Array(n), erel = new Float64Array(n);
  for (let i = 0; i < n; i++) { lrel[i] = lowE[i] / lref; erel[i] = barE[i] / eref; }
  const dref = pct(densE, 90) + 1e-12, drel = new Float64Array(n);
  for (let i = 0; i < n; i++) drel[i] = densE[i] / dref;
  const aft = new Float64Array(n), bef = new Float64Array(n), aftD = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0, k = 0;
    for (let j = i; j < Math.min(n, i + 4); j++) { s += erel[j]; k++; }
    aft[i] = s / Math.max(1, k);
    let d = 0, kd = 0;
    for (let j = i; j < Math.min(n, i + DEN_W); j++) { d += drel[j]; kd++; }
    aftD[i] = d / Math.max(1, kd);
    s = 0; k = 0; for (let j = Math.max(0, i - 4); j < i; j++) { s += erel[j]; k++; }
    bef[i] = k ? s / k : erel[0];
  }
  const drops = [], why = [];
  let last = -99;
  for (let i = 1; i < n; i++) {
    if (aft[i] < AFTER_MIN || aftD[i] < DEN_MIN || i - last < REFRACT) continue;
    const c1 = lrel[i] >= MIN && lrel[i - 1] < QUIET;
    const c2 = lrel[i] >= MIN && lrel[i - 1] < SOFT && aft[i] - bef[i] >= JUMP;
    if (c1 || c2) { drops.push(downbeats[i]); why.push(c1 ? 'absence' : 'jump'); last = i; }
  }
  return { drops, why, lrel: Array.from(lrel), erel: Array.from(erel), drel: Array.from(drel) };
}
