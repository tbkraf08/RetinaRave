#!/usr/bin/env python3
# p95 (and p50/mean) luminance of a screenshot — tools/lum.py has centre/rim means but no percentile field.
import sys
from PIL import Image
for f in sys.argv[1:]:
    px = sorted(Image.open(f).convert('L').getdata())
    n = len(px)
    print('%-30s p50 %.3f p95 %.3f p99 %.3f mean %.3f' % (f.split('/')[-1], px[n//2]/255, px[int(n*0.95)]/255, px[int(n*0.99)]/255, sum(px)/n/255))
