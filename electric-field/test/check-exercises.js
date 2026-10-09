// Verifies Electric Field: run with `node electric-field/test/check-exercises.js`. It checks
// - the physics, independently: the field of a point charge points away from a positive charge
//   and falls with 1/r²; field lines run from + to − (or to the edge); equipotentials are
//   perpendicular to the field; around a conducting cylinder there is no field inside and the field
//   meets the surface at right angles; where an exercise says the field is zero, it is;
//   the net field of an exercise's charges points as its right answer says; a dipole turns as said,
// - for every type, in both languages and many seeds: each question has a right option (exactly one
//   unless several may fit), a reason for each wrong one, distinct options; statements are mixed,
// - every problem, and no text or drawing contains undefined, NaN and the like.
'use strict';

const Lang = require('../lang.js');
const C = require('../charges.js');
const E = require('../elec.js');
const X = require('../exercises.js');
const R = require('../realproblems.js');
const F = require('../figures.js');

let failures = 0;
const fail = (msg) => { failures++; if (failures < 30) console.error('  FAIL ' + msg); };
const bad = (html) => /undefined|NaN|\[object|Infinity|[(=:]null\b/.test(html);
const json = (e) => JSON.stringify(e, (k, v) => (typeof v === 'function' ? undefined : v));
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const SEEDS = 60;

// ---------------------------------------------------------------- the physics
const one = { kind: 'points', charges: [{ q: 1, x: 0, y: 0 }] };
{
  const [ex, ey] = C.field(one, 1, 0), [fx] = C.field(one, 2, 0);
  if (!(ex > 0 && near(ey, 0, 1e-12) && near(ex / fx, 4, 1e-9))) fail('the field of a point charge');
}
const opp = { kind: 'points', charges: [{ q: 1, x: -1, y: 0 }, { q: -1, x: 1, y: 0 }] }, box = [-3, 3, -2.2, 2.2];
for (const ln of C.lines(opp, box)) {
  const a = ln[0], b = ln[ln.length - 1], fromPlus = Math.hypot(a[0] + 1, a[1]) < 0.2, toMinus = Math.hypot(b[0] - 1, b[1]) < 0.25, out = Math.abs(b[0]) > 2.9 || Math.abs(b[1]) > 2.1 || Math.abs(a[0]) > 2.9 || Math.abs(a[1]) > 2.1;
  if (!((fromPlus && (toMinus || out)) || (toMinus && out))) { fail('a field line does not run from + to −'); break; }
}
for (const [p, q] of C.contours(opp, box, [-0.6, -0.2, 0.2, 0.6]).slice(0, 400)) {
  const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], f = C.field(opp, ...m), t = [q[0] - p[0], q[1] - p[1]];
  const cos = (f[0] * t[0] + f[1] * t[1]) / (Math.hypot(...f) * Math.hypot(...t) || 1);
  if (Math.hypot(...t) > 1e-4 && Math.abs(cos) > 0.15) { fail('an equipotential is not perpendicular to the field'); break; }
}
{
  const cyl = { kind: 'cylinder', a: 0.8, E0: 1 };
  if (Math.hypot(...C.field(cyl, 0.3, 0.2)) > 1e-12) fail('a field inside the conductor');
  for (let th = 0; th < 2 * Math.PI; th += 0.3) {
    const x = 0.8001 * Math.cos(th), y = 0.8001 * Math.sin(th), f = C.field(cyl, x, y), tang = -f[0] * Math.sin(th) + f[1] * Math.cos(th);
    if (Math.abs(tang) > 1e-3 * Math.max(1, Math.hypot(...f))) { fail('the field is not perpendicular to the conductor'); break; }
  }
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
    const labels = q.options.map((o) => o.label || o.html);
    if (new Set(labels).size !== labels.length) fail(`${tag} ${q.key}: two options alike`);
  }
}
const rightLabel = (e, key) => { const q = e.questions.find((x) => x.key === key); return (q.options.find((o) => o.ok).label || q.options.find((o) => o.ok).html); };
for (const lang of ['en', 'de']) {
  Lang.set(lang, true);
  for (const type of X.TYPES) {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const e = X.make(type, seed), tag = `${type} ${seed} ${lang}`;
      if (bad(json(e))) fail(`${tag}: undefined or NaN`);
      if (!e.hints.length || !e.solution.length) fail(`${tag}: no hints or solution`);
      checkQuestions(tag, e);
      if (lang === 'de') continue;
      if (type === 'force-dir') {
        const Ed = e.p.E.split(',').map(Number), F2 = e.p.q ? Ed.map((x) => x * e.p.q) : null;
        if (!rightLabel(e, 'F').includes(`<span>${E.dirName(F2, 'no force')}</span>`)) fail(`${tag}: the force is not q·E`);
      }
      if (type === 'superpose') {
        const ch = e.p.ch.split(' ').map((s) => { const [q, xy] = s.split('@'); const [x, y] = xy.split(',').map(Number); return { q: Number(q), x, y }; });
        const net = C.field({ kind: 'points', charges: ch }, 0, 0), d = E.dirOf(net);
        if (!rightLabel(e, 'E').includes(`<span>${E.dirName(d, 'zero')}</span>`)) fail(`${tag}: the net field is not the right answer`);
      }
      if (type === 'zero') {
        const { a, b, d } = e.p, xq = e.questions.find((q) => q.key === 'x');
        if (xq) {
          const dist = Number(xq.options.find((o) => o.ok).label.split(' ')[0]), reg = rightLabel(e, 'reg');
          const x = /left|links/.test(reg) ? -dist : dist, Ex = a / (x * x) * Math.sign(x) + b / ((x - d) ** 2) * Math.sign(x - d);
          // the position is shown to 3 digits
          if (Math.abs(Ex) > 0.05 * (Math.abs(a / (x * x)) + 1e-9)) fail(`${tag}: the field is not zero there (${x} cm)`);
        }
      }
      if (type === 'dipole-uniform') {
        const Ed = e.p.E.split(',').map(Number), a0 = Math.atan2(Ed[1], Ed[0]) + (e.p.ang * Math.PI) / 180, tz = Math.cos(a0) * Ed[1] - Math.sin(a0) * Ed[0];
        const want = Math.abs(tz) < 1e-9 ? 'does not turn' : tz > 0 ? 'turns anticlockwise' : 'turns clockwise';
        if (rightLabel(e, 'T') !== want) fail(`${tag}: the dipole turns ${rightLabel(e, 'T')}, not ${want}`);
      }
      if (type === 'millikan') {
        const { m, dmm, n } = e.p, nn = Number(rightLabel(e, 'n'));
        if (nn !== n) fail(`${tag}: the number of elementary charges`);
      }
    }
  }
  R.PROBLEMS.forEach((p, i) => {
    for (let seed = 1; seed <= 30; seed++) {
      const e = R.realOf(i, seed), tag = `real ${p.id} ${seed} ${lang}`;
      if (bad(json(e)) || bad(F[e.pic[0]](e.pic[1]))) fail(`${tag}: undefined or NaN`);
      checkQuestions(tag, e);
    }
  });
}
console.log(`${X.TYPES.length} types × ${SEEDS} seeds and ${R.PROBLEMS.length} problems, in both languages`);
if (failures) { console.error(`${failures} failures`); process.exit(1); }
console.log('all checks passed');
