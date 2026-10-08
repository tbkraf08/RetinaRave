# Engine gains v0.15 (§48) → v0.33 (§96) that a scene can read — and what NAV does not read yet

Sources: docs/DECISIONS.md §48–§96, assets/engine/feats.js (the registry), features-*.js, assets/math/{beatgrid,voice,keycolour,nudge,loudlight}.js,
assets/scenes/nav/{index,nav}.js, docs/plans/TONGUES-PLAN.md + TONGUES-PITCH-PLAN.md. Read-only review, 2026-10-08.

**NAV reads today** (`feats`, 26 names): interval repeat seed · beat beatPhase beatCount · dropLiveEvt dropStrength dropEnv · intensity
buildLive suspension presence · harmUnw arc · onset hitStrength hit · eS eM tension resolveEvt · bass mid high · peaks.
Of these only **buildLive / dropLiveEvt** (§54, the user's "#1 = NAV only") are post-v0.15; everything else is the v3 extractor. NAV's
per-beat motion is one ease on the orbit-trap angle (`br = beatCount + 1 − (1−beatPhase)^3`, index.js draw) plus retargeting on `beat`; its
"hit" is the v3 spectral-flux `onset`/`hitStrength` (a Misiurewicz kick) and the `hit` decay (edge flash, 7 % zoom). The clock itself is
already the PCM clock (§56 default) and the §61/§90 tempo fixes — NAV rides those for free. (NAV's `clarity` was dropped in §93: no reader.)

R = reactive (measured now) · P = predicted / anticipatory · NAV? = in NAV's `feats`.

## A. Field inventory (what a scene can read, by family)

| field | § | what it is | R/P | validated by user? | read by | NAV? |
|---|---|---|---|---|---|---|
| heardT, fileOn, leadT | 48/49 | heard-time base; the lead that moves beat/bar clocks onto what is heard (+40 ms disp in file mode, 0 live) | R | §49 "looks good" (lead ON); §53 stream A/B "B looks better" (disp 0 live) | engine/harness | n (rides it) |
| subHz subCents subNote subConf subGlide subPure | 48 | the sub's pitch (YIN), cents off note, pitch class, confidence, slide, sine-ness | R | CHLADNI v0.15 "looks good" (stream) | CHLADNI | n |
| subGate subIn subOut subNoteEvt | 48/73/75 | is the sub sounding (hysteresis gate), its in/out edges, a new sub note | R | via CHLADNI/DUST looks; §75 cold-start fixed | CHLADNI, DUST | n |
| tonic tonicMinor tonicConf | 48/62/84 | the key's root (KK on a chroma incl. the sub), minor?, confidence (§84 = KS margin × bass agreement) | R | §62 "fix it"; §84 NOT seen ("not tagged… the user has not seen it" at the time; now live in v0.3x) | CHLADNI; key/mode/keyConf owners | n |
| key mode keyConf | 62/84 | now owned by the ears' tonic when it has one (was synapse's fifth-above) | R | §62 yes; §84 gate not eye-validated | DUST TORUS2 POLYTOPE MAXWELL GIELIS MANDALA (mkAnchor), CHLADNI | n |
| modeShade | 82 | is THIS BAR major (+1) or minor (−1): chord quality of the bass's degree in the key | R (per bar) | YES — "default on; tag; deploy" (v0.29) | the 5 mkAnchor scenes + MANDALA | n |
| bassReg lpSweep width pulse | 48/73 | where the bass lives (35→140 Hz), how closed the low-pass is (live only since §73), stereo width, felt beat ×0.5/1/2 | R | lpSweep→CHLADNI fog "never validated by anyone" (§74) | CHLADNI (bassReg, lpSweep); width/pulse: nobody | n |
| kickEvt kickAge kickVel kickAmp denK | 48/68/70/73 | the ears' LOW lane: a 60–150 Hz dB RISE ≥5 dB (kick or 808 start); age in s (sub-frame); per-track rank; ABSOLUTE size (16 dB span, floor .31); kicks/s | R | v0.23 "tag"; v0.25 "torus2 and dust both look better"; CHLADNI §74 on the user's word | DUST, MANDALA, CHLADNI (kickAmp) | n |
| snareEvt snareAge snareVel snareAmp denS | 48/69/70 | the SNARE lane: two mid bands' rise ≥3.75 dB; size on a 12 dB span | R | v0.24 "it does look better"; v0.25 | DUST (lane alone), TORUS2 (snare wave), MANDALA, CHLADNI | n |
| hatEvt hatAge hatVel denH | 48/64 | the hat flux lane (no hatAmp exists); §64: a swell is not a stick → scenes veto via `bed()` | R | §64 "fix it"; DUST v0.27 "beautiful" | DUST, MANDALA, CHLADNI | n |
| kick2 snare2 hat2 | 51 | reactive drums v2 LEVELS (kick2 = the ears' low lane; snare2/hat2 synapse's held to heard time), same 0..1 shape as kick/snare/hat | R | YES — "the reactive still looks better (moves in sync)"; "v2 looks good" → TORUS2 default | TORUS2, DUST, MANDALA | n |
| predKick/Snare/Hat{Evt,Age,} predKickIn predConf barMatch | 50 | the bar store's PREDICTED hits, on time | P | mixed: "more energy… but the beat is off slightly at the beginning"; reactive preferred (§51) | nobody by default (routes) | n |
| barNovelEvt barReturnEvt | 50 | this bar starts something new / returns material ≥8 bars back | P→R (fires on heard steps) | via DUST/MANDALA formation seams (v0.27) | DUST, MANDALA (trigger()) | n |
| buildLive dropLiveIn dropLiveEvt | 54/64/77 | the void before a drop (bass or sub pulled, or §77 beat-ambiguity ≥.9 for 8 beats) 0..1 rising per bar; beats to its bar line; the slam | P / P / R | YES — "B looks good", "#1" (NAV) | NAV, DUST, MANDALA | **y** (not dropLiveIn) |
| nextBeatIn nextBarIn nextDropIn next{Kick,Snare,Hat}{In,Conf,Up} queueN | 55 | the queue: seconds to the next beat / bar / expected drop line / predicted hit; 250 ms wind-ups | P | TORUS2 A/B only (route); nextDropIn "is NOT a runway" (≤1 bar) | DUST, MANDALA (nextDropIn via tens()) | n |
| bpmPcm beatPhasePcm beatCountPcm beatPcm clockConfPcm clockPcm | 56/59/61/90 | the PCM-bus Kalman clock; conf = 1 − σ/0.25 beat | R | YES — "handles the double time… better; default" → bpm/beatPhase/beat/beatCount ARE this clock | every scene via the canonical names | n (rides it) |
| loudM loudS loudPk loudRel loudRange loudAbs | 63/65/67 | BS.1770 loudness: momentary, 3 s, track peak hold, 0..1 for-this-track, dynamic range LU, abs/rel/off sentinel | R | "loudness plan approved"; §65/§67 "never signed off" by eye but shipped inside v0.27 "beautiful" | DUST FEIGEN MANDALA POLYTOPE via baseLight() | n |
| tension (re-normalised) rLo rHi | 81 | roughness against its own p10/p98 over 30 s (was two followers) | R | deployed v0.29; eye not recorded | NAV (reach), NAV2, DUST, MANDALA, all `tension` readers | y (already) |
| tongueP tongueQ tongueDepth tongueK tongue11 tongue21 tongue41 tongueAmbig tongueLat tongueLatConf swing tongueOn | 76 | the Arnold-tongues descriptor (see C) | R (16-beat trailing window, per beat) | DUST accent v0.27 "beautiful"; fog/hat lever v0.29 deployed, eye not recorded | DUST, MANDALA (21/41/Ambig/On), TORUS2 (Ambig/On), build detector (Ambig) | n |
| mapOn toDrop toBoundary buildProg mapSection mapNext mapReturn eG mapDropEvt mapBoundaryEvt | 48 | the whole-track map — FILE mode only, 0/−1 live | P (non-causal) | v0.15 | CHLADNI | n |

Not changed but worth knowing: `dropStrength`/`dropEnv` stay v3's even on NAV (§54); `eM` p25 is 0.972 on real music so any `eM` term is ≈ dead (§57/§63); `eG` is a rank, never a loudness (§63).

## B. The lifted helpers (assets/math/*, pure, a scene may import only these)

**beatgrid.js** (§57→§61→§66→§78, lifted §85). An angle as a CLOSED FORM of (beatCount, beatPhase): per beat the velocity is a base glide
(GLIDE .45) plus a raised-cosine accent (W .55 beat, wall-clock-capped under 145 BPM) that starts W/2 before the line and PEAKS ON it; the
downbeat's step is ×1.5 (`DOWN`, `barIndex`), and the double time raises the step by `ACC.K·accent21()` (the 16-beat RISE of
tongue21/tongue41 — a layer arriving, never its level). Clock re-seats are absorbed into an offset bled at 0.75 beat/s so nothing snaps or
turns backward. `mkSpin(step)`/`spin(S, MS, dt)` → the angle; `mkTrigger`/`trigger()` → a formation change only on a 16-beat wrap or
`barNovelEvt`. Measured jerk a tenth of the §58 impulse and below TORUS2's. Users: DUST (grid.js re-exports), MANDALA (one wedge per bar).
This is the single most user-validated piece of motion in the repo ("what i've seen so far is beautiful", v0.27).

