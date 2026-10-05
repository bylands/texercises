// The questions of the arcade (see arcade.js, shared by the apps): each shows a situation with
// symbols and asks for the formula of the wanted quantity, with four formulas to choose from (see
// quiz() in generator.js).
(function (root) {
  'use strict';

  const EC = root.EC, { generateFor, quiz, SCENARIOS } = root.Energy;
  const L = (en, de) => EC.L(en, de);

  // The idea behind each wrong-answer flag.
  const concept = { root: 'root', square: 'square', half: 'half', fall: 'height', extra: 'height', start: 'start', addv: 'addv', dir: 'dir', spring: 'spring', equil: 'equil', weight: 'weight' };
  const concepts = () => ({
    root: L('square root forgotten', 'Wurzel vergessen'),
    square: L('energy not squared', 'Quadrat in der Energie vergessen'),
    half: L('factor ½ forgotten', 'Faktor ½ vergessen'),
    height: L('wrong height difference', 'falscher Höhenunterschied'),
    start: L('energy at the start forgotten', 'Anfangsenergie vergessen'),
    addv: L('speeds added instead of energies', 'Geschwindigkeiten statt Energien addiert'),
    dir: L('direction of the throw', 'Wurfrichtung'),
    spring: L('elastic energy forgotten', 'Spannenergie vergessen'),
    equil: L('lowest point taken as equilibrium', 'tiefster Punkt als Gleichgewicht'),
    weight: L('m g h without g', 'm g h ohne g'),
  });

  function question(kind, seed) {
    const ex = generateFor(kind, seed, true), options = quiz(ex, seed);
    return {
      title: ex.title,
      text: ex.text,
      figure: ex.figure({}),
      ask: L(`Which formula gives the ${ex.want.what} $${EC.tex(ex.want.key)}$?`, `Welche Formel gibt die ${ex.want.what} $${EC.tex(ex.want.key)}$?`),
      options: options.map((o) => ({ html: `$\\displaystyle ${o.tex}$`, correct: !!o.correct, flag: o.flag, why: o.why })),
      explain: () => `<div class="figs">${ex.solutionFigure()}</div><div class="steps">${ex.solution.join('')}</div>`,
    };
  }

  root.ArcadeSource = {
    id: 'ec',
    kinds: SCENARIOS.map((s) => ({ id: s.id, difficulty: s.difficulty })),
    question,
    concept,
    concepts,
    intro: () => ({
      tag: L('Find the right formula for as many situations as you can in <b>5 minutes</b>.',
        'Finde in <b>5 Minuten</b> für möglichst viele Situationen die richtige Formel.'),
      rule: L('Questions get harder as you go. Choose one of four formulas, or press 1–4.',
        'Die Fragen werden nach und nach schwieriger. Wähle eine von vier Formeln oder drücke 1–4.'),
      example: L('adding speeds instead of energies', 'Geschwindigkeiten statt Energien addieren'),
    }),
    // worksheet A with its energy bars, and the law
    hero: () => `${generateFor('part-drop', 9).solutionFigure()}<p class="ar-law">$E_1 = E_2$</p>`,
  };
})(window);
