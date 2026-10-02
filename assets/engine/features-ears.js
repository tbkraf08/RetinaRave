// THE EARS STAGE (v0.15 E3 + E4): engine/ears/ (causal DSP on the PCM bus) and engine/map/ (the whole track, file mode)
// copied into MS under their own names, evaluated at heard time (MS.heardT, the clock stage). Additive: writes only
// EARS_FIELDS + the map fields, never another stage's. #test (the fake timeline) never runs it — the state.js defaults stand.
//   · the ears subscribe to the PCM bus lazily, the first frame a real source runs (no listener = no worklet under #test);
//     a new Ears is built when the block stamps jump (a new source, a seek), so no history crosses a discontinuity.
//   · the map is built once per decoded file, on the main thread, inside the file source's `gates` (the playhead waits for
//     it: det mode stays frame-exact, real-time mode starts playing after it — ~1.6 s for SeeYouDrop, DECISIONS §48).
import { AU } from './audio.js';
import { MS } from './state.js';
import { ENGINE } from './engine.js';
import { PCM } from './pcm.js';
// In FILE mode with the map ready, the percussion events and the sub fields come from the map's NON-CAUSAL channels
// instead of the causal ears: `map.onsets` is the truth tool's own STFT + separable-HPSS front end (kick F 1.000 against
// `onsets.click`, 0.0 % of kicks on a truth bare808, against the causal path's 0.53 / 8.6 %) and `map.sub` is its own
// CENTRED YIN (+-30 cents on 100.0 % of frames, median 1 cent). Everything else — subPure, the tonic, bassReg, lpSweep,
// width, pulse — and EVERY live mode stays causal, because nothing else in the map covers them.
// The release rule is the same in both paths: an event fires on the frame NEAREST its onset (`t <= heardT + lead`,
// `lead = min(1/120, half the frame interval)`), so `<x>Age` may be negative by up to `lead` on the release frame.
import { Ears, EARS_FIELDS, REL_LEAD, DT_MAX } from './ears/ears.js';
import { DEN_WIN } from './ears/perc.js';
import { buildMap, mapAt, mapCross, mapSubAt } from './map/map.js';
import { ModeShade } from './ears/shade.js';

// §62 — `key` / `mode` are the EARS' tonic once it has one. They are synapse's fields (features-synapse.js writes them
// from the Analyzer's own Krumhansl-Kessler), and this stage runs after synapse, so this is the same move the map
// already makes on the drums and the sub: a better detector of the SAME quantity wins. Measured against the truth
// grids over 20-100 s of all five tracks, the pitch class: synapse 1/5 right (SeeYouDrop G# for C#, CyborgNinja G#
// for C#, Malicious C for G, WhoLikesToParty B for D, Vienna D# right), the ears 3/5 and never worse on any track.
// `keyConf` deliberately stays synapse's `keyClar` — see the long note on KEY_FIELDS below.
export const JUMP = 0.05;            // s: a block stamp this far from the expected one starts a fresh Ears
// The two fields this stage takes over from synapse, and the rule: `MS.tonic >= 0` — the tracker has a read at all.
// The same rule CHLADNI already applies scene-side (scenes/chladni/index.js: `MS.tonic >= 0 ? MS.tonic : … MS.key`),
// which is now the engine's rule instead of one scene's.
const KEY_FIELDS = ['key', 'mode'];
// §82: `modeShade` — the chord quality of the bass's degree in that key, per bar (ears/shade.js). Written last, once the
// key (ears or synapse) and the sub (map or causal) are both final for the frame.
const SHADE_FIELDS = ['modeShade'];
const SHADE = new ModeShade();
const EVT = ['subNoteEvt', 'subIn', 'subOut', 'kickEvt', 'snareEvt', 'hatEvt'];
const MAP_FIELDS = ['mapOn', 'toDrop', 'toBoundary', 'buildProg', 'mapSection', 'mapNext', 'mapReturn', 'eG', 'mapDropEvt', 'mapBoundaryEvt'];
// the three percussion classes the map overrides, and the sub fields it overrides
// `amp` is §70's unsaturated size (`kickAmp` / `snareAmp`); the HAT has none (perc.js: the hat is still the flux
// lane, which has no rise in dB to publish), so its slot is null and `mapOverride` skips it.
const PCLS = [['kick', 'kickEvt', 'kickAge', 'kickVel', 'denK', 'kickAmp'], ['snare', 'snareEvt', 'snareAge', 'snareVel', 'denS', 'snareAmp'],
  ['hat', 'hatEvt', 'hatAge', 'hatVel', 'denH', null]];
const SUB_EVT = [['noteT', 'subNoteEvt', 'subNote'], ['inT', 'subIn', 'subIn'], ['outT', 'subOut', 'subOut']];

