// Director (assets/core/scenes.js updateScenes) driven by a scripted MS, no Chrome / GL: look memory keyed on
// synapse's sectionAlt and beat-quantised soft switches (v0.2 §10).
//   1. the looks and the scene of a section are filed under its sectionAlt when the next boundary is declared, and
//      restored (look.set + a soft switch) when synapse identifies a return (sectionAlt changes, sectionReturn 1)
//   2. with gridTrust > .5 a soft switch is held until barPos wraps (lands < .1 beat after the bar line)
//   3. the hold is capped at 4 beats; grid trust falling below .5 fires it at once; a drop cancels it
//   4. a decision taken on the bar line fires at once; SC.quantise = false restores the immediate switch
//   5. a return recognised inside the 8-beat spacing after a hard cut is still restored once the gate opens
//   6. a boundary that arrives while a switch is held files the decided scene, not the one still on screen
//   7. a phrase hold (16-beat cap) replaced by an identify decision restarts the 4-beat cap instead of firing at once
//   8. (v0.3 §21) synapse renumbers its sections (a fresh one merged, the ring shifted): the filed looks follow the
//      id — a return under the new id restores them; with SC.renumberOn = false (the §10 behaviour) it does not
//   9. (§95) a scene stays at least SC.dwellMin s (drawn in SC.dwell at the landing): phrase and identify triggers inside
//      the dwell do nothing, the first trigger after it switches; drops still cut home inside it
//  10. (§114) FLUID (id 12) joins the bid: the REAL score() of NAV2 / DUST / TORUS2 / FLUID on synthetic profiles — the sub-driven
//      drop window and the sub breakdown are FLUID's by more than the 0.1 hash noise, the steady tonal groove stays TORUS2's, the
//      slow sparse intro DUST's, a build zeroes every away bid; through the director: a surprise cut lands FLUID on the drop
//      profile, a drop / a build / silence still take it home, a neutral profile rotates all three away scenes (nobody starves),
//      the dwell holds FLUID against a profile TORUS2 wins, a forced scene (the panel preset's manual.scene, §94) wins over the bid
//   node tools/test_director.js -> per-step lines + OK / FAIL
import { MS } from '../assets/engine/state.js';
import { SC, REG, register, updateScenes, pickScene } from '../assets/core/scenes.js';
import nav2 from '../assets/scenes/nav2/index.js';     // step 10 reads the four real bids (score() only: no init, no GL)
import dust from '../assets/scenes/dust/index.js';
import torus2 from '../assets/scenes/torus2/index.js';
import fluid from '../assets/scenes/fluid/index.js';

let fails = 0;
const fail = (m) => { fails++; console.log('FAIL', m); };
const ok = (c, m) => { if (!c) fail(m); else console.log('  ok', m); };

// stub scenes: a home scene (always "in its stable state") and two scenes with a look and a section-dependent score
const looks = { one: 'a', two: 'x' }, sets = { one: 0, two: 0 };
const mk = (id, name, score, home) => ({ id, name, home, rt: home ? { home: true } : {}, score, draw() {},
  look: home ? undefined : { get() { return looks[name]; }, set(v) { looks[name] = v; sets[name]++; } } });
register(mk(0, 'home', (S) => 0.5 + S.build, true));
register(mk(1, 'one', (S) => (S.sectionAlt === 2 ? 0.9 : 0.1)));
register(mk(2, 'two', (S) => (S.sectionAlt === 3 ? 0.9 : 0.1)));

