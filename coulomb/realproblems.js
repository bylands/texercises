// Problems: the Coulomb force where charges really are points (or small spheres far apart, whose
// charge is spread evenly): atoms, ions, nuclei, quarks, and Coulomb's own torsion balance. Told as
// stories, solved with the ideas of this app (Coulomb's law, superposition). Each has random values
// from a list, a picture (artkit.js) and a drawing of the forces for the solution:
//   { id, difficulty, title(), make(r), solve(p), fields(p), text(p), hints(p), steps(p, v), pic(p), fbd(p, v) }
// realOf(i, seed) gives an exercise as the practice ones (generator.js).
(function (root) {
  'use strict';

  const CL = root.CL, { L, K, E, rng, pick, num, tnum, q, tq, sig } = CL;
  const { drawing, sv } = root.Scenarios;
  const G = 6.67e-11, ME = 9.11e-31, MP = 1.67e-27, U = 1.66e-27;
  const KT = '9.0\\cdot 10^{9}\\,\\mathrm{\\tfrac{N\\,m^2}{C^2}}', ET = '1.6\\cdot 10^{-19}\\,\\mathrm{C}';
  const res = (x) => `\\htmlClass{result}{${x}}`;
  const rt = (x) => `<span class="result">${x}</span>`; // a result in the text
  const step = (rule, html) => `<p class="step-rule">${rule}</p>${html}`;
  const p$ = (s) => `<p>${s}</p>`;
  const num$ = (key, sym, unit, what, sci = true) => ({ key, type: 'num', sym, unit, what, sci });
  const choice = (key, what, options) => ({ key, type: 'choice', what, options });
  const mT = (x) => `${tnum(x)}\\,\\mathrm{m}`;
  const A = () => root.Art;

  // ---------------------------------------------------------------- pictures
  // a particle with a soft glow: proton, neutron, electron or an ion
  function particle(x, y, r, kind, label) {
    const a = A();
    return a.circle(x, y, r * 1.9, `rp-glow ${kind}`) + a.circle(x, y, r, `rp-part ${kind}`) + (label ? a.text(x, y + 4, label, 'rp-partlbl') : '');
  }
  const caption = (x, y, t) => A().text(x, y, t, 'rp-caption');
  const nucleus = (x, y, Z, N, r = 7, seed = 3) => {
    const pts = [], n = Z + N, rr = rng(seed);
    for (let k = 0; k < n; k++) { const a = k * 2.4, d = r * 0.9 * Math.sqrt(k); pts.push([x + d * Math.cos(a), y + d * Math.sin(a), rr() < Z / n ? 'proton' : 'neutron']); }
    return pts.reverse().map(([px, py, kd]) => A().circle(px, py, r, `rp-part ${kd}`)).join('');
  };
  const orbit = (x, y, rx, ry = rx) => `<ellipse class="rp-orbit" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>`;

  // ---------------------------------------------------------------- 1 the hydrogen atom
  const hydrogen = {
    id: 'hydrogen', difficulty: 1, title: () => L('The hydrogen atom', 'Das Wasserstoffatom'),
    make: (r) => ({ n: pick(r, [1, 2, 3]) }),
    solve: (p) => { const r = 5.3e-11 * p.n ** 2, F = (K * E * E) / r ** 2, Fg = (G * ME * MP) / r ** 2; return { r, F, Fg, ratio: F / Fg }; },
    fields: () => [num$('F', 'F_\\mathrm{el}', 'N', L('electric force', 'elektrische Kraft')), num$('ratio', 'F_\\mathrm{el}/F_\\mathrm{G}', '', L('compared with gravity', 'im Vergleich zur Gravitation'))],
    text: (p) => L(`In the simplest picture of the hydrogen atom, the electron circles the proton at a distance of ${q(5.3e-11 * p.n ** 2, 'm')}${p.n > 1 ? ` (in an excited state)` : ''}. How large is the electric force between them? How many times larger is it than the gravitational force between them? (Electron ${num(ME)} kg, proton ${num(MP)} kg, G = 6.67·10⁻¹¹ N·m²/kg².)`,
      `Im einfachsten Bild des Wasserstoffatoms kreist das Elektron im Abstand von ${q(5.3e-11 * p.n ** 2, 'm')}${p.n > 1 ? ' (in einem angeregten Zustand)' : ''} um das Proton. Wie gross ist die elektrische Kraft zwischen ihnen? Wie viele Male grösser ist sie als die Gravitationskraft zwischen ihnen? (Elektron ${num(ME)} kg, Proton ${num(MP)} kg, G = 6.67·10⁻¹¹ N·m²/kg².)`),
    hints: () => [
      L('Electron and proton carry the elementary charge e = 1.6·10⁻¹⁹ C, with opposite signs.', 'Elektron und Proton tragen die Elementarladung e = 1.6·10⁻¹⁹ C, mit entgegengesetzten Vorzeichen.'),
      L('Gravitation: F = G m₁ m₂ / r². In the ratio, r² cancels.', 'Gravitation: F = G m₁ m₂ / r². Im Verhältnis kürzt sich r².'),
    ],
    steps: (p, v) => [
      step(L('The electric force', 'Die elektrische Kraft'), p$(L('Let $e$ be the elementary charge and $r$ the distance. Proton and electron attract each other with', 'Sei $e$ die Elementarladung und $r$ der Abstand. Proton und Elektron ziehen sich an mit')) +
        `$$F_\\mathrm{el} = k\\,\\frac{e^2}{r^2} = ${KT}\\cdot\\frac{(${ET})^2}{(${mT(v.r)})^2} = ${res(tq(v.F, 'N'))}$$`),
      step(L('Compared with gravity', 'Im Vergleich zur Gravitation'), p$(L('Let $m_e$ and $m_p$ be the masses. Both forces fall with $1/r^2$, so the distance cancels in the ratio:', 'Seien $m_e$ und $m_p$ die Massen. Beide Kräfte nehmen mit $1/r^2$ ab, der Abstand kürzt sich also im Verhältnis:')) +
        `$$\\frac{F_\\mathrm{el}}{F_\\mathrm{G}} = \\frac{k\\,e^2}{G\\,m_e\\,m_p} = \\frac{${KT}\\cdot (${ET})^2}{6.67\\cdot 10^{-11}\\,\\mathrm{\\tfrac{N\\,m^2}{kg^2}}\\cdot ${tnum(ME)}\\,\\mathrm{kg}\\cdot ${tnum(MP)}\\,\\mathrm{kg}} = ${res(tnum(v.ratio))}$$` +
        p$(L('In atoms, gravity plays no part at all: the electric force holds them together.', 'In Atomen spielt die Gravitation keine Rolle: Die elektrische Kraft hält sie zusammen.'))),
    ],
    pic: () => { const a = A(); return a.svg(420, 220, a.bg(0, 0, 420, 220, 'night') + orbit(210, 110, 150, 70) + particle(210, 110, 16, 'proton', '+') + particle(360, 110, 7, 'electron', '−') + caption(210, 205, L('not to scale', 'nicht massstäblich')), L('A hydrogen atom: an electron circling a proton', 'Ein Wasserstoffatom: ein Elektron kreist um ein Proton')); },
    fbd: (p, v) => drawing({ scale: 2.4e12 / p.n ** 2, pts: [{ c: [0, 0], q: 1, lab: L('proton', 'Proton') }, { c: [v.r, 0], q: -1, lab: L('electron', 'Elektron') }], dims: [[[0, 0], [v.r, 0], q(v.r, 'm'), -26]],
      forces: { a: { at: [v.r, 0], F: [-1, 0], lab: sv('F', 'el'), cls: 'k-1', off: [0, -14] }, b: { at: [0, 0], F: [1, 0], lab: sv('F', 'el'), cls: 'k-2', off: [0, -14] } }, arrow: 50 }, { show: new Set(['a', 'b']) }),
  };

  // ---------------------------------------------------------------- 2 two protons in a nucleus
  const nucleusPb = {
    id: 'nucleus', difficulty: 2, title: () => L('Two protons in a nucleus', 'Zwei Protonen im Kern'),
    make: (r) => ({ d: pick(r, [1.5, 2, 2.5, 3]) * 1e-15 }),
    solve: (p) => { const F = (K * E * E) / p.d ** 2; return { F, m: F / 9.81 }; },
    fields: () => [num$('F', 'F', 'N', L('repulsion', 'Abstossung'), false), num$('m', 'm', 'kg', L('mass with this weight', 'Masse mit dieser Gewichtskraft'), false)],
    text: (p) => L(`In a helium nucleus, the centres of the two protons are about ${q(p.d, 'm')} apart. How large is the electric force with which they repel each other? What mass would have a weight of this size (g = 9.81 m/s²)? (That the nucleus still holds together is due to another force, the strong nuclear force.)`,
      `In einem Heliumkern sind die Mittelpunkte der beiden Protonen etwa ${q(p.d, 'm')} voneinander entfernt. Wie gross ist die elektrische Kraft, mit der sie sich abstossen? Welche Masse hätte eine Gewichtskraft dieser Grösse (g = 9.81 m/s²)? (Dass der Kern trotzdem zusammenhält, liegt an einer anderen Kraft, der starken Kernkraft.)`),
    hints: () => [L('Each proton carries the elementary charge e = 1.6·10⁻¹⁹ C.', 'Jedes Proton trägt die Elementarladung e = 1.6·10⁻¹⁹ C.'), L('A weight F belongs to the mass m = F/g.', 'Zur Gewichtskraft F gehört die Masse m = F/g.')],
    steps: (p, v) => [
      step(L('The repulsion', 'Die Abstossung'), p$(L('Let $e$ be the charge of a proton and $d$ the distance. Two positive charges repel each other with', 'Sei $e$ die Ladung eines Protons und $d$ der Abstand. Zwei positive Ladungen stossen sich ab mit')) +
        `$$F = k\\,\\frac{e^2}{d^2} = ${KT}\\cdot\\frac{(${ET})^2}{(${mT(p.d)})^2} = ${res(tq(v.F, 'N'))}$$`),
      step(L('As a weight', 'Als Gewichtskraft'), p$(L('The mass whose weight is that large:', 'Die Masse mit einer so grossen Gewichtskraft:')) + `$$m = \\frac{F}{g} = \\frac{${tq(v.F, 'N')}}{9.81\\,\\mathrm{m/s^2}} = ${res(tq(v.m, 'kg'))}$$` +
        p$(L('A huge force on a tiny particle: it would push a proton away with an acceleration of about 10²⁸ m/s².', 'Eine riesige Kraft auf ein winziges Teilchen: Sie würde ein Proton mit einer Beschleunigung von etwa 10²⁸ m/s² wegstossen.'))),
    ],
    pic: () => { const a = A(); return a.svg(420, 220, a.bg(0, 0, 420, 220, 'night') + orbit(210, 105, 160, 80) + particle(370, 105, 6, 'electron', '') + particle(50, 105, 6, 'electron', '') +
      a.circle(195, 92, 15, 'rp-part neutron') + a.circle(226, 120, 15, 'rp-part neutron') + particle(222, 89, 15, 'proton', '+') + particle(197, 121, 15, 'proton', '+') + caption(210, 205, L('helium atom, not to scale', 'Heliumatom, nicht massstäblich')), L('A helium atom with its nucleus of two protons and two neutrons', 'Ein Heliumatom mit seinem Kern aus zwei Protonen und zwei Neutronen')); },
    fbd: (p) => drawing({ scale: 1.2e17, pts: [{ c: [0, 0], q: 1, lab: 'p' }, { c: [p.d, 0], q: 1, lab: 'p' }], dims: [[[0, 0], [p.d, 0], q(p.d, 'm'), -26]],
      forces: { a: { at: [p.d, 0], F: [1, 0], lab: sv('F'), cls: 'k-1', off: [0, -14] }, b: { at: [0, 0], F: [-1, 0], lab: sv('F'), cls: 'k-1', off: [0, -14] } }, arrow: 50 }, { show: new Set(['a', 'b']) }),
  };

  // ---------------------------------------------------------------- 3 ions in a salt crystal
  const CRYSTALS = [{ en: 'table salt (NaCl)', de: 'Kochsalz (NaCl)', plus: 'Na⁺', minus: 'Cl⁻', d: 2.82e-10 }, { en: 'potassium chloride (KCl)', de: 'Kaliumchlorid (KCl)', plus: 'K⁺', minus: 'Cl⁻', d: 3.15e-10 }, { en: 'lithium fluoride (LiF)', de: 'Lithiumfluorid (LiF)', plus: 'Li⁺', minus: 'F⁻', d: 2.01e-10 }];
  const salt = {
    id: 'salt', difficulty: 2, title: () => L('Ions in a crystal', 'Ionen in einem Kristall'),
    make: (r) => ({ c: pick(r, [0, 1, 2]) }),
    solve: (p) => { const d = CRYSTALS[p.c].d, F1 = (K * E * E) / d ** 2; return { d, F1, F: 0.75 * F1, dir: 'in' }; },
    fields: () => [num$('F1', 'F_1', 'N', L('force between neighbours', 'Kraft zwischen Nachbarn')), num$('F', 'F', 'N', L('net force on the end ion', 'resultierende Kraft auf das Endion')),
      choice('dir', L('It points …', 'Sie zeigt …'), [['in', L('into the crystal', 'ins Kristallinnere')], ['out', L('out of the crystal', 'aus dem Kristall hinaus')]])],
    text: (p) => { const c = CRYSTALS[p.c]; return L(`In a crystal of ${c.en}, positive ${c.plus} and negative ${c.minus} ions alternate, ${q(c.d, 'm')} apart. Each carries one elementary charge. How large is the force between two neighbouring ions? Consider a ${c.plus} ion at the end of a row ${c.plus} – ${c.minus} – ${c.plus} and only these two neighbours: how large is the net force on it, and where does it point?`,
      `In einem Kristall aus ${c.de} wechseln sich positive ${c.plus}- und negative ${c.minus}-Ionen ab, im Abstand von ${q(c.d, 'm')}. Jedes trägt eine Elementarladung. Wie gross ist die Kraft zwischen zwei benachbarten Ionen? Betrachte ein ${c.plus}-Ion am Ende einer Reihe ${c.plus} – ${c.minus} – ${c.plus} und nur diese beiden Nachbarn: Wie gross ist die resultierende Kraft darauf, und wohin zeigt sie?`); },
    hints: () => [L('Neighbours attract with k e²/d²; the next ion of the same sign, at 2d, repels with a quarter of that.', 'Nachbarn ziehen sich an mit k e²/d²; das nächste Ion gleichen Vorzeichens, in 2d, stösst mit einem Viertel davon ab.'), L('The two forces point in opposite directions: subtract.', 'Die beiden Kräfte zeigen in entgegengesetzte Richtungen: subtrahieren.')],
    steps: (p, v) => { const c = CRYSTALS[p.c]; return [
      step(L('Neighbours', 'Nachbarn'), p$(L(`Let $e$ be the elementary charge and $d$ the distance of neighbouring ions. ${c.plus} and ${c.minus} attract each other with`, `Sei $e$ die Elementarladung und $d$ der Abstand benachbarter Ionen. ${c.plus} und ${c.minus} ziehen sich an mit`)) +
        `$$F_1 = k\\,\\frac{e^2}{d^2} = ${KT}\\cdot\\frac{(${ET})^2}{(${mT(v.d)})^2} = ${res(tq(v.F1, 'N'))}$$`),
      step(L('The end of the row', 'Das Ende der Reihe'), p$(L(`The ${c.minus} ion pulls the end ion into the row with $F_1$; the ${c.plus} ion at $2d$ pushes it out with $F_1/4$. Net:`, `Das ${c.minus}-Ion zieht das Endion mit $F_1$ in die Reihe hinein; das ${c.plus}-Ion in $2d$ stösst es mit $F_1/4$ hinaus. Resultierend:`)) +
        `$$F = F_1 - \\frac{F_1}{4} = \\frac{3}{4}\\,F_1 = ${res(tq(v.F, 'N'))}$$` + p$(L(`It points ${rt('into the crystal')}: the crystal holds its ions together.`, `Sie zeigt ${rt('ins Kristallinnere')}: Der Kristall hält seine Ionen zusammen.`))),
    ]; },
    pic: (p) => { const a = A(), c = CRYSTALS[p.c]; let s = ''; for (let i = 0; i < 7; i++) for (let j = 0; j < 4; j++) { const plus = (i + j) % 2 === 0; s += particle(60 + 50 * i, 40 + 46 * j, plus ? 10 : 15, plus ? 'cation' : 'anion', plus ? '+' : '−'); }
      return a.svg(420, 220, a.bg(0, 0, 420, 220, 'night') + s + caption(210, 212, L(`${c.en}: ${c.plus} small, ${c.minus} large`, `${c.de}: ${c.plus} klein, ${c.minus} gross`)), L('Ions in a crystal lattice', 'Ionen in einem Kristallgitter')); },
    fbd: (p, v) => { const c = CRYSTALS[p.c], d = v.d; return drawing({ scale: 130 / d, pts: [{ c: [0, 0], q: 1, lab: c.plus, cls: 'hl' }, { c: [d, 0], q: -1, lab: c.minus }, { c: [2 * d, 0], q: 1, lab: c.plus }], dims: [[[0, 0], [d, 0], sv('d'), -44], [[d, 0], [2 * d, 0], sv('d'), -44]],
      forces: { a: { at: [0, 0.1 * d], F: [1, 0], lab: sv('F', '1'), cls: 'k-1', off: [0, -14] }, b: { at: [0, -0.1 * d], F: [-0.25, 0], lab: sv('F', '1') + '/4', cls: 'k-2', off: [-8, 4] }, n: { at: [0, 0], F: [0.75, 0], lab: sv('F'), cls: 'k-net', off: [8, 2] } }, arrow: 80 }, { show: new Set(['a', 'b', 'n']) }); },
  };

  // ---------------------------------------------------------------- 4 an alpha particle and a gold nucleus
  const alpha = {
    id: 'alpha', difficulty: 2, title: () => L('Rutherford’s experiment', 'Rutherfords Experiment'),
    make: (r) => ({ r: pick(r, [3, 5, 8, 10]) * 1e-14 }),
    solve: (p) => { const F = (K * 2 * 79 * E * E) / p.r ** 2; return { F, a: F / 6.64e-27 }; },
    fields: () => [num$('F', 'F', 'N', L('force on the alpha particle', 'Kraft auf das Alphateilchen'), false), num$('a', 'a', 'm/s²', L('its acceleration', 'seine Beschleunigung'))],
    text: (p) => L(`In Rutherford’s experiment, alpha particles (charge +2e, mass ${num(6.64e-27)} kg) are shot at gold foil. One of them comes within ${q(p.r, 'm')} of the centre of a gold nucleus (charge +79e). How large is the force on it there, and what acceleration does it give it?`,
      `In Rutherfords Experiment werden Alphateilchen (Ladung +2e, Masse ${num(6.64e-27)} kg) auf eine Goldfolie geschossen. Eines kommt bis auf ${q(p.r, 'm')} an den Mittelpunkt eines Goldkerns (Ladung +79e) heran. Wie gross ist die Kraft dort, und welche Beschleunigung verursacht sie?`),
    hints: () => [L('The charges: 2e and 79e, both positive, with e = 1.6·10⁻¹⁹ C.', 'Die Ladungen: 2e und 79e, beide positiv, mit e = 1.6·10⁻¹⁹ C.'), L('Newton: a = F/m.', 'Newton: a = F/m.')],
    steps: (p, v) => [
      step(L('The force', 'Die Kraft'), p$(L('Let $e$ be the elementary charge and $r$ the distance. The nucleus repels the alpha particle with', 'Sei $e$ die Elementarladung und $r$ der Abstand. Der Kern stösst das Alphateilchen ab mit')) +
        `$$F = k\\,\\frac{2e\\cdot 79e}{r^2} = ${KT}\\cdot\\frac{158\\cdot (${ET})^2}{(${mT(p.r)})^2} = ${res(tq(v.F, 'N'))}$$`),
      step(L('The acceleration', 'Die Beschleunigung'), p$(L('Let $m$ be the mass of the alpha particle:', 'Sei $m$ die Masse des Alphateilchens:')) + `$$a = \\frac{F}{m} = \\frac{${tq(v.F, 'N')}}{${tnum(6.64e-27)}\\,\\mathrm{kg}} = ${res(tq(v.a, 'm/s²'))}$$` +
        p$(L('Rutherford saw some alpha particles bounce back: only a tiny, heavy, positive nucleus can push that hard.', 'Rutherford sah einige Alphateilchen zurückprallen: Nur ein winziger, schwerer, positiver Kern kann so stark stossen.'))),
    ],
    pic: () => { const a = A(); return a.svg(420, 220, a.bg(0, 0, 420, 220, 'night') + nucleus(300, 110, 10, 12, 6) + `<path class="rp-alphapath" d="M20 70 C180 70 250 95 262 105 C250 120 180 150 30 190"/>` +
      particle(150, 76, 9, 'alpha', '') + caption(300, 160, L('gold nucleus', 'Goldkern')) + caption(150, 56, 'α'), L('An alpha particle deflected by a gold nucleus', 'Ein Alphateilchen, von einem Goldkern abgelenkt')); },
    fbd: (p) => drawing({ scale: 200 / p.r, pts: [{ c: [0, 0], q: 1, lab: '+79e' }, { c: [p.r, 0], q: 1, lab: '+2e', cls: 'hl' }], dims: [[[0, 0], [p.r, 0], q(p.r, 'm'), -26]],
      forces: { a: { at: [p.r, 0], F: [1, 0], lab: sv('F'), cls: 'k-1', off: [0, -14] } }, arrow: 60 }, { show: new Set(['a']) }),
  };

  // ---------------------------------------------------------------- 5 the hydrogen molecule ion
  const h2plus = {
    id: 'h2plus', difficulty: 3, title: () => L('The hydrogen molecule ion', 'Das Wasserstoff-Molekülion'),
    make: (r) => ({ d: pick(r, [1.0, 1.06, 1.2]) * 1e-10 }),
    solve: (p) => { const F0 = (K * E * E) / p.d ** 2; return { F0, F: 3 * F0, dir: 'in' }; },
    fields: () => [num$('F', 'F', 'N', L('net force on one proton', 'resultierende Kraft auf ein Proton')), choice('dir', L('It points …', 'Sie zeigt …'), [['in', L('towards the electron', 'zum Elektron hin')], ['out', L('away from the electron', 'vom Elektron weg')]])],
    text: (p) => L(`The simplest molecule, H₂⁺, has two protons ${q(p.d, 'm')} apart and a single electron. Take the electron at the midpoint between them. What net force acts on each proton, and where does it point? (The net force on the electron is zero: why?)`,
      `Das einfachste Molekül, H₂⁺, besteht aus zwei Protonen im Abstand von ${q(p.d, 'm')} und einem einzigen Elektron. Nimm an, das Elektron sei in der Mitte zwischen ihnen. Welche resultierende Kraft wirkt auf jedes Proton, und wohin zeigt sie? (Die resultierende Kraft auf das Elektron ist null: Warum?)`),
    hints: () => [L('On one proton: the other proton repels it from the distance d, the electron attracts it from d/2, four times as strongly.', 'Auf ein Proton: Das andere Proton stösst es aus dem Abstand d ab, das Elektron zieht es aus d/2 an, viermal so stark.'), L('Both forces lie on the line: subtract.', 'Beide Kräfte liegen auf der Geraden: subtrahieren.')],
    steps: (p, v) => [
      step(L('The two forces on a proton', 'Die beiden Kräfte auf ein Proton'), p$(L('Let $e$ be the elementary charge and $d$ the distance of the protons. The other proton repels with $F_0 = k\\,e^2/d^2$; the electron, at $d/2$, attracts with $k\\,e^2/(d/2)^2 = 4\\,F_0$.', 'Sei $e$ die Elementarladung und $d$ der Abstand der Protonen. Das andere Proton stösst mit $F_0 = k\\,e^2/d^2$ ab; das Elektron in $d/2$ zieht mit $k\\,e^2/(d/2)^2 = 4\\,F_0$ an.')) +
        `$$F_0 = ${KT}\\cdot\\frac{(${ET})^2}{(${mT(p.d)})^2} = ${tq(v.F0, 'N')}$$`),
      step(L('The net force', 'Die resultierende Kraft'), `$$F = 4\\,F_0 - F_0 = 3\\,F_0 = ${res(tq(v.F, 'N'))}$$` + p$(L(`It points ${rt('towards the electron')}: the electron holds the molecule together. The electron itself is pulled equally hard to both sides, so the net force on it is zero.`, `Sie zeigt ${rt('zum Elektron hin')}: Das Elektron hält das Molekül zusammen. Das Elektron selbst wird nach beiden Seiten gleich stark gezogen; die resultierende Kraft darauf ist null.`))),
    ],
    pic: () => { const a = A(); return a.svg(420, 220, a.bg(0, 0, 420, 220, 'night') + `<ellipse class="rp-cloud-e" cx="210" cy="110" rx="170" ry="70"/>` + particle(120, 110, 15, 'proton', '+') + particle(300, 110, 15, 'proton', '+') + particle(210, 110, 7, 'electron', '−') + caption(210, 205, L('H₂⁺: two protons share one electron', 'H₂⁺: Zwei Protonen teilen sich ein Elektron')), L('The hydrogen molecule ion', 'Das Wasserstoff-Molekülion')); },
    fbd: (p) => { const d = p.d; return drawing({ scale: 280 / d, pts: [{ c: [0, 0], q: 1, lab: 'p', cls: 'hl' }, { c: [d / 2, 0], q: -1, lab: 'e' }, { c: [d, 0], q: 1, lab: 'p' }], dims: [[[0, 0], [d / 2, 0], sv('d') + '/2', -26], [[d / 2, 0], [d, 0], sv('d') + '/2', -26]],
      forces: { a: { at: [0, 0.05 * d], F: [4, 0], lab: `4${sv('F', '0')}`, cls: 'k-1', off: [0, -14] }, b: { at: [0, -0.05 * d], F: [-1, 0], lab: sv('F', '0'), cls: 'k-2', off: [-8, 4] } }, arrow: 100 }, { show: new Set(['a', 'b']) }); },
  };

  // ---------------------------------------------------------------- 6 Coulomb's torsion balance
  const torsion = {
    id: 'torsion', difficulty: 3, title: () => L('Coulomb’s torsion balance', 'Coulombs Drehwaage'),
    make: (r) => ({ qn: pick(r, [10, 20, 30, 40, 50]), r: pick(r, [5, 6, 8, 10, 12]) / 100 }),
    solve: (p) => { const F = (K * (p.qn * 1e-9) ** 2) / p.r ** 2; return { F, q: p.qn * 1e-9, F2: 4 * F }; },
    fields: (p) => [num$('q', 'q', 'nC', L('charge of each sphere', 'Ladung jeder Kugel'), false), num$('F2', "F'", CL.forceUnit(4 * (K * (p.qn * 1e-9) ** 2) / p.r ** 2), L('force at half the distance', 'Kraft beim halben Abstand'), false)],
    text: (p) => { const F = (K * (p.qn * 1e-9) ** 2) / p.r ** 2; return L(`In 1785, Charles-Augustin de Coulomb measured the force between two small charged metal spheres with a torsion balance. Suppose the two spheres carry equal charges; their centres are ${q(p.r, 'cm')} apart (much more than their size of a few millimetres, so they act like point charges), and the balance shows a force of ${q(F, CL.forceUnit(F))}. What is the charge of each sphere? What force would the balance show at half the distance?`,
      `1785 mass Charles-Augustin de Coulomb die Kraft zwischen zwei kleinen geladenen Metallkugeln mit einer Drehwaage. Die beiden Kugeln tragen gleiche Ladungen; ihre Mittelpunkte sind ${q(p.r, 'cm')} voneinander entfernt (viel mehr als ihre Grösse von wenigen Millimetern, sodass sie wie Punktladungen wirken), und die Waage zeigt eine Kraft von ${q(F, CL.forceUnit(F))}. Welche Ladung trägt jede Kugel? Welche Kraft zeigte die Waage beim halben Abstand?`); },
    hints: () => [L('Equal charges: F = k q²/r², so q = r √(F/k).', 'Gleiche Ladungen: F = k q²/r², also q = r √(F/k).'), L('Half the distance: four times the force.', 'Halber Abstand: vierfache Kraft.')],
    steps: (p, v) => [
      step(L('The charge', 'Die Ladung'), p$(L('Let $q$ be the charge of each sphere, $r$ the distance and $F$ the force. Then $F = k\\,q^2/r^2$, so', 'Sei $q$ die Ladung jeder Kugel, $r$ der Abstand und $F$ die Kraft. Dann ist $F = k\\,q^2/r^2$, also')) +
        `$$q = r\\,\\sqrt{\\frac{F}{k}} = ${mT(p.r)}\\cdot\\sqrt{\\frac{${tq(v.F, 'N')}}{${KT}}} = ${res(tq(v.q, 'nC'))}$$`),
      step(L('Half the distance', 'Halber Abstand'), p$(L('The force goes with $1/r^2$: half the distance, four times the force.', 'Die Kraft geht mit $1/r^2$: halber Abstand, vierfache Kraft.')) + `$$F' = 4\\,F = ${res(tq(v.F2, CL.forceUnit(v.F2)))}$$` +
        p$(L('Exactly this is what Coulomb found: the force falls with the square of the distance.', 'Genau das fand Coulomb heraus: Die Kraft nimmt mit dem Quadrat des Abstands ab.'))),
    ],
    pic: () => { const a = A(); return a.svg(420, 230, a.bg(0, 0, 420, 230, 'metal') + a.rect(110, 30, 310, 200, 'rp-glasscyl', 12) + a.rect(190, 6, 230, 30, 'rp-dark', 3) + a.line([210, 30], [210, 120], 'rp-fibre') +
      a.line([140, 120], [280, 120], 'rp-rodline') + a.circle(140, 120, 9, 'rp-ball-metal') + a.circle(300, 120, 4, 'rp-dark') + a.circle(272, 120, 9, 'rp-ball-metal') + a.circle(290, 132, 9, 'rp-ball-metal') + a.line([290, 141], [290, 196], 'rp-rodline') +
      a.rect(100, 200, 320, 214, 'rp-dark', 2) + a.path('M120 160 A110 40 0 0 0 300 160', 'rp-scaleline') + a.text(210, 226, L('torsion fibre, rod with spheres, scale', 'Torsionsfaden, Stab mit Kugeln, Skala'), 'rp-caption-dark'), L('Coulomb’s torsion balance', 'Coulombs Drehwaage')); },
    fbd: (p, v) => drawing({ scale: 220 / p.r, pts: [{ c: [0, 0], q: 1, lab: sv('q') }, { c: [p.r, 0], q: 1, lab: sv('q') }], dims: [[[0, 0], [p.r, 0], q(p.r, 'cm'), -26]],
      forces: { a: { at: [p.r, 0], F: [1, 0], lab: sv('F'), cls: 'k-1', off: [0, -14] }, b: { at: [0, 0], F: [-1, 0], lab: sv('F'), cls: 'k-1', off: [0, -14] } }, arrow: 50 }, { show: new Set(['a', 'b']) }),
  };

  // ---------------------------------------------------------------- 7 nuclear fission
  const fission = {
    id: 'fission', difficulty: 3, title: () => L('Nuclear fission', 'Kernspaltung'),
    make: (r) => ({ d: pick(r, [1.2, 1.4, 1.6]) * 1e-14, pair: pick(r, [0, 1]) }),
    solve: (p) => { const [Z1, Z2, A2] = p.pair ? [54, 38, 94] : [56, 36, 92]; const F = (K * Z1 * Z2 * E * E) / p.d ** 2; return { F, a: F / (A2 * U), Z1, Z2, A2 }; },
    fields: () => [num$('F', 'F', 'N', L('repulsion', 'Abstossung'), false), num$('a', 'a', 'm/s²', L('acceleration of the lighter nucleus', 'Beschleunigung des leichteren Kerns'))],
    text: (p) => { const [n1, n2, Z1, Z2, A2] = p.pair ? ['xenon', 'strontium', 54, 38, 94] : ['barium', 'krypton', 56, 36, 92]; const de = { xenon: 'Xenon', strontium: 'Strontium', barium: 'Barium', krypton: 'Krypton' };
      return L(`A uranium-235 nucleus captures a neutron and splits into a ${n1} nucleus (${Z1} protons) and a ${n2} nucleus (${Z2} protons, mass ${A2} u, with 1 u = 1.66·10⁻²⁷ kg). Just after the split, their centres are ${q(p.d, 'm')} apart. How hard do they repel each other, and what is the acceleration of the ${n2} nucleus?`,
        `Ein Uran-235-Kern fängt ein Neutron ein und spaltet sich in einen ${de[n1]}kern (${Z1} Protonen) und einen ${de[n2]}kern (${Z2} Protonen, Masse ${A2} u, mit 1 u = 1.66·10⁻²⁷ kg). Kurz nach der Spaltung sind ihre Mittelpunkte ${q(p.d, 'm')} voneinander entfernt. Wie stark stossen sie sich ab, und wie gross ist die Beschleunigung des ${de[n2]}kerns?`); },
    hints: () => [L('Each nucleus acts like a point charge Z·e at its centre.', 'Jeder Kern wirkt wie eine Punktladung Z·e in seinem Mittelpunkt.'), L('a = F/m, with the mass in kilograms.', 'a = F/m, mit der Masse in Kilogramm.')],
    steps: (p, v) => [
      step(L('The repulsion', 'Die Abstossung'), p$(L('Let $Z_1\\,e$ and $Z_2\\,e$ be the charges and $d$ the distance of the centres:', 'Seien $Z_1\\,e$ und $Z_2\\,e$ die Ladungen und $d$ der Abstand der Mittelpunkte:')) +
        `$$F = k\\,\\frac{Z_1 Z_2\\,e^2}{d^2} = ${KT}\\cdot\\frac{${v.Z1}\\cdot ${v.Z2}\\cdot (${ET})^2}{(${mT(p.d)})^2} = ${res(tq(v.F, 'N'))}$$`),
      step(L('The acceleration', 'Die Beschleunigung'), p$(L(`The mass is $m = ${v.A2}\\cdot 1.66\\cdot 10^{-27}\\,\\mathrm{kg}$:`, `Die Masse ist $m = ${v.A2}\\cdot 1.66\\cdot 10^{-27}\\,\\mathrm{kg}$:`)) + `$$a = \\frac{F}{m} = ${res(tq(v.a, 'm/s²'))}$$` +
        p$(L('This electric repulsion drives the fragments apart: most of the energy of fission comes from it.', 'Diese elektrische Abstossung treibt die Bruchstücke auseinander: Der grösste Teil der Energie der Kernspaltung stammt daraus.'))),
    ],
    pic: () => { const a = A(); return a.svg(420, 220, a.bg(0, 0, 420, 220, 'night') + nucleus(150, 110, 14, 18, 6, 5) + nucleus(275, 110, 10, 13, 6, 7) + `<path class="rp-speedline" d="M90 80h-40M90 110h-50M90 140h-40M335 90h40M335 120h50"/>` +
      caption(130, 190, L('heavier fragment', 'schwereres Bruchstück')) + caption(300, 190, L('lighter fragment', 'leichteres Bruchstück')), L('The two fragments of a split uranium nucleus fly apart', 'Die beiden Bruchstücke eines gespaltenen Urankerns fliegen auseinander')); },
    fbd: (p, v) => drawing({ scale: 200 / p.d, pts: [{ c: [0, 0], q: 1, lab: `${v.Z1}e` }, { c: [p.d, 0], q: 1, lab: `${v.Z2}e`, cls: 'hl' }], dims: [[[0, 0], [p.d, 0], q(p.d, 'm'), -26]],
      forces: { a: { at: [p.d, 0], F: [1, 0], lab: sv('F'), cls: 'k-1', off: [0, -14] }, b: { at: [0, 0], F: [-1, 0], lab: sv('F'), cls: 'k-1', off: [0, -14] } }, arrow: 55 }, { show: new Set(['a', 'b']) }),
  };

  // ---------------------------------------------------------------- 8 two electrons around a nucleus
  const ATOMS = [{ en: 'a helium atom', de: 'einem Heliumatom', Z: 2, r: 3.1e-11 }, { en: 'a lithium ion Li⁺', de: 'einem Lithiumion Li⁺', Z: 3, r: 1.8e-11 }, { en: 'a beryllium ion Be²⁺', de: 'einem Berylliumion Be²⁺', Z: 4, r: 1.3e-11 }];
  const helium = {
    id: 'helium', difficulty: 4, title: () => L('Two electrons, one nucleus', 'Zwei Elektronen, ein Kern'),
    make: (r) => ({ a: pick(r, [0, 1, 2]) }),
    solve: (p) => { const { Z, r } = ATOMS[p.a], F0 = (K * E * E) / r ** 2; return { r, Fn: Z * F0, Fe: F0 / 4, F: (Z - 0.25) * F0, dir: 'in' }; },
    fields: () => [num$('Fn', 'F_\\mathrm{K}', 'N', L('attraction of the nucleus', 'Anziehung des Kerns')), num$('F', 'F', 'N', L('net force on one electron', 'resultierende Kraft auf ein Elektron')), choice('dir', L('It points …', 'Sie zeigt …'), [['in', L('towards the nucleus', 'zum Kern hin')], ['out', L('away from the nucleus', 'vom Kern weg')]])],
    text: (p) => { const at = ATOMS[p.a]; return L(`In a simple picture of ${at.en}, two electrons circle the nucleus (charge +${at.Z}e) at a distance of ${q(at.r, 'm')}, always on opposite sides of it. How large is the attraction of the nucleus on one electron? What is the net force on it, taking into account the other electron, and where does it point?`,
      `In einem einfachen Bild von ${at.de} kreisen zwei Elektronen im Abstand von ${q(at.r, 'm')} um den Kern (Ladung +${at.Z}e), stets auf gegenüberliegenden Seiten. Wie gross ist die Anziehung des Kerns auf ein Elektron? Wie gross ist die resultierende Kraft darauf, mit dem anderen Elektron, und wohin zeigt sie?`); },
    hints: () => [L('The nucleus attracts with k·Ze·e/r²; the other electron, at 2r on the far side, repels with k e²/(2r)².', 'Der Kern zieht mit k·Ze·e/r² an; das andere Elektron, in 2r auf der Gegenseite, stösst mit k e²/(2r)² ab.'), L('Both forces lie on one line, in opposite directions.', 'Beide Kräfte liegen auf einer Geraden, in entgegengesetzte Richtungen.')],
    steps: (p, v) => { const { Z } = ATOMS[p.a]; return [
      step(L('The nucleus', 'Der Kern'), p$(L(`Let $e$ be the elementary charge and $r$ the distance. The nucleus, with $${Z}e$, attracts each electron with`, `Sei $e$ die Elementarladung und $r$ der Abstand. Der Kern mit $${Z}e$ zieht jedes Elektron an mit`)) +
        `$$F_\\mathrm{K} = k\\,\\frac{${Z}\\,e^2}{r^2} = ${KT}\\cdot\\frac{${Z}\\cdot (${ET})^2}{(${mT(v.r)})^2} = ${res(tq(v.Fn, 'N'))}$$`),
      step(L('The other electron', 'Das andere Elektron'), p$(L('It is $2r$ away, on the far side of the nucleus, and repels: outwards.', 'Es ist $2r$ entfernt, auf der anderen Seite des Kerns, und stösst ab: nach aussen.')) + `$$F_\\mathrm{e} = k\\,\\frac{e^2}{(2r)^2} = \\frac{F_\\mathrm{K}}{${4 * Z}} = ${tq(v.Fe, 'N')}$$`),
      step(L('The net force', 'Die resultierende Kraft'), `$$F = F_\\mathrm{K} - F_\\mathrm{e} = ${res(tq(v.F, 'N'))}$$` + p$(L(`It points ${rt('towards the nucleus')}: the other electron weakens the attraction only a little.`, `Sie zeigt ${rt('zum Kern hin')}: Das andere Elektron schwächt die Anziehung nur wenig.`))),
    ]; },
    pic: (p) => { const a = A(), Z = ATOMS[p.a].Z; return a.svg(420, 220, a.bg(0, 0, 420, 220, 'night') + orbit(210, 110, 120, 60) + nucleus(210, 110, Z, Z + (Z > 2 ? 1 : 0), 7, 2) + particle(90, 110, 7, 'electron', '−') + particle(330, 110, 7, 'electron', '−') + caption(210, 205, L('not to scale', 'nicht massstäblich')), L('Two electrons on opposite sides of a nucleus', 'Zwei Elektronen auf gegenüberliegenden Seiten eines Kerns')); },
    fbd: (p, v) => { const r = v.r, Z = ATOMS[p.a].Z; return drawing({ scale: 130 / r, pts: [{ c: [-r, 0], q: -1, lab: 'e' }, { c: [0, 0], q: 1, lab: `+${Z}e` }, { c: [r, 0], q: -1, lab: 'e', cls: 'hl' }], dims: [[[-r, 0], [0, 0], sv('r'), -26], [[0, 0], [r, 0], sv('r'), -26]],
      forces: { a: { at: [r, 0.1 * r], F: [-Z, 0], lab: sv('F', 'K'), cls: 'k-1', off: [0, -14] }, b: { at: [r, -0.1 * r], F: [0.25, 0], lab: sv('F', 'e'), cls: 'k-2', off: [8, 4] } }, arrow: 100 }, { show: new Set(['a', 'b']) }); },
  };

  // ---------------------------------------------------------------- 9 quarks in a proton
  const quarks = {
    id: 'quarks', difficulty: 4, title: () => L('Quarks in a proton', 'Quarks im Proton'),
    make: (r) => ({ a: pick(r, [0.8, 0.9, 1.0]) * 1e-15 }),
    solve: (p) => { const F1 = (K * (2 / 3) * (1 / 3) * E * E) / p.a ** 2; return { F1, F: Math.sqrt(3) * F1 }; },
    fields: () => [num$('F1', 'F_1', 'N', L('force of one up quark', 'Kraft eines Up-Quarks'), false), num$('F', 'F', 'N', L('net force on the down quark', 'resultierende Kraft auf das Down-Quark'), false)],
    text: (p) => L(`A proton consists of two up quarks (charge +⅔e each) and one down quark (charge −⅓e). In a toy model, they sit at the corners of an equilateral triangle with sides of ${q(p.a, 'm')}. How large is the force of one up quark on the down quark? How large is the net force on the down quark? (In reality the strong force is much larger and holds the quarks together.)`,
      `Ein Proton besteht aus zwei Up-Quarks (Ladung je +⅔e) und einem Down-Quark (Ladung −⅓e). In einem Spielzeugmodell sitzen sie an den Ecken eines gleichseitigen Dreiecks mit der Seitenlänge ${q(p.a, 'm')}. Wie gross ist die Kraft eines Up-Quarks auf das Down-Quark? Wie gross ist die resultierende Kraft auf das Down-Quark? (In Wirklichkeit ist die starke Kraft viel grösser und hält die Quarks zusammen.)`),
    hints: () => [L('Each up quark attracts the down quark with k·(⅔e)(⅓e)/a².', 'Jedes Up-Quark zieht das Down-Quark mit k·(⅔e)(⅓e)/a² an.'), L('The two forces have the same size and are 60° apart: their sum is 2 F₁ cos 30° = √3 F₁.', 'Die beiden Kräfte sind gleich gross und schliessen 60° ein: Ihre Summe ist 2 F₁ cos 30° = √3 F₁.')],
    steps: (p, v) => [
      step(L('One up quark', 'Ein Up-Quark'), p$(L('Let $e$ be the elementary charge and $a$ the side of the triangle. Opposite signs: attraction with', 'Sei $e$ die Elementarladung und $a$ die Seitenlänge des Dreiecks. Entgegengesetzte Vorzeichen: Anziehung mit')) +
        `$$F_1 = k\\,\\frac{\\tfrac{2}{3}e\\cdot\\tfrac{1}{3}e}{a^2} = ${KT}\\cdot\\frac{\\tfrac{2}{9}\\,(${ET})^2}{(${mT(p.a)})^2} = ${res(tq(v.F1, 'N'))}$$`),
      step(L('Both up quarks', 'Beide Up-Quarks'), p$(L('The two forces have the same size and are 60° apart, each 30° from the line to the midpoint between the up quarks. Their components across that line cancel, those along it add:', 'Die beiden Kräfte sind gleich gross und schliessen 60° ein, je 30° zur Geraden zur Mitte zwischen den Up-Quarks. Ihre Komponenten quer dazu heben sich auf, die entlang davon addieren sich:')) +
        `$$F = 2\\,F_1\\cos 30^\\circ = \\sqrt{3}\\,F_1 = ${res(tq(v.F, 'N'))}$$` + p$(L('It points from the down quark towards the midpoint between the two up quarks.', 'Sie zeigt vom Down-Quark zur Mitte zwischen den beiden Up-Quarks.'))),
    ],
    pic: () => { const a = A(); return a.svg(420, 220, a.bg(0, 0, 420, 220, 'night') + a.circle(210, 115, 92, 'rp-protonblob') + particle(170, 150, 15, 'up', 'u') + particle(250, 150, 15, 'up', 'u') + particle(210, 82, 15, 'down', 'd') + caption(210, 214, L('proton: up, up, down', 'Proton: up, up, down')), L('A proton made of three quarks', 'Ein Proton aus drei Quarks')); },
    fbd: (p) => { const s = Math.sqrt(3) / 2; return drawing({ scale: 150, before: (P) => P.poly([[0, s], [-0.5, 0], [0.5, 0]], 'outline'), pts: [{ c: [0, s], q: -1, lab: '−⅓e', cls: 'hl' }, { c: [-0.5, 0], q: 1, lab: '+⅔e', off: [-14, 16] }, { c: [0.5, 0], q: 1, lab: '+⅔e', off: [14, 16] }],
      forces: { a: { at: [0, s], F: [-0.5, -s], lab: sv('F', '1'), cls: 'k-1' }, b: { at: [0, s], F: [0.5, -s], lab: sv('F', '1'), cls: 'k-2' }, n: { at: [0, s], F: [0, -2 * s], lab: sv('F'), cls: 'k-net' } }, arrow: 90 }, { show: new Set(['a', 'b', 'n']) }); },
  };

  const PROBLEMS = [hydrogen, nucleusPb, salt, alpha, torsion, h2plus, fission, helium, quarks];

  // ---------------------------------------------------------------- exercises
  function realOf(i, seed) {
    const pb = PROBLEMS[i], p = pb.make(rng(seed)), v = pb.solve(p);
    const fields = pb.fields(p).map((f) => (f.type === 'num' ? { ...f, value: CL.inUnit(v[f.key], f.unit), traps: [] } : { ...f, value: v[f.key] }));
    return {
      scenario: 'real', difficulty: pb.difficulty, title: pb.title(), text: `<p>${pb.text(p)}</p><p class="note">${L('Take k = 9.0·10⁹ N·m²/C² and e = 1.6·10⁻¹⁹ C.', 'Rechne mit k = 9.0·10⁹ N·m²/C² und e = 1.6·10⁻¹⁹ C.')}</p>`,
      fields,
      figure: () => (root.Art ? pb.pic(p) : ''),
      solutionFigure: () => pb.fbd(p, v),
      hints: pb.hints(p), solution: pb.steps(p, v),
      results: fields.map((f) => (f.type === 'num' ? `$${f.sym} = ${tq(v[f.key], f.unit)}$` : f.options.find((o) => o[0] === f.value)[1])).join(', '),
      p, v,
    };
  }

  root.CoulombProblems = { PROBLEMS, realOf };
  if (typeof module !== 'undefined') module.exports = root.CoulombProblems;
})(typeof window !== 'undefined' ? window : globalThis);
