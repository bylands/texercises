// Verifies Electric Potential: run with `node electric-potential/test/check-exercises.js`. It checks
// - the physics, independently: in a uniform field ΔV = −E·Δx (only the distance along the field
//   counts); the field and potential at the centre of each arrangement (fields add as vectors,
//   potentials as numbers); the speed after an acceleration voltage, v = √(2·|q|·U/m); the
//   closest approach k·q·Q/E_kin; a particle released at rest moves the way its sign says,
// - for every type, in both languages and many seeds: each question has a right option (exactly one
//   unless several may fit), a reason for each wrong one, distinct options; statements are mixed,
// - every problem, and no text or drawing contains undefined, NaN and the like.
'use strict';

const Lang = require('../lang.js');
const C = require('../../electric-field/charges.js');
const E = require('../../electric-field/elec.js');
const X = require('../exercises.js');
const R = require('../realproblems.js');
const F = require('../figures.js');

let failures = 0;
const fail = (msg) => { failures++; if (failures < 30) console.error('  FAIL ' + msg); };
const bad = (html) => /undefined|NaN|\[object|Infinity|[(=:]null\b/.test(html);
const json = (e) => JSON.stringify(e, (k, v) => (typeof v === 'function' ? undefined : v));
const rel = (a, b, tol) => Math.abs(a - b) <= tol * Math.max(Math.abs(a), Math.abs(b), 1e-30);
const SEEDS = 60;
const num = (label) => { const t = label.replace(/−/g, '-').replace('+', ''); const m = t.match(/^(-?[\d.]+)(?: · 10<sup>(-?\d+)<\/sup>)?/); return m ? Number(m[1]) * (m[2] ? 10 ** Number(m[2]) : 1) : NaN; };
const right = (e, key) => { const q = e.questions.find((x) => x.key === key); return q.options.find((o) => o.ok); };

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
for (const lang of ['en', 'de']) {
  Lang.set(lang, true);
  for (const type of X.TYPES) {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const e = X.make(type, seed), tag = `${type} ${seed} ${lang}`;
      if (bad(json(e))) fail(`${tag}: undefined or NaN`);
      if (!e.hints.length || !e.solution.length) fail(`${tag}: no hints or solution`);
      checkQuestions(tag, e);
      if (lang === 'de') continue;
      if (type === 'uniform-d') {
        const { Ef, ax, bx } = e.p, want = -Ef * (bx - ax) / 100;
        if (!rel(num(right(e, 'U').label), want, 1e-3)) fail(`${tag}: V_B − V_A is not −E·Δx`);
      }
      if (type === 'scalar') {
        const S = X.SC.find((s) => s.id === e.p.S), ch = S.c.map(([q, x, y]) => ({ q, x: e.p.flip ? y : x, y: e.p.flip ? -x : y })), c = { kind: 'points', charges: ch };
        const V = C.potential(c, 0, 0), Ef = C.field(c, 0, 0), zeroE = Math.hypot(...Ef) < 1e-9;
        const wantV = Math.abs(V) < 1e-9 ? 'zero' : V > 0 ? 'positive' : 'negative';
        if (right(e, 'V').label !== wantV) fail(`${tag}: the potential at the centre`);
        if (zeroE !== right(e, 'E').html.includes('nowhere')) fail(`${tag}: the field at the centre`);
      }
      if (type === 'accel') {
        const pt = Object.values(E.NAMED).flat().find((x) => x[0] === e.p.pt), v = Math.sqrt((2 * Math.abs(pt[3]) * E.K.e * e.p.U) / pt[4]);
        if (!rel(num(right(e, 'v').label), v, 0.01)) fail(`${tag}: the speed`);
      }
      if (type === 'closest') {
        const rmin = (E.K.k * 2 * e.p.Z * E.K.e) / (e.p.Ek * 1e6);
        const lab = right(e, 'r').label, f = { m: 1, cm: 1e-2, mm: 1e-3, 'µm': 1e-6, nm: 1e-9, pm: 1e-12, fm: 1e-15 }[lab.split(' ')[1]];
        if (!rel(num(lab) * f, rmin, 0.01)) fail(`${tag}: the closest approach`);
      }
      if (type === 'which-way') {
        const { q, Vl, Vr } = e.p, toRight = q > 0 ? Vl > Vr : q < 0 ? Vr > Vl : null, html = right(e, 'm').html;
        const want = toRight === null ? 'it stays' : toRight ? 'to the right' : 'to the left';
        if (!html.includes(want)) fail(`${tag}: the particle moves the wrong way`);
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
