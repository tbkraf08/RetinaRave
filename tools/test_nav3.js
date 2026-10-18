// NAV3 (DECISIONS §140, docs/workers/brief-nav3.md) — the node smoke of the navigator that rolls. (1) the files the roll leaves
// untouched are byte copies of nav2/'s (move2.js, look2.js, green.js, the two shader files — step 3 adds the implosion to the shaders
// and takes shaders-v2.js off the list); (2) the registration (id 6, key 7, forced-only, the n3* hooks); (3) the forced-scene guards;
// (4) 96 s of updateNav() at 60 Hz on a fake timeline with a loudness ladder, a pitch, a build and a drop: the ball stays finite,
// never passes the wall, crosses a root into a child when the build asks (the period multiplies), comes back out when the loudness
// falls, leaves on the drop and returns; the cost of one update() is printed.
// node tools/test_nav3.js            N3TRACE=1 prints one line per second
import fs from 'node:fs';
import scene from '../assets/scenes/nav3/index.js';
import nav2 from '../assets/scenes/nav2/index.js';
import { NAV as N3, ROLL, GATE } from '../assets/scenes/nav3/nav.js';
import { IMP, OUT3, layer } from '../assets/scenes/nav3/implode.js';
const LAY = (e) => { const L = layer(IMP.root[0] + IMP.nrm[0] * e, IMP.root[1] + IMP.nrm[1] * e, IMP.z0, IMP.Rp, IMP.R, IMP.q0); return L.esc.toFixed(2) + '/' + L.p.toFixed(1); };
import { NAV as N2 } from '../assets/scenes/nav2/nav.js';
import { clamp, ema, sstep } from '../assets/math/util.js';

let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL ' + m); } else console.log('  ok   ' + m); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const rd = (d, f) => fs.readFileSync('assets/scenes/' + d + '/' + f);

console.log('1. the byte copies (the files the roll does not touch)');
export const COPIES = ['move2.js', 'look2.js', 'green.js', 'shaders.js'];   // step 3: shaders-v2.js carries the implosion's two layers (the OKLCH mapping in shaders.js does not — &colour=oklch shows the roll without them)
for (const f of COPIES) ok(rd('nav2', f).equals(rd('nav3', f)), `nav3/${f} is a byte copy of nav2/${f}`);
ok(!fs.existsSync('assets/scenes/nav3/walk2.js'), 'no walk2.js (the Farey-table walk is gone with the tables)');
{
  const src = fs.readFileSync('assets/scenes/nav3/nav.js', 'utf8').replace(/\/\/.*$/gm, '');   // comments stripped: the header NAMES the tables it does without
  ok(!/BULBS|BABIES|MISI|mandel\.js|baby\.js|extC|getGrid|solveMult/.test(src), 'nav.js imports no table: no BULBS / BABIES / MISI / mandel.js / baby.js / the ray grid');
  ok(/from '\.\.\/\.\.\/math\/field\.js'/.test(src) && /findCycle|rhoGrad|nearestRational/.test(src), 'nav.js is built on math/field.js (findCycle, rhoGrad, nearestRational)');
}

