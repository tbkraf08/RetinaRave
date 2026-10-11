// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// Solver after Pavel Dobryakov, WebGL-Fluid-Simulation (MIT, 2017) — https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
// The BAND grammar (FLUID2-PLAN §2, DECISIONS §116): the second MS → force grammar of the one pool, chosen by the scene that owns
// the pool (a card's `fluid: { grammar: 'bands' }` — FLUID2, id 13; core/fluid/grammar.js is the table, fluid.js dispatches, loop.js
// names the owner). PURE, the same module interface as inject.js (`plan, mkState, K, FLUID_FEATS`), so tools/fluid-tracks.js and
// tools/fluid-replay.js replay it through `INJECT=assets/core/fluid/inject2.js` unchanged.
//
// HOW IT COMPOSES. plan(S, dt, st) runs inject.js's plan() FIRST, on `st.base` — the SAME state object fluid.js hands the pool
// grammar (fluid.js: `st2.base = st`), so the §111 machinery (the key pin and its evidence, the lanes' rank buffers, the hat bucket,
// the ink rate, the confirmed clear and its refractory, the §113 shockwave's countdown, the midRing, the void's latch) keeps running
// across a scene switch in BOTH directions: the frame a roster scene takes the pool back, the pool grammar's state is warm. Then
// it edits the result BY KIND (`k` on every splat): it removes the kinds it replaces, appends its own, rewrites `params`, adds
// its own return fields — S1 the sub as a field (below), S2 the kick's travelling mass (`'dip'`, `'stroke'`, `'jet'`), S3 the mids
// as material (curl from `mid`), S4 the highs as the surface (noise, the dip, the light), S5 the pen, S6 time. Whatever FLUID-DROP
// item 2 adds to plan() / fluid.js (the freeze, the ring of frames) reaches both grammars through this call — the precedence written
// now: a `dtSim` of 0 from the base wins over any grammar-2 `dtSim` (fluid.js multiplies).
// Grammar 2's OWN state (the fields beside `base`) starts cold on the first FLUID2 frame — every one of them is a transient
// or eases from its neutral value, so the switch is never a cut (S1: the envelopes start AT the frame's sub, the ink rate at the
// base's warm rate — no burst on the switch).
//
// S1 — THE SUB IS A FIELD, NEVER A DOT (FLUID2-PLAN §4 S1; the user: "the whole pool heaves with the sub's envelope, gravity flips;
// its presence deserves the same scale as its absence (the void): global"). The §104 emitter's jet (`k: 'sub'`, +SUB_V per frame at
// the bass note's place) is a point source; here its VELOCITY is gone and the sub enters the solver as two body forces on the velocity
// advect pass, the whole pool at once:
//   the HEAVE  — on the breath's shaped channel (`body`, the cos(π(2x−1)) profile: centre vs edges — a uniform vertical force in a
//                closed pool is a pressure gradient the projection removes, §104's lesson): −HEAVE · (subEnv − subSlow) · g, the sub's
//                envelope (`sub` eased SUB_TAU, a tenth of a beat) against its own slow mean (SUB_SLOW), WITH the breath (centre down:
//                the sub is the pool's weight) — the attack deepens the beat's gravity, the tail eases it, the void's entry (the slow
//                mean above a sub that left) lifts against the breath and STILLS the pool, the drop's return slams it; plus
//                −HEAVE_DC · subEnv — the level as a steady extra gravity while the bass plays (the exploration's fifth switch);
//   the SWIRL  — a solid-body rotation, `uSwirl` on the advect pass (fluid.js; 0 is the byte-identical program path, as the ring's
//                A = 0 is): the angular acceleration SWIRL · subEnv · g, its direction by the bar parity so it never winds up — the
//                whole pool turns with the sub;
//   the FLIP   — gravity flips: the heave's direction by the bar parity (FLIP 1: the attack sinks on one bar, lifts on the next) or by
//                the glide's sign (FLIP 2: a rising bass lifts, a falling one sinks, a held note heaves nothing; GLIDE_K st/s saturates it);
//   the INK    — the emitter's DYE stays (SUB_INK × it, dx = dy = 0: the ink still enters at the bass note's place on the tonic
//                axis, so a sub-only passage is not colourless; the field carries it), spread over SUB_RAD × the radius at 1 / SUB_RAD²
//                the dye (the same ink in the budget's units: a cloud where the jet's dot was); 0 drops the splat. The ink budget (§111)
//                is re-derived over THIS list when the ink differs (the own rate `st.inkRate`, started at the base's warm value).
// What the void does (§111 item 4: the latch, VOID_FLOOR) is the base's and untouched; `st.base.xSub` is still computed by plan()
// (the kick lifts from under it). The defaults below are the strips' pick (DECISIONS §116 S1, the per-track table); the other
// variants stay as K2 switches (`K2=` on the strip tools, `CARD.fluid.K2` live).
//
// S2 — THE KICK IS A MASS THAT TRAVELS (FLUID2-PLAN §4 S2; the user's taste, §113: "a hit launches something that travels"). The base's
// kick is one Gaussian impulse up from the floor under the sub (`k: 'kick'`, dy = KICK_V·√rank·g on the hit's frame, 40 % on the tail
// frame) — after the projection that IS a vortex pair that self-propels; what decides how far it travels is the impulse's SHAPE in time
// and space. KICK_SHAPE picks the shape, every one at the SAME MOMENTUM as the base's (Σ dy · rad over the hit's frames — a splat's
// Gaussian exp(−|p|²/rad) integrates to π·rad, so dy·rad is its impulse — and the same ink in the budget's units):
//   0 the control  — the base's splat as it is;
//   1 the jet      — each of the base's kick frames spread over JET_N frames at 1 / JET_N of its push and its ink (a longer push rolls up a
//                    tighter pair; the base's tail frame joins the queue, so the momentum is the base's exactly, JET_N frames later);
//   2 the stroke   — the jet drawn UPWARD: the splat's y rises with the push's age, y = KICK_Y + STROKE_L · min(1, age / STROKE_T) — a line
//                    source over STROKE_T (a tenth of a beat), the user's "line stroke";
//   3 the dipole   — two splats at (x ∓ DIP_D, KICK_Y), the lift shared (dy / 2 each, the ink halved, the radius the base's) and a sideways
//                    seed ±DIP_V·√rank·g, OPPOSITE on the two (DIP_V > 0: inward, the pair's own flow between its cores; < 0: outward) —
//                    the roll-up seeded, the net sideways momentum 0, Σ dy·rad the control's;
//   4 the puff     — the kick splat's VELOCITY gone (its ink stays), a radial ring round the kick's place instead: `uRing` with a CENTRE
//                    (`uRingC`, fluid.js's ring(a, r, w, cx, cy); (.5, .5) is the shockwave's identical path), A = KPUFF_A·√rank·g, the
//                    front 0 → KPUFF_R screen heights in KPUFF_T beats, KPUFF_W wide; the §113 SET semantics — where the base's shockwave
//                    runs on the same step the larger amplitude wins (the drop's return). No momentum in the splats' units (a set, not an add).
// The ruler is TRAVEL (tools/fluid-kick-strip.sh + fluid-kick-travel.py, HARNESS "## Fluid"): the up-mass the hit adds to the pool above its
// place and where that mass is at +½ and +1 beat, read on the velocity. THE FINDING (DECISIONS §116 S2): FLUID's kick never carried itself —
// it rode the sub emitter's JET, a standing updraft at the bass note's place (U 22 in the band; the plain kick alone adds 1 and is a pinhead,
// with or without S1's field: the heave costs 15 %, the jet's removal the rest). So the shipped kick is the DIPOLE, seeded inward: the pair's
// own flow between its cores carries it a third of the screen per beat on its own, at the base's impulse and ink. `kick` in the return =
// this frame's kick kinds for the replay rulers: { shape, mom: Σ dy·rad, ink, n }.
//
// S3 — THE MIDS ARE MATERIAL (FLUID2-PLAN §4 S3; the frame: the mids are the WEATHER, not the mass — the user: "the double time should be
// accenting rather than driving"). The base's vorticity confinement reads `tension` (curl = 10 + 40·tension: a build's riser tightens the
// curls). Here the confinement's constant is the MID band's place in the track's own last FLOOR_WIN s — §111 item 7's ring, `st.base.midRing`,
// READ, not duplicated: the p20 / p80 of its one-second means, sstep between them (the level itself before the ring holds 5 s) — eased
// MID_TAU: dense mids tighten the curls (CURL0 + CURL_MID), thin mids go laminar (CURL0); CURL_SRC 0 is the base's constant to the bit.
// The MASK (CURL_MASK 1): `uCurlMask` on the vort pass — the confinement at its full value in the band CURL_Y0..CURL_Y1 (the mids' ink
// enters at mid height, §108), CURL_LO of it outside, feathered CURL_FE; (0, 1, 1, 0) is the identical program path (a uniform branch, never
// a mix — the ring's and the swirl's rule). The SNARE (SNARE_JET 1): the base's two shears at (.3, .5) / (.7, .5) — equal, opposite, inward —
// become ONE jet from a wall (x SNARE_X in from the left or the right wall — a hair in, never AT it: the projection cancels a push at a
// closed wall — alternating by the snare count, y SNARE_Y) at the pair's
// momentum (Σ|dx|·rad) and ink, spread over SNARE_N frames (S2's jet shape: a pending queue at 1 / SNARE_N per frame) — a shear burst
// that crosses the pool, `k: 'sjet'`; the harmonic branch's one directed splat (`k: 'snare'`, kept) and the chord shears (`k: 'chord'`)
// are untouched. `mids` { pos, curl, mask } and `snare` { kind, mom: Σ|dx|·rad, ink, n, side } in the return for the rulers.
import { plan as planBase, mkState as mkStateBase, FLUID_FEATS as FEATS_BASE, K as KB } from './inject.js';
import { clamp, ema, sstep } from '../../math/util.js';

