# Next session — Retina Rave after v0.10 (written 2026-09-26, at the v0.10 tag)

**v0.10 "the four equations that dance" is tagged and deployed (DECISIONS §42, `docs/AUDIT-v0.10.md`, `docs/workers/maxwell.md`):**
MAXWELL (id 9) — a live 2D Yee-grid FDTD of Maxwell's equations in TORUS2's language: twelve pitch-class charges on the circle of fifths,
a current-loop dipole nudged `beatCount/16` per beat, every hit a real wavefront whose spacing is the rhythm (measured off the field to
0.5 cells), the section as the medium (lens · mirror cavity · lattice · waveguide), the drop a mirror that makes the field stand, the H
field lines as closed contours of the stream function, a round porthole. **Forced-only** (bid 0): key `9` then `n`, or `n` from anywhere
(the new core key, the user's one answered item — `n` cycles the registry through the landing picker). The user asked for the scene and
for the tag without a gate; **the user has not looked at the result yet.**

**First:** show the user `tools/accept/v0.10/montage-maxwell.jpg` (MAXWELL left · TORUS2 right: house, aba, dnb at f360/f840) and
`montage-maxwell-real.jpg` (CyborgNinja + WhoLikesToParty at 20/40/60/80 s), `montage-maxwell-media.jpg` (the four media),
`montage-maxwell-drop.jpg` (drop vs no drop), and `dist/retinarave.html` key `9` then `n`; read them the AUDIT's "What the eye sees" and
the ranked leans (§42). Their word decides — a retune is a named constant at the top of `assets/scenes/maxwell/{fdtd,medium,sources,
render,index}.js`, proven with `IDS=9 tools/scene-md5.sh` (re-base `tools/accept/v0.10/scene-md5-v010.txt` s9 lines) +
`tools/accept/v0.10/det10.py <track> <tag>` for the field's energy / trains / probe on a real track (mp3s in a scratchpad
`…/scratchpad/music/`). The cost lever the worker left alone: tier 3's four substeps (§42 item 6).
- **Promote →** a `score()` (TORUS2's shape, §36), then the Q trace on house + aba (a scene entering the rotation), the `accept.sh`
  "== maxwell" section (s9 md5s, the pinned trains, the key pair, `test_fdtd`), a DECISIONS section, tag v0.11.
- **Docs owed to CONTRACTS** (§42's last paragraph): §1.2 readback, §1.4 hook naming + read-only hooks, §1.10 the porthole under a
  rotating camera, the readback-band sentence. One commit, no proof beyond `check.js`.

**Then — the NAV2 question (v0.8, DECISIONS §39, `docs/AUDIT-v0.8.md`), still open:** NAV2 is id 8, key `9`, forced-only, not swapped
in; the user has not looked. Show `tools/accept/v0.8/montage-nav2-real.jpg` (NAV left · NAV2 right) and `dist/retinarave.html` key `9`;
the AUDIT's "What the eye sees" and the ranked leans (`RHO_FREE` resting brightness first).
- **Approve →** the swap, one commit, `NAV2-SESSION-PROMPT.md` step 4 verbatim (NAV2 → id 0 / home / always / NAV's bid; NAV →
  `nav-v1` id 8 forced-only; DRUM stays nav-v1's variant, score 0; `tools/parity.js` `&scene=0` → `8` and `CARD.NAV || CARD.home` →
  `CARD.REG[8].scene.state`; mixs md5 re-based; scene-md5 lists with s0 ↔ s8 exchanged; `accept.sh` + HARNESS pointers;
  `site/about.html` NAV line; CONTRACTS §1.8), then the Q trace on house + aba (NAV2 is home, picked every phrase), `accept.sh`
  0 FAIL, a DECISIONS section, tag, push.
- **Retune →** the constants are named at the top of `assets/scenes/nav2/{nav2,detect}.js`; prove with `IDS=8 tools/scene-md5.sh`
  + `tools/accept/v0.8/det8.py <track> <tag>`.

**POLYTOPE (v0.9, §41):** the user has not looked at the dance either — `tools/accept/v0.9/montage-polytope.jpg`, key `6`; the ranked leans
in §41; a retune is a constant at the top of `assets/scenes/polytope/*.js`, `IDS=5 tools/scene-md5.sh`, `det9.py`.

Still open, unchanged: the Cloudflare dashboard steps (v0.6), TORUS2's leans, deleting `torus-v1`, folding `torus2/motion.js turn` onto
`math/nudge.js` (a duplicate since v0.10; a TORUS2 change, so it waits for a TORUS2 session), the OKLCH variants, POLYTOPE's portrait
cropping, the NAV2 phase-winding colour variant (noted 2026-09-26, not built: colour by the winding of arg fⁿ(z) — the argument principle —
a colour variant on NAV2 only, opt-in, `IDS=8` proof, decide after the swap question).

**Not this:** a MAXWELL bid, a full sweep, 3D, an OKLCH variant, the Hertzian-dipole hedge (only if the montage disappoints and the user
asks).
