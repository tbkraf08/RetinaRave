#!/usr/bin/env python3
"""Grade PREDICTED hits and bar-level section events against the offline truth (live step 3, docs/AUDIT-live-grid.md
"Step 3"). Engine-independent like gridcheck.py — numpy only, the matcher is compare.py's.

    python3 tools/truth/predcheck.py <trace.json> [--truth tools/truth/SeeYouDrop.json] [--win 25.6,44.8[;89.6,96]]
                                     [--sections tools/truth/SeeYouDrop.sections.json] [--conf 0.5] [--md out.md]
    python3 tools/truth/predcheck.py --bins 8 <trace.json> [<trace.json> ...] [--conf 0.35] [--md out.md]
    python3 tools/truth/predcheck.py --self-test

Rows (every time is HEARD time, the trace's `t`):
  hits      pred<Cls>Evt vs onsets.click / mid / high (kick / snare / hat): F +-30 ms, lag median / p90 of the matched
            (release - truth; the target is ON time, |median| <= 10 ms), the share released BEFORE THE AUDIO ARRIVED
            (release < truth + leadT: the analysers had not yet seen the hit, so it cannot be a reaction), and the same
            rows for the reactive <cls>Evt (first frame) beside it. --conf also grades only the predictions whose
            predConf >= the gate.
  changes   predictions released in the first bar after each annotated boundary: how many, how many false (no truth
            onset within 30 ms), against the precision everywhere else — a prediction across a change is wrong.
  sections  barNovelEvt vs the annotated boundaries (sections[].t0 but the first) and barReturnEvt vs `returns[].b`,
            latency in beats from the bar line (the first event in [-0.5, +8] beats), beside the synapse fields
            (boundaryEvt; sectionReturn rising to 1). Events matched to nothing are counted as false.
  bins      (--bins W, the COLD-START ruler, live step 3 warm-up) per W s since each trace's FIRST frame: released
            n · P · lag median per class (P = the share of released hits within +-30 ms of a truth onset) and the share
            of frames with predConf >= --conf (default 0.35, the release gate); per trace the time to the first RIGHT hit
            and how many wrong ones came before it. Several traces (each its own cold start) are summed bin by bin.
The window (--win, several joined by ';') selects truth onsets and releases alike; the section rows use the whole trace
unless --win is given.
"""
import json, os, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from compare import match, fmeasure, evframes, TOL_EV  # noqa: E402

LAG_ON = 0.010          # the prediction target: |median lag| <= 10 ms
PRE, POST = 0.5, 8.0    # beats: a section event belongs to a boundary when it lands in [b - PRE, b + POST] beats
CLS = (('kick', 'click'), ('snare', 'mid'), ('hat', 'high'))

def ld(p): return json.load(open(p))

def colf(tr, name):
    c = tr['cols'].get(name)
    return None if c is None else np.array([np.nan if x is None else float(x) for x in c])

def rises(col):
    """A level column -> the frames where it rises above 0.5 (the first frame of each run)."""
    v = np.nan_to_num(col) > 0.5
    return np.where(v & ~np.r_[False, v[:-1]])[0]

class Table:
    def __init__(self): self.rows = []
    def add(self, *r): self.rows.append(tuple(str(x) for x in r) + ('',) * (5 - len(r)))
    def show(self, md=None):
        head = ('ruler', 'source', 'value', 'target', 'note')
        w = [max(len(r[i]) for r in self.rows + [head]) for i in range(5)]
        line = lambda r: '  '.join(r[i].ljust(w[i]) for i in range(5)).rstrip()
        print(line(head)); print('  '.join('-' * x for x in w))
        for r in self.rows: print(line(r))
        if md:
            with open(md, 'w') as fh:
                fh.write('| ruler | source | value | target | note |\n|---|---|---|---|---|\n')
                for r in self.rows: fh.write('| ' + ' | '.join(x.replace('|', '/') for x in r) + ' |\n')
            print('md ->', md)

