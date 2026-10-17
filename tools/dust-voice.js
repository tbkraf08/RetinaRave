// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// DUST's voice on the picture — the reader for tools/dust-trace.js windows (DECISIONS §138; HARNESS "Vocal detector").
//   node tools/dust-voice.js tools/work/v138/*.json            # one row per trace, sorted by track then tag
// A row partitions the window's frames by the TRUTH — the hand passages of tools/truth/<track>.vox.json (§122's rule: grade
// against the truth, not against a detector) — and reads, on the SUNG frames, how much of the composited luminance follows the
// voice against how much follows the kick: r(lum, voxS) and r(lum, kickAmp) (Pearson, per frame), the gate's lit share
// (d_voxW > .5) of the sung and of the unsung frames, the vertical ride's p10 / p90 (d_voxRide — the §138 column; '–' on a
// trace cut before it), THE VERTICAL: r(lumY, voxY) on the sung frames with a pitch — the picture's luminance centroid (dust-
// trace's lumY, 0 bottom … 1 top) against the sung height — and lumY's p10 / p90 over them, the ribbon's share of the frames,
// and the mean luminance sung / unsung. An UNVOICED track (no passages) reads its unsung columns only — the control: w must be
// ~0 there and the before / after rows must agree. The trace must carry voxS and kickAmp in its MS fields (dust-trace.js's
// msFields argument; the default list has kickAmp, add voxS,voxHz,voxConf).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const files = process.argv.slice(2).filter((f) => f.endsWith('.json'));
if (!files.length) { console.error('usage: node tools/dust-voice.js <dust-trace.json …>'); process.exit(2); }

const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
function pearson(x, y) {
  const n = Math.min(x.length, y.length); if (n < 3) return NaN;
  const mx = mean(x), my = mean(y); let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { const a = x[i] - mx, b = y[i] - my; sxy += a * b; sxx += a * a; syy += b * b; }
  return sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : NaN;
}
const q = (a, p) => { if (!a.length) return NaN; const s = a.slice().sort((u, v) => u - v); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const f2 = (v, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : '–');
const pct = (v) => (Number.isFinite(v) ? (100 * v).toFixed(1) : '–');

function windowsOf(track) {
  const p = path.join(HERE, 'truth', track + '.vox.json');
  if (!fs.existsSync(p)) return [];
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  return (j.windows_hand || j.windows || []).map((w) => [+w.from, +w.to]);
}

const rows = [];
for (const f of files) {
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  const C = j.cols, T = j.t, n = T.length, W = windowsOf(j.track);
  const col = (k) => C[k] || null;
  const lum = col('lum'), lumY = col('lumY'), voxS = col('voxS'), kick = col('kickAmp'), vw = col('d_voxW'), vy = col('d_voxY'), ride = col('d_voxRide'), fB = col('d_formB');
  if (!lum || !voxS || !kick) { console.error(f + ': needs lum, voxS, kickAmp columns'); continue; }
  const sung = T.map((t) => W.some(([a, b]) => t >= a && t <= b));
  const pick = (a, on) => { const o = []; for (let i = 0; i < n; i++) if (sung[i] === on && a[i] !== null) o.push(a[i]); return o; };
  const pair = (a, b, on) => { const x = [], y = []; for (let i = 0; i < n; i++) if (sung[i] === on && a[i] !== null && b[i] !== null) { x.push(a[i]); y.push(b[i]); } return [x, y]; };
  const nS = sung.filter(Boolean).length;
  const litS = vw ? mean(pick(vw, true).map((v) => (v > 0.5 ? 1 : 0))) : NaN, litU = vw ? mean(pick(vw, false).map((v) => (v > 0.5 ? 1 : 0))) : NaN;
  const rSv = pearson(...pair(lum, voxS, true)), rSk = pearson(...pair(lum, kick, true)), rUk = pearson(...pair(lum, kick, false)), rUv = pearson(...pair(lum, voxS, false));
  let rY = NaN, cy = []; if (vy && lumY) { const x = [], y = []; for (let i = 0; i < n; i++) if (sung[i] && vy[i] !== null && vy[i] >= 0 && lumY[i] !== null) { x.push(lumY[i]); y.push(vy[i]); } rY = pearson(x, y); cy = x; }
  const rid = ride ? pick(ride, true) : null;
  const rib = fB ? mean(fB.map((v) => (v === 3 ? 1 : 0))) : NaN;
  const base = path.basename(f, '.json');
  rows.push({ track: j.track, base, t0: T[0], t1: T[n - 1], n, sungPct: nS / n, litS, litU, rSv, rSk, rUv, rUk, rY, cy10: q(cy, 0.1), cy90: q(cy, 0.9), ride10: rid ? q(rid, 0.1) : NaN, ride90: rid ? q(rid, 0.9) : NaN, rib, lumS: mean(pick(lum, true)), lumU: mean(pick(lum, false)) });
}
rows.sort((a, b) => (a.track + a.t0).localeCompare(b.track + b.t0) || a.base.localeCompare(b.base));
console.log('| trace | window | sung % | lit % sung / unsung | r(lum,voxS) sung | r(lum,kickAmp) sung | r(lum,voxS) unsung | r(lum,kickAmp) unsung | r(lumY,voxY) sung | lumY p10 / p90 | ride p10 / p90 | ribbon % | lum sung / unsung |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const r of rows) {
  console.log(`| ${r.base} | ${f2(r.t0, 0)}–${f2(r.t1, 0)} s | ${pct(r.sungPct)} | ${pct(r.litS)} / ${pct(r.litU)} | ${f2(r.rSv)} | ${f2(r.rSk)} | ${f2(r.rUv)} | ${f2(r.rUk)} | ${f2(r.rY)} | ${f2(r.cy10, 3)} / ${f2(r.cy90, 3)} | ${f2(r.ride10)} / ${f2(r.ride90)} | ${pct(r.rib)} | ${f2(r.lumS, 1)} / ${f2(r.lumU, 1)} |`);
}
