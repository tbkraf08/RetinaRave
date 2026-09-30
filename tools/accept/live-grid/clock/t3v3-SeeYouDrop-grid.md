| ruler | source | value | target | pass | note |
|---|---|---|---|---|---|
| tempo +-1 BPM (bpm) | v3 | 95.5 % of frames | - | - | median 150.00 vs truth 150.04; off 5 % |
| beatPhase lag (continuous) | v3 | med -4 ms, /lag/ p50 8 p90 30 ms | - | - | 90 % of in-octave frames within +-30 ms (n=9001) |
| beatPhase jitter (bias removed) | v3 | /dev/ p50 8 p90 32 ms | - | - | 89 % within +-30 ms of its own median |
| beat events F +-50 ms | v3 | 0.912 (P 0.915 R 0.908) | - | - | tp 356 miss 36 extra 33; lag med +3 p90 22 ms |
| beatPhase first 4 s locked | v3 | 10.5 s | - | - | >= 90 % of frames within +-30 ms |
| tempo +-1 BPM (bpmPcm) | pcm | 94.9 % of frames | - | - | median 150.01 vs truth 150.04; off 5 % |
| beatPhasePcm lag (continuous) | pcm | med +2 ms, /lag/ p50 6 p90 19 ms | - | - | 97 % of in-octave frames within +-30 ms (n=8952) |
| beatPhasePcm jitter (bias removed) | pcm | /dev/ p50 6 p90 19 ms | - | - | 97 % within +-30 ms of its own median |
| beat events F +-50 ms | pcm | 0.970 (P 0.989 R 0.952) | - | - | tp 373 miss 19 extra 4; lag med +9 p90 24 ms |
| beatPhasePcm first 4 s locked | pcm | 7.6 s | - | - | >= 90 % of frames within +-30 ms |
| beatPhase frame-to-frame /dlag/ | v3 | p50 0.1 p90 0.5 ms | - | - | 0.1 % of frames move > 5 ms |
| beatPhasePcm frame-to-frame /dlag/ | pcm | p50 0.0 p90 0.0 ms | - | - | 0.7 % of frames move > 5 ms |
| clockConfPcm when on / off the beat | pcm | 0.93 / 0.86 | - | - | median; a useful confidence separates these |
| tempo +-1 BPM (bpmSyn) | synapse | 61.6 % of frames | - | - | median 149.58 vs truth 150.04; x0.5 14 %, off 24 % |
| beatSyn lag (continuous) | synapse | med -43 ms, /lag/ p50 45 p90 66 ms | - | - | 16 % of in-octave frames within +-30 ms (n=5805) |
| beatSyn jitter (bias removed) | synapse | /dev/ p50 10 p90 38 ms | - | - | 88 % within +-30 ms of its own median |
| beatSyn first 4 s locked | synapse | 85.0 s | - | - | >= 90 % within +-30 ms |
| bar line (barPos) | synapse | 58.7 % of in-octave frames on the truth downbeat | - | - | engine bar 1 is truth beat +1 16 %, +2 21 %, +3 4 % |
| barConf when right / wrong | synapse | 0.99 / 0.22 | - | - | median; a useful confidence separates these |
| dropEvt within 2 beats | v3 | 2/2 | - | - | lags -6 +4 ms; extra none |
