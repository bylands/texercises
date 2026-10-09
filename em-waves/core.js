// Helpers of the app: language (from lang.js, shared by the apps), constants, quantities in units,
// number formatting (powers of ten where needed) and random numbers.
(function (root) {
  'use strict';

  const Lang = root.Lang || require('./lang.js');
  const getLang = () => Lang.get();
  const L = (en, de) => Lang.L(en, de);

  // ---------------------------------------------------------------- constants
  // c as in school, 3.00·10⁸ m/s; ε₀ for the intensity
  const C = 3e8, EPS0 = 8.854e-12;

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
    km: [1e3, 'km', '\\mathrm{km}'], m: [1, 'm', '\\mathrm{m}'], cm: [1e-2, 'cm', '\\mathrm{cm}'], mm: [1e-3, 'mm', '\\mathrm{mm}'], 'μm': [1e-6, 'μm', '\\mu\\mathrm{m}'], nm: [1e-9, 'nm', '\\mathrm{nm}'], pm: [1e-12, 'pm', '\\mathrm{pm}'],
    s: [1, 's', '\\mathrm{s}'], min: [60, 'min', '\\mathrm{min}'], ms: [1e-3, 'ms', '\\mathrm{ms}'], 'μs': [1e-6, 'μs', '\\mu\\mathrm{s}'], ns: [1e-9, 'ns', '\\mathrm{ns}'],
    Hz: [1, 'Hz', '\\mathrm{Hz}'], kHz: [1e3, 'kHz', '\\mathrm{kHz}'], MHz: [1e6, 'MHz', '\\mathrm{MHz}'], GHz: [1e9, 'GHz', '\\mathrm{GHz}'], THz: [1e12, 'THz', '\\mathrm{THz}'],
    H: [1, 'H', '\\mathrm{H}'], mH: [1e-3, 'mH', '\\mathrm{mH}'], 'μH': [1e-6, 'μH', '\\mu\\mathrm{H}'],
    'μF': [1e-6, 'μF', '\\mu\\mathrm{F}'], nF: [1e-9, 'nF', '\\mathrm{nF}'], pF: [1e-12, 'pF', '\\mathrm{pF}'],
    V: [1, 'V', '\\mathrm{V}'], A: [1, 'A', '\\mathrm{A}'], mA: [1e-3, 'mA', '\\mathrm{mA}'],
    J: [1, 'J', '\\mathrm{J}'], mJ: [1e-3, 'mJ', '\\mathrm{mJ}'], 'μJ': [1e-6, 'μJ', '\\mu\\mathrm{J}'],
    W: [1, 'W', '\\mathrm{W}'], mW: [1e-3, 'mW', '\\mathrm{mW}'], kW: [1e3, 'kW', '\\mathrm{kW}'],
    'W/m²': [1, 'W/m²', '\\mathrm{W/m^2}'], 'mW/m²': [1e-3, 'mW/m²', '\\mathrm{mW/m^2}'], 'μW/m²': [1e-6, 'μW/m²', '\\mu\\mathrm{W/m^2}'], 'kW/m²': [1e3, 'kW/m²', '\\mathrm{kW/m^2}'],
    'V/m': [1, 'V/m', '\\mathrm{V/m}'], 'mV/m': [1e-3, 'mV/m', '\\mathrm{mV/m}'], 'kV/m': [1e3, 'kV/m', '\\mathrm{kV/m}'],
    T: [1, 'T', '\\mathrm{T}'], 'μT': [1e-6, 'μT', '\\mu\\mathrm{T}'], nT: [1e-9, 'nT', '\\mathrm{nT}'], pT: [1e-12, 'pT', '\\mathrm{pT}'],
    'm/s': [1, 'm/s', '\\mathrm{m/s}'], '°': [1, '°', '^\\circ'], '': [1, '', ''],
  };
  const inUnit = (x, u) => x / UNITS[u][0];
  // "2.5 cm" and 2.5\,\mathrm{cm}, from the SI value (no space before °)
  const q = (x, u, n) => (u === '°' ? `${num(x, n)}°` : u ? `${num(inUnit(x, u), n)}\u00a0${UNITS[u][1]}` : num(x, n));
  const tq = (x, u, n) => (u === '°' ? `${tnum(x, n)}^\\circ` : u ? `${tnum(inUnit(x, u), n)}\\,${UNITS[u][2]}` : tnum(x, n));

  // the unit of a family that keeps a value between 1 and 1000 (the smallest or largest unit else)
  const best = (x, list) => { for (const u of list) if (Math.abs(x) >= 0.9999 * UNITS[u][0]) return u; return list[list.length - 1]; };
  const lengthUnit = (x) => best(x, ['km', 'm', 'cm', 'mm', 'μm', 'nm', 'pm']);
  const freqUnit = (f) => best(f, ['THz', 'GHz', 'MHz', 'kHz', 'Hz']);
  const timeUnit = (t) => best(t, ['s', 'ms', 'μs', 'ns']);
  const capUnit = (c) => best(c, ['μF', 'nF', 'pF']);
  const indUnit = (l) => best(l, ['H', 'mH', 'μH']);
  const intUnit = (i) => best(i, ['kW/m²', 'W/m²', 'mW/m²', 'μW/m²']);
  const fieldUnit = (e) => best(e, ['kV/m', 'V/m', 'mV/m']);
  const bUnit = (b) => best(b, ['T', 'μT', 'nT', 'pT']);
  const energyUnit = (w) => best(w, ['J', 'mJ', 'μJ']);
  const currentUnit = (i) => best(i, ['A', 'mA']);
  const powerUnit = (p) => best(p, ['kW', 'W', 'mW']);

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

  root.EW = {
    getLang, L, C, EPS0, clean, sig, num, tnum, UNITS, inUnit, q, tq,
    lengthUnit, freqUnit, timeUnit, capUnit, indUnit, intUnit, fieldUnit, bUnit, energyUnit, currentUnit, powerUnit, rng, pick, shuffle,
  };
  if (typeof module !== 'undefined') module.exports = root.EW;
})(typeof window !== 'undefined' ? window : globalThis);
