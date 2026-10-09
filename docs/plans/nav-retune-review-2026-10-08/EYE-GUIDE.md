# EYE-GUIDE — NAV2 (key 9) against NAV (key 1), the six windows of plan step 4 (2026-10-08, after §99 / §100 / §101)

Everything built in `assets/scenes/nav2/` is behind a knob whose rest is NAV's line; id 0 (key 1) is the byte-identical control
(`IDS="0 8" tools/scene-md5.sh`: s0 `fb74fee4… / 8a0715df…` unchanged through §97–§101). Nothing is tagged or deployed: v0.34 and the
home swap (id 8 → the director's home) wait for the word after this look.

## The recipe — file mode on the dev server, key 1 vs key 9

1. `node tools/serve.js` (8765) serving the repo; the tracks come from `~/Music/RetinaRave`.
2. Open `http://127.0.0.1:8765/#test&track=SeeYouDrop&at=25` — `&track=` starts the file source on the real extractor (no landing
   card), `&at=` the track second the playhead starts at. The page plays the file; the HUD (`d`) shows the scene's `rt.label`
   (`INT 1/2`, `EXT …`) and `rt.log`.
3. Press **`1`** for NAV (id 0) or **`9`** for NAV2 (id 8); press the other key to A/B at the same bar — both navigators are updated
   every frame (`always: true`), so the two keys compare the same state, only the retune differs. Reload with a new `&at=` to re-cue.
4. A term off: append its knob to the hash and reload — the knobs only apply on `#test` and only to id 8:
   - §99 look: `&n2lum=0` (the exposure knee off) · `&n2smo=0` (the old root smoulder) · `&n2fl=0` (the old white flash) ·
     `&n2ext=0` (no exterior dim / halo narrowing) · `&n2key=0` (the old drifting hue instead of colour on key) · `&key=7` pins a key.
   - §100 motion: `&n2kick=0` (v3's onset picker instead of the kick lane; `=THR,HOLD` sweeps it, chosen .45,2) · `&n2breath=0` (no beat
     breath; `=AMP`, chosen .3) · `&n2sub=0` (no sub press) · `&n2pitch=0` (no bass-note lean) · `&n2trap=0` (the old half turn per beat).
   - §101 navigation: `&n2walk=0` (the species bulb only, NAV's places; `=DEPTH,MINSIZE,PER,DWELL`, chosen 7,.008,1,1 — `PER=2` steps
     every other phrase, `DWELL=2` sits two bars before moving) · `&n2green=0` (no ruler: the sides alternate, no early step; `=W,QMAX,BARS`)
     · `&n2drop=0` (NAV's drop: the current bulb's ray, θ springs to harmUnw + seed).
   - All of §101 off at once: `#test&track=…&at=…&n2walk=0&n2green=0&n2drop=0` = the §100 picture; all three §§ off = NAV to the bit.
5. Reporting a look remark in track time ("1:04 too bright") is enough — every window has a frame-exact headless trace behind it.

## The six windows — what each term should be doing there

The headless contact sheets for three of them are in `after-s99/`, `after-s100/`, `after-s101/` (8 tiles per row, captioned t / meanY /
clip); `baseline/` is id 0.

### 1. SeeYouDrop 0:25–1:00 (`&at=25`; 150 BPM 4/4, the build 36–43, the live drop at 43, the breakdown 53–58, the big drop at 58)
- **§101 the walk**: 0:25–0:43 NAV sits in 1/5 (interval 3) for 23 beats; NAV2 steps at the phrase lines (33.6, 40.0): 1/5 → 1/4 →
  (the loud exit) → 3/5 → … — the pinch count of the Julia set changes every phrase (5 arms → 4 arms → 5), with NAV's own rim walk
  between (the near-circle moment with the pinch dissolving). Watch that a place is SEEN for a bar before it moves (DWELL).
- **§101 the drop**: at 43 (and 58) c launches along the new place's landing ray and the dust stays put — NAV sweeps θ a full turn
  through the dust over 5 s after the launch (its "exterior sweep", the monitor's 8–10 violations); NAV2's θ only drifts with the
  harmony from the ray. The second drop lands on the other ray of the pair (the exterior looks different from the first).
- **§100**: the kick jumps (≈ .8 per bar here: c jump-cuts toward a Misiurewicz point, the interior goes dark mid-flight — the Zurna
  33 s moment), the beat breath on the radius (the arms tighten on the beat), the void 40–43 (no jumps while the detector is armed).
- **§99**: the loudest bars (35–40) the most legible — dark interior, bright rim, no white wash; the hue sits on the key (SeeYouDrop's
  key hue) and steps a twelfth per phrase instead of drifting through green.

### 2. Vienna 1:00–1:35 (`&at=60`; 90 BPM, kick on 1 & 3, the double time from 85)
- **§101**: Vienna sits on the CARDIOID (interval 0 — the 0/1 species, α free on the harmony): the walk's only neighbour that clears the
  size floor is 1/7 (`ladder(0,1)` = [1/7]); NAV2 steps cardioid → 1/7 → cardioid per phrase once it has dwelt a bar — the 7-armed pinch
  appearing and dissolving at the phrase lines is the §101 term here. If it reads as too much on a 90 BPM track, `&n2walk=7,.008,2`
  (every other phrase) is the knob.
- **§100**: the double time from 85 should ACCENT the breath (a bigger crest), never speed it; the trap turns π per bar.
- **§99**: 75–80 is the darkest row (it is the quietest) — the loudness ladder, not the root, sets the smoulder.

### 3. CyborgNinja 0:40–1:10 (`&at=40`; 16ths, 808 slides, the drop at 0:48)
- **§101**: the 0:48 drop launches along the walk's new place's ray; HOME returns to that place, not where it left.
- **§100**: the 808 glides lean φ (the pitch lean); the kick lane at THR .45 lets the kicks, not every 808 note, jump (1.2 per bar).
- **§99**: the post-drop dust (55–60) is not a wash — the knee takes the top off; grad (structure) stays.

### 4. Malicious 2:20–2:40 (`&at=140`; the hand-anchored grid)
- **§101**: the walk's species here is interval-driven as before; on a 20-s window expect 1–2 steps (a phrase is ~8 s at ~120 BPM) —
  watch for a place change exactly on a phrase line, and that the bar-line timing of the move feels musical (the step waits for a
  bar line after the dwell).
- **§100**: jumps .69 per bar (the least of the six); the sub press on the half-bar chops.

### 5. IBelongHere 0:40–1:10 (`&at=40`; many interval changes = NAV's own rim walks)
- **§101**: here NAV already walks between bulbs (3.4 places per minute); NAV2's walk adds its Farey neighbours on top — if the picture
  reads as "always in transit", `DWELL=2` or `PER=2` is the knob (the metric in §101 counts places dwelt ≥ 1 bar).

### 6. WhoLikesToParty, one drop (`&at=` the drop's second − 10)
- **§101 the drop**: the launch ray differs from NAV's (the new place's, the other ray of the pair on the next drop); the dust does
  not sweep. **§99**: the slam is where white is spent; the dust after it dims under the knee.

## What to say back
Per window: which key looked better and WHEN (track time), and which term it was (walk / drop / kick / breath / knee / colour) — one
knob per remark is enough; the lumtrace and the places ruler (`tools/navkicks.js replay … --places=1`) turn the remark into a number.
