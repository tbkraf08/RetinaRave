# Next session — Retina Rave v0.15: the user's look at CHLADNI and the ears, then the full sweep on their word (written 2026-09-27)

**State:** v0.15 is **tagged and live** (2026-09-27; the user watched CHLADNI in stream mode: "looks good"). Still not run: `tools/accept.sh`. Built this session
(`ENGINE-CHLADNI-SESSION-PROMPT.md`, DECISIONS §48 + addenda, `docs/AUDIT-v0.15.md` §1–§3): the file source with deterministic
real-track runs (`#test&track=SeeYouDrop&at=<s>` under `CLOCK=1`, `tools/filetrace.js`, HARNESS "File source"), heard time +
the PCM bus, the ears (`engine/ears/`), the track map (`engine/map/`), `tools/truth/compare.py`, CONTRACTS §1.18 sync rules, and
**CHLADNI at id 11** (forced-only: `n` or `&scene=11`). Nothing existing moved (parity fake 0, ids 0–10 md5 = v0.14, mixs
641f6633). **`tools/accept.sh` has NOT been run — the user: "wait for my say before running full sweep".**

1. **Ask the user what next.** They have looked at CHLADNI in stream mode; not yet on SeeYouDrop (a real window: `node tools/serve.js`, `#track=SeeYouDrop&scene=11`,
   or the landing card's "play a file") and at the montages `tools/accept/v0.15/ch-win1…9-*.jpg`. Their first sentence
   outranks every lean. Known open items to raise, not to fix unasked:
   - the drop's figure is hidden ~0.15 s under the composite's global flash + glitch bars (a per-scene flash weight in
     CONTRACTS §1.4 would fix it — a core change, so it needs the sweep);
   - slides read on only 4 of 13 truth slides (an engine field from the map's slide list would fix it);
   - the walk's figure switches land 50–240 ms after the note (the causal sub's YIN window).
2. **On the user's word:** `GPU=1 tools/accept.sh` (the full sweep the v0.15 engine diff calls for), then the bid / tag / push
   only if they ask.
3. Not measured this session: capture-mode lag (`&sync=` exists; HARNESS "File source" has the recipe), CyborgNinja /
   WhoLikesToParty in file mode on CHLADNI.
Everything else waits in `docs/OPEN-ITEMS.md`.
