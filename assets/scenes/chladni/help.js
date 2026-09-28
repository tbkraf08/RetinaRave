// CHLADNI's help entry — data only (CONTRACTS §1.13): the three depths, and one clause per field of `feats` saying
// what that field moves on THIS screen. No code, no imports; index.js hands it straight to the help view.

export const HELP = {
  feats: {
    subNote: 'which figure the sand draws: the bass note\'s distance from the key\'s root picks one of twelve figures, simple ones for consonant intervals and busy ones for dissonant',
    subCents: 'the figure melts continuously between its two neighbours as the bass slides — every slide into the root note is a figure relaxing into the root figure',
    hatAge: 'the fine, fast ripple a hat sends travelling out across the plate — the skinny waves between the fat bass ones',
    hatVel: 'how deep that ripple cuts',
    snareAge: 'the bright ring a snare sends across the plate, placed by the snare\'s own age',
    snareVel: 'how bright that ring is',
    mapDropEvt: 'the slam: on the drop\'s exact bar line the whole plate throws its sand into the air',
    dropEvt: 'the same slam when there is no map to read the drop off',
    subConf: 'how much of the harmonic roughening the bass is allowed to do: an unsure pitch keeps the lines clean',
    subGate: 'when the bass stops the plate stops: the sand freezes, drops and starts to float',
    subPure: 'a pure 808 sine draws clean lines; a harmonic bass mixes in the second and third harmonics\' figures, so the plate goes busy and rough',
    kickEvt: 'a kick takes the sand: the throw is re-armed with how hard that kick hit',
    kickAge: 'where in its flight the thrown sand is — the height is the exact ballistic z = v·a − g·a²/2 in the kick\'s own age, so the leap lands on the beat to a fraction of a frame',
    kickVel: 'how high that kick throws the sand',
    sub: 'how hard the plate is driven: how far the sand is thrown per frame and how brightly the moving parts glow',
    bass: 'the drive when the bass has moved up an octave and there is no sub to hear (the intro, and the second climb at 1:41): the plate is driven by the bass wherever the bass lives',
    eG: 'the track\'s own macro arc, restored: a quiet passage drives the plate softly even after the automatic gain has flattened it',
    mapOn: 'chooses the map\'s anticipation (a file, whose drops are known in advance) over the live drop guess',
    bassReg: 'the camera\'s elevation: a 35 Hz sub is seen from low down with the plate filling the frame, a mid-bass from overhead with the plate small',
    lpSweep: 'fog and desaturation: as the outro\'s low-pass closes, the plate dims into its figure',
    tonic: 'the note every interval is measured from, and the hue the whole palette is anchored on',
    tonicMinor: 'minor cools the palette, major warms it',
    tonicConf: 'how far the key is allowed to pull the palette away from the mood colour',
    key: 'the fallback root when the new ears have not found a key yet',
    mode: 'the fallback major / minor for that root',
    keyConf: 'how much to trust that fallback',
    valence: 'a touch of extra warmth in a bright passage, coolness in a dark one',
    harmAngle: 'the palette\'s last resort when no key is trusted: the nearest fifth of the harmony',
    beatPhase: 'the thump: the camera dips a little on every felt beat',
    beatCount: 'the plate\'s turn — sixteen felt beats nudge it one full revolution',
    pulse: 'the felt beat: in half time the plate turns and thumps at half the grid rate',
    hush: 'a hush slows the nudge, so the plate turns lazily in a breakdown',
    calm: 'the same, for quiet unhurried music',
    flow: 'musical time — the scene\'s own clock, never the wall clock',
    buildProg: 'through the void the sand spirals inward and the camera tilts up, exactly as far as the build has come',
    dropConf: 'the same spiral and tilt when there is no map, from the live guess that a drop is coming',
  },
  eli5: 'A metal plate with sand on it, played by the bass. When a plate vibrates at one pitch, the sand is shaken off '
    + 'the parts that move and piles up on the lines that stay still — a figure that belongs to that pitch. Here the '
    + 'bass note sets the figure, a slide melts one figure into the next, every kick throws the sand into the air, and '
    + 'when the bass stops the sand floats free. The camera sits low when the bass is a deep sub and climbs overhead '
    + 'when the bass moves up, and the colour comes from the key: the note you are hearing is the hue you are seeing.',
  why: 'SeeYouDrop is a near-sine sub bass on C#1 — exactly the kind of tone that drives a clean Chladni figure — and '
    + 'the v0.15 engine can finally hear it: its pitch, its slides, how pure it is, when it is gated, and (from a file) '
    + 'where the drops are before they happen. Every one of those goes to one channel and one only, so what you see is '
    + 'what you hear: pitch is the figure, level is how hard the sand dances, a kick is a throw, silence is silence. '
    + 'Nothing is a general-purpose wobble. That is the whole design.',
  math: 'Square-plate Chladni approximation: u(x, y) = cos(nπx)·cos(mπy) − cos(mπx)·cos(nπy) on the plate [−1, 1]², '
    + 'which is antisymmetric in n and m (so a figure is an ordered pair n ≠ m, and both diagonals y = ±x are nodal '
    + 'for every figure) and whose zero set is where the sand settles. The figure is chosen by the sub note\'s '
    + 'interval to the tonic through a twelve-entry table ordered by the Tenney height log2(p·q) of the interval\'s '
    + 'just ratio — the simplest figure for the simplest ratio — and blended between neighbouring entries by the '
    + 'fractional interval, which is continuous through a slide because the cents are measured from the nearest note. '
    + 'Impurity adds the (2n, 2m) and (3n, 3m) figures. A walking bass rounds the plate, where the modes are Bessel: '
    + 'J_n(kr)·cos(nθ), drawn through the large-argument asymptote cos(kr − nπ/2 − π/4)·cos(nθ), whose nodal rings are '
    + 'spaced π/k exactly as the true zeros asymptotically are. The sand itself is a random walk with step ∝ |u| plus a '
    + 'descent on u², which is the real mechanism: a grain is kicked hardest where the plate moves most and slides '
    + 'downhill toward u = 0, so the figure emerges from the grains rather than being drawn for them. A kick\'s throw '
    + 'is the exact ballistic z = v·a − g·a²/2 in the kick\'s own age a, so it is placed to a fraction of a frame.',
};
