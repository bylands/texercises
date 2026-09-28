// Verifies the matching exercises: run with `node induction-match/test/check-generator.js`.
// For many seeds it checks that
// - every voltage graph is −dΦ/dt of its flux graph (by numerical differentiation),
// - the flux graph is continuous and passes through the listed breakpoint values,
// - the answer pairs the four flux graphs with the four voltage graphs one to one,
// - no two flux graphs give the same voltage graph (the matching is unique),
// - flux and voltage stay on their axes, and breakpoints are visible,
// - every exercise has curved parts, and curves bend visibly,
// - every exercise has traps for the misconceptions: a voltage graph that copies the shape of
//   a wrong flux graph, a mirrored pair (sign), and a pair that differs in one interval
//   (steepness or average slope); diagnose() recognises them,
// - both kinds of diagram render.
'use strict';

const { T, PHI_MAX, V_MAX, BEND, generate, diagnose, curved } = require('../generator.js');
const { fluxGraph, voltGraph } = require('../plot.js');

const SAMPLES = 5000;
let failures = 0;
const fail = (msg) => { failures++; if (failures < 30) console.error('  FAIL ' + msg); };
const close = (a, b) => Math.abs(a - b) < 1e-6;
const seen = new Set();
let curvedIntervals = 0, intervals = 0, withAverage = 0;
const diagnoses = {};

// Φ(t) and V(t) evaluated from the exercise data, independently of the generator's helpers.
function phi(ex, f, t) {
  const i = Math.min(ex.times.findIndex((x, k) => t < ex.times[k + 1]), f.segs.length - 1);
  const t0 = ex.times[i], len = ex.times[i + 1] - t0, sg = f.segs[i], tau = t - t0;
  return f.values[i] + sg.d0 * tau + ((sg.d1 - sg.d0) / (2 * len)) * tau * tau;
}
function volt(ex, u, t) {
  const i = Math.min(ex.times.findIndex((x, k) => t < ex.times[k + 1]), u.segs.length - 1);
  const t0 = ex.times[i], len = ex.times[i + 1] - t0, sg = u.segs[i];
  return sg.v0 + ((sg.v1 - sg.v0) * (t - t0)) / len;
}

for (let seed = 1; seed <= SAMPLES; seed++) {
  const tag = `seed ${seed}`;
  const ex = generate(seed);
  seen.add(JSON.stringify([ex.times, ex.flux.map((f) => f.segs)]));

  if (ex.times[0] !== 0 || ex.times[ex.times.length - 1] !== T) fail(`${tag}: time axis ${ex.times}`);
  const n = ex.times.length - 1;

  for (const f of ex.flux) {
    if (f.values.length !== n + 1 || f.segs.length !== n) fail(`${tag}: graph ${f.id} has the wrong number of points`);
    for (let k = 1; k <= n; k++) {
      if (!close(phi(ex, f, ex.times[k] - 1e-9), f.values[k])) fail(`${tag}: flux ${f.id} jumps at ${ex.times[k]} s`);
    }
    for (let t = 0; t <= T; t += 0.01) {
      const p = phi(ex, f, t);
      if (p < -1e-9 || p > PHI_MAX + 1e-9) { fail(`${tag}: flux ${f.id} off the axis at ${t.toFixed(2)} s`); break; }
    }
    f.segs.forEach((sg, i) => {
      intervals++;
      if (curved(sg)) {
        curvedIntervals++;
        if (Math.abs(sg.d1 - sg.d0) * (ex.times[i + 1] - ex.times[i]) < BEND) fail(`${tag}: curve in ${f.id} barely bends`);
      }
      const prev = f.segs[i - 1];
      if (prev && prev.d1 === sg.d0 && (prev.d1 - prev.d0) / (ex.times[i] - ex.times[i - 1]) === (sg.d1 - sg.d0) / (ex.times[i + 1] - ex.times[i])) {
        fail(`${tag}: invisible breakpoint in ${f.id} at ${ex.times[i]} s`);
      }
    });
  }
  if (!ex.flux.some((f) => f.segs.some(curved))) fail(`${tag}: no curved parts`);

  const byVolt = Object.values(ex.answer);
  if (Object.keys(ex.answer).length !== 4 || new Set(byVolt).size !== 4) fail(`${tag}: answer is not one to one`);
  for (const f of ex.flux) {
    const u = ex.volt.find((v) => v.id === ex.answer[f.id]);
    if (!u) { fail(`${tag}: no voltage graph for ${f.id}`); continue; }
    const h = 1e-4;
    for (let t = 0.05; t < T; t += 0.1) {
      if (ex.times.some((x) => Math.abs(x - t) < 2 * h)) continue;
      const dphi = (phi(ex, f, t + h) - phi(ex, f, t - h)) / (2 * h);
      if (Math.abs(volt(ex, u, t) + dphi) > 1e-6) { fail(`${tag}: ${u.id} is not −dΦ/dt of ${f.id} at ${t.toFixed(2)} s`); break; }
      if (Math.abs(volt(ex, u, t)) > V_MAX) { fail(`${tag}: voltage ${u.id} off the axis`); break; }
    }
  }
  if (new Set(ex.volt.map((u) => JSON.stringify(u.segs))).size !== 4) fail(`${tag}: two voltage graphs are equal`);
  const mirrored = ex.flux.some((a) => ex.flux.some((b) => a !== b &&
    a.segs.every((s, i) => s.d0 === -b.segs[i].d0 && s.d1 === -b.segs[i].d1)));
  if (!mirrored) fail(`${tag}: no mirrored pair`);
  if (ex.volt.every((u, k) => ex.answer[ex.flux[k].id] === u.id)) fail(`${tag}: every pair in the same position`);

  const found = new Set();
  for (const f of ex.flux) {
    for (const u of ex.volt) {
      const d = diagnose(ex, f.id, u.id);
      if ((d === 'right') !== (ex.answer[f.id] === u.id)) fail(`${tag}: diagnose(${f.id}, ${u.id}) = ${d}`);
      found.add(d);
      if (d !== 'right') diagnoses[d] = (diagnoses[d] || 0) + 1;
    }
  }
  if (!found.has('copy')) fail(`${tag}: no voltage graph copies a flux graph`);
  if (!found.has('sign')) fail(`${tag}: no sign trap`);
  if (!found.has('steepness') && !found.has('average')) fail(`${tag}: no steepness or average-slope trap`);
  if (found.has('average')) withAverage++;

  for (const f of ex.flux) if (!fluxGraph(ex.times, f.values, f.segs, true).startsWith('<svg')) fail(`${tag}: flux diagram`);
  for (const u of ex.volt) if (!voltGraph(ex.times, u.segs, true).startsWith('<svg')) fail(`${tag}: voltage diagram`);
}

console.log(`${SAMPLES} seeds, ${seen.size} distinct sets of flux graphs, ${Math.round((100 * curvedIntervals) / intervals)}% of intervals curved`);
console.log(`average-slope trap in ${Math.round((100 * withAverage) / SAMPLES)}% of exercises; wrong pairs by misconception: ${JSON.stringify(diagnoses)}`);
if (failures) { console.error(`\n${failures} failures`); process.exit(1); }
console.log('Generator OK');
