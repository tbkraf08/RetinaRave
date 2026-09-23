// In-page frame probe for the real-window audit (v0.2 §17). Load it under http with
//   fetch('/tools/probe.js').then(r=>r.text()).then(eval)   (or paste it in DevTools)
// then PROBE.start(). It registers its own rAF AFTER the loop's (loop.js re-registers at the top of its callback, so
// the probe's callback runs after the frame is drawn) and records per frame: dt, the drawn frame's mean luminance
// (drawImage of the GL canvas into a 64x36 2D canvas — same task, before compositing), SC.cur/next/m, Q.q, the scene
// 6 rt.log, document.hidden. Events: scene switches, visibility changes, resizes, black frames (lum < 2), long
// frames (dt > 100 ms), the first frame back from a hidden tab ('back'), `next` changes ('next': a hard cut moves cur with
// next still -1; a soft switch sets next first), drop events ('drop'); per frame also FX.glitch (g), MS.hit, onset (o) and
// surpriseEvt (s) flags — the resume-hold check reads them (HARNESS "Hidden tab"). PROBE.summary() prints the counts; PROBE.frames holds the last 4000 frames; PROBE.q1 = a 1 Hz
// q sample. Nothing here touches MS or the engine: reads only.
(() => {
  const P = (window.PROBE = { frames: [], ev: [], q1: [], on: false, n: 0, t0: 0, last: 0, black: 0, long: 0, maxdt: 0 });
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 36;
  const c2 = cv.getContext('2d', { willReadFrequently: true });
  const gl = () => CARD.ctx.gl.canvas;
  const lum = () => { try { c2.drawImage(gl(), 0, 0, 64, 36); const d = c2.getImageData(0, 0, 64, 36).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += d[i] + d[i + 1] + d[i + 2]; return s / (d.length / 4) / 3; } catch (e) { return -1; } };
  let cur = -1, nxt = -1, size = '';
  // rAF does not run while hidden, so the transition is caught on the event; the next tick logs the first frame back
  document.addEventListener('visibilitychange', () => { evt('vis', { hidden: document.hidden ? 1 : 0, hop: CARD.ENGINE.tex ? CARD.ENGINE.tex.hop : undefined, log: CARD.REG[6] && CARD.REG[6].scene.rt.log, feigL: CARD.REG[6] && CARD.REG[6].scene.rt.label, flow: +(+CARD.MS.flow).toFixed(2) }); if (!document.hidden) P.back = true; });
  // frame-tick events carry the frame's own rAF time (so PROBE.frames.filter(f => f.t >= ev.t) starts at that frame); the
  // visibility event, outside any frame, uses the wall clock
  const evt = (k, x, ft) => P.ev.push(Object.assign({ t: ft !== undefined ? ft : +((performance.now() - P.t0) / 1000).toFixed(2), k }, x));
  function tick(t) {
    if (!P.on) return;
    requestAnimationFrame(tick);
    const dt = P.last ? t - P.last : 0; P.last = t; P.n++;
    const SC = CARD.SC, MS = CARD.MS, l = document.hidden ? -2 : lum();
    const f = { t: +((t - P.t0) / 1000).toFixed(3), dt: +dt.toFixed(1), lum: +l.toFixed(1), cur: SC.cur, next: SC.next, m: +(+SC.m).toFixed(2), q: +(+CARD.Q.q).toFixed(2), hid: document.hidden ? 1 : 0, g: +(+CARD.FX.glitch).toFixed(2), hit: +(+MS.hit).toFixed(2), o: MS.onset ? 1 : 0, s: MS.surpriseEvt ? 1 : 0 };
    P.frames.push(f); if (P.frames.length > 4000) P.frames.shift();
    if (dt > P.maxdt) P.maxdt = dt;
    if (dt > 100 && !document.hidden) { P.long++; evt('long', { dt: +dt.toFixed(0), lum: f.lum }, f.t); }
    if (l >= 0 && l < 2) { P.black++; evt('black', { lum: f.lum, cur: SC.cur, log: CARD.REG[6] && CARD.REG[6].scene.rt.log }, f.t); }
    // v0.3: `next` changes too, so a hard cut (cur moves with next still -1) reads apart from a soft switch (next -> id, then cur at the fade's end)
    if (SC.next !== nxt) { evt('next', { from: nxt, to: SC.next, cur: SC.cur, m: f.m }, f.t); nxt = SC.next; }
    if (MS.dropEvt) evt('drop', { lum: f.lum, dt: +dt.toFixed(0), strength: +(+MS.dropStrength).toFixed(2), cur: SC.cur }, f.t);
    if (SC.cur !== cur) { evt('scene', { from: cur, to: SC.cur, m: f.m, arc: MS.arc, dropEnv: MS.dropEnv, bEvt: MS.boundaryEvt, ret: MS.sectionReturn, fake: MS.fakeoutEvt, drop: MS.drop, dropT: MS.dropT }, f.t); cur = SC.cur; }
    if (P.back) { P.back = false; evt('back', { dt: +dt.toFixed(0), lum: f.lum, cur: SC.cur, hop: CARD.ENGINE.tex ? CARD.ENGINE.tex.hop : undefined, log: CARD.REG[6] && CARD.REG[6].scene.rt.log }, f.t); }
    const sz = gl().width + 'x' + gl().height; if (sz !== size) { evt('size', { sz, lum: f.lum, dt: +dt.toFixed(0) }, f.t); size = sz; }
    if (!P.q1.length || t - P.t0 >= P.q1.length * 1000) P.q1.push(+(+CARD.Q.q).toFixed(2));
  }
  P.start = () => { if (P.on) return 'already'; P.on = true; P.t0 = performance.now(); P.last = 0; requestAnimationFrame(tick); return 'probe on'; };
  P.stop = () => { P.on = false; return P.summary(); };
  P.since = (t) => P.frames.filter((f) => f.t >= t);
  P.summary = () => JSON.stringify({ n: P.n, s: +((performance.now() - P.t0) / 1000).toFixed(1), black: P.black, long: P.long, maxdt: +P.maxdt.toFixed(0), ev: P.ev.slice(-60), qmean: +(P.q1.reduce((a, b) => a + b, 0) / Math.max(1, P.q1.length)).toFixed(3), qmin: Math.min(...P.q1) });
})();
