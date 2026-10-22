// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// THE ENERGY-SHIFT STAGE (DECISIONS §143, engine/shift/shift.js): `shiftEvt` (the loudness ladder stepped up over the last bar — the
// drop a piece with no slam has) and `shiftHold` (the energy is still up). Additive: reads the loud stage's fields (loudRel / loudRange
// / loudAbs → math/loudlight's base light, the ladder every scene's brightness reads), the raw v3 clock + the lead's estimate (the bars
// stage's time base) and this frame's confirmed drop (dropLiveEvt from the build stage, mapDropEvt from the ears' map) — registered
// after 'build' (main.js import order) so the slam it must not double is already on MS; writes only its own two fields. No scene
// reads them by default but NAV3 (§143 item 3). #test (the fake timeline) never runs it — sources/fake.js runs the same Shift on its
// own mirrored ladder, as it mirrors the loud fields (features-loud.js's convention: return without touching them).
import { AU } from './audio.js';
import { ENGINE } from './engine.js';
import { LEAD } from './lead.js';
import { Shift, SHIFT, SHIFT_OUT } from './shift/shift.js';
import { baseLight } from '../math/loudlight.js';

export const SHIFTS = { s: null, src: null, inp: {} };
ENGINE.SHIFTK = SHIFT;   // the knobs, for the harness (CARD.ENGINE.SHIFTK.STEP = …)

export function shiftStage(dt, now, S) {
  if (ENGINE.fakeOn) return;   // sources/fake.js has written both fields this frame
  S.shiftEvt = false;
  if (!AU.ctx || AU.mode === 'none') { S.shiftHold = 0; return; }
  const src = AU.mode + ':' + (AU.file ? AU.file.name + '@' + AU.file.at : '');
  if (!SHIFTS.s || src !== SHIFTS.src) { SHIFTS.s = new Shift(SHIFT); SHIFTS.src = src; }   // a new stream / a seek: nothing carries across
  const i = SHIFTS.inp, bps = S.bpm / 60, L = LEAD.L === null ? 0 : LEAD.L;
  i.B = S.beatCount + S.beatPhase + L * bps; i.bpm = S.bpm; i.ok = S.presence >= SHIFT.PRESENT; i.dt = dt;
  i.lad = baseLight(S.loudRel, S.loudRange, S.loudAbs, NaN);   // NaN with the loud stage off (&loud=0): no ladder, no shift
  i.drop = S.dropLiveEvt || S.mapDropEvt ? 1 : 0; i.armed = S.buildLive > 0 ? 1 : 0;   // the build stage ran just before this one
  const o = SHIFTS.s.step(i);
  S.shiftEvt = !!o.shiftEvt; S.shiftHold = o.shiftHold;
}

ENGINE.addStage('shift', shiftStage, SHIFT_OUT);
