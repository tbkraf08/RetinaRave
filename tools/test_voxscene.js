// The vocal lane on the scenes (DECISIONS §127; docs/plans/VOX-SCENES-PLAN.md): the shared gate `assets/math/vox.js`, and
// the reads TORUS2 (id 4) and DUST (id 3) build on it. Every claim here is the plan's: the defaults (voxS 0 / voxHz −1 /
// voxConf 0 — the fake timeline's) are a NO-OP to the number; a sung note at full presence lights exactly what the plan says,
// at the plan's height and hue; the light is MOVED, never added; the switch (`&t2vox=0` / `&dvox=0`) = the defaults.
//   node tools/test_voxscene.js
import { VOXK, hueOf, mkVox, vox } from '../assets/math/vox.js';
import { hueOf as hueOfKey } from '../assets/math/vox.js';
import { sstep } from '../assets/math/util.js';
import { T2VOX } from '../assets/scenes/torus2/voice.js';

let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL ' + m); } else console.log('  ok   ' + m); };
const DT = 1 / 60;
const near = (a, b, e = 1e-9) => Math.abs(a - b) < e;
const defaults = (o = {}) => Object.assign({ voxS: 0, voxHz: -1, voxConf: 0, key: 0, mode: 0 }, o);

console.log('1. the gate (math/vox.js)');
{ // the defaults: the no-op, exactly, on every frame
  const st = mkVox(); let same = true;
  for (let i = 0; i < 600; i++) { vox(st, DT, defaults()); if (st.w !== 0 || st.pc !== -1 || st.y01 !== -1 || st.hz !== -1) same = false; }
  ok(same && st.hue === hueOf(0, 0), 'defaults (0 / −1 / 0) → w 0, pc −1, y01 −1, the key\'s hue, on 600 frames');
}
{ // a sung A4 at full presence in C major: w 1, pc 9, deg 9, the rig's height
  const st = mkVox();
  for (let i = 0; i < 120; i++) vox(st, DT, defaults({ voxS: 1, voxHz: 440, voxConf: 0.9 }));
  const y = (1 - VOXK.OCT) * 9 / 11 + VOXK.OCT * Math.log2(440 / 110) / 4;
  ok(st.w === 1 && st.pc === 9 && st.deg === 9 && near(st.y01, y, 1e-6) && near(st.hue, hueOf(9, 0)), `A4 at voxS 1 → w 1, pc 9, deg 9, y01 ${st.y01.toFixed(4)} (= ${y.toFixed(4)}), the note's hue`);
}
{ // the knee: the live tier's own gates sit under it — voxS .3 and .45 light nothing, .65 half, .85 and above everything
  const w = (s) => { const st = mkVox(); vox(st, DT, defaults({ voxS: s, voxConf: 0.5 })); return st.w; };
  ok(w(0.3) === 0 && w(0.45) === 0 && near(w(0.65), 0.5) && w(0.85) === 1 && w(1) === 1 && w(0.65) === sstep(VOXK.LO, VOXK.HI, 0.65), `the knee ${VOXK.LO} → ${VOXK.HI}: w(.3) 0 · w(.45) 0 · w(.65) ${w(0.65).toFixed(3)} · w(.85) 1`);
}
{ // no rise ease, a .3 s release
  const st = mkVox();
  vox(st, DT, defaults({ voxS: 1, voxConf: 0.5 }));
  const w0 = st.w;
  let n = 0; while (st.w > 0 && n < 600) { vox(st, DT, defaults({ voxS: 0, voxConf: 0.5 })); n++; }
  ok(w0 === 1 && n > 0.3 * 60 && n < 2.5 * 60, `rise in one frame (w ${w0}); the release reaches 0 after ${n} frames (${(n / 60).toFixed(2)} s, τ ${VOXK.REL})`);
}
{ // the hold: a pitch class colours nothing until it has held HOLD s; a flicker between classes never colours
  const st = mkVox();
  let before = 0;
  for (let i = 0; i < 60; i++) { vox(st, DT, defaults({ voxS: 1, voxHz: i % 2 ? 440 : 523.25, voxConf: 0.5 })); if (st.pc >= 0) before++; }
  const st2 = mkVox(); let firstOn = -1;
  for (let i = 0; i < 60; i++) { vox(st2, DT, defaults({ voxS: 1, voxHz: 440, voxConf: 0.5 })); if (st2.pc >= 0 && firstOn < 0) firstOn = i; }
  ok(before === 0 && firstOn >= Math.floor(VOXK.HOLD * 60) && firstOn <= Math.ceil(VOXK.HOLD * 60) + 1, `a flicker A4 / C5 colours nothing (${before} frames); a held A4 colours from frame ${firstOn} (HOLD ${VOXK.HOLD} s)`);
}
{ // the hold through a consonant, the reset after the voice
  const st = mkVox();
  for (let i = 0; i < 30; i++) vox(st, DT, defaults({ voxS: 1, voxHz: 440, voxConf: 0.5 }));
  const y = st.y01;
  for (let i = 0; i < 10; i++) vox(st, DT, defaults({ voxS: 1, voxHz: -1, voxConf: 0.5 }));
  const heldPc = st.pc, heldY = st.y01;
  for (let i = 0; i < 120; i++) vox(st, DT, defaults({ voxS: 0, voxHz: -1, voxConf: 0.5 }));
  ok(heldPc === 9 && heldY === y && st.w === 0 && st.pc === -1 && st.y01 === -1, 'a voiced frame with no pitch HOLDS pc 9 and the height; after the voice both reset (pc −1, y01 −1)');
}
{ // the height glides (TAU), the first note starts AT its height
  const st = mkVox();
  for (let i = 0; i < 30; i++) vox(st, DT, defaults({ voxS: 1, voxHz: 261.63, voxConf: 0.5 }));   // C4: deg 0
  const y0 = st.y01;
  const ys = [];
  for (let i = 0; i < 120; i++) { vox(st, DT, defaults({ voxS: 1, voxHz: 493.88, voxConf: 0.5 })); ys.push(st.y01); }   // B4: deg 11
  const yT = (1 - VOXK.OCT) * 1 + VOXK.OCT * Math.log2(493.88 / 110) / 4;
  const maxStep = Math.max(...ys.map((v, i) => Math.abs(v - (i ? ys[i - 1] : y0))));
  ok(near(y0, VOXK.OCT * Math.log2(261.63 / 110) / 4, 1e-6) && near(ys[119], yT, 0.02) && maxStep < 0.06, `C4 starts at its height ${y0.toFixed(3)}; B4 glides to ${ys[119].toFixed(3)} (target ${yT.toFixed(3)}), the largest step ${maxStep.toFixed(4)} (τ ${VOXK.TAU})`);
}
{ // voxConf is the switch, not a weight: a periodic piano at voxConf .9 and voxS .2 lights nothing; voxConf 0 with voxS 1 lights nothing
  const a = mkVox(), b = mkVox();
  for (let i = 0; i < 60; i++) { vox(a, DT, defaults({ voxS: 0.2, voxHz: 300, voxConf: 0.9 })); vox(b, DT, defaults({ voxS: 1, voxHz: 440, voxConf: 0 })); }
  ok(a.w === 0 && a.pc === -1 && b.w === 0 && b.pc === -1, 'voxS .2 at voxConf .9 → nothing (the knee, not the confidence); voxS 1 at voxConf 0 → nothing (no read at all)');
}
{ // the hue: the key's until a note holds; the note's then; minor pulls cool
  const st = mkVox();
  vox(st, DT, defaults({ key: 7, mode: 1 }));
  const keyHue = st.hue;
  for (let i = 0; i < 30; i++) vox(st, DT, defaults({ key: 7, mode: 1, voxS: 1, voxHz: 440, voxConf: 0.5 }));
  ok(keyHue === hueOfKey(7, 1) && st.hue === hueOf(9, 1) && st.deg === 2, 'G minor: the key\'s hue before the voice, the sung A\'s hue (deg 2) after');
}

