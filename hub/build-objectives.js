#!/usr/bin/env node
// The learning objectives of the apps for the hub page: writes hub/objectives.json, which the hub
// page loads (deployed as /objectives.json) to list each module's objectives on its card and, once
// the student has taken the check, how many of them they master (the apps keep the last result of
// the check in the browser under `${check}-check`, see shared/check.js).
//   node hub/build-objectives.js          write hub/objectives.json
//   node hub/build-objectives.js --check  only report whether it differs from the apps (exit 1 if so)
// The objectives live in the apps' JavaScript: each app has one `const OBJECTIVES = [...]` of
// { id, kinds, tutor, topic, name } (name: () => L('English', 'Deutsch'), or { en, de }), and one
// check source { id: '..', objectives: ... } whose id names the stored result. The array is read
// from the source and evaluated on its own, with L giving both languages; an app whose objectives
// cannot be read so makes this fail (keep the array plain: literals and L(...) only).
// The file: { app (as on the hub page, e.g. coe): { check: id, objectives: [{ id, en, de }] } },
// in the order of the hub page's cards; hub/test/check-objectives.js checks it against the apps.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'objectives.json');

// the apps as the hub page links them (/id/), and the folder of each (deploy.sh: folder:path)
function apps() {
  const hub = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const ids = [...hub.matchAll(/<a class="app" href="\/([a-z0-9-]+)\/"/g)].map((m) => m[1]);
  const deploy = fs.readFileSync(path.join(ROOT, 'deploy.sh'), 'utf8').match(/^APPS="([^"]*)"/m)[1].split(/\s+/);
  const folder = Object.fromEntries(deploy.map((a) => { const [src, dst] = a.split(':'); return [dst || src, src]; }));
  return ids.map((id) => ({ id, dir: path.join(ROOT, folder[id] || id) }));
}

// the text from an opening bracket at `start` to its closing one, skipping strings and comments
function balanced(src, start) {
  const open = src[start], close = { '[': ']', '{': '}', '(': ')' }[open];
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'" || c === '`') {
      for (i++; i < src.length && src[i] !== c; i++) if (src[i] === '\\') i++;
    } else if (c === '/' && src[i + 1] === '/') {
      i = src.indexOf('\n', i);
      if (i < 0) break;
    } else if (c === '/' && src[i + 1] === '*') {
      i = src.indexOf('*/', i) + 1;
    } else if (c === open) depth++;
    else if (c === close && --depth === 0) return src.slice(start, i + 1);
  }
  throw new Error('unbalanced brackets');
}

function objectivesOf(app) {
  const files = fs.readdirSync(app.dir).filter((f) => f.endsWith('.js')).map((f) => [f, fs.readFileSync(path.join(app.dir, f), 'utf8')]);
  const found = files.filter(([, src]) => /\bconst OBJECTIVES = \[/.test(src));
  if (found.length !== 1) throw new Error(`${app.id}: ${found.length ? 'more than one' : 'no'} "const OBJECTIVES = [" in its scripts`);
  const [file, src] = found[0];
  const text = balanced(src, src.search(/\bconst OBJECTIVES = \[/) + 'const OBJECTIVES = '.length);
  let list;
  try {
    list = vm.runInNewContext(`(${text})`, { L: (en, de) => ({ en, de }) });
  } catch (e) {
    throw new Error(`${app.id}: the objectives in ${file} cannot be read on their own (${e.message})`);
  }
  const checks = files.flatMap(([, s]) => [...s.matchAll(/\bid:\s*'([a-z0-9-]+)',\s*objectives:/g)].map((m) => m[1]));
  if (checks.length !== 1) throw new Error(`${app.id}: ${checks.length ? 'more than one' : 'no'} check source "id: '..', objectives:"`);
  return {
    check: checks[0],
    objectives: list.map((o) => {
      const n = typeof o.name === 'function' ? o.name() : o.name;
      if (!n || typeof n.en !== 'string' || typeof n.de !== 'string' || !n.en || !n.de) throw new Error(`${app.id}: objective ${o.id} has no name in English and German`);
      return { id: o.id, en: n.en, de: n.de };
    }),
  };
}

function build() {
  return Object.fromEntries(apps().map((a) => [a.id, objectivesOf(a)]));
}
const text = (data) => `${JSON.stringify(data, null, 1)}\n`;

if (require.main === module) {
  const want = text(build());
  if (process.argv[2] === '--check') {
    let have = '';
    try { have = fs.readFileSync(OUT, 'utf8'); } catch (e) { /* none yet */ }
    if (have !== want) { console.log('differs: hub/objectives.json (run node hub/build-objectives.js)'); process.exit(1); }
    console.log('hub/objectives.json up to date');
  } else {
    fs.writeFileSync(OUT, want);
    console.log(`wrote hub/objectives.json (${Object.keys(JSON.parse(want)).length} apps)`);
  }
}
module.exports = { build, text, OUT };
