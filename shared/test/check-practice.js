// Checks shared/practice.js: scores, recording once per exercise, and that hard types come up
// more often.   node shared/test/check-practice.js
const assert = require('assert');
const mem = {};
global.localStorage = { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); } };
const P = require('../practice.js');

assert.strictEqual(P.score({ tries: 1, hints: 0, solved: true }), 0);
assert.strictEqual(P.score({ tries: 3, hints: 1, solved: true }), 0.8);
assert.strictEqual(P.score({ tries: 2, hints: 0, solved: false }), 0.75);
assert.strictEqual(P.score({ tries: 0, hints: 2, solved: false }), null);
assert.strictEqual(P.score({ tries: 0, hints: 0, revealed: true }), 1);

const st = { tries: 0, hints: 0, solved: false, revealed: true };
P.finish('t', 'A', st);
P.finish('t', 'A', st); // recorded once
assert.deepStrictEqual(P.read('t').A, { n: 1, s: 1 });
P.finish('t', 'B', { tries: 1, hints: 0, solved: true });
P.finish('t', 'C', { tries: 0, hints: 0, solved: false }); // not tried: nothing recorded
assert.deepStrictEqual(Object.keys(P.read('t')).sort(), ['A', 'B']);

// types A and B equally common; A (s = 1, weight 4) should come up about 4 times as often as B (weight 1)
let seed = 7;
const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const count = { A: 0, B: 0 };
for (let k = 0; k < 4000; k++) count[P.next('t', (s) => ({ t: s % 2 ? 'A' : 'B' }), (e) => e.t, null, random).t]++;
const ratio = count.A / count.B;
assert(ratio > 3.3 && ratio < 4.8, `ratio ${ratio}`);
// the last type is avoided when another one was drawn
for (let k = 0; k < 200; k++) assert.strictEqual(P.next('t', (s) => ({ t: s % 2 ? 'A' : 'B' }), (e) => e.t, 'A', random).t, 'B');
console.log('all checks passed');
