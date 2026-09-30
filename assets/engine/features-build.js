// THE LIVE BUILD / DROP STAGE (live step 4 B.2, 2026-09-29; engine/build/build.js, docs/AUDIT-live-grid.md "Step 4",
// DECISIONS §54): `buildLive` (the void before a drop, 0..1), `dropLiveIn` (beats to the next bar line while armed, -1 when
// not), `dropLiveEvt` (the slam). Causal in every mode — the stream-mode (tab capture) answer to the file map's buildProg /
// toDrop / mapDropEvt. Additive: reads synapse's `hp` / `bassS` / bar line, v3's clock, the lead's estimate and the ears'
// CAUSAL low-onset lane (EARS.ears — never the file map's onsets), writes only its own fields; no scene reads them by
// default except NAV (since 2026-09-29, the user's word; the old look by route: nav.buildLive=build,nav.dropLiveEvt=dropEvt). Registered after 'drums' (main.js import order),
// so it runs BEFORE the lead, on the raw clocks, like the bars stage (the time base: features-bars.js).
// The release: an onset is taken when heard time + the display lead (dispNow(): 40 ms in file modes, 0 live) reaches it, so
// in file modes the slam can land with the other lead-timed visuals; live it lands when the ears release the onset.
import { AU } from './audio.js';
import { ENGINE } from './engine.js';
import { LEAD, dispNow } from './lead.js';
import { EARS } from './features-ears.js';
import { Build, BUILD_OUT } from './build/build.js';
import { feed, laneTake } from './build/feed.js';

export const BUILDS = { b: null, src: null, E: null, lane: { t: -Infinity }, ts: [], dt: 1 / 60, inp: {} };

export function buildStage(dt, now, S) {
  S.dropLiveEvt = false;
  if (ENGINE.fakeOn || !AU.ctx || AU.mode === 'none') { S.buildLive = 0; S.dropLiveIn = -1; return; }
  const src = AU.mode + ':' + (AU.file ? AU.file.name + '@' + AU.file.at : '');
  if (!BUILDS.b || src !== BUILDS.src) { BUILDS.b = new Build(); BUILDS.src = src; }
  const E = EARS.ears;
  if (E !== BUILDS.E) { BUILDS.E = E; BUILDS.lane.t = -Infinity; }          // a new Ears (a new stream, a seek): a new lane
  if (dt > 0 && dt < 0.05) BUILDS.dt += (dt - BUILDS.dt) * 0.2;
  const disp = dispNow(), lead = Math.min(1 / 120, 0.5 * BUILDS.dt);
  const ts = laneTake(E, S.heardT + disp + lead, BUILDS.lane, BUILDS.ts);
  const o = BUILDS.b.step(feed(S, LEAD.L === null ? 0 : LEAD.L, disp, dt, ts, BUILDS.inp));
  S.buildLive = o.buildLive; S.dropLiveIn = o.dropLiveIn; S.dropLiveEvt = !!o.dropLiveEvt;
}

ENGINE.addStage('build', buildStage, BUILD_OUT);
