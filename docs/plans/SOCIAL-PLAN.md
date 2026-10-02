# Share — the recorder, the release notes, the landing (a plan, 2026-10-02)

Written on the user's word ("only planning for now → interview me"), on v0.29 (`dca98f5`, deployed). **STATUS: PLANNED,
nothing built.** The brief, in one line: a visitor (or the user) presses `R`, plays music, presses `R` again, and a video
with sound lands on their disk; the site tells first-time visitors what Retina Rave is and what is new; the clips and the
release notes feed social posts (Reddit, YouTube automatic on approval; Instagram as a copy-paste bundle) from a
**separate** project, SocialMediaManager (`docs/plans/SOCIAL-MANAGER-BRIEF.md`). This document is the Retina Rave half.

## 0. The split and the contract between the two projects

Two projects, decided 2026-10-02 (the user asked, the plan recommends, the user did not object):

| project | owns | knows nothing about |
|---|---|---|
| **RetinaRave** (this repo) | the `R` recorder and watermark; `releases.json` and the tag ritual; `/whats-new`; the landing card's message; the help / about notices; `tools/clip.js` (trim, transcode, poster, 9:16 crop) | subreddits, captions, API clients, schedules |
| **SocialMediaManager** (new repo, `~/Documents/Kraftek/SocialMediaManager`, prod-eng mode, `brands/retinarave/`) | the queue, caption drafting, Reddit + YouTube clients, the Instagram bundle, the backlog drip, the post log | WebGL, scenes, the engine |

**The contract** is a folder per clip plus the release notes file, both produced here, both read there:

```
tools/work/clips/<yyyy-mm-dd>T<hh-mm>-<scene>-v<ver>/
  clip.webm          the browser's recording (VP9/Opus), as saved by R
  meta.json          the sidecar (schema in §2.4)
  clip.mp4           tools/clip.js: H.264 yuv420p + AAC, trimmed if asked      (after the user's trim)
  clip-9x16.mp4      tools/clip.js: centre crop for Reels / Shorts              (same)
  poster.jpg         tools/clip.js: one frame, 1920x1080                        (same)
releases.json        one user-facing entry per version (schema in §3.1), newest first
```

`tools/work/` is gitignored; the clips folder stays out of git. SocialMediaManager reads both paths from its brand
config. Nothing in this repo ever posts anything.

## 1. The interview, recorded (two rounds, 2026-10-02)

Answers given; everything not listed was offered with a default and accepted by silence ("defaults except …").

| # | question | answer |
|---|---|---|
| 1 | capture path | default: in-browser MediaRecorder; offline deterministic re-render **deferred** (see §2.7) |
| 2 | audio source while recording | **tab capture first, file second** |
| 3 | music rights | "I don't care for now" |
| 4 | aspect | default: 16:9 at canvas size; 9:16 as a centre crop by `tools/clip.js` |
| 5 | where files land | default: browser download + sidecar JSON |
| 6 | what is in the clip | default: watermark `@retinarave · <scene> · v<ver>` burned in; HUD / card never in it (they are DOM); red dot visible to the user only |
| 7 | public or dev-only | **public** ("why not?") — liability: the recording is made and saved on the visitor's device, never touches the server; a notice in help + about; no upload path, ever (§2.6) |
| 8 | length | default: record freely, trim after |
| 9 | source of truth for news | default: `releases.json`, written at tag time; DECISIONS.md unchanged |
| 10 | granularity | default: three classes — `scene`, `engine`, `tuning`; all on `/whats-new`, only `scene` + `engine` go to social |
| 11 | backfill | **yes**, v0.6 → v0.29, to show the evolution; **not all at once** — a drip on an interval for steady traffic |
| 12 | approval | **the user calls out when work deserves a post** (usually right after a recording); the pipeline gathers everything since the last post |
| 13 | Reddit | r/internetisbeautiful, r/generative, r/fractals, r/creativecoding, r/dataisbeautiful — **rotate by fit**; posts link to retinarave.com (repo private) |
| 14 | Instagram | **copy-paste bundle** is fine |
| 15 | YouTube | **both** Shorts and full videos |
| 16 | other channels | **out** for now |
| 17 | captions | default: Claude-written in the project's voice, the user edits |
| 18 | cadence | **automatic channels: on qualifying deploy; manual channels: when the user says "use this recording"** |
| 19 | landing | **understanding what it is, so they feel safe sharing a tab: everything on device, no trackers, no ads, nothing — "I'm doing this because I like it, for myself, and wanted to share it"** |
| 20 | clip hosting | default: YouTube embeds + self-hosted poster |
| 21 | page shape | default: one `/whats-new` page, newest first, per-version anchors |
| 22 | browser | default: Chrome only |
| 23 | frame drops | **acceptable for now**, revisit if needed |
| 24 | one project or two | **two** (§0) |
| 2.1 | backfill clips | default: true historical renders from `releases/retinarave-vX.html` where the file still runs |
| 2.2 | drip | default: one backlog post every 3–4 days; a local cron drafts and holds; the user approves in the terminal — **everything local to this computer, no Slack** (3rd answer, 2026-10-02) |
| 2.3 | Reddit / YouTube credentials | **the user will provide them** → both post automatically on approval |
| 2.4 | tab-audio checkbox | default: documented in the help row and the landing's step 3 (already there) |
| 2.5 | landing message | default: one line on the card + detail on about + "New in vX" link beside it |
| 2.6 | new repo | default: `~/Documents/Kraftek/SocialMediaManager`, registered in the projects list and as a qmd collection |

