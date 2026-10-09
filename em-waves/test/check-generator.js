// Verifies the Electromagnetic Waves generator: run with `node em-waves/test/check-generator.js`.
// For many seeds per exercise type and both languages it checks
// - the answers, worked out again here from the parameters (c = λ·f, v = c/n, Thomson's formula,
//   E = c·B, E × B along c, I = P/(4πr²), I = ½ε₀cÊ², Malus' law, λ/2 and λ/4 antennas, standing
//   waves) and the region of the spectrum from the wavelength,
// - one right option per choice, distinct options, an explanation for every wrong one, traps that
//   differ from the answer, four options in every arcade question,
// - that texts, hints, solutions and figures contain no undefined values (and no ß in German),
// - that every type has enough different exercises,
// - the tutor's examples and topics, and the problems.
'use strict';

const Lang = require('../lang.js');
global.window = globalThis;
for (const f of ['core', 'plot', 'figkit', 'figures', 'scenarios', 'generator', 'realproblems', 'lessons']) require(`../${f}.js`);
const { EW, EWaves, Scenarios, Lessons, EWProblems } = globalThis;

let failures = 0, checked = 0;
const fail = (msg) => { failures++; if (failures < 400) console.log('  FAIL ' + msg); };
const close = (a, b, tol = 2e-3) => Math.abs(a - b) <= tol * Math.max(1e-300, Math.abs(b));
const c = 3.00e8, eps0 = 8.854e-12, DEG = Math.PI / 180;
const Ehat = (I) => Math.sqrt((2 * I) / (c * eps0));

// the region of the spectrum of a wavelength (borders as in a textbook)
function region(lam) {
  if (lam < 1e-11) return 'gamma';
  if (lam < 1e-8) return 'xray';
  if (lam < 380e-9) return 'uv';
  if (lam < 780e-9) return 'vis';
  if (lam < 1e-3) return 'ir';
  if (lam < 1) return 'micro';
  return 'radio';
}
const DIR = { xp: [1, 0, 0], xm: [-1, 0, 0], yp: [0, 1, 0], ym: [0, -1, 0], zp: [0, 0, 1], zm: [0, 0, -1] };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const same = (a, b) => a.every((x, i) => x === b[i]);

// The answers of an exercise type, from its parameters p (and v, for values the exercise rounds
// before it gives them: the wavelength in a medium, the field B given).
const EXPECT = {
  'spec-lf': (p, v) => ({ lam: EW.sig(p.x, 3), f: c / v.lam, reg: region(p.x) }), // the wavelength given to 3 digits
  'spec-fl': (p, v) => ({ f: EW.sig(c / p.x, 3), lam: c / v.f, reg: region(c / v.f) }),
  'spec-echo': (p) => ({ d: (c * p.t) / 2 }),
  medium: (p) => { const n = Scenarios.MATS[p.m][2]; return { v: c / n, f: c / p.lam0, lam: p.lam0 / n }; },
  'medium-back': (p, v) => ({ n: p.lam0 / v.lam, v: (c * v.lam) / p.lam0 }),
  'lc-f': (p) => ({ f: 1 / (2 * Math.PI * Math.sqrt(p.L * p.C)), T: 2 * Math.PI * Math.sqrt(p.L * p.C) }),
  'lc-c': (p) => ({ C: 1 / (4 * Math.PI ** 2 * p.f ** 2 * p.L), lam: c / p.f }),
  'lc-energy': (p) => ({ W: 0.5 * p.C * p.U ** 2, I: p.U * Math.sqrt(p.C / p.L) }), // ½CU² = ½LI²
  'eb-ratio': (p, v) => (p.give === 'E' ? { B: p.E / c } : { E: EW.sig(p.E / c, 3) * c }),
  point: (p) => { const I = p.P / (4 * Math.PI * p.r ** 2); return { I, E: Ehat(I) }; },
  'inv-sq': (p) => ({ I2: p.I1 / p.k ** 2, e: 1 / p.k }),
  beam: (p) => { const I = p.P / (Math.PI * (p.d / 2) ** 2); return { I, E: Ehat(I) }; },
  'eb-int': (p) => ({ E: Ehat(p.I), B: Ehat(p.I) / c }),
  malus: (p) => ({ I1: p.I0 / 2, I2: (p.I0 / 2) * Math.cos(p.a * DEG) ** 2 }),
  'malus-angle': (p) => ({ a: Math.acos(Math.sqrt(p.s)) / DEG }),
  'malus-three': (p) => ({ I2: (p.I0 / 2) * Math.cos(p.a * DEG) ** 2, I3: (p.I0 / 2) * Math.cos(p.a * DEG) ** 2 * Math.sin(p.a * DEG) ** 2 }),
  dipole: (p) => ({ lam: c / p.f, l: (c / p.f) / (p.kind === 'half' ? 2 : 4) }),
  standing: (p) => ({ lam: (2 * p.d) / (p.m - 1), f: (c * (p.m - 1)) / (2 * p.d) }),
};

