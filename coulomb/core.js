// Helpers of the app: language (from lang.js, shared by the apps), Coulomb's law and vectors,
// quantities in units, number formatting (powers of ten where needed) and random numbers.
(function (root) {
  'use strict';

  const Lang = root.Lang || require('./lang.js');
  const getLang = () => Lang.get();
  const L = (en, de) => Lang.L(en, de);

  const K = 9.0e9; // N·m²/C², rounded, as in class
  const E = 1.6e-19; // C, the elementary charge, rounded

  // ---------------------------------------------------------------- vectors and forces
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const mul = (a, k) => [a[0] * k, a[1] * k];
  const len = (a) => Math.hypot(a[0], a[1]);
  const unit = (a) => mul(a, 1 / len(a));
  // The force on a charge qt at pt from a charge q at p (SI): positive product → away from p.
  const force = (qt, pt, q, p) => { const d = sub(pt, p), r = len(d); return mul(d, (K * qt * q) / r ** 3); };

  // The eight directions of the compass (on the screen: E to the right, N up) and none.
  const DIRS = ['E', 'NE', 'N', 'NW', 'W', 'SW', 'S', 'SE'];
  const ARROW = { E: '→', NE: '↗', N: '↑', NW: '↖', W: '←', SW: '↙', S: '↓', SE: '↘', 0: '0' };
  const dirName = (d) => ({
    E: L('to the right', 'nach rechts'), NE: L('up and to the right', 'nach rechts oben'), N: L('up', 'nach oben'), NW: L('up and to the left', 'nach links oben'),
    W: L('to the left', 'nach links'), SW: L('down and to the left', 'nach links unten'), S: L('down', 'nach unten'), SE: L('down and to the right', 'nach rechts unten'),
    0: L('no force', 'keine Kraft'),
  }[d]);
  // the direction of a vector among the eight, or 0 if it is (nearly) zero; null if in between
  function dirOf(v, scale = 1) {
    if (len(v) <= 1e-9 * scale) return '0';
    const a = (Math.atan2(v[1], v[0]) * 180) / Math.PI, k = Math.round(a / 45);
    return Math.abs(a - 45 * k) < 1e-6 ? DIRS[(k + 8) % 8] : null;
  }
  const DIRVEC = { E: [1, 0], NE: [Math.SQRT1_2, Math.SQRT1_2], N: [0, 1], NW: [-Math.SQRT1_2, Math.SQRT1_2], W: [-1, 0], SW: [-Math.SQRT1_2, -Math.SQRT1_2], S: [0, -1], SE: [Math.SQRT1_2, -Math.SQRT1_2] };

  // ---------------------------------------------------------------- numbers
  // Results to three significant digits; small and large numbers as powers of ten. The decimal
  // point in both languages.
  const clean = (x) => Number(x.toPrecision(12)) + 0;
  const sig = (x, n = 3) => (Number.isFinite(x) ? clean(Number(x.toPrecision(n))) : 0);
  const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const sci = (x) => (x !== 0 && (Math.abs(x) < 1e-3 || Math.abs(x) >= 1e5));
  function parts(x, n) {
    let e = Math.floor(Math.log10(Math.abs(x))), m = sig(x / 10 ** e, n);
    if (Math.abs(m) >= 10) { m = sig(m / 10, n); e += 1; }
    return [m, e];
  }
  // as text: 5.3·10⁻¹¹; in KaTeX: 5.3\cdot 10^{-11}
  const num = (x, n = 3) => { if (!sci(x)) return String(sig(x, n)); const [m, e] = parts(x, n); return `${m}·10${String(e).replace(/./g, (c) => SUP[c])}`; };
  const tnum = (x, n = 3) => { if (!sci(x)) return String(sig(x, n)); const [m, e] = parts(x, n); return `${m}\\cdot 10^{${e}}`; };

  // Units: a quantity is kept in SI; shown in a unit with its factor.
  const UNITS = {
    N: [1, 'N', '\\mathrm{N}'], mN: [1e-3, 'mN', '\\mathrm{mN}'], 'μN': [1e-6, 'μN', '\\mu\\mathrm{N}'],
    C: [1, 'C', '\\mathrm{C}'], 'μC': [1e-6, 'μC', '\\mu\\mathrm{C}'], nC: [1e-9, 'nC', '\\mathrm{nC}'],
    m: [1, 'm', '\\mathrm{m}'], cm: [1e-2, 'cm', '\\mathrm{cm}'], mm: [1e-3, 'mm', '\\mathrm{mm}'],
    kg: [1, 'kg', '\\mathrm{kg}'], 'm/s²': [1, 'm/s²', '\\mathrm{m/s^2}'], deg: [1, '°', '^\\circ'], '': [1, '', ''],
  };
  const inUnit = (x, u) => x / UNITS[u][0];
  // "2.5 cm" and 2.5\,\mathrm{cm}, from the SI value
  const q = (x, u, n) => (u === 'deg' ? `${num(inUnit(x, u), n)}°` : u ? `${num(inUnit(x, u), n)}\u00a0${UNITS[u][1]}` : num(x, n));
  const tq = (x, u, n) => (u === 'deg' ? `${tnum(inUnit(x, u), n)}^\\circ` : u ? `${tnum(inUnit(x, u), n)}\\,${UNITS[u][2]}` : tnum(x, n));
  // a charge with its sign: "+3 μC", "−2 nC"
  const qs = (x, u) => `${x < 0 ? '−' : '+'}${q(Math.abs(x), u)}`;
  const tqs = (x, u) => `${x < 0 ? '-' : '+'}${tq(Math.abs(x), u)}`;
  // A force in the unit that keeps its number between 0.1 and 1000.
  const forceUnit = (F) => (Math.abs(F) >= 0.1 ? 'N' : Math.abs(F) >= 1e-4 ? 'mN' : 'μN');

  // ---------------------------------------------------------------- random numbers
  function rng(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const pick = (r, list) => list[Math.floor(r() * list.length)];
  const shuffle = (r, a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sign = (r) => (r() < 0.5 ? 1 : -1);

  root.CL = {
    getLang, L, K, E, add, sub, mul, len, unit, force, DIRS, ARROW, DIRVEC, dirName, dirOf,
    clean, sig, num, tnum, UNITS, inUnit, q, tq, qs, tqs, forceUnit, rng, pick, shuffle, sign,
  };
  if (typeof module !== 'undefined') module.exports = root.CL;
})(typeof window !== 'undefined' ? window : globalThis);
