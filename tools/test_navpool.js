// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// NAVPOOL (DECISIONS §149) — the node smoke of NAV3's dancing set with FLUID2's pool inside it. (1) the files the pool leaves untouched
// are byte copies of nav3/'s; (2) the registration (id 7, key 8, forced-only, no shared-substrate slot since unit 2, the np* hooks, none another scene owns);
// (3) every uniform the pool adds is declared and fetched; (4) the stirring (pool.js) on a fake fluid: on screen it splats inside the
// frame along the critical orbit, never more than ORB_MAX a frame from the orbit, a kick bursts, a drop rings; off screen it never splats;
// (5) unit 2, the set's edge as the wall: the scene's own solver (pool-sim.js) — the core's tier tables and pass order, the mask is the
// Julia escape test with the picture's uniforms, Neumann pressure at the wall, the wall's velocity from the mask's change, no core import.
// (9) §152: navpool's nav.js is main's nav3/nav.js + §149's idle gate only; implode.js / look2.js byte copies of nav3's.
// node tools/test_navpool.js
import fs from 'node:fs';
import scene from '../assets/scenes/navpool/index.js';
import nav3 from '../assets/scenes/nav3/index.js';
import { POOL, PK, stepPool, toUv, SPIN } from '../assets/scenes/navpool/pool.js';
import { SIM, KS, edgeRates, rigOf, edgeField } from '../assets/scenes/navpool/pool-sim.js';
import { ROLL, idleGate, SWELL, NAV, knob5 } from '../assets/scenes/navpool/nav.js';
import { OUT3 } from '../assets/scenes/navpool/implode.js';
import { knob5 as knob5n3 } from '../assets/scenes/nav3/nav.js';

let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL ' + m); } else console.log('  ok   ' + m); };
const rd = (d, f) => fs.readFileSync('assets/scenes/' + d + '/' + f);

console.log('1. the byte copies (the files the pool does not touch)');
for (const f of ['move2.js', 'green.js', 'shaders.js', 'implode.js', 'look2.js'])   // as test_nav3.js pins nav3's against nav2's; §152: implode.js / look2.js pinned too (navpool tracks main's nav3 — a nav3 tune of either fails here until navpool re-clones it); nav.js alone diverges, for the silence idle (§149: idleGate; section 8 pins that diff) ok(rd('nav3', f).equals(rd('navpool', f)), `navpool/${f} is a byte copy of nav3/${f}`);

console.log('2. the registration');
ok(scene.name === 'navpool' && scene.id === 7 && nav3.id === 6, `name ${scene.name} id ${scene.id} (key 8); nav3 still id 6`);
ok(scene.home === false && scene.always === false, 'home false, always false');
ok(scene.score({ buildLive: 1 }) === 0 && scene.score({}) === 0, 'score() 0 (forced-only, out of the director rotation)');
ok(scene.fluid === undefined, 'no `fluid` slot (unit 2: its pool is its own solver; the shared substrate idles under it)');
ok(scene.card && scene.card.title === 'NAVPOOL' && scene.card.blurb.length > 0, 'card NAVPOOL with a blurb');
ok(scene.state !== nav3.state && scene.rt.label === 'navpool', 'its own NAV object (not nav3\'s), rt.label navpool');
const H = Object.keys(scene.hooks), H3 = Object.keys(nav3.hooks);
ok(H.every((k) => !H3.includes(k)), 'no hook name shared with nav3 (hooks are global by name): ' + H.join(' '));
ok(['nproll', 'npinfo', 'greenp', 'babyp', 'npkey', 'nppin', 'npwall', 'npsim'].every((k) => typeof scene.hooks[k] === 'function') && scene.hooks.npkey !== scene.hooks.nppin, 'hooks nproll / npinfo / greenp / babyp + npkey (the hue-drift knob) and nppin (the key pin), distinct');
{
  const src = fs.readFileSync('assets/scenes/navpool/index.js', 'utf8'), hb = src.slice(src.indexOf('  hooks: {'), src.indexOf('  help: {'));
  const keys = [...hb.matchAll(/^ {4}(\w+):/gm)].map((m) => m[1]).filter((k) => k !== 'hooks'), dup = keys.filter((k, i) => keys.indexOf(k) !== i);
  ok(dup.length === 0 && keys.length === Object.keys(scene.hooks).length, `the hooks literal has no duplicate key (${keys.length} keys${dup.length ? ', dup ' + dup.join(' ') : ''})`);
}
ok(Object.keys(scene.help.feats).every((k) => scene.feats.includes(k)) && scene.feats.every((k) => k in scene.help.feats), 'help.feats ⊆ feats and a line for every feats entry');
ok(['pool', 'trace', 'relief', 'spec', 'stir'].every((k) => k in scene.params) && scene.params.trace.from() === 0.25, 'params pool / trace (.25) / relief / spec / stir');
ok(scene.post.fb.advect === undefined || scene.post.fb.advect === 0, 'post.fb.advect 0 (nav3\'s trail)');

