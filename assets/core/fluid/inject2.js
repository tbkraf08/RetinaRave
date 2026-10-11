// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// Solver after Pavel Dobryakov, WebGL-Fluid-Simulation (MIT, 2017) — https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
// The RIG grammar (FLUID2, id 1; DECISIONS §121, docs/plans/FLUID2-EMITTERS.md — the user, 2026-10-11: an array of different-sized
// entry points lining the sides and top and inside, symmetric and tasteful, as a lighting designer would hang a rig; "remove the
// shockwave; add channel for vocals; pitch seems more like a vertical move rather than horizontal slide; rig should be invisible;
// color should be based on the coloring key (ie musical note) of circle of fifths"). The second MS → force grammar of the one pool,
// chosen by the scene that owns it (the card's `fluid: { grammar: 'bands' }`; core/fluid/grammar.js the table, fluid.js dispatches,
// loop.js names the owner). PURE, the same module interface as inject.js (`plan, mkState, K, FLUID_FEATS`): tools/fluid-tracks.js and
// tools/fluid-replay.js replay it through `INJECT=assets/core/fluid/inject2.js`.
//
// HOW IT COMPOSES. plan(S, dt, st) runs inject.js's plan() on `st.base` — the SAME state object fluid.js hands the pool grammar (fluid.js:
// `st2.base = st`), so the §111 machinery (the key pin, the lanes' ranks, the hat bucket, the ink rate and its governor, the confirmed
// clear, the harmonic branch, the noise guard) runs on warm across a scene switch in both directions; this file never writes st.base.
// Then it RE-PLACES the base's splats onto the rig by kind, keeping each one's force and its ink in the budget's units (area-weighted: a small mouth is denser): the WHERE is the rig's, the HOW HARD is the
// base's. What a lighting designer does — a fixed symmetric PLOT in three sizes, SYSTEMS per function, CHASES across them that change on
// the phrase, the outer fixtures held for the drop:
//   FLOOR  five washes along the bottom (x .5 ± {0, .2, .4}, sizes 2 / 1.5 / 1 — the big ones central): the sub's ink and lift from the
//          centre (and the inner pair in a build: the density ramp); the kick's impulse from a mouth the CHASE picks — even phrases
//          ping-pong over the inner pair (L R C R L C), odd phrases inside → out (centre, the inner pair, the outer pair,
//          the inner pair …); the outer pair opens only when the tension or the build says so (held back for the drop).
//   SIDES  three spots per wall (x .08 / .92, y .3 / .5 / .7): the snare fires the mirror PAIR, inward (FLUID's gesture kept), at the
//          height the phrase's quarter picks (middle, upper, lower, middle); the chord the pair at the centroid's height.
//   TOP    seven beams across the ceiling (x .5 ± {0, .14, .28, .42}, y .92, size ½): the hats' droplets on a chase — the odd beams on even
//          bars, the even beams on odd bars, each run outside → in — never a hashed x.
//   INSIDE the centre (the mids' floor cloud, dye only, as FLUID) and a quad (x .5 ± .2, y .5 ± .18) whose pairs join as the tension
//          rises (the lower pair first) — the ink shared, never added.
//   LEAD   the vocal / melody channel, centre stage: the strongest note above the bass (`interval` over the bass note — the chroma's lead;
//          a true vocal detector is S5b's extractor session, `voxS / voxHz`, two reads to swap in here) takes LEAD_SHARE of the floor's ink
//          and puts it at a HEIGHT by its pitch — the scale degree above the tonic, y LEAD_Y0 (the tonic) to LEAD_Y1 (the leading tone):
//          pitch is vertical here, never a horizontal slide; the mark eases between notes (LEAD_TAU) with a small push along its move.
//   DROP   the §113 shockwave is GONE (ring null, no 'drop' impulse); the clear (dyeDiss DROP_DISS for a beat, §107 / §111) stays, and on
//          the clear's frame every mouth fires one pulse — the BLINDER, the all-on cue — floor up, sides in, top down, the inside's ink.
// COLOUR: every splat in the hue of ITS NOTE on the circle of fifths (keycolour.js's wheel: pitch class pc at ((7·pc) mod 12) / 12 turns,
// pulled toward warm / cool by the mode as the key's own hue is) — the sub and the kick in the bass note's hue, the lead in its note's,
// everything without a note (the floor, the sides, the hats, the blinder) in the KEY's (the base's colour); NOTE_COL 0 = the base's
// colour on all. The rig is INVISIBLE: nothing here is drawn, the show pass is FLUID's. Positions in uv (0..1, y up), sizes × RADIUS.
import { plan as planBase, mkState as mkStateBase, FLUID_FEATS as FEATS_BASE, K as KB } from './inject.js';
import { clamp, ema, hsv } from '../../math/util.js';
import { WARM, COOL, PULL, wrap } from '../../math/keycolour.js';
import { srgbToLin1 } from '../../math/oklab.js';

