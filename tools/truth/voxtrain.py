#!/usr/bin/env python3
# Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
# use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
# Source: https://github.com/tbkraf08/RetinaRave
"""The live vocal detector's training (DECISIONS §123, the vocal detector's step 2 of three; docs/plans/VOCAL-PLAN.md §2).

    python3 tools/truth/voxtrain.py [--epochs=N] [--no-train] [--mel-only=<Track>]
      -> assets/engine/ears/vox-weights.js   the weights as a JS module (Float16 little-endian, base64; the provenance in its header)
      -> tools/work/vox/vox.onnx              the same net, the same (fp16-rounded) weights — the parity check's reference
      -> tools/work/vox/onnx-parity.json      200 held Jamendo-test windows (the normalised mel, 40 x 34) + onnxruntime's output on them
      -> tools/work/vox/mel-<Track>.json      the numpy front end on one library PCM dump (raw + normalised log-mel, the first hops) —
                                              tools/test_vox.js's mel parity (the ears' mel must equal this to 1e-4)
      -> tools/work/vox/train-report.json     the table: Jamendo test F1 / AUC, the held-out library pair, per track

THE FRONT END (the ears' `engine/ears/vox.js` re-implemented here, hop by hop — the parity test is where these models usually
drift): per 512-sample hop of the MID signal (.5·(L + R)) a 2048-point periodic-Hann FFT over the 2048 samples ending at the hop
(the ears' FFT class: |X| · 2 / Σwin, 1024 bins), the POWER in 40 triangular HTK-mel bands 100 Hz–8 kHz (unnormalised triangles,
peak 1, on the bin centres), ln(E + MEL_FLOOR), then a per-band CAUSAL running mean / variance (an exact cumulative mean until
the count passes the 30 s exponential window, exponential after: a = max(1/(n+1), 1 − e^(−hop/30))) → x' = (x − m) / sqrt(v +
VAR_FLOOR). The model sees the track's own range, never an absolute level (§111 item 7). The first FFT runs at hop 3 (2048 samples
in); hop h covers samples [512·(h+1) − 2048, 512·(h+1)).

THE NET (40 × 34 → ~44 k parameters; the plan's "32 hops" became 34 so that every pooling pair is full and the NEWEST hop reaches the
dense layer — the two convolutions are VALID in time, SAME in frequency, so the ears run it as a stream: one conv1 column per hop,
one conv2 column per two, the dense every four — ears/vox-net.js; this file's batch model is the same arithmetic on a 34-column window):
conv 3×3 ×16 (pad freq 1, time 0) → ReLU → maxpool 2 → conv 3×3 ×16 (the same padding) → ReLU → maxpool 2 → dense 32 → ReLU →
dense 1 → sigmoid; BCE; gain / tilt / level jitter on the normalised input as augmentation.

THE DATA: the Jamendo singing-voice corpus (~/Datasets/jamendo-svd/jamendo; 61 train / 16 valid / 16 test, the .lab frame labels at
the window's END time) resampled to 48 kHz mono, plus the library's `windows_hand` (tools/truth/<T>.vox.json, the ear-accepted Demucs
passages): a frame inside a hand window with the stem's share ≥ the track's knee is sung, a frame outside every hand window is not, a
frame inside a window under the knee (a breath) is dropped; plus the training tracks' Demucs ACCOMPANIMENTS (no_vocals) as
negatives and eight cross-track REMIXES of their vocal stems over another track's accompaniment (labelled by the stem's own level) —
see REMIX below for why. One library track is HELD OUT with Jamendo test — IBelongHere (voiced; LIB_TRAIN below says why no
no-voice track is); none of its stems is used. Jamendo valid picks the epoch. CPU only (torch.set_num_threads(24)); minutes, not hours.
The audio never ships; the weights do, with the corpus credited (THIRD-PARTY.md, about.html, the weights module's header).
"""
import base64, json, math, os, sys, time
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
VAR_FLOOR = 0.0625          # the sd floor (.25 nat ≈ 2.2 dB): a band that never moves does not blow up
T_WIN = 34                  # the net's time window (hops) — see the header
FIRST_HOP = (N_FFT // HOP) - 1   # 3: the first hop with 2048 samples behind it
JAMENDO = os.path.expanduser('~/Datasets/jamendo-svd/jamendo')
WORK = os.path.join(ROOT, 'tools', 'work', 'vox')
MELDIR = os.path.join(WORK, 'mel')
# The library's no-voice tracks all TRAIN (§123): held out, Comptine's solo piano read as a voice on 28 / 22 / 17 % of its frames over
# three runs, and Vienna's synth leads on 31 % when it was the unseen control in the fourth — nothing in Jamendo teaches a 363 ms net
# that a harmonic line in the voice band is not a voice, and the user listens to THIS library live 90 % of the time, so the shipped
# weights know all of it. IBelongHere (vocal house) is the one unseen library track — the voiced control; Jamendo test is the unseen
# instrumental measure, and the four runs' numbers above are the generalisation ceiling of this tier, in the §123 table.
LIB_TRAIN = ['Comptine', 'CyborgNinja', 'Malicious', 'RaindropsOnRoses', 'SeeYouDrop', 'Vienna', 'WhoLikesToParty']
LIB_HELD = ['IBelongHere']
LIB_OVERSAMPLE = 2
POS_WEIGHT = 1.0            # BCE's weight on the sung frames (.6 was tried: −6 points of recall on IBelongHere, the piano no better)
SEED = 1234


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


def normalise(lm, hop_s=HOP / SR, tau=NORM_TAU):
    """The causal per-band running mean / variance, hop by hop (the ears' recursion exactly): x' = (x − m) / sqrt(v + VAR_FLOOR)."""
    A = 1.0 - math.exp(-hop_s / tau)
    m = np.zeros(N_MEL); v = np.zeros(N_MEL)
    out = np.empty_like(lm)
    for i in range(lm.shape[0]):
        a = max(1.0 / (i + 1), A)
        x = lm[i]
        d = x - m
        m = m + a * d
        v = (1.0 - a) * (v + a * d * d)
        out[i] = (x - m) / np.sqrt(v + VAR_FLOOR)
    return out


def hop_times(n_hops, first=FIRST_HOP, sr=SR):
    return (np.arange(first, first + n_hops) + 1) * HOP / sr


# ---------------------------------------------------------------------------------------------------- the data
def load_jamendo(name):
    import librosa
    p = os.path.join(JAMENDO, 'audio', name)
    y, _ = librosa.load(p, sr=SR, mono=True)
    return y


def lab_labels(name, t):
    lab = os.path.join(JAMENDO, 'labels', os.path.splitext(name)[0] + '.lab')
    y = np.zeros(len(t), dtype=np.int8) - 1
    for line in open(lab):
        a = line.split()
        if len(a) < 3: continue
        t0, t1, k = float(a[0]), float(a[1]), a[2]
        y[(t >= t0) & (t < t1)] = 1 if k == 'sing' else 0
    return y


def load_dump(track):
    p = os.path.join(ROOT, 'tools', 'work', f'{track}.{SR}.st.f32')
    meta = json.load(open(p + '.json'))
    il = np.fromfile(p, dtype=np.float32)
    n = meta['n']
    L, R = il[0:2 * n:2], il[1:2 * n:2]
    return (0.5 * (L.astype(np.float64) + R.astype(np.float64))), meta['sr']


def lib_labels(track, t):
    d = json.load(open(os.path.join(HERE, f'{track}.vox.json')))
    share = np.asarray(d['share'], dtype=np.float64); hop = d['hop']; knee = d['knee']
    y = np.zeros(len(t), dtype=np.int8)
    i = np.clip(np.round(t / hop).astype(int), 0, len(share) - 1)
    for w in d.get('windows_hand', []):
        m = (t >= w['from']) & (t < w['to'])
        y[m] = np.where(share[i[m]] >= knee, 1, -1)   # under the knee inside a hand window: a breath, dropped
    return y, d


def cached(name, build):
    os.makedirs(MELDIR, exist_ok=True)
    p = os.path.join(MELDIR, name + '.npz')
    if os.path.exists(p):
        z = np.load(p); return z['x'], z['y'], z['t']
    x, y, t = build()
    np.savez(p, x=x.astype(np.float32), y=y, t=t.astype(np.float32))
    return x.astype(np.float32), y, t.astype(np.float32)


def build_jamendo(name):
    def b():
        mid = load_jamendo(name)
        lm = logmel(mid); x = normalise(lm); t = hop_times(len(x))
        return x, lab_labels(name, t), t
    return cached('jam-' + os.path.splitext(name)[0], b)


def build_lib(track):
    def b():
        mid, sr = load_dump(track); assert sr == SR, (track, sr)
        lm = logmel(mid); x = normalise(lm); t = hop_times(len(x))
        y, _ = lib_labels(track, t)
        return x, y, t
    return cached('lib-' + track, b)


def filelist(split):
    return [l.strip() for l in open(os.path.join(JAMENDO, 'filelists', split)) if l.strip()]


# The stems (tools/work/vox/htdemucs/<T>/{vocals,no_vocals}.wav, §122's Demucs pass, 44.1 kHz) as training material — the first run
# (Jamendo + the library mixes alone) read a solo piano as a voice on 28 % of Comptine's frames: nothing in Jamendo taught the net the
# difference between "a harmonic line in the voice band" and "a voice", because every sung Jamendo frame has a band under it. Two
# remedies, both in-domain: (1) each training track's ACCOMPANIMENT alone (no_vocals) as a negative — the same arrangement with no voice;
# (2) REMIXES — a training track's vocal stem laid over ANOTHER training track's accompaniment at a random level, labelled by the vocal
# stem's SHARE of the remix (≥ STEM_ON sung, ≤ STEM_OFF unsung, between dropped). Together they force the net to find the voice, not
# the busy section. The held-out pair (IBelongHere, Comptine) contributes no stem to either.
STEM_DIR = os.path.join(WORK, 'htdemucs')
ACC_TRACKS = ['CyborgNinja', 'Malicious', 'RaindropsOnRoses', 'SeeYouDrop', 'Vienna', 'WhoLikesToParty']   # the accompaniment negatives (Comptine's no_vocals IS Comptine: once is enough)
STEM_ON, STEM_OFF = 0.15, 0.04      # the stem's share of the remix (voxtruth.py's knee is .08 on a real stem's leak)
REMIX = [('RaindropsOnRoses', 'CyborgNinja', -6), ('RaindropsOnRoses', 'Vienna', 0), ('SeeYouDrop', 'Vienna', -4), ('SeeYouDrop', 'WhoLikesToParty', -8),
         ('WhoLikesToParty', 'SeeYouDrop', -3), ('WhoLikesToParty', 'Malicious', -6), ('RaindropsOnRoses', 'Malicious', -9), ('SeeYouDrop', 'CyborgNinja', +2)]


def load_stem(track, kind):
    import soundfile as sf
    from scipy.signal import resample_poly
    y, sr = sf.read(os.path.join(STEM_DIR, track, kind + '.wav'), dtype='float32', always_2d=True)
    mid = 0.5 * (y[:, 0].astype(np.float64) + y[:, -1].astype(np.float64))
    if sr != SR:
        from math import gcd
        g = gcd(SR, sr); mid = resample_poly(mid, SR // g, sr // g)
    return mid


def stem_level(vox):
    """The vocal stem's own level per hop (rms over 23 ms, box .1 s), at the mel hops' times."""
    n = len(vox); H = n // HOP
    fr = int(0.023 * SR)
    e = np.zeros(H)
    for h in range(H):
        a = max(0, (h + 1) * HOP - fr); seg = vox[a:(h + 1) * HOP]
        e[h] = np.sqrt(np.mean(seg * seg)) if len(seg) else 0
    k = max(1, int(0.1 / (HOP / SR)))
    e = np.convolve(e, np.ones(k) / k, mode='same')
    return e[FIRST_HOP:]


def stem_labels(vox_level, mix_level):
    """The vocal stem's SHARE of the remix (voxtruth.py's ruler: rms(stem) / rms(mix)): >= STEM_ON sung, <= STEM_OFF not, between dropped.
    (The first cut judged the stem against its own p95 and called a stem that is mostly separator leak 100 % sung.)"""
    share = vox_level / np.maximum(mix_level, 1e-6)
    y = np.full(len(share), -1, dtype=np.int8)
    y[share >= STEM_ON] = 1
    y[(share <= STEM_OFF) | (mix_level < 1e-4)] = 0
    return y


def build_acc(track):
    def b():
        mid = load_stem(track, 'no_vocals')
        lm = logmel(mid); x = normalise(lm); t = hop_times(len(x))
        return x, np.zeros(len(x), dtype=np.int8), t
    return cached('acc-' + track, b)


def build_remix(vt, at, db):
    def b():
        v = load_stem(vt, 'vocals') * (10 ** (db / 20)); a = load_stem(at, 'no_vocals')
        n = min(len(v), len(a)); mid = a[:n] + v[:n]
        lm = logmel(mid); x = normalise(lm); t = hop_times(len(x))
        y = stem_labels(stem_level(v[:n]), stem_level(mid))[:len(x)]
        return x, y, t
    return cached(f'remix-{vt}-over-{at}-{db:+d}dB', b)


def build_all(log):
    from multiprocessing import Pool
    jobs = [('jam', n) for s in ('train', 'valid', 'test') for n in filelist(s)] + [('lib', t) for t in LIB_TRAIN + LIB_HELD] \
        + [('acc', t) for t in ACC_TRACKS] + [('remix', r) for r in REMIX]
    todo = [j for j in jobs if not os.path.exists(os.path.join(MELDIR, _cache_name(j) + '.npz'))]
    if todo:
        log(f'front end: {len(todo)} tracks to build ({len(jobs) - len(todo)} cached)')
        t0 = time.time()
        with Pool(12) as pool: pool.map(_build_one, todo)
        log(f'front end built in {time.time() - t0:.0f} s')


def _cache_name(j):
    kind, name = j
    if kind == 'jam': return 'jam-' + os.path.splitext(name)[0]
    if kind == 'lib': return 'lib-' + name
    if kind == 'acc': return 'acc-' + name
    vt, at, db = name; return f'remix-{vt}-over-{at}-{db:+d}dB'


def _build_one(j):
    kind, name = j
    if kind == 'jam': build_jamendo(name)
    elif kind == 'lib': build_lib(name)
    elif kind == 'acc': build_acc(name)
    else: build_remix(*name)


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


class Pool:
    """Every (track, hop) window the training may draw: X the concatenated normalised mel, the valid end indices and their labels."""
    def __init__(self, sets):
        xs, ids, ys = [], [], []
        off = 0
        for x, y, rep in sets:
            n = len(x)
            ok = np.arange(T_WIN - 1, n)
            ok = ok[y[ok] >= 0]
            for _ in range(rep): ids.append(ok + off); ys.append(y[ok])
            xs.append(x); off += n
        self.X = np.concatenate(xs).astype(np.float32)
        self.idx = np.concatenate(ids); self.y = np.concatenate(ys).astype(np.float32)
        self.win = np.arange(-T_WIN + 1, 1)
    def batch(self, sel):
        e = self.idx[sel]
        x = self.X[e[:, None] + self.win[None, :]]        # (B, 34, 40)
        return np.ascontiguousarray(x.transpose(0, 2, 1))[:, None], self.y[sel]   # (B, 1, 40, 34)


def augment(x, rng):
    B = x.shape[0]
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
    # ties: average ranks
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
    rows = []; ally, allp = [], []
    for name, (x, y, t) in sets:
        X, Y, _ = frames_of(x, y)
        if not len(X): continue
        p = predict(model, torch, X)
        F, pr, rc = f1(Y, p)
        rows.append({'track': name, 'frames': int(len(Y)), 'sung_pct': round(100 * float(Y.mean()), 1), 'F1': round(F, 3), 'P': round(pr, 3), 'R': round(rc, 3), 'AUC': round(auc(Y, p), 3), 'fp_pct': round(100 * float(((p >= 0.5) & (Y == 0)).sum() / max(1, (Y == 0).sum())), 1)})
        ally.append(Y); allp.append(p)
    Y = np.concatenate(ally); P = np.concatenate(allp)
    F, pr, rc = f1(Y, P)
    return rows, {'frames': int(len(Y)), 'F1': round(F, 3), 'P': round(pr, 3), 'R': round(rc, 3), 'AUC': round(auc(Y, P), 3)}


# ---------------------------------------------------------------------------------------------------- the export
HEAD = [
    'Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):',
    'use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.',
    'Source: https://github.com/tbkraf08/RetinaRave',
]


def export(model, torch, report):
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
    held = [build_jamendo(n) for n in filelist('test')]
    X = np.concatenate([frames_of(x, y)[0][rng.choice(len(frames_of(x, y)[0]), 13, replace=False)] for x, y, t in held])[:200]
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
    lines = ['// ' + l for l in HEAD] + [
        '// The live vocal detector\'s weights (DECISIONS §123; tools/truth/voxtrain.py wrote this file — do not edit by hand).',
        '// A 40 x 34 log-mel window -> conv 3x3 x16 -> pool 2 -> conv 3x3 x16 -> pool 2 -> dense 32 -> dense 1 -> sigmoid, %d parameters,' % len(flat),
        '// Float16 little-endian, base64 (%d bytes), in the order %s; ears/vox-net.js decodes and runs it as a stream.' % (len(f16) * 2, ', '.join(order)),
        '// Trained %s on CPU: the Jamendo singing-voice corpus (Ramona, Richard, David, ICASSP 2008; Zenodo record 2585988, CC BY 4.0 — the audio' % prov.get('date', ''),
        '// is not here, these weights are the derived work and this line is its attribution; THIRD-PARTY.md has the full notice) train + valid,',
        '// 61 + 16 tracks, plus six library tracks\' ear-accepted hand windows (§122); %s.' % prov.get('summary', ''),
        '// Jamendo test F1 %s / AUC %s; the held-out library pair IBelongHere F1 %s / AUC %s, Comptine false positives %s %%.' % (
            report.get('jamendo_test', {}).get('F1'), report.get('jamendo_test', {}).get('AUC'),
            report.get('held', {}).get('IBelongHere', {}).get('F1'), report.get('held', {}).get('IBelongHere', {}).get('AUC'),
            next((r['fp_pct'] for r in report.get('library_train', []) if r['track'] == 'Comptine'), None)),
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


def write_mel_parity(track):
    mid, sr = load_dump(track)
    n = min(len(mid), 48000 * 40)       # 40 s: 3747 hops, 1.2 MB of json
    lm = logmel(mid[:n]); x = normalise(lm)
    H = min(len(lm), 3000)
    json.dump({'track': track, 'sr': sr, 'firstHop': FIRST_HOP, 'hops': H, 'nMel': N_MEL,
               'raw': [[round(float(v), 6) for v in r] for r in lm[:H]], 'norm': [[round(float(v), 6) for v in r] for r in x[:H]]},
              open(os.path.join(WORK, f'mel-{track}.json'), 'w'))
    print(f'  mel parity reference: tools/work/vox/mel-{track}.json ({H} hops from hop {FIRST_HOP})')


# ---------------------------------------------------------------------------------------------------- main
def main():
    args = sys.argv[1:]
    opt = lambda k, d: next((a.split('=', 1)[1] for a in args if a.startswith('--' + k + '=')), d)
    log = lambda s: print(s, flush=True)
    os.makedirs(WORK, exist_ok=True)
    if opt('mel-only', None):
        write_mel_parity(opt('mel-only', None)); return
    import torch
    torch.set_num_threads(24); torch.manual_seed(SEED)
    rng = np.random.default_rng(SEED)
    build_all(log)
    log('loading the front ends …')
    jam = {s: [(n, build_jamendo(n)) for n in filelist(s)] for s in ('train', 'valid', 'test')}
    lib_tr = [(t, build_lib(t)) for t in LIB_TRAIN]
    lib_held = [(t, build_lib(t)) for t in LIB_HELD]
    stems = [('acc:' + t, build_acc(t)) for t in ACC_TRACKS] + [(f'remix:{vt}/{at}{db:+d}', build_remix(vt, at, db)) for vt, at, db in REMIX]
    pool = Pool([(x, y, 1) for n, (x, y, t) in jam['train']] + [(x, y, LIB_OVERSAMPLE) for n, (x, y, t) in lib_tr] + [(x, y, 1) for n, (x, y, t) in stems])
    log(f'train pool: {len(pool.idx)} windows ({pool.y.mean() * 100:.1f} % sung), {len(jam["train"])} Jamendo + {len(lib_tr)} library tracks (x{LIB_OVERSAMPLE}) + {len(stems)} stem sets (the accompaniments, the remixes)')
    model = make_model(torch)
    nparams = sum(p.numel() for p in model.parameters())
    log(f'net: {nparams} parameters')
    epochs = int(opt('epochs', 14)); per_epoch = int(opt('per-epoch', 400000)); bs = 512
    optim = torch.optim.Adam(model.parameters(), lr=1e-3)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(optim, T_max=epochs)
    lossf = torch.nn.BCEWithLogitsLoss(pos_weight=torch.tensor(POS_WEIGHT))   # a false voice (a lead mark on an instrumental) costs more on screen than a missed one (the floor keeps its ink)
    best = None; hist = []
    if opt('no-train', None) is None:
        for ep in range(epochs):
            model.train(); t0 = time.time(); tot = 0.0; nb = 0
            sel = rng.choice(len(pool.idx), min(per_epoch, len(pool.idx)), replace=False)
            for i in range(0, len(sel), bs):
                xb, yb = pool.batch(sel[i:i + bs])
                xb = augment(xb, rng)
                optim.zero_grad()
                loss = lossf(model(torch.from_numpy(xb)), torch.from_numpy(yb))
                loss.backward(); optim.step()
                tot += float(loss); nb += 1
            sched.step()
            model.eval()
            _, va = evaluate(model, torch, jam['valid'])
            hist.append({'epoch': ep + 1, 'loss': round(tot / nb, 4), 'valid_F1': va['F1'], 'valid_AUC': va['AUC'], 's': round(time.time() - t0)})
            log(f'  epoch {ep + 1:2d}  loss {tot / nb:.4f}  valid F1 {va["F1"]:.3f} AUC {va["AUC"]:.3f}  {time.time() - t0:.0f} s')
            if best is None or va['AUC'] > best[0]:
                best = (va['AUC'], {k: v.clone() for k, v in model.state_dict().items()}, ep + 1)
        model.load_state_dict(best[1]); log(f'best epoch {best[2]} (valid AUC {best[0]:.3f})')
        torch.save(model.state_dict(), os.path.join(WORK, 'vox-net.pt'))
    else:
        model.load_state_dict(torch.load(os.path.join(WORK, 'vox-net.pt')))
    model.eval()
    rows_te, te = evaluate(model, torch, jam['test'])
    rows_va, va = evaluate(model, torch, jam['valid'])
    rows_held, _ = evaluate(model, torch, lib_held)
    rows_tr, _ = evaluate(model, torch, lib_tr)
    rows_st, _ = evaluate(model, torch, stems)
    log(f'Jamendo test: F1 {te["F1"]} P {te["P"]} R {te["R"]} AUC {te["AUC"]} ({te["frames"]} frames)')
    for r in rows_held + rows_tr + rows_st: log(f'  {r["track"]:34s} frames {r["frames"]:7d} sung {r["sung_pct"]:5.1f} %  F1 {r["F1"]:.3f} P {r["P"]:.3f} R {r["R"]:.3f} AUC {r["AUC"]}  fp {r["fp_pct"]} %')
    report = {'provenance': {'date': time.strftime('%Y-%m-%d'), 'summary': f'{epochs} epochs x {per_epoch} windows of 40 x 34, batch {bs}, Adam 1e-3 cosine, BCE (pos_weight {POS_WEIGHT}), gain / tilt / level / noise jitter; the six training tracks\' Demucs accompaniments as negatives and eight cross-track remixes of their vocal stems (labelled by the stem\'s level); the best Jamendo-valid AUC epoch kept ({best[2] if best else "loaded"})', 'jamendo': 'Zenodo record 2585988 (cc-by-4.0)'},
              'params': nparams, 'epochs': hist, 'jamendo_test': te, 'jamendo_valid': va, 'jamendo_test_tracks': rows_te,
              'held': {r['track']: r for r in rows_held}, 'library_train': rows_tr, 'stems': rows_st}
    report['onnx_vs_torch'] = export(model, torch, report)
    write_mel_parity(opt('mel-track', 'SeeYouDrop'))
    json.dump(report, open(os.path.join(WORK, 'train-report.json'), 'w'), indent=1)
    log('report: tools/work/vox/train-report.json')


if __name__ == '__main__':
    main()
