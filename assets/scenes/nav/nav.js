// LAYER 2: THE NAVIGATOR. The music moves c through charts on M: interior (multiplier of a bulb), exterior
// (external angle, potential), and zoom-matched cuts into baby copies. Lifted verbatim from cardioid3 NAV.
import { TAU, clamp, mix, sstep, ema, Spring } from '../../math/util.js';
import { BULBS, extC, getGrid, LG_MIN, LG_MAX, solveMult } from '../../math/mandel.js';
import { BABIES, MISI, cardChart } from '../../math/baby.js';

export const NAV = {
  mode: 'INT', alpha: new Spring(0.5, 3), h: new Spring(-1, 3.5), phi: new Spring(0, 2.5), bulb: BULBS[7], target: BULBS[7],
  st: null, stBulb: null, lam: [0, 0],
  baby: null, want: null, bz: new Spring(1, 1.6), hold: 0, leave: 0, pathCut: 999,
  th: new Spring(0, 2.2), lg: new Spring(-4, 3), s: 0, homePhase: 0, homeTh: 0, extBeat: 0, loudBeats: 0, kick: new Spring(0, 9), kickM: MISI[0],
  c: [0, 0], cPath: [0, 0], cyc: { q: 1, lnr: -7, arg: 0, zs: [0, 0], eps2: 9e-4, has: 1 }, par: 0, timeScale: 1, vtime: 0,
  path: new Float32Array(96 * 3), pathN: 0, rayEnd: [0, 0], tmp: [0, 0], orbit: new Float32Array(160 * 3),
  forceBaby: -1,          // test hook (&baby=N / CARD.hooks.baby): force a baby regardless of repeats
  log: () => {},          // set by index.js from ctx.log
};

// Multiplier chart of component b: continuation of (z,c) along lambda.
export function bulbChart(b, rho, phi) {
  let st = NAV.st;
  if (NAV.stBulb !== b || !st) {
    st = NAV.st = { zr: 0, zi: 0, cr: b.center[0], ci: b.center[1] };
    NAV.stBulb = b;
    NAV.lam = [0, 0];
  }
  const tr = rho * Math.cos(phi), ti = rho * Math.sin(phi);
  let dr = tr - NAV.lam[0], di = ti - NAV.lam[1];
  const steps = Math.max(1, Math.ceil(Math.hypot(dr, di) / 0.1));
  for (let k = 1; k <= steps; k++) {
    const lr = NAV.lam[0] + dr * k / steps, li = NAV.lam[1] + di * k / steps;
    const res = solveMult(st, b.per, lr, li);
    if (!(res < 1e-7) || Math.hypot(st.cr - b.center[0], st.ci - b.center[1]) > 1.6 * b.R) {
      NAV.st = null;
      return null;
    }
  }
  NAV.lam = [tr, ti];
  return st;
}

// Zoom-matched cut between the chart on M and the same chart on a baby copy. Legal only while c sits exactly on the
// parabolic root of the p/q bulb (M) <-> root of the p/q satellite of the copy: there the two Julia sets are
// hybrid-equivalent near 0, so cutting c and the view (scale 1/|A|, rotation -arg A) together reads as a continuous
// dive. Drops also cut (back to M: rays are only tabulated for M).
export function babySwap(B, now, why) {
  const N = NAV, tb = B ? B.bulbs : BULBS;
  N.log('BABY@' + now.toFixed(2) + ' ' + (B ? 'enter P' + B.P : 'exit') + ' at ' + why + ' ' + N.bulb.p + '/' + N.bulb.q + ': c ' +
    N.bulb.root.map((x) => x.toFixed(7)) + ' -> ' + tb[N.bulb.i].root.map((x) => x.toFixed(7)));
  N.baby = B;
  N.bulb = tb[N.bulb.i];
  N.target = tb[N.target.i];
  N.st = null;
  N.stBulb = null;
  N.hold = 0;
  N.pathCut = 0;
  if (B) {
    B.st = null;
    N.bz.set(0);
  }
  // a kick in flight follows the chart: same Misiurewicz point, tuned
  N.kickM = (B ? B.misi : MISI)[N.kickI || 0] || (N.kick.set(0), N.kickM);
}

