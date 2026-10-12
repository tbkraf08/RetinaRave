// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// THE VOICE GATE — one read of the vocal lane for every scene that is not the rig (DECISIONS §127; the plan
// docs/plans/VOX-SCENES-PLAN.md §0). The ears publish three keys (§123 the live CNN, §124 the file-mode Demucs lane):
// `voxS` the presence 0–1, `voxHz` the sung pitch (−1 none), `voxConf` 0–1 (0 = no read at all: the fake timeline, digital
// silence, a trace recorded before §123). A scene multiplies by ONE number, `w`, and colours by ONE pitch class, `pc`.
//
// THE DESIGN CONSTRAINT IS THE LIVE FALSE POSITIVE, not the file picture: the user listens live 90 % of the time, and the
// CNN reads an instrumental as a voice on 17–31 % of its frames (Comptine's solo piano, Vienna's synth leads — §123's table).
// So:
//   w    = sstep(LO .45, HI .85, voxS) — the knee sits ABOVE the live tier's own .3 / .5 gates: §123 puts a no-voice track's
//          voxS p50 at .08–.22 and ≥ .5 on 1–10 % of its frames, a voiced passage at .44–.88; the §124 lane reads ≥ .5 exactly
//          where §122's frame rule says "sung", so one knee serves both sources. No rise ease (the .1 s ease and the ~160 ms
//          lag are already paid — reactive beats predicted, [[feedback-reactive-over-predicted]]); the release REL .3 s.
//   pc   = the sung pitch class, only while voxHz > 0 AND the class has HELD for HOLD s (~two inferences of the CNN, which
//          fires every ~43 ms): a false voice with the YIN gate shut, or a read that flickers between classes, colours
//          nothing. Through a voiced frame with no pitch (a consonant, the gate shut for a moment) the last pc and height
//          HOLD, as the rig's lead does (inject2.js §123). When the voice is gone (w 0) both reset: a re-entry starts at its note.
//   y01  = the pitch as a HEIGHT 0..1 — the rig's own recipe: (1 − OCT)·deg/11 + OCT·clamp(log2(voxHz/110)/4, 0, 1) with deg the
//          scale degree above the key's tonic, eased TAU .35 s (a glide, not a hop); −1 while there is no voice.
//   hue  = the sung note on the circle of fifths with the mode's pull (keycolour's wheel, inject2.js's hueOf), in turns;
//          the KEY's own hue while no pitch has held — so a scene that paints by `hue` paints the key until someone sings.
//   voxConf 0 → w 0, pc −1, y01 −1, the key's hue, the state reset: every read built on this is a NO-OP on the fake timeline,
//          on the traces and in silence — the fake md5 lists cannot move, and `test_voxscene.js` proves the defaults.
//   voxConf is NOT a weight: live voxConf = voxS × periodicity and a piano is periodic — it would pass the case we fear.
//
// Pure, per-caller state (mkVox(), as keycolour's mkAnchor): two scenes in one crossfade never share a release. A scene
// imports only math/* (CONTRACTS §0); this reads S.voxS / voxHz / voxConf / key / mode, which the scene lists in `feats`.
// The knobs: VOXK (`&voxk=lo,hi` on any page, core/harness.js). The rig (inject2.js) keeps its own validated reads.
import { clamp, ema, sstep } from './util.js';
import { COOL, PULL, WARM, wrap } from './keycolour.js';

export const VOXK = {
  LO: 0.45,      // voxS at which the voice begins to show
  HI: 0.85,      // voxS at which it is fully there
  REL: 0.3,      // s: the release after the voice stops (no rise ease)
  HOLD: 0.085,   // s: a pitch class must hold this long before it colours anything (~two CNN inferences)
  OCT: 0.3,      // the octave term's share of the height (the rig's LEAD_OCT)
  TAU: 0.35,     // s: the height's ease between notes (the rig's LEAD_TAU)
  OFF: 0.01,     // w under this on the release is 0: the voice is gone (the tail of an ema never reaches 0 by itself)
};

// The note's hue in turns: the circle of fifths puts pitch class pc at ((7·pc) mod 12) / 12, pulled PULL of the short way
// toward WARM (major) or COOL (minor) — inject2.js's hueOf, verbatim, so the rig and the gate paint one note one colour.
export const hueOf = (pc, minor) => { const h = ((7 * (((pc | 0) % 12) + 12) % 12) % 12) / 12; return h + PULL * wrap((minor ? COOL : WARM) - h); };

export function mkVox() { return { w: 0, pc: -1, y01: -1, hue: 0, hz: -1, deg: -1, cand: -1, held: 0 }; }

// One frame. Reads S.voxS, S.voxHz, S.voxConf, S.key, S.mode; writes and returns `st` ({ w, pc, y01, hue, hz, deg }).
export function vox(st, dt, S) {
  const minor = (S.mode | 0) ? 1 : 0, tonic = ((S.key | 0) % 12 + 12) % 12;
  if (!(S.voxConf > 0)) {   // no read at all: the no-op, exactly
    st.w = 0; st.pc = -1; st.y01 = -1; st.hz = -1; st.deg = -1; st.cand = -1; st.held = 0;
    st.hue = hueOf(tonic, minor);
    return st;
  }
  const tgt = sstep(VOXK.LO, VOXK.HI, clamp(S.voxS || 0, 0, 1));
  st.w = tgt >= st.w ? tgt : ema(st.w, tgt, dt, VOXK.REL);
  if (st.w < VOXK.OFF) st.w = 0;
  if (st.w <= 0) {          // nobody singing: forget the pitch, so a re-entry starts at its own note
    st.pc = -1; st.y01 = -1; st.hz = -1; st.deg = -1; st.cand = -1; st.held = 0;
    st.hue = hueOf(tonic, minor);
    return st;
  }
  const hz = S.voxHz;
  if (hz > 0) {
    const cls = ((Math.round(12 * Math.log2(hz / 440) + 69) % 12) + 12) % 12;
    if (cls === st.cand) st.held += dt; else { st.cand = cls; st.held = 0; }
    if (st.held >= VOXK.HOLD) {
      st.pc = cls; st.hz = hz; st.deg = ((cls - tonic) % 12 + 12) % 12;
      const yT = (1 - VOXK.OCT) * st.deg / 11 + VOXK.OCT * clamp(Math.log2(hz / 110) / 4, 0, 1);
      st.y01 = st.y01 < 0 ? yT : ema(st.y01, yT, dt, VOXK.TAU);
    }
  }
  // hz <= 0 with w > 0: a voiced frame with no pitch — pc / y01 / hz / deg HOLD as they are (−1 if nothing ever held)
  st.hue = hueOf(st.pc >= 0 ? st.pc : tonic, minor);
  return st;
}
