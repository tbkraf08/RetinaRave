// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// The recorder (`R`, docs/plans/SOCIAL-PLAN.md §2; DECISIONS §89). What you see and hear → one .webm + one .json sidecar,
// saved on THIS device through the browser's own download; nothing is uploaded, there is no upload path in this file.
//
// Video: a COMPOSITOR 2D canvas (never in the DOM) of the WebGL canvas's size. At the end of the engine's frame — loop.js
// calls recFrame() after the last GL draw (the overlays) and before the DOM HUD — it drawImage()s the WebGL canvas and burns
// the watermark in; captureStream(60) on it is the video track. The WebGL canvas has no preserveDrawingBuffer: a read
// INSIDE the same rAF task, after the draws and before the callback returns, sees the frame (tools/probe.js's lum() reads
// it the same way); after the task the drawing buffer is presented and cleared. So the copy must stay in loop.js's frame(),
// on the same task — nothing here is async. With REC.on false recFrame() returns on its first line: no GL call, no DOM, no
// allocation — the CLOCK=1 md5 sweep cannot move (CONTRACTS §0).
// Audio: AU.bus → one MediaStreamAudioDestinationNode, connected once the AudioContext exists (a dead-end node, free when
// idle). The bus is upstream of every source — tab capture, mic, file, demo — so one tap covers them all (SOCIAL-PLAN §2.3).
// The HUD, the card, the toast, the red dot are DOM: never in the clip. &rec=0 hides the key (REC.hidden; a kiosk).
import { G } from './gl.js';
import { AU } from '../engine/audio.js';
import { ENGINE } from '../engine/engine.js';
import { SC, REG } from './scenes.js';
import { HASH, TEST } from './hash.js';
import { VER } from './version.js';
import { SHADE } from '../math/keycolour.js';

// The watermark: bottom-right, white at WM.alpha on a soft shadow; the size follows the canvas height (14 px at 720p).
const WM = { alpha: 0.7, pad: 0.018, px: (h) => Math.max(12, Math.round(h / 51)), font: '600 {px}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' };
const SLICE_MS = 2500;             // MediaRecorder timeslice: a chunk every 2.5 s into memory (§2.4)
const WARN_S = 300;                // one toast at 5 minutes (a 10-minute set at 12 Mb/s is ~900 MB, still fine on a desktop)
const BPS = 12e6;                  // videoBitsPerSecond
const MIMES = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];

export const REC = {
  on: false,
  hidden: HASH.get('rec') === '0', // the key is not offered (help row, landing hint); the module stays loaded, idle
  mime: null,                      // the container/codec string the browser accepted, chosen at start
  t0: 0, started: null,            // performance.now() at start · the ISO stamp (local wall time is the user's, not the engine's)
  scenes: [],                      // the timeline: [{ t, id, name }], a row per scene change during the take (t in seconds from start)
  last: null,                      // after a stop: { name, bytes, sidecar, mime } (tools/test_rec.js reads it)
  n: 0,                            // takes started this page
  toast: (text) => {},             // hud.js sets this (hud.js imports this module, never the reverse)
  onChange: (on) => {},            // hud.js: the red dot
  warned: false,
};

let cv = null, c2 = null, stream = null, mr = null, chunks = [], frames = 0;
if (TEST) window.__REC = { REC, start: () => startRec(), stop: () => stopRec(), cv: () => cv }; // tools/test_rec.js's hook, #test only (CARD is harness.js's; this module adds nothing there)

// The audio tap: once, when the AudioContext exists (before or after this module loaded).
function tap(ctx) {
  if (AU.rec) return;
  AU.rec = ctx.createMediaStreamDestination();
  AU.bus.connect(AU.rec);
}
AU.onInit.push(tap);
if (AU.ctx) tap(AU.ctx);

export const verShort = () => 'v' + VER.replace(/\.0$/, '');           // 0.29.0 → v0.29 (the watermark, the file name)
const stamp = (d) => d.toISOString().slice(0, 19).replace(/:/g, '-'); // 2026-10-02T14-03-22
const sceneName = () => { const E = REG[SC.logical]; return E ? E.scene.name.toLowerCase() + (E.variant ? '-' + E.variant.name.toLowerCase() : '') : 'none'; };
const sceneId = () => (REG[SC.logical] ? REG[SC.logical].id : -1);
const safe = (s) => s.replace(/[^a-z0-9-]+/g, '');

function pickMime() {
  if (typeof MediaRecorder === 'undefined') return null;
  for (const m of MIMES) if (MediaRecorder.isTypeSupported(m)) return m;
  return null;
}

