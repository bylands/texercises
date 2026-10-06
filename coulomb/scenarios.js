// The situations of the app, from the worksheet “Force Vectors” and around it: point charges, the
// Coulomb force between two of them, and the net force of several (superposition). Each situation:
//   { id, difficulty, title(p), make(r) → parameters p, solve(p, o) → values v (SI; with a flag
//     of traps set in o: the result of that wrong idea), traps: [flag], why: { flag: () => text },
//     fields(p) → [field], text(p), hints(p, v), steps(p, v) → [{ text, show: [force keys] }],
//     figure(p, v, view) }
// A field is a number { key, type: 'num', sym, unit, what } (its value in the unit), a choice
// { key, type: 'choice', what, options: [[value, html]] }, a direction { key, type: 'dir', what,
// dirs } (the eight of the compass and '0') or a ranking { key, type: 'rank', what, items }.
// view: { task: true } the situation; { show: Set } with the forces of those keys drawn.
(function (root) {
  'use strict';

  const CL = root.CL, { Pic } = root.Draw;
  const { L, K, force, add, len, unit, mul, sub, dirOf, dirName, ARROW, q, tq, qs, tqs, num, tnum, sig, inUnit, forceUnit, pick, sign, shuffle } = CL;

  // ---------------------------------------------------------------- helpers
  const step = (rule, html, show = [], hl = []) => ({ text: `<p class="step-rule">${rule}</p>${html}`, show, hl });
  const p$ = (s) => `<p>${s}</p>`;
  const m$ = (s) => `$${s}$`;
  const res = (x) => `\\htmlClass{result}{${x}}`;
  const rt = (x) => `<span class="result">${x}</span>`; // a result in the text
  const num$ = (key, sym, unit, what) => ({ key, type: 'num', sym, unit, what });
  const choice = (key, what, options, want) => ({ key, type: 'choice', what, options, want });
  const dirField = (key, what, dirs) => ({ key, type: 'dir', what, dirs });
  // SVG labels: an italic letter with an upright subscript
  const sv = (l, s = '') => `<tspan font-style="italic">${l}</tspan>${s ? `<tspan class="sub" dy="4">${s}</tspan><tspan dy="-4">\u200b</tspan>` : ''}`;
  const kq = 'k\\,\\frac{|q_1|\\,|q_2|}{r^2}';
  const KT = '9.0\\cdot 10^{9}\\,\\mathrm{\\tfrac{N\\,m^2}{C^2}}';
  const qC = (x) => `${tnum(Math.abs(x))}\\,\\mathrm{C}`; // |q| in C
  const mT = (x) => `${tnum(x)}\\,\\mathrm{m}`;
  const attractRepel = () => [['attract', L('they attract each other', 'sie ziehen sich an')], ['repel', L('they repel each other', 'sie stossen sich ab')]];
  const DIR_ALL = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', '0'];
  const arrowWord = (d) => `${ARROW[d]} ${dirName(d)}`;
  const word = (n) => ({ 2: L('two', 'zwei'), 3: L('three', 'drei'), 4: L('four', 'vier') }[n] || n);

  // A drawing of point charges: pts [{ c (m), q (sign), lab, cls }], scale px/m, dims [[a, b, label,
  // off]], forces { key: { at, F (N), lab, cls } } of which those in view.show are drawn, their
  // lengths in proportion (the largest 85 px).
  function drawing(o, view = {}) {
    const P = new Pic(o.scale, o.label || '');
    if (o.before) o.before(P);
    (o.dims || []).forEach(([a, b, l, off, cls]) => P.dim(a, b, l, off, `dimline${cls ? ` ${cls}` : ''}`));
    o.pts.forEach((pt) => P.charge(pt.c, pt.q, pt.lab, pt.cls || '', pt.off));
    // all forces, those not shown hidden: every frame of a worked example has the same size, and an
    // arrow the same length in every frame
    const all = Object.entries(o.forces || {});
    const big = Math.max(...all.map(([, f]) => len(f.F)), 1e-300);
    all.forEach(([k, f]) => {
      const hidden = !(view.show && view.show.has(k)) ? ' hidden' : '';
      const L0 = len(f.F);
      if (L0 < 1e-12 * big) return;
      const u = unit(f.F), l = Math.max(16, (o.arrow || 85) * (L0 / big));
      const off = [u[0] > 0.35 ? 8 : u[0] < -0.35 ? -8 : 9, u[1] > 0.35 ? -8 : u[1] < -0.35 ? 14 : 0];
      P.arrow(f.at, u, l, `force ${f.cls || ''}${view.hl && view.hl.has(k) ? ' hl' : ''}${hidden}`, f.lab, f.off || off);
    });
    if (o.after) o.after(P, view);
    return P.svg();
  }

  // ---------------------------------------------------------------- 1 two charges
  const QS = [1, 2, 3, 4, 5, 6, 8];
  const RS = [10, 15, 20, 30, 40, 50, 60];
  function pairMake(r) {
    return { q1: sign(r) * pick(r, QS) * 1e-6, q2: sign(r) * pick(r, QS) * 1e-6, r: pick(r, RS) / 100 };
  }
  const pairF = (p) => (K * Math.abs(p.q1 * p.q2)) / p.r ** 2;
  const kind = (p) => (p.q1 * p.q2 > 0 ? 'repel' : 'attract');
  function pairFigure(p, v, view, o = {}) {
    const s = 220 / p.r, a = [0, 0], b = [p.r, 0], F = v.F != null ? v.F : pairF(p), at = kind(p) === 'attract' ? 1 : -1;
    return drawing({
      scale: s,
      pts: [{ c: a, q: Math.sign(p.q1), lab: o.lab1 || qs(p.q1, 'μC') }, { c: b, q: Math.sign(o.q2sign != null ? o.q2sign : p.q2), lab: o.lab2 || qs(p.q2, 'μC') }],
      dims: [[a, b, o.rlab || q(p.r, 'cm'), -26]],
      forces: { F12: { at: b, F: [-at * F, 0], lab: sv('F', '12'), cls: 'k-1' }, F21: { at: a, F: [at * F, 0], lab: sv('F', '21'), cls: 'k-2' } },
      arrow: 60,
    }, view);
  }
  const pairSteps = (p, F, find) => [
    step(L('Attraction or repulsion', 'Anziehung oder Abstossung'), p$(kind(p) === 'attract'
      ? L('The charges have opposite signs: they attract each other.', 'Die Ladungen haben entgegengesetzte Vorzeichen: Sie ziehen sich an.')
      : L('The charges have the same sign: they repel each other.', 'Die Ladungen haben das gleiche Vorzeichen: Sie stossen sich ab.')), ['F12', 'F21']),
  ];

  const pair = {
    id: 'pair', difficulty: 1,
    title: () => L('Two charges', 'Zwei Ladungen'),
    make: pairMake,
    solve: (p, o = {}) => ({ F: o.noSquare ? (K * Math.abs(p.q1 * p.q2)) / p.r : o.cm ? (K * Math.abs(p.q1 * p.q2)) / (100 * p.r) ** 2 : pairF(p), kind: kind(p) }),
    traps: ['noSquare'],
    why: { noSquare: () => L('The distance counts squared: r² in the denominator.', 'Der Abstand zählt im Quadrat: r² im Nenner.') },
    fields: (p) => [num$('F', 'F', forceUnit(pairF(p)), L('force', 'Kraft')), choice('kind', L('The charges …', 'Die Ladungen …'), attractRepel(), L('whether they attract or repel each other', 'ob sie sich anziehen oder abstossen'))],
    text: (p) => L(`Two small charged spheres carry charges of ${qs(p.q1, 'μC')} and ${qs(p.q2, 'μC')}; their centres are ${q(p.r, 'cm')} apart. How large is the force between them? Do they attract or repel each other?`,
      `Zwei kleine geladene Kugeln tragen die Ladungen ${qs(p.q1, 'μC')} und ${qs(p.q2, 'μC')}; ihre Mittelpunkte sind ${q(p.r, 'cm')} voneinander entfernt. Wie gross ist die Kraft zwischen ihnen? Ziehen sie sich an oder stossen sie sich ab?`),
    hints: () => [
      L('Like charges repel, unlike charges attract.', 'Gleichnamige Ladungen stossen sich ab, ungleichnamige ziehen sich an.'),
      L(`Coulomb's law: ${m$(`F = ${kq}`)} with $k = ${KT}$. Charges in coulombs, the distance in metres.`, `Coulombgesetz: ${m$(`F = ${kq}`)} mit $k = ${KT}$. Ladungen in Coulomb, Abstand in Metern.`),
    ],
    steps: (p, v) => [
      ...pairSteps(p),
      step(L("Coulomb's law", 'Coulombgesetz'), p$(L('Let $q_1$ and $q_2$ be the charges and $r$ their distance. The force has the size', 'Seien $q_1$ und $q_2$ die Ladungen und $r$ ihr Abstand. Die Kraft hat den Betrag')) +
        `$$F = ${kq} = ${KT}\\cdot\\frac{${qC(p.q1)}\\cdot ${qC(p.q2)}}{(${mT(p.r)})^2} = ${res(tq(v.F, forceUnit(v.F)))}$$` +
        p$(L('Both charges feel a force of this size, in opposite directions (Newton’s third law).', 'Beide Ladungen spüren eine Kraft dieser Grösse, in entgegengesetzte Richtungen (actio = reactio).')), ['F12', 'F21']),
    ],
    figure: (p, v, view) => pairFigure(p, v, view),
  };

  // the distance from the force
  const pairR = {
    id: 'pair-r', difficulty: 2,
    title: () => L('How far apart?', 'Wie weit entfernt?'),
    make: pairMake,
    solve: (p, o = {}) => { const F = pairF(p), c = K * Math.abs(p.q1 * p.q2); return { r: o.noRoot ? c / F : o.noSquare ? c / F : p.r, F }; },
    traps: ['noRoot', 'noSquare'],
    why: { noRoot: () => L('The law gives r²: take the square root.', 'Das Gesetz liefert r²: Zieh die Wurzel.'), noSquare: () => L('The distance counts squared: r² in the denominator.', 'Der Abstand zählt im Quadrat: r² im Nenner.') },
    fields: () => [num$('r', 'r', 'cm', L('distance', 'Abstand'))],
    text: (p) => L(`Two small spheres with charges of ${qs(p.q1, 'μC')} and ${qs(p.q2, 'μC')} ${kind(p) === 'attract' ? 'attract' : 'repel'} each other with a force of ${q(pairF(p), forceUnit(pairF(p)))}. How far apart are their centres?`,
      `Zwei kleine Kugeln mit den Ladungen ${qs(p.q1, 'μC')} und ${qs(p.q2, 'μC')} ${kind(p) === 'attract' ? 'ziehen sich' : 'stossen sich'} mit einer Kraft von ${q(pairF(p), forceUnit(pairF(p)))} ${kind(p) === 'attract' ? 'an' : 'ab'}. Wie weit sind ihre Mittelpunkte voneinander entfernt?`),
    hints: () => [
      L(`Solve Coulomb's law ${m$(`F = ${kq}`)} for $r$.`, `Löse das Coulombgesetz ${m$(`F = ${kq}`)} nach $r$ auf.`),
      L('Force in newtons, charges in coulombs: the distance comes out in metres.', 'Kraft in Newton, Ladungen in Coulomb: Der Abstand kommt in Metern heraus.'),
    ],
    steps: (p, v) => [
      step(L('Solve for the distance', 'Nach dem Abstand auflösen'), p$(L("Let $q_1$, $q_2$ be the charges, $F$ the force and $r$ the distance. From Coulomb's law,", 'Seien $q_1$, $q_2$ die Ladungen, $F$ die Kraft und $r$ der Abstand. Aus dem Coulombgesetz folgt')) +
        `$$F = ${kq} \\;\\Rightarrow\\; r = \\sqrt{\\frac{k\\,|q_1|\\,|q_2|}{F}}$$`, ['F12', 'F21']),
      step(L('The numbers', 'Die Zahlen'), `$$r = \\sqrt{\\frac{${KT}\\cdot ${qC(p.q1)}\\cdot ${qC(p.q2)}}{${tq(v.F, 'N')}}} = ${tq(p.r, 'm')} = ${res(tq(p.r, 'cm'))}$$`, ['F12', 'F21']),
    ],
    figure: (p, v, view) => pairFigure(p, v, view, { rlab: view.show && view.show.size ? q(p.r, 'cm') : '?' }),
  };

  // a charge from the force
  const pairQ = {
    id: 'pair-q', difficulty: 2,
    title: () => L('An unknown charge', 'Eine unbekannte Ladung'),
    make: pairMake,
    solve: (p, o = {}) => { const F = pairF(p); return { q2: o.noSquare ? (F * p.r) / (K * Math.abs(p.q1)) : Math.abs(p.q2), sign: p.q2 > 0 ? '+' : '-', F }; },
    traps: ['noSquare'],
    why: { noSquare: () => L('The distance counts squared: multiply the force by r².', 'Der Abstand zählt im Quadrat: Multipliziere die Kraft mit r².') },
    fields: () => [num$('q2', '|q_2|', 'μC', L('size of the charge', 'Betrag der Ladung')), choice('sign', L('sign of the charge', 'Vorzeichen der Ladung'), [['+', L('positive', 'positiv')], ['-', L('negative', 'negativ')]])],
    text: (p) => L(`A small sphere with a charge of ${qs(p.q1, 'μC')} ${kind(p) === 'attract' ? 'attracts' : 'repels'} a second small sphere ${q(p.r, 'cm')} away with a force of ${q(pairF(p), forceUnit(pairF(p)))}. What is the charge of the second sphere?`,
      `Eine kleine Kugel mit der Ladung ${qs(p.q1, 'μC')} ${kind(p) === 'attract' ? 'zieht' : 'stösst'} eine zweite kleine Kugel im Abstand von ${q(p.r, 'cm')} mit einer Kraft von ${q(pairF(p), forceUnit(pairF(p)))} ${kind(p) === 'attract' ? 'an' : 'ab'}. Welche Ladung hat die zweite Kugel?`),
    hints: () => [
      L(`Solve Coulomb's law ${m$(`F = ${kq}`)} for $|q_2|$.`, `Löse das Coulombgesetz ${m$(`F = ${kq}`)} nach $|q_2|$ auf.`),
      L('The sign: attraction means opposite signs, repulsion the same sign.', 'Das Vorzeichen: Anziehung heisst entgegengesetzte Vorzeichen, Abstossung gleiche.'),
    ],
    steps: (p, v) => [
      step(L('Solve for the charge', 'Nach der Ladung auflösen'), p$(L("Let $q_1$ be the known charge, $F$ the force and $r$ the distance. From Coulomb's law,", 'Sei $q_1$ die bekannte Ladung, $F$ die Kraft und $r$ der Abstand. Aus dem Coulombgesetz folgt')) +
        `$$|q_2| = \\frac{F\\,r^2}{k\\,|q_1|} = \\frac{${tq(v.F, 'N')}\\cdot (${mT(p.r)})^2}{${KT}\\cdot ${qC(p.q1)}} = ${qC(p.q2)} = ${res(tq(Math.abs(p.q2), 'μC'))}$$`, ['F12', 'F21']),
      step(L('The sign', 'Das Vorzeichen'), p$(kind(p) === 'attract'
        ? L(`The spheres attract each other: the charges have opposite signs, so the second one is ${p.q2 > 0 ? 'positive' : 'negative'}, $q_2 = ${res(tqs(p.q2, 'μC'))}$.`, `Die Kugeln ziehen sich an: Die Ladungen haben entgegengesetzte Vorzeichen, die zweite ist also ${p.q2 > 0 ? 'positiv' : 'negativ'}, $q_2 = ${res(tqs(p.q2, 'μC'))}$.`)
        : L(`The spheres repel each other: the charges have the same sign, so the second one is ${p.q2 > 0 ? 'positive' : 'negative'}, $q_2 = ${res(tqs(p.q2, 'μC'))}$.`, `Die Kugeln stossen sich ab: Die Ladungen haben das gleiche Vorzeichen, die zweite ist also ${p.q2 > 0 ? 'positiv' : 'negativ'}, $q_2 = ${res(tqs(p.q2, 'μC'))}$.`)), ['F12', 'F21']),
    ],
    figure: (p, v, view) => pairFigure(p, v, view, view.show && view.show.size ? {} : { lab2: '?', q2sign: 0 }),
  };

  // ---------------------------------------------------------------- 2 factors
  const DIST = { 2: L.bind(null, 'doubled', 'verdoppelt'), 3: L.bind(null, 'tripled', 'verdreifacht'), 4: L.bind(null, 'made four times as large', 'vervierfacht'), 0.5: L.bind(null, 'halved', 'halbiert'), [1 / 3]: L.bind(null, 'reduced to a third', 'auf einen Drittel verkleinert') };
  const CHG = { 2: L.bind(null, 'doubled', 'verdoppelt'), 3: L.bind(null, 'tripled', 'verdreifacht'), 0.5: L.bind(null, 'halved', 'halbiert'), 1: null };
  // a power of the factor: 2^2, but (\dfrac{1}{2})^2
  const sq = (x) => (Number.isInteger(x) ? `${x}^2` : `\\left(${ft(x)}\\right)^2`);
  // a factor as a number or a fraction: \dfrac in an equation, \tfrac inside another fraction (inner)
  const ft = (x, inner) => { const fr = [[1, 1], [2, 1], [3, 1], [4, 1], [1, 2], [1, 3], [1, 4], [9, 1], [1, 9], [16, 1], [1, 16], [3, 2], [2, 3], [9, 4], [4, 9], [3, 4], [4, 3], [1, 8], [8, 1], [6, 1], [1, 6], [12, 1], [1, 12], [27, 4], [4, 27], [9, 8], [8, 9], [2, 9], [9, 2], [3, 8], [8, 3], [1, 18], [18, 1], [1, 36], [36, 1], [1, 27], [27, 1], [3, 16], [16, 3], [1, 24], [24, 1], [2, 27], [27, 2], [4, 3], [3, 4]].find(([a, b]) => Math.abs(a / b - x) < 1e-9); return fr ? (fr[1] === 1 ? String(fr[0]) : `\\${inner ? 't' : 'd'}frac{${fr[0]}}{${fr[1]}}`) : tnum(x); };
  function factorFigure(p, v, view) {
    const P = new Pic(1, L('The two charges before and after', 'Die beiden Ladungen vorher und nachher'));
    const row = (y, d, l1, l2, s1, s2, title, rl) => {
      P.text([-70, y], title, 'lbl small', 'end');
      P.charge([0, y], s1, l1); P.charge([d, y], s2, l2); P.dim([0, y], [d, y], rl, -24);
    };
    const s1 = Math.sign(p.s1 || 1), s2 = Math.sign(p.s2 || 1), d0 = 90;
    row(0, d0, sv('q', '1'), sv('q', '2'), s1, s2, L('before', 'vorher'), sv('r'));
    const lab = (a, i) => (a === 1 ? sv('q', i) : `${a === 0.5 ? '½' : a}${sv('q', i)}`);
    const n = p.n || 1;
    row(-90, d0 * n, lab(p.a || 1, '1'), lab(p.b || 1, '2'), s1, s2, L('after', 'nachher'), n === 1 ? sv('r') : `${n === 0.5 ? '½' : n === 1 / 3 ? '⅓' : n}${sv('r')}`);
    return P.svg();
  }
  const factor = {
    id: 'factor', difficulty: 1,
    title: () => L('Twice as far', 'Doppelt so weit'),
    make: (r) => (r() < 0.6 ? { what: 'r', n: pick(r, [2, 3, 4, 0.5, 1 / 3]), a: 1, b: 1, s1: sign(r), s2: sign(r) } : { what: 'q', n: 1, a: pick(r, [2, 3, 0.5]), b: 1, s1: sign(r), s2: sign(r) }),
    solve: (p, o = {}) => ({ f: o.noSquare ? (p.a * p.b) / p.n : o.wrongWay ? p.a * p.b * p.n ** 2 : (p.a * p.b) / p.n ** 2 }),
    traps: ['noSquare', 'wrongWay'],
    why: { noSquare: () => L('The distance counts squared: 1/r².', 'Der Abstand zählt im Quadrat: 1/r².'), wrongWay: () => L('A larger distance means a smaller force.', 'Ein grösserer Abstand bedeutet eine kleinere Kraft.') },
    fields: () => [num$('f', "F'/F", '', L('factor', 'Faktor'))],
    text: (p) => (p.what === 'r'
      ? L(`Two point charges exert a force on each other. Their distance is ${DIST[p.n]()}, the charges stay the same. By what factor does the force change? (Give it as a number or a fraction, e.g. 0.25 or 1/4.)`,
        `Zwei Punktladungen üben eine Kraft aufeinander aus. Ihr Abstand wird ${DIST[p.n]()}, die Ladungen bleiben gleich. Um welchen Faktor ändert sich die Kraft? (Gib ihn als Zahl oder Bruch an, z. B. 0.25 oder 1/4.)`)
      : L(`Two point charges exert a force on each other. One of the charges is ${CHG[p.a]()}; the distance stays the same. By what factor does the force change? (Give it as a number or a fraction, e.g. 0.25 or 1/4.)`,
        `Zwei Punktladungen üben eine Kraft aufeinander aus. Eine der Ladungen wird ${CHG[p.a]()}; der Abstand bleibt gleich. Um welchen Faktor ändert sich die Kraft? (Gib ihn als Zahl oder Bruch an, z. B. 0.25 oder 1/4.)`)),
    hints: () => [
      L(`In ${m$(`F = ${kq}`)}, the force is proportional to each charge and to $1/r^2$.`, `In ${m$(`F = ${kq}`)} ist die Kraft proportional zu jeder Ladung und zu $1/r^2$.`),
      L('Write the new force with the new values and divide by the old one: k and everything that stays the same cancels.', 'Schreibe die neue Kraft mit den neuen Werten und teile durch die alte: k und alles Gleichbleibende kürzt sich.'),
    ],
    steps: (p, v) => {
      const n = ft(p.n, true), a = ft(p.a, true);
      return [step(L('Compare', 'Vergleichen'), p$(L("Let $F$ be the old force and $F'$ the new one. Only what changes is left in the ratio:", "Sei $F$ die alte und $F'$ die neue Kraft. Im Verhältnis bleibt nur, was sich ändert:")) +
        (p.what === 'r'
          ? `$$\\frac{F'}{F} = \\frac{k\\,|q_1|\\,|q_2| / (${n}\\,r)^2}{k\\,|q_1|\\,|q_2| / r^2} = \\frac{1}{${sq(p.n)}} = ${res(ft(v.f))}$$` + p$(L('The force falls with the square of the distance.', 'Die Kraft nimmt mit dem Quadrat des Abstands ab.'))
          : `$$\\frac{F'}{F} = \\frac{k\\,${a}\\,|q_1|\\,|q_2| / r^2}{k\\,|q_1|\\,|q_2| / r^2} = ${res(ft(v.f))}$$` + p$(L('The force is proportional to each charge.', 'Die Kraft ist proportional zu jeder Ladung.'))))];
    },
    figure: factorFigure,
  };
  const factorMix = {
    id: 'factor-mix', difficulty: 2,
    title: () => L('Charges and distance changed', 'Ladungen und Abstand verändert'),
    make: (r) => { const a = pick(r, [2, 3, 0.5]), b = pick(r, [1, 2, 3, 0.5]), n = pick(r, [2, 3, 0.5]); return a * b !== n * n ? { what: 'mix', a, b, n, F: pick(r, [0.4, 0.6, 0.8, 1.2, 1.8, 3.6]), s1: sign(r), s2: sign(r) } : null; },
    solve: (p, o = {}) => { const f = o.noSquare ? (p.a * p.b) / p.n : o.oneCharge ? p.a / p.n ** 2 : (p.a * p.b) / p.n ** 2; return { f, F2: f * p.F }; },
    traps: ['noSquare', 'oneCharge'],
    why: { noSquare: () => L('The distance counts squared: 1/r².', 'Der Abstand zählt im Quadrat: 1/r².'), oneCharge: () => L('Both charges count: the force is proportional to their product.', 'Beide Ladungen zählen: Die Kraft ist proportional zu ihrem Produkt.') },
    fields: (p) => [num$('f', "F'/F", '', L('factor', 'Faktor')), num$('F2', "F'", forceUnit(Math.min(p.F, (p.a * p.b * p.F) / p.n ** 2)), L('new force', 'neue Kraft'))],
    text: (p) => {
      const c = (x, i) => (x === 1 ? L(`charge ${i} stays the same`, `Ladung ${i} bleibt gleich`) : L(`charge ${i} is ${CHG[x]()}`, `Ladung ${i} wird ${CHG[x]()}`));
      return L(`Two point charges exert a force of ${q(p.F, 'N')} on each other. Now ${c(p.a, 1)}, ${c(p.b, 2)}, and their distance is ${DIST[p.n]()}. By what factor does the force change, and how large is it now?`,
        `Zwei Punktladungen üben eine Kraft von ${q(p.F, 'N')} aufeinander aus. Nun ${c(p.a, 1).replace(/^Ladung (\d) (bleibt|wird)/, '$2 Ladung $1')}, ${c(p.b, 2)}, und ihr Abstand wird ${DIST[p.n]()}. Um welchen Faktor ändert sich die Kraft, und wie gross ist sie jetzt?`);
    },
    hints: () => [
      L('Each change gives a factor: the charges directly, the distance as 1/(factor)².', 'Jede Änderung gibt einen Faktor: die Ladungen direkt, der Abstand als 1/(Faktor)².'),
      L('Multiply the factors.', 'Multipliziere die Faktoren.'),
    ],
    steps: (p, v) => [
      step(L('Compare', 'Vergleichen'), p$(L("Let $F$ be the old force and $F'$ the new one. In the ratio, k cancels and only the factors are left:", "Sei $F$ die alte und $F'$ die neue Kraft. Im Verhältnis kürzt sich k, und nur die Faktoren bleiben:")) +
        `$$\\frac{F'}{F} = \\frac{${ft(p.a)}\\cdot ${ft(p.b)}}{${sq(p.n)}} = ${res(ft(v.f))}$$`),
      step(L('The new force', 'Die neue Kraft'), p$(L('The old force times the factor:', 'Die alte Kraft mal den Faktor:')) + `$$F' = ${ft(v.f)}\\cdot ${tq(p.F, 'N')} = ${res(tq(v.F2, forceUnit(v.F2)))}$$`),
    ],
    figure: factorFigure,
  };
  const factorFind = {
    id: 'factor-find', difficulty: 2,
    title: () => L('How far for that force?', 'Wie weit für diese Kraft?'),
    make: (r) => ({ what: 'find', m: pick(r, [4, 9, 16, 0.25, 1 / 9, 2]), s1: sign(r), s2: sign(r) }),
    solve: (p, o = {}) => ({ n: o.noRoot ? 1 / p.m : o.wrongWay ? Math.sqrt(p.m) : 1 / Math.sqrt(p.m) }),
    traps: ['noRoot', 'wrongWay'],
    why: { noRoot: () => L('The force goes with 1/r²: the distance changes by the square root of the inverse factor.', 'Die Kraft geht mit 1/r²: Der Abstand ändert sich um die Wurzel des Kehrwerts.'), wrongWay: () => L('A larger force needs a smaller distance.', 'Eine grössere Kraft braucht einen kleineren Abstand.') },
    fields: () => [num$('n', "r'/r", '', L('factor for the distance', 'Faktor für den Abstand'))],
    text: (p) => L(`Two point charges exert a force on each other. By what factor must their distance be changed so that the force becomes ${p.m >= 1 ? `${p.m} times as large` : `${p.m === 0.25 ? 'a quarter' : 'a ninth'} of what it was`}? (Give the factor as a number or a fraction.)`,
      `Zwei Punktladungen üben eine Kraft aufeinander aus. Um welchen Faktor muss ihr Abstand verändert werden, damit die Kraft ${p.m >= 1 ? `${p.m}-mal so gross` : `${p.m === 0.25 ? 'ein Viertel' : 'ein Neuntel'} der bisherigen`} wird? (Gib den Faktor als Zahl oder Bruch an.)`),
    hints: () => [
      L('The force goes with 1/r²: if the distance changes by a factor n, the force changes by 1/n².', 'Die Kraft geht mit 1/r²: Ändert sich der Abstand um den Faktor n, ändert sich die Kraft um 1/n².'),
      L('Solve 1/n² = (factor of the force) for n.', 'Löse 1/n² = (Faktor der Kraft) nach n auf.'),
    ],
    steps: (p, v) => [step(L('Solve for the factor', 'Nach dem Faktor auflösen'), p$(L("Let the distance change by the factor $n = r'/r$. Then the force changes by $1/n^2$:", "Der Abstand ändere sich um den Faktor $n = r'/r$. Dann ändert sich die Kraft um $1/n^2$:")) +
      `$$\\frac{1}{n^2} = ${ft(p.m)} \\;\\Rightarrow\\; n = \\frac{1}{\\sqrt{${ft(p.m)}}} ${p.m === 2 ? '\\approx' : '='} ${res(p.m === 2 ? '0.707' : ft(v.n))}$$` +
      p$(p.m > 1 ? L('A larger force: the charges must come closer.', 'Eine grössere Kraft: Die Ladungen müssen näher zusammen.') : L('A smaller force: the charges must move apart.', 'Eine kleinere Kraft: Die Ladungen müssen sich voneinander entfernen.')))],
    figure: (p, v, view) => factorFigure({ ...p, n: view.show && view.show.size ? v.n : 1, a: 1, b: 1 }, v, view),
  };

  // ---------------------------------------------------------------- 3 three charges in a line
  // Charges A and B on the x axis (m), the charge t at x = 0; forces along x (right positive).
  function lineMake(r, mid) {
    const d1 = pick(r, [10, 20, 30]) / 100, d2 = pick(r, [10, 20, 30]) / 100, flip = sign(r);
    const xa = mid ? -d1 * flip : d1 * flip, xb = mid ? d2 * flip : (d1 + d2) * flip;
    const p = { mid, t: sign(r) * pick(r, QS) * 1e-6, qa: sign(r) * pick(r, QS) * 1e-6, qb: sign(r) * pick(r, QS) * 1e-6, xa, xb };
    return Math.abs(lineSolve(p).net) > 1e-6 ? p : null; // a net force to find
  }
  const fx = (qt, qi, xi) => force(qt, [0, 0], qi, [xi, 0])[0];
  function lineSolve(p, o = {}) {
    const Fa = fx(p.t, p.qa, p.xa), Fb = fx(p.t, p.qb, o.sameDist ? Math.sign(p.xb) * Math.abs(p.xb - p.xa) : p.xb);
    const net = o.noSigns ? Math.abs(Fa) + Math.abs(Fb) : Fa + Fb;
    return { Fa, Fb, net, F: Math.abs(net), dir: Math.abs(net) < 1e-12 ? '0' : net > 0 ? 'E' : 'W' };
  }
  const towards = (qt, qi) => (qt * qi < 0);
  function lineSteps(p, v) {
    const one = (k, name, qi, xi, Fi) => step(L(`The force of ${name}`, `Die Kraft von ${name}`),
      p$(L(`${name} (${qs(qi, 'μC')}) is ${q(Math.abs(xi), 'cm')} away. ${towards(p.t, qi) ? 'Opposite signs: it attracts the charge, towards itself' : 'Same sign: it repels the charge, away from itself'}, that is ${Fi > 0 ? 'to the right' : 'to the left'}.`,
        `${name} (${qs(qi, 'μC')}) ist ${q(Math.abs(xi), 'cm')} entfernt. ${towards(p.t, qi) ? 'Entgegengesetzte Vorzeichen: Sie zieht die Ladung an, zu sich hin' : 'Gleiche Vorzeichen: Sie stösst die Ladung ab, von sich weg'}, also ${Fi > 0 ? 'nach rechts' : 'nach links'}.`)) +
      `$$F_${k} = k\\,\\frac{|q|\\,|q_${k}|}{r_${k}^2} = ${KT}\\cdot\\frac{${qC(p.t)}\\cdot ${qC(qi)}}{(${mT(Math.abs(xi))})^2} = ${tq(Math.abs(Fi), forceUnit(Math.abs(Fi)))}$$`, [`F${k}`], [`F${k}`]);
    const u = forceUnit(Math.max(Math.abs(v.Fa), Math.abs(v.Fb), v.F)), sgn = (x) => (x < 0 ? '-' : '+');
    return [
      one('A', 'A', p.qa, p.xa, v.Fa), one('B', 'B', p.qb, p.xb, v.Fb),
      step(L('The net force', 'Die resultierende Kraft'), p$(L('Both forces lie on the line: add them with signs, the right taken as positive.', 'Beide Kräfte liegen auf der Geraden: Addiere sie mit Vorzeichen, nach rechts positiv.')) +
        `$$F = ${sgn(v.Fa)}${tq(Math.abs(v.Fa), u)} ${sgn(v.Fb)} ${tq(Math.abs(v.Fb), u)} = ${tq(v.net, u)}$$` +
        p$(v.dir === '0' ? L('The forces cancel: no net force.', 'Die Kräfte heben sich auf: keine resultierende Kraft.') : L(`The net force has the size $${res(tq(v.F, u))}$ and points ${rt(dirName(v.dir))}.`, `Die resultierende Kraft hat den Betrag $${res(tq(v.F, u))}$ und zeigt ${rt(dirName(v.dir))}.`)), ['FA', 'FB', 'F'], ['F']),
    ];
  }
  function lineFigure(p, v, view) {
    const s = 420 / (Math.max(Math.abs(p.xa), Math.abs(p.xb), 0.1) * (p.mid ? 2.2 : 1.2));
    const pts = [[0, p.t, L('the charge', 'Ladung')], [p.xa, p.qa, 'A'], [p.xb, p.qb, 'B']];
    const xs = [0, p.xa, p.xb].sort((a, b) => a - b);
    return drawing({
      scale: s,
      pts: pts.map(([x, qq, name], i) => ({ c: [x, 0], q: Math.sign(qq), lab: `${i ? `${name}: ` : ''}${qs(qq, 'μC')}`, cls: i ? '' : 'hl' })),
      dims: [[[xs[0], 0], [xs[1], 0], q(xs[1] - xs[0], 'cm'), -58], [[xs[1], 0], [xs[2], 0], q(xs[2] - xs[1], 'cm'), -58]],
      // the net force on the line, the two forces stacked below it (the labels of the charges are
      // above), each labelled beside its tip
      forces: { FA: { at: [0, -15 / s], F: [v.Fa, 0], lab: sv('F', 'A'), cls: 'k-1', off: [v.Fa >= 0 ? 8 : -8, 0] }, FB: { at: [0, -30 / s], F: [v.Fb, 0], lab: sv('F', 'B'), cls: 'k-2', off: [v.Fb >= 0 ? 8 : -8, 0] }, F: { at: [0, 0], F: [v.net, 0], lab: sv('F'), cls: 'k-net', off: [v.net >= 0 ? 10 : -10, 0] } },
      arrow: 90,
    }, view);
  }
  const lineFields = (p) => { const v = lineSolve(p); return [num$('F', 'F', forceUnit(Math.max(v.F, Math.abs(v.Fa), Math.abs(v.Fb))), L('size of the net force', 'Betrag der resultierenden Kraft')), dirField('dir', L('direction', 'Richtung'), ['W', 'E', '0'])]; };
  const lineText = (p) => L(`Three small charged spheres lie on a straight line, as shown. What net force do A and B exert on the ${p.mid ? 'middle' : 'outer'} charge of ${qs(p.t, 'μC')}? Give its size and direction.`,
    `Drei kleine geladene Kugeln liegen auf einer Geraden, wie abgebildet. Welche resultierende Kraft üben A und B auf die ${p.mid ? 'mittlere' : 'äussere'} Ladung von ${qs(p.t, 'μC')} aus? Gib Betrag und Richtung an.`);
  const lineHints = () => [
    L('Find the force of each charge separately, with Coulomb’s law; the other one does not change it.', 'Bestimme die Kraft jeder Ladung einzeln mit dem Coulombgesetz; die andere ändert daran nichts.'),
    L('Direction: attraction towards the other charge, repulsion away from it. Then add the two forces with signs (right positive).', 'Richtung: Anziehung zur anderen Ladung hin, Abstossung von ihr weg. Dann die beiden Kräfte mit Vorzeichen addieren (rechts positiv).'),
  ];
  const lineWhy = {
    noSigns: () => L('The forces point in opposite directions: subtract them.', 'Die Kräfte zeigen in entgegengesetzte Richtungen: Subtrahiere sie.'),
    sameDist: () => L('Measure each distance from the charge the force acts on.', 'Miss jeden Abstand von der Ladung aus, auf die die Kraft wirkt.'),
  };
  const lineEnd = { id: 'line-end', difficulty: 2, title: () => L('Three charges in a line', 'Drei Ladungen auf einer Geraden'), make: (r) => lineMake(r, false), solve: lineSolve, traps: ['noSigns', 'sameDist'], why: lineWhy, fields: lineFields, text: lineText, hints: lineHints, steps: lineSteps, figure: lineFigure };
  const lineMid = { ...lineEnd, id: 'line-mid', difficulty: 3, title: () => L('A charge in the middle', 'Eine Ladung in der Mitte'), make: (r) => lineMake(r, true), traps: ['noSigns'] };

  // ---------------------------------------------------------------- 4 which way? (equal charges)
  const rot = (c, k) => { let [x, y] = c; for (let i = 0; i < k; i++) [x, y] = [-y, x]; return [x, y]; };
  // charges of equal size q at points in units of d; the target is the first
  function whichSolve(p) {
    const t = p.pts[0], Fs = p.pts.slice(1).map((pt) => force(t.s, t.c, pt.s, pt.c).map((x) => x / K));
    const net = Fs.reduce(add, [0, 0]);
    return { Fs, net, dir: dirOf(net, 1) };
  }
  function whichFigure(p, v, view) {
    const big = Math.max(...v.Fs.map(len));
    return drawing({
      scale: 120,
      before: (P) => { if (p.shape === 'tri') P.poly(p.pts.map((pt) => pt.c), 'outline'); if (p.shape === 'square') P.poly([[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]], 'outline'); if (p.shape === 'grid') P.grid(-1, -1, 1, 1, 1); },
      pts: p.pts.map((pt, i) => ({ c: pt.c, q: pt.s, lab: `${pt.s > 0 ? '+' : '−'}<tspan font-style="italic">q</tspan>`, cls: i ? '' : 'hl', off: pt.off })),
      forces: Object.fromEntries([...v.Fs.map((F, i) => [`F${i + 1}`, { at: p.pts[0].c, F, lab: sv('F', String(i + 1)), cls: `k-${(i % 3) + 1}` }]), ['F', { at: p.pts[0].c, F: v.net, lab: sv('F'), cls: 'k-net' }]]),
      arrow: 70 * Math.max(1, len(v.net) / big),
    }, view);
  }
  function whichSteps(p, v) {
    const n = v.Fs.length, near = v.Fs.map((F, i) => len(sub(p.pts[i + 1].c, p.pts[0].c)));
    const sizes = [...new Set(near.map((d) => sig(d * (p.shape === 'tri' ? 1 / 1.4 : 1), 6)))];
    const F0 = '$F_0 = k\\,q^2/d^2$';
    const sizeText = sizes.length === 1 && sizes[0] === 1
      ? L(`All ${word(n)} charges are at the distance $d$: the forces have the same size ${F0}.`, `Alle ${word(n)} Ladungen sind im Abstand $d$: Die Kräfte haben den gleichen Betrag ${F0}.`)
      : sizes.length === 1
        ? L(`All ${word(n)} charges are on the diagonals, at $\\sqrt{2}\\,d$: the forces have the same size $F_0/2$, with ${F0}.`, `Alle ${word(n)} Ladungen sind auf den Diagonalen, im Abstand $\\sqrt{2}\\,d$: Die Kräfte haben den gleichen Betrag $F_0/2$, mit ${F0}.`)
        : L(`The charges at the distance $d$ act with ${F0}; at the diagonal distance $\\sqrt{2}\\,d$ the force is half as large, $F_0/2$.`, `Die Ladungen im Abstand $d$ wirken mit ${F0}; im Abstand $\\sqrt{2}\\,d$ (Diagonale) ist die Kraft halb so gross, $F_0/2$.`);
    const comp = (x) => (Math.abs(x) < 1e-9 ? '0' : `${sig(x, 3)}\\,F_0`);
    return [
      step(L('Each force', 'Jede Kraft'), p$(L('Each force lies on the line through the two charges: towards the other charge for opposite signs, away from it for like signs.', 'Jede Kraft liegt auf der Geraden durch die beiden Ladungen: zur anderen Ladung hin bei entgegengesetzten Vorzeichen, von ihr weg bei gleichen.')) + p$(sizeText),
        v.Fs.map((F, i) => `F${i + 1}`)),
      step(L('Add them', 'Addieren'), p$(L('Add the forces arrow to arrow, or by components: what points in opposite directions cancels.', 'Addiere die Kräfte Pfeil an Pfeil oder in Komponenten: Was in entgegengesetzte Richtungen zeigt, hebt sich auf.')) +
        `$$F_x = ${comp(v.net[0] * p.scaleF)}, \\qquad F_y = ${comp(v.net[1] * p.scaleF)}$$` +
        p$(v.dir === '0' ? L(`Everything cancels: ${rt(L('no net force', 'keine resultierende Kraft'))}.`, `Alles hebt sich auf: ${rt('keine resultierende Kraft')}.`) : L(`The net force points ${rt(arrowWord(v.dir))}.`, `Die resultierende Kraft zeigt ${rt(arrowWord(v.dir))}.`)),
        [...v.Fs.map((F, i) => `F${i + 1}`), 'F'], ['F']),
    ];
  }
  const whichText = (p) => L(`The ${p.pts.length} point charges shown all have the same size; ${p.shape === 'tri' ? 'they sit at the corners of an equilateral triangle' : p.shape === 'square' ? 'they sit at the corners of a square' : 'the grid squares have the side d'}. In which direction does the net force on the charge in the ring point?`,
    `Die ${p.pts.length} abgebildeten Punktladungen haben alle den gleichen Betrag; ${p.shape === 'tri' ? 'sie sitzen an den Ecken eines gleichseitigen Dreiecks' : p.shape === 'square' ? 'sie sitzen an den Ecken eines Quadrats' : 'die Gitterquadrate haben die Seitenlänge d'}. In welche Richtung zeigt die resultierende Kraft auf die Ladung im Ring?`);
  const whichHints = () => [
    L('Draw each force on the charge in the ring: along the line to the other charge, towards it (opposite signs) or away from it (like signs).', 'Zeichne jede Kraft auf die Ladung im Ring: entlang der Geraden zur anderen Ladung, zu ihr hin (entgegengesetzte Vorzeichen) oder von ihr weg (gleiche Vorzeichen).'),
    L('Equal charges at equal distances give forces of equal size: look for what cancels by symmetry.', 'Gleiche Ladungen in gleichen Abständen geben gleich grosse Kräfte: Suche, was sich aus Symmetriegründen aufhebt.'),
  ];
  const which = {
    id: 'which-tri', difficulty: 1,
    title: () => L('Which way? A triangle', 'Wohin? Ein Dreieck'),
    make(r) {
      const k = pick(r, [0, 0, 1, 2, 3]), h = Math.sqrt(3) / 2;
      const base = [[0, h * 2 / 3], [-0.5, -h / 3], [0.5, -h / 3]].map((c) => mul(rot(c, k), 1.4));
      return { shape: 'tri', scaleF: 1.96, pts: base.map((c) => ({ c, s: sign(r) })) };
    },
    solve: (p) => { const v = whichSolve(p); return { ...v, d: v.dir }; },
    traps: [], why: {},
    fields: () => [dirField('d', L('direction of the net force', 'Richtung der resultierenden Kraft'), DIR_ALL)],
    text: whichText, hints: whichHints, steps: whichSteps, figure: whichFigure,
  };
  // a square of side 2d around the target's grid, the target at its centre or at a corner
  const whichSquare = {
    ...which, id: 'which-square', difficulty: 2,
    title: () => L('Which way? A square', 'Wohin? Ein Quadrat'),
    make(r) {
      // the target at the centre of a 3 × 3 grid with charges at some of its neighbours, or at a
      // corner of a square with charges at the other three corners
      let pts;
      if (r() < 0.65) {
        const grid = []; for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) if (x || y) grid.push([x, y]);
        pts = [[0, 0], ...shuffle(r, grid).slice(0, pick(r, [2, 3, 3, 4]))];
      } else {
        const k = pick(r, [0, 1, 2, 3]);
        pts = [[0, 0], [1, 0], [0, 1], [1, 1]].map((c) => rot([c[0] - 0.5, c[1] - 0.5], k));
      }
      const p = { shape: pts.length === 4 && pts.every((c) => Math.abs(Math.abs(c[0]) - 0.5) < 1e-9) ? 'square' : 'grid', scaleF: 1, pts: pts.map((c) => ({ c, s: sign(r) })) };
      return whichSolve(p).dir ? p : null;
    },
  };

  // ---------------------------------------------------------------- 5 ranking arrangements
  // In units of d, the target +q at the origin, the other two charges at these points.
  const ARR = {
    end: [[1, 0], [2, 0]], mid: [[-1, 0], [1, 0]], right: [[-1, 0], [0, 1]], tri: [[1, 0], [0.5, Math.sqrt(3) / 2]],
    split: [[-1, 0], [2, 0]], diag: [[1, 0], [1, 1]], far: [[2, 0], [0, 1]],
  };
  const SIGNS = [[-1, -1], [1, 1], [-1, 1], [1, -1]];
  const arrNet = (pts, s) => pts.map((c, i) => force(1, [0, 0], s[i], c).map((x) => x / K)).reduce(add, [0, 0]);
  function rankMake(r, n) {
    const s = pick(r, SIGNS), keys = shuffle(r, Object.keys(ARR)).slice(0, n);
    const F = keys.map((k) => len(arrNet(ARR[k], s)));
    const distinct = F.every((a, i) => F.every((b, j) => i === j || Math.abs(a - b) > 0.03 * Math.max(a, b, 0.1)));
    return distinct ? { s, keys } : null;
  }
  const LETTERS = ['A', 'B', 'C', 'D'];
  function rankSolve(p) {
    const nets = p.keys.map((k) => arrNet(ARR[k], p.s)), F = nets.map(len);
    const order = F.map((f, i) => i).sort((a, b) => F[b] - F[a]);
    const rank = {}; order.forEach((i, k) => { rank[LETTERS[i]] = k + 1; });
    return { nets, F, rank, order };
  }
  function rankFigure(p, v, view) {
    const P = new Pic(70, L('The arrangements', 'Die Anordnungen'));
    const sl = (s) => `${s > 0 ? '+' : '−'}<tspan font-style="italic">q</tspan>`;
    let x0 = 0;
    p.keys.forEach((k, i) => {
      const pts = ARR[k], xs = [0, ...pts.map((c) => c[0])], minX = Math.min(...xs), maxX = Math.max(...xs), dx = x0 - minX;
      const at = (c) => [c[0] + dx, c[1]];
      pts.forEach((c) => P.line(at([0, 0]), at(c), 'w thin dashed'));
      pts.forEach((c, j) => P.charge(at(c), p.s[j], sl(p.s[j])));
      P.charge(at([0, 0]), 1, sl(1), 'hl');
      P.text([(minX + maxX) / 2 + dx, -0.9], `<tspan font-weight="700">${LETTERS[i]}</tspan>`, 'lbl');
      const hidden = view.show && (view.show.has(`F${i}`) || view.show.has('all')) ? '' : ' hidden', n = v.nets[i], l = len(n);
      if (l > 1e-9) P.arrow(at([0, 0]), unit(n), 22 + 40 * l, `force k-net${hidden}`, `${sig(l, 3)}${sv('F', '0')}`, [n[0] >= 0 ? 8 : -8, n[1] > 0.3 ? -8 : 14]);
      else P.text(at([0, -0.45]), `${sv('F')} = 0`, `lbl small${hidden}`);
      x0 += maxX - minX + 1.7;
    });
    return P.svg();
  }
  const rankStepText = (p, v, i) => {
    const k = p.keys[i], l = v.F[i];
    const what = {
      end: L('Both charges are on the same side, at d and 2d.', 'Beide Ladungen sind auf derselben Seite, in d und 2d.'),
      mid: L('The charges are on opposite sides, both at d.', 'Die Ladungen sind auf entgegengesetzten Seiten, beide in d.'),
      right: L('The charges are at d, at a right angle: Pythagoras.', 'Die Ladungen sind in d, im rechten Winkel: Pythagoras.'),
      tri: L('The charges are at d, at 60° to each other.', 'Die Ladungen sind in d, unter 60° zueinander.'),
      split: L('One charge at d on one side, the other at 2d on the other side.', 'Eine Ladung in d auf der einen Seite, die andere in 2d auf der anderen.'),
      diag: L('One charge at d, the other on the diagonal at √2 d (half the force), at 45°.', 'Eine Ladung in d, die andere auf der Diagonalen in √2 d (halbe Kraft), unter 45°.'),
      far: L('One charge at 2d (a quarter of the force), the other at d, at a right angle.', 'Eine Ladung in 2d (ein Viertel der Kraft), die andere in d, im rechten Winkel.'),
    }[k];
    return `<li><b>${LETTERS[i]}</b>: ${what} $F_{${LETTERS[i]}} = ${sig(l, 3)}\\,F_0$</li>`;
  };
  function rankSteps(p, v) {
    return [
      step(L('Each arrangement', 'Jede Anordnung'), p$(L('Let $F_0 = k\\,q^2/d^2$ be the force of one charge at the distance $d$. At $2d$ a charge acts with $F_0/4$, at $\\sqrt{2}\\,d$ with $F_0/2$. Add the two forces on +q as arrows:', 'Sei $F_0 = k\\,q^2/d^2$ die Kraft einer Ladung im Abstand $d$. In $2d$ wirkt eine Ladung mit $F_0/4$, in $\\sqrt{2}\\,d$ mit $F_0/2$. Addiere die beiden Kräfte auf +q als Pfeile:')) +
        `<ul>${p.keys.map((k, i) => rankStepText(p, v, i)).join('')}</ul>`, ['all']),
      step(L('The ranking', 'Die Rangfolge'), p$(L(`From the largest to the smallest: ${rt(v.order.map((i) => LETTERS[i]).join(' > '))}.`, `Vom grössten zum kleinsten: ${rt(v.order.map((i) => LETTERS[i]).join(' > '))}.`)), ['all']),
    ];
  }
  const rank3 = {
    id: 'rank', difficulty: 3,
    title: () => L('Ranking the arrangements', 'Anordnungen ordnen'),
    make: (r) => rankMake(r, 3),
    solve: (p) => { const v = rankSolve(p); return { ...v, rk: v.rank }; },
    traps: [], why: {},
    fields: (p) => [{ key: 'rk', type: 'rank', what: L('rank (1 = largest net force)', 'Rang (1 = grösste resultierende Kraft)'), want: L('the ranking of the arrangements', 'die Rangfolge der Anordnungen'), items: p.keys.map((k, i) => LETTERS[i]) }],
    text: (p) => {
      const others = p.s[0] !== p.s[1] ? L('of the other two, one is positive and one negative', 'von den anderen beiden ist eine positiv und eine negativ') : p.s[0] > 0 ? L('so are the other two', 'die anderen beiden auch') : L('the other two are negative', 'die anderen beiden sind negativ');
      return L(`The drawing shows three point charges arranged in ${word(p.keys.length)} different ways. The charges have the same size q: the one in the ring is positive, ${others}. In each arrangement the distance d is the same. Rank the arrangements by the size of the net force on the charge in the ring (1 = largest).`,
        `Die Abbildung zeigt drei Punktladungen in ${word(p.keys.length)} verschiedenen Anordnungen. Die Ladungen haben den gleichen Betrag q: Die im Ring ist positiv, ${others}. In jeder Anordnung ist der Abstand d derselbe. Ordne die Anordnungen nach dem Betrag der resultierenden Kraft auf die Ladung im Ring (1 = grösste).`);
    },
    hints: () => [
      L('Measure every force in units of F₀ = k q²/d², the force of one charge at the distance d. At 2d it is F₀/4.', 'Miss jede Kraft in Einheiten von F₀ = k q²/d², der Kraft einer Ladung im Abstand d. In 2d ist sie F₀/4.'),
      L('Then add the two forces of each arrangement as arrows: same direction, opposite directions, or at an angle.', 'Addiere dann die beiden Kräfte jeder Anordnung als Pfeile: gleiche Richtung, entgegengesetzt oder unter einem Winkel.'),
    ],
    steps: rankSteps,
    figure: rankFigure,
  };
  const rank4 = { ...rank3, id: 'rank4', difficulty: 4, make: (r) => rankMake(r, 4) };

  // ---------------------------------------------------------------- 6 at a right angle
  const PYTH = [3 / 4, 4 / 3, 1, 5 / 12, 12 / 5];
  function rightMake(r, same) {
    const a = pick(r, [10, 20, 30, 40]) / 100, b = same ? a : pick(r, [10, 20, 30, 40]) / 100;
    if (!same && a === b) return null;
    const p = { t: sign(r) * pick(r, [1, 2, 3, 4, 5]) * 1e-6, q1: sign(r) * pick(r, [1, 2, 3, 4, 5, 6, 8, 9, 12, 16]) * 1e-6, q2: sign(r) * pick(r, [1, 2, 3, 4, 5, 6, 8, 9, 12, 16]) * 1e-6, x1: sign(r) * a, y2: sign(r) * b };
    const F1 = (K * Math.abs(p.t * p.q1)) / a ** 2, F2 = (K * Math.abs(p.t * p.q2)) / b ** 2;
    return PYTH.some((k) => Math.abs(F2 / F1 - k) < 1e-9) ? p : null;
  }
  function rightSolve(p, o = {}) {
    const f1 = force(p.t, [0, 0], p.q1, [p.x1, 0]), f2 = force(p.t, [0, 0], p.q2, [0, p.y2]), net = add(f1, f2);
    const F1 = len(f1), F2 = len(f2), al = (Math.atan2(F2, F1) * 180) / Math.PI;
    return { f1, f2, net, F1, F2, F: o.sum ? F1 + F2 : len(net), alpha: o.swap ? 90 - al : al, dir: dirOf([Math.sign(net[0]), Math.sign(net[1])]) };
  }
  function rightFigure(p, v, view) {
    const ext = Math.max(Math.abs(p.x1), Math.abs(p.y2)), s = 150 / ext;
    return drawing({
      scale: s,
      // the label of the charge opposite its forces; each dimension line on the side the other
      // force does not point to
      pts: [{ c: [0, 0], q: Math.sign(p.t), lab: qs(p.t, 'μC'), cls: 'hl', off: [-Math.sign(v.f1[0]) * 14, Math.sign(v.f2[1]) * 22] }, { c: [p.x1, 0], q: Math.sign(p.q1), lab: `1: ${qs(p.q1, 'μC')}` }, { c: [0, p.y2], q: Math.sign(p.q2), lab: `2: ${qs(p.q2, 'μC')}`, off: [14, 0] }],
      dims: [[[0, 0], [p.x1, 0], q(Math.abs(p.x1), 'cm'), -Math.sign(v.f2[1]) * Math.sign(p.x1) * 44], [[0, 0], [0, p.y2], q(Math.abs(p.y2), 'cm'), Math.sign(v.f1[0]) * Math.sign(p.y2) * 48]],
      forces: { F1: { at: [0, 0], F: v.f1, lab: sv('F', '1'), cls: 'k-1' }, F2: { at: [0, 0], F: v.f2, lab: sv('F', '2'), cls: 'k-2' }, F: { at: [0, 0], F: v.net, lab: sv('F'), cls: 'k-net' } },
      arrow: 95,
      after: (P, vw) => {
        if (!vw.show || !vw.show.has('F')) return;
        const big = Math.max(v.F1, v.F2, len(v.net)), k = 95 / big / s, e1 = mul(v.f1, k), e2 = mul(v.f2, k);
        P.line(e1, add(e1, e2), 'w thin dashed'); P.line(e2, add(e1, e2), 'w thin dashed');
      },
    }, view);
  }
  const right = {
    id: 'right', difficulty: 3,
    title: () => L('Forces at a right angle', 'Kräfte im rechten Winkel'),
    make: (r) => rightMake(r, true),
    solve: rightSolve,
    traps: ['sum', 'swap'],
    why: { sum: () => L('The forces are perpendicular: add them as arrows, with Pythagoras, not as numbers.', 'Die Kräfte stehen senkrecht aufeinander: Addiere sie als Pfeile, mit Pythagoras, nicht als Zahlen.'), swap: () => L('That is the angle to the other line: tan α = (opposite side)/(adjacent side).', 'Das ist der Winkel zur anderen Geraden: tan α = Gegenkathete/Ankathete.') },
    fields: (p) => { const v = rightSolve(p), u = forceUnit(Math.max(v.F1, v.F2, v.F)); return [num$('F1', 'F_1', u, L('force of charge 1', 'Kraft von Ladung 1')), num$('F2', 'F_2', u, L('force of charge 2', 'Kraft von Ladung 2')), num$('F', 'F', u, L('size of the net force', 'Betrag der resultierenden Kraft')), num$('alpha', '\\alpha', 'deg', L('angle between the net force and the horizontal', 'Winkel zwischen resultierender Kraft und Horizontale')), dirField('dir', L('direction', 'Richtung'), ['NE', 'NW', 'SW', 'SE'])]; },
    text: (p) => L(`A charge of ${qs(p.t, 'μC')} sits at the corner of a right angle; charge 1 (${qs(p.q1, 'μC')}) and charge 2 (${qs(p.q2, 'μC')}) are placed along the two sides, as shown. Find the forces of the two charges on it, the size of the net force, its angle to the horizontal and roughly where it points.`,
      `Eine Ladung von ${qs(p.t, 'μC')} sitzt in der Ecke eines rechten Winkels; Ladung 1 (${qs(p.q1, 'μC')}) und Ladung 2 (${qs(p.q2, 'μC')}) liegen auf den beiden Schenkeln, wie abgebildet. Bestimme die Kräfte der beiden Ladungen auf sie, den Betrag der resultierenden Kraft, ihren Winkel zur Horizontalen und ungefähr ihre Richtung.`),
    hints: () => [
      L('Each force from Coulomb’s law: one is horizontal, the other vertical (towards or away from the charge).', 'Jede Kraft aus dem Coulombgesetz: Eine ist horizontal, die andere vertikal (zur Ladung hin oder von ihr weg).'),
      L('Perpendicular forces: the net force is the diagonal of the rectangle, F = √(F₁² + F₂²), and tan α = F₂/F₁.', 'Senkrechte Kräfte: Die resultierende Kraft ist die Diagonale des Rechtecks, F = √(F₁² + F₂²), und tan α = F₂/F₁.'),
    ],
    steps: (p, v) => {
      const u = forceUnit(Math.max(v.F1, v.F2, v.F));
      const one = (i, qi, d, f, dirw) => step(L(`The force of charge ${i}`, `Die Kraft von Ladung ${i}`), p$(L(`Charge ${i} is ${q(d, 'cm')} away; ${p.t * qi < 0 ? 'it attracts' : 'it repels'} the charge, so the force points ${dirName(dirw)}.`, `Ladung ${i} ist ${q(d, 'cm')} entfernt; ${p.t * qi < 0 ? 'sie zieht die Ladung an' : 'sie stösst die Ladung ab'}, die Kraft zeigt also ${dirName(dirw)}.`)) +
        `$$F_${i} = k\\,\\frac{|q|\\,|q_${i}|}{r_${i}^2} = ${KT}\\cdot\\frac{${qC(p.t)}\\cdot ${qC(qi)}}{(${mT(d)})^2} = ${res(tq(f, u))}$$`, [`F${i}`], [`F${i}`]);
      return [
        one(1, p.q1, Math.abs(p.x1), v.F1, v.f1[0] > 0 ? 'E' : 'W'),
        one(2, p.q2, Math.abs(p.y2), v.F2, v.f2[1] > 0 ? 'N' : 'S'),
        step(L('The net force', 'Die resultierende Kraft'), p$(L('The forces are perpendicular: the net force is the diagonal of the rectangle they span.', 'Die Kräfte stehen senkrecht aufeinander: Die resultierende Kraft ist die Diagonale des Rechtecks, das sie aufspannen.')) +
          `$$F = \\sqrt{F_1^2 + F_2^2} = \\sqrt{(${tq(v.F1, u)})^2 + (${tq(v.F2, u)})^2} = ${res(tq(v.F, u))}$$`, ['F1', 'F2', 'F'], ['F']),
        step(L('Its direction', 'Ihre Richtung'), p$(L('Let $\\alpha$ be the angle between the net force and the horizontal (the line of force 1):', 'Sei $\\alpha$ der Winkel zwischen resultierender Kraft und der Horizontalen (der Richtung von Kraft 1):')) +
          `$$\\tan\\alpha = \\frac{F_2}{F_1} = \\frac{${tnum(inUnit(v.F2, u))}}{${tnum(inUnit(v.F1, u))}} \\;\\Rightarrow\\; \\alpha = ${res(tq(v.alpha, 'deg'))}$$` + p$(L(`It points ${rt(arrowWord(v.dir))}.`, `Sie zeigt ${rt(arrowWord(v.dir))}.`)), ['F1', 'F2', 'F'], ['F']),
      ];
    },
    figure: rightFigure,
  };
  const rightDist = { ...right, id: 'right-dist', difficulty: 4, title: () => L('At a right angle, different distances', 'Rechter Winkel, verschiedene Abstände'), make: (r) => rightMake(r, false) };

  // ---------------------------------------------------------------- 7 where is the force zero?
  // q1 at 0, q2 at d (m) on the x axis; m = |q2|/|q1| a square (or 9/4).
  function zeroMake(r, like) {
    const m = pick(r, like ? [1, 4, 9, 9 / 4, 16] : [4, 9, 9 / 4, 16]), q1 = pick(r, m === 9 / 4 ? [4, 8] : m === 16 ? [1, 2] : [1, 2, 3, 4]), s = sign(r);
    const swap = r() < 0.5, a = swap ? q1 * m : q1, b = swap ? q1 : q1 * m;
    const d = pick(r, [30, 40, 60, 90, 120]) / 100;
    const p = { q1: s * a * 1e-6, q2: (like ? s : -s) * b * 1e-6, d, like };
    const x = zeroSolve(p).x;
    return Math.abs(x * 100 - Math.round(x * 100)) < 1e-6 ? p : null;
  }
  function zeroSolve(p, o = {}) {
    const a = Math.abs(p.q1), b = Math.abs(p.q2), k = Math.sqrt(b / a);
    if (p.like) {
      const x = o.noRoot ? (p.d * a) / (a + b) : p.d / (1 + k);
      return { region: 'between', x: o.other ? p.d - x : x, pos: x };
    }
    // outside, beyond the smaller charge: its distance s from that charge
    const small = a < b ? 1 : 2, kk = Math.sqrt(Math.max(a, b) / Math.min(a, b));
    const s = o.noRoot ? p.d / (kk * kk - 1) : o.between ? p.d / (1 + kk) : p.d / (kk - 1);
    return { region: small === 1 ? 'left' : 'right', x: s, pos: small === 1 ? -s : p.d + s, small };
  }
  function zeroFigure(p, v, view) {
    const pos = v.pos, hide = view.show && view.show.size ? '' : 'hidden', xs = [0, p.d, pos], minX = Math.min(...xs), maxX = Math.max(...xs), s = 360 / (maxX - minX);
    return drawing({
      scale: s,
      pts: [{ c: [0, 0], q: Math.sign(p.q1), lab: `${sv('q', '1')} = ${qs(p.q1, 'μC')}` }, { c: [p.d, 0], q: Math.sign(p.q2), lab: `${sv('q', '2')} = ${qs(p.q2, 'μC')}` }, { c: [pos, 0], q: 0, lab: L('here', 'hier'), cls: `hl ${hide}` }],
      dims: [[[0, 0], [p.d, 0], q(p.d, 'cm'), -26], [[Math.min(pos, p.like || v.small === 1 ? 0 : p.d), 0], [Math.max(pos, p.like || v.small === 1 ? 0 : p.d), 0], q(v.x, 'cm'), -56, hide]],
      before: (P) => { P.line([minX - 0.1 * (maxX - minX), 0], [maxX + 0.1 * (maxX - minX), 0], 'w thin dashed'); },
    }, view);
  }
  const zeroRegions = () => [['left', L('left of q₁', 'links von q₁')], ['between', L('between the charges', 'zwischen den Ladungen')], ['right', L('right of q₂', 'rechts von q₂')]];
  const zeroLike = {
    id: 'zero-like', difficulty: 3,
    title: () => L('Where is the force zero?', 'Wo ist die Kraft null?'),
    make: (r) => zeroMake(r, true),
    solve: zeroSolve,
    traps: ['noRoot', 'other'],
    why: { noRoot: () => L('The forces go with 1/r²: the distances are in the ratio of the square roots of the charges.', 'Die Kräfte gehen mit 1/r²: Die Abstände stehen im Verhältnis der Wurzeln der Ladungen.'), other: () => L('That is the distance from q₂; the question asks for the distance from q₁.', 'Das ist der Abstand von q₂; gefragt ist der Abstand von q₁.') },
    fields: () => [choice('region', L('The point lies …', 'Der Punkt liegt …'), zeroRegions(), L('where the point lies', 'wo der Punkt liegt')), num$('x', 'x', 'cm', L('distance from q₁', 'Abstand von q₁'))],
    text: (p) => L(`Two point charges of ${qs(p.q1, 'μC')} (q₁) and ${qs(p.q2, 'μC')} (q₂) are ${q(p.d, 'cm')} apart. At which point on the line through them does a third charge feel no net force? Give the region and the distance from q₁.`,
      `Zwei Punktladungen von ${qs(p.q1, 'μC')} (q₁) und ${qs(p.q2, 'μC')} (q₂) sind ${q(p.d, 'cm')} voneinander entfernt. An welchem Punkt auf der Geraden durch sie spürt eine dritte Ladung keine resultierende Kraft? Gib den Bereich und den Abstand von q₁ an.`),
    hints: () => [
      L('The two forces on the third charge must point in opposite directions and have the same size. Where on the line do they point in opposite directions?', 'Die beiden Kräfte auf die dritte Ladung müssen entgegengesetzt und gleich gross sein. Wo auf der Geraden zeigen sie in entgegengesetzte Richtungen?'),
      L('Set k q q₁/x² = k q q₂/(distance to q₂)²: the third charge q cancels. Take the square root of both sides.', 'Setze k q q₁/x² = k q q₂/(Abstand zu q₂)²: Die dritte Ladung q kürzt sich. Zieh auf beiden Seiten die Wurzel.'),
    ],
    steps: (p, v) => {
      const a = Math.abs(p.q1), b = Math.abs(p.q2);
      return [
        step(L('Where?', 'Wo?'), p$(L('Like charges push (or pull) a third charge in the same way. Between them, their forces point in opposite directions; outside, in the same direction. So the point lies between them, nearer the smaller charge.', 'Gleichnamige Ladungen stossen (oder ziehen) eine dritte Ladung gleich. Zwischen ihnen zeigen ihre Kräfte in entgegengesetzte Richtungen, ausserhalb in dieselbe. Der Punkt liegt also zwischen ihnen, näher bei der kleineren Ladung.'))),
        step(L('Equal forces', 'Gleiche Kräfte'), p$(L('Let $x$ be the distance from $q_1$ and $d$ the distance between the charges. The forces on a third charge $q$ are equal:', 'Sei $x$ der Abstand von $q_1$ und $d$ der Abstand der Ladungen. Die Kräfte auf eine dritte Ladung $q$ sind gleich:')) +
          `$$k\\,\\frac{|q|\\,|q_1|}{x^2} = k\\,\\frac{|q|\\,|q_2|}{(d - x)^2} \\;\\Rightarrow\\; \\frac{d - x}{x} = \\sqrt{\\frac{|q_2|}{|q_1|}} \\;\\Rightarrow\\; x = \\frac{d}{1 + \\sqrt{|q_2|/|q_1|}}$$`, ['P']),
        step(L('The numbers', 'Die Zahlen'), `$$x = \\frac{${tq(p.d, 'cm')}}{1 + \\sqrt{${sig(b / a, 4)}}} = ${res(tq(v.x, 'cm'))}$$` + p$(L(`The point lies ${rt(L('between the charges', 'zwischen den Ladungen'))}, ${q(v.x, 'cm')} from q₁.`, `Der Punkt liegt ${rt('zwischen den Ladungen')}, ${q(v.x, 'cm')} von q₁ entfernt.`)), ['P']),
      ];
    },
    figure: zeroFigure,
  };
  const zeroUnlike = {
    ...zeroLike, id: 'zero-unlike', difficulty: 4,
    title: () => L('Zero force beside unlike charges', 'Kraft null bei ungleichnamigen Ladungen'),
    make: (r) => zeroMake(r, false),
    traps: ['noRoot', 'between'],
    why: { noRoot: () => L('The forces go with 1/r²: the distances are in the ratio of the square roots of the charges.', 'Die Kräfte gehen mit 1/r²: Die Abstände stehen im Verhältnis der Wurzeln der Ladungen.'), between: () => L('Between unlike charges, both forces point the same way: the point lies outside.', 'Zwischen ungleichnamigen Ladungen zeigen beide Kräfte in dieselbe Richtung: Der Punkt liegt ausserhalb.') },
    fields: () => [choice('region', L('The point lies …', 'Der Punkt liegt …'), zeroRegions(), L('where the point lies', 'wo der Punkt liegt')), num$('x', 'x', 'cm', L('distance from the nearer charge', 'Abstand von der näheren Ladung'))],
    text: (p) => L(`Two point charges of ${qs(p.q1, 'μC')} (q₁) and ${qs(p.q2, 'μC')} (q₂) are ${q(p.d, 'cm')} apart. At which point on the line through them does a third charge feel no net force? Give the region and the distance from the nearer of the two charges.`,
      `Zwei Punktladungen von ${qs(p.q1, 'μC')} (q₁) und ${qs(p.q2, 'μC')} (q₂) sind ${q(p.d, 'cm')} voneinander entfernt. An welchem Punkt auf der Geraden durch sie spürt eine dritte Ladung keine resultierende Kraft? Gib den Bereich und den Abstand von der näheren der beiden Ladungen an.`),
    steps: (p, v) => {
      const a = Math.abs(p.q1), b = Math.abs(p.q2), sm = v.small === 1 ? 'q_1' : 'q_2', bg = v.small === 1 ? 'q_2' : 'q_1', ratio = sig(Math.max(a, b) / Math.min(a, b), 4);
      return [
        step(L('Where?', 'Wo?'), p$(L(`Unlike charges: one pushes, the other pulls a third charge. Between them, both forces point the same way. Outside, they point in opposite directions, and they can be equal only near the smaller charge $${sm}$, where its smaller charge is made up for by the shorter distance.`,
          `Ungleichnamige Ladungen: Die eine stösst, die andere zieht eine dritte Ladung. Zwischen ihnen zeigen beide Kräfte in dieselbe Richtung. Ausserhalb zeigen sie in entgegengesetzte Richtungen, und gleich gross können sie nur nahe bei der kleineren Ladung $${sm}$ sein, wo ihre kleinere Ladung durch den kürzeren Abstand ausgeglichen wird.`))),
        step(L('Equal forces', 'Gleiche Kräfte'), p$(L(`Let $x$ be the distance from $${sm}$ and $d$ the distance between the charges; $${bg}$ is then $d + x$ away:`, `Sei $x$ der Abstand von $${sm}$ und $d$ der Abstand der Ladungen; $${bg}$ ist dann $d + x$ entfernt:`)) +
          `$$k\\,\\frac{|q|\\,|${sm}|}{x^2} = k\\,\\frac{|q|\\,|${bg}|}{(d + x)^2} \\;\\Rightarrow\\; \\frac{d + x}{x} = \\sqrt{\\frac{|${bg}|}{|${sm}|}} \\;\\Rightarrow\\; x = \\frac{d}{\\sqrt{|${bg}|/|${sm}|} - 1}$$`, ['P']),
        step(L('The numbers', 'Die Zahlen'), `$$x = \\frac{${tq(p.d, 'cm')}}{\\sqrt{${ratio}} - 1} = ${res(tq(v.x, 'cm'))}$$` +
          p$(L(`The point lies ${rt(v.small === 1 ? 'left of q₁' : 'right of q₂')}, ${q(v.x, 'cm')} from it.`, `Der Punkt liegt ${rt(v.small === 1 ? 'links von q₁' : 'rechts von q₂')}, ${q(v.x, 'cm')} davon entfernt.`)), ['P']),
      ];
    },
  };

  // ---------------------------------------------------------------- 8 moved slightly
  // Outer charges at (−1, 0) and (1, 0) (units of d), of the same sign; the middle one moved by
  // 0.25 d along the line or across it (drawn larger than "slightly", to be seen).
  function nudgeMake(r, across) {
    return { across, so: sign(r), sm: sign(r), dir: across ? pick(r, ['N', 'S']) : pick(r, ['E', 'W']), vert: r() < 0.3 };
  }
  const R90 = (c, v) => (v ? [-c[1], c[0]] : c); // the line drawn upright
  const DROT = { E: 'N', N: 'W', W: 'S', S: 'E' };
  function nudgeSolve(p) {
    const dv = { E: [0.25, 0], W: [-0.25, 0], N: [0, 0.25], S: [0, -0.25] }[p.dir], at = dv;
    const fa = force(p.sm, at, p.so, [-1, 0]).map((x) => x / K), fb = force(p.sm, at, p.so, [1, 0]).map((x) => x / K), net = add(fa, fb);
    const d0 = dirOf(net, 1), dir = p.vert ? DROT[d0] : d0, moved = p.vert ? DROT[p.dir] : p.dir;
    return { fa, fb, net, at, d: dir, stab: dir === moved ? 'away' : 'back', moved };
  }
  function nudgeFigure(p, v, view) {
    const c = (x) => R90(x, p.vert), sl = (s) => `${s > 0 ? '+' : '−'}<tspan font-style="italic">q</tspan>`;
    return drawing({
      scale: 170,
      before: (P) => { P.line(c([-1, 0]), c([1, 0]), 'w thin dashed'); P.charge(c([0, 0]), p.sm, '', 'ghost'); P.arrow(c([0, 0]), unit(c(v.at)), 22, 'force k-move'); },
      pts: [{ c: c([-1, 0]), q: p.so, lab: sl(p.so) }, { c: c([1, 0]), q: p.so, lab: sl(p.so) }, { c: c(v.at), q: p.sm, lab: sl(p.sm), cls: 'hl', off: p.across ? [16, -16] : [0, -21] }],
      dims: [[c([-1, 0]), c([0, 0]), sv('d'), p.vert ? 64 : -64], [c([0, 0]), c([1, 0]), sv('d'), p.vert ? 64 : -64]],
      // along the line, the labels of the two forces below them and that of the net force above
      forces: { Fa: { at: c(v.at), F: c(v.fa), lab: sv('F', '1'), cls: 'k-1', off: p.across || p.vert ? undefined : [0, 22] }, Fb: { at: c(v.at), F: c(v.fb), lab: sv('F', '2'), cls: 'k-2', off: p.across || p.vert ? undefined : [0, 22] }, F: { at: c(v.at), F: c(v.net), lab: sv('F'), cls: 'k-net', off: p.across || p.vert ? undefined : [0, 40] } },
      arrow: 80,
    }, view);
  }
  const nudgeFields = () => [dirField('d', L('direction of the net force', 'Richtung der resultierenden Kraft'), ['N', 'E', 'S', 'W', '0']),
    choice('stab', L('The net force …', 'Die resultierende Kraft …'), [['back', L('pushes the charge back to the middle', 'treibt die Ladung zur Mitte zurück')], ['away', L('pushes it further away from the middle', 'treibt sie weiter von der Mitte weg')]], L('whether it pushes the charge back to the middle', 'ob sie die Ladung zur Mitte zurücktreibt'))];
  const nudgeText = (p) => {
    const like = p.so === p.sm, side = p.across ? L('away from the line, across it', 'quer zur Geraden') : L('along the line, towards one of the outer charges', 'entlang der Geraden, zu einer der äusseren Ladungen hin');
    return L(`Three point charges of the same size lie on a line, the middle one exactly halfway between the others. There the forces on it cancel. Now the middle charge is moved slightly ${side} (the drawing exaggerates it). In which direction does the net force on it point? Does it push the charge back to the middle?`,
      `Drei gleich grosse Punktladungen liegen auf einer Geraden, die mittlere genau in der Mitte zwischen den anderen. Dort heben sich die Kräfte auf sie auf. Nun wird die mittlere Ladung ein wenig verschoben, ${side} (die Zeichnung übertreibt). In welche Richtung zeigt die resultierende Kraft auf sie? Treibt sie die Ladung zur Mitte zurück?`) + (like ? '' : '');
  };
  const nudgeHints = (p) => [
    L('Draw the forces of both outer charges on the moved charge: along the lines to them, towards them (unlike) or away from them (like).', 'Zeichne die Kräfte beider äusseren Ladungen auf die verschobene Ladung: entlang der Geraden zu ihnen, zu ihnen hin (ungleichnamig) oder von ihnen weg (gleichnamig).'),
    p.across ? L('Both charges are equally far away now: their forces are equally large. Which components cancel?', 'Beide Ladungen sind jetzt gleich weit entfernt: Ihre Kräfte sind gleich gross. Welche Komponenten heben sich auf?')
      : L('The nearer charge now acts with the larger force (1/r²).', 'Die nähere Ladung wirkt jetzt mit der grösseren Kraft (1/r²).'),
  ];
  function nudgeSteps(p, v) {
    const like = p.so === p.sm;
    const first = p.across
      ? (like ? L('Both outer charges repel the middle one. Moved off the line, it is equally far from both: the forces have the same size, their components along the line cancel, those across the line add up, pointing away from the line.', 'Beide äusseren Ladungen stossen die mittlere ab. Neben der Geraden ist sie von beiden gleich weit entfernt: Die Kräfte sind gleich gross, ihre Komponenten entlang der Geraden heben sich auf, die quer dazu addieren sich und zeigen von der Geraden weg.')
        : L('Both outer charges attract the middle one. Moved off the line, it is equally far from both: the forces have the same size, their components along the line cancel, those across the line add up, pointing back towards the line.', 'Beide äusseren Ladungen ziehen die mittlere an. Neben der Geraden ist sie von beiden gleich weit entfernt: Die Kräfte sind gleich gross, ihre Komponenten entlang der Geraden heben sich auf, die quer dazu addieren sich und zeigen zur Geraden zurück.'))
      : (like ? L('Both outer charges repel the middle one, in opposite directions. The nearer one now pushes harder (1/r²): the net force points away from it, back to the middle.', 'Beide äusseren Ladungen stossen die mittlere ab, in entgegengesetzte Richtungen. Die nähere stösst jetzt stärker (1/r²): Die resultierende Kraft zeigt von ihr weg, zurück zur Mitte.')
        : L('Both outer charges attract the middle one, in opposite directions. The nearer one now pulls harder (1/r²): the net force points towards it, further away from the middle.', 'Beide äusseren Ladungen ziehen die mittlere an, in entgegengesetzte Richtungen. Die nähere zieht jetzt stärker (1/r²): Die resultierende Kraft zeigt zu ihr hin, weiter von der Mitte weg.'));
    return [
      step(L('The two forces', 'Die beiden Kräfte'), p$(first), ['Fa', 'Fb']),
      step(L('The net force', 'Die resultierende Kraft'), p$(L(`The net force points ${rt(arrowWord(v.d))}: it ${rt(v.stab === 'back' ? 'pushes the charge back to the middle' : 'pushes it further away')}.`, `Die resultierende Kraft zeigt ${rt(arrowWord(v.d))}: Sie ${rt(v.stab === 'back' ? 'treibt die Ladung zur Mitte zurück' : 'treibt sie weiter weg')}.`)) +
        p$(v.stab === 'back' ? L('The middle is a stable position for this displacement: the charge returns, like a ball in a bowl.', 'Die Mitte ist für diese Verschiebung eine stabile Lage: Die Ladung kehrt zurück, wie eine Kugel in einer Schale.')
          : L('The middle is an unstable position for this displacement: the slightest push moves the charge away, like a ball on a hilltop.', 'Die Mitte ist für diese Verschiebung eine labile Lage: Der kleinste Stoss treibt die Ladung weg, wie eine Kugel auf einer Kuppe.')), ['Fa', 'Fb', 'F'], ['F']),
    ];
  }
  const nudgeAlong = { id: 'nudge-along', difficulty: 2, title: () => L('Moved along the line', 'Entlang der Geraden verschoben'), make: (r) => nudgeMake(r, false), solve: nudgeSolve, traps: [], why: {}, fields: nudgeFields, text: nudgeText, hints: nudgeHints, steps: nudgeSteps, figure: nudgeFigure };
  const nudgeAcross = { ...nudgeAlong, id: 'nudge-across', difficulty: 3, title: () => L('Moved off the line', 'Neben die Gerade verschoben'), make: (r) => nudgeMake(r, true) };

  const SCENARIOS = [pair, pairR, pairQ, factor, factorMix, factorFind, lineEnd, lineMid, which, whichSquare, rank3, rank4, right, rightDist, zeroLike, zeroUnlike, nudgeAlong, nudgeAcross];
  root.Scenarios = { SCENARIOS, drawing, sv };
  if (typeof module !== 'undefined') module.exports = root.Scenarios;
})(typeof window !== 'undefined' ? window : globalThis);
