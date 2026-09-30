// THE PREDICTED-EVENT QUEUE (live step 5, 2026-09-29; docs/AUDIT-live-grid.md "Step 5", DECISIONS §55). Pure: no DOM, no
// clock — node-testable (tools/test_queue.js, tools/build-node.js), fed once per frame by features-queue.js. Additive: new
// fields only, nothing existing moves, no scene reads them by default.
//
// ONE ordered list of the events the engine expects next, each { cls, t, conf } with t in HEARD seconds net of the
// display lead (t is when the eye should see it), rebuilt every frame from what the other stages already decided — it
// predicts nothing itself:
//   beat   the lead-moved v3 clock's next lines (at least NBEAT, every one inside the horizon)              conf 1
//   bar    the bar lines of the bar phase the build detector counts to (v3's count, or synapse's sure anchor)  conf 1
//   kick / snare / hat   the bar store's upcoming steps (Bars.upcoming: the decided ones waiting for their class offset and
//          the predicted ones of this bar and the next — the same steps it will release as predKickEvt …)   conf predConf
//   drop   while buildLive is armed, the bar line dropLiveIn points at                                        conf buildLive
// An entry whose time passes is dropped (the hit itself is the reactive / predicted event's); an entry the store's
// re-vote withdraws is gone the next frame UNLESS it was already inside HOLD s (measured on the node loop, four tracks:
// the store's withdrawals are its confidence gate flickering between 16ths — 87 of SeeYouDrop's 97 kick withdrawals
// emptied the list — and 56-76 % of the withdrawn entries pointed at a real onset; HOLD 0.25 = WIND cuts the jump rate
// 2.4-7x with F up 0.02-0.06, 0.5 costs precision — AUDIT-live-grid Step 5); and a seek, silence or a tempo jump
// flushes everything. The horizon (HORIZON beats) bounds the list, not the reach of
// the sources. MS gets numbers only: next<Cls>In (s to the next entry of that class, -1 when none inside the horizon),
// next<Cls>Conf (0..1) and next<Cls>Up (a wind-up 0 -> 1 over the last WIND s before the hit: the route-friendly form —
// a raw count-down whose "none" is -1 clamps to the TOP under a negative slope, clamp01(-4·-1 + 1) = 1) for the three
// hit classes, and queueN; the list itself is ENGINE.QUEUE.list (CARD.QUEUE) for the harness and the help view.
export const QUEUE = {
  HORIZON: 8,     // beats: the reach of the list (2 bars); an entry further out is not listed
  NBEAT: 4,       // beat lines listed at least (inside the horizon there are HORIZON of them)
  WIND: 0.25,     // s: next<Cls>Up rises 0 -> 1 over the last WIND s before the predicted hit
  HOLD: 0.25,     // s: a hit entry already closer than this is kept for its time when the store withdraws it (0 = off)
  PRESENT: 0.2,   // presence below this is silence: the list is empty (the bars store's own gate)
};
export const CLS = ['kick', 'snare', 'hat'];
const IN = ['nextKickIn', 'nextSnareIn', 'nextHatIn'], CONF = ['nextKickConf', 'nextSnareConf', 'nextHatConf'], UP = ['nextKickUp', 'nextSnareUp', 'nextHatUp'];
export const QUEUE_OUT = ['nextBeatIn', 'nextBarIn', ...IN, 'nextDropIn', ...CONF, ...UP, 'queueN'];
const TEMPO_JUMP = 0.04, MATCH = 1 / 32;   // a held entry matches a new one of its class within MATCH beat

export class Queue {
  constructor(k = QUEUE) {
    this.k = k;
    this.list = [];                 // this frame's entries, by t
    this.held = [];                 // last frame's hit entries (HOLD)
    this.pRel = null; this.pBpm = 0;
    this.out = {};
    this.none();
  }

