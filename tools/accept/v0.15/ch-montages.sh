#!/bin/bash
# The nine window montages, from the shots tools/accept/v0.15/ch-windows.sh took.
cd "$(dirname "$0")/../../.." || exit 1
M() { python3 tools/montage.py "tools/work/$1" "$2" "${@:3}"; echo "tools/work/$1"; }
M ch-win1-walk.jpg   4 tools/work/ch-w1-0{0,1,2,3}.jpg
M ch-win2-groove.jpg 3 tools/work/ch-w2-0{0,1,2,3,4,5}.jpg
M ch-win3-climbs.jpg 4 tools/work/ch-w3a-0{0,1,2,3}.jpg tools/work/ch-w3b-0{0,1,2,3}.jpg
M ch-win4-void.jpg   3 tools/work/ch-w4-0{0,1,2,3,4}.jpg
M ch-win5-drops.jpg  3 tools/work/ch-w5a-0{0,1,2,3,4,5}.jpg tools/work/ch-w5b-0{0,1,2,3,4,5}.jpg
M ch-win6-slides.jpg 3 tools/work/ch-w6-0{0,1,2,3,4,5}.jpg
M ch-win7-gated.jpg  3 tools/work/ch-w7-0{0,1,2,3,4,5}.jpg
M ch-win8-outro.jpg  3 tools/work/ch-w8-0{0,1,2,3,4,5}.jpg
M ch-win9-bright.jpg 3 tools/work/ch-w2-0{0,2,3,4,5}.jpg
python3 tools/work/ch-p95.py tools/work/ch-w2-0{0,1,2,3,4,5}.jpg 2>/dev/null
python3 tools/lum.py tools/work/ch-w2-0{2,3}.jpg
