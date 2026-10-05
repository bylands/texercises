// The tutor's worked examples, from easy to hard (see tutorial() in generator.js). A circuit:
// r1 (Ω, or null), branches [R (Ω or null), inductor?, L in H, switch?], the switch and V.
// Only the first example starts without a current through the inductor.
(function (root) {
  'use strict';

  const EXAMPLES = [
    {
      name: { en: 'Switching on', de: 'Einschalten' },
      idea: {
        en: 'Right after the switch is closed, the inductor still carries no current, so no current flows at all: the whole battery voltage is across the inductor.',
        de: 'Unmittelbar nach dem Schliessen des Schalters führt die Spule noch keinen Strom, also fliesst überhaupt kein Strom: Die ganze Batteriespannung liegt über der Spule.',
      },
      circuit: { r1: 150, branches: [[null, true, 0.5]], sw: { at: 'main', before: 'open' }, V: 12 },
    },
    {
      name: { en: 'Switching off', de: 'Ausschalten' },
      idea: {
        en: 'A current flows through the inductor when the battery is cut off. The inductor keeps it flowing, back through the resistor next to it, and a large emf is induced in the coil.',
        de: 'Durch die Spule fliesst ein Strom, wenn die Batterie abgetrennt wird. Die Spule hält ihn aufrecht, zurück durch den Widerstand daneben, und in der Spule wird eine grosse Spannung induziert.',
      },
      circuit: { r1: 150, branches: [[100], [null, true, 0.5]], sw: { at: 'main', before: 'closed' }, V: 12 },
    },
    {
      name: { en: 'Reopening', de: 'Wieder öffnen' },
      idea: {
        en: 'The circuit of the texercises exercise “Advanced RL circuit”, long after the switch was closed: when it is opened, the inductor current keeps flowing, around the loop of the two branches.',
        de: 'Die Schaltung der texercises-Aufgabe «Advanced RL circuit», lange nachdem der Schalter geschlossen wurde: Beim Öffnen fliesst der Spulenstrom weiter, durch die Masche der beiden Zweige.',
      },
      circuit: { r1: 20, branches: [[60, true, 1], [30]], sw: { at: 'main', before: 'closed' }, V: 12 },
    },
    {
      name: { en: 'Branch added', de: 'Zweig zugeschaltet' },
      idea: {
        en: 'A switch closes a second branch while a current flows through the inductor: the new branch takes current at once, the inductor branch keeps its current.',
        de: 'Ein Schalter schliesst einen zweiten Zweig, während Strom durch die Spule fliesst: Der neue Zweig nimmt sofort Strom auf, der Spulenzweig behält seinen Strom.',
      },
      circuit: { r1: 40, branches: [[60, true, 1], [40, false, null, true]], sw: { at: 'branch', j: 1, before: 'open' }, V: 20 },
    },
    {
      name: { en: 'Bridge removed', de: 'Überbrückung aufgehoben' },
      idea: {
        en: 'A closed switch has bridged R₁ for a long time. Opening it puts R₁ back into the circuit: the voltage across the branches drops at once, but not the inductor current.',
        de: 'Ein geschlossener Schalter hat R₁ lange überbrückt. Öffnet man ihn, ist R₁ wieder im Stromkreis: Die Spannung über den Zweigen sinkt sofort, der Spulenstrom aber nicht.',
      },
      circuit: { r1: 30, branches: [[60, true, 2], [30]], sw: { at: 'bridge', before: 'closed' }, V: 24 },
    },
  ];

  root.Lessons = { EXAMPLES };
  if (typeof module !== 'undefined') module.exports = { EXAMPLES };
})(typeof window !== 'undefined' ? window : globalThis);
