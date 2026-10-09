// Verifies the exercises (generator.js, plot.js): run with `node induction-match/test/check-generator.js`.
// For many seeds of every type it checks that
// - the voltage is −dΦ/dt of the flux (by numerical differentiation), and the flux is continuous,
// - straight graphs have straight pieces with visible kinks; smooth ones have no kinks (the
//   voltage has no jumps), every breakpoint shows in the voltage, and two pieces or more bend visibly,
// - the given graph and the four options stay on their axes; the given flux starts at phi0,
// - there are four options of the other quantity, exactly one right (the true graph), the others
//   visibly different from it and from each other, each with a known mistake,
// - the mistakes are what their tags say (sign: mirrored; average: constant in each piece; straight:
//   straight between the right values at the breakpoints),
// - all options and the graphs of the solution render in both languages.
'use strict';

const Lang = require('../lang.js');
const I = require('../generator.js');
const { fluxGraph, voltGraph, optionGraph } = require('../plot.js');

const { T, PHI_MAX, V_MAX, BEND, TYPES, generate, flux, volt, curved } = I;
const SAMPLES = 1500;
let failures = 0;
const fail = (msg) => { failures++; if (failures < 30) console.error('  FAIL ' + msg); };
const grid = (n) => Array.from({ length: n }, (x, k) => ((k + 0.5) * T) / n);
const near = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol;
const bad = (html) => /undefined|NaN|null|\[object|Infinity/.test(html);
const TAGS = { phi2v: ['sign', 'copy', 'steep', 'average'], v2phi: ['sign', 'copy', 'steep', 'straight'] };

for (const type of TYPES) {
  const t0 = Date.now(), tags = {};
  for (let seed = 1; seed <= SAMPLES; seed++) {
    const e = generate(type, seed), g = e.g, tag = `${type} ${seed}`, F = (t) => flux(g, t), V = (t) => volt(g, t);
    if (e.difficulty !== TYPES.indexOf(type) + 1) fail(`${tag}: difficulty ${e.difficulty}`);
    // the physics
    for (const t of grid(160)) {
      const h = 1e-5, d = (F(t + h) - F(t - h)) / (2 * h);
      if (!near(V(t), -d, 1e-4)) { fail(`${tag}: V is not −dΦ/dt at ${t}`); break; }
    }
    g.pieces.slice(1).forEach((p) => { if (!near(F(p.t0 - 1e-9), F(p.t0), 1e-6)) fail(`${tag}: the flux jumps at ${p.t0}`); });
    if (!near(F(0), e.phi0)) fail(`${tag}: the flux does not start at phi0`);
    // the kind of graph
    g.pieces.forEach((p, i) => {
      if (!Number.isInteger(p.t0) || !Number.isInteger(p.t1)) fail(`${tag}: breakpoint not at a whole second`);
      if (e.family === 'lin' && curved(p)) fail(`${tag}: a curved piece in a straight graph`);
      if (e.family === 'smooth' && !curved(p)) fail(`${tag}: a straight piece in a smooth graph`);
      if (i === 0) return;
      const before = V(p.t0 - 1e-9), after = V(p.t0), q = g.pieces[i - 1];
      if (e.family === 'lin' && near(before, after)) fail(`${tag}: no kink at ${p.t0}`);
      if (e.family === 'smooth') {
        if (!near(before, after, 1e-6)) fail(`${tag}: the voltage jumps at ${p.t0}`);
        if (near((p.d1 - p.d0) / (p.t1 - p.t0), (q.d1 - q.d0) / (q.t1 - q.t0))) fail(`${tag}: no kink of the voltage at ${p.t0}`);
      }
    });
    if (e.family === 'smooth' && g.pieces.filter((p) => Math.abs(p.d1 - p.d0) * (p.t1 - p.t0) >= BEND).length < 2) fail(`${tag}: fewer than two pieces bend visibly`);
    // the given graph and the options
    const want = e.dir === 'phi2v' ? 'volt' : 'flux', truth = e.dir === 'phi2v' ? V : F;
    if (e.given.kind === want) fail(`${tag}: the given graph is of the wrong quantity`);
    if (grid(200).some((t) => !near(e.given.f(t), e.dir === 'phi2v' ? F(t) : V(t)))) fail(`${tag}: the given graph is not the exercise's`);
    if (e.options.length !== 4) fail(`${tag}: ${e.options.length} options`);
    if (e.options.filter((o) => o.ok).length !== 1) fail(`${tag}: not exactly one right option`);
    for (const o of [e.given, ...e.options]) {
      const vs = grid(400).map(o.f);
      const lo = Math.min(...vs), hi = Math.max(...vs);
      if (o.kind === 'flux' ? lo < -1e-9 || hi > PHI_MAX + 1e-9 : lo < -V_MAX || hi > V_MAX) fail(`${tag}: ${o.tag} leaves the axis`);
    }
    e.options.forEach((o, k) => {
      tags[o.tag] = (tags[o.tag] || 0) + 1;
      if (o.kind !== want) fail(`${tag}: an option of the wrong quantity`);
      if (o.ok) { if (grid(200).some((t) => !near(o.f(t), truth(t)))) fail(`${tag}: the right option is not the true graph`); return; }
      if (!TAGS[e.dir].includes(o.tag)) fail(`${tag}: unknown mistake ${o.tag}`);
      e.options.slice(0, k).forEach((p) => { if (Math.max(...grid(400).map((t) => Math.abs(o.f(t) - p.f(t)))) < 0.4) fail(`${tag}: two options look alike`); });
      if (o.tag === 'average' && g.pieces.some((p) => grid(400).filter((t) => t > p.t0 && t < p.t1).some((t) => !near(o.f(t), -(p.d0 + p.d1) / 2)))) fail(`${tag}: average is not the average slope`);
      if (o.tag === 'straight' && g.pieces.some((p) => !near(o.f(p.t0), F(p.t0), 1e-6))) fail(`${tag}: straight misses the values at the breakpoints`);
    });
    const sign = e.options.find((o) => o.tag === 'sign');
    if (sign && e.dir === 'v2phi' && !near(sign.f(0), e.phi0)) fail(`${tag}: the mirrored flux does not start at phi0`);
    // drawings, every 25th seed, in both languages
    if (seed % 25 === 0) {
      for (const lang of ['en', 'de']) {
        Lang.set(lang);
        const html = [fluxGraph(g), voltGraph(g), fluxGraph(g, true), voltGraph(g, true), fluxGraph(g, false, { upto: 1 }), ...e.options.map((o) => optionGraph(o)), optionGraph(e.given)].join('');
        if (bad(html)) fail(`${tag}: a drawing has undefined or NaN (${lang})`);
      }
    }
  }
  // every mistake of the type comes up
  for (const t of TAGS[type.split('-')[0]]) if (!tags[t] && !(type.endsWith('lin') && ['average', 'straight'].includes(t))) fail(`${type}: never the mistake ${t}`);
  console.log(`${type}: ${SAMPLES} exercises, ${JSON.stringify(tags)} (${Date.now() - t0} ms)`);
}

// the worked examples' graphs
for (const family of ['lin', 'smooth']) for (let s = 1; s < 40; s++) {
  const g = I.graphOf(family, s), vs = grid(200).map((t) => flux(g, t));
  if (Math.min(...vs) < -1e-9 || Math.max(...vs) > PHI_MAX + 1e-9) fail(`graphOf ${family} ${s} leaves the axis`);
}

if (failures) { console.error(`${failures} failures`); process.exit(1); }
console.log('all checks passed');
