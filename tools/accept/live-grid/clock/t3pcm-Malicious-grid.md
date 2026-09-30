| ruler | source | value | target | pass | note |
|---|---|---|---|---|---|
| tempo +-1 BPM (bpm) | v3 | 78.9 % of frames | - | - | median 140.00 vs truth 139.66; off 21 % |
| beatPhase lag (continuous) | v3 | med +11 ms, /lag/ p50 13 p90 28 ms | - | - | 91 % of in-octave frames within +-30 ms (n=10532) |
| beatPhase jitter (bias removed) | v3 | /dev/ p50 7 p90 25 ms | - | - | 92 % within +-30 ms of its own median |
| beat events F +-50 ms | v3 | 0.945 (P 0.946 R 0.944) | - | - | tp 489 miss 29 extra 28; lag med +19 p90 33 ms |
| beatPhase first 4 s locked | v3 | 6.1 s | - | - | >= 90 % of frames within +-30 ms |
| tempo +-1 BPM (bpmPcm) | pcm | 78.9 % of frames | - | - | median 140.00 vs truth 139.66; off 21 % |
| beatPhasePcm lag (continuous) | pcm | med +11 ms, /lag/ p50 13 p90 28 ms | - | - | 91 % of in-octave frames within +-30 ms (n=10532) |
| beatPhasePcm jitter (bias removed) | pcm | /dev/ p50 7 p90 25 ms | - | - | 92 % within +-30 ms of its own median |
| beat events F +-50 ms | pcm | 0.944 (P 0.946 R 0.942) | - | - | tp 488 miss 30 extra 28; lag med +19 p90 33 ms |
| beatPhasePcm first 4 s locked | pcm | 6.1 s | - | - | >= 90 % of frames within +-30 ms |
| beatPhase frame-to-frame /dlag/ | v3 | p50 0.0 p90 0.1 ms | - | - | 1.4 % of frames move > 5 ms |
| beatPhasePcm frame-to-frame /dlag/ | pcm | p50 0.0 p90 0.1 ms | - | - | 1.4 % of frames move > 5 ms |
| clockConfPcm when on / off the beat | pcm | 0.91 / 0.88 | - | - | median; a useful confidence separates these |
| tempo +-1 BPM (bpmSyn) | synapse | 36.3 % of frames | - | - | median 140.14 vs truth 139.66; x0.5 8 %, x0.67 1 %, off 55 % |
| beatSyn lag (continuous) | synapse | med -32 ms, /lag/ p50 125 p90 203 ms | - | - | 11 % of in-octave frames within +-30 ms (n=4840) |
| beatSyn jitter (bias removed) | synapse | /dev/ p50 125 p90 182 ms | - | - | 11 % within +-30 ms of its own median |
| beatSyn first 4 s locked | synapse | never | - | - | >= 90 % within +-30 ms |
| bar line (barPos) | synapse | 1.6 % of in-octave frames on the truth downbeat | - | - | engine bar 1 is truth beat +1 52 %, +2 43 %, +3 3 % |
| barConf when right / wrong | synapse | 0.01 / 0.26 | - | - | median; a useful confidence separates these |
| dropEvt within 2 beats | v3 | 0/1 | - | - | lags - ms; extra 12.0 18.8 25.7 |
