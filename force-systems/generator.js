// Exercises and worked examples from the scenarios (see scenarios.js).
// generate(level, seed) gives { id, scenario, title, text, fields: [{ key, sym, unit, what, value,
// traps: [{ value, why, flag }] }], figure(view), hints: [html], solution: [html], results: html },
// where flag names the wrong idea behind a trap; generateFor(scenario, seed, { nice }) one of a given
// situation; quiz(exercise, seed) a multiple-choice question about one of its quantities;
// tutorial(lesson) gives the tutor's frames [{ text, figure }].
(function (root) {
  'use strict';

  const FS = root.FS, { SCENARIOS } = root.Scenarios;
  const { L, tex, tq, rng } = FS;

  const LEVELS = {
    mixed: () => L('Mixed', 'Gemischt'),
    one: () => L('One box', 'Eine Kiste'),
    two: () => L('Two boxes', 'Zwei Kisten'),
    slope: () => L('Pulleys and slopes', 'Rollen und Hänge'),
  };
  const pool = (level) => SCENARIOS.filter((s) => level === 'mixed' || s.level === level);
  const byId = (id) => SCENARIOS.find((s) => s.id === id);

  // What a wrong value suggests: the answer under a typical wrong idea (scenarios may say it better).
  const WHY = {
    g: () => L('That is the value for g = 9.81 m/s². Here, use g = 10 m/s².', 'Das ist der Wert für g = 9,81 m/s². Rechne hier mit g = 10 m/s².'),
    swap: () => L('Sine and cosine swapped? Check which component lies next to the angle.', 'Sinus und Kosinus vertauscht? Prüfe, welche Komponente am Winkel anliegt.'),
    flatN: () => L('The normal force is not equal to the weight here.', 'Die Normalkraft ist hier nicht gleich der Gewichtskraft.'),
    noFric: () => L('Friction is missing.', 'Die Reibung fehlt.'),
    oneMass: () => L('Divide by the total mass of all boxes that are accelerated.', 'Teile durch die gesamte Masse aller Kisten, die beschleunigt werden.'),
    hangW: () => L('The rope force is not equal to the weight of the hanging box.', 'Die Seilkraft ist nicht gleich der Gewichtskraft der hängenden Kiste.'),
  };
  const same = (x, y) => Math.abs(x - y) <= 0.02 * Math.max(Math.abs(y), 0.05);

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
      title: scn.title(p),
      text: `<p>${scn.text(p)}</p><p class="note">${L('Draw all forces on each box and use Newton’s second law, F = m a. Take g = 10 m/s².', 'Zeichne alle Kräfte auf jede Kiste ein und verwende das Aktionsprinzip, F = m a. Rechne mit g = 10 m/s².')}</p>`,
      fields,
      figure: (view = { task: true }) => scn.scene(p, v, view).render(view),
      solutionFigure: () => scn.scene(p, v, {}).render({ show: all }),
      hints: scn.hints(p, v),
      solution: steps.map((s) => s.text),
      results: fields.map((f) => `$${tex(...f.sym)} = ${tq(f.value, f.unit)}$`).join(', '),
      steps,
      p, v,
    };
  }

  const make = (scn, r) => { let p = null; for (let k = 0; k < 500 && !p; k++) p = scn.make(r); return p; };

  function generate(level, seed) {
    const r = rng(seed), list = pool(level);
    const scn = list[Math.floor(r() * list.length)];
    return { ...exercise(scn, make(scn, r)), id: `${level}-${seed}`, level, seed };
  }

  // All wanted quantities multiples of 0.5 and the angle (if any) the 3-4-5 angle: solvable
  // without a calculator.
  const half = (x) => Math.abs(2 * x - Math.round(2 * x)) < 1e-9;
  const nice = (scn, p) => Object.values(scn.solve(p)).every((x) => half(x) && x >= 0 && x < 1000);

  // An exercise of the given situation (for the arcade); with o.nice, one that needs no calculator.
  function generateFor(scenario, seed, o = {}) {
    const scn = byId(scenario), r = rng(seed);
    let p = null;
    for (let k = 0; k < 5000; k++) {
      const c = scn.make(r, o);
      if (c && (!o.nice || nice(scn, c))) { p = c; break; }
    }
    return { ...exercise(scn, p || make(scn, r)), seed, nice: !!o.nice };
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

  root.Forces = { LEVELS, SCENARIOS, generate, generateFor, quiz, nice, tutorial };
  if (typeof module !== 'undefined') module.exports = root.Forces;
})(typeof window !== 'undefined' ? window : globalThis);
