#!/usr/bin/env python3
"""The ears' key against the truth, and the tonicConf candidates (NEXT-SESSION-PROMPT item 2, measurement only).

Inputs: tools/work/v84/ears-<T>.json (tools/truth/key-ears.mjs: synapse's key/mode/keyConf, the ears' tonic/tonicMinor/
tonicConf, the ears' 12-bin chroma and the gated sub note, per 60 Hz frame) and tools/work/v84/truth-<T>.json
(tools/truth/key-truth.py: the independent per-section KS + bass-tonic read) and tools/truth/<T>.json (the sections).

Truth per frame, two rulers:
  KEY   the track's key (TRACK_KEY below: SeeYouDrop human-confirmed; the others from key-truth.py, see KEY-PLAN.md)
  LOCAL the section's bass pedal when key-truth.py found one (bassShare >= LOCAL_SHARE) else the track's tonic — a
        section whose bass sits on a non-tonic pedal (SeeYouDrop's climb on G, the void on D; Malicious's G sections) is
        LOCALLY that root; a detector that follows it is not confused, it is early.
A frame is RIGHT when tonic == the key's tonic, LOCAL when tonic == the local root (and not the key's), WRONG otherwise.
(the mode is graded separately: MODE-RIGHT when tonicMinor == the key's mode on RIGHT frames).

Candidates for tonicConf, replayed per frame on the chroma the ears saw (ch), all in 0..1:
  cur      the published tonicConf = (best - second) / |best| over all 24 KK keys (second may be the parallel mode)
  tmarg    best - best-of-another-TONIC (the parallel-mode coin toss ignored), clipped to 0..1 — "is the tonic clear"
  chTon    the chroma's own share on the tonic's bin, rescaled (share - 1/12) / (1/3 - 1/12)
  bassPk   the trailing BASS_WIN s gated sub-note histogram's top share (0 when the sub was never gated)
  agree    that histogram's share on the KS tonic (0 when no sub)
  stab     the fraction of the trailing BASS_WIN s of frames whose tonic equals this frame's
  tmXag    tmarg(rescaled to 0..1 at TM1) x agree^0.5 ... and the chosen form, see KEY-PLAN.md
Separation per candidate, frames from WARM s: p10 / p50 of RIGHT frames, p50 / p90 / max of WRONG frames, and the gate
fractions at KEYC0 0.1 and KEYC1 0.3 (keycolour.js's ramp; §82's shade rides the same gate).
  python3 tools/truth/key-confusion.py [--md tools/work/v84/confusion.md]
"""
import json, os, sys
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
W = os.path.join(ROOT, 'tools/work/v84')
NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
TRACKS = ['SeeYouDrop', 'CyborgNinja', 'WhoLikesToParty', 'Malicious', 'Vienna']
# (tonic pc, minor) — the track key; the provenance of each is KEY-PLAN.md §1
TRACK_KEY = {'SeeYouDrop': (1, 1), 'CyborgNinja': (1, 1), 'WhoLikesToParty': (2, 0), 'Malicious': (0, 1), 'Vienna': (3, 1)}
LOCAL_SHARE = 0.6
WARM = 15.0
BASS_WIN = 12.0
TM1 = 0.08           # tmarg at which the rescaled tonic margin reads 1
SUBCONF = 0.5
FPS = 60


def kn(pc, mi): return NAMES[pc] + ('m' if mi else 'M')


def ks24(c, PM, Pm):
    c = c - c.mean(); cn = np.linalg.norm(c)
    if not cn > 0: return None
    r = np.zeros(24)
    for mi, P in enumerate((PM, Pm)):
        p = P - P.mean(); pn = np.linalg.norm(p)
        for k in range(12): r[mi * 12 + k] = (c * np.roll(p, k)).sum() / (cn * pn)
    return r


def pct(a, q):
    a = np.asarray(a); return float(np.percentile(a, q)) if len(a) else float('nan')


SUFFIX = sys.argv[sys.argv.index('--suffix') + 1] if '--suffix' in sys.argv else ''
TAUS = (6.0, 12.0)   # the exponential bass histogram's time constants (s) — hist[note] += conf per frame, the whole hist decays


