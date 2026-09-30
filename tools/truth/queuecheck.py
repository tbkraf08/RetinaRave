#!/usr/bin/env python3
"""Grade a COUNT-DOWN to the next expected event against the offline truth (live step 5, the predicted-event queue;
docs/AUDIT-live-grid.md "Step 5"). Engine-independent like gridcheck.py / dropcheck.py — numpy only.

    python3 tools/truth/queuecheck.py <trace.json> [<trace.json> ...] [--win 25.6,44.8[;89.6,96]] [--md out.md]
                                      [--tol 0.010] [--shifts 50] [--rows kick,snare,hat,beat,bar,drop]
    python3 tools/truth/queuecheck.py --selftest

A count-down field says "the next <class> event is in v seconds" (v >= 0; negative = none) and, frame by frame, should
DECREASE by one frame's worth until it reaches 0 on the event and rolls over to the one after. Every time is HEARD time
(the trace's `t`). Per class the ruler reads the field (or a baseline derived from an older field — see RULERS) and grades:
  arrivals  the roll-overs: the last frame of an entry (v < 1.5 frames, then a larger v or none) predicts the event at
            t + v. Precision / recall / F within +-30 ms of the truth onsets (kick = onsets.click, snare = mid, hat = high,
            beat = beats, bar = downbeats, drop = drops), the lag median / p90 of the matched (+ = late), and a CHANCE F:
            the same arrivals circularly shifted in time (--shifts, mean F).
  horizon   for each matched arrival, how many seconds before the event the field first pointed at it (the same entry:
            t + v within +-40 ms of the arrival's time, back through consecutive frames) — the median. A "next" field is
            capped by the previous event of its class, so its ceiling is the class's inter-onset interval.
  jumps     per minute the field is live: frames where v did not move by one frame's worth (|dv + dt| > --tol, 10 ms),
            split into roll-overs (legit: v reached 0), withdraws (v jumped up or to none before reaching 0: the store
            re-voted), inserts (a nearer entry appeared: v jumped down) and jitter (the rest: the clock nudged).
  drop      nextDropIn (or dropLiveIn in beats) through dropcheck.py's grade_level: beats ahead the entry appeared before
            each truth drop, its pointing error at the drop, false arms / min — the cross-check with §54's table.
RULERS (graded when the trace carries the field): the queue's next*In (s); baselines — predKickIn (beats -> s at bpm),
dropLiveIn (beats), beatPhase (the v3 clock moved onto heard time: raw + leadT (or -detLead on a det / node trace with the lead off) -> the
next beat line). The window (--win, several joined by ';') selects truth and arrivals alike.
"""
import json, os, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from compare import match, fmeasure, TOL_EV  # noqa: E402
from dropcheck import Truth as DropTruth, grade_level  # noqa: E402

FPS = 60
ROLL = 1.5          # frames: an entry whose v is under this many frames on its last frame has ARRIVED (rolled over at 0)
SAME = 0.040        # s: consecutive frames pointing within this of the same time are the same entry (the horizon walk)
TRUTH = {'kick': ('onsets', 'click'), 'snare': ('onsets', 'mid'), 'hat': ('onsets', 'high'), 'beat': ('beats',), 'bar': ('downbeats',), 'drop': ('drops',)}
# name -> (class, field, unit): unit 's' = seconds ahead, 'beats' = beats ahead (x 60/bpm), 'phase' = beatPhase (the next line)
RULERS = [('nextKickIn', 'kick', 'nextKickIn', 's'), ('nextSnareIn', 'snare', 'nextSnareIn', 's'), ('nextHatIn', 'hat', 'nextHatIn', 's'),
          ('nextBeatIn', 'beat', 'nextBeatIn', 's'), ('nextBarIn', 'bar', 'nextBarIn', 's'), ('nextDropIn', 'drop', 'nextDropIn', 's'),
          ('base predKickIn', 'kick', 'predKickIn', 'beats'), ('base beatPhase', 'beat', 'beatPhase', 'phase'), ('base dropLiveIn', 'drop', 'dropLiveIn', 'beats')]

def ld(p): return json.load(open(p))

def colf(tr, name):
    c = tr['cols'].get(name)
    return None if c is None else np.array([np.nan if x is None else float(x) for x in c])

def truth_times(T, cls):
    k = TRUTH[cls]; v = T
    for x in k: v = v[x]
    return np.asarray(v, float)

