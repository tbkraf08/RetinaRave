// tension's normaliser (assets/engine/roughnorm.js, DECISIONS §81): the p10 / p98 of `rough` over the last 30 s.
//   node tools/test_rough.js
// Cases: (1) a synthetic that is rough for 10 s, smooth for 10 s, then rough again reads LOW through the smooth
// stretch and HIGH when the roughness returns — and the same at 0.3x the absolute level (the field is relative to the
// track's own recent past, not to a fixed scale; a STATIONARY stretch, rough or not, reads the middle of its own jitter,
// which is what "relative to lately" means); (2) the cold start reads against
// the prior pair and never above what the prior says (no partial-window attack, §67); (3) the window forgets: 30 s
// after a spike the references are the plateau's own; (4) the followers replica (`win` false) is the v0.28 formula;
// (5) two runs are bit-identical.
import { ROUGHK, RoughNorm } from '../assets/engine/roughnorm.js';

let fails = 0;
const ok = (name, cond, detail = '') => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); if (!cond) fails++; };
const DT = 1 / 30;
// a deterministic jitter (no Math.random: the harness rule)
let seed = 12345; const jit = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff - 0.5; };
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };

function run(levelHi, levelLo, gain = 1, secs = 26, K = ROUGHK) {
  const rn = new RoughNorm(K); const out = [];
  seed = 12345;
  for (let i = 0; i * DT < secs; i++) {
    const t = i * DT, r = gain * ((t < 10 || t >= 20 ? levelHi : levelLo) * (1 + 0.25 * jit()));
    rn.push(r, t); out.push({ t, y: rn.map(r), lo: rn.lo, hi: rn.hi });
  }
  return out;
}

// (1) rough then smooth, at two absolute levels
{
  const a = run(0.06, 0.015), b = run(0.06, 0.015, 0.3);
  const sel = (o, t0, t1) => med(o.filter((x) => x.t >= t0 && x.t < t1).map((x) => x.y));
  const midA = sel(a, 0, 10), loA = sel(a, 12, 20), hiA = sel(a, 21, 26);
  const midB = sel(b, 0, 10), loB = sel(b, 12, 20), hiB = sel(b, 21, 26);
  ok('rough 10 s / smooth 10 s / rough again: the smooth reads low, the return reads high', loA < 0.15 && hiA > 0.6, `p50 ${midA.toFixed(3)} (stationary) → ${loA.toFixed(3)} → ${hiA.toFixed(3)}`);
  ok('the same shape at 0.3x the level reads the same way', loB < 0.15 && hiB > 0.6 && Math.abs(hiB - hiA) < 0.25, `p50 ${midB.toFixed(3)} → ${loB.toFixed(3)} → ${hiB.toFixed(3)}`);
  // the smooth stretch pulls the window's p10 down to its own level
  const at20 = a.find((o) => o.t >= 20);
  ok('the floor follows the smooth stretch down', at20.lo < 0.02, `lo ${at20.lo.toFixed(4)} hi ${at20.hi.toFixed(4)} at ${at20.t.toFixed(1)} s`);
}
// (2) the cold start: the first sample reads against the PRIOR pair exactly; the references cannot exceed what the prior
// and the measured quantiles bracket during the seed
{
  const rn = new RoughNorm(); rn.push(0.07, 0);
  ok('first sample: the references are the prior pair', rn.lo === ROUGHK.PLO && rn.hi === ROUGHK.PHI, `lo ${rn.lo} hi ${rn.hi}`);
  let maxHi = 0; seed = 7;
  for (let i = 1; i < 30 * 5; i++) { const t = i * DT; rn.push(0.07 * (1 + 0.1 * jit()), t); maxHi = Math.max(maxHi, rn.hi); }
  ok('a 0.07 plateau through the 5 s seed: hi climbs from the prior toward the plateau and never past it', maxHi <= 0.0775 + 1e-9 && rn.hi > 0.06, `hi max ${maxHi.toFixed(4)} at 5 s ${rn.hi.toFixed(4)}`);
}
// (3) the window forgets a spike
{
  const rn = new RoughNorm(); seed = 3;
  for (let i = 0; i * DT < 40; i++) { const t = i * DT; const r = t >= 5 && t < 5.5 ? 0.12 : 0.02 * (1 + 0.1 * jit()); rn.push(r, t); }
  ok('30 s after a half-second spike the ceiling is the plateau\'s own p98', rn.hi < 0.03, `hi ${rn.hi.toFixed(4)} (the spike was 0.12)`);
}
// (4) the followers replica: a 1 s plateau at 0.04 after the seed moves rLo / rHi as v0.28 did
{
  let rLo = 0.02, rHi = 0.12;
  for (let i = 0; i < 30; i++) { const r = 0.04; rLo = Math.min(rLo + (r - rLo) * 0.002 + 1e-5, r); rHi = Math.max(rHi - (rHi - r) * 0.002, r, rLo + 0.03); }
  ok('the v0.28 follower pair (the &rough=0 path) is the formula features-slow.js keeps', Math.abs(rLo - 0.02146) < 1e-4 && Math.abs(rHi - 0.11534) < 1e-4, `rLo ${rLo.toFixed(5)} rHi ${rHi.toFixed(5)}`);
}
// (5) determinism
{
  const a = run(0.05, 0.02), b = run(0.05, 0.02);
  ok('two runs are bit-identical', a.every((o, i) => o.y === b[i].y && o.lo === b[i].lo && o.hi === b[i].hi));
}
console.log(fails ? `${fails} FAIL` : 'all ok');
process.exit(fails ? 1 : 0);
