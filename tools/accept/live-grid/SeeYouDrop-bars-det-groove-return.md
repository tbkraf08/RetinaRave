| ruler | source | value | target | note |
|---|---|---|---|---|
| kick lag | pred | med -13.0 p90 -6.3 ms | /med/<=10 | n=9 |
| kick before the audio | pred | 0 % (not late: 100 %) | - | release < truth + leadT |
| kick F +-30ms | pred | 0.643 (P 0.562 R 0.750) | - | tp 9 miss 3 extra 7 |
| kick lag | pred conf>=0.5 | med -12.5 p90 -10.0 ms | /med/<=10 | n=6 |
| kick before the audio | pred conf>=0.5 | 0 % (not late: 100 %) | - | release < truth + leadT |
| kick F +-30ms | pred conf>=0.5 | 0.522 (P 0.545 R 0.500) | - | tp 6 miss 6 extra 5 |
| kick first bar after a change | pred | 4 released, 2 false (P 0.50) | - | elsewhere P 0.58 (12 released) |
| kick lag | reactive | med +3.7 p90 +6.3 ms | - | n=8 |
| kick before the audio | reactive | 0 % (not late: 100 %) | - | release < truth + leadT |
| kick F +-30ms | reactive | 0.593 (P 0.533 R 0.667) | - | tp 8 miss 4 extra 7 |
| snare lag | pred | med -0.5 p90 +4.7 ms | /med/<=10 | n=14 |
| snare before the audio | pred | 0 % (not late: 100 %) | - | release < truth + leadT |
| snare F +-30ms | pred | 0.824 (P 0.824 R 0.824) | - | tp 14 miss 3 extra 3 |
| snare lag | pred conf>=0.5 | med +0.5 p90 +4.2 ms | /med/<=10 | n=10 |
| snare before the audio | pred conf>=0.5 | 0 % (not late: 100 %) | - | release < truth + leadT |
| snare F +-30ms | pred conf>=0.5 | 0.714 (P 0.909 R 0.588) | - | tp 10 miss 7 extra 1 |
| snare first bar after a change | pred | 4 released, 0 false (P 1.00) | - | elsewhere P 0.85 (13 released) |
| snare lag | reactive | med -1.0 p90 +3.7 ms | - | n=14 |
| snare before the audio | reactive | 0 % (not late: 100 %) | - | release < truth + leadT |
| snare F +-30ms | reactive | 0.718 (P 0.636 R 0.824) | - | tp 14 miss 3 extra 8 |
| hat lag | pred | med +5.0 p90 +9.8 ms | /med/<=10 | n=13 |
| hat before the audio | pred | 0 % (not late: 77 %) | - | release < truth + leadT |
| hat F +-30ms | pred | 0.684 (P 0.591 R 0.812) | - | tp 13 miss 3 extra 9 |
| hat lag | pred conf>=0.5 | med +5.0 p90 +8.8 ms | /med/<=10 | n=7 |
| hat before the audio | pred conf>=0.5 | 0 % (not late: 86 %) | - | release < truth + leadT |
| hat F +-30ms | pred conf>=0.5 | 0.500 (P 0.583 R 0.438) | - | tp 7 miss 9 extra 5 |
| hat first bar after a change | pred | 5 released, 2 false (P 0.60) | - | elsewhere P 0.65 (17 released) |
| hat lag | reactive | med +1.5 p90 +7.5 ms | - | n=16 |
| hat before the audio | reactive | 0 % (not late: 94 %) | - | release < truth + leadT |
| hat F +-30ms | reactive | 0.744 (P 0.593 R 1.000) | - | tp 16 miss 0 extra 11 |
| section start | barNovelEvt | 0/1 | - | per ref: - · false 9 |
| section start | boundaryEvt | absent |  |  |
| return | barReturnEvt | 0/1 | - | per ref: - · false 5 |
