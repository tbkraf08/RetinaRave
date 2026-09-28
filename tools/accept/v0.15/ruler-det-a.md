| ruler | source | value | target | pass | note |
|---|---|---|---|---|---|
| kick lag first-frame | new | med +18 p90 +24 max +27 ms | med<=15 p90<=30 max<=45 | FAIL | n=115 |
| kick lag placed | new | med +9 p90 +16 max 25 ms | /med/<=15 | pass | n=115 |
| kick F +-30ms | new | 0.525 (P 0.550 R 0.502) | >= 0.90 | FAIL | tp 115 miss 114 extra 94 |
| snare lag first-frame | new | med +15 p90 +22 max +28 ms | med<=15 p90<=30 max<=45 | pass | n=268 |
| snare lag placed | new | med +5 p90 +12 max 30 ms | /med/<=15 | pass | n=268 |
| snare F +-30ms | new | 0.596 (P 0.522 R 0.693) | - | - | tp 268 miss 119 extra 245 |
| hat lag first-frame | new | med +11 p90 +23 max +28 ms | med<=15 p90<=30 max<=45 | pass | n=385 |
| hat lag placed | new | med +5 p90 +12 max 29 ms | /med/<=15 | pass | n=380 |
| hat F +-30ms | new | 0.729 (P 0.656 R 0.821) | - | - | tp 385 miss 84 extra 202 |
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
| kicks on bare 808s | new | 8.6 % (18/209) | <= 5 % | FAIL |  |
| sub pitch +-30 cents | new | 72.7 % of 4532 sub-loud frames | >= 90 % | FAIL | med /c/ 8.4, octave errors 0.6 % |
| sub pitch +-30 cents | old | absent | - | - | v3 has no sub pitch: pcOf bins are 5.4-5.9 Hz, a semitone at C#1 is 2 Hz |
| slides detected | new | 32 of 41 truth (107 extra) | >= 50 % matched, sign right >= 90 % | pass | sign right 31/32, median span 0.100 s (truth median 0.150 s) |
| slides detected | old | absent | - | - | nothing in v0.14 measures a glide |
| drops | new | 2/2 at 57.617 105.600 | exact +-1 frame, none elsewhere | pass | extra none; max /lag/ 11 ms |
| drops | old | 2/2 at 57.600 105.600 | exact +-1 frame, none elsewhere | pass | extra none; max /lag/ 6 ms |
| boundaries +-1 beat | new | 7 of 11 within 0.400 s | all | FAIL | 10 extra; 13.00-0.38b 44.90-0.17b 49.90-0.67b 57.60+0.04b 96.00+0.00b 105.70-0.25b 134.50-0.29b |
| boundaries +-1 beat | old | 0 of 11 within 0.400 s | all | FAIL | 6 extra;  |
| returns labelled | new | 4 of 5 | all | FAIL | 7 distinct section labels seen |
| returns labelled | old | sectionAlt only (no return flag) | - | - | synapse names a section 4-8 beats after its boundary (DECISIONS §10) |
| tonic | new | C# minor | C# minor | pass | first right at 0.7 s |
| tonic | old key | G# | C# | FAIL | synapse key chroma starts at 65 Hz (anatomy.js:106): the 35 Hz root is invisible |
