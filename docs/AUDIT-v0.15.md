# AUDIT v0.15 — the engine's ears, measured (SeeYouDrop, file mode)

The rulers are the ones in `ENGINE-CHLADNI-SESSION-PROMPT.md` ("The rulers for looks synced"). Every number here comes from
`tools/truth/compare.py` on a trace recorded in the page (`tools/filetrace.js`, deterministic file mode under `CLOCK=1`, 48 kHz,
the whole 157 s of SeeYouDrop), against `tools/truth/SeeYouDrop.json` (the offline truth: `trackmap.py`) and the annotation
`SeeYouDrop.sections.json`. "old" is the v0.14 engine's field on the same trace (v3 + synapse); "new" is the v0.15 ears / map.

## §1 After the FILE + EARS merges and the wiring (`1e22c2c`) — `tools/accept/v0.15/ruler-det-a.md`

13 pass, 9 fail, 12 reported. Headlines:

| ruler | old (v0.14) | new (v0.15) | target |
|---|---|---|---|
| kick F ±30 ms, 25–45 s | 0.25 | **0.79** | ≥ 0.90 — miss |
| kick F ±30 ms, whole track | 0.19 (650 false) | 0.53 | — |
| kicks on bare 808 re-triggers | — | 13 % (25–45 s), 8.6 % whole | ≤ 5 % — miss |
| kick lag, first frame / placed by `kickAge` | −10 ms (no age) | +18 / **+9** ms | med ≤ 15 — first frame misses by 3 ms |
| sub pitch ±30 cents, sub-loud frames | absent (5.4–5.9 Hz bins) | 72.7 % (median error 8 cents) | ≥ 90 % — miss |
| `subNote` = truth beat note | — | 88.9 % (node) | ≥ 90 % — miss by 1 % |
| slides on 57.6–90 s | absent | 32 of 41, sign 31/32 | pass |
| drops | 2/2 in this run (1:45 missed in a v0.14 capture run) | `mapDropEvt` 57.617 / 105.600, none else, every run | pass |
| boundaries ±1 beat of the annotation | 0 of 11 | 7 of 11 (4 annotated times are off the bar grid, ears.md §2.4) | all — miss |
| returns labelled | no return flag | 4 of 5 | all — miss |
| tonic | G# (the fifth: the 35 Hz root is invisible above 65 Hz) | **C# minor** from 0.7 s | pass |

Determinism: two CLOCK=1 file-mode runs of 0–60 s are byte-identical (FILE, `docs/workers/file.md`); the first real-music md5s
(TORUS id 3, `&at=100`, f240 `5ac81cba…`, f480 `6158b70f…`). Nothing moved: parity fake 0 diff, ids 0–10 md5 identical to v0.14,
mixs 641f6633 (`tools/accept/v0.15/scene-md5-v015-skeleton.txt`). Capture-mode lag: **not measured** (no headed run this session).

Pass 2 (EARS, `docs/workers/brief-ears2.md`) attacks the kick front end, the sub pitch and the first-frame lag with the
non-causal map in file mode.

## §2 After EARS pass 2 (`f42bf93`) — `tools/accept/v0.15/ruler-det-b.md` (file-det), `ruler-rt-b.md` (real-time file, 20–60 s)

In file mode the kicks, snares, hats and the sub now come from the **non-causal map** (a proper STFT + HPSS and a centred YIN
over the whole decoded track), released on the frame nearest their onset (ages in [−1/120, 0) on that frame). Every live
mode keeps the causal ears of §1.

