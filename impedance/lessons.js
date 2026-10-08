// The tutor's worked examples: one per kind of circuit, with round values (R in Ω, L in H, C in F);
// each is a topic of practice (topics.js), its type the kind of circuit. The last one is the
// matching exercise (match.js), with stages from two elements to R with an LC pair.
// The steps themselves come from analysis() in generator.js, as for the practice solutions.
(function (root) {
  'use strict';

  const EXAMPLES = [
    {
      name: { en: 'Series RL', de: 'RL in Serie' },
      idea: { en: 'The impedance starts at R and grows with ω. R is read at ω = 0, L from the slope of the graph for large ω.', de: 'Die Impedanz beginnt bei R und wächst mit ω. R liest man bei ω = 0 ab, L aus der Steigung des Graphen für grosses ω.' },
      circuit: { kind: 'RL', conn: 'series', R: 100, L: 0.1, C: null },
      practice: [{ types: ['RL-series'] }],
    },
    {
      name: { en: 'Series RC', de: 'RC in Serie' },
      idea: { en: 'The impedance comes down from infinity and levels off at R. C follows from the corner frequency, where Z = √2·R.', de: 'Die Impedanz kommt von unendlich herunter und nähert sich R. C folgt aus der Grenzfrequenz, bei der Z = √2·R ist.' },
      circuit: { kind: 'RC', conn: 'series', R: 100, L: null, C: 1e-5 },
      practice: [{ types: ['RC-series'] }],
    },
    {
      name: { en: 'Parallel RL', de: 'RL parallel' },
      idea: { en: 'The impedance starts at 0 and levels off at R. L is the slope of the tangent at the origin.', de: 'Die Impedanz beginnt bei 0 und nähert sich R. L ist die Steigung der Tangente im Ursprung.' },
      circuit: { kind: 'RL', conn: 'parallel', R: 200, L: 0.05, C: null },
      practice: [{ types: ['RL-parallel'] }],
    },
    {
      name: { en: 'Parallel RC', de: 'RC parallel' },
      idea: { en: 'The impedance starts at R and falls towards 0. C follows from the corner frequency, where Z = R/√2.', de: 'Die Impedanz beginnt bei R und fällt gegen 0. C folgt aus der Grenzfrequenz, bei der Z = R/√2 ist.' },
      circuit: { kind: 'RC', conn: 'parallel', R: 500, L: null, C: 1e-6 },
      practice: [{ types: ['RC-parallel'] }],
    },
    {
      name: { en: 'Series RLC', de: 'RLC in Serie' },
      idea: { en: 'At resonance the reactances of coil and capacitor cancel: the minimum of Z is R. L is the slope for large ω, and C follows from ω₀ = 1/√(LC).', de: 'Bei der Resonanz heben sich die Blindwiderstände von Spule und Kondensator auf: Das Minimum von Z ist R. L ist die Steigung für grosses ω, und C folgt aus ω₀ = 1/√(LC).' },
      circuit: { kind: 'RLC', conn: 'series', R: 50, L: 0.05, C: 2e-5 },
      practice: [{ types: ['RLC-series'] }],
    },
    {
      name: { en: 'Parallel RLC', de: 'RLC parallel' },
      idea: { en: 'At resonance only the resistor counts: the maximum of Z is R. L is the slope at the origin, and C follows from ω₀ = 1/√(LC).', de: 'Bei der Resonanz zählt nur der Widerstand: Das Maximum von Z ist R. L ist die Steigung im Ursprung, und C folgt aus ω₀ = 1/√(LC).' },
      circuit: { kind: 'RLC', conn: 'parallel', R: 300, L: 0.1, C: 1e-5 },
      practice: [{ types: ['RLC-parallel'] }],
    },
    {
      // which curve belongs to a circuit (match.js): the worked example has fixed curves to choose from
      name: { en: 'Circuit → curve', de: 'Schaltung → Kurve' },
      idea: { en: 'Which curve belongs to a circuit? Reason before you choose: what Z does for small and for large ω, and at the resonance frequency. Each answer rules out curves.', de: 'Welche Kurve gehört zu einer Schaltung? Überlege, bevor du wählst: was Z für kleines und für grosses ω tut, und bei der Resonanzfrequenz. Jede Antwort schliesst Kurven aus.' },
      match: { net: 'RLC-series', q: 1, cands: ['LC-series', 'RL-series', 'RLC-series', 'RC-series'] },
      practice: [
        { name: { en: 'Two elements', de: 'Zwei Bauteile' }, types: ['match-RL-series', 'match-RC-series', 'match-RL-parallel', 'match-RC-parallel'] },
        { name: { en: 'RLC and LC', de: 'RLC und LC' }, types: ['match-RLC-series', 'match-RLC-parallel', 'match-LC-series', 'match-LC-parallel'] },
        { name: { en: 'R with an LC pair', de: 'R mit LC-Paar' }, types: ['match-RLC-series-parallel', 'match-RLC-parallel-series'] },
      ],
    },
  ];

  root.Lessons = { EXAMPLES };
  if (typeof module !== 'undefined') module.exports = { EXAMPLES };
})(typeof window !== 'undefined' ? window : globalThis);
