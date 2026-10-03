#!/bin/bash
# step 3 after its two tunes: s2's lines, SeeYouDrop + Vienna 80-110 (the windows the tension touches) + Vienna 70-90 (the dream), then step 4's full chain
MAIN=/home/toma/Documents/Kraftek/RetinaRave; T87=$MAIN/../RetinaRave-m87; OUT=$MAIN/tools/work/v87
F="heardT,lvl,alive,eM,eS,bassS,midS,highS,kick,kick2,kickAge,kickEvt,snare2,snareAge,snareEvt,snareAmp,kickAmp,hat2,hatAge,hatEvt,beat,beatPhase,beatCount,bpm,barPos,barPhase,phrase16Pos,barNovelEvt,barReturnEvt,sectionAlt,sectionReturn,buildLive,dropLiveIn,dropLiveEvt,dropEnv,dropEvt,tension,nextDropIn,nextBarIn,subGate,subNoteEvt,hush,denK,arc,eMax,eG,mapOn,riser,roll,denH,presence,build,tongueAmbig,tongueOn,tongue21,tongue41,key,mode,keyConf,modeShade,valence,harmAngle"
cd $T87 && IDS=2 PORT=8884 tools/scene-md5.sh s3b > $OUT/s3b-md5.log 2>&1; cat tools/work/s3b-md5.txt
PORT=8884 WARM=20 node tools/dust-trace.js SeeYouDrop 20 110 $OUT/s3b-syd-20-110.json 2 "$F"
PORT=8884 WARM=40 node tools/dust-trace.js Vienna 80 110 $OUT/s3b-vienna-80-110.json 2 "$F"
PORT=8884 WARM=30 node tools/dust-trace.js Vienna 70 90 $OUT/s3b-vienna-70-90.json 2 "$F"
echo S3B-DONE
$MAIN/tools/work/v85/chain2.sh $MAIN/../RetinaRave-m88 tools/work/v88 s4 8885
echo CHAIN5-DONE
