// Microphone via getUserMedia (v0.6): the phone-at-the-speakers path, and a laptop mic at a gig. Same bus, same
// analyser tap and silence watchdog as capture.js (tick), so the demo takes over until real signal is heard.
// Source interface: { name, start(), stop(), tick(nowMs) }. No processing on the track: the extractor wants the room as it is.
import { AU, initAudio, run, stopAll } from '../audio.js';
import { watchCapture } from './capture.js';

export async function startMic() {
  initAudio();
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    run('demo', 'No microphone access in this browser — running the demo signal.');
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    AU.stream = stream;
    const src = AU.ctx.createMediaStreamSource(stream);
    src.connect(AU.bus);
    AU.capAn = AU.ctx.createAnalyser();
    AU.capAn.fftSize = 512;
    src.connect(AU.capAn);
    AU.capBuf = new Float32Array(512);
    stream.getAudioTracks()[0].addEventListener('ended', stopAll);
    AU.ctx.resume && AU.ctx.resume(); // iOS: the context may still be suspended until this user gesture's turn
    run('mic');
  } catch (e) {
    run('demo', 'Microphone was declined — running the demo signal.');
  }
}

export default { name: 'mic', start: startMic, stop: stopAll, tick: watchCapture };