export const EARS = {
  ears: null, map: null, mapFile: null, next: -1, subscribed: false, lastT: -1, beat: 0, cpu: 0, blocks: 0,
  mapMs: 0, out: {}, sub: {},
  // the map-event release cursors: one index per percussion class and per sub event list, the last released time, and
  // the 1 s sliding history each `den*` counts. Reset by `resetRel()` on a new map or a backwards seek.
  oi: [0, 0, 0], last: [-9, -9, -9], vel: [0, 0, 0], hist: [[], [], []], si: [0, 0, 0],
  tRead: -1, dtRead: 1 / 60,
};
function resetRel() {
  EARS.oi = [0, 0, 0]; EARS.last = [-9, -9, -9]; EARS.vel = [0, 0, 0]; EARS.hist = [[], [], []]; EARS.si = [0, 0, 0];
  EARS.tRead = -1; EARS.dtRead = 1 / 60;
}

function onBlock(L, R, t0) {
  if (ENGINE.fakeOn || !AU.ctx) return;
  if (t0 < 0) return;                               // real-time file mode before the node started (pcm.js map → -1)
  const c0 = performance.now();                     // cost accounting only (ENGINE.ms), never a feature
  if (!EARS.ears || Math.abs(t0 - EARS.next) > JUMP) EARS.ears = new Ears(AU.ctx.sampleRate);
  EARS.ears.push(L, R, t0);
  EARS.next = t0 + L.length / AU.ctx.sampleRate;
  EARS.blocks++;
  EARS.cpu += performance.now() - c0;
}

// Called by sources/file.js (AU.onFile) when a file starts, before its decode: the playhead waits for this gate.
// ENGINE.useMap false (&map=0, live step 3.0): no map at all, so a file runs the causal ears exactly as capture does.
function armMap(F) {
  if (!ENGINE.useMap || !F || F === EARS.mapFile || !F.gates) return;
  EARS.mapFile = F;
  EARS.map = null;
  resetRel();
  F.gates.push(new Promise((res) => {
    const wait = () => {
      if (AU.file !== F) return res();
      if (!F.ready) return setTimeout(wait, 20);
      setTimeout(() => {                            // one macrotask later: the landing's message has painted
        const c0 = performance.now();
        try { EARS.map = buildMap(F.L, F.R, F.sr); } catch (e) { EARS.map = null; EARS.mapErr = String(e && e.message || e); }
        EARS.mapMs = performance.now() - c0;
        if (EARS.map) ENGINE.log('mapReady', 0, { ms: +EARS.mapMs.toFixed(1), drops: EARS.map.drops, sections: EARS.map.sections.length });
        res();
      }, 0);
    };
    wait();
  }));
}

export function earsStage(dt, now, S) {
  for (const k of EVT) S[k] = false;
  S.mapDropEvt = S.mapBoundaryEvt = false;
  if (ENGINE.fakeOn || !AU.ctx || AU.mode === 'none') return;
  if (!EARS.subscribed) { EARS.subscribed = true; PCM.on(onBlock); }
  ENGINE.extraMs += EARS.cpu; EARS.cpu = 0;         // the push work happens in the PCM listener, outside frame()
  const t = S.heardT, E = EARS.ears;
  // Decided BEFORE the causal read so only one path writes the event log: a map override logs the map's own events with
  // the same type names ('kick' / 'snare' / 'hat' / 'subNote' / 'subIn' / 'subOut'), so the log's vocabulary never changes
  // and nothing is stamped twice.
  const M = AU.mode === 'file' && AU.file === EARS.mapFile && EARS.map && EARS.map.sub && EARS.map.sub.n ? EARS.map : null;
  if (E) {
    if (S.bpm > 0 && E.pulse.setBeat) { const b = 60 / S.bpm; if (b !== EARS.beat) { EARS.beat = b; E.pulse.setBeat(b); } }
    const o = E.read(t);
    for (const k of EARS_FIELDS) S[k] = o[k];
    for (const k of EVT) S[k] = !!o[k];
    // §62: the key the scenes anchor their hue on is the tonic, not synapse's band-limited read of it.
    if (o.tonic >= 0) { S.key = o.tonic | 0; S.mode = o.tonicMinor | 0; }
    if (!M) for (const e of E.events) ENGINE.log(e.type, e.t, e.vel !== undefined ? { vel: +(+e.vel).toFixed(3) } : undefined);
  }
  if (M) {
    mapAt(M, t, EARS.out);
    for (const k of MAP_FIELDS) if (k in EARS.out) S[k] = EARS.out[k];
    // On the FIRST frame a map is active, start the crossing window just before 0 so the first section's own boundary
    // fires. `buildMap` forces `sections[0].t0` to 0 (the first bar line is 0.036 s, not 0) and no frame's half-open
    // (tPrev, t] can contain 0, so pass 1 never fired it and the in-page boundary ruler read 7 of 11 against a ceiling of
    // 11 — `compare.py --make-synth`, a trace built from the truth itself, DOES fire a boundary on frame 0, so grading
    // the page without one was comparing against a reference the page could not match.
    if (EARS.lastT < 0) EARS.lastT = -1e-9;
    if (t > EARS.lastT) {
      const x = mapCross(M, EARS.lastT, t);
      S.mapDropEvt = x.drop; S.mapBoundaryEvt = x.boundary;
      if (x.drop) ENGINE.log('mapDrop', t);
      if (x.boundary) ENGINE.log('mapBoundary', t);
    }
    if (t < EARS.lastT - 1e-9) resetRel();                         // a seek backwards: the cursors are stale
    EARS.lastT = t;
    mapOverride(M, t, S);
  } else if (S.mapOn) {
    S.mapOn = 0; S.toDrop = S.toBoundary = S.mapSection = S.mapNext = -1; S.buildProg = S.mapReturn = S.eG = 0;
  }
  S.modeShade = SHADE.step(dt, S);
}

