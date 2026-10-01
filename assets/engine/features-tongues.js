// THE TONGUES STAGE (2026-10-01, docs/plans/TONGUES-PLAN.md phase 1, DECISIONS §76): `engine/clock/tongues.js`'s circle-map
// phase-locking descriptor — a bank of sine circle maps driven per 512-sample hop by the PCM beat clock's own mid- and
// low-band onset novelty, centred on the clock's beat — published under its own twelve names:
//   tongueP · tongueQ · tongueDepth · tongueK · tongueAmbig · tongue11 · tongue21 · tongue41 · tongueLat · tongueLatConf · swing · tongueOn
// Registered AFTER 'clock-pcm' (it reads the clock the stage built) and BEFORE bars / drums / build / queue. Additive: it
// writes only its own fields; SHADOW MODE — no scene reads one by default (phase 1), and no other stage does.
// THE WORK runs inside the clock's hop (clock.js hop() calls `tongues.hop()` when one is attached), so its cost is paid in the
// PCM listener and is already in `ENGINE.CLOCK.cpu` / `cpuTotal`, drained into ENGINE.ms through extraMs like the rest of
// the clock's. Measured in node (tools/tongues-node.js, 168 oscillators in two banks): 4.1–4.8 µs per hop = 6.4–7.5 µs per
// 60 Hz frame at 48 kHz. The windows close on the clock's beats in AUDIO time; only the publish is at frame time, like
// every PCM field (the fields are per-beat values, so a frame reads the last closed window).
// THE SWITCH: `&tongues=0` under #test / `ENGINE.TONGUEK.on = false` — no Tongues is attached (no PCM work) and `tongueOn`
// reads -1, which is `loudAbs`'s A/B convention: a scene that reads a tongue field falls back to its pre-tongues formula on
// -1, so `&tongues=0` is an md5 receipt. #test (the fake timeline) never runs this stage — sources/fake.js mirrors the
// twelve fields from its own phase instead (constants; the ladder never changes there, so a scene reading a CHANGE in a
// depth sees nothing, and s1's md5 does not move).
import { AU } from './audio.js';
import { ENGINE } from './engine.js';
import { CLOCKS } from './features-clock.js';
import { TONGUEK, TONGUE_FIELDS } from './clock/tongues.js';

export const TONGUES = { clk: null, depth: 0 };
ENGINE.TONGUES = TONGUES;
ENGINE.TONGUEK = TONGUEK;

// the bank itself is attached to the Clock when features-clock.js builds one (onBlock, inside the PCM listener), so the
// first hop already feeds it and a det page run equals the node run hop for hop; this stage only publishes
export function tonguesStage(dt, now, S) {
  if (ENGINE.fakeOn) return;                                  // the mirror already wrote the fields this frame (features-loud.js's rule)
  const C = CLOCKS.clk, T = C && C.tongues;
  if (!TONGUEK.on || !AU.ctx || AU.mode === 'none' || !T) { S.tongueOn = -1; TONGUES.clk = null; return; }
  if (C !== TONGUES.clk) { TONGUES.clk = C; TONGUES.depth = 0; }   // a new Clock (a new stream, a seek): a new bank, the ease restarts
  const o = T.out;
  for (const k of TONGUE_FIELDS) S[k] = o[k];
  // tongueDepth eases per frame (the per-beat value steps once a beat; EASE 0.3 s): the one field meant to be read as a level
  TONGUES.depth += (o.tongueDepth - TONGUES.depth) * (dt > 0 && dt < 0.1 ? 1 - Math.exp(-dt / TONGUEK.EASE) : 1);
  S.tongueDepth = TONGUES.depth;
}

ENGINE.addStage('tongues', tonguesStage, TONGUE_FIELDS);
