// Checks hub/objectives.json, the learning objectives the hub page shows on the cards: that it is
// what hub/build-objectives.js reads from the apps now (else: run it), that every app of the hub
// page has its objectives, each with an id of its own and a name in English and German, and that
// no two apps keep their check's result under the same key.   node hub/test/check-objectives.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const B = require('../build-objectives.js');

const data = B.build();
assert.strictEqual(fs.readFileSync(B.OUT, 'utf8'), B.text(data), 'hub/objectives.json differs from the apps: run node hub/build-objectives.js');

const hub = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const ids = [...hub.matchAll(/<a class="app" href="\/([a-z0-9-]+)\/"/g)].map((m) => m[1]);
assert(ids.length > 20);
assert.deepStrictEqual(Object.keys(data), ids, 'every app of the hub page, in its order');
const checks = new Set();
for (const [app, d] of Object.entries(data)) {
  assert(/^[a-z0-9-]+$/.test(d.check), app);
  assert(!checks.has(d.check), `${app}: the check's key ${d.check} is another app's`);
  checks.add(d.check);
  assert(d.objectives.length >= 2 && d.objectives.length <= 8, `${app}: ${d.objectives.length} objectives`);
  assert.strictEqual(new Set(d.objectives.map((o) => o.id)).size, d.objectives.length, `${app}: two objectives with the same id`);
  for (const o of d.objectives) {
    assert(/^[a-z0-9-]+$/.test(o.id), `${app}: id ${o.id}`);
    assert(o.en.length > 20 && o.de.length > 20, `${app}/${o.id}: a name too short`);
    assert.notStrictEqual(o.en, o.de, `${app}/${o.id}: the German name is the English one`);
    assert(!/[<>]/.test(o.en + o.de), `${app}/${o.id}: plain text, no HTML`);
  }
}
assert.strictEqual(data.coe.check, 'ec', 'the energy app, served at /coe/');
console.log(`objectives: ${ids.length} apps, ${Object.values(data).reduce((n, d) => n + d.objectives.length, 0)} objectives, all checks passed`);
