// Verifies the problems (realproblems.js): run with `node impedance/test/check-real.js`.
// For many numbers of every problem, in both languages, it checks that
// - what the curve gives when read the way taught agrees with the device it was drawn from (the
//   capacitance from the peak is the capacitor's, the voice coil's R the one in the model, …),
// - every question has exactly one right option, the options are distinct, and the right one is
//   the nearest to the true value,
// - all texts are complete, and the graph and the solution's graph render.
'use strict';

const Lang = require('../lang.js');
const I = require('../generator.js');
const P = require('../plot.js');
const R = require('../realproblems.js');

let failures = 0;
const fail = (msg) => { failures++; if (failures < 30) console.error('  FAIL ' + msg); };
const bad = (html) => /undefined|NaN|null|\[object|Infinity/.test(html);
const near = (a, b, tol) => Math.abs(a - b) <= tol * Math.abs(b);
const PI2 = 2 * Math.PI;

// the device's true values against what the reading gives (tolerance)
const TRUTH = {
  crossover: (p, v) => [['R', v.R, p.R, 0.01], ['fc', v.fc, 1 / (PI2 * p.R * p.C), 0.01]],
  guitar: (p, v) => [['C', v.C, 100e-12 * (1 + p.len), 0.03], ['len', v.len, p.len, 0.05]],
  radio: (p, v) => [['f0', v.f0, p.f0, 0.005], ['C', v.C, 1 / ((PI2 * p.f0) ** 2 * p.L), 0.01]],
  scale: (p, v) => [['Re', v.lo, p.Re, 0.01], ['Ri', v.Ri, p.Ri, 0.03]],
  detector: (p, v) => [['L1', v.L1, p.L0 * (1 - p.d), 0.002], ['dL', v.dL, p.L0 * p.d, 0.05]],
  charger: (p, v) => [['L1', v.L1, p.L0 * p.k, 0.01]],
  speaker: (p, v) => [['R', v.R, p.R, 0.03], ['fs', v.fpk, p.fs, 0.05], ['L', v.L, p.L, 0.1]],
  nfc: (p, v) => [['Q', v.Q, p.R / (PI2 * 13.56e6 * p.L), 0.03]],
  quartz: (p, v) => [['C1', v.C1, p.C1, 0.05], ['fs', v.fsr, p.fs, 0.001]],
};

let n = 0;
for (const lang of ['en', 'de']) {
  Lang.set(lang, true);
  R.PROBLEMS.forEach((pb, i) => {
    for (let seed = 1; seed <= 150; seed++) {
      const ex = R.realOf(i, seed), tag = `${lang} ${pb.id}-${seed}`;
      n++;
      for (const [k, got, want, tol] of TRUTH[pb.id](ex.p, ex.v)) if (!near(got, want, tol)) fail(`${tag}: ${k} read as ${got}, the device has ${want}`);
      const fields = pb.fields(ex.p, ex.v);
      ex.fields.forEach((f, j) => {
        const right = f.options.filter((o) => o.ok);
        if (right.length !== 1) fail(`${tag}: ${f.key} has ${right.length} right options`);
        if (new Set(f.options.map((o) => o.label)).size !== f.options.length) fail(`${tag}: ${f.key} options not distinct: ${f.options.map((o) => o.label)}`);
        const truth = fields[j].value, nearest = f.options.reduce((a, b) => (Math.abs(Math.log(b.value / truth)) < Math.abs(Math.log(a.value / truth)) ? b : a));
        if (!nearest.ok) fail(`${tag}: ${f.key} = ${truth}: the nearest option is ${nearest.label}, not the right one`);
        if (f.options.length !== 4) fail(`${tag}: ${f.key} has ${f.options.length} options`);
        if (bad(f.what + f.options.map((o) => o.label + (o.why || '')).join(''))) fail(`${tag}: texts of ${f.key}`);
      });
      if (bad(ex.title + ex.text + ex.hints.join('') + JSON.stringify(ex.steps) + ex.results)) fail(`${tag}: texts`);
      if (seed <= 20) {
        const g = P.graph(ex.c, ex.ax, ex.ax.mode, { extra: ex.extra }), gs = P.graph(ex.c, ex.ax, ex.ax.mode, { ann: ex.ann, extra: ex.extra });
        if (/NaN|undefined/.test(g + gs) || !/class="curve" d="M/.test(g)) fail(`${tag}: graph`);
      }
    }
  });
}
console.log(`problems: ${R.PROBLEMS.length}, exercises: ${n}`);
if (failures) { console.error(`\n${failures} failures`); process.exit(1); }
console.log('Problems OK');
