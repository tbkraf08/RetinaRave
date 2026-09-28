#!/usr/bin/env python3
"""Grade an engine trace against the offline truth: the ruler table of ENGINE-CHLADNI-SESSION-PROMPT.md, "The rulers for
'looks synced'". Engine-independent — numpy + soundfile only, nothing imported from assets/.

    python3 tools/truth/compare.py tools/work/ears-node-SeeYouDrop.json
    python3 tools/truth/compare.py <trace.json> --truth tools/truth/SeeYouDrop.json --win 25,45 --md docs/work/rulers.md
    python3 tools/truth/compare.py --make-synth tools/truth/SeeYouDrop.json tools/work/synth.json [--shift=20]

The trace format is frozen by the FILE worker (docs/workers/brief-file.md):
  { "track", "mode": "file-det"|"file-rt"|"capture"|"node", "sr", "at", "fps", "detLead", "fields": [...],
    "f": [frame numbers], "t": [heard time per frame], "cols": { "<field>": [per frame; events 0/1; null = non-finite] },
    "log": [ { "type", "t", "f", ... } ] }

Two sources are graded side by side from the SAME trace: `new` = the v0.15 ears + map (kickEvt/kickAge, subHz, mapDropEvt,
mapBoundaryEvt, mapSection, mapReturn, tonic) and `old` = the v0.14 baseline (onset, synapse kick/snare/hat levels, dropEvt,
boundaryEvt + sectionAlt, key + mode). A field the trace does not carry makes its rows say "absent" — so a trace recorded
today, before the ears exist, still prints the old engine's rows.

Rulers and their targets (file mode; a capture trace is measured, not failed):
  event lag        median <= 15 ms, p90 <= 30 ms, max <= 45 ms (late)      | "placed" lag uses t - <x>Age
  event truth      F-measure within +-30 ms: kick >= 0.90 on 25-45 s       | snare / hat reported
  bare 808s        <= 5 % of kicks within 15 ms of a truth bare808 onset
  sub pitch        >= 90 % of sub-loud frames within +-30 cents            | slides: count, sign, span vs truth sub_slides
  structure        drops exact (+- 1 frame), none elsewhere; boundaries within +-1 beat; returns labelled; tonic = truth
"""
import json, os, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
NAMES = 'C C# D D# E F F# G G# A A# B'.split()
TOL_EV = 0.030          # the event-truth matching window (+-30 ms), the spec's ruler
TOL_BARE = 0.015        # a kick "on" a bare 808 note start
SUB_LOUD = 0.30         # a frame is sub-loud when the truth's sub share is at least this and its YIN is voiced
CENTS_OK = 30.0         # the sub-pitch ruler
LAG_MED, LAG_P90, LAG_MAX = 0.015, 0.030, 0.045
F_KICK = 0.90

def ld(p): return json.load(open(p))

def match(det, ref, tol):
    """Greedy nearest one-to-one matching. -> (pairs [(d,r)], missed refs, extra dets)."""
    det, ref = np.asarray(det, float), np.asarray(ref, float)
    used = np.zeros(len(ref), bool); pairs = []; extra = []
    for d in det:
        if len(ref) == 0: extra.append(d); continue
        k = int(np.argmin(np.where(used, 9e9, np.abs(ref - d))))
        if not used[k] and abs(ref[k] - d) <= tol: used[k] = True; pairs.append((d, float(ref[k])))
        else: extra.append(d)
    return pairs, ref[~used], np.array(extra)

def fmeasure(det, ref, tol=TOL_EV):
    pairs, missed, extra = match(det, ref, tol)
    tp = len(pairs); p = tp / max(1, tp + len(extra)); r = tp / max(1, tp + len(missed))
    return (2 * p * r / (p + r) if p + r else 0.0), p, r, tp, len(missed), len(extra)

def evframes(col):
    """Event column (0/1 per frame) -> the frame indices where it is true."""
    v = np.array([0 if x is None else x for x in col], float)
    return np.where(v > 0.5)[0]

