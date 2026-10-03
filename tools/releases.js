// releases.json — the visitor-facing release notes (SOCIAL-PLAN §3.1), one entry per tag, newest first. This module is the one
// reader: tools/check.js validates through it (the §3.2 tag ritual: the top entry's version == package.json's, or the check
// fails), tools/whatsnew.js renders site/whats-new.html from it, tools/bundle.js inlines the landing card's "New in vX" line
// from its top entry. usage: node tools/releases.js check · node tools/releases.js set v0.29 clip.youtube <id>  (SocialMediaManager's
// post log writes the YouTube id back; the page gains its embed on the next build — the poster is site/thumbs/whats-new/<tag>.jpg)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const FILE = path.join(ROOT, 'releases.json');
export const CLASSES = ['scene', 'engine', 'tuning'];

export function load() { return JSON.parse(fs.readFileSync(FILE, 'utf8')); }
export function pkgVersion() { return JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version; }
export const tagOf = (version) => 'v' + version.replace(/\.0$/, '');          // 0.30.0 → v0.30 · 0.17.1 → v0.17.1 (the tags as cut)
const semver = (v) => v.split('.').map(Number);
const cmp = (a, b) => { const x = semver(a), y = semver(b); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); return 0; };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Every problem as one line; [] is a valid file. `pkg` is package.json's version (the ritual) — pass null to skip that one check.
export function validate(rel, pkg = pkgVersion()) {
  const out = [], seen = new Set();
  if (!Array.isArray(rel) || !rel.length) return ['releases.json: not a non-empty array'];
  rel.forEach((e, i) => {
    const at = `releases.json[${i}]` + (e && e.version ? ` (${e.version})` : '');
    if (!e || typeof e !== 'object') return out.push(at + ': not an object');
    if (!/^\d+\.\d+\.\d+$/.test(e.version || '')) out.push(at + ': version is not x.y.z');
    else { if (seen.has(e.version)) out.push(at + ': duplicate version'); seen.add(e.version); }
    if (e.tag !== tagOf(e.version || '')) out.push(at + `: tag ${e.tag} != ${tagOf(e.version || '')}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date || '') || isNaN(Date.parse(e.date))) out.push(at + ': date is not ISO yyyy-mm-dd');
    if (!CLASSES.includes(e.class)) out.push(at + `: class ${e.class} not in ${CLASSES.join('|')}`);
    for (const k of ['title', 'body']) if (!(typeof e[k] === 'string' && e[k].trim())) out.push(at + `: ${k} missing or empty`);
    if (/§\s*\d/.test(e.body || '') || /§\s*\d/.test(e.title || '')) out.push(at + ': section numbers belong in `decisions`, not in the prose');
    if (!Array.isArray(e.scenes) || e.scenes.some((s) => !Number.isInteger(s))) out.push(at + ': scenes is not an array of ids');
    if (!Array.isArray(e.decisions) || !e.decisions.length || e.decisions.some((d) => !/^§\d+[a-z]?$/.test(d))) out.push(at + ': decisions is not a non-empty array of §N');
    if (e.clip !== null && !(e.clip && typeof e.clip === 'object' && ('youtube' in e.clip) && ('poster' in e.clip))) out.push(at + ': clip is neither null nor { youtube, poster }');
    if (e.clip && e.clip.youtube && !/^[\w-]{6,20}$/.test(e.clip.youtube)) out.push(at + ': clip.youtube is not a YouTube id');
    if (e.clip && e.clip.youtube && !(e.clip.poster && fs.existsSync(path.join(ROOT, 'site', e.clip.poster)))) out.push(at + ': clip.poster missing under site/ (the poster is self-hosted — no third-party request before a click)');
    if (i && rel[i - 1].version && e.version && cmp(rel[i - 1].version, e.version) <= 0) out.push(at + ': not newest first (after ' + rel[i - 1].version + ')');
    if (i && rel[i - 1].date && e.date && rel[i - 1].date < e.date) out.push(at + ': dated after the entry above it');
  });
  if (pkg && rel[0] && rel[0].version !== pkg) out.push(`releases.json: top entry is ${rel[0].version}, package.json is ${pkg} — the tag ritual: bump package.json + assets/core/version.js, then add the entry (HARNESS "Release notes")`);
  return out;
}

// The landing card's line (SOCIAL-PLAN §4): the text inside <a id="newin"> — one source for index.html, the bundle and the check.
export const newIn = (e) => `New in ${e.tag}: ${esc(e.title)} → what's new`;
const NEWIN_RE = /(<a id="newin"[^>]*>)([^]*?)(<\/a>)/;
export const hasNewIn = (html) => NEWIN_RE.test(html);
export const patchNewIn = (html, e) => html.replace(NEWIN_RE, (m, a, _, z) => a + newIn(e) + z);
export const readNewIn = (html) => (NEWIN_RE.exec(html) || [])[2];

// The file's own layout (one entry = four lines: the head, the title, the body, the lists), so a `set` is a one-line diff.
export function save(rel) {
  const J = JSON.stringify;
  const body = rel.map((e) => `  { "version": ${J(e.version)}, "tag": ${J(e.tag)}, "date": ${J(e.date)}, "class": ${J(e.class)},\n` +
    `    "title": ${J(e.title)},\n    "body": ${J(e.body)},\n` +
    `    "scenes": ${J(e.scenes)}, "decisions": ${J(e.decisions)}, "clip": ${J(e.clip)} }`).join(',\n\n');
  fs.writeFileSync(FILE, '[\n' + body + '\n]\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [cmd, tag, field, value] = process.argv.slice(2);
  const rel = load();
  if (cmd === 'check') {
    const p = validate(rel);
    for (const l of p) console.log('FAIL', l);
    console.log(`releases: ${rel.length} entries · top ${rel[0].tag} · package.json ${pkgVersion()} · ${p.length} problem(s)`);
    process.exit(p.length ? 1 : 0);
  } else if (cmd === 'set' && tag && field && value !== undefined) {
    const e = rel.find((x) => x.tag === tag);
    if (!e) { console.error('no entry ' + tag); process.exit(2); }
    const ks = field.split('.');
    let o = e;
    for (const k of ks.slice(0, -1)) o = o[k] = (o[k] && typeof o[k] === 'object') ? o[k] : { youtube: null, poster: null };
    o[ks[ks.length - 1]] = value === 'null' ? null : value;
    if (ks[0] === 'clip' && e.clip && e.clip.poster === null) e.clip.poster = `thumbs/whats-new/${tag}.jpg`;
    const p = validate(rel, null);
    if (p.length) { for (const l of p) console.error('FAIL', l); process.exit(1); }
    save(rel);
    console.log(`releases: ${tag} ${field} = ${value}`);
  } else { console.error('usage: node tools/releases.js check | set <tag> <field.path> <value>'); process.exit(2); }
}
