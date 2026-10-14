// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// §131 A WEB-SHAPED WORKER SCOPE FOR NODE: the few globals `assets/engine/ears/worker.js` uses (`self.postMessage`,
// `self.onmessage`) over node's `worker_threads` port, so `tools/test_earsw.js` (v) can start the REAL Worker entry — the
// same file the page starts — and prove a block round-trips through it with the frames the in-process ears compute.
import { parentPort } from 'node:worker_threads';

globalThis.self = globalThis;
globalThis.postMessage = (m, tr) => parentPort.postMessage(m, tr && tr.length ? tr : undefined);
await import('../assets/engine/ears/worker.js');
parentPort.on('message', (m) => self.onmessage({ data: m }));
