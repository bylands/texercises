// Verifies Matter Waves and the Particle in a Box: run with `node matter-waves/test/check-exercises.js`.
// It checks
// - the physics against values worked out by hand: an electron through 150 V has λ = 0.100 nm; an
//   electron in a box of 0.5 nm has E₁ = 1.50 eV; in a box, Δx = 0.181·L for n = 1 and 0.266·L for
//   n = 2; confined to 0.1 nm, an electron has Δp ≥ 5.27 · 10⁻²⁵ kg·m/s,
// - for every type, in both languages and many seeds: no undefined or NaN in any text or drawing;
//   hints and a solution; each choice or drawing has exactly one right option, every wrong one a
//   reason, no two alike; no HTML inside a drawing; statements are mixed; every number is finite, and its typical mistakes
//   give clearly different values; the right option of a choice is not always in the same place,
// - the numbers the student types and how they are judged (a typical mistake gets its own reason),
// - the check: every objective has kinds, a worked example and a practice topic; each of its kinds
//   gives questions with four different options, exactly one right, every wrong one with a flag
//   that names a misconception or none,
// - the de Broglie stages (by ratios, other particles, diffraction): at least 10 different
//   exercises each; the voltage from the wavelength (U = k²·150 V), the same momentum (all the
//   same wavelength), voltages changed by 4 or 9/4,
// - the voltage is V in English and U in German,
// - the worked examples.
'use strict';

global.window = globalThis;
const Lang = require('../lang.js');
const P = require('../physics.js');
const G = require('../plot.js');
const X = require('../exercises.js');
require('../app.js');
const A = globalThis.MatterApp;

