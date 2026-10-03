// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// MAXWELL — the detectors (v0.12 item B): WHAT hit, WHERE it is on the ring, and in WHICH NOTE'S HUE.
// Pure arithmetic, no GL, no DOM, no wall clock (the only clock is the `dt` handed in). sources.js turns what this
// module finds into launches; nothing here touches the field.
//
// The user, on v0.11: "I'm expecting every sound to generate a wave (and the wave color is based on musical note
// being played) sometimes the music goes double time, doesn't seem like what is being emitted from middle matches".
// Two separate faults. (1) v0.11 launched on a HYSTERESIS edge — over HI having been under a FIXED LO — on the
// engine's decaying impulses, and those impulses do not fall back to LO while hits overlap, so at double time every
// other hit was silently dropped. (2) the kick carried the KEY's anchor hue, which is not a note at all.
//
// So: five sources, each with a place and a hue.
//   kick   `kickCount` is a COUNTER, so its delta per frame is an edge at ANY rate and N kicks in one frame are N
//          launches — there is nothing to re-arm and nothing to miss. From the CENTRE, in the BASS NOTE's hue
//          (argmax `bchroma`, the bass-only chroma; below BCHMIN there is no bass note and the key's anchor stands in).
//   snare  a RE-ARMED edge: fire when the impulse rises over HI having fallen back to REARM of ITS OWN LAST PEAK
//   hat    (not a fixed floor), with a REFR refractory — so two hits 90 ms apart are two launches. From the sector of
//          the pitch class that ROSE MOST over the last NOTEW (the hat lights all twelve; the sector is where its
//          colour is counted, and it is the same sector the snare would take).
//   onset  the engine's own `onset` (one frame, spectral flux > mean + 1.5 sigma) when no band launched within
//          ONSETW — the synth stab and the vocal onset that no drum detector names.
//   note   a chroma bin whose rise over NOTEW exceeds NOTEK, from ITS OWN sector in ITS OWN hue, with a per-bin
//          NOTEREFR. `chroma` is an ema of 0.25 s, so this is SOFT by construction: it is the secondary source and
//          the drums and the onset are the primary one.
//
// A pitch class pc sits at SECTOR (7 pc) mod 12 — sectorPc(k) = (7k) mod 12 is its inverse, since 7·7 = 49 = 1 mod 12
// (assets/math/keycolour.js's convention). Every hue this module returns is a PALETTE TURN on that sector scale, the
// same number hooks.mxcol().hues carries, so a proof can compare the two without a conversion.

export const BANDN = ['kick', 'snare', 'hat', 'onset', 'note'];
export const NB = 5;
export const MAXQ = 20;        // launches one frame can emit: 4 kicks + snare + hat + onset + 12 notes, rounded up

// --- the manual settings. The user retunes here. -------------------------------------------------------------------
export const HI = 0.45;        // the bar a drum impulse must rise over. #test sets `hat` to EXACTLY 0.5, so it has to
                               // be under 0.5 (HARNESS "Pitfalls"); it is TORUS2's and POLYTOPE's bar as well.
export const REARM = 0.5;      // ... having first fallen back to this much of its own last peak. v0.11's fixed LO
                               // 0.25 is what missed the second of two overlapping hits: a hat at 0.5 decaying with
                               // tau 0.06 s is still over 0.25 for 115 ms, so nothing inside that window could fire.
                               // Measured on #test: a 0.5 hat re-arms in 3 frames (50 ms) against a hat period of
                               // 242 ms at 124 BPM, and in 50 ms against 121 ms at double time.
export const PKTC = 0.5;       // the tracked peak decays with this time constant, so one loud hit does not raise the
                               // re-arm bar for the rest of the track.
