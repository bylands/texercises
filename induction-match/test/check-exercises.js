// Verifies the exercises with texts (exercises.js) and the pictures (figures.js): run with
// `node induction-match/test/check-exercises.js`. For many seeds of every type, in both languages,
// it checks that
// - every question has exactly one right option (graphs or values), distinct options, and a reason
//   for each wrong one; statements are a mix of right and wrong, each with a reason; a drawing's
//   target lies on its axis and on whole values,
// - the physics holds, worked out independently: a voltage read off is −dΦ/dt (numerically); a
//   change of the flux is Φ(b) − Φ(a); the flux through the moving loop is B times the overlap of
//   loop and field, and its voltage −dΦ/dt; Lenz's rule (an approaching pole is repeated on the
//   ring, a retreating one reversed; the induced field opposes an increase, supports a decrease;
//   a loop moved in a field stronger on one side: the sign of dΦ/dt from the field, the right-hand
//   rule and the force against the motion), with the check's four answers for it,
// - the Lenz tutor figures show the induced poles and the current, consistent with the scenario,
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
        const { into, how } = e.p, indInto = how === 'up' || how === 'in' ? !into : into, right = (k) => e.questions.find((q) => q.key === k).options.find((o) => o.ok).label;
        if (right('ind') !== (indInto ? 'Into the page' : 'Out of the page')) fail(`${tag}: the induced field`);
        if (right('dir') !== (indInto ? 'clockwise' : 'anticlockwise')) fail(`${tag}: the direction of the current`);
      }
    }
  }
}
// A loop moved in a field stronger on one side, worked out independently: a field B(x, y) that
// grows towards the strong side (y downwards, as in the figure), the flux through the moved loop
// and its sign of change; the induced field against an increase, along a decrease; anticlockwise
// (as seen) goes with an induced field out of the page; the force opposes the motion. Every
// question has exactly one right option, and the wrong ones carry their own reason.
Lang.set('en', true);
{
  const GRAD = { left: [-1, 0], right: [1, 0], top: [0, -1], bottom: [0, 1] }, STEP = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
  const counts = {};
  for (let seed = 1; seed <= 400; seed++) {
    const e = X.make('lenz-gradient', seed), tag = `lenz-gradient ${seed}`, { into, strong, move } = e.p;
    const B = (x, y) => 1 + 0.1 * (GRAD[strong][0] * x + GRAD[strong][1] * y); // size of the field
    const fluxAt = (cx, cy) => { let s = 0; for (let i = 0; i < 10; i++) for (let j = 0; j < 10; j++) s += B(cx - 0.45 + 0.1 * i, cy - 0.45 + 0.1 * j); return s / 100; };
    const dPhi = fluxAt(0.01 * STEP[move][0], 0.01 * STEP[move][1]) - fluxAt(0, 0);
    const change = Math.abs(dPhi) < 1e-9 ? 0 : Math.sign(dPhi);
    const indInto = change > 0 ? !into : into;
    const want = change === 0 ? 'not at all' : indInto ? 'clockwise' : 'anticlockwise';
    // the force opposes the motion: back towards where the field is as strong as before
    const wantF = change === 0 ? 'nowhere: there is no force' : change > 0 ? 'towards the weaker field' : 'towards the stronger field';
    const right = (k) => e.questions.find((q) => q.key === k).options.filter((o) => o.ok).map((o) => o.label);
    if (right('dir').length !== 1 || right('dir')[0] !== want) fail(`${tag}: the current ${right('dir')} (want ${want})`);
    if (right('force').length !== 1 || right('force')[0] !== wantF) fail(`${tag}: the force ${right('force')} (want ${wantF})`);
    for (const q of e.questions) if (q.options.some((o) => !o.ok && !o.why)) fail(`${tag}: a wrong option without its reason`);
    counts[change] = (counts[change] || 0) + 1;
    const pic = F.gradient(e.p);
    if (bad(pic)) fail(`${tag}: the picture does not render`);
    // the marks are bigger on the strong side: compare the first and the last along the gradient
    const sizes = [...pic.matchAll(into ? /stroke-width:([\d.]+)/g : /<circle class="tb-line-fill" cx="[\d.]+" cy="[\d.]+" r="([\d.]+)"/g)].map((m) => Number(m[1]));
    const first = sizes[0], last = sizes[sizes.length - 1], growsAlong = strong === 'right' || strong === 'bottom';
    if (!(growsAlong ? last > first : first > last)) fail(`${tag}: the marks do not grow towards the strong side`);
  }
  if (!(counts[1] > 20 && counts[-1] > 20 && counts[0] > 10)) fail(`lenz-gradient: not every case comes up (${JSON.stringify(counts)})`);
}

