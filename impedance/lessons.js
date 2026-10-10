// The tutor's worked examples and the topics of practice (topics.js), in the order of the learning
// objectives: first the impedance and the shift of a resistor, a coil and a capacitor alone; then
// what a circuit does for small and for large ω, from the reactances ωL and 1/(ωC) (which curve
// belongs to a circuit, and which circuit to a curve, match.js); then the resonance, the minimum of
// Z in series and its maximum in parallel; last, R, L and C read off the curve of an RLC circuit,
// with round values (R in Ω, L in H, C in F), and (appended) series RL and RC with the right
// triangle Z = √(R² + X²). An example's topic is its index in TOPICS. The steps of those worked
// examples come from analysis() in generator.js, as for the practice solutions.
(function (root) {
  'use strict';

  const EXAMPLES = [
    {
      // the three elements alone (app.js, elementsLesson)
      topic: 0, elements: true,
      name: { en: 'Resistor, coil, capacitor', de: 'Widerstand, Spule, Kondensator' },
      idea: { en: 'Each element alone: how its impedance changes with ω, and how the current is shifted against the voltage. Everything else follows from these three.', de: 'Jedes Bauteil allein: wie sich seine Impedanz mit ω ändert und wie der Strom gegenüber der Spannung verschoben ist. Alles Weitere folgt aus diesen dreien.' },
    },
    {
      // two elements: only the ends of the ω axis
      topic: 1,
      name: { en: 'Small and large ω', de: 'Kleines und grosses ω' },
      idea: { en: 'Which curve belongs to a circuit? Look at both ends of the ω axis: for ω → 0 a coil is a wire and a capacitor a gap, for ω → ∞ the other way round. Each answer rules out curves.', de: 'Welche Kurve gehört zu einer Schaltung? Schau an beide Enden der ω-Achse: Für ω → 0 ist eine Spule ein Draht und ein Kondensator ein Unterbruch, für ω → ∞ umgekehrt. Jede Antwort schliesst Kurven aus.' },
      match: { net: 'RC-parallel', q: 1, cands: ['RL-parallel', 'RC-series', 'RC-parallel', 'RL-series'] },
    },
    {
      // the resonance: both ends, then ω₀
      topic: 2,
      name: { en: 'Resonance', de: 'Resonanz' },
      idea: { en: 'At the resonance frequency ω₀ = 1/√(LC) the reactances of coil and capacitor are equal: in series the pair acts like a wire, so Z has its minimum R; in parallel like a gap, so Z has its maximum R.', de: 'Bei der Resonanzfrequenz ω₀ = 1/√(LC) sind die Blindwiderstände von Spule und Kondensator gleich: In Serie wirkt das Paar wie ein Draht, Z hat also sein Minimum R; parallel wie ein Unterbruch, Z hat also sein Maximum R.' },
      match: { net: 'RLC-series', q: 1, cands: ['LC-series', 'RL-series', 'RLC-series', 'RC-series'] },
    },
    {
      // backwards: which circuit has this curve; each question rules out one circuit
      topic: 2,
      name: { en: 'Curve → circuit', de: 'Kurve → Schaltung' },
      idea: { en: 'Which circuit has this curve? Read the curve at both ends and at its minimum or maximum, and ask what can block the whole current there, or short-circuit everything.', de: 'Welche Schaltung hat diese Kurve? Lies die Kurve an beiden Enden und bei ihrem Minimum oder Maximum ab und frage, was dort den ganzen Strom sperren oder alles kurzschliessen kann.' },
      match: { net: 'RLC-parallel-series', q: 1, inverse: true, cands: ['LC-series', 'RL-series', 'RLC-series-parallel', 'RLC-parallel-series'] },
    },
    {
      topic: 3,
      name: { en: 'Values: series RLC', de: 'Werte: RLC in Serie' },
      idea: { en: 'At resonance the reactances of coil and capacitor cancel: the minimum of Z is R. L is the slope for large ω, and C follows from ω₀ = 1/√(LC).', de: 'Bei der Resonanz heben sich die Blindwiderstände von Spule und Kondensator auf: Das Minimum von Z ist R. L ist die Steigung für grosses ω, und C folgt aus ω₀ = 1/√(LC).' },
      circuit: { kind: 'RLC', conn: 'series', R: 50, L: 0.05, C: 2e-5 },
    },
    {
      topic: 3,
      name: { en: 'Values: parallel RLC', de: 'Werte: RLC parallel' },
      idea: { en: 'At resonance only the resistor counts: the maximum of Z is R. L is the slope at the origin, and C follows from ω₀ = 1/√(LC).', de: 'Bei der Resonanz zählt nur der Widerstand: Das Maximum von Z ist R. L ist die Steigung im Ursprung, und C folgt aus ω₀ = 1/√(LC).' },
      circuit: { kind: 'RLC', conn: 'parallel', R: 300, L: 0.1, C: 1e-5 },
    },
    // two elements in series, worked out with the right triangle Z = √(R² + X²) and one point read
    // off the curve at ω = read (pairAnalysis() in generator.js); round values, a 3-4-5 triangle
    {
      topic: 3, pair: true,
      name: { en: 'Values: series RL', de: 'Werte: RL in Serie' },
      idea: { en: 'R and the reactance X = ωL add like the sides of a right triangle, Z = √(R² + X²), not R + X. For small ω the resistor dominates (Z → R), for large ω the coil (Z ≈ ωL); one point read off the curve gives X and so L.', de: 'R und der Blindwiderstand X = ωL addieren sich wie die Seiten eines rechtwinkligen Dreiecks, Z = √(R² + X²), nicht R + X. Für kleines ω dominiert der Widerstand (Z → R), für grosses ω die Spule (Z ≈ ωL); ein abgelesener Punkt liefert X und damit L.' },
      circuit: { kind: 'RL', conn: 'series', R: 30, L: 0.1, C: null }, read: 400,
    },
    {
      topic: 3, pair: true,
      name: { en: 'Values: series RC', de: 'Werte: RC in Serie' },
      idea: { en: 'R and the reactance X = 1/(ωC) add like the sides of a right triangle, Z = √(R² + X²). For small ω the capacitor dominates (Z → ∞), for large ω the resistor (Z → R); one point read off the curve gives X and so C.', de: 'R und der Blindwiderstand X = 1/(ωC) addieren sich wie die Seiten eines rechtwinkligen Dreiecks, Z = √(R² + X²). Für kleines ω dominiert der Kondensator (Z → ∞), für grosses ω der Widerstand (Z → R); ein abgelesener Punkt liefert X und damit C.' },
      circuit: { kind: 'RC', conn: 'series', R: 30, L: null, C: 2.5e-5 }, read: 1000,
    },
  ];

  // the circuits of the matching exercises (match.js): two elements, and those with a resonance
  const TWO = ['RL-series', 'RC-series', 'RL-parallel', 'RC-parallel'];
  const RES = ['RLC-series', 'RLC-parallel', 'LC-series', 'LC-parallel', 'RLC-series-parallel', 'RLC-parallel-series'];
  // The topics of practice (topics.js), each with the worked example it starts from; a step with
  // an example of its own links to that one.
  const TOPICS = [
    {
      name: { en: 'Resistor, coil, capacitor', de: 'Widerstand, Spule, Kondensator' }, example: 0,
      stages: [
        { name: { en: 'Curve and shift', de: 'Kurve und Verschiebung' }, types: ['match-R', 'match-L', 'match-C'] },
        // directly, without the questions: which curve, and which element has a curve
        { name: { en: 'Directly', de: 'Direkt' }, types: ['R', 'L', 'C'].flatMap((id) => [`pickmatch-${id}`, `pickinv-${id}`]) },
      ],
    },
    {
      name: { en: 'Small and large ω', de: 'Kleines und grosses ω' }, example: 1,
      stages: [
        { name: { en: 'Circuit → curve', de: 'Schaltung → Kurve' }, types: TWO.map((id) => `match-${id}`) },
        { name: { en: 'Curve → circuit', de: 'Kurve → Schaltung' }, types: TWO.map((id) => `inv-${id}`), example: 3 },
        // directly, without the questions
        { name: { en: 'Directly', de: 'Direkt' }, types: TWO.flatMap((id) => [`pickmatch-${id}`, `pickinv-${id}`]) },
      ],
    },
    {
      name: { en: 'Resonance', de: 'Resonanz' }, example: 2,
      stages: [
        { name: { en: 'RLC and LC', de: 'RLC und LC' }, types: RES.slice(0, 4).map((id) => `match-${id}`) },
        { name: { en: 'R with an LC pair', de: 'R mit LC-Paar' }, types: RES.slice(4).map((id) => `match-${id}`) },
        { name: { en: 'Curve → circuit', de: 'Kurve → Schaltung' }, types: RES.map((id) => `inv-${id}`), example: 3 },
        { name: { en: 'Directly', de: 'Direkt' }, types: RES.flatMap((id) => [`pickmatch-${id}`, `pickinv-${id}`]) },
      ],
    },
    {
      // reading the values off a graph with the probe: one step, all six circuits
      // byType: the worked example linked while an exercise of that type is shown
      name: { en: 'Values from the curve', de: 'Werte aus der Kurve' }, example: 4, byType: { 'RL-series': 6, 'RC-series': 7 },
      stages: [
        { name: { en: 'R, L and C', de: 'R, L und C' }, types: ['RL-series', 'RC-series', 'RLC-series', 'RL-parallel', 'RC-parallel', 'RLC-parallel'] },
      ],
    },
  ];

  root.Lessons = { EXAMPLES, TOPICS };
  if (typeof module !== 'undefined') module.exports = { EXAMPLES, TOPICS };
})(typeof window !== 'undefined' ? window : globalThis);