// File mode: replace the causal percussion events / ages / velocities / densities and the sub's pitch and gate fields
// with the map's non-causal ones, released at heard time by the same rule the causal path uses.
function mapOverride(M, t, S) {
  if (!M.onsets || !M.sub || !M.sub.n) return;
  if (EARS.tRead >= 0) { const d = t - EARS.tRead; if (d > 0 && d <= DT_MAX) EARS.dtRead += (d - EARS.dtRead) * 0.2; }
  EARS.tRead = t;
  const rel = t + Math.min(REL_LEAD, 0.5 * EARS.dtRead);
  for (let c = 0; c < 3; c++) {
    const [cls, ev, age, vf, den, af] = PCLS[c], list = M.onsets[cls];
    let fired = false;
    while (EARS.oi[c] < list.length && list[EARS.oi[c]].t <= rel) {
      const e = list[EARS.oi[c]++];
      fired = true; EARS.last[c] = e.t; EARS.vel[c] = e.vel;
      EARS.hist[c].push(e.t);
      ENGINE.log(cls, e.t, { vel: e.vel });
    }
    const h = EARS.hist[c];
    while (h.length && t - h[0] > DEN_WIN) h.shift();
    S[ev] = fired;
    S[age] = EARS.last[c] === -9 ? 99 : t - EARS.last[c];      // may be negative by up to `lead` on the release frame
    S[vf] = EARS.vel[c];
    // §70: in FILE+map mode the hit's SIZE is the map's own velocity. That one is an OFFLINE numpy p95 over the
    // class's own peak fluxes (`map/onsets.js` VEL_P), so unlike the causal `*Vel` it does not saturate and needs no
    // second definition — `kickAmp` / `snareAmp` are the same number as `kickVel` / `snareVel` on this path, and the
    // honest size the causal path had to build is simply what the map already published.
    if (af) S[af] = EARS.vel[c];
    S[den] = h.length / DEN_WIN;
  }
  mapSubAt(M, t, EARS.sub);
  S.subHz = EARS.sub.hz; S.subCents = EARS.sub.cents; S.subNote = EARS.sub.note;
  S.subConf = EARS.sub.conf; S.subGate = EARS.sub.gate; S.subGlide = EARS.sub.glide;
  for (let i = 0; i < SUB_EVT.length; i++) {
    const [key, fld, lg] = SUB_EVT[i], list = M.sub[key];
    let fired = false;
    while (EARS.si[i] < list.length && list[EARS.si[i]] <= rel) { const v = list[EARS.si[i]++]; fired = true; ENGINE.log(lg, v); }
    S[fld] = fired;
  }
}

AU.onFile.push(armMap);
// `KEY_FIELDS` is declared here so the stage's feat list states what it writes; `key` / `mode` keep synapse's FEATS
// entries, because the quantity has not changed — only which detector answers for it.
//
// WHY `keyConf` IS NOT IN THAT LIST. Its documented formula is `clamp01((best r - .35)/.45)`, the winning KK
// correlation on synapse's chroma. The same formula on the EARS' chroma was built and measured over 20-100 s of the
// five tracks — p50 0.548 (SeeYouDrop) / 0.648 / 0.767 / 0.976 / 1.000 — and REVERTED: `keycolour.js` gates on it at
// KEYC1 0.3, so every one of those opens the gate to 1.0 and the hue would stop being `LOOK.mood` slid part of the way
// toward the key and become the key's own hue outright, on all five scenes that read the anchor. SeeYouDrop's gate
// would go 0.27 -> 1.00 (§60 measured the 0.27 and the user has watched it). Which key the hue anchors on is the bug
// the user asked to fix; how far the hue travels toward it is a look change that wants its own A/B, so the margin-based
// `tonicConf` and the clarity rescale both stay out until then. The cost of leaving it: `keyConf` is now the clarity of
// a read that is no longer published (docs/OPEN-ITEMS.md).
ENGINE.addStage('ears', earsStage, [...EARS_FIELDS, ...MAP_FIELDS, ...KEY_FIELDS, ...SHADE_FIELDS]);
