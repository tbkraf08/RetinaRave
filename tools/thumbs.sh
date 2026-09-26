#!/bin/bash
# Landing tiles (v0.8.1): one 480×270 JPEG per scene that declares `card` → site/thumbs/<name>.jpg, from the fake timeline at
# CLOCK=1 GPU=1 (the same frames tools/scene-md5.sh shoots, so a tile is a frame the reference list already vouches for).
# usage: tools/thumbs.sh ["id:frame id:frame …"]   default below = the frame chosen per scene by eye (DECISIONS §40)
cd "$(dirname "$0")/.." || exit 1
PICK=${1:-"0:360 1:1200 2:840 3:360 5:840 6:360 9:360"}   # v0.10: MAXWELL f360 (the worker's frame)
mkdir -p site/thumbs tools/work
for pf in $PICK; do
  i=${pf%%:*}; f=${pf##*:}
  n=$(node -e "import('./assets/scenes/'+process.argv[1]+'/index.js')" 2>/dev/null; grep -lE "^  id: $i,\$" assets/scenes/*/index.js | head -1 | cut -d/ -f3)
  [ -z "$n" ] && { echo "no scene folder with id $i"; continue; }
  CLOCK=1 GPU=1 OUT=tools/work node tools/cdp.js "test&scene=$i" "[{\"until\":\"window.CARD\"},{\"until\":\"window.__FRAME>=$f\"},{\"shot\":\"thumb-s$i-f$f\"}]" >/dev/null
  python3 - "tools/work/thumb-s$i-f$f.jpg" "site/thumbs/$n.jpg" <<'PY'
import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB')
w, h = im.size; tw, th = 480, 270
s = max(tw / w, th / h); im = im.resize((round(w * s), round(h * s)), Image.LANCZOS)
l, t = (im.width - tw) // 2, (im.height - th) // 2
im.crop((l, t, l + tw, t + th)).save(sys.argv[2], 'JPEG', quality=82, optimize=True, progressive=True)
PY
  echo "$n (id $i, f$f) → site/thumbs/$n.jpg $(stat -c %s site/thumbs/$n.jpg) bytes"
done
