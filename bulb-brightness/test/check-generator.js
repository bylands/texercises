// Verifies the bulb exercises: run with `node bulb-brightness/test/check-generator.js`.
// For many seeds per level it checks that
// - every answer holds for bulbs with very different characteristics (resistance rising or
//   falling with the current, or constant), found by solving the circuit numerically,
// - the voltage bounds behind each answer hold for all these bulbs,
// - the batteries are never short-circuited, and harder levels have varied answers,
// - diagnose() accepts the right answers and recognises the answers that the misconception
//   models predict (fixed current, reversed battery ignored, short-circuited bulb still lit),
// - the diagram renders.
'use strict';

const { LEVELS, generate, diagnose } = require('../generator.js');
const { circuit } = require('../draw.js');

const SAMPLES = 400;
let failures = 0;
const fail = (msg) => { failures++; if (failures < 30) console.error('  FAIL ' + msg); };
const val = (f) => f.n / f.d;
const clone = (x) => JSON.parse(JSON.stringify(x));

// Bulb characteristics I = g(V), all increasing with g(0) = 0 (units: V0 and the reference current g(1)).
const BULBS = {
  'V^0.6 (filament)': (v) => Math.pow(v, 0.6),
  ohmic: (v) => v,
  'V^2.5': (v) => Math.pow(v, 2.5),
  'V/(1+V)': (v) => v / (1 + v),
  'sinh V': (v) => Math.sinh(v),
  'V+V^3': (v) => v + v * v * v,
};

// Solve a circuit made of bulbs with characteristic g by bisection: the current a part lets
// through at a voltage, and the voltage it needs for a current.
function solver(g) {
  const shorted = (n) => n.t === 'W' || (n.t === 'P' ? n.kids.some(shorted) : n.t === 'S' && n.kids.every(shorted));
  const bisect = (f, target, hi) => { let lo = 0; while (f(hi) < target) hi *= 2; for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2; if (f(m) < target) lo = m; else hi = m; } return (lo + hi) / 2; };
  function current(n, v) {
    if (n.t === 'L') return g(v);
    if (n.t === 'P') return n.kids.reduce((s, k) => s + current(k, v), 0);
    return bisect((i) => voltage(n, i), v, 1);
  }
  function voltage(n, i) {
    if (shorted(n)) return 0;
    if (n.t === 'L') return bisect(g, i, 1);
    if (n.t === 'S') return n.kids.reduce((s, k) => s + voltage(k, i), 0);
    return bisect((v) => current(n, v), i, 1);
  }
  // Voltage across every bulb (reading order) when the load gets the voltage v.
  return function bulbs(n, v, out = []) {
    if (n.t === 'L') out[n.i] = v;
    if (n.t === 'P') n.kids.forEach((k) => bulbs(k, shorted(n) ? 0 : v, out));
    if (n.t === 'S') {
      const i = shorted(n) ? 0 : current(n, v);
      n.kids.forEach((k) => bulbs(k, voltage(k, i), out));
    }
    return out;
  };
}

const ANSWER_FOR = (v, ref) => (v < 1e-6 ? 'off' : Math.abs(v - ref) < 1e-6 ? 'equal' : v > ref ? 'brighter' : 'dimmer');
const inside = (v, iv) => {
  const lo = val(iv.lo), hi = val(iv.hi), e = 1e-6;
  return (iv.loS ? v > lo + e : v > lo - e) && (iv.hiS ? v < hi - e : v < hi + e);
};

for (const level of Object.keys(LEVELS)) {
  const t0 = Date.now();
  const answers = {}, codes = {}, seen = new Set();
  let shorts = 0, reversed = 0, trapped = 0;
  for (let seed = 1; seed <= SAMPLES; seed++) {
    const tag = `${level} ${seed}`;
    const ex = generate(level, seed);
    seen.add(JSON.stringify([ex.pack, ex.load]));
    ex.bulbs.forEach((b) => { answers[b.answer] = (answers[b.answer] || 0) + 1; });

    for (const [label, g] of Object.entries(BULBS)) {
      const vs = solver(g)(ex.load, val(ex.E));
      ex.bulbs.forEach((b, i) => {
        // The reference bulb gets V0 = 1; brightness grows with the voltage.
        if (ANSWER_FOR(vs[i], 1) !== b.answer) fail(`${tag}: ${b.name} is ${ANSWER_FOR(vs[i], 1)} for ${label} bulbs (V = ${vs[i].toFixed(4)}), not ${b.answer}`);
        if (!inside(vs[i], b.iv)) fail(`${tag}: ${b.name} has V = ${vs[i].toFixed(4)} for ${label} bulbs, outside its bounds`);
      });
    }
    if (level !== 'easy' && val(ex.E) !== 0 && new Set(ex.bulbs.map((b) => b.answer)).size < 2) fail(`${tag}: every bulb has the same answer`);

    const right = ex.bulbs.map((b) => b.answer);
    if (diagnose(ex, right).some((c) => c !== 'right')) fail(`${tag}: right answers not accepted`);
    // Every misconception model that gets a bulb wrong must be recognised (not 'other').
    for (const model of ['fixedCurrent', 'forward']) {
      const given = ex.bulbs.map((b) => b.models[model] || b.answer);
      diagnose(ex, given).forEach((c, i) => {
        if (given[i] !== right[i] && (c === 'right' || c === 'other')) fail(`${tag}: ${model} answer for ${ex.bulbs[i].name} diagnosed as ${c}`);
        if (c !== 'right') codes[c] = (codes[c] || 0) + 1;
      });
    }
    if (ex.bulbs.some((b) => b.shorted)) {
      const given = ex.bulbs.map((b) => (b.shorted ? 'dimmer' : b.answer));
      diagnose(ex, given).forEach((c, i) => { if (ex.bulbs[i].shorted && c !== 'short') fail(`${tag}: lit short-circuited bulb diagnosed as ${c}`); });
      shorts++;
    }
    if (ex.reversed) reversed++;
    if (ex.bulbs.some((b) => b.models.fixedCurrent && b.models.fixedCurrent !== b.answer)) trapped++;

    const svg = circuit(clone(ex.load), clone(ex.pack), (i) => ({ label: `L${i + 1}`, glow: 0.5 }));
    if (!svg.startsWith('<svg') || /NaN|undefined/.test(svg)) fail(`${tag}: diagram`);
  }
  const pct = (x) => `${Math.round((100 * x) / SAMPLES)}%`;
  console.log(`${level}: ${SAMPLES} seeds, ${seen.size} distinct circuits, ${Date.now() - t0} ms`);
  console.log(`  answers ${JSON.stringify(answers)}; short circuits ${pct(shorts)}, reversed battery ${pct(reversed)}, fixed-current trap ${pct(trapped)}`);
  console.log(`  misconception models recognised as ${JSON.stringify(codes)}`);
}

if (failures) { console.error(`\n${failures} failures`); process.exit(1); }
console.log('Generator OK');
