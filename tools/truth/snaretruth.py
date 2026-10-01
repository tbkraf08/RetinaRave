#!/usr/bin/env python3
"""§69 — the OFFLINE snare / rim truth: the 150-800 Hz band's RISE at the 16th-note grid, on all five tracks.

tools/truth/kicktruth.py's method (DECISIONS §68) on the MID band, so the same quantity grades the snare lane
that graded the low one:
  · a 4th-order 150-800 Hz Butterworth envelope (|x|, 5 ms box, 64-sample hop)
  · the 16th lines = every truth beat subdivided in 4
  · rise(line) = 20*log10(peak over [line-5, line+60] ms / mean over [line-85, line-5] ms)
  · a snare = rise >= RISE dB AND rise >= the rise at the lines either side (a local max over +-1 slot)

WHY A FOURTH REFERENCE FOR THE SNARE. The truth's `mid` is a 150-2500 Hz HPSS-percussive flux list at a 3 dB
threshold (trackmap.py), and it is a MEDIAN-residual flux picker — the same family as the engine's, and §64 showed
that family's blindness: a median lags a swell, and a one-hop flux sees only part of a rise that spans two hops.
On Vienna `mid` lists 201 onsets = 1.04 /s where §66's own hand-built rim/clap reference reads 2.0 /s over
24-60 s, so the control under-counts the backbeat it is supposed to grade. Keeping the GRID is what makes this a
hit list rather than a list of the pad's swells.

THE BAND IS 150-800, swept (150-600 / 150-800 / 150-1200 / 150-2500 / 200-800) against the one hand-made list
there is: §66's `tools/work/v66/clap-ref-rise.json` (72 rim / clap hits on Vienna's beats 2 and 4, 24-60 s).
150-800 at 4.0 dB reproduces it at **P 1.00 / R 0.97 (70 of 72) at lag +0 ms** — 150-600 reads 0.87 / 0.81 and
150-2500 0.98 / 0.90 — and it lists 1.83 hits/s on Vienna against §66's own measured 1.81 /s. The floor plateaus
at 3.0-4.0 dB (R 0.97 both) and breaks at 5.0 (R 0.67), so 4.0 is the top of the plateau, as it is for the kick.
Validated where the control is trustworthy: it reproduces CyborgNinja's `mid` at **P 0.97** and
WhoLikesToParty's at **P 0.81**.

Like the kick reference this is a MID-BAND TRANSIENT list, not a snare-only one: a kick's 150-800 Hz body is a
rise at a grid line too, exactly as `mid` and the engine's own `snareEvt` ("a 150-2500 Hz flux peak") count it.

    python3 tools/truth/snaretruth.py [Track ...] [--rise 4.0] [--lo 150] [--hi 800] [--sweep]
      -> tools/truth/<Track>.snare.json   { track, n, rise_db, band, t: [...], slot: [...], rise: [...], method }
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
        if not (0.05 < d < 0.6):      # a beat gap the subdivision would not survive
            continue
        for k in range(4):
            out.append((b[i] + k * d, k))
    return out


def rises(e, dte, lines):
    npre, ngap, npost = int(0.080 / dte), int(0.005 / dte), int(0.060 / dte)
    out = np.full(len(lines), np.nan)
    for i, L in enumerate(lines):
        j = int(L / dte)
        a = e[max(0, j - ngap - npre):max(1, j - ngap)]
        b = e[max(0, j - ngap):j + npost]
        if len(a) and len(b):
            out[i] = 20 * np.log10(b.max() / max(a.mean(), 1e-12))
    return out


def match(det, ref, tol):
    used = np.zeros(len(ref), bool); tp = 0; lags = []
    for d in det:
        j = -1; best = tol + 1
        for i, r in enumerate(ref):
            if used[i]:
                continue
            e = abs(d - r)
            if e <= tol and e < best:
                best = e; j = i
        if j >= 0:
            used[j] = True; tp += 1; lags.append(d - ref[j])
    return tp, np.array(lags if lags else [np.nan])


def build(track, RISE, LO, HI):
    sr, y = load(track)
    T = json.load(open(os.path.join(ROOT, 'tools/truth', f'{track}.json')))
    e = env(y, sr, LO, HI); dte = HOP / sr; dur = len(e) * dte
    g = [(L, k) for L, k in grid16(T['beats']) if 0.1 <= L <= dur - 0.1]
    L = np.array([x[0] for x in g]); sl = np.array([x[1] for x in g])
    r = rises(e, dte, L)
    keep = []
    for i in range(len(L)):
        if not np.isfinite(r[i]) or r[i] < RISE:
            continue
        nb = [r[j] for j in (i - 1, i + 1) if 0 <= j < len(L) and np.isfinite(r[j])]
        if all(r[i] >= x for x in nb):
            keep.append(i)
    return sr, dur, L[keep], sl[keep], r[keep], T


if __name__ == '__main__':
    a = sys.argv[1:]
    opt = lambda k, d: float(a[a.index(k) + 1]) if k in a else d
    RISE, LO, HI = opt('--rise', 4.0), int(opt('--lo', 150)), int(opt('--hi', 800))
    tracks = [x for x in a if not x.startswith('--') and not x.replace('.', '').isdigit()] or \
        ['SeeYouDrop', 'CyborgNinja', 'WhoLikesToParty', 'Malicious', 'Vienna']
    v66 = np.array(json.load(open(os.path.join(ROOT, 'tools/work/v66/clap-ref-rise.json'))), float)
    for tr in tracks:
        for R in ([3, 3.5, 4, 4.5, 5, 6] if '--sweep' in a else [RISE]):
            sr, dur, ks, sl, rs, T = build(tr, R, LO, HI)
            h = np.bincount(sl, minlength=4)
            line = f'{tr:16s} {LO}-{HI} rise>={R:4.1f}  {len(ks):5d} = {len(ks)/dur:.2f} /s  p50 {np.median(rs):5.1f} dB  beat-slots {h}'
            for key in ('mid', 'click'):
                ref = np.array(T['onsets'][key], float)
                tp, _ = match(ks, ref, 0.030)
                line += f'  {key}: P {tp/max(1,len(ks)):.2f} R {tp/max(1,len(ref)):.2f}'
            if tr == 'Vienna':
                mine = ks[(ks >= 23.9) & (ks <= 60.0)]
                tp, lg = match(mine, v66, 0.040)
                line += f'  | §66 24-60: {len(mine)}/{len(v66)} m{tp} P {tp/max(1,len(mine)):.2f} R {tp/max(1,len(v66)):.2f}'
            print(line)
            if '--sweep' in a:
                continue
            json.dump({'track': tr, 'n': int(len(ks)), 'rise_db': R, 'band': [LO, HI], 'sr': sr,
                       'method': f'offline {LO}-{HI} Hz 4th-order Butterworth envelope (|x|, 5 ms box, 64-sample hop); '
                                 'rise = 20log10(peak[-5,+60] ms / mean[-85,-5] ms) at every 16th line of the truth '
                                 f'beat grid; a snare = rise >= {R} dB and a local max over +-1 line. '
                                 'DECISIONS §69 (tools/truth/snaretruth.py), the §68 kick-truth method on the mid band.',
                       't': [round(float(x), 4) for x in ks], 'slot': [int(x) for x in sl],
                       'rise': [round(float(x), 2) for x in rs]},
                      open(os.path.join(ROOT, 'tools/truth', f'{tr}.snare.json'), 'w'))
