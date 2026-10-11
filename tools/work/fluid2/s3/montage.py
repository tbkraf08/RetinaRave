#!/usr/bin/env python3
# montage.py mids <out.jpg> "<title>" <shots: NN …> <rows: dir:tag:label[:kinds]> …   — per row (a variant) the same field-strip shots (NN = the
#   strip's shot index: t = 60 + NN) as the composite ('c') or the velocity ('v'); default 'cv'. The label: t, mid, curl, lap, ratio from mids.txt.
# montage.py snare <out.jpg> "<title>" <KKa> <KKb> <rows: dir:tag:label[:kinds]> … — S2's layout on the snare strips: per row two snares × pre / +0 /
#   +½ / +1 as the dye ('d') or the velocity ('v') or the composite ('c'); default 'dv'. The label: t, amp, kind, P, peak, front from travel.txt.
import sys; from PIL import Image, ImageDraw
mode, out, title = sys.argv[1], sys.argv[2], sys.argv[3]
W = 236; H = int(633 * W / 1280) + 14
def mids_tab(d, tag):
    T = {}
    for l in open(f'tools/work/fluid2/field/RaindropsOnRoses-{d}/mids.txt'):
        if l[0] == '#': continue
        p = l.split('|'); h = p[0].split(); q = p[1].split()
        T[h[0]] = dict(t=float(h[1]), mid=float(h[2]), curl=float(h[3]), lap=float(q[0]), ratio=float(q[2]))
    return T
def snare_tab(d, tag):
    T = {}
    for l in open(f'tools/work/fluid2/snare/RaindropsOnRoses-{d}/travel.txt'):
        if l[0] == '#': continue
        p = l.split('|'); h = p[0].split(); P = p[1].split()[1:]; pk = p[2].split()[1:]; fr = p[4].split()[1:]
        T[h[0]] = dict(t=float(h[1]), amp=float(h[2]), kind=h[3], P=dict(zip(('k0', 'kh', 'k1'), map(float, P))), peak=dict(zip(('k0', 'kh', 'k1'), map(float, pk))), front=dict(zip(('k0', 'kh', 'k1'), map(float, fr))))
    return T
if mode == 'mids':
    shots = sys.argv[4].split(); specs = sys.argv[5:]; cols = len(shots)
    rows = []
    for s in specs:
        parts = s.split(':'); d, tag, label = parts[0], parts[1], parts[2]; kinds = parts[3] if len(parts) > 3 else 'cv'
        T = mids_tab(d, tag)
        for kind in kinds: rows.append((d, tag, label, kind, T))
    M = Image.new('RGB', (cols * (W + 4), len(rows) * (H + 4) + 18), (34, 34, 34)); dr = ImageDraw.Draw(M); dr.text((4, 2), title, fill=(255, 230, 160))
    for r, (d, tag, label, kind, T) in enumerate(rows):
        for i, nn in enumerate(shots):
            x = i * (W + 4); y = 18 + r * (H + 4)
            try: im = Image.open(f'tools/work/fluid2/field/RaindropsOnRoses-{d}/{tag}-{nn}{"v" if kind == "v" else ""}.jpg').resize((W, H - 14))
            except Exception: im = Image.new('RGB', (W, H - 14), (60, 0, 0))
            M.paste(im, (x, y + 14)); t = T.get(nn, {})
            lab = f"{label} {kind} t{t.get('t', 0):.0f} mid{t.get('mid', 0):.2f} curl{t.get('curl', 0):.0f} lap{t.get('lap', 0) * 1000:.1f} r{t.get('ratio', 0):.2f}"
            dr.text((x + 3, y + 1), lab, fill=(200, 230, 200))
else:
    kA, kB = sys.argv[4], sys.argv[5]; specs = sys.argv[6:]; cols = 8
    rows = []
    for s in specs:
        parts = s.split(':'); d, tag, label = parts[0], parts[1], parts[2]; kinds = parts[3] if len(parts) > 3 else 'dv'
        T = snare_tab(d, tag)
        for kind in kinds: rows.append((d, tag, label, kind, T))
    M = Image.new('RGB', (cols * (W + 4), len(rows) * (H + 4) + 18), (34, 34, 34)); dr = ImageDraw.Draw(M); dr.text((4, 2), title, fill=(255, 230, 160))
    for r, (d, tag, label, kind, T) in enumerate(rows):
        for i, (kk, m) in enumerate([(kA, m) for m in ('pre', 'k0', 'kh', 'k1')] + [(kB, m) for m in ('pre', 'k0', 'kh', 'k1')]):
            x = i * (W + 4); y = 18 + r * (H + 4)
            try: im = Image.open(f'tools/work/fluid2/snare/RaindropsOnRoses-{d}/{tag}-{kk}-{m}{"" if kind == "c" else kind}.jpg').resize((W, H - 14))
            except Exception: im = Image.new('RGB', (W, H - 14), (60, 0, 0))
            M.paste(im, (x, y + 14)); t = T.get(kk, {}); mm = {'pre': 'pre', 'k0': '+0', 'kh': '+½', 'k1': '+1'}[m]
            lab = f"{label} {kind if kind != 'c' else ''} t{t.get('t', 0):.1f} {mm}"
            if t and m != 'pre': lab += f" P{t['P'][m]:.2f} pk{t['peak'][m]:.2f} front{t['front'][m]:.2f}"
            elif t: lab += f" {t['kind']} amp{t['amp']:.2f}"
            dr.text((x + 3, y + 1), lab, fill=(200, 230, 200))
M.save(out, quality=82); print(out, M.size)
