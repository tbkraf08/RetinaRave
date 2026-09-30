// DUST — per-bin habituation: what is NEW in a grain's band (DECISIONS §60 step 2).
//
// The brief: "Detect timbral novelty and give new sounds a new visual voice; let sustained sounds habituate."
// DUST's grains each own one bin of the 256-bin log spectrum and are pushed out, grown and brightened by that
// bin's level. A pad that holds one chord for eight bars therefore held its grains out at full stretch for eight
// bars: the picture said "this is loud" when the music was saying "this is still the same".
//
// So each grain's drive becomes its bin's level MINUS that bin's own slow average — the part of the band that is
// new. The slow average is a second spectrum, an exponential moving average, and it has to be per BIN and to
// survive between frames, which is state a vertex shader cannot own.
//
// WHERE THE STATE LIVES, and what it cost to decide. Three routes:
//   1. a CPU-side EMA — impossible from a scene: `ctx.engineTex.spec` is the GL texture, and the Uint8Array behind
//      it is `ENGINE.tex.spec`, which is core state a scene may not read (CONTRACTS §0 import discipline).
//   2. `ctx.engineTex.hist`, the 256x128 spectrogram ring the core already uploads — no state, no pass, but a
//      "slow average" then has to be built out of taps into it, at one texture fetch per tap PER GRAIN: four taps
//      at tier 3 is 600 k fetches a frame against 150 k for one, and the ring only reaches 1.3 s back, so the time
//      constant would be capped at about three beats.
//   3. a 256x1 ping-pong of the scene's own targets, one fullscreen pass of 256 pixels a frame, and ONE extra
//      fetch per grain. Chosen: 256 pixels of work against 450 k extra fetches, and the time constant is free.
//
// THE DETECTOR WAS MEASURED BEFORE IT WAS BUILT, and the obvious form of it does not work. `tools/work/d2/spec-trace.js`
// records the 256 bytes of `ENGINE.tex.spec` every frame — the grains' own input — so every candidate could be swept
// offline on the recorded music (`nov.py`, `nov2.py`) instead of costing a page run each. Per bin, over SeeYouDrop
// 20–110 s (5401 frames x 256 bins):
//
//   novelty                                     nov p50   p75    p90   | a sustained bin-onset's drive,  | a new bar's
//   (all with the 0.35 floor below)                                     | +0.1 s -> +2.5 s               | novel bins
//   (level − slow) / level, tau 2 s               0.010  0.048  0.090  |  0.439 -> 0.387  (88 %)         | x1.00
//   (level − slow) / 1.5·EMA|delta|, tau 2 s      0.141  0.620  1.000  |  0.734 -> 0.640  (87 %)         | x1.02
//   (level − slow) / 0.10, tau 3 s                0.088  0.416  0.782  |  0.690 -> 0.662  (96 %)         | x1.09
//   (level − slow) / 0.10, tau 2 s                0.076  0.393  0.754  |  0.717 -> 0.613  (85 %)         | x1.22
//   (level − slow) / 0.10, tau 1.2 s  <- this     0.061  0.367  0.729  |  0.776 -> 0.502  (65 %)         | x1.20
//
// - **relative to the LEVEL is nothing at all.** `uSpec` is floor-subtracted and peak-normalised, so a bin's level
//   is a spectral SHAPE and barely moves: (level − slow)/level has a median of 0.010 and a p90 of 0.090, which is a
//   flat 0.35 gain on every grain — a 65 % dimming, not a novelty detector. That was the first cut, and the
//   measurement is the reason it is not the shipped one.
// - **relative to the bin's own DEVIATION (a z-score) is worse than it looks.** It has range, but as a bin settles
//   its deviation shrinks with it, so a quiet steady bin becomes hypersensitive and reads novel on rounding noise:
//   habituation 87 %, and a new bar is indistinguishable from the bars after it (x1.02).
// - **an ABSOLUTE step is right**, because the spectrum is already normalised: 0.10 of full scale is a real onset
//   in a band whatever that band's resting level. tau 1.2 s habituates hardest (65 % of the onset's drive 2.5 s
//   later) while keeping the new-bar signal (x1.20); tau 3 s keeps almost nothing (96 %).
//
// HAB is the floor: a sustained sound habituates TO it, never to nothing ("habituate to ~30–40 %, not 0", and
// CONTRACTS §1.18's "nothing moves without an audible reason" cuts the other way too — a sound that is still
// sounding must still be on the screen). 0.35, so a fully novel band is 2.86x a fully habituated one.
//
// THE GAIN IS NORMALISED EVERY FRAME, on the frame's own spectrum, and that took three measured tries. The
// habituation has to REDISTRIBUTE the cloud's light between the steady bands and the changing ones, not change how
// much of it there is — that is step 1's job, and step 1 was calibrated on the brightness the user has already
// signed off. Raw, the gain averages 0.49, so the base of the cloud goes four times darker (brightness is amp²).
// Divided by that mean, the window's mean luminance measured +25 % (100.3 -> 125.1), because it is the mean of amp²
// and not of amp that has to be held: dividing by the gain's RMS instead (0.5318) brought it to +17 % (117.5) —
// and, worse, BOTH fixed divisors raised the QUIET end far more than the loud one: the void before drop 1 went
// 24.2 -> 54.2 while the groove went 108.4 -> 113.0, so the window's own range fell 4.62 -> 3.88 and step 1 was
// half undone by the next commit. The reason is in the spectrum: `uSpec` is peak-normalised PER FRAME, so in a
// sparse section what is left is renormalised up and jumps about, and nearly every bin reads novel.
//
// So the divisor is the gain's own RMS over the bins THIS FRAME, computed in a second 1x1 pass (FS_NORM) and
// fetched by every grain from a single texel. It is weighted by the grains' own density over the bins
// (`fx = .95·u^1.4`, so d u / d fx goes as fx^(-2/7)) AND by `raw²`, the light the bin already carries — an
// unweighted RMS still measured +8 % on the mean luminance and left the void at 39.9 against 24.2, because the
// bins that read novel are preferentially the LOUD ones and the correlation is strongest exactly where the mix is
// sparse. Weighted, the mean of amp² is held in every section, sparse or dense, and the novelty can only decide
// WHICH grains get the light. It cannot be zero: with no novelty anywhere the RMS is HAB itself.
//
// HOLDING THE MEAN OF amp² IS NOT QUITE HOLDING THE LIGHT, and two attempts to close the gap were measured and
// rejected. The brightness is multiplied by `min(1, sz)` — a sub-pixel grain fades (shaders.js, energy
// conservation) — and by the overdraw a grain's own area buys, so in a SPARSE mix the redistribution leaks: the
// grains whose bands are new grow past a pixel and stop being attenuated, while the ones that shrink were already
// sub-pixel and had nothing left to lose. On SeeYouDrop's intro (2-40 s), where instruments enter one per bar,
// 8-14 s read 1.56x the groove at 28-40 s against 0.92x before pass 2. The two fixes, all four candidates measured
// on the same clock (`tools/work/d2/syd-e10 / syd-e06 / syd-fin / syd-intro-*`):
//
//   candidate                          window p95/p05  |dlum| p50  per-beat  intro 2-8  intro 8-14
//   the gain as it is        <- this            4.123        2.10     1.436       0.89        1.56
//   the gain^0.6                                4.227        1.72     1.366       0.75        1.32
//   the SIZE left on the raw level              4.177        1.63     1.366       0.65        1.09
//
// Both fixes work on the intro and both give back almost all of what step 2 bought — the per-frame motion (+52 %)
// and the per-beat contrast (1.366 -> 1.436) ARE the novelty, and they travel through the size. So the gain stays
// whole and the intro is dimmed where it belongs, in the dynamic range: `dyn.js` PK_FLOOR 0.70 -> 0.84.
//
// What this does NOT touch: the three transient voices and the sub. They are driven by the onsets' own ages
// (voices.js), not by `amp`, so a habituated pad cannot dim a kick — the same rule step 1 follows.

