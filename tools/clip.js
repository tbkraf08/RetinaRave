// The clip bundle (SOCIAL-PLAN §0 / §2.6, DECISIONS §89): a recording saved by R → the contract folder SocialMediaManager reads.
//   node tools/clip.js <clip.webm> [--ss 4.0] [--to 49.5] [--out dir] [--dry]
// Beside <clip.webm> its sidecar <clip>.json (R downloads the two together). Output, under tools/work/clips/ (gitignored):
//   <yyyy-mm-dd>T<hh-mm>-<scene>-v<ver>/   (the stamp from the sidecar's `started`, UTC like the file name's, the scene at the start, the version)
//     clip.webm       the recording as saved (copied)
//     meta.json       the sidecar with the trim applied: durationS, scenes[].t shifted (the scene in effect at ss becomes t 0), trim: [ss, to]
//     clip.mp4        ffmpeg: H.264 yuv420p crf 18 at 60 fps + AAC 192k, +faststart, trimmed
//     clip-9x16.mp4   the same, centre-cropped to 9:16 (Reels / Shorts) — crop=trunc(ih*9/16/2)*2:ih
//     poster.jpg      one frame at ss + 1 s, 1920 wide (1920x1080 for a 16:9 take)
// Needs the ffmpeg CLI on PATH (this machine: `sudo apt install ffmpeg`, or a static build under ~/.local/bin). Without it the
// script prints the three commands and exits 2 — `--dry` does the same on purpose. Nothing here uploads or posts anything.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = { ss: 0, to: null, out: null, dry: false };
let src = null;
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--ss') opt.ss = +args[++i];
  else if (a === '--to') opt.to = +args[++i];
  else if (a === '--out') opt.out = args[++i];
  else if (a === '--dry') opt.dry = true;
  else if (!src) src = a;
}
if (!src) { console.log('usage: node tools/clip.js <clip.webm> [--ss s] [--to s] [--out dir] [--dry]'); process.exit(1); }
if (!fs.existsSync(src)) { console.log('no such file: ' + src); process.exit(1); }
const sidePath = src.replace(/\.webm$/, '.json');
if (!fs.existsSync(sidePath)) { console.log('no sidecar beside it: ' + sidePath + ' (R downloads <name>.json with <name>.webm)'); process.exit(1); }
const side = JSON.parse(fs.readFileSync(sidePath, 'utf8'));

// --- the folder name: <yyyy-mm-dd>T<hh-mm>-<scene>-v<ver> ---
const stamp = String(side.started).slice(0, 16).replace(':', '-'); // the sidecar's `started` (UTC, as the file name's stamp) to the minute
const scene0 = (side.scenes && side.scenes[0] && side.scenes[0].name) || 'scene';
const ver = String(side.version || '0').replace(/\.0$/, '');
const dir = opt.out || path.join(ROOT, 'tools/work/clips', stamp + '-' + scene0.replace(/[^a-z0-9-]/gi, '') + '-v' + ver);

// --- the trim, applied to the sidecar ---
const ss = Math.max(0, opt.ss || 0);
const to = opt.to !== null && isFinite(opt.to) ? Math.min(opt.to, side.durationS) : side.durationS;
if (to <= ss) { console.log('empty trim: --ss ' + ss + ' --to ' + to); process.exit(1); }
export function trimSidecar(sc, ss, to) {
  const out = { ...sc, durationS: +(to - ss).toFixed(3), trim: [ss, to], scenes: [] };
  let cur = null;
  for (const s of sc.scenes || []) {
    if (s.t <= ss) cur = s;                                   // the scene in effect at ss: becomes t 0
    else if (s.t < to) out.scenes.push({ ...s, t: +(s.t - ss).toFixed(3) });
  }
  if (cur) out.scenes.unshift({ ...cur, t: 0 });
  return out;
}
const meta = trimSidecar(side, ss, to);

// --- the three ffmpeg commands ---
const T = ['-ss', String(ss), '-to', String(to)];
const V = ['-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-r', '60', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart'];
const cmds = [
  ['ffmpeg', '-y', ...T, '-i', src, ...V, path.join(dir, 'clip.mp4')],
  ['ffmpeg', '-y', ...T, '-i', src, '-vf', 'crop=trunc(ih*9/16/2)*2:ih', ...V, path.join(dir, 'clip-9x16.mp4')],
  ['ffmpeg', '-y', '-ss', String(Math.min(ss + 1, Math.max(ss, to - 0.1))), '-i', src, '-frames:v', '1', '-vf', 'scale=1920:-2', '-q:v', '2', path.join(dir, 'poster.jpg')],
];
const q = (s) => (/[^\w./:+=,*()-]/.test(s) ? "'" + s.replace(/'/g, "'\\''") + "'" : s);
const have = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' }).status === 0;

console.log('clip bundle → ' + path.relative(ROOT, dir) + '  (trim ' + ss + ' → ' + to + ' s, ' + meta.durationS + ' s, scenes ' + meta.scenes.map((s) => s.name + '@' + s.t).join(' '));
if (opt.dry || !have) {
  if (!have) console.log('ffmpeg is NOT on PATH — install it (sudo apt install ffmpeg) and run this again. The commands it would run:');
  console.log('mkdir -p ' + q(dir) + ' && cp ' + q(src) + ' ' + q(path.join(dir, 'clip.webm')));
  for (const c of cmds) console.log(c.map(q).join(' '));
  console.log('# then: ffprobe -v error -select_streams v -show_entries stream=r_frame_rate,pix_fmt,width,height -of csv=p=0 ' + q(path.join(dir, 'clip.mp4')) + ' ; ffprobe -v error -select_streams a -show_entries stream=codec_name -of csv=p=0 ' + q(path.join(dir, 'clip.mp4')));
  process.exit(opt.dry ? 0 : 2);
}
fs.mkdirSync(dir, { recursive: true });
fs.copyFileSync(src, path.join(dir, 'clip.webm'));
fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 1) + '\n');
for (const c of cmds) {
  const r = spawnSync(c[0], c.slice(1), { encoding: 'utf8' });
  if (r.status !== 0) { console.log('FAIL ' + c.map(q).join(' ') + '\n' + (r.stderr || '').split('\n').slice(-6).join('\n')); process.exit(1); }
  console.log('ok   ' + path.basename(c[c.length - 1]));
}
const probe = (a) => spawnSync('ffprobe', a, { encoding: 'utf8' }).stdout.trim();
console.log('clip.mp4: ' + probe(['-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=width,height,r_frame_rate,pix_fmt', '-of', 'csv=p=0', path.join(dir, 'clip.mp4')]) + ' · audio ' + probe(['-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=codec_name', '-of', 'csv=p=0', path.join(dir, 'clip.mp4')]));
console.log('clip-9x16.mp4: ' + probe(['-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', path.join(dir, 'clip-9x16.mp4')]));
console.log('done → ' + dir);
