// Verifies the Oscillations generator: run with `node oscillations/test/check-generator.js`.
// For many seeds per exercise type and both languages it checks
// - every form of equation against a numerical solution: an SHM (a sine with the period of its
//   formula, fitted to the motion) exactly when the form says so,
// - the answers: the right period option, the mistake, the graph of the given equation (and four
//   graphs that do not look alike), the equation of a graph, and the kinematics worked out again
//   here (v_max = Aω, a_max = Aω², v = ω√(A² − x²), …),
// - one right option per choice, distinct options, an explanation for every wrong one, traps that
//   differ from the answer, four options in every arcade question,
// - that texts, hints, solutions and figures contain no undefined values (and no ß in German),
// - the tutor's examples (the worksheet's ξ + k²·ξ̈ = 0 has T = 2πk), and the problems.
'use strict';

const Lang = require('../lang.js');
require('../core.js'); require('../equations.js'); require('../plot.js'); require('../scenarios.js'); require('../generator.js'); require('../lessons.js');
global.window = globalThis; require('../realproblems.js');
const { OC, Equations: Eq, Scenarios, Osc, Lessons, OscProblems, Plot } = globalThis;

let failures = 0, checked = 0;
const fail = (msg) => { failures++; if (failures < 400) console.log('  FAIL ' + msg); };
const close = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1e-30, Math.abs(b));
const PI2 = 2 * Math.PI;

// ---------------------------------------------------------------- the forms against the numbers
// The motion is an SHM with period T if a least-squares fit y = a·cos(ωt) + b·sin(ωt) + c
// (ω = 2π/T) leaves almost nothing over, and the amplitude is not 0.
function fitsSine(pts, T) {
  const w = PI2 / T, M = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], R = [0, 0, 0];
  for (const [t, y] of pts) { const v = [Math.cos(w * t), Math.sin(w * t), 1]; for (let i = 0; i < 3; i++) { R[i] += v[i] * y; for (let j = 0; j < 3; j++) M[i][j] += v[i] * v[j]; } }
  const det = (m) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  const D = det(M), s = [0, 1, 2].map((k) => det(M.map((row, i) => row.map((x, j) => (j === k ? R[i] : x)))) / D);
  const amp = Math.hypot(s[0], s[1]), resid = Math.max(...pts.map(([t, y]) => Math.abs(y - s[0] * Math.cos(w * t) - s[1] * Math.sin(w * t) - s[2])));
  return amp > 0.05 && resid < 1e-4 * amp;
}
for (let seed = 1; seed <= 40; seed++) {
  const r = OC.rng(seed);
  for (const f of Eq.FORMS) {
    const P = Eq.numbers(r), T = f.shm ? f.period(P) : PI2 / P.c;
    const pts = Eq.trace(f.motion(P), 3 * T, 300, 1);
    if (fitsSine(pts, T) !== f.shm) fail(`form ${f.id}: ${f.shm ? 'no sine with its period' : 'a sine, but said not to be'} (c = ${P.c.toFixed(3)})`);
    // no SHM has another period either (twice and half as long)
    if (!f.shm && (fitsSine(pts, T * 2) || fitsSine(pts, T / 2))) fail(`form ${f.id}: harmonic after all`);
    if (f.shm && new Set(f.T(Eq.symbols('x', 'k', 'dot')).map((o) => (Array.isArray(o) ? o[0] : o))).size !== 4) fail(`form ${f.id}: periods alike`);
    if (!f.shm && !Eq.MISTAKES[f.mistake]) fail(`form ${f.id}: no mistake`);
  }
}

