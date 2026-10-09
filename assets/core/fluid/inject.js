// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// Solver after Pavel Dobryakov, WebGL-Fluid-Simulation (MIT, 2017) — https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
// The injection grammar: MS → the forces, the dye and the solver's parameters for one step (FLUID-PLAN Step 1, the table).
// PURE: no GL, no DOM, imports only math/*; node-importable (tools/test_fluid.js, tools/check.js). fluid.js applies what
// plan() returns. Every MS field read here is in FLUID_FEATS — main.js checks the list against ENGINE.FEATS like a scene's
// feats and check.js fails on a read outside it (the substrate feeds every scene, so the rule is stricter than a scene's warn).
// The mappings are CONTRACTS §1.18's kind: levels at heard time, events placed on their frame, *Amp for size, never *Vel,
// never pred*, never dropEvt (the drop is dropLiveEvt || mapDropEvt — §107). One musical element → one channel: the sub is
// WHERE the ink enters, the kick LIFTS it, the snare SHEARS it, the hats are droplets from the surface, the key is its COLOUR,
// the beat kneads the pool, the filter makes it syrup — and since §108 the HARMONIC content has its own two: the mid band's
// level is a FLOOR of ink (dye only, no velocity) at the key's sector, and a chord attack the snare lane does not call a snare
// (the v1 `snare` level rising with no `snareEvt`) is a smaller SHEAR with its own refractory. Before §108 a pad / chord /
// vocal piece (FLUID-DIAG-2026-10-09: sub 0 %, bass 20 %, low-mid 75 %) had no channel at all — 0 splats on 17 of 22 seconds.
// Units: positions in uv (0..1, y up), velocities in uv/s — a splat ADDS its dx/dy to the field once (an impulse); the
// persistent emitters (the sub, the hats while hat2 is up) add per frame scaled by 60·dt so a 30 fps machine injects the
// same per second. Seeded, never random: the hats' x is hash(beatCount·7 + i, seed.a).
// §111 (FLUID-TRACKS-2026-10-09 §10.1, the seven-track survey; the user: "tune and test with all the real songs"): the DENSITY
// GOVERNOR — a hit's size is its RANK in the lane's own recent distribution (loudRel's idea on the hits: the kick's sqrt law had no
// room under the lane's .31 amp floor, dy p10–p90 .49–.84 on every track), the hat droplets are a token bucket (every hat hit's
// first three, refilled at HAT_RATE — 29 droplets/s on CyborgNinja packed the surface), and the INK BUDGET: the injected ink per
// second (area-weighted) above INK_BUDGET scales the dissipation up, so the pool's ink saturates at the budget on every track —
// CyborgNinja (31 ink/s, 1 LU of dynamics) drains as fast as it fills, SeeYouDrop's groove (12) is untouched. Every splat carries
// its kind (`k`) for the replay rulers (tools/fluid-tracks.js, tools/fluid-replay.js).
import { clamp, frac, sstep, hsv, mix, ema } from '../../math/util.js';
import { mkAnchor, sectorPc, WARM, COOL, PULL, wrap } from '../../math/keycolour.js';
import { srgbToLin1 } from '../../math/oklab.js';

export const FLUID_FEATS = ['subNote', 'subGate', 'subGlide', 'subHz', 'bassReg', 'kickEvt', 'kickAmp', 'kickAge', 'snareEvt', 'snareAmp',
  'hat2', 'denH', 'beatCount', 'seed', 'beatPhase', 'key', 'mode', 'keyConf', 'tonicConf', 'modeShade', 'valence', 'harmAngle',
  'tension', 'lpSweep', 'buildLive', 'tongueAmbig', 'tongueOn', 'dropLiveEvt', 'mapDropEvt', 'hush', 'calm', 'loudRel', 'presence', 'bpm',
  'mid', 'snare'];

