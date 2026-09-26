# MAXWELL3 worker report — v0.12, "every sound a wave" (id 9)

Branch `worktree-agent-a39f8e998c8a0776c`, based on `fc584b5` (main). Three commits, one per proven item:

| | |
|---|---|
| `9a02423` | MAXWELL3: item A — no carrier, no metronome; silence is silence |
| `8a38cac` | MAXWELL3: item C — the lattice removed; rotation is lens · mirror cavity |
| `74a7229` | MAXWELL3: item B — every sound a wave, in its note's hue |

Every proof number is in the commit body as well as here. `PORT=8850` on every `cdp.js` run; one Chrome at a time;
`node tools/check.js` after every edit and **0 fail** at the end.

**The headline.** `hooks.train('off')` with the music playing and nothing hitting now reads `hooks.energy()` = **0**
exactly — the same run on v0.11 read **396.412497**. That 396 was the carrier, and it was the whole of the user's
"waves coming out of the center at a constant rate". The scene is **0.92× TORUS2** at tier 3, down from v0.11's
1.24×. The note-onset source **shipped** and fires on all three demo synths. `index.js` came down from 497 to **465**.

---

## (a) Friction log — what the docs did not answer, and every guess

1. **The worktree was a version behind the brief's base.** The Agent tool's worktree was at `805afc3` (the v0.11 tag)
   while the brief said main was at `3d1f6a7` — and main had already moved on to `fc584b5`. `docs/workers/
   brief-maxwell-onset.md` and `tools/accept/v0.12/` did not exist in the checkout. Fast-forwarded to `fc584b5`
   (`805afc3` is an ancestor, the working tree was clean, and `fc584b5` is `3d1f6a7` plus three HARNESS doc notes —
   a strict superset of the stated base). Decision recorded here rather than asked about.

2. **The brief says to delete `hooks.wob` and `hooks.timbre` "with the mechanism"; the plan keeps the mechanism.**
   The brief: "`wob` and `timbre` pin things item A removes — delete the hooks with the mechanism". But
   `MAXWELL-ONSET-SESSION-PROMPT.md` item A explicitly *keeps* `WOBK` ("The sub's breath of the medium's ε stays —
   it moves the light, it is not a source") and *keeps* what `centroid` and `dirty` do ("`TSIGH` scales with
   `centroid` … `dirty` gives the Ricker a second lobe"). All three constants survive in reduced form, so both
   hooks still pin live mechanisms. And v0.11 friction 10 is decisive: **the `#test` timeline holds `centroid`
   0.455, `dirty` 0.2 and `sub` flat at every frame**, so a pin is the *only* way to prove any of the three on a
   deterministic clock. **Both hooks kept**, their comments rewritten to say what they pin now. The plan outranks
   the brief (the brief itself says so) and this is the one place they disagree.

3. **`hooks.mxchroma`'s colour-field silencing had to go, and the plan's own gate is what found it.**
   v0.11's `mxchroma` passed `drums = 0` into `stepColour`, zeroing the centre current *and* the dipole in the
   colour field — because both carried the key's anchor hue and drowned the charges (colour.js `CDIP`). Under the
   plan's gate (`mxchroma("3")` + `train('4')`) *every* launch is a band-0 kick through the centre current, so the
   pin zeroed the only source: the first run of the gate returned `dom: null`, `centre: {h:0, sat:0, w:0}`,
   `foot3: {w:0}` — an empty colour field. Item A had already removed the reason: the centre now carries the last
   kick's **bass note** and the dipole fires only with that kick in the same hue, so neither is a pitchless source
   any more. `index.js` passes `1` always. **`colour.js` is untouched** (its `drums` parameter still exists and is
   still honoured; the scene simply never passes 0). The `CDIP` comment in `colour.js` is now history rather than
   current behaviour — a lean for the orchestrator.

4. **A "hook that reports must not mutate" is stated for `train()` and enforced for nothing else.** CONTRACTS §1.4
   says so about `hooks.train()`/`energy()`/`probe()`, and `train()` obeys it. But `medium()`, `tier()`, `quiet()`,
   `wob()`, `key()` and `mxchroma()` all *release their pin* when called with no argument, so reading one is
   un-pinning it. I lost the first item-C measurement run this way: `{"eval": "... hooks.medium() ..."}` reported
   `-1` and released the pin that the same run's shot had been taken under. The shots were fine (taken first) but
   the number was meaningless. **The release-on-`undefined` convention makes every pin hook a mutator, and that
   belongs beside §1.4's sentence.** Workaround used everywhere after: read the medium from `hud()`.

5. **`tools/accept/v0.12/det12.py` compared a hue against the wrong note.** `bhue = mc.hues[bk]` with `bk =
   argmax(bchroma)`, a **pitch class**, and `mxcol().hues` indexed by **sector**. A pitch class `pc` sits at sector
   `(7·pc) mod 12` (`sectorPc` is its inverse; 7·7 = 49 = 1 mod 12). Changed to `mc.hues[(7*bk)%12]` — the only edit
   to det12.py, and only to match the scale `hooks.launches()` reports `hue` on. The line's own comment already said
   "its **sector** hue", so this is the comment's intent, not a new decision. `dkick` (the gate the plan cares
   about) was already right: it compares `dom` against `last[].hue`, which the scene emits on the sector scale.

