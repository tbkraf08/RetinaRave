// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// NAV2's navigation pass — the phrase walk, Green's ruler as the fitness, drops that land somewhere new (DECISIONS §101,
// 2026-10-08; docs/plans/NAV2-RETUNE-PLAN.md step 3, the user's answer "a + c"). The complaint (review §2): the only discrete
// chooser of a place is `interval` → one of 12 bulb roots, constant for a whole section, so c sits beside ONE root for minutes
// and every drop lands in the same dust. Three terms, each behind a knob whose rest is NAV's line:
//   WALK   `interval` still names the SPECIES (its p/q bulb). On every phrase boundary (the 16-beat wrap of `phrase16Pos`; a
//          `barNovelEvt` / `sectionEvt` — a new section — too) the target steps along the Farey ladder: phrase k → the species,
//          k+1 → a place on its LOW side (the Farey neighbour a/b of p/q in F_DEPTH, or the mediant (p+a)/(q+b): the child bulbs
//          around the root), k+2 → the species again, k+3 → the HIGH side. Each place is a real bulb object (root, centre,
//          rays, R) so NAV's own rim walk takes c there (leave through the root, α along the cardioid, enter) — continuity by
//          construction, no new cut. The tiny-bulb trap: a candidate's size proxy sin(πp/q)/q² must clear MINSIZE. The walk
//          lives on M: in a baby, or while a baby is wanted, the target is the species (babySwap's index stays honest). The species
//          itself is DEBOUNCED: a new interval names it only after HOLD bars (measured: on real music the interval flickers for a
//          beat or two many times a minute, and each flicker sent NAV on a rim walk it never finished — c was in transit, not in a place).
//   GREEN  green.js's ruler picks WHICH place on a side: each candidate's Q (the isoperimetric quotient of its 1.06-equipotential,
//          4πA/L², 1 = a circle) is probed at the radius NAV would sit at (ρ = .12 + .8 I, c = centre + ρ·(root − centre) — the
//          chart agrees to 3 decimals, see §101's table), and loud (loudRel on the track's own ladder, loudlight.js) prefers the LOWEST Q (the most deformed set),
//          quiet the highest (the calmest) — the legibility brief, "loud is busy, quiet is calm". Feedback: while loud, the
//          measured Q of the frame above QMAX for more than BARS bars (a calm picture under a loud passage) steps the walk early.
//   DROP   NAV's exterior rule stays (out 8 beats, 48 at a peak, `dropLiveEvt`), but the drop is a section event — the walk steps —
//          and c launches along the NEW place's landing ray (alternating the two per drop); outside, θ drifts with the harmony
//          FROM that ray (NAV springs θ from the ray to harmUnw/TAU + seed.th, the same spot every drop); HOME returns to the
//          walk's current target (NAV's own line: `N.target` is the walk's).
// Pure state + numbers: no GL. Fields that are not published leave their term at rest (no phrase clock → no step).
import { TAU, clamp, frac } from '../../math/util.js';
import { rootOf, bulbCenter, rayAngles } from '../../math/mandel.js';
import { baseLight } from '../../math/loudlight.js';   // the track's own loudness ladder (§63): loudRel spans 18 LU, a track rarely 11 — the ladder puts what it shows across 0..1
import { trace, curve, N_PTS, G } from './green.js';

// the knobs: &n2walk=0 · &n2walk=DEPTH[,MINSIZE[,PER[,DWELL[,HOLD]]]] · &n2green=0 · &n2green=W[,QMAX[,BARS]] · &n2drop=0
export const K4 = { walk: 1, green: 1, drop: 1 };
export const WALK = { DEPTH: 7, MINSIZE: 0.008, PER: 1, DWELL: 1, HOLD: 1 };   // Farey depth of the neighbours (q ≤ DEPTH); the size floor (1/7 = .0089 passes, 2/9 = .0079 not); phrases per step; bars c must have sat in the place before the next step (a step asked earlier waits for a bar line after that); bars a new `interval` must HOLD before it names the species (on real music the interval flickers for a beat or two — Vienna 25–55: 34 of 40 runs under 4 beats — and every flicker sent NAV on a 3–5 s rim walk it never finished; 0 = NAV's instant retarget)
export const GREEN = { W: 1, QMAX: 0.8, BARS: 1, LOUD: 0.6 };   // W: how far loudness decides (0 = the sides alternate); QMAX / BARS: the feedback's ceiling and patience; LOUD: the ladder value that counts as loud for the feedback
export const W2 = {
  k: 0, place: null, species: null, cands: [], pick: '', qPred: 0,   // the step count, the walk's target (null = the species), the last choice
  phr: 0, lastPos: 0, lastBeat: -99, steps: 0, early: 0, over: 0,     // phrases seen, the beat of the last step, steps taken, early steps, beats over QMAX while loud
  drops: 0, base: 0, hu0: 0, pm: '',                                   // drops launched, the exterior's θ base + the harmUnw at launch, the mode last frame
  due: '', dueBeat: 0, at: null, dwell: 0, lastBar: 0, lastOdd: null,     // the step asked and not yet taken (+ the beat it was asked), the bulb c sits in and for how many beats, the bar clock, the last side place
  cand: null, candBeats: 0,                                              // the interval's bulb this frame and how many beats it has held (the species debounce)
};
const CACHE = new Map();   // 'p/q' → the bulb object (identity matters: nav.js compares N.bulb !== b)

