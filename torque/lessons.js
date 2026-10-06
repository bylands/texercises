// The tutor's worked examples, from easy to hard: the tasks of the worksheets “Übungen
// Drehmomente” (b and c with their numbers) and “Übungen Schwerpunkt” (scenario and parameters as
// in scenarios.js). Each is a topic of practice (see topics.js) with its stages: first exercises
// like the example, then variations with new ideas (types: the scenarios).
(function (root) {
  'use strict';

  const EXAMPLES = [
    {
      scenario: 'plate-axis', p: { forces: [{ P: [-3, 1], u: [0, 1], F: 4 }, { P: [2, -2], u: [1, 0], F: 5 }, { P: [3, 2], u: [0, -1], F: 6 }] },
      practice: [{ types: ['plate-axis'] }],
      name: { en: 'Lever arm', de: 'Hebelarm' },
      idea: { en: 'The torque of a force is the force times its lever arm: the distance from the axis to the line of action.', de: 'Das Drehmoment einer Kraft ist die Kraft mal ihr Hebelarm: der Abstand der Drehachse von der Wirkungslinie.' },
    },
    {
      scenario: 'plate', p: { forces: [{ P: [-3, 1], u: [-0.8, 0.6], F: 5 }, { P: [1, -3], u: [0, 1], F: 4 }, { P: [-4, -3], u: [0.6, 0.8], F: 6 }, { P: [3, 0], u: [1, 0], F: 4 }] },
      practice: [{ types: ['plate'] }],
      name: { en: 'Oblique forces', de: 'Schräge Kräfte' },
      idea: { en: 'An oblique force: split it into components along the grid, or find the perpendicular distance from D to its line of action.', de: 'Eine schräge Kraft: Zerlege sie in Komponenten entlang des Gitters, oder bestimme den senkrechten Abstand von D zu ihrer Wirkungslinie.' },
    },
    {
      scenario: 'seesaw', p: { find: 'x', m1: 3, a1: 20, m2: 2 },
      practice: [{ types: ['seesaw'] }, { en: 'two loads, crowbar, winch', de: 'zwei Lasten, Brecheisen, Seilwinde', types: ['lever3', 'crowbar', 'winch'] }, { en: 'mobile', de: 'Mobile', types: ['mobile'] }],
      name: { en: 'Seesaw', de: 'Wippe' },
      idea: { en: 'A lever is balanced when the torques turning it one way equal those turning it the other way.', de: 'Ein Hebel ist im Gleichgewicht, wenn die Drehmomente in die eine Richtung gleich gross sind wie die in die andere.' },
    },
    {
      scenario: 'beam-weight', p: { len: 100, s: 20, find: 'm', mb: 2 },
      practice: [{ types: ['beam-weight'] }, { en: 'wheelbarrow', de: 'Schubkarre', types: ['wheelbarrow'] }],
      name: { en: 'Heavy beam', de: 'Schwerer Balken' },
      idea: { en: 'A beam’s own weight acts at its middle and has a torque too.', de: 'Die Gewichtskraft eines Balkens greift in seiner Mitte an und hat auch ein Drehmoment.' },
    },
    {
      scenario: 'angle', p: { m: 2, len: 80, a: 20, b: 40, alpha: 60 },
      practice: [{ types: ['angle'] }, { en: 'crane boom', de: 'Kranausleger', types: ['crane'] }],
      name: { en: 'At an angle', de: 'Schräg' },
      idea: { en: 'A force at an angle to the beam turns it only with its perpendicular component.', de: 'Eine schräg zum Balken wirkende Kraft dreht ihn nur mit ihrer senkrechten Komponente.' },
    },
    {
      scenario: 'hang', p: { len: 24, m: 2, F2: 10 },
      practice: [{ types: ['hang'] }, { en: 'loads at both ends', de: 'Lasten an beiden Enden', types: ['hang2'] }],
      name: { en: 'Hanging a beam', de: 'Balken aufhängen' },
      idea: { en: 'At rest, both the forces and the torques balance; any point may serve as the axis.', de: 'In Ruhe heben sich sowohl die Kräfte als auch die Drehmomente auf; jeder Punkt kann als Drehachse dienen.' },
    },
    {
      scenario: 'plank', p: { len: 4, b: 4, x: 1, m: 20, M: 60 },
      practice: [{ types: ['plank'] }, { en: 'forearm and biceps', de: 'Unterarm und Bizeps', types: ['arm'] }],
      name: { en: 'Two supports', de: 'Zwei Stützen' },
      idea: { en: 'Two unknown forces: take one support as the axis, so that its force drops out of the torques; the forces give the other.', de: 'Zwei unbekannte Kräfte: Nimm eine Stütze als Drehachse, damit ihre Kraft aus den Drehmomenten herausfällt; die Kräfte liefern die andere.' },
    },
    {
      scenario: 'com-L', p: { h: 12, b: 8 },
      practice: [{ types: ['com-L'] }, { en: 'T and gate', de: 'T und Tor', types: ['com-T', 'com-U'] }, { en: 'triangle', de: 'Dreieck', types: ['com-tri'] }],
      name: { en: 'Centre of mass', de: 'Schwerpunkt' },
      idea: { en: 'Split the figure into simple parts, find the centre of mass of each, then combine them two at a time: the common centre divides the line between them so that m₁ · a₁ = m₂ · a₂.', de: 'Zerlege die Figur in einfache Teile, bestimme den Schwerpunkt jedes Teils und fasse sie dann schrittweise zu zweit zusammen: Der gemeinsame Schwerpunkt teilt die Verbindungslinie so, dass m₁ · a₁ = m₂ · a₂.' },
    },
    {
      scenario: 'com-loop', p: { h: 10, r: 3 },
      practice: [{ types: ['com-loop'] }, { en: 'two rings', de: 'zwei Ringe', types: ['com-bell'] }],
      name: { en: 'Ring on a stick', de: 'Ring auf Stab' },
      idea: { en: 'A ring counts with its whole circumference, at its centre.', de: 'Ein Ring zählt mit seinem ganzen Umfang, in seinem Mittelpunkt.' },
    },
    {
      scenario: 'tip', p: { w: 60, h: 120, y: 90, m: 30 },
      practice: [{ types: ['tip'] }, { en: 'how far it can lean', de: 'wie weit er sich neigen kann', types: ['tilt'] }],
      name: { en: 'Tipping over', de: 'Kippen' },
      idea: { en: 'A body tips about an edge: the weight, acting at the centre of mass, holds it back.', de: 'Ein Körper kippt um eine Kante: Die Gewichtskraft, die im Schwerpunkt angreift, hält ihn zurück.' },
    },
    {
      scenario: 'ladder', p: { a: 1.5, h: 2, len: 2.5, m: 12 },
      practice: [{ types: ['ladder'] }, { en: 'with a person on it', de: 'mit einer Person darauf', types: ['ladder-person'] }],
      name: { en: 'Ladder', de: 'Leiter' },
      idea: { en: 'Forces at both ends of the ladder: the foot as the axis leaves only the wall’s force in the torques; then friction from the forces.', de: 'Kräfte an beiden Enden der Leiter: Mit dem Fusspunkt als Drehachse bleibt nur die Kraft der Wand in den Drehmomenten; dann die Reibung aus den Kräften.' },
    },
  ];

  root.Lessons = { EXAMPLES };
  if (typeof module !== 'undefined') module.exports = { EXAMPLES };
})(typeof window !== 'undefined' ? window : globalThis);