// The grammar's constants, one table (DECISIONS §104 says where each came from). Velocities in uv/s, dye in linear units.
export const K = {
  RADIUS: 0.0025,  // the splat's exp(−|p|²/r), aspect-corrected in the shader (the reference's default)
  SUB_V: 0.08,     // the sub emitter: +dy per frame (×60·dt) while subGate is open
  SUB_X: 0.02,     // its lean with the glide, per 12 st/s
  SUB_DYE: 0.015,  // its ink per frame (×60·dt): ≈ 0.9 at the mouth at dyeDiss 1
  KICK_V: 0.9,     // the kick: dy = KICK_V·sqrt(kickAmp), one impulse from the floor, radius ×2; 40 % on the two frames after
  KICK_DYE: 0.5,
  SNARE_V: 0.6,    // the snare: ±SNARE_V·snareAmp sideways at mid height
  SNARE_DYE: 0.25,
  HAT_V: -0.15,    // the hats: droplets falling from y 0.9, radius ×0.5, up to 3 of them while hat2 > 0.3
  HAT_DYE: 0.3,
  BODY: 0.35,      // the beat's breath: fy = −BODY·cos⁴(π·beatPhase), shaped cos(π(2x−1)) in the shader (a uniform force is a gradient)
  DROP_V: 2.5,     // the drop: one impulse up from the sub's x, radius ×4, and the pool clears (dyeDiss DROP_DISS) for one beat
  DROP_DYE: 1.0,
  DROP_DISS: 12,   // §107: 12 keeps 1 % of the ink 0.4 s after the drop ((1/(1+.2))²⁴); 6 kept 10 % and the pool read as full
  FLOOR_DYE: 0.004, // §108 the harmonic floor: ink per frame (×60·dt) × mid × gain at the key's sector — a quarter of the sub's,
                   //   ≈ 0.24 at the mouth at dyeDiss 1; NO velocity, so no roster trail moves (the feedback pass reads vel only)
  FLOOR_LO: 0.15,  //   the knee on `mid` (pow(band/peak, .7)·presence): below LO nothing, full above HI — silence and a residue
  FLOOR_HI: 0.40,  //   read as nothing, a sustained pad (mid .84–.99 on the take) as a slowly fed cloud
  CHORD_V: 0.18,   // §108 a chord attack: ±CHORD_V·Δsnare sideways at mid height — SNARE_V × 0.3, a third of the lane's shear
  CHORD_DYE: 0.08, //   its ink (SNARE_DYE × 0.3), × Δsnare
  CHORD_RISE: 0.05, //  the v1 `snare` level must rise by more than this in one frame (the take's chord attacks: Δ .08–.88)
  CHORD_REF: 0.15, //   s of refractory after a chord shear OR a snareEvt — a sustained chord is one attack, a snare is not doubled
  AMP0: 0.2,       // §111 the hit-size floor: a hit at the bottom of its lane's own range is AMP0 of the top (the kick launches √AMP0 = .45 of it; the lane's .31 floor gave every track .56)
  RANK_N: 64,      //   the hits a lane's running rank is taken over (its last 64: 20–60 s of music); under 8 hits the pooled prior .3 / .95
  HAT_RATE: 8,     // §111 the hat droplets' budget: tokens per second into a bucket of 3 — every hat hit's first three droplets, then the refill
  INK_BUDGET: 14,  // §111 the ink budget, area-weighted dye per second (Σ dye·(rad/RADIUS)²; SeeYouDrop's groove p50 12): the excess scales dyeDiss
  INK_TAU: 12,     //   the rate's ema, s — three bars at 150 bpm: a build's roll or a drop's bars pass through (SeeYouDrop's build-100 / drop2 read as before),
                   //   a constant boil does not (CyborgNinja's 27 ink/s on every second of 180)
  KEY_TRUST: 0.1,  // §111 the pool takes the key at this keyConf (keycolour's KEYC0; its KEYC1 .3 held the key on 2 of 6 tracks) and holds it until the next trusted one
  KEY_TAU: 30,     //   s: each key's EVIDENCE (Σ keyConf·dt over the trusted frames, decaying) — the first key pins at KEY_EV0 of it, another
  KEY_MARGIN: 1.5, //   key re-pins only when its evidence is KEY_MARGIN × the pinned key's: WhoLikesToParty's KK flips D ↔ Bm (relative keys,
                   //   the same diatonic set) every 10–23 s, IBelongHere's Dm / F / Am / C re-pinned each other every few seconds at a plain pin
  KEY_EV0: 0.5,    //   the evidence the first pin needs (5 s at trust .1, 1 s at .5): a cold start's first trusted guess is often wrong
                   //   (SeeYouDrop C# major at 0.7 s, WhoLikesToParty B minor at 0.3 s) — the harmony's centre colours the pool until then
  LP_RISE0: 0.03,  // §111 syrup only on a sweep that MOVES: lpSweep's rise over its 1 s ema, nothing below LP_RISE0, the full syrup at
  LP_RISE1: 0.12,  //   LP_RISE1 — a closed filter that is not closing is a dark mix (Comptine lpSweep p50 .93: velDiss 3 on 62 % of its frames)
  VOID_FLOOR: 0.3, // §111 the void's dissipation never goes under this unless the void is LATCHED on drums: buildLive > .5 with the sub
  VOID_BARS: 8,    //   seen within VOID_BARS bars — the tongues' ambiguity is a clock-lock measure (dyeDiss < .5 on 30–48 % of four tracks
                   //   from it alone) and a piano crescendo arms buildLive 1.0; a real build (SeeYouDrop's, Vienna's dream) had the bass
  CLEAR_PEND: 1.5, // §111 the clear is CONFIRMED: a trigger (dropLiveEvt || mapDropEvt) waits up to CLEAR_PEND beats for the sub emitter to
  CLEAR_REF: 4,    //   open — every true drop on the library brings it within 0.03 s, IBelongHere's four false live arms and Comptine's six
                   //   never — then CLEAR_REF beats of refractory (WhoLikesToParty's map line and live detector fired 1.0–1.1 s apart: two
                   //   clears per drop, the second emptying what the first's ring and the drop's kicks had just put back)
  HARM_TAU: 15,    //   s: the fallback hue (no trusted key yet) is the HARMONY'S CENTRE — harmAngle's unit vector and the mode, each an ema this
                   //   long, so a diatonic progression (IBelongHere's Dm F Am C: four fifths sectors, 38 s before any trust) is one hue, not four
};

