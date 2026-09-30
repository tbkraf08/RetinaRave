| ruler | source | value | target | pass | note |
|---|---|---|---|---|---|
| tempo +-1 BPM (bpm) | v3 | 99.2 % of frames | - | - | median 159.99 vs truth 160.00; off 1 % |
| beatPhase lag (continuous) | v3 | med -87 ms, /lag/ p50 111 p90 183 ms | - | - | 1 % of in-octave frames within +-30 ms (n=10698) |
| beatPhase jitter (bias removed) | v3 | /dev/ p50 43 p90 244 ms | - | - | 40 % within +-30 ms of its own median |
| beat events F +-50 ms | v3 | 0.050 (P 0.050 R 0.050) | - | - | tp 24 miss 455 extra 454; lag med -45 p90 45 ms |
| beatPhase first 4 s locked | v3 | never | - | - | >= 90 % of frames within +-30 ms |
| tempo +-1 BPM (bpmSyn) | synapse | 98.1 % of frames | - | - | median 160.23 vs truth 160.00; off 2 % |
| beatSyn lag (continuous) | synapse | med +64 ms, /lag/ p50 68 p90 126 ms | - | - | 26 % of in-octave frames within +-30 ms (n=10581) |
| beatSyn jitter (bias removed) | synapse | /dev/ p50 47 p90 90 ms | - | - | 31 % within +-30 ms of its own median |
| beatSyn first 4 s locked | synapse | never | - | - | >= 90 % within +-30 ms |
| bar line (barPos) | synapse | 0.0 % of in-octave frames on the truth downbeat | - | - | engine bar 1 is truth beat +1 54 %, +2 2 %, +3 44 % |
| barConf when right / wrong | synapse | nan / 0.28 | - | - | median; a useful confidence separates these |
