# Next session — Retina Rave v0.15: the engine update + CHLADNI (id 11, "slot 12") + the offline analysis they need (written 2026-09-27)

**This session is only this work.** The full spec is **`ENGINE-CHLADNI-SESSION-PROMPT.md`** — read it first and run it. v0.14 is tagged,
pushed and live; nothing else is on this session's list (other items: `docs/OPEN-ITEMS.md`, not for this session).

1. **Offline analysis (E0, first):** `tools/truth/trackmap.py` is the ground truth — SeeYouDrop measured at the user's grains 8, 5, 3, 2,
   1, 0.569, 0.224 s (`tools/truth/SeeYouDrop/grain-*.txt`, `SeeYouDrop.json`, the annotated `SeeYouDrop.sections.json`). Extend it
   (beat grid + downbeats, bar-synchronous sections, the tonic with the sub, beat-synchronous grains) and write `tools/truth/compare.py`,
   the engine-vs-truth ruler table. Run it on the other three tracks as needed (`--brief` or full).
2. **The engine update (E1–E5), strictly additive:** a file source with deterministic CLOCK=1 real-track runs (PCM-backed analyser
   shims), heard time + sub-frame event times, the ears stage (sub pitch / slides / purity / gate / register, clean kicks, felt pulse,
   low-pass, width), the whole-track map (`toDrop`, `buildProg`, exact drops), contracts. No existing MS value or scene pixel moves.
3. **The new scene CHLADNI (id 11, forced-only, `n` / `&scene=11`)**, tuned on `~/Music/RetinaRave/SeeYouDrop.flac`: sand on a plate
   driven by the sub's pitch; the nine SeeYouDrop windows in file mode are the acceptance.

**The user's rule: "wait for my say before running full sweep"** — no `tools/accept.sh`; the cheap proofs (check, node tests, parity fake,
one `scene-md5.sh` list, mixs) after every engine step. End by reporting the ruler table and the montages; no bid, tag or push until the
user's word.