export const TAU = 1.2;          // s: the slow spectrum's time constant, both ways (a sound that stops is novel
                                 // again ~2.5 s later, which is about a bar and a half at 150 BPM)
export const HAB = 0.35;         // a fully habituated band keeps this much of a fully novel one
export const NW = 0.10;          // the step in the peak-normalised spectrum that counts as fully new

// Pass 1, 256x1: the slow spectrum. `o.r` is it; g and b are unused (the target is RGBA16F because that is what
// `ctx.mkTarget` gives, and one channel of it is all this needs).
export const FS_EMA = `
uniform sampler2D uSpec;
uniform sampler2D uPrev;
uniform float uK;          /* the step: 1 - exp(-dt/TAU), and 1 on the first frame so the average starts ON the
                              spectrum instead of climbing out of the black a fresh target is cleared to */
void main(){
  float x = clamp(vUv.x, 0.002, 0.998);
  float s = texture(uSpec, vec2(x, .5)).r;
  float p = texture(uPrev, vec2(x, .5)).r;
  o = vec4(p + (s - p) * uK, 0., 0., 1.);
}`;

// Pass 2, 1x1: the gain's own RMS over the bins, weighted by how many grains own each bin. One fragment, 512
// texture fetches, and every grain then reads the answer from one texel — so the whole normalisation costs the
// swarm one extra, perfectly cache-coherent fetch per vertex.
export const FS_NORM = `
uniform sampler2D uSpec;
uniform sampler2D uSlow;
uniform vec2 uHabN;        /* x = the habituated floor, y = the step that counts as fully new */
void main(){
  float s2 = 0., wt = 0.;
  for (int i = 0; i < 256; i++){                    /* all 256 bins. A 1x1 pass is ONE fragment, so this loop has
                                                       the whole GPU idling behind it — but sampling every fourth
                                                       bin instead was measured at only 5 % of the step's cost
                                                       (DUST/NAV 0.649 -> 0.614) and would put sampling noise on
                                                       the brightness of the entire cloud, frame to frame. */
    float x = (float(i) + .5) / 256.;
    float raw = texture(uSpec, vec2(x, .5)).r;
    /* the weight is the grains' density over the bins (fx = .95 u^1.4) TIMES the light the bin already carries,
       raw^2, because it is the mean of amp^2 = (raw g / nrm)^2 that has to be held and the novel bins are
       preferentially the loud ones — a weight of 1 here measured +8 % on the window's mean luminance. */
    float w = pow(max(x, .004), -0.285714) * (raw * raw + .004);
    float nov = clamp((raw - texture(uSlow, vec2(x, .5)).r) / uHabN.y, 0., 1.);
    float g = uHabN.x + (1. - uHabN.x) * nov;
    s2 += w * g * g;
    wt += w;
  }
  o = vec4(sqrt(s2 / max(wt, 1e-6)), 0., 0., 1.);
}`;

