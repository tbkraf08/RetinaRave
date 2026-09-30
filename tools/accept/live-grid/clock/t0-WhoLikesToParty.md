| ruler | source | value | target | pass | note |
|---|---|---|---|---|---|
| tempo +-1 BPM (bpm) | v3 | 99.2 % of frames | - | - | median 116.93 vs truth 117.00; off 1 % |
| beatPhase lag (continuous) | v3 | med +3 ms, /lag/ p50 4 p90 13 ms | - | - | 94 % of in-octave frames within +-30 ms (n=15237) |
| beatPhase jitter (bias removed) | v3 | /dev/ p50 4 p90 11 ms | - | - | 94 % within +-30 ms of its own median |
| beat events F +-50 ms | v3 | 0.945 (P 0.944 R 0.946) | - | - | tp 471 miss 27 extra 28; lag med +11 p90 20 ms |
| beatPhase first 4 s locked | v3 | 8.0 s | - | - | >= 90 % of frames within +-30 ms |
| tempo +-1 BPM (bpmSyn) | synapse | 98.7 % of frames | - | - | median 116.93 vs truth 117.00; off 1 % |
| beatSyn lag (continuous) | synapse | med -41 ms, /lag/ p50 45 p90 207 ms | - | - | 5 % of in-octave frames within +-30 ms (n=15151) |
| beatSyn jitter (bias removed) | synapse | /dev/ p50 6 p90 244 ms | - | - | 69 % within +-30 ms of its own median |
| beatSyn first 4 s locked | synapse | never | - | - | >= 90 % within +-30 ms |
| bar line (barPos) | synapse | 32.6 % of in-octave frames on the truth downbeat | - | - | engine bar 1 is truth beat +1 3 %, +2 0 %, +3 65 % |
| barConf when right / wrong | synapse | 0.34 / 0.35 | - | - | median; a useful confidence separates these |
| dropEvt within 2 beats | v3 | 0/3 | - | - | lags - ms; extra none |