def inwin(a, wins):
    a = np.asarray(a, float)
    if not wins: return np.ones(len(a), bool)
    m = np.zeros(len(a), bool)
    for w0, w1 in wins: m |= (a >= w0) & (a < w1)
    return m

def series(tr, field, unit):
    """The count-down in SECONDS ahead per frame (negative = none), from the field in its unit."""
    v = colf(tr, field)
    if v is None: return None
    if unit == 's': return np.where(np.isnan(v), -1.0, v)
    bpm = colf(tr, 'bpm'); bl = np.where(np.nan_to_num(bpm) > 0, 60 / np.where(np.nan_to_num(bpm) > 0, bpm, 1), np.nan)
    if unit == 'beats': return np.where(np.isnan(v) | (v < 0) | np.isnan(bl), -1.0, v * bl)
    # phase: the published v3 clock moved onto heard time -> the next beat line
    bc = colf(tr, 'beatCount'); lead = colf(tr, 'leadT')
    L = np.zeros(len(v)) if lead is None else np.nan_to_num(lead)
    if not np.any(L) and tr.get('mode') in ('file-det', 'node'): L = np.full(len(v), -(tr.get('detLead') or 0.0427))
    B = np.nan_to_num(bc) + np.nan_to_num(v) + L / np.where(np.isnan(bl), 1, bl)
    ahead = (np.ceil(B) - B) * bl
    return np.where(np.isnan(ahead), -1.0, ahead)

def arrivals(t, v, tol):
    """-> (frames i of the last frame of each entry, predicted times t[i]+v[i], jump counts dict, live frames)."""
    dt = np.median(np.diff(t)) if len(t) > 1 else 1 / FPS
    live = v >= 0
    arr = []; J = dict(roll=0, withdraw=0, insert=0, jitter=0)
    for i in range(len(v) - 1):
        if not live[i]: continue
        d = v[i + 1] - v[i]
        if live[i + 1] and abs(d + dt) <= tol: continue          # the steady count-down
        if v[i] < ROLL * dt and (not live[i + 1] or d > 0): J['roll'] += 1; arr.append(i)
        elif not live[i + 1] or d > 0: J['withdraw'] += 1
        elif d < -dt - tol: J['insert'] += 1
        else: J['jitter'] += 1
    if len(v) and live[-1] and v[-1] < ROLL * dt: arr.append(len(v) - 1)
    arr = np.array(arr, int)
    return arr, t[arr] + v[arr] if len(arr) else np.array([]), J, int(live.sum())

def horizon(t, v, i, p):
    """Seconds before p the field first pointed at p (walking back from frame i through the same entry)."""
    j = i
    while j > 0 and v[j - 1] >= 0 and abs(t[j - 1] + v[j - 1] - p) <= SAME: j -= 1
    return p - t[j]

def grade_class(tr, cls, field, unit, wins, tol, shifts, rng):
    t = np.asarray(tr['t'], float)
    v = series(tr, field, unit)
    if v is None: return None
    T = ld(os.path.join(HERE, tr['track'] + '.json'))
    ref = truth_times(T, cls); ref = ref[inwin(ref, wins)]
    arr, pred, J, nlive = arrivals(t, v, tol)
    keep = inwin(pred, wins) if len(pred) else np.zeros(0, bool)
    arr, pred = arr[keep], pred[keep]
    F, P, R, tp, ms, ex = fmeasure(pred, ref)
    pairs, _, _ = match(pred, ref, TOL_EV)
    lag = np.array([a - b for a, b in pairs]) if pairs else np.zeros(0)
    hz = np.array([horizon(t, v, i, p) for i, p in zip(arr, pred) if any(abs(p - a) < 1e-9 for a, _ in pairs)]) if pairs else np.zeros(0)
    span = (t[-1] - t[0]) if len(t) > 1 else 1
    chF = 0.0
    if len(pred) and len(ref) and shifts > 0:
        for s in rng.uniform(0.2, 0.8, shifts) * span:
            sh = t[0] + (pred - t[0] + s) % span
            chF += fmeasure(sh[inwin(sh, wins)], ref)[0]
        chF /= shifts
    mins = max(1e-9, nlive / FPS / 60) if unit != 'phase' else max(1e-9, span / 60)
    ioi = float(np.median(np.diff(ref))) if len(ref) > 2 else float('nan')
    return dict(cls=cls, field=field, n=len(pred), ref=len(ref), F=F, P=P, R=R, tp=tp, chance=chF,
                lag=float(np.median(lag)) if len(lag) else float('nan'), p90=float(np.percentile(np.abs(lag), 90)) if len(lag) else float('nan'),
                hz=float(np.median(hz)) if len(hz) else float('nan'), hz25=float(np.percentile(hz, 25)) if len(hz) else float('nan'), ioi=ioi,
                jumps=J, jpm=(J['withdraw'] + J['insert'] + J['jitter']) / mins, live=nlive / max(1, len(t)))

