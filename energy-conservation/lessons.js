// The tutor's worked examples, from easy to hard: examples 2, 5 and 6 are the situations A, B and C
// of the worksheet “Übungen Energieerhaltung”, solved with symbols as there (scenario and
// parameters as in scenarios.js).
(function (root) {
  'use strict';

  const G = root.EC.G;
  const EXAMPLES = [
    {
      scenario: 'fall', formal: false, p: { dir: 'drop', ask: 'v', vk: 'v', V: { g: G, h: 5, v: Math.sqrt(2 * G * 5) } },
      name: { en: 'Free fall', de: 'Freier Fall' },
      idea: { en: 'Potential energy becomes kinetic energy: the total energy stays the same.', de: 'Lageenergie wird zu kinetischer Energie: Die Gesamtenergie bleibt gleich.' },
    },
    {
      scenario: 'part-drop', formal: true, p: { fr: [2, 3], V: { g: G, h: 3, hp: 2, vp: Math.sqrt(2 * G) } },
      name: { en: 'Part of the way down', de: 'Ein Teil des Wegs' },
      idea: { en: 'Halfway states have both kinds of energy. Only the height fallen turns into kinetic energy.', de: 'Zwischenzustände haben beide Energieformen. Nur die Höhe, um die der Ball gefallen ist, wird zu kinetischer Energie.' },
    },
    {
      scenario: 'launcher', formal: false, p: { ask: 'v', V: { g: G, m: 0.5, s: 0.1, k: 200, v: 2 } },
      name: { en: 'Spring launcher', de: 'Federkatapult' },
      idea: { en: 'A compressed spring stores elastic energy, ½ k s², which it gives to the block.', de: 'Eine zusammengedrückte Feder speichert Spannenergie, ½ k s², die sie an den Klotz abgibt.' },
    },
    {
      scenario: 'tower', formal: false, p: { dir: 'up', V: { g: G, h: 10, v0: 5, v: Math.sqrt(25 + 2 * G * 10) } },
      name: { en: 'Thrown from a tower', de: 'Vom Turm geworfen' },
      idea: { en: 'Energies add up, not speeds; and the direction of the throw does not matter.', de: 'Energien werden addiert, nicht Geschwindigkeiten; und die Wurfrichtung spielt keine Rolle.' },
    },
    {
      scenario: 'speed-fraction', formal: true, p: { fr: [2, 3], V: { g: G, h: 4.5, v0: Math.sqrt(2 * G * 4.5), vp: (2 / 3) * Math.sqrt(2 * G * 4.5), hp: 2.5 } },
      name: { en: 'Two thirds of the speed', de: 'Zwei Drittel der Geschwindigkeit' },
      idea: { en: 'Two equations from three states: the speed counts squared in the kinetic energy.', de: 'Zwei Gleichungen aus drei Zuständen: Die Geschwindigkeit zählt im Quadrat.' },
    },
    {
      scenario: 'spring-hang', formal: true, p: { ask: 'v', fr: [1, 2], V: { g: G, s: 0.4, m: 1, k: (2 * G) / 0.4, vp: Math.sqrt(G * 0.2), x: 0.2 } },
      name: { en: 'A block on a spring', de: 'Ein Klotz an der Feder' },
      idea: { en: 'All three forms of energy at once: first find the spring constant from the lowest point.', de: 'Alle drei Energieformen zugleich: Zuerst folgt die Federkonstante aus dem tiefsten Punkt.' },
    },
  ];

  root.Lessons = { EXAMPLES };
  if (typeof module !== 'undefined') module.exports = { EXAMPLES };
})(typeof window !== 'undefined' ? window : globalThis);
