| ruler | source | value | target | pass | note |
|---|---|---|---|---|---|
| tempo +-1 BPM (bpm) | v3 | 99.2 % of frames | - | - | median 159.99 vs truth 160.00; off 1 % |
| beatPhase lag (continuous) | v3 | med +86 ms, /lag/ p50 93 p90 144 ms | - | - | 15 % of in-octave frames within +-30 ms (n=10695) |
| beatPhase jitter (bias removed) | v3 | /dev/ p50 50 p90 144 ms | - | - | 32 % within +-30 ms of its own median |
| beat events F +-50 ms | v3 | 0.262 (P 0.262 R 0.262) | - | - | tp 125 miss 353 extra 352; lag med +31 p90 44 ms |
| beatPhase first 4 s locked | v3 | 44.0 s | - | - | >= 90 % of frames within +-30 ms |
| tempo +-1 BPM (bpmSyn) | synapse | 98.2 % of frames | - | - | median 160.23 vs truth 160.00; off 2 % |
| beatSyn lag (continuous) | synapse | med -47 ms, /lag/ p50 52 p90 136 ms | - | - | 37 % of in-octave frames within +-30 ms (n=10578) |
| beatSyn jitter (bias removed) | synapse | /dev/ p50 46 p90 93 ms | - | - | 32 % within +-30 ms of its own median |
| beatSyn first 4 s locked | synapse | 45.8 s | - | - | >= 90 % within +-30 ms |
| bar line (barPos) | synapse | 0.0 % of in-octave frames on the truth downbeat | - | - | engine bar 1 is truth beat +1 54 %, +2 0 %, +3 46 % |
| barConf when right / wrong | synapse | nan / 0.28 | - | - | median; a useful confidence separates these |
| 16-beat line at section starts | synapse | 1 of 9 within 1 beat | - | - | 12.1:-1.0b 34.6:-4.9b 48.1:+3.0b 82.6:-0.8b 108.1:+5.0b 118.6:+1.4b 132.1:+5.0b 144.1:+5.0b 168.1:-2.7b |
