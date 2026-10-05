// Helpers of the app: language (from lang.js, shared by the apps), symbols, number formatting and
// random numbers.
(function (root) {
  'use strict';

  const Lang = root.Lang || require('./lang.js');
  const LANGS = Lang.LANGS;
  // quiet: the app remembers the choice itself, through Lang.set
  const setLang = (l) => Lang.set(l, true);
  const getLang = () => Lang.get();
  const L = (en, de) => Lang.L(en, de);

  const G = 10; // m/s², as in class

  // Symbols: [letter, subscript, prime]. ℓ is the length of a pendulum.
  const SYM = {
    h: ['h'], hp: ['h', '', true], h1: ['h', '1'], h2: ['h', '2'],
    v: ['v'], vp: ['v', '', true], v0: ['v', '0'], v1: ['v', '1'], v2: ['v', '2'],
    s: ['s'], k: ['k'], m: ['m'], g: ['g'], l: ['ℓ'], d: ['d'],
  };
  const TEX_LETTER = { ℓ: '\\ell' };
  // KaTeX: v_0, h'
  function tex(key) {
    const [l, s, p] = SYM[key];
    return `${TEX_LETTER[l] || l}${p ? "'" : ''}${s ? `_${s}` : ''}`;
  }
  // SVG: italic letter, prime, subscript; text that follows starts at the baseline again.
  function svgSym(key) {
    const [l, s, p] = SYM[key];
    const it = `<tspan font-style="italic">${l}</tspan>${p ? '′' : ''}`;
    return s ? `${it}<tspan class="sub" dy="4">${s}</tspan><tspan dy="-4">​</tspan>` : it;
  }
  const plainSym = (key) => { const [l, s, p] = SYM[key]; return `${l}${p ? '′' : ''}${s || ''}`; };
  // How to type a symbol in a formula field.
  const typed = (key) => { const [l, s, p] = SYM[key]; return `${l === 'ℓ' ? 'l' : l}${p ? "'" : ''}${s || ''}`; };

  // Energy forms: gravitational potential, kinetic, elastic (spring) energy.
  const ESYM = { pot: { en: 'pot', de: 'pot' }, kin: { en: 'kin', de: 'kin' }, el: { en: 'el', de: 'S' } };
  const etex = (form, i = '') => `E_{\\mathrm{${ESYM[form][getLang()]}}${i === '' ? '' : `\\,${i}`}}`;
  const esvg = (form) => `<tspan font-style="italic">E</tspan><tspan class="sub" dy="4">${ESYM[form][getLang()]}</tspan><tspan dy="-4">​</tspan>`;
  const ENAME = {
    pot: () => L('gravitational potential energy', 'Lageenergie'),
    kin: () => L('kinetic energy', 'kinetische Energie'),
    el: () => L('elastic energy of the spring', 'Spannenergie der Feder'),
  };

  // The states ①, ②, ③.
  const CIRCLED = ['①', '②', '③', '④'];

  // ---------------------------------------------------------------- numbers
  // Values as given (they are chosen nice), results with three significant digits.
  const clean = (x) => Number(x.toPrecision(12)) + 0;
  const str = (x) => String(x); // decimal point in both languages
  const sig = (x, n = 3) => (Number.isFinite(x) ? clean(Number(x.toPrecision(n))) : 0);
  const num = (x) => str(clean(x));
  const texNum = (x) => num(x);
  const UNITS = { m: 'm', v: 'm/s', kg: 'kg', k: 'N/m', g: 'm/s²' };
  const TEX_UNITS = { m: '\\mathrm{m}', v: '\\mathrm{\\tfrac{m}{s}}', kg: '\\mathrm{kg}', k: '\\mathrm{\\tfrac{N}{m}}', g: '\\mathrm{\\tfrac{m}{s^2}}' };
  // A quantity: "1.8 m", in text or in KaTeX.
  const q = (x, u) => `${num(x)} ${UNITS[u]}`;
  const tq = (x, u) => `${texNum(x)}\\,${TEX_UNITS[u]}`;
  // A result, rounded: "5.42 m/s".
  const rq = (x, u) => `${str(sig(x))} ${UNITS[u]}`;
  const trq = (x, u) => `${str(sig(x))}\\,${TEX_UNITS[u]}`;

  // Fractions n/d, reduced; TeX \tfrac{n}{d}, or the integer.
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  const reduce = ([n, d]) => { const c = gcd(n, d); return [n / c, d / c]; };
  const ftex = (fr) => { const [n, d] = reduce(fr); return d === 1 ? String(n) : `\\tfrac{${n}}{${d}}`; };
  // A factor in front of symbols: "", "\tfrac{2}{3}\,", "2"
  const coef = (fr) => { const [n, d] = reduce(fr); return n === d ? '' : d === 1 ? String(n) : `\\tfrac{${n}}{${d}}\\,`; };
  const fval = ([n, d]) => n / d;
  const FRAC_WORDS = {
    '1/2': { en: 'half', de: 'die Hälfte' }, '1/3': { en: 'one third', de: 'ein Drittel' }, '2/3': { en: 'two thirds', de: 'zwei Drittel' },
    '1/4': { en: 'one quarter', de: 'ein Viertel' }, '3/4': { en: 'three quarters', de: 'drei Viertel' },
  };
  const fwords = (fr) => FRAC_WORDS[reduce(fr).join('/')][getLang()];
  // plain text, for drawings: 2/3
  const fplain = (fr) => reduce(fr).join('/');

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

  root.EC = {
    LANGS, setLang, getLang, L, G, SYM, tex, svgSym, plainSym, typed, etex, esvg, ENAME, CIRCLED,
    clean, sig, num, texNum, q, tq, rq, trq, UNITS, ftex, coef, fval, fwords, fplain, reduce, rng, pick,
  };
  if (typeof module !== 'undefined') module.exports = root.EC;
})(typeof window !== 'undefined' ? window : globalThis);
