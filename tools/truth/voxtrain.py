#!/usr/bin/env python3
# Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
# use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
# Source: https://github.com/tbkraf08/RetinaRave
"""The live vocal detector's training (DECISIONS §123, the vocal detector's step 2 of three; §126 the second pass — the data).

    python3 tools/truth/voxtrain.py [--epochs=N] [--per-epoch=N] [--remixes=N] [--var-floor=F] [--tag=T] [--no-train] [--mel-only=<Track>]
                                    [--snr=LO,HI] [--quota=jam,lib,neg,remix] [--soft-floor=F]   (§126 item 4: the recipe's knobs for run 2 / 3,
                                    the defaults = run 1's recipe; a soft target under F inside a hand window is DROPPED, not taught as near-silence)
                                    [--net=cnn|tcn|gru] [--tcn-c=N] [--tcn-dil=1,2,4,8,16] [--pitch-w=F] [--onset-w=F] [--pyin-only]   (§133: the STREAM nets — an output every hop and a 61-way
                                    pitch head on the shared hidden column, trained on the stems' pYIN; --pyin-only computes and caches the
                                    Jamendo stems' pYIN first (tools/work/vox/pyin/); the default net stays the §123 window CNN)
      -> assets/engine/ears/vox-weights.js   the weights as a JS module (Float16 little-endian, base64; the provenance in its header)
      -> tools/work/vox/vox.onnx              the same net, the same (fp16-rounded) weights — the parity check's reference
      -> tools/work/vox/onnx-parity.json      200 held Jamendo-test windows (the normalised mel, 40 x 34) + onnxruntime's output on them
      -> tools/work/vox/mel-<Track>.json      the numpy front end on one library PCM dump (raw + normalised log-mel, the first hops) —
                                              tools/test_vox.js's mel parity (the ears' mel must equal this to 1e-4)
      -> tools/work/vox/train-report.json     the table: Jamendo test F1 / AUC, the held-out library pair, per track (+ a copy per --tag)

THE FRONT END (the ears' `engine/ears/vox.js` re-implemented here, hop by hop — the parity test is where these models usually
drift): per 512-sample hop of the MID signal (.5·(L + R)) a 2048-point periodic-Hann FFT over the 2048 samples ending at the hop
(the ears' FFT class: |X| · 2 / Σwin, 1024 bins), the POWER in 40 triangular HTK-mel bands 100 Hz–8 kHz (unnormalised triangles,
peak 1, on the bin centres), ln(E + MEL_FLOOR), then a per-band CAUSAL running mean / variance (an exact cumulative mean until
the count passes the 30 s exponential window, exponential after: a = max(1/(n+1), 1 − e^(−hop/30))) → x' = (x − m) / sqrt(v +
VAR_FLOOR). The model sees the track's own range, never an absolute level (§111 item 7). The first FFT runs at hop 3 (2048 samples
in); hop h covers samples [512·(h+1) − 2048, 512·(h+1)).

THE NET (40 × 34 → 38 385 parameters; the plan's "32 hops" became 34 so that every pooling pair is full and the NEWEST hop reaches the
dense layer — the two convolutions are VALID in time, SAME in frequency, so the ears run it as a stream: one conv1 column per hop,
one conv2 column per two, the dense every four — ears/vox-net.js; this file's batch model is the same arithmetic on a 34-column window):
conv 3×3 ×16 (pad freq 1, time 0) → ReLU → maxpool 2 → conv 3×3 ×16 (the same padding) → ReLU → maxpool 2 → dense 32 → ReLU →
dense 1 → sigmoid; BCE (soft targets allowed); the jitter below as augmentation. The label is the window's END — causal, no look-ahead.

THE DATA (§126 — VOX-CNN2-PLAN item 1; the §123 recipe was Jamendo + the library + six accompaniments + eight fixed remixes):
  · the Jamendo singing-voice corpus (~/Datasets/jamendo-svd/jamendo; CC BY 4.0; 61 train / 16 valid / 16 test, the .lab labels at
    the window's end), the TRAIN labels cleaned by Demucs as a second annotator: a `sing` frame whose vocal stem holds < STEM_OFF of
    the mix is dropped (the singer paused inside a labelled region), a no-voice frame whose stem holds > LEAK_DROP is dropped (leak
    or label slop) — valid and test keep the raw labels so the numbers stay comparable to §123's;
  · the Jamendo train tracks' Demucs ACCOMPANIMENTS (no_vocals) as hard negatives — the same arrangement with no voice;
  · the library's windows_hand (tools/truth/<T>.vox.json) with the Demucs LANE as a SOFT target: inside a hand window the frame
    learns the lane's voxS ($MUSIC/<T>.vox.json — the share with the §122 knee at .5, so a reverb tail learns .3, not .8), outside
    every hand window 0; the hard rule (share ≥ knee inside a window) is kept for the evaluation rows only;
  · the library's accompaniments as negatives (six, WhoLikesToParty's included: an accompaniment is voice-free by construction);
  · MusicNet (~/Datasets/musicnet, CC BY 4.0: solo piano, string quartets, winds) and MAESTRO v3 (~/Datasets/maestro, CC BY-NC-SA
    4.0: solo piano) as PURE negatives — the piano / string / wind lines in the voice band that §123's net read as a voice on an
    unseen instrumental 17–31 % of the time; one file of each kind held out as an unseen-classical control;
  · RANDOM REMIXES, re-drawn every epoch (REMIXES_PER_EPOCH): a vocal stem (a Jamendo train track's, or RaindropsOnRoses' /
    SeeYouDrop's) over ANOTHER track's accompaniment or a classical recording, at a random SNR in SNR_DB, random offsets into both,
    labelled by the stem's SHARE of the remix (≥ STEM_ON sung AND the source's own label says voice; ≤ STEM_OFF not; between dropped);
  · the jitter: gain / tilt / level / noise on the normalised input (§123) + a mel-domain PITCH SHIFT of ±PITCH_BANDS bands (the
    column rolled along the band axis, the edge replicated) and a TIME STRETCH of STRETCH (the 34-hop window resampled from a longer
    or shorter span ending at the same hop — Schlüter & Grill 2015's augmentation).
  OUT OF THE LOSS: WhoLikesToParty's mix (its hand windows are shouted chops — the user, 2026-10-12: not voice; its row is RECORDED),
  and its vocal stem as a remix source. HELD OUT, unseen: IBelongHere (voiced) and Comptine (solo piano) — this round Comptine is
  UNSEEN, so its false-positive number is honest (§123's final split trained on it). Jamendo valid picks the epoch. CPU only.
The audio never ships; the weights do, with every corpus credited (THIRD-PARTY.md, about.html, the weights module's header).
"""
import base64, json, math, os, sys, time, glob, csv
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', '.pylib'))

