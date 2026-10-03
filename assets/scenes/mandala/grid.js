// MANDALA — the beat state (DECISIONS §85, step 1 of the MANDALA overhaul; the pattern is DUST's §57 / §61 / §78).
//
// The kaleidoscope's wedge used to ROTATE on `flowMid · 0.11` and the mirror count N was re-drawn every 64 kicks — no
// beat grid at all, the shape DUST had before §57. Now:
//   · the wedge angle `rot` is `spin()` from assets/math/beatgrid.js — one angle, a closed form of `beatCount` / `beatPhase`
//     (§61's glide + raised-cosine accent peaking ON the beat, §66's wall-clock crest, §78's double-time accent on the
//     step's amplitude), so it cannot drift and the crest lands on the beat line within a frame. MANDALA's own step is
//     2pi/(N · WEDGE.PER): with PER 4 the picture turns ONE WEDGE PER BAR — the N arms land on the downbeat (DOWN's bigger
//     step is the downbeat's). The prompt's open question 1; its default taken, `&step=<beats per wedge>` is the knob
//     (1 = one wedge per beat, DUST's busyness).
//   · the fold's twist R and the fold constant c's phase advance on the same angle (`fold = rot · FOLD_K`), so the
//     fractal's morph is phase-locked to the grid too; `flow` stays only as c's slow drift underneath.
//   · N moves ONLY ON A SEAM THE BAR STORE CALLS: a bar that starts something new (`barNovelEvt`, through `trigger()`)
//     re-draws it, a return (`barReturnEvt`) restores the N the material had before. The draw is the seed hash the shader
//     had (`4 + 2·floor(5·hash(seed·5.7 + k))`, N in {4,6,8,10,12}); `k` counts the novel seams (the old 64-kick epoch).
//     The 16-beat phrase wrap is reported as a seam (`why` 1) but does NOT re-draw: measured first with the re-draw on
//     (§85), synapse's `seed` moves at its own section events — CyborgNinja 15–21 s, Vienna ~82 s — not at the truth's
//     lines, and the next phrase wrap turned each into an N change (CyborgNinja 20–80 s: 1, the control's receipt is 0).
//     Look memory (CONTRACTS §1.11) files N itself.
import { mkSpin, mkTrigger, spin, trigger } from '../../math/beatgrid.js';

const TAU = Math.PI * 2;
export const WEDGE = { PER: 4, MAX: TAU / 32 };   // beats per wedge (the step is 2pi / (N · PER)), capped at DUST's step; hooks.step()
export const FOLD_K = 1;           // the fold's phase (R's twist, c's advance) per radian of wedge angle: one cycle per N bars
// The step, capped: measured uncapped (§85), N = 4 gives 2pi/16 per beat — twice DUST's swing — and the per-beat jerk on
// CyborgNinja read 31.2 rad/s^2 against the receipt's 30 (Vienna 24–60 s 24.8); the profile is the same, the STEP is 2x.
// So the swing per beat is never more than DUST's: at N = 4 the picture lands every two bars, from N = 8 up every bar.
export const stepFor = (N, per = WEDGE.PER) => Math.min(TAU / (N * per), WEDGE.MAX);

// the shader's hash11, in double: the draw is a function of (seed, k) and nothing else
export function hash11(p) {
  p = p - Math.floor(p);
  p = (p * 0.1031) - Math.floor(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return p - Math.floor(p);
}
export const drawN = (seed, k) => 4 + 2 * Math.floor(hash11(seed * 5.7 + k) * 5);

export function mkGrid() {
  return { sp: mkSpin(stepFor(8)), trig: mkTrigger(), N: 0, prevN: 0, k: 0, nN: 0, why: 0, rot: 0, fold: 0 };
}

// N is set here and nowhere else (look.set() comes through setN too), so the step follows it
export function setN(G, n) {
  if (n === G.N) return false;
  G.prevN = G.N || n;
  G.N = n;
  G.nN++;
  G.sp.base = stepFor(n);          // spin() picks the new step up at the next beat line, continuously (beatgrid.js)
  return true;
}

// One frame: the seam, the draw, the angle. `why` is the seam's reason on the frame it fires (0 / 1 phrase / 2 novel /
// 4 return) whether or not N moved; `nN` counts the moves.
export function grid(G, MS, dt) {
  const seed = (MS.seed && MS.seed.a || 0) * 100;
  if (!G.N) { G.N = drawN(seed, 0); G.prevN = G.N; G.sp.base = stepFor(G.N); }
  const why = trigger(G.trig, MS, true);
  let w = 0, n = G.N;
  if (MS.barReturnEvt) { w = 4; n = G.prevN; }
  else if (why === 'novel') { w = 2; G.k++; n = drawN(seed, G.k); }
  else if (why === 'phrase') { w = 1; }        // a phrase line is a seam the look may use, but it does not re-draw N (measured, §85)
  G.why = w;
  if (w) setN(G, n);
  G.rot = spin(G.sp, MS, dt);
  G.fold = G.rot * FOLD_K;
  return G;
}
