#!/bin/bash
# v0.2 acceptance sweep -> tools/accept/v0.2/. Run with GPU=1. Prints one line per check; grep FAIL. The real-path and
# bundle lines also count cdp's [EXC] lines (uncaught exceptions never reach CARD.ERRS — the bundle was dead for months
# of commits with errs [] until §11 counted them).
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
echo "== transition";  MD5=4ac523e9770e7d0625d46ed1f3e44769   # mixs at the fake timeline's frame 290 (NAV→TORUS, m .499), GPU=1 1280×720: v3's crossfade, byte-identical since §11
CLOCK=1 node tools/cdp.js 'test&trans=mixs' '[{"until":"window.CARD"},{"until":"window.__FRAME>=290"},{"shot":"trans-mixs-f290"}]' > /dev/null; M=$(md5sum $OUT/trans-mixs-f290.jpg | cut -c1-32); [ "$M" = "$MD5" ] && echo "mixs f290 md5 $M = recorded" || echo "FAIL mixs f290 md5 $M != recorded $MD5"
CLOCK=1 node tools/cdp.js 'test&trans=morph' '[{"until":"window.CARD"},{"until":"window.__FRAME>=290"},{"shot":"trans-morph-f290"},{"eval":"'"'"'MORPH f290 '"'"'+JSON.stringify({sc:[CARD.SC.cur,CARD.SC.next,+CARD.SC.m.toFixed(3)],errs:CARD.ERRS,bench:CARD.benchTransition(300)})"}]' | grep EVAL | sed 's/.*=> //'
python3 tools/montage.py $OUT/montage-trans.jpg 2 $OUT/trans-mixs-f290.jpg $OUT/trans-morph-f290.jpg $OUT/trans-mixs-0-2-f178.jpg $OUT/trans-morph-0-2-f178.jpg $OUT/trans-mixs-1-3-f178.jpg $OUT/trans-morph-1-3-f178.jpg $OUT/trans-mixs-5-0-f178.jpg $OUT/trans-morph-5-0-f178.jpg 2>/dev/null && echo "montage $OUT/montage-trans.jpg"
echo "== real start path"
R=$(NOAUTO=1 node tools/cdp.js 'real' '[{"wait":1500},{"shot":"real-landing"},{"click":[695,440]},{"wait":4000},{"eval":"'"'"'REAL '"'"'+JSON.stringify({mode:CARD.ENGINE.AU.mode,bad:CARD.nonFinite(),errs:CARD.ERRS,glerr:CARD.glerr})"},{"shot":"real-4s"},{"wait":20000},{"eval":"'"'"'REAL24 '"'"'+JSON.stringify({bad:CARD.nonFinite(),errs:CARD.ERRS,switched:CARD.SC.hist.length>1})"},{"shot":"real-24s"}]'); echo "$R" | grep EVAL | sed 's/.*=> //'; N=$(echo "$R" | grep -c '^\[EXC\]'); [ "$N" = 0 ] && echo "exceptions 0" || { echo "FAIL $N uncaught exceptions"; echo "$R" | grep '^\[EXC\]' | head -1 | cut -c1-300; }
echo "== bundle";        node tools/bundle.js && R=$(FILE=$PWD/dist/eigenwobble.html NOAUTO=1 node tools/cdp.js 'real' '[{"wait":1500},{"click":[695,440]},{"wait":30000},{"eval":"'"'"'BUNDLE 30s '"'"'+JSON.stringify({bad:CARD.nonFinite(),errs:CARD.ERRS,mode:CARD.ENGINE.AU.mode,hop:CARD.ENGINE.tex.hop,switched:CARD.SC.hist.length>1})"}]'); echo "$R" | grep EVAL | sed 's/.*=> //'; N=$(echo "$R" | grep -c '^\[EXC\]'); [ "$N" = 0 ] && echo "exceptions 0" || { echo "FAIL $N uncaught exceptions in the bundle"; echo "$R" | grep '^\[EXC\]' | head -1 | cut -c1-300; }
python3 tools/montage.py $OUT/montage-scenes.jpg 2 $OUT/s*-t6.jpg $OUT/s*-t14.jpg 2>/dev/null && echo "montage $OUT/montage-scenes.jpg"