// The figures of the Lenz tutor: the ring's induced poles (the side facing the magnet repeats an
// approaching pole, reverses a retreating one, the far side the other pole) and the current (seen
// from the magnet anticlockwise for a north pole facing it: up the near half, which is drawn on the
// right); the loop in a growing field: the induced field against it, anticlockwise for out of the page.
for (const lang of ['en', 'de']) {
  Lang.set(lang, true);
  for (const pole of ['N', 'S']) {
    for (const move of ['toward', 'away']) {
      const face = move === 'toward' ? pole : pole === 'N' ? 'S' : 'N', other = face === 'N' ? 'S' : 'N', tag = `magnet ${pole} ${move} ${lang}`;
      for (const show of ['poles', 'current']) {
        const pic = F.magnet({ pole, move, show });
        if (bad(pic)) fail(`${tag}: the picture does not render`);
        if (!pic.includes(`data-side="magnet" data-pole="${face}"`) || !pic.includes(`data-side="far" data-pole="${other}"`)) fail(`${tag} ${show}: the induced poles`);
        if ((show === 'current') !== pic.includes('ind-sense')) fail(`${tag} ${show}: the current shown when it should not, or not shown`);
      }
      const pic = F.magnet({ pole, move, show: 'current' }), sense = face === 'N' ? 'acw' : 'cw';
      if (!pic.includes(`data-sense="${sense}" data-face="${face}"`)) fail(`${tag}: the sense of the current`);
      // the first arrowhead (on the near half of the ring, x = 312): its tip above its base for anticlockwise
      const pts = pic.match(/<polygon class="ind-current" points="([^"]+)"/)[1].split(' ').map((p) => p.split(',').map(Number));
      const up = pts[0][1] < pts[1][1];
      if (Math.abs(pts[0][0] - 312) > 1e-6 || up !== (sense === 'acw')) fail(`${tag}: the arrow on the ring`);
    }
  }
  if (F.magnet({ pole: 'N', move: 'toward' }).includes('ind-pole')) fail('the practice figure gives the poles away');
  for (const into of [true, false]) {
    for (const how of ['up', 'down', 'in', 'out']) {
      const pic = F.field({ into, how, show: 'current' }), indInto = how === 'up' || how === 'in' ? !into : into;
      if (!pic.includes(`data-sense="${indInto ? 'cw' : 'acw'}"`) || !pic.includes(indInto ? 'ind-bx' : 'ind-bdot')) fail(`field ${into} ${how} ${lang}: the induced current or field`);
      if (F.field({ into, how }).includes('ind-sense')) fail(`field ${into} ${how}: the practice figure gives the current away`);
    }
  }
}
Lang.set('en', true);
// The tutor (app.js) shows the poles where they are explained and the current where it is.
{
  const src = require('fs').readFileSync(require('path').join(__dirname, '..', 'app.js'), 'utf8');
  const lesson = src.slice(src.indexOf('function lenzLesson'), src.indexOf('// ---', src.indexOf('function lenzLesson')));
  const shows = [...lesson.matchAll(/figure: .*/g)].map((m) => [...m[0].matchAll(/show: '(\w+)'/g)].map((x) => x[1]).join('+'));
  if (shows.join(' | ') !== 'poles | poles | current+current | current') fail(`the Lenz tutor figures: ${shows.join(' | ')}`);
}

