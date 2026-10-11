#!/usr/bin/env python3
# cmp.py <ref-tag> <tag> … — the S4 highs table over tools/work/fluid2/field/RaindropsOnRoses-s13-<tag>/highs.txt: per variant and window the
# p50 of speed / lap / dgrad / dlap / dink / cgrad / grey, then the RATIOS variant ÷ <ref-tag> per window (the guard: speed within 10 %; the
# texture: lap, dlap; the sharpness: dgrad; the light: cgrad; the ink: dink, grey)
import sys, re
ref, tags = sys.argv[1], sys.argv[2:]
COLS = ('high', 'highS', 'grain', 'dip', 'speed', 'lap', 'dgrad', 'dlap', 'dink', 'cgrad', 'grey')
def load(tag):
    T = {}
    for l in open(f'tools/work/fluid2/field/RaindropsOnRoses-s13-{tag}/highs.txt'):
        m = re.match(r'# (\S+) (\S+): n (\d+) · (.*)', l)
        if m: T[m.group(2)] = dict(n=int(m.group(3)), **{k: float(v) for k, v in re.findall(r'(\w+) ([-\d.na]+)', m.group(4))})
    return T
R = load(ref); V = {t: load(t) for t in tags}
print(f'| tag | window (n) | high | highS | grain | dip | speed | lap ×1000 | dgrad ×1000 | dlap ×1000 | dink ×1000 | cgrad ×1000 | grey |'); print('|---|' * 13)
for t in [ref] + tags:
    T = R if t == ref else V[t]
    for w, d in T.items(): print(f"| {t} | {w} ({d['n']}) | {d['high']:.3f} | {d['highS']:.3f} | {d['grain']:.4f} | {d['dip']:.3f} | {d['speed']:.4f} | {d['lap'] * 1000:.2f} | {d['dgrad'] * 1000:.2f} | {d['dlap'] * 1000:.2f} | {d['dink'] * 1000:.2f} | {d['cgrad'] * 1000:.2f} | {d['grey']:.1f} |")
print(f'\n| tag ÷ {ref} | window | speed | lap | dgrad | dlap | dink | cgrad | grey |'); print('|---|' * 9)
for t in tags:
    for w, d in V[t].items():
        r = R.get(w)
        if not r: continue
        f = lambda k: d[k] / r[k] if r[k] else float('nan')
        print(f"| {t} | {w} | {f('speed'):.3f} | {f('lap'):.3f} | {f('dgrad'):.3f} | {f('dlap'):.3f} | {f('dink'):.3f} | {f('cgrad'):.3f} | {f('grey'):.3f} |")