def inwin(a, wins):
    a = np.asarray(a, float)
    if not wins: return np.ones(len(a), bool)
    m = np.zeros(len(a), bool)
    for w0, w1 in wins: m |= (a >= w0) & (a < w1)
    return m

def hit_rows(T, tb, lead, fr, truth, label, src, wins, target=True):
    """F / lag / early share for one event source. fr = release frames. -> dict of the numbers (the self-test reads it)."""
    rel = tb[fr]; keep = inwin(rel, wins); rel, fr = rel[keep], fr[keep]
    ref = truth[inwin(truth, wins)]
    F, p, r, tp, ms, ex = fmeasure(rel, ref)
    pairs, _, _ = match(rel, ref, TOL_EV)
    out = {'F': F, 'n': len(rel), 'tp': tp}
    if pairs:
        d = np.array([a for a, _ in pairs]); rr = np.array([b for _, b in pairs])
        lag = d - rr
        L = lead[np.searchsorted(tb, d).clip(0, len(tb) - 1)] if lead is not None else np.zeros(len(d))
        early = float(np.mean(d < rr + L)); ontime = float(np.mean(d <= rr + 1 / 120))
        out.update(med=float(np.median(lag)), p90=float(np.percentile(lag, 90)), early=early)
        T.add(f'{label} lag', src, f'med {1000 * np.median(lag):+.1f} p90 {1000 * np.percentile(lag, 90):+.1f} ms',
              f'|med|<={1000 * LAG_ON:.0f}' if target else '-', f'n={len(pairs)}')
        T.add(f'{label} before the audio', src, f'{100 * early:.0f} % (not late: {100 * ontime:.0f} %)', '-',
              'release < truth + leadT')
    T.add(f'{label} F +-30ms', src, f'{F:.3f} (P {p:.3f} R {r:.3f})', '-', f'tp {tp} miss {ms} extra {ex}')
    return out

def change_rows(T, tb, fr, truth, bounds, bar, label, wins):
    rel = tb[fr]; rel = rel[inwin(rel, wins)]
    if not len(rel): return
    pairs, _, extra = match(rel, truth, TOL_EV)
    good = np.array([a for a, _ in pairs]); extra = np.asarray(extra)
    inb = lambda a: np.array([any(b <= x < b + bar for b in bounds) for x in a], bool) if len(a) else np.zeros(0, bool)
    gb, eb = inb(good).sum(), inb(extra).sum()
    go, eo = len(good) - gb, len(extra) - eb
    pb = gb / max(1, gb + eb); po = go / max(1, go + eo)
    T.add(f'{label} first bar after a change', 'pred', f'{gb + eb} released, {eb} false (P {pb:.2f})', '-',
          f'elsewhere P {po:.2f} ({go + eo} released)')

def sec_rows(T, tb, ev_f, refs, beat, label, src):
    """First event in [ref - PRE, ref + POST] beats for each ref -> latency in beats. -> (hits, lat list, false count)."""
    et = tb[ev_f] if len(ev_f) else np.zeros(0)
    used = np.zeros(len(et), bool); lats = []
    for r in refs:
        k = np.where(~used & (et >= r - PRE * beat) & (et <= r + POST * beat))[0]
        if len(k): used[k[0]] = True; lats.append((et[k[0]] - r) / beat)
        else: lats.append(None)
    hit = [x for x in lats if x is not None]
    s = ' '.join('-' if x is None else f'{x:+.1f}' for x in lats)
    T.add(f'{label}', src, f'{len(hit)}/{len(refs)} · median {np.median(hit):+.2f} beats' if hit else f'0/{len(refs)}',
          '-', f'per ref: {s} · false {int((~used).sum())}')
    return len(hit), lats, int((~used).sum())

