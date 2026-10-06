// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// Tab capture via getDisplayMedia + silence watchdog (demo takes over until real signal appears).
// Lifted from cardioid3 startCapture / watchCapture. Source interface: { name, start(), stop(), tick(nowMs) }.
import { AU, initAudio, run, stopAll } from '../audio.js';
import { startDemo } from './demo.js';

// §96: Firefox and Safari implement getDisplayMedia for video only — the audio constraint is ignored, no error, no track
// (Mozilla bug 1541425, open since 2019), and their share dialogs offer windows and screens, never a tab. There is no feature
// test for it (the constraint is silently dropped), so the user agent decides. The landing card hides the tab steps on these
// browsers (core/hud.js #landing.notab) and the microphone prompt's loopback device is the way to hear what the computer plays.
const UA = typeof navigator === 'undefined' ? '' : navigator.userAgent;
export const NO_TAB_AUDIO = /Firefox\//.test(UA) || (/Safari\//.test(UA) && !/Chrom(e|ium)\//.test(UA));
export const LOOPBACK = /Windows/.test(UA) ? '“Stereo Mix”' : /Mac OS X|Macintosh/.test(UA) ? 'a loopback device such as BlackHole' : '“Monitor of …”';
export const NO_TAB_MSG = 'This browser cannot share tab audio. Use the microphone and pick ' + LOOPBACK + ' in its prompt, or play a file from this device';

export async function startCapture() {
  initAudio();
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { width: 320, height: 180, frameRate: 5 },
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    AU.stream = stream;
    if (!stream.getAudioTracks().length) {
      stream.getTracks().forEach((t) => t.stop());
      run('demo', (NO_TAB_AUDIO ? NO_TAB_MSG : 'No audio track was shared') + ' — running the demo signal.');
      return;
    }
    const src = AU.ctx.createMediaStreamSource(stream);
    src.connect(AU.bus);
    AU.capAn = AU.ctx.createAnalyser();
    AU.capAn.fftSize = 512;
    src.connect(AU.capAn);
    AU.capBuf = new Float32Array(512);
    stream.getAudioTracks()[0].addEventListener('ended', stopAll);
    stream.getVideoTracks().forEach((t) => t.addEventListener('ended', stopAll));
    run('capture');
  } catch (e) {
    run('demo', (NO_TAB_AUDIO ? NO_TAB_MSG : 'Capture was declined') + ' — running the demo signal.');
  }
}

// Silent live source (capture or mic) -> demo takes over until real signal appears. now in ms (performance.now scale).
export function watchCapture(now) {
  if ((AU.mode !== 'capture' && AU.mode !== 'mic') || !AU.capAn) return;
  AU.capAn.getFloatTimeDomainData(AU.capBuf);
  let s = 0;
  for (let i = 0; i < 512; i++) s += AU.capBuf[i] * AU.capBuf[i];
  const live = Math.sqrt(s / 512) > 1e-4;
  if (live) {
    if (!AU.heard) {
      AU.heard = true;
      if (AU.demo) AU.demo.out.gain.setTargetAtTime(0, AU.ctx.currentTime, 0.3);
    }
  } else if (!AU.heard && now - AU.t0 > 6000 && (!AU.demo || AU.demo.out.gain.value === 0)) {
    startDemo();
  }
}

export default { name: 'capture', start: startCapture, stop: stopAll, tick: watchCapture };
