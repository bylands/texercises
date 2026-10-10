// Verifies the impedance exercises: run with `node impedance/test/check-generator.js`.
// For many seeds of every level it checks that
// - Z and dZ/dω agree with a numerical derivative,
// - the features the method uses are on the graph: corner frequency or resonance inside the
//   ω axis, the curve inside the Z axis where it is read, minimum or maximum clearly visible,
// - a student who reads the graph with the probe (one reading per pixel, three significant
//   digits) and follows the taught method finds R, L and C within the tolerance,
// - the estimates of the worked solution are within the tolerance,
// - every unknown has one right option and wrong ones that are far apart and explained, and the
//   student's reading is nearest the right one,
// - graph and schematic render in both axis modes; the tutor lessons are usable.
'use strict';

const I = require('../generator.js');
const P = require('../plot.js');
const { EXAMPLES } = require('../lessons.js');

const SAMPLES = 2000;
let failures = 0;
const fail = (msg) => { failures++; if (failures < 30) console.error('  FAIL ' + msg); };
const r3 = (x) => Number(x.toPrecision(3));
const near = (a, b, tol) => Math.abs(a - b) <= tol * Math.abs(b);

// What a careful student reads with the probe on linear axes: positions at whole pixels.
function student(c, ax) {
  const n = Math.round(P.PW), ws = Array.from({ length: n }, (x, k) => (ax.lin.wmax * (k + 1)) / n);
  const Zr = (w) => r3(I.Z(c, w)), dr = (w) => r3(I.dZ(c, w));
  const first = ws[0], last = ws[n - 1], out = {};
  const series = c.conn === 'series';
  if (c.kind === 'RLC') {
    let w0 = ws.find((w, k) => k > 0 && Math.sign(I.dZ(c, w)) !== Math.sign(I.dZ(c, ws[k - 1])));
    out.R = Zr(w0);
    out.L = series ? dr(last) : dr(first);
    out.C = 1 / (w0 * w0 * out.L);
  } else {
    if (c.kind === 'RL') {
      out.R = series ? Zr(first) : Zr(last);
      out.L = series ? dr(last) : dr(first);
    } else {
      out.R = series ? Zr(last) : Zr(first);
      const target = series ? Math.SQRT2 * out.R : out.R / Math.SQRT2;
      let best = ws[0];
      for (const w of ws) if (Math.abs(Zr(w) - target) < Math.abs(Zr(best) - target)) best = w;
      out.C = 1 / (best * out.R);
    }
  }
  return out;
}

function checkRender(tag, c, ax, an) {
  for (const mode of ['lin', 'log']) {
    const s = P.graph(c, ax, mode, { ann: an.steps.flatMap((x) => x.ann) }) + P.probeMark(c, ax, mode, ax.lin.wmax / 3, [{ w: ax.lin.wmax / 2, n: 1 }]);
    if (/NaN|undefined|Infinity/.test(s)) fail(`${tag}: graph (${mode})`);
  }
  if (/NaN|undefined/.test(P.schematic(c))) fail(`${tag}: schematic`);
  for (const x of [an.intro, ...an.steps.map((t) => t.text), ...Object.values(an.readings)]) if (/NaN|undefined|Infinity/.test(x)) fail(`${tag}: text ${x.slice(0, 60)}`);
}

