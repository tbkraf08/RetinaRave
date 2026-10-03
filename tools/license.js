// License headers on every public file (what a browser downloads: index.html, site/**/*.html, assets/**/*.js). The canonical
// header is HEAD below; a .js carries it as three `//` lines at the top, an .html as one `<!-- … -->` block right after the
// doctype. Idempotent and byte-stable (a second run changes nothing); an older header (any block carrying MARK at the top)
// is replaced by the current one. usage: node tools/license.js [--check] [--only <glob> …] [--exclude <glob> …]
//   (no flag) stamp every public file missing the exact header · --check list the files without it, exit 1 if any ·
//   --only / --exclude restrict the set (globs: ** = any path, * = within a segment; repeatable). tools/check.js imports audit().
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const MARK = 'Retina Rave — ©';
export const HEAD = [
  'Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):',
  'use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.',
  'Source: https://github.com/tbkraf08/RetinaRave',
];
const JS_HEAD = HEAD.map((l) => '// ' + l).join('\n') + '\n';
const HTML_HEAD = '<!--\n' + HEAD.map((l) => '  ' + l).join('\n') + '\n-->\n';
const DOCTYPE_RE = /^(\s*<!doctype[^>]*>\r?\n?)/i;

function walk(d, out = []) {
  if (!fs.existsSync(d)) return out;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}
// The public set, as repo-relative posix paths.
export function publicFiles() {
  const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
  return [path.join(ROOT, 'index.html')].filter((f) => fs.existsSync(f)).map(rel)
    .concat(walk(path.join(ROOT, 'site')).filter((f) => f.endsWith('.html')).map(rel))
    .concat(walk(path.join(ROOT, 'assets')).filter((f) => f.endsWith('.js')).map(rel))
    .sort();
}
export function globRe(g) {
  // `**/` = any run of directories (or none), a bare `**` = anything (so `a/**` is the whole tree), `*` = within one segment
  const s = g.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*\//g, '\0').replace(/\*\*/g, '\x01').replace(/\*/g, '[^/]*').replace(/\0/g, '(?:.*/)?').replace(/\x01/g, '.*');
  return new RegExp('^' + s + '$');
}
export function select(files, only = [], exclude = []) {
  const o = only.map(globRe), x = exclude.map(globRe);
  return files.filter((f) => (!o.length || o.some((r) => r.test(f))) && !x.some((r) => r.test(f)));
}

// Split a file into [old header or '', rest]. A .js header is the leading run of `//` lines that starts with MARK; an .html
// header is the first comment after the doctype when it carries MARK. Nothing else counts (a file's own first comment stays).
function split(rel, src) {
  if (rel.endsWith('.js')) {
    if (!src.startsWith('// ' + MARK)) return ['', src];
    const m = /^(?:\/\/[^\n]*\n)+/.exec(src);
    return [m[0], src.slice(m[0].length)];
  }
  const d = DOCTYPE_RE.exec(src), pre = d ? d[1] : '', body = src.slice(pre.length);
  const m = /^<!--[^]*?-->\r?\n?/.exec(body);
  if (m && m[0].includes(MARK)) return [pre + m[0], body.slice(m[0].length)];
  return ['', src];
}
export function stamped(rel, src) {
  if (rel.endsWith('.js')) return src.startsWith(JS_HEAD);
  const d = DOCTYPE_RE.exec(src);
  return !!d && src.slice(d[1].length).startsWith(HTML_HEAD);
}
export function stamp(rel, src) {
  if (stamped(rel, src)) return src;
  const [, rest] = split(rel, src);
  if (rel.endsWith('.js')) return JS_HEAD + rest;
  const d = DOCTYPE_RE.exec(rest);
  if (!d) throw new Error(rel + ': no <!doctype> — the html header goes after it');
  return d[1] + HTML_HEAD + rest.slice(d[1].length);
}
// The files of the set without the exact header.
export function audit(only = [], exclude = []) {
  return select(publicFiles(), only, exclude).filter((rel) => !stamped(rel, fs.readFileSync(path.join(ROOT, rel), 'utf8')));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), only = [], exclude = [];
  let check = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--check') check = true;
    else if (args[i] === '--only') only.push(args[++i]);
    else if (args[i] === '--exclude') exclude.push(args[++i]);
    else { console.error('usage: node tools/license.js [--check] [--only <glob>]… [--exclude <glob>]…'); process.exit(2); }
  }
  const set = select(publicFiles(), only, exclude), missing = audit(only, exclude);
  if (check) {
    for (const f of missing) console.log('missing header: ' + f);
    console.log(`license: ${set.length} public files · ${missing.length} without the header`);
    process.exit(missing.length ? 1 : 0);
  }
  for (const rel of missing) fs.writeFileSync(path.join(ROOT, rel), stamp(rel, fs.readFileSync(path.join(ROOT, rel), 'utf8')));
  console.log(`license: ${set.length} public files · ${missing.length} stamped · ${set.length - missing.length} already had the header`);
}