6. **The plan's other det12 gate cannot hold by construction.** "the scene's launches per 2 s vs the engine's
   `onsetRate` agree within 30 %". Measured on house: 32 launches in 2 s against `onsetRate` 3.24 (→ 6.5), i.e.
   **4.9×**; at 14 s, 40 against 7.1, i.e. **5.6×**. That is not a detector fault. `onsetRate` is `Σonsets·exp(−dt/1)`
   over an `onset` flag that can fire **at most once a frame for a whole drum stack**, while the scene launches
   **per band** — a kick, a clap and a hat inside 20 ms are three sounds and three shells, which is exactly what
   "every sound a wave" asks for. I checked it is not ringing: the inter-launch frame gaps inside one band in
   `launches().last` are musical subdivisions (hats 7 frames = 117 ms = a 16th at 128 BPM; snares 14 frames = 233 ms
   = an 8th), never the 1–2 frame chatter a broken edge detector makes. **The AUDIT should read `dpb` per band and
   compare each band to its own musical rate, not `lr`.** If the user says it is too busy, the knob is `REARM`
   (lower = stricter re-arming), then `HATA`.

7. **`NOTEK` 0.08 was too high and the plan said so in advance.** "If it fires on nothing … lower `NOTEA`, do not
   raise `NOTEK` past a value that never fires on the demo synths." At 0.08 the note source fired **four times in
   fourteen seconds** of house — present, but not a source. Rather than guess, I logged 481 frames (8 s) of
   `max_pc(chroma[pc] − its own 0.15 s ema)` on each demo synth and took the fraction of frames over a threshold:

   | threshold | house | aba | dnb |
   |---|---|---|---|
   | 0.02 | 83 % | 95 % | 87 % |
   | 0.03 | 60 % | 79 % | 63 % |
   | 0.04 | 39 % | 58 % | 41 % |
   | **0.05** | **24 %** | **39 %** | **27 %** |
   | 0.06 | 14 % | 24 % | 20 % |
   | 0.08 | 8 % | 12 % | 8 % |
   | 0.10 | 6 % | 6 % | 6 % |

   `NOTEK` = **0.05**, the flat middle: ~1.5–2 note launches a second against ~13 from the drums, which is what "the
   secondary source" means. `NOTEA` 0.045 unchanged. Below 0.03 every bin rises every frame and only `NOTEREFR`
   holds it. The measurement is written into the constant's comment.

8. **`onsetRate` is NOT in `feats`, deliberately.** The plan's help.js line says "every feats entry a line
   (`onset onsetRate kickCount bchroma` in)". Nothing in the scene reads `onsetRate` — every launch already follows
   every hit, which is the whole answer to the user's double-time sentence — and a `feats` entry the scene does not
   read is a lie the panel shows and a `check.js` warn. `onset`, `kickCount` and `bchroma` are all in and all read.
   det12.py reads `onsetRate` off `MS` directly and does not need the scene to declare it.