export function reset4() {
  W2.k = 0; W2.place = null; W2.species = null; W2.cands = []; W2.pick = ''; W2.qPred = 0; W2.phr = 0; W2.lastPos = 0; W2.lastBeat = -99;
  W2.steps = 0; W2.early = 0; W2.over = 0; W2.drops = 0; W2.base = 0; W2.hu0 = 0; W2.pm = ''; W2.due = ''; W2.dueBeat = 0; W2.at = null; W2.dwell = 0; W2.lastBar = 0; W2.lastOdd = null; W2.cand = null; W2.candBeats = 0;
}

export function knob4(name, v) {
  const s = String(v === undefined || v === null ? '' : v);
  if (s === '0') { K4[name] = 0; if (name === 'walk') W2.place = null; return 0; }
  K4[name] = 1;
  const nums = s === '' || s === '1' ? [] : s.split(',').map(Number);
  if (!nums.length || nums.some((x) => !isFinite(x))) return K4[name];
  const set = (T, keys) => keys.forEach((k, i) => { if (i < nums.length) T[k] = nums[i]; });
  if (name === 'walk') set(WALK, ['DEPTH', 'MINSIZE', 'PER', 'DWELL', 'HOLD']);
  if (name === 'green') set(GREEN, ['W', 'QMAX', 'BARS']);
  return nums;
}

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
export const sizeOf = (p, q) => Math.sin(Math.PI * p / q) / (q * q);   // the bulb's radius, to a bounded factor (field.js's child-size proxy)

// A bulb object for any p/q (mandel.js's BULBS shape, so bulbChart / navDrop / the loud exit read it as one of the twelve).
// `i` is the species' index (babySwap maps bulbs by i; the walk never lets a swap happen off the species, see walkTarget).
export function mkBulb(p, q, i) {
  const key = p + '/' + q;
  let b = CACHE.get(key);
  if (b) return b;
  const root = rootOf(p, q), center = bulbCenter(p, q);
  b = { i, p, q, per: q, alpha: p / q, root, center, rays: rayAngles(p, q), walk: 1 };
  b.R = Math.hypot(center[0] - root[0], center[1] - root[1]);
  b.rhoMax = Math.min(0.985, 1 - Math.max(0.015, 4 * 1.2e-7 / b.R));   // float32 c-quantisation inside the component (baby.js's rule)
  CACHE.set(key, b);
  return b;
}

// The Farey neighbours of p/q in F_D (the fractions bracketing it, q ≤ D — p/q itself may be deeper, 1/15 is) and the mediants:
// [low side: neighbour, mediant] [high side: neighbour, mediant], each reduced, q ≥ 2, size ≥ MINSIZE.
export function ladder(p, q, D = WALK.DEPTH, minSize = WALK.MINSIZE) {
  const x = p / q;
  let lo = [0, 1], hi = [1, 1];
  for (let b = 2; b <= D; b++) for (let a = 1; a < b; a++) {
    if (gcd(a, b) !== 1 || a === p && b === q) continue;
    if (a / b < x && a / b > lo[0] / lo[1]) lo = [a, b];
    if (a / b > x && a / b < hi[0] / hi[1]) hi = [a, b];
  }
  const red = (a, b) => { const g = gcd(a, b); return [a / g, b / g]; };
  const side = (nb) => [nb, red(p + nb[0], q + nb[1])].filter(([a, b]) => b >= 2 && !(a === p && b === q) && sizeOf(a, b) >= minSize);
  return [side(lo), side(hi)];
}

