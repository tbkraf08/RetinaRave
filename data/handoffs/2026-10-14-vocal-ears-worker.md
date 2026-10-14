# Handoff — the vocal detector through §131 (2026-10-14, written before a CLI restart to switch to Fable)

## Where things stand
Main at `5bd57e8` (clean, 27 commits ahead of `origin/main` at `66129a3`, **nothing pushed, the site still serves v0.38**).
Local tag `v0.39` at `3592a32`, now **1 commit behind main** (§131 landed after it) — re-point or cut v0.40 on the user's word.
`~/.claude/settings.json` model pin changed opus → **fable** (backup `/tmp/settings.json.bak`); the restart is only to clear the
CLI's stale usage-limit state (the user's account shows 100 % of the weekly limit free).

## Shipped and validated
- **v0.38 LIVE 2026-10-12 12:30 EDT** (`73f848c`): §122–§124, the vocal detector's three steps.
- §126 the CNN's second pass (run 2 ships: Comptine unseen fp 1.4 %, ruler 8–11×, lag 120 ms; Jamendo F1 .795 and ≤ 100 ms lag MISSED).
- §127 the vocal lane on TORUS2 + DUST through `assets/math/vox.js` (knee .45→.85); §128 the proof; `941dd7a` the TORUS2 reframe fix.
- §130 the governor's load hold (file-mode q@10 s .27 → .67) + no CNN while the lane feeds + a bit-identical pruned FFT.
- §131 the ears in a bundled-inline Worker: live ears .03 ms/frame (was .27–.34), 0 of 330 md5 lines moved, `&ears=main` A/B.
- **The user's eye: scenes 1 / 3 / 4 "look good" (2026-10-13).** The §131 A/B has NOT been eyed yet.

## Next, in the user's order
1. The §131 A/B at home: `http://127.0.0.1:8765/#test&track=IBelongHere&scene=4&vox=live` vs the same `&ears=main`
   (HUD says `ears worker` / `ears main`; the dev server runs from main on 8765 — start with `node tools/serve.js 8765`).
2. Tag: re-point v0.39 or cut v0.40 (the §125 pitfall: never `releases.js save()`, hand-insert the entry).
3. **CNN plan session 3** (`docs/plans/VOX-CNN2-PLAN.md` §3): the causal TCN or a GRU head + a pitch head trained on the stems'
   pYIN — it owns the remaining lag (raw+hold 80–90 ms), the Jamendo F1 ceiling and SeeYouDrop's 9 % semitone agreement.
4. Smaller: `&scene=` + the scene switches working without `#test` in the hash; the recall cost of the clean weights
   (IBelongHere 54 % sung live vs the lane's 68 %); scenes B (NAV2 hue, MANDALA ring) only if asked.

## Pitfalls paid this session (do not re-pay)
- `&scene=`, `&t2vox=0`, `&dvox=0` apply **only** with `#test&` in the hash; `&vox=`, `&voxk=`, `&ears=` work anywhere.
- A "wait until load < 2" never fires: this machine's idle floor is ~2.5.
- `pkill -f 'tools/serve.js …'` from a shell whose own command line holds the pattern kills the shell (exit 144) — pgrep by
  bracketed pattern, kill by pid, in separate calls.
- `releases.js save()` reformats all entries; `tools/cdp.js` JSON.parses argv[3], so a bare `\d` in an eval string throws.
- Demucs stems, the Jamendo set (`~/Datasets/jamendo-svd/`), MusicNet and MAESTRO are on disk; `tools/work/vox/` holds every run's artefacts.
