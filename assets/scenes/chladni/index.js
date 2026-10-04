// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
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
import { clamp, ema, sstep, TAU } from '../../math/util.js';
import { PLATE_FS, SAND_FS, SAND_VS, SAND_FS_DRAW, SETTLE_FS, KICKJ } from './shaders.js';
import { mkSand, DELTA } from './sand.js';
import { BAS, BOUNCE, camera, CAMTC, DIST_MID, DIST_SUB, EYE, FOCAL, lookVP, PITCH_MID, PITCH_SUB, TILTB } from './cam.js';
import { ears, figure, PINS, readEars } from './ears.js';
import { HELP } from './help.js';

// --- the leans. Every constant named for what it does; the user corrects them at the first montage. ---
const SLIDETC = 0.07;        // the figure's own ease. A SLIDE (the pitch moving a fraction of a semitone) tracks it
const JUMPTC = 3.0;          // exactly; a JUMP to another table entry is slowed by up to this factor, because the
                             // table is ordered by consonance and not chromatically, so neighbouring semitones are
                             // wildly different figures. A 0.2 s grace note then only gets 60 % of the way and comes
                             // back — a wobble, not a strobe — while a real note change still lands in ~0.3 s
                             // (CONTRACTS §1.9 'continuous': nothing on screen may jump, not even a note change)
const LINEW = 0.052;         // the nodal line's half-width in field units: a line, not a band
const GLOW0 = 0.95;          // how brightly a nodal line glows when the plate is driven
const GLOWQ = 0.34;          // and the floor it keeps when it is not, so a silent figure is still legible
const AMPTC_UP = 0.05;       // the drive's attack — a drop must land on the frame it lands on
const AMPTC_DN = 0.18;       // and its release, slower, so the plate rings down instead of switching off
const GATETC = 0.035;        // the gate: drop 2's stomp must read as a stop, so this is fast
const AMPK = 1.35;           // how much vibration the sub's level buys
const LIFTTC = 0.30;         // the void's lift: the sand rises over ~1 s when the plate falls silent
const SPIRAL = 0.9;          // how hard the build spirals the sand inward
const RIPK = 26.0;           // the hat ripple's radial wavenumber: the "skinnier waves" of 50-57 s, fine and fast
const RIPD = 0.09;           // and how deep it cuts into the figure at hatVel 1 (0.16 made the plate's edge ragged)
const SNAMP = 0.55;          // the snare's flash: how bright its ring is
const SNSPD = 1.9;           // how fast that ring crosses the plate (plate radii per second)
const SNTC = 0.16;           // and how fast it dies
const DROPV = 2.40;          // the drop's slam: the throw a mapDropEvt gives the sand, as a launch VELOCITY (below)
const KSFLOOR = 0.3125;      // the kick's size has a floor: 5.0 / 16 is the low lane's own threshold mapped over the
                             // SPAN kickAmp is built on (DECISIONS §70), i.e. "a hit that only just fired". A real
                             // fire's `kickAmp` cannot read below it, so this only bites where there is no amp to read
                             // at all — a PREDICTED kick (the chladni.kickAge=predKickAge route) before the first real
                             // one, and the frames of a track before any kick has been heard. No throw is invisible.
const FOGLO = 0.80;          // the fog's knee on `lpSweep`, which §73 brought to life. The field is 1 - roll / roll's
const FOGHI = 0.97;          // own running p90, so its MIDDLE is where a track normally sits and not where a filter is
                             // closed: its p50 over the five whole tracks is 0.35 / 0.55 / 0.73 / 0.41 / 0.35 and it is
                             // over 0.5 on 27-74 % of their frames. Fed straight in the fog was a permanent veil on
                             // four tracks of five. Through this knee it is OFF through the body of every track and
                             // full exactly where a filter really closes — SeeYouDrop's last 20 s read 0.96 against
                             // 0.00 for the rest (DECISIONS §74 for the sweep)
const FOGTC = 0.50;          // and it is EASED: `lpSweep` itself steps by 0.13-0.20 in ONE frame at its p99, a jump on
                             // a channel that greys the whole plate (CONTRACTS §1.9). Eased, that p99 is 0.007-0.018
