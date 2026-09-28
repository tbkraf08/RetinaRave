#!/usr/bin/env python3
"""Grade the engine's LIVE beat / bar / phrase clocks against the offline truth grid — the ruler compare.py does not have.
Engine-independent (numpy only); reuses compare.py's Table and matcher.

    python3 tools/truth/gridcheck.py tools/work/grid/SeeYouDrop-det.json [--truth <json>] [--md <out.md>] [--sections] [--win t0,t1]

What it grades (every clock the scenes read):
  v3       bpm, beatPhase, beat        engine/features.js + tempo.js (canonical, uBeat)
  synapse  bpmSyn, beatSyn, barPos,    engine/features-synapse.js (the bar / phrase grid the director quantises to)
           phrase16Pos, dropExpectedIn
against the truth tool's grid (`beats`, `downbeats`, `bpm_grid`; trackmap.py) and its drops / section starts.

Conventions. Truth beat phase phi(t) = (t - b_k) / (b_k+1 - b_k) on the truth beat list. An engine clock's LAG is how
late its beat line is: lag = (phi - enginePhase) * P, wrapped to half a beat, in ms — positive = the visual beat lands
after the audible one. Phase is only graded on frames whose tempo is in the right octave (a double-time clock has no
meaningful phase against a single-time grid); the tempo rows say how many frames that is.

Truth caveat (2026-09-28): only SeeYouDrop's grid is hand-checked (its kicks sit +4 ms after its beats). CyborgNinja's
kicks cluster at beat phase 0.19 / 0.69 (the grid's phase is ~70 ms off) and Malicious' are uniform over the beat (DP
residual 90 ms), so on those tracks read the TEMPO rows only.

Caveat, stated where it is printed: the trace's `t` is heardT. In a deterministic file trace the analysers see the
audio DET_LEAD (42.7 ms) before it is heard, as in a real-time window; a CAPTURE run sees it L after (the capture lag,
SYNC_OFS). So a det-trace lag is the clock's own error; capture adds L on top unless the clock is run ahead by it.
"""
import json, os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from compare import Table, match, fmeasure, evframes, colf, ld, HERE

TOL_BEAT = 0.050        # beat-event matching window (the MIREX-style +-50 ms is 70; 50 is tighter and still > 3 frames)
LOCK_MS = 30.0          # a frame is "on the beat" when |lag| <= this (under two 60 Hz frames)
BPM_TOL = 1.0

def wrap(x, m=1.0): return (x + m / 2) % m - m / 2

class Grid:
    def __init__(self, truth):
        self.b = np.array(truth['beats'], float)
        self.db = np.array(truth['downbeats'], float)
        self.P = np.diff(self.b)
        # beat index of each downbeat, for the bar position of any beat
        self.dbi = np.searchsorted(self.b, self.db - 1e-4)
    def at(self, t):
        """-> (valid, phi in [0,1), local period, beat index k, bar position in beats [0,4))"""
        k = np.searchsorted(self.b, t, side='right') - 1
        ok = (k >= 0) & (k < len(self.b) - 1)
        kc = np.clip(k, 0, len(self.P) - 1)
        per = self.P[kc]; phi = np.where(ok, (t - self.b[np.clip(k, 0, len(self.b) - 1)]) / per, 0)
        # the downbeat at or before beat k
        j = np.searchsorted(self.dbi, kc, side='right') - 1
        barpos = np.where(j >= 0, (kc - self.dbi[np.clip(j, 0, len(self.dbi) - 1)]) % 4 + phi, np.nan)
        return ok, phi, per, kc, barpos

def octave(eng, ref):
    """-> labels per frame: 'ok' within BPM_TOL, 'x2', 'x0.5', 'x1.5', 'x0.67' (within 2 %), 'off'."""
    r = eng / ref
    lab = np.full(len(eng), 'off', dtype=object)
    for name, f in (('x2', 2), ('x0.5', 0.5), ('x1.5', 1.5), ('x0.67', 2 / 3)):
        lab[np.abs(r - f) <= 0.02 * f] = name
    lab[np.abs(eng - ref) <= BPM_TOL] = 'ok'
    lab[~np.isfinite(eng)] = 'off'
    return lab

