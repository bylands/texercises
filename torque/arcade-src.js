// The questions of the arcade (see arcade.js, shared by the apps): each asks for one quantity of an
// exercise that needs no calculator, with four options (see quiz() in generator.js).
(function (root) {
  'use strict';

  const TQ = root.TQ, { generateFor, quiz, SCENARIOS } = root.Torque;
  const L = (en, de) => TQ.L(en, de);

  // The idea behind each wrong-answer flag.
  const concept = {
    arm: 'arm', top: 'arm', swap: 'ratio', oneLoad: 'sum', sumMass: 'sum', lower: 'sum', end: 'pivot', whole: 'pivot', fromHands: 'pivot',
    cos: 'angle', noAngle: 'angle', noBeam: 'beam', onlyLoads: 'beam', noArm: 'beam', full: 'middle', jointUp: 'forces', count: 'length', diam: 'length',
  };
  const concepts = () => ({
    arm: L('distance to the point of action instead of the lever arm', 'Abstand zum Angriffspunkt statt Hebelarm'),
    ratio: L('lever arms the wrong way round', 'Hebelarme vertauscht'),
    sum: L('torques not added', 'Drehmomente nicht addiert'),
    pivot: L('lever arm not measured from the axis', 'Hebelarm nicht von der Drehachse gemessen'),
    angle: L('force at an angle', 'schräge Kraft'),
    beam: L('the beam’s own weight forgotten', 'Gewichtskraft des Balkens vergessen'),
    length: L('parts not weighted by their length', 'Teile nicht nach Länge gewichtet'),
    middle: L('weight not at the centre of mass', 'Gewichtskraft nicht im Schwerpunkt'),
    forces: L('forces not balanced', 'Kräfte nicht im Gleichgewicht'),
  });

  const ask = (f) => L(`Find the ${f.what.replace(/<[^>]*>/g, '')} $${TQ.tex(...f.sym)}$.`, `Wie gross ist $${TQ.tex(...f.sym)}$ (${f.what})?`);

  function question(kind, seed) {
    const ex = generateFor(kind, seed, { nice: true }), qz = quiz(ex, seed), f = qz.field;
    return {
      title: ex.title,
      text: ex.text,
      figure: ex.figure({ task: true }),
      ask: ask(f),
      options: qz.options.map((o) => ({ html: `$${TQ.tq(o.value, f.unit, f.dec)}$`, correct: !!o.correct, flag: o.flag, why: o.why })),
      explain: () => `<div class="figs">${ex.solutionFigure()}</div><div class="steps">${ex.solution.join('')}</div>`,
      key: f.sense ? `${kind}-${seed}` : undefined,
    };
  }

  root.ArcadeSource = {
    id: 'tq',
    // no rings: their numbers need a calculator
    kinds: SCENARIOS.filter((s) => s.calc !== 'always').map((s) => ({ id: s.id, difficulty: s.difficulty })),
    question,
    concept,
    concepts,
    intro: () => ({
      tag: L('Answer as many questions as you can in <b>5 minutes</b>: four answers each, no calculator.',
        'Beantworte in <b>5 Minuten</b> so viele Fragen wie möglich: je vier Antworten, kein Taschenrechner.'),
      rule: L('Questions get harder as you go. Choose one of four answers, or press 1–4. The numbers are made for mental arithmetic, with g = 10 m/s².',
        'Die Fragen werden nach und nach schwieriger. Wähle eine von vier Antworten oder drücke 1–4. Die Zahlen sind fürs Kopfrechnen gemacht, mit g = 10 m/s².'),
      example: L('the distance to the point of action taken as the lever arm', 'den Abstand zum Angriffspunkt als Hebelarm nehmen'),
    }),
    // the seesaw, balanced, and the rule of the lever
    hero: () => `${generateFor('seesaw', 3, { nice: true }).solutionFigure()}<p class="ar-law">$${TQ.tex('F', 1)}\\,d_1 = ${TQ.tex('F', 2)}\\,d_2$</p>`,
  };
})(window);
