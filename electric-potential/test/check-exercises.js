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

// signed number options: as many positive as negative ones (the sign must not give the answer away)
function checkSigns(tag, q) {
  const labs = q.options.map((o) => String(o.label || '')), pos = labs.filter((x) => /^\+\d/.test(x)).length, neg = labs.filter((x) => /^[−-]\d/.test(x)).length;
  if (pos + neg >= 3 && pos !== neg) fail(`${tag} ${q.key}: ${pos} positive and ${neg} negative options`);
}
function checkQuestions(tag, e) {
  for (const q of e.questions) {
    if (q.type === 'multi') {
      if (!q.statements.some((s) => s.ok) || !q.statements.some((s) => !s.ok)) fail(`${tag}: statements all of one kind`);
      if (q.statements.some((s) => !s.why)) fail(`${tag}: a statement without a reason`);
      continue;
    }
    checkSigns(tag, q);
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
        // independently: r_min = k·q·Q/E_kin; the mass does not matter
        const z = { p: 1, d: 1, a: 2 }, k = (z[e.p.pb] / z[e.p.pa]) * e.p.fZ / e.p.fE;
        if (right(e, 'r').label !== X.frac(k)) fail(`${tag}: the closest approach ${right(e, 'r').label}, not ${X.frac(k)}`);
        if (right(e, 'U').label !== X.frac(e.p.fE)) fail(`${tag}: the potential energy at the closest point`);
      }
      if (type === 'repel') {
        // independently: V = k·Q/R, E_kin = |q|·V, v = √(2·E_kin/m)
        const z = { p: 1, d: 1, a: 2 }, m = { p: 1, d: 2, a: 4 }, fV = e.p.fQ / e.p.fR, fE = fV * z[e.p.pb] / z[e.p.pa], fv2 = fE / (m[e.p.pb] / m[e.p.pa]);
        if (right(e, 'V').label !== X.frac(fV) || right(e, 'E').label !== X.frac(fE)) fail(`${tag}: the potential or the energy`);
        const lab = right(e, 'v').label, v = lab.includes('√') ? (lab.includes('1/') ? 1 / Math.sqrt(Number(lab.split('√')[1])) : Math.sqrt(Number(lab.split('√')[1]))) : (lab.includes('1/') ? 1 / Number(lab.split('1/')[1]) : Number(lab.slice(1)));
        if (!rel(v * v, fv2, 1e-6)) fail(`${tag}: the speed ${lab}`);
      }
      if (type === 'point-v') {
        // independently: V = k·Q/r in units of V₀ = k·q/r
        const { sQ, k, m, s2 } = e.p, VP = sQ + m / s2, lab = right(e, 'P').label.replace('−', '-').replace('·', '').replace('V₀', '');
        const [n, d] = (/^[+-]$/.test(lab) ? lab + '1' : lab).split('/').map(Number), got = d ? n / d : n;
        if (!rel(got, VP, 1e-9)) fail(`${tag}: the potential at P ${right(e, 'P').label}, not ${VP}`);
        if (right(e, 'V').label !== X.frac(1 / k)) fail(`${tag}: the factor for B`);
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
