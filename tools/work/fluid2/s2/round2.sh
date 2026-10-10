#!/bin/bash
# round 2 (after the field swallowed every shape at one momentum): the launch against the field — the dipole outward / inward strong, the puff
# stronger (SET semantics: the one kind the field cannot cancel at the front), shape 0 with the field OFF (the cause isolated from the sub-jet's
# removal), and the base's KICK_V × 2 under shape 0 (the trade's price in impulse — a measurement, not a candidate)
cd /home/toma/Documents/Kraftek/RetinaRave-wt-fluid2 || exit 1
tools/work/fluid2/s2/run.sh \
  '13:dipout06:{"KICK_SHAPE":3,"DIP_V":-0.6}' \
  '13:dipout12:{"KICK_SHAPE":3,"DIP_V":-1.2,"DIP_D":0.05}' \
  '13:dipin08:{"KICK_SHAPE":3,"DIP_V":0.8}' \
  '13:puff08:{"KICK_SHAPE":4,"KPUFF_A":0.8,"KPUFF_R":0.2,"KPUFF_T":0.5}' \
  '13:puff12:{"KICK_SHAPE":4,"KPUFF_A":1.2,"KPUFF_R":0.25,"KPUFF_T":0.5,"KPUFF_W":0.05}' \
  '13:nofield:{"KICK_SHAPE":0,"HEAVE":0,"HEAVE_DC":0}'
K='{"KICK_V":1.8}' tools/work/fluid2/s2/run.sh '13:kickx2:{"KICK_SHAPE":0}'