9. **The brief's `hooks.launches()` shape says "`step` the frame count"** while `sources.js`'s own `step` is the
   **substep** count. I report the frame counter (`U.frame`), as the brief's word says; the substep clock is still
   in `mxinfo().step` and `rings()`/`spacings()` are still in substeps and cells. Guess recorded.

10. **A shared 32-slot ring makes `rings()` report across tier changes.** v0.11 had 8 slots per band; v0.12 has 32
    shared, and the oldest of those were launched at another tier's `spb`, so the raw list mixed 35.2-cell and
    23.5-cell spacings from two different substep rates. `rings()` now reports only the newest `RPT` = 8 of a band,
    which restores v0.11's window exactly. (I first tried filtering to *envelope-live* launches and reverted: a
    Ricker lives (TPKS+LIFES)·σ ≈ 68 substeps against `spb` ≈ 87, so at most one ring per band would ever be "live"
    and the spacings proof would have had nothing to measure. `rings()` has always meant "the last N launches'
    bookkeeping radii", never "still radiating" — worth saying in its own docstring, which it now does.)

11. **`git grep -n "CHG\|SUBK\|WOBA\|CENTK\|RSWEEP\|FAINT" assets/scenes/maxwell` is not empty**, as the brief
    allowed for. Two hits, both **comments, no code**: `colour.js:46` (the measured reason `CDRUM`/`CDIP` exist,
    which quotes `CHG`'s old value 0.0075 to say how much louder the drums were) and `sources.js:34` (the list of
    what v0.12 removed). Both are paid-for history that belongs where it is.

12. **`hooks.reset()` zeroes the launch list but NOT `n`/`perBand`.** The brief says `reset()` must zero the launch
    list, and the shape says `n` is "the launches since load (a cumulative counter)". Those two pull opposite ways
    for a counter, so: the 32 physics slots, the detector state and `AH`/`AF` are zeroed; `n` and `perBand` keep
    counting. det12 differences them, and a mid-trace `reset()` would otherwise hand it a negative `dn`.

13. **Guesses made and kept**, each with its reason in the code: `NSLOT` 32 (a launch lives 0.4–0.9 s and the
    busiest measured window holds ~15); `DIPB` 0.35 and the decision to route the dipole through the **kick's own
    envelope** — the plan says "the dipole … radiates only when a launch is routed through it" and does not say
    which launch, so a kick at the centre now comes out as a monopole ring plus a two-lobed component along the
    dipole's axis, scaled by the nudge's angular velocity, which is the one reading that keeps `DIPK` meaning what
    its comment says; `DIRTD` 2.2 σ for the growl's second lobe (v0.11's cosine second harmonic was a property of a
    waveform there is no longer any of); `TSIGK` 1.2 halvings of shell thickness per unit of `centroid`; `REARM`
    0.5, `PKTC` 0.5 s, `REFR` 0.07 s, `KLEV0` 0.5, `KMAX` 4, `BCHMIN` 0.08, `ONSETW` 0.05 s, `ONSETA` 0.07;
    launch amplitudes are now scaled by `params.charge` **at launch time** (not per substep — a shell already in
    flight must not be re-scaled when the param moves), which is what keeps `presence` gating every source and the
    `charge` param honest now that it has no charges to scale.

14. **Harness friction, not repo friction:** this session's Bash tool refuses heredocs, `EVAL` in a grep pattern and
    several other compound forms inside a worktree-isolated agent. Long `{"eval": …}` step lists had to be written
    to the scratchpad and read back through a shell variable. No effect on any number; noted so the next worker
    does not spend the same ten minutes.

## (b) Forbidden files I was tempted by

**Once, and I did not open it.** `assets/engine/features*.js`, to find out why the engine's `kickCount` increments
about **5.5 times a second** on the demo house synth when four-on-the-floor at 128 BPM is 2.13 — i.e. whether the
scene is drawing a kick that is not there. `assets/engine/feats.js` (a legal read) gives the definition — "increments
per kick", `kick` = "median-thresholded low-band flux peak, gated on bass level" — and that is enough to answer it:
a house bassline puts low-band flux peaks between the kicks and the engine counts them. The scene takes the counter's
delta verbatim, which is what the plan asked for, so the rate is the engine's truth and not mine to correct. Logged
rather than chased.

