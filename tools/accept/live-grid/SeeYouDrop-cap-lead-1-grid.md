| ruler | source | value | target | pass | note |
|---|---|---|---|---|---|
| tempo +-1 BPM (bpm) | v3 | 95.2 % of frames | - | - | median 149.96 vs truth 150.04; off 5 % |
| beatPhase lag (continuous) | v3 | med -11 ms, /lag/ p50 13 p90 26 ms | - | - | 93 % of in-octave frames within +-30 ms (n=3883) |
| beatPhase jitter (bias removed) | v3 | /dev/ p50 8 p90 17 ms | - | - | 95 % within +-30 ms of its own median |
| beat events F +-50 ms | v3 | 0.938 (P 0.940 R 0.935) | - | - | tp 158 miss 11 extra 10; lag med -3 p90 19 ms |
| beatPhase first 4 s locked | v3 | 24.9 s | - | - | >= 90 % of frames within +-30 ms |
| tempo +-1 BPM (bpmSyn) | synapse | 86.3 % of frames | - | - | median 149.58 vs truth 150.04; off 14 % |
| beatSyn lag (continuous) | synapse | med -7 ms, /lag/ p50 9 p90 30 ms | - | - | 91 % of in-octave frames within +-30 ms (n=3517) |
| beatSyn jitter (bias removed) | synapse | /dev/ p50 6 p90 34 ms | - | - | 87 % within +-30 ms of its own median |
| beatSyn first 4 s locked | synapse | 35.5 s | - | - | >= 90 % within +-30 ms |
| bar line (barPos) | synapse | 92.9 % of in-octave frames on the truth downbeat | - | - | engine bar 1 is truth beat +1 5 %, +2 2 %, +3 0 % |
| barConf when right / wrong | synapse | 0.94 / 0.00 | - | - | median; a useful confidence separates these |
| 16-beat line at drops | synapse | 0 of 1 within 1 beat | - | - | 57.6:+4.1b |
| 16-beat line at section starts | synapse | 2 of 5 within 1 beat | - | - | 25.6:-2.2b 44.8:+0.0b 49.6:-8.0b 57.6:+4.1b 89.6:-0.0b |
| dropExpectedIn / dropConf before drops | synapse | 1 drops | - | - | 57.6[16b:-/0.00 8b:-/0.00 4b:-/0.00 1b:-/0.00] |
| dropEvt within 2 beats | v3 | 1/1 | - | - | lags +73 ms; extra none |