def grade_drop(tr, field, unit):
    t = np.asarray(tr['t'], float); v = series(tr, field, unit)
    if v is None: return None
    T = DropTruth.load(tr['track']); bpm = colf(tr, 'bpm')
    bl = np.where(np.nan_to_num(bpm) > 0, 60 / np.where(np.nan_to_num(bpm) > 0, bpm, 1), 0.4)
    g = grade_level(t, v >= 0, T, np.where(v >= 0, v / bl, -1))
    mins = (t[-1] - t[0]) / 60 if len(t) > 1 else 1
    return dict(field=field, ant=g['ant'], err=g['err'], fpm=g['false'] / mins, armed=g['armed'], nd=len(T.drops))

def fmt_row(g):
    j = g['jumps']
    return (f"{g['F']:.2f} (P {g['P']:.2f} R {g['R']:.2f}; chance {g['chance']:.2f})", f"{1000 * g['lag']:+.0f} / {1000 * g['p90']:.0f} ms",
            f"{g['hz']:.2f} s (p25 {g['hz25']:.2f}; ioi {g['ioi']:.2f})", f"{g['jpm']:.1f} /min (w {j['withdraw']} i {j['insert']} j {j['jitter']}; roll {j['roll']})", f"{100 * g['live']:.0f} %")

def report(paths, wins, md, tol, shifts, rows):
    lines = ['| track (trace) | ruler | F (P R; chance) +-30 ms | lag med / |p90| | horizon med (p25; truth ioi) | jumps /min live (withdraw insert jitter; rolls) | live |',
             '|---|---|---|---|---|---|---|']
    rng = np.random.default_rng(1)
    for p in paths:
        tr = ld(p); name = f"{tr['track']} ({os.path.basename(p).replace('.json', '')})"
        print(f"== {name} · {tr.get('mode')} · {len(tr['t'])} frames" + (f" · win {wins}" if wins else ''))
        for label, cls, field, unit in RULERS:
            if rows and cls not in rows: continue
            if cls == 'drop':
                g = grade_drop(tr, field, unit)
                if g is None: continue
                per = ' '.join(f"{a:.1f}" + ('' if e is None else f" (err {e:+.1f})") for a, e in zip(g['ant'], g['err'])) if g['nd'] else '(no drops)'
                s = f"beats ahead per drop {per} · false/min {g['fpm']:.2f} · armed {100 * g['armed']:.1f} %"
                print(f"  {label:18s} {s}")
                lines.append(f"| {name} | `{field}` (drop) | {s} | | | | |")
                continue
            g = grade_class(tr, cls, field, unit, wins, tol, shifts, rng)
            if g is None: continue
            a, b, c, d, e = fmt_row(g)
            print(f"  {label:18s} {a:42s} lag {b:16s} hz {c:32s} jumps {d:44s} live {e}  (n {g['n']} / truth {g['ref']})")
            lines.append(f"| {name} | `{field}` ({cls}) | {a} | {b} | {c} | {d} | {e} |")
    if md:
        with open(md, 'w') as fh: fh.write('\n'.join(lines) + '\n')
        print('md ->', md)

