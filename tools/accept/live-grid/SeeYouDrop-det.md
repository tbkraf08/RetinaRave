| ruler | source | value | target | pass | note |
|---|---|---|---|---|---|
| tempo +-1 BPM (bpm) | v3 | 95.5 % of frames | - | - | median 150.00 vs truth 150.04; off 5 % |
| beatPhase lag (continuous) | v3 | med -47 ms, /lag/ p50 47 p90 65 ms | - | - | 8 % of in-octave frames within +-30 ms (n=9001) |
| beatPhase jitter (bias removed) | v3 | /dev/ p50 8 p90 32 ms | - | - | 89 % within +-30 ms of its own median |
| beat events F +-50 ms | v3 | 0.743 (P 0.746 R 0.740) | - | - | tp 290 miss 102 extra 99; lag med -36 p90 47 ms |
| beatPhase first 4 s locked | v3 | never | - | - | >= 90 % of frames within +-30 ms |
| tempo +-1 BPM (bpmSyn) | synapse | 61.6 % of frames | - | - | median 149.58 vs truth 150.04; x0.5 14 %, off 24 % |
| beatSyn lag (continuous) | synapse | med -43 ms, /lag/ p50 45 p90 66 ms | - | - | 16 % of in-octave frames within +-30 ms (n=5805) |
| beatSyn jitter (bias removed) | synapse | /dev/ p50 10 p90 38 ms | - | - | 88 % within +-30 ms of its own median |
| beatSyn first 4 s locked | synapse | 85.0 s | - | - | >= 90 % within +-30 ms |
| bar line (barPos) | synapse | 58.7 % of in-octave frames on the truth downbeat | - | - | engine bar 1 is truth beat +1 16 %, +2 21 %, +3 4 % |
| barConf when right / wrong | synapse | 0.99 / 0.22 | - | - | median; a useful confidence separates these |
| 16-beat line at drops | synapse | 0 of 2 within 1 beat | - | - | 57.6:+4.2b 105.6:+1.8b |
| 16-beat line at section starts | synapse | 1 of 10 within 1 beat | - | - | 12.8:-4.0b 25.6:+2.9b 44.8:+0.1b 49.6:-3.9b 57.6:+4.2b 89.6:+6.5b 96.0:+7.5b 105.6:+1.8b 131.2:+2.2b 134.4:-5.8b |
| dropExpectedIn / dropConf before drops | synapse | 2 drops | - | - | 57.6[16b:-/0.00 8b:-/0.00 4b:-/0.00 1b:12.9/0.01]; 105.6[16b:-/0.00 8b:-/0.00 4b:-/0.00 1b:-/0.00] |
| dropEvt within 2 beats | v3 | 2/2 | - | - | lags -6 +4 ms; extra none |