export const FLUID_FEATS = [...FEATS_BASE, 'sub'];   // S1: the sub band's level (25–60 Hz, fast) — the envelope's source; ∪ this grammar's own reads, appended, never removed

// The band grammar's constants (K2), one table. The base's K (inject.js) is inherited through planBase().
export const K = {
  HEAVE: 0.6,      // S1 the heave: uv/s² per unit of the envelope's rise above its slow mean, WITH the breath (centre down; BODY .35 is the ruler it reads beside: the
                   //   attack's pulse ±.15–.35 next to the breath's .35 peak — 1.0 + DC .3 read the sub best, r(Δ, sub) .93, but ran every groove 50–60 % faster)
  HEAVE_DC: 0.15,  //   the level as a steady extra gravity, uv/s² per unit subEnv (× .7 on a groove = .1 beside the breath's .13 mean; 0 = the rise alone — the
                   //   rise alone stills the void but lets a steady groove settle back to the pool grammar's speed, DECISIONS §116 S1)
  SUB_TAU: 0.04,   //   s: subEnv = `sub` eased this fast (a tenth of a beat at 150 bpm — the inertia the eye expects, §1.18)
  SUB_SLOW: 2,     //   s: subSlow = subEnv's slow mean; the heave is the rise above it, and SUB_SLOW · subSlow the circulation it leaves
  FLIP: 0,         //   gravity flips: 0 none (a rise deepens the gravity) · 1 by the bar parity (beatCount >> 2 & 1) · 2 by the glide's sign (rising lifts)
  GLIDE_K: 3,      //   st/s at which FLIP 2's sign saturates (clamp(subGlide / GLIDE_K, −1, 1): a held note is no flip)
  SWIRL: 0,        //   the swirl: angular acceleration (1/s², at |p| = 1 in screen heights) × subEnv × g, the direction by the bar parity; 0 = the identical advect path
  SUB_GATE: 0,     //   1: the field only while the base is in its DRUM branch (the sub seen within HARM_BARS bars — §111 item 8); 0: the band alone. The 25–60 Hz
                   //   band reads .4 on Comptine's piano with the gate never open, so the pool sways with its low notes at 0 (+.08 uv/s, r(Δ, sub) .51 — the strips)
  SUB_INK: 1,      //   the emitter's dye kept × this (dx = dy = 0 always: never a jet); 0 drops the 'sub' splat and re-governs the ink
  SUB_RAD: 3,      //   the emitter's radius × this, its dye ÷ this² (the same ink in the budget's area-weighted units): the mouth's ink as a CLOUD, not a dot (1 reads as
                   //   a bright spot at the bass note's place on a drop's return — the strips, §116 S1; the grey moves 1–2 levels either way)
  KICK_SHAPE: 3,   // S2 the kick's shape, at ONE momentum: 0 the control (the base's impulse) · 1 the jet (JET_N frames) · 2 the stroke (the jet drawn upward) ·
                   //   3 the dipole (two seeded splats — SHIPPED: the pair carries itself, DECISIONS §116 S2) · 4 the puff (a radial ring at the kick's place, the splat's velocity gone)
  KICK_Y: 0.06,    //   the kick's place above the floor (the base's .06; the stroke and the dipole are drawn from it)
  JET_N: 4,        //   the jet / the stroke: each of the base's kick frames spread over this many frames at 1 / JET_N of its push and ink (the momentum the base's exactly)
  STROKE_L: 0.25,  //   the stroke's length in screen heights …
  STROKE_T: 0.05,  //   … drawn over this many seconds of the push's age (a tenth of a beat at 120 bpm; the jet's frames walk up it)
  DIP_D: 0.03,     //   the dipole's half-spacing (uv): the two splats at x ∓ DIP_D
  DIP_V: 1.2,      //   the dipole's sideways seed, uv/s × √rank · g, opposite on the two splats: > 0 inward (the pair's own flow between its cores), < 0 outward. The
                   //   RaindropsOnRoses strips (§116 S2): .8 / 1.2 / 1.6 add ΔU½ 2.7 / 3.1 / 3.9 of up-mass beside FLUID's own 3.6 (its kick rode the sub's jet) and
                   //   carry 2.0 / 2.8 / 3.3 to +1 beat (FLUID 1.3); the travel ties at .32 heights per beat — 1.2 sits beside FLUID's number; 1.6 and DIP_D .05 are the switches
  KPUFF_A: 0.4,    //   the puff: A (uv/s) × √rank · g — set at the front (§113's semantics, a ring with a centre)
  KPUFF_R: 0.12,   //   the front's reach, screen heights from the kick's place …
  KPUFF_T: 0.25,   //   … reached in this many beats (then the puff is gone; a new kick restarts it)
  KPUFF_W: 0.03,   //   the front's width (screen heights)
  CURL_SRC: 1,     // S3 the vorticity confinement's source: 0 the base's 10 + 40·tension (the control, to the bit) · 1 the MID band's own-range place:
                   //   curl = CURL0 + CURL_MID · midEnv — dense mids tighten the curls, thin mids go laminar (the mids are the material)
  CURL0: 10,       //   the laminar floor (the bottom of the mids' own range) …
  CURL_MID: 40,    //   … + this at the top of it (the base's own span: 10 + 40·tension)
  MID_TAU: 0.25,   //   s: midEnv = the own-range place (sstep(p20, p80) of st.base.midRing's one-second means) eased this fast — the constant never steps per frame
  CURL_MASK: 0,    //   1: the confinement at its full value in the band CURL_Y0..CURL_Y1, CURL_LO of it outside (feathered CURL_FE) — `uCurlMask` on the vort
                   //   pass; 0 = the identical program path
  CURL_Y0: 0.3,    //   the band's floor (screen heights) …
  CURL_Y1: 0.7,    //   … and its ceiling
  CURL_LO: 0.25,   //   the confinement outside the band, × the full value
  CURL_FE: 0.1,    //   the band's feather (screen heights) on each edge
  SNARE_JET: 1,    // S3 the snare: 0 the base's pair (two inward shears at (.3, .5) / (.7, .5)) · 1 ONE jet from a wall at the pair's momentum and ink,
                   //   alternating walls by the snare count (the harmonic branch's one directed splat is kept either way)
  SNARE_X: 0.12,   //   the jet's place in from its wall (uv) — NOT at the wall: a push AT a closed wall is projected away (the RaindropsOnRoses strips, §116 S3:
                   //   at .02 the burst's front is 0 by +1 beat, at .12 it carries itself .14 — twice the pair's — and at .2 it runs .18 but starts a fifth of the way in) …
  SNARE_Y: 0.5,    //   … at this height (the pair's)
  SNARE_N: 4,      //   the jet spread over this many frames at 1 / SNARE_N of its push and ink (1 = one stamp)
};