// ---------------------------------------------------------------- the exercises
const bad = /undefined|NaN|Infinity|\[object|\$\$\$/;
const outside = (s) => s.replace(/\$\$[\s\S]*?\$\$/g, '').replace(/\$[^$]*\$/g, '');
const checkText = (id, what, s) => {
  if (typeof s !== 'string' || bad.test(s)) fail(`${id}: ${what}: ${String(s).match(/.{0,40}(undefined|NaN|Infinity|\[object|\$\$\$).{0,40}/)?.[0]}`);
  else if (/\\htmlClass/.test(outside(s))) fail(`${id}: ${what}: \\htmlClass outside a formula`);
  else if (Lang.get() === 'de' && /ß/.test(s)) fail(`${id}: ${what}: ß`);
};
const val = (ex, key) => ex.fields.find((f) => f.key === key);
const si = (f) => f.value * OC.UNITS[f.unit][0];

const LAWS = {
  shm: (p, ex) => {
    const f = Eq.byId(p.eq.form);
    if (val(ex, 'shm').value !== (f.shm ? 'yes' : 'no')) fail(`${ex.scenario}: yes or no`);
    const follow = f.shm ? val(ex, 'T') : val(ex, 'mistake');
    if (!follow || follow.after !== 'shm') fail(`${ex.scenario}: the second part`);
    LAWS[f.shm ? 'period' : 'mistake'](p, ex);
  },
  period: (p, ex) => {
    const f = Eq.byId(p.eq.form), T = val(ex, 'T');
    if (!f.shm) fail(`${ex.scenario}: period of no SHM`);
    const right = T.options.find((o) => o[0] === T.value);
    if (!right || right[1] !== `$T = ${f.T(Eq.sym(p.eq))[0]}$`) fail(`${ex.scenario}: the right period`);
  },
  mistake: (p, ex) => {
    const m = val(ex, 'mistake');
    if (m.value !== Eq.byId(p.eq.form).mistake) fail(`${ex.scenario}: the mistake`);
    // the wrong options are features of this equation, not mistakes it does not make
    if (m.options.some((o) => o[0] !== m.value && Eq.MISTAKES[o[0]])) fail(`${ex.scenario}: another mistake offered for ${p.eq.form}`);
  },
  pick: (p, ex) => {
    const which = Number(val(ex, 'which').value);
    if (p.eqs.filter((e) => Eq.byId(e.form).shm).length !== 1 || !Eq.byId(p.eqs[which].form).shm) fail('pick-shm: not one SHM');
  },
  match: (p, ex) => {
    const g = val(ex, 'graph');
    if (g.value !== p.given || g.options.length !== 4) fail(`${ex.scenario}: graph`);
    const curves = g.options.map((o) => Scenarios.curveOf(o[0], p.n, p.tEnd).map(([t, y]) => [t, Math.max(p.axis.lo, Math.min(p.axis.hi, y))]));
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) if (Plot.alike(curves[i], curves[j], p.axis.hi - p.axis.lo)) fail(`${ex.scenario}: graphs alike`);
    // the given SHM has the period 2π/√K: a sine with it
    if (p.given === 'shm' && !fitsSine(Scenarios.curveOf('shm', p.n, p.tEnd), PI2 / Math.sqrt(p.n.K))) fail(`${ex.scenario}: period`);
  },
  back: (p, ex) => { const e = val(ex, 'eq'); if (e.value !== p.given || e.options.length !== 4 || new Set(e.options.map((o) => o[1])).size !== 4) fail('match-back: equations'); },
  kin: (p, ex) => {
    const w = PI2 * p.f, A = p.A, has = (k) => ex.fields.some((f) => f.key === k);
    const want = {
      vmax: { vmax: A * w, amax: A * w * w },
      'back-f': { f: p.f, T: 1 / p.f },
      'back-A': { w, A },
      'speed-x': { v: w * Math.sqrt(A * A - (p.k * A) ** 2), a: w * w * p.k * A },
      'speed-t': (() => { const t = ex.v.t, top = p.start === 'top'; return { x: top ? A * Math.cos(w * t) : A * Math.sin(w * t), v: top ? -A * w * Math.sin(w * t) : A * w * Math.cos(w * t) }; })(),
    }[ex.scenario];
    for (const [k, x] of Object.entries(want)) if (!has(k) || !close(si(val(ex, k)), x, 1e-9)) fail(`${ex.scenario}: ${k} = ${has(k) ? si(val(ex, k)) : '–'} ≠ ${x}`);
  },
};

