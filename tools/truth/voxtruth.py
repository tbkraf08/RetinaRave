#!/usr/bin/env python3
# Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
# use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
# Source: https://github.com/tbkraf08/RetinaRave
"""The vocal ground truth (DECISIONS §122, the vocal detector's step 1): Demucs is the labeller, the user's ear is the ruler.

    python3 tools/truth/voxtruth.py <Track> [...] [--render] [--vox-dir=DIR] [--all]
      -> tools/truth/<Track>.vox.json   { track, sr, hop: .01, n, share[], f0[], vprob[], windows: [{from, to, share, f0, kind?}],
                                          passages: [the same, phrase gaps < 2 s bridged], knee, music_frames, voiced_pct, f0_range,
                                          provenance }  +  the table on stdout (the passages; `win` = the windows' count)
      --render  also ~/Music/RetinaRave-clicks/<Track>-vox-windows.wav (the mix with a click at each proposed PASSAGE's edges: a short
                high double-click at the start, a long low one at the end — clicktrack.py's section / drop clicks and its levels;
                the .5 s windows would put a click pair on every phrase) and <Track>-vox-stem.wav (the vocal stem alone, so a leaked
                synth or a reverb tail is heard as what it is); never played here.

Reads the mix from $MUSIC (default ~/Music/RetinaRave; the pad take from the vox dir itself) and the stem from
<vox-dir>/htdemucs/<Track>/vocals.wav — the output of `demucs -n htdemucs --two-stems=vocals -o <vox-dir> <mix>` (tools/work/vox,
gitignored, never served, never bundled). Per 10 ms hop over the stem:
  share   rms(stem) / rms(mix) on 23 ms frames, smoothed over .1 s (the vocal's share of the mix, 0–1; > 1 only where the stems' sum
          beats the mix — clipped at 1.5)
  f0      pYIN on the stem (librosa.pyin, 65–1050 Hz, 46 ms frames) — the sung pitch in Hz, −1 where pYIN says unvoiced
  vprob   pYIN's voiced probability (0–1)
  windows the proposed SUNG windows: share ≥ a knee on the track's own range (max(KNEE_MIN, p10 + KNEE_FRAC · (p95 − p10)) over the
          music frames — an instrumental's leak never clears KNEE_MIN) for ≥ MIN_RUN s, gaps under GAP s bridged; each with its mean
          share and median f0; RaindropsOnRoses' breakdown lead (LEAD below, 111–137 s) is marked kind 'lead' ON PURPOSE — pitched,
          continuous, the detector should read it. `windows_hand` (the user's answers, in track time) is never written by this script
          and survives every re-run; `windows.json`'s `vox` key points here (tools/truth/windows.py).
Music frames = frames where the mix is within 40 dB of its p95 level; voiced_pct = windowed music frames / music frames.
This file is also step 3's lane (voxS / voxHz / voxConf come from share / f0 / vprob), so the three arrays are complete (rounded:
share 4 decimals, f0 1, vprob 3).
"""
import json, math, os, sys, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', '.pylib'))
try:
    import soundfile as sf
    import librosa
except ImportError as e:
    sys.exit(f'{e}: pip install --user librosa (soundfile comes with it; the gitignored tools/.pylib is the other home)')
from scipy.signal import resample_poly
from clicktrack import click

HOP_S = 0.01
RMS_WIN_S = 0.023            # the share's frame (1024 samples at 44.1 kHz)
PYIN_WIN_S = 0.046           # pYIN's frame (2048 at 44.1 kHz): two periods of 65 Hz fit
SMOOTH_S = 0.1               # the share's box smoothing
FMIN, FMAX = 65.0, 1050.0    # C2 to C6: a bass's low E is a semitone under, a soprano's C6 the top
KNEE_MIN, KNEE_FRAC = 0.08, 0.30
MIN_RUN, GAP = 1.0, 0.5      # the detector's grain: a sung window is >= 1 s, a breath under .5 s does not close it
PASSAGE_GAP = 2.0            # the ear's grain: `passages` are the same windows with phrase gaps under 2 s bridged (IBelongHere's
                             # verses are 52 windows at .5 s and 10 passages at 2 s — the clicks and the table are the passages')
