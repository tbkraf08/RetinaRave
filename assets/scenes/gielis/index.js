// GIELIS (v0.14) — the superformula nest that breathes with the music. A from-scratch scene on the Gielis superformula
// r(φ) = (|cos(mφ/4)/a|^n2 + |sin(mφ/4)/b|^n3)^(−1/n1) (Gielis 2003), twelve pitch classes as twelve nested 3D
// supershapes drawn as rings of strokes, designed on TORUS2's music-to-visual model (id 3, the user's favourite mapping)
// and tuned on SeeYouDrop (GIELIS-SESSION-PROMPT.md, docs/workers/brief-gielis.md). The user asked for it on 2026-09-27.
// Forced-only until the user approves it: score() is 0, so the director never picks it and the reference md5s of ids
// 0–9 and the mixs transition stay where they are (DECISIONS §15). No digit key (they stop at 9): the `n` key cycles to
// it, or `&scene=10`. This file is the registered skeleton; the worker builds the scene here (index.js / shaders.js /
// nest.js / help.js, with the numerics in assets/math/gielis.js).

export default {
  name: 'gielis',
  id: 10,
  tag: 'superformula nest, breathing — twelve pitch classes as twelve supershapes, the lobes from the interval to the key, a pinch on every beat',
  card: { title: 'GIELIS', blurb: 'the superformula: twelve nested shapes, one per note, that close up on every beat and open again in the silence' }, // landing tile (CONTRACTS §1.17); the picture is site/thumbs/gielis.jpg from tools/thumbs.sh once there is one
  feats: [],
  cuts: 'continuous',
  rt: {},

  // never auto-picked until approved
  score() {
    return 0;
  },

  init(ctx) {
    this.ctx = ctx;
  },

  update(dt, MS) {
    this.rt.time = MS.flow;
    this.rt.label = 'gielis skeleton';
  },

  draw(target, { w, h }) {
    const g = this.ctx.gl;
    g.bindFramebuffer(g.FRAMEBUFFER, target ? target.f : null);
    g.viewport(0, 0, w, h);
    g.clearColor(0, 0, 0, 1);
    g.clear(g.COLOR_BUFFER_BIT);
  },

  post: { fb: { decay: 0.85 }, bloom: { thr: 0.3 }, kaleido: 0, morph: { flow: 0.4 } },
  colour: { default: 'v2', variants: { v2: {} } },

  help: {
    feats: {},
    eli5: 'Twelve nested shapes, one for each of the twelve notes: the louder a note, the bigger and brighter its shape. Every shape is a superformula curve — the same formula that draws a circle, a square, a star or a flower depending on a few numbers — and the music sets those numbers: the note\'s distance from the song\'s key sets how many lobes it has, and every beat pinches all of them toward a star before the silence lets them relax back toward a circle.',
    why: 'The user\'s ear on SeeYouDrop: the set should collapse into an interesting shape on every beat and rebound to a circle between beats, different pitches should be different shapes, and the edge should always be moving with the music. The superformula has exactly those knobs: one exponent is the pinch (a circle at infinity, a star near zero), the lobe count is a rational number that closes after a few turns, and the lean of the lobes is two more exponents. So the beat drives the pinch, the interval above the key drives the lobe count, the section drives the lean, and the hits launch waves along the rings — TORUS2\'s music model on a shape that can change shape.',
    math: 'Gielis: r(φ) = (|cos(mφ/4)/a|^n2 + |sin(mφ/4)/b|^n3)^(−1/n1). m is the lobe count (an integer closes in one turn; p/q closes after q turns with p lobes), n1 the pinch (n1 → ∞ is a circle for any m, small n1 a star), n2 and n3 the lean of the lobes, a and b the axis stretch. The 3D supershape is the spherical product of two such curves, P(θ, φ) = (r1(θ) cos θ · r2(φ) cos φ, r1(θ) sin θ · r2(φ) cos φ, r2(φ) sin φ), drawn as latitude rings of strokes. Green\'s Q = 4πA/L² of the equatorial curve (1 for a circle) is the roundness ruler the beat is measured against.',
  },
};
