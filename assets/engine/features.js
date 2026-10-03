// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// LAYER 1: music-state extractor. Audio in (AU analysers), MS out. No GL, no DOM.
// Lifted from cardioid3 updateMusic; tempo/harmony/section live in features-slow.js.
import { clamp, ema, sstep, wrap1 } from '../math/util.js';
import { AU } from './audio.js';
import { MS, XS } from './state.js';
export { MS, XS };
import { slowAnalysis, identifySection } from './features-slow.js';
import { tempoEstimate } from './tempo.js';

export function setupBins(ctx) {
  const sr = ctx.sampleRate;
  XS.binF = sr / 2048;
  XS.binS = sr / 8192;
  XS.pcOf = new Int8Array(4096);
  for (let b = 1; b < 4096; b++) {
    const fq = b * XS.binS;
    XS.pcOf[b] = ((Math.round(12 * Math.log2(fq / 440)) % 12) + 12 + 9) % 12;
  }
  XS.bLo = Math.ceil(60 / XS.binS);
  XS.bLowC = Math.floor(240 / XS.binS);
  XS.bHiC = Math.floor(2100 / XS.binS);
  XS.bHiT = Math.floor(5000 / XS.binS);
}
AU.onInit.push(setupBins);

function bandRms(m, a, b) {
  let s = 0;
  for (let i = a; i < b; i++) s += m[i] * m[i];
  return Math.sqrt(s / (b - a));
}

