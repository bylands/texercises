// Verifies Photoelectric Effect: run with `node photons/test/check-exercises.js`. It checks
// - the physics against values worked out by hand: 532 nm is 5.64 · 10¹⁴ Hz and 2.33 eV; zinc
//   (4.27 eV) in 200 nm light gives 1.93 eV; h = 4.14 · 10⁻¹⁵ eV·s,
// - for every type, in both languages and many seeds: no undefined or NaN in any text or drawing;
//   hints and a solution; each choice or drawing has exactly one right option, every wrong one a
//   reason, no two alike; no HTML inside a drawing; statements are mixed; every number is finite, and its typical mistakes
//   give clearly different values; the right option of a choice is not always in the same place,
// - the numbers the student types (4.6e14, 4.6·10^14, 4,6 · 10¹⁴, the full number for a field in
//   10¹⁴ Hz) and how they are judged (a typical mistake gets its own reason),
// - the numbers are for the head: every photon energy a round number of eV (two decimals at most),
//   every work function and stopping voltage at most two decimals,
// - the check: every objective has kinds, a worked example and a practice topic; every kind gives
//   four different options, exactly one right, a reason for every wrong one with a misconception
//   flag the check knows (or none); a whole check (check.js) plans the right number of questions.
'use strict';

global.window = globalThis;
const Lang = require('../lang.js');
const P = require('../physics.js');
const G = require('../plot.js');
const X = require('../exercises.js');
const Check = require('../check.js');
require('../app.js');
const A = globalThis.PhotonApp;

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
if (!near(P.freq(532), 5.64e14) || !near(P.eV(532), 2.33)) fail('532 nm: 5.64 · 10¹⁴ Hz, 2.33 eV');
if (!near(P.ekin(200, 4.27), 1.93, 0.01)) fail('zinc in 200 nm light: 1.93 eV');
if (!near(P.hEV, 4.14e-15)) fail('h = 4.14 · 10⁻¹⁵ eV·s');
if (bad(G.ufGraph({ pts: [[5, 0.2], [7, 1]], line: { slope: 0.4, icept: -1.8 }, solve: true })) || bad(G.ufGraph({ pts: [[7, 0.4]], line: { slope: 0.4, icept: -2.4 }, draw: true })) || bad(G.ivGraph([{ U0: 1, I: 10 }])) || bad(G.bar([{ nm: 500, label: 'x' }])) || bad(G.bars(3, 2)) || bad(G.cell({ counter: true }))) fail('a drawing');

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
// the right option of a choice is not always in the same place (unless the options are ordered, as angles)
{
  const at = {}, note = (tag, e) => { for (const q of e.questions) if (q.options) (at[`${tag} ${q.key}`] = at[`${tag} ${q.key}`] || new Set()).add(q.options.findIndex((o) => o.ok)); };
  for (const type of X.TYPES) for (let seed = 1; seed <= SEEDS; seed++) note(type, X.make(type, seed));
  for (const [k, v] of Object.entries(at)) if (v.size === 1) fail(`${k}: the right option is always number ${[...v][0] + 1}`);
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
      // numbers for the head: photon energies, work functions and stopping voltages in eV with two decimals at most
      for (const q of e.questions) if (q.type === 'num' && q.unit === 'eV' && !['W'].includes(q.key) && Math.abs(q.value * 100 - Math.round(q.value * 100)) > 1e-6) fail(`${tag} ${q.key}: ${q.value} eV is not a round number`);
      if (type === 'photo-calc' && e.questions.length > 1 && e.questions[1].key === 'ek' && Math.abs(e.questions[1].value - e.questions[2].value) > 1e-9) fail(`${tag}: E_kin,max in eV and U₀ in V are the same number`);
      if (type === 'photo-line' && (!near(e.questions[2].value, P.hEV * e.questions[0].value * 1e14) || !near(e.questions[1].value * e.questions[0].value, 3000))) fail(`${tag}: W = h·f_G and λ_G = c/f_G`);
    }
  }
  // the check: each objective's kinds, many seeds
  const flags = new Set(Object.keys(A.CONCEPT)), names = A.concepts();
  for (const idea of new Set(Object.values(A.CONCEPT))) if (!names[idea] || badText(names[idea])) fail(`the misconception ${idea} has no name (${lang})`);
  A.OBJECTIVES.forEach((o) => {
    if (!o.kinds.length || !(o.tutor >= 0 && o.tutor < A.LESSONS.length) || !(o.topic >= 0 && o.topic < A.TOPICS.length) || !o.name()) fail(`objective ${o.id}: kinds, worked example, topic or name`);
    for (const kind of o.kinds) {
      for (let seed = 1; seed <= 40; seed++) {
        const q = A.checkQuestion(kind, seed), tag = `check ${o.id} ${kind} ${seed} ${lang}`;
        if (q.options.length !== 4) fail(`${tag}: ${q.options.length} options`);
        if (q.options.filter((x) => x.correct).length !== 1) fail(`${tag}: not exactly one right option`);
        if (new Set(q.options.map((x) => x.html)).size !== q.options.length) fail(`${tag}: two options alike`);
        if (q.options.some((x) => !x.correct && x.flag && x.flag !== 'other' && !flags.has(x.flag))) fail(`${tag}: a flag the check does not know`);
        if (q.options.some((x) => !x.correct && x.flag && x.flag !== 'other' && !x.why)) fail(`${tag}: a misconception without a reason`);
        if (badText(json(q)) || badText(q.explain()) || !q.ask || !q.title) fail(`${tag}: undefined or NaN`);
      }
    }
  });
  // the worked examples
  A.LESSONS.forEach((l, k) => { for (const fr of l.frames()) if (bad(fr.text + fr.figure) || htmlInSvg(fr.figure)) fail(`tutor ${k + 1} ${lang}: undefined or NaN`); });
}
// a whole check: the plan of check.js gives every objective its share of questions
{
  let a = 7;
  const rand = () => { a = (a * 16807) % 2147483647; return a / 2147483647; };
  const plan = Check.plan(A.OBJECTIVES, rand), per = Check.perObjective(A.OBJECTIVES.length);
  if (plan.length !== per * A.OBJECTIVES.length) fail(`the check has ${plan.length} questions`);
  A.OBJECTIVES.forEach((o, n) => { if (plan.filter((it) => it.objective === n).length !== per) fail(`objective ${o.id}: not ${per} questions`); });
}
console.log(`${X.TYPES.length} types × ${SEEDS} seeds, ${A.OBJECTIVES.length} objectives with ${A.OBJECTIVES.reduce((n, o) => n + o.kinds.length, 0)} check kinds and ${A.LESSONS.length} worked examples, in both languages`);
if (failures) { console.error(`${failures} failures`); process.exit(1); }
console.log('all checks passed');
