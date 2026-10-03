// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// The page hash, parsed once (leaf module: harness.js re-exports it; panel.js reads TEST without importing the harness —
// help.js → panel.js → harness.js → help.js would be a cycle the bundler cannot order).
export const HASH = new URLSearchParams(location.hash.slice(1));
export const TEST = HASH.has('test');
