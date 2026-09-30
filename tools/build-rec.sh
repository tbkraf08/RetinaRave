#!/bin/bash
# Record the build / drop ruler's page traces (live step 4 B.0; docs/HARNESS.md "Build"): per track the WHOLE track,
# deterministic, raw clocks (&lead=0), twice — the causal path (&map=0: the live ears, what stream mode runs) and the
# default file path (&map=1: the whole-track map's buildProg / toDrop / mapDropEvt, the non-causal CEILING). Two lanes in
# parallel (never more Chromes than two).       tools/build-rec.sh [outdir=tools/work/build]      ~15 min
#   then: python3 tools/truth/dropcheck.py tools/work/build/*-map0.json tools/work/build/*-map1.json
cd "$(dirname "$0")/.."
D=${1:-tools/work/build}; mkdir -p "$D"
F="heardT,leadT,beatCount,beatPhase,bpm,presence,barConf,gridTrust,phraseConf,bpmSyn,barPos,phrase16Pos"
F="$F,build,buildPk,dropEvt,dropEnv,dropStrength,eS,eM,eL,absentT,onsetRate,bass,bassFast,high,highM,tension"
F="$F,riser,roll,swell,hp,hush,calm,alive,resolve,dropConf,dropExpectedIn,fakeoutEvt,boundaryEvt,kick,snare,hat,sub,lvl,bassS,centroid"
F="$F,denK,denS,denH,subGate,subIn,subOut,subPure,bassReg,lpSweep,width,kick2"
F="$F,mapOn,buildProg,toDrop,mapDropEvt,mapBoundaryEvt,barNovelEvt"
lane() {
  local port=$1; shift
  while [ $# -gt 0 ]; do
    local tr=$1 dur=$2; shift 2
    for m in 0 1; do
      PORT=$port node tools/filetrace.js $tr 0 $dur $D/$tr-map$m.json "$F" "&map=$m&lead=0" > $D/$tr-map$m.log 2>&1
    done
  done
}
lane ${PORTA:-8831} SeeYouDrop 157.4 Malicious 222.7 &
lane ${PORTB:-8832} CyborgNinja 179.8 WhoLikesToParty 256.1 &
wait
grep -h "frames ·\|WARNING\|no trace\|page errors" $D/*.log
