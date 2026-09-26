# Next session — Retina Rave after v0.11 (written 2026-09-26, at the v0.11 tag)

**v0.11 "the wave remembers its note" is tagged and deployed (DECISIONS §43, `docs/AUDIT-v0.11.md`, worker report
`docs/workers/maxwell-wobble.md`):** MAXWELL (id 9) modified in place after the user's three notes on v0.10 — still **forced-only**
(bid 0, key `9` then `n`). Item 1: `presence` gates every source, `absentT` lets the rings go, the contours got an absolute floor and
the strokes got the plane's porthole (the corner scribble was most of "noisy"); with the track paused the picture is black (energy
1e-5 of playing, 0 segments, 0 lit charges, on three real tracks). Item 2: a second half-grid wave equation carries rgb + w
(`colour.js`), hue = rgb/w, the sign of Ez is brightness (`TROUGH` 0.35), the key anchor no longer rotates the wheel (`CHUE0` 0,
`CSPREAD` 1.6); pinned-sector proof 0.0018 turns; cost 1.01–1.24× TORUS2 with tier-3 substeps 4 → 3. Item 3: the carrier is the
timbre (`CENTK` 2.5), `dirty` doubles the ripple (cosine harmonic, `DIRTK` 1.8), the bass pumps the centre (`SUBK` 0.03, kick × punchy),
the sub's wobble breathes the medium (`WOBK` 0.6) **and pumps the carrier's amplitude (`WOBA` 0.85)** — a uniform ε(t) cannot change
a wave's k, so the wobble is amplitude, not wavelength (measured 4 % vs the 12 % gate). **The user has not looked at v0.11.**

**The user looked at v0.11 (2026-09-26) and said:** the waves from the centre come at a constant rate; every sound should generate
a wave, coloured by the note being played; double-time passages do not show in what the middle emits; and what is the pattern of
small circles in the background. Answers given: the constant rate is the continuous carrier + the beat-locked `FAINT` ring, the small
circles are the photonic-lattice medium. The user decided: **no sound → quiet (no wave generated)**; **follow the rec on the media —
drop the lattice, keep the lens and the mirror cavity, decide the waveguide after seeing sound-only ripples in the cavity.** The plan is
**`MAXWELL-ONSET-SESSION-PROMPT.md`** (v0.12, MAXWELL in place, still forced-only: the carrier and the metronome go; every onset —
kick by `kickCount`, snare/hat by a re-armed edge, the engine's `onset` event, a soft per-pitch-class note onset — launches a Ricker
shell in its note's hue, the kick's hue from `argmax(bchroma)`; lattice removed, rotation lens · cavity, waveguide by hook only;
`index.js` must come down from 498 lines). **Run that session first; the paragraph below is what it supersedes.**

**Was first:** show the user `tools/accept/v0.11/montage-maxwell2-paused.jpg` (silence vs sound — show this one first),
`montage-maxwell2-demo.jpg` (house / aba / dnb, v0.10 left · v0.11 right — many colours, and paler), `montage-maxwell2-real.jpg`
(CyborgNinja / WhoLikesToParty / Malicious at 20–80 s), and `dist/retinarave.html` key `9` then `n`; read them the AUDIT's "What the
eye sees" and the ranked leans (§43). Their word decides. **Say plainly what the AUDIT says:** the per-note colour is proven only
under a pinned sector (real chroma is flat and the twelve hues sit symmetrically about the anchor, so no real-track agreement number
exists); the wobble is proven only by the CLOCK=1 `hooks.wob(2)` series (a 2 s trace cannot resolve 1–4 Hz); `Malicious` (Kevin
MacLeod, 140 BPM, CC-BY) stood in for dubstep and has no wobble bass — **the user's 3 has never been tested on dubstep; bring an mp3
to `…/scratchpad/music/`**. A retune is a named constant at the top of `assets/scenes/maxwell/{colour,sources,fdtd,medium,render,
index}.js` (`TROUGH`, `CSPREAD`, `FGAIN`, `CENTK`, `WOBA`, `GRIDT[3]` substeps — ranked in §43), proven with `IDS=9 tools/scene-md5.sh`
(re-base `tools/accept/v0.11/scene-md5-v011.txt` s9 lines) + `tools/accept/v0.11/det11.py <track> <tag>` (energy / spacing / dominant
hue per 2 s) and `audit11.sh` (the paused start).
- **Promote →** a `score()` (TORUS2's shape, §36), then the Q trace on house + aba, the `accept.sh` "== maxwell" section (s9 md5s,
  the pinned trains, the key pair, `test_fdtd`), a DECISIONS section, tag v0.12.
- **"Still not the note's colour" →** the instrument is a pinned-chroma real-track hook (pin one sector while a real track plays),
  not a bigger `CSPREAD`. **"Still no wobble" →** the mechanism for rings that bunch is a graded lens with a shorter travel time or a
  source-side chirp — a new plan, not a constant.
- **Docs owed to HARNESS** (§43's last paragraph): `tools/lum.py` has no hue field (v0.10's report quoted one from an uncommitted
  instrument); the scene palette is cosine, not HSV — hue numbers are palette turns via `probe.js hueFit`; the 500-line hard cap is
  where a growing scene's budget goes (`maxwell/index.js` is at 498).

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
asks), fallback B (the `vec4` Yee) unless the user rejects the colour field's picture.
