// Summarise a director trace (tools/director-trace.sh output): returns recognised by synapse (1 Hz lines where alt
// changes with ret1) vs RESTORE@ records, soft switches (SCENE@ not on a DROP/SURPRISE frame) on the bar line
// (barPos < .1 or > 3.9 with gt > .5) vs off, and the scene sequence.  usage: node tools/director-stats.js <trace.txt>...
import fs from 'node:fs';
for (const f of process.argv.slice(2)) {
  const L = fs.readFileSync(f, 'utf8').split('\n');
  const ev = L.filter((l) => /@/.test(l)), hz = L.filter((l) => / alt-?\d+ ret/.test(l));
  const hard = new Set(ev.filter((l) => /^(DROP|SURPRISE)@/.test(l)).map((l) => l.split(' ')[0].split('@')[1]));
  const scenes = ev.filter((l) => /^SCENE@/.test(l)).map((l) => { const m = l.match(/^SCENE@([\d.]+) -> (\d+) bar([\d.]+) gt([\d.]+)/); return m && { t: +m[1], id: +m[2], bar: +m[3], gt: +m[4], hard: hard.has(m[1]) }; }).filter(Boolean);
  const restores = ev.filter((l) => /^RESTORE@/.test(l)), switches = ev.filter((l) => /^SWITCH@/.test(l));
  // after §10 the director records its event-branch switches (SWITCH@); before, SCENE@ minus hard cuts (includes home parking)
  const gtAt = (t) => { let g = 1, best = 9; for (const l of hz) { const m = l.match(/^([\d.]+) .* gt([\d.]+)/); if (m && Math.abs(+m[1] - t) < best) { best = Math.abs(+m[1] - t); g = +m[2]; } } return g; };
  const soft = switches.length ? switches.map((l) => { const m = l.match(/^SWITCH@([\d.]+) -> (\d+) bar([\d.]+)(?: gt([\d.]+))?/); return { t: +m[1], id: +m[2], bar: +m[3], gt: m[4] !== undefined ? +m[4] : gtAt(+m[1]) }; }) : scenes.filter((s) => s.t > 0.5 && !s.hard);
  const gridded = soft.filter((s) => s.gt > 0.5);
  const on = gridded.filter((s) => s.bar < 0.1 || s.bar > 3.9), off = gridded.filter((s) => !(s.bar < 0.1 || s.bar > 3.9));
  let prevAlt = null, returns = [];
  for (const l of hz) { const m = l.match(/^([\d.]+) .* alt(-?\d+) ret(\d)/); if (!m) continue; if (prevAlt !== null && +m[2] !== prevAlt && m[3] === '1') returns.push(+m[1] + ':' + m[2]); prevAlt = +m[2]; }
  const held = switches.map((l) => +l.match(/held ([\d.]+)/)[1]);
  // v0.3 §21: replay synapse's renumbering over the director's FILE@ records — a RESTORE@ whose key holds no live record
  // (or a record filed under an id the maps have since moved) is a stale restore. RENUMBER@ lines carry the map.
  const live = {}; let renumbers = 0, stale = 0;
  for (const l of ev) {
    let m;
    if ((m = l.match(/^FILE@[\d.]+ alt(\d+) scene(\d+)/))) live[+m[1]] = +m[2];
    else if ((m = l.match(/^RENUMBER@[\d.]+ ([-\d,]+)/))) { renumbers++; const map = m[1].split(',').map(Number), old = Object.assign({}, live); for (const k in live) delete live[k]; for (const k in old) { const n = +k < map.length ? map[+k] : +k; if (n >= 0) live[n] = old[k]; } }
    else if ((m = l.match(/^RESTORE@[\d.]+ alt(\d+) scene(\d+)/))) { if (live[+m[1]] === undefined || live[+m[1]] !== +m[2]) stale++; }
  }
  console.log(`== ${f}`);
  console.log(`renumbers (RENUMBER@): ${renumbers} · stale restores (RESTORE@ with no matching live FILE@ after the maps): ${stale} of ${restores.length}`);
  console.log(`returns (alt change with ret1, 1 Hz): ${returns.length} [${returns.join(' ')}]`);
  console.log(`RESTORE@: ${restores.length} [${restores.map((l) => l.slice(8).replace(' scene', '→')).join(' ')}]`);
  console.log(`soft switches${switches.length ? ' (SWITCH@)' : ' (SCENE@ minus hard cuts, incl. home parking)'}: ${soft.length} (gridTrust > .5: ${gridded.length}; on the bar line ${on.length}, off ${off.length} [${off.map((s) => s.t + '@' + s.bar).join(' ')}]; immediate with gridTrust ≤ .5: ${soft.length - gridded.length})`);
  if (switches.length) console.log(`SWITCH@ held beats: max ${Math.max(...held).toFixed(2)} mean ${(held.reduce((a, b) => a + b, 0) / held.length).toFixed(2)} · why ${JSON.stringify(switches.reduce((o, l) => { const w = l.match(/beats, (\w+)\)/)[1]; o[w] = (o[w] || 0) + 1; return o; }, {}))}`);
  console.log(`scene sequence: ${scenes.map((s) => s.id + (s.hard ? '!' : '')).join(' ')}`);
}
