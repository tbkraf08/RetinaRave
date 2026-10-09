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
