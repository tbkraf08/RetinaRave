#!/usr/bin/env python3
"""Arnold tongues on the five truth tracks — the feasibility probe for docs/plans/TONGUES-PLAN.md (2026-10-01).

A bank of circle-map oscillators, driven per hop by the PCM clock's own onset strength (env.py: clock.js strength(),
93.75 Hz), graded against the truth grid's beat. Measurement for the plan, not a build: nothing under assets/ is read.

The oscillator (per 512-sample hop, dt = 10.67 ms):
    theta += f_i * dt - (K / 2 pi) * ohat * sin(2 pi theta)
with ohat = o / S_i, S_i = (causal 8 s EMA of o per hop) * (hops per cycle of oscillator i), so the drive SUMS TO 1 PER
OSCILLATOR CYCLE on average and K means what it means in the sine circle map (on a click train at the oscillator's
period this IS theta_{n+1} = theta_n + Omega - (K/2pi) sin(2 pi theta_n) with Omega = f_i / f_click).

Per oscillator and window:
    rho   = d theta / (dt * f_beat)                       the winding number in beats (truth beat = 1)
    lam   = sum ln|1 - K ohat cos(2 pi theta)| / cycles   the Lyapunov exponent per oscillator cycle (< 0 = locked)
    d     = (1 - exp(lam)) / K  in [0, 1]                 the TONGUE DEPTH: at a fixed point lam = ln(1 - K cos 2pi theta*),
                                                         so d = cos(2 pi theta*) = 1 at the tongue's centre, 0 at its edge
A tongue p/q in a window = the contiguous run of bank oscillators with |rho - p/q| < TOL and d > DMIN; its width is the
run's extent in octaves of Omega and its depth the run's max d. Implied K (accent salience) = 2 pi * (1:1 half-width).

Two copies of the bank start at theta0 = 0 and 0.5: if the Omega = 1 copies stay half a cycle apart the 1:1 lock is
BISTABLE (two lattices, CyborgNinja's trap); if they converge the music picked one.

    python3 tools/truth/tongues/env.py                 # once: tools/work/tongues/<T>.env.npz
    python3 tools/truth/tongues/probe.py [Track ...] [--K 1.0] [--win 16] [--md out.md]
writes tools/work/tongues/<T>.tongues.json and prints the plan's tables.
"""
import json
import math
import os
import sys
from fractions import Fraction

import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
WORK = os.path.join(ROOT, 'tools', 'work', 'tongues')
TRUTH = os.path.join(ROOT, 'tools', 'truth')
TRACKS = ['SeeYouDrop', 'CyborgNinja', 'WhoLikesToParty', 'Malicious', 'Vienna']

WARM = 8.0          # s: the engine's own warm-up; nothing before it is graded
EMA_TAU = 8.0       # s: the drive normaliser's memory (causal)
BASE_TAU = 0.5      # s: the novelty baseline (EMA ~ a 1 s running mean)
TOL = 0.02          # |rho - p/q| for "on the tongue" (a 16-beat window resolves 1/16 = 0.0625 per slip)
DMIN = 0.05         # a run needs this much depth to count as locked
QMAX = 5
OCT_STEP = 1 / 16   # the log-spaced bank's spacing (octaves)


def bank():
    om = set(float(2 ** x) for x in np.arange(-2, 2 + 1e-9, OCT_STEP))
    rats = []
    for q in range(1, QMAX + 1):
        for p in range(1, 4 * q + 1):
            fr = Fraction(p, q)
            if fr.denominator == q and 0.25 <= fr <= 4:
                rats.append(fr)
    rats = sorted(set(rats))
    for fr in rats:
        om.add(float(fr))
    om = np.array(sorted(om))
    return om, rats


