// Verifies Matter Waves: run with `node matter-waves/test/check-exercises.js`. It checks
// - the physics against values worked out by hand: an electron through 150 V has λ = 0.100 nm; a
//   thermal neutron (0.025 eV) 0.181 nm; C₆₀ at 200 m/s 2.77 pm; confined to 0.1 nm, an electron
//   has Δp ≥ 5.27 · 10⁻²⁵ kg·m/s and Δv ≥ 579 km/s; 1 eV below the top of a barrier, κ = 5.12/nm
//   and T(0.5 nm) = 6.0 · 10⁻³; the ring radii of graphite give back d = 0.213 nm,
// - for every type, in both languages and many seeds: no undefined or NaN in any text or drawing;
//   hints and a solution; each choice or drawing has exactly one right option, every wrong one a
//   reason, no two alike; no HTML inside a drawing; statements are mixed; every number is finite, and its typical mistakes
//   give clearly different values,
// - the numbers the student types (3.8e-24, 3.8·10^-24, 3,8 · 10⁻²⁴, the full number for a field
//   in 10⁻²⁴ kg·m/s) and how they are judged (a typical mistake gets its own reason),
// - the arcade: three or four different options (as many as a choice has), exactly one right,
// - every problem.
'use strict';

global.window = globalThis;
const Lang = require('../lang.js');
const P = require('../physics.js');
const G = require('../plot.js');
const X = require('../exercises.js');
const R = require('../realproblems.js');
require('../app.js');
const A = globalThis.MatterApp;

let failures = 0;
const fail = (msg) => { failures++; if (failures < 30) console.error('  FAIL ' + msg); };
const bad = (html) => /undefined|NaN|\[object|Infinity|[>(=:"]null\b/.test(html);
const badText = (html) => /undefined|NaN|\[object|Infinity|>null\b/.test(html); // the arcade's options carry flag: null
// HTML inside a drawing breaks it: SVG text takes <tspan>, not <i>, <sub>, <sup> or <b>
const htmlInSvg = (html) => (String(html).match(/<svg[\s\S]*?<\/svg>/g) || []).some((svg) => /<(i|sub|sup|b)>/.test(svg));
const json = (e) => JSON.stringify(e, (k, v) => (typeof v === 'function' ? undefined : v));
const near = (a, b, rel = 0.005) => Math.abs(a - b) <= rel * Math.max(Math.abs(a), Math.abs(b));
const SEEDS = 120;

// ---------------------------------------------------------------- the physics
if (!near(P.lambdaU(150), 1.001e-10)) fail('150 V: 0.100 nm');
if (!near(P.lambda(P.pOfE(P.mn, 0.025)), 1.809e-10)) fail('a thermal neutron: 0.181 nm');
if (!near(P.h / (720 * P.u * 200), 2.77e-12)) fail('C60 at 200 m/s: 2.77 pm');
if (!near(P.minDp(1e-10), 5.27e-25) || !near(P.minDp(1e-10) / P.me, 5.79e5)) fail('an electron in 0.1 nm');
if (!near(P.kappa(P.me, 1), 5.12e9) || !near(P.trans(P.me, 1, 0.5e-9), 5.97e-3, 0.01)) fail('tunnelling 1 eV below the top');
for (let seed = 1; seed <= 60; seed++) { const e = X.make('rings', seed); if (!near(e.questions[1].value, 0.213, 0.03)) fail(`rings ${seed}: d = ${e.questions[1].value}`); }
if (['double', 'which', 'single', 'classical', 'narrow', 'smear'].some((k) => bad(G.screen(k, 50, 1))) || bad(G.tube({ U: '1 kV' })) || bad(G.rings([10, 18], { label: true })) || bad(G.doubleSlit({})) || bad(G.slitGraph([{ b: 10, lam: 0.5 }])) || bad(G.rGraph({ pts: [[0.5, 12]], slope: 24, solve: true }))) fail('a drawing');
for (const k of ['ok', 'longer', 'shorter', 'zero', 'same', 'inside']) if (bad(G.barrier({ after: k, dE: true, labels: true }))) fail(`the barrier ${k}`);

// ---------------------------------------------------------------- typing numbers
const PARSE = [['3.8e-24', 3.8e-24], ['3.8·10^-24', 3.8e-24], ['3,8 · 10^-24', 3.8e-24], ['3.8 x 10^-24', 3.8e-24], ['3.8*10^(-24)', 3.8e-24], ['3.8·10⁻²⁴', 3.8e-24], ['−0.75', -0.75], ['100 pm', 100], ['.5', 0.5], ['abc', NaN], ['', NaN]];
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
      if (type === 'debroglie' && !near(e.questions[2].value, 1226.4 / Math.sqrt(e.p.Uv), 0.002)) fail(`${tag}: λ = 1.226 nm / √U`);
    }
  }
  R.PROBLEMS.forEach((p, k) => {
    for (let seed = 1; seed <= 40; seed++) {
      const e = R.realOf(k, seed), tag = `real ${p.id} ${seed} ${lang}`;
      if (bad(json(e))) fail(`${tag}: undefined or NaN`);
      if (htmlInSvg(json(e))) fail(`${tag}: HTML in a drawing`);
      if (!e.hints.length || !e.solution.length) fail(`${tag}: no hints or solution`);
      checkQuestions(tag, e);
    }
  });
  // the arcade
  for (const [kind] of A.KINDS) {
    for (let seed = 1; seed <= 40; seed++) {
      const q = A.arcadeQuestion(kind, seed), tag = `arcade ${kind} ${seed} ${lang}`;
      if (q.options.length < 3 || q.options.length > 4) fail(`${tag}: ${q.options.length} options`);
      if (q.options.filter((o) => o.correct).length !== 1) fail(`${tag}: not exactly one right option`);
      if (new Set(q.options.map((o) => o.html)).size !== q.options.length) fail(`${tag}: two options alike`);
      if (badText(json(q)) || badText(q.explain())) fail(`${tag}: undefined or NaN`);
    }
  }
  // the worked examples
  A.LESSONS.forEach((l, k) => { for (const fr of l.frames()) if (bad(fr.text + fr.figure) || htmlInSvg(fr.figure)) fail(`tutor ${k + 1} ${lang}: undefined or NaN`); });
}
console.log(`${X.TYPES.length} types × ${SEEDS} seeds, ${R.PROBLEMS.length} problems, ${A.KINDS.length} arcade kinds and ${A.LESSONS.length} worked examples, in both languages`);
if (failures) { console.error(`${failures} failures`); process.exit(1); }
console.log('all checks passed');
