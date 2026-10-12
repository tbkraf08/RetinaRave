#!/usr/bin/env python3
# Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
# use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
# Source: https://github.com/tbkraf08/RetinaRave
"""The file-mode vocal LANE (DECISIONS §124, the vocal detector's step 3): step 1's Demucs truth as the three engine keys.

    python3 tools/truth/voxlane.py <Track> [...] [--all] [--out=DIR]
      -> $MUSIC/<Track>.vox.json   { track, sr, hop: .01, n, voxS[], voxHz[], voxConf[], provenance }

The user's rule (§122's addendum): *"do the demucs for file; do cnn for live (note: I listen to live mode 90 % of the time ->
live mode is first concern)"*. So in FILE mode the engine reads this sidecar instead of the live CNN: the separator already
heard the voice, non-causally, with no mix ceiling on the pitch. Reads `tools/truth/<Track>.vox.json` (voxtruth.py, committed)
and writes the lane BESIDE THE TRACK in $MUSIC (default ~/Music/RetinaRave) — the one directory `tools/serve.js` serves from
and the one place neither `tools/bundle.js` nor `npm run build` can see: **local only by construction**, like the tracks
themselves. Nothing on retinarave.com changes, and a tab share (capture mode) has no lane at all — that is what the CNN is for.
The pad take (`PadRec`) is served from the diag dir as `rec`, so its lane is written there under that name (and never read:
a take is `map0only` in windows.json — the live lanes, no map).

The three keys, from the truth's `share` / `f0` / `vprob` per 10 ms hop:
  voxS     the vocal presence 0–1. The share is rms(stem)/rms(mix), whose SCALE is the track's own (IBelongHere's sung p95 is
           .89, SeeYouDrop's .47, WhoLikesToParty's .24) — so it is normalised the way §122's window knee already was, with the
           KNEE AT .5: the knee (max(.08, p10 + .3·(p95 − p10)) over the music frames) is the one share value §122 called the
           edge of a sung window, so a lane frame reads ≥ .5 exactly where the truth's frame-level rule says "sung", and the
           live tier's own .3 / .5 gates keep their meaning across the two sources (tools/vox-ab.js grades them at .3).
           Below the knee the span p10 → knee maps to 0 → .5, above it knee → p95 maps to .5 → 1, clipped both ends; an
           instrumental (Comptine's p95 .002 under the .08 floor) reads 0 on every frame. SPAN_MIN keeps the upper span
           non-degenerate where p95 sits under the knee.
  voxHz    the sung pitch in Hz where the stem's pYIN is voiced (vprob ≥ VPROB_ON), −1 elsewhere — the field is categorical in
           the engine (the average of −1 and 300 Hz is not a pitch), so the engine reads the NEAREST frame, never an interpolation.
  voxConf  vprob × voxS, FLOORED at CONF_FLOOR. The product is the honest confidence (how sure the separator's pitch is, times
           how much voice is there), but the rig's switch is `voxConf > 0` = "the detector has a read at all" (§123; 0 is its
           cue to fall back to §121's `interval` stand-in). A lane HAS a read on every frame of the track, including the silent
           and the instrumental ones, so its confidence never reaches 0: without the floor FLUID2's lead would flicker back to
           the chroma stand-in through every instrumental bar of a file that has a lane.

OUTSIDE THE MUSIC FRAMES the lane reads 0 / −1 / the floor: where the mix is more than MUSIC_DB under its own p95 (a silent
intro, a gap, the fade) the share is a ratio of two almost-zero levels and can read anything — the pad take's own fade reads
≥ the knee on 10 % of its frames with no voice in it at all. §122's knee is computed over the music frames for exactly this
reason; the lane re-derives that same mask from the mix (voxtruth's own rms front end, imported) instead of guessing.
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', '.pylib'))
import math
import numpy as np
from voxtruth import find_mix, load, rms_frames, RMS_WIN_S, MUSIC_DB      # step 1's front end, not a second copy of it
from scipy.signal import resample_poly

HOP_S = 0.01
VPROB_ON = 0.5               # pYIN's voiced probability above which the lane publishes a pitch
CONF_FLOOR = 0.001           # voxConf never 0: the lane always has a read (see the header)
SPAN_MIN = 0.10              # the least upper span (knee → p95) used, so an instrumental's p95 < knee cannot divide by ~0
TRACKS = ['Comptine', 'IBelongHere', 'RaindropsOnRoses', 'CyborgNinja', 'Malicious', 'SeeYouDrop', 'Vienna',
          'WhoLikesToParty', 'PadRec']
VOX_DIR = os.path.join(HERE, '..', 'work', 'vox')   # the stems' dir (gitignored): where the pad take's mix lives
MUSIC = os.path.abspath(os.environ.get('MUSIC') or os.path.join(os.path.expanduser('~'), 'Music/RetinaRave'))
# The pad take: its mix is tools/work/fluid-diag/music/rec.wav (FLUID-DIAG-2026-10-09), served with MUSIC= pointed there
# (tools/real-md5.sh), and the page calls it `rec`. Its lane goes beside it under that name.
PAD = {'PadRec': (os.path.join(HERE, '..', 'work', 'fluid-diag', 'music'), 'rec')}


def clip(x, a, b):
    return a if x < a else b if x > b else x


def music_mask(track, sr, n):
    """voxtruth's own music rule, re-derived from the mix: the mix's 10 ms rms within MUSIC_DB of its p95. One bool per frame."""
    mix, msr = load(find_mix(track, os.path.abspath(VOX_DIR)))
    mm = mix.mean(axis=1).astype(np.float64)
    if msr != sr:                                  # the pad take is 48 kHz, Demucs wrote 44.1: the truth brought the mix to the stem's rate
        g = math.gcd(sr, msr)
        mm = resample_poly(mm, sr // g, msr // g)
    hop, win = int(round(HOP_S * sr)), int(round(RMS_WIN_S * sr))
    rm = rms_frames(mm.astype(np.float32), sr, hop, win)
    loud = np.percentile(rm[rm > 0], 95) if np.any(rm > 0) else 1.0
    music = rm > loud * 10 ** (-MUSIC_DB / 20)
    if len(music) < n:                             # the truth truncated to min(share, f0); pad the tail as silence
        music = np.concatenate([music, np.zeros(n - len(music), dtype=bool)])
    return music[:n]


def lane(track):
    src = os.path.join(HERE, track + '.vox.json')
    if not os.path.exists(src):
        sys.exit(f'no {os.path.relpath(src)}: python3 tools/truth/voxtruth.py {track}')
    J = json.load(open(src))
    share, f0, vprob = J['share'], J['f0'], J['vprob']
    n = J['n']
    if not (len(share) == len(f0) == len(vprob) == n):
        sys.exit(f'{track}: the truth\'s arrays disagree ({len(share)} / {len(f0)} / {len(vprob)} against n {n})')
    lo, p95 = J['share_p10_p95']
    knee = J['knee']
    dn = max(knee - lo, 1e-6)                      # p10 → knee maps to 0 → .5
    up = max(p95 - knee, SPAN_MIN)                 # knee → p95 maps to .5 → 1
    music = music_mask(track, J['sr'], n)
    voxS, voxHz, voxConf = [], [], []
    for i in range(n):
        if not music[i]:                           # the mix is 40 dB under its own p95: the share is noise on nothing
            voxS.append(0.0)
            voxHz.append(-1)
            voxConf.append(CONF_FLOOR)
            continue
        s = clip(share[i], 0.0, 1.0)
        v = 0.5 * clip((s - lo) / dn, 0.0, 1.0) if s <= knee else 0.5 + 0.5 * clip((s - knee) / up, 0.0, 1.0)
        p = vprob[i]
        voxS.append(round(v, 3))
        voxHz.append(round(f0[i], 1) if (p >= VPROB_ON and f0[i] > 0) else -1)
        voxConf.append(round(max(CONF_FLOOR, clip(p * v, 0.0, 1.0)), 3))
    prov = dict(J.get('provenance') or {})
    prov['lane'] = ('tools/truth/voxlane.py from tools/truth/%s.vox.json (DECISIONS §124): voxS = the share with the §122 knee '
                    'at .5 (p10 %.4f, knee %.4f, p95 %.4f, the upper span floored at %.2f), 0 outside the music frames (the mix '
                    'within %g dB of its p95); voxHz = f0 where vprob >= %.2f else -1; voxConf = max(%.3f, vprob * voxS) — the '
                    'floor because a lane has a read on every frame and voxConf 0 is the rig\'s cue to fall back to `interval`'
                    % (track, lo, knee, p95, SPAN_MIN, MUSIC_DB, VPROB_ON, CONF_FLOOR))
    prov['local_only'] = ('served from $MUSIC by tools/serve.js beside the track; tools/bundle.js and `npm run build` cannot see '
                          'it, so no lane is ever bundled or deployed. A tab share has no lane: live mode is the CNN alone.')
    out = {'track': track, 'sr': J['sr'], 'hop': HOP_S, 'n': n, 'voxS': voxS, 'voxHz': voxHz, 'voxConf': voxConf,
           'provenance': prov}
    return out, J


def write(track):
    out, J = lane(track)
    d, name = PAD.get(track, (MUSIC, track))
    d = os.path.abspath(d)
    if not os.path.isdir(d):
        sys.exit(f'no {d} (the lane lives beside the track; $MUSIC is {MUSIC})')
    p = os.path.join(d, name + '.vox.json')
    with open(p, 'w') as f:
        json.dump(out, f, separators=(',', ':'))
    kb = os.path.getsize(p) / 1024
    sung = sum(1 for v in out['voxS'] if v >= 0.5)
    pitched = sum(1 for v in out['voxHz'] if v > 0)
    print('  %-17s %6d frames  %7.1f s  voxS >= .5 on %5.1f %%  a pitch on %5.1f %%  voxConf %.3f..%.3f  %7.0f KB  -> %s'
          % (track, out['n'], out['n'] * HOP_S, 100 * sung / max(1, out['n']), 100 * pitched / max(1, out['n']),
             min(out['voxConf']), max(out['voxConf']), kb, os.path.relpath(p, os.path.expanduser('~'))))
    return kb


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    for a in sys.argv[1:]:
        if a.startswith('--out='):
            MUSIC = os.path.abspath(a[6:])
    if '--all' in sys.argv:
        args = TRACKS
    if not args:
        sys.exit(__doc__.strip().split('\n')[2].strip())
    print('the vocal lane (DECISIONS §124; local only — $MUSIC is %s)' % MUSIC)
    tot = sum(write(t) for t in args)
    print('  %d lane%s, %.0f KB in all' % (len(args), '' if len(args) == 1 else 's', tot))
