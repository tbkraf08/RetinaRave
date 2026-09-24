// The page hash, parsed once (leaf module: harness.js re-exports it; panel.js reads TEST without importing the harness —
// help.js → panel.js → harness.js → help.js would be a cycle the bundler cannot order).
export const HASH = new URLSearchParams(location.hash.slice(1));
export const TEST = HASH.has('test');
