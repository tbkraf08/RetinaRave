// TORUS2 — colour from the key (brief-torus2 spec 3; the user: the key colour is an ANCHOR, major warm, minor cool).
//
// hueKey = ((7 key) mod 12) / 12 is the circle of fifths, so neighbouring hues are related keys and a modulation to
// the dominant is one twelfth of a turn. The twelve pitch-class families keep their twelve hues, spread around that
// anchor by LOOK.mood.spread, so the whole wheel turns when the key changes.
//
// Major warm / minor cool cannot be a fixed offset: the key has already rotated the wheel anywhere it likes, so an
// offset promises nothing about which half you land in. The anchor is instead PULLed the short way round the wheel
// toward WARM or COOL — the key still picks the hue, the mode decides which half of the wheel it picks it in.
//
// A key change is an 'event'-class change in the music but must not be one on screen: the anchor eases over ~2 s on
// the UNWRAPPED hue (the short way, so C → G is a twelfth of a turn and not eleven twelfths), and `cuts` stays
// 'continuous'. keyConf gates the whole thing: below KEYC1 the last confident key is held and the colour slides back
// toward the mood palette, so a keyless section is never a random hue.

const TAU = Math.PI * 2;
// in this cosine palette (palM of shaders.js) hue 0.02 reads red-orange and 0.55 blue-teal
export const WARM = 0.02;
export const COOL = 0.55;
export const PULL = 0.45;    // how far toward its half the mode drags the key's own hue (0 = key only, 1 = mode only)
export const SATMAJ = 1.15;  // major lifts the saturation ~15 %, minor drops it ~10 %
export const SATMIN = 0.9;
export const VALW = 0.08;    // valence adds ±0.04 turns of warmth on top of the mode (spec 6)
export const HUETC = 0.7;    // the ease: ~2 s to settle (three time constants)
export const KEYC0 = 0.1;
export const KEYC1 = 0.3;    // at or above this the key wins; below it the held key slides to the mood palette

export const OUT = { hue: 0, sat: 1, key: 0, mode: 0, fifth: 0, conf: 0 };
let hueU = 0, satE = 1, lastKey = 0, lastMode = 0, haveKey = 0;

export function reset() {
  hueU = 0;
  satE = 1;
  lastKey = 0;
  lastMode = 0;
  haveKey = 0;
}

const wrap = (x) => x - Math.round(x);   // the short way round a hue wheel measured in turns

// key/mode/keyConf/valence/harmAngle in, the eased anchor out. `pin` is hooks.key's {k, m} or null.
export function anchor(dt, key, mode, keyConf, valence, harmAngle, moodHue, pin) {
  // The fallback for real audio whose key is not trusted: the nearest fifth of harmAngle, mode 0. The circle of
  // fifths sends pitch class k to position (7k mod 12), and 7 is its own inverse mod 12, so the pitch class at
  // fifths position j is (7j mod 12). On #test keyConf is 0.8, so the real key wins there and this is only a fallback.
  const jf = ((Math.round(harmAngle / TAU * 12) % 12) + 12) % 12;
  const fifthKey = (7 * jf) % 12;
  if (keyConf >= KEYC1) { lastKey = key | 0; lastMode = mode | 0; haveKey = 1; }
  const kk = pin ? pin.k : haveKey ? lastKey : fifthKey;
  const km = pin ? pin.m : haveKey ? lastMode : 0;
  const hueKey = ((7 * kk) % 12) / 12;
  const hMode = hueKey + PULL * wrap((km ? COOL : WARM) - hueKey) + VALW * (valence - 0.5);
  const kw = pin ? 1 : Math.min(1, Math.max(0, (keyConf - KEYC0) / (KEYC1 - KEYC0)));
  const hTgt = moodHue + kw * wrap(hMode - moodHue);
  hueU += wrap(hTgt - hueU) * (1 - Math.exp(-dt / HUETC));
  satE += ((km ? SATMIN : SATMAJ) - satE) * (1 - Math.exp(-dt / HUETC));
  OUT.hue = hueU;
  OUT.sat = satE;
  OUT.key = kk;
  OUT.mode = km;
  OUT.fifth = fifthKey;
  OUT.conf = kw;
  return OUT;
}
