# Retina Rave
[www.retinarave.com](https://www.retinarave.com)


A zero-dependency WebGL2 audio-visual engine: native ES modules, no framework, no build step to run. Music in (a captured
tab, the microphone, or the built-in demo synths), six scenes out — Julia-set navigation, a Feigenbaum dive, a particle swarm, a
box-fold mandala, a Hopf-fibration torus, 4-polytopes on S³ — driven by a two-estimator music analysis (bands, onsets,
tempo, drops, sections, mood) and a director that picks scenes, remembers looks per section, and crossfades through a
pluggable transition. The `?` overlay explains every field the machine reads; its part E (key `p`) is a control panel
that re-wires which music feature drives which visual parameter, per scene, by hand.

Called **Eigenwobble** until v0.5 (2026-09-24); the decision log, worker reports and acceptance logs keep that name.

- Run: `node tools/serve.js` then open `http://127.0.0.1:8765/` — or `node tools/bundle.js` and open `dist/retinarave.html`
  from `file://`. Tagged builds live in `releases/`.
- Deploy: Cloudflare Workers (static assets), Git-connected — build `npm run build` (writes `dist/index.html`), deploy `npx wrangler deploy`; `wrangler.jsonc` points assets at `dist`. Serves at retinarave.com.
- Landing (v0.8.1): a tile per scene — click one and it plays live on the muted built-in demo before any music is shared; the start buttons keep it (`0` hands back to the director). Thumbnails: `tools/thumbs.sh` → `site/thumbs/`.
- Keys: `1–9` / `0` force a scene · `n` the next scene, cycling (ids past 8 have no digit) · `?` / `h` the help view · `p` the routes panel · `Esc` closes. On a phone (v0.6): the
  microphone is the way in, a bottom bar has help / previous / next / fullscreen, a swipe steps the scene, a held press opens the help.
- Docs: `docs/CONTRACTS.md` (what a scene, effect or transition may touch — the only thing a contributor needs),
  `docs/ENGINE.md`, `docs/HARNESS.md` (every test and trace command), `docs/DECISIONS.md` (every deviation, with its
  proof), `docs/workers/` (the briefs the scenes were built from, and the reports).
- Tests: `node tools/check.js` (static), `GPU=1 tools/accept.sh` (the full sweep, ~20 min, writes `tools/accept/<ver>/`).

Non-negotiables: zero dependencies · native modules · every visual parameter traces to the music state (a constant is a
manual setting, shown as one) · no `Math.random()`, no wall clock in the picture · the panel is a no-op until touched ·
the reference screenshots' md5s change only when a commit says so.