## (c) Every proof, per item, with its shot

### Item A — silence is silence (`9a02423`)

| proof | number |
|---|---|
| `train('off')`, music on, CLOCK=1 f360 — `hooks.energy()` | **0** (v0.11 same run: **396.412497**) |
| ... `probe().segs` | **0** (v0.11: 468) |
| ... `hooks.train().crests` (measured Ez crests on the +x ray) | `[]` |
| plain `#test` f360 / f840 energy | 258.724002 / 615.744353 |
| ... probe centre / rim / ratio | 0.13077 / 0.09216 / 1.419 · 0.19339 / 0.13143 / 1.471 |
| ... segs / loops / gap | 1301 / 65 / 0 · 2434 / 211 / 0 |
| `index.js` | 497 → 456 at item A (465 final) |
| ERRS / nonFinite | `[]` / `[]` |

- `tools/work/mx3-a-off-f360.jpg` — the item-A gate as a picture: the lens's rim hint and the twelve charge glows in
  their own hues on a **pure black** plane. Nothing else is in the frame. v0.11's same frame
  (`tools/work/v011-off-f360.jpg`) is a full carrier train.
- `tools/work/mx3-a-f360.jpg`, `mx3-a-f840.jpg` — the plain timeline, non-black, drums only.

### Item C — the media (`8a38cac`)

All four at CLOCK=1 f360 with `hooks.train('4')`, so the four shells are the same four shells every time.

| pin | energy | segs | what the eye sees |
|---|---|---|---|
| `medium(0)` lens | 523.609161 | 1632 | the four shells **bunch inside the lens disc** — the inner rings visibly tighter than the outer ones, bowing as they cross its edge (`mx3-c-med0-f360.jpg`) |
| `medium(1)` cavity | 234.484515 | 908 | the wall has thrown the first shell back and the **reflection is crossing the next one outward-bound**: broken arcs instead of clean circles, the wall's own cool ring at the rim (`mx3-c-med1-f360.jpg`) |
| `medium(2)` empty | 227.269123 | 938 | evenly spaced free shells, **no dots, no lattice** — the control. No error: the slot is legal and draws nothing (`mx3-c-med2-f360.jpg`) |
| `medium(3)` waveguide | 221.845278 | 614 | the rails clip the shells into a vertical corridor; only what is between them propagates (`mx3-c-med3-f360.jpg`) |

- The kick-band bookkeeping spacings are **identical in all four** (35.223, 35.224, …) — the launch cadence is the
  medium's business to bend, not to set — while the **measured** crest gaps differ per medium (lens
  27.62/19.23/11.65/34.43/34.40, cavity 13.65/35.49/34.68/35.42/34.77, empty 35.x). That is the medium doing its job.
- `sectionAlt mod 2`: the md5 pair still changes, `2ab27be6` (f360) / `237dae32` (f840) at item C. **It is not the
  medium that changes between them** — `sectionAlt` is 1 at f360 and 3 at f840, both odd, so both frames are the
  mirror cavity. What changes is everything else the section carries: `geoRot` 0.37 → 1.11, the tier 384×216/3 →
  512×288/4, eps 1.71 → 2.17, the drop's mirror 0.00 → 1.00, yaw 4.40 → 10.84. On v0.11 f840 **was** the waveguide
  (`sectionAlt` 3 mod 4), which is the visible item-C difference in that frame — see `mx3-montage-clock.jpg`.
- `NAMES`, `help.feats.sectionAlt`, the scene `tag`, the card blurb and `render.js`'s header all say lens · mirror
  cavity. `GEON` stays 4 (the slots `hooks.medium(v)` can pin); `GEOROT` = 2 is what the section rotates through.
  `PLAT` and `RLAT` are gone and `geo(2)` returns `vec2(0.0, 0.0)`, so **no pin can draw a lattice either**.

### Item B — every sound a wave (`74a7229`)

**One bar on `#test`, CLOCK=1** (f780 → f896 = beat 26.867 → 30.862 = 3.996 beats):

