// Built-in demo signal: a small techno sketch at 126 BPM with intro / groove / break / build / drop so every
// event type occurs. Lifted from cardioid3 startDemo. Source interface: { name, start(), stop() }.
import { AU, initAudio } from '../audio.js';

export function startDemo() {
  initAudio();
  const ctx = AU.ctx;
  if (AU.demo) {
    AU.demo.out.gain.value = 1;
    return;
  }
  const out = ctx.createGain();
  out.connect(AU.bus);
  const mon = ctx.createGain();
  mon.gain.value = 0;
  out.connect(mon);
  mon.connect(ctx.destination);
  const nb = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const nd = nb.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  const f = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const s16 = 60 / 126 / 4;
  let step = 0, tN = ctx.currentTime + 0.15;
  const env = (g, t, a, pk, d) => {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(pk, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  };
  function osc(type, fr, t, dur, pk, a = 0.005, cut = 0) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.value = fr;
    let n = o;
    if (cut) {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = cut;
      o.connect(lp);
      n = lp;
    }
    n.connect(g);
    g.connect(out);
    env(g, t, a, pk, dur);
    o.start(t);
    o.stop(t + a + dur + 0.05);
    return o;
  }
  function noise(t, dur, pk, type, fr, a = 0.002) {
    const s = ctx.createBufferSource(), g = ctx.createGain(), fl = ctx.createBiquadFilter();
    s.buffer = nb;
    s.loop = true;
    fl.type = type;
    fl.frequency.value = fr;
    s.connect(fl);
    fl.connect(g);
    g.connect(out);
    env(g, t, a, pk, dur);
    s.start(t, Math.random() * 0.5);
    s.stop(t + a + dur + 0.05);
    return fl;
  }
  const kick = (t, g) => {
    const o = osc('sine', 150, t, 0.28, g, 0.002);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
  };
  const prog = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
  const sus = [[57, 62, 64, 58], [53, 58, 60, 66]];
  function sched() {
    while (tN < ctx.currentTime + 0.3) {
      const bar = Math.floor(step / 16) % 16, s = step % 16, t = tN, ci = Math.floor(step / 32) % 4;
      const sec = bar < 2 ? 'intro' : bar < 6 ? 'groove' : bar < 9 ? 'break' : bar < 10 ? 'build' : 'drop';
      const ch = sec === 'break' || sec === 'build' ? sus[ci % 2] : prog[ci];
      if (s === 0) {
        for (const m of ch) {
          for (const dt of [-7, 0, 7]) {
            const o = osc('sawtooth', f(m), t, s16 * 15, sec === 'drop' ? 0.05 : 0.04, 0.08,
              sec === 'break' ? 900 : sec === 'build' ? 2400 : 1600);
            o.detune.value = dt;
          }
        }
      }
      if (sec === 'groove' || sec === 'drop') {
        if (s % 4 === 0) kick(t, 0.9);
        if (s % 4 === 2) noise(t, 0.05, sec === 'drop' ? 0.22 : 0.14, 'highpass', 7000);
        if (s % 2 === 0 || sec === 'drop') {
          osc(sec === 'drop' ? 'sawtooth' : 'triangle', f(ch[0] - 24 + (s % 8 === 6 ? 12 : 0)), t, s16 * 0.9,
            sec === 'drop' ? 0.34 : 0.25, 0.004, sec === 'drop' ? 700 : 400);
        }
        if (s % 8 === 4) noise(t, 0.12, 0.2, 'bandpass', 1800);
      }
      if (sec === 'intro' && s % 4 === 2) noise(t, 0.04, 0.08, 'highpass', 8000);
      if (sec === 'break' || sec === 'drop' || sec === 'intro') {
        if (s % 2 === 1 || sec === 'drop') osc('square', f(ch[(s * 5) % ch.length] + 12 + (s % 3 === 0 ? 12 : 0)), t, s16 * 1.5, 0.05, 0.003, 3000);
      }
      if (sec === 'build') {
        const k = s < 8 ? 2 : 1;
        if (s % k === 0) noise(t, 0.07, 0.1 + 0.014 * s, 'bandpass', 1500 + 120 * s);
        if (s === 0) {
          const fl = noise(t, s16 * 15.5, 0.3, 'bandpass', 400, s16 * 15);
          fl.frequency.exponentialRampToValueAtTime(9000, t + s16 * 15.5);
          fl.Q.value = 2;
        }
      }
      step++;
      tN += s16;
    }
  }
  AU.demo = { out, mon, timer: setInterval(sched, 60) };
  sched();
}

export function stopDemo() {
  if (AU.demo) AU.demo.out.gain.value = 0;
}

// Toggle the monitor (audible) output of the demo synth.
export function toggleMonitor() {
  if (AU.demo) AU.demo.mon.gain.value = AU.demo.mon.gain.value ? 0 : 0.5;
}

export default { name: 'demo', start: startDemo, stop: stopDemo };
