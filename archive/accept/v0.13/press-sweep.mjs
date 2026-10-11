// press sweep: a kick on every beat with the bass on pitch class 5 (1/2) — what rho the press reaches, the trough between
// kicks, the angle error at the press, then the silence's rebound. usage: node sweep.mjs <bpm>
import scene from '../../../assets/scenes/nav2/index.js';
import { N2, resetNav2, updateNav2, RHO_REST, NOTE_ANG } from '../../../assets/scenes/nav2/nav2.js';
import { resetDet, updateDet, DET } from '../../../assets/scenes/nav2/detect.js';
import { measure, resetGreen, G } from '../../../assets/scenes/nav2/green.js';
const bpm = +process.argv[2] || 150, dt = 1 / 60;
const S = { presence: 1, bass: 0.5, mid: 0.4, high: 0.3, hit: 0, hitStrength: 0, beat: false, beatPhase: 0, beatCount: 0, bpm,
  eS: 0.9, eM: 0.6, build: 0, tension: 0.3, arc: 'sustain', dropEvt: false, dropStrength: 0, dropEnv: 0, resolveEvt: false,
  fakeoutEvt: false, flow: 0, centroid: 0.5, riser: 0, hp: 0, roll: 0, onsetRate: 2, flux: 0.2, hush: 0, kick: 0,
  dropExpectedIn: -1, seed: { th: 0.3 }, peaks: [], bchroma: new Float32Array(12) };
resetNav2(); resetDet(); resetGreen();
const pp = {};
let rhoMax = 0, trough = 1, angErr = 9, qMax = 1, qMinS = 1, tr = [], qMinB = 1, qMaxB = 0, lastKick = 0;
for (let f = 1; f <= 45 * 60; f++) {
  const t = f * dt, beat = t < 30;
  S.centroid = 0.5 + 0.1 * Math.sin(2 * Math.PI * t / 8);
  S.flow += dt;
  S.beatPhase += dt * bpm / 60;
  if (S.beatPhase >= 1) { S.beatPhase -= 1; S.beatCount++; }
  S.beat = beat && S.beatPhase < dt * bpm / 60;
  S.kick = S.beat ? 1 : S.kick * Math.exp(-dt / 0.16);
  S.eS = beat ? 0.9 : 0.2;
  S.bchroma.fill(0); S.bchroma[5] = beat ? 0.8 : 0;
  for (const k in scene.params) pp[k] = scene.params[k].from(S);
  updateDet(dt, S, pp);
  updateNav2(dt, t, S, { P: pp, isLogical: true });
  measure(N2.c[0], N2.c[1], dt);
  if (beat && t > 10 && N2.mode === 'INT') {
    rhoMax = Math.max(rhoMax, N2.rho); qMax = Math.max(qMax, N2.q);
    qMinB = Math.min(qMinB, G.Q); qMaxB = Math.max(qMaxB, G.Q);
    if (S.beat) { if (lastKick) tr.push(trough); trough = 1; lastKick = t; } else trough = Math.min(trough, N2.rho);
    if (N2.cyc.has && N2.rho > 0.9) { const a = N2.cyc.arg / (2 * Math.PI); const d = Math.abs(((a - NOTE_ANG[5]) % 1 + 1.5) % 1 - 0.5); angErr = Math.min(angErr, d); }
  }
  if (t > 40) qMinS = Math.min(qMinS, G.Q);
}
tr.sort((a, b) => a - b);
console.log(`bpm ${bpm}  rhoMax ${rhoMax.toFixed(3)}  trough med ${tr[tr.length >> 1].toFixed(3)}  Q beat ${qMinB.toFixed(3)}..${qMaxB.toFixed(3)}  angErr ${angErr.toFixed(4)}  qMax ${qMax}  silence Q ${qMinS.toFixed(3)} rho ${N2.rho.toFixed(3)}`);
