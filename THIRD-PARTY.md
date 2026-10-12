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

**What ships (DECISIONS §123):** `assets/engine/ears/vox-weights.js` — the 38 385 parameters of the live vocal detector
(`assets/engine/ears/vox.js` + `vox-net.js`), trained by `tools/truth/voxtrain.py` on the corpus's train + valid splits (77 of
the 93 pieces, the frame labels at the window's end) together with six of this project's own library tracks. The weights are a
derived work of the corpus under CC BY 4.0; this notice, the header of the weights module and the credits on retinarave.com/about
are the attribution. The corpus's own README: "This is a public corpus of 93 creative-commons licensed music pieces annotated by
voice (sung or spoken) and no-voice." Nothing of the audio or the labels is reproduced in the weights or anywhere on the site.
