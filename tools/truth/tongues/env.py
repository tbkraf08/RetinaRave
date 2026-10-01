#!/usr/bin/env python3
"""The PCM beat clock's ONSET STRENGTH stream, offline, bit-for-bit in spirit.

Replicates assets/engine/clock/clock.js strength() exactly:
  NFFT 2048, HOP 512, Hann window (0.5 - 0.5 cos(2 pi i / n)), norm = 2 / sum(win),
  pkAll = max(pkAll * exp(-(HOP/sr)/40), max(mag), 1e-5),  g = 100 / pkAll,
  v[i] = log(1 + g * mag[i]),  d = v - vPrev,  flux = sum(d > 0) over bins 1..iT,
  bflux = the same over bins 1..iB,  f40 = the same over bins i40..iB,
  o = (flux + 3 * bflux) * 0.01,   s40 = f40 * 0.01
with binF = sr/NFFT = 23.4375 Hz at 48 kHz -> iB = 6 (150 Hz), iT = 420 (9843.75 Hz), i40 = 2 (40 Hz).

Frame k (k = 0, 1, ...) is the 2048 samples ENDING at sample (k+1)*512, zero-padded at the
start exactly as the engine's ring buffer is; its audio time is t_k = (k+1)*512/sr. Hop rate
93.75 Hz.

Input: tools/work/<T>.48000.st.f32 (interleaved stereo float32, 48 kHz) + its .json meta.
Mono is (L + R)/2 — the file source's downmix (assets/engine/sources/file.js:128).

    python3 tools/truth/tongues/env.py [Track ...]
writes tools/work/tongues/<T>.env.npz  { o, s40, smid, t, sr, hop }   (smid: the 150-2500 Hz flux, the §69 snare lane's band)
"""
import json
import os
import sys

import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
WORK = os.path.join(ROOT, 'tools', 'work')
OUT = os.path.join(WORK, 'tongues')
TRACKS = ['SeeYouDrop', 'Vienna', 'CyborgNinja', 'WhoLikesToParty', 'Malicious']

NFFT, HOP, BASS = 2048, 512, 3.0


def load_mono(track):
    p = os.path.join(WORK, f'{track}.48000.st.f32')
    meta = json.load(open(p + '.json'))
    sr, ch = int(meta['sr']), int(meta['ch'])
    x = np.fromfile(p, dtype=np.float32)
    if ch == 2:
        x = x[: (len(x) // 2) * 2].reshape(-1, 2)
        mono = (x[:, 0].astype(np.float64) + x[:, 1].astype(np.float64)) * 0.5
    else:
        mono = x.astype(np.float64)
    return mono, sr


def strength(mono, sr):
    """-> (o, s40, smid, t) at the 512 hop."""
    win = 0.5 - 0.5 * np.cos(2 * np.pi * np.arange(NFFT) / NFFT)
    norm = 2.0 / win.sum()
    binF = sr / NFFT
    iB = max(2, min(40, int(round(150.0 / binF))))
    iT = min(NFFT // 2 - 1, int(round(9843.75 / binF)))
    i40 = max(1, int(round(40.0 / binF)))
    iM0 = int(round(150.0 / binF)) + 1; iM1 = min(iT, int(round(2500.0 / binF)))   # smid: 150-2500 Hz, the §69 snare lane's band

    pad = np.concatenate([np.zeros(NFFT - HOP), mono])          # frame 0 ends at sample HOP
    nf = (len(mono) + HOP - 1) // HOP
    # frames: window k = pad[k*HOP : k*HOP + NFFT]
    nf = min(nf, (len(pad) - NFFT) // HOP + 1)
    idx = np.arange(NFFT)[None, :] + (np.arange(nf) * HOP)[:, None]
    frames = pad[idx] * win[None, :]
    spec = np.fft.rfft(frames, axis=1)
    mag = np.abs(spec[:, : NFFT // 2]) * norm                   # bins 0..1023, engine's `out`

    mx = mag.max(axis=1)
    decay = np.exp(-(HOP / sr) / 40.0)
    pk = np.empty(nf)
    cur = 1e-5
    for k in range(nf):                                        # the peak follower is sequential
        cur = max(cur * decay, mx[k], 1e-5)
        pk[k] = cur
    g = (100.0 / pk)[:, None]

    v = np.log1p(g * mag[:, 1 : iT + 1])                       # bins 1..iT
    d = np.diff(v, axis=0, prepend=np.zeros((1, v.shape[1])))   # prev[] starts at 0, as the engine's does
    np.maximum(d, 0.0, out=d)
    flux = d.sum(axis=1)
    bflux = d[:, : iB].sum(axis=1)                              # bins 1..iB
    f40 = d[:, i40 - 1 : iB].sum(axis=1)                        # bins i40..iB
    o = (flux + BASS * bflux) * 0.01
    s40 = f40 * 0.01
    smid = d[:, iM0 - 1 : iM1].sum(axis=1) * 0.01
    t = (np.arange(nf) + 1) * HOP / sr
    return o.astype(np.float32), s40.astype(np.float32), smid.astype(np.float32), t


def main(tracks):
    os.makedirs(OUT, exist_ok=True)
    for tr in tracks:
        dst = os.path.join(OUT, f'{tr}.env.npz')
        if os.path.exists(dst):
            print(f'{tr}: cached')
            continue
        mono, sr = load_mono(tr)
        o, s40, smid, t = strength(mono, sr)
        np.savez_compressed(dst, o=o, s40=s40, smid=smid, t=t.astype(np.float32), sr=sr, hop=HOP)
        print(f'{tr}: {len(o)} hops, {t[-1]:.2f} s, o p50 {np.median(o):.4f} p99 '
              f'{np.percentile(o, 99):.4f} max {o.max():.4f}')


if __name__ == '__main__':
    main(sys.argv[1:] or TRACKS)
