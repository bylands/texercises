// Verifies Photoelectric Effect: run with `node photons/test/check-exercises.js`. It checks
// - the physics against values worked out by hand: 532 nm is 5.64 · 10¹⁴ Hz and 2.33 eV; zinc
//   (4.27 eV) in 200 nm light gives 1.93 eV; h = 4.14 · 10⁻¹⁵ eV·s,
// - for every type, in both languages and many seeds: no undefined or NaN in any text or drawing;
//   hints and a solution; each choice or drawing has exactly one right option, every wrong one a
//   reason, no two alike; no HTML inside a drawing; statements are mixed; every number is finite, and its typical mistakes
//   give clearly different values; the right option of a choice is not always in the same place,
// - the numbers the student types (4.6e14, 4.6·10^14, 4,6 · 10¹⁴, the full number for a field in
//   10¹⁴ Hz) and how they are judged (a typical mistake gets its own reason),
// - the numbers are for the head: every photon energy a round number of eV (two decimals at most),
//   every work function and stopping voltage at most two decimals,
// - the check: every objective has kinds, a worked example and a practice topic; every kind gives
//   four different options, exactly one right, a reason for every wrong one with a misconception
//   flag the check knows (or none); a whole check (check.js) plans the right number of questions,
// - questions that wait for another (after) wait for an earlier one; Einstein's equation (b), (c)
//   wait for (a), the U₀(f) line (e) for (d),
// - the symbols f₀, λ₀ in English and f_G, λ_G in German, everywhere (practice, tutor, check),
//   and φ, V_s, E_k,max, V (British textbooks) in English where German has W, U₀, E_kin,max, U,
// - the spectrum: the labels of the marks under the scale, apart from each other and the captions.
'use strict';

global.window = globalThis;
const Lang = require('../lang.js');
const P = require('../physics.js');
const G = require('../plot.js');
const X = require('../exercises.js');
const Check = require('../check.js');
require('../app.js');
const A = globalThis.PhotonApp;

