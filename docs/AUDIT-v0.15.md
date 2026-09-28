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