for (const lang of ['en', 'de']) {
  Lang.set(lang, true);
  for (const scn of Osc.SCENARIOS) {
    const law = LAWS[scn.kind];
    if (!law) fail(`no law for ${scn.id}`);
    const seen = new Set();
    for (let seed = 1; seed <= 300; seed++) {
      const ex = Osc.practiceOf(scn.id, seed), id = `${lang}/${scn.id}/${seed}`;
      checked++;
      seen.add(JSON.stringify(ex.p));
      if (law) law(ex.p, ex);
      ex.fields.forEach((f) => {
        if (f.type === 'num') {
          if (!Number.isFinite(f.value) || (!f.signed && f.value <= 0)) fail(`${id}: ${f.key} = ${f.value}`);
          f.traps.forEach((t) => { if (Math.abs(t.value - f.value) <= 0.015 * Math.abs(f.value)) fail(`${id}: trap ${t.flag} equals the answer`); });
        } else {
          if (f.options.filter((o) => o[0] === f.value).length !== 1) fail(`${id}: ${f.key} has not one right option`);
          if (new Set(f.options.map((o) => o[1])).size !== f.options.length) fail(`${id}: ${f.key} options alike`);
          if (f.options.some((o) => o[0] !== f.value && !o[2])) fail(`${id}: ${f.key}: a wrong option without why`);
          if (f.after && !ex.fields.some((g) => g.key === f.after)) fail(`${id}: ${f.key} after nothing`);
        }
      });
      [ex.title, ex.text, ex.results, ...ex.hints, ...ex.solution, ex.figure(), ex.solutionFigure(), ...ex.fields.flatMap((f) => (f.options || []).map((o) => o[1] + o[2]))].forEach((s, i) => checkText(id, `text ${i}`, s));
      ex.steps.forEach((s, i) => checkText(id, `frame ${i}`, ex.figure({ show: new Set(s.show || []) })));
      if (seed <= 80) {
        const qz = Osc.quiz(ex, seed);
        if (qz.options.length !== 4 || qz.options.filter((o) => o.correct).length !== 1 || new Set(qz.options.map((o) => o.html)).size !== 4) fail(`${id}: quiz with ${qz.options.length} options`);
        if (qz.options.some((o) => !o.correct && o.why === undefined)) fail(`${id}: quiz option without why`);
      }
    }
    if (seen.size < 10) fail(`${scn.id}: only ${seen.size} different exercises`);
  }

  // the tutor's examples, and the worksheet's ξ + k²·ξ̈ = 0: an SHM with T = 2πk
  Lessons.EXAMPLES.forEach((e) => Osc.tutorial(e).frames.forEach((f, i) => { checkText(`tutor ${e.scenario}`, `frame ${i}`, f.text); checkText(`tutor ${e.scenario}`, `figure ${i}`, f.figure); }));
  const w1 = Osc.exercise(Osc.byId('shm-2'), Lessons.EXAMPLES[0].p);
  if (Osc.tutorial(Lessons.EXAMPLES[0]).frames.length < 9) fail('tutor 1: the three equations of the worksheet');
  const T1 = val(w1, 'T');
  if (val(w1, 'shm').value !== 'yes' || !T1 || T1.options.find((o) => o[0] === T1.value)[1] !== '$T = 2\\pi\\cdot k$') fail('worksheet: ξ + k²·ξ̈ = 0 has T = 2πk');

  // the problems
  OscProblems.PROBLEMS.forEach((pb, i) => {
    for (let seed = 1; seed <= 30; seed++) {
      const ex = OscProblems.realOf(i, seed), id = `${lang}/${pb.id}/${seed}`, p = ex.p, v = ex.v;
      checked++;
      ex.fields.forEach((f) => { if (!(Number.isFinite(f.value) && f.value > 0)) fail(`${id}: ${f.key} = ${f.value}`); });
      const w = p.T ? PI2 / p.T : PI2 * p.f;
      if (ex.fields.some((f) => f.key === 'vmax') && !close(si(val(ex, 'vmax')), v.Am * w, 1e-9)) fail(`${id}: v_max`);
      if (ex.fields.some((f) => f.key === 'amax') && !close(si(val(ex, 'amax')), v.Am * w * w, 1e-9)) fail(`${id}: a_max`);
      if (ex.fields.some((f) => f.key === 'acc') && !close(si(val(ex, 'acc')), w * w * p.x, 1e-9)) fail(`${id}: a at x`);
      if (ex.fields.some((f) => f.key === 'acc') && !(p.x < p.a)) fail(`${id}: x beyond the amplitude`);
      [ex.title, ex.text, ex.results, ...ex.hints, ...ex.solution, ex.solutionFigure()].forEach((s, j) => checkText(id, `text ${j}`, s));
    }
  });
}
const fork = OscProblems.realOf(0, 1);
if (!close(si(val(fork, 'amax')), fork.p.a * (PI2 * fork.p.f) ** 2, 1e-9)) fail('tuning fork');

console.log(failures ? `${failures} failures in ${checked} exercises` : `All checks passed (${checked} exercises).`);
process.exit(failures ? 1 : 0);
