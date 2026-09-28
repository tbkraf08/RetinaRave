| ruler | source | value | target | note |
|---|---|---|---|---|
| kick lag | pred | med -6.0 p90 +7.1 ms | /med/<=10 | n=10 |
| kick before the audio | pred | 0 % (not late: 100 %) | - | release < truth + leadT |
| kick F +-30ms | pred | 0.260 (P 0.370 R 0.200) | - | tp 10 miss 40 extra 17 |
| kick lag | pred conf>=0.5 | med -3.5 p90 +5.0 ms | /med/<=10 | n=4 |
| kick before the audio | pred conf>=0.5 | 0 % (not late: 100 %) | - | release < truth + leadT |
| kick F +-30ms | pred conf>=0.5 | 0.133 (P 0.400 R 0.080) | - | tp 4 miss 46 extra 6 |
| kick first bar after a change | pred | 0 released, 0 false (P 0.00) | - | elsewhere P 0.37 (27 released) |
| kick lag | reactive | med +1.8 p90 +7.4 ms | - | n=10 |
| kick before the audio | reactive | 0 % (not late: 90 %) | - | release < truth + leadT |
| kick F +-30ms | reactive | 0.270 (P 0.417 R 0.200) | - | tp 10 miss 40 extra 14 |
| snare lag | pred | med +1.5 p90 +8.0 ms | /med/<=10 | n=32 |
| snare before the audio | pred | 0 % (not late: 91 %) | - | release < truth + leadT |
| snare F +-30ms | pred | 0.464 (P 0.667 R 0.356) | - | tp 32 miss 58 extra 16 |
| snare lag | pred conf>=0.5 | med +2.5 p90 +4.3 ms | /med/<=10 | n=8 |
| snare before the audio | pred conf>=0.5 | 0 % (not late: 100 %) | - | release < truth + leadT |
| snare F +-30ms | pred conf>=0.5 | 0.155 (P 0.615 R 0.089) | - | tp 8 miss 82 extra 5 |
| snare first bar after a change | pred | 0 released, 0 false (P 0.00) | - | elsewhere P 0.67 (48 released) |
| snare lag | reactive | med +1.0 p90 +7.8 ms | - | n=56 |
| snare before the audio | reactive | 0 % (not late: 95 %) | - | release < truth + leadT |
| snare F +-30ms | reactive | 0.644 (P 0.667 R 0.622) | - | tp 56 miss 34 extra 28 |
| hat lag | pred | med +1.5 p90 +9.0 ms | /med/<=10 | n=48 |
| hat before the audio | pred | 0 % (not late: 88 %) | - | release < truth + leadT |
| hat F +-30ms | pred | 0.542 (P 0.828 R 0.403) | - | tp 48 miss 71 extra 10 |
| hat lag | pred conf>=0.5 | med +2.0 p90 +5.0 ms | /med/<=10 | n=11 |
| hat before the audio | pred conf>=0.5 | 0 % (not late: 91 %) | - | release < truth + leadT |
| hat F +-30ms | pred conf>=0.5 | 0.167 (P 0.846 R 0.092) | - | tp 11 miss 108 extra 2 |
| hat first bar after a change | pred | 0 released, 0 false (P 0.00) | - | elsewhere P 0.83 (58 released) |
| hat lag | reactive | med +1.0 p90 +7.0 ms | - | n=97 |
| hat before the audio | reactive | 0 % (not late: 93 %) | - | release < truth + leadT |
| hat F +-30ms | reactive | 0.843 (P 0.874 R 0.815) | - | tp 97 miss 22 extra 14 |
| section start | barNovelEvt | 0/1 | - | per ref: - · false 9 |
| section start | boundaryEvt | absent |  |  |
| return | barReturnEvt | 0/0 | - | per ref:  · false 5 |
