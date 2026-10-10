// Photoelectric Effect: the physics and the numbers. Constants (CODATA, rounded as in a formula book), the
// formulas of the app, random numbers for the exercises, and how numbers are written.
//   E = h·f = h·c/λ, h·c = 1240 eV·nm             photon energy
//   E_kin,max = h·f − W, e·U₀ = E_kin,max         photoelectric effect (Einstein)
//   U₀ = (h/e)·f − W/e, f_G = W/h, λ_G = c/f_G      the stopping voltage against the frequency
// Units in the exercises: λ in nm, f in Hz, E in eV, U in V.
(function (root) {
  'use strict';

  const h = 6.626e-34, c = 2.998e8, e = 1.602e-19;
  const HC = (h * c) / e * 1e9; // 1239.8 eV·nm
  const hEV = h / e; // 4.136 · 10⁻¹⁵ eV·s

  // ---------------------------------------------------------------- formulas
  const freq = (nm) => c / (nm * 1e-9); // Hz
  const eV = (nm) => HC / nm; // photon energy in eV from λ in nm
  const nmOf = (eVal) => HC / eVal; // λ in nm from E in eV
  // the fastest photoelectrons: E_kin in eV (negative: none released)
  const ekin = (nm, W) => eV(nm) - W;

  // Metals: work functions in eV, as in a formula book.
  const METALS = [
    { id: 'cs', en: 'caesium', de: 'Cäsium', sym: 'Cs', W: 1.94 },
    { id: 'k', en: 'potassium', de: 'Kalium', sym: 'K', W: 2.25 },
    { id: 'na', en: 'sodium', de: 'Natrium', sym: 'Na', W: 2.28 },
    { id: 'ca', en: 'calcium', de: 'Calcium', sym: 'Ca', W: 2.87 },
    { id: 'mg', en: 'magnesium', de: 'Magnesium', sym: 'Mg', W: 3.66 },
    { id: 'zn', en: 'zinc', de: 'Zink', sym: 'Zn', W: 4.27 },
    { id: 'cu', en: 'copper', de: 'Kupfer', sym: 'Cu', W: 4.48 },
    { id: 'pt', en: 'platinum', de: 'Platin', sym: 'Pt', W: 5.36 },
  ];
  // An RGB colour for drawing visible light.
  function rgb(nm) {
    let r = 0, g = 0, b = 0;
    if (nm >= 380 && nm < 440) { r = (440 - nm) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm < 510) { g = 1; b = (510 - nm) / 20; } else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = (645 - nm) / 65; } else if (nm <= 780) r = 1;
    const k = nm < 420 ? 0.4 + (0.6 * (nm - 380)) / 40 : nm > 700 ? 0.4 + (0.6 * (780 - nm)) / 80 : 1;
    const to = (x) => Math.round(255 * Math.pow(Math.max(0, x * k), 0.8));
    return `rgb(${to(r)}, ${to(g)}, ${to(b)})`;
  }

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
    return { next, pick, shuffle, int, step };
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
  // the power of ten as a unit prefix in the answer fields: 10¹⁴ Hz
  const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const pow = (k) => `10${String(k).split('').map((d) => SUP[d]).join('')}`;

  const api = {
    h, c, e, HC, hEV, freq, eV, nmOf, ekin,
    METALS, rgb, rng, round, plain, sci, num, pow, MINUS,
  };
  root.Photon = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