console.log('3. the uniforms the pool adds are declared and fetched');
{
  const sh = rd('navpool', 'shaders-v2.js').toString(), ix = rd('navpool', 'index.js').toString();
  ok(!/engineTex\s*\.\s*(dye|vel)/.test(fs.readdirSync('assets/scenes/navpool').map((f) => rd('navpool', f).toString()).join('\n')), 'no engineTex.dye / .vel anywhere in the folder');
  for (const u of ['uDye', 'uDyeTexel', 'uPool']) ok(new RegExp('uniform \\w+ ' + u + ';').test(sh) && ix.includes('\'' + u + '\''), `${u} declared in shaders-v2.js and fetched in index.js`);
  ok(/poolSh\(vUv\);col\*=uPool\.w/.test(sh) && /col\+=pc\*pk/.test(sh), 'the interior is the pool over uPool.w × the old interior');
  ok(/'juliap-v2'/.test(ix) && /'mandelp-v2'/.test(ix) && /'ptp'/.test(ix), 'program names juliap-v2 / mandelp-v2 / ptp');
}

console.log('4. the stirring on a fake fluid');
const Q = [];
const F = { on: true, params: { radius: 0.0025 }, floor: [0, 0, 0], splat: (x, y, dx, dy, rgb, r) => Q.push({ x, y, dx, dy, rgb, r }) };
const S = { presence: 1, kickEvt: false, kickAmp: 0, dropLiveEvt: false, mapDropEvt: false, shiftEvt: false };
const SC = { cur: 7, next: -1, m: 0 }, V = [0, 0, 1.42, 0.3], c = [-0.12, 0.65];
let maxOrb = 0, inFrame = true, finite = true, still = true, nOrb = 0;
for (let f = 0; f < 600; f++) {
  S.kickEvt = f % 30 === 0;
  S.kickAmp = 0.8;
  Q.length = 0;
  stepPool(1 / 60, S, SC, 7, F, c, V, 16 / 9, 0.4, 0.6);
  maxOrb = Math.max(maxOrb, Q.length);
  for (const s of Q) {
    if (!(s.x > 0 && s.x < 1 && s.y > 0 && s.y < 1)) inFrame = false;
    if (![s.x, s.y, s.dx, s.dy, ...s.rgb, s.r].every(Number.isFinite)) finite = false;
    if (s.dx !== 0 || s.dy !== 0) still = false;
    nOrb++;
  }
}
ok(POOL.total > 300 && POOL.kicks === 20, `on screen: ${POOL.total} splats in 10 s, ${POOL.kicks} kicks`);
ok(maxOrb <= PK.ORB_MAX, `at most ${PK.ORB_MAX} orbit splats a frame (max ${maxOrb})`);
ok(inFrame && finite, 'every splat inside the frame, finite');
ok(still && nOrb > 300, `§151: every orbit / kick splat is ink only (dx = dy = 0, ${nOrb} splats)`);
ok(!('V' in PK) && !('KICK_V' in PK) && !rd('navpool', 'pool.js').toString().includes('dirUv'), '§151: no PK.V / PK.KICK_V / dirUv');
Q.length = 0;
S.kickEvt = false;
S.dropLiveEvt = true;
stepPool(1 / 60, S, SC, 7, F, c, V, 16 / 9, 0.4, 0.6);
ok(Q.length >= PK.RING_N && POOL.ring === 1, `the drop rings: ${Q.length} splats`);
{
  const ring = Q.slice(-PK.RING_N);
  ok(ring.every((s) => Math.hypot(s.dx, s.dy) > 0 && (s.dx * (s.x - 0.5) + s.dy * (s.y - 0.5)) > 0), '§151: the ring splats keep their outward radial velocity (RING_V)');
}
S.dropLiveEvt = false;
const t0 = POOL.total;
for (let f = 0; f < 60; f++) stepPool(1 / 60, S, { cur: 6, next: -1, m: 0 }, 7, F, c, V, 16 / 9, 0.4, 0.6);
ok(POOL.total === t0 && POOL.vis === 0, 'off screen: no splat (the pool is one under every scene)');
F.on = false;
for (let f = 0; f < 60; f++) stepPool(1 / 60, S, SC, 7, F, c, V, 16 / 9, 0.4, 0.6);
ok(POOL.total === t0 && POOL.on === 0, 'substrate off: no splat');