for (const filter of Object.keys(I.LEVELS)) {
  const t0 = Date.now(), kinds = {}, tags = {};
  let worst = 0;
  for (let seed = 1; seed <= SAMPLES; seed++) {
    const tag = `${filter}-${seed}`, ex = I.generate(filter, seed), { c, ax, an } = ex;
    const kind = `${c.conn} ${c.kind}`;
    kinds[kind] = (kinds[kind] || 0) + 1;
    if (!I.LEVELS[filter].kinds.includes(kind)) fail(`${tag}: kind ${kind}`);
    if (ex.difficulty !== I.DIFFICULTY[kind]) fail(`${tag}: difficulty ${ex.difficulty}`);

    // derivative
    for (const f of [0.1, 0.4, 0.9]) {
      const w = ax.lin.wmax * f, h = w * 1e-6;
      const num = (I.Z(c, w + h) - I.Z(c, w - h)) / (2 * h);
      if (Math.abs(num - I.dZ(c, w)) > 1e-4 * Math.max(1, Math.abs(num))) fail(`${tag}: dZ at ${w}`);
    }
    // features on the graph
    const wf = I.feature(c), { wmax, ztop } = ax.lin;
    if (wf >= wmax * 0.95) fail(`${tag}: feature frequency off the axis`);
    if (c.kind === 'RLC' && (wf < wmax / 8.01 || (c.conn === 'parallel' && wf > wmax / 2))) fail(`${tag}: resonance at ${(wf / wmax).toFixed(2)} of the axis`);
    if (c.R > ztop * 0.92) fail(`${tag}: R too close to the top of the axis`);
    if (c.kind === 'RC' && c.conn === 'series' && Math.SQRT2 * c.R > ztop * 0.9) fail(`${tag}: corner value off the axis`);
    if (c.kind === 'RLC' && c.conn === 'series' && I.Z(c, wmax) > ztop) fail(`${tag}: right end off the axis`);
    if (c.R < ztop / 14.01) fail(`${tag}: R too small to read`);
    const { w0, w1, z0, z1 } = ax.log;
    if (!(w0 < wf / 10 && w1 > wf * 10 && z1 / z0 <= 1e4 && z0 < c.R && z1 > c.R)) fail(`${tag}: log axes`);

    // the taught method
    const s = student(c, ax);
    for (const f of ex.fields) {
      const v = c[f.key], e = Math.abs(s[f.key] - v) / v, e2 = Math.abs(an.est[f.key] - v) / v;
      worst = Math.max(worst, e);
      if (e > I.TOL) fail(`${tag}: student finds ${f.key} = ${s[f.key]} for ${v} (${(100 * e).toFixed(1)} %)`);
      if (e2 > I.TOL) fail(`${tag}: solution estimates ${f.key} = ${an.est[f.key]} for ${v}`);
      // options: the right value once, wrong ones far apart, the student's reading nearest the right one
      const os = f.options, right = os.filter((o) => o.ok);
      if (os.length !== I.OPTIONS) fail(`${tag}: ${os.length} options for ${f.key}`);
      if (right.length !== 1 || right[0].value !== v) fail(`${tag}: right option for ${f.key}`);
      for (let k = 1; k < os.length; k++) if (os[k].value < os[k - 1].value * I.GAP * (1 - 1e-9)) fail(`${tag}: ${f.key} options ${os[k - 1].label} and ${os[k].label} too close`);
      for (const o of os) {
        if (/NaN|undefined|Infinity/.test(o.label + (o.why || ''))) fail(`${tag}: option ${o.label}`);
        if (!o.ok && !o.why) fail(`${tag}: no explanation for ${f.key} = ${o.label}`);
        { const t = `${kind} ${f.key}: ${o.tag}`; tags[t] = (tags[t] || 0) + 1; }
      }
      const nearest = os.reduce((a, b) => (Math.abs(Math.log(b.value / s[f.key])) < Math.abs(Math.log(a.value / s[f.key])) ? b : a));
      if (!nearest.ok) fail(`${tag}: reading ${f.key} = ${s[f.key]} is nearest to the wrong option ${nearest.label}`);
    }
    if (seed <= 200) checkRender(tag, c, ax, an);
  }
  console.log(`${filter}: ${SAMPLES} seeds, ${JSON.stringify(kinds)}, worst reading error ${(100 * worst).toFixed(1)} %, ${Date.now() - t0} ms`);
  if (filter === 'mixed') console.log(`  options picked: ${JSON.stringify(tags)}`);
}

// tutor lessons
for (const e of EXAMPLES) {
  if (e.match || e.elements) continue; // the matching examples: test/check-match.js; the elements: no graph
  const c = e.circuit, ax = I.axesFor(c), an = I.analysis(c, ax);
  if (!I.usable(c, ax)) fail(`lesson ${e.name}: features not readable`);
  for (const k of I.UNKNOWNS[c.kind]) if (!near(an.est[k], c[k], I.TOL)) fail(`lesson ${e.name}: ${k} estimated as ${an.est[k]}`);
  checkRender(`lesson ${e.name}`, c, ax, an);
}
console.log(`lessons: ${EXAMPLES.length}`);

if (failures) { console.error(`\n${failures} failures`); process.exit(1); }
console.log('Generator OK');
