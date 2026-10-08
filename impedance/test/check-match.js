// Verifies the matching exercise (match.js): run with `node impedance/test/check-match.js`.
// It checks that
// - the features of every circuit (what Z does for ω → 0, for ω → ∞ and at ω₀), worked out by the
//   rules taught, agree with Z(ω), and that no two circuits share all of them,
// - every exercise has four different curves, exactly one of which fits all the answers; for each
//   feature, a wrong curve shares it where some circuit of the pool does (so no single feature is
//   enough; the circuits of two elements only come with each other, and no other circuit has the
//   minimum or maximum R of RLC in series or in parallel),
// - every question has exactly one right option, and every text is complete in both languages,
// - sketches and schematics of every circuit render in both axis modes,
// - the worked example of the tutor rules out one curve per question.
'use strict';

const Lang = require('../lang.js');
const I = require('../generator.js');
const P = require('../plot.js');
const M = require('../match.js');
const { EXAMPLES } = require('../lessons.js');

let failures = 0;
const fail = (msg) => { failures++; if (failures < 30) console.error('  FAIL ' + msg); };
const bad = (html) => /undefined|NaN|null|\[object/.test(html);

// the features against Z(ω), for each sharpness q
for (const id of M.IDS) {
  const f = M.features(id);
  for (const q of [0.7, 0.8, 1, 1.2, 1.4]) {
    const c = M.circuit(id, q), z = (w) => I.Z(c, w);
    const end = (v, w) => (v === '0' ? z(w) < 1e-3 : v === 'R' ? Math.abs(z(w) - 1) < 1e-3 : z(w) > 1e3);
    if (!end(f.lo, 1e-6)) fail(`${id} q=${q}: ω → 0 is not ${f.lo} (Z = ${z(1e-6)})`);
    if (!end(f.hi, 1e6)) fail(`${id} q=${q}: ω → ∞ is not ${f.hi} (Z = ${z(1e6)})`);
    const z0 = z(1), side = Math.min(z(0.9), z(1.1)), top = Math.max(z(0.9), z(1.1));
    const ok = {
      none: () => { const ws = Array.from({ length: 400 }, (x, k) => 10 ** (-3 + (6 * k) / 399)), d = ws.slice(1).map((w, k) => Math.sign(z(w) - z(ws[k]))); return d.every((x) => x === d[0]); },
      minR: () => Math.abs(z0 - 1) < 1e-9 && side > 1,
      maxR: () => Math.abs(z0 - 1) < 1e-9 && top < 1,
      zero: () => z0 < 1e-6 && side > z0,
      inf: () => z0 > 1e6 && top < z0,
    }[f.res];
    if (!ok()) fail(`${id} q=${q}: at ω₀ not ${f.res} (Z = ${z0})`);
  }
}
const triples = new Set(M.IDS.map((id) => JSON.stringify(M.features(id))));
if (triples.size !== M.IDS.length) fail('two circuits share all features');

// exercises
let n = 0;
for (const lang of ['en', 'de']) {
  Lang.set(lang, true);
  for (const id of M.IDS) {
    for (let seed = 1; seed <= 300; seed++) {
      const ex = M.generate(id, seed), tag = `${lang} ${id}-${seed}`;
      n++;
      if (new Set(ex.cands).size !== 4 || ex.cands[ex.right] !== id) fail(`${tag}: curves ${ex.cands}`);
      const all = M.phases(id), fitting = ex.cands.filter((x, k) => M.fits(ex, k, all));
      if (fitting.length !== 1) fail(`${tag}: ${fitting.length} curves fit`);
      const pool = M.IDS.filter((x) => x !== id && (M.NETS[id].level > 1 || M.NETS[x].level === 1));
      for (const k of all) {
        const shares = (x) => M.features(x)[k] === M.features(id)[k];
        if (pool.some(shares) && !ex.cands.some((x, j) => j !== ex.right && shares(x))) fail(`${tag}: no wrong curve shares ${k}`);
      }
      const items = M.items(ex);
      if (items.length !== all.length) fail(`${tag}: ${items.length} questions`);
      for (const it of items) {
        if (it.options.filter((o) => o.right).length !== 1) fail(`${tag}: question ${it.key} has not one right option`);
        if (bad(it.what + it.value + it.options.map((o) => o.html + o.why).join(''))) fail(`${tag}: text of question ${it.key}`);
      }
      const sol = M.solution(ex);
      if (sol.others.length !== 3 || bad(JSON.stringify(sol)) || bad(M.hints(ex).join(''))) fail(`${tag}: solution or hints`);
    }
  }
}
Lang.set('en', true);
console.log(`exercises: ${n}`);

// drawings
for (const id of M.IDS) {
  const c = M.circuit(id, 1);
  if (bad(P.schematic(c))) fail(`${id}: schematic`);
  for (const mode of ['lin', 'log']) {
    const svg = P.sketch(c, mode, { w0: 1, zref: 1, R: 1, marks: M.marks(id) });
    if (bad(svg) || !/class="curve" d="M/.test(svg)) fail(`${id} ${mode}: sketch`);
  }
}

// the worked example: four curves, one ruled out by each question, one left
const ex = EXAMPLES.find((e) => e.match), m = ex.match, e = { ...m, right: m.cands.indexOf(m.net) };
const ks = M.phases(m.net);
ks.forEach((k, i) => {
  const before = m.cands.filter((x, j) => M.fits(e, j, ks.slice(0, i))).length, after = m.cands.filter((x, j) => M.fits(e, j, ks.slice(0, i + 1))).length;
  if (before - after !== 1) fail(`worked example: question ${k} rules out ${before - after} curves`);
});

if (failures) { console.error(`\n${failures} failures`); process.exit(1); }
console.log('Matching OK');
