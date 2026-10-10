// Checks shared/check.js: how many questions per objective, the plan of a check (each objective
// its share of questions, its kinds in turn, no objective twice in a row where avoidable) and the
// result per objective (mastered, misconception, not yet).   node shared/test/check-check.js
const assert = require('assert');
const C = require('../check.js');

// a reproducible rand()
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

assert.deepStrictEqual([1, 2, 3, 4, 5, 6, 8].map(C.perObjective), [4, 4, 3, 3, 2, 2, 2]);

const objectives = [{ kinds: ['a', 'b'] }, { kinds: ['c'] }, { kinds: ['d', 'e', 'f'] }];
for (let s = 1; s <= 200; s++) {
  const p = C.plan(objectives, rng(s));
  assert.strictEqual(p.length, 9);
  objectives.forEach((o, i) => {
    const mine = p.filter((q) => q.objective === i);
    assert.strictEqual(mine.length, 3);
    assert(mine.every((q) => o.kinds.includes(q.kind)));
    // the kinds in turn: with as many questions as kinds or more, every kind comes up
    if (o.kinds.length <= 3) assert.strictEqual(new Set(mine.map((q) => q.kind)).size, o.kinds.length);
  });
  for (let k = 1; k < p.length; k++) assert.notStrictEqual(p[k].objective, p[k - 1].objective, `objective twice in a row (seed ${s})`);
  assert(p.every((q) => Number.isInteger(q.seed) && q.seed >= 1));
}
// one objective alone: all its questions, of course in a row
assert.strictEqual(C.plan([{ kinds: ['a'] }], rng(1)).length, 4);

// the result: three of four right is mastered; a wrong option with a misconception names it
const concept = { whole: 'whole', ratio: 'ratio', slip: null };
const items = [
  { objective: 0, ok: true }, { objective: 0, ok: true }, { objective: 0, ok: true }, { objective: 0, ok: false, flag: 'whole' },
  { objective: 1, ok: true }, { objective: 1, ok: false, flag: 'ratio' }, { objective: 1, ok: false, flag: 'ratio' },
  { objective: 2, ok: false, flag: null }, { objective: 2, ok: true }, { objective: 2, ok: false, flag: 'slip' },
];
assert.deepStrictEqual(C.grade(objectives, items, concept), [
  { right: 3, total: 4, status: 'mastered', ideas: ['whole'] },
  { right: 1, total: 3, status: 'misconception', ideas: ['ratio'] },
  { right: 1, total: 3, status: 'notyet', ideas: [] },
]);
// an objective without answers (the check ended early) is not mastered
assert.strictEqual(C.grade([{ kinds: ['a'] }], [], concept)[0].status, 'notyet');

console.log('check.js: plan and grade ok');