def selftest():
    """A synthetic 40 s trace at 150 BPM: a perfect kick count-down (kick on every beat), a snare count-down 20 ms late with
    one withdrawn entry, a hat field that is always none, a beat phase clock, a drop count-down over 8 beats."""
    fps, bl, D = 60, 0.4, 30.0
    t = np.arange(0, 40, 1 / fps); beats = np.arange(0.017, 40, bl)
    truth = dict(beats=beats.tolist(), downbeats=beats[::4].tolist(), drops=[D],
                 onsets=dict(click=beats.tolist(), mid=beats[1::2].tolist(), high=(beats[:, None] + [0, bl / 2]).ravel().tolist()))
    def countdown(ref, late=0.0):
        nxt = np.searchsorted(ref + late, t, side='left')
        return np.where(nxt < len(ref), (ref + late)[np.minimum(nxt, len(ref) - 1)] - t, -1.0)
    kick = countdown(beats); snare = countdown(beats[1::2], 0.020)
    w = (t > 10.0) & (t < 10.15); snare[w] = -1                     # one entry withdrawn 0.4 s before its time (to none)
    w = (t > 15.0) & (t < 15.1); snare[w] -= 0.2                    # a nearer entry appears for 0.1 s (an insert), then goes (a withdraw)
    hat = -np.ones(len(t))
    bc = np.floor((t - 0.017) / bl); bp = ((t - 0.017) / bl) % 1
    drop = np.where((t >= D - 8 * bl) & (t < D), D - t, -1.0)
    cols = dict(nextKickIn=kick, nextSnareIn=snare, nextHatIn=hat, nextDropIn=drop, beatCount=bc, beatPhase=bp, bpm=np.full(len(t), 150.0), leadT=np.zeros(len(t)))
    tr = dict(track='__self', mode='capture', t=t.tolist(), cols={k: v.tolist() for k, v in cols.items()})
    tp = os.path.join(HERE, '__self.json'); json.dump(truth, open(tp, 'w'))
    ok = True
    def chk(name, got, want, tol):
        nonlocal ok
        good = abs(got - want) <= tol; ok &= good
        print(f"  {'pass' if good else 'FAIL'}  {name:52s} {got:.4f} (want {want:.4f} +-{tol})")
    try:
        rng = np.random.default_rng(1)
        g = grade_class(tr, 'kick', 'nextKickIn', 's', None, 0.010, 20, rng)
        chk('perfect kick count-down: F', g['F'], 1.0, 0.02); chk('  lag 0', g['lag'], 0.0, 0.002); chk('  horizon = the beat', g['hz'], bl, 0.02)
        chk('  jumps /min 0', g['jpm'], 0.0, 0.01); chk('  chance F well below', g['chance'], 0.0, 0.25)
        g = grade_class(tr, 'snare', 'nextSnareIn', 's', None, 0.010, 20, rng)
        chk('late snare: lag +20 ms', g['lag'], 0.020, 0.003); chk('  F 1 (within 30 ms)', g['F'], 1.0, 0.02)
        chk('  two withdraws (to none, and the insert going)', g['jumps']['withdraw'], 2, 0); chk('  one insert', g['jumps']['insert'], 1, 0)
        g = grade_class(tr, 'hat', 'nextHatIn', 's', None, 0.010, 0, rng)
        chk('hat none: R 0', g['R'], 0.0, 0); chk('  n 0', g['n'], 0, 0)
        g = grade_class(tr, 'beat', 'beatPhase', 'phase', None, 0.010, 0, rng)
        chk('beat phase -> next beat: F', g['F'], 1.0, 0.02); chk('  lag 0', abs(g['lag']), 0.0, 0.009)
        g = grade_class(tr, 'kick', 'nextKickIn', 's', [(10, 20)], 0.010, 0, rng)
        chk('window 10-20 s: 25 kicks', g['ref'], 25, 1)
        d = grade_drop(tr, 'nextDropIn', 's')
        chk('drop: 8 beats ahead', d['ant'][0], 8.0, 0.1); chk('  pointing error 0', d['err'][0] or 0.0, 0.0, 0.05); chk('  no false arm', d['fpm'], 0.0, 0)
    finally:
        os.remove(tp)
    print('selftest', 'OK' if ok else 'FAILED')
    return ok

if __name__ == '__main__':
    a = sys.argv[1:]
    if '--selftest' in a or '--self-test' in a: sys.exit(0 if selftest() else 1)
    if not a: print(__doc__); sys.exit(2)
    paths, wins, md, tol, shifts, rows, i = [], None, None, 0.010, 50, None, 0
    while i < len(a):
        if a[i] == '--win': wins = [tuple(float(x) for x in w.split(',')) for w in a[i + 1].split(';')]; i += 2
        elif a[i] == '--md': md = a[i + 1]; i += 2
        elif a[i] == '--tol': tol = float(a[i + 1]); i += 2
        elif a[i] == '--shifts': shifts = int(a[i + 1]); i += 2
        elif a[i] == '--rows': rows = a[i + 1].split(','); i += 2
        else: paths.append(a[i]); i += 1
    report(paths, wins, md, tol, shifts, rows)
