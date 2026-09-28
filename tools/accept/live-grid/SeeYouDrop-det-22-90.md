| ruler | source | value | target | pass | note |
|---|---|---|---|---|---|
| tempo +-1 BPM (bpm) | v3 | 100.0 % of frames | - | - | median 150.01 vs truth 150.04; no octave errors |
| beatPhase lag (continuous) | v3 | med -50 ms, /lag/ p50 50 p90 65 ms | - | - | 6 % of in-octave frames within +-30 ms (n=4080) |
| beatPhase jitter (bias removed) | v3 | /dev/ p50 7 p90 16 ms | - | - | 94 % within +-30 ms of its own median |
| beat events F +-50 ms | v3 | 0.628 (P 0.626 R 0.629) | - | - | tp 107 miss 63 extra 64; lag med -36 p90 45 ms |
| beatPhase first 4 s locked | v3 | never | - | - | >= 90 % of frames within +-30 ms |
| tempo +-1 BPM (bpmSyn) | synapse | 87.7 % of frames | - | - | median 149.58 vs truth 150.04; x0.5 1 %, off 11 % |
| beatSyn lag (continuous) | synapse | med -40 ms, /lag/ p50 41 p90 60 ms | - | - | 16 % of in-octave frames within +-30 ms (n=3579) |
| beatSyn jitter (bias removed) | synapse | /dev/ p50 9 p90 25 ms | - | - | 93 % within +-30 ms of its own median |
| beatSyn first 4 s locked | synapse | 85.0 s | - | - | >= 90 % within +-30 ms |
| bar line (barPos) | synapse | 90.4 % of in-octave frames on the truth downbeat | - | - | engine bar 1 is truth beat +1 6 %, +2 1 %, +3 2 % |
| barConf when right / wrong | synapse | 1.00 / 0.00 | - | - | median; a useful confidence separates these |
| 16-beat line at drops | synapse | 0 of 1 within 1 beat | - | - | 57.6:+4.2b |
| 16-beat line at section starts | synapse | 1 of 5 within 1 beat | - | - | 25.6:+2.9b 44.8:+0.1b 49.6:-3.9b 57.6:+4.2b 89.6:+6.5b |
| dropExpectedIn / dropConf before drops | synapse | 1 drops | - | - | 57.6[16b:-/0.00 8b:-/0.00 4b:-/0.00 1b:12.9/0.01] |
| dropEvt within 2 beats | v3 | 1/1 | - | - | lags -6 ms; extra none |
