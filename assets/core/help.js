// Help view (v0.2 §12): the `?` overlay — the machine explains itself. DOM only, the second module after hud.js that
// touches it. Built lazily on the first open; while hidden nothing here runs per frame (drawHelp returns on its first
// line). Every word shown is data: FEATS (engine/feats.js) for the MS vector, each scene's tag / cuts / feats / help /
// help.feats / hud() (CONTRACTS §1.13), the registry for the cast, SC for the director. Nothing here changes what the
// engine or the director decides: same frames, same md5s, the canvas keeps rendering underneath.
import { AU } from '../engine/audio.js';
import { ENGINE } from '../engine/engine.js';
import { MS } from '../engine/state.js';
import { FEATS } from '../engine/feats.js';
import { SC, REG, TRANSITIONS, currentTransition } from './scenes.js';
import { EFFECTS } from './post.js';
import { REC } from './rec.js'; // the recorder's key row is offered unless &rec=0 (DECISIONS §89)
import { buildE, refreshE, markE, closeE } from './panel.js'; // part E, the routes panel (v0.4; panel.js never imports help.js)

// on: shown · scene: the logical id part A (and E's mark) was built for · ticks: live refreshes so far (the harness counts them) ·
// nTop: rows in the top table · rows(topOnly): the field names in part A's tables, read back from the DOM
export const HELP = { on: false, scene: -1, ticks: 0, nTop: 0, built: false, rows };

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};
const CUTS = { // the §1.9 promise, in words
  continuous: 'continuous — nothing on screen ever jumps; all motion is springs and averages of the music',
  onset: 'onset — visible jumps only on hits and beats',
  event: 'event — jumps only on drops, section changes, surprises and declared epochs',
};
// The key table: [key, long (part D), short (the landing card's hint row — core/hud.js renders it from here, so the two never drift)].
// A function, not a const: the scene digit range reads REG.length, and scenes register after this module loads.
export const keys = () => [['?', 'or H — this view', 'help'],
  ['P', 'this view opened at part E, the routes panel (what drives what, by hand)', 'routes panel'], ['Esc', 'close it', null],
  ['D', 'the developer HUD (numbers, every 6th frame)', 'dev HUD'], ['F', 'fullscreen (or double-click)', 'fullscreen'],
  ['M', 'monitor the demo synth in the speakers', 'monitor demo'],
  ['L', 'the lead on / off: the beat, bar and phrase clocks moved onto the audio you hear (on by default; &lead=0 starts with it off)', null],
  ['1–' + Math.min(9, REG.length), 'force the scene with id 0 – ' + (Math.min(9, REG.length) - 1) + ' (the ids are in part C)', 'force a scene'],
  ['N', 'the next scene, cycling through all ' + REG.length + ' (a swipe on a phone does the same)', 'next scene'],
  ...(REC.hidden ? [] : [['R', 'record what you see and hear to a file on this device — nothing is uploaded; the music you capture is yours to clear', 'record']]),
  ['0', 'back to the director', 'director']];
const EV = Object.keys(FEATS).filter((k) => FEATS[k].kind === 'event'); // latched per frame while open (they last one frame)

let live = {}, hot = {}, hudLine = null, bRows = {}, marks = {};

const upper = (s) => String(s).toUpperCase();
const sceneName = (E) => upper(E.scene.name) + (E.variant ? ' / ' + upper(E.variant.name) : '');
const nameOf = (id) => (id >= 0 && REG[id] ? sceneName(REG[id]) : '—');

function fmt(x, kind) {
  if (typeof x === 'boolean') return x ? 'yes' : 'no';
  if (typeof x === 'number') {
    if (!isFinite(x)) return String(x);
    if (kind === 'count') return String(Math.round(x));
    return Math.abs(x) >= 100 ? x.toFixed(0) : x.toFixed(kind === 'level' ? 2 : 3);
  }
  if (typeof x === 'string') return x;
  if (x == null) return '—';
  if (x.length !== undefined) return '[' + x.length + ']';
  if (typeof x === 'object') return '{' + Object.keys(x).join(' ') + '}';
  return String(x);
}