const NOTEHUE = 0.42;        // how far round the fifths wheel the sub note's own hue sits from the tonic's
const ANTIHUE = 0.11;        // and the antinodes' hue, a shade off the lines'
const BASSON = 0.18;         // the bass is SOUNDING when its level, wherever it lives, is above this (the void reads
                             // 0.066, the intro's mid-bass 0.40 — measured on SeeYouDrop, docs/workers/chladni.md)
const REGLO = 0.45;          // bassReg is ~1 whenever no sub is present, so the camera reads it through a knee: below
const REGHI = 0.90;          // REGLO is a sub, above REGHI a mid-bass, and with NO bass at all the register is HELD
const REGTC = 0.60;          // and the knee's OUTPUT is eased: bassReg crosses it in one frame, and an ema whose
                             // target jumps 1.9 rad is itself a jump on its first frame (the continuity monitor
                             // caught exactly that — docs/workers/chladni.md (h))
const HPAD = 0.25;           // the purity knee: the ears read this track's pure 808 at subPure 0.65, not 1, so the
                             // harmonic mix only starts below 1 − HPAD (the intro's 0.05 still gives h 0.93)
const CONF = 0.15;           // below this subConf a new pitch is not accepted — the figure holds
const VOTETC = 0.15;         // the sub's note is decided by a decaying VOTE over the twelve, with this time constant,
const VOTEMARG = 3.0;        // and a challenger must beat the sitting note by this much to take the figure. Re-tuned
                             // against the v0.15 pass-2 ears (sub pitch 100 % within +-30 cents): the filter's own lag
                             // is now the dominant error, so the window is half what pass 1 needed. The walk's four
                             // notes are found +0.15, +0.05, +0.15, +0.20 s after their bar lines — and the ears' own
                             // YIN arrival is +0.14, +0.04, +0.05, +0.05 of that (docs/workers/chladni.md (f))
const LIFTWAIT = 0.40;       // the sand only starts to float after the bass has been gone this long — drop 2's
                             // 60 ms ducks are a stomp, not a void
const WALK = 4.40;           // the random walk's step, plate units per second at |u| = 1 and full drive: the plate
                             // throws a grain hardest where it moves most, which is the whole mechanism
const DESC = 1.00;           // the descent on u^2, per second: what makes a thrown grain LAND on a line and stay
const GRAV = 32.0;           // the leap's gravity, plate units per second squared; with LEAPK it makes a mid grain's
const LEAPK = 5.50;          // throw peak at a quarter of the plate's half-width and land in 0.25 s — inside one beat
const PTPX = 2.3;            // a grain's size in px at 720 p, at unit view depth
const SANDB = 1.15;          // how bright the sand is
const AWAYTC = 2.5;          // how long the plate remembers that the bass is AWAY from the tonic. A held root is a
const AWAY0 = 0.25;          // square plate; a bass that walks (13-25 s, the climbs, the outro) rounds it into the
const AWAY1 = 0.55;          // circular plate's Bessel figure. The measured alternatives are in docs/workers/chladni.md

const SU = { s: 0, h: 0, bnd: 0, walk: 0, desc: DESC, dt: 1 / 60, gate: 0, amp: 0, lift: 0, spiral: 0, kickAge: 99, kickSz: 0 };
const U = { s: 0, h: 0, bnd: 0, amp: 0, gate: 0, lift: 0, spiral: 0, glow: GLOW0, fog: 0, hue: 0, yaw: 0, pitch: PITCH_SUB, dist: DIST_SUB, bounce: 0, ripA: 99, ripK: 0, ripD: 0, snA: 99, snR: 0, tonic: 0, note: -1, fig: '1/2', drive: 0, kickAge: 99, kickSz: 0, snF: 0, away: 0 };
const MOOD = [0, 1, 1];
let ASP = 16 / 9;

// test hook, read-only: the settle instrument — the fraction of the sand within DELTA of a nodal line, by one byte
// readback of a pass over the grain texture (a pipeline stall, so it is only ever called from a harness eval).
function settle() {
  const sc = SELF;
  if (!sc.sand || !sc.ctx) return JSON.stringify({ n: 0, settled: 0, delta: DELTA, air: 0 });
  return JSON.stringify(sc.sand.settle(SU, sc.ctx.budget('points')));
}

