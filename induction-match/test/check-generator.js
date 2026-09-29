// Verifies the matching exercises: run with `node induction-match/test/check-generator.js`.
// For many seeds of every family it checks that
// - every voltage graph is −dΦ/dt of its flux graph (by numerical differentiation),
// - the flux is continuous and stays on the flux axis, the voltage on the voltage axis,
// - the answer pairs the four flux graphs with the four voltage graphs one to one,
// - the four voltage graphs are visibly different (the matching is unique),
// - straight and curved pieces: breakpoints are visible and curves bend visibly,
// - every exercise has traps for the misconceptions, and diagnose() recognises them:
//   a voltage graph that copies the shape of a wrong flux graph, a mirrored pair (sign), and a
//   pair that differs in steepness (or in a curved part replaced by its average slope),
// - both kinds of diagram render.
'use strict';

const { T, PHI_MAX, V_MAX, BEND, FAMILIES, generate, diagnose, flux, volt, curved } = require('../generator.js');
const { fluxGraph, voltGraph } = require('../plot.js');

const SAMPLES = 2000;
let failures = 0;
const fail = (msg) => { failures++; if (failures < 30) console.error('  FAIL ' + msg); };
const grid = (n) => Array.from({ length: n }, (x, k) => ((k + 0.5) * T) / n);

for (const family of Object.keys(FAMILIES)) {
  const t0 = Date.now();
  const seen = new Set(), diagnoses = {}, kinds = {};
  let withAverage = 0;
  for (let seed = 1; seed <= SAMPLES; seed++) {
    const tag = `${family} ${seed}`;
    const ex = generate(family, seed);
    seen.add(JSON.stringify(ex.flux.map((f) => f.pieces)));

    for (const f of ex.flux) {
      const ps = f.pieces;
      if (ps[0].t0 !== 0 || ps[ps.length - 1].t1 !== T || ps.some((p, i) => i && p.t0 !== ps[i - 1].t1)) fail(`${tag}: pieces of ${f.id} do not cover the time axis`);
      for (const p of ps) {
        kinds[p.type] = (kinds[p.type] || 0) + 1;
        if (p.t0 > 0 && Math.abs(flux(f, p.t0 - 1e-9) - flux(f, p.t0)) > 1e-6) fail(`${tag}: flux ${f.id} jumps at ${p.t0} s`);
      }
      for (const t of grid(800)) {
        const phi = flux(f, t);
        if (phi < -1e-3 || phi > PHI_MAX + 1e-3) { fail(`${tag}: flux ${f.id} off the axis at ${t.toFixed(2)} s`); break; }
        if (Math.abs(volt(f, t)) > V_MAX) { fail(`${tag}: voltage of ${f.id} off the axis at ${t.toFixed(2)} s`); break; }
        const h = 1e-5;
        if (ps.some((p) => Math.abs(p.t0 - t) < 2 * h)) continue;
        const dphi = (flux(f, t + h) - flux(f, t - h)) / (2 * h);
        if (Math.abs(volt(f, t) + dphi) > 1e-5) { fail(`${tag}: voltage of ${f.id} is not −dΦ/dt at ${t.toFixed(2)} s`); break; }
      }
      if (family === 'pieces') {
        ps.forEach((p, i) => {
          if (curved(p) && Math.abs(p.d1 - p.d0) * (p.t1 - p.t0) < BEND) fail(`${tag}: curve in ${f.id} barely bends`);
          const q = ps[i - 1], rate = (x) => (x.d1 - x.d0) / (x.t1 - x.t0);
          if (q && q.d1 === p.d0 && rate(q) === rate(p)) fail(`${tag}: invisible breakpoint in ${f.id} at ${p.t0} s`);
        });
      }
    }

    const byVolt = Object.values(ex.answer);
    if (Object.keys(ex.answer).length !== 4 || new Set(byVolt).size !== 4) fail(`${tag}: answer is not one to one`);
    if (ex.volt.some((u) => ex.answer[u.of] !== u.id)) fail(`${tag}: answer and voltage graphs disagree`);
    if (ex.volt.every((u, k) => ex.answer[ex.flux[k].id] === u.id)) fail(`${tag}: every pair in the same position`);
    ex.flux.forEach((a, i) => ex.flux.slice(i + 1).forEach((b) => {
      if (Math.max(...grid(400).map((t) => Math.abs(volt(a, t) - volt(b, t)))) < 0.4) fail(`${tag}: voltage graphs of ${a.id} and ${b.id} look the same`);
    }));

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

    for (const f of ex.flux) {
      for (const s of [fluxGraph(f, true), voltGraph(f, true)]) if (!s.startsWith('<svg') || /NaN|undefined/.test(s)) fail(`${tag}: diagram of ${f.id}`);
    }
  }
  console.log(`${family}: ${SAMPLES} seeds, ${seen.size} distinct, pieces ${JSON.stringify(kinds)}, ${Date.now() - t0} ms`);
  console.log(`  wrong pairs by misconception: ${JSON.stringify(diagnoses)}${withAverage ? `; average-slope trap in ${Math.round((100 * withAverage) / SAMPLES)}%` : ''}`);
}

if (failures) { console.error(`\n${failures} failures`); process.exit(1); }
console.log('Generator OK');
