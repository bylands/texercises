// Problems: electromagnetic waves in everyday life and technology, told as stories and solved with
// the ideas of this app: the speed of light measured with chocolate in a microwave oven, the band
// of an FM radio, the field near a mobile phone mast, the Sun's power and the planets, signals to
// Mars, polarizing sunglasses and a phone screen, the antennas of a Wi-Fi router. Each has random
// values from a list and a picture (figures.js):
//   { id, difficulty, title(), make(r), solve(p), fields(p, v), text(p), hints(p), steps(p, v), pic(p), fig(p, v) }
// realOf(i, seed) gives an exercise as the practice ones (generator.js).
(function (root) {
  'use strict';

  const EW = root.EW, { L, C, EPS0, rng, pick, tnum, q, tq, intUnit } = EW;
  const DEG = Math.PI / 180, AU = 1.496e11;
  const res = (x) => `\\htmlClass{result}{${x}}`;
  const step = (rule, html) => `<p class="step-rule">${rule}</p>${html}`;
  const p$ = (s) => `<p>${s}</p>`;
  const num$ = (key, sym, unit, what, sci = false) => ({ key, type: 'num', sym, unit, what, sci });
  const cT = '3.00\\cdot 10^{8}\\,\\mathrm{m/s}', e0T = '8.854\\cdot 10^{-12}\\,\\mathrm{\\tfrac{A\\,s}{V\\,m}}';
  const F = () => root.Figures;
  const ehat = (I) => Math.sqrt((2 * I) / (C * EPS0));

  // ---------------------------------------------------------------- the speed of light with chocolate
  const oven = {
    id: 'oven', difficulty: 3, title: () => L('The speed of light in a microwave oven', 'Die Lichtgeschwindigkeit im Mikrowellenofen'),
    make: (r) => ({ d: pick(r, [5.8, 5.9, 6, 6.1, 6.2, 6.3]) / 100, f: 2.45e9 }),
    solve: (p) => ({ lam: 2 * p.d, c: 2 * p.d * p.f }),
    fields: () => [num$('lam', '\\lambda', 'cm', L('wavelength', 'Wellenlänge')), num$('c', 'c', 'm/s', L('speed of the waves', 'Geschwindigkeit der Wellen'), true)],
    text: (p) => L(`Take the turntable out of a microwave oven, put in a bar of chocolate and switch on for a few seconds. The chocolate melts only in spots, ${q(p.d, 'cm')} apart: the microwaves form a standing wave in the oven, and the spots are its antinodes. The label on the back gives the frequency, ${q(p.f, 'GHz')}. What are the wavelength of the microwaves and their speed?`,
      `Nimm den Drehteller aus einem Mikrowellenofen, leg eine Tafel Schokolade hinein und schalte ihn einige Sekunden ein. Die Schokolade schmilzt nur an einzelnen Stellen, ${q(p.d, 'cm')} voneinander entfernt: Die Mikrowellen bilden im Ofen eine stehende Welle, und die Stellen sind ihre Bäuche. Auf dem Typenschild steht die Frequenz, ${q(p.f, 'GHz')}. Wie gross sind die Wellenlänge der Mikrowellen und ihre Geschwindigkeit?`),
    hints: () => [L('Neighbouring antinodes of a standing wave are half a wavelength apart.', 'Benachbarte Bäuche einer stehenden Welle sind eine halbe Wellenlänge voneinander entfernt.'), L('$c = \\lambda\\cdot f$, the wavelength in metres.', '$c = \\lambda\\cdot f$, die Wellenlänge in Metern.')],
    steps: (p, v) => [
      step(L('The wavelength', 'Die Wellenlänge'), p$(L('The spots are neighbouring antinodes, half a wavelength apart:', 'Die Stellen sind benachbarte Bäuche, eine halbe Wellenlänge voneinander entfernt:')) + `$$\\lambda = 2d = 2\\cdot ${tq(p.d, 'cm')} = ${res(tq(v.lam, 'cm'))}$$`),
      step(L('The speed', 'Die Geschwindigkeit'), `$$c = \\lambda\\cdot f = ${tq(v.lam, 'm')}\\cdot ${tq(p.f, 'Hz')} = ${res(tq(v.c, 'm/s'))}$$` + p$(L('Close to the speed of light, 3.00·10⁸ m/s: microwaves are light of a much longer wavelength. (Measuring the spots to a millimetre gives c to a few percent.)', 'Nahe bei der Lichtgeschwindigkeit, 3.00·10⁸ m/s: Mikrowellen sind Licht mit einer viel grösseren Wellenlänge. (Misst man die Stellen auf einen Millimeter genau, erhält man c auf einige Prozent.)'))),
    ],
    pic: () => F().oven(),
    fig: () => F().standing(3),
  };

  // ---------------------------------------------------------------- the band of an FM radio
  const radio = {
    id: 'radio', difficulty: 3, title: () => L('The FM band', 'Das UKW-Band'),
    make: (r) => ({ L: pick(r, [0.1, 0.12, 0.15, 0.2, 0.25]) * 1e-6 }),
    solve: (p) => ({ Cmin: 1 / ((2 * Math.PI * 108e6) ** 2 * p.L), Cmax: 1 / ((2 * Math.PI * 87.5e6) ** 2 * p.L) }),
    fields: () => [num$('Cmin', 'C_\\mathrm{min}', 'pF', L('smallest capacitance', 'kleinste Kapazität')), num$('Cmax', 'C_\\mathrm{max}', 'pF', L('largest capacitance', 'grösste Kapazität'))],
    text: (p) => L(`The FM band runs from 87.5 MHz to 108 MHz. An FM radio picks a station with an LC circuit of a coil of ${q(p.L, 'μH')} and a variable capacitor. Over what range must the capacitance be variable to cover the band?`,
      `Das UKW-Band reicht von 87.5 MHz bis 108 MHz. Ein UKW-Radio wählt einen Sender mit einem Schwingkreis aus einer Spule von ${q(p.L, 'μH')} und einem Drehkondensator. Über welchen Bereich muss sich die Kapazität verstellen lassen, um das ganze Band abzudecken?`),
    hints: () => [L('The circuit oscillates at $f = 1/(2\\pi\\sqrt{L\\,C})$; solved for $C$: $C = 1/(4\\pi^2 f^2 L)$.', 'Der Schwingkreis schwingt mit $f = 1/(2\\pi\\sqrt{L\\,C})$; nach $C$ aufgelöst: $C = 1/(4\\pi^2 f^2 L)$.'), L('A higher frequency needs a smaller capacitance.', 'Eine höhere Frequenz braucht eine kleinere Kapazität.')],
    steps: (p, v) => [
      step(L('The top of the band', 'Das obere Ende des Bands'), p$(L('A high frequency needs a small capacitance:', 'Eine hohe Frequenz braucht eine kleine Kapazität:')) + `$$C_\\mathrm{min} = \\frac{1}{4\\pi^2 f^2 L} = \\frac{1}{4\\pi^2\\cdot (1.08\\cdot 10^{8}\\,\\mathrm{Hz})^2\\cdot ${tq(p.L, 'H')}} = ${res(tq(v.Cmin, 'pF'))}$$`),
      step(L('The bottom of the band', 'Das untere Ende des Bands'), `$$C_\\mathrm{max} = \\frac{1}{4\\pi^2\\cdot (8.75\\cdot 10^{7}\\,\\mathrm{Hz})^2\\cdot ${tq(p.L, 'H')}} = ${res(tq(v.Cmax, 'pF'))}$$` +
        p$(L(`The frequencies differ by a factor of 108/87.5 = 1.23; the capacitances by its square, ${tnum((108 / 87.5) ** 2)}.`, `Die Frequenzen unterscheiden sich um den Faktor 108/87.5 = 1.23; die Kapazitäten um sein Quadrat, ${tnum((108 / 87.5) ** 2)}.`))),
    ],
    pic: () => F().radio(),
    fig: () => F().lc(0, { caption: false }),
  };

  // ---------------------------------------------------------------- near a mobile phone mast
  const mast = {
    id: 'mast', difficulty: 3, title: () => L('A mobile phone mast', 'Eine Mobilfunkantenne'),
    make: (r) => ({ P: pick(r, [500, 1000, 1500, 2000]), r: pick(r, [50, 80, 100, 150, 200, 300]) }),
    solve: (p) => { const I = p.P / (4 * Math.PI * p.r * p.r), E = ehat(I); return { I, E, ok: E <= 5 ? 'yes' : 'no' }; },
    fields: (p, v) => [num$('I', 'I', intUnit(v.I), L('intensity', 'Intensität')), num$('E', '\\hat E', 'V/m', L('amplitude of the electric field', 'Amplitude des elektrischen Felds')),
      { key: 'ok', type: 'choice', what: L('Within the limit of 5 V/m?', 'Innerhalb des Grenzwerts von 5 V/m?'), options: [['yes', L('yes', 'ja'), L('Compare the field you found with 5 V/m.', 'Vergleiche das gefundene Feld mit 5 V/m.')], ['no', L('no', 'nein'), L('Compare the field you found with 5 V/m.', 'Vergleiche das gefundene Feld mit 5 V/m.')]] }],
    text: (p) => L(`A mobile phone mast beams its signal towards a house ${q(p.r, 'm')} away. In that direction it radiates as strongly as a source spreading ${q(p.P, 'W')} evenly in all directions (its equivalent radiated power). What are the intensity and the amplitude of the electric field at the house? In Switzerland, the field of a mast at places where people stay for long must not exceed about 5 V/m (the installation limit; for simplicity compared here with the amplitude). Is it within this limit?`,
      `Eine Mobilfunkantenne richtet ihr Signal auf ein Haus in ${q(p.r, 'm')} Entfernung. In diese Richtung strahlt sie so stark wie eine Quelle, die ${q(p.P, 'W')} gleichmässig in alle Richtungen abgibt (ihre äquivalente Strahlungsleistung). Wie gross sind die Intensität und die Amplitude des elektrischen Felds beim Haus? In der Schweiz darf das Feld einer Antenne an Orten, wo sich Menschen länger aufhalten, etwa 5 V/m nicht überschreiten (der Anlagegrenzwert; hier vereinfacht mit der Amplitude verglichen). Wird er eingehalten?`),
    hints: () => [L('Spread over a sphere: $I = P/(4\\pi r^2)$.', 'Auf eine Kugel verteilt: $I = P/(4\\pi r^2)$.'), L('$I = \\tfrac12\\,c\\,\\varepsilon_0\\,\\hat E^2$.', '$I = \\tfrac12\\,c\\,\\varepsilon_0\\,\\hat E^2$.')],
    steps: (p, v) => [
      step(L('The intensity', 'Die Intensität'), `$$I = \\frac{P}{4\\pi r^2} = \\frac{${tq(p.P, 'W')}}{4\\pi\\cdot (${tq(p.r, 'm')})^2} = ${res(tq(v.I, intUnit(v.I)))}$$`),
      step(L('The field', 'Das Feld'), `$$\\hat E = \\sqrt{\\frac{2I}{c\\,\\varepsilon_0}} = \\sqrt{\\frac{2\\cdot ${tq(v.I, 'W/m²')}}{${cT}\\cdot ${e0T}}} = ${res(tq(v.E, 'V/m'))}$$` +
        p$(v.ok === 'yes' ? L('<span class="result">Within the limit.</span> At twice the distance, the field would be half as strong.', '<span class="result">Der Grenzwert wird eingehalten.</span> Im doppelten Abstand wäre das Feld halb so stark.') : L('<span class="result">Above the limit:</span> the operator would have to lower the power or turn the antenna away. At twice the distance, the field would be half as strong.', '<span class="result">Über dem Grenzwert:</span> Die Betreiberin müsste die Leistung senken oder die Antenne wegdrehen. Im doppelten Abstand wäre das Feld halb so stark.'))),
    ],
    pic: () => F().mast(),
    fig: () => F().sphere({ two: false }),
  };

  // ---------------------------------------------------------------- the Sun and the planets
  const PLANETS = [['Venus', 'Venus', 0.723], ['Mars', 'Mars', 1.524], ['Jupiter', 'Jupiter', 5.2], ['Saturn', 'Saturn', 9.54], ['Mercury', 'Merkur', 0.387]];
  const sun = {
    id: 'sun', difficulty: 3, title: () => L('The power of the Sun', 'Die Leistung der Sonne'),
    make: (r) => ({ k: Math.floor(r() * PLANETS.length) }),
    solve: (p) => { const P = 1361 * 4 * Math.PI * AU * AU, a = PLANETS[p.k][2]; return { P, I: 1361 / (a * a) }; },
    fields: () => [num$('P', 'P', 'W', L('power of the Sun', 'Leistung der Sonne'), true), num$('I', 'I', 'W/m²', L('intensity at the planet', 'Intensität beim Planeten'))],
    text: (p) => { const pl = PLANETS[p.k]; return L(`Above the atmosphere, sunlight falling straight on one square metre brings 1361 W (the solar constant). The Earth is ${q(AU, 'm', 4)} from the Sun. What is the total power the Sun radiates? What is the intensity of sunlight at ${pl[0]}, ${pl[2]} times as far from the Sun as the Earth?`,
      `Über der Atmosphäre bringt Sonnenlicht, das senkrecht auf einen Quadratmeter fällt, 1361 W (die Solarkonstante). Die Erde ist ${q(AU, 'm', 4)} von der Sonne entfernt. Welche Leistung strahlt die Sonne insgesamt ab? Wie gross ist die Intensität des Sonnenlichts beim ${pl[1]}, der ${pl[2]}-mal so weit von der Sonne entfernt ist wie die Erde?`).replace('beim Venus, der', 'bei der Venus, die').replace('beim Merkur', 'beim Merkur'); },
    hints: () => [L('The Sun radiates evenly in all directions: at the Earth, its power is spread over a sphere with radius 1.496·10¹¹ m.', 'Die Sonne strahlt gleichmässig in alle Richtungen: Bei der Erde ist ihre Leistung auf eine Kugel mit dem Radius 1.496·10¹¹ m verteilt.'), L('The intensity falls with $1/r^2$.', 'Die Intensität fällt mit $1/r^2$.')],
    steps: (p, v) => { const a = PLANETS[p.k][2]; return [
      step(L('The power of the Sun', 'Die Leistung der Sonne'), `$$P = I_\\mathrm{E}\\cdot 4\\pi r_\\mathrm{E}^2 = 1361\\,\\mathrm{W/m^2}\\cdot 4\\pi\\cdot (${tq(AU, 'm')})^2 = ${res(tq(v.P, 'W'))}$$`),
      step(L('At the planet', 'Beim Planeten'), `$$I = \\frac{I_\\mathrm{E}}{(r/r_\\mathrm{E})^2} = \\frac{1361\\,\\mathrm{W/m^2}}{${a}^2} = ${res(tq(v.I, 'W/m²'))}$$` +
        p$(a > 1 ? L('Solar panels on a space probe there must be that much larger than near the Earth.', 'Solarzellen einer Raumsonde dort müssen entsprechend grösser sein als in Erdnähe.') : L('Much more than at the Earth: a probe there must be shielded from the heat.', 'Viel mehr als bei der Erde: Eine Sonde dort muss vor der Hitze geschützt werden.'))),
    ]; },
    pic: () => F().sun(),
    fig: () => F().sphere({ r1: 'r', r2: '2r' }),
  };

  // ---------------------------------------------------------------- signals to Mars
  const mars = {
    id: 'mars', difficulty: 2, title: () => L('Driving a rover on Mars', 'Einen Rover auf dem Mars steuern'),
    make: (r) => ({ d: pick(r, [56, 78, 100, 150, 200, 250, 300, 378]) * 1e9 }),
    solve: (p) => ({ t: p.d / C, t2: (2 * p.d) / C }),
    fields: () => [num$('t', 't', 'min', L('time of a signal to Mars', 'Laufzeit eines Signals zum Mars')), num$('t2', 't_2', 'min', L('from the picture to the stop', 'vom Bild bis zum Halt'))],
    text: (p) => L(`Mars is at present ${q(p.d / 1e3, '')} km from the Earth (between about 56 and 400 million km). How long does a radio signal take from the Earth to Mars? A rover on Mars sends a picture showing a rock ahead; the moment it arrives, the team sends the command to stop. How long after taking the picture does the rover get it?`,
      `Der Mars ist gerade ${q(p.d / 1e3, '')} km von der Erde entfernt (zwischen etwa 56 und 400 Millionen km). Wie lange braucht ein Funksignal von der Erde zum Mars? Ein Rover auf dem Mars sendet ein Bild, das einen Felsen vor ihm zeigt; sobald es ankommt, sendet das Team den Befehl anzuhalten. Wie lange nach der Aufnahme des Bildes erhält der Rover ihn?`),
    hints: () => [L('Radio waves travel at the speed of light: $t = d/c$.', 'Funkwellen laufen mit Lichtgeschwindigkeit: $t = d/c$.'), L('The picture goes to the Earth, the command back to Mars.', 'Das Bild geht zur Erde, der Befehl zurück zum Mars.')],
    steps: (p, v) => [
      step(L('One way', 'Ein Weg'), `$$t = \\frac{d}{c} = \\frac{${tq(p.d, 'm')}}{${cT}} = ${tnum(v.t)}\\,\\mathrm{s} = ${res(tq(v.t, 'min'))}$$`),
      step(L('There and back', 'Hin und zurück'), `$$t_2 = 2t = ${res(tq(v.t2, 'min'))}$$` + p$(L('Far too long to steer by sight: Mars rovers drive on their own, avoiding rocks themselves, and the team plans their routes a day ahead.', 'Viel zu lange, um nach Sicht zu steuern: Marsrover fahren selbständig und weichen Felsen selbst aus, und das Team plant ihre Routen einen Tag im Voraus.'))),
    ],
    pic: () => F().echo({ target: 'mars' }),
    fig: () => F().echo({ target: 'mars' }),
  };

  // ---------------------------------------------------------------- sunglasses and a phone screen
  const glasses = {
    id: 'glasses', difficulty: 3, title: () => L('Polarizing sunglasses', 'Polarisierende Sonnenbrillen'),
    make: (r) => ({ a: pick(r, [20, 30, 40, 50, 60, 70]), s: pick(r, [0.1, 0.25, 0.5, 0.75]) }),
    solve: (p) => ({ share: Math.cos(p.a * DEG) ** 2, b: Math.acos(Math.sqrt(p.s)) / DEG }),
    fields: () => [num$('share', 'I/I_0', '', L('share of the brightness', 'Anteil der Helligkeit')), num$('b', '\\theta', '°', L('angle', 'Winkel'))],
    text: (p) => L(`The light of a phone screen (an LCD) is polarized, here vertically. Polarizing sunglasses also have vertical axes: they block the glare from water and roads, which is mostly polarized horizontally. Through the glasses, the screen looks as bright as without them (apart from the tint). What share of its brightness is left when you tilt your head by ${p.a}°? By what angle must you tilt it for the screen to look only ${Math.round(p.s * 100)} % as bright?`,
      `Das Licht eines Handybildschirms (eines LCD) ist polarisiert, hier senkrecht. Polarisierende Sonnenbrillen haben ebenfalls senkrechte Achsen: Sie sperren die Blendung von Wasser und Strassen, die vorwiegend waagrecht polarisiert ist. Durch die Brille sieht der Bildschirm gleich hell aus wie ohne (abgesehen von der Tönung). Welcher Anteil seiner Helligkeit bleibt, wenn du den Kopf um ${p.a}° neigst? Um welchen Winkel musst du ihn neigen, damit der Bildschirm nur noch ${Math.round(p.s * 100)} % so hell aussieht?`),
    hints: () => [L('Malus’s law: $I = I_0\\cos^2\\theta$, θ the angle between the polarization and the axis of the glasses.', 'Gesetz von Malus: $I = I_0\\cos^2\\theta$, θ der Winkel zwischen der Polarisation und der Achse der Brille.'), L('For the angle: $\\cos\\theta = \\sqrt{I/I_0}$.', 'Für den Winkel: $\\cos\\theta = \\sqrt{I/I_0}$.')],
    steps: (p, v) => [
      step(L('Tilted', 'Geneigt'), p$(L('Tilting the head turns the axes of the glasses against the polarization of the screen:', 'Den Kopf zu neigen dreht die Achsen der Brille gegen die Polarisation des Bildschirms:')) + `$$\\frac{I}{I_0} = \\cos^2(${p.a}^\\circ) = ${res(tnum(v.share))}$$`),
      step(L('The angle', 'Der Winkel'), `$$\\cos^2\\theta = ${p.s} \\quad\\Rightarrow\\quad \\theta = \\arccos\\sqrt{${p.s}} = ${res(`${tnum(v.b)}^\\circ`)}$$` + p$(L('At 90° the screen looks black.', 'Bei 90° sieht der Bildschirm schwarz aus.'))),
    ],
    pic: (p) => F().glasses({ angle: p.a }),
    fig: (p, v) => F().polarizers({ angles: [p.a], unpol: false, names: ['I₀', 'I'], labels: [`${p.a}°`] }),
  };

  // ---------------------------------------------------------------- the antennas of a Wi-Fi router
  const router = {
    id: 'router', difficulty: 2, title: () => L('The antennas of a Wi-Fi router', 'Die Antennen eines WLAN-Routers'),
    make: (r) => ({ f1: pick(r, [2.412e9, 2.437e9, 2.462e9]), f2: pick(r, [5.18e9, 5.5e9, 5.8e9]) }),
    solve: (p) => ({ l1: C / p.f1 / 4, l2: C / p.f2 / 4 }),
    fields: () => [num$('l1', '\\ell_{2.4}', 'cm', L('for the 2.4 GHz band', 'für das 2.4-GHz-Band')), num$('l2', '\\ell_{5}', 'cm', L('for the 5 GHz band', 'für das 5-GHz-Band'))],
    text: (p) => L(`A Wi-Fi router sends on ${q(p.f1, 'GHz')} (2.4 GHz band) and on ${q(p.f2, 'GHz')} (5 GHz band). Inside its rod antennas are quarter-wave antennas: rods a quarter of a wavelength long, over the ground plane of the circuit. How long must the rod be for each band?`,
      `Ein WLAN-Router sendet auf ${q(p.f1, 'GHz')} (2.4-GHz-Band) und auf ${q(p.f2, 'GHz')} (5-GHz-Band). In seinen Stabantennen stecken Viertelwellenantennen: Stäbe, eine Viertelwellenlänge lang, über der Massefläche der Schaltung. Wie lang muss der Stab für jedes Band sein?`),
    hints: () => [L('$\\lambda = c/f$.', '$\\lambda = c/f$.'), L('$\\ell = \\lambda/4$.', '$\\ell = \\lambda/4$.')],
    steps: (p, v) => [
      step(L('2.4 GHz', '2.4 GHz'), `$$\\ell = \\frac{\\lambda}{4} = \\frac{c}{4f} = \\frac{${cT}}{4\\cdot ${tq(p.f1, 'Hz')}} = ${res(tq(v.l1, 'cm'))}$$`),
      step(L('5 GHz', '5 GHz'), `$$\\ell = \\frac{c}{4f} = \\frac{${cT}}{4\\cdot ${tq(p.f2, 'Hz')}} = ${res(tq(v.l2, 'cm'))}$$` + p$(L('The antennas of a router hold both: the housing is longer than either rod.', 'Die Antennen eines Routers enthalten beide: Das Gehäuse ist länger als jeder der Stäbe.'))),
    ],
    pic: () => F().router(),
    fig: () => F().dipole(),
  };

  const PROBLEMS = [oven, radio, mast, sun, mars, glasses, router];

  // ---------------------------------------------------------------- exercises
  function realOf(i, seed) {
    const pb = PROBLEMS[i], r = rng(seed);
    let p = null;
    for (let k = 0; k < 1000 && !p; k++) p = pb.make(r);
    const v = pb.solve(p);
    const fields = pb.fields(p, v).map((f) => (f.type === 'choice' ? { ...f, value: v[f.key] } : { ...f, value: EW.inUnit(v[f.key], f.unit), traps: [] }));
    return {
      scenario: 'real', difficulty: pb.difficulty, title: pb.title(), text: `<p>${pb.text(p)}</p>`,
      fields,
      figure: () => (root.Figures ? pb.pic(p) : ''),
      solutionFigure: () => (root.Figures ? pb.fig(p, v) : ''),
      hints: pb.hints(p), solution: pb.steps(p, v),
      results: fields.map((f) => (f.type === 'choice' ? f.options.find((o) => o[0] === f.value)[1] : `$${f.sym} = ${tq(v[f.key], f.unit)}$`)).join(', '),
      p, v,
    };
  }

  root.EWProblems = { PROBLEMS, realOf };
  if (typeof module !== 'undefined') module.exports = root.EWProblems;
})(typeof window !== 'undefined' ? window : globalThis);
