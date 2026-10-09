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
//   factor                      E of a point charge, a wire, a plate, a capacitor: by what factor?
//   plates-compare, millikan    two capacitors compared (E = Q/(ε₀A) or U/d); two of Millikan's drops
//   dipole-uniform, dipole-point   a dipole in a uniform field (torque) and near a point charge
//   deflect-path, deflect-compare   a charge flying into a capacitor: its path; two deflections compared
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
  // two situations side by side: a table with a row for each quantity
  const cmpTable = (heads, rows) => `<table class="cmp"><thead><tr><th></th>${heads.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(([n, ...v]) => `<tr><th>${n}</th>${v.map((x) => `<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const times = (f, sym) => (Math.abs(f - 1) < 1e-9 ? it(sym) : f > 1 ? `${nice(f)}${it(sym)}` : `${it(sym)}/${nice(1 / f)}`);
  const whole = (x) => [x, 1 / x].some((y) => Math.abs(y - Math.round(y)) < 1e-9);
  const FILL = [2, 0.5, 4, 0.25, 1, 3, 1 / 3, 6, 1 / 6, 8, 1 / 8];
  // the right factor, the tempting ones (with their reasons), then fillers: four options in order
  function factors(right, tempt, how) {
    const out = [{ x: right, ok: true }];
    for (const [x, why] of tempt) if (out.length < 4 && whole(x) && !out.some((o) => Math.abs(o.x - x) < 1e-9)) out.push({ x, why: `${why} ${how}` });
    for (const x of FILL) if (out.length < 4 && !out.some((o) => Math.abs(o.x - x) < 1e-9)) out.push({ x, why: how });
    return out.sort((p, q) => p.x - q.x).map((o) => ({ label: frac(o.x), ok: !!o.ok, why: o.ok ? '' : o.why }));
  }
  function platesCompare(seed) {
    const r = rng(seed * 71 + 41), fixedQ = r.next() < 0.5;
    let f;
    for (;;) {
      f = { s: r.pick([1, 1, 2, 3, 0.5]), A: r.pick([1, 1, 2, 0.5]), d: r.pick([1, 1, 2, 3, 0.5]) };
      if (Object.values(f).filter((x) => x !== 1).length >= 2 && whole(fixedQ ? f.s / f.A : f.s / f.d)) break;
    }
    const kE = fixedQ ? f.s / f.A : f.s / f.d;
    const p1 = particle(r, r.pick([1, -1]), { generic: false });
    let p2; do p2 = particle(r, r.pick([1, 1, -1]), { generic: false }); while ((p2.id === p1.id && r.next() < 0.7) || !whole((kE * Math.abs(p2.z)) / Math.abs(p1.z)));
    const z1 = Math.abs(p1.z), z2 = Math.abs(p2.z), kF = (kE * z2) / z1, same = p1.q * p2.q > 0;
    const sym = fixedQ ? 'Q' : 'U';
    const how = fixedQ
      ? L(`The charge stays on the plates: E = Q/(ε₀·A) depends on the charge per area, not on the distance. Charge ${frac(f.s)}, area ${frac(f.A)}: the field changes by ${frac(kE)}.`, `Die Ladung bleibt auf den Platten: E = Q/(ε₀·A) hängt von der Ladung pro Fläche ab, nicht vom Abstand. Ladung ${frac(f.s)}, Fläche ${frac(f.A)}: Das Feld ändert sich um ${frac(kE)}.`)
      : L(`The source keeps the voltage: E = U/d depends on the voltage and the distance, not on the area. Voltage ${frac(f.s)}, distance ${frac(f.d)}: the field changes by ${frac(kE)}.`, `Die Quelle hält die Spannung: E = U/d hängt von der Spannung und vom Abstand ab, nicht von der Fläche. Spannung ${frac(f.s)}, Abstand ${frac(f.d)}: Das Feld ändert sich um ${frac(kE)}.`);
    const tempt = fixedQ
      ? [[f.s / (f.A * f.d), L('The distance does not matter while the charge stays.', 'Der Abstand spielt keine Rolle, solange die Ladung bleibt.')], [f.s, L('The charge spreads over the area: a larger area, a weaker field.', 'Die Ladung verteilt sich auf die Fläche: grössere Fläche, schwächeres Feld.')], [f.s * f.A, L('The field gets weaker when the area grows.', 'Das Feld wird schwächer, wenn die Fläche wächst.')], [(f.s * f.d) / f.A, L('The distance does not matter while the charge stays.', 'Der Abstand spielt keine Rolle, solange die Ladung bleibt.')]]
      : [[f.s, L('With the voltage fixed, a larger distance means a weaker field.', 'Bei fester Spannung bedeutet ein grösserer Abstand ein schwächeres Feld.')], [f.s / (f.d * f.A), L('The area does not matter: E = U/d.', 'Die Fläche spielt keine Rolle: E = U/d.')], [f.s * f.d, L('E = U/d: a larger distance gives a weaker field.', 'E = U/d: Ein grösserer Abstand ergibt ein schwächeres Feld.')]];
    const howF = L(`F = |q|·E: the field ${frac(kE)}, the charge ${z2 === z1 ? 'the same' : frac(z2 / z1)} (${z1}e and ${z2}e): the force changes by ${frac(kF)}. The mass does not matter for the force.`, `F = |q|·E: das Feld ${frac(kE)}, die Ladung ${z2 === z1 ? 'gleich' : frac(z2 / z1)} (${z1}e und ${z2}e): Die Kraft ändert sich um ${frac(kF)}. Die Masse spielt für die Kraft keine Rolle.`);
    const howS = L(`In both capacitors the field points down. ${cap(p1.name())} is ${signName(p1.q)}, ${p2.name()} is ${signName(p2.q)}: the forces point ${same ? 'the same way' : 'opposite ways'}.`, `In beiden Kondensatoren zeigt das Feld nach unten. ${cap(p1.name())} ist ${signName(p1.q)}, ${p2.name()} ist ${signName(p2.q)}: Die Kräfte zeigen ${same ? 'in dieselbe Richtung' : 'in entgegengesetzte Richtungen'}.`);
    const rows = [
      [fixedQ ? L('charge on the plates', 'Ladung auf den Platten') : L('voltage', 'Spannung'), it(sym), times(f.s, sym)],
      [L('area of each plate', 'Fläche jeder Platte'), it('A'), times(f.A, 'A')],
      [L('distance between the plates', 'Plattenabstand'), it('d'), times(f.d, 'd')],
      [L('particle between the plates', 'Teilchen zwischen den Platten'), `${p1.sym} (${p1.q > 0 ? '+' : '−'}${z1 > 1 ? z1 : ''}e)`, `${p2.sym} (${p2.q > 0 ? '+' : '−'}${z2 > 1 ? z2 : ''}e)`],
    ];
    return {
      kind: 'cap', title: L('Two capacitors', 'Zwei Kondensatoren'),
      text: L(`<p>Two plate capacitors 1 and 2 ${fixedQ ? 'are charged and then disconnected from the source, so the charges on their plates stay' : 'are connected to voltage sources'}. In both, the upper plate is positive. Between the plates of capacitor 1 is ${p1.name()}, between those of capacitor 2 ${p2.name()}.</p>`, `<p>Zwei Plattenkondensatoren 1 und 2 ${fixedQ ? 'werden geladen und dann von der Quelle getrennt, sodass die Ladungen auf ihren Platten bleiben' : 'sind an Spannungsquellen angeschlossen'}. Bei beiden ist die obere Platte positiv. Zwischen den Platten von Kondensator 1 befindet sich ${p1.name()}, zwischen denen von Kondensator 2 ${p2.name()}.</p>`)
        + cmpTable([L('capacitor 1', 'Kondensator 1'), L('capacitor 2', 'Kondensator 2')], rows),
      figs: '',
      questions: [
        choice('E', L('(a) Compared with capacitor 1, the field in capacitor 2 is', '(a) Verglichen mit Kondensator 1 ist das Feld in Kondensator 2'), factors(kE, tempt, how)),
        choice('F', L('(b) Compared with the force on the particle in capacitor 1, the force on the particle in capacitor 2 is', '(b) Verglichen mit der Kraft auf das Teilchen in Kondensator 1 ist die Kraft auf das Teilchen in Kondensator 2'), factors(kF, [[kE, L('The charges of the particles differ.', 'Die Ladungen der Teilchen sind verschieden.')], [(kE * z1) / z2, L('A larger charge feels a larger force.', 'Eine grössere Ladung spürt eine grössere Kraft.')]], howF)),
        choice('s', L('(c) The two forces point', '(c) Die beiden Kräfte zeigen'), words(r, [[L('the same way', 'in dieselbe Richtung'), same, howS], [L('opposite ways', 'in entgegengesetzte Richtungen'), !same, howS]])),
      ],
      hints: [fixedQ ? L('Disconnected, the charge stays: E = Q/(ε₀·A).', 'Getrennt bleibt die Ladung: E = Q/(ε₀·A).') : L('Connected, the voltage stays: E = U/d.', 'Angeschlossen bleibt die Spannung: E = U/d.'), L('F = |q|·E.', 'F = |q|·E.')],
      solution: [how, howF, howS], p: { fixedQ, f: [f.s, f.A, f.d].join(','), z1, z2, q1: p1.q, q2: p2.q },
    };
  }
  function millikan(seed) {
    const r = rng(seed * 73 + 43);
    let f, n1, n2;
    for (;;) {
      f = { m: r.pick([1, 1, 2, 3, 0.5]), U: r.pick([1, 2, 3, 0.5]), d: r.pick([1, 1, 2, 0.5]) };
      n1 = r.int(1, 4); n2 = (n1 * f.m * f.d) / f.U;
      if (Object.values(f).filter((x) => x !== 1).length >= 1 && whole(n2 / n1) && Number.isInteger(n2) && n2 >= 1 && n2 <= 12 && n2 !== n1 * f.m && (n2 !== n1 || r.next() < 0.4)) break;
    }
    const kq = n2 / n1, top1 = r.pick([1, -1]), top2 = r.pick([1, -1]), neg2 = top2 > 0;
    const parts = [];
    if (f.m !== 1) parts.push(L(`the mass ${frac(f.m)}`, `die Masse ${frac(f.m)}`));
    if (f.d !== 1) parts.push(L(`the distance ${frac(f.d)}`, `der Abstand ${frac(f.d)}`));
    if (f.U !== 1) parts.push(L(`the voltage ${frac(f.U)}, so ${frac(1 / f.U)}`, `die Spannung ${frac(f.U)}, also ${frac(1 / f.U)}`));
    const how = L(`The drop hovers: |q|·U/d = m·g, so |q| = m·g·d/U: ${parts.join('; ')}. Together: ${frac(kq)}.`, `Der Tropfen schwebt: |q|·U/d = m·g, also |q| = m·g·d/U: ${parts.join('; ')}. Zusammen: ${frac(kq)}.`);
    const howN = L(`Drop 1 carries ${n1} elementary charge${n1 > 1 ? 's' : ''}; ${frac(kq)} gives ${n2}.`, `Tropfen 1 trägt ${n1} Elementarladung${n1 > 1 ? 'en' : ''}; ${frac(kq)} ergibt ${n2}.`);
    const howS = L(`The electric force on drop 2 must point up. Its upper plate is ${top2 > 0 ? 'positive: the field points down, so the drop is negative' : 'negative: the field points up, so the drop is positive'}.`, `Die elektrische Kraft auf Tropfen 2 muss nach oben zeigen. Seine obere Platte ist ${top2 > 0 ? 'positiv: Das Feld zeigt nach unten, also ist der Tropfen negativ' : 'negativ: Das Feld zeigt nach oben, also ist der Tropfen positiv'}.`);
    const tempt = [[f.m * f.d * f.U, L('A higher voltage gives a stronger field: less charge is needed.', 'Eine höhere Spannung ergibt ein stärkeres Feld: Es braucht weniger Ladung.')], [f.m / (f.d * f.U), L('E = U/d: a larger distance weakens the field, so more charge is needed.', 'E = U/d: Ein grösserer Abstand schwächt das Feld, also braucht es mehr Ladung.')], [f.d / (f.m * f.U), L('A heavier drop needs a larger electric force.', 'Ein schwererer Tropfen braucht eine grössere elektrische Kraft.')], [1 / kq, L('Upside down.', 'Gerade umgekehrt.')]];
    const rows = [
      [L('mass of the drop', 'Masse des Tropfens'), it('m'), times(f.m, 'm')],
      [L('voltage', 'Spannung'), it('U'), times(f.U, 'U')],
      [L('distance between the plates', 'Plattenabstand'), it('d'), times(f.d, 'd')],
      [L('upper plate', 'obere Platte'), top1 > 0 ? '+' : '−', top2 > 0 ? '+' : '−'],
    ];
    return {
      kind: 'cap', title: L("Millikan's oil drops", 'Millikans Öltröpfchen'),
      text: L(`<p>Two oil drops 1 and 2 each hover between two horizontal plates. Drop 1 carries ${n1} elementary charge${n1 > 1 ? 's' : ''}. The table compares them.</p>`, `<p>Zwei Öltröpfchen 1 und 2 schweben je zwischen zwei waagrechten Platten. Tropfen 1 trägt ${n1} Elementarladung${n1 > 1 ? 'en' : ''}. Die Tabelle vergleicht sie.</p>`)
        + cmpTable([L('drop 1', 'Tropfen 1'), L('drop 2', 'Tropfen 2')], rows),
      figs: fig(C.capFig({ top: top1, q: top1 > 0 ? -1 : 1, field: true, sym: '·', label: L('Drop 1', 'Tropfen 1') })),
      questions: [
        choice('q', L('(a) Compared with drop 1, the charge of drop 2 (in size) is', '(a) Verglichen mit Tropfen 1 ist die Ladung von Tropfen 2 (dem Betrag nach)'), factors(kq, tempt, how)),
        choice('n', L('(b) the number of elementary charges on drop 2', '(b) die Zahl der Elementarladungen auf Tropfen 2'), [n2, n1 * f.m, n2 + 1, n2 > 1 ? n2 - 1 : 2 * n2 + 1, n1, n2 + 2, n2 + 3].filter((x, i, a) => Number.isInteger(x) && x > 0 && a.indexOf(x) === i).slice(0, 4).sort((x, y) => x - y).map((x) => ({ label: String(x), ok: x === n2, why: howN }))),
        choice('s', L('(c) Drop 2 is', '(c) Tropfen 2 ist'), words(r, [[L('negative', 'negativ'), neg2, howS], [L('positive', 'positiv'), !neg2, howS]])),
      ],
      hints: [L('Hovering: the electric force |q|·U/d balances the weight m·g.', 'Schweben: Die elektrische Kraft |q|·U/d hält dem Gewicht m·g das Gleichgewicht.'), L('|q| = m·g·d/U: find the factor of each quantity.', '|q| = m·g·d/U: Bestimme den Faktor jeder Grösse.')],
      solution: [how, howN, howS], p: { f: [f.m, f.U, f.d].join(','), n1, n2, top2 },
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
  // the deflection by the end of the plates: y = |q|·U·L²/(2·m·d·v²)
  const DPAIRS = [
    { a: ['p', ['a proton', 'ein Proton'], 'p', 1, 1], b: ['a', ['an alpha particle', 'ein Alphateilchen'], 'α', 2, 4] },
    { a: ['e', ['an electron', 'ein Elektron'], 'e⁻', -1, 1], b: ['e+', ['a positron', 'ein Positron'], 'e⁺', 1, 1] },
    { a: ['p', ['a proton', 'ein Proton'], 'p', 1, 1], b: ['d', ['a deuteron (a proton and a neutron)', 'ein Deuteron (ein Proton und ein Neutron)'], 'd', 1, 2] },
  ];
  function deflectCompare(seed) {
    const r = rng(seed * 97 + 61);
    let pa, pb, f, flip, ky;
    for (;;) {
      const pair = r.pick(DPAIRS), change = r.next() < 0.45;
      pa = pair.a; pb = change ? pair.b : pair.a;
      if (r.next() < 0.5 && change) [pa, pb] = [pb, pa];
      f = { v: r.pick([1, 1, 2, 3, 0.5]), U: r.pick([1, 1, 2, 3, 0.5]), L: r.pick([1, 1, 1, 2, 0.5]), d: r.pick([1, 1, 1, 2, 0.5]) };
      flip = r.next() < 0.25;
      const zr = Math.abs(pb[3] / pa[3]), mr = pb[4] / pa[4];
      ky = (zr / mr) * f.U * f.L ** 2 / (f.d * f.v ** 2);
      const n = Object.values(f).filter((x) => x !== 1).length + (pa !== pb ? 1 : 0);
      if (n >= 2 && n <= 3 && whole(ky) && ky <= 16 && ky >= 1 / 16) break;
    }
    const zr = Math.abs(pb[3] / pa[3]), mr = pb[4] / pa[4], kt = f.L / f.v, nm = (x) => L(...x[1]);
    const sideA = Math.sign(pa[3]), sideB = Math.sign(pb[3]) * (flip ? -1 : 1), same = sideA === sideB;
    const parts = [];
    if (zr !== 1) parts.push(L(`the charge ${frac(zr)}`, `die Ladung ${frac(zr)}`));
    if (mr !== 1) parts.push(L(`the mass ${frac(mr)}, so ${frac(1 / mr)}`, `die Masse ${frac(mr)}, also ${frac(1 / mr)}`));
    if (f.U !== 1) parts.push(L(`the voltage ${frac(f.U)}`, `die Spannung ${frac(f.U)}`));
    if (f.L !== 1) parts.push(L(`the length ${frac(f.L)}, squared ${frac(f.L ** 2)}`, `die Länge ${frac(f.L)}, quadriert ${frac(f.L ** 2)}`));
    if (f.d !== 1) parts.push(L(`the distance ${frac(f.d)}, so ${frac(1 / f.d)}`, `der Abstand ${frac(f.d)}, also ${frac(1 / f.d)}`));
    if (f.v !== 1) parts.push(L(`the speed ${frac(f.v)}, squared in the denominator: ${frac(1 / f.v ** 2)}`, `die Geschwindigkeit ${frac(f.v)}, quadriert im Nenner: ${frac(1 / f.v ** 2)}`));
    const how = L(`y = |q|·U·L²/(2·m·d·v²): ${parts.join('; ')}. Together: ${frac(ky)}.`, `y = |q|·U·L²/(2·m·d·v²): ${parts.join('; ')}. Zusammen: ${frac(ky)}.`);
    const base = (zr / mr) * f.U / f.d;
    const tempt = [
      [base * f.L ** 2 / f.v, L('The time between the plates, L/v, is squared: the speed counts squared.', 'Die Zeit zwischen den Platten, L/v, wird quadriert: Die Geschwindigkeit zählt quadratisch.')],
      [base * f.L / f.v ** 2, L('The length of the plates counts squared, like the time.', 'Die Länge der Platten zählt quadratisch, wie die Zeit.')],
      [zr * f.U * f.L ** 2 / (f.d * f.v ** 2), L('A heavier particle is accelerated less: divide by the mass.', 'Ein schwereres Teilchen wird weniger beschleunigt: durch die Masse teilen.')],
      [(zr / mr) * f.U * f.L ** 2 * f.d / f.v ** 2, L('E = U/d: a larger distance means a weaker field.', 'E = U/d: Ein grösserer Abstand bedeutet ein schwächeres Feld.')],
      [1 / ky, L('Upside down.', 'Gerade umgekehrt.')],
    ];
    const howT = L(`Along the plates the speed stays the same: t = L/v, the length ${frac(f.L)}, the speed ${frac(f.v)}: ${frac(kt)}.`, `Längs der Platten bleibt die Geschwindigkeit gleich: t = L/v, die Länge ${frac(f.L)}, die Geschwindigkeit ${frac(f.v)}: ${frac(kt)}.`);
    const sideTxt = (x, q, fl) => `${cap(x)} ${q > 0 ? L('is positive', 'ist positiv') : L('is negative', 'ist negativ')}${fl ? L(', and the plates are swapped', ', und die Platten sind vertauscht') : ''}`;
    const howS = L(`${sideTxt(nm(pa), pa[3], false)}: it is pushed towards the ${sideA > 0 ? 'lower' : 'upper'} plate. ${sideTxt(nm(pb), pb[3], flip)}: towards the ${sideB > 0 ? 'lower' : 'upper'} plate.`, `${sideTxt(nm(pa), pa[3], false)}: Es wird zur ${sideA > 0 ? 'unteren' : 'oberen'} Platte gedrückt. ${sideTxt(nm(pb), pb[3], flip)}: zur ${sideB > 0 ? 'unteren' : 'oberen'} Platte.`);
    const howS2 = pa === pb && !flip ? L('The same particle and the same plates: the same side.', 'Dasselbe Teilchen und dieselben Platten: dieselbe Seite.') : howS;
    const row = (n, sym, k) => [n, it(sym), times(k, sym)];
    const pcell = (x) => `${nm(x).replace(/ \(.*\)$/, '').replace(/^(an?|ein) /, '')} (${x[3] > 0 ? '+' : '−'}${Math.abs(x[3]) > 1 ? Math.abs(x[3]) : ''}e)`;
    const rows = [
      [L('particle', 'Teilchen'), pcell(pa), pcell(pb)],
      row(L('speed', 'Geschwindigkeit'), 'v', f.v), row(L('voltage', 'Spannung'), 'U', f.U), row(L('length of the plates', 'Länge der Platten'), 'L', f.L), row(L('distance between the plates', 'Plattenabstand'), 'd', f.d),
      [L('upper plate', 'obere Platte'), '+', flip ? '−' : '+'],
    ];
    const masses = pa === pb ? '' : pa[0] === 'e' || pa[0] === 'e+' ? L(' An electron and a positron have the same mass.', ' Ein Elektron und ein Positron haben dieselbe Masse.') : L(` Masses: ${nm(pa).replace(/ \(.*\)$/, '')} about ${pa[4]} u, ${nm(pb).replace(/ \(.*\)$/, '')} about ${pb[4]} u.`, ` Massen: ${nm(pa).replace(/ \(.*\)$/, '')} etwa ${pa[4]} u, ${nm(pb).replace(/ \(.*\)$/, '')} etwa ${pb[4]} u.`);
    return {
      kind: 'path', title: L('Two deflections', 'Zwei Ablenkungen'),
      text: L(`<p>In two experiments A and B, a charged particle flies horizontally into the field between two plates. The table compares them.${masses}</p>`, `<p>In zwei Versuchen A und B fliegt ein geladenes Teilchen waagrecht in das Feld zwischen zwei Platten. Die Tabelle vergleicht sie.${masses}</p>`) + cmpTable(['A', 'B'], rows),
      figs: fig(C.capFig({ top: 1, q: Math.sign(pa[3]), sym: pa[2], v: true, field: true, label: L('Experiment A', 'Versuch A') })),
      questions: [
        choice('y', L('(a) Compared with A, the deflection by the end of the plates in B is', '(a) Verglichen mit A ist die Ablenkung bis zum Ende der Platten in B'), factors(ky, tempt, how)),
        choice('t', L('(b) Compared with A, the time the particle takes to pass the plates in B is', '(b) Verglichen mit A ist die Zeit, die das Teilchen in B für den Weg zwischen den Platten braucht,'), factors(kt, [[f.v / f.L, L('t = L/v: faster means less time.', 't = L/v: schneller bedeutet weniger Zeit.')], [f.L / f.v ** 2, L('The speed counts once here, not squared.', 'Die Geschwindigkeit zählt hier einfach, nicht quadratisch.')]], howT)),
        choice('s', L('(c) Compared with A, the particle in B is deflected', '(c) Verglichen mit A wird das Teilchen in B abgelenkt'), words(r, [[L('to the same side', 'zur selben Seite'), same, howS2], [L('to the other side', 'zur anderen Seite'), !same, howS2]])),
      ],
      hints: [L('Along the plates the speed stays the same: t = L/v. Across them the particle accelerates evenly: a = |q|·E/m with E = U/d.', 'Längs der Platten bleibt die Geschwindigkeit gleich: t = L/v. Quer dazu wird das Teilchen gleichmässig beschleunigt: a = |q|·E/m mit E = U/d.'), L('y = ½·a·t² = |q|·U·L²/(2·m·d·v²): find the factor of each quantity.', 'y = ½·a·t² = |q|·U·L²/(2·m·d·v²): Bestimme den Faktor jeder Grösse.')],
      solution: [how, howT, howS2], p: { a: pa[0], b: pb[0], f: [f.v, f.U, f.L, f.d].join(','), flip },
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
    superpose: [3, superpose], zero: [3, zero], factor: [2, factor], 'plates-compare': [3, platesCompare], millikan: [3, millikan],
    'dipole-uniform': [2, dipoleUniform], 'dipole-point': [4, dipolePoint], 'deflect-path': [2, deflectPath], 'deflect-compare': [3, deflectCompare], stmts: [2, statements],
  };
  function make(type, seed) {
    const [difficulty, f] = TYPES[type];
    return { ...f(seed), type, difficulty, id: `${type}-${seed}`, seed };
  }

  const api = { TYPES: Object.keys(TYPES), make, RULE, LINES, label, pts2, BOX, tile, frac };
  root.FieldEx = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
