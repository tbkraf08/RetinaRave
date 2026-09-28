| ruler | source | value | target | note |
|---|---|---|---|---|
| kick lag | pred | med -5.2 p90 +7.6 ms | /med/<=10 | n=22 |
| kick before the audio | pred | 0 % (not late: 91 %) | - | release < truth + leadT |
| kick F +-30ms | pred | 0.667 (P 0.759 R 0.595) | - | tp 22 miss 15 extra 7 |
| kick lag | pred conf>=0.5 | med -9.0 p90 +5.7 ms | /med/<=10 | n=11 |
| kick before the audio | pred conf>=0.5 | 0 % (not late: 91 %) | - | release < truth + leadT |
| kick F +-30ms | pred conf>=0.5 | 0.415 (P 0.688 R 0.297) | - | tp 11 miss 26 extra 5 |
| kick first bar after a change | pred | 0 released, 0 false (P 0.00) | - | elsewhere P 0.76 (29 released) |
| kick lag | reactive | med +4.7 p90 +7.7 ms | - | n=32 |
| kick before the audio | reactive | 0 % (not late: 91 %) | - | release < truth + leadT |
| kick F +-30ms | reactive | 0.800 (P 0.744 R 0.865) | - | tp 32 miss 5 extra 11 |
| snare lag | pred | med +1.0 p90 +6.0 ms | /med/<=10 | n=27 |
| snare before the audio | pred | 0 % (not late: 96 %) | - | release < truth + leadT |
| snare F +-30ms | pred | 0.643 (P 0.771 R 0.551) | - | tp 27 miss 22 extra 8 |
| snare lag | pred conf>=0.5 | med +0.0 p90 +5.8 ms | /med/<=10 | n=13 |
| snare before the audio | pred conf>=0.5 | 0 % (not late: 100 %) | - | release < truth + leadT |
| snare F +-30ms | pred conf>=0.5 | 0.394 (P 0.765 R 0.265) | - | tp 13 miss 36 extra 4 |
| snare first bar after a change | pred | 0 released, 0 false (P 0.00) | - | elsewhere P 0.77 (35 released) |
| snare lag | reactive | med +1.0 p90 +5.9 ms | - | n=42 |
| snare before the audio | reactive | 0 % (not late: 98 %) | - | release < truth + leadT |
| snare F +-30ms | reactive | 0.737 (P 0.646 R 0.857) | - | tp 42 miss 7 extra 23 |
| hat lag | pred | med +3.0 p90 +10.0 ms | /med/<=10 | n=21 |
| hat before the audio | pred | 0 % (not late: 86 %) | - | release < truth + leadT |
| hat F +-30ms | pred | 0.545 (P 0.636 R 0.477) | - | tp 21 miss 23 extra 12 |
| hat lag | pred conf>=0.5 | med +2.0 p90 +7.0 ms | /med/<=10 | n=11 |
| hat before the audio | pred conf>=0.5 | 0 % (not late: 91 %) | - | release < truth + leadT |
| hat F +-30ms | pred conf>=0.5 | 0.367 (P 0.688 R 0.250) | - | tp 11 miss 33 extra 5 |
| hat first bar after a change | pred | 0 released, 0 false (P 0.00) | - | elsewhere P 0.64 (33 released) |
| hat lag | reactive | med +2.0 p90 +8.1 ms | - | n=40 |
| hat before the audio | reactive | 0 % (not late: 90 %) | - | release < truth + leadT |
| hat F +-30ms | reactive | 0.690 (P 0.556 R 0.909) | - | tp 40 miss 4 extra 32 |
| section start | barNovelEvt | 0/1 | - | per ref: - · false 9 |
| section start | boundaryEvt | absent |  |  |
| return | barReturnEvt | 0/0 | - | per ref:  · false 5 |
