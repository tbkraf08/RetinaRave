// MAXWELL's help (CONTRACTS §1.13): the three depths and, per feats entry, what it moves on this screen. The worker fills
// feats as the equations land; every feats entry gets a line here (check.js warns on a gap).
export const HELP = {
  eli5: "Maxwell's four equations solved live, as a picture. Twelve charges sit on a ring, one per note of the scale, and light up when their note plays. A magnet in the middle turns one notch per beat. Every drum hit sends out a real ripple of light that travels at a fixed speed, so the rhythm becomes the spacing of the rings. The section of the track decides what the ripples travel through: a lens, a hall of mirrors, a lattice, a corridor.",
  why: "TORUS2 fakes the spacing of the bumps with a shader; here the field does it. A hit is a source term, the wave equation carries it outward at c, and a syncopated bass line reads as unevenly spaced rings without any code that knows about syncopation. The medium is the section so a returning section returns to its geometry through the director's look memory.",
  math: "A Yee-grid FDTD in the TE mode: Ez, Hx, Hy on a staggered grid, Courant number 0.5, two fragment passes per substep (Faraday: ∂B/∂t = −∇×E, then Ampère–Maxwell: ε ∂E/∂t = ∇×H − σE − J). Gauss's law enters through the sources (ρ = the twelve charges by chroma), ∇·B = 0 holds exactly on the Yee grid, so the H field lines are closed strokes. A graded 16-cell absorbing layer at the edge; the drop turns it into a conductor.",
  feats: {
    beatPhase: 'the 5 % thump on the beat — the cavity zooms with the downbeat',
  },
};