ok(F.floor.every(Number.isFinite) && F.floor.some((x) => x > 0), 'the ink floor is set on screen (the mid band, × presence)');

console.log('5. unit 2: the scene\'s own solver, the set\'s edge its wall');
{
  const sim = rd('navpool', 'pool-sim.js').toString(), sh = rd('navpool', 'pool-shaders.js').toString(), ix = rd('navpool', 'index.js').toString();
  ok(!/from '[^']*core\//.test(sim + sh), 'pool-sim.js / pool-shaders.js import nothing from core');
  ok(KS.SIM.join() === '64,96,128,128' && KS.DYE.join() === '256,384,512,512' && KS.ITER.join() === '10,14,20,20', 'the core\'s tier tables (sim, dye, Jacobi sweeps)');
  const order = ['P.mask', 'P.splat', 'P.wallv', 'P.edge', 'P.paddle', 'P.div', 'P.jacobi', 'P.grad', 'P.advect', 'P.adye'].map((k) => sim.indexOf('pass(' + k));
  ok(order.every((x, i) => x > 0 && (i === 0 || x > order[i - 1])), 'step order (§151: no curl / vort; the edge, the paddle): mask → splat → wall → edge → paddle → div → Jacobi → grad → advect → adye');
  ok(/stepSim\(\{ c: N\.c, view: N\.view, it, itLo/.test(ix), 'the mask is drawn with the picture\'s own c / view / budgets / chart');
  const mk = sh.slice(sh.indexOf('export const MASK'), sh.indexOf('export const SPLAT'));
  ok(['uC', 'uView', 'uIter', 'uIterLo', 'uLam', 'uZs', 'uEps2'].every((u) => new RegExp('uniform \\w+ ' + u + ';').test(mk) && sim.includes("'" + u + "'")), 'MASK declares and is fed uC uView uIter uIterLo uLam uZs uEps2');
  ok(sh.includes('float pn(vec2 q,float c){return texture(uM,q).x>WALL?texture(uP,q).x:c;}'), 'Neumann at the wall: a solid neighbour\'s pressure reads the centre');
  ok(sh.includes('-(m-texture(uMp,vUv).x)') && KS.WALL_K === 1, 'the wall moves at the mask\'s own change (WALL_K 1)');
  ok(SIM.qn === 0 && typeof SIM.splat === 'function' && SIM.dye === null, 'SIM before init: no queue, no dye target (node)');
  SIM.splat(0.5, 0.5, 0, 0, [1, 0, 0]);
  SIM.splat(0.4, 0.5, 0, 0, [0, 1, 0]);
  const o0 = SIM.queue[0];
  SIM.qn = 0;
  SIM.splat(0.3, 0.5, 0, 0, [0, 0, 1]);
  ok(SIM.queue[0] === o0 && SIM.queue[0].b === 1 && SIM.qn === 1, 'the splat queue reuses its objects (no allocation per splat)');
  SIM.qn = 0;
  ok(/stepSim\(\{[^\n]*\n\s*const pr = this\.colour/.test(ix), 'the solver steps BEFORE the Julia pass (the mask and the picture share the frame)');
  ok(sh.includes('return a+(1.-ws)*own;') && KS.SQUEEZE === 1 && KS.INK_CAP > 0, 'the dye is conservative at the wall: solid taps read the texel\'s own ink, the swept ink lands on the rim (SQUEEZE 1), capped');
}

console.log('6. silence idles the dance (§149: nav.js idleGate); §151 the pool\'s confinement is gone');
{
  const sim = rd('navpool', 'pool-sim.js').toString(), ix = rd('navpool', 'index.js').toString(), nv = rd('navpool', 'nav.js').toString();
  ok(Number.isFinite(ROLL.IDLE_W) && ROLL.IDLE_W > 0, `ROLL.IDLE_W ${ROLL.IDLE_W} finite > 0`);
  ok(idleGate(ROLL.IDLE + ROLL.IDLE_W) === 1 && idleGate(0.5) === 1 && idleGate(1) === 1, 'idleGate === 1 (strict) at IDLE + IDLE_W, .5, 1: the identity under music');
  ok(idleGate(ROLL.IDLE) === 0 && idleGate(0) === 0, 'idleGate === 0 at IDLE and 0');
  ok(idleGate(NaN) === 1 && idleGate(undefined) === 1 && idleGate(Infinity) === 1, 'idleGate of a non-finite presence is 1');
  let mono = true;
  for (let i = 1; i <= 100; i++) if (idleGate(i / 100) < idleGate((i - 1) / 100)) mono = false;
  ok(mono, 'idleGate monotone non-decreasing on a 101-point 0..1 sweep');
  const all = fs.readdirSync('assets/scenes/navpool').map((f) => rd('navpool', f).toString()).join('\n'), psh = rd('navpool', 'pool-shaders.js').toString();
  ok(!/export const (CURL|VORT)\b/.test(psh) && !all.includes('uCurlK') && !/P\.(curl|vort)\b/.test(sim), '§151: no CURL / VORT shader, no uCurlK anywhere in the folder, no P.curl / P.vort pass');
  ok(!('CURL' in KS) && !('gate' in SIM) && !sim.includes('SIM.gate') && !sim.includes('KS.CURL'), '§151: no KS.CURL, no SIM.gate');
  ok(/export function armSim\(dt, on, now\) \{/.test(sim) && !/armSim\([^)]*gate/.test(sim), '§151: armSim has no gate parameter (dt, on, now)');
  ok(ix.includes('armSim(dt, ctx.fluid && ctx.fluid.on, env.now);') && (ix.match(/armSim\(/g) || []).length === 1 && !ix.includes('idleGate'), '§151: index.js has one armSim call, no idleGate (import or call)');
  ok(nv.includes('idleGate(S.presence)') && nv.includes('N.turn += ps * g * DANCE.TURN') && nv.includes('ps * (g * DANCE.SWAY * Math.sin(') && nv.includes('ROLL.BREATH * M2.breath * N.g') && nv.includes('ema(N.cLo, c0, dt * g, SWELL.CENT_TAU)') && nv.includes('ema(N.cHi, c0, dt * g, SWELL.CENT_TAU)') && nv.indexOf('idleGate(S.presence)') < nv.indexOf('ema(N.cLo, c0, dt * g'), 'nav.js gates the bar turn, the sway, the breath as read and the centroid\'s running range by idleGate (g computed before its first use)');
  const I = scene.hooks.npinfo();
  ok('g' in I && 'breathG' in I && 'breath' in I && 'trapA' in I, 'npinfo exposes g / breathG / breath / trapA (read-only)');
}

console.log('7. §151 the probe (harness only)');
{
  ok(['npwall', 'npspin', 'nppk'].every((k) => typeof scene.hooks[k] === 'function' && k.startsWith('np') && !H3.includes(k)) && new Set([scene.hooks.npwall, scene.hooks.npspin, scene.hooks.nppk, scene.hooks.npsim]).size === 4, 'hooks npwall / npspin / nppk exist, np-prefixed, not nav3\'s, distinct');
  const sim = rd('navpool', 'pool-sim.js').toString();
  ok(/if \(!isDye && still\) continue;/.test(sim), '§151: an ink-only batch skips the velocity splat pass');
  ok(['curl', 'ke', 'L:', 'nf', 'nan'].every((k) => sim.slice(sim.indexOf('export function probeSim')).includes(k)), 'probeSim reports curl / ke / L / nf / nan');
  const ix = rd('navpool', 'index.js').toString();
  ok(ix.includes('const rotv = SPIN.th ? GROOVE.rot + SPIN.th : GROOVE.rot;'), 'the drawn rotation is GROOVE.rot exactly while SPIN.th is 0');
}

console.log('8. §151 the edge is a paddle');
{
  const sh = rd('navpool', 'pool-shaders.js').toString();
  ok(KS.PADDLE_GAIN === 3 && KS.PADDLE_BAND === 4 && ['EDGE_TAU', 'PADDLE_GAIN', 'PADDLE_K', 'PADDLE_BAND', 'PADDLE_VMAX', 'SPIN_MAX', 'GROW_MAX', 'EDGE_JUMP'].every((k) => Number.isFinite(KS[k]) && KS[k] > 0), 'the paddle knobs are finite and > 0 (Toma\'s defaults: PADDLE_GAIN 3, PADDLE_BAND 4)');
  // edgeRates + rigOf + edgeField against pool.js toUv by a central finite difference: a view turning, zooming and sliding
  const asp = 16 / 9, Om = 1.3, g = -0.7, vx = 0.21, vy = -0.17, h = 5e-4;   // 2h = 1e-3: edgeRates floors dt there
  const Vt = (t) => [0.1 + vx * t, -0.2 + vy * t, 1.42 * Math.exp(g * t), 0.4 + Om * t];
  const Rr = edgeRates(Vt(h), Vt(-h), 2 * h), rig = rigOf(Rr, Vt(0), [0, 0, 0, 0]);
  let worst = 0;
  for (const [zx, zy] of [[0.3, 0.2], [-0.5, 0.4], [0.1, -0.6], [-0.2, -0.1], [0.6, 0.5]]) {
    const a = [0, 0], b = [0, 0], o = [0, 0];
    toUv(zx, zy, Vt(h), asp, a);
    toUv(zx, zy, Vt(-h), asp, b);
    toUv(zx, zy, Vt(0), asp, o);
    const fd = [(a[0] - b[0]) / (2 * h), (a[1] - b[1]) / (2 * h)], an = edgeField(rig, o, asp);
    worst = Math.max(worst, Math.hypot(fd[0] - an[0], fd[1] - an[1]) / Math.hypot(fd[0], fd[1]));
  }
  ok(!Rr.gap && Math.abs(Rr.spin - Om) < 1e-9 && Math.abs(Rr.grow - g) < 1e-9 && worst < 1e-6, `edgeRates / edgeField = d(toUv)/dt of a fixed plane point (5 points, turn + zoom + slide; worst rel ${worst.toExponential(2)})`);
  { // the sign the A5 readout uses: +rot drives the fluid's angular momentum L = (p × v)_z NEGATIVE
    const r = rigOf(edgeRates([0, 0, 1.42, 0.025], [0, 0, 1.42, 0], 1 / 60), [0, 0, 1.42, 0.025], [0, 0, 0, 0]), u = edgeField(r, [0.75, 0.5], asp);
    const px = (2 * 0.75 - 1) * asp, Lz = px * (u[1] * 2) - 0 * (u[0] * asp * 2);
    ok(r[0] > 0 && Lz < 0, `a +rot view turn is a clockwise screen field: L < 0 (spin ${r[0].toFixed(2)}, L ${Lz.toFixed(3)})`);
  }
  const J1 = edgeRates([0, 0, 1.42, 0.6], [0, 0, 1.42, 0], 1 / 60), J2 = edgeRates([0, 0, 1.42 * 1.4, 0], [0, 0, 1.42, 0], 1 / 60), W = edgeRates([0, 0, 1.42, -Math.PI + 0.01], [0, 0, 1.42, Math.PI - 0.01], 1 / 60);
  ok(J1.gap && J1.spin === 0 && J1.grow === 0 && J2.gap && J2.grow === 0, '|dθ| > EDGE_JUMP and |dγ| > .3 are GAPs (rates 0)');
  ok(!W.gap && Math.abs(W.dth - 0.02) < 1e-9 && edgeRates([0, 0, 1.42, 1], [0, 0, 1.42, 0.8], 1 / 60).spin === KS.SPIN_MAX, 'dθ wraps across ±π; spin clamps at SPIN_MAX');
  const pd = sh.slice(sh.indexOf('export const PADDLE'), sh.indexOf('export const DIV'));
  ok(pd.includes('if(ul<1e-4){o=vec4(v,0.,1.);return;}') && pd.includes('if(gap>0.)vh+=e*min(gap,ul)*'), 'PADDLE: the |ue| guard (no division under 1e-4), one-sided (gap > 0), the impulse capped at |ue| (a still paddle never brakes)');
  const adv = sh.slice(sh.indexOf('export const ADVECT'), sh.indexOf('export const ADYE'));
  ok(KS.SLIP === 1 && adv.includes('vec4 r=texture(uM,c).x>WALL?(uSlip>.5&&texture(uM,vUv).x>WALL?trace(c,own):texture(uSrc,c)):own;') && adv.includes('vec4 own=texture(uSrc,vUv);') && adv.includes('o=r/(1.+uDiss*uDt);}'), 'SLIP 1 (default, §151): the free-slip mask-weighted trace; SLIP:0 is the old ADVECT line (foot in fluid → bilinear texture(uSrc, c), else the own value)');
  ok(KS.EDGE_NORM === 1 && sh.includes('raw=uNorm*texture(uVel,vUv).xy+t/uScale;'), 'EDGE_NORM 1 (default): the edge velocity = WALLV\'s normal speed + the rigid tangential part');
  const sim = rd('navpool', 'pool-sim.js').toString();
  ok(/edg = \[ctx\.mkTarget\(sw, sh\), ctx\.mkTarget\(sw, sh\)\];\n\s*zero\(edg\[0\]\);\n\s*zero\(edg\[1\]\);/.test(sim) && sim.includes('...edg, div]'), 'edg is allocated, cleared on every alloc and freed with the others');
  const s0 = { ...SPIN };
  scene.hooks.npspin('1.5,60');
  const a = { ...SPIN };
  Object.assign(SPIN, s0);
  scene.hooks.npspin(1.5, 60);
  const b = { ...SPIN };
  Object.assign(SPIN, s0);
  scene.hooks.npspin('x');
  ok(a.rate === 1.5 && a.left === 60 && b.rate === a.rate && b.left === a.left && SPIN.th === 0 && SPIN.left === 0 && SPIN.rate === 0, 'npspin(\'1.5,60\') = npspin(1.5, 60); npspin(\'x\') is a no-op (θs 0)');
  Object.assign(SPIN, s0);
}

console.log('9. §152 navpool\'s nav is main\'s nav3 + §149 only (the §147 clone is gone)');
{
  ok(!fs.existsSync('assets/scenes/navpool/knobs.js'), 'knobs.js is gone (its numbers are nav.js\'s again, as nav3\'s)');
  // un-gate navpool/nav.js by reverting exactly §149's hunks H1–H7: the result must be nav3/nav.js to the byte — any other drift fails here
  let u = rd('navpool', 'nav.js').toString(), bad = [];
  const cut = (a, b, n = 1) => { const k = u.split(a).length - 1; if (k !== n) bad.push(`${k}× ${a.slice(0, 48)}`); u = u.split(a).join(b); };
  cut("  IDLE_W: 0.15,    // NAVPOOL silence (§149): the idle ramp's width above IDLE — presence ≥ IDLE + IDLE_W (.3) is full music (the library's traces never dip under .3 after their lead-in), ≤ IDLE is idle\n", '');
  cut("// NAVPOOL silence (§149): 1 under music (exactly: sstep's t = 1 → 1), 0 in silence, a smooth ramp between; non-finite → 1 (load-bearing: a NaN would poison the dance)\n", '');
  cut('export const idleGate = (p) => (Number.isFinite(p) ? sstep(ROLL.IDLE, ROLL.IDLE + ROLL.IDLE_W, p) : 1);\n', '');
  cut("  const g = (N.g = idleGate(S.presence));   // NAVPOOL §149: silence idles the dance (the bar turn, the sway, the breath as read, the centroid's running range) — 1 exactly under music\n", '');
  cut(', g: 1,   // §149 g: the idle gate (idleGate above)', ',');
  cut('c0, dt * g, SWELL.CENT_TAU', 'c0, dt, SWELL.CENT_TAU', 2);
  cut('ps * g * DANCE.TURN', 'ps * DANCE.TURN');
  cut('(g * DANCE.SWAY', '(DANCE.SWAY');
  cut('M2.breath * N.g', 'M2.breath');
  ok(!bad.length && u === rd('nav3', 'nav.js').toString(), `navpool/nav.js minus §149's H1–H7 === nav3/nav.js byte for byte${bad.length ? ' (hunk count: ' + bad.join('; ') + ')' : ''}`);
  const all = fs.readdirSync('assets/scenes/navpool').filter((f) => f.endsWith('.js')).map((f) => rd('navpool', f).toString()).join('\n');
  const hit = ['SHIFT_WAIT', 'PEND_', 'EPS_KICK', 'KICK_LOUD', 'BAR_STEP', 'liftB', 'liftL', 'kickP', 'pendSlams'].filter((k) => all.includes(k));
  ok(!hit.length, `no §147 name in assets/scenes/navpool/*.js (SHIFT_WAIT PEND_ EPS_KICK KICK_LOUD BAR_STEP liftB liftL kickP pendSlams)${hit.length ? ': ' + hit.join(' ') : ''}`);
  ok(OUT3.EPS_KICK === undefined && OUT3.BAR_STEP === undefined && SWELL.SHIFT_WAIT === undefined && !('pend' in NAV), 'OUT3 has no EPS_KICK / BAR_STEP, SWELL no SHIFT_WAIT, NAV no pend');
  const k5 = Object.keys(knob5('swell')), k3 = Object.keys(knob5n3('swell'));
  ok(k5.length === 12 && JSON.stringify(k5) === JSON.stringify(k3), `knob5('swell') reads nav3's 12 keys (${k5.length}: ${k5.join(' ')})`);
}

console.log(fails ? `test_navpool: ${fails} FAIL` : 'test_navpool: all ok');
process.exit(fails ? 1 : 0);
