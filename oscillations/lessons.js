// The tutor's worked examples, from easy to hard, the first three with equations of the worksheet
// "S2 Charakteristische Differentialgleichung". Each is a topic of practice (see topics.js) with
// its stages: first exercises like the example, then variations with new ideas (types: the
// exercise types of scenarios.js). An example gives its parameters p, or a seed for them, and
// may go on with more exercises of its topic (more: [{ scenario, p }]).
(function (root) {
  'use strict';

  const P = { c: 1.3, A: 1, m: 1, D: 4, g: 2, gamma: 0.3, B: 1, C1: 1, C2: 0.6, phi: 0.5 };
  const EXAMPLES = [
    {
      // the worksheet: one example of each answer (yes and the period; no and the mistake)
      scenario: 'shm-2', p: { eq: { form: 'inv', y: '\\xi', c: 'k', note: 'dot' }, P, seed: 11 },
      more: [
        { scenario: 'shm-2', p: { eq: { form: 'c1c2', y: '\\psi', c: '\\alpha', note: 'dot' }, P, seed: 5 } },
        { scenario: 'shm-1', p: { eq: { form: 'square', y: 'y', c: '\\delta', note: 'dot' }, P, seed: 3 } },
      ],
      practice: [{ types: ['pick-shm', 'shm-1'] }, { en: 'rearranged equations and solutions', de: 'umgeformte Gleichungen und Lösungen', types: ['shm-2'] }, { en: 'the subtle cases', de: 'die heiklen Fälle', types: ['shm-3'] }],
      name: { en: 'Harmonic or not?', de: 'Harmonisch oder nicht?' },
      idea: { en: 'A simple harmonic motion has an equation of motion ÿ = −ω²·y: the acceleration is proportional to the displacement and points back. Solve for ÿ and compare: if it fits, T = 2π/ω (the factor is ω², not ω); if not, find the term that differs.', de: 'Eine harmonische Schwingung hat eine Bewegungsgleichung ÿ = −ω²·y: Die Beschleunigung ist proportional zur Auslenkung und zeigt zurück. Löse nach ÿ auf und vergleiche: Passt sie, ist T = 2π/ω (der Faktor ist ω², nicht ω); sonst such den Term, der abweicht.' },
    },
    {
      scenario: 'match-1', seed: 2,
      practice: [{ types: ['match-1'] }, { en: 'damped and shifted', de: 'gedämpft und verschoben', types: ['match-2'] }, { en: 'from the graph to the equation', de: 'vom Graphen zur Gleichung', types: ['match-back'] }],
      name: { en: 'Equation and graph', de: 'Gleichung und Graph' },
      idea: { en: 'First the kind of motion from the form of the equation, then the period from ω² = K: T = 2π/√K.', de: 'Zuerst die Art der Bewegung aus der Form der Gleichung, dann die Periode aus ω² = K: T = 2π/√K.' },
    },
    {
      scenario: 'vmax', p: { A: 0.02, f: 2, giveT: false },
      practice: [{ types: ['vmax'] }, { en: 'the other way round', de: 'umgekehrt', types: ['back-f', 'back-A'] }],
      name: { en: 'Fastest and strongest', de: 'Am schnellsten, am stärksten' },
      idea: { en: 'x = A·sin(ωt): the velocity A·ω·cos(ωt) is largest at the equilibrium, the acceleration −A·ω²·sin(ωt) at the turning points.', de: 'x = A·sin(ωt): Die Geschwindigkeit A·ω·cos(ωt) ist in der Gleichgewichtslage am grössten, die Beschleunigung −A·ω²·sin(ωt) an den Umkehrpunkten.' },
    },
    {
      scenario: 'speed-x', p: { A: 0.05, f: 0.5, giveT: true, k: 0.6 },
      practice: [{ types: ['speed-x'] }, { en: 'at a given time', de: 'zu einer bestimmten Zeit', types: ['speed-t'] }],
      name: { en: 'On the way', de: 'Unterwegs' },
      idea: { en: 'Between the equilibrium and a turning point: v = ω·√(A² − x²) and a = −ω²·x.', de: 'Zwischen Gleichgewichtslage und Umkehrpunkt: v = ω·√(A² − x²) und a = −ω²·x.' },
    },
  ];

  root.Lessons = { EXAMPLES };
  if (typeof module !== 'undefined') module.exports = { EXAMPLES };
})(typeof window !== 'undefined' ? window : globalThis);