MUSIC_DB = 40.0              # a music frame: within this of the mix's p95 rms
SHARE_MAX = 1.5
LEAD = {'RaindropsOnRoses': [(111.0, 137.0)]}   # the breakdown lead: marked, not excluded (VOCAL-PLAN step 1 item 3)
PAD = {'PadRec'}                                 # the pad take lives in the vox dir, not in $MUSIC
DEMUCS = 'htdemucs'
# The Jamendo singing-voice corpus (Ramona, Richard, David, ICASSP 2008), step 2's public training set, fetched to
# ~/Datasets/jamendo-svd/ (DECISIONS §122) — its licence line verbatim from the archive's README + the Zenodo record's licence field,
# repeated in ~/Datasets/jamendo-svd/LICENCE-NOTE.md:
JAMENDO_LICENCE = ('"This is a public corpus of 93 creative-commons licensed music pieces annotated by voice (sung or spoken) and '
                   'no-voice." (jamendo/README; Zenodo record 2585988 license: cc-by-4.0; Ramona, Richard, David, "Vocal detection '
                   'in music with support vector machines", ICASSP 2008, doi 10.1109/ICASSP.2008.4518002)')
JAMENDO_URL = 'https://zenodo.org/records/2585988'


def find_mix(track, vox):
    if track in PAD:
        p = os.path.join(vox, track + '.wav')
        if os.path.isfile(p): return p
        sys.exit(f'no pad take {p}')
    d = os.environ.get('MUSIC', os.path.expanduser('~/Music/RetinaRave'))
    for ext in ('', '.flac', '.wav', '.mp3', '.ogg'):
        p = os.path.join(d, track + ext)
        if os.path.isfile(p): return p
    sys.exit(f'no track {track} in {d}')


def load(path):
    x, sr = sf.read(path, dtype='float32', always_2d=True)
    return x, sr


def rms_frames(y, sr, hop, win):
    return librosa.feature.rms(y=y, frame_length=win, hop_length=hop, center=True)[0]


def box(v, n):
    if n <= 1: return v
    k = np.ones(n) / n
    return np.convolve(v, k, mode='same')


def runs_from(mask, hop_s, gap=GAP):
    """[(from, to)] in seconds: gaps under `gap` bridged first, then runs under MIN_RUN dropped."""
    idx = np.flatnonzero(mask)
    if not len(idx): return []
    runs = []
    s = p = idx[0]
    for i in idx[1:]:
        if (i - p) * hop_s < gap: p = i; continue
        runs.append((s, p)); s = p = i
    runs.append((s, p))
    out = []
    for a, b in runs:
        if (b - a + 1) * hop_s >= MIN_RUN: out.append((a * hop_s, (b + 1) * hop_s))
    return out


