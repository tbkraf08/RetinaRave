// DUST — the ? overlay's text (CONTRACTS §1.13): one clause per field of `feats` saying what it moves on THIS
// screen, and the three depths. Data only, kept out of index.js so the scene object stays inside the line cap.

export const HELP = {

  // what each field in `feats` moves on this screen (CONTRACTS §1.13); a field without a line falls back to FEATS[k].drives
  feats: {
    flow: 'the scene clock, and the phase of the jitter the roughness shakes the cloud with; the camera drifts on it',
    flowMid: 'the ribbon twists and the doughnut\'s tube breathes on mid-band time; it also twists the fibre '
      + 'rings and wobbles how high up the sphere each ring sits',
    flowBass: 'bass time tumbles the whole family of fibre rings rigidly, so the linked circles roll through '
      + 'each other',
    bassS: 'the torus tube fattens, the whole cloud grows, the camera dollies in; it also lights the first ring',
    midS: 'the wobble of every grain and the ribbon\'s thickness; it also lights the second ring',
    highS: 'lights the third ring: the highest tori brighten with the top of the mix',
    lvl: 'how far each grain is pushed out by its own band, how fast a re-pour completes, and part of the '
      + 'brightness of the rings; it no longer sets the brightness of the cloud, because it is levelled out '
      + 'automatically and made a quiet verse as bright as the drop',
    kick2: 'a kick shoves the core of the cloud outward and brightens it, swells the rings a little and hurries a '
      + 'pour along — the reactive drums v2, which fire on 808 notes as well as beaters',
    kickAge: 'exactly how long ago that kick was, so the shove is placed between frames instead of on one',
    kickEvt: 'the ears\' own word that a kick just landed: whichever of the two hears it first starts the shove, so '
      + 'a kick the level is slow to confirm still moves the cloud on time',
    snare2: 'how bright the middle of the cloud stays between snares — the snare level underneath the ring, '
      + 'which no longer launches one of its own',
    snareAge: 'how long ago the snare was: it is what puts the ring where it has got to, counted from the body '
      + 'of the cloud outward',
    snareEvt: 'the ears\' own word that a snare just landed — it is the one thing that launches the flash ring, '
      + 'so a pad swelling or a hi-hat spilling into the snare band no longer sets one off',
    snareAmp: 'how big that flash is: the snare\'s own loudness, measured as how far it rose above the half-second '
      + 'before it, so a soft rim is a small ring and a hard snare fills the body',
    hat2: 'the rim of the cloud sparkles bigger and brighter, and only the rim',
    hatAge: 'how long ago the hat was, so the sparkle fades from the hit and not from the frame',
    hatEvt: 'the ears\' own word that a hat just landed: it starts the sparkle even on the hats the level misses',
    subNoteEvt: 'a new bass note swells the core of the cloud',
    subGate: 'no bass at all and the core lets go entirely: silence is quiet',
    dropEnv: 'the cloud re-pours on the drop, grains fly outward, the rings swell, the camera dollies in',
    tension: 'the roughness shakes the grains where they stand — jitter, and nothing else; it no longer shrinks '
      + 'the cloud, because a dissonant chord is not a build',
    buildLive: 'the void before a drop draws the whole cloud in, thins the doughnut\'s tube to a wire, pulls the '
      + 'rings tight and drains the colour out of everything',
    nextDropIn: 'inside the last bar before the expected drop the contraction winds up a little further',
    dropLiveEvt: 'the slam: everything the void was holding lets go at once, and the grains overshoot outward',
    alive: 'silence fades every grain, and every ring, to black',
    beatCount: 'the beat grid: the whole cloud is nudged a thirty-second of a turn on every beat, the torus a '
      + 'little further and the galaxy arms further still in their core than at their rim',
    beatPhase: 'together with the bar position it says where the downbeat is, so the first beat of the bar gets '
      + 'half a nudge more than the other three',
    barPos: 'which beat of the bar this is: the downbeat gets the bigger nudge',
    tongue21: 'how complete the eighth-note layer is as a click train: when a double time ARRIVES (the depth rises over '
      + 'four bars) every beat\'s nudge gets up to a quarter bigger — a stronger accent, never a faster one; a steady '
      + 'eighth pattern changes nothing',
    tongue41: 'the same for the sixteenth-note layer',
    tongueOn: 'with the tongues off (&tongues=0) the nudge is exactly what it was before them',
    phrase16Pos: 'when the sixteen-beat phrase comes round, the swarm pours into a new shape',
    barNovelEvt: 'a bar that starts something new pours the swarm into a new shape, wherever in the phrase it falls',
    barReturnEvt: 'a bar that brings back something from earlier pours the swarm back into the shape that part of '
      + 'the song had',
    sectionAlt: 'which part of the song this is: the swarm files the shape it ended each part in, and goes back '
      + 'to it on a return',
    sectionReturn: 'the slower second opinion that this part of the song is one we have heard before',
    loudRel: 'how loud this stretch really is for THIS track — a true loudness, not a levelled-out one: a quiet '
      + 'part of the song is a small, dim cloud of small grains and a loud one is a big bright one, and a quiet one '
      + 'is also a plain ball where a loud one is a galaxy. The drums are not dimmed with it — a quiet section\'s '
      + 'kick is still a kick',
    loudRange: 'how much loud-to-quiet the track has actually shown: it sets how far the cloud\'s brightness, size '
      + 'and spread are allowed to travel, so a flat track stays even and a dynamic one gets the whole swing',
    loudAbs: 'with the loudness off (&loud=0) the cloud falls back to the levelled-out energy it used before, '
      + 'exactly as it was',
    eM: 'the fallback for the above when the loudness is off: how loud this stretch is against the loudest this '
      + 'track has been, measured on the levelled-out energy',
    eS: 'the same fallback loudness over a third of a second instead of two and a half, so the moment a drop '
      + 'lands counts as loud even though the two seconds before it were the silence of the build',
    harmAngle: 'where the harmony sits on the circle of fifths: it is the fallback the whole palette is centred '
      + 'on when the key itself is not trusted',
    key: 'the key is the colour of the cloud and of the rings: the twelve keys are twelve hues round the circle of '
      + 'fifths, so a change of key is a small turn of the whole palette and related keys look related',
    mode: 'major pulls the palette to the warm half of the wheel and lifts the colour, minor to the cool half and '
      + 'drains it a little',
    keyConf: 'how sure the engine is of the key: while it is unsure the last confident key is held and the colour '
      + 'slides back toward the plain mood palette, so a keyless stretch is never a random hue',
    valence: 'happy music warms the palette a little further, sad music cools it',
    modeShade: 'whether THIS BAR\'s bass sits on a major or a minor degree of the key: a major bar leans the hue warm, a minor bar cool — only with &shade=1 until the eye has judged it',
    denK: 'how many kicks a second there are: with no bass and almost no kicks the swarm becomes the waveform '
      + 'itself, a single line',
    arc: 'the bid: never auto-picked during a build',
    punchy: 'the bid: punchy music invites the swarm',
    regularity: 'the bid: a steady rhythm invites the swarm',
  },
  eli5: 'Every dot is a particle that owns one frequency band of the spectrum. When its band gets loud the dot '
    + 'pushes outward, grows and brightens, so the cloud is a picture of the sound: the bass grains ARE the core of '
    + 'the cloud and breathe there, the snare\'s band is its body and the hi-hats are its rim, so you can tell the '
    + 'drums apart by where they happen as well as by what they do. The whole swarm keeps pouring from one shape into another — a '
    + 'ball, a doughnut, a galaxy, a ribbon of the waveform — and which one it is tells you where you are in the '
    + 'song: a ball in the quiet parts, a galaxy in the groove, a doughnut that tightens through the build, the '
    + 'bare waveform when one instrument is left alone. The drop bursts the doughnut into the galaxy. A dot also gets '
    + 'bored: if its band has been saying the same thing for a couple of seconds it settles back and lets the '
    + 'dots whose bands have just CHANGED have the light, so a pad that holds one chord fades into the background '
    + 'and a sound that has just come in stands out. And the whole cloud is as loud as the song is: it is dim and '
    + 'small in a quiet part and big and bright in a loud one, measured against the loudest this track has been — '
    + 'but the drums are never dimmed with it. Threading through it '
    + 'are a few faint rings that are all hooked through one another like links of a chain, and can never come '
    + 'apart however the music turns them.',
  why: 'A spectrum bar chart wastes the third dimension and hides how many things are happening at once. Giving '
    + 'each of 20k-150k grains its own bin turns the spectrum into a texture you feel rather than read: you see '
    + 'the density of the mix, not just its loudness. Formations change only on kicks and drops (cuts: onset) so '
    + 'the change always lands with the music, and the cross-fade is per-particle so the cloud pours instead of '
    + 'snapping. Which shape is not a shuffle: it is read off the section\'s energy, and a section that comes back '
    + 'gets its own shape back, so the sequence of shapes is the sequence of the song\'s parts. The camera orbits with GROOVE and dollies in on bass, so the body of the track is also motion. '
    + 'Every turn in the picture is on the beat grid: the cloud, the doughnut and the galaxy arms are nudged a '
    + 'step on each beat and a bigger step on the downbeat, and a shape change waits for the phrase line or for a '
    + 'bar the engine says begins something new — so you can count the bars off the screen with the sound off. '
    + 'Two things stop the cloud from looking the same all the way through a song. Loudness is measured against '
    + 'the track\'s own running peak rather than the automatic level, which is flattened by design, so a '
    + 'breakdown is genuinely dimmer and smaller than a drop. And each dot answers to what is NEW in its band '
    + 'rather than to how loud it is, so what you see is the part of the mix that is changing; the light is only '
    + 'moved between dots, never added, so a habituating cloud does not go dark.',
  math: 'A grain\'s BAND is its PLACE: the rank of the bin it owns (uniform on 0..1) becomes its distance from the '
    + 'centre, and each shape maps that rank the way its own dimension keeps its density even — a ball at the cube '
    + 'root, a disc at the square root, a line at the rank itself. Fibonacci sphere: y = 1 - 2n spreads the '
    + 'directions evenly in height (a sphere\'s area per unit height is constant), ring radius sqrt(1 - y^2), and '
    + 'the azimuth advances by the golden angle 2pi/phi^2 ~ 2.39996 rad per particle, the hardest turn to '
    + 'approximate by rationals, so successive points never fall into arms or seams; the radius is '
    + '1.05*(.05 + .95*cbrt(rank)), which is uniform density per unit VOLUME, so it is a ball whose nucleus is the '
    + 'bass. Torus: p = ((R + r cos v) cos u, r sin v, (R + r cos v) sin u) with r = .38 + .2*bassS, so the tube '
    + 'fattens with the low end; the tube angle v is pi*(1 - rank), so the low bins ride the inner wall at R - r '
    + 'and the highs the outer wall at R + r. Galaxy: radius r = sqrt(rank) gives uniform density per unit area '
    + '(the rule the other three now follow), and the arm angle r*2.6 + 0.9*spin/(r + .35) winds the core faster '
    + 'than the rim, which is what makes spiral arms. The grid: spin eases toward (2pi/32)*(beatCount + bar/2), a target read off the COUNTS and never '
    + 'integrated, so it cannot drift however the tempo moves; the ease has a 0.22 s time constant, which is half '
    + 'a beat at 150 BPM, so each beat lands as a nudge and the bar line lands as one and a half. '
    + 'Ribbon: the place along the ribbon is +-rank, so the lows are its middle and the highs its two ends, and the '
    + 'waveform texture is sampled where the grain actually is; twisted by rot(2.5x). Projection: a standard '
    + 'perspective matrix, fov 55 deg, near .1, far 10.1; point size falls as 1/w (w = distance along the view '
    + 'axis) and brightness carries min(1, 50000/count) so adding particles never adds total light. The rings are '
    + 'Loudness: a peak hold on eM + half of whatever eS hears above it, instant attack, 25 s release, floored at '
    + '0.70, and the drive is (energy/peak - .55)/.45 clamped to 0..1. Habituation: each bin keeps a 1.2 s '
    + 'exponential average of itself in a 256x1 ping-pong target, the novelty is (level - average)/0.10 clamped '
    + 'to 0..1, and the grain\'s drive is 0.35 + 0.65*novelty divided by that gain\'s own RMS over the bins this '
    + 'frame, weighted by the grain density and by the light each bin already carries -- so the mean of the '
    + 'squared drive, which is what the brightness is, is exactly preserved and the novelty only redistributes '
    + 'it. Hopf fibres: the circle psi -> (cos(t/2) e^i(psi+phi/2), sin(t/2) e^i(psi-phi/2)) on the 3-sphere, sent to a '
    + 'circle in space by stereographic projection from (0,0,0,1); the fibres of one colatitude t lie on a torus of '
    + 'revolution and any two of them are linked exactly once. Rings running near the projection pole are cut and '
    + 'faded out rather than flung to infinity.',
};
