// Verifies the switching RL generator: run with `node rl-switch/test/check-generator.js`.
// For many seeds per level it checks, with a nodal analysis of the circuit, that
// - before t = 0 (inductors as wires) the inductor currents are right,
// - right after t = 0 (inductors as current sources) every current (in mA) and the size of every
//   induced emf (= the voltage across the coil) is right,
// - currents are whole mA and emfs multiples of 0.1 V, and the texts and diagrams contain no
//   undefined values.
// It also checks the tutorial examples.
'use strict';

const Lang = require('../lang.js');
const { LEVELS, generate, tutorial, config, fval } = require('../generator.js');
const { EXAMPLES } = require('../lessons.js');
const { solve } = require('./mna.js');

const SAMPLES = 400;
// undefined values in a text ("null" is a German word, so only in English)
const bad = () => (Lang.get() === 'de' ? /undefined|NaN|\[object/ : /undefined|NaN|\[object|null/);
let failures = 0;
const fail = (msg) => { failures++; if (failures < 30) console.error('  FAIL ' + msg); };
const close = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));

// Netlist: battery + at node 1, bottom rail = node 0, top rail = node T. Inductors are wires
// (0 V sources, `IL` null) or current sources with the currents IL (downwards).
function netlist(c, closed, IL) {
  const { main, bridged, active } = config(c, closed);
  const E = [['V', 'bat', 1, 0, fval(c.V)]];
  let next = 2, a = 1;
  if (c.sw.at === 'main') { const b = next++; if (main) E.push(['V', 'S', a, b, 0]); a = b; }
  if (c.r1) {
    const b = next++;
    E.push(['R', 'Rmain', a, b, fval(c.r1)]);
    if (bridged) E.push(['V', 'S', a, b, 0]);
    a = b;
  }
  const T = a;
  c.branches.forEach((br, j) => {
    if (!active[j]) return;
    let top = T;
    const parts = [br.R && 'R', br.L && 'L'].filter(Boolean);
    parts.forEach((kind, k) => {
      const bot = k === parts.length - 1 ? 0 : next++;
      if (kind === 'R') E.push(['R', `R${j}`, top, bot, fval(br.R)]);
      else if (IL) E.push(['I', `L${j}`, top, bot, fval(IL[j])]);
      else E.push(['V', `L${j}`, top, bot, 0]);
      top = bot;
    });
  });
  return { E, T };
}

