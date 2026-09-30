#!/usr/bin/env python3
"""The BUILD / DROP ruler (live step 4 B.0, docs/AUDIT-live-grid.md "Step 4 — build / drop"): how early a "drop coming"
signal arms before each truth drop, how late a drop EVENT lands, and how often either fires where no drop comes.
Engine-independent like predcheck / drumcheck — numpy only; the trace format is compare.py's (a page det trace from
tools/filetrace.js or a node trace from tools/build-node.js — the same JSON).

    python3 tools/truth/dropcheck.py <trace.json> [<trace.json> ...] [--rule 'build>=0.5' --rule 'dropEvt:evt' ...]
                                     [--md out.md] [--shifts 200] [--summary]
    python3 tools/truth/dropcheck.py --selftest

A RULE says when a field is "armed":
  f>=x, f>x         a level at / above a threshold
  f<=n              a COUNT-DOWN (beats to the drop; negative = none): armed while 0 <= f <= n
  f:evt             an event column (0/1 per frame): one arm per frame it is set
With no --rule, every default rule whose field the trace carries is graded (DEFAULT_RULES).

Per level / count-down rule and per truth drop D (heard seconds, tools/truth/<track>.json `drops`; beat length = the truth
grid's local median beat — the RULER may use the truth grid, a detector never):
  anticip   beats between the onset of the armed run that is live at the drop and D. "Live at the drop" = the run reaches
            D - GRACE (1 beat: a hush / gap bar right before the slam may drop a level); runs separated by gaps
            <= BRIDGE (1 beat) are one run (a level flickering at its threshold reads as held to any decaying visual).
            0 = not armed at the drop. For a count-down: `err` = where it pointed at its last armed frame before D
            (t + f·beat - D, beats; + = it expected the drop later).
  false/min arm onsets (bridged runs) NOT followed by a truth drop within HORIZON = 16 bars (64 beats) of the onset
            (a build longer than 16 bars is rare; an arm that early is not an anticipation a visual can use), per
            minute of trace; on a track with no drops (CyborgNinja) every onset is false — the pure false-alarm control.
  armed %   the share of frames armed. THE CHANCE LINE beside it: the arm mask circularly shifted by --shifts random
            offsets (run lengths kept) and graded again — `chance hit` = mean share of drops armed at the drop, `chance
            ant` = mean anticipation (beats). A signal armed 50 % of the time anticipates about half the drops by luck.
--summary pools the traces into one row per rule: the anticipation of every drop in trace order, false arms / min on the
drop tracks and on the no-drop tracks (CyborgNinja) apart, armed % on each, the chance hit rate (drop-weighted). A trace
set with a whole-track map (`&map=1`) and one without (`&map=0`) of the same track: the map rules are taken from the map
trace (`mapOn` set), the causal rules from the FIRST trace of each track given (list the map=0 traces first).
Per event rule: `lag` = the nearest event within +-EV_WIN (2 beats) of D, ms (+ = late); false/min = events farther than
EV_WIN from every drop; chance = rate x the 4-beat window.
"""
import json, os, re, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
GRACE, BRIDGE, HORIZON, EV_WIN = 1.0, 1.0, 64.0, 2.0      # beats
DEFAULT_RULES = [
    # v3 (features.js): the energy-arc build level, the reactive drop, its envelope
    'build>=0.5', 'build>=0.3', 'dropEvt:evt',
    # synapse (anatomy.js; MS.tension is v3's roughness, synapse's own tension is not in MS — the node harness has it)
    'riser>=0.5', 'riser>=0.2', 'dropConf>=0.3', 'dropConf>=0.1', 'dropExpectedIn<=16', 'dropExpectedIn<=8', 'hush>=0.5',
    'tension>=0.5', 'roll>=0.5', 'hp>=0.5', 'swell>=0.5', 'fakeoutEvt:evt',
    # the node harness's synapse internals (tools/build-node.js)
    'synTension>=0.3', 'synTension>=0.6', 'synDropEvt:evt', 'synAll>=0.3',
    # the file map (non-causal: the whole track analysed ahead) — the CEILING
    'buildProg>0', 'toDrop<=16', 'toDrop<=32', 'mapDropEvt:evt',
]

MAP_FIELDS = ('buildProg', 'toDrop', 'toBoundary', 'mapDropEvt', 'mapBoundaryEvt')

def parse(rule):
    m = re.fullmatch(r'\s*(\w+)\s*(>=|>|<=|:evt)\s*([-\d.]*)\s*', rule)
    if not m: raise ValueError('bad rule ' + rule)
    f, op, x = m.group(1), m.group(2), m.group(3)
    return f, op, (float(x) if x else None)