def riseframes(col, thr=0.18, jump=0.06):
    """A decaying LEVEL (synapse kick/snare/hat) -> rising-edge frames, the closest an old trace gets to an event."""
    v = np.array([0.0 if x is None else float(x) for x in col])
    d = np.diff(v, prepend=v[0])
    ix = np.where((d > jump) & (v > thr))[0]
    return ix[np.r_[True, np.diff(ix) > 2]] if len(ix) else ix

def colf(tr, name):
    c = tr['cols'].get(name)
    return None if c is None else np.array([np.nan if x is None else float(x) for x in c])

# ----------------------------------------------------------------------------------------------------------------------
class Table:
    def __init__(self): self.rows = []
    def add(self, ruler, src, value, target='-', ok=None, note=''):
        self.rows.append((ruler, src, value, target, '-' if ok is None else ('pass' if ok else 'FAIL'), note))
    def show(self, md=None):
        w = [max(len(str(r[i])) for r in self.rows + [('ruler', 'src', 'value', 'target', 'pass', 'note')]) for i in range(6)]
        head = ('ruler', 'source', 'value', 'target', 'pass', 'note')
        line = lambda r: '  '.join(str(r[i]).ljust(w[i]) for i in range(6)).rstrip()
        print('\n' + line(head)); print('  '.join('-' * w[i] for i in range(6)))
        for r in self.rows: print(line(r))
        n = sum(1 for r in self.rows if r[4] == 'pass'); f = sum(1 for r in self.rows if r[4] == 'FAIL')
        print(f"\n{n} pass, {f} fail, {len(self.rows) - n - f} reported (no target)")
        if md:
            with open(md, 'w') as fh:
                fh.write('| ruler | source | value | target | pass | note |\n|---|---|---|---|---|---|\n')
                for r in self.rows: fh.write('| ' + ' | '.join(str(x).replace('|', '/') for x in r) + ' |\n')
            print('md ->', md)
        return f

def lag_rows(T, tb, name, det_f, ages, truth, label, src):
    """Event lag + F-measure for one class. det_f = frames, ages = the <x>Age column (or None)."""
    if det_f is None: T.add(f'{label} lag', src, 'absent'); T.add(f'{label} F +-30ms', src, 'absent'); return
    dt = tb[det_f]
    pairs, missed, extra = match(dt, truth, TOL_EV)
    if pairs:
        lag = np.array([d - r for d, r in pairs])
        T.add(f'{label} lag first-frame', src, f'med {1000 * np.median(lag):+.0f} p90 {1000 * np.percentile(lag, 90):+.0f} max {1000 * lag.max():+.0f} ms',
              f'med<={1000 * LAG_MED:.0f} p90<={1000 * LAG_P90:.0f} max<={1000 * LAG_MAX:.0f}',
              abs(np.median(lag)) <= LAG_MED and np.percentile(lag, 90) <= LAG_P90 and lag.max() <= LAG_MAX, f'n={len(pairs)}')
        if ages is not None:
            pl = np.array([tb[i] - ages[i] for i in det_f])
            pp, _, _ = match(pl, truth, TOL_EV)
            if pp:
                pg = np.array([d - r for d, r in pp])
                T.add(f'{label} lag placed', src, f'med {1000 * np.median(pg):+.0f} p90 {1000 * np.percentile(pg, 90):+.0f} max {1000 * np.abs(pg).max():.0f} ms',
                      f'|med|<={1000 * LAG_MED:.0f}', abs(np.median(pg)) <= LAG_MED, f'n={len(pp)}')
        else: T.add(f'{label} lag placed', src, 'absent (no age column)')
    else: T.add(f'{label} lag first-frame', src, 'no match', '-', False, f'{len(dt)} detected, {len(truth)} truth')
    F, p, r, tp, ms, ex = fmeasure(dt, truth)
    tgt, ok = (f'>= {F_KICK:.2f}', F >= F_KICK) if label == 'kick' else ('-', None)
    T.add(f'{label} F +-30ms', src, f'{F:.3f} (P {p:.3f} R {r:.3f})', tgt, ok, f'tp {tp} miss {ms} extra {ex}')

