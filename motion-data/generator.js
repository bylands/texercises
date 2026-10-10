// Random numbers for the exercises on motion data, and the register of their kinds (concepts.js:
// value tables, stroboscope pictures and the graphs to choose for them).
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

  // The kinds of exercise (concepts.js) register here: kind → { difficulties: [1–5], make(seed, d) }
  // (d: the difficulty wanted, or null for any).
  const KINDS = {};
  const register = (kind, def) => { KINDS[kind] = def; };

  // generate(kind, seed): an exercise of a kind (table, …) of any of its difficulties.
  const generate = (kind, seed) => KINDS[kind].make(seed, null);

  const api = { KINDS, register, rng, generate };
  root.Motion = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
