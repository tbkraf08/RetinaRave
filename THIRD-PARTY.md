# Third-party notices

## WebGL-Fluid-Simulation — the fluid solver's lineage (assets/core/fluid/, assets/effects/feedback.js, assets/scenes/fluid/)
Re-implemented in this repo's style after Pavel Dobryakov's WebGL-Fluid-Simulation
(https://github.com/PavelDoGreat/WebGL-Fluid-Simulation). No file of that project is copied; the pass order,
the splat and the shading idea are his, and his licence is reproduced here as it asks.

MIT License

Copyright (c) 2017 Pavel Dobryakov

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions
of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

The solver's pass order follows Mark J. Harris, "Fast Fluid Dynamics Simulation on the GPU", GPU Gems ch. 38 (2004),
after Jos Stam, "Stable Fluids" (1999).

## Demucs — the vocal ground truth's labeller (tools/truth/voxtruth.py; DECISIONS §122)
The sung windows the vocal detector is measured against are proposed by Demucs's `htdemucs` vocal stem (Alexandre Défossez
et al., https://github.com/adefossez/demucs — "Hybrid Transformers for Music Source Separation", ICASSP 2023; "Music Source
Separation in the Waveform Domain", 2019), run offline on the library tracks. Nothing of Demucs is copied, bundled or served:
it runs on this machine, its stems stay in the gitignored tools/work/vox/, and only the numbers derived from them
(tools/truth/<Track>.vox.json) are committed. Its licence is reproduced here as it asks.

MIT License

Copyright (c) Meta Platforms, Inc. and affiliates.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions
of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## librosa — the pitch and level rulers of the vocal truth (tools/truth/voxtruth.py; DECISIONS §122)
The per-hop rms and the pYIN pitch track (Mauch & Dixon, "pYIN: a fundamental frequency estimator using probabilistic
threshold distributions", ICASSP 2014) over the vocal stem come from librosa (Brian McFee and the librosa development team,
https://librosa.org). Offline tooling only, never bundled or served. Its licence is reproduced here.

ISC License

Copyright (c) 2013--2023, librosa development team.

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby
granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING
ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL,
DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS,
WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE
USE OR PERFORMANCE OF THIS SOFTWARE.

## The Jamendo singing-voice corpus — the public training set of the vocal detector's step 2 (not in the repo)
Mathieu Ramona, Gaël Richard, Bertrand David, "Vocal detection in music with support vector machines", ICASSP 2008:
93 Creative-Commons-licensed pieces from jamendo.com with voice / no-voice annotations, published as "Jamendo Corpus for
Singing Voice Detection" on Zenodo (https://zenodo.org/records/2585988, CC BY 4.0). Fetched to ~/Datasets/jamendo-svd/ on
this machine only; neither the audio nor the labels are in the repo.

**What ships (DECISIONS §123, retrained §126):** `assets/engine/ears/vox-weights.js` — the 38 385 parameters of the live vocal detector
(`assets/engine/ears/vox.js` + `vox-net.js`), trained by `tools/truth/voxtrain.py` on the corpus's train + valid splits (77 of
the 93 pieces, the frame labels at the window's end; since §126 also their Demucs vocal and accompaniment stems, remixed) together
with five of this project's own library tracks and the two corpora below. The weights are a derived work of the corpus under CC BY
4.0; this notice, the header of the weights module and the credits on retinarave.com/about are the attribution. The corpus's own
README: "This is a public corpus of 93 creative-commons licensed music pieces annotated by voice (sung or spoken) and no-voice."
Nothing of the audio or the labels is reproduced in the weights or anywhere on the site.

## MusicNet — no-voice negatives of the vocal detector's second pass (DECISIONS §126; not in the repo)
John Thickstun, Zaid Harchaoui, Sham M. Kakade, "Learning Features of Music from Scratch", ICLR 2017: 330 freely-licensed
classical recordings with note labels, published on Zenodo (https://zenodo.org/records/5120004, DOI 10.5281/zenodo.5120004).
The record's licence field, verbatim: `cc-by-4.0` — Creative Commons Attribution 4.0 International. A 4.6 h subset (13 solo-piano
and 15 strings / winds recordings, by id out of `musicnet_metadata.csv`; the bytes from the HuggingFace mirror
`DreamyWanderer/MusicNet` of the same recordings, the Zenodo tarball itself streaming at 60 KB/s) sits in ~/Datasets/musicnet/ on
this machine only, with `LICENCE-NOTE.md` beside it. Used as PURE NEGATIVES — the solo piano and the string / wind lines in the
voice's range that the first weights read as a voice — and as remix beds under Jamendo's vocal stems. No audio is in the repo or
on the site; the weights are the derived work, and this notice, the weights' header and retinarave.com/about are the attribution.

## MAESTRO v3.0.0 — no-voice negatives of the vocal detector's second pass (DECISIONS §126; not in the repo)
Curtis Hawthorne, Andriy Stasyuk, Adam Roberts, Ian Simon, Cheng-Zhi Anna Huang, Sander Dieleman, Erich Elsen, Jesse Engel,
Douglas Eck, "Enabling Factorized Piano Music Modeling and Generation with the MAESTRO Dataset", ICLR 2019 (Google Magenta,
https://magenta.tensorflow.org/datasets/maestro). The archive's `LICENSE` file opens, verbatim: "Attribution-NonCommercial-ShareAlike
4.0 International"; the dataset page, verbatim: "The dataset is made available by Google LLC under a Creative Commons Attribution
Non-Commercial Share-Alike 4.0 (CC BY-NC-SA 4.0) license." A 2.3 h subset (17 solo-piano performances of the `train` split, one per
composer, pulled by HTTP range out of the 108 GB zip — never the whole archive) sits in ~/Datasets/maestro/ on this machine only,
with the archive's LICENSE and README and a `LICENCE-NOTE.md` beside it. Used as PURE NEGATIVES and as remix beds.

**The non-commercial terms, and why the weights still ship.** MAESTRO is CC BY-NC-SA 4.0; the weights of the live vocal detector
were trained with its audio among their negatives. Retina Rave is non-commercial — MIT + the Guest-List Clause, nothing sold, no
ads, no accounts, no monetisation of any kind — and the user's decision of 2026-10-12 stands in DECISIONS §126: *"use the
non-commercial sets -> still can publish the weights; don't worry we are not monetizing this."* Anyone taking the weights into a
commercial product inherits that term and should retrain without the NC audio (`tools/truth/voxtrain.py` lists every set).

## The parabolic implosion — the mathematics NAV3's drop borrows (assets/scenes/nav3/implode.js, assets/math/field.js; DECISIONS §140)
Ideas, not code: nothing of these works is copied, and every formula is re-derived in the scene's own source, where the header
says which is whose. The parabolic root points of the Mandelbrot set, their internal angles p/q and the multiplier λ as the
coordinate of a hyperbolic component are Adrien Douady and John H. Hubbard's ("Étude dynamique des polynômes complexes",
Publications Mathématiques d'Orsay, 1984–85). The implosion of a Julia set when the parameter crosses such a point, the slow
"eggbeater" transit through the gate (~π/√ε iterations in the normal form) and the phase of that transit are Pierre Lavaurs'
("Systèmes dynamiques holomorphes: explosion de points périodiques paraboliques", thèse, Université Paris-Sud, Orsay, 1989).
The Fatou coordinates in the attracting petals and the horn map between them follow Mitsuhiro Shishikura ("Bifurcation of
parabolic fixed points", in The Mandelbrot set, theme and variations, LMS Lecture Note Series 274, 2000, Theorem 2.1). The
horn map's translation constant σ as the scene names it is Hiroyuki Inou and Sabyasachi Mukherjee's ("Non-landing parameter
rays of the multicorns", Inventiones Mathematicae 204, 2016, §3). The user's own notes on both
(MandelBound theory/t-parab-horn-map-p24-p50.md; QuantumComputing's cardioid-cusp toolkit input of 2026-04-29) were the brief.