def run(trace, truth, win=None, md=None, ann=None):
    tb = np.array(trace['t'], float); fps = trace.get('fps', 60)
    sel = np.ones(len(tb), bool)
    if win: sel = (tb >= win[0]) & (tb < win[1])
    tsel = (lambda a: a[(a >= win[0]) & (a < win[1])]) if win else (lambda a: a)
    T = Table()
    print(f"trace: {trace.get('track')} mode {trace.get('mode')} sr {trace.get('sr')} fps {fps} "
          f"{len(tb)} frames {tb[0]:.3f}-{tb[-1]:.3f} s, {len(trace['fields'])} fields"
          + (f'  window {win[0]}-{win[1]} s' if win else ''))
    on = truth['onsets']; bare = np.array(truth.get('bare808', []), float)
    TR = {'kick': np.array(on['click'], float), 'snare': np.array(on['mid'], float), 'hat': np.array(on['high'], float)}
    frames = np.where(sel)[0]
    inw = lambda ix: np.array([i for i in ix if sel[i]], dtype=int) if len(ix) else np.array([], int)
    # --- percussion: the new ears, then the old baseline
    for cls in ('kick', 'snare', 'hat'):
        ev, ag = colf(trace, cls + 'Evt'), colf(trace, cls + 'Age')
        lag_rows(T, tb, cls, inw(evframes(trace['cols'][cls + 'Evt'])) if ev is not None else None,
                 ag, tsel(TR[cls]), cls, 'new')
    for cls, old in (('kick', 'kick'), ('snare', 'snare'), ('hat', 'hat')):
        c = trace['cols'].get(old)
        lag_rows(T, tb, cls, inw(riseframes(c)) if c is not None else None, None, tsel(TR[cls]), cls, 'old ' + old)
    c = trace['cols'].get('onset')
    lag_rows(T, tb, 'onset', inw(evframes(c)) if c is not None else None, None,
             tsel(np.sort(np.r_[TR['kick'], TR['snare'], TR['hat']])), 'onset(any)', 'old onset')
    # --- kicks landing on bare 808 note starts
    kev = trace['cols'].get('kickEvt')
    if kev is not None and len(bare):
        kt = tb[inw(evframes(kev))]
        hit = sum(1 for v in kt if len(bare) and np.min(np.abs(bare - v)) <= TOL_BARE)
        pct = 100 * hit / max(1, len(kt))
        T.add('kicks on bare 808s', 'new', f'{pct:.1f} % ({hit}/{len(kt)})', '<= 5 %', pct <= 5.0)
    else: T.add('kicks on bare 808s', 'new', 'absent')
    # --- sub pitch
    # `fps` in the contour is the nominal 100; `fpsExact` is 2205/22 = 100.2273 and is what the frames actually are. Using
    # the nominal one drifts 358 ms over a 157 s track, which is 2.4 semitones of an 808 slide: the ruler then reads the
    # wrong reference frame and the engine looks 27 points worse than it is (72.7 % against 99.8 %). See trackmap.py.
    ct = truth['contour']['f0td']; c0 = ct['t0']; cf = ct.get('fpsExact', ct['fps']); cf0 = np.array(ct['f0'], float)
    sh = np.array(truth['contour']['sub'], float); st10 = np.array(truth['contour']['t'], float)
    sub = colf(trace, 'subHz')
    if sub is not None:
        ti = np.clip(np.round((tb - c0) * cf).astype(int), 0, len(cf0) - 1)
        tf0 = cf0[ti]; tsub = np.interp(tb, st10, sh)
        m = sel & (tf0 > 0) & (tsub >= SUB_LOUD) & np.isfinite(sub) & (sub > 0)
        if m.sum():
            cents = 1200 * np.log2(sub[m] / tf0[m])
            # an octave error is reported separately from a cents error
            oct_ = np.abs(np.abs(cents) - 1200) < 60
            good = 100 * np.mean(np.abs(cents) <= CENTS_OK)
            T.add('sub pitch +-30 cents', 'new', f'{good:.1f} % of {int(m.sum())} sub-loud frames', '>= 90 %', good >= 90.0,
                  f'med |c| {np.median(np.abs(cents)):.1f}, octave errors {100 * oct_.mean():.1f} %')
        else: T.add('sub pitch +-30 cents', 'new', 'no sub-loud frames in the window')
    else: T.add('sub pitch +-30 cents', 'new', 'absent')
    T.add('sub pitch +-30 cents', 'old', 'absent', '-', None, 'v3 has no sub pitch: pcOf bins are 5.4-5.9 Hz, a semitone at C#1 is 2 Hz')
    # --- slides
    tsl = [s for s in truth.get('sub_slides', []) if (not win or win[0] <= s['t0'] < win[1])]
    gl = colf(trace, 'subGlide')
    if gl is not None and sub is not None:
        d = trace_slides(tb, sub, gl)
        d = [s for s in d if (not win or win[0] <= s[0] < win[1])]
        pairs, missed, extra = match([s[0] for s in d], [s['t0'] for s in tsl], 0.25)
        sign_ok = 0
        for dd, rr in pairs:
            ds = next(s for s in d if s[0] == dd); ts = next(s for s in tsl if s['t0'] == rr)
            sign_ok += int(np.sign(ds[2]) == np.sign(ts['semi']))
        # SLIDE_FLOOR is calibrated on the synthetic trace: trace_slides on the truth's OWN contour, resampled to 60 fps,
        # recovers ~37 % of the 100 Hz find_slides list (a 0.08-0.17 s glide is 5-10 frames at 60 Hz). So half is the bar.
        T.add('slides detected', 'new', f'{len(pairs)} of {len(tsl)} truth ({len(extra)} extra)',
              '>= 50 % matched, sign right >= 90 %',
              len(tsl) > 0 and len(pairs) >= 0.5 * len(tsl) and sign_ok >= 0.9 * max(1, len(pairs)),
              f'sign right {sign_ok}/{max(1, len(pairs))}, median span {np.median([s[1] - s[0] for s in d]) if d else 0:.3f} s '
              f'(truth median {np.median([s["t1"] - s["t0"] for s in tsl]) if tsl else 0:.3f} s)')
    else: T.add('slides detected', 'new', 'absent')
    T.add('slides detected', 'old', 'absent', '-', None, 'nothing in v0.14 measures a glide')
    # --- structure: drops
    tdr = np.array(truth.get('drops', []), float); fr = 1.0 / fps
    for src, fld in (('new', 'mapDropEvt'), ('old', 'dropEvt')):
        c = trace['cols'].get(fld)
        if c is None: T.add('drops', src, 'absent'); continue
        dt = tb[inw(evframes(c))]; pairs, missed, extra = match(dt, tsel(tdr), 2 * fr)
        T.add('drops', src, f"{len(pairs)}/{len(tsel(tdr))} at {' '.join('%.3f' % d for d, _ in pairs) or '-'}",
              'exact +-1 frame, none elsewhere', len(missed) == 0 and len(extra) == 0,
              f"extra {' '.join('%.2f' % v for v in extra) if len(extra) else 'none'}; "
              f"max |lag| {1000 * max((abs(d - r) for d, r in pairs), default=0):.0f} ms")
    # --- structure: boundaries
    bl = [s['t0'] for s in (ann['sections'] if ann else truth.get('sections', []))]
    beat = truth.get('bpm_grid', {}).get('beat', 0.4)
    for src, fld in (('new', 'mapBoundaryEvt'), ('old', 'boundaryEvt')):
        c = trace['cols'].get(fld)
        if c is None: T.add('boundaries +-1 beat', src, 'absent'); continue
        dt = tb[inw(evframes(c))]; ref = tsel(np.array(bl, float))
        pairs, missed, extra = match(dt, ref, beat)
        T.add('boundaries +-1 beat', src, f'{len(pairs)} of {len(ref)} within {beat:.3f} s', 'all',
              len(pairs) == len(ref), f'{len(extra)} extra; ' +
              ' '.join('%.2f%+.2fb' % (r, (d - r) / beat) for d, r in pairs[:8]))
    # --- returns + section labels
    ms_, mr = colf(trace, 'mapSection'), colf(trace, 'mapReturn')
    if ms_ is not None and mr is not None:
        secs = truth.get('sections', []); rets = [s for s in secs if s.get('ret')]
        got = 0
        for s in rets:
            m = sel & (tb >= s['t0']) & (tb < s['t1'])
            if m.sum() and np.nanmean(mr[m]) > 0.5: got += 1
        T.add('returns labelled', 'new', f'{got} of {len(rets)}', 'all', len(rets) > 0 and got == len(rets),
              f'{int(np.nanmax(ms_[sel]) + 1) if sel.any() else 0} distinct section labels seen')
    else: T.add('returns labelled', 'new', 'absent')
    sa = trace['cols'].get('sectionAlt')
    T.add('returns labelled', 'old', 'absent' if sa is None else 'sectionAlt only (no return flag)', '-', None,
          'synapse names a section 4-8 beats after its boundary (DECISIONS §10)')
    # --- tonic
    tt = truth.get('tonic', {})
    tn, tm_ = colf(trace, 'tonic'), colf(trace, 'tonicMinor')
    if tn is not None:
        last = tn[sel][-max(1, int(0.25 * sel.sum())):]
        pc = int(np.bincount(last[np.isfinite(last)].astype(int), minlength=12).argmax())
        mi = int(round(float(np.nanmean(tm_[sel][-len(last):])))) if tm_ is not None else -1
        first = next((tb[i] for i in frames if np.isfinite(tn[i]) and int(tn[i]) == tt.get('pc', -1)), None)
        T.add('tonic', 'new', f"{NAMES[pc]}{' minor' if mi == 1 else ' major' if mi == 0 else ''}",
              f"{tt.get('name')}{' minor' if tt.get('minor') else ' major'}",
              pc == tt.get('pc') and (mi == tt.get('minor') or mi < 0),
              f"first right at {first:.1f} s" if first is not None else 'never right')
    else: T.add('tonic', 'new', 'absent')
    ky, mo = trace['cols'].get('key'), trace['cols'].get('mode')
    if ky is not None:
        k = np.array([x for x in ky if x is not None], float)
        pc = int(np.bincount(k[np.isfinite(k)].astype(int) % 12, minlength=12).argmax()) if len(k) else -1
        T.add('tonic', 'old key', NAMES[pc] if pc >= 0 else '-', f"{tt.get('name')}", pc == tt.get('pc'),
              'synapse key chroma starts at 65 Hz (anatomy.js:106): the 35 Hz root is invisible')
    else: T.add('tonic', 'old key', 'absent')
    return T.show(md)

