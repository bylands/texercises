// The tutor's worked examples, from easy to hard: the situations of the worksheet
// “Übungen Kräftesysteme” (scenario and parameters as in scenarios.js), then a student's attempt
// with one wrong step (error: the practice type, p.err as in generator.js). Each example's
// practice: its stages, with the exercise types (scenarios) of each.
(function (root) {
  'use strict';

  const EXAMPLES = [
    {
      scenario: 'rest-angle', p: { m: 1.5, F: 14, alpha: 30, ref: 'v' },
      practice: [{ types: ['rest-angle'] }, { en: 'lifted or pressed straight', de: 'senkrecht gezogen oder gedrückt', types: ['rest-up'] }],
      name: { en: 'At rest', de: 'In Ruhe' },
      idea: { en: 'A box at rest: the forces balance, vertically and horizontally. The pull carries part of the weight, so the normal force is less than the weight.', de: 'Eine ruhende Kiste: Die Kräfte heben sich auf, senkrecht und waagrecht. Die Zugkraft trägt einen Teil der Gewichtskraft, darum ist die Normalkraft kleiner als die Gewichtskraft.' },
    },
    {
      scenario: 'pull-friction', p: { m: 3, mu: 0.6, given: 'a', a: 2 },
      practice: [{ types: ['pull-friction'] }],
      name: { en: 'Pulled with friction', de: 'Mit Reibung gezogen' },
      idea: { en: 'Only the net force accelerates the box: the pull has to overcome friction as well.', de: 'Nur die resultierende Kraft beschleunigt die Kiste: Die Zugkraft muss auch die Reibung überwinden.' },
    },
    {
      scenario: 'push-pair', p: { m1: 3, m2: 2, mu: 0, F: 15 },
      practice: [{ types: ['push-pair'] }, { en: 'joined by a rope', de: 'mit einem Seil verbunden', types: ['rope-pair'] }],
      name: { en: 'Two boxes pushed', de: 'Zwei Kisten geschoben' },
      idea: { en: 'First both boxes together as one system, then one box alone: the left box passes on only part of the push.', de: 'Zuerst beide Kisten zusammen als ein System, dann eine Kiste allein: Die linke Kiste gibt nur einen Teil der Kraft weiter.' },
    },
    {
      scenario: 'table-pulley', p: { m1: 4, m2: 4, mu: 0.3 },
      practice: [{ types: ['table-pulley'] }, { en: 'both hanging', de: 'beide hängend', types: ['atwood'] }],
      name: { en: 'Over the table edge', de: 'Über die Tischkante' },
      idea: { en: 'A pulley turns the rope around: along the rope, the two boxes form one system. For the rope force, take one box alone: it is less than the weight of the hanging box.', de: 'Eine Rolle lenkt das Seil um: Entlang des Seils bilden die beiden Kisten ein System. Für die Seilkraft nimmt man eine Kiste allein: Sie ist kleiner als die Gewichtskraft der hängenden Kiste.' },
    },
    {
      scenario: 'incline-pull', p: { m: 4, alpha: 30, mu: 0.4, a: 3 },
      practice: [{ types: ['incline-pull'] }],
      name: { en: 'Up a slope', de: 'Den Hang hinauf' },
      idea: { en: 'On a slope, split the weight into a component along the slope and one perpendicular to it.', de: 'Auf einer schiefen Ebene zerlegt man die Gewichtskraft in eine Komponente entlang und eine senkrecht zur Unterlage.' },
    },
    {
      scenario: 'incline-pulley', p: { m1: 6, m2: 8, alpha: 30, mu: 0.4 },
      practice: [{ types: ['incline-pulley'] }],
      name: { en: 'Slope and pulley', de: 'Hang und Rolle' },
      idea: { en: 'Everything together: a hanging box pulls a box up a slope with friction.', de: 'Alles zusammen: Eine hängende Kiste zieht eine Kiste mit Reibung den Hang hinauf.' },
    },
    {
      error: 'error-pulley', scenario: 'table-pulley', p: { m1: 3, m2: 2, mu: 0.2, err: { eqs: [0, 1, 2], at: 3, n: 1 } },
      practice: [{ en: 'on the floor', de: 'auf dem Boden', types: ['error-floor'] }, { en: 'pulleys', de: 'Rollen', types: ['error-pulley'] }, { en: 'slopes', de: 'schiefe Ebenen', types: ['error-slope'] }],
      name: { en: 'Find the error', de: 'Finde den Fehler' },
      idea: { en: 'Check a student’s free-body diagram and equations step by step: a “force of motion”, a missing friction force or a rope force set equal to a weight.', de: 'Prüfe Kräfte und Gleichungen einer Schülerin Schritt für Schritt: eine „Bewegungskraft“, eine fehlende Reibungskraft oder eine Seilkraft gleich einer Gewichtskraft.' },
    },
  ];

  root.Lessons = { EXAMPLES };
  if (typeof module !== 'undefined') module.exports = { EXAMPLES };
})(typeof window !== 'undefined' ? window : globalThis);
