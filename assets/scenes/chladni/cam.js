// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// CHLADNI's camera. Split out of index.js in §74 (the file passed its 500-line cap): the eye's own geometry is one
// subject and nothing else in the scene touches it.
//
// The eye sits on a circle of radius `dist` at elevation `pitch`, looking at the plate's centre. The basis is
// (right, up, forward) as the three COLUMNS of uCamB, so the plate pass's ray is sc.x·right + sc.y·up + focal·forward
// and the sand's own view-projection is built from the same three vectors — a grain and the line it sits on are drawn
// by one camera, which is the whole reason the two passes agree.

// The leans the eye owns. The register (`bassReg`) is what moves it: a 35 Hz sub is low and heavy and fills the
// frame, a 140 Hz mid-bass is seen from overhead and small.
export const FOV = 1.05;         // vertical field of view (rad, ~60 deg) — the plate fills the frame without fisheye
export const PITCH_SUB = 0.58;   // bassReg 0 (a 35 Hz sub): the camera is LOW and heavy, almost in the plate
export const PITCH_MID = 1.24;   // bassReg 1 (a 140 Hz mid-bass): nearly overhead, the plate small — the 1:38 climb
export const DIST_SUB = 1.78;    // and close
export const DIST_MID = 3.70;    // and far away
export const CAMTC = 0.45;       // the camera eases over ~1.4 s: a register change is music, never a cut
export const BOUNCE = 0.05;      // the thump per felt beat, on the camera distance (TORUS2's number, the user's own)
export const TILTB = 0.55;       // how far the build tilts the camera up through the void
const NEAR = 0.05;               // the points pass's near / far planes: the plate is 2 units across at 1.8 to 4.2 away
const FAR = 20;

export const FOCAL = 1 / Math.tan(FOV * 0.5);
export const EYE = [0, 0, 0];
export const BAS = new Float32Array(9);

export function camera(yaw, pitch, dist) {
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  EYE[0] = dist * cp * Math.sin(yaw);
  EYE[1] = -dist * cp * Math.cos(yaw);
  EYE[2] = dist * sp;
  const fx = -EYE[0] / dist, fy = -EYE[1] / dist, fz = -EYE[2] / dist;
  // right = normalize(forward x worldUp), worldUp = (0, 0, 1) — the plate's own normal
  let rx = fy, ry = -fx, rz = 0;
  const rl = Math.hypot(rx, ry) || 1;
  rx /= rl;
  ry /= rl;
  const ux = ry * fz - rz * fy, uy = rz * fx - rx * fz, uz = rx * fy - ry * fx;
  BAS[0] = rx; BAS[1] = ry; BAS[2] = rz;
  BAS[3] = ux; BAS[4] = uy; BAS[5] = uz;
  BAS[6] = fx; BAS[7] = fy; BAS[8] = fz;
}

// The view-projection for the sand's points, column-major, from the same yaw / pitch / dist as the plate's ray cast.
// Right-handed, looking down -z in view space.
export function lookVP(m, aspect, focal) {
  const rx = BAS[0], ry = BAS[1], rz = BAS[2], ux = BAS[3], uy = BAS[4], uz = BAS[5], fx = BAS[6], fy = BAS[7], fz = BAS[8];
  const de = fx * EYE[0] + fy * EYE[1] + fz * EYE[2];
  const A = (FAR + NEAR) / (NEAR - FAR), Bp = (2 * FAR * NEAR) / (NEAR - FAR), sx = focal / aspect;
  m[0] = sx * rx; m[4] = sx * ry; m[8] = sx * rz; m[12] = -sx * (rx * EYE[0] + ry * EYE[1] + rz * EYE[2]);
  m[1] = focal * ux; m[5] = focal * uy; m[9] = focal * uz; m[13] = -focal * (ux * EYE[0] + uy * EYE[1] + uz * EYE[2]);
  m[2] = -A * fx; m[6] = -A * fy; m[10] = -A * fz; m[14] = A * de + Bp;
  m[3] = fx; m[7] = fy; m[11] = fz; m[15] = -de;
}