// Green's Q of the equipotential at c, nothing else touched (measure() owns G and the previous curve; trace() only fills X/Y).
export function probeQ(cr, ci) {
  if (!trace(cr, ci)) return 1;
  const { x: X, y: Y } = curve();
  let A = 0, L = 0;
  for (let j = 0; j < N_PTS; j++) {
    const k = (j + 1) % N_PTS;
    A += X[j] * Y[k] - X[k] * Y[j];
    L += Math.hypot(X[k] - X[j], Y[k] - Y[j]);
  }
  A = Math.abs(A) / 2;
  return L > 0 ? 4 * Math.PI * A / (L * L) : 1;
}

// One step of the walk: k advances, the place for this k is chosen — the species on even steps; on odd steps a place from the
// ladder: Green's ruler picks over BOTH sides when loudness speaks (loud → the lowest Q, quiet → the highest, never the same side
// place twice running), otherwise the sides alternate (low, high) and the neighbour / the mediant take turns.
const loud = (S) => baseLight(S.loudRel, S.loudRange, S.loudAbs, isFinite(S.eS) ? S.eS : 0.5);   // 0..1 on the track's own ladder (look2.js's L2.base)
function step(S, sp, why) {
  W2.k++;
  W2.steps++;
  W2.lastBeat = S.beatCount || 0;
  W2.due = '';
  W2.dwell = 0;
  const phase = W2.k & 3;
  if (phase === 0 || phase === 2) { W2.place = null; W2.pick = sp.p + '/' + sp.q + ' ' + why; W2.cands = []; return; }
  const I = clamp(S.intensity || 0, 0, 1), rho = clamp(0.12 + 0.8 * I, 0.12, 0.98);
  const mk = ([a, b], side) => {
    const bb = mkBulb(a, b, sp.i), c0 = bb.center, c1 = bb.root;
    return { b: bb, side, Q: K4.green ? probeQ(c0[0] + rho * (c1[0] - c0[0]), c0[1] + rho * (c1[1] - c0[1])) : 0 };
  };
  const [lo, hi] = ladder(sp.p, sp.q), pool = [...lo.map((f) => mk(f, 0)), ...hi.map((f) => mk(f, 1))];
  if (!pool.length) { W2.place = null; W2.pick = sp.p + '/' + sp.q + ' (no side) ' + why; W2.cands = []; return; }
  const s = K4.green ? (clamp(loud(S), 0, 1) - 0.5) * 2 * GREEN.W : 0;   // −W quiet … +W loud
  let pick = null;
  if (Math.abs(s) > 0.1) {
    const cs = pool.length > 1 ? pool.filter((o) => o.b !== W2.lastOdd) : pool;
    for (const o of cs) if (!pick || (s > 0 ? o.Q < pick.Q : o.Q > pick.Q)) pick = o;
  } else {
    const want = phase === 1 ? 0 : 1, side = pool.filter((o) => o.side === want), cs = side.length ? side : pool;   // a species with one empty side (0/1, 7/8) walks the other both times
    pick = cs[((W2.k >> 2) & 1) % cs.length];   // the neighbour one round, the mediant the next
  }
  W2.lastOdd = pick.b;
  W2.place = pick.b;
  W2.qPred = pick.Q;
  W2.cands = pool.map((o) => o.b.p + '/' + o.b.q + (K4.green ? ':' + o.Q.toFixed(3) : ''));
  W2.pick = pick.b.p + '/' + pick.b.q + (Math.abs(s) > 0.1 ? (s > 0 ? ' loud ' : ' quiet ') : ' ') + why;
}

