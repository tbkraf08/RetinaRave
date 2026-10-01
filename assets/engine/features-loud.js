// THE LOUDNESS STAGE (2026-09-30, docs/plans/LOUDNESS-PLAN.md phase 2, DECISIONS §63): `assets/engine/loud.js`'s
// ITU-R BS.1770-4 K-weighted loudness on the PCM bus, copied into MS under its own names, evaluated at heard time
// (MS.heardT, the clock stage). Registered AFTER 'ears' and BEFORE the PCM beat clock, and additive: it writes only
//   loudM · loudS · loudPk · loudRel · loudRange · loudAbs
// and never another stage's field. #test (the fake timeline) never runs it — sources/fake.js mirrors the six fields
// from its own synthetic energy instead, so a migrated scene is not dark on the deterministic timeline.
//
// WHAT A SCENE READS. `loudRel` (0..1): how loud this is FOR THIS TRACK, gain-invariant, the causal continuous version
// of the track map's non-causal `eG`. `loudM` / `loudS` / `loudPk` are LKFS and only absolute when `loudAbs` is 1 —
// on the capture path the gain is the TAB's, set by the user's own mixer, and no scene may read an absolute field
// without checking it. `loudRange` is how much dynamic range the track has shown (LU), for a scene that wants the
// track's own contrast instead of the fixed LOUDK.RANGE span.
//
// `loudAbs`:  1 = absolute (file, demo — the engine owns the gain) · 0 = relative (capture, mic — the tab's or the
// device's gain) · -1 = the stage is not running (`&loud=0`, `ENGINE.useLoud = false`, #test with the switch off, or
// no source at all), which is the sentinel every migrated scene falls back to its pre-loudness formula on. That makes
// `&loud=0` a true A/B: the fake-timeline md5 list under it is the pre-migration list, line for line.
//
// THE COST is paid in the PCM listener, outside frame(), and drained into ENGINE.ms through ENGINE.extraMs exactly as
// the ears' and the PCM clock's are. Measured: see DECISIONS §63 / tools/test_loud.js's `cost` line.
import { AU } from './audio.js';
import { ENGINE } from './engine.js';
import { PCM } from './pcm.js';
import { Loud, LOUD_FIELDS, LOUDK } from './loud.js';

export const LOUD_OUT = [...LOUD_FIELDS, 'loudAbs'];
export const JUMP = 0.05;              // s: a block stamp this far from the expected one starts a fresh Loud (a seek, a new source)
// which modes know their own gain (the plan §6). 'demo' and 'demo-synapse' synthesise into AU.bus at a known level.
const ABS_MODES = { file: 1, demo: 1, 'demo-synapse': 1 };

export const LOUD = {
  loud: null, next: -1, subscribed: false, cpu: 0, cpuTotal: 0, blocks: 0, out: {},
};
ENGINE.LOUD = LOUD;
ENGINE.LOUDK = LOUDK;

function onBlock(L, R, t0) {
  if (ENGINE.fakeOn || !LOUDK.on || !AU.ctx) return;
  if (t0 < 0) return;                                 // real-time file mode before the node started (pcm.js map -> -1)
  const c0 = performance.now();
  if (!LOUD.loud || Math.abs(t0 - LOUD.next) > JUMP) LOUD.loud = new Loud(AU.ctx.sampleRate);
  LOUD.loud.push(L, R, t0);
  LOUD.next = t0 + L.length / AU.ctx.sampleRate;
  LOUD.blocks++;
  const ms = performance.now() - c0;
  LOUD.cpu += ms; LOUD.cpuTotal += ms;
}

export function loudStage(dt, now, S) {
  // #test: sources/fake.js has ALREADY written the six fields from the synthetic energy this frame. Returning without
  // touching them is the point — an `S.loudAbs = -1` here would clobber the mirror and every migrated scene would sit
  // on its fallback on the one timeline every md5 proof is taken on (found by FEIGEN's md5 not moving).
  if (ENGINE.fakeOn) return;
  if (!LOUDK.on || !AU.ctx || AU.mode === 'none') { S.loudAbs = -1; return; }
  if (!LOUD.subscribed) { LOUD.subscribed = true; PCM.on(onBlock); }
  ENGINE.extraMs += LOUD.cpu; LOUD.cpu = 0;
  const Lo = LOUD.loud;
  if (!Lo) { S.loudAbs = -1; return; }
  const o = Lo.read(S.heardT, LOUD.out);
  for (const k of LOUD_FIELDS) S[k] = o[k];
  S.loudAbs = ABS_MODES[AU.mode] || 0;
}

ENGINE.addStage('loud', loudStage, LOUD_OUT);
