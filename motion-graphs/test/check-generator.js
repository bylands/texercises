// Verifies the motion-graph exercises: run with `node motion-graphs/test/check-generator.js`.
// For many seeds of every task it checks that
// - the five pieces cover 0 … T, last 1–3 s, and 2–3 of them are parabolas in G (sloped in g),
// - g and G are continuous, G' = g (numerically), g and G are whole numbers at the breakpoints,
// - both graphs stay on their axes, every breakpoint is visible and every parabola bends visibly,
// - in a derivative exercise, the slope of every parabola can be read at both ends (readable()),
//   and the reasons given are true (horizontal tangent, smooth join),
// - the correct answer lies on the snapping grid and evaluate() accepts it,
// - typical mistakes are recognised: the mirror image (sign), the average slope of a parabola,
//   the rectangle g(start)·Δt instead of the trapezoid, a parabola drawn straight, a straight piece
//   bent, and a copy of the given graph,
// - both diagrams render,
// - the difficulty fits the task, and every practice level gives its difficulties,
// - the arcade options (quiz()): one right, and every wrong one is judged wrong by evaluate(),
//   with the mistake it stands for.
'use strict';

require('../lang.js');
const M = require('../generator.js');
const P = require('../plot.js');

const SAMPLES = 2000;
let failures = 0;
const fail = (msg) => { failures++; if (failures < 30) console.error('  FAIL ' + msg); };
const whole = (x) => Math.abs(x - Math.round(x)) < 1e-9;
const onGrid = (x, step) => Math.abs(x / step - Math.round(x / step)) < 1e-9;
const codes = (ex, ans) => M.evaluate(ex, ans).map((r) => r.codes);

