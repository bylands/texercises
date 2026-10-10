// Verifies Charged Particles in Fields: run with `node charged-particles/test/check-exercises.js`.
// It checks
// - the physics, worked out independently: the hand rules (F = q·v × B against a table of
//   right-hand cases); the paths keep their speed and run on circles of radius m·v/(q·B), turning
//   clockwise for a positive charge in a field out of the page,
// - for every type, in both languages and many seeds: each question has at least one right
//   option (exactly one unless several may fit), each wrong option a reason; statements are mixed;
//   the right values: E_kin = |q|·U, the factors of r = m·v/(q·B), v = E/B, the edge the moving
//   charges of the Hall effect are pushed to; no text or drawing contains undefined, NaN and the like,
// - the check (app.js, check.js): every kind of every objective gives a question of four options,
//   exactly one right, each wrong one with a reason.
'use strict';

const fs = require('fs');
const path = require('path');
const Lang = require('../lang.js');
const M = require('../generator.js');
const X = require('../exercises.js');
const Check = require('../check.js');

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
const right = (e, key) => e.questions.find((q) => q.key === key).options.find((o) => o.ok).label;
// '2.5 · 10<sup>5</sup> m/s' or '120 keV' as a number (with the factor of its unit)
const PRE = { k: 1e3, M: 1e6 };
function valueOf(label) {
  const [num, exp] = label.replace(/−/g, '-').split(' · 10<sup>'), unit = (exp ? exp.split('</sup> ')[1] : num.split(' ')[1]) || '';
  return Number(num.split(' ')[0]) * (exp ? 10 ** Number(exp.split('</sup>')[0]) : 1) * (PRE[unit[0]] && unit.length > 1 && unit !== 'm/s' ? PRE[unit[0]] : 1);
}
const factorOf = (label) => { const t = label.replace('×', ''); return t.startsWith('1/') ? 1 / Number(t.slice(2).replace('√', '')) ** (t.includes('√') ? 0.5 : 1) : Number(t.replace('√', '')) ** (t.includes('√') ? 0.5 : 1); };
const MQ = { proton: [1, 1], deuteron: [2, 1], triton: [3, 1], alpha: [4, 2], he: [4, 1], c6: [12, 6] };

for (const lang of ['en', 'de']) {
  Lang.set(lang, true);
  for (const type of X.TYPES) {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const e = X.make(type, seed), tag = `${type} ${seed} ${lang}`;
      if (bad(json(e))) fail(`${tag}: undefined or NaN`);
      if (!e.hints.length || !e.solution.length) fail(`${tag}: no hints or solution`);
      checkQuestions(tag, e);
      if (lang === 'de') continue;
      if (type === 'accel') {
        const z = e.p.pt === 'a' ? 2 : 1;
        if (!near(valueOf(right(e, 'E')), z * e.p.U, 0.01)) fail(`${tag}: E_kin = |q|·U`);
        if (!near(valueOf(right(e, 'J')), z * e.p.U * 1.602e-19, 0.01)) fail(`${tag}: the energy in joules`);
      }
      if (type === 'radius-compare') {
        const [ma, qa] = MQ[e.p.a], [mb, qb] = MQ[e.p.b], k = (mb / qb) / (ma / qa);
        const fr = (label) => (/the same/.test(label) ? 1 : /^1\//.test(label) ? 1 / Number(label.slice(2).split(' ')[0]) : Number(label.split(' ')[0]));
        if (!near(fr(right(e, 'r')), k, 0.01) || !near(fr(right(e, 'T')), k, 0.01)) fail(`${tag}: r and T go with m/q`);
        if (!near(fr(right(e, 'c')), e.p.change === 'v' ? 2 : 0.5, 1e-3)) fail(`${tag}: r goes with v/B`);
        if (fr(right(e, 'p')) !== 1) fail(`${tag}: the period does not depend on the speed`);
      }
      if (type === 'accel-compare') {
        const C = { p: [1, 1], a: [2, 4], d: [1, 2], he: [1, 4], c: [6, 12] }, [qa, ma] = C[e.p.a], [qb, mb] = C[e.p.b];
        if (!near(factorOf(right(e, 'E')), qb / qa, 1e-3)) fail(`${tag}: E_kin ∝ q`);
        if (!near(factorOf(right(e, 'v')), Math.sqrt((qb / mb) / (qa / ma)), 1e-3)) fail(`${tag}: v ∝ √(q/m)`);
      }
      if (type === 'selector' && !near(valueOf(right(e, 'v')), e.p.E / e.p.B, 0.01)) fail(`${tag}: v = E/B`);
      if (type === 'hall') {
        // the moving charges (electrons against the current, holes along it) and the left or right hand
        const { I, bz, holes } = e.p, F = M.force(holes ? 1 : -1, [holes ? I : -I, 0, 0], [0, 0, bz]);
        const negUp = holes ? F[1] < 0 : F[1] > 0, r = right(e, 'edge');
        if (!/upper|lower/.test(r) || /upper/.test(r) !== (e.p.askPos ? !negUp : negUp)) fail(`${tag}: the ${e.p.askPos ? 'positive' : 'negative'} edge`);
        // U_H = v·B·d with v ∝ I: the factor marked right is the one asked
        const fq = e.questions.find((x) => x.key === 'u'), ask = fq.label, fB = /three times as strong/.test(ask) ? 3 : /half as strong/.test(ask) ? 0.5 : /field twice as strong/.test(ask) ? 2 : 1, fI = /twice the current/.test(ask) ? 2 : 1;
        if (fq.options.length !== 4 || fq.options.filter((o) => o.ok).length !== 1 || !near(fq.options.find((o) => o.ok).x, fB * fI, 1e-9)) fail(`${tag}: the Hall voltage factor`);
      }
    }
  }
}

