// MANDALA — the ? overlay's text (CONTRACTS §1.13): one clause per field of `feats` saying what it moves on THIS
// screen, and the three depths. Data only, kept out of index.js so the scene object stays inside the line cap (§85).

export const HELP = {
  feats: {
    arc: 'the bid: never auto-picked during a build',
    regularity: 'the bid: a steady rhythm',
    onsetRate: 'the bid: dense hits',
    seed: 'how many mirrors: N = 4, 6, 8, 10 or 12 is drawn from the section seed — and only re-drawn on a seam of the music',
    beatCount: 'the wedge turns one step per beat on the beat count itself, so it cannot drift from the music',
    beatPhase: 'where inside the beat the turn is: the motion crests ON the beat line, glides between',
    bpm: 'the width of that crest in wall-clock time, so a slow track does not get a long soft swing',
    barPos: 'the downbeat is a bigger step than the other three beats, so the N arms land on it',
    phrase16Pos: 'when the 16-beat phrase wraps the mirror count may be drawn again (a seam, never a count of kicks)',
    barNovelEvt: 'a bar that starts something new is the other seam: a fresh draw of the mirror count',
    barReturnEvt: 'a bar that returns earlier material brings back the mirror count that material had',
    tongue21: 'a double-time layer ARRIVING over 16 beats makes the per-beat crest bigger, never faster',
    tongue41: 'the same for a 16th-note layer',
    tongueOn: 'the gate on that accent: off while the tongues stage warms up or is switched off',
    flow: 'the fold constant\'s slow drift underneath the beat-locked phase, and the colours cycle slowly',
    bass: 'zooms in (the fold pushes harder) and sharpens the lit ring',
    bassS: 'shifts the fold constant and the lit ring\'s radius',
    midS: 'the fold\'s rotation angle and the constant\'s other half',
    kick: 'a zoom pulse and the centre flare',
    tension: 'zooms out: more of the fold\'s outer structure',
    dropEnv: 'zooms in hard and the centre flares',
    lvl: 'the fallback brightness when the loudness stage is off',
    loudRel: 'the body\'s brightness: how loud this passage is for THIS track, so a breakdown is dim and its drop is not',
    loudRange: 'how far that brightness travels — the track\'s own dynamic range sets the contrast',
    loudAbs: '&loud=0 (or no loudness yet): the brightness falls back to lvl exactly as before',
    high: 'the brightness of the orbit-trap ring',
    hat: 'sparkle on the trap ring',
    alive: 'silence fades to black',
  },
  eli5: 'A kaleidoscope whose mirrors are a real Kleinian-style fold: abs() folds the plane onto itself and a '
    + 'sphere inversion turns it inside out, over and over. The music picks how many mirrors there are, how far '
    + 'the fold pushes, and which ring of the orbit lights up — and the wedge turns one step per beat, landing on the downbeat.',
  why: 'The symmetry is exact because it comes from the map, not from smearing a mirrored copy over the picture '
    + 'afterwards. Every pixel is folded into one wedge before any shading happens, so the N arms are the same '
    + 'arm — there is no seam to hide. That is why the post-kaleidoscope is damped to 0.6 here: the scene already '
    + 'owns its symmetry group, and a second one fights it. The turn is a closed form of the beat count, so it cannot '
    + 'drift, and the mirror count changes only where the music itself has a seam.',
  math: 'Per pixel take polar (r, a), fold a into one wedge of width 2pi/N (N = 4 + 2*floor(5*hash) in {4,6,8,10,12}), '
    + 'and iterate z -> R * (|z| / clamp(<z,z>, 0.07, 3) - c). |z| is the box-fold (reflect in the axes); dividing '
    + 'by <z,z> is inversion in the unit circle, clamped so the origin does not blow up; -c translates and R rotates. '
    + 'Composing reflections and inversions generates a discrete group, so the limit set is self-similar. An orbit '
    + 'trap records how near the orbit passed a target — here a ring of radius 0.35 + 0.5*spectrum(i), summed as '
    + 'exp(-13*|‖z‖ - radius|), plus a cross trap min|z.x*z.y| — and that nearness, not any escape time, is the glow. '
    + 'The wedge angle is A(m) + step*PHI(u) on beat m at phase u: PHI is a glide plus a raised cosine, its integral exact, '
    + 'with step = 2pi/(4N) so one wedge passes per bar.',
};