for (const task of Object.keys(M.TASKS)) {
  const t0 = Date.now();
  const seen = new Set(), found = {};
  let zeros = 0;
  for (let seed = 1; seed <= SAMPLES; seed++) {
    const tag = `${task}-${seed}`;
    const ex = M.generate(task, seed);
    const ps = ex.pieces;
    seen.add(JSON.stringify(ps));

    if (ps.length !== 5 || ps[0].t0 !== 0 || ps[4].t1 !== M.T || ps.some((p, i) => i && p.t0 !== ps[i - 1].t1)) fail(`${tag}: pieces do not cover the time axis`);
    if (ps.some((p) => M.len(p) < 1 || M.len(p) > 3)) fail(`${tag}: piece length`);
    const nSloped = ps.filter(M.sloped).length;
    if (nSloped < 2 || nSloped > 3) fail(`${tag}: ${nSloped} parabolas`);
    ps.forEach((p, i) => {
      if (![p.g0, p.g1, p.G0, p.G1].every(whole)) fail(`${tag}: piece ${i + 1} not whole at the breakpoints`);
      if (i > 0 && Math.abs(p.G0 - ps[i - 1].G1) > 1e-9) fail(`${tag}: G jumps at ${p.t0} s`);
      if (i > 0 && M.rate(p) === M.rate(ps[i - 1])) fail(`${tag}: invisible breakpoint at ${p.t0} s`);
      if (i > 0 && p.g0 !== ps[i - 1].g1) fail(`${tag}: g jumps at ${p.t0} s`);
      if (Math.abs(M.GAt(p, M.len(p) / 2) - p.Gm) > 1e-9) fail(`${tag}: middle of piece ${i + 1}`);
    });

    // G' = g, both on their axes
    const { source, target } = ex.axes;
    const [gAx, GAx] = ex.dir === 'diff' ? [target, source] : [source, target];
    for (let k = 0; k <= 1000; k++) {
      const t = (k * M.T) / 1000, h = 1e-5;
      const G = M.G(ex, t), g = M.g(ex, t);
      if (G < GAx.lo - 1e-9 || G > GAx.hi + 1e-9) { fail(`${tag}: G off the axis at ${t} s`); break; }
      if (g < gAx.lo || g > gAx.hi) { fail(`${tag}: g off the axis at ${t} s`); break; }
      if (t > h && t < M.T - h && !ps.some((p) => Math.abs(p.t0 - t) < 2 * h)) {
        const dG = (M.G(ex, t + h) - M.G(ex, t - h)) / (2 * h);
        if (Math.abs(dG - g) > 1e-4) { fail(`${tag}: G' ≠ g at ${t} s`); break; }
      }
    }
    const span = GAx.hi - GAx.lo;
    for (const p of ps.filter(M.sloped)) {
      if ((Math.abs(p.g1 - p.g0) * M.len(p)) / 8 < M.BEND * span - 1e-9) fail(`${tag}: parabola ${p.t0}–${p.t1} s barely bends`);
      const x = -p.g0 / M.rate(p);
      if (x > 0 && x < M.len(p)) zeros++;
    }

    // derivative: the slopes of the parabolas can be read
    if (ex.dir === 'diff') {
      const how = M.readable(ps);
      if (!how) fail(`${tag}: slopes cannot be read`);
      else how.forEach((h, i) => {
        const p = ps[i];
        if (h.start === 'vertex' && p.g0 !== 0) fail(`${tag}: no horizontal tangent at the start of piece ${i + 1}`);
        if (h.end === 'vertex' && p.g1 !== 0) fail(`${tag}: no horizontal tangent at the end of piece ${i + 1}`);
        if (h.start === 'join' && ps[i - 1].g1 !== p.g0) fail(`${tag}: no smooth join at the start of piece ${i + 1}`);
        if (h.end === 'join' && ps[i + 1].g0 !== p.g1) fail(`${tag}: no smooth join at the end of piece ${i + 1}`);
      });
    }

    // answers
    const step = ex.axes.target.step;
    if (ex.answer.some((a) => !onGrid(a.y0, step) || !onGrid(a.y1, step))) fail(`${tag}: answer off the snapping grid`);
    if (M.evaluate(ex, ex.answer).some((r) => !r.ok)) fail(`${tag}: correct answer rejected`);
    const expect = (ans, i, code, what) => {
      const c = codes(ex, ans)[i];
      if (!c.includes(code)) fail(`${tag}: ${what} in piece ${i + 1} gives ${JSON.stringify(c)}, not ${code}`);
      else found[code] = (found[code] || 0) + 1;
    };
    const mirror = ex.answer.map((a) => ({ y0: -a.y0, ym: -a.ym, y1: -a.y1 }));
    if (ex.dir === 'diff') {
      ps.forEach((p, i) => { if (p.g0 || p.g1) expect(mirror, i, 'sign', 'mirror image'); });
      const average = ex.answer.map((a) => { const m = (a.y0 + a.y1) / 2; return { y0: m, ym: m, y1: m }; });
      ps.forEach((p, i) => { if (M.sloped(p) && onGrid((p.g0 + p.g1) / 2, step)) expect(average, i, 'average', 'average slope'); });
      const tilted = ex.answer.map((a) => ({ y0: a.y0 - 1, ym: a.ym, y1: a.y1 + 1 }));
      ps.forEach((p, i) => { if (!M.sloped(p)) expect(tilted, i, 'notConst', 'sloped line'); });
    } else {
      // mirror of the changes, from the same start
      let y = ex.answer[0].y0;
      const back = ex.answer.map((a) => { const y0 = y; y -= a.y1 - a.y0; return { y0, ym: (y0 + y) / 2 - M.bend(a), y1: y }; });
      ps.forEach((p, i) => { if (M.area(p)) expect(back, i, 'sign', 'changes reversed'); });
      // rectangle g(start)·Δt, drawn straight
      y = ex.answer[0].y0;
      const rect = ps.map((p) => { const y0 = y; y += p.g0 * M.len(p); return { y0, ym: (y0 + y) / 2, y1: y }; });
      ps.forEach((p, i) => {
        if (M.sloped(p) && Math.abs(p.g0 * M.len(p) - M.area(p)) > step && Math.abs(p.g0 * M.len(p) + M.area(p)) > step) expect(rect, i, 'rectStart', 'rectangle');
        if (M.sloped(p)) expect(rect, i, 'curve', 'parabola drawn straight');
      });
      const bent = ex.answer.map((a) => ({ ...a, ym: a.ym + 2 }));
      ps.forEach((p, i) => { if (!M.sloped(p)) expect(bent, i, 'straight', 'straight piece bent'); });
      const other = ex.answer.map((a) => ({ ...a, ym: a.ym - 2 * M.bend(a) }));
      ps.forEach((p, i) => { if (M.sloped(p)) expect(other, i, 'bendDir', 'bent the wrong way'); });
    }
    // a copy of the given graph, scaled to the other axis
    const { lo: sl, hi: sh } = ex.axes.source, { lo: tl, hi: th } = ex.axes.target;
    const map = (v) => Math.round((tl + ((v - sl) / (sh - sl)) * (th - tl)) / step) * step;
    const copy = ex.source.map((s) => ({ y0: map(s.y0), ym: map(s.ym), y1: map(s.y1) }));
    if (M.evaluate(ex, copy).some((r) => !r.ok)) {
      if (!M.copied(ex, copy)) fail(`${tag}: copy not recognised`);
      else found.copy = (found.copy || 0) + 1;
    }
    if (M.copied(ex, ex.answer)) fail(`${tag}: correct answer taken for a copy`);

    // diagrams
    for (const s of [P.sourceGraph(ex), P.targetGraph(ex, ex.answer, { solution: true, marks: ps.map(() => 'ok'), active: ex.dir === 'diff' ? 'n1' : 'm1' })]) {
      if (/NaN|undefined/.test(s)) fail(`${tag}: diagram`);
    }
  }
  console.log(`${task}: ${SAMPLES} seeds, ${seen.size} distinct, ${(zeros / SAMPLES).toFixed(2)} turning points per graph, ${Date.now() - t0} ms`);
  console.log(`  mistakes recognised: ${JSON.stringify(found)}`);
}

