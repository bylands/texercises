// Verifies the free-body diagrams generator: run with `node force-systems/test/check-generator.js`.
// For many seeds per situation and both languages it checks
// - the worked solutions against Newton's laws, written out independently for each situation
//   (balance perpendicular to the motion, F = m a for the system and for single boxes),
// - that the values are positive and the boxes move the way the text says,
// - the equations to choose: four different ones, the right one true for the situation's values
//   and each wrong one false,
// - "find the error": one wrong step, and the check's questions: four options, one right,
// - that texts, hints, solutions and drawings contain no undefined values.
// It also checks the tutor's examples against the answers on the worksheet, and that the check's
// questions on springs and drag offer their misconceptions.
'use strict';

const load = typeof require === 'function'
  ? () => { require('../lang.js'); require('../core.js'); require('../draw.js'); require('../scenarios.js'); require('../equations.js'); require('../generator.js'); require('../lessons.js'); require('../check-src.js'); }
  : () => {};
load();
const { FS, Forces, Lessons, Equations, CheckSource } = globalThis;
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
  // springs (Δx in cm) and drag
  'spring-hang': (p, v) => [[v.Fs, p.m * g], [v.Fs, (p.k * v.dx) / 100], [v.k, p.k]],
  'spring-floor': (p, v) => [[v.Fs, (p.k * p.dx) / 100], [v.R, p.mu * p.m * g], [v.Fs - v.R, p.m * v.a]],
  'drag-fall': (p, v) => (p.phase === 'terminal' ? [[v.D, p.m * g], [v.a, 0]]
    : p.phase === 'early' ? [[p.m * g - p.D, p.m * v.a], [v.res, p.m * v.a], [p.D < p.m * g ? 1 : 0, 1]]
      : [[p.D - p.m * g, p.m * v.a], [v.res, p.m * v.a], [p.D > p.m * g ? 1 : 0, 1]]),
  'drag-bike': (p, v) => [[v.N, p.m * g], [p.D, p.m * v.a]],
};
// Quantities that must be positive (a box at rest or at constant speed may have a = 0).
const POSITIVE = (ex) => ex.fields.filter((f) => !(f.key === 'a' && ex.p.a === 0) && !(f.key === 'res' && ex.p.a === 0));

