// MAXWELL (v0.10, id 9) — the four equations that dance: a live 2D Yee-grid FDTD solution of Maxwell's equations in the
// TE mode (Ez, Hx, Hy on ping-pong RGBA16F targets), driven by the music in TORUS2's language — twelve charges on a ring by
// pitch class lit by chroma, a magnetic dipole at the centre that turns one nudge per beat, every hit a real wavefront at
// the speed of light, the section as the medium (lens · mirror cavity · photonic lattice · waveguide), the drop a mirror.
// MAXWELL-SESSION-PROMPT.md is the plan, docs/workers/brief-maxwell.md the worker's brief. Forced-only (score 0, key `n`
// cycles to it) until the user approves it; ids 0–8 and the fake timeline's picks are untouched by its registration.
// This file is the orchestrator's skeleton (step 1 of the brief's Process): it registers, loads in node, draws black.
import { HELP } from './help.js';

// the manual settings of the look live at the top of the module the worker writes (fdtd.js / medium.js / sources.js)
const CLEAR = [0, 0, 0, 1];

export default {
  name: 'maxwell',
  id: 9,
  tag: "maxwell's equations, solved live — twelve charges by pitch class, a dipole nudged per beat, hits as wavefronts, the section as the medium",
  feats: ['beatPhase'],
  cuts: 'continuous',
  always: false,
  hooks: {},
  score() { return 0; }, // forced-only until the user's word (MAXWELL-SESSION-PROMPT.md step 4)
  init(ctx) {
    this.ctx = ctx;
    this._S = null;
  },
  update(dt, MS) {
    this._S = { phase: MS.beatPhase };
  },
  draw(target, { w, h }) {
    if (!this._S) return; // a forced scene is drawn on its first frame before its first update() (CONTRACTS §1, overlay note)
    const g = this.ctx.gl;
    g.bindFramebuffer(g.FRAMEBUFFER, target ? target.f : null);
    g.viewport(0, 0, w, h);
    g.clearColor(CLEAR[0], CLEAR[1], CLEAR[2], CLEAR[3]);
    g.clear(g.COLOR_BUFFER_BIT);
  },
  overlay() {
    if (!this._S) return; // loop.js calls every scene's overlay() every frame (project_nav2: an uncaught read here froze the fake clock)
  },
  post: { fb: { decay: 0.8 }, bloom: { thr: 0.3 }, kaleido: 0, morph: { flow: 0.4 } },
  colour: { default: 'v2', variants: { v2: {} } },
  help: HELP,
};
