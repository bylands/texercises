// Flux and induced voltage: one graph given, the graph of the other quantity chosen from four.
//
// A flux graph is a list of pieces covering 0 … T, each { type: 'poly', t0, t1, p0, d0, d1 }: the
// flux p0 at t0 and a slope that changes linearly from d0 to d1 (mWb/s) over the piece, so the
// piece is straight (d0 = d1) or a parabola. The induced voltage is V_ind = −dΦ/dt.
// Two families:
//   lin:    straight pieces with breakpoints at whole seconds; the voltage is constant in each
//           piece and jumps at the breakpoints,
//   smooth: a smooth flux graph (no kinks, no straight parts): its slope, and so the voltage, changes
//           steadily and without jumps; the voltage graph is a chain of sloping lines through whole values.
// Two directions: phi2v (the flux given, which voltage graph?) and v2phi (the voltage given and
// the flux at t = 0, which flux graph?). Types: 'phi2v-lin', 'v2phi-lin', 'phi2v-smooth',
// 'v2phi-smooth' (difficulty 1–4).
// The wrong options come from typical mistakes (tag):
//   sign:  Lenz's rule forgotten (the voltage, or the flux, mirrored),
//   copy:  “higher flux, higher voltage”: a graph with the shape of the given one,
//   steep: one piece steeper or flatter,
//   average (phi2v, smooth): a curved piece taken as straight: the voltage at its average slope,
//   straight (v2phi, smooth): the flux joined by straight lines instead of curves.
// An option is { kind: 'flux' | 'volt', f (a function of t), breaks (where it may jump), ok, tag }.
// Units: t in s, Φ in mWb, V in mV (1 mWb/s = 1 mV).
(function (root) {
  'use strict';

  const T = 8;                        // time axis: 0 … T s
  const PHI_MAX = 8;                  // flux axis: 0 … PHI_MAX mWb
  const V_MAX = 3;                    // voltage axis: −V_MAX … V_MAX mV
  const TYPES = ['phi2v-lin', 'v2phi-lin', 'phi2v-smooth', 'v2phi-smooth'];
  const DIFFICULTY = { 'phi2v-lin': 1, 'v2phi-lin': 2, 'phi2v-smooth': 3, 'v2phi-smooth': 4 };
  const SLOPES = [-2, -1, 0, 1, 2];   // mWb/s
  const BEND = 3;                     // |d1 − d0| · L ≥ BEND: a curve deviates visibly from a straight line

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

  // ---------------------------------------------------------------- pieces and graphs
  const neg = (x) => (x === 0 ? 0 : -x); // no −0
  const SHAPE = {
    poly: {
      f: (p, x) => p.d0 * x + ((p.d1 - p.d0) / (2 * (p.t1 - p.t0))) * x * x,
      df: (p, x) => p.d0 + ((p.d1 - p.d0) * x) / (p.t1 - p.t0),
    },
  };
  const piece = (t0, t1, d0, d1 = d0) => ({ type: 'poly', t0, t1, d0, d1 });
  const curved = (p) => p.d0 !== p.d1;
  // the flux p0 at the start of every piece, beginning with `start`
  function chain(pieces, start) {
    let p0 = start;
    return pieces.map((p) => { const q = { ...p, p0 }; p0 += SHAPE.poly.f(p, p.t1 - p.t0); return q; });
  }
  const pieceAt = (g, t) => g.pieces.find((p) => t < p.t1) || g.pieces[g.pieces.length - 1];
  function flux(g, t) { const p = pieceAt(g, t); return p.p0 + SHAPE.poly.f(p, t - p.t0); }
  function volt(g, t) { const p = pieceAt(g, t); return neg(SHAPE.poly.df(p, t - p.t0)); }

  const SAMPLES = Array.from({ length: 401 }, (x, k) => (k * T) / 400);
  const MIDS = Array.from({ length: 400 }, (x, k) => ((k + 0.5) * T) / 400);
  const range = (f) => { const v = SAMPLES.map((t) => f(Math.min(t, T - 1e-9))); return [Math.min(...v), Math.max(...v)]; };

  // Breakpoints in whole seconds: 3 or 4 pieces.
  function breakpoints(r) {
    for (;;) {
      const n = r.int(3, 4), ls = Array.from({ length: n }, () => (n === 4 ? r.int(1, 3) : r.int(2, 4)));
      if (ls.reduce((s, l) => s + l, 0) === T) return ls.reduce((t, l) => [...t, t[t.length - 1] + l], [0]);
    }
  }

  // ---------------------------------------------------------------- the families
  // Straight pieces: every breakpoint a visible change of slope, the flux changing in two pieces or more.
  function linGraph(r) {
    for (;;) {
      const ts = breakpoints(r);
      const pieces = ts.slice(0, -1).map((t0, i) => piece(t0, ts[i + 1], r.pick(SLOPES.filter((d) => Math.abs(d) * (ts[i + 1] - t0) <= 4))));
      if (pieces.some((p, i) => i > 0 && p.d0 === pieces[i - 1].d0)) continue;
      if (pieces.filter((p) => p.d0 !== 0).length < 2) continue;
      return { ts, pieces };
    }
  }
  // Smooth: the voltage at the breakpoints (whole mV), straight in between; so the slope of the flux
  // changes steadily, without jumps. Every piece bends (no straight parts), every breakpoint is a
  // visible kink of the voltage, and at least two pieces bend clearly.
  function smoothGraph(r) {
    for (;;) {
      const ts = breakpoints(r), vs = ts.map(() => r.int(-2, 2));
      const pieces = ts.slice(0, -1).map((t0, i) => piece(t0, ts[i + 1], neg(vs[i]), neg(vs[i + 1])));
      const rate = (p) => (p.d1 - p.d0) / (p.t1 - p.t0);
      if (pieces.some((p, i) => i > 0 && rate(p) === rate(pieces[i - 1]))) continue;
      if (!pieces.every(curved) || pieces.filter((p) => Math.abs(p.d1 - p.d0) * (p.t1 - p.t0) >= BEND).length < 2) continue;
      return { ts, pieces, vs };
    }
  }

  // One piece steeper or flatter (straight), or one voltage at a breakpoint changed by ±1 (smooth).
  function steeper(r, family, base) {
    if (family === 'lin') {
      const idx = base.pieces.map((p, i) => i).filter((i) => base.pieces[i].d0 !== 0);
      const i = r.pick(idx), p = base.pieces[i], d = Math.sign(p.d0) * (3 - Math.abs(p.d0));
      return { ...base, pieces: base.pieces.map((q, j) => (j === i ? piece(q.t0, q.t1, d) : q)) };
    }
    const k = r.int(0, base.vs.length - 1), vs = base.vs.map((v, j) => (j === k ? v + r.pick(v >= 2 ? [-1] : v <= -2 ? [1] : [-1, 1]) : v));
    return { ...base, vs, pieces: base.ts.slice(0, -1).map((t0, i) => piece(t0, base.ts[i + 1], neg(vs[i]), neg(vs[i + 1]))) };
  }

  // ---------------------------------------------------------------- the exercises
  const opt = (kind, f, breaks, tag) => ({ kind, f, breaks, ok: tag === 'right', tag });
  const differ = (a, b) => Math.max(...MIDS.map((t) => Math.abs(a.f(t) - b.f(t)))) >= 0.4;
  const fits = (o) => { const [lo, hi] = range(o.f); return o.kind === 'flux' ? lo >= -1e-9 && hi <= PHI_MAX + 1e-9 : lo >= -V_MAX + 0.15 && hi <= V_MAX - 0.15; };

  // The flux shaped like the voltage: starting at the given flux where it fits, else around the middle.
  function copyFlux(V, phi0, vMid, ts) {
    const v0 = V(0), at = opt('flux', (t) => phi0 + 1.2 * (V(t) - v0), ts, 'copy');
    return fits(at) ? at : opt('flux', (t) => PHI_MAX / 2 + 1.2 * (V(t) - vMid), ts, 'copy');
  }

  function build(type, seed) {
    const r = rng(seed), [dir, family] = type.split('-');
    for (let k = 0; ; k++) {
      const base = family === 'lin' ? linGraph(r) : smoothGraph(r);
      // the start: the flux graph on the axis, with room for the mirrored one where it is an option
      const g0 = { pieces: chain(base.pieces, 0) }, [lo, hi] = range((t) => flux(g0, t));
      const starts = [];
      for (let s = Math.ceil(-lo); s <= Math.floor(PHI_MAX - hi); s++) starts.push(s);
      if (!starts.length) continue;
      const g = { pieces: chain(base.pieces, r.pick(starts)) }, phi0 = g.pieces[0].p0;
      const st = steeper(r, family, base), gs = { pieces: chain(st.pieces, phi0) };
      const ts = base.ts, F = (t) => flux(g, t), V = (t) => volt(g, t);
      let given, cands;
      if (dir === 'phi2v') {
        const [a, b] = range(F), mid = (a + b) / 2, scale = Math.min(2.4 / Math.max(b - a, 1e-9) * 2, 1.2);
        given = opt('flux', F, ts, 'given');
        cands = [
          opt('volt', V, ts, 'right'),
          opt('volt', (t) => -V(t), ts, 'sign'),
          ...r.shuffle([
            opt('volt', (t) => scale * (F(t) - mid), ts, 'copy'),
            opt('volt', (t) => volt(gs, t), ts, 'steep'),
            ...(family === 'smooth' ? [opt('volt', (t) => { const p = pieceAt(g, t); return -(p.d0 + p.d1) / 2; }, ts, 'average')] : []),
          ]),
          opt('volt', (t) => -volt(gs, t), ts, 'sign'),
        ];
      } else {
        const [a, b] = range(V);
        given = opt('volt', V, ts, 'given');
        cands = [
          opt('flux', F, ts, 'right'),
          opt('flux', (t) => 2 * phi0 - F(t), ts, 'sign'),
          ...r.shuffle([
            copyFlux(V, phi0, (a + b) / 2, ts),
            opt('flux', (t) => flux(gs, t), ts, 'steep'),
            ...(family === 'smooth' ? [opt('flux', (t) => { const p = pieceAt(g, t), x = (t - p.t0) / (p.t1 - p.t0); return p.p0 + x * (flux(g, p.t1 - 1e-12) - p.p0); }, ts, 'straight')] : []),
          ]),
          opt('flux', (t) => 2 * phi0 - flux(gs, t), ts, 'sign'),
        ];
      }
      // four options that fit the axis and differ, the right one first
      const options = [];
      for (const c of cands) if (options.length < 4 && fits(c) && options.every((o) => differ(o, c))) options.push(c);
      if (options.length < 4 || !options[0].ok || !fits(given)) continue;
      const p = { d: base.pieces.map((q) => [q.t1, q.d0, q.d1]), phi0 };
      return { id: `${type}-${seed}`, type, dir, family, difficulty: DIFFICULTY[type], p, g, phi0, given, options: r.shuffle(options), ts };
    }
  }

  // An exercise of a type, or (worked examples) a flux graph of a family.
  const generate = (type, seed) => build(type, seed);
  function graphOf(family, seed) {
    const r = rng(seed);
    for (;;) {
      const base = family === 'lin' ? linGraph(r) : smoothGraph(r), g0 = { pieces: chain(base.pieces, 0) }, [lo, hi] = range((t) => flux(g0, t));
      if (Math.ceil(-lo) <= Math.floor(PHI_MAX - hi)) return { pieces: chain(base.pieces, Math.max(Math.ceil(-lo), Math.min(Math.round((PHI_MAX - hi - lo) / 2), Math.floor(PHI_MAX - hi)))) };
    }
  }

  // A flux graph from pieces [t0, t1, d0, d1] (slopes in mWb/s), starting at `start`.
  const graphFrom = (list, start) => ({ pieces: chain(list.map(([t0, t1, d0, d1]) => piece(t0, t1, d0, d1)), start) });

  const api = { T, PHI_MAX, V_MAX, TYPES, DIFFICULTY, BEND, SHAPE, rng, generate, graphOf, graphFrom, flux, volt, curved, pieceAt, range, opt, differ, fits, linGraph, smoothGraph, breakpoints };
  root.Induction = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
