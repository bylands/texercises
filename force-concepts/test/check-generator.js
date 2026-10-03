// Verifies the force-concept exercises: run with `node force-concepts/test/check-generator.js`.
// For many seeds of every topic it checks that
// - every question has exactly one right option, at least three options with distinct labels,
//   and an explanation for each option; every wrong option names a known misconception,
// - there are four hints and a worked solution whose steps all have a picture,
// - the text has no NaN or undefined, the SVG is balanced, and the same seed gives the same exercise,
// - the physics behind the right options holds: forces compared in the right way for every
//   motion (speeding up, constant, slowing down; up or down), the speed after a kick, the
//   direction of two forces, and that the picture options are far enough apart,
// - every misconception appears among the wrong options, and the tutor lessons build,
// - the German version matches the English one and has no English left (and no ß),
// - every exercise type has a difficulty, and every practice level gives its difficulties.
'use strict';

require('../lang.js');
require('../draw.js');
const FC = require('../core.js');
['gravity', 'inertia', 'force', 'interact', 'sorting', 'predict', 'truefalse'].forEach((f) => require(`../${f}.js`));
const { EXAMPLES } = require('../lessons.js');

const SAMPLES = 600;
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
const codes = new Set(), gens = new Set();
for (const topic of Object.keys(FC.TOPICS)) {
  for (let seed = 1; seed <= SAMPLES; seed++) {
    let ex;
    try { ex = FC.generate(topic, seed); } catch (e) { fail(`${topic}-${seed}: ${e.message}`); continue; }
    checkExercise(ex, `${topic}-${seed}`);
    if (seed <= 50 && JSON.stringify(FC.generate(topic, seed)) !== JSON.stringify(ex)) fail(`${topic}-${seed}: not deterministic`);
    if (ex.id !== `${topic}-${seed}`) fail(`${topic}-${seed}: wrong id ${ex.id}`);
    gens.add(ex.gen);
    ex.questions.forEach((q) => FC.misreads(q).forEach((m) => codes.add(m.code)));
  }
}
const allGens = new Set(Object.values(FC.POOLS).flat().map((g) => g.name));
for (const g of allGens) if (!gens.has(g)) fail(`generator ${g} never drawn`);
for (const c of Object.keys(FC.MIS)) if (!codes.has(c)) fail(`misconception ${c} never offered`);