export const FLUID_FEATS = [...FEATS_BASE, 'interval', 'phrase16Pos', 'bar'];   // the lead's note, the sides' quarter, the chases' bar parity

// The rig grammar's constants (K2), one table. The base's K (inject.js) is inherited through planBase().
export const K = {
  FLOOR_DX: 0.2,    // the floor's mouths at x .5 ± {0, DX, 2·DX}; sizes below (centre, inner pair, outer pair)
  FLOOR_S: [2, 1.5, 1],
  FLOOR_Y: 0.06,
  SIDE_X: 0.08,     // the side spots' inset from the wall (never AT it: a push at a closed wall is lost)
  SIDE_Y: [0.5, 0.7, 0.3],   // the heights the phrase's quarters pick: middle, upper, lower, (middle again)
  SIDE_S: 1,
  TOP_N: 7,         // the beams across the ceiling, x .5 ± TOP_DX·(i − 3)
  TOP_DX: 0.14,
  TOP_Y: 0.92,
  TOP_S: 0.5,
  QUAD_DX: 0.2,     // the inside quad, x .5 ± DX, y .5 ± DY, size as the floor cloud's (2)
  QUAD_DY: 0.18,
  QUAD_T: [0.35, 0.65],   // tension at which the lower pair, then the upper pair, join the centre
  SPREAD_B: 0.5,    // buildLive above which the sub's ink spreads from the centre to the inner pair too (the density ramp)
  OUTER_T: 0.6,     // tension (or buildLive) above which the outer floor pair joins the kick's chase — held back for the drop below it
  LEAD_SHARE: 0.5,  // the share of the floor's ink the lead mark takes while a lead note is there
  LEAD_Y0: 0.3,     // the lead's height at the tonic …
  LEAD_Y1: 0.85,    // … and at the leading tone (11 semitones up); pitch is vertical
  LEAD_TAU: 0.35,   // s: the mark's ease between notes — a glide, not a hop (`interval` changes up to twice a second on every track: 12 degree bins per track, the eight-track table)
  LEAD_V: 0.08,     // uv/s per uv of move: the push along the mark's travel (a melodic leap is a stroke, not a jump)
  LEAD_S: 1.5,
  BLIND_V: 0.6,     // the blinder on the clear's frame: every mouth one pulse — floor up, sides in, top down at this speed …
  BLIND_DYE: 0.3,   // … and this ink each (× gain)
  NOTE_COL: 1,      // 1: a splat with a note (the sub, the kick, the lead) in that note's hue; 0: the base's colour on everything
  SAT: 0.85,        // the note hues' saturation (× (.4 + .6·tonicConf), the base's shape)
};

// { base: inject.js's state (SHARED with the pool grammar — fluid.js sets it; null = make one on the first plan), …this grammar's own:
//   n frames owned (fluid.js zeroes it while another grammar owns the pool: the own state re-syncs on re-entry), the kick chase's count
//   and its last placement (the kick's two tail frames reuse it), the hat chase's count, the lead's eased height and its note }
export const mkState = () => ({ base: null, n: 0, kickN: 0, kickAt: null, hatI: 0, leadY: -1, leadPc: -1 });

const floorX = (i) => 0.5 + [0, -1, 1, -2, 2][i] * K.FLOOR_DX;   // mouth 0 the centre, 1 / 2 the inner pair, 3 / 4 the outer pair
const floorS = (i) => K.FLOOR_S[[0, 1, 1, 2, 2][i]];
const topX = (i) => 0.5 + K.TOP_DX * (i - 3);
const ODD = [0, 6, 2, 4], EVEN = [1, 5, 3];   // the top chase's runs, outside → in
const hueOf = (pc, minor) => { const h = ((7 * pc) % 12) / 12; return h + PULL * wrap((minor ? COOL : WARM) - h); };