let failures = 0;
const fail = (msg) => { failures++; if (failures < 30) console.error('  FAIL ' + msg); };
const bad = (html) => /undefined|NaN|\[object|Infinity|[>(=:"]null\b/.test(html);
const badText = (html) => /undefined|NaN|\[object|Infinity|>null\b/.test(html); // the check's options carry flag: null
// HTML inside a drawing breaks it: SVG text takes <tspan>, not <i>, <sub>, <sup> or <b>
const htmlInSvg = (html) => (String(html).match(/<svg[\s\S]*?<\/svg>/g) || []).some((svg) => /<(i|sub|sup|b)>/.test(svg));
const json = (e) => JSON.stringify(e, (k, v) => (typeof v === 'function' ? undefined : v));
const near = (a, b, rel = 0.005) => Math.abs(a - b) <= rel * Math.max(Math.abs(a), Math.abs(b));
const SEEDS = 120;

// ---------------------------------------------------------------- the physics
if (!near(P.freq(532), 5.64e14) || !near(P.eV(532), 2.33)) fail('532 nm: 5.64 · 10¹⁴ Hz, 2.33 eV');
if (!near(P.ekin(200, 4.27), 1.93, 0.01)) fail('zinc in 200 nm light: 1.93 eV');
if (!near(P.hEV, 4.14e-15)) fail('h = 4.14 · 10⁻¹⁵ eV·s');
if (bad(G.ufGraph({ pts: [[5, 0.2], [7, 1]], line: { slope: 0.4, icept: -1.8 }, solve: true })) || bad(G.ufGraph({ pts: [[7, 0.4]], line: { slope: 0.4, icept: -2.4 }, draw: true })) || bad(G.ivGraph([{ U0: 1, I: 10 }])) || bad(G.bar([{ nm: 500, label: 'x' }])) || bad(G.bars(3, 2)) || bad(G.cell({ counter: true }))) fail('a drawing');

// ---------------------------------------------------------------- typing numbers
const PARSE = [['4.6e14', 4.6e14], ['4.6·10^14', 4.6e14], ['4,6 · 10^14', 4.6e14], ['4.6 x 10^-19', 4.6e-19], ['4.6*10^(-19)', 4.6e-19], ['4.6·10¹⁴', 4.6e14], ['−0.75', -0.75], ['2.33 eV', 2.33], ['.5', 0.5], ['abc', NaN], ['', NaN]];
for (const [s, v] of PARSE) { const x = A.parse(s); if (!(Number.isNaN(v) ? Number.isNaN(x) : near(x, v, 1e-9))) fail(`parse ${s}: ${x}`); }
Lang.set('en', true);
{
  const q = X.numQ('f', 'f', 'f', '10¹⁴ Hz', 5.64, { scale: 1e14 });
  if (A.judge(5.64, q).cls !== 'ok' || A.judge(5.64e14, q).cls !== 'ok' || A.judge(5.6, q).cls !== 'ok') fail('a frequency in 10¹⁴ Hz');
  if (A.judge(56.4, q).cls !== 'warn' || A.judge(-5.64, q).cls !== 'warn' || A.judge(9, q).cls !== 'bad') fail('the power of ten, the sign, a wrong value');
  const k = X.numQ('ek', 'E', 'E', 'eV', 1.93, { tol: 0.02, wrong: [{ value: 6.2, tag: 'noW', why: 'WHY' }] });
  if (A.judge(6.2, k).msg !== 'WHY') fail('a typical mistake gets its reason');
}

// ---------------------------------------------------------------- the exercises
function checkQuestions(tag, e) {
  if (!e.questions.length) fail(`${tag}: no questions`);
  for (const q of e.questions) {
    if (q.type === 'multi') {
      if (!q.statements.some((s) => s.ok) || !q.statements.some((s) => !s.ok)) fail(`${tag}: statements all of one kind`);
      if (q.statements.some((s) => !s.why)) fail(`${tag}: a statement without a reason`);
      continue;
    }
    if (q.type === 'num') {
      if (!Number.isFinite(q.value) || !(q.tol > 0) || !q.label) fail(`${tag} ${q.key}: the value ${q.value}`);
      if (/^[\d.−-]/.test(String(q.sym))) fail(`${tag} ${q.key}: a number as the symbol (${q.sym})`);
      for (const w of q.wrong) if (!w.why || !w.tag || Math.abs(w.value / q.value - 1) < 0.06) fail(`${tag} ${q.key}: a mistake too close to the answer or without a reason`);
      if (A.judge(Number(String(P.round(q.value, 3))), q).cls !== 'ok') fail(`${tag} ${q.key}: the rounded answer is not accepted`);
      continue;
    }
    const n = q.options.filter((o) => o.ok).length;
    if (n !== 1) fail(`${tag} ${q.key}: ${n} right options`);
    if (q.options.some((o) => !o.ok && !o.why)) fail(`${tag} ${q.key}: a wrong option without a reason`);
    const labels = q.options.map((o) => o.label || o.html);
    if (new Set(labels).size !== labels.length) fail(`${tag} ${q.key}: two options alike`);
  }
}
// the right option of a choice is not always in the same place (unless the options are ordered, as angles)
{
  const at = {}, note = (tag, e) => { for (const q of e.questions) if (q.options) (at[`${tag} ${q.key}`] = at[`${tag} ${q.key}`] || new Set()).add(q.options.findIndex((o) => o.ok)); };
  for (const type of X.TYPES) for (let seed = 1; seed <= SEEDS; seed++) note(type, X.make(type, seed));
  for (const [k, v] of Object.entries(at)) if (v.size === 1) fail(`${k}: the right option is always number ${[...v][0] + 1}`);
}
for (const lang of ['en', 'de']) {
  Lang.set(lang, true);
  for (const type of X.TYPES) {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const e = X.make(type, seed), tag = `${type} ${seed} ${lang}`;
      if (bad(json(e))) fail(`${tag}: undefined or NaN`);
      if (htmlInSvg(json(e))) fail(`${tag}: HTML in a drawing`);
      if (!e.hints.length || !e.solution.length || !e.title || !e.p) fail(`${tag}: no hints, solution, title or parameters`);
      checkQuestions(tag, e);
      if (lang === 'de') continue;
      // numbers for the head: photon energies, work functions and stopping voltages in eV with two decimals at most
      for (const q of e.questions) if (q.type === 'num' && q.unit === 'eV' && !['W'].includes(q.key) && Math.abs(q.value * 100 - Math.round(q.value * 100)) > 1e-6) fail(`${tag} ${q.key}: ${q.value} eV is not a round number`);
      if (type === 'photo-calc' && e.questions.length > 1 && e.questions[1].key === 'ek' && Math.abs(e.questions[1].value - e.questions[2].value) > 1e-9) fail(`${tag}: E_kin,max in eV and U₀ in V are the same number`);
      if (type === 'photo-line' && (!near(e.questions[2].value, P.hEV * e.questions[0].value * 1e14) || !near(e.questions[1].value * e.questions[0].value, 3000))) fail(`${tag}: W = h·f_G and λ_G = c/f_G`);
    }
  }
  // the check: each objective's kinds, many seeds
  const flags = new Set(Object.keys(A.CONCEPT)), names = A.concepts();
  for (const idea of new Set(Object.values(A.CONCEPT))) if (!names[idea] || badText(names[idea])) fail(`the misconception ${idea} has no name (${lang})`);
  A.OBJECTIVES.forEach((o) => {
    if (!o.kinds.length || !(o.tutor >= 0 && o.tutor < A.LESSONS.length) || !(o.topic >= 0 && o.topic < A.TOPICS.length) || !o.name()) fail(`objective ${o.id}: kinds, worked example, topic or name`);
    for (const kind of o.kinds) {
      for (let seed = 1; seed <= 40; seed++) {
        const q = A.checkQuestion(kind, seed), tag = `check ${o.id} ${kind} ${seed} ${lang}`;
        if (q.options.length !== 4) fail(`${tag}: ${q.options.length} options`);
        if (q.options.filter((x) => x.correct).length !== 1) fail(`${tag}: not exactly one right option`);
        if (new Set(q.options.map((x) => x.html)).size !== q.options.length) fail(`${tag}: two options alike`);
        if (q.options.some((x) => !x.correct && x.flag && x.flag !== 'other' && !flags.has(x.flag))) fail(`${tag}: a flag the check does not know`);
        if (q.options.some((x) => !x.correct && x.flag && x.flag !== 'other' && !x.why)) fail(`${tag}: a misconception without a reason`);
        if (badText(json(q)) || badText(q.explain()) || !q.ask || !q.title) fail(`${tag}: undefined or NaN`);
      }
    }
  });
  // the worked examples
  A.LESSONS.forEach((l, k) => { for (const fr of l.frames()) if (bad(fr.text + fr.figure) || htmlInSvg(fr.figure)) fail(`tutor ${k + 1} ${lang}: undefined or NaN`); });
}
// questions that wait for another (after: key): the key is an earlier question of the same exercise;
// Einstein's equation shows (b) and (c) only once (a) is right, since they give it away
for (const type of X.TYPES) {
  for (let seed = 1; seed <= SEEDS; seed++) {
    const e = X.make(type, seed), tag = `${type} ${seed}`;
    e.questions.forEach((q, k) => { if (q.after && !e.questions.slice(0, k).some((p) => p.key === q.after)) fail(`${tag} ${q.key}: waits for ${q.after}, which is not an earlier question`); });
    if (type === 'photo-calc' && (e.questions[0].key !== 'out' || e.questions[0].after || e.questions.slice(1).some((q) => q.after !== 'out') || e.questions.length < 2)) fail(`${tag}: (b) and (c) must wait for (a)`);
    if (type === 'photo-line' && e.questions.find((q) => q.key === 'metal').after !== 'slope') fail(`${tag}: (e) must wait for (d)`);
    if (type === 'model' && e.questions[1].after !== 'obs') fail(`${tag}: (b) must wait for (a)`);
  }
}
// the threshold frequency and the cut-off wavelength: f₀, λ₀ in English, f_G, λ_G in German
{
  const EN_NOT = /f_G|λ_G|<i>[fλ]<\/i><sub>G<\/sub>|font-style="italic">[fλ]<\/tspan><tspan font-size="72%" dy="4">G</;
  const DE_NOT = /f₀|λ₀|<i>[fλ]<\/i><sub>0<\/sub>|font-style="italic">[fλ]<\/tspan><tspan font-size="72%" dy="4">0</;
  for (const lang of ['en', 'de']) {
    Lang.set(lang, true);
    const not = lang === 'en' ? EN_NOT : DE_NOT;
    const all = [];
    for (const type of X.TYPES) for (let seed = 1; seed <= 40; seed++) all.push(json(X.make(type, seed)));
    A.LESSONS.forEach((l) => { all.push(l.name(), l.idea()); for (const fr of l.frames()) all.push(fr.text + fr.figure); });
    A.OBJECTIVES.forEach((o) => { all.push(o.name()); for (const kind of o.kinds) { const q = A.checkQuestion(kind, 3); all.push(json(q), q.explain()); } });
    all.push(json(A.concepts()));
    const hit = all.find((t) => not.test(t));
    if (hit) fail(`${lang}: the wrong symbol for f₀/λ₀: …${hit.slice(Math.max(0, hit.search(not) - 60), hit.search(not) + 40)}…`);
    // and the right one is used
    if (!all.some((t) => (lang === 'en' ? /<sub>0<\/sub>|f₀/ : /<sub>G<\/sub>|f_G/).test(t) && /Grenz|threshold/.test(t))) fail(`${lang}: the threshold frequency symbol is missing`);
  }
}
// the other symbols: in English as in British textbooks (work function φ, stopping voltage V_s,
// E_k and E_k,max, a voltage V), in German W, U₀, E_kin, E_kin,max and U, everywhere (practice, its
// hints, solutions, reasons for wrong answers and drawings, the tutor, the check and its reasons,
// the objectives and the coordinate readout). The texts are compared without their tags (so
// <i>U</i><sub>0</sub> reads U0), item by item in both languages: where German writes U₀, English
// writes V_s, and so on (the names of the worked example and practice topic of the U₀(f) line are
// words in English: Stopping voltage against frequency).
{
  const strip = (html) => String(html).replace(/<\/?(i|sub|sup|b|tspan)\b[^>]*>/g, '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/​/g, '');
  const count = (t, re) => (t.match(re) || []).length;
  // the texts of an exercise, a check question, a worked example: only what the student reads
  const exTexts = (e) => [e.title, e.text, e.figs, e.solFig, ...e.hints, ...e.solution, ...e.questions.flatMap((q) => [q.label, q.sym, q.unit,
    ...(q.wrong || []).map((w) => w.why), ...(q.options || []).flatMap((o) => [o.label, o.html, o.why]), ...(q.statements || []).flatMap((st) => [st.html, st.why])])].filter((t) => t != null);
  const items = () => {
    const out = [];
    for (const type of X.TYPES) for (let seed = 1; seed <= 60; seed++) out.push([`${type} ${seed}`, exTexts(X.make(type, seed))]);
    A.OBJECTIVES.forEach((o) => { out.push([`objective ${o.id}`, [o.name()]]); for (const kind of o.kinds) for (const seed of [1, 2, 3, 5, 8, 13]) { const q = A.checkQuestion(kind, seed); out.push([`check ${kind} ${seed}`, [q.title, q.text, q.figure, q.ask, q.explain(), ...q.options.flatMap((op) => [op.html, op.why])].filter((t) => t != null)]); } });
    A.LESSONS.forEach((l, k) => { out.push([`tutor ${k + 1}`, [l.idea(), ...l.frames().flatMap((fr) => [fr.text, fr.figure])]]); out.push([`name: tutor ${k + 1}`, [l.name()]]); });
    A.TOPICS.forEach((t, k) => out.push([`name: topic ${k + 1}`, [t.name(), ...t.stages.map((st) => st.name())]]));
    out.push(['concepts', Object.values(A.concepts())]);
    return out;
  };
  const EN_NOT = [[/U₀|U0|E_?kin|(?<![\p{L}\d])U(?![\p{L}\d])/u, 'U₀, E_kin or U'], [/(?<![\p{L}\d])(?<!\d[\s-])W(?![\p{L}\d-])/u, 'W for the work function'], [/data-[xy]n="U/, 'U in the readout']];
  const DE_NOT = [[/V_?s\b|φ|E_?k\b|E_?k,max|\bV\s*=|\bV\s+in\s+V/, 'V_s, φ, E_k or V'], [/data-[xy]n="V/, 'V in the readout']];
  const sets = {};
  for (const lang of ['en', 'de']) {
    Lang.set(lang, true);
    sets[lang] = items().map(([tag, texts]) => [tag, texts.map((t) => [String(t), strip(t)])]);
    for (const [tag, texts] of sets[lang]) {
      for (const [raw, t] of texts) {
        for (const [re, what] of lang === 'en' ? EN_NOT : DE_NOT) {
          const hit = re.test(t) ? t : re.test(raw) ? raw : null;
          if (hit) { const k = hit.search(re); fail(`${lang} ${tag}: ${what}: …${hit.slice(Math.max(0, k - 50), k + 30)}…`); }
        }
      }
    }
  }
  // in both languages or in neither, item by item
  const PAIRS = [[/\bVs\b|V_s/g, /U₀|U0/g, 'V_s / U₀'], [/φ/g, /(?<![\p{L}\d])(?<!\d[\s-])W(?![\p{L}\d-])/gu, 'φ / W'], [/\bEk\b|E_k\b|Ek,max|E_k,max/g, /Ekin|E_kin/g, 'E_k / E_kin']];
  let seen = 0;
  sets.en.forEach(([tag, en], n) => {
    const de = sets.de[n][1], te = en.map((x) => x[1]).join(' | '), td = de.map((x) => x[1]).join(' | ');
    if (tag.startsWith('name:')) return;
    for (const [re, rd, what] of PAIRS) {
      const a = count(te, re), b = count(td, rd);
      seen += b;
      if (!a !== !b) fail(`${tag}: ${what} ${a} times in English, ${b} times in German`);
    }
  });
  if (seen < 500) fail(`the symbols: only ${seen} found in German`);
}
// the spectrum: the labels of the marks lie in a row of their own under the scale, apart from each
// other and within the drawing (widths estimated: 13 px bold, 0.6 em a character)
{
  const lists = [];
  for (const lang of ['en', 'de']) {
    Lang.set(lang, true);
    for (const type of ['energy', 'rank']) for (let seed = 1; seed <= SEEDS; seed++) lists.push(X.make(type, seed).figs);
    A.LESSONS.forEach((l) => { for (const fr of l.frames()) lists.push(fr.figure); });
  }
  lists.push(G.bar([{ nm: 400, label: '3.10 eV' }, { nm: 413, label: '3.00 eV' }, { nm: 420, label: '2.95 eV' }]), G.bar([{ nm: 100, label: '12.40 eV' }, { nm: 1000, label: '1.24 eV' }]));
  let bars = 0;
  for (const html of lists) {
    for (const svg of String(html).match(/<svg class="ph bar"[\s\S]*?<\/svg>/g) || []) {
      bars++;
      const W = Number(svg.match(/viewBox="0 0 (\d+)/)[1]);
      const labels = [...svg.matchAll(/<text class="lbl small strong" x="([\d.]+)" y="([\d.]+)" text-anchor="middle">([^<]*)<\/text>/g)].map((m) => ({ x: Number(m[1]), y: Number(m[2]), w: m[3].length * 13 * 0.6 }));
      const ticks = [...svg.matchAll(/<text class="tick"[^>]* y="([\d.]+)"/g)].map((m) => Number(m[1]));
      const caps = [...svg.matchAll(/<text class="lbl small" x="[\d.]+" y="([\d.]+)"/g)].map((m) => Number(m[1])).filter((y) => y > 30);
      const arrows = [...svg.matchAll(/class="mark-arrow" d="M([\d.]+) ([\d.]+)/g)].map((m) => Number(m[2]));
      for (const l of labels) {
        if (l.y - 10 < Math.max(...ticks) + 4 || arrows.some((y) => l.y - 10 < y + 8)) fail(`spectrum: a label on top of the scale or an arrow (${l.y})`);
        if (caps.some((y) => Math.abs(y - l.y) < 14)) fail('spectrum: a label on top of the captions');
        if (l.x - l.w / 2 < 0 || l.x + l.w / 2 > W) fail(`spectrum: a label outside the drawing (${l.x})`);
      }
      if (arrows.some((y) => y < Math.max(...ticks) + 3)) fail('spectrum: an arrow on top of the numbers of the scale');
      labels.sort((a, b) => a.x - b.x).forEach((l, k) => { if (k && l.x - l.w / 2 < labels[k - 1].x + labels[k - 1].w / 2 + 2) fail(`spectrum: two labels overlap (${labels[k - 1].x}, ${l.x})`); });
    }
  }
  if (bars < 100) fail(`spectrum: only ${bars} drawings checked`);
}
// a whole check: the plan of check.js gives every objective its share of questions
{
  let a = 7;
  const rand = () => { a = (a * 16807) % 2147483647; return a / 2147483647; };
  const plan = Check.plan(A.OBJECTIVES, rand), per = Check.perObjective(A.OBJECTIVES.length);
  if (plan.length !== per * A.OBJECTIVES.length) fail(`the check has ${plan.length} questions`);
  A.OBJECTIVES.forEach((o, n) => { if (plan.filter((it) => it.objective === n).length !== per) fail(`objective ${o.id}: not ${per} questions`); });
}
console.log(`${X.TYPES.length} types × ${SEEDS} seeds, ${A.OBJECTIVES.length} objectives with ${A.OBJECTIVES.reduce((n, o) => n + o.kinds.length, 0)} check kinds and ${A.LESSONS.length} worked examples, in both languages`);
if (failures) { console.error(`${failures} failures`); process.exit(1); }
console.log('all checks passed');
