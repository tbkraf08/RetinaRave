// the S5 PEN ruler on the pure replay (no GL): RaindropsOnRoses's real trace through inject2 at 60 fps, per window — the pen's frames vs the
// floor's (the control: PEN_SRC 0), the ink/s of each (equal by construction), the STROKE per beat (Σ the position's move over each beat, p50 /
// p90 — "is a line being drawn": the dye's path along the axis), the largest per-frame step (the §1.9 step; ≤ PEN_VMAX · dt), the tritone lifts,
// the x span (p10 / p50 / p90), the drift speed, the push's largest |(dx, dy)| against the floor's 0.
//   node tools/work/fluid2/s5/ruler.js '<tag>|<K2 json>' …     (the windows below; the trace tools/truth/traces/RaindropsOnRoses-map0.json)
import fs from 'node:fs';
import { plan, mkState, K } from '../../../../assets/core/fluid/inject2.js';
import { K as KB } from '../../../../assets/core/fluid/inject.js';
const J = JSON.parse(fs.readFileSync('tools/truth/traces/RaindropsOnRoses-map0.json', 'utf8'));
const WIN = { groove: [[76, 110]], breakdown: [[111.4, 137.1]], thin: [[111, 116]], pads: [[118, 126]], outro: [[127, 137]], all: [[24, 222]] };
const DEF = { ...K };
const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : NaN; };
function run(over) {
  Object.assign(K, DEF, over); const st = mkState(), C = J.cols, T = J.t, out = []; let prev = null;
  for (let i = 0; i < J.f.length; i++) {
    const S = {}; for (const k in C) S[k] = C[k][i]; S.seed = { a: 0.37 }; S.subNote = S.subNote == null ? -1 : S.subNote;
    const dt = prev === null ? 1 / 60 : Math.max(1e-3, Math.min(0.1, T[i] - prev)); prev = T[i];
    const P = plan(S, dt, st); const fl = P.splats.find((s) => s.k === 'floor'), pn = P.splats.find((s) => s.k === 'pen');
    out.push({ t: +T[i], dt, bc: S.beatCount, pen: P.pen, dd: P.params.dyeDiss, ink: P.ink, floorInk: fl ? (fl.r + fl.g + fl.b) * (fl.rad / KB.RADIUS) ** 2 : 0, push: pn ? Math.hypot(pn.dx, pn.dy) : 0, gain: P.gain });
  }
  Object.assign(K, DEF); return out;
}
const specs = process.argv.slice(2);
const ctrl = run({ PEN_SRC: 0 });
console.log('tag | window | frames | floor fr | pen fr | floor ink/s | pen ink/s | ink rate pen/ctrl | dyeDiss max rel | stroke/beat p50 | p90 | step max | lim | wraps | x p10/p50/p90 | span | v p50 | push max');
for (const spec of specs) {
  const [tag, k2] = spec.split('|'); const R = run(k2 ? JSON.parse(k2) : {});
  for (const [w, spans] of Object.entries(WIN)) {
    const idx = []; R.forEach((r, i) => { if (spans.some(([a, b]) => r.t >= a && r.t < b)) idx.push(i); });
    if (!idx.length) continue;
    const secs = idx.reduce((a, i) => a + R[i].dt, 0);
    const fFr = idx.filter((i) => ctrl[i].floorInk > 0).length, pFr = idx.filter((i) => R[i].pen.on).length;
    const fInk = idx.reduce((a, i) => a + ctrl[i].floorInk, 0) / secs, pInk = idx.reduce((a, i) => a + R[i].pen.ink, 0) / secs;
    const rate = q(idx.map((i) => R[i].ink / Math.max(1e-12, ctrl[i].ink)), 0.5), ddRel = Math.max(...idx.map((i) => Math.abs(R[i].dd - ctrl[i].dd) / Math.max(1e-9, ctrl[i].dd)));
    const beats = {}; for (const i of idx) { const b = R[i].bc; beats[b] = (beats[b] || 0) + R[i].pen.step; } const bl = Object.values(beats);
    const stepMax = Math.max(...idx.map((i) => R[i].pen.step)), lim = Math.max(...idx.map((i) => K.PEN_VMAX * R[i].dt)), wraps = idx.reduce((a, i) => a + R[i].pen.wrap, 0);
    const xs = idx.filter((i) => R[i].pen.on).map((i) => R[i].pen.x), vs = idx.map((i) => R[i].pen.v), push = Math.max(...idx.map((i) => R[i].push));
    console.log(`${tag} | ${w} | ${idx.length} | ${fFr} | ${pFr} | ${fInk.toExponential(3)} | ${pInk.toExponential(3)} | ${rate.toFixed(6)} | ${ddRel.toExponential(2)} | ${q(bl, .5).toFixed(4)} | ${q(bl, .9).toFixed(4)} | ${stepMax.toFixed(5)} | ${lim.toFixed(5)} | ${wraps} | ${q(xs, .1).toFixed(3)}/${q(xs, .5).toFixed(3)}/${q(xs, .9).toFixed(3)} | ${(q(xs, .9) - q(xs, .1)).toFixed(3)} | ${q(vs, .5).toFixed(4)} | ${push.toExponential(2)}`);
  }
}
