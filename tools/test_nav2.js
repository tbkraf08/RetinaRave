// NAV2 is a byte-faithful clone of NAV (DECISIONS §97, 2026-10-08: "I like NAV better than NAV2 → reset NAV2 as NAV → all work
// in NAV2") — this is the node smoke of the workbench. NAV could never be tested in node because the exterior ray grid comes
// from a Worker; seeded with setGrid(buildRayGrid(...GRIDP)) (62 ms, the table the Worker builds) its navigator runs here,
// so the clone's update() is driven 48 s at 60 Hz against NAV's own update() on the same fake timeline (the lines of
// assets/engine/sources/fake.js it reads, re-implemented as tools/test_nav2.js always did) and the two trajectories must be
// the same to the bit — two module instances of one navigator. Also: the three byte copies, the registration shape (§97's
// list: id 8, home false, score 0, no variants, no card, own state, hooks n2info / green / baby), the first-frame guards
// draw() and overlay() need as a forced scene (the §39 freeze), the continuity monitor's rule (tools/monitor.js) on the
// clone, Green's ruler live, and the cost of one update().
// node tools/test_nav2.js            N2TRACE=1 prints one line per half second
import fs from 'node:fs';
import scene from '../assets/scenes/nav2/index.js';
import nav from '../assets/scenes/nav/index.js';
import { NAV as N2 } from '../assets/scenes/nav2/nav.js';
import { NAV as N0 } from '../assets/scenes/nav/nav.js';
import { G } from '../assets/scenes/nav2/green.js';
import { buildRayGrid, setGrid, GRIDP } from '../assets/math/mandel.js';
import { clamp, ema, sstep, frac, TAU } from '../assets/math/util.js';

let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL ' + m); } else console.log('  ok   ' + m); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

console.log('1. the byte copies and the registration');
for (const f of ['nav.js', 'shaders.js']) {   // §99: shaders-v2.js and index.js carry the legibility pass now; the navigator and the OKLCH mapping are still NAV's bytes
  ok(fs.readFileSync(`assets/scenes/nav/${f}`).equals(fs.readFileSync(`assets/scenes/nav2/${f}`)), `assets/scenes/nav2/${f} is a byte copy of nav/${f}`);
}
ok(scene.name === 'nav2' && scene.id === 8, `name ${scene.name} id ${scene.id}`);
ok(scene.home === false, 'home false (core/scenes.js keeps the LAST registered home — a cloned true would steal the director)');
ok(scene.always === true, 'always true (like NAV: the forced scene is updated from frame 0, so the s8 pair is NAV\'s to the byte)');
ok(!scene.variants, 'no variants (NAV\'s DRUM is id 4, registered once)');
ok(!scene.card, 'no card (no landing tile for the workbench)');
ok(typeof scene.hooks.baby === 'function' && typeof scene.hooks.n2info === 'function' && typeof scene.hooks.green === 'function', 'hooks baby / n2info / green');
ok(nav.feats.every((k) => scene.feats.includes(k)) && scene.feats.length > nav.feats.length, `feats ⊇ NAV's ${nav.feats.length} (+${scene.feats.length - nav.feats.length} for §99's look2.js)`);
ok(Object.keys(nav.help.feats).every((k) => k in scene.help.feats) && scene.feats.every((k) => k in scene.help.feats), 'help.feats ⊇ NAV\'s, and a line for every feats entry');
ok(['n2lum', 'n2smo', 'n2fl', 'n2ext', 'n2key', 'key'].every((k) => typeof scene.hooks[k] === 'function'), 'hooks n2lum / n2smo / n2fl / n2ext / n2key / key (§99\'s A/B knobs)');
ok(same(Object.keys(scene.params), Object.keys(nav.params)) && same(Object.values(scene.params).map((p) => p.range), Object.values(nav.params).map((p) => p.range)), `params ${Object.keys(scene.params).join(' ')} with NAV's ranges`);
ok(scene.post.bloom.thr === nav.post.bloom.thr && scene.post.kaleido === nav.post.kaleido && scene.post.fb.decay({ eM: 0.37 }) === nav.post.fb.decay({ eM: 0.37 }), 'post = NAV\'s (fb decay, bloom thr, kaleido)');
ok(scene.colour.default === 'v2' && same(Object.keys(scene.colour.variants), Object.keys(nav.colour.variants)), 'colour v2 default, the same two mappings');
ok(nav.score({ buildLive: 0 }) === 0.5 && scene.score({ buildLive: 0 }) === 0 && scene.score({ buildLive: 1 }) === 0, 'score 0 whatever the music (forced-only, §93); NAV bids 0.5 + buildLive');

