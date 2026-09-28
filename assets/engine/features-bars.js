// THE BARS STAGE (live step 3, 2026-09-28): engine/bars/ (the bar fingerprint store) fed from MS once per frame, its
// predictions copied into MS under their own names (BARS_OUT). Additive: reads the v3 clock, synapse's bar line and the
// ears' onsets, writes only its own fields. Registered after 'ears', so it runs BEFORE the lead (engine.js frame()).
//
// THE TIME BASE (DECISIONS §50). Every stage before the lead sees the RAW clocks — v3's beatCount + beatPhase lock to the
// audio the analysers see — while the ears stamp onsets in heard time. So the stage moves the raw v3 beat onto heard time
// itself with the lead's own estimate (LEAD.L, heardT − the analysers' newest audio time, estimated even under &lead=0):
//     B = beatCount + beatPhase + LEAD.L · bpm / 60                      (the heard beat, what the lead publishes)
//     an onset's position = B − age · bpm / 60                           (age = kickAge / snareAge / hatAge, heard time)
// and releases a predicted step when B (+ &disp when the lead is on) crosses its line. One grid, one base: a wrong base
// would read as a constant ±27–43 ms on predcheck.py's lag row. The input is built by bars/feed.js (pure), which
// tools/bars-replay.js runs on a recorded trace too.
// The grid is v3's (tempo right 95.5 % of the SeeYouDrop det frames against synapse's 61.6 %, docs/AUDIT-live-grid.md);
// synapse only proposes the bar phase, when its bar line is sure (barConf >= ANCHOR_CONF, same octave as v3).
import { AU } from './audio.js';
import { ENGINE } from './engine.js';
import { LEAD } from './lead.js';
import { Bars, BARS_OUT } from './bars/bars.js';
import { feed } from './bars/feed.js';

export const BARS = { bars: null, src: null, dt: 1 / 60, inp: {} };

export function barsStage(dt, now, S) {
  S.predKickEvt = S.predSnareEvt = S.predHatEvt = S.barNovelEvt = S.barReturnEvt = false;
  if (ENGINE.fakeOn || !AU.ctx || AU.mode === 'none') return;
  const src = AU.mode + ':' + (AU.file ? AU.file.name + '@' + AU.file.at : '');
  if (!BARS.bars || src !== BARS.src) { BARS.bars = new Bars(); BARS.src = src; }
  if (dt > 0 && dt < 0.05) BARS.dt += (dt - BARS.dt) * 0.2;
  const o = BARS.bars.step(feed(S, LEAD.L === null ? 0 : LEAD.L, LEAD.on ? LEAD.disp : 0, BARS.dt, BARS.inp));
  S.predKickEvt = !!o.predKickEvt; S.predSnareEvt = !!o.predSnareEvt; S.predHatEvt = !!o.predHatEvt;
  S.predKickIn = o.predKickIn; S.predConf = o.predConf; S.barMatch = o.barMatch;
  S.barNovelEvt = !!o.barNovelEvt; S.barReturnEvt = !!o.barReturnEvt;
}

ENGINE.addStage('bars', barsStage, BARS_OUT);
