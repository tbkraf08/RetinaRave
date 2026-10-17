#!/usr/bin/env python3
# Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
# use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
# Source: https://github.com/tbkraf08/RetinaRave
"""The real-music WINDOWS (DECISIONS §109): per library track, the frame-addressed shots tools/real-md5.sh takes and the 60 s
window tools/real-rulers.sh runs, derived from the track's OWN structure in tools/truth/<Track>.json (trackmap.py) the way
§104 chose SeeYouDrop's (intro f602@at=0, groove f602@at=25, drop1 f1958@at=25, build f1202@at=80, drop2 f1538@at=80):

    python3 tools/truth/windows.py            -> tools/truth/windows.json (committed) + the table on stdout

Per track, one RUN per `at` (a cold deterministic start there, HARNESS "File source"; windows sharing an `at` share the run), its shots addressed by __FRAME
(heardT = at + (frame − 2)/60, so frame = 2 + round((t − at)·60)):
  intro   at S, t S+10                       the first ten seconds from the track's `start` S (START below; 0 for the seven)
  groove  at L, t L+10                       L = summary.loudest30_from (the loudest 30 s); when L < 15 s the groove IS the intro,
                                             so L = the first section boundary ≥ 20 s instead
  quiet   at Q, t Q+10                       Q = the start of the sparsest 10 s (the lowest onset density — low + click + mid_on +
                                             high_on per second over the 5 s slices — from 10 s on, not inside another window)
  dropN   at max(0, ⌊d⌋ − 25): build t d−5, drop t d     the first two `drops` (bar-pinned, DROP_MIN); a track with no drop
                                             (CyborgNinja) takes its first two section boundaries ≥ 20 s as boundaryN instead
  rulers  from max(S, L − 20) to from + 60   the continuity / luminance window: the approach to the loudest 30 s and the 30 s itself
  <user>  the user's named moments (USER below: RaindropsOnRoses bass56 / event66), on a run that covers them; not in the DEFAULT scope
The pad take (rec, FLUID-DIAG-2026-10-09, 24.4 s, &map=0 only): intro at 0 t 10 and chords t 20 (§108's 19–21 s attacks), rulers 0 → 24.4.
`gate` false (Malicious — NO_GATE) = recorded and swept for the record, never a FAIL and never asserted.
`start` (RaindropsOnRoses 24 s) = the track starts there for every harness purpose: no run, window or trace before it.
"""
import json, math, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
TRACKS = ['Comptine', 'CyborgNinja', 'IBelongHere', 'Malicious', 'RaindropsOnRoses', 'SeeYouDrop', 'TheChain', 'Vienna', 'WhoLikesToParty']
# `gate: false` — in the sweeps and the traces for the record, but NOT a FAIL rule and NOT asserted by the node tests (§109: the user,
# 2026-10-09: "can ignore malicious until I validate the ruler" — the map's sub ruler on Malicious is pending his validation)
# RaindropsOnRoses (the eighth track, 2026-10-10, DECISIONS §117) was here from its import until the user validated its ruler the same
# afternoon (§117 addendum "the ruler validated": the DP grid vs the flat 140.00 lattice, 24–84 s + 125–160 s, and 140 vs 70 — "can't tell
# difference between B / A; the 140 click nods better then the 70") → `bpm_grid.hand`, summary.bpm 140.0, and a gate since.
# TheChain (the ninth track, 2026-10-17, DECISIONS §137 — the user: "here is a new test song to first analyze and get golden truths"):
# measured and swept for the record, no claim on it is a FAIL, until the user validates a ruler on it (the §117 precedent — Raindrops
# was NO_GATE from its import until the click render was heard the same afternoon).
# §137 addendum: the OCTAVE is settled by ear — 76 BPM, not the grid's 152 ("I nod my head at 76 bpm, but the B clicks off beat") — but
# the PARITY is not: B clicked the wrong half of the bar, and TheChain-B2-76-{25to85,170to230}.wav are rendered and unheard.
# THE GATE TURNS ON WHEN THE USER CONFIRMS B2 (drop 'TheChain' from NO_GATE then; bpm_grid.hand.provisional false with it).
NO_GATE = {'Malicious', 'TheChain'}
# `start` — the track starts HERE for every harness purpose (the user, 2026-10-10, on RaindropsOnRoses: "note: start from 24 secs"):
# the intro run is cold at `start`, no window and no run begins before it, the rulers window begins no earlier, and tools/traces.sh
# records start → start + 110 s. Absent = 0 (the seven).
START = {'RaindropsOnRoses': 24.0}
# the user's NAMED moments (the same user note: "bass that starts at 56s -> something happens at 1:06 with the sound"): shot on a run
# that already covers them (at ≤ t − 5 and t − at ≤ 60) else on their own run at max(start, ⌊t⌋ − 25); behind FULL=1 / WINDOWS= like
# quiet / drop2 (the DEFAULT scope stays intro · groove · build1 · drop1)
USER = {'RaindropsOnRoses': [('bass56', 56.0), ('event66', 66.0)]}
FPS = 60

def frame(at, t):
    return 2 + int(round((t - at) * FPS))