def mmss(t):
    return '%d:%05.2f' % (int(t // 60), t % 60)


def note(h):
    if not h or h <= 0 or not np.isfinite(h): return '-'
    n = 'C C# D D# E F F# G G# A A# B'.split()
    m = int(round(69 + 12 * math.log2(h / 440))); return n[m % 12] + str(m // 12 - 1)


def truth(track, vox):
    stem_p = os.path.join(vox, DEMUCS, track, 'vocals.wav')
    if not os.path.isfile(stem_p):
        sys.exit(f'no stem {stem_p}: demucs -n {DEMUCS} --two-stems=vocals -o {vox} <mix>')
    mix_p = find_mix(track, vox)
    stem, sr = load(stem_p)
    mix, msr = load(mix_p)
    sm = stem.mean(axis=1).astype(np.float64)
    mm = mix.mean(axis=1).astype(np.float64)
    if msr != sr:   # the pad take is 48 kHz, Demucs writes 44.1 kHz: the mix comes to the stem's rate for the share
        g = math.gcd(sr, msr); mm = resample_poly(mm, sr // g, msr // g)
    n = min(len(sm), len(mm)); sm, mm = sm[:n], mm[:n]
    hop = int(round(HOP_S * sr)); rwin = int(round(RMS_WIN_S * sr)); pwin = 2048 if sr <= 48000 else 4096
    rs = rms_frames(sm.astype(np.float32), sr, hop, rwin)
    rm = rms_frames(mm.astype(np.float32), sr, hop, rwin)
    eps = 1e-6
    share = np.minimum(rs / np.maximum(rm, eps), SHARE_MAX)
    share = box(share, int(round(SMOOTH_S / HOP_S)))
    f0, vflag, vprob = librosa.pyin(sm.astype(np.float32), fmin=FMIN, fmax=FMAX, sr=sr, frame_length=pwin, hop_length=hop, center=True)
    nf = min(len(share), len(f0)); share, f0, vprob, rm = share[:nf], f0[:nf], vprob[:nf], rm[:nf]
    f0 = np.where(np.isfinite(f0), f0, -1.0)
    # music frames: the mix within MUSIC_DB of its p95 rms
    loud = np.percentile(rm[rm > 0], 95) if np.any(rm > 0) else 1.0
    music = rm > loud * 10 ** (-MUSIC_DB / 20)
    sm_share = share[music]
    lo, hi = (np.percentile(sm_share, 10), np.percentile(sm_share, 95)) if len(sm_share) else (0.0, 0.0)
    knee = max(KNEE_MIN, lo + KNEE_FRAC * (hi - lo))
    def describe(a, b):
        i0, i1 = int(a / HOP_S), int(b / HOP_S)
        vf = f0[i0:i1][(vprob[i0:i1] >= 0.5) & (f0[i0:i1] > 0)]
        w = {'from': round(a, 2), 'to': round(b, 2), 'share': round(float(share[i0:i1].mean()), 3),
             'f0': round(float(np.median(vf)), 1) if len(vf) else -1}
        for la, lb in LEAD.get(track, []):
            if min(b, lb) - max(a, la) > 0.5 * (b - a): w['kind'] = 'lead'
        return w
    on = (share >= knee) & music
    windows = [describe(a, b) for a, b in runs_from(on, HOP_S)]
    inwin = np.zeros(nf, bool)
    for w in windows: inwin[int(w['from'] / HOP_S):int(w['to'] / HOP_S)] = True
    passages = [describe(a, b) for a, b in runs_from(inwin, HOP_S, PASSAGE_GAP)]   # the ear's grain: the windows, phrase gaps bridged
    voiced_pct = 100.0 * (inwin & music).sum() / max(1, music.sum())
    vf = f0[inwin & (vprob >= 0.5) & (f0 > 0)]
    f0r = {'p10': round(float(np.percentile(vf, 10)), 1), 'p50': round(float(np.percentile(vf, 50)), 1),
           'p90': round(float(np.percentile(vf, 90)), 1), 'frames': int(len(vf))} if len(vf) else {'p10': -1, 'p50': -1, 'p90': -1, 'frames': 0}
    out = {'track': track, 'sr': sr, 'hop': HOP_S, 'n': nf, 'seconds': round(nf * HOP_S, 2),
           'knee': round(float(knee), 4), 'share_p10_p95': [round(float(lo), 4), round(float(hi), 4)],
           'music_frames': int(music.sum()), 'voiced_pct': round(float(voiced_pct), 1), 'f0_range': f0r,
           'windows': windows, 'passages': passages,
           'provenance': {'labeller': DEMUCS, 'demucs': 'Demucs 4.1.0 (Défossez et al., MIT) — the vocals stem of the two-stem separation',
                          'librosa': 'librosa %s (ISC) — rms + pyin' % librosa.__version__,
                          'method': 'share = rms(stem)/rms(mix) on %d ms frames, box %d ms; pyin %d-%d Hz, %d-sample frames; windows: share >= knee = max(%.2f, p10 + %.2f*(p95 - p10)) over music frames (mix within %d dB of p95) for >= %.1f s, gaps < %.1f s bridged' % (
                              round(RMS_WIN_S * 1000), round(SMOOTH_S * 1000), FMIN, FMAX, pwin, KNEE_MIN, KNEE_FRAC, MUSIC_DB, MIN_RUN, GAP),
                          'jamendo': JAMENDO_LICENCE, 'jamendo_url': JAMENDO_URL},
           'share': [round(float(v), 4) for v in share], 'f0': [round(float(v), 1) for v in f0], 'vprob': [round(float(v), 3) for v in vprob]}
    if track in LEAD: out['lead_spans'] = [list(x) for x in LEAD[track]]
    return out, (mix, msr), (stem, sr)


def write_wav(path, y, sr):
    y = np.clip(y, -1, 1)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes((y * 32767).astype('<i2').tobytes())


def render(track, out, mix, stem, clicks_dir):
    x, sr = mix
    x = x.astype(np.float64)
    if x.shape[1] == 1: x = np.repeat(x, 2, axis=1)
    peak = np.abs(x).max() or 1.0
    g = peak * 10 ** (-6 / 20)                      # clicktrack.py's --gain default
    c = np.zeros(len(x))
    hi = click(3000, 15, sr=sr); lo = click(400, 120, sr=sr, decay=3.0)
    def put(t, burst, amp):
        i = int(t * sr)
        if i < 0 or i >= len(c): return
        m = min(len(burst), len(c) - i); c[i:i + m] += amp * burst[:m]
    for w in out['passages']:
        put(w['from'], hi, g); put(w['from'] + 0.06, hi, g)      # the section double-click: a passage opens
        put(w['to'], lo, g * 10 ** (6 / 20))                       # the drop's long low click: it closes
    y = x * 0.85 + c[:, None]; y /= max(1.0, np.abs(y).max())
    pw = os.path.join(clicks_dir, f'{track}-vox-windows.wav'); write_wav(pw, y, sr)
    s, ssr = stem
    s = s.astype(np.float64)
    if s.shape[1] == 1: s = np.repeat(s, 2, axis=1)
    ps = os.path.join(clicks_dir, f'{track}-vox-stem.wav'); write_wav(ps, s, ssr)
    return pw, ps


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    opt = lambda k, d=None: next((a.split('=', 1)[1] for a in sys.argv if a.startswith('--' + k + '=')), d)
    vox = os.path.abspath(opt('vox-dir', os.path.join(HERE, '..', 'work', 'vox')))
    if '--all' in sys.argv:
        args = ['Comptine', 'IBelongHere', 'RaindropsOnRoses', 'CyborgNinja', 'Malicious', 'SeeYouDrop', 'Vienna', 'WhoLikesToParty', 'PadRec']
    if not args:
        print(__doc__); sys.exit(1)
    clicks = os.path.expanduser('~/Music/RetinaRave-clicks'); os.makedirs(clicks, exist_ok=True)
    print('%-16s %7s %7s %6s  %-26s %4s  %s' % ('track', 'music s', 'voiced%', 'knee', 'f0 p10/p50/p90 Hz', 'win', 'passages (track time; share, f0)'))
    for track in args:
        out, mix, stem = truth(track, vox)
        p = os.path.join(HERE, track + '.vox.json')
        if os.path.exists(p):
            old = json.load(open(p))
            if 'windows_hand' in old:             # the user's answers survive every re-run
                out['windows_hand'] = old['windows_hand']
                print(f'  {track}: windows_hand kept ({len(old["windows_hand"])} hand windows)')
        with open(p, 'w') as f:
            json.dump(out, f, separators=(',', ':'), ensure_ascii=False)
        ws = ' · '.join('%s–%s (%.2f, %s%s)' % (mmss(w['from']), mmss(w['to']), w['share'], note(w['f0']), ', LEAD' if w.get('kind') == 'lead' else '')
                        for w in out['passages']) or '(none)'
        r = out['f0_range']
        print('%-16s %7.1f %7.1f %6.3f  %-26s %4d  %s' % (track, out['music_frames'] * HOP_S, out['voiced_pct'], out['knee'],
                                                           '%g / %g / %g' % (r['p10'], r['p50'], r['p90']), len(out['windows']), ws))
        if '--render' in sys.argv:
            pw, ps = render(track, out, mix, stem, clicks)
            print(f'  ! paplay {pw}\n  ! paplay {ps}')


if __name__ == '__main__':
    main()
