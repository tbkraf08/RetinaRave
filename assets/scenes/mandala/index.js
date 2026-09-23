// MANDALA (id 2) — a kaleidoscope whose mirrors are a real fold group, lifted from synapse scene 2.
// An N-fold angular fold feeds an iterated box-fold / sphere-inversion map; an orbit trap lights the result.
// Fullscreen fragment scene: no camera, no geometry, no CPU particles.
import { FS_MANDALA } from './shaders.js';

// Everything update() reads out of MS / LOOK, held for draw(). No hidden timers: every entry traces to MS.
const S = {
  seed: 0, kickCount: 0, flow: 0, flowMid: 0, bassS: 0, midS: 0, kick: 0, tension: 0,
  drop: 0, lvl: 0, hat: 0, alive: 0, q: 0,
  hue: 0, sat: 1, bri: 1, spread: 1, invert: 0, angular: 0,
};

let epochOff = 0; // set by look.set(): kicks to add so floor(kickCount/64) equals the remembered epoch

export default {
  name: 'mandala',
  id: 2,
  tag: 'N-fold Kleinian fold · box-fold + sphere inversion, orbit-trapped',
  // every MS field this scene reads: score() reads the first three, update() the rest
  feats: ['arc', 'regularity', 'onsetRate', 'seed', 'kickCount', 'flow', 'flowMid', 'bass', 'bassS',
    'midS', 'kick', 'tension', 'dropEnv', 'lvl', 'high', 'hat', 'alive'],
  // 'event': the only discontinuity is N, the fold count, and it moves only with the section seed / 64-kick epoch
  cuts: 'event',

  // look memory (CONTRACTS §1.11): N = f(seed, floor(kickCount/64)); the seed returns with the section, the epoch via this
  look: {
    get: () => Math.floor(S.kickCount / 64),
    set: (v) => { epochOff = v * 64 - Math.floor((S.kickCount - epochOff) / 64) * 64; },
  },
  score(MS) {
    if (MS.arc === 'build') return 0;
    return 0.25 + 0.55 * MS.regularity + 0.2 * Math.min(1, MS.onsetRate / 6);
  },

  init(ctx) {
    this.ctx = ctx;
    this.pr = ctx.mkProg(FS_MANDALA, 'mandala');
  },

  update(dt, MS, GROOVE, LOOK) {
    const m = LOOK.mood;
    S.seed = MS.seed.a * 100;
    S.kickCount = MS.kickCount + epochOff; // look memory shifts the 64-kick epoch so a returning section keeps its N
    S.flow = MS.flow;
    S.flowMid = MS.flowMid;
    S.bassS = MS.bassS;
    S.midS = MS.midS;
    S.kick = MS.kick;
    S.tension = MS.tension;
    S.drop = MS.dropEnv;
    S.lvl = MS.lvl;
    S.hat = MS.hat;
    S.alive = MS.alive;
    S.q = this.ctx.Q.q;
    S.hue = m.hue;
    S.sat = m.sat;
    S.bri = m.bri;
    S.spread = m.spread;
    S.invert = m.invert;
    S.angular = m.angular;
    this.rt.time = MS.flow;
    this.rt.label = 'mandala';
  },

  draw(target, { w, h }) {
    const ctx = this.ctx;
    const gl = ctx.gl;
    const pr = this.pr;
    ctx.use(pr, target, w, h);
    gl.uniform1f(pr.u('uSeed'), S.seed);
    gl.uniform1f(pr.u('uKickCount'), S.kickCount);
    gl.uniform1f(pr.u('uFlow'), S.flow);
    gl.uniform1f(pr.u('uFlowMid'), S.flowMid);
    gl.uniform1f(pr.u('uBassS'), S.bassS);
    gl.uniform1f(pr.u('uMidS'), S.midS);
    gl.uniform1f(pr.u('uKick'), S.kick);
    gl.uniform1f(pr.u('uTension'), S.tension);
    gl.uniform1f(pr.u('uDrop'), S.drop);
    gl.uniform1f(pr.u('uLevel'), S.lvl);
    gl.uniform1f(pr.u('uHat'), S.hat);
    gl.uniform1f(pr.u('uAlive'), S.alive);
    gl.uniform1f(pr.u('uQuality'), S.q);
    gl.uniform1f(pr.u('uHue'), S.hue);
    gl.uniform1f(pr.u('uSat'), S.sat);
    gl.uniform1f(pr.u('uBri'), S.bri);
    gl.uniform1f(pr.u('uSpread'), S.spread);
    gl.uniform1f(pr.u('uInvert'), S.invert);
    gl.uniform1f(pr.u('uAngular'), S.angular);
    ctx.tex(pr, 'uSpec', 0, ctx.engineTex.spec);
    ctx.tri();
  },

  // synapse damped its kaleidoscope to 0.6 on this scene: the symmetry is already in the fold, a second
  // mirroring on top only muddies it. Short trails keep the filaments readable without smearing the centre.
  post: { fb: { decay: 0.6 }, bloom: { thr: 0.35 }, kaleido: 0.6 },

  rt: {},

  help: {
    // what each field in `feats` moves on this screen (CONTRACTS §1.13); a field without a line falls back to FEATS[k].drives
    feats: {
      arc: 'never auto-picked during a build',
      regularity: 'the bid: a steady rhythm',
      onsetRate: 'the bid: dense hits',
      seed: 'how many mirrors: N = 4, 6, 8, 10 or 12 from the section seed',
      kickCount: 'every 64 kicks the mirror count is drawn again',
      flow: 'the fold constant drifts on musical time and the colours cycle slowly',
      flowMid: 'the wedge rotates and the fold\'s twist turns on mid-band time',
      bass: 'zooms in (the fold pushes harder) and sharpens the lit ring',
      bassS: 'shifts the fold constant and the lit ring\'s radius',
      midS: 'the fold\'s rotation angle and the constant\'s other half',
      kick: 'a zoom pulse and the centre flare',
      tension: 'zooms out: more of the fold\'s outer structure',
      dropEnv: 'zooms in hard and the centre flares',
      lvl: 'overall brightness',
      high: 'the brightness of the orbit-trap ring',
      hat: 'sparkle on the trap ring',
      alive: 'silence fades to black',
    },
    eli5: 'A kaleidoscope whose mirrors are a real Kleinian-style fold: abs() folds the plane onto itself and a '
      + 'sphere inversion turns it inside out, over and over. The music picks how many mirrors there are, how far '
      + 'the fold pushes, and which ring of the orbit lights up.',
    why: 'The symmetry is exact because it comes from the map, not from smearing a mirrored copy over the picture '
      + 'afterwards. Every pixel is folded into one wedge before any shading happens, so the N arms are the same '
      + 'arm — there is no seam to hide. That is why the post-kaleidoscope is damped to 0.6 here: the scene already '
      + 'owns its symmetry group, and a second one fights it.',
    math: 'Per pixel take polar (r, a), fold a into one wedge of width 2pi/N (N = 4 + 2*floor(5*hash) in {4,6,8,10,12}), '
      + 'and iterate z -> R * (|z| / clamp(<z,z>, 0.07, 3) - c). |z| is the box-fold (reflect in the axes); dividing '
      + 'by <z,z> is inversion in the unit circle, clamped so the origin does not blow up; -c translates and R rotates. '
      + 'Composing reflections and inversions generates a discrete group, so the limit set is self-similar. An orbit '
      + 'trap records how near the orbit passed a target — here a ring of radius 0.35 + 0.5*spectrum(i), summed as '
      + 'exp(-13*|‖z‖ - radius|), plus a cross trap min|z.x*z.y| — and that nearness, not any escape time, is the glow.',
  },
};
