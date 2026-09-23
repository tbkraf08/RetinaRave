// Static checks, run after every edit: node --check on assets/**/*.js · module line caps (warn >350, fail >500) ·
// dead uniforms (declared in a GLSL string, never fetched anywhere) · import discipline (only core/engine/main.js may
// import core/gl.js; scenes/effects import nothing from core) · no 'nav' in core/ · every MS key has a FEATS entry.
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
  for (const m of src.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    const t = path.normalize(path.join(path.dirname(rel), m[1]));
    if (!inCore && t === 'assets/core/gl.js') fail(rel + ' imports core/gl.js directly (scenes get gl via ctx)');
    if ((rel.startsWith('assets/scenes/') || rel.startsWith('assets/effects/')) && t.startsWith('assets/core/')) fail(rel + ' imports from core/ (' + t + ') — use ctx');
    if ((rel.startsWith('assets/scenes/') || rel.startsWith('assets/effects/')) && t.startsWith('assets/engine/')) fail(rel + ' imports from engine/ (' + t + ') — scenes receive MS');
  }
  if (rel.startsWith('assets/core/') && /\bnav\b/i.test(src.replace(/navigator\.mediaDevices/g, ''))) fail(rel + " mentions 'nav' — core must not special-case a scene");
}
const dead = [...decl].filter((n) => !used.has(n) && !COMMON.includes(n));
if (dead.length) fail('dead uniforms (declared, never fetched): ' + dead.join(','));

// MS schema: every key of MS must be documented in FEATS (static, via node import of the pure modules)
const { MS } = await import(path.join(ROOT, 'assets/engine/state.js'));
const { FEATS } = await import(path.join(ROOT, 'assets/engine/feats.js'));
const undocumented = Object.keys(MS).filter((k) => !(k in FEATS));
const phantom = Object.keys(FEATS).filter((k) => !(k in MS));
if (undocumented.length) fail('MS keys without a FEATS entry: ' + undocumented.join(','));
if (phantom.length) warn('FEATS entries with no MS default (runtime-added by a stage?): ' + phantom.join(','));

console.log(`check: ${files.length} modules · uniforms ${decl.size} · MS keys ${Object.keys(MS).length} · ${fails} fail · ${warns} warn`);
process.exit(fails ? 1 : 0);
