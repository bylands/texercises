// Photons: the physics and the numbers. Constants (CODATA, rounded as in a formula book), the
// formulas of the app, random numbers for the exercises, and how numbers are written.
//   E = h·f = h·c/λ, h·c = 1240 eV·nm             photon energy
//   E_kin,max = h·f − W, e·U₀ = E_kin,max         photoelectric effect (Einstein)
//   p = h/λ = E/c                                photon momentum; radiation force F = P/c (absorbed),
//                                                2P/c (reflected), P the power of the light
//   λ_min = h·c/(e·U)                            X-ray tube (Duane–Hunt)
//   Δλ = λ_C·(1 − cos θ), λ_C = h/(m_e·c)        Compton effect
// Units in the exercises: λ in nm (X-rays in pm), f in Hz, E in eV or J, U in V.
(function (root) {
  'use strict';

  const h = 6.626e-34, c = 2.998e8, e = 1.602e-19, me = 9.109e-31;
  const HC = (h * c) / e * 1e9; // 1239.8 eV·nm
  const LC = (h / (me * c)) * 1e12; // 2.426 pm

  // ---------------------------------------------------------------- formulas
  const freq = (nm) => c / (nm * 1e-9); // Hz
  const eV = (nm) => HC / nm; // photon energy in eV from λ in nm
  const joule = (nm) => (h * c) / (nm * 1e-9);
  const nmOf = (eVal) => HC / eVal; // λ in nm from E in eV
  const momentum = (nm) => h / (nm * 1e-9); // kg·m/s
  const lambdaMin = (U) => (HC / U) * 1e3; // pm, U in V
  const compton = (theta) => LC * (1 - Math.cos((theta * Math.PI) / 180)); // pm
  // the fastest photoelectrons: E_kin in eV (negative: none released)
  const ekin = (nm, W) => eV(nm) - W;
  const speed = (ekinEV) => Math.sqrt((2 * ekinEV * e) / me); // m/s

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
  // Light sources: wavelengths in nm (mercury lines, lasers, LEDs).
  const LINES = [
    { en: 'the UV line of a mercury lamp', de: 'die UV-Linie einer Quecksilberdampflampe', nm: 254 },
    { en: 'the near-UV line of a mercury lamp', de: 'die nahe UV-Linie einer Quecksilberdampflampe', nm: 365 },
    { en: 'the violet line of a mercury lamp', de: 'die violette Linie einer Quecksilberdampflampe', nm: 405 },
    { en: 'the blue line of a mercury lamp', de: 'die blaue Linie einer Quecksilberdampflampe', nm: 436 },
    { en: 'a blue LED', de: 'eine blaue LED', nm: 470 },
    { en: 'a green laser', de: 'ein grüner Laser', nm: 532 },
    { en: 'the yellow line of a mercury lamp', de: 'die gelbe Linie einer Quecksilberdampflampe', nm: 578 },
    { en: 'a red laser', de: 'ein roter Laser', nm: 650 },
    { en: 'an infrared LED', de: 'eine Infrarot-LED', nm: 850 },
  ];
  // X-ray anodes: the characteristic lines (pm) and the energy needed to ionise the K shell (keV).
  const ANODES = [
    { id: 'cu', en: 'copper', de: 'Kupfer', sym: 'Cu', ka: 154, kb: 139, edge: 8.98 },
    { id: 'mo', en: 'molybdenum', de: 'Molybdän', sym: 'Mo', ka: 71, kb: 63, edge: 20.0 },
    { id: 'ag', en: 'silver', de: 'Silber', sym: 'Ag', ka: 56, kb: 50, edge: 25.5 },
  ];
  // The regions of the spectrum, by wavelength in nm.
  function region(nm) {
    if (nm < 10) return 'x';
    if (nm < 380) return 'uv';
    if (nm <= 750) return 'vis';
    if (nm < 1e6) return 'ir';
    return 'radio';
  }
  // The colour of visible light (names) and an RGB colour for drawing it.
  function colour(nm) {
    if (nm < 380) return null;
    if (nm < 450) return 'violet';
    if (nm < 495) return 'blue';
    if (nm < 570) return 'green';
    if (nm < 590) return 'yellow';
    if (nm < 620) return 'orange';
    if (nm <= 750) return 'red';
    return null;
  }
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
    h, c, e, me, HC, LC, freq, eV, joule, nmOf, momentum, lambdaMin, compton, ekin, speed,
    METALS, LINES, ANODES, region, colour, rgb, rng, round, plain, sci, num, pow, MINUS,
  };
  root.Photon = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