export function updateMusic(dt, now) {
  const S = MS, X = XS;
  S.onset = S.beat = S.dropEvt = S.sectionEvt = S.surpriseEvt = S.resolveEvt = S.identifyEvt = false;
  // v0.3 resume-hold: for 1 s after a hidden tab comes back (ENGINE.resume → XS.holdUntil) no onset, drop or surprise
  // may fire. On the first frame back (XS.reseed) the slow followers — energy arc, history model, fingerprint — advance
  // by the gap they missed (dtF = dt + gap: as if the current value had held throughout), so a stale eM/eL/mu cannot
  // read the step as a drop or a surprise once the hold ends; the flux baseline re-seats (no onset from a 30 s-old spectrum).
  const hold = now < X.holdUntil, reseed = X.reseed, dtF = reseed ? dt + Math.max(0, now - X.envNow) : dt;
  // v0.3 §26 audit: `settle` — 2.5 s from the resume, longer than the hold. The followers snap to the resume frame's
  // instantaneous values, so for ~one time constant eM is one frame's energy, not a mean (the demo hidden between two
  // kicks came back with eS = eM = 0.24 and eS at 0.65 a second later: every kick cleared "e > eM + 0.25" and the first
  // onset that coincided was a drop, +1.3 s, 2 of 3 runs). The drop rules and the surprisal model's variance wait it out.
  const settle = now < X.holdUntil + 1.5;
  X.reseed = false;
  const live = AU.ctx && AU.mode !== 'none';
  if (live) {
    AU.fast.getFloatTimeDomainData(S.wave);
    AU.fast.getFloatFrequencyData(X.fdb);
  } else {
    S.wave.fill(0);
    X.fdb.fill(-200);
  }
  let s = 0;
  for (let i = 0; i < 2048; i++) s += S.wave[i] * S.wave[i];
  S.rms = Math.sqrt(s / 2048);
  const db = 20 * Math.log10(S.rms + 1e-9);
  const pT = sstep(-62, -44, db);
  S.presence = ema(S.presence, pT, dtF, pT > S.presence ? 0.25 : 1.4);
  const m = X.mag;
  let mx = 0;
  for (let i = 0; i < 1024; i++) {
    const d = X.fdb[i];
    m[i] = d > -160 ? Math.exp(d * 0.1151292546) : 0;
    if (m[i] > mx) mx = m[i];
  }
  // --- bands with adaptive gain (slow peak followers) ---
  const bF = XS.binF;
  const iB = clamp(Math.round(150 / bF), 2, 40);
  const iM = clamp(Math.round(2000 / bF), iB + 4, 600);
  const iH = clamp(Math.round(12000 / bF), iM + 4, 1023);
  const rb = bandRms(m, 1, iB + 1), rm = bandRms(m, iB + 1, iM), rh = bandRms(m, iM, iH), dec = Math.exp(-dt / 40);
  // gain rides the peak of the *smoothed* band so sustained material reads near 1, transients above the floor
  // dtF: on the resume frame the band followers snap to the current band (v0.3 §26 audit — a follower left to catch up
  // on `dt` fed the surprisal model a moving input for ~1 s while its mean lagged, so the raw surprisal ramped 0.1 → 1.5
  // and a surprise fired the moment the hold ended); every other frame dtF = dt.
  X.aB = ema(X.aB || 0, rb, dtF, rb > (X.aB || 0) ? 0.03 : 0.16);
  X.aM = ema(X.aM || 0, rm, dtF, rm > (X.aM || 0) ? 0.04 : 0.2);
  X.aH = ema(X.aH || 0, rh, dtF, rh > (X.aH || 0) ? 0.03 : 0.14);
  X.fB = ema(X.fB || 0, rb, dtF, rb > (X.fB || 0) ? 0.012 : 0.07);
  X.pkAll = Math.max(X.pkAll * dec, mx, 1e-5);
  X.pkB = Math.max(X.pkB * dec, X.aB, X.pkAll * 0.03);
  X.pkM = Math.max(X.pkM * dec, X.aM, X.pkAll * 0.01);
  X.pkH = Math.max(X.pkH * dec, X.aH, X.pkAll * 0.002);
  S.bass = Math.pow(X.aB / X.pkB, 0.8) * S.presence;
  S.mid = Math.pow(X.aM / X.pkM, 0.7) * S.presence;
  S.high = Math.pow(X.aH / X.pkH, 0.7) * S.presence;
  S.bassFast = Math.min(1, Math.pow(X.fB / X.pkB, 0.8)) * S.presence;
  // --- spectral flux onsets ---
  let flux = 0, bflux = 0;
  const g = 100 / X.pkAll;
  for (let i = 1; i < 420; i++) {
    const lm = Math.log(1 + g * m[i]), d = lm - X.lmPrev[i];
    X.lmPrev[i] = lm;
    if (d > 0) {
      flux += d;
      if (i <= iB) bflux += d;
    }
  }
  if (reseed) flux = bflux = 0; // the first frame back: lmPrev was the spectrum before the gap, not an onset
  const o = (flux + 3 * bflux) * 0.01;
  let mean = 0;
  for (let i = 0; i < 96; i++) mean += X.oRing[i];
  mean /= 96;
  let sd = 0;
  for (let i = 0; i < 96; i++) {
    const d = X.oRing[i] - mean;
    sd += d * d;
  }
  sd = Math.sqrt(sd / 96);
  const thr = mean + 1.5 * sd + 0.02;
  X.oRing[X.oi] = o;
  X.oi = (X.oi + 1) % 96;
  if (o > thr && now - X.lastOnset > 0.09 && S.presence > 0.1 && !hold) {
    S.onset = true;
    X.lastOnset = now;
    S.hitStrength = clamp((o - thr) / (3 * sd + 0.05), 0, 1);
    S.hit = Math.max(S.hit, S.hitStrength);
    S.onsetRate += 1;
  }
  S.hit *= Math.exp(-dt / 0.14);
  S.onsetRate *= Math.exp(-dt / 1.0);
  // --- tempo + beat phase: autocorrelation of the 100 Hz onset envelope, comb-aligned PLL ---
  X.envAcc += Math.min(now - (X.envNow || now), 0.5) * 100; // raw clock, not the clamped dt: a stalled frame must not shrink the ring's seconds (§9)
  X.envNow = now;
  while (X.envAcc >= 1) {
    X.env[X.ei] = o;
    X.ei = (X.ei + 1) % 800;
    X.envAcc -= 1;
  }
  X.tempoT += dt;
  if (X.tempoT > 0.5) {
    X.tempoT = 0;
    tempoEstimate();
  }
  const rate = (S.bpm / 60) * sstep(0.02, 0.3, S.presence), pc = S.phaseCorr * (1 - Math.exp(-dt / 0.18));
  S.phaseCorr -= pc;
  S.beatPhase += rate * dt + pc;
  if (S.onset && S.hitStrength > 0.5 && S.bassFast > 0.5) {
    const e = wrap1(-S.beatPhase);
    if (Math.abs(e) < 0.18) S.phaseCorr += e * 0.25;
  }
  if (S.beatPhase >= 1) {
    S.beatPhase -= 1;
    S.beatCount++;
    S.beat = true;
  }
  if (S.beatPhase < 0) S.beatPhase = 0;
  // --- energy arc ---
  for (const k of ['bass', 'mid', 'high', 'bassFast', 'eS', 'eM', 'eL', 'build', 'tension', 'surprisal', 'hit']) if (!isFinite(S[k])) S[k] = 0;
  if (!isFinite(S.eMax)) S.eMax = 0.3;
  const e = Math.pow(clamp(0.45 * S.bass + 0.35 * S.mid + 0.2 * S.high, 0, 1), 0.8);
  S.highM = ema(S.highM || 0, S.high, dtF, 3);
  S.eS = ema(S.eS, e, dtF, 0.3);
  S.eM = ema(S.eM, e, dtF, 2.5);
  S.eL = ema(S.eL, e, dtF, 12);
  S.eMax = Math.max(S.eMax * Math.exp(-dtF / 60), S.eM, 0.15);
  if (reseed) S.absentT = 0; // v0.3 §26 audit: absence before the gap is no evidence after it
  const prevAbsent = S.absentT;
  if (S.bassFast > 0.5) S.absentT = 0;
  else if (S.presence > 0.3) S.absentT += dt;
  if (prevAbsent > 1.8 && S.bassFast > 0.5 && now - X.lastOnset < 0.1 && now - S.lastDrop > 5 && !settle) {
    S.dropEvt = true;
    S.dropStrength = clamp(0.45 + prevAbsent / 10 + S.build * 0.4, 0, 1);
    S.lastDrop = now;
    S.dropEnv = 1;
    S.build = 0;
  }
  // second drop path for tracks whose bass never leaves: a build was recently in progress and a hard bass hit lands
  // well above the medium-term energy
  S.buildPk = Math.max((S.buildPk || 0) * Math.exp(-dtF / 3), S.build);
  S.liveT = S.presence > 0.3 ? (S.liveT || 0) + dt : 0; // peak followers need a few seconds before ratios mean anything
  // gate: a build was seen, or we have sat in a valley/build arc for 3 s (quiet -> loud on a bass hit). arc already lags eM
  // by ~2.5 s. raw e, not eS: the first kick must count, eS lags it by 0.3 s
  const lowArc = (S.arc === 'valley' || S.arc === 'build') && (S.arcT || 0) > 1;
  // three gates: a build led here, or a quiet arc led here, or the energy more than doubles on this hit (groove kicks ~1.8x eM, drops 3x)
  if (!S.dropEvt && !settle && S.liveT > 4 && S.onset && S.hitStrength > 0.6 && S.bassFast > 0.6 &&
    (((S.buildPk > 0.5 || lowArc) && e > S.eM + 0.25) || e > 2 * S.eM + 0.1) && now - S.lastDrop > 8) {
    S.dropEvt = true;
    S.dropStrength = clamp(0.35 + 0.6 * Math.max(S.buildPk, e - S.eM), 0, 1);
    S.lastDrop = now;
    S.dropEnv = 1;
    S.build = 0;
  }
  S.dropEnv *= Math.exp(-dt / (2.2 * 60 / S.bpm));
  const ab = S.absentT > 1.5 ? 1 : 0;
  const bRaw = clamp(2 * Math.max(0, S.eM - S.eL) * (1 - ab) + ab * (0.3 + 0.03 * Math.min(S.absentT, 6) + 0.13 * Math.max(0, S.onsetRate - 3.5) +
    2.2 * Math.max(0, S.high - S.highM) + 0.25 * S.tension), 0, 1);
  S.build = ema(S.build, bRaw, dtF, bRaw > S.build ? 0.8 : 0.6);
  let arc = S.presence < 0.15 ? 'idle'
    : (now - S.lastDrop < 3 || (S.arc === 'peak' && S.eM > 0.6 * S.eMax && S.absentT < 1.5)) ? 'peak'
      : S.build > 0.5 ? 'build' : S.eM < 0.6 * S.eMax ? 'valley' : 'sustain';
  S.arcT = (S.arcT || 0) + dt;
  if (arc !== S.arc) {
    S.arcHold += dt;
    if (S.arcHold > 0.8 || arc === 'peak') {
      S.arc = arc;
      S.arcHold = 0;
      S.arcT = 0;
      if (now - S.lastSection > 4) S.sectionEvt = true;
    }
  } else S.arcHold = 0;
  if (S.beat && S.beatCount - X.phraseBeat >= 32) {
    X.phraseBeat = S.beatCount;
    if (Math.abs(S.eM - X.eAtChange) > 0.12 && now - S.lastSection > 8) S.sectionEvt = true;
  }
  // --- harmony / tension from the long window (every other frame) ---
  if (live && (reseed || (X.slowTick++ & 1) === 0)) slowAnalysis(reseed ? dtF : dt * 2, now); // the resume frame always runs it, with the gap: chroma snaps too (same audit)
  S.suspension = ema(S.suspension, sstep(0.55, 0.8, S.tension) * S.presence, dt, 1.3);
  if (S._susHi && S.tension < 0.4) {
    S.resolveEvt = true;
    S._susHi = false;
  }
  if (S.suspension > 0.6) S._susHi = true;
  S.intensity = clamp(0.62 * S.eS + 0.38 * S.tension * S.presence, 0, 1);
  // --- surprisal: z-scored prediction error of an exponential-history model on chroma + bands ---
  const x = X._x || (X._x = new Float32Array(15));
  for (let i = 0; i < 12; i++) x[i] = S.chroma[i];
  X.sB = ema(X.sB || 0, S.bass, dtF, 0.5);
  X.sM = ema(X.sM || 0, S.mid, dtF, 0.5);
  X.sH = ema(X.sH || 0, S.high, dtF, 0.5);
  x[12] = X.sB;
  x[13] = X.sM;
  x[14] = X.sH;
  let err = 0;
  // v0.3 §26 audit: during `settle` the model re-learns its mean fast and learns no variance — the inputs settle over
  // ~1.5 s after a gap (a real track's raw surprisal ramped 0.1 → 1.5 with the mean lagging at 1.5 s, and a surprise cut
  // followed the hold in 3 of 4 restores); a musical surprise or drop inside those 2.5 s is the one thing this gives up.
  const k1 = 1 - Math.exp(-dtF / (settle ? 0.25 : 1.5)), k2 = 1 - Math.exp(-dtF / 10);
  for (let i = 0; i < 15; i++) {
    const d = x[i] - X.mu[i];
    err += d * d / (X.va[i] + 2e-4);
    // v0.3 §26 audit: the gap carries no variance. Advancing va by dtF collapsed it to one stale d² (k2 → 0.86), so every
    // ordinary beat after the hold read as a surprise (a hard cut 1.5–3 s after 3 of 4 restores). The mean still jumps
    // to the current frame (k1 → 1: as if held throughout); the variance keeps its pre-gap value and the reseed frame's
    // error — 'now vs 20 s ago' — is not scored.
    if (!reseed && !settle) X.va[i] += (d * d - X.va[i]) * k2;
    X.mu[i] += d * k1;
  }
  if (!reseed) S.surRaw = Math.sqrt(err / 15);
  const sT = clamp((S.surRaw - 0.9) / 0.8, 0, 1) * S.presence;
  S.surprisal = ema(S.surprisal, sT, dtF, sT > S.surprisal ? 0.05 : 0.5);
  if (S.surprisal > 0.62 && now - S.lastSurprise > 2.5 && !hold) {
    S.surpriseEvt = true;
    S.lastSurprise = now;
    if (now - S.lastSection > 6) S.sectionEvt = true;
  }
  // --- section fingerprint + repeat detection ---
  const fp = X.fp, kf = 1 - Math.exp(-dtF / 3);
  for (let i = 0; i < 12; i++) fp[i] += (S.chroma[i] * 2 - fp[i]) * kf;
  fp[12] += (S.bass - fp[12]) * kf;
  fp[13] += (S.mid - fp[13]) * kf;
  fp[14] += (S.high - fp[14]) * kf;
  fp[15] += (S.onsetRate / 10 - fp[15]) * kf;
  fp[16] += (S.regularity - fp[16]) * kf;
  if (S.sectionEvt) {
    S.lastSection = now;
    S.identifyAt = now + 2.2;
    X.eAtChange = S.eM;
    X.phraseBeat = S.beatCount;
  }
  if (S.identifyAt > 0 && now > S.identifyAt) {
    S.identifyAt = -1;
    identifySection();
    S.identifyEvt = true;
  }
}
