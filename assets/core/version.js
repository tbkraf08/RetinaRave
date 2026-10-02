// The page's version: the ONE source the recorder reads (core/rec.js — the watermark `@retinarave · <scene> · v0.29`, the
// file name `retinarave-v0.29-<scene>-<stamp>.webm`, the sidecar's `version`). Nothing else in the page carried a version
// before the recorder (the tag step wrote package.json and named releases/retinarave-vX.html by hand), so the tag step is
// now: package.json AND this line, together — tools/test_rec.js fails when the two differ. A leaf module (no imports).
export const VER = '0.29.0';