def col(tr, name):
    c = tr['cols'].get(name)
    if c is None: return None
    n = len(tr['t'])
    return np.array([np.nan if v is None else float(v) for v in c[:n]])

def armmask(v, op, x):
    v = np.nan_to_num(v, nan=-1e9)
    if op == '>=': return v >= x
    if op == '>': return v > x
    if op == '<=': return (v >= 0) & (v <= x)
    return v > 0.5

def runs(mask):
    """-> [(i0, i1)] inclusive frame index runs of True."""
    d = np.diff(np.r_[0, mask.astype(np.int8), 0])
    return list(zip(np.where(d == 1)[0], np.where(d == -1)[0] - 1))

def bridged(mask, t, gap):
    """Runs with gaps <= gap seconds joined -> [(t_on, t_off)]."""
    out = []
    for i0, i1 in runs(mask):
        if out and t[i0] - out[-1][1] <= gap: out[-1][1] = t[i1]
        else: out.append([t[i0], t[i1]])
    return out

class Truth:
    def __init__(self, drops, beats):
        self.drops = np.asarray(drops, float); self.beats = np.asarray(beats, float)
    @classmethod
    def load(cls, track):
        T = json.load(open(os.path.join(HERE, f'{track}.json')))
        return cls(T['drops'], T['beats'])
    def beat(self, t):
        """The local median beat length around t (s)."""
        b = self.beats
        if len(b) < 3: return 0.5
        k = np.searchsorted(b, t); d = np.diff(b[max(0, k - 8):min(len(b), k + 8)])
        return float(np.median(d if len(d) else np.diff(b)))
    def beat_med(self): return float(np.median(np.diff(self.beats))) if len(self.beats) > 2 else 0.5

def grade_level(t, mask, T, cd=None):
    """-> dict: ant [beats per drop], err [per drop or None], false n, onsets, armed share."""
    bm = T.beat_med(); R = bridged(mask, t, BRIDGE * bm)
    ant, err = [], []
    for D in T.drops:
        bl = T.beat(D); a = 0.0; e = None
        for on, off in R:
            if on < D and off >= D - GRACE * bl:
                a = (D - on) / bl
                if cd is not None:
                    k = np.where(mask & (t < D))[0]
                    if len(k): e = (t[k[-1]] + cd[k[-1]] * bl - D) / bl
                break
        ant.append(a); err.append(e)
    fal = sum(1 for on, _ in R if not np.any((T.drops >= on) & (T.drops <= on + HORIZON * T.beat(on) + GRACE * bm)))
    return dict(ant=ant, err=err, false=fal, onsets=len(R), armed=float(mask.mean()) if len(mask) else 0.0)

def grade_event(t, mask, T):
    ev = t[mask & ~np.r_[False, mask[:-1]]]
    lag = []
    for D in T.drops:
        w = EV_WIN * T.beat(D); near = ev[np.abs(ev - D) <= w]
        lag.append(None if not len(near) else float(near[np.argmin(np.abs(near - D))] - D) * 1000)
    fal = sum(1 for e in ev if not np.any(np.abs(T.drops - e) <= EV_WIN * T.beat(e)))
    return dict(lag=lag, false=fal, n=len(ev))

def chance(t, mask, T, n, rng):
    """Circular shifts of the arm mask: mean share of drops armed at the drop, mean anticipation (beats)."""
    if not len(T.drops) or not mask.any(): return 0.0, 0.0
    hit = ant = 0.0
    for s in rng.integers(1, len(mask), n):
        g = grade_level(t, np.roll(mask, s), T)
        hit += np.mean([a > 0 for a in g['ant']]); ant += np.mean(g['ant'])
    return hit / n, ant / n

def grade(tr, rules, T=None, shifts=200, seed=1):
    T = T or Truth.load(tr['track'])
    t = np.asarray(tr['t'], float); mins = (t[-1] - t[0]) / 60 if len(t) > 1 else 1
    rng = np.random.default_rng(seed); out = []
    for r in rules:
        f, op, x = parse(r); v = col(tr, f)
        if v is None: continue
        m = armmask(v, op, x)
        if op == ':evt':
            g = grade_event(t, m, T); g.update(rule=r, kind='evt', fpm=g['false'] / mins,
                                                chance=g['n'] / mins * 2 * EV_WIN * T.beat_med() / 60)
        else:
            g = grade_level(t, m, T, v if op == '<=' else None)
            g.update(rule=r, kind='lvl', fpm=g['false'] / mins)
            g['chit'], g['cant'] = chance(t, m, T, shifts, rng)
        out.append(g)
    return out, T, mins