def run(tr, truth, secs, wins=None, conf=None, md=None, quiet=False):
    tb = np.array(tr['t'], float)
    lead = colf(tr, 'leadT')
    on = truth['onsets']
    beat = float(np.median(np.diff(truth['beats']))) if truth.get('beats') else 0.4
    bar = 4 * beat
    T = Table(); R = {}
    bounds = [s['t0'] for s in secs['sections'][1:]] if secs else []
    for cls, key in CLS:
        ref = np.array(on[key], float)
        pe = tr['cols'].get('pred' + cls.capitalize() + 'Evt')
        if pe is not None:
            fr = evframes(pe)
            R[cls] = hit_rows(T, tb, lead, fr, ref, cls, 'pred', wins)
            pc = colf(tr, 'predConf')
            if conf is not None and pc is not None:
                g = fr[np.nan_to_num(pc[fr]) >= conf]
                R[cls + '_gated'] = hit_rows(T, tb, lead, g, ref, cls, f'pred conf>={conf}', wins)
            if bounds: change_rows(T, tb, fr, ref, bounds, bar, cls, wins)
        else: T.add(f'{cls} F +-30ms', 'pred', 'absent')
        re_ = tr['cols'].get(cls + 'Evt')
        if re_ is not None: hit_rows(T, tb, lead, evframes(re_), ref, cls, 'reactive', wins, target=False)
    if secs:
        sel = (lambda a: [x for x in a if inwin([x], wins)[0]]) if wins else (lambda a: a)
        B = sel(bounds)
        rets = []
        for r in secs.get('returns', []):
            b = r['b'].split()[-1].split('-')[0]
            rets.append(float(b))
        RT = sel(rets)
        for fld, lab, refs in (('barNovelEvt', 'section start', B), ('boundaryEvt', 'section start', B)):
            c = tr['cols'].get(fld)
            if c is None: T.add(lab, fld, 'absent'); continue
            R[fld] = sec_rows(T, tb, evframes(c), refs, beat, lab, fld)
        c = tr['cols'].get('barReturnEvt')
        if c is not None: R['barReturnEvt'] = sec_rows(T, tb, evframes(c), RT, beat, 'return', 'barReturnEvt')
        else: T.add('return', 'barReturnEvt', 'absent')
        c, a = colf(tr, 'sectionReturn'), colf(tr, 'sectionAlt')
        if c is not None and a is not None:     # synapse's return = a sectionAlt change that lands with sectionReturn 1
            ch = np.where((np.r_[False, np.diff(np.nan_to_num(a)) != 0]) & (np.nan_to_num(c) > 0.5))[0]
            R['sectionReturn'] = sec_rows(T, tb, ch, RT, beat, 'return', 'sectionAlt+sectionReturn')
        elif c is not None: R['sectionReturn'] = sec_rows(T, tb, rises(c), RT, beat, 'return', 'sectionReturn rise')
    if not quiet: T.show(md)
    return R

# ----------------------------------------------------------------------------------------------------------------------
def bins_of(tr, truth, width, conf=0.35):
    """One trace -> {bins: [{cls: [n, tp, lags]}, conf share], first: {cls: (t first right, wrong before it)}} on the
    time since the trace's first frame."""
    tb = np.array(tr['t'], float); t0 = tb[0]; nb = int(np.ceil((tb[-1] - t0) / width))
    pc = colf(tr, 'predConf'); out = {'bins': [dict() for _ in range(nb)], 'first': {}, 'conf': [], 'dur': tb[-1] - t0}
    for b in range(nb):
        m = (tb >= t0 + b * width) & (tb < t0 + (b + 1) * width)
        out['conf'].append((int(np.sum(np.nan_to_num(pc[m]) >= conf)) if pc is not None else 0, int(m.sum())))
    for cls, key in CLS:
        ref = np.array(truth['onsets'][key], float)
        pe = tr['cols'].get('pred' + cls.capitalize() + 'Evt')
        if pe is None: continue
        rel = tb[evframes(pe)]
        pairs, _, _ = match(rel, ref[(ref >= t0 - TOL_EV) & (ref <= tb[-1] + TOL_EV)], TOL_EV)
        good = {a: a - r for a, r in pairs}
        for b in range(nb):
            x = rel[(rel >= t0 + b * width) & (rel < t0 + (b + 1) * width)]
            lags = [good[a] for a in x if a in good]
            out['bins'][b][cls] = [len(x), len(lags), lags]
        right = sorted(good)
        tf = right[0] - t0 if right else None
        out['first'][cls] = (tf, int(np.sum(rel < right[0])) if right else len(rel))
    return out

