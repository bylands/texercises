// Verifies the force systems generator: run with `node force-systems/test/check-generator.js`.
// For many seeds per topic and both languages it checks
// - the answers against Newton's laws, written out independently for each situation
//   (balance perpendicular to the motion, F = m a for the system and for single boxes),
// - that the values are positive and the boxes move the way the text says,
// - that the wrong-idea values differ from the right ones,
// - that texts, hints, solutions and drawings contain no undefined values.
// It also checks the tutor's examples against the answers on the worksheet.
'use strict';

const load = typeof require === 'function'
  ? () => { require('../core.js'); require('../draw.js'); require('../scenarios.js'); require('../generator.js'); require('../lessons.js'); }
  : () => {};
load();
const { FS, Forces, Lessons } = globalThis;
const g = FS.G;

let failures = 0, checked = 0;
const log = typeof console !== 'undefined' ? (s) => console.log(s) : () => {};
const fail = (msg) => { failures++; if (failures < 30) log('  FAIL ' + msg); };
const close = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));
const sin = (d) => Math.sin((d * Math.PI) / 180), cos = (d) => Math.cos((d * Math.PI) / 180);

// Newton's laws per situation: a list of [left, right] that must be equal.
const LAWS = {
  'rest-up': (p, v) => [[v.G, p.m * g], [v.N + (p.dir === 'up' ? p.F : -p.F), p.m * g]],
  'rest-angle': (p, v) => {
    const up = p.ref === 'v' ? cos(p.alpha) : sin(p.alpha), side = p.ref === 'v' ? sin(p.alpha) : cos(p.alpha);
    return [[v.N + p.F * up, p.m * g], [v.R, p.F * side]];
  },
  'pull-friction': (p, v) => {
    const F = p.given === 'a' ? v.F : p.F, a = p.given === 'a' ? p.a : v.a;
    return [[v.R, p.mu * p.m * g], [v.res, p.m * a], [F - v.R, v.res]];
  },
  'push-pair': (p, v) => [[p.F - p.mu * (p.m1 + p.m2) * g, (p.m1 + p.m2) * v.a], [v.res, (p.m1 + p.m2) * v.a],
    [v.K - p.mu * p.m2 * g, p.m2 * v.a], [p.F - v.K - p.mu * p.m1 * g, p.m1 * v.a], ...(p.mu ? [[v.R, p.mu * (p.m1 + p.m2) * g]] : [])],
  'rope-pair': (p, v) => [[v.R1, p.mu1 * p.m1 * g], [v.S - v.R1, p.m1 * v.a], [p.F - v.S - p.mu2 * p.m2 * g, p.m2 * v.a], [v.res, (p.m1 + p.m2) * v.a]],
  atwood: (p, v) => {
    const mh = Math.max(p.m1, p.m2), ml = Math.min(p.m1, p.m2);
    return [[v.S - ml * g, ml * v.a], [mh * g - v.S, mh * v.a], [v.res, (p.m1 + p.m2) * v.a]];
  },
  'table-pulley': (p, v) => [[v.R, p.mu * p.m1 * g], [v.S - v.R, p.m1 * v.a], [p.m2 * g - v.S, p.m2 * v.a], [v.res, (p.m1 + p.m2) * v.a]],
  'incline-pull': (p, v) => [[v.N, p.m * g * cos(p.alpha)], [v.R, p.mu * v.N], [v.F - p.m * g * sin(p.alpha) - v.R, p.m * p.a], [v.res, p.m * p.a]],
  'incline-pulley': (p, v) => [[v.N, p.m1 * g * cos(p.alpha)], [v.R, p.mu * v.N], [v.S - p.m1 * g * sin(p.alpha) - v.R, p.m1 * v.a],
    [p.m2 * g - v.S, p.m2 * v.a], [v.res, (p.m1 + p.m2) * v.a]],
};
// Quantities that must be positive (a box at rest or at constant speed may have a = 0).
const POSITIVE = (ex) => ex.fields.filter((f) => !(f.key === 'a' && ex.p.a === 0) && !(f.key === 'res' && ex.p.a === 0));

