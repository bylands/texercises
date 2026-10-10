// Helpers of the app: language (from lang.js, shared by the apps), quantities in units,
// number formatting (powers of ten where needed) and random numbers.
(function (root) {
  'use strict';

  const Lang = root.Lang || require('./lang.js');
  const getLang = () => Lang.get();
  const L = (en, de) => Lang.L(en, de);

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
  // as text: 5.3·10⁻¹¹ (a minus sign, not a hyphen); in KaTeX: 5.3\cdot 10^{-11}
  const num = (x, n = 3) => { if (!sci(x)) return String(sig(x, n)).replace('-', '−'); const [m, e] = parts(x, n); return `${String(m).replace('-', '−')}·10${String(e).replace(/./g, (c) => SUP[c])}`; };
  const tnum = (x, n = 3) => { if (!sci(x)) return String(sig(x, n)); const [m, e] = parts(x, n); return `${m}\\cdot 10^{${e}}`; };

  // Units: a quantity is kept in SI; shown in a unit with its factor.
  const UNITS = {
    km: [1e3, 'km', '\\mathrm{km}'], m: [1, 'm', '\\mathrm{m}'], cm: [1e-2, 'cm', '\\mathrm{cm}'], mm: [1e-3, 'mm', '\\mathrm{mm}'], 'μm': [1e-6, 'μm', '\\mu\\mathrm{m}'], nm: [1e-9, 'nm', '\\mathrm{nm}'],
    rad: [1, 'rad', '\\mathrm{rad}'], mrad: [1e-3, 'mrad', '\\mathrm{mrad}'], 'μrad': [1e-6, 'μrad', '\\mu\\mathrm{rad}'], '': [1, '', ''],
  };
  const inUnit = (x, u) => x / UNITS[u][0];
  // "2.5 cm" and 2.5\,\mathrm{cm}, from the SI value
  const q = (x, u, n) => (u ? `${num(inUnit(x, u), n)}\u00a0${UNITS[u][1]}` : num(x, n));
  const tq = (x, u, n) => (u ? `${tnum(inUnit(x, u), n)}\\,${UNITS[u][2]}` : tnum(x, n));

  // the unit of a family that keeps a value between 1 and 1000 (the smallest or largest unit else)
  const best = (x, list) => { for (const u of list) if (Math.abs(x) >= 0.9999 * UNITS[u][0]) return u; return list[list.length - 1]; };
  const lengthUnit = (x) => best(x, ['km', 'm', 'cm', 'mm', 'μm', 'nm']);
  const angleUnit = (x) => best(x, ['rad', 'mrad', 'μrad']);

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

  root.IW = {
    getLang, L, clean, sig, num, tnum, UNITS, inUnit, q, tq,
    lengthUnit, angleUnit, rng, pick, shuffle,
  };
  if (typeof module !== 'undefined') module.exports = root.IW;
})(typeof window !== 'undefined' ? window : globalThis);
