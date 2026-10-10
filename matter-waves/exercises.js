// The exercises of Matter Waves and the Particle in a Box, with their texts in the current language
// (the app rebuilds them when the language changes). Every exercise has the form
//   { id, type, difficulty, title, text, figs (HTML), questions, hints, solution (HTML paragraphs),
//     solFig, p (what makes it new to the student) }
// with questions of four kinds:
//   { type: 'num', key, label, sym, unit, value, tol, abs, scale, wrong: [{ value, tag, why }] }
//        a number in the unit shown; tol: the relative error allowed, abs: an absolute one; wrong:
//        the results of typical mistakes, each with what went wrong
//   { type: 'choice', key, label, options: [{ label, ok, why, tag }] }   one of a few answers
//   { type: 'pick', key, label, options: [{ html, ok, why, tag }] }       one of a few drawings
//   { type: 'multi', key, statements: [{ html, ok, why }] }              statements to tick
// The tags name the wrong idea behind an answer (the check's misconceptions, app.js). No calculator:
// the numbers are worked out by ratios from one value given.
// The types, by topic:
//   debroglie, same-lambda, diffraction         the de Broglie wavelength by ratios, electron diffraction
//   box-pick, box-energy                        the particle in a box: standing waves, E_n ∝ n²/L²
//   density, uncert-stmts                       |ψ|² as a probability density, the uncertainty relation
(function (root) {
  'use strict';

  const M = root.MatterWave || require('./physics.js');
  const G = root.MatterPlot || require('./plot.js');
  const Lang = root.Lang || require('./lang.js');
  const L = (en, de) => Lang.L(en, de);
  const { rng, plain } = M;

  // ---------------------------------------------------------------- writing
  const i = (s) => `<i>${s}</i>`;
  const sb = (s) => `<sub>${s}</sub>`;
  const lam = i('λ'), p = i('p'), m = i('m'), v = i('v'), h = i('h'), U = i('U'), Ek = `${i('E')}${sb('kin')}`, dx = `Δ${i('x')}`, dp = `Δ${i('p')}`, Lb = i('L'), n = i('n'), E1 = `${i('E')}${sb('1')}`, psi2 = `|${i('ψ')}|²`, xm = `⟨${i('x')}⟩`;
  const fig = (html) => `<div class="fig">${html}</div>`;
  // a multiple of the width L, as a fraction: 2L/3, L/2, 2L
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const ofL = (num, den) => { const g = gcd(num, den); num /= g; den /= g; return `${num === 1 ? '' : num}${Lb}${den === 1 ? '' : `/${den}`}`; };

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
    sqrt: () => L('The momentum grows with the square root of the energy: p = √(2·m·E<sub>kin</sub>), so λ ∝ 1/√E<sub>kin</sub> ∝ 1/√U.', 'Der Impuls wächst mit der Wurzel der Energie: p = √(2·m·E<sub>kin</sub>), also λ ∝ 1/√E<sub>kin</sub> ∝ 1/√U.'),
    inverse: () => L('More energy means more momentum, so a shorter wavelength: λ = h/p.', 'Mehr Energie bedeutet mehr Impuls, also eine kürzere Wellenlänge: λ = h/p.'),
    nsq: () => L('E<sub>n</sub> = n²·h²/(8·m·L²): the energy grows with n², not with n.', 'E<sub>n</sub> = n²·h²/(8·m·L²): Die Energie wächst mit n², nicht mit n.'),
    lsq: () => L('λ ∝ L, so p ∝ 1/L and E = p²/(2m) ∝ 1/L².', 'λ ∝ L, also p ∝ 1/L und E = p²/(2m) ∝ 1/L².'),
  };

  // ---------------------------------------------------------------- the de Broglie wavelength
  // One value worked out once (an electron through 150 V has λ = 100 pm), the rest by ratios.
  function debroglie(seed) {
    const r = rng(seed * 31 + 3);
    const k = r.pick([2, 3, 4, 0.5]), Uv = 150 * k * k, l1 = 100 / k;
    const lPh = 1239.8 / Uv, ratio = (lPh * 1e3) / l1; // nm, the photon's; how many times longer
    return {
      title: L('The wavelength by comparison', 'Die Wellenlänge im Vergleich'),
      text: `<p>${L(`An electron that starts at rest and is accelerated through ${U} = 150 V has the de Broglie wavelength ${lam} = 100 pm. Another electron is accelerated through ${U} = ${plain(Uv, 4)} V.`, `Ein Elektron, das in Ruhe startet und mit ${U} = 150 V beschleunigt wird, hat die de-Broglie-Wellenlänge ${lam} = 100 pm. Ein anderes Elektron wird mit ${U} = ${plain(Uv, 4)} V beschleunigt.`)}</p>`,
      figs: '',
      questions: [
        numQ('lam', L(`(a) its wavelength, without a calculator`, `(a) seine Wellenlänge, ohne Taschenrechner`), lam, 'pm', l1, { wrong: [{ value: 100 / (k * k), tag: 'sqrt', why: WHY.sqrt() }, { value: 100 * k, tag: 'inverse', why: WHY.inverse() }] }),
        choice('p', L(`(b) Its momentum, from its kinetic energy ${Ek}, is`, `(b) Sein Impuls, aus seiner kinetischen Energie ${Ek}, ist`), opts(r, [
          [`${p} = √(2·${m}·${Ek})`, true],
          [`${p} = ${Ek}/${i('c')}`, false, WHY.photonp(), 'photonp'],
          [`${p} = 2·${m}·${Ek}`, false, L(`${Ek} = ${p}²/(2${m}): the momentum is the square root of 2·${m}·${Ek}.`, `${Ek} = ${p}²/(2${m}): Der Impuls ist die Wurzel aus 2·${m}·${Ek}.`), 'sqrt'],
          [`${p} = ½·${m}·${v}²`, false, L(`That is the kinetic energy. The momentum is ${p} = ${m}·${v} = √(2·${m}·${Ek}).`, `Das ist die kinetische Energie. Der Impuls ist ${p} = ${m}·${v} = √(2·${m}·${Ek}).`), 'other'],
        ])),
        choice('ph', L(`(c) A photon has the same energy, ${plain(Uv, 4)} eV. Its wavelength is`, `(c) Ein Photon hat dieselbe Energie, ${plain(Uv, 4)} eV. Seine Wellenlänge ist`), opts(r, [
          [L('much longer than the electron’s', 'viel länger als die des Elektrons'), true],
          [L(`the same, ${plain(l1)} pm`, `dieselbe, ${plain(l1)} pm`), false, L(`Same energy, but not the same momentum: the photon has ${p} = ${i('E')}/${i('c')}, the electron ${p} = √(2·${m}·${Ek}), which is far larger.`, `Dieselbe Energie, aber nicht derselbe Impuls: Das Photon hat ${p} = ${i('E')}/${i('c')}, das Elektron ${p} = √(2·${m}·${Ek}), und das ist viel grösser.`), 'photonp'],
          [L('much shorter than the electron’s', 'viel kürzer als die des Elektrons'), false, L(`At the same energy, the photon has the smaller momentum ${i('E')}/${i('c')}, so the longer wavelength.`, `Bei gleicher Energie hat das Photon den kleineren Impuls ${i('E')}/${i('c')}, also die längere Wellenlänge.`), 'photonp'],
        ])),
      ],
      hints: [
        L(`${lam} = ${h}/${p}, and the electron gains ${Ek} = ${i('e')}·${U}, so ${p} = √(2·${m}·${i('e')}·${U}).`, `${lam} = ${h}/${p}, und das Elektron gewinnt ${Ek} = ${i('e')}·${U}, also ${p} = √(2·${m}·${i('e')}·${U}).`),
        L(`So ${lam} ∝ 1/√${U}. By what factor has the voltage changed? Take its square root.`, `Also ${lam} ∝ 1/√${U}. Um welchen Faktor hat sich die Spannung geändert? Zieh die Wurzel daraus.`),
        L(`A photon has ${p} = ${i('E')}/${i('c')}; a particle with mass does not.`, `Ein Photon hat ${p} = ${i('E')}/${i('c')}; ein Teilchen mit Masse nicht.`),
      ],
      solution: [
        L(`(a) ${U} is ${plain(k * k, 2)} times as large, so ${p} = √(2·${m}·${i('e')}·${U}) is √${plain(k * k, 2)} = ${plain(k, 2)} times as large, and ${lam} = ${h}/${p} is ${plain(k, 2)} times ${k > 1 ? 'shorter' : 'longer'}: ${lam} = 100 pm / ${plain(k, 2)} = <b>${plain(l1)} pm</b>.`, `(a) ${U} ist ${plain(k * k, 2)}-mal so gross, also ist ${p} = √(2·${m}·${i('e')}·${U}) √${plain(k * k, 2)} = ${plain(k, 2)}-mal so gross, und ${lam} = ${h}/${p} ist ${plain(k, 2)}-mal so ${k > 1 ? 'kurz' : 'lang'}: ${lam} = 100 pm / ${plain(k, 2)} = <b>${plain(l1)} pm</b>.`),
        L(`(b) ${Ek} = ½·${m}·${v}² = ${p}²/(2${m}), so <b>${p} = √(2·${m}·${Ek})</b>.`, `(b) ${Ek} = ½·${m}·${v}² = ${p}²/(2${m}), also <b>${p} = √(2·${m}·${Ek})</b>.`),
        L(`(c) The photon has ${p} = ${i('E')}/${i('c')}, far less than the electron’s √(2·${m}·${Ek}): its wavelength, ${lam} = ${h}·${i('c')}/${i('E')} = ${plain(lPh)} nm, is <b>much longer</b>, about ${plain(ratio, 2)} times. The photon’s formula must not be used for the electron.`, `(c) Das Photon hat ${p} = ${i('E')}/${i('c')}, viel weniger als das √(2·${m}·${Ek}) des Elektrons: Seine Wellenlänge, ${lam} = ${h}·${i('c')}/${i('E')} = ${plain(lPh)} nm, ist <b>viel länger</b>, etwa ${plain(ratio, 2)}-mal. Die Formel des Photons darf man für das Elektron nicht brauchen.`),
      ],
      p: { k },
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
    const qc = ratio === 'v' ? [
      [L('about 1840 times longer', 'etwa 1840-mal länger'), true],
      [L('about 43 times longer', 'etwa 43-mal länger'), false, L('At the same speed, p = m·v: the ratio of the momenta is the ratio of the masses, without a square root.', 'Bei gleicher Geschwindigkeit ist p = m·v: Das Verhältnis der Impulse ist das Verhältnis der Massen, ohne Wurzel.'), 'sqrt'],
      [L('the same', 'gleich lang'), false, L('Same speed, but not the same momentum: p = m·v.', 'Gleiche Geschwindigkeit, aber nicht derselbe Impuls: p = m·v.'), 'mass'],
      [L('about 1840 times shorter', 'etwa 1840-mal kürzer'), false, L('The lighter electron has the smaller momentum, so the longer wavelength.', 'Das leichtere Elektron hat den kleineren Impuls, also die längere Wellenlänge.'), 'inverse'],
    ] : [
      [L('about 43 times longer', 'etwa 43-mal länger'), true],
      [L('about 1840 times longer', 'etwa 1840-mal länger'), false, WHY.sqrt(), 'sqrt'],
      [L('the same', 'gleich lang'), false, L('Same energy, but not the same momentum: p = √(2·m·E<sub>kin</sub>).', 'Dieselbe Energie, aber nicht derselbe Impuls: p = √(2·m·E<sub>kin</sub>).'), 'mass'],
      [L('about 43 times shorter', 'etwa 43-mal kürzer'), false, L('The lighter electron has the smaller momentum, so the longer wavelength.', 'Das leichtere Elektron hat den kleineren Impuls, also die längere Wellenlänge.'), 'inverse'],
    ];
    return {
      title: L('Light and heavy particles', 'Leichte und schwere Teilchen'),
      text: `<p>${L('An electron, a proton and an alpha particle (a helium nucleus: about four times the mass of a proton, twice its charge) are compared. A proton is about 1840 times as heavy as an electron, and √1840 ≈ 43. No relativity is needed.', 'Ein Elektron, ein Proton und ein Alphateilchen (ein Heliumkern: etwa viermal die Masse eines Protons, doppelte Ladung) werden verglichen. Ein Proton ist etwa 1840-mal so schwer wie ein Elektron, und √1840 ≈ 43. Die Relativitätstheorie ist nicht nötig.')}</p>`,
      figs: '',
      questions: [
        choice('a', same === 'v' ? L('(a) All three fly at the same speed. Which has the longest wavelength?', '(a) Alle drei fliegen gleich schnell. Welches hat die grösste Wellenlänge?') : L('(a) All three have the same kinetic energy. Which has the longest wavelength?', '(a) Alle drei haben dieselbe kinetische Energie. Welches hat die grösste Wellenlänge?'), opts(r, qa)),
        choice('b', ask === 'short' ? L('(b) All three start at rest and are accelerated through the same voltage. Which has the shortest wavelength?', '(b) Alle drei starten in Ruhe und werden mit derselben Spannung beschleunigt. Welches hat die kleinste Wellenlänge?') : L('(b) All three start at rest and are accelerated through the same voltage. Which has the longest wavelength?', '(b) Alle drei starten in Ruhe und werden mit derselben Spannung beschleunigt. Welches hat die grösste Wellenlänge?'), opts(r, qb)),
        choice('c', ratio === 'v' ? L('(c) An electron and a proton have the same speed. Compared with the proton’s, the wavelength of the electron is', '(c) Ein Elektron und ein Proton haben dieselbe Geschwindigkeit. Verglichen mit der des Protons ist die Wellenlänge des Elektrons') : L('(c) An electron and a proton have the same kinetic energy. Compared with the proton’s, the wavelength of the electron is', '(c) Ein Elektron und ein Proton haben dieselbe kinetische Energie. Verglichen mit der des Protons ist die Wellenlänge des Elektrons'), opts(r, qc)),
      ],
      hints: [
        L(`${lam} = ${h}/${p}: the larger the momentum, the shorter the wavelength.`, `${lam} = ${h}/${p}: Je grösser der Impuls, desto kürzer die Wellenlänge.`),
        L(`Same speed: ${p} = ${m}·${v}. Same kinetic energy: ${p} = √(2·${m}·${Ek}).`, `Gleiche Geschwindigkeit: ${p} = ${m}·${v}. Gleiche kinetische Energie: ${p} = √(2·${m}·${Ek}).`),
        L(`Through a voltage ${U}, a particle of charge ${i('q')} gains ${Ek} = ${i('q')}·${U}, so ${p} = √(2·${m}·${i('q')}·${U}).`, `Mit einer Spannung ${U} gewinnt ein Teilchen der Ladung ${i('q')} die Energie ${Ek} = ${i('q')}·${U}, also ${p} = √(2·${m}·${i('q')}·${U}).`),
      ],
      solution: [
        L(`(a) ${same === 'v' ? `${p} = ${m}·${v}` : `${p} = √(2·${m}·${Ek})`}: the lightest particle has the least momentum and the longest wavelength, <b>the electron</b>.`, `(a) ${same === 'v' ? `${p} = ${m}·${v}` : `${p} = √(2·${m}·${Ek})`}: Das leichteste Teilchen hat den kleinsten Impuls und die grösste Wellenlänge, <b>das Elektron</b>.`),
        L(`(b) ${p} = √(2·${m}·${i('q')}·${U}): compare ${m}·${i('q')}. The alpha particle has about 4·${m}${sb('p')} and 2${i('e')}, so 8 times the product of the proton. ${ask === 'short' ? 'The shortest wavelength: <b>the alpha particle</b>.' : 'The longest wavelength: <b>the electron</b>.'}`, `(b) ${p} = √(2·${m}·${i('q')}·${U}): Vergleiche ${m}·${i('q')}. Das Alphateilchen hat etwa 4·${m}${sb('p')} und 2${i('e')}, also das 8-fache Produkt des Protons. ${ask === 'short' ? 'Die kleinste Wellenlänge: <b>das Alphateilchen</b>.' : 'Die grösste Wellenlänge: <b>das Elektron</b>.'}`),
        ratio === 'v' ? L(`(c) ${lam}${sb('e')}/${lam}${sb('p')} = ${p}${sb('p')}/${p}${sb('e')} = ${m}${sb('p')}/${m}${sb('e')} ≈ 1840: <b>about 1840 times longer</b>.`, `(c) ${lam}${sb('e')}/${lam}${sb('p')} = ${p}${sb('p')}/${p}${sb('e')} = ${m}${sb('p')}/${m}${sb('e')} ≈ 1840: <b>etwa 1840-mal länger</b>.`)
          : L(`(c) ${lam}${sb('e')}/${lam}${sb('p')} = ${p}${sb('p')}/${p}${sb('e')} = √(${m}${sb('p')}/${m}${sb('e')}) ≈ √1840 ≈ 43: <b>about 43 times longer</b>.`, `(c) ${lam}${sb('e')}/${lam}${sb('p')} = ${p}${sb('p')}/${p}${sb('e')} = √(${m}${sb('p')}/${m}${sb('e')}) ≈ √1840 ≈ 43: <b>etwa 43-mal länger</b>.`),
      ],
      p: { same, ask, ratio },
    };
  }

  // Electron diffraction at graphite: the rings shrink as the voltage grows, as λ = h/p predicts.
  const LT = 0.135, DS = [0.213e-9, 0.123e-9]; // m: the distance foil–screen, the spacings of the planes
  function diffraction(seed) {
    const r = rng(seed * 43 + 13);
    const U0 = r.pick([2, 3, 4, 5]), up = r.next() < 0.5, U1 = up ? 4 * U0 : U0 / 4, f = up ? 0.5 : 2;
    const radii = DS.map((dd) => (LT * M.lambdaU(U0 * 1e3) / dd) * 1e3); // mm
    const S = [[f, null], [f * f, 'sqrt'], [1 / f, 'inverse'], [1, 'same']];
    const max = Math.max(...S.map(([x]) => x * radii[1]), radii[1]) * 1.08;
    const WRONG = {
      sqrt: () => WHY.sqrt(),
      inverse: () => (up ? L('Faster electrons have a shorter wavelength: they are diffracted less, the rings shrink.', 'Schnellere Elektronen haben eine kürzere Wellenlänge: Sie werden weniger gebeugt, die Ringe schrumpfen.') : L('Slower electrons have a longer wavelength: they are diffracted more, the rings grow.', 'Langsamere Elektronen haben eine längere Wellenlänge: Sie werden stärker gebeugt, die Ringe wachsen.')),
      same: () => L('The spacings of the planes belong to the crystal, but the angles depend on the wavelength of the electrons.', 'Die Abstände der Netzebenen gehören zum Kristall, aber die Winkel hängen von der Wellenlänge der Elektronen ab.'),
    };
    const options = r.shuffle(S.map(([x, w]) => ({ html: G.rings(radii.map((q) => q * x), { max, small: true }), ok: !w, why: w ? WRONG[w]() : '', tag: w ? (w === 'same' ? 'other' : w) : undefined })));
    const Utxt = (x) => `${plain(x, 3)} kV`;
    return {
      title: L('Electrons diffracted by graphite', 'Elektronenbeugung an Graphit'),
      text: `<p>${L(`In a diffraction tube, electrons accelerated through ${U} = ${Utxt(U0)} pass a thin graphite foil and make the rings shown on the screen. Then the voltage is ${up ? 'raised' : 'lowered'} to ${U} = ${Utxt(U1)}.`, `In einer Beugungsröhre durchqueren Elektronen, die mit ${U} = ${Utxt(U0)} beschleunigt wurden, eine dünne Graphitfolie und bilden die gezeigten Ringe auf dem Schirm. Dann wird die Spannung auf ${U} = ${Utxt(U1)} ${up ? 'erhöht' : 'gesenkt'}.`)}</p>`,
      figs: fig(G.tube({ U: Utxt(U0) })) + fig(G.rings(radii, { max })),
      questions: [
        pick('scr', L(`(a) Which screen shows the rings at ${Utxt(U1)}, to the same scale?`, `(a) Welcher Schirm zeigt die Ringe bei ${Utxt(U1)}, im selben Massstab?`), options),
        choice('why', L('(b) Why do such rings show that electrons are waves?', '(b) Warum zeigen solche Ringe, dass Elektronen Wellen sind?'), opts(r, [
          [L('They are a diffraction pattern, as with X-rays, and their size follows λ = h/p of the electrons.', 'Sie sind ein Beugungsmuster, wie bei Röntgenstrahlung, und ihre Grösse folgt dem λ = h/p der Elektronen.'), true],
          [L('The electrons bounce off the atoms of the foil at random.', 'Die Elektronen prallen zufällig von den Atomen der Folie ab.'), false, L('Bouncing at random would give a smooth spot, not sharp rings at fixed angles.', 'Zufälliges Abprallen ergäbe einen verschmierten Fleck, keine scharfen Ringe bei festen Winkeln.'), 'particle'],
          [L('X-rays made in the tube make the rings, not the electrons.', 'Röntgenstrahlung aus der Röhre erzeugt die Ringe, nicht die Elektronen.'), false, L('A magnet near the tube moves the rings: they are made by charged particles, the electrons.', 'Ein Magnet neben der Röhre verschiebt die Ringe: Sie stammen von geladenen Teilchen, den Elektronen.'), 'other'],
          [L('The charges in the foil deflect the electrons onto circles.', 'Die Ladungen in der Folie lenken die Elektronen auf Kreise ab.'), false, L('Electric deflection would not give sharp rings whose radius follows h/p. The rings are where the waves from the planes of atoms add up.', 'Elektrische Ablenkung ergäbe keine scharfen Ringe, deren Radius h/p folgt. Die Ringe liegen dort, wo sich die Wellen der Atomebenen verstärken.'), 'particle'],
        ])),
      ],
      hints: [
        L(`The ring radius ${i('r')} is proportional to the wavelength: ${i('r')} ≈ ${Lb}·${lam}/${i('d')}.`, `Der Ringradius ${i('r')} ist proportional zur Wellenlänge: ${i('r')} ≈ ${Lb}·${lam}/${i('d')}.`),
        L(`${lam} = ${h}/√(2·${m}·${i('e')}·${U}) ∝ 1/√${U}.`, `${lam} = ${h}/√(2·${m}·${i('e')}·${U}) ∝ 1/√${U}.`),
      ],
      solution: [
        L(`(a) ${i('r')} ∝ ${lam} ∝ 1/√${U}: ${up ? 'four times the voltage, <b>half the radius</b>' : 'a quarter of the voltage, <b>twice the radius</b>'}.`, `(a) ${i('r')} ∝ ${lam} ∝ 1/√${U}: ${up ? 'vierfache Spannung, <b>halber Radius</b>' : 'ein Viertel der Spannung, <b>doppelter Radius</b>'}.`),
        L('(b) Sharp rings at fixed angles are a <b>diffraction pattern</b>: the waves reflected by the planes of atoms add up only in certain directions, as for X-rays. That the rings change with the voltage exactly as λ = h/p predicts shows that the waves are the electrons’ own (Davisson and Germer, G. P. Thomson, 1927).', '(b) Scharfe Ringe bei festen Winkeln sind ein <b>Beugungsmuster</b>: Die von den Atomebenen reflektierten Wellen verstärken sich nur in bestimmten Richtungen, wie bei Röntgenstrahlung. Dass sich die Ringe mit der Spannung genau so ändern, wie λ = h/p es vorhersagt, zeigt, dass es die Wellen der Elektronen selbst sind (Davisson und Germer, G. P. Thomson, 1927).'),
      ],
      p: { U0, up },
    };
  }

  // ---------------------------------------------------------------- the particle in a box
  // A drawing of ψ_n or |ψ_n|² among wrong ones, and the wavelength 2L/n.
  const BOXWRONG = {
    count: () => [L('Count the half waves: the state n has n half waves between the walls (n − 1 nodes inside).', 'Zähle die halben Wellen: Der Zustand n hat n halbe Wellen zwischen den Wänden (n − 1 Knoten innen).'), 'count'],
    walls: () => [L('The particle cannot be at or beyond the walls: ψ must be zero there, like a string fixed at both ends.', 'Das Teilchen kann nicht an oder hinter den Wänden sein: ψ muss dort null sein, wie eine Saite, die an beiden Enden eingespannt ist.'), 'walls'],
    onewall: () => [L('ψ must be zero at both walls, not only at one.', 'ψ muss an beiden Wänden null sein, nicht nur an einer.'), 'walls'],
    outside: () => [L('The walls are infinitely high: the wave cannot go on beyond them, ψ = 0 outside.', 'Die Wände sind unendlich hoch: Die Welle kann nicht über sie hinaus weiterlaufen, ausserhalb ist ψ = 0.'), 'walls'],
    psi: () => [L('That is ψ itself. |ψ|² is never negative: the negative half waves are folded up.', 'Das ist ψ selbst. |ψ|² ist nie negativ: Die negativen halben Wellen werden nach oben geklappt.'), 'psisq'],
    flat: () => [L('A ball bouncing between the walls would be found everywhere alike. The standing wave has places where the particle is never found (the nodes).', 'Eine Kugel, die zwischen den Wänden hin- und herprallt, fände man überall gleich oft. Die stehende Welle hat Stellen, an denen man das Teilchen nie findet (die Knoten).'), 'classical'],
  };
  function boxPick(seed) {
    const r = rng(seed * 47 + 17);
    const nn = r.pick([1, 2, 3, 4]), sq = r.next() < 0.5, other = nn === 1 ? 2 : r.pick([nn - 1, nn + 1]);
    const wrongs = r.shuffle(sq ? ['count', 'psi', 'flat', 'walls'] : ['count', 'walls', 'onewall', 'outside']).slice(0, 3);
    const draw = (k) => G.box({ n: k === 'count' ? other : nn, sq, kind: k === 'count' ? 'ok' : k, small: true, w: 260, h: 130 });
    const options = r.shuffle(['ok', ...wrongs].map((k) => { const [why, tag] = k === 'ok' ? ['', undefined] : BOXWRONG[k](); return { html: draw(k), ok: k === 'ok', why, tag }; }));
    // the wavelength: 2L/n among L/n, 4L/n, nL/2, 2nL
    const seen = new Set([ofL(2, nn)]), lw = [];
    for (const [a, b, tag] of [[1, nn, 'half'], [nn, 2, 'nl'], [4, nn, 'half'], [2 * nn, 1, 'nl']]) {
      const s = ofL(a, b);
      if (seen.has(s) || lw.length === 3) continue;
      seen.add(s);
      lw.push([`${lam} = ${s}`, false, tag === 'half' ? L(`Each half wave is ${lam}/2 long, and ${n} of them fill the box: ${Lb} = ${n}·${lam}/2.`, `Jede halbe Welle ist ${lam}/2 lang, und ${n} davon füllen den Kasten: ${Lb} = ${n}·${lam}/2.`) : L(`The more half waves fit in, the shorter each: ${lam} = 2${Lb}/${n}.`, `Je mehr halbe Wellen hineinpassen, desto kürzer ist jede: ${lam} = 2${Lb}/${n}.`), tag]);
    }
    const what = sq ? L(`the probability density ${psi2}`, `die Wahrscheinlichkeitsdichte ${psi2}`) : L(`the wavefunction ${i('ψ')}`, `die Wellenfunktion ${i('ψ')}`);
    return {
      title: L('Standing waves in a box', 'Stehende Wellen im Kasten'),
      text: `<p>${L(`A particle is trapped in a box of width ${Lb} with infinitely high walls. It is in the state ${n} = ${nn}${nn === 1 ? ' (the ground state)' : ''}.`, `Ein Teilchen ist in einem Kasten der Breite ${Lb} mit unendlich hohen Wänden gefangen. Es ist im Zustand ${n} = ${nn}${nn === 1 ? ' (dem Grundzustand)' : ''}.`)}</p>`,
      figs: '',
      questions: [
        pick('psi', L(`(a) Which drawing shows ${what} of this state?`, `(a) Welche Zeichnung zeigt ${what} dieses Zustands?`), options),
        choice('lam', L('(b) The wavelength of this state is', '(b) Die Wellenlänge dieses Zustands ist'), opts(r, [[`${lam} = ${ofL(2, nn)}`, true], ...lw])),
      ],
      hints: [
        L(`The walls are infinitely high: the particle is never at or beyond them, so ${i('ψ')} = 0 there. Only standing waves fit, like on a string fixed at both ends.`, `Die Wände sind unendlich hoch: Das Teilchen ist nie an oder hinter ihnen, also ist ${i('ψ')} = 0 dort. Nur stehende Wellen passen, wie auf einer Saite, die an beiden Enden eingespannt ist.`),
        L(`The state ${n} has ${n} half waves between the walls: ${Lb} = ${n}·${lam}/2.`, `Der Zustand ${n} hat ${n} halbe Wellen zwischen den Wänden: ${Lb} = ${n}·${lam}/2.`),
        L(`${psi2} is the square of ${i('ψ')}: never negative, zero where ${i('ψ')} is zero.`, `${psi2} ist das Quadrat von ${i('ψ')}: nie negativ, null, wo ${i('ψ')} null ist.`),
      ],
      solution: [
        L(`(a) ${nn} half wave${nn > 1 ? 's' : ''} between the walls, zero at both walls and ${nn - 1 === 0 ? 'no node' : nn - 1 === 1 ? 'one node' : `${nn - 1} nodes`} inside${sq ? `; squared, every half wave becomes a hump above the axis: ${nn} hump${nn > 1 ? 's' : ''}` : ''}.`, `(a) ${nn} halbe Welle${nn > 1 ? 'n' : ''} zwischen den Wänden, null an beiden Wänden und ${nn - 1 === 0 ? 'kein Knoten' : nn - 1 === 1 ? 'ein Knoten' : `${nn - 1} Knoten`} innen${sq ? `; quadriert wird jede halbe Welle zu einem Buckel über der Achse: ${nn} Buckel` : ''}.`),
        L(`(b) ${Lb} = ${nn}·${lam}/2, so <b>${lam} = ${ofL(2, nn)}</b>.`, `(b) ${Lb} = ${nn}·${lam}/2, also <b>${lam} = ${ofL(2, nn)}</b>.`),
      ],
      solFig: fig(G.box({ n: nn, sq: false })) + fig(G.box({ n: nn, sq: true })),
      p: { nn, sq, w: wrongs },
    };
  }

  // The energies E_n = n²·E₁ by ratios: a higher state, a wider box or a heavier particle, and why.
  function boxEnergy(seed) {
    const r = rng(seed * 53 + 19);
    const e1 = r.pick([0.5, 1, 1.5, 2, 3]), k = r.pick([2, 3, 4]), ch = r.pick(['wide2', 'narrow2', 'wide3', 'proton']);
    const ev = (x) => `${plain(x, 3)} eV`;
    const CH = {
      wide2: [L('The box is made twice as wide.', 'Der Kasten wird doppelt so breit gemacht.'), [[L('a quarter as large', 'ein Viertel so gross'), true], [L('half as large', 'halb so gross'), false, WHY.lsq(), 'lsq'], [L('four times as large', 'viermal so gross'), false, L('A wider box fits longer waves: less momentum, less energy.', 'In einen breiteren Kasten passen längere Wellen: weniger Impuls, weniger Energie.'), 'widthdir'], [L('the same', 'gleich gross'), false, L('The wavelength 2L depends on the width, and so do p and E.', 'Die Wellenlänge 2L hängt von der Breite ab, und damit p und E.'), 'other']]],
      narrow2: [L('The box is made half as wide.', 'Der Kasten wird halb so breit gemacht.'), [[L('four times as large', 'viermal so gross'), true], [L('twice as large', 'doppelt so gross'), false, WHY.lsq(), 'lsq'], [L('a quarter as large', 'ein Viertel so gross'), false, L('A narrower box fits only shorter waves: more momentum, more energy.', 'In einen schmaleren Kasten passen nur kürzere Wellen: mehr Impuls, mehr Energie.'), 'widthdir'], [L('the same', 'gleich gross'), false, L('The wavelength 2L depends on the width, and so do p and E.', 'Die Wellenlänge 2L hängt von der Breite ab, und damit p und E.'), 'other']]],
      wide3: [L('The box is made three times as wide.', 'Der Kasten wird dreimal so breit gemacht.'), [[L('a ninth as large', 'ein Neuntel so gross'), true], [L('a third as large', 'ein Drittel so gross'), false, WHY.lsq(), 'lsq'], [L('nine times as large', 'neunmal so gross'), false, L('A wider box fits longer waves: less momentum, less energy.', 'In einen breiteren Kasten passen längere Wellen: weniger Impuls, weniger Energie.'), 'widthdir'], [L('the same', 'gleich gross'), false, L('The wavelength 2L depends on the width, and so do p and E.', 'Die Wellenlänge 2L hängt von der Breite ab, und damit p und E.'), 'other']]],
      proton: [L('A proton (about 1840 times as heavy) is put in the same box instead.', 'Stattdessen kommt ein Proton (etwa 1840-mal so schwer) in denselben Kasten.'), [[L('about 1840 times smaller', 'etwa 1840-mal kleiner'), true], [L('about 43 times smaller', 'etwa 43-mal kleiner'), false, L('The same box gives the same wavelengths, so the same momenta; E = p²/(2m) is 1840 times smaller, without a square root.', 'Derselbe Kasten ergibt dieselben Wellenlängen, also dieselben Impulse; E = p²/(2m) ist 1840-mal kleiner, ohne Wurzel.'), 'lsq'], [L('about 1840 times larger', 'etwa 1840-mal grösser'), false, L('Same p, larger m: E = p²/(2m) is smaller.', 'Gleiches p, grösseres m: E = p²/(2m) ist kleiner.'), 'mass'], [L('the same', 'gleich gross'), false, L('The momenta are the same, but E = p²/(2m) depends on the mass.', 'Die Impulse sind gleich, aber E = p²/(2m) hängt von der Masse ab.'), 'mass']]],
    }[ch];
    return {
      title: L('The energies in a box', 'Die Energien im Kasten'),
      text: `<p>${L(`An electron is trapped in a box with infinitely high walls (a model of a thin layer or a long molecule). Its lowest energy is ${E1} = ${ev(e1)}.`, `Ein Elektron ist in einem Kasten mit unendlich hohen Wänden gefangen (ein Modell einer dünnen Schicht oder eines langen Moleküls). Seine kleinste Energie ist ${E1} = ${ev(e1)}.`)}</p>`,
      figs: fig(G.levels(3)),
      questions: [
        numQ('E', L(`(a) the energy of the state ${n} = ${k}, without a calculator`, `(a) die Energie des Zustands ${n} = ${k}, ohne Taschenrechner`), `${i('E')}${sb(k)}`, 'eV', k * k * e1, { wrong: [{ value: k * e1, tag: 'linear', why: WHY.nsq() }] }),
        choice('ch', L(`(b) ${CH[0]} The lowest energy becomes`, `(b) ${CH[0]} Die kleinste Energie wird`), opts(r, CH[1])),
        choice('why', L('(c) Why can the electron have only certain energies?', '(c) Warum kann das Elektron nur bestimmte Energien haben?'), opts(r, [
          [L('Only standing waves with a whole number of half waves fit between the walls; each has its own wavelength, so its own momentum and energy.', 'Nur stehende Wellen mit einer ganzen Zahl halber Wellen passen zwischen die Wände; jede hat ihre eigene Wellenlänge, also ihren eigenen Impuls und ihre eigene Energie.'), true],
          [L('Energies in between are possible, only less likely.', 'Energien dazwischen sind möglich, nur weniger wahrscheinlich.'), false, L('In between, no standing wave fits: ψ could not be zero at both walls. Such states do not exist at all.', 'Dazwischen passt keine stehende Welle: ψ könnte nicht an beiden Wänden null sein. Solche Zustände gibt es gar nicht.'), 'classical'],
          [L('The electron bounces between the walls, and it can only bounce at certain speeds.', 'Das Elektron prallt zwischen den Wänden hin und her, und das geht nur mit bestimmten Geschwindigkeiten.'), false, L('A ball bouncing between walls could have any speed. The energies are fixed because a standing wave must fit.', 'Eine Kugel, die zwischen Wänden hin- und herprallt, könnte jede Geschwindigkeit haben. Die Energien sind festgelegt, weil eine stehende Welle passen muss.'), 'classical'],
          [L('The walls absorb all other energies.', 'Die Wände absorbieren alle anderen Energien.'), false, L('The walls do nothing but keep ψ zero at the ends. That condition alone picks the wavelengths and so the energies.', 'Die Wände tun nichts, als ψ an den Enden auf null zu halten. Diese Bedingung allein wählt die Wellenlängen und damit die Energien aus.'), 'other'],
        ])),
      ],
      hints: [
        L(`${lam}${sb('n')} = 2${Lb}/${n}, so ${p}${sb('n')} = ${h}/${lam}${sb('n')} = ${n}·${h}/(2${Lb}) and ${i('E')}${sb('n')} = ${p}²/(2${m}) = ${n}²·${h}²/(8${m}${Lb}²) = ${n}²·${E1}.`, `${lam}${sb('n')} = 2${Lb}/${n}, also ${p}${sb('n')} = ${h}/${lam}${sb('n')} = ${n}·${h}/(2${Lb}) und ${i('E')}${sb('n')} = ${p}²/(2${m}) = ${n}²·${h}²/(8${m}${Lb}²) = ${n}²·${E1}.`),
        L(`${i('E')} ∝ ${n}²/(${m}·${Lb}²): find the factor of each change and multiply.`, `${i('E')} ∝ ${n}²/(${m}·${Lb}²): Bestimme den Faktor jeder Änderung und multipliziere.`),
      ],
      solution: [
        L(`(a) ${i('E')}${sb(k)} = ${k}²·${E1} = ${k * k} · ${ev(e1)} = <b>${ev(k * k * e1)}</b>.`, `(a) ${i('E')}${sb(k)} = ${k}²·${E1} = ${k * k} · ${ev(e1)} = <b>${ev(k * k * e1)}</b>.`),
        { wide2: L(`(b) ${E1} ∝ 1/${Lb}²: twice the width, <b>a quarter</b> of the energy, ${ev(e1 / 4)}.`, `(b) ${E1} ∝ 1/${Lb}²: doppelte Breite, <b>ein Viertel</b> der Energie, ${ev(e1 / 4)}.`),
          narrow2: L(`(b) ${E1} ∝ 1/${Lb}²: half the width, <b>four times</b> the energy, ${ev(e1 * 4)}.`, `(b) ${E1} ∝ 1/${Lb}²: halbe Breite, <b>vierfache</b> Energie, ${ev(e1 * 4)}.`),
          wide3: L(`(b) ${E1} ∝ 1/${Lb}²: three times the width, <b>a ninth</b> of the energy, ${ev(e1 / 9)}.`, `(b) ${E1} ∝ 1/${Lb}²: dreifache Breite, <b>ein Neuntel</b> der Energie, ${ev(e1 / 9)}.`),
          proton: L(`(b) The same box, the same wavelengths and momenta; ${E1} = ${p}²/(2${m}) ∝ 1/${m}: <b>about 1840 times smaller</b>. Heavy particles in a box hardly show their quantised energies.`, `(b) Derselbe Kasten, dieselben Wellenlängen und Impulse; ${E1} = ${p}²/(2${m}) ∝ 1/${m}: <b>etwa 1840-mal kleiner</b>. Schwere Teilchen im Kasten zeigen ihre gequantelten Energien kaum.`) }[ch],
        L('(c) The walls force ψ = 0 at both ends: only <b>a whole number of half waves</b> fits, λ = 2L/n. Each such wave has its own momentum h/λ and energy p²/(2m); nothing in between fits. That is why the energies are quantised.', '(c) Die Wände erzwingen ψ = 0 an beiden Enden: Nur <b>eine ganze Zahl halber Wellen</b> passt, λ = 2L/n. Jede solche Welle hat ihren eigenen Impuls h/λ und ihre eigene Energie p²/(2m); nichts dazwischen passt. Deshalb sind die Energien gequantelt.'),
      ],
      p: { e1, k, ch },
    };
  }

  // ---------------------------------------------------------------- probability and uncertainty
  // Reading |ψ|²: where the particle is likely found, the expectation value and the uncertainty Δx,
  // and what Δx means (not a measurement error).
  const SIGMAS = [0.035, 0.06, 0.1, 0.16];
  function density(seed) {
    const r = rng(seed * 59 + 23);
    const v = r.pick(['wide', 'narrow', 'mean', 'likely']);
    const meaning = choice('dx', L(`(b) The uncertainty ${dx} of a state means`, `(b) Die Unschärfe ${dx} eines Zustands bedeutet`), opts(r, [
      [L('the spread of the positions found when the position is measured on many particles in this same state', 'die Streuung der Orte, die man findet, wenn man den Ort an vielen Teilchen in diesem selben Zustand misst'), true],
      [L('the error of the instrument that measures the position', 'den Fehler des Instruments, das den Ort misst'), false, L(`Even with a perfect instrument the results scatter: ${dx} belongs to the state, not to the instrument.`, `Auch mit einem perfekten Instrument streuen die Ergebnisse: ${dx} gehört zum Zustand, nicht zum Instrument.`), 'error'],
      [L('that the particle has an exact position, which we do not know', 'dass das Teilchen einen genauen Ort hat, den wir nicht kennen'), false, L('In this state the particle has no exact position. Each measurement finds one place, but which one is a matter of chance.', 'In diesem Zustand hat das Teilchen keinen genauen Ort. Jede Messung findet einen Ort, aber welchen, ist Zufall.'), 'hidden'],
      [L('how far the measurement pushes the particle', 'wie weit die Messung das Teilchen verschiebt'), false, L(`${dx} is there before any measurement: it is the width of ${psi2} of the state.`, `${dx} ist schon vor jeder Messung da: Es ist die Breite von ${psi2} des Zustands.`), 'error'],
    ]));
    if (v === 'wide' || v === 'narrow') {
      const sig = r.shuffle(SIGMAS), mus = sig.map(() => r.pick([0.35, 0.42, 0.5, 0.58, 0.65])), ymax = 1.08 / (SIGMAS[0] * Math.sqrt(2 * Math.PI));
      const widest = sig.indexOf(Math.max(...sig)), narrowest = sig.indexOf(Math.min(...sig)), best = v === 'wide' ? widest : narrowest;
      const whyOf = (k) => (v === 'wide'
        ? (k === narrowest ? [L(`The highest peak is the narrowest: the area under ${psi2} is always 1. ${dx} is the width of the curve.`, `Der höchste Gipfel ist der schmalste: Die Fläche unter ${psi2} ist immer 1. ${dx} ist die Breite der Kurve.`), 'height'] : [L(`${dx} is the width of ${psi2}; where the curve lies does not matter. Another curve is wider.`, `${dx} ist die Breite von ${psi2}; wo die Kurve liegt, spielt keine Rolle. Eine andere Kurve ist breiter.`), 'width'])
        : (k === widest ? [L(`The widest ${psi2} has the largest ${dx}, so ${dp} can be the smallest: ${dx}·${dp} ≥ ${h}/(4π).`, `Das breiteste ${psi2} hat das grösste ${dx}, also kann ${dp} am kleinsten sein: ${dx}·${dp} ≥ ${h}/(4π).`), 'heisenberg'] : [L(`Compare the widths: the narrowest ${psi2} has the smallest ${dx}, so the largest ${dp}.`, `Vergleiche die Breiten: Das schmalste ${psi2} hat das kleinste ${dx}, also das grösste ${dp}.`), 'heisenberg']));
      const options = sig.map((s, k) => { const [why, tag] = k === best ? ['', undefined] : whyOf(k); return { html: G.packet(mus[k], s, { ymax, small: true }), ok: k === best, why, tag }; });
      return {
        title: L('Reading |ψ|²', '|ψ|² lesen'),
        text: `<p>${L(`The drawings show the probability density ${psi2} of four states of a particle, to the same scale.`, `Die Zeichnungen zeigen die Wahrscheinlichkeitsdichte ${psi2} von vier Zuständen eines Teilchens, im selben Massstab.`)}</p>`,
        figs: '',
        questions: [
          pick('w', v === 'wide' ? L(`(a) In which state is the uncertainty of the position, ${dx}, largest?`, `(a) In welchem Zustand ist die Unschärfe des Orts, ${dx}, am grössten?`) : L(`(a) In which state is the uncertainty of the momentum, ${dp}, surely largest?`, `(a) In welchem Zustand ist die Unschärfe des Impulses, ${dp}, sicher am grössten?`), options),
          meaning,
        ],
        hints: [
          L(`${psi2} tells where the particle is likely to be found; the area under it is 1. Its width is the uncertainty ${dx}.`, `${psi2} sagt, wo man das Teilchen wahrscheinlich findet; die Fläche darunter ist 1. Seine Breite ist die Unschärfe ${dx}.`),
          L(`Heisenberg: ${dx}·${dp} ≥ ${h}/(4π). A small ${dx} forces a large ${dp}.`, `Heisenberg: ${dx}·${dp} ≥ ${h}/(4π). Ein kleines ${dx} erzwingt ein grosses ${dp}.`),
        ],
        solution: [
          v === 'wide' ? L(`(a) ${dx} is the width of ${psi2}: <b>the widest curve</b>, which is also the lowest, since the area is always 1.`, `(a) ${dx} ist die Breite von ${psi2}: <b>die breiteste Kurve</b>, die auch die niedrigste ist, weil die Fläche immer 1 ist.`)
            : L(`(a) The narrowest ${psi2} has the smallest ${dx}, so by ${dx}·${dp} ≥ ${h}/(4π) the largest ${dp}: <b>the narrowest, highest curve</b>.`, `(a) Das schmalste ${psi2} hat das kleinste ${dx}, also wegen ${dx}·${dp} ≥ ${h}/(4π) das grösste ${dp}: <b>die schmalste, höchste Kurve</b>.`),
          L(`(b) Measure the position of many particles in the same state with a perfect instrument: each measurement gives one sharp place, but the places scatter as ${psi2} says. <b>${dx} is that spread</b>, a property of the state, not an error of the measurement.`, `(b) Miss den Ort vieler Teilchen im selben Zustand mit einem perfekten Instrument: Jede Messung ergibt einen scharfen Ort, aber die Orte streuen so, wie ${psi2} es sagt. <b>${dx} ist diese Streuung</b>, eine Eigenschaft des Zustands, kein Fehler der Messung.`),
        ],
        p: { v, sig },
      };
    }
    // the state n = 2 in a box: zero in the middle, yet the mean is there
    const qa = v === 'mean' ? choice('m', L(`(a) Where is the expectation value ${xm}, the mean of many measurements of the position?`, `(a) Wo liegt der Erwartungswert ${xm}, der Mittelwert vieler Messungen des Orts?`), opts(r, [
      [`${xm} = ${ofL(1, 2)}`, true],
      [`${xm} = ${ofL(1, 4)}`, false, L(`Near ${ofL(1, 4)} and ${ofL(3, 4)} the particle is most likely found. The mean of all the places is in the middle, by symmetry.`, `Bei ${ofL(1, 4)} und ${ofL(3, 4)} findet man das Teilchen am wahrscheinlichsten. Der Mittelwert aller Orte liegt aus Symmetriegründen in der Mitte.`), 'mean'],
      [`${xm} = ${ofL(3, 4)}`, false, L(`Near ${ofL(1, 4)} and ${ofL(3, 4)} the particle is most likely found. The mean of all the places is in the middle, by symmetry.`, `Bei ${ofL(1, 4)} und ${ofL(3, 4)} findet man das Teilchen am wahrscheinlichsten. Der Mittelwert aller Orte liegt aus Symmetriegründen in der Mitte.`), 'mean'],
      [L(`there is none: the particle is never found at ${ofL(1, 2)}`, `es gibt keinen: Das Teilchen ist nie bei ${ofL(1, 2)}`), false, L('A mean need not be a likely place: the mean of 1 and 3 is 2. Half the results lie left, half right: the mean is L/2.', 'Ein Mittelwert muss kein wahrscheinlicher Ort sein: Der Mittelwert von 1 und 3 ist 2. Die Hälfte der Ergebnisse liegt links, die Hälfte rechts: Der Mittelwert ist L/2.'), 'mean'],
    ])) : choice('m', L('(a) Where is the particle most likely to be found?', '(a) Wo findet man das Teilchen am wahrscheinlichsten?'), opts(r, [
      [L(`near ${ofL(1, 4)} and near ${ofL(3, 4)}`, `bei ${ofL(1, 4)} und bei ${ofL(3, 4)}`), true],
      [L(`at ${ofL(1, 2)}, in the middle`, `bei ${ofL(1, 2)}, in der Mitte`), false, L(`There ${psi2} is zero: the particle is never found in the middle. ${ofL(1, 2)} is only the mean of the places found.`, `Dort ist ${psi2} null: In der Mitte findet man das Teilchen nie. ${ofL(1, 2)} ist nur der Mittelwert der gefundenen Orte.`), 'mean'],
      [L('everywhere in the box equally', 'überall im Kasten gleich'), false, BOXWRONG.flat()[0], 'classical'],
      [L('near the walls', 'bei den Wänden'), false, BOXWRONG.walls()[0], 'walls'],
    ]));
    return {
      title: L('Reading |ψ|² in a box', '|ψ|² im Kasten lesen'),
      text: `<p>${L(`A particle in a box of width ${Lb} is in the state ${n} = 2. The drawing shows its probability density ${psi2}.`, `Ein Teilchen in einem Kasten der Breite ${Lb} ist im Zustand ${n} = 2. Die Zeichnung zeigt seine Wahrscheinlichkeitsdichte ${psi2}.`)}</p>`,
      figs: fig(G.box({ n: 2, sq: true, ticks: true })),
      questions: [qa, meaning],
      hints: [
        L(`${psi2} is high where the particle is likely to be found, zero where it is never found.`, `${psi2} ist hoch, wo man das Teilchen wahrscheinlich findet, null, wo man es nie findet.`),
        L(`The expectation value ${xm} is the mean of many measurements. It need not be a place where the particle is ever found.`, `Der Erwartungswert ${xm} ist der Mittelwert vieler Messungen. Er muss kein Ort sein, an dem man das Teilchen je findet.`),
      ],
      solution: [
        v === 'mean' ? L(`(a) ${psi2} is symmetric about the middle: as many results left as right, so <b>${xm} = ${ofL(1, 2)}</b>, although the particle is never found exactly there.`, `(a) ${psi2} ist symmetrisch zur Mitte: gleich viele Ergebnisse links wie rechts, also <b>${xm} = ${ofL(1, 2)}</b>, obwohl man das Teilchen genau dort nie findet.`)
          : L(`(a) ${psi2} is highest <b>near ${ofL(1, 4)} and ${ofL(3, 4)}</b> and zero at the walls and in the middle.`, `(a) ${psi2} ist am höchsten <b>bei ${ofL(1, 4)} und ${ofL(3, 4)}</b> und null an den Wänden und in der Mitte.`),
        L(`(b) <b>${dx} is the spread of the positions found</b> on many particles in the same state, here ${dx} ≈ 0.27·${Lb}: a property of the state, not an error of the measurement.`, `(b) <b>${dx} ist die Streuung der gefundenen Orte</b> an vielen Teilchen im selben Zustand, hier ${dx} ≈ 0.27·${Lb}: eine Eigenschaft des Zustands, kein Fehler der Messung.`),
      ],
      p: { v },
    };
  }

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


  // ---------------------------------------------------------------- all types
  const TYPES = {
    debroglie: [1, debroglie], 'same-lambda': [2, sameLambda], diffraction: [2, diffraction],
    'box-pick': [2, boxPick], 'box-energy': [2, boxEnergy],
    density: [2, density], 'uncert-stmts': [2, uncertStmts],
  };
  function make(type, seed) {
    const [difficulty, fn] = TYPES[type];
    return { ...fn(seed), type, difficulty, id: `${type}-${seed}`, seed };
  }

  const api = { TYPES: Object.keys(TYPES), make, BANK_U, WHY, i, sb, numQ, choice, pick, opts, fig, ofL };
  root.MatterEx = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
