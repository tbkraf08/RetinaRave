// THE REACTIVE DRUMS v2 STAGE (2026-09-28; engine/drums/drums.js, docs/AUDIT-drums.md): `kick2` / `snare2` / `hat2`, levels
// shaped like synapse's `kick` / `snare` / `hat` (a scene takes them by route, no edit). Additive: reads synapse's analyzer,
// the ears' LOW onset lane (Ears.lowReleased) and the lead's audio-lead estimate; writes only its own fields. Registered
// after 'ears' (main.js import order), so synapse's levels are this frame's and the ears have read.
// The fake timeline has no analyzer: the v2 levels mirror synapse's there, so a route behaves the same under #test.
import { AU } from './audio.js';
import { ENGINE } from './engine.js';
import { LEAD } from './lead.js';
import { tap } from './features-synapse.js';
import { EARS } from './features-ears.js';
import { Drums, DRUMS_OUT } from './drums/drums.js';

export const DRUMS2 = { d: null, src: null, inp: { syn: null, bassN: 0, low: 0, lowFl: 0, ahead: 0, dt: 1 / 60 } };

export function drumsStage(dt, now, S) {
  if (ENGINE.fakeOn || !AU.ctx || AU.mode === 'none' || !tap.an) { S.kick2 = S.kick; S.snare2 = S.snare; S.hat2 = S.hat; return; }
  const src = AU.mode + ':' + (AU.file ? AU.file.name + '@' + AU.file.at : '');
  if (!DRUMS2.d || src !== DRUMS2.src) { DRUMS2.d = new Drums(); DRUMS2.src = src; }
  const i = DRUMS2.inp, an = tap.an, E = EARS.ears;
  i.syn = an.A; i.bassN = an.bands.bass.n; i.dt = dt > 0 && dt < 0.1 ? dt : 1 / 60;
  i.ahead = LEAD.L === null ? 0 : -LEAD.L;
  i.low = 0; i.lowFl = 0;
  if (E) for (const e of E.lowReleased) { i.low = 1; if (e.fl > i.lowFl) i.lowFl = e.fl; }
  const o = DRUMS2.d.step(i);
  S.kick2 = o.kick2; S.snare2 = o.snare2; S.hat2 = o.hat2;
}

ENGINE.addStage('drums', drumsStage, DRUMS_OUT);
