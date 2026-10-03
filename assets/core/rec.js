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
import { Q, pinQ } from './quality.js';

// The watermark: bottom-right, white at WM.alpha on a soft shadow; the size follows the canvas height (14 px at 720p).
const WM = { alpha: 0.7, pad: 0.018, px: (h) => Math.max(12, Math.round(h / 51)), font: '600 {px}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' };
const SLICE_MS = 2500;             // MediaRecorder timeslice: a chunk every 2.5 s into memory (§2.4)
const WARN_S = 300;                // one toast at 5 minutes (a 10-minute set at 12 Mb/s is ~900 MB, still fine on a desktop)
// The encoder (§92). &recmime=<name> picks one of these by name (or a full mime string); the default is ORDER's first the browser
// supports. &recbps=<Mb/s> is videoBitsPerSecond (default BPS_DEF). Both land in the sidecar (mime, bps).
const CODECS = { vp9: 'video/webm;codecs=vp9,opus', vp8: 'video/webm;codecs=vp8,opus', h264: 'video/webm;codecs=h264,opus', av1: 'video/webm;codecs=av1,opus', mp4: 'video/mp4;codecs=avc1.640028,opus' };
const ORDER = ['vp9', 'vp8', 'h264'];
const BPS_DEF = 30;                // Mb/s (§92: 12 starved VP9 at 1080p60 — r14 0.35 → 0.40 at 30, the encode no slower)
const RECMIME = HASH.get('recmime');
const BPS = (() => { const n = +HASH.get('recbps'); return (n > 0 ? n : BPS_DEF) * 1e6; })();
// The tier during a take (DECISIONS §92: the governor sank q to 0 under the encoder's load and the take was an upscaled 0.375× render).
// &recq=<0..1> pins Q at that tier for the take (1 = the top: every scene at full resolution and its top iteration/particle tier) ·
// &recq=hold freezes q where the governor had it when R was pressed · &recq=off leaves the governor free (v0.30's behaviour).
const RECQ_DEF = 0.75;             // scale 0.875, the particle / iteration tier 2: 60 fps with the encoder on this machine where 1 gave 56 (§92)
const RECQ = (() => { const v = HASH.get('recq'); if (v === null) return RECQ_DEF; if (v === 'off') return null; if (v === 'hold') return 'hold'; const n = +v; return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : RECQ_DEF; })();
// The clip's size (§92): the compositor is the WebGL canvas's size (G.PW × G.PH = CSS × min(devicePixelRatio, 1.5), long edge ≤ 2560,
// gl.js) unless &recsize=<height> scales it to that height (the width follows the aspect; both even for yuv420). Scaling UP buys nothing.
const RECSIZE = Math.max(0, +HASH.get('recsize') || 0);
const even = (n) => Math.max(16, Math.round(n / 2) * 2);
const recDims = () => (RECSIZE ? [even(G.PW * RECSIZE / G.PH), even(RECSIZE)] : [even(G.PW), even(G.PH)]);   // always even: yuv420 encoders and clip.js's libx264 refuse an odd height (the user's window was 1282x1309)
// The sidecar (§92): INSIDE the webm since v0.32 — a Matroska Tags element before the first Cluster (TagName COMMENT, TagString the
// JSON); `ffprobe -show_entries format_tags` prints it, tools/rec_probe.js's walk returns it, tools/clip.js reads it. One download per
// take: Chrome's "download multiple files" prompt swallowed the second one (none of the user's three takes had its .json beside it).
// &recjson=1 downloads the .json too, as v0.30 did.
const RECJSON = HASH.get('recjson') === '1';

export const REC = {
  on: false,
  hidden: HASH.get('rec') === '0', // the key is not offered (help row, landing hint); the module stays loaded, idle
  mime: null,                      // the container/codec string the browser accepted, chosen at start
  t0: 0, started: null,            // performance.now() at start · the ISO stamp (local wall time is the user's, not the engine's)
  scenes: [],                      // the timeline: [{ t, id, name }], a row per scene change during the take (t in seconds from start)
  last: null,                      // after a stop: { name, bytes, sidecar, mime } (tools/test_rec.js reads it)
  q: null,                         // the tier pinned for this take (null = the governor is free; &recq=)
  q0: null,                        // the governor's q when the take started (restored at stop)
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
  const want = RECMIME && (CODECS[RECMIME] || RECMIME);
  if (want && MediaRecorder.isTypeSupported(want)) return want;
  for (const k of ORDER) if (MediaRecorder.isTypeSupported(CODECS[k])) return CODECS[k];
  return MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : null;
}
const ext = (mime) => (mime && mime.startsWith('video/mp4') ? '.mp4' : '.webm');

