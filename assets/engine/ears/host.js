// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// §131 THE EARS' MAIN-THREAD SIDE: an `EarsReader` (ears/ears.js — the history ring, the release rule, `read(tHeard)`) whose
// ring is filled from the Worker's messages instead of from its own DSP. Everything the stages read off `EARS.ears` is here
// and unchanged — `read(t)`, `out`, `events`, `lowReleased` / `pendLow`, `pulse.setBeat`, `setVoxSkip` — so features-ears.js,
// features-clock.js, features-build.js, features-drums.js and build/feed.js cannot tell which thread the numbers came from.
// This is the only file in `engine/ears/` that touches the page (Worker, Blob, document): the facade and its DSP stay
// node-importable and DOM-free, which is the determinism contract (CONTRACTS).
//
// THE TRANSPORT. One Worker for the page, one GENERATION per stream: a new source or a seek builds a new `EarsHost` (the
// stages detect a new stream by object identity), which bumps the generation and re-inits the Worker's `Ears`; frames tagged
// with an older generation are dropped. Blocks go over as a pooled Float32Array pair, transferred out and handed back with
// the frames, so the steady state allocates nothing. The PCM bus still delivers every block to the main thread — the clock
// (features-clock.js) and the loudness stage (features-loud.js) are listeners too — so what leaves this thread is the ears'
// DSP, not the samples: a 4 KB copy and a `postMessage` stay behind (§131 measures them).
//
// WHAT DET MODE DOES: nothing. `features-ears.js` keeps the in-process `Ears` whenever the file source pushes the blocks
// itself (`PCM.local`), because the frames must be in the ring before the same frame reads them — so every md5 reference, the
// traces and the rulers run the path they always ran, and the Worker is for the live modes the user listens in (§130).
import { EarsReader, CONT } from './ears.js';
import { PERCK } from './perc.js';     // &kline= / &clickw= live in the Worker's own copy of perc.js — `init` carries them over
import { EARS_WORKER_SRC } from './wsrc.js';

const NF = CONT.length;
const FIX_KEEP = 64;                   // §90 line kicks kept addressable for a correction (the Worker watches each for 0.3 s)
export const EARSK = {
  worker: true,                        // &ears=main turns the Worker off for the whole page (the A/B, and any browser without module Workers)
  url: 'assets/engine/ears/worker.js', // the module page's path to the Worker (the single-file build uses EARS_WORKER_SRC instead)
  // §131 the test seam (tools/test_earsw.js): `make(onmessage)` returns a port built in-process — an `EarsCore` called
  // synchronously, the same protocol and the same ingestion with no thread, so node can compare the two transports hop for
  // hop. The page never sets it, and nothing in `engine/` reads it but `build()` below.
  make: null,
};

// the page's one ears Worker: built once, kept across streams, and never rebuilt after a failure (the in-process path takes over)
const W = { w: null, tried: false, ready: false, err: null, host: null };
let GEN = 0;                           // the stream generation: a new host bumps it, the Worker re-inits, older frames are dropped

export function earsWorkerUp() { return !!build(); }
export function earsWorkerState() { return { on: !!W.w, ready: W.ready, err: W.err }; }

// every message from the ears' thread: `ready` once, then one `f` per block for whichever host is current
function onMessage(m) {
  if (m.k === 'ready') { W.ready = true; return; }
  if (W.host) W.host.frames(m);
}

function build() {
  if (W.w || W.tried) return W.w;
  W.tried = true;
  try {
    if (EARSK.make) { W.w = EARSK.make(onMessage); W.ready = true; return W.w; }
    if (typeof Worker === 'undefined') throw new Error('no Worker');
    const w = EARS_WORKER_SRC
      ? new Worker(URL.createObjectURL(new Blob([EARS_WORKER_SRC], { type: 'text/javascript' })))
      : new Worker(new URL(EARSK.url, document.baseURI).href, { type: 'module' });
    w.onmessage = (e) => onMessage(e.data);
    w.onerror = (e) => {
      W.err = String((e && (e.message || e.filename)) || 'worker error');
      W.w = null;
      if (W.host) W.host.failed = true;   // the stage builds an in-process Ears on the next block
    };
    W.w = w;
  } catch (e) {
    W.err = String((e && e.message) || e);
    W.w = null;
  }
  return W.w;
}

// Build the Worker before the first block, so its script is parsed while the page is still starting (the stage calls this
// when it subscribes to the PCM bus). A failure here is not an error: `earsWorkerUp()` is false and the ears stay in-process.
export function primeEarsWorker() { if (EARSK.worker) build(); }

