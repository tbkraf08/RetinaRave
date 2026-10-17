#!/usr/bin/env python3
"""§68 — the OFFLINE kick truth: the 60-150 Hz band's RISE at the 16th-note grid, on all five tracks.

This is tools/work/v66/kick3.py's method (DECISIONS §66 Q1), generalised off each track's own truth beat list
instead of Vienna's hand grid, so the same quantity grades a whole track and the four controls:
  · a 4th-order 60-150 Hz Butterworth envelope (|x|, 5 ms box, 64-sample hop)
  · the 16th lines = every truth beat subdivided in 4
  · rise(line) = 20*log10(peak over [line-5, line+60] ms / mean over [line-85, line-5] ms)
  · a kick = rise >= RISE dB AND rise >= the rise at the lines either side (a local max over +-1 slot)
Keeping the GRID is what makes it a kick list rather than a list of the drone's wobbles: grid-free, Vienna's
60-150 Hz envelope has 5.5 local maxima /s clearing 4 dB against a groove of 2-3 kicks a bar.

    python3 tools/truth/kicktruth.py [Track ...] [--rise 4.0] [--sweep]
      -> tools/truth/<Track>.kick.json   { track, n, rise_db, t: [...], slots: [...], method }
"""
import json, os, sys
import numpy as np
from scipy.signal import butter, sosfiltfilt

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
HOP = 64

def load(track):
    p = os.path.join(ROOT, 'tools/work', f'{track}.48000.st.f32')
    meta = json.load(open(p + '.json'))
    x = np.fromfile(p, dtype='<f4').reshape(-1, meta['ch'])
    return meta['sr'], x.mean(axis=1).astype(np.float64)

def env(y, sr, lo, hi, sm=0.005):
    sos = butter(4, [lo / (sr / 2), hi / (sr / 2)], btype='band', output='sos')
    a = np.abs(sosfiltfilt(sos, y))
    n = max(1, int(sm * sr))
    return np.convolve(a, np.ones(n) / n, mode='same')[::HOP]

def grid16(beats):
    b = np.asarray(beats, float)
    out = []
    for i in range(len(b) - 1):
        d = (b[i + 1] - b[i]) / 4
        if not (0.05 < d < 0.6): continue      # a beat gap the subdivision would not survive
        for k in range(4): out.append((b[i] + k * d, k))
    return out

def rises(e, dte, lines):
    npre, ngap, npost = int(0.080 / dte), int(0.005 / dte), int(0.060 / dte)
    out = np.full(len(lines), np.nan)
    for i, L in enumerate(lines):
        j = int(L / dte)
        a = e[max(0, j - ngap - npre):max(1, j - ngap)]
        b = e[max(0, j - ngap):j + npost]
        if len(a) and len(b): out[i] = 20 * np.log10(b.max() / max(a.mean(), 1e-12))
    return out

def match(det, ref, tol):
    used = np.zeros(len(ref), bool); tp = 0; lags = []
    for d in det:
        j = -1; best = tol + 1
        for i, r in enumerate(ref):
            if used[i]: continue
            e = abs(d - r)
            if e <= tol and e < best: best = e; j = i
        if j >= 0: used[j] = True; tp += 1; lags.append(d - ref[j])
    return tp, np.array(lags if lags else [np.nan])

def build(track, RISE):
    sr, y = load(track)
    T = json.load(open(os.path.join(ROOT, 'tools/truth', f'{track}.json')))
    e = env(y, sr, 60, 150); dte = HOP / sr; dur = len(e) * dte
    g = [(L, k) for L, k in grid16(T['beats']) if 0.1 <= L <= dur - 0.1]
    L = np.array([x[0] for x in g]); sl = np.array([x[1] for x in g])
    r = rises(e, dte, L)
    keep = []
    for i in range(len(L)):
        if not np.isfinite(r[i]) or r[i] < RISE: continue
        nb = [r[j] for j in (i - 1, i + 1) if 0 <= j < len(L) and np.isfinite(r[j])]
        if all(r[i] >= x for x in nb): keep.append(i)
    return sr, dur, L[keep], sl[keep], r[keep], T