// Part A's split of the MS vector for a scene: the fields it declares in `feats` on top, the rest below, FEATS order,
// internal fields hidden. Deterministic and total: every non-internal key lands in exactly one list.
function split(sc) {
  const top = [], rest = [], f = new Set(sc.feats || []);
  for (const k in FEATS) if (FEATS[k].kind !== 'internal') (f.has(k) ? top : rest).push(k);
  return { top, rest };
}

function table(keys, drivesHere, header) {
  const t = el('table', 'htab'), hr = el('tr');
  for (const c of ['field', 'what it is', header, 'how it is computed', 'live']) hr.appendChild(el('th', null, c));
  t.appendChild(hr);
  for (const k of keys) {
    const f = FEATS[k], tr = el('tr');
    tr.appendChild(el('td', 'hk', k));
    tr.appendChild(el('td', 'he', f.eli5));
    const d = drivesHere ? drivesHere[k] : null;
    tr.appendChild(el('td', 'hd' + (d ? ' here' : ''), d || (f.drives === '-' ? 'not used by any scene yet' : f.drives)));
    const c = el('td', 'hf'), code = el('code', null, f.formula);
    code.title = f.formula;
    c.appendChild(code);
    tr.appendChild(c);
    const lv = el('td', 'hl'), v = el('span', f.kind === 'event' ? 'hv hev' : 'hv');
    lv.appendChild(v);
    let fill = null;
    if (f.kind === 'level') {
      const b = el('div', 'hbar');
      fill = el('div', 'hfill');
      b.appendChild(fill);
      lv.appendChild(b);
    }
    tr.appendChild(lv);
    t.appendChild(tr);
    live[k] = { v, fill, kind: f.kind };
  }
  return t;
}

// (A) the current scene: tag, three depths, cuts, its hud() line, then its fields with what they drive *here*
function buildA() {
  const E = REG[SC.logical], sc = E.scene, h = sc.help || {}, A = $('helpA');
  HELP.scene = SC.logical;
  A.replaceChildren();
  live = {};
  A.appendChild(el('h2', null, 'A · what is driving what — ' + sceneName(E) + ' (id ' + E.id + (SC.forced >= 0 ? ', forced by key)' : ', chosen by the director)')));
  A.appendChild(el('p', 'htag', E.variant ? E.variant.tag : sc.tag));
  A.appendChild(el('p', 'heli', h.eli5));
  A.appendChild(el('p', 'hwhy', h.why));
  const det = el('details');
  det.appendChild(el('summary', null, 'the mathematics'));
  det.appendChild(el('p', 'hmath', h.math));
  A.appendChild(det);
  A.appendChild(el('p', 'hnote', 'cuts: ' + (CUTS[sc.cuts] || sc.cuts)));
  hudLine = sc.hud ? A.appendChild(el('p', 'hnote hhud')) : null;
  const { top, rest } = split(sc);
  HELP.nTop = top.length;
  A.appendChild(el('p', 'hnote', 'the ' + top.length + ' fields this scene reads (bright column: what each one moves on this screen; a dim entry is the field\'s general role — no per-scene line yet)'));
  A.appendChild(table(top, h.feats || {}, 'what it drives here'));
  const d2 = el('details');
  d2.appendChild(el('summary', null, 'the other ' + rest.length + ' fields the engine produces (not read by this scene)'));
  d2.appendChild(table(rest, null, 'what it drives elsewhere'));
  A.appendChild(d2);
}

function refreshLive(frameN) {
  for (const k in live) {
    const L = live[k], x = MS[k];
    if (L.kind === 'event') {
      const lit = frameN - (hot[k] === undefined ? -1e9 : hot[k]) < 30; // fired within the last half second
      L.v.textContent = lit ? '● just now' : '○ waiting';
      L.v.classList.toggle('lit', lit);
      continue;
    }
    L.v.textContent = fmt(x, L.kind);
    if (L.fill) L.fill.style.transform = 'scaleX(' + Math.min(1, Math.max(0, +x || 0)).toFixed(3) + ')';
  }
  if (hudLine) hudLine.textContent = 'developer readout: ' + REG[SC.logical].scene.hud();
}

