#!/usr/bin/env python3
# montage.py <out.jpg> "<title>" <shots: NN …> <rows: tag:label[:kinds]> … — per row (a variant of the S4 field strip, DYE=1) the same shots
#   (NN = the strip's shot index: t = 60 + NN) as the composite ('c'), the velocity ('v') or the dye ('d'); default 'cvd'. The label: t, high,
#   highS, grain, dip, speed, lap, dgrad from highs.txt.
import sys; from PIL import Image, ImageDraw
out, title = sys.argv[1], sys.argv[2]
W = 236; H = int(633 * W / 1280) + 14
def tab(tag):
    T = {}
    for l in open(f'tools/work/fluid2/field/RaindropsOnRoses-s13-{tag}/highs.txt'):
        if l[0] == '#': continue
        p = l.split('|'); h = p[0].split(); v = p[1].split(); d = p[2].split()
        T[h[0]] = dict(t=float(h[1]), high=float(h[2]), highS=float(h[3]), grain=float(h[4]), dip=float(h[5]), speed=float(v[0]), lap=float(v[1]), dgrad=float(d[0]))
    return T
shots = sys.argv[3].split(); specs = sys.argv[4:]; cols = len(shots)
rows = []
for s in specs:
    parts = s.split(':'); tag, label = parts[0], parts[1]; kinds = parts[2] if len(parts) > 2 else 'cvd'
    T = tab(tag)
    for kind in kinds: rows.append((tag, label, kind, T))
M = Image.new('RGB', (cols * (W + 4), len(rows) * (H + 4) + 18), (34, 34, 34)); dr = ImageDraw.Draw(M); dr.text((4, 2), title, fill=(255, 230, 160))
for r, (tag, label, kind, T) in enumerate(rows):
    for i, nn in enumerate(shots):
        x = i * (W + 4); y = 18 + r * (H + 4)
        try: im = Image.open(f'tools/work/fluid2/field/RaindropsOnRoses-s13-{tag}/{tag}-{nn}{"" if kind == "c" else kind}.jpg').resize((W, H - 14))
        except Exception: im = Image.new('RGB', (W, H - 14), (60, 0, 0))
        M.paste(im, (x, y + 14)); t = T.get(nn, {})
        lab = f"{label} {kind} t{t.get('t', 0):.0f} hi{t.get('high', 0):.2f} hS{t.get('highS', 0):.2f} gr{t.get('grain', 0):.3f} dip{t.get('dip', 1):.2f} sp{t.get('speed', 0):.3f} lap{t.get('lap', 0) * 1000:.1f} dg{t.get('dgrad', 0) * 1000:.1f}"
        dr.text((x + 3, y + 1), lab, fill=(200, 230, 200))
M.save(out, quality=82); print(out, M.size)
