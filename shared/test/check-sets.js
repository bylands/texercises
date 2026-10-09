// Checks shared/sets.js and the sets in shared/topics.js: the keys of stages, the arcade's kinds in
// a set, and practice limited to a set's stages (topics left out, steps merged from the set's
// stages only, all topics mixed only with them).   node shared/test/check-sets.js
const assert = require('assert');
const S = require('../sets.js');

const topics = [
  { name: () => 'A', stages: [{ name: () => 'a1', types: ['a1'] }, { types: ['a2', 'a3'] }] },
  { name: () => 'B', stages: [{ types: ['b1'] }, { types: ['b2'] }] },
  { name: () => 'C', stages: [{ types: ['c1'] }] },
];
assert.strictEqual(S.stageKey(topics[0].stages[1]), 'a2+a3');
assert.deepStrictEqual([...S.typesOf(topics, ['a2+a3', 'c1'])].sort(), ['a2', 'a3', 'c1']);

// the arcade: kinds that are practice types only with a chosen stage; other kinds (levels) always
const kinds = [{ id: 'a1', difficulty: 1 }, { id: 'a2', difficulty: 2 }, { id: 'b1', difficulty: 3 }, { id: 'd4', difficulty: 4 }];
assert.deepStrictEqual(S.filterKinds(kinds, topics, ['a2+a3']).map((k) => k.id), ['a2', 'd4']);
assert.deepStrictEqual(S.filterKinds(kinds, topics, null), kinds);
assert.deepStrictEqual(S.filterKinds(kinds.slice(0, 2), topics, ['c1']), kinds.slice(0, 2)); // none left: all
assert(S.NAME.test('3a-elektro') && !S.NAME.test('3A') && !S.NAME.test('-a'));

// practice in a set (topics.js reads LPSets, as in the browser)
const mem = {};
global.window = global;
global.localStorage = { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); } };
let keys = null;
global.LPSets = { name: '3a', mode: () => true, tutor: () => null, practice: () => keys, register: () => {}, stageKey: S.stageKey };
require('../topics.js');
// every type has many exercises, so no stage is merged with the next
const make = (type, seed) => ({ type, p: [type, seed] });
const create = () => window.Topics.create({ app: 't', topics, make, typeOf: (e) => e.type, onChange: () => {} });

let T = create();
assert(T.parse('p2.1-7'), 'without a set, every topic');
assert(T.parse('mix-3'));

keys = ['a2+a3', 'b2'];
T = create();
assert.deepStrictEqual(T.state(), { topic: 0, stage: 0 });
assert.strictEqual(T.parse('p3.1-1'), null, 'topic C is not in the set');
const a = T.parse('p1.1-4'); // topic A's first step is now its stage 2
assert(['a2', 'a3'].includes(a.type));
assert.strictEqual(T.parse('p1.2-4'), null, 'topic A has one step in the set');
assert.strictEqual(T.parse('p2.1-5').type, 'b2');
for (let seed = 1; seed < 30; seed++) assert(['a2', 'a3', 'b2'].includes(T.parse(`mix-${seed}`).type), 'mixed: the set\'s stages only');
T.go(2);
assert.strictEqual(T.state().topic, 0, 'a topic not in the set: the first that is');
assert(mem['t-topic@3a'], 'the choice is kept apart from the one without the set');

keys = ['c1'];
T = create();
assert.deepStrictEqual(T.state(), { topic: 2, stage: 0 });
assert.strictEqual(T.parse('mix-1'), null, 'one topic: no mixing');

keys = ['zz']; // nothing of the app: no limit
T = create();
assert(T.parse('p2.2-1'));
console.log('sets: all checks passed');
