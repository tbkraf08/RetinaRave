// CHLADNI (v0.15) — sand on a vibrating plate, driven by the sub. A Chladni plate is sound made visible by resonance: sand
// gathers on the nodal lines of the plate's eigenmode, u(x, y) = cos(nπx)·cos(mπy) − cos(mπx)·cos(nπy), and the figure is
// set by the pitch. Built to show the v0.15 engine's ears (the sub's pitch / slides / purity / gate, clean kicks placed by
// their onset age, and in file mode the whole track in advance: the drops and sections before they happen), tuned on
// SeeYouDrop (ENGINE-CHLADNI-SESSION-PROMPT.md Part B, docs/workers/brief-chladni.md). The user asked for it on 2026-09-27
// ("slot 12" = id 11). Forced-only until the user approves it: score() is 0, so the director never picks it and the
// reference md5s of ids 0–10 and the mixs transition stay where they are. No digit key: `n` cycles to it, or &scene=11.
// This file is the registered skeleton; the worker builds the scene here (index.js / sand.js / shaders.js / help.js, with
// the numerics in assets/math/chladni.js).

export default {
  name: 'chladni',
  id: 11,
  tag: 'Chladni plate — sand on the nodal lines of the figure the sub bass sets; kicks throw it, slides morph it, silence lets it float',
  card: { title: 'CHLADNI', blurb: 'sand on a vibrating plate: the bass note draws the figure, every kick throws the sand, every slide melts one figure into the next' }, // landing tile (CONTRACTS §1.17)
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
    this.rt.label = 'chladni skeleton';
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
    eli5: 'A metal plate with sand on it, played by the bass. When a plate vibrates at one pitch, the sand is shaken off the parts that move and piles up on the lines that stay still — a figure that belongs to that pitch. Here the bass note sets the figure, a slide melts one figure into the next, every kick throws the sand into the air, and when the bass stops the sand floats free.',
    why: 'SeeYouDrop is a near-sine sub bass on C#1 — exactly the kind of tone that drives a clean Chladni figure — and the v0.15 engine can finally hear it: its pitch, its slides, how pure it is, when it is gated, and (from a file) where the drops are before they happen. One musical element drives one visual channel, so what you see is what you hear.',
    math: 'Square-plate Chladni approximation: u(x, y) = cos(nπx)·cos(mπy) − cos(mπx)·cos(nπy) on [−1, 1]², a figure is an ordered pair n ≠ m and the sand settles where u = 0. The figure is chosen by the sub note\'s interval to the tonic (simple figures for consonant intervals), blended between neighbours by the fractional pitch during a slide, and mixed with the (2n, 2m), (3n, 3m) figures as the bass gets less pure.',
  },
};
