#!/usr/bin/env python3
# montage.py <out.jpg> "<title>" <shots: NN …> <rows: tag:label[:kinds]> … — per row (a variant of the S5 pen strip 76–137, DYE=1) the same shots
#   (NN = the strip's shot index: t = 76 + NN) as the composite ('c'), the velocity ('v') or the dye ('d'); default 'cd'. The label: t, the pen's
#   on / x / y / step (the evals line's S5 fields), speed, dink, dgrad from highs.txt.
import sys, re; from PIL import Image, ImageDraw
out, title = sys.argv[1], sys.argv[2]
W = 236; H = int(633 * W / 1280) + 14
def tab(tag):
    T = {}
    d = f'tools/work/fluid2/field/RaindropsOnRoses-s13-{tag}'
    for l in open(f'{d}/highs.txt'):
        if l[0] == '#': continue
        p = l.split('|'); h = p[0].split(); v = p[1].split(); dd = p[2].split()
        T[h[0]] = dict(t=float(h[1]), speed=float(v[0]), dink=float(dd[2]), dgrad=float(dd[0]))
    for l in open(f'{d}/evals.txt'):
        m = re.match(r'^"?(\d\d) .* (\S+) (\S+) (\S+) (\S+) (\S+)"?$', l.strip())
        if m and m.group(1) in T: T[m.group(1)].update(on=m.group(2), px=m.group(3), py=m.group(4), step=m.group(5))
    return T
shots = sys.argv[3].split(); specs = sys.argv[4:]; cols = len(shots)
rows = []
for s in specs:
    parts = s.split(':'); tag, label = parts[0], parts[1]; kinds = parts[2] if len(parts) > 2 else 'cd'
    T = tab(tag)
    for kind in kinds: rows.append((tag, label, kind, T))
M = Image.new('RGB', (cols * (W + 4), len(rows) * (H + 4) + 18), (34, 34, 34)); dr = ImageDraw.Draw(M); dr.text((4, 2), title, fill=(255, 230, 160))
for r, (tag, label, kind, T) in enumerate(rows):
    for i, nn in enumerate(shots):
        x = i * (W + 4); y = 18 + r * (H + 4)
        try: im = Image.open(f'tools/work/fluid2/field/RaindropsOnRoses-s13-{tag}/{tag}-{nn}{"" if kind == "c" else kind}.jpg').resize((W, H - 14))
        except Exception: im = Image.new('RGB', (W, H - 14), (60, 0, 0))
        M.paste(im, (x, y + 14)); t = T.get(nn, {})
        lab = f"{label} {kind} t{t.get('t', 0):.0f} pen{t.get('on', '-')} x{t.get('px', '-')[:5]} y{t.get('py', '-')[:4]} st{t.get('step', '-')[:6]} sp{t.get('speed', 0):.3f} ink{t.get('dink', 0) * 1000:.0f} dg{t.get('dgrad', 0) * 1000:.1f}"
        dr.text((x + 3, y + 1), lab, fill=(200, 230, 200))
M.save(out, quality=82); print(out, M.size)
