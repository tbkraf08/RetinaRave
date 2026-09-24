// HUD + keys + landing card. The only module that touches the DOM besides main.js.
// Keys: d HUD · f fullscreen · m monitor the demo synth · 1–9 force scene (1 = id 0) · 0 auto · ? or h help view · p the help at part E (routes) · Esc closes it.
import { AU } from '../engine/audio.js';
import { ENGINE } from '../engine/engine.js';
import { toggleMonitor } from '../engine/sources/demo.js';
import { SC, REG } from './scenes.js';
import { Q } from './quality.js';
import { G } from './gl.js';
import { GROOVE } from '../engine/groove.js';
import { toggleHelp, openHelpAt } from './help.js';

const $ = (id) => document.getElementById(id);
export const HUD = { on: false };

export function initHUD() {
  AU.onRun = (mode, msg) => {
    if (msg) {
      $('msg').textContent = msg;
      setTimeout(() => $('landing').classList.add('hide'), 1400);
    } else $('landing').classList.add('hide');
    document.body.classList.add('running');
  };
  AU.onStop = (msg) => {
    document.body.classList.remove('running');
    $('landing').classList.remove('hide');
    $('msg').textContent = msg || '';
  };
  $('go').onclick = () => {
    $('msg').textContent = '';
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      ENGINE.start('demo', 'Tab capture is not supported here — running the demo signal.');
      return;
    }
    ENGINE.start('capture');
  };
  $('demo').onclick = () => ENGINE.start('demo');
  addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'f') fullscreen();
    else if (k === 'd') {
      HUD.on = !HUD.on;
      $('hud').style.display = HUD.on ? 'block' : 'none';
    } else if (k === 'm') toggleMonitor();
    else if (k === 'h' || k === '?') toggleHelp();
    else if (k === 'p') openHelpAt('helpE');
    else if (k === 'escape') toggleHelp(false);
    else if (k >= '0' && k <= '9') SC.forced = k === '0' ? -1 : (REG[+k - 1] ? +k - 1 : SC.forced);
  });
  addEventListener('dblclick', fullscreen);
}

function fullscreen() {
  const d = document;
  if (!d.fullscreenElement) (d.documentElement.requestFullscreen || (() => {})).call(d.documentElement);
  else d.exitFullscreen();
}

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
