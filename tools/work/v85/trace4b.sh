#!/bin/bash
# the four MANDALA windows (MANDALA-OVERHAUL-SESSION-PROMPT.md), sequentially, one Chrome page, from a given tree:
#   tools/work/v85/trace4.sh <tree> <out-dir> <prefix> <port>      e.g. trace4.sh ../RetinaRave-m-base tools/work/v85 before 8881
# WARM: SeeYouDrop 20 (at 0) · Vienna 24-60 → 24 (at 0) · Vienna 80-110 → 40 (at 40: the build detector needs 32 s, §54) · CyborgNinja 20 (at 0)
TREE=$1; OUT=$(cd "$(dirname "$2")" && pwd)/$(basename "$2"); P=$3; PORT=${4:-8881}
F="heardT,lvl,alive,eM,eS,bassS,midS,highS,kick,kick2,kickAge,kickEvt,snare2,snareAge,snareEvt,snareAmp,kickAmp,hat2,hatAge,hatEvt,beat,beatPhase,beatCount,bpm,barPos,barPhase,phrase16Pos,barNovelEvt,barReturnEvt,sectionAlt,sectionReturn,buildLive,dropLiveIn,dropLiveEvt,dropEnv,dropEvt,tension,nextDropIn,nextBarIn,subGate,subNoteEvt,hush,denK,arc,eMax,eG,mapOn,riser,roll,denH,presence,build,tongueAmbig,tongueOn,tongue21,tongue41,key,mode,keyConf,modeShade,valence,harmAngle"
cd "$TREE" || exit 1
PORT=$PORT WARM=20 node tools/dust-trace.js SeeYouDrop 20 110 $OUT/$P-syd-20-110.json 2 "$F"
PORT=$PORT WARM=24 node tools/dust-trace.js Vienna 24 60 $OUT/$P-vienna-24-60.json 2 "$F"
PORT=$PORT WARM=40 node tools/dust-trace.js Vienna 80 110 $OUT/$P-vienna-80-110.json 2 "$F"
PORT=$PORT WARM=20 node tools/dust-trace.js CyborgNinja 20 80 $OUT/$P-cn-20-80.json 2 "$F"
echo TRACE4-DONE $P
