| ruler | source | value | target | pass | note |
|---|---|---|---|---|---|
| tempo +-1 BPM (bpm) | v3 | 100.0 % of frames | - | - | median 149.99 vs truth 150.04; no octave errors |
| beatPhase lag (continuous) | v3 | med -54 ms, /lag/ p50 54 p90 71 ms | - | - | 3 % of in-octave frames within +-30 ms (n=3969) |
| beatPhase jitter (bias removed) | v3 | /dev/ p50 9 p90 20 ms | - | - | 96 % within +-30 ms of its own median |
| beat events F +-50 ms | v3 | 0.598 (P 0.596 R 0.600) | - | - | tp 102 miss 68 extra 69; lag med -38 p90 48 ms |
| beatPhase first 4 s locked | v3 | never | - | - | >= 90 % of frames within +-30 ms |
| tempo +-1 BPM (bpmSyn) | synapse | 86.6 % of frames | - | - | median 149.58 vs truth 150.04; off 13 % |
| beatSyn lag (continuous) | synapse | med -52 ms, /lag/ p50 52 p90 71 ms | - | - | 1 % of in-octave frames within +-30 ms (n=3437) |
| beatSyn jitter (bias removed) | synapse | /dev/ p50 6 p90 20 ms | - | - | 96 % within +-30 ms of its own median |
| beatSyn first 4 s locked | synapse | never | - | - | >= 90 % within +-30 ms |
| bar line (barPos) | synapse | 83.7 % of in-octave frames on the truth downbeat | - | - | engine bar 1 is truth beat +1 0 %, +2 11 %, +3 6 % |
| barConf when right / wrong | synapse | 0.59 / 0.00 | - | - | median; a useful confidence separates these |
| 16-beat line at drops | synapse | 0 of 1 within 1 beat | - | - | 57.6:+3.2b |
| 16-beat line at section starts | synapse | 2 of 5 within 1 beat | - | - | 25.6:+6.1b 44.8:+0.1b 49.6:-3.9b 57.6:+3.2b 89.6:+0.1b |
| dropExpectedIn / dropConf before drops | synapse | 1 drops | - | - | 57.6[16b:-/0.00 8b:-/0.00 4b:-/0.00 1b:13.9/0.08] |
| dropEvt within 2 beats | v3 | 1/1 | - | - | lags -15 ms; extra none |
