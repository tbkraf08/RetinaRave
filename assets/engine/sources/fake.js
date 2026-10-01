// Deterministic fake music state for the headless self-test (#test): 24 s loop — sustain 0–6, valley 6–10,
// build 10–13, DROP at 13, peak 13–21, valley 21–24. Drives MS directly (no audio). Lifted from cardioid3 fakeMusic.
import { TAU, clamp, ema, frac, sstep } from '../../math/util.js';
import { MS, TEX } from '../state.js';
import { LOUDK, LOUD_OFS } from '../loud.js';
import { TONGUEK } from '../clock/tongues.js';

const lib = {};
let hatPh = 0;
// the fake timeline's loudness state (fakeLoud below): the peak hold and the window the range percentiles come from
const FL = { pk: 0, lo: 0, hi: 0, n: 0 };

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
  fakeSynapse(dt, now, S, sec, T, e, kp, kickOn);
  fakeLoud(dt, now, S);
  fakeTongues(S, sec);
}

// The twelve TONGUE fields (engine/clock/tongues.js, DECISIONS §76), mirrored as CONSTANTS from the phase: the beat locks
// where the kick is on (sustain / peak: depth 0.6, the 1:1 tongue wins) and the beat locks nothing in the valleys and the
// build (depth 0) — so a scene that reads a tongue field headlessly is not dark. The 8th / 16th depths and the swing
// are the SAME constants in every phase (0.5 / 0.4 / 1.0, so the tension reads 0.5 throughout): the loop has no double-time layer, so a scene that
// reads a CHANGE in tongue21 over bars (DUST's accent amplitude, phase 4) sees nothing here and s1's md5 does not move —
// the mirror that keeps the fake timeline an md5 reference. `tongueOn` is -1 under `&tongues=0`, the A/B convention.
function fakeTongues(S, sec) {
  if (!TONGUEK.on) { S.tongueOn = -1; return; }
  const on = sec === 'sustain' || sec === 'peak', d = on ? 0.6 : 0;
  S.tongueP = 1; S.tongueQ = 1; S.tongueDepth = d; S.tongue11 = d; S.tongueK = on ? 0.3 : 0;
  S.tongue21 = 0.5; S.tongue41 = 0.4; S.tongueAmbig = 1 - Math.max(d, 0.5);
  S.tongueLat = 0; S.tongueLatConf = on ? 0.2 : 0; S.swing = 1; S.tongueOn = 1;
}

// The six TRUE-LOUDNESS fields, mirrored from the synthetic energy (the plan's §6 obligation: without this the fake
// timeline is a hole where `loudRel` is 0 and every migrated scene goes dark under #test, which is where every md5
// proof in this project is taken). The same obligation fake.js already meets for `eM` / `lvl`.
// `loudAbs` is 1 here — the timeline's gain is the timeline's own — EXCEPT under `&loud=0`, where it stays -1 and every
// migrated scene falls back to its pre-loudness formula: that is what makes `&loud=0` reproduce the pre-migration md5
// list line for line.
// The map from a 0..1 energy to LKFS is `-0.691 + 20*log10(e)`, i.e. the energy read as an amplitude, so the loop
// spans about -13 .. -1 LKFS — the range a modern master actually occupies (the five test tracks integrate to
// -3.9 .. -12.5). Deterministic: a function of dt and the fake state, no Math.random, no clock.
function fakeLoud(dt, now, S) {
  if (!LOUDK.on) { S.loudAbs = -1; return; }
  // the floor is 0.12, not 0, so the first frames (eM 0) do not read -60 LKFS and seed `loudRange` with a 54 LU swing
  // the EMAs then spend 40 s forgetting. The loop's eM spans about 0.30-0.85, i.e. -11.1 .. -2.1 LKFS and ~9 LU of
  // range, which is a plausible modern master and gives a migrated scene the full 0..1 of base light over the loop.
  const lkfs = (x) => LOUD_OFS + 20 * Math.log10(clamp(x, 0.12, 1));
  S.loudM = lkfs(0.5 * S.eS + 0.5 * clamp(S.eS + 0.6 * S.hit, 0, 1));   // the 400 ms window: the fast energy plus the hit
  S.loudS = lkfs(S.eM);                                                 // the 3 s window: the 2.5 s energy
  const zs = Math.pow(10, S.loudS / 10);
  FL.pk = Math.max(zs, FL.pk * Math.pow(10, -LOUDK.PK_REL * dt / 10));
  // the same WARM-UP GUARD the real stage applies (engine/loud.js): until the stream has heard something louder the
  // peak sits WARM_LU above the present loudness, decaying with the stream's age — so the mirror has the real field's
  // SHAPE and not just its units, and `#test`'s first seconds are not the brightest of the loop.
  const pk = Math.max(LOUD_OFS + 10 * Math.log10(Math.max(FL.pk, 1e-12)),
    S.loudS + LOUDK.WARM_LU * Math.exp(-Math.max(0, now) / LOUDK.WARM_T));
  S.loudPk = pk;
  S.loudRel = clamp((S.loudS - pk + LOUDK.RANGE) / LOUDK.RANGE, 0, 1);
  // the range: the loop's own p95 - p10, approached as two one-sided EMAs of loudS (a histogram on 24 s of a 24 s loop
  // would read the loop's full span from the second lap and nothing before it)
  if (FL.n === 0) { FL.lo = FL.hi = S.loudS; }
  FL.n++;
  FL.hi += (S.loudS - FL.hi) * (S.loudS > FL.hi ? 1 - Math.exp(-dt / 0.5) : 1 - Math.exp(-dt / 40));
  FL.lo += (S.loudS - FL.lo) * (S.loudS < FL.lo ? 1 - Math.exp(-dt / 0.5) : 1 - Math.exp(-dt / 40));
  S.loudRange = clamp(FL.hi - FL.lo, 0, 14);
  S.loudAbs = 1;
}

