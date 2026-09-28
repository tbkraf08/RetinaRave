| ruler | source | value | target | pass | note |
|---|---|---|---|---|---|
| tempo +-1 BPM (bpm) | v3 | 100.0 % of frames | - | - | median 150.00 vs truth 150.04; no octave errors |
| beatPhase lag (continuous) | v3 | med -20 ms, /lag/ p50 20 p90 31 ms | - | - | 85 % of in-octave frames within +-30 ms (n=4080) |
| beatPhase jitter (bias removed) | v3 | /dev/ p50 7 p90 12 ms | - | - | 99 % within +-30 ms of its own median |
| beat events F +-50 ms | v3 | 1.000 (P 1.000 R 1.000) | - | - | tp 169 miss 0 extra 0; lag med -12 p90 30 ms |
| beatPhase first 4 s locked | v3 | 23.8 s | - | - | >= 90 % of frames within +-30 ms |
| tempo +-1 BPM (bpmSyn) | synapse | 86.6 % of frames | - | - | median 149.58 vs truth 150.04; x0.67 10 %, off 3 % |
| beatSyn lag (continuous) | synapse | med -6 ms, /lag/ p50 9 p90 27 ms | - | - | 93 % of in-octave frames within +-30 ms (n=3535) |
| beatSyn jitter (bias removed) | synapse | /dev/ p50 6 p90 24 ms | - | - | 94 % within +-30 ms of its own median |
| beatSyn first 4 s locked | synapse | 33.9 s | - | - | >= 90 % within +-30 ms |
| bar line (barPos) | synapse | 87.6 % of in-octave frames on the truth downbeat | - | - | engine bar 1 is truth beat +1 6 %, +2 4 %, +3 2 % |
| barConf when right / wrong | synapse | 0.74 / 0.00 | - | - | median; a useful confidence separates these |
| 16-beat line at drops | synapse | 0 of 1 within 1 beat | - | - | 57.6:+4.1b |
| 16-beat line at section starts | synapse | 2 of 5 within 1 beat | - | - | 25.6:+1.2b 44.8:+0.0b 49.6:-4.0b 57.6:+4.1b 89.6:+0.0b |
| dropExpectedIn / dropConf before drops | synapse | 1 drops | - | - | 57.6[16b:-/0.00 8b:-/0.00 4b:-/0.00 1b:12.9/0.08] |
| dropEvt within 2 beats | v3 | 1/1 | - | - | lags -10 ms; extra none |
