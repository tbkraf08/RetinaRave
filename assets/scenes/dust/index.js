// DUST — a swarm of gl_VertexID particles that pours between four formations, threaded by a few Hopf tori.
// Lifted from synapse scene 4 ("swarm"); the Hopf-fibre line overlay is back (ctx.lines, CONTRACTS 1.12 path A) —
// faint linked rings drawn additively over the cloud in the same camera, no depth test. See fibre.js.
import { VS_DUST, FS_DUST } from './shaders.js';
import { CAP, counts, emit, fit } from './fibre.js';
import { GAL_K, ease, mkTrigger, spinTarget, trigger } from './grid.js';
import { mkSub, mkTens, mkVoice, ringR, ringW, sub, tens, voice } from './voices.js';

const FORMS = ['sphere', 'torus', 'galaxy', 'ribbon'];
const DEG = Math.PI / 180;
const S0 = 0.7;                 // fibre scale at rest. The pole gate caps a projected ring at sqrt(1.86/.14) = 3.64,
                                // so 0.7 keeps the widest sweep inside the 2.3-unit frame half-height at dist 4.4.

// A deterministic integer hash: the formation shuffle must repeat run to run (#test is bit-identical).
const h11 = (i) => { let p = (i * 0.1031) % 1; p *= p + 33.33; p *= p + p; return p % 1; };

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
    'kick2', 'kickAge', 'snare2', 'snareAge', 'hat2', 'hatAge', 'subNoteEvt', 'subGate',
    'buildLive', 'nextDropIn', 'dropLiveEvt',
    'arc', 'punchy', 'regularity'],
  cuts: 'onset',
  rt: {},
  fibresOn: 1,                  // hooks.fibres — the A/B switch; set before init(), so never reset there

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

  // formA -> formB with a fresh target; the jump of 1..3 keeps it from ping-ponging between two shapes
  reform() {
    this.formA = this.formB;
    this.formB = (this.formB + 1 + Math.floor(h11(this.nRef++ * 7.7 + 3.1) * 3)) % 4;
    this.formT = 0;
  },

  update(dt, MS, GROOVE, LOOK, env) {
    // The beat grid (grid.js): one angle, read off the beat COUNT so it can never drift, eased so every beat is a
    // nudge. The galaxy's winding rides the same angle at its own rate.
    this.spin = ease(this.spin, spinTarget(MS), dt);
    this.spinG = GAL_K * this.spin;

    // The three transient voices. Fast attack on the level's own rising edge, slow decay on the onset's age —
    // and the age is the engine's when the two agree to a frame, the voice's own otherwise (voices.js measured
    // the gap: kick +7 ms, snare +101, hat +92).
    voice(this.vK, dt, MS.kick2, MS.kickAge);
    voice(this.vS, dt, MS.snare2, MS.snareAge);
    voice(this.vH, dt, MS.hat2, MS.hatAge);
    sub(this.vB, dt, MS);
    // The real tension: the void before a drop (§54), not the roughness. The last bar winds up on top of it, and
    // the slam lets everything go at once.
    tens(this.vT, dt, MS);

    // A formation change lands only on a seam of the music — the phrase line, or a bar the store calls new — and
    // never while a pour is still running. The drop is the one exception: it re-pours wherever it lands.
    const why = trigger(this.trig, MS, this.formT >= 1);
    if (why) { this.why = why; this.reform(); }
    const dropOn = MS.dropEnv > 0.5;
    if (dropOn && !this.dropHi) { this.why = 'drop'; this.reform(); }   // DETONATE: the cloud re-pours on the drop
    this.dropHi = dropOn;
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
    m.ringR = ringR(this.vS); m.ringW = ringW(this.vS);
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
    dinfo() {
      return { spin: SELF.spin, spinG: SELF.spinG, formA: SELF.formA, formB: SELF.formB, formT: SELF.formT,
        why: SELF.why === 'phrase' ? 1 : SELF.why === 'novel' ? 2 : SELF.why === 'drop' ? 3 : SELF.why === 'return' ? 4 : 0,
        nRef: SELF.nRef, vk: SELF.vK.e, vs: SELF.vS.e, vh: SELF.vH.e, vb: SELF.vB.e,
        build: SELF.vT.build, wind: SELF.vT.wind, rel: SELF.vT.rel, con: SELF.m.build, sat: SELF.mood.sat,
        ageK: SELF.vK.age, ageS: SELF.vS.age, ageH: SELF.vH.age, ringR: ringR(SELF.vS) };
    },
  },

  // the highest-trail scene in the set: the trails are the feedback effect's job, never faked in the shader
  post: { fb: { decay: 0.95 }, bloom: { thr: 0.3 }, kaleido: 0.5, exposure: { on: true } },

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

  help: {
    // what each field in `feats` moves on this screen (CONTRACTS §1.13); a field without a line falls back to FEATS[k].drives
    feats: {
      flow: 'the scene clock, and the phase of the jitter the roughness shakes the cloud with; the camera drifts on it',
      flowMid: 'the torus and ribbon formations twist on mid-band time; it also twists the fibre rings and wobbles '
        + 'how high up the sphere each ring sits',
      flowBass: 'bass time tumbles the whole family of fibre rings rigidly, so the linked circles roll through '
        + 'each other',
      bassS: 'the torus tube fattens, the whole cloud grows, the camera dollies in; it also lights the first ring',
      midS: 'the wobble of every grain and the ribbon\'s thickness; it also lights the second ring',
      highS: 'lights the third ring: the highest tori brighten with the top of the mix',
      lvl: 'how far each grain is pushed out by its own band, overall brightness, how fast a re-pour completes, and '
        + 'the overall brightness of the rings',
      kick2: 'a kick shoves the inner grains outward and brightens them, swells the rings a little and hurries a '
        + 'pour along — the reactive drums v2, which fire on 808 notes as well as beaters',
      kickAge: 'exactly how long ago that kick was, so the shove is placed between frames instead of on one',
      snare2: 'a snare launches a bright ring at the centre that travels out through the middle of the cloud — '
        + 'the snare\'s own voice, which this screen never had before',
      snareAge: 'how long ago the snare was: it is what puts the ring where it has got to',
      hat2: 'grains sparkle bigger and brighter at the edge, and only at the edge',
      hatAge: 'how long ago the hat was, so the sparkle fades from the hit and not from the frame',
      subNoteEvt: 'a new bass note swells the core of the cloud',
      subGate: 'no bass at all and the core lets go entirely: silence is quiet',
      dropEnv: 'the cloud re-pours on the drop, grains fly outward, the rings swell, the camera dollies in',
      tension: 'the roughness shakes the grains where they stand — jitter, and nothing else; it no longer shrinks '
        + 'the cloud, because a dissonant chord is not a build',
      buildLive: 'the void before a drop draws the whole cloud in, thins the doughnut\'s tube to a wire, pulls the '
        + 'rings tight and drains the colour out of everything',
      nextDropIn: 'inside the last bar before the expected drop the contraction winds up a little further',
      dropLiveEvt: 'the slam: everything the void was holding lets go at once, and the grains overshoot outward',
      alive: 'silence fades every grain, and every ring, to black',
      beatCount: 'the beat grid: the whole cloud is nudged a thirty-second of a turn on every beat, the torus a '
        + 'little further and the galaxy arms further still in their core than at their rim',
      beatPhase: 'together with the bar position it says where the downbeat is, so the first beat of the bar gets '
        + 'half a nudge more than the other three',
      barPos: 'which beat of the bar this is: the downbeat gets the bigger nudge',
      phrase16Pos: 'when the sixteen-beat phrase comes round, the swarm pours into a new shape',
      barNovelEvt: 'a bar that starts something new pours the swarm into a new shape, wherever in the phrase it falls',
      arc: 'the bid: never auto-picked during a build',
      punchy: 'the bid: punchy music invites the swarm',
      regularity: 'the bid: a steady rhythm invites the swarm',
    },
    eli5: 'Every dot is a particle that owns one frequency band of the spectrum. When its band gets loud the dot '
      + 'pushes outward, grows and brightens, so the cloud is a picture of the sound: bass grains breathe near the '
      + 'centre, hi-hat grains sparkle at the edge. The whole swarm keeps pouring from one shape into another — a '
      + 'ball, a doughnut, a galaxy, a ribbon of the waveform — and it re-pours on every drop. Threading through it '
      + 'are a few faint rings that are all hooked through one another like links of a chain, and can never come '
      + 'apart however the music turns them.',
    why: 'A spectrum bar chart wastes the third dimension and hides how many things are happening at once. Giving '
      + 'each of 20k-150k grains its own bin turns the spectrum into a texture you feel rather than read: you see '
      + 'the density of the mix, not just its loudness. Formations change only on kicks and drops (cuts: onset) so '
      + 'the change always lands with the music, and the cross-fade is per-particle so the cloud pours instead of '
      + 'snapping. The camera orbits with GROOVE and dollies in on bass, so the body of the track is also motion. '
      + 'Every turn in the picture is on the beat grid: the cloud, the doughnut and the galaxy arms are nudged a '
      + 'step on each beat and a bigger step on the downbeat, and a shape change waits for the phrase line or for a '
      + 'bar the engine says begins something new — so you can count the bars off the screen with the sound off.',
    math: 'Fibonacci sphere: y = 1 - 2n spreads the particles evenly in height (a sphere\'s area per unit height is '
      + 'constant), ring radius r = sqrt(1 - y^2), and the azimuth advances by the golden angle 2pi/phi^2 ~ 2.39996 '
      + 'rad per particle. Because phi is the hardest number to approximate by rationals, successive points never '
      + 'fall into arms or seams, so the sphere is as uniform as a lattice-free point set gets. Torus: with the tube '
      + 'angle v and the ring angle u, p = ((R + r cos v) cos u, r sin v, (R + r cos v) sin u); r = .38 + .2*bassS, '
      + 'so the tube fattens with the low end. Galaxy: radius r = sqrt(h) gives uniform density per unit area, and '
      + 'the arm angle r*2.6 + 0.9*spin/(r + .35) winds the core faster than the rim, which is what makes spiral '
      + 'arms. The grid: spin eases toward (2pi/32)*(beatCount + bar/2), a target read off the COUNTS and never '
      + 'integrated, so it cannot drift however the tempo moves; the ease has a 0.22 s time constant, which is half '
      + 'a beat at 150 BPM, so each beat lands as a nudge and the bar line lands as one and a half. '
      + 'Ribbon: the waveform texture sampled along x, twisted by rot(2.5x). Projection: a standard '
      + 'perspective matrix, fov 55 deg, near .1, far 10.1; point size falls as 1/w (w = distance along the view '
      + 'axis) and brightness carries min(1, 50000/count) so adding particles never adds total light. The rings are '
      + 'Hopf fibres: the circle psi -> (cos(t/2) e^i(psi+phi/2), sin(t/2) e^i(psi-phi/2)) on the 3-sphere, sent to a '
      + 'circle in space by stereographic projection from (0,0,0,1); the fibres of one colatitude t lie on a torus of '
      + 'revolution and any two of them are linked exactly once. Rings running near the projection pole are cut and '
      + 'faded out rather than flung to infinity.',
  },
};
export default SELF;
