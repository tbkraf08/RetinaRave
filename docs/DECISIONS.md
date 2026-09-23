# Decisions — every deviation from cardioid3 / synapse2, and why

Sources are read-only: `~/Documents/Kraftek/Cardioid/cardioid3.html` (v3, trusted), `cardioid4.html` (shape only),
`~/Documents/TomaCoS/claude_scratch_sept_20_2026/synapse2.html`.

## §0 Extraction (2026-09-22)

- **Layout additions beyond the spec's target tree.** `assets/math/util.js` (TAU, clamp, mix, frac, wrap1, sstep, ema,
  Spring, hsv — used by math, engine and scenes alike; scenes may import `math/*`), `assets/engine/state.js` (MS + XS,
  so stages can import them without a cycle through features.js), `assets/engine/features-slow.js` (tempo, harmony,
  section — features.js would have passed the 350-line cap), `assets/engine/engine.js` (the facade the spec calls
  `engine`), `assets/core/loop.js` (the frame loop; `main.js` stays a 50-line boot).
- **Effect contract is imperative, not declarative.** The spec sketched `{uniforms, glsl, params}`; the v3 chain needs
  ping-pong (feedback), a side-chain with four targets and six passes (bloom) and a screen pass (composite). Effects
  are `{name, order, init(ctx), run(io) → target|null}`; `io.aux` carries side-chains. Documented in CONTRACTS §3.
- **Scene "variants"** replace v3's `base(id)` / `SC.drum` / `SC.drumT` special case. DRUM is `nav.variants[0]` with
  id 4; the core keeps a generic `SC.vT`/`SC.vmix` (0.8 s ema, exactly v3's `SC.drum`) and passes `vmix` to `draw`.
  `pickScene` skips entries whose score ≤ 0 (v3 skipped id 4 explicitly when `NAV.mode!=='INT'||!cycBase`; the drum
  variant's `score` now returns 0 in that case).
- **Home-scene slots** replace the director's reads of `NAV.mode/extBeat/landed`: `rt.home`, `rt.awayBeat`,
  `rt.settledAt` (consumed by the director by zeroing it; NAV mirrors the zero into `N.landed` on its next update —
  one frame later than v3's in-place reset, nothing reads it in between). `updateNav` receives
  `{isLogical, drum}` instead of reading `SC` directly.
- **Update order.** v3: updateNav → updateScenes → updateGroove. Eigenwobble: engine (music → stages → fix → groove) →
  scene updates → director. GROOVE reads only MS; NAV and the director never read GROOVE in their updates, so the
  values are identical (parity: max |diff| 0 over 24 s on every field including `groove.rot`).
- **`MS.level` deleted** (declared and never read in v3). Synapse's `level` arrives in §2 as `lvl`.
- **Runtime-created MS fields declared** with defaults in `state.js` (`highM buildPk liveT arcT surRaw repeat _susHi`)
  so the schema is closed; parity reports them as "missing in v3" on the fake path because v3 never creates them there.
- **Keys**: `1–9` force scene id 0–8 and `0` returns to auto, without the HUD being open (v3: only with HUD, `6` = auto).
- **The one wall-clock term kept**: `LOOK.pal[3]` has a `sin(now·0.7)·(1−presence)` wobble — it only acts while there
  is no music (that is the "muted audio visibly idles" behaviour), so it stays.
- **The director writes `MS.seed.scene`** (look memory, v3 behaviour). It is the one core write into MS; declared in
  `feats.js` under `seed`.
- **Continuity monitor flags spikes, not speed.** Ported as-is, `monitor.js` flagged v3 itself: 50+ frames per minute
  of 0.06–0.11 per-frame motion in EXT right after drops (the θ/log G springs are fast there). Those are smooth ramps.
  The monitor now counts them in `MON.fast` and flags only spikes (`d > 0.06` and `d > 2.5·dPrev + 0.01`), which is
  the invariant that matters (chart cuts). Eigenwobble: 0 violations / 60 s (`fast` 36).
- **Parity clock.** `tools/parity.js` injects a deterministic 60 Hz rAF clock (`CLOCK=1` in cdp.js) into both pages.
  It starts ticking at the page's first `requestAnimationFrame` call, because a module page registers its loop a few
  real frames later than v3's sync script and the first `dt` would otherwise differ (found: 3-frame phase offset).
- **Bench.** `CARD.bench(0,300)`, 1280×633, GPU=1: Eigenwobble 0.032–0.048 ms, v3 0.042–0.056 ms (one 0.7 outlier).
  Same shader, same uniforms; the "within 5 %" criterion is below this bench's noise floor.
- **Grid worker** lives in `math/mandel.js` as `startGridWorker()` (browser-only, called by NAV's `init`); the module
  is still node-importable because nothing runs at import.
- **Dropped from v3**: TUNNEL, TONGUES, LOEWNER, KLEIN scenes and their math (Maskit, Loewner), `VS_LN/FS_LN`, the
  Maskit PiP, `test_maskit.js`, `test_klein_de.js`. The rotator (`ROT`) went with TONGUES.