// dinfo(): the scene's own numbers, frame by frame, for tools/dust-trace.js. Read-only (CONTRACTS §1.4: a hook that
// reports must not mutate). `set` / `air` come from the settle instrument — a readback, so a pipeline stall, which is
// why it is here and never in update()/draw(): only a trace calls dinfo.
//
// `kH` is what the eye reads for "how high that kick throws the sand": the leap's PEAK, (v·w)²/(2g), at the median
// grain's `w` (the hash's mean is 1.0 and |u| is taken at its 0.55 floor, so it is the conservative figure).
function dinfo() {
  const sc = SELF;
  const st = sc.sand && sc.ctx ? sc.sand.settle(SU, sc.ctx.budget('points')) : { settled: 0, air: 0 };
  const w = (sc.pLeap === undefined ? LEAPK : sc.pLeap) * 0.55;
  return { kAge: U.kickAge, kVel: U.kickSz, kH: (U.kickSz * w) * (U.kickSz * w) / (2 * GRAV),
    kJ: KICKJ * U.kickSz, snF: U.snF, snR: U.snR, ripD: U.ripD,
    amp: U.amp, drive: U.drive, gate: U.gate, lift: U.lift, spiral: U.spiral, glow: U.glow, fog: U.fog,
    s: U.s, h: U.h, bnd: U.bnd, away: U.away, hue: U.hue, pitch: U.pitch, dist: U.dist,
    // the three numbers the FIGURE is made of (§75's ruler): the sub note the vote sits on, the tonic the interval is
    // measured from, and the raw latch behind it — `s` alone cannot say which of the three moved it.
    note: U.note, win: sc.win === undefined ? -1 : sc.win, ton: U.tonic, latch: sc.ton === undefined ? -1 : sc.ton,
    sTgt: sc.sTgt === undefined ? -1 : sc.sTgt,
    set: st.settled, air: st.air };
}

// test hook, read-only (CONTRACTS §1.4: a hook that reports must not mutate): the live look numbers.
function info() {
  return JSON.stringify({ s: +U.s.toFixed(4), fig: U.fig, h: +U.h.toFixed(3), bnd: +U.bnd.toFixed(3), away: +U.away.toFixed(3), amp: +U.amp.toFixed(4), gate: +U.gate.toFixed(3), lift: +U.lift.toFixed(3), spiral: +U.spiral.toFixed(3), glow: +U.glow.toFixed(3), fog: +U.fog.toFixed(3), note: U.note, win: SELF.win === undefined ? -1 : SELF.win, tonic: U.tonic, hue: +U.hue.toFixed(4), yaw: +U.yaw.toFixed(4), pitch: +U.pitch.toFixed(4), dist: +U.dist.toFixed(4), drive: +U.drive.toFixed(4), figPin: PINS.fig, earsPin: PINS.ears });
}