  none() {
    const o = this.out;
    o.nextBeatIn = o.nextBarIn = o.nextDropIn = -1;
    for (let c = 0; c < 3; c++) { o[IN[c]] = -1; o[CONF[c]] = 0; o[UP[c]] = 0; }
    o.queueN = 0;
  }

  flush() { this.list.length = 0; this.held.length = 0; this.none(); }

  // one frame. i = { T, rel, bpm, ok, a, steps: [{ c, dy, conf }], armed, dropConf, dt }:
  //   T  heard time now (s) · rel  the grid position at the eye (the heard v3 beat + the display lead, beats) · bpm
  //   ok  music present · a  the bar phase 0..3 · steps  the bar store's upcoming hits (dy: beats ahead of rel)
  //   armed  the build detector is armed · dropConf  buildLive · dt  the frame interval (s)
  step(i) {
    const k = this.k, rel = i.rel, T = i.T;
    if (!(i.bpm > 0) || !i.ok || !isFinite(rel) || !isFinite(T)) { this.flush(); this.pRel = null; return this.out; }
    if (this.pRel !== null && (rel < this.pRel - 0.5 || rel > this.pRel + 2 || Math.abs(i.bpm / this.pBpm - 1) > TEMPO_JUMP)) this.flush();
    this.pRel = rel; this.pBpm = i.bpm;
    const bps = i.bpm / 60, L = this.list, H = k.HORIZON;
    L.length = 0;
    // beat lines strictly ahead of rel: at least NBEAT, every one inside the horizon
    const b0 = Math.floor(rel) + 1;
    for (let n = 0; n < Math.max(k.NBEAT, H); n++) { const dy = b0 + n - rel; if (n >= k.NBEAT && dy > H) break; L.push({ cls: 'beat', t: T + dy / bps, conf: 1 }); }
    // bar lines 4m + a strictly ahead of rel
    const a = i.a || 0, m0 = Math.floor((rel - a) / 4) + 1;
    let bar0 = null;
    for (let n = 0; n < 64; n++) {   // the first line always (the drop counts to it), the rest inside the horizon
      const dy = a + 4 * (m0 + n) - rel;
      if (n > 0 && dy > H) break;
      const e = { cls: 'bar', t: T + dy / bps, conf: 1 };
      if (!bar0) bar0 = e;
      L.push(e);
    }
    // the store's hits inside the horizon
    const hits = [];
    for (const s of i.steps) if (s.dy > 0 && s.dy <= H) hits.push({ cls: CLS[s.c], t: T + s.dy / bps, conf: s.conf });
    // HOLD: a hit already inside HOLD s that the store withdrew this frame stays for its time
    if (k.HOLD > 0) {
      for (const h of this.held) {
        if (h.t <= T || h.t - T > k.HOLD) continue;
        let seen = false;
        for (const e of hits) if (e.cls === h.cls && Math.abs(e.t - h.t) * bps <= MATCH) { seen = true; break; }
        if (!seen) hits.push(h);
      }
    }
    this.held = hits;
    for (const e of hits) L.push(e);
    // the drop: the bar line the detector counts to, while armed
    if (i.armed && bar0) L.push({ cls: 'drop', t: bar0.t, conf: i.dropConf });
    L.sort((x, y) => x.t - y.t);
    // the fields: the first entry of each class
    const o = this.out;
    this.none();
    for (const e of L) {
      const dy = e.t - T;
      if (e.cls === 'beat') { if (o.nextBeatIn < 0) o.nextBeatIn = dy; }
      else if (e.cls === 'bar') { if (o.nextBarIn < 0) o.nextBarIn = dy; }
      else if (e.cls === 'drop') { if (o.nextDropIn < 0) o.nextDropIn = dy; }
      else {
        const c = CLS.indexOf(e.cls);
        if (o[IN[c]] < 0) { o[IN[c]] = dy; o[CONF[c]] = e.conf; o[UP[c]] = k.WIND > 0 ? Math.max(0, Math.min(1, 1 - dy / k.WIND)) : 1; }
      }
    }
    o.queueN = L.length;
    return o;
  }
}
