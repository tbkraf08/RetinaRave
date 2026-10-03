// site/whats-new.html from releases.json (SOCIAL-PLAN §3.4): static, no script needed to read it — per version an anchor
// (#v0.30), the date, the class as a small label, the title, the body, the scene thumbnails from site/thumbs/, and — only when
// an entry has a `clip` — a click-to-load YouTube embed behind a SELF-HOSTED poster, so no third-party request leaves the page
// before a click (the "no trackers" line on the landing has to stay true here too). The look is about.html's: its <style>
// block is read and reused as-is (one style source, no second one), plus the few rules the release list needs. The licence
// header comes from tools/license.js. `npm run build` runs this before the site/ copy; the generated file is committed too
// (site/ files are static sources). It also refreshes the landing card's "New in vX" line in index.html (tools/releases.js
// newIn — the same string tools/bundle.js inlines), so the dev server shows what the deploy shows.
// usage: node tools/whatsnew.js [--check]   (--check: exit 1 if site/whats-new.html or index.html's line is stale, write nothing)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT, load, validate, newIn, hasNewIn, patchNewIn } from './releases.js';
import { stamp } from './license.js';

const OUT = 'site/whats-new.html';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const when = (d) => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const CLASS_LABEL = { scene: 'new scene', engine: 'engine', tuning: 'tuning' };
const DECISIONS_URL = 'https://github.com/tbkraf08/RetinaRave/blob/main/docs/DECISIONS.md';

// id → { name, title } from the scene folders (the registry without a DOM: each index.js imports only math/* and its own folder)
async function sceneMap() {
  const map = {}, dir = path.join(ROOT, 'assets/scenes');
  for (const d of fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name)) {
    const sc = (await import(path.join(dir, d, 'index.js'))).default;
    if (sc && Number.isInteger(sc.id)) map[sc.id] = { name: sc.name, title: (sc.card && sc.card.title) || sc.name.toUpperCase() };
  }
  return map;
}

const EXTRA = `
  /* whats-new: the release list (tools/whatsnew.js) — on about.html's rules above */
  .rel{padding:26px 0 8px;border-bottom:1px solid rgba(255,255,255,.08)}
  .rel:last-of-type{border-bottom:0}
  .rel h2{margin:0 0 6px;display:flex;flex-wrap:wrap;align-items:baseline;gap:8px 14px}
  .rel h2 a{color:#9cf;text-decoration:none;text-transform:none}
  .rel h2 a:hover{text-decoration:underline}
  .rel h2 time{color:#8ab;letter-spacing:.06em;text-transform:none;font-size:11.5px}
  .cls{font-size:10px;letter-spacing:.14em;padding:2px 8px;border-radius:20px;border:1px solid rgba(160,200,255,.35);color:#cfe}
  .cls.scene{border-color:rgba(255,160,220,.55);color:#f9d}
  .cls.tuning{border-color:rgba(255,255,255,.2);color:#aab}
  .rel h3{font-size:20px;font-weight:300;letter-spacing:.02em;margin:0 0 10px;color:#fff}
  .thumbs{display:flex;flex-wrap:wrap;gap:8px;margin:4px 0 12px}
  .thumbs a{display:block;width:96px;border-radius:6px;overflow:hidden;border:1px solid rgba(255,255,255,.14);text-decoration:none;color:#cfd6e6;background:rgba(10,8,24,.85)}
  .thumbs img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;opacity:.92}
  .thumbs span{display:block;font-size:9px;letter-spacing:.16em;text-align:center;padding:4px 2px 5px}
  .clip{position:relative;margin:4px 0 14px;border-radius:10px;overflow:hidden;background:#000;aspect-ratio:16/9}
  .clip img,.clip iframe{position:absolute;inset:0;width:100%;height:100%;border:0;object-fit:cover}
  .clip button{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);cursor:pointer;appearance:none;font:inherit;font-size:13px;letter-spacing:.12em;
    color:#fff;background:rgba(4,4,10,.7);border:1px solid rgba(255,255,255,.45);border-radius:40px;padding:12px 22px}
  .clip button:hover{background:rgba(255,255,255,.16);border-color:#fff}
  .clip small{position:absolute;left:0;right:0;bottom:0;font-size:10.5px;color:#bbb;background:rgba(0,0,0,.55);padding:5px 10px;text-align:center}
  .dec{font-size:12px;opacity:.5;margin:0 0 8px}
  .dec a{color:#9cf;text-decoration:none}
  .toc{font-size:12.5px;opacity:.6;line-height:1.9;text-align:center;margin:-18px 0 10px}
  .toc a{color:#9cf;text-decoration:none;margin:0 4px}
`;