def tempo_row(T, name, eng, ref, sel, src):
    if eng is None: T.add(f'tempo +-{BPM_TOL:.0f} BPM', src, 'absent'); return None
    lab = octave(eng, ref)
    n = max(1, sel.sum()); pct = lambda k: 100 * np.sum(sel & (lab == k)) / n
    others = ', '.join(f'{k} {pct(k):.0f} %' for k in ('x2', 'x0.5', 'x1.5', 'x0.67', 'off') if pct(k) >= 0.5)
    T.add(f'tempo +-{BPM_TOL:.0f} BPM ({name})', src, f'{pct("ok"):.1f} % of frames', '-', None,
          f'median {np.nanmedian(eng[sel]):.2f} vs truth {np.median(ref[sel]):.2f}; ' + (others or 'no octave errors'))
    return lab == 'ok'

def phase_rows(T, name, eph, phi, per, ok, src):
    """eph: engine phase in [0,1) per frame, graded on `ok` frames. -> lag array (ms) on those frames."""
    if eph is None or ok.sum() == 0: T.add(f'{name} lag', src, 'absent' if eph is None else 'no in-octave frames'); return None
    lag = 1000 * wrap(phi[ok] - eph[ok]) * per[ok]
    within = 100 * np.mean(np.abs(lag) <= LOCK_MS)
    T.add(f'{name} lag (continuous)', src,
          f'med {np.median(lag):+.0f} ms, |lag| p50 {np.median(np.abs(lag)):.0f} p90 {np.percentile(np.abs(lag), 90):.0f} ms',
          '-', None, f'{within:.0f} % of in-octave frames within +-{LOCK_MS:.0f} ms (n={ok.sum()})')
    # a constant bias is one number away from fixed (SYNC_OFS / a lead); the spread around it is the clock's real error
    dev = lag - np.median(lag)
    T.add(f'{name} jitter (bias removed)', src,
          f'|dev| p50 {np.median(np.abs(dev)):.0f} p90 {np.percentile(np.abs(dev), 90):.0f} ms', '-', None,
          f'{100 * np.mean(np.abs(dev) <= LOCK_MS):.0f} % within +-{LOCK_MS:.0f} ms of its own median')
    return lag

def lock_time(tb, good, win=4.0, frac=0.9):
    """First t where the next `win` seconds have >= frac of frames good."""
    n = len(tb); fps = 1 / max(1e-6, np.median(np.diff(tb))); w = int(win * fps)
    if n < w: return None
    c = np.r_[0, np.cumsum(good.astype(int))]
    s = (c[w:] - c[:-w]) / w
    ix = np.where(s >= frac)[0]
    return float(tb[ix[0]]) if len(ix) else None