def run_bank(o, dt, f_i, K, theta0):
    """-> theta (unwrapped, nf x n), L (cumulative Lyapunov, nf x n). Sequential in hops, vectorised in oscillators."""
    nf, n = len(o), len(f_i)
    th = np.empty((nf, n)); L = np.empty((nf, n))
    theta = np.full(n, theta0, dtype=np.float64); lam = np.zeros(n)
    # the drive is the strength's NOVELTY: o minus a causal 1 s baseline, rectified (tempo.js removes a 1 s running
    # mean before its comb for the same reason — a DC drive in sin(2 pi theta) distorts the rotation, it locks to nothing)
    base = float(o[: int(1 / dt)].mean()); ema = 1e-6     # seeded on the first second (then causal)
    ab = math.exp(-dt / BASE_TAU); a = math.exp(-dt / EMA_TAU)
    hops_per_cycle = 1.0 / (f_i * dt)
    k2pi = K / (2 * math.pi)
    for k in range(nf):
        ok = float(o[k])
        nov = max(0.0, ok - base); base = ab * base + (1 - ab) * ok
        ema = a * ema + (1 - a) * nov
        ohat = nov / (max(ema, 1e-9) * hops_per_cycle)     # the novelty sums to ~1 per oscillator cycle
        s = np.sin(2 * np.pi * theta); c = np.cos(2 * np.pi * theta)
        lam += np.log(np.abs(1 - K * ohat * c))
        theta = theta + f_i * dt - k2pi * ohat * s
        th[k] = theta; L[k] = lam
    return th, L


def idx_at(t_hop, t):
    """index of the last hop whose END time <= t"""
    return int(np.searchsorted(t_hop, t, side='right')) - 1


def tongues_in(rho, d, om, rats):
    """per rational: (width_oct, depth, n) from the contiguous run of locked oscillators around it"""
    out = {}
    for fr in rats:
        v = float(fr)
        on = (np.abs(rho - v) < TOL) & (d > DMIN)
        j = int(np.argmin(np.abs(om - v)))
        if not on[j]:
            out[str(fr)] = (0.0, 0.0, 0); continue
        lo = j
        while lo - 1 >= 0 and on[lo - 1]: lo -= 1
        hi = j
        while hi + 1 < len(om) and on[hi + 1]: hi += 1
        width = math.log2(om[hi] / om[lo]) + OCT_STEP      # the run's extent plus one bank step (its resolution)
        out[str(fr)] = (width, float(d[lo:hi + 1].max()), hi - lo + 1)
    return out


def swing_of(o, theta, i0, i1):
    """the off-8th's position inside the beat from the Omega=1 oscillator's own phase; -> (pos, ratio)"""
    NB = 64
    ph = np.mod(theta[i0:i1], 1.0); w = o[i0:i1]
    h, _ = np.histogram(ph, bins=NB, range=(0, 1), weights=w)
    pk = int(np.argmax(h))
    h = np.roll(h, -pk)                                                 # the beat's own peak -> bin 0
    lo, hi = int(0.4 * NB), int(0.75 * NB)                              # the off-8th lives between 0.4 and 0.75 (0.5 straight, 0.667 triplet)
    j = lo + int(np.argmax(h[lo:hi]))
    y0, y1, y2 = h[j - 1], h[j], h[j + 1]
    den = y0 - 2 * y1 + y2
    frac = 0.5 * (y0 - y2) / den if den != 0 else 0.0                   # parabolic vertex of the mode
    pos = (j + 0.5 + frac) / NB
    if y1 <= 0: return float('nan'), float('nan')
    return pos, pos / (1 - pos)


