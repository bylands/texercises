// The check (see check.js, shared by the apps): the learning objectives, each with the kinds of
// question that test it, its worked example and its practice topic (lessons.js), and the
// questions. Each is about one situation, with four options and no calculation: the forces on a
// box, a component of the weight on a slope, an equation for a system along an axis, the system
// that gives a rope force, or the wrong step in a student's attempt.
(function (root) {
  'use strict';

  const FS = root.FS, { generateFor, practiceOf, SCENARIOS, KINDS, MOTION } = root.Forces, Equations = root.Equations;
  const L = (en, de) => FS.L(en, de);

  const OBJECTIVES = [
    { id: 'forces', kinds: ['forces-one', 'forces-two'], tutor: 1, topic: 1,
      name: () => L('Choose a system and draw every force on it: weight, normal force, rope or contact force, static or kinetic friction, a push or pull, and no other.',
        'Ein System wählen und jede Kraft darauf einzeichnen: Gewichtskraft, Normalkraft, Seil- oder Kontaktkraft, Haft- oder Gleitreibung, eine Zug- oder Druckkraft, und keine andere.') },
    { id: 'slope', kinds: ['slope-comp', 'slope-perp'], tutor: 4, topic: 4,
      name: () => L('Resolve the weight on a slope into components parallel and perpendicular to the slope.',
        'Die Gewichtskraft auf einer schiefen Ebene in Komponenten parallel und senkrecht zur Unterlage zerlegen.') },
    { id: 'system', kinds: ['system'], tutor: 2, topic: 2,
      name: () => L('Choose the system so that a wanted force between two bodies, such as a rope force, becomes an external force.',
        'Das System so wählen, dass eine gesuchte Kraft zwischen zwei Körpern, etwa eine Seilkraft, zu einer äusseren Kraft wird.') },
    { id: 'law', kinds: ['law-floor', 'law-pulley'], tutor: 3, topic: 3,
      name: () => L('Set up Newton’s second law along each axis, following the strategy: system, forces, axes, components, equations, then solve.',
        'Das Aktionsprinzip für jede Achse aufstellen, nach dem Vorgehen: System, Kräfte, Achsen, Komponenten, Gleichungen, dann auflösen.') },
    { id: 'error', kinds: ['error'], tutor: 6, topic: 6,
      name: () => L('Find the wrong step in a student’s free-body diagram and equations.', 'Den falschen Schritt in den Kräften und Gleichungen einer Schülerin finden.') },
  ];

  // The idea behind each wrong-answer flag.
  const concept = {
    flatN: 'normal', rope: 'rope', motion: 'motion', noFric: 'friction', swap: 'comp', whole: 'comp', noSlope: 'slope',
    internal: 'internal', mass: 'mass', pass: 'pass', balance: 'balance',
  };
  const concepts = () => ({
    normal: L('normal force taken equal to the weight', 'Normalkraft gleich Gewichtskraft gesetzt'),
    rope: L('rope force taken equal to a weight', 'Seilkraft gleich einer Gewichtskraft gesetzt'),
    motion: L('a “force of motion” drawn', 'eine „Bewegungskraft“ eingezeichnet'),
    friction: L('friction forgotten', 'Reibung vergessen'),
    comp: L('components of a force mixed up', 'Komponenten einer Kraft verwechselt'),
    slope: L('component down the slope forgotten', 'Hangabtriebskraft vergessen'),
    internal: L('internal forces counted for the whole system', 'innere Kräfte beim ganzen System mitgezählt'),
    mass: L('the mass of another system', 'die Masse eines anderen Systems genommen'),
    pass: L('the whole force passed on', 'die ganze Kraft weitergegeben'),
    balance: L('forces taken as balanced although the box accelerates', 'Kräftegleichgewicht trotz Beschleunigung angenommen'),
  });

  const ONE = ['rest-up', 'rest-angle', 'pull-friction', 'incline-pull'], TWO = ['push-pair', 'rope-pair', 'atwood', 'table-pulley', 'incline-pulley'];
  const shuffle = (r, a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const byId = (id) => SCENARIOS.find((s) => s.id === id);
  // the free-body diagram (all forces, the first step of the worked solution), with hl highlighted
  const fbd = (ex, hl = []) => ex.figure({ show: new Set(ex.steps[0].show), hl: new Set(hl) });
  const explain = (ex, html) => () => `<div class="figs">${fbd(ex)}</div><div class="steps">${html}</div>`;
  const choose = (it) => it.options.map((o) => ({ html: o.html, correct: !!o.right, flag: o.flag, why: o.why }));

  // Which forces act on a box: the right list, and lists with one force too many or too few,
  // first a force of motion and friction left out.
  function forces(kind, seed) {
    const r = FS.rng(seed), scn = byId(FS.pick(r, kind === 'forces-one' ? ONE : TWO)), ex = generateFor(scn.id, seed), t = ex.forces;
    const i = Math.floor(r() * t.boxes.length), on = t.table[i], name = (j) => t.kinds[j].name;
    const list = (js, extra) => [...js.map(name), ...(extra ? [extra] : [])].join(', ');
    const has = KINDS.map((k, j) => j).filter((j) => on[j]), s = KINDS.indexOf('s'), rf = KINDS.indexOf('r');
    const typical = [], other = [];
    if (!scn.still && !on[s]) typical.push({ html: list(has, MOTION()), flag: 'motion', why: L('There is no “force of motion”: every force comes from a body that pushes or pulls (or from the Earth).', 'Es gibt keine „Bewegungskraft“: Jede Kraft kommt von einem Körper, der drückt oder zieht (oder von der Erde).') });
    if (on[rf]) typical.push({ html: list(has.filter((j) => j !== rf)), flag: 'noFric', why: L('Friction is missing: it acts wherever a box slides or would slide.', 'Die Reibung fehlt: Sie wirkt, wo immer eine Kiste gleitet oder gleiten würde.') });
    has.filter((j) => j && j !== rf).forEach((j) => other.push({ html: list(has.filter((x) => x !== j)), why: L(`The ${name(j)} is missing.`, `Es fehlt die ${name(j)}.`) }));
    KINDS.forEach((k, j) => { if (!on[j] && j !== s) other.push({ html: list(KINDS.map((x, y) => y).filter((y) => on[y] || y === j)), why: L(`No ${name(j)} acts on it.`, `Auf sie wirkt keine ${name(j)}.`) }); });
    const options = [{ html: list(has), correct: true }, ...shuffle(r, typical), ...shuffle(r, other)].slice(0, 4);
    return { title: ex.title, text: `<p>${byId(ex.scenario).text(ex.p)}</p>`, figure: ex.figure({ task: true }),
      ask: L(`Which forces act on ${t.boxes[i]}?`, `Welche Kräfte wirken auf ${t.boxes[i]}?`), options: shuffle(r, options),
      explain: explain(ex, ex.solution[0]), key: `${ex.scenario}|${JSON.stringify(ex.p)}|${i}` };
  }

  // A component of the weight on a slope: m g sin α, m g cos α, m g tan α or m g.
  function component(seed) {
    const r = FS.rng(seed), scn = byId(FS.pick(r, ['incline-pull', 'incline-pulley'])), ex = generateFor(scn.id, seed);
    const c = FS.pick(r, scn.comps(ex.p)), other = c.fn === 'sin' ? 'cos' : 'sin';
    const options = [
      { html: `$${c.base}\\${c.fn}\\alpha$`, correct: true },
      { html: `$${c.base}\\${other}\\alpha$`, flag: 'swap', why: L('Sine and cosine swapped: the angle of the slope is also the angle between the weight and the perpendicular to the slope; the component next to it is m g cos α.', 'Sinus und Kosinus vertauscht: Der Neigungswinkel ist auch der Winkel zwischen der Gewichtskraft und der Senkrechten zur Unterlage; die Komponente an ihm ist m g cos α.') },
      { html: `$${c.base}\\tan\\alpha$`, flag: 'swap', why: L('tan α is the ratio of two components, not a component.', 'tan α ist das Verhältnis zweier Komponenten, keine Komponente.') },
      { html: `$${c.base}$`, flag: 'whole', why: L('Only a part of the weight acts in this direction.', 'Nur ein Teil der Gewichtskraft wirkt in diese Richtung.') },
    ];
    const step = ex.steps.find((s) => (s.hl || []).includes('Gp'));
    return { title: ex.title, text: `<p>${scn.text(ex.p)}</p>`, figure: ex.figure({ show: new Set(['G', 'Gp', 'Gn']), hl: new Set([c.fig]) }),
      ask: `${c.what.replace(/:$/, '')}: $${c.sym} = {?}$`, options: shuffle(r, options),
      explain: () => `<div class="figs">${ex.figure({ show: new Set(step.show), hl: new Set(step.hl) })}</div><div class="steps">${step.text}</div>`, key: `comp|${scn.id}|${c.key}` };
  }

  // An equation of a situation: with keys, one of those equations.
  function law(ids, seed, keys) {
    const r = FS.rng(seed), id = FS.pick(r, ids), ex = generateFor(id, seed);
    const list = Equations.of(id, ex.p), it = FS.pick(r, keys ? list.filter((e) => keys.includes(e.key)) : list);
    return { title: ex.title, text: `<p>${byId(id).text(ex.p)}</p>`, figure: fbd(ex),
      ask: `${L('Which equation is right?', 'Welche Gleichung stimmt?')} ${it.what.replace(/:$/, '.')}`, options: choose(it),
      explain: explain(ex, `<p>${it.value}</p>`), key: `${id}|${it.key}` };
  }

  // The force between two boxes: for which system, with which equation? The right one is for one
  // box alone; for both boxes together the force does not appear (the right equation) or appears
  // wrongly (an internal force); and the box alone with a typical wrong idea.
  function system(seed) {
    const r = FS.rng(seed), id = FS.pick(r, TWO), ex = generateFor(id, seed), list = Equations.of(id, ex.p);
    const it = FS.pick(r, list.filter((e) => e.want)), both = list.find((e) => e.sys && !e.want);
    const opt = (e, o, more) => ({ html: `${e.sys}: ${o.html}`, ...more });
    const wrong = it.options.filter((o) => !o.right), typical = wrong.filter((o) => ['rope', 'pass', 'mass'].includes(o.flag));
    const w = FS.pick(r, typical.length ? typical : wrong), inner = both.options.find((o) => o.flag === 'internal');
    const force = it.want === 'S' ? L('rope force', 'Seilkraft') : L('force between the boxes', 'Kraft zwischen den Kisten');
    const options = [
      opt(it, it.options.find((o) => o.right), { correct: true }),
      opt(both, both.options.find((o) => o.right), { flag: 'internal', why: L(`Right, but the ${force} does not appear in it: for both boxes together it is an internal force.`, `Richtig, aber die ${force} kommt darin nicht vor: Für beide Kisten zusammen ist sie eine innere Kraft.`) }),
      opt(both, inner, { flag: 'internal', why: inner.why }),
      opt(it, w, { flag: w.flag, why: w.why }),
    ];
    return { title: ex.title, text: `<p>${byId(id).text(ex.p)}</p>`, figure: fbd(ex),
      ask: L(`You want the ${force} $${FS.tex(it.want)}$. Which system and equation give it?`, `Gesucht ist die ${force} $${FS.tex(it.want)}$. Welches System und welche Gleichung liefern sie?`),
      options: shuffle(r, options), explain: explain(ex, `<p>${it.sys}: ${it.value}</p><p>${both.sys}: ${both.value}</p>`), key: `${id}|${it.key}` };
  }

  // The wrong step in a student's attempt (practice's "find the error").
  function error(seed) {
    const r = FS.rng(seed), ex = practiceOf(FS.pick(r, ['error-floor', 'error-pulley', 'error-slope']), seed);
    return { title: ex.title, text: ex.text, figure: ex.taskFigure(), ask: L('Which step is wrong?', 'Welcher Schritt ist falsch?'), options: choose(ex.eqs[0]),
      explain: () => `<div class="figs">${ex.solutionFigure()}</div><div class="steps">${ex.solution.join('')}</div>` };
  }

  function question(kind, seed) {
    if (kind.startsWith('forces')) return forces(kind, seed);
    if (kind === 'slope-comp') return component(seed);
    if (kind === 'slope-perp') return law(['incline-pull', 'incline-pulley'], seed, ['perp', 'fric']);
    if (kind === 'law-floor') return law(['rest-up', 'rest-angle', 'pull-friction', 'push-pair', 'rope-pair'], seed);
    if (kind === 'law-pulley') return law(['atwood', 'table-pulley'], seed);
    if (kind === 'system') return system(seed);
    return error(seed);
  }

  root.CheckSource = { id: 'fs', objectives: OBJECTIVES, question, concept, concepts };
  if (typeof module !== 'undefined') module.exports = root.CheckSource;
})(typeof window !== 'undefined' ? window : globalThis);
