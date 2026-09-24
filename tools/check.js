// Static checks, run after every edit: node --check on assets/**/*.js · module line caps (warn >350, fail >500) ·
// dead uniforms (declared in a GLSL string, never fetched anywhere) · import discipline (only core/engine/main.js may
// import core/gl.js; scenes/effects/transitions import nothing from core) · no 'nav' in core/ or transitions/ · every MS
// key has a FEATS entry · scene help has three depths, help.feats ⊂ feats (warn on a feats entry without a line) · help.js /
// panel.js name no MS field and no scene as a quoted literal (the help and the panel show data, never a special case).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WARN = 350, FAIL = 500;
const COMMON = ['uRes', 'uTime', 'uBands', 'uBeat', 'uArc', 'uHarm', 'uPal', 'uTint'];
let fails = 0, warns = 0;
const fail = (m) => { fails++; console.log('FAIL', m); };
const warn = (m) => { warns++; console.log('warn', m); };

function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}
const files = walk(path.join(ROOT, 'assets'));
const decl = new Set(), used = new Set();
for (const f of files) {
  const rel = path.relative(ROOT, f), src = fs.readFileSync(f, 'utf8'), n = src.split('\n').length;
  const r = spawnSync('node', ['--check', f], { encoding: 'utf8' });
  if (r.status) fail(rel + ' syntax: ' + r.stderr.split('\n').slice(0, 4).join(' | '));
  if (n > FAIL) fail(rel + ' has ' + n + ' lines (cap ' + FAIL + ')');
  else if (n > WARN) warn(rel + ' has ' + n + ' lines (soft cap ' + WARN + ')');
  for (const m of src.matchAll(/uniform\s+(?:(?:lowp|mediump|highp)\s+)?(?:float|int|bool|[iu]?vec[234]|mat[234]|sampler2D|sampler3D)\s+([^;]+);/g)) for (const x of m[1].split(',')) decl.add(x.trim().replace(/\[.*$/, ''));
  for (const m of src.matchAll(/\bu\(["'](\w+)/g)) used.add(m[1]);
  for (const m of src.matchAll(/tex\(\w+,\s*["'](\w+)/g)) used.add(m[1]);
  for (const m of src.matchAll(/getUniformLocation\(\w+,\s*["'](\w+)/g)) used.add(m[1]);
  const inCore = rel.startsWith('assets/core/') || rel.startsWith('assets/engine/') || rel === 'assets/main.js';
  const plug = rel.startsWith('assets/scenes/') || rel.startsWith('assets/effects/') || rel.startsWith('assets/transitions/');
  for (const m of src.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    const t = path.normalize(path.join(path.dirname(rel), m[1]));
    if (!inCore && t === 'assets/core/gl.js') fail(rel + ' imports core/gl.js directly (scenes get gl via ctx)');
    if (plug && t.startsWith('assets/core/')) fail(rel + ' imports from core/ (' + t + ') — use ctx');
    if (plug && t.startsWith('assets/engine/')) fail(rel + ' imports from engine/ (' + t + ') — scenes receive MS');
  }
  if ((rel.startsWith('assets/core/') || rel.startsWith('assets/transitions/')) && /\bnav\b/i.test(src.replace(/navigator\.mediaDevices/g, ''))) fail(rel + " mentions 'nav' — core must not special-case a scene");
}
const dead = [...decl].filter((n) => !used.has(n) && !COMMON.includes(n));
if (dead.length) fail('dead uniforms (declared, never fetched): ' + dead.join(','));

// MS schema: every key of MS must be documented in FEATS (static, via node import of the pure modules)
const { MS } = await import(path.join(ROOT, 'assets/engine/state.js'));
const { FEATS } = await import(path.join(ROOT, 'assets/engine/feats.js'));
const undocumented = Object.keys(MS).filter((k) => !(k in FEATS));
for (const f of ['assets/core/help.js', 'assets/core/panel.js']) { // the DOM views: every field name they show comes from FEATS / feats at run time
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8'), lits = new Set([...src.matchAll(/['"]([A-Za-z_]\w*)['"]/g)].map((m) => m[1]));
  const bad = [...lits].filter((w) => w in FEATS && FEATS[w].kind !== 'internal');
  if (bad.length) fail(f + ' names MS fields as literals: ' + bad.join(','));
}
const phantom = Object.keys(FEATS).filter((k) => !(k in MS));
if (undocumented.length) fail('MS keys without a FEATS entry: ' + undocumented.join(','));
if (phantom.length) warn('FEATS entries with no MS default (runtime-added by a stage?): ' + phantom.join(','));

// Scenes (imported like the engine modules: they reach only math/* and their own folder, so they load without a DOM):
// help has three non-empty depths (CONTRACTS §0) · every help.feats key is in feats (§1.13) · a feats entry without a
// help.feats line is a gap the help view fills with FEATS[k].drives (warn) · every feats entry exists in FEATS.
const sceneDirs = fs.readdirSync(path.join(ROOT, 'assets/scenes'), { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
let helpGaps = 0;
for (const d of sceneDirs) {
  const sc = (await import(path.join(ROOT, 'assets/scenes', d, 'index.js'))).default, h = sc.help || {}, feats = sc.feats || [];
  for (const k of ['eli5', 'why', 'math']) if (!(typeof h[k] === 'string' && h[k].trim())) fail('scene ' + d + ': help.' + k + ' is missing or empty');
  const bad = Object.keys(h.feats || {}).filter((k) => !feats.includes(k));
  if (bad.length) fail('scene ' + d + ': help.feats keys not in feats: ' + bad.join(','));
  const undecl = feats.filter((k) => !(k in FEATS));
  if (undecl.length) fail('scene ' + d + ': feats not in FEATS: ' + undecl.join(','));
  for (const f of ['assets/core/help.js', 'assets/core/panel.js']) if (new RegExp("['\"]" + d + "['\"]").test(fs.readFileSync(path.join(ROOT, f), 'utf8'))) fail(f + " names scene '" + d + "' as a literal");
  const gaps = feats.filter((k) => !(h.feats && h.feats[k]));
  if (gaps.length) { helpGaps += gaps.length; warn('scene ' + d + ': feats without a help.feats line (the help shows FEATS.drives): ' + gaps.join(',')); }
  for (const v of sc.variants || []) if (!(typeof v.tag === 'string' && v.tag)) fail('scene ' + d + ' variant ' + v.name + ': no tag');
  if (sc.colour) { // colour slot (§1.4): a default that is one of the variants, every variant an object
    const c = sc.colour, names = Object.keys(c.variants || {});
    if (!(c.default in (c.variants || {}))) fail('scene ' + d + ': colour.default ' + c.default + ' is not in colour.variants (' + names.join(',') + ')');
    for (const n of names) if (typeof c.variants[n] !== 'object') fail('scene ' + d + ': colour.variants.' + n + ' is not an object');
  }
}

console.log(`check: ${files.length} modules · uniforms ${decl.size} · MS keys ${Object.keys(MS).length} · scenes ${sceneDirs.length} (help.feats gaps ${helpGaps}) · ${fails} fail · ${warns} warn`);
process.exit(fails ? 1 : 0);
