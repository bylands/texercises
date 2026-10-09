// Verifies the magnetic forces: run with `node magnetic-forces/test/check-exercises.js`. It checks
// - the physics, worked out independently: the hand rules (F = q·v × B against a table of
//   right-hand cases), the field of a straight wire (the right-hand grip rule: anticlockwise
//   around a current out of the page) and that parallel currents attract, opposite ones repel;
//   the paths keep their speed and run on circles of radius m·v/(q·B), turning clockwise for a
//   positive charge in a field out of the page,
// - for every type, in both languages and many seeds: each question has at least one right
//   option (exactly one unless several may fit), each wrong option a reason; for a missing field
//   or velocity, the right options are exactly those that give the force; statements are mixed;
//   the right value of a radius, a period or a speed is the formula's,
// - every problem, and no text or drawing contains undefined, NaN and the like.
'use strict';

const Lang = require('../lang.js');
const M = require('../generator.js');
const X = require('../exercises.js');
const R = require('../realproblems.js');
const F = require('../figures.js');

let failures = 0;
const fail = (msg) => { failures++; if (failures < 30) console.error('  FAIL ' + msg); };
const bad = (html) => /undefined|NaN|\[object|Infinity|[>(=:"]null\b/.test(html);
const json = (e) => JSON.stringify(e, (k, v) => (typeof v === 'function' ? undefined : v));
const near = (a, b, rel = 1e-6) => Math.abs(a - b) <= rel * Math.max(Math.abs(a), Math.abs(b), 1e-30);
const SEEDS = 150;

// ---------------------------------------------------------------- the physics
const x = [1, 0, 0], y = [0, 1, 0], z = [0, 0, 1], m = (a) => a.map((c) => -c);
// right hand: thumb, index finger, middle finger along x, y, z (and cyclic)
for (const [v, B, f] of [[x, y, z], [y, z, x], [z, x, y], [y, x, m(z)], [x, m(z), y]]) {
  if (!M.same(M.force(1, v, B), f)) fail(`hand rule for a positive charge: ${v} × ${B}`);
  if (!M.same(M.force(-1, v, B), m(f))) fail(`left hand for a negative charge: ${v} × ${B}`);
}
if (M.force(1, x, x) !== null || M.force(0, x, y) !== null) fail('no force along the field or on a neutral particle');
// a current out of the page: the field anticlockwise (at the right: up, above: left)
if (!M.same(M.wireField(z, [1, 0, 0]), y) || !M.same(M.wireField(z, [0, 1, 0]), m(x))) fail('the grip rule');
// parallel currents attract, opposite ones repel (wire 2 to the right of wire 1)
if (!M.same(M.force(1, z, M.wireField(z, [1, 0, 0])), m(x))) fail('parallel currents do not attract');
if (!M.same(M.force(1, m(z), M.wireField(z, [1, 0, 0])), x)) fail('opposite currents do not repel');
// a path: constant speed, radius 1/|k|, clockwise for a positive charge in a field out of the page
{
  const pts = M.path({ x0: 0, y0: 0, vx: 1, vy: 0, k: 0.5, Bz: () => 1, dt: 0.01, n: 600 });
  const cx = 0, cy = -2; // the centre below the start: a clockwise turn
  for (const p of pts) if (Math.abs(Math.hypot(p[0] - cx, p[1] - cy) - 2) > 1e-4) { fail('the path is not a circle of radius m·v/(q·B), turning clockwise'); break; }
}

// ---------------------------------------------------------------- the exercises
function checkQuestions(tag, e) {
  for (const q of e.questions) {
    if (q.type === 'multi') {
      if (!q.statements.some((s) => s.ok) || !q.statements.some((s) => !s.ok)) fail(`${tag}: statements all of one kind`);
      if (q.statements.some((s) => !s.why)) fail(`${tag}: a statement without a reason`);
      continue;
    }
    const n = q.options.filter((o) => o.ok).length;
    if (n < 1 || (!q.multi && n !== 1)) fail(`${tag} ${q.key}: ${n} right options`);
    if (q.options.some((o) => !o.ok && !o.why)) fail(`${tag} ${q.key}: a wrong option without a reason`);
    if (q.options.length < 2) fail(`${tag} ${q.key}: too few options`);
    const labels = q.options.map((o) => o.label || o.html);
    if (new Set(labels).size !== labels.length) fail(`${tag} ${q.key}: two options alike`);
  }
}
const valueOf = (label) => { const [num, exp] = label.replace('−', '-').split(' · 10<sup>'); return Number(num.split(' ')[0]) * (exp ? 10 ** Number(exp.replace('−', '-').replace('</sup>', '').split(' ')[0]) : 1); };
const UNIT = { m: 1, cm: 1e-2, mm: 1e-3, 'µm': 1e-6, s: 1, ms: 1e-3, 'µs': 1e-6, ns: 1e-9, ps: 1e-12 };
const si = (label) => { const parts = label.split(' '); return Number(parts[0]) * UNIT[parts[1]]; };

let several = 0;
for (const lang of ['en', 'de']) {
  Lang.set(lang, true);
  for (const type of X.TYPES) {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const e = X.make(type, seed), tag = `${type} ${seed} ${lang}`;
      if (bad(json(e))) fail(`${tag}: undefined or NaN`);
      if (!e.hints.length || !e.solution.length) fail(`${tag}: no hints or solution`);
      checkQuestions(tag, e);
      if (lang === 'de') continue;
      if (type === 'dir-missing') {
        const p = e.p, a = p.a.split(',').map(Number), Fv = p.F.split(',').map(Number), q = e.questions[0];
        p.o.forEach((k, i) => {
          const d = k.split(',').map(Number), f = p.missing === 'B' ? M.force(p.q, a, d) : M.force(p.q, d, a);
          if (M.same(f, Fv) !== q.options[i].ok) fail(`${tag}: option ${k} marked ${q.options[i].ok} but gives ${f}`);
        });
        if (q.options.filter((o) => o.ok).length > 1) several++;
      }
      if (type === 'dir-current' || type === 'dir-particle') {
        const { q, v, B } = e.p, f = M.force(q, v.split(',').map(Number), B.split(',').map(Number)), right = e.questions[0].options.find((o) => o.ok).html;
        if (!right.includes(`<span>${X.dirName(f)}</span>`)) fail(`${tag}: the right option is not q·v × B (${X.dirName(f)})`);
      }
      if (type === 'radius-num') {
        const pt = M.PARTICLES[e.p.name], r0 = (pt.m * e.p.v) / (Math.abs(pt.q) * e.p.B), T0 = (2 * Math.PI * pt.m) / (Math.abs(pt.q) * e.p.B);
        if (!near(si(e.questions[0].options.find((o) => o.ok).label), r0, 0.01)) fail(`${tag}: the radius`);
        if (!near(si(e.questions[1].options.find((o) => o.ok).label), T0, 0.01)) fail(`${tag}: the period`);
      }
      if (type === 'selector' && !near(valueOf(e.questions[0].options.find((o) => o.ok).label), e.p.E / e.p.B, 0.01)) fail(`${tag}: v = E/B`);
    }
  }
  R.PROBLEMS.forEach((p, i) => {
    for (let seed = 1; seed <= 40; seed++) {
      const e = R.realOf(i, seed), tag = `real ${p.id} ${seed} ${lang}`;
      if (bad(json(e)) || bad(F[e.pic[0]](e.pic[1]))) fail(`${tag}: undefined or NaN`);
      checkQuestions(tag, e);
    }
  });
}
if (!several) fail('no exercise with several fitting directions');
console.log(`${X.TYPES.length} types × ${SEEDS} seeds and ${R.PROBLEMS.length} problems, in both languages; ${several} with several fitting directions`);
if (failures) { console.error(`${failures} failures`); process.exit(1); }
console.log('all checks passed');
