// CHLADNI (v0.15, id 11, "slot 12") — sand on a vibrating plate, driven by the sub. A Chladni plate is sound made
// visible by resonance: sand gathers on the nodal lines of the plate's eigenmode and the figure is set by the pitch.
// Built to show the v0.15 engine's ears (the sub's pitch / slides / purity / gate, kicks placed by their onset age, and
// in file mode the whole track in advance), tuned on SeeYouDrop. The user asked for it on 2026-09-27; forced-only until
// approved (score() is 0, no digit key: `n` cycles to it, or &scene=11). Brief: docs/workers/brief-chladni.md.
//
// ONE MUSICAL ELEMENT, ONE VISUAL CHANNEL (CONTRACTS §0, the legibility rule of the brief). The sub's PITCH picks the
// figure and nothing else; the kick throws the sand and touches no figure; purity mixes in harmonic figures; the gate
// stops the plate; the register moves the camera. Continuous things ride heard time (the ears already do), events are
// placed by their `…Age` so a throw lands sub-frame. Nothing here reads a wall clock or Math.random.
//
// THE PLATE IS A RAY CAST, not geometry (shaders.js): one fullscreen pass intersects the plane z = 0, so the plate is
// exact at any camera elevation and there is no quad to letterbox. The sand is a GPU ping-pong of one texel per grain
// (sand.js). The numerics — the figure, the table, the slide's blend, the harmonic mix and the GLSL twin — are in
// assets/math/chladni.js with a node test (tools/test_chladni.js).

import { blendOf, figOf, NFIG } from '../../math/chladni.js';
import { mkAnchor, wrap } from '../../math/keycolour.js';
import { mkNudge } from '../../math/nudge.js';
import { clamp, ema, TAU } from '../../math/util.js';
import { PLATE_FS, SAND_FS, SAND_VS, SAND_FS_DRAW, SETTLE_FS } from './shaders.js';
import { mkSand, DELTA } from './sand.js';
import { HELP } from './help.js';

// --- the leans. Every constant named for what it does; the user corrects them at the first montage. ---
const FOV = 1.05;            // vertical field of view (rad, ~60 deg) — the plate fills the frame without fisheye
const PITCH_SUB = 0.58;      // bassReg 0 (a 35 Hz sub): the camera is LOW and heavy, almost in the plate
const PITCH_MID = 1.24;      // bassReg 1 (a 140 Hz mid-bass): nearly overhead, the plate small — the 1:38 climb
const DIST_SUB = 1.78;       // and close
const DIST_MID = 3.70;       // and far away
const CAMTC = 0.45;          // the camera eases over ~1.4 s: a register change is music, never a cut
const BOUNCE = 0.05;         // the thump per felt beat, on the camera distance (TORUS2's number, the user's own)
const TILTB = 0.55;          // how far the build tilts the camera up through the void
const SLIDETC = 0.07;        // the figure's own ease: a slide tracks it exactly, a note JUMP becomes a 4-frame morph
                             // (CONTRACTS §1.9 'continuous' — nothing on screen may jump, not even a note change)
const LINEW = 0.052;         // the nodal line's half-width in field units: a line, not a band
const GLOW0 = 0.95;          // how brightly a nodal line glows when the plate is driven
const GLOWQ = 0.34;          // and the floor it keeps when it is not, so a silent figure is still legible
const AMPTC_UP = 0.05;       // the drive's attack — a drop must land on the frame it lands on
const AMPTC_DN = 0.18;       // and its release, slower, so the plate rings down instead of switching off
const GATETC = 0.035;        // the gate: drop 2's stomp must read as a stop, so this is fast
const AMPK = 1.35;           // how much vibration the sub's level buys
const LIFTTC = 0.30;         // the void's lift: the sand rises over ~1 s when the plate falls silent
const SPIRAL = 0.9;          // how hard the build spirals the sand inward
const NOTEHUE = 0.42;        // how far round the fifths wheel the sub note's own hue sits from the tonic's
const ANTIHUE = 0.11;        // and the antinodes' hue, a shade off the lines'
const KEYC = 0.25;           // below this tonicConf the old `key` is used instead of `tonic` (Appendix A's fallback)
const WALK = 4.40;           // the random walk's step, plate units per second at |u| = 1 and full drive: the plate
                             // throws a grain hardest where it moves most, which is the whole mechanism
