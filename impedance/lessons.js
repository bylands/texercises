// The tutor's worked examples: one per kind of circuit, with round values (R in Ω, L in H, C in F).
// The steps themselves come from analysis() in generator.js, as for the practice solutions.
(function (root) {
  'use strict';

  const EXAMPLES = [
    {
      name: 'Series RL',
      idea: 'The impedance starts at R and grows with ω. R is read at ω = 0, L from the slope of the graph for large ω.',
      circuit: { kind: 'RL', conn: 'series', R: 100, L: 0.1, C: null },
    },
    {
      name: 'Series RC',
      idea: 'The impedance comes down from infinity and levels off at R. C follows from the corner frequency, where Z = √2·R.',
      circuit: { kind: 'RC', conn: 'series', R: 100, L: null, C: 1e-5 },
    },
    {
      name: 'Parallel RL',
      idea: 'The impedance starts at 0 and levels off at R. L is the slope of the tangent at the origin.',
      circuit: { kind: 'RL', conn: 'parallel', R: 200, L: 0.05, C: null },
    },
    {
      name: 'Parallel RC',
      idea: 'The impedance starts at R and falls towards 0. C follows from the corner frequency, where Z = R/√2.',
      circuit: { kind: 'RC', conn: 'parallel', R: 500, L: null, C: 1e-6 },
    },
    {
      name: 'Series RLC',
      idea: 'At resonance the reactances of coil and capacitor cancel: the minimum of Z is R. L is the slope for large ω, and C follows from ω₀ = 1/√(LC).',
      circuit: { kind: 'RLC', conn: 'series', R: 50, L: 0.05, C: 2e-5 },
    },
    {
      name: 'Parallel RLC',
      idea: 'At resonance only the resistor counts: the maximum of Z is R. L is the slope at the origin, and C follows from ω₀ = 1/√(LC).',
      circuit: { kind: 'RLC', conn: 'parallel', R: 300, L: 0.1, C: 1e-5 },
    },
  ];

  root.Lessons = { EXAMPLES };
  if (typeof module !== 'undefined') module.exports = { EXAMPLES };
})(typeof window !== 'undefined' ? window : globalThis);
