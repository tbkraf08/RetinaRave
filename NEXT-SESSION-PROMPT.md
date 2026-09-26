# Next session — Retina Rave after v0.12 (written 2026-09-26, at the v0.12 tag)

**v0.12 "every sound a wave" is tagged and deployed (DECISIONS §44, `docs/AUDIT-v0.12.md`, worker report `docs/workers/maxwell-onset.md`,
plan `MAXWELL-ONSET-SESSION-PROMPT.md`):** MAXWELL (id 9) modified in place after the user's look at v0.11 — still **forced-only** (bid 0,
key `9` then `n`). The carrier and the beat-locked `FAINT` ring are gone: with the music playing and every hit pinned off the field's energy
is **0** exactly, and 8 s into a paused window on three real tracks **0 launches** in every band. Every onset launches a Ricker shell in
its note's hue — kicks by the `kickCount` delta from the centre in the bass note's hue (`argmax(bchroma)`), snares/hats by a re-armed
edge (`REARM` 0.5, `REFR` 70 ms), the engine's `onset` event, and a soft per-pitch-class note onset (`NOTEK` 0.05) — through one 32-slot
ring, reported by `hooks.launches()`. Double time: `train('8')`/`('4')` spacing 0.4999. The lattice is removed; rotation is lens · mirror
cavity; the waveguide is `hooks.medium(3)` only. Cost 0.80× TORUS2. `index.js` 465 (+ `onsets.js` 151). **The user has not looked at v0.12.**

**First: show the user** `tools/accept/v0.12/montage-maxwell3-paused.jpg` (silence vs sound — first), `montage-maxwell3-demo.jpg` (house /
aba / dnb, v0.11 left · v0.12 right — many small shells in many hues, busier and dimmer), `montage-maxwell3-real.jpg` (CyborgNinja /
WhoLikesToParty / Malicious at 20–80 s — separate ripples at the rim sectors by 80 s), `montage-maxwell3-media.jpg` (lens · cavity ·
waveguide · empty — **the waveguide question** is theirs), and `dist/retinarave.html` key `9` then `n`; read them the AUDIT's "What the eye
sees" and the ranked leans (§44). Their word decides. **Say plainly what the AUDIT says:** the plane's hue matches the last kick's bass
note on 79 % of samples on Malicious but 17 % on CyborgNinja (a two-note bassline; the plane is a mixture of the last second's shells,
and the instrument is wrong for that — a launch-weighted expected hue is owed to `det12.py`); "launches within 30 % of `onsetRate`" was
unmeetable arithmetic (per band vs per frame); the note source and `TSIGK`/`DIRTK` are proven on the demo synths and by pin only; no
double-time passage was found in the three tracks; **dubstep has arrived: `~/Music/RetinaRave/SeeYouDrop.flac`** (Ray Volpe — SEE YOU
DROP, 16-bit/44.1 kHz, 2:38; the MAXWELL per-note gate and the double-time passage are still unproven on it). Tracks now live in
`$MUSIC` (default `~/Music/RetinaRave`, the incompetech three copied there too); `audit12.sh`/`det12.py` take the name with or without
its extension (`audit12.sh SeeYouDrop mx3-syd`). A retune is a named constant at the top of `assets/scenes/maxwell/{onsets,sources,colour,medium,render,
index}.js` (`REARM`, `HATA`, `FGAIN`, `NOTEK`/`NOTEA`, `GRIDT[3]` substeps — ranked in §44), proven with `IDS=9 tools/scene-md5.sh` (re-base
`tools/accept/v0.12/scene-md5-v012.txt` s9 lines) + `tools/accept/v0.12/det12.py <track> <tag>` (read `dpb`, `dkick`, `medium`) and
`audit12.sh` (the paused start).
- **Promote →** a `score()` (TORUS2's shape, §36), then the Q trace on house + aba, the `accept.sh` "== maxwell" section (s9 md5s, the
  pinned trains, the key pair, `test_fdtd`), a DECISIONS section, tag v0.13.
- **"Too busy" →** `REARM` 0.5 → 0.35, then `HATA`. **"Too dark between hits" →** `FGAIN`, never a floor (a floor is a carrier by another
  name — the user said quiet). **"The waveguide back" →** `sectionAlt mod 3` in `medium.js`, one line + `NAMES`/`help.js`, the md5 pair
  re-based. **"Still not the note's colour" →** first the launch-weighted expected hue in `det12.py` (the instrument), then the hat by
  chroma (`W12[k]`, one line in `sources.js`), not a bigger `CSPREAD`.
- **Docs owed:** the launch-weighted expected hue in `det12.py`; the `CDIP` comment in `colour.js` (describes v0.11's workaround).

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
a colour variant on NAV2 only, opt-in, `IDS=8` proof, decide after the swap question). The working tree at the v0.12 tag still carries
uncommitted deletions of six `tools/accept/v0.8/{ew,v3}-t*.jpg` and two untracked `tools/accept/v0.8/trans-*.jpg` from an earlier session —
not this session's; restore or commit them when someone knows why.

**Not this:** a MAXWELL bid, a full sweep, 3D, an OKLCH variant, a carrier "bed" behind the hits (the user said quiet), the Hertzian-dipole
hedge, fallback B (the `vec4` Yee).
