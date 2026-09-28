| ruler | source | value | target | pass | note |
|---|---|---|---|---|---|
| tempo +-1 BPM (bpm) | v3 | 78.8 % of frames | - | - | median 139.98 vs truth 139.66; off 21 % |
| beatPhase lag (continuous) | v3 | med -21 ms, /lag/ p50 25 p90 50 ms | - | - | 64 % of in-octave frames within +-30 ms (n=10518) |
| beatPhase jitter (bias removed) | v3 | /dev/ p50 10 p90 67 ms | - | - | 81 % within +-30 ms of its own median |
| beat events F +-50 ms | v3 | 0.876 (P 0.876 R 0.876) | - | - | tp 454 miss 64 extra 64; lag med -14 p90 31 ms |
| beatPhase first 4 s locked | v3 | 6.1 s | - | - | >= 90 % of frames within +-30 ms |
| tempo +-1 BPM (bpmSyn) | synapse | 34.3 % of frames | - | - | median 140.33 vs truth 139.66; x0.5 2 %, off 64 % |
| beatSyn lag (continuous) | synapse | med -11 ms, /lag/ p50 34 p90 127 ms | - | - | 46 % of in-octave frames within +-30 ms (n=4575) |
| beatSyn jitter (bias removed) | synapse | /dev/ p50 34 p90 135 ms | - | - | 47 % within +-30 ms of its own median |
| beatSyn first 4 s locked | synapse | 69.5 s | - | - | >= 90 % within +-30 ms |
| bar line (barPos) | synapse | 34.0 % of in-octave frames on the truth downbeat | - | - | engine bar 1 is truth beat +1 8 %, +2 45 %, +3 13 % |
| barConf when right / wrong | synapse | 0.13 / 0.14 | - | - | median; a useful confidence separates these |
| 16-beat line at drops | synapse | 0 of 1 within 1 beat | - | - | 148.3:-6.0b |
| 16-beat line at section starts | synapse | 2 of 14 within 1 beat | - | - | 14.6:+6.4b 26.6:+4.2b 54.0:+4.0b 67.7:+4.1b 81.4:+7.0b 95.2:+0.1b 108.9:+0.1b 124.3:+1.3b 138.0:+1.7b 150.0:-1.9b 163.7:-1.8b 179.2:+1.6b 191.1:-2.4b 206.6:+1.7b |
| dropExpectedIn / dropConf before drops | synapse | 1 drops | - | - | 148.3[16b:-/0.00 8b:-/0.00 4b:-/0.00 1b:-/0.00] |
| dropEvt within 2 beats | v3 | 0/1 | - | - | lags - ms; extra 12.0 18.8 25.7 |