const DESC = 1.00;           // the descent on u^2, per second: what makes a thrown grain LAND on a line and stay
const GRAV = 11.0;           // the leap's gravity, plate units per second squared: a kick's throw lands in ~0.2 s
const LEAPK = 0.62;          // and how high a kickVel of 1 throws a grain sitting on an antinode
const PTPX = 2.3;            // a grain's size in px at 720 p, at unit view depth
const SANDB = 1.15;          // how bright the sand is
const NEAR = 0.05;           // the points pass's near / far planes: the plate is 2 units across at 1.8 to 4.2 away
const FAR = 20;
const WALKN = 2;             // a section with this many different sub notes in it is a WALK: the plate goes round
const BNDTC = 0.9;           // and the boundary morphs over ~2.7 s, never cutting

const SU = { s: 0, h: 0, bnd: 0, walk: 0, desc: DESC, dt: 1 / 60, gate: 0, amp: 0, lift: 0, spiral: 0 };
const U = { s: 0, h: 0, bnd: 0, amp: 0, gate: 0, lift: 0, spiral: 0, glow: GLOW0, fog: 0, hue: 0, yaw: 0, pitch: PITCH_SUB, dist: DIST_SUB, bounce: 0, ripA: 99, ripK: 0, ripD: 0, snA: 99, snR: 0, tonic: 0, note: -1, fig: '1/2', drive: 0, kickAge: 99, kickVel: 0 };
const MOOD = [0, 1, 1];
const EYE = [0, 0, 0];
const BAS = new Float32Array(9);
let ASP = 16 / 9;
let figPin = -1;             // hooks.figure(s): pin the fractional interval so a montage compares figures, not music
let earsPin = -1;            // hooks.ears(k): pin the ear block to a named preset (#test never fills the new fields)

// The ear block the scene actually reads, so one place decides what a pin means. `p` = the preset, −1 = the real ears.
const EARS = { note: -1, cents: 0, conf: 0, pure: 1, gate: 0, sub: 0, eG: 0, reg: 0, tonic: 0, minor: 1, tconf: 0 };
const PRESETS = [
  { note: 1, cents: 0, conf: 1, pure: 1, gate: 1, sub: 0.85, eG: 0.8, reg: 0, tonic: 1, minor: 1, tconf: 1 },   // 1: the groove — a pure 808 on the tonic
  { note: 1, cents: 0, conf: 1, pure: 0.1, gate: 1, sub: 0.8, eG: 0.7, reg: 1, tonic: 1, minor: 1, tconf: 1 },  // 2: the intro — a harmonic mid-bass, overhead
  { note: -1, cents: 0, conf: 0, pure: 1, gate: 0, sub: 0, eG: 0.25, reg: 0.5, tonic: 1, minor: 1, tconf: 1 },  // 3: the void — no sub at all
];

// The camera: eye on a circle of radius `dist` at elevation `pitch`, looking at the plate's centre. The basis is
// (right, up, forward) as the three columns of uCamB, so the plate pass's ray is sc.x·right + sc.y·up + focal·forward.
function camera(yaw, pitch, dist) {
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  EYE[0] = dist * cp * Math.sin(yaw);
  EYE[1] = -dist * cp * Math.cos(yaw);
  EYE[2] = dist * sp;
  const fx = -EYE[0] / dist, fy = -EYE[1] / dist, fz = -EYE[2] / dist;
  // right = normalize(forward x worldUp), worldUp = (0, 0, 1) — the plate's own normal
  let rx = fy, ry = -fx, rz = 0;
  const rl = Math.hypot(rx, ry) || 1;
  rx /= rl;
  ry /= rl;
  const ux = ry * fz - rz * fy, uy = rz * fx - rx * fz, uz = rx * fy - ry * fx;
  BAS[0] = rx; BAS[1] = ry; BAS[2] = rz;
  BAS[3] = ux; BAS[4] = uy; BAS[5] = uz;
  BAS[6] = fx; BAS[7] = fy; BAS[8] = fz;
}

// test hook: pin the fractional interval (0..12, fractional allowed). Called with nothing or < 0, it releases.
function figure(v) {
  figPin = v === null || v === undefined || +v < 0 ? -1 : +v % NFIG;
  return figPin;
}

