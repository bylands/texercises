// The physics of magnetic forces, without texts (exercises.js adds them).
// Directions are vectors [x, y, z]: x to the right, y up, z out of the page (⊙), −z into it (⊗).
// The force on a charge q moving at v in a field B is F = q · v × B (on a current I in a wire piece
// along d: F = I · d × B): the right-hand rule for positive charges (thumb: v or I, index finger:
// B, middle finger: F), the left-hand rule for negative ones.
//   dirs: AXES (the six axis directions), PLANE8 (the eight directions in the page, 45° apart),
//   CANDS (PLANE8 and ⊙, ⊗); unit, cross, same (parallel, same sense), key (a name for a direction)
//   force(q, v, B)       the direction of q · v × B, or null (no force)
//   wireField(d, r)      the direction of the field of a long straight wire along d at r from it
//                        (r measured from the wire, perpendicular to it), or null
//   chargeField(q, v, r) the direction of the field of a moving charge at r from it, or null
//   fitting(missing, q, a, F)  the candidates (CANDS) for the missing B (a = v) or v (a = B)
//                        that give a force along F: often more than one
//   path(o)              a trajectory in the page plane by numerical integration (RK4)
//   PARTICLES            electron, proton, deuteron, alpha particle: mass and charge
(function (root) {
  'use strict';

  // ---------------------------------------------------------------- random numbers
  function rng(seed) {
    let a = seed >>> 0;
    const next = () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
    return {
      next, int,
      pick: (arr) => arr[Math.floor(next() * arr.length)],
      shuffle: (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = int(0, i); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; },
    };
  }

  // ---------------------------------------------------------------- directions
  const AXES = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  const PLANE8 = [[1, 0, 0], [1, 1, 0], [0, 1, 0], [-1, 1, 0], [-1, 0, 0], [-1, -1, 0], [0, -1, 0], [1, -1, 0]];
  const CANDS = [...PLANE8, [0, 0, 1], [0, 0, -1]];
  const len = (a) => Math.hypot(a[0], a[1], a[2]);
  const unit = (a) => { const l = len(a); return l < 1e-12 ? null : a.map((x) => x / l); };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const scale = (a, k) => a.map((x) => x * k);
  const same = (a, b) => { const u = a && unit(a), w = b && unit(b); return !!u && !!w && dot(u, w) > 1 - 1e-9; };
  const key = (a) => (a ? a.map((x) => Math.sign(x)).join(',') : 'none');
  const fromKey = (k) => (k === 'none' ? null : k.split(',').map(Number));

  // ---------------------------------------------------------------- forces and fields
  function force(q, v, B) {
    if (!q || !v || !B) return null;
    const f = unit(scale(cross(v, B), Math.sign(q)));
    return f && f.map((x) => Math.round(x * 1e9) / 1e9);
  }
  // the part of r perpendicular to d
  const perp = (d, r) => { const u = unit(d); return r.map((x, i) => x - dot(r, u) * u[i]); };
  function wireField(d, r) {
    const rp = perp(d, r);
    return len(rp) < 1e-9 ? null : unit(cross(d, rp));
  }
  function chargeField(q, v, r) {
    if (!q || !v) return null;
    const b = unit(scale(cross(v, r), Math.sign(q)));
    return b;
  }
  function fitting(missing, q, a, F) {
    return CANDS.filter((c) => (missing === 'B' ? same(force(q, a, c), F) : same(force(q, c, a), F)));
  }

  // ---------------------------------------------------------------- trajectories
  // A charge (q/m = k) starting at (x0, y0) with velocity (vx, vy), in a field Bz(x, y) (out of the
  // page positive); n steps of dt. Returns the points [x, y]. o.inside(x, y): where the field is (else 0).
  function path(o) {
    const Bz = (x, y) => (o.inside && !o.inside(x, y) ? 0 : o.Bz(x, y));
    const acc = (s) => { const b = Bz(s[0], s[1]) * o.k; return [s[2], s[3], s[3] * b, -s[2] * b]; };
    let s = [o.x0, o.y0, o.vx, o.vy];
    const pts = [[s[0], s[1]]], dt = o.dt;
    for (let i = 0; i < o.n; i++) {
      const k1 = acc(s), k2 = acc(s.map((x, j) => x + (dt / 2) * k1[j])), k3 = acc(s.map((x, j) => x + (dt / 2) * k2[j])), k4 = acc(s.map((x, j) => x + dt * k3[j]));
      s = s.map((x, j) => x + (dt / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
      pts.push([s[0], s[1]]);
      if (o.stop && o.stop(s[0], s[1])) break;
    }
    return pts;
  }

  // ---------------------------------------------------------------- particles
  const E = 1.602e-19, U = 1.661e-27;
  const PARTICLES = {
    electron: { m: 9.109e-31, q: -E }, proton: { m: 1.673e-27, q: E }, deuteron: { m: 3.344e-27, q: E }, alpha: { m: 6.645e-27, q: 2 * E },
  };

  const api = { rng, AXES, PLANE8, CANDS, len, unit, cross, dot, same, key, fromKey, force, wireField, chargeField, fitting, path, PARTICLES, E, U };
  root.Magnet = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
