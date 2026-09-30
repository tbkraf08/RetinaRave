// DUST — a swarm of gl_VertexID particles that pours between four formations, threaded by a few Hopf tori.
// Lifted from synapse scene 4 ("swarm"); the Hopf-fibre line overlay is back (ctx.lines, CONTRACTS 1.12 path A) —
// faint linked rings drawn additively over the cloud in the same camera, no depth test. See fibre.js.
import { VS_DUST, FS_DUST } from './shaders.js';
import { HELP } from './help.js';
import { CAP, counts, emit, fit } from './fibre.js';
import { GAL_K, ease, mkTrigger, spinTarget, trigger } from './grid.js';
import { mkSub, mkTens, mkVoice, ringR, ringW, sub, tens, voice } from './voices.js';
import { GALAXY, TORUS, file, midR, mkMem, recall, returning, shapeFor } from './formations.js';

const FORMS = ['sphere', 'torus', 'galaxy', 'ribbon'];
const DEG = Math.PI / 180;
const S0 = 0.7;                 // fibre scale at rest. The pole gate caps a projected ring at sqrt(1.86/.14) = 3.64,
                                // so 0.7 keeps the widest sweep inside the 2.3-unit frame half-height at dist 4.4.

// view-projection for an eye orbiting the origin at `dist`, looking at it. Writes column-major into `m`.
// Right-handed, vertical fov `fov` radians, near/far as VS_SWARM's depth convention (0.1 .. 10.1).
function lookVP(m, yaw, pitch, dist, aspect, fov, near, far) {
  const cp = Math.cos(pitch), fx = -cp * Math.sin(yaw), fy = -Math.sin(pitch), fz = -cp * Math.cos(yaw);
  let sx = fz, sy = 0, sz = -fx;                       // s = normalize(cross(f, up)) with up = (0,1,0)
  const sl = Math.hypot(sx, sy, sz) || 1;
  sx /= sl; sz /= sl;
  const ux = sy * fz - sz * fy, uy = sz * fx - sx * fz, uz = sx * fy - sy * fx;   // u = cross(s, f)
  const fc = 1 / Math.tan(fov * 0.5), p0 = fc / aspect;
  const p22 = (far + near) / (near - far), p23 = 2 * far * near / (near - far);
  m[0] = p0 * sx; m[4] = p0 * sy; m[8] = p0 * sz; m[12] = 0;
  m[1] = fc * ux; m[5] = fc * uy; m[9] = fc * uz; m[13] = 0;
  m[2] = -p22 * fx; m[6] = -p22 * fy; m[10] = -p22 * fz; m[14] = -p22 * dist + p23;
  m[3] = fx; m[7] = fy; m[11] = fz; m[15] = dist;
}

