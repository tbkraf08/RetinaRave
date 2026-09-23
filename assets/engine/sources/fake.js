// Deterministic fake music state for the headless self-test (#test): 24 s loop — sustain 0–6, valley 6–10,
// build 10–13, DROP at 13, peak 13–21, valley 21–24. Drives MS directly (no audio). Lifted from cardioid3 fakeMusic.
import { TAU, clamp, ema, frac, sstep } from '../../math/util.js';
import { MS } from '../state.js';

const lib = {};

export function fakeMusic(dt, now) {
  const S = MS, T = now % 24;
  S.onset = S.beat = S.dropEvt = S.sectionEvt = S.surpriseEvt = S.resolveEvt = S.identifyEvt = false;
  S.presence = 1;
  S.bpm = 124;
  S.regularity = T < 6 || T > 13 ? 0.8 : 0.2;
  const sec = T < 6 ? 'sustain' : T < 10 ? 'valley' : T < 13 ? 'build' : T < 21 ? 'peak' : 'valley';
  const kickOn = sec === 'sustain' || sec === 'peak';
  S.beatPhase += dt * S.bpm / 60;
  if (S.beatPhase >= 1) {
    S.beatPhase -= 1;
    S.beatCount++;
    S.beat = true;
    if (kickOn) {
      S.onset = true;
      S.hitStrength = 0.8;
      S.hit = 1;
    }
  }
  S.hit *= Math.exp(-dt / 0.14);
  const kp = kickOn ? Math.exp(-S.beatPhase * 5) : 0;
  S.bass = S.bassFast = kp * 0.9;
  S.mid = sec === 'valley' ? 0.25 : 0.55;
  S.high = sec === 'build' ? 0.3 + 0.2 * (T - 10) : 0.35;
  const e = clamp(0.5 * S.bass + 0.35 * S.mid + 0.15 * S.high + (kickOn ? 0.25 : 0), 0, 1);
  S.eS = ema(S.eS, e, dt, 0.3);
  S.eM = ema(S.eM, e, dt, 2.5);
  S.eL = ema(S.eL, e, dt, 12);
  S.eMax = 0.6;
  S.build = ema(S.build, sec === 'build' ? 1 : 0, dt, 1);
  S.tension = ema(S.tension, sec === 'build' ? 0.9 : sec === 'peak' ? 0.6 : 0.2, dt, 0.5);
  S.suspension = ema(S.suspension, sstep(0.55, 0.8, S.tension), dt, 1.3);
  if (sec !== S.arc) {
    if (sec === 'peak') {
      S.dropEvt = true;
      S.dropStrength = 0.9;
      S.dropEnv = 1;
      S.lastDrop = now;
      S.build = 0;
    }
    S.arc = sec;
    S.sectionEvt = true;
    S.identifyAt = now + 2.2;
  }
  if (S.identifyAt > 0 && now > S.identifyAt) {
    // deterministic stand-in for identifySection()
    S.identifyAt = -1;
    S.identifyEvt = true;
    const k = S.arc;
    S.repeat = !!lib[k];
    if (!lib[k]) {
      const i = Object.keys(lib).length;
      lib[k] = { id: i + 1, seed: { hue: frac(0.6 + 0.37 * i), th: frac(0.21 * i) - 0.5, a: frac(0.17 + 0.31 * i), scene: -1 } };
    }
    S.sectionId = lib[k].id;
    S.seed = lib[k].seed;
  }
  S.dropEnv *= Math.exp(-dt / 1.1);
  S.harmUnw += dt * 0.25;
  S.harmAngle = S.harmUnw % TAU;
  S.harmVel = 0.25;
  S.clarity = 0.6;
  S.interval = [7, 5, 4, 0, 9, 3][Math.floor(now / 4) % 6];
  S.intensity = clamp(0.62 * S.eS + 0.38 * S.tension, 0, 1);
  S.surprisal = 0;
  for (let i = 0; i < 2048; i++) S.wave[i] = Math.sin(i * 0.05 + now * 7) * 0.3 * e + Math.sin(i * 0.31 + now) * 0.2 * S.high;
  S.rms = 0.2;
  S.peaks = [[110, 1], [220, .6], [330, .5], [550, .3]];
}

export default { name: 'fake', start() {}, stop() {}, update: fakeMusic };
