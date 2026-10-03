// MANDALA (id 2) — a kaleidoscope whose mirrors are a real fold group, lifted from synapse scene 2.
// An N-fold angular fold feeds an iterated box-fold / sphere-inversion map; an orbit trap lights the result.
// Fullscreen fragment scene: no camera, no geometry, no CPU particles.
// The overhaul (DECISIONS §85–§88, MANDALA-OVERHAUL-SESSION-PROMPT.md): the beat grid is grid.js (§85), the voices and the tension voices.js (§86, §87).
import { baseLight } from '../../math/loudlight.js';   // §63 phase 5: the body's brightness is TRUE loudness, not the AGC's `lvl`
import { K as NUDGE } from '../../math/beatgrid.js';
import { FS_MANDALA } from './shaders.js';
import { HELP } from './help.js';
import { WEDGE, grid, mkGrid, setN, stepFor } from './grid.js';
import { mkVoices, tension, voices } from './voices.js';
import { BED } from '../../math/voice.js';

const TAU = Math.PI * 2;

// Everything update() reads out of MS / LOOK, held for draw(). No hidden timers: every entry traces to MS.
const S = {
  N: 8, rot: 0, fold: 0, flow: 0, bassS: 0, midS: 0, kick: 0, snare: 0, seg: 0, tension: 0, tight: 0, rel: 0,
  drop: 0, lvl: 0, hat: 0, alive: 0, q: 0,
  hue: 0, sat: 1, bri: 1, spread: 1, invert: 0, angular: 0,
};
const G = mkGrid();   // the beat state: the wedge angle, N and its seams (grid.js)
const V = mkVoices(); // the three transient voices (voices.js)

