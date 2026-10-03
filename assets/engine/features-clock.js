// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// THE PCM CLOCK STAGE (live step 6, 2026-09-30; engine/clock/clock.js, docs/AUDIT-live-grid.md "Step 6", DECISIONS §56): the
// beat clock estimated on the PCM bus — the ears' sample-timed onsets as its ticks, tempo.js's comb on a per-hop spectral
// flux as its tempo and lattice, a Kalman filter on (beat position, rate) — published beside v3's under its own names:
//   bpmPcm · beatPhasePcm · beatCountPcm · beatPcm (event) · clockConfPcm · clockPcm (1 while the switch below is on)
// evaluated at the same time the lead publishes v3's clock (heard time + the display lead; the raw analysis time under
// &lead=0 — the same rule, so the two beat lines are comparable frame for frame). Additive: no scene reads them by default.
// THE SWITCH (`&clock=pcm` under #test, `CARD.setClock('pcm' | 'v3')` live, ENGINE.CLOCK.src): with it on, this stage —
// which runs after 'ears' and BEFORE bars / drums / build / queue and the lead — writes the PCM clock's RAW values (at the
// analysers' time, heardT − LEAD.L) into bpm / beatPhase / beat / beatCount, so every stage after it and every scene rides
// the PCM clock through the lead exactly as they ride v3's; v3's own values are saved and put back by restore() at the top
// of the next frame (engine.js, beside the lead's), so the PLL and the tempo comb never see the swap. Default 'v3'.
// The work: the PCM listener (outside frame(); the cost is drained into ENGINE.ms like the ears') runs the clock's FFT per
// 512-sample hop and hands it the ears' new percussion onsets; a new Ears (a new stream, a seek) starts a new Clock.
import { AU } from './audio.js';
import { ENGINE } from './engine.js';
import { PCM } from './pcm.js';
import { LEAD, dispNow } from './lead.js';
import { EARS } from './features-ears.js';
import { Clock, CLOCK } from './clock/clock.js';
import { Tongues, TONGUEK } from './clock/tongues.js';   // §76: a new Clock gets its tongue bank here, so page = node from the first hop (features-tongues.js publishes)

export const CLOCK_OUT = ['bpmPcm', 'beatPhasePcm', 'beatCountPcm', 'beatPcm', 'clockConfPcm', 'clockPcm'];
const KEYS = ['bpm', 'beatPhase', 'beat', 'beatCount'];
const CLS = { kick: 0, snare: 1, hat: 2 };
const RING = 64;               // frames in the heardT − now median (~1 s at 60 fps; lead.js uses the same length)
const SEEK = 0.1;              // s: an offset this far from the median is a seek / a new stream, not jitter

export const CLOCKS = {
  src: 'pcm',           // 'v3' | 'pcm': which clock bpm / beatPhase / beat / beatCount publish (pcm by default since 2026-09-30, §56)
  clk: null, E: null, subscribed: false, cpu: 0, cpuTotal: 0, blocks: 0, mono: new Float32Array(PCM.BLOCK),   // cpu: ms since the last frame drained it; cpuTotal: since the start (the cost ruler: cpuTotal / ENGINE.frameN)
  seen: [-1, -1, -1],   // the newest onset time handed over per class (the ears keep an onset pending until its release)
  pub: { n: null },     // the published PCM count's memory (it never steps back: a beat fires once; clock.js read())
  rawSt: { n: null },   // the swapped-in raw count's
  k: null,              // the swapped-in count's whole-beat offset onto v3's count (set at lock / at the flip; below)
  raw: null,            // v3's own bpm / beatPhase / beat / beatCount this frame, put back by restore()
  ev: {},
  ring: [], off: 0,     // (heardT − now) samples and their median: the smoothed heard time (below)
  K: CLOCK,             // the knobs (tools / the console)
};
ENGINE.CLOCK = CLOCKS;

function onBlock(L, R, t0) {
  if (ENGINE.fakeOn || !AU.ctx) return;
  if (t0 < 0) return;
  const c0 = performance.now();
  const E = EARS.ears;
  if (!CLOCKS.clk || E !== CLOCKS.E) { CLOCKS.clk = new Clock(AU.ctx.sampleRate); if (TONGUEK.on) CLOCKS.clk.tongues = new Tongues(TONGUEK); CLOCKS.E = E; CLOCKS.seen = [-1, -1, -1]; CLOCKS.pub.n = null; CLOCKS.rawSt.n = null; CLOCKS.k = null; }
  const m = CLOCKS.mono, n = L.length;
  for (let i = 0; i < n; i++) m[i] = 0.5 * (L[i] + R[i]);
  CLOCKS.clk.push(n === m.length ? m : m.subarray(0, n), t0);
  if (E) {
    const p = E.pending, seen = CLOCKS.seen;
    for (let i = 0; i < p.length; i++) { const e = p[i], c = CLS[e.type]; if (c !== undefined && e.t > seen[c]) { seen[c] = e.t; CLOCKS.clk.onset(e.t, c, e.vel); } }
  }
  CLOCKS.blocks++;
  const ms = performance.now() - c0;
  CLOCKS.cpu += ms; CLOCKS.cpuTotal += ms;
}