// The check's Lenz questions for the field stronger on one side (app.js, lenzQuestion): four
// answers, exactly one right, and the right one the pair of the practice exercise.
{
  const vm = require('vm'), src = require('fs').readFileSync(require('path').join(__dirname, '..', 'app.js'), 'utf8');
  const start = src.indexOf('function lenzQuestion'), open = src.indexOf('{', start);
  let depth = 0, end = open;
  for (; end < src.length; end++) { if (src[end] === '{') depth++; else if (src[end] === '}' && --depth === 0) break; }
  const lenzQuestion = vm.runInNewContext(`(${src.slice(start, end + 1)})`, { I, X, L: (en, de) => Lang.L(en, de) });
  for (const lang of ['en', 'de']) {
    Lang.set(lang, true);
    for (let seed = 1; seed <= 200; seed++) {
      const e = X.make('lenz-gradient', seed), q = lenzQuestion(e, seed), tag = `check lenz-gradient ${seed} ${lang}`;
      if (q.list.length !== 4 || q.list.filter((o) => o.correct).length !== 1) fail(`${tag}: not four answers with one right`);
      if (new Set(q.list.map((o) => o.html)).size !== 4) fail(`${tag}: two answers alike`);
      if (q.list.some((o) => !o.correct && !o.flag) || bad(q.ask + q.list.map((o) => o.html + o.why).join(" "))) fail(`${tag}: an answer without its idea, or undefined`);
      const right = q.list.find((o) => o.correct).html, ans = (k) => e.questions.find((x) => x.key === k).options.find((o) => o.ok).label;
      if (ans('dir') === Lang.L('not at all', 'gar nicht') ? !/no current|kein Strom/i.test(right) : !(right.includes(ans('dir')) && right.includes(ans('force')))) fail(`${tag}: the right answer is not the exercise's`);
    }
  }
  Lang.set('en', true);
}

// Lenz's rule: each practice stage has at least 10 distinct exercises (by their text), and every
// variant (who moves, how the flux changes) comes up, in both languages, with clean text.
for (const [type, key, want] of [['lenz-magnet', (p) => `${p.move}/${p.who}`, 6], ['lenz-field', (p) => p.how, 6], ['lenz-gradient', (p) => `${p.into}/${p.strong}/${p.move}`, 24]]) {
  for (const lang of ['en', 'de']) {
    Lang.set(lang, true);
    const texts = new Set(), seen = new Set();
    for (let seed = 1; seed <= 300; seed++) {
      const e = X.make(type, seed), tag = `${type} ${seed} ${lang}`;
      texts.add(e.text + e.questions.map((q) => q.label + q.options.map((o) => o.label).sort().join('|')).join('/'));
      seen.add(key(e.p));
      const words = [e.text, ...e.hints, ...e.solution, ...e.questions.flatMap((q) => [q.label, ...q.options.flatMap((o) => [o.label, o.why])])].join(' ').replace(/<[^>]+>/g, '');
      if (/[$_]/.test(words)) fail(`${tag}: raw $ or _ in the text`);
      if (/\b(the|and|is|of)\b/.test(lang === 'de' ? words : '')) fail(`${tag}: English in the German text`);
    }
    if (texts.size < 10) fail(`${type} ${lang}: only ${texts.size} distinct exercises`);
    if (seen.size < want) fail(`${type} ${lang}: only ${seen.size} variants`);
  }
}
Lang.set('en', true);

console.log(`${X.TYPES.length} types × ${SEEDS} seeds, in both languages`);
if (failures) { console.error(`${failures} failures`); process.exit(1); }
console.log('all checks passed');
