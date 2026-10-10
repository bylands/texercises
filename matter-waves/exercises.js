// The exercises of Matter Waves, with their texts in the current language (the app rebuilds them
// when the language changes). Every exercise has the form
//   { id, type, difficulty, title, text, figs (HTML), questions, hints, solution (HTML paragraphs),
//     solFig, p (what makes it new to the student) }
// with questions of four kinds:
//   { type: 'num', key, label, sym, unit, value, tol, abs, scale, wrong: [{ value, tag, why }] }
//        a number in the unit shown (value in that unit, e.g. 3.82 for 3.82 · 10⁻²⁴ kg·m/s with unit
//        10⁻²⁴ kg·m/s and scale 1e-24: the full number 3.82e-24 counts as well); tol: the relative
//        error allowed, abs: an absolute one; wrong: the results of typical mistakes, each with what
//        went wrong
//   { type: 'choice', key, label, options: [{ label, ok, why, tag }] }   one of a few answers
//   { type: 'pick', key, label, options: [{ html, ok, why, tag }] }       one of a few drawings
//   { type: 'multi', key, statements: [{ html, ok, why }] }              statements to tick
// The tags name the wrong idea behind an answer (the arcade's misconceptions, app.js).
// The types, by topic:
//   debroglie, particle, same-lambda, rings     the de Broglie wavelength, electron diffraction
//   buildup, quanta-stmts, fringes              single quanta at the double slit
//   uncert, slit-spread, estimate, uncert-stmts the uncertainty relation
//   tunnel-pick, tunnel-rank, tunnel            tunnelling
(function (root) {
  'use strict';

  const M = root.MatterWave || require('./physics.js');
  const G = root.MatterPlot || require('./plot.js');
  const Lang = root.Lang || require('./lang.js');
  const L = (en, de) => Lang.L(en, de);
  const { rng, plain, sci, pow, expOf, lenUnit } = M;

  // ---------------------------------------------------------------- writing
  const i = (s) => `<i>${s}</i>`;
  const sb = (s) => `<sub>${s}</sub>`;
  const lam = i('λ'), p = i('p'), m = i('m'), v = i('v'), h = i('h'), U = i('U'), Ek = `${i('E')}${sb('kin')}`, dx = `Δ${i('x')}`, dp = `Δ${i('p')}`, kap = i('κ'), T = i('T'), d = i('d');
  const hb = 'ħ';
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const fig = (html) => `<div class="fig">${html}</div>`;
  const C = {
    h: () => `${h} = 6.626 · 10<sup>−34</sup> J·s`, e: () => `${i('e')} = 1.602 · 10<sup>−19</sup> C`, me: () => `${m}${sb('e')} = 9.109 · 10<sup>−31</sup> kg`,
    mp: () => `${m}${sb('p')} = 1.673 · 10<sup>−27</sup> kg`, mn: () => `${m}${sb('n')} = 1.675 · 10<sup>−27</sup> kg`, ma: () => `${m}${sb('α')} = 6.645 · 10<sup>−27</sup> kg`,
    u: () => `1 u = 1.661 · 10<sup>−27</sup> kg`, hbar: () => `${hb} = ${h}/(2π) = 1.055 · 10<sup>−34</sup> J·s`,
  };
  const CONST = (...keys) => `<p class="consts">${keys.map((k) => C[k]()).join(', ')}</p>`;
  // a value in a field with its power of ten as the unit: [value, unit, scale]
  const powUnit = (x, unit) => { const k = expOf(x); return k === 0 ? [x, unit, 1] : [x / 10 ** k, `${pow(k)} ${unit}`.trim(), 10 ** k]; };
  // a length written with its fitting unit
  const len = (x, sig = 3) => { const [val, unit] = lenUnit(x); return /^10/.test(unit) ? `${sci(x, sig)} m` : `${plain(val, sig)} ${unit}`; };

  // ---------------------------------------------------------------- questions
  const numQ = (key, label, sym, unit, value, o = {}) => ({ type: 'num', key, label, sym, unit, value, tol: o.tol || 0.012, abs: o.abs || 0, scale: o.scale || 1, wrong: (o.wrong || []).filter((w) => Number.isFinite(w.value) && Math.abs(w.value / value - 1) > 0.06) });
  const choice = (key, label, options) => ({ type: 'choice', key, label, options });
  const pick = (key, label, options) => ({ type: 'pick', key, label, options });
  const multi = (key, statements) => ({ type: 'multi', key, statements });
  // options from [label, ok, why, tag], shuffled (or in the order given)
  const opts = (r, list, keep) => { const o = list.map(([label, ok, why, tag]) => ({ label, ok, why: ok ? '' : why, tag: ok ? undefined : tag || 'other' })); return keep ? o : r.shuffle(o); };

  // ---------------------------------------------------------------- typical mistakes
  const WHY = {
    photonp: () => L('That is the formula for a photon (p = E/c, λ = h·c/E). A particle with mass has p = √(2·m·E<sub>kin</sub>).', 'Das ist die Formel für ein Photon (p = E/c, λ = h·c/E). Ein Teilchen mit Masse hat p = √(2·m·E<sub>kin</sub>).'),
    sqrt: () => L('The momentum grows with the square root of the energy: p = √(2·m·E<sub>kin</sub>), so λ ∝ 1/√E<sub>kin</sub>.', 'Der Impuls wächst mit der Wurzel der Energie: p = √(2·m·E<sub>kin</sub>), also λ ∝ 1/√E<sub>kin</sub>.'),
    hbar: () => L('Heisenberg’s relation has h/(4π): Δx·Δp ≥ h/(4π).', 'In Heisenbergs Beziehung steht h/(4π): Δx·Δp ≥ h/(4π).'),
    hbarK: () => L('κ has ħ = h/(2π) in the denominator, not h.', 'Im Nenner von κ steht ħ = h/(2π), nicht h.'),
    factor2: () => L('The probability goes with the square of the amplitude: T ≈ e<sup>−2κd</sup>, with a factor 2 in the exponent.', 'Die Wahrscheinlichkeit geht mit dem Quadrat der Amplitude: T ≈ e<sup>−2κd</sup>, mit einem Faktor 2 im Exponenten.'),
    half: () => L('The kinetic energy is p²/(2m): do not forget the 2.', 'Die kinetische Energie ist p²/(2m): Vergiss die 2 nicht.'),
    energyloss: () => L('Tunnelling costs no energy: behind the barrier the particle has the same energy as before, so the same wavelength. Only the amplitude, the probability, is smaller.', 'Tunneln kostet keine Energie: Hinter der Barriere hat das Teilchen dieselbe Energie wie vorher, also dieselbe Wellenlänge. Nur die Amplitude, die Wahrscheinlichkeit, ist kleiner.'),
  };

  // ---------------------------------------------------------------- the de Broglie wavelength
  function debroglie(seed) {
    const r = rng(seed * 31 + 3);
    const Uv = r.pick([50, 100, 150, 200, 300, 500, 1000, 2000, 5000, 10000]);
    const pp = M.pOfU(M.me, Uv), lm = M.h / pp, vv = pp / M.me;
    const pPhoton = (Uv * M.e) / M.c, lPhoton = (M.h * M.c) / (Uv * M.e);
    return {
      title: L('The wavelength of an electron', 'Die Wellenlänge eines Elektrons'),
      text: `<p>${L(`Electrons start at rest and are accelerated through ${U} = ${Uv} V. Find their speed, their momentum and their de Broglie wavelength (no relativity needed).`, `Elektronen starten in Ruhe und werden mit ${U} = ${Uv} V beschleunigt. Bestimme ihre Geschwindigkeit, ihren Impuls und ihre de-Broglie-Wellenlänge (ohne Relativitätstheorie).`)}</p>${CONST('h', 'e', 'me')}`,
      figs: '',
      questions: [
        numQ('v', L('(a) speed', '(a) Geschwindigkeit'), v, `${pow(6)} m/s`, vv / 1e6, { scale: 1e6 }),
        numQ('p', L('(b) momentum', '(b) Impuls'), p, `${pow(-24)} kg·m/s`, pp / 1e-24, { scale: 1e-24, wrong: [{ value: pPhoton / 1e-24, tag: 'photonp', why: WHY.photonp() }] }),
        numQ('lam', L('(c) de Broglie wavelength', '(c) de-Broglie-Wellenlänge'), lam, 'pm', lm * 1e12, { wrong: [{ value: lPhoton * 1e12, tag: 'photonp', why: WHY.photonp() }] }),
        choice('x4', L('(d) With four times the voltage, the wavelength is', '(d) Mit der vierfachen Spannung ist die Wellenlänge'), opts(r, [
          [L('half as long', 'halb so lang'), true],
          [L('a quarter as long', 'ein Viertel so lang'), false, WHY.sqrt(), 'sqrt'],
          [L('twice as long', 'doppelt so lang'), false, L('More energy means more momentum, so a shorter wavelength: λ = h/p.', 'Mehr Energie bedeutet mehr Impuls, also eine kürzere Wellenlänge: λ = h/p.'), 'inverse'],
          [L('the same', 'gleich'), false, L('The wavelength depends on the momentum, and that grows with the voltage.', 'Die Wellenlänge hängt vom Impuls ab, und der wächst mit der Spannung.'), 'other'],
        ])),
      ],
      hints: [
        L(`The electron gains the energy ${Ek} = ${i('e')}·${U} = ½·${m}·${v}².`, `Das Elektron gewinnt die Energie ${Ek} = ${i('e')}·${U} = ½·${m}·${v}².`),
        L(`${p} = ${m}·${v} = √(2·${m}·${i('e')}·${U}).`, `${p} = ${m}·${v} = √(2·${m}·${i('e')}·${U}).`),
        L(`de Broglie: ${lam} = ${h}/${p}.`, `de Broglie: ${lam} = ${h}/${p}.`),
      ],
      solution: [
        L(`(a) ${i('e')}·${U} = ½·${m}·${v}², so ${v} = √(2·${i('e')}·${U}/${m}) = √(2 · 1.602 · 10<sup>−19</sup> C · ${Uv} V / 9.109 · 10<sup>−31</sup> kg) = <b>${sci(vv)} m/s</b>.`, `(a) ${i('e')}·${U} = ½·${m}·${v}², also ${v} = √(2·${i('e')}·${U}/${m}) = √(2 · 1.602 · 10<sup>−19</sup> C · ${Uv} V / 9.109 · 10<sup>−31</sup> kg) = <b>${sci(vv)} m/s</b>.`),
        L(`(b) ${p} = ${m}·${v} = 9.109 · 10<sup>−31</sup> kg · ${sci(vv)} m/s = <b>${sci(pp)} kg·m/s</b>.`, `(b) ${p} = ${m}·${v} = 9.109 · 10<sup>−31</sup> kg · ${sci(vv)} m/s = <b>${sci(pp)} kg·m/s</b>.`),
        L(`(c) ${lam} = ${h}/${p} = 6.626 · 10<sup>−34</sup> J·s / ${sci(pp)} kg·m/s = ${sci(lm)} m = <b>${plain(lm * 1e12)} pm</b>${lm > 5e-11 ? ', about the spacing of atoms in a crystal' : ''}.`, `(c) ${lam} = ${h}/${p} = 6.626 · 10<sup>−34</sup> J·s / ${sci(pp)} kg·m/s = ${sci(lm)} m = <b>${plain(lm * 1e12)} pm</b>${lm > 5e-11 ? ', etwa der Abstand der Atome in einem Kristall' : ''}.`),
        L(`(d) ${p} ∝ √${U}, so ${lam} ∝ 1/√${U}: four times the voltage gives twice the momentum and <b>half the wavelength</b>.`, `(d) ${p} ∝ √${U}, also ${lam} ∝ 1/√${U}: Die vierfache Spannung ergibt den doppelten Impuls und <b>die halbe Wellenlänge</b>.`),
      ],
      p: { Uv },
    };
  }

  // Particles of very different masses: the wavelength, and whether a crystal shows it.
  function particle(seed) {
    const r = rng(seed * 37 + 5);
    const k = r.pick(['n', 'e', 'p', 'a', 'c60', 'ball', 'dust']);
    const P = M.PARTICLES;
    const cs = {
      n: () => { const E = r.pick([0.02, 0.025, 0.03, 0.04]); return { m: P.n.m, E, what: L(`A thermal neutron from a nuclear reactor has the kinetic energy ${E} eV.`, `Ein thermisches Neutron aus einem Kernreaktor hat die kinetische Energie ${E} eV.`), c: ['h', 'e', 'mn'] }; },
      e: () => { const vv = r.pick([1, 2, 3, 5]) * 1e6; return { m: M.me, v: vv, what: L(`An electron flies at ${sci(vv, 1)} m/s.`, `Ein Elektron fliegt mit ${sci(vv, 1)} m/s.`), c: ['h', 'me'] }; },
      p: () => { const vv = r.pick([2, 4, 5, 8]) * 1e3; return { m: P.p.m, v: vv, what: L(`A slow proton flies at ${sci(vv, 1)} m/s.`, `Ein langsames Proton fliegt mit ${sci(vv, 1)} m/s.`), c: ['h', 'mp'] }; },
      a: () => { const E = r.pick([4, 5, 6]) * 1e6; return { m: P.a.m, E, what: L(`An alpha particle from a radioactive nucleus has the kinetic energy ${E / 1e6} MeV.`, `Ein Alphateilchen aus einem radioaktiven Kern hat die kinetische Energie ${E / 1e6} MeV.`), c: ['h', 'e', 'ma'] }; },
      c60: () => { const vv = r.pick([150, 200, 250]); return { m: 720 * M.u, v: vv, what: L(`A C<sub>60</sub> molecule (a football of 60 carbon atoms, mass 720 u) flies at ${vv} m/s.`, `Ein C<sub>60</sub>-Molekül (ein Fussball aus 60 Kohlenstoffatomen, Masse 720 u) fliegt mit ${vv} m/s.`), c: ['h', 'u'] }; },
      ball: () => { const vv = r.pick([30, 40, 50]); return { m: 0.057, v: vv, what: L(`A tennis ball (57 g) flies at ${vv} m/s.`, `Ein Tennisball (57 g) fliegt mit ${vv} m/s.`), c: ['h'] }; },
      dust: () => { const vv = r.pick([1, 2, 5]) * 1e-3; return { m: 1e-9, v: vv, what: L(`A grain of dust (1 µg) drifts at ${vv * 1e3} mm/s.`, `Ein Staubkorn (1 µg) treibt mit ${vv * 1e3} mm/s.`), c: ['h'] }; },
    }[k]();
    const byE = cs.E != null;
    const pp = byE ? M.pOfE(cs.m, cs.E) : cs.m * cs.v, lm = M.h / pp;
    const [pv, pu, ps] = powUnit(pp, 'kg·m/s'), [lv, lu, ls] = lenUnit(lm);
    const pPh = byE ? (cs.E * M.e) / M.c : null, lPh = byE ? (M.h * M.c) / (cs.E * M.e) : null;
    const comp = lm >= 1e-11 && lm <= 3e-9;
    const qs = [
      numQ('p', L('(a) momentum', '(a) Impuls'), p, pu, pv, { scale: ps, wrong: byE ? [{ value: pPh / ps, tag: 'photonp', why: WHY.photonp() }] : [] }),
      numQ('lam', L('(b) de Broglie wavelength', '(b) de-Broglie-Wellenlänge'), lam, lu, lv, { scale: ls, wrong: byE ? [{ value: lPh / ls, tag: 'photonp', why: WHY.photonp() }] : [] }),
      choice('cr', L('(c) The atoms of a crystal are about 0.1 nm to 0.3 nm apart. Does the crystal diffract this particle visibly?', '(c) Die Atome eines Kristalls sind etwa 0.1 nm bis 0.3 nm voneinander entfernt. Beugt der Kristall dieses Teilchen sichtbar?'), opts(r, [
        [L('yes: its wavelength is comparable to the spacing', 'ja: seine Wellenlänge ist vergleichbar mit dem Abstand'), comp, L(`${len(lm)} is far shorter than the spacing of the atoms: the diffraction angles are far too small to see.`, `${len(lm)} ist viel kürzer als der Abstand der Atome: Die Beugungswinkel sind viel zu klein, um sie zu sehen.`), 'scale'],
        [L('no: its wavelength is far shorter than the spacing', 'nein: seine Wellenlänge ist viel kürzer als der Abstand'), !comp, L(`${len(lm)} is comparable to the spacing of the atoms: that is just right for diffraction.`, `${len(lm)} ist vergleichbar mit dem Abstand der Atome: Das passt gerade für Beugung.`), 'scale'],
        [L('no: particles with mass are never diffracted', 'nein: Teilchen mit Masse werden nie gebeugt'), false, L('Every particle has a wavelength λ = h/p; electrons, neutrons and even molecules are diffracted.', 'Jedes Teilchen hat eine Wellenlänge λ = h/p; Elektronen, Neutronen und sogar Moleküle werden gebeugt.'), 'particle'],
      ])),
    ];
    return {
      title: L('Big and small particles', 'Grosse und kleine Teilchen'),
      text: `<p>${cs.what} ${L('Find its momentum and its de Broglie wavelength.', 'Bestimme seinen Impuls und seine de-Broglie-Wellenlänge.')}</p>${CONST(...cs.c)}`,
      figs: '',
      questions: qs,
      hints: [
        byE ? L(`From the kinetic energy: ${Ek} = ${p}²/(2${m}), so ${p} = √(2·${m}·${Ek}), with ${Ek} in joules.`, `Aus der kinetischen Energie: ${Ek} = ${p}²/(2${m}), also ${p} = √(2·${m}·${Ek}), mit ${Ek} in Joule.`) : L(`${p} = ${m}·${v}, with the mass in kilograms.`, `${p} = ${m}·${v}, mit der Masse in Kilogramm.`),
        L(`${lam} = ${h}/${p}.`, `${lam} = ${h}/${p}.`),
        L('Diffraction is visible when the wavelength is not much smaller than the spacing of the obstacles.', 'Beugung ist sichtbar, wenn die Wellenlänge nicht viel kleiner ist als der Abstand der Hindernisse.'),
      ],
      solution: [
        byE ? L(`(a) ${Ek} = ${cs.E >= 1e6 ? `${cs.E / 1e6} MeV` : `${cs.E} eV`} = ${sci(cs.E * M.e)} J, so ${p} = √(2 · ${sci(cs.m, 4)} kg · ${sci(cs.E * M.e)} J) = <b>${sci(pp)} kg·m/s</b>.`, `(a) ${Ek} = ${cs.E >= 1e6 ? `${cs.E / 1e6} MeV` : `${cs.E} eV`} = ${sci(cs.E * M.e)} J, also ${p} = √(2 · ${sci(cs.m, 4)} kg · ${sci(cs.E * M.e)} J) = <b>${sci(pp)} kg·m/s</b>.`)
          : L(`(a) ${p} = ${m}·${v} = ${sci(cs.m, 4)} kg · ${sci(cs.v)} m/s = <b>${sci(pp)} kg·m/s</b>.`, `(a) ${p} = ${m}·${v} = ${sci(cs.m, 4)} kg · ${sci(cs.v)} m/s = <b>${sci(pp)} kg·m/s</b>.`),
        L(`(b) ${lam} = ${h}/${p} = 6.626 · 10<sup>−34</sup> J·s / ${sci(pp)} kg·m/s = <b>${len(lm)}</b>.`, `(b) ${lam} = ${h}/${p} = 6.626 · 10<sup>−34</sup> J·s / ${sci(pp)} kg·m/s = <b>${len(lm)}</b>.`),
        comp ? L(`(c) ${len(lm)} is comparable to the spacing of the atoms: <b>yes</b>, the crystal diffracts it, as it diffracts X-rays.`, `(c) ${len(lm)} ist vergleichbar mit dem Abstand der Atome: <b>ja</b>, der Kristall beugt es, wie er Röntgenstrahlung beugt.`)
          : L(`(c) ${len(lm)} is far shorter than 0.1 nm: <b>no</b>. ${k === 'ball' || k === 'dust' ? 'For everyday objects the wavelength is so absurdly short that no wave behaviour can ever be seen.' : k === 'c60' ? 'Still, with a grating of 100 nm and a long path, the interference of C<sub>60</sub> has been seen (Vienna, 1999).' : 'Its wavelength is about the size of a nucleus.'}`, `(c) ${len(lm)} ist viel kürzer als 0.1 nm: <b>nein</b>. ${k === 'ball' || k === 'dust' ? 'Bei Alltagsgegenständen ist die Wellenlänge so absurd kurz, dass nie ein Wellenverhalten zu sehen ist.' : k === 'c60' ? 'Mit einem Gitter von 100 nm und einem langen Weg hat man die Interferenz von C<sub>60</sub> trotzdem gesehen (Wien, 1999).' : 'Seine Wellenlänge ist etwa so gross wie ein Atomkern.'}`),
      ],
      p: { k, m: cs.m, x: cs.E || cs.v },
    };
  }

  // Electron, proton and alpha particle: which wavelength is longest, and by how much?
  function sameLambda(seed) {
    const r = rng(seed * 41 + 9);
    const same = r.pick(['v', 'E']), ask = r.pick(['short', 'long']), ratio = r.pick(['v', 'E']);
    const names = [L('the electron', 'das Elektron'), L('the proton', 'das Proton'), L('the alpha particle', 'das Alphateilchen')];
    const allSame = L('all the same', 'alle gleich');
    const qa = [
      [names[0], true],
      [names[1], false, L('The proton is heavier: at the same ' + (same === 'v' ? 'speed' : 'kinetic energy') + ' it has more momentum, so a shorter wavelength.', 'Das Proton ist schwerer: Bei gleicher ' + (same === 'v' ? 'Geschwindigkeit' : 'kinetischer Energie') + ' hat es mehr Impuls, also eine kürzere Wellenlänge.'), 'mass'],
      [names[2], false, L('The alpha particle is the heaviest: it has the most momentum and the shortest wavelength.', 'Das Alphateilchen ist am schwersten: Es hat am meisten Impuls und die kürzeste Wellenlänge.'), 'mass'],
      [allSame, false, L('λ = h/p, and the momentum depends on the mass.', 'λ = h/p, und der Impuls hängt von der Masse ab.'), 'mass'],
    ];
    const qb = ask === 'short' ? [
      [names[0], false, L('The electron is the lightest: it has the longest wavelength.', 'Das Elektron ist am leichtesten: Es hat die längste Wellenlänge.'), 'mass'],
      [names[1], false, L('The alpha particle is heavier and, with twice the charge, gains twice the energy: p = √(2·m·q·U).', 'Das Alphateilchen ist schwerer und gewinnt mit der doppelten Ladung die doppelte Energie: p = √(2·m·q·U).'), 'charge'],
      [names[2], true],
      [allSame, false, L('The voltage gives each the energy q·U, but λ = h/p depends on the momentum p = √(2·m·q·U).', 'Die Spannung gibt jedem die Energie q·U, aber λ = h/p hängt vom Impuls p = √(2·m·q·U) ab.'), 'mass'],
    ] : [
      [names[0], true],
      [names[1], false, L('The proton is about 1800 times heavier than the electron: more momentum, shorter wavelength.', 'Das Proton ist etwa 1800-mal schwerer als das Elektron: mehr Impuls, kürzere Wellenlänge.'), 'mass'],
      [names[2], false, L('The alpha particle is the heaviest and has twice the charge: the most momentum, the shortest wavelength.', 'Das Alphateilchen ist am schwersten und hat die doppelte Ladung: am meisten Impuls, die kürzeste Wellenlänge.'), 'charge'],
      [allSame, false, L('The voltage gives each the energy q·U, but λ = h/p depends on the momentum p = √(2·m·q·U).', 'Die Spannung gibt jedem die Energie q·U, aber λ = h/p hängt vom Impuls p = √(2·m·q·U) ab.'), 'mass'],
    ];
    const mr = M.mp / M.me, val = ratio === 'v' ? mr : Math.sqrt(mr);
    return {
      title: L('Light and heavy particles', 'Leichte und schwere Teilchen'),
      text: `<p>${L('An electron, a proton and an alpha particle (a helium nucleus: about four times the mass of a proton, twice its charge) are compared. No relativity is needed.', 'Ein Elektron, ein Proton und ein Alphateilchen (ein Heliumkern: etwa viermal die Masse eines Protons, doppelte Ladung) werden verglichen. Die Relativitätstheorie ist nicht nötig.')}</p>${CONST('me', 'mp')}`,
      figs: '',
      questions: [
        choice('a', same === 'v' ? L('(a) All three fly at the same speed. Which has the longest wavelength?', '(a) Alle drei fliegen gleich schnell. Welches hat die grösste Wellenlänge?') : L('(a) All three have the same kinetic energy. Which has the longest wavelength?', '(a) Alle drei haben dieselbe kinetische Energie. Welches hat die grösste Wellenlänge?'), opts(r, qa)),
        choice('b', ask === 'short' ? L('(b) All three start at rest and are accelerated through the same voltage. Which has the shortest wavelength?', '(b) Alle drei starten in Ruhe und werden mit derselben Spannung beschleunigt. Welches hat die kleinste Wellenlänge?') : L('(b) All three start at rest and are accelerated through the same voltage. Which has the longest wavelength?', '(b) Alle drei starten in Ruhe und werden mit derselben Spannung beschleunigt. Welches hat die grösste Wellenlänge?'), opts(r, qb)),
        numQ('r', ratio === 'v' ? L('(c) An electron and a proton have the same speed. By what factor is the wavelength of the electron longer?', '(c) Ein Elektron und ein Proton haben dieselbe Geschwindigkeit. Um welchen Faktor ist die Wellenlänge des Elektrons grösser?') : L('(c) An electron and a proton have the same kinetic energy. By what factor is the wavelength of the electron longer?', '(c) Ein Elektron und ein Proton haben dieselbe kinetische Energie. Um welchen Faktor ist die Wellenlänge des Elektrons grösser?'),
          `${lam}${sb('e')}/${lam}${sb('p')}`, '', val, { tol: 0.015, wrong: ratio === 'v' ? [{ value: Math.sqrt(mr), tag: 'sqrt', why: L('At the same speed, p = m·v: the ratio of the momenta is the ratio of the masses, without a square root.', 'Bei gleicher Geschwindigkeit ist p = m·v: Das Verhältnis der Impulse ist das Verhältnis der Massen, ohne Wurzel.') }] : [{ value: mr, tag: 'sqrt', why: WHY.sqrt() }] }),
      ],
      hints: [
        L(`${lam} = ${h}/${p}: the larger the momentum, the shorter the wavelength.`, `${lam} = ${h}/${p}: Je grösser der Impuls, desto kürzer die Wellenlänge.`),
        L(`Same speed: ${p} = ${m}·${v}. Same kinetic energy: ${p} = √(2·${m}·${Ek}).`, `Gleiche Geschwindigkeit: ${p} = ${m}·${v}. Gleiche kinetische Energie: ${p} = √(2·${m}·${Ek}).`),
        L(`Through a voltage ${U}, a particle of charge ${i('q')} gains ${Ek} = ${i('q')}·${U}, so ${p} = √(2·${m}·${i('q')}·${U}).`, `Mit einer Spannung ${U} gewinnt ein Teilchen der Ladung ${i('q')} die Energie ${Ek} = ${i('q')}·${U}, also ${p} = √(2·${m}·${i('q')}·${U}).`),
      ],
      solution: [
        L(`(a) ${same === 'v' ? `${p} = ${m}·${v}` : `${p} = √(2·${m}·${Ek})`}: the lightest particle has the least momentum and the longest wavelength, <b>the electron</b>.`, `(a) ${same === 'v' ? `${p} = ${m}·${v}` : `${p} = √(2·${m}·${Ek})`}: Das leichteste Teilchen hat den kleinsten Impuls und die grösste Wellenlänge, <b>das Elektron</b>.`),
        L(`(b) ${p} = √(2·${m}·${i('q')}·${U}): compare ${m}·${i('q')}. The alpha particle has about 4·${m}${sb('p')} and 2${i('e')}, so 8 times the product of the proton. ${ask === 'short' ? 'The shortest wavelength: <b>the alpha particle</b>.' : 'The longest wavelength: <b>the electron</b>.'}`, `(b) ${p} = √(2·${m}·${i('q')}·${U}): Vergleiche ${m}·${i('q')}. Das Alphateilchen hat etwa 4·${m}${sb('p')} und 2${i('e')}, also das 8-fache Produkt des Protons. ${ask === 'short' ? 'Die kleinste Wellenlänge: <b>das Alphateilchen</b>.' : 'Die grösste Wellenlänge: <b>das Elektron</b>.'}`),
        ratio === 'v' ? L(`(c) ${lam}${sb('e')}/${lam}${sb('p')} = ${p}${sb('p')}/${p}${sb('e')} = ${m}${sb('p')}/${m}${sb('e')} = 1.673 · 10<sup>−27</sup> kg / 9.109 · 10<sup>−31</sup> kg = <b>${plain(val, 4)}</b>.`, `(c) ${lam}${sb('e')}/${lam}${sb('p')} = ${p}${sb('p')}/${p}${sb('e')} = ${m}${sb('p')}/${m}${sb('e')} = 1.673 · 10<sup>−27</sup> kg / 9.109 · 10<sup>−31</sup> kg = <b>${plain(val, 4)}</b>.`)
          : L(`(c) ${lam}${sb('e')}/${lam}${sb('p')} = ${p}${sb('p')}/${p}${sb('e')} = √(${m}${sb('p')}/${m}${sb('e')}) = √${plain(mr, 4)} = <b>${plain(val)}</b>.`, `(c) ${lam}${sb('e')}/${lam}${sb('p')} = ${p}${sb('p')}/${p}${sb('e')} = √(${m}${sb('p')}/${m}${sb('e')}) = √${plain(mr, 4)} = <b>${plain(val)}</b>.`),
      ],
      p: { same, ask, ratio },
    };
  }

  // Electron diffraction at graphite: the ring radius against 1/√U gives the spacing of the planes.
  const LT = 0.135, DG = 0.213e-9; // m: the distance foil–screen, the spacing for the inner ring
  function rings(seed) {
    const r = rng(seed * 43 + 13);
    const Us = r.shuffle([2.5, 3, 3.5, 4, 4.5, 5]).slice(0, 5).sort((a, b) => a - b);
    const pts = Us.map((uk) => [1 / Math.sqrt(uk), Math.round((LT * M.lambdaU(uk * 1e3) / DG * 1e3 + r.gauss() * 0.15) * 10) / 10]);
    const k = pts.reduce((a, q) => a + q[0] * q[1], 0) / pts.reduce((a, q) => a + q[0] * q[0], 0); // mm·√kV
    const dd = (LT * M.h) / (k * 1e-3 * Math.sqrt(2 * M.me * M.e * 1e3)); // m
    const U0 = r.pick(Us), l0 = M.lambdaU(U0 * 1e3);
    const table = `<table class="data"><tr><th>${U} in kV</th>${Us.map((uk) => `<td>${plain(uk, 2)}</td>`).join('')}</tr><tr><th>${i('r')} in mm</th>${pts.map((q) => `<td>${q[1].toFixed(1)}</td>`).join('')}</tr></table>`;
    return {
      title: L('Electrons diffracted by graphite', 'Elektronenbeugung an Graphit'),
      text: `<p>${L(`In a diffraction tube, electrons accelerated through ${U} pass a thin graphite foil. On the screen, ${i('L')} = ${LT * 100} cm behind the foil, they make rings. The radius ${i('r')} of the inner ring is measured for several voltages.`, `In einer Beugungsröhre durchqueren Elektronen, die mit ${U} beschleunigt wurden, eine dünne Graphitfolie. Auf dem Schirm, ${i('L')} = ${LT * 100} cm hinter der Folie, bilden sie Ringe. Der Radius ${i('r')} des inneren Rings wird für mehrere Spannungen gemessen.`)}</p>${table}${CONST('h', 'e', 'me')}`,
      figs: fig(G.tube()) + fig(G.rGraph({ pts })),
      questions: [
        numQ('lam', L(`(a) the wavelength of the electrons at ${plain(U0, 2)} kV`, `(a) die Wellenlänge der Elektronen bei ${plain(U0, 2)} kV`), lam, 'pm', l0 * 1e12, { wrong: [{ value: (M.h * M.c) / (U0 * 1e3 * M.e) * 1e12, tag: 'photonp', why: WHY.photonp() }] }),
        numQ('d', L('(b) the spacing of the lattice planes, from the slope of the line through the points', '(b) der Abstand der Netzebenen, aus der Steigung der Geraden durch die Punkte'), d, 'nm', dd * 1e9, { tol: 0.04, wrong: [{ value: dd * 0.5e9, tag: 'angle', why: L('The beam is deflected by 2θ, twice the Bragg angle: r/L = 2θ = λ/d, so d = λ·L/r.', 'Der Strahl wird um 2θ abgelenkt, den doppelten Bragg-Winkel: r/L = 2θ = λ/d, also d = λ·L/r.') }] }),
        choice('x4', L('(c) The voltage is made four times as large. The radius of the ring', '(c) Die Spannung wird viermal so gross gemacht. Der Radius des Rings'), opts(r, [
          [L('halves', 'halbiert sich'), true],
          [L('becomes a quarter', 'wird ein Viertel'), false, WHY.sqrt(), 'sqrt'],
          [L('doubles', 'verdoppelt sich'), false, L('Faster electrons have a shorter wavelength: they are diffracted less, the ring shrinks.', 'Schnellere Elektronen haben eine kürzere Wellenlänge: Sie werden weniger gebeugt, der Ring schrumpft.'), 'inverse'],
          [L('stays the same', 'bleibt gleich'), false, L('The ring belongs to the crystal, but its size depends on the wavelength of the electrons.', 'Der Ring gehört zum Kristall, aber seine Grösse hängt von der Wellenlänge der Elektronen ab.'), 'other'],
        ])),
      ],
      hints: [
        L(`${lam} = ${h}/√(2·${m}·${i('e')}·${U}).`, `${lam} = ${h}/√(2·${m}·${i('e')}·${U}).`),
        L(`Bragg: 2${d}·sin θ = ${lam}. The beam is deflected by 2θ, and for small angles ${i('r')}/${i('L')} = 2θ, so ${i('r')} = ${i('L')}·${lam}/${d}.`, `Bragg: 2${d}·sin θ = ${lam}. Der Strahl wird um 2θ abgelenkt, und für kleine Winkel gilt ${i('r')}/${i('L')} = 2θ, also ${i('r')} = ${i('L')}·${lam}/${d}.`),
        L(`So ${i('r')} = (${i('L')}·${h}/(${d}·√(2${m}${i('e')})))·1/√${U}: the slope of the line is ${i('L')}·${h}/(${d}·√(2${m}${i('e')})). Solve for ${d}; mind the units (kV, mm).`, `Also ${i('r')} = (${i('L')}·${h}/(${d}·√(2${m}${i('e')})))·1/√${U}: Die Steigung der Geraden ist ${i('L')}·${h}/(${d}·√(2${m}${i('e')})). Löse nach ${d} auf; achte auf die Einheiten (kV, mm).`),
      ],
      solution: [
        L(`(a) ${lam} = ${h}/√(2·${m}·${i('e')}·${U}) = 6.626 · 10<sup>−34</sup> J·s / √(2 · 9.109 · 10<sup>−31</sup> kg · 1.602 · 10<sup>−19</sup> C · ${plain(U0 * 1e3, 4)} V) = <b>${plain(l0 * 1e12)} pm</b>.`, `(a) ${lam} = ${h}/√(2·${m}·${i('e')}·${U}) = 6.626 · 10<sup>−34</sup> J·s / √(2 · 9.109 · 10<sup>−31</sup> kg · 1.602 · 10<sup>−19</sup> C · ${plain(U0 * 1e3, 4)} V) = <b>${plain(l0 * 1e12)} pm</b>.`),
        L(`(b) The points lie on a line through the origin: ${i('r')} ∝ 1/√${U}, as ${lam} ∝ 1/√${U}. Its slope is ${plain(k)} mm·√kV = ${sci(k * 1e-3 * Math.sqrt(1e3))} m·√V. With ${i('r')} = ${i('L')}·${lam}/${d}: ${d} = ${i('L')}·${h}/(slope·√(2${m}${i('e')})) = 0.135 m · 6.626 · 10<sup>−34</sup> J·s / (${sci(k * 1e-3 * Math.sqrt(1e3))} m·√V · ${sci(Math.sqrt(2 * M.me * M.e))} kg·√(C)) = <b>${plain(dd * 1e9)} nm</b>, the spacing of the planes in graphite (0.213 nm).`, `(b) Die Punkte liegen auf einer Geraden durch den Ursprung: ${i('r')} ∝ 1/√${U}, wie ${lam} ∝ 1/√${U}. Ihre Steigung ist ${plain(k)} mm·√kV = ${sci(k * 1e-3 * Math.sqrt(1e3))} m·√V. Mit ${i('r')} = ${i('L')}·${lam}/${d}: ${d} = ${i('L')}·${h}/(Steigung·√(2${m}${i('e')})) = 0.135 m · 6.626 · 10<sup>−34</sup> J·s / (${sci(k * 1e-3 * Math.sqrt(1e3))} m·√V · ${sci(Math.sqrt(2 * M.me * M.e))} kg·√(C)) = <b>${plain(dd * 1e9)} nm</b>, der Abstand der Netzebenen in Graphit (0.213 nm).`),
        L(`(c) ${i('r')} ∝ ${lam} ∝ 1/√${U}: four times the voltage, <b>half the radius</b>. That the rings shrink as the electrons get faster was the proof that they come from the electrons’ waves, not from X-rays made in the tube.`, `(c) ${i('r')} ∝ ${lam} ∝ 1/√${U}: vierfache Spannung, <b>halber Radius</b>. Dass die Ringe schrumpfen, wenn die Elektronen schneller werden, bewies, dass sie von den Wellen der Elektronen stammen, nicht von Röntgenstrahlung aus der Röhre.`),
      ],
      solFig: fig(G.rGraph({ pts, slope: k, solve: true })),
      p: { Us, U0, r: pts.map((q) => q[1]) },
    };
  }

  // ---------------------------------------------------------------- single quanta at the double slit
  const SCREEN = {
    many: () => L('Electrons are sent one at a time through a double slit, both slits open. Which screen shows the hits after 10 000 electrons?', 'Elektronen werden einzeln durch einen Doppelspalt geschickt, beide Spalte offen. Welcher Schirm zeigt die Treffer nach 10 000 Elektronen?'),
    detector: () => L('Electrons are sent one at a time through a double slit, both slits open. A detector at the slits registers which slit each electron passes. Which screen shows the hits after 10 000 electrons?', 'Elektronen werden einzeln durch einen Doppelspalt geschickt, beide Spalte offen. Ein Detektor an den Spalten registriert, durch welchen Spalt jedes Elektron geht. Welcher Schirm zeigt die Treffer nach 10 000 Elektronen?'),
    few: () => L('Electrons are sent one at a time through a double slit, both slits open. Which screen shows the hits after the first 30 electrons?', 'Elektronen werden einzeln durch einen Doppelspalt geschickt, beide Spalte offen. Welcher Schirm zeigt die Treffer nach den ersten 30 Elektronen?'),
    one: () => L('Electrons are sent one at a time through a double slit, but one of the slits is closed. Which screen shows the hits after 10 000 electrons?', 'Elektronen werden einzeln durch einen Doppelspalt geschickt, aber einer der Spalte ist geschlossen. Welcher Schirm zeigt die Treffer nach 10 000 Elektronen?'),
  };
  const N = 900, FEW = 30;
  function buildup(seed) {
    const r = rng(seed * 47 + 17);
    const sc = r.pick(['many', 'detector', 'few', 'one']);
    const WRONG = {
      fringes: () => [L('Fringes need both slits open and no way of knowing which slit the electron took.', 'Streifen brauchen beide offenen Spalte und keine Möglichkeit zu wissen, welchen Spalt das Elektron nahm.'), sc === 'detector' ? 'which' : 'single'],
      classical: () => [L('Two narrow bands is what little balls would give. Electrons are diffracted at each slit: even one slit spreads them over a wide band.', 'Zwei schmale Streifen gäbe es bei kleinen Kugeln. Elektronen werden an jedem Spalt gebeugt: Schon ein Spalt verteilt sie über einen breiten Bereich.'), 'classical'],
      narrow: () => [L('A narrow band behind the slit is what little balls would give. The electrons are diffracted: one slit spreads them over a wide band.', 'Einen schmalen Streifen hinter dem Spalt gäbe es bei kleinen Kugeln. Die Elektronen werden gebeugt: Ein Spalt verteilt sie über einen breiten Bereich.'), 'classical'],
      broad: () => [L('A broad band without fringes is what you get when you know which slit each electron took, or with one slit closed.', 'Einen breiten Bereich ohne Streifen erhält man, wenn man weiss, durch welchen Spalt jedes Elektron ging, oder wenn ein Spalt zu ist.'), 'which'],
      smear: () => [L('Electrons never arrive smeared out: each one makes a single dot. Only the distribution of many dots has the shape of the wave.', 'Elektronen kommen nie verschmiert an: Jedes macht einen einzelnen Punkt. Erst die Verteilung vieler Punkte hat die Form der Welle.'), 'wave'],
      few: () => [L('After 10 000 electrons the screen is full of dots, not just a few.', 'Nach 10 000 Elektronen ist der Schirm voller Punkte, nicht nur ein paar.'), 'other'],
      many: () => [L('After only 30 electrons there are just 30 dots, and no fringes can be seen yet.', 'Nach nur 30 Elektronen gibt es erst 30 Punkte, und noch keine Streifen sind zu sehen.'), 'other'],
      fewTwo: () => [L('Even single electrons do not fly along two narrow paths: they land anywhere the wave is not dark.', 'Auch einzelne Elektronen fliegen nicht auf zwei schmalen Bahnen: Sie landen überall, wo die Welle nicht dunkel ist.'), 'classical'],
    };
    const S = {
      many: [['double', N, null], ['classical', N, 'classical'], ['which', N, 'broad'], ['double', FEW, 'few']],
      detector: [['which', N, null], ['double', N, 'fringes'], ['classical', N, 'classical'], ['smear', 0, 'smear']],
      few: [['double', FEW, null], ['smear', 0, 'smear'], ['double', N, 'many'], ['classical', FEW, 'fewTwo']],
      one: [['single', N, null], ['double', N, 'fringes'], ['narrow', N, 'narrow'], ['smear', 0, 'smear']],
    }[sc];
    const options = r.shuffle(S.map(([kind, n, w], k) => {
      const [why, tag] = w ? WRONG[w]() : ['', undefined];
      return { html: G.screen(kind, n, seed * 4 + k, { small: true }), ok: !w, why, tag };
    }));
    return {
      title: L('One electron at a time', 'Ein Elektron nach dem anderen'),
      text: `<p>${SCREEN[sc]()}</p>`,
      figs: '',
      questions: [
        pick('scr', L('Choose the screen.', 'Wähle den Schirm.'), options),
        choice('next', L('Can one predict where the next electron will land?', 'Kann man vorhersagen, wo das nächste Elektron landet?'), opts(r, [
          [L('no: only the probability for each place is known', 'nein: Bekannt ist nur die Wahrscheinlichkeit für jeden Ort'), true],
          [L('yes, if one knows exactly where and how it started', 'ja, wenn man genau weiss, wo und wie es gestartet ist'), false, L('Even with the same start, electrons land at different places: quantum physics only gives probabilities.', 'Auch bei gleichem Start landen Elektronen an verschiedenen Orten: Die Quantenphysik liefert nur Wahrscheinlichkeiten.'), 'determinism'],
          [L('yes: always at the brightest place', 'ja: immer an der hellsten Stelle'), false, L('The brightest place is only the most probable one; most electrons land elsewhere.', 'Die hellste Stelle ist nur die wahrscheinlichste; die meisten Elektronen landen anderswo.'), 'determinism'],
        ])),
      ],
      hints: [
        L('Each electron arrives whole and makes one dot; where it lands is random.', 'Jedes Elektron kommt ganz an und macht einen Punkt; wo es landet, ist zufällig.'),
        L('The probability of each place follows the intensity of the wave: with both slits open and no information about the path, that has interference fringes.', 'Die Wahrscheinlichkeit jedes Ortes folgt der Intensität der Welle: Mit beiden offenen Spalten und ohne Information über den Weg hat diese Interferenzstreifen.'),
        L('Knowing the slit (or closing one) destroys the fringes, but each slit still diffracts: a broad band remains.', 'Wer den Spalt kennt (oder einen schliesst), zerstört die Streifen, aber jeder Spalt beugt immer noch: Ein breiter Bereich bleibt.'),
      ],
      solution: [
        {
          many: L('After many electrons, the dots pile up in <b>fringes</b>: the interference pattern of the wave through both slits. Each electron made one dot; the pattern is their distribution.', 'Nach vielen Elektronen häufen sich die Punkte in <b>Streifen</b>: das Interferenzmuster der Welle durch beide Spalte. Jedes Elektron machte einen Punkt; das Muster ist ihre Verteilung.'),
          detector: L('Once it is known which slit each electron took, the fringes are gone: <b>a broad band without fringes</b>, the sum of the two single-slit patterns. The electrons are still diffracted at their slit, so there are no narrow bands either.', 'Sobald bekannt ist, durch welchen Spalt jedes Elektron ging, sind die Streifen weg: <b>ein breiter Bereich ohne Streifen</b>, die Summe der beiden Einzelspaltmuster. Die Elektronen werden an ihrem Spalt immer noch gebeugt, also gibt es auch keine schmalen Streifen.'),
          few: L('The first 30 electrons make <b>30 dots, scattered seemingly at random</b>. The fringes only appear once thousands of dots have piled up.', 'Die ersten 30 Elektronen machen <b>30 Punkte, scheinbar zufällig verteilt</b>. Die Streifen erscheinen erst, wenn sich Tausende von Punkten angesammelt haben.'),
          one: L('With one slit, the electrons are diffracted at that slit: <b>a broad band without fringes</b>. Fringes need two paths that the wave can take at once.', 'Mit einem Spalt werden die Elektronen an diesem Spalt gebeugt: <b>ein breiter Bereich ohne Streifen</b>. Streifen brauchen zwei Wege, die die Welle zugleich nehmen kann.'),
        }[sc],
        L('Where the next electron lands <b>cannot be predicted</b>: the wave gives only the probability of each place.', 'Wo das nächste Elektron landet, <b>lässt sich nicht vorhersagen</b>: Die Welle gibt nur die Wahrscheinlichkeit jedes Ortes an.'),
      ],
      p: { sc },
    };
  }

  const BANK_Q = [
    [() => L('Each electron makes a single dot on the screen.', 'Jedes Elektron macht einen einzelnen Punkt auf dem Schirm.'), true, () => L('It is detected whole, at one place.', 'Es wird ganz nachgewiesen, an einem Ort.')],
    [() => L('The fringes only appear after many electrons have arrived.', 'Die Streifen erscheinen erst, nachdem viele Elektronen angekommen sind.'), true, () => L('The pattern is the distribution of many single hits.', 'Das Muster ist die Verteilung vieler einzelner Treffer.')],
    [() => L('The fringes arise because electrons passing at the same time interfere with each other.', 'Die Streifen entstehen, weil gleichzeitig durchfliegende Elektronen miteinander interferieren.'), false, () => L('The fringes appear even when the electrons come one at a time: each interferes with itself.', 'Die Streifen erscheinen auch, wenn die Elektronen einzeln kommen: Jedes interferiert mit sich selbst.')],
    [() => L('Where a single electron lands can be predicted exactly.', 'Wo ein einzelnes Elektron landet, lässt sich genau vorhersagen.'), false, () => L('Only the probability of each place is known.', 'Bekannt ist nur die Wahrscheinlichkeit jedes Ortes.')],
    [() => L('Where the wave is bright, an electron is likely to land.', 'Wo die Welle hell ist, landet ein Elektron mit grosser Wahrscheinlichkeit.'), true, () => L('The intensity of the wave (|ψ|²) gives the probability.', 'Die Intensität der Welle (|ψ|²) gibt die Wahrscheinlichkeit an.')],
    [() => L('If a detector shows which slit each electron passes, the fringes disappear.', 'Zeigt ein Detektor, durch welchen Spalt jedes Elektron geht, verschwinden die Streifen.'), true, () => L('Information about the path destroys the interference.', 'Information über den Weg zerstört die Interferenz.')],
    [() => L('With a detector at the slits, two sharp bands appear behind the slits.', 'Mit einem Detektor an den Spalten erscheinen zwei scharfe Streifen hinter den Spalten.'), false, () => L('Each slit still diffracts: a broad band without fringes appears.', 'Jeder Spalt beugt immer noch: Es erscheint ein breiter Bereich ohne Streifen.')],
    [() => L('With one slit closed, the same fringes appear, only fainter.', 'Mit einem geschlossenen Spalt erscheinen dieselben Streifen, nur schwächer.'), false, () => L('One slit gives a broad band without the fringes of two slits.', 'Ein Spalt ergibt einen breiten Bereich ohne die Streifen zweier Spalte.')],
    [() => L('The electron splits into two halves, one going through each slit.', 'Das Elektron teilt sich in zwei Hälften, je eine geht durch einen Spalt.'), false, () => L('Wherever one looks, one finds a whole electron, never half of one.', 'Wo man auch nachschaut, findet man ein ganzes Elektron, nie ein halbes.')],
    [() => L('Photons sent one at a time give the same kind of pattern.', 'Einzeln geschickte Photonen ergeben dieselbe Art von Muster.'), true, () => L('Light and matter behave alike: single hits, distributed like the wave.', 'Licht und Materie verhalten sich gleich: einzelne Treffer, verteilt wie die Welle.')],
    [() => L('Even C<sub>60</sub> molecules have shown interference fringes.', 'Sogar C<sub>60</sub>-Moleküle haben Interferenzstreifen gezeigt.'), true, () => L('Vienna, 1999: molecules of 60 atoms behind a grating.', 'Wien, 1999: Moleküle aus 60 Atomen hinter einem Gitter.')],
    [() => L('Tennis balls thrown through two doors make visible fringes.', 'Tennisbälle, die durch zwei Türen geworfen werden, ergeben sichtbare Streifen.'), false, () => L('Their wavelength is about 10<sup>−34</sup> m: far too short for any visible fringes.', 'Ihre Wellenlänge ist etwa 10<sup>−34</sup> m: viel zu kurz für sichtbare Streifen.')],
    [() => L('In the middle of a dark fringe, (almost) no electron arrives.', 'In der Mitte eines dunklen Streifens kommt (fast) kein Elektron an.'), true, () => L('There the waves from the two slits cancel: the probability is (almost) zero.', 'Dort löschen sich die Wellen der beiden Spalte aus: Die Wahrscheinlichkeit ist (fast) null.')],
    [() => L('Between the source and the screen, the electron moves along a definite path.', 'Zwischen Quelle und Schirm bewegt sich das Elektron auf einer bestimmten Bahn.'), false, () => L('A definite path would mean a definite slit, and then there would be no fringes.', 'Eine bestimmte Bahn hiesse ein bestimmter Spalt, und dann gäbe es keine Streifen.')],
  ];
  const BANK_U = [
    [() => L('The uncertainty relation only says that our instruments are not exact enough.', 'Die Unschärferelation sagt nur, dass unsere Instrumente nicht genau genug sind.'), false, () => L('It is a property of the particle itself: it does not have an exact position and an exact momentum at once.', 'Sie ist eine Eigenschaft des Teilchens selbst: Es hat nicht zugleich einen genauen Ort und einen genauen Impuls.')],
    [() => L('An electron cannot have an exact position and an exact momentum at the same time.', 'Ein Elektron kann nicht zugleich einen genauen Ort und einen genauen Impuls haben.'), true, () => L('Δx·Δp ≥ h/(4π).', 'Δx·Δp ≥ h/(4π).')],
    [() => L('The more precisely the position is fixed, the larger the spread of the momentum.', 'Je genauer der Ort festgelegt ist, desto grösser die Streuung des Impulses.'), true, () => L('Δp ≥ h/(4π·Δx).', 'Δp ≥ h/(4π·Δx).')],
    [() => L('For a tennis ball, the uncertainty relation does not hold.', 'Für einen Tennisball gilt die Unschärferelation nicht.'), false, () => L('It holds, but h is so small that the uncertainties are far below anything measurable.', 'Sie gilt, aber h ist so klein, dass die Unschärfen weit unter allem Messbaren liegen.')],
    [() => L('An electron confined to a tiny region has a minimum kinetic energy.', 'Ein Elektron, das auf einen winzigen Bereich beschränkt ist, hat eine minimale kinetische Energie.'), true, () => L('A small Δx forces a large Δp, so the momentum cannot be zero.', 'Ein kleines Δx erzwingt ein grosses Δp, also kann der Impuls nicht null sein.')],
    [() => L('With a good enough microscope, one could follow the orbit of an electron in an atom.', 'Mit einem genügend guten Mikroskop könnte man die Bahn eines Elektrons im Atom verfolgen.'), false, () => L('An exact path would need exact position and momentum at once: there is no such orbit.', 'Eine genaue Bahn bräuchte zugleich genauen Ort und Impuls: Eine solche Bahn gibt es nicht.')],
    [() => L('A narrower slit makes the diffraction pattern behind it narrower.', 'Ein schmalerer Spalt macht das Beugungsmuster dahinter schmaler.'), false, () => L('A narrower slit (smaller Δx) means a larger Δp sideways: the pattern gets wider.', 'Ein schmalerer Spalt (kleineres Δx) bedeutet ein grösseres Δp seitwärts: Das Muster wird breiter.')],
    [() => L('Δx·Δp ≥ h/(4π) links position and momentum in the same direction.', 'Δx·Δp ≥ h/(4π) verknüpft Ort und Impuls in derselben Richtung.'), true, () => L('Position in x and momentum in y are not linked.', 'Ort in x und Impuls in y sind nicht verknüpft.')],
    [() => L('A particle locked in a box can never be completely at rest.', 'Ein Teilchen, das in eine Kiste gesperrt ist, kann nie ganz ruhen.'), true, () => L('At rest, Δp = 0, which would need Δx = ∞.', 'In Ruhe wäre Δp = 0, und das bräuchte Δx = ∞.')],
    [() => L('If the momentum of an electron is known exactly, its position is completely undetermined.', 'Ist der Impuls eines Elektrons genau bekannt, ist sein Ort völlig unbestimmt.'), true, () => L('Δp → 0 means Δx → ∞: a wave of one wavelength fills all space.', 'Δp → 0 heisst Δx → ∞: Eine Welle mit einer Wellenlänge füllt den ganzen Raum.')],
    [() => L('More modern instruments have beaten Heisenberg’s limit.', 'Modernere Instrumente haben Heisenbergs Grenze unterboten.'), false, () => L('No experiment has ever beaten it: it is not a limit of the instruments.', 'Kein Experiment hat sie je unterboten: Sie ist keine Grenze der Instrumente.')],
    [() => L('The smaller the mass, the larger the uncertainty of the velocity for the same Δx.', 'Je kleiner die Masse, desto grösser die Unschärfe der Geschwindigkeit bei gleichem Δx.'), true, () => L('Δv = Δp/m.', 'Δv = Δp/m.')],
  ];
  function stmts(bank, seed, salt) {
    const r = rng(seed * 61 + salt);
    for (;;) {
      const pk = r.shuffle(bank).slice(0, 5);
      if (pk.every((s) => s[1]) || pk.every((s) => !s[1])) continue;
      return { pk, idx: pk.map((s) => bank.indexOf(s)) };
    }
  }
  function quantaStmts(seed) {
    const { pk, idx } = stmts(BANK_Q, seed, 29);
    return {
      title: L('Single quanta: which statements are correct?', 'Einzelne Quanten: Welche Aussagen sind richtig?'),
      text: L('<p>Electrons are sent one at a time through a double slit. Tick all the statements that are correct.</p>', '<p>Elektronen werden einzeln durch einen Doppelspalt geschickt. Kreuze alle richtigen Aussagen an.</p>'), figs: fig(G.screen('double', 500, 3, {})),
      questions: [multi('s', pk.map(([t, ok, why]) => ({ html: t(), ok, why: why() })))],
      hints: [L('Each electron is found whole, at one place; the place is random.', 'Jedes Elektron wird ganz gefunden, an einem Ort; der Ort ist zufällig.'), L('The wave gives the probability; knowing the path destroys the fringes.', 'Die Welle gibt die Wahrscheinlichkeit an; Wissen über den Weg zerstört die Streifen.')],
      solution: pk.map(([t, ok, why]) => `${ok ? '✓' : '✗'} ${t()} ${why()}`),
      p: { s: idx },
    };
  }
  function uncertStmts(seed) {
    const { pk, idx } = stmts(BANK_U, seed, 37);
    return {
      title: L('The uncertainty relation: which statements are correct?', 'Die Unschärferelation: Welche Aussagen sind richtig?'),
      text: L('<p>Heisenberg: Δx·Δp ≥ h/(4π). Tick all the statements that are correct.</p>', '<p>Heisenberg: Δx·Δp ≥ h/(4π). Kreuze alle richtigen Aussagen an.</p>'), figs: '',
      questions: [multi('s', pk.map(([t, ok, why]) => ({ html: t(), ok, why: why() })))],
      hints: [L('The relation is about the particle, not about the instruments.', 'Die Beziehung handelt vom Teilchen, nicht von den Instrumenten.'), L('A small Δx forces a large Δp, and the other way round.', 'Ein kleines Δx erzwingt ein grosses Δp, und umgekehrt.')],
      solution: pk.map(([t, ok, why]) => `${ok ? '✓' : '✗'} ${t()} ${why()}`),
      p: { s: idx },
    };
  }

  // Double-slit experiments with electrons, C₆₀ and neutrons: the wavelength and the fringe spacing.
  function fringes(seed) {
    const r = rng(seed * 53 + 19);
    const k = r.pick(['e', 'c60', 'n']);
    const cs = {
      e: () => { const Uk = r.pick([10, 20, 30]); const pp = M.pOfU(M.me, Uk * 1e3); return { pp, x: Uk, dd: 2e-6, LL: 0.35, src: L('electron gun', 'Elektronenkanone'), what: L(`Electrons accelerated through ${Uk} kV pass a double slit with the spacing ${d} = 2.0 µm (Jönsson, 1961). The screen is ${i('L')} = 35 cm behind the slits; electron lenses then magnify the pattern.`, `Elektronen, die mit ${Uk} kV beschleunigt wurden, durchqueren einen Doppelspalt mit dem Spaltabstand ${d} = 2.0 µm (Jönsson, 1961). Der Schirm steht ${i('L')} = 35 cm hinter den Spalten; Elektronenlinsen vergrössern dann das Muster.`), c: ['h', 'e', 'me'], wrongL: (M.h * M.c) / (Uk * 1e3 * M.e) }; },
      c60: () => { const vv = r.pick([150, 200, 250]); const pp = 720 * M.u * vv; return { pp, x: vv, dd: 100e-9, LL: 1.25, src: L('oven', 'Ofen'), what: L(`C<sub>60</sub> molecules (720 u) fly at ${vv} m/s through a grating with the period ${d} = 100 nm (Vienna, 1999). The detector is ${i('L')} = 1.25 m behind the grating.`, `C<sub>60</sub>-Moleküle (720 u) fliegen mit ${vv} m/s durch ein Gitter mit der Periode ${d} = 100 nm (Wien, 1999). Der Detektor ist ${i('L')} = 1.25 m hinter dem Gitter.`), c: ['h', 'u'] }; },
      n: () => { const vv = r.pick([150, 200, 250]); const pp = M.mn * vv; return { pp, x: vv, dd: 126e-6, LL: 5, src: L('reactor', 'Reaktor'), what: L(`Very slow neutrons (${vv} m/s) from a reactor pass a double slit with the spacing ${d} = 126 µm (Zeilinger, 1988). The detector is ${i('L')} = 5.0 m behind the slits.`, `Sehr langsame Neutronen (${vv} m/s) aus einem Reaktor durchqueren einen Doppelspalt mit dem Spaltabstand ${d} = 126 µm (Zeilinger, 1988). Der Detektor ist ${i('L')} = 5.0 m hinter den Spalten.`), c: ['h', 'mn'] }; },
    }[k]();
    const lm = M.h / cs.pp, [lv, lu, ls] = lenUnit(lm), Dx = (lm * cs.LL) / cs.dd;
    const isE = k === 'e';
    return {
      title: L('Interference of matter', 'Interferenz von Materie'),
      text: `<p>${cs.what} ${L('Find the de Broglie wavelength and the spacing of neighbouring bright fringes.', 'Bestimme die de-Broglie-Wellenlänge und den Abstand benachbarter heller Streifen.')}</p>${CONST(...cs.c)}`,
      figs: fig(G.doubleSlit({ source: cs.src })),
      questions: [
        numQ('lam', L('(a) de Broglie wavelength', '(a) de-Broglie-Wellenlänge'), lam, lu, lv, { scale: ls, wrong: isE ? [{ value: cs.wrongL / ls, tag: 'photonp', why: WHY.photonp() }] : [] }),
        numQ('dx', L('(b) fringe spacing', '(b) Streifenabstand'), dx, 'µm', Dx * 1e6, { tol: 0.015, scale: 1e-6 }),
        choice('fast', isE ? L('(c) The voltage is made four times as large. The fringe spacing', '(c) Die Spannung wird viermal so gross gemacht. Der Streifenabstand') : L('(c) The particles are made twice as fast. The fringe spacing', '(c) Die Teilchen werden doppelt so schnell gemacht. Der Streifenabstand'), opts(r, [
          [L('halves', 'halbiert sich'), true],
          [L('becomes a quarter', 'wird ein Viertel'), false, isE ? WHY.sqrt() : L('λ = h/(m·v) is inversely proportional to the speed, not to its square.', 'λ = h/(m·v) ist umgekehrt proportional zur Geschwindigkeit, nicht zu ihrem Quadrat.'), 'sqrt'],
          [L('doubles', 'verdoppelt sich'), false, L('Faster particles have more momentum and a shorter wavelength: the fringes move closer together.', 'Schnellere Teilchen haben mehr Impuls und eine kürzere Wellenlänge: Die Streifen rücken zusammen.'), 'inverse'],
          [L('stays the same', 'bleibt gleich'), false, L('The fringe spacing is proportional to the wavelength, and that changes.', 'Der Streifenabstand ist proportional zur Wellenlänge, und die ändert sich.'), 'other'],
        ])),
      ],
      hints: [
        isE ? L(`${p} = √(2·${m}·${i('e')}·${U}), ${lam} = ${h}/${p}.`, `${p} = √(2·${m}·${i('e')}·${U}), ${lam} = ${h}/${p}.`) : L(`${p} = ${m}·${v}, ${lam} = ${h}/${p}.`, `${p} = ${m}·${v}, ${lam} = ${h}/${p}.`),
        L(`As for light: neighbouring bright fringes are ${dx} = ${lam}·${i('L')}/${d} apart (small angles).`, `Wie bei Licht: Benachbarte helle Streifen sind ${dx} = ${lam}·${i('L')}/${d} voneinander entfernt (kleine Winkel).`),
      ],
      solution: [
        L(`(a) ${p} = ${sci(cs.pp)} kg·m/s, so ${lam} = ${h}/${p} = <b>${len(lm)}</b>.`, `(a) ${p} = ${sci(cs.pp)} kg·m/s, also ${lam} = ${h}/${p} = <b>${len(lm)}</b>.`),
        L(`(b) ${dx} = ${lam}·${i('L')}/${d} = ${sci(lm)} m · ${cs.LL} m / ${sci(cs.dd, 3)} m = <b>${plain(Dx * 1e6)} µm</b>. ${isE ? 'Tiny: that is why the pattern had to be magnified.' : k === 'c60' ? 'The molecules are counted one by one with a scanning detector.' : 'The neutrons are counted one by one behind a narrow scanning slit.'}`, `(b) ${dx} = ${lam}·${i('L')}/${d} = ${sci(lm)} m · ${cs.LL} m / ${sci(cs.dd, 3)} m = <b>${plain(Dx * 1e6)} µm</b>. ${isE ? 'Winzig: Deshalb musste das Muster vergrössert werden.' : k === 'c60' ? 'Die Moleküle werden einzeln mit einem verschiebbaren Detektor gezählt.' : 'Die Neutronen werden einzeln hinter einem schmalen, verschiebbaren Spalt gezählt.'}`),
        isE ? L(`(c) ${lam} ∝ 1/√${U}: four times the voltage, half the wavelength, so the spacing <b>halves</b>.`, `(c) ${lam} ∝ 1/√${U}: vierfache Spannung, halbe Wellenlänge, also <b>halbiert sich</b> der Abstand.`) : L(`(c) ${lam} = ${h}/(${m}·${v}): twice the speed, half the wavelength, so the spacing <b>halves</b>.`, `(c) ${lam} = ${h}/(${m}·${v}): doppelte Geschwindigkeit, halbe Wellenlänge, also <b>halbiert sich</b> der Abstand.`),
      ],
      p: { k, x: cs.x },
    };
  }

  // ---------------------------------------------------------------- the uncertainty relation
  const GRAINS = [
    { en: 'a grain of dust of 1 µg', de: 'ein Staubkorn von 1 µg', m: 1e-9 },
    { en: 'a grain of pollen of 10 ng', de: 'ein Pollenkorn von 10 ng', m: 1e-11 },
    { en: 'a grain of sand of 1 mg', de: 'ein Sandkorn von 1 mg', m: 1e-6 },
  ];
  function uncert(seed) {
    const r = rng(seed * 67 + 31);
    const dxe = r.pick([0.05, 0.1, 0.2, 0.5]) * 1e-9, g = r.pick(GRAINS), dxg = r.pick([1, 10]) * 1e-6;
    const dpe = M.minDp(dxe), dve = dpe / M.me, dvg = M.minDp(dxg) / g.m;
    const [pv, pu, ps] = powUnit(dpe, 'kg·m/s'), [gv, gu, gs] = powUnit(dvg, 'm/s');
    return {
      title: L('How sharp can it be?', 'Wie scharf kann es sein?'),
      text: `<p>${L(`An electron is confined to a region of ${dx} = ${plain(dxe * 1e9)} nm (about the size of an atom). ${cap(g.en)} is located to within ${dx} = ${dxg * 1e6} µm. Find the smallest possible uncertainties of their momentum and velocity, with Heisenberg’s relation ${dx}·${dp} ≥ ${h}/(4π).`, `Ein Elektron ist auf einen Bereich von ${dx} = ${plain(dxe * 1e9)} nm beschränkt (etwa die Grösse eines Atoms). ${cap(g.de)} ist auf ${dx} = ${dxg * 1e6} µm genau lokalisiert. Bestimme die kleinstmöglichen Unschärfen ihres Impulses und ihrer Geschwindigkeit mit Heisenbergs Beziehung ${dx}·${dp} ≥ ${h}/(4π).`)}</p>${CONST('h', 'me')}`,
      figs: '',
      questions: [
        numQ('dp', L('(a) the uncertainty of the momentum of the electron', '(a) die Unschärfe des Impulses des Elektrons'), dp, pu, pv, { scale: ps, wrong: [{ value: M.h / dxe / ps, tag: 'hbar', why: WHY.hbar() }, { value: M.h / (2 * Math.PI * dxe) / ps, tag: 'hbar', why: WHY.hbar() }] }),
        numQ('dve', L('(b) the uncertainty of its velocity', '(b) die Unschärfe seiner Geschwindigkeit'), `Δ${v}`, 'km/s', dve / 1e3, { scale: 1e3, wrong: [{ value: M.h / dxe / M.me / 1e3, tag: 'hbar', why: WHY.hbar() }] }),
        numQ('dvg', L(`(c) the uncertainty of the velocity of the grain`, `(c) die Unschärfe der Geschwindigkeit des Korns`), `Δ${v}`, gu, gv, { scale: gs, wrong: [{ value: M.h / dxg / g.m / gs, tag: 'hbar', why: WHY.hbar() }] }),
      ],
      hints: [
        L(`The smallest ${dp}: ${dp} = ${h}/(4π·${dx}).`, `Das kleinste ${dp}: ${dp} = ${h}/(4π·${dx}).`),
        L(`${dp} = ${m}·Δ${v}, so Δ${v} = ${dp}/${m}. Write the mass in kilograms.`, `${dp} = ${m}·Δ${v}, also Δ${v} = ${dp}/${m}. Schreibe die Masse in Kilogramm.`),
      ],
      solution: [
        L(`(a) ${dp} = ${h}/(4π·${dx}) = 6.626 · 10<sup>−34</sup> J·s / (4π · ${sci(dxe, 2)} m) = <b>${sci(dpe)} kg·m/s</b>.`, `(a) ${dp} = ${h}/(4π·${dx}) = 6.626 · 10<sup>−34</sup> J·s / (4π · ${sci(dxe, 2)} m) = <b>${sci(dpe)} kg·m/s</b>.`),
        L(`(b) Δ${v} = ${dp}/${m} = ${sci(dpe)} kg·m/s / 9.109 · 10<sup>−31</sup> kg = <b>${plain(dve / 1e3)} km/s</b>: in an atom, the velocity of an electron is hugely uncertain. There is no orbit.`, `(b) Δ${v} = ${dp}/${m} = ${sci(dpe)} kg·m/s / 9.109 · 10<sup>−31</sup> kg = <b>${plain(dve / 1e3)} km/s</b>: Im Atom ist die Geschwindigkeit eines Elektrons riesig unscharf. Es gibt keine Bahn.`),
        L(`(c) ${dp} = ${sci(M.minDp(dxg))} kg·m/s, Δ${v} = ${dp}/${m} = <b>${sci(dvg)} m/s</b>: far below anything measurable. For everyday objects, the uncertainty relation does not show.`, `(c) ${dp} = ${sci(M.minDp(dxg))} kg·m/s, Δ${v} = ${dp}/${m} = <b>${sci(dvg)} m/s</b>: weit unter allem Messbaren. Bei Alltagsgegenständen zeigt sich die Unschärferelation nicht.`),
      ],
      p: { dxe, g: g.m, dxg },
    };
  }

  // Light through a single slit: the narrower the slit, the wider the pattern.
  function slitSpread(seed) {
    const r = rng(seed * 71 + 37);
    const nm = r.pick([405, 532, 633]), b = r.pick([5, 10, 20, 40]) * 1e-6, lm = nm * 1e-9;
    const al = (Math.asin(lm / b) * 180) / Math.PI, dpy = M.h / b, [pv, pu, ps] = powUnit(dpy, 'kg·m/s');
    const amax = Math.max(2, Math.ceil(al * 2.6));
    return {
      title: L('Uncertainty at a single slit', 'Unschärfe am Einzelspalt'),
      text: `<p>${L(`Laser light (${lam} = ${nm} nm) passes a single slit of width ${i('b')} = ${b * 1e6} µm. The first dark places on either side of the central maximum are at the angle α with sin α = ${lam}/${i('b')}.`, `Laserlicht (${lam} = ${nm} nm) durchquert einen Einzelspalt der Breite ${i('b')} = ${b * 1e6} µm. Die ersten dunklen Stellen beidseits des Hauptmaximums liegen beim Winkel α mit sin α = ${lam}/${i('b')}.`)}</p>${CONST('h')}`,
      figs: fig(G.slitGraph([{ b, lam: lm, cls: 'new' }], { amax })),
      questions: [
        numQ('al', L('(a) the angle of the first minimum', '(a) der Winkel des ersten Minimums'), 'α', '°', al, { tol: 0.015 }),
        numQ('dpy', L('(b) the spread of the photons’ momentum sideways, Δp<sub>y</sub> ≈ p·sin α', '(b) die Streuung des Photonenimpulses seitwärts, Δp<sub>y</sub> ≈ p·sin α'), `Δ${p}${sb('y')}`, pu, pv, { scale: ps, wrong: [{ value: M.h / (4 * Math.PI * b) / ps, tag: 'hbar', why: L('Here the spread comes from the angle: Δp<sub>y</sub> ≈ p·sin α = (h/λ)·(λ/b). Heisenberg’s h/(4π) is only a lower limit.', 'Hier folgt die Streuung aus dem Winkel: Δp<sub>y</sub> ≈ p·sin α = (h/λ)·(λ/b). Heisenbergs h/(4π) ist nur eine untere Grenze.') }] }),
        choice('nar', L('(c) The slit is made half as wide. The central maximum', '(c) Der Spalt wird halb so breit gemacht. Das Hauptmaximum'), opts(r, [
          [L('gets about twice as wide', 'wird etwa doppelt so breit'), true],
          [L('gets about half as wide', 'wird etwa halb so breit'), false, L('A narrower slit fixes the position better (smaller Δy), so the momentum sideways spreads more: the pattern gets wider.', 'Ein schmalerer Spalt legt den Ort genauer fest (kleineres Δy), also streut der Impuls seitwärts stärker: Das Muster wird breiter.'), 'width'],
          [L('stays the same', 'bleibt gleich'), false, L('sin α = λ/b depends on the width of the slit.', 'sin α = λ/b hängt von der Breite des Spalts ab.'), 'width'],
        ])),
      ],
      hints: [
        L(`α = arcsin(${lam}/${i('b')}).`, `α = arcsin(${lam}/${i('b')}).`),
        L(`A photon has ${p} = ${h}/${lam}. Deflected by α, its momentum sideways is ${p}·sin α.`, `Ein Photon hat ${p} = ${h}/${lam}. Um α abgelenkt, ist sein Impuls seitwärts ${p}·sin α.`),
        L('The slit fixes the position sideways to Δy ≈ b.', 'Der Spalt legt den Ort seitwärts auf Δy ≈ b fest.'),
      ],
      solution: [
        L(`(a) sin α = ${nm} · 10<sup>−9</sup> m / ${b * 1e6} · 10<sup>−6</sup> m = ${plain(lm / b)}, α = <b>${plain(al)}°</b>.`, `(a) sin α = ${nm} · 10<sup>−9</sup> m / ${b * 1e6} · 10<sup>−6</sup> m = ${plain(lm / b)}, α = <b>${plain(al)}°</b>.`),
        L(`(b) Δ${p}${sb('y')} ≈ ${p}·sin α = (${h}/${lam})·(${lam}/${i('b')}) = ${h}/${i('b')} = 6.626 · 10<sup>−34</sup> J·s / ${sci(b, 1)} m = <b>${sci(dpy)} kg·m/s</b>. With Δy = ${i('b')}: Δy·Δ${p}${sb('y')} ≈ ${h}, which is above ${h}/(4π), as Heisenberg demands.`, `(b) Δ${p}${sb('y')} ≈ ${p}·sin α = (${h}/${lam})·(${lam}/${i('b')}) = ${h}/${i('b')} = 6.626 · 10<sup>−34</sup> J·s / ${sci(b, 1)} m = <b>${sci(dpy)} kg·m/s</b>. Mit Δy = ${i('b')}: Δy·Δ${p}${sb('y')} ≈ ${h}, das ist mehr als ${h}/(4π), wie Heisenberg verlangt.`),
        L('(c) Half the width: sin α doubles, the central maximum gets <b>about twice as wide</b>. The better the position is fixed, the more the momentum spreads.', '(c) Halbe Breite: sin α verdoppelt sich, das Hauptmaximum wird <b>etwa doppelt so breit</b>. Je genauer der Ort festgelegt ist, desto mehr streut der Impuls.'),
      ],
      solFig: fig(G.slitGraph([{ b, lam: lm, cls: 'old', dash: true }, { b: b / 2, lam: lm, cls: 'new' }], { amax: Math.max(4, Math.ceil(al * 5.2)) })) + `<p class="note legend"><span class="k-old">- - -</span> ${i('b')} = ${b * 1e6} µm · <span class="k-new">—</span> ${i('b')} = ${b * 5e5} µm</p>`,
      p: { nm, b },
    };
  }

  // The energy of confinement: a particle locked in a small region cannot be at rest.
  function estimate(seed) {
    const r = rng(seed * 73 + 41);
    const isE = r.next() < 0.5;
    const dxx = isE ? r.pick([0.1, 0.2, 0.3]) * 1e-9 : r.pick([3, 5, 10]) * 1e-15;
    const mm = isE ? M.me : M.mp, pp = M.minDp(dxx), EJ = (pp * pp) / (2 * mm), EeV = EJ / M.e;
    const [eu, ef] = isE ? ['meV', 1e-3] : ['keV', 1e3];
    const [pv, pu, ps] = powUnit(pp, 'kg·m/s');
    return {
      title: L('No rest in a small space', 'Keine Ruhe auf kleinem Raum'),
      text: `<p>${isE ? L(`An electron is confined to a region of ${dx} = ${plain(dxx * 1e9)} nm.`, `Ein Elektron ist auf einen Bereich von ${dx} = ${plain(dxx * 1e9)} nm beschränkt.`) : L(`A proton is confined to a nucleus, a region of ${dx} = ${dxx * 1e15} fm (1 fm = 10<sup>−15</sup> m).`, `Ein Proton ist auf einen Atomkern beschränkt, einen Bereich von ${dx} = ${dxx * 1e15} fm (1 fm = 10<sup>−15</sup> m).`)} ${L(`Estimate its smallest kinetic energy: its momentum is at least about ${p} ≈ ${dp} = ${h}/(4π·${dx}).`, `Schätze seine kleinste kinetische Energie ab: Sein Impuls ist mindestens etwa ${p} ≈ ${dp} = ${h}/(4π·${dx}).`)}</p>${CONST('h', 'e', isE ? 'me' : 'mp')}`,
      figs: '',
      questions: [
        numQ('p', L('(a) the smallest momentum', '(a) der kleinste Impuls'), p, pu, pv, { scale: ps, wrong: [{ value: M.h / dxx / ps, tag: 'hbar', why: WHY.hbar() }] }),
        numQ('E', L('(b) the smallest kinetic energy', '(b) die kleinste kinetische Energie'), Ek, eu, EeV / ef, { scale: ef, wrong: [{ value: (2 * EeV) / ef, tag: 'half', why: WHY.half() }, { value: (16 * EeV) / ef, tag: 'hbar', why: WHY.hbar() }] }),
        choice('half', L('(c) The region is made half as large. The smallest kinetic energy becomes', '(c) Der Bereich wird halb so gross gemacht. Die kleinste kinetische Energie wird'), opts(r, [
          [L('four times as large', 'viermal so gross'), true],
          [L('twice as large', 'doppelt so gross'), false, L(`${p} ∝ 1/${dx}, and the energy goes with ${p}²: E ∝ 1/${dx}².`, `${p} ∝ 1/${dx}, und die Energie geht mit ${p}²: E ∝ 1/${dx}².`), 'square'],
          [L('half as large', 'halb so gross'), false, L('A smaller region forces a larger momentum, so more energy, not less.', 'Ein kleinerer Bereich erzwingt einen grösseren Impuls, also mehr Energie, nicht weniger.'), 'inverse'],
          [L('the same', 'gleich'), false, L(`The momentum depends on ${dx}: ${p} ≈ ${h}/(4π·${dx}).`, `Der Impuls hängt von ${dx} ab: ${p} ≈ ${h}/(4π·${dx}).`), 'other'],
        ])),
      ],
      hints: [
        L(`${p} ≈ ${h}/(4π·${dx}).`, `${p} ≈ ${h}/(4π·${dx}).`),
        L(`${Ek} = ${p}²/(2${m}), in joules; then divide by 1.602 · 10<sup>−19</sup> J/eV.`, `${Ek} = ${p}²/(2${m}), in Joule; dann durch 1.602 · 10<sup>−19</sup> J/eV teilen.`),
      ],
      solution: [
        L(`(a) ${p} ≈ 6.626 · 10<sup>−34</sup> J·s / (4π · ${sci(dxx, 2)} m) = <b>${sci(pp)} kg·m/s</b>.`, `(a) ${p} ≈ 6.626 · 10<sup>−34</sup> J·s / (4π · ${sci(dxx, 2)} m) = <b>${sci(pp)} kg·m/s</b>.`),
        L(`(b) ${Ek} = ${p}²/(2${m}) = (${sci(pp)} kg·m/s)² / (2 · ${sci(mm, 4)} kg) = ${sci(EJ)} J = <b>${plain(EeV / ef)} ${eu}</b>. ${isE ? 'Small, but never zero: an electron in an atom can never be at rest.' : 'Nuclear energies are of this size (keV to MeV): what holds the nucleus together must be far stronger than the electric forces in an atom.'}`, `(b) ${Ek} = ${p}²/(2${m}) = (${sci(pp)} kg·m/s)² / (2 · ${sci(mm, 4)} kg) = ${sci(EJ)} J = <b>${plain(EeV / ef)} ${eu}</b>. ${isE ? 'Klein, aber nie null: Ein Elektron im Atom kann nie ruhen.' : 'Kernenergien haben diese Grösse (keV bis MeV): Was den Kern zusammenhält, muss viel stärker sein als die elektrischen Kräfte im Atom.'}`),
        L(`(c) ${p} ∝ 1/${dx} and ${Ek} ∝ ${p}² ∝ 1/${dx}²: half the region, <b>four times the energy</b>.`, `(c) ${p} ∝ 1/${dx} und ${Ek} ∝ ${p}² ∝ 1/${dx}²: halber Bereich, <b>vierfache Energie</b>.`),
      ],
      p: { isE, dxx },
    };
  }

  // ---------------------------------------------------------------- tunnelling
  const AFTER = {
    longer: () => [WHY.energyloss(), 'energyloss'], shorter: () => [WHY.energyloss(), 'energyloss'],
    zero: () => [L('In classical physics nothing would get through. The wave decays inside the barrier but is not zero at its end: part of it goes on.', 'In der klassischen Physik käme nichts durch. Die Welle klingt in der Barriere ab, ist an ihrem Ende aber nicht null: Ein Teil geht weiter.'), 'classical'],
    same: () => [L('Behind the barrier the amplitude is smaller: only a small part gets through, most is reflected.', 'Hinter der Barriere ist die Amplitude kleiner: Nur ein kleiner Teil kommt durch, das meiste wird reflektiert.'), 'other'],
    inside: () => [L('Inside, the energy is below the top of the barrier: the wave does not oscillate there, it decays exponentially.', 'Innen ist die Energie unter der Oberkante der Barriere: Die Welle schwingt dort nicht, sie klingt exponentiell ab.'), 'inside'],
  };
  function tunnelPick(seed) {
    const r = rng(seed * 79 + 43);
    const wrongs = r.shuffle(Object.keys(AFTER)).slice(0, 3);
    const options = r.shuffle(['ok', ...wrongs].map((k) => { const [why, tag] = k === 'ok' ? ['', undefined] : AFTER[k](); return { html: G.barrier({ after: k, small: true, w: 300, h: 170 }), ok: k === 'ok', why, tag }; }));
    return {
      title: L('The wave at a barrier', 'Die Welle an einer Barriere'),
      text: `<p>${L(`An electron of energy ${i('E')} meets a barrier of height ${i('V')}${sb('0')} > ${i('E')}. A classical particle would bounce back.`, `Ein Elektron der Energie ${i('E')} trifft auf eine Barriere der Höhe ${i('V')}${sb('0')} > ${i('E')}. Ein klassisches Teilchen würde zurückprallen.`)}</p>`,
      figs: fig(G.barrier({ wave: false })),
      questions: [
        pick('psi', L('Which drawing shows the wavefunction (its real part) correctly?', 'Welche Zeichnung zeigt die Wellenfunktion (ihren Realteil) richtig?'), options),
        choice('E', L('An electron that got through has, behind the barrier,', 'Ein Elektron, das durchgekommen ist, hat hinter der Barriere'), opts(r, [
          [L('the same energy as before', 'dieselbe Energie wie vorher'), true],
          [L('less energy than before', 'weniger Energie als vorher'), false, WHY.energyloss(), 'energyloss'],
          [L('more energy than before', 'mehr Energie als vorher'), false, L('Where would it get it? Energy is conserved: the same energy, the same wavelength.', 'Woher sollte es sie haben? Die Energie bleibt erhalten: dieselbe Energie, dieselbe Wellenlänge.'), 'other'],
        ])),
      ],
      hints: [
        L('Before and behind the barrier, the energy is the same: so is the wavelength.', 'Vor und hinter der Barriere ist die Energie gleich: also auch die Wellenlänge.'),
        L(`Inside (${i('E')} < ${i('V')}${sb('0')}) the wave does not oscillate: it decays exponentially, ψ ∝ e<sup>−κx</sup>.`, `Innen (${i('E')} < ${i('V')}${sb('0')}) schwingt die Welle nicht: Sie klingt exponentiell ab, ψ ∝ e<sup>−κx</sup>.`),
        L('What is left at the end of the barrier goes on as a wave of smaller amplitude.', 'Was am Ende der Barriere übrig ist, läuft als Welle mit kleinerer Amplitude weiter.'),
      ],
      solution: [
        L('Before the barrier the wave oscillates; inside it decays exponentially; behind it, it oscillates again with <b>the same wavelength</b> and a <b>smaller amplitude</b>. The probability to find the electron behind the barrier, |ψ|², is small but not zero: it tunnels.', 'Vor der Barriere schwingt die Welle; innen klingt sie exponentiell ab; dahinter schwingt sie wieder mit <b>derselben Wellenlänge</b> und <b>kleinerer Amplitude</b>. Die Wahrscheinlichkeit, das Elektron hinter der Barriere zu finden, |ψ|², ist klein, aber nicht null: Es tunnelt.'),
        L('The electron that got through has <b>the same energy</b> as before: tunnelling costs no energy.', 'Das Elektron, das durchgekommen ist, hat <b>dieselbe Energie</b> wie vorher: Tunneln kostet keine Energie.'),
      ],
      solFig: fig(G.barrier({ after: 'ok', labels: true })),
      p: { w: wrongs },
    };
  }

  // Three barriers: which lets most through? Compare √(V₀ − E)·d.
  function tunnelRank(seed) {
    const r = rng(seed * 83 + 47);
    const tag = ['A', 'B', 'C'];
    for (;;) {
      const bs = [0, 1, 2].map(() => ({ dE: r.pick([0.5, 1, 2, 4, 8]), w: r.pick([0.2, 0.4, 0.6, 0.8, 1.0]) }));
      const S = bs.map((b) => Math.sqrt(b.dE) * b.w), best = S.indexOf(Math.min(...S));
      const sorted = [...S].sort((a, b) => a - b);
      if (sorted[1] / sorted[0] < 1.2) continue;
      const lowest = bs.map((b) => b.dE).indexOf(Math.min(...bs.map((b) => b.dE))), thinnest = bs.map((b) => b.w).indexOf(Math.min(...bs.map((b) => b.w)));
      if (lowest === best && thinnest === best) continue; // not a matter of one look
      if (new Set(bs.map((b) => b.dE)).size < 2 || new Set(bs.map((b) => b.w)).size < 2) continue;
      const Ts = bs.map((b) => M.trans(M.me, b.dE, b.w * 1e-9));
      const table = `<table class="data"><tr><th></th><th>${i('V')}${sb('0')} − ${i('E')}</th><th>${d}</th></tr>${bs.map((b, k) => `<tr><td><b>${tag[k]}</b></td><td>${b.dE} eV</td><td>${b.w} nm</td></tr>`).join('')}</table>`;
      const whyOf = (k) => (k === lowest ? L('It is the lowest barrier, but the width counts as well: compare √(V₀ − E)·d.', 'Sie ist die niedrigste Barriere, aber die Breite zählt auch: Vergleiche √(V₀ − E)·d.') : k === thinnest ? L('It is the thinnest barrier, but the height counts as well: compare √(V₀ − E)·d.', 'Sie ist die dünnste Barriere, aber die Höhe zählt auch: Vergleiche √(V₀ − E)·d.') : L('T ≈ e^(−2κd) with κ ∝ √(V₀ − E): the smaller √(V₀ − E)·d, the larger T.', 'T ≈ e^(−2κd) mit κ ∝ √(V₀ − E): Je kleiner √(V₀ − E)·d, desto grösser T.'));
      return {
        title: L('Which barrier is easiest?', 'Welche Barriere ist am leichtesten?'),
        text: `<p>${L('Electrons meet three barriers: how far the top of each lies above their energy, and how wide it is.', 'Elektronen treffen auf drei Barrieren: wie weit die Oberkante jeder Barriere über ihrer Energie liegt, und wie breit sie ist.')}</p>${table}`,
        figs: fig(G.barrier({ wave: false, dE: true })),
        questions: [
          choice('best', L('(a) Through which barrier do the most electrons tunnel?', '(a) Durch welche Barriere tunneln am meisten Elektronen?'), opts(r, [...tag.map((t, k) => [t, k === best, whyOf(k), 'tunnel']), [L('all the same', 'alle gleich'), false, L('The transmission depends strongly on both height and width.', 'Die Transmission hängt stark von Höhe und Breite ab.'), 'tunnel']], true)),
          choice('mass', L(`(b) A proton with the same energy meets barrier ${tag[best]}. It tunnels`, `(b) Ein Proton mit derselben Energie trifft auf Barriere ${tag[best]}. Es tunnelt`), opts(r, [
            [L('far less often than an electron', 'viel seltener als ein Elektron'), true],
            [L('just as often as an electron', 'gleich oft wie ein Elektron'), false, L('κ = √(2m(V₀ − E))/ħ grows with the mass: the heavier proton decays much faster inside.', 'κ = √(2m(V₀ − E))/ħ wächst mit der Masse: Beim schwereren Proton klingt die Welle innen viel schneller ab.'), 'mass'],
            [L('more often than an electron', 'häufiger als ein Elektron'), false, L('κ = √(2m(V₀ − E))/ħ grows with the mass: heavier particles tunnel less.', 'κ = √(2m(V₀ − E))/ħ wächst mit der Masse: Schwerere Teilchen tunneln weniger.'), 'mass'],
          ])),
        ],
        hints: [
          L(`${T} ≈ e<sup>−2${kap}${d}</sup> with ${kap} = √(2${m}(${i('V')}${sb('0')} − ${i('E')}))/${hb}.`, `${T} ≈ e<sup>−2${kap}${d}</sup> mit ${kap} = √(2${m}(${i('V')}${sb('0')} − ${i('E')}))/${hb}.`),
          L(`For the same particle, compare √(${i('V')}${sb('0')} − ${i('E')})·${d}: the smallest wins.`, `Für dasselbe Teilchen vergleiche √(${i('V')}${sb('0')} − ${i('E')})·${d}: Das kleinste gewinnt.`),
        ],
        solution: [
          L(`(a) √(V₀ − E)·d: ${bs.map((b, k) => `${tag[k]}: ${plain(S[k])}`).join(', ')} (in √eV·nm). The smallest: <b>${tag[best]}</b>. ${bs.map((b, k) => `${tag[k]}: ${T} ≈ ${sci(Ts[k], 2)}`).join(', ')}.`, `(a) √(V₀ − E)·d: ${bs.map((b, k) => `${tag[k]}: ${plain(S[k])}`).join(', ')} (in √eV·nm). Das kleinste: <b>${tag[best]}</b>. ${bs.map((b, k) => `${tag[k]}: ${T} ≈ ${sci(Ts[k], 2)}`).join(', ')}.`),
          L(`(b) The proton is 1836 times heavier: ${kap} is √1836 ≈ 43 times larger, and ${T} drops to ${sci(M.trans(M.mp, bs[best].dE, bs[best].w * 1e-9), 2)}: <b>far less often</b>. Tunnelling is mostly a matter for electrons (and for alpha particles in nuclei, where the barriers are tiny).`, `(b) Das Proton ist 1836-mal schwerer: ${kap} ist √1836 ≈ 43-mal grösser, und ${T} fällt auf ${sci(M.trans(M.mp, bs[best].dE, bs[best].w * 1e-9), 2)}: <b>viel seltener</b>. Tunneln ist vor allem eine Sache der Elektronen (und der Alphateilchen in Kernen, wo die Barrieren winzig sind).`),
        ],
        p: { bs: bs.map((b) => `${b.dE}:${b.w}`) },
      };
    }
  }

  function tunnel(seed) {
    const r = rng(seed * 89 + 53);
    for (;;) {
      const dE = r.pick([0.5, 1, 2, 3, 4]), w = r.pick([0.2, 0.3, 0.5, 0.8, 1.0]), E0 = r.pick([1, 2, 5]);
      const kk = M.kappa(M.me, dE), Tt = M.trans(M.me, dE, w * 1e-9);
      if (Tt < 1e-8 || Tt > 0.3) continue;
      const [tv, tu, ts] = powUnit(Tt, '');
      return {
        title: L('Tunnelling through a barrier', 'Tunneln durch eine Barriere'),
        text: `<p>${L(`Electrons of energy ${i('E')} = ${E0} eV meet a barrier of height ${i('V')}${sb('0')} = ${E0 + dE} eV and width ${d} = ${w} nm. The fraction that tunnels through is about ${T} ≈ e<sup>−2${kap}${d}</sup> with ${kap} = √(2${m}(${i('V')}${sb('0')} − ${i('E')}))/${hb}.`, `Elektronen der Energie ${i('E')} = ${E0} eV treffen auf eine Barriere der Höhe ${i('V')}${sb('0')} = ${E0 + dE} eV und der Breite ${d} = ${w} nm. Der Anteil, der durchtunnelt, ist etwa ${T} ≈ e<sup>−2${kap}${d}</sup> mit ${kap} = √(2${m}(${i('V')}${sb('0')} − ${i('E')}))/${hb}.`)}</p>${CONST('hbar', 'e', 'me')}`,
        figs: fig(G.barrier({ dE: true, wave: false })),
        questions: [
          numQ('k', L('(a) the decay constant', '(a) die Abklingkonstante'), kap, '1/nm', kk * 1e-9, { tol: 0.012, wrong: [{ value: (kk * 1e-9) / (2 * Math.PI), tag: 'hbar', why: WHY.hbarK() }] }),
          numQ('T', L('(b) the fraction that tunnels through', '(b) der Anteil, der durchtunnelt'), T, tu, tv, { tol: 0.1, scale: ts, wrong: [{ value: Math.exp(-kk * w * 1e-9) / ts, tag: 'factor2', why: WHY.factor2() }] }),
          choice('w2', L('(c) The barrier is made twice as wide. The fraction that tunnels', '(c) Die Barriere wird doppelt so breit gemacht. Der Anteil, der durchtunnelt,'), opts(r, [
            [L(`is squared: about ${sci(Tt * Tt, 2)}`, `wird quadriert: etwa ${sci(Tt * Tt, 2)}`), true],
            [L('halves', 'halbiert sich'), false, L('T falls exponentially with the width: e<sup>−2κ·2d</sup> = (e<sup>−2κd</sup>)², far less than half.', 'T fällt exponentiell mit der Breite: e<sup>−2κ·2d</sup> = (e<sup>−2κd</sup>)², viel weniger als die Hälfte.'), 'linear'],
            [L('becomes a quarter', 'wird ein Viertel'), false, L('T falls exponentially with the width: e<sup>−2κ·2d</sup> = (e<sup>−2κd</sup>)².', 'T fällt exponentiell mit der Breite: e<sup>−2κ·2d</sup> = (e<sup>−2κd</sup>)².'), 'linear'],
          ])),
        ],
        hints: [
          L(`${i('V')}${sb('0')} − ${i('E')} = ${plain(dE)} eV = ${sci(dE * M.e)} J.`, `${i('V')}${sb('0')} − ${i('E')} = ${plain(dE)} eV = ${sci(dE * M.e)} J.`),
          L(`${kap} = √(2 · 9.109 · 10<sup>−31</sup> kg · ${sci(dE * M.e)} J) / 1.055 · 10<sup>−34</sup> J·s, in 1/m; 1/m = 10<sup>−9</sup>/nm.`, `${kap} = √(2 · 9.109 · 10<sup>−31</sup> kg · ${sci(dE * M.e)} J) / 1.055 · 10<sup>−34</sup> J·s, in 1/m; 1/m = 10<sup>−9</sup>/nm.`),
          L(`Then ${T} ≈ e<sup>−2${kap}${d}</sup>: 2${kap}${d} has no unit.`, `Dann ${T} ≈ e<sup>−2${kap}${d}</sup>: 2${kap}${d} hat keine Einheit.`),
        ],
        solution: [
          L(`(a) ${kap} = √(2${m}(${i('V')}${sb('0')} − ${i('E')}))/${hb} = √(2 · 9.109 · 10<sup>−31</sup> kg · ${sci(dE * M.e)} J) / 1.055 · 10<sup>−34</sup> J·s = ${sci(kk)} 1/m = <b>${plain(kk * 1e-9)} 1/nm</b>.`, `(a) ${kap} = √(2${m}(${i('V')}${sb('0')} − ${i('E')}))/${hb} = √(2 · 9.109 · 10<sup>−31</sup> kg · ${sci(dE * M.e)} J) / 1.055 · 10<sup>−34</sup> J·s = ${sci(kk)} 1/m = <b>${plain(kk * 1e-9)} 1/nm</b>.`),
          L(`(b) 2${kap}${d} = 2 · ${plain(kk * 1e-9)} 1/nm · ${w} nm = ${plain(2 * kk * w * 1e-9)}, ${T} ≈ e<sup>−${plain(2 * kk * w * 1e-9)}</sup> = <b>${sci(Tt)}</b>: one electron in ${plain(1 / Tt, 2)} gets through.`, `(b) 2${kap}${d} = 2 · ${plain(kk * 1e-9)} 1/nm · ${w} nm = ${plain(2 * kk * w * 1e-9)}, ${T} ≈ e<sup>−${plain(2 * kk * w * 1e-9)}</sup> = <b>${sci(Tt)}</b>: Eines von ${plain(1 / Tt, 2)} Elektronen kommt durch.`),
          L(`(c) e<sup>−2${kap}·2${d}</sup> = (e<sup>−2${kap}${d}</sup>)²: <b>squared</b>, ${sci(Tt * Tt, 2)}. Tunnelling is extremely sensitive to the width of the barrier: that is what the scanning tunnelling microscope uses.`, `(c) e<sup>−2${kap}·2${d}</sup> = (e<sup>−2${kap}${d}</sup>)²: <b>quadriert</b>, ${sci(Tt * Tt, 2)}. Tunneln reagiert äusserst empfindlich auf die Breite der Barriere: Das nutzt das Rastertunnelmikroskop.`),
        ],
        p: { dE, w, E0 },
      };
    }
  }

  // ---------------------------------------------------------------- all types
  const TYPES = {
    debroglie: [1, debroglie], particle: [2, particle], 'same-lambda': [2, sameLambda], rings: [4, rings],
    buildup: [2, buildup], 'quanta-stmts': [2, quantaStmts], fringes: [3, fringes],
    uncert: [2, uncert], 'slit-spread': [3, slitSpread], estimate: [3, estimate], 'uncert-stmts': [2, uncertStmts],
    'tunnel-pick': [2, tunnelPick], 'tunnel-rank': [3, tunnelRank], tunnel: [3, tunnel],
  };
  function make(type, seed) {
    const [difficulty, fn] = TYPES[type];
    return { ...fn(seed), type, difficulty, id: `${type}-${seed}`, seed };
  }

  const api = { TYPES: Object.keys(TYPES), make, BANK_Q, BANK_U, WHY, i, sb, CONST, numQ, choice, pick, opts, fig, len, powUnit };
  root.MatterEx = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