console.log('2. its own state, the monitor\'s shape, the forced-scene guards');
ok(scene.state !== nav.state && scene.state === N2 && nav.state === N0 && scene.state.c !== nav.state.c, 'state is nav2/nav.js\'s NAV object, not nav/nav.js\'s');
const st = scene.state;
ok(typeof st.mode === 'string' && st.cPath.length === 2 && typeof st.pathCut === 'number' && typeof st.kick.x === 'number' && 'baby' in st, 'state has the monitor\'s shape {mode, cPath, pathCut, kick:{x}, baby}');
scene.hooks.baby(2);
ok(N2.forceBaby === 2 && N0.forceBaby === -1, 'hooks.baby sets the clone\'s forceBaby, NAV\'s stays -1');
scene.hooks.baby(-1);
let guard = 'returned';
try { scene.draw(null, { w: 1, h: 1, vmix: 0, colour: 'v2' }); } catch (e) { guard = 'threw ' + e.message; }
ok(guard === 'returned', 'draw() before the first update() returns (a forced scene is drawn on its first frame before its first update) — ' + guard);
guard = 'returned';
try { scene.overlay(1280, 720, 1, 1 / 60); } catch (e) { guard = 'threw ' + e.message; }
ok(guard === 'returned', 'overlay() before the first update() returns (loop.js calls every scene\'s overlay every frame) — ' + guard);
const info0 = scene.hooks.n2info();
ok(info0.mode === 'INT' && info0.bulb === '1/2' && info0.c[0] === 0 && info0.c[1] === 0, `n2info() at rest: ${info0.mode} bulb ${info0.bulb} c ${info0.c}`);

console.log('3. 48 s at 60 Hz: the clone\'s update() against NAV\'s, the continuity rule, Green\'s ruler');
setGrid(buildRayGrid(...GRIDP));   // the table the Worker builds in the browser (mandel.js GRIDP) — navDrop and the EXT chart need it
const MS = {
  presence: 1, bass: 0, mid: 0, high: 0, hit: 0, hitStrength: 0, onset: false, beat: false, beatPhase: 0, beatCount: 0, bpm: 124,
  eS: 0, eM: 0, buildLive: 0, tension: 0, suspension: 0, arc: 'idle', dropLiveEvt: false, dropStrength: 0, dropEnv: 0, resolveEvt: false,
  intensity: 0, interval: 7, repeat: false, harmUnw: 0, peaks: [[110, 1], [220, 0.6], [330, 0.5], [550, 0.3]],
  seed: { hue: 0.6, th: -0.29, a: 0.17, scene: -1 },
  // §99 look2.js reads: a trusted key, a loud track, no snare, the phrase position from the beat count
  key: 7, mode: 0, keyConf: 0.5, valence: 0.5, harmAngle: 0, modeShade: 0, snareEvt: false, snareAmp: 0, loudRel: 0.8, loudRange: 5, loudAbs: 1, phrase16Pos: 0,
};
// The lines of sources/fake.js that NAV reads (24 s loop, DROP at 13 s; the live detector's dropLiveEvt is the drop here).
function fake(S, dt, now) {
  const T = now % 24;
  S.dropLiveEvt = S.resolveEvt = S.beat = S.onset = false;
  const sec = T < 6 ? 'sustain' : T < 10 ? 'valley' : T < 13 ? 'build' : T < 21 ? 'peak' : 'valley';
  const kickOn = sec === 'sustain' || sec === 'peak';
  S.beatPhase += dt * S.bpm / 60;
  if (S.beatPhase >= 1) {
    S.beatPhase -= 1;
    S.beatCount++;
    S.beat = true;
    if (kickOn) { S.onset = true; S.hitStrength = 0.8; S.hit = 1; }
  }
  S.hit *= Math.exp(-dt / 0.14);
  const kp = kickOn ? Math.exp(-S.beatPhase * 5) : 0;
  S.bass = kp * 0.9;
  S.mid = sec === 'valley' ? 0.25 : 0.55;
  S.high = sec === 'build' ? 0.3 + 0.2 * (T - 10) : 0.35;
  const e = clamp(0.5 * S.bass + 0.35 * S.mid + 0.15 * S.high + (kickOn ? 0.25 : 0), 0, 1);
  S.eS = ema(S.eS, e, dt, 0.3);
  S.eM = ema(S.eM, e, dt, 2.5);
  S.buildLive = ema(S.buildLive, sec === 'build' ? 1 : 0, dt, 1);
  S.tension = ema(S.tension, sec === 'build' ? 0.9 : sec === 'peak' ? 0.6 : 0.2, dt, 0.5);
  S.suspension = ema(S.suspension, sstep(0.55, 0.8, S.tension), dt, 1.3);
  if (sec !== S.arc) {
    if (sec === 'peak') { S.dropLiveEvt = true; S.dropStrength = 0.9; S.dropEnv = 1; S.buildLive = 0; }
    S.arc = sec;
  }
  S.dropEnv *= Math.exp(-dt / 1.1);
  S.intensity = clamp(0.62 * S.eS + 0.38 * S.tension, 0, 1);
  S.harmUnw += dt * 0.25;
  S.phrase16Pos = S.beatCount % 16 + S.beatPhase;
  S.snareEvt = S.beat && kickOn && (S.beatCount & 1) === 1;
  S.snareAmp = S.snareEvt ? 0.7 : S.snareAmp;
  S.interval = [7, 5, 4, 0, 9, 3][Math.floor(now / 4) % 6];
}