const SELF = {
  name: 'mandala',
  id: 2,
  tag: 'N-fold Kleinian fold · box-fold + sphere inversion, orbit-trapped',
  card: { title: 'MANDALA', blurb: 'a box-fold fractal seen through a kaleidoscope' }, // landing tile (CONTRACTS §1.17, v0.8.1); the picture is site/thumbs/mandala.jpg from tools/thumbs.sh
  // every MS field this scene reads: score() reads the first three, update() the rest (the tongue fields through
  // beatgrid.js's accent21 inside spin(), §78 — the static read check cannot see into math/, friction log)
  feats: ['arc', 'regularity', 'onsetRate', 'seed', 'beatCount', 'beatPhase', 'bpm', 'barPos', 'phrase16Pos',
    'barNovelEvt', 'barReturnEvt', 'tongue21', 'tongue41', 'tongueOn', 'flow', 'bass', 'bassS',
    'midS', 'kick2', 'kickAge', 'kickEvt', 'kickAmp', 'snare2', 'snareAge', 'snareEvt', 'snareAmp', 'hat2', 'hatAge', 'hatEvt', 'highS',
    'buildLive', 'nextDropIn', 'dropLiveEvt', 'tongueAmbig',
    'tension', 'dropEnv', 'lvl', 'high', 'alive', 'loudRel', 'loudRange', 'loudAbs'],
  // 'event': the only discontinuity is N, the fold count, and it moves only on a seam of the music (grid.js)
  cuts: 'event',

  // look memory (CONTRACTS §1.11): N itself — a returning section gets its mirror count back
  look: {
    get: () => G.N,
    set: (v) => { if (v >= 4) setN(G, v); },
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
    grid(G, MS, dt);                 // the seam, the draw, the angle (grid.js)
    S.N = G.N;
    S.rot = G.rot % TAU;             // wrapped: fp32 in the shader
    S.fold = G.fold % TAU;
    S.flow = MS.flow;
    S.bassS = MS.bassS;
    S.midS = MS.midS;
    // the hits: three voices on the ears' lanes (voices.js) — the level `kick` / `hat` no longer is the hit (§86)
    voices(V, dt, MS, G.N);
    // the real tension: the void before a drop and the beat the music will not commit to (voices.js, §87); the
    // roughness `tension` is jitter only from here
    tension(V, dt, MS, G.N);
    S.N = V.Nt;
    S.tight = V.tight;
    S.rel = V.vT.rel;
    S.kick = V.vK.e;
    S.snare = V.vS.e;
    S.seg = V.seg;
    S.hat = V.vH.e;
    S.tension = MS.tension;
    S.drop = MS.dropEnv;
    // §63 phase 5: `uLevel` is the BODY's brightness and nothing else — `palM(...) * pow(acc*3.2, 2.6) * (0.35 + 1.3*uLevel)`
    // — so it rides true loudness: a breakdown is dim and the drop after it is not (`eM` reads x0.994 across
    // SeeYouDrop's, where the music is x1.94 in power). The PER-HIT lift is untouched and still rides the AGC, which
    // is right: a quiet section's kick is still a kick (§60 step 1's rule). In this scene the hits are their own
    // uniforms on their own terms — the trap ring `0.12 + 1.4*uBands.z + 0.8*uHat`, the centre flare
    // `uKick*0.8 + uDrop*1.2` — so the split needs no new term here. `&loud=0` restores `MS.lvl` bit for bit.
    S.lvl = baseLight(MS.loudRel, MS.loudRange, MS.loudAbs, MS.lvl);
    S.alive = MS.alive;
    S.q = this.ctx.Q.q;
    S.hue = m.hue;
    S.sat = m.sat * V.drain;         // the void drains the palette; the slam puts it back on one frame (§87)
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
    gl.uniform1f(pr.u('uN'), S.N);
    gl.uniform1f(pr.u('uRot'), S.rot);
    gl.uniform1f(pr.u('uFold'), S.fold);
    gl.uniform1f(pr.u('uFlow'), S.flow);
    gl.uniform1f(pr.u('uBassS'), S.bassS);
    gl.uniform1f(pr.u('uMidS'), S.midS);
    gl.uniform1f(pr.u('uKick'), S.kick);
    gl.uniform1f(pr.u('uSnare'), S.snare);
    gl.uniform1f(pr.u('uSnareSeg'), S.seg);
    gl.uniform1f(pr.u('uTension'), S.tension);
    gl.uniform1f(pr.u('uTight'), S.tight);
    gl.uniform1f(pr.u('uRel'), S.rel);
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

  // One colour mapping, declared (CONTRACTS §1.4) so every scene answers `CARD.colour`, the cast line and the panel's
  // colour select the same way. No `post` on the variant: the scene's own `post` above stays in force.
  colour: { default: 'v2', variants: { v2: {} } },

  rt: {},

  // dinfo(): the scene's own numbers, frame by frame, for tools/dust-trace.js. Read-only (CONTRACTS §1.4).
  hooks: {
    // &nudge=<glide>,<width> (and hooks.nudge(g, w)): the beat nudge's velocity profile — the SAME K object DUST's
    // hook moves (math/beatgrid.js), so one knob serves both scenes. '' restores the measured default.
    nudge(g, w) {
      const a = typeof g === 'string' ? g.split(',') : [g, w];
      if (a[0] !== '' && a[0] !== undefined && a[0] !== null && +a[0] >= 0 && +a[0] < 1) NUDGE.GLIDE = +a[0];
      if (a[1] !== '' && a[1] !== undefined && a[1] !== null && +a[1] > 0.02 && +a[1] <= 1) NUDGE.W = +a[1];
      return JSON.stringify(NUDGE);
    },
    // &step=<beats per wedge> (and hooks.step(b)): the kaleidoscope's step is 2pi / (N · b). 4 = one wedge per bar (the
    // default, the prompt's open question 1), 1 = one wedge per beat. '' restores 4.
    step(b) {
      WEDGE.PER = b !== '' && b !== undefined && b !== null && +b >= 0.25 && +b <= 64 ? +b : 4;
      G.sp.base = stepFor(G.N || 8);
      return JSON.stringify(WEDGE);
    },
    // &bed=<ratio>,<seconds> (and hooks.bed(r, tc)): the hat voice's swell veto (§64 task 1) — the SAME BED object as
    // DUST's (math/voice.js). '' restores the measured default 1.05,2; 99 turns it off outright.
    bed(r, tc) {
      const a = typeof r === 'string' ? r.split(',') : [r, tc];
      if (a[0] !== '' && a[0] !== undefined && a[0] !== null && +a[0] >= 1 && +a[0] <= 99) BED.R = +a[0];
      if (a[1] !== '' && a[1] !== undefined && a[1] !== null && +a[1] >= 0.05 && +a[1] <= 60) BED.TC = +a[1];
      return JSON.stringify(BED);
    },
    dinfo() {
      return { N: G.N, nN: G.nN, rot: G.rot, fold: G.fold, nv: G.sp.v, nu: G.sp.u, nstep: G.sp.step, noff: G.sp.off,
        njump: G.sp.jumps, nacc: G.sp.acc, why: G.why,
        vk: V.vK.e, vs: V.vS.e, vh: V.vH.e, ageK: V.vK.age, ageS: V.vS.age, ageH: V.vH.age,
        fK: V.vK.n, fS: V.vS.n, fH: V.vH.n, aK: V.vK.amp, aS: V.vS.amp, aH: V.vH.amp,
        srcK: V.vK.src, srcS: V.vS.src, srcH: V.vH.src, hBed: V.hBed.s, hSwell: V.hSwell ? 1 : 0, seg: V.seg, kAmp: V.kAmp,
        build: V.vT.build, wind: V.vT.wind, rel: V.vT.rel, amb: V.amb, tight: V.tight, Nt: V.Nt, drain: V.drain };
    },
  },

  help: HELP,
};
export default SELF;
