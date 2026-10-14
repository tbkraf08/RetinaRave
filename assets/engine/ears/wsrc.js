// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// §131 THE EARS WORKER'S INLINE SOURCE — empty here, and filled by `tools/bundle.js` when it builds the single-file page:
// the bundler rewrites `assets/engine/ears/worker.js`'s module graph into its own module table (the same transform the page
// itself gets) and writes it in as this string. Empty means "there is a file to start": the module page hands the Worker the
// URL `assets/engine/ears/worker.js` and the browser loads the graph. Non-empty means there is no file — the bundle is one
// HTML document and may fetch nothing at runtime (the landing's on-device promise) — so the host wraps this string in a Blob
// and starts a classic Worker from it. One source of truth either way: the string is generated from these same modules at
// build time, never maintained beside them.
export const EARS_WORKER_SRC = '';