const bad = /undefined|NaN|Infinity|\[object|\$\$\$/;
function texts(ex) {
  return [ex.title, ex.text, ...ex.hints, ...ex.solution, ex.results, ex.figure({ task: true }) || '', ex.solutionFigure() || '',
    ...ex.fields.flatMap((f) => [f.what, f.ask || '', ...(f.options || []).flatMap((o) => [o[1], o[2] || '']), ...(f.traps || []).map((t) => t.why)])].join('\n');
}

function checkFields(ex, where) {
  for (const f of ex.fields) {
    if (f.type === 'num') {
      if (!Number.isFinite(f.value) || f.value <= 0) fail(`${where}: ${f.key} = ${f.value}`);
      if (!(f.unit in EW.UNITS)) fail(`${where}: unknown unit ${f.unit}`);
      for (const t of f.traps || []) {
        if (close(t.value, f.value, 0.015)) fail(`${where}: trap ${t.flag} equals the answer`);
        if (!t.why) fail(`${where}: trap ${t.flag} without explanation`);
      }
    } else {
      const keys = f.options.map((o) => o[0]);
      if (new Set(keys).size !== keys.length) fail(`${where}: options not distinct`);
      if (new Set(f.options.map((o) => o[1])).size !== keys.length) fail(`${where}: option texts not distinct`);
      if (keys.filter((k) => k === f.value).length !== 1) fail(`${where}: ${keys.filter((k) => k === f.value).length} right options`);
      for (const o of f.options) if (o[0] !== f.value && !o[2]) fail(`${where}: wrong option ${o[0]} without explanation`);
    }
  }
}

for (const lang of ['en', 'de']) {
  Lang.set(lang, true);
  for (const scn of EWaves.SCENARIOS) {
    const seen = new Set();
    for (let seed = 1; seed <= 150; seed++) {
      const where = `${lang} ${scn.id} seed ${seed}`;
      let ex;
      try { ex = EWaves.practiceOf(scn.id, seed); } catch (e) { fail(`${where}: ${e.message}`); continue; }
      checked++;
      seen.add(JSON.stringify(ex.p));
      checkFields(ex, where);
      const all = texts(ex);
      if (bad.test(all)) fail(`${where}: ${all.match(bad)[0]} in the texts`);
      if (lang === 'de' && /ß/.test(all)) fail(`${where}: ß`);
      // the answers again
      const want = EXPECT[scn.id] && EXPECT[scn.id](ex.p, ex.v);
      if (want) {
        for (const [k, x] of Object.entries(want)) {
          if (typeof x === 'string') { if (ex.v[k] !== x) fail(`${where}: ${k} = ${ex.v[k]}, expected ${x}`); } else if (!close(ex.v[k], x)) fail(`${where}: ${k} = ${ex.v[k]}, expected ${x}`);
        }
      }
      for (const f of ex.fields) if (f.type === 'num' && !close(f.value, EW.inUnit(ex.v[f.key], f.unit), 1e-9)) fail(`${where}: ${f.key} not in its unit`);
      if (scn.id === 'eb-dir') {
        const { E, B, c: cc, ans } = ex.v;
        if (!same(cross(DIR[E], DIR[B]), DIR[cc])) fail(`${where}: E × B is not along c`);
        if (ans !== ex.v[ex.p.miss]) fail(`${where}: wrong direction asked`);
      }
      if (scn.id === 'eb-phase') {
        const x = ex.p.xs['PQRS'.indexOf(ex.v.pt)], s = Math.abs(Math.sin(2 * Math.PI * x));
        if (ex.p.ask === 'zero' ? s > 1e-9 : s < 1 - 1e-9) fail(`${where}: ${ex.v.pt} is not where B is ${ex.p.ask}`);
        if (ex.p.xs.filter((y) => (ex.p.ask === 'zero' ? Math.abs(Math.sin(2 * Math.PI * y)) < 1e-9 : Math.abs(Math.sin(2 * Math.PI * y)) > 1 - 1e-9)).length !== 1) fail(`${where}: not one point fits`);
      }
      if (scn.id === 'lc-scale') {
        const LC = ex.p.what === 'both' ? ex.p.k ** 2 : ex.p.k, f = ex.fields[0], right = f.options.find((o) => o[0] === 'right');
        const shown = right[1].match(/\\times (?:\\tfrac\{1\}\{([\d.]+)\}|([\d.]+))/);
        const factor = shown[1] ? 1 / Number(shown[1]) : Number(shown[2]);
        if (!close(factor, 1 / Math.sqrt(LC), 1e-2)) fail(`${where}: factor ${factor}, expected ${1 / Math.sqrt(LC)}`);
      }
      // the arcade's question
      const qz = EWaves.quiz(ex, seed);
      if (qz.options.length !== 4) fail(`${where}: quiz with ${qz.options.length} options`);
      if (qz.options.filter((o) => o.correct).length !== 1) fail(`${where}: quiz without one right option`);
      if (new Set(qz.options.map((o) => o.html)).size !== 4) fail(`${where}: quiz options alike`);
    }
    if (seen.size < 8) fail(`${lang} ${scn.id}: only ${seen.size} different exercises`);
  }

  // the problems
  EWProblems.PROBLEMS.forEach((pb, i) => {
    for (let seed = 1; seed <= 60; seed++) {
      const where = `${lang} problem ${pb.id} seed ${seed}`;
      let ex;
      try { ex = EWProblems.realOf(i, seed); } catch (e) { fail(`${where}: ${e.message}`); continue; }
      checked++;
      checkFields(ex, where);
      const all = texts(ex);
      if (bad.test(all)) fail(`${where}: ${all.match(bad)[0]} in the texts`);
      if (lang === 'de' && /ß/.test(all)) fail(`${where}: ß`);
      const { p, v } = ex;
      const want = {
        oven: () => ({ lam: 2 * p.d, c: 2 * p.d * p.f }),
        radio: () => ({ Cmin: 1 / (4 * Math.PI ** 2 * 108e6 ** 2 * p.L), Cmax: 1 / (4 * Math.PI ** 2 * 87.5e6 ** 2 * p.L) }),
        mast: () => { const I = p.P / (4 * Math.PI * p.r ** 2); return { I, E: Ehat(I), ok: Ehat(I) <= 5 ? 'yes' : 'no' }; },
        sun: () => ({ P: 1361 * 4 * Math.PI * (1.496e11) ** 2 }),
        mars: () => ({ t: p.d / c, t2: (2 * p.d) / c }),
        glasses: () => ({ share: Math.cos(p.a * DEG) ** 2, b: Math.acos(Math.sqrt(p.s)) / DEG }),
        router: () => ({ l1: c / p.f1 / 4, l2: c / p.f2 / 4 }),
      }[pb.id]();
      for (const [k, x] of Object.entries(want)) {
        if (typeof x === 'string') { if (v[k] !== x) fail(`${where}: ${k} = ${v[k]}, expected ${x}`); } else if (!close(v[k], x)) fail(`${where}: ${k} = ${v[k]}, expected ${x}`);
      }
    }
  });

  // the tutor's examples and the topics
  Lessons.EXAMPLES.forEach((e, i) => {
    const t = EWaves.tutorial(e), all = [e.name(), e.idea(), ...t.frames.map((f) => f.text + (f.figure || ''))].join('\n');
    if (t.frames.length < 3) fail(`${lang} example ${i}: only ${t.frames.length} frames`);
    if (bad.test(all)) fail(`${lang} example ${i}: ${all.match(bad)[0]}`);
    if (lang === 'de' && /ß/.test(all)) fail(`${lang} example ${i}: ß`);
  });
  const types = new Set();
  Lessons.TOPICS.forEach((tp, i) => tp.stages.forEach((s, k) => {
    s.types.forEach((id) => { types.add(id); if (!EWaves.byId(id)) fail(`topic ${i}: unknown type ${id}`); });
    const ex = tp.example(k);
    if (!Lessons.EXAMPLES[ex]) fail(`topic ${i} stage ${k}: no example ${ex}`);
  }));
  for (const s of EWaves.SCENARIOS) if (!types.has(s.id)) fail(`type ${s.id} is in no topic`);
}

// the example in the tutor: 532 nm is green light at 564 THz
Lang.set('en', true);
const green = EWaves.exercise(EWaves.byId('spec-lf'), Lessons.EXAMPLES[0].p);
if (!close(green.v.f, 5.64e14, 1e-3) || green.v.reg !== 'vis') fail(`tutor example 1: f = ${green.v.f}, ${green.v.reg}`);

console.log(failures ? `${failures} failures in ${checked} exercises` : `All ${checked} exercises passed.`);
process.exit(failures ? 1 : 0);
