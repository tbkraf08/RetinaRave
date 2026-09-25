// The landing card's scene picker (v0.8.1). One tile per registered scene that declares `card` (CONTRACTS §1.17), rendered
// from the registry — nothing here names a scene. A click forces that scene and shows it live on the built-in demo synth,
// which is silent unless monitored (key m): the card slims to the bottom of the screen ("peek") and the canvas, which was
// rendering under the card all along, shows through. The start buttons keep the forced scene; `0` hands it back to the
// director. Nothing here runs per frame. core/hud.js owns the run/stop hooks and asks `LANDING.peek` before hiding the card.
import { AU } from '../engine/audio.js';
import { ENGINE } from '../engine/engine.js';
import { SC, REG } from './scenes.js';

const $ = (id) => document.getElementById(id);
export const LANDING = { peek: false, picked: -1, tiles: 0 }; // peek: a tile started the demo and the card stays up · picked: the tile's id (-1 = director)

export function initLanding() {
  const box = $('scenes');
  if (!box) return;
  box.replaceChildren();
  const d = document.createElement('button'); // the director's tile first: no picture, the default, always visible (in peek too)
  d.className = 'tile dir';
  d.type = 'button';
  d.id = 'director';
  d.dataset.id = -1;
  d.title = 'the director picks the scene to the music';
  const dn = document.createElement('span');
  dn.textContent = 'DIRECTOR';
  d.appendChild(dn);
  d.onclick = () => pick(-1);
  box.appendChild(d);
  for (const E of REG) {
    if (!E || E.variant || !E.scene.card) continue;
    const sc = E.scene, b = document.createElement('button');
    b.className = 'tile';
    b.type = 'button';
    b.dataset.id = E.id;
    b.title = sc.card.blurb;
    b.setAttribute('aria-label', sc.card.title + ' — ' + sc.card.blurb);
    const im = new Image();
    im.src = 'thumbs/' + sc.name + '.jpg'; // site/thumbs/, built by tools/thumbs.sh; a release file opened alone has none — the gradient stays
    im.alt = '';
    im.decoding = 'async';
    im.onerror = () => im.remove();
    const nm = document.createElement('span');
    nm.textContent = sc.card.title;
    b.append(im, nm);
    b.onclick = () => pick(E.id);
    box.appendChild(b);
    LANDING.tiles++;
  }
  mark();
}

// Force a scene (-1 = the director) and, while the card is up, show it live on the silent demo. During the show (a source
// is running, or the harness hid the card) it is exactly keys 1–9 / 0: SC.forced and the tile marks, nothing else.
export function pick(id) {
  LANDING.picked = id;
  SC.forced = id;
  const up = !$('landing').classList.contains('hide');
  if (up && (AU.mode === 'none' || LANDING.peek)) {
    LANDING.peek = true;
    ENGINE.start('demo'); // → AU.onRun('demo') in core/hud.js, which keeps the card up because LANDING.peek is set
  }
  mark();
}

// A start button was pressed: the next run hides the card whatever mode it lands in (a declined capture falls to the demo with its message, as before).
export function leavePeek() {
  LANDING.peek = false;
  $('landing').classList.remove('peek');
}

function mark() {
  for (const b of document.querySelectorAll('#scenes .tile')) b.classList.toggle('on', +b.dataset.id === LANDING.picked);
  const m = $('peekmsg');
  if (!m) return;
  const E = REG[LANDING.picked];
  m.textContent = E ? 'previewing ' + E.scene.card.title + ' on the built-in demo signal — ' + E.scene.card.blurb : 'previewing the director on the built-in demo signal — it picks the scene to the music';
}