export function startRec() {
  if (REC.on) return false;
  const mime = pickMime();
  if (!mime || !G.cv || !G.cv.captureStream) { REC.toast('recording is not supported in this browser'); return false; }
  cv = cv || document.createElement('canvas');
  [cv.width, cv.height] = recDims();
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
  REC.q0 = Q.q;
  REC.q = RECQ === 'hold' ? Q.q : RECQ;
  if (REC.q !== null) pinQ(REC.q); // held for the take: quality.js's controller sets q back to it at every window
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
  if (REC.q !== null) { pinQ(null); Q.q = Q.ceil = REC.q0; } // the governor resumes from where it was before the take
  if (mr && mr.state !== 'inactive') mr.stop(); else finish();
  return true;
}

export const toggleRec = () => (REC.on ? stopRec() : startRec());

// One frame while recording: the copy, the watermark, the scene timeline. Called by loop.js after the last GL draw.
export function recFrame() {
  if (!REC.on) return;
  const [w, h] = recDims();
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; } // fullscreen / a resize mid-take: the track follows the canvas
  c2.drawImage(G.cv, 0, 0, w, h);
  watermark(c2, w, h);
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
    size: [cv.width, cv.height], render: [G.PW, G.PH], dpr: +(window.devicePixelRatio || 1).toFixed(2), fps: 60, frames, mime: REC.mime,
    q: REC.q, q0: +REC.q0.toFixed(3), // the tier held for the take (null = the governor was free) · the governor's q at R
    bps: BPS,                         // videoBitsPerSecond asked of MediaRecorder (the realised rate is bytes / durationS)
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

// EBML, enough to splice the sidecar in: an element = id bytes · an 8-byte size · the payload; the first Cluster's offset in the first chunk.
const cat = (parts) => { let n = 0; for (const p of parts) n += p.length; const o = new Uint8Array(n); let i = 0; for (const p of parts) { o.set(p, i); i += p.length; } return o; };
const el = (id, payload) => { const sz = new Uint8Array(8); sz[0] = 1; let n = payload.length; for (let k = 7; k >= 1; k--) { sz[k] = n & 255; n = Math.floor(n / 256); } return cat([Uint8Array.from(id), sz, payload]); };
function tagsEl(json) { const enc = new TextEncoder(); return el([0x12, 0x54, 0xc3, 0x67], el([0x73, 0x73], el([0x67, 0xc8], cat([el([0x45, 0xa3], enc.encode('COMMENT')), el([0x44, 0x87], enc.encode(json))])))); }
function vint(b, i, keep) { const f = b[i]; let len = 1, m = 0x80; while (len <= 8 && !(f & m)) { len++; m >>= 1; } let v = keep ? f : f & (m - 1), un = (f & (m - 1)) === m - 1; for (let k = 1; k < len; k++) { v = v * 256 + b[i + k]; if (b[i + k] !== 0xff) un = false; } return { v, len, unknown: un && !keep }; }
function firstCluster(b) { // level 0/1: the EBML header, Segment (unknown size: descend), Info, Tracks … Cluster
  let i = 0;
  while (i < b.length - 2) {
    const id = vint(b, i, true), sz = vint(b, i + id.len, false);
    if (id.v === 0x1f43b675) return i;
    i += id.len + sz.len;
    if (id.v !== 0x18538067 && !sz.unknown) i += sz.v;
  }
  return -1;
}

async function finish() {
  const dur = (performance.now() - REC.t0) / 1000;
  const base = 'retinarave-' + verShort() + '-' + safe(REC.scenes[0].name) + '-' + stamp(REC.started);
  const sc = sidecar(dur), json = JSON.stringify(sc);
  const x = ext(REC.mime);
  let parts = chunks, embedded = false;
  if (x === '.webm' && chunks.length) { // the sidecar inside the container: before the first Cluster of the first chunk
    const b0 = new Uint8Array(await chunks[0].arrayBuffer()), at = firstCluster(b0);
    if (at > 0) { parts = [b0.subarray(0, at), tagsEl(json), b0.subarray(at), ...chunks.slice(1)]; embedded = true; }
  }
  const blob = new Blob(parts, { type: REC.mime || 'video/webm' });
  REC.last = { name: base + x, bytes: blob.size, sidecar: sc, mime: REC.mime, blob, embedded };
  download(base + x, blob);
  if (RECJSON || !embedded) download(base + '.json', new Blob([JSON.stringify(sc, null, 1)], { type: 'application/json' })); // two downloads: Chrome asks once
  for (const t of stream.getVideoTracks()) t.stop();
  chunks = [];
  mr = null;
  REC.toast('saved ' + Math.round(dur) + ' s · ' + base + x + (blob.size ? ' (' + (blob.size / 1048576).toFixed(1) + ' MB)' : ''));
}
