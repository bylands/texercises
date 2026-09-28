// Verifies every template: run with `node circuit-trainer/test/check-templates.js`.
// 1. The original values from resistor-circuits/*.md reproduce the givens and short solutions.
// 2. Random instances are valid, and a nodal analysis of each circuit (with the computed
//    unknowns inserted) reproduces all givens and intermediate quantities.
// 3. Both diagrams (task and solution) render without errors.
'use strict';

const { TEMPLATES, generate, valid } = require('../templates.js');
const { Sketch } = require('../circuit.js');
const { solve } = require('./mna.js');

// Givens and results (part 4) of the original exercises.
const ORIGINAL = {
  A: { V: 12, Ra: 4, I: 2, R: 2 },
  B: { I: 5, Ia: 2, Ra: 15, V: 30, R: 10 },
  C: { V: 25, Ra: 2, Rb: 2, Rc: 4, Ione: 5, Itwo: 2.5 },
  D: { Itot: 14, Ib: 8, Ra: 1, Rb: 3, V: 24, R: 3, I: 6 },
  E: { V: 52, Ra: 2, Rb: 4, Ia: 13, Ib: 6, Ic: 14, Rone: 4, Rtwo: 3, Ione: 27, Itwo: 8 },
  F: { V: 44, I: 12, Ia: 4, Rb: 1, Rc: 1, R: 2, Rone: 2, Itwo: 8 },
  G: { Itot: 9, Ic: 2, Ra: 2, Rb: 2, Rc: 4, V: 32, R: 3, I: 7 },
  H: { V: 54, I: 6, Ia: 2, Ra: 8, Rb: 12, Rone: 16, Rtwo: 1, Itwo: 4 },
  I: { V: 85, I: 360, Rb: 220, Rone: 500, Ione: 110, Itwo: 250 },
  J: { Ra: 6, Rb: 12, Rc: 6, Ia: 2, Ic: 4, V: 36, R: 3, I: 2 },
  K: { V: 18, Ra: 2, Rone: 2, Rtwo: 3, IR: 1, Vp: 6, R: 6, I: 6 },
  L: { V: 24, Rone: 4, Rtwo: 2, Rthree: 3, Rfour: 6, Ifour: 1, R: 2, I: 6, Vone: 12 },
};

const close = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));
let failures = 0;
const fail = (msg) => { failures++; console.error('  FAIL ' + msg); };

function checkNetlist(tpl, v, tag) {
  const { E, probes } = tpl.netlist(v);
  const s = solve(E);
  for (const [k, f] of Object.entries(probes)) {
    if (!close(f(s), v[k])) fail(`${tag}: nodal analysis gives ${k} = ${f(s)}, template says ${v[k]}`);
  }
}

function checkDraw(tpl, v, tag) {
  for (const sol of [false, true]) {
    const c = {
      sol, val: (k) => `${v[k]} ${tpl.q[k].u}`,
      lab(k) {
        if (!(k in tpl.q)) throw new Error(`unknown quantity ${k}`);
        if (tpl.given.includes(k)) return this.val(k);
        if (tpl.unknowns.includes(k)) return sol ? `$${tpl.q[k].sym}$ = ${this.val(k)}` : `$${tpl.q[k].sym}$`;
        return sol ? this.val(k) : null;
      },
    };
    try {
      const s = new Sketch();
      tpl.draw(s, c);
      if (!s.toSVG().startsWith('<svg')) fail(`${tag}: bad SVG`);
    } catch (e) { fail(`${tag}: draw(${sol ? 'solution' : 'task'}) threw ${e.message}`); }
  }
}

for (const tpl of TEMPLATES) {
  console.log(`${tpl.id}: ${tpl.title}`);
  for (const k of [...tpl.given, ...tpl.unknowns]) if (!(k in tpl.q)) fail(`${tpl.id}: ${k} missing from q`);

  const o = tpl.compute(tpl.original);
  for (const [k, x] of Object.entries(ORIGINAL[tpl.id])) {
    if (!close(o[k], x)) fail(`${tpl.id} original: ${k} = ${o[k]}, expected ${x}`);
  }
  if (!valid(tpl, o)) fail(`${tpl.id} original values are rejected by valid()`);
  checkNetlist(tpl, o, `${tpl.id} original`);
  checkDraw(tpl, o, `${tpl.id} original`);

  const seen = new Set();
  const t0 = Date.now();
  for (let seed = 1; seed <= 2000; seed++) {
    const v = generate(tpl, seed);
    seen.add(tpl.given.map((k) => v[k]).join(','));
    checkNetlist(tpl, v, `${tpl.id} seed ${seed}`);
    if (seed <= 20) checkDraw(tpl, v, `${tpl.id} seed ${seed}`);
  }
  console.log(`  ${seen.size} distinct exercises in 2000 samples (${Date.now() - t0} ms)`);
  if (seen.size < 10) fail(`${tpl.id}: too little variety`);
}

if (failures) { console.error(`\n${failures} failure(s)`); process.exit(1); }
console.log('\nAll templates OK');
