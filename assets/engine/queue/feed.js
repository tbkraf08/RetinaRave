// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// What the queue stage hands the queue each frame, from an MS-shaped object and the bars / build instances — pure, so
// features-queue.js (the page) and tools/build-node.js (node) build the SAME input. The time base is the bars stage's
// (DECISIONS §50): the RAW v3 clock (the stages run before the lead) moved onto heard time with the lead's estimate L,
// plus the display lead — `rel`, the position the bar store releases at (bars/feed.js), so an entry's time is when the
// eye should see it. The bar phase is the build detector's (what dropLiveIn counts to; the bars store keeps the same
// one by the same rule — v3's count, or synapse's sure anchor held 8 beats), never a third line.
import { QUEUE } from './queue.js';

// the MS fields feed() reads (a replay's input trace must carry them; the steps come from the store itself)
export const FEED_IN = ['beatCount', 'beatPhase', 'bpm', 'presence', 'heardT', 'buildLive', 'dropLiveIn'];

// S: the RAW clocks + the build fields; L: heardT - the analysers' newest audio time (s); disp: the display lead (s);
// dt: the frame interval (s); bars: the Bars instance (or null); bld: the Build instance (or null). `into` is reused.
export function feed(S, L, disp, dt, bars, bld, into) {
  const bps = S.bpm / 60, raw = S.beatCount + S.beatPhase, B = raw + L * bps, rel = B + disp * bps;
  const steps = into.steps || (into.steps = []);
  steps.length = 0;
  if (bars) bars.upcoming(rel - bars.a, steps);
  into.T = S.heardT; into.rel = rel; into.bpm = S.bpm; into.ok = S.presence >= QUEUE.PRESENT; into.dt = dt;
  into.a = bld ? bld.a : bars ? bars.a : 0;
  into.armed = S.dropLiveIn >= 0 && S.buildLive > 0; into.dropConf = +S.buildLive || 0;
  return into;
}
