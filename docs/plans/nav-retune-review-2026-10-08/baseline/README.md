# Luminance baseline — v0.33 NAV (scene 0), 2026-10-08

`node tools/lumtrace.js` on the v0.33 tree (ca3196e), GPU=1 headless 1280×633, 10 fps, 640 px analysis width; the ruler every
NAV / NAV2 retune is judged against (docs/HARNESS.md "Luminance ruler"). The CSVs live in `tools/work/lum/baseline-v0.33/`
(gitignored); a repeat of the SeeYouDrop run was `cmp`-identical (md5 5fd76f2f…).

- `SeeYouDrop-s0-25-60.txt` / `-sheet.jpg` — `node tools/lumtrace.js SeeYouDrop --scene=0 --from=25 --to=60`
- `Vienna-s0-60-95.txt` / `-sheet.jpg` — `node tools/lumtrace.js Vienna --scene=0 --from=60 --to=95`

Peak frames: SeeYouDrop 39.2 s centre 0.965 · p95 0.961 · clipFrac 0.176 (the centre blow-out); 57.6 s meanY 0.596 · grad
0.0046 (the drop flash: bright AND flat — the complaint's signature). Vienna 86.2 s centre 0.922 · clipFrac 0.092; 76.6 s
grad 0.0072 at meanY 0.039 (dark, not washed).
- `CyborgNinja-s0-40-70.txt` / `-sheet.jpg` — `node tools/lumtrace.js CyborgNinja --scene=0 --from=40 --to=70` (taken for §99 on
  the §97 tree, id 0 unchanged since v0.33; peak 60–65 clipMx 0.149, centre 0.944 max).
