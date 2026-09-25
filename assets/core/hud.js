// HUD + keys + landing card (the scene tiles are core/landing.js). Touches the DOM, with main.js, touch.js, help.js and landing.js.
// Keys: d HUD · f fullscreen · m monitor the demo synth · 1–N force scene (1 = id 0, N = REG.length) · 0 auto · ? or h help view · p the help at part E (routes) · Esc closes it.
// The table itself is help.js `keys()`; the landing card's hint row is rendered from it here.
import { AU } from '../engine/audio.js';
import { ENGINE } from '../engine/engine.js';
import { toggleMonitor } from '../engine/sources/demo.js';
import { SC, REG } from './scenes.js';
import { Q } from './quality.js';
import { G } from './gl.js';
import { GROOVE } from '../engine/groove.js';
import { toggleHelp, openHelpAt, keys } from './help.js';
import { LANDING, initLanding, pick, leavePeek } from './landing.js'; // v0.8.1: the scene tiles + the live preview ("peek")

const $ = (id) => document.getElementById(id);
export const HUD = { on: false };

export function initHUD() {
  AU.onRun = (mode, msg) => {
    if (LANDING.peek && mode === 'demo') { // a tile started the silent demo as a preview: the card stays, slimmed to the bottom (index.html #landing.peek)
      $('landing').classList.add('peek');
      $('msg').textContent = '';
      return;
    }
    leavePeek();
    if (msg) {
      $('msg').textContent = msg;
      setTimeout(() => $('landing').classList.add('hide'), 1400);
    } else $('landing').classList.add('hide');
    document.body.classList.add('running');
    keepAwake(true);
  };
  AU.onStop = (msg) => {
    document.body.classList.remove('running');
    keepAwake(false);
    $('landing').classList.remove('hide');
    $('msg').textContent = msg || '';
    leavePeek(); // the demo is muted by stopAll: a preview that was running has nothing to show
  };
  $('go').onclick = () => {
    leavePeek();
    $('msg').textContent = '';
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      ENGINE.start('demo', 'Tab capture is not supported here — running the demo signal.');
      return;
    }
    ENGINE.start('capture');
  };
  $('demo').onclick = () => { leavePeek(); ENGINE.start('demo'); };
  $('mic').onclick = () => { leavePeek(); $('msg').textContent = ''; ENGINE.start('mic'); };
  // Capability-aware card (v0.6): no tab capture (every mobile browser) or a coarse pointer → the microphone is the
  // primary way in, the share-a-tab steps are noise. Desktop keeps Share a tab first, the microphone second.
  const mobile = !(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) || (matchMedia && matchMedia('(pointer:coarse)').matches);
  if (mobile) $('landing').classList.add('mobile');
  initLanding(); // the tiles, from REG (after every register — main.js calls initHUD after the loop)
  renderHint();
  addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k !== 'escape' && e.target && e.target.matches && e.target.matches('input,select,textarea')) return; // typing in the panel is not a shortcut (v0.6)
    if (k === 'f') fullscreen();
    else if (k === 'd') {
      HUD.on = !HUD.on;
      $('hud').style.display = HUD.on ? 'block' : 'none';
    } else if (k === 'm') toggleMonitor();
    else if (k === 'h' || k === '?') toggleHelp();
    else if (k === 'p') openHelpAt('helpE');
    else if (k === 'escape') toggleHelp(false);
    else if (k >= '0' && k <= '9') { if (k === '0') pick(-1); else if (REG[+k - 1]) pick(+k - 1); } // v0.8.1: through the picker, so a key on the landing previews like a tile click
  });
  addEventListener('dblclick', fullscreen);
}

// The landing card's key row, from the help view's table (part D) so the two agree forever. Keys without a short label are left out.
function renderHint() {
  const h = $('hint');
  if (!h) return;
  h.replaceChildren();
  let first = true;
  for (const [k, , short] of keys()) {
    if (!short) continue;
    if (!first) h.appendChild(document.createTextNode(' · '));
    first = false;
    const kb = document.createElement('kbd');
    kb.textContent = k;
    h.appendChild(kb);
    h.appendChild(document.createTextNode(' ' + short));
  }
}

// Fullscreen with the WebKit-prefixed path (older Safari); iOS Safari has neither, so canFullscreen() is false there (core/touch.js hints).
const de = () => document.documentElement;
export const canFullscreen = () => !!(de().requestFullscreen || de().webkitRequestFullscreen);
export function fullscreen() {
  const d = document;
  if (!(d.fullscreenElement || d.webkitFullscreenElement)) (de().requestFullscreen || de().webkitRequestFullscreen || (() => {})).call(de());
  else (d.exitFullscreen || d.webkitExitFullscreen || (() => {})).call(d);
}

// Keep the screen on while running (phones dim in 30 s): a screen wake lock, re-requested when the page comes back (the
// lock is released by the browser on every hide). No-op where the API is missing; a refusal (low battery) is silent.
let wake = null;
async function keepAwake(on) {
  if (!navigator.wakeLock) return;
  if (!on) { if (wake) { try { await wake.release(); } catch (e) {} wake = null; } return; }
  if (wake && !wake.released) return;
  try { wake = await navigator.wakeLock.request('screen'); } catch (e) { wake = null; }
}
document.addEventListener('visibilitychange', () => { if (!document.hidden && document.body.classList.contains('running')) keepAwake(true); });

export function hudText(S) {
  const f = (x) => x.toFixed(2);
  const E = REG[SC.logical], sc = E ? E.scene : null;
  const lines = [
    `fps ${Q.fps.toFixed(0)}  q ${f(Q.q)}  scale ${Q.scale} iter ${Q.iter}  ${G.PW}x${G.PH}  src ${AU.mode}  engine ${ENGINE.ms.toFixed(2)} ms`,
    `bands ${f(S.bass)} ${f(S.mid)} ${f(S.high)}  presence ${f(S.presence)}  hit ${f(S.hit)}`,
    `bpm ${S.bpm.toFixed(1)}  phase ${f(S.beatPhase)}  beat ${S.beatCount}  regularity ${f(S.regularity)}`,
    `arc ${S.arc}  eS ${f(S.eS)} eM ${f(S.eM)} eL ${f(S.eL)}  build ${f(S.build)}  absent ${f(S.absentT)}  dropEnv ${f(S.dropEnv)}`,
    `harm ${f(S.harmAngle)} vel ${f(S.harmVel)} clarity ${f(S.clarity)}  interval ${S.interval}`,
    `tension ${f(S.tension)} (rough ${S.rough.toFixed(3)})  suspension ${f(S.suspension)}  surprisal ${f(S.surprisal)}  section ${S.sectionId}${S.repeat ? ' (repeat)' : ''}`,
    `scene ${SC.logical} ${sc ? sc.name : ''}${SC.variant ? '/' + SC.variant : ''} (cur ${SC.cur} next ${SC.next} m ${f(SC.m)}) vmix ${f(SC.vmix)}${SC.forced >= 0 ? ' FORCED' : ''}`,
    `groove rot ${f(GROOVE.rot)}  drift ${f(GROOVE.drift)} sway ${f(GROOVE.sway)} nod ${f(GROOVE.nod.x)}`,
  ];
  if (sc && sc.hud) lines.push(sc.hud());
  return lines.join('\n');
}

export function drawHUD(S, frameN) {
  if (HUD.on && frameN % 6 === 0) $('hud').textContent = hudText(S);
}
