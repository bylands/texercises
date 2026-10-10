// Verifies the wave crests (generator.js, plot.js): run with
// `node wave-propagation/test/check-generator.js`. It checks that
// - the physics holds: a crest moves unchanged at v; at a fixed end the rope stays at 0, at a free
//   end it moves twice as far; after a reflection the crest is the mirror image (upside down at a
//   fixed end); the sum of two crests is what the rope shows,
// - every exercise type, in both languages and for many seeds, has questions with exactly one right
//   option, options that differ (also as drawings), a reason for each wrong one, complete texts,
//   and drawings and animation frames that render,
// - how the rope moves: a point said to move up is higher a moment later,
// - a drawing exercise has whole heights at its grid lines,
// - standing waves: the right picture has a node at each fixed end and an antinode at each free
//   end, evenly spaced, the wrong ones not; choice questions have four options; in "find the
//   error" exactly the wrong sketch is the answer (the reflection the wrong way up, or an antinode
//   at a fixed end),
// - y(t) near the end (reflyt): the graph marked right is the incoming crest plus its reflection,
//   computed here from the profile (the reflection: the crest as it would be at 2E − x, upside
//   down at a fixed end), the others differ from it; at least 10 distinct exercises,
// - the tutor's first crest (BUMP) is smooth and lopsided, its front steeper than its back,
// - a drawing exercise has the same scales as its given diagram (from 0 to the same end, as
//   high), and every height to draw fits on it.
'use strict';

const Lang = require('../lang.js');
const W = require('../generator.js');
const P = require('../plot.js');

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
  'refl-fixed', 'refl-free', 'refl-smooth', 'reflsum-lin', 'reflsum-smooth', 'mirror-lin', 'mirror-smooth', 'end-lin', 'end-smooth', 'draw-sup', 'draw-refl', 'draw-reflsum',
  'stand-pic', 'stand-count', 'stand-ratio', 'error-refl', 'error-stand', 'reflyt-lin', 'reflyt-smooth'];
