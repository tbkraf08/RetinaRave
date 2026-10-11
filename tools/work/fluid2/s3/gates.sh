#!/bin/bash
# the S3 gates on RaindropsOnRoses only (the user: "only tune with Raindrops, don't do full sweep"), one Chrome at a time, PORT 8975:
# s13 twice (cmp-equal → re-based into v037), s12 (= v036 on its 8 Raindrops lines), the roster 0 1 3 (= v037's 24), the rulers, the fake, parity, the bench, MOBILE, build + file://, the fade
cd /home/toma/Documents/Kraftek/RetinaRave-wt-fluid2 || exit 1
export GPU=1 PORT=8975 TRACKS=RaindropsOnRoses
W() { echo "== $1 wall $(( $(date +%s) - T0 )) s"; }
echo "== s13a start $(date +%T)"; T0=$(date +%s); SCENES=13 tools/real-md5.sh s3-13a | tail -1 | cut -c1-160; W s13a
echo "== s13b start $(date +%T)"; T0=$(date +%s); SCENES=13 tools/real-md5.sh s3-13b | tail -1 | cut -c1-160; W s13b
cmp tools/work/real-s3-13a-md5.txt tools/work/real-s3-13b-md5.txt && echo "== s13 a/b cmp-equal $(wc -l < tools/work/real-s3-13a-md5.txt) lines" || echo "== s13 a/b DIFFER"
python3 - <<'PY'
a = dict(l.split()[::-1] for l in open('tools/work/real-s3-13a-md5.txt'))
ref = dict(l.split()[::-1] for l in open('tools/accept/v0.37/real-md5-v037.txt') if l[:1] != '#' and len(l.split()) == 2)
same = sum(1 for k in a if k in ref and ref[k] == a[k]); moved = [k for k in a if k in ref and ref[k] != a[k]]
print(f'== s13 vs v037 (S2): {same} unmoved, {len(moved)} moved: {" ".join(sorted(moved))}')
PY
echo "== s12 start $(date +%T)"; T0=$(date +%s); SCENES=12 tools/real-md5.sh s3-12 | tail -1 | cut -c1-160; W s12
python3 - <<'PY'
a = dict(l.split()[::-1] for l in open('tools/work/real-s3-12-md5.txt'))
ref = dict(l.split()[::-1] for l in open('tools/accept/v0.36/real-md5-v036.txt') if l[:1] != '#' and len(l.split()) == 2)
same = sum(1 for k in a if k in ref and ref[k] == a[k]); diff = [k for k in a if k in ref and ref[k] != a[k]]
print(f'== s12 Raindrops vs v036: {same} / {len(a)} equal, differ {diff}')
PY
echo "== roster start $(date +%T)"; T0=$(date +%s); SCENES="0 1 3" tools/real-md5.sh s3-roster | tail -1 | cut -c1-160; W roster
python3 - <<'PY'
a = dict(l.split()[::-1] for l in open('tools/work/real-s3-roster-md5.txt'))
ref = dict(l.split()[::-1] for l in open('tools/accept/v0.37/real-md5-v037.txt') if l[:1] != '#' and len(l.split()) == 2)
same = sum(1 for k in a if k in ref and ref[k] == a[k]); diff = [k for k in a if k in ref and ref[k] != a[k]]; new = [k for k in a if k not in ref]
print(f'== roster 0 1 3 Raindrops vs v037: {same} / {len(a)} equal, differ {diff}, new {new}')
PY
echo "== rulers start $(date +%T)"; T0=$(date +%s); SCENES=13 tools/real-rulers.sh s3-rain > tools/work/s3-rain-rulers.out 2>&1; grep "^13 \|real-rulers" tools/work/s3-rain-rulers.out; W rulers
echo "== fake start $(date +%T)"; T0=$(date +%s); unset TRACKS; tools/scene-md5.sh s3 > tools/work/s3-fake.out 2>&1; W fake
echo "errs [] on $(grep -c 'errs \[\]' tools/work/s3-fake.out) ids"; sort -k2 tools/work/s3-md5.txt | grep -v "s13-" > tools/work/s3-fake-sorted.txt; sort -k2 tools/accept/v0.35/scene-md5-v035.txt | grep -v "^#" > tools/work/fake-ref-v035.txt; cmp tools/work/s3-fake-sorted.txt tools/work/fake-ref-v035.txt && echo "== fake 26 = v035 (s13's pair aside)" || { echo "== fake DIFFERS from v035"; diff tools/work/s3-fake-sorted.txt tools/work/fake-ref-v035.txt | head; }
grep "s13-\|s12-" tools/work/s3-md5.txt
echo "== parity start $(date +%T)"; T0=$(date +%s); node tools/parity.js fake 2>&1 | grep -iE "max|fields|nav\.|diff" | head -8 | cut -c1-200; W parity
echo "== bench $(date +%T)"; tools/work/fluid2/s3/bench.sh
echo "== build $(date +%T)"; npm run build 2>&1 | tail -1; ls -la dist/index.html | awk '{print $5}'
echo "== file:// $(date +%T)"; bash tools/work/s0-file.sh 2>&1 | cut -c1-300
echo "== fade $(date +%T)"; bash tools/work/s0-fade.sh 2>&1 | cut -c1-400
echo "== all done $(date +%T)"