export const mkState = () => ({ clearLeft: 0, anchor: mkAnchor(), xSub: 0.5, snarePrev: 0, chordLeft: 0,
  rkK: [], rkS: [], kickSz: 0, hatTok: 3, inkRate: 0,       // §111: the lanes' rank buffers, the kick's ranked size (its two tail frames), the hat bucket, the ink rate (ema INK_TAU)
  pin: null, ev: new Float64Array(24),                        //   the key the pool is coloured by ({k, m}: the one with the evidence), null until one is trusted; the 24 keys' evidence
  hx: 0, hy: 0, mSlow: 0,                                     //   the harmony's centre (HARM_TAU): harmAngle's unit vector and the mode, eased
  lpSlow: 0,                                                  //   lpSweep's 1 s ema: the sweep's rise is lpSweep − lpSlow (§111 item 3)
  subAge: 1e9,                                                //   s since the sub emitter was last open (§111 item 4: the void's latch)
  pendLeft: 0, refLeft: 0 });                                 //   the pending clear's window and the refractory, s (§111 item 5)

const RANK_PRIOR = [0.3, 0.95];   // the lanes' pooled p10 / p90 over the library (FLUID-TRACKS §10.0), used until a lane has 8 hits
// a hit's rank in its lane's own recent distribution: 0 at the lane's running p10, 1 at its p90 — deterministic, causal, per state
function rank(buf, amp) {
  buf.push(amp); if (buf.length > K.RANK_N) buf.shift();
  let lo = RANK_PRIOR[0], hi = RANK_PRIOR[1];
  if (buf.length >= 8) { const s = buf.slice().sort((a, b) => a - b); lo = s[Math.floor(0.1 * s.length)]; hi = s[Math.floor(0.9 * s.length)]; }
  return clamp((amp - lo) / Math.max(0.05, hi - lo), 0, 1);
}

const hash = (i, a) => frac(Math.sin(i * 12.9898 + a * 78.233) * 43758.5453);

