#!/usr/bin/env python3
# centre/rim mean luminance of a screenshot (TORUS2 spec 1 proof, v0.7): usage tools/lum.py <shot.jpg>…
# centre = the centred box covering 20% of each dimension; rim = the annulus with r/(shortEdge/2) in [0.6, 0.9].
import sys
from PIL import Image

for f in sys.argv[1:]:
    im = Image.open(f).convert('L')
    w, h = im.size
    px = im.load()
    half = min(w, h) / 2.0
    cx, cy = w / 2.0, h / 2.0
    cs = cn = rs = rn = 0
    for y in range(h):
        for x in range(w):
            v = px[x, y]
            if abs(x - cx) <= 0.1 * w and abs(y - cy) <= 0.1 * h:
                cs += v; cn += 1
            r = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5 / half
            if 0.6 <= r <= 0.9:
                rs += v; rn += 1
    c = cs / max(cn, 1) / 255.0
    r = rs / max(rn, 1) / 255.0
    print('%-34s centre %.4f  rim %.4f  ratio %.2f' % (f.split('/')[-1], c, r, (c / r) if r else float('inf')))
