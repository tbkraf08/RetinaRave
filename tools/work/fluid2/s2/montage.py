#!/usr/bin/env python3
# montage.py <out.jpg> "<title>" <kickA> <kickB> <rows: dir:tag:label[:kinds] …>  — the S2 montage: per row (a variant) the same 8 frames —
# kick A's pre / +0 / +½ / +1 then kick B's — as the dye shot (kinds d) or the velocity (v) or the composite (''); default 'dv' = two rows
# per variant (the dye over its velocity). The label per tile: t, amp, the kick (shape/mom) and the travel ruler's U / hc / w from travel.txt.
import sys; from PIL import Image, ImageDraw
out, title, kA, kB = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
specs = sys.argv[5:]
W = 236; H = int(633 * W / 1280) + 14; cols = 8
def travel(d, tag):
    T = {}
    for l in open(f'tools/work/fluid2/kick/RaindropsOnRoses-{d}/travel.txt'):
        if l[0] == '#': continue
        p = l.split('|'); h = p[0].split(); U = p[1].split()[1:]; hc = p[2].split()[1:]; w = p[5].split()[1:]
        T[h[0]] = dict(t=float(h[1]), amp=float(h[2]), U=dict(zip(('pre', 'k0', 'kh', 'k1'), map(float, U))), hc=dict(zip(('k0', 'kh', 'k1'), map(float, hc))), w=dict(zip(('k0', 'kh', 'k1'), map(float, w))), kick=p[-1].strip())
    return T
rows = []
for s in specs:
    parts = s.split(':'); d, tag, label = parts[0], parts[1], parts[2]; kinds = parts[3] if len(parts) > 3 else 'dv'
    T = travel(d, tag)
    for kind in kinds:
        rows.append((d, tag, label, kind, T))
M = Image.new('RGB', (cols * (W + 4), len(rows) * (H + 4) + 18), (34, 34, 34)); dr = ImageDraw.Draw(M)
dr.text((4, 2), title, fill=(255, 230, 160))
for r, (d, tag, label, kind, T) in enumerate(rows):
    for i, (kk, m) in enumerate([(kA, m) for m in ('pre', 'k0', 'kh', 'k1')] + [(kB, m) for m in ('pre', 'k0', 'kh', 'k1')]):
        x = i * (W + 4); y = 18 + r * (H + 4)
        try: im = Image.open(f'tools/work/fluid2/kick/RaindropsOnRoses-{d}/{tag}-{kk}-{m}{"" if kind == "c" else kind}.jpg').resize((W, H - 14))
        except Exception: im = Image.new('RGB', (W, H - 14), (60, 0, 0))
        M.paste(im, (x, y + 14))
        t = T.get(kk, {}); mm = {'pre': 'pre', 'k0': '+0', 'kh': '+½', 'k1': '+1'}[m]
        lab = f"{label} {kind if kind != 'c' else ''} t{t.get('t', 0):.1f} {mm}"
        if t and m != 'pre': lab += f" U{t['U'][m]:.1f} hc{t['hc'][m]:.2f} w{t['w'][m]:.2f}"
        elif t: lab += f" U{t['U']['pre']:.1f} amp{t['amp']:.2f}"
        dr.text((x + 3, y + 1), lab, fill=(200, 230, 200))
M.save(out, quality=82); print(out, M.size)
