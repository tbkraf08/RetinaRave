| ruler | source | value | target | pass | note |
|---|---|---|---|---|---|
| tempo +-1 BPM (bpm) | v3 | 95.2 % of frames | - | - | median 149.96 vs truth 150.04; off 5 % |
| beatPhase lag (continuous) | v3 | med +14 ms, /lag/ p50 14 p90 31 ms | - | - | 89 % of in-octave frames within +-30 ms (n=3880) |
| beatPhase jitter (bias removed) | v3 | /dev/ p50 7 p90 18 ms | - | - | 93 % within +-30 ms of its own median |
| beat events F +-50 ms | v3 | 0.884 (P 0.887 R 0.882) | - | - | tp 149 miss 20 extra 19; lag med +21 p90 36 ms |
| beatPhase first 4 s locked | v3 | 25.0 s | - | - | >= 90 % of frames within +-30 ms |
| tempo +-1 BPM (bpmSyn) | synapse | 86.2 % of frames | - | - | median 149.58 vs truth 150.04; off 14 % |
| beatSyn lag (continuous) | synapse | med +14 ms, /lag/ p50 16 p90 31 ms | - | - | 88 % of in-octave frames within +-30 ms (n=3515) |
| beatSyn jitter (bias removed) | synapse | /dev/ p50 9 p90 20 ms | - | - | 94 % within +-30 ms of its own median |
| beatSyn first 4 s locked | synapse | 33.6 s | - | - | >= 90 % within +-30 ms |
| bar line (barPos) | synapse | 87.0 % of in-octave frames on the truth downbeat | - | - | engine bar 1 is truth beat +1 0 %, +2 12 %, +3 1 % |
| barConf when right / wrong | synapse | 0.98 / 0.00 | - | - | median; a useful confidence separates these |
| 16-beat line at drops | synapse | 0 of 1 within 1 beat | - | - | 57.6:+4.0b |
| 16-beat line at section starts | synapse | 2 of 5 within 1 beat | - | - | 25.6:-2.3b 44.8:-0.0b 49.6:+8.0b 57.6:+4.0b 89.6:-0.1b |
| dropExpectedIn / dropConf before drops | synapse | 1 drops | - | - | 57.6[16b:-/0.00 8b:-/0.00 4b:-/0.00 1b:-/0.00] |
| dropEvt within 2 beats | v3 | 1/1 | - | - | lags +63 ms; extra none |