const bad = /undefined|NaN|Infinity|\[object/;
function checkText(id, what, s) { if (typeof s !== 'string' || bad.test(s)) fail(`${id}: ${what} contains an undefined value: ${String(s).match(bad)}`); }

function checkExercise(ex, id) {
  checked++;
  const law = LAWS[ex.scenario];
  if (!law) { fail(`${id}: no laws for ${ex.scenario}`); return; }
  law(ex.p, ex.v).forEach(([a, b], k) => { if (!close(a, b)) fail(`${id} (${ex.scenario}): law ${k + 1}: ${a} ≠ ${b}`); });
  ex.fields.forEach((f) => {
    if (!Number.isFinite(f.value)) fail(`${id}: ${f.key} is ${f.value}`);
    if (f.value > 2000) fail(`${id}: ${f.key} = ${f.value} is implausibly large`);
    for (const t of f.traps) if (Math.abs(t.value - f.value) <= 0.02 * Math.abs(f.value)) fail(`${id}: trap for ${f.key} equals the answer`);
    for (const t of f.traps) if (!t.why) fail(`${id}: trap for ${f.key} without explanation`);
  });
  POSITIVE(ex).forEach((f) => { if (!(f.value > 0)) fail(`${id}: ${f.key} = ${f.value} is not positive`); });
  checkText(id, 'title', ex.title);
  checkText(id, 'text', ex.text);
  ex.hints.forEach((h, k) => checkText(id, `hint ${k + 1}`, h));
  ex.solution.forEach((s, k) => checkText(id, `step ${k + 1}`, s));
  checkText(id, 'results', ex.results);
  checkText(id, 'task figure', ex.figure({ task: true }));
  // every number in the task figure (masses, forces, μ, angles) must be the one in the text
  const nums = (html) => (html.replace(/<[^>]*>/g, ' ').match(/\d+(?:[.,]\d+)?/g) || []).map((x) => x.replace(',', '.'));
  const inText = new Set(nums(ex.text));
  for (const x of nums(ex.figure({ task: true }).replace(/<svg[^>]*>/, ''))) if (!inText.has(x)) fail(`${id}: figure shows ${x}, the text does not`);
  checkText(id, 'solution figure', ex.solutionFigure());
  ex.steps.forEach((s, k) => checkText(id, `step figure ${k + 1}`, ex.figure({ show: new Set(s.show || []), hl: new Set(s.hl || []) })));
}

const SAMPLES = 300;
const seen = {};
for (const lang of FS.LANGS) {
  FS.setLang(lang);
  for (const level of Object.keys(Forces.LEVELS)) {
    for (let seed = 1; seed <= SAMPLES; seed++) {
      const ex = Forces.generate(level, seed);
      seen[ex.scenario] = (seen[ex.scenario] || 0) + 1;
      // nice results (at most one decimal place, exact), except where sine or cosine come in
      const sc = Forces.SCENARIOS.find((x) => x.id === ex.scenario);
      if (!sc.trig) for (const f of ex.fields) if (Math.abs(10 * f.value - Math.round(10 * f.value)) > 1e-9) fail(`${lang} ${ex.id}: ${f.key} = ${f.value} is not a nice result`);
      checkExercise(ex, `${lang} ${ex.id}`);
    }
  }
}
for (const s of Forces.SCENARIOS) if (!seen[s.id]) fail(`scenario ${s.id} never generated`);

// The worksheet's answers (rounded as there) for the tutor's examples.
const SHEET = [
  { N: 3, R: 7 },
  { res: 6, R: 18, F: 24 },
  { res: 15, a: 3, K: 6 },
  { R: 12, res: 28, a: 3.5, S: 26 },
  { res: 12, N: 35, R: 14, F: 46 },
  { N: 52, R: 21, res: 29, a: 2.1, S: 63 },
];
for (const lang of FS.LANGS) {
  FS.setLang(lang);
  Lessons.EXAMPLES.forEach((e, k) => {
    const frames = Forces.tutorial(e).frames;
    frames.forEach((f, j) => { checkText(`lesson ${k + 1}`, `frame ${j + 1} text`, f.text); checkText(`lesson ${k + 1}`, `frame ${j + 1} figure`, f.figure); });
    const v = Forces.SCENARIOS.find((s) => s.id === e.scenario).solve(e.p);
    for (const [key, want] of Object.entries(SHEET[k])) {
      if (Math.abs(v[key] - want) > 0.06 * want) fail(`lesson ${k + 1}: ${key} = ${v[key]}, worksheet ${want}`);
    }
  });
}

// The arcade: exercises that need no calculator, and multiple-choice questions about them.
let quizzes = 0;
for (const lang of FS.LANGS) {
  FS.setLang(lang);
  for (const scn of Forces.SCENARIOS) {
    for (let seed = 1; seed <= 150; seed++) {
      const ex = Forces.generateFor(scn.id, seed, { nice: true });
      const id = `${lang} arcade ${scn.id}-${seed}`;
      checkExercise(ex, id);
      if (!Forces.nice(scn, ex.p)) fail(`${id}: needs a calculator: ${JSON.stringify(ex.v)}`);
      if (ex.p.alpha != null && Math.abs(Math.sin((ex.p.alpha * Math.PI) / 180) - 0.6) > 1e-9) fail(`${id}: angle ${ex.p.alpha} is not the 3-4-5 angle`);
      const qz = Forces.quiz(ex, seed);
      quizzes++;
      const vals = qz.options.map((o) => o.value);
      if (qz.options.length !== 4) fail(`${id}: ${qz.options.length} options`);
      if (qz.options.filter((o) => o.correct).length !== 1) fail(`${id}: not exactly one right option`);
      if (!qz.options.some((o) => o.correct && o.value === qz.field.value)) fail(`${id}: the right option is wrong`);
      if (vals.some((x) => !(x > 0) || Math.abs(2 * x - Math.round(2 * x)) > 1e-9)) fail(`${id}: option not a positive multiple of 0.5: ${vals}`);
      for (let i = 0; i < vals.length; i++) for (let j = i + 1; j < vals.length; j++) if (Math.abs(vals[i] - vals[j]) < 0.4) fail(`${id}: options too close: ${vals}`);
    }
  }
}
log(`${quizzes} arcade questions checked`);

log(`${checked} exercises checked, ${Object.keys(seen).length} situations: ${JSON.stringify(seen)}`);
log(failures ? `${failures} failures` : 'all checks passed');
if (typeof process !== 'undefined' && failures) process.exit(1);
