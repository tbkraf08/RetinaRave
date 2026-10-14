// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// §131 THE EARS' OWN THREAD: the whole causal DSP (sub, perc, tonic, texture, pulse and the §123 vocal net) running here
// instead of in the PCM listener on the main thread. All it is, is `EarsCore` (ears/core.js — the protocol) wired to this
// scope's port: blocks in, history frames and onsets out. Nothing in the ears graph touches the DOM, a clock or
// `Math.random`, which is the determinism contract that makes the move safe (CONTRACTS: node == page == Worker).
//
// TWO WAYS IN, ONE SOURCE. On the module page the host starts this file as a module Worker (`{ type: 'module' }`); in the
// single-file build there is no file to start, so `tools/bundle.js` inlines THIS graph — rewritten to its module table, the
// same machinery the page itself is built with — into `ears/wsrc.js`, and the host starts it as a classic Worker from a Blob
// URL. So the Worker runs from file:// and from the frozen release pages, and nothing is ever fetched at runtime.
import { EarsCore } from './core.js';

const core = new EarsCore((m, tr) => self.postMessage(m, tr));
self.onmessage = (e) => core.handle(e.data);
self.postMessage({ k: 'ready' });
