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
// - both diagrams render.
'use strict';

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

if (failures) { console.error(`\n${failures} failures`); process.exit(1); }
console.log('Generator OK');
