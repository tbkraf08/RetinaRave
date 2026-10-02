#!/usr/bin/env python3
"""The KEY truth, independent of engine/ears/tonic.js (NEXT-SESSION-PROMPT item 2, measurement only).

Reads tools/work/<T>.48000.st.f32 (never regenerated here) and tools/truth/<T>.json (the sections), and for the whole
track, the loud half and every section builds THREE profiles with its own numpy STFTs:
  mid chroma   130-2100 Hz, power per pitch class (the ears' band, our own FFT: 6 kHz decimate, 4096 window = 1.46 Hz bins)
  bass chroma  25-260 Hz, the spectral PEAKS (parabolic, 1.2 kHz decimate, 2048 window = 0.59 Hz bins), power-weighted
  bass note    the LOUDEST bass peak per 0.25 s frame -> a pitch-class histogram (energy share); the tonic-by-bass is its mode
then Krumhansl-Schmuckler on 24 profiles (Krumhansl-Kessler, the ears' table; and Temperley's as a second ruler) over
  mid alone, bass alone and mid + bass (equal weight). Reports top-3 per profile with margins, the tonic-by-bass with its
share, and a verdict: CONFIRMED when KS (mid+bass, KK) and the bass tonic agree; FIFTH/RELATIVE-AMBIGUOUS when the KS
top two are a fifth or a relative pair and the margin is under AMB; otherwise SPLIT (the user's ear decides).
  python3 tools/truth/key-truth.py [Track ...] [--md tools/work/v84/truth.md]     -> tools/work/v84/truth-<T>.json
"""
import json, os, sys
import numpy as np
from scipy import signal

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'tools/work/v84'); os.makedirs(OUT, exist_ok=True)
NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
KK_MAJ = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
KK_MIN = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
TP_MAJ = np.array([5.0, 2.0, 3.5, 2.0, 4.5, 4.0, 2.0, 4.5, 2.0, 3.5, 1.5, 4.0])
TP_MIN = np.array([5.0, 2.0, 3.5, 4.5, 2.0, 4.0, 2.0, 4.5, 3.5, 2.0, 1.5, 4.0])
HOP = 0.25
AMB = 0.05            # KS margin under which the audio itself is ambiguous (the user's ear decides)


def kname(k): return NAMES[k % 12] + ('m' if k >= 12 else 'M')


def load(track):
    p = os.path.join(ROOT, 'tools/work', f'{track}.48000.st.f32')
    meta = json.load(open(p + '.json'))
    x = np.fromfile(p, dtype=np.float32).reshape(-1, 2)
    return 0.5 * (x[:, 0] + x[:, 1]).astype(np.float64), meta['sr']


def pc_of(f): return int(np.round(69 + 12 * np.log2(f / 440.0))) % 12


