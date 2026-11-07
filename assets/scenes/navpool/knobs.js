// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// NAV3's numbers — every knob the roll, the gate, the swell, the interior, the kick and the dance read (nav.js), with its reason, and
// knob5() that sets them from the #test hooks (index.js: &n3roll / &n3gate / &n3kick3 / &n3dance / &n3int / &n3swell / &n3conv). Pure
// data: split out of nav.js in §147 (the file stood at 479 lines against the 500 hard cap); nav.js re-exports them, so
// `import { ROLL, GATE } from './nav.js'` (tools/test_nav3.js) and `SWELL` (index.js) read as before. The implosion's OUT3 lives in implode.js.
import { sstep } from '../../math/util.js';
export const ROLL = {
  RHO_LO: 0.45,    // the ρ target when the track is at its quietest (the §140 retune: was .25, then .55 — the pulse needs room below the rim to swing — the user: "the set doesn't seem to be dancing"; the ball lives near the rim, where ρ → 1 pinches the Julia set)
  RHO_HI: 0.9,     // ... at its loudest (the depth pass: was .955 — with the pulse on top the ball sat pinned at the wall 35–39 % of its frames on IBelongHere / SeeYouDrop / Vienna, every step projected to zero: the loud ceiling leaves the pulse .06 of headroom under PULSE_TOP now)
  RHO_WALL: 0.985, // the wall: a step past it is projected along the rim (field.js converges inside 1000 steps to .985; was .97)
  RHO_MIN: 0.02,   // below this |λ| the log coordinate is singular (the centre); the floor the division uses
  TH0: 0.5,        // the internal angle (turns) at pitch 0: the point opposite the root (on the cardioid, c = −.75)
  TH_SPAN: -0.17,  // turns per unit pitch height: up = toward 1/3, the cardioid's highest point (Im c .65)
  HARM: 0.05,      // turns of θ per π of harmAngle: the harmony's place on the fifths circle leans the rim position
  KEY: 0.08,       // turns of θ across the key's circle of fifths, weighted by keyConf: one key, one sector of the rim
  CENT_LO: 0.25,   // the centroid range read as pitch height when nobody sings (centroid is 0..1, log2-weighted)
  CENT_HI: 0.65,
  W_RHO: 9,        // 1/s: the ρ target's spring (the retune: was 3.5 — a beat, not a bar)
  W_TH: 5,         // 1/s: the θ target's spring (was 1.4)
  GAIN: 12,        // per s: the fraction of the log λ error closed; ×(G0 + (1 − G0)·intensity) — the bar's energy is the step (was 4)
  G0: 0.35,
  VMAX: 3.5,       // per s: the ball's top speed in |Δlog λ| (was 1.2; 4 put the per-frame c step at .059 on the node drive, over the monitor's .06 with no margin)
  BREATH: 0.5,     // the beat breath's press toward the rim: ρ += BREATH·M2.breath·(PULSE_TOP − ρ)
  PULSE_TOP: 0.965, // the depth pass: the ceiling the breath and the dance's pulse press toward (was the wall itself: pinned there the step is projected to zero and the picture stands still)
  CONV_RIM: 0.6,   // §140 quality → the depth pass: the shader's convergence radius ×(1 + CONV_RIM·sstep(CONV_R0, 1, ρ)) — at 2 past .85 with a .12 cap the orbit stopped so early that the interior rendered as a flat disc (the user: "lots of little circles"); the Koenigs bands need the orbit to spiral in
  CONV_R0: 0.93,
  CONV_MAX: 0.05,  // the radius's cap on the cardioid (z units; was .12)
  CONV_CHILD: 0.15, // §142 the circles: in a child the cap is CONV_CHILD × the cycle's spacing (was .4: a period-4 child showed four flat dark discs)
  IDLE: 0.15,      // presence below this: the ball rolls to the circle and the clock stops (NAV froze it where it was)
  IDLE_W: 0.15,    // NAVPOOL silence (§149): the idle ramp's width above IDLE — presence ≥ IDLE + IDLE_W (.3) is full music (the library's traces never dip under .3 after their lead-in), ≤ IDLE is idle
  IDLE_RHO: 0.08,  // §142 silence: the ρ target while idle — RHO_MIN·4, c ≈ λ/2 ≈ 0, the Julia set a circle (Q → 1 by green.js)
  T_FLOOR: 0,      // §142: the visual clock's rate at presence 0 (was .15: the exterior bands and spokes drifted through silence)
  DOTS_RHO: 0.85,  // §142 the circles: the critical-orbit sprites draw only with a chart on and ρ under this (they piled into bright blobs at the rim and in a crossing)
};
// NAVPOOL silence (§149): 1 under music (exactly: sstep's t = 1 → 1), 0 in silence, a smooth ramp between; non-finite → 1 (load-bearing: a NaN would poison the dance; §151: it no longer gates the pool — the confinement is gone)
export const idleGate = (p) => (Number.isFinite(p) ? sstep(ROLL.IDLE, ROLL.IDLE + ROLL.IDLE_W, p) : 1);
export const GATE = {
  QMAX: 7,         // the deepest child the rim names (nearestRational's q cap)
  TOL: 0.5,        // |θ − p/q| < TOL / q² names the child (a p/q bulb's footprint on the rim shrinks like 1/q²)
  RHO: 0.9,        // pressed against the rim: ρ at or above this may cross
  NEAR: 0.15,      // while the music asks and ρ is within NEAR of GATE.RHO, θ's target snaps to the nearest p/q: the rim slides TOWARD the gateway
  BUILD: 0.7,      // buildLive at or above this asks to go in (§142: was .45 — the live detector arms a bar early on a swell, Comptine 1:45)
  RISE: 0,         // a rise of the loudness ladder by this over BARS bars asks to go in; 0 = off (§142: crossings only on buildLive / dropExpectedIn; was .1)
  BARS: 2,
  FALL: 0.3,       // ladder under this for EXIT_BARS bars (inside a child) rolls the ball back out
  EXIT_BARS: 1.5,  // bars of a fallen ladder before the ball rolls back out (a one-bar drop-out is a fill, not a breakdown)
  HYST: 0.3,       // the way out, once decided, is abandoned only when the ladder climbs back above FALL + HYST
  EXIT_SPEED: 2,   // the roll to the exit root is this much faster than VMAX (the way out is a decision, not a drift)
  P_MAX: 7,        // the period cap (the depth pass: was 14 — a period ≥ 8 filled Julia set is a rosette of small components, not the one blob with spiral arms the user knows; with DEPTH_MAX 1 only the cardioid's own p/q children, q ≤ QMAX)
  DIVE: 0.6,       // the landing: DIVE·R past the root along the normal (R the child's size; the child's centre is at R)
  TRIES: [1, 1.5, 2, 0.6, 2.6],   // DIVE multipliers tried; the deepest landing findCycle names q·q₀ wins
  ROOT_STEPS: 2,   // secant steps along the normal onto ρ = 1 before the landing is measured from the root
  ROOT_K: 0.9,     // each secant step takes this fraction of the linear estimate (ρ is concave toward the rim: the full step overshoots)
  T: 0.8,          // s: the crossing — c eases root-ward then into the child with the last chart held, par peaking at the root
  HOLD: 2,         // bars inside a component before the next crossing
  OUT_TOL: 0.02,   // turns: |θ_child| under this at the rim = at the root back to the parent
  DEPTH_MAX: 1,    // the depth pass: how many children deep the ball may go (1 = the cardioid and its first-level bulbs are home)
  CHILD_BARS: 2,   // bars a child crossing holds at most while the music no longer asks — then the ball rolls back out (the fallen ladder still exits earlier)
};
// §145 THE SWELL (the user on Comptine: a shift on a delicate piece should not explode the set; "at 48s the music starts to do something
// beautiful but the fractal seems boring"): below PERC_LT of the percussiveness scale an energy shift (and, with MAP, the file map's drop line)
// drives a SWELL — the ball pressed to the rim (GATE.RHO + .02), θ steered to the nearest gateway and the gate open to cross into the child, the
// interior's bands and brightness up (uSwell: index.js) — held while the engine's shiftHold (BEATS beats for a map line); the implosion is
// reserved for a confirmed slam (dropLiveEvt: §143's sub-back gate). Above PERC_LT a shift still implodes (the dance tracks keep §143's reads).
// And the ladder's RISE RATE presses the ball toward the rim BEFORE a shift lands: the swell term (RISE_GAIN × (loud − its RISE_TAU ema)),
// steering θ to the gateway past RISE_STEER; CENT 1 reads the centroid against the track's own running range (CENT_TAU) instead of CENT_LO/HI.
export const SWELL = {
  PERC_LT: 0.5,    // the percussiveness scale under which a shift swells instead of imploding — read on the SLOW ema (PERC_TAU: is this a percussive PIECE, not a loud bar: Comptine's 3 s scale read .59 on the 33 s chord attack and imploded); Comptine ~.3, Malicious ~.5, the kits .8–1; 0 = never (fd49b87)
  PERC_TAU: 15,    // s: the slow percussiveness ema the split reads
  MAP: 1,          // 1 = the file map's drop line swells too under PERC_LT (Comptine's 107.4 is the truth tool's provisional line); 0 = a map line always implodes
  BEATS: 8,        // beats a map-line swell holds (a shift's holds while shiftHold)
  TAU: 0.4,        // s: the swell's ease in and out
  BANDS: 0.6,      // the interior's band amplitude × (1 + BANDS·swell)
  LUM: 0.15,       // added to the smoulder's gain × swell
  RISE_GAIN: 3,    // the rise term: clamp((loud − ema_RISE_TAU(loud)) × RISE_GAIN, 0, 1) presses ρ toward GATE.RHO + .02 (0 = off, fd49b87)
  RISE_TAU: 2,     // s
  RISE_STEER: 0.5, // the rise term past this steers θ to the nearest gateway (the asks' steering)
  CENT: 1,         // 1 = the centroid normalised to the track's running range; 0 = ROLL.CENT_LO / CENT_HI (fd49b87)
  CENT_TAU: 60,    // s: the range's relaxation (the extremes decay toward the current value)
  PEND_CROSS: 0,   // §147: 1 = on a KIT the shift's press also opens the gate and CROSSES into the child, as the piano swell does (§145); 0 = the press and the gateway steer only — measured on The Roots' pending at 57.5 / 58.5 s, the crossing into a period-4 child at the rim IS the pink wash (centre Y .25 / .26, wash .21 / .24 with it; .11 / .14, .03 / .04 without; the smoulder and the swell lift move nothing). The under-PERC_LT swell crosses as before (Comptine unchanged)
  PEND_BANDS: 0,   // §147: on a KIT (at or above PERC_LT) the shift's press carries this share of the swell's band lift (BANDS × it) — 0 = the press without the lift (the pending read a pink wash at 56.5–58.5 on The Roots; the user rejects washes); 1 = the piano swell's lift. Eased over TAU like the swell
  PEND_LUM: 0,     // §147: ... and this share of the smoulder lift (LUM × it) on a kit; the under-PERC_LT swell keeps both at 1 (Comptine unchanged)
  SHIFT_WAIT: 4,   // §147 bars: on a KIT (at or above PERC_LT) a shift no longer implodes on its own frame — it ARMS: the swell's press (the ball to the rim, θ to the gateway, uSwell up) while the engine's shift arm listens, and the first confirmed slam (dropLiveEvt, on a beat line by construction) inside this many bars FIRES the implosion; none → the pending clears into the swell (held while shiftHold). No implosion without a slam (The Roots: the shift at 55.1 imploded 4 s early and between beats; the slam is 59.1). 0 = v0.44 (the shift implodes at once)
};
export const INT3 = {
  K_RINGS: 2,      // §145 the interior: the Koenigs rings and spokes fade with the ring index from the cycle point, exp(−rings/K_RINGS) — only the innermost few stay (the user liked "the complexity around the centre"; the tiling across the interior is gone); 0 = nothing inside but the floor; 999 = fd49b87's tiling
  FLOOR: 0.02,     // the interior's never-black luma floor, in the palette's hue (pal() goes under Y .01 in its blue phases)
};
export const KICK3 = { LEN: 0.5, ANG: 0.9, PERC: 1, CHART: 1 };   // the kick's jump: LEN × the component's size (1/|dλ/dc|) along the outward normal turned by ±ANG rad (the side alternating per kick — the lobes swing, not only the rim), × the lane's k; §144: PERC 1 = the jump × the percussiveness scale (DANCE.PERC_*), CHART 1 = the chart stays through the kick (findCycle at the DRAWN c each frame while it rings: the bands tighten toward the rim instead of the interior blinking black — 14–66 % of INT frames chart-off before; 0 = NAV2's Misiurewicz blink)
// THE DANCE (the §140 retune; the user on key 7: "the fractal shape doesn't seem to be changing that much … the set doesn't seem to
// be dancing with the music"): the set dances when log λ swings, so the REACTIVE levels drive ρ and θ directly — never a predicted
// route (the user's rule: reactive levels look in sync, predicted ones don't). Measured before the retune on the nine tracks:
// NAV3 |Δlog λ| .008–.14 per beat against NAV2's .29–1.14 (tools/work/nav3/dance-before.txt).
export const DANCE = {
  BASS: 0.6,       // ρ += BASS·bass·(1 − ρ): the bass level presses the ball out, the spiral's tightness (arg λ / ln|λ|) pulsing with every kick
  KICK: 0.8,       // ρ += KICK·kp·(1 − ρ): the kick lane's impulse (kickAmp on kickEvt, decaying over KICK_TAU)
  KICK_TAU: 0.2,   // s
  HIT: 0.3,        // ρ += HIT·hit·(1 − ρ): the ears' hit impulse
  TURN: 0.1,       // turns of θ per BAR, steady: the lobes rotate across a bar (a full turn in 10 bars; the first pass at .06 read .6–1 rad of arg swing per bar against NAV2's 1–1.8)
  SWAY: 0.18,      // turns of θ swaying over the 16-beat phrase: the overall shape is never the same two bars running
  SNARE: 0.08,     // turns of θ kicked by the snare (snareAmp on snareEvt, decaying over SNARE_TAU), the side alternating: the 2-and-4 twitch
  SNARE_TAU: 0.25, // s
  // §144 the jitter (the user on Comptine: "the movement is too quick and jittery for the music"): every DANCE term above is × the
  // PERCUSSIVENESS scale s = clamp(perc / PERC_REF, PERC_MIN, 1), perc the engine's onset-envelope spikiness eased over PERC_TAU s. The
  // nine tracks' mean perc (the 0–110 s traces): Comptine .100 · Malicious .164 · Raindrops .261 · SeeYouDrop .263 · Vienna .304 ·
  // IBelongHere .359 · TheChain .567 · CyborgNinja .649 · WhoLikesToParty .750 — a piano at a quarter to a third of a dance track, so
  // Comptine gets ~.3 and the dance tracks keep their snap (≥ .8 at PERC_REF .33). `punchy` was the other candidate and is NOT it: the
  // crest factor of a solo piano reads .25 against SeeYouDrop's .07. PERC_REF 0 = off (s 1, v0.43).
  PERC_REF: 0.33,
  PERC_MIN: 0.2,
  PERC_TAU: 3,
};