console.log('2. the registration');
ok(scene.name === 'nav3' && scene.id === 6 && nav2.name === 'nav2' && nav2.id === 2, `name ${scene.name} id ${scene.id} (key 7); nav2 still id 2`);
ok(scene.home === false && scene.always === false && nav2.home === true && nav2.always === true, 'home false, always false; nav2 keeps home + always');
ok(scene.score({ buildLive: 1 }) === 0 && scene.score({ buildLive: 0 }) === 0, 'score() 0 whatever the music (forced-only; the §93 roster is unchanged)');
ok(scene.card && scene.card.title === 'NAV3' && /roll/.test(scene.card.blurb), 'card NAV3, the rolling blurb');
ok(scene.rt.label === 'nav3' && scene.rt.home === false && !scene.variants, 'rt.label nav3, rt.home false, no variants');
ok(['voxS', 'voxHz', 'voxConf', 'centroid', 'loudRel', 'dropExpectedIn', 'sectionEvt', 'harmAngle', 'key'].every((k) => scene.feats.includes(k)) && !['interval', 'repeat', 'seed', 'harmUnw'].some((k) => scene.feats.includes(k)), 'feats: the roll\'s reads (voice, centroid, loudness, the gate, the mirror); no interval / repeat / seed / harmUnw (the tables\' reads)');
ok(same(Object.keys(scene.params), Object.keys(nav2.params)) && scene.post.kaleido === 0 && scene.post.bloom.thr === nav2.post.bloom.thr, 'params (trap zoom dots pip reach) + post as nav2\'s (kaleido 0, bloom thr)');
ok(scene.colour.default === 'v2' && same(Object.keys(scene.colour.variants), Object.keys(nav2.colour.variants)), 'colour v2 default, the same two mappings');
const H3 = Object.keys(scene.hooks);
ok(H3.every((k) => !/^n2/.test(k) && k !== 'green' && k !== 'baby'), 'no hook named n2* / green / baby (hooks are global by name — &n2lum, &baby, CARD.hooks.green stay NAV2\'s): ' + H3.join(' '));
ok(['n3roll', 'n3gate', 'n3kick3', 'n3info', 'green3', 'n3lum', 'n3kick'].every((k) => typeof scene.hooks[k] === 'function'), 'hooks n3roll / n3gate / n3kick3 (§140) + n3info / green3 + §99 / §100\'s');
ok(Object.keys(scene.help.feats).every((k) => scene.feats.includes(k)) && scene.feats.every((k) => k in scene.help.feats), 'help.feats ⊆ feats and a line for every feats entry');

console.log('3. its own state, the forced-scene guards');
ok(scene.state === N3 && nav2.state === N2 && N3 !== N2 && N3.c !== N2.c, 'state is nav3/nav.js\'s NAV object, not nav2\'s');
ok(typeof N3.mode === 'string' && N3.cPath.length === 2 && typeof N3.pathCut === 'number' && typeof N3.kick.x === 'number' && 'baby' in N3, 'state has the monitor\'s shape {mode, cPath, pathCut, kick:{x}, baby}');
let guard = 'returned';
try { scene.draw(null, { w: 1, h: 1, vmix: 0, colour: 'v2' }); } catch (e) { guard = 'threw ' + e.message; }
ok(guard === 'returned', 'draw() before the first update() returns — ' + guard);
guard = 'returned';
try { scene.overlay(1280, 720, 1, 1 / 60); } catch (e) { guard = 'threw ' + e.message; }
ok(guard === 'returned', 'overlay() before the first update() returns — ' + guard);
const info0 = scene.hooks.n3info();
ok(info0.mode === 'INT' && info0.q === 1 && Math.abs(info0.rho - 0.3) < 1e-6 && Math.abs(info0.th - 0.5) < 1e-6, `n3info() at rest: ${info0.mode} q ${info0.q} rho ${info0.rho.toFixed(4)} th ${info0.th.toFixed(4)} (λ = −.3 on the cardioid)`);

