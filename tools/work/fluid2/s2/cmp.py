#!/usr/bin/env python3
# cmp.py <track> <tag …>  — the S2 travel table over tools/work/fluid2/kick/<track>-<tag>/travel.txt: per tag the p50 (over the kicks whose
# step0 ≤ .1 — the drop's own clear frame left out) of hc / h90 at +½ and +1 beat, w1, trail1, area1, sp1, step0, grey0 — all kicks, then
# the return (t < 73) and the groove (t ≥ 73) — and the per-kick hc1 beside the first tag's (the control)
import sys, re
T, tags = sys.argv[1], sys.argv[2:]
def load(tag):
    rows = {}
    for l in open(f'tools/work/fluid2/kick/{T}-{tag}/travel.txt'):
        if l[0] == '#': continue
        p = l.split('|'); head = p[0].split()
        hc = p[1].split()[1:]; h9 = p[2].split()[1:]; w = p[3].split()[1:]; ta = p[4].split(); sp = p[5].split(); st = p[6].split(); g = p[7].split()
        rows[head[0]] = dict(t=float(head[1]), amp=float(head[2]), hc0=float(hc[0]), hch=float(hc[1]), hc1=float(hc[2]), h90h=float(h9[1]), h901=float(h9[2]), w0=float(w[0]), wh=float(w[1]), w1=float(w[2]), tr1=float(ta[0]), ar1=float(ta[1]), sp0=float(sp[0]), sph=float(sp[1]), sp1=float(sp[2]), step0=float(st[0]), stepMax=float(st[1]), g0=float(g[0]))
    return rows
q = lambda a, p: (sorted(a)[min(len(a) - 1, int(p * len(a)))] if a else float('nan'))
R = {t: load(t) for t in tags}
cols = ['hch', 'hc1', 'h90h', 'h901', 'w1', 'tr1', 'ar1', 'sph', 'sp1', 'step0', 'g0']
for name, sel in (('all', lambda r: True), ('return', lambda r: r['t'] < 73), ('groove', lambda r: r['t'] >= 73)):
    print(f'\n{T} · {name} · p50 over the kicks (step0 ≤ .1)')
    print('| tag | n | hc½ | hc1 | h90½ | h90₁ | w1 | trail1 | area1 | sp½ | sp1 | step0 | grey0 |')
    print('|---|---|---|---|---|---|---|---|---|---|---|---|---|')
    for t in tags:
        rs = [r for r in R[t].values() if sel(r) and r['step0'] <= 0.1]
        print(f'| {t} | {len(rs)} | ' + ' | '.join((f'{q([r[c] for r in rs], .5):.4f}' if c in ('ar1', 'step0') else f'{q([r[c] for r in rs], .5):.3f}' if c != 'g0' else f'{q([r[c] for r in rs], .5):.1f}') for c in cols) + ' |')
print('\nper kick hc1 (h90₁) [w1]: KK t amp | ' + ' | '.join(tags))
for k in sorted(R[tags[0]]):
    r0 = R[tags[0]][k]
    print(f"{k} {r0['t']:7.3f} {r0['amp']:.2f} | " + ' | '.join((f"{R[t][k]['hc1']:.3f} ({R[t][k]['h901']:.3f}) [{R[t][k]['w1']:.3f}]" if k in R[t] else '-') for t in tags))