// clock: 120 BPM, 60 Hz → 30 frames per beat; the grid mirrors the fake timeline (barPos from the beat count)
const S = MS, DT = 1 / 60;
SC.dwell = [0, 0]; SC.dwellMin = 0; // §95 off for steps 1–8 (their switches are beats apart); step 9 turns it on
S.presence = 1; S.bpm = 120; S.build = 0; S.beatCount = 0; S.beatPhase = 0; S.gridTrust = 0; S.sectionAlt = -1;
let grid = true; // false = the bar position stops advancing (a stalled grid, to exercise the cap)
function frame(ev = {}) {
  S.beat = S.dropEvt = S.sectionEvt = S.identifyEvt = S.boundaryEvt = S.surpriseEvt = false;
  S.sectionRenumber = null; // per-frame, like the synapse stage
  S.beatPhase += DT * S.bpm / 60;
  if (S.beatPhase >= 1) { S.beatPhase -= 1; S.beatCount++; S.beat = true; }
  if (grid) { S.barPos = (S.beatCount % 4) + S.beatPhase; S.phrase16Pos = (S.beatCount % 16) + S.beatPhase; }
  Object.assign(S, ev);
  updateScenes(DT, S);
  if (SC.next < 0 && SC.m === 0) { /* no fade */ }
}
const beats = (n, ev) => { for (let i = 0; i < n * 30; i++) frame(i === 0 ? ev : {}); };
const beat = () => S.beatCount + S.beatPhase;
const boundary = () => frame({ boundaryEvt: true, sectionEvt: true });
const identify = (alt, ret, v3 = false) => frame({ sectionAlt: alt, sectionReturn: ret, identifyEvt: v3, repeat: v3 && !!ret });
const align = () => { do frame(); while (!(S.beat && S.beatCount % 4 === 0)); }; // the frame after a bar line (barPos ≈ .03)
// sections are 24 beats long: switches stay < 32 beats apart so v3's phrase trigger never fires on its own

console.log('1. look memory keyed on sectionAlt');
beats(1); boundary(); beats(4);                          // section 2 begins, identified 4 beats later (new)
identify(2, 0, true);                                    // v3 also fires identifyEvt here (new section)
ok(SC.logical === 1, 'new section 2: pickScene chose scene 1 (logical ' + SC.logical + ')');
looks.one = 'A1'; looks.two = 'X1';                      // the scenes change their looks while section 2 plays
beats(18); boundary();                                   // section 3 begins → section 2 filed
ok(SC.mem[2] && SC.mem[2].scene === 1 && SC.mem[2].looks.one === 'A1' && SC.mem[2].looks.two === 'X1', 'boundary filed section 2 under alt 2: ' + JSON.stringify(SC.mem[2]));
beats(4); identify(3, 0, true);
ok(SC.logical === 2, 'new section 3: pickScene chose scene 2 (logical ' + SC.logical + ')');
looks.one = 'B1'; looks.two = 'Y1';
beats(18); boundary(); beats(4);
const s0 = sets.one + sets.two, lg0 = SC.logical;
identify(2, 1);                                          // synapse alone recognises the return (v3 stays silent)
ok(SC.restored && SC.restored.alt === 2 && SC.restored.scene === 1, 'return of 2: RESTORE recorded ' + JSON.stringify(SC.restored));
ok(looks.one === 'A1' && looks.two === 'X1' && sets.one + sets.two === s0 + 2, 'looks restored to section 2\'s (' + looks.one + ',' + looks.two + ')');
ok(SC.logical === 1 && lg0 === 2, 'the remembered scene 1 came back at once (gridTrust 0)');
ok(S.seed.scene === 1, 'S.seed.scene still written (' + S.seed.scene + ')');
ok(SC.mem[3] && SC.mem[3].scene === 2 && SC.mem[3].looks.one === 'B1', 'section 3 was filed with its own scene and looks');
beats(18); boundary();

console.log('2. soft switch held to the bar line');
S.gridTrust = 0.9;
beats(4); align(); beats(1.1);                           // identify ≈ 1.1 beats into a bar
const b0 = beat();
identify(3, 1);
ok(SC.pend && SC.pend.id === 2 && SC.logical === 1, 'switch to 2 pending (barPos ' + S.barPos.toFixed(2) + ')');
let landed = -1, landBar = -1, held = -1;
for (let i = 0; i < 30 * 5 && landed < 0; i++) { frame(); if (SC.switched) { landed = beat() - b0; landBar = S.barPos; held = SC.switched.held; } }
ok(landed > 0 && landBar < 0.1 && SC.logical === 2, `landed ${landed.toFixed(2)} beats later at barPos ${landBar.toFixed(3)} (held ${held.toFixed(2)})`);
ok(Math.abs(held - landed) < 0.05, 'held count matches the wait');

