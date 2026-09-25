# Next session — Retina Rave after v0.9 (written 2026-09-25, at the v0.9 tag)

**v0.9 "the cage dances" is tagged and deployed (DECISIONS §41, `docs/AUDIT-v0.9.md`, `docs/workers/polytope-dance.md`):** POLYTOPE
(id 5) modified in place — three onset trains (bass / mid / high, hit ages in beats), the xy plane locked to `beatCount/16` and
the zw plane to `/32` with a spring nudge per hit, the 5 % thump, the timed inside-out sweep on phrase boundaries and drops,
beads of light travelling one edge per bar, the twelve-sector colour wheel on the circle of fifths lit by chroma. The user asked
for it and answered one question (in place, tag, deploy, no gate); **the user has not looked at the result yet.**

**First:** show the user `tools/accept/v0.9/montage-polytope.jpg` (before left · after right: house, aba, dnb at f360/f840 and the
two real tracks) and `dist/retinarave.html` key `6`; read them the AUDIT's "What the eye sees" and the ranked leans (§41). Their word
decides — a retune is a one-line constant at the top of `assets/scenes/polytope/{grooves,dance,colour,index}.js`, proven with
`IDS=5 tools/scene-md5.sh` (re-base `tools/accept/v0.9/scene-md5-v09.txt` s5 lines) + `tools/accept/v0.9/det9.py <track> <tag>` for
the trains. Next POLYTOPE idea, not built: cells-as-pitch-classes (lean 9's other branch, §41).

**Then, still ahead of everything else — the NAV2 question (v0.8, DECISIONS §39, `docs/AUDIT-v0.8.md`):** NAV2 is id 8, key `9`,
forced-only, not swapped in; the user has not looked. Show `tools/accept/v0.8/montage-nav2-real.jpg` (NAV left · NAV2 right) and
`dist/retinarave.html` key `9`; the AUDIT's "What the eye sees" and the ranked leans (`RHO_FREE` resting brightness first).
- **Approve →** the swap, one commit, `NAV2-SESSION-PROMPT.md` step 4 verbatim (NAV2 → id 0 / home / always / NAV's bid; NAV →
  `nav-v1` id 8 forced-only; DRUM stays nav-v1's variant, score 0; `tools/parity.js` `&scene=0` → `8` and `CARD.NAV || CARD.home` →
  `CARD.REG[8].scene.state`; mixs md5 re-based; scene-md5 lists with s0 ↔ s8 exchanged; `accept.sh` + HARNESS pointers;
  `site/about.html` NAV line; CONTRACTS §1.8), then the Q trace on house + aba (NAV2 is home, picked every phrase), `accept.sh`
  0 FAIL, a DECISIONS section, tag v0.10, push.
- **Retune →** the constants are named at the top of `assets/scenes/nav2/{nav2,detect}.js`; prove with `IDS=8 tools/scene-md5.sh`
  + `tools/accept/v0.8/det8.py <track> <tag>` (mp3s in a scratchpad `…/scratchpad/music/`).

Still open, unchanged: the Cloudflare dashboard steps (v0.6), TORUS2's leans, deleting `torus-v1`, the OKLCH variants, POLYTOPE's
portrait cropping (pre-existing, `polytope-dance.md` friction 15 — a look change the user has not asked for).
