// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// Solver after Pavel Dobryakov, WebGL-Fluid-Simulation (MIT, 2017) — https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
// FLUID2's help entry — data only (CONTRACTS §1.13): the three depths, and one clause per field of `feats` saying what that
// field moves on THIS screen. The pool's own reads under the band grammar (core/fluid/inject2.js, its FLUID_FEATS) are shown by
// the help view's part B for the grammar that owns the pool, not here: this scene reads five fields of its own and bids nothing
// (forced-only). No code, no imports.

export const HELP = {
  feats: {
    loudRel: 'how brightly the pool is lit: the track\'s own loudness, on its own ladder (loudlight.js) — a breakdown dims the pool, the drop lights it',
    loudRange: 'how many LU the track has shown so far: the ladder that loudness is stretched over',
    loudAbs: 'whether the loudness ruler is running at all; without it the light rides the raw relative loudness',
    hat2: 'while the hats are up, a small bright droplet sparkles onto the surface every 50 ms, walking the golden ratio across the top of the pool',
    presence: 'how hard the scene\'s own sparkle hits the surface: silence drops nothing',
    highS: 'how tight and bright the glint on the ink is: the slow 5–16 kHz band (the nearest thing to air above 8 kHz — no such band exists) raises the highlight\'s gain and sharpens its exponent; light only, the pool is untouched',
    high: 'how much film grain sits on the ink\'s edges: the high band\'s level jitters where each pixel reads the ink from, a fraction of a texel, fresh every frame — on the picture only, never in the pool',
  },
  eli5: 'The same pool of ink as FLUID, under a different grammar: each band of the music is a different KIND of touch on the water. '
    + 'The sub is a field that heaves the whole pool, every kick launches something that travels on its own, the mids are the '
    + 'material (dense mids tighten the curls, thin mids go laminar), the highs are the surface (grain, sharper trails, a glint), '
    + 'and the voice is a pen that draws a stroke the fluid carries off. Built so far: the sub (S1) — never a dot here: the bass '
    + 'note\'s ink still enters at its place on the tonic axis, but its push is a FIELD on the whole pool, the pool rising on the '
    + 'sub\'s attack and settling in its tail, turning over as long as the bass is there and stilling when it leaves, the twin of '
    + 'the void. The kick (S2) is a MASS that travels: FLUID\'s kick rode the sub\'s jet — a column of updraft at the bass note\'s place — '
    + 'and with the jet gone the plain impulse is a pinhead, so here every kick launches a vortex PAIR from the bass note\'s place, two '
    + 'splats a hair apart seeded toward each other so the pair\'s own flow between its cores carries it upward on its own, at the same '
    + 'impulse and the same ink as FLUID\'s one splat; the kick\'s rank in its own lane is still its size. The mids (S3) are the MATERIAL, '
    + 'not a splat: how tightly the pool curls is the mid band\'s place in the track\'s own last half minute — dense mids (pads, chords, a '
    + 'full mix) tighten the eddies, thin mids let the pool go laminar; FLUID ties that to the build\'s tension instead. The snare is one '
    + 'shear burst from a wall — a jet that crosses the pool at mid height, from the left on one hit and the right on the next, at the same '
    + 'push and ink as FLUID\'s two inward shears; chords still enter as their shears. The highs (S4) are the SURFACE and never a force: the hats '
    + 'still sparkle as droplets, the high band\'s level puts a fine hashed grain on the velocity (a wrinkle the ink picks up at the grid\'s own scale, '
    + 'bounded so the pool\'s speed does not move), every hat lets the ink linger a frame or two, and the slow top band is the LIGHT — a brighter, '
    + 'tighter glint on the ink\'s edges when the air is bright, FLUID\'s soft highlight when it is dark. The pen (S5) is the MECHANICS of a voice without the voice: the engine has no vocal-presence feature yet, so what the pen draws today is the HARMONY — a thin sustained mark that drifts along the tonic axis with the harmony\'s centre (a continuous stroke, never a jump, lifted only at the tritone\'s wall) at the same ink FLUID\'s fixed floor cloud fed in at the key\'s place, with a small push along its own drift; when a vocal feature lands it is one read (the feature is not a vocal detector today — do not read the pen as one). The other bands still enter as FLUID\'s splats until their steps land. Under FLUID the music enters as one grammar: under every scene of this engine there is a '
    + 'fluid simulation that the sound drives: the bass note is where the ink enters the pool, every kick lifts it, the snare '
    + 'shears it sideways, the hats drip onto the surface, the key you are hearing is the colour of the ink, the beat kneads '
    + 'the whole pool and a drop clears it, throwing the ink outward in a ring. This scene is that pool itself, seen as a liquid surface: light catches the '
    + 'edges of the ink like oil on water, and the loudness of the track is how brightly it is lit.',
  why: 'The user asked (2026-10-10): clone fluid, do the different bands intuitively, explore point sources and time. FLUID treats every '
    + 'band with the same instrument — a Gaussian splat at some size — so sub, kick, snare and hat differ only in where and how hard. Sound '
    + 'can enter a Stam solver in five places (point sources, body forces, material parameters, time, display), and FLUID2 is the scene '
    + 'where each band gets its own place; it shares FLUID\'s pool, state and drop machinery (one pool, the grammar chosen by the scene '
    + 'that owns it — CONTRACTS §1.4), so nothing here is a second solver. FLUID\'s reasons hold for the pool itself: '
    + 'the other scenes ride this fluid without showing it — their trails are carried along its current — so there had to be '
    + 'one picture where the medium is the subject. The mappings are the engine\'s measured ones: where the ink enters is the '
    + 'bass note\'s place on the circle of fifths, how high a kick lifts it is the kick\'s own size, the snare\'s shear is the '
    + 'snare\'s size, the filter closing turns the pool to syrup, the void lets the ink accumulate, and the live drop empties '
    + 'it. The solver is a re-implementation of Pavel Dobryakov\'s WebGL-Fluid-Simulation (MIT, 2017); the mappings from music '
    + 'are this engine\'s own, with ideas from the music-visualiser forks credited in THIRD-PARTY.md.',
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