// ---- the scenes: a stub ctx (no GL), update() driven at 60 Hz on a steady synthetic groove; one module instance per run (the
// query string makes node load a fresh copy of the scene's own state — test_nav2's two-instance trick), the shared gate's
// state reset by 60 frames of the defaults at the end of every run (voxConf 0 = the exact reset), so runs compare to the byte.
const CTX = () => ({ Q: { q: 0.95 }, onResize() {}, mkProg() { return { u: () => null, p: 1 }; }, lines: { VS: '', FS: '', mk() { return {}; }, set() {}, draw() {} }, gl: {}, tier: () => 3, budget: () => 1000, mkTarget: () => ({}), tex() {}, use() {}, tri() {}, engineTex: {} });
const LOOK = { mood: { hue: 0.1, sat: 0.7, bri: 0.8, spread: 0.5, invert: 0, angular: 0 } };
const GROOVE = { rot: 0 };
function msAt(i, v) {
  const t = i / 60, beat = t * 2;   // 120 bpm
  const chroma = new Float32Array(12); chroma[0] = 0.8; chroma[4] = 0.5; chroma[7] = 0.6; chroma[2] = 0.2;
  return Object.assign({ chroma, harmAngle: 0.3, interval: 7, harmUnw: 0.2 * t, beatPhase: beat % 1, beatCount: Math.floor(beat), bass: 0.3, sub: 0.2, tension: 0.3,
    dropEvt: false, dropEnv: 0, bpm: 120, presence: 0.8, flow: t, flowBass: t, flowMid: t, flowHigh: t, barPos: (beat / 4) % 4, surpriseEvt: false, sectionEvt: false,
    roll: 0, riser: 0, intensity: 0.6, arc: 'sustain', sectionAlt: 1, build: 0.2, arousal: 0.5, phrase16Pos: (beat / 16) % 1, key: 0, mode: 0, keyConf: 0.8, valence: 0.5,
    modeShade: 0, kick2: 0, snare2: 0, snareEvt: false, snareAmp: 0, hat2: 0, beat: false, alive: 1, novelty: 0.2, hush: 0, calm: 0, clarity: 0.5, regularity: 0.5,
    tongueAmbig: 0, tongueOn: -1, dropLiveEvt: false, voxS: 0, voxHz: -1, voxConf: 0,
    // DUST's reads
    bassS: 0.3, midS: 0.3, highS: 0.2, lvl: 0.7, kickAge: 9, kickEvt: false, snareAge: 9, hatAge: 9, hatEvt: false, subNoteEvt: false, subGate: 1, buildLive: 0, nextDropIn: 99,
    tongue21: 0, tongue41: 0, eM: 0.8, eS: 0.5, loudRel: 0.5, loudRange: 0.5, loudAbs: -1, denK: 2, sectionReturn: 0, barReturnEvt: false, barNovelEvt: false, punchy: 0.5 }, v || {});
}
let inst = 0;
async function runScene(file, n, voiceOf, before) {
  const sc = (await import('../assets/scenes/' + file + '/index.js?i=' + (inst++))).default;
  sc.init(CTX());
  if (before) before(sc);
  const out = [];
  for (let i = 0; i < n + 60; i++) {
    const MS = msAt(i, i < n ? voiceOf(i) : null);
    const params = {}; for (const k in sc.params) params[k] = sc.params[k].from(MS);
    sc.update(DT, MS, GROOVE, LOOK, { params });
    if (i < n) out.push(sc.hooks.info ? JSON.parse(sc.hooks.info()) : sc.hooks.dinfo());
  }
  return out;
}
const A4 = { voxS: 1, voxHz: 440, voxConf: 0.5 };