// test hook: pin the ears to a preset — #test's fake timeline never fills subNote / subGate / subPure / tonic, and the
// harness has no &fix= hash param (docs/workers/chladni.md friction 1), so a headless md5 or montage says &ears=1.
function ears(v) {
  earsPin = v === null || v === undefined || +v < 1 ? -1 : Math.min(PRESETS.length, +v | 0);
  return earsPin;
}

// The view-projection for the sand's points, column-major, built from the same yaw / pitch / dist as the plate's ray
// cast so a grain and the line it sits on are drawn by the same camera. Right-handed, looking down -z in view space.
function lookVP(m, aspect, focal) {
  const rx = BAS[0], ry = BAS[1], rz = BAS[2], ux = BAS[3], uy = BAS[4], uz = BAS[5], fx = BAS[6], fy = BAS[7], fz = BAS[8];
  const de = fx * EYE[0] + fy * EYE[1] + fz * EYE[2];
  const A = (FAR + NEAR) / (NEAR - FAR), Bp = (2 * FAR * NEAR) / (NEAR - FAR), sx = focal / aspect;
  m[0] = sx * rx; m[4] = sx * ry; m[8] = sx * rz; m[12] = -sx * (rx * EYE[0] + ry * EYE[1] + rz * EYE[2]);
  m[1] = focal * ux; m[5] = focal * uy; m[9] = focal * uz; m[13] = -focal * (ux * EYE[0] + uy * EYE[1] + uz * EYE[2]);
  m[2] = -A * fx; m[6] = -A * fy; m[10] = -A * fz; m[14] = A * de + Bp;
  m[3] = fx; m[7] = fy; m[11] = fz; m[15] = -de;
}

// test hook, read-only: the settle instrument — the fraction of the sand within DELTA of a nodal line, by one byte
// readback of a pass over the grain texture (a pipeline stall, so it is only ever called from a harness eval).
function settle() {
  const sc = SELF;
  if (!sc.sand || !sc.ctx) return JSON.stringify({ n: 0, settled: 0, delta: DELTA, air: 0 });
  return JSON.stringify(sc.sand.settle(SU, sc.ctx.budget('points')));
}

// test hook, read-only (CONTRACTS §1.4: a hook that reports must not mutate): the live look numbers.
function info() {
  return JSON.stringify({ s: +U.s.toFixed(4), fig: U.fig, h: +U.h.toFixed(3), bnd: +U.bnd.toFixed(3), amp: +U.amp.toFixed(4), gate: +U.gate.toFixed(3), lift: +U.lift.toFixed(3), spiral: +U.spiral.toFixed(3), glow: +U.glow.toFixed(3), fog: +U.fog.toFixed(3), note: U.note, tonic: U.tonic, hue: +U.hue.toFixed(4), yaw: +U.yaw.toFixed(4), pitch: +U.pitch.toFixed(4), dist: +U.dist.toFixed(4), drive: +U.drive.toFixed(4), figPin, earsPin });
}