// Once per updateNav (dt, MS, the navigator, NAV's own target), after NAV's `want` line and before its target line: the phrase clock, the section events, the feedback,
// the exterior's θ base; returns the target bulb (NAV's `tgt` when the walk is off, in a baby, or while a baby is wanted).
export function walkTarget(dt, S, N, species) {
  if (N.mode === 'EXT' && W2.pm !== 'EXT') { W2.base = N.th.x; W2.hu0 = S.harmUnw || 0; }   // the loud exit's launch (navDrop's sets its own)
  W2.pm = N.mode;
  if (!K4.walk) return species;
  const bps = (S.bpm > 40 ? S.bpm : 124) / 60;
  // the species debounce: the interval's bulb becomes the species once it has held HOLD bars (the first one, and a baby's, at once)
  if (W2.cand !== species) { W2.cand = species; W2.candBeats = 0; } else W2.candBeats += dt * bps;
  // c on its way into a root (h climbing through −.1 … .02): a retarget there lets the h spring overshoot into the OTHER chart for a
  // frame (NAV's own hazard, met on Malicious 164.2 s: the species switched to the cardioid at h −.02, the overshoot frame drew the
  // 0/1 chart = the cusp, a .35 jump) — the switch, the timed-out step AND the returned target hold until c is inside the bulb or back
  // on the rim (NAV takes a new target only on a beat, so the hold is on what this returns — N.target itself — not only on when it changes)
  const crossing = N.mode === 'INT' && N.h.x > -0.1 && N.h.x <= 0.02;
  if (!W2.species || N.baby || N.want || (W2.candBeats >= WALK.HOLD * 4 && !crossing)) {
    if (W2.species !== species) { W2.species = species; W2.k &= ~3; W2.place = null; W2.due = ''; W2.dwell = 0; }   // a new species: back on its root, the phrase count keeps its parity
  }
  const sp = W2.species;
  // where c sits: inside the target bulb (past the root) for how many beats — a step waits until the place has been SEEN (DWELL bars)
  const here = N.mode === 'INT' && N.bulb === N.target && (N.h.x > 0.02 || (N.target.q === 1 && N.h.x < -0.02));   // in the bulb past its root, or on the cardioid (the 0/1 species, h < 0)
  if (here && N.bulb !== W2.at) { W2.at = N.bulb; W2.dwell = 0; }
  if (here) W2.dwell += dt * bps;
  const bar = S.barPos, barLine = !isFinite(bar) || bar < W2.lastBar - 2;
  if (isFinite(bar)) W2.lastBar = bar;
  const pos = S.phrase16Pos, bc = S.beatCount || 0;
  if (isFinite(pos)) {
    if (pos < W2.lastPos - 8) { W2.phr++; if (W2.phr % Math.max(1, WALK.PER | 0) === 0 && !W2.due) { W2.due = 'phrase'; W2.dueBeat = bc; } }
    W2.lastPos = pos;
  }
  if ((S.barNovelEvt || S.sectionEvt) && bc - W2.lastBeat >= 4 && !W2.due) { W2.due = S.barNovelEvt ? 'novel' : 'section'; W2.dueBeat = bc; }
  // the feedback: loud and calm for more than BARS bars → an early step (the ruler's Q is the frame's, measure()d last update)
  if (K4.green && N.mode === 'INT' && N.cyc.has && loud(S) >= GREEN.LOUD && G.Q > GREEN.QMAX) W2.over += dt * bps;
  else W2.over = Math.max(0, W2.over - dt * bps * 2);
  if (!W2.due && W2.over > GREEN.BARS * 4 && bc - W2.lastBeat >= 8) { W2.due = 'early'; W2.dueBeat = bc; W2.early++; W2.over = 0; }
  // the step is taken on a bar line once the place has been dwelt in (or when the walk has been stuck in transit for 2 phrases)
  if (W2.due && S.presence >= 0.15 && barLine && !crossing && (W2.dwell >= WALK.DWELL * 4 || bc - W2.dueBeat >= 32)) step(S, sp, W2.due + (W2.dwell >= WALK.DWELL * 4 ? '' : '!'));
  if (N.baby || N.want) return species;
  if (crossing) return N.target;   // NAV takes the target on a beat: a beat inside the band re-takes the one c is climbing into
  return W2.place || sp;
}

// From navDrop, after NAV set θ to the current bulb's landing ray (`inside`: c was in INT / IN / OUT, so NAV did set it):
// the drop is a step of the walk, and the launch ray is the NEW place's (alternating the pair per drop).
export function dropLaunch(S, N, inside) {
  if (!K4.drop) return;
  W2.drops++;
  if (K4.walk && !N.baby && !N.want && W2.species) {
    step(S, W2.species, 'drop');
    if (!W2.place) step(S, W2.species, 'drop+');   // a drop lands somewhere NEW: never on the species it just left
  }
  const pl = (K4.walk && !N.baby && !N.want && W2.place) || N.target, ra = pl.rays[W2.drops & 1];
  if (inside) N.th.set(ra + Math.round(N.th.x - ra));
  W2.base = N.th.x;
  W2.hu0 = S.harmUnw || 0;
}

// The exterior's θ target: NAV's harmUnw/TAU + seed.th, or (the drop knob) the harmony's drift from the launch ray.
export const extTheta = (S) => (K4.drop ? W2.base + ((S.harmUnw || 0) - W2.hu0) / TAU : S.harmUnw / TAU + S.seed.th);
export { frac };
