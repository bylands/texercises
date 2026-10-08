// The tutor's worked examples and the topics of practice (topics.js). First which curve belongs to a
// circuit (match.js), with steps from two elements to R with an LC pair; then the series and the
// parallel circuits, each with a step and a worked example per kind (RL, RC, RLC), with round
// values (R in Ω, L in H, C in F). An example's topic is its index in TOPICS. The steps of the
// worked examples come from analysis() in generator.js, as for the practice solutions.
(function (root) {
  'use strict';

  const EXAMPLES = [
    {
      // which curve belongs to a circuit (match.js): the worked example has fixed curves to choose from
      topic: 0,
      name: { en: 'Circuit → curve', de: 'Schaltung → Kurve' },
      idea: { en: 'Which curve belongs to a circuit? Reason before you choose: what Z does for small and for large ω, and at the resonance frequency. Each answer rules out curves.', de: 'Welche Kurve gehört zu einer Schaltung? Überlege, bevor du wählst: was Z für kleines und für grosses ω tut, und bei der Resonanzfrequenz. Jede Antwort schliesst Kurven aus.' },
      match: { net: 'RLC-series', q: 1, cands: ['LC-series', 'RL-series', 'RLC-series', 'RC-series'] },
    },
    {
      // backwards: which circuit has this curve; each question rules out one circuit
      topic: 0,
      name: { en: 'Curve → circuit', de: 'Kurve → Schaltung' },
      idea: { en: 'Which circuit has this curve? Read the curve at both ends and at its minimum or maximum, and ask what can block the whole current there, or short-circuit everything.', de: 'Welche Schaltung hat diese Kurve? Lies die Kurve an beiden Enden und bei ihrem Minimum oder Maximum ab und frage, was dort den ganzen Strom sperren oder alles kurzschliessen kann.' },
      match: { net: 'RLC-parallel-series', q: 1, inverse: true, cands: ['LC-series', 'RL-series', 'RLC-series-parallel', 'RLC-parallel-series'] },
    },
    {
      topic: 1,
      name: { en: 'Series RL', de: 'RL in Serie' },
      idea: { en: 'The impedance starts at R and grows with ω. R is read at ω = 0, L from the slope of the graph for large ω.', de: 'Die Impedanz beginnt bei R und wächst mit ω. R liest man bei ω = 0 ab, L aus der Steigung des Graphen für grosses ω.' },
      circuit: { kind: 'RL', conn: 'series', R: 100, L: 0.1, C: null },
    },
    {
      topic: 1,
      name: { en: 'Series RC', de: 'RC in Serie' },
      idea: { en: 'The impedance comes down from infinity and levels off at R. C follows from the corner frequency, where Z = √2·R.', de: 'Die Impedanz kommt von unendlich herunter und nähert sich R. C folgt aus der Grenzfrequenz, bei der Z = √2·R ist.' },
      circuit: { kind: 'RC', conn: 'series', R: 100, L: null, C: 1e-5 },
    },
    {
      topic: 1,
      name: { en: 'Series RLC', de: 'RLC in Serie' },
      idea: { en: 'At resonance the reactances of coil and capacitor cancel: the minimum of Z is R. L is the slope for large ω, and C follows from ω₀ = 1/√(LC).', de: 'Bei der Resonanz heben sich die Blindwiderstände von Spule und Kondensator auf: Das Minimum von Z ist R. L ist die Steigung für grosses ω, und C folgt aus ω₀ = 1/√(LC).' },
      circuit: { kind: 'RLC', conn: 'series', R: 50, L: 0.05, C: 2e-5 },
    },
    {
      topic: 2,
      name: { en: 'Parallel RL', de: 'RL parallel' },
      idea: { en: 'The impedance starts at 0 and levels off at R. L is the slope of the tangent at the origin.', de: 'Die Impedanz beginnt bei 0 und nähert sich R. L ist die Steigung der Tangente im Ursprung.' },
      circuit: { kind: 'RL', conn: 'parallel', R: 200, L: 0.05, C: null },
    },
    {
      topic: 2,
      name: { en: 'Parallel RC', de: 'RC parallel' },
      idea: { en: 'The impedance starts at R and falls towards 0. C follows from the corner frequency, where Z = R/√2.', de: 'Die Impedanz beginnt bei R und fällt gegen 0. C folgt aus der Grenzfrequenz, bei der Z = R/√2 ist.' },
      circuit: { kind: 'RC', conn: 'parallel', R: 500, L: null, C: 1e-6 },
    },
    {
      topic: 2,
      name: { en: 'Parallel RLC', de: 'RLC parallel' },
      idea: { en: 'At resonance only the resistor counts: the maximum of Z is R. L is the slope at the origin, and C follows from ω₀ = 1/√(LC).', de: 'Bei der Resonanz zählt nur der Widerstand: Das Maximum von Z ist R. L ist die Steigung im Ursprung, und C folgt aus ω₀ = 1/√(LC).' },
      circuit: { kind: 'RLC', conn: 'parallel', R: 300, L: 0.1, C: 1e-5 },
    },
  ];

  // the circuits of the matching exercises (match.js)
  const NETS = ['RL-series', 'RC-series', 'RL-parallel', 'RC-parallel', 'RLC-series', 'RLC-parallel', 'LC-series', 'LC-parallel', 'RLC-series-parallel', 'RLC-parallel-series'];
    // The topics of practice (topics.js), each with the worked example it starts from; a step with
  // an example of its own links to that one.
  const TOPICS = [
    {
      name: { en: 'Circuits and curves', de: 'Schaltungen und Kurven' }, example: 0,
      stages: [
        { name: { en: 'Two elements', de: 'Zwei Bauteile' }, types: ['match-RL-series', 'match-RC-series', 'match-RL-parallel', 'match-RC-parallel'] },
        { name: { en: 'RLC and LC', de: 'RLC und LC' }, types: ['match-RLC-series', 'match-RLC-parallel', 'match-LC-series', 'match-LC-parallel'] },
        { name: { en: 'R with an LC pair', de: 'R mit LC-Paar' }, types: ['match-RLC-series-parallel', 'match-RLC-parallel-series'] },
        { name: { en: 'Curve → circuit', de: 'Kurve → Schaltung' }, types: NETS.map((id) => `inv-${id}`), example: 1 },
        // directly, without the questions
        { name: { en: 'Circuit → curve, directly', de: 'Schaltung → Kurve, direkt' }, types: NETS.map((id) => `pickmatch-${id}`), example: 0 },
        { name: { en: 'Curve → circuit, directly', de: 'Kurve → Schaltung, direkt' }, types: NETS.map((id) => `pickinv-${id}`), example: 1 },
      ],
    },
    {
      name: { en: 'Series circuits', de: 'Serieschaltungen' }, example: 2,
      stages: [
        { name: { en: 'RL', de: 'RL' }, types: ['RL-series'], example: 2 },
        { name: { en: 'RC', de: 'RC' }, types: ['RC-series'], example: 3 },
        { name: { en: 'RLC', de: 'RLC' }, types: ['RLC-series'], example: 4 },
      ],
    },
    {
      name: { en: 'Parallel circuits', de: 'Parallelschaltungen' }, example: 5,
      stages: [
        { name: { en: 'RL', de: 'RL' }, types: ['RL-parallel'], example: 5 },
        { name: { en: 'RC', de: 'RC' }, types: ['RC-parallel'], example: 6 },
        { name: { en: 'RLC', de: 'RLC' }, types: ['RLC-parallel'], example: 7 },
      ],
    },
  ];

  root.Lessons = { EXAMPLES, TOPICS };
  if (typeof module !== 'undefined') module.exports = { EXAMPLES, TOPICS };
})(typeof window !== 'undefined' ? window : globalThis);
