#!/bin/bash
# re-base the 8 s13-RaindropsOnRoses lines of tools/accept/v0.37/real-md5-v037.txt from the S2 run (s2-13a = s2-13b cmp-equal); the rest untouched
cd /home/toma/Documents/Kraftek/RetinaRave-wt-fluid2 || exit 1
python3 - <<'PY'
new = dict(l.split()[::-1] for l in open('tools/work/real-s2-13a-md5.txt'))
out, moved, kept = [], 0, 0
for l in open('tools/accept/v0.37/real-md5-v037.txt'):
    p = l.split()
    if len(p) == 2 and p[1] in new:
        if new[p[1]] != p[0]: moved += 1
        out.append(f'{new[p[1]]}  {p[1]}\n'); kept += 1
    else: out.append(l)
open('tools/accept/v0.37/real-md5-v037.txt', 'w').writelines(out)
print(f'v037 re-based: {kept} s13 Raindrops lines in place, {moved} moved; {sum(1 for l in out if len(l.split()) == 2)} hash lines total')
PY
git diff --stat tools/accept/v0.37/real-md5-v037.txt
