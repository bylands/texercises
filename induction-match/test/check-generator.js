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
// - all options and the graphs of the solution render in both languages,
// - reading off a given graph (plot.js cursor): the readout gives t and the value there, and never
//   the slope; the tangent touches the flux graph at t with the slope dΦ/dt (= −V_ind), stays in
//   the plot and spans a good part of it (at least 2 s, or edge to edge); at a kink there is none.
'use strict';

const Lang = require('../lang.js');
const I = require('../generator.js');
const { fluxGraph, voltGraph, optionGraph, cursor, guide, timeAt } = require('../plot.js');

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

// reading off: the readout and the tangent
{
  const W = 280, Lm = 34, R = 44, TOP = 44, Bm = 26, H = 196;
  const X = (t) => Lm + (t / T) * (W - Lm - R), Y = (v) => TOP + ((PHI_MAX - v) / PHI_MAX) * (H - TOP - Bm), Yv = (v) => TOP + ((V_MAX - v) / (2 * V_MAX)) * (H - TOP - Bm);
  const fix = (x) => { const v = Math.round(x * 10) / 10; return (v < 0 ? '−' : '') + Math.abs(v).toFixed(1); };
  let tangents = 0, kinks = 0;
  for (const lang of ['en', 'de']) {
    Lang.set(lang);
    for (const type of ['phi2v-lin', 'phi2v-smooth', 'v2phi-lin']) {
      for (let seed = 1; seed <= 40; seed++) {
        const g = generate(type, seed).g, tag = `cursor ${type} ${seed} ${lang}`;
        for (let k = 0; k <= 80; k++) {
          const t = k / 10, tt = Math.min(t, T - 1e-9), Phi = flux(g, tt);
          const html = cursor('flux', g, t, { tangent: true }), read = html.match(/<text class="hv-read"[^>]*>(.*?)<\/text>/)[1].replace(/<[^>]+>/g, '');
          if (bad(html)) fail(`${tag}: undefined or NaN`);
          if (read !== `t = ${fix(t)} s, Φ = ${fix(Phi)} mWb`) fail(`${tag} t=${t}: the readout ${read}`);
          if (!html.includes(`cx="${Math.round(X(t) * 10) / 10}" cy="${Math.round(Y(Phi) * 10) / 10}"`)) fail(`${tag} t=${t}: the dot is not on the graph`);
          const kl = t > 0 ? -volt(g, t - 1e-7) : null, kr = t < T ? -volt(g, Math.min(t + 1e-7, T - 1e-9)) : null, kink = kl !== null && kr !== null && Math.abs(kl - kr) > 1e-6;
          const m = html.match(/class="hv-tan" d="M([\d.-]+),([\d.-]+) L([\d.-]+),([\d.-]+)"/);
          if (kink) { kinks++; if (m) fail(`${tag} t=${t}: a tangent at a kink`); continue; }
          if (!m) { fail(`${tag} t=${t}: no tangent`); continue; }
          tangents++;
          const [x1, y1, x2, y2] = m.slice(1).map(Number), slope = kr === null ? kl : kr;
          // in graph units: the slope, and the touching point on the line
          const sl = ((Y(0) - y2) - (Y(0) - y1)) / (Y(0) - Y(1)) / ((x2 - x1) / (X(1) - X(0)));
          if (Math.abs(x2 - x1) < 1e-6 || Math.abs(sl - slope) > 0.06) fail(`${tag} t=${t}: the tangent's slope ${sl} is not ${slope}`);
          const yAt = y1 + ((y2 - y1) * (X(t) - x1)) / (x2 - x1);
          if (Math.abs(yAt - Y(Phi)) > 0.3) fail(`${tag} t=${t}: the tangent does not touch the graph`);
          if (Math.min(x1, x2) < X(0) - 0.1 || Math.max(x1, x2) > X(T) + 0.1 || Math.min(y1, y2) < Y(PHI_MAX) - 0.1 || Math.max(y1, y2) > Y(0) + 0.1) fail(`${tag} t=${t}: the tangent leaves the plot`);
          const span = Math.abs(x2 - x1) / (X(1) - X(0)), edge = (y) => Math.abs(y - Y(0)) < 0.2 || Math.abs(y - Y(PHI_MAX)) < 0.2;
          if (span < 2 - 1e-6 && !(edge(y1) || edge(y2) || Math.min(x1, x2) < X(0) + 0.2 || Math.max(x1, x2) > X(T) - 0.2)) fail(`${tag} t=${t}: the tangent is short (${span} s)`);
          if (/mWb\/s|mV/.test(read)) fail(`${tag}: the slope in the readout`);
        }
        // the voltage graph: its value, no tangent; the guide line for the drawing below
        for (const t of [0, 1.5, 3.2, 8]) {
          const v = volt(g, Math.min(t, T - 1e-9)), html = cursor('volt', g, t, { tangent: true }), read = html.match(/<text class="hv-read"[^>]*>(.*?)<\/text>/)[1].replace(/<[^>]+>/g, '');
          if (read !== `t = ${fix(t)} s, ${lang === 'de' ? 'U' : 'V'}ind = ${fix(v)} mV` || html.includes('hv-tan')) fail(`${tag} t=${t}: the voltage readout ${read}`);
          if (!html.includes(`cy="${Math.round(Yv(v) * 10) / 10}"`)) fail(`${tag} t=${t}: the dot is not on the voltage graph`);
          for (const kind of ['flux', 'volt']) if (!guide(kind, t).includes(`x1="${Math.round(X(t) * 10) / 10}"`)) fail(`${tag}: the guide line of the ${kind} drawing is not at t`);
        }
      }
    }
  }
  for (const [px, want] of [[X(0), 0], [X(2.04), 2], [X(8), 8], [X(0) - 30, null], [X(8) + 30, null], [X(0) - 8, 0]]) if (timeAt(px) !== want) fail(`timeAt(${px}) = ${timeAt(px)}, not ${want}`);
  if (tangents < 1000 || kinks < 100) fail(`cursor: few tangents (${tangents}) or kinks (${kinks})`);
  console.log(`cursor: ${tangents} tangents, ${kinks} kinks`);
  Lang.set('en');
}

if (failures) { console.error(`${failures} failures`); process.exit(1); }
console.log('all checks passed');