Facts checked: `ffmpeg` is **not installed** on this machine (phase R installs it); `R` is unbound (`assets/core/hud.js:59-76`,
the key table of record is `assets/core/help.js:32-39`); every source already feeds one master GainNode `AU.bus`
(`assets/engine/audio.js:53-71`) — tab capture, mic, file, demo — so one `createMediaStreamDestination()` off the bus
carries the sound in every mode; the capture source is deliberately silent in the page (the other tab is audible) and the
recording is unaffected by that.

## 2. Phase R — the recorder (`R`)

### 2.1 Behaviour
`R` toggles. First press: a toast "recording", a red dot at the top-right of the HUD layer (DOM, never captured),
the clock starts. Second press: the recording stops, the file and its sidecar download, a toast "saved 42 s · retinarave-….webm".
`Esc` does not stop it (it closes help). Recording continues across scene changes, the director's cuts, fullscreen.
A tap target for phones is **not** in this phase (MediaRecorder on mobile Chrome is a different animal; OPEN-ITEMS).

### 2.2 Video
`canvas.captureStream(60)` on a **compositor canvas**, not the WebGL canvas: at the end of the engine's frame (a post-frame
hook in `engine.js`, a no-op unless `REC.on`) a 2D canvas of the same size does `drawImage(gl)` then the watermark text.
Why a compositor: (a) the WebGL canvas is drawn without `preserveDrawingBuffer`, and a same-frame copy after the draw is
the one safe moment to read it; (b) the watermark never enters the engine — same frames, same md5s, the harness
contract (CONTRACTS §0) holds with `REC.off`; (c) the watermark is DOM-free so it IS in the clip. Cost: one 1080p
`drawImage` per frame while recording, nothing otherwise. **Stop rule:** if the compositor halves the frame rate at
1080p on the user's machine, move the watermark into `post.js` as a textured quad behind a `REC` uniform and
`captureStream` the WebGL canvas directly.

Watermark: bottom-right, 14 px DIN-ish from the HUD's stack, `@retinarave · torus2 · v0.29`, white at 0.7 on a soft
shadow, the scene name live (it follows the director). Position and opacity are constants in `rec.js`, not a panel.

### 2.3 Audio
`AU.rec = ctx.createMediaStreamDestination()`; `AU.bus.connect(AU.rec)` once at engine start (a dead-end node, no cost
when nothing records). The recorder's stream = compositor video track + `AU.rec.stream`'s audio track. The analysers,
the muted gain and `ctx.destination` are untouched. File mode's shimmed analysers (`file.js:169-170`) do not matter
here: the bus is upstream of them.

### 2.4 Container, name, sidecar
`MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus', videoBitsPerSecond: 12e6 })`, fallback vp8. Chunks
every 2.5 s into memory (a 90 s clip at 12 Mb/s is ~135 MB — fine; a 10-minute set is 900 MB and still fine on a
desktop; a toast warns at 5 minutes). On stop: one Blob → `<a download>`. Name:
`retinarave-v0.29-torus2-2026-10-02T14-03-22.webm` (version, the scene at the START, the start stamp). Sidecar
`…json`, downloaded alongside:

