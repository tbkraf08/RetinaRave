// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
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
    tongue21: 'a double-time layer ARRIVING over 16 beats makes the per-beat crest bigger and the hat glints harder, never faster',
    tongue41: 'the same for a 16th-note layer',
    tongueOn: 'the gate on that accent: off while the tongues stage warms up or is switched off',
    flow: 'the fold constant\'s slow drift underneath the beat-locked phase, and the colours cycle slowly',
    bass: 'zooms in (the fold pushes harder) and sharpens the lit ring',
    bassS: 'shifts the fold constant and the lit ring\'s radius',
    midS: 'the fold\'s rotation angle and the constant\'s other half',
    kick2: 'the floor under the kick\'s pulse: between hits the fold sits at the level\'s own depth',
    kickAge: 'exactly how long ago the kick was, so the fold-depth pulse is placed between frames, not on one',
    kickEvt: 'the ears\' own word that a kick landed: whichever of the two hears it first starts the pulse — a zoom in, a shove on the fold constant, the centre flare',
    kickAmp: 'how hard that kick was, in dB — traced beside the pulse, not yet read by it',
    snare2: 'the floor under the snare\'s flash',
    snareAge: 'how long ago the snare was: the flash is placed by it',
    snareEvt: 'a snare lights ONE of the N wedges for its decay — the segment flash, which wedge drawn from the count',
    snareAmp: 'how big that flash is: the snare lane\'s own rise in dB',
    hat2: 'the floor under the hat\'s glint',
    hatAge: 'how long ago the hat was: the glint is placed by it',
    hatEvt: 'a hat is a glint on the orbit-trap ring',
    highS: 'while the high band is swelling (a pad, a sparkle) the ears\' hat is not a hat: no glint on a swell',
    buildLive: 'the void before a drop: the mirror count goes up by one, the colour drains, the body dims and the inversion clamps tighter — the build tightens the picture',
    nextDropIn: 'the last bar before the expected drop winds the tightening up a little further',
    dropLiveEvt: 'the slam: everything lets go on one frame — the colour, the mirror count, the clamp — and the centre flares',
    tongueAmbig: 'a beat the music will not commit to (a dream before a drop) tightens the picture the same way the void does',
    tension: 'roughness is only a small jitter on the zoom now; it no longer zooms out',
    dropEnv: 'zooms in hard and the centre flares',
    lvl: 'the fallback brightness when the loudness stage is off',
    loudRel: 'the body\'s brightness: how loud this passage is for THIS track, so a breakdown is dim and its drop is not',
    loudRange: 'how far that brightness travels — the track\'s own dynamic range sets the contrast',
    loudAbs: '&loud=0 (or no loudness yet): the brightness falls back to lvl exactly as before',
    high: 'the brightness of the orbit-trap ring',
    alive: 'silence fades to black',
    key: 'the palette\'s centre hue: the key on the circle of fifths, so a modulation turns the whole wheel a twelfth',
    mode: 'major pulls that hue toward warm and lifts the saturation, minor toward cool',
    keyConf: 'how far the key is trusted: below it the colours slide back to the mood palette',
    valence: 'a little extra warmth or cool on top of the mode',
    harmAngle: 'the chroma centroid on the fifths circle, read by the anchor beside the key',
    modeShade: 'is THIS bar major or minor: a per-bar warm / cool lean on the key hue',
  },
  eli5: 'A kaleidoscope whose mirrors are a real Kleinian-style fold: abs() folds the plane onto itself and a '
    + 'sphere inversion turns it inside out, over and over. The music picks how many mirrors there are, how far '
    + 'the fold pushes, and which ring of the orbit lights up — the wedge turns one step per beat, landing on the downbeat, '
    + 'a kick pulses the fold deeper, a snare lights one wedge, a hat glints on the ring.',
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