def run(trace, truth, md=None, ann=None, per_section=False, win=None):
    tb = np.array(trace['t'], float)
    G = Grid(truth)
    ok, phi, per, k, tbar = G.at(tb)
    sel = ok & (tb >= 0)
    if win: sel &= (tb >= win[0]) & (tb < win[1])
    ref = 60 / per
    T = Table()
    g = truth.get('bpm_grid', {})
    print(f"trace: {trace.get('track')} mode {trace.get('mode')} {len(tb)} frames {tb[0]:.2f}-{tb[-1]:.2f} s | truth "
          f"{g.get('bpm')} BPM, beat {g.get('beat')} s, downbeat mod4 {g.get('downbeat_mod4')} "
          f"(scores {g.get('downbeat_scores')}), dp residual {g.get('dp_residual_ms')} ms")
    # ---- v3: bpm, beatPhase, beat
    bpm = colf(trace, 'bpm'); okv3 = tempo_row(T, 'bpm', bpm, ref, sel, 'v3')
    bp = colf(trace, 'beatPhase')
    lag3 = phase_rows(T, 'beatPhase', bp, phi, per, sel & okv3 if okv3 is not None else sel, 'v3') if bp is not None else None
    bev = trace['cols'].get('beat')
    if bev is not None:
        bt = tb[[i for i in evframes(bev) if sel[i]]]
        ref_b = G.b[(G.b >= tb[sel][0]) & (G.b <= tb[sel][-1])]
        F, p, r, tp, ms, ex = fmeasure(bt, ref_b, TOL_BEAT)
        pairs, _, _ = match(bt, ref_b, TOL_BEAT)
        lg = np.array([d - q for d, q in pairs]) * 1000 if pairs else np.array([np.nan])
        T.add(f'beat events F +-{1000 * TOL_BEAT:.0f} ms', 'v3', f'{F:.3f} (P {p:.3f} R {r:.3f})', '-', None,
              f'tp {tp} miss {ms} extra {ex}; lag med {np.nanmedian(lg):+.0f} p90 {np.nanpercentile(np.abs(lg), 90):.0f} ms')
    if lag3 is not None:
        good = np.zeros(len(tb), bool); ii = np.where(sel & okv3)[0]; good[ii] = np.abs(lag3) <= LOCK_MS
        lt = lock_time(tb, good)
        T.add('beatPhase first 4 s locked', 'v3', f'{lt:.1f} s' if lt is not None else 'never', '-', None, f'>= 90 % of frames within +-{LOCK_MS:.0f} ms')
    # ---- synapse: bpmSyn, beatSyn, barPos, phrase16Pos
    bs = colf(trace, 'bpmSyn'); oks = tempo_row(T, 'bpmSyn', bs, ref, sel, 'synapse')
    bsy = colf(trace, 'beatSyn')
    sph = None if bsy is None else np.mod(bsy, 1.0)
    lags = phase_rows(T, 'beatSyn', sph, phi, per, sel & oks if oks is not None else sel, 'synapse') if sph is not None else None
    if lags is not None:
        good = np.zeros(len(tb), bool); ii = np.where(sel & oks)[0]; good[ii] = np.abs(lags) <= LOCK_MS
        lt = lock_time(tb, good)
        T.add('beatSyn first 4 s locked', 'synapse', f'{lt:.1f} s' if lt is not None else 'never', '-', None, f'>= 90 % within +-{LOCK_MS:.0f} ms')
    bpos = colf(trace, 'barPos')
    if bpos is not None and oks is not None:
        m = sel & oks & np.isfinite(tbar)
        off = np.round(wrap(bpos[m] - tbar[m], 4.0)).astype(int) % 4       # which beat of the bar the engine calls 1
        dist = np.bincount(off, minlength=4) / max(1, m.sum()) * 100
        T.add('bar line (barPos)', 'synapse', f'{dist[0]:.1f} % of in-octave frames on the truth downbeat', '-', None,
              'engine bar 1 is truth beat +1 {:.0f} %, +2 {:.0f} %, +3 {:.0f} %'.format(dist[1], dist[2], dist[3]))
        bc = colf(trace, 'barConf')
        if bc is not None:
            T.add('barConf when right / wrong', 'synapse', f'{np.nanmedian(bc[m][off == 0]) if (off == 0).any() else float("nan"):.2f} / '
                  f'{np.nanmedian(bc[m][off != 0]) if (off != 0).any() else float("nan"):.2f}', '-', None, 'median; a useful confidence separates these')
    # ---- phrase: where the engine's 16-beat line sits at the truth's drops and section starts
    drops = (ann or {}).get('drops') or truth.get('drops', [])
    if drops and isinstance(drops[0], dict): drops = [d.get('t', d.get('t0')) for d in drops]
    secs = (ann or {}).get('sections') or truth.get('sections', [])
    starts = [s['t0'] for s in secs][1:]
    p16 = colf(trace, 'phrase16Pos')
    def at_t(col, t):
        i = int(np.searchsorted(tb, t)); return col[i] if 0 <= i < len(tb) else np.nan
    tsel0, tsel1 = (tb[sel][0], tb[sel][-1]) if sel.any() else (0, -1)
    drops = [t for t in drops if tsel0 <= t <= tsel1]
    for label, times in (('drops', drops), ('section starts', starts)):
        if p16 is None or not len(times): continue
        times = [t for t in times if tsel0 <= t <= tsel1]
        offs = [wrap(at_t(p16, t), 16.0) for t in times]
        # the phrase position just AFTER the line: an on-grid line reads ~0 (or ~16 just before) -> wrapped ~0
        on = sum(1 for o in offs if np.isfinite(o) and abs(o) <= 1.0)
        T.add(f'16-beat line at {label}', 'synapse', f'{on} of {len(offs)} within 1 beat', '-', None,
              ' '.join(f'{t:.1f}:{o:+.1f}b' for t, o in zip(times, offs)))
    # ---- anticipation: dropExpectedIn 16 / 8 / 4 beats before each drop
    dei = colf(trace, 'dropExpectedIn'); dc = colf(trace, 'dropConf')
    if dei is not None and len(drops):
        rows = []
        for t in drops:
            bb = G.P[min(len(G.P) - 1, max(0, np.searchsorted(G.b, t) - 1))]
            cells = []
            for nb in (16, 8, 4, 1):
                v = at_t(dei, t - nb * bb); c = at_t(dc, t - nb * bb) if dc is not None else np.nan
                cells.append(f'{nb}b:{"-" if not np.isfinite(v) or v < 0 else f"{v:.1f}"}/{c:.2f}')
            rows.append(f'{t:.1f}[' + ' '.join(cells) + ']')
        T.add('dropExpectedIn / dropConf before drops', 'synapse', f'{len(drops)} drops', '-', None, '; '.join(rows))
    dev = trace['cols'].get('dropEvt')
    if dev is not None and len(drops):
        dt = tb[[i for i in evframes(dev) if sel[i]]]
        bb = truth.get('bpm_grid', {}).get('beat', 0.4)
        pairs, missed, extra = match(dt, np.array(drops, float), 2 * bb)
        T.add('dropEvt within 2 beats', 'v3', f'{len(pairs)}/{len(drops)}', '-', None,
              f"lags {' '.join('%+.0f' % (1000 * (d - r)) for d, r in pairs) or '-'} ms; extra {' '.join('%.1f' % v for v in extra) or 'none'}")
    T.show(md)
    if per_section and lag3 is not None:
        print(f'\nper truth section: share of frames in-octave | on the beat (+-{LOCK_MS:.0f} ms) — v3 beatPhase / synapse beatSyn')
        g3 = np.full(len(tb), np.nan); ii = np.where(sel & okv3)[0]; g3[ii] = np.abs(lag3)
        gs = np.full(len(tb), np.nan)
        if lags is not None: jj = np.where(sel & oks)[0]; gs[jj] = np.abs(lags)
        for s in secs:
            m = sel & (tb >= s['t0']) & (tb < s['t1'])
            if not m.any(): continue
            def cell(gg):
                io = np.isfinite(gg[m]); return f'{100 * io.mean():3.0f} % | {100 * np.mean(gg[m][io] <= LOCK_MS) if io.any() else 0:3.0f} %'
            print(f"  {s['t0']:6.1f}-{s['t1']:6.1f} {str(s.get('label')):>10}  v3 {cell(g3)}   syn {cell(gs)}")

if __name__ == '__main__':
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    tr = ld(a[0])
    tp = next((a[i + 1] for i, x in enumerate(a) if x == '--truth'), None) or os.path.join(HERE, (tr.get('track') or 'SeeYouDrop') + '.json')
    ap = tp.replace('.json', '.sections.json')
    md = next((a[i + 1] for i, x in enumerate(a) if x == '--md'), None)
    wn = next((tuple(float(v) for v in a[i + 1].split(',')) for i, x in enumerate(a) if x == '--win'), None)
    run(tr, ld(tp), md, ld(ap) if os.path.isfile(ap) else None, '--sections' in a, wn)
