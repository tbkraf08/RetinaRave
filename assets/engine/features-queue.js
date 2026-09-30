// THE QUEUE STAGE (live step 5, 2026-09-29; engine/queue/queue.js, docs/AUDIT-live-grid.md "Step 5", DECISIONS §55): one
// ordered list of the events the engine expects next — the beat lines, the bar lines, the bar store's upcoming hits, the
// drop the build detector counts to — on heard time net of the display lead, so a scene reads "what comes next" from one
// place instead of three. Additive: reads the raw v3 clock, the lead's estimate, the bars store and the build detector
// (their own instances, the same frame's state), writes only its own fields (numbers: next*In / next*Conf / next*Up /
// queueN); the list is ENGINE.QUEUE.list (CARD.QUEUE). Registered after 'build' (main.js import order), so it runs BEFORE
// the lead, on the raw clocks, like the bars and build stages (the time base: features-bars.js). No scene reads it by default.
import { AU } from './audio.js';
import { ENGINE } from './engine.js';
import { LEAD, dispNow } from './lead.js';
import { BARS } from './features-bars.js';
import { BUILDS } from './features-build.js';
import { Queue, QUEUE_OUT } from './queue/queue.js';
import { feed } from './queue/feed.js';

export const QUEUES = { q: null, src: null, inp: {}, get list() { return this.q ? this.q.list : []; } };
ENGINE.QUEUE = QUEUES;

export function queueStage(dt, now, S) {
  if (ENGINE.fakeOn || !AU.ctx || AU.mode === 'none') {
    if (QUEUES.q) QUEUES.q.flush();
    for (const k of QUEUE_OUT) S[k] = k === 'queueN' || k.endsWith('Conf') || k.endsWith('Up') ? 0 : -1;
    return;
  }
  const src = AU.mode + ':' + (AU.file ? AU.file.name + '@' + AU.file.at : '');
  if (!QUEUES.q || src !== QUEUES.src) { QUEUES.q = new Queue(); QUEUES.src = src; }
  const bars = BARS.src === src ? BARS.bars : null, bld = BUILDS.src === src ? BUILDS.b : null;
  const o = QUEUES.q.step(feed(S, LEAD.L === null ? 0 : LEAD.L, dispNow(), dt, bars, bld, QUEUES.inp));
  for (const k of QUEUE_OUT) S[k] = o[k];
}

ENGINE.addStage('queue', queueStage, QUEUE_OUT);
