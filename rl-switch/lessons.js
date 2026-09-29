// The tutor's worked examples, from easy to hard (see tutorial() in generator.js). A circuit:
// r1 (Ω, or null), branches [R (Ω or null), inductor?, L in H, switch?], the switch and V.
// Only the first example starts without a current through the inductor.
(function (root) {
  'use strict';

  const EXAMPLES = [
    {
      name: 'Switching on',
      idea: 'Right after the switch is closed, the inductor still carries no current, so no current flows at all: the whole battery voltage is across the inductor.',
      circuit: { r1: 150, branches: [[null, true, 0.5]], sw: { at: 'main', before: 'open' }, V: 12 },
    },
    {
      name: 'Switching off',
      idea: 'A current flows through the inductor when the battery is cut off. The inductor keeps it flowing, back through the resistor next to it, and a large emf is induced in the coil.',
      circuit: { r1: 150, branches: [[100], [null, true, 0.5]], sw: { at: 'main', before: 'closed' }, V: 12 },
    },
    {
      name: 'Reopening',
      idea: 'The circuit of the texercises exercise “Advanced RL circuit”, long after the switch was closed: when it is opened, the inductor current keeps flowing, around the loop of the two branches.',
      circuit: { r1: 20, branches: [[60, true, 1], [30]], sw: { at: 'main', before: 'closed' }, V: 12 },
    },
    {
      name: 'Branch added',
      idea: 'A switch closes a second branch while a current flows through the inductor: the new branch takes current at once, the inductor branch keeps its current.',
      circuit: { r1: 40, branches: [[60, true, 1], [40, false, null, true]], sw: { at: 'branch', j: 1, before: 'open' }, V: 20 },
    },
    {
      name: 'Bridge removed',
      idea: 'A closed switch has bridged R₁ for a long time. Opening it puts R₁ back into the circuit: the voltage across the branches drops at once, but not the inductor current.',
      circuit: { r1: 30, branches: [[60, true, 2], [30]], sw: { at: 'bridge', before: 'closed' }, V: 24 },
    },
  ];

  root.Lessons = { EXAMPLES };
  if (typeof module !== 'undefined') module.exports = { EXAMPLES };
})(typeof window !== 'undefined' ? window : globalThis);