function check(ex, tag) {
  const c = ex.circuit, st = ex.st;
  // before: resistors in branches with an inductor carry the inductor current
  const before = netlist(c, st.first, null);
  if (before.E.some((e) => e[0] === 'R')) {
    const s = solve(before.E);
    c.branches.forEach((b, j) => {
      if (b.L && b.R && config(c, st.first).main && !close(s.i(`R${j}`), fval(st.IL[j]))) fail(`${tag}: inductor current before t = 0 in branch ${j}`);
      if (!b.L && b.R && config(c, st.first).active[j] && !close(s.i(`R${j}`), fval(st.s0.Ib[j]))) fail(`${tag}: current before t = 0 in branch ${j}`);
    });
  }
  // right after
  const { E, T } = netlist(c, st.then, st.IL);
  const s = solve(E);
  const U = s.v(T);
  if (!close(U, fval(st.s1.U))) fail(`${tag}: U = ${U}, generator ${fval(st.s1.U)}`);
  for (const f of ex.fields) {
    let x;
    if (f.key === 'IR1') x = 1000 * s.i('Rmain');
    else if (f.key[0] === 'I') {
      const j = Number(f.key.slice(1)), b = c.branches[j];
      x = 1000 * (b.L ? fval(st.IL[j]) : config(c, st.then).active[j] ? s.i(`R${j}`) : 0);
    } else {
      const j = Number(f.key.slice(1)), b = c.branches[j];
      x = Math.abs(U - (b.R ? fval(b.R) * fval(st.IL[j]) : 0));
    }
    if (!close(x, f.value)) fail(`${tag}: ${f.key} = ${f.value}, nodal analysis ${x}`);
    const step = f.unit === 'mA' ? 1 : 0.1;
    if (!close(f.value / step, Math.round(f.value / step))) fail(`${tag}: ${f.key} = ${f.value} ${f.unit} is not a multiple of ${step}`);
  }
  for (const t of [ex.text, ex.situation, ex.title, ...ex.hints, ...ex.solution, ex.results, ex.figure(false), ex.figure(true)]) {
    if (bad().test(t)) fail(`${tag}: bad text: ${t.slice(0, 160)}`);
  }
  // German texts: no English left over (outside formulas)
  if (Lang.get() === 'de') {
    for (const t of [ex.text, ex.situation, ex.title, ...ex.hints, ...ex.solution]) {
      const words = t.replace(/\$\$[\s\S]*?\$\$/g, '').replace(/\$[^$]*\$/g, '');
      const m = words.match(/\b(the|and|with|current|switch|inductor|branch|voltage|right after)\b/i);
      if (m) fail(`${tag}: English "${m[0]}" in a German text: ${words.slice(0, 120)}`);
    }
  }
  // every paragraph of the solution explains in words, not only with a formula
  ex.solution.forEach((p, k) => {
    const words = p.replace(/\$\$[\s\S]*?\$\$/g, '').replace(/\$[^$]*\$/g, '').replace(/<[^>]+>/g, '').trim();
    if (words.length < 15) fail(`${tag}: solution paragraph ${k + 1} is only a formula`);
  });
}

for (const lang of ['en', 'de']) {
Lang.set(lang, true);
for (const level of Object.keys(LEVELS)) {
  const t0 = Date.now(), kinds = {};
  let rest = 0;
  for (let seed = 1; seed <= SAMPLES; seed++) {
    const tag = `${level} seed ${seed}`;
    let ex;
    try { ex = generate(level, seed); } catch (e) { fail(`${tag}: ${e.message}`); continue; }
    check(ex, tag);
    const want = { easy: [1, 2], medium: [3, 3], hard: [4, 5] }[level];
    if (!(ex.difficulty >= want[0] && ex.difficulty <= want[1])) fail(`${tag}: difficulty ${ex.difficulty} for ${level}`);
    const c = ex.circuit, k = `${c.sw.at} ${c.sw.before === 'open' ? 'closing' : 'opening'}`;
    kinds[k] = (kinds[k] || 0) + 1;
    if (ex.st.IL.every((x) => x.n === 0)) rest++;
  }
  // Starting with no inductor current should be the exception.
  if (rest > 0.25 * SAMPLES) fail(`${level}: ${rest} of ${SAMPLES} exercises start without inductor current`);
  console.log(`${lang} ${level}: ${((Date.now() - t0) / SAMPLES).toFixed(1)} ms/exercise, no inductor current before t = 0: ${Math.round((100 * rest) / SAMPLES)} %, switch ${JSON.stringify(kinds)}`);
}
}

for (const lang of ['en', 'de']) Lang.set(lang, true), EXAMPLES.forEach((e, i) => {
  const tag = `${lang} tutor example ${i + 1} (${e.name[lang]})`;
  let t;
  try { t = tutorial(e.circuit); } catch (err) { fail(`${tag}: ${err.message}`); return; }
  check(t.ex, tag);
  for (const f of t.frames) if (bad().test(f.text + f.figure)) fail(`${tag}: bad frame: ${f.text.slice(0, 120)}`);
  console.log(`${tag}: ${t.frames.length} frames, answers ${t.ex.fields.map((f) => `${f.sym} = ${f.value}`).join(', ')}`);
});

if (failures) { console.error(`\n${failures} failure(s)`); process.exit(1); }
console.log('\nGenerator OK');
