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
//   fitting(missing, q, a, F)  the candidates (CANDS) for the missing B (a = v) or v (a = B)
//                        that give a force along F: often more than one
//   planeField(wires, x, y)   the field in the page of currents perpendicular to it (a wire seen
//                        end-on, a loop or a solenoid in cross-section)
//   fieldLine(wires, x, y, box)  the field line through (x, y): { pts, closed }
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
  function fitting(missing, q, a, F) {
    return CANDS.filter((c) => (missing === 'B' ? same(force(q, a, c), F) : same(force(q, c, a), F)));
  }

  // ---------------------------------------------------------------- field lines in the page
  // The field of long straight currents perpendicular to the page, wires: [{ x, y, s }] (s = +1
  // out of the page ⊙, −1 into it ⊗): each circles its wire anticlockwise for ⊙ (grip rule), as
  // 1/r. A loop seen in cross-section is two wires, a solenoid two rows, a bar magnet like a
  // solenoid (its north pole where the field leaves the coil).
  function planeField(wires, x, y) {
    let bx = 0, by = 0;
    for (const w of wires) { const dx = x - w.x, dy = y - w.y, r2 = dx * dx + dy * dy || 1e-12; bx -= (w.s * dy) / r2; by += (w.s * dx) / r2; }
    return [bx, by];
  }
  // A field line through (x0, y0), along the field: points [x, y], closed or ended where it leaves
  // the box [x0, x1, y0, y1] (then traced back from the start as well).
  function fieldLine(wires, x0, y0, box, h = 0.03, n = 4000) {
    const step = (p, sg) => {
      const f = (q) => { const b = planeField(wires, q[0], q[1]), l = Math.hypot(b[0], b[1]) || 1; return [(sg * b[0]) / l, (sg * b[1]) / l]; };
      const k1 = f(p), k2 = f([p[0] + (h / 2) * k1[0], p[1] + (h / 2) * k1[1]]);
      return [p[0] + h * k2[0], p[1] + h * k2[1]];
    };
    const out = (p) => p[0] < box[0] || p[0] > box[1] || p[1] < box[2] || p[1] > box[3];
    const run = (sg) => {
      const pts = [[x0, y0]];
      for (let i = 0, len = 0; i < n; i++) {
        const p = step(pts[pts.length - 1], sg);
        pts.push(p);
        len += h;
        if (len > 0.5 && Math.hypot(p[0] - x0, p[1] - y0) < 1.5 * h) return { pts: [...pts, [x0, y0]], closed: true };
        if (out(p)) return { pts, closed: false };
      }
      return { pts, closed: false };
    };
    const fwd = run(1);
    if (fwd.closed) return fwd;
    return { pts: [...run(-1).pts.slice(1).reverse(), ...fwd.pts], closed: false };
  }

  const api = { rng, AXES, PLANE8, CANDS, len, unit, cross, dot, same, key, fromKey, force, wireField, fitting, planeField, fieldLine };
  root.Magnet = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
