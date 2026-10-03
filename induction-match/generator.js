// Random matching exercises: four graphs of the magnetic flux Φ(t) through a conducting loop
// and, in shuffled order, the four graphs of the induced voltage V_ind(t) = −dΦ/dt.
//
// A graph is a list of pieces covering 0 … T. Each piece has a start and end time (t0, t1),
// the flux p0 at t0 and a shape; with τ = t − t0 and L = t1 − t0:
//   poly: straight or a parabola; the slope changes linearly from d0 to d1 (mWb/s)
//   exp:  Φ = p0 + q·τ + r·(e^(−τ/tc) − 1); a·(1 − e^(−τ/tc)) is q = 0, r = −a
//   sine: Φ = p0 + A·(sin(w·τ + ph) − sin(ph))
// Exercise families:
//   straight: 3–4 straight pieces with shared breakpoints (difficulty 1),
//   pieces: 3–4 straight or parabolic pieces with shared breakpoints (2–3, by the number of
//     curved pieces),
//   exp:    a field switched on or off (3), or both (4): exponential approach to a new value,
//   sine:   a sinusoidal flux (4), possibly switched on after a while (5).
// The levels of the practice mode pick an exercise of the right difficulty from these families.
// The four flux graphs of an exercise are chosen so that typical misconceptions lead to
// wrong pairs:
//   copy (“higher flux, higher voltage”): a voltage graph is built with exactly the shape of
//     a flux graph it does not belong to (not for straight pieces: their voltage graphs jump),
//   sign (Lenz's rule forgotten): the mirror image of a graph,
//   steepness: a graph that changes faster or slower (a steeper piece, a shorter time
//     constant, a larger amplitude), or, for straight and curved pieces, average slope: a
//     curved piece replaced by a straight one with the same average slope.
// diagnose() names the misconception behind a wrong pair.
// Units: t in s, Φ in mWb, V in mV (1 mWb/s = 1 mV).
(function (root) {
  'use strict';

  const T = 8;                        // time axis: 0 … T s
  const PHI_MAX = 8;                  // flux axis: 0 … PHI_MAX mWb
  const V_MAX = 3;                    // voltage axis: −V_MAX … V_MAX mV
  const FLUX = ['A', 'B', 'C', 'D'];
  const VOLT = ['1', '2', '3', '4'];
  const FAMILIES = ['straight', 'pieces', 'exp', 'sine'];
  // practice levels: the difficulties they include; the families that give each difficulty
  const LEVELS = { easy: [1, 2], medium: [3], hard: [4, 5], mixed: [1, 2, 3, 4, 5] };
  const BY_DIFFICULTY = { 1: ['straight'], 2: ['pieces'], 3: ['pieces', 'exp'], 4: ['exp', 'sine'], 5: ['sine'] };
  const MANY_CURVES = 5;              // pieces family: with this many curved pieces or more, difficulty 3

  const SLOPES = [-2, -1, 0, 1, 2];   // mWb/s, straight and curved pieces
  const CURVED = 0.45;                // chance that a piece is curved (where that is visible)
  const BEND = 4;                     // |d1 − d0| · L ≥ BEND: the curve deviates ≥ 0.5 mWb from a straight line
  const EXP = [[2, 1], [3, 1], [3, 1.5], [4, 1.5], [4, 2], [6, 2], [2, 2], [3, 2]]; // [change in mWb, time constant in s]
  const TCS = [0.5, 1, 1.5, 2];       // time constants in s
  const SINES = [[2, 8], [3, 8], [1, 4], [1.5, 4], [1, 8 / 3]]; // [amplitude in mWb, period in s]
  const AMPS = [0.5, 1, 1.5, 2, 2.5, 3];

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
      mirror: (p) => ({ ...p, d0: neg(p.d0), d1: neg(p.d1) }),
    },
    exp: {
      f: (p, x) => p.q * x + p.r * (Math.exp(-x / p.tc) - 1),
      df: (p, x) => p.q - (p.r / p.tc) * Math.exp(-x / p.tc),
      mirror: (p) => ({ ...p, q: neg(p.q), r: neg(p.r) }),
    },
    sine: {
      f: (p, x) => p.A * (Math.sin(p.w * x + p.ph) - Math.sin(p.ph)),
      df: (p, x) => p.A * p.w * Math.cos(p.w * x + p.ph),
      mirror: (p) => ({ ...p, A: neg(p.A) }),
    },
  };
  const straight = (t0, t1, d) => ({ type: 'poly', t0, t1, d0: d, d1: d });
  const curved = (p) => !(p.type === 'poly' && p.d0 === p.d1);

  // Sets the flux p0 at the start of every piece, beginning with `start`.
  function chain(pieces, start) {
    let p0 = start;
    return pieces.map((p) => {
      const q = { ...p, p0 };
      p0 += SHAPE[p.type].f(p, p.t1 - p.t0);
      return q;
    });
  }
  const graph = (pieces) => ({ pieces: chain(pieces, 0) });
  const mirror = (g) => graph(g.pieces.map((p) => SHAPE[p.type].mirror(p)));

  // The piece that holds time t (at a breakpoint, the one that starts there).
  const pieceAt = (g, t) => g.pieces.find((p) => t < p.t1) || g.pieces[g.pieces.length - 1];
  function flux(g, t) { const p = pieceAt(g, t); return p.p0 + SHAPE[p.type].f(p, t - p.t0); }
  function volt(g, t) { const p = pieceAt(g, t); return neg(SHAPE[p.type].df(p, t - p.t0)); }

  const SAMPLES = Array.from({ length: 401 }, (x, k) => (k * T) / 400);
  const MIDS = Array.from({ length: 400 }, (x, k) => ((k + 0.5) * T) / 400);

  function extent(g) {
    const v = SAMPLES.map((t) => flux(g, t));
    return [Math.min(...v), Math.max(...v)];
  }
  // Range of whole-number start values that keep the graph on the flux axis.
  function starts(g) {
    const [lo, hi] = extent(g);
    return [Math.ceil(-lo - 1e-9), Math.floor(PHI_MAX - hi + 1e-9)];
  }
  const vmax = (g) => Math.max(...MIDS.map((t) => Math.abs(volt(g, t))));
  const differ = (a, b) => Math.max(...MIDS.map((t) => Math.abs(volt(a, t) - volt(b, t)))) >= 0.4;

  // A graph whose voltage is α·(Φ_g − c), so that its voltage graph has the shape of g's flux
  // graph. Works for straight pieces, exp pieces with q = 0, and sine pieces centred on c.
  function copy(g, alpha, c) {
    const out = [];
    for (const p of g.pieces) {
      const L = p.t1 - p.t0, b = p.p0 - c; // Φ_g − c at the start of the piece
      if (p.type === 'poly' && p.d0 === p.d1) {
        out.push({ type: 'poly', t0: p.t0, t1: p.t1, d0: -alpha * b, d1: -alpha * (b + p.d0 * L) });
      } else if (p.type === 'exp' && p.q === 0) {
        out.push({ type: 'exp', t0: p.t0, t1: p.t1, q: -alpha * (b - p.r), r: alpha * p.r * p.tc, tc: p.tc });
      } else if (p.type === 'sine' && Math.abs(b - p.A * Math.sin(p.ph)) < 1e-9) {
        out.push({ type: 'sine', t0: p.t0, t1: p.t1, A: (alpha * p.A) / p.w, w: p.w, ph: p.ph + Math.PI / 2 });
      } else {
        return null;
      }
    }
    return graph(out);
  }

  // ---------------------------------------------------------------- family: straight and curved pieces
  // Breakpoints in whole seconds.
  function breakpoints(r) {
    for (;;) {
      const n = r.int(3, 4);
      const ls = Array.from({ length: n }, () => (n === 4 ? r.int(1, 3) : r.int(2, 4)));
      if (ls.reduce((sum, l) => sum + l, 0) === T) return ls.reduce((t, l) => [...t, t[t.length - 1] + l], [0]);
    }
  }

  // Every breakpoint is visible (the slope does not just carry on changing at the same rate),
  // curves bend visibly, slopes stay within ±2 mWb/s and the flux changes in two pieces or more.
  function usablePieces(g) {
    const ps = g.pieces, rate = (p) => (p.d1 - p.d0) / (p.t1 - p.t0);
    if (ps.some((p, i) => i > 0 && p.d0 === ps[i - 1].d1 && rate(p) === rate(ps[i - 1]))) return false;
    if (ps.some((p) => curved(p) && Math.abs(p.d1 - p.d0) * (p.t1 - p.t0) < BEND)) return false;
    if (ps.some((p) => Math.abs(p.d0) > 2 || Math.abs(p.d1) > 2)) return false;
    return ps.filter((p) => p.d0 !== 0 || p.d1 !== 0).length >= 2;
  }

  // Differs from g in one piece: a curved piece becomes straight with the same average slope
  // (if that is a whole number), a sloped straight one gets a different steepness (±1 ↔ ±2).
  function nearPieces(r, g) {
    const avg = (p) => (p.d0 + p.d1) / 2;
    const idx = g.pieces.map((p, i) => i).filter((i) => (curved(g.pieces[i]) ? Number.isInteger(avg(g.pieces[i])) : g.pieces[i].d0 !== 0));
    if (!idx.length) return null;
    const i = r.pick(idx), p = g.pieces[i];
    const pieces = g.pieces.slice();
    pieces[i] = straight(p.t0, p.t1, curved(p) ? avg(p) : Math.sign(p.d0) * (3 - Math.abs(p.d0)));
    return graph(pieces);
  }

  // P: straight pieces with a flux range of at most 4 mWb; Q: its voltage at the breakpoints is
  // P's flux shifted by c, so the voltage graph of Q has the shape of P.
  function piecesFamily(r) {
    const ts = breakpoints(r);
    const p = graph(ts.slice(0, -1).map((t0, i) => {
      const t1 = ts[i + 1];
      return straight(t0, t1, r.pick(SLOPES.filter((d) => Math.abs(d) * (t1 - t0) <= 4)));
    }));
    const [lo, hi] = extent(p);
    if (hi - lo > 4) return null;
    const q = copy(p, 1, r.int(Math.round(hi) - 2, Math.round(lo) + 2));
    const set = [p, q, mirror(r.pick([p, q])), nearPieces(r, r.pick([p, q]))];
    return set.every((g) => g && usablePieces(g)) ? set : null;
  }

  // ---------------------------------------------------------------- family: straight pieces only
  // P, its mirror image, P with one piece steeper or flatter, and that one mirrored or another graph.
  function straightFamily(r) {
    const make = () => {
      const ts = breakpoints(r);
      return graph(ts.slice(0, -1).map((t0, i) => {
        const t1 = ts[i + 1];
        return straight(t0, t1, r.pick(SLOPES.filter((d) => Math.abs(d) * (t1 - t0) <= 4)));
      }));
    };
    const p = make(), near = nearPieces(r, p);
    const set = [p, mirror(p), near, near && (r.next() < 0.5 ? mirror(near) : make())];
    return set.every((g) => g && usablePieces(g)) ? set : null;
  }

  // ---------------------------------------------------------------- family: exponential
  // Switched at ts towards a new value (and, for a pulse, back again at t2).
  function expFamily(r) {
    const pulse = r.next() < 0.4;
    const ts = pulse ? 1 : r.pick([1, 2]);
    const t2 = pulse ? ts + r.pick([3, 4]) : T;
    const [a, tc] = r.pick(EXP);
    const up = r.pick([1, -1]);
    const build = (k) => {
      const pieces = [straight(0, ts, 0), { type: 'exp', t0: ts, t1: t2, q: 0, r: -up * a, tc: k }];
      if (pulse) pieces.push({ type: 'exp', t0: t2, t1: T, q: 0, r: up * a * (1 - Math.exp(-(t2 - ts) / k)), tc: k });
      return graph(pieces);
    };
    const base = build(tc);
    const others = TCS.filter((k) => k !== tc && a / k <= V_MAX - 0.3 && a / k >= 0.8);
    if (!others.length) return null;
    const copied = copy(base, r.pick([1, 1.5]) / a, 0);
    return [base, copied, mirror(r.pick([base, copied])), build(r.pick(others))];
  }

  // ---------------------------------------------------------------- family: sinusoidal
  function sineFamily(r) {
    const [A, P] = r.pick(SINES), w = (2 * Math.PI) / P;
    const ph = (r.int(0, 3) * Math.PI) / 2;
    const on = r.next() < 0.35 ? 2 : 0;
    const build = (amp) => graph([...(on ? [straight(0, on, 0)] : []), { type: 'sine', t0: on, t1: T, A: amp, w, ph }]);
    const base = build(A);
    const amps = AMPS.filter((x) => x !== A && x * w <= V_MAX - 0.3 && x * w >= 0.8);
    // The copy has a round amplitude too: its voltage is α·(Φ − centre) with α = amplitude · w / A.
    const copied = copy(base, (r.pick(amps.concat(A)) * w) / A, -A * Math.sin(ph));
    return [base, copied, mirror(r.pick([base, copied])), build(r.pick(amps))];
  }

  const BUILD = { straight: straightFamily, pieces: piecesFamily, exp: expFamily, sine: sineFamily };

  // ---------------------------------------------------------------- exercise
  // Difficulty 1–5 (see the families above).
  function difficulty(family, fluxes) {
    const n = fluxes[0].pieces.length;
    if (family === 'straight') return 1;
    if (family === 'pieces') return fluxes.flatMap((f) => f.pieces).filter(curved).length >= MANY_CURVES ? 3 : 2;
    if (family === 'exp') return n === 3 ? 4 : 3;
    return n === 2 ? 5 : 4;
  }

  function build(family, seed) {
    const r = rng(seed);
    for (;;) {
      const set = BUILD[family](r);
      if (!set || set.some((g) => !g)) continue;
      if (!set.every((g) => starts(g)[0] <= starts(g)[1] && vmax(g) <= V_MAX - 0.2 && vmax(g) >= 0.4)) continue;
      if (set.some((a, i) => set.slice(i + 1).some((b) => !differ(a, b)))) continue;

      const fluxes = r.shuffle(set).map((g, k) => {
        const [lo, hi] = starts(g);
        return { id: FLUX[k], pieces: chain(g.pieces, r.int(lo, hi)) };
      });
      // Voltage graphs in a different order (never the same position for every pair).
      let order;
      do order = r.shuffle([0, 1, 2, 3]); while (order.every((f, k) => f === k));
      const volts = order.map((f, k) => ({ id: VOLT[k], of: fluxes[f].id }));
      return {
        id: `${family}-${seed}`,
        family,
        difficulty: difficulty(family, fluxes),
        flux: fluxes,
        volt: volts,
        answer: Object.fromEntries(volts.map((u) => [u.of, u.id])),
      };
    }
  }

  // An exercise of one of the difficulties ds, drawn from the families that give it.
  function pick(ds, seed) {
    const r = rng(seed ^ 0x5bd1e995), d = r.pick(ds);
    for (let k = 0; ; k++) {
      const e = build(r.pick(BY_DIFFICULTY[d]), (seed + 7919 * k) >>> 0);
      if (e.difficulty === d) return e;
    }
  }

  // generate(level, seed): a practice exercise (easy, medium, hard, mixed); generate(family, seed):
  // one of a family (for the worked examples).
  function generate(key, seed) {
    if (BUILD[key]) return build(key, seed);
    return { ...pick(LEVELS[key], seed), id: `${key}-${seed}` };
  }
  const ofDifficulty = (d, seed) => pick([d], seed);

  // ---------------------------------------------------------------- misconceptions
  function correlation(a, b) {
    const mean = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;
    const ma = mean(a), mb = mean(b);
    let sab = 0, saa = 0, sbb = 0;
    a.forEach((x, k) => { sab += (x - ma) * (b[k] - mb); saa += (x - ma) ** 2; sbb += (b[k] - mb) ** 2; });
    return saa > 0 && sbb > 0 ? sab / Math.sqrt(saa * sbb) : 0;
  }

  // Which misconception explains pairing flux graph fluxId with voltage graph voltId?
  // 'right' | 'sign' | 'average' | 'copy' | 'steepness' | 'other'
  function diagnose(ex, fluxId, voltId) {
    const f = ex.flux.find((x) => x.id === fluxId), u = ex.volt.find((x) => x.id === voltId);
    if (u.of === fluxId) return 'right';
    const g = ex.flux.find((x) => x.id === u.of);
    const close = (a, b) => Math.abs(a - b) < 1e-6;
    if (MIDS.every((t) => close(volt(g, t), -volt(f, t)))) return 'sign';
    // Every piece fits, except curved ones where the voltage is constant at the average slope.
    const averaged = f.pieces.every((p) => {
      const ts = MIDS.filter((t) => t >= p.t0 && t < p.t1);
      const avg = -(flux(f, p.t1 - 1e-12) - p.p0) / (p.t1 - p.t0);
      return ts.every((t) => close(volt(g, t), volt(f, t))) || (curved(p) && ts.every((t) => close(volt(g, t), avg)));
    });
    if (averaged) return 'average';
    if (correlation(MIDS.map((t) => flux(f, t)), MIDS.map((t) => volt(g, t))) > 0.97) return 'copy';
    const sgn = (x) => (Math.abs(x) < 1e-9 ? 0 : Math.sign(x));
    if (MIDS.every((t) => sgn(volt(g, t)) === sgn(volt(f, t)))) return 'steepness';
    return 'other';
  }

  const api = { T, PHI_MAX, V_MAX, FLUX, VOLT, FAMILIES, LEVELS, BEND, generate, ofDifficulty, diagnose, correlation, flux, volt, curved, SHAPE };
  root.Induction = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