const NEW = new Set(['stand-pic', 'stand-count', 'stand-ratio', 'error-refl', 'error-stand', 'reflyt-lin', 'reflyt-smooth']);
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
        if (NEW.has(type) && q.options.length !== 4) fail(`${tag}: ${q.options.length} options`);
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
      if (e.kind === 'stand' && e.variant === 'pic') for (const o of e.questions[0].options) {
        const d = o.fig.std;
        if (o.ok !== (W.fits(d.ends, d.q, d.ph) && !d.warp)) fail(`${tag}: a picture judged ${o.ok ? 'right' : 'wrong'}`);
      }
      if (e.kind === 'stand' && e.fig) {
        // the picture itself: nodes at the fixed ends, antinodes at the free ones
        const d = e.fig.std, f = e.fig.curves[0].f;
        d.ends.forEach((type, i) => { const v = Math.abs(f(i ? d.len : 0)); if (type === 'fixed' ? v > 1e-6 : !near(v, W.AMP)) fail(`${tag}: the ${type} end of the picture`); });
      }
      if (e.kind === 'error' && e.variant === 'stand') for (const o of e.questions[0].options) {
        const d = o.fig.std, k = W.endsOf(d.q, d.ph);
        const antiAtFixed = k.some((x, i) => x === 'anti' && d.ends[i] === 'fixed'), nodeAtFree = k.some((x, i) => x === 'node' && d.ends[i] === 'free');
        if (o.ok ? !antiAtFixed || nodeAtFree : !W.fits(d.ends, d.q, d.ph)) fail(`${tag}: a sketch judged ${o.ok ? 'wrong' : 'right'}`);
      }
      if (e.kind === 'error' && e.variant === 'refl') for (const o of e.questions[0].options) if (o.ok !== o.fig.flip) fail(`${tag}: a reflection judged ${o.ok ? 'wrong' : 'right'}`);
      if (e.kind === 'stand' && e.variant === 'ratio-pic') for (const o of e.questions[0].options) {
        // the picture marked right has the asked λ = λ₁/k, all of them fit the ends
        const d = o.fig.std, k = Number(e.text.match(/λ₁\/(\d+)/)[1]), lam1 = 4 * d.len / (d.ends[0] === d.ends[1] ? 2 : 1);
        if (!W.fits(d.ends, d.q, d.ph) || d.warp) fail(`${tag}: a picture that does not fit the ends`);
        if (o.ok !== near(lam1 / ((4 * d.len) / d.q), k)) fail(`${tag}: a picture judged ${o.ok ? 'right' : 'wrong'}`);
      }
      if (e.kind === 'stand' && e.variant !== 'pic' && e.variant !== 'ratio-pic') {
        // the value marked right is the wavelength of the picture
        const d = e.fig.std, lam = (4 * d.len) / d.q, lam1 = 4 * d.len / (d.ends[0] === d.ends[1] ? 2 : 1), ok = e.questions[0].options.find((o) => o.ok);
        if (e.variant === 'count' ? !near(ok.value, lam) : ok.label !== `λ₁/${Math.round(lam1 / lam)}`) fail(`${tag}: the wavelength`);
      }
      if (e.kind === 'reflyt') {
        // independently: the profile of the incoming crest at xp and, upside down at a fixed end,
        // at the mirror place 2E − xp (where it would be without the end)
        const { x0, E, v, d, type } = e.p, sh = W.LIN[e.p.sh] || W.SMOOTH[e.p.sh], xp = E - d, s = type === 'fixed' ? -1 : 1;
        const want = (t) => W.prof(sh, xp - x0 - v * t) + s * W.prof(sh, 2 * E - xp - x0 - v * t);
        const opts = e.questions[0].options, ok = opts.find((o) => o.ok);
        if (!sh || e.fig.marks[0].x !== xp) fail(`${tag}: the place`);
        let overlap = false, worst = 0;
        for (let t = 0; t <= ok.fig.hi; t += 0.01) {
          if (Math.abs(ok.fig.curves[0].f(t) - want(t)) > 1e-6) worst++;
          if (W.prof(sh, xp - x0 - v * t) !== 0 && W.prof(sh, 2 * E - xp - x0 - v * t) !== 0) overlap = true;
          if (Math.abs(W.ev(e.sc.pulses[0], E, t) * (s > 0 ? 2 : 0) - W.y(e.sc, E, t)) > 1e-6) worst++;
        }
        if (worst) fail(`${tag}: the right y(t) graph differs from the superposition`);
        if (!overlap) fail(`${tag}: the incoming and the reflected crest do not overlap at the place`);
        if (ok.fig.curves.length !== 1) fail(`${tag}: the right graph has ${ok.fig.curves.length} curves`);
        for (const o of opts) if (!o.ok) {
          let diff = 0;
          for (let t = 0; t <= o.fig.hi; t += 0.02) diff = Math.max(diff, ...o.fig.curves.map((c) => Math.abs(c.f(t) - want(t))));
          if (diff < 0.5) fail(`${tag}: a wrong graph (${o.tag}) looks like the right one`);
        }
        if (seed <= 15 && /NaN|undefined/.test(P.frame({ ...e.solAnim, arrows: true }, e.solAnim.t1 / 2))) fail(`${tag}: solution animation`);
      }
      if (e.kind === 'draw') {
        // the same scales as the given diagram, and every height fits on it
        if (e.fig.lo !== 0 || e.fig.hi !== e.draw.hi || e.fig.Y !== e.draw.Y || e.solFig.Y !== e.draw.Y) fail(`${tag}: the drawing and the given diagram differ in scale`);
        const sg = P.scales(e.fig), sd = P.scales({ ...W.snap(() => 0, { hi: e.draw.hi, Y: e.draw.Y }) });
        for (const v of [0, 1.5, e.draw.hi]) if (sg.x(v) !== sd.x(v)) fail(`${tag}: the grid lines do not line up`);
        for (const v of [-3, 5]) if (sg.y(v) !== sd.y(v)) fail(`${tag}: the heights do not line up`);
        if (e.target.some((v) => Math.abs(v) > Math.floor(e.draw.Y))) fail(`${tag}: a height to draw beyond the diagram`);
        if (!e.target.every((v) => Number.isInteger(v)) || e.target.every((v) => v === 0)) fail(`${tag}: the heights to draw`);
        e.xs.forEach((x, i) => { if (!near(W.y(e.sc, x, e.t), e.target[i])) fail(`${tag}: a height to draw`); });
      }
    }
  }
}
// the stage "λ as a fraction of λ₁" has at least 12 distinct exercises (by text and options)
for (const lang of ['en', 'de']) {
  Lang.set(lang, true);
  const seen = new Set();
  for (let seed = 1; seed <= 300; seed++) {
    const e = W.generate('stand-ratio', seed);
    seen.add(e.text + '|' + e.questions[0].options.map((o) => o.label || '').sort().join(','));
    if (/[$_]/.test(e.text + e.solution.join('') + e.questions[0].options.map((o) => (o.label || '') + o.why).join(''))) fail(`${lang} stand-ratio-${seed}: raw $ or _ in a text`);
  }
  if (seen.size < 12) fail(`${lang} stand-ratio: only ${seen.size} distinct exercises`);
}
// y(t) near the end: at least 10 distinct exercises in each level, by text and graphs
for (const lang of ['en', 'de']) {
  Lang.set(lang, true);
  for (const type of ['reflyt-lin', 'reflyt-smooth']) {
    const seen = new Set();
    for (let seed = 1; seed <= 200; seed++) { const e = W.generate(type, seed); seen.add(e.text + '|' + e.questions[0].options.map((o) => W.sig(o.fig)).sort().join(',')); }
    if (seen.size < 10) fail(`${lang} ${type}: only ${seen.size} distinct exercises`);
  }
}

// the tutor's first crest: smooth (no jumps), lopsided, the front (right) steeper than the back
{
  const B = W.BUMP, h = 1e-3;
  let jump = 0, asym = 0, back = 0, front = 0, top = 0;
  for (let u = 0; u <= B.w; u += 0.01) {
    jump = Math.max(jump, Math.abs(W.prof(B, u + 0.01) - W.prof(B, u)));
    asym = Math.max(asym, Math.abs(W.prof(B, u) - W.prof(B, B.w - u)));
    const sl = (W.prof(B, u + h) - W.prof(B, u - h)) / (2 * h);
    if (u < B.w / 2) back = Math.max(back, sl); else front = Math.max(front, -sl);
    top = Math.max(top, W.prof(B, u));
  }
  if (jump > 0.3) fail('BUMP: not smooth');
  if (asym < 1) fail('BUMP: not lopsided');
  if (!(front > 2 * back)) fail(`BUMP: its front (${front}) not steeper than its back (${back})`);
  if (!near(top, 5, 1e-3) || !near(W.prof(B, 0), 0) || !near(W.prof(B, B.w), 0, 1e-9)) fail('BUMP: its height or its ends');
  // its y(t) graph at a place is its picture reversed: the steep side first
  const p = W.pulse(B, 1, 1, 2);
  for (let t = 0.5; t <= 1.5; t += 0.05) if (!near(W.ev(p, 4, t), W.prof(B, 3 - 2 * t))) fail('BUMP: y(t) not the picture reversed');
}
console.log(`exercises: ${n}`);

if (failures) { console.error(`\n${failures} failures`); process.exit(1); }
console.log('Wave propagation OK');
