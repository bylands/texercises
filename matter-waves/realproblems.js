// Problems: matter waves in experiments, technology and nature, told as stories: why a football is
// not diffracted by the goal, the Davisson–Germer experiment, the scanning electron microscope,
// neutrons diffracted by a crystal, the scanning tunnelling microscope and alpha decay.
//   PROBLEMS[i]  { id, difficulty, title(), make(r) }; realOf(i, seed) the exercise (app.js)
(function (root) {
  'use strict';

  const M = root.MatterWave || require('./physics.js');
  const G = root.MatterPlot || require('./plot.js');
  const X = root.MatterEx || require('./exercises.js');
  const Lang = root.Lang || require('./lang.js');
  const L = (en, de) => Lang.L(en, de);
  const { plain, sci } = M;
  const { i, sb, CONST, numQ, choice, opts, fig, WHY, powUnit, len } = X;
  const lam = i('λ'), p = i('p'), m = i('m'), v = i('v'), h = i('h'), U = i('U'), d = i('d'), kap = i('κ'), Ek = `${i('E')}${sb('kin')}`;
  const deg = (x) => (x * 180) / Math.PI;

  // ---------------------------------------------------------------- a football
  const football = {
    id: 'football', difficulty: 1, title: () => L('A football through the goal', 'Ein Fussball durchs Tor'),
    make(r) {
      const vv = r.pick([20, 25, 30]), mm = 0.43, goal = 7.32, lm = M.h / (mm * vv), ratio = goal / lm, vSlow = M.h / (mm * goal);
      const [lv, lu, ls] = powUnit(lm, 'm'), [rv, ru, rs] = powUnit(ratio, ''), [sv, su, ss] = powUnit(vSlow, 'm/s');
      return {
        text: `<p>${L(`A football (${mm * 1000} g) flies at ${vv} m/s into the goal, which is ${goal} m wide. Light through a gap that wide would hardly be diffracted; waves are bent noticeably only by openings not much wider than their wavelength.`, `Ein Fussball (${mm * 1000} g) fliegt mit ${vv} m/s ins Tor, das ${goal} m breit ist. Licht würde durch eine so breite Öffnung kaum gebeugt; Wellen werden nur von Öffnungen merklich gebeugt, die nicht viel breiter sind als ihre Wellenlänge.`)}</p>${CONST('h')}`,
        figs: '',
        questions: [
          numQ('lam', L('(a) the de Broglie wavelength of the ball', '(a) die de-Broglie-Wellenlänge des Balls'), lam, lu, lv, { scale: ls, wrong: [{ value: M.h / (0.43e3 * vv) / ls, tag: 'units', why: L('The mass in kilograms: 430 g = 0.43 kg.', 'Die Masse in Kilogramm: 430 g = 0.43 kg.') }] }),
          numQ('ratio', L('(b) how many wavelengths fit into the width of the goal', '(b) wie viele Wellenlängen in die Breite des Tors passen'), i('n'), ru, rv, { scale: rs }),
          numQ('slow', L('(c) how slowly the ball would have to roll for its wavelength to equal the width of the goal', '(c) wie langsam der Ball rollen müsste, damit seine Wellenlänge gleich der Breite des Tors ist'), v, su, sv, { scale: ss }),
        ],
        hints: [L(`${lam} = ${h}/(${m}·${v}), with the mass in kilograms.`, `${lam} = ${h}/(${m}·${v}), mit der Masse in Kilogramm.`), L('Divide the width of the goal by the wavelength.', 'Teile die Breite des Tors durch die Wellenlänge.'), L(`For ${lam} = ${goal} m: ${v} = ${h}/(${m}·${lam}).`, `Für ${lam} = ${goal} m: ${v} = ${h}/(${m}·${lam}).`)],
        solution: [
          L(`(a) ${lam} = ${h}/(${m}·${v}) = 6.626 · 10<sup>−34</sup> J·s / (${mm} kg · ${vv} m/s) = <b>${sci(lm)} m</b>.`, `(a) ${lam} = ${h}/(${m}·${v}) = 6.626 · 10<sup>−34</sup> J·s / (${mm} kg · ${vv} m/s) = <b>${sci(lm)} m</b>.`),
          L(`(b) ${goal} m / ${sci(lm)} m = <b>${sci(ratio)}</b> wavelengths: the ball is not diffracted in the slightest.`, `(b) ${goal} m / ${sci(lm)} m = <b>${sci(ratio)}</b> Wellenlängen: Der Ball wird nicht im Geringsten gebeugt.`),
          L(`(c) ${v} = ${h}/(${m}·${lam}) = 6.626 · 10<sup>−34</sup> J·s / (${mm} kg · ${goal} m) = <b>${sci(vSlow)} m/s</b>. To cross the goal line it would need about ${sci(0.22 / vSlow, 1)} s, far longer than the age of the universe (4 · 10<sup>17</sup> s). For everyday things, the wave nature never shows.`, `(c) ${v} = ${h}/(${m}·${lam}) = 6.626 · 10<sup>−34</sup> J·s / (${mm} kg · ${goal} m) = <b>${sci(vSlow)} m/s</b>. Um die Torlinie zu überqueren, bräuchte er etwa ${sci(0.22 / vSlow, 1)} s, viel länger als das Alter des Universums (4 · 10<sup>17</sup> s). Bei Alltagsdingen zeigt sich die Wellennatur nie.`),
        ],
      };
    },
  };

  // ---------------------------------------------------------------- Davisson and Germer
  const davisson = {
    id: 'davisson', difficulty: 2, title: () => L('Davisson and Germer, 1927', 'Davisson und Germer, 1927'),
    make(r) {
      const Uv = r.pick([40, 48, 54, 65]), D = 0.215e-9, lm = M.lambdaU(Uv), phi = deg(Math.asin(lm / D));
      return {
        text: `<p>${L(`Davisson and Germer shot electrons accelerated through ${U} = ${Uv} V onto a nickel crystal and counted the electrons scattered back at the angle φ. The atoms on the surface stand in rows ${d} = 0.215 nm apart; like a reflection grating, they send many electrons in the direction where ${d}·sin φ = ${lam}.`, `Davisson und Germer schossen Elektronen, die mit ${U} = ${Uv} V beschleunigt wurden, auf einen Nickelkristall und zählten die unter dem Winkel φ zurückgestreuten Elektronen. Die Atome an der Oberfläche stehen in Reihen im Abstand ${d} = 0.215 nm; wie ein Reflexionsgitter schicken sie viele Elektronen in die Richtung, in der ${d}·sin φ = ${lam} gilt.`)}</p>${CONST('h', 'e', 'me')}`,
        figs: '',
        questions: [
          numQ('lam', L('(a) the wavelength of the electrons', '(a) die Wellenlänge der Elektronen'), lam, 'nm', lm * 1e9, { wrong: [{ value: (M.h * M.c) / (Uv * M.e) * 1e9, tag: 'photonp', why: WHY.photonp() }] }),
          numQ('phi', L('(b) the angle of the strongest scattering', '(b) der Winkel der stärksten Streuung'), 'φ', '°', phi, { tol: 0.012 }),
          choice('up', L('(c) The voltage is raised. The maximum moves', '(c) Die Spannung wird erhöht. Das Maximum rückt'), opts(r, [
            [L('to smaller angles', 'zu kleineren Winkeln'), true],
            [L('to larger angles', 'zu grösseren Winkeln'), false, L('Faster electrons have a shorter wavelength: sin φ = λ/d gets smaller.', 'Schnellere Elektronen haben eine kürzere Wellenlänge: sin φ = λ/d wird kleiner.'), 'inverse'],
            [L('nowhere: it is fixed by the crystal', 'nirgends hin: Es ist durch den Kristall festgelegt'), false, L('The angle depends on the crystal and on the wavelength of the electrons.', 'Der Winkel hängt vom Kristall und von der Wellenlänge der Elektronen ab.'), 'other'],
          ])),
        ],
        hints: [L(`${lam} = ${h}/√(2·${m}·${i('e')}·${U}).`, `${lam} = ${h}/√(2·${m}·${i('e')}·${U}).`), L(`sin φ = ${lam}/${d}.`, `sin φ = ${lam}/${d}.`)],
        solution: [
          L(`(a) ${lam} = ${h}/√(2·${m}·${i('e')}·${U}) = 6.626 · 10<sup>−34</sup> J·s / √(2 · 9.109 · 10<sup>−31</sup> kg · 1.602 · 10<sup>−19</sup> C · ${Uv} V) = <b>${plain(lm * 1e9)} nm</b>.`, `(a) ${lam} = ${h}/√(2·${m}·${i('e')}·${U}) = 6.626 · 10<sup>−34</sup> J·s / √(2 · 9.109 · 10<sup>−31</sup> kg · 1.602 · 10<sup>−19</sup> C · ${Uv} V) = <b>${plain(lm * 1e9)} nm</b>.`),
          L(`(b) sin φ = ${plain(lm * 1e9)} nm / 0.215 nm = ${plain(lm / D)}, φ = <b>${plain(phi)}°</b>. At 54 V, Davisson and Germer found the maximum at 50°: the first proof that electrons are waves.`, `(b) sin φ = ${plain(lm * 1e9)} nm / 0.215 nm = ${plain(lm / D)}, φ = <b>${plain(phi)}°</b>. Bei 54 V fanden Davisson und Germer das Maximum bei 50°: der erste Beweis, dass Elektronen Wellen sind.`),
          L('(c) A higher voltage gives a shorter wavelength: the maximum moves <b>to smaller angles</b>.', '(c) Eine höhere Spannung ergibt eine kürzere Wellenlänge: Das Maximum rückt <b>zu kleineren Winkeln</b>.'),
        ],
      };
    },
  };

  // ---------------------------------------------------------------- an electron microscope
  const sem = {
    id: 'sem', difficulty: 2, title: () => L('The electron microscope', 'Das Elektronenmikroskop'),
    make(r) {
      const Uk = r.pick([5, 10, 20, 30]), lm = M.lambdaU(Uk * 1e3), ratio = 550e-9 / lm;
      const [rv, ru, rs] = powUnit(ratio, '');
      return {
        text: `<p>${L(`A light microscope cannot show details much smaller than the wavelength of light, about 550 nm. A scanning electron microscope uses electrons accelerated through ${U} = ${Uk} kV instead. (Relativity changes the wavelength by at most 1.5 % here; neglect it.)`, `Ein Lichtmikroskop kann keine Details zeigen, die viel kleiner sind als die Wellenlänge des Lichts, etwa 550 nm. Ein Rasterelektronenmikroskop verwendet stattdessen Elektronen, die mit ${U} = ${Uk} kV beschleunigt werden. (Die Relativitätstheorie ändert die Wellenlänge hier um höchstens 1.5 %; vernachlässige das.)`)}</p>${CONST('h', 'e', 'me')}`,
        figs: '',
        questions: [
          numQ('lam', L('(a) the wavelength of the electrons', '(a) die Wellenlänge der Elektronen'), lam, 'pm', lm * 1e12, { wrong: [{ value: (M.h * M.c) / (Uk * 1e3 * M.e) * 1e12, tag: 'photonp', why: WHY.photonp() }] }),
          numQ('ratio', L('(b) how many times shorter than 550 nm', '(b) wie viele Male kürzer als 550 nm'), `${lam}${sb(L('light', 'Licht'))}/${lam}`, ru, rv, { scale: rs }),
          choice('half', L('(c) To make the wavelength half as long, the voltage must be made', '(c) Um die Wellenlänge halb so lang zu machen, muss man die Spannung'), opts(r, [
            [L('four times as large', 'viermal so gross machen'), true],
            [L('twice as large', 'doppelt so gross machen'), false, WHY.sqrt(), 'sqrt'],
            [L('half as large', 'halb so gross machen'), false, L('A lower voltage gives slower electrons with a longer wavelength.', 'Eine kleinere Spannung ergibt langsamere Elektronen mit einer längeren Wellenlänge.'), 'inverse'],
          ])),
        ],
        hints: [L(`${lam} = ${h}/√(2·${m}·${i('e')}·${U}), with ${U} in volts.`, `${lam} = ${h}/√(2·${m}·${i('e')}·${U}), mit ${U} in Volt.`), L(`${lam} ∝ 1/√${U}.`, `${lam} ∝ 1/√${U}.`)],
        solution: [
          L(`(a) ${lam} = 6.626 · 10<sup>−34</sup> J·s / √(2 · 9.109 · 10<sup>−31</sup> kg · 1.602 · 10<sup>−19</sup> C · ${Uk * 1e3} V) = <b>${plain(lm * 1e12)} pm</b>.`, `(a) ${lam} = 6.626 · 10<sup>−34</sup> J·s / √(2 · 9.109 · 10<sup>−31</sup> kg · 1.602 · 10<sup>−19</sup> C · ${Uk * 1e3} V) = <b>${plain(lm * 1e12)} pm</b>.`),
          L(`(b) 550 nm / ${plain(lm * 1e12)} pm = <b>${sci(ratio)}</b>. In practice, the lenses for electrons are far from perfect: a scanning electron microscope resolves about 1 nm, still hundreds of times better than light.`, `(b) 550 nm / ${plain(lm * 1e12)} pm = <b>${sci(ratio)}</b>. In der Praxis sind die Linsen für Elektronen alles andere als perfekt: Ein Rasterelektronenmikroskop löst etwa 1 nm auf, immer noch hundertmal besser als Licht.`),
          L(`(c) ${lam} ∝ 1/√${U}: <b>four times the voltage</b> halves the wavelength.`, `(c) ${lam} ∝ 1/√${U}: Die <b>vierfache Spannung</b> halbiert die Wellenlänge.`),
        ],
      };
    },
  };

  // ---------------------------------------------------------------- neutrons and a crystal
  const neutron = {
    id: 'neutron', difficulty: 3, title: () => L('Neutrons look into a crystal', 'Neutronen schauen in einen Kristall'),
    make(r) {
      const E = r.pick([0.025, 0.03, 0.04, 0.05]), D = 0.282e-9, pp = M.pOfE(M.mn, E), vv = pp / M.mn, lm = M.h / pp, th = deg(Math.asin(lm / (2 * D)));
      return {
        text: `<p>${L(`In a research reactor, neutrons are slowed down to the kinetic energy ${Ek} = ${E} eV. They fall on a rock-salt crystal whose lattice planes are ${d} = 0.282 nm apart. Neutrons are reflected strongly at the glancing angle θ where Bragg’s condition 2${d}·sin θ = ${lam} holds.`, `In einem Forschungsreaktor werden Neutronen auf die kinetische Energie ${Ek} = ${E} eV abgebremst. Sie fallen auf einen Steinsalzkristall, dessen Netzebenen ${d} = 0.282 nm voneinander entfernt sind. Neutronen werden unter dem Glanzwinkel θ stark reflektiert, für den die Bragg-Bedingung 2${d}·sin θ = ${lam} gilt.`)}</p>${CONST('h', 'e', 'mn')}`,
        figs: '',
        questions: [
          numQ('v', L('(a) the speed of the neutrons', '(a) die Geschwindigkeit der Neutronen'), v, 'km/s', vv / 1e3, { scale: 1e3 }),
          numQ('lam', L('(b) their wavelength', '(b) ihre Wellenlänge'), lam, 'nm', lm * 1e9, { wrong: [{ value: (M.h * M.c) / (E * M.e) * 1e9, tag: 'photonp', why: WHY.photonp() }] }),
          numQ('th', L('(c) the glancing angle of the first strong reflection', '(c) der Glanzwinkel der ersten starken Reflexion'), 'θ', '°', th, { tol: 0.012, wrong: [{ value: deg(Math.asin(Math.min(1, lm / D))), tag: 'angle', why: L('Bragg’s condition has 2d: 2d·sin θ = λ.', 'In der Bragg-Bedingung steht 2d: 2d·sin θ = λ.') }] }),
        ],
        hints: [L(`${Ek} = ½·${m}·${v}², with ${Ek} in joules.`, `${Ek} = ½·${m}·${v}², mit ${Ek} in Joule.`), L(`${lam} = ${h}/(${m}·${v}).`, `${lam} = ${h}/(${m}·${v}).`), L(`sin θ = ${lam}/(2${d}).`, `sin θ = ${lam}/(2${d}).`)],
        solution: [
          L(`(a) ${v} = √(2·${Ek}/${m}) = √(2 · ${sci(E * M.e)} J / 1.675 · 10<sup>−27</sup> kg) = <b>${plain(vv / 1e3)} km/s</b>.`, `(a) ${v} = √(2·${Ek}/${m}) = √(2 · ${sci(E * M.e)} J / 1.675 · 10<sup>−27</sup> kg) = <b>${plain(vv / 1e3)} km/s</b>.`),
          L(`(b) ${lam} = ${h}/(${m}·${v}) = <b>${plain(lm * 1e9)} nm</b>: about the spacing of the atoms, just right for diffraction.`, `(b) ${lam} = ${h}/(${m}·${v}) = <b>${plain(lm * 1e9)} nm</b>: etwa der Abstand der Atome, gerade richtig für Beugung.`),
          L(`(c) sin θ = ${plain(lm * 1e9)} nm / (2 · 0.282 nm) = ${plain(lm / (2 * D))}, θ = <b>${plain(th)}°</b>. Neutrons are uncharged and see the nuclei and their magnetism: they show things X-rays miss, for example where the hydrogen atoms are.`, `(c) sin θ = ${plain(lm * 1e9)} nm / (2 · 0.282 nm) = ${plain(lm / (2 * D))}, θ = <b>${plain(th)}°</b>. Neutronen sind ungeladen und sehen die Kerne und ihren Magnetismus: Sie zeigen, was Röntgenstrahlung übersieht, zum Beispiel, wo die Wasserstoffatome sitzen.`),
        ],
      };
    },
  };

  // ---------------------------------------------------------------- the scanning tunnelling microscope
  const stm = {
    id: 'stm', difficulty: 3, title: () => L('The scanning tunnelling microscope', 'Das Rastertunnelmikroskop'),
    make(r) {
      const phi = r.pick([4.0, 4.5, 5.0]), dd = r.pick([0.05, 0.1]), kk = M.kappa(M.me, phi), f = Math.exp(2 * kk * dd * 1e-9);
      return {
        text: `<p>${L(`A metal tip is brought within about 1 nm of a surface; a small voltage makes electrons tunnel across the gap. For them, the gap is a barrier about as high as the work function, ${i('V')}${sb('0')} − ${i('E')} ≈ ${phi} eV. The current is proportional to the fraction that tunnels, ${i('T')} ≈ e<sup>−2${kap}${d}</sup>, with ${d} the width of the gap.`, `Eine Metallspitze wird bis auf etwa 1 nm an eine Oberfläche herangeführt; eine kleine Spannung lässt Elektronen über den Spalt tunneln. Für sie ist der Spalt eine Barriere, etwa so hoch wie die Austrittsarbeit, ${i('V')}${sb('0')} − ${i('E')} ≈ ${phi} eV. Der Strom ist proportional zum Anteil, der durchtunnelt, ${i('T')} ≈ e<sup>−2${kap}${d}</sup>, mit ${d} der Breite des Spalts.`)}</p>${CONST('hbar', 'e', 'me')}`,
        figs: fig(G.barrier({ dE: true, wave: false })),
        questions: [
          numQ('k', L('(a) the decay constant', '(a) die Abklingkonstante'), kap, '1/nm', kk * 1e-9, { wrong: [{ value: (kk * 1e-9) / (2 * Math.PI), tag: 'hbar', why: WHY.hbarK() }] }),
          numQ('f', L(`(b) the factor by which the current grows when the tip comes ${dd} nm closer`, `(b) der Faktor, um den der Strom wächst, wenn die Spitze ${dd} nm näher kommt`), i('k'), '', f, { tol: 0.04, wrong: [{ value: Math.exp(kk * dd * 1e-9), tag: 'factor2', why: WHY.factor2() }] }),
          choice('why', L('(c) The microscope shows single atoms because', '(c) Das Mikroskop zeigt einzelne Atome, weil'), opts(r, [
            [L('almost all the current flows through the one atom at the tip closest to the surface', 'fast der ganze Strom durch das eine Atom der Spitze fliesst, das der Oberfläche am nächsten ist'), true],
            [L('the tip touches the atoms one after the other', 'die Spitze die Atome eines nach dem anderen berührt'), false, L('The tip never touches: the electrons tunnel across the gap.', 'Die Spitze berührt nie: Die Elektronen tunneln über den Spalt.'), 'classical'],
            [L('the electrons have a wavelength much shorter than an atom', 'die Elektronen eine Wellenlänge haben, die viel kürzer ist als ein Atom'), false, L('These electrons are slow; what matters is that the current falls off exponentially with the distance.', 'Diese Elektronen sind langsam; entscheidend ist, dass der Strom exponentiell mit dem Abstand abfällt.'), 'other'],
          ])),
        ],
        hints: [L(`${kap} = √(2${m}(${i('V')}${sb('0')} − ${i('E')}))/ħ.`, `${kap} = √(2${m}(${i('V')}${sb('0')} − ${i('E')}))/ħ.`), L(`The ratio of the currents: e<sup>−2${kap}(${d} − Δ${d})</sup>/e<sup>−2${kap}${d}</sup> = e<sup>2${kap}Δ${d}</sup>.`, `Das Verhältnis der Ströme: e<sup>−2${kap}(${d} − Δ${d})</sup>/e<sup>−2${kap}${d}</sup> = e<sup>2${kap}Δ${d}</sup>.`)],
        solution: [
          L(`(a) ${kap} = √(2 · 9.109 · 10<sup>−31</sup> kg · ${sci(phi * M.e)} J) / 1.055 · 10<sup>−34</sup> J·s = <b>${plain(kk * 1e-9)} 1/nm</b>.`, `(a) ${kap} = √(2 · 9.109 · 10<sup>−31</sup> kg · ${sci(phi * M.e)} J) / 1.055 · 10<sup>−34</sup> J·s = <b>${plain(kk * 1e-9)} 1/nm</b>.`),
          L(`(b) e<sup>2${kap}Δ${d}</sup> = e<sup>2 · ${plain(kk * 1e-9)} · ${dd}</sup> = <b>${plain(f)}</b>. ${dd === 0.1 ? 'A tenth of a nanometre, less than an atom, changes the current about tenfold.' : 'Half an atom’s diameter already changes the current noticeably.'} The microscope keeps the current constant and records how the tip must move: a map of the atoms.`, `(b) e<sup>2${kap}Δ${d}</sup> = e<sup>2 · ${plain(kk * 1e-9)} · ${dd}</sup> = <b>${plain(f)}</b>. ${dd === 0.1 ? 'Ein Zehntel Nanometer, weniger als ein Atom, ändert den Strom etwa um das Zehnfache.' : 'Schon ein halber Atomdurchmesser ändert den Strom merklich.'} Das Mikroskop hält den Strom konstant und zeichnet auf, wie sich die Spitze bewegen muss: eine Karte der Atome.`),
          L('(c) Because the current falls so steeply with the distance, <b>almost all of it flows through the one atom closest to the surface</b>. Binnig and Rohrer received the Nobel prize for it in 1986, at IBM Zurich.', '(c) Weil der Strom so steil mit dem Abstand abfällt, <b>fliesst fast alles durch das eine Atom, das der Oberfläche am nächsten ist</b>. Binnig und Rohrer erhielten dafür 1986 den Nobelpreis, bei IBM Zürich.'),
        ],
      };
    },
  };

  // ---------------------------------------------------------------- alpha decay
  const NUCLEI = [
    { en: 'uranium-238', de: 'Uran-238', E: 4.27, half: { en: '4.5 billion years', de: '4.5 Milliarden Jahre' } },
    { en: 'radium-226', de: 'Radium-226', E: 4.87, half: { en: '1600 years', de: '1600 Jahre' } },
    { en: 'polonium-210', de: 'Polonium-210', E: 5.41, half: { en: '138 days', de: '138 Tage' } },
    { en: 'polonium-212', de: 'Polonium-212', E: 8.95, half: { en: '0.3 µs', de: '0.3 µs' } },
  ];
  const alpha = {
    id: 'alpha', difficulty: 3, title: () => L('Alpha decay: escape by tunnelling', 'Alphazerfall: Flucht durch Tunneln'),
    make(r) {
      const n = r.pick(NUCLEI.slice(0, 3)), fast = NUCLEI[3], pp = M.pOfE(M.ma, n.E * 1e6), vv = pp / M.ma, lm = M.h / pp;
      return {
        text: `<p>${L(`A ${n.en} nucleus emits alpha particles of ${n.E} MeV. Inside, the alpha particle is held by the strong force; at the edge of the nucleus, the electric repulsion forms a wall about 25 MeV high. Its half-life is ${n.half.en}; that of ${fast.en}, whose alpha particles have ${fast.E} MeV, is ${fast.half.en}.`, `Ein Kern von ${n.de} sendet Alphateilchen von ${n.E} MeV aus. Innen hält die starke Kraft das Alphateilchen fest; am Rand des Kerns bildet die elektrische Abstossung eine Wand von etwa 25 MeV Höhe. Seine Halbwertszeit ist ${n.half.de}; die von ${fast.de}, dessen Alphateilchen ${fast.E} MeV haben, ist ${fast.half.de}.`)}</p>${CONST('h', 'e', 'ma')}`,
        figs: '',
        questions: [
          numQ('v', L('(a) the speed of the alpha particle', '(a) die Geschwindigkeit des Alphateilchens'), v, `${M.pow(7)} m/s`, vv / 1e7, { scale: 1e7 }),
          numQ('lam', L('(b) its de Broglie wavelength', '(b) seine de-Broglie-Wellenlänge'), lam, 'fm', lm * 1e15, { scale: 1e-15 }),
          choice('cl', L(`(c) In classical physics, an alpha particle of ${n.E} MeV`, `(c) In der klassischen Physik würde ein Alphateilchen von ${n.E} MeV`), opts(r, [
            [L('could never leave the nucleus', 'den Kern nie verlassen können'), true],
            [L('would leave it at once', 'ihn sofort verlassen'), false, L(`The wall is about 25 MeV high, far above ${n.E} MeV: classically it would bounce back for ever.`, `Die Wand ist etwa 25 MeV hoch, weit über ${n.E} MeV: Klassisch würde es für immer zurückprallen.`), 'classical'],
            [L('would leave it after a fixed time', 'ihn nach einer festen Zeit verlassen'), false, L('Classically it could never get over the wall; quantum physics only gives a probability per unit time.', 'Klassisch käme es nie über die Wand; die Quantenphysik gibt nur eine Wahrscheinlichkeit pro Zeit an.'), 'determinism'],
          ])),
          choice('half', L(`(d) Why is the half-life of ${fast.en} so much shorter?`, `(d) Warum ist die Halbwertszeit von ${fast.de} so viel kürzer?`), opts(r, [
            [L('a more energetic alpha particle meets a lower and thinner barrier, and T grows exponentially', 'ein energiereicheres Alphateilchen trifft auf eine niedrigere und dünnere Barriere, und T wächst exponentiell'), true],
            [L('faster alpha particles break through the wall', 'schnellere Alphateilchen durchbrechen die Wand'), false, L(`Even ${fast.E} MeV is far below the top of the wall: they tunnel, but through a thinner part.`, `Auch ${fast.E} MeV liegen weit unter der Oberkante der Wand: Sie tunneln, aber durch einen dünneren Teil.`), 'classical'],
            [L('the energy does not matter; polonium is simply less stable', 'die Energie spielt keine Rolle; Polonium ist einfach weniger stabil'), false, L('The energy decides: a few MeV more change the half-life by many powers of ten (Geiger–Nuttall).', 'Die Energie entscheidet: Ein paar MeV mehr ändern die Halbwertszeit um viele Zehnerpotenzen (Geiger–Nuttall).'), 'other'],
          ])),
        ],
        hints: [L(`${Ek} = ½·${m}·${v}², with ${Ek} in joules (1 MeV = 1.602 · 10<sup>−13</sup> J).`, `${Ek} = ½·${m}·${v}², mit ${Ek} in Joule (1 MeV = 1.602 · 10<sup>−13</sup> J).`), L(`${lam} = ${h}/(${m}·${v}).`, `${lam} = ${h}/(${m}·${v}).`), L('The transmission depends exponentially on how high and how wide the barrier is at the particle’s energy.', 'Die Transmission hängt exponentiell davon ab, wie hoch und wie breit die Barriere bei der Energie des Teilchens ist.')],
        solution: [
          L(`(a) ${v} = √(2·${Ek}/${m}) = √(2 · ${sci(n.E * 1e6 * M.e)} J / 6.645 · 10<sup>−27</sup> kg) = <b>${sci(vv)} m/s</b>, about ${plain((vv / M.c) * 100, 2)} % of the speed of light.`, `(a) ${v} = √(2·${Ek}/${m}) = √(2 · ${sci(n.E * 1e6 * M.e)} J / 6.645 · 10<sup>−27</sup> kg) = <b>${sci(vv)} m/s</b>, etwa ${plain((vv / M.c) * 100, 2)} % der Lichtgeschwindigkeit.`),
          L(`(b) ${lam} = ${h}/(${m}·${v}) = <b>${plain(lm * 1e15)} fm</b>: about the size of the nucleus (7 fm), so its wave nature matters there.`, `(b) ${lam} = ${h}/(${m}·${v}) = <b>${plain(lm * 1e15)} fm</b>: etwa so gross wie der Kern (7 fm), also zählt dort seine Wellennatur.`),
          L(`(c) Classically it <b>could never leave</b>. Quantum mechanically, each time it hits the wall it has a tiny chance to tunnel through: about 10<sup>21</sup> hits per second, and a chance that makes the half-life ${n.half.en}.`, `(c) Klassisch <b>könnte es den Kern nie verlassen</b>. Quantenmechanisch hat es bei jedem Anprall an die Wand eine winzige Chance durchzutunneln: etwa 10<sup>21</sup> Anpralle pro Sekunde, und eine Chance, die die Halbwertszeit ${n.half.de} ergibt.`),
          L(`(d) At ${fast.E} MeV the alpha particle meets the wall higher up, where it is <b>lower above its energy and thinner</b>: T grows exponentially, and the half-life shrinks from ${n.half.en} to ${fast.half.en}. Gamow explained alpha decay this way in 1928, the first success of tunnelling.`, `(d) Bei ${fast.E} MeV trifft das Alphateilchen die Wand weiter oben, wo sie <b>weniger hoch über seiner Energie liegt und dünner ist</b>: T wächst exponentiell, und die Halbwertszeit schrumpft von ${n.half.de} auf ${fast.half.de}. Gamow erklärte den Alphazerfall 1928 so, der erste Erfolg des Tunnelns.`),
        ],
      };
    },
  };

  const PROBLEMS = [football, davisson, sem, neutron, stm, alpha];
  function realOf(k, seed) {
    const pr = PROBLEMS[k], ex = pr.make(M.rng(seed * 61 + 31));
    return { ...ex, type: `real-${pr.id}`, problem: pr.id, title: pr.title(), difficulty: pr.difficulty };
  }

  const api = { PROBLEMS, realOf };
  root.MatterProblems = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
