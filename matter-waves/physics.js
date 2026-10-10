// Matter Waves: the physics and the numbers. Constants (CODATA, rounded as in a formula book), the
// formulas of the app, random numbers for the exercises, and how numbers are written.
//   λ = h/p, p = m·v = √(2·m·E_kin)                 de Broglie (slow particles, no relativity)
//   p = √(2·m·q·U)                                  a particle of charge q accelerated through U
//   E_n = n²·h²/(8·m·L²)                            a particle in a box of width L (infinite walls)
//   Δx = L·√(1/12 − 1/(2n²π²))                      the uncertainty of its position in the state n
//   Δx·Δp ≥ h/(4π)                                  Heisenberg's uncertainty relation
// Units inside: SI (m, kg, J); energies given in eV.
(function (root) {
  'use strict';

  const h = 6.626e-34, c = 2.998e8, e = 1.602e-19;
  const me = 9.109e-31, mp = 1.673e-27;

  // ---------------------------------------------------------------- formulas
  const pOfU = (m, U, q = 1) => Math.sqrt(2 * m * q * e * U); // accelerated through U (V), charge q·e
  const lambdaU = (U, m = me, q = 1) => h / pOfU(m, U, q); // m
  const minDp = (dx) => h / (4 * Math.PI * dx); // kg·m/s
  const boxE = (n, L, m = me) => (n * n * h * h) / (8 * m * L * L); // J
  const boxDx = (n) => Math.sqrt(1 / 12 - 1 / (2 * n * n * Math.PI * Math.PI)); // in units of L

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
    const pick = (arr) => arr[Math.floor(next() * arr.length)];
    const shuffle = (arr) => { const b = [...arr]; for (let k = b.length - 1; k > 0; k--) { const j = Math.floor(next() * (k + 1)); [b[k], b[j]] = [b[j], b[k]]; } return b; };
    const int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
    // a value from lo to hi in steps of step
    const step = (lo, hi, st) => Math.round((lo + Math.floor(next() * (Math.round((hi - lo) / st) + 1)) * st) * 1e9) / 1e9;
    // a standard normal number (Box–Muller)
    const gauss = () => Math.sqrt(-2 * Math.log(1 - next())) * Math.cos(2 * Math.PI * next());
    return { next, pick, shuffle, int, step, gauss };
  }

  // ---------------------------------------------------------------- numbers as text
  const MINUS = '−';
  const signed = (s) => s.replace(/^-/, MINUS);
  // x rounded to sig significant figures, as a plain decimal (no exponent)
  function round(x, sig = 3) {
    if (!x) return 0;
    const k = sig - 1 - Math.floor(Math.log10(Math.abs(x)));
    const f = Math.pow(10, k);
    return Math.round(x * f) / f;
  }
  function plain(x, sig = 3) {
    if (!Number.isFinite(x)) return String(x);
    if (x === 0) return '0';
    const k = Math.max(0, sig - 1 - Math.floor(Math.log10(Math.abs(x))));
    return signed(round(x, sig).toFixed(Math.min(k, 12)));
  }
  // mantissa · 10^exp, as HTML
  function sci(x, sig = 3) {
    if (!x) return '0';
    let ex = Math.floor(Math.log10(Math.abs(x)));
    let m = round(x / Math.pow(10, ex), sig);
    if (Math.abs(m) >= 10) { m /= 10; ex++; }
    const ms = signed(m.toFixed(sig - 1));
    return ex === 0 ? ms : `${ms} · 10<sup>${signed(String(ex))}</sup>`;
  }
  // plain for everyday sizes, else scientific
  const num = (x, sig = 3) => (x && (Math.abs(x) >= 1e5 || Math.abs(x) < 1e-3) ? sci(x, sig) : plain(x, sig));
  // the power of ten as a unit prefix in the answer fields: 10⁻²⁴ kg·m/s
  const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const pow = (k) => `10${String(k).split('').map((d) => SUP[d]).join('')}`;
  // the power of ten for a value: 10^k with 1 ≤ value/10^k < 10
  const expOf = (x) => Math.floor(Math.log10(Math.abs(x)) + 1e-9);
  // a length in a fitting unit: [value, unit, factor (m per unit)]
  function lenUnit(m) {
    if (m >= 1e-3) return [m * 1e3, 'mm', 1e-3];
    if (m >= 1e-6) return [m * 1e6, 'µm', 1e-6];
    if (m >= 1e-9) return [m * 1e9, 'nm', 1e-9];
    if (m >= 1e-12) return [m * 1e12, 'pm', 1e-12];
    if (m >= 1e-15) return [m * 1e15, 'fm', 1e-15];
    const k = expOf(m);
    return [m / 10 ** k, `${pow(k)} m`, 10 ** k];
  }

  const api = {
    h, c, e, me, mp, pOfU, lambdaU, minDp, boxE, boxDx,
    rng, round, plain, sci, num, pow, expOf, lenUnit, MINUS,
  };
  root.MatterWave = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
