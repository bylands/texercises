// The tutor's worked examples, from easy to hard: examples 2, 6 and 9 are the situations A, B and C
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
      scenario: 'incline', formal: false, p: { ask: 'h', ang: 40, V: { g: G, h: 1.8, v: 6 } },
      name: { en: 'Down a slope', de: 'Die schiefe Ebene hinunter' },
      idea: { en: 'Only the height counts, not the angle or the length of the slope.', de: 'Nur die Höhe zählt, nicht der Winkel oder die Länge der Ebene.' },
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
      scenario: 'bungee', formal: false, p: { V: { g: G, m: 70, l: 20, s: 15, k: (2 * 70 * G * 35) / 225, v: Math.sqrt(2 * G * 20) } },
      name: { en: 'Bungee jump', de: 'Bungee-Sprung' },
      idea: { en: 'Free fall first, then the rope stretches like a spring: count the whole drop.', de: 'Zuerst freier Fall, dann dehnt sich das Seil wie eine Feder: Zähle die ganze Fallhöhe.' },
    },
    {
      scenario: 'twice', formal: true, p: { V: { g: G, h: 0.5, s: 0.05, m: 1, k: (2 * G * 0.55) / 0.0025, hp: 2.1 } },
      name: { en: 'Twice the compression', de: 'Doppelte Stauchung' },
      idea: { en: 'Two experiments compared: the elastic energy grows with the square of the compression.', de: 'Zwei Versuche verglichen: Die Spannenergie wächst mit dem Quadrat der Stauchung.' },
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
