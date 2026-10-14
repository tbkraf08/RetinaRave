// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// §131 THE EARS' PRODUCER SIDE, over a port: one `Ears` fed blocks, publishing the history frames its own `snap` wrote and
// the onsets its own detectors found. Pure protocol — no DOM, no `self`, no clock — so it runs in the Worker (ears/worker.js),
// in node (tools/test_earsw.js drives it in-process and compares the two transports hop for hop) and nowhere else.
//
// THE MESSAGES. In: `init` (a new stream: sample rate, the `Ears` options, a generation number) · `b` (one block: L, R, its
// stamp, the vocal-skip flag and the clock's line STATE, both read per block exactly as features-ears.js reads them in this
// thread) · `beat` (the pulse's beat length, as the stage sets it per frame). Out: `ready` once · `f` per block — the frames
// (`t` Float64Array, `v` Float32Array of nf × CONT.length in the ring's own field order), the onsets, the §90 line
// corrections, this block's DSP ms, and the two block buffers handed BACK so the host can post the next block in them.
//
// WHY THE FRAMES AND NOT `read(t)`: the reader is causal and interpolates between the two frames bracketing heard time
// (ears.js), so a `read` over a port would have to wait a round trip inside the frame — a stall of exactly the kind this
// move exists to remove. The frames are what the ring holds; the host writes them into the SAME ring (`pushFrame`) and reads
// at heard time on its own thread, with the release rule and the interpolation unchanged.
import { Ears, CONT, HIST } from './ears.js';
import { PERCK } from './perc.js';   // §131: the kick lane's harness knobs (&kline= / &clickw=) live in this module's own copy over here — `init` carries them

export const NF = CONT.length;        // continuous fields per history frame (23 at §131)
const WATCH = 0.3;                    // s: how long an emitted onset is watched for a §90 line correction (clickW is 25 ms)

export class EarsCore {
  // sink(msg, transfer): `self.postMessage` in the Worker, a function straight into the host in node.
  constructor(sink) {
    this.sink = sink;
    this.ears = null;
    this.gen = -1;
    this.hi0 = 0;                     // the ring index the last post ended at
    this.line = null;                 // the clock's state as of the previous block (host.js ships it; §90)
    this.lined = false;               // the hook is installed on the first block that carries a state
    this.watch = [];                  // { e, n, line } for onsets young enough to still be corrected
    this.n = 0;                       // the onset id the host corrects by
  }

  handle(m) {
    if (m.k === 'init') {
      this.gen = m.gen;
      if (m.PERCK) Object.assign(PERCK, m.PERCK);   // the page's &kline= / &clickw= (set before the first block; a live change lands on the next stream)
      this.ears = new Ears(m.sr, m.opts || {});
      this.hi0 = 0; this.line = null; this.lined = false; this.watch.length = 0;
      return;
    }
    if (!this.ears || m.gen !== this.gen) { if (m.k === 'b') this.sink({ k: 'f', gen: m.gen, nf: 0, t: null, v: null, ev: [], fix: [], ms: 0, L: m.L, R: m.R }, bufs(m)); return; }
    if (m.k === 'beat') { if (this.ears.pulse.setBeat) this.ears.pulse.setBeat(m.b); return; }
    if (m.k === 'b') this.block(m);
  }

  // §90: the clock's line predicted to audio time t — `Clock.at`'s arithmetic on the state the host shipped with this block
  // (b + f·(t − t_state), the phase its fractional part, the confidence as it stood), which is the state this thread's ears
  // read through `lineHook` when both ran here (the clock pushes AFTER the ears in the PCM bus's listener order).
  lineAt(t, o) {
    const s = this.line;
    const b = s && s.t === s.t ? s.b + s.f * (t - s.t) : (s ? s.b : 0);
    o.phase = b - Math.floor(b); o.conf = s ? s.conf : 0;
    return o;
  }

  block(m) {
    const E = this.ears, t1 = typeof performance === 'undefined' ? 0 : performance.now();
    if (m.line) {
      this.line = m.line;
      if (!this.lined) { this.lined = true; const o = { phase: 0, conf: 0 }; E.setLine((t) => this.lineAt(t, o)); }
    }
    E.setVoxSkip(!!m.skip);
    E.push(m.L, m.R || null, m.t0);
    // the frames this block wrote, in the ring's order
    let nf = (E.hi - this.hi0 + HIST) % HIST;
    if (nf > HIST - 1) nf = HIST - 1;
    const t = new Float64Array(nf), v = new Float32Array(nf * NF);
    for (let k = 0; k < nf; k++) {
      const i = (this.hi0 + k) % HIST;
      t[k] = E.ht[i];
      for (let j = 0; j < NF; j++) v[k * NF + j] = E.hv[j][i];
    }
    this.hi0 = E.hi;
    // the onsets, drained (nothing reads them in this thread: the host's reader releases them) and given an id
    const ev = [];
    for (const e of E.pending) ev.push(this.ship(e));
    for (const e of E.pendLow) ev.push(this.ship(e));
    E.pending.length = 0; E.pendLow.length = 0;
    // §90: a kick emitted on the clock's line has its flag dropped later, in place, when the beater arrives (perc.js) — the
    // clock stage reads that flag, so the change has to cross too. Only the flag can change, and only for WATCH seconds.
    const fix = [];
    const w = this.watch;
    let k = 0;
    for (let i = 0; i < w.length; i++) {
      const x = w[i];
      if (x.e.line !== x.line) { x.line = x.e.line; fix.push({ n: x.n, line: !!x.e.line }); }
      if (E.tEnd - x.e.t <= WATCH) w[k++] = x;
    }
    w.length = k;
    const ms = typeof performance === 'undefined' ? 0 : performance.now() - t1;
    this.sink({ k: 'f', gen: this.gen, nf, t, v, ev, fix, ms, L: m.L, R: m.R }, [t.buffer, v.buffer, ...bufs(m)]);
  }

  ship(e) {
    const n = this.n++;
    const o = { n, type: e.type, t: e.t, vel: e.vel };
    if (e.amp !== undefined) o.amp = e.amp;
    if (e.fl !== undefined) o.fl = e.fl;
    if (e.note !== undefined) o.note = e.note;
    if (e.line !== undefined) { o.line = e.line; this.watch.push({ e, n, line: e.line }); }
    return o;
  }
}

// the block's buffers, handed back to the host's pool (an empty list when the host sent none)
function bufs(m) {
  const b = [];
  if (m.L && m.L.buffer && m.L.buffer.byteLength) b.push(m.L.buffer);
  if (m.R && m.R.buffer && m.R.buffer.byteLength) b.push(m.R.buffer);
  return b;
}
