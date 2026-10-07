// The questions of the arcade (see arcade.js, shared by the apps): each asks for one answer of an
// exercise, with four options (see quiz() in generator.js): which equation is harmonic, the
// period, the mistake, a graph or an equation, or a number.
(function (root) {
  'use strict';

  const OC = root.OC, { practiceOf, quiz, SCENARIOS } = root.Osc;
  const L = (en, de) => OC.L(en, de);

  // The idea behind each wrong-answer flag.
  const concept = {
    omega2: 'period', inverse: 'period', freq: 'period', omegaT: 'period',
    sign: 'sign', order: 'order', power: 'linear', const: 'linear', tsq: 'amp', amp: 'amp',
    shift: 'shift', form: 'form', damp: 'damp',
    noTwoPi: 'twopi', twopiT: 'twopi', square: 'square',
    vx: 'vx', linearv: 'vx', rootplus: 'vx', amax: 'vx', swap: 'swap', deg: 'deg',
  };
  const concepts = () => ({
    period: L('ω, ω² and T mixed up', 'ω, ω² und T verwechselt'),
    sign: L('the sign of the restoring acceleration', 'das Vorzeichen der rücktreibenden Beschleunigung'),
    order: L('first and second derivative', 'erste und zweite Ableitung'),
    linear: L('harmonic needs y to the first power', 'harmonisch braucht y in der ersten Potenz'),
    amp: L('a constant amplitude, a phase growing evenly', 'eine konstante Amplitude, eine gleichmässig wachsende Phase'),
    shift: L('a constant only shifts the equilibrium', 'eine Konstante verschiebt nur die Gleichgewichtslage'),
    form: L('harmless features taken for mistakes (letters, notation, rearranging)', 'harmlose Merkmale für Fehler gehalten (Buchstaben, Schreibweise, Umformen)'),
    damp: L('damping: a term with ẏ', 'Dämpfung: ein Term mit ẏ'),
    twopi: L('ω = 2πf = 2π/T', 'ω = 2πf = 2π/T'),
    square: L('v_max = Aω, a_max = Aω²', 'v_max = Aω, a_max = Aω²'),
    vx: L('the speed is largest at the equilibrium', 'die Geschwindigkeit ist in der Gleichgewichtslage am grössten'),
    swap: L('sine or cosine: where it starts', 'Sinus oder Kosinus: wo es startet'),
    deg: L('radians, not degrees', 'Bogenmass, nicht Grad'),
  });

  // the exercise types of the arcade: all but the last one (a number with signs at a time)
  const KINDS = SCENARIOS.map((s) => s.id).filter((id) => id !== 'speed-t');

  function question(kind, seed) {
    const ex = practiceOf(kind, seed), qz = quiz(ex, seed), f = qz.field, scn = SCENARIOS.find((s) => s.id === kind);
    const ask = f.type === 'num' ? L(`Find the ${f.what.replace(/<[^>]*>/g, '')} $${f.sym}$.`, `Wie gross ist $${f.sym}$ (${f.what.replace(/<[^>]*>/g, '')})?`) : f.ask || f.what;
    return {
      title: ex.title,
      text: scn.kind === 'shm' ? '' : ex.text,
      figure: ex.figure({ task: true }),
      ask,
      pics: !!f.pics,
      options: qz.options.map((o) => ({ html: o.html, correct: !!o.correct, flag: o.flag, why: o.why })),
      explain: () => `<div class="figs">${ex.solutionFigure()}</div><div class="steps">${ex.solution.join('')}</div>`,
    };
  }

  root.ArcadeSource = {
    id: 'osc',
    kinds: KINDS.map((id) => ({ id, difficulty: SCENARIOS.find((s) => s.id === id).difficulty })),
    question,
    concept,
    concepts,
    intro: () => ({
      tag: L('Answer as many questions as you can in <b>5 minutes</b>: four answers each.', 'Beantworte in <b>5 Minuten</b> so viele Fragen wie möglich: je vier Antworten.'),
      rule: L('Questions get harder as you go: harmonic or not, periods, graphs, speeds and accelerations. Choose one of four answers, or press 1–4.',
        'Die Fragen werden nach und nach schwieriger: harmonisch oder nicht, Perioden, Graphen, Geschwindigkeiten und Beschleunigungen. Wähle eine von vier Antworten oder drücke 1–4.'),
      example: L('reading ω² as ω', 'ω² als ω zu lesen'),
    }),
    // an oscillation and its equation
    hero: () => `${root.Scenarios.xGraph({ A: 0.02, f: 0.5, start: 'top' })}<p class="ar-law">$\\ddot y = -\\omega^2\\, y$</p>`,
  };
})(window);