export const REFR = 0.07;      // seconds between two launches of one drum band — 70 ms is under a 32nd at 180 BPM
export const KLEV0 = 0.5;      // a kickCount increment whose `kick` level is lower than this still launches at this
export const KMAX = 4;         // ... and no more than this many kicks are taken from one frame's counter delta
export const BCHMIN = 0.08;    // below this much bass chroma there is no bass note: the kick takes the key's anchor
export const NOTEW = 0.15;     // seconds: the window a pitch class's RISE is measured over (an ema of `chroma`)
export const NOTEK = 0.05;     // ... and how far it must rise to be a note onset. MEASURED, not guessed: a 481-frame
                               // (8 s) log of max_pc(chroma[pc] - its own 0.15 s ema) on each demo synth gives the
                               // fraction of frames over a threshold — 0.02: 83/95/87 % (house/aba/dnb), 0.03:
                               // 60/79/63, 0.04: 39/58/41, 0.05: 24/39/27, 0.06: 14/24/20, 0.08: 8/12/8, 0.10:
                               // 6/6/6. At 0.08 the source fired FOUR times in fourteen seconds of house — it was
                               // there but it was not a source. 0.05 is the flat middle: about 2 note launches a
                               // second, against ~13 a second from the drums, which is what "the secondary source"
                               // means. Below 0.03 every bin is rising every frame and the refractory alone holds it.
export const NOTEA = 0.045;    // a note onset's amplitude — the secondary source, well under the snare's 0.11
export const NOTEREFR = 0.20;  // ... and its per-bin refractory
export const ONSETW = 0.05;    // an engine `onset` launches only if no band launched within this many seconds
export const ONSETA = 0.07;    // ... at this amplitude, between the snare's and the note's
export const KSIL = 1.0;       // seconds without a kick launch after which EVERY launch (snare, hat, the engine's onset)
                               // moves to the CENTRE: a breakdown's stabs, chops and hats ring from the middle as thin
                               // shells (sources.js WSIG, ONSETC) instead of dim sector pulses on the ring — SeeYouDrop
                               // 50-58 s read as "no ripples" with the kick silent 6 s while the mids and highs stayed
                               // loud (v0.12.1). The first cut moved the onset alone: two shells in six seconds, at half
                               // a kick's current — a dot, not a ring.
export const ONSC0 = 0.4;      // ... a centre onset's amplitude is max(ONSC0, mid, high): never fainter than this

// --- state ---------------------------------------------------------------------------------------------------------
const PK = new Float64Array(3);        // the tracked peak per drum band (only 1 snare and 2 hat use it)
const ARM = new Int32Array(3);
const LAST = new Float64Array(3);      // ... and the time of its last launch
const CEM = new Float64Array(12);      // the NOTEW ema of `chroma` a rise is measured against
const NLAST = new Float64Array(12);    // the time of each pitch class's last note launch
let T = 0, kc = -1, tBand = -1e9, tKick = -1e9;

export function resetOnsets() {
  PK.fill(0);
  ARM.fill(1);
  LAST.fill(-1e9);
  CEM.fill(0);
  NLAST.fill(-1e9);
  T = 0;
  kc = -1;
  tBand = -1e9;
  tKick = -1e9;
}
resetOnsets();

export const sectorOf = (pc) => ((7 * ((pc % 12) + 12)) % 12);
export const onsetTime = () => T;

// The rising-most pitch class over the last NOTEW, as a SECTOR; -1 when nothing is rising.
function risen(C) {
  let best = -1, bv = 0;
  for (let pc = 0; pc < 12; pc++) { const r = Math.max(0, (C[pc] || 0) - CEM[pc]); if (r > bv) { bv = r; best = pc; } }
  return best < 0 ? -1 : sectorOf(best);
}