if __name__ == '__main__':
    a = sys.argv[1:]
    opt = lambda k, d: float(a[a.index(k) + 1]) if k in a else d
    RISE = opt('--rise', 4.0)
    tracks = [x for x in a if not x.startswith('--') and not x.replace('.', '').isdigit()] or \
        ['SeeYouDrop', 'CyborgNinja', 'WhoLikesToParty', 'Malicious', 'Vienna']
    # THE §66 REFERENCE LIST — where it comes from and how to remake it (DECISIONS §137 addendum; the user: "why not generate so
    # truth is there?"). `tools/work/v66/kick-ref-rise.json` is 60 times (s), THIS method on Vienna only, over 24-60 s, written by
    # `tools/work/v66/kick3.py` — §66 Q1's one-off, which runs the same 60-150 Hz rise at >= 4.0 dB with a local max over +-1 line,
    # but on a DEAD-FLAT 16th lattice (phase 0.0026 s, bar 8/3 s = Vienna's 90.000 BPM hand grid) over an audio slice trimmed to
    # 21-63 s, where this tool uses the DP `beats` list and the whole file. Those two differences are the whole 60-vs-57 gap below.
    # It is NOT hand-marked: no ear placed a hit (§68/§69 call it "hand-made" meaning built on Vienna's HAND GRID).
    # TO REGENERATE (gitignored, as the original):
    #     cp /home/toma/Archive/RetinaRave-work/v66/{lib.py,kick3.py} tools/work/v66/ && (cd tools/work/v66 && python3 kick3.py)
    # It writes kick-ref-rise.json (60 hits = 1.67 /s) and clap-ref-rise.json (72 = 2.00 /s), both spanning 24.0026-59.8359 s, and
    # 2026-10-17 it reproduced the 2026-09-30 originals BIT-IDENTICAL (md5 5e2f7125e02ba3726590996f7ea52780 / f060d5822243e628eaf426259f8258f3).
    # The Vienna column then prints `§66 24-60: 57/60 m55 P 0.96 R 0.92`, which is §68's own published row to the digit.
    # The load stays conditional (§137): the file is a gitignored one-off, and its absence costs the Vienna row one column, not the run.
    p66 = os.path.join(ROOT, 'tools/work/v66/kick-ref-rise.json')
    v66 = np.array(json.load(open(p66)), float) if os.path.exists(p66) else None
    for tr in tracks:
        for R in ([4, 5, 6, 7, 8, 9, 10] if '--sweep' in a else [RISE]):
            sr, dur, ks, sl, rs, T = build(tr, R)
            h = np.bincount(sl, minlength=4)
            line = f'{tr:16s} rise>={R:4.1f}  {len(ks):5d} = {len(ks)/dur:.2f} /s  p50 {np.median(rs):5.1f} dB  beat-slots {h}'
            for key in ('click', 'low'):
                ref = np.array(T['onsets'][key], float)
                tp, _ = match(ks, ref, 0.030)
                line += f'  {key}: P {tp/max(1,len(ks)):.2f} R {tp/max(1,len(ref)):.2f}'
            if tr == 'Vienna' and v66 is not None:
                mine = ks[(ks >= 23.9) & (ks <= 60.0)]
                tp, lg = match(mine, v66, 0.040)
                line += f'  | §66 24-60: {len(mine)}/{len(v66)} m{tp} P {tp/max(1,len(mine)):.2f} R {tp/max(1,len(v66)):.2f}'
            print(line)
            if '--sweep' in a: continue
            json.dump({'track': tr, 'n': int(len(ks)), 'rise_db': R, 'sr': sr,
                       'method': 'offline 60-150 Hz 4th-order Butterworth envelope (|x|, 5 ms box, 64-sample hop); '
                                 'rise = 20log10(peak[-5,+60] ms / mean[-85,-5] ms) at every 16th line of the truth '
                                 f'beat grid; a kick = rise >= {R} dB and a local max over +-1 line. '
                                 'DECISIONS §68 (tools/truth/kicktruth.py), the §66 Q1 method off the truth beats.',
                       't': [round(float(x), 4) for x in ks], 'slot': [int(x) for x in sl],
                       'rise': [round(float(x), 2) for x in rs]},
                      open(os.path.join(ROOT, 'tools/truth', f'{tr}.kick.json'), 'w'))
