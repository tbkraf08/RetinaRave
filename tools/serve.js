// Zero-dependency static server for dev (file:// blocks module imports). usage: node tools/serve.js [port] [root]
// v0.15 E1 also serves GET /music/<name> from $MUSIC (default ~/Music/RetinaRave) for the file source (&track=<name>).
// LOCAL ONLY, by construction: the route lives here and nowhere else. tools/bundle.js inlines assets/**/*.js into one
// HTML file and `npm run build` copies site/ — neither can see ~/Music, and wrangler.jsonc deploys ./dist, so no track
// and no /music/ path can be bundled or deployed.
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = +(process.argv[2] || process.env.PORT || 8765);
const ROOT = path.resolve(process.argv[3] || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css', '.json': 'application/json', '.md': 'text/markdown', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm', '.txt': 'text/plain' };

// --- /music/ (v0.15 E1) ---
const MUSIC = path.resolve(process.env.MUSIC || path.join(os.homedir(), 'Music/RetinaRave'));
const MEXT = ['', '.flac', '.wav', '.mp3', '.ogg'];   // as tools/truth/trackmap.py find()
const MMIME = { '.flac': 'audio/flac', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg' };

// One track by name, with or without extension. A name carrying a path separator or '..' is refused, never resolved.
function music(name, res) {
  if (!name || name.includes('/') || name.includes('\\') || name.includes('..')) { res.writeHead(400); return res.end('bad track name'); }
  for (const ext of MEXT) {
    const f = path.join(MUSIC, name + ext);
    if (!f.startsWith(MUSIC + path.sep)) continue;
    let st;
    try { st = fs.statSync(f); } catch (e) { continue; }
    if (!st.isFile()) continue;
    res.writeHead(200, { 'Content-Type': MMIME[path.extname(f)] || 'application/octet-stream',
      'Content-Length': st.size, 'Cache-Control': 'no-store' });
    return fs.createReadStream(f).pipe(res);
  }
  res.writeHead(404);
  res.end('no track ' + name + ' in ' + MUSIC);
}

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.startsWith('/music/')) return music(p.slice(7), res);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  const send = (f, data) => { res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(data); };
  fs.readFile(file, (err, data) => {
    if (!err) return send(file, data);
    // what `npm run build` copies to the dist root (site/: favicon, thumbs/…) is served from site/ here, so dev == deploy for those paths (v0.8.1)
    const alt = path.join(ROOT, 'site', p);
    fs.readFile(alt, (err2, d2) => { if (err2) { res.writeHead(404); return res.end('not found: ' + p); } send(alt, d2); });
  });
});
server.listen(PORT, '127.0.0.1', () => console.log(`serving ${ROOT} at http://127.0.0.1:${PORT}/ (music: ${MUSIC})`));
