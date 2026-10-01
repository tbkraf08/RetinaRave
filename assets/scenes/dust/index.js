// DUST — a swarm of gl_VertexID particles that pours between four formations, threaded by a few Hopf tori.
// Lifted from synapse scene 4 ("swarm"); the Hopf-fibre line overlay is back (ctx.lines, CONTRACTS 1.12 path A) —
// faint linked rings drawn additively over the cloud in the same camera, no depth test. See fibre.js.
import { VS_DUST, FS_DUST } from './shaders.js';
import { HELP } from './help.js';
import { CAP, counts, emit, fit } from './fibre.js';
import { GAL_K, K as NUDGE, mkSpin, mkTrigger, spin, trigger } from './grid.js';
import { dyn, mkDyn } from './dyn.js';
import { HAB, NW, ema, emaK, mkEma } from './habit.js';
import { BED, bed, mkBed, mkSub, mkTens, mkVoice, ringR, ringW, sub, tens, voice } from './voices.js';
import { GALAXY, TORUS, file, midR, mkMem, recall, returning, shapeFor } from './formations.js';
import { mkAnchor } from '../../math/keycolour.js';

const FORMS = ['sphere', 'torus', 'galaxy', 'ribbon'];
// §60 step 3: the key as a hue ANCHOR, the same language TORUS2 (id 3) and POLYTOPE (id 5) already speak
// (assets/math/keycolour.js): the twelve keys are twelve hues round the circle of fifths, so a modulation is a
// small turn and related keys are neighbouring colours; the MODE pulls the anchor the short way toward warm
// (major) or cool (minor), because a fixed offset promises nothing once the key has rotated the wheel; `keyConf`
// gates the whole thing, holding the last confident key and sliding back toward LOOK.mood when the read goes
// noisy; and the anchor eases over ~2 s on the UNWRAPPED hue, so a key change is a turn and never a jump.
// Its state is PER CALLER by design — DUST easing the same `hueU` as TORUS2 would have made two scenes on screen
// in one crossfade fight over one variable — so DUST builds its own.
const KEY = mkAnchor();
const DEG = Math.PI / 180;
const RETARGET = 0.2;           // a pour this far in or less is RE-AIMED instead of restarted (§61 step 3, reform())
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
    'eM', 'eS', 'denK', 'sectionAlt', 'sectionReturn', 'barReturnEvt',
    'harmAngle', 'key', 'mode', 'keyConf', 'valence',
    'arc', 'punchy', 'regularity'],
  cuts: 'onset',
  rt: {},
  fibresOn: 1,                  // hooks.fibres — the A/B switch; set before init(), so never reset there
  pinF: -1,                     // hooks.form — test only: pin the formation so a ruler can measure one shape at a time
  pinD: -1,                     // hooks.dyn — test only: pin the dynamic-range drive (a bench must not run at the
                                // fake timeline's own eM, which is 0.374 → drive 0.40 → grains at 73 % of their size)
  habOn: 1,                     // hooks.hab — the A/B switch for the habituation (0 = pass 1's drive exactly)
  keyPin: null,                 // hooks.key(k, m) — test only: pin the key inside update(), never touching MS

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
    this.spin = 0; this.spinG = 0; this.sp = mkSpin(); this.trig = mkTrigger(); this.why = 'init';
    // the three transient voices and the sub (voices.js): decay time constants longer than the levels' own, which
    // is what "slow decay" means, and a floor so a soft hit is still a hit
    this.vK = mkVoice(0.24, 0.25); this.vS = mkVoice(0.30, 0.25); this.vH = mkVoice(0.09, 0.2); this.vB = mkSub();
    this.hBed = mkBed();            // the high band's own average: a swell is not a stick (voices.js, §64 task 1)
    this.vT = mkTens();             // the void's contraction, the last bar's wind-up, the drop's release
    this.vD = mkDyn();              // the track's own running peak: quiet is quiet, loud is loud (dyn.js)
    this.E = mkEma(ctx);            // the slow spectrum: a 256x1 ping-pong, one bin per grain (habit.js)
    this.mem = mkMem();             // the section memory: which shape each section had (formations.js)
    this.hSwell = false;
    this.yaw = 0; this.pitch = 0; this.dist = 4.4;
    this.m = { flow: 0, flowMid: 0, flowBass: 0, bassS: 0, midS: 0, highS: 0, lvl: 0, drop: 0, tension: 0, alive: 0,
      spin: 0, spinG: 0, vk: 0, vs: 0, vh: 0, vb: 0, ringR: 0, ringW: 1, build: 0, rel: 0, dyn: 1 };
    this.mood = { hue: 0, sat: 0, bri: 0, spread: 0, invert: 0, angular: 0 };
    lookVP(this.vp, 0, 0, this.dist, 1, 55 * DEG, 0.1, 10.1);
    this.L = ctx.lines.mk(CAP);                          // the fibre overlay's own segment buffer (CONTRACTS 1.12 A)
    this.segs = new Float32Array(CAP * 12);
    this.fo = { nl: 0, nF: 0, N: 0, flowMid: 0, alpha: 0, band: [0, 0, 0], lvl: 0, alive: 0, dyn: 1, s: 1, wpx: 1, dist: 1, mood: this.mood, vp: this.vp };
    this.rt.label = FORMS[0];
  },

  // formA -> formB. `target` is the shape the music is asking for (formations.js); asking for the one already on
  // screen is not a change at all, which is why a phrase line in the middle of a steady groove leaves the picture
  // alone. `force` re-pours even into the same shape — the drop's burst, which must always be visible.
  //
  // A pour that lands on one that has BARELY STARTED is a RE-TARGET, not a new pour (§61 step 3): `formA` / `formB` /
  // `formT` are a single interpolation, so setting `formA = formB` while the cloud is still 1 % of the way across
  // declares it to be AT a shape it has not reached — the picture snaps there in one frame and then pours back.
  // Measured once in the three traces, and it is a real snap: Vienna 73.27 s a phrase pour galaxy -> torus, 73.28 s
  // the drop's burst on top of it with `formT` at 0.009, so `formA` jumped galaxy -> torus on one frame. Keeping
  // `formA` and `formT` and only re-aiming `formB` is continuous and is what the music asked for. SeeYouDrop's own
  // two drop bursts land at `formT` 0.933 and 0.721 and CyborgNinja never pours, so nothing already signed off moves.
  reform(target, force) {
    const k = ((target | 0) % 4 + 4) % 4;
    if (!force && k === this.formB && this.formT >= 1) return false;
    if (this.formT < RETARGET) { if (k === this.formB) return false; this.formB = k; this.nRef++; return true; }
    this.formA = this.formB;
    this.formB = k;
    this.formT = 0;
    this.nRef++;
    return true;
  },

  update(dt, MS, GROOVE, LOOK, env) {
    this.lastMS = MS;                                    // hooks.dinfo() reads it; nothing else does (§1.15: never across frames)
    // The beat grid (grid.js): one angle, a closed form of the beat COUNT and PHASE so it can never drift, whose
    // velocity is a base glide plus a raised-cosine accent peaking ON the beat (§61 step 2 — §58's shaped impulse
    // was the stop-start the user called jerky). The galaxy's winding rides the same angle at its own rate.
    this.spin = spin(this.sp, MS, dt);
    this.spinG = GAL_K * this.spin;

    // The three transient voices. The attack fires on whichever comes first — the ears' event or the v2 level's
    // rising edge — because the two pickers miss different hits (voices.js: the numbers, graded against the truth);
    // the age places it sub-frame, the level sizes it, and the decay is slow off that age.
    voice(this.vK, dt, MS.kick2, MS.kickAge, MS.kickEvt);
    voice(this.vS, dt, MS.snare2, MS.snareAge, MS.snareEvt);
    // the hat's trigger quality: while the high band is swelling (more than BED.R x its own 2 s average) the ears'
    // hat EVENT is not a hat — the sparkly / dreamy layer the user heard, and the ears' running-median picker cannot
    // tell its leading edge from a stick (voices.js: the numbers). The level's edge still fires the voice.
    this.hSwell = bed(this.hBed, dt, MS.highS);
    voice(this.vH, dt, MS.hat2, MS.hatAge, MS.hatEvt, this.hSwell);
    sub(this.vB, dt, MS);
    // The real tension: the void before a drop (§54), not the roughness. The last bar winds up on top of it, and
    // the slam lets everything go at once.
    tens(this.vT, dt, MS);
    // The track's own loud, held with a 25 s release: `eM / peak` is the one honest reading of "how loud is this
    // part of the song" the engine can give a scene (dyn.js). The drop's own envelope floors it, because `eM` is a
    // 2.5 s mean and is still half-full of the void on the frame the slam lands.
    dyn(this.vD, dt, MS, this.vT.rel);
    if (this.pinD >= 0) this.vD.dyn = this.pinD;
    this.E.k = emaK(dt);            // the slow spectrum's step for this frame; the pass itself runs in draw()

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
    m.build = Math.min(1.25, this.vT.build + 0.3 * this.vT.wind); m.rel = this.vT.rel; m.dyn = this.vD.dyn;
    m.vk = this.vK.e; m.vs = this.vS.e; m.vh = this.vH.e; m.vb = this.vB.e;
    m.ringR = ringR(this.vS, midR(this.formA, this.formB, this.formT)); m.ringW = ringW(this.vS);
    m.spin = this.spin % (Math.PI * 2); m.spinG = this.spinG % (Math.PI * 2);   // wrapped: fp32 in the shader
    const q = LOOK.mood, d = this.mood;
    // The palette's centre is the KEY, not the mood's own hue: `LOOK.mood` is still the base the anchor eases
    // AWAY from, and is all that is left when the key is not trusted (keycolour.js gates on `keyConf`).
    const A = KEY.anchor(dt, MS.key, MS.mode, MS.keyConf, MS.valence, MS.harmAngle, q.hue, this.keyPin);
    // the void drains the palette: the colour goes out of the cloud and the hue family closes toward one hue,
    // and the drop's release puts it back (the mood object is the fibres' palette too, so the rings drain with it)
    const dr = 1 - 0.55 * Math.min(1, m.build);
    d.hue = A.hue; d.sat = Math.min(1.2, q.sat * A.sat) * dr; d.bri = q.bri; d.spread = q.spread * (1 - 0.35 * Math.min(1, m.build));
    d.invert = q.invert; d.angular = q.angular;

    this.rt.time = MS.flow;                              // the visual clock is musical time, not the wall clock
    this.rt.label = FORMS[this.formA] + (this.formT < 1 ? '>' + FORMS[this.formB] + ' ' + this.formT.toFixed(2) : '') + ' ' + this.spin.toFixed(1);
  },

  draw(target, { w, h }) {
    const ctx = this.ctx, gl = ctx.gl, P = this.pr;
    if (!P || !P.p) return;
    ema(ctx, this.E);                                    // the slow spectrum, first: the swarm's pass rebinds after it
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
    gl.uniform1f(P.u('uDyn'), m.dyn);
    gl.uniform1f(P.u('uAlive'), m.alive);
    gl.uniform1f(P.u('uHue'), d.hue);
    gl.uniform1f(P.u('uSat'), d.sat);
    gl.uniform1f(P.u('uBri'), d.bri);
    gl.uniform1f(P.u('uSpread'), d.spread);
    gl.uniform1f(P.u('uInvert'), d.invert);
    gl.uniform1f(P.u('uAngular'), d.angular);
    ctx.tex(P, 'uSpec', 0, ctx.engineTex.spec);
    ctx.tex(P, 'uWave', 1, ctx.engineTex.wave);
    ctx.tex(P, 'uEma', 2, this.E.a);                     // the slow spectrum the pass above just wrote
    ctx.tex(P, 'uNorm', 3, this.E.n);                    // ...and this frame's normaliser for it, one texel
    gl.uniform3f(P.u('uHab'), this.habOn ? 1 : 0, HAB, NW);
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
    o.flowMid = m.flowMid; o.lvl = m.lvl; o.alive = m.alive; o.dyn = m.dyn;
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
    dyn(v) { SELF.pinD = v === '' || v === undefined || v === null ? -1 : +v; },     // -1 = the music chooses (the default)
    hab(v) { SELF.habOn = +v; },                                                    // &hab=0: pass 1's drive, for the A/B
    // &bed=<ratio>,<seconds> (and hooks.bed(r, tc)): the hat voice's swell veto, for the user's own A/B (§64 task 1).
    // '' restores the measured default 1.05,2. `1,0.05` is effectively off (every frame is a swell is never true at
    // ratio 1 only if the band is flat — use 99 to turn it off outright).
    bed(r, tc) {
      const a = typeof r === 'string' ? r.split(',') : [r, tc];
      if (a[0] !== '' && a[0] !== undefined && a[0] !== null && +a[0] >= 1 && +a[0] <= 99) BED.R = +a[0];
      if (a[1] !== '' && a[1] !== undefined && a[1] !== null && +a[1] >= 0.05 && +a[1] <= 60) BED.TC = +a[1];
      return JSON.stringify(BED);
    },
    // &nudge=<glide>,<width> (and hooks.nudge(g, w) from a page): the beat nudge's velocity profile, for the user's
    // own A/B of how much glide the motion wants (§61 step 2). '' restores the measured default.
    nudge(g, w) {
      const a = typeof g === 'string' ? g.split(',') : [g, w];
      if (a[0] !== '' && a[0] !== undefined && a[0] !== null && +a[0] >= 0 && +a[0] < 1) NUDGE.GLIDE = +a[0];
      if (a[1] !== '' && a[1] !== undefined && a[1] !== null && +a[1] > 0.02 && +a[1] <= 1) NUDGE.W = +a[1];
      return JSON.stringify(NUDGE);
    },
    // &key=<k> (and hooks.key(k, m) from a page) pins the key so a shot can prove one hue at a time
    key(k, m) { SELF.keyPin = k === null || k === undefined || k === '' || k < 0 ? null : { k: ((k | 0) % 12 + 12) % 12, m: (m | 0) ? 1 : 0 }; return JSON.stringify(SELF.keyPin); },
    dinfo() {
      return { spin: SELF.spin, spinG: SELF.spinG, nv: SELF.sp.v, nu: SELF.sp.u, nstep: SELF.sp.step,
        noff: SELF.sp.off, njump: SELF.sp.jumps,
        formA: SELF.formA, formB: SELF.formB, formT: SELF.formT,
        why: SELF.why === 'phrase' ? 1 : SELF.why === 'novel' ? 2 : SELF.why === 'drop' ? 3 : SELF.why === 'return' ? 4 : 0,
        want: shapeFor(SELF.lastMS || {}),
        nRef: SELF.nRef, vk: SELF.vK.e, vs: SELF.vS.e, vh: SELF.vH.e, vb: SELF.vB.e,
        build: SELF.vT.build, wind: SELF.vT.wind, rel: SELF.vT.rel, con: SELF.m.build, sat: SELF.mood.sat,
        dyn: SELF.m.dyn, pk: SELF.vD.pk, dr: SELF.vD.r,
        hue: SELF.mood.hue, hsat: SELF.mood.sat, key: KEY.OUT.key, kmode: KEY.OUT.mode, kconf: KEY.OUT.conf,
        fifth: KEY.OUT.fifth,
        ageK: SELF.vK.age, ageS: SELF.vS.age, ageH: SELF.vH.age,
        fK: SELF.vK.n, fS: SELF.vS.n, fH: SELF.vH.n,
        aK: SELF.vK.amp, aS: SELF.vS.amp, aH: SELF.vH.amp,
        srcK: SELF.vK.src, srcS: SELF.vS.src, srcH: SELF.vH.src,
        hBed: SELF.hBed.s, hSwell: SELF.hSwell ? 1 : 0,
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
