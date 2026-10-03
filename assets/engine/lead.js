// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// THE LEAD (live step 2, 2026-09-28; docs/AUDIT-live-grid.md). The v3 clock (beatPhase / beat / beatCount) and the synapse
// grid (beatSyn / barPos / barPhase / phrasePos / phrase16Pos / bar) lock to the audio the ANALYSERS see, and the listener
// hears different audio: in a real-time file or the demo the analysers are the output latency AHEAD of the ear (measured:
// the clocks read 47 ms early), in capture they are the capture lag BEHIND it (27 ms here; the clocks read 14 ms late).
// With LEAD.on the published clocks are moved by
//     lead = (heardT − the analysis time) + LEAD.disp          (s; + = run ahead)
// at each clock's own tempo, so a scene's beat line lands on the beat that is HEARD. The clocks' own state is never moved:
// apply() saves the raw values and restore() (ENGINE.frame, before the extractor runs) puts them back, so the v3 PLL, the
// tempo comb, fake.js and every stage before this one see exactly what they saw before.
// ON by default since v0.16 (the user watched it in stream mode, 2026-09-28: "looks good"). The fake timeline never gets a
// lead, so parity fake and every scene-md5 line are unchanged; real-audio runs move (a det file trace by -DET_LEAD).
// OFF (&lead=0 or the L key) = apply() returns before touching MS: every value is what v0.15 published.
// &disp=<ms> sets the display lead: the frame's path to the glass (compositor + display), unmeasured — 40 ms by default since
// 2026-09-29 in the FILE modes and the demo, set by the user's eye (DECISIONS §52); 0 in capture / mic (the same day, the user's
// stream-mode A/B: &disp=0 "looks better", §53). An explicit &disp= sets both; &disp=0 is v0.16's timing everywhere.
import { AU } from './audio.js';
import { DET_LEAD } from './sources/file.js';

export const CAP_LAG = 0.027;   // s: tab capture's lag measured on the dev desktop (tools/caplag.js clicks, 2026-09-28) — the
                                // capture lead when no &sync is declared; &sync=<ms> (AU.sync) replaces it
const MAX_LEAD = 0.15;          // s: the largest |audio lead| taken as one (outputLatency is 0.02-0.05, capture 0.03)
const STALE_MS = 50;            // ms: an output timestamp older than this is not extrapolated from
const RING = 64;                // samples in the median (~1 s at 60 fps; ctxHeard jitters a few ms frame to frame)
const KEYS = ['beatPhase', 'beat', 'beatCount', 'beatSyn', 'barPos', 'barPhase', 'phrasePos', 'phrase16Pos', 'bar'];

export const LEAD = {
  on: true,       // v0.16 default; &lead=0 / the L key turn it off
  disp: 0.040,    // s, added to the audio lead: the frame's path to the glass (2026-09-29, the user's eye: &disp=40 and &lead=0 —
                  // v0.15's clocks ran ~43-47 ms ahead in file mode — both looked right, the lead alone did not); &disp=0 = v0.16
  dispLive: 0,    // s, the display lead in capture / mic (2026-09-29, the user's stream-mode A/B: 0 "looks better" than 40; §53)
  L: null,        // s, the audio lead: the median of `ring` (null until the first good sample); estimated even when off
  ring: [],
  raw: null,      // the clocks' own values this frame, put back by restore()
  n: null,        // the moved v3 clock's last whole beat (it never steps back, so no beat fires twice)
};

// heardT − the time of the newest audio the analysers have seen, per source (the structure of AU.heardT()).
function audioLead() {
  const F = AU.file, c = AU.ctx;
  if (AU.mode === 'file' && F) return F.det ? -DET_LEAD : (c && F.frame0 >= 0 ? ctxLead(c) : NaN);
  if (!c || AU.mode === 'none') return NaN;
  if (AU.mode === 'capture') return AU.sync || CAP_LAG;
  if (AU.mode === 'mic') return AU.sync;                 // the acoustic path is unmeasured: only a declared &sync
  return ctxLead(c);                                     // the demo synths: heard = the output timestamp
}

// AU.ctxHeard() − currentTime, or NaN when the output timestamp is stale: right after a context starts its performanceTime
// can trail performance.now() by 250 ms and the extrapolation then reads +0.24 s (the demo from file://, 4 runs in 6).
function ctxLead(c) {
  const ts = c.getOutputTimestamp ? c.getOutputTimestamp() : null;
  if (ts && Number.isFinite(ts.performanceTime) && performance.now() - ts.performanceTime > STALE_MS) return NaN;
  return AU.ctxHeard() - c.currentTime;
}

// the median of the last RING accepted samples: one bad sample can neither seed nor drag it (an EMA seeded on +0.24 s
// still read +0.04 s three seconds later)
function median(v) {
  const r = LEAD.ring;
  r.push(v);
  if (r.length > RING) r.shift();
  const s = r.slice().sort((x, y) => x - y), m = s.length >> 1;
  return s.length & 1 ? s[m] : 0.5 * (s[m - 1] + s[m]);
}

// the display lead this frame: 0 with the lead off, LEAD.dispLive on a live source (capture / mic), else LEAD.disp
export function dispNow() {
  if (!LEAD.on) return 0;
  return AU.mode === 'capture' || AU.mode === 'mic' ? LEAD.dispLive : LEAD.disp;
}

export function restore(S) {
  const r = LEAD.raw;
  if (!r) return;
  for (let i = 0; i < KEYS.length; i++) S[KEYS[i]] = r[KEYS[i]];
  LEAD.raw = null;
}

export function apply(dt, S, fakeOn) {
  if (fakeOn) { S.leadT = 0; LEAD.n = null; return; }
  // the estimate runs whether or not the clocks are moved (live step 3: the bars stage places onsets and releases its
  // predictions on heard time with it even under &lead=0); OFF still publishes nothing — leadT 0, the clocks raw
  const a = audioLead();
  const ok = isFinite(a) && Math.abs(a) < MAX_LEAD;     // anything else is not a latency (a stale timestamp, a stall)
  if (ok) LEAD.L = median(a);
  if (!LEAD.on || LEAD.L === null) { S.leadT = 0; LEAD.n = null; return; }
  const L = LEAD.L + dispNow();
  S.leadT = L;
  const r = LEAD.raw = {};
  for (let i = 0; i < KEYS.length; i++) r[KEYS[i]] = S[KEYS[i]];
  // v3: the continuous beat count, moved L seconds at the clock's tempo; `beat` fires when the MOVED clock crosses a line
  const B = r.beatCount + r.beatPhase + L * S.bpm / 60, n = Math.floor(B);
  if (LEAD.n === null) LEAD.n = n;
  if (n >= LEAD.n) { S.beat = n > LEAD.n; S.beatCount = n; S.beatPhase = B - n; LEAD.n = n; }
  else { S.beat = false; S.beatCount = LEAD.n; S.beatPhase = 0; }   // a PLL pull back across a line: hold on the line
  // synapse: the same move at its own tempo; the positions wrap, the bar number carries
  const d = S.bpmSyn > 0 ? L * S.bpmSyn / 60 : 0;
  if (d) {
    const w = (x, m) => ((x % m) + m) % m, bp = r.barPos + d;
    S.beatSyn = r.beatSyn + d;
    S.bar = r.bar + Math.floor(bp / 4);
    S.barPos = w(bp, 4); S.barPhase = S.barPos / 4;
    S.phrasePos = w(r.phrasePos + d, 32); S.phrase16Pos = w(r.phrase16Pos + d, 16);
  }
}
