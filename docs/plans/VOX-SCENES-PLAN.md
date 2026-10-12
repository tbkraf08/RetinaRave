# VOX-SCENES — the vocal lane on the other five scenes (a proposal, 2026-10-12; nothing built)

The user: *"what needs to be added to the other scenes now that we have a vocal lane?"* Branch `plan-vox-scenes` off main 853dc12.
One page to pick from. Every item is a K2 retune on all eight tracks once picked (CONTRACTS §1.1); a look remark is a retune request.

## 0. What the lane is, and the one rule every read obeys

Three music-state keys (§123 / §124): `voxS` presence 0–1 (eased .1 s), `voxHz` the sung pitch (−1 none), `voxConf` 0–1 (0 = no read at all).
LIVE = the CNN in every live mode — ~160 ms behind, and an instrumental reads as a voice on 17–31 % of frames (Comptine's piano, Vienna's
synth leads; §124's A/B: sung-% at the .3 gate 23.6 / 22.1 on the two no-voice tracks against 56–72 on the voiced three). FILE = the Demucs
lane, exact. The user watches live 90 % of the time, so **the live false positive is the design constraint**, not the file picture.
FLUID2's rig (§121 / §123, validated by eye) is the model: the voice has ITS channel, its ink is SHARED from the floor, never added; its
HEIGHT is its pitch (*"pitch seems more like a vertical move"*); its HUE is the sung note on the circle of fifths; `voxConf` 0 = today's bytes.

**Step 0 — one gate for all, `assets/math/vox.js`** (pure, per-caller state like keycolour's `mkAnchor`; the rig keeps its own validated
reads, may adopt it later): `vox(st, dt, S)` → `{ w, pc, y01, hue }`.
· `w` = `sstep(VOX_LO .45, VOX_HI .85, voxS)` — the knee ABOVE the live tier's .3 / .5 gates: §123's table puts a no-voice track's
  p50 at .08–.22 and ≥ .5 on 1–10 % of its frames, a voiced passage at .44–.88; the lane reads ≥ .5 exactly where §122 says "sung", so one
  knee serves both sources. No rise ease (the .1 s ease and the 160 ms lag are already paid; reactive beats predicted), release .3 s.
· `pc` = the sung pitch class, only while `voxHz > 0` AND the class has held two inferences (~85 ms) — a false voice with the YIN gate
  shut, or a flickering read, colours nothing. `y01` = `(1 − OCT .3)·deg/11 + OCT·clamp(log2(voxHz/110)/4, 0, 1)` eased TAU .35 s (the
  rig's numbers), held through a voiced frame with no pitch. `hue` = `hueOf(pc, minor)` (keycolour's wheel + the mode's pull), else the key's.
· `voxConf` 0 → `w 0, pc −1`: every read below is a no-op on the fake timeline, the traces, digital silence — the fake md5 lists cannot move.
· `voxConf` weighting is NOT the gate: live `voxConf = voxS × periodicity`, and a piano is periodic — it would pass the very case we fear.
  `VOX_LO`/`VOX_HI` are the knobs (`&vox=lo,hi` under #test); `w` is the one number a scene multiplies by.

## 1. Per scene (what · the read · cost · md5 scope · confidence)

**TORUS2 (id 4, the favourite mapping) — the knot strand becomes the voice.** The knot is already "the melody traces the knot"
(`knotT` off harmUnw, `knotTh` = the loudest family's latitude, `knotBri` off intensity, `uKnotBH.y` its hue by the loudest class). While
someone sings: `knotTh` target = `TH0 + THS·(.35 + .5·y01)` — the sung pitch lifts the strand's latitude toward the equator (the nest's
vertical), eased by the gate; `uKnotBH.y` = `pc/12 − .5 + .09` the sung note's hue in the slot the loudest class fills today; `knotBri ×
(1 + .6·w)`; and the sung class's family ring `ch[pc] = max(ch[pc], w)` so its torus is lit — the twelve families keep their brightness
(the floor keeps its ink). Blend by `w` on each: w 0 = today's three lines. Cost none (CPU numbers into existing uniforms). md5: s4's 66
real lines move where a voice is read (both map modes — the CNN runs in map 0 too); the fake s4 pair holds. **Confidence .8** — the
user's favourite music-to-viz mapping, the strand is the melody by design, and a vertical pitch is the nest's own latitude.

**FLUID (id 0, the substrate, on the roster) — the rig's LEAD at the base's own place.** §108's harmonic floor ("pads, chords, vocals")
is a dye-only cloud at `relX(tonic)`, y .5. Inside inject.js's floor branch: `share = floor · LEAD_SHARE .5 · w` taken OFF the floor's dye
and put at the same x, height `LEAD_Y0 .3 → LEAD_Y1 .85` by `y01`, radius 1.5 with the ink in the budget's units (`share·(2/1.5)²`), in
the note's hue — the rig's recipe without the rig. `w 0` = the floor whole, no splat. **FLUID2's base must not move:** inject2 calls
`planBase(S, dt, st.base)` and plan() already "accepts and ignores a fourth argument" — inject2 passes `{ vox: 0 }` and the branch is
skipped, so FLUID2's rig keeps its own lead and its s1 lines HOLD (the gate that proves it). Cost: one splat (a GPU pass) while `w ≥
VOX_ON .1`, the rig's own cost, benched on s1. md5: s0's 66 real lines move; fake s0 holds; s1's 66 real lines must hold. **Confidence
.7** — this exact read was validated by eye on the rig ("looks good"); the risk is the lead column at centre reading as FLUID2's picture.

**DUST (id 3, "does a really good job at showing slow / sparse sounds") — the singer's grains, and the ribbon as the lone voice.**
DUST's grammar is "one frequency band per grain": a voice IS bands. (a) the grains whose bin sits at the sung pitch's first three
partials (`voxHz`, 2×, 3× on the 256-bin log axis — the ranks from `log(f)`) are lifted by `w` in the sung note's hue; the rest of the cloud
is scaled by `(1 − .25·w)` so the light is moved, never added (habit.js's rule, by a uniform factor rather than a pass). (b) `shapeFor()`
gains the voice: `!subGate && (denK < lone || voxSec > .5)` → RIBBON, with `voxSec` = `w` over 8 s (a seam decision is about a section) —
the ribbon IS "the breakdown, or a lone voice" and today it only knows "no kicks"; in the ribbon the line's y rises with `y01` (the one
vertical DUST has; the cloud's axis is radial, so pitch-as-height stops there). Cost: one `vec4 uVox` (w, pitch rank, hue, y) + ~6 ALU
per vertex. md5: s3's 66 real lines move; fake s3 holds. **Confidence .6** — the ribbon-as-voice is DUST's own design; the partials are
new and must be checked on Comptine (≤ 5 % of frames lit, live).

**NAV2 (id 2, home, "nav2 is better than nav now") — the sung note on the colour walk, nothing moves.** §99's colour-on-key steps the hue
a twelfth per phrase (key · dominant · key · subdominant). While singing, the walk's target step = `wrap(hue(pc) − hue(key)) · w` — the
palette (`uPal.x`, `uTint`, the dots, the PiP) leans to the sung note and returns on the key when the voice stops; the walk resumes where
it was. One line in look2.js behind `&n2vox=0` (= today's bytes, test_nav2's rule). No vertical read: c's plane has no "up" the user
has ever been shown, the view's pan would move §101's walk framing and the rulers' jump monitor, and the home scene is the one the user
just validated. Cost none. md5: s2's 66 real lines move where a voice is read; fake s2 holds. **Confidence .5** — consistent with
"colour by the note" everywhere else, but the user asked for nothing here and a retune of home is the costliest miss.

**MANDALA (id 5, forced-only, "slightly lower") — a voice ring.** The orbit trap lights a ring at `0.35 + 0.5·spectrum`; radial is the
mandala's vertical. Add `col += palV · exp(−40·|r0 − (0.3 + 0.5·y01)|) · w` with `palV` the note's hue, and the body `× (1 − .3·w)` so the
ring takes from the floor. Cost: one `vec3 uVox` + 4 ALU per pixel. md5: s5 is FULL-only (its 66 real lines move under `FULL=1`); fake s5
holds. **Confidence .4** — the user never sees it on the roster; build last or not at all.

## 2. Director, HUD, help

**Director.** FLUID2 is forced-only (score 0, no tile; §93's "only NAV, DUST, TORUS2", FLUID added on the user's word §114). Two ways
for a sung passage to land on a voice channel: **(a) FLUID's bid gains `+ .25·voxSec`** (`voxSec` = `w` over 8 s — a bid is about a
section; on a piano track live it moves ≤ .02) once FLUID has the lead above — no roster change, the §95 dwell (30–90 s, drops / builds
exempt) and the −.6 history dock untouched; or **(b) FLUID2 joins the roster** with `0.2 + .6·voxSec` (0 in a build) — the rig for every
sung section, a roster change that is the user's call. Recommended (a); (b) is open question 1. TORUS2's bid is left alone (its read
above already shows the voice wherever it is picked).
**HUD.** The vox line stays (`vox S hz conf lead ← lane | live | interval` — the source is the same for every scene); each scene's own
`hud()` appends its number (`vox w .xx pc 7`). No MS field moves: parity's 72 untouched.
**Help** (CONTRACTS §1.13). `feats` on each scene gains the three keys (check.js warns on a read outside it; inject.js's FLUID_FEATS
fails); each help.js gains three clauses (what the voice moves HERE); `ears/feats.js`'s `drives` for the three (today "FLUID2's LEAD")
lists every reader; FLUID's part B shows the grammar's list by itself. FLUID2's help text: unchanged.

## 3. Order and sessions (two or three scenes a session; Fable designs, Opus plumbs)

| step | worker | brief | gates |
|---|---|---|---|
| A | Fable | `math/vox.js` + TORUS2 + FLUID (the `{vox:0}` gate on inject2's call) | `test_torus2` / `test_fluid`: defaults = today's bytes, Σ ink = the base's to 1e-9 with the lead, FLUID2's base byte-identical with the 4th arg; `scene-md5.sh` 12 lines unmoved; `SCENES="0 4" real-md5.sh` moved only where a voice is read, `SCENES=1` 66/66 held; Comptine live: the voice element lit ≤ 5 % of frames; the eye on `#scene=4` and `#scene=0` — Raindrops, IBelongHere, SeeYouDrop, Comptine (`&vox=live` on a file = the live picture) |
| B | Fable | DUST (a + b) + the director (a): FLUID's bid | `dust-trace` per track: lit-grain share, ribbon seams with / without the voice; `test_director`: bids at voxS 0 = today's, house / aba traces re-read (picks, dwell); `SCENES=3 real-md5.sh`; the eye on `#scene=3` |
| C | Fable (after A's eye) | NAV2 the hue · MANDALA the ring (if asked) | `test_nav2`: `&n2vox=0` = NAV2's bytes; `SCENES=2`, `FULL=1` for s5; the rulers' jump monitor on s2 unchanged; the eye on home |

Each step ends untagged, unpushed; the user's eye first, in live mode, on the four tracks above (Comptine = the control: nothing should
light). The next release's sweep re-bases the real reference; the fake lists never move (every read is a no-op at 0 / −1 / 0).

## 4. Open for the user

1. FLUID2 on the roster with a voice bid (b), or FLUID's bid only (a)?
2. NAV2: the sung note's hue on the walk, or leave home exactly as validated?
3. The knee: `.45 → .85` on every scene (a piano lights ≤ 10 % of frames live), or the rig's raw `voxS` above .1 (validated by eye on Raindrops)?
4. DUST: the partials' grains (a) and the ribbon (b), or the ribbon alone?
5. MANDALA at all?