GL_SEMI, GL_MINT, GL_MAXT, GL_MAXJ, GL_HOLD, GL_HTOL = 1.0, 0.05, 0.5, 1.5, 3, 0.5
def trace_slides(tb, sub, gl=None):
    """Glides in a trace's `subHz`, by the same shape of rule as the truth tool's find_slides (so the two counts compare):
    the largest monotone move of >= GL_SEMI semitones inside GL_MINT..GL_MAXT s with no frame jumping more than GL_MAXJ
    semitone, landing on a note held within GL_HTOL semitone for GL_HOLD frames. `gl` (subGlide) is only used for its sign."""
    n = len(tb); ok = np.isfinite(sub) & (sub > 0)
    st = np.where(ok, 12 * np.log2(np.maximum(sub, 1e-9) / 55.0), np.nan)
    out = []; i = 0
    while i < n - 2:
        if not ok[i]: i += 1; continue
        j = i; best = None
        while (j + 1 < n and ok[j + 1] and abs(st[j + 1] - st[j]) <= GL_MAXJ and tb[j + 1] - tb[i] <= GL_MAXT):
            j += 1; d = st[j] - st[i]
            if tb[j] - tb[i] >= GL_MINT and abs(d) >= GL_SEMI and (best is None or abs(d) > abs(best[1])): best = (j, d)
        if best:
            j2, d = best; a1 = min(n, j2 + GL_HOLD + 1)
            if (np.all(np.diff(st[i:j2 + 1]) * np.sign(d) > -0.3) and ok[j2:a1].all() and np.ptp(st[j2:a1]) < GL_HTOL):
                out.append((float(tb[i]), float(tb[j2]), float(d))); i = j2 + 1; continue
        i += 1
    return out