// Build the targets and the two programs. Called from init(); the scene owns the targets (CONTRACTS §1.1).
export function mkEma(ctx) {
  return { a: ctx.mkTarget(256, 1), b: ctx.mkTarget(256, 1), n: ctx.mkTarget(1, 1),
    pr: ctx.mkProg(FS_EMA, 'dust-ema'), pn: ctx.mkProg(FS_NORM, 'dust-norm'), first: 1, k: 0 };
}

// Advance the slow spectrum by one frame (into `E.a`) and rebuild the normaliser from it (into `E.n`). Runs at the
// top of draw(), before the swarm's own pass rebinds the scene target.
export function ema(ctx, E) {
  const P = E.pr, Q = E.pn;
  if (!P || !P.p || !Q || !Q.p) return;
  ctx.use(P, E.b, 256, 1);
  ctx.tex(P, 'uSpec', 2, ctx.engineTex.spec);
  ctx.tex(P, 'uPrev', 3, E.a);
  ctx.gl.uniform1f(P.u('uK'), E.first ? 1 : E.k);
  ctx.tri();
  const t = E.a; E.a = E.b; E.b = t;
  E.first = 0;
  ctx.use(Q, E.n, 1, 1);
  ctx.tex(Q, 'uSpec', 2, ctx.engineTex.spec);
  ctx.tex(Q, 'uSlow', 3, E.a);
  ctx.gl.uniform2f(Q.u('uHabN'), HAB, NW);
  ctx.tri();
}

// The step for this frame's dt. Clamped: a long stall must not jump the average onto one frame's spectrum.
export function emaK(dt) { return 1 - Math.exp(-Math.min(0.1, Math.max(0, dt)) / TAU); }