const SELF = {
  name: 'dust',
  id: 1,
  tag: 'a swarm of dust, one frequency band per grain',
  card: { title: 'DUST', blurb: 'a swarm of particles in a flow field, one frequency band per grain, the Hopf fibres threaded through' }, // landing tile (CONTRACTS §1.17, v0.8.1); the picture is site/thumbs/dust.jpg from tools/thumbs.sh
  feats: ['flow', 'flowMid', 'flowBass', 'bassS', 'midS', 'highS', 'lvl', 'dropEnv', 'tension',
    'alive', 'beatCount', 'beatPhase', 'barPos', 'phrase16Pos', 'barNovelEvt',
    'kick2', 'kickAge', 'kickEvt', 'snare2', 'snareAge', 'snareEvt', 'hat2', 'hatAge', 'hatEvt',
    'subNoteEvt', 'subGate',
    'buildLive', 'nextDropIn', 'dropLiveEvt',
    'eM', 'denK', 'sectionAlt', 'sectionReturn', 'barReturnEvt',
    'arc', 'punchy', 'regularity'],
  cuts: 'onset',
  rt: {},
  fibresOn: 1,                  // hooks.fibres — the A/B switch; set before init(), so never reset there
  pinF: -1,                     // hooks.form — test only: pin the formation so a ruler can measure one shape at a time

  // the director's home scene owns builds; DUST bids on punchy, steady music
  score(MS) {
    return MS.arc === 'build' ? 0 : 0.3 + 0.5 * MS.punchy + 0.2 * MS.regularity;
  },

  init(ctx) {
    this.ctx = ctx;
    this.pr = ctx.mkProg(VS_DUST, FS_DUST, 'dust');
    this.vao = ctx.gl.createVertexArray();               // no attributes: positions come from gl_VertexID
    this.vp = new Float32Array(16);
    this.formA = 0; this.formB = 0; this.formT = 1; this.nRef = 0;
    this.dropHi = false;
    this.spin = 0; this.spinG = 0; this.trig = mkTrigger(); this.why = 'init';
    // the three transient voices and the sub (voices.js): decay time constants longer than the levels' own, which
    // is what "slow decay" means, and a floor so a soft hit is still a hit
    this.vK = mkVoice(0.24, 0.25); this.vS = mkVoice(0.30, 0.25); this.vH = mkVoice(0.09, 0.2); this.vB = mkSub();
    this.vT = mkTens();             // the void's contraction, the last bar's wind-up, the drop's release
    this.mem = mkMem();             // the section memory: which shape each section had (formations.js)
    this.yaw = 0; this.pitch = 0; this.dist = 4.4;
    this.m = { flow: 0, flowMid: 0, flowBass: 0, bassS: 0, midS: 0, highS: 0, lvl: 0, drop: 0, tension: 0, alive: 0,
      spin: 0, spinG: 0, vk: 0, vs: 0, vh: 0, vb: 0, ringR: 0, ringW: 1, build: 0, rel: 0 };
    this.mood = { hue: 0, sat: 0, bri: 0, spread: 0, invert: 0, angular: 0 };
    lookVP(this.vp, 0, 0, this.dist, 1, 55 * DEG, 0.1, 10.1);
    this.L = ctx.lines.mk(CAP);                          // the fibre overlay's own segment buffer (CONTRACTS 1.12 A)
    this.segs = new Float32Array(CAP * 12);
    this.fo = { nl: 0, nF: 0, N: 0, flowMid: 0, alpha: 0, band: [0, 0, 0], lvl: 0, alive: 0, s: 1, wpx: 1, dist: 1, mood: this.mood, vp: this.vp };
    this.rt.label = FORMS[0];
  },

  // formA -> formB. `target` is the shape the music is asking for (formations.js); asking for the one already on
  // screen is not a change at all, which is why a phrase line in the middle of a steady groove leaves the picture
  // alone. `force` re-pours even into the same shape — the drop's burst, which must always be visible.
  reform(target, force) {
    const k = ((target | 0) % 4 + 4) % 4;
    if (!force && k === this.formB && this.formT >= 1) return false;
    this.formA = this.formB;
    this.formB = k;
    this.formT = 0;
    this.nRef++;
    return true;
  },

  update(dt, MS, GROOVE, LOOK, env) {
    this.lastMS = MS;                                    // hooks.dinfo() reads it; nothing else does (§1.15: never across frames)
    // The beat grid (grid.js): one angle, read off the beat COUNT so it can never drift, eased so every beat is a
    // nudge. The galaxy's winding rides the same angle at its own rate.
    this.spin = ease(this.spin, spinTarget(MS), dt);
    this.spinG = GAL_K * this.spin;

    // The three transient voices. The attack fires on whichever comes first — the ears' event or the v2 level's
    // rising edge — because the two pickers miss different hits (voices.js: the numbers, graded against the truth);
    // the age places it sub-frame, the level sizes it, and the decay is slow off that age.
    voice(this.vK, dt, MS.kick2, MS.kickAge, MS.kickEvt);
    voice(this.vS, dt, MS.snare2, MS.snareAge, MS.snareEvt);
    voice(this.vH, dt, MS.hat2, MS.hatAge, MS.hatEvt);
    sub(this.vB, dt, MS);
    // The real tension: the void before a drop (§54), not the roughness. The last bar winds up on top of it, and
    // the slam lets everything go at once.
    tens(this.vT, dt, MS);

    // A formation change lands only on a seam of the music — the phrase line, or a bar the store calls new — and
    // never while a pour is still running. WHICH shape is the section's energy (formations.js); a return pours back
    // into the shape that section had. The drop is the one exception to the seam: it bursts wherever it lands.
    const ret = returning(this.mem, MS);
    const why = trigger(this.trig, MS, this.formT >= 1);
    if (ret && this.formT >= 1 && this.reform(Math.max(0, recall(this.mem, MS)), false)) this.why = 'return';
    else if (why && this.reform(shapeFor(MS), false)) this.why = why;
    const dropOn = MS.dropEnv > 0.5;
    if (dropOn && !this.dropHi) {                        // DETONATE: the drop bursts the torus into the galaxy
      this.why = 'drop';
      this.reform(this.formB === TORUS ? GALAXY : shapeFor(MS), true);
    }
    this.dropHi = dropOn;
    file(this.mem, MS, this.formB);                      // this section's shape is whatever it ends on
    if (this.pinF >= 0) { this.formA = this.formB = this.pinF; this.formT = 1; }   // &form=<k> under #test: one shape, held
    // the cross-fade advances with the music: energy pushes, kicks shove
    if (this.formT < 1) this.formT = Math.min(1, this.formT + dt * (0.08 + 0.5 * MS.lvl + 0.8 * this.vK.e));

    // camera: a slow orbit that breathes with GROOVE, dollying in on bass and on the drop
    this.yaw = 0.35 * GROOVE.rot + 0.05 * MS.flow;
    this.pitch = 0.3 * Math.sin(0.03 * MS.flow);
    this.dist = Math.max(2.2, 4.4 - 0.7 * MS.bassS - 0.5 * MS.dropEnv);

    const m = this.m;
    m.flow = MS.flow; m.flowMid = MS.flowMid; m.flowBass = MS.flowBass; m.bassS = MS.bassS; m.midS = MS.midS;
    m.highS = MS.highS; m.lvl = MS.lvl;
    m.drop = MS.dropEnv; m.tension = MS.tension; m.alive = MS.alive;
    m.build = Math.min(1.25, this.vT.build + 0.3 * this.vT.wind); m.rel = this.vT.rel;
    m.vk = this.vK.e; m.vs = this.vS.e; m.vh = this.vH.e; m.vb = this.vB.e;
    m.ringR = ringR(this.vS, midR(this.formA, this.formB, this.formT)); m.ringW = ringW(this.vS);
    m.spin = this.spin % (Math.PI * 2); m.spinG = this.spinG % (Math.PI * 2);   // wrapped: fp32 in the shader
    const q = LOOK.mood, d = this.mood;
    // the void drains the palette: the colour goes out of the cloud and the hue family closes toward one hue,
    // and the drop's release puts it back (the mood object is the fibres' palette too, so the rings drain with it)
    const dr = 1 - 0.55 * Math.min(1, m.build);
    d.hue = q.hue; d.sat = q.sat * dr; d.bri = q.bri; d.spread = q.spread * (1 - 0.35 * Math.min(1, m.build));
    d.invert = q.invert; d.angular = q.angular;

    this.rt.time = MS.flow;                              // the visual clock is musical time, not the wall clock
    this.rt.label = FORMS[this.formA] + (this.formT < 1 ? '>' + FORMS[this.formB] + ' ' + this.formT.toFixed(2) : '') + ' ' + this.spin.toFixed(1);
  },

  draw(target, { w, h }) {
    const ctx = this.ctx, gl = ctx.gl, P = this.pr;
    if (!P || !P.p) return;
    const count = ctx.budget('points'), m = this.m, d = this.mood;   // the core's particle budget for the current tier (CONTRACTS §1.4)
    lookVP(this.vp, this.yaw, this.pitch, this.dist, Math.max(w, 1) / Math.max(h, 1), 55 * DEG, 0.1, 10.1);
    ctx.use(P, target, w, h);
    gl.uniformMatrix4fv(P.u('uVP'), false, this.vp);
    gl.uniform2f(P.u('uRes'), w, h);
    gl.uniform1f(P.u('uCount'), count);
    gl.uniform3f(P.u('uForm'), this.formA, this.formB, this.formT);
    gl.uniform1f(P.u('uSpin'), m.spin);
    gl.uniform1f(P.u('uSpinG'), m.spinG);
    gl.uniform1f(P.u('uFlow'), m.flow);
    gl.uniform1f(P.u('uFlowMid'), m.flowMid);
    gl.uniform1f(P.u('uBassS'), m.bassS);
    gl.uniform1f(P.u('uMidS'), m.midS);
    gl.uniform1f(P.u('uLevel'), m.lvl);
    gl.uniform4f(P.u('uVoice'), m.vk, m.vs, m.vh, m.vb);
    gl.uniform2f(P.u('uSnareR'), m.ringR, m.ringW);
    gl.uniform1f(P.u('uDrop'), m.drop);
    gl.uniform1f(P.u('uTension'), m.tension);
    gl.uniform2f(P.u('uBuild'), m.build, m.rel);
    gl.uniform1f(P.u('uAlive'), m.alive);
    gl.uniform1f(P.u('uHue'), d.hue);
    gl.uniform1f(P.u('uSat'), d.sat);
    gl.uniform1f(P.u('uBri'), d.bri);
    gl.uniform1f(P.u('uSpread'), d.spread);
    gl.uniform1f(P.u('uInvert'), d.invert);
    gl.uniform1f(P.u('uAngular'), d.angular);
    ctx.tex(P, 'uSpec', 0, ctx.engineTex.spec);
    ctx.tex(P, 'uWave', 1, ctx.engineTex.wave);
    const wasDepth = gl.isEnabled(gl.DEPTH_TEST);
    gl.disable(gl.DEPTH_TEST);                           // additive points are order-independent; the target may have no depth buffer
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.POINTS, 0, count);
    gl.bindVertexArray(null);
    gl.disable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    if (wasDepth) gl.enable(gl.DEPTH_TEST);
    this.fibres(target, w, h);
  },

  // The Hopf-fibre overlay, last: ctx.lines binds its own program and restores GL state itself, so nothing of the
  // points' pass survives into it. No depth (the points never wrote any), additive, same uVP as the particles.
  fibres(target, w, h) {
    const ctx = this.ctx, m = this.m, o = this.fo;
    if (!this.fibresOn) { this.rt.log = 'fib off'; return; }
    const c = counts(ctx.tier()), cap = Math.min(CAP, ctx.budget('segs'));
    o.nl = c.nl; o.N = c.N; o.nF = fit(c, cap);          // fibres are dropped whole if the budget ever shrinks
    o.flowMid = m.flowMid; o.lvl = m.lvl; o.alive = m.alive;
    o.band[0] = m.bassS; o.band[1] = m.midS; o.band[2] = m.highS;
    o.alpha = 0.06 * m.flowBass;                         // the tumble: bass time turns the whole family on S3
    o.s = S0 * (1 - 0.32 * Math.min(1, m.build)) * (1 + 0.6 * m.drop + 0.12 * m.rel + 0.08 * m.vk);
    o.wpx = 1.5 * (h / 720); o.dist = this.dist;
    const n = emit(this.segs, cap, o);
    this.rt.log = 'fib ' + o.nl + 'x' + o.nF + 'x' + o.N + ' seg ' + n + '/' + cap;
    ctx.lines.set(this.L, this.segs, n);
    ctx.lines.draw(this.L, target, w, h, { mvp: this.vp, blend: 'add' });
  },

  // test hook: &fibres=0 under #test draws the swarm alone (the A/B md5 of the points path)
  // dinfo(): the scene's own numbers, frame by frame, for tools/dust-trace.js. Read-only (CONTRACTS §1.4: a hook
  // that reports must not mutate).
  hooks: {
    fibres(v) { SELF.fibresOn = +v; },
    form(v) { SELF.pinF = v === '' || v === undefined || v === null ? -1 : +v; },   // -1 = the music chooses (the default)
    dinfo() {
      return { spin: SELF.spin, spinG: SELF.spinG, formA: SELF.formA, formB: SELF.formB, formT: SELF.formT,
        why: SELF.why === 'phrase' ? 1 : SELF.why === 'novel' ? 2 : SELF.why === 'drop' ? 3 : SELF.why === 'return' ? 4 : 0,
        want: shapeFor(SELF.lastMS || {}),
        nRef: SELF.nRef, vk: SELF.vK.e, vs: SELF.vS.e, vh: SELF.vH.e, vb: SELF.vB.e,
        build: SELF.vT.build, wind: SELF.vT.wind, rel: SELF.vT.rel, con: SELF.m.build, sat: SELF.mood.sat,
        ageK: SELF.vK.age, ageS: SELF.vS.age, ageH: SELF.vH.age,
        ringR: ringR(SELF.vS, midR(SELF.formA, SELF.formB, SELF.formT)), form: SELF.formT >= 1 ? SELF.formB : -1 };
    },
  },

  // The trails are the feedback effect's job, never faked in the shader. 0.95 was the highest in the set and its
  // half-life is 0.22 s on the encoded picture — most of a beat at 150 BPM, so the last hit's ghost was still a third
  // of its size when the next one landed and every transient read soft (§57 open item 2, "the first knob to reach
  // for"). 0.88 is a 0.135 s half-life, a third of a beat: measured over SeeYouDrop 30-60 s the per-beat peak/trough
  // goes 1.261 -> 1.431 (the rim 1.323 -> 1.545) and |dlum| per frame 1.40 -> 1.72, at the cost of a mean luminance
  // 117 -> 96. 0.85 (TORUS2's own) was measured too and buys only 1.470 for another 5 % of the light.
  post: { fb: { decay: 0.88 }, bloom: { thr: 0.3 }, kaleido: 0.5, exposure: { on: true } },

  // One colour mapping, declared (CONTRACTS §1.4) so every scene answers `CARD.colour`, the cast line and the panel's
  // colour select the same way. No `post` on the variant: the scene's own `post` above stays in force.
  colour: { default: 'v2', variants: { v2: {} } },
  // look memory (CONTRACTS §1.11): a returning section gets its formation pair back
  look: {
    get: () => [SELF.formA, SELF.formB, SELF.formT],
    set: (v) => { SELF.formA = v[0]; SELF.formB = v[1]; SELF.formT = v[2]; },
  },

  hud() {
    return 'dust ' + this.rt.label;
  },

  help: HELP,
};
export default SELF;