// ---------------------------------------------------------------- physics
const r = () => FC.rng(7);
// balance: X (forward/up) against Y; the right relation follows the acceleration.
for (const obj of ['crate', 'car', 'elevator', 'skydiver']) {
  for (const phase of ['speeding', 'constant', 'slowing']) {
    for (const dir of obj === 'elevator' ? [1, -1] : obj === 'skydiver' ? [-1] : [1]) {
      const ex = FC.GENS.balance(r(), { obj, phase, dir });
      checkExercise(ex, `balance ${obj} ${phase} ${dir}`);
      const acc = dir * { speeding: 1, constant: 0, slowing: -1 }[phase];
      const want = acc > 0 ? 'larger than' : acc < 0 ? 'smaller than' : 'equal to';
      if (!right(ex, 'compare').includes(want)) fail(`balance ${obj} ${phase} ${dir}: expected “${want}”, got “${right(ex, 'compare')}”`);
      const net = acc === 0 ? 'no net force' : acc * dir > 0 ? 'In the direction' : 'Against';
      if (!right(ex, 'net').includes(net)) fail(`balance ${obj} ${phase} ${dir}: net force “${right(ex, 'net')}”`);
      // “moving needs a net force along the motion” must be flagged whenever it is wrong
      const along = ex.questions[1].options.find((o) => o.label.startsWith('In the direction'));
      if (!along.ok && along.code !== 'active-force') fail(`balance ${obj} ${phase} ${dir}: active-force not flagged`);
    }
  }
}
// push-car: the pair is always equal; the push on the van follows the van's acceleration.
for (const phase of ['speeding', 'constant', 'slowing']) {
  const ex = FC.GENS['push-car'](r(), { phase });
  if (!right(ex, 'pair').includes('equally large')) fail(`push-car ${phase}: pair not equal`);
  const want = { speeding: 'larger than', constant: 'equal to', slowing: 'smaller than' }[phase];
  if (!right(ex, 'van').includes(want)) fail(`push-car ${phase}: expected ${want}`);
}
// kick: speed after a kick at right angles.
for (const vu of [[4, 3], [3, 4], [8, 6], [12, 5], [5, 12]]) {
  const ex = FC.GENS.kick(r(), { vu, obj: 'puck', side: 1 });
  const got = parseFloat(right(ex, 'speed'));
  if (Math.abs(got - Math.hypot(...vu)) > 0.05 * Math.hypot(...vu)) fail(`kick ${vu}: speed ${got}`);
}
// two forces: read the force arrows as drawn in the task picture and the magnitudes from the
// text, add them up independently, and check that the right option and the net-force arrow of the
// worked solution point that way (and are as long), that the labels sit at their arrows, that the
// option pictures show the forces as the task does, and that wrong options are at least 12° off.
{
  const lines = (svg, cls) => [...svg.matchAll(new RegExp(`<g class="arr ${cls}[^"]*"><line x1="([\\d.-]+)" y1="([\\d.-]+)" x2="([\\d.-]+)" y2="([\\d.-]+)"`, 'g'))].map((m) => m.slice(1, 5).map(Number));
  const ang = ([x1, y1, x2, y2]) => Math.atan2(y2 - y1, x2 - x1);
  const len = ([x1, y1, x2, y2]) => Math.hypot(x2 - x1, y2 - y1) + 10; // + the arrow head
  const deg = (a, b) => { const d = Math.abs(a - b) % (2 * Math.PI); return (Math.min(d, 2 * Math.PI - d) * 180) / Math.PI; };
  for (let seed = 1; seed <= 1000; seed++) {
    const ex = FC.GENS['two-forces'](FC.rng(seed), {}), at = `two-forces ${seed}`;
    const [F1, F2] = ex.situation.match(/= (\d+) N.*?= (\d+) N/).slice(1).map(Number);
    const fs = lines(ex.figure, 'f');
    if (fs.length !== 2) { fail(`${at}: ${fs.length} force arrows`); continue; }
    const labs = [...ex.figure.matchAll(/<text class="lbl f small" x="([\d.-]+)" y="([\d.-]+)"[^>]*>F<tspan[^>]*>(\d)<\/tspan> = (\d+) N/g)];
    for (const m of labs) {
      const a = fs[m[3] - 1];
      if (deg(Math.atan2(m[2] - 4 - a[1], m[1] - a[0]), ang(a)) > 3 || Number(m[4]) !== [F1, F2][m[3] - 1]) fail(`${at}: label F${m[3]} wrong or misplaced`);
    }
    if (Math.abs(len(fs[0]) / len(fs[1]) - F1 / F2) > 0.02 * (F1 / F2)) fail(`${at}: arrow lengths not in the ratio ${F1}:${F2}`);
    const a1 = ang(fs[0]), a2 = ang(fs[1]);
    const rx = F1 * Math.cos(a1) + F2 * Math.cos(a2), ry = F1 * Math.sin(a1) + F2 * Math.sin(a2), ar = Math.atan2(ry, rx);
    const q = ex.questions.find((x) => x.key === 'dir');
    for (const o of q.options) {
      const d = deg(ang(lines(o.label, 'opt')[0]), ar);
      if (o.ok && d > 1) fail(`${at}: the right option is ${d.toFixed(1)}° off the net force`);
      if (!o.ok && d < 11.5) fail(`${at}: a wrong option is only ${d.toFixed(1)}° off the net force`);
      const g = [...o.label.matchAll(/<line class="guide faint" x1="([\d.-]+)" y1="([\d.-]+)" x2="([\d.-]+)" y2="([\d.-]+)"/g)].map((m) => m.slice(1, 5).map(Number));
      if (deg(ang(g[0]), a1) > 1 || deg(ang(g[1]), a2) > 1) fail(`${at}: an option picture shows the forces differently`);
    }
    const net = lines(ex.steps[0].figure, 'net')[0], R = Math.hypot(rx, ry);
    if (deg(ang(net), ar) > 1 || Math.abs(len(net) - (len(fs[0]) / F1) * R) > 1.5) fail(`${at}: net-force arrow of the solution wrong`);
    if (Number(ex.steps[0].text.match(/about ([\d.]+)&nbsp;N/)[1]) !== Number(R.toPrecision(2))) fail(`${at}: stated net force wrong`);
  }
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
// throw: only the weight, acceleration g downward, at every phase.
for (const kind of ['vertical', 'oblique']) for (const phase of ['rising', 'top', 'falling']) {
  const ex = FC.GENS.throw(r(), { kind, phase });
  checkExercise(ex, `throw ${kind} ${phase}`);
  if (!right(ex, 'forces').startsWith('Only its weight')) fail(`throw ${kind} ${phase}: forces`);
  if (!right(ex, 'acc').startsWith('Straight down, with size g')) fail(`throw ${kind} ${phase}: acceleration`);
}

// ---------------------------------------------------------------- formats
// Every topic in every format gives an exercise of that format.
const FORMAT_TYPES = { choice: ['choice'], sort: ['rank', 'match'], predict: ['two'], tf: ['tf'] };
for (const topic of Object.keys(FC.TOPICS)) {
  for (const format of Object.keys(FORMAT_TYPES)) {
    for (let seed = 1; seed <= 60; seed++) {
      const ex = FC.generate(topic, seed, format);
      checkExercise(ex, `${topic}-${format}-${seed}`);
      if (ex.id !== `${topic}-${format}-${seed}`) fail(`${topic}-${format}-${seed}: wrong id ${ex.id}`);
      if (!ex.questions.some((q) => FORMAT_TYPES[format].includes(q.type || 'choice'))) fail(`${topic}-${format}-${seed}: no ${format} question`);
    }
  }
}

// What must not change between the languages, and all the text of a question.
const sig = (q) => ({ choice: () => q.options.map((o) => o.code), two: () => [q.options.map((o) => o.code), q.reasons.map((o) => o.code)],
  tf: () => q.items.map((x) => [x.value, x.code]), rank: () => q.items.map((x) => x.value), match: () => q.items.map((x) => x.answer) }[q.type || 'choice']());
const qTexts = (q) => [q.prompt, q.reasonPrompt || '', ...(q.options || []).flatMap((o) => [o.text, o.why]), ...(q.reasons || []).flatMap((o) => [o.text, o.why]),
  ...(q.items || []).flatMap((x) => [x.text || x.label, x.why || '', ...Object.values(x.wrong || {}).map((w) => w.why)]), q.why || '',
  ...(q.traps || []).map((t) => t.why), ...(q.choices || []).filter((c) => !/<svg/.test(c.label)).map((c) => c.label)];

// ---------------------------------------------------------------- variety
// New exercises (freshSeed, as the app uses it) do not repeat a type among the last
// min(8, ⌊n/2⌋) of n types, and every type still comes up.
for (const topic of Object.keys(FC.TOPICS)) {
  for (const format of ['all', ...Object.keys(FORMAT_TYPES)]) {
    const types = new Set(FC.pool(topic, format).map((g) => g.name)), w = Math.min(8, Math.floor(types.size / 2));
    const rand = FC.rng(topic.length * 31 + format.length), recent = [], seen = new Set();
    for (let k = 0; k < 400; k++) {
      const seed = FC.freshSeed(topic, format, recent, rand.next), gen = FC.genOf(topic, seed, format);
      if (w && recent.slice(-w).includes(gen)) { fail(`variety ${topic}/${format}: ${gen} again after ${recent.length - recent.lastIndexOf(gen)}`); break; }
      if (FC.generate(topic, seed, format).gen !== gen) { fail(`variety ${topic}/${format}: genOf disagrees with generate`); break; }
      recent.push(gen);
      seen.add(gen);
    }
    if (seen.size !== types.size) fail(`variety ${topic}/${format}: only ${seen.size} of ${types.size} types came up`);
  }
}

// ---------------------------------------------------------------- adapting to the student
// Every type has a name in both languages. A type marked hard comes up clearly more often than
// types marked easy (limited by the no-repeat rule, which still holds), and easy ones still come.
for (const g of new Set(Object.values(FC.POOLS).flat().map((x) => x.name))) {
  if (!FC.TYPE_NAMES[g] || FC.TYPE_NAMES[g].some((x) => !x)) fail(`type ${g} has no name`);
}
{
  const types = [...new Set(FC.pool('mixed').map((g) => g.name))], hard = 'rank-elevator';
  let stats = {};
  for (const t of types) stats = FC.recordResult(stats, t, t === hard ? 1 : 0);
  if (FC.weightOf(stats, hard) !== 4 || FC.weightOf(stats, 'drop') !== 1) fail('weights for hard and easy types');
  stats = FC.recordResult(stats, hard, 0);
  if (Math.abs(stats[hard].s - 0.6) > 1e-9 || stats[hard].n !== 2) fail('moving average of the scores');
  stats = FC.recordResult(stats, hard, 1);
  const rand = FC.rng(99), recent = [], count = {};
  for (let k = 0; k < 3000; k++) {
    const gen = FC.genOf('mixed', FC.freshSeed('mixed', 'all', recent, rand.next, stats), 'all');
    if (recent.slice(-8).includes(gen)) { fail(`adaptive: ${gen} repeated too soon`); break; }
    recent.push(gen);
    count[gen] = (count[gen] || 0) + 1;
  }
  const easy = types.filter((t) => t !== hard).map((t) => count[t] || 0), mean = easy.reduce((a, b) => a + b, 0) / easy.length;
  // weight 3.3 (s = 0.76), but in Mixed a type can come at most every 9th time: expect about 1.8×
  if (count[hard] < 1.5 * mean) fail(`adaptive: the hard type came ${count[hard]} times, easy ones ${mean.toFixed(0)} on average`);
  if (easy.some((c) => c === 0)) fail('adaptive: some easy type never came up');
}

// ---------------------------------------------------------------- German
// The same seed gives the same exercise in both languages (same scenario, same right options
// in the same order, same misconceptions); the German text is complete, in Swiss spelling (no ß)
// and has no English left in it.
const ENGLISH = /\b(the|and|is|are|with|which|does|of|from|it)\b/i;
for (const topic of Object.keys(FC.TOPICS)) {
  for (let seed = 1; seed <= 200; seed++) {
    FC.setLang('en');
    const en = FC.generate(topic, seed);
    FC.setLang('de');
    let de;
    try { de = FC.generate(topic, seed); } catch (e) { fail(`de ${topic}-${seed}: ${e.message}`); continue; }
    checkExercise(de, `de ${topic}-${seed}`);
    const shape = (ex) => ex.gen + ex.questions.map((q) => q.key + JSON.stringify(sig(q))).join('|');
    if (shape(en) !== shape(de)) fail(`de ${topic}-${seed}: differs from the English exercise`);
    const texts = [de.title, de.situation, ...de.hints, ...de.steps.flatMap((s) => [s.title, s.text]),
      ...de.questions.flatMap(qTexts)].map(strip);
    const svgWords = [de.figure, ...de.steps.map((s) => s.figure)].join('').match(/<text class="txt"[^>]*>([^<]*)</g) || [];
    for (const t of [...texts, ...svgWords.map(strip)]) {
      if (/ß/.test(t)) fail(`de ${topic}-${seed}: ß in “${t.slice(0, 60)}”`);
      const m = t.match(ENGLISH);
      if (m) fail(`de ${topic}-${seed}: English “${m[0]}” in “${t.slice(0, 80)}”`);
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

for (const g of FC.pool('mixed')) if (!FC.DIFFICULTY[g.name]) fail(`${g.name}: no difficulty`);
for (const [level, ds] of Object.entries(FC.LEVELS)) {
  const seen = {};
  for (let seed = 1; seed <= 300; seed++) {
    const ex = FC.generate(level, seed);
    if (!ds.includes(ex.difficulty)) fail(`${level}-${seed}: difficulty ${ex.difficulty}`);
    if (ex.id !== `${level}-${seed}`) fail(`${level}-${seed}: id ${ex.id}`);
    seen[ex.difficulty] = (seen[ex.difficulty] || 0) + 1;
  }
  if (Object.keys(seen).length !== ds.length) fail(`${level}: difficulties ${JSON.stringify(seen)}`);
  console.log(`${level}: ${JSON.stringify(seen)}`);
}

console.log(`${checked} exercises checked, ${allGens.size} scenarios, ${[...codes].filter((c) => FC.MIS[c]).length} misconceptions offered.`);
if (failures) { console.error(`${failures} failure(s).`); process.exit(1); }
console.log('All checks passed.');
