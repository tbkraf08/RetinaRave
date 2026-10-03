// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// Synapse's built-in test synth. Six styles exercise the analysis: four-on-the-floor build/hush/drop (house), halftime
// 140, DnB 174, beatless ambient, a fake-out build, and an A-B-A-B form (section memory). 'mix' tours them.
// Selected by &demo=<style>. Lifted from synapse2.html makeDemo (526–583). Uses Math.random() noise: runs are not
// bit-identical. Source interface: { name, start(style), stop() }.
import { AU, initAudio } from '../audio.js';

export function makeDemo(ctx, out, style) {
  const master = ctx.createGain();
  master.gain.value = 0.8;
  master.connect(out);
  const noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  {
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  let beat = 0.47;
  const kick = (t, vol = 1, f0 = 160, f1 = 42, dur = 0.32) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + 0.12);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + dur + 0.03);
  };
  const noise = (t, dur, freq, type, vol, q) => {
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    s.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    if (q) f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f).connect(g).connect(master);
    s.start(t, Math.random() * 0.5);
    s.stop(t + dur + 0.02);
    return f;
  };
  const tone = (t, f, dur, vol, type = 'sawtooth', cut = 320, att = 0.02, det = 0) => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = f;
    o.detune.value = det;
    const lp = ctx.createBiquadFilter();
    lp.frequency.value = cut;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + att);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(lp).connect(g).connect(master);
    o.start(t);
    o.stop(t + dur + 0.05);
    return lp;
  };
  const pad = (t, dur, fs, vol, type = 'triangle') => fs.forEach((f) => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = f;
    o.detune.value = Math.random() * 16 - 8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + dur * 0.3);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + dur + 0.05);
  });
  const snare = (t, vol = 0.6) => { noise(t, 0.18, 1900, 'bandpass', vol, 0.8); tone(t, 190, 0.1, vol * 0.5, 'triangle', 2000, 0.002); };
  const hatc = (t, vol = 0.2) => noise(t, 0.04, 9500, 'highpass', vol);
  // build: roll 1/4 -> 1/8 -> 1/16 (-> 1/32), band-passed noise riser, swell; the last beat is left silent (the hush)
  const build = (t, i, len, maxDiv = 8) => {
    const p = i / (len - 1);
    if (i >= len - 1) return;
    const div = Math.min(maxDiv, p < 0.35 ? 1 : p < 0.65 ? 2 : p < 0.88 ? 4 : 8);
    for (let k = 0; k < div; k++) noise(t + k * beat / div, 0.09, 1600 + p * 1500, 'bandpass', 0.3 + p * 0.35);
    if (i === 0) {
      const T = beat * (len - 1), s = ctx.createBufferSource();
      s.buffer = noiseBuf;
      s.loop = true;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.01, t);
      g.gain.exponentialRampToValueAtTime(0.45, t + T - beat * 0.5);
      g.gain.setValueAtTime(0, t + T);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = 1.5;
      bp.frequency.setValueAtTime(500, t);
      bp.frequency.exponentialRampToValueAtTime(10000, t + T);
      s.connect(bp).connect(g).connect(master);
      s.start(t);
      s.stop(t + T);
    }
    if (i % 8 === 0) pad(t, beat * 8, [220, 277.2, 329.6, 554.4], 0.06);
  };
  const S = {
    house: { bpm: 128, len: 96, fn(c, t) {
      const notes = [55, 55, 65.4, 49];
      if (c < 48) {
        kick(t); tone(t + beat / 2, notes[(c >> 3) % 4], beat * 0.45, 0.4); hatc(t + beat / 2, 0.25);
        if (c % 2 === 1) noise(t, 0.16, 1800, 'bandpass', 0.5);
        if (c >= 16) { hatc(t + beat / 4, 0.12); hatc(t + beat * 0.75, 0.12); }
        if (c % 16 === 0) pad(t, beat * 16, [220, 277.2, 329.6], 0.05);
      } else if (c < 64) {
        if (c % 8 === 0) pad(t, beat * 8, [220, 261.6, 329.6, 440], 0.09);
        if (c % 4 === 2) noise(t, 0.08, 7000, 'highpass', 0.08);
      } else build(t, c - 64, 32);
    } },
    halftime: { bpm: 140, len: 96, fn(c, t) {
      const n = [41.2, 41.2, 49, 36.7][(c >> 3) % 4];
      if (c < 48) {
        const q = c % 4;
        if (q === 0) {
          kick(t, 1, 130, 38, 0.45);
          const lp = tone(t, n, beat * 3.6, 0.5, 'sawtooth', 180, 0.03);
          lp.Q.value = 8;
          for (let k = 0; k < 6; k++) { lp.frequency.setValueAtTime(140, t + k * beat * 0.66); lp.frequency.exponentialRampToValueAtTime(900, t + k * beat * 0.66 + beat * 0.3); }
          tone(t, n, beat * 3.6, 0.45, 'sine', 400, 0.02);
        }
        if (q === 2) snare(t, 0.75);
        if (c % 8 === 7) kick(t + beat / 2, 0.7, 130, 38, 0.3);
        hatc(t, 0.13); hatc(t + beat / 2, 0.2);
        if (c % 16 === 0) pad(t, beat * 16, [164.8, 196, 246.9], 0.035, 'sawtooth');
      } else if (c < 64) {
        if (c % 8 === 0) pad(t, beat * 8, [164.8, 196, 246.9, 329.6], 0.08);
        if (c % 4 === 2) noise(t, 0.2, 5000, 'highpass', 0.05);
      } else build(t, c - 64, 32, 8);
    } },
    dnb: { bpm: 174, len: 128, fn(c, t) {
      const n = [43.65, 43.65, 51.9, 38.9][(c >> 3) % 4];
      if (c < 64) {
        const q = c % 4;
        if (q === 0) kick(t, 1, 170, 48, 0.22);
        if (q === 2) kick(t + beat / 2, 0.9, 170, 48, 0.22);
        if (q === 1 || q === 3) snare(t, 0.7);
        hatc(t, 0.16); hatc(t + beat / 2, 0.22);
        if (c >= 32) hatc(t + beat * 0.75, 0.1);
        if (c % 2 === 0) { tone(t, n, beat * 1.9, 0.34, 'sawtooth', 260, 0.02, -12); tone(t, n, beat * 1.9, 0.34, 'sawtooth', 260, 0.02, 12); tone(t, n, beat * 1.9, 0.4, 'sine', 300); }
        if (c % 16 === 0) pad(t, beat * 16, [174.6, 207.7, 261.6], 0.03, 'sawtooth');
      } else if (c < 96) {
        if (c % 16 === 0) pad(t, beat * 16, [174.6, 207.7, 261.6, 349.2], 0.08);
        if (c % 8 === 4) noise(t, 0.3, 6000, 'highpass', 0.04);
        if (c >= 80 && c % 2 === 0) hatc(t, 0.1);
      } else build(t, c - 96, 32, 4);
    } },
    ambient: { bpm: 60, len: 64, fn(c, t) {
      const ch = [[261.6, 329.6, 392, 523.3], [174.6, 220, 261.6, 349.2], [196, 246.9, 293.7, 392], [261.6, 329.6, 392, 493.9]][(c >> 3) % 4];
      if (c % 8 === 0) {
        pad(t, 15, ch, 0.07, 'sine'); pad(t + 2, 12, ch.map((f) => f * 2.005), 0.018, 'triangle');
        const f = noise(t, 9, 700, 'bandpass', 0.05, 0.6);
        f.frequency.linearRampToValueAtTime(1800, t + 4); f.frequency.linearRampToValueAtTime(600, t + 9);
      }
      if (Math.random() < 0.4) { const f = [523.3, 587.3, 659.3, 784, 880, 1046.5][Math.floor(Math.random() * 6)]; tone(t + Math.random(), f, 2.5, 0.06, 'sine', 6000, 0.005); }
      if (c % 32 === 16) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = 65.4;
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.3, t + 5); g.gain.linearRampToValueAtTime(0.0001, t + 14);
        o.connect(g).connect(master); o.start(t); o.stop(t + 14.1);
      }
      if (c % 32 === 9) tone(t + 0.3, 55, 3.5, 0.45, 'sine', 300, 0.04); // an abrupt low note: must NOT read as a drop
    } },
    fakeout: { bpm: 128, len: 96, fn(c, t) {
      const notes = [55, 55, 65.4, 49];
      if (c < 32 || c >= 80) {
        kick(t); tone(t + beat / 2, notes[(c >> 3) % 4], beat * 0.45, 0.4); hatc(t + beat / 2, 0.25);
        if (c % 2 === 1) noise(t, 0.16, 1800, 'bandpass', 0.5);
        hatc(t + beat / 4, 0.12);
        if (c % 16 === 0) pad(t, beat * 16, [220, 277.2, 329.6], 0.05);
      } else if (c < 64) build(t, c - 32, 32); // full build + hush ...
      else { // ... into NOTHING (the fake-out); the groove walks back in 4 bars later
        if (c % 8 === 0) pad(t, beat * 8, [220, 261.6, 329.6, 440], 0.09);
        if (c % 4 === 2) noise(t, 0.08, 7000, 'highpass', 0.08);
      }
    } },
    aba: { bpm: 124, len: 96, fn(c, t) {
      if (c < 48) {
        const n = [55, 65.4, 55, 82.4][(c >> 2) % 4];
        kick(t); tone(t + beat / 2, n, beat * 0.45, 0.42); tone(t + beat * 0.75, n * 2, beat * 0.2, 0.2); hatc(t + beat / 2, 0.24);
        if (c % 2 === 1) noise(t, 0.16, 1800, 'bandpass', 0.5);
        if (c % 16 === 0) pad(t, beat * 16, [220, 261.6, 329.6], 0.05);
      } else {
        const q = c % 4, ar = [349.2, 440, 523.3, 659.3, 698.5, 659.3, 523.3, 440];
        if (q === 0) kick(t, 0.9, 120, 50, 0.25);
        if (q === 1) kick(t + beat / 2, 0.7, 120, 50, 0.2);
        if (q === 3) snare(t, 0.5);
        for (let k = 0; k < 4; k++) { hatc(t + k * beat / 4, k % 2 ? 0.1 : 0.2); tone(t + k * beat / 4, ar[(c * 4 + k) % 8] * (c % 8 >= 4 ? 1.5 : 1), beat * 0.22, 0.16, 'square', 5000, 0.003); }
        if (c % 8 === 0) tone(t, 43.65, beat * 7.5, 0.4, 'sine', 300, 0.05);
        if (c % 16 === 0) pad(t, beat * 16, [698.5, 880, 1046.5], 0.035);
      }
    } },
  };
  const tour = style === 'mix' ? [['house', 192], ['ambient', 40], ['dnb', 256], ['ambient', 32], ['halftime', 192], ['aba', 192]] : [[S[style] ? style : 'house', 1e9]];
  let next = ctx.currentTime + 0.15, b = 0, seg = 0;
  const step = (until) => {
    while (next < until) {
      if (b >= tour[seg][1]) { b = 0; seg = (seg + 1) % tour.length; next += 1.5; }
      const st = S[tour[seg][0]];
      beat = 60 / st.bpm;
      st.fn(b % st.len, next);
      next += beat;
      b++;
    }
  };
  return { master, step, live() { step(ctx.currentTime + 0.4); return setInterval(() => step(ctx.currentTime + 0.4), 100); } };
}

export const STYLES = ['house', 'halftime', 'dnb', 'ambient', 'fakeout', 'aba', 'mix'];

export function startDemoSynapse(style = 'house') {
  initAudio();
  const ctx = AU.ctx;
  if (AU.demo && AU.demo.style === style) { AU.demo.out.gain.value = 1; return; }
  if (AU.demo) { AU.demo.out.gain.value = 0; clearInterval(AU.demo.timer); }
  const out = ctx.createGain();
  out.connect(AU.bus);
  const mon = ctx.createGain();
  mon.gain.value = 0;
  out.connect(mon);
  mon.connect(ctx.destination);
  const d = makeDemo(ctx, out, style);
  AU.demo = { out, mon, style, timer: d.live() };
}

export default { name: 'demo-synapse', start: startDemoSynapse, stop() { if (AU.demo) AU.demo.out.gain.value = 0; } };
