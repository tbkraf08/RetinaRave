| ruler | source | value | target | pass | note |
|---|---|---|---|---|---|
| kick lag first-frame | new | med +2 p90 +7 max +8 ms | med<=15 p90<=30 max<=45 | pass | n=229 |
| kick lag placed | new | med +0 p90 +0 max 1 ms | /med/<=15 | pass | n=229 |
| kick F +-30ms | new | 1.000 (P 1.000 R 1.000) | >= 0.90 | pass | tp 229 miss 0 extra 0 |
| snare lag first-frame | new | med +0 p90 +6 max +8 ms | med<=15 p90<=30 max<=45 | pass | n=387 |
| snare lag placed | new | med +0 p90 +0 max 1 ms | /med/<=15 | pass | n=387 |
| snare F +-30ms | new | 1.000 (P 1.000 R 1.000) | - | - | tp 387 miss 0 extra 0 |
| hat lag first-frame | new | med +1 p90 +7 max +8 ms | med<=15 p90<=30 max<=45 | pass | n=468 |
| hat lag placed | new | med +0 p90 +0 max 1 ms | /med/<=15 | pass | n=468 |
| hat F +-30ms | new | 0.999 (P 1.000 R 0.998) | - | - | tp 468 miss 1 extra 0 |
| kick lag first-frame | old kick | med -10 p90 +2 max +30 ms | med<=15 p90<=30 max<=45 | pass | n=91 |
| kick lag placed | old kick | absent (no age column) | - | - |  |
| kick F +-30ms | old kick | 0.188 (P 0.123 R 0.397) | >= 0.90 | FAIL | tp 91 miss 138 extra 650 |
| snare lag first-frame | old snare | med -12 p90 +2 max +8 ms | med<=15 p90<=30 max<=45 | pass | n=186 |
| snare lag placed | old snare | absent (no age column) | - | - |  |
| snare F +-30ms | old snare | 0.627 (P 0.903 R 0.481) | - | - | tp 186 miss 201 extra 20 |
| hat lag first-frame | old hat | med -11 p90 +1 max +26 ms | med<=15 p90<=30 max<=45 | pass | n=327 |
| hat lag placed | old hat | absent (no age column) | - | - |  |
| hat F +-30ms | old hat | 0.753 (P 0.818 R 0.697) | - | - | tp 327 miss 142 extra 73 |
| onset(any) lag first-frame | old onset | med -13 p90 -6 max +27 ms | med<=15 p90<=30 max<=45 | pass | n=404 |
| onset(any) lag placed | old onset | absent (no age column) | - | - |  |
| onset(any) F +-30ms | old onset | 0.509 (P 0.803 R 0.372) | - | - | tp 404 miss 681 extra 99 |
| kicks on bare 808s | new | 0.0 % (0/229) | <= 5 % | pass |  |
| sub pitch +-30 cents | new | 100.0 % of 4531 sub-loud frames | >= 90 % | pass | med /c/ 1.0, octave errors 0.0 % |
| sub pitch +-30 cents | old | absent | - | - | v3 has no sub pitch: pcOf bins are 5.4-5.9 Hz, a semitone at C#1 is 2 Hz |
| slides detected | new | 24 of 41 truth (14 extra) | >= 50 % matched, sign right >= 90 % | pass | sign right 24/24, median span 0.150 s (truth median 0.150 s) |
| slides detected | old | absent | - | - | nothing in v0.14 measures a glide |
| drops | new | 2/2 at 57.617 105.600 | exact +-1 frame, none elsewhere | pass | extra none; max /lag/ 11 ms |
| drops | old | 2/2 at 57.600 105.600 | exact +-1 frame, none elsewhere | pass | extra none; max /lag/ 6 ms |
| boundaries +-1 beat | new | 9 of 10 within 0.400 s | all | FAIL | 3 extra; 12.81+0.05b 25.61+0.05b 44.81+0.02b 49.61+0.02b 57.61+0.03b 89.60+0.00b 96.00+0.01b 105.60+0.01b |
| boundaries +-1 beat | old | 0 of 10 within 0.400 s | all | FAIL | 6 extra;  |
| returns labelled | new | 5 of 5 | all | pass | 5 distinct section labels seen |
| returns labelled | old | sectionAlt only (no return flag) | - | - | synapse names a section 4-8 beats after its boundary (DECISIONS §10) |
| tonic | new | C# minor | C# minor | pass | first right at 0.7 s |
| tonic | old key | G# | C# | FAIL | synapse key chroma starts at 65 Hz (anatomy.js:106): the 35 Hz root is invisible |
