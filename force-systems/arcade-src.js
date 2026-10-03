// The questions of the arcade (see arcade.js, shared by the apps): each asks for one quantity of an
// exercise that needs no calculator, with four options (see quiz() in generator.js).
(function (root) {
  'use strict';

  const FS = root.FS, { generateFor, quiz, SCENARIOS } = root.Forces;
  const L = (en, de) => FS.L(en, de);

  // The idea behind each wrong-answer flag (g = 9.81 m/s² never comes up: the values are made for g = 10 m/s²).
  const concept = { swap: 'comp', whole: 'comp', flatN: 'normal', noFric: 'friction', noSlope: 'slope', oneMass: 'mass', hangW: 'rope', hangW2: 'rope', pass: 'pass', dirF: 'dir' };
  const concepts = () => ({
    comp: L('components of a force', 'Komponenten einer Kraft'),
    normal: L('normal force equal to the weight', 'Normalkraft gleich Gewichtskraft'),
    friction: L('friction forgotten', 'Reibung vergessen'),
    slope: L('component down the slope forgotten', 'Hangabtriebskraft vergessen'),
    mass: L('only one mass accelerated', 'nur eine Masse beschleunigt'),
    rope: L('rope force equal to a weight', 'Seilkraft gleich einer Gewichtskraft'),
    pass: L('whole force passed on', 'ganze Kraft weitergegeben'),
    dir: L('direction of a force', 'Richtung einer Kraft'),
  });

  const ask = (f) => L(`Find the ${f.what} $${FS.tex(...f.sym)}$.`, `Wie gross ist die ${f.what} $${FS.tex(...f.sym)}$?`);

  function question(kind, seed) {
    const ex = generateFor(kind, seed, { nice: true }), qz = quiz(ex, seed), f = qz.field;
    return {
      title: ex.title,
      text: ex.text,
      figure: ex.figure({ task: true, tight: true }),
      ask: ask(f),
      options: qz.options.map((o) => ({ html: `$${FS.tq(o.value, f.unit)}$`, correct: !!o.correct, flag: o.flag, why: o.why })),
      explain: () => `<div class="figs">${ex.solutionFigure()}</div><div class="steps">${ex.solution.join('')}</div>`,
    };
  }

  root.ArcadeSource = {
    id: 'fs',
    kinds: SCENARIOS.map((s) => ({ id: s.id, difficulty: s.difficulty })),
    question,
    concept,
    concepts,
    intro: () => ({
      tag: L('Answer as many questions as you can in <b>5 minutes</b>: four answers each, no calculator.',
        'Beantworte in <b>5 Minuten</b> so viele Fragen wie möglich: je vier Antworten, kein Taschenrechner.'),
      rule: L('Questions get harder as you go. Choose one of four answers, or press 1–4. The numbers are made for mental arithmetic, with g = 10 m/s².',
        'Die Fragen werden nach und nach schwieriger. Wähle eine von vier Antworten oder drücke 1–4. Die Zahlen sind fürs Kopfrechnen gemacht, mit g = 10 m/s².'),
      example: L('forgetting friction', 'die Reibung vergessen'),
    }),
    // a box pulled up a slope with all its forces, and Newton's second law
    hero: () => `${generateFor('incline-pull', 7, { nice: true }).solutionFigure()}<p class="ar-law">$${FS.tex('res')} = m\\,a$</p>`,
  };
})(window);
