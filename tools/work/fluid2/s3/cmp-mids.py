#!/usr/bin/env python3
# cmp-mids.py <dir:tag> … — the S3 mids table over tools/work/fluid2/field/RaindropsOnRoses-<dir>/mids.txt: per variant the windows' p50 curl / lap / speed / ratio / curlM and the dense-over-thin margins
import sys, re
print('| tag | window | mid | curl | lap ×1000 | speed | ratio | curlM ×1000 | grey |'); print('|---|---|---|---|---|---|---|---|---|')
marg = []
for spec in sys.argv[1:]:
    d, tag = spec.split(':')
    for l in open(f'tools/work/fluid2/field/RaindropsOnRoses-{d}/mids.txt'):
        if not l.startswith('# '): continue
        m = re.match(r'# (\S+) (\S+): n (\d+) · mid ([\d.]+) · curl ([\d.]+) · lap ([\d.]+) · speed ([\d.]+) · ratio ([\d.]+) · curlM ([\d.]+) · grey ([\d.]+)', l)
        if m: print(f'| {tag} | {m.group(2)} ({m.group(3)}) | {m.group(4)} | {m.group(5)} | {float(m.group(6)) * 1000:.2f} | {m.group(7)} | {m.group(8)} | {float(m.group(9)) * 1000:.2f} | {m.group(10)} |')
        m = re.match(r'# (\S+) margin (\S+): lap ([\d.]+) · ratio ([\d.]+) · curlM ([\d.]+) · speed ([\d.]+)', l)
        if m and 'thin_break' in m.group(2): marg.append((tag, m.group(2), m.group(3), m.group(4), m.group(5), m.group(6)))
print('\n| tag | dense / thin | lap | ratio | curlM | speed |'); print('|---|---|---|---|---|---|')
for r in marg: print('| ' + ' | '.join(r) + ' |')
