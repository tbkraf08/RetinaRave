// Single-file build: inlines assets/**/*.js reachable from assets/main.js into dist/retinarave.html as one classic
// script (works from file://). Each module becomes an IIFE registered in a module table __m[path] in dependency order;
// import/export statements are rewritten (they only appear at line starts in this codebase, never inside GLSL strings).
// The landing card's "New in vX" line is inlined from releases.json's top entry (tools/releases.js newIn) — the page never fetches it.
// usage: node tools/bundle.js [out.html]     then: FILE=$PWD/dist/retinarave.html node tools/cdp.js 'test' '[...]'
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { load as loadReleases, hasNewIn, patchNewIn } from './releases.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.argv[2] || path.join(ROOT, 'dist/retinarave.html');
const ENTRY = 'assets/main.js';

const mods = new Map(); // rel path -> { deps: [rel], code }
const TAIL = "\\s*;?[ \\t]*(?://[^\\n]*)?$";   // a trailing line comment after the statement is part of the line (v0.4's core modules carry one)
const IMPORT_RE = new RegExp("^import\\s+(?:([\\w$]+)\\s*,\\s*)?(?:(\\{[^}]*\\})|(\\*\\s+as\\s+[\\w$]+)|([\\w$]+))?\\s*(?:from\\s*)?['\"]([^'\"]+)['\"]" + TAIL, 'gm');
const SIDE_RE = new RegExp("^import\\s+['\"]([^'\"]+)['\"]" + TAIL, 'gm');

function resolve(from, spec) {
  return path.normalize(path.join(path.dirname(from), spec)).replace(/\\/g, '/');
}

// Top-level declarator names of `A = …, B = …;` (commas inside (), [], {}, strings and template strings do not split).
function declarators(rest) {
  const out = [];
  let depth = 0, q = null, start = 0;
  const piece = (s) => { const m = /^\s*([\w$]+)\s*(=|,|;|$)/.exec(s); if (m) out.push(m[1]); };
  for (let i = 0; i < rest.length; i++) {
    const c = rest[i];
    if (q) { if (c === '\\') i++; else if (c === q) q = null; continue; }
    if (c === '/' && rest[i + 1] === '/') break;   // a trailing line comment: its commas are prose, not declarators (v0.11: `// … with them on, every`)
    if (c === '"' || c === "'" || c === '`') q = c;
    else if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) depth--;
    else if (c === ',' && depth === 0) { piece(rest.slice(start, i)); start = i + 1; }
  }
  piece(rest.slice(start));
  return out;
}

function transform(rel) {
  if (mods.has(rel)) return;
  let src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const deps = [], names = [];
  let def = null;
  src = src.replace(SIDE_RE, (m, spec) => { deps.push(resolve(rel, spec)); return ''; });
  src = src.replace(IMPORT_RE, (m, dflt, named, ns, dflt2, spec) => {
    const target = resolve(rel, spec);
    deps.push(target);
    const out = [];
    const d = dflt || dflt2;
    if (d) out.push(`const ${d} = __m[${JSON.stringify(target)}].default;`);
    if (named) out.push(`const ${named.replace(/\bas\b/g, ':')} = __m[${JSON.stringify(target)}];`);
    if (ns) out.push(`const ${ns.replace(/\*\s+as\s+/, '')} = __m[${JSON.stringify(target)}];`);
    return out.join(' ');
  });
  // export const/let/function/class NAME — a const/let/var may declare several names (`export const A = 1, B = 2;`):
  // every top-level declarator of the statement (one statement per line in this codebase) goes into the table
  src = src.replace(/^export\s+(const|let|var)\s+(.*)$/gm, (m, kw, rest) => { for (const n of declarators(rest)) names.push(n); return `${kw} ${rest}`; });
  src = src.replace(/^export\s+(async function|function|class)\s+([\w$]+)/gm, (m, kw, name) => { names.push(name); return `${kw} ${name}`; });
  // export default EXPR
  src = src.replace(/^export\s+default\s+/gm, () => { def = '__default'; return 'const __default = '; });
  // export { a, b as c };
  src = src.replace(new RegExp("^export\\s*\\{([^}]*)\\}" + TAIL, 'gm'), (m, list) => {
    for (const item of list.split(',')) {
      const t = item.trim();
      if (!t) continue;
      const [a, b] = t.split(/\s+as\s+/);
      names.push(b ? `${b.trim()}: ${a.trim()}` : a.trim());
    }
    return '';
  });
  if (/^export\s/m.test(src)) throw new Error(rel + ': unhandled export form: ' + src.match(/^export\s.*$/m)[0]);
  if (/^import\s/m.test(src)) throw new Error(rel + ': unhandled import form: ' + src.match(/^import\s.*$/m)[0]);
  const table = [...new Set(names)].concat(def ? [`default: ${def}`] : []).join(', ');
  mods.set(rel, { deps, code: `__m[${JSON.stringify(rel)}] = (function () {\n'use strict';\n${src}\nreturn { ${table} };\n})();\n` });
  for (const d of deps) transform(d);
}

transform(ENTRY);
// dependency order (post-order DFS from the entry)
const order = [], seen = new Set();
(function visit(rel) {
  if (seen.has(rel)) return;
  seen.add(rel);
  for (const d of mods.get(rel).deps) visit(d);
  order.push(rel);
})(ENTRY);

const bundle = `(function () {\nconst __m = {};\n${order.map((r) => mods.get(r).code).join('\n')}})();\n`;
let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')
  .replace(/<script type="module" src="assets\/main\.js"><\/script>/, () => `<script>\n${bundle}</script>`);
if (!html.includes('const __m')) throw new Error('module script tag not found in index.html');
// the card's "New in vX: <title> → what's new" line is releases.json's top entry, inlined here (SOCIAL-PLAN §4: no fetch at runtime)
if (!hasNewIn(html)) throw new Error('index.html: the card lost its <a id="newin"> line');
html = patchNewIn(html, loadReleases()[0]);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html);
console.log(`bundled ${order.length} modules → ${path.relative(ROOT, OUT)} (${(html.length / 1024).toFixed(0)} KB)`);
