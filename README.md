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
  from `file://`. The last three tagged builds live in `releases/`; every older one is in git history at its tag (§118).
- Deploy: Cloudflare Workers (static assets), Git-connected — build `npm run build` (writes `dist/index.html`), deploy `npx wrangler deploy`; `wrangler.jsonc` points assets at `dist`. Serves at retinarave.com.
- Landing (v0.8.1): a tile per scene — click one and it plays live on the muted built-in demo before any music is shared; the start buttons keep it (`0` hands back to the director). Thumbnails: `tools/thumbs.sh` → `site/thumbs/`.
- Keys: `1`–`6` force a scene (FLUID · FLUID2 · NAV · DUST · TORUS · MANDALA) · `0` hands it back to the director · `n` or `→` the next scene, `←` the previous, both cycling · `?` / `h` the help view · `p` the routes panel · `Esc` closes. On a phone (v0.6): the
  microphone is the way in, a bottom bar has help / previous / next / fullscreen, a swipe steps the scene, a held press opens the help.
- Docs: `docs/CONTRACTS.md` (what a scene, effect or transition may touch — the only thing a contributor needs),
  `docs/ENGINE.md`, `docs/HARNESS.md` (every test and trace command), `docs/DECISIONS.md` (every deviation, with its
  proof), `docs/workers/` (the briefs the scenes were built from, and the reports).
- Tests: `node tools/check.js` (static), `GPU=1 tools/accept.sh` (the full sweep, ~20 min, writes `tools/accept/<ver>/`).

Non-negotiables: zero dependencies · native modules · every visual parameter traces to the music state (a constant is a
manual setting, shown as one) · no `Math.random()`, no wall clock in the picture · the panel is a no-op until touched ·
the reference screenshots' md5s change only when a commit says so.

## Credits
The fluid substrate is after Pavel Dobryakov's [WebGL-Fluid-Simulation](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation) (MIT, 2017; notice in THIRD-PARTY.md). The way music drives it owes ideas to [WebGL-Fluid-Enhanced](https://github.com/michaelbrusegard/WebGL-Fluid-Enhanced) (the ESM API shape), [fluid-music-visualizer](https://github.com/oliver-kopcik/fluid-music-visualizer) (onsets → splats, pitch class → hue) and [Fero-Fluild-Lamp](https://github.com/little-noob/Fero-Fluild-Lamp) (bass / mid / high split); the grammar itself is this repo's own measured mappings (DECISIONS §57, §58, §70, §74, §79, §81).
NAV3's drop (`assets/scenes/nav3/implode.js`, DECISIONS §140) is built on the parabolic root points of M and their internal angles (Douady–Hubbard, *Étude dynamique des polynômes complexes*, 1984–85), the parabolic implosion and its phase (Lavaurs, thesis, Orsay 1989), the Fatou coordinates and the horn map (Shishikura, *Bifurcation of parabolic fixed points*, LMS 274, 2000) and the horn map's translation constant σ (Inou–Mukherjee, Invent. Math. 204, 2016); the chart-free navigator under it (`nav.js` on `math/field.js`) revives the v0.8 design of `docs/workers/nav2.md`. Ideas only, re-derived here; the notice is in THIRD-PARTY.md.
