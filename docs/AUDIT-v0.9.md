# AUDIT v0.9 — POLYTOPE dances (2026-09-25, orchestrator; DECISIONS §41, worker report `docs/workers/polytope-dance.md`)

**What was asked (the user, verbatim):** *"write a prompt to improve the polytope scene (can modify existing polytope scene; only work on
scene -> don't need full testing sweep; can tag and deploy when done); what musical/visual language can we leverage from torus2 update?
how can this shape dance to the music? I liked color tied to circle of fifths; should extract grooves from bass, mid, highs."* One answer
to the interview: in place, tag, deploy, no gate. Thirteen leans in the brief; the user has not looked.

## What the eye sees (`tools/accept/v0.9/montage-polytope.jpg`, before left · after right)

- **Before:** one hue end to end per frame (the mood palette's two coordinates), the cage turning at two steady speeds.
- **After:** the cage is a **colour wheel** — twelve sectors round the bass plane, red/magenta/yellow warm on a major key, green/teal/blue
  cool on a minor one (`pd-colour.jpg`: `hooks.key(0,0)` vs `(7,1)` turn the wheel, they do not tint it; the C major triad keeps three
  sectors lit and the rest at the floor). The edges are **beaded**, not evenly lit: every hit sends a bump one edge-length per bar, so a
  bar's four kicks sit at quarter spacing (`pd-trains.jpg`: 4x4 at .10 .35 .60 .85, sync at .10 .225 .60 .725). The xy plane holds
  `beatCount/16` and lurches on each bass onset; the figure thumps 5 % on the beat. The **inside-out sweep** (`pd-sweep.jpg`) fires on a
  phrase boundary or drop: the vertex nearest the pole crosses it over one beat, the cell blows up and fades, the cage is inverted, the plane
  settles back to its lock. Between cues no vertex is newly gated (600-frame margin logs on `#test` and house, 0 gated).
- **The one look pass (orchestrator):** on the first real-track montage the after frames were plainly dimmer than v0.8's — real chroma lights
  two or three sectors and leaves the other nine at the floor, where the fake timeline had lit the wheel broadly. `GLOW0` .35 → .55 (the
  `glow` param's resting value), everything below re-shot on that value. Still for the user's eye: the overall brightness against v0.8
  (`GAIN`, `PBRI/PWID`), and the wheel is busy on the 120-cell cast at 6 k segments.

## The real tracks (`tools/accept/v0.9/audit9.sh`, id 5 forced by key `6`, tab capture, 80 s each; `a9-{cn,wltp}-{20,40,60,80}s.jpg`)

| track | bpm | key | frames | black | long | errs | q at 20/40/60/80 s |
|---|---|---|---|---|---|---|---|
| CyborgNinja | 159.9 | 7m → 8m (keyConf .56 → .90) | 4853 | 0 | 0 | [] | .59 .67 .75 .83 |
| WhoLikesToParty | 116.9 | 11m (keyConf .67–.83) | 4838 | 0 | 0 | [] | .59 .67 .75 .83 |

Before shots of v0.8's POLYTOPE at the same clock times from the pre-merge tree (`before-{cn,wltp}-*s.jpg`) sit beside them in the montage.

## The three trains (`tools/accept/v0.9/det9.py`, `hooks.info()` at 2 s over 80 s; `det9-{cn,wltp}-pass1.txt`) — one pass, no retune

| band | CyborgNinja launches/beat | empty 2 s windows | drum vote | WhoLikesToParty launches/beat | empty windows | drum vote |
|---|---|---|---|---|---|---|
| bass | 0.88 (median 5 per window) | 0/39 | 10 % | 0.94 (4 per window) | 0/39 | 25 % |
| mid | 0.24 | 7/39 | 28 % | 0.36 | 6/39 | 15 % |
| high | 0.24 | 9/39 | 10 % | 0.69 (3 per window) | 0/39 | **62 %** |

**Verdict:** the bass train is on the beat on both tracks — one launch per beat, never a silent window, never the four-per-beat a
saturated detector would file at the 16th refractory. The mid train is the snare-and-vocal lane at about every third beat. The high train
is the hats where the track has hats (WhoLikesToParty, 62 % hat-confirmed) and sparse on CyborgNinja, whose high band is a sustained wash
(level median .81 against an EMA of .78: a rise has no headroom) — a retune there is `THR_HIGH` .17 down, or the EMA's ~0.4 s up, the
first threshold lean to revisit. `gridTrust` .8–1.0 throughout, so every launch snapped to the 16th grid. The kick vote on the bass train
is low (10 % / 25 %) against a decaying `kick` impulse and a ±1-frame window — the ×0.6 no-vote amplitude is the lean to widen if the bass
beads look faint.

## Proofs on the merged tree (`de6a5fe` + the docs commits)

- `node tools/check.js` 0 fail (2 pre-existing warns); `npm test`, `tools/test_polytope.js`, `param-smoke.js` pass.
- `tools/scene-md5.sh`: ids 0–4, 6–8 byte-identical to `tools/accept/v0.8/scene-md5-v08.txt`; s5 `06b46063…` / `cccb0094…` on `GLOW0` .55 (the v0.9
  reference `scene-md5-v09.txt`; the worker's `177c300f…` / `84a6bb55…` were at .35); TORUS2's s3 unmoved after the keycolour move (four runs). `git diff 033f800 -- assets/core assets/engine
  assets/main.js` empty; `tools/parity.js fake` 0 over 72 fields.
- mixs `f0c9d637…` — moved at **v0.8.1**, not here (the same value on `753f985` and after the merge; `641f6633…` was v0.7–v0.8). Re-based.
- Bench (protocol, cast pinned by `hooks.cast`): cast 0 .528 ms vs .429 before (1.23× raw, 1.25× NAV-normalised; cap 2×); cast 2 with all
  24 slots live 1.118 ms, .58 of NAV.
- Q trace house + aba, before vs after, 3 runs each: every window mean identical to the second decimal (house .73, aba .83), 0 EXC.
- `accept.sh` "== polytope" run once on the merged tree: md5s = reference, 4x4 even / sync uneven, key pair differs, `groove=c:0` moves
  the md5, node test OK (`tools/work/montage-polytope-accept.jpg`). The full sweep was **not** run (a scene change; `feedback_sweep_cost`).
- Bundle from `file://` with key `6` → scene 5, errs `[]`; `releases/retinarave-v0.9.html` = dist at the tag.

## Still open

The NAV2 question (v0.8, `docs/AUDIT-v0.8.md`) is still ahead of everything; the Cloudflare dashboard steps (v0.6); TORUS2's leans;
`torus-v1`; the OKLCH variants; POLYTOPE's portrait cropping (pre-existing); cells-as-pitch-classes (the next POLYTOPE idea).