// plan(S, dt, st) → inject.js's shape (splats, body, params, gain, colour, floor, chord, ink, drop, harmonic, noise, ring: null) plus
// `rig` { kick: [mouths], hats: [beams], side: q, quad: n, lead: { on, pc, deg, y }, blind } for the rulers.
export function plan(S, dt, st) {
  if (!st.base) st.base = mkStateBase();
  const R = planBase(S, dt, st.base);
  const B = st.base, g = R.gain, f = 60 * dt;
  st.n++;
  // the key and the mode as the base colours by them (its pin, else the harmony's nearest fifth), the note hues' saturation
  const jf = ((Math.round(Math.atan2(B.hy, B.hx) / (2 * Math.PI) * 12) % 12) + 12) % 12;
  const tonic = B.pin ? B.pin.k : (7 * jf) % 12, minor = B.pin ? B.pin.m : (S.mode ? 1 : 0);
  const sat = clamp(K.SAT * (0.4 + 0.6 * (S.tonicConf || 0)), 0, 1);
  const lum0 = R.colour[0] + R.colour[1] + R.colour[2];
  const noteCol = (pc) => {   // the note's hue at the BASE colour's luminance sum: the ink in the budget's units is the base's whatever the hue (the eight-track table read .82–.88 of it unnormalised)
    if (!K.NOTE_COL || pc < 0) return R.colour;
    const c = hsv(hueOf(pc, minor) - Math.floor(hueOf(pc, minor)), sat, 1).map(srgbToLin1), l = c[0] + c[1] + c[2];
    return l > 0 ? c.map((v) => v * lum0 / l) : R.colour;
  };
  const out = [];
  const put = (x, y, dx, dy, dye, col, rad, k) => out.push({ x, y, dx, dy, r: col[0] * dye, g: col[1] * dye, b: col[2] * dye, rad: KB.RADIUS * rad, k });
  const dyeOf = (s) => (s.r + s.g + s.b) / Math.max(1e-9, R.colour[0] + R.colour[1] + R.colour[2]);   // the base's dye scalar back out of its colour
  const by = {}; for (const s of R.splats) (by[s.k] || (by[s.k] = [])).push(s);
  const bassPc = S.subNote >= 0 ? S.subNote | 0 : tonic;
  const bassCol = noteCol(S.subGate > 0 ? bassPc : -1);
  const rig = { kick: [], hats: [], side: -1, quad: 0, lead: { on: 0, pc: -1, deg: -1, y: -1 }, blind: 0 };
  // FLOOR — the sub: the centre wash, the inner pair joining in a build (the ink and the lift shared)
  if (by.sub) for (const s of by.sub) {
    const mouths = S.buildLive > K.SPREAD_B ? [0, 1, 2] : [0], r0 = s.rad / KB.RADIUS;
    for (const m of mouths) { const r = floorS(m) / 2 * r0; put(floorX(m), s.y, s.dx, s.dy / mouths.length, dyeOf(s) / mouths.length * (r0 / r) ** 2, bassCol, r, 'sub'); }   // the base's mouth width rides the wash's size; the ink in the budget's units (area-weighted) is the base's
  }
  // FLOOR — the kick: the chase (one mouth, or a pair at the same momentum split); the two tail frames reuse the hit's placement
  if (by.kick) {
    const outer = S.tension > K.OUTER_T || S.buildLive > K.OUTER_T;
    if (S.kickEvt) {
      const odd = ((S.bar | 0) >> 2) & 1, i = st.kickN++;
      if (!odd) st.kickAt = [[1], [2], [0], [2], [1], [0]][i % 6];                           // ping-pong over the inner pair, L R C R L C — equal by construction
      else { const ring = [0, 1, 2, 1][i % 4]; st.kickAt = ring === 0 ? [0] : ring === 1 ? [1, 2] : outer ? [3, 4] : [0]; }   // inside → out, the outer pair only when open
    }
    const at = st.kickAt || [0];
    for (const s of by.kick) for (const m of at) put(floorX(m), K.FLOOR_Y, 0, s.dy / Math.sqrt(at.length), dyeOf(s) / at.length * (s.rad / KB.RADIUS / floorS(m)) ** 2, bassCol, floorS(m), 'kick');   // a smaller mouth, a denser ink: the area-weighted ink is the base's
    rig.kick = at.slice();
  }
  // SIDES — the snare's mirror pair at the phrase quarter's height, the chord's at the centroid's; always inward, the base's force and ink
  const q = Math.floor(clamp((S.phrase16Pos || 0) / 4, 0, 3.999)), ySn = K.SIDE_Y[[0, 1, 2, 0][q]];
  const yCh = K.SIDE_Y[S.centroid < 0.33 ? 2 : S.centroid < 0.66 ? 0 : 1];
  for (const kind of ['snare', 'chord']) if (by[kind]) {
    const s = by[kind][0], v = Math.abs(s.dx) + Math.abs(s.dy), dye = dyeOf(s) * (by[kind].length > 1 ? 1 : 0.5), y = kind === 'snare' ? ySn : yCh;
    put(K.SIDE_X, y, v, 0, dye, R.colour, K.SIDE_S, kind); put(1 - K.SIDE_X, y, -v, 0, dye, R.colour, K.SIDE_S, kind);
    if (kind === 'snare') rig.side = q;
  }
  // TOP — the hats' droplets on the beam chase: the odd beams on even bars, the even on odd, each run outside → in
  if (by.hat) for (const s of by.hat) {
    const run = ((S.bar | 0) & 1) ? EVEN : ODD, beam = run[st.hatI++ % run.length];
    put(topX(beam), K.TOP_Y, 0, s.dy, dyeOf(s), R.colour, K.TOP_S, 'hat'); rig.hats.push(beam);
  }
  // INSIDE — the floor cloud at the centre, the quad's pairs joining with the tension; the LEAD takes its share and rises with its pitch
  if (by.floor) {
    const s = by.floor[0]; let dye = dyeOf(s);
    const lead = S.subGate > 0 || R.harmonic ? ((S.interval | 0) % 12 + 12) % 12 : 0;   // the strongest note above the bass (0 = none other)
    if (lead > 0 && dye > 0) {
      const pc = (bassPc + lead) % 12, deg = ((pc - tonic) % 12 + 12) % 12, yT = K.LEAD_Y0 + (K.LEAD_Y1 - K.LEAD_Y0) * deg / 11;
      const y0 = st.leadY < 0 ? yT : st.leadY, y = ema(y0, yT, dt, K.LEAD_TAU), move = y - y0;
      st.leadY = y; st.leadPc = pc;
      const share = dye * K.LEAD_SHARE; dye -= share;
      put(0.5, y, 0, K.LEAD_V * 60 * move, share * (2 / K.LEAD_S) ** 2, noteCol(pc), K.LEAD_S, 'lead');   // the same ink in the budget's units
      rig.lead = { on: 1, pc, deg, y: +y.toFixed(4) };
    } else { st.leadY = -1; st.leadPc = -1; }
    const pairs = (S.tension > K.QUAD_T[0] ? 1 : 0) + (S.tension > K.QUAD_T[1] ? 1 : 0), n = 1 + 2 * pairs;
    put(0.5, 0.5, 0, 0, dye / n, R.colour, 2, 'floor');
    if (pairs >= 1) for (const sx of [-1, 1]) put(0.5 + sx * K.QUAD_DX, 0.5 - K.QUAD_DY, 0, 0, dye / n, R.colour, 2, 'floor');
    if (pairs >= 2) for (const sx of [-1, 1]) put(0.5 + sx * K.QUAD_DX, 0.5 + K.QUAD_DY, 0, 0, dye / n, R.colour, 2, 'floor');
    rig.quad = 2 * pairs;
  }
  // DROP — no shockwave, no drop impulse; the BLINDER on the clear's frame: every mouth one pulse
  if (R.drop) {
    const v = K.BLIND_V * g, dye = K.BLIND_DYE * g;
    for (let m = 0; m < 5; m++) put(floorX(m), K.FLOOR_Y, 0, v, dye, R.colour, floorS(m), 'blind');
    for (const y of K.SIDE_Y) { put(K.SIDE_X, y, v, 0, dye, R.colour, K.SIDE_S, 'blind'); put(1 - K.SIDE_X, y, -v, 0, dye, R.colour, K.SIDE_S, 'blind'); }
    for (let i = 0; i < K.TOP_N; i++) put(topX(i), K.TOP_Y, 0, -v, dye, R.colour, K.TOP_S, 'blind');
    put(0.5, 0.5, 0, 0, dye, R.colour, 2, 'blind');
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) put(0.5 + sx * K.QUAD_DX, 0.5 + sy * K.QUAD_DY, 0, 0, dye, R.colour, 2, 'blind');
    rig.blind = 1;
  }
  return { ...R, splats: out, ring: null, rig };
}
