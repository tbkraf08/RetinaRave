// Zero-dependency static server for dev (file:// blocks module imports). usage: node tools/serve.js [port] [root]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = +(process.argv[2] || process.env.PORT || 8765);
const ROOT = path.resolve(process.argv[3] || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css', '.json': 'application/json', '.md': 'text/markdown', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm', '.txt': 'text/plain' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
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
server.listen(PORT, '127.0.0.1', () => console.log(`serving ${ROOT} at http://127.0.0.1:${PORT}/`));