console.log('3. cap, grid loss, drop');
beats(18); boundary(); beats(4); align(); beats(1.5);
grid = false; S.barPos = 1.5; S.phrase16Pos = 5.5;       // a grid that stops advancing: the bar line never comes
identify(2, 1);
ok(SC.pend && SC.pend.id === 1, 'pending on a stalled grid');
const c0 = beat(); landed = -1;
for (let i = 0; i < 30 * 6 && landed < 0; i++) { frame(); if (SC.switched) landed = beat() - c0; }
ok(landed > 3.9 && landed < 4.1 && SC.logical === 1, 'cap fired after ' + landed.toFixed(2) + ' beats');
grid = true;
beats(18); boundary(); beats(4); align(); beats(1.5); identify(3, 1);
ok(SC.pend && SC.pend.id === 2, 'pending again');
frame({ gridTrust: 0.2 });
ok(!SC.pend && SC.logical === 2 && SC.switched && SC.switched.held < 0.1, 'grid trust < .5 fired it at once');
S.gridTrust = 0.9;
beats(18); boundary(); beats(4); align(); beats(1.5); identify(2, 1);
ok(SC.pend && SC.pend.id === 1, 'pending before a drop');
frame({ dropEvt: true, dropStrength: 1 });
ok(!SC.pend && SC.logical === 0, 'drop hard-cut home and cancelled the pending switch');
let stray = false;
for (let i = 0; i < 30 * 5; i++) { frame(); if (SC.switched) stray = true; }
ok(!stray && SC.logical === 0, 'no stray switch after the cancel');

console.log('4. on the line / quantise off');
beats(18); boundary(); beats(4); align(); identify(3, 1); // identification right after a bar line (barPos < .1)
ok(!SC.pend && SC.logical === 2 && SC.switched && SC.switched.held === 0, 'a decision on the bar line fires at once (barPos ' + S.barPos.toFixed(3) + ')');
SC.quantise = false;
beats(18); boundary(); beats(4); align(); beats(1.5); identify(2, 1); // section 2 last ended on home (after the drop)
ok(!SC.pend && SC.logical === 0 && SC.mem[2].scene === 0, 'quantise off: immediate switch mid-bar to the filed scene (barPos ' + S.barPos.toFixed(2) + ')');
SC.quantise = true;

console.log('5. a return recognised right after a hard cut is still owed');
beats(18); boundary(); beats(1);
frame({ surpriseEvt: true });                            // v3's surprise hard cut, 3 beats before the identification
const cut = beat(), cutTo = SC.logical;
beats(3); identify(3, 1);
ok(SC.due === 3 && !SC.pend && SC.logical === cutTo, 'return of 3 recognised, switch gated by the 8-beat spacing, owed');
landed = -1; landBar = -1; let why = '';
for (let i = 0; i < 30 * 14 && landed < 0; i++) { frame(); if (SC.switched) { landed = beat() - cut; landBar = S.barPos; why = SC.switched.why; } }
ok(landed >= 7 && landed <= 12 && landBar < 0.1 && why === 'return' && SC.logical === SC.mem[3].scene && SC.due < 0, `owed switch landed ${landed.toFixed(2)} beats after the cut at barPos ${landBar.toFixed(3)} (${why}) → scene ${SC.logical}`);

console.log('6. a switch held across a boundary is filed as the section\'s scene');
beats(18); boundary(); beats(4); align(); beats(2.5); identify(2, 1); // return of 2 → its filed scene, held 1.5 beats
const want = SC.pend && SC.pend.id;
ok(SC.pend && want !== SC.logical, 'pending ' + want + ' while ' + SC.logical + ' is on screen');
boundary();                                              // the section ends before the bar line
ok(SC.mem[2].scene === want, 'boundary filed the decided scene ' + SC.mem[2].scene + ', not the one on screen');

