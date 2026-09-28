// What the bars stage hands the store each frame, from an MS-shaped object — pure, so features-bars.js (the page) and
// tools/bars-replay.js (a recorded trace, node) build the SAME input. See features-bars.js for the time base.
import { DIM } from './bars.js';

export const ANCHOR_CONF = 0.9;      // synapse's barConf above which its bar line is proposed as the bar phase
export const PRESENT = 0.2;          // presence below this is silence: no prediction
// the per-beat energy vector the store fingerprints (DIM of them, ~0..1 each; the densities are onsets/s over 8)
export const FEAT_NAMES = ['bassS', 'midS', 'highS', 'sub', 'lvl', 'centroid', 'bassReg', 'subGate', 'subPure', 'denK', 'denS', 'denH'];
const SCALE = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1 / 8, 1 / 8, 1 / 8];
const EVT = [['kickEvt', 'kickAge'], ['snareEvt', 'snareAge'], ['hatEvt', 'hatAge']];
// the MS fields feed() reads (the replay's input trace must carry them)
export const FEED_IN = ['beatCount', 'beatPhase', 'bpm', 'presence', 'barConf', 'bpmSyn', 'barPos', ...EVT.flat(), ...FEAT_NAMES];

// S: the RAW clocks (before the lead) + the ears' events; L: heardT - the analysers' newest audio time (s); disp: the
// release's display lead (s); dt: the measured frame interval (s). `into` is reused (onsets / feat arrays included).
export function feed(S, L, disp, dt, into) {
  const bps = S.bpm / 60, raw = S.beatCount + S.beatPhase, B = raw + L * bps;
  const on = into.onsets || (into.onsets = []), f = into.feat || (into.feat = new Float32Array(DIM));
  on.length = 0;
  for (let c = 0; c < 3; c++) if (S[EVT[c][0]]) on.push({ c, x: B - S[EVT[c][1]] * bps });
  for (let d = 0; d < DIM; d++) { const v = +S[FEAT_NAMES[d]]; f[d] = isFinite(v) ? v * SCALE[d] : 0; }
  const sure = S.barConf >= ANCHOR_CONF && S.bpmSyn > 0 && Math.abs(S.bpmSyn / S.bpm - 1) < 0.02;
  into.B = B; into.rel = B + disp * bps; into.bpm = S.bpm; into.ok = S.presence >= PRESENT;
  into.anchor = sure ? ((Math.round(raw - S.barPos) % 4) + 4) % 4 : -1;
  into.lead = bps > 0 ? Math.min(1 / 120, 0.5 * dt) * bps : 0;
  return into;
}
