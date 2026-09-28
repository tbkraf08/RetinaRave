// THE EVENT LOG + THE TRACE RECORDER (v0.15 E1/E2). Two things, one leaf module (it imports nothing, so anything may
// import it): the ring `LOG` behind ENGINE.log(type, t, extra) — the hook later stages hang sub-frame onsets on
// (CARD.EARS.log in ENGINE-CHLADNI-SESSION-PROMPT.md is this) — and TRACE, which records named MS fields per frame into
// the JSON tools/truth/compare.py reads. `t` in both is the engine's time base (docs/ENGINE.md "Time"): track seconds
// in file mode, AudioContext seconds in the live modes.
export const LOG_CAP = 20000;
const LOG_ALWAYS = ['fileStart', 'fileEnd'];  // kept in a trace even when they precede the window (they date the run)

export const LOG = [];

// One event. Appended by ENGINE.log (the public hook) and by sources/file.js.
export function pushLog(type, t, frameN, extra) {
  if (LOG.length >= LOG_CAP) LOG.shift();
  const e = { type, t, f: frameN };
  if (extra) for (const k in extra) e[k] = extra[k];
  LOG.push(e);
  return e;
}

// JSON cannot carry a boolean column and a non-finite number: booleans become 0/1 and non-finite becomes null, as the
// frozen trace format says. Objects, strings and vectors are not recordable and are dropped by fieldsOf / start.
const num = (v) => (v === true ? 1 : v === false ? 0 : typeof v === 'number' ? (Number.isFinite(v) ? v : null) : null);
const recordable = (v) => typeof v === 'number' || typeof v === 'boolean';

// Every MS field a column can hold, in MS key order (deterministic).
export function fieldsOf(MS) {
  const out = [];
  for (const k in MS) if (recordable(MS[k])) out.push(k);
  return out;
}

export const TRACE = {
  on: false,
  fields: [],
  f: [], t: [], cols: {},
  meta: null,            // { track, mode, sr, at, fps, detLead } — the engine fills it on the first recorded frame
  last: null,            // the JSON of the most recent stop()
  want: null,            // what start() was asked for, until the first frame resolves '*'

  // fields: an array of MS field names, or '*' / ['*'] for every numeric/boolean MS field. Recording begins on the NEXT
  // frame (the frame start() is called from is already half-run).
  start(fields) {
    this.want = fields === undefined ? '*' : fields;
    this.fields = [];
    this.f = [];
    this.t = [];
    this.cols = {};
    this.meta = null;
    this.on = true;
    return true;
  },

  // Returns the frozen JSON and keeps it on TRACE.last.
  stop() {
    this.on = false;
    const m = this.meta || {};
    const tFirst = this.t.length ? this.t[0] : 0, tLast = this.t.length ? this.t[this.t.length - 1] : 0;
    const log = LOG.filter((e) => (e.t >= tFirst && e.t <= tLast) || LOG_ALWAYS.indexOf(e.type) >= 0);
    const out = {
      track: m.track === undefined ? null : m.track,
      mode: m.mode === undefined ? 'unknown' : m.mode,
      sr: m.sr || 0, at: m.at || 0, fps: m.fps || 0, detLead: m.detLead || 0,
      fields: this.fields.slice(),
      f: this.f, t: this.t, cols: this.cols,
      log: log.map((e) => Object.assign({}, e)),
    };
    this.last = out;
    return out;
  },

  // Called once per frame by ENGINE.frame, after the stages and the test pins, with the finished MS.
  frame(MS, frameN, heardT, meta) {
    if (!this.on) return;
    if (!this.fields.length) {
      const want = this.want;
      const all = want === '*' || (Array.isArray(want) && want.length === 1 && want[0] === '*');
      this.fields = all ? fieldsOf(MS) : (want || []).filter((k) => recordable(MS[k]));
      for (const k of this.fields) this.cols[k] = [];
      this.meta = meta;
      if (!this.fields.length) { this.on = false; return; } // nothing recordable was asked for: say so by stopping
    }
    this.f.push(frameN);
    this.t.push(Number.isFinite(heardT) ? heardT : null);
    for (const k of this.fields) this.cols[k].push(num(MS[k]));
  },
};