console.log('2. TORUS2 (id 4): the knot strand becomes the voice');
{
  const N = 240;
  const base = await runScene('torus2', N, () => null);
  const off = await runScene('torus2', N, () => null, () => T2VOX.on = 0); T2VOX.on = 1;
  const offV = await runScene('torus2', N, () => A4, () => T2VOX.on = 0); T2VOX.on = 1;
  const sung = await runScene('torus2', N, () => A4);
  const piano = await runScene('torus2', N, () => ({ voxS: 0.35, voxHz: 330, voxConf: 0.9 }));
  const knot = (r) => JSON.stringify([r.knotTh, r.knotBri, r.knotHue, r.ch, r.briMax, r.loudest]);
  ok(base.every((r) => r.vox.w === 0 && r.vox.pc === -1), 'the defaults (voxConf 0): w 0, pc −1 on every frame');
  ok(base.every((r, i) => knot(r) === knot(off[i])), 'the defaults = the switch off (&t2vox=0), the knot\'s five numbers to the byte on ' + N + ' frames');
  ok(offV.every((r, i) => knot(r) === knot(off[i]) && r.vox.w === 0), 'the switch off with a sung A4 = the defaults: &t2vox=0 is today\'s bytes on a voiced track');
  ok(piano.every((r, i) => knot(r) === knot(base[i]) && r.vox.w === 0), 'a piano\'s false voice (voxS .35, periodic, voxConf .9) stays under the knee: = the defaults to the byte');
  const last = sung[N - 1], b = base[N - 1];
  const TH0 = 0.12, THS = Math.PI / 2 - TH0, y = (1 - VOXK.OCT) * 9 / 11 + VOXK.OCT * Math.log2(440 / 110) / 4;
  const thV = TH0 + THS * (T2VOX.LAT0 + T2VOX.LAT1 * y);
  ok(last.vox.w === 1 && last.vox.pc === 9 && near(last.vox.y01, y, 1e-4), `a sung A4: w 1, pc 9, y01 ${last.vox.y01} (${y.toFixed(4)})`);
  ok(near(last.knotHue, 9 / 12 - 0.5 + T2VOX.HUE, 1e-6) && near(last.knotBri, b.knotBri * (1 + T2VOX.BRI), 1e-6), `the strand's hue the sung note's slot (${last.knotHue}), its brightness × ${1 + T2VOX.BRI} (${last.knotBri} vs ${b.knotBri})`);
  const subP = 0.25 * 0.2 + 0.03 * Math.sin(Math.PI * 2 * msAt(N - 1).barPos / 4);   // index.js's own: the sub fattens, the bar breathes
  ok(near(last.knotTh, Math.min(thV * (1 + subP), 1.55), 1e-6) && last.knotTh !== b.knotTh, `the strand's latitude is the sung pitch's: ${last.knotTh} = min((TH0 + THS·(.35 + .5·y01))·(1 + subP), 1.55) (the loudest family's ${b.knotTh} before)`);
  ok(last.ch[9] === 1 && last.ch.every((c, k) => k === 9 || c === b.ch[k]) && last.briMax === b.briMax && last.loudest === b.loudest, 'the sung class\'s ring (A, family 9) is lit to 1; the other eleven keep their chroma; briMax and the loudest family unchanged (the glow floor stands)');
  ok(sung.slice(0, 6).every((r) => r.vox.w === 1 && r.vox.pc === -1 && r.knotHue === base[0].knotHue), 'the hue waits for the hold (the first ~5 frames: w 1, pc −1, the strand\'s own hue)');
}

console.log(fails ? 'FAIL ' + fails : 'OK');
process.exit(fails ? 1 : 0);
