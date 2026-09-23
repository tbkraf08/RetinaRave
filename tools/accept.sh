#!/bin/bash
# v0.2 acceptance sweep -> tools/accept/v0.2/. Run with GPU=1. Prints one line per check; grep FAIL.
cd "$(dirname "$0")/.." || exit 1
export OUT=tools/accept/v0.2; mkdir -p $OUT
echo "== check.js";      node tools/check.js || echo "FAIL check.js"
echo "== math tests";    node tools/test_baby.js | tail -1; node tools/test_misi.js | tail -1; node tools/test_hopf.js | tail -1; node tools/test_tempo.js | tail -1; node tools/test_director.js | tail -1
echo "== lines smoke";    node tools/lines-smoke.js | tail -1
echo "== parity fake";   node tools/parity.js fake | grep -E "parity|MISMATCH|max \|diff\|" || echo "FAIL parity fake"
echo "== parity real";   node tools/parity.js real | tail -1
MON=$(grep -v '^//' tools/monitor.js | tr '\n' ' ' | sed 's/"/\\"/g')
echo "== monitor 60 s";  node tools/cdp.js 'test&fake=0' "[{\"wait\":1500},{\"eval\":\"$MON;'ok'\"},{\"wait\":60000},{\"eval\":\"'MON '+JSON.stringify({n:MON.n,fast:MON.fast,viol:MON.viol,errs:CARD.ERRS,bad:CARD.nonFinite()})\"}]" | grep EVAL | sed 's/.*=> //'
echo "== scenes on #test (T6 / T14)"
IDS=$(grep -ho "^  id: [0-9]*" assets/scenes/*/index.js | grep -o "[0-9]*" | sort -n)
for i in $IDS; do
  node tools/cdp.js "test&scene=$i" "[{\"wait\":6000},{\"eval\":\"'scene $i ERRS '+JSON.stringify(CARD.ERRS)+' bad '+JSON.stringify(CARD.nonFinite())+' | '+(CARD.REG[$i]?CARD.REG[$i].scene.name:'?')\"},{\"shot\":\"s$i-t6\"},{\"wait\":8200},{\"shot\":\"s$i-t14\"}]" | grep EVAL | sed 's/.*=> //'
done
echo "== real start path"
NOAUTO=1 node tools/cdp.js 'real' '[{"wait":1500},{"shot":"real-landing"},{"click":[695,440]},{"wait":4000},{"eval":"'"'"'REAL '"'"'+JSON.stringify({mode:CARD.ENGINE.AU.mode,bad:CARD.nonFinite(),errs:CARD.ERRS,glerr:CARD.glerr})"},{"shot":"real-4s"},{"wait":20000},{"eval":"'"'"'REAL24 '"'"'+JSON.stringify({bad:CARD.nonFinite(),errs:CARD.ERRS})"},{"shot":"real-24s"}]' | grep EVAL | sed 's/.*=> //'
echo "== bundle";        node tools/bundle.js && FILE=$PWD/dist/eigenwobble.html NOAUTO=1 node tools/cdp.js 'real' '[{"wait":1500},{"click":[695,440]},{"wait":4000},{"eval":"'"'"'BUNDLE '"'"'+JSON.stringify({bad:CARD.nonFinite(),errs:CARD.ERRS,mode:CARD.ENGINE.AU.mode})"}]' | grep EVAL | sed 's/.*=> //'
python3 tools/montage.py $OUT/montage-scenes.jpg 2 $OUT/s*-t6.jpg $OUT/s*-t14.jpg 2>/dev/null && echo "montage $OUT/montage-scenes.jpg"