const RANGE = { diff: [3, 4], int: [3, 4, 5] };
for (const task of Object.keys(M.TASKS)) {
  for (let seed = 1; seed <= 300; seed++) {
    const ex = M.generate(task, seed);
    if (!RANGE[ex.dir].includes(ex.difficulty)) fail(`${task}-${seed}: difficulty ${ex.difficulty}`);
  }
}
for (const [level, ds] of Object.entries(M.LEVELS)) {
  const seen = {};
  for (let seed = 1; seed <= 200; seed++) {
    const ex = M.generate(level, seed);
    if (!ds.includes(ex.difficulty)) fail(`${level}-${seed}: difficulty ${ex.difficulty}`);
    if (ex.id !== `${level}-${seed}`) fail(`${level}-${seed}: id ${ex.id}`);
    seen[ex.difficulty] = (seen[ex.difficulty] || 0) + 1;
  }
  if (Object.keys(seen).length !== ds.length) fail(`${level}: difficulties ${JSON.stringify(seen)}`);
  console.log(`${level}: ${JSON.stringify(seen)}`);
}
const CODE = { sign: 'sign', average: 'average', rectStart: 'rectStart', curve: 'curve' };
for (let d = 1; d <= 5; d++) {
  let none = 0;
  for (let seed = 1; seed <= 200; seed++) {
    const ex = M.ofDifficulty(d, seed), tag = `quiz ${d}/${seed}`;
    if (ex.kind) continue; // a quiz exercise (concepts.js), checked below
    const q = M.quiz(ex, seed);
    if (ex.difficulty !== d) fail(`${tag}: difficulty ${ex.difficulty}`);
    if (!q) { none++; continue; }
    if (q.options.length !== 4 || q.options.filter((o) => o.correct).length !== 1) fail(`${tag}: options`);
    for (const o of q.options) {
      const res = M.evaluate(ex, o.vals);
      if (!!o.correct !== res.every((r) => r.ok)) fail(`${tag}: option ${o.flag} judged ${res.every((r) => r.ok) ? 'right' : 'wrong'}`);
      if (CODE[o.flag] && !res.some((r) => r.codes.includes(CODE[o.flag]))) fail(`${tag}: option ${o.flag} not recognised: ${JSON.stringify(res.map((r) => r.codes))}`);
      if (o.vals.some((v) => [v.y0, v.ym, v.y1].some((y) => y < o.axis.lo - 1e-9 || y > o.axis.hi + 1e-9))) fail(`${tag}: option ${o.flag} off its axis`);
      if (/NaN|undefined/.test(P.answerGraph(ex, { vals: o.vals, axis: o.axis }))) fail(`${tag}: option diagram`);
    }
  }
  console.log(`quiz, difficulty ${d}: ${none} of 200 seeds give options that look alike`);
}