// the stage "Hall voltage": at least 12 exercises that read differently, no raw $ or _ in the texts
for (const lang of ['en', 'de']) {
  Lang.set(lang, true);
  const seen = new Set();
  for (let seed = 1; seed <= 300; seed++) {
    const e = X.make('hall', seed), t = e.text + e.questions.map((q) => q.label + ':' + q.options.map((o) => o.label).sort().join(',')).join('|');
    seen.add(t);
    if (/[$_]/.test((t + e.solution.join('')).replace(/<[^>]*>/g, ''))) fail(`hall ${seed} ${lang}: a raw $ or _`);
  }
  if (seen.size < 12) fail(`hall ${lang}: only ${seen.size} different exercises`);
}

// ---------------------------------------------------------------- the check
// The objectives live in app.js (browser code): their kinds are read from its text.
const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const objectives = [...app.matchAll(/\{ id: '([a-z]+)', kinds: \[([^\]]*)\], tutor: (\d+), topic: (\d+),/g)].map((g) => ({ id: g[1], kinds: g[2].split(',').map((k) => k.trim().replace(/'/g, '')), tutor: Number(g[3]), topic: Number(g[4]) }));
const lessons = (app.match(/\{ topic: \d+, stage: \d+, name:/g) || []).length, topics = (app.slice(app.indexOf('const TOPICS = [')).match(/^ {4}\{ name: /gm) || []).length;
if (objectives.length !== 4) fail(`${objectives.length} objectives found in app.js`);
const concept = Object.fromEntries([...app.slice(app.indexOf('const CONCEPT = {'), app.indexOf('};', app.indexOf('const CONCEPT = {'))).matchAll(/([a-z]+): '([a-z]+)'/g)].map((g) => [g[1], g[2]]));
const ideas = new Set([...app.slice(app.indexOf('concepts: () => ({'), app.indexOf('}),', app.indexOf('concepts: () => ({'))).matchAll(/([a-z]+): L\(/g)].map((g) => g[1]));
let asked = 0;
for (const lang of ['en', 'de']) {
  Lang.set(lang, true);
  for (const o of objectives) {
    if (o.tutor >= lessons || o.topic >= topics) fail(`${o.id}: no such worked example or topic`);
    for (const kind of o.kinds) {
      const [type, key] = kind.split(':');
      if (!X.TYPES.includes(type)) { fail(`${o.id}: no type ${type}`); continue; }
      for (let seed = 1; seed <= 60; seed++) {
        const e = X.make(type, seed), q = key ? e.questions.find((x) => x.key === key) : e.questions[seed % e.questions.length], tag = `check ${o.id} ${kind} ${seed} ${lang}`;
        if (!q || q.type === 'multi') { fail(`${tag}: no question`); continue; }
        asked++;
        if (q.options.length !== 4) fail(`${tag}: ${q.options.length} options`);
        if (q.options.filter((x) => x.ok).length !== 1) fail(`${tag}: not exactly one right option`);
        if (q.options.some((x) => !x.ok && !x.why)) fail(`${tag}: a wrong option without a reason`);
        for (const x of q.options) if (!x.ok && x.tag && x.tag !== 'other' && !(concept[x.tag] && ideas.has(concept[x.tag]))) fail(`${tag}: the flag ${x.tag} names no idea`);
      }
    }
  }
}
// a plan of the check: perObjective questions on each objective
{
  let s = 7;
  const rand = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const plan = Check.plan(objectives, rand);
  if (plan.length !== objectives.length * Check.perObjective(objectives.length)) fail('the plan of the check');
}
console.log(`${X.TYPES.length} types × ${SEEDS} seeds in both languages; check: ${objectives.length} objectives (${objectives.map((o) => o.id).join(', ')}), ${asked} questions asked, ${Check.perObjective(objectives.length)} per objective`);
if (failures) { console.error(`${failures} failures`); process.exit(1); }
console.log('all checks passed');
