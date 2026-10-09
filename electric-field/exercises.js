// The exercises of Electric Field, with their texts, in the current language (the app rebuilds them
// when the language changes). The form is that of Magnetic Forces: { id, type, kind, difficulty,
// title, text, figs, pic, questions, hints, solution, solFig, p }, with questions of the kinds
// tiles (directions or names: one, or all that fit), pick (one of four drawings), choice (one of a
// few values or words) and multi (statements to tick).
// The types:
//   force-dir, force-num        the force on a charge in a field; E = F/q
//   lines-pick, lines-read      field-line diagrams: which one is right; what a diagram tells
//   conductor                   the field around a conductor (none inside, lines perpendicular)
//   superpose, zero             the net field of point charges at a point; where it is zero
//   er-graph, factor            E(r) of a point charge, a sphere, a wire, a plate; factors
//   plates-num, millikan        the capacitor: E = Q/(ε₀A); Millikan's oil drop
//   dipole-uniform, dipole-point   a dipole in a uniform field (torque) and near a point charge
//   deflect-path, deflect-num   a charge flying into a capacitor: its path; its deflection
//   stmts                       which statements are correct?
(function (root) {
  'use strict';

  const E = root.Elec || require('./elec.js');
  const C = root.Charges || require('./charges.js');
  const { L, cap, rng, DIRS, dkey, dirName, dirOf, neg, nice, sci, show, values, choice, tiles, words, K, particle, chargeOf, signName } = E;
  const BOX = [-3, 3, -2.2, 2.2];
  const tile = (d, none) => `<span class="dtile">${C.icon(d)}<span>${dirName(d, none)}</span></span>`;
  const it = (s) => `<i>${s}</i>`;
  const rot = (d) => [-d[1], d[0]]; // 90° anticlockwise
  const FN = [[1e6, 'MN/C'], [1e3, 'kN/C'], [1, 'N/C']];
  const fieldN = (x) => E.inUnits(x, FN);
  const frac = (x) => (Math.abs(x - 1) < 1e-9 ? '×1' : x > 1 ? `×${nice(x)}` : `×1/${nice(1 / x)}`);
  const fig = (html) => `<div class="fig">${html}</div>`;
  const RULE = () => L('The force on a charge q in a field: <span class="vec"><i>F</i></span> = q·<span class="vec"><i>E</i></span>. For a positive charge it points along the field, for a negative charge against it.', 'Die Kraft auf eine Ladung q in einem Feld: <span class="vec"><i>F</i></span> = q·<span class="vec"><i>E</i></span>. Für eine positive Ladung zeigt sie in Feldrichtung, für eine negative entgegen.');
  const LINES = () => L('Field lines start at positive charges and end at negative ones (or at infinity); they never cross; they are closer together where the field is stronger; they end perpendicular on conductors. A drawing shows only the lines in one plane, so the number of lines drawn at a charge does not tell its size.',
    'Feldlinien beginnen bei positiven Ladungen und enden bei negativen (oder im Unendlichen); sie kreuzen sich nie; sie liegen dichter, wo das Feld stärker ist; sie enden senkrecht auf Leitern. Eine Zeichnung zeigt nur die Linien in einer Ebene, deshalb verrät die Zahl der gezeichneten Linien bei einer Ladung nicht ihre Grösse.');

  // ---------------------------------------------------------------- the force at a point
  const WHYF = {
    sign: () => L('Mind the sign of the charge: for a negative charge, the force points against the field.', 'Achte auf das Vorzeichen der Ladung: Bei einer negativen Ladung zeigt die Kraft gegen das Feld.'),
    perp: () => L('The electric force points along the field (or against it), not across it as a magnetic force would.', 'Die elektrische Kraft zeigt längs des Feldes (oder entgegen), nicht quer dazu wie eine magnetische Kraft.'),
    none: () => L('The particle is charged, so the field exerts a force on it.', 'Das Teilchen ist geladen, also übt das Feld eine Kraft auf es aus.'),
    some: () => L('A neutral particle feels no electric force.', 'Ein neutrales Teilchen spürt keine elektrische Kraft.'),
  };
  function forceDir(seed) {
    const r = rng(seed * 31 + 7), q = r.pick([1, 1, -1, -1, 0]), pt = particle(r, q), Ed = r.pick(DIRS);
    const F = q > 0 ? Ed : q < 0 ? neg(Ed) : null;
    const how = q ? L(`<span class="vec"><i>F</i></span> = q·<span class="vec"><i>E</i></span>: ${q > 0 ? 'for a positive charge the force points along the field' : 'for a negative charge the force points against the field'}, ${dirName(F)}.`, `<span class="vec"><i>F</i></span> = q·<span class="vec"><i>E</i></span>: ${q > 0 ? 'Für eine positive Ladung zeigt die Kraft in Feldrichtung' : 'Für eine negative Ladung zeigt die Kraft gegen das Feld'}, ${dirName(F)}.`)
      : L('A neutral particle feels no electric force.', 'Ein neutrales Teilchen spürt keine elektrische Kraft.');
    const tempt = q ? [[neg(F), 'sign'], [rot(Ed), 'perp'], [null, 'none'], [neg(rot(Ed)), 'perp']] : [[Ed, 'some'], [neg(Ed), 'some'], [rot(Ed), 'some']];
    const opts = [{ d: F, ok: true }];
    for (const [d, tag] of tempt) if (opts.length < 4 && !opts.some((o) => dkey(o.d) === dkey(d))) opts.push({ d, ok: false, tag });
    return {
      kind: 'force', title: L('The force in a field', 'Die Kraft im Feld'),
      text: L(`<p>${cap(pt.name())} is in an electric field that points ${dirName(Ed)}.</p>`, `<p>${cap(pt.name())} befindet sich in einem elektrischen Feld, das ${dirName(Ed)} zeigt.</p>`),
      figs: fig(C.fig({ kind: 'uniform', E: Ed }, { box: BOX, lines: true, parts: [{ x: 0, y: 0, q, sym: pt.sym }], W: 320 })),
      questions: [tiles('F', L('In which direction does the electric force on it point?', 'In welche Richtung zeigt die elektrische Kraft auf es?'), r.shuffle(opts).map((o) => ({ html: tile(o.d, L('no force', 'keine Kraft')), ok: o.ok, tag: o.tag, why: o.ok ? '' : `${WHYF[o.tag]()} ${how}` })))],
      hints: [chargeOf(pt), RULE()], solution: [how], p: { q, E: dkey(Ed), pt: pt.id },
    };
  }
  function forceNum(seed) {
    const r = rng(seed * 37 + 11), q1 = r.pick([1.5, 2, 2.5, 3.2, 4]) * 1e-9, F1 = r.pick([12, 24, 38, 50, 75]) * 1e-6, Ef = F1 / q1;
    const q2 = r.pick([-1, 1]) * r.pick([1, 2, 3, 5]) * 1e-9, F2 = Math.abs(q2) * Ef;
    const howE = L(`E = F/q = ${show(F1, 'force')} / ${show(q1, 'charge')} = ${fieldN(Ef)}. The field does not depend on the test charge.`, `E = F/q = ${show(F1, 'force')} / ${show(q1, 'charge')} = ${fieldN(Ef)}. Das Feld hängt nicht von der Probeladung ab.`);
    const howF = L(`F = |q|·E = ${show(Math.abs(q2), 'charge')} · ${fieldN(Ef)} = ${show(F2, 'force')}.`, `F = |q|·E = ${show(Math.abs(q2), 'charge')} · ${fieldN(Ef)} = ${show(F2, 'force')}.`);
    const howD = q2 > 0 ? L('Both test charges are positive: the force points the same way.', 'Beide Probeladungen sind positiv: Die Kraft zeigt in dieselbe Richtung.') : L('The second test charge is negative: the force points the opposite way.', 'Die zweite Probeladung ist negativ: Die Kraft zeigt in die Gegenrichtung.');
    return {
      kind: 'force', title: L('Field strength', 'Feldstärke'),
      text: L(`<p>A test charge of +${show(q1, 'charge')} at the point P feels an electric force of ${show(F1, 'force')}. Then it is replaced by a test charge of ${q2 > 0 ? '+' : '−'}${show(Math.abs(q2), 'charge')}.</p>`, `<p>Eine Probeladung von +${show(q1, 'charge')} im Punkt P erfährt eine elektrische Kraft von ${show(F1, 'force')}. Dann wird sie durch eine Probeladung von ${q2 > 0 ? '+' : '−'}${show(Math.abs(q2), 'charge')} ersetzt.</p>`),
      figs: '',
      questions: [
        choice('E', L('(a) the field strength at P', '(a) die Feldstärke in P'), values(Ef, [{ value: Ef * 1e-3, tag: 'prefix', why: L(`Mind the prefixes: µN and nC. ${howE}`, `Achte auf die Vorsätze: µN und nC. ${howE}`) }, { value: q1 / F1, tag: 'inv', why: howE }], null, howE, { fmt: fieldN })),
        choice('F', L('(b) the size of the force on the second test charge', '(b) der Betrag der Kraft auf die zweite Probeladung'), values(F2, [{ value: F1, tag: 'same', why: L(`The field is the same, but the force depends on the charge. ${howF}`, `Das Feld ist dasselbe, aber die Kraft hängt von der Ladung ab. ${howF}`) }, { value: (F1 * q1) / Math.abs(q2), tag: 'inv', why: howF }], 'force', howF)),
        choice('dir', L('(c) Compared with the force on the first test charge, it points', '(c) Verglichen mit der Kraft auf die erste Probeladung zeigt sie'), words(r, [[L('the same way', 'in dieselbe Richtung'), q2 > 0, howD], [L('the opposite way', 'in die Gegenrichtung'), q2 < 0, howD], [L('at right angles', 'im rechten Winkel dazu'), false, howD]])),
      ],
      hints: [L('E = F/q: the field strength is the force per charge.', 'E = F/q: Die Feldstärke ist die Kraft pro Ladung.'), L('The field at P is the same for every test charge; the force is not.', 'Das Feld in P ist für jede Probeladung dasselbe; die Kraft nicht.')],
      solution: [howE, howF, howD], p: { q1, F1, q2 },
    };
  }

  // ---------------------------------------------------------------- field-line diagrams
  const LCONF = [
    { id: 'like', c: [[1, -1], [1, 1]] }, { id: 'opp', c: [[1, -1], [-1, 1]] }, { id: 'unequal', c: [[2, -1], [-1, 1]] },
    { id: 'neg', c: [[-1, -1], [-1, 1]] }, { id: 'unequal2', c: [[1, -1], [-2, 1]] }, { id: 'plate', c: null },
  ];
  const pts2 = (spec) => ({ kind: 'points', charges: spec.map(([q, x]) => ({ q, x, y: 0 })) });
  const label = (q) => (q > 0 ? (q > 1 ? `+${q}` : '+') : q < -1 ? `−${-q}` : '−');
  const WHYL = {
    reverse: () => L('The arrows point the wrong way: field lines start at positive charges and end at negative ones.', 'Die Pfeile zeigen falsch herum: Feldlinien beginnen bei positiven Ladungen und enden bei negativen.'),
    separate: () => L('Field lines never cross: at each point the field has a single direction, that of the sum of the fields of all the charges.', 'Feldlinien kreuzen sich nie: In jedem Punkt hat das Feld eine einzige Richtung, die der Summe der Felder aller Ladungen.'),
    swap: () => L('This pattern belongs to another arrangement: lines here run into a positive charge or out of a negative one, which cannot be.', 'Dieses Muster gehört zu einer anderen Anordnung: Linien laufen hier in eine positive Ladung hinein oder aus einer negativen heraus, was nicht sein kann.'),
    plate: () => L('Field lines end perpendicular on a conductor; they do not run into the metal.', 'Feldlinien enden senkrecht auf einem Leiter; sie laufen nicht ins Metall hinein.'),
    away: () => L('The plate is a conductor connected to the ground: negative charge collects under the positive charge, and the lines end on the plate.', 'Die Platte ist ein geerdeter Leiter: Unter der positiven Ladung sammelt sich negative Ladung, und die Linien enden auf der Platte.'),
  };
  function linesPick(seed) {
    const r = rng(seed * 41 + 13), cf = r.pick(LCONF), opts = [];
    const small = (c, given, o = {}) => C.fig(c, { box: BOX, given, small: true, ...o });
    let c, labels, name;
    if (!cf.c) {
      const q = r.pick([1, -1]);
      c = { kind: 'image', charge: { q, x: 0, y: 0.5 }, plate: -0.8 }; labels = [label(q)];
      name = L(`a ${q > 0 ? 'positive' : 'negative'} charge above a grounded metal plate`, `eine ${q > 0 ? 'positive' : 'negative'} Ladung über einer geerdeten Metallplatte`);
      const right = C.lines(c, BOX), alone = C.lines({ kind: 'points', charges: [c.charge] }, BOX);
      const like = C.lines({ kind: 'points', charges: [c.charge, { q, x: 0, y: -2.1 }] }, BOX).map((ln) => { const k = ln.findIndex((p) => p[1] < c.plate); return k < 0 ? ln : ln.slice(0, k); });
      opts.push({ html: small(c, right, { labels }), ok: true }, { html: small(c, right, { labels, reverse: true }), tag: 'reverse' }, { html: small(c, alone, { labels }), tag: 'plate' }, { html: small(c, like, { labels }), tag: 'away' });
    } else {
      const flip = r.next() < 0.5 && cf.id !== 'neg', spec = cf.c.map(([q, x]) => [flip ? -q : q, x]);
      c = pts2(spec); labels = spec.map(([q]) => label(q));
      name = L(`the charges ${labels.join(' and ')}`, `die Ladungen ${labels.join(' und ')}`);
      const right = C.lines(c, BOX);
      opts.push({ html: small(c, right, { labels }), ok: true }, { html: small(c, right, { labels, reverse: true }), tag: 'reverse' });
      const sep = c.charges.flatMap((ch) => C.lines({ kind: 'points', charges: [ch] }, BOX));
      const swapped = C.lines(pts2([spec[0], [-spec[1][0], spec[1][1]]]), BOX);
      const cand = [{ html: small(c, sep, { labels }), tag: 'separate' }, { html: small(c, swapped, { labels }), tag: 'swap' }];
      opts.push(...r.shuffle(cand).slice(0, 2));
    }
    return {
      kind: 'lines', title: L('Field lines', 'Feldlinien'),
      text: L(`<p>Which diagram shows the field lines of ${name}?</p>`, `<p>Welches Diagramm zeigt die Feldlinien für ${name}?</p>`), figs: '',
      questions: [{ type: 'pick', key: 'd', label: L('Which diagram is right?', 'Welches Diagramm stimmt?'), options: r.shuffle(opts).map((o) => ({ html: o.html, ok: !!o.ok, tag: o.tag, why: o.ok ? '' : `${WHYL[o.tag]()} ${LINES()}` })) }],
      hints: [L('Where do the lines start, where do they end?', 'Wo beginnen die Linien, wo enden sie?'), L('Can two lines cross?', 'Können sich zwei Linien kreuzen?'), LINES()],
      solution: [LINES()], solFig: fig(C.fig(c, { box: BOX, lines: true, labels })), p: { cf: cf.id, seed: seed % 7 },
    };
  }
  function linesRead(seed) {
    const r = rng(seed * 43 + 17);
    for (;;) {
      const qa = r.pick([1, 2, 3]) * r.pick([1, -1]), qb = r.pick([1, 2, 3]) * r.pick([1, -1]);
      const c = pts2([[qa, -1], [qb, 1]]), per = 6;
      const cand = r.shuffle([[0, 0], [0, 1.6], [-2.4, 0.4], [2.4, -0.4], [-1, 1], [1, -1], [0, -1.3], [-1.6, -1.2], [1.6, 1.2]]).slice(0, 3);
      const mags = cand.map(([x, y]) => Math.hypot(...C.field(c, x, y)));
      const best = mags.indexOf(Math.max(...mags)), sorted = [...mags].sort((a, b) => b - a);
      if (sorted[0] < 1.4 * sorted[1]) continue;
      // a drawing shows only the lines in one plane: the point must also be where the drawn lines are densest
      const lns = C.lines(c, BOX, { per }), near = ([x, y]) => lns.filter((ln) => ln.some((q) => Math.hypot(q[0] - x, q[1] - y) < 0.35)).length;
      const dens = cand.map(near);
      if (dens.some((d, i) => i !== best && d >= dens[best])) continue;
      const pn = ['P', 'Q', 'R'], points = cand.map(([x, y], i) => ({ x, y, name: pn[i] }));
      const sgn = (q, n) => L(`The lines ${q > 0 ? 'start' : 'end'} at ${n}: ${n} is ${q > 0 ? 'positive' : 'negative'}.`, `Die Linien ${q > 0 ? 'beginnen' : 'enden'} bei ${n}: ${n} ist ${q > 0 ? 'positiv' : 'negativ'}.`);
      const howP = L(`The field is strongest where the lines are densest: at ${pn[best]}.`, `Das Feld ist am stärksten, wo die Linien am dichtesten sind: bei ${pn[best]}.`);
      const pm = (q, n) => words(r, [[L('positive', 'positiv'), q > 0, sgn(q, n)], [L('negative', 'negativ'), q < 0, sgn(q, n)]]);
      return {
        kind: 'lines', title: L('Reading field lines', 'Feldlinien lesen'),
        text: L('<p>The diagram shows the field lines of two charges A and B (their signs are hidden) and three points.</p>', '<p>Das Diagramm zeigt die Feldlinien zweier Ladungen A und B (ihre Vorzeichen sind verdeckt) und drei Punkte.</p>'),
        figs: fig(C.fig(c, { box: BOX, given: lns, unknown: true, points })),
        questions: [
          choice('a', L('(a) A is', '(a) A ist'), pm(qa, 'A')), choice('b', L('(b) B is', '(b) B ist'), pm(qb, 'B')),
          tiles('P', L('(c) Where is the field strongest?', '(c) Wo ist das Feld am stärksten?'), pn.map((n, i) => ({ html: `<span class="dtile"><b>${n}</b></span>`, ok: i === best, why: howP }))),
        ],
        hints: [LINES()], solution: [sgn(qa, 'A'), sgn(qb, 'B'), howP], p: { qa, qb, pts: cand.join(';') },
      };
    }
  }
  function conductor(seed) {
    const r = rng(seed * 47 + 19), box = [-3, 3, -2, 2], cyl = { kind: 'cylinder', a: 0.8, E0: 1 }, small = (c, given) => C.fig(c, { box, given, small: true });
    const right = C.lines(cyl, box, { count: 13 }), flow = C.lines({ kind: 'flow', a: 0.8, E0: 1 }, box, { count: 13 }), through = C.lines({ kind: 'uniform', E: [1, 0] }, box, { gap: 0.32 });
    const inside = right.concat([-0.5, -0.25, 0, 0.25, 0.5].map((y) => [[-Math.sqrt(0.64 - y * y), y], [Math.sqrt(0.64 - y * y), y]]));
    const why = {
      flow: () => L('Here the lines run along the surface. But at the surface of a conductor the field is perpendicular to it: otherwise charges would move along the surface.', 'Hier laufen die Linien längs der Oberfläche. Aber an der Oberfläche eines Leiters steht das Feld senkrecht: Sonst würden sich Ladungen längs der Oberfläche bewegen.'),
      through: () => L('In the metal the free charges move until the field inside is zero: the lines end on the surface (on the induced charges) and start again on the other side.', 'Im Metall bewegen sich die freien Ladungen, bis das Feld im Innern null ist: Die Linien enden auf der Oberfläche (auf den influenzierten Ladungen) und beginnen auf der anderen Seite wieder.'),
      inside: () => L('Inside a conductor there is no field (a Faraday cage).', 'Im Innern eines Leiters gibt es kein Feld (ein Faradaykäfig).'),
    };
    const opts = [{ html: small(cyl, right), ok: true }, { html: small(cyl, flow), tag: 'flow' }, { html: small(cyl, through), tag: 'through' }, { html: small(cyl, inside), tag: 'inside' }];
    const howIn = L('The free charges in the metal move until their field cancels the outer field inside: the field inside a conductor is zero.', 'Die freien Ladungen im Metall bewegen sich, bis ihr Feld das äussere Feld im Innern aufhebt: Das Feld im Innern eines Leiters ist null.');
    return {
      kind: 'lines', title: L('A conductor in a field', 'Ein Leiter im Feld'),
      text: L('<p>A metal cylinder (seen end-on) is put into a uniform electric field pointing to the right.</p>', '<p>Ein Metallzylinder (von der Stirnseite gesehen) wird in ein homogenes elektrisches Feld gebracht, das nach rechts zeigt.</p>'), figs: '',
      questions: [{ type: 'pick', key: 'd', label: L('(a) Which diagram shows the field?', '(a) Welches Diagramm zeigt das Feld?'), options: r.shuffle(opts).map((o) => ({ html: o.html, ok: !!o.ok, tag: o.tag, why: o.ok ? '' : why[o.tag]() })) },
        choice('in', L('(b) Inside the metal, the field is', '(b) Im Innern des Metalls ist das Feld'), words(r, [[L('zero', 'null'), true, ''], [L('as strong as outside', 'gleich stark wie aussen'), false, howIn], [L('stronger than outside', 'stärker als aussen'), false, howIn]]))],
      hints: [L('The metal has free charges that move in the field.', 'Das Metall hat freie Ladungen, die sich im Feld bewegen.'), L('How do field lines meet a conductor?', 'Wie treffen Feldlinien auf einen Leiter?')],
      solution: [howIn, why.flow()], solFig: fig(C.fig(cyl, { box, given: right })), p: { s: seed % 5 },
    };
  }

  // ---------------------------------------------------------------- superposition
  const NAMES3 = ['A', 'B', 'C'];
  function superpose(seed) {
    const r = rng(seed * 53 + 23);
    for (let tries = 0; ; tries++) {
      const n = r.pick([2, 2, 3]), used = new Set(['0,0']), ch = [];
      while (ch.length < n) { const x = r.int(-2, 2), y = r.int(-1, 1), k = `${x},${y}`; if (used.has(k)) continue; used.add(k); ch.push({ q: r.pick([1, 1, 2, -1, -1, -2]), x, y }); }
      const part = ch.map((s) => { const dx = -s.x, dy = -s.y, r3 = Math.hypot(dx, dy) ** 3; return [(s.q * dx) / r3, (s.q * dy) / r3]; });
      const net = part.reduce((a, b) => [a[0] + b[0], a[1] + b[1]], [0, 0]), d = dirOf(net);
      if (d === undefined) continue;
      const mags = part.map((v) => Math.hypot(...v)), mx = Math.max(...mags);
      if (mags.filter((m) => m > mx * 0.95).length > 1) continue;
      const big = mags.indexOf(mx);
      // tempting: the wrong sign, the strongest charge alone, one charge left out (only directions among the eight)
      const tempt = [[neg(d), 'sign'], [dirOf(part[big]), 'largest'], ...part.map((v) => [dirOf(net.map((x, j) => x - v[j])), 'miss'])].filter(([x]) => x !== undefined);
      const opts = [{ d, ok: true }];
      for (const [x, tag] of r.shuffle(tempt.slice(1)).concat([tempt[0]])) if (opts.length < 4 && x !== undefined && !opts.some((o) => dkey(o.d) === dkey(x))) opts.push({ d: x, tag });
      for (const x of r.shuffle([...DIRS, null])) if (opts.length < 4 && !opts.some((o) => dkey(o.d) === dkey(x))) opts.push({ d: x, tag: 'other' });
      const desc = ch.map((s, i) => L(`${NAMES3[i]} (${label(s.q)}): its field at P points ${s.q > 0 ? 'away from' : 'towards'} ${NAMES3[i]}, strength ∝ |q|/r² = ${nice(Math.abs(s.q))}/${nice(s.x * s.x + s.y * s.y)}`,
        `${NAMES3[i]} (${label(s.q)}): Sein Feld in P zeigt ${s.q > 0 ? 'von' : 'zu'} ${NAMES3[i]} ${s.q > 0 ? 'weg' : 'hin'}, Stärke ∝ |q|/r² = ${nice(Math.abs(s.q))}/${nice(s.x * s.x + s.y * s.y)}`));
      const how = L(`Add the fields as vectors: ${d ? `the sum points ${dirName(d)}` : 'they cancel: the net field at P is zero'}.`, `Addiere die Felder als Vektoren: ${d ? `Die Summe zeigt ${dirName(d)}` : 'Sie heben sich auf: Das Gesamtfeld in P ist null'}.`);
      const WHYS = { sign: L('The field of a positive charge points away from it, that of a negative charge towards it.', 'Das Feld einer positiven Ladung zeigt von ihr weg, das einer negativen zu ihr hin.'), largest: L('That is the field of the strongest charge alone; the others count too.', 'Das ist das Feld der stärksten Ladung allein; die anderen zählen auch.'), miss: L('One of the charges is left out.', 'Eine der Ladungen fehlt.'), other: '' };
      const c = { kind: 'points', charges: ch };
      return {
        kind: 'sup', title: L('Fields add up', 'Felder addieren sich'),
        text: L(`<p>The charges ${ch.map((s, i) => `${NAMES3[i]} = ${label(s.q)}q`).join(', ')} sit on a grid around the point P (grid spacing 1).</p>`, `<p>Die Ladungen ${ch.map((s, i) => `${NAMES3[i]} = ${label(s.q)}q`).join(', ')} liegen auf einem Gitter um den Punkt P (Gitterabstand 1).</p>`),
        figs: fig(C.fig(c, { box: [-3, 3, -1.8, 1.8], labels: ch.map((s) => label(s.q)), names: ch.map((s, i) => ({ x: s.x, y: s.y, name: NAMES3[i] })), points: [{ x: 0, y: 0, name: 'P' }], grid: true })),
        questions: [
          tiles('E', L('(a) In which direction does the net field at P point?', '(a) In welche Richtung zeigt das Gesamtfeld in P?'), r.shuffle(opts).map((o) => ({ html: tile(o.d, L('zero', 'null')), ok: !!o.ok, tag: o.tag, why: o.ok ? '' : `${WHYS[o.tag] || ''} ${desc.join('; ')}. ${how}` }))),
          tiles('big', L('(b) Which charge makes the strongest field at P?', '(b) Welche Ladung erzeugt in P das stärkste Feld?'), ch.map((s, i) => ({ html: `<span class="dtile"><b>${NAMES3[i]}</b></span>`, ok: i === big, why: `${desc.join('; ')}.` }))),
        ],
        hints: [L('The field of a point charge: E = k·|q|/r², away from a positive charge, towards a negative one.', 'Das Feld einer Punktladung: E = k·|q|/r², von einer positiven Ladung weg, zu einer negativen hin.'), L('Draw the field of each charge at P, then add the arrows.', 'Zeichne das Feld jeder Ladung in P, dann addiere die Pfeile.')],
        solution: [`${desc.join('; ')}.`, how], p: { ch: ch.map((s) => `${s.q}@${s.x},${s.y}`).join(' ') },
      };
    }
  }
  const PAIRS = [[1, 4], [4, 1], [1, 9], [9, 1], [1, -4], [-4, 1], [4, -1], [-1, 9], [9, -1], [1, 1], [-1, -1], [1, -1], [-4, -1], [-1, -4]];
  function zero(seed) {
    const r = rng(seed * 59 + 29), [a, b] = r.pick(PAIRS), unit = r.pick([1, 2, 3]), d = r.pick([10, 12, 15, 20, 30]);
    const ra = Math.sqrt(Math.abs(a)), rb = Math.sqrt(Math.abs(b)), like = a * b > 0;
    let region, x = null;
    if (like) { x = (d * ra) / (ra + rb); region = Math.abs(ra - rb) < 1e-9 ? 'mid' : ra < rb ? 'nearA' : 'nearB'; }
    else if (Math.abs(ra - rb) < 1e-9) region = 'none';
    else if (ra < rb) { x = -(d * ra) / (rb - ra); region = 'left'; }
    else { x = d + (d * rb) / (ra - rb); region = 'right'; }
    const R = {
      nearA: L('between A and B, closer to A', 'zwischen A und B, näher bei A'), nearB: L('between A and B, closer to B', 'zwischen A und B, näher bei B'), mid: L('exactly halfway between A and B', 'genau in der Mitte zwischen A und B'),
      left: L('on the far side of A (left of A)', 'jenseits von A (links von A)'), right: L('on the far side of B (right of B)', 'jenseits von B (rechts von B)'), none: L('nowhere (only far away)', 'nirgends (nur weit weg)'),
    };
    const qa = a * unit, qb = b * unit;
    const howR = like ? L('With charges of the same sign, the two fields point opposite ways between them: they can cancel there, closer to the smaller charge.', 'Bei Ladungen gleichen Vorzeichens zeigen die beiden Felder dazwischen in entgegengesetzte Richtungen: Dort können sie sich aufheben, näher bei der kleineren Ladung.')
      : region === 'none' ? L('With equal charges of opposite signs, the fields add up between them and never cancel outside.', 'Bei gleich grossen Ladungen entgegengesetzten Vorzeichens addieren sich die Felder dazwischen und heben sich ausserhalb nie auf.')
        : L('With charges of opposite signs, the fields point the same way between them; outside, beyond the smaller charge, they can cancel.', 'Bei Ladungen entgegengesetzten Vorzeichens zeigen die Felder dazwischen in dieselbe Richtung; ausserhalb, jenseits der kleineren Ladung, können sie sich aufheben.');
    const dist = x == null ? null : Math.abs(x);
    const howX = x == null ? '' : L(`There k·|q_A|/r_A² = k·|q_B|/r_B², so r_A/r_B = √(|q_A|/|q_B|) = ${nice(ra / rb)}: the point is ${nice(dist)} cm from A.`, `Dort ist k·|q_A|/r_A² = k·|q_B|/r_B², also r_A/r_B = √(|q_A|/|q_B|) = ${nice(ra / rb)}: Der Punkt liegt ${nice(dist)} cm von A entfernt.`);
    const regions = r.shuffle(Object.keys(R).filter((k) => k !== region)).slice(0, 3).concat(region);
    const qs = [choice('reg', L('(a) The net field is zero', '(a) Das Gesamtfeld ist null'), r.shuffle(regions).map((k) => ({ label: R[k], ok: k === region, why: k === region ? '' : howR })))];
    if (x != null) {
      const lin = like ? (d * Math.abs(a)) / (Math.abs(a) + Math.abs(b)) : Math.abs(a) < Math.abs(b) ? (d * Math.abs(a)) / (Math.abs(b) - Math.abs(a)) : d + (d * Math.abs(b)) / (Math.abs(a) - Math.abs(b));
      qs.push(choice('x', L('(b) its distance from A', '(b) sein Abstand von A'), values(dist, [{ value: lin, tag: 'linear', why: L(`The field falls with the square of the distance: use the square roots of the charges. ${howX}`, `Das Feld nimmt mit dem Quadrat des Abstands ab: Nimm die Wurzeln der Ladungen. ${howX}`) }, { value: d - dist, tag: 'fromB', why: howX }], null, howX, { fmt: (v) => `${nice(v)} cm` })));
    }
    const c = { kind: 'points', charges: [{ q: Math.sign(a) * Math.min(3, Math.abs(a) === 1 ? 1 : 2), x: -1, y: 0 }, { q: Math.sign(b) * Math.min(3, Math.abs(b) === 1 ? 1 : 2), x: 1, y: 0 }] };
    return {
      kind: 'sup', title: L('Where is the field zero?', 'Wo ist das Feld null?'),
      text: L(`<p>Two point charges are ${d} cm apart: A = ${qa > 0 ? '+' : '−'}${Math.abs(qa)} nC and B = ${qb > 0 ? '+' : '−'}${Math.abs(qb)} nC. On the line through them, where is their net field zero?</p>`, `<p>Zwei Punktladungen sind ${d} cm voneinander entfernt: A = ${qa > 0 ? '+' : '−'}${Math.abs(qa)} nC und B = ${qb > 0 ? '+' : '−'}${Math.abs(qb)} nC. Wo auf der Geraden durch sie ist ihr Gesamtfeld null?</p>`),
      figs: fig(C.fig(c, { box: [-3, 3, -0.9, 0.9], labels: [label(Math.sign(a)), label(Math.sign(b))], names: [{ x: -1, y: 0, name: 'A' }, { x: 1, y: 0, name: 'B' }], axis: true })),
      questions: qs,
      hints: [L('Between charges of the same sign the fields point opposite ways; between charges of opposite signs the same way.', 'Zwischen Ladungen gleichen Vorzeichens zeigen die Felder in entgegengesetzte Richtungen, zwischen Ladungen entgegengesetzten Vorzeichens in dieselbe.'), L('Where the fields cancel, the point is closer to the smaller charge.', 'Wo sich die Felder aufheben, liegt der Punkt näher bei der kleineren Ladung.'), L('k·|q_A|/r_A² = k·|q_B|/r_B².', 'k·|q_A|/r_A² = k·|q_B|/r_B².')],
      solution: [howR, howX].filter(Boolean), p: { a, b, unit, d },
    };
  }

  // ---------------------------------------------------------------- field strength of distributions
  const SHAPES = {
    point: { f: (x) => (x < 0.08 ? null : 0.3 / (x * x)), dat: 'einer Punktladung', name: () => L('a point charge', 'eine Punktladung'), law: () => L('E = k·Q/r²: it falls with the square of the distance.', 'E = k·Q/r²: Es nimmt mit dem Quadrat des Abstands ab.') },
    sphere: { f: (x) => (x < 1 ? 0 : 1 / (x * x)), dat: 'einer geladenen Metallkugel mit dem Radius R', name: () => L('a charged metal sphere of radius R', 'eine geladene Metallkugel mit dem Radius R'), law: () => L('Inside the metal sphere there is no field; outside, E = k·Q/r², as for a point charge at its centre.', 'Im Innern der Metallkugel gibt es kein Feld; aussen ist E = k·Q/r², wie für eine Punktladung im Mittelpunkt.'), marks: [{ x: 1, name: 'R' }] },
    wire: { f: (x) => (x < 0.08 ? null : 0.6 / x), dat: 'einem langen geladenen Draht', name: () => L('a long charged wire', 'ein langer geladener Draht'), law: () => L('E = λ/(2π·ε₀·r): it falls with the distance, more slowly than for a point charge.', 'E = λ/(2π·ε₀·r): Es nimmt mit dem Abstand ab, langsamer als bei einer Punktladung.') },
    plate: { f: () => 0.55, dat: 'einer grossen geladenen Platte', name: () => L('a large charged plate', 'eine grosse geladene Platte'), law: () => L('E = σ/(2ε₀): the same at every distance (as long as the plate is large compared with the distance).', 'E = σ/(2ε₀): bei jedem Abstand gleich (solange die Platte gross ist im Vergleich zum Abstand).') },
  };
  function erGraph(seed) {
    const r = rng(seed * 61 + 31), key = r.pick(Object.keys(SHAPES)), S = SHAPES[key], back = r.next() < 0.4;
    const gr = (k, small) => C.graph(SHAPES[k].f, { small, marks: SHAPES[k].marks, xname: 'r' });
    const others = Object.keys(SHAPES).filter((k) => k !== key);
    if (back) {
      return {
        kind: 'er', title: L('Which charge?', 'Welche Ladung?'),
        text: L('<p>The graph shows the field strength E against the distance r from a charged object.</p>', '<p>Der Graph zeigt die Feldstärke E gegen den Abstand r von einem geladenen Körper.</p>'), figs: fig(gr(key)),
        questions: [choice('c', L('The charged object is', 'Der geladene Körper ist'), r.shuffle([key, ...others]).map((k) => ({ label: SHAPES[k].name(), ok: k === key, why: k === key ? '' : `${SHAPES[k].law()} ${S.law()}` })))],
        hints: [L('How does the field change with the distance: falling fast, falling slowly, not at all? Is there a region without a field?', 'Wie ändert sich das Feld mit dem Abstand: schnell abnehmend, langsam abnehmend, gar nicht? Gibt es ein Gebiet ohne Feld?')],
        solution: [S.law()], p: { key, back },
      };
    }
    return {
      kind: 'er', title: L('Field against distance', 'Feld gegen Abstand'),
      text: L(`<p>How does the field strength E depend on the distance r from ${S.name()}?</p>`, `<p>Wie hängt die Feldstärke E vom Abstand r von ${S.dat} ab?</p>`), figs: '',
      questions: [{ type: 'pick', key: 'g', label: L('Which graph is right?', 'Welcher Graph stimmt?'), options: r.shuffle([key, ...others]).map((k) => ({ html: gr(k, true), ok: k === key, tag: k, why: k === key ? '' : L(`That is the graph of ${SHAPES[k].name()}. ${S.law()}`, `Das ist der Graph für ${SHAPES[k].name()}. ${S.law()}`) })) }],
      hints: [L('Compare: point charge 1/r², wire 1/r, large plate constant, metal sphere zero inside.', 'Vergleiche: Punktladung 1/r², Draht 1/r, grosse Platte konstant, Metallkugel innen null.')],
      solution: [S.law()], p: { key, back },
    };
  }
  const FCONF = {
    point: { n: 2, name: () => L('a point charge', 'einer Punktladung'), law: 'E = k·Q/r²' },
    wire: { n: 1, name: () => L('a long charged wire', 'eines langen geladenen Drahts'), law: 'E = λ/(2π·ε₀·r)' },
    plate: { n: 0, name: () => L('a large charged plate', 'einer grossen geladenen Platte'), law: 'E = σ/(2ε₀)' },
  };
  function factor(seed) {
    const r = rng(seed * 67 + 37), key = r.pick(['point', 'point', 'wire', 'plate', 'cap']);
    const a = r.pick([2, 3, 0.5, 1]), b = r.pick([2, 3, 0.5]);
    let right, text, law, mist;
    if (key === 'cap') {
      const A = r.pick([2, 0.5]);
      right = a / A; law = 'E = Q/(ε₀·A)';
      text = L(`<p>The charge of a plate capacitor is changed by the factor ${a}, the area of its plates by ${A}, and the distance between them by ${b}. By what factor does the field between the plates change?</p>`, `<p>Die Ladung eines Plattenkondensators wird um den Faktor ${a} geändert, die Fläche seiner Platten um ${A} und ihr Abstand um ${b}. Um welchen Faktor ändert sich das Feld zwischen den Platten?</p>`);
      mist = [a / A / b, (a * A) / b, a / (A * b * b)];
    } else {
      const F = FCONF[key];
      right = a / b ** F.n; law = F.law;
      text = L(`<p>The charge of ${F.name()} is changed by the factor ${a}, and the point is moved to ${b} times the distance. By what factor does the field there change?</p>`, `<p>Die Ladung ${F.name()} wird um den Faktor ${a} geändert, und der Punkt wird auf den ${b}-fachen Abstand verschoben. Um welchen Faktor ändert sich das Feld dort?</p>`);
      mist = [a / b ** (F.n + 1), a / b ** Math.max(0, F.n - 1), a * b ** F.n, a];
    }
    const how = L(`${law}: the factor is ${frac(right)}.`, `${law}: Der Faktor ist ${frac(right)}.`);
    const out = [right, ...mist].filter((x, i, arr) => arr.findIndex((y) => Math.abs(y - x) < 1e-9) === i).slice(0, 4);
    for (const x of [2, 0.5, 4, 0.25, 1]) if (out.length < 4 && !out.some((y) => Math.abs(y - x) < 1e-9)) out.push(x);
    return {
      kind: 'factor', title: L('By what factor?', 'Um welchen Faktor?'), text, figs: '',
      questions: [choice('f', L('The field changes by', 'Das Feld ändert sich um'), out.sort((x, y) => x - y).map((x) => ({ label: frac(x), ok: Math.abs(x - right) < 1e-9, why: how })))],
      hints: [L('Point charge: E = k·Q/r². Wire: E = λ/(2π·ε₀·r). Large plate: E = σ/(2ε₀). Capacitor: E = Q/(ε₀·A).', 'Punktladung: E = k·Q/r². Draht: E = λ/(2π·ε₀·r). Grosse Platte: E = σ/(2ε₀). Kondensator: E = Q/(ε₀·A).')],
      solution: [how], p: { key, a, b },
    };
  }

  // ---------------------------------------------------------------- the capacitor
  function platesNum(seed) {
    const r = rng(seed * 71 + 41), A = r.pick([100, 170, 250, 400]) * 1e-4, Q = r.pick([0.1, 0.25, 0.5, 1]) * 1e-6, Ef = Q / (K.eps0 * A);
    const pt = particle(r, r.pick([1, -1]), { generic: false }), Fq = Math.abs(pt.z) * K.e * Ef;
    const how = L(`E = Q/(ε₀·A) = ${show(Q, 'charge')} / (8.85 · 10<sup>−12</sup> C²/(N·m²) · ${nice(A * 1e4)} cm²) = ${show(Ef, 'field')}.`, `E = Q/(ε₀·A) = ${show(Q, 'charge')} / (8.85 · 10<sup>−12</sup> C²/(N·m²) · ${nice(A * 1e4)} cm²) = ${show(Ef, 'field')}.`);
    const howF = L(`F = |q|·E = ${pt.z === 2 || pt.z === -2 ? '2e' : 'e'} · ${show(Ef, 'field')} = ${show(Fq, 'force')}.`, `F = |q|·E = ${pt.z === 2 || pt.z === -2 ? '2e' : 'e'} · ${show(Ef, 'field')} = ${show(Fq, 'force')}.`);
    const howD = L('E = Q/(ε₀·A) does not depend on the distance between the plates: the field stays the same.', 'E = Q/(ε₀·A) hängt nicht vom Plattenabstand ab: Das Feld bleibt gleich.');
    return {
      kind: 'cap', title: L('The plate capacitor', 'Der Plattenkondensator'),
      text: L(`<p>The plates of a capacitor each have an area of ${nice(A * 1e4)} cm² and carry the charges ±${show(Q, 'charge')}. Between them is ${pt.name()}.</p>`, `<p>Die Platten eines Kondensators haben je eine Fläche von ${nice(A * 1e4)} cm² und tragen die Ladungen ±${show(Q, 'charge')}. Zwischen ihnen befindet sich ${pt.name()}.</p>`),
      figs: '',
      questions: [
        choice('E', L('(a) the field between the plates', '(a) das Feld zwischen den Platten'), values(Ef, [{ value: Ef / 2, tag: 'half', why: L(`That is the field of one plate alone; between the plates both fields add. ${how}`, `Das ist das Feld einer Platte allein; zwischen den Platten addieren sich beide Felder. ${how}`) }, { value: (K.k * Q) / A, tag: 'coulomb', why: how }], 'field', how)),
        choice('F', L(`(b) the force on ${pt.name()}`, `(b) die Kraft auf ${pt.name().replace(/^ein /, '')}`), values(Fq, [{ value: K.e * Ef, tag: 'z', why: howF }], 'force', howF)),
        choice('d', L('(c) If the plates were pulled further apart (same charges), the field would', '(c) Würden die Platten weiter auseinandergezogen (gleiche Ladungen), würde das Feld'), words(r, [[L('stay the same', 'gleich bleiben'), true, ''], [L('get weaker', 'schwächer werden'), false, howD], [L('get stronger', 'stärker werden'), false, howD]])),
      ],
      hints: [L('Between the plates of a capacitor: E = Q/(ε₀·A) = σ/ε₀.', 'Zwischen den Platten eines Kondensators: E = Q/(ε₀·A) = σ/ε₀.'), L('F = |q|·E; e = 1.602 · 10⁻¹⁹ C.', 'F = |q|·E; e = 1.602 · 10⁻¹⁹ C.')],
      solution: [how, howF, howD], p: { A, Q, pt: pt.id },
    };
  }
  function millikan(seed) {
    const r = rng(seed * 73 + 43), m = r.pick([1.2, 1.8, 2.4, 3.0, 3.6]) * 1e-15, dmm = r.pick([4, 5, 6, 8]), n = r.int(1, 6), top = r.pick([1, -1]);
    const U = Number(((m * K.g * dmm * 1e-3) / (n * K.e)).toPrecision(3)), q = (m * K.g * dmm * 1e-3) / U, nn = Math.round(q / K.e), neg = top > 0;
    const how = L(`The drop hovers: q·E = m·g with E = U/d, so q = m·g·d/U = ${sci(m)} kg · 9.81 N/kg · ${dmm} mm / ${nice(U)} V = ${show(q, 'charge').replace('C', 'C')} (${sci(q)} C).`, `Der Tropfen schwebt: q·E = m·g mit E = U/d, also q = m·g·d/U = ${sci(m)} kg · 9.81 N/kg · ${dmm} mm / ${nice(U)} V = ${sci(q)} C.`);
    const howN = L(`q/e = ${sci(q)} C / 1.602 · 10<sup>−19</sup> C ≈ ${nn}.`, `q/e = ${sci(q)} C / 1.602 · 10<sup>−19</sup> C ≈ ${nn}.`);
    const howS = L(`The electric force must point up. The upper plate is ${top > 0 ? 'positive: the field points down, so the drop is negative' : 'negative: the field points up, so the drop is positive'}.`, `Die elektrische Kraft muss nach oben zeigen. Die obere Platte ist ${top > 0 ? 'positiv: Das Feld zeigt nach unten, also ist der Tropfen negativ' : 'negativ: Das Feld zeigt nach oben, also ist der Tropfen positiv'}.`);
    return {
      kind: 'cap', title: L("Millikan's oil drop", 'Millikans Öltröpfchen'),
      text: L(`<p>An oil drop with a mass of ${sci(m)} kg hovers between two horizontal plates ${dmm} mm apart when a voltage of ${nice(U)} V is applied; the upper plate is ${top > 0 ? 'positive' : 'negative'}.</p>`, `<p>Ein Öltröpfchen mit einer Masse von ${sci(m)} kg schwebt zwischen zwei waagrechten Platten im Abstand ${dmm} mm, wenn eine Spannung von ${nice(U)} V anliegt; die obere Platte ist ${top > 0 ? 'positiv' : 'negativ'}.</p>`),
      figs: fig(C.capFig({ top, q: neg ? -1 : 1, field: true, sym: '·' })),
      questions: [
        choice('q', L('(a) the size of the charge of the drop', '(a) der Betrag der Ladung des Tropfens'), values(q, [{ value: (m * K.g) / U, tag: 'noD', why: L(`The field is E = U/d. ${how}`, `Das Feld ist E = U/d. ${how}`) }], 'sci', how, { fmt: (v) => `${sci(v)} C` })),
        choice('n', L('(b) the number of elementary charges', '(b) die Zahl der Elementarladungen'), [nn - 1, nn, nn + 1, 2 * nn].filter((x, i, a) => x > 0 && a.indexOf(x) === i).map((x) => ({ label: String(x), ok: x === nn, why: howN }))),
        choice('s', L('(c) The drop is', '(c) Der Tropfen ist'), words(r, [[L('negative', 'negativ'), neg, howS], [L('positive', 'positiv'), !neg, howS]])),
      ],
      hints: [L('Hovering: the electric force q·E balances the weight m·g.', 'Schweben: Die elektrische Kraft q·E hält dem Gewicht m·g das Gleichgewicht.'), L('Between the plates: E = U/d.', 'Zwischen den Platten: E = U/d.'), L('The charge is a whole number of elementary charges e = 1.602 · 10⁻¹⁹ C.', 'Die Ladung ist ein ganzzahliges Vielfaches der Elementarladung e = 1.602 · 10⁻¹⁹ C.')],
      solution: [how, howN, howS], p: { m, dmm, n, top },
    };
  }

  // ---------------------------------------------------------------- dipoles
  function dipoleUniform(seed) {
    const r = rng(seed * 79 + 47), Ed = r.pick([[1, 0], [0, 1], [-1, 0], [0, -1]]), ang = r.pick([45, 90, 135, -45, -90, -135, 0, 180]);
    const a0 = Math.atan2(Ed[1], Ed[0]) + (ang * Math.PI) / 180, p = [Math.cos(a0), Math.sin(a0)], tz = p[0] * Ed[1] - p[1] * Ed[0];
    const turn = Math.abs(tz) < 1e-9 ? 'none' : tz > 0 ? 'acw' : 'cw', h = 0.7;
    const howF = L('The forces on the two ends are equal in size and opposite in direction: the net force in a uniform field is zero.', 'Die Kräfte auf die beiden Enden sind gleich gross und entgegengesetzt: Die Gesamtkraft in einem homogenen Feld ist null.');
    const howT = turn === 'none' ? (ang === 0 ? L('The dipole already points along the field: the two forces act along the rod and do not turn it.', 'Der Dipol zeigt schon in Feldrichtung: Die beiden Kräfte wirken längs des Stabs und drehen ihn nicht.') : L('The dipole points against the field: the forces act along the rod and do not turn it, but the slightest nudge turns it round (unstable).', 'Der Dipol zeigt gegen das Feld: Die Kräfte wirken längs des Stabs und drehen ihn nicht, aber der kleinste Stoss dreht ihn um (labil).'))
      : L(`The force on the + end points along the field, that on the − end against it: together they turn the dipole ${turn === 'acw' ? 'anticlockwise' : 'clockwise'}, until its + end points along the field.`, `Die Kraft auf das +-Ende zeigt in Feldrichtung, die auf das −-Ende entgegen: Zusammen drehen sie den Dipol ${turn === 'acw' ? 'im Gegenuhrzeigersinn' : 'im Uhrzeigersinn'}, bis sein +-Ende in Feldrichtung zeigt.`);
    return {
      kind: 'dipole', title: L('A dipole in a uniform field', 'Ein Dipol im homogenen Feld'),
      text: L(`<p>A dipole, a positive and a negative charge of the same size on a rod, is in a uniform field pointing ${dirName(Ed)}.</p>`, `<p>Ein Dipol, eine positive und eine negative Ladung gleichen Betrags an einem Stab, befindet sich in einem homogenen Feld, das ${dirName(Ed)} zeigt.</p>`),
      figs: fig(C.fig({ kind: 'uniform', E: Ed }, { box: BOX, lines: true, rods: [[-h * p[0], -h * p[1], h * p[0], h * p[1]]], parts: [{ x: h * p[0], y: h * p[1], q: 1 }, { x: -h * p[0], y: -h * p[1], q: -1 }], W: 320 })),
      questions: [
        choice('F', L('(a) The net force on the dipole', '(a) Die Gesamtkraft auf den Dipol'), words(r, [[L('is zero', 'ist null'), true, ''], [L('points along the field', 'zeigt in Feldrichtung'), false, howF], [L('points against the field', 'zeigt gegen das Feld'), false, howF]])),
        choice('T', L('(b) The dipole', '(b) Der Dipol'), words(r, [[L('turns clockwise', 'dreht sich im Uhrzeigersinn'), turn === 'cw', howT], [L('turns anticlockwise', 'dreht sich im Gegenuhrzeigersinn'), turn === 'acw', howT], [L('does not turn', 'dreht sich nicht'), turn === 'none', howT]])),
      ],
      hints: [L('Draw the force on each end: <span class="vec"><i>F</i></span> = q·<span class="vec"><i>E</i></span>.', 'Zeichne die Kraft auf jedes Ende: <span class="vec"><i>F</i></span> = q·<span class="vec"><i>E</i></span>.'), L('Equal and opposite forces that do not act along the same line make a torque.', 'Gleich grosse, entgegengesetzte Kräfte, die nicht auf derselben Geraden wirken, erzeugen ein Drehmoment.')],
      solution: [howF, howT], p: { E: dkey(Ed), ang },
    };
  }
  function dipolePoint(seed) {
    const r = rng(seed * 83 + 53), Q = r.pick([1, -1]), plusNear = r.next() < 0.5;
    const c = { kind: 'points', charges: [{ q: Q * 2, x: -1.8, y: 0 }] }, xn = 0.3, xf = 1.5;
    const near = plusNear ? 1 : -1, attract = near * Q < 0;
    const parts = [{ x: xn, y: 0, q: near }, { x: xf, y: 0, q: -near }];
    const how = L(`The end nearer the charge is in the stronger field. Its ${near > 0 ? 'positive' : 'negative'} end is nearer the ${Q > 0 ? 'positive' : 'negative'} charge, so the stronger force ${attract ? 'pulls it towards' : 'pushes it away from'} the charge.`, `Das Ende näher bei der Ladung ist im stärkeren Feld. Sein ${near > 0 ? 'positives' : 'negatives'} Ende ist näher bei der ${Q > 0 ? 'positiven' : 'negativen'} Ladung, also ${attract ? 'zieht' : 'stösst'} die stärkere Kraft ihn ${attract ? 'zur Ladung hin' : 'von der Ladung weg'}.`);
    const howFree = L('A dipole that can turn freely first turns its end of the opposite sign towards the charge; then it is attracted. That is why a charged rod attracts neutral scraps of paper.', 'Ein Dipol, der sich frei drehen kann, dreht zuerst sein Ende mit dem entgegengesetzten Vorzeichen zur Ladung; dann wird er angezogen. Darum zieht ein geladener Stab neutrale Papierschnipsel an.');
    return {
      kind: 'dipole', title: L('A dipole near a charge', 'Ein Dipol nahe einer Ladung'),
      text: L(`<p>A dipole is held near a ${Q > 0 ? 'positive' : 'negative'} point charge, along the line to it, its ${near > 0 ? 'positive' : 'negative'} end nearer.</p>`, `<p>Ein Dipol wird nahe einer ${Q > 0 ? 'positiven' : 'negativen'} Punktladung gehalten, längs der Geraden zu ihr, mit dem ${near > 0 ? 'positiven' : 'negativen'} Ende näher.</p>`),
      figs: fig(C.fig(c, { box: BOX, lines: true, lineOpts: { per: 6 }, labels: [label(Q * 2)], rods: [[xn, 0, xf, 0]], parts, W: 340 })),
      questions: [
        choice('F', L('(a) The net force on the dipole points', '(a) Die Gesamtkraft auf den Dipol zeigt'), words(r, [[L('towards the charge', 'zur Ladung hin'), attract, how], [L('away from the charge', 'von der Ladung weg'), !attract, how], [L('nowhere: it is zero', 'nirgends hin: Sie ist null'), false, L(`In a field that is not uniform, the forces on the two ends are not equal. ${how}`, `In einem nicht homogenen Feld sind die Kräfte auf die beiden Enden nicht gleich. ${how}`)]])),
        choice('free', L('(b) If the dipole could turn freely, it would in the end be', '(b) Könnte sich der Dipol frei drehen, würde er schliesslich'), words(r, [[L('attracted', 'angezogen'), true, ''], [L('repelled', 'abgestossen'), false, howFree], [L('neither', 'weder noch'), false, howFree]])),
      ],
      hints: [L('The field of a point charge gets weaker with the distance.', 'Das Feld einer Punktladung wird mit dem Abstand schwächer.'), L('Which end of the dipole feels the stronger force?', 'Welches Ende des Dipols spürt die stärkere Kraft?')],
      solution: [how, howFree], p: { Q, plusNear },
    };
  }

  // ---------------------------------------------------------------- a charge in a capacitor
  function deflectPath(seed) {
    const r = rng(seed * 89 + 59), q = r.pick([1, 1, -1, -1, 0]), pt = particle(r, q), top = r.pick([1, -1]);
    const down = q * top > 0 ? -1 : 1, f0 = 0.09; // a positive charge is pushed away from the positive plate
    const para = (s) => { const out = [[0, 0]]; for (let x = 0; x <= 1.0001; x += 0.02) out.push([x, x < f0 ? 0 : s * 0.85 * ((x - f0) / (1 - f0)) ** 2]); return out; };
    const arc = (s) => { const out = [[0, 0], [f0, 0]], R = 0.6; for (let ph = 0; ph <= Math.PI / 2; ph += 0.05) out.push([f0 + R * Math.sin(ph) * 0.7, s * R * (1 - Math.cos(ph)) * 1.4]); return out; };
    const straight = [[0, 0], [1, 0]];
    const opts = q ? [{ pts: para(down), ok: true }, { pts: para(-down), tag: 'sign' }, { pts: straight, tag: 'straight' }, { pts: arc(down), tag: 'circle' }]
      : [{ pts: straight, ok: true }, { pts: para(1), tag: 'bent' }, { pts: para(-1), tag: 'bent' }, { pts: arc(1), tag: 'bent' }];
    const how = q ? L(`The force q·E is the same everywhere between the plates: towards the ${down > 0 ? 'upper' : 'lower'} plate, which is ${q > 0 ? 'negative' : 'positive'}. Like a ball thrown horizontally, the charge moves on a parabola.`, `Die Kraft q·E ist zwischen den Platten überall gleich: zur ${down > 0 ? 'oberen' : 'unteren'} Platte, die ${q > 0 ? 'negativ' : 'positiv'} ist. Wie ein waagrecht geworfener Ball bewegt sich die Ladung auf einer Parabel.`)
      : L('A neutral particle feels no electric force: it flies straight on.', 'Ein neutrales Teilchen spürt keine elektrische Kraft: Es fliegt geradeaus.');
    const W = { sign: L('This one bends the wrong way: a positive charge is pushed towards the negative plate, a negative one towards the positive plate.', 'Diese biegt falsch ab: Eine positive Ladung wird zur negativen Platte gedrückt, eine negative zur positiven.'), straight: L('The charge feels a force between the plates.', 'Die Ladung spürt zwischen den Platten eine Kraft.'), circle: L('A circle needs a force that turns with the motion, as in a magnetic field; here the force always points the same way: a parabola.', 'Ein Kreis braucht eine Kraft, die sich mit der Bewegung dreht, wie in einem Magnetfeld; hier zeigt die Kraft immer in dieselbe Richtung: eine Parabel.'), bent: L('A neutral particle is not deflected.', 'Ein neutrales Teilchen wird nicht abgelenkt.') };
    return {
      kind: 'path', title: L('Into the capacitor', 'In den Kondensator'),
      text: L(`<p>${cap(pt.name())} flies horizontally into the field between two charged plates.</p>`, `<p>${cap(pt.name())} fliegt waagrecht in das Feld zwischen zwei geladenen Platten.</p>`),
      figs: fig(C.capFig({ top, q, sym: pt.sym, v: true, field: true })),
      questions: [{ type: 'pick', key: 'p', label: L('Which drawing shows its path?', 'Welche Zeichnung zeigt seine Bahn?'), options: r.shuffle(opts).map((o) => ({ html: C.capFig({ top, q, sym: pt.sym, pts: o.pts, small: true }), ok: !!o.ok, tag: o.tag, why: o.ok ? '' : `${W[o.tag]} ${how}` })) }],
      hints: [chargeOf(pt), RULE(), L('The force between the plates has the same size and direction everywhere.', 'Die Kraft zwischen den Platten hat überall denselben Betrag und dieselbe Richtung.')],
      solution: [how], solFig: fig(C.capFig({ top, q, sym: pt.sym, pts: q ? para(down) : straight })), p: { q, top, pt: pt.id },
    };
  }
  function deflectNum(seed) {
    const r = rng(seed * 97 + 61), pt = particle(r, r.pick([-1, -1, 1]), { generic: false });
    const heavy = pt.m > 1e-28, v = heavy ? r.pick([2, 3, 5]) * 1e5 : r.pick([1, 2, 3]) * 1e7, Lc = r.pick([4, 5, 6, 8]), d = r.pick([1, 1.5, 2]) * 1e-2;
    const qq = Math.abs(pt.z) * K.e, U = heavy ? r.pick([50, 100, 200]) : r.pick([20, 50, 100]), Ef = U / d, t = Lc * 1e-2 / v, y = (qq * Ef * t * t) / (2 * pt.m);
    const how = L(`It takes t = L/v = ${sci(t)} s to pass. Across, it accelerates with a = q·E/m = q·U/(m·d), so y = ½·a·t² = ${show(y, 'len')}.`, `Es braucht t = L/v = ${sci(t)} s für den Durchgang. Quer dazu wird es mit a = q·E/m = q·U/(m·d) beschleunigt, also y = ½·a·t² = ${show(y, 'len')}.`);
    const how2 = L('y = q·E·L²/(2·m·v²): twice as fast, a quarter of the deflection.', 'y = q·E·L²/(2·m·v²): doppelt so schnell, ein Viertel der Ablenkung.');
    return {
      kind: 'path', title: L('The deflection', 'Die Ablenkung'),
      text: L(`<p>${cap(pt.name())} flies at ${sci(v)} m/s into the field between two plates ${nice(Lc)} cm long and ${nice(d * 100)} cm apart, with a voltage of ${U} V between them.</p>`, `<p>${cap(pt.name())} fliegt mit ${sci(v)} m/s in das Feld zwischen zwei Platten, ${nice(Lc)} cm lang und ${nice(d * 100)} cm voneinander entfernt, mit einer Spannung von ${U} V dazwischen.</p>`),
      figs: '',
      questions: [
        choice('y', L('(a) how far it is deflected by the end of the plates', '(a) wie weit es bis zum Ende der Platten abgelenkt wird'), values(y, [{ value: 2 * y, tag: 'noHalf', why: L(`The distance at constant acceleration is ½·a·t². ${how}`, `Die Strecke bei konstanter Beschleunigung ist ½·a·t². ${how}`) }], 'len', how)),
        choice('k', L('(b) Twice as fast, the deflection would be', '(b) Doppelt so schnell wäre die Ablenkung'), [0.25, 0.5, 1, 2].map((x) => ({ label: frac(x), ok: x === 0.25, why: how2 }))),
      ],
      hints: [L('Along the plates the speed stays the same; across them the charge accelerates evenly.', 'Längs der Platten bleibt die Geschwindigkeit gleich; quer dazu wird die Ladung gleichmässig beschleunigt.'), L('E = U/d, a = q·E/m, t = L/v, y = ½·a·t².', 'E = U/d, a = q·E/m, t = L/v, y = ½·a·t².')],
      solution: [how, how2], p: { pt: pt.id, v, Lc, d, U },
    };
  }

  // ---------------------------------------------------------------- statements
  const BANK = [
    [() => L('The field at a point does not depend on the test charge placed there.', 'Das Feld in einem Punkt hängt nicht von der Probeladung ab, die man dort hinbringt.'), true, () => L('E = F/q: the force grows with the charge, the ratio stays.', 'E = F/q: Die Kraft wächst mit der Ladung, das Verhältnis bleibt.')],
    [() => L('The force on a negative charge points along the field.', 'Die Kraft auf eine negative Ladung zeigt in Feldrichtung.'), false, () => L('It points against the field.', 'Sie zeigt gegen das Feld.')],
    [() => L('Field lines can cross where two fields meet.', 'Feldlinien können sich kreuzen, wo zwei Felder aufeinandertreffen.'), false, () => L('The fields add up to one field with one direction at each point.', 'Die Felder addieren sich zu einem Feld mit einer Richtung in jedem Punkt.')],
    [() => L('Field lines start at positive charges and end at negative ones.', 'Feldlinien beginnen bei positiven Ladungen und enden bei negativen.'), true, () => L('Or they go on to infinity.', 'Oder sie gehen ins Unendliche.')],
    [() => L('Where the field lines are denser, the field is stronger.', 'Wo die Feldlinien dichter sind, ist das Feld stärker.'), true, () => L('The density of the lines shows the strength.', 'Die Dichte der Linien zeigt die Stärke.')],
    [() => L('A charge released at rest moves along a field line.', 'Eine in Ruhe losgelassene Ladung bewegt sich längs einer Feldlinie.'), false, () => L('Only in a uniform field or along a straight line; in general its path bends away from curved field lines.', 'Nur in einem homogenen Feld oder längs einer geraden Linie; im Allgemeinen weicht ihre Bahn von gekrümmten Feldlinien ab.')],
    [() => L('Inside a metal object in an electric field, the field is zero.', 'Im Innern eines Metallkörpers in einem elektrischen Feld ist das Feld null.'), true, () => L('The free charges move until the field inside vanishes.', 'Die freien Ladungen bewegen sich, bis das Feld im Innern verschwindet.')],
    [() => L('Field lines meet the surface of a conductor at right angles.', 'Feldlinien treffen senkrecht auf die Oberfläche eines Leiters.'), true, () => L('Otherwise charges would move along the surface.', 'Sonst würden sich Ladungen längs der Oberfläche bewegen.')],
    [() => L('The field of a point charge halves when the distance doubles.', 'Das Feld einer Punktladung halbiert sich, wenn sich der Abstand verdoppelt.'), false, () => L('E ∝ 1/r²: it falls to a quarter.', 'E ∝ 1/r²: Es fällt auf ein Viertel.')],
    [() => L('The field of a long charged wire halves when the distance doubles.', 'Das Feld eines langen geladenen Drahts halbiert sich, wenn sich der Abstand verdoppelt.'), true, () => L('E ∝ 1/r.', 'E ∝ 1/r.')],
    [() => L('The field of a large charged plate is the same at every distance from it.', 'Das Feld einer grossen geladenen Platte ist in jedem Abstand gleich.'), true, () => L('E = σ/(2ε₀), as long as the plate is large compared with the distance.', 'E = σ/(2ε₀), solange die Platte gross ist im Vergleich zum Abstand.')],
    [() => L('The field between the plates of a capacitor is strongest near the plates.', 'Das Feld zwischen den Platten eines Kondensators ist nahe bei den Platten am stärksten.'), false, () => L('It is uniform: the same everywhere between the plates.', 'Es ist homogen: überall zwischen den Platten gleich.')],
    [() => L('Pulling the plates of a charged capacitor apart (same charges) leaves the field between them unchanged.', 'Zieht man die Platten eines geladenen Kondensators auseinander (gleiche Ladungen), bleibt das Feld dazwischen gleich.'), true, () => L('E = Q/(ε₀·A) does not depend on the distance.', 'E = Q/(ε₀·A) hängt nicht vom Abstand ab.')],
    [() => L('Inside a charged metal sphere the field is strongest at the centre.', 'Im Innern einer geladenen Metallkugel ist das Feld im Mittelpunkt am stärksten.'), false, () => L('Inside there is no field at all.', 'Im Innern gibt es gar kein Feld.')],
    [() => L('Outside a charged metal sphere, the field is that of a point charge at its centre.', 'Ausserhalb einer geladenen Metallkugel ist das Feld das einer Punktladung im Mittelpunkt.'), true, () => L('E = k·Q/r² for r ≥ R.', 'E = k·Q/r² für r ≥ R.')],
    [() => L('Between two equal positive charges, the field is zero halfway between them.', 'Zwischen zwei gleichen positiven Ladungen ist das Feld in der Mitte null.'), true, () => L('The two fields there are equal and opposite.', 'Die beiden Felder sind dort gleich gross und entgegengesetzt.')],
    [() => L('Between a positive and a negative charge, the field can be zero.', 'Zwischen einer positiven und einer negativen Ladung kann das Feld null sein.'), false, () => L('Between them both fields point the same way, towards the negative charge.', 'Dazwischen zeigen beide Felder in dieselbe Richtung, zur negativen Ladung.')],
    [() => L('A dipole in a uniform field feels no net force.', 'Ein Dipol in einem homogenen Feld spürt keine Gesamtkraft.'), true, () => L('The forces on its ends are equal and opposite; there can be a torque.', 'Die Kräfte auf seine Enden sind gleich und entgegengesetzt; es kann ein Drehmoment geben.')],
    [() => L('A dipole in a uniform field cannot turn.', 'Ein Dipol in einem homogenen Feld kann sich nicht drehen.'), false, () => L('The two forces make a torque that turns its + end towards the field direction.', 'Die beiden Kräfte erzeugen ein Drehmoment, das sein +-Ende in Feldrichtung dreht.')],
    [() => L('A charged rod attracts neutral scraps of paper.', 'Ein geladener Stab zieht neutrale Papierschnipsel an.'), true, () => L('The charges in the paper shift (it becomes a dipole), and the nearer, opposite charge is attracted more strongly.', 'Die Ladungen im Papier verschieben sich (es wird ein Dipol), und die nähere, entgegengesetzte Ladung wird stärker angezogen.')],
    [() => L('A charge flying across a uniform field moves on a circle.', 'Eine Ladung, die quer durch ein homogenes Feld fliegt, bewegt sich auf einem Kreis.'), false, () => L('The force always points the same way: a parabola.', 'Die Kraft zeigt immer in dieselbe Richtung: eine Parabel.')],
    [() => L('In the same field, an electron is accelerated much more than a proton.', 'Im selben Feld wird ein Elektron viel stärker beschleunigt als ein Proton.'), true, () => L('Same size of force, about 1800 times less mass.', 'Gleich grosse Kraft, etwa 1800-mal weniger Masse.')],
    [() => L('The unit V/m is the same as N/C.', 'Die Einheit V/m ist dieselbe wie N/C.'), true, () => L('1 V/m = 1 J/(C·m) = 1 N/C.', '1 V/m = 1 J/(C·m) = 1 N/C.')],
    [() => L('The field of a point charge points towards the charge if the charge is positive.', 'Das Feld einer Punktladung zeigt zur Ladung hin, wenn die Ladung positiv ist.'), false, () => L('It points away from a positive charge.', 'Es zeigt von einer positiven Ladung weg.')],
    [() => L('Doubling the charge of a point charge doubles its field everywhere.', 'Verdoppelt man die Ladung einer Punktladung, verdoppelt sich ihr Feld überall.'), true, () => L('E = k·Q/r² ∝ Q.', 'E = k·Q/r² ∝ Q.')],
    [() => L('A neutral particle is accelerated by an electric field.', 'Ein neutrales Teilchen wird von einem elektrischen Feld beschleunigt.'), false, () => L('F = q·E = 0 (a neutral atom can be polarised, but in a uniform field it feels no net force).', 'F = q·E = 0 (ein neutrales Atom kann polarisiert werden, spürt aber im homogenen Feld keine Gesamtkraft).')],
    [() => L('In a Faraday cage, you are safe from the field outside.', 'In einem Faradaykäfig ist man vor dem äusseren Feld geschützt.'), true, () => L('The field inside a closed conductor is zero.', 'Das Feld im Innern eines geschlossenen Leiters ist null.')],
    [() => L('The field lines of a single positive charge are straight and point radially outwards.', 'Die Feldlinien einer einzelnen positiven Ladung sind gerade und zeigen radial nach aussen.'), true, () => L('By symmetry.', 'Aus Symmetriegründen.')],
    [() => L('In a drawing of field lines, a charge of +2q has twice as many lines as a charge of +q.', 'In einer Zeichnung der Feldlinien hat eine Ladung von +2q doppelt so viele Linien wie eine Ladung von +q.'), false, () => L('In space, the number of lines is proportional to the charge, but a drawing shows only the lines in one plane: of twice as many lines in space, only about √2 times as many lie in that plane.', 'Im Raum ist die Zahl der Linien proportional zur Ladung, aber eine Zeichnung zeigt nur die Linien in einer Ebene: Von doppelt so vielen Linien im Raum liegen nur etwa √2-mal so viele in dieser Ebene.')],
    [() => L("In Millikan's experiment, the charge of a drop can be any amount.", 'In Millikans Experiment kann die Ladung eines Tropfens jeden Wert haben.'), false, () => L('It is always a whole number of elementary charges.', 'Sie ist immer ein ganzzahliges Vielfaches der Elementarladung.')],
  ];
  function statements(seed) {
    const r = rng(seed * 101 + 67);
    for (;;) {
      const pick = r.shuffle(BANK.slice()).slice(0, 5);
      if (pick.every((s) => s[1]) || pick.every((s) => !s[1])) continue;
      return {
        kind: 'stmts', title: L('Which statements are correct?', 'Welche Aussagen sind richtig?'), text: L('<p>Tick all the statements that are correct.</p>', '<p>Kreuze alle richtigen Aussagen an.</p>'), figs: '',
        questions: [{ type: 'multi', key: 's', label: L('Which statements are correct?', 'Welche Aussagen sind richtig?'), statements: pick.map(([h, ok, why]) => ({ html: h(), ok, why: why() })) }],
        hints: [RULE(), LINES()], solution: pick.map(([h, ok, why]) => `${ok ? '✓' : '✗'} ${h()} ${why()}`), p: { s: pick.map((x) => BANK.indexOf(x)) },
      };
    }
  }

  const TYPES = {
    'force-dir': [1, forceDir], 'force-num': [2, forceNum], 'lines-pick': [2, linesPick], 'lines-read': [3, linesRead], conductor: [2, conductor],
    superpose: [3, superpose], zero: [3, zero], 'er-graph': [2, erGraph], factor: [2, factor], 'plates-num': [3, platesNum], millikan: [3, millikan],
    'dipole-uniform': [2, dipoleUniform], 'dipole-point': [4, dipolePoint], 'deflect-path': [2, deflectPath], 'deflect-num': [4, deflectNum], stmts: [2, statements],
  };
  function make(type, seed) {
    const [difficulty, f] = TYPES[type];
    return { ...f(seed), type, difficulty, id: `${type}-${seed}`, seed };
  }

  const api = { TYPES: Object.keys(TYPES), make, RULE, LINES, SHAPES, label, pts2, BOX, tile, frac };
  root.FieldEx = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