console.log('4. 96 s at 60 Hz: the ball on a fake timeline (loud ladder, a pitch, a build at 10 s / the drop at 13 s of each 24 s loop)');
const MS = {
  presence: 1, bass: 0, mid: 0, high: 0, hit: 0, hitStrength: 0, onset: false, beat: false, beatPhase: 0, beatCount: 0, bpm: 124,
  eS: 0, eM: 0, buildLive: 0, tension: 0, suspension: 0, arc: 'idle', dropLiveEvt: false, dropStrength: 0, dropEnv: 0, resolveEvt: false,
  intensity: 0, peaks: [[110, 1], [220, 0.6], [330, 0.5], [550, 0.3]], sectionEvt: false, dropEvt: false,
  key: 7, mode: 0, keyConf: 0.5, valence: 0.5, harmAngle: 0, modeShade: 0, snareEvt: false, snareAmp: 0, loudRel: 0.5, loudRange: 10, loudAbs: 1, phrase16Pos: 0,
  kickEvt: false, kickAge: 99, kickAmp: 0, subGate: 0, subNote: -1, clockConfPcm: 0.9, barPos: 0, barPhase: 0, tongue21: 0, tongue41: 0, tongueOn: 1,
  centroid: 0.4, voxS: 0, voxHz: -1, voxConf: 0, dropExpectedIn: -1,
};
function fake(S, dt, now) {
  const T = now % 24;
  S.dropLiveEvt = S.resolveEvt = S.beat = S.onset = S.sectionEvt = false;
  const sec = T < 6 ? 'sustain' : T < 10 ? 'valley' : T < 13 ? 'build' : T < 21 ? 'peak' : 'valley';
  const kickOn = sec === 'sustain' || sec === 'peak';
  S.beatPhase += dt * S.bpm / 60;
  S.kickEvt = false;
  S.kickAge += dt;
  if (S.beatPhase >= 1) {
    S.beatPhase -= 1;
    S.beatCount++;
    S.beat = true;
    if (kickOn) { S.onset = true; S.hitStrength = 0.8; S.hit = 1; S.kickEvt = true; S.kickAge = S.beatPhase * 60 / S.bpm; S.kickAmp = S.beatCount & 1 ? 0.55 : 1; }
  }
  S.barPos = (S.beatCount % 4) + S.beatPhase;
  S.barPhase = S.barPos / 4;
  S.tongue21 = kickOn ? 0.5 : 0;
  S.tongue41 = kickOn ? 0.4 : 0;
  S.subGate = kickOn && (S.beatCount % 8) < 6 ? 1 : 0;
  S.subNote = S.subGate ? [7, 7, 2, 2, 0, 9][Math.floor(now / 2) % 6] : -1;
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
    if (sec === 'sustain') S.sectionEvt = true;
    S.arc = sec;
  }
  S.dropEnv *= Math.exp(-dt / 1.1);
  S.intensity = clamp(0.62 * S.eS + 0.38 * S.tension, 0, 1);
  S.phrase16Pos = S.beatCount % 16 + S.beatPhase;
  S.snareEvt = S.beat && kickOn && (S.beatCount & 1) === 1;
  S.snareAmp = S.snareEvt ? 0.7 : S.snareAmp;
  // the loudness ladder (loudRel, 1 = the track's loudest so far; loudRange 10 LU): quiet valley, loud sustain / peak, a build that RISES
  S.loudRel = ema(S.loudRel, sec === 'valley' ? 0.25 : sec === 'build' ? 0.6 + 0.13 * (T - 10) : sec === 'peak' ? 1 : (Math.floor(now / 24) & 1 ? 0.2 : 0.8), dt, 0.4);   // odd loops: a quiet sung breakdown (9 s with the valley before it: the exit's window)
  S.centroid = 0.3 + 0.25 * (0.5 + 0.5 * Math.sin(now * 0.7));   // a slow brightness swell: the pitch stand-in
  S.voxS = sec === 'sustain' ? 1 : 0;   // a singer on the sustain: an octave up and down over 6 s
  S.voxConf = sec === 'sustain' ? 0.9 : 0;
  S.voxHz = sec === 'sustain' ? 220 * Math.pow(2, 0.5 + 0.5 * Math.sin(T)) : -1;
  S.dropExpectedIn = sec === 'build' ? 4 * (13 - T) / 3 : -1;
}

