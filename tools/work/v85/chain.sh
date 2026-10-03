#!/bin/bash
# one step's Chrome work, sequential (one page at a time): the full scene md5 list, the four after-traces, the two benches
# usage: chain.sh <tree> <outdir> <prefix> <port> [basetree-for-bench]
TREE=$1; OUT=$2; P=$3; PORT=$4; BASE=$5
MAIN=/home/toma/Documents/Kraftek/RetinaRave
cd $TREE && PORT=$PORT tools/scene-md5.sh $P > $MAIN/$OUT/$P-md5.log 2>&1; cp $TREE/tools/work/$P-md5.txt $MAIN/$OUT/$P-md5.txt
echo MD5-DONE; diff $MAIN/tools/accept/v0.29/scene-md5-v029.txt $MAIN/$OUT/$P-md5.txt | grep '^[<>]'
$MAIN/tools/work/v85/trace4.sh $TREE $MAIN/$OUT $P $PORT
if [ -n "$BASE" ]; then $MAIN/tools/work/v85/bench2.sh $BASE $PORT base-bench; fi
$MAIN/tools/work/v85/bench2.sh $TREE $PORT $P-bench
echo CHAIN-DONE $P