const SELF = {
  name: 'chladni',
  id: 11,
  tag: 'Chladni plate — sand on the nodal lines of the figure the sub bass sets; kicks throw it, slides morph it, silence lets it float',
  card: { title: 'CHLADNI', blurb: 'sand on a vibrating plate: the bass note draws the figure, every kick throws the sand, every slide melts one figure into the next' },
  feats: ['subNote', 'subCents', 'subConf', 'subGate', 'subPure', 'subNoteEvt', 'sub', 'eG', 'mapOn', 'bassReg',
    'lpSweep', 'tonic', 'tonicMinor', 'tonicConf', 'key', 'mode', 'keyConf', 'valence', 'harmAngle', 'beatPhase',
    'beatCount', 'pulse', 'hush', 'calm', 'flow', 'buildProg', 'dropConf', 'mapBoundaryEvt', 'sectionEvt'],
  cuts: 'continuous',
  rt: {},
  hooks: { figure, ears, info, settle },
  // the continuity monitor's shape (tools/monitor.js reads CARD.NAV || CARD.home, so a run points CARD.NAV here):
  // cPath is where the camera is looking from, in radians — the thing that must never jump on this screen.
  state: { mode: 'plate', cPath: [0, PITCH_SUB], pathCut: 0, kick: { x: 0 }, baby: null },

  // never auto-picked until the user approves it
  score() {
    return 0;
  },

  init(ctx) {
    this.ctx = ctx;
    ctx.onResize((w, h) => { ASP = w / Math.max(1, h); });
    this.pr = ctx.mkProg(PLATE_FS, 'chladni-plate');
    this.prSand = ctx.mkProg(SAND_FS, 'chladni-sand');
    this.prDraw = ctx.mkProg(SAND_VS, SAND_FS_DRAW, 'chladni-grains');
    this.prSettle = ctx.mkProg(SETTLE_FS, 'chladni-settle');
    this.sand = mkSand(ctx, { sand: this.prSand, settle: this.prSettle });
    this.vao = ctx.gl.createVertexArray();
    this.vp = new Float32Array(16);
    this.anchor = mkAnchor();
    this.nudge = mkNudge();
    this.sec = { notes: 0, last: -1, walk: 0 };
    camera(0, PITCH_SUB, DIST_SUB);
  },

  // Read the ears once, through the pin, so update() has one source. #test leaves the new fields at their defaults
  // (subNote −1, subGate 0, tonic −1), which is why &ears= exists at all.
  readEars(MS) {
    const P = earsPin > 0 ? PRESETS[earsPin - 1] : null;
    if (P) {
      Object.assign(EARS, P);
      return EARS;
    }
    EARS.note = MS.subNote | 0;
    EARS.cents = MS.subCents;
    EARS.conf = MS.subConf;
    EARS.pure = MS.subPure;
    EARS.gate = MS.subGate;
    EARS.sub = MS.sub;
    EARS.eG = MS.eG;
    EARS.reg = MS.bassReg;
    EARS.tonic = MS.tonic >= 0 ? MS.tonic | 0 : MS.keyConf > KEYC ? MS.key | 0 : 0;
    EARS.minor = MS.tonic >= 0 ? MS.tonicMinor | 0 : MS.mode | 0;
    EARS.tconf = MS.tonic >= 0 ? MS.tonicConf : MS.keyConf;
    return EARS;
  },

  update(dt, MS, GROOVE, LOOK, env) {
    const E = this.readEars(MS);
    U.tonic = E.tonic;
    U.note = E.note;

    // 1. THE FIGURE — the sub's pitch, and nothing else. The fractional interval above the tonic is continuous through
    // a slide by construction: subCents is cents from the NEAREST note, so when the note flips at the halfway point the
    // cents flip the other way and interval + cents/100 does not move. The ease takes the short way round the twelve
    // (a note jump is a fast morph, not a cut) and holds the last figure while the sub is gone.
    if (figPin >= 0) {
      U.s = figPin;
    } else {
      if (E.note >= 0 && E.gate > 0.5) this.sTgt = ((E.note - E.tonic) % NFIG + NFIG) % NFIG + E.cents / 100;
      if (this.sTgt === undefined) this.sTgt = 0;
      const d = NFIG * wrap((this.sTgt - U.s) / NFIG);         // wrap() is keycolour's short way round a wheel
      U.s = (U.s + d * (1 - Math.exp(-dt / SLIDETC)) + NFIG) % NFIG;
    }
    const B = blendOf(U.s);
    const FA = figOf(B.i), FB = figOf(B.j);
    U.fig = B.f < 0.5 ? FA.n + '/' + FA.m : FB.n + '/' + FB.m;

    // 2. PURITY — how sine-like the bass is mixes in the (2n, 2m) and (3n, 3m) figures: clean lines for a pure 808,
    // busy rough ones for the intro's harmonic mid-bass. Held while the sub is gone (a purity of silence means nothing).
    if (E.gate > 0.5 || earsPin > 0) this.hTgt = clamp(1 - E.pure, 0, 1) * clamp(E.conf * 1.5, 0, 1);
    if (this.hTgt === undefined) this.hTgt = 0;
    U.h = ema(U.h, this.hTgt, dt, SLIDETC * 3);

    // 3. THE DRIVE and THE GATE — the sub's level is how hard the sand dances and how bright the antinodes glow; eG
    // (file mode) restores the track's macro arc the AGC flattens. The gate stops the plate for drop 2's stomp.
    U.gate = ema(U.gate, E.gate > 0.5 ? 1 : 0, dt, GATETC);
    U.drive = AMPK * E.sub * (MS.mapOn > 0.5 ? 0.35 + 0.65 * E.eG : 1);
    const tgt = U.drive * U.gate;
    U.amp = ema(U.amp, tgt, dt, tgt > U.amp ? AMPTC_UP : AMPTC_DN);

    // 4. THE VOID — no sub, so nothing settles: the sand lifts and floats, a soft mid light takes over, and the build
    // spirals what is left inward. `buildProg` in file mode, `dropConf` live (Appendix A's fallback).
    U.lift = ema(U.lift, 1 - U.gate, dt, LIFTTC);
    const antic = MS.mapOn > 0.5 ? MS.buildProg : MS.dropConf;
    U.spiral = ema(U.spiral, SPIRAL * antic * U.lift, dt, LIFTTC);

    // 5. THE PLATE'S BOUNDARY — square while the sub holds one note, round (the asymptotic Bessel figure) while it
    // WALKS. The section's own note count decides, so it works live as well as from the map, and a section that comes
    // back comes back to its shape through look memory (CONTRACTS §1.11).
    if (MS.mapBoundaryEvt || MS.sectionEvt) { this.sec.notes = 0; this.sec.last = -1; }
    if (MS.subNoteEvt && E.note >= 0 && E.note !== this.sec.last) { this.sec.notes++; this.sec.last = E.note; }
    this.sec.walk = this.sec.notes >= WALKN ? 1 : 0;
    U.bnd = ema(U.bnd, this.sec.walk, dt, BNDTC);

    // 6. THE CAMERA — the register is the elevation: a 35 Hz sub is low and heavy and fills the frame, a mid-bass is
    // seen from overhead and small. The build tilts it up; the felt beat thumps it; the nudge turns the plate.
    const reg = clamp(E.reg, 0, 1);
    U.pitch = ema(U.pitch, PITCH_SUB + (PITCH_MID - PITCH_SUB) * reg + TILTB * antic, dt, CAMTC);
    U.bounce = BOUNCE * Math.pow(Math.max(0, Math.cos(TAU * MS.beatPhase)), 4);
    const dTgt = (DIST_SUB + (DIST_MID - DIST_SUB) * reg) / (1 + U.bounce);
    U.dist = ema(U.dist, dTgt, dt, CAMTC * 0.25);
    // the nudge: the target is read off the BEAT COUNT divided by the felt beat, so it cannot drift, and it eases
    // (math/nudge.js). pulse 0.5 = half time: sixteen FELT beats still make one turn.
    U.yaw = this.nudge.turn(dt, ((MS.beatCount * Math.max(0.25, MS.pulse)) / 16) * TAU % TAU, Math.max(MS.hush, MS.calm));
    camera(U.yaw, U.pitch, U.dist);

    // 7. COLOUR — the key as a hue anchor on the circle of fifths (math/keycolour.js), on the TONIC the new ears
    // report (`key` was the fifth on this track); the figure's glow takes the sub note's own hue, its distance from
    // the tonic round the same wheel. Major warm / minor cool is the anchor's job.
    const m = (LOOK && LOOK.mood) || { hue: 0, sat: 0.7, bri: 0.8, spread: 0.5 };
    const A = this.anchor.anchor(dt, E.tonic, E.minor, Math.max(E.tconf, 0.35), MS.valence, MS.harmAngle, m.hue, null);
    MOOD[0] = A.hue;
    MOOD[1] = Math.min(1.2, (0.45 + 0.55 * m.sat) * A.sat);
    MOOD[2] = 0.95 + 0.55 * m.bri;
    const nh = E.note >= 0 ? NOTEHUE * wrap((((7 * E.note) % 12) - ((7 * E.tonic) % 12)) / 12) : 0;
    U.hue = ema(U.hue, nh, dt, SLIDETC * 4);
    U.glow = GLOW0 * (GLOWQ + (1 - GLOWQ) * clamp(0.3 + U.amp, 0, 1));
    U.fog = MS.lpSweep;

    // the sand's own block: one place the state pass and the settle instrument both read
    SU.s = U.s;
    SU.h = U.h;
    SU.bnd = U.bnd;
    SU.walk = WALK;
    SU.desc = DESC;
    SU.dt = Math.min(0.05, dt);          // a long frame must not teleport the sand off the plate
    SU.gate = U.gate;
    SU.amp = clamp(U.amp, 0, 1.6);
    SU.lift = U.lift;
    SU.spiral = U.spiral;

    this.rt.time = MS.flow;
    this.rt.label = 'fig ' + U.fig + ' s ' + U.s.toFixed(2);
    const st = this.state;
    st.cPath[0] = U.yaw;
    st.cPath[1] = U.pitch;
    st.mode = this.sec.walk ? 'walk' : 'held';
    st.kick.x = 0;
  },

  draw(target, { w, h }) {
    const ctx = this.ctx, g = ctx.gl, pr = this.pr;
    if (!pr || !pr.p || !this.sand) return;
    const count = ctx.budget('points');           // the core's per-tier particle budget, read every draw (CONTRACTS 1.4)
    this.sand.step(SU, count);                    // one state step, into the sand's own target
    ctx.use(pr, target, w, h);
    g.uniform3f(pr.u('uEye'), EYE[0], EYE[1], EYE[2]);
    g.uniformMatrix3fv(pr.u('uCamB'), false, BAS);
    g.uniform2f(pr.u('uLens'), 1 / Math.tan(FOV * 0.5), ASP);
    g.uniform4f(pr.u('uFig'), U.s, U.h, U.bnd, LINEW);
    g.uniform4f(pr.u('uDyn'), U.amp, U.glow, U.ripD, 0);
    g.uniform4f(pr.u('uHue'), U.hue, ANTIHUE, U.fog, U.lift);
    g.uniform3f(pr.u('uRip'), U.ripA, U.ripK, U.snR);
    g.uniform3f(pr.u('uMood'), MOOD[0], MOOD[1], MOOD[2]);
    g.clearColor(0, 0, 0, 1);
    g.clear(g.COLOR_BUFFER_BIT | g.DEPTH_BUFFER_BIT);
    ctx.tri();
    this.grains(target, w, h, count);
  },

  // The sand, drawn last: additive gl.POINTS over the plate, no depth (the plate pass wrote none and the grains are
  // order-independent light). Full viewport — gl.POINTS vanish in an offset one on ANGLE-GL (HARNESS "Pitfalls").
  grains(target, w, h, count) {
    const ctx = this.ctx, g = ctx.gl, pr = this.prDraw;
    if (!pr || !pr.p) return;
    lookVP(this.vp, ASP, 1 / Math.tan(FOV * 0.5));
    ctx.use(pr, target, w, h);
    ctx.tex(pr, 'uPos', 0, this.sand.tex());
    g.uniformMatrix4fv(pr.u('uVP'), false, this.vp);
    g.uniform2f(pr.u('uGrid'), this.sand.grid[0], this.sand.grid[1]);
    g.uniform2f(pr.u('uRes'), w, h);
    g.uniform4f(pr.u('uFig'), U.s, U.h, U.bnd, 0);
    g.uniform4f(pr.u('uLeap'), U.kickAge, U.kickVel, GRAV, LEAPK);
    g.uniform4f(pr.u('uSand'), PTPX, SANDB * (0.55 + 0.45 * Math.min(1, U.amp + U.lift)), U.gate, U.lift);
    g.uniform4f(pr.u('uHue'), U.hue, ANTIHUE, U.fog, U.lift);
    g.uniform3f(pr.u('uMood'), MOOD[0], MOOD[1], MOOD[2]);
    const wasDepth = g.isEnabled(g.DEPTH_TEST);
    g.disable(g.DEPTH_TEST);
    g.enable(g.BLEND);
    g.blendFunc(g.ONE, g.ONE);
    g.bindVertexArray(this.vao);
    g.drawArrays(g.POINTS, 0, count);
    g.bindVertexArray(null);
    g.disable(g.BLEND);
    g.blendFunc(g.SRC_ALPHA, g.ONE_MINUS_SRC_ALPHA);
    if (wasDepth) g.enable(g.DEPTH_TEST);
  },

  hud() {
    return 'chladni ' + U.fig + ' s' + U.s.toFixed(2) + ' h' + U.h.toFixed(2) + ' bnd' + U.bnd.toFixed(2)
      + ' amp' + U.amp.toFixed(2) + ' gate' + U.gate.toFixed(2) + ' lift' + U.lift.toFixed(2)
      + ' pit' + U.pitch.toFixed(2) + ' d' + U.dist.toFixed(2) + ' note' + U.note + ' ton' + U.tonic;
  },

  post: { fb: { decay: 0.78 }, bloom: { thr: 0.34 }, kaleido: 0, morph: { flow: 0.4 } },
  colour: { default: 'v2', variants: { v2: {} } },
  help: HELP,
};
export default SELF;