export function render(rel, scenes, aboutHtml) {
  const style = /<style>([^]*?)<\/style>/.exec(aboutHtml);
  if (!style) throw new Error('site/about.html: no <style> block to reuse');
  const anyClip = rel.some((e) => e.clip && e.clip.youtube);
  const entry = (e) => {
    const thumbs = (e.scenes || []).map((id) => scenes[id]).filter((s) => s && fs.existsSync(path.join(ROOT, 'site/thumbs', s.name + '.jpg')))
      .map((s) => `<a href="/" title="${esc(s.title)}"><img src="/thumbs/${esc(s.name)}.jpg" alt="${esc(s.title)}" loading="lazy" width="96" height="54"><span>${esc(s.title)}</span></a>`).join('');
    const clip = e.clip && e.clip.youtube ? `\n    <div class="clip" data-yt="${esc(e.clip.youtube)}"><img src="/${esc(e.clip.poster)}" alt="a frame of the ${esc(e.tag)} clip" loading="lazy">` +
      `<button type="button">▶ play the clip</button><small>the clip plays from YouTube — nothing is loaded from there until you press play</small></div>` : '';
    return `  <article class="rel" id="${esc(e.tag)}">
    <h2><a href="#${esc(e.tag)}">${esc(e.tag)}</a> <time datetime="${esc(e.date)}">${when(e.date)}</time> <span class="cls ${esc(e.class)}">${CLASS_LABEL[e.class] || esc(e.class)}</span></h2>
    <h3>${esc(e.title)}</h3>${clip}
    <p>${esc(e.body)}</p>${thumbs ? `\n    <div class="thumbs">${thumbs}</div>` : ''}
    <p class="dec">for the curious, the engineering notes: ${e.decisions.map((d) => `<a href="${DECISIONS_URL}" rel="noopener">${esc(d)}</a>`).join(' · ')}</p>
  </article>`;
  };
  const script = anyClip ? `
<script>
// click-to-load: the YouTube iframe exists only after a press on the poster — before that the page makes no third-party request
document.addEventListener('click', function (ev) {
  var c = ev.target.closest('.clip[data-yt]'); if (!c) return;
  var f = document.createElement('iframe'); f.src = 'https://www.youtube-nocookie.com/embed/' + c.dataset.yt + '?autoplay=1&rel=0';
  f.allow = 'autoplay; fullscreen; picture-in-picture'; f.allowFullscreen = true; f.title = 'Retina Rave ' + c.closest('.rel').id; c.replaceChildren(f);
});
</script>` : '';
  const top = rel[0];
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>What's new in Retina Rave — every release, newest first</title>
<meta name="description" content="What changed in Retina Rave, release by release: new scenes, what the engine learned to hear, what was retuned. Latest: ${esc(top.tag)} — ${esc(top.title)}.">
<link rel="canonical" href="https://retinarave.com/whats-new">
<meta name="theme-color" content="#020207">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:url" content="https://retinarave.com/whats-new">
<meta property="og:title" content="What's new in Retina Rave">
<meta property="og:description" content="Release by release: new scenes, what the engine learned to hear, what was retuned. Latest: ${esc(top.tag)} — ${esc(top.title)}.">
<meta property="og:image" content="https://retinarave.com/og.jpg">
<meta name="twitter:card" content="summary_large_image">
<!-- generated by tools/whatsnew.js from releases.json — edit those, not this file; the <style> is site/about.html's -->
<style>${style[1]}${EXTRA}</style>
</head>
<body>
<main>
  <h1>RETINA RAVE</h1>
  <div class="sub">What's new.<br>Every release since the site went public, newest first.</div>
  <p class="toc">${rel.map((e) => `<a href="#${esc(e.tag)}">${esc(e.tag)}</a>`).join(' ')}</p>
  <p>Three kinds of change: a <span class="cls scene">new scene</span> (or one rebuilt), something the <span class="cls engine">engine</span> learned to hear or
    show, and <span class="cls tuning">tuning</span> — looks retuned, thresholds moved. Everything here runs on your device; nothing on this page phones home.</p>

${rel.map(entry).join('\n\n')}

  <p class="center"><a class="btn go" href="/">▶ open the show</a></p>
  <p class="center small"><a href="/about">about &amp; support</a> · Retina Rave · a zero-dependency WebGL2 engine, native modules, no framework.</p>
</main>${script}
</body>
</html>
`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  const rel = load(), problems = validate(rel);
  if (problems.length) { for (const p of problems) console.error('FAIL', p); process.exit(1); }
  const about = fs.readFileSync(path.join(ROOT, 'site/about.html'), 'utf8');
  const html = stamp(OUT, render(rel, await sceneMap(), about));
  const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), idx2 = hasNewIn(idx) ? patchNewIn(idx, rel[0]) : idx;
  const cur = fs.existsSync(path.join(ROOT, OUT)) ? fs.readFileSync(path.join(ROOT, OUT), 'utf8') : '';
  const stale = (cur !== html ? [OUT] : []).concat(idx2 !== idx ? ['index.html #newin'] : []);
  if (check) { console.log(`whatsnew --check: ${rel.length} entries · ${stale.length ? 'STALE ' + stale.join(', ') : 'up to date'}`); process.exit(stale.length ? 1 : 0); }
  fs.writeFileSync(path.join(ROOT, OUT), html);
  if (idx2 !== idx) fs.writeFileSync(path.join(ROOT, 'index.html'), idx2);
  console.log(`whatsnew: ${rel.length} entries → ${OUT} (${(html.length / 1024).toFixed(0)} KB, top ${rel[0].tag}${hasNewIn(idx) ? ', index.html #newin ' + (idx2 !== idx ? 'refreshed' : 'current') : ''}; clips ${rel.filter((e) => e.clip && e.clip.youtube).length})`);
}
