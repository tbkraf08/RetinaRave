// `modeShade` (DECISIONS §82, docs/plans/TONGUES-PITCH-PLAN.md phase 3): the chord quality the key implies for the
// BASS's scale degree, per bar — minor cool (-1) … major warm (+1). Pure, node-importable (tools/test_shade.js).
//
// The ears publish ONE key per ~11 s (`key` / `mode`, the tonic, §62). A track in a minor key spends its bars on
// several degrees of that key, and in a diatonic key the triad on each degree has a FIXED quality: in natural minor
// i, iv, v are minor, III, VI, VII major (ii is diminished); in major I, IV, V are major, ii, iii, vi minor (vii
// diminished). So "is this bar major or minor" is a table lookup on (bass note - key) mod 12, no DSP. SeeYouDrop's
// annotated walk C#1 A1 F#1 E1 in C# minor is i VI iv III = -1 +1 -1 +1, every two bars.
//
// Three decisions the table carries:
//  · a DIMINISHED triad reads -1: its third is minor; the brief's axis is the third's quality, and a half-step of
//    cool for ii / vii is the honest side of it (the alternative, 0, would blank one diatonic bar in seven).
//  · the RAISED 7th of minor (semitone 11) and every other non-diatonic bass note read 0 (unknown): the harmonic-minor
//    V would make degree 7 major, but on the five test tracks the bass never sits on the leading tone and the natural
//    v (-1) is what the KK minor profile the key came from describes, so the table is the natural-minor set and says
//    so. A chromatic bass (a slide, a tritone sub) is 0, not a guess.
//  · the table depends on the DIATONIC SET, not on which of its notes is called the tonic: the relative major and
//    minor give the same answers on every note (C# minor = E major), and a key read a fifth off (§62's failure mode
//    for synapse) agrees on five of the seven degrees. On SeeYouDrop the ears' tonic wanders C# / A / F# through the
//    walk (the sub is 70 % of the energy and leans on the chroma) and the four bars still read -1 +1 -1 +1 under
//    every one of those readings.
//
// THE BASS NOTE: `subNote` (the ears' YIN / the map's centred YIN in file mode) while `subGate` is open, `subConf`
// >= CONF and the note has HELD for HOLD seconds (an 808's attack glides F# E D# C# in 50 ms before it settles — the
// hold keeps the glide out). When the sub is gated off (SeeYouDrop's intro, Vienna's dream) the fallback is
// `bchroma`'s root (v3's < 240 Hz pitch-class chroma, ema 0.35 s) when it DOMINATES — its largest bin >= CHROMA of the
// sum — at CHROMA_W of the weight. No bass at all -> the target is 0 and the field eases back to it: 0 when unknown.
// A PLUCKED bass is still the bar's bass between its plucks: WhoLikesToParty's sub notes are 50 ms runs with the gate
// open 59 % of the time and a settled note on 22 % of frames, and read against "0 between notes" the field never left
// ±0.1 (p10 / p90 -0.14 / +0.02). So the last settled sub note HOLDS for LAST_BARS = 1 bar after the gate closes
// (source 3), and only then does the chroma stand in or the field fall to 0.
//
// THE KEY: the (key, mode) the degree is taken against must have HELD for KEY_HOLD = 2 s before the shade adopts it.
// Measured on SeeYouDrop's walk (page, file mode): the ears' tonic flips C#m -> C#M for 0.35 s at 14.0 s and 0.67 s at
// 15.0 s (tonicConf 0.01: the KK coin toss between the PARALLEL modes, which share four notes and disagree on the
// quality of every one of them — C# is I in one and i in the other), and the C# bars read -0.36 / -0.16 instead of -1.
// A flip shorter than a bar is noise about the mode; a real modulation holds. The first read is adopted at once.
// THE KEY'S CONFIDENCE: `keyW` is keycolour.js's own ramp on `keyConf` (KEYC0 0.1 .. KEYC1 0.3), so the field and the
// hue it pulls agree on when the key counts — since §84 `keyConf` is the ears' tonicConf whenever they have a tonic
// (the bass agreeing with the KS tonic: CyborgNinja's G major reads < 0.02 and closes the shade too). Until §84 keyW
// was 1 whenever the ears had a tonic; `&kc=0` (KEYOWN.ears false) restores that with synapse's keyConf, the A/B.
// The result is eased with a time constant of a THIRD of a bar (240 / bpm / 3 s: settled within the bar it belongs
// to, 0.53 s at 150 BPM), the brief's "eased over ~1 bar".
import { KEYOWN } from './tonic.js';

