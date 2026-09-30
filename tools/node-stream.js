// The page's DETERMINISTIC file time base, in node (shared by tools/drums-node.js and tools/build-node.js). A track's
// decoded PCM (tools/work/<Track>.48000.st.f32, trackmap.py --pcm) is pushed in exact 512-sample blocks the way
// engine/sources/file.js does it under CLOCK=1: the analysers see the audio DET_LEAD before it is heard, so on each 1/60 s
// frame (heard = fr/60) every whole block up to heard + DET_LEAD is pushed, then the frame's reads run.
//   detStream(pcm, { pre(fr, heard), block(L, R, mono, t0), frame(fr, heard, dt, upto) })   (pre: optional, before the pushes)
// v3 in node: await makeV3(pcm) arms the engine's own extractor (features.js updateMusic) on the det analyser shims (engine/shim.js)
// over the downmix, exactly as file.js armDet does; v3.step(fr, heard, dt) seeks them and runs one frame. Returns MS.

export const DET_LEAD = 0.0427, FPS = 60, B = 512;
export const F0 = 2;                 // the page's first playhead frame (file.js DET_HOLD_FRAME + 1): the engine's `now` = (fr + F0)/60

export function detStream(pcm, { pre, block, frame }) {
  const sr = pcm.sr, mono = new Float32Array(B), bl = new Float32Array(B), br = new Float32Array(B);
  const nF = Math.floor((pcm.n / sr - DET_LEAD) * FPS) - 1;
  let s = 0;
  for (let fr = 1; fr <= nF; fr++) {
    const heard = fr / FPS, upto = Math.floor((heard + DET_LEAD) * sr);
    if (pre) pre(fr, heard);
    while (s + B <= upto && s + B <= pcm.n) {
      bl.set(pcm.L.subarray(s, s + B)); br.set(pcm.R.subarray(s, s + B));
      for (let i = 0; i < B; i++) mono[i] = 0.5 * (bl[i] + br[i]);
      block(bl, br, mono, s / sr);
      s += B;
    }
    frame(fr, heard, 1 / FPS, upto);
  }
  return nF;
}

// file.js seededRandom(DET_SEED): features-slow.js draws a section seed from Math.random; det mode pins it
function seededRandom(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export async function makeV3(pcm) {        // imported lazily: drums-node never loads the v3 engine
  const { makeAnalyser } = await import('../assets/engine/shim.js');
  const { AU } = await import('../assets/engine/audio.js');
  const { MS, updateMusic, setupBins } = await import('../assets/engine/features.js');
  const mono = new Float32Array(pcm.n);
  for (let i = 0; i < pcm.n; i++) mono[i] = (pcm.L[i] + pcm.R[i]) / 2;
  AU.ctx = { sampleRate: pcm.sr }; AU.mode = 'file';
  AU.fast = makeAnalyser(2048, 0); AU.slow = makeAnalyser(8192, 0.3);   // audio.js initAudio's two analysers
  AU.fast.setSource(mono, pcm.sr); AU.slow.setSource(mono, pcm.sr);
  setupBins(AU.ctx);
  Math.random = seededRandom(0x9e3779b9);
  return {
    MS,
    step(fr, heard, dt) {
      const end = Math.min(pcm.n, Math.round((heard + DET_LEAD) * pcm.sr));
      AU.fast.seek(end); AU.slow.seek(end);
      updateMusic(dt, (fr + F0) / FPS);
      return MS;
    },
  };
}