def make_synth(truth, out, shift=0.0, fps=60, fields=None):
    """A trace built from the truth itself: every ruler must come out perfect (F = 1, lag = `shift`). The step-2 proof."""
    on = truth['onsets']; ct = truth['contour']['f0td']; dur = truth['summary']['seconds']
    n = int(dur * fps); tb = np.round(np.arange(n) / fps, 6)
    cols = {}
    for cls, key in (('kick', 'click'), ('snare', 'mid'), ('hat', 'high')):
        ev = np.zeros(n, int); age = np.full(n, 99.0)
        for v in on[key]:
            k = int(np.ceil((v + shift) * fps))
            if 0 <= k < n: ev[k] = 1
        last = -1
        for k in range(n):
            if ev[k]: last = k
            if last >= 0: age[k] = tb[k] - (tb[last] - shift)
        cols[cls + 'Evt'] = ev.tolist(); cols[cls + 'Age'] = np.round(age, 5).tolist()
        cols[cls] = np.clip(np.maximum.accumulate(np.where(ev > 0, 1.0, 0.0)) * 0 + ev, 0, 1).tolist()
    f0 = np.array(ct['f0'], float)
    ti = np.clip(np.round((tb - ct['t0']) * ct.get('fpsExact', ct['fps'])).astype(int), 0, len(f0) - 1)
    cols['subHz'] = np.round(f0[ti], 3).tolist()
    v = f0[ti] > 0; st = 12 * np.log2(np.maximum(f0[ti], 1e-6) / 55.0)
    g = np.r_[0, np.diff(st)] * fps; g[~v] = 0; g[1:][~v[:-1]] = 0     # no glide across an unvoiced gap
    cols['subGlide'] = np.round(g, 3).tolist()
    for fld, times in (('mapDropEvt', truth.get('drops', [])),
                       ('mapBoundaryEvt', [s['t0'] for s in truth.get('sections', [])])):
        ev = np.zeros(n, int)
        for v in times:
            k = int(np.ceil((v + shift) * fps))
            if 0 <= k < n: ev[k] = 1
        cols[fld] = ev.tolist()
    lab = np.zeros(n, int); ret = np.zeros(n, int)
    for s in truth.get('sections', []):
        m = (tb >= s['t0']) & (tb < s['t1']); lab[m] = s['label']; ret[m] = s.get('ret', 0)
    cols['mapSection'] = lab.tolist(); cols['mapReturn'] = ret.tolist()
    tt = truth.get('tonic', {})
    cols['tonic'] = [tt.get('pc', 0)] * n; cols['tonicMinor'] = [1 if tt.get('minor') else 0] * n
    tr = dict(track=truth['summary']['track'], mode='node', sr=44100, at=0, fps=fps, detLead=0.0,
              fields=sorted(cols), f=list(range(n)), t=tb.tolist(), cols=cols, log=[])
    json.dump(tr, open(out, 'w')); print('synthetic trace ->', out, f'({n} frames, shift {1000 * shift:.0f} ms)')

if __name__ == '__main__':
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    if a[0] == '--make-synth':
        sh = next((float(x.split('=')[1]) / 1000 for x in a if x.startswith('--shift')), 0.0)
        make_synth(ld(a[1]), a[2], sh); sys.exit(0)
    tp = next((a[i + 1] for i, x in enumerate(a) if x == '--truth'), None)
    tr = ld(a[0])
    if tp is None: tp = os.path.join(HERE, (tr.get('track') or 'SeeYouDrop') + '.json')
    th = ld(tp); ap = tp.replace('.json', '.sections.json')
    ann = ld(ap) if os.path.isfile(ap) else None
    wn = next((tuple(float(v) for v in a[i + 1].split(',')) for i, x in enumerate(a) if x == '--win'), None)
    md = next((a[i + 1] for i, x in enumerate(a) if x == '--md'), None)
    print(f'truth: {os.path.relpath(tp)}' + (f'  annotation: {os.path.relpath(ap)}' if ann else '  (no annotation)'))
    sys.exit(1 if run(tr, th, wn, md, ann) else 0)