def bins_report(paths, width, conf=0.35, md=None):
    """Sum the bins of several cold-start traces; print a table (and --md)."""
    R = []
    for p in paths:
        tr = ld(p); tname = tr.get('track') or 'SeeYouDrop'
        R.append((p, bins_of(tr, ld(os.path.join(HERE, f'{tname}.json')), width, conf)))
    nb = max(len(r['bins']) for _, r in R)
    head = ['since start'] + [f'{c} n · P · lag' for c, _ in CLS] + [f'frames conf>={conf}']
    rows = []; agg = []
    for b in range(nb):
        row = [f'{b * width:g}-{(b + 1) * width:g} s']; A = {}
        for cls, _ in CLS:
            n = tp = 0; lags = []
            for _, r in R:
                if b < len(r['bins']) and cls in r['bins'][b]: n += r['bins'][b][cls][0]; tp += r['bins'][b][cls][1]; lags += r['bins'][b][cls][2]
            A[cls] = (n, tp)
            row.append(f'{n} · {tp / n:.2f} · {1000 * np.median(lags):+.0f}' if n and lags else f'{n} · {"0.00" if n else "-"}')
        cn = sum(r['conf'][b][0] for _, r in R if b < len(r['conf'])); cf = sum(r['conf'][b][1] for _, r in R if b < len(r['conf']))
        row.append(f'{100 * cn / max(1, cf):.0f} %'); rows.append(row); agg.append(A)
    w = [max(len(r[i]) for r in rows + [head]) for i in range(len(head))]
    line = lambda r: '  '.join(r[i].ljust(w[i]) for i in range(len(r)))
    print(line(head)); print('  '.join('-' * x for x in w))
    for r in rows: print(line(r))
    print('first right hit (s since start) · wrong released before it:')
    for p, r in R:
        print('  ' + os.path.basename(p) + ': ' + ' · '.join(f'{c} ' + ('-' if r['first'][c][0] is None else f'{r["first"][c][0]:.1f}') + f' ({r["first"][c][1]} wrong)' for c, _ in CLS if c in r['first']))
    if md:
        with open(md, 'w') as fh:
            fh.write('| ' + ' | '.join(head) + ' |\n|' + '---|' * len(head) + '\n')
            for r in rows: fh.write('| ' + ' | '.join(r) + ' |\n')
            fh.write('\nfirst right hit (s since start) · wrong released before it:\n\n')
            for p, r in R: fh.write('- ' + os.path.basename(p) + ': ' + ' · '.join(f'{c} ' + ('-' if r['first'][c][0] is None else f'{r["first"][c][0]:.1f}') + f' ({r["first"][c][1]} wrong)' for c, _ in CLS if c in r['first']) + '\n')
        print('md ->', md)
    return agg, R

def synth(truth, secs, shift=0.0, fps=60, lead=-0.0427):
    """A trace built from the truth itself: every onset released on its nearest frame (+shift s), boundaries / returns
    likewise. Perfect prediction must read F 1.0 and lag ~0."""
    dur = max(truth['beats'][-1], secs['sections'][-1]['t0']) + 2
    t = np.arange(1, int(dur * fps)) / fps
    cols = {'leadT': [lead] * len(t), 'predConf': [1.0] * len(t)}
    def put(name, times):
        v = np.zeros(len(t), int)
        for x in times:
            i = int(round((x + shift) * fps)) - 1
            if 0 <= i < len(t): v[i] = 1
        cols[name] = v.tolist()
    for cls, key in CLS: put('pred' + cls.capitalize() + 'Evt', truth['onsets'][key])
    put('barNovelEvt', [s['t0'] for s in secs['sections'][1:]])
    put('barReturnEvt', [float(r['b'].split()[-1].split('-')[0]) for r in secs['returns']])
    return {'track': 'synth', 'mode': 'synth', 'fps': fps, 't': t.tolist(), 'cols': cols, 'fields': list(cols), 'f': list(range(len(t)))}

