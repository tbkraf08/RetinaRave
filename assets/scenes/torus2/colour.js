// TORUS2 — colour from the key (brief-torus2 spec 3; the user: the key colour is an ANCHOR, major warm, minor cool).
//
// The maths moved to `assets/math/keycolour.js` in v0.9 so POLYTOPE (id 5) could speak the same language without
// importing another scene's folder (CONTRACTS §0: shared code goes to assets/math/*). This file is the thin
// re-export it always was from index.js's point of view — `anchor` with TORUS2's own state, which is why the anchor
// is built with mkAnchor() here and not shared: two scenes easing one `hueU` would fight over it during a crossfade.
// Behaviour is bit-identical (the s3 f360/f840 md5s 7189a6ba… / 48113eda… are unmoved); the long explanation of the
// circle of fifths, the mode PULL and the keyConf gate lives in keycolour.js beside the code.
import { mkAnchor } from '../../math/keycolour.js';

export { WARM, COOL, PULL, SATMAJ, SATMIN, VALW, HUETC, KEYC0, KEYC1, wrap } from '../../math/keycolour.js';

const A = mkAnchor();
export const OUT = A.OUT;
export const reset = A.reset;
export const anchor = A.anchor;