// Plausible, deterministic values for the synapse stage's fields so DUST / MANDALA / TORUS react headlessly.
function fakeSynapse(dt, now, S, sec, T, e, kp, kickOn) {
  S.boundaryEvt = S.fakeoutEvt = S.moodEvt = false;
  S.lvl = e;
  S.kick = S.beat && kickOn ? 1 : S.kick * Math.exp(-dt / 0.16);
  S.snare = S.beat && kickOn && (S.beatCount & 1) ? 0.7 : S.snare * Math.exp(-dt / 0.13);
  S.hat = (S.beatPhase < 0.5) !== (hatPh < 0.5) && sec !== 'valley' ? 0.5 : S.hat * Math.exp(-dt / 0.06);
  hatPh = S.beatPhase;
  if (S.beat && kickOn) S.kickCount++;
  S.bassS = ema(S.bassS, S.bass, dt, 0.5);
  S.midS = ema(S.midS, S.mid, dt, 0.5);
  S.highS = ema(S.highS, S.high, dt, 0.5);
  S.sub = S.bass * 0.8;
  S.alive = 1;
  S.hush = sec === 'build' && T > 12.6 ? 1 : 0;
  S.calm = sec === 'valley' ? 0.8 : 0.2;
  S.resolve = 0;
  S.flow += dt * (0.015 + 0.9 * S.lvl + 0.6 * S.kick + 1.2 * S.dropEnv);
  S.flowBass += dt * (0.01 + S.bass);
  S.flowMid += dt * (0.01 + S.midS);
  S.flowHigh += dt * (0.01 + S.high);
  S.centroid = 0.35 + 0.3 * S.high;
  S.flux = kp;
  S.dirty = 0.2;
  S.punchy = 0.6;
  S.perc = 0.7;
  S.beatConf = S.gridTrust = S.barConf = 0.9;
  S.phraseConf = 0.8;
  S.beatSyn = S.beatCount + S.beatPhase;
  S.bpmSyn = S.bpm;
  S.barPos = (S.beatCount % 4) + S.beatPhase;
  S.barPhase = S.barPos / 4;
  S.phrasePos = (S.beatCount % 32) + S.beatPhase;
  S.phrase16Pos = (S.beatCount % 16) + S.beatPhase;
  S.bar = Math.floor(S.beatCount / 4);
  S.key = 9;
  S.mode = 1;
  S.keyConf = 0.8;
  S.novelty = S.sectionEvt ? 1 : S.novelty * Math.exp(-dt / 0.8);
  S.foote = S.novelty;
  S.boundaryEvt = S.sectionEvt;
  S.sectionAlt = S.sectionId;
  S.sectionReturn = S.repeat ? 1 : 0;
  S.sectionAge = S.beatCount;
  S.dropExpectedIn = sec === 'build' ? (13 - T) * S.bpm / 60 : -1;
  S.dropConf = S.build;
  S.valence = ema(S.valence, sec === 'peak' ? 0.75 : sec === 'valley' ? 0.35 : 0.5, dt, 3);
  S.arousal = ema(S.arousal, e, dt, 3);
  S.moodFamily = sec === 'peak' ? 3 : sec === 'valley' ? 0 : 1;
  S.riser = S.roll = S.build;
  S.swell = S.hp = 0;
  // textures: a three-hump log spectrum, the fake waveform, and the spectrogram ring
  const sp = TEX.spec, wv = TEX.wave;
  for (let j = 0; j < 256; j++) {
    const v = S.bass * Math.exp(-j / 40) + S.mid * Math.exp(-(j - 100) * (j - 100) / 800) + S.high * Math.exp(-(j - 200) * (j - 200) / 1500);
    sp[j] = clamp(v, 0, 1) * 255;
  }
  for (let i = 0; i < 512; i++) wv[i] = clamp(0.5 + S.wave[i * 4] * 1.2, 0, 1) * 255;
  TEX.hist.set(sp, TEX.row * 256);
  TEX.row = (TEX.row + 1) % 128;
  TEX.hop++;
}

export default { name: 'fake', start() {}, stop() {}, update: fakeMusic };