def windows(track):
    d = json.load(open(os.path.join(HERE, track + '.json')))
    s, secs, drops = d['summary'], d['sections'], d.get('drops') or []
    dur = s['seconds']
    st = START.get(track, 0.0)
    runs = []   # [{at, shots: [{name, t, f}]}]
    runs.append({'at': st, 'shots': [{'name': 'intro', 't': st + 10.0}]})
    L = s['loudest30_from']
    if L < st + 15:
        L = next((x['t0'] for x in secs if x['t0'] >= st + 20), st + 20.0)
    L = float(int(L))
    runs.append({'at': L, 'shots': [{'name': 'groove', 't': L + 10}]})
    # the sparsest 10 s from the 5 s slices' onset densities (per second), outside the intro / groove windows
    sl = d['slices']['5']
    taken = [(st, st + 10), (L, L + 10)]
    best, Q = None, None
    for i in range(len(sl) - 1):
        t0 = sl[i]['t']
        if t0 < st + 10 or t0 + 10 > dur - 5: continue
        if any(t0 < b and t0 + 10 > a for a, b in taken): continue
        dens = sum(sl[j]['low'] + sl[j]['click'] + sl[j]['mid_on'] + sl[j]['high_on'] for j in (i, i + 1)) / 2
        if best is None or dens < best: best, Q = dens, t0
    if Q is not None:
        runs.append({'at': float(Q), 'shots': [{'name': 'quiet', 't': Q + 10}]})
    hits = [(x, 'drop') for x in drops if x >= st][:2]
    if not hits:
        hits = [(x['t0'], 'boundary') for x in secs if x['t0'] >= st + 20][:2]
    for k, (t, kind) in enumerate(hits):
        at = float(max(st, math.floor(t) - 25))
        runs.append({'at': at, 'shots': [{'name': 'build%d' % (k + 1), 't': round(t - 5, 3)}, {'name': '%s%d' % (kind, k + 1), 't': round(t, 3)}]})
    for name, t in USER.get(track, []):   # the user's named moments: an existing run that covers them, else their own
        r = next((r for r in runs if r['at'] <= t - 5 and t - r['at'] <= 60), None)
        if r is None:
            r = {'at': float(max(st, math.floor(t) - 25)), 'shots': []}; runs.append(r)
        r['shots'].append({'name': name, 't': t})
    merged = {}   # one run per `at`: Comptine's drop 1 (21.5 s) and IBelongHere's (15.9 s) share the intro's run at 0; RaindropsOnRoses' drop 1 (41.1 s) the intro's at 24
    for r in runs:
        merged.setdefault(r['at'], []).extend(r['shots'])
    runs = [{'at': at, 'shots': sorted(sh, key=lambda x: x['t'])} for at, sh in sorted(merged.items())]
    for r in runs:
        for sh in r['shots']:
            sh['f'] = frame(r['at'], sh['t'])
    rf = float(max(st, int(L) - 20))
    out = {'track': track, 'seconds': dur, 'bpm': s['bpm'], 'loudest30_from': s['loudest30_from'], 'drops': drops,
           'runs': runs, 'rulers': {'from': rf, 'to': rf + 60}, 'gate': track not in NO_GATE}
    if st: out['start'] = st
    if os.path.exists(os.path.join(HERE, track + '.vox.json')):   # the vocal ground truth (DECISIONS §122, tools/truth/voxtruth.py)
        out['vox'] = 'tools/truth/%s.vox.json' % track
    return out

out = {'note': 'generated by tools/truth/windows.py (DECISIONS §109) from tools/truth/<Track>.json; frame = 2 + round((t - at)*60)', 'tracks': {}}
for t in TRACKS:
    if not os.path.exists(os.path.join(HERE, t + '.json')):
        print('no truth for', t, '— python3 tools/truth/trackmap.py', t, '--grains=8,5,3,2,1,0.569,0.224', file=sys.stderr); continue
    out['tracks'][t] = windows(t)
out['tracks']['rec'] = {'track': 'rec', 'seconds': 24.4, 'bpm': None, 'loudest30_from': None, 'drops': [], 'map0only': True, 'gate': True,
                        'runs': [{'at': 0, 'shots': [{'name': 'intro', 't': 10.0, 'f': frame(0, 10.0)}, {'name': 'chords', 't': 20.0, 'f': frame(0, 20.0)}]}],
                        'rulers': {'from': 0, 'to': 24.4}}
if os.path.exists(os.path.join(HERE, 'PadRec.vox.json')):   # the pad take's vocal truth is voxtruth.py's PadRec (the vox dir's copy of rec.wav)
    out['tracks']['rec']['vox'] = 'tools/truth/PadRec.vox.json'
json.dump(out, open(os.path.join(HERE, 'windows.json'), 'w'), indent=1)
for t, w in out['tracks'].items():
    shots = ' · '.join('%s f%d@at=%g (%.1f s)' % (sh['name'], sh['f'], r['at'], sh['t']) for r in w['runs'] for sh in r['shots'])
    print('%-16s %6.1f s  bpm %-6s rulers %g-%g | %s' % (t, w['seconds'], w['bpm'], w['rulers']['from'], w['rulers']['to'], shots))