console.log('7. a phrase hold replaced by an identify decision lands on the next bar line');
S.gridTrust = 0.9;
beats(18); boundary(); beats(4); align(); identify(3, 1); // return of 3 on the line: immediate
REG[0].scene.rt.awayBeat = 1;                            // v3's phrase trigger fires at (beatCount − awayBeat) % 16 === 0: one beat into a 16-beat phrase
let ph = -1;                                             // wait for it: ≥ 32 beats quiet, then that beat
for (let i = 0; i < 30 * 60 && ph < 0; i++) { frame(); if (SC.pend) ph = beat(); }
ok(SC.pend && SC.pend.phrase, 'phrase-triggered hold pending (why ' + (SC.pend && SC.pend.why) + ', barPos ' + S.barPos.toFixed(2) + ', phrase16Pos ' + S.phrase16Pos.toFixed(2) + ')');
beats(5.5);                                              // 5.5 beats into the phrase hold (its own cap is 16)
ok(SC.pend && SC.pend.phrase, 'still held after 5.5 beats');
frame({ identifyEvt: true, repeat: false });             // v3 identifies: a bar hold replaces the phrase hold
ok(SC.pend && !SC.pend.phrase && !SC.switched, 'replaced by a bar hold, not fired at once (held so far ' + (beat() - ph).toFixed(1) + ' beats)');
landed = -1; landBar = -1;                               // the hold clears when it lands (its target may be the scene already on screen: a return pins it)
const r0 = beat();
for (let i = 0; i < 30 * 5 && landed < 0; i++) { frame(); if (!SC.pend) { landed = beat() - r0; landBar = S.barPos; } }
ok(landed >= 0 && landed < 4 && landBar < 0.1, `landed on the bar line at barPos ${landBar.toFixed(3)}, ${landed.toFixed(2)} beats after the replacement`);

