| ruler | source | value | target | pass | note |
|---|---|---|---|---|---|
| tempo +-1 BPM (bpm) | v3 | 95.2 % of frames | - | - | median 149.96 vs truth 150.04; off 5 % |
| beatPhase lag (continuous) | v3 | med +14 ms, /lag/ p50 16 p90 30 ms | - | - | 90 % of in-octave frames within +-30 ms (n=3883) |
| beatPhase jitter (bias removed) | v3 | /dev/ p50 8 p90 18 ms | - | - | 92 % within +-30 ms of its own median |
| beat events F +-50 ms | v3 | 0.905 (P 0.910 R 0.899) | - | - | tp 152 miss 17 extra 15; lag med +20 p90 38 ms |
| beatPhase first 4 s locked | v3 | 24.9 s | - | - | >= 90 % of frames within +-30 ms |
| tempo +-1 BPM (bpmSyn) | synapse | 86.3 % of frames | - | - | median 149.58 vs truth 150.04; off 14 % |
| beatSyn lag (continuous) | synapse | med +16 ms, /lag/ p50 18 p90 35 ms | - | - | 85 % of in-octave frames within +-30 ms (n=3517) |
| beatSyn jitter (bias removed) | synapse | /dev/ p50 6 p90 23 ms | - | - | 94 % within +-30 ms of its own median |
| beatSyn first 4 s locked | synapse | 34.1 s | - | - | >= 90 % within +-30 ms |
| bar line (barPos) | synapse | 93.2 % of in-octave frames on the truth downbeat | - | - | engine bar 1 is truth beat +1 5 %, +2 2 %, +3 0 % |
| barConf when right / wrong | synapse | 0.94 / 0.00 | - | - | median; a useful confidence separates these |
| 16-beat line at drops | synapse | 0 of 1 within 1 beat | - | - | 57.6:+4.0b |
| 16-beat line at section starts | synapse | 2 of 5 within 1 beat | - | - | 25.6:-2.2b 44.8:+0.0b 49.6:+8.0b 57.6:+4.0b 89.6:-0.1b |
| dropExpectedIn / dropConf before drops | synapse | 1 drops | - | - | 57.6[16b:-/0.00 8b:-/0.00 4b:-/0.00 1b:-/0.00] |
| dropEvt within 2 beats | v3 | 1/1 | - | - | lags +62 ms; extra none |