```json
{ "app": "retinarave", "version": "0.29.0", "engineMd5": null,
  "started": "2026-10-02T14:03:22.418Z", "durationS": 42.3,
  "source": "capture|mic|file|demo", "track": "<file name if file mode, else null>",
  "size": [1920, 1080], "fps": 60,
  "scenes": [{ "t": 0, "id": 3, "name": "torus2" }, { "t": 18.2, "id": 1, "name": "dust" }],
  "flags": { "lead": true, "shade": true }, "ua": "<navigator.userAgent>" }
```

Two downloads per stop is one Chrome "allow multiple downloads" prompt the first time; acceptable (the alternative, a zip,
needs a library the bundle does not have). `url` flags: `&rec=0` hides the key (a kiosk), nothing else.

### 2.5 Public surface (help, landing, about)
`help.js` key table gets `['R', 'record what you see and hear to a file on this device — nothing is uploaded; the music you
capture is yours to clear', 'record']`, so the landing hint row shows `R record` for free. `about.html` gets a
"Recording" paragraph: on-device, no upload, the visitor is responsible for the rights to the music in their clip, and
the watermark. **No upload, share, or "send us your clip" affordance, ever** — that is the whole liability posture
(§1 row 7): Retina Rave is a screen recorder for its own canvas, not a distributor.

### 2.6 `tools/clip.js` (Node + ffmpeg, the user's machine only)
`node tools/clip.js <clip.webm> [--ss 4.0 --to 49.5] [--out dir]` →
`clip.mp4` (`-c:v libx264 -pix_fmt yuv420p -crf 18 -r 60 -c:a aac -b:a 192k -movflags +faststart`),
`clip-9x16.mp4` (`-vf crop=ih*9/16:ih`), `poster.jpg` (frame at `ss + 1 s`), and copies the sidecar to `meta.json` with
the trim applied to `durationS`, `scenes[].t` and a `trim: [ss, to]` field. It also moves everything into the contract
folder (§0). ffmpeg install is step 0 of the phase (`apt install ffmpeg` or a static build under `~/.local/bin`).

### 2.7 Deferred: the offline deterministic render
The harness already runs the engine on a 60 Hz frame clock from a file (`CLOCK=1`, `tools/cdp.js`) with bit-identical
md5s. A `tools/render.js` that writes PNG frames at that clock and muxes them with the track would give drop-free
clips in file mode only. Deferred on the user's word (frame drops acceptable); the sidecar's `scenes[]` and `started`
are enough to re-render the same stretch later if the taste changes.

### 2.8 Verification
- `CLOCK=1` harness run on the five tracks: md5 lists **identical** to v0.29 with the recorder idle (the engine did not move).
- `tools/test_rec.js`: the file name, the sidecar schema, the scene timeline from a scripted scene sequence (no browser).
- `HEADED=1` by hand: record 30 s in tab-capture mode, 30 s in file mode; the saved WebM plays in Chrome and VLC with
  sound; the watermark reads; `clip.js` produces the three outputs and ffprobe shows 60 fps, yuv420p, AAC.
- A clip recorded with `&shade=0` and one with the default, so the first post can show §82 if the user wants.

## 3. Phase W — `releases.json` and `/whats-new`

### 3.1 The file
`releases.json` at the repo root, newest first:

```json
{ "version": "0.29.0", "tag": "v0.29", "date": "2026-10-02", "class": "engine",
  "title": "Colour follows the chord",
  "body": "Major bars pull the palette warm, minor bars leave it alone. The tension field is now measured against the track itself, so a quiet intro and a wall of noise both use the whole range.",
  "scenes": [1, 3, 10], "decisions": ["§81", "§82"],
  "clip": { "youtube": null, "poster": "thumbs/whats-new/v0.29.jpg" } }
```

`class` ∈ `scene` (a new scene or a scene rebuilt), `engine` (a feature a viewer can see or hear), `tuning` (looks
retuned, thresholds moved). Only `scene` and `engine` qualify for social; all three show on the page. `body` is
written for a visitor, not for DECISIONS.md — no section numbers in it; `decisions` carries the pointer for the curious.

