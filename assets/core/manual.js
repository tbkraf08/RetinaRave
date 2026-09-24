// MANUAL (v0.4): one place for the overrides the keys already do — the forced scene, the transition, a scene's colour
// variant — plus the per-scene post params (bloom.thr, fb.decay, kaleido, exposure.on) merged over the resolved post by
// scenes.js postOf(). `scene` / `trans` / `colour` are live views of the director's own state (SC.forced, the current
// transition, colour.cur), never a second copy; `post` is MANUAL_POST from scenes.js (the same object). The manual block
// travels in the preset JSON (route.js BLOCKS.manual) and as &post= under #test (harness.js). Nothing here runs per
// frame: with nothing set, postOf returns the scene's own post untouched (md5 identity).
import { SC, REG, SCENES, TRANSITIONS, MANUAL_POST, currentTransition, setTransition } from './scenes.js';
import { BLOCKS, sceneOf } from './route.js';

// The four post params the panel offers (CONTRACTS §1.4 "Per-scene post params"): path → how a value is read
const PARAMS = { 'bloom.thr': 'number', 'fb.decay': 'number', kaleido: 'number', 'exposure.on': 'bool' };
export const POST_PARAMS = Object.keys(PARAMS);

const need = (name) => { const sc = sceneOf(name); if (!sc) throw new Error('manual: no scene named ' + name); return sc; };

export const MANUAL = {
  post: MANUAL_POST,
  get scene() { return SC.forced; },
  set scene(id) { id = id === null || id === undefined || id === '' ? -1 : +id; if (id >= 0 && !REG[id]) throw new Error('manual: no scene id ' + id); SC.forced = id; },
  get trans() { const t = currentTransition(); return t ? t.name : null; },
  set trans(name) { setTransition(name); },
  get colour() { const o = {}; for (const s of SCENES) if (s.colour) o[s.name] = s.colour.cur; return o; },
};

// Set one scene's colour variant by name (a scene that does not declare it throws, as setColour does for all).
export function setSceneColour(name, variant) {
  const sc = need(name);
  if (!sc.colour || !sc.colour.variants[variant]) throw new Error('manual: ' + name + ' has no colour variant ' + variant);
  sc.colour.cur = variant;
  return variant;
}

// Set (value) or clear (null) one post override: setPost('feigen', 'bloom.thr', 0.3). Values are checked by PARAMS.
export function setPost(name, path, value) {
  need(name);
  const how = PARAMS[path];
  if (!how) throw new Error('manual: post param ' + path + ' is not one of ' + POST_PARAMS.join(', '));
  const [eff, key] = path.split('.');
  const P = MANUAL_POST[name] || (MANUAL_POST[name] = {});
  if (value === null || value === undefined) {
    if (key) { if (P[eff]) { delete P[eff][key]; if (!Object.keys(P[eff]).length) delete P[eff]; } }
    else delete P[eff];
  } else {
    if (how === 'bool') value = value === true || value === 1 || value === '1' || value === 'true';
    else { value = +value; if (!isFinite(value)) throw new Error('manual: ' + path + ' must be a finite number'); }
    if (key) (P[eff] || (P[eff] = {}))[key] = value;
    else P[eff] = value;
  }
  if (!Object.keys(P).length) delete MANUAL_POST[name];
  return value;
}
export function clearPost(name) {
  if (name === undefined) { for (const n in MANUAL_POST) delete MANUAL_POST[n]; return; }
  delete MANUAL_POST[name];
}

// One setter for the panel and CARD.manual: manual('scene', 6) · manual('trans', 'mixs') · manual('colour', 'feigen', 'oklch') ·
// manual('post', 'feigen', 'bloom.thr', 0.3 | null)
export function manual(what, a, b, c) {
  if (what === 'scene') { MANUAL.scene = a; return SC.forced; }
  if (what === 'trans') { MANUAL.trans = a; return MANUAL.trans; }
  if (what === 'colour') return setSceneColour(a, b);
  if (what === 'post') return setPost(a, b, c);
  throw new Error('manual: unknown target ' + what + ' (scene | trans | colour | post)');
}

// The &post= grammar: scene.bloom.thr=0.3,scene.kaleido=0,scene.exposure.on=1 — all-or-nothing, a bad one throws.
const ONE = /^(\w+)\.((?:bloom\.thr|fb\.decay|exposure\.on|kaleido))=(-?[\d.]+(?:e-?\d+)?|true|false)$/;
export function applyPosts(str) {
  const rs = String(str).split(',').filter((p) => p.trim()).map((p) => {
    const m = ONE.exec(p.trim());
    if (!m) throw new Error('manual: cannot parse "' + p + '" (scene.bloom.thr=0.3 | scene.fb.decay=0.5 | scene.kaleido=0 | scene.exposure.on=1)');
    need(m[1]);
    return m;
  });
  return rs.map((m) => setPost(m[1], m[2], m[3]));
}
export function postString() {
  const out = [];
  for (const n in MANUAL_POST) for (const path of POST_PARAMS) {
    const [eff, key] = path.split('.'), v = key ? MANUAL_POST[n][eff] && MANUAL_POST[n][eff][key] : MANUAL_POST[n][eff];
    if (v !== undefined) out.push(n + '.' + path + '=' + (typeof v === 'boolean' ? (v ? 1 : 0) : +(+v).toPrecision(6)));
  }
  return out.join(',');
}

// The preset block: { scene, trans, colour: {scene: variant}, post: {scene: {…}} }. set() applies what is present; a
// missing key leaves that setting alone; post replaces the whole override table. Checked first, then applied.
BLOCKS.manual = {
  get: () => ({ scene: SC.forced, trans: MANUAL.trans, colour: MANUAL.colour, post: JSON.parse(JSON.stringify(MANUAL_POST)) }),
  set: (o) => {
    if (!o || typeof o !== 'object') return;
    if (o.scene !== undefined && o.scene >= 0 && !REG[o.scene]) throw new Error('manual: no scene id ' + o.scene);
    if (o.trans !== undefined && !TRANSITIONS[o.trans]) throw new Error('manual: transition ' + o.trans + ' is not registered');
    for (const n in o.colour || {}) { const sc = need(n); if (!sc.colour || !sc.colour.variants[o.colour[n]]) throw new Error('manual: ' + n + ' has no colour variant ' + o.colour[n]); }
    for (const n in o.post || {}) { need(n); for (const eff in o.post[n]) { const v = o.post[n][eff]; if (typeof v === 'object') { for (const k in v) if (!PARAMS[eff + '.' + k]) throw new Error('manual: unknown post param ' + eff + '.' + k); } else if (!PARAMS[eff]) throw new Error('manual: unknown post param ' + eff); } }
    if (o.scene !== undefined) MANUAL.scene = o.scene;
    if (o.trans !== undefined) MANUAL.trans = o.trans;
    for (const n in o.colour || {}) setSceneColour(n, o.colour[n]);
    if (o.post !== undefined) { clearPost(); for (const n in o.post) for (const eff in o.post[n]) { const v = o.post[n][eff]; if (typeof v === 'object') { for (const k in v) setPost(n, eff + '.' + k, v[k]); } else setPost(n, eff, v); } }
  },
};
