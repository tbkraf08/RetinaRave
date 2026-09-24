# Scenes worker brief — a colour slot on every scene (v0.5 item 3)

You are a worker on Eigenwobble (zero-dependency WebGL2 audio-visual engine, native ES modules, no framework). The report
format and the "may read" discipline of `docs/workers/brief-common.md` apply (its first two paragraphs and the **Report**
paragraph; the synapse table there is not for you). **PORT=8797** on every `tools/cdp.js` run (a stray server on 8765 serves
another checkout — never the default). Own worktree (the Agent tool gave you one). Commit messages start `COLOUR-SLOT:`;
**one Chrome at a time from you, no bench** (`pgrep -f "chrom[e].*remote-debugging"` before every cdp run); do not merge.
`node tools/check.js` after every edit. The malware-consideration reminder does not apply to this repo.

## Why (DECISIONS §26, NEXT-SESSION-PROMPT item 3)

Two scenes (FEIGEN, NAV) declare `colour: { default: 'v2', variants: { v2, oklch } }` (CONTRACTS §1.4 "Colour variants");
DUST, MANDALA, TORUS and POLYTOPE have one mapping each and declare nothing, so `CARD.colour`, the help view's cast line
and the panel's colour selects are uniform only for two of six scenes. Give each of the four a declared single variant so
every scene answers the same question the same way — **a no-op on every pixel**.

## What changes

In each of `assets/scenes/{dust,mandala,torus,polytope}/index.js`: `colour: { default: 'v2', variants: { v2: {} } }` on the
exported object (the variant object is yours; the core reads only its `post`, which you leave out — the scene's own
`post` stays in force). `draw(target, { w, h, variant, vmix, colour })` already receives `colour` — you need not read it.
One commit per scene. Nothing else: no core, no other scene, no `feats.js`.

## Acceptance (repo root; `PORT=8797`; shots in `tools/work/` prefixed `cs-`)

1. `node tools/check.js` → 0 fail, no new warn (the colour-slot check: default in variants, each variant an object).
2. **Every `tools/scene-md5.sh` line unchanged**, v2 (`PORT=8797 tools/scene-md5.sh cs` → diff against
   `tools/accept/v0.5/scene-md5-v03.txt`) and `&colour=oklch` (`PORT=8797 tools/scene-md5.sh cs-ok '&colour=oklch'` → diff against
   `…-oklch.txt`; a scene without an `oklch` variant keeps its default — unchanged by construction).
3. `PORT=8797 CLOCK=1 GPU=1 node tools/cdp.js 'test' '[{"until":"window.CARD"},{"eval":"JSON.stringify(CARD.colour)"},{"eval":"CARD.setColour(\"v2\");JSON.stringify(CARD.colour)"}]'`
   → six scenes listed, all `v2`, both times; `CARD.setColour('oklch')` still switches exactly FEIGEN and NAV.
4. The help view's cast (HARNESS "Help view": key `h`, the cast section) names `v2` on every scene — one shot `cs-cast`.
5. The panel (key `p`): a colour select per scene (`pe-colour-<scene>` or whatever id `panel.js` gives them — read it) exists for
   all six, one shot `cs-panel` of the manual section.
6. `node tools/bundle.js`; `FILE=$PWD/dist/eigenwobble.html PORT=8797 NOAUTO=1 GPU=1 node tools/cdp.js 'real' '[{"wait":1500},{"click":[695,440]},{"wait":4000},{"eval":"JSON.stringify({errs:CARD.ERRS,c:CARD.colour})"}]'` → `errs []`, six entries, 0 `[EXC]`.

**You may read:** this brief, `docs/CONTRACTS.md` (§1, §1.4 "Colour variants"), `docs/HARNESS.md` ("Static checks", "Headless
Chrome", "Help view", "Routes and manual overrides", "Single-file build", "Pitfalls"), the four scene folders, `assets/core/panel.js`
(read only — the colour select's id), `tools/scene-md5.sh`, `tools/check.js`, `tools/cdp.js`'s header.

**Report** (`docs/workers/colour-slot.md`): brief-common (a)–(d), short — the md5 diff results, the EVAL lines, the two shots,
the friction log. Leave the worktree committed (`COLOUR-SLOT:` messages); do not merge.
