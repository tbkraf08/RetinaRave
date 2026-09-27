#!/usr/bin/env python3
# mean HSV saturation and luminance of the bright pixels (L > 0.15) of each image — "pastel" = bright but unsaturated
import sys
from PIL import Image
import numpy as np
for f in sys.argv[1:]:
    im = np.asarray(Image.open(f).convert('RGB')).astype(float) / 255
    L = im @ np.array([.2126, .7152, .0722]); mx = im.max(2); mn = im.min(2); S = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    b = L > 0.15
    print(f"{f.split('/')[-1]:44s} bright {b.mean():.2f}  sat(bright) {S[b].mean():.3f}  L(bright) {L[b].mean():.3f}  L(all) {L.mean():.3f}  p95 L {np.percentile(L,95):.3f}")