// { base: inject.js's state (SHARED with the pool grammar — fluid.js sets it; null = make one on the first plan), …this grammar's own:
//   n the frames planned (0 = cold: the envelopes start at the frame's sub, the ink rate at the base's), subEnv / subSlow the envelopes,
//   inkRate this grammar's own §111 ink rate (ema INK_TAU) over ITS final list }
//   S2: `jet` the pending pushes of the jet / the stroke ([{ x, y, dx, dy, r, g, b, rad, left, age }] — the base's kick frames spread over
//   JET_N frames; a transient: empty on the cold frame), `puffT` the puff's age in s (−1 = none), `puffA` its amplitude, `puffX` its centre
//   S3: `midEnv` the mids' own-range place eased MID_TAU, `snareN` the snare count (the jet's wall alternates on it), `sjet` the pending
//   snare-jet frames ([{ x, dx, r, g, b, rad, left, side }] — a transient: empty on the cold frame)
export const mkState = () => ({ base: null, n: 0, subEnv: 0, subSlow: 0, inkRate: 0, jet: [], puffT: -1, puffA: 0, puffX: 0.5, midEnv: 0, snareN: 0, sjet: [] });

// plan(S, dt, st) → the same shape as inject.js's plan() (its fields, the 'sub' splat without its velocity) + `heave` (uv/s², what
// was added to `body`), `swirl` (the uniform's value, 1/s²), `subEnv` (the envelope), `kick` (S2: { shape, mom, ink, n } — this frame's
// kick kinds), `mids` (S3: { pos, curl, mask }) and `snare` (S3: { kind 'pair' | 'jet' | 'harm' | '', mom, ink, n, side }) — the replay rulers
// read them. A ring may carry a centre (`cx, cy`; S2's puff) — fluid.js passes it to `uRingC`; `params.curlMask` ({ y0, y1, lo, fe }, S3's
// mask; absent = the identical vort pass) goes to `uCurlMask`.
export function plan(S, dt, st) {
  if (!st.base) st.base = mkStateBase();
  const R = planBase(S, dt, st.base);
  const g = R.gain, cold = st.n === 0;
  // the envelopes (cold: at the frame's value — the switch into this grammar mid-track is not a heave)
  const sub = clamp(S.sub || 0, 0, 1);
  st.subEnv = cold ? sub : ema(st.subEnv, sub, dt, K.SUB_TAU);
  st.subSlow = cold ? st.subEnv : ema(st.subSlow, st.subEnv, dt, K.SUB_SLOW);
  // the emitter's dot: its velocity is gone; its ink stays × SUB_INK (0 = the splat is gone)
  const i = R.splats.findIndex((s) => s.k === 'sub');
  let inkChanged = false;
  if (i >= 0) {
    if (K.SUB_INK > 0) {
      const s = R.splats[i]; s.dx = 0; s.dy = 0;
      if (K.SUB_INK !== 1 || K.SUB_RAD !== 1) { const f = K.SUB_INK / (K.SUB_RAD * K.SUB_RAD); s.r *= f; s.g *= f; s.b *= f; s.rad *= K.SUB_RAD; inkChanged = true; }
    } else { R.splats.splice(i, 1); inkChanged = true; }
  }
  // S2 the kick's shape (KICK_SHAPE; 0 = the base's splat untouched — the identical list). Every shape carries the base's momentum
  // (Σ dy·rad over the hit's frames) and its ink; the puff carries the ink alone and a ring. `kick` in the return reads the frame's kick
  // kinds for the rulers. The pending jet frames are a transient (cold: empty); a scene switch drops them (fluid.js resets `n`, mkState's
  // `jet` is the band state's own — it empties with the first cold frame below).
  const shape = K.KICK_SHAPE >= 1 && K.KICK_SHAPE <= 4 ? K.KICK_SHAPE | 0 : 0;   // a shape outside the table is the control
  const beat = 60 / Math.max(60, S.bpm);
  const kick = { shape, mom: 0, ink: 0, n: 0 };
  if (cold) { st.jet.length = 0; st.puffT = -1; }
  if (shape) {
    const ki = R.splats.findIndex((s) => s.k === 'kick');
    const kb = ki >= 0 ? R.splats[ki] : null;
    if (kb) R.splats.splice(ki, 1);
    if (shape === 1 || shape === 2) {
      // the jet / the stroke: the base's frame joins the queue at 1 / JET_N per frame; every pending push emits one frame, the stroke's y by its age
      const n = Math.max(1, K.JET_N | 0);
      if (kb) st.jet.push({ x: kb.x, dx: kb.dx / n, dy: kb.dy / n, r: kb.r / n, g: kb.g / n, b: kb.b / n, rad: kb.rad, left: n, age: 0 });
      const kind = shape === 2 ? 'stroke' : 'jet';
      for (const j of st.jet) {
        const y = shape === 2 ? K.KICK_Y + K.STROKE_L * Math.min(1, j.age / Math.max(1e-6, K.STROKE_T)) : K.KICK_Y;
        R.splats.push({ x: j.x, y, dx: j.dx, dy: j.dy, r: j.r, g: j.g, b: j.b, rad: j.rad, k: kind });
        j.left--; j.age += dt;
      }
      for (let i = st.jet.length - 1; i >= 0; i--) if (st.jet[i].left <= 0) st.jet.splice(i, 1);
      inkChanged = true;   // the same ink, JET_N frames later: the per-frame list differs, the own rate decides the governor
    } else if (shape === 3 && kb) {
      // the dipole: the lift shared, the ink halved, the sideways seed opposite on the two (inward for DIP_V > 0)
      const side = K.DIP_V * Math.sqrt(st.base.kickSz) * g * (S.kickEvt ? 1 : 0.4);
      R.splats.push({ x: kb.x - K.DIP_D, y: K.KICK_Y, dx: side, dy: kb.dy / 2, r: kb.r / 2, g: kb.g / 2, b: kb.b / 2, rad: kb.rad, k: 'dip' });
      R.splats.push({ x: kb.x + K.DIP_D, y: K.KICK_Y, dx: -side, dy: kb.dy / 2, r: kb.r / 2, g: kb.g / 2, b: kb.b / 2, rad: kb.rad, k: 'dip' });
    } else if (shape === 4) {
      // the puff: the splat's ink stays with no velocity; the ring from the kick's place, restarted by every hit
      if (kb) R.splats.push({ x: kb.x, y: kb.y, dx: 0, dy: 0, r: kb.r, g: kb.g, b: kb.b, rad: kb.rad, k: 'puff' });
      if (S.kickEvt && kb) { st.puffT = 0; st.puffA = K.KPUFF_A * Math.sqrt(st.base.kickSz) * g; st.puffX = kb.x; }
      const T = K.KPUFF_T * beat;
      if (st.puffT >= 0 && st.puffT < T && st.puffA > 0) {
        const ring = { a: st.puffA, r: K.KPUFF_R * st.puffT / T, w: K.KPUFF_W, cx: st.puffX, cy: K.KICK_Y };
        if (!R.ring || ring.a > R.ring.a) R.ring = ring;   // the base's shockwave (centred, the larger A) wins the step when both run
        st.puffT += dt;
      } else st.puffT = -1;
    }
  }
  for (const s of R.splats) if (s.k === 'kick' || s.k === 'jet' || s.k === 'stroke' || s.k === 'dip' || s.k === 'puff') { kick.n++; kick.mom += s.dy * s.rad; kick.ink += (s.r + s.g + s.b) * (s.rad / KB.RADIUS) ** 2; }
  // S3 the snare as a jet (SNARE_JET; 0 = the base's pair untouched — the identical list). The base's two shears (the drum branch only: in
  // the harmonic branch the base already draws one directed splat, kept) carry Σ|dx|·rad = 2·SNARE_V·sz·g·rad and 2·SNARE_DYE·g of ink; the
  // jet carries the same from one wall over SNARE_N frames — the pending frames are a transient (cold: empty), the wall alternates by count.
  const snare = { kind: '', mom: 0, ink: 0, n: 0, side: 0 };
  if (cold) { st.sjet.length = 0; st.snareN = 0; }
  if (K.SNARE_JET) {
    const pair = R.splats.filter((s) => s.k === 'snare');
    if (pair.length === 2 && !R.harmonic) {
      for (let i = R.splats.length - 1; i >= 0; i--) if (R.splats[i].k === 'snare') R.splats.splice(i, 1);
      const n = Math.max(1, K.SNARE_N | 0), side = st.snareN & 1 ? -1 : 1, a = pair[0], b = pair[1];
      st.snareN++;
      st.sjet.push({ x: side > 0 ? K.SNARE_X : 1 - K.SNARE_X, dx: side * (Math.abs(a.dx) + Math.abs(b.dx)) / n, r: (a.r + b.r) / n, g: (a.g + b.g) / n, b: (a.b + b.b) / n, rad: a.rad, left: n, side });
    }
    for (const j of st.sjet) { R.splats.push({ x: j.x, y: K.SNARE_Y, dx: j.dx, dy: 0, r: j.r, g: j.g, b: j.b, rad: j.rad, k: 'sjet' }); j.left--; snare.side = j.side; }
    for (let i = st.sjet.length - 1; i >= 0; i--) if (st.sjet[i].left <= 0) st.sjet.splice(i, 1);
    inkChanged = true;   // the same ink, SNARE_N frames later: the per-frame list differs, the own rate decides the governor (a no-op while it equals the base's)
  }
  for (const s of R.splats) if (s.k === 'snare' || s.k === 'sjet') { snare.n++; snare.mom += Math.abs(s.dx) * s.rad; snare.ink += (s.r + s.g + s.b) * (s.rad / KB.RADIUS) ** 2; if (!snare.kind) snare.kind = s.k === 'sjet' ? 'jet' : R.harmonic ? 'harm' : 'pair'; }
  // S3 the mids as material: the confinement's constant from the mid band's place in its own range (§111 item 7's ring on the base's state —
  // read, never duplicated), eased MID_TAU; CURL_SRC 0 leaves the base's constant. The mask is a parameter fluid.js hands the vort pass.
  const ring = st.base.midRing;
  let pos = clamp(S.mid || 0, 0, 1);
  if (ring.length >= 5) { const r = ring.slice().sort((x, y) => x - y), lo = r[Math.floor(0.2 * r.length)], hi = Math.max(r[Math.floor(0.8 * r.length)], lo + 0.05); pos = sstep(lo, hi, S.mid || 0); }
  st.midEnv = cold ? pos : ema(st.midEnv, pos, dt, K.MID_TAU);
  const mids = { pos: st.midEnv, curl: R.params.curl, mask: null };
  if (K.CURL_SRC) { R.params.curl = K.CURL0 + K.CURL_MID * st.midEnv; mids.curl = R.params.curl; }
  if (K.CURL_MASK) { R.params.curlMask = { y0: K.CURL_Y0, y1: K.CURL_Y1, lo: K.CURL_LO, fe: K.CURL_FE }; mids.mask = R.params.curlMask; }
  // the ink budget over THIS list (§111; the drop's impulse not counted, as the base counts): the own rate starts at the base's warm
  // value and runs the same ema, so with the ink unchanged it IS the base's rate and the base's dyeDiss stands untouched
  let ink = 0;
  for (const s of R.splats) if (s.k !== 'drop') ink += (s.r + s.g + s.b) * (s.rad / KB.RADIUS) ** 2;
  st.inkRate = cold ? R.ink : ema(st.inkRate, ink / dt, dt, KB.INK_TAU);
  if (inkChanged && st.inkRate !== R.ink && !(st.base.clearLeft > 0)) R.params.dyeDiss = R.params.dyeDiss / Math.max(1, R.ink / KB.INK_BUDGET) * Math.max(1, st.inkRate / KB.INK_BUDGET);
  R.ink = st.inkRate;
  // the field: the heave on the breath's channel, the swirl as its own uniform; the bar parity turns the swirl so nothing winds up.
  // The heave's direction (dir +1) is WITH the breath — the sub is the pool's WEIGHT: the attack deepens the gravity the beat already
  // applies (centre down), the void's entry (the slow mean above a sub that left) LIFTS against it and stills the pool, the drop's return
  // slams. The strips settled it (DECISIONS §116 S1): the opposite sign cancelled the breath on every groove, sped every void up and
  // weakened every return. FLIP 1 alternates it by the bar; FLIP 2 reads the glide — a rising bass LIFTS, a falling one sinks, a held note
  // heaves nothing.
  const bar = (S.beatCount >> 2) & 1 ? -1 : 1;
  const dir = K.FLIP === 1 ? bar : K.FLIP === 2 ? -clamp((S.subGlide || 0) / K.GLIDE_K, -1, 1) : 1;
  const gate = K.SUB_GATE ? 1 - R.harmonic : 1;   // SUB_GATE 1: nothing while the base is in its harmonic branch (a piano, a pad — the sub unseen for HARM_BARS bars)
  const heave = -(K.HEAVE * (st.subEnv - st.subSlow) + K.HEAVE_DC * st.subEnv) * g * dir * gate;
  if (heave) R.body += heave;   // 0 adds nothing: the body stays the base's to the bit (the sub silent = the pool grammar's breath)
  const swirl = K.SWIRL * st.subEnv * g * bar * gate;
  st.n++;
  R.heave = heave; R.swirl = swirl; R.subEnv = st.subEnv; R.kick = kick; R.mids = mids; R.snare = snare;
  return R;
}
