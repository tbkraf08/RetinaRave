import { plan, mkState } from '/home/toma/Documents/Kraftek/RetinaRave/assets/core/fluid/inject.js';
import * as I2 from '/home/toma/Documents/Kraftek/RetinaRave/assets/core/fluid/inject2.js';
import fs from 'node:fs';
const D = '/home/toma/Documents/Kraftek/RetinaRave/tools/truth/traces/';
const q = (a, p) => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const f = (x, d = 2) => (+x).toFixed(d);
console.log('| track | frames | music s | Σ ink rig / base (NOTE_COL 1: the note hues luminance) | clears | kicks C · iL · iR · oL · oR (pairs) | outer before 1st clear | snare q0·q1·q2·q3 | beams 0..6 | lead on % · deg bins · y p10/p50/p90 | lead max step | clears = blinders | quad % |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const name of fs.readdirSync(D).filter((n) => n.endsWith('-map1.json') || n === 'rec-map0.json')) {
  const J = JSON.parse(fs.readFileSync(D + name)); const C = J.cols, T = J.t; let prev = null;
  const sa = mkState(), sb = I2.mkState(); const A = [], B = [];
  for (let i = 0; i < J.f.length; i++) {
    const S = {}; for (const k in C) S[k] = C[k][i]; S.seed = { a: 0.37 }; S.subNote = S.subNote == null ? -1 : S.subNote;
    const dt = prev === null ? 1 / 60 : Math.max(1e-3, Math.min(0.1, T[i] - prev)); prev = T[i];
    A.push(plan(S, dt, sa)); B.push(I2.plan(S, dt, sb));
  }
  const mus = B.map((r, i) => i).filter((i) => C.presence[i] > 0.3);
  const dyeSum = (P, skip) => P.splats.reduce((a, s) => a + (s.k === skip ? 0 : (s.r + s.g + s.b) * (s.rad / 0.0025) ** 2), 0);
  const inkA = mus.reduce((a, i) => a + dyeSum(A[i], 'drop'), 0), inkB = mus.reduce((a, i) => a + dyeSum(B[i], 'blind'), 0);
  const kicks = B.filter((r) => r.rig.kick.length && r.splats.some((s) => s.k === 'kick'));
  const cnt = [0, 1, 2, 3, 4].map((m) => kicks.filter((r) => r.rig.kick.includes(m)).length), pairs = kicks.filter((r) => r.rig.kick.length === 2).length;
  const first = B.findIndex((r) => r.drop === 1), outerEarly = B.slice(0, first < 0 ? B.length : first).filter((r) => r.rig.kick.includes(3) && r.splats.some((s) => s.k === 'kick')).length;
  const sn = [0, 1, 2, 3].map((qq) => B.filter((r) => r.rig.side === qq && r.splats.some((s) => s.k === 'snare')).length);
  const beams = [0, 1, 2, 3, 4, 5, 6].map((b) => B.reduce((a, r) => a + r.rig.hats.filter((x) => x === b).length, 0));
  const leads = B.filter((r) => r.rig.lead.on), degs = new Set(leads.map((r) => r.rig.lead.deg)).size, ys = leads.map((r) => r.rig.lead.y);
  let maxStep = 0; for (let i = 1; i < B.length; i++) if (B[i].rig.lead.on && B[i - 1].rig.lead.on) maxStep = Math.max(maxStep, Math.abs(B[i].rig.lead.y - B[i - 1].rig.lead.y));
  const clears = B.filter((r) => r.drop === 1).length, blinds = B.filter((r) => r.rig.blind).length;
  const quad = 100 * B.filter((r) => r.rig.quad > 0).length / Math.max(1, mus.length);
  console.log(`| ${name.replace('.json', '')} | ${B.length} | ${Math.round(mus.length / 60)} | ${f(inkB / Math.max(1e-9, inkA), 3)} | ${clears} | ${cnt.join(' · ')} (${pairs}) | ${outerEarly} | ${sn.join('·')} | ${beams.join(' ')} | ${f(100 * leads.length / Math.max(1, mus.length), 0)} · ${degs} · ${f(q(ys, .1))}/${f(q(ys, .5))}/${f(q(ys, .9))} | ${f(maxStep, 4)} | ${clears} = ${blinds} | ${f(quad, 0)} |`);
}
