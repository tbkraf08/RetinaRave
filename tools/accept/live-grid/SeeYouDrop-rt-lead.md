| ruler | source | value | target | pass | note |
|---|---|---|---|---|---|
| tempo +-1 BPM (bpm) | v3 | 100.0 % of frames | - | - | median 149.99 vs truth 150.04; no octave errors |
| beatPhase lag (continuous) | v3 | med -7 ms, /lag/ p50 14 p90 35 ms | - | - | 80 % of in-octave frames within +-30 ms (n=3965) |
| beatPhase jitter (bias removed) | v3 | /dev/ p50 12 p90 29 ms | - | - | 92 % within +-30 ms of its own median |
| beat events F +-50 ms | v3 | 0.941 (P 0.941 R 0.941) | - | - | tp 160 miss 10 extra 10; lag med +1 p90 26 ms |
| beatPhase first 4 s locked | v3 | 21.6 s | - | - | >= 90 % of frames within +-30 ms |
| tempo +-1 BPM (bpmSyn) | synapse | 86.4 % of frames | - | - | median 149.58 vs truth 150.04; off 14 % |
| beatSyn lag (continuous) | synapse | med -6 ms, /lag/ p50 8 p90 29 ms | - | - | 91 % of in-octave frames within +-30 ms (n=3425) |
| beatSyn jitter (bias removed) | synapse | /dev/ p50 5 p90 29 ms | - | - | 90 % within +-30 ms of its own median |
| beatSyn first 4 s locked | synapse | 35.5 s | - | - | >= 90 % within +-30 ms |
| bar line (barPos) | synapse | 61.4 % of in-octave frames on the truth downbeat | - | - | engine bar 1 is truth beat +1 0 %, +2 32 %, +3 7 % |
| barConf when right / wrong | synapse | 0.78 / 0.11 | - | - | median; a useful confidence separates these |
| 16-beat line at drops | synapse | 0 of 1 within 1 beat | - | - | 57.6:+3.1b |
| 16-beat line at section starts | synapse | 1 of 5 within 1 beat | - | - | 25.6:+2.1b 44.8:+2.0b 49.6:-2.0b 57.6:+3.1b 89.6:+0.0b |
| dropExpectedIn / dropConf before drops | synapse | 1 drops | - | - | 57.6[16b:-/0.00 8b:-/0.00 4b:-/0.00 1b:13.9/0.10] |
| dropEvt within 2 beats | v3 | 1/1 | - | - | lags -17 ms; extra none |