// (B) the director: what is on screen and why, the fade, a held switch, the look memory, the engine's stages and cost
function buildB() {
  const B = $('helpB');
  B.replaceChildren();
  B.appendChild(el('h2', null, 'B · the director'));
  const dl = el('dl', 'hdl');
  bRows = {};
  for (const [k, label] of [['scene', 'on screen'], ['fade', 'crossfade'], ['held', 'held switch'], ['mem', 'look memory'], ['engine', 'engine'], ['fx', 'effect chain']]) {
    dl.appendChild(el('dt', null, label));
    bRows[k] = dl.appendChild(el('dd'));
  }
  B.appendChild(dl);
}

function refreshB() {
  const tr = currentTransition(), P = SC.pend, mem = Object.keys(SC.mem);
  bRows.scene.textContent = nameOf(SC.logical) + (SC.forced >= 0 ? ' — forced by key' : ' — chosen by the director')
    + ' · rendered: ' + nameOf(SC.cur) + (SC.next >= 0 ? ' and ' + nameOf(SC.next) : '')
    + (SC.variant ? ' · variant ' + SC.variant + ' mix ' + SC.vmix.toFixed(2) : '')
    + ' · history ' + SC.hist.map(nameOf).join(' ← ');
  bRows.fade.textContent = SC.next >= 0
    ? nameOf(SC.cur) + ' → ' + nameOf(SC.next) + ' at m ' + SC.m.toFixed(3) + ' of a ' + SC.dur.toFixed(2) + ' s fade through ' + tr.name
    : 'none — the next one runs through ' + tr.name + ' (registered: ' + Object.keys(TRANSITIONS).join(', ') + ')';
  bRows.held.textContent = P
    ? '→ ' + nameOf(P.id) + ' (' + P.why + '), waiting for the ' + (P.phrase ? '16-beat line' : 'bar line') + ' since beat ' + P.beat0.toFixed(1)
      + ' · barPos ' + MS.barPos.toFixed(2) + ' · gridTrust ' + MS.gridTrust.toFixed(2)
    : 'none' + (SC.quantise ? ' — a soft switch waits for the bar line while gridTrust > .5 (now ' + MS.gridTrust.toFixed(2) + ')' : ' — quantise off');
  bRows.mem.textContent = mem.length
    ? 'filed: ' + mem.map((a) => 'section ' + a + ' → ' + nameOf(SC.mem[a].scene)).join(' · ') + ' · now in section ' + MS.sectionAlt + (MS.sectionReturn === 1 ? ' (a return)' : '')
    : 'nothing filed yet — synapse has not declared a section boundary (sectionAlt ' + MS.sectionAlt + ')';
  bRows.engine.textContent = 'source ' + AU.mode + ' · stages: ' + (ENGINE.fakeOn ? 'fake timeline' : 'v3 extractor')
    + ENGINE.stages.map((s) => ' + ' + s.name).join('') + ' · ' + ENGINE.ms.toFixed(2) + ' ms per frame';
  bRows.fx.textContent = EFFECTS.map((e) => e.name).join(' → ');
}