export function startRec() {
  if (REC.on) return false;
  const mime = pickMime();
  if (!mime || !G.cv || !G.cv.captureStream) { REC.toast('recording is not supported in this browser'); return false; }
  cv = cv || document.createElement('canvas');
  cv.width = G.PW;
  cv.height = G.PH;
  c2 = cv.getContext('2d', { alpha: false, desynchronized: false });
  stream = cv.captureStream(60);
  if (AU.rec) for (const t of AU.rec.stream.getAudioTracks()) stream.addTrack(t); // no AudioContext yet (nothing started) = a silent clip
  chunks = [];
  frames = 0;
  try { mr = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: BPS }); } catch (e) { REC.toast('recording failed to start: ' + e.message); return false; }
  mr.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
  mr.onstop = finish;
  REC.mime = mime;
  REC.t0 = performance.now();
  REC.started = new Date();
  REC.scenes = [{ t: 0, id: sceneId(), name: sceneName() }];
  REC.warned = false;
  REC.on = true;
  REC.n++;
  mr.start(SLICE_MS);
  REC.onChange(true);
  REC.toast('recording — R again to stop');
  return true;
}

export function stopRec() {
  if (!REC.on) return false;
  REC.on = false;
  REC.onChange(false);
  if (mr && mr.state !== 'inactive') mr.stop(); else finish();
  return true;
}

export const toggleRec = () => (REC.on ? stopRec() : startRec());

// One frame while recording: the copy, the watermark, the scene timeline. Called by loop.js after the last GL draw.
export function recFrame() {
  if (!REC.on) return;
  if (cv.width !== G.PW || cv.height !== G.PH) { cv.width = G.PW; cv.height = G.PH; } // fullscreen / a resize mid-take: the track follows the canvas
  c2.drawImage(G.cv, 0, 0);
  watermark(c2, G.PW, G.PH);
  frames++;
  const id = sceneId(), tl = REC.scenes;
  if (id !== tl[tl.length - 1].id) tl.push({ t: +((performance.now() - REC.t0) / 1000).toFixed(3), id, name: sceneName() });
  if (!REC.warned && performance.now() - REC.t0 > WARN_S * 1000) { REC.warned = true; REC.toast('still recording — ' + WARN_S / 60 + ' minutes so far (R stops)'); }
}

function watermark(c, w, h) {
  const px = WM.px(h), pad = Math.round(h * WM.pad);
  c.font = WM.font.replace('{px}', px);
  c.textAlign = 'right';
  c.textBaseline = 'alphabetic';
  c.shadowColor = 'rgba(0,0,0,0.6)';
  c.shadowBlur = Math.max(2, px / 4);
  c.shadowOffsetY = 1;
  c.fillStyle = 'rgba(255,255,255,' + WM.alpha + ')';
  c.fillText('@retinarave · ' + sceneName() + ' · ' + verShort(), w - pad, h - pad);
  c.shadowBlur = 0;
  c.shadowColor = 'transparent';
}

// The sidecar (SOCIAL-PLAN §2.4): what the take was, enough to re-render the same stretch later (§2.7).
function sidecar(durationS) {
  return {
    app: 'retinarave', version: VER, engineMd5: null,
    started: REC.started.toISOString(), durationS: +durationS.toFixed(3),
    source: AU.mode || 'none', track: AU.mode === 'file' && AU.file ? AU.file.name : null,
    size: [cv.width, cv.height], fps: 60, frames, mime: REC.mime,
    scenes: REC.scenes.slice(),
    flags: { lead: !!(ENGINE.LEAD && ENGINE.LEAD.on), shade: SHADE.K > 0, clock: ENGINE.CLOCK ? ENGINE.CLOCK.src : null, map: ENGINE.useMap },
    ua: navigator.userAgent,
  };
}

function download(name, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 30000);
}

function finish() {
  const dur = (performance.now() - REC.t0) / 1000;
  const blob = new Blob(chunks, { type: REC.mime || 'video/webm' });
  const base = 'retinarave-' + verShort() + '-' + safe(REC.scenes[0].name) + '-' + stamp(REC.started);
  const sc = sidecar(dur);
  REC.last = { name: base + '.webm', bytes: blob.size, sidecar: sc, mime: REC.mime, blob };
  download(base + '.webm', blob);
  download(base + '.json', new Blob([JSON.stringify(sc, null, 1)], { type: 'application/json' }));
  for (const t of stream.getVideoTracks()) t.stop();
  chunks = [];
  mr = null;
  REC.toast('saved ' + Math.round(dur) + ' s · ' + base + '.webm' + (blob.size ? ' (' + (blob.size / 1048576).toFixed(1) + ' MB)' : ''));
}
