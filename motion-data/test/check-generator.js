// Verifies the motion-data exercises: run with `node motion-data/test/check-generator.js`.
// For every kind and difficulty (concepts.js): one right option per choice, distinct options, an
// explanation for every wrong one, traps different from the answer, numbers in steps of 0.05,
// and answers that agree with the motion behind the exercise (data), worked out again here; the
// graphs inside their plots; the same in German, without ß. Then the questions of the check: for
// the kinds of every objective (as in app.js), four options with exactly one right.
'use strict';

const Lang = require('../lang.js');
const M = require('../generator.js');
const C = require('../concepts.js');

let failures = 0;
const fail = (msg) => { failures++; if (failures < 30) console.error('  FAIL ' + msg); };
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
          for (const o of q.options || []) if (o.flag && !C.FLAGS[o.flag]) fail(`${tag}: unknown flag ${o.flag}`);
          for (const t of q.traps || []) if (t.flag && !C.FLAGS[t.flag]) fail(`${tag}: unknown flag ${t.flag}`);
        }
        const qOf = (key) => ex.questions.find((q) => q.key === key);
        const right = (key) => qOf(key).options.filter((o) => o.correct).map((o) => o.html);
        const D = ex.data;
        if (kind === 'table') {
          if (!near(qOf('vA').value, D.A.v) || !near(qOf('vB').value, D.B.v)) fail(`${tag}: wrong velocities`);
          if (['A', 'B'].some((n) => !near(qOf(`s${n}`).value, D[n].s0 + D[n].v * D.times[D[n].asked]))) fail(`${tag}: wrong positions`);
          if (['A', 'B'].some((n) => D[n].known.includes(D[n].asked))) fail(`${tag}: a known position asked for`);
        }
        if (kind === 'tablegraph' && d === 2) {
          const turn = D.rows.find((r) => r.name === D.turning), ch = turn.values.slice(1).map((v, k) => v - turn.values[k]);
          if (!(ch.some((c) => c > 0) && ch.some((c) => c < 0))) fail(`${tag}: ${D.turning} does not turn`);
        }
        if (kind === 'strobe' || kind === 'strobegraph') {
          if (D.xs.some((x) => x < -7 || x > 7)) fail(`${tag}: dot off the number line`);
          if (D.xs.slice(1).some((x, k) => !near(x - D.xs[k], D.gaps[k]))) fail(`${tag}: gaps disagree with the dots`);
          // constant acceleration: the distances per second change by a each second, and the
          // positions follow s₀ + v₀·t + a·t²/2
          if (D.gaps.slice(1).some((g, k) => !near(g - D.gaps[k], D.acc))) fail(`${tag}: acceleration not constant`);
          if (D.xs.some((x, t) => !near(x, D.xs[0] + D.v0 * t + (D.acc * t * t) / 2))) fail(`${tag}: positions are not s0 + v0 t + a t²/2`);
          if (kind === 'strobe' && d === 3 && !near(qOf('a').value, D.acc)) fail(`${tag}: wrong acceleration`);
          if (kind === 'strobe' && d === 2 && right('fastest')[0] !== (() => { const k = D.gaps.reduce((m, g, i) => (Math.abs(g) > Math.abs(D.gaps[m]) ? i : m), 0); return `${k}–${k + 1}&nbsp;s`; })()) fail(`${tag}: fastest second`);
          if (Math.abs(D.v0) > 6 || Math.abs(D.v0 + D.acc * D.gaps.length) > 6) fail(`${tag}: v off the axis`);
        }
        if (kind === 'atable' || kind === 'atablegraph') {
          // the changes of position per time step change by a · (step)² each step
          const g = D.xs.slice(1).map((x, k) => x - D.xs[k]), st = D.step || 1;
          if (g.slice(1).some((x, k) => !near(x - g[k], D.a * st * st))) fail(`${tag}: acceleration not constant`);
          if (kind === 'atable' && !near(qOf('a').value, D.a)) fail(`${tag}: wrong acceleration`);
          if (kind === 'atable' && D.asked.some((k) => !near(qOf(`s${k}`).value, D.xs[k]))) fail(`${tag}: wrong positions`);
          if (kind === 'atable' && D.asked.some((k) => k >= D.b && k <= D.b + 2)) fail(`${tag}: one of the three neighbours asked for`);
          if (kind === 'atable' && d === 4 && !near(qOf('vm').value, (D.xs[D.b + 2] - D.xs[D.b]) / (2 * st))) fail(`${tag}: wrong velocity in the middle`);
          // the strategy: the missing positions are asked before the acceleration
          const keys = ex.questions.map((q) => q.key);
          if (kind === 'atable' && D.asked.some((k) => keys.indexOf(`s${k}`) > keys.indexOf('a'))) fail(`${tag}: the acceleration is asked before the positions`);
          if (kind === 'atable' && qOf('graph')) fail(`${tag}: a graph among the questions`);
        }
        if (['table', 'atable', 'strobe'].includes(kind) && ex.questions.some((q) => q.pics)) fail(`${tag}: a graph among the questions`);
        if (['tablegraph', 'atablegraph', 'strobegraph'].includes(kind) && (ex.questions.length !== 1 || !ex.questions[0].pics || ex.questions[0].options.length !== 4)) fail(`${tag}: not one graph with four options`);
        // every curve of a graph inside its plot (y from 30 to 192 in figs.js)
        const graphs = [ex.figure, ...ex.steps.map((x) => x.figure), ...ex.questions.flatMap((q) => (q.pics ? q.options.map((o) => o.html) : []))];
        for (const gr of graphs) {
          for (const m of gr.matchAll(/class="curve[^"]*" d="M([^"]+)"/g)) {
            if (m[1].split(/ ?L/).some((pt) => { const y = Number(pt.split(',')[1]); return y < 29.5 || y > 192.5; })) { fail(`${tag}: a curve off its axis`); break; }
          }
        }
        const a = C.question(ex, seed);
        if (a.options.length !== 4 || a.options.filter((o) => o.correct).length !== 1 || new Set(a.options.map((o) => o.html)).size !== 4) fail(`${tag}: check options`);
      }
    }
  }
}

// ---------------------------------------------------------------- the check
// The kinds of the objectives in app.js (kind:difficulty, and the question to ask).
const OBJECTIVES = { instant: ['table:3', 'atable:4:vm'], convert: ['tablegraph:2', 'strobegraph:2'], uniform: ['strobe:2:how', 'atable:3:a', 'atablegraph:3'] };
for (const lang of ['en', 'de']) {
  Lang.set(lang, true);
  for (const [id, kinds] of Object.entries(OBJECTIVES)) {
    for (const kind of kinds) {
      const [k, d, key] = kind.split(':');
      for (let seed = 1; seed <= 300; seed++) {
        const tag = `${lang} check ${id} ${kind}/${seed}`;
        const ex = M.KINDS[k].make(seed, Number(d)), q = C.question(ex, seed, key);
        if (!q.ask || q.options.length !== 4 || q.options.filter((o) => o.correct).length !== 1 || new Set(q.options.map((o) => o.html)).size !== 4) fail(`${tag}: options`);
        if (q.options.some((o) => !o.correct && !o.why)) fail(`${tag}: wrong option without why`);
      }
    }
  }
}
Lang.set('en', true);
console.log(`${C.KINDS.length} kinds and ${Object.keys(OBJECTIVES).length} objectives checked`);

if (failures) { console.error(`\n${failures} failures`); process.exit(1); }
console.log('Generator OK');