// (C) the cast: every registered scene and variant with its tag and three depths; the current one is marked
function buildC() {
  const C = $('helpC');
  C.replaceChildren();
  C.appendChild(el('h2', null, 'C · the cast'));
  marks = {};
  for (const E of REG) {
    if (!E) continue;
    const sc = E.scene, h = sc.help || {}, box = el('div', 'hcast');
    marks[E.id] = box;
    box.appendChild(el('h3', null, sceneName(E) + ' · id ' + E.id + ' · key ' + (E.id + 1) + (E.id === SC.home ? ' · home' : '') + (E.variant ? ' · a variant of ' + upper(sc.name) : '')));
    box.appendChild(el('p', 'htag', E.variant ? E.variant.tag : sc.tag));
    box.appendChild(el('p', 'heli', h.eli5));
    const d = el('details');
    d.appendChild(el('summary', null, 'why · the mathematics'));
    d.appendChild(el('p', 'hwhy', h.why));
    d.appendChild(el('p', 'hmath', h.math));
    box.appendChild(d);
    const col = sc.colour ? ' · colour: ' + sc.colour.cur + ' (variants: ' + Object.keys(sc.colour.variants).join(', ') + ')' : '';
    box.appendChild(el('p', 'hnote', 'reads ' + (sc.feats || []).length + ' fields · cuts: ' + sc.cuts + col));
    C.appendChild(box);
  }
}
function markC() { for (const id in marks) marks[id].classList.toggle('cur', +id === SC.logical); }

// (D) the keys
function buildD() {
  const D = $('helpD');
  D.replaceChildren();
  D.appendChild(el('h2', null, 'D · keys'));
  const dl = el('dl', 'hdl');
  for (const [k, t] of keys()) {
    const dt = el('dt');
    dt.appendChild(el('kbd', null, k));
    dl.appendChild(dt);
    dl.appendChild(el('dd', null, t));
  }
  D.appendChild(dl);
}

export function initHelp() {
  if (HELP.built) return;
  HELP.built = true;
  const body = $('helpBody');
  body.replaceChildren();
  body.appendChild(el('h1', null, 'RETINA RAVE · what you are looking at, and what is moving it'));
  body.appendChild(el('p', 'hnote', 'Every visible parameter traces to a field of MS, the music state vector the engine computes each frame. Part A is the scene on screen and the fields it reads, with their live values; B is the director choosing scenes; C is every scene; D the keys; E lets you re-wire, by hand, which field drives what. The scene keeps rendering behind this page.'));
  for (const id of ['helpA', 'helpB', 'helpC', 'helpD', 'helpE']) body.appendChild(el('section')).id = id;
  const foot = body.appendChild(el('p', 'hnote'));
  foot.appendChild(document.createTextNode('Who made this and how to support it: '));
  const a = foot.appendChild(el('a', null, 'about & support'));
  a.href = 'about.html'; // site/about.html, copied beside the page by the build (a relative link so the file:// bundle finds it too)
  buildD();
  buildC();
  buildB();
  buildE($('helpE'));
}

// Open the view scrolled to one part (key p → 'helpE').
export function openHelpAt(id) {
  toggleHelp(true);
  const e = $(id);
  if (e) e.scrollIntoView();
}

export function toggleHelp(force) {
  const on = force === undefined ? !HELP.on : !!force;
  if (on === HELP.on) return;
  HELP.on = on;
  if (on) initHelp();
  $('help').style.display = on ? 'block' : 'none';
  document.body.classList.toggle('help', on);
  if (on) { // complete on the frame it opens (a paused clock still shows a full page)
    buildA();
    markC();
    markE();
    refreshLive(0);
    refreshB();
    refreshE(0, hot);
  } else closeE(); // v0.4.1: a running preview ends with the view (the panel gets no tick while closed)
}

// Called from loop.js right after drawHUD. Zero work while hidden.
export function drawHelp(S, frameN) {
  if (!HELP.on) return;
  for (const k of EV) if (S[k]) hot[k] = frameN;
  if (SC.logical !== HELP.scene) { buildA(); markC(); markE(); }
  if (frameN % 6 === 0) {
    HELP.ticks++;
    refreshLive(frameN);
    refreshB();
    refreshE(frameN, hot); // hot: the per-frame event latch (an event lasts one frame; the panel only runs on this tick)
  }
}

// The field names in part A's tables (top table first), read back from the DOM. Builds the view if needed (no frame cost).
function rows(topOnly) {
  initHelp();
  if (HELP.scene !== SC.logical) { buildA(); markC(); }
  const names = [...$('helpA').querySelectorAll('td.hk')].map((t) => t.textContent);
  return topOnly ? names.slice(0, HELP.nTop) : names;
}
