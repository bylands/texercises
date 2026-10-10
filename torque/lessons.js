// The tutor's worked examples, from easy to hard: the tasks of the worksheet “Übungen
// Drehmomente” (b and c with their numbers) and more (scenario and parameters as in scenarios.js
// and statics.js). Each is a topic of practice (see topics.js) with its stages: first exercises
// like the example, then variations with new ideas (types: the scenarios).
(function (root) {
  'use strict';

  const EXAMPLES = [
    {
      scenario: 'plate-axis', p: { forces: [{ P: [-3, 1], u: [0, 1], F: 4 }, { P: [2, -2], u: [1, 0], F: 5 }, { P: [3, 2], u: [0, -1], F: 6 }] },
      practice: [{ types: ['plate-axis'] }, { en: 'ranking', de: 'ordnen', types: ['rank-axis'] }],
      name: { en: 'Lever arm', de: 'Hebelarm' },
      idea: { en: 'The torque of a force is the force times its lever arm: the distance from the axis to the line of action.', de: 'Das Drehmoment einer Kraft ist die Kraft mal ihr Hebelarm: der Abstand der Drehachse von der Wirkungslinie.' },
    },
    {
      scenario: 'plate', p: { forces: [{ P: [-3, 1], u: [-0.8, 0.6], F: 5 }, { P: [1, -3], u: [0, 1], F: 4 }, { P: [-4, -3], u: [0.6, 0.8], F: 6 }, { P: [3, 0], u: [1, 0], F: 4 }] },
      practice: [{ types: ['plate'] }, { en: 'ranking', de: 'ordnen', types: ['rank'] }],
      name: { en: 'Oblique forces', de: 'Schräge Kräfte' },
      idea: { en: 'An oblique force: split it into components along the grid, or find the perpendicular distance from D to its line of action.', de: 'Eine schräge Kraft: Zerlege sie in Komponenten entlang des Gitters, oder bestimme den senkrechten Abstand von D zu ihrer Wirkungslinie.' },
    },
    {
      scenario: 'arm-error', p: { forces: [{ P: [-1, -2], u: [-1, 0], F: 7 }, { P: [4, -2], u: [1, 0], F: 5 }, { P: [-3, 3], u: [0, -1], F: 3 }], wrong: 1 },
      practice: [{ types: ['arm-error'] }],
      name: { en: 'Find the error', de: 'Finde den Fehler' },
      idea: { en: 'A lever arm meets the line of action at a right angle; it need not end where the force acts.', de: 'Ein Hebelarm trifft die Wirkungslinie rechtwinklig; er muss nicht dort enden, wo die Kraft angreift.' },
    },
    {
      scenario: 'seesaw', p: { find: 'x', m1: 3, a1: 20, m2: 2 },
      practice: [{ types: ['seesaw'] }, { en: 'two loads on one side', de: 'zwei Lasten auf einer Seite', types: ['lever3'] }],
      name: { en: 'Seesaw', de: 'Wippe' },
      idea: { en: 'A lever is balanced when the torques turning it one way equal those turning it the other way.', de: 'Ein Hebel ist im Gleichgewicht, wenn die Drehmomente in die eine Richtung gleich gross sind wie die in die andere.' },
    },
    {
      scenario: 'beam-weight', p: { len: 100, s: 20, find: 'm', mb: 2 },
      practice: [{ types: ['beam-weight'] }, { en: 'where to hang the load', de: 'wo die Last hängt', types: ['beam-arm'] }],
      name: { en: 'Heavy beam', de: 'Schwerer Balken' },
      idea: { en: 'A beam’s own weight acts at its centre of mass, its middle, and has a torque too.', de: 'Die Gewichtskraft eines Balkens greift in seinem Schwerpunkt an, in seiner Mitte, und hat auch ein Drehmoment.' },
    },
    {
      scenario: 'angle', p: { m: 2, len: 80, a: 20, b: 40, alpha: 60 },
      practice: [{ types: ['angle'] }],
      name: { en: 'At an angle', de: 'Schräg' },
      idea: { en: 'A force at an angle to the beam turns it only with its perpendicular component; equally, its lever arm is shorter than the distance to where it acts.', de: 'Eine schräg zum Balken wirkende Kraft dreht ihn nur mit ihrer senkrechten Komponente; gleichwertig ist ihr Hebelarm kürzer als der Abstand zum Angriffspunkt.' },
    },
    {
      scenario: 'hang', p: { len: 24, m: 2, F2: 10 },
      practice: [{ types: ['hang'] }, { en: 'loads at both ends', de: 'Lasten an beiden Enden', types: ['hang2'] }],
      name: { en: 'Hanging a beam', de: 'Balken aufhängen' },
      idea: { en: 'At rest, both the forces and the torques balance; any point may serve as the axis.', de: 'In Ruhe heben sich sowohl die Kräfte als auch die Drehmomente auf; jeder Punkt kann als Drehachse dienen.' },
    },
    {
      scenario: 'plank', p: { len: 4, b: 4, x: 1, m: 20, M: 60 },
      practice: [{ types: ['plank'] }],
      name: { en: 'Two supports', de: 'Zwei Stützen' },
      idea: { en: 'Two unknown forces: take one support as the axis, so that its force drops out of the torques; the forces give the other.', de: 'Zwei unbekannte Kräfte: Nimm eine Stütze als Drehachse, damit ihre Kraft aus den Drehmomenten herausfällt; die Kräfte liefern die andere.' },
    },
    {
      scenario: 'arm', p: { d: 4, a: 32, c: 16, mA: 1.5, M: 2 },
      practice: [{ types: ['arm'] }],
      name: { en: 'Force in the joint', de: 'Kraft im Gelenk' },
      idea: { en: 'The axis has a force too: the elbow joint takes up what the muscle and the weights leave over, and here it pushes down.', de: 'Auch die Drehachse übt eine Kraft aus: Das Ellbogengelenk nimmt auf, was Muskel und Gewichtskräfte übrig lassen, und drückt hier nach unten.' },
    },
  ];

  root.Lessons = { EXAMPLES };
  if (typeof module !== 'undefined') module.exports = { EXAMPLES };
})(typeof window !== 'undefined' ? window : globalThis);