export const SHADEK = {
  // quality by semitone above the key: +1 major, -1 minor / diminished, 0 non-diatonic
  MAJ: [1, 0, -1, 0, -1, 1, 0, 1, 0, -1, 0, -1],     // I . ii . iii IV . V . vi . vii°
  MIN: [-1, 0, -1, 1, 0, -1, 0, -1, 1, 0, 1, 0],     // i . ii° III . iv . v VI . VII .   (natural minor; 11 = the raised 7th, 0)
  CONF: 0.8,       // the least subConf a sub note counts at
  HOLD: 0.06,      // s: the note must have held this long (the 808 glide is ~50 ms)
  CHROMA: 0.35,    // the least share of the bass chroma its largest bin needs to stand in for the sub
  CHROMA_W: 0.6,   // the weight that fallback carries against a sub note's 1
  TAU_BARS: 1 / 3, // the ease, in bars
  LAST_BARS: 1,    // bars: the last settled sub note stays the bass this long after the sub stops
  KEY_HOLD: 2,     // s: a new (key, mode) must hold this long before the degree is taken against it
  KEYC0: 0.1, KEYC1: 0.3,   // keycolour.js's ramp on keyConf (restated: a scene may import only math/*, and this file imports nothing of the core)
};

export const degreeShade = (note, key, minor) => (note < 0 || key < 0) ? 0 : (minor ? SHADEK.MIN : SHADEK.MAJ)[(((note - key) % 12) + 12) % 12];

export class ModeShade {
  constructor(K = SHADEK) { this.K = K; this.v = 0; this.note = -1; this.held = 0; this.src = 0; this.deg = 0; this.w = 0; this.key = -1; this.minor = 0; this.candKey = -1; this.candMinor = 0; this.candT = 0; this.last = -1; this.lastAge = 9; }
  // One frame. `S` is read for key, mode, tonic, keyConf, subNote, subGate, subConf, bchroma (Float32Array(12)), bpm.
  step(dt, S) {
    const K = this.K;
    // the bass note: the sub when it is there and settled, else the bass chroma's root when it dominates
    const subOk = S.subGate > 0 && S.subNote >= 0 && S.subConf >= K.CONF;
    if (subOk && S.subNote === this.note) this.held += dt; else { this.note = subOk ? S.subNote : -1; this.held = 0; }
    const bar = 240 / (S.bpm > 0 ? S.bpm : 124);
    let note = -1, w = 0, src = 0;
    this.lastAge += dt;
    if (subOk && this.held >= K.HOLD) { note = this.note; w = 1; src = 1; this.last = note; this.lastAge = 0; }
    else if (this.last >= 0 && this.lastAge < K.LAST_BARS * bar) { note = this.last; w = 1; src = 3; }
    else if (S.bchroma) {
      let sum = 0, best = -1, bv = 0;
      for (let i = 0; i < 12; i++) { const c = S.bchroma[i]; sum += c; if (c > bv) { bv = c; best = i; } }
      if (sum > 1e-6 && bv >= K.CHROMA * sum) { note = best; w = K.CHROMA_W; src = 2; }
    }
    // the key: the ears' tonic is known outright; synapse's key counts by keycolour's ramp; a change must hold KEY_HOLD
    const key = S.key | 0, minor = S.mode | 0;
    if (key === this.candKey && minor === this.candMinor) this.candT += dt; else { this.candKey = key; this.candMinor = minor; this.candT = 0; }
    if (this.key < 0 || this.candT >= K.KEY_HOLD) { this.key = this.candKey; this.minor = this.candMinor; }
    const keyW = (!KEYOWN.ears && S.tonic >= 0) ? 1 : Math.min(1, Math.max(0, (S.keyConf - K.KEYC0) / (K.KEYC1 - K.KEYC0)));
    const d = note >= 0 ? degreeShade(note, this.key, this.minor) : 0;
    const target = d * w * keyW;
    this.v += (target - this.v) * (1 - Math.exp(-dt / (K.TAU_BARS * bar)));
    this.deg = d; this.w = w * keyW; this.src = note >= 0 ? src : 0;
    return this.v;
  }
  reset() { this.v = 0; this.note = -1; this.held = 0; this.src = 0; this.deg = 0; this.w = 0; this.key = -1; this.minor = 0; this.candKey = -1; this.candT = 0; this.last = -1; this.lastAge = 9; }
}
