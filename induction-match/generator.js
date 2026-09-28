// Random matching exercises: four graphs of the magnetic flux Φ(t) through a conducting loop
// and, in shuffled order, the four graphs of the induced voltage V_ind(t) = −dΦ/dt.
//
// In each interval, Φ(t) is either a straight line or a parabola. An interval is described by
// the slope of Φ at its start and end (d0, d1 in mWb/s; equal for a straight line), so
// V_ind(t) runs linearly from −d0 to −d1: constant where Φ is straight, a sloping line where
// Φ is curved. All four flux graphs share the same breakpoints, so they can only be told
// apart by their slopes.
//
// The four flux graphs are chosen so that typical misconceptions lead to wrong pairs:
// - copy (“higher flux, higher voltage”): P is made of straight pieces, and Q is built so that
//   its voltage graph has exactly the shape of P,
// - sign (Lenz's rule forgotten): the mirror image of P or Q,
// - steepness or average slope: P or Q changed in one interval, either to a different
//   steepness or, for a curved interval, to a straight line with the same average slope.
// diagnose() names the misconception behind a wrong pair.
// Units: t in s, Φ in mWb, V in mV (1 mWb/s = 1 mV).
(function (root) {
  'use strict';

  const T = 8;                        // time axis: 0 … T s
  const PHI_MAX = 8;                  // flux axis: 0 … PHI_MAX mWb
  const V_MAX = 3;                    // voltage axis: −V_MAX … V_MAX mV
  const SLOPES = [-2, -1, 0, 1, 2];   // mWb/s
  const CURVED = 0.45;                // chance that an interval is curved (where that is visible)
  const BEND = 4;                     // |d1 − d0| · length ≥ BEND: the curve deviates ≥ 0.5 mWb from a straight line
  const FLUX = ['A', 'B', 'C', 'D'];
  const VOLT = ['1', '2', '3', '4'];

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

  // ---------------------------------------------------------------- graphs
  const neg = (x) => (x === 0 ? 0 : -x); // no −0
  const curved = (seg) => seg.d0 !== seg.d1;
  const key = (segs) => segs.map((s) => `${s.d0}:${s.d1}`).join(',');
  const mirror = (segs) => segs.map((s) => ({ d0: neg(s.d0), d1: neg(s.d1) }));
  const straight = (d) => ({ d0: d, d1: d });

  // Interval lengths in whole seconds that add up to T.
  function intervals(r) {
    for (;;) {
      const n = r.int(3, 4);
      const ls = Array.from({ length: n }, () => (n === 4 ? r.int(1, 3) : r.int(2, 4)));
      if (ls.reduce((sum, l) => sum + l, 0) === T) return ls;
    }
  }

  // A straight or, where the bend would be visible, curved interval.
  function segment(r, len) {
    const d0 = r.pick(SLOPES);
    const ends = SLOPES.filter((d) => Math.abs(d - d0) * len >= BEND);
    return ends.length && r.next() < CURVED ? { d0, d1: r.pick(ends) } : straight(d0);
  }

  // Flux at time τ into an interval of length len that starts at phi.
  const at = (seg, len, phi, tau) => phi + seg.d0 * tau + ((seg.d1 - seg.d0) / (2 * len)) * tau * tau;

  // Flux at the breakpoints, starting at `start`.
  function values(segs, ls, start) {
    const v = [start];
    segs.forEach((s, i) => v.push(at(s, ls[i], v[i], ls[i])));
    return v;
  }

  // Smallest and largest flux, including extremes inside curved intervals.
  function extent(segs, ls, start) {
    const v = values(segs, ls, start), all = v.slice();
    segs.forEach((s, i) => {
      if (curved(s) && s.d0 * s.d1 < 0) all.push(at(s, ls[i], v[i], (-s.d0 / (s.d1 - s.d0)) * ls[i]));
    });
    return [Math.min(...all), Math.max(...all)];
  }

  // Every breakpoint is visible (the slope of Φ does not just carry on changing at the same
  // rate), curves bend visibly, the flux changes in at least two intervals, and it fits on the
  // flux axis with a whole-number start value.
  function usable(segs, ls) {
    const rate = (i) => (segs[i].d1 - segs[i].d0) / ls[i];
    if (segs.some((s, i) => i > 0 && s.d0 === segs[i - 1].d1 && rate(i) === rate(i - 1))) return false;
    if (segs.some((s, i) => curved(s) && Math.abs(s.d1 - s.d0) * ls[i] < BEND)) return false;
    if (segs.some((s) => Math.abs(s.d0) > 2 || Math.abs(s.d1) > 2)) return false;
    if (segs.filter((s) => s.d0 !== 0 || s.d1 !== 0).length < 2) return false;
    const [lo, hi] = extent(segs, ls, 0);
    return Math.ceil(-lo) <= Math.floor(PHI_MAX - hi);
  }

  // P: straight pieces, flux range at most 4 mWb (so that its shape fits on the voltage axis).
  // Q: its voltage at the breakpoints is P's flux shifted by c, so V_Q(t) has the shape of P(t).
  function copyPair(r, ls) {
    const p = ls.map((l) => straight(r.pick(SLOPES.filter((d) => Math.abs(d) * l <= 4))));
    const v = values(p, ls, 0);
    const lo = Math.min(...v), hi = Math.max(...v);
    if (hi - lo > 4) return null;
    const c = r.int(hi - 2, lo + 2);
    const w = v.map((x) => x - c);
    const q = ls.map((l, i) => ({ d0: neg(w[i]), d1: neg(w[i + 1]) }));
    return [p, q];
  }

  // A graph that differs from `base` in one interval: a curved interval becomes a straight line
  // with the same average slope (if that is a whole number), a sloped straight one gets a
  // different steepness with the same sign.
  function near(r, base) {
    const avg = (s) => (s.d0 + s.d1) / 2;
    const fits = (s) => (curved(s) ? Number.isInteger(avg(s)) : s.d0 !== 0);
    const idx = base.map((s, i) => i).filter((i) => fits(base[i]));
    if (!idx.length) return null;
    const i = r.pick(idx), s = base[i], out = base.slice();
    out[i] = straight(curved(s) ? avg(s) : Math.sign(s.d0) * (3 - Math.abs(s.d0))); // ±1 ↔ ±2
    return out;
  }

  function generate(seed) {
    const r = rng(seed);
    for (;;) {
      const ls = intervals(r);
      const pq = copyPair(r, ls);
      if (!pq) continue;
      const [p, q] = pq;
      const m = mirror(r.pick(pq));
      const n = near(r, r.pick(pq));
      if (!n) continue;
      const set = [p, q, m, n];
      if (!set.every((s) => usable(s, ls))) continue;
      if (new Set(set.map(key)).size < set.length) continue;

      const flux = r.shuffle(set).map((segs, k) => {
        const [lo, hi] = extent(segs, ls, 0);
        const start = r.int(Math.ceil(-lo), Math.floor(PHI_MAX - hi));
        return { id: FLUX[k], segs, values: values(segs, ls, start) };
      });
      // Voltage graphs in a different order (never the same position for every pair).
      let order;
      do order = r.shuffle([0, 1, 2, 3]); while (order.every((f, k) => f === k));
      const volt = order.map((f, k) => ({ id: VOLT[k], segs: voltage(flux[f].segs), of: flux[f].id }));
      const times = ls.reduce((t, l) => [...t, t[t.length - 1] + l], [0]);
      return {
        id: String(seed),
        times,
        flux,
        volt,
        answer: Object.fromEntries(volt.map((u) => [u.of, u.id])),
      };
    }
  }

  const voltage = (segs) => segs.map((s) => ({ v0: neg(s.d0), v1: neg(s.d1) }));

  // ---------------------------------------------------------------- misconceptions
  function fluxAt(ex, f, t) {
    const i = Math.max(0, Math.min(ex.times.findIndex((x) => x > t) - 1, f.segs.length - 1));
    return at(f.segs[i], ex.times[i + 1] - ex.times[i], f.values[i], t - ex.times[i]);
  }
  function voltAt(ex, segs, t) {
    const i = Math.max(0, Math.min(ex.times.findIndex((x) => x > t) - 1, segs.length - 1));
    const s = segs[i];
    return s.v0 + ((s.v1 - s.v0) * (t - ex.times[i])) / (ex.times[i + 1] - ex.times[i]);
  }

  // Does the voltage graph have the same shape as the flux graph (correlation close to 1)?
  function sameShape(ex, f, segs) {
    const ts = Array.from({ length: 161 }, (x, k) => (k * T) / 160);
    const a = ts.map((t) => fluxAt(ex, f, t)), b = ts.map((t) => voltAt(ex, segs, t));
    const mean = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;
    const ma = mean(a), mb = mean(b);
    let sab = 0, saa = 0, sbb = 0;
    a.forEach((x, k) => { sab += (x - ma) * (b[k] - mb); saa += (x - ma) ** 2; sbb += (b[k] - mb) ** 2; });
    return saa > 0 && sbb > 0 && sab / Math.sqrt(saa * sbb) > 0.97;
  }

  // Which misconception explains pairing flux graph fluxId with voltage graph voltId?
  // 'right' | 'sign' | 'copy' | 'average' | 'steepness' | 'other'
  function diagnose(ex, fluxId, voltId) {
    const f = ex.flux.find((x) => x.id === fluxId), w = ex.volt.find((x) => x.id === voltId);
    if (w.of === fluxId) return 'right';
    const own = voltage(f.segs);
    if (w.segs.every((s, i) => s.v0 === neg(own[i].v0) && s.v1 === neg(own[i].v1))) return 'sign';
    if (sameShape(ex, f, w.segs)) return 'copy';
    const avg = w.segs.every((s, i) => (s.v0 === own[i].v0 && s.v1 === own[i].v1) ||
      (curved(f.segs[i]) && s.v0 === s.v1 && s.v0 === neg((f.segs[i].d0 + f.segs[i].d1) / 2)));
    if (avg) return 'average';
    const sgn = (x) => (Math.abs(x) < 1e-9 ? 0 : Math.sign(x));
    const ts = Array.from({ length: 81 }, (x, k) => (k * T) / 80 + 1e-6).filter((t) => t < T);
    if (ts.every((t) => sgn(voltAt(ex, w.segs, t)) === sgn(voltAt(ex, own, t)))) return 'steepness';
    return 'other';
  }

  const api = { T, PHI_MAX, V_MAX, FLUX, VOLT, generate, diagnose, extent, curved, BEND };
  root.Induction = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