// v3's own clock back before the extractor integrates it (engine.js frame(), beside the lead's restore)
export function restore(S) {
  const r = CLOCKS.raw;
  if (!r) return;
  for (let i = 0; i < KEYS.length; i++) S[KEYS[i]] = r[KEYS[i]];
  CLOCKS.raw = null;
}

export function setClock(src) {
  if (src !== 'v3' && src !== 'pcm') throw new Error('setClock: v3 | pcm');
  CLOCKS.src = src;
  return src;
}

export function clockStage(dt, now, S) {
  S.beatPcm = false;
  if (ENGINE.fakeOn || !AU.ctx || AU.mode === 'none') { S.clockPcm = 0; return; }
  if (!CLOCKS.subscribed) { CLOCKS.subscribed = true; PCM.on(onBlock); }
  ENGINE.extraMs += CLOCKS.cpu; CLOCKS.cpu = 0;
  const C = CLOCKS.clk;
  if (!C) { S.clockPcm = 0; return; }
  const ev = CLOCKS.ev;
  // THE PUBLISH TIME is heard time SMOOTHED onto the frame clock: heardT advances in whole render blocks in the live modes (a
  // capture trace: 10.7 / 21.3 ms per 16.7 ms frame — the audible run of 2026-09-30 read the count-downs 'jumping' 1479 / min
  // where v3, integrated on the frame's dt, read 3), so the clock is evaluated at `now` + the median of (heardT − now) over the
  // last RING frames (lead.js's own device): the same beat position on average, advancing evenly per frame on the glass. In
  // det mode heardT − now is a constant and this is heardT itself. A jump of the offset (a seek, a new stream) re-seats it.
  const off = S.heardT - now, rg = CLOCKS.ring;
  if (rg.length && Math.abs(off - CLOCKS.off) > SEEK) rg.length = 0;
  rg.push(off); if (rg.length > RING) rg.shift();
  const sorted = rg.slice().sort((a, b) => a - b), m = sorted.length >> 1;
  CLOCKS.off = sorted.length & 1 ? sorted[m] : 0.5 * (sorted[m - 1] + sorted[m]);
  const T = now + CLOCKS.off;
  // the additive fields: at heard time + the display lead with the lead on, else at the analysers' time (v3's raw base)
  const tPub = LEAD.on && LEAD.L !== null ? T + dispNow() : LEAD.L !== null ? T - LEAD.L : C.t;
  C.read(tPub, CLOCKS.pub, ev);
  S.bpmPcm = ev.bpm; S.beatPhasePcm = ev.phase; S.beatCountPcm = ev.count; S.beatPcm = ev.beat; S.clockConfPcm = C.conf;
  S.clockPcm = CLOCKS.src === 'pcm' ? 1 : 0;
  if (CLOCKS.src !== 'pcm') { CLOCKS.rawSt.n = null; CLOCKS.k = null; return; }
  // the switch: the PCM clock's raw values (at the analysers' time) replace v3's for every stage after this one and the lead
  const r = CLOCKS.raw = {};
  for (let i = 0; i < KEYS.length; i++) r[KEYS[i]] = S[KEYS[i]];
  const tRaw = LEAD.L !== null ? T - LEAD.L : C.t;
  // THE COUNT OFFSET k (whole beats): set at the FLIP (the first frame the switch is on), so that the swapped-in count matches
  // v3's to within half a beat — the flip moves the beat LINE by the two clocks' difference and nothing else: no jump of
  // beatCount (phrase logic, hysteresis) and no jump of the bar phase the build / bars stages hold in count units (mod 4).
  // At the flip and never later: a count jump after the stages anchored their bar phase shifts that phase by the jump (measured:
  // k set at lock time, 7.6 s into SeeYouDrop, put the bar line 2 beats off for the next 50 s). A new Clock re-seats it.
  if (CLOCKS.k === null) { C.at(tRaw, ev); CLOCKS.k = Math.round(r.beatCount + r.beatPhase - ev.b); CLOCKS.rawSt.n = null; }
  C.read(tRaw, CLOCKS.rawSt, ev);
  const k = CLOCKS.k === null ? 0 : CLOCKS.k;
  S.bpm = ev.bpm; S.beatPhase = ev.phase; S.beatCount = ev.count + k; S.beat = ev.beat;
}

ENGINE.addStage('clock-pcm', clockStage, CLOCK_OUT);
ENGINE.restores.push(restore);