| band | launches in the bar | the fake timeline's |
|---|---|---|
| kick | **4** (12 → 16) | 1 per beat = 4 |
| snare | **2** (6 → 8) | on odd `beatCount` = 2 |
| hat | **8** (36 → 44) | 2 per beat = 8 |
| onset | 0 | `fake.js` fires `S.onset` on the same frame as the kick; `ONSETW` suppresses it |
| note | 0 | `fake.js` leaves `chroma` all zeros — nothing can rise |
| **total** | 14 (n 54 → 68) | |

**Double time.** `hooks.train('8')` vs `('4')` at f360, `medium(2)`:

| | `'4'` | `'8'` | ratio |
|---|---|---|---|
| bookkeeping spacings | 35.223, 35.224, … | 17.612, 17.611, … | **0.50001** |
| **measured** Ez crest gaps (mean) | 35.06 | 17.524 | **0.4999** |
| launches `n` | 17 | 33 | |

Both inside 0.5 ± 5 %. Shots `mx3-b-train4-f360.jpg`, `mx3-b-train8-f360.jpg`.

**Per-note colour.** `hooks.mxchroma("3")` + `hooks.train('4')` at f360. Sector 3's hue is −0.1337 turns.

- All 16 entries of `launches().last` are `band: "kick"`, `sector: -1` (the centre), hues within **0.0113 turns** of
  the target (the residue is `GH12[3]` itself easing with `clarity` between a launch and the read).
- The **plane**, w-weighted along the +x ray beyond r = 8 cells, reads 0.8681 against the target 0.8663 →
  **0.0018 turns**, inside `HUETOL` 0.04. `sat` 0.983, centre `w` 4.19, `feet[3]` h 0.8681.
- `mx3-b-mxchroma3-f360.jpg`: the whole plane is one note's colour, with that note's single lit bead on the rim.
- This one pin is **both** of the plan's colour gates: `mxchroma` now pins the bass bin too, so "a kick with
  `bchroma` pinned to one bin launches from the centre in that bin's hue" is the same measurement. I extended
  `mxchroma` rather than adding a pin to a `launches` hook family — one pin, one comment, and the two gates collapse
  into one number.

**Demo synths, launches in the last 2 s** (`&fake=0&demo=…`, a shot each at 6 s and 14 s):

| | dn | kick | snare | hat | onset | note | `onsetRate` |
|---|---|---|---|---|---|---|---|
| house t6 | 32 | 12 | 9 | 7 | 0 | **4** | 3.24 |
| house t14 | 40 | 13 | 7 | 15 | 2 | **3** | 3.55 |
| aba t6 | 32 | 10 | 9 | 6 | 0 | **7** | — |
| aba t14 | 36 | 9 | 9 | 7 | 2 | **9** | — |
| dnb t6 | 37 | 10 | 6 | 12 | 0 | **9** | — |
| dnb t14 | 39 | 12 | 5 | 16 | 2 | **4** | — |

Shots `mx3-b-{house,aba,dnb}-t{6,14}.jpg`. **All five bands fire on all three synths.** See (f) for the note source.

**brief-common 2 and 3, on id 9 only:**

- t6 / t14 on `#test`: ERRS `[]`, nonFinite `[]`, `SC.logical` 9. Energy 247.045135 → **522.237136** (2.1×) across
  the drop at 13 s; `mx3-b-t14.jpg` is a bright concentric standing-shell structure with the mirror closed, against
  `mx3-b-t6.jpg`'s quieter cavity. It reacts.
- house h10 / h30 / h50 md5 `018eefc4` / `6f3daf2d` / `1c02763e` — three visibly different frames (dense
  yellow-green groove · a dark magenta/olive breakdown · a build with magenta + yellow + green all present),
  montaged at `mx3-b-house3.jpg`. `q` 0.696, ERRS `[]`, bad `[]`.

**Cost — the two-page protocol** (`q` pinned 0.95 by `setInterval`, 10 s settle, 8 interleaved `bench(id,300)` /
`bench(0,300)` pairs, first discarded, medians; MAXWELL at tier 3):