// plan(S, dt, st) → { splats: [{x, y, dx, dy, r, g, b, rad, k}], body, params: {curl, velDiss, dyeDiss, pressure, radius},
// gain, colour: [r, g, b] (linear), floor, chord, ink, drop }. The splats come in the grammar's order: sub, kick, snare ×2, chord ×2, hats,
// floor, drop, each tagged with its kind `k` (tools/fluid-replay.js / fluid-tracks.js read it). `st` is mkState()'s (the anchor's ease,
// the drop's countdown, the last emitter x, the last frame's `snare` level, the chord refractory, the §111 ranks / bucket / ink rate / key).
// §111: the pool's colour never reads LOOK's mood (before: the key at keyConf ≥ .3, else the anchor slid to LOOK.mood.hue — the mood
// family's hue swung by intensity × arousal, so IBelongHere, whose keyConf p50 is .13 in one key, walked seven hues; CyborgNinja,
// WhoLikesToParty, Comptine never reached .3). Now: the key is PINNED at KEY_TRUST (.1) and held between trusted frames; until the
// first trusted key the hue is the harmony's own — harmAngle's nearest fifth with the mode's pull (the anchor's own fallback, with
// the mode) — so the hue moves only when the harmony does, never with arousal. The fourth argument is accepted and ignored (the call's shape).
export function plan(S, dt, st) {
  const f = 60 * dt; // per-frame emitters as a rate
  const g = S.presence * (0.3 + 0.7 * S.loudRel) * (1 - 0.8 * S.hush) * (1 - 0.5 * S.calm); // quiet is quiet
  // the dye colour: the shared key hue (keycolour.js) — warm / cool by the mode and the bar's shade, saturation by how sure the tonic is;
  // §111 the key pinned at KEY_TRUST and held, the harmonic fallback before any (the hue of harmAngle's nearest fifth, pulled by the mode)
  const ev = st.ev, decay = Math.exp(-dt / K.KEY_TAU);
  for (let i = 0; i < 24; i++) ev[i] *= decay;
  if ((S.keyConf || 0) >= K.KEY_TRUST) {
    const k = S.key | 0, m = S.mode ? 1 : 0, i = (k % 12) * 2 + m;
    ev[i] += S.keyConf * dt;
    if (!st.pin ? ev[i] >= K.KEY_EV0 : ev[i] > K.KEY_MARGIN * ev[(st.pin.k % 12) * 2 + st.pin.m]) st.pin = { k, m };
  }
  st.hx = ema(st.hx, Math.cos(S.harmAngle || 0), dt, K.HARM_TAU); st.hy = ema(st.hy, Math.sin(S.harmAngle || 0), dt, K.HARM_TAU);
  st.mSlow = ema(st.mSlow, S.mode ? 1 : 0, dt, K.HARM_TAU);
  const jf = ((Math.round(Math.atan2(st.hy, st.hx) / (2 * Math.PI) * 12) % 12) + 12) % 12, hueF = jf / 12;   // the fifths position of the centre's nearest fifth IS its hue
  const harmHue = hueF + PULL * wrap((st.mSlow > 0.5 ? COOL : WARM) - hueF);
  const A = st.anchor.anchor(dt, S.key | 0, S.mode | 0, S.keyConf || 0, isFinite(S.valence) ? S.valence : 0.5, S.harmAngle || 0, harmHue, st.pin, S.modeShade || 0);
  const col = hsv(frac(A.hue), clamp(A.sat * (0.4 + 0.6 * S.tonicConf), 0, 1), 1).map(srgbToLin1);
  const splats = [];
  const add = (x, y, dx, dy, dye, rad, k) => splats.push({ x, y, dx, dy, r: col[0] * dye, g: col[1] * dye, b: col[2] * dye, rad: K.RADIUS * rad, k });
  // the sub emitter: x on the circle of fifths (the sector of the bass note, half a sector in from the wall), y by the register
  st.subAge = S.subGate > 0 ? 0 : st.subAge + dt;
  if (S.subGate > 0) {
    const sec = S.subNote >= 0 ? sectorPc(S.subNote) + 0.5 : 12 * frac(S.harmAngle / (2 * Math.PI));
    st.xSub = sec / 12;
    const y = 0.12 + 0.25 * S.bassReg;
    const wide = 1 + 0.5 * (1 - clamp((S.subHz - 30) / 90, 0, 1)); // a lower sub is a wider mouth
    add(st.xSub, y, K.SUB_X * clamp(S.subGlide / 12, -1, 1) * g * f, K.SUB_V * g * f, K.SUB_DYE * g * f, wide, 'sub');
  }
  // the kick: an impulse up from the floor under the sub, sized by the hit's RANK in the lane's own range (§111: AMP0 + (1 − AMP0)·rank,
  // then the sqrt law — the smallest kick of a track launches √AMP0 of its biggest, not √.31 as the lane's floor gave every track);
  // the two frames after keep 40 % of the same size
  const kAge = S.kickAge < 99 ? Math.max(0, S.kickAge) : 99;
  if (S.kickEvt) st.kickSz = K.AMP0 + (1 - K.AMP0) * rank(st.rkK, Math.max(0, S.kickAmp));
  if (S.kickEvt || kAge < 2 / 60) {
    const w = S.kickEvt ? 1 : 0.4;
    add(st.xSub, 0.06, 0, K.KICK_V * Math.sqrt(st.kickSz) * g * w, K.KICK_DYE * g * w, 2, 'kick');
  }
  // the snare: a lateral shear at mid height, its force by the hit's rank in the snare lane's own range (§111)
  if (S.snareEvt) {
    const sz = K.AMP0 + (1 - K.AMP0) * rank(st.rkS, Math.max(0, S.snareAmp));
    add(0.3, 0.5, K.SNARE_V * sz * g, 0, K.SNARE_DYE * g, 1, 'snare');
    add(0.7, 0.5, -K.SNARE_V * sz * g, 0, K.SNARE_DYE * g, 1, 'snare');
  }
  // §108 a chord attack: the v1 `snare` level (the extractor's mid-band flux peak, 0.13 s decay) rising by more than CHORD_RISE in
  // one frame with no snareEvt on it — the pad's 2.5–2.9 dB attacks the 3.75 dB lane rightly does not call a snare — gives the same
  // two shears at a third of the force, sized by the rise; one refractory for both so a chord is one attack and a snare is never
  // doubled by its own rise on the frame after. The lane's hit keeps its full size above.
  const dS = S.snare - st.snarePrev;
  st.snarePrev = S.snare;
  st.chordLeft = Math.max(0, st.chordLeft - dt);
  let chord = 0;
  if (S.snareEvt) st.chordLeft = K.CHORD_REF;
  else if (dS > K.CHORD_RISE && st.chordLeft <= 0 && g > 0) {
    st.chordLeft = K.CHORD_REF;
    chord = dS;
    add(0.3, 0.5, K.CHORD_V * dS * g, 0, K.CHORD_DYE * dS * g, 1, 'chord');
    add(0.7, 0.5, -K.CHORD_V * dS * g, 0, K.CHORD_DYE * dS * g, 1, 'chord');
  }
  // the hats: up to three droplets from the surface, seeded by the beat — out of a token bucket (§111: 3 tokens, HAT_RATE per second
  // back), so a hat hit's first frames give their droplets and the frames after wait for the refill: 29 droplets/s (CyborgNinja,
  // WhoLikesToParty: hat2 up on 15 % of frames at denH 5–8) → 6–8, SeeYouDrop's bursts keep their first three
  st.hatTok = Math.min(3, st.hatTok + K.HAT_RATE * dt);
  if (S.hat2 > 0.3) {
    const n = Math.min(3, Math.round(S.denH), Math.floor(st.hatTok));
    st.hatTok -= n;
    for (let i = 0; i < n; i++) add(hash(S.beatCount * 7 + i, S.seed.a), 0.9, 0, K.HAT_V * g * f, K.HAT_DYE * g * f, 0.5, 'hat');
  }
  // §108 the harmonic floor: the mid band's level as continuous ink — pads, chords, vocals, the 95 % of a track the drum channels
  // never see — entering at the KEY's sector on the circle of fifths (the sub emitter's x rule on the tonic instead of the bass
  // note) at mid height, radius ×2, in the key's hue. Dye only, dx = dy = 0: the pool shows the music's level and colour from the
  // first second of sound and the hits' shears land in ink that is already there, while no roster trail moves (feedback.js reads
  // the velocity). The knee on `mid` keeps silence and a residue at nothing; the §107 clear still empties it (DROP_DISS 12 beats
  // 0.004 per frame).
  const floorLvl = sstep(K.FLOOR_LO, K.FLOOR_HI, S.mid) * S.mid;
  let floor = 0;
  if (floorLvl > 0 && g > 0) {
    floor = K.FLOOR_DYE * floorLvl * g * f;
    add((sectorPc(S.key | 0) + 0.5) / 12, 0.5, 0, 0, floor, 2, 'floor');
  }
  // §111 the ink budget: this frame's injected ink, area-weighted (a kick's ×2 radius is 4× the pool ink of a snare's at the same dye),
  // as a rate (ema INK_TAU: a transient — a build's roll, a drop's bars — passes, a steady boil is governed) — the drop below is one impulse, not counted
  let ink = 0;
  for (const s of splats) ink += (s.r + s.g + s.b) * (s.rad / K.RADIUS) ** 2;
  st.inkRate = ema(st.inkRate, ink / dt, dt, K.INK_TAU);
  // the drop: the pool clears in one beat (the countdown runs on dt, not on a clock field). The trigger is the live detector
  // OR the map's bar line (§107): in file mode with the map built the live detector never fires on SeeYouDrop's drop 1 and
  // `mapDropEvt` does (frame-exact); live mode has no map, so the detector is the whole truth there; Vienna's return at 85.33 s has
  // no map line and the detector fires (file mode too) — so both triggers stay, in both modes. NEVER `dropEvt` — it fires inside
  // Vienna's dream (CONTRACTS §1.18) and a missed live drop is the detector's gap to close, not the grammar's.
  // §111 item 5: a trigger only ARMS a pending clear; the clear and the impulse fire on the first frame within CLEAR_PEND beats that
  // the sub emitter opens — a drop IS the bass slamming back (every true drop on the library opens the gate within 0.03 s; the live
  // detector's false arms on IBelongHere's breakdown (bass .07–.36, no sub) and Comptine's piano (no sub ever) never do), then CLEAR_REF
  // beats of refractory so the map's line and the live detector a second apart are one clear, not two. A trigger inside the refractory
  // is dropped; a trigger inside a pending window re-arms it.
  const beat = 60 / Math.max(60, S.bpm);
  st.refLeft = Math.max(0, st.refLeft - dt);
  st.pendLeft = Math.max(0, st.pendLeft - dt);
  if ((S.dropLiveEvt || S.mapDropEvt) && st.refLeft <= 0) st.pendLeft = K.CLEAR_PEND * beat;
  let drop = 0;
  if (st.pendLeft > 0 && S.subGate > 0) {
    drop = 1; st.pendLeft = 0; st.refLeft = K.CLEAR_REF * beat;
    add(st.xSub, 0.06, 0, K.DROP_V * g, K.DROP_DYE * g, 4, 'drop');
    st.clearLeft = beat;
  } else st.clearLeft = Math.max(0, st.clearLeft - dt);
  // the beat's breath on the whole pool
  const c = Math.cos(Math.PI * S.beatPhase), c2 = c * c;
  const body = -K.BODY * c2 * c2 * g;
  // the solver's parameters
  const voidT = Math.max(S.buildLive, S.tongueOn === 1 ? S.tongueAmbig : 0); // ink accumulates through the void
  // §111 item 4: the deep void (.05) only when it is a real one — the live build detector armed past .5 AND the bass was here within
  // VOID_BARS bars (the void before a drop is the bass leaving); otherwise the void is bounded at VOID_FLOOR, so a tongue ambiguity or a
  // piano crescendo cannot hold the ink still for most of a track (Comptine: dyeDiss .05 on 44 % of frames, Malicious 73 %)
  const latched = S.buildLive > 0.5 && st.subAge < K.VOID_BARS * 4 * 60 / Math.max(60, S.bpm);
  const voidDiss = latched ? mix(1.0, 0.05, clamp(voidT, 0, 1)) : Math.max(K.VOID_FLOOR, mix(1.0, 0.05, clamp(voidT, 0, 1)));
  // §111 item 3: syrup (velDiss up to 3) only while the filter is CLOSING — lpSweep in its dark range AND rising against its own 1 s
  // ema; a dark mix that stays dark (Comptine's piano, IBelongHere's vocal mix, SeeYouDrop's outro: lpSweep ≥ .8 with no sweep) keeps
  // the hits travelling. The `2·hush` term is gone: hush read 0.00 on all seven tracks (a dead term).
  st.lpSlow = ema(st.lpSlow, S.lpSweep, dt, 1);
  const params = {
    curl: 10 + 40 * S.tension,
    velDiss: 0.2 + 2.8 * sstep(0.80, 0.97, S.lpSweep) * sstep(K.LP_RISE0, K.LP_RISE1, S.lpSweep - st.lpSlow),
    // the void's dissipation × the budget's excess (§111): at twice INK_BUDGET the ink drains twice as fast, in the void too (it still
    // accumulates there, at half the pace) — the pool's ink saturates at the budget on a track with no range of its own
    dyeDiss: st.clearLeft > 0 ? K.DROP_DISS : voidDiss * Math.max(1, st.inkRate / K.INK_BUDGET),
    pressure: 0.8,
    radius: K.RADIUS,
  };
  return { splats, body, params, gain: g, colour: col, floor, chord, ink: st.inkRate, drop }; // floor = this frame's floor ink, chord = the rise that sheared (0: none), ink = the budget's rate, drop = 1 on the frame a clear is confirmed — for the replay rulers

}