def self_test():
    truth = ld(os.path.join(HERE, 'SeeYouDrop.json')); secs = ld(os.path.join(HERE, 'SeeYouDrop.sections.json'))
    ok = True
    def chk(c, msg):
        nonlocal ok
        print(('ok   ' if c else 'FAIL ') + msg); ok &= bool(c)
    R = run(synth(truth, secs), truth, secs, quiet=True)
    for cls, _ in CLS:
        chk(R[cls]['F'] > 0.995, f'perfect {cls}: F {R[cls]["F"]:.3f}')
        chk(abs(R[cls]['med']) <= 1 / 120 + 1e-9, f'perfect {cls}: lag {1000 * R[cls]["med"]:+.1f} ms')
    chk(R['barNovelEvt'][0] == 10 and R['barNovelEvt'][2] == 0, f'perfect novelty: {R["barNovelEvt"][0]}/10, false {R["barNovelEvt"][2]}')
    chk(R['barReturnEvt'][0] == 3, f'perfect returns: {R["barReturnEvt"][0]}/3')
    R = run(synth(truth, secs, shift=1 / 60), truth, secs, quiet=True)
    chk(abs(R['kick']['med'] - 1 / 60) < 1 / 120, f'one frame late: kick lag {1000 * R["kick"]["med"]:+.1f} ms (want ~+17)')
    step = float(np.median(np.diff(truth['beats']))) / 4
    R = run(synth(truth, secs, shift=step), truth, secs, quiet=True)
    chk(R['kick']['F'] < 0.2, f'one 16th step late: kick F {R["kick"]["F"]:.3f} (caught)')
    chk(all(abs(x - 0.25) < 0.05 for x in R['barNovelEvt'][1] if x is not None), 'one step late: novelty reads +0.25 beats')
    R = run(synth(truth, secs, shift=-0.02, lead=+0.027), truth, secs, quiet=True)
    chk(R['kick']['early'] == 1.0, f'released 20 ms early, capture lead 27 ms: before-the-audio {R["kick"]["early"]:.2f}')
    R = run(synth(truth, secs, shift=+0.025, lead=+0.005), truth, secs, quiet=True)
    chk(R["kick"]["early"] == 0.0, f'released 25 ms late, lead 5 ms: before-the-audio {R["kick"]["early"]:.2f}')
    print('self-test', 'OK' if ok else 'FAILED')
    return ok

if __name__ == '__main__':
    a = sys.argv[1:]
    if '--self-test' in a: sys.exit(0 if self_test() else 1)
    if not a: print(__doc__); sys.exit(2)
    opt = lambda k, d=None: a[a.index(k) + 1] if k in a else d
    if '--bins' in a:
        pos = [x for i, x in enumerate(a) if not x.startswith('--') and (i == 0 or not a[i - 1].startswith('--'))]
        bins_report(pos, float(opt('--bins')), float(opt('--conf', 0.35)), opt('--md')); sys.exit(0)
    tr = ld(a[0])
    tname = tr.get('track') or 'SeeYouDrop'
    truth = ld(opt('--truth', os.path.join(HERE, f'{tname}.json')))
    sp = opt('--sections', os.path.join(HERE, f'{tname}.sections.json'))
    secs = ld(sp) if sp and os.path.exists(sp) else None
    wins = [tuple(float(x) for x in w.split(',')) for w in opt('--win').split(';')] if opt('--win') else None
    conf = float(opt('--conf')) if opt('--conf') else None
    run(tr, truth, secs, wins, conf, opt('--md'))