const SELF = {
  name: 'chladni',
  id: 11,
  tag: 'Chladni plate — sand on the nodal lines of the figure the sub bass sets; kicks throw it, slides morph it, silence lets it float',
  card: { title: 'CHLADNI', blurb: 'sand on a vibrating plate: the bass note draws the figure, every kick throws the sand, every slide melts one figure into the next' },
  feats: ['subNote', 'subCents', 'subConf', 'subGate', 'subPure', 'sub', 'eG', 'mapOn', 'bassReg',
    'lpSweep', 'tonic', 'tonicMinor', 'tonicConf', 'key', 'mode', 'keyConf', 'valence', 'harmAngle', 'beatPhase',
    'beatCount', 'pulse', 'hush', 'calm', 'flow', 'buildProg', 'dropConf',
    'kickEvt', 'kickAge', 'kickAmp', 'bass', 'hatAge', 'hatVel', 'snareAge', 'snareAmp', 'mapDropEvt', 'dropEvt',
],
  cuts: 'continuous',
  rt: {},
  hooks: { figure, ears, info, settle, dinfo },
  // the continuity monitor's shape (tools/monitor.js reads CARD.NAV || CARD.home, so a run points CARD.NAV here):
  // cPath is where the camera is looking from, in radians — the thing that must never jump on this screen. `pathCut`
  // is 3, not 0: the monitor's legality test starts `N.pathCut <= 2 ||`, so a scene that publishes 0 is never measured
  // at all and the run passes vacuously (docs/workers/chladni.md friction 4). 3 means "this scene declares no chart
  // cut — measure every frame", and the only free passes left are a kick's rise and a mode change.
  state: { mode: 'plate', cPath: [0, PITCH_SUB], pathCut: 3, kick: { x: 0 }, baby: null },

  // CHLADNI's territory (§93, 2026-10-04, the user's word): sub-driven, dark passages — the sub band and a low centroid.
  // Deliberately a low bid (max .85 against the others' 1.1): the user ranks it among the most boring to watch, so it wins
  // only when the sub owns the mix or the rotation dock has taken the others out. Never during a build.
  // §93 addendum (2026-10-04, the user: "only rotate through NAV, DUST, TORUS2"): forced-only again. The §93 bid was
  // .1 + .45 sub + .3 (1 − centroid), 0 in a build.
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
    this.vote = new Float32Array(NFIG);
    this.tvote = new Float32Array(NFIG);
    this.win = -1;
    this.ton = -1;
    this.lastDt = 1 / 60;
    camera(0, PITCH_SUB, DIST_SUB);
  },

  update(dt, MS, GROOVE, LOOK, env) {
    const P = env.params;                // §1.16: exactly from(view) while nothing is routed
    this.lastDt = dt;                    // readEars() runs the tonic's vote and needs the step (it is called with MS only)
    const E = readEars(this, MS);
    U.tonic = E.tonic;
    U.note = E.note;

    // 1. THE FIGURE — the sub's pitch, and nothing else. The fractional interval above the tonic is continuous through
    // a slide by construction: subCents is cents from the NEAREST note, so when the note flips at the halfway point the
    // cents flip the other way and interval + cents/100 does not move. The ease takes the short way round the twelve
    // (a note jump is a fast morph, not a cut) and holds the last figure while the sub is gone.
    if (PINS.fig >= 0) {
      U.s = PINS.fig;
    } else {
      // Per FRAME the ears' pitch wanders — and so does the truth's own grain track: the 808's attack and decay read
      // as G1 / D1 between the C#1 body, so C#1 is only ~62 % of the groove's grains in tools/truth/SeeYouDrop.json
      // itself. The FIGURE must follow the note a listener hears, so it follows a decaying vote over the twelve,
      // weighted by how loud and how sure the sub is, with hysteresis. The cents still ride on top, continuously,
      // whenever the reported note IS the sitting note — that is the slide.
      const V = this.vote, dec = Math.exp(-dt / VOTETC);
      for (let k = 0; k < NFIG; k++) V[k] *= dec;
      const voted = E.gate > 0.5 && E.note >= 0 && E.conf > CONF;
      if (voted) V[E.note] += dt * E.sub * E.sub * E.conf;
      // the winner only moves on a frame that actually heard a pitch: between two 808 hits `subNote` is −1 with the
      // gate still open, and re-deciding there would let a decayed stray note take the figure in silence
      if (voted) {
        let best = 0;
        for (let k = 1; k < NFIG; k++) if (V[k] > V[best]) best = k;
        if (this.win < 0 || (best !== this.win && V[best] > VOTEMARG * V[this.win])) this.win = best;
      }
      if (this.win >= 0) this.sTgt = ((this.win - E.tonic) % NFIG + NFIG) % NFIG + (this.win === E.note ? E.cents / 100 : 0);
      if (this.sTgt === undefined) this.sTgt = 0;
      const d = NFIG * wrap((this.sTgt + P.figure - U.s) / NFIG);   // wrap() is keycolour's short way round a wheel
      const tc = SLIDETC * (1 + JUMPTC * Math.min(1, Math.abs(d) * 0.5));
      U.s = (U.s + d * (1 - Math.exp(-dt / tc)) + NFIG) % NFIG;
    }
    const B = blendOf(U.s);
    const FA = figOf(B.i), FB = figOf(B.j);
    U.fig = B.f < 0.5 ? FA.n + '/' + FA.m : FB.n + '/' + FB.m;

    // 2a. THE DRIVE and THE GATE — the sub's level is how hard the sand dances and how bright the antinodes glow; eG
    // (file mode) restores the track's macro arc the AGC flattens. The gate stops the plate for drop 2's stomp.
    // where the bass LIVES decides which level drives the plate: a 35 Hz sub, or (the intro, 101-105.7 s) a mid-bass
    // an octave up. bassReg reads ~1 whenever there is no sub at all, so it is taken through a knee and HELD while
    // nothing sounds at all — otherwise the void would throw the camera overhead for a reason that is not music.
    const lvl = E.sub + (E.bass - E.sub) * clamp(E.reg, 0, 1);
    this.on = E.gate > 0.5 || lvl > BASSON;
    if (this.on) this.regRaw = clamp(E.reg, 0, 1);
    if (this.regRaw === undefined) this.regRaw = 0;
    // and it fades out with the VOID: "where the bass lives" is not a fact when there is no bass, so a silent passage
    // keeps the camera where the music last put it instead of being thrown overhead by a reading of nothing
    this.regE = ema(this.regE === undefined ? 0 : this.regE, sstep(REGLO, REGHI, this.regRaw), dt, REGTC);
    const reg = this.regE * (1 - U.lift);
    // the plate's gate: the sub's own gate where there IS a sub (so drop 2's 60 ms ducks read as a stomp), the
    // bass level where the bass has moved up an octave and subGate is 0 by definition
    U.gate = ema(U.gate, (reg > 0.5 ? (lvl > BASSON ? 1 : 0) : E.gate > 0.5 ? 1 : 0), dt, GATETC);
    U.drive = AMPK * lvl * (MS.mapOn > 0.5 ? 0.35 + 0.65 * E.eG : 1);
    const tgt = U.drive * U.gate;
    U.amp = ema(U.amp, tgt, dt, tgt > U.amp ? AMPTC_UP : AMPTC_DN);

    // 2b. PURITY — how sine-like the bass is mixes in the (2n, 2m) and (3n, 3m) figures: clean lines for a pure 808,
    // busy rough ones for a harmonic bass. `subPure` only means anything while a SUB is sounding — in the void it
    // reads 0.009 with no bass to be impure — so the register carries the other half of the sentence: a bass that has
    // moved up out of the sub is a harmonic bass by definition, and that is the intro and 101-105.7 s.
    U.h = ema(U.h, Math.max(clamp((1 - E.pure - HPAD) / (1 - HPAD), 0, 1) * (E.gate > 0.5 ? 1 : 0), reg), dt, SLIDETC * 3);

    // 3b. THE KICK — the sand LEAPS, higher on the antinodes. The height is analytic in kickAge (z = v·a − g·a²/2,
    // shaders.js), so the throw is placed to a fraction of a frame and is the same in every run at the same age;
    // nothing about it is integrated. Appendix A warns the age may go slightly negative on the release frame after
    // EARS pass 2 — clamp it. The kick touches no figure and no colour: one element, one channel.
    //
    // THE SIZE IS `kickAmp`, AND IT GOES IN AS AN ENERGY (§74). Two measured reasons, both of which the v0.25 look
    // hid because `kickVel` was pinned at 1.0 on 46-87 % of its hits (87 % on this scene's own SeeYouDrop):
    //   (a) `kickVel` is a CONT history field and the ears read one by interpolating the ring AT heard time, while an
    //       onset's audio time is ~16 ms BEFORE the hop that found it — so ON THE EVENT FRAME it still holds the
    //       PREVIOUS hit's velocity (§70). Armed there, it correlates 0.172 with the hit it is throwing for;
    //       `kickAmp`, which rides the released event, correlates 0.986 (CyborgNinja 20-50 s, 85 kicks).
    //   (b) the leap's peak height is (v·w)² / 2g, so a 0-1 field fed in as a LAUNCH VELOCITY is read SQUARED. The
    //       brief's channel is the HEIGHT, so the size is the throw's ENERGY and its square root the velocity: at a
    //       size of 1 this is exactly the validated v0.15 throw, so the loud hits keep the look they were tuned at
    //       and only the soft ones come down. The scatter (CH_KICKJ) is a velocity too and takes the same root.
    U.kickAge = Math.max(0, MS.kickAge);
    if (MS.kickEvt) U.kickSz = Math.sqrt(clamp(Math.max(KSFLOOR, MS.kickAmp), 0, 1.5));
    // THE DROP'S SLAM — the map knows the drop's exact bar line, so the sand is thrown on that frame and lands into
    // the root figure a beat later. It rides the kick's own ballistic channel: one throw, one mechanism. DROPV is a
    // launch VELOCITY, not a size, so it is unchanged by the energy reading above: the slam throws 5.8x plate height.
    if (MS.mapDropEvt || (MS.mapOn <= 0.5 && MS.dropEvt)) { U.kickAge = 0; U.kickSz = DROPV; }

    // 3c. SNARE and HAT — a second and third hit channel that never touch the figure or the sub's own channels.
    // The hat is a fine high-mode ripple travelling out across the surface (the user's "skinnier waves" at 50-57 s);
    // the snare is one bright ring crossing the plate. Both placed by their own age, both dying with it.
    U.ripA = Math.max(0, MS.hatAge);
    U.ripK = RIPK;
    U.ripD = RIPD * clamp(MS.hatVel, 0, 1.5);   // the hat keeps the RANK: there is no `hatAmp` (§70 — the hat is the
                                                // one class on the HPSS-lite flux, with no rise in dB to publish)
    const sa = Math.max(0, MS.snareAge);
    U.snR = SNSPD * sa;
    // the ring's brightness is `snareAmp` (§74), for the same two reasons as the kick's size, minus the square:
    // brightness is LINEAR in the field, so no root is wanted and SNAMP is unchanged — the loudest hits on
    // SeeYouDrop and CyborgNinja still reach the validated 0.55 (their per-track p95 is 0.94 / 1.00) and the quiet
    // masters' loudest read 0.35-0.41, which is §70's whole point: a soft track reads soft. `snareVel` was read on
    // the frame the event fires, where it is one hit stale exactly as `kickVel` is.
    U.snF = SNAMP * clamp(MS.snareAmp, 0, 1.5) * Math.exp(-sa / SNTC);

    // 4. THE VOID — no sub, so nothing settles: the sand lifts and floats, a soft mid light takes over, and the build
    // spirals what is left inward. `buildProg` in file mode, `dropConf` live (Appendix A's fallback).
    this.offT = U.gate > 0.5 ? 0 : (this.offT || 0) + dt;
    U.lift = ema(U.lift, sstep(LIFTWAIT, LIFTWAIT + 0.8, this.offT), dt, LIFTTC);
    // the anticipation, written as a sum of products rather than a ternary so BOTH fields are recorded when the
    // params slot evaluates from() on the MS defaults (CONTRACTS §1.16, the short-circuit trap)
    const antic = MS.buildProg * (MS.mapOn > 0.5 ? 1 : 0) + MS.dropConf * (MS.mapOn > 0.5 ? 0 : 1);
    U.spiral = ema(U.spiral, SPIRAL * antic * U.lift, dt, LIFTTC);

    // 5. THE PLATE'S BOUNDARY — square while the bass sits ON the key's root, round (the circular plate's Bessel
    // figure) while it WALKS away from it. "Away from the tonic" is the measurement that survives this track's noisy
    // per-frame pitch: the groove and the drops hold C#, the build's walk, the two climbs and the outro do not.
    // A section that comes back comes back to its shape through look memory (CONTRACTS §1.11, `look` below).
    U.away = ema(U.away, this.win >= 0 && this.win !== E.tonic ? 1 : 0, dt, AWAYTC);
    U.bnd = sstep(AWAY0, AWAY1, U.away);

    // 6. THE CAMERA — the register is the elevation: a 35 Hz sub is low and heavy and fills the frame, a mid-bass is
    // seen from overhead and small. The build tilts it up; the felt beat thumps it; the nudge turns the plate.
    U.pitch = ema(U.pitch, PITCH_SUB + (PITCH_MID - PITCH_SUB) * reg + P.tilt, dt, CAMTC);
    U.bounce = BOUNCE * Math.pow(Math.max(0, Math.cos(TAU * MS.beatPhase)), 4);
    const dTgt = (DIST_SUB + (DIST_MID - DIST_SUB) * reg) / (1 + U.bounce);
    U.dist = ema(U.dist, dTgt, dt, CAMTC * 0.25);
    // the nudge: one sixteenth of a turn per FELT beat. The turn is ACCUMULATED from the beat count's own steps
    // rather than read off `beatCount · pulse`, because the felt beat can change (half time to double time) and
    // multiplying a large beat count by a new pulse moves the target by radians in one frame — the continuity
    // monitor caught that as a 0.155 rad spike. Accumulating, a pulse change alters the RATE and never the angle,
    // and with a constant pulse it is still read off the beat count, so it cannot drift (TORUS2's rule).
    const bc = MS.beatCount | 0;
    if (this.bcPrev === undefined) this.bcPrev = bc;
    this.turnAcc = (this.turnAcc || 0) + ((bc - this.bcPrev) * Math.max(0.25, MS.pulse)) / 16;
    this.bcPrev = bc;
    U.yaw = this.nudge.turn(dt, (this.turnAcc - Math.floor(this.turnAcc)) * TAU, Math.max(MS.hush, MS.calm));
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
    U.glow = P.glow * (GLOWQ + (1 - GLOWQ) * clamp(0.3 + U.amp, 0, 1));
    U.fog = ema(U.fog, P.fog, dt, FOGTC);      // the knee is in params.fog's own from(); this is its ease (FOGTC)

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
    SU.kickAge = U.kickAge;
    SU.kickSz = U.kickSz;
    this.pLeap = P.leap;                 // draw() has no env.params, so the two the shaders need are held here
    this.pSand = P.sand;

    this.rt.time = MS.flow;
    this.rt.label = 'fig ' + U.fig + ' s ' + U.s.toFixed(2);
    const st = this.state;
    st.cPath[0] = U.yaw;
    st.cPath[1] = U.pitch;
    st.mode = U.bnd > 0.5 ? 'round' : 'square';
    st.kick.x = U.kickSz * Math.exp(-U.kickAge * 6);    // the monitor's declared cut: a kick is allowed to jump
  },

  draw(target, { w, h }) {
    const ctx = this.ctx, g = ctx.gl, pr = this.pr;
    if (!pr || !pr.p || !this.sand) return;
    const count = Math.round(ctx.budget('points') * this.pSand);   // the core's per-tier budget (CONTRACTS 1.4), scaled by params.sand
    this.sand.step(SU, count);                    // one state step, into the sand's own target
    ctx.use(pr, target, w, h);
    g.uniform3f(pr.u('uEye'), EYE[0], EYE[1], EYE[2]);
    g.uniformMatrix3fv(pr.u('uCamB'), false, BAS);
    g.uniform2f(pr.u('uLens'), FOCAL, ASP);
    g.uniform4f(pr.u('uFig'), U.s, U.h, U.bnd, LINEW);
    g.uniform4f(pr.u('uDyn'), U.amp, U.glow, U.ripD, U.snF);
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
    lookVP(this.vp, ASP, FOCAL);
    ctx.use(pr, target, w, h);
    ctx.tex(pr, 'uPos', 0, this.sand.tex());
    g.uniformMatrix4fv(pr.u('uVP'), false, this.vp);
    g.uniform2f(pr.u('uGrid'), this.sand.grid[0], this.sand.grid[1]);
    g.uniform2f(pr.u('uRes'), w, h);
    g.uniform4f(pr.u('uFig'), U.s, U.h, U.bnd, 0);
    g.uniform4f(pr.u('uLeap'), U.kickAge, U.kickSz, GRAV, this.pLeap);
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

  // The six visual parameters (CONTRACTS §1.16), named for what the eye sees. Each from() is the expression that was
  // inline in update()/draw(), moved WHOLE, reading only fields in `feats`; four of them were manual constants, which
  // is what this slot exists to expose. `figure` is added to the figure's TARGET (x + 0 is exact, so the default is a
  // byte-identical no-op; a wrap of the eased value would not have been).
  params: {
    figure: { eli5: 'how far along the table of figures the plate is shifted, in semitones', range: [-6, 6], from: () => 0 },
    sand: { eli5: 'how much sand is on the plate', range: [0, 1], from: () => 1 },
    leap: { eli5: 'how high a kick throws the sand', range: [0, 14], from: () => LEAPK },
    tilt: { eli5: 'how far the coming drop has tilted the camera up off the plate', range: [0, TILTB], from: (MS) => TILTB * (MS.buildProg * (MS.mapOn > 0.5 ? 1 : 0) + MS.dropConf * (MS.mapOn > 0.5 ? 0 : 1)) },
    glow: { eli5: 'how brightly the nodal lines glow when the plate is driven hard', range: [0, 1.6], from: () => GLOW0 },
    fog: { eli5: 'how much fog the closing low-pass has put over the plate', range: [0, 1], from: (MS) => sstep(FOGLO, FOGHI, MS.lpSweep) },
  },

  // look memory (CONTRACTS §1.11): a section that returns gets its plate shape back, so the outro's walk comes back
  // round instead of re-deciding from scratch
  look: {
    get() { return [U.away]; },
    set(v) { U.away = v[0]; },
  },

  post: { fb: { decay: 0.62 }, bloom: { thr: 0.34 }, kaleido: 0, morph: { flow: 0.4 } },
  colour: { default: 'v2', variants: { v2: {} } },
  help: HELP,
};
export default SELF;
