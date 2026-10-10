// Verifies the interaction exercises: run with `node interaction/test/check-generator.js`.
// For many seeds of every exercise type it checks that
// - every question has exactly one right option, at least three options with distinct labels,
//   and an explanation for each option; every wrong option names a known misconception,
// - there are four hints and a worked solution whose steps all have a picture,
// - the text has no NaN or undefined, the SVG is balanced, and the same seed gives the same exercise,
// - the physics behind the right options holds: the two forces of an interaction are always
//   equal, the lighter body gets faster, the push on a van follows its acceleration, the partner
//   swaps the two bodies, and in "find the error" exactly the pair on one body is wrong,
// - every misconception appears among the wrong options, and the tutor lessons build,
// - the German version matches the English one and has no English left (and no ß),
// - every exercise type has a difficulty and a name, and every practice stage lists known types,
// - every learning objective of the check has question kinds that give four options, one right.
'use strict';

require('../lang.js');
require('../draw.js');
const FC = require('../core.js');
['interact', 'partners', 'sorting', 'predict', 'truefalse'].forEach((f) => require(`../${f}.js`));
const { EXAMPLES, OBJECTIVES } = require('../lessons.js');

const SAMPLES = 150;
let failures = 0, checked = 0;
const fail = (msg) => { failures++; if (failures < 30) console.error('  FAIL ' + msg); };
const strip = (s) => s.replace(/<[^>]+>/g, '');

