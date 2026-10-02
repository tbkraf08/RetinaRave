#!/usr/bin/env python3
"""v85 — Vienna A/B renders for the user's ear (2026-10-02): the truth grid with an IN-MEMORY modification, clicktrack.py's
click synthesis reused; tools/truth/Vienna.json is never written.

  python3 tools/truth/v85-vienna-ab.py [--shift-bar=N] [--shift-until=S] [--t0=ms] [--bar-only] [--from=S] [--to=S] [--out=path]

  --shift-bar=N     move the DOWNBEAT by N beats (the beat list itself is untouched): +1 = the accent on the grid's beat 2,
                    -1 = on the grid's beat 4 (the pad swells' start in the dream), +2 = the half-bar
  --shift-until=S   apply the bar shift only to downbeats before S (track time); from S on the grid's own bar line
  --t0=ms           shift every click by this many ms (the §72 t0 class) - a local test of the beat phase
  --bar-only        clicks on the downbeats only (the render the user heard: Vienna-bar-line-only.wav)
Default window 60-112 s, output tools/work/v85/Vienna-ab.wav.
"""
import importlib.util, json, os, sys, wave
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); WORK = os.path.join(HERE, '..', 'work'); SR = 48000
spec = importlib.util.spec_from_file_location('clicktrack', os.path.join(HERE, 'clicktrack.py')); ct = importlib.util.module_from_spec(spec); spec.loader.exec_module(ct)
opt = lambda k, d=None: next((a.split('=', 1)[1] for a in sys.argv if a.startswith('--' + k + '=')), d)
shift = int(opt('shift-bar', 0)); until = float(opt('shift-until', 1e9)); t0 = float(opt('t0', 0)) / 1e3
t_from = float(opt('from', 60)); t_to = float(opt('to', 112)); out = opt('out', os.path.join(WORK, 'v85', 'Vienna-ab.wav')); bar_only = '--bar-only' in sys.argv
tj = json.load(open(os.path.join(HERE, 'Vienna.json'))); beats = np.array(tj['beats'], float); downs = np.array(tj['downbeats'], float)
# the modification, in memory only
di = np.searchsorted(beats, downs - 1e-4)
di2 = np.array([i + shift if downs[j] < until else i for j, i in enumerate(di)]); di2 = di2[(di2 >= 0) & (di2 < len(beats))]
downs2 = beats[di2] + t0; beats2 = beats + t0
x = np.fromfile(os.path.join(WORK, f'Vienna.{SR}.st.f32'), dtype=np.float32).reshape(-1, 2)
i0, i1 = int(t_from * SR), min(len(x), int(t_to * SR)); x = x[i0:i1].astype(np.float64); peak = np.abs(x).max() or 1.0; g = peak * 10 ** (-6 / 20)
c = np.zeros(len(x))
def put(t, burst, amp):
    i = int((t - t_from) * SR)
    if i < 0 or i >= len(c): return
    m = min(len(burst), len(c) - i); c[i:i + m] += amp * burst[:m]
cb, cd = ct.click(2000, 25), ct.click(1000, 40); dset = set(np.round(downs2, 4)); nb = nd = 0
for b in beats2:
    if not (t_from <= b < t_to): continue
    if round(b, 4) in dset: put(b, cd, g * 10 ** (4 / 20)); nd += 1
    elif not bar_only: put(b, cb, g); nb += 1
y = x * 0.85 + c[:, None]; y /= max(1.0, np.abs(y).max())
os.makedirs(os.path.dirname(out), exist_ok=True)
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((y * 32767).astype('<i2').tobytes())
print(f'{out}: {t_from:.0f}-{t_to:.0f} s, {nb} beat clicks + {nd} downbeat clicks; bar shift {shift:+d} beat(s)' + (f' until {until:.3f} s' if until < 1e8 else '') + f', t0 {t0 * 1e3:+.0f} ms, {"bar only" if bar_only else "all beats"}; Vienna.json untouched')