def stft_frames(y, sr, n, hop):
    w = np.hanning(n)
    nf = max(1, (len(y) - n) // hop + 1)
    t = np.arange(nf) * hop / sr + n / 2 / sr
    S = np.empty((nf, n // 2 + 1))
    for i in range(nf):
        S[i] = np.abs(np.fft.rfft(y[i * hop:i * hop + n] * w)) ** 2
    return t, S, np.fft.rfftfreq(n, 1 / sr)


def mid_chroma(mono, sr):
    y = signal.decimate(mono, 8, zero_phase=True); s = sr // 8           # 6 kHz
    n = 4096; t, S, f = stft_frames(y, s, n, int(HOP * s))
    sel = (f >= 130) & (f < 2100)
    pcs = np.array([pc_of(v) for v in f[sel]])
    C = np.zeros((len(t), 12))
    for k in range(12): C[:, k] = S[:, sel][:, pcs == k].sum(1)
    return t, C


def bass_frames(mono, sr):
    y = signal.decimate(signal.decimate(mono, 8, zero_phase=True), 5, zero_phase=True); s = sr // 40   # 1.2 kHz
    n = 2048; t, S, f = stft_frames(y, s, n, int(HOP * s))
    lo, hi = np.searchsorted(f, 25), np.searchsorted(f, 260)
    C = np.zeros((len(t), 12)); note = np.full(len(t), -1); npow = np.zeros(len(t))
    for i in range(len(t)):
        m = S[i]
        pk = [j for j in range(lo + 1, hi - 1) if m[j] > m[j - 1] and m[j] >= m[j + 1]]
        if not pk: continue
        best = None
        for j in pk:
            a, b, c = np.log(m[j - 1] + 1e-20), np.log(m[j] + 1e-20), np.log(m[j + 1] + 1e-20)
            d = 0.5 * (a - c) / (a - 2 * b + c) if (a - 2 * b + c) != 0 else 0
            fr = (j + d) * (f[1] - f[0]); p = m[j]
            if p < 0.05 * m[pk].max(): continue
            C[i, pc_of(fr)] += p
            if best is None or p > best[1]: best = (fr, p)
        note[i] = pc_of(best[0]); npow[i] = best[1]
    return t, C, note, npow


def ks(prof, PM, Pm):
    c = prof - prof.mean()
    if not c.std() > 0: return np.full(24, -1.0)
    r = np.zeros(24)
    for mi, P in enumerate((PM, Pm)):
        p = P - P.mean()
        for k in range(12):
            r[mi * 12 + k] = (c * np.roll(p, k)).sum() / (np.linalg.norm(c) * np.linalg.norm(p))
    return r


def top3(r):
    o = np.argsort(-r)[:3]
    return [(kname(int(k)), round(float(r[k]), 4)) for k in o], round(float(r[o[0]] - r[o[1]]), 4)


def relation(a, b):
    ta, tb = a % 12, b % 12; ma, mb = a >= 12, b >= 12
    if ma == mb and (tb - ta) % 12 in (5, 7): return 'fifth'
    if ma != mb and ((not ma and (tb - ta) % 12 == 9) or (ma and (tb - ta) % 12 == 3)): return 'relative'
    if ta == tb and ma != mb: return 'parallel'
    return 'other'


def grade(name, sel_m, sel_b, Cm, Cb, note, npow):
    pm = Cm[sel_m].sum(0); pb = Cb[sel_b].sum(0)
    nm = pm / (pm.sum() + 1e-20); nb = pb / (pb.sum() + 1e-20)
    hist = np.zeros(12)
    for k, p in zip(note[sel_b], npow[sel_b]):
        if k >= 0: hist[k] += p
    hist /= hist.sum() + 1e-20
    bass_tonic = int(np.argmax(hist)); bshare = float(hist[bass_tonic])
    o = np.argsort(-hist); peak = float(hist[o[0]] - hist[o[1]])
    res = {'name': name, 'frames': int(sel_m.sum()), 'mid': nm.round(4).tolist(), 'bass': nb.round(4).tolist(),
           'bassHist': hist.round(4).tolist(), 'bassTonic': NAMES[bass_tonic], 'bassShare': round(bshare, 3), 'bassPeak': round(peak, 3)}
    for lab, prof in (('mid', nm), ('bass', nb), ('mid+bass', 0.5 * nm + 0.5 * nb)):
        for pn, (PM, Pm) in (('KK', (KK_MAJ, KK_MIN)), ('TP', (TP_MAJ, TP_MIN))):
            r = ks(prof, PM, Pm); t3, mg = top3(r)
            o2 = np.argsort(-r)[:2]
            res[f'{lab}/{pn}'] = {'top3': t3, 'margin': mg, 'rel12': relation(int(o2[0]), int(o2[1])), 'r': r.round(4).tolist()}
    # the verdict: KK on mid+bass vs the bass tonic
    kkb = res['mid+bass/KK']; win = kkb['top3'][0][0]; wt = NAMES.index(win.rstrip('mM'))
    r = np.array(kkb['r']); o2 = np.argsort(-r)[:2]
    agree = (wt == bass_tonic)
    if agree and kkb['margin'] >= AMB: v = 'CONFIRMED'
    elif agree: v = 'confirmed-by-bass (KS margin %.3f < %.2f, top-2 %s)' % (kkb['margin'], AMB, kkb['rel12'])
    elif kkb['rel12'] in ('fifth', 'relative') and (o2[1] % 12) == bass_tonic:
        v = 'BASS-PICKS-SECOND: KS %s vs %s (%s, margin %.3f); the bass tonic %s says %s' % (
            kname(int(o2[0])), kname(int(o2[1])), kkb['rel12'], kkb['margin'], NAMES[bass_tonic], kname(int(o2[1])))
    else: v = 'SPLIT: KS %s (margin %.3f, %s) vs bass tonic %s (%.0f %%)' % (win, kkb['margin'], kkb['rel12'], NAMES[bass_tonic], 100 * bshare)
    res['verdict'] = v
    return res


def run(track):
    mono, sr = load(track)
    truth = json.load(open(os.path.join(ROOT, 'tools/truth', f'{track}.json')))
    tm, Cm = mid_chroma(mono, sr); tb, Cb, note, npow = bass_frames(mono, sr)
    # loudness per mid frame (the loud half)
    e = Cm.sum(1); loud = e >= np.median(e[e > 0])
    el = np.interp(tb, tm, e); loudb = el >= np.median(e[e > 0])
    out = {'track': track, 'sr': sr, 'hop': HOP, 'sections': []}
    out['whole'] = grade('whole', np.ones(len(tm), bool), np.ones(len(tb), bool), Cm, Cb, note, npow)
    out['loud'] = grade('loud half', loud, loudb, Cm, Cb, note, npow)
    secs = truth.get('sections', [])
    for s in secs:
        t0, t1 = s['t0'], s['t1']
        sm = (tm >= t0) & (tm < t1); sb = (tb >= t0) & (tb < t1)
        if sm.sum() < 4: continue
        g = grade(f"s{s['id']} L{s['label']}{'r' if s.get('ret') else ''} {t0:.1f}-{t1:.1f}", sm, sb, Cm, Cb, note, npow)
        g.update({'t0': t0, 't1': t1, 'id': s['id'], 'label': s['label'], 'ret': s.get('ret', 0)}); out['sections'].append(g)
    for lab, d in (('drops', truth.get('drops_user') or truth.get('drops', [])),):
        for i, t0 in enumerate(d):
            sm = (tm >= t0) & (tm < t0 + 16); sb = (tb >= t0) & (tb < t0 + 16)
            if sm.sum() < 4: continue
            out.setdefault('drops', []).append(grade(f'drop{i + 1} {t0:.1f}+16s', sm, sb, Cm, Cb, note, npow))
    json.dump(out, open(os.path.join(OUT, f'truth-{track}.json'), 'w'))
    return out


def md(outs):
    L = []
    for o in outs:
        L.append(f"\n### {o['track']}\n")
        L.append('| window | KK mid+bass top-3 (r) | margin | top-2 rel | KK mid | KK bass | TP mid+bass | bass tonic (share, peak) | verdict |')
        L.append('|---|---|---|---|---|---|---|---|---|')
        for g in [o['whole'], o['loud']] + o.get('drops', []) + o['sections']:
            f = lambda k: ' '.join(f'{n} {r:+.3f}' for n, r in g[k]['top3'])
            L.append(f"| {g['name']} | {f('mid+bass/KK')} | {g['mid+bass/KK']['margin']:.3f} | {g['mid+bass/KK']['rel12']} | "
                     f"{g['mid/KK']['top3'][0][0]} {g['mid/KK']['margin']:.3f} | {g['bass/KK']['top3'][0][0]} {g['bass/KK']['margin']:.3f} | "
                     f"{g['mid+bass/TP']['top3'][0][0]} {g['mid+bass/TP']['margin']:.3f} | {g['bassTonic']} ({100 * g['bassShare']:.0f} %, {g['bassPeak']:.2f}) | {g['verdict']} |")
    return '\n'.join(L)


if __name__ == '__main__':
    av = sys.argv[1:]
    if '--md' in av: i = av.index('--md'); av = av[:i] + av[i + 2:]
    args = [a for a in av if not a.startswith('--')]
    tracks = args or ['SeeYouDrop', 'CyborgNinja', 'WhoLikesToParty', 'Malicious', 'Vienna']
    outs = [run(t) for t in tracks]
    txt = md(outs); print(txt)
    if '--md' in sys.argv: open(sys.argv[sys.argv.index('--md') + 1], 'w').write(txt)
