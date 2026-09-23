// Summarise Q traces (tools/q-trace.sh output): per run, the 1 Hz q as mean / min, the scene sequence, every FEIGEN
// (id 6) visit with q at entry, min q during, min q in the 30 s after it left and q at exit + 30 s, and the mean q in
// the fixed windows the trace recipe pins (0–40 before the visit, 40–70 during, 70–100 after, 100–end) so `before`,
// `none` and `after` compare on the same clock. Then the mean of each column over the runs of a file.
// usage: node tools/q-stats.js tools/accept/v0.2/q-house-before.txt [more files]
import fs from 'node:fs';

const f2 = (x) => (Number.isFinite(x) ? x.toFixed(2) : '  -  ');
const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const min = (a) => (a.length ? Math.min(...a) : NaN);

function parseRun(lines) {
  const hz = [], ev = [];
  for (const l of lines) {
    let m = l.match(/^([\d.]+) bpm.* sc(\d+) .* q([\d.]+)\s*$/);
    if (m) { hz.push({ t: +m[1], sc: +m[2], q: +m[3] }); continue; }
    m = l.match(/^(SCENE|VISIT|DROP)@([\d.]+)(?: -> (\d+))?(.*)$/);
    if (m) ev.push({ kind: m[1], t: +m[2], id: m[3] !== undefined ? +m[3] : -1, rest: m[4].trim() });
  }
  return { hz, ev };
}

function stats(run) {
  const { hz, ev } = run;
  const qIn = (a, b) => hz.filter((r) => r.t >= a && r.t < b).map((r) => r.q);
  const qAt = (t) => { let best = null; for (const r of hz) if (!best || Math.abs(r.t - t) < Math.abs(best.t - t)) best = r; return best ? best.q : NaN; };
  const scenes = ev.filter((e) => e.kind === 'SCENE');
  const visits = [];
  for (let i = 0; i < scenes.length; i++) {
    if (scenes[i].id !== 6) continue;
    const t0 = scenes[i].t, t1 = i + 1 < scenes.length ? scenes[i + 1].t : (hz.length ? hz[hz.length - 1].t : t0);
    visits.push({ t0, t1, entry: qAt(t0), minIn: min(qIn(t0, t1)), minAfter: min(qIn(t1, t1 + 30)), after30: qAt(t1 + 30) });
  }
  const vis = ev.filter((e) => e.kind === 'VISIT');
  const label = vis.length > 1 ? vis[1].rest.replace(/^0\s*/, '') : '';
  const end = hz.length ? hz[hz.length - 1].t : 0;
  return {
    n: hz.length, mean: mean(hz.map((r) => r.q)), min: min(hz.map((r) => r.q)),
    w0: mean(qIn(0, 40)), w1: mean(qIn(40, 70)), w2: mean(qIn(70, 100)), w3: mean(qIn(100, end + 1)),
    min1: min(qIn(40, 70)), min2: min(qIn(70, 100)),
    visits, label, seq: scenes.map((e) => e.id).join(' '), drops: ev.filter((e) => e.kind === 'DROP').length,
  };
}

const cols = ['mean', 'min', 'w0', 'w1', 'w2', 'w3', 'min1', 'min2'];
const head = `run   q mean  q min | 0-40   40-70  70-100 100-  | min40-70 min70-100 | visits of 6 (entry → min during → min after 30 s → q at exit+30)`;
for (const f of process.argv.slice(2)) {
  const txt = fs.readFileSync(f, 'utf8');
  const runs = txt.split(/^== run \d+.*$/m).map((s) => s.split('\n').filter(Boolean)).filter((l) => l.length);
  console.log(`== ${f} (${runs.length} runs)`);
  console.log(head);
  const all = [];
  runs.forEach((lines, i) => {
    const s = stats(parseRun(lines));
    all.push(s);
    const v = s.visits.map((x) => `[${x.t0.toFixed(0)}–${x.t1.toFixed(0)} s: ${f2(x.entry)} → ${f2(x.minIn)} → ${f2(x.minAfter)} → ${f2(x.after30)}]`).join(' ');
    console.log(`r${i + 1}    ${f2(s.mean)}   ${f2(s.min)}  | ${f2(s.w0)}   ${f2(s.w1)}   ${f2(s.w2)}   ${f2(s.w3)}  | ${f2(s.min1)}     ${f2(s.min2)}      | ${v || 'none'}${s.label ? ' ' + s.label : ''}`);
    console.log(`      seq ${s.seq}  (${s.n} lines, ${s.drops} drops)`);
  });
  if (all.length > 1) {
    const m = {};
    for (const c of cols) m[c] = mean(all.map((s) => s[c]).filter(Number.isFinite));
    const vis = all.flatMap((s) => s.visits);
    console.log(`mean  ${f2(m.mean)}   ${f2(m.min)}  | ${f2(m.w0)}   ${f2(m.w1)}   ${f2(m.w2)}   ${f2(m.w3)}  | ${f2(m.min1)}     ${f2(m.min2)}      | ${vis.length} visits: entry ${f2(mean(vis.map((v) => v.entry)))} → min during ${f2(mean(vis.map((v) => v.minIn)))} → min after ${f2(mean(vis.map((v) => v.minAfter)))} → exit+30 ${f2(mean(vis.map((v) => v.after30)))}`);
  }
}
