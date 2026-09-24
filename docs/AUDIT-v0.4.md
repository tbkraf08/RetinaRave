# Eigenwobble v0.4 — the real-window check (2026-09-24, §27)

One headed run in the shape of `AUDIT-v0.3.md` §2, twice (runs E1, E2), on the v0.4 candidate (master at `e01c157`: the
routing core, the manual overrides, the panel): a real track through tab capture, the panel opened with `p` while the
music plays, two routes set **through the panel's own controls** (not `CARD.route`), the meters, a scene switch, a 10 s
minimize, the frames, the storage, and the panel's "reset everything". Raw outputs: `tools/accept/v0.4/audit-e.txt`,
`audit-e2.txt`, `audit-q-control.txt`; the step list is the session scratchpad's `audit/audit4.sh` (the `DRIVE` and
`METER` expressions there drive the elements the worker's report names, `docs/workers/panel.md`).
`GPU=1 tools/accept.sh` on the merged code: `accept-30.txt` (the verdict is in DECISIONS §27).

The track: "Who Likes to Party" (Kevin MacLeod, 4:16, ~117 BPM) in its own Chrome window, captured through the landing
card's `Share a tab` (`CAPTITLE`), Eigenwobble at 1920 × 1080 native DPR 0.75 (canvas 1407 × 670 with the tab-share
infobar), 52 s with a 10 s minimize at 39 s. Key `7` forces FEIGEN at 8 s (the routed scene must be the one on screen).

| what | number (run E2 · run E1 where different) | verdict |
|---|---|---|
| capture starts | `mode capture`, `heard` true within 8 s (hop 750 · 740), `bpm` 116.5 / `bpmSyn` 116.9 at 8 s, 116.9 / 116.9 at 52 s | ✓ |
| `p` opens the view at E | `HELP.on` true, `scrollTop` 2815, **FEIGEN's block first** (`pe-blk-feigen`) and the only one marked `cur` | ✓ the current scene leads |
| two routes through the panel | `#pe-src-feigen-bass` ← `centroid`, `#pe-k-feigen-bass` ← `1.5`, `#pe-src-nav-hit` ← `snare` (value set, `input` + `change` dispatched) → `CARD.routesString()` **`feigen.bass=centroid*1.5,nav.hit=snare`**, `ROUTE.n` 2, no row error, `ROUTES` specs normalised (`c 0, b 0, inv false, tau 0`) | ✓ the controls reach the core |
| the meters move, and mean what they say | FEIGEN `bass` row **0.603 → 0.904** (source `centroid` 0.608 × 1.5 = 0.91 = `view('feigen').bass` 0.911; the real `MS.bass` was 0.79), 2 s later 0.667 → 1.000 (clamped: a level stays 0..1); NAV `hit` row **0.225 → 0.225** = `MS.snare` 0.153 → `view('nav').hit` 0.153 while `MS.hit` was 0.103 — the routed value is the source's, not the engine's | ✓ source → routed, live |
| the preset box and the storage line | textarea 240 chars of `routesJSON()`; `localStorage[ew.routes.v1] · saved (240 chars)` | ✓ (the real path stores; `#test` never does) |
| the picture with the route | `audit4-feigen-routed-24s.jpg`: FEIGEN with `bass` fed by the spectral centroid ×1.5 — the filament sharpening and the interior trap's light (`uBands.x` in `colour-v2.js`) at 0.9–1.0 while the engine's own `bass` read 0.4–0.8 | ✓ the HEAD uniform follows the route |
| the route survives a scene switch | key `1` (NAV) → `logical 0`, both views still routed, `routesString` unchanged; key `7` back → FEIGEN, `next −1`, still routed | ✓ |
| the route survives a resume | minimize 10 s at 39 s → `back`: first 60 frames **0 onsets, 0 surprise, 0 drops, glitch 0** (the §26 hold), `dt0` 10058 / 67 / 33 ms, `routesString` unchanged, `view('feigen') !== MS`, the panel's ticks went on (53 → 81) and the meters read 0.625 → 0.937 straight after | ✓ |
| frames | **2493** in 52 s with 10 s hidden = 59 fps visible · **0 black** · **1 frame > 100 ms = the minimize itself** (10 058 ms) | ✓ no long frame from the panel, the routes or the switches |
| `q` at 1 Hz (run E2) | 0.52 at 1 s → 0.59 at 13 s, a dip to **0.52 when the panel opened and FEIGEN was forced** (recovered in 4 s), 0.63 by 30 s, 0.43 after the minimize → 0.63 again by 50 s | ✓ the panel's opening costs one dip |
| **`q` at 1 Hz (run E1)** | 0.39 → 0.25 → **0 by 2 s, at most 0.06 for the whole run**, while the frame count says 58 fps | **not reproduced**: run E2 minutes later climbed as v0.3's run B did; the control (`audit-q-control.txt`, the v0.3 release and the v0.4 bundle from `file://` back to back, same track, 30 s each) is **identical to the second decimal on both** (0.54 → 0.66, 60 fps) — the routing code does not move `q`; run E1's collapse was the machine's moment (the desktop Chrome's GPU process was at 18 % when the window opened), recorded here because a single low run would otherwise be read as a v0.4 cost |
| the routing cost | `ROUTE.ms` **0.008–0.010 ms** with two routes (the 1 s ema of `refreshRoutes`); `ENGINE.ms` 1.9 (E2) / 1.3–2.1 (E1) — unchanged from v0.3's 2.1–2.5 band | ✓ |
| "reset everything" | click `#pe-resetall` → `ROUTE.n` 0, `routesString` empty, `MANUAL.trans` `morph`, `forced −1`, the stored preset now `{"routes":{},"manual":{"scene":-1,"trans":"morph","colour":{"nav":"v2","feigen":"v2"},"post":{}}}` | ✓ the no-op state is a stored state too |
| end | `ERRS []`, `nonFinite []`, `glerr` undefined, 0 `[EXC]`, `mode capture`, `hist [6, 0, 6]`, `colour {nav: v2, feigen: v2}` | ✓ |

Shots: `audit4-panel-open-13s.jpg` (E opened over FEIGEN, the block first), `audit4-panel-routed-20s.jpg` (the two
routed rows highlighted, `bass` 0.679 → 1.000 through ×1.5, `kick` and the rest at identity), `audit4-feigen-routed-24s.jpg`,
`audit4-nav-routed-28s.jpg`, `audit4-panel-back-50s.jpg` (the panel after the resume, meters live).

## Verdict

The one thing headless never did — a hand on the controls while a real track plays — behaves as the contract says: a
route set in the panel is in force on the next frame, the meter shows the source and the routed value (and the routed
value is what the scene reads, HEAD uniforms included: the FEIGEN shot is `bass` fed by the centroid), it survives a
scene switch and a resume, it costs nothing measurable (`ROUTE.ms` 0.01 ms, `q` unchanged against the v0.3 release in
the control), and "reset everything" returns the page to the identity state and stores that. No engine bug this time.
One harness lesson, again: **a single low `q` run is not a cost finding** — the second run and the file:// control
(the previous release and the candidate, same conditions, minutes apart) are what separate the code from the machine.
