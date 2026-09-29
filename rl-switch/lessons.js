// The tutor's worked examples, from easy to hard (see tutorial() in generator.js). A circuit:
// r1 (Ω, or null), branches [R (Ω or null), inductor?, L in H, switch?], the switch and V.
(function (root) {
  'use strict';

  const EXAMPLES = [
    {
      name: 'Switching on',
      idea: 'Right after the switch is closed, the inductor still carries no current, so no current flows at all: the whole battery voltage is across the inductor.',
      circuit: { r1: 4, branches: [[null, true, 0.5]], sw: { at: 'main', before: 'open' }, V: 12 },
    },
    {
      name: 'Inductor in parallel',
      idea: 'An inductor that carried no current still carries none right after switching: the current takes the other way, through the resistor next to it.',
      circuit: { r1: 4, branches: [[12], [null, true, 2]], sw: { at: 'main', before: 'open' }, V: 16 },
    },
    {
      name: 'Closing',
      idea: 'The circuit of the texercises exercise “Advanced RL circuit”: an inductor in series with a resistor, in parallel with a second resistor.',
      circuit: { r1: 2, branches: [[6, true, 1], [3]], sw: { at: 'main', before: 'open' }, V: 12 },
    },
    {
      name: 'Reopening',
      idea: 'The same circuit after a long time, when the switch is opened again: the inductor current keeps flowing, around the loop of the two branches.',
      circuit: { r1: 2, branches: [[6, true, 1], [3]], sw: { at: 'main', before: 'closed' }, V: 12 },
    },
    {
      name: 'Bridge removed',
      idea: 'A closed switch has bridged R₁ for a long time. Opening it puts R₁ back into the circuit: the voltage across the branches drops at once, but not the inductor current.',
      circuit: { r1: 4, branches: [[6, true, 2], [3]], sw: { at: 'bridge', before: 'closed' }, V: 42 },
    },
  ];

  root.Lessons = { EXAMPLES };
  if (typeof module !== 'undefined') module.exports = { EXAMPLES };
})(typeof window !== 'undefined' ? window : globalThis);