def run(track):
    E = json.load(open(os.path.join(W, f'ears-{track}{SUFFIX}.json')))
    TR = json.load(open(os.path.join(W, f'truth-{track}.json')))
    PM, Pm = np.array(E['KK_MAJ']), np.array(E['KK_MIN'])
    c = E['cols']; t = np.array(c['t']); n = len(t)
    tonic = np.array(c['tonic']); tmin = np.array(c['tonicMinor']); tconf = np.array([v if v is not None else 0 for v in c['tonicConf']])
    skey = np.array(c['key']); smode = np.array(c['mode']); kconf = np.array([v if v is not None else 0 for v in c['keyConf']])
    sub = np.array(c['subNote']); sgate = np.array(c['subGate']); sconf = np.array([v if v is not None else 0 for v in c['subConf']])
    ch = np.array([[v if v is not None else 0 for v in row] for row in E['ch']])
    kt, km = TRACK_KEY[track]
    # the local root per frame
    local = np.full(n, kt); secid = np.full(n, -1)
    for s in TR['sections']:
        sel = (t >= s['t0']) & (t < s['t1']); secid[sel] = s['id']
        if s['bassShare'] >= LOCAL_SHARE: local[sel] = NAMES.index(s['bassTonic'])
    # the candidates
    cur = np.zeros(n); tmarg = np.zeros(n); chTon = np.zeros(n); bassPk = np.zeros(n); agree = np.zeros(n); stab = np.zeros(n)
    kswin = np.full(n, -1); modeMarg = np.zeros(n)
    eh = {tau: np.zeros(12) for tau in TAUS}; agreeE = {tau: np.zeros(n) for tau in TAUS}; pkE = {tau: np.zeros(n) for tau in TAUS}
    win = int(BASS_WIN * FPS)
    for i in range(n):
        for tau in TAUS:
            eh[tau] *= np.exp(-1 / (FPS * tau))
            if sgate[i] > 0 and sconf[i] >= SUBCONF and sub[i] >= 0: eh[tau][sub[i]] += sconf[i]
        r = ks24(ch[i], PM, Pm) if ch[i].sum() > 0 else None
        if r is None or tonic[i] < 0: continue
        o = np.argsort(-r); b = int(o[0]); kswin[i] = b
        cur[i] = max(0, min(1, (r[o[0]] - r[o[1]]) / (abs(r[o[0]]) + 1e-6)))
        other = [r[k] for k in range(24) if k % 12 != b % 12]
        tmarg[i] = max(0, min(1, r[b] - max(other)))
        modeMarg[i] = max(0, min(1, abs(r[b % 12] - r[b % 12 + 12]) / TM1))
        for tau in TAUS:
            sE = eh[tau].sum()
            if sE > 1e-6: agreeE[tau][i] = eh[tau][b % 12] / sE; pkE[tau][i] = eh[tau].max() / sE
        sh = ch[i, b % 12] / (ch[i].sum() + 1e-9)
        chTon[i] = max(0, min(1, (sh - 1 / 12) / (1 / 3 - 1 / 12)))
        j0 = max(0, i - win)
        g = (sgate[j0:i + 1] > 0) & (sconf[j0:i + 1] >= SUBCONF) & (sub[j0:i + 1] >= 0)
        if g.sum() > 0:
            h = np.bincount(sub[j0:i + 1][g], minlength=12) / g.sum()
            bassPk[i] = h.max(); agree[i] = h[b % 12]
        stab[i] = (tonic[j0:i + 1] == tonic[i]).mean()
    tmR = np.clip(tmarg / TM1, 0, 1)
    cands = {'cur (published tonicConf)': cur, 'tmarg (raw r units)': tmarg, f'tmargR = min(1, tmarg/{TM1})': tmR, 'chTon': chTon,
             'bassPk': bassPk, 'agree': agree, 'stab': stab,
             'tmargR x agree': tmR * agree, 'tmargR x sqrt(agree)': tmR * np.sqrt(agree),
             'agree x stab': agree * stab, 'tmargR x agree x stab': tmR * agree * stab,
             'min(tmargR, agree)': np.minimum(tmR, agree), 'max(tmargR x agree, chTon x agree)': np.maximum(tmR * agree, chTon * agree),
             'modeMarg': modeMarg}
    for tau in TAUS:
        cands[f'agreeE{tau:.0f} (exp hist tau {tau:.0f} s)'] = agreeE[tau]
        cands[f'tmargR x agreeE{tau:.0f}'] = tmR * agreeE[tau]
        cands[f'pkE{tau:.0f}'] = pkE[tau]
    ok = (t >= WARM) & (tonic >= 0)
    right = ok & (tonic == kt); loc = ok & (tonic != kt) & (tonic == local); wrong = ok & (tonic != kt) & (tonic != local)
    modeR = right & (tmin == km)
    sright = ok & (skey == kt); swrong = ok & (skey != kt) & (skey != local)
    res = {'track': track, 'key': kn(kt, km), 'frames': int(ok.sum()), 'right': int(right.sum()), 'local': int(loc.sum()), 'wrong': int(wrong.sum()),
           'modeRight': int(modeR.sum()), 'synRight': int(sright.sum()), 'synWrong': int(swrong.sum()),
           'keyConf': {'right': [pct(kconf[right], q) for q in (10, 50, 90)], 'wrong': [pct(kconf[wrong], q) for q in (10, 50, 90)],
                       'local': [pct(kconf[loc], q) for q in (10, 50, 90)], 'all': [pct(kconf[ok], q) for q in (10, 50, 90)],
                       'synRight': [pct(kconf[sright], q) for q in (10, 50, 90)], 'synWrong': [pct(kconf[swrong], q) for q in (10, 50, 90)],
                       'ge03': float((kconf[ok] >= 0.3).mean()), 'lt01': float((kconf[ok] < 0.1).mean())},
           'tonicConf': {'right': [pct(tconf[right], q) for q in (10, 50, 90)], 'wrong': [pct(tconf[wrong], q) for q in (10, 50, 90)]},
           'cands': {}, 'sections': []}
    for name, v in cands.items():
        res['cands'][name] = {'rightP10': pct(v[right], 10), 'rightP50': pct(v[right], 50), 'rightGe03': float((v[right] >= 0.3).mean()) if right.sum() else float('nan'),
                              'wrongP50': pct(v[wrong], 50), 'wrongP90': pct(v[wrong], 90), 'wrongMax': float(v[wrong].max()) if wrong.sum() else float('nan'),
                              'wrongLt01': float((v[wrong] < 0.1).mean()) if wrong.sum() else float('nan'), 'wrongLt03': float((v[wrong] < 0.3).mean()) if wrong.sum() else float('nan'),
                              'localP50': pct(v[loc], 50), 'localP90': pct(v[loc], 90)}
    # per section: the modal ears key, synapse's, the truth
    for s in TR['sections']:
        sel = ok & (secid == s['id'])
        if sel.sum() < 30: continue
        keys = tonic[sel] + 12 * tmin[sel]; vals, cnt = np.unique(keys, return_counts=True); o = np.argsort(-cnt)
        sk = skey[sel] + 12 * smode[sel]; sv, sc = np.unique(sk, return_counts=True); so = np.argsort(-sc)
        lr = int(local[sel][0])
        res['sections'].append({'name': s['name'], 'bassTonic': s['bassTonic'], 'bassShare': s['bassShare'], 'local': NAMES[lr],
                                'ksTruth': s['mid+bass/KK']['top3'][0][0], 'ksMargin': s['mid+bass/KK']['margin'],
                                'ears': [(kn(int(vals[k]) % 12, int(vals[k]) // 12), round(float(cnt[k] / sel.sum()), 2)) for k in o[:2]],
                                'syn': [(kn(int(sv[k]) % 12, int(sv[k]) // 12), round(float(sc[k] / sel.sum()), 2)) for k in so[:2]],
                                'rightPct': float((tonic[sel] == kt).mean()), 'localPct': float((tonic[sel] == lr).mean()),
                                'tonicConfP50': pct(tconf[sel], 50), 'keyConfP50': pct(kconf[sel], 50),
                                'curP50': pct(cur[sel], 50), 'tmargRP50': pct(tmR[sel], 50), 'agreeP50': pct(agree[sel], 50),
                                'tmXagP50': pct((tmR * agree)[sel], 50),
                                'cand': {name: pct(v[sel], 50) for name, v in cands.items()}})
    # the section-level gate test per candidate: a section is RIGHT when >= 60 % of its frames carry the key's tonic, WRONG
    # when >= 60 % carry neither the key's nor the local root; the rest are mixed. open = median >= KEYC1 0.3, closed = < KEYC0 0.1
    for name in cands:
        sr_ = [s for s in res['sections'] if s['rightPct'] >= 0.6]; sw = [s for s in res['sections'] if (1 - max(s['rightPct'], s['localPct'])) >= 0.6]
        res['cands'][name]['secRightOpen'] = sum(1 for s in sr_ if s['cand'][name] >= 0.3); res['cands'][name]['secRight'] = len(sr_)
        res['cands'][name]['secRightMin'] = min([s['cand'][name] for s in sr_], default=float('nan'))
        res['cands'][name]['secWrongClosed'] = sum(1 for s in sw if s['cand'][name] < 0.1); res['cands'][name]['secWrong'] = len(sw)
        res['cands'][name]['secWrongMax'] = max([s['cand'][name] for s in sw], default=float('nan'))
    # the chosen design (KEY-PLAN.md §3): tonicConf = tmargR x agreeE12 — the gate it would drive, per track, frame-weighted
    v = tmR * agreeE[12.0]
    res['chosen'] = {'all_ge03': float((v[ok] >= 0.3).mean()), 'all_lt01': float((v[ok] < 0.1).mean()), 'all_p50': pct(v[ok], 50),
                     'right_ge03': float((v[right] >= 0.3).mean()) if right.sum() else float('nan'), 'right_p50': pct(v[right], 50),
                     'wrong_lt01': float((v[wrong] < 0.1).mean()) if wrong.sum() else float('nan'), 'wrong_p50': pct(v[wrong], 50), 'wrong_p90': pct(v[wrong], 90),
                     'local_p50': pct(v[loc], 50), 'kw_mean': float(np.clip((v[ok] - 0.1) / 0.2, 0, 1).mean()),
                     'kw_mean_today': float(np.clip((kconf[ok] - 0.1) / 0.2, 0, 1).mean())}
    # dump the per-frame candidates for KEY-PLAN's follow-ups
    np.savez_compressed(os.path.join(W, f'cands-{track}.npz'), t=t, tonic=tonic, tmin=tmin, local=local, right=right, wrong=wrong, loc=loc,
                        **{k.split(' ')[0]: v for k, v in cands.items()})
    return res


def md(R):
    L = ['## The BEFORE confusion table (frames from %.0f s; RIGHT = the key\'s tonic, LOCAL = the section\'s bass pedal, WRONG = neither)\n' % WARM,
         '| track | key | frames | ears RIGHT | LOCAL | WRONG | mode right (of RIGHT) | synapse RIGHT / WRONG | keyConf p10/p50/p90 RIGHT | WRONG | LOCAL | keyConf >= 0.3 | tonicConf p10/p50/p90 RIGHT | WRONG |',
         '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|']
    f3 = lambda a: '/'.join(f'{v:.2f}' for v in a)
    for r in R:
        n = r['frames']
        L.append(f"| {r['track']} | {r['key']} | {n} | **{100 * r['right'] / n:.0f} %** | {100 * r['local'] / n:.0f} % | **{100 * r['wrong'] / n:.0f} %** | "
                 f"{100 * r['modeRight'] / max(1, r['right']):.0f} % | {100 * r['synRight'] / n:.0f} % / {100 * r['synWrong'] / n:.0f} % | {f3(r['keyConf']['right'])} | {f3(r['keyConf']['wrong'])} | {f3(r['keyConf']['local'])} | "
                 f"{100 * r['keyConf']['ge03']:.0f} % | {f3(r['tonicConf']['right'])} | {f3(r['tonicConf']['wrong'])} |")
    L.append('\n## The chosen design per track: tonicConf = min(1, tmarg / 0.08) x agreeE12 (frames from %.0f s)\n' % WARM)
    L.append('| track | all p50 | all >= 0.3 | all < 0.1 | RIGHT p50 | RIGHT >= 0.3 | WRONG p50 / p90 | WRONG < 0.1 | LOCAL p50 | mean gate kw (new) | mean gate kw (keyConf today) |')
    L.append('|---|---|---|---|---|---|---|---|---|---|---|')
    for r in R:
        c = r['chosen']
        L.append(f"| {r['track']} | {c['all_p50']:.2f} | {100 * c['all_ge03']:.0f} % | {100 * c['all_lt01']:.0f} % | {c['right_p50']:.2f} | {100 * c['right_ge03']:.0f} % | {c['wrong_p50']:.2f} / {c['wrong_p90']:.2f} | {100 * c['wrong_lt01']:.0f} % | {c['local_p50']:.2f} | {c['kw_mean']:.2f} | {c['kw_mean_today']:.2f} |")
    L.append('\n## Per section: truth vs the ears vs synapse\n')
    for r in R:
        L.append(f"\n### {r['track']} ({r['key']})\n")
        L.append('| section | bass pedal (share) | local root | KS (margin) | ears modal (share) | synapse modal | ears RIGHT % | LOCAL % | tonicConf p50 | keyConf p50 | tmargR p50 | agree p50 | tmargR x agree p50 |')
        L.append('|---|---|---|---|---|---|---|---|---|---|---|---|---|')
        for s in r['sections']:
            e = ' '.join(f'{k} {p:.2f}' for k, p in s['ears']); sy = ' '.join(f'{k} {p:.2f}' for k, p in s['syn'])
            L.append(f"| {s['name']} | {s['bassTonic']} ({100 * s['bassShare']:.0f} %) | {s['local']} | {s['ksTruth']} ({s['ksMargin']:.3f}) | {e} | {sy} | {100 * s['rightPct']:.0f} | {100 * s['localPct']:.0f} | "
                     f"{s['tonicConfP50']:.3f} | {s['keyConfP50']:.2f} | {s['tmargRP50']:.2f} | {s['agreeP50']:.2f} | {s['tmXagP50']:.2f} |")
    L.append('\n## tonicConf candidates: separation per track (RIGHT p10 / p50 · WRONG p50 / p90 / max · WRONG < 0.1 · WRONG < 0.3 · RIGHT >= 0.3 · LOCAL p50/p90)\n')
    names = list(R[0]['cands'].keys())
    for name in names:
        L.append(f'\n**{name}**\n')
        L.append('| track | RIGHT p10 | p50 | RIGHT >= 0.3 | WRONG p50 | p90 | max | WRONG < 0.1 | WRONG < 0.3 | LOCAL p50 / p90 |')
        L.append('|---|---|---|---|---|---|---|---|---|---|')
        for r in R:
            c = r['cands'][name]
            L.append(f"| {r['track']} | {c['rightP10']:.3f} | {c['rightP50']:.3f} | {100 * c['rightGe03']:.0f} % | {c['wrongP50']:.3f} | {c['wrongP90']:.3f} | {c['wrongMax']:.3f} | "
                     f"{100 * c['wrongLt01']:.0f} % | {100 * c['wrongLt03']:.0f} % | {c['localP50']:.3f} / {c['localP90']:.3f} |")
    # the pooled separation
    L.append('\n## Pooled over the five tracks (the one number per candidate)\n')
    L.append('| candidate | RIGHT p10 | RIGHT p50 | RIGHT >= 0.3 (frames-weighted) | WRONG p90 | WRONG max | WRONG < 0.1 | WRONG < 0.3 | RIGHT sections open (>= 0.3) | min right section | WRONG sections closed (< 0.1) | max wrong section |')
    L.append('|---|---|---|---|---|---|---|---|---|---|---|---|')
    for name in names:
        rp10 = np.nanmin([r['cands'][name]['rightP10'] for r in R]); rp50 = np.nanmedian([r['cands'][name]['rightP50'] for r in R])
        sro = sum(r['cands'][name]['secRightOpen'] for r in R); srn = sum(r['cands'][name]['secRight'] for r in R)
        swc = sum(r['cands'][name]['secWrongClosed'] for r in R); swn = sum(r['cands'][name]['secWrong'] for r in R)
        srmin = np.nanmin([r['cands'][name]['secRightMin'] for r in R]); swmax = np.nanmax([r['cands'][name]['secWrongMax'] for r in R])
        wmax = np.nanmax([r['cands'][name]['wrongMax'] for r in R]); wp90 = np.nanmax([r['cands'][name]['wrongP90'] for r in R])
        nr = sum(r['right'] for r in R); nw = sum(r['wrong'] for r in R)
        ge = sum((r['cands'][name]['rightGe03'] if r['right'] else 0) * r['right'] for r in R) / nr
        l1 = sum((r['cands'][name]['wrongLt01'] if r['wrong'] else 0) * r['wrong'] for r in R) / nw
        l3 = sum((r['cands'][name]['wrongLt03'] if r['wrong'] else 0) * r['wrong'] for r in R) / nw
        L.append(f'| {name} | {rp10:.3f} (min over tracks) | {rp50:.3f} | {100 * ge:.0f} % | {wp90:.3f} (max over tracks) | {wmax:.3f} | {100 * l1:.0f} % | {100 * l3:.0f} % | {sro} / {srn} | {srmin:.3f} | {swc} / {swn} | {swmax:.3f} |')
    return '\n'.join(L)


if __name__ == '__main__':
    R = [run(t) for t in TRACKS]
    json.dump(R, open(os.path.join(W, f'confusion{SUFFIX}.json'), 'w'), indent=1)
    txt = md(R); print(txt)
    if '--md' in sys.argv: open(sys.argv[sys.argv.index('--md') + 1], 'w').write(txt)
