// What the build stage hands the detector each frame, from an MS-shaped object and the ears' low-onset lane — pure, so
// features-build.js (the page) and tools/build-node.js (node) build the SAME input. The time base is the bars stage's
// (DECISIONS §50): the RAW v3 clock (the stages run before the lead) moved onto heard time with the lead's estimate L.
import { ANCHOR_CONF } from '../bars/feed.js';
import { BUILD } from './build.js';

// the MS fields feed() reads
export const FEED_IN = ['beatCount', 'beatPhase', 'bpm', 'presence', 'barConf', 'bpmSyn', 'barPos', 'hp', 'bassS', 'sub', 'subGate', 'tongueAmbig', 'tongueOn', 'heardT'];

// The ears' low onsets due by `due` (heard s) and after lane.t (the last one taken): the released ones and, when a display
// lead lets the release run ahead of the ear (file modes), the pending ones too. lane = { t: -Infinity } per stream.
export function laneTake(E, due, lane, out) {
  out.length = 0;
  if (!E) return out;
  let last = lane.t;
  const take = (l) => { for (const e of l) if (e.t > lane.t && e.t <= due) { out.push(e.t); if (e.t > last) last = e.t; } };
  take(E.lowReleased); take(E.pendLow);
  lane.t = last;
  out.sort((a, b) => a - b);
  return out;
}

// S: the RAW clocks + synapse's levels; L: heardT - the analysers' newest audio time (s); disp: the display lead (s);
// dt: the frame interval (s); ts: the low onsets' heard times (s) taken this frame. `into` is reused.
// `sg` is the ears' CAUSAL sub gate (the sub-void arm, §64): in file mode with the map ready `S.subGate` is the MAP's, and
// this stage must read the same inputs in every mode, so the page passes `EARS.ears.out.subGate` explicitly. Node and the
// replay leave it out: their `S.subGate` is already the causal read.
export function feed(S, L, disp, dt, ts, into, sg) {
  const bps = S.bpm / 60, raw = S.beatCount + S.beatPhase, B = raw + L * bps, T = S.heardT;
  const on = into.onsets || (into.onsets = []);
  on.length = 0;
  for (const t of ts) on.push({ x: B - (T - t) * bps });
  const sure = S.barConf >= ANCHOR_CONF && S.bpmSyn > 0 && Math.abs(S.bpmSyn / S.bpm - 1) < 0.02;
  into.B = B; into.rel = B + disp * bps; into.bpm = S.bpm; into.ok = S.presence >= BUILD.PRESENT; into.dt = dt;
  into.hp = +S.hp || 0; into.bassS = +S.bassS || 0; into.sub = +S.sub || 0;
  const g = sg === undefined || sg === null ? S.subGate : sg;
  into.subGate = g === undefined || g === null || !isFinite(+g) ? 1 : +g;
  // the tongues' tension (§77): absent or the stage off (-1) reads as "not ambiguous"
  into.tongueOn = S.tongueOn === 1 ? 1 : 0; into.tongueAmbig = +S.tongueAmbig || 0;
  into.anchor = sure ? ((Math.round(raw - S.barPos) % 4) + 4) % 4 : -1;
  return into;
}