| ruler | §1 | §2 | target |
|---|---|---|---|
| kick F ±30 ms, 25–45 s / whole track | 0.79 / 0.53 | **1.000 / 1.000** (tp 229, 0 miss, 0 extra) | ≥ 0.90 |
| kicks on bare 808s | 8.6 % | **0.0 %** | ≤ 5 % |
| kick lag first frame / placed | +18 / +9 ms | **+2 (p90 +7, max +8) / +0 ms** | med ≤ 15 |
| sub pitch ±30 cents | 72.7 % | **100.0 %** (median 1 cent) | ≥ 90 % |
| `subNote` per beat | 88.9 % | **91.1 %** | ≥ 90 % |
| slides | 32 / 41 | 24 / 41, sign 24/24, span 0.150 s (the truth's own trace recovers only 25 / 41 at 60 fps) | — |
| drops | 2/2 | 2/2 | exact, none else |
| boundaries ±1 beat (annotation **v2**, bar-pinned) | 7 / 11 | 9 / 10 (the turn, bar 82, missed) | all |
| returns | 4 / 5 | **5 / 5** | all |
| real-time file mode, 20–60 s | — | kick F 0.994, lag +1 ms, sub 99.8 % | — |

**Read this table with one caveat, stated plainly:** in file mode the ears now run the *same kind of* front end as the truth
tool (HPSS onsets with the same click definition, YIN on the same band), so "F 1.000" and "100 %" say the page reproduces the
offline analysis exactly and on the right frame — they do not independently prove the truth is right. The truth itself was
checked at fine grains by hand in E0 (the walk notes, both drops, the void, the tonic by two different chromas); the causal
live path (§1's numbers) is the independent engine measurement and stays as it was. Two reference bugs pass 2 found and fixed
in the truth tool: the f0 contour's rate is 100.2273 Hz, not 100 (a 358 ms drift over the track — most of §1's 72.7 %), and
the front end did not reproduce itself at 48 kHz (the map now analyses at 44.1 kHz whatever the context rate).

Nothing moved: two full-track det runs `cmp`-identical, parity fake 0, the full md5 list identical to the skeleton list
(`scene-md5-v015-ears2.txt`). `buildMap` 2.9 s in the page (was 1.6 s): a one-time pause before playback.

## §3 CHLADNI (id 11) — the nine SeeYouDrop windows (file mode, CLOCK=1; `docs/workers/chladni.md` (g), montages `tools/accept/v0.15/ch-win*.jpg`)

| # | window | verdict | the number |
|---|---|---|---|
| 1 | walk 12.4–25.7 s | figures met, switch timing not | 4 distinct figures (1,2) (2,5) (2,3) (1,5); switch +0.085 / +0.053 / +0.187 / +0.237 s after the truth arrival (target 50 ms; the ears' own YIN arrival is +0.14 / +0.04 / +0.05 / +0.05 of it) |
| 2 | groove 25–45 s | met | a leap on 38 / 38 kicks, lag +3.7 ms, none on bare 808s; the root figure held 13.4 s |
| 3 | climbs | met | hit density 2.62× / 2.56× the groove; camera rises 0.70 → 0.90 / 1.00 rad |
| 4 | void 49.9–57.6 s | met | plate amplitude mean 0.014; the inward spiral 0 → 0.87 with `buildProg` |
| 5 | drops 57.6 / 105.6 s | met on timing | the slam +11.1 ms / +4.1 ms (inside one frame) — **but the composite's global flash + glitch bars wash the frame grey for ~0.15 s and hide the figure** (not a scene setting: CONTRACTS §1.4 has no per-scene flash weight) |
| 6 | slides 57.6–90 s | partly | 82 % of the time on the tonic figure, but only 4 / 13 truth slides read as a morph; `subGlide` cannot separate a slide from an 808 attack (p90 13.3 groove vs 10.5 slides) — needs the map's slide list as a field |
| 7 | gated 105.7–130 s | met | 19 gate dips, median spacing 1.58 s vs the 1.60 s bar, amplitude down to 0.012 |
| 8 | outro 134.5–157 s | met | `lpSweep` fog 0.93 → 0.26, the walk returns twice, the sand dims 0.62 → 0.15 |
| 9 | brightness | met | p95 luminance 0.56–0.73, median 0.63 (5 of 6 groove shots in 0.6–0.8) |

Bench 1.23× TORUS2 (gate 1.5×). Continuity monitor over 60 s of file mode: `viol []`. s11 md5s (`&ears=1&figure=0`)
606f721a / f7b1c6ee on the merged tree `1d155a5` = the worker's two runs. Not run: `tools/accept.sh` (the user's word);
CyborgNinja / WhoLikesToParty 0–30 s and a capture-mode run (the spec's "shown, not tuned") — left for the user's look.