// the knobs as hooks: n3roll=RHO_LO,RHO_HI[,TH0,TH_SPAN[,GAIN,VMAX]] · n3gate=QMAX,TOL[,BUILD,RISE[,FALL,EXIT_BARS[,DIVE]]] · n3kick3=LEN
export function knob5(name, v) {
  const s = String(v === undefined || v === null ? '' : v), T = name === 'roll' || name === 'conv' ? ROLL : name === 'gate' ? GATE : name === 'dance' ? DANCE : name === 'swell' ? SWELL : name === 'int' ? INT3 : KICK3;
  if (s === '' || s === '1') return Object.assign({}, T);   // a bare call READS (CARD.hooks.n3roll() from the console; the knob alone in the URL)
  const nums = s.split(',').map(Number);
  if (!nums.length || nums.some((x) => !isFinite(x))) return null;
  const set = (T, keys) => keys.forEach((k, i) => { if (i < nums.length) T[k] = nums[i]; });
  if (name === 'roll') set(ROLL, ['RHO_LO', 'RHO_HI', 'TH0', 'TH_SPAN', 'GAIN', 'VMAX']);
  if (name === 'gate') set(GATE, ['QMAX', 'TOL', 'BUILD', 'RISE', 'FALL', 'EXIT_BARS', 'DIVE', 'P_MAX', 'DEPTH_MAX', 'CHILD_BARS']);   // the depth pass's A/B: &n3gate=7,0.5,0,0.1,0.3,1.5,0.6,14,2,99 is the quality pass's depth
  if (name === 'kick3') set(KICK3, ['LEN', 'ANG', 'PERC', 'CHART']);   // §144: &n3kick3=.5,.9,0,0 is v0.43's jump and blink
  if (name === 'dance') set(DANCE, ['BASS', 'KICK', 'HIT', 'TURN', 'SWAY', 'SNARE', 'PERC_REF', 'PERC_MIN', 'PERC_TAU']);   // §144: &n3dance=.6,.8,.3,.1,.18,.08,0 is v0.43's dance on every piece (PERC_REF 0 = the scale off)
  if (name === 'int') set(INT3, ['K_RINGS', 'FLOOR']);
  if (name === 'swell') set(SWELL, ['PERC_LT', 'PERC_TAU', 'MAP', 'BEATS', 'TAU', 'BANDS', 'LUM', 'RISE_GAIN', 'RISE_TAU', 'RISE_STEER', 'CENT', 'CENT_TAU', 'SHIFT_WAIT', 'PEND_BANDS', 'PEND_LUM', 'PEND_CROSS']);   // §145: &n3swell=0,15,0,8,.4,.6,.15,0,2,.5,0 is fd49b87 (no swell, no rise term, CENT_LO/HI); §147: the 13th–15th, SHIFT_WAIT (0 = v0.44: a kit's shift implodes at once), PEND_BANDS, PEND_LUM, PEND_CROSS (1,1,1 = the piano swell's lift and crossing on a kit's press)
  if (name === 'conv') set(ROLL, ['CONV_RIM', 'CONV_R0', 'CONV_MAX', 'CONV_CHILD', 'DOTS_RHO']);   // the depth pass's A/B: &n3conv=2,0.85,0.12 is the quality pass's flat disc; &n3conv=.6,.93,.05,.4 the v0.43 child disc (§142)
  return nums;
}
