// The tutor's worked examples, from easy to hard: the tasks of the worksheets “Übungen
// Drehmomente” (b and c with their numbers) and “Übungen Schwerpunkt” (scenario and parameters as
// in scenarios.js).
(function (root) {
  'use strict';

  const EXAMPLES = [
    {
      scenario: 'plate-axis', p: { forces: [{ P: [-3, 1], u: [0, 1], F: 4 }, { P: [2, -2], u: [1, 0], F: 5 }, { P: [3, 2], u: [0, -1], F: 6 }] },
      name: { en: 'Lever arm', de: 'Hebelarm' },
      idea: { en: 'The torque of a force is the force times its lever arm: the distance from the axis to the line of action.', de: 'Das Drehmoment einer Kraft ist die Kraft mal ihr Hebelarm: der Abstand der Drehachse von der Wirkungslinie.' },
    },
    {
      scenario: 'plate', p: { forces: [{ P: [-3, 1], u: [-0.8, 0.6], F: 5 }, { P: [1, -3], u: [0, 1], F: 4 }, { P: [-4, -3], u: [0.6, 0.8], F: 6 }, { P: [3, 0], u: [1, 0], F: 4 }] },
      name: { en: 'Oblique forces', de: 'Schräge Kräfte' },
      idea: { en: 'An oblique force: split it into components along the grid, or find the perpendicular distance from D to its line of action.', de: 'Eine schräge Kraft: Zerlege sie in Komponenten entlang des Gitters, oder bestimme den senkrechten Abstand von D zu ihrer Wirkungslinie.' },
    },
    {
      scenario: 'seesaw', p: { find: 'x', m1: 3, a1: 20, m2: 2 },
      name: { en: 'Seesaw', de: 'Wippe' },
      idea: { en: 'A lever is balanced when the torques turning it one way equal those turning it the other way.', de: 'Ein Hebel ist im Gleichgewicht, wenn die Drehmomente in die eine Richtung gleich gross sind wie die in die andere.' },
    },
    {
      scenario: 'beam-weight', p: { len: 100, s: 20, find: 'm', mb: 2 },
      name: { en: 'Heavy beam', de: 'Schwerer Balken' },
      idea: { en: 'A beam’s own weight acts at its middle and has a torque too.', de: 'Die Gewichtskraft eines Balkens greift in seiner Mitte an und hat auch ein Drehmoment.' },
    },
    {
      scenario: 'angle', p: { m: 2, len: 80, a: 20, b: 40, alpha: 60 },
      name: { en: 'At an angle', de: 'Schräg' },
      idea: { en: 'A force at an angle to the beam turns it only with its perpendicular component.', de: 'Eine schräg zum Balken wirkende Kraft dreht ihn nur mit ihrer senkrechten Komponente.' },
    },
    {
      scenario: 'hang', p: { len: 24, m: 2, F2: 10 },
      name: { en: 'Hanging a beam', de: 'Balken aufhängen' },
      idea: { en: 'At rest, both the forces and the torques balance; any point may serve as the axis.', de: 'In Ruhe heben sich sowohl die Kräfte als auch die Drehmomente auf; jeder Punkt kann als Drehachse dienen.' },
    },
    {
      scenario: 'com-L', p: { h: 12, b: 8 },
      name: { en: 'Centre of mass', de: 'Schwerpunkt' },
      idea: { en: 'The centre of mass of a figure of wire is the mean of its parts’ centres, each weighted with its length.', de: 'Der Schwerpunkt einer Drahtfigur ist der Mittelwert der Schwerpunkte ihrer Teile, jeder mit seiner Länge gewichtet.' },
    },
    {
      scenario: 'com-loop', p: { h: 10, r: 3 },
      name: { en: 'Ring on a stick', de: 'Ring auf Stab' },
      idea: { en: 'A ring counts with its whole circumference, at its centre.', de: 'Ein Ring zählt mit seinem ganzen Umfang, in seinem Mittelpunkt.' },
    },
  ];

  root.Lessons = { EXAMPLES };
  if (typeof module !== 'undefined') module.exports = { EXAMPLES };
})(typeof window !== 'undefined' ? window : globalThis);
