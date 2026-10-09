# NAV2 retune plan — "the set moves with the music" (2026-10-08)

The user's ask: *"update NAV set to move more intuitively with the music … I like NAV better than NAV2 → reset NAV2 as NAV →
ALL WORK SHOULD BE DONE IN NAV2 … Anything is open to change (don't get stuck in a local maxima)."* Review: `nav-retune-review-2026-10-08/`.

## The user's answers (2026-10-08) and the leans taken where no answer came

| # | Question | Answer |
|---|---|---|
| 1 | Clone NAV over id 8, `home:false`, NAV byte-identical control, keep green.js as a ruler | lean taken: yes (§97) |
| 2 | Zurna as a 7th track? | **No file exists; tune on the six.** Zurna was the user "highlighting parts I liked visually". |
| 3 | Exposure policy | lean: the loudest sustained bars are the MOST legible (dark interior, bright rim); white is spent on transients + the drop slam only |
| 4 | Colour | **"color on key"** — the palette anchors on `key`/`mode`/`modeShade` via `keycolour.js`, drift becomes a per-phrase step |
| 5 | What moves c on a groove | lean: all four — beat breathing on the radius (crest on the line), `subGate` in/out of the root, bass pitch up/down, a new internal angle per phrase |
| 6 | Kick → Misiurewicz jump | **"find the goldilocks, not too much, not too little"** — ears' kick lane, sized by `kickAmp`, measured jumps/bar on the six, tuned to the middle |
| 7 | Exterior spirals too chaotic | lean: the line trap turns per BAR (downbeat), the per-beat part is an accent on `beat` strength |
| 8 | Bulb chooser | **a + c** — keep interval→bulb as the species, add a phrase-driven walk through the internal angles, AND Green's ruler as a fitness (toward boundary complexity when loud, toward simple when quiet) |
| 9 | Drops | lean: keep NAV's rule (NAV owns drops, §95); the dust is dimmed by the exposure knee, not shortened |
| 10 | Validation | lean: `tools/lumtrace.js` numbers + contact sheets on the six, clone vs id 0, plus the user's eye in file mode |

Standing rules that govern: reactive over predicted · "the double time should be accenting rather than driving" · 0 display lead in
stream mode · the v0.2 look stays, variants opt-in (colour-on-key is the user's call here and overrides for NAV2) · a look remark is a
retune request · the legibility brief in `DUST-OVERHAUL-SESSION-PROMPT.md` ("a viewer with the sound off should roughly reconstruct
the song's structure … quiet is quiet, loud is loud").

## Steps (each a builder, each proven on `IDS=8` with s0 untouched, each a DECISIONS § with numbers)

### 0. The clone (§97) + the ruler (§98)
`assets/scenes/nav2/*` = NAV; `tools/lumtrace.js` baseline on SeeYouDrop 25–60 and Vienna 60–95 at id 0.

### 1. Legibility — exposure and colour (§99) — BUILT 2026-10-08 (look2.js; the numbers in §99; the eye still owed)
Three brightness terms (nav-review §3): the interior smoulder `par²·.35`, the boundary flash `edge·(.3+.4 hit)` with its 40 % white,
the hue wheel through green/yellow. Build:
- **Exposure knee** on the final colour before bloom (port NAV2's `uLum` knee (0.2, 3) + `uExtG` .35 from the old nav2 shaders, git
  history `assets/scenes/nav2/shaders.js` before §97) so no term can clip; `clipFrac` on the baseline windows → < 0.02 per 5 s row.
- **The smoulder follows loudness, not the root**: `par` no longer saturates at ρ→.98; base light = `baseLight(loudRel…)` (§63
  `loudlight.js`), interior gain capped so `grad` (structure) at the loudest 5-s rows is ≥ the window median.
- **Boundary flash** scales with `snareAmp` (the edge flash is the snare's) and with how much boundary is on screen (a cheap proxy:
  the flash weight × (1 − edgeCoverage ema) — or simply cap the white share at .15 and let the knee do the rest).
- **Colour on key**: `mkAnchor()` from `keycolour.js` with `key / mode / keyConf / modeShade` as `uPal.x`'s anchor; the drift becomes
  a step per phrase (`phrase16Pos` wrap) around the key hue, ±1/12 turn; `keyConf` low → the old drift. The hue when "it turns green"
  is then a chosen state: a key, not a clock.
- Measure: lumtrace on the two baseline windows + CyborgNinja 40–70 (the 0:48 drop), before/after table in §99.

### 2. Motion — the groove moves c (§100) — BUILT 2026-10-08 (move2.js: kick lane THR .45 / HOLD 2 beats = .69–1.29 jumps per bar on the six, breath on h AMP .3, sub press, pitch lean, trap π per bar; the numbers in DECISIONS §100; the eye still owed)
- **Kick → Misiurewicz** on `kickEvt`/`kickAge`, size by `kickAmp` (sqrt law §74, floor .31), NAV's refractory kept, veto while
  `buildLive` parks. **Goldilocks:** count jumps/bar on the six tracks' drop windows; target ≈ 1 per bar on a 4/4 groove and ≤ 2 on
  double-time; expose `&kjump=` to sweep; the §46 "no beat = circle, beat = pinch" rebound becomes a real beat response.
- **Beat breathing** on `h` via `beatgrid.js spin()`'s profile (crest ON the line, downbeat ×1.5, amplitude from `beat` strength,
  `acc` from the tongue ladder = the double time ACCENTS the breath, never speeds it).
- **`subGate`**: sub on → c presses to the rim (ρ↑, arms tighten); sub off → c relaxes toward the centre (the Zurna call-and-response
  / half-bar chops become visible).
- **Bass pitch**: `subNote` glides move c's internal angle φ (up = toward 1/3's side, down = toward 1/2's) within the bulb's ±1.3 rad —
  the 808 slide becomes a visible lean.
- **Line trap**: π per BAR; the per-beat re-thread becomes an accent of `beat` strength (`.12·beat` extra turn), not a half turn.
- Measure: lumtrace unchanged or better; the monitor's §0 spike rule clean on the six (`tools/monitor.js`); jumps/bar table.

### 3. Navigation — a + c (§101)
- **a. The phrase walk:** on each `phrase16Pos` wrap (or `barNovelEvt`), the target internal angle steps along the Farey ladder from the
  interval's bulb toward its neighbours (p/q → the mediants), back on the next phrase of the same section; the species still comes from
  `interval`, the walk makes a section visit 3–4 bulbs instead of one.
- **c. Green's ruler as a fitness:** `green.js measure()` (Q = boundary complexity, edge speed) sampled on the candidate targets; the
  walk prefers the candidate whose Q is high when `loudRel` is high and low when quiet; the drop keeps NAV's exterior rule.
- Measure: distinct places visited per minute (from `n2info()` traces, `tools/truth/nav2-window.py`), the monitor clean, lumtrace clean.

### 4. The user's eye
File mode, key 9 vs key 1… SeeYouDrop 0:25–1:00, Vienna 1:00–1:35, CyborgNinja 0:40–1:10, Malicious 2:20–2:40, IBelongHere 0:40–1:10,
WhoLikesToParty one drop. Contact sheets from lumtrace per window in `docs/plans/nav-retune-review-2026-10-08/after/`. Tag v0.34
only on the user's word; the home swap (id 8 → home) only on the user's word.
