// Verifies the torque generator: run with `node torque/test/check-generator.js`.
// For many seeds per situation, level and both languages it checks
// - the answers against the laws, written out independently: torques as cross products, the
//   balance of torques about the axis or the suspension point, the balance of forces, and centres
//   of mass by summing over the wire in small pieces,
// - that the values are positive and plausible, and exact where no calculator is wanted,
// - that the wrong-idea values differ from the right ones,
// - that texts, hints, solutions and drawings contain no undefined values.
// It also checks the tutor's examples against the answers on the worksheets.
'use strict';

require('../lang.js'); require('../core.js'); require('../draw.js'); require('../scenarios.js'); require('../generator.js'); require('../lessons.js');
const { TQ, Torque, Lessons, Lang } = globalThis;
const G = TQ.G;

let failures = 0, checked = 0;
const fail = (msg) => { failures++; if (failures < 30) console.log('  FAIL ' + msg); };
const close = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const sin = (d) => Math.sin((d * Math.PI) / 180);

// the centre of mass of a wire figure, from 20000 small pieces
function comNumeric(parts) {
  let m = 0, mx = 0, my = 0;
  for (const pt of parts) {
    const n = 20000;
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n;
      let x, y, dl;
      if (pt.kind === 'seg') { x = pt.a[0] + t * (pt.b[0] - pt.a[0]); y = pt.a[1] + t * (pt.b[1] - pt.a[1]); dl = Math.hypot(pt.b[0] - pt.a[0], pt.b[1] - pt.a[1]) / n; } else { x = pt.c[0] + pt.r * Math.cos(2 * Math.PI * t); y = pt.c[1] + pt.r * Math.sin(2 * Math.PI * t); dl = (2 * Math.PI * pt.r) / n; }
      m += dl; mx += dl * x; my += dl * y;
    }
  }
  return [mx / m, my / m];
}

// The laws per situation: [left, right] pairs that must be equal.
const LAWS = {
  plate: (p, v) => p.forces.map((f, i) => [v[`M${i + 1}`], (f.P[0] * f.u[1] * f.F - f.P[1] * f.u[0] * f.F) * 0.1]),
  seesaw: (p, v) => [[p.m1 * G * p.a1, p.find === 'x' ? p.m2 * G * v.x : v.m * G * p.a2]],
  lever3: (p, v) => [[p.m1 * p.a1 + p.m2 * p.a2, p.m3 * v.x]],
  'beam-weight': (p, v) => { const m = p.find === 'm' ? v.m : p.m, mb = p.find === 'mb' ? v.mb : p.mb; return [[m * G * p.s, mb * G * (p.len / 2 - p.s)]]; },
  angle: (p, v) => [[v.F * sin(p.alpha) * p.b, p.m * G * p.a]],
  // torques about the suspension point, and the forces
  hang: (p, v) => [[(p.F1 || 0) * v.x + p.m * G * (v.x - p.len / 2), p.F2 * (p.len - v.x)], [v.H, p.m * G + (p.F1 || 0) + p.F2]],
};
LAWS['plate-axis'] = LAWS.plate;
LAWS.hang2 = LAWS.hang;

