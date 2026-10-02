# v83 — the BAR line. Fold the ears' kick / snare lanes (drums-node.js trace, heard time) and the truth tool's own
# onset lists on the grid's BAR (4 beats): which of the four beats carries the heaviest kick, which carry the snare.
# Beat-of-bar = (nearest truth beat index - the index of the downbeat at or before it) mod 4, 0 = the grid's beat 1.
# Also the zero-phase 40-150 Hz energy at each beat of the bar (the tool's own downbeat rule) from the 48 kHz PCM.
#   python3 tools/work/v83/barfold.py <Track> [<trace.json>]
import json, os, sys, numpy as np
from scipy.signal import butter, filtfilt
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
T = sys.argv[1]; tp = sys.argv[2] if len(sys.argv) > 2 else f'{ROOT}/tools/work/v83/drums/node-{T}.json'
tr = json.load(open(f'{ROOT}/tools/truth/{T}.json'))
b = np.array(tr['beats'], float); db = np.array(tr['downbeats'], float); P = float(np.median(np.diff(b)))
dbi = np.searchsorted(b, db - 1e-4)
def bob(times, frac=0.25):
    """-> beat-of-bar (0..3) of each time within frac*P of a beat, else -1; and the offset ms."""
    i = np.clip(np.searchsorted(b, times), 1, len(b) - 1)
    d0 = times - b[i - 1]; d1 = times - b[i]
    k = np.where(np.abs(d0) < np.abs(d1), i - 1, i); o = times - b[k]
    j = np.searchsorted(dbi, k, side='right') - 1
    ph = np.where(j >= 0, (k - dbi[np.clip(j, 0, len(dbi) - 1)]) % 4, -1)
    ph = np.where(np.abs(o) <= frac * P, ph, -1)
    return ph, o * 1e3
print(f"{T}: {len(b)} beats, {len(db)} downbeats, downbeat_mod4 {tr['bpm_grid'].get('downbeat_mod4')}, P {P:.4f} s; beat-of-bar 0 = the grid's beat 1")
print(f"{'source':26}{'n':>6}   beat1   beat2   beat3   beat4   (share of hits %, then vel-weighted share %)   heaviest / backbeat?")
rows = {}
def row(name, times, vel=None):
    ph, _ = bob(times); m = ph >= 0
    if m.sum() == 0: print(f"{name:26}{0:6d}   (none)"); return
    c = np.bincount(ph[m], minlength=4) / m.sum() * 100
    w = (np.bincount(ph[m], weights=(vel[m] if vel is not None else np.ones(m.sum())), minlength=4)); w = w / w.sum() * 100
    rows[name] = (c, w)
    print(f"{name:26}{int(m.sum()):6d}   " + ' '.join(f"{v:5.1f}" for v in c) + "   | " + ' '.join(f"{v:5.1f}" for v in w)
          + f"   heaviest beat {int(np.argmax(w)) + 1}; top two {sorted(np.argsort(w)[-2:] + 1).__str__()}")
d = json.load(open(tp)); t = np.array(d['t'], float); c = d['cols']
for lane, col, vc in (('ears kick', 'kickEvt', 'kickVel'), ('ears snare', 'snareEvt', 'snareVel'), ('ears hat', 'hatEvt', 'hatVel'), ('ears low (60-150 rise)', 'lowEvt', 'lowVel')):
    if col not in c: continue
    ev = np.array(c[col], float) > 0.5; v = np.array(c[vc], float) if vc in c else None
    row(lane, t[ev], v[ev] if v is not None else None)
for k in ('low', 'click', 'mid', 'high'):
    row(f'tool onsets {k}', np.array(tr['onsets'][k], float))
# the zero-phase 40-150 Hz energy at each beat of the bar, the tool's own downbeat rule, grid-free except for the lines
m = json.load(open(f'{ROOT}/tools/work/{T}.48000.st.f32.json')); sr = m['sr']
x = np.fromfile(f'{ROOT}/tools/work/{T}.48000.st.f32', dtype=np.float32).reshape(-1, 2).mean(1).astype(np.float64)
for nm, lo, hi in (('40-150', 40, 150), ('150-800', 150, 800), ('5-12k', 5000, 12000)):
    bb, aa = butter(2, [lo / (sr / 2), hi / (sr / 2)], btype='band'); y = filtfilt(bb, aa, x)
    b2, a2 = butter(2, 30 / (sr / 2)); e = np.maximum(filtfilt(b2, a2, np.abs(y)), 0)
    pos = np.maximum(np.diff(e, prepend=e[0]), 0)      # the positive rise only (an attack, not a sustain)
    acc = np.zeros(4); n = np.zeros(4)
    for k, gb in enumerate(b):
        j = np.searchsorted(dbi, k, side='right') - 1
        if j < 0: continue
        ph = (k - dbi[j]) % 4; i0, i1 = int((gb - 0.05) * sr), int((gb + 0.05) * sr)
        if i0 < 0 or i1 > len(pos): continue
        acc[ph] += pos[i0:i1].sum(); n[ph] += 1
    s = acc / np.maximum(n, 1); s = s / s.sum() * 100
    print(f"{'rise ' + nm + ' Hz':26}{int(n.sum()):6d}   " + ' '.join(f"{v:5.1f}" for v in s) + f"   heaviest beat {int(np.argmax(s)) + 1}")