**voice.js** (§57/§58/§64/§70/§80, lifted §86). A transient voice: `voice(v, dt, lvl, age, evt, veto, amp, gain)` fires on the ears' event
(placed to the sub-frame by the age) OR the v2 level's rising edge, 60 ms refractory, sized by `amp` (kickAmp/snareAmp — the lane alone) or
the level, decays over its own tc with `lvl` as the floor. `bed()` vetoes a hat event while the high band is swelling (ratio 1.05 over a
2 s EMA). `hatGain(acc)` = 1 + 0.5·acc, the second accent lever. `tens()` eases buildLive (τ .35), winds the LAST bar from nextDropIn
(< 1.7 s), releases on dropLiveEvt (τ .55). Users: DUST (three voices), MANDALA (fold pulse, segment flash, ring glint).

**nudge.js** (§36-style lift of TORUS2's turn). The OLD nudge: an ease (τ 0.3 s, ×2 under hush/calm) toward beatCount/16 of a turn.
Users: MAXWELL, CHLADNI, GIELIS. Superseded in feel by beatgrid's profile; TORUS2 keeps its own copy (the user's favourite mapping).

**keycolour.js** (§36, §82, §84). `mkAnchor().anchor(dt, key, mode, keyConf, valence, harmAngle, moodHue, pin, modeShade)` → an eased hue
on the circle of fifths, pulled WARM/COOL by mode and per bar by modeShade (SHADE.K .25 ON), gated by keyConf (KEYC0 .1 → KEYC1 .3),
sliding back to the mood palette when the key is not trusted. `sectorHue`/`sectorPc` for twelve-spoke wheels. Users: DUST TORUS2 POLYTOPE
MAXWELL GIELIS MANDALA CHLADNI.

