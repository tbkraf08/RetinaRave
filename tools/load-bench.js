// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// The load bench (DECISIONS §130): the quality knob q, Q.fps, ENGINE.ms and the ears' ms per frame sampled every 500 ms of a REAL-TIME
// run (no CLOCK: the governor sees the real frame times, the file load's stall included) — the measurement behind "q drops twice in the
// first second of every file load". Muted (MUTE=1 → --mute-audio), GPU=1, one page per run, nothing else on the machine (HARNESS "Q trace").
//   GPU=1 PORT=88xx node tools/load-bench.js '<hash>' [secs=40] [runs=1]
//   e.g. node tools/load-bench.js 'test&track=IBelongHere&scene=4'      (file mode, the lane)   · '…&vox=live' (the CNN on a file)
//        node tools/load-bench.js 'test&scene=4'                        (the fake timeline: no load, the reference q)
// Per run one line: q at 1..10 s, 20 s, 40 s of page time · the second the file opened at · min q after 1 s and the drops after it ·
// fps mean 5–40 s · ENGINE.ms mean 10–40 s · the ears' ms per frame 10–40 s (EARS.cpuAcc / frames: the PCM listener's cost) · voxFrom.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const hash = process.argv[2] || 'test&scene=4', SECS = +(process.argv[3] || 40), RUNS = +(process.argv[4] || 1);
const SAMPLER = "window.__LB={s:[],t0:performance.now()};setInterval(()=>{const C=window.CARD,E=C.ENGINE,F=E.AU.file,X=E.EARS;window.__LB.s.push({t:+((performance.now()-window.__LB.t0)/1000).toFixed(2),q:+C.Q.q.toFixed(3),fps:+C.Q.fps.toFixed(1),ms:+E.ms.toFixed(3),cpu:X?+X.cpuAcc.toFixed(2):0,fr:X?X.frames:0,open:!!(F&&F.open),ph:F?+F.ph.toFixed(2):-1,load:C.Q.load===undefined?null:C.Q.load,vf:X?X.voxFrom:''})},500);'sampler on'";
const steps = JSON.stringify([{ until: 'window.CARD' }, { eval: SAMPLER }, { wait: SECS * 1000 }, { eval: 'JSON.stringify(window.__LB.s)' }, { eval: "'errs '+JSON.stringify(CARD.ERRS)" }]);
const at = (s, t) => { let b = null; for (const r of s) if (!b || Math.abs(r.t - t) < Math.abs(b.t - t)) b = r; return b; };
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
for (let r = 1; r <= RUNS; r++) {
  const out = spawnSync('node', [path.join(HERE, 'cdp.js'), hash, steps], { encoding: 'utf8', env: { ...process.env, MUTE: process.env.MUTE || '1' } });
  const lines = (out.stdout + out.stderr).split('\n');
  const ev = lines.filter((l) => l.startsWith('EVAL')).map((l) => l.replace(/^EVAL.*?=> /, ''));
  const js = ev.find((l) => /^"?\[/.test(l));
  if (!js) { console.log(`run ${r}: no samples — ${lines.filter((l) => /EXC|TIMEOUT|ERR/.test(l)).slice(0, 3).join(' | ')}`); continue; }
  const s = JSON.parse(js.startsWith('"') ? JSON.parse(js) : js);
  const errs = ev.find((l) => l.includes('errs')) || '';
  const open = s.find((x) => x.open), tOpen = open ? open.t : -1;
  const after1 = s.filter((x) => x.t >= 1);
  const drops = []; for (let i = 1; i < after1.length; i++) if (after1[i].q < after1[i - 1].q - 1e-6) drops.push(`${after1[i].t}s ${after1[i - 1].q}→${after1[i].q}`);
  const qs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 40].filter((t) => t <= SECS).map((t) => `${t}:${at(s, t).q.toFixed(2)}`).join(' ');
  const a10 = at(s, 10), a40 = at(s, Math.min(40, SECS));
  const ears = a40.fr > a10.fr ? (a40.cpu - a10.cpu) / (a40.fr - a10.fr) : NaN;
  const fps = mean(s.filter((x) => x.t >= 5).map((x) => x.fps)), ms = mean(s.filter((x) => x.t >= 10 && x.t <= 40).map((x) => x.ms));
  console.log(`run ${r} [${hash}] q@ ${qs} | open ${tOpen >= 0 ? tOpen + ' s' : '-'} | min q after 1 s ${Math.min(...after1.map((x) => x.q)).toFixed(2)} drops ${drops.length ? drops.join(', ') : 'none'} | fps ${fps.toFixed(1)} | ENGINE.ms ${ms.toFixed(3)} | ears ${isFinite(ears) ? ears.toFixed(3) : '-'} ms/frame | vox ${a40.vf || '-'} | ${errs.replace(/"/g, '')}`);
}
