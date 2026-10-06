// The questions of the arcade (see arcade.js, shared by the apps): each asks for one answer of an
// exercise, with four options (see quiz() in generator.js): a number, a direction, a choice or a
// ranking.
(function (root) {
  'use strict';

  const CL = root.CL, { practiceOf, quiz, SCENARIOS } = root.Coulomb;
  const L = (en, de) => CL.L(en, de);

  // The idea behind each wrong-answer flag.
  const concept = { noSquare: 'square', noRoot: 'square', wrongWay: 'square', oneCharge: 'charges', noSigns: 'vector', sum: 'vector', between: 'zero', other: 'zero' };
  const concepts = () => ({
    square: L('the distance not squared', 'Abstand nicht quadriert'),
    charges: L('not both charges counted', 'nicht beide Ladungen berücksichtigt'),
    vector: L('forces added as numbers, not as arrows', 'Kräfte als Zahlen statt als Pfeile addiert'),
    zero: L('where the forces can cancel', 'wo sich die Kräfte aufheben können'),
  });

  // the situations of the arcade: those that need no calculator, and the simple ones with numbers
  const KINDS = ['pair', 'factor', 'factor-mix', 'factor-find', 'which-tri', 'which-square', 'nudge-along', 'nudge-across', 'line-end', 'rank', 'zero-like', 'rank4', 'zero-unlike'];

  function question(kind, seed) {
    const ex = practiceOf(kind, seed), qz = quiz(ex, seed), f = qz.field;
    const ask = f.type === 'num' ? L(`Find the ${f.what.replace(/<[^>]*>/g, '')} $${f.sym}$.`, `Wie gross ist $${f.sym}$ (${f.what.replace(/<[^>]*>/g, '')})?`)
      : f.type === 'dir' ? L('In which direction does the net force point?', 'In welche Richtung zeigt die resultierende Kraft?')
        : f.type === 'rank' ? L('Which order is right, from the largest net force to the smallest?', 'Welche Reihenfolge stimmt, von der grössten resultierenden Kraft zur kleinsten?')
          : f.what;
    return {
      title: ex.title,
      text: ex.text,
      figure: ex.figure({ task: true }),
      ask,
      options: qz.options.map((o) => ({ html: o.html, correct: !!o.correct, flag: o.flag, why: o.why })),
      explain: () => `<div class="figs">${ex.solutionFigure()}</div><div class="steps">${ex.solution.join('')}</div>`,
    };
  }

  root.ArcadeSource = {
    id: 'cl',
    kinds: KINDS.map((id) => ({ id, difficulty: SCENARIOS.find((s) => s.id === id).difficulty })),
    question,
    concept,
    concepts,
    intro: () => ({
      tag: L('Answer as many questions as you can in <b>5 minutes</b>: four answers each.',
        'Beantworte in <b>5 Minuten</b> so viele Fragen wie möglich: je vier Antworten.'),
      rule: L('Questions get harder as you go. Choose one of four answers, or press 1–4. Many need no numbers at all: factors, directions and rankings.',
        'Die Fragen werden nach und nach schwieriger. Wähle eine von vier Antworten oder drücke 1–4. Viele brauchen gar keine Zahlen: Faktoren, Richtungen und Rangfolgen.'),
      example: L('forgetting to square the distance', 'den Abstand nicht zu quadrieren'),
    }),
    // three charges in a line with their forces, and Coulomb's law
    hero: () => `${practiceOf('line-end', 4).solutionFigure()}<p class="ar-law">$F = k\\,\\dfrac{|q_1|\\,|q_2|}{r^2}$</p>`,
  };
})(window);
