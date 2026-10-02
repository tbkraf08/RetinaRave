# SocialMediaManager — project brief (2026-10-02)

Seed for a NEW repo at `~/Documents/Kraftek/SocialMediaManager` (prod-eng mode; register in `~/.claude/projects-list.md`
and as qmd collection `smm`). Copy this file there as `docs/BRIEF.md` and run `/gsd:new-project` from it. The Retina
Rave half, and the contract this project consumes, is `RetinaRave/docs/plans/SOCIAL-PLAN.md` §0. **STATUS: PLANNED.**

## 1. Purpose
Turn a brand's release notes and recorded clips into posts, on a schedule, with the user's approval, across Reddit,
YouTube (automatic) and Instagram (copy-paste bundle). First brand: Retina Rave. The code knows nothing about
visualizers; a second brand is another folder under `brands/`.

## 2. Inputs (per brand, `brands/retinarave/brand.json`)
```json
{ "name": "retinarave", "site": "https://retinarave.com",
  "releases": "~/Documents/Kraftek/RetinaRave/releases.json",
  "clips": "~/Documents/Kraftek/RetinaRave/tools/work/clips",
  "handles": { "instagram": "@retinarave", "youtube": "@retinarave", "reddit": "<user>" },
  "voice": "brands/retinarave/VOICE.md",
  "subreddits": "brands/retinarave/subreddits.json",
  "lastPost": "2026-10-02T00:00:00Z" }
```
A clip folder (`clip.mp4`, `clip-9x16.mp4`, `poster.jpg`, `meta.json`) plus the `releases.json` entries newer than
`lastPost` are one **post candidate**. `meta.json` names the scenes, version, source and length; `releases.json` says
what changed and whether it qualifies (`class` is `scene` or `engine`).

## 3. Trigger modes
1. **"Use this recording"** — the user says so (usually right after pressing `R`). `smm draft retinarave --clip <dir>`
   gathers every qualifying release since `lastPost`, writes a draft.
2. **Qualifying deploy** — a `post-deploy` hook in RetinaRave (or the cron's tick noticing a new top entry in
   `releases.json` with `class` ≠ `tuning`) runs the same draft with the newest clip whose `version` matches.
3. **Backlog drip** — the evolution series (v0.6 → v0.29, historical clips). `smm queue` holds them in order; the cron
   `smm tick` (daily) drafts the next one when 3–4 days have passed since the last post and leaves it waiting.

Nothing posts without `smm approve <id>`. **Everything is local to this computer — no Slack, no remote service in the
loop** (the user, 2026-10-02). Approval surface: the terminal. `smm queue` lists what is waiting; `smm show <id>` prints
the draft's text per platform and opens `poster.jpg` and the clip with the system viewer; `smm edit <id>` opens
`draft.json` in `$EDITOR`; `smm approve <id>` posts; `smm skip <id>` drops it. The cron's tick writes a one-line
"a draft is waiting" marker that the next Claude Code session in either repo prints on start (a SessionStart hook
reading `queue/WAITING`), and a desktop notification via `notify-send` if the user wants one.

## 4. The draft (`queue/<id>/`)
`draft.json`: candidate (clip dir, release entries), per-platform text, targets, status (`drafted | approved | posted |
skipped`), permalinks after posting. Text is written by Claude (`claude-fable-5-1`, the `claude-api` skill before
touching the SDK) from the release entries, `meta.json` and `VOICE.md`; the user edits in place. Per platform:

| platform | artefact | notes |
|---|---|---|
| Reddit | title ≤ 300 chars, one target subreddit, body or link, OC flair where it exists | video post where the sub allows native video, else a link post to the YouTube upload or to retinarave.com/whats-new#vX |
| YouTube | title, description (site link, what's new, scenes), tags; Shorts when `clip-9x16.mp4` and ≤ 60 s, full video otherwise — the user wants **both**, so a draft may carry two uploads | privacy `public` on approve |
| Instagram | `bundle/`: `clip-9x16.mp4`, `caption.txt` (caption + hashtags), `poster.jpg` | copied to a phone-reachable folder (Syncthing / Drive); the user posts by hand. Graph API only if a Facebook Page ever exists |

## 5. Subreddit rotation (`brands/retinarave/subreddits.json`)
The user's five: r/internetisbeautiful, r/generative, r/fractals, r/creativecoding, r/dataisbeautiful. Each entry
carries a **fit rule** and the sub's posting rules, checked at build time and refreshed when a post is removed:

| sub | fits | form |
|---|---|---|
| r/internetisbeautiful | the site itself; a `scene` release; at most once per few months (self-promo and repost rules are strict) | link post to retinarave.com |
| r/generative | any `scene` clip | video or YouTube link |
| r/creativecoding | `engine` releases with a how-it-works line; the recorder itself | video + a comment with the method |
| r/fractals | nav, nav2, mandala, feigen, gielis clips | video |
| r/dataisbeautiful | only a post that IS a visualisation of data with a source + tool comment — rarely fits; the drafter proposes it only for analysis posts | OC flair + required comment |

The drafter picks the best-fit sub not used in the last N posts and never the same sub twice in a row.

## 6. Credentials (`.env`, never committed; the user provides)
- Reddit: a **script** app → `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USERNAME`, `REDDIT_PASSWORD`, a
  descriptive user agent. Free tier, personal use.
- YouTube Data API v3: a Google Cloud project, OAuth desktop client JSON, one-time consent → refresh token stored in
  `.env`. Quota 10 000 units/day; an upload is 1 600 — six uploads a day is the ceiling, plenty.
- Anthropic: `ANTHROPIC_API_KEY` for the drafter.
- Instagram: none (bundle).

## 7. Phases
1. **Skeleton + drafter + bundles** — `smm draft / approve / queue`, Claude captions, Instagram bundle, post log.
   Reddit and YouTube drafts are produced but "posting" writes the would-be payload to disk. Testable with no credentials.
2. **Reddit + YouTube clients** — OAuth, upload, Shorts detection, permalinks back into `draft.json`, and
   `tools/releases.js set` writing the YouTube id back into RetinaRave's `releases.json` (SOCIAL-PLAN §3.2).
3. **Scheduler** — `smm tick` on a plain local cron, the backlog drip, the `queue/WAITING` marker + `notify-send`.
4. **Later** — metrics (upvotes, views) into the log; a second brand; Instagram Graph API if a Page appears.

Phase 1 can start as soon as RetinaRave's recorder (SOCIAL-PLAN §2) has produced one real bundle.

## 8. Open
- Each sub's current rules at build time (r/internetisbeautiful's in particular); a removed post is a learning entry, not a retry.
- Content ID on tab-captured music: the drafter warns on YouTube drafts whose `meta.json.source` is `capture` or `mic`.
- Reddit native video via the API is unreliable; stage 2 may settle on link posts to YouTube for video.