export function navDrop(S, now) {
  const N = NAV;
  if (!getGrid()) return;
  if (N.baby) babySwap(null, now, 'drop');
  const b = N.mode === 'INT' && N.h.x > 0 ? N.bulb : N.target;
  if (N.mode === 'INT' || N.mode === 'IN' || N.mode === 'OUT') {
    const ra = b.rays[S.beatCount & 1];
    N.th.set(ra + Math.round(N.th.x - ra));
  }
  N.mode = 'EXT';
  N.lg.set(-2.2 + 1.7 * S.dropStrength);
  N.lg.v = 0;
  N.extBeat = S.beatCount;
  N.timeScale = 2.6;
  N.kick.set(0);
}

// env: { isLogical: this scene is the director's logical scene, drum: the drum variant is the target }
export function updateNav(dt, now, S, env) {
  const N = NAV, tgt = (N.baby ? N.baby.bulbs : BULBS)[S.interval];
  if (BABIES.length) N.want = N.forceBaby >= 0 ? BABIES[N.forceBaby % BABIES.length] : S.repeat ? BABIES[Math.floor(S.seed.a * BABIES.length) % BABIES.length] : null;
  if ((S.beat && N.mode === 'INT') || N.mode === 'EXT') N.target = tgt; // never retarget on the root<->ray bridge (v2 did: c jumped between roots)
  if (S.dropEvt) navDrop(S, now);
  const b = N.target, I = S.intensity;
  const park = clamp(Math.max(sstep(0.45, 0.85, S.build), sstep(0.5, 0.8, S.suspension)), 0, 1);
  if (N.mode === 'INT') {
    const idle = S.presence < 0.15, hp = N.h.x, want = N.leave ? null : N.want;
    if (N.hold) { // parked on the root while the view dives to matched zoom
      N.h.set(0);
      N.bz.step(0, dt, 5);
      if (N.baby === want) N.hold = 0;
      else if (N.bz.x < 0.03) babySwap(want, now, 'root');
    } else if (b.q === 1 || idle) { // main cardioid: alpha free (harmonic angle), h in [-1,0]
      if (N.h.x > 0) N.h.step(-0.1, dt, 5);
      else {
        N.bulb = BULBS[0];
        N.alpha.step(idle ? N.alpha.x : S.harmUnw / TAU * 0.5 + S.seed.a, dt, 1.2);
        N.h.step(idle ? -1 : -(1 - 0.93 * Math.max(I, park)), dt, idle ? 0.8 : 3);
      }
    } else {
      const aT = b.alpha + Math.round(N.alpha.x - b.alpha), atRoot = Math.abs(N.alpha.x - aT) < 0.0015 && Math.abs(N.alpha.v) < 0.02;
      if (N.h.x > 0 && N.bulb !== b) N.h.step(-0.12, dt, 5 + 4 * I); // leave the old bulb through its root
      else if (!atRoot) { // walk the rim of the main cardioid
        N.h.step(-0.12, dt, 5);
        if (N.h.x < -0.02) N.alpha.step(aT, dt, 2.5 + 3 * I);
      } else {
        N.alpha.set(aT);
        N.bulb = b;
        const exit = N.loud > 14 && env.isLogical;
        N.leave = exit && N.baby ? 1 : 0;
        N.h.step(exit ? (N.baby ? -0.01 : 0) : mix(clamp(1 - (0.12 + 0.8 * I), 0.02, 1), 0.004, park), dt, park > 0.5 ? 2.6 : 3.5);
        if (exit && !N.baby && N.h.x < 0.02 && getGrid()) {
          N.mode = 'OUT';
          N.s = 0;
          N.homeTh = b.rays[0];
          extC(N.homeTh, LG_MIN, N.rayEnd);
        }
      }
    }
    N.phi.step((1 - park) * 1.3 * Math.sin(S.harmUnw * 0.7 + S.seed.a * TAU), dt);
    // root event: h changed sign, so c is exactly a parabolic root this frame — the only place the chart may be transplanted
    if (!N.hold && (hp <= 0) !== (N.h.x <= 0) && N.baby !== want) {
      N.h.x = 0;
      if (N.baby) N.hold = 1;
      else babySwap(want, now, 'root');
    }
    if (N.baby && !N.hold) N.bz.step(1, dt);
    if (S.beat) {
      if (S.arc === 'sustain' && I > 0.55) N.loud = (N.loud || 0) + 1;
      else N.loud = 0;
    }
    // chart -> c
    const B = N.baby, zsc = B ? 1 / B.A : 1;
    if (N.h.x <= 0) {
      const r = 1 + N.h.x, a = TAU * N.alpha.x, lr = r * Math.cos(a), li = r * Math.sin(a);
      if (B) {
        const st = cardChart(B, lr, li);
        if (st) {
          N.cPath[0] = st.cr;
          N.cPath[1] = st.ci;
          N.cyc = { q: B.P, lnr: Math.log(Math.max(r, 1e-3)), arg: Math.atan2(li, lr), zs: [st.zr, st.zi], eps2: 9e-4 * zsc * zsc, has: 1 };
        } else {
          N.cPath[0] = B.c0[0];
          N.cPath[1] = B.c0[1];
          N.cyc.has = 0;
        }
      } else {
        N.cPath[0] = lr / 2 - (lr * lr - li * li) / 4;
        N.cPath[1] = li / 2 - lr * li / 2;
        N.cyc = { q: 1, lnr: Math.log(Math.max(r, 1e-3)), arg: Math.atan2(li, lr), zs: [lr / 2, li / 2], eps2: 9e-4, has: 1 };
      }
      N.par = sstep(0.9, 0.995, r) * (b.q > 1 ? 1 : 0.4);
    } else {
      const bb = N.bulb, h = N.h.x, rho = Math.min(1 - h, bb.rhoMax || 0.985), ph = N.phi.x * sstep(0, 0.3, h), st = bulbChart(bb, rho, ph);
      if (st) {
        const t = clamp(h / 0.015, 0, 1);
        N.cPath[0] = mix(bb.root[0], st.cr, t);
        N.cPath[1] = mix(bb.root[1], st.ci, t);
        let zr = st.zr, zi = st.zi, md = 1;
        for (let j = 1; j < bb.per; j++) {
          const t2 = zr * zr - zi * zi + st.cr;
          zi = 2 * zr * zi + st.ci;
          zr = t2;
          md = Math.min(md, Math.hypot(zr - st.zr, zi - st.zi));
        }
        const ep = clamp(0.4 * md, 0.003 * zsc, 0.03 * zsc);
        N.cyc = { q: bb.per, lnr: Math.log(rho), arg: ph, zs: [st.zr, st.zi], eps2: ep * ep, has: 1 };
      } else {
        N.cPath[0] = bb.center[0];
        N.cPath[1] = bb.center[1];
        N.cyc.has = 0;
      }
      N.par = sstep(0.8, 0.98, rho);
    }
  } else if (N.mode === 'OUT' || N.mode === 'IN') { // bridge between a parabolic root and the end of its landing ray
    N.s = clamp(N.s + (N.mode === 'OUT' ? dt : -dt) / 0.7, 0, 1);
    const t = sstep(0, 1, N.s), r = N.target.root;
    N.cPath[0] = mix(r[0], N.rayEnd[0], t);
    N.cPath[1] = mix(r[1], N.rayEnd[1], t);
    N.cyc.has = 0;
    N.par = 1 - t;
    if (N.mode === 'OUT' && N.s >= 1) {
      N.mode = 'EXT';
      N.th.set(N.homeTh + Math.round(N.th.x - N.homeTh));
      N.lg.set(LG_MIN);
      N.extBeat = S.beatCount;
    }
    if (N.mode === 'IN' && N.s <= 0) {
      N.mode = 'INT';
      N.bulb = N.target;
      N.alpha.set(N.target.alpha + Math.round(N.alpha.x - N.target.alpha));
      N.h.set(0.001);
      N.loud = 0;
      N.leave = 0;
      N.st = null;
      N.landed = S.beatCount;
      if (N.want) {
        N.h.set(0);
        babySwap(N.want, now, 'landing');
      }
    }
  } else { // EXT / HOME: spring in (theta, log G), never in raw c
    const settle = S.arc !== 'peak' && S.beatCount - N.extBeat > 8 || S.beatCount - N.extBeat > 48 || S.presence < 0.15;
    if (N.mode === 'EXT' && settle && S.dropEnv < 0.2) {
      N.mode = 'HOME';
      N.homePhase = 0;
      const ra = b.rays, t0 = ra[0] + Math.round(N.th.x - ra[0]), t1 = ra[1] + Math.round(N.th.x - ra[1]);
      N.homeTh = Math.abs(t0 - N.th.x) < Math.abs(t1 - N.th.x) ? t0 : t1;
      N.homeB = b;
    }
    if (N.mode === 'EXT') {
      N.th.step(S.harmUnw / TAU + S.seed.th, dt);
      N.lg.step(clamp(mix(-2.6, -9, clamp(0.55 * S.eS + 0.5 * S.tension, 0, 1)) + 3.2 * S.dropEnv, LG_MIN, LG_MAX), dt);
    } else {
      N.target = N.homeB;
      if (N.homePhase === 0) {
        N.th.step(N.homeTh, dt, 3.6);
        N.lg.step(-4, dt, 3);
        if (Math.abs(N.th.x - N.homeTh) < 0.004 && Math.abs(N.th.v) < 0.03) N.homePhase = 1;
      } else {
        N.th.step(N.homeTh, dt, 5);
        N.lg.step(LG_MIN - 0.4, dt, 3.2);
        if (N.lg.x < LG_MIN + 0.05) {
          N.mode = 'IN';
          N.s = 1;
          extC(N.homeTh, LG_MIN, N.rayEnd);
        }
      }
    }
    extC(N.th.x, N.lg.x, N.cPath);
    N.cyc.has = 0;
    N.par = 0;
  }
  // beat hits: jump-cut toward the nearest Misiurewicz point, spring back
  if (S.onset && S.hitStrength > 0.55 && S.eS > 0.3 && N.kick.x < 0.15 && !env.drum && N.mode !== 'IN' && N.mode !== 'OUT' && park < 0.6) {
    let bd = 1e9;
    (N.baby ? N.baby.misi : MISI).forEach((m, i) => {
      if (!m) return;
      const d = Math.hypot(m[0] - N.cPath[0], m[1] - N.cPath[1]);
      if (d < bd) {
        bd = d;
        N.kickM = m;
        N.kickI = i;
      }
    });
    N.kick.set(clamp(0.3 + 0.55 * S.hitStrength, 0, 0.85) * (N.mode === 'INT' ? 1 : 0.5));
  }
  N.kick.step(0, dt);
  const k = N.kick.x;
  N.c[0] = mix(N.cPath[0], N.kickM[0], k);
  N.c[1] = mix(N.cPath[1], N.kickM[1], k);
  N.cycBase = N.cyc.has; // the chart's own verdict, before the kick hides it (scene eligibility)
  if (k > 0.02) N.cyc.has = 0;
  // visual time: crawls near parabolic roots, releases on resolution / drop
  if (S.resolveEvt) N.timeScale = Math.max(N.timeScale, 2);
  N.timeScale = ema(N.timeScale, mix(1, 0.05, N.par * N.par), dt, 0.5);
  N.vtime += dt * N.timeScale * (0.15 + 0.85 * S.presence);
  // path trail (PiP) + critical orbit
  N.pathCut++;
  const P = N.path;
  P.copyWithin(3, 0, 95 * 3);
  P[0] = N.c[0];
  P[1] = N.c[1];
  P[2] = 1;
  for (let i = 0; i < 96; i++) P[i * 3 + 2] = 1 - i / 96;
  let zr = 0, zi = 0;
  const O = N.orbit, head = (N.vtime * 14) % 160;
  for (let i = 0; i < 160; i++) {
    const t = zr * zr - zi * zi + N.c[0];
    zi = 2 * zr * zi + N.c[1];
    zr = t;
    if (!(zr * zr + zi * zi < 1e6)) {
      zr = 1e3;
      zi = 1e3;
    }
    let d = Math.abs(i - head);
    d = Math.min(d, 160 - d);
    O[i * 3] = zr;
    O[i * 3 + 1] = zi;
    O[i * 3 + 2] = 0.25 + 0.9 * Math.exp(-d * d / 10);
  }
}