// ---------------------------------------------------------------- the quiz exercises (concepts.js)
// For every kind and difficulty: one right option per choice, distinct options, an explanation for
// every wrong one, traps different from the answer, numbers in steps of 0.05, and answers that
// agree with the motion behind the exercise (data), worked out again here; four valid arcade
// options; the same in German, without ß.
const C = require('../concepts.js');
const Lang = require('../lang.js');
const near = (a, b) => Math.abs(a - b) < 1e-6;
const nice = (x) => near(Math.round(x * 20), x * 20);
for (const lang of ['en', 'de']) {
  Lang.set(lang, true);
  for (const kind of C.KINDS) {
    for (const d of C.DIFF[kind]) {
      for (let seed = 1; seed <= 300; seed++) {
        const tag = `${lang} ${kind}/${d}/${seed}`;
        let ex;
        try { ex = C.make(kind, seed, d); } catch (e) { fail(`${tag}: ${e.message}`); continue; }
        if (ex.difficulty !== d) fail(`${tag}: difficulty ${ex.difficulty}`);
        if (/NaN|undefined|Infinity|\[object/.test(JSON.stringify(ex))) fail(`${tag}: NaN/undefined`);
        if (lang === 'de' && /ß/.test(JSON.stringify(ex))) fail(`${tag}: ß`);
        if (ex.hints.length < 3 || ex.steps.length < 2) fail(`${tag}: hints or steps missing`);
        for (const q of ex.questions) {
          if (q.type === 'choice' && q.options.filter((o) => o.correct).length !== 1) fail(`${tag}: ${q.key} has not one right option`);
          if (q.type === 'multi' && !q.options.some((o) => o.correct)) fail(`${tag}: ${q.key} has no right option`);
          if (q.options && new Set(q.options.map((o) => o.html)).size !== q.options.length) fail(`${tag}: ${q.key} options alike`);
          if (q.options && q.options.some((o) => !o.correct && !o.why)) fail(`${tag}: ${q.key} wrong option without why`);
          if (q.type === 'num') {
            if (!nice(q.value)) fail(`${tag}: ${q.key} = ${q.value} not in steps of 0.05`);
            if (q.traps.some((t) => Math.abs(t.value - q.value) < 0.05)) fail(`${tag}: ${q.key} trap equals the answer`);
            if (q.traps.some((t) => !nice(t.value))) fail(`${tag}: ${q.key} trap not in steps of 0.05`);
          }
        }
        const qOf = (key) => ex.questions.find((q) => q.key === key);
        const right = (key) => qOf(key).options.filter((o) => o.correct).map((o) => o.html);
        const D = ex.data;
        if (kind === 'compare') {
          const v = (p) => (p[1] - p[0]) / 10, vF = v(D.fast === 'A' ? D.A : D.B), vS = v(D.fast === 'A' ? D.B : D.A);
          if (!(Math.abs(vF) > Math.abs(vS))) fail(`${tag}: ${D.fast} is not faster`);
          if (!right('faster')[0].startsWith(D.fast)) fail(`${tag}: wrong answer to faster`);
          if (!near(qOf('v').value, v(D.asked === 'A' ? D.A : D.B))) fail(`${tag}: wrong velocity`);
          if (d === 2 && !(vF < 0)) fail(`${tag}: the faster one should move backwards`);
        }
        if (kind === 'direction') {
          const want = D.pieces.filter((p) => p.s1 < p.s0).length;
          if (right('neg').length !== want) fail(`${tag}: negative intervals`);
          if (!near(qOf('v').value, (D.asked.s1 - D.asked.s0) / (D.asked.t1 - D.asked.t0))) fail(`${tag}: wrong velocity`);
        }
        if (kind === 'table' && d === 2) {
          const back = D.rows.filter((r) => r.values.every((v, k) => k === 0 || v < r.values[k - 1])).map((r) => r.name);
          if (right('back').join() !== back.join() && right('back').slice().sort().join() !== back.slice().sort().join()) fail(`${tag}: always backwards ${right('back')} vs ${back}`);
          const U = D.rows.find((r) => r.name === D.uniform);
          if (!near(qOf('v').value, (U.values[1] - U.values[0]) / 5)) fail(`${tag}: wrong velocity`);
        }
        if (kind === 'table' && d === 3) {
          if (!near(qOf('vA').value, D.A.v) || !near(qOf('vB').value, D.B.v)) fail(`${tag}: wrong velocities`);
          if (!near(qOf('sA').value, D.A.s0 + 20 * D.A.v) || !near(qOf('sB').value, D.B.s0)) fail(`${tag}: wrong positions`);
        }
        if (kind === 'strobe') {
          if (D.xs.some((x) => x < -7 || x > 7)) fail(`${tag}: dot off the number line`);
          if (D.xs.slice(1).some((x, k) => !near(x - D.xs[k], D.gaps[k]))) fail(`${tag}: gaps disagree with the dots`);
          // constant acceleration: the distances per second change by a each second, and the
          // positions follow s₀ + v₀·t + a·t²/2
          if (D.gaps.slice(1).some((g, k) => !near(g - D.gaps[k], D.acc))) fail(`${tag}: acceleration not constant`);
          if (D.xs.some((x, t) => !near(x, D.xs[0] + D.v0 * t + (D.acc * t * t) / 2))) fail(`${tag}: positions are not s0 + v0 t + a t²/2`);
          if (d === 3 && !near(qOf('a').value, D.acc)) fail(`${tag}: wrong acceleration`);
          if (Math.abs(D.v0) > 6 || Math.abs(D.v0 + D.acc * D.gaps.length) > 6) fail(`${tag}: v off the axis`);
        }
        if (kind === 'atable') {
          const g = D.xs.slice(1).map((x, k) => x - D.xs[k]);
          if (g.slice(1).some((x, k) => !near(x - g[k], D.a))) fail(`${tag}: acceleration not constant`);
          if (!near(qOf('a').value, D.a)) fail(`${tag}: wrong acceleration`);
          if (d === 3 && (!near(qOf('s4').value, D.xs[4]) || !near(qOf('s5').value, D.xs[5]))) fail(`${tag}: wrong positions`);
          if (d === 4) {
            if (!near(qOf('s1').value, D.xs[1]) || !near(qOf('s5').value, D.xs[5])) fail(`${tag}: wrong positions`);
            if (!near(qOf('v2').value, (D.xs[4] - D.xs[0]) / 4)) fail(`${tag}: wrong velocity at 2 s`);
          }
        }
        if (kind === 'area' && D.pts) {
          const ds = C.integrate(D.pts, D.a, D.b, false), dist = C.integrate(D.pts, D.a, D.b, true);
          if (!near(qOf('ds').value, Math.round(ds * 100) / 100)) fail(`${tag}: wrong displacement`);
          if (d === 4 && !near(qOf('dist').value, Math.round(dist * 100) / 100)) fail(`${tag}: wrong distance`);
          if (d === 4 && !(dist - Math.abs(ds) >= 1)) fail(`${tag}: distance and displacement too close`);
        }
        if (kind === 'area' && D.tq) {
          const sA = C.integrate(D.A, 0, D.tq, false), sB = C.integrate(D.B, 0, D.tq, false);
          if (right('far')[0] !== (Math.abs(sA) > Math.abs(sB) ? 'A' : 'B')) fail(`${tag}: wrong answer to far`);
          if (!near(qOf('sB').value, Math.round(sB * 100) / 100)) fail(`${tag}: wrong displacement of B`);
        }
        const a = C.arcade(ex, seed);
        if (a.options.length !== 4 || a.options.filter((o) => o.correct).length !== 1 || new Set(a.options.map((o) => o.html)).size !== 4) fail(`${tag}: arcade options`);
      }
    }
  }
}
Lang.set('en', true);
console.log(`quiz exercises: ${C.KINDS.length} kinds checked`);

if (failures) { console.error(`\n${failures} failures`); process.exit(1); }
console.log('Generator OK');