let failures = 0;
const fail = (msg) => { failures++; if (failures < 30) console.error('  FAIL ' + msg); };
const bad = (html) => /undefined|NaN|\[object|Infinity|[>(=:"]null\b/.test(html);
const badText = (html) => /undefined|NaN|\[object|Infinity|>null\b/.test(html); // the check's options carry flag: null
// HTML inside a drawing breaks it: SVG text takes <tspan>, not <i>, <sub>, <sup> or <b>
const htmlInSvg = (html) => (String(html).match(/<svg[\s\S]*?<\/svg>/g) || []).some((svg) => /<(i|sub|sup|b)>/.test(svg));
const json = (e) => JSON.stringify(e, (k, v) => (typeof v === 'function' ? undefined : v));
const near = (a, b, rel = 0.005) => Math.abs(a - b) <= rel * Math.max(Math.abs(a), Math.abs(b));
const SEEDS = 120;

// ---------------------------------------------------------------- the physics
if (!near(P.lambdaU(150), 1.001e-10)) fail('150 V: 0.100 nm');
if (!near(P.boxE(1, 0.5e-9) / P.e, 1.505)) fail('an electron in 0.5 nm: E1 = 1.50 eV');
if (!near(P.boxE(3, 1e-9), 9 * P.boxE(1, 1e-9), 1e-9) || !near(P.boxE(1, 2e-9), P.boxE(1, 1e-9) / 4, 1e-9)) fail('E ∝ n²/L²');
if (!near(P.boxDx(1), 0.1808) || !near(P.boxDx(2), 0.2658)) fail('Δx in a box');
if (!near(P.minDp(1e-10), 5.27e-25)) fail('an electron in 0.1 nm');
if (bad(G.tube({ U: '1 kV' })) || bad(G.rings([10, 18], { label: true, max: 30 })) || bad(G.slitGraph([{ b: 10, lam: 0.5 }])) || bad(G.levels(3)) || bad(G.packet(0.5, 0.1, { ymax: 5 }))) fail('a drawing');
for (const kind of ['ok', 'walls', 'onewall', 'outside', 'flat', 'psi']) for (const sq of [false, true]) if (bad(G.box({ n: 2, sq, kind, ticks: true })) || htmlInSvg(G.box({ n: 2, sq, kind }))) fail(`the box ${kind}`);

// ---------------------------------------------------------------- typing numbers
const PARSE = [['3.8e-24', 3.8e-24], ['3.8·10^-24', 3.8e-24], ['3,8 · 10^-24', 3.8e-24], ['33,3', 33.3], ['−0.75', -0.75], ['100 pm', 100], ['13.5 eV', 13.5], ['.5', 0.5], ['abc', NaN], ['', NaN]];
for (const [s, v] of PARSE) { const x = A.parse(s); if (!(Number.isNaN(v) ? Number.isNaN(x) : near(x, v, 1e-9))) fail(`parse ${s}: ${x}`); }
Lang.set('en', true);
{
  const q = X.numQ('p', 'p', 'p', '10⁻²⁴ kg·m/s', 6.62, { scale: 1e-24 });
  if (A.judge(6.62, q).cls !== 'ok' || A.judge(6.62e-24, q).cls !== 'ok' || A.judge(6.6, q).cls !== 'ok') fail('a momentum in 10⁻²⁴ kg·m/s');
  if (A.judge(66.2, q).cls !== 'warn' || A.judge(-6.62, q).cls !== 'warn' || A.judge(9, q).cls !== 'bad') fail('the power of ten, the sign, a wrong value');
  const k = X.numQ('lam', 'λ', 'λ', 'pm', 100, { wrong: [{ value: 8270, tag: 'photonp', why: 'WHY' }] });
  if (A.judge(8270, k).msg !== 'WHY') fail('a typical mistake gets its reason');
}

// ---------------------------------------------------------------- the exercises
function checkQuestions(tag, e) {
  if (!e.questions.length) fail(`${tag}: no questions`);
  for (const q of e.questions) {
    if (q.type === 'multi') {
      if (!q.statements.some((s) => s.ok) || !q.statements.some((s) => !s.ok)) fail(`${tag}: statements all of one kind`);
      if (q.statements.some((s) => !s.why)) fail(`${tag}: a statement without a reason`);
      continue;
    }
    if (q.type === 'num') {
      if (!Number.isFinite(q.value) || !(q.tol > 0) || !q.label) fail(`${tag} ${q.key}: the value ${q.value}`);
      if (/^[\d.−-]/.test(String(q.sym))) fail(`${tag} ${q.key}: a number as the symbol (${q.sym})`);
      for (const w of q.wrong) if (!w.why || !w.tag || Math.abs(w.value / q.value - 1) < 0.06) fail(`${tag} ${q.key}: a mistake too close to the answer or without a reason`);
      if (A.judge(Number(String(P.round(q.value, 3))), q).cls !== 'ok') fail(`${tag} ${q.key}: the rounded answer is not accepted`);
      continue;
    }
    const n = q.options.filter((o) => o.ok).length;
    if (n !== 1) fail(`${tag} ${q.key}: ${n} right options`);
    if (q.options.some((o) => !o.ok && !o.why)) fail(`${tag} ${q.key}: a wrong option without a reason`);
    const labels = q.options.map((o) => o.label || o.html);
    if (new Set(labels).size !== labels.length) fail(`${tag} ${q.key}: two options alike`);
  }
}
// the right option of a choice is not always in the same place (unless the options are ordered, as angles)
{
  const at = {}, note = (tag, e) => { for (const q of e.questions) if (q.options) (at[`${tag} ${q.key}`] = at[`${tag} ${q.key}`] || new Set()).add(q.options.findIndex((o) => o.ok)); };
  for (const type of X.TYPES) for (let seed = 1; seed <= SEEDS; seed++) note(type, X.make(type, seed));
  for (const [k, v] of Object.entries(at)) if (v.size === 1 && ![].includes(k)) fail(`${k}: the right option is always number ${[...v][0] + 1}`);
}
for (const lang of ['en', 'de']) {
  Lang.set(lang, true);
  for (const type of X.TYPES) {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const e = X.make(type, seed), tag = `${type} ${seed} ${lang}`;
      if (bad(json(e))) fail(`${tag}: undefined or NaN`);
      if (htmlInSvg(json(e))) fail(`${tag}: HTML in a drawing`);
      if (!e.hints.length || !e.solution.length || !e.title || !e.p) fail(`${tag}: no hints, solution, title or parameters`);
      checkQuestions(tag, e);
      if (lang === 'de') continue;
      if (type === 'debroglie' && !near(e.questions[0].value, e.p.rev ? 150 * e.p.k * e.p.k : 100 / e.p.k, 1e-9)) fail(`${tag}: λ = 100 pm/k, U = k²·150 V`);
      if (type === 'same-lambda' && (e.p.same === 'p') !== (e.questions[0].options.find((o) => o.ok).label === Lang.L('all the same', 'alle gleich'))) fail(`${tag}: the same momentum, the same wavelength`);
      if (type === 'diffraction' && ![4, 9 / 4].some((x) => near(Math.max(e.p.U1 / e.p.U0, e.p.U0 / e.p.U1), x, 1e-9))) fail(`${tag}: the voltage changes by 4 or 9/4`);
      if (type === 'box-energy' && !near(e.questions[0].value, e.p.k * e.p.k * e.p.e1, 1e-9)) fail(`${tag}: E = k²·E1`);
    }
  }
  // the de Broglie stages: at least 10 different exercises each (by what the student reads), each
  // choice with exactly one right option, no raw $ or _ in the text
  for (const type of ['debroglie', 'same-lambda', 'diffraction']) {
    const seen = new Set();
    for (let seed = 1; seed <= 300; seed++) {
      const e = X.make(type, seed), text = e.text + e.questions.map((q) => q.label).join('|') + e.solution.join('|');
      seen.add(text);
      if (/[$_]/.test(text.replace(/<[^>]*>/g, ''))) fail(`${type} ${seed} ${lang}: raw $ or _`);
      for (const q of e.questions) if (q.options && q.options.filter((o) => o.ok).length !== 1) fail(`${type} ${seed} ${lang}: (${q.key}) not exactly one right option`);
    }
    if (seen.size < 10) fail(`${type} ${lang}: only ${seen.size} different exercises`);
  }
  // the check
  for (const o of A.OBJECTIVES) {
    if (!o.kinds.length || !o.name() || !A.LESSONS[o.tutor] || !A.TOPICS[o.topic]) fail(`objective ${o.id}: kinds, name, worked example or topic`);
    for (const kind of o.kinds) {
      if (!X.TYPES.includes(kind)) fail(`objective ${o.id}: no type ${kind}`);
      for (let seed = 1; seed <= 60; seed++) {
        const q = A.checkQuestion(kind, seed), tag = `check ${kind} ${seed} ${lang}`;
        if (q.options.length !== 4) fail(`${tag}: ${q.options.length} options`);
        if (q.options.filter((x) => x.correct).length !== 1) fail(`${tag}: not exactly one right option`);
        if (new Set(q.options.map((x) => x.html)).size !== q.options.length) fail(`${tag}: two options alike`);
        if (q.options.some((x) => !x.correct && x.flag && x.flag !== 'other' && !A.CONCEPT[x.flag])) fail(`${tag}: a flag without a misconception (${q.options.map((x) => x.flag)})`);
        if (badText(json(q)) || badText(q.explain()) || !q.ask) fail(`${tag}: undefined or NaN`);
      }
    }
  }
  // the worked examples
  A.LESSONS.forEach((l, k) => { for (const fr of l.frames()) if (bad(fr.text + fr.figure) || htmlInSvg(fr.figure)) fail(`tutor ${k + 1} ${lang}: undefined or NaN`); });
  // the voltage: V in English, U in German (as a symbol, not the unit)
  {
    const texts = [];
    for (const type of X.TYPES) for (let seed = 1; seed <= 40; seed++) texts.push(json(X.make(type, seed)));
    A.LESSONS.forEach((l) => { for (const fr of l.frames()) texts.push(fr.text + fr.figure); });
    const all = texts.join(' '), sym = (c) => new RegExp(`<i>${c}</i>|>${c}<|[√·(]${c}\\b|\\b${c} [=∝]`);
    if (lang === 'en' && sym('U').test(all)) fail(`en: the voltage written as U: ${all.match(sym('U'))[0]}`);
    if (lang === 'en' && !/<i>V<\/i>/.test(all)) fail('en: no voltage V');
    if (lang === 'de' && !/<i>U<\/i>/.test(all)) fail('de: no voltage U');
  }
}
console.log(`${X.TYPES.length} types × ${SEEDS} seeds, ${A.OBJECTIVES.length} objectives of the check and ${A.LESSONS.length} worked examples, in both languages`);
if (failures) { console.error(`${failures} failures`); process.exit(1); }
console.log('all checks passed');
