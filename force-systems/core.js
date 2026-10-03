// Helpers of the app: language (from lang.js, shared by the apps), symbols, number formatting and
// random numbers.
(function (root) {
  'use strict';

  const Lang = root.Lang || require('./lang.js');
  const LANGS = Lang.LANGS;
  // quiet: the app remembers the choice itself, through Lang.set
  const setLang = (l) => Lang.set(l, true);
  const getLang = () => Lang.get();
  // The text in the current language.
  const L = (en, de) => Lang.L(en, de);

  const G = 10; // m/s², as on the worksheet

  // Symbols: [letter, subscript] per language. Force symbols as on the worksheet (German) or as in
  // English textbooks; an index (1, 2) is appended to the subscript.
  const SYM = {
    G: { en: ['F', 'g'], de: ['F', 'G'] },
    N: { en: ['F', 'N'], de: ['F', 'N'] },
    R: { en: ['F', 'f'], de: ['F', 'R'] },
    S: { en: ['F', 'T'], de: ['F', 'S'] },
    K: { en: ['F', 'c'], de: ['F', 'K'] },
    res: { en: ['F', 'net'], de: ['F', 'res'] },
    F: { en: ['F', ''], de: ['F', ''] },
    a: { en: ['a', ''], de: ['a', ''] },
    m: { en: ['m', ''], de: ['m', ''] },
    mu: { en: ['μ', 'k'], de: ['μ', 'G'] },
    alpha: { en: ['α', ''], de: ['α', ''] },
  };
  const TEX_LETTER = { μ: '\\mu', α: '\\alpha' };
  const parts = (key, i = '') => { const [l, s] = SYM[key][getLang()]; return [l, `${s}${i}`]; };

  // KaTeX: F_\mathrm{N1}, m_1, \mu_\mathrm{G}
  function tex(key, i = '') {
    const [l, s] = parts(key, i);
    const letter = TEX_LETTER[l] || l;
    if (!s) return letter;
    const sub = s.replace(/[A-Za-z]+/g, (x) => `\\mathrm{${x}}`).replace(/∥/g, '\\parallel').replace(/⊥/g, '\\perp');
    return `${letter}_{${sub}}`;
  }
  // SVG: italic letter with an upright subscript; text that follows starts at the baseline again.
  function svgSym(key, i = '') {
    const [l, s] = parts(key, i);
    const it = `<tspan font-style="italic">${l}</tspan>`;
    if (!s) return it;
    const sub = /^\d+$/.test(s) ? `<tspan font-style="italic">${s}</tspan>` : s;
    return `${it}<tspan class="sub" dy="4">${sub}</tspan><tspan dy="-4">\u200b</tspan>`;
  }
  // Plain text (for aria labels).
  const plainSym = (key, i = '') => parts(key, i).join('');

  // ---------------------------------------------------------------- numbers
  // At most one decimal place (given values such as friction coefficients may ask for more).
  const round = (x, dec = 1) => (Number.isFinite(x) ? Number(x.toFixed(dec)) + 0 : 0);
  const num = (x, dec) => { const s = String(round(x, dec)); return getLang() === 'de' ? s.replace('.', ',') : s; };
  const texNum = (x, dec) => (getLang() === 'de' ? String(round(x, dec)).replace('.', '{,}') : String(round(x, dec)));

  const UNITS = { N: 'N', a: 'm/s²', kg: 'kg', deg: '°' };
  const TEX_UNITS = { N: '\\mathrm{N}', a: '\\mathrm{m/s^2}', kg: '\\mathrm{kg}', deg: '^\\circ' };
  // A quantity: "14 N", in text or in KaTeX.
  const q = (x, u) => (u === 'deg' ? `${num(x)}°` : `${num(x)} ${UNITS[u]}`);
  const tq = (x, u) => (u === 'deg' ? `${texNum(x)}^\\circ` : `${texNum(x)}\\,${TEX_UNITS[u]}`);

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

  const rad = (deg) => (deg * Math.PI) / 180;

  root.FS = { LANGS, setLang, getLang, L, G, tex, svgSym, plainSym, round, num, texNum, q, tq, UNITS, rng, pick, rad };
  if (typeof module !== 'undefined') module.exports = root.FS;
})(typeof window !== 'undefined' ? window : globalThis);
