// Exercises and worked examples from the scenarios (see scenarios.js).
// generate(level, seed, formal) gives { id, scenario, difficulty, title, text, forms, table, want,
// vars, value, answer, traps, figure(view), solutionFigure(), hints, solution, results }: forms are
// the forms of energy in the table, table[i][j] whether state i has energy of form j, value the
// wanted quantity (numbers) and answer its formula (formal); traps [{ value, f, tex, why, flag }]
// are answers under typical wrong ideas. generateFor(scenario, seed) gives a formal exercise of a
// given situation (for the arcade), quiz(exercise, seed) four formulas to choose from, and
// tutorial(lesson) the tutor's frames [{ text, figure }].
(function (root) {
  'use strict';

  const EC = root.EC, Expr = root.Expr, { SCENARIOS } = root.Scenarios;
  const { L, tex: T, etex, rng, trq, CIRCLED } = EC;

  // Practice levels by difficulty: easy ★–★★, medium ★★★, hard ★★★★–★★★★★.
  const LEVELS = {
    easy: { name: () => L('Easy', 'Einfach'), from: 1, to: 2 },
    medium: { name: () => L('Medium', 'Mittel'), from: 3, to: 3 },
    hard: { name: () => L('Hard', 'Schwierig'), from: 4, to: 5 },
    mixed: { name: () => L('Mixed', 'Gemischt'), from: 1, to: 5 },
  };
  const pool = (level) => SCENARIOS.filter((s) => s.difficulty >= LEVELS[level].from && s.difficulty <= LEVELS[level].to);
  const byId = (id) => SCENARIOS.find((s) => s.id === id);

  // What a wrong answer suggests (scenarios may say it better, see their why).
  const WHY = {
    root: () => L('The energy equation gives the square of the speed: take the square root at the end.', 'Die Energiegleichung liefert das Quadrat der Geschwindigkeit: Am Schluss musst du noch die Wurzel ziehen.'),
    square: () => L('The energy grows with the square: ½ m v² and ½ k s².', 'Die Energie wächst mit dem Quadrat: ½ m v² und ½ k s².'),
    half: () => L('Check the factor ½ in ½ m v² and ½ k s².', 'Prüfe den Faktor ½ in ½ m v² und ½ k s².'),
    fall: () => L('What counts is the height difference between the two states.', 'Entscheidend ist der Höhenunterschied zwischen den beiden Zuständen.'),
    start: () => L('The body is already moving at the start: its kinetic energy there counts too.', 'Der Körper bewegt sich schon am Anfang: Seine kinetische Energie dort zählt auch.'),
    addv: () => L('Speeds do not add up, energies do: add ½ m v² and m g h, then find the speed.', 'Geschwindigkeiten addieren sich nicht, Energien schon: Addiere ½ m v² und m g h und bestimme dann die Geschwindigkeit.'),
    dir: () => L('The direction of the throw does not matter: the kinetic energy depends only on the speed.', 'Die Wurfrichtung spielt keine Rolle: Die kinetische Energie hängt nur vom Betrag der Geschwindigkeit ab.'),
    spring: () => L('The elastic energy is missing: the spring is already stretched in this state.', 'Die Spannenergie fehlt: Die Feder ist in diesem Zustand schon gedehnt.'),
    equil: () => L('The lowest point is not where the body would hang at rest: there the spring force is larger than the weight. Use energy conservation, not a balance of forces.', 'Der tiefste Punkt ist nicht die Ruhelage: Dort ist die Federkraft grösser als die Gewichtskraft. Verwende die Energieerhaltung, nicht ein Kräftegleichgewicht.'),
    weight: () => L('The factor g is missing: the potential energy is m g h.', 'Der Faktor g fehlt: Die Lageenergie ist m g h.'),
    solve: () => L('Check how you solved for the wanted quantity.', 'Prüfe, wie du nach der gesuchten Grösse aufgelöst hast.'),
    extra: () => L('The ball falls further than h: while it compresses the spring, it drops by s more.', 'Der Ball fällt weiter als h: Während er die Feder zusammendrückt, sinkt er um s weiter.'),
  };
  const FORMS = (scn) => (scn.spring ? ['pot', 'kin', 'el'] : ['pot', 'kin']);

  // The energy of each state as a sum of formulas: E₁ = m g h + ½ m v₁²
  const energyLines = (scn, p) => scn.energies(p).map((e, i) => {
    const terms = ['pot', 'kin', 'el'].filter((k) => e[k]).map((k) => e[k]);
    return `E_${i + 1} = ${terms.join(' + ') || '0'}`;
  });

  function exercise(scn, p, formal) {
    const forms = FORMS(scn), states = scn.states(p), want = scn.want(p), f = scn.f(p);
    const vars = scn.vars(p), sampled = [...new Set([...vars, 'g'])];
    const why = (flag) => (scn.why && scn.why[flag] ? scn.why[flag](p) : WHY[flag] ? WHY[flag]() : '');
    // traps that differ from the answer and from each other
    const traps = [];
    for (const t of scn.traps(p)) {
      if (Expr.same(t.f, f, p.V, sampled) || traps.some((u) => Expr.same(t.f, u.f, p.V, sampled))) continue;
      // with numbers, a wrong idea that gives nearly the right value cannot be told apart
      const v = t.f(p.V);
      if (!formal && Number.isFinite(v) && Math.abs(v - f(p.V)) <= 0.03 * f(p.V)) continue;
      traps.push({ ...t, value: v, why: why(t.flag) });
    }
    const value = f(p.V), answer = scn.tex(p, true), sym = T(want.key);
    const fig = (view) => {
      const fg = scn.scene(p, formal, view);
      if (view.bars !== undefined) fg.bars(states, forms, { only: view.bars ? new Set(view.bars) : null, hl: view.hl });
      return fg.render();
    };

    // the worked solution: energies of the states, the scenario's steps, then the numbers
    const zero = `<p>${L('Zero level of the potential energy', 'Nullniveau der Lageenergie')}: ${scn.zero(p)}.</p>`;
    const first = {
      rule: L('Energy in each state', 'Energie in jedem Zustand'),
      text: `${zero}${energyLines(scn, p).map((e) => `$$${e}$$`).join('')}`,
      bars: null, hl: [],
    };
    const steps = [first, ...scn.steps(p, formal)];
    if (formal) {
      // the answer highlighted where the last step arrives at it, else as a step of its own
      const last = steps[steps.length - 1], at = last.text.lastIndexOf(answer);
      if (!steps.some((s) => s.text.includes('htmlClass{result}'))) {
        if (at >= 0) last.text = `${last.text.slice(0, at)}\\htmlClass{result}{${answer}}${last.text.slice(at + answer.length)}`;
        else steps.push({ rule: L('Result', 'Resultat'), text: `$$${sym} = \\htmlClass{result}{${answer}}$$`, bars: null, hl: [] });
      }
    } else {
      steps.push({
        rule: L('Insert the values', 'Werte einsetzen'),
        text: `$$${sym} = ${scn.tex(p, false)} = ${scn.insert(p)} \\approx \\htmlClass{result}{${trq(value, want.unit)}}$$`,
        bars: null, hl: [],
      });
    }
    const stepHtml = (s) => (s.rule ? `<p class="step-rule">${s.rule}</p>` : '') + s.text;

    // the given quantities, g last: "h and g", "m, s and v"
    const list = (and) => { const v = [...vars.filter((x) => x !== 'g'), ...vars.filter((x) => x === 'g')].map((x) => `$${T(x)}$`); return v.length > 1 ? `${v.slice(0, -1).join(', ')} ${and} ${v[v.length - 1]}` : v[0]; };
    const note = formal
      ? L(`Neglect friction and air resistance. Give the result as a formula in ${list('and')}.`, `Vernachlässige Reibung und Luftwiderstand. Gib das Resultat als Formel in ${list('und')} an.`)
      : L('Neglect friction and air resistance. Take g = 10 m/s².', 'Vernachlässige Reibung und Luftwiderstand. Rechne mit g = 10 m/s².');

    return {
      scenario: scn.id,
      difficulty: scn.difficulty,
      formal,
      title: scn.title(p),
      text: `<p>${scn.text(p, formal)}</p><p class="note">${note}</p>`,
      zero: scn.zero(p),
      forms,
      table: states.map((s) => forms.map((k) => (s[k] || 0) > 1e-9)),
      want, vars, f, sampled, value, answer, traps,
      figure: (view = {}) => fig(view),
      solutionFigure: () => fig({ bars: null }),
      hints: [
        `${L('Choose the zero level', 'Wähle das Nullniveau')} (${L('here', 'hier')}: ${scn.zero(p)}). ${L('Then write down the energy in each state:', 'Schreibe dann die Energie in jedem Zustand auf:')} $${etex('pot')} = m\\,g\\,h$, $${etex('kin')} = \\tfrac{1}{2}\\,m\\,v^2$${scn.spring ? `, $${etex('el')} = \\tfrac{1}{2}\\,k\\,s^2$` : ''}.`,
        energyLines(scn, p).map((e) => `$${e}$`).join(', '),
        `${L('Energy conservation', 'Energieerhaltung')}: ${scn.hint(p, formal)}`,
      ],
      steps,
      solution: steps.map(stepHtml),
      results: `$${sym} = ${formal ? answer : trq(value, want.unit)}$`,
      p,
    };
  }

  // Parameters that fit (make() may give null).
  function make(scn, r) {
    for (let k = 0; k < 5000; k++) { const p = scn.make(r); if (p) return p; }
    throw new Error(`no parameters for ${scn.id}`);
  }

  // A practice exercise: with numbers, or with symbols (formal).
  function generate(level, seed, formal = true) {
    const r = rng(seed), list = pool(level);
    const scn = list[Math.floor(r() * list.length)];
    return { ...exercise(scn, make(scn, r), formal), id: `${level}${formal ? '' : '-num'}-${seed}`, level, seed };
  }

  // A formal exercise of the given situation (for the arcade and the tests).
  function generateFor(scenario, seed, formal = true) {
    const scn = byId(scenario);
    return { ...exercise(scn, make(scn, rng(seed)), formal), seed };
  }

  // Four formulas to choose from: the answer and three wrong ones, those of different wrong ideas
  // first.
  function quiz(ex, seed) {
    const r = rng(seed), shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const pool = shuffle([...ex.traps]), picked = [];
    for (const t of pool) if (picked.length < 3 && !picked.some((u) => u.flag === t.flag)) picked.push(t);
    for (const t of pool) if (picked.length < 3 && !picked.includes(t)) picked.push(t);
    return shuffle([{ tex: ex.answer, correct: true }, ...picked.map((t) => ({ tex: t.tex, flag: t.flag, why: t.why }))]);
  }

  // Judges a typed formula: { cls, msg, key } with key one of ok, empty, syntax, unknown, wanted,
  // trap, wrong; msg comes from the app's texts unless a trap explains it.
  function judgeFormula(ex, text) {
    const r = Expr.parse(text);
    if (r.error) return { cls: 'bad', key: r.error.key === 'empty' ? 'empty' : 'syntax', error: r.error };
    const used = Expr.vars(r.tree), allowed = new Set([...ex.vars, 'g']);
    const bad = used.filter((v) => !allowed.has(v));
    if (bad.length) {
      const wantVar = ex.want.key === bad[0] || (ex.want.key === 'vp' && bad[0] === 'vp');
      return { cls: 'warn', key: wantVar ? 'wanted' : 'unknown', vars: bad };
    }
    if (Expr.same(r.tree, ex.f, ex.p.V, ex.sampled)) return { cls: 'ok', key: 'ok', tree: r.tree };
    for (const t of ex.traps) if (Expr.same(r.tree, t.f, ex.p.V, ex.sampled)) return { cls: 'bad', key: 'trap', msg: t.why, flag: t.flag, tree: r.tree };
    return { cls: 'bad', key: 'wrong', tree: r.tree };
  }

  // Judges a number: right within 2 %; else a trap's explanation, a rounding slip or wrong.
  function judgeNumber(ex, x) {
    if (Number.isNaN(x)) return { cls: 'bad', key: 'number' };
    const near = (y, z, tol) => Math.abs(y - z) <= tol * Math.max(Math.abs(z), 1e-9);
    if (near(x, ex.value, 0.02)) return { cls: 'ok', key: 'ok' };
    for (const t of ex.traps) if (Number.isFinite(t.value) && near(x, t.value, 0.015)) return { cls: 'bad', key: 'trap', msg: t.why, flag: t.flag };
    if (near(x, ex.value, 0.06)) return { cls: 'warn', key: 'close' };
    return { cls: 'bad', key: 'wrong' };
  }

  // The tutor: the situation, then the steps of the solution with the energy bars.
  function tutorial(lesson) {
    const ex = exercise(byId(lesson.scenario), lesson.p, lesson.formal);
    const first = {
      text: `<p class="step-rule">${L('The situation', 'Die Situation')}</p>${ex.text}<p>${L('Wanted', 'Gesucht')}: ${ex.want.what} $${T(ex.want.key)}$.</p>`,
      figure: ex.figure({}),
    };
    // the motion with its energy bars, played by the app (see motion.js)
    const key = `${lesson.scenario}-${EC.getLang()}`;
    const anim = root.Motion ? root.Motion.make(key, ex) : null;
    const watch = anim && {
      text: `<p class="step-rule">${L('Watch the energy', 'Die Energie beobachten')}</p>` +
        `<p>${L(`The body moves from ① to ${CIRCLED[ex.table.length - 1]} and stops for a moment in each state; ❚❚ pauses it, and the slider moves it back and forth. The bars show how its energy is shared at every moment.`,
          `Der Körper bewegt sich von ① bis ${CIRCLED[ex.table.length - 1]} und hält in jedem Zustand kurz an; ❚❚ hält ihn an, und mit dem Schieberegler bewegst du ihn vor und zurück. Die Balken zeigen, wie seine Energie in jedem Moment aufgeteilt ist.`)}</p>` +
        `<p>${L('The dashed line, the total energy, stays where it is: energy only changes its form.', 'Die gestrichelte Linie, die Gesamtenergie, bleibt, wo sie ist: Die Energie ändert nur ihre Form.')}</p>`,
      figure: anim.markup(key),
    };
    const frames = ex.steps.map((s) => ({
      text: (s.rule ? `<p class="step-rule">${s.rule}</p>` : '') + s.text,
      figure: ex.figure({ bars: s.bars, hl: new Set(s.hl) }),
    }));
    return { frames: watch ? [first, watch, ...frames] : [first, ...frames], ex };
  }

  root.Energy = { LEVELS, SCENARIOS, WHY, CIRCLED, generate, generateFor, quiz, judgeFormula, judgeNumber, tutorial };
  if (typeof module !== 'undefined') module.exports = root.Energy;
})(typeof window !== 'undefined' ? window : globalThis);
