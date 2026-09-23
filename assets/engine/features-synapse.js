// Synapse stages grafted into the engine as ONE additive stage: the Analyzer runs off an AudioWorklet tap (its own
// FFTs, ~10 ms hop) and this stage copies its output into MS under names that never collide with v3's fields.
// Canonical = v3 for every shared concept (bpm/beat/drop/section/chroma/tension); everything here is additive.
// Textures (spec / wave / hist) are exposed through TEX (engine/state.js); the core uploads them.
import { AU } from './audio.js';
import { MS, TEX } from './state.js';
import { ENGINE } from './engine.js';
import { Tap } from './synapse/tap.js';

export const tap = new Tap();
AU.onInit.push((ctx) => tap.attach(ctx, AU.bus));

export const SYN_FEATS = [
  'bassS', 'midS', 'highS', 'sub', 'lvl', 'kick', 'snare', 'hat', 'kickCount', 'alive', 'hush', 'calm', 'resolve',
  'flow', 'flowBass', 'flowMid', 'flowHigh', 'centroid', 'flux', 'dirty', 'punchy', 'perc',
  'beatConf', 'gridTrust', 'barConf', 'phraseConf', 'bar', 'barPos', 'barPhase', 'phrasePos', 'phrase16Pos', 'beatSyn', 'bpmSyn',
  'key', 'mode', 'keyConf', 'novelty', 'foote', 'boundaryEvt', 'sectionAlt', 'sectionReturn', 'sectionAge',
  'dropExpectedIn', 'dropConf', 'fakeoutEvt', 'valence', 'arousal', 'moodFamily', 'moodEvt', 'riser', 'roll', 'swell', 'hp',
];

export function synapseStage(dt, now, S) {
  const an = tap.an;
  if (!an) return; // no AudioContext yet (landing card) or the fake timeline (#test): the defaults / the fake's mirror stand
  S.boundaryEvt = S.fakeoutEvt = S.moodEvt = false; // (after the return: the stage runs after fake.update and used to wipe its events)
  const A = an.A;
  tap.frame(dt);
  ENGINE.extraMs += an.cpuMs; // the hop work happens in the worklet port handler, outside frame(): account for it here
  an.cpuMs = 0;
  S.bassS = A.bassS; S.midS = A.midS; S.highS = A.highS; S.sub = A.sub; S.lvl = A.level;
  S.kick = A.kick; S.snare = A.snare; S.hat = A.hat; S.kickCount = A.kickCount;
  S.alive = A.alive; S.hush = A.hush; S.calm = A.calm; S.resolve = A.resolve;
  S.flow = A.flow; S.flowBass = A.flowBass; S.flowMid = A.flowMid; S.flowHigh = A.flowHigh;
  S.centroid = A.centroid; S.flux = A.flux; S.dirty = A.dirty; S.punchy = A.punchy; S.perc = A.perc;
  S.beatConf = A.beatConf; S.gridTrust = A.gridTrust; S.barConf = A.barConf; S.phraseConf = A.phraseConf;
  S.beatSyn = A.beat; S.bpmSyn = A.bpm;
  // grid positions per frame from the beat clock and the anchors (grid() refreshes A.barPos only every 16 hops = 160 ms,
  // too coarse for the director's bar-line landing; §10)
  const wrap = (x, n) => ((x % n) + n) % n;
  S.barPos = wrap(A.beat - an.o4, 4); S.barPhase = S.barPos / 4; S.phrasePos = wrap(A.beat - an.o32, 32); S.phrase16Pos = wrap(A.beat - an.o16, 16);
  S.bar = Math.floor((A.beat - an.o4) / 4);
  S.key = A.key; S.mode = A.mode; S.keyConf = A.keyClar;
  S.novelty = A.novelty; S.foote = A.foote; S.sectionAlt = A.section; S.sectionReturn = A.sectionReturn; S.sectionAge = A.sectionAge;
  S.dropExpectedIn = A.dropExpectedIn; S.dropConf = A.dropConf;
  S.valence = A.valence; S.arousal = A.arousal; S.moodFamily = A.family;
  S.riser = A.ev.riser; S.roll = A.ev.roll; S.swell = A.ev.swell; S.hp = A.ev.hp;
  for (const e of A.events) {
    if (e.type === 'boundary') S.boundaryEvt = true;
    else if (e.type === 'fakeout') S.fakeoutEvt = true;
    else if (e.type === 'mood') S.moodEvt = true;
  }
  A.events.length = 0;
  TEX.spec = A.spec; TEX.wave = A.wave; TEX.hist = an.histTex; TEX.row = an.histRow; TEX.hop = an.hops;
}

ENGINE.addStage('synapse', synapseStage, SYN_FEATS);
