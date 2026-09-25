// TORUS2 (v0.7) — the Hopf torus that is alive with the music: a from-scratch successor to TORUS (id 3) that keeps the
// Hopf fibration geometry (math/hopf.js) and answers the user's five points of 2026-09-24 (docs/workers/brief-torus2.md).
// Forced-only until the user approves it (key 8 / &scene=7): score() is 0, so the director never picks it and the
// reference md5s of ids 0–6 and the mixs transition stay where they are (DECISIONS §15). The replacement path (TORUS2
// takes id 3's bid, TORUS moves to id 7 as torus-v1) is in TORUS2-SESSION-PROMPT.md and happens only after the user looks.
// This file is the registered skeleton; the worker builds the scene here (index.js / shaders.js / attractors.js / waves.js).

export default {
  name: 'torus2',
  id: 7,
  tag: 'hopf fibration, alive — waves on the fibres, key as hue anchor, a nudge per beat, attractors mixed in',
  feats: [],
  cuts: 'continuous',
  rt: {},

  // never auto-picked until approved (the replacement gives it TORUS's bid: 0 in builds, else .25 + .45 clarity + .3 regularity)
  score() {
    return 0;
  },

  init(ctx) {
    this.ctx = ctx;
  },

  update(dt, MS) {
    this.rt.time = MS.flow;
    this.rt.label = 'torus2 skeleton';
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
    eli5: 'Every ring is one fibre of the Hopf map, as in TORUS, and this version is built to move with the music: waves run along the threads on every hit, the key of the song sets the colours, the whole nest turns a sixteenth of a turn on every beat, and strange attractors bend it out of shape when the music gets tense.',
    why: 'The first TORUS drew the geometry right but stayed dark inside and moved on its own clock. TORUS2 keeps the fibres and gives every one of them a reason to move: a hit launches a bump that travels one ring per beat, so the rhythm becomes visible as the spacing of the bumps; the key is a hue anchor on the circle of fifths, major warm and minor cool; the build grows the nest and the drop collapses it.',
    math: 'The same Hopf fibration as TORUS: S3 fibres over S2, each fibre a Villarceau circle of the torus of revolution R = 1/cos(theta/2), r = tan(theta/2) under stereographic projection. A wave is a displacement normal to the fibre at parameter t, launched at t = 0 and travelling at one ring per beat; an attractor morph advects each fibre point along a flow field (Thomas, the 3-cell CNN) for a fixed number of steps and lerps toward the result.',
  },
};
