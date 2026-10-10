// The tutor's worked examples and the topics of practice. An example introduces its idea in a few
// frames (intro), then works an exercise of one of the types of scenarios.js (scenario, with its
// parameters p) step by step. A topic of practice (see topics.js) has stages, from exercises like
// the example to variations with new ideas, and the example it belongs to (example(stage)).
(function (root) {
  'use strict';

  const L = (en, de) => root.EW.L(en, de);
  const F = () => root.Figures;
  const fr = (title, text, figure) => ({ title, text, figure });
  const p$ = (s) => `<p>${s}</p>`;

  const EXAMPLES = [
    {
      scenario: 'spec-order', p: { regs: ['micro', 'uv', 'radio', 'vis'], by: 'E', hi: true },
      name: () => L('The spectrum', 'Das Spektrum'),
      idea: () => L('Radio waves, light and X-rays are all electromagnetic waves: in vacuum they travel at c = 3.00·10⁸ m/s. The shorter the wave, the higher its frequency and the larger the energy of its photons.', 'Radiowellen, Licht und Röntgenstrahlung sind alles elektromagnetische Wellen: Im Vakuum laufen sie mit c = 3.00·10⁸ m/s. Je kürzer die Welle, desto höher ihre Frequenz und desto grösser die Energie ihrer Photonen.'),
      intro: [
        fr(() => L('One kind of wave', 'Eine Art von Welle'), () => p$(L('From γ rays to radio waves, the wavelength grows from less than an atom to kilometres. The names of the regions have no sharp borders; what counts is their order.', 'Von der Gammastrahlung bis zu den Radiowellen wächst die Wellenlänge von weniger als einem Atom bis zu Kilometern. Die Namen der Bereiche haben keine scharfen Grenzen; was zählt, ist ihre Reihenfolge.')) +
          p$(L('In vacuum, all travel at the same speed $c$, and $c = \\lambda\\cdot f$: a short wave has a high frequency. The energy of a photon is $E = h\\cdot f$: a short wave also has energetic photons. A common mistake is to think a longer wave carries more energy; it is the other way round.', 'Im Vakuum laufen alle gleich schnell, mit $c$, und $c = \\lambda\\cdot f$: Eine kurze Welle hat eine hohe Frequenz. Die Energie eines Photons ist $E = h\\cdot f$: Eine kurze Welle hat auch energiereiche Photonen. Ein häufiger Fehler ist zu denken, eine längere Welle trage mehr Energie; es ist umgekehrt.')), () => F().spectrum(null, { trend: true })),
      ],
    },
    {
      scenario: 'medium', p: { m: 1, lam0: 600e-9 },
      name: () => L('Light in matter', 'Licht in Materie'),
      idea: () => L('In a medium, light is slower: v = c/n. The frequency stays the same at the border, so the wavelength shrinks: λ = λ₀/n.', 'In einem Medium ist Licht langsamer: v = c/n. Die Frequenz bleibt an der Grenze gleich, also schrumpft die Wellenlänge: λ = λ₀/n.'),
    },
    {
      scenario: 'eb-dir', p: { E: 'yp', B: 'zm', miss: 'c' },
      name: () => L('E and B', 'E und B'),
      idea: () => L('The fields of the wave are perpendicular to each other and to the direction of travel, and in phase: E = c·B. E, B and c form a right-handed set: the wave travels along E × B.', 'Die Felder der Welle stehen senkrecht aufeinander und auf der Ausbreitungsrichtung, und sie sind in Phase: E = c·B. E, B und c bilden ein Rechtssystem: Die Welle läuft in Richtung E × B.'),
      intro: [
        fr(() => L('The wave in space', 'Die Welle im Raum'), () => p$(L('The electric field (red) oscillates in one plane, the magnetic field (blue) in the plane perpendicular to it; both are perpendicular to the direction of travel: the wave is transverse. Where one is zero, so is the other; where one is largest, so is the other: $E = c\\cdot B$ at every place and moment.', 'Das elektrische Feld (rot) schwingt in einer Ebene, das Magnetfeld (blau) in der Ebene senkrecht dazu; beide stehen senkrecht zur Ausbreitungsrichtung: Die Welle ist transversal. Wo das eine null ist, ist es auch das andere; wo das eine am grössten ist, auch das andere: $E = c\\cdot B$ an jedem Ort und zu jedem Zeitpunkt.')), () => F().wave3d()),
      ],
    },
  ];

  const st = (en, de, types) => ({ name: en ? () => L(en, de) : null, types });
  const TOPICS = [
    { name: () => L('The spectrum', 'Das Spektrum'), example: () => 0, stages: [st(null, null, ['spec-order']), st('λ and f', 'λ und f', ['spec-lf', 'spec-fl'])] },
    { name: () => L('Light in matter', 'Licht in Materie'), example: () => 1, stages: [st(null, null, ['medium']), st('the refractive index', 'die Brechzahl', ['medium-back'])] },
    { name: () => L('E and B', 'E und B'), example: () => 2, stages: [st(null, null, ['eb-dir']), st('E = c·B', 'E = c·B', ['eb-ratio']), st('in phase', 'in Phase', ['eb-phase'])] },
    { name: () => L('Concepts', 'Konzepte'), example: () => 0, stages: [st(null, null, ['concept-spec', 'concept-c', 'concept-eb'])] },
  ];

  root.Lessons = { EXAMPLES, TOPICS };
  if (typeof module !== 'undefined') module.exports = root.Lessons;
})(typeof window !== 'undefined' ? window : globalThis);
