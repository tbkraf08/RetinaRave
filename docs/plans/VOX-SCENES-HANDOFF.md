# VOX-SCENES handoff — session A′ (2026-10-12, branch `vox-scenes-a`, DECISIONS §127)

Built and committed: `math/vox.js` (the shared gate) + TORUS2 (the strand) + DUST (the partials + the ribbon), the tests
(`tools/test_voxscene.js`, 27 ok, in `npm test`), the ruler (`tools/vox-gate-ruler.js`), the receipts under `tools/accept/v0.38/`
(the fake smoke, the gate ruler, the four real-md5 lists), §127. No director change; FLUID and the rig untouched. Not tagged, not
pushed, not deployed.

**Left (an hour at most, after the user's eye or before — none of it changes a picture):**
1. **The bench** — `tools/cdp.js` crashed at module import under the bench harness's invocation (the eval string that embeds
   `CARD.REG[id].scene.hud()` and a regex is the suspect; the same driver ran 258 md5 runs on this tree today). Re-run per HARNESS
   "Bench protocol": `#test&scene=3` / `4`, q pinned .95, 8 s settle, one cold call discarded, three pairs `bench(id,300)` /
   `bench(2,300)`, switch on vs `&dvox=0` / `&t2vox=0`; then the same on `#test&track=IBelongHere&at=60` (the lane feeds the voice) —
   add the medians to §127's bench bullet.
2. **After VOX-CNN2 lands:** re-shoot the live (`&map=0`) lines of s3 / s4 (`MODES=0 SCENES="3 4" tools/real-md5.sh`) and re-run
   `tools/vox-gate-ruler.js` — the Comptine-live lit share is the number to beat (27.3 % lit / 15.0 % hued at the default knee).
3. **The eye** (the user): the URLs in §127's last bullet; `&voxk=lo,hi` for the knee A/B.
4. **The 11 stale s3 lines of v0.37** (listed in `real-md5-s127-s3.txt`'s header): a finding for the next release's re-base.