**loudlight.js** (§63 phase 5, §67). `baseLight(loudRel, loudRange, loudAbs, fallback)`: the track's own LU ladder stretched over 0..1
(floor 6 LU), top anchored at 1.0, the pre-loudness value returned untouched when loudAbs < 0 (so `&loud=0` is a bit-exact A/B).
Users: DUST, FEIGEN, MANDALA, POLYTOPE. §63 phase 7 looked at NAV and did 0 lines (see D5).

## C. Tongues (§76–§80, TONGUES-PLAN phases 1–5 all built; master switch `&tongues=0` → tongueOn −1)

The twelve fields, all on the PCM clock's own mid-band (150–2500 Hz) and low-band (40–150 Hz) onset novelty, 16-beat trailing window
stepped once per beat (so a frame reads the last closed window — a bar or two of lag by construction):
tongueP/tongueQ (the rhythm that locks most robustly, p/q of the beat) · tongueDepth (eased 0.3 s: how firmly the beat itself locks, medians
.07–.36) · tongueK (accent salience, .14–.41) · tongue11 / tongue21 / tongue41 (the ladder: beat / 8th / 16th depths — the 8th is DEEPER than
the beat on every track, so depth never decides the octave) · tongueAmbig = 1 − max(11,21,41) (1.0 through Vienna's dream 72–86 s, .3–.6 in a
groove, ≤ .69 on SeeYouDrop, ≤ .37 CyborgNinja) · tongueLat/tongueLatConf (the low band's half-beat verdict; read Lat only above conf .06)
· swing (1.0 on all five test tracks — nothing to show) · tongueOn (1 / 0 warming / −1 off).
ON by default: the stage; §77 the build detector's third arming path (ambig ≥ .9 for 8 beats — so NAV's park already fires on it, 8.9 beats
before Vienna drop 1; NAV's build route WAS the §77 A/B); §78 DUST nudge accent; §79 TORUS2 haze; §80 DUST hat gain.
OFF / declined: phase 2 `CLOCK.LAT_SRC='tongue'` (built, stays 'low'); the pitch tongue bank (TONGUES-PITCH-PLAN phase 1, declined); a
tongue event, tongueBpm, tongue12.
How the scenes use them:
- DUST §78/§80: at each beat line `acc = accentOf(max(Δtongue21, Δtongue41) over 16 beats)` (dead < .15, full ≥ .45); the nudge step ×(1 + .25·acc)
  and the hat hit's size ×(1 + .5·acc). A CHANGE over bars, never the level: CyborgNinja's steady 16ths (depth .61 all track) move nothing.
- TORUS2 §79 (haze.js): `haze = smoothstep(.75, .95, tongueAmbig)`, 1.5 s in / .4 s out; extra depth fog, floor .55→.25, desat .45, veil, bloom
  thr .30→.15; dropLiveEvt clears it on the beat and holds it off 16 beats. The level form (not the rise form) was chosen here.
- MANDALA §87/§88: `amb = max(0, (tongueAmbig − .75)/.25)`, `tight = max(buildLive-eased, amb)` with hysteresis → N+1 wedges, palette drains,
  body dims, inversion clamps; the slam lets go in one frame; plus §78's `sp.acc` and §80's hatGain on the glint via the lifted helpers.

## D. Top 8 candidates for NAV (ranked)

1. **The ears' kick lane for the Misiurewicz kick** — `kickEvt`/`kickAge`/`kickAmp` (+ `snareEvt`/`snareAmp` for the edge flash `hit`). Today the
   kick needs v3's `onset && hitStrength > .55 && eS > .3` (spectral flux over 96 frames — a different, laggier picker). Fire the jump-cut on
   kickEvt placed by kickAge, size it by kickAmp (floor .31 = the smallest honest kick; §74's sqrt law keeps a size-1 hit equal to today's),
   and let the edge flash/zoom-in ride snareAmp instead of `hit`. Reactive; the most user-validated family since v0.15 (v0.23/24/25 tags). Caveat:
   the kick is a c-jump, and the lane fires on 808 notes too (denK up to 7/s on CyborgNinja) — keep NAV's own refractory (`N.kick.x < .15`)
   and the park gate, and consider a `veto` while buildLive parks (the kick in the void reads as a twitch). Needs an eye A/B; `&map=0` to see the live lane.
2. **beatgrid.js's profile for NAV's per-beat motion** — replace `br = beatCount + 1 − (1−beatPhase)^3` (an ease that STARTS on the line, lands
   late) with `spin()`'s closed form (crest ON the line, glide between, downbeat ×1.5, no re-seat snaps) on the orbit-trap angle, and the same
   PHI(u) as the breathing on `h`/zoom. Reactive (a function of the published clock), the look the user called beautiful on DUST. Caveat:
   the accent leads the line by W/2 (110 ms) by design — the user wants 0 display lead in stream mode, but the §61 profile was judged in
   stream mode on DUST, so this is "anticipate like a dancer", not a lead. NAV's trap is subtle; the effect may need the angle to drive
   more (rotv / GROOVE.rot is the core's — leave it).
3. **`tongueAmbig` (+ `tongueOn`) read directly** — the dream before a drop. NAV already parks through §77 but only once ambig ≥ .9 for 8 beats
   (binary, late). A level read like TORUS2's `smoothstep(.75,.95)` could crawl the visual clock (`timeScale` toward .3), pull c to the cusp
   softly, and pale/fog the exterior dust before the detector arms — then dropLiveEvt clears it on the beat (NAV owns drops, §95). Reactive but
   a 16-beat window (bars of lag); four control tracks never cross .75, so it is a Vienna-class lever. Fallback on tongueOn ≠ 1 required.
4. **`nextDropIn` / `dropLiveIn` — wind the LAST bar** — via `tens()`'s `wind` (< 1.7 s to the expected line): tighten `par` (the critical
   slowing), pull `h` to 0 and the PiP in over the last bar on top of buildLive's park, so the release at the slam is bigger. Predicted, but
   it is a count-down to a bar line NAV already trusts (the same line dropLiveEvt lands on), never a hit prediction, and DUST/MANDALA use it the same
   way. Caveat: measured "not a runway" — never > 1 bar; Vienna drop 2 never arms (nothing happens there, same as today).
5. **True loudness for NAV's base light** — `loudRel`/`loudRange`/`loudAbs` through `baseLight()` for the interior glow (`bass` term), the
   dots size and the PiP; and the one §63 recommended-not-done item: `post.fb.decay = .7 + .16·eM` is a dead term (eM ≈ .97 always). Reactive,
   gain-invariant, A/B-safe (`&loud=0`). Caveat (§63 phase 7, verbatim): the feedback decay is NOT a drop-in — gain 1/(1−d) makes .72→.84 a
   3.6×→6.3× brightness jump; wants its own A/B. Breakdowns would read darker than today (the point, and the one thing §65 said the user "may want back").
6. **The double-time accent** — `tongue21`/`tongue41` rise via `accentOf()` (comes free with 2 through `spin()`'s `S.acc`): a layer ARRIVING makes
   the per-beat crest bigger — a deeper breath on `h`, a bigger trap ring — never faster. Reactive change-over-bars; validated DUST v0.27 and
   MANDALA. Caveat: the user's rule "accenting rather than driving" — amplitude only, no 8th nudge (§66 rejected it, 5.33 crests/s on CyborgNinja).
7. **The bass NOTE for the bulb** — `subNote`/`subGate`/`tonic` (and `bassReg`): NAV's `interval` is argmax(chroma) − argmax(bchroma) held .45 s
   (v3's 240 Hz band, §62's fifth-above bias lives in the same chroma). Rooting the interval on the ears' subNote while subGate is open (tonic
   as the fallback) makes the bulb walk follow the bass line; `bassReg` could pick the baby-copy depth (sub = deep). Reactive. Caveat: the
   interval→bulb mapping is NAV's identity ("bulbs by interval") — changing the root changes which bulbs it visits; needs an eye on SeeYouDrop
   (first 12.9 s have no sub, §75). Mono — `width` has no reader anywhere, a stereo tilt of the view is open territory.
8. **Key hue on the orbit dots / PiP path only** — `mkAnchor()` with key/mode/keyConf/modeShade for `uCol`/`uPc` (today `LOOK.hue ± .5/.45`).
   Reactive, bar-wise shade ON since v0.29. Caveat: the v0.2 blue exterior IS the validated default and OKLCH pastel was rejected as default —
   keep the Julia ramp untouched, colour only the dots/path, or ship as the `oklch` variant's behaviour.

Not proposed: `predKick*`/`next*Up` routes (user: reactive looks more in sync, §51; "beat off at the beginning", §50); the PCM-clock names
(NAV already rides them); the map fields (file-only).

## E. Explicitly rejected / left off since §48 (do not re-propose)

- A nudge on the 8TH / any per-8th crest (§66, §78): "the double time should be accenting rather than driving"; CyborgNinja's 16ths fire the same gate.
- Predicted hits as a default look (§50/§51): the user chose reactive; pred* stay route-only. The queue "predicts nothing" (§55); HORIZON 4 was a no-op.
- `eM`/`eMax` as a dynamic range (§57 "useless", p25 .972); `lvl` likewise (AGC); `eG` as a loudness (§63, "a rank").
- NAV's `post.fb.decay` onto loudness as a one-liner (§63 phase 7: 0 lines, recommended with its own A/B — see D5).
- `keyConf` = the ears' clarity (§62 reverted; superseded by §84's tonicConf — the §84 gate itself still "owed" the user's ear on CyborgNinja 0:48 and Malicious 2:28).
- The pitch tongue bank and the fourth arming path (TONGUES-PITCH-PLAN phase 1, declined); `CLOCK.LAT_SRC='tongue'` (built, OFF); tongueBpm/tongue12/a tongue event (§76).
- A held/decaying copy of the accent `acc` (§80 "measured, rejected"); hat gain K .25 ("does not read") and K 1 ("driving").
- §64: the absolute-difference swell form, dropping hat2's edge, gating the ears' hat on hat2, a self-calibrating gate, a smaller floor, an 8 Hz rate limit.
- §61: a mid-band lattice voter, an even/odd double test, a per-beat weight from the beat's strength, a tempo-feel scale on the step, per-voice rate limits, voice decays in beats.
- §68/§69: the union of the two low lanes, the old lane vetoed by the rise, an adaptive threshold; `snare2` stays synapse's (it would move TORUS2's default).
- §73/§74: tuning anything against `*Vel` (per-track rank — use `*Amp` for a size); raw `kickAmp` without the sqrt law ("limp"); a per-track slow normaliser.
- §75: a time-based warm-up gate, an absolute level floor ("the ears are relative by design"); a 60–200 Hz bass pitch track is a milestone, not built.
- §90: `SW_Y1` comb gate (default 0); the 8th-line kick variant (`lineSub 2`, OFF).
- §93: DRUM (NAV's variant) bids 0 — "NAV means the navigator alone"; MANDALA/GIELIS/CHLADNI/MAXWELL forced-only; territories "not validated by the user's eye yet".
- §95: NAV's dwell is NOT gated — drops hard-cut home, builds park home, silence drifts home; "the user's rule for drops stands (NAV owns them)".
- Colour: OKLCH pastel rejected as default (memory); the v0.2 look stays, variants opt-in. Display lead: 40 ms file / 0 stream (§52/§53) — do not add a lead to NAV.