```
test&scene=9   maxwell  NAV   ratio       test&scene=3   torus2   NAV   ratio
               1.614  1.801  0.896                       1.275  1.828  0.697
               1.263  1.775  0.712                       1.280  1.784  0.717
               1.103  1.742  0.633                       1.326  1.849  0.717
               1.185  1.799  0.659                       1.307  1.805  0.724
               1.163  1.796  0.648                       1.333  1.854  0.719
               1.170  1.825  0.641                       1.294  1.845  0.701
               1.542  1.855  0.831                       1.257  1.876  0.670
        median 1.185  1.799  0.659              median   1.294  1.845  0.717
```

**MAXWELL is 0.92× TORUS2** (0.659 / 0.717) — down from v0.11's 1.24×, and the four numbers are 1.185 / 1.799 ms and
1.294 / 1.845 ms. The carrier was paying for twelve `sin`+`cos` charge evaluations *per substep* and, worse, for a
colour-field pass whose twelve-blob loop could never take its `uCA[k] > 1e-7` early out. With `CA` zero between
launches that loop now skips almost every texel. Gate is ≤ 1.5×, so there is room if the user wants the tier-3
substeps back at 4.

**Always:** `check.js` **0 fail** (3 warns, all pre-existing soft-cap lines: feigen 352, nav2 393, maxwell 465) ·
`param-smoke.js` 49 checks 0 fail · `test_fdtd.js` OK · ERRS `[]` and nonFinite `[]` on every run above.

**Montages for the user** (in `tools/work/`, the orchestrator moves them):
`mx3-montage-demo.jpg` (v0.11 left of each pair, v0.12 right, house/aba/dnb × t6/t14 — the pale cream of v0.11 is
gone and each frame now has several distinct hues in separate regions), `mx3-montage-clock.jpg` (the CLOCK=1 f360 /
f840 pair, v0.11 left), `mx3-montage-media.jpg` (lens · cavity · empty · waveguide), `mx3-montage-quiet.jpg`
(v0.11's carrier at `train('off')` · v0.12's black plane at the same frame · the pinned-note plane).

## (d) What is wrong in the docs

- `tools/accept/v0.12/det12.py`: `bhue` indexed a sector array by a pitch class — fixed, see friction 5. And its
  `lr` gate is not achievable by construction — see friction 6; that is the plan's arithmetic, not the script's.
- `docs/workers/brief-maxwell-onset.md`: "delete the hooks with the mechanism" for `wob`/`timbre` contradicts the
  plan, which keeps all three constants they pin (friction 2). And the brief's base commit had already moved.
- `docs/CONTRACTS.md` §1.4: "a hook that reports must not mutate" is stated about `train()`/`energy()`/`probe()`,
  but the release-on-`undefined` convention makes `medium()`, `tier()`, `quiet()`, `wob()`, `key()` and
  `mxchroma()` mutators when read (friction 4). One sentence would have saved a run.
- `assets/scenes/maxwell/colour.js`'s `CDIP` comment now describes a workaround the scene no longer uses
  (friction 3). Left in place — the *measurement* it records is still true of v0.11 — but it should be re-worded
  when someone next touches `colour.js`, which the brief put out of bounds for mechanism changes.

## (e) The final state

**`feats` (41).** In, new: `bchroma`, `onset`, `kickCount`. Out: `beat` (the metronome), `roll` and `riser` (the
carrier's `RSWEEP`), `novelty` (the hat shimmer), `flowHigh` (the three families' phase drift) and `dropEnv` (whose
only reader was the sweep's drop clamp; the drop's mirror is `dropEvt` + `MIRHOLD`/`DROPTC` and its help line says
so now). Not added: `onsetRate` (friction 8). Full list:

```
chroma bchroma onset kickCount harmAngle key mode keyConf valence kick snare hat bpm beatPhase beatCount barPos
phrase16Pos bass sub build intensity arousal tension dropEvt arc sectionAlt sectionEvt surpriseEvt flowBass
flowMid hush calm alive clarity presence absentT bassFast centroid dirty punchy
```