def main(argv):
    a = list(argv)
    def opt(k, dflt):
        if k in a:
            i = a.index(k); v = a[i + 1]; del a[i:i + 2]; return v
        return dflt
    K = float(opt('--K', '1.0')); WIN = int(opt('--win', '16')); MD = opt('--md', None)
    global DMIN; DMIN = float(opt('--dmin', str(DMIN)))
    tracks = a or TRACKS
    om, rats = bank()
    i1 = int(np.argmin(np.abs(om - 1.0))); i2 = int(np.argmin(np.abs(om - 2.0))); ih = int(np.argmin(np.abs(om - 0.5))); i4 = int(np.argmin(np.abs(om - 4.0)))
    lines = []
    def say(s=''):
        print(s); lines.append(s)
    say(f'# tongues probe — K {K}, window {WIN} beats, bank {len(om)} oscillators (Omega 0.25..4, 1/16 oct + p/q, q<={QMAX})')
    for tr in tracks:
        env = np.load(os.path.join(WORK, f'{tr}.env.npz'))
        o, s40, smid, t_hop, sr, hop = env['o'].astype(np.float64), env['s40'].astype(np.float64), env['smid'].astype(np.float64), env['t'].astype(np.float64), int(env['sr']), int(env['hop'])
        dt = hop / sr
        truth = json.load(open(os.path.join(TRUTH, f'{tr}.json')))
        g = truth['bpm_grid']; f_beat = g['bpm'] / 60; beats = np.array(truth['beats']); downs = np.array(truth['downbeats'])
        drops = truth.get('drops', [])
        f_i = om * f_beat
        res = {}
        for name, drv in (('o', o), ('s40', s40), ('smid', smid)):
            thA, LA = run_bank(drv, dt, f_i, K, 0.0)
            thB, LB = run_bank(drv, dt, f_i, K, 0.5)
            res[name] = (thA, LA, thB, LB)
        # ---- 4-bar windows on the truth downbeats
        wins = []
        starts = [b for b in downs if b >= WARM]
        for bi in range(0, len(starts) - 1):
            tA = starts[bi]; tB = tA + WIN / f_beat
            if tB > beats[-1]: break
            # only windows that start on a downbeat every WIN/4 bars
            if bi % (WIN // 4): continue
            wins.append((tA, tB))
        rows = []
        for (tA, tB) in wins:
            kA, kB = idx_at(t_hop, tA), idx_at(t_hop, tB)
            if kA < 0 or kB <= kA: continue
            row = {'t0': round(tA, 3), 't1': round(tB, 3)}
            for name in ('o', 's40', 'smid'):
                thA, LA, thB, LB = res[name]
                rho = (thA[kB] - thA[kA]) / ((tB - tA) * f_beat)
                lam = (LA[kB] - LA[kA]) / ((tB - tA) * f_i)
                d = np.clip((1 - np.exp(lam)) / K, 0, 1)
                tg = tongues_in(rho, d, om, rats)
                # the winner: widest tongue, ties to the lower q
                best = max(rats, key=lambda fr: (tg[str(fr)][0], -fr.denominator))
                # lock phase of the Omega=1 oscillator at the truth beats inside the window
                bb = beats[(beats >= tA) & (beats < tB)]
                ph = np.array([np.mod(thA[idx_at(t_hop, b), i1], 1.0) for b in bb])
                z = np.exp(2j * np.pi * ph).mean()
                th_star = (np.angle(z) / (2 * np.pi)) % 1.0; R = abs(z)
                if th_star > 0.5: th_star -= 1
                bist = abs(((thA[kB, i1] - thB[kB, i1] + 0.5) % 1.0) - 0.5)   # 0 = converged, 0.5 = bistable
                row[name] = {
                    'd11': round(float(d[i1]), 3), 'd21': round(float(d[i2]), 3), 'd12': round(float(d[ih]), 3), 'd41': round(float(d[i4]), 3),
                    'rho11': round(float(rho[i1]), 3), 'rho21': round(float(rho[i2]), 3), 'rho12': round(float(rho[ih]), 3),
                    'w11': round(tg['1'][0], 3), 'w21': round(tg['2'][0], 3), 'w12': round(tg['1/2'][0], 3),
                    'w32': round(tg['3/2'][0], 3), 'w31': round(tg['3'][0], 3),
                    'Kimpl': round(2 * math.pi * (2 ** (tg['1'][0] / 2) - 2 ** (-tg['1'][0] / 2)) / 2, 3) if tg['1'][0] > 0 else 0.0,
                    'win': str(best), 'winW': round(tg[str(best)][0], 3),
                    'phase11': round(float(th_star), 3), 'lagMs': round(float(-th_star / f_beat * 1000), 1), 'R11': round(float(R), 3),
                    'bist11': round(float(bist), 3),
                    'nLocked': int(((d > DMIN)).sum()),
                }
                if name == 'o':
                    pos, ratio = swing_of(o, thA[:, i1], kA, kB)
                    row['swingPos'] = round(pos, 4); row['swing'] = round(ratio, 3)
            rows.append(row)
        # ---- the summary table
        def col(name, key): return np.array([r[name][key] for r in rows], dtype=float)
        say()
        say(f'## {tr} — {g["bpm"]:.2f} BPM, {len(rows)} windows of {WIN} beats from {rows[0]["t0"]} to {rows[-1]["t1"]} s, drops {drops}')
        say('| drive | 1:1 wins | d 1:1 p50 (p10) | d 2:1 p50 | d 1:2 p50 | d 4:1 p50 | w 1:1 oct p50 | K impl p50 | lock phase 1:1 p50 (ms) | R p50 | bistable p50 | locked osc p50 |')
        say('|---|---|---|---|---|---|---|---|---|---|---|---|')
        for name in ('o', 's40', 'smid'):
            wins11 = np.mean([r[name]['win'] == '1' for r in rows]) * 100
            say(f'| `{name}` | {wins11:.0f} % | {np.median(col(name, "d11")):.3f} ({np.percentile(col(name, "d11"), 10):.3f}) | '
                f'{np.median(col(name, "d21")):.3f} | {np.median(col(name, "d12")):.3f} | {np.median(col(name, "d41")):.3f} | {np.median(col(name, "w11")):.3f} | '
                f'{np.median(col(name, "Kimpl")):.3f} | {np.median(col(name, "phase11")):+.3f} ({np.median(col(name, "lagMs")):+.0f}) | '
                f'{np.median(col(name, "R11")):.3f} | {np.median(col(name, "bist11")):.3f} | {np.median(col(name, "nLocked")):.0f} / {len(om)} |')
        sw = np.array([r['swing'] for r in rows]); sp = np.array([r['swingPos'] for r in rows])
        say(f'swing (off-8th position in the beat, from the Omega=1 oscillator\'s own phase): pos p50 {np.nanmedian(sp):.4f} '
            f'(p10 {np.nanpercentile(sp, 10):.4f}, p90 {np.nanpercentile(sp, 90):.4f}) -> ratio p50 {np.nanmedian(sw):.3f}')
        # winners histogram
        from collections import Counter
        for name in ('o', 's40', 'smid'):
            c = Counter(r[name]['win'] for r in rows)
            say(f'winners `{name}`: ' + ', '.join(f'{k} x{v}' for k, v in c.most_common(6)))
        # ---- per-window dump (compact) for the plan's section tables
        say()
        say('| t0 | t1 | o: d11 d21 d12 | o: w11 w21 w12 w32 | o: win | o: phase ms | o: bist | s40: d11 d21 | s40: phase ms | s40: bist | swing |')
        say('|---|---|---|---|---|---|---|---|---|---|---|')
        for r in rows:
            O, S = r['o'], r['s40']
            say(f'| {r["t0"]:.1f} | {r["t1"]:.1f} | {O["d11"]:.2f} {O["d21"]:.2f} {O["d12"]:.2f} | {O["w11"]:.2f} {O["w21"]:.2f} {O["w12"]:.2f} {O["w32"]:.2f} | '
                f'{O["win"]} | {O["lagMs"]:+.0f} | {O["bist11"]:.2f} | {S["d11"]:.2f} {S["d21"]:.2f} | {S["lagMs"]:+.0f} | {S["bist11"]:.2f} | {r["swing"]:.2f} |')
        # ---- lock time of the Omega=1 oscillator: first truth beat after which its phase stays within 0.1 cycle of its
        #      settled phase (median over the last 60 s) for 8 s, both initial phases, both drives
        say()
        for name in ('o', 's40', 'smid'):
            thA, LA, thB, LB = res[name]
            out = []
            for th in (thA, thB):
                ph = np.array([np.mod(th[idx_at(t_hop, b), i1], 1.0) for b in beats])
                late = beats >= beats[-1] - 60
                z = np.exp(2j * np.pi * ph[late]).mean(); ps = (np.angle(z) / (2 * np.pi)) % 1.0
                dev = np.abs(((ph - ps + 0.5) % 1.0) - 0.5)
                tl = float('nan')
                for i in range(len(beats)):
                    j = np.searchsorted(beats, beats[i] + 8)
                    if j > i and (dev[i:j] < 0.1).all(): tl = beats[i]; break
                lagp = -(ps if ps <= 0.5 else ps - 1) / f_beat * 1000
                out.append(f'theta0 {0.0 if th is thA else 0.5}: lock {tl:.1f} s, settled phase {lagp:+.0f} ms')
            say(f'lock time `{name}` (Omega=1): ' + ' · '.join(out))
        # ---- ambiguity runs: >= 8 consecutive truth beats whose trailing 16-beat d11 < DMIN on `o` (the plateau is lost)
        thA, LA, thB, LB = res['o']
        d11b = []
        for b in beats:
            tA = b - 16 / f_beat
            kA, kB = idx_at(t_hop, tA), idx_at(t_hop, b)
            if tA < WARM or kA < 0 or kB <= kA: d11b.append(np.nan); continue
            lam = (LA[kB, i1] - LA[kA, i1]) / ((b - tA) * f_i[i1])
            d11b.append(float(np.clip((1 - np.exp(lam)) / K, 0, 1)))
        d11b = np.array(d11b)
        runs = []; i = 0
        while i < len(beats):
            if np.isfinite(d11b[i]) and d11b[i] < DMIN:
                j = i
                while j + 1 < len(beats) and np.isfinite(d11b[j + 1]) and d11b[j + 1] < DMIN: j += 1
                if j - i + 1 >= 8: runs.append((beats[i], beats[j], j - i + 1))
                i = j + 1
            else: i += 1
        say(f'ambiguity runs `o` (>= 8 beats of trailing-16-beat d11 < {DMIN}; share of graded beats below it '
            f'{np.nanmean(d11b < DMIN) * 100:.1f} %): ' + (', '.join(f'{a:.1f}-{b:.1f} s ({n} beats)' for a, b, n in runs) or 'none'))
        # ---- the drop lead test: per truth beat, trailing windows of W beats ending at that beat; z against bars -12..-4
        say()
        lead = {}
        for W, drvname in [(W, n) for n in ('o', 'smid') for W in (16, 8, 4, 2)]:
            thA, LA, thB, LB = res[drvname]
            vals = {'d11': [], 'd21': [], 'w11': [], 'amb': [], 'bist': []}
            tb = []
            for b in beats:
                tA = b - W / f_beat
                if tA < WARM: continue
                kA, kB = idx_at(t_hop, tA), idx_at(t_hop, b)
                if kA < 0 or kB <= kA: continue
                rho = (thA[kB] - thA[kA]) / ((b - tA) * f_beat)
                lam = (LA[kB] - LA[kA]) / ((b - tA) * f_i)
                d = np.clip((1 - np.exp(lam)) / K, 0, 1)
                tg = tongues_in(rho, d, om, rats)
                vals['d11'].append(d[i1]); vals['d21'].append(d[i2]); vals['w11'].append(tg['1'][0]); vals['amb'].append(1 - d[i1])
                vals['bist'].append(abs(((thA[kB, i1] - thB[kB, i1] + 0.5) % 1.0) - 0.5))
                tb.append(b)
            tb = np.array(tb)
            for key in ('d11', 'd21', 'w11'):
                v = np.array(vals[key])
                # rolling z: each beat against the 32 beats ending 16 beats before it (bars -12..-4)
                zs = np.full(len(v), np.nan)
                for i in range(48, len(v)):
                    base = v[i - 48:i - 16]
                    sd = base.std()
                    zs[i] = (v[i] - base.mean()) / sd if sd > 1e-9 else 0.0
                for dr in drops:
                    pre = (tb < dr) & (tb >= dr - 4.5 / f_beat)      # beats -4..-1 (windows END before the drop: causal)
                    if not pre.any(): continue
                    zz = zs[pre]
                    far = np.ones(len(tb), bool)
                    for d2 in drops:
                        far &= np.abs(tb - d2) > 16 / f_beat
                    fa = np.nanmean(np.abs(zs[far]) >= max(np.nanmax(np.abs(zz)), 1e-9)) * 100 if np.isfinite(zz).any() else float('nan')
                    lead.setdefault(f'{dr}', []).append((W, f'{drvname}:{key}', [round(float(x), 2) for x in zz], round(float(fa), 1),
                                                         [round(float(x), 3) for x in v[pre]]))
        say(f'### drop lead test ({tr}): trailing W-beat windows ending at beats -4..-1 before each drop, z against the 32 beats ending 16 beats earlier; FA % = share of all other beats (> 16 beats from any drop) whose rolling |z| reaches the same max')
        say('| drop | W | field | z at beats -4 -3 -2 -1 | max abs z | FA % | values at -4..-1 |')
        say('|---|---|---|---|---|---|---|')
        for dr, items in lead.items():
            for (W, key, zz, fa, vv) in items:
                mz = max(abs(x) for x in zz) if zz else float('nan')
                say(f'| {float(dr):.3f} | {W} | {key} | {" ".join(f"{x:+.1f}" for x in zz)} | {mz:.1f} | {fa:.1f} | {" ".join(f"{x:.3f}" for x in vv)} |')
        json.dump({'track': tr, 'K': K, 'win': WIN, 'bpm': g['bpm'], 'omega': om.tolist(), 'rows': rows, 'lead': lead},
                  open(os.path.join(WORK, f'{tr}.tongues.json'), 'w'))
    if MD:
        open(MD, 'w').write('\n'.join(lines) + '\n')


if __name__ == '__main__':
    main(sys.argv[1:])