def fmt(g, nd):
    if g['kind'] == 'evt':
        per = ' '.join('—' if l is None else f'{l:+.0f}ms' for l in g['lag']) if nd else '(no drops)'
        return per, f"{g['fpm']:.2f}", f"{g['n']} ev", f"chance {g['chance']:.2f}/drop"
    per = ' '.join(f'{a:.1f}' + ('' if e is None else f' (err {e:+.1f})') for a, e in zip(g['ant'], g['err'])) if nd else '(no drops)'
    return per, f"{g['fpm']:.2f}", f"{100 * g['armed']:.1f} %", (f"chance hit {g['chit']:.2f} · ant {g['cant']:.1f}" if nd else '')

def report(paths, rules, md=None, shifts=200):
    lines = ['| track (mode) | rule | per drop: anticipation beats (err) / event lag | false /min | armed | chance |',
             '|---|---|---|---|---|---|']
    for p in paths:
        tr = json.load(open(p)); gs, T, mins = grade(tr, rules, shifts=shifts); nd = len(T.drops)
        print(f"== {tr['track']} ({tr.get('mode')}, {os.path.basename(p)}, {mins:.1f} min, drops {list(T.drops)})")
        for g in gs:
            a, b, c, d = fmt(g, nd)
            print(f"  {g['rule']:20s} {a:44s} false/min {b:>5s}  armed {c:>7s}  {d}")
            lines.append(f"| {tr['track']} ({os.path.basename(p).replace('.json', '')}) | `{g['rule']}` | {a} | {b} | {c} | {d} |")
    if md:
        with open(md, 'w') as fh: fh.write('\n'.join(lines) + '\n')
        print('md ->', md)

def summary(paths, rules, md=None, shifts=200):
    acc = {r: dict(ant=[], lag=[], fd=0, fc=0, md=0.0, mc=0.0, ad=0.0, ac=0.0, ch=0.0, nd=0, tr=[]) for r in rules}
    for p in paths:
        tr = json.load(open(p)); gs, T, mins = grade(tr, rules, shifts=shifts); nd = len(T.drops)
        for g in gs:
            mo = col(tr, 'mapOn')
            idle = parse(g['rule'])[0] in MAP_FIELDS and (mo is None or not np.nanmax(mo) > 0)   # the map is off on this trace
            a = acc[g['rule']]
            if idle or tr['track'] in a['tr']: continue          # an idle map field on a map=0 trace; one trace per track
            a['tr'].append(tr['track'])
            if g['kind'] == 'evt': a['lag'] += g['lag']
            else: a['ant'] += g['ant']
            if nd:
                a['fd'] += g['false']; a['md'] += mins; a['nd'] += nd
                if g['kind'] == 'lvl': a['ad'] += g['armed'] * mins; a['ch'] += g['chit'] * nd
                else: a['ch'] += g['chance'] * nd
            else:
                a['fc'] += g['false']; a['mc'] += mins
                if g['kind'] == 'lvl': a['ac'] += g['armed'] * mins
    lines = ['| rule | tracks | per drop (trace order): anticipation beats / event lag ms | armed at drop | false /min drop tracks | false /min CN | armed % drop tracks / CN | chance hit |',
             '|---|---|---|---|---|---|---|---|']
    for r in rules:
        a = acc[r]
        if not a['tr']: continue
        if a['lag'] or (parse(r)[1] == ':evt'):
            per = ' '.join('—' if l is None else f'{l:+.0f}' for l in a['lag']); hit = sum(l is not None for l in a['lag']); arm = '—'
        else:
            per = ' '.join(f'{x:.1f}' for x in a['ant']); hit = sum(x > 0 for x in a['ant'])
            arm = f"{100 * a['ad'] / max(a['md'], 1e-9):.1f} / {100 * a['ac'] / max(a['mc'], 1e-9):.1f}" if a['mc'] else f"{100 * a['ad'] / max(a['md'], 1e-9):.1f} / —"
        fc = f"{a['fc'] / a['mc']:.2f}" if a['mc'] else '—'
        row = (f"`{r}`", ','.join(t[:4] for t in a['tr']), per, f"{hit}/{a['nd']}", f"{a['fd'] / max(a['md'], 1e-9):.2f}", fc, arm,
               f"{a['ch'] / max(a['nd'], 1):.2f}")
        print('  '.join(x.ljust(w) for x, w in zip(row, (22, 20, 44, 6, 6, 6, 12, 5))))
        lines.append('| ' + ' | '.join(row) + ' |')
    if md:
        with open(md, 'w') as fh: fh.write('\n'.join(lines) + '\n')
        print('md ->', md)