**Hooks (17):** `tier lines lab reset train key medium drop quiet wob timbre mxchroma **launches** energy probe
mxinfo mxcol`. `launches` was free (grepped) and is read-only.

**Constants removed:** `sources.js` — `LO`, `FAINT`, `LAM0`, `CENT0`-as-carrier-reference (kept, re-purposed),
`CENTK`, `LAMLO`, `DIRTK`-as-carrier-harmonic (kept, re-purposed), `WOBA`, `CHG`, `SHIM`, `SHIMM`, `SUBK`, `DIPR`,
`PSK`, `RSWEEP`, `SLOTS`, `BANDS` = 3. `medium.js` — `PLAT`, `RLAT`.

**Constants added, with values:**

| where | name | value | what it is |
|---|---|---|---|
| sources | `NSLOT` | 32 | one shared launch ring (was `SLOTS` 8 per band) |
| sources | `TSIGK` | 1.2 | halvings of shell thickness per unit of `centroid` |
| sources | `SIGLO` | 2 | the thinnest shell, in substeps |
| sources | `DIRTD` | 2.2 | σ between the growl's two lobes |
| sources | `DIPB` | 0.35 | the dipole's base share of a centre launch (replaces `DIPR`) |
| sources | `BAMP` | `[0, .11, .025, .07, .045]` | per-band sector amplitude, indexed by band |
| sources | `RPT` | 8 | how many of a band's launches `rings()` reports |
| sources | `LASTN` | 16 | how many `launches().last` carries |
| sources | `PAT['8']` | 8 per bar | the double-time pinned train |
| onsets | `HI` | 0.45 | (moved from sources) |
| onsets | `REARM` | 0.5 | fall to this much of the band's own last peak to re-arm |
| onsets | `PKTC` | 0.5 s | that peak's decay |
| onsets | `REFR` | 0.07 s | per-band refractory |
| onsets | `KLEV0` | 0.5 | floor on a counted kick's amplitude |
| onsets | `KMAX` | 4 | most kicks taken from one frame's counter delta |
| onsets | `BCHMIN` | 0.08 | below this there is no bass note |
| onsets | `NOTEW` | 0.15 s | the window a chroma rise is measured over |
| onsets | `NOTEK` | **0.05** | ... and how far it must rise (measured, friction 7) |
| onsets | `NOTEA` | 0.045 | a note onset's amplitude |
| onsets | `NOTEREFR` | 0.20 s | its per-bin refractory |
| onsets | `ONSETW` | 0.05 s | how long an engine `onset` waits for a band |
| onsets | `ONSETA` | 0.07 | ... and its amplitude |
| onsets | `MAXQ` | 20 | launches one frame can emit |
| medium | `GEOROT` | 2 | geometries in the section's rotation |

**Bench:** MAXWELL 1.185 ms / NAV 1.799 ms; TORUS2 1.294 ms / NAV 1.845 ms; **0.92× TORUS2** at tier 3.

**`IDS=9 tools/scene-md5.sh mx3`:**

```
4ad6d2ea0b2818a9d9cb1b0ad5dc6f70  s9-f360.jpg
4c2ab3c8da487a007521cbc0112b2e50  s9-f840.jpg
```

(v0.11 was `d268a071` / `473e474c`, confirmed reproduced on this tree before the first edit. `scene 9 errs []`.)

**Lines in `assets/scenes/maxwell/` (v0.11 → v0.12):**

| file | v0.11 | v0.12 |
|---|---|---|
| `index.js` | 497 | **465** |
| `sources.js` | 248 | 261 |
| `onsets.js` | — | **151** (new) |
| `colour.js` | 225 | 225 |
| `fdtd.js` | 218 | 218 |
| `render.js` | 298 | 298 |
| `probe.js` | 115 | 116 |
| `medium.js` | 106 | 107 |
| `help.js` | 52 | 49 |
| **total** | 1759 | **1890** |

