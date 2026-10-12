// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// Solver after Pavel Dobryakov, WebGL-Fluid-Simulation (MIT, 2017) — https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
// FLUID2's help entry — data only (CONTRACTS §1.13): the three depths, and one clause per field of `feats` saying what that
// field moves on THIS screen. The pool's own reads under the grammar that owns it (core/fluid/inject2.js — the RIG grammar over
// inject.js, §121) are shown by the help view's part B, not here: this scene reads five fields of its own and bids nothing
// (forced-only). No code, no imports.

export const HELP = {
  feats: {
    loudRel: 'how brightly the pool is lit: the track\'s own loudness, on its own ladder (loudlight.js) — a breakdown dims the pool, the drop lights it',
    loudRange: 'how many LU the track has shown so far: the ladder that loudness is stretched over',
    loudAbs: 'whether the loudness ruler is running at all; without it the light rides the raw relative loudness',
    hat2: 'while the hats are up, a small bright droplet sparkles onto the surface every 50 ms, walking the golden ratio across the top of the pool',
    presence: 'how hard the scene\'s own sparkle hits the surface: silence drops nothing',
  },
  eli5: 'FLUID\'s pool of ink under a lighting designer\'s rig. Where FLUID lets the bass note slide the ink\'s entry along the bottom and '
    + 'scatters the hats at random, this scene hangs a fixed, invisible, mirror-symmetric rig of 23 mouths in three sizes — five big washes '
    + 'along the floor, three spots on each wall, seven small beams across the top, a centre and a quad inside — and the music\'s hits are '
    + 'chased across it the way a lighting desk runs a rig: the kicks ping-pong over the inner floor pair or step inside → out, the snares '
    + 'fire a mirror pair from the walls at a height the phrase picks, the hats run the odd beams on one bar and the even on the next, the '
    + 'outer mouths stay dark until the tension or a build opens them, and on the drop every mouth pulses once (the blinder) while the pool '
    + 'clears — no shockwave. Every splat is coloured by its own note on the circle of fifths: the bass in the bass note\'s hue, the lead in '
    + 'its own. The LEAD is the VOICE: the ears\' vocal detector (a small net that hears whether someone is singing, and a pitch tracker '
    + 'on the voice band) puts a mark at centre stage that takes ink in proportion to how surely a voice is there — nobody singing, no '
    + 'mark, the floor keeps its ink — and whose HEIGHT is the sung pitch (the tonic low, the leading tone high, a soprano above a '
    + 'baritone), gliding between notes in the sung note\'s hue. How hard every hit pushes and how much ink it brings is FLUID\'s; only '
    + 'the WHERE is the rig\'s.',
  why: 'The user pulled the first experiment here (the §116 band grammar: "it moves too quickly", 2026-10-11), asked for FLUID back as the '
    + 'canvas, then for an array of different-sized entry points lining the sides and top and inside, symmetric and tasteful, "how would a '
    + 'professional light designer do it" — and decided: no shockwave, a channel for vocals, pitch as a vertical move (not a horizontal '
    + 'slide), the rig invisible, colour by the note on the circle of fifths. A lighting designer hangs a fixed symmetric plot once and the '
    + 'show is which fixtures fire, in what pattern, at what intensity — so the rig is a table, the hits advance chases, and the outer '
    + 'fixtures are held back for the drop. The lead read the chroma\'s strongest note over the bass until the vocal detector landed (the '
    + 'user: "live mode is first concern" — a causal net in the ears, trained on the Jamendo singing-voice corpus, CC BY 4.0); that chroma '
    + 'read is now only the stand-in where the detector has no read at all. The solver is Pavel Dobryakov\'s WebGL-Fluid-Simulation (MIT, '
    + '2017) re-implemented; the mappings are this engine\'s own.',
  math: 'Stam\'s stable fluids (1999) as Harris laid them out for the GPU (GPU Gems ch. 38, 2004): an incompressible '
    + 'velocity field on a grid, stepped by splatting forces (Gaussians exp(−|p|²/r)), vorticity confinement (a push along '
    + 'the gradient of |curl|, which puts the small eddies back that the grid\'s diffusion ate), the divergence, a Jacobi '
    + 'solve of the pressure Poisson equation ∇²p = ∇·v, the projection v ← v − ∇p that makes the field divergence-free, and '
    + 'semi-Lagrangian advection — the value that lands on a cell is read from where its parcel was one step ago, x − v·dt, '
    + 'unconditionally stable at any step. The ink is a passive scalar advected by the same field with its own dissipation. '
    + 'This pass lights the ink as a height field: the normal is (−∂L/∂x, −∂L/∂y, 1) from the luminance gradient over two dye '
    + 'texel, a Lambert term from a light at the top and a Blinn highlight pow(n·h, 48) that rides the ink. The grid\'s '
    + 'short edge is 64 to 128 cells by quality tier, the ink 256 to 512, both at the screen\'s aspect; everything is in '
    + 'screen fractions per second, so the trails of every other scene are back-traced along the same field with no scaling.',
};