const bad = /undefined|NaN|Infinity|\[object|\$\$\$/;
const checkText = (id, what, s) => { if (typeof s !== 'string' || bad.test(s)) fail(`${id}: ${what} contains an undefined value: ${String(s).match(bad)}`); };
const exactTo = (x, dec) => Math.abs(x * 10 ** dec - Math.round(x * 10 ** dec)) < 1e-6;

function checkExercise(ex, id, wantExact) {
  checked++;
  const law = LAWS[ex.scenario];
  if (law) law(ex.p, ex.v).forEach(([a, b], k) => { if (!close(a, b)) fail(`${id} (${ex.scenario}): law ${k + 1}: ${a} ≠ ${b}`); });
  else if (ex.family === 'com') {
    const S = Torque.SCENARIOS.find((s) => s.id === ex.scenario), shape = ex.scenario.slice(4);
    const c = comNumeric(globalThis.Scenarios.SHAPES[shape].parts(ex.p));
    ex.fields.forEach((f) => { const k = f.key === 'x' ? 0 : 1; if (!close(f.value, c[k], 1e-4)) fail(`${id}: ${f.key} = ${f.value}, numerically ${c[k]}`); });
    void S;
  } else fail(`${id}: no laws for ${ex.scenario}`);
  ex.fields.forEach((f) => {
    if (!Number.isFinite(f.value) || f.value < 0) fail(`${id}: ${f.key} = ${f.value}`);
    if (!f.sense && f.value <= 0) fail(`${id}: ${f.key} = ${f.value} is not positive`);
    if (f.value > 1000) fail(`${id}: ${f.key} = ${f.value} is implausibly large`);
    if (wantExact && !exactTo(f.value, f.dec)) fail(`${id}: ${f.key} = ${f.value} needs rounding`);
    f.traps.forEach((t) => { if (Math.abs(t.value - f.value) < 1e-9) fail(`${id}: trap ${t.flag} equals the answer`); if (!t.why) fail(`${id}: trap ${t.flag} has no explanation`); });
  });
  if (ex.scenario.startsWith('plate')) {
    const ms = ex.fields.map((f) => f.value).sort((a, b) => a - b);
    for (let i = 1; i < ms.length; i++) if (ms[i] - ms[i - 1] < 0.029) fail(`${id}: torques too close to rank: ${ms}`);
  }
  if (ex.scenario === 'hang' || ex.scenario === 'hang2') { const x = ex.v.x; if (x <= 0 || x > ex.p.len) fail(`${id}: suspension point ${x} off the beam`); }
  [['text', ex.text], ['figure', ex.figure()], ['solution figure', ex.solutionFigure()], ['results', ex.results], ...ex.hints.map((h, k) => [`hint ${k + 1}`, h]), ...ex.solution.map((s, k) => [`step ${k + 1}`, s])]
    .forEach(([w, s]) => checkText(id, w, s));
  ex.steps.forEach((s, k) => checkText(id, `figure of step ${k + 1}`, ex.figure({ show: new Set(s.show), hl: new Set(s.hl) })));
}

for (const lang of ['en', 'de']) {
  Lang.set(lang, true);
  for (const level of Object.keys(Torque.LEVELS)) {
    for (const calc of [true, false]) {
      for (let seed = 1; seed <= 150; seed++) {
        const ex = Torque.generate(level, seed, calc);
        checkExercise(ex, `${lang} ${ex.id}`, !calc || !['always', 'trig'].includes(Torque.SCENARIOS.find((s) => s.id === ex.scenario).calc));
        if (!calc && Torque.SCENARIOS.find((s) => s.id === ex.scenario).calc === 'always') fail(`${ex.id}: needs a calculator`);
      }
    }
  }
  // every situation, also for the arcade (no calculator) and its quiz
  for (const s of Torque.SCENARIOS) {
    for (let seed = 1; seed <= 40; seed++) {
      const ex = Torque.generateFor(s.id, seed, { nice: s.calc !== 'always' });
      checkExercise(ex, `${lang} ${s.id}-${seed}`, s.calc !== 'always');
      if (s.calc === 'always') continue;
      const qz = Torque.quiz(ex, seed);
      if (qz.options.length !== 4 || qz.options.filter((o) => o.correct).length !== 1) fail(`${s.id}-${seed}: quiz has ${qz.options.length} options`);
      const vals = qz.options.map((o) => o.value);
      if (new Set(vals).size !== 4 || vals.some((x) => !(x > 0))) fail(`${s.id}-${seed}: quiz options ${vals}`);
    }
  }
  // the tutor's examples
  Lessons.EXAMPLES.forEach((e, k) => {
    const t = Torque.tutorial(e);
    t.frames.forEach((f, j) => { checkText(`tutor ${k + 1}`, `frame ${j + 1}`, f.text); checkText(`tutor ${k + 1}`, `figure ${j + 1}`, f.figure); });
  });
}

// the worksheets' answers: b) F = 11.5 N; c) 16 cm, 30 N
const lesson = (id) => { const e = Lessons.EXAMPLES.find((x) => x.scenario === id); return Torque.exercise(Torque.SCENARIOS.find((s) => s.id === id), e.p); };
const b = lesson('angle'), c = lesson('hang');
if (TQ.round(b.v.F, 1) !== 11.5) fail(`worksheet b: F = ${b.v.F}, the worksheet says 11.5 N`);
if (c.v.x !== 16 || c.v.H !== 30) fail(`worksheet c: x = ${c.v.x}, F_H = ${c.v.H}; the worksheet says 16 cm, 30 N`);

console.log(`${checked} exercises checked, ${Torque.SCENARIOS.length} situations.`);
console.log(failures ? `${failures} failures.` : 'All checks passed.');
process.exitCode = failures ? 1 : 0;
