// The frame loop. Order (same as cardioid3): quality → resize → engine (music + groove + test pins) → scene updates →
// director → look → fx → scene pass(es) + transition → effect chain → overlays → HUD → help view → test log.
import { ENGINE } from '../engine/engine.js';
import { MS } from '../engine/state.js';
import { GROOVE } from '../engine/groove.js';
import { G, resize, uploadEngineTex } from './gl.js';
import { Q, updateQuality } from './quality.js';
import { LOOK, updateLook } from './look.js';
import { FX, updateFX, runChain } from './post.js';
import { SC, REG, SCENES, updateScenes, drawScenes, visibility, postParams } from './scenes.js';
import { drawHUD } from './hud.js';
import { drawHelp } from './help.js';
import { CARD, logFrame } from './harness.js';
import { refreshRoutes, view } from './route.js';
import { refreshParams } from './params.js';

let lastT = 0, frameN = 0, wall = 0;

export function frame(tms) {
  requestAnimationFrame(frame);
  const now = tms / 1000, dtRaw = Math.min(now - lastT, 0.25);
  lastT = now;
  if (dtRaw <= 0) return;
  const dt = Math.min(dtRaw, 1 / 24);
  frameN++;
  CARD.frameN = frameN;
  if (document.hidden) return;
  updateQuality(dtRaw);
  resize();
  ENGINE.frame(dt, now, tms);
  if (ENGINE.resumed) FX.glitch = FX.flash = 0; // v0.3 resume-hold: the composite's transients do not outlive a hidden gap
  uploadEngineTex(ENGINE.tex);
  const S = MS;
  refreshRoutes(dt); // v0.4: routed views refreshed from the finished MS (returns at once while no route exists)
  // scene updates: scenes flagged always, plus the ones on screen — each reads its own view of MS (MS itself unless routed)
  const env = { SC, Q, now };
  for (const sc of SCENES) {
    const id = sc.id, on = SC.cur === id || SC.next === id;
    if (sc.always || on) { env.params = refreshParams(sc, dt); sc.update(dt, view(sc), GROOVE, LOOK, env); } // v0.5: the scene's parameter values, from(view) unless routed
  }
  updateScenes(dt, S);
  updateLook(dt, S, now);
  wall += dt * (0.15 + 0.85 * S.presence);
  const cur = REG[SC.cur].scene.rt;
  LOOK.time = cur.time !== undefined ? cur.time : wall;
  updateFX(dt, S, LOOK.peak);
  // scene pass(es) at adaptive resolution inside fixed-size targets
  const trans = SC.next >= 0, sc = Q.scale * (trans ? 0.8 : 1);
  const sw = Math.max(16, Math.round(G.PW * sc)), sh = Math.max(16, Math.round(G.PH * sc));
  const tio = { MS: S, GROOVE, LOOK, dt };
  const src = drawScenes(sw, sh, tio);
  const full = tio.uvS && tio.uvS[0] === 1 && tio.uvS[1] === 1; // the transition re-rendered the whole target (CONTRACTS §5)
  runChain(src, full ? G.PW : sw, full ? G.PH : sh, { MS: S, GROOVE, dt, frameN, post: postParams(S), Q, k: LOOK.k }); // k: the frame's tonemap knee (v0.5 item 4)
  for (const scn of SCENES) if (scn.overlay) scn.overlay(G.PW, G.PH, visibility(scn.id), dt);
  drawHUD(S, frameN);
  drawHelp(S, frameN); // after drawHUD so it inherits the document.hidden early return; returns at once when closed
  logFrame(S, now, frameN);
}

export function startLoop() {
  requestAnimationFrame(frame);
}
