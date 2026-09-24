// Touch controls (v0.6): what replaces the keys on a coarse-pointer device. A bottom bar (#tbar in index.html, shown by
// CSS only under (pointer:coarse) while running) with help · previous scene · next scene · fullscreen, a horizontal swipe on
// the canvas that steps the forced scene through the registry, and a press held still for 600 ms that toggles the help
// view. Nothing here runs per frame and nothing changes what the director decides beyond SC.forced, exactly as keys 1–9 do.
import { SC, REG } from './scenes.js';
import { toggleHelp, HELP } from './help.js';
import { fullscreen, canFullscreen } from './hud.js';

const $ = (id) => document.getElementById(id);
export const TOUCH = { swipes: 0, holds: 0 }; // counters the harness reads
const HOLD_MS = 600, SWIPE_PX = 60;

// Step the forced scene by d from where the eye is now (the logical scene while the director drives).
export function stepScene(d) {
  const n = REG.length;
  if (!n) return;
  const from = SC.forced >= 0 ? SC.forced : SC.logical;
  SC.forced = (from + d + n) % n;
}

let toastT = 0;
export function toast(text, ms = 2600) {
  const t = $('toast');
  if (!t) return;
  t.textContent = text;
  t.classList.add('on');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('on'), ms);
}

// iOS Safari has no page fullscreen at all: the button explains the one way to lose the browser chrome.
function fullscreenOrHint() {
  if (canFullscreen()) fullscreen();
  else toast('No fullscreen here — Add to Home Screen (share → Add to Home Screen) opens it without the browser bars.', 4200);
}

export function initTouch() {
  const bar = $('tbar');
  if (bar) {
    bar.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      const k = b.dataset.k;
      if (k === 'help') toggleHelp();
      else if (k === 'prev') stepScene(-1);
      else if (k === 'next') stepScene(1);
      else if (k === 'fs') fullscreenOrHint();
    });
  }
  const cv = $('gl');
  if (!cv) return;
  let x0 = 0, y0 = 0, t0 = 0, moved = false, hold = 0;
  const tp = (e) => (e.changedTouches ? e.changedTouches[0] : e);
  cv.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches.length > 1) return;
    const p = tp(e);
    x0 = p.clientX; y0 = p.clientY; t0 = performance.now(); moved = false;
    clearTimeout(hold);
    hold = setTimeout(() => { if (!moved) { TOUCH.holds++; toggleHelp(); } }, HOLD_MS);
  }, { passive: true });
  cv.addEventListener('touchmove', (e) => {
    const p = tp(e);
    if (Math.abs(p.clientX - x0) > 12 || Math.abs(p.clientY - y0) > 12) { moved = true; clearTimeout(hold); }
  }, { passive: true });
  cv.addEventListener('touchend', (e) => {
    clearTimeout(hold);
    const p = tp(e), dx = p.clientX - x0, dy = p.clientY - y0;
    if (performance.now() - t0 < 700 && Math.abs(dx) > SWIPE_PX && Math.abs(dx) > 2 * Math.abs(dy)) {
      TOUCH.swipes++;
      if (HELP.on) return; // the help view scrolls; a swipe there is not a scene change
      stepScene(dx < 0 ? 1 : -1);
    }
  }, { passive: true });
  cv.addEventListener('touchcancel', () => clearTimeout(hold), { passive: true });
}
