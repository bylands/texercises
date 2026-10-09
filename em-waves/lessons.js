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
      scenario: 'spec-lf', p: { s: 8, x: 532e-9, off: 1 },
      name: () => L('The spectrum', 'Das Spektrum'),
      idea: () => L('Radio waves, light and X-rays are all electromagnetic waves: in vacuum they travel at c = 3.00·10⁸ m/s, and c = λ·f. They differ only in their wavelength.', 'Radiowellen, Licht und Röntgenstrahlung sind alles elektromagnetische Wellen: Im Vakuum laufen sie mit c = 3.00·10⁸ m/s, und c = λ·f. Sie unterscheiden sich nur in ihrer Wellenlänge.'),
      intro: [
        fr(() => L('One kind of wave', 'Eine Art von Welle'), () => p$(L('An electromagnetic wave is an electric and a magnetic field oscillating together, travelling through space; it needs no medium. Its wavelength can be anything: kilometres for long-wave radio, less than an atom for γ rays. We give the regions names, but there are no sharp borders between them.', 'Eine elektromagnetische Welle ist ein elektrisches und ein magnetisches Feld, die gemeinsam schwingen und sich durch den Raum ausbreiten; sie braucht kein Medium. Ihre Wellenlänge kann alles sein: Kilometer bei Langwellen, weniger als ein Atom bei Gammastrahlung. Wir geben den Bereichen Namen, aber es gibt keine scharfen Grenzen zwischen ihnen.')) +
          p$(L('In vacuum, all travel at the same speed, $c = 3.00\\cdot 10^8\\,\\mathrm{m/s}$; as for every wave, $c = \\lambda\\cdot f$. A short wavelength means a high frequency.', 'Im Vakuum laufen alle gleich schnell, $c = 3.00\\cdot 10^8\\,\\mathrm{m/s}$; wie bei jeder Welle ist $c = \\lambda\\cdot f$. Eine kurze Wellenlänge bedeutet eine hohe Frequenz.')), () => F().spectrum(null)),
      ],
    },
    {
      scenario: 'medium', p: { m: 2, lam0: 600e-9 },
      name: () => L('Light in matter', 'Licht in Materie'),
      idea: () => L('In a medium, light is slower: v = c/n. The frequency stays the same at the border, so the wavelength shrinks: λ = λ₀/n.', 'In einem Medium ist Licht langsamer: v = c/n. Die Frequenz bleibt an der Grenze gleich, also schrumpft die Wellenlänge: λ = λ₀/n.'),
    },
    {
      scenario: 'lc-f', p: { L: 10e-3, C: 100e-9 },
      name: () => L('The LC circuit', 'Der Schwingkreis'),
      idea: () => L('A capacitor and a coil: the energy swings between the electric field of the capacitor and the magnetic field of the coil, at f = 1/(2π√(LC)).', 'Ein Kondensator und eine Spule: Die Energie pendelt zwischen dem elektrischen Feld des Kondensators und dem Magnetfeld der Spule, mit f = 1/(2π√(LC)).'),
      intro: [
        fr(() => L('Charged', 'Geladen'), () => p$(L('A charged capacitor is connected to a coil. At first, no current flows yet: all the energy is in the electric field between the plates.', 'Ein geladener Kondensator wird an eine Spule angeschlossen. Zuerst fliesst noch kein Strom: Alle Energie steckt im elektrischen Feld zwischen den Platten.')), () => F().lc(0)),
        fr(() => L('A quarter of a period later', 'Eine Viertelperiode später'), () => p$(L('The capacitor discharges through the coil. The coil opposes the change of current (induction): the current grows slowly, and is largest when the capacitor is empty. Now the energy is in the magnetic field of the coil.', 'Der Kondensator entlädt sich über die Spule. Die Spule wirkt der Änderung des Stroms entgegen (Induktion): Der Strom wächst langsam und ist am grössten, wenn der Kondensator leer ist. Jetzt steckt die Energie im Magnetfeld der Spule.')), () => F().lc(1)),
        fr(() => L('Half a period', 'Eine halbe Periode'), () => p$(L('The coil keeps the current going, and charges the capacitor the other way round. Then all starts again in the opposite direction: an electric oscillation, like a mass on a spring.', 'Die Spule hält den Strom aufrecht und lädt den Kondensator umgekehrt auf. Dann beginnt alles in der Gegenrichtung von vorn: eine elektrische Schwingung, wie eine Masse an einer Feder.')), () => F().lc(2)),
      ],
    },
    {
      scenario: 'eb-dir', p: { E: 'yp', B: 'zp', miss: 'B' },
      name: () => L('E and B', 'E und B'),
      idea: () => L('The fields of the wave are perpendicular to each other and to the direction of travel, and in phase: E = c·B. The wave travels along E × B.', 'Die Felder der Welle stehen senkrecht aufeinander und auf der Ausbreitungsrichtung, und sie sind in Phase: E = c·B. Die Welle läuft in Richtung E × B.'),
      intro: [
        fr(() => L('The wave in space', 'Die Welle im Raum'), () => p$(L('The electric field (red) oscillates in one plane, the magnetic field (blue) in the plane perpendicular to it; both are perpendicular to the direction of travel: the wave is transverse. Where one is zero, so is the other; where one is largest, so is the other.', 'Das elektrische Feld (rot) schwingt in einer Ebene, das Magnetfeld (blau) in der Ebene senkrecht dazu; beide stehen senkrecht zur Ausbreitungsrichtung: Die Welle ist transversal. Wo das eine null ist, ist es auch das andere; wo das eine am grössten ist, auch das andere.')) +
          p$(L('Their sizes are linked: $E = c\\cdot B$ at every place and moment. A changing magnetic field makes an electric field (induction), and a changing electric field a magnetic one: so the wave carries itself on.', 'Ihre Grössen hängen zusammen: $E = c\\cdot B$ an jedem Ort und zu jedem Zeitpunkt. Ein sich änderndes Magnetfeld erzeugt ein elektrisches Feld (Induktion), und ein sich änderndes elektrisches Feld ein magnetisches: So trägt sich die Welle selbst weiter.')), () => F().wave3d()),
      ],
    },
    {
      scenario: 'point', p: { P: 100, r: 2 },
      name: () => L('Intensity', 'Intensität'),
      idea: () => L('The intensity is power per area. From a point source it falls with 1/r²; it grows with the square of the field: I = ½·c·ε₀·Ê².', 'Die Intensität ist Leistung pro Fläche. Von einer punktförmigen Quelle aus fällt sie mit 1/r²; sie wächst mit dem Quadrat des Felds: I = ½·c·ε₀·Ê².'),
      intro: [
        fr(() => L('Power spreads out', 'Die Leistung verteilt sich'), () => p$(L('A wave carries energy. Its intensity $I$ is the power that falls on one square metre across the beam, in W/m². A source radiating evenly in all directions spreads its power over spheres: at twice the distance, over four times the area.', 'Eine Welle trägt Energie. Ihre Intensität $I$ ist die Leistung, die auf einen Quadratmeter quer zum Strahl fällt, in W/m². Eine Quelle, die gleichmässig in alle Richtungen strahlt, verteilt ihre Leistung auf Kugelflächen: im doppelten Abstand auf die vierfache Fläche.')), () => F().sphere()),
      ],
    },
    {
      scenario: 'malus', p: { I0: 400, a: 60 },
      name: () => L('Polarization', 'Polarisation'),
      idea: () => L('A polarizer lets through the part of the field along its axis: half the intensity of unpolarized light, and I₀·cos²θ of polarized light (Malus’s law).', 'Ein Polarisator lässt den Teil des Felds längs seiner Achse durch: die Hälfte der Intensität von unpolarisiertem Licht, und I₀·cos²θ von polarisiertem Licht (Gesetz von Malus).'),
      intro: [
        fr(() => L('Polarized light', 'Polarisiertes Licht'), () => p$(L('The electric field of a wave oscillates in one direction across the beam: its direction of polarization. The light of a lamp or of the Sun is a mix of all directions: it is unpolarized. A polarizing filter lets through only the part of the field along its axis; behind it, the light is polarized along that axis.', 'Das elektrische Feld einer Welle schwingt in einer Richtung quer zum Strahl: ihrer Polarisationsrichtung. Das Licht einer Lampe oder der Sonne ist eine Mischung aller Richtungen: Es ist unpolarisiert. Ein Polarisationsfilter lässt nur den Teil des Felds längs seiner Achse durch; dahinter ist das Licht längs dieser Achse polarisiert.')) +
          p$(L('Only transverse waves can be polarized; sound in air cannot.', 'Nur Transversalwellen lassen sich polarisieren; Schall in Luft nicht.')), () => F().polarizers({ angles: [0], unpol: true, names: ['I₀', 'I₀/2'], labels: ['0°'] })),
      ],
    },
    {
      scenario: 'dipole', p: { s: 0, f: 99.5e6, kind: 'half' },
      name: () => L('Antennas', 'Antennen'),
      idea: () => L('In an antenna, charges oscillate; accelerated charges radiate. A dipole is best half a wavelength long; it radiates most across the rod, and its wave is polarized along it.', 'In einer Antenne schwingen Ladungen; beschleunigte Ladungen strahlen. Ein Dipol ist am besten eine halbe Wellenlänge lang; er strahlt am meisten quer zum Stab, und seine Welle ist längs des Stabs polarisiert.'),
      intro: [
        fr(() => L('The Hertzian dipole', 'Der Hertzsche Dipol'), () => p$(L('Open up an LC circuit until only a straight rod is left: its charges still oscillate, from one end to the other, and the fields now reach far out into space. Accelerated charges radiate: the rod sends out an electromagnetic wave (Heinrich Hertz, 1886).', 'Öffne einen Schwingkreis, bis nur ein gerader Stab übrig ist: Seine Ladungen schwingen immer noch, von einem Ende zum andern, und die Felder reichen jetzt weit in den Raum hinaus. Beschleunigte Ladungen strahlen: Der Stab sendet eine elektromagnetische Welle aus (Heinrich Hertz, 1886).')) +
          p$(L('It radiates most across the rod and nothing along it. The electric field of its wave oscillates parallel to the rod: a receiving rod must be parallel to it too.', 'Er strahlt am meisten quer zum Stab und nichts längs davon. Das elektrische Feld seiner Welle schwingt parallel zum Stab: Ein Empfangsstab muss ebenfalls parallel dazu stehen.')), () => F().dipole({ rx: 'v' })),
      ],
    },
    {
      scenario: 'standing', p: { m: 4, d: 0.045 },
      name: () => L('Standing waves', 'Stehende Wellen'),
      idea: () => L('A wave and its reflection make a standing wave; neighbouring minima (and maxima) are half a wavelength apart. Measuring them gives the wavelength.', 'Eine Welle und ihre Reflexion bilden eine stehende Welle; benachbarte Minima (und Maxima) sind eine halbe Wellenlänge voneinander entfernt. Misst man sie, kennt man die Wellenlänge.'),
    },
  ];

  const st = (en, de, types) => ({ name: en ? () => L(en, de) : null, types });
  const TOPICS = [
    { name: () => L('The spectrum', 'Das Spektrum'), example: () => 0, stages: [st(null, null, ['spec-lf']), st('from f to λ', 'von f zu λ', ['spec-fl']), st('echoes', 'Echos', ['spec-echo'])] },
    { name: () => L('Light in matter', 'Licht in Materie'), example: () => 1, stages: [st(null, null, ['medium']), st('the refractive index', 'die Brechzahl', ['medium-back'])] },
    { name: () => L('The LC circuit', 'Der Schwingkreis'), example: () => 2, stages: [st(null, null, ['lc-f']), st('changing L and C', 'L und C ändern', ['lc-scale']), st('tuning a radio', 'ein Radio abstimmen', ['lc-c']), st('energy', 'Energie', ['lc-energy'])] },
    { name: () => L('E and B', 'E und B'), example: () => 3, stages: [st(null, null, ['eb-dir']), st('E = c·B', 'E = c·B', ['eb-ratio']), st('in phase', 'in Phase', ['eb-phase'])] },
    { name: () => L('Intensity', 'Intensität'), example: () => 4, stages: [st(null, null, ['point']), st('1/r²', '1/r²', ['inv-sq']), st('laser beams', 'Laserstrahlen', ['beam']), st('the fields', 'die Felder', ['eb-int'])] },
    { name: () => L('Polarization', 'Polarisation'), example: () => 5, stages: [st(null, null, ['malus']), st('the angle', 'der Winkel', ['malus-angle']), st('three filters', 'drei Filter', ['malus-three'])] },
    { name: () => L('Antennas and standing waves', 'Antennen und stehende Wellen'), example: (s) => (s === 0 ? 6 : 7), stages: [st(null, null, ['dipole']), st('standing waves', 'stehende Wellen', ['standing'])] },
    { name: () => L('Concepts', 'Konzepte'), example: () => 3, stages: [st(null, null, ['concept'])] },
  ];

  root.Lessons = { EXAMPLES, TOPICS };
  if (typeof module !== 'undefined') module.exports = root.Lessons;
})(typeof window !== 'undefined' ? window : globalThis);