const bad = /undefined|NaN|Infinity|\[object/;
function checkText(id, what, s) {
  if (typeof s !== 'string' || bad.test(s)) fail(`${id}: ${what} contains an undefined value: ${String(s).match(bad)}`);
  else if (/[^\\];\\Rightarrow|\\Rightarrow;/.test(s)) fail(`${id}: ${what}: a TeX space lost its backslash`);
}

function checkExercise(ex, id) {
  checked++;
  const law = LAWS[ex.scenario];
  if (!law) { fail(`${id}: no laws for ${ex.scenario}`); return; }
  law(ex.p, ex.v).forEach(([a, b], k) => { if (!close(a, b)) fail(`${id} (${ex.scenario}): law ${k + 1}: ${a} ≠ ${b}`); });
  ex.fields.forEach((f) => {
    if (!Number.isFinite(f.value)) fail(`${id}: ${f.key} is ${f.value}`);
    if (f.value > 2000) fail(`${id}: ${f.key} = ${f.value} is implausibly large`);
  });
  POSITIVE(ex).forEach((f) => { if (!(f.value > 0)) fail(`${id}: ${f.key} = ${f.value} is not positive`); });
  // the table of forces: every box has its weight; friction only where there is a coefficient
  const t = ex.forces, ki = (k) => t.kinds.findIndex((x) => x.kind === k);
  if (t.boxes.length !== (ex.p.m1 != null ? 2 : 1)) fail(`${id}: ${t.boxes.length} boxes in the table of forces`);
  t.table.forEach((row, i) => { if (!row[ki('g')]) fail(`${id}: no weight on box ${i + 1}`); });
  if (ex.scenario === 'rope-pair' && !t.table[1][ki('s')]) fail(`${id}: the pull does not act on the right box`);
  if (ex.scenario === 'rope-pair' && t.table[1][ki('r')] !== ex.p.mu2 > 0) fail(`${id}: friction on the right box with mu2 = ${ex.p.mu2}`);
  if (['atwood'].includes(ex.scenario) && t.table.some((r) => r[ki('n')] || r[ki('r')])) fail(`${id}: normal force or friction on a hanging box`);
  // springs and drag: the spring force or drag acts, and no push or pull (a "force of motion")
  if (/^(spring|drag)-/.test(ex.scenario)) {
    const sp = /^spring/.test(ex.scenario);
    if (!t.table[0][ki('f')] !== !sp || !t.table[0][ki('d')] !== sp) fail(`${id}: spring force or drag wrong in the table of forces`);
    if (t.table[0][ki('s')] || t.table[0][ki('k')]) fail(`${id}: a push, pull or rope force in the table of forces`);
    const N = ['spring-floor', 'drag-bike'].includes(ex.scenario);
    if (!t.table[0][ki('n')] !== !N || !t.table[0][ki('r')] !== (ex.scenario !== 'spring-floor')) fail(`${id}: normal force or friction wrong in the table of forces`);
  }
  t.boxes.forEach((b) => checkText(id, 'box name', b));
  // ticking draws the forces in, those that do not act too, without resizing the drawing
  const none = ex.taskFigure(new Set()), every = ex.taskFigure(new Set(t.boxes.flatMap((b, i) => t.kinds.map((k, j) => `${i}:${j}`))));
  checkText(id, 'task figure with all forces ticked', every);
  const vb = (svg) => svg.match(/viewBox="([^"]+)"/)[1];
  if (vb(none) !== vb(every)) fail(`${id}: ticking forces resizes the drawing: ${vb(none)} → ${vb(every)}`);
  const drawn = (every.match(/class="seq force k-[gnrskfd]/g) || []).length;
  if (drawn < t.boxes.length * t.kinds.length) fail(`${id}: ${drawn} arrows for ${t.boxes.length * t.kinds.length} ticks`);
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

// The equations of an exercise as numbers (in English, where the symbols are F_N, F_f, F_T, F_c):
// the right one must hold for the situation's values, a wrong one must not (but for a rare
// coincidence of numbers, counted per equation).
function equationValue(ex, html) {
  FS.setLang('en');
  const p = ex.p, v = ex.v, rad = (p.alpha || 0) * Math.PI / 180;
  const vals = {
    g, m: p.m, m1: p.m1, m2: p.m2, a: p.a != null ? p.a : v.a, F: p.F != null ? p.F : v.F, mu: p.mu,
    N: v.N != null ? v.N : p.m * g, R: v.R, R1: v.R1, R2: v.R2 || 0, S: v.S, K: v.K,
    SIN: Math.sin(rad), COS: Math.cos(rad), TAN: Math.tan(rad),
    // springs (Δx in metres) and drag; F where there is no push or pull is a "force of motion"
    // that does not exist: any value but zero
    Fs: v.Fs, k: p.k, dx: (p.dx != null ? p.dx : v.dx) / 100, D: p.D != null ? p.D : v.D,
  };
  if (vals.F == null) vals.F = 7;
  let t = html.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1)/($2)');
  [[FS.tex('R', 1), 'R1'], [FS.tex('R', 2), 'R2'], [FS.tex('Fs'), 'Fs'], [FS.tex('D'), 'D'], [FS.tex('N'), 'N'], [FS.tex('R'), 'R'], [FS.tex('S'), 'S'], [FS.tex('K'), 'K'], [FS.tex('mu'), 'mu'],
    ['\\Delta x', 'dx'], ['\\sin\\alpha', '*SIN'], ['\\cos\\alpha', '*COS'], ['\\tan\\alpha', '*TAN'], ['m_1', 'm1'], ['m_2', 'm2'], ['\\,', '*'], ['$', '']].forEach(([a, b]) => { t = t.split(a).join(b); });
  const [lhs, rhs] = t.split('=');
  const f = (e) => Function(...Object.keys(vals), `return ${e};`)(...Object.values(vals));
  return [f(lhs), f(rhs)];
}
const holds = ([x, y]) => Math.abs(x - y) <= 1e-6 * Math.max(1, Math.abs(x), Math.abs(y));
const trueWrong = {}, seenWrong = {};
function checkEquations(ex, id) {
  const lang = FS.getLang();
  Equations.of(ex.scenario, ex.p).forEach((it) => {
    if (it.options.length !== 4) fail(`${id}: equation ${it.key} has ${it.options.length} options`);
    if (new Set(it.options.map((o) => o.html)).size !== it.options.length) fail(`${id}: equation ${it.key} has equal options`);
    if (it.options.filter((o) => o.right).length !== 1) fail(`${id}: equation ${it.key}: not exactly one right option`);
    it.options.forEach((o) => {
      if (!o.right && !o.why) fail(`${id}: equation ${it.key}: a wrong option without explanation`);
      checkText(id, `equation ${it.key}`, o.html + (o.why || ''));
    });
    checkText(id, `equation ${it.key}`, it.what + it.value);
    if (lang !== 'en') return;
    it.options.forEach((o) => {
      const val = equationValue(ex, o.html);
      if (val.some((x) => !Number.isFinite(x))) { fail(`${id}: equation ${it.key} ${o.html} is not a number: ${val}`); return; }
      if (o.right && !holds(val)) fail(`${id}: the right equation ${it.key} ${o.html} does not hold: ${val}`);
      if (!o.right) {
        const k = `${ex.scenario} ${it.key} ${o.n}`;
        seenWrong[k] = (seenWrong[k] || 0) + 1;
        if (holds(val)) trueWrong[k] = (trueWrong[k] || 0) + 1;
      }
    });
  });
  FS.setLang(lang);
}

// Practice: every situation in both languages, with angles of right triangles with whole sides, so
// that the components the student identifies are whole numbers (the app gives them) and the
// worked solution needs no rounding.
let practised = 0;
const seen = {};
for (const lang of FS.LANGS) {
  FS.setLang(lang);
  for (const scn of Forces.SCENARIOS) {
    for (let seed = 1; seed <= 150; seed++) {
      const ex = Forces.practiceOf(scn.id, seed), id = `${lang} practice ${scn.id}-${seed}`;
      practised++;
      seen[scn.id] = (seen[scn.id] || 0) + 1;
      checkExercise(ex, id);
      checkEquations(ex, id);
      if (!ex.eqs.length) fail(`${id}: no equations to choose`);
      ex.fields.forEach((f) => { if (Math.abs(10 * f.value - Math.round(10 * f.value)) > 1e-9) fail(`${id}: ${f.key} = ${f.value} needs rounding`); });
      if (scn.trig && !ex.comps.length) fail(`${id}: no components to identify`);
      ex.comps.forEach((c) => {
        const x = c.baseVal * Math[c.fn]((ex.p.alpha * Math.PI) / 180);
        if (Math.abs(x - Math.round(x)) > 1e-9) fail(`${id}: component ${c.key} = ${x} is not a whole number`);
      });
      // any angles, as in the check
      const any = Forces.generateFor(scn.id, seed);
      checkExercise(any, `${lang} any ${scn.id}-${seed}`);
      checkEquations(any, `${lang} any ${scn.id}-${seed}`);
    }
  }
}
for (const s of Forces.SCENARIOS) if (!seen[s.id]) fail(`scenario ${s.id} never generated`);
for (const [k, n] of Object.entries(trueWrong)) if (n > 0.2 * seenWrong[k]) fail(`wrong equation ${k} holds in ${n} of ${seenWrong[k]} exercises`);
log(`${practised} practice exercises checked; wrong equations that held by coincidence: ${JSON.stringify(trueWrong)}, ${Object.keys(seenWrong).length} wrong equations evaluated`);

// Find the error: a student's attempt with exactly one wrong step, a drawing, and every text set.
let errors = 0;
const slips = {};
for (const lang of FS.LANGS) {
  FS.setLang(lang);
  for (const type of ['error-floor', 'error-pulley', 'error-slope']) {
    for (let seed = 1; seed <= 150; seed++) {
      const ex = Forces.practiceOf(type, seed), id = `${lang} ${type}-${seed}`, it = ex.eqs[0], e = ex.p.err;
      errors++;
      if (ex.scenario !== type) fail(`${id}: type ${ex.scenario}`);
      if (it.options.length !== 4 || it.options.filter((o) => o.right).length !== 1 || !it.options[e.at].right) fail(`${id}: the wrong step is not the one to choose`);
      if (e.at && Equations.of(ex.situation, ex.p)[e.eqs[e.at - 1]].options.find((o) => o.n === e.n).right) fail(`${id}: the wrong equation is right`);
      if (e.eqs.length !== 3) fail(`${id}: ${e.eqs.length} equations`);
      slips[e.at ? 'equation' : e.flag] = (slips[e.at ? 'equation' : e.flag] || 0) + 1;
      if (!ex.taskFigure().includes('<svg') || !ex.solutionFigure().includes('<svg')) fail(`${id}: a drawing is missing`);
      [ex.title, ex.text, it.value, ...it.options.map((o) => o.html + o.why), ...ex.hints, ...ex.solution, ex.results].forEach((x, k) => checkText(id, `text ${k}`, x));
    }
  }
}
['motion', 'noFric', 'equation'].forEach((k) => { if (!slips[k]) fail(`find the error: no slip of the kind ${k}`); });
log(`${errors} attempts to find the error in checked: ${JSON.stringify(slips)}`);

// The worksheet's answers (rounded as there) for the tutor's examples; the last example is a
// student's attempt with the rope force set equal to the weight of the hanging box.
const SHEET = [
  { N: 3, R: 7 },
  { res: 6, R: 18, F: 24 },
  { res: 15, a: 3, K: 6 },
  { R: 12, res: 28, a: 3.5, S: 26 },
  { res: 12, N: 35, R: 14, F: 46 },
  { N: 52, R: 21, res: 29, a: 2.1, S: 63 },
  null, // find the error (see above)
  { Fs: 20, R: 5, a: 7.5 }, // springs and drag: not on the worksheet
  { res: 320, a: 4 },
];
for (const lang of FS.LANGS) {
  FS.setLang(lang);
  Lessons.EXAMPLES.forEach((e, k) => {
    const frames = Forces.tutorial(e).frames;
    frames.forEach((f, j) => { checkText(`lesson ${k + 1}`, `frame ${j + 1} text`, f.text); checkText(`lesson ${k + 1}`, `frame ${j + 1} figure`, f.figure); });
    e.practice.forEach((s) => s.types.forEach((t) => { if (!Forces.practiceOf(t, 1)) fail(`lesson ${k + 1}: no practice of ${t}`); }));
    if (e.error) {
      const opt = Equations.of(e.scenario, e.p)[e.p.err.eqs[e.p.err.at - 1]].options.find((o) => o.n === e.p.err.n);
      if (opt.flag !== 'rope') fail(`lesson ${k + 1}: the error is ${opt.flag}, not the rope force`);
      return;
    }
    const v = Forces.SCENARIOS.find((s) => s.id === e.scenario).solve(e.p);
    for (const [key, want] of Object.entries(SHEET[k])) {
      if (Math.abs(v[key] - want) > 0.06 * want) fail(`lesson ${k + 1}: ${key} = ${v[key]}, worksheet ${want}`);
    }
  });
}

// The check: every kind of every objective gives questions with four different options, one of
// them right, and flags that name a misconception or none.
let questions = 0;
for (const lang of FS.LANGS) {
  FS.setLang(lang);
  CheckSource.objectives.forEach((o) => {
    if (!o.kinds.length || o.tutor == null || o.topic == null) fail(`objective ${o.id}: kinds, tutor or topic missing`);
    if (o.tutor >= Lessons.EXAMPLES.length || o.topic >= Lessons.EXAMPLES.length) fail(`objective ${o.id}: no such example or topic`);
    checkText(o.id, 'name', o.name());
    o.kinds.forEach((kind) => {
      for (let seed = 1; seed <= 120; seed++) {
        const q = CheckSource.question(kind, seed), id = `${lang} check ${kind}-${seed}`;
        questions++;
        if (q.options.length !== 4) fail(`${id}: ${q.options.length} options`);
        if (q.options.filter((x) => x.correct).length !== 1) fail(`${id}: not exactly one right option`);
        if (new Set(q.options.map((x) => x.html)).size !== q.options.length) fail(`${id}: equal options`);
        q.options.forEach((x) => { if (x.flag && !(x.flag in CheckSource.concept) && !['dir', 'axis', 'noK', 'fric', 'other', 'unit'].includes(x.flag)) fail(`${id}: unknown flag ${x.flag}`); });
        [q.title, q.text, q.figure, q.ask, q.explain(), ...q.options.map((x) => x.html + (x.why || ''))].forEach((x, k) => checkText(id, `part ${k}`, x));
        if (lang === 'de' && q.options.some((x) => /\b(upwards|downwards|to the (left|right)|backwards|forwards|weight)\b/.test(x.html + (x.why || '')))) fail(`${id}: English in a German option`);
      }
    });
  });
  Object.values(CheckSource.concept).forEach((c) => { if (!CheckSource.concepts()[c]) fail(`concept ${c} has no name`); });
}
// the new objectives show their misconceptions among the wrong options
FS.setLang('en');
const flagsOf = (kind) => new Set(Array.from({ length: 200 }, (_, k) => CheckSource.question(kind, k + 1).options.map((x) => x.flag)).flat());
[['spring-dir', ['stretch', 'unit']], ['spring-law', ['stretch', 'hooke', 'noFric']], ['spring-forces', ['motion']],
  ['drag-dir', ['accel', 'motion', 'terminal']], ['drag-law', ['accel', 'motion', 'terminal', 'noDrag']], ['drag-forces', ['motion', 'noDrag']]].forEach(([kind, want]) => {
  const got = flagsOf(kind);
  want.forEach((f) => { if (!got.has(f)) fail(`check ${kind}: no option with the misconception ${f}`); });
});
log(`${questions} check questions checked`);

log(`${checked} exercises checked, ${Object.keys(seen).length} situations: ${JSON.stringify(seen)}`);
log(failures ? `${failures} failures` : 'all checks passed');
if (typeof process !== 'undefined' && failures) process.exit(1);
