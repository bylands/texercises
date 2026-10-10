// Verifies the exercises with texts (exercises.js) and the pictures (figures.js): run with
// `node induction-match/test/check-exercises.js`. For many seeds of every type, in both languages,
// it checks that
// - every question has exactly one right option (graphs or values), distinct options, and a reason
//   for each wrong one; statements are a mix of right and wrong, each with a reason; a drawing's
//   target lies on its axis and on whole values,
// - the physics holds, worked out independently: a voltage read off is −dΦ/dt (numerically); a
//   change of the flux is Φ(b) − Φ(a); the flux through the moving loop is B times the overlap of
//   loop and field, and its voltage −dΦ/dt; Lenz's rule (an approaching pole is repeated on the
//   ring, a retreating one reversed; the induced field opposes an increase, supports a decrease),
// - no text or drawing contains undefined, NaN or the like, and every picture renders.
'use strict';

const Lang = require('../lang.js');
const I = require('../generator.js');
const X = require('../exercises.js');
const F = require('../figures.js');

let failures = 0;
const fail = (msg) => { failures++; if (failures < 30) console.error('  FAIL ' + msg); };
const bad = (html) => /undefined|NaN|\[object|Infinity|[>(=:"]null\b/.test(html); // not the German “durch null”
const near = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol;
const json = (e) => JSON.stringify(e, (k, v) => (typeof v === 'function' ? undefined : v));
const SEEDS = 150;
const valueOf = (label) => Number(label.replace('−', '-').replace('+', '').split(' ')[0]);

function checkQuestions(tag, e) {
  for (const q of e.questions) {
    if (q.type === 'multi') {
      if (!q.statements.some((s) => s.ok) || !q.statements.some((s) => !s.ok)) fail(`${tag}: statements all of one kind`);
      if (q.statements.some((s) => !s.why)) fail(`${tag}: a statement without a reason`);
      if (new Set(q.statements.map((s) => s.html)).size !== q.statements.length) fail(`${tag}: a statement twice`);
      continue;
    }
    if (q.options.filter((o) => o.ok).length !== 1) fail(`${tag} ${q.key}: not exactly one right option`);
    if (q.options.some((o) => !o.ok && !o.why)) fail(`${tag} ${q.key}: a wrong option without a reason`);
    if (q.type === 'choice' && new Set(q.options.map((o) => o.label)).size !== q.options.length) fail(`${tag} ${q.key}: two options alike`);
  }
}

for (const lang of ['en', 'de']) {
  Lang.set(lang, true);
  for (const type of X.TYPES) {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const e = X.make(type, seed), tag = `${type} ${seed} ${lang}`;
      if (bad(json(e))) fail(`${tag}: undefined or NaN in the exercise`);
      if (e.pic && bad(F[e.pic[0]](e.pic[1]))) fail(`${tag}: the picture does not render`);
      if (!e.hints.length || !e.solution.length) fail(`${tag}: no hints or solution`);
      checkQuestions(tag, e);
      if (lang === 'de') continue;
      const g = e.g, Phi = g && ((t) => I.flux(g, Math.min(t, I.T - 1e-9)));
      if (type.startsWith('value-v')) {
        for (const q of e.questions) {
          const t = Number(q.label.match(/= ([\d.]+) s/)[1]), h = 1e-5, d = (Phi(Math.min(t + h, I.T)) - Phi(Math.max(t - h, 0))) / (Math.min(t + h, I.T) - Math.max(t - h, 0));
          if (!near(valueOf(q.options.find((o) => o.ok).label), -d, 0.02)) fail(`${tag}: the voltage at ${t} s is not −dΦ/dt`);
        }
      }
      if (type.startsWith('value-dphi')) {
        const [a, b] = [e.p.a, e.p.b], q1 = e.questions[0], q2 = e.questions[1];
        if (!near(valueOf(q1.options.find((o) => o.ok).label), Phi(b) - Phi(a), 0.01)) fail(`${tag}: the change of the flux is wrong`);
        if (!near(valueOf(q2.options.find((o) => o.ok).label), Phi(I.T), 0.01)) fail(`${tag}: the end value is wrong`);
      }
      if (e.draw) {
        const [lo, hi] = e.draw.kind === 'flux' ? [0, I.PHI_MAX] : [-I.V_MAX, I.V_MAX];
        if (e.draw.target.some((v) => !Number.isInteger(v) || v < lo || v > hi)) fail(`${tag}: a drawing target off the grid`);
        if (e.draw.init.length !== e.draw.at.length || e.draw.target.length !== e.draw.at.length) fail(`${tag}: drawing lengths`);
        e.draw.at.forEach((t, i) => {
          const want = e.draw.kind === 'flux' ? Phi(t) : e.draw.spans ? I.volt(g, t) : I.volt(g, Math.min(t, I.T - 1e-9));
          if (!near(e.draw.target[i], want, 1e-6)) fail(`${tag}: drawing target ${i} is not the graph`);
        });
      }
      if (type.startsWith('loop')) {
        // the flux from the geometry: B · s · (overlap of the loop [front − s, front] with the field [0, w]), in mWb
        const L0 = e.loop, B = L0.B, s = L0.s / 100, w = L0.w / 100, v = L0.v / 100, d = L0.d / 100;
        const geo = (t) => { const front = v * t - d, over = Math.max(0, Math.min(front, w) - Math.max(front - s, 0)); return B * s * over * 1000; };
        for (let t = 0.05; t < I.T; t += 0.1) if (!near(geo(t), I.flux(g, t), 1e-6)) { fail(`${tag}: the flux is not B times the area in the field (t = ${t})`); break; }
        for (let t = 0.05; t < I.T; t += 0.1) {
          const dd = (geo(t + 1e-5) - geo(t - 1e-5)) / 2e-5;
          if (Math.abs(t - L0.t0) > 0.02 && Math.abs(t - L0.t1) > 0.02 && Math.abs(t - L0.t2) > 0.02 && Math.abs(t - L0.t3) > 0.02 && !near(I.volt(g, t), -dd, 1e-4)) { fail(`${tag}: the voltage is not −dΦ/dt`); break; }
        }
        if (type === 'loop-num') {
          const [qa, qb, qc] = e.questions;
          if (!near(valueOf(qa.options.find((o) => o.ok).label), B * s * v * 1000, 1e-6)) fail(`${tag}: B·s·v`);
          if (!near(valueOf(qb.options.find((o) => o.ok).label), B * s * Math.min(s, w) * 1000, 1e-6)) fail(`${tag}: the largest flux`);
          if (!near(valueOf(qc.options.find((o) => o.ok).label), Math.abs(s - w) / v, 1e-6)) fail(`${tag}: the time without voltage`);
        }
      }
      if (type === 'lenz-magnet') {
        const { pole, move } = e.p, right = (k) => e.questions.find((q) => q.key === k).options.find((o) => o.ok).label;
        const face = move === 'still' ? null : move === 'toward' ? pole : pole === 'N' ? 'S' : 'N';
        const want = { face: face === null ? 'neither' : face === 'N' ? 'north' : 'south', force: { toward: 'pushed away', away: 'pulled towards', still: 'neither' }[move], dir: face === null ? 'not at all' : face === 'N' ? 'anticlockwise' : 'clockwise' };
        for (const k of ['face', 'force', 'dir']) if (!right(k).startsWith(want[k]) && !right(k).includes(want[k])) fail(`${tag}: Lenz ${k}: ${right(k)} (want ${want[k]})`);
        if (want.dir === 'clockwise' && right('dir') !== 'clockwise') fail(`${tag}: Lenz direction`);
      }
      if (type === 'lenz-field') {
        const { into, how } = e.p, indInto = how === 'up' ? !into : into, right = (k) => e.questions.find((q) => q.key === k).options.find((o) => o.ok).label;
        if (right('ind') !== (indInto ? 'Into the page' : 'Out of the page')) fail(`${tag}: the induced field`);
        if (right('dir') !== (indInto ? 'clockwise' : 'anticlockwise')) fail(`${tag}: the direction of the current`);
      }
    }
  }
}
console.log(`${X.TYPES.length} types × ${SEEDS} seeds, in both languages`);
if (failures) { console.error(`${failures} failures`); process.exit(1); }
console.log('all checks passed');