def selftest():
    fps, bpm, dur = 60, 120.0, 180.0
    bl = 60 / bpm; t = np.arange(1, int(dur * fps)) / fps
    drops = [100.0, 150.0]; T = Truth(drops, np.arange(0, dur, bl))
    ramp = np.zeros_like(t); cd = -np.ones_like(t); ev = np.zeros_like(t); fl = np.zeros_like(t)
    for D in drops:
        k = (t >= D - 16 * bl) & (t < D); ramp[k] = (t[k] - (D - 16 * bl)) / (16 * bl)   # 0 -> 1 over 16 beats
        k = (t >= D - 8 * bl) & (t < D); cd[k] = (D - t[k]) / bl                          # counts 8 -> 0
        ev[np.argmin(np.abs(t - (D + 0.050)))] = 1                                         # the event +50 ms late
    fl[(t >= 10) & (t < 14)] = 1; ev[np.argmin(np.abs(t - 20))] = 1                        # one false arm, one false event
    fl[(t >= 150 - 3 * bl) & (t < 150)] = 1; fl[(t >= 150 - 3.5 * bl) & (t < 150 - 3.2 * bl)] = 1   # a 0.2-beat gap: bridged
    tr = {'track': 'synthetic', 'mode': 'synth', 't': list(t), 'cols': {'lvl': list(ramp), 'cd': list(cd), 'ev': list(ev), 'fl': list(fl)}}
    gs, _, mins = grade(tr, ['lvl>=0.5', 'cd<=16', 'cd<=4', 'ev:evt', 'fl>=0.5'], T, shifts=50)
    G = {g['rule']: g for g in gs}; ok = True
    def chk(name, got, want, tol=0.05):
        nonlocal ok
        good = all(abs(a - b) <= tol for a, b in zip(got, want)) and len(got) == len(want)
        ok &= good; print(f"  {'ok ' if good else 'BAD'} {name}: {np.round(got, 3).tolist()} want {want}")
    chk('level >= 0.5 anticipates 8 beats', G['lvl>=0.5']['ant'], [8, 8])
    chk('count-down <= 16 anticipates its 8', G['cd<=16']['ant'], [8, 8])
    chk('count-down <= 4 anticipates 4', G['cd<=4']['ant'], [4, 4])
    chk('count-down err 0', G['cd<=16']['err'], [0, 0], 0.1)
    chk('event lag +50 ms', G['ev:evt']['lag'], [50, 50], 17)
    chk('event false 1', [G['ev:evt']['false']], [1], 0)
    chk('flicker: false 1, bridged 3.5 beats, missed first', [G['fl>=0.5']['false']] + G['fl>=0.5']['ant'], [1, 0, 3.5], 0.05)
    chk('armed share', [G['lvl>=0.5']['armed']], [2 * 8 * bl / dur], 0.002)
    # a trace with no drops: every onset is false, the anticipation list is empty
    gs, _, _ = grade(tr, ['lvl>=0.5', 'ev:evt'], Truth([], T.beats), shifts=5)
    chk('no drops: all false', [gs[0]['false'], gs[1]['false']], [2, 3], 0)
    # chance: a mask armed half the time in long runs hits about half the drops
    half = ((t // 7) % 2 == 0).astype(float); tr['cols']['half'] = list(half)
    gs, _, _ = grade(tr, ['half>=0.5'], T, shifts=400)
    chk('chance of a 50 % mask ~0.5', [gs[0]['chit']], [0.5], 0.08)
    print('selftest', 'OK' if ok else 'FAILED')
    return ok

if __name__ == '__main__':
    a = sys.argv[1:]
    if '--selftest' in a or '--self-test' in a: sys.exit(0 if selftest() else 1)
    if not a: print(__doc__); sys.exit(2)
    rules, paths, md, shifts, i = [], [], None, 200, 0
    summ = '--summary' in a
    a = [x for x in a if x != '--summary']
    while i < len(a):
        if a[i] == '--rule': rules += a[i + 1].split(';'); i += 2
        elif a[i] == '--md': md = a[i + 1]; i += 2
        elif a[i] == '--shifts': shifts = int(a[i + 1]); i += 2
        else: paths.append(a[i]); i += 1
    (summary if summ else report)(paths, rules or DEFAULT_RULES, md, shifts)
