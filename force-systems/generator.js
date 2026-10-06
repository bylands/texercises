// Exercises and worked examples from the scenarios (see scenarios.js).
// generate(level, seed, calc) gives { id, scenario, title, text, fields: [{ key, sym, unit, what, value,
// traps: [{ value, why, flag }] }], figure(view), hints: [html], solution: [html], results: html },
// where flag names the wrong idea behind a trap; generateFor(scenario, seed, { nice }) one of a given
// situation; quiz(exercise, seed) a multiple-choice question about one of its quantities;
// tutorial(lesson) gives the tutor's frames [{ text, figure }].
(function (root) {
  'use strict';

  const FS = root.FS, { SCENARIOS } = root.Scenarios;
  const { L, tex, tq, rng, rad } = FS;

  // Practice levels by difficulty (see the scenarios): easy ★–★★, medium ★★★, hard ★★★★–★★★★★.
  const LEVELS = {
    easy: { name: () => L('Easy', 'Einfach'), from: 1, to: 2 },
    medium: { name: () => L('Medium', 'Mittel'), from: 3, to: 3 },
    hard: { name: () => L('Hard', 'Schwierig'), from: 4, to: 5 },
    mixed: { name: () => L('Mixed', 'Gemischt'), from: 1, to: 5 },
  };
  const pool = (level) => SCENARIOS.filter((s) => s.difficulty >= LEVELS[level].from && s.difficulty <= LEVELS[level].to);
  const byId = (id) => SCENARIOS.find((s) => s.id === id);

  // What a wrong value suggests: the answer under a typical wrong idea (scenarios may say it better).
  const WHY = {
    g: () => L('That is the value for g = 9.81 m/s². Here, use g = 10 m/s².', 'Das ist der Wert für g = 9.81 m/s². Rechne hier mit g = 10 m/s².'),
    swap: () => L('Sine and cosine swapped? Check which component lies next to the angle.', 'Sinus und Kosinus vertauscht? Prüfe, welche Komponente am Winkel anliegt.'),
    flatN: () => L('The normal force is not equal to the weight here.', 'Die Normalkraft ist hier nicht gleich der Gewichtskraft.'),
    noFric: () => L('Friction is missing.', 'Die Reibung fehlt.'),
    oneMass: () => L('Divide by the total mass of all boxes that are accelerated.', 'Teile durch die gesamte Masse aller Kisten, die beschleunigt werden.'),
    hangW: () => L('The rope force is not equal to the weight of the hanging box.', 'Die Seilkraft ist nicht gleich der Gewichtskraft der hängenden Kiste.'),
  };
  const same = (x, y) => Math.abs(x - y) <= 0.02 * Math.max(Math.abs(y), 0.05);

  // The kinds of force in the table of forces (see draw.js): weight, normal force, friction, a push
  // or pull from outside, and the rope or contact force between the boxes.
  const KINDS = ['g', 'n', 'r', 's', 'k'];
  const KIND_NAMES = {
    g: () => L('weight', 'Gewichtskraft'), n: () => L('normal force', 'Normalkraft'), r: () => L('friction', 'Reibung'),
    s: () => L('push or pull from outside', 'Zug- oder Druckkraft von aussen'), k: () => L('rope or contact force', 'Seil- oder Kontaktkraft'),
  };
  // Which kinds of force act on which box: { boxes: [name], kinds, table[box][kind] }, from the
  // forces of the drawing (those ending in 2 act on box 2, the others on box 1, unless the
  // scenario says otherwise in forceOn; a force of size zero, e.g. friction without a friction
  // coefficient, does not act). cells[box][kind] are the ids of the forces in a cell.
  function forceTable(scn, p, v) {
    const boxes = scn.boxes ? scn.boxes(p) : [L(`the box (${FS.q(p.m, 'kg')})`, `die Kiste (${FS.q(p.m, 'kg')})`)];
    const table = boxes.map(() => KINDS.map(() => false)), cells = boxes.map(() => KINDS.map(() => []));
    scn.scene(p, v, {}).forces.forEach((f) => {
      const j = KINDS.indexOf(f.kind), i = boxOf(scn, f);
      if (j >= 0 && i < boxes.length && f.mag > 1e-9) { table[i][j] = true; cells[i][j].push(f.id); }
    });
    return { boxes, kinds: KINDS.map((k) => ({ kind: k, name: KIND_NAMES[k]() })), table, cells };
  }
  const boxOf = (scn, f) => (scn.forceOn && f.id in scn.forceOn ? scn.forceOn[f.id] : /2$/.test(f.id) ? 1 : 0);

  // Arrows for the forces ticked in the table that do not act (or have no arrow), so that a
  // wrong tick shows a force too: at a fixed length, placed and turned as such a force would be:
  // a normal force pushing up from below, friction against the motion at the contact point, a
  // push or pull from outside along the motion, a rope pulling up. The box's centre comes from
  // its weight, the contact point from its normal force, the motion from the acceleration arrows.
  const PHANTOM = 40; // px
  function phantoms(scn, sc, t) {
    const out = [], two = t.boxes.length > 1;
    t.boxes.forEach((b, i) => {
      const own = sc.forces.filter((f) => boxOf(scn, f) === i), of = (k) => own.find((f) => f.kind === k);
      const C = of('g').at, N = of('n');
      const mark = sc.marks.length === 1 ? sc.marks[0] : sc.marks.find((m) => m.id === `a${i + 1}`);
      const m = mark ? mark.dir : null;
      KINDS.forEach((k, j) => {
        if (t.cells[i][j].length) return;
        const zero = of(k); // e.g. friction of size zero: its place in the drawing
        // each kind in a column of its own, beside the weight in the middle
        const vertical = m && Math.abs(m[1]) > 0.5;
        const place = zero ? { at: zero.at, dir: zero.dir }
          : k === 'n' ? { at: [C[0] + 22, C[1] + 28], dir: [0, -1] }
            : k === 'r' ? { at: N ? [N.at[0] - 24, N.at[1]] : [C[0] + 40, C[1] + 8], dir: m ? [-m[0], -m[1]] : [-1, 0] }
              : k === 's' ? { at: vertical ? [C[0] - 24, C[1] - 6] : [C[0] + 16, C[1] - 14], dir: m || [1, 0] }
                : { at: [C[0] - 20, C[1] - 26], dir: [0, -1] };
        const key = { g: 'G', n: 'N', r: 'R', s: 'F', k: two ? 'K' : 'S' }[k];
        out.push({ id: `ph${i}${k}`, kind: k, ...place, fixed: PHANTOM, sym: [key, two ? String(i + 1) : ''], lab: [8, 0] });
      });
    });
    return out;
  }

  // The task with the forces ticked in the table drawn in: ticked { 'box:kind' } (see app.js).
  // extra: ids of forces to draw as well (the components identified, see comps)
  function taskFigure(scn, p, v, t, ticked, extra = []) {
    const sc = scn.scene(p, v, { task: true });
    sc.forces.push(...phantoms(scn, sc, t)); // always there, so that the drawing keeps its size
    const ids = new Set();
    t.boxes.forEach((b, i) => KINDS.forEach((k, j) => {
      if (!ticked.has(`${i}:${j}`)) return;
      if (t.cells[i][j].length) t.cells[i][j].forEach((id) => ids.add(id));
      else ids.add(`ph${i}${k}`);
    }));
    extra.forEach((id) => ids.add(id));
    return sc.render({ task: true, ticked: ids });
  }

  function exercise(scn, p) {
    const v = scn.solve(p);
    const why = (flag) => (scn.why && scn.why[flag] ? scn.why[flag]() : WHY[flag] ? WHY[flag]() : '');
    const wrong = scn.traps.map((flag) => ({ vals: scn.solve(p, flag === 'g' ? { g: 9.81 } : { [flag]: true }), why: why(flag), flag }));
    const fields = scn.fields(p).map((f) => ({
      ...f,
      value: v[f.key],
      traps: wrong.map((w) => ({ value: w.vals[f.key], why: w.why, flag: w.flag })).filter((t) => Number.isFinite(t.value) && !same(t.value, v[f.key])),
    }));
    const steps = scn.steps(p, v);
    const all = new Set(steps.flatMap((s) => s.show || []));
    return {
      scenario: scn.id,
      difficulty: scn.difficulty,
      title: scn.title(p),
      text: `<p>${scn.text(p)}</p><p class="note">${scn.boxes
        ? L(`Find all forces on each box and use Newton’s second law, $${tex('res')} = m\\,a$ (the net force: all forces together). Take g = 10 m/s².`, `Bestimme alle Kräfte auf jede Kiste und verwende das Aktionsprinzip, $${tex('res')} = m\\,a$ (die resultierende Kraft: alle Kräfte zusammen). Rechne mit g = 10 m/s².`)
        : L(`Find all forces on the box and use Newton’s second law, $${tex('res')} = m\\,a$ (the net force: all forces together). Take g = 10 m/s².`, `Bestimme alle Kräfte auf die Kiste und verwende das Aktionsprinzip, $${tex('res')} = m\\,a$ (die resultierende Kraft: alle Kräfte zusammen). Rechne mit g = 10 m/s².`)}</p>`,
      forces: forceTable(scn, p, v),
      fields,
      figure: (view = { task: true }) => scn.scene(p, v, view).render(view),
      // the task with the ticked forces (Set of 'box:kind') and the forces of extra (ids) drawn in
      taskFigure: (ticked, extra) => taskFigure(scn, p, v, forceTable(scn, p, v), ticked, extra),
      solutionFigure: () => scn.scene(p, v, {}).render({ show: all }),
      // the components to identify before the calculation (practice only: angles given in degrees)
      comps: scn.comps && p.pyth ? scn.comps(p) : [],
      hints: scn.hints(p, v),
      solution: steps.map((s) => s.text),
      results: fields.map((f) => `$${tex(...f.sym)} = ${tq(f.value, f.unit)}$`).join(', '),
      steps,
      p, v,
    };
  }

  // Parameters for which ok(p) holds, if found; else the first that fit at all.
  function make(scn, r, ok, o) {
    let first = null;
    for (let k = 0; k < 5000; k++) {
      const p = scn.make(r, o);
      if (!p) continue;
      if (!ok || ok(p)) return p;
      first = first || p;
    }
    return first;
  }
  // Results that are exact with at most one decimal place, so that none needs rounding.
  const tenth = (x) => Math.abs(10 * x - Math.round(10 * x)) < 1e-9;
  const neat = (scn) => (scn.trig ? null : (p) => Object.values(scn.solve(p)).every(tenth));

  // A practice exercise: with nice results, except where sine or cosine come in. Without a
  // calculator (calc false): no sine or cosine at all, and results that are multiples of 0.5.
  function generate(level, seed, calc = true) {
    const r = rng(seed), list = pool(level).filter((s) => calc || !s.trig);
    const scn = list[Math.floor(r() * list.length)];
    const ok = calc ? neat(scn) : (p) => nice(scn, p);
    return { ...exercise(scn, make(scn, r, ok)), id: `${level}${calc ? '' : '-nocalc'}-${seed}`, level, seed, calc };
  }

  // All wanted quantities multiples of 0.5 and the angle (if any) the 3-4-5 angle: solvable
  // without a calculator.
  const half = (x) => Math.abs(2 * x - Math.round(2 * x)) < 1e-9;
  const nice = (scn, p) => Object.values(scn.solve(p)).every((x) => half(x) && x >= 0 && x < 1000);

  // A practice exercise of the given situation: angles of right triangles with whole sides, so that
  // the components the student identifies (and the app works out) are whole numbers, and the
  // results need no rounding.
  function practiceOf(scenario, seed) {
    const scn = byId(scenario);
    const whole = (p) => !scn.comps || scn.comps(p).every((c) => Math.abs(c.baseVal * Math[c.fn](rad(p.alpha)) - Math.round(c.baseVal * Math[c.fn](rad(p.alpha)))) < 1e-9);
    return { ...exercise(scn, make(scn, rng(seed), (p) => whole(p) && Object.values(scn.solve(p)).every(tenth), { pyth: true })), seed };
  }

  // An exercise of the given situation (for the arcade); with o.nice, one that needs no calculator.
  function generateFor(scenario, seed, o = {}) {
    const scn = byId(scenario);
    return { ...exercise(scn, make(scn, rng(seed), o.nice ? (p) => nice(scn, p) : null, o)), seed, nice: !!o.nice };
  }

  // A multiple-choice question about one quantity of an exercise: the right value and three wrong
  // ones, first those of typical wrong ideas (not g = 9.81 m/s²), then other quantities of the
  // exercise, then simple slips. All options are positive multiples of 0.5 and clearly different.
  function quiz(ex, seed) {
    const r = rng(seed), shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const traps = (f) => f.traps.filter((t) => t.flag !== 'g');
    const cands = ex.fields.filter((f) => traps(f).length);
    const f = cands.length ? cands[Math.floor(r() * cands.length)] : ex.fields[ex.fields.length - 1];
    const options = [{ value: f.value, correct: true }];
    const fits = (x) => Number.isFinite(x) && x > 0 && half(x) && options.every((o) => Math.abs(o.value - x) > Math.max(0.4, 0.05 * Math.max(o.value, x)));
    const add = (list) => { for (const o of list) if (options.length < 4 && fits(o.value)) options.push(o); };
    add(shuffle(traps(f).map((t) => ({ value: t.value, flag: t.flag, why: t.why }))));
    add(shuffle(ex.fields.filter((g) => g !== f && g.unit === f.unit).map((g) => ({ value: g.value }))));
    const v = f.value, step = v >= 20 ? 10 : v >= 4 ? 2 : 0.5;
    add(shuffle([2 * v, v / 2, v + step, v - step, v + 2 * step, v - 2 * step, 3 * v, v + 5 * step].map((value) => ({ value }))));
    return { field: f, options: shuffle(options) };
  }

  // The tutor: the situation with what is wanted, then the steps of the solution, each with the
  // forces it talks about highlighted.
  function tutorial(lesson) {
    const ex = exercise(byId(lesson.scenario), lesson.p);
    const wanted = ex.fields.map((f) => `${f.what} $${tex(...f.sym)}$`).join(', ');
    const first = {
      text: `<p class="step-rule">${L('The situation', 'Die Situation')}</p>${ex.text}<p>${L('Wanted', 'Gesucht')}: ${wanted}.</p>`,
      figure: ex.figure({ task: true }),
    };
    const frames = ex.steps.map((s) => ({ text: s.text, figure: ex.figure({ show: new Set(s.show || []), hl: new Set(s.hl || []) }) }));
    return { frames: [first, ...frames] };
  }

  root.Forces = { LEVELS, SCENARIOS, generate, generateFor, practiceOf, quiz, nice, tutorial };
  if (typeof module !== 'undefined') module.exports = root.Forces;
})(typeof window !== 'undefined' ? window : globalThis);
