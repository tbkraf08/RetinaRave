| ruler | source | value | target | pass | note |
|---|---|---|---|---|---|
| tempo +-1 BPM (bpm) | v3 | 98.1 % of frames | - | - | median 160.04 vs truth 160.00; off 2 % |
| beatPhase lag (continuous) | v3 | med +179 ms, /lag/ p50 179 p90 181 ms | - | - | 0 % of in-octave frames within +-30 ms (n=10580) |
| beatPhase jitter (bias removed) | v3 | /dev/ p50 1 p90 3 ms | - | - | 98 % within +-30 ms of its own median |
| beat events F +-50 ms | v3 | 0.004 (P 0.004 R 0.004) | - | - | tp 2 miss 477 extra 476; lag med -12 p90 18 ms |
| beatPhase first 4 s locked | v3 | never | - | - | >= 90 % of frames within +-30 ms |
| tempo +-1 BPM (bpmPcm) | pcm | 98.1 % of frames | - | - | median 160.04 vs truth 160.00; off 2 % |
| beatPhasePcm lag (continuous) | pcm | med +179 ms, /lag/ p50 179 p90 181 ms | - | - | 0 % of in-octave frames within +-30 ms (n=10580) |
| beatPhasePcm jitter (bias removed) | pcm | /dev/ p50 1 p90 3 ms | - | - | 98 % within +-30 ms of its own median |
| beat events F +-50 ms | pcm | 0.004 (P 0.004 R 0.004) | - | - | tp 2 miss 477 extra 476; lag med -12 p90 18 ms |
| beatPhasePcm first 4 s locked | pcm | never | - | - | >= 90 % of frames within +-30 ms |
| beatPhase frame-to-frame /dlag/ | v3 | p50 0.0 p90 0.0 ms | - | - | 0.0 % of frames move > 5 ms |
| beatPhasePcm frame-to-frame /dlag/ | pcm | p50 0.0 p90 0.0 ms | - | - | 0.0 % of frames move > 5 ms |
| clockConfPcm when on / off the beat | pcm | nan / 0.93 | - | - | median; a useful confidence separates these |
| tempo +-1 BPM (bpmSyn) | synapse | 98.1 % of frames | - | - | median 160.23 vs truth 160.00; off 2 % |
| beatSyn lag (continuous) | synapse | med +55 ms, /lag/ p50 58 p90 111 ms | - | - | 27 % of in-octave frames within +-30 ms (n=10581) |
| beatSyn jitter (bias removed) | synapse | /dev/ p50 45 p90 87 ms | - | - | 32 % within +-30 ms of its own median |
| beatSyn first 4 s locked | synapse | never | - | - | >= 90 % within +-30 ms |
| bar line (barPos) | synapse | 9.8 % of in-octave frames on the truth downbeat | - | - | engine bar 1 is truth beat +1 78 %, +2 5 %, +3 8 % |
| barConf when right / wrong | synapse | 0.11 / 0.33 | - | - | median; a useful confidence separates these |
