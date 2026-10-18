// NAV3 (DECISIONS §140, docs/workers/brief-nav3.md) — the node smoke of the clone. Step 1: every file of assets/scenes/nav3/ but
// index.js is a byte copy of assets/scenes/nav2/'s (the §97 recipe), index.js differs in the registration only (name, id 6, key 7,
// card, home false, always false, score 0, the program names, the `n2*` → `n3*` hook names, the label), and the two forced-scene
// guards hold (draw() / overlay() before the first update() return — an `always: false` scene is drawn on its first frame before
// its first update(), CONTRACTS §1). Step 2 / 3 flip the copy list to the files the roll leaves untouched.
// node tools/test_nav3.js
import fs from 'node:fs';
import scene from '../assets/scenes/nav3/index.js';
import nav2 from '../assets/scenes/nav2/index.js';
import { NAV as N3 } from '../assets/scenes/nav3/nav.js';
import { NAV as N2 } from '../assets/scenes/nav2/nav.js';

let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL ' + m); } else console.log('  ok   ' + m); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const rd = (d, f) => fs.readFileSync('assets/scenes/' + d + '/' + f);

console.log('1. the byte copies (step 1: everything but index.js)');
const COPIES = ['nav.js', 'walk2.js', 'move2.js', 'look2.js', 'green.js', 'shaders.js', 'shaders-v2.js'];
for (const f of COPIES) ok(rd('nav2', f).equals(rd('nav3', f)), `nav3/${f} is a byte copy of nav2/${f}`);
ok(same(fs.readdirSync('assets/scenes/nav3').sort(), fs.readdirSync('assets/scenes/nav2').sort()), 'the same file list as nav2/');
{ // index.js: the registration lines only. Normalise the renames and the diff must be small.
  const A = fs.readFileSync('assets/scenes/nav2/index.js', 'utf8').split('\n');
  const B = fs.readFileSync('assets/scenes/nav3/index.js', 'utf8').replace(/\bn3(info|lum|smo|fl|ext|key|kick|breath|sub|pitch|trap|walk|green|drop)\b/g, 'n2$1').split('\n');
  const sa = new Set(A), sb = new Set(B), gone = A.filter((l) => !sb.has(l)).length, added = B.filter((l) => !sa.has(l)).length;
  ok(gone <= 30 && added <= 30, `index.js = nav2's + the registration: ${gone} lines gone, ${added} added (caps 30 / 30 — the header, the eight registration lines, the two renamed hook lines)`);
}

console.log('2. the registration');
ok(scene.name === 'nav3' && scene.id === 6 && nav2.name === 'nav2' && nav2.id === 2, `name ${scene.name} id ${scene.id} (key 7); nav2 still id 2`);
ok(scene.home === false && scene.always === false && nav2.home === true && nav2.always === true, 'home false, always false; nav2 keeps home + always');
ok(scene.score({ buildLive: 1 }) === 0 && scene.score({ buildLive: 0 }) === 0, 'score() 0 whatever the music (forced-only; the §93 roster is unchanged)');
ok(scene.card && scene.card.title === 'NAV3' && /roll/.test(scene.card.blurb), 'card NAV3, the rolling blurb');
ok(scene.rt.label === 'nav3' && scene.rt.home === false, 'rt.label nav3, rt.home false');
ok(!scene.variants, 'no variants');
ok(same(scene.feats, nav2.feats), 'feats = nav2\'s (step 1 reads exactly what nav2 reads)');
ok(same(Object.keys(scene.params), Object.keys(nav2.params)) && scene.post.kaleido === 0 && scene.post.bloom.thr === nav2.post.bloom.thr, 'params + post as nav2\'s (kaleido 0, bloom thr)');
ok(scene.colour.default === 'v2' && same(Object.keys(scene.colour.variants), Object.keys(nav2.colour.variants)), 'colour v2 default, the same two mappings');
const H3 = Object.keys(scene.hooks), H2 = Object.keys(nav2.hooks);
ok(H3.every((k) => !/^n2/.test(k) && k !== 'green' && k !== 'baby'), 'no hook named n2* / green / baby on the clone (hooks are global by name — &n2lum, &baby, CARD.hooks.green stay NAV2\'s): ' + H3.join(' '));
ok(same(H3.map((k) => k.replace(/^n3/, 'n2').replace(/3$/, '')).sort(), H2.slice().sort()), 'the hook set is nav2\'s, renamed');
ok(Object.keys(scene.help.feats).every((k) => scene.feats.includes(k)) && scene.feats.every((k) => k in scene.help.feats), 'help.feats ⊆ feats and a line for every feats entry');

console.log('3. its own state, the forced-scene guards');
ok(scene.state === N3 && nav2.state === N2 && N3 !== N2 && N3.c !== N2.c, 'state is nav3/nav.js\'s NAV object, not nav2\'s');
scene.hooks.baby3(2);
ok(N3.forceBaby === 2 && N2.forceBaby === -1, 'hooks.baby3 sets the clone\'s forceBaby, NAV2\'s stays -1');
scene.hooks.baby3(-1);
let guard = 'returned';
try { scene.draw(null, { w: 1, h: 1, vmix: 0, colour: 'v2' }); } catch (e) { guard = 'threw ' + e.message; }
ok(guard === 'returned', 'draw() before the first update() returns — ' + guard);
guard = 'returned';
try { scene.overlay(1280, 720, 1, 1 / 60); } catch (e) { guard = 'threw ' + e.message; }
ok(guard === 'returned', 'overlay() before the first update() returns — ' + guard);
const info = scene.hooks.n3info();
ok(info.mode === 'INT' && info.c[0] === 0 && info.c[1] === 0, `n3info() at rest: ${info.mode} c ${info.c}`);

console.log(fails ? `\ntest_nav3: ${fails} FAIL` : '\ntest_nav3: OK');
process.exit(fails ? 1 : 0);