// 8. renumbering (§21): file under alt 5, then synapse drops id 3 (map: 0..2 → same, 3 → −1, 4 → 3, 5 → 4); a return
//    identified as alt 4 must restore the looks filed under 5; with renumberOn = false the stale key 5 stays and 4 misses
{
  const runCase = (on) => {
    SC.renumberOn = on; SC.mem = {}; SC.prevAlt = -1; SC.altOpen = false; SC.due = -1; SC.forced = -1;
    beats(9); identify(5, 0); beats(9);
    looks.one = 'filed-under-5'; boundary(); beats(9);           // files alt 5 with the current looks
    identify(6, 0); beats(9);
    looks.one = 'changed';
    frame({ sectionRenumber: [0, 1, 2, -1, 3, 4, 5], sectionAlt: 5 }); // 3 dropped, 4 → 3, 5 → 4, 6 → 5 (synapse reports the current one as 5 in the same frame)
    beats(2);
    const before = sets.one; boundary(); beats(2); identify(4, 1); beats(1);
    return { restored: looks.one, keys: Object.keys(SC.mem).join(','), sets: sets.one - before, rec: SC.restored };
  };
  const on = runCase(true), off = runCase(false);
  console.log(`  renumber on: keys ${on.keys} looks ${on.restored} · off: keys ${off.keys} looks ${off.restored}`);
  ok(on.keys === '4,5', 'renumber on: the keys 5,6 became 4,5 (' + on.keys + ')');
  ok(on.restored === 'filed-under-5', 'renumber on: restored looks are the filed ones');
  ok(off.restored !== 'filed-under-5', 'renumber off (§10): the return under 4 finds nothing (the stale restore the brief measured)');
}
console.log('9. dwell (§95): the event branch waits dwellMin seconds');
{
  SC.renumberOn = true; S.gridTrust = 0; SC.due = -1; SC.pend = null; SC.dwell = [30, 30];
  while (S.beatCount - SC.lastBeat < 8 || SC.since < SC.dwellMin || SC.next >= 0) frame(); // open every gate (a phrase landing on the way draws 30 and is waited out)
  S.sectionAlt = SC.logical === 1 ? 3 : 2;                                  // the stub that bids .9 is not the one on screen
  frame({ surpriseEvt: true });                                              // a hard cut lands now and draws the dwell
  const lg = SC.logical;
  ok(lg === (S.sectionAlt === 3 ? 2 : 1) && SC.dwellMin === 30 && SC.since < 0.1, 'landed on ' + lg + ' with dwellMin 30 (since ' + SC.since.toFixed(2) + ')');
  beats(40);                                                                 // 20 s: the phrase trigger passes (32 beats, every 16) — blocked
  ok(SC.logical === lg && !SC.pend, 'no switch in the first 20 s (logical ' + SC.logical + ', since ' + SC.since.toFixed(1) + ')');
  boundary(); beats(4); identify(lg === 1 ? 3 : 2, 0, true);               // an identify at 22 s — blocked
  ok(SC.logical === lg, 'an identify inside the dwell does nothing');
  beats(14);                                                                 // 29 s: still inside
  ok(SC.logical === lg && SC.since > 28, 'still ' + lg + ' at ' + SC.since.toFixed(1) + ' s');
  beats(20);                                                                 // 39 s: the first phrase line after the dwell switches
  ok(SC.logical !== lg, 'switched after the dwell (logical ' + SC.logical + ')');
  ok(SC.since < 10 && SC.dwellMin === 30, 'the dwell clock restarted at that landing (since ' + SC.since.toFixed(1) + ' s)');
  beats(2); frame({ dropEvt: true });
  ok(SC.logical === 0, 'a drop still cuts home inside the dwell');
  SC.dwell = [0, 0];
}
console.log('10. FLUID joins the bid (§114): the real fit model of NAV / DUST / TORUS2 / FLUID');
{
  // the stubs keep their ids and rt; their bids become the real ones (the stub 2 goes forced-only, as MANDALA is since §93)
  REG[0].scene.score = nav2.score; REG[1].scene.score = dust.score; REG[2].scene.score = () => 0;
  register(mk(3, 'torus2', torus2.score)); register(mk(12, 'fluid', fluid.score));
  ok(nav2.id === 0 && dust.id === 1 && torus2.id === 3 && fluid.id === 12, 'the four real scenes carry the roster ids 0 / 1 / 3 / 12');
  const ROSTER = [0, 1, 3, 12], NAME = { 0: 'NAV', 1: 'DUST', 3: 'TORUS2', 12: 'FLUID' };
  // §93's synthetic profiles, extended by the three fields FLUID's bid reads (bassS, keyConf, centroid)
  const PROF = {
    'sub-driven drop window': { bassS: 0.95, keyConf: 0.4, centroid: 0.35, clarity: 0.5, regularity: 0.8, punchy: 0.6, calm: 0.1 },
    'sub breakdown':          { bassS: 0.85, keyConf: 0.3, centroid: 0.25, clarity: 0.3, regularity: 0.5, punchy: 0.3, calm: 0.3 },
    'steady tonal groove':    { bassS: 0.8, keyConf: 0.5, centroid: 0.5, clarity: 0.9, regularity: 0.9, punchy: 0.3, calm: 0.3 },
    'slow sparse intro':      { bassS: 0.2, keyConf: 0.2, centroid: 0.5, clarity: 0.4, regularity: 0.3, punchy: 0.8, calm: 0.7 },
    'calm tonal pad':         { bassS: 0.3, keyConf: 0.6, centroid: 0.4, clarity: 0.8, regularity: 0.2, punchy: 0.1, calm: 0.8 },
    'dense peak':             { bassS: 0.9, keyConf: 0.5, centroid: 0.6, clarity: 0.7, regularity: 0.9, punchy: 0.7, calm: 0.05 },
    'noise, no bass':         { bassS: 0.1, keyConf: 0.1, centroid: 0.8, clarity: 0.2, regularity: 0.3, punchy: 0.4, calm: 0.3 },
    'neutral':                { bassS: 0.5, keyConf: 0.3, centroid: 0.5, clarity: 0.5, regularity: 0.5, punchy: 0.5, calm: 0.5 },
  };
  const set = (name, arc = 'peak') => Object.assign(S, PROF[name], { arc, buildLive: 0 });
  const bids = () => { const b = {}; for (const id of ROSTER) b[id] = REG[id].scene.score(S, REG[id].scene.rt, SC); return b; };
  const lead = (b, id) => b[id] - Math.max(...ROSTER.filter((i) => i !== id).map((i) => b[i])); // the margin over the runner-up (the hash noise is 0.1)
  const fmt = (b) => ROSTER.map((id) => NAME[id] + ' ' + b[id].toFixed(3)).join(' · ');
  for (const name in PROF) { set(name); console.log('    ' + name.padEnd(24) + fmt(bids())); }
  // a. the formulas alone: territories with a margin wider than the noise
  set('sub-driven drop window'); let b = bids();
  ok(lead(b, 12) > 0.1, 'drop window: FLUID leads by ' + lead(b, 12).toFixed(3) + ' (> 0.1, the hash noise)');
  set('sub breakdown'); b = bids();
  ok(lead(b, 12) > 0.1, 'sub breakdown: FLUID leads by ' + lead(b, 12).toFixed(3));
  set('steady tonal groove'); b = bids();
  ok(lead(b, 3) > 0.1, 'steady tonal groove: TORUS2 keeps it by ' + lead(b, 3).toFixed(3));
  set('slow sparse intro'); b = bids();
  ok(lead(b, 1) > 0.2, 'slow sparse intro: DUST keeps it by ' + lead(b, 1).toFixed(3));
  set('noise, no bass'); b = bids();
  ok(b[12] < 0.5, 'noise with no bass: FLUID bids low (' + b[12].toFixed(3) + ' — the grammar injects nothing there, §111 item 8)');
  set('sub-driven drop window', 'build'); b = bids();
  ok(b[1] === 0 && b[3] === 0 && b[12] === 0 && b[0] === 0.5, 'a build zeroes every away bid (NAV ' + b[0] + '), home parks by precedence');
  // b. pickScene on a clean history, every section hash: the drop window is FLUID's whatever the noise draws
  SC.hist = []; let wins = 0;
  set('sub-driven drop window');
  for (let sid = 0; sid < 50; sid++) { S.sectionId = sid; if (pickScene(S) === 12) wins++; }
  ok(wins === 50, 'pickScene picks FLUID on the drop window for 50 of 50 section hashes (' + wins + ')');
  set('steady tonal groove'); wins = 0;
  for (let sid = 0; sid < 50; sid++) { S.sectionId = sid; if (pickScene(S) === 3) wins++; }
  ok(wins === 50, 'pickScene picks TORUS2 on the steady groove for 50 of 50 (' + wins + ')');
  set('sub-driven drop window', 'build'); wins = 0;
  for (let sid = 0; sid < 50; sid++) { S.sectionId = sid; if (pickScene(S) === 0) wins++; }
  ok(wins === 50, 'in a build pickScene returns home for 50 of 50 (every away bid 0)');
  // c. nobody starves: the neutral profile through the −0.6 / −0.25 history dock rotates the three away scenes
  set('neutral'); SC.hist = []; const seen = {};
  for (let k = 0; k < 12; k++) { S.sectionId = 100 + k; const id = pickScene(S); seen[id] = (seen[id] || 0) + 1; SC.hist.unshift(id); SC.hist.length = Math.min(SC.hist.length, 3); }
  const seenS = ROSTER.map((id) => NAME[id] + ' ' + (seen[id] || 0)).join(' · ');
  ok(seen[1] >= 3 && seen[3] >= 3 && seen[12] >= 3, '12 neutral picks rotate DUST / TORUS2 / FLUID (' + seenS + ')');
  ok(!(seen[1] > 5 || seen[3] > 5 || seen[12] > 5), 'no away scene takes more than 5 of the 12');
  // d. through the director: the groove on TORUS2, the drop cuts home, the window after it is FLUID's; the structure still takes
  //    FLUID home. awayBeat 0.5 on the home stub: v3's phrase trigger (every 16 beats from the beat home was left, step 7 set 1) can
  //    never land on a whole beat, so every pick below is the trigger this step fires. The history dock (−0.6 / −0.25) is real:
  //    a scene just shown, forced or picked, is docked — the sequences put FLUID two scenes back before asking the bid for it.
  const reset = () => { SC.mem = {}; SC.prevAlt = -1; SC.altOpen = false; SC.due = -1; SC.pend = null; SC.forced = -1; SC.hist = []; S.sectionAlt = -1; S.repeat = false; S.seed.scene = -1; S.build = 0; S.presence = 1; S.gridTrust = 0; S.sectionId = 7; REG[0].scene.rt.awayBeat = 0.5; REG[0].scene.rt.settledAt = 0; };
  const open = () => { while (S.beatCount - SC.lastBeat < 8 || SC.since < SC.dwellMin || SC.next >= 0) frame(); };
  SC.dwell = [0, 0]; reset(); set('steady tonal groove'); open();
  frame({ surpriseEvt: true });
  ok(SC.logical === 3, 'the groove: a surprise cut lands TORUS2 (logical ' + SC.logical + ')');
  set('sub-driven drop window'); frame({ dropEvt: true });
  ok(SC.logical === 0, 'the drop hard-cuts home');
  open(); frame({ identifyEvt: true });                                                 // v3 identify, no memory: pickScene
  ok(SC.logical === 12, 'the identify in the window after the drop picks FLUID (hist ' + SC.hist.join(',') + ')');
  open(); frame({ dropEvt: true });
  ok(SC.logical === 0, 'a drop hard-cuts home from FLUID');
  reset(); set('sub-driven drop window'); open(); frame({ surpriseEvt: true }); open();
  ok(SC.logical === 12 && SC.next < 0, 'on FLUID, the fade done');
  S.build = 0.6; frame();
  ok(SC.logical === 0, 'a build parks home from FLUID (logical ' + SC.logical + ')');
  reset(); set('sub-driven drop window'); open(); frame({ surpriseEvt: true }); open();
  ok(SC.logical === 12 && SC.next < 0, 'on FLUID again');
  S.presence = 0.05; frame();
  ok(SC.logical === 0, 'silence drifts home from FLUID (logical ' + SC.logical + ')');
  S.presence = 1;
  // e. the dwell holds FLUID against a profile TORUS2 wins
  SC.dwell = [30, 30]; reset(); set('sub-driven drop window'); open();
  frame({ surpriseEvt: true });
  ok(SC.logical === 12 && SC.dwellMin === 30, 'landed FLUID with dwellMin 30 (logical ' + SC.logical + ')');
  set('steady tonal groove');                                                          // TORUS2's profile from now on
  beats(20); frame({ identifyEvt: true }); beats(20); frame({ identifyEvt: true });    // identifies at 10 s and 20 s
  ok(SC.logical === 12 && !SC.pend, 'two identifies inside the dwell leave FLUID on (since ' + SC.since.toFixed(1) + ' s)');
  beats(22); frame({ identifyEvt: true });                                              // 31 s: the gate is open
  ok(SC.logical === 3, 'the first identify after the dwell switches to TORUS2 (logical ' + SC.logical + ')');
  SC.dwell = [0, 0];
  // f. a forced scene wins over the bid (the panel's force / its preset's manual.scene, §94): no pick while it stands
  reset(); open(); set('sub-driven drop window');
  SC.forced = 1; frame();
  ok(SC.logical === 1, 'forced DUST shows DUST on the drop window (logical ' + SC.logical + ')');
  open(); frame({ surpriseEvt: true }); frame({ identifyEvt: true }); frame({ dropEvt: true });
  ok(SC.logical === 1 && !SC.switched, 'a surprise, an identify and a drop move nothing while DUST is forced');
  SC.forced = 12; frame();
  set('steady tonal groove'); open(); frame({ identifyEvt: true });
  ok(SC.logical === 12, 'forced FLUID stays on the steady groove TORUS2 would win');
  SC.forced = 1; frame(); open(); frame({ identifyEvt: true });
  ok(SC.logical === 1, 'forced back to DUST, the identify moves nothing');
  SC.forced = -1; SC.hist = [1];                                                        // released after a long forced stay: the history is the scene just shown
  set('sub-driven drop window'); open(); frame({ identifyEvt: true });
  ok(SC.logical === 12, 'released: the next identify picks by the bid — FLUID on the drop window (logical ' + SC.logical + ')');
  set('steady tonal groove'); open(); frame({ identifyEvt: true });
  ok(SC.logical === 3, 'and TORUS2 on the groove (logical ' + SC.logical + ')');
}
console.log(fails ? `test_director: ${fails} FAIL` : 'test_director: OK');
process.exit(fails ? 1 : 0);