const dt = 1 / 60, FR = 96 * 60, P = {};
let nonFinite = 0, wall = 0, maxRho = 0, maxQ = 1, inChild = 0, outAgain = 0, extFrames = 0, crossFrames = 0, drops = 0, returned = 0, maxStep = 0, lastC = null, lastMode = '';
let outFrames = 0, maxPasses = 0, impFrames = 0, impFinite = 0, maxEsc = 0;
const passHist = new Array(10).fill(0);
const modes = {}, events = [];
const t0 = performance.now();
for (let f = 1; f <= FR; f++) {
  const now = f * dt;
  fake(MS, dt, now);
  for (const k in scene.params) P[k] = scene.params[k].from(MS);
  scene.update(dt, MS, { rot: 0 }, { hueT: 0.3, pal: [0, 0.2, 0.6, 1], tint: [1, 1, 1], hue: 0.3, mood: {} }, { SC: { logical: 6, vT: 0 }, now, params: P });
  const N = N3;
  if (![N.c[0], N.c[1], N.ball[0], N.ball[1], N.rho, N.th, N.cyc.lnr, N.cyc.arg, N.par, N.size].every(Number.isFinite)) nonFinite++;
  modes[N.mode] = (modes[N.mode] || 0) + 1;
  if (N.mode === 'INT') { if (N.rho > ROLL.RHO_WALL + 0.012) wall++; maxRho = Math.max(maxRho, N.rho); }
  if (N.mode === 'CROSS') crossFrames++;
  if (N.mode === 'EXT' && lastMode !== 'EXT' && process.env.N3SCAN) { const rt = [N.cPath[0] - IMP.eps * (N.cPath[0] - 0) / IMP.eps, 0]; void rt; const X = scene.state; console.log('  scan at drop ' + IMP.drops + ' (q ' + IMP.q + ', R ' + IMP.R.toExponential(2) + ', eps0 ' + IMP.eps0.toExponential(2) + '): fan ' + IMP.fan + ' nrm ' + IMP.nrm.map((x) => x.toFixed(2)) + ' layer esc-fraction/passages for eps × ' + [0.003, 0.01, 0.03, 0.1, 0.3, 1, 3].map((m) => { const e = IMP.eps0 * m, nx = (X.cPath[0] - X.ball[0]), ny = 0; void nx; void ny; const r0 = IMP.root; return m + ':' + LAY(e); }).join(' ')); }
  if (N.mode === 'EXT') { extFrames++; const pp = IMP.passes; if (pp > maxPasses) maxPasses = pp; if (IMP.esc > 0) impFrames++; if (IMP.esc > maxEsc) maxEsc = IMP.esc; passHist[Math.min(Math.round(pp), 9)]++; if (![IMP.eps, IMP.sig, IMP.R, IMP.a[0], IMP.a[1], IMP.z0[0], IMP.z0[1]].every(Number.isFinite)) impFinite++; }
  if (N.mode === 'OUT') outFrames++;
  if (N.cyc.q > maxQ) maxQ = N.cyc.q;
  if (N.stack.length > 0) inChild++;
  if (lastMode === 'CROSS' && N.mode === 'INT' && N.stack.length === 0 && maxQ > 1) outAgain++;
  if (lastMode === 'IN' && N.mode === 'INT') returned++;
  if (MS.dropLiveEvt) drops++;
  if (N.mode !== lastMode) events.push(now.toFixed(2) + ' ' + lastMode + '→' + N.mode + ' q' + N.cyc.q + ' d' + N.stack.length);
  // the ball moves smoothly except on the declared cuts (a drop, a kick): the step of cPath per frame in INT
  if (lastC && N.mode === 'INT' && lastMode === 'INT') maxStep = Math.max(maxStep, Math.hypot(N.cPath[0] - lastC[0], N.cPath[1] - lastC[1]));
  lastMode = N.mode;
  lastC = [N.cPath[0], N.cPath[1]];
  if ((process.env.N3TRACE && f % 60 === 0) || (process.env.N3TRACE === "2" && now > 27 && now < 31 && f % 6 === 0)) console.log(`  t ${now.toFixed(0)} ${N.mode} q${N.cyc.q} d${N.stack.length} rho ${N.rho.toFixed(3)}/${N.rhoT.x.toFixed(2)} th ${N.th.toFixed(3)}/${(N.thT.x - Math.floor(N.thT.x)).toFixed(2)} gate ${N.gate.p}/${N.gate.q}${N.gate.on ? '!' : ''} loud ${N.loud.toFixed(2)} build ${MS.buildLive.toFixed(2)} ball ${N.ball[0].toFixed(4)},${N.ball[1].toFixed(4)} size ${N.size.toFixed(3)} x${N.crosses} s${N.stalls} f${N.fails} fell ${N.fell.toFixed(2)}`);
}
const ms = (performance.now() - t0) / FR;
console.log('  the layer mean passages per EXT frame (0..9+): ' + passHist.join(' ') + ' | a ' + Math.hypot(IMP.a[0], IMP.a[1]).toExponential(3) + ' R ' + IMP.R.toExponential(3) + ' z0 ' + IMP.z0.map((x) => x.toFixed(5)) + ' eps0 ' + IMP.eps0.toExponential(3) + ' T ' + IMP.T.toFixed(1));
console.log('  modes ' + JSON.stringify(modes) + '\n  events ' + events.slice(0, 24).join(' | ') + (events.length > 24 ? ' …' : ''));
ok(nonFinite === 0, 'every frame finite (c, the ball, rho, th, lnr, arg, par, size)');
ok(wall === 0, `the ball never passes the wall in INT by more than .012 — the linear projection overshoots by a hair at a landing (max rho ${maxRho.toFixed(4)} vs RHO_WALL ${ROLL.RHO_WALL}; ${wall} frames over)`);
ok(maxRho > GATE.RHO, `loud presses the ball against the rim (max rho ${maxRho.toFixed(3)} ≥ GATE.RHO ${GATE.RHO})`);
ok(N3.crosses >= 2 && maxQ >= 2 && inChild > 60, `the build rolls the ball through a root into a child: ${N3.crosses} crossings, max period ${maxQ}, ${inChild} frames inside a child`);
ok(outAgain >= 1, `the fall rolls it back out through the root (${outAgain} exits to the cardioid)`);
ok(drops === 4 && extFrames > 60 && returned >= 3, `${drops} drops → ${extFrames} frames outside, ${returned} returns (EXT → IN → INT)`);
ok(outFrames >= 4 * 60 * OUT3.T_IN * 0.9 && IMP.drops === 4, `the implosion: ${outFrames} frames on the way in (OUT: the petals, ${OUT3.T_IN} s each), IMP.drops ${IMP.drops}`);
ok(impFinite === 0 && maxEsc > 0 && IMP.R > 0 && Math.hypot(IMP.a[0], IMP.a[1]) > 0, `the petal coefficient a finite (|a| ${Math.hypot(IMP.a[0], IMP.a[1]).toExponential(2)}), the gate radius R ${IMP.R.toExponential(2)}, q ${IMP.q} petals, the layer's escape fraction up to ${maxEsc.toFixed(2)}, passages up to ${maxPasses.toFixed(1)} (${impFrames} implosion frames)`);
ok(N3.fails < FR * 0.02, `findCycle failures ${N3.fails} (< 2 % of frames; stalls ${N3.stalls})`);
ok(maxStep < 0.05, `the ball's largest per-frame step in INT ${maxStep.toFixed(5)} (< .05: no visible jump outside the declared cuts)`);
console.log(`  cost: ${ms.toFixed(4)} ms per update() in node (findCycle at N_ITER + rhoGrad + the ruler), ${(ms * 60).toFixed(2)} ms/s`);
ok(ms < 0.5, 'under .5 ms per update');
const info = scene.hooks.n3info();
ok(Number.isFinite(info.rho) && Number.isFinite(info.size) && typeof info.gate === 'string', `n3info() after the run: ${info.mode} q ${info.q} depth ${info.depth} rimT ${info.rimT.toFixed(1)} s crosses ${info.crosses}`);

console.log(fails ? `\ntest_nav3: ${fails} FAIL` : '\ntest_nav3: OK');
process.exit(fails ? 1 : 0);
