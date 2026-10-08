// Verifies the wave crests (generator.js, plot.js, realproblems.js): run with
// `node wave-propagation/test/check-generator.js`. It checks that
// - the physics holds: a crest moves unchanged at v; at a fixed end the rope stays at 0, at a free
//   end it moves twice as far; after a reflection the crest is the mirror image (upside down at a
//   fixed end); the sum of two crests is what the rope shows,
// - every exercise type, in both languages and for many seeds, has questions with exactly one right
//   option, options that differ (also as drawings), a reason for each wrong one, complete texts,
//   and drawings and animation frames that render,
// - how the rope moves: a point said to move up is higher a moment later,
// - a drawing exercise has whole heights at its grid lines, and the problems are sound.
'use strict';

const Lang = require('../lang.js');
const W = require('../generator.js');
const P = require('../plot.js');
const R = require('../realproblems.js');

let failures = 0;
const fail = (msg) => { failures++; if (failures < 30) console.error('  FAIL ' + msg); };
const bad = (html) => /undefined|NaN|null|\[object|Infinity/.test(html);
const near = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol;

// ---------------------------------------------------------------- physics
for (const sh of [...Object.values(W.LIN), ...Object.values(W.SMOOTH)]) {
  const p = W.pulse(sh, 0.5, 1, 2);
  for (const t of [0, 0.5, 1.25]) for (const x of [0.6, 1.3, 2.2]) if (!near(W.ev(p, x + 2 * t, t), W.ev(p, x, 0))) fail('a crest changes as it moves');
  for (const type of ['fixed', 'free']) {
    const E = 6, sc = { pulses: [p], end: { x: E, type } };
    for (let t = 0; t <= 6; t += 0.05) {
      const at = W.y(sc, E, t), inc = W.ev(p, E, t);
      if (type === 'fixed' && !near(at, 0)) fail(`fixed end moves: ${at}`);
      if (type === 'free' && !near(at, 2 * inc)) fail('free end not twice the height');
    }
    // long after: the mirror image, reversed (and upside down at a fixed end): its left end at
    // 2E − 0.5 − w − 2t, and there, at s from its left end, the incoming crest's P(w − s)
    const t = (E - 0.5) / 2 + 1.5, left = 2 * E - 0.5 - sh.w - 2 * t;
    for (let s = 0.05; s <= sh.w - 0.05; s += 0.1) {
      const xRef = left + s;
      const want = (type === 'fixed' ? -1 : 1) * W.prof(sh, sh.w - s);
      if (xRef > 0.05 && xRef < E - 0.05 && !near(W.y(sc, xRef, t), want, 1e-6)) { fail(`${type}: the reflected crest is not the mirror image`); break; }
    }
  }
}

// ---------------------------------------------------------------- exercises
const TYPES = ['move-lin', 'move-smooth', 'yt-lin', 'yt-smooth', 'ty-lin', 'ty-smooth', 'medium-lin', 'medium-smooth', 'speed-x', 'speed-t', 'speed-len', 'sup-lin', 'sup-smooth',
  'refl-fixed', 'refl-free', 'refl-smooth', 'reflsum-lin', 'reflsum-smooth', 'mirror-lin', 'mirror-smooth', 'end-lin', 'end-smooth', 'draw-sup', 'draw-refl', 'draw-reflsum'];
let n = 0;
for (const lang of ['en', 'de']) {
  Lang.set(lang, true);
  for (const type of TYPES) {
    for (let seed = 1; seed <= 120; seed++) {
      const e = W.generate(type, seed), tag = `${lang} ${type}-${seed}`;
      n++;
      for (const q of e.questions) {
        const right = q.options.filter((o) => o.ok);
        if (right.length !== 1) fail(`${tag}: ${q.key} has ${right.length} right options`);
        if (q.type === 'pick') {
          if (q.options.length !== 4) fail(`${tag}: ${q.options.length} diagrams`);
          if (new Set(q.options.map((o) => W.sig(o.fig))).size !== 4) fail(`${tag}: two diagrams look the same`);
          if (seed <= 15) for (const o of q.options) if (/NaN|undefined/.test(P.graph(o.fig, { small: true }))) fail(`${tag}: a diagram`);
        } else if (new Set(q.options.map((o) => o.label)).size !== q.options.length) fail(`${tag}: ${q.key} options not distinct`);
        if (q.options.some((o) => !o.ok && !o.why)) fail(`${tag}: a wrong option without a reason`);
        if (bad(JSON.stringify(q.options.map((o) => [o.label || '', o.why || ''])) + (q.label || ''))) fail(`${tag}: texts of ${q.key}`);
      }
      if (bad(e.text + e.hints.join('') + e.solution.join(''))) fail(`${tag}: texts`);
      if (seed <= 15) {
        for (const f of [].concat(e.fig || [], e.solFig || [])) if (/NaN|undefined/.test(P.graph(f))) fail(`${tag}: figure`);
        for (const a of [e.anim, e.solAnim].filter(Boolean)) for (const t of [a.t0, (a.t0 + a.t1) / 2, a.t1]) if (/NaN|undefined/.test(P.frame({ ...a, arrows: true }, t))) fail(`${tag}: animation frame`);
      }
      if (e.kind === 'medium') {
        // a point said to move up is higher a moment later
        const pts = e.fig.dots;
        e.questions.forEach((q, i) => {
          const m = q.options.find((o) => o.ok).label, d = W.y(e.sc, pts[i].x, 0.01) - W.y(e.sc, pts[i].x, 0);
          const want = d > 1e-6 ? 'up' : d < -1e-6 ? 'down' : 'rest';
          const words = { up: q.options[0].label, down: q.options[1].label, rest: q.options[2].label };
          if (m !== words[want]) fail(`${tag}: point ${q.key} moves ${want}`);
        });
      }
      if (e.kind === 'draw') {
        if (!e.target.every((v) => Number.isInteger(v)) || e.target.every((v) => v === 0)) fail(`${tag}: the heights to draw`);
        e.xs.forEach((x, i) => { if (!near(W.y(e.sc, x, e.t), e.target[i])) fail(`${tag}: a height to draw`); });
      }
    }
  }
}
console.log(`exercises: ${n}`);

// ---------------------------------------------------------------- problems
for (const lang of ['en', 'de']) {
  Lang.set(lang, true);
  R.PROBLEMS.forEach((pb, i) => {
    for (let seed = 1; seed <= 80; seed++) {
      const e = R.realOf(i, seed), tag = `${lang} ${pb.id}-${seed}`;
      for (const q of e.questions) {
        if (q.options.filter((o) => o.ok).length !== 1) fail(`${tag}: ${q.key} has not one right option`);
        if (q.options.some((o) => !o.ok && !o.why)) fail(`${tag}: ${q.key}: a wrong option without a reason`);
        if (q.type === 'pick' && new Set(q.options.map((o) => W.sig(o.fig))).size !== q.options.length) fail(`${tag}: two diagrams look the same`);
      }
      if (bad(e.text + e.hints.join('') + e.solution.join('') + JSON.stringify(e.questions.map((q) => q.options.map((o) => [o.label || '', o.why || '']))))) fail(`${tag}: texts`);
      if (e.fig && /NaN|undefined/.test(P.graph(e.fig))) fail(`${tag}: figure`);
      if (pb.id === 'slinky') {
        const a = e.solAnim, tm = a.t1 / 2;
        let m = 0;
        for (let x = 0; x <= 8; x += 0.05) m = Math.max(m, Math.abs(W.y(a.sc, x, tm)));
        if (m > 1e-9) fail(`${tag}: the slinky is not straight at full overlap`);
      }
    }
  });
}
console.log(`problems: ${R.PROBLEMS.length}`);
if (failures) { console.error(`\n${failures} failures`); process.exit(1); }
console.log('Wave propagation OK');
