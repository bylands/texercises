// Verifies that the length of an option does not give the right one away: run with
// `node energy-conservation/test/check-options.js`.
// For every question with options (concepts.js: the check's questions and practice's choice
// exercises, among them "find the error"), in both languages and over many seeds, it measures
// each option as shown (HTML stripped, a formula one per symbol, ½ as three, a bar chart by its
// bars) and, per family (a kind, or a question of fixed options), checks that the right option is
// - the longest about as often as chance and not more than 1/n + 0.15 of the time (ties shared),
// - the shortest not more than 1/n + 0.15 of the time,
// - of mean rank (1 = longest) within 0.75 of the middle, (n + 1)/2,
// and that a right energy balance does not have the most terms more often than chance.
'use strict';

['../lang.js', '../core.js', '../expr.js', '../draw.js', '../scenarios.js', '../generator.js', '../motion.js', '../lessons.js', '../concepts.js'].forEach((f) => require(f));
const { EC, EnergyConcepts: Concepts } = globalThis;

let failures = 0;
const log = (s) => console.log(s);
const fail = (msg) => { failures++; if (failures < 40) log('  FAIL ' + msg); };

// a formula as shown, roughly one per symbol
function texLen(t) {
  let s = t.replace(/\\(left|right)/g, '');
  for (let k = 0; k < 4; k++) s = s.replace(/\\[td]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '$1/$2');
  return s.replace(/\\mathrm\{([^{}]*)\}/g, '$1').replace(/\\[,;!:]|\\quad/g, '').replace(/\\[a-zA-Z]+/g, 'x').replace(/[{}^_\s]/g, '').length;
}
function shownLength(html) {
  if (/<svg/.test(html)) return (html.match(/<rect class="bar/g) || []).length; // a bar chart: its bars
  return html.replace(/<[^>]*>/g, '').split(/(\$[^$]*\$)/)
    .reduce((n, part) => n + (part.startsWith('$') ? texLen(part.slice(1, -1)) : part.replace(/\s+/g, ' ').trim().length), 0);
}

// the families: a kind, or for the kinds of fixed questions each question (by its English ask)
const FIXED = ['path', 'friction', 'turn', 'hang'];
const SEEDS = 300, stats = {};
for (const kind of Concepts.KINDS) {
  for (let seed = 1; seed <= SEEDS; seed++) {
    EC.setLang('en');
    const name = FIXED.includes(kind) ? `${kind}: ${Concepts.CHECK.question(kind, seed).ask.replace(/<[^>]*>/g, '')}` : kind;
    for (const lang of EC.LANGS) {
      EC.setLang(lang);
      const q = Concepts.CHECK.question(kind, seed), lens = q.options.map((o) => shownLength(o.html));
      const c = q.options.findIndex((o) => o.correct), lc = lens[c], others = lens.filter((_, j) => j !== c);
      const mx = Math.max(...lens), mn = Math.min(...lens);
      for (const key of [name, `${name} (${lang})`]) {
        const f = (stats[key] = stats[key] || { n: 0, opts: 0, longest: 0, shortest: 0, rank: 0, terms: 0 });
        f.n++; f.opts += lens.length;
        if (lc === mx) f.longest += 1 / lens.filter((x) => x === mx).length;
        if (lc === mn) f.shortest += 1 / lens.filter((x) => x === mn).length;
        f.rank += 1 + others.filter((x) => x > lc).length + others.filter((x) => x === lc).length / 2;
        if (kind === 'balance') {
          const terms = q.options.map((o) => (o.html.match(/[+-]/g) || []).length);
          if (terms.every((t, j) => j === c || terms[c] > t)) f.terms++;
        }
      }
    }
  }
}
for (const [name, f] of Object.entries(stats)) {
  const n = f.opts / f.n, chance = 1 / n, mid = (n + 1) / 2;
  const L = f.longest / f.n, S = f.shortest / f.n, R = f.rank / f.n, T = f.terms / f.n;
  log(`${name.padEnd(90)} longest ${L.toFixed(2)}  shortest ${S.toFixed(2)}  rank ${R.toFixed(2)}`);
  if (L > chance + 0.15) fail(`${name}: the right option is the longest in ${(100 * L).toFixed(0)} % of the questions`);
  if (S > chance + 0.15) fail(`${name}: the right option is the shortest in ${(100 * S).toFixed(0)} % of the questions`);
  if (Math.abs(R - mid) > 0.75) fail(`${name}: the right option's mean length rank is ${R.toFixed(2)}, not about ${mid}`);
  if (T > chance + 0.15) fail(`${name}: the right energy balance has the most terms in ${(100 * T).toFixed(0)} % of the questions`);
}
log(failures ? `${failures} failures` : 'all checks passed');
if (failures) process.exit(1);