const dt = 1 / 60, FR = 48 * 60, P = {}, P0 = {};
const MON = { n: 0, fast: 0, max: 0, viol: [] };
let pc = null, pk = 0, pm = '', pd = 0, tm = -999, nonFinite = 0, maxDiff = 0, modeDiff = 0, dropFrame = -1, backFrame = -1;
const modes = [], events = [];
for (let f = 1; f <= FR; f++) {
  const now = f * dt;
  fake(MS, dt, now);
  for (const k in scene.params) { P[k] = scene.params[k].from(MS); P0[k] = nav.params[k].from(MS); }
  if (!same(P, P0)) modeDiff++;
  scene.update(dt, MS, {}, {}, { SC: { logical: 8, vT: 0 }, params: P, now, Q: {} });   // the real update(): rt, measure(), updateNav
  nav.update(dt, MS, {}, {}, { SC: { logical: 0, vT: 0 }, params: P0, now, Q: {} });
  const c = [N2.cPath[0], N2.cPath[1]];
  if (!isFinite(N2.c[0]) || !isFinite(N2.c[1]) || !isFinite(N2.h.x) || !isFinite(N2.lg.x) || !isFinite(N2.th.x)) nonFinite++;
  maxDiff = Math.max(maxDiff, Math.abs(N2.c[0] - N0.c[0]), Math.abs(N2.c[1] - N0.c[1]), Math.abs(N2.h.x - N0.h.x), Math.abs(N2.vtime - N0.vtime));
  if (N2.mode !== N0.mode) modeDiff++;
  if (pc) {
    if (N2.mode !== pm) {
      tm = f;
      events.push([f, pm + '->' + N2.mode]);
      if (pm === 'INT' && dropFrame < 0) dropFrame = f;
      if (N2.mode === 'INT' && dropFrame > 0 && backFrame < 0) backFrame = f;
    }
    const d = Math.hypot(c[0] - pc[0], c[1] - pc[1]) / (N2.baby ? N2.baby.size : 1);
    const legal = N2.pathCut <= 2 || N2.kick.x > pk + 0.05 || N2.mode !== pm || f - tm < 18;
    MON.n++;
    if (!legal) {
      MON.max = Math.max(MON.max, d);
      if (d > 0.06) { if (d > 2.5 * pd + 0.01) MON.viol.push([f, +d.toFixed(4), +pd.toFixed(4), N2.mode]); else MON.fast++; }
    }
    pd = d;
  }
  pc = c;
  pk = N2.kick.x;
  pm = N2.mode;
  if (modes.indexOf(N2.mode) < 0) modes.push(N2.mode);
  if (process.env.N2TRACE && f % 30 === 0) {
    console.log(`  t ${now.toFixed(1)} f${f} ${N2.mode} c ${c[0].toFixed(4)},${c[1].toFixed(4)} h ${N2.h.x.toFixed(3)} lg ${N2.lg.x.toFixed(2)} th ${frac(N2.th.x).toFixed(3)} par ${N2.par.toFixed(2)} Q ${G.Q.toFixed(3)} v ${G.v.toFixed(2)}`);
  }
}
console.log('  modes seen: ' + modes.join(' ') + '   transitions: ' + events.map((e) => 'f' + e[0] + ' ' + e[1]).join(', '));
ok(nonFinite === 0, 'nothing non-finite in 2880 frames (' + nonFinite + ')');
ok(maxDiff === 0 && modeDiff === 0, `the clone's trajectory is NAV's to the bit: max |c, h, vtime difference| ${maxDiff}, frames with another mode or parameter ${modeDiff}`);
ok(MON.viol.length === 0, 'continuity monitor (tools/monitor.js\'s rule): viol ' + JSON.stringify(MON.viol) + ' (n ' + MON.n + ', fast ' + MON.fast + ', max ' + MON.max.toFixed(4) + ')');
ok(dropFrame >= 779 && dropFrame <= 781, `the exit is at frame ${dropFrame} (13 s = f780 +- 1: navDrop on dropLiveEvt)`);
ok(backFrame > dropFrame && backFrame < 36 * 60, `back inside at frame ${backFrame} (EXT -> HOME -> IN -> INT before the second drop at 37 s)`);
ok(modes.indexOf('INT') >= 0 && modes.indexOf('EXT') >= 0 && modes.indexOf('HOME') >= 0 && modes.indexOf('IN') >= 0, 'INT, EXT, HOME and IN all seen');
ok(scene.rt.label.startsWith(N2.mode) && typeof scene.rt.time === 'number' && scene.rt.time === N2.vtime, `rt filled: label "${scene.rt.label}" time ${scene.rt.time.toFixed(2)}`);
const info = scene.hooks.n2info(), bad = Object.entries(info).filter(([k, v]) => typeof v === 'number' && !isFinite(v)).map(([k]) => k);
ok(bad.length === 0 && info.c[0] === N2.c[0] && typeof info.mode === 'string' && /^\d+\/\d+$/.test(info.bulb), `n2info() finite: ${JSON.stringify({ mode: info.mode, bulb: info.bulb, rho: +info.rho.toFixed(3), h: +info.h.toFixed(3), lg: +info.lg.toFixed(2), theta: +info.theta.toFixed(3) })}${bad.length ? ' NON-FINITE ' + bad : ''}`);
const i2 = scene.hooks.n2info();
ok(isFinite(i2.hueT) && i2.hueT >= 0 && i2.hueT < 1 && i2.key === 7 && i2.keyConf === 1 && i2.phr >= 5 && isFinite(i2.smo) && i2.smo >= 0 && i2.smo <= 0.3 && i2.base > 0 && i2.base <= 1 && i2.fl >= 0 && i2.fl <= 1,
  `§99 look2 state finite and in range: hueT ${i2.hueT.toFixed(3)} key ${i2.key} kc ${i2.keyConf} phrases ${i2.phr} base ${i2.base.toFixed(3)} smo ${i2.smo.toFixed(3)} fl ${i2.fl.toFixed(3)} extG ${i2.extG.toFixed(3)}`);
const g = scene.hooks.green();
ok(g === G && g.n === FR && g.ok === 1 && g.Q > 0 && g.Q <= 1 + 1e-9, `green(): measured every update (n ${g.n}), ok ${g.ok}, Q ${g.Q.toFixed(4)} A ${g.A.toFixed(3)} v ${g.v.toFixed(2)}`);

console.log('4. cost');
{
  const t = [];
  for (let f = FR + 1; f <= FR + 300; f++) {
    const now = f * dt;
    fake(MS, dt, now);
    for (const k in scene.params) P[k] = scene.params[k].from(MS);
    const t0 = process.hrtime.bigint();
    scene.update(dt, MS, {}, {}, { SC: { logical: 8, vT: 0 }, params: P, now, Q: {} });
    t.push(Number(process.hrtime.bigint() - t0) / 1e6);
  }
  t.sort((a, b) => a - b);
  const med = t[150], p95 = t[285];
  ok(med < 1, `update() + Green's ruler: median ${med.toFixed(3)} ms, p95 ${p95.toFixed(3)} ms over 300 calls (gate: median < 1 ms)`);
}

console.log(fails ? `test_nav2: ${fails} FAIL` : 'test_nav2: all ok');
process.exit(fails ? 1 : 0);