SR = 48000
N_FFT, HOP = 2048, 512
N_MEL, F_LO, F_HI = 40, 100.0, 8000.0
MEL_FLOOR = 1e-9            # ln(E + this): −90 dB re a full-scale sine's band power
NORM_TAU = 30.0             # s: the causal normaliser's window
VAR_FLOOR = 0.0625          # the sd floor (.25 nat ≈ 2.2 dB): a band that never moves does not blow up (--var-floor sweeps it; the ears' must match)
T_WIN = 34                  # the net's time window (hops) — see the header
FIRST_HOP = (N_FFT // HOP) - 1   # 3: the first hop with 2048 samples behind it
JAMENDO = os.path.expanduser('~/Datasets/jamendo-svd/jamendo')
MUSICNET = os.path.expanduser('~/Datasets/musicnet')
MAESTRO = os.path.expanduser('~/Datasets/maestro')
MUSIC = os.environ.get('MUSIC') or os.path.expanduser('~/Music/RetinaRave')     # the lanes (voxlane.py) — the soft target
WORK = os.path.join(ROOT, 'tools', 'work', 'vox')
MELDIR = os.path.join(WORK, 'mel2')          # §126: the raw log-mel per item under raw/, the normalised per floor under vf<floor>/
STEM48 = os.path.join(WORK, 'stems48')       # §126: every stem / bed as 48 kHz mono float16 (the remixes re-draw from these each epoch)
STEM_DIR = os.path.join(WORK, 'htdemucs')    # the library's Demucs stems (§122)
JAM_STEM_DIR = os.path.join(WORK, 'jamendo', 'htdemucs')   # §126: Demucs over the 93 Jamendo tracks (the train split's are used)
# The library split (§126): five mixes train, the voiced IBelongHere AND the solo-piano Comptine are UNSEEN; WhoLikesToParty is out of
# the loss (shouted chops, not voice) and recorded. The accompaniments of six tracks are negatives (an accompaniment is voice-free).
LIB_TRAIN = ['CyborgNinja', 'Malicious', 'RaindropsOnRoses', 'SeeYouDrop', 'Vienna']
LIB_HELD = ['IBelongHere', 'Comptine']
LIB_RECORDED = ['WhoLikesToParty']
ACC_TRACKS = ['CyborgNinja', 'Malicious', 'RaindropsOnRoses', 'SeeYouDrop', 'Vienna', 'WhoLikesToParty']
LIB_VOX_SOURCES = ['RaindropsOnRoses', 'SeeYouDrop']      # the library vocal stems the remixes may use (IBelongHere held, the chops out)
LIB_OVERSAMPLE = 2
POS_WEIGHT = 1.0
SEED = 1234
STEM_ON, STEM_OFF = 0.15, 0.04      # the stem's share of a remix: sung / not (voxtruth.py's knee is .08 on a real stem's leak)
LEAK_DROP = 0.30                    # a Jamendo no-voice frame whose stem holds more than this of the mix is dropped from the loss
REMIXES_PER_EPOCH = 60
SNR_DB = (-12.0, 6.0)               # the vocal stem's level against the bed, in dB of the two active-frame rms
REMIX_SECONDS = 150.0               # a remix's length (random offsets into both stems)
PITCH_BANDS = 2                     # the mel-domain pitch shift, ± bands (uniform over −2..2)
STRETCH = (0.8, 1.2)                # the time stretch's range (half the windows)
QUOTA = {'jam': 0.35, 'lib': 0.10, 'neg': 0.25, 'remix': 0.30}   # the draw per epoch by group (--quota=jam,lib,neg,remix)
SOFT_FLOOR = 0.0                    # --soft-floor: a library hand-window frame whose lane target is in (0, F) leaves the loss (a breath, a tail under the knee)


# ---------------------------------------------------------------------------------------------------- the front end
def hann_periodic(n):
    i = np.arange(n, dtype=np.float64)
    return 0.5 - 0.5 * np.cos(2 * np.pi * i / n)


def mel_bank(sr=SR, n_fft=N_FFT, n_mel=N_MEL, f_lo=F_LO, f_hi=F_HI):
    """40 x 1024 triangles (HTK mel, peak 1) over the bin centres i·sr/n_fft, i < n_fft/2. The ears' vox.js builds the same table."""
    m = lambda f: 2595.0 * np.log10(1.0 + f / 700.0)
    mi = lambda x: 700.0 * (10.0 ** (x / 2595.0) - 1.0)
    edges = mi(np.linspace(m(f_lo), m(f_hi), n_mel + 2))
    nb = n_fft // 2
    f = np.arange(nb, dtype=np.float64) * sr / n_fft
    W = np.zeros((n_mel, nb), dtype=np.float64)
    for j in range(n_mel):
        lo, c, hi = edges[j], edges[j + 1], edges[j + 2]
        up = (f - lo) / (c - lo); dn = (hi - f) / (hi - c)
        W[j] = np.clip(np.minimum(up, dn), 0.0, None)
    return W, edges


def logmel(mid, sr=SR):
    """The raw log-mel per hop, (H, 40) float64; row h is hop h (rows below FIRST_HOP are absent: the array starts at hop FIRST_HOP)."""
    n = len(mid)
    H = n // HOP                       # hops whose end sample 512·(h+1) <= n
    if H <= FIRST_HOP: return np.zeros((0, N_MEL))
    win = hann_periodic(N_FFT); norm = 2.0 / win.sum()
    W, _ = mel_bank(sr)
    out = np.zeros((H - FIRST_HOP, N_MEL))
    CH = 2048
    x = mid.astype(np.float64)
    for h0 in range(FIRST_HOP, H, CH):
        h1 = min(H, h0 + CH)
        idx = (np.arange(h0, h1)[:, None] + 1) * HOP - N_FFT + np.arange(N_FFT)[None, :]
        fr = x[idx] * win
        mags = np.abs(np.fft.rfft(fr, axis=1)[:, :N_FFT // 2]) * norm
        E = (mags * mags) @ W.T
        out[h0 - FIRST_HOP:h1 - FIRST_HOP] = np.log(E + MEL_FLOOR)
    return out


def normalise(lm, hop_s=HOP / SR, tau=NORM_TAU, var_floor=None):
    """The causal per-band running mean / variance, hop by hop (the ears' recursion exactly): x' = (x − m) / sqrt(v + VAR_FLOOR)."""
    vf = VAR_FLOOR if var_floor is None else var_floor
    A = 1.0 - math.exp(-hop_s / tau)
    m = np.zeros(N_MEL); v = np.zeros(N_MEL)
    out = np.empty_like(lm)
    for i in range(lm.shape[0]):
        a = max(1.0 / (i + 1), A)
        x = lm[i]
        d = x - m
        m = m + a * d
        v = (1.0 - a) * (v + a * d * d)
        out[i] = (x - m) / np.sqrt(v + vf)
    return out


def hop_times(n_hops, first=FIRST_HOP, sr=SR):
    return (np.arange(first, first + n_hops) + 1) * HOP / sr


# ---------------------------------------------------------------------------------------------------- the audio
def to48(y, sr):
    if sr == SR: return y
    from scipy.signal import resample_poly
    from math import gcd
    g = gcd(SR, sr); return resample_poly(y, SR // g, sr // g)


def load_jamendo(name):
    import librosa
    y, _ = librosa.load(os.path.join(JAMENDO, 'audio', name), sr=SR, mono=True)
    return y.astype(np.float64)


def load_wav_mono(path):
    import soundfile as sf
    y, sr = sf.read(path, dtype='float32', always_2d=True)
    mid = 0.5 * (y[:, 0].astype(np.float64) + y[:, -1].astype(np.float64))
    return to48(mid, sr)


def load_dump(track):
    p = os.path.join(ROOT, 'tools', 'work', f'{track}.{SR}.st.f32')
    meta = json.load(open(p + '.json'))
    il = np.fromfile(p, dtype=np.float32)
    n = meta['n']
    L, R = il[0:2 * n:2], il[1:2 * n:2]
    return (0.5 * (L.astype(np.float64) + R.astype(np.float64))), meta['sr']


def stem48(key, loader):
    """A 48 kHz mono signal cached as float16 under STEM48/<key>.npy (the remixes draw from these every epoch)."""
    os.makedirs(STEM48, exist_ok=True)
    p = os.path.join(STEM48, key + '.npy')
    if os.path.exists(p): return np.load(p).astype(np.float64)
    y = loader()
    tmp = p + f'.{os.getpid()}.tmp.npy'
    np.save(tmp, np.clip(y, -8, 8).astype(np.float16)); os.replace(tmp, p)       # atomic: two workers may want the same stem at once
    return y


def jam_stem(name, kind):
    base = os.path.splitext(name)[0]
    return stem48(f'jam-{base}-{kind}', lambda: load_wav_mono(os.path.join(JAM_STEM_DIR, base, kind + '.wav')))


def lib_stem(track, kind):
    return stem48(f'lib-{track}-{kind}', lambda: load_wav_mono(os.path.join(STEM_DIR, track, kind + '.wav')))


def classical_files():
    """(key, path) of every MusicNet subset file and MAESTRO subset file on disk; the held-out controls are the first of each group."""
    mn = sorted(glob.glob(os.path.join(MUSICNET, 'piano', '*.wav'))) + sorted(glob.glob(os.path.join(MUSICNET, 'strings_winds', '*.wav')))
    ma = sorted(glob.glob(os.path.join(MAESTRO, '[0-9]*', '*.wav')))
    out = [('mn-' + os.path.basename(os.path.dirname(p))[:2] + '-' + os.path.splitext(os.path.basename(p))[0], p) for p in mn]
    out += [(f'ma-{i:02d}', p) for i, p in enumerate(ma)]
    return out


CLASSICAL_HELD = None   # set in main: one MusicNet piano, one MusicNet strings/winds, one MAESTRO (the first of each)


def classical_stem(key, path):
    return stem48(key, lambda: load_wav_mono(path))


# ---------------------------------------------------------------------------------------------------- the labels
def lab_labels(name, t):
    lab = os.path.join(JAMENDO, 'labels', os.path.splitext(name)[0] + '.lab')
    y = np.zeros(len(t), dtype=np.int8) - 1
    for line in open(lab):
        a = line.split()
        if len(a) < 3: continue
        t0, t1, k = float(a[0]), float(a[1]), a[2]
        y[(t >= t0) & (t < t1)] = 1 if k == 'sing' else 0
    return y


def lib_truth(track):
    return json.load(open(os.path.join(HERE, f'{track}.vox.json')))


def lib_labels(track, t):
    """The hard rule (§123): inside a hand window with the stem's share ≥ the knee sung, outside every window not, under the knee inside one dropped."""
    d = lib_truth(track)
    share = np.asarray(d['share'], dtype=np.float64); hop = d['hop']; knee = d['knee']
    y = np.zeros(len(t), dtype=np.int8)
    i = np.clip(np.round(t / hop).astype(int), 0, len(share) - 1)
    for w in d.get('windows_hand', []):
        m = (t >= w['from']) & (t < w['to'])
        y[m] = np.where(share[i[m]] >= knee, 1, -1)
    return y, d


def lib_soft(track, t):
    """§126: the SOFT target — the lane's voxS inside the hand windows, 0 outside (the ear said no voice there)."""
    p = os.path.join(MUSIC, track + '.vox.json')
    if not os.path.exists(p): raise SystemExit(f'no lane {p} — fix: python3 tools/truth/voxlane.py {track}')
    L = json.load(open(p)); S = np.asarray(L['voxS'], dtype=np.float32); hop = L['hop']
    i = np.clip(np.round(t / hop).astype(int), 0, len(S) - 1)
    ys = np.zeros(len(t), dtype=np.float32)
    for w in lib_truth(track).get('windows_hand', []):
        m = (t >= w['from']) & (t < w['to'])
        ys[m] = S[i[m]]
    return ys


def hop_level(sig, n_hops):
    """A signal's level per mel hop (rms over 23 ms ending at the hop, box .1 s), aligned to the hops from FIRST_HOP."""
    fr = int(0.023 * SR); H = n_hops + FIRST_HOP
    ends = (np.arange(H) + 1) * HOP
    c = np.concatenate([[0.0], np.cumsum(sig * sig)])
    a = np.clip(ends - fr, 0, None); e = np.clip(ends, 0, len(sig))
    a = np.minimum(a, e)
    rms = np.sqrt(np.maximum(c[e] - c[a], 0) / np.maximum(e - a, 1))
    k = max(1, int(0.1 / (HOP / SR)))
    rms = np.convolve(rms, np.ones(k) / k, mode='same')
    return rms[FIRST_HOP:FIRST_HOP + n_hops]


def active_rms(sig):
    lv = hop_level(sig, len(sig) // HOP - FIRST_HOP)
    if not len(lv): return 0.0
    on = lv > 0.05 * np.percentile(lv, 95)
    return float(np.sqrt(np.mean(lv[on] ** 2))) if on.any() else float(np.sqrt(np.mean(lv ** 2)))


# ---------------------------------------------------------------------------------------------------- the cache
def _raw_path(name): return os.path.join(MELDIR, 'raw', name + '.npz')
def _x_path(name, vf): return os.path.join(MELDIR, f'vf{vf:g}', name + '.npz')


def cached(name, build, vf=None):
    """x (normalised at the floor), y (hard, int8: 1 / 0 / −1), ys (the training target, float32: [0, 1] or −1), t. The raw log-mel is
    cached once per item; the normalisation once per floor (the --var-floor sweep rebuilds only that)."""
    vf = VAR_FLOOR if vf is None else vf
    rp, xp = _raw_path(name), _x_path(name, vf)
    if not os.path.exists(rp):
        os.makedirs(os.path.dirname(rp), exist_ok=True)
        lm, y, ys, t = build()
        tmp = rp + f'.{os.getpid()}.tmp.npz'
        np.savez(tmp, lm=lm.astype(np.float32), y=y.astype(np.int8), ys=ys.astype(np.float32), t=t.astype(np.float32)); os.replace(tmp, rp)
    z = np.load(rp)
    if not os.path.exists(xp):
        os.makedirs(os.path.dirname(xp), exist_ok=True)
        tmp = xp + f'.{os.getpid()}.tmp.npz'
        np.savez(tmp, x=normalise(z['lm'].astype(np.float64), var_floor=vf).astype(np.float32)); os.replace(tmp, xp)
    return np.load(xp)['x'], z['y'], z['ys'], z['t']


# §133: the pitch head's target per item, cached once under mel2/pitch/<name>.npz: int8 per hop — PITCH_NONE (−1) an explicit "no pitch"
# (the label says no voice, or the stem's share is under STEM_OFF), 0..PITCH_BINS−1 the semitone bin of the stem's pYIN (C3 = 0 … B7 = 59)
# where vprob ≥ PYIN_VOICED, PITCH_SKIP (−2) no target (voice without a confident pYIN, a pitch outside the head's range: no loss).
PITCH_BINS, PITCH_C3 = 60, 130.8127826502993      # 60 semitones C3..B7; the head's 61st class is "none"
PITCH_NONE, PITCH_SKIP = -1, -2
PITCH_W = 0.5                                       # --pitch-w: the pitch loss's weight beside the voice BCE
ONSET_W, ONSET_HOPS = 1.0, 10                       # --onset-w: the voice loss's weight on the ONSET_HOPS columns after a 0 -> 1 edge of the target (§133 run 6: the commit lag attacked in the loss, causally)


def pitch_bins(f0, vprob, t):
    """The bin per hop time t from a 10 ms pYIN grid: PITCH_SKIP where unvoiced or out of range."""
    k = np.clip(np.round(t / PYIN_HOP_S).astype(int), 0, len(f0) - 1)
    f = f0[k]; v = vprob[k]
    ok = (v >= PYIN_VOICED) & (f > 0)
    b = np.full(len(t), PITCH_SKIP, dtype=np.int8)
    with np.errstate(divide='ignore', invalid='ignore'):
        bb = np.round(12.0 * np.log2(np.where(ok, f, 1.0) / PITCH_C3)).astype(int)
    inr = ok & (bb >= 0) & (bb < PITCH_BINS)
    b[inr] = bb[inr]
    return b, ok


def _pitch_path(name): return os.path.join(MELDIR, 'pitch', name + '.npz')


def cached_pitch(name, build):
    p = _pitch_path(name)
    if not os.path.exists(p):
        os.makedirs(os.path.dirname(p), exist_ok=True)
        yp = build()
        tmp = p + f'.{os.getpid()}.tmp.npz'
        np.savez(tmp, yp=yp.astype(np.int8)); os.replace(tmp, p)
    return np.load(p)['yp']


def pitch_jamendo(name, t, y):
    def b():
        f0, vp = jam_pyin(name)
        bins, _ = pitch_bins(f0, vp, t)
        yp = np.where(y == 0, PITCH_NONE, np.where(y == 1, bins, PITCH_SKIP)).astype(np.int8)
        return yp
    return cached_pitch('jam-' + os.path.splitext(name)[0], b)


def pitch_lib(track, t):
    def b():
        f0, vp = lib_pyin(track)
        bins, _ = pitch_bins(f0, vp, t)
        inw = np.zeros(len(t), dtype=bool)
        for w in lib_truth(track).get('windows_hand', []): inw |= (t >= w['from']) & (t < w['to'])
        return np.where(inw, bins, PITCH_NONE).astype(np.int8)
    return cached_pitch('lib-' + track, b)


def pitch_none(t): return np.full(len(t), PITCH_NONE, dtype=np.int8)


def build_jamendo(name, vf=None):
    split = jam_split_of(name)
    def b():
        mid = load_jamendo(name); lm = logmel(mid); t = hop_times(len(lm)); y = lab_labels(name, t); ys = y.astype(np.float32)
        if split == 'train':                     # §126: Demucs as the second annotator on the TRAIN labels only
            base = os.path.splitext(name)[0]
            if not os.path.exists(os.path.join(JAM_STEM_DIR, base, 'vocals.wav')):
                raise SystemExit(f'no Demucs stem for the Jamendo train track {name} — the §126 pass (htdemucs --two-stems=vocals into tools/work/vox/jamendo) is not done; --partial trains on the tracks that have one')
            if True:
                v = jam_stem(name, 'vocals'); n = min(len(v), len(mid))
                share = hop_level(v[:n], len(lm)) / np.maximum(hop_level(mid[:n], len(lm)), 1e-6)
                ys = ys.copy()
                ys[(y == 1) & (share < STEM_OFF)] = -1
                ys[(y == 0) & (share > LEAK_DROP)] = -1
        return lm, y, ys, t
    return cached('jam-' + os.path.splitext(name)[0], b, vf)


def build_lib(track, vf=None):
    def b():
        mid, sr = load_dump(track); assert sr == SR, (track, sr)
        lm = logmel(mid); t = hop_times(len(lm)); y, _ = lib_labels(track, t)
        ys = lib_soft(track, t) if track in LIB_TRAIN else y.astype(np.float32)
        return lm, y, ys, t
    return cached('lib-' + track, b, vf)


def build_neg(key, loader, vf=None):
    def b():
        mid = loader(); lm = logmel(mid); t = hop_times(len(lm)); y = np.zeros(len(lm), dtype=np.int8)
        return lm, y, y.astype(np.float32), t
    return cached(key, b, vf)


def build_acc(track, vf=None): return build_neg('acc-' + track, lambda: lib_stem(track, 'no_vocals'), vf)
def build_jacc(name, vf=None): return build_neg('jacc-' + os.path.splitext(name)[0], lambda: jam_stem(name, 'no_vocals'), vf)
def build_classical(key, path, vf=None): return build_neg(key, lambda: classical_stem(key, path), vf)


def filelist(split):
    return [l.strip() for l in open(os.path.join(JAMENDO, 'filelists', split)) if l.strip()]


def has_stem(name, kind='vocals'):
    return os.path.exists(os.path.join(JAM_STEM_DIR, os.path.splitext(name)[0], kind + '.wav'))


PARTIAL = False      # --partial: the Jamendo TRAIN tracks without a Demucs stem yet are left out (a smoke run while the pass runs)
def train_names():
    return [n for n in filelist('train') if not PARTIAL or has_stem(n)]


_SPLIT = {}
def jam_split_of(name):
    if not _SPLIT:
        for s in ('train', 'valid', 'test'):
            for n in filelist(s): _SPLIT[n] = s
    return _SPLIT[name]


def jam_has_voice(name):
    return any(len(l.split()) >= 3 and l.split()[2] == 'sing' for l in open(os.path.join(JAMENDO, 'labels', os.path.splitext(name)[0] + '.lab')))


# ---------------------------------------------------------------------------------------------------- the pitch truth (§133)
# The pitch head's target: pYIN on the VOCAL STEM, the recipe of tools/truth/voxtruth.py verbatim (librosa.pyin 65–1050 Hz, 2048-sample
# frames, a 10 ms hop, center=True) — the library's is in tools/truth/<T>.vox.json (f0 / vprob); the Jamendo stems' is computed here once
# and cached under tools/work/vox/pyin/<base>.npz (gitignored). A pitch counts where vprob >= PYIN_VOICED (voxlane.py's rule for voxHz).
PYIN_DIR = os.path.join(WORK, 'pyin')
PYIN_FMIN, PYIN_FMAX, PYIN_HOP_S, PYIN_VOICED = 65.0, 1050.0, 0.01, 0.5


def pyin_of(key, path):
    """(f0 Hz or -1, vprob) on the 10 ms grid of the stem at `path`, cached as float32 under PYIN_DIR/<key>.npz."""
    os.makedirs(PYIN_DIR, exist_ok=True)
    p = os.path.join(PYIN_DIR, key + '.npz')
    if os.path.exists(p):
        z = np.load(p); return z['f0'].astype(np.float64), z['vprob'].astype(np.float64)
    import librosa, soundfile as sf
    y, sr = sf.read(path, dtype='float32', always_2d=True); y = y.mean(axis=1)
    hop = int(round(PYIN_HOP_S * sr)); pwin = 2048 if sr <= 48000 else 4096
    f0, vflag, vprob = librosa.pyin(y, fmin=PYIN_FMIN, fmax=PYIN_FMAX, sr=sr, frame_length=pwin, hop_length=hop, center=True)
    f0 = np.where(np.isfinite(f0), f0, -1.0)
    tmp = p + f'.{os.getpid()}.tmp.npz'
    np.savez(tmp, f0=f0.astype(np.float32), vprob=vprob.astype(np.float32), sr=sr, hop=hop); os.replace(tmp, p)
    return f0.astype(np.float64), vprob.astype(np.float64)


def jam_pyin(name):
    base = os.path.splitext(name)[0]
    return pyin_of('jam-' + base, os.path.join(JAM_STEM_DIR, base, 'vocals.wav'))


def lib_pyin(track):
    d = lib_truth(track)
    return np.asarray(d['f0'], dtype=np.float64), np.asarray(d['vprob'], dtype=np.float64)


def _pyin_one(name):
    t0 = time.time(); jam_pyin(name); return name, time.time() - t0


def pyin_all(log, pool):
    names = [n for n in filelist('train') + filelist('valid') + filelist('test') if has_stem(n)]
    log(f'pYIN on {len(names)} Jamendo vocal stems -> {os.path.relpath(PYIN_DIR, ROOT)}')
    t0 = time.time(); done = 0
    for name, dt in pool.imap_unordered(_pyin_one, names):
        done += 1
        if done % 10 == 0 or dt > 60: log(f'  {done} / {len(names)}  {name} {dt:.0f} s  ({time.time() - t0:.0f} s)')
    log(f'pYIN ready in {time.time() - t0:.0f} s')


# ---------------------------------------------------------------------------------------------------- the remixes (re-drawn per epoch)
def remix_sources():
    """The vocal sources (key, kind, name) and the beds (key, kind, name) the remixes draw from — the train split and the library only."""
    vox = [('jam', n) for n in train_names() if jam_has_voice(n) and has_stem(n)]
    vox += [('lib', t) for t in LIB_VOX_SOURCES]
    beds = [('jacc', n) for n in train_names() if has_stem(n, 'no_vocals')]
    beds += [('acc', t) for t in ACC_TRACKS]
    beds += [('cls', k, p) for k, p in classical_files() if k not in (CLASSICAL_HELD or [])]
    return vox, beds


def _remix_one(job):
    """One remix: (seed, vox spec, bed spec, snr dB, var floor) → (name, x float32 (H, 40), ys float32)."""
    seed, vs, bs, snr, vf = job
    rng = np.random.default_rng(seed)
    if vs[0] == 'jam': v = jam_stem(vs[1], 'vocals'); vname = os.path.splitext(vs[1])[0]
    else: v = lib_stem(vs[1], 'vocals'); vname = vs[1]
    if bs[0] == 'jacc': a = jam_stem(bs[1], 'no_vocals'); bname = os.path.splitext(bs[1])[0]
    elif bs[0] == 'acc': a = lib_stem(bs[1], 'no_vocals'); bname = bs[1]
    else: a = classical_stem(bs[1], bs[2]); bname = bs[1]
    n = int(REMIX_SECONDS * SR)
    n = min(n, len(v), len(a))
    ov = int(rng.integers(0, len(v) - n + 1)); oa = int(rng.integers(0, len(a) - n + 1))
    v = v[ov:ov + n]; a = a[oa:oa + n]
    rv, ra = active_rms(v), active_rms(a)
    if rv < 1e-5 or ra < 1e-5: return None
    g = 10 ** (snr / 20) * ra / rv
    mid = a + g * v
    lm = logmel(mid); H = len(lm); t = hop_times(H)
    share = hop_level(g * v, H) / np.maximum(hop_level(mid, H), 1e-6)
    # the source's own label at the source's time (the offset shifts it)
    ts = t + ov / SR
    if vs[0] == 'jam': src = lab_labels(vs[1], ts) == 1
    else:
        src = np.zeros(H, dtype=bool)
        for w in lib_truth(vs[1]).get('windows_hand', []): src |= (ts >= w['from']) & (ts < w['to'])
    ys = np.full(H, -1, dtype=np.float32)
    ys[(share >= STEM_ON) & src] = 1
    ys[share <= STEM_OFF] = 0
    x = normalise(lm, var_floor=vf).astype(np.float32)
    # §133: the pitch target from the SOURCE stem's pYIN at the source's time — a bin where the stem is sung in the remix, none where it is out
    f0, vp = jam_pyin(vs[1]) if vs[0] == 'jam' else lib_pyin(vs[1])
    bins, _ = pitch_bins(f0, vp, ts)
    yp = np.full(H, PITCH_SKIP, dtype=np.int8)
    yp[ys == 1] = bins[ys == 1]
    yp[ys == 0] = PITCH_NONE
    return (f'remix:{vname}/{bname}{snr:+.0f}', x, ys, yp)


def draw_remixes(pool, rng, vox, beds, k, vf):
    jobs = []
    for i in range(k):
        vs = vox[int(rng.integers(len(vox)))]; bs = beds[int(rng.integers(len(beds)))]
        snr = float(rng.uniform(*SNR_DB)); jobs.append((int(rng.integers(1 << 30)), vs, bs, snr, vf))
    out = pool.map(_remix_one, jobs)
    return [o for o in out if o is not None]


# ---------------------------------------------------------------------------------------------------- the net
def make_model(torch):
    nn = torch.nn
    class VoxNet(nn.Module):
        def __init__(self):
            super().__init__()
            self.conv1 = nn.Conv2d(1, 16, 3, padding=(1, 0))
            self.conv2 = nn.Conv2d(16, 16, 3, padding=(1, 0))
            self.fc1 = nn.Linear(16 * 10 * 7, 32)   # (16, 40/4, ((34-2)/2-2)/2) flattened in torch's (C, F, T) order
            self.fc2 = nn.Linear(32, 1)
        def forward(self, x):            # x: (B, 1, 40, 34)
            x = torch.relu(self.conv1(x)); x = torch.nn.functional.max_pool2d(x, 2)   # (B,16,20,16)
            x = torch.relu(self.conv2(x)); x = torch.nn.functional.max_pool2d(x, 2)   # (B,16,10,7)
            x = torch.relu(self.fc1(x.flatten(1)))
            return self.fc2(x).squeeze(1)      # the logit; sigmoid outside
    return VoxNet()


LOOK = int(math.ceil((T_WIN - 1) * STRETCH[1])) + 1    # the longest look-back a stretched window needs (hops)


class Group:
    """Every (item, hop) window a group may draw: X the concatenated normalised mel, the valid END indices and their targets."""
    def __init__(self, sets):
        xs, ids, ys = [], [], []
        off = 0
        for x, y, rep in sets:
            n = len(x)
            ok = np.arange(LOOK, n)
            ok = ok[y[ok] >= 0]
            for _ in range(rep): ids.append(ok + off); ys.append(y[ok])
            xs.append(x); off += n
        self.X = np.concatenate(xs).astype(np.float32) if xs else np.zeros((0, N_MEL), np.float32)
        self.idx = np.concatenate(ids) if ids else np.zeros(0, int); self.y = (np.concatenate(ys) if ys else np.zeros(0)).astype(np.float32)
    def batch(self, sel, rng, stretch=True):
        """(B, 1, 40, 34) windows ENDING at the chosen hops; half of them time-stretched (§126: the 34 columns resampled from a
        span of 34·f hops ending at the same hop, f in STRETCH — linear interpolation between hops), the label the END's."""
        e = self.idx[sel]; B = len(e)
        f = np.ones(B)
        if stretch:
            m = rng.random(B) < 0.5
            f[m] = rng.uniform(STRETCH[0], STRETCH[1], m.sum())
        pos = e[:, None] - (T_WIN - 1 - np.arange(T_WIN))[None, :] * f[:, None]    # (B, 34), the last column = e exactly
        i0 = np.floor(pos).astype(int); w = (pos - i0).astype(np.float32)
        i1 = np.minimum(i0 + 1, e[:, None])
        x = self.X[i0] * (1 - w)[:, :, None] + self.X[i1] * w[:, :, None]           # (B, 34, 40)
        return np.ascontiguousarray(x.transpose(0, 2, 1))[:, None], self.y[sel]      # (B, 1, 40, 34)


def augment(x, rng):
    """The jitter on the normalised input: gain / tilt / level / noise (§123) + the mel-domain pitch shift (§126)."""
    B = x.shape[0]
    k = rng.integers(-PITCH_BANDS, PITCH_BANDS + 1, B)
    if PITCH_BANDS:
        idx = np.clip(np.arange(N_MEL)[None, :] - k[:, None], 0, N_MEL - 1)          # (B, 40): the band each output band reads
        x = np.take_along_axis(x, idx[:, None, :, None], axis=2)
    off = rng.normal(0, 0.3, (B, 1, 1, 1)).astype(np.float32)                     # the mix level
    tilt = rng.normal(0, 0.3, (B, 1, 1, 1)).astype(np.float32) * np.linspace(-1, 1, N_MEL, dtype=np.float32)[None, None, :, None]
    gain = rng.normal(1.0, 0.1, (B, 1, 1, 1)).astype(np.float32)                   # the range
    noise = rng.normal(0, 0.05, x.shape).astype(np.float32)
    return x * gain + off + tilt + noise


def predict(model, torch, x, bs=4096):
    out = []
    with torch.no_grad():
        for i in range(0, len(x), bs):
            out.append(torch.sigmoid(model(torch.from_numpy(x[i:i + bs]))).numpy())
    return np.concatenate(out) if out else np.zeros(0)


def frames_of(x, y):
    ok = np.arange(T_WIN - 1, len(x)); ok = ok[y[ok] >= 0]
    win = np.arange(-T_WIN + 1, 1)
    X = np.ascontiguousarray(x[ok[:, None] + win[None, :]].transpose(0, 2, 1))[:, None]
    return X, y[ok].astype(np.float32), ok


def auc(y, p):
    if y.min() == y.max(): return float('nan')
    order = np.argsort(p); r = np.empty(len(p)); r[order] = np.arange(1, len(p) + 1)
    ps = p[order]; i = 0
    while i < len(ps):
        j = i
        while j + 1 < len(ps) and ps[j + 1] == ps[i]: j += 1
        if j > i: r[order[i:j + 1]] = (i + j + 2) / 2.0
        i = j + 1
    npos = (y == 1).sum(); nneg = len(y) - npos
    return float((r[y == 1].sum() - npos * (npos + 1) / 2) / (npos * nneg))


def f1(y, p, thr=0.5):
    pr = p >= thr
    tp = ((pr) & (y == 1)).sum(); fp = ((pr) & (y == 0)).sum(); fn = ((~pr) & (y == 1)).sum()
    prec = tp / max(1, tp + fp); rec = tp / max(1, tp + fn)
    return float(2 * prec * rec / max(1e-9, prec + rec)), float(prec), float(rec)


def evaluate(model, torch, sets):
    """sets: (name, x, y_hard). The hard labels, always — a soft target is for the loss, not the ruler."""
    rows = []; ally, allp = [], []
    for name, x, y in sets:
        X, Y, _ = frames_of(x, y)
        if not len(X): continue
        p = predict(model, torch, X)
        F, pr, rc = f1(Y, p)
        rows.append({'track': name, 'frames': int(len(Y)), 'sung_pct': round(100 * float(Y.mean()), 1), 'F1': round(F, 3), 'P': round(pr, 3), 'R': round(rc, 3), 'AUC': round(auc(Y, p), 3), 'fp_pct': round(100 * float(((p >= 0.5) & (Y == 0)).sum() / max(1, (Y == 0).sum())), 1)})
        ally.append(Y); allp.append(p)
    if not ally: return rows, {'frames': 0}
    Y = np.concatenate(ally); P = np.concatenate(allp)
    F, pr, rc = f1(Y, P)
    return rows, {'frames': int(len(Y)), 'F1': round(F, 3), 'P': round(pr, 3), 'R': round(rc, 3), 'AUC': round(auc(Y, P), 3)}


# ---------------------------------------------------------------------------------------------------- the stream nets (§133)
# --net=tcn | gru: a net that outputs EVERY hop (no 4-hop hold) with a shared 32-wide hidden column h_t, two heads on it — the voice logit
# and the 61-way pitch (60 semitone bins C3..B7 + none). Both are causal by construction (left zero-padding in time, the same zeros the
# ears' stream starts from), so the batch model on a window equals the stream column for column (tools/test_vox.js (ii) proves it).
#   tcn  40 → 32 (k3) then five 32 → 32 (k3, dilations 1 2 4 8 16, residual, ReLU): receptive field 65 hops ≈ 693 ms, ≈ 21 k MAC / hop
#   gru  the 2-D trunk per hop — conv 3×3 ×16 (causal in time) → ReLU → pool (2, 1) → conv 3×3 ×16 → ReLU → pool (2, 1) → the 16 × 10
#        column (160) → GRU(32): the pooling only along frequency so a column exists every hop; ≈ 72 k MAC / hop
# The training windows are SEQ hops long with the loss on the last LOSS_COLS columns (the first columns warm the receptive field / the
# state up, exactly as the ears' first hops do); every column has its own voice target (the hop's label, −1 masked) and pitch target
# (PITCH_* above, PITCH_SKIP masked; a band-shifted window has NO pitch loss — a mel-band shift is not a semitone).
NET = 'cnn'
SEQ, LOSS_COLS = 128, 64
TCN_C, TCN_DIL = 32, (1, 2, 4, 8, 16)
GRU_H = 32


def make_stream_model(torch, net):
    nn = torch.nn; F = torch.nn.functional
    class TCN(nn.Module):
        def __init__(self):
            super().__init__()
            self.inp = nn.Conv1d(N_MEL, TCN_C, 3)
            self.blocks = nn.ModuleList([nn.Conv1d(TCN_C, TCN_C, 3, dilation=d) for d in TCN_DIL])
            self.voice = nn.Conv1d(TCN_C, 1, 1)
            self.pitch = nn.Conv1d(TCN_C, PITCH_BINS + 1, 1)
        def forward(self, x):                                   # x (B, 40, T) → voice (B, T), pitch (B, 61, T)
            h = torch.relu(self.inp(F.pad(x, (2, 0))))
            for conv, d in zip(self.blocks, TCN_DIL):
                h = h + torch.relu(conv(F.pad(h, (2 * d, 0))))
            return self.voice(h).squeeze(1), self.pitch(h)
    class GRUNet(nn.Module):
        def __init__(self):
            super().__init__()
            self.conv1 = nn.Conv2d(1, 16, 3, padding=(1, 0))
            self.conv2 = nn.Conv2d(16, 16, 3, padding=(1, 0))
            self.gru = nn.GRU(16 * (N_MEL // 4), GRU_H, batch_first=True)
            self.voice = nn.Linear(GRU_H, 1)
            self.pitch = nn.Linear(GRU_H, PITCH_BINS + 1)
        def forward(self, x):                                   # x (B, 40, T)
            h = x[:, None]                                      # (B, 1, 40, T)
            h = torch.relu(self.conv1(F.pad(h, (2, 0)))); h = F.max_pool2d(h, (2, 1))      # (B, 16, 20, T)
            h = torch.relu(self.conv2(F.pad(h, (2, 0)))); h = F.max_pool2d(h, (2, 1))      # (B, 16, 10, T)
            B, C, Fq, T = h.shape
            h = h.reshape(B, C * Fq, T).permute(0, 2, 1)        # (B, T, 160) — index ch·10 + f
            h, _ = self.gru(h)                                  # (B, T, 32)
            return self.voice(h).squeeze(2), self.pitch(h).permute(0, 2, 1)
    return TCN() if net == 'tcn' else GRUNet()


def stream_order(net):
    if net == 'tcn':
        return ['inp.weight', 'inp.bias'] + [f'blocks.{i}.{k}' for i in range(len(TCN_DIL)) for k in ('weight', 'bias')] + ['voice.weight', 'voice.bias', 'pitch.weight', 'pitch.bias']
    return ['conv1.weight', 'conv1.bias', 'conv2.weight', 'conv2.bias', 'gru.weight_ih_l0', 'gru.weight_hh_l0', 'gru.bias_ih_l0', 'gru.bias_hh_l0', 'voice.weight', 'voice.bias', 'pitch.weight', 'pitch.bias']


def stream_macs(net):
    if net == 'tcn': return N_MEL * TCN_C * 3 + len(TCN_DIL) * TCN_C * TCN_C * 3 + TCN_C + TCN_C * (PITCH_BINS + 1)
    return 16 * 9 * N_MEL + 16 * 16 * 9 * (N_MEL // 2) + 3 * (160 * GRU_H + GRU_H * GRU_H) + GRU_H + GRU_H * (PITCH_BINS + 1)


SEQ_LOOK = int(math.ceil((SEQ - 1) * STRETCH[1])) + 1


class SeqGroup:
    """Every (item, hop) a SEQ-hop window may END at — the end's voice target valid and the stretched span inside the item — with X the
    concatenated columns and the per-column targets YS (voice, −1 masked) and YP (pitch, PITCH_SKIP masked)."""
    def __init__(self, sets):
        xs, yss, yps, ids = [], [], [], []
        off = 0
        for x, ys, yp, rep in sets:
            n = len(x)
            ok = np.arange(min(SEQ_LOOK, n), n)
            ok = ok[ys[ok] >= 0]
            for _ in range(rep): ids.append(ok + off)
            xs.append(x); yss.append(ys); yps.append(yp); off += n
        self.X = np.concatenate(xs).astype(np.float32) if xs else np.zeros((0, N_MEL), np.float32)
        self.YS = np.concatenate(yss).astype(np.float32) if yss else np.zeros(0, np.float32)
        self.YP = np.concatenate(yps).astype(np.int8) if yps else np.zeros(0, np.int8)
        self.idx = np.concatenate(ids) if ids else np.zeros(0, int)
        self.y = self.YS[self.idx] if len(self.idx) else np.zeros(0, np.float32)
    def batch(self, sel, rng, stretch=True):
        e = self.idx[sel]; B = len(e)
        f = np.ones(B)
        if stretch:
            m = rng.random(B) < 0.5
            f[m] = rng.uniform(STRETCH[0], STRETCH[1], m.sum())
        pos = e[:, None] - (SEQ - 1 - np.arange(SEQ))[None, :] * f[:, None]      # (B, SEQ), the last column = e exactly
        i0 = np.floor(pos).astype(int); w = (pos - i0).astype(np.float32)
        i1 = np.minimum(i0 + 1, e[:, None])
        x = self.X[i0] * (1 - w)[:, :, None] + self.X[i1] * w[:, :, None]             # (B, SEQ, 40)
        r = np.clip(np.round(pos).astype(int), 0, len(self.YS) - 1)
        return np.ascontiguousarray(x.transpose(0, 2, 1)), self.YS[r], self.YP[r]      # (B, 40, SEQ), (B, SEQ), (B, SEQ)


def augment_seq(x, rng):
    """The §123 / §126 jitter on a (B, 40, T) batch; returns the batch and the band shift per window (a shifted window gets no pitch loss)."""
    B = x.shape[0]
    k = rng.integers(-PITCH_BANDS, PITCH_BANDS + 1, B)
    if PITCH_BANDS:
        idx = np.clip(np.arange(N_MEL)[None, :] - k[:, None], 0, N_MEL - 1)
        x = np.take_along_axis(x, idx[:, :, None], axis=1)
    off = rng.normal(0, 0.3, (B, 1, 1)).astype(np.float32)
    tilt = rng.normal(0, 0.3, (B, 1, 1)).astype(np.float32) * np.linspace(-1, 1, N_MEL, dtype=np.float32)[None, :, None]
    gain = rng.normal(1.0, 0.1, (B, 1, 1)).astype(np.float32)
    noise = rng.normal(0, 0.05, x.shape).astype(np.float32)
    return x * gain + off + tilt + noise, k


def predict_seq(model, torch, x):
    """The whole item as one causal sequence: (H,) voice prob, (H, 61) pitch prob."""
    with torch.no_grad():
        v, pp = model(torch.from_numpy(np.ascontiguousarray(x.T.astype(np.float32)))[None])
        return torch.sigmoid(v[0]).numpy(), torch.softmax(pp[0], dim=0).numpy().T


def evaluate_seq(model, torch, sets):
    """sets: (name, x, y_hard, yp). The voice numbers as evaluate() (the hard labels from hop T_WIN−1 on, so the rows compare to run 2's),
    plus the pitch head where a pYIN target exists: exact-bin %, within ±1 bin %, a pitch published (argmax < none) %, and none-correct % on the explicit-none frames."""
    rows = []; ally, allp = [], []; pe = pm = pa = pn = 0; npit = nnone = 0
    for name, x, y, yp in sets:
        if len(x) < T_WIN: continue
        pv, pp = predict_seq(model, torch, x)
        ok = np.arange(T_WIN - 1, len(x)); ok = ok[y[ok] >= 0]
        if not len(ok): continue
        Y = y[ok].astype(np.float32); p = pv[ok]
        F, pr, rc = f1(Y, p)
        row = {'track': name, 'frames': int(len(Y)), 'sung_pct': round(100 * float(Y.mean()), 1), 'F1': round(F, 3), 'P': round(pr, 3), 'R': round(rc, 3), 'AUC': round(auc(Y, p), 3), 'fp_pct': round(100 * float(((p >= 0.5) & (Y == 0)).sum() / max(1, (Y == 0).sum())), 1)}
        am = pp.argmax(axis=1)
        tp = np.where(yp >= 0)[0]; tn = np.where(yp == PITCH_NONE)[0]
        if len(tp):
            d = np.abs(am[tp] - yp[tp]); pub = am[tp] < PITCH_BINS
            row.update({'pitch_frames': int(len(tp)), 'pitch_pub_pct': round(100 * float(pub.mean()), 1), 'pitch_exact_pct': round(100 * float((d == 0).mean()), 1), 'pitch_pm1_pct': round(100 * float((d <= 1).mean()), 1)})
            pe += int((d == 0).sum()); pm += int((d <= 1).sum()); pa += int(pub.sum()); npit += len(tp)
        if len(tn):
            row['none_ok_pct'] = round(100 * float((am[tn] == PITCH_BINS).mean()), 1); pn += int((am[tn] == PITCH_BINS).sum()); nnone += len(tn)
        rows.append(row); ally.append(Y); allp.append(p)
    if not ally: return rows, {'frames': 0}
    Y = np.concatenate(ally); P = np.concatenate(allp)
    F, pr, rc = f1(Y, P)
    tot = {'frames': int(len(Y)), 'F1': round(F, 3), 'P': round(pr, 3), 'R': round(rc, 3), 'AUC': round(auc(Y, P), 3)}
    if npit: tot.update({'pitch_frames': npit, 'pitch_pub_pct': round(100 * pa / npit, 1), 'pitch_exact_pct': round(100 * pe / npit, 1), 'pitch_pm1_pct': round(100 * pm / npit, 1)})
    if nnone: tot['none_ok_pct'] = round(100 * pn / nnone, 1)
    return rows, tot


def export_stream(model, torch, report, vf, net):
    """The weights module for a stream net (both heads), its ONNX, and the parity frames: 200 held Jamendo-test windows of PAR_T hops with
    EVERY column's voice logit and 61 pitch logits from onnxruntime."""
    import onnxruntime as ort
    PAR_T = 64
    sd = {k: v.detach().cpu().numpy() for k, v in model.state_dict().items()}
    order = stream_order(net)
    flat = np.concatenate([sd[k].ravel() for k in order]).astype(np.float32)
    f16 = flat.astype(np.float16); back = f16.astype(np.float32)
    with torch.no_grad():
        o = 0
        for k in order:
            n = sd[k].size
            model.state_dict()[k].copy_(torch.from_numpy(back[o:o + n].reshape(sd[k].shape))); o += n
    model.eval()
    shapes = {k: list(sd[k].shape) for k in order}
    b64 = base64.b64encode(f16.astype('<f2').tobytes()).decode('ascii')
    os.makedirs(WORK, exist_ok=True)
    onnx_path = os.path.join(WORK, 'vox.onnx')
    dummy = torch.zeros(1, N_MEL, PAR_T)
    torch.onnx.export(model, dummy, onnx_path, input_names=['mel'], output_names=['voice', 'pitch'], opset_version=17, dynamo=False)
    sess = ort.InferenceSession(onnx_path, providers=['CPUExecutionProvider'])
    rng = np.random.default_rng(SEED)
    mels, vo, po = [], [], []
    for n in filelist('test'):
        x = build_jamendo(n, vf)[0]
        for e in rng.choice(np.arange(PAR_T, len(x)), 13, replace=False):
            mels.append(np.ascontiguousarray(x[e - PAR_T + 1:e + 1].T.astype(np.float32)))
    mels = np.stack(mels[:200])
    for i in range(len(mels)):
        v, pp = sess.run(None, {'mel': mels[i:i + 1]})
        vo.append(v[0]); po.append(pp[0])
    with torch.no_grad():
        tv, tp = model(torch.from_numpy(mels))
    dmax = max(float(np.abs(tv.numpy() - np.stack(vo)).max()), float(np.abs(tp.numpy() - np.stack(po)).max()))
    print(f'  onnx vs torch on {len(mels)} held windows of {PAR_T} hops, every column: max |Δlogit| {dmax:.2e}')
    json.dump({'n': int(len(mels)), 'net': net, 'shape': [N_MEL, PAR_T], 'mel': [[round(float(v), 6) for v in m.ravel()] for m in mels],
               'voice': [[round(float(v), 5) for v in r] for r in vo], 'pitch': [[[round(float(v), 5) for v in c] for c in r.T] for r in po],
               'note': 'mel row-major (band, hop): index = band*T + hop; voice[i][t] the logit at column t; pitch[i][t] the 61 logits (bins C3..B7, then none) at column t'},
              open(os.path.join(WORK, 'onnx-parity.json'), 'w'))
    prov = report.get('provenance', {}); held = report.get('held', {}); te = report.get('jamendo_test', {})
    arch = ('a causal TCN over the mel column: 40 -> %d (k3), %d x %d -> %d (k3, dilations %s, residual, ReLU), receptive field %d hops' % (TCN_C, len(TCN_DIL), TCN_C, TCN_C, ' '.join(map(str, TCN_DIL)), 3 + 2 * sum(TCN_DIL))
            if net == 'tcn' else 'the 2-D trunk per hop (conv 3x3 x16 causal -> pool (2,1) -> conv 3x3 x16 -> pool (2,1), the 16 x 10 column) -> GRU(32)')
    lines = ['// ' + l for l in HEAD] + [
        "// The live vocal detector's weights (DECISIONS §123, retrained §126, the streaming net §133; tools/truth/voxtrain.py wrote this file — do not edit by hand).",
        '// %s; two heads on the shared 32-wide hidden column: the voice logit -> sigmoid, and the 61-way pitch' % arch,
        '// (60 semitone bins C3..B7 + none, softmax) — an output EVERY hop. %d parameters, ~%d multiply-adds per hop, %s.' % (len(flat), stream_macs(net), net.upper()),
        '// Float16 little-endian, base64 (%d bytes), in the order %s; ears/vox-net.js decodes and runs it as a stream.' % (len(f16) * 2, ', '.join(order)),
        '// Trained %s on CPU (%s). THE CORPORA — none of their audio is here; these weights are the derived work and this' % (prov.get('date', ''), prov.get('summary', '')),
        '// header is their attribution (THIRD-PARTY.md has the full notices):',
        '//   · the Jamendo singing-voice corpus (Ramona, Richard, David, ICASSP 2008; Zenodo record 2585988, licence "cc-by-4.0" = CC BY 4.0):',
        '//     61 train + 16 valid tracks, their Demucs vocal / accompaniment stems (remixes, hard negatives);',
        '//   · MusicNet (Thickstun, Harchaoui, Kakade, ICLR 2017; Zenodo record 5120004, licence "cc-by-4.0" = Creative Commons Attribution 4.0',
        '//     International): a 4.6 h subset of solo piano and strings / winds, no-voice negatives;',
        '//   · MAESTRO v3.0.0 (Hawthorne et al., ICLR 2019; Google LLC, LICENSE: "Attribution-NonCommercial-ShareAlike 4.0 International",',
        '//     CC BY-NC-SA 4.0): a 2.3 h subset of solo piano, no-voice negatives — Retina Rave is non-commercial (the user, 2026-10-12:',
        '//     "use the non-commercial sets -> still can publish the weights; don\'t worry we are not monetizing this");',
        '//   · five of this project\'s own library tracks (the ear-accepted hand windows, §122, the Demucs lane as a soft target, §126) and six',
        '//     of their accompaniments; IBelongHere and Comptine UNSEEN; WhoLikesToParty out of the loss.',
        '//   The pitch head\'s targets are pYIN (librosa) on the Demucs vocal stems of the Jamendo train tracks and the five library tracks (§133).',
        '// Jamendo test F1 %s / AUC %s, pitch exact / ±1 bin %s / %s %%; unseen IBelongHere F1 %s / AUC %s, unseen Comptine false positives %s %%; VAR_FLOOR %g.' % (
            te.get('F1'), te.get('AUC'), te.get('pitch_exact_pct'), te.get('pitch_pm1_pct'),
            held.get('IBelongHere', {}).get('F1'), held.get('IBelongHere', {}).get('AUC'), held.get('Comptine', {}).get('fp_pct'), vf),
        'export const VOX_W = {',
        "  net: '%s', nMel: %d, nParams: %d, macPerHop: %d, pitchBins: %d, pitchC3: %.10g, hidden: %d, dil: %s," % (net, N_MEL, len(flat), stream_macs(net), PITCH_BINS, PITCH_C3, TCN_C if net == 'tcn' else GRU_H, json.dumps(list(TCN_DIL))),
        '  shapes: ' + json.dumps(shapes).replace('"', "'") + ',',
        '  order: ' + json.dumps(order).replace('"', "'") + ',',
        "  f16: '" + b64 + "',",
        '};',
        '',
    ]
    out = os.path.join(ROOT, 'assets', 'engine', 'ears', 'vox-weights.js')
    open(out, 'w').write('\n'.join(lines))
    print(f'  wrote {out} ({os.path.getsize(out)} bytes), {onnx_path}, onnx-parity.json')
    return dmax


# ---------------------------------------------------------------------------------------------------- the export
HEAD = [
    'Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):',
    'use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.',
    'Source: https://github.com/tbkraf08/RetinaRave',
]


def export(model, torch, report, vf):
    import onnxruntime as ort
    sd = {k: v.detach().cpu().numpy() for k, v in model.state_dict().items()}
    order = ['conv1.weight', 'conv1.bias', 'conv2.weight', 'conv2.bias', 'fc1.weight', 'fc1.bias', 'fc2.weight', 'fc2.bias']
    flat = np.concatenate([sd[k].ravel() for k in order]).astype(np.float32)
    f16 = flat.astype(np.float16)
    back = f16.astype(np.float32)
    # the model carries the ROUNDED weights from here on: the ONNX, the parity frames and the JS all see the same numbers
    with torch.no_grad():
        o = 0
        for k in order:
            n = sd[k].size
            model.state_dict()[k].copy_(torch.from_numpy(back[o:o + n].reshape(sd[k].shape))); o += n
    model.eval()
    shapes = {k: list(sd[k].shape) for k in order}
    b64 = base64.b64encode(f16.astype('<f2').tobytes()).decode('ascii')
    os.makedirs(WORK, exist_ok=True)
    onnx_path = os.path.join(WORK, 'vox.onnx')
    dummy = torch.zeros(1, 1, N_MEL, T_WIN)
    try:
        torch.onnx.export(model, dummy, onnx_path, input_names=['mel'], output_names=['logit'], opset_version=17, dynamo=False)
    except Exception as e:
        print('  onnx export (dynamo=False) failed:', str(e)[:120], '— trying dynamo=True')
        ep = torch.onnx.export(model, (dummy,), input_names=['mel'], output_names=['logit'], dynamo=True)
        ep.save(onnx_path)
    # the parity frames: 200 held Jamendo-test windows through onnxruntime AND torch (they must agree with each other first)
    sess = ort.InferenceSession(onnx_path, providers=['CPUExecutionProvider'])
    rng = np.random.default_rng(SEED)
    held = [build_jamendo(n, vf)[:2] for n in filelist('test')]
    X = np.concatenate([frames_of(x, y)[0][rng.choice(len(frames_of(x, y)[0]), 13, replace=False)] for x, y in held])[:200]
    outs = []
    for i in range(len(X)):
        outs.append(float(sess.run(None, {'mel': X[i:i + 1]})[0].ravel()[0]))
    pt = model(torch.from_numpy(X)).detach().numpy()
    dmax = float(np.abs(pt - np.array(outs)).max())
    print(f'  onnx vs torch on 200 held frames: max |Δlogit| {dmax:.2e}')
    json.dump({'n': len(X), 'shape': [N_MEL, T_WIN], 'mel': [[round(float(v), 6) for v in X[i, 0].ravel()] for i in range(len(X))],
               'logit': [round(v, 6) for v in outs], 'prob': [round(float(1 / (1 + math.exp(-v))), 6) for v in outs],
               'note': 'row-major (mel band, hop): index = band*34 + hop; hop 33 is the newest'},
              open(os.path.join(WORK, 'onnx-parity.json'), 'w'))
    prov = report.get('provenance', {})
    held = report.get('held', {})
    lines = ['// ' + l for l in HEAD] + [
        '// The live vocal detector\'s weights (DECISIONS §123, retrained §126; tools/truth/voxtrain.py wrote this file — do not edit by hand).',
        '// A 40 x 34 log-mel window -> conv 3x3 x16 -> pool 2 -> conv 3x3 x16 -> pool 2 -> dense 32 -> dense 1 -> sigmoid, %d parameters,' % len(flat),
        '// Float16 little-endian, base64 (%d bytes), in the order %s; ears/vox-net.js decodes and runs it as a stream.' % (len(f16) * 2, ', '.join(order)),
        '// Trained %s on CPU (%s). THE CORPORA — none of their audio is here; these weights are the derived work and this' % (prov.get('date', ''), prov.get('summary', '')),
        '// header is their attribution (THIRD-PARTY.md has the full notices):',
        '//   · the Jamendo singing-voice corpus (Ramona, Richard, David, ICASSP 2008; Zenodo record 2585988, licence "cc-by-4.0" = CC BY 4.0):',
        '//     61 train + 16 valid tracks, their Demucs vocal / accompaniment stems (remixes, hard negatives);',
        '//   · MusicNet (Thickstun, Harchaoui, Kakade, ICLR 2017; Zenodo record 5120004, licence "cc-by-4.0" = Creative Commons Attribution 4.0',
        '//     International): a 4.6 h subset of solo piano and strings / winds, no-voice negatives;',
        '//   · MAESTRO v3.0.0 (Hawthorne et al., ICLR 2019; Google LLC, LICENSE: "Attribution-NonCommercial-ShareAlike 4.0 International",',
        '//     CC BY-NC-SA 4.0): a 2.3 h subset of solo piano, no-voice negatives — Retina Rave is non-commercial (the user, 2026-10-12:',
        '//     "use the non-commercial sets -> still can publish the weights; don\'t worry we are not monetizing this");',
        '//   · five of this project\'s own library tracks (the ear-accepted hand windows, §122, the Demucs lane as a soft target, §126) and six',
        '//     of their accompaniments; IBelongHere and Comptine UNSEEN; WhoLikesToParty out of the loss.',
        '// Jamendo test F1 %s / AUC %s; unseen IBelongHere F1 %s / AUC %s, unseen Comptine false positives %s %%; VAR_FLOOR %g.' % (
            report.get('jamendo_test', {}).get('F1'), report.get('jamendo_test', {}).get('AUC'),
            held.get('IBelongHere', {}).get('F1'), held.get('IBelongHere', {}).get('AUC'), held.get('Comptine', {}).get('fp_pct'), vf),
        'export const VOX_W = {',
        '  nMel: %d, tWin: %d, nParams: %d,' % (N_MEL, T_WIN, len(flat)),
        '  shapes: ' + json.dumps(shapes).replace('"', "'") + ',',
        '  order: ' + json.dumps(order).replace('"', "'") + ',',
        "  f16: '" + b64 + "',",
        '};',
        '',
    ]
    out = os.path.join(ROOT, 'assets', 'engine', 'ears', 'vox-weights.js')
    open(out, 'w').write('\n'.join(lines))
    print(f'  wrote {out} ({os.path.getsize(out)} bytes), {onnx_path}, onnx-parity.json')
    return dmax


def write_mel_parity(track, vf):
    mid, sr = load_dump(track)
    n = min(len(mid), 48000 * 40)       # 40 s: 3747 hops, 1.2 MB of json
    lm = logmel(mid[:n]); x = normalise(lm, var_floor=vf)
    H = min(len(lm), 3000)
    json.dump({'track': track, 'sr': sr, 'firstHop': FIRST_HOP, 'hops': H, 'nMel': N_MEL, 'varFloor': vf,
               'raw': [[round(float(v), 6) for v in r] for r in lm[:H]], 'norm': [[round(float(v), 6) for v in r] for r in x[:H]]},
              open(os.path.join(WORK, f'mel-{track}.json'), 'w'))
    print(f'  mel parity reference: tools/work/vox/mel-{track}.json ({H} hops from hop {FIRST_HOP}, VAR_FLOOR {vf:g})')


# ---------------------------------------------------------------------------------------------------- the build (parallel)
def _build_one(j):
    kind, name, vf = j
    if kind == 'jam': build_jamendo(name, vf)
    elif kind == 'lib': build_lib(name, vf)
    elif kind == 'acc': build_acc(name, vf)
    elif kind == 'jacc': build_jacc(name, vf)
    else: build_classical(name[0], name[1], vf)
    return j


def build_all(log, pool, vf):
    jobs = [('jam', n, vf) for n in train_names() + filelist('valid') + filelist('test')] + [('lib', t, vf) for t in LIB_TRAIN + LIB_HELD + LIB_RECORDED] \
        + [('acc', t, vf) for t in ACC_TRACKS] + [('jacc', n, vf) for n in train_names() if has_stem(n, 'no_vocals')] \
        + [('cls', kp, vf) for kp in classical_files()]
    log(f'front end: {len(jobs)} items (raw log-mel cached under {os.path.relpath(MELDIR, ROOT)}/raw, normalised under vf{vf:g})')
    t0 = time.time()
    done = 0
    for _ in pool.imap_unordered(_build_one, jobs):
        done += 1
        if done % 40 == 0: log(f'  {done} / {len(jobs)} built, {time.time() - t0:.0f} s')
    log(f'front end ready in {time.time() - t0:.0f} s')


# ---------------------------------------------------------------------------------------------------- main
def main():
    global CLASSICAL_HELD, PARTIAL, SNR_DB, QUOTA, SOFT_FLOOR, NET, PITCH_W, TCN_C, TCN_DIL, ONSET_W
    args = sys.argv[1:]
    PARTIAL = '--partial' in args
    opt = lambda k, d: next((a.split('=', 1)[1] for a in args if a.startswith('--' + k + '=')), d)
    log = lambda s: print(s, flush=True)
    os.makedirs(WORK, exist_ok=True)
    vf = float(opt('var-floor', VAR_FLOOR))
    if opt('snr', None): SNR_DB = tuple(float(v) for v in opt('snr', '').split(','))
    if opt('quota', None): QUOTA = dict(zip(('jam', 'lib', 'neg', 'remix'), (float(v) for v in opt('quota', '').split(','))))
    SOFT_FLOOR = float(opt('soft-floor', SOFT_FLOOR))
    NET = opt('net', NET); PITCH_W = float(opt('pitch-w', PITCH_W)); TCN_C = int(opt('tcn-c', TCN_C))
    if opt('tcn-dil', None): TCN_DIL = tuple(int(v) for v in opt('tcn-dil', '').split(','))
    ONSET_W = float(opt('onset-w', ONSET_W))
    assert NET in ('cnn', 'tcn', 'gru'), NET
    stream = NET != 'cnn'
    if opt('mel-only', None):
        write_mel_parity(opt('mel-only', None), vf); return
    if '--pyin-only' in args:       # §133: the Jamendo stems' pYIN alone (the pitch head's targets; cached, then a no-op)
        import multiprocessing as mp
        pool = mp.get_context('forkserver').Pool(int(opt('procs', 12))); pyin_all(log, pool); pool.close(); pool.join(); return
    tag = opt('tag', time.strftime('%Y%m%d-%H%M'))
    import multiprocessing as mp
    ctx = mp.get_context('forkserver')
    pool = ctx.Pool(int(opt('procs', 12)))
    import torch
    torch.set_num_threads(int(opt('threads', 24))); torch.manual_seed(SEED)
    rng = np.random.default_rng(SEED)
    cls = classical_files()
    mnp = [k for k, p in cls if k.startswith('mn-pi')]; mns = [k for k, p in cls if k.startswith('mn-st')]; ma = [k for k, p in cls if k.startswith('ma-')]
    CLASSICAL_HELD = [g[0] for g in (mnp, mns, ma) if g]
    n_jam_stems = sum(has_stem(n) for n in filelist('train'))
    log(f'data: Jamendo train stems {n_jam_stems} / {len(filelist("train"))}{" — PARTIAL: training on those alone" if PARTIAL else ""}; classical files {len(cls)} (MusicNet piano {len(mnp)}, strings/winds {len(mns)}, MAESTRO {len(ma)}; held out {CLASSICAL_HELD}); lanes from {MUSIC}')
    build_all(log, pool, vf)
    log('loading the front ends …')
    jam = {s: [(n, build_jamendo(n, vf)) for n in (train_names() if s == 'train' else filelist(s))] for s in ('train', 'valid', 'test')}
    lib_tr = [(t, build_lib(t, vf)) for t in LIB_TRAIN]
    if SOFT_FLOOR > 0:   # the knob is applied after the cache (the cached ys is the lane's own read)
        lib_tr = [(t, (x, y, np.where((ys > 0) & (ys < SOFT_FLOOR), -1, ys).astype(np.float32), tt)) for t, (x, y, ys, tt) in lib_tr]
    log(f'knobs: remix SNR {SNR_DB[0]:+g}..{SNR_DB[1]:+g} dB, quota {QUOTA}, soft floor {SOFT_FLOOR:g}')
    lib_held = [(t, build_lib(t, vf)) for t in LIB_HELD]
    lib_rec = [(t, build_lib(t, vf)) for t in LIB_RECORDED]
    accs = [('acc:' + t, build_acc(t, vf)) for t in ACC_TRACKS] + [('jacc:' + os.path.splitext(n)[0], build_jacc(n, vf)) for n in train_names() if has_stem(n, 'no_vocals')]
    cls_tr = [(k, build_classical(k, p, vf)) for k, p in cls if k not in CLASSICAL_HELD]
    cls_held = [(k, build_classical(k, p, vf)) for k, p in cls if k in CLASSICAL_HELD]
    # §133: the pitch target per item (the stream nets' second head; a no-op for --net=cnn): {name: yp}
    YP = {}
    if stream:
        if not all(os.path.exists(os.path.join(PYIN_DIR, 'jam-' + os.path.splitext(n)[0] + '.npz')) for n in train_names()):
            raise SystemExit('the Jamendo stems\' pYIN is not cached — fix: python3 tools/truth/voxtrain.py --pyin-only')
        for sp in ('train', 'valid', 'test'):
            for n, (x, y, ys, t) in jam[sp]: YP[n] = pitch_jamendo(n, t, y)
        for t_, (x, y, ys, t) in lib_tr + lib_held + lib_rec: YP[t_] = pitch_lib(t_, t)
        for n, (x, y, ys, t) in accs + cls_tr + cls_held: YP[n] = pitch_none(t)
        log(f'  pitch targets: ' + ', '.join(f'{sp} {sum(int((YP[n] >= 0).sum()) for n, _ in jam[sp])} bins' for sp in ('train', 'valid', 'test')) + f', library {sum(int((YP[t_] >= 0).sum()) for t_, _ in lib_tr)} bins')
    if stream:
        groups = {
            'jam': SeqGroup([(x, ys, YP[n], 1) for n, (x, y, ys, t) in jam['train']]),
            'lib': SeqGroup([(x, ys, YP[n], LIB_OVERSAMPLE) for n, (x, y, ys, t) in lib_tr]),
            'neg': SeqGroup([(x, ys, YP[n], 1) for n, (x, y, ys, t) in accs + cls_tr]),
        }
    else:
        groups = {
            'jam': Group([(x, ys, 1) for n, (x, y, ys, t) in jam['train']]),
            'lib': Group([(x, ys, LIB_OVERSAMPLE) for n, (x, y, ys, t) in lib_tr]),
            'neg': Group([(x, ys, 1) for n, (x, y, ys, t) in accs + cls_tr]),
        }
    for k, g in groups.items(): log(f'  group {k}: {len(g.idx)} windows ({100 * float(np.mean(g.y >= 0.5)) if len(g.y) else 0:.1f} % sung)')
    vox_src, beds = remix_sources()
    log(f'  remixes: {len(vox_src)} vocal sources x {len(beds)} beds, {REMIXES_PER_EPOCH} per epoch at {SNR_DB[0]:+.0f}..{SNR_DB[1]:+.0f} dB SNR, {REMIX_SECONDS:.0f} s each')
    model = make_stream_model(torch, NET) if stream else make_model(torch)
    nparams = sum(p.numel() for p in model.parameters())
    log(f'net: {NET}, {nparams} parameters' + (f', ~{stream_macs(NET)} MAC / hop, windows of {SEQ} hops with the loss on the last {LOSS_COLS}, pitch loss weight {PITCH_W}' if stream else ''))
    epochs = int(opt('epochs', 12)); per_epoch = int(opt('per-epoch', 100000 if stream else 400000)); bs = 512; n_remix = int(opt('remixes', REMIXES_PER_EPOCH))
    optim = torch.optim.Adam(model.parameters(), lr=1e-3)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(optim, T_max=epochs)
    lossf = torch.nn.BCEWithLogitsLoss(pos_weight=torch.tensor(POS_WEIGHT))
    ce = torch.nn.CrossEntropyLoss()
    colmask = torch.zeros(SEQ, dtype=torch.bool); colmask[SEQ - LOSS_COLS:] = True
    best = None; hist = []; last_remix = []
    if opt('no-train', None) is None:
        for ep in range(epochs):
            t0 = time.time()
            rem = draw_remixes(pool, rng, vox_src, beds, n_remix, vf) if n_remix else []
            last_remix = rem
            groups['remix'] = SeqGroup([(x, ys, yp, 1) for name, x, ys, yp in rem]) if stream else Group([(x, ys, 1) for name, x, ys, yp in rem])
            t_rem = time.time() - t0
            # the draw by quota, per group (with replacement only where a group is smaller than its share)
            draws = []
            for k, q in QUOTA.items():
                g = groups[k]; want = int(per_epoch * q)
                if not len(g.idx): continue
                sel = rng.choice(len(g.idx), want, replace=want > len(g.idx))
                draws.append((k, sel))
            order = np.concatenate([np.full(len(s), i) for i, (k, s) in enumerate(draws)]); rng.shuffle(order)
            ptr = [0] * len(draws)
            model.train(); tot = 0.0; totp = 0.0; nb = 0; npos = 0; ntot = 0
            for i in range(0, len(order), bs):
                chunk = order[i:i + bs]
                xs, ys, yps = [], [], []
                for gi, (k, sel) in enumerate(draws):
                    c = int((chunk == gi).sum())
                    if not c: continue
                    if stream:
                        xb, yb, pb = groups[k].batch(sel[ptr[gi]:ptr[gi] + c], rng); yps.append(pb)
                    else:
                        xb, yb = groups[k].batch(sel[ptr[gi]:ptr[gi] + c], rng)
                    ptr[gi] += c
                    xs.append(xb); ys.append(yb)
                optim.zero_grad()
                if stream:
                    xb, shift = augment_seq(np.concatenate(xs), rng); yb = np.concatenate(ys); pb = np.concatenate(yps)
                    lv, lp = model(torch.from_numpy(xb))
                    yv = torch.from_numpy(yb); mv = (yv >= 0) & colmask[None, :]
                    if ONSET_W != 1.0:      # the columns right after a rising edge of the target weigh ONSET_W: the net is asked to commit early, from the past alone
                        on = (yb >= 0.5); edge = np.zeros_like(on); edge[:, 1:] = on[:, 1:] & ~on[:, :-1] & (yb[:, :-1] >= 0)
                        near = np.zeros_like(on)
                        for k in range(ONSET_HOPS): near[:, k:] |= edge[:, :SEQ - k]
                        wgt = torch.from_numpy(np.where(near, ONSET_W, 1.0).astype(np.float32))[mv]
                        loss = (torch.nn.functional.binary_cross_entropy_with_logits(lv[mv], yv[mv], reduction='none') * wgt).sum() / wgt.sum()
                    else:
                        loss = lossf(lv[mv], yv[mv])
                    yp_ = torch.from_numpy(pb.astype(np.int64)); mp = (yp_ >= PITCH_NONE) & colmask[None, :] & torch.from_numpy(shift == 0)[:, None]
                    if mp.any():
                        lossp = ce(lp.permute(0, 2, 1)[mp], torch.where(yp_[mp] == PITCH_NONE, PITCH_BINS, yp_[mp]))
                        loss = loss + PITCH_W * lossp; totp += float(lossp)
                    npos += float((yb[:, SEQ - LOSS_COLS:] >= 0.5).sum()); ntot += int(mv.sum())
                else:
                    xb = augment(np.concatenate(xs), rng); yb = np.concatenate(ys)
                    npos += float((yb >= 0.5).sum()); ntot += len(yb)
                    loss = lossf(model(torch.from_numpy(xb)), torch.from_numpy(yb))
                loss.backward(); optim.step()
                tot += float(loss); nb += 1
            sched.step()
            model.eval()
            if stream: _, va = evaluate_seq(model, torch, [(n, x, y, YP[n]) for n, (x, y, ys, t) in jam['valid']])
            else: _, va = evaluate(model, torch, [(n, x, y) for n, (x, y, ys, t) in jam['valid']])
            hist.append({'epoch': ep + 1, 'loss': round(tot / nb, 4), 'pitch_loss': round(totp / nb, 4), 'valid_F1': va['F1'], 'valid_AUC': va['AUC'], 'valid_pitch_exact_pct': va.get('pitch_exact_pct'), 's': round(time.time() - t0), 'remix_s': round(t_rem), 'sung_pct': round(100 * npos / max(1, ntot), 1), 'remixes': len(rem)})
            log(f'  epoch {ep + 1:2d}  loss {tot / nb:.4f}' + (f' (pitch {totp / nb:.4f})' if stream else '') + f'  valid F1 {va["F1"]:.3f} AUC {va["AUC"]:.3f}' + (f' pitch exact {va.get("pitch_exact_pct")} % ±1 {va.get("pitch_pm1_pct")} %' if stream else '') + f'  {time.time() - t0:.0f} s (remixes {len(rem)} in {t_rem:.0f} s; {100 * npos / max(1, ntot):.0f} % sung)')
            if best is None or va['AUC'] > best[0]:
                best = (va['AUC'], {k: v.clone() for k, v in model.state_dict().items()}, ep + 1)
        model.load_state_dict(best[1]); log(f'best epoch {best[2]} (valid AUC {best[0]:.3f})')
        torch.save(model.state_dict(), os.path.join(WORK, 'vox-net.pt'))
    else:
        model.load_state_dict(torch.load(os.path.join(WORK, 'vox-net.pt')))
    model.eval()
    if stream:
        H = lambda L: [(n, x, y, YP[n]) for n, (x, y, ys, t) in L]
        evaluate_ = lambda m, tc, sets: evaluate_seq(m, tc, sets)
    else:
        H = lambda L: [(n, x, y) for n, (x, y, ys, t) in L]
        evaluate_ = evaluate
    rows_te, te = evaluate_(model, torch, H(jam['test']))
    rows_va, va = evaluate_(model, torch, H(jam['valid']))
    rows_held, _ = evaluate_(model, torch, H(lib_held))
    rows_tr, _ = evaluate_(model, torch, H(lib_tr))
    rows_rec, _ = evaluate_(model, torch, H(lib_rec))
    rows_acc, _ = evaluate_(model, torch, H(accs[:len(ACC_TRACKS)]))
    rows_cls, _ = evaluate_(model, torch, H(cls_tr))
    rows_clsh, _ = evaluate_(model, torch, H(cls_held))
    rem_sets = [(n, x, np.where(ys < 0, -1, (ys >= 0.5).astype(np.int8))) + ((yp,) if stream else ()) for n, x, ys, yp in last_remix[:12]]
    rows_rem, rem_all = evaluate_(model, torch, rem_sets)
    log(f'Jamendo test: F1 {te["F1"]} P {te["P"]} R {te["R"]} AUC {te["AUC"]} ({te["frames"]} frames)' + (f'; pitch: a pitch on {te.get("pitch_pub_pct")} %, exact {te.get("pitch_exact_pct")} %, ±1 bin {te.get("pitch_pm1_pct")} % of {te.get("pitch_frames")} pYIN frames; none right on {te.get("none_ok_pct")} %' if stream else ''))
    for r in rows_held + rows_tr + rows_rec + rows_acc + rows_clsh: log(f'  {r["track"]:34s} frames {r["frames"]:7d} sung {r["sung_pct"]:5.1f} %  F1 {r["F1"]:.3f} P {r["P"]:.3f} R {r["R"]:.3f} AUC {r["AUC"]}  fp {r["fp_pct"]} %' + (f'  pitch {r.get("pitch_frames")} fr: pub {r.get("pitch_pub_pct")} exact {r.get("pitch_exact_pct")} ±1 {r.get("pitch_pm1_pct")} %; none ok {r.get("none_ok_pct")} %' if stream else ''))
    cls_fp = float(np.mean([r['fp_pct'] for r in rows_cls])) if rows_cls else float('nan')
    log(f'  classical in-sample fp (mean over {len(rows_cls)} files) {cls_fp:.1f} %; remixes (last epoch, 12 of them) F1 {rem_all.get("F1")} AUC {rem_all.get("AUC")}')
    report = {'provenance': {'date': time.strftime('%Y-%m-%d'), 'summary': f'{epochs} epochs x {per_epoch} windows of 40 x {SEQ if stream else T_WIN}' + (f' (the loss on the last {LOSS_COLS} columns, the pitch loss x {PITCH_W}, the onset weight {ONSET_W:g} on {ONSET_HOPS} hops, the net {NET} C {TCN_C} dil {TCN_DIL}, quota {QUOTA})' if stream else '') + f', batch {bs}, Adam 1e-3 cosine, BCE (pos_weight {POS_WEIGHT}, soft targets on the library), the draw by quota {QUOTA}, {n_remix} remixes re-drawn per epoch at {SNR_DB[0]:+.0f}..{SNR_DB[1]:+.0f} dB SNR, gain / tilt / level / noise jitter + pitch shift ±{PITCH_BANDS} bands + time stretch {STRETCH[0]}..{STRETCH[1]} on half the windows, the soft floor {SOFT_FLOOR:g}, VAR_FLOOR {vf:g}; the best Jamendo-valid AUC epoch kept ({best[2] if best else "loaded"})',
                             'jamendo': 'Zenodo record 2585988 (cc-by-4.0)', 'musicnet': 'Zenodo record 5120004 (cc-by-4.0) — Creative Commons Attribution 4.0 International; ~/Datasets/musicnet/LICENCE-NOTE.md',
                             'maestro': 'MAESTRO v3.0.0, Google LLC, LICENSE: Attribution-NonCommercial-ShareAlike 4.0 International; ~/Datasets/maestro/LICENCE-NOTE.md', 'var_floor': vf, 'tag': tag,
                             'jamendo_train_stems': n_jam_stems, 'classical_held': CLASSICAL_HELD, 'remix_sources': len(vox_src), 'remix_beds': len(beds)},
              'net': NET, 'mac_per_hop': stream_macs(NET) if stream else 38385, 'params': nparams, 'epochs': hist, 'jamendo_test': te, 'jamendo_valid': va, 'jamendo_test_tracks': rows_te,
              'held': {r['track']: r for r in rows_held}, 'library_train': rows_tr, 'recorded': rows_rec, 'accompaniments': rows_acc,
              'classical_train_fp_mean': cls_fp, 'classical_train': rows_cls, 'classical_held': rows_clsh, 'remixes_last_epoch': rows_rem, 'remixes_all': rem_all}
    report['onnx_vs_torch'] = export_stream(model, torch, report, vf, NET) if stream else export(model, torch, report, vf)
    write_mel_parity(opt('mel-track', 'SeeYouDrop'), vf)
    json.dump(report, open(os.path.join(WORK, 'train-report.json'), 'w'), indent=1)
    json.dump(report, open(os.path.join(WORK, f'train-report-{tag}.json'), 'w'), indent=1)
    import shutil
    shutil.copy(os.path.join(ROOT, 'assets', 'engine', 'ears', 'vox-weights.js'), os.path.join(WORK, f'vox-weights-{tag}.js'))
    shutil.copy(os.path.join(WORK, 'vox-net.pt'), os.path.join(WORK, f'vox-net-{tag}.pt'))
    shutil.copy(os.path.join(WORK, 'vox.onnx'), os.path.join(WORK, f'vox-{tag}.onnx'))
    shutil.copy(os.path.join(WORK, 'onnx-parity.json'), os.path.join(WORK, f'onnx-parity-{tag}.json'))
    log(f'report: tools/work/vox/train-report.json (+ train-report-{tag}.json, vox-weights-{tag}.js, vox-net-{tag}.pt, vox-{tag}.onnx, onnx-parity-{tag}.json)')
    pool.close(); pool.join()


if __name__ == '__main__':
    main()
