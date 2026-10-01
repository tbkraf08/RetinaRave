#!/usr/bin/env python3
"""The REACTIVE drum ruler (2026-09-28, after the user's look: "the reactive still looks better (ie. seems like it moves in
sync with the music better)"): how well each reactive drum channel follows the drums, per track, on a live-path trace
(`&map=0`). numpy only; the matcher is compare.py's.

    python3 tools/truth/drumcheck.py <trace.json> [<trace.json> ...] [--tol 0.03] [--src syn,ears,v2]

Sources (each graded when its columns are in the trace):
  syn    synapse's levels `kick` / `snare` / `hat` (what TORUS2, DUST, MANDALA read today): a hit = the level's rising edge
         (compare.py riseframes, thr 0.18, jump 0.06), on its first frame
  ears   the causal ears' `kickEvt` / `snareEvt` / `hatEvt`, on their first frame
  v2     `kick2` / `snare2` / `hat2` levels (the reactive v2), rising edges like syn
Truth (tools/truth/<track>.json onsets): kick vs `low` (40-150 Hz: kicks AND 808 note starts — what the eye sees move on a
bass-heavy track) and vs `click` (kicks with a beater); snare vs `mid`; hat vs `high`. Per source and class: n, P, R, F within
+-tol and the median / p90 lag of the matched hits (+ = late, heard time).

A FOURTH kick reference, when tools/truth/<track>.kick.json exists (DECISIONS §68, built by tools/truth/kicktruth.py):
`kick` is the OFFLINE 60-150 Hz rise at the truth beat grid's 16th lines. It exists because `low` is itself a 40-150 Hz
level picker and on a track whose low end is a continuous 38-46 Hz 808 drone (Vienna) that band IS the drone: `low` lists
475 onsets = 2.46 /s where the groove has 1.74 kicks /s, and §66 proved the front end that made it cannot see the thud.
The reference is validated where `click` is trustworthy — it reproduces CyborgNinja's `click` at P 0.99 / R 0.89 and
§66's own Vienna hand-grid list at P 0.96 / R 0.92.

A FOURTH SNARE reference, when tools/truth/<track>.snare.json exists (DECISIONS §69, tools/truth/snaretruth.py):
`snare` is the OFFLINE 150-800 Hz rise at the same 16th grid. It exists for the same reason: `mid` is a 150-2500 Hz
MEDIAN-residual flux list, and on Vienna it reads 201 onsets = 1.04 /s where §66's hand-built rim/clap list reads
2.0 /s. Validated against that hand list at P 1.00 / R 0.97 (lag +0 ms) and against CyborgNinja's `mid` at P 0.97.
"""
import json, os, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from compare import match, evframes, riseframes  # noqa: E402

SRC = {'syn': ('kick', 'snare', 'hat', 'rise'), 'ears': ('kickEvt', 'snareEvt', 'hatEvt', 'evt'), 'v2': ('kick2', 'snare2', 'hat2', 'rise')}
REFS = (('kick', 0, 'low'), ('kick', 0, 'click'), ('kick', 0, 'kick'),
        ('snare', 1, 'mid'), ('snare', 1, 'snare'), ('hat', 2, 'high'))

def frames(tr, col, kind):
    c = tr['cols'].get(col)
    if c is None: return None
    c = c[:len(tr['t'])]                     # a capture trace's columns may run a few frames past its time axis
    return evframes(c) if kind == 'evt' else riseframes(c)

def grade(tr, tol, srcs):
    T = json.load(open(os.path.join(HERE, f"{tr['track']}.json")))
    ons = dict(T['onsets'])
    kp = os.path.join(HERE, f"{tr['track']}.kick.json")       # §68's offline 60-150 Hz rise reference, when built
    if os.path.exists(kp): ons['kick'] = json.load(open(kp))['t']
    sp = os.path.join(HERE, f"{tr['track']}.snare.json")      # §69's offline 150-800 Hz rise reference, when built
    if os.path.exists(sp): ons['snare'] = json.load(open(sp))['t']
    tb = np.array(tr['t'], float); t0, t1 = tb[0], tb[-1]
    rows = []
    for name, ci, key in REFS:
        if key not in ons: continue
        ref = np.array(ons[key], float); ref = ref[(ref >= t0) & (ref <= t1)]
        for s in srcs:
            fr = frames(tr, SRC[s][ci], SRC[s][3])
            if fr is None: continue
            d = tb[fr]; pairs, miss, extra = match(d, ref, tol)
            tp = len(pairs); P = tp / max(1, len(d)); R = tp / max(1, len(ref)); F = 2 * P * R / max(1e-9, P + R)
            lag = np.array([a - b for a, b in pairs]) * 1000 if pairs else np.array([np.nan])
            rows.append((f'{name} vs {key}', s, len(d), len(ref), P, R, F, np.median(lag), np.percentile(lag, 90)))
    return rows

if __name__ == '__main__':
    a = sys.argv[1:]
    if not a: print(__doc__); sys.exit(2)
    opt = lambda k, d=None: a[a.index(k) + 1] if k in a else d
    tol = float(opt('--tol', 0.03)); srcs = opt('--src', 'syn,ears,v2').split(',')
    paths = [x for i, x in enumerate(a) if not x.startswith('--') and (i == 0 or not a[i - 1].startswith('--'))]
    for p in paths:
        tr = json.load(open(p))
        print(f"== {tr['track']} ({tr.get('mode')}, {tr['t'][0]:.0f}-{tr['t'][-1]:.0f} s, tol +-{1000 * tol:.0f} ms)")
        for r in grade(tr, tol, srcs):
            print(f'  {r[0]:15s} {r[1]:5s} n {r[2]:4d} / truth {r[3]:4d}   P {r[4]:.2f}  R {r[5]:.2f}  F {r[6]:.2f}   lag med {r[7]:+4.0f} p90 {r[8]:+4.0f} ms')
