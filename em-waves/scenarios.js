// The exercise types of the app. Each:
//   { id, difficulty, title(p), make(r) → parameters p (or null: draw again), solve(p, o) → values v
//     (SI; with a flag of traps set in o: the result of that wrong idea), traps: [flag],
//     why: { flag: () => text }, fields(p, v) → [field], text(p), hints(p, v), steps(p, v) → [{ text,
//     show: [keys] }], figure(p, v, view) }
// A field is a number { key, type: 'num', sym, unit, what, sci } (its value in the unit), or a
// choice { key, type: 'choice', what, ask (for the arcade), options: [[value, html, why, flag]],
// stack (one option below the other) }; the value of a choice comes from v[key].
// view: { task: true } the task; { show: Set } the solution (or a step of it).
//
//   spectrum         spec-lf, spec-fl (c = λ·f and the region), spec-echo (a signal there and back)
//   light in matter  medium (v, f and λ in a medium), medium-back (n from the wavelengths)
//   LC circuit       lc-f (Thomson's formula), lc-scale (f when L or C change), lc-c (tuning a
//                    radio), lc-energy (energy and largest current)
//   E and B          eb-dir (c along E × B), eb-ratio (E = c·B), eb-phase (E and B in phase)
//   intensity        point (a point source), inv-sq (1/r²), beam (a laser), eb-int (E₀ and B₀ from I)
//   polarization     malus (two filters), malus-angle (the angle for a share), malus-three (three
//                    filters, the middle one turned)
//   antennas         dipole (λ/2 and λ/4), standing (a standing wave in front of a metal plate)
//   concepts         concept (which statement is right)
(function (root) {
  'use strict';

  const EW = root.EW || require('./core.js');
  const Plot = root.Plot || require('./plot.js');
  const { L, C, EPS0, pick, shuffle, num, tnum, q, tq, sig, lengthUnit, freqUnit, timeUnit, capUnit, intUnit, fieldUnit, bUnit, energyUnit, currentUnit } = EW;
  const Fg = () => root.Figures;

  // ---------------------------------------------------------------- helpers
  const step = (rule, html, show = []) => ({ text: `<p class="step-rule">${rule}</p>${html}`, show });
  const p$ = (s) => `<p>${s}</p>`;
  const res = (x) => `\\htmlClass{result}{${x}}`;
  const num$ = (key, sym, unit, what, o = {}) => ({ key, type: 'num', sym, unit, what, ...o });
  const choice = (key, what, options, o = {}) => ({ key, type: 'choice', what, options, ...o });
  const PI2 = 2 * Math.PI, DEG = Math.PI / 180;
  const cT = '3.00\\cdot 10^{8}\\,\\mathrm{m/s}', e0T = '8.854\\cdot 10^{-12}\\,\\mathrm{\\tfrac{A\\,s}{V\\,m}}';
  // a given value as shown (three digits) and as used in the solution
  const g3 = (x) => sig(x, 3);
  // the frequency's unit; above 10¹⁵ Hz in Hz with a power of ten
  const fUnit = (f) => (f >= 1e15 ? 'Hz' : freqUnit(f));

  // ================================================================ 1 the spectrum
  // the regions (as in figures.js) and the sources of the exercises, with their wavelength or
  // frequency (far from the borders of their region)
  const REG = {
    gamma: { en: 'γ rays', de: 'Gammastrahlung', range: () => L('γ rays: below about 10 pm (from atomic nuclei).', 'Gammastrahlung: unter etwa 10 pm (aus Atomkernen).') },
    xray: { en: 'X-rays', de: 'Röntgenstrahlung', range: () => L('X-rays: from about 10 pm to 10 nm.', 'Röntgenstrahlung: etwa 10 pm bis 10 nm.') },
    uv: { en: 'ultraviolet', de: 'Ultraviolett', range: () => L('Ultraviolet: from about 10 nm to 380 nm.', 'Ultraviolett: etwa 10 nm bis 380 nm.') },
    vis: { en: 'visible light', de: 'sichtbares Licht', range: () => L('Visible light: from about 380 nm (violet) to 780 nm (red).', 'Sichtbares Licht: etwa 380 nm (violett) bis 780 nm (rot).') },
    ir: { en: 'infrared', de: 'Infrarot', range: () => L('Infrared: from about 780 nm to 1 mm.', 'Infrarot: etwa 780 nm bis 1 mm.') },
    micro: { en: 'microwaves', de: 'Mikrowellen', range: () => L('Microwaves: from about 1 mm to 1 m.', 'Mikrowellen: etwa 1 mm bis 1 m.') },
    radio: { en: 'radio waves', de: 'Radiowellen', range: () => L('Radio waves: longer than about 1 m.', 'Radiowellen: länger als etwa 1 m.') },
  };
  const ORDER = ['gamma', 'xray', 'uv', 'vis', 'ir', 'micro', 'radio'];
  // each source's radiation, as the subject of a sentence (in German feminine: "sie")
  const SOURCES = [
    { reg: 'radio', en: 'the radiation of a long-wave radio transmitter', de: 'die Strahlung eines Langwellensenders', f: [153e3, 162e3, 183e3, 198e3, 225e3] },
    { reg: 'radio', en: 'the radiation of a medium-wave (AM) radio station', de: 'die Strahlung eines Mittelwellensenders (AM)', f: [531e3, 603e3, 774e3, 999e3, 1206e3, 1422e3] },
    { reg: 'radio', en: 'the radiation of an FM radio station', de: 'die Strahlung eines UKW-Radiosenders', f: [88.4e6, 91.7e6, 94.6e6, 99.5e6, 102.8e6, 106.3e6] },
    { reg: 'micro', en: 'the radiation of a Wi-Fi router', de: 'die Strahlung eines WLAN-Routers', f: [2.41e9, 2.44e9, 5.2e9, 5.6e9] },
    { reg: 'micro', en: 'the radiation in a microwave oven', de: 'die Strahlung in einem Mikrowellenofen', f: [2.45e9] },
    { reg: 'micro', en: 'the radiation of the radar of a car', de: 'die Strahlung des Radars eines Autos', f: [24e9, 77e9] },
    { reg: 'ir', en: 'the radiation of a TV remote control', de: 'die Strahlung einer TV-Fernbedienung', lam: [850e-9, 940e-9, 950e-9] },
    { reg: 'ir', en: 'the heat radiation of human skin', de: 'die Wärmestrahlung der menschlichen Haut', lam: [9e-6, 9.5e-6, 10e-6] },
    { reg: 'vis', en: 'the light of a green laser pointer', de: 'die Strahlung eines grünen Laserpointers', lam: [520e-9, 532e-9] },
    { reg: 'vis', en: 'the light of a red laser pointer', de: 'die Strahlung eines roten Laserpointers', lam: [635e-9, 650e-9, 670e-9] },
    { reg: 'vis', en: 'the light of a sodium street lamp', de: 'die Strahlung einer Natriumdampf-Strassenlampe', lam: [589e-9] },
    { reg: 'uv', en: 'the radiation of a lamp that shows up forged banknotes', de: 'die Strahlung einer Lampe, die gefälschte Banknoten erkennen lässt,', lam: [365e-9] },
    { reg: 'uv', en: 'the radiation of a lamp that disinfects water', de: 'die Strahlung einer Lampe, die Wasser entkeimt,', lam: [254e-9] },
    { reg: 'xray', en: 'the radiation of a dentist’s X-ray tube', de: 'die Strahlung der Röntgenröhre einer Zahnärztin', lam: [40e-12, 50e-12, 60e-12, 70e-12] },
    { reg: 'xray', en: 'the copper Kα line, used to study crystals,', de: 'die Kupfer-Kα-Linie, mit der man Kristalle untersucht,', lam: [154e-12] },
    { reg: 'gamma', en: 'the radiation of cobalt-60 nuclei', de: 'die Strahlung von Kobalt-60-Kernen', lam: [0.93e-12, 1.06e-12] },
    { reg: 'gamma', en: 'the radiation in a PET scanner (from positron annihilation)', de: 'die Strahlung in einem PET-Scanner (aus der Positronenvernichtung)', lam: [2.43e-12] },
  ];
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const valuesOf = (s) => (s.lam ? s.lam : s.f.map((f) => C / f));
  // four regions in a row around the right one, in the order of the spectrum
  function regionField(p, reg) {
    const i = ORDER.indexOf(reg), lo = Math.max(0, Math.min(ORDER.length - 4, i - p.off));
    const opts = ORDER.slice(lo, lo + 4).map((k) => [k, L(REG[k].en, REG[k].de), k === reg ? '' : REG[k].range(), k === reg ? null : 'region']);
    return choice('reg', L('Region of the spectrum:', 'Bereich des Spektrums:'), opts, { ask: L('Which region of the spectrum is it in?', 'In welchem Bereich des Spektrums liegt sie?') });
  }
  const regionStep = (p, v, src) => step(L('The region', 'Der Bereich'), p$(`${L(`A wavelength of $${tq(v.lam, lengthUnit(v.lam))}$ lies in the region of`, `Eine Wellenlänge von $${tq(v.lam, lengthUnit(v.lam))}$ liegt im Bereich`)} <span class="result">${L(REG[src.reg].en, REG[src.reg].de)}</span>. ${REG[src.reg].range()}`), ['mark']);
  const specMake = (r) => { const k = Math.floor(r() * SOURCES.length); return { s: k, x: pick(r, valuesOf(SOURCES[k])), off: Math.floor(r() * 4) }; };
  const WHY_INV = () => L('Turned round: from $c = \\lambda\\cdot f$, $f = c/\\lambda$ and $\\lambda = c/f$.', 'Umgekehrt: Aus $c = \\lambda\\cdot f$ folgt $f = c/\\lambda$ und $\\lambda = c/f$.');
  const HINT_C = () => L('All electromagnetic waves travel at the speed of light in vacuum: $c = \\lambda\\cdot f$ with $c = 3.00\\cdot 10^8\\,\\mathrm{m/s}$.', 'Alle elektromagnetischen Wellen laufen im Vakuum mit Lichtgeschwindigkeit: $c = \\lambda\\cdot f$ mit $c = 3.00\\cdot 10^8\\,\\mathrm{m/s}$.');
  const HINT_REG = () => L('Visible light runs from about 380 nm to 780 nm; shorter are UV, X-rays and γ rays, longer are infrared, microwaves (1 mm to 1 m) and radio waves.', 'Sichtbares Licht reicht von etwa 380 nm bis 780 nm; kürzer sind UV, Röntgen- und Gammastrahlung, länger Infrarot, Mikrowellen (1 mm bis 1 m) und Radiowellen.');

  // from the wavelength to the frequency
  const specLf = {
    id: 'spec-lf', difficulty: 1,
    title: () => L('From wavelength to frequency', 'Von der Wellenlänge zur Frequenz'),
    make: specMake,
    solve: (p, o = {}) => { const lam = g3(p.x); return { lam, f: o.inv ? lam / C : C / lam, reg: SOURCES[p.s].reg }; },
    traps: ['inv'],
    why: { inv: WHY_INV },
    fields: (p, v) => { const u = fUnit(C / v.lam); return [num$('f', 'f', u, L('frequency', 'Frequenz'), { sci: u === 'Hz' }), regionField(p, SOURCES[p.s].reg)]; },
    text: (p) => { const s = SOURCES[p.s], lam = g3(p.x); return L(`${cap(s.en)} has a wavelength of ${q(lam, lengthUnit(lam))}. What is its frequency, and in which region of the spectrum is it?`, `${cap(s.de)} hat eine Wellenlänge von ${q(lam, lengthUnit(lam))}. Wie gross ist ihre Frequenz, und in welchem Bereich des Spektrums liegt sie?`); },
    hints: () => [HINT_C(), L('The wavelength in metres: 1 nm = 10⁻⁹ m, 1 pm = 10⁻¹² m, 1 μm = 10⁻⁶ m.', 'Die Wellenlänge in Metern: 1 nm = 10⁻⁹ m, 1 pm = 10⁻¹² m, 1 μm = 10⁻⁶ m.'), HINT_REG()],
    steps: (p, v) => [
      step(L('The frequency', 'Die Frequenz'), p$(L('All electromagnetic waves travel at $c$ in vacuum, and $c = \\lambda\\cdot f$:', 'Alle elektromagnetischen Wellen laufen im Vakuum mit $c$, und $c = \\lambda\\cdot f$:')) +
        `$$f = \\frac{c}{\\lambda} = \\frac{${cT}}{${tq(v.lam, 'm')}} = ${res(tq(v.f, fUnit(v.f)))}$$`),
      regionStep(p, v, SOURCES[p.s]),
    ],
    figure: (p, v, view) => (view.task ? '' : Fg().spectrum(view.show.has('mark') ? v.lam : null)),
  };

  // from the frequency to the wavelength
  const specFl = {
    id: 'spec-fl', difficulty: 1,
    title: () => L('From frequency to wavelength', 'Von der Frequenz zur Wellenlänge'),
    make: specMake,
    solve: (p, o = {}) => { const f = g3(C / p.x); return { f, lam: o.inv ? f / C : C / f, reg: SOURCES[p.s].reg }; },
    traps: ['inv'],
    why: { inv: WHY_INV },
    fields: (p, v) => [num$('lam', '\\lambda', lengthUnit(v.lam), L('wavelength', 'Wellenlänge')), regionField(p, SOURCES[p.s].reg)],
    text: (p) => {
      const s = SOURCES[p.s], f = g3(C / p.x), u = fUnit(f);
      return L(`${cap(s.en)} has a frequency of ${q(f, u)}. What is its wavelength, and in which region of the spectrum is it?`, `${cap(s.de)} hat eine Frequenz von ${q(f, u)}. Wie gross ist ihre Wellenlänge, und in welchem Bereich des Spektrums liegt sie?`);
    },
    hints: () => [HINT_C(), L('The frequency in hertz: 1 MHz = 10⁶ Hz, 1 GHz = 10⁹ Hz, 1 THz = 10¹² Hz.', 'Die Frequenz in Hertz: 1 MHz = 10⁶ Hz, 1 GHz = 10⁹ Hz, 1 THz = 10¹² Hz.'), HINT_REG()],
    steps: (p, v) => [
      step(L('The wavelength', 'Die Wellenlänge'), p$(L('All electromagnetic waves travel at $c$ in vacuum, and $c = \\lambda\\cdot f$:', 'Alle elektromagnetischen Wellen laufen im Vakuum mit $c$, und $c = \\lambda\\cdot f$:')) +
        `$$\\lambda = \\frac{c}{f} = \\frac{${cT}}{${tq(v.f, 'Hz')}} = ${res(tq(v.lam, lengthUnit(v.lam)))}$$`),
      regionStep(p, v, SOURCES[p.s]),
    ],
    figure: (p, v, view) => (view.task ? '' : Fg().spectrum(view.show.has('mark') ? v.lam : null)),
  };

  // a signal there and back: laser ranging to the Moon, or a radar echo from an aeroplane
  const ECHO = { moon: [2.42, 2.45, 2.5, 2.53, 2.56, 2.6, 2.64, 2.69], plane: [0.2e-3, 0.3e-3, 0.4e-3, 0.5e-3, 0.6e-3, 0.8e-3, 1e-3, 1.2e-3] };
  const specEcho = {
    id: 'spec-echo', difficulty: 2,
    title: (p) => (p.tgt === 'moon' ? L('A laser pulse to the Moon', 'Ein Laserpuls zum Mond') : L('A radar echo', 'Ein Radarecho')),
    make: (r) => { const tgt = r() < 0.4 ? 'moon' : 'plane'; return { tgt, t: pick(r, ECHO[tgt]) }; },
    solve: (p, o = {}) => ({ d: o.echo ? C * p.t : (C * p.t) / 2 }),
    traps: ['echo'],
    why: { echo: () => L('That is the whole way, there and back: the distance is half of it.', 'Das ist der ganze Weg, hin und zurück: Die Distanz ist die Hälfte davon.') },
    fields: () => [num$('d', 'd', 'km', L('distance', 'Distanz'))],
    text: (p) => (p.tgt === 'moon'
      ? L(`A laser pulse is sent from an observatory to a reflector the Apollo astronauts left on the Moon. The reflected light comes back after ${q(p.t, 's')}. How far away is the Moon?`, `Ein Laserpuls wird von einer Sternwarte zu einem Reflektor geschickt, den die Apollo-Astronauten auf dem Mond zurückgelassen haben. Das reflektierte Licht kommt nach ${q(p.t, 's')} zurück. Wie weit ist der Mond entfernt?`)
      : L(`An airport radar sends out a short pulse of microwaves. The echo from an aeroplane arrives ${q(p.t, 'ms')} later. How far away is the aeroplane?`, `Ein Flughafenradar sendet einen kurzen Mikrowellenpuls aus. Das Echo eines Flugzeugs trifft ${q(p.t, 'ms')} später ein. Wie weit ist das Flugzeug entfernt?`)),
    hints: () => [L('Radio waves, microwaves and light all travel at $c = 3.00\\cdot 10^8\\,\\mathrm{m/s}$.', 'Radiowellen, Mikrowellen und Licht laufen alle mit $c = 3.00\\cdot 10^8\\,\\mathrm{m/s}$.'), L('In this time, the signal goes there and comes back.', 'In dieser Zeit geht das Signal hin und kommt zurück.')],
    steps: (p, v) => [
      step(L('There and back', 'Hin und zurück'), p$(L('In the time $t$, the signal covers the distance twice, $2d = c\\cdot t$:', 'In der Zeit $t$ legt das Signal die Distanz zweimal zurück, $2d = c\\cdot t$:')) +
        `$$d = \\frac{c\\cdot t}{2} = \\frac{${cT}\\cdot ${tq(p.t, 's')}}{2} = ${res(tq(v.d, 'km'))}$$` +
        (p.tgt === 'moon' ? p$(L('The distance changes over a month between about 356 000 km and 407 000 km: the Moon’s orbit is an ellipse.', 'Die Distanz ändert sich im Lauf eines Monats zwischen etwa 356 000 km und 407 000 km: Die Mondbahn ist eine Ellipse.')) : '')),
    ],
    figure: (p) => Fg().echo({ target: p.tgt }),
  };

  // ================================================================ 2 light in matter
  const MATS = [['water', 'Wasser', 1.33], ['ice', 'Eis', 1.31], ['glass', 'Glas', 1.5], ['acrylic glass', 'Acrylglas', 1.49], ['flint glass', 'Flintglas', 1.62], ['sapphire', 'Saphir', 1.77], ['diamond', 'Diamant', 2.42]];
  const LAMS = [405, 450, 488, 532, 589, 633, 650, 700].map((x) => x * 1e-9);
  const WHY_MULT = () => L('In a medium, light is slower: $v = c/n$ and $\\lambda = \\lambda_0/n$, both smaller than in vacuum.', 'In einem Medium ist Licht langsamer: $v = c/n$ und $\\lambda = \\lambda_0/n$, beide kleiner als im Vakuum.');
  const medium = {
    id: 'medium', difficulty: 2,
    title: () => L('Light in a medium', 'Licht in einem Medium'),
    make: (r) => ({ m: Math.floor(r() * MATS.length), lam0: pick(r, LAMS) }),
    solve: (p, o = {}) => {
      const n = MATS[p.m][2], v = o.mult ? C * n : C / n;
      return { v, f: o.same ? v / p.lam0 : C / p.lam0, lam: o.mult ? p.lam0 * n : o.same ? p.lam0 : p.lam0 / n };
    },
    traps: ['mult', 'same'],
    why: { mult: WHY_MULT, same: () => L('The frequency stays the same at the border: the wave oscillates in time with the wave arriving. It is the wavelength that changes.', 'Die Frequenz bleibt an der Grenze gleich: Die Welle schwingt im Takt der ankommenden Welle. Es ist die Wellenlänge, die sich ändert.') },
    fields: () => [num$('v', 'v', 'm/s', L('speed', 'Geschwindigkeit'), { sci: true }), num$('f', 'f', 'THz', L('frequency', 'Frequenz')), num$('lam', '\\lambda', 'nm', L('wavelength', 'Wellenlänge'))],
    text: (p) => { const m = MATS[p.m]; return L(`Light with a wavelength of ${q(p.lam0, 'nm')} in vacuum enters ${m[0]} (refractive index ${m[2]}). What are its speed, its frequency and its wavelength in the ${m[0]}?`, `Licht mit einer Wellenlänge von ${q(p.lam0, 'nm')} im Vakuum tritt in ${m[1]} ein (Brechzahl ${m[2]}). Wie gross sind seine Geschwindigkeit, seine Frequenz und seine Wellenlänge im ${m[1]}?`); },
    hints: () => [
      L('The refractive index says how many times slower light is in the medium: $v = c/n$.', 'Die Brechzahl sagt, wievielmal langsamer das Licht im Medium ist: $v = c/n$.'),
      L('At the border the frequency stays the same: each crest arriving makes one crest inside.', 'An der Grenze bleibt die Frequenz gleich: Jeder ankommende Wellenberg erzeugt einen Wellenberg im Innern.'),
      L('Then $\\lambda = v/f$.', 'Dann ist $\\lambda = v/f$.'),
    ],
    steps: (p, v) => { const n = MATS[p.m][2]; return [
      step(L('The speed', 'Die Geschwindigkeit'), `$$v = \\frac{c}{n} = \\frac{${cT}}{${n}} = ${res(tq(v.v, 'm/s'))}$$`),
      step(L('The frequency', 'Die Frequenz'), p$(L('It is the same as in vacuum:', 'Sie ist dieselbe wie im Vakuum:')) + `$$f = \\frac{c}{\\lambda_0} = \\frac{${cT}}{${tq(p.lam0, 'm')}} = ${res(tq(v.f, 'THz'))}$$`),
      step(L('The wavelength', 'Die Wellenlänge'), p$(L('Slower at the same frequency: shorter waves.', 'Langsamer bei derselben Frequenz: kürzere Wellen.')) + `$$\\lambda = \\frac{v}{f} = \\frac{\\lambda_0}{n} = \\frac{${tq(p.lam0, 'nm')}}{${n}} = ${res(tq(v.lam, 'nm'))}$$`),
    ]; },
    figure: (p) => Fg().medium(MATS[p.m][2]),
  };

  // the refractive index from the wavelength measured inside
  const mediumBack = {
    id: 'medium-back', difficulty: 3,
    title: () => L('How much slower?', 'Wieviel langsamer?'),
    make: (r) => ({ m: Math.floor(r() * MATS.length), lam0: pick(r, LAMS) }),
    solve: (p, o = {}) => { const lam = g3(p.lam0 / MATS[p.m][2]), n = o.ninv ? lam / p.lam0 : p.lam0 / lam; return { lam, n, v: C / n }; },
    traps: ['ninv'],
    why: { ninv: () => L('Upside down: the medium shortens the waves, $\\lambda = \\lambda_0/n$, so $n = \\lambda_0/\\lambda$ is larger than 1.', 'Kehrwert verwechselt: Das Medium verkürzt die Wellen, $\\lambda = \\lambda_0/n$, also ist $n = \\lambda_0/\\lambda$ grösser als 1.') },
    fields: () => [num$('n', 'n', '', L('refractive index', 'Brechzahl')), num$('v', 'v', 'm/s', L('speed of light in it', 'Lichtgeschwindigkeit darin'), { sci: true })],
    text: (p) => { const lam = g3(p.lam0 / MATS[p.m][2]); return L(`Laser light with a wavelength of ${q(p.lam0, 'nm')} in vacuum has a wavelength of only ${q(lam, 'nm')} in a transparent material. What is the refractive index of the material, and how fast is light in it?`, `Laserlicht mit einer Wellenlänge von ${q(p.lam0, 'nm')} im Vakuum hat in einem durchsichtigen Material eine Wellenlänge von nur ${q(lam, 'nm')}. Wie gross ist die Brechzahl des Materials, und wie schnell ist das Licht darin?`); },
    hints: () => [L('The frequency is the same inside and outside; so $\\lambda$ shrinks by the same factor as the speed.', 'Die Frequenz ist innen und aussen gleich; also schrumpft $\\lambda$ um denselben Faktor wie die Geschwindigkeit.'), L('$\\lambda = \\lambda_0/n$ and $v = c/n$.', '$\\lambda = \\lambda_0/n$ und $v = c/n$.')],
    steps: (p, v) => [
      step(L('The refractive index', 'Die Brechzahl'), p$(L('At the same frequency, $\\lambda = v/f$ shrinks as much as the speed: $\\lambda = \\lambda_0/n$.', 'Bei gleicher Frequenz schrumpft $\\lambda = v/f$ gleich stark wie die Geschwindigkeit: $\\lambda = \\lambda_0/n$.')) + `$$n = \\frac{\\lambda_0}{\\lambda} = \\frac{${tq(p.lam0, 'nm')}}{${tq(v.lam, 'nm')}} = ${res(tnum(v.n))}$$` + p$(L(`That fits ${MATS[p.m][0]} (n = ${MATS[p.m][2]}).`, `Das passt zu ${MATS[p.m][1]} (n = ${MATS[p.m][2]}).`))),
      step(L('The speed', 'Die Geschwindigkeit'), `$$v = \\frac{c}{n} = \\frac{${cT}}{${tnum(v.n)}} = ${res(tq(v.v, 'm/s'))}$$`),
    ],
    figure: (p) => Fg().medium(MATS[p.m][2]),
  };

  // ================================================================ 3 the LC circuit
  const LS = [1e-6, 2e-6, 5e-6, 10e-6, 20e-6, 50e-6, 100e-6, 200e-6, 500e-6, 1e-3, 2e-3, 5e-3, 10e-3, 20e-3, 50e-3, 0.1, 0.2, 0.5];
  const CS = [10e-12, 22e-12, 47e-12, 100e-12, 220e-12, 470e-12, 1e-9, 2.2e-9, 4.7e-9, 10e-9, 22e-9, 47e-9, 100e-9, 220e-9, 470e-9, 1e-6, 2.2e-6, 4.7e-6, 10e-6];
  const indU = (x) => (x >= 1e-3 ? 'mH' : 'μH');
  const thomson = (Lv, Cv) => 1 / (PI2 * Math.sqrt(Lv * Cv));
  const THOMSON = '$f = \\dfrac{1}{2\\pi\\sqrt{L\\,C}}$';
  const WHY_LC = {
    nopi: () => L(`That is the angular frequency $\\omega = 1/\\sqrt{L\\,C}$; the frequency is ${THOMSON}.`, `Das ist die Kreisfrequenz $\\omega = 1/\\sqrt{L\\,C}$; die Frequenz ist ${THOMSON}.`),
    nosqrt: () => L(`The root is missing: ${THOMSON}.`, `Die Wurzel fehlt: ${THOMSON}.`),
  };
  // the voltage of the capacitor and the current against time, two periods
  function lcGraph() {
    const n = 200, U = [], I = [];
    for (let k = 0; k <= n; k++) { const t = (2 * k) / n; U.push([t, Math.cos(PI2 * t)]); I.push([t, -Math.sin(PI2 * t)]); }
    return `<div class="fig">${Plot.graph([{ pts: U }, { pts: I, cls: 'icurve' }], { tEnd: 2, tStep: 0.5, name: 'U, I', axis: { lo: -1.2, hi: 1.2, step: 1 }, bare: true, marks: [1], tLabel: '<tspan class="it">t</tspan>', label: L('The voltage of the capacitor (solid) and the current (dashed) against time: a quarter of a period apart', 'Die Spannung am Kondensator (ausgezogen) und der Strom (gestrichelt) gegen die Zeit: um eine Viertelperiode verschoben') })}</div>`;
  }
  const lcF = {
    id: 'lc-f', difficulty: 2,
    title: () => L('An LC circuit', 'Ein Schwingkreis'),
    make: (r) => { const Lv = pick(r, LS), Cv = pick(r, CS), f = thomson(Lv, Cv); return f >= 100 && f <= 50e6 ? { L: Lv, C: Cv } : null; },
    solve: (p, o = {}) => { const f = o.nopi ? 1 / Math.sqrt(p.L * p.C) : o.nosqrt ? 1 / (PI2 * p.L * p.C) : thomson(p.L, p.C); return { f, T: 1 / f }; },
    traps: ['nopi', 'nosqrt'],
    why: WHY_LC,
    fields: (p) => { const f = thomson(p.L, p.C); return [num$('f', 'f', freqUnit(f), L('frequency', 'Frequenz')), num$('T', 'T', timeUnit(1 / f), L('period', 'Periode'))]; },
    text: (p) => L(`A capacitor of ${q(p.C, capUnit(p.C))} and a coil of ${q(p.L, indU(p.L))} form an LC circuit. At what frequency does it oscillate, and what is its period?`, `Ein Kondensator von ${q(p.C, capUnit(p.C))} und eine Spule von ${q(p.L, indU(p.L))} bilden einen Schwingkreis. Mit welcher Frequenz schwingt er, und wie gross ist seine Periode?`),
    hints: () => [L(`Thomson’s formula: ${THOMSON}.`, `Die Thomsonsche Schwingungsformel: ${THOMSON}.`), L('In SI units: 1 nF = 10⁻⁹ F, 1 pF = 10⁻¹² F, 1 mH = 10⁻³ H, 1 μH = 10⁻⁶ H.', 'In SI-Einheiten: 1 nF = 10⁻⁹ F, 1 pF = 10⁻¹² F, 1 mH = 10⁻³ H, 1 μH = 10⁻⁶ H.'), L('$T = 1/f$.', '$T = 1/f$.')],
    steps: (p, v) => [
      step(L('Thomson’s formula', 'Die Thomsonsche Formel'), p$(L('The charge flows back and forth between the plates of the capacitor, through the coil; the energy moves between the electric field of the capacitor and the magnetic field of the coil. It oscillates at', 'Die Ladung fliesst zwischen den Platten des Kondensators hin und her, durch die Spule; die Energie wechselt zwischen dem elektrischen Feld des Kondensators und dem Magnetfeld der Spule. Er schwingt mit')) +
        `$$f = \\frac{1}{2\\pi\\sqrt{L\\,C}} = \\frac{1}{2\\pi\\sqrt{${tq(p.L, 'H')}\\cdot ${tnum(p.C)}\\,\\mathrm{F}}} = ${res(tq(v.f, freqUnit(v.f)))}$$`),
      step(L('The period', 'Die Periode'), `$$T = \\frac{1}{f} = 2\\pi\\sqrt{L\\,C} = ${res(tq(v.T, timeUnit(v.T)))}$$`),
    ],
    figure: (p, v, view) => (view.task ? Fg().lc(0, { caption: false }) : lcGraph()),
  };

  // how the frequency changes with L or C: f ∝ 1/√(LC)
  const fac = (x) => (x >= 1 ? `$\\times ${sig(x, 3)}$` : `$\\times \\tfrac{1}{${sig(1 / x, 3)}}$`);
  const lcScale = {
    id: 'lc-scale', difficulty: 2,
    title: () => L('Change the circuit', 'Den Schwingkreis ändern'),
    make: (r) => { const what = pick(r, ['C', 'L', 'C', 'L', 'both']); return { what, k: pick(r, what === 'both' ? [2, 3, 4, 0.5] : [4, 9, 16, 0.25]) }; },
    solve: (p) => ({ fac: 'right' }),
    traps: [],
    fields: (p) => {
      const k = p.k, LC = p.what === 'both' ? k * k : k, right = 1 / Math.sqrt(LC);
      const whyR = () => L('$f = 1/(2\\pi\\sqrt{L\\,C})$: the frequency changes with one over the square root of $L\\cdot C$.', '$f = 1/(2\\pi\\sqrt{L\\,C})$: Die Frequenz ändert sich mit eins durch die Wurzel aus $L\\cdot C$.');
      const opts = [[1 / LC, 'root', L('The root is missing: the frequency goes with $1/\\sqrt{L\\,C}$, not with $1/(L\\,C)$.', 'Die Wurzel fehlt: Die Frequenz geht mit $1/\\sqrt{L\\,C}$, nicht mit $1/(L\\,C)$.')], [right, 'right', ''], [Math.sqrt(LC), 'dirn', L('The right size, the wrong way: a larger capacitance or inductance makes the oscillation slower.', 'Die richtige Grösse, die falsche Richtung: Eine grössere Kapazität oder Induktivität macht die Schwingung langsamer.')], [LC, 'prop', whyR()]]
        .sort((a, b) => a[0] - b[0]);
      return [choice('fac', L('The frequency changes by:', 'Die Frequenz ändert sich um:'), opts.map(([x, key, why]) => [key, fac(x), why, key === 'right' ? null : key]), { ask: L('By what factor does the frequency change?', 'Um welchen Faktor ändert sich die Frequenz?') })];
    },
    text: (p) => {
      const k = p.k, what = { C: L('the capacitance', 'die Kapazität'), L: L('the inductance', 'die Induktivität') };
      const by = (x) => (x >= 1 ? L(`${x} times as large`, `${x}-mal so gross`) : 1 / x === 2 ? L('half as large', 'halb so gross') : L('a quarter as large', 'einen Viertel so gross'));
      return p.what === 'both'
        ? L(`In an LC circuit, both the capacitance and the inductance are made ${by(k)}. By what factor does its frequency change?`, `In einem Schwingkreis werden sowohl die Kapazität als auch die Induktivität ${by(k)} gemacht. Um welchen Faktor ändert sich seine Frequenz?`)
        : L(`In an LC circuit, ${what[p.what]} is made ${by(k)}. By what factor does its frequency change?`, `In einem Schwingkreis wird ${what[p.what]} ${by(k)} gemacht. Um welchen Faktor ändert sich seine Frequenz?`);
    },
    hints: () => [L(`${THOMSON}: what happens to $\\sqrt{L\\,C}$?`, `${THOMSON}: Was passiert mit $\\sqrt{L\\,C}$?`), L('A larger $L$ or $C$ makes the oscillation slower.', 'Ein grösseres $L$ oder $C$ macht die Schwingung langsamer.')],
    steps: (p) => {
      const LC = p.what === 'both' ? p.k * p.k : p.k, right = 1 / Math.sqrt(LC);
      return [step(L('The factor', 'Der Faktor'), p$(L(`The product $L\\cdot C$ changes by the factor ${sig(LC, 3)}; its root by ${sig(Math.sqrt(LC), 3)}. The frequency is one over it:`, `Das Produkt $L\\cdot C$ ändert sich um den Faktor ${sig(LC, 3)}; seine Wurzel um ${sig(Math.sqrt(LC), 3)}. Die Frequenz ist eins durch sie:`)) +
        `$$f' = \\frac{1}{2\\pi\\sqrt{${sig(LC, 3)}\\,L\\,C}} = \\frac{1}{\\sqrt{${sig(LC, 3)}}}\\cdot f = ${res(right >= 1 ? `${sig(right, 3)}\\,f` : `\\tfrac{1}{${sig(1 / right, 3)}}\\,f`)}$$`)];
    },
    figure: (p, v, view) => (view.task ? Fg().lc(0, { caption: false }) : lcGraph()),
  };

  // tuning a radio: the capacitance for a station
  const BANDS = {
    am: { Ls: [100e-6, 200e-6, 250e-6, 300e-6], fs: [531e3, 603e3, 774e3, 999e3, 1206e3, 1422e3], en: 'a medium-wave radio', de: 'ein Mittelwellenradio' },
    fm: { Ls: [0.1e-6, 0.2e-6, 0.25e-6, 0.3e-6], fs: [88.4e6, 91.7e6, 94.6e6, 99.5e6, 102.8e6, 106.3e6], en: 'an FM radio', de: 'ein UKW-Radio' },
  };
  const lcC = {
    id: 'lc-c', difficulty: 3,
    title: () => L('Tuning in to a station', 'Einen Sender einstellen'),
    make: (r) => { const band = r() < 0.5 ? 'am' : 'fm', B = BANDS[band]; return { band, L: pick(r, B.Ls), f: pick(r, B.fs) }; },
    solve: (p, o = {}) => ({ C: o.nopi ? 1 / (p.f * p.f * p.L) : o.twopi ? 1 / (PI2 * p.f * p.f * p.L) : 1 / (PI2 * PI2 * p.f * p.f * p.L), lam: C / p.f }),
    traps: ['nopi', 'twopi'],
    why: { nopi: () => L('Without the 2π: $f = 1/(2\\pi\\sqrt{LC})$, so $C = 1/(4\\pi^2 f^2 L)$.', 'Ohne die 2π: $f = 1/(2\\pi\\sqrt{LC})$, also $C = 1/(4\\pi^2 f^2 L)$.'), twopi: () => L('The 2π has to be squared too: $C = 1/((2\\pi f)^2 L)$.', 'Auch die 2π müssen quadriert werden: $C = 1/((2\\pi f)^2 L)$.') },
    fields: (p, v) => [num$('C', 'C', 'pF', L('capacitance', 'Kapazität')), num$('lam', '\\lambda', 'm', L('wavelength of the station', 'Wellenlänge des Senders'))],
    text: (p) => { const B = BANDS[p.band]; return L(`In ${B.en}, a coil of ${q(p.L, 'μH')} and a variable capacitor form the LC circuit that picks the station: it responds to the frequency it oscillates at. To what capacitance must it be set to receive a station at ${q(p.f, freqUnit(p.f))}? What is the wavelength of that station?`, `In ${B.de.replace(/^ein /, 'einem ')} wählen eine Spule von ${q(p.L, 'μH')} und ein Drehkondensator als Schwingkreis den Sender: Er spricht auf die Frequenz an, mit der er schwingt. Auf welche Kapazität muss er eingestellt werden, um einen Sender auf ${q(p.f, freqUnit(p.f))} zu empfangen? Wie gross ist die Wellenlänge dieses Senders?`); },
    hints: () => [L(`${THOMSON}: solve for $C$.`, `${THOMSON}: Löse nach $C$ auf.`), L('Square both sides: $f^2 = \\dfrac{1}{4\\pi^2 L\\,C}$.', 'Quadriere beide Seiten: $f^2 = \\dfrac{1}{4\\pi^2 L\\,C}$.'), L('$\\lambda = c/f$.', '$\\lambda = c/f$.')],
    steps: (p, v) => [
      step(L('The capacitance', 'Die Kapazität'), p$(L('The circuit must oscillate at the station’s frequency. From Thomson’s formula, squared:', 'Der Schwingkreis muss mit der Frequenz des Senders schwingen. Aus der Thomsonschen Formel, quadriert:')) +
        `$$C = \\frac{1}{4\\pi^2 f^2 L} = \\frac{1}{4\\pi^2\\cdot (${tq(p.f, 'Hz')})^2\\cdot ${tq(p.L, 'H')}} = ${res(tq(v.C, 'pF'))}$$`),
      step(L('The wavelength', 'Die Wellenlänge'), `$$\\lambda = \\frac{c}{f} = \\frac{${cT}}{${tq(p.f, 'Hz')}} = ${res(tq(v.lam, 'm'))}$$` + p$(p.band === 'am' ? L('Medium waves are hundreds of metres long.', 'Mittelwellen sind Hunderte von Metern lang.') : L('FM waves are about 3 m long.', 'UKW-Wellen sind etwa 3 m lang.'))),
    ],
    figure: (p, v, view) => (view.task ? Fg().radio() : Fg().lc(0, { caption: false })),
  };

  // the energy in the circuit and the largest current
  const lcEnergy = {
    id: 'lc-energy', difficulty: 4,
    title: () => L('Energy in an LC circuit', 'Energie im Schwingkreis'),
    make: (r) => ({ C: pick(r, [1e-6, 2.2e-6, 4.7e-6, 10e-6, 22e-6, 47e-6]), U: pick(r, [5, 6, 9, 10, 12, 20, 24]), L: pick(r, [10e-3, 20e-3, 50e-3, 0.1, 0.2]) }),
    solve: (p, o = {}) => ({ W: o.nohalfW ? p.C * p.U * p.U : 0.5 * p.C * p.U * p.U, I: o.invLC ? p.U * Math.sqrt(p.L / p.C) : o.rootI ? (p.U * p.C) / p.L : p.U * Math.sqrt(p.C / p.L) }),
    traps: ['nohalfW', 'invLC', 'rootI'],
    why: {
      nohalfW: () => L('The energy of a capacitor is $W = \\tfrac12\\,C\\,U^2$.', 'Die Energie eines Kondensators ist $W = \\tfrac12\\,C\\,U^2$.'),
      invLC: () => L('Upside down: from $\\tfrac12 L\\hat I^2 = \\tfrac12 C\\hat U^2$, $\\hat I = \\hat U\\sqrt{C/L}$.', 'Kehrwert verwechselt: Aus $\\tfrac12 L\\hat I^2 = \\tfrac12 C\\hat U^2$ folgt $\\hat I = \\hat U\\sqrt{C/L}$.'),
      rootI: () => L('The root is missing: $\\hat I^2 = \\hat U^2\\,C/L$.', 'Die Wurzel fehlt: $\\hat I^2 = \\hat U^2\\,C/L$.'),
    },
    fields: (p, v) => [num$('W', 'W', energyUnit(v.W), L('energy of the oscillation', 'Energie der Schwingung')), num$('I', '\\hat I', currentUnit(v.I), L('largest current', 'grösster Strom'))],
    text: (p) => L(`A capacitor of ${q(p.C, 'μF')} is charged to ${q(p.U, 'V')} and then connected to a coil of ${q(p.L, p.L >= 0.1 ? 'H' : 'mH')} (the resistance of the circuit is negligible). How much energy oscillates in the circuit, and what is the largest current?`, `Ein Kondensator von ${q(p.C, 'μF')} wird auf ${q(p.U, 'V')} geladen und dann an eine Spule von ${q(p.L, p.L >= 0.1 ? 'H' : 'mH')} angeschlossen (der Widerstand des Kreises ist vernachlässigbar). Wieviel Energie schwingt im Kreis, und wie gross ist der grösste Strom?`),
    hints: () => [L('At the start, all the energy is in the capacitor: $W = \\tfrac12\\,C\\,U^2$.', 'Am Anfang steckt alle Energie im Kondensator: $W = \\tfrac12\\,C\\,U^2$.'), L('A quarter of a period later the capacitor is empty and the current is largest: all the energy is in the coil, $W = \\tfrac12\\,L\\,\\hat I^2$.', 'Eine Viertelperiode später ist der Kondensator leer und der Strom am grössten: Alle Energie steckt in der Spule, $W = \\tfrac12\\,L\\,\\hat I^2$.')],
    steps: (p, v) => [
      step(L('The energy', 'Die Energie'), p$(L('At the start, it is all in the electric field of the capacitor:', 'Am Anfang steckt sie ganz im elektrischen Feld des Kondensators:')) + `$$W = \\tfrac12\\,C\\,U^2 = \\tfrac12\\cdot ${tq(p.C, 'μF')}\\cdot (${tq(p.U, 'V')})^2 = ${res(tq(v.W, energyUnit(v.W)))}$$`),
      step(L('The largest current', 'Der grösste Strom'), p$(L('When the capacitor is empty, the current is largest and all the energy is in the magnetic field of the coil:', 'Wenn der Kondensator leer ist, ist der Strom am grössten, und alle Energie steckt im Magnetfeld der Spule:')) +
        `$$\\tfrac12\\,L\\,\\hat I^2 = W \\quad\\Rightarrow\\quad \\hat I = \\sqrt{\\frac{2W}{L}} = U\\sqrt{\\frac{C}{L}} = ${res(tq(v.I, currentUnit(v.I)))}$$`),
    ],
    figure: (p, v, view) => (view.task ? Fg().lc(0) : Fg().lc(0) + Fg().lc(1)),
  };

  // ================================================================ 4 E and B
  const DIRS = { xp: [1, 0, 0], xm: [-1, 0, 0], yp: [0, 1, 0], ym: [0, -1, 0], zp: [0, 0, 1], zm: [0, 0, -1] };
  const keyOf = (d) => Object.keys(DIRS).find((k) => DIRS[k].every((x, i) => x === d[i]));
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]].map((x) => x + 0);
  const dirName = (k) => ({ xp: L('to the right', 'nach rechts'), xm: L('to the left', 'nach links'), yp: L('up', 'nach oben'), ym: L('down', 'nach unten'), zp: L('out of the page', 'aus der Seite heraus'), zm: L('into the page', 'in die Seite hinein') })[k];
  const dirTile = (k) => `${{ xp: '→', xm: '←', yp: '↑', ym: '↓', zp: '⊙', zm: '⊗' }[k]} ${dirName(k)}`;
  const QN = { E: () => L('the electric field', 'das elektrische Feld'), B: () => L('the magnetic field', 'das Magnetfeld'), c: () => L('the direction of propagation', 'die Ausbreitungsrichtung') };
  const ASK = (k) => (k === 'c' ? L('Which way does the wave travel?', 'In welche Richtung läuft die Welle?') : L(`Which way does ${QN[k]()} point?`, `In welche Richtung zeigt ${QN[k]()}?`));
  const HAND = () => L('Right hand: thumb along $\\vec E$, index finger along $\\vec B$; the middle finger shows the direction of propagation $\\vec c$. (The same hand as for the force on a moving charge.)', 'Rechte Hand: Daumen längs $\\vec E$, Zeigefinger längs $\\vec B$; der Mittelfinger zeigt die Ausbreitungsrichtung $\\vec c$. (Dieselbe Hand wie für die Kraft auf eine bewegte Ladung.)');
  const ebDir = {
    id: 'eb-dir', difficulty: 2,
    title: () => L('Which way?', 'In welche Richtung?'),
    make: (r) => {
      const ks = Object.keys(DIRS), E = pick(r, ks), others = ks.filter((k) => DIRS[k].every((x, i) => x * DIRS[E][i] === 0)), B = pick(r, others);
      return { E, B, miss: pick(r, ['B', 'B', 'c', 'E']) };
    },
    solve: (p) => { const c = keyOf(cross(DIRS[p.E], DIRS[p.B])); return { E: p.E, B: p.B, c, ans: { E: p.E, B: p.B, c }[p.miss] }; },
    traps: [],
    fields: (p, v) => {
      const right = v.ans, given = ['E', 'B', 'c'].filter((k) => k !== p.miss).map((k) => v[k]);
      const opp = keyOf(DIRS[right].map((x) => -x));
      const why = (k) => (k === opp ? L('The other way round: the wave would then run backwards. $\\vec c$ points along $\\vec E\\times\\vec B$; check with the right hand.', 'Umgekehrt: Die Welle liefe dann rückwärts. $\\vec c$ zeigt längs $\\vec E\\times\\vec B$; prüfe mit der rechten Hand.')
        : L('In an electromagnetic wave, $\\vec E$, $\\vec B$ and $\\vec c$ are perpendicular to each other: none can point along another.', 'In einer elektromagnetischen Welle stehen $\\vec E$, $\\vec B$ und $\\vec c$ senkrecht aufeinander: Keines kann längs eines anderen zeigen.'));
      const keys = Object.keys(DIRS).filter((k) => k === right || k === opp || given.includes(k));
      return [choice('ans', p.miss === 'c' ? L('The wave travels:', 'Die Welle läuft:') : `${cap(QN[p.miss]())} ${L('points', 'zeigt')}:`, keys.map((k) => [k, dirTile(k), k === right ? '' : why(k), k === right ? null : k === opp ? 'hand' : 'perp']), { ask: ASK(p.miss) })];
    },
    text: (p) => {
      const v = ebDir.solve(p), [a, b] = ['E', 'B', 'c'].filter((k) => k !== p.miss);
      const says = (k) => (k === 'c' ? L(`the wave travels ${dirName(v.c)}`, `die Welle läuft ${dirName(v.c)}`) : L(`${QN[k]()} points ${dirName(v[k])}`, `${QN[k]()} zeigt ${dirName(v[k])}`));
      return L(`At one point of an electromagnetic wave, ${says(a)}, and ${says(b)}. ${ASK(p.miss)}`, `An einem Punkt einer elektromagnetischen Welle gilt: ${cap(says(a))}, und ${says(b)}. ${ASK(p.miss)}`);
    },
    hints: () => [L('$\\vec E$, $\\vec B$ and $\\vec c$ are perpendicular to each other.', '$\\vec E$, $\\vec B$ und $\\vec c$ stehen senkrecht aufeinander.'), HAND()],
    steps: (p, v) => [step(L('The right hand', 'Die rechte Hand'), p$(`${L('The wave runs in the direction of $\\vec E\\times\\vec B$.', 'Die Welle läuft in Richtung von $\\vec E\\times\\vec B$.')} ${HAND()}`) +
      p$(L(`Here: $\\vec E$ ${dirName(v.E)}, $\\vec B$ ${dirName(v.B)}, $\\vec c$ ${dirName(v.c)}. So ${p.miss === 'c' ? 'the wave travels' : `${QN[p.miss]()} points`} <span class="result">${dirName(v.ans)}</span>.`, `Hier: $\\vec E$ ${dirName(v.E)}, $\\vec B$ ${dirName(v.B)}, $\\vec c$ ${dirName(v.c)}. Also ${p.miss === 'c' ? 'läuft die Welle' : `zeigt ${QN[p.miss]()}`} <span class="result">${dirName(v.ans)}</span>.`)))],
    figure: (p, v, view) => {
      const d = (k) => DIRS[v[k]];
      return Fg().dirs(view.task ? { E: p.miss === 'E' ? null : d('E'), B: p.miss === 'B' ? null : d('B'), c: p.miss === 'c' ? null : d('c') } : { E: d('E'), B: d('B'), c: d('c') });
    },
  };

  // E = c·B
  const EVALS = [0.05, 0.2, 0.5, 1, 2, 5, 6, 10, 30, 60, 100, 300, 600, 1000];
  const ebRatio = {
    id: 'eb-ratio', difficulty: 2,
    title: () => L('Electric and magnetic field', 'Elektrisches und magnetisches Feld'),
    make: (r) => ({ give: r() < 0.6 ? 'E' : 'B', E: pick(r, EVALS) }),
    solve: (p, o = {}) => {
      if (p.give === 'E') return { B: o.einv ? p.E * C : p.E / C };
      const B = g3(p.E / C);
      return { E: o.einv ? B / C : B * C };
    },
    traps: ['einv'],
    why: { einv: () => L('Turned round: $E = c\\cdot B$, so the magnetic field in tesla is a tiny number, the electric field in V/m a large one.', 'Umgekehrt: $E = c\\cdot B$; das Magnetfeld in Tesla ist also eine winzige Zahl, das elektrische Feld in V/m eine grosse.') },
    fields: (p) => (p.give === 'E' ? [num$('B', '\\hat B', bUnit(p.E / C), L('amplitude of the magnetic field', 'Amplitude des Magnetfelds'))] : [num$('E', '\\hat E', fieldUnit(g3(p.E / C) * C), L('amplitude of the electric field', 'Amplitude des elektrischen Felds'))]),
    text: (p) => (p.give === 'E'
      ? L(`The electric field of an electromagnetic wave oscillates with an amplitude of ${q(p.E, fieldUnit(p.E))}. What is the amplitude of its magnetic field?`, `Das elektrische Feld einer elektromagnetischen Welle schwingt mit einer Amplitude von ${q(p.E, fieldUnit(p.E))}. Wie gross ist die Amplitude ihres Magnetfelds?`)
      : L(`The magnetic field of an electromagnetic wave oscillates with an amplitude of ${q(g3(p.E / C), bUnit(p.E / C))}. What is the amplitude of its electric field?`, `Das Magnetfeld einer elektromagnetischen Welle schwingt mit einer Amplitude von ${q(g3(p.E / C), bUnit(p.E / C))}. Wie gross ist die Amplitude ihres elektrischen Felds?`)),
    hints: () => [L('In an electromagnetic wave, $E = c\\cdot B$ at every place and every moment.', 'In einer elektromagnetischen Welle gilt $E = c\\cdot B$ an jedem Ort und zu jedem Zeitpunkt.'), L('1 T = 1 V·s/m²: V/m divided by m/s gives tesla.', '1 T = 1 V·s/m²: V/m geteilt durch m/s ergibt Tesla.')],
    steps: (p, v) => [step(L('E = c·B', 'E = c·B'), p$(L('The fields oscillate together, in phase; their sizes are linked by $E = c\\cdot B$:', 'Die Felder schwingen gemeinsam, in Phase; ihre Grössen hängen über $E = c\\cdot B$ zusammen:')) +
      (p.give === 'E' ? `$$\\hat B = \\frac{\\hat E}{c} = \\frac{${tq(p.E, 'V/m')}}{${cT}} = ${res(tq(v.B, bUnit(v.B)))}$$` : `$$\\hat E = c\\cdot\\hat B = ${cT}\\cdot ${tq(g3(p.E / C), 'T')} = ${res(tq(v.E, fieldUnit(v.E)))}$$`) +
      p$(L('Compared with the Earth’s field (about 50 μT), the magnetic field of a wave is weak: most detectors, and the antennas of radios, respond to its electric field.', 'Verglichen mit dem Erdfeld (etwa 50 μT) ist das Magnetfeld einer Welle schwach: Die meisten Detektoren und die Antennen von Radios sprechen auf ihr elektrisches Feld an.')))],
    figure: (p, v, view) => (view.task ? '' : Fg().wave3d()),
  };

  // E and B in phase: where on a snapshot of E(x) is B zero, or largest?
  const XS = { top: [0.25, 1.25], bottom: [0.75, 1.75], zero: [0.5, 1, 1.5], mid: [0.125, 0.375, 0.625, 0.875, 1.125, 1.375, 1.625, 1.875] };
  const ebPhase = {
    id: 'eb-phase', difficulty: 3,
    title: () => L('In phase', 'In Phase'),
    make: (r) => {
      const ask = pick(r, ['zero', 'max', 'max']);
      const right = ask === 'zero' ? pick(r, XS.zero) : pick(r, [...XS.top, ...XS.bottom]);
      const pool = ask === 'zero' ? [...XS.top, ...XS.bottom, ...XS.mid] : [...XS.zero, ...XS.mid];
      const others = shuffle(r, pool.slice()).filter((x) => Math.abs(x - right) > 0.2);
      const xs = [right];
      for (const x of others) if (xs.length < 4 && xs.every((y) => Math.abs(y - x) > 0.2)) xs.push(x);
      // at most one crest or trough when the largest is asked, and at least one of them when zero is
      if (xs.length < 4 || (ask === 'zero' && !xs.some((x) => XS.top.includes(x) || XS.bottom.includes(x)))) return null;
      return { ask, xs: xs.sort((a, b) => a - b), right };
    },
    solve: (p) => ({ pt: 'PQRS'[p.xs.indexOf(p.right)] }),
    traps: [],
    fields: (p, v) => [choice('pt', p.ask === 'zero' ? L('B is zero at:', 'B ist null bei:') : L('B is largest at:', 'B ist am grössten bei:'), p.xs.map((x, i) => {
      const n = 'PQRS'[i], peak = XS.top.includes(x) || XS.bottom.includes(x), zero = XS.zero.includes(x);
      if (n === v.pt) return [n, n, '', null];
      if ((p.ask === 'zero' && peak) || (p.ask === 'max' && zero)) return [n, n, L('As if B lagged a quarter of a wave behind E (like the current behind the voltage in an LC circuit). In a travelling wave, E and B are in phase: B is zero where E is, and largest where E is.', 'Als hinkte B eine Viertelwelle hinter E her (wie der Strom hinter der Spannung im Schwingkreis). In einer fortschreitenden Welle sind E und B in Phase: B ist null, wo E null ist, und am grössten, wo E am grössten ist.'), 'phase'];
      return [n, n, L('Here E is neither zero nor largest; B, in phase with E, is neither.', 'Hier ist E weder null noch am grössten; B, in Phase mit E, also auch nicht.'), 'phaseother'];
    }), { ask: p.ask === 'zero' ? L('Where is the magnetic field zero?', 'Wo ist das Magnetfeld null?') : L('Where is the magnetic field largest?', 'Wo ist das Magnetfeld am grössten?') })],
    text: (p) => (p.ask === 'zero'
      ? L('The graph shows the electric field of an electromagnetic wave along its direction of propagation, at one moment. At which of the points P, Q, R, S is its magnetic field zero?', 'Das Diagramm zeigt das elektrische Feld einer elektromagnetischen Welle längs ihrer Ausbreitungsrichtung, zu einem Zeitpunkt. An welchem der Punkte P, Q, R, S ist ihr Magnetfeld null?')
      : L('The graph shows the electric field of an electromagnetic wave along its direction of propagation, at one moment. At which of the points P, Q, R, S is its magnetic field largest (in size)?', 'Das Diagramm zeigt das elektrische Feld einer elektromagnetischen Welle längs ihrer Ausbreitungsrichtung, zu einem Zeitpunkt. An welchem der Punkte P, Q, R, S ist ihr Magnetfeld (dem Betrag nach) am grössten?')),
    hints: () => [L('$E = c\\cdot B$ holds at every place and every moment.', '$E = c\\cdot B$ gilt an jedem Ort und zu jedem Zeitpunkt.'), L('So E and B are zero at the same places, and largest at the same places.', 'Also sind E und B an denselben Orten null und an denselben Orten am grössten.')],
    steps: (p, v) => [step(L('In phase', 'In Phase'), p$(L(`In a travelling electromagnetic wave, $E = c\\cdot B$ everywhere: the fields are in phase. The magnetic field (dashed) is ${p.ask === 'zero' ? 'zero where the electric field is zero' : 'largest where the electric field is largest'}: at <span class="result">${v.pt}</span>.`, `In einer fortschreitenden elektromagnetischen Welle gilt überall $E = c\\cdot B$: Die Felder sind in Phase. Das Magnetfeld (gestrichelt) ist ${p.ask === 'zero' ? 'null, wo das elektrische Feld null ist' : 'am grössten, wo das elektrische Feld am grössten ist'}: bei <span class="result">${v.pt}</span>.`)))],
    figure: (p, v, view) => {
      const n = 240, pts = [], pb = [];
      for (let k = 0; k <= n; k++) { const x = (2 * k) / n; pts.push([x, Math.sin(PI2 * x)]); pb.push([x, 0.8 * Math.sin(PI2 * x)]); }
      const curves = view.task ? [{ pts }] : [{ pts }, { pts: pb, cls: 'bcurve' }];
      return `<div class="fig">${Plot.graph(curves, { tEnd: 2, name: view.task ? 'E' : 'E, B', axis: { lo: -1.5, hi: 1.5, step: 0.5 }, bare: true, tLabel: '<tspan class="it">x</tspan>', points: p.xs.map((x, i) => [x, Math.sin(PI2 * x), 'PQRS'[i], Math.sin(PI2 * x) < -0.1]), label: L('The electric field along the direction of propagation at one moment, with four points P, Q, R, S', 'Das elektrische Feld längs der Ausbreitungsrichtung zu einem Zeitpunkt, mit vier Punkten P, Q, R, S') })}</div>`;
    },
  };

  // ================================================================ 5 intensity
  // I = ½·c·ε₀·Ê², and a point source spreads its power over 4πr²
  const ehat = (I) => Math.sqrt((2 * I) / (C * EPS0));
  const EHAT = '\\hat E = \\sqrt{\\frac{2I}{c\\,\\varepsilon_0}}';
  const WHY_I = {
    circle: () => L('The power spreads over the whole sphere around the source, of area $4\\pi r^2$, not over a disc $\\pi r^2$.', 'Die Leistung verteilt sich auf die ganze Kugel um die Quelle, mit der Fläche $4\\pi r^2$, nicht auf eine Scheibe $\\pi r^2$.'),
    lin: () => L('The area of a sphere grows with $r^2$: $I = P/(4\\pi r^2)$.', 'Die Fläche einer Kugel wächst mit $r^2$: $I = P/(4\\pi r^2)$.'),
    nohalfI: () => L('The intensity is $I = \\tfrac12\\,c\\,\\varepsilon_0\\,\\hat E^2$: the field oscillates, and on average $E^2$ is half of $\\hat E^2$.', 'Die Intensität ist $I = \\tfrac12\\,c\\,\\varepsilon_0\\,\\hat E^2$: Das Feld schwingt, und im Mittel ist $E^2$ die Hälfte von $\\hat E^2$.'),
    rootE: () => L('The root is missing: the intensity grows with the square of the field.', 'Die Wurzel fehlt: Die Intensität wächst mit dem Quadrat des Felds.'),
    diam: () => L('$d$ is the diameter: the area of the beam is $\\pi (d/2)^2$.', '$d$ ist der Durchmesser: Die Fläche des Strahls ist $\\pi (d/2)^2$.'),
  };
  const fieldStep = (I, E) => step(L('The field', 'Das Feld'), p$(L('The intensity is $I = \\tfrac12\\,c\\,\\varepsilon_0\\,\\hat E^2$ (on average, $E^2$ is half of $\\hat E^2$):', 'Die Intensität ist $I = \\tfrac12\\,c\\,\\varepsilon_0\\,\\hat E^2$ (im Mittel ist $E^2$ die Hälfte von $\\hat E^2$):')) +
    `$$${EHAT} = \\sqrt{\\frac{2\\cdot ${tq(I, 'W/m²')}}{${cT}\\cdot ${e0T}}} = ${res(tq(E, fieldUnit(E)))}$$`);
  const HINT_E = () => L('$I = \\tfrac12\\,c\\,\\varepsilon_0\\,\\hat E^2$ with $\\varepsilon_0 = 8.854\\cdot 10^{-12}\\,\\mathrm{A\\,s/(V\\,m)}$.', '$I = \\tfrac12\\,c\\,\\varepsilon_0\\,\\hat E^2$ mit $\\varepsilon_0 = 8.854\\cdot 10^{-12}\\,\\mathrm{A\\,s/(V\\,m)}$.');
  const point = {
    id: 'point', difficulty: 3,
    title: () => L('A point source', 'Eine punktförmige Quelle'),
    make: (r) => ({ P: pick(r, [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000]), r: pick(r, [0.5, 1, 2, 3, 5, 10, 20, 50, 100]) }),
    solve: (p, o = {}) => { const I = p.P / ((o.circle ? 1 : 4) * Math.PI * (o.lin ? p.r : p.r * p.r)); return { I, E: o.nohalfI ? ehat(I / 2) : ehat(I) }; },
    traps: ['circle', 'lin', 'nohalfI'],
    why: WHY_I,
    fields: (p, v) => [num$('I', 'I', intUnit(v.I), L('intensity', 'Intensität')), num$('E', '\\hat E', fieldUnit(v.E), L('amplitude of the electric field', 'Amplitude des elektrischen Felds'))],
    text: (p) => L(`A small source radiates a power of ${q(p.P, 'W')} evenly in all directions. What is the intensity at a distance of ${q(p.r, 'm')}? What is the amplitude of the electric field there?`, `Eine kleine Quelle strahlt eine Leistung von ${q(p.P, 'W')} gleichmässig in alle Richtungen ab. Wie gross ist die Intensität im Abstand ${q(p.r, 'm')}? Wie gross ist dort die Amplitude des elektrischen Felds?`),
    hints: () => [L('The intensity is power per area, in W/m².', 'Die Intensität ist Leistung pro Fläche, in W/m².'), L('At the distance $r$, the power has spread over a sphere of area $4\\pi r^2$.', 'Im Abstand $r$ hat sich die Leistung auf eine Kugel mit der Fläche $4\\pi r^2$ verteilt.'), HINT_E()],
    steps: (p, v) => [
      step(L('The intensity', 'Die Intensität'), p$(L('The power spreads over a sphere of radius $r$:', 'Die Leistung verteilt sich auf eine Kugel mit dem Radius $r$:')) + `$$I = \\frac{P}{4\\pi r^2} = \\frac{${tq(p.P, 'W')}}{4\\pi\\cdot (${tq(p.r, 'm')})^2} = ${res(tq(v.I, intUnit(v.I)))}$$`),
      fieldStep(v.I, v.E),
    ],
    figure: () => Fg().sphere({ two: false }),
  };

  // 1/r²: the intensity at another distance, and the field
  const invSq = {
    id: 'inv-sq', difficulty: 2,
    title: () => L('Further away', 'Weiter weg'),
    make: (r) => ({ I1: pick(r, [2, 5, 8, 12, 20, 36, 50, 80, 100, 400]), r1: pick(r, [1, 2, 3, 5, 10]), k: pick(r, [2, 3, 4, 5, 10, 0.5]) }),
    solve: (p, o = {}) => ({ I2: o.linR ? p.I1 / p.k : p.I1 / (p.k * p.k), e: o.linR ? 1 / Math.sqrt(p.k) : o.field ? 1 / (p.k * p.k) : 1 / p.k }),
    traps: ['linR', 'field'],
    why: { linR: () => L('The power spreads over the area of a sphere, $4\\pi r^2$: the intensity falls with $1/r^2$, not $1/r$.', 'Die Leistung verteilt sich auf die Kugelfläche $4\\pi r^2$: Die Intensität fällt mit $1/r^2$, nicht mit $1/r$.'), field: () => L('That is the factor of the intensity. The field goes with its root: $\\hat E \\propto \\sqrt I \\propto 1/r$.', 'Das ist der Faktor der Intensität. Das Feld geht mit ihrer Wurzel: $\\hat E \\propto \\sqrt I \\propto 1/r$.') },
    fields: (p) => [num$('I2', 'I_2', 'W/m²', L('intensity there', 'Intensität dort')), num$('e', '\\hat E_2/\\hat E_1', '', L('factor of the field amplitude', 'Faktor der Feldamplitude'))],
    text: (p) => { const r2 = p.r1 * p.k; return L(`At a distance of ${q(p.r1, 'm')} from a small lamp, the intensity of its light is ${q(p.I1, 'W/m²')}. What is the intensity at ${q(r2, 'm')} from the lamp? By what factor has the amplitude of the electric field changed there? (A fraction like 1/4 is fine.)`, `Im Abstand ${q(p.r1, 'm')} von einer kleinen Lampe beträgt die Intensität ihres Lichts ${q(p.I1, 'W/m²')}. Wie gross ist die Intensität im Abstand ${q(r2, 'm')} von der Lampe? Um welchen Faktor hat sich dort die Amplitude des elektrischen Felds geändert? (Ein Bruch wie 1/4 geht auch.)`); },
    hints: () => [L('The same power spreads over a sphere of area $4\\pi r^2$: $I \\propto 1/r^2$.', 'Dieselbe Leistung verteilt sich auf eine Kugel mit der Fläche $4\\pi r^2$: $I \\propto 1/r^2$.'), L('$I \\propto \\hat E^2$, so $\\hat E \\propto \\sqrt I$.', '$I \\propto \\hat E^2$, also $\\hat E \\propto \\sqrt I$.')],
    steps: (p, v) => { const k = p.k, kk = k >= 1 ? `${k}` : `\\tfrac{1}{${1 / k}}`; return [
      step(L('The intensity', 'Die Intensität'), p$(L(`The distance is ${k >= 1 ? `${k} times as large` : 'half as large'}: the same power spreads over ${k >= 1 ? `${k * k} times` : 'a quarter of'} the area.`, `Der Abstand ist ${k >= 1 ? `${k}-mal so gross` : 'halb so gross'}: Dieselbe Leistung verteilt sich auf ${k >= 1 ? `die ${k * k}-fache` : 'ein Viertel der'} Fläche.`)) +
        `$$I_2 = I_1\\cdot\\left(\\frac{r_1}{r_2}\\right)^2 = \\frac{${tq(p.I1, 'W/m²')}}{(${kk})^2} = ${res(tq(v.I2, 'W/m²'))}$$`),
      step(L('The field', 'Das Feld'), p$(L('The intensity goes with the square of the field, $I = \\tfrac12\\,c\\,\\varepsilon_0\\,\\hat E^2$; the field goes with $1/r$:', 'Die Intensität geht mit dem Quadrat des Felds, $I = \\tfrac12\\,c\\,\\varepsilon_0\\,\\hat E^2$; das Feld geht mit $1/r$:')) +
        `$$\\frac{\\hat E_2}{\\hat E_1} = \\sqrt{\\frac{I_2}{I_1}} = \\frac{r_1}{r_2} = ${res(k >= 1 ? `\\tfrac{1}{${k}} = ${tnum(1 / k)}` : '2')}$$`),
    ]; },
    figure: () => Fg().sphere({ r1: 'r₁', r2: 'r₂' }),
  };

  // a laser beam: I = P/(π(d/2)²)
  const beam = {
    id: 'beam', difficulty: 3,
    title: () => L('A laser beam', 'Ein Laserstrahl'),
    make: (r) => ({ P: pick(r, [1, 3, 5, 10, 50, 100]) * 1e-3, d: pick(r, [1, 1.5, 2, 3, 4]) * 1e-3 }),
    solve: (p, o = {}) => { const I = p.P / (Math.PI * (o.diam ? p.d * p.d : (p.d * p.d) / 4)); return { I, E: o.nohalfI ? ehat(I / 2) : ehat(I) }; },
    traps: ['diam', 'nohalfI'],
    why: WHY_I,
    fields: (p, v) => [num$('I', 'I', intUnit(v.I), L('intensity', 'Intensität')), num$('E', '\\hat E', fieldUnit(v.E), L('amplitude of the electric field', 'Amplitude des elektrischen Felds'))],
    text: (p) => L(`A laser pointer emits ${q(p.P, 'mW')} in a beam ${q(p.d, 'mm')} in diameter. What is the intensity in the beam (taken as even across it)? What is the amplitude of the electric field? (Sunlight at noon: about 1 kW/m².)`, `Ein Laserpointer strahlt ${q(p.P, 'mW')} in einem Strahl von ${q(p.d, 'mm')} Durchmesser ab. Wie gross ist die Intensität im Strahl (über den Querschnitt gleichmässig angenommen)? Wie gross ist die Amplitude des elektrischen Felds? (Sonnenlicht am Mittag: etwa 1 kW/m².)`),
    hints: () => [L('Intensity = power / area of the cross-section of the beam.', 'Intensität = Leistung / Querschnittsfläche des Strahls.'), L('The area of a circle of diameter $d$ is $\\pi (d/2)^2$.', 'Die Fläche eines Kreises mit dem Durchmesser $d$ ist $\\pi (d/2)^2$.'), HINT_E()],
    steps: (p, v) => [
      step(L('The intensity', 'Die Intensität'), `$$I = \\frac{P}{\\pi\\,(d/2)^2} = \\frac{${tq(p.P, 'W')}}{\\pi\\cdot (${tq(p.d / 2, 'm')})^2} = ${res(tq(v.I, intUnit(v.I)))}$$` + p$(v.I > 1000 ? L('More than sunlight at noon, concentrated on a small spot: never look into a laser beam.', 'Mehr als Sonnenlicht am Mittag, auf einen kleinen Fleck konzentriert: Schau nie in einen Laserstrahl.') : L('Comparable to sunlight, but concentrated on a small spot, which the eye focuses further: never look into a laser beam.', 'Vergleichbar mit Sonnenlicht, aber auf einen kleinen Fleck konzentriert, den das Auge weiter bündelt: Schau nie in einen Laserstrahl.'))),
      fieldStep(v.I, v.E),
    ],
    figure: () => Fg().beam(),
  };

  // the fields from the intensity
  const INTS = [
    { en: 'sunlight at noon, on the ground,', de: 'des Sonnenlichts am Mittag, am Boden,', I: [800, 900, 1000] },
    { en: 'sunlight above the atmosphere', de: 'des Sonnenlichts über der Atmosphäre', I: [1361] },
    { en: 'the light at a desk under a lamp', de: 'des Lichts an einem Pult unter einer Lampe', I: [2, 5, 10] },
    { en: 'the signal of a radio station a few kilometres away', de: 'des Signals eines wenige Kilometer entfernten Radiosenders', I: [1e-4, 2e-4, 5e-4] },
  ];
  const ebInt = {
    id: 'eb-int', difficulty: 3,
    title: () => L('How strong are the fields?', 'Wie stark sind die Felder?'),
    make: (r) => { const s = Math.floor(r() * INTS.length); return { s, I: pick(r, INTS[s].I) }; },
    solve: (p, o = {}) => { const E = o.nohalfI ? ehat(p.I / 2) : o.rootE ? (2 * p.I) / (C * EPS0) : ehat(p.I); return { E, B: E / C }; },
    traps: ['nohalfI', 'rootE'],
    why: WHY_I,
    fields: (p) => [num$('E', '\\hat E', fieldUnit(ehat(p.I)), L('amplitude of the electric field', 'Amplitude des elektrischen Felds')), num$('B', '\\hat B', bUnit(ehat(p.I) / C), L('amplitude of the magnetic field', 'Amplitude des Magnetfelds'))],
    text: (p) => { const s = INTS[p.s]; return L(`The intensity of ${s.en} is ${q(p.I, intUnit(p.I))}. What are the amplitudes of its electric and its magnetic field?`, `Die Intensität ${s.de} beträgt ${q(p.I, intUnit(p.I))}. Wie gross sind die Amplituden seines elektrischen und seines magnetischen Felds?`); },
    hints: () => [HINT_E(), L('Then $\\hat B = \\hat E/c$.', 'Dann ist $\\hat B = \\hat E/c$.')],
    steps: (p, v) => [fieldStep(p.I, v.E), step(L('The magnetic field', 'Das Magnetfeld'), `$$\\hat B = \\frac{\\hat E}{c} = \\frac{${tq(v.E, 'V/m')}}{${cT}} = ${res(tq(v.B, bUnit(v.B)))}$$`)],
    figure: (p, v, view) => (view.task ? '' : Fg().wave3d()),
  };

  // ================================================================ 6 polarization
  const ANG = [15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 70, 75];
  const cos2 = (a) => Math.cos(a * DEG) ** 2;
  const MALUS = () => L('Malus’s law: polarized light through a filter turned by θ keeps $I = I_0\\cos^2\\theta$ (the part of the field along the filter is $E\\cos\\theta$, and the intensity goes with its square).', 'Gesetz von Malus: Polarisiertes Licht behält hinter einem um θ gedrehten Filter $I = I_0\\cos^2\\theta$ (der Teil des Felds längs des Filters ist $E\\cos\\theta$, und die Intensität geht mit seinem Quadrat).');
  const HALF = () => L('Unpolarized light contains all directions of polarization; a polarizer lets through half of its intensity.', 'Unpolarisiertes Licht enthält alle Polarisationsrichtungen; ein Polarisator lässt die Hälfte seiner Intensität durch.');
  const WHY_P = {
    nohalfP: () => L('The light of the lamp is unpolarized: the first filter lets through only half of it.', 'Das Licht der Lampe ist unpolarisiert: Das erste Filter lässt nur die Hälfte davon durch.'),
    cos1: () => L('The intensity goes with the square of the field: $\\cos^2\\theta$, not $\\cos\\theta$.', 'Die Intensität geht mit dem Quadrat des Felds: $\\cos^2\\theta$, nicht $\\cos\\theta$.'),
    sin2: () => L('θ is the angle between the filters’ axes: what passes is the part along the second axis, $\\cos^2\\theta$.', 'θ ist der Winkel zwischen den Filterachsen: Durch kommt der Teil längs der zweiten Achse, $\\cos^2\\theta$.'),
    same3: () => L('The last filter is turned by 90° − θ against the middle one, not by θ.', 'Das letzte Filter ist gegenüber dem mittleren um 90° − θ gedreht, nicht um θ.'),
    zero: () => L('Without the middle filter, crossed filters let nothing through. But the middle one turns the polarization: the light reaching the last filter is no longer perpendicular to it.', 'Ohne das mittlere Filter lassen gekreuzte Filter nichts durch. Aber das mittlere dreht die Polarisation: Das Licht beim letzten Filter steht nicht mehr senkrecht zu ihm.'),
    noroot: () => L('The share is $\\cos^2\\theta$: first take the root, then the arccos.', 'Der Anteil ist $\\cos^2\\theta$: zuerst die Wurzel ziehen, dann den Arkuskosinus.'),
  };
  const malus = {
    id: 'malus', difficulty: 2,
    title: () => L('Two polarizing filters', 'Zwei Polarisationsfilter'),
    make: (r) => ({ I0: pick(r, [100, 200, 300, 400, 500, 600, 800, 1000]), a: pick(r, ANG) }),
    solve: (p, o = {}) => { const I1 = o.nohalfP ? p.I0 : p.I0 / 2; return { I1, I2: I1 * (o.cos1 ? Math.cos(p.a * DEG) : o.sin2 ? Math.sin(p.a * DEG) ** 2 : cos2(p.a)) }; },
    traps: ['nohalfP', 'cos1', 'sin2'],
    why: WHY_P,
    fields: () => [num$('I1', 'I_1', 'W/m²', L('after the first filter', 'nach dem ersten Filter')), num$('I2', 'I_2', 'W/m²', L('after the second filter', 'nach dem zweiten Filter'))],
    text: (p) => L(`The unpolarized light of a lamp, of intensity ${q(p.I0, 'W/m²')}, passes through two polarizing filters, whose axes are at ${p.a}° to each other. What is the intensity after the first filter, and after the second?`, `Das unpolarisierte Licht einer Lampe, mit der Intensität ${q(p.I0, 'W/m²')}, geht durch zwei Polarisationsfilter, deren Achsen einen Winkel von ${p.a}° bilden. Wie gross ist die Intensität nach dem ersten Filter und nach dem zweiten?`),
    hints: () => [HALF(), MALUS()],
    steps: (p, v) => [
      step(L('The first filter', 'Das erste Filter'), p$(HALF()) + `$$I_1 = \\tfrac12\\,I_0 = ${res(tq(v.I1, 'W/m²'))}$$` + p$(L('Behind it, the light is polarized along its axis.', 'Dahinter ist das Licht längs seiner Achse polarisiert.'))),
      step(L('The second filter', 'Das zweite Filter'), p$(MALUS()) + `$$I_2 = I_1\\cos^2\\theta = ${tq(v.I1, 'W/m²')}\\cdot\\cos^2(${p.a}^\\circ) = ${res(tq(v.I2, 'W/m²'))}$$`),
    ],
    figure: (p) => Fg().polarizers({ angles: [0, p.a], unpol: true, names: ['I₀', 'I₁', 'I₂'], labels: ['0°', `${p.a}°`] }),
  };

  // the angle for a share of polarized light
  const SHARES = [0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7, 0.75, 0.8, 0.9];
  const malusAngle = {
    id: 'malus-angle', difficulty: 3,
    title: () => L('Dimming with a filter', 'Abdunkeln mit einem Filter'),
    make: (r) => ({ s: pick(r, SHARES) }),
    solve: (p, o = {}) => ({ a: (o.noroot ? Math.acos(p.s) : Math.acos(Math.sqrt(p.s))) / DEG }),
    traps: ['noroot'],
    why: WHY_P,
    fields: () => [num$('a', '\\theta', '°', L('angle', 'Winkel'))],
    text: (p) => L(`The light of a laser is polarized vertically. By what angle from the vertical must the axis of a polarizing filter be turned so that it lets through ${Math.round(p.s * 100)} % of the intensity?`, `Das Licht eines Lasers ist senkrecht polarisiert. Um welchen Winkel gegen die Senkrechte muss die Achse eines Polarisationsfilters gedreht werden, damit es ${Math.round(p.s * 100)} % der Intensität durchlässt?`),
    hints: () => [MALUS(), L('$\\cos^2\\theta = I/I_0$: take the root, then the arccos.', '$\\cos^2\\theta = I/I_0$: Zieh die Wurzel, dann den Arkuskosinus.')],
    steps: (p, v) => [step(L('Malus’s law', 'Gesetz von Malus'), p$(MALUS()) + `$$\\cos^2\\theta = \\frac{I}{I_0} = ${p.s} \\quad\\Rightarrow\\quad \\theta = \\arccos\\sqrt{${p.s}} = ${res(`${tnum(v.a)}^\\circ`)}$$`)],
    figure: (p, v, view) => Fg().polarizers({ angles: [view.task ? 40 : v.a], unpol: false, names: ['I₀', 'I'], labels: [view.task ? 'θ = ?' : `θ = ${sig(v.a, 3)}°`] }),
  };

  // three filters: the first and last crossed, the middle one turned by θ
  const malusThree = {
    id: 'malus-three', difficulty: 4,
    title: () => L('Light through crossed filters', 'Licht durch gekreuzte Filter'),
    make: (r) => ({ I0: pick(r, [100, 200, 400, 600, 800, 1000]), a: pick(r, [15, 20, 30, 40, 45, 50, 60, 70, 75]) }),
    solve: (p, o = {}) => {
      const I1 = p.I0 / 2, f = (x) => (o.cos1 ? Math.cos(x * DEG) : cos2(x));
      const I2 = I1 * f(p.a);
      return { I2, I3: o.zero ? 0 : I2 * f(o.same3 ? p.a : 90 - p.a) };
    },
    traps: ['cos1', 'same3', 'zero'],
    why: WHY_P,
    fields: () => [num$('I2', 'I_2', 'W/m²', L('after the middle filter', 'nach dem mittleren Filter')), num$('I3', 'I_3', 'W/m²', L('after the last filter', 'nach dem letzten Filter'))],
    text: (p) => L(`Two polarizing filters are crossed (their axes at 90°): no light gets through. Now a third filter is put between them, its axis at ${p.a}° to that of the first. Unpolarized light of intensity ${q(p.I0, 'W/m²')} falls on the first filter. What is the intensity after the middle filter, and after the last?`, `Zwei Polarisationsfilter sind gekreuzt (ihre Achsen bilden 90°): Es kommt kein Licht durch. Nun wird ein drittes Filter dazwischen gestellt, seine Achse unter ${p.a}° zu der des ersten. Unpolarisiertes Licht der Intensität ${q(p.I0, 'W/m²')} fällt auf das erste Filter. Wie gross ist die Intensität nach dem mittleren Filter und nach dem letzten?`),
    hints: () => [HALF(), MALUS(), L('The last filter is at 90° to the first, so at 90° − θ to the middle one.', 'Das letzte Filter steht unter 90° zum ersten, also unter 90° − θ zum mittleren.')],
    steps: (p, v) => [
      step(L('The first filter', 'Das erste Filter'), p$(HALF()) + `$$I_1 = \\tfrac12\\,I_0 = ${tq(p.I0 / 2, 'W/m²')}$$`),
      step(L('The middle filter', 'Das mittlere Filter'), p$(MALUS()) + `$$I_2 = I_1\\cos^2(${p.a}^\\circ) = ${res(tq(v.I2, 'W/m²'))}$$`),
      step(L('The last filter', 'Das letzte Filter'), p$(L(`The light is now polarized at ${p.a}°; the last filter is at 90°, so at ${90 - p.a}° to it:`, `Das Licht ist jetzt unter ${p.a}° polarisiert; das letzte Filter steht unter 90°, also unter ${90 - p.a}° dazu:`)) +
        `$$I_3 = I_2\\cos^2(${90 - p.a}^\\circ) = ${res(tq(v.I3, 'W/m²'))}$$` + p$(L('A filter put between crossed ones lets light through: it turns the polarization in two steps. (Most at θ = 45°: one eighth of I₀.)', 'Ein Filter zwischen gekreuzten lässt Licht durch: Es dreht die Polarisation in zwei Schritten. (Am meisten bei θ = 45°: ein Achtel von I₀.)'))),
    ],
    figure: (p) => Fg().polarizers({ angles: [0, p.a, 90], unpol: true, names: ['I₀', 'I₁', 'I₂', 'I₃'], labels: ['0°', `${p.a}°`, '90°'] }),
  };

  // ================================================================ 7 antennas and standing waves
  const ANT = [
    { en: 'FM radio at', de: 'UKW-Radio auf', f: [88.4e6, 94.6e6, 99.5e6, 102.8e6, 106.3e6] },
    { en: 'citizens band (CB) radio at', de: 'CB-Funk auf', f: [27e6] },
    { en: 'the radio of an aircraft at', de: 'den Flugfunk auf', f: [118e6, 121.5e6, 128e6, 135e6] },
    { en: 'digital television at', de: 'digitales Fernsehen auf', f: [490e6, 570e6, 650e6, 730e6] },
    { en: 'a mobile phone network at', de: 'ein Mobilfunknetz auf', f: [800e6, 900e6, 1800e6] },
    { en: 'Wi-Fi at', de: 'WLAN auf', f: [2.44e9, 5.5e9] },
  ];
  const dipole = {
    id: 'dipole', difficulty: 2,
    title: (p) => (p.kind === 'half' ? L('A dipole antenna', 'Eine Dipolantenne') : L('A rod antenna', 'Eine Stabantenne')),
    make: (r) => { const s = Math.floor(r() * ANT.length); return { s, f: pick(r, ANT[s].f), kind: r() < 0.55 ? 'half' : 'quarter' }; },
    solve: (p, o = {}) => { const lam = C / p.f; return { lam, l: o.full ? lam : o.other ? (p.kind === 'half' ? lam / 4 : lam / 2) : p.kind === 'half' ? lam / 2 : lam / 4 }; },
    traps: ['full', 'other'],
    why: { full: () => L('That is a whole wavelength. The current in the rod forms a standing wave with a node at each free end: the shortest one is half a wavelength long.', 'Das ist eine ganze Wellenlänge. Der Strom im Stab bildet eine stehende Welle mit einem Knoten an jedem freien Ende: Die kürzeste ist eine halbe Wellenlänge lang.'), other: () => L('A dipole (two rods, fed in the middle) is λ/2 long; a single rod over a conducting ground is λ/4 long, its mirror image making up the other half.', 'Ein Dipol (zwei Stäbe, in der Mitte gespeist) ist λ/2 lang; ein einzelner Stab über einem leitenden Boden ist λ/4 lang, sein Spiegelbild ergänzt die andere Hälfte.') },
    fields: (p, v) => [num$('lam', '\\lambda', lengthUnit(v.lam), L('wavelength', 'Wellenlänge')), num$('l', '\\ell', v.l >= 1 ? 'm' : 'cm', L('length of the antenna', 'Länge der Antenne'))],
    text: (p) => {
      const s = ANT[p.s];
      return p.kind === 'half'
        ? L(`A dipole antenna (two rods in a line, fed in the middle) works best when it is half a wavelength long in all. How long should a dipole for ${s.en} ${q(p.f, freqUnit(p.f))} be? What is the wavelength?`, `Eine Dipolantenne (zwei Stäbe in einer Linie, in der Mitte gespeist) funktioniert am besten, wenn sie insgesamt eine halbe Wellenlänge lang ist. Wie lang sollte ein Dipol für ${s.de} ${q(p.f, freqUnit(p.f))} sein? Wie gross ist die Wellenlänge?`)
        : L(`A single rod antenna over a conducting surface (a car roof, the ground) works best when it is a quarter of a wavelength long: its mirror image in the surface makes up the other half of a dipole. How long should such a rod for ${s.en} ${q(p.f, freqUnit(p.f))} be? What is the wavelength?`, `Eine einzelne Stabantenne über einer leitenden Fläche (einem Autodach, dem Boden) funktioniert am besten, wenn sie eine Viertelwellenlänge lang ist: Ihr Spiegelbild in der Fläche ergänzt die andere Hälfte eines Dipols. Wie lang sollte ein solcher Stab für ${s.de} ${q(p.f, freqUnit(p.f))} sein? Wie gross ist die Wellenlänge?`);
    },
    hints: () => [L('$\\lambda = c/f$.', '$\\lambda = c/f$.'), L('Then take half or a quarter of it, as the antenna needs.', 'Dann nimm die Hälfte oder einen Viertel davon, wie es die Antenne braucht.')],
    steps: (p, v) => [
      step(L('The wavelength', 'Die Wellenlänge'), `$$\\lambda = \\frac{c}{f} = \\frac{${cT}}{${tq(p.f, 'Hz')}} = ${res(tq(v.lam, lengthUnit(v.lam)))}$$`),
      step(L('The length', 'Die Länge'), p$(L('The current in the antenna oscillates as a standing wave: zero at the free ends, largest at the feed in the middle.', 'Der Strom in der Antenne schwingt als stehende Welle: null an den freien Enden, am grössten bei der Einspeisung in der Mitte.')) +
        `$$\\ell = ${p.kind === 'half' ? '\\frac{\\lambda}{2}' : '\\frac{\\lambda}{4}'} = ${res(tq(v.l, v.l >= 1 ? 'm' : 'cm'))}$$`),
    ],
    figure: (p, v, view) => (view.task ? '' : Fg().dipole()),
  };

  // a standing wave in front of a metal plate: neighbouring minima λ/2 apart
  const standing = {
    id: 'standing', difficulty: 3,
    title: () => L('A standing microwave', 'Eine stehende Mikrowelle'),
    make: (r) => { const lam = pick(r, [2.6, 2.8, 2.9, 3, 3.2, 3.4, 3.6]) / 100, m = pick(r, [3, 4, 5, 6]); return { m, d: Math.round(((m - 1) * lam * 1000) / 2) / 1000 }; },
    solve: (p, o = {}) => { const lam = o.halfS ? p.d / (p.m - 1) : o.count ? (2 * p.d) / p.m : (2 * p.d) / (p.m - 1); return { lam, f: C / lam }; },
    traps: ['halfS', 'count'],
    why: { halfS: () => L('Neighbouring minima of a standing wave are half a wavelength apart, not a whole one.', 'Benachbarte Minima einer stehenden Welle sind eine halbe Wellenlänge voneinander entfernt, nicht eine ganze.'), count: () => L('Count the gaps, not the minima: between the first and the last of the minima lie one gap fewer than there are minima.', 'Zähle die Abstände, nicht die Minima: Zwischen dem ersten und dem letzten Minimum liegt ein Abstand weniger, als es Minima sind.') },
    fields: () => [num$('lam', '\\lambda', 'cm', L('wavelength', 'Wellenlänge')), num$('f', 'f', 'GHz', L('frequency', 'Frequenz'))],
    text: (p) => L(`A microwave transmitter is aimed at a metal plate, which reflects the waves. A detector moved along the beam finds a standing wave: between the first and the last of ${p.m} neighbouring minima it moves ${q(p.d, 'cm')}. What are the wavelength and the frequency of the microwaves?`, `Ein Mikrowellensender ist auf eine Metallplatte gerichtet, die die Wellen reflektiert. Ein Detektor, der längs des Strahls verschoben wird, findet eine stehende Welle: Zwischen dem ersten und dem letzten von ${p.m} benachbarten Minima wird er um ${q(p.d, 'cm')} verschoben. Wie gross sind die Wellenlänge und die Frequenz der Mikrowellen?`),
    hints: () => [L('The incoming and the reflected wave form a standing wave; neighbouring minima (nodes) are $\\lambda/2$ apart.', 'Die einlaufende und die reflektierte Welle bilden eine stehende Welle; benachbarte Minima (Knoten) sind $\\lambda/2$ voneinander entfernt.'), L('Count the gaps between the minima.', 'Zähle die Abstände zwischen den Minima.'), L('$f = c/\\lambda$.', '$f = c/\\lambda$.')],
    steps: (p, v) => [
      step(L('The wavelength', 'Die Wellenlänge'), p$(L(`Neighbouring minima are $\\lambda/2$ apart. Between the first and the last of ${p.m} minima lie ${p.m - 1} gaps:`, `Benachbarte Minima sind $\\lambda/2$ voneinander entfernt. Zwischen dem ersten und dem letzten von ${p.m} Minima liegen ${p.m - 1} Abstände:`)) +
        `$$${p.m - 1}\\cdot\\frac{\\lambda}{2} = d \\quad\\Rightarrow\\quad \\lambda = \\frac{2d}{${p.m - 1}} = \\frac{2\\cdot ${tq(p.d, 'cm')}}{${p.m - 1}} = ${res(tq(v.lam, 'cm'))}$$`),
      step(L('The frequency', 'Die Frequenz'), `$$f = \\frac{c}{\\lambda} = \\frac{${cT}}{${tq(v.lam, 'm')}} = ${res(tq(v.f, 'GHz'))}$$` + p$(L('So Heinrich Hertz measured the wavelength of his waves in 1888, and with the frequency of his circuit found their speed: that of light.', 'So mass Heinrich Hertz 1888 die Wellenlänge seiner Wellen und fand mit der Frequenz seines Schwingkreises ihre Geschwindigkeit: die des Lichts.'))),
    ],
    figure: (p) => Fg().standing(p.m),
  };

  // ================================================================ 8 concepts
  // [question, right, [wrong, why, flag] × 3], each { en, de } as [en, de]
  const CONCEPTS = [
    [['Do electromagnetic waves need a medium to travel through?', 'Brauchen elektromagnetische Wellen ein Medium, um sich auszubreiten?'],
      ['No: they travel through empty space too, as sunlight does.', 'Nein: Sie breiten sich auch im leeren Raum aus, wie das Sonnenlicht.'],
      [[['Yes, air.', 'Ja, Luft.'], ['Sunlight crosses the empty space between the Sun and the Earth.', 'Das Sonnenlicht durchquert den leeren Raum zwischen Sonne und Erde.'], 'vacuum'],
        [['Yes, a special substance, the ether.', 'Ja, einen besonderen Stoff, den Äther.'], ['The ether was searched for in the 19th century, and never found: the fields themselves are the wave.', 'Der Äther wurde im 19. Jahrhundert gesucht und nie gefunden: Die Felder selbst sind die Welle.'], 'vacuum'],
        [['Only the long waves (radio); light does not.', 'Nur die langen Wellen (Radio); Licht nicht.'], ['Radio signals from space probes reach us through empty space too.', 'Auch Funksignale von Raumsonden erreichen uns durch den leeren Raum.'], 'vacuum']]],
    [['How fast do radio waves travel in vacuum, compared with light?', 'Wie schnell breiten sich Radiowellen im Vakuum aus, verglichen mit Licht?'],
      ['Just as fast: all electromagnetic waves travel at c in vacuum.', 'Gleich schnell: Alle elektromagnetischen Wellen laufen im Vakuum mit c.'],
      [[['Slower, because their frequency is lower.', 'Langsamer, weil ihre Frequenz kleiner ist.'], ['A lower frequency means a longer wavelength, not a lower speed: c = λ·f.', 'Eine kleinere Frequenz bedeutet eine grössere Wellenlänge, nicht eine kleinere Geschwindigkeit: c = λ·f.'], 'speed'],
        [['Faster, because their wavelength is longer.', 'Schneller, weil ihre Wellenlänge grösser ist.'], ['The wavelength is longer, the frequency lower in proportion: c = λ·f stays the same.', 'Die Wellenlänge ist grösser, die Frequenz im selben Mass kleiner: c = λ·f bleibt gleich.'], 'speed'],
        [['At the speed of sound, as they carry sound.', 'Mit Schallgeschwindigkeit, weil sie Schall übertragen.'], ['The radio wave only carries the signal; it is an electromagnetic wave and travels at c.', 'Die Radiowelle trägt nur das Signal; sie ist eine elektromagnetische Welle und läuft mit c.'], 'speed']]],
    [['A vertical dipole antenna transmits. In which direction does it send out nothing?', 'Eine senkrechte Dipolantenne sendet. In welche Richtung strahlt sie nichts ab?'],
      ['Straight up and straight down, along the rod.', 'Senkrecht nach oben und unten, längs des Stabs.'],
      [[['Horizontally, across the rod.', 'Waagrecht, quer zum Stab.'], ['Across the rod it radiates most: the charges oscillate up and down, and their field spreads sideways.', 'Quer zum Stab strahlt sie am meisten ab: Die Ladungen schwingen auf und ab, und ihr Feld breitet sich seitwärts aus.'], 'dipole'],
        [['None: it radiates evenly in all directions.', 'Keine: Sie strahlt gleichmässig in alle Richtungen.'], ['A dipole is no point source: along its axis the oscillating charges send out no wave.', 'Ein Dipol ist keine punktförmige Quelle: Längs seiner Achse senden die schwingenden Ladungen keine Welle aus.'], 'dipole'],
        [['Only backwards, away from the receiver.', 'Nur nach hinten, vom Empfänger weg.'], ['A single dipole has no front and back: it radiates the same in every horizontal direction.', 'Ein einzelner Dipol hat kein Vorn und Hinten: Er strahlt in jede waagrechte Richtung gleich.'], 'dipole']]],
    [['A vertical dipole antenna transmits. How should a rod antenna be held to receive it best?', 'Eine senkrechte Dipolantenne sendet. Wie hält man eine Stabantenne, um sie am besten zu empfangen?'],
      ['Vertically, parallel to the transmitting rod.', 'Senkrecht, parallel zum Sendestab.'],
      [[['Horizontally, pointing at the transmitter.', 'Waagrecht, auf den Sender zeigend.'], ['The electric field of the wave is vertical, like the transmitting rod: it drives the charges along a vertical rod.', 'Das elektrische Feld der Welle ist senkrecht, wie der Sendestab: Es treibt die Ladungen längs eines senkrechten Stabs an.'], 'pol'],
        [['Horizontally, across the line to the transmitter.', 'Waagrecht, quer zur Linie zum Sender.'], ['The wave is polarized vertically; a horizontal rod is perpendicular to its electric field.', 'Die Welle ist senkrecht polarisiert; ein waagrechter Stab steht senkrecht zu ihrem elektrischen Feld.'], 'pol'],
        [['It makes no difference.', 'Das macht keinen Unterschied.'], ['The wave of a dipole is polarized: only the part of the rod along its electric field counts.', 'Die Welle eines Dipols ist polarisiert: Nur der Teil des Stabs längs ihres elektrischen Felds zählt.'], 'pol']]],
    [['How are the electric and the magnetic field of a travelling electromagnetic wave related?', 'Wie hängen das elektrische und das magnetische Feld einer fortschreitenden elektromagnetischen Welle zusammen?'],
      ['They are perpendicular to each other and to the direction of travel, and in phase.', 'Sie stehen senkrecht aufeinander und auf der Ausbreitungsrichtung, und sie sind in Phase.'],
      [[['They are perpendicular to each other, and B is largest where E is zero.', 'Sie stehen senkrecht aufeinander, und B ist am grössten, wo E null ist.'], ['That is the LC circuit, where current and voltage are a quarter of a period apart. In the wave, E = c·B everywhere.', 'Das ist der Schwingkreis, wo Strom und Spannung um eine Viertelperiode verschoben sind. In der Welle gilt überall E = c·B.'], 'phase'],
        [['They point the same way, along the direction of travel.', 'Sie zeigen in dieselbe Richtung, längs der Ausbreitung.'], ['The wave is transverse: both fields are perpendicular to the direction of travel.', 'Die Welle ist transversal: Beide Felder stehen senkrecht zur Ausbreitungsrichtung.'], 'transverse'],
        [['They are equal in size: E = B.', 'Sie sind gleich gross: E = B.'], ['They have different units; E = c·B.', 'Sie haben verschiedene Einheiten; E = c·B.'], 'ratio']]],
    [['Light goes from air into water. What happens to its frequency and wavelength?', 'Licht geht von Luft in Wasser. Was passiert mit seiner Frequenz und seiner Wellenlänge?'],
      ['The frequency stays, the wavelength gets shorter.', 'Die Frequenz bleibt, die Wellenlänge wird kürzer.'],
      [[['The wavelength stays, the frequency gets lower.', 'Die Wellenlänge bleibt, die Frequenz wird kleiner.'], ['At the border, each crest arriving makes one crest in the water: the frequency cannot change.', 'An der Grenze erzeugt jeder ankommende Wellenberg einen Wellenberg im Wasser: Die Frequenz kann sich nicht ändern.'], 'same'],
        [['Both stay the same.', 'Beide bleiben gleich.'], ['Light is slower in water, v = c/n; at the same frequency, λ = v/f is shorter.', 'Licht ist im Wasser langsamer, v = c/n; bei gleicher Frequenz ist λ = v/f kürzer.'], 'same'],
        [['The frequency stays, the wavelength gets longer.', 'Die Frequenz bleibt, die Wellenlänge wird länger.'], ['Light is slower in water; so its waves get shorter, not longer.', 'Licht ist im Wasser langsamer; also werden seine Wellen kürzer, nicht länger.'], 'mult']]],
    [['Unpolarized light falls on a polarizing filter. What share of its intensity gets through?', 'Unpolarisiertes Licht fällt auf ein Polarisationsfilter. Welcher Anteil seiner Intensität kommt durch?'],
      ['One half.', 'Die Hälfte.'],
      [[['All of it.', 'Alles.'], ['The filter lets through only the part of the field along its axis.', 'Das Filter lässt nur den Teil des Felds längs seiner Achse durch.'], 'nohalfP'],
        [['Nothing.', 'Nichts.'], ['Nothing would pass only if all the light were polarized across the axis; unpolarized light has all directions.', 'Nichts käme nur durch, wenn alles Licht quer zur Achse polarisiert wäre; unpolarisiertes Licht hat alle Richtungen.'], 'nohalfP'],
        [['It depends on how the filter is turned.', 'Das hängt davon ab, wie das Filter gedreht ist.'], ['Unpolarized light has no preferred direction: every turn of the filter lets through half.', 'Unpolarisiertes Licht hat keine bevorzugte Richtung: Jede Stellung des Filters lässt die Hälfte durch.'], 'nohalfP']]],
    [['Sound waves cannot be polarized, light waves can. Why?', 'Schallwellen lassen sich nicht polarisieren, Lichtwellen schon. Warum?'],
      ['Light is a transverse wave, sound in air a longitudinal one.', 'Licht ist eine Transversalwelle, Schall in Luft eine Longitudinalwelle.'],
      [[['Light is faster than sound.', 'Licht ist schneller als Schall.'], ['Speed has nothing to do with it: only a transverse wave has a direction across its travel.', 'Die Geschwindigkeit hat nichts damit zu tun: Nur eine Transversalwelle hat eine Richtung quer zur Ausbreitung.'], 'transverse'],
        [['Light has a shorter wavelength than sound.', 'Licht hat eine kürzere Wellenlänge als Schall.'], ['Radio waves metres long can be polarized too: it is their transverse fields that count.', 'Auch meterlange Radiowellen lassen sich polarisieren: Es zählen ihre transversalen Felder.'], 'transverse'],
        [['Sound needs a medium, light does not.', 'Schall braucht ein Medium, Licht nicht.'], ['True, but not the reason: a transverse wave on a rope (in a medium) can be polarized too.', 'Stimmt, ist aber nicht der Grund: Auch eine Transversalwelle auf einem Seil (in einem Medium) lässt sich polarisieren.'], 'transverse']]],
    [['In an LC circuit, the capacitor is fully charged at one moment. What is the current at that moment?', 'In einem Schwingkreis ist der Kondensator in einem Moment voll geladen. Wie gross ist der Strom in diesem Moment?'],
      ['Zero: the energy is all in the capacitor.', 'Null: Die Energie steckt ganz im Kondensator.'],
      [[['Largest, as the voltage is largest.', 'Am grössten, weil die Spannung am grössten ist.'], ['The current reverses at this moment: it is zero. It is largest a quarter of a period later, when the capacitor is empty.', 'Der Strom kehrt in diesem Moment um: Er ist null. Am grössten ist er eine Viertelperiode später, wenn der Kondensator leer ist.'], 'lcphase'],
        [['Half its largest value.', 'Die Hälfte seines grössten Werts.'], ['All the energy is in the capacitor: none is left for the magnetic field of a current.', 'Alle Energie steckt im Kondensator: Für das Magnetfeld eines Stroms bleibt keine.'], 'lcphase'],
        [['It depends on the inductance.', 'Das hängt von der Induktivität ab.'], ['Whatever L is, the current is zero when the charge is largest.', 'Was immer L ist, der Strom ist null, wenn die Ladung am grössten ist.'], 'lcphase']]],
    [['You move twice as far away from a small lamp. What happens to the intensity of its light?', 'Du gehst doppelt so weit von einer kleinen Lampe weg. Was passiert mit der Intensität ihres Lichts?'],
      ['It drops to a quarter.', 'Sie sinkt auf einen Viertel.'],
      [[['It drops to a half.', 'Sie sinkt auf die Hälfte.'], ['The light spreads over a sphere, whose area grows with r²: twice the distance, four times the area.', 'Das Licht verteilt sich auf eine Kugel, deren Fläche mit r² wächst: doppelter Abstand, vierfache Fläche.'], 'linR'],
        [['It stays the same; only the field gets weaker.', 'Sie bleibt gleich; nur das Feld wird schwächer.'], ['The intensity goes with the square of the field: both get weaker.', 'Die Intensität geht mit dem Quadrat des Felds: Beide werden schwächer.'], 'linR'],
        [['It drops to an eighth.', 'Sie sinkt auf einen Achtel.'], ['The area of a sphere grows with r², not r³.', 'Die Fläche einer Kugel wächst mit r², nicht mit r³.'], 'linR']]],
    [['Which charges send out electromagnetic waves?', 'Welche Ladungen senden elektromagnetische Wellen aus?'],
      ['Accelerated charges, e.g. charges oscillating in an antenna.', 'Beschleunigte Ladungen, z.B. Ladungen, die in einer Antenne schwingen.'],
      [[['Any charge, even one at rest.', 'Jede Ladung, auch eine ruhende.'], ['A charge at rest has a static electric field, which carries no energy away.', 'Eine ruhende Ladung hat ein statisches elektrisches Feld, das keine Energie wegträgt.'], 'source'],
        [['Charges moving at constant speed.', 'Ladungen, die sich mit konstanter Geschwindigkeit bewegen.'], ['A steady current makes a steady magnetic field, but no wave: the charges must be accelerated.', 'Ein gleichbleibender Strom erzeugt ein gleichbleibendes Magnetfeld, aber keine Welle: Die Ladungen müssen beschleunigt werden.'], 'source'],
        [['Only negative charges.', 'Nur negative Ladungen.'], ['Any accelerated charge radiates, positive or negative.', 'Jede beschleunigte Ladung strahlt, positiv oder negativ.'], 'source']]],
    [['In a microwave oven without its turntable, chocolate melts in spots. How far apart are neighbouring spots?', 'In einem Mikrowellenofen ohne Drehteller schmilzt Schokolade an einzelnen Stellen. Wie weit sind benachbarte Stellen voneinander entfernt?'],
      ['Half a wavelength: the antinodes of a standing wave.', 'Eine halbe Wellenlänge: die Bäuche einer stehenden Welle.'],
      [[['One wavelength.', 'Eine Wellenlänge.'], ['Neighbouring antinodes of a standing wave are λ/2 apart.', 'Benachbarte Bäuche einer stehenden Welle sind λ/2 voneinander entfernt.'], 'halfS'],
        [['A quarter of a wavelength.', 'Eine Viertelwellenlänge.'], ['λ/4 lies between a node and the next antinode; from antinode to antinode it is λ/2.', 'λ/4 liegt zwischen einem Knoten und dem nächsten Bauch; von Bauch zu Bauch sind es λ/2.'], 'halfS'],
        [['It depends on the power of the oven.', 'Das hängt von der Leistung des Ofens ab.'], ['The power changes how fast it melts, not where: that is set by the wavelength.', 'Die Leistung ändert, wie schnell sie schmilzt, nicht wo: Das legt die Wellenlänge fest.'], 'halfS']]],
  ];
  const concept = {
    id: 'concept', difficulty: 2,
    title: () => L('Understood?', 'Verstanden?'),
    make: (r) => ({ k: Math.floor(r() * CONCEPTS.length), o: Math.floor(r() * 4) }),
    solve: () => ({ ans: 'right' }),
    traps: [],
    fields: (p) => {
      const [, right, wrong] = CONCEPTS[p.k], tr = (x) => L(x[0], x[1]);
      const opts = wrong.map((w, i) => [`w${i}`, tr(w[0]), tr(w[1]), w[2]]);
      opts.splice(p.o, 0, ['right', tr(right), '', null]);
      return [choice('ans', L('Your answer:', 'Deine Antwort:'), opts, { stack: true, ask: L(CONCEPTS[p.k][0][0], CONCEPTS[p.k][0][1]) })];
    },
    text: (p) => L(CONCEPTS[p.k][0][0], CONCEPTS[p.k][0][1]),
    hints: (p) => [L('Think of what the fields of the wave do, and what is the same for all electromagnetic waves.', 'Denk daran, was die Felder der Welle tun, und was für alle elektromagnetischen Wellen gleich ist.')],
    steps: (p) => [step(L('The answer', 'Die Antwort'), p$(`<span class="result">${L(CONCEPTS[p.k][1][0], CONCEPTS[p.k][1][1])}</span>`))],
    figure: () => '',
  };

  const SCENARIOS = [specLf, specFl, specEcho, medium, mediumBack, lcF, lcScale, lcC, lcEnergy, ebDir, ebRatio, ebPhase, point, invSq, beam, ebInt, malus, malusAngle, malusThree, dipole, standing, concept];

  root.Scenarios = { SCENARIOS, SOURCES, REG, ORDER, MATS, CONCEPTS, DIRS, cross, keyOf, thomson, ehat };
  if (typeof module !== 'undefined') module.exports = root.Scenarios;
})(typeof window !== 'undefined' ? window : globalThis);
