// The director's bids at 1 Hz with the director FREE (no &scene=): the four real score() values (NAV / DUST / TORUS2 / FLUID — the
// §114 roster), the fields they read, the arc, the scene on screen, and every SCENE@ / SWITCH@ / DROP@ line — then who leads raw
// (no noise, no dock), the medians, and the bids on the second of every pick. The question §114 owed: how often FLUID is picked,
// ON WHAT. A demo style runs in real time (house 120 s, aba 190 s, mix 360 s); a library track runs under CLOCK=1 from 0 for
// 110 s (f0 must read 2). usage: [GPU=1] PORT=89xx node tools/director-bids.js <house|aba|mix|Track> [out.json]
//        node tools/director-bids.js --from <out.json>…   (summarise saved samples; the §115 proofs are tools/accept/v0.36/director-bids-*.json)
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const IDS = [0, 1, 3, 12], NAME = { 0: 'NAV', 1: 'DUST', 3: 'TORUS2', 12: 'FLUID' };
const COLS = ['NAV', 'DUST', 'TORUS2', 'FLUID', 'bassS', 'keyConf', 'centroid', 'clarity', 'regularity', 'punchy', 'calm'];
const INST = 'window.__B=[];window.__BI=setInterval(()=>{const S=CARD.MS,R=CARD.REG;window.__B.push([+(S.t||0).toFixed(1),CARD.SC.cur,S.arc,' +
  '...[0,1,3,12].map(i=>+R[i].scene.score(S,R[i].scene.rt,CARD.SC).toFixed(3)),+S.bassS.toFixed(2),+S.keyConf.toFixed(2),+S.centroid.toFixed(2),' +
  '+S.clarity.toFixed(2),+S.regularity.toFixed(2),+S.punchy.toFixed(2),+S.calm.toFixed(2)])},1000);1';
const DONE = 'JSON.stringify({B:window.__B,f0:CARD.ENGINE.AU.file?CARD.ENGINE.AU.file.frame0:null,errs:CARD.ERRS,ev:CARD.log.filter(l=>/^(SCENE|DROP|SURPRISE|SWITCH|RESTORE)@/.test(l))})';

function run(what, out) {
  const demo = { house: 120000, aba: 190000, mix: 360000 }[what];
  const hash = demo ? `test&fake=0&demo=${what}` : `test&track=${what}&at=0`;
  const steps = demo
    ? [{ until: 'window.CARD' }, { eval: INST }, { wait: demo }, { eval: DONE }]
    : [{ until: 'window.CARD' }, { until: 'CARD.ENGINE.AU.file&&CARD.ENGINE.AU.file.open', timeout: 300000 }, { eval: INST }, { until: 'window.__FRAME>=6600', timeout: 600000 }, { eval: DONE }];
  const env = { ...process.env }; if (!demo) env.CLOCK = '1';
  const r = spawnSync('node', [path.join(HERE, 'cdp.js'), hash, JSON.stringify(steps)], { env, encoding: 'utf8', maxBuffer: 1 << 26 });
  const line = (r.stdout || '').split('\n').filter((l) => /^EVAL/.test(l)).pop() || '';
  const json = line.replace(/^EVAL.*?=> /, '').replace(/^"|"$/g, '').replace(/\\"/g, '"');
  fs.writeFileSync(out, json + '\n');
  return out;
}
function summarise(f) {
  const { B, ev, f0, errs } = JSON.parse(fs.readFileSync(f, 'utf8'));
  console.log(`== ${f}: ${B.length} samples${f0 !== null && f0 !== undefined ? ` · f0 ${f0}` : ''} · errs ${JSON.stringify(errs || [])}`);
  const lead = {}, away = {}; let builds = 0;
  for (const r of B) {
    const b = r.slice(3, 7); lead[IDS[b.indexOf(Math.max(...b))]] = (lead[IDS[b.indexOf(Math.max(...b))]] || 0) + 1;
    const a = b.slice(1); away[IDS[1 + a.indexOf(Math.max(...a))]] = (away[IDS[1 + a.indexOf(Math.max(...a))]] || 0) + 1;
    if (r[2] === 'build') builds++;
  }
  const fmt = (o) => Object.entries(o).map(([k, v]) => `${NAME[k]} ${v}`).join(', ');
  console.log(`  raw lead, all four: ${fmt(lead)} · among the away scenes: ${fmt(away)} · build seconds ${builds}`);
  const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
  console.log('  medians: ' + COLS.map((c, i) => `${c} ${med(B.map((r) => r[3 + i])).toFixed(2)}`).join(' · '));
  for (const e of ev.filter((l) => /^SCENE@/.test(l))) {
    const t = +e.match(/@([\d.]+)/)[1], r = B.reduce((p, q) => Math.abs(q[0] - t) < Math.abs(p[0] - t) ? q : p);
    console.log(`  ${e.slice(0, 40).padEnd(42)} @${r[0]} ${r[2]}: NAV ${r[3]} DUST ${r[4]} TORUS2 ${r[5]} FLUID ${r[6]} · bassS ${r[7]} keyConf ${r[8]} cen ${r[9]} cl ${r[10]} reg ${r[11]} pun ${r[12]} calm ${r[13]}`);
  }
  console.log('  ' + ev.filter((l) => /^(SCENE|DROP|SWITCH)@/.test(l)).map((l) => l.replace(/ gt[\d.]+/, '')).join(' · '));
}
const a = process.argv.slice(2);
if (a[0] === '--from') a.slice(1).forEach(summarise);
else if (a[0]) summarise(run(a[0], a[1] || path.join(HERE, 'work', `director-bids-${a[0]}.json`)));
else console.log('usage: node tools/director-bids.js <house|aba|mix|Track> [out.json] | --from <out.json>…');
