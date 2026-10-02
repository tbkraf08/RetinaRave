#!/usr/bin/env python3
"""Hear a truth grid: the track with a click on every truth beat -> tools/work/<name>-click[-everyN].wav

  python3 tools/truth/clicktrack.py <name> [--every=N] [--no-downbeat] [--drops] [--sections] [--from=S] [--to=S] [--gain=dB]

The only ruler that is the user's (NEXT-SESSION-PROMPT "Validating a truth grid"): a late grid is heard as a flam, a wrong bar
line as the accent on the wrong beat, a wrong drop as a click where nothing happens, a wrong OCTAVE as twice (or half) the
clicks the music nods to. Reads tools/truth/<name>.json (beats / downbeats / drops / sections / drops_user) and the stereo PCM
dump tools/work/<name>.48000.st.f32 (never regenerate that with `trackmap.py --pcm` on a track that has a truth dir).
  --every=N      click every Nth beat (2 = half time, 4 = quarter) - to hear which lattice the music actually nods to
  --no-downbeat  no accent on the downbeats (default: the first beat of each bar is a lower, louder click)
  --drops        a long low click on every truth drop (drops_user if present, else drops)
  --sections     a short high double-click on every section start
  --from/--to    render only this window (seconds) - a 30 s excerpt is enough to judge a phase
  --gain=dB      click level relative to the track's peak (default -6)
Clicks: beat 2 kHz 25 ms, downbeat 1 kHz 40 ms (+4 dB), drop 400 Hz 120 ms (+6 dB), section 3 kHz 2 x 15 ms. 16-bit stereo WAV.
"""
import json, os, sys, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
WORK = os.path.join(HERE, '..', 'work')
SR = 48000


def click(f, ms, sr=SR, decay=4.0):
    n = int(sr * ms / 1000)
    t = np.arange(n) / sr
    return np.sin(2 * np.pi * f * t) * np.exp(-decay * t / (ms / 1000)) * np.hanning(2 * n)[n:]


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not args:
        print(__doc__); sys.exit(1)
    name = args[0]
    opt = lambda k, d=None: next((a.split('=', 1)[1] for a in sys.argv if a.startswith('--' + k + '=')), d)
    every = int(opt('every', 1)); t_from = float(opt('from', 0)); t_to = opt('to'); gain_db = float(opt('gain', -6))
    tj = json.load(open(os.path.join(HERE, name + '.json')))
    pcm = os.path.join(WORK, f'{name}.{SR}.st.f32')
    if not os.path.exists(pcm):
        sys.exit(f'no {pcm} - make it once with: python3 tools/truth/trackmap.py {name} --pcm --sr={SR} (ONLY if {name} has no truth dir yet)')
    x = np.fromfile(pcm, dtype=np.float32).reshape(-1, 2)
    n = len(x); t1 = float(t_to) if t_to else n / SR
    i0, i1 = int(t_from * SR), min(n, int(t1 * SR))
    x = x[i0:i1].astype(np.float64)
    peak = np.abs(x).max() or 1.0
    g = peak * 10 ** (gain_db / 20)
    c = np.zeros(len(x))

    def put(t, burst, amp):
        i = int((t - t_from) * SR)
        if i < 0 or i >= len(c): return
        m = min(len(burst), len(c) - i)
        c[i:i + m] += amp * burst[:m]

    beats = tj.get('beats', [])
    downs = set(round(d, 4) for d in tj.get('downbeats', [])) if '--no-downbeat' not in sys.argv else set()
    cb, cd = click(2000, 25), click(1000, 40)
    nb = 0
    for k, b in enumerate(beats):
        if k % every or not (t_from <= b < t1): continue
        if round(b, 4) in downs: put(b, cd, g * 10 ** (4 / 20))
        else: put(b, cb, g)
        nb += 1
    nd = ns = 0
    if '--drops' in sys.argv:
        cdrop = click(400, 120, decay=3.0)
        for d in tj.get('drops_user') or tj.get('drops', []):
            put(d, cdrop, g * 10 ** (6 / 20)); nd += 1
    if '--sections' in sys.argv:
        cs = click(3000, 15)
        for s in tj.get('sections_hand') or tj.get('sections', []):
            t0 = s['t0'] if isinstance(s, dict) else s
            put(t0, cs, g); put(t0 + 0.06, cs, g); ns += 1
    y = x * 0.85 + c[:, None]
    y /= max(1.0, np.abs(y).max())
    tag = f'-every{every}' if every > 1 else ''
    out = os.path.join(WORK, f'{name}-click{tag}.wav')
    with wave.open(out, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((y * 32767).astype('<i2').tobytes())
    bpm = tj.get('bpm_grid', {}).get('bpm')
    bg = tj.get('bpm_grid', {})
    hand = tj.get('hand') or bg.get('hand') or tj.get('anchor') == 'hand'   # §72 wrote Malicious's hand under bpm_grid.hand
    prov = 'provisional' if tj.get('provisional') else ('hand' if hand else ('anchor' if bg.get('anchor') else 'tool (no anchor, no hand)'))
    print(f'{out}: {t_from:.1f}-{t1:.1f} s, {nb} clicks (every {every}; grid {bpm} BPM -> {bpm / every if bpm else "?"} heard), '
          f'{len(downs) and "downbeats accented" or "no downbeat accent"}, {nd} drops, {ns} sections; grid provenance: {prov}')


if __name__ == '__main__':
    main()
