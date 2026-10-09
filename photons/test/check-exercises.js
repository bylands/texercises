// Verifies Photons: run with `node photons/test/check-exercises.js`. It checks
// - the physics against values worked out by hand: 532 nm is 5.64 · 10¹⁴ Hz and 2.33 eV; zinc
//   (4.27 eV) in 200 nm light gives 1.93 eV; 30 kV gives λ_min = 41.3 pm; the Compton shift at 90°
//   is 2.43 pm and at 180° twice that; the line through the stopping voltages of the mercury lines
//   gives back h,
// - for every type, in both languages and many seeds: no undefined or NaN in any text or drawing;
//   hints and a solution; each choice or drawing has exactly one right option, every wrong one a
//   reason, no two alike; no HTML inside a drawing; statements are mixed; every number is finite, and its typical mistakes
//   give clearly different values,
// - the numbers the student types (4.6e14, 4.6·10^14, 4,6 · 10¹⁴, the full number for a field in
//   10¹⁴ Hz) and how they are judged (a typical mistake gets its own reason),
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
const A = globalThis.PhotonApp;

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
if (!near(P.freq(532), 5.64e14) || !near(P.eV(532), 2.33)) fail('532 nm: 5.64 · 10¹⁴ Hz, 2.33 eV');
if (!near(P.joule(532), 3.73e-19)) fail('532 nm: 3.73 · 10⁻¹⁹ J');
if (!near(P.ekin(200, 4.27), 1.93, 0.01)) fail('zinc in 200 nm light: 1.93 eV');
if (!near(P.lambdaMin(30e3), 41.3)) fail('30 kV: 41.3 pm');
if (!near(P.compton(90), 2.43) || !near(P.compton(180), 4.85, 0.01) || P.compton(0) > 1e-12) fail('the Compton shift');
if (!near(P.momentum(500), 1.325e-27)) fail('the momentum of a 500 nm photon');
if (!near(P.speed(1), 5.93e5)) fail('the speed of a 1 eV electron');
{
  const pts = X.HG.map((nm) => [P.freq(nm) / 1e14, P.eV(nm) - 1.9]), ln = X.fit(pts);
  if (!near(ln.slope * 1e-14 * P.e, P.h, 0.002) || !near(-ln.icept, 1.9, 0.002)) fail('the line through U₀(f) gives h and W');
}
if (bad(G.ufGraph({ pts: [[5, 0.2], [7, 1]], line: { slope: 0.4, icept: -1.8 }, solve: true })) || bad(G.ivGraph([{ U0: 1, I: 10 }])) || bad(G.xray([{ U: 35, anode: P.ANODES[1] }])) || bad(G.bar([{ nm: 500, label: 'x' }])) || bad(G.scatter(180)) || bad(G.bars(3, 2)) || bad(G.cell({ counter: true })) || bad(G.sail({}))) fail('a drawing');

// ---------------------------------------------------------------- typing numbers
const PARSE = [['4.6e14', 4.6e14], ['4.6·10^14', 4.6e14], ['4,6 · 10^14', 4.6e14], ['4.6 x 10^-19', 4.6e-19], ['4.6*10^(-19)', 4.6e-19], ['4.6·10¹⁴', 4.6e14], ['−0.75', -0.75], ['2.33 eV', 2.33], ['.5', 0.5], ['abc', NaN], ['', NaN]];
for (const [s, v] of PARSE) { const x = A.parse(s); if (!(Number.isNaN(v) ? Number.isNaN(x) : near(x, v, 1e-9))) fail(`parse ${s}: ${x}`); }
Lang.set('en', true);
{
  const q = X.numQ('f', 'f', 'f', '10¹⁴ Hz', 5.64, { scale: 1e14 });
  if (A.judge(5.64, q).cls !== 'ok' || A.judge(5.64e14, q).cls !== 'ok' || A.judge(5.6, q).cls !== 'ok') fail('a frequency in 10¹⁴ Hz');
  if (A.judge(56.4, q).cls !== 'warn' || A.judge(-5.64, q).cls !== 'warn' || A.judge(9, q).cls !== 'bad') fail('the power of ten, the sign, a wrong value');
  const k = X.numQ('ek', 'E', 'E', 'eV', 1.93, { tol: 0.02, wrong: [{ value: 6.2, tag: 'noW', why: 'WHY' }] });
  if (A.judge(6.2, k).msg !== 'WHY') fail('a typical mistake gets its reason');
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
      if (type === 'photo-graph') { const q = e.questions[0]; if (!near(q.value * 1e-34, P.h, 0.04)) fail(`${tag}: h from the graph ${q.value}`); }
      if (type === 'energy' && !near(e.questions[2].value, P.HC / e.p.nm, 1e-9)) fail(`${tag}: E = 1240 eV·nm / λ`);
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