### 3.2 The tag ritual
Before `git tag`: the top entry's `version` equals `package.json`'s; `tools/check.js` enforces it (a release with no
entry fails `npm run check`). `clip.youtube` is filled in later by SocialMediaManager's post log — it writes the id back
into `releases.json` through a tiny `tools/releases.js set v0.29 clip.youtube <id>` so the page gains its embed on the
next deploy.

### 3.3 Backfill v0.6 → v0.29
One entry per tag, from DECISIONS.md's per-version sections and the `AUDIT-vX.md` files, in a visitor's words, class
assigned. 24 tags; expect a third to be `tuning`. A single sitting with Fable, then the user reads them once. For the
evolution series each `scene` / `engine` entry gets a historical clip: open `releases/retinarave-vX.html` headed with
the file source where it exists (v0.15+) or tab capture before that, and record with `tools/record-old.sh` (ffmpeg
`x11grab` + the PulseAudio monitor — the old pages have no `R`). Where an old file no longer runs, the entry says so and
uses the current engine's clip with a "then / now" note.

### 3.4 The page
`tools/whatsnew.js` renders `site/whats-new.html` from `releases.json` at `npm run build` (the build already copies
`site/.` into `dist/`), static, no JS required to read it: per version an anchor `#v0.29`, date, class badge, title,
body, the YouTube embed (lazy, click-to-load poster so the page carries no third-party script until clicked — the
"no trackers" promise from §4 must stay true on this page too), and the scene thumbnails from `site/thumbs/`.
`site/sitemap.xml` gains `/whats-new` (weekly); `about.html` links to it; `_headers` unchanged.

## 4. Phase L — the landing, for a first-time visitor

The user's answer to "what is the friction": understanding what it is, enough to feel safe sharing a browser tab. The
card today (`index.html:184-205`) leads with "I taught a computer to listen to music. This is what it sees." and goes
straight to the share steps. Add, between the sub line and the picker, one line in the user's voice:

> Everything runs on this device — no account, no trackers, no ads. I built this for myself and wanted to share it.

and beside it, from the top of `releases.json` at bundle time (`tools/bundle.js` inlines it, `main.js` does not fetch):

> New in v0.29: colour follows the chord → what's new

`about.html` gets the long form under "How it works and what it does not do": audio is analysed in the tab, nothing
leaves it; the share dialog is Chrome's own and the page only ever receives what the visitor ticks; no analytics, no
cookies, no accounts, no ads; the recording paragraph from §2.5; and a line on why. DOM only — the harness md5s cannot
move. **Verify** by reading the deployed page cold on a phone and a desktop, and by `curl -I` that no third-party
request leaves `/` and `/whats-new` before a click (the YouTube poster is self-hosted for exactly this reason).

## 5. Order, sizing, stop rules

| phase | why this order | size | stop rule |
|---|---|---|---|
| R recorder | the user wants it in hand first; every post needs a clip | 1 session build + 1 by-eye | compositor fps (§2.2); MediaRecorder refusing VP9 → VP8 |
| W releases + page | the posts' words; the backfill is the longest single sitting | 1 session code, 1 session backfill, 1 session historical clips | an old release that no longer runs → then/now note, move on |
| L landing | last because its "New in vX" line needs §3 | ½ session | none |

Tag as v0.30 after R (the recorder is user-visible); v0.31 after W + L. Deploy on the user's word, as always.
SocialMediaManager starts after R so its first real bundle exists (`docs/plans/SOCIAL-MANAGER-BRIEF.md`, §6).

## 6. Risks and open questions
- **Content ID.** Tab-captured commercial music on YouTube is muted or claimed; Reddit does not care. The user does not
  care for now (§1 row 3). SocialMediaManager flags it per draft; the user's own or licensed tracks avoid it.
- **Two downloads per stop** (§2.4) — one-time Chrome prompt. If it annoys, embed the sidecar as a WebM tag later.
- **Mobile `R`.** No key; the tbar could grow a ● button later. Not in this plan.
- **Cloudflare static assets**: 25 MiB per file — posters only are hosted here; clips live on YouTube.
- **Chrome only** for the recorder; Firefox's MediaRecorder on a 60 fps canvas stream is not promised.
- **r/dataisbeautiful** wants OC with a data + tool comment; most clips do not fit — SocialMediaManager's fit table decides.