function checkExercise(ex, where) {
  checked++;
  const json = JSON.stringify(ex);
  if (/NaN|undefined|\[object /.test(json)) fail(`${where}: NaN/undefined in the text`);
  const all = [ex.figure, ...ex.steps.map((s) => s.figure), ...ex.questions.flatMap((q) => [...(q.options || []), ...(q.reasons || []), ...(q.items || []), ...(q.choices || [])].map((o) => o.label || ''))].join('');
  for (const tag of ['svg', 'g', 'text']) {
    const open = (all.match(new RegExp(`<${tag}[ >]`, 'g')) || []).length, close = (all.match(new RegExp(`</${tag}>`, 'g')) || []).length;
    if (open !== close) fail(`${where}: <${tag}> ${open} opened, ${close} closed`);
  }
  if (!ex.title || !ex.situation || !/<svg/.test(ex.figure)) fail(`${where}: title, situation or figure missing`);
  if (ex.hints.length !== 4 || ex.hints.some((h) => !h || strip(h).length < 20)) fail(`${where}: expected four hints`);
  if (ex.steps.length < 2 || ex.steps.some((s) => !s.title || !s.text || !/<svg/.test(s.figure))) fail(`${where}: steps incomplete`);
  for (const q of ex.questions) checkQuestion(q, where);
}

// Every format: complete, explained, with known misconception codes, exactly one right answer
// where there is one.
const known = (c) => c === 'other' || c === 'ok' || FC.MIS[c];
const explained = (w) => w && strip(w).length >= 20;
function checkOptions(opts, q, where, pics) {
  const ok = opts.filter((o) => o.ok);
  if (ok.length !== 1) fail(`${where}/${q.key}: ${ok.length} right options`);
  if (opts.length < 3 || opts.length > 5) fail(`${where}/${q.key}: ${opts.length} options`);
  if (new Set(opts.map((o) => o.label)).size !== opts.length) fail(`${where}/${q.key}: duplicate options`);
  if (new Set(opts.map((o) => strip(o.text))).size !== opts.length) fail(`${where}/${q.key}: duplicate option texts`);
  for (const o of opts) {
    if (!explained(o.why)) fail(`${where}/${q.key}: option without explanation`);
    if (!known(o.code)) fail(`${where}/${q.key}: unknown code ${o.code}`);
    if (pics && !/^<svg/.test(o.label)) fail(`${where}/${q.key}: picture option is not a picture`);
    if (pics && (!o.text || /<svg/.test(o.text))) fail(`${where}/${q.key}: picture option without words`);
  }
}
function checkQuestion(q, where) {
  if (!q.prompt || !q.key) fail(`${where}: question without prompt or key`);
  const type = q.type || 'choice';
  if (type === 'choice') checkOptions(q.options, q, where, q.pics);
  else if (type === 'two') {
    checkOptions(q.options, q, where, q.pics);
    checkOptions(q.reasons, q, where + ' (reason)', false);
    if (!q.reasonPrompt) fail(`${where}/${q.key}: no reason prompt`);
  } else if (type === 'tf') {
    const t = q.items.filter((x) => x.value).length;
    if (q.items.length !== 5 || t < 2 || t > 3) fail(`${where}/${q.key}: ${q.items.length} statements, ${t} true`);
    if (new Set(q.items.map((x) => x.text)).size !== q.items.length) fail(`${where}/${q.key}: duplicate statements`);
    for (const x of q.items) if (!explained(x.why) || !known(x.code) || typeof x.value !== 'boolean') fail(`${where}/${q.key}: statement incomplete`);
  } else if (type === 'rank') {
    const vs = q.items.map((x) => x.value), rk = FC.ranksOf(vs);
    if (q.items.length < 3 || !explained(q.why)) fail(`${where}/${q.key}: ranking incomplete`);
    for (const t of q.traps) {
      if (!known(t.code) || !explained(t.why)) fail(`${where}/${q.key}: trap ${t.key} incomplete`);
      const tr = FC.ranksOf(q.items.map((x) => x.alt[t.key]));
      if (tr.every((x, i) => x === rk[i])) fail(`${where}/${q.key}: trap ${t.key} gives the right order`);
    }
  } else if (type === 'match') {
    const ids = q.choices.map((c) => c.id);
    if (new Set(ids).size !== ids.length || q.choices.some((c) => !c.label || !c.name)) fail(`${where}/${q.key}: choices incomplete`);
    for (const x of q.items) {
      if (!ids.includes(x.answer) || !explained(x.why) || !explained(x.other) || !x.name) fail(`${where}/${q.key}: item ${x.name} incomplete`);
      for (const [id, w] of Object.entries(x.wrong || {})) if (id === x.answer || !ids.includes(id) || !known(w.code) || !explained(w.why)) fail(`${where}/${q.key}: wrong match ${x.name} → ${id} invalid`);
    }
  } else fail(`${where}/${q.key}: unknown type ${type}`);
  if (!FC.answerText(q)) fail(`${where}/${q.key}: no answer text`);
  for (const m of FC.misreads(q)) if (!m.text || !known(m.code) || !explained(m.why)) fail(`${where}/${q.key}: misread incomplete`);
}

const right = (ex, key) => strip(ex.questions.find((q) => q.key === key).options.find((o) => o.ok).text);

// ---------------------------------------------------------------- random exercises
const TYPES = Object.entries(FC.POOLS).flatMap(([topic, gs]) => gs.map((g) => `${topic}/${g.name}`));
const codes = new Set();
for (const type of TYPES) {
  for (let seed = 1; seed <= SAMPLES; seed++) {
    let ex;
    try { ex = FC.generateGen(type, seed); } catch (e) { fail(`${type}-${seed}: ${e.message}`); continue; }
    checkExercise(ex, `${type}-${seed}`);
    if (seed <= 30 && JSON.stringify(FC.generateGen(type, seed)) !== JSON.stringify(ex)) fail(`${type}-${seed}: not deterministic`);
    if (ex.id !== `${type}-${seed}`) fail(`${type}-${seed}: wrong id ${ex.id}`);
    ex.questions.forEach((q) => FC.misreads(q).forEach((m) => codes.add(m.code)));
  }
}
for (const c of Object.keys(FC.MIS)) if (!codes.has(c)) fail(`misconception ${c} never offered`);

// ---------------------------------------------------------------- physics
const r = () => FC.rng(7);
// push-car: the pair is always equal; the push on the van follows the van's acceleration.
for (const phase of ['speeding', 'constant', 'slowing']) {
  const ex = FC.GENS['push-car'](r(), { phase });
  if (!right(ex, 'pair').includes('equally large')) fail(`push-car ${phase}: pair not equal`);
  const want = { speeding: 'larger than', constant: 'equal to', slowing: 'smaller than' }[phase];
  if (!right(ex, 'van').includes(want)) fail(`push-car ${phase}: expected ${want}`);
}
// collision and pushing apart: the interaction forces are always equal.
for (const kase of ['headon', 'parkedTruck', 'parkedCar', 'rear']) {
  const ex = FC.GENS.collision(r(), { case: kase });
  if (!right(ex, 'force').includes('equally large')) fail(`collision ${kase}: forces not equal`);
}
for (let seed = 1; seed <= 100; seed++) {
  const ex = FC.GENS['push-apart'](FC.rng(seed), {});
  if (!right(ex, 'force').includes('equally large')) fail(`push-apart ${seed}: forces not equal`);
  const m = ex.situation.match(/(\w+) \((\d+) kg\) and (\w+) \((\d+) kg\)/);
  const light = Number(m[2]) < Number(m[4]) ? m[1] : m[3];
  if (!right(ex, 'speed').startsWith(light)) fail(`push-apart ${seed}: the lighter one should be faster`);
}
// partner: the partner swaps the two bodies of the force, and it is just as large; the force on
// the same body (the weight's balance) is flagged as a pair confusion.
for (const scene of ['mosquito', 'electron', 'dancer', 'hammer']) {
  const ex = FC.GENS.partner(r(), { scene });
  checkExercise(ex, `partner ${scene}`);
  const want = { mosquito: 'mosquito pushes the windscreen', electron: 'electron pulls the nucleus', dancer: 'dancer pulls the Earth', hammer: 'nail pushes the hammer' }[scene];
  if (!right(ex, 'partner').includes(want)) fail(`partner ${scene}: “${right(ex, 'partner')}”`);
  if (!right(ex, 'size').startsWith('Just as hard')) fail(`partner ${scene}: size`);
  if (!ex.questions[0].options.some((x) => x.code === 'pair-confusion')) fail(`partner ${scene}: no force on the same body offered`);
}
// find the error: exactly one listed pair has both forces on the same body; every other pair
// swaps the two bodies, and no force has two partners in the right pairs.
for (let seed = 1; seed <= 300; seed++) {
  const ex = FC.GENS['find-error'](FC.rng(seed), {}), at = `find-error ${seed}`;
  const items = [...ex.situation.matchAll(/<li>(.*?)<\/li>/g)].map((m) => m[1]);
  if (items.length !== 4) { fail(`${at}: ${items.length} pairs listed`); continue; }
  const q = ex.questions.find((x) => x.key === 'wrong');
  if (q.options.length !== 4 || !q.options.every((o, i) => o.label.endsWith(items[i]))) fail(`${at}: options not the listed pairs, in order`);
  // the acting and the acted-on body of a force, from its words: "X pulls/pushes Y ..."
  const bodies = (s) => { const m = s.match(/^(?:the )?(.+?) (?:pulls|pushes|push) (?:the )?(.+?) (?:down|up|forward|backward|to the left|to the right)/i); return m ? [m[1].toLowerCase(), m[2].toLowerCase()] : null; };
  items.forEach((it, i) => {
    const [f, g] = it.split(' ↔ ').map(bodies);
    if (!f || !g) { fail(`${at}: cannot read “${it}”`); return; }
    const swapped = f[0] === g[1] && f[1] === g[0] || (f[0] === 'tyres' && g[1] === 'tyres') || (g[0] === 'tyres' && f[1] === 'tyres');
    if (swapped === q.options[i].ok) fail(`${at}: pair ${i + 1} “${it}” judged wrongly`);
    if (q.options[i].ok && f[1] !== g[1] && !(f[1] === 'tyres' || g[1] === 'tyres')) fail(`${at}: the wrong pair acts on two bodies`);
  });
}

// What must not change between the languages, and all the text of a question.
const sig = (q) => ({ choice: () => q.options.map((o) => o.code), two: () => [q.options.map((o) => o.code), q.reasons.map((o) => o.code)],
  tf: () => q.items.map((x) => [x.value, x.code]), rank: () => q.items.map((x) => x.value), match: () => q.items.map((x) => x.answer) }[q.type || 'choice']());
const qTexts = (q) => [q.prompt, q.reasonPrompt || '', ...(q.options || []).flatMap((o) => [o.text, o.why]), ...(q.reasons || []).flatMap((o) => [o.text, o.why]),
  ...(q.items || []).flatMap((x) => [x.text || x.label, x.why || '', ...Object.values(x.wrong || {}).map((w) => w.why)]), q.why || '',
  ...(q.traps || []).map((t) => t.why), ...(q.choices || []).filter((c) => !/<svg/.test(c.label)).map((c) => c.label)];

// ---------------------------------------------------------------- adapting to the student
// Every type has a name in both languages and a difficulty; the moving average of the scores
// gives a hard type up to four times the weight of a mastered one.
for (const g of new Set(Object.values(FC.POOLS).flat().map((x) => x.name))) {
  if (!FC.TYPE_NAMES[g] || FC.TYPE_NAMES[g].some((x) => !x)) fail(`type ${g} has no name`);
  if (!FC.DIFFICULTY[g]) fail(`type ${g} has no difficulty`);
}
{
  let stats = FC.recordResult({}, 'support', 1);
  if (FC.weightOf(stats, 'support') !== 4 || FC.weightOf(FC.recordResult({}, 'support', 0), 'support') !== 1) fail('weights for hard and easy types');
  stats = FC.recordResult(stats, 'support', 0);
  if (Math.abs(stats.support.s - 0.6) > 1e-9 || stats.support.n !== 2) fail('moving average of the scores');
}

// ---------------------------------------------------------------- German
// The same seed gives the same exercise in both languages (same scenario, same right options
// in the same order, same misconceptions); the German text is complete, in Swiss spelling (no ß)
// and has no English left in it.
const ENGLISH = /\b(the|and|is|are|with|which|does|of|from|it)\b/i;
for (const type of TYPES) {
  for (let seed = 1; seed <= 60; seed++) {
    FC.setLang('en');
    const en = FC.generateGen(type, seed);
    FC.setLang('de');
    let de;
    try { de = FC.generateGen(type, seed); } catch (e) { fail(`de ${type}-${seed}: ${e.message}`); continue; }
    checkExercise(de, `de ${type}-${seed}`);
    const shape = (ex) => ex.gen + ex.questions.map((q) => q.key + JSON.stringify(sig(q))).join('|');
    if (shape(en) !== shape(de)) fail(`de ${type}-${seed}: differs from the English exercise`);
    const texts = [de.title, de.situation, ...de.hints, ...de.steps.flatMap((s) => [s.title, s.text]),
      ...de.questions.flatMap(qTexts)].map(strip);
    const svgWords = [de.figure, ...de.steps.map((s) => s.figure)].join('').match(/<text class="txt"[^>]*>([^<]*)</g) || [];
    for (const t of [...texts, ...svgWords.map(strip)]) {
      if (/ß/.test(t)) fail(`de ${type}-${seed}: ß in “${t.slice(0, 60)}”`);
      const m = t.match(ENGLISH);
      if (m) fail(`de ${type}-${seed}: English “${m[0]}” in “${t.slice(0, 80)}”`);
    }
  }
}
for (const c of Object.keys(FC.MIS)) {
  const m = FC.mis(c);
  if (!m.name || !m.text || /ß/.test(m.name + m.text)) fail(`de misconception ${c}`);
}
FC.setLang('en');

// ---------------------------------------------------------------- tutor
for (const lang of FC.LANGS) {
  FC.setLang(lang);
  for (const l of EXAMPLES) {
    try { checkExercise(FC.build(l.gen, l.params), `tutor ${lang} ${l.gen}`); } catch (e) { fail(`tutor ${lang} ${l.gen}: ${e.message}`); }
    if (!l.name || !l.name[lang] || !l.idea || !l.idea[lang]) fail(`tutor ${l.gen}: name or idea missing in ${lang}`);
  }
}
FC.setLang('en');

// Every practice stage lists registered types, and every type is practised somewhere.
const practised = new Set(EXAMPLES.flatMap((l) => l.practice.flatMap((st) => st.types)));
for (const t of practised) if (!TYPES.includes(t)) fail(`practice type ${t} is not registered`);
for (const t of TYPES) if (!practised.has(t)) fail(`type ${t} is not practised`);

// ---------------------------------------------------------------- check
// Every objective has a name in both languages, its worked example and practice topic, and kinds
// of practice types that give questions with four distinct options, exactly one right, each wrong
// one explained and with a known code; the same kind and seed give the same question.
for (const ob of OBJECTIVES) {
  if (!ob.name.en || !ob.name.de || !EXAMPLES[ob.tutor] || !EXAMPLES[ob.topic] || !ob.kinds.length) fail(`objective ${ob.id} incomplete`);
  for (const kind of ob.kinds) {
    if (!TYPES.includes(kind.split(':')[0])) fail(`objective ${ob.id}: kind ${kind} of an unknown type`);
    for (const lang of FC.LANGS) {
      FC.setLang(lang);
      for (let seed = 1; seed <= 60; seed++) {
        let q;
        try { q = FC.checkQuestion(kind, seed); } catch (e) { fail(`check ${kind} ${seed}: ${e.message}`); continue; }
        const at = `check ${lang} ${kind} ${seed}`;
        if (q.options.length !== 4 || q.options.filter((o) => o.ok).length !== 1) fail(`${at}: ${q.options.length} options, ${q.options.filter((o) => o.ok).length} right`);
        if (new Set(q.options.map((o) => o.html)).size !== 4) fail(`${at}: duplicate options`);
        if (q.options.some((o) => !o.ok && (!explained(o.why) || !known(o.code)))) fail(`${at}: wrong option unexplained`);
        if (!q.ask || !q.ex.title) fail(`${at}: no question`);
        if (seed <= 10 && JSON.stringify(FC.checkQuestion(kind, seed).options) !== JSON.stringify(q.options)) fail(`${at}: not deterministic`);
      }
    }
  }
}
FC.setLang('en');

console.log(`${checked} exercises checked, ${TYPES.length} types, ${[...codes].filter((c) => FC.MIS[c]).length} misconceptions offered.`);
if (failures) { console.error(`${failures} failure(s).`); process.exit(1); }
console.log('All checks passed.');
