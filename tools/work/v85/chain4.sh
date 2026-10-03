#!/bin/bash
# step 1 re-trace after the one tune (scene-folder-only change: s2's lines + the four traces), then step 2's full chain
MAIN=/home/toma/Documents/Kraftek/RetinaRave
cd $MAIN/../RetinaRave-m85 && IDS=2 PORT=8882 tools/scene-md5.sh s1c > $MAIN/tools/work/v85/s1c-md5.log 2>&1; cp tools/work/s1c-md5.txt $MAIN/tools/work/v85/s1c-md5.txt; cat $MAIN/tools/work/v85/s1c-md5.txt
$MAIN/tools/work/v85/trace4.sh $MAIN/../RetinaRave-m85 $MAIN/tools/work/v85 s1c 8882
$MAIN/tools/work/v85/chain2.sh $MAIN/../RetinaRave-m86 tools/work/v86 s2 8883
echo CHAIN4-DONE
