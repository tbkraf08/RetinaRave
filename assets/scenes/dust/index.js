// DUST — a swarm of gl_VertexID particles that pours between four formations, threaded by a few Hopf tori.
// Lifted from synapse scene 4 ("swarm"); the Hopf-fibre line overlay is back (ctx.lines, CONTRACTS 1.12 path A) —
// faint linked rings drawn additively over the cloud in the same camera, no depth test. See fibre.js.
import { VS_DUST, FS_DUST } from './shaders.js';
import { CAP, counts, emit, fit } from './fibre.js';

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
  feats: ['flow', 'flowMid', 'flowBass', 'bassS', 'midS', 'highS', 'lvl', 'kick', 'dropEnv', 'tension', 'hat',
    'alive', 'arc', 'punchy', 'regularity'],
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
    this.formA = 0; this.formB = 0; this.formT = 1; this.formKick = 0; this.nRef = 0;
    this.kickHi = false; this.dropHi = false;
    this.yaw = 0; this.pitch = 0; this.dist = 4.4;
    this.m = { flow: 0, flowMid: 0, flowBass: 0, bassS: 0, midS: 0, highS: 0, lvl: 0, kick: 0, drop: 0, tension: 0, hat: 0, alive: 0 };
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
    // discrete events, read off the decaying impulses (rising edges)
    const kickOn = MS.kick > 0.5;
    if (kickOn && !this.kickHi && ++this.formKick >= 64 && this.formT >= 1) { this.formKick = 0; this.reform(); }
    this.kickHi = kickOn;
    const dropOn = MS.dropEnv > 0.5;
    if (dropOn && !this.dropHi) this.reform();           // DETONATE: the cloud re-pours on the drop
    this.dropHi = dropOn;
    // the cross-fade advances with the music: energy pushes, kicks shove
    if (this.formT < 1) this.formT = Math.min(1, this.formT + dt * (0.08 + 0.5 * MS.lvl + 0.8 * MS.kick));

    // camera: a slow orbit that breathes with GROOVE, dollying in on bass and on the drop
    this.yaw = 0.35 * GROOVE.rot + 0.05 * MS.flow;
    this.pitch = 0.3 * Math.sin(0.03 * MS.flow);
    this.dist = Math.max(2.2, 4.4 - 0.7 * MS.bassS - 0.5 * MS.dropEnv);

    const m = this.m;
    m.flow = MS.flow; m.flowMid = MS.flowMid; m.flowBass = MS.flowBass; m.bassS = MS.bassS; m.midS = MS.midS;
    m.highS = MS.highS; m.lvl = MS.lvl;
    m.kick = MS.kick; m.drop = MS.dropEnv; m.tension = MS.tension; m.hat = MS.hat; m.alive = MS.alive;
    const q = LOOK.mood, d = this.mood;
    d.hue = q.hue; d.sat = q.sat; d.bri = q.bri; d.spread = q.spread; d.invert = q.invert; d.angular = q.angular;

    this.rt.time = MS.flow;                              // the visual clock is musical time, not the wall clock
    this.rt.label = FORMS[this.formA] + (this.formT < 1 ? '>' + FORMS[this.formB] + ' ' + this.formT.toFixed(2) : '');
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
    gl.uniform1f(P.u('uFlow'), m.flow);
    gl.uniform1f(P.u('uFlowMid'), m.flowMid);
    gl.uniform1f(P.u('uBassS'), m.bassS);
    gl.uniform1f(P.u('uMidS'), m.midS);
    gl.uniform1f(P.u('uLevel'), m.lvl);
    gl.uniform1f(P.u('uKick'), m.kick);
    gl.uniform1f(P.u('uDrop'), m.drop);
    gl.uniform1f(P.u('uTension'), m.tension);
    gl.uniform1f(P.u('uHat'), m.hat);
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
    o.s = S0 * (1 - 0.3 * m.tension) * (1 + 0.6 * m.drop + 0.08 * m.kick);
    o.wpx = 1.5 * (h / 720); o.dist = this.dist;
    const n = emit(this.segs, cap, o);
    this.rt.log = 'fib ' + o.nl + 'x' + o.nF + 'x' + o.N + ' seg ' + n + '/' + cap;
    ctx.lines.set(this.L, this.segs, n);
    ctx.lines.draw(this.L, target, w, h, { mvp: this.vp, blend: 'add' });
  },

  // test hook: &fibres=0 under #test draws the swarm alone (the A/B md5 of the points path)
  hooks: {
    fibres(v) { SELF.fibresOn = +v; },
  },

  // the highest-trail scene in the set: the trails are the feedback effect's job, never faked in the shader
  post: { fb: { decay: 0.95 }, bloom: { thr: 0.3 }, kaleido: 0.5, exposure: { on: true } },
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
      flow: 'the scene clock: the swarm\'s slow spin, the camera\'s orbit, the galaxy arms',
      flowMid: 'the torus and ribbon formations twist on mid-band time; it also twists the fibre rings and wobbles '
        + 'how high up the sphere each ring sits',
      flowBass: 'bass time tumbles the whole family of fibre rings rigidly, so the linked circles roll through '
        + 'each other',
      bassS: 'the torus tube fattens, the whole cloud grows, the camera dollies in; it also lights the first ring',
      midS: 'the wobble of every grain and the ribbon\'s thickness; it also lights the second ring',
      highS: 'lights the third ring: the highest tori brighten with the top of the mix',
      lvl: 'how far each grain is pushed out by its own band, overall brightness, how fast a re-pour completes, and '
        + 'the overall brightness of the rings',
      kick: 'a kick shoves grains outward and brightens them, and swells the rings a little; every 64 kicks the '
        + 'swarm re-pours into a new shape',
      dropEnv: 'the cloud re-pours on the drop, grains fly outward, the rings swell, the camera dollies in',
      tension: 'the cloud contracts and jitters, and the rings draw in with it',
      hat: 'grains sparkle bigger at the edge',
      alive: 'silence fades every grain, and every ring, to black',
      arc: 'never auto-picked during a build',
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
      + 'snapping. The camera orbits with GROOVE and dollies in on bass, so the body of the track is also motion.',
    math: 'Fibonacci sphere: y = 1 - 2n spreads the particles evenly in height (a sphere\'s area per unit height is '
      + 'constant), ring radius r = sqrt(1 - y^2), and the azimuth advances by the golden angle 2pi/phi^2 ~ 2.39996 '
      + 'rad per particle. Because phi is the hardest number to approximate by rationals, successive points never '
      + 'fall into arms or seams, so the sphere is as uniform as a lattice-free point set gets. Torus: with the tube '
      + 'angle v and the ring angle u, p = ((R + r cos v) cos u, r sin v, (R + r cos v) sin u); r = .38 + .2*bassS, '
      + 'so the tube fattens with the low end. Galaxy: radius r = sqrt(h) gives uniform density per unit area, and '
      + 'the arm angle r*2.6 + flow*.35/(r + .35) winds the core faster than the rim, which is what makes spiral '
      + 'arms. Ribbon: the waveform texture sampled along x, twisted by rot(2.5x). Projection: a standard '
      + 'perspective matrix, fov 55 deg, near .1, far 10.1; point size falls as 1/w (w = distance along the view '
      + 'axis) and brightness carries min(1, 50000/count) so adding particles never adds total light. The rings are '
      + 'Hopf fibres: the circle psi -> (cos(t/2) e^i(psi+phi/2), sin(t/2) e^i(psi-phi/2)) on the 3-sphere, sent to a '
      + 'circle in space by stereographic projection from (0,0,0,1); the fibres of one colatitude t lie on a torus of '
      + 'revolution and any two of them are linked exactly once. Rings running near the projection pole are cut and '
      + 'faded out rather than flung to infinity.',
  },
};
export default SELF;
