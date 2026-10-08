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
      idea: { en: 'Read the form of the equation: an oscillation needs ÿ = −ω²·y; a term with ẏ damps or drives it, a constant shifts the equilibrium, a plus sign or only ẏ gives no oscillation.', de: 'Lies die Form der Gleichung: Eine Schwingung braucht ÿ = −ω²·y; ein Term mit ẏ dämpft oder treibt sie an, eine Konstante verschiebt die Gleichgewichtslage, ein Pluszeichen oder nur ẏ gibt keine Schwingung.' },
    },
    {
      scenario: 'read-3', p: { A: 3, T: 2, k: 2 },
      practice: [{ types: ['read-3'] }, { en: 'phases in steps of π/4', de: 'Phasen in Schritten von π/4', types: ['read-4'] }],
      name: { en: 'Amplitude, period and phase', de: 'Amplitude, Periode und Phase' },
      idea: { en: 'y(t) = A·sin(ωt + φ₀): the amplitude is the largest displacement, the period the time from crest to crest, and the phase follows from y(0) = A·sin φ₀ and the direction at t = 0.', de: 'y(t) = A·sin(ωt + φ₀): Die Amplitude ist die grösste Auslenkung, die Periode die Zeit von Berg zu Berg, und die Phase folgt aus y(0) = A·sin φ₀ und der Richtung bei t = 0.' },
    },
    {
      scenario: 'points', p: { ask: 'aplus', us: [0.25, 0.625, 1, 1.375] },
      practice: [{ types: ['points'] }],
      name: { en: 'Where on the graph?', de: 'Wo auf dem Graphen?' },
      idea: { en: 'The velocity is the slope of y(t): largest at the equilibrium, zero at the turning points. The acceleration a = −ω²·y is opposite to the displacement: largest at the turning points.', de: 'Die Geschwindigkeit ist die Steigung von y(t): am grössten in der Gleichgewichtslage, null an den Umkehrpunkten. Die Beschleunigung a = −ω²·y ist der Auslenkung entgegengesetzt: am grössten an den Umkehrpunkten.' },
    },
    {
      scenario: 'vmax', p: { A: 0.02, w: 4 },
      practice: [{ types: ['vmax'] }, { en: 'the other way round', de: 'umgekehrt', types: ['back-w', 'back-A'] }],
      name: { en: 'Fastest and strongest', de: 'Am schnellsten, am stärksten' },
      idea: { en: 'y = A·sin(ωt): the velocity A·ω·cos(ωt) is largest at the equilibrium, v̂ = A·ω; the acceleration −A·ω²·sin(ωt) at the turning points, â = A·ω².', de: 'y = A·sin(ωt): Die Geschwindigkeit A·ω·cos(ωt) ist in der Gleichgewichtslage am grössten, v̂ = A·ω; die Beschleunigung −A·ω²·sin(ωt) an den Umkehrpunkten, â = A·ω².' },
    },
    {
      scenario: 'energy', p: { kind: 'share', k: [1, 2] },
      practice: [{ types: ['energy'] }],
      name: { en: 'Energy', de: 'Energie' },
      idea: { en: 'The total energy E = ½·D·A² stays the same; at a displacement y, E_pot = ½·D·y² is the share (y/A)², and the rest is kinetic.', de: 'Die Gesamtenergie E = ½·D·A² bleibt gleich; bei einer Auslenkung y ist E_pot = ½·D·y² der Anteil (y/A)², und der Rest ist kinetisch.' },
    },
  ];

  root.Lessons = { EXAMPLES };
  if (typeof module !== 'undefined') module.exports = { EXAMPLES };
})(typeof window !== 'undefined' ? window : globalThis);
