// Verifies the magnetic forces: run with `node magnetic-forces/test/check-exercises.js`. It checks
// - the physics, worked out independently: the hand rules (F = q·v × B against a table of
//   right-hand cases), the field of a straight wire (the right-hand grip rule: anticlockwise
//   around a current out of the page), that parallel currents attract, opposite ones repel, and
//   the field lines in the page: closed circles around a wire, through a loop and a solenoid along
//   the axis in the sense of the grip rule,
// - for every type, in both languages and many seeds: each question has at least one right
//   option (exactly one unless several may fit), each wrong option a reason; for a missing field
//   or velocity, the right options are exactly those that give the force; statements are mixed;
//   the size of a force is I·L·B·sin θ (or its ratio); a coil turns the way of its torque r × F;
//   in "find the error" the wrong step is the one that changes the force,
// - the check: every kind of every objective gives four options with exactly one right,
// - and no text or drawing contains undefined, NaN and the like.
'use strict';

const Lang = require('../lang.js');
const M = require('../generator.js');
const X = require('../exercises.js');
const C = require('../check-src.js');
const P = require('../plot.js');

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
// field lines in the page: around a wire ⊙ anticlockwise and closed; inside a loop or a solenoid
// whose top conductors are ⊙, along +x (below a current out of the page, the grip rule gives +x)
{
  const wire = [{ x: 0, y: 0, s: 1 }], b = M.planeField(wire, 1, 0);
  if (!(b[1] > 0 && Math.abs(b[0]) < 1e-9)) fail('the field of a wire in the page');
  const ln = M.fieldLine(wire, 0, 1, [-5, 5, -5, 5]);
  if (!ln.closed || ln.pts.some((p) => Math.abs(Math.hypot(p[0], p[1]) - 1) > 1e-3)) fail('the field line of a wire is not a closed circle');
  const loop = [{ x: 0, y: 0.85, s: 1 }, { x: 0, y: -0.85, s: -1 }], c = M.planeField(loop, 0, 0);
  if (!(c[0] > 0 && Math.abs(c[1]) < 1e-9)) fail('the field in the middle of a loop');
  const sol = [-1, 0, 1].flatMap((x) => [{ x, y: 0.7, s: 1 }, { x, y: -0.7, s: -1 }]), d = M.planeField(sol, 0.3, 0.2);
  if (!(d[0] > 0 && Math.abs(d[1]) < 0.3 * d[0])) fail('the field inside a solenoid');
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
      if (type.startsWith('lines-') && e.questions[0].options.find((o) => o.ok).html !== P.linesFig({ ...e.p, wrong: null, small: true })) fail(`${tag}: the right drawing is not the right field lines`);
      if (type === 'size-num') {
        const { I, cm, B, ang } = e.p, right = Number(e.questions[0].options.find((o) => o.ok).label.split(' ')[0]);
        if (!near(right, I * (cm / 100) * B * Math.sin((ang * Math.PI) / 180), 0.01)) fail(`${tag}: F = I·L·B·sin θ`);
      }
      if (type === 'coil') {
        // torque about the axis: r × F for side 1 (the other side adds the same)
        const { s: cur, bx, phi } = e.p, r = [Math.cos((phi * Math.PI) / 180), Math.sin((phi * Math.PI) / 180), 0], f = M.cross([0, 0, cur], [bx, 0, 0]), tz = M.cross(r, f)[2];
        const right = e.questions[1].options.find((o) => o.ok).label;
        const want = Math.abs(tz) < 1e-9 ? 'It does not turn.' : tz > 0 ? 'It turns anticlockwise.' : 'It turns clockwise.';
        if (right !== want) fail(`${tag}: the coil turns ${right}, torque ${tz}`);
      }
      if (type.startsWith('error-')) {
        const { q, v, B, bad: step } = e.p, Ftrue = M.force(q, v.split(',').map(Number), B.split(',').map(Number));
        if (!e.questions[0].options[step].ok) fail(`${tag}: the wrong step is not the right answer`);
        if (e.text.includes(`: it points ${X.dirName(Ftrue)}.`)) fail(`${tag}: the student's answer is right`);
      }
    }
  }
}
// the check: every kind of every objective, both languages
let asked = 0;
for (const lang of ['en', 'de']) {
  Lang.set(lang, true);
  for (const o of C.objectives) {
    if (!o.kinds.length || !o.name() || o.tutor == null || o.topic == null) fail(`check: objective ${o.id} incomplete`);
    for (const kind of o.kinds) {
      for (let seed = 1; seed <= SEEDS; seed++) {
        const q = C.question(kind, seed), tag = `check ${kind} ${seed} ${lang}`;
        asked++;
        if (q.options.length !== 4 || q.options.filter((x) => x.correct).length !== 1) fail(`${tag}: not four options with one right`);
        if (new Set(q.options.map((x) => x.html)).size !== 4) fail(`${tag}: two options alike`);
        if (q.options.some((x) => !x.correct && !x.why)) fail(`${tag}: a wrong option without a reason`);
        if (bad([q.title, q.text, q.figure, q.ask, ...q.options.map((x) => x.html + x.why), q.explain()].join(' '))) fail(`${tag}: undefined or NaN`);
      }
    }
  }
}
if (!several) fail('no exercise with several fitting directions');
console.log(`${X.TYPES.length} types × ${SEEDS} seeds in both languages, ${several} with several fitting directions; ${C.objectives.length} objectives, ${asked} check questions`);
if (failures) { console.error(`${failures} failures`); process.exit(1); }
console.log('all checks passed');