// One frame of detection. Fills `Q` with (band, sector, amp, hue) quadruples and returns how many.
//   p     {dt, lev:[kick,snare,hat], kickCount, onset, chroma, bchroma, alive, loud, quiet, bpin, mid, high}
//   hues  the twelve sector hues (index.js GH12) · anchor the key's hue, for a launch with no note of its own
// `quiet` (hooks.quiet(1)) still advances every clock and every ema — a pin that froze them would dump the whole
// backlog as a burst of launches the moment it was released.
export function scan(p, Q, hues, anchor) {
  const dt = Math.max(1e-4, p.dt), C = p.chroma, B = p.bchroma;
  T += dt;
  const ke = 1 - Math.exp(-dt / NOTEW);
  for (let pc = 0; pc < 12; pc++) CEM[pc] += ((C ? C[pc] : 0) - CEM[pc]) * ke;
  const dk = kc < 0 ? 0 : Math.max(0, Math.min(KMAX, (p.kickCount | 0) - kc));
  kc = p.kickCount | 0;
  const pd = Math.exp(-dt / PKTC);
  let n = 0;
  if (p.quiet) { for (let b = 1; b < 3; b++) { PK[b] *= pd; ARM[b] = 1; } return 0; }
  // the kick: a counter delta, from the centre, in the bass note's hue
  if (dk > 0) {
    let bk = -1, bv = BCHMIN;
    if (B) for (let pc = 0; pc < 12; pc++) if (B[pc] > bv) { bv = B[pc]; bk = pc; }
    const sec = p.bpin >= 0 ? p.bpin : bk < 0 ? -1 : sectorOf(bk);
    const hue = sec < 0 ? anchor : hues[sec];
    const amp = Math.min(1, Math.max(KLEV0, p.lev[0]));
    for (let i = 0; i < dk; i++) { Q[4 * n] = 0; Q[4 * n + 1] = -1; Q[4 * n + 2] = amp; Q[4 * n + 3] = hue; n++; }
    tKick = T;
    tBand = T;
  }
  // the snare and the hat: a re-armed edge on the engine's decaying impulse
  const rs = risen(C);
  const sec = rs >= 0 ? rs : p.loud | 0;
  const centre = T - tKick > KSIL;   // the breakdown rule: with the kick silent, everything launches from the middle
  for (let b = 1; b < 3; b++) {
    const x = p.lev[b];
    PK[b] = Math.max(x, PK[b] * pd);
    if (!ARM[b] && x < REARM * PK[b]) ARM[b] = 1;
    if (ARM[b] && x > HI && T - LAST[b] > REFR) {
      ARM[b] = 0;
      LAST[b] = T;
      tBand = T;
      Q[4 * n] = b; Q[4 * n + 1] = centre ? -1 : sec; Q[4 * n + 2] = Math.min(1, x); Q[4 * n + 3] = hues[sec]; n++;
    }
  }
  // anything else that hits: the engine's own onset, when no band spoke for it
  // (from the centre, at the mids'/highs' level, while the kick has been silent KSIL — the breakdown rule)
  if (p.onset && T - tBand > ONSETW && n < MAXQ) {
    tBand = T;
    const amp = centre ? Math.min(1, Math.max(ONSC0, p.mid || 0, p.high || 0)) : 1;
    Q[4 * n] = 3; Q[4 * n + 1] = centre ? -1 : sec; Q[4 * n + 2] = amp; Q[4 * n + 3] = hues[sec]; n++;
  }
  // notes as such: a chroma bin that rose, from its own sector, in its own hue
  if (C && (p.alive === undefined ? 1 : p.alive) > 0.5) {
    for (let pc = 0; pc < 12 && n < MAXQ; pc++) {
      const r = (C[pc] || 0) - CEM[pc];
      if (r <= NOTEK || T - NLAST[pc] <= NOTEREFR) continue;
      NLAST[pc] = T;
      const s = sectorOf(pc);
      Q[4 * n] = 4; Q[4 * n + 1] = s; Q[4 * n + 2] = Math.min(1, r / NOTEK); Q[4 * n + 3] = hues[s]; n++;
    }
  }
  return n;
}

// what the detectors are thinking, as numbers (hooks.mxinfo().det)
export function detInfo() {
  return { t: +T.toFixed(2), kc, pk: [+PK[1].toFixed(3), +PK[2].toFixed(3)], arm: [ARM[1], ARM[2]], cem: Array.from(CEM, (x) => +x.toFixed(3)) };
}
