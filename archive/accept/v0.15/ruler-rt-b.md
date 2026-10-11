| ruler | source | value | target | pass | note |
|---|---|---|---|---|---|
| kick lag first-frame | new | med +1 p90 +6 max +8 ms | med<=15 p90<=30 max<=45 | pass | n=77 |
| kick lag placed | new | med +0 p90 +0 max 1 ms | /med/<=15 | pass | n=77 |
| kick F +-30ms | new | 0.994 (P 0.987 R 1.000) | >= 0.90 | pass | tp 77 miss 0 extra 1 |
| snare lag first-frame | new | med +0 p90 +6 max +10 ms | med<=15 p90<=30 max<=45 | pass | n=115 |
| snare lag placed | new | med +0 p90 +0 max 1 ms | /med/<=15 | pass | n=115 |
| snare F +-30ms | new | 0.996 (P 0.991 R 1.000) | - | - | tp 115 miss 0 extra 1 |
| hat lag first-frame | new | med +2 p90 +7 max +10 ms | med<=15 p90<=30 max<=45 | pass | n=118 |
| hat lag placed | new | med +0 p90 +0 max 1 ms | /med/<=15 | pass | n=118 |
| hat F +-30ms | new | 1.000 (P 1.000 R 1.000) | - | - | tp 118 miss 0 extra 0 |
| kick lag first-frame | old kick | med -10 p90 -5 max +30 ms | med<=15 p90<=30 max<=45 | pass | n=22 |
| kick lag placed | old kick | absent (no age column) | - | - |  |
| kick F +-30ms | old kick | 0.190 (P 0.142 R 0.286) | >= 0.90 | FAIL | tp 22 miss 55 extra 133 |
| snare lag first-frame | old snare | med -16 p90 -9 max +29 ms | med<=15 p90<=30 max<=45 | FAIL | n=66 |
| snare lag placed | old snare | absent (no age column) | - | - |  |
| snare F +-30ms | old snare | 0.706 (P 0.917 R 0.574) | - | - | tp 66 miss 49 extra 6 |
| hat lag first-frame | old hat | med -13 p90 -6 max +12 ms | med<=15 p90<=30 max<=45 | pass | n=84 |
| hat lag placed | old hat | absent (no age column) | - | - |  |
| hat F +-30ms | old hat | 0.727 (P 0.743 R 0.712) | - | - | tp 84 miss 34 extra 29 |
| onset(any) lag first-frame | old onset | med -13 p90 -7 max +7 ms | med<=15 p90<=30 max<=45 | pass | n=122 |
| onset(any) lag placed | old onset | absent (no age column) | - | - |  |
| onset(any) F +-30ms | old onset | 0.540 (P 0.859 R 0.394) | - | - | tp 122 miss 188 extra 20 |
| kicks on bare 808s | new | 0.0 % (0/78) | <= 5 % | pass |  |
| sub pitch +-30 cents | new | 99.8 % of 1060 sub-loud frames | >= 90 % | pass | med /c/ 1.0, octave errors 0.0 % |
| sub pitch +-30 cents | old | absent | - | - | v3 has no sub pitch: pcOf bins are 5.4-5.9 Hz, a semitone at C#1 is 2 Hz |
| slides detected | new | 10 of 13 truth (1 extra) | >= 50 % matched, sign right >= 90 % | pass | sign right 10/10, median span 0.100 s (truth median 0.130 s) |
| slides detected | old | absent | - | - | nothing in v0.14 measures a glide |
| drops | new | 1/1 at 57.612 | exact +-1 frame, none elsewhere | pass | extra none; max /lag/ 6 ms |
| drops | old | 1/1 at 57.596 | exact +-1 frame, none elsewhere | pass | extra none; max /lag/ 10 ms |
| boundaries +-1 beat | new | 4 of 4 within 0.400 s | all | pass | 1 extra; 25.61+0.06b 44.81+0.06b 49.61+0.06b 57.61+0.02b |
| boundaries +-1 beat | old | 0 of 4 within 0.400 s | all | FAIL | 2 extra;  |
| returns labelled | new | 0 of 5 | all | FAIL | 5 distinct section labels seen |
| returns labelled | old | sectionAlt only (no return flag) | - | - | synapse names a section 4-8 beats after its boundary (DECISIONS §10) |
| tonic | new | D major | C# minor | FAIL | first right at 26.5 s |
| tonic | old key | G# | C# | FAIL | synapse key chroma starts at 65 Hz (anatomy.js:106): the 35 Hz root is invisible |
