| ruler | source | value | target | pass | note |
|---|---|---|---|---|---|
| tempo +-1 BPM (bpm) | v3 | 99.2 % of frames | - | - | median 116.93 vs truth 116.98; off 1 % |
| beatPhase lag (continuous) | v3 | med -40 ms, /lag/ p50 41 p90 60 ms | - | - | 21 % of in-octave frames within +-30 ms (n=15238) |
| beatPhase jitter (bias removed) | v3 | /dev/ p50 11 p90 24 ms | - | - | 94 % within +-30 ms of its own median |
| beat events F +-50 ms | v3 | 0.839 (P 0.838 R 0.839) | - | - | tp 418 miss 80 extra 81; lag med -31 p90 46 ms |
| beatPhase first 4 s locked | v3 | 7.3 s | - | - | >= 90 % of frames within +-30 ms |
| tempo +-1 BPM (bpmSyn) | synapse | 98.7 % of frames | - | - | median 116.93 vs truth 116.98; off 1 % |
| beatSyn lag (continuous) | synapse | med -41 ms, /lag/ p50 52 p90 202 ms | - | - | 10 % of in-octave frames within +-30 ms (n=15152) |
| beatSyn jitter (bias removed) | synapse | /dev/ p50 15 p90 235 ms | - | - | 69 % within +-30 ms of its own median |
| beatSyn first 4 s locked | synapse | never | - | - | >= 90 % within +-30 ms |
| bar line (barPos) | synapse | 32.6 % of in-octave frames on the truth downbeat | - | - | engine bar 1 is truth beat +1 3 %, +2 0 %, +3 65 % |
| barConf when right / wrong | synapse | 0.34 / 0.35 | - | - | median; a useful confidence separates these |
| 16-beat line at drops | synapse | 3 of 3 within 1 beat | - | - | 57.5:+0.1b 131.4:+0.1b 188.8:+0.1b |
| 16-beat line at section starts | synapse | 5 of 16 within 1 beat | - | - | 28.8:+3.1b 32.9:-4.9b 37.0:+3.1b 47.2:+7.1b 57.5:+0.1b 86.2:+7.1b 102.6:+7.0b 108.8:+3.1b 123.1:-0.9b 131.4:+0.1b 160.1:+7.1b 166.2:+3.1b 180.6:-0.9b 188.8:+0.1b 233.9:+7.2b 240.1:+3.1b |
| dropExpectedIn / dropConf before drops | synapse | 3 drops | - | - | 57.5[16b:-/0.00 8b:-/0.00 4b:-/0.00 1b:-/0.00]; 131.4[16b:-/0.00 8b:-/0.00 4b:-/0.00 1b:-/0.00]; 188.8[16b:-/0.00 8b:-/0.00 4b:-/0.00 1b:-/0.00] |
| dropEvt within 2 beats | v3 | 0/3 | - | - | lags - ms; extra none |