export class EarsHost extends EarsReader {
  constructor(sr, opts = {}) {
    super(opts);
    this.sr = sr;
    this.worker = true;                // the HUD's engine line reads this
    this.failed = false;
    this.blocks = 0;
    this.byId = new Map();             // id -> the event object, for the §90 line corrections (trimmed with `watch`'s window)
    this.ids = [];                     // the ids in that map, oldest first
    this.pool = [];                    // { L, R } pairs handed back by the Worker
    this.sent = [];                    // performance.now() per block in flight — the heard→feature lag
    this.lag = 0; this.lagMax = 0; this.lagN = 0; this.lagAcc = 0;
    this.wms = 0; this.wmsAcc = 0; this.wblocks = 0;   // the Worker's own DSP ms (accounting; it is NOT main-thread time)
    this.clk = null;                   // the PCM clock, read per block for §90's line state (features-clock.js hands it over)
    this.skip = false;
    this.gen = ++GEN;
    W.host = this;
    const w = build();
    if (!w) { this.failed = true; return; }
    w.postMessage({ k: 'init', gen: this.gen, sr, opts, PERCK: { lineKick: PERCK.lineKick, lineSub: PERCK.lineSub, clickW: PERCK.clickW } });
    this.pulse = { setBeat: (b) => { if (W.w) W.w.postMessage({ k: 'beat', gen: this.gen, b }); } };
  }

  // §90: the clock itself, not its hook — a function cannot cross a port, so the state (t, b, f, conf) rides every block and
  // the Worker evaluates `Clock.at`'s arithmetic on it (core.js `lineAt`). The state shipped is the one the in-process ears
  // would have read: the clock pushes after the ears in the bus's listener order, so both see the previous block's.
  setLine(hook, clk) { this.clk = clk || null; }

  setVoxSkip(on) { this.skip = !!on; }

  // §131: the PCM clock's ticks. The pending list, exactly as in this thread — an onset a read has already released was
  // offered to the clock in an earlier block and is not offered again. Over a port that leaves one structural difference:
  // an onset could be released before the clock's NEXT block read and never be offered at all. Measured, it cannot be —
  // in live mode heard time runs ~44 ms BEHIND the newest analysis frame (the capture / output buffering; `EARS.staleAcc`
  // reads −44 ms on a real-time file run), so a fresh onset sits ~4 blocks before it is due, and the clock reads every block.
  onsetFeed() { return this.pending; }

  push(L, R, t0) {
    const w = W.w;
    if (!w) { this.failed = true; return; }
    const n = L.length;
    let p = this.pool.pop();
    if (!p || p.L.length !== n) p = { L: new Float32Array(n), R: new Float32Array(n) };
    p.L.set(L);
    if (R) p.R.set(R);
    const c = this.clk;
    const line = c && c.t === c.t ? { t: c.t, b: c.b, f: c.f, conf: c.conf } : null;
    this.sent.push(performance.now());
    w.postMessage({ k: 'b', gen: this.gen, t0, skip: this.skip, line, L: p.L, R: R ? p.R : null },
      R ? [p.L.buffer, p.R.buffer] : [p.L.buffer]);
    this.blocks++;
  }

  // one `f` message: the frames into the ring, the onsets into the release lanes and the clock's feed, the corrections applied.
  frames(m) {
    if (m.L) this.pool.push({ L: m.L, R: m.R || new Float32Array(m.L.length) });
    const t0 = this.sent.shift();
    if (t0 !== undefined) {
      this.lag = performance.now() - t0;
      if (this.lag > this.lagMax) this.lagMax = this.lag;
      this.lagAcc += this.lag; this.lagN++;
    }
    if (m.gen !== this.gen) return;                       // a stale stream's block (a seek crossed it in flight)
    this.wms = m.ms; this.wmsAcc += m.ms; this.wblocks++;
    for (let k = 0; k < m.nf; k++) this.pushFrame(m.t[k], m.v, k * NF);
    const ev = m.ev;
    for (let i = 0; i < ev.length; i++) {
      const e = ev[i];
      this.pushEvent(e);
      if (e.line !== undefined) { this.byId.set(e.n, e); this.ids.push(e.n); }   // only a §90 line kick can still be corrected
    }
    const fix = m.fix;
    for (let i = 0; i < fix.length; i++) { const e = this.byId.get(fix[i].n); if (e) e.line = fix[i].line; }
    while (this.ids.length > FIX_KEEP) this.byId.delete(this.ids.shift());        // the Worker watches an onset for 0.3 s; this is ample
  }
}