`index.js` gave up 32 lines to fit a whole new subsystem: the twelve charge weights moved into `SRC.weights()` (the
sources' setup belongs in `sources.js`), the detectors went into `onsets.js`, `hooks.launches()` is one delegating
line, and the comment blocks that duplicated `render.js`'s and `colour.js`'s own headers were cut back to a pointer.

## (f) The note-onset source: **shipped**

It fires, on all three demo synths, and it is the secondary source the plan asked for — not the primary one:

- house: 4 and 3 launches in the two measured 2 s windows, 40 cumulative in 14 s (~2.9/s)
- aba: 7 and 9 (52 cumulative in 14 s — aba is the most tonal of the three)
- dnb: 9 and 4 (38 cumulative)

against ~26–34 drum launches in the same 2 s windows. It would **not** have shipped at the plan's first `NOTEK`
(0.08 fired four times in fourteen seconds of house); the threshold is now measured rather than guessed, and the
measurement is in the constant's comment so the user can retune from data. On `#test` it fires **zero** times and
always will: `fake.js` leaves `MS.chroma` a zeroed `Float32Array`, so no bin can ever rise. That is a property of
the fake timeline, not of the detector, and it means the note source is provable only on the demo synths or a real
track.

## (g) Leans I would rank for the user (the montage is theirs to judge)

1. **The rate.** ~13–20 launches a second on house is the highest-confidence thing to argue about. It is "every
   sound" taken literally, per band. If it reads as busy rather than as music, lower `REARM` (0.5 → 0.35: a band
   must fall further before it re-arms) before touching anything else, then `HATA`.
2. **The hat is the last all-twelve source.** Every other launch has one sector and one hue; a hat injects `HATA`
   into all twelve in their own hues at once, which is the only thing left that can still pull the plane toward a
   mixture. Weighting a hat's per-sector injection by `W12[k]` would make it "the notes that are sounding shimmer"
   instead of "the whole wheel shimmers" — one line, not done, because the plan says the hat stays as it is.
3. **The waveguide.** Reachable only by `hooks.medium(3)` and it looks good (`mx3-c-med3-f360.jpg`) — the rails make
   the one composition in the scene that is not concentric. My vote is to put it back into rotation as a third
   geometry once the user has seen the cavity; the lens and the cavity are both round and read similarly at a glance.
4. **Brightness.** The picture is dimmer than v0.11 between hits by construction, and `FGAIN` 6.0 was tuned for a
   plane the carrier kept lit. It is still legible (probe centre 0.131 at f360, 0.193 at f840) and I did not move
   it, because raising it would be putting a floor back under "silence is silence". If the user wants more, `FGAIN`
   is the knob and `FLOOR` is not.
5. **`TSIGK` and `DIRTK` are unproven on real music.** Both shape the shell and both are invisible on `#test`
   (`centroid` 0.455 and `dirty` 0.2 flat at every frame), so they were proved by pin only. A dubstep track would
   exercise `DIRTK` properly — still none in the scratchpad.
6. **Tier-3 substeps.** v0.11 dropped them 4 → 3 to pay for the colour field. At 0.92× TORUS2 there is about 0.25×
   of headroom to put them back, which would make light travel a quarter faster at the top tier.

## What the next session should know

- The v0.11 friction log's traps all held. Add to them: **the release-on-`undefined` pin convention** (friction 4)
  and **`hooks.mxchroma`'s colour-field silencing is gone** (friction 3) — a v0.11 proof recipe that relies on it
  will now measure something different.
- The orchestrator still owes: the merge, `IDS=9 tools/scene-md5.sh v0.12` and a re-based
  `tools/accept/v0.12/scene-md5-v012.txt`, the headed runs with the paused start on the three tracks (`audit12.sh`,
  `det12.py`), the montages moved out of `tools/work/`, `AUDIT-v0.12`, DECISIONS §44, `NEXT-SESSION-PROMPT`,
  package.json 0.12.0, `releases/retinarave-v0.12.html` proven from `file://`, and the thumb re-shot
  (`tools/thumbs.sh "9:360"` — the f360 frame has changed).
- The scene is left **registered at id 9, bid 0 (forced-only)**, key `9` then `n`. No other scene, no `core/`, no
  `engine/`, no `main.js` was touched. `colour.js` is untouched. The only file outside the scene folder in the diff
  is `tools/accept/v0.12/det12.py`, one line, for the reason in friction 5.
