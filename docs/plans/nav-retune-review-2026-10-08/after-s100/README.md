# Luminance after §100 — NAV2 (scene 8) with the motion pass, 2026-10-08

`node tools/lumtrace.js <Track> --scene=8 --from=.. --to=.. --port=8851` on the §100 tree (GPU=1 headless 1280×633, 10 fps, 640 px
analysis width), the same three windows as `../after-s99/` (the legibility pass) and `../baseline/` (id 0). The `.txt` tables and the
contact sheets persist here (jpgs force-added); the CSVs are in `tools/work/lum/s100f/` (gitignored). The reading against §99 is in
DECISIONS §100 ("Luminance"): grad and clip unchanged, the centre darker on SeeYouDrop / CyborgNinja (the kick flights and the breath put
the interior mid-flight more often — the moment the user liked at Zurna 33 s). Knobs for the A/B on id 8: `&n2kick=0` (v3's picker) ·
`&n2breath=0` · `&n2sub=0` · `&n2pitch=0` · `&n2trap=0` (the half turn per beat); `&n2kick=THR,HOLD` sweeps the goldilocks
(`tools/navkicks.js` is the counter). The jumps-per-bar tables: `tools/work/navkicks/sweep6.txt`, `sweepF.txt`, `sweepT.txt` (gitignored;
the rows that matter are in §100).
