// The exercises, with their texts, in the current language (the app rebuilds them when the
// language changes). Every exercise has the form
//   { id, type, kind, difficulty, title, text, figs (HTML), questions, hints, solution (HTML
//     paragraphs), solFig, p (what makes it new to the student) }
// with questions of four kinds:
//   { type: 'tiles', key, label, multi, options: [{ html, ok, why, tag }] }   directions or names to
//        choose: one (multi false), or all that fit (multi true: more than one may be right)
//   { type: 'pick', key, label, options: [{ html, ok, why, tag }] }           one of four drawings
//   { type: 'choice', key, label, options: [{ label, ok, why, tag }] }        one of a few values
//   { type: 'multi', key, label, statements: [{ html, ok, why }] }            statements to tick
// The types:
//   dir-current, dir-particle      the direction of the force (right hand for positive charges,
//                                  left hand for negative ones)
//   dir-missing                    the missing field or velocity: all directions that fit
//   pair-parallel, pair-angle, pair-particles   the field of the first current (or charge) at the
//                                  second, then the force on the second
//   path-circle, path-helix, path-gradient      the path of a charge in a field
//   radius-num, radius-compare, tracks          radius and period; tracks in a bubble chamber
//   selector                       the velocity selector
//   stmts                          which statements are correct?
(function (root) {
  'use strict';

  const M = root.Magnet || require('./generator.js');
  const P = root.MagPlot || require('./plot.js');
  const Lang = root.Lang || require('./lang.js');
  const L = (en, de) => Lang.L(en, de);
  const { rng, AXES, CANDS, cross, same, key, force, wireField, chargeField, fitting, path, PARTICLES } = M;
  const { icon, scene, pathFig, tracksFig } = P;

  // ---------------------------------------------------------------- words
  const DIR = {
    '1,0,0': ['to the right', 'nach rechts'], '-1,0,0': ['to the left', 'nach links'], '0,1,0': ['upwards', 'nach oben'], '0,-1,0': ['downwards', 'nach unten'],
    '0,0,1': ['out of the page', 'aus der Seite heraus'], '0,0,-1': ['into the page', 'in die Seite hinein'],
    '1,1,0': ['up and to the right', 'nach rechts oben'], '-1,1,0': ['up and to the left', 'nach links oben'], '-1,-1,0': ['down and to the left', 'nach links unten'], '1,-1,0': ['down and to the right', 'nach rechts unten'],
  };
  const dirName = (d) => (d ? L(...DIR[key(d)]) : L('no force', 'keine Kraft'));
  const it = (s) => `<i>${s}</i>`;
  // a vector: the letter with an arrow above (style.css)
  const vec = (s) => `<span class="vec"><i>${s}</i></span>`;
  const LAW = () => `${vec('F')} = <i>q</i> · ${vec('v')} × ${vec('B')}`;
  const vName = (kind) => (kind === 'I' ? L(`the current ${it('I')}`, `der Strom ${it('I')}`) : L(`the velocity ${it('v')}`, `die Geschwindigkeit ${it('v')}`));
  const signName = (q) => (q > 0 ? L('positive', 'positiv') : q < 0 ? L('negative', 'negativ') : L('neutral', 'neutral'));
  const cap = (x) => x.charAt(0).toUpperCase() + x.slice(1);
  // The particle of an exercise: often a named one, drawn with its symbol in a neutral colour, so
  // that its sign is for the student to know; else "a positive particle", drawn with its sign.
  const NAMED = {
    1: [['p', ['a proton', 'ein Proton'], 'p'], ['e+', ['a positron', 'ein Positron'], 'e⁺'], ['a', ['an alpha particle', 'ein Alphateilchen'], 'α'], ['na', ['a sodium ion (Na⁺)', 'ein Natrium-Ion (Na⁺)'], 'Na⁺']],
    '-1': [['e', ['an electron', 'ein Elektron'], 'e⁻'], ['cl', ['a chloride ion (Cl⁻)', 'ein Chlorid-Ion (Cl⁻)'], 'Cl⁻']],
    // neutral: a neutron, or an atom (the sodium atom next to the sodium ion above)
    0: [['n', ['a neutron', 'ein Neutron'], 'n'], ['he', ['a helium atom', 'ein Heliumatom'], 'He'], ['h', ['a hydrogen atom', 'ein Wasserstoffatom'], 'H'],
      ['naa', ['a sodium atom (Na)', 'ein Natriumatom (Na)'], 'Na'], ['ne', ['a neon atom', 'ein Neonatom'], 'Ne']],
  };
  function particle(r, q) {
    if (r.next() < 0.35) return { q, id: 'q', sym: null, name: () => L(`a ${signName(q)} particle`, `ein ${q > 0 ? 'positives' : q < 0 ? 'negatives' : 'neutrales'} Teilchen`) };
    const [id, names, sym] = r.pick(NAMED[q]);
    return { q, id, sym, name: () => L(...names) };
  }
  const chargeOf = (pt) => (pt.sym
    ? L(`${cap(pt.name())} ${pt.q > 0 ? 'is positively charged' : pt.q < 0 ? 'is negatively charged' : 'has no charge'}.`, `${cap(pt.name())} ist ${pt.q > 0 ? 'positiv geladen' : pt.q < 0 ? 'negativ geladen' : 'ungeladen'}.`)
    : L(`The particle is ${signName(pt.q)}.`, `Das Teilchen ist ${signName(pt.q)}.`));
  const drawn = (pt, at, name) => ({ kind: 'particle', q: pt.q, at, sym: pt.sym, name });
  const hand = (q) => (q > 0 ? L('Right hand (positive charge)', 'Rechte Hand (positive Ladung)') : L('Left hand (negative charge)', 'Linke Hand (negative Ladung)'));
  const tile = (d, extra = '') => `<span class="dtile">${icon(d)}<span>${d ? dirName(d) : extra || L('no force', 'keine Kraft')}</span></span>`;
  const RULE = () => L('For a positive charge (or a current) use the right hand: thumb along the velocity (or the current), index finger along the field, then the middle finger shows the force. For a negative charge use the left hand in the same way.',
    'Für eine positive Ladung (oder einen Strom) nimm die rechte Hand: Daumen in Richtung der Geschwindigkeit (oder des Stroms), Zeigefinger in Richtung des Feldes, dann zeigt der Mittelfinger die Kraft. Für eine negative Ladung nimm die linke Hand auf dieselbe Weise.');
  const PERP = () => L('The magnetic force is always perpendicular both to the velocity (or the current) and to the field. There is no force on a charge at rest, on a neutral particle, or on a charge moving along the field.',
    'Die magnetische Kraft steht immer senkrecht zur Geschwindigkeit (oder zum Strom) und zum Feld. Es gibt keine Kraft auf eine ruhende Ladung, auf ein neutrales Teilchen oder auf eine Ladung, die sich längs des Feldes bewegt.');
  const GRIP = () => L('The field of a straight current circles around it: grip the wire with your right hand, thumb along the current; your fingers curl in the direction of the field.',
    'Das Feld eines geraden Stroms umkreist ihn: Umfasse den Draht mit der rechten Hand, Daumen in Stromrichtung; die gekrümmten Finger zeigen die Richtung des Feldes.');

  // How the force follows (the hand rule, or why there is none).
  function howForce(q, kind, v, B) {
    if (!q) return L('The particle is neutral: the magnetic field exerts no force on it.', 'Das Teilchen ist neutral: Das Magnetfeld übt keine Kraft auf es aus.');
    const F = force(q, v, B);
    if (!F) return L(`${kind === 'I' ? 'The current' : 'The velocity'} is parallel to the field: there is no magnetic force.`, `${kind === 'I' ? 'Der Strom' : 'Die Geschwindigkeit'} ist parallel zum Feld: Es gibt keine magnetische Kraft.`);
    return L(`${hand(q)}: thumb along ${vName(kind)} (${dirName(v)}), index finger along the field (${dirName(B)}): the middle finger points ${dirName(F)}.`,
      `${hand(q)}: Daumen in Richtung ${kind === 'I' ? 'des Stroms' : 'der Geschwindigkeit'} (${dirName(v)}), Zeigefinger in Richtung des Feldes (${dirName(B)}): Der Mittelfinger zeigt ${dirName(F)}.`);
  }
  const WHYF = {
    hand: () => L('That is the direction for the other sign of the charge: mind which hand to use.', 'Das ist die Richtung für das andere Vorzeichen der Ladung: Achte darauf, welche Hand du nimmst.'),
    alongV: () => L('The magnetic force is perpendicular to the motion, not along it.', 'Die magnetische Kraft steht senkrecht zur Bewegung, nicht in ihrer Richtung.'),
    alongB: () => L('The magnetic force is perpendicular to the field, not along the field lines.', 'Die magnetische Kraft steht senkrecht zum Feld, nicht längs der Feldlinien.'),
    none: () => L('There is a force: the charge moves across the field.', 'Es gibt eine Kraft: Die Ladung bewegt sich quer zum Feld.'),
    some: () => L('There is no force here.', 'Hier gibt es keine Kraft.'),
  };

  // Four options for a force (or field): the right one, then tempting wrong ones.
  function forceOptions(r, right, tempt, how, extraNone = L('no force', 'keine Kraft')) {
    const out = [{ d: right, ok: true }], has = (d) => out.some((o) => key(o.d) === key(d));
    for (const [d, tag] of tempt) if (out.length < 4 && !has(d)) out.push({ d, ok: false, tag });
    for (const d of r.shuffle([...AXES, null])) if (out.length < 4 && !has(d)) out.push({ d, ok: false, tag: d ? 'other' : 'none' });
    return r.shuffle(out).map((o) => ({ html: tile(o.d, extraNone), ok: o.ok, tag: o.tag, why: o.ok ? '' : `${o.tag && WHYF[o.tag] ? WHYF[o.tag]() + ' ' : ''}${how}` }));
  }
  const neg = (d) => d && d.map((x) => (x === 0 ? 0 : -x));
  const tiles = (key2, label, options, multi = false) => ({ type: 'tiles', key: key2, label, multi, options });
  const choice = (key2, label, options) => ({ type: 'choice', key: key2, label, options });

  // ---------------------------------------------------------------- the direction of the force
  function dirForce(kind, seed) {
    const r = rng(seed * 31 + 7);
    for (;;) {
      const q = kind === 'I' ? 1 : r.pick([1, 1, -1, -1, 0]), v = r.pick(AXES), B = r.pick(AXES), pt = particle(r, q);
      if (kind === 'I' && same(v, B)) continue; // a current along the field: rare, but it comes up in the statements
      const F = force(q, v, B), none = !F;
      if (none && r.next() < 0.6) continue; // mostly a force
      const how = howForce(q, kind, v, B);
      const tempt = none ? [[v, 'some'], [B, 'some']] : [[neg(F), 'hand'], [v, 'alongV'], [B, 'alongB'], [null, 'none']];
      const items = [kind === 'I' ? { kind: 'piece', d: v, at: [0, 0], name: '<tspan class="it">I</tspan>' } : drawn(pt, [0, 0])];
      const fig = scene({ field: { dir: B }, items, vecs: [{ of: 0, kind: kind === 'I' ? 'I' : 'v', dir: v }, { of: 0, kind: 'F', unknown: true }] });
      const text = kind === 'I'
        ? L(`<p>A piece of wire carries a current ${it('I')} (${dirName(v)}) in a magnetic field (${dirName(B)}).</p>`, `<p>Ein Drahtstück führt einen Strom ${it('I')} (${dirName(v)}) in einem Magnetfeld (${dirName(B)}).</p>`)
        : L(`<p>${cap(pt.name())} moves ${dirName(v)} through a magnetic field that points ${dirName(B)}.</p>`, `<p>${cap(pt.name())} bewegt sich ${dirName(v)} durch ein Magnetfeld, das ${dirName(B)} zeigt.</p>`);
      return {
        kind: 'dir', title: L('The direction of the force', 'Die Richtung der Kraft'), text, figs: `<div class="fig">${fig}</div>`,
        questions: [tiles('F', L('In which direction does the magnetic force point?', 'In welche Richtung zeigt die magnetische Kraft?'), forceOptions(r, F, tempt, how))],
        hints: [PERP(), RULE(), kind === 'I' ? L('A current counts as positive charges moving along it.', 'Ein Strom zählt als positive Ladungen, die sich in Stromrichtung bewegen.') : chargeOf(pt)],
        solution: [how], p: { q, v: key(v), B: key(B), pt: pt.id },
      };
    }
  }

  // ---------------------------------------------------------------- the missing field or velocity
  function dirMissing(seed) {
    const r = rng(seed * 37 + 11);
    for (;;) {
      const q = r.pick([1, -1]), missing = r.pick(['B', 'v']), a = r.pick(AXES), c = r.pick(CANDS), pt = particle(r, q);
      const F = missing === 'B' ? force(q, a, c) : force(q, c, a);
      if (!F || !AXES.some((x) => same(x, F))) continue;
      const fit = fitting(missing, q, a, F), wrong = CANDS.filter((d) => !fit.some((f) => same(f, d)));
      const k = Math.min(fit.length, r.pick([1, 2, 2, 3])), opts = [...r.shuffle(fit.slice()).slice(0, k), ...r.shuffle(wrong.slice()).slice(0, 4 - k)];
      const what = missing === 'B' ? L('the field', 'das Feld') : L('the velocity', 'die Geschwindigkeit');
      const options = opts.map((d) => {
        const Fd = missing === 'B' ? force(q, a, d) : force(q, d, a), ok = fit.some((f) => same(f, d));
        const why = ok ? L(`With ${what} ${dirName(d)}, the force points ${dirName(F)} too.`, `Mit ${missing === 'B' ? 'dem Feld' : 'der Geschwindigkeit'} ${dirName(d)} zeigt die Kraft ebenfalls ${dirName(F)}.`)
          : Fd ? L(`With ${what} ${dirName(d)}, the force would point ${dirName(Fd)}.`, `Mit ${missing === 'B' ? 'dem Feld' : 'der Geschwindigkeit'} ${dirName(d)} würde die Kraft ${dirName(Fd)} zeigen.`)
            : L(`With ${what} ${dirName(d)}, ${missing === 'B' ? 'the field would be parallel to the velocity' : 'the velocity would be parallel to the field'}: no force.`, `Mit ${missing === 'B' ? 'dem Feld' : 'der Geschwindigkeit'} ${dirName(d)} wäre ${missing === 'B' ? 'das Feld parallel zur Geschwindigkeit' : 'die Geschwindigkeit parallel zum Feld'}: keine Kraft.`);
        return { html: tile(d), ok, why };
      });
      const v = missing === 'B' ? a : null, B = missing === 'B' ? null : a;
      const fig = scene({ field: { dir: B }, items: [drawn(pt, [0, 0])], vecs: [missing === 'B' ? { of: 0, kind: 'v', dir: v } : { of: 0, kind: 'v', unknown: true }, { of: 0, kind: 'F', dir: F }, ...(missing === 'B' ? [{ of: 0, kind: 'B', unknown: true }] : [])] });
      const several = fit.length > 1;
      const text = missing === 'B'
        ? L(`<p>${cap(pt.name())} moves ${dirName(v)}. The magnetic force on it points ${dirName(F)}.</p>`, `<p>${cap(pt.name())} bewegt sich ${dirName(v)}. Die magnetische Kraft auf es zeigt ${dirName(F)}.</p>`)
        : L(`<p>${cap(pt.name())} is in a magnetic field that points ${dirName(B)}. The magnetic force on it points ${dirName(F)}.</p>`, `<p>${cap(pt.name())} befindet sich in einem Magnetfeld, das ${dirName(B)} zeigt. Die magnetische Kraft auf es zeigt ${dirName(F)}.</p>`);
      const sol = several
        ? L(`Only the part of ${what} perpendicular to the ${missing === 'B' ? 'velocity' : 'field'} matters for the force; a part along it adds nothing. So several directions fit: all those whose perpendicular part gives the force ${dirName(F)} with the ${q > 0 ? 'right' : 'left'} hand: ${fit.map(dirName).join(', ')}.`,
          `Für die Kraft zählt nur der Teil ${missing === 'B' ? 'des Feldes senkrecht zur Geschwindigkeit' : 'der Geschwindigkeit senkrecht zum Feld'}; ein Teil längs dazu trägt nichts bei. Also passen mehrere Richtungen: alle, deren senkrechter Teil mit der ${q > 0 ? 'rechten' : 'linken'} Hand die Kraft ${dirName(F)} ergibt: ${fit.map(dirName).join(', ')}.`)
        : L(`Only one of the directions here fits: ${dirName(fit[0])}. Check it with the ${q > 0 ? 'right' : 'left'} hand.`, `Nur eine der Richtungen hier passt: ${dirName(fit[0])}. Prüfe sie mit der ${q > 0 ? 'rechten' : 'linken'} Hand.`);
      return {
        kind: 'dir', title: missing === 'B' ? L('Which field?', 'Welches Feld?') : L('Which velocity?', 'Welche Geschwindigkeit?'), text, figs: `<div class="fig">${fig}</div>`,
        questions: [tiles('m', missing === 'B' ? L('Which directions of the field fit? Tick all that do.', 'Welche Richtungen des Feldes passen? Kreuze alle an, die passen.') : L('Which directions of motion fit? Tick all that do.', 'Welche Bewegungsrichtungen passen? Kreuze alle an, die passen.'), options, true)],
        hints: [chargeOf(pt), RULE(), L(`The force is perpendicular to ${missing === 'B' ? 'the field' : 'the velocity'}: rule out the directions that are not.`, `Die Kraft steht senkrecht zu${missing === 'B' ? 'm Feld' : 'r Geschwindigkeit'}: Schliesse die Richtungen aus, die das nicht tun.`),
          L(`Only the part of ${what} perpendicular to the ${missing === 'B' ? 'velocity' : 'field'} counts: a slanting direction can fit as well as a straight one.`, `Nur der Teil ${missing === 'B' ? 'des Feldes senkrecht zur Geschwindigkeit' : 'der Geschwindigkeit senkrecht zum Feld'} zählt: Eine schräge Richtung kann ebenso passen wie eine gerade.`)],
        solution: [sol], p: { q, missing, a: key(a), F: key(F), o: opts.map(key), pt: pt.id },
      };
    }
  }

  // ---------------------------------------------------------------- two currents or charges
  const WHYB = {
    hand: () => L('That is the opposite direction: use the right-hand grip rule (or, for a negative charge, the left hand).', 'Das ist die Gegenrichtung: Nimm die Rechte-Hand-Regel für das Umfassen (oder, für eine negative Ladung, die linke Hand).'),
    radial: () => L('The field circles around the current: it does not point towards it or away from it.', 'Das Feld umkreist den Strom: Es zeigt nicht zu ihm hin oder von ihm weg.'),
    along: () => L('The field of a straight current does not point along the current.', 'Das Feld eines geraden Stroms zeigt nicht in Richtung des Stroms.'),
    nofield: () => L('There is a field here.', 'Hier gibt es ein Feld.'),
    field: () => L('There is no field here.', 'Hier gibt es kein Feld.'),
  };
  function pair(kind, seed) {
    const r = rng(seed * 41 + 13);
    for (;;) {
      let d1, d2, P, q1 = 1, q2 = 1, pt1 = null, pt2 = null;
      if (kind === 'parallel') {
        d1 = r.pick(AXES.filter((d) => d[2] || d[0])); d2 = r.next() < 0.5 ? d1 : neg(d1);
        P = d1[2] ? r.pick([[2.2, 0, 0], [0, -1.6, 0]]) : [0, -1.6, 0];
      } else if (kind === 'angle') {
        d1 = r.pick(AXES); d2 = r.pick(AXES.filter((d) => !same(d, d1) && !same(d, neg(d1))));
        P = r.pick(d1[2] ? [[2.2, 0, 0], [-2.2, 0, 0], [0, 1.6, 0], [0, -1.6, 0]] : d1[0] ? [[0, 1.6, 0], [0, -1.6, 0]] : [[2.2, 0, 0], [-2.2, 0, 0]]);
      } else {
        q1 = r.pick([1, -1]); q2 = r.pick([1, -1]);
        pt1 = particle(r, q1); pt2 = particle(r, q2);
        d1 = r.pick(AXES.filter((d) => !d[2])); d2 = r.pick(AXES);
        P = r.pick([[2.2, 0, 0], [-2.2, 0, 0], [0, 1.6, 0], [0, -1.6, 0], [1.8, 1.4, 0]]);
      }
      const B = kind === 'particles' ? chargeField(q1, d1, P) : wireField(d1, P);
      const F = B && force(q2, d2, B), Bz = B && B.map((x) => Math.round(x * 1e9) / 1e9);
      if (kind !== 'particles' && !B) continue;
      if (kind === 'particles' && !B && r.next() < 0.7) continue; // mostly a field
      if (B && !AXES.some((x) => same(x, B))) continue;
      const kind2 = kind === 'particles' ? 'v' : 'I';
      const what1 = kind === 'particles' ? L('charge 1', 'Ladung 1') : L('wire 1', 'Draht 1');
      const howB = !B ? L('Charge 2 lies on the line along which charge 1 moves: there the field of charge 1 is zero.', 'Ladung 2 liegt auf der Geraden, längs der sich Ladung 1 bewegt: Dort ist das Feld von Ladung 1 null.')
        : kind === 'particles'
          ? L(`A moving charge has a field like a short piece of current (a negative charge like a current against its motion). ${q1 > 0 ? 'Right' : 'Left'} hand, thumb along the motion of charge 1 (${dirName(d1)}): the fingers curl ${dirName(Bz)} at charge 2.`,
            `Eine bewegte Ladung hat ein Feld wie ein kurzes Stromstück (eine negative Ladung wie ein Strom gegen ihre Bewegung). ${q1 > 0 ? 'Rechte' : 'Linke'} Hand, Daumen in Bewegungsrichtung von Ladung 1 (${dirName(d1)}): Die Finger zeigen bei Ladung 2 ${dirName(Bz)}.`)
          : L(`Right hand around wire 1, thumb along its current (${dirName(d1)}): at wire 2 the fingers point ${dirName(Bz)}.`, `Rechte Hand um Draht 1, Daumen in seiner Stromrichtung (${dirName(d1)}): Bei Draht 2 zeigen die Finger ${dirName(Bz)}.`);
      const howF = !B ? L('No field at charge 2, so no force on it.', 'Kein Feld bei Ladung 2, also keine Kraft auf sie.') : howForce(q2, kind2, d2, Bz);
      const radial = P.map((x) => Math.sign(Math.round(x * 10))), qB = tiles('B', L(`(a) In which direction does the field of ${what1} point at ${kind === 'particles' ? 'charge 2' : 'wire 2'}?`, `(a) In welche Richtung zeigt das Feld von ${what1} bei ${kind === 'particles' ? 'Ladung 2' : 'Draht 2'}?`),
        forceOptions(r, Bz, B ? [[neg(Bz), 'hand'], ...(AXES.some((x) => same(x, radial)) ? [[AXES.find((x) => same(x, radial)), 'radial']] : []), [d1, 'along'], ...(kind === 'particles' ? [[null, 'nofield']] : [])] : [[[0, 0, 1], 'field'], [[0, 0, -1], 'field']], howB, L('no field', 'kein Feld')).map((o) => ({ ...o, why: o.ok ? '' : `${o.tag && WHYB[o.tag] ? WHYB[o.tag]() + ' ' : ''}${howB}` })));
      const qF = tiles('F', L(`(b) In which direction does the magnetic force on ${kind === 'particles' ? 'charge 2' : 'wire 2'} point?`, `(b) In welche Richtung zeigt die magnetische Kraft auf ${kind === 'particles' ? 'Ladung 2' : 'Draht 2'}?`),
        forceOptions(r, F, F ? [[neg(F), 'hand'], [d2, 'alongV'], [Bz, 'alongB'], [null, 'none']] : [[d2, 'some'], [Bz, 'some']], howF));
      const items = kind === 'particles'
        ? [drawn(pt1, [0, 0], '1'), drawn(pt2, [P[0], P[1]], '2')]
        : [{ kind: 'wire', d: d1, at: [0, 0], name: '1' }, { kind: kind === 'parallel' ? 'wire' : 'piece', d: d2, at: [P[0], P[1]], name: '2' }];
      const vecs = kind === 'particles' ? [{ of: 0, kind: 'v', dir: d1, name: 'v<tspan class="sub" dy="3">1</tspan>' }, { of: 1, kind: 'v', dir: d2, name: 'v<tspan class="sub" dy="3">2</tspan>' }] : [];
      const fig = scene({ items, vecs, points: kind === 'particles' ? [] : [] });
      const parallelRule = kind === 'parallel' ? L(` So currents in the same direction attract each other, opposite currents repel each other.`, ` Gleich gerichtete Ströme ziehen sich also an, entgegengesetzte stossen sich ab.`) : '';
      const text = kind === 'particles'
        ? L(`<p>Two charged particles move as shown: charge 1 is ${pt1.name()}, charge 2 is ${pt2.name()}. Consider only the magnetic force (the electric force between them is larger, but it is not asked here).</p>`,
          `<p>Zwei geladene Teilchen bewegen sich wie gezeigt: Ladung 1 ist ${pt1.name()}, Ladung 2 ist ${pt2.name()}. Betrachte nur die magnetische Kraft (die elektrische Kraft zwischen ihnen ist grösser, ist hier aber nicht gefragt).</p>`)
        : kind === 'parallel'
          ? L(`<p>Two long straight wires carry currents ${d2 === d1 || same(d2, d1) ? 'in the same direction' : 'in opposite directions'}, as shown.</p>`, `<p>Zwei lange gerade Drähte führen Ströme ${same(d2, d1) ? 'in derselben Richtung' : 'in entgegengesetzten Richtungen'}, wie gezeigt.</p>`)
          : L(`<p>A long straight wire 1 carries a current ${dirName(d1)}. Near it, a short piece of wire 2 carries a current ${dirName(d2)}.</p>`, `<p>Ein langer gerader Draht 1 führt einen Strom ${dirName(d1)}. In seiner Nähe führt ein kurzes Drahtstück 2 einen Strom ${dirName(d2)}.</p>`);
      return {
        kind: 'pair', title: kind === 'particles' ? L('Two moving charges', 'Zwei bewegte Ladungen') : L('Two currents', 'Zwei Ströme'), text, figs: `<div class="fig">${fig}</div>`,
        questions: [qB, qF],
        hints: [kind === 'particles' ? L('A moving charge makes a field like a short piece of current: positive charges along their motion, negative ones against it.', 'Eine bewegte Ladung erzeugt ein Feld wie ein kurzes Stromstück: positive Ladungen in Bewegungsrichtung, negative entgegen.') : GRIP(), L('First the field of the first one at the place of the second, then the force on the second in this field.', 'Zuerst das Feld des ersten am Ort des zweiten, dann die Kraft auf das zweite in diesem Feld.'), RULE()],
        solution: [howB, howF + parallelRule], p: { kind, d1: key(d1), d2: key(d2), P: P.join(','), q1, q2, pt: pt1 ? pt1.id + pt2.id : '' },
      };
    }
  }

  // ---------------------------------------------------------------- paths
  const WHYP = {
    hand: () => L('This one turns the wrong way: mind the sign of the charge and the direction of the field.', 'Diese dreht in die falsche Richtung: Achte auf das Vorzeichen der Ladung und die Richtung des Feldes.'),
    straight: () => L('A charge moving across a field is deflected.', 'Eine Ladung, die sich quer zum Feld bewegt, wird abgelenkt.'),
    bent: () => L('A neutral particle is not deflected.', 'Ein neutrales Teilchen wird nicht abgelenkt.'),
    parabola: () => L('That is the path in an electric field: there the force always points the same way. The magnetic force stays perpendicular to the velocity, so the path is a circle.', 'Das ist die Bahn in einem elektrischen Feld: Dort zeigt die Kraft immer in dieselbe Richtung. Die magnetische Kraft bleibt senkrecht zur Geschwindigkeit, also ist die Bahn ein Kreis.'),
    circle: () => L('The part of the velocity along the field is not changed by the field: the charge keeps moving along the field while it circles.', 'Der Teil der Geschwindigkeit längs des Feldes wird vom Feld nicht verändert: Die Ladung bewegt sich weiter längs des Feldes, während sie kreist.'),
    line: () => L('The part of the velocity across the field makes the charge circle around the field lines.', 'Der Teil der Geschwindigkeit quer zum Feld lässt die Ladung um die Feldlinien kreisen.'),
    tilted: () => L('The charge circles around the field lines, so the screw runs along the field, not along the starting velocity.', 'Die Ladung kreist um die Feldlinien, also verläuft die Schraube längs des Feldes, nicht längs der Anfangsgeschwindigkeit.'),
    mirror: () => L('This one drifts the wrong way: where the field is stronger, the circle is tighter, so the loops shift sideways in the direction the charge moves on its wide arcs.', 'Diese driftet in die falsche Richtung: Wo das Feld stärker ist, ist der Kreis enger, also verschieben sich die Schleifen seitlich in die Richtung, in die sich die Ladung auf ihren weiten Bögen bewegt.'),
    closed: () => L('In a field that changes, the circle is tighter where the field is stronger: the path does not close.', 'In einem Feld, das sich ändert, ist der Kreis dort enger, wo das Feld stärker ist: Die Bahn schliesst sich nicht.'),
    spiral: () => L('The speed stays the same (the magnetic force does no work): the path does not spiral inwards.', 'Der Betrag der Geschwindigkeit bleibt gleich (die magnetische Kraft verrichtet keine Arbeit): Die Bahn spiralt nicht nach innen.'),
  };
  const drawPick = (o) => pathFig({ ...o, small: true });
  function pathCircle(seed) {
    const r = rng(seed * 43 + 17), q = r.pick([1, 1, -1, -1, 0]), bz = r.pick([1, -1]), R = r.pick([1.1, 1.4, 1.8]), y0 = r.pick([-0.5, 0, 0.5]), pt = particle(r, q);
    const box = [-1, 6, -3.2, 3.2], region = [1, 6, -3.2, 3.2], inside = (x) => x >= 1;
    const run = (k) => path({ x0: -0.6, y0, vx: 1, vy: 0, k, Bz: () => bz, inside, dt: 0.02, n: 900, stop: (x, y) => x < -1.2 || x > 6.5 || Math.abs(y) > 3.5 });
    const k = q / R, right = run(k), turned = run(-k || 1 / R), straight = [[-0.6, y0], [6.5, y0]];
    const down = force(q || 1, [1, 0, 0], [0, 0, bz]), sgn = down ? down[1] : 1, para = [];
    for (let x = -0.6; x <= 6.5; x += 0.05) { const t = Math.max(0, x - 1); para.push([x, y0 + sgn * 0.45 * t * t]); }
    const base = { box, region, bz, q, sym: pt.sym };
    const opts = q ? [{ pts: right, ok: true }, { pts: turned, tag: 'hand' }, { pts: straight, tag: 'straight' }, { pts: para, tag: 'parabola' }]
      : [{ pts: straight, ok: true }, { pts: run(1 / R), tag: 'bent' }, { pts: run(-1 / R), tag: 'bent' }, { pts: para, tag: 'bent' }];
    const F = force(q, [1, 0, 0], [0, 0, bz]);
    const how = q ? L(`At the start, the force on the ${signName(q)} charge points ${dirName(F)} (${q > 0 ? 'right' : 'left'} hand). The force stays perpendicular to the velocity, so the charge moves on a circle and leaves the field ${F[1] > 0 ? 'above' : 'below'} where it came in, moving back.`,
      `Zu Beginn zeigt die Kraft auf die ${q > 0 ? 'positive' : 'negative'} Ladung ${dirName(F)} (${q > 0 ? 'rechte' : 'linke'} Hand). Die Kraft bleibt senkrecht zur Geschwindigkeit, also bewegt sich die Ladung auf einem Kreis und verlässt das Feld ${F[1] > 0 ? 'oberhalb' : 'unterhalb'} der Eintrittsstelle, in Gegenrichtung.`)
      : L('A neutral particle feels no magnetic force: it goes straight on.', 'Ein neutrales Teilchen spürt keine magnetische Kraft: Es fliegt geradeaus weiter.');
    return {
      kind: 'path', title: L('A charge enters a field', 'Eine Ladung tritt in ein Feld ein'),
      text: L(`<p>${cap(pt.name())} flies to the right into a region with a uniform magnetic field ${dirName([0, 0, bz])}.</p>`, `<p>${cap(pt.name())} fliegt nach rechts in ein Gebiet mit einem homogenen Magnetfeld, das ${dirName([0, 0, bz])} zeigt.</p>`),
      figs: `<div class="fig">${pathFig({ ...base, pts: [[-0.6, y0], [0.4, y0]] })}</div>`,
      questions: [{ type: 'pick', key: 'p', label: L('Which drawing shows its path?', 'Welche Zeichnung zeigt seine Bahn?'), options: r.shuffle(opts).map((o) => ({ html: drawPick({ ...base, pts: o.pts }), ok: !!o.ok, tag: o.tag, why: o.ok ? '' : `${WHYP[o.tag]()} ${how}` })) }],
      hints: [chargeOf(pt), PERP(), RULE(), L('A force that is always perpendicular to the velocity changes only the direction of motion, not the speed: the path is a circle.', 'Eine Kraft, die immer senkrecht zur Geschwindigkeit steht, ändert nur die Bewegungsrichtung, nicht den Betrag: Die Bahn ist ein Kreis.')],
      solution: [how], solFig: `<div class="fig">${pathFig({ ...base, pts: q ? right : straight })}</div>`, p: { q, bz, R, y0, pt: pt.id },
    };
  }
  function pathHelix(seed) {
    const r = rng(seed * 47 + 19), q = r.pick([1, -1]), bx = r.pick([1, -1]), ang = r.pick([30, 45, 60]), R = r.pick([0.7, 0.9]), pt = particle(r, q);
    const a = (ang * Math.PI) / 180, vpar = Math.cos(a) * bx, vperp = Math.sin(a), w = vperp / R, box = [-0.5, 7.5, -2.4, 2.4];
    const start = bx < 0 ? 7 : 0, u = [Math.cos(a) * bx, Math.sin(a)], n = [-u[1], u[0]];
    const right = [], circle = [], tilt = [], line = [[start, 0], [start + 9 * u[0], 9 * u[1]]];
    for (let t = 0; t <= 60; t += 0.05) {
      right.push([start + vpar * t, R * Math.sin(w * t)]);
      circle.push([start + R * Math.sin(w * t), R - R * Math.cos(w * t)]);
      const off = R * Math.sin(w * t);
      tilt.push([start + 0.6 * t * u[0] + off * n[0], 0.6 * t * u[1] + off * n[1]]); // a helix around the starting direction
    }
    const base = { box, bx, q, sym: pt.sym };
    const opts = [{ pts: right, ok: true }, { pts: circle, tag: 'circle' }, { pts: line, tag: 'line' }, { pts: tilt, tag: 'tilted' }];
    const how = L(`Split the velocity into a part along the field (${Math.round(Math.cos(a) * 100)} %) and a part across it. The field does not change the part along it; the part across makes the charge circle around the field lines. Together: a helix (a screw) along the field, seen from the side as a wave of constant height.`,
      `Zerlege die Geschwindigkeit in einen Teil längs des Feldes (${Math.round(Math.cos(a) * 100)} %) und einen Teil quer dazu. Das Feld ändert den Teil längs nicht; der Teil quer lässt die Ladung um die Feldlinien kreisen. Zusammen: eine Schraubenlinie längs des Feldes, von der Seite gesehen eine Welle gleicher Höhe.`);
    return {
      kind: 'path', title: L('A screw along the field', 'Eine Schraube längs des Feldes'),
      text: L(`<p>${cap(pt.name())} starts at an angle of ${ang}° to a uniform magnetic field that points ${dirName([bx, 0, 0])}.</p>`, `<p>${cap(pt.name())} startet unter einem Winkel von ${ang}° zu einem homogenen Magnetfeld, das ${dirName([bx, 0, 0])} zeigt.</p>`),
      figs: `<div class="fig">${pathFig({ ...base, pts: [[start, 0], [start + Math.cos(a) * bx, Math.sin(a)]] })}</div>`,
      questions: [{ type: 'pick', key: 'p', label: L('Which drawing shows its path, seen from the side?', 'Welche Zeichnung zeigt seine Bahn, von der Seite gesehen?'), options: r.shuffle(opts).map((o) => ({ html: drawPick({ ...base, pts: o.pts }), ok: !!o.ok, tag: o.tag, why: o.ok ? '' : `${WHYP[o.tag]()} ${how}` })) }],
      hints: [L('Split the velocity into a part along the field and a part across it.', 'Zerlege die Geschwindigkeit in einen Teil längs des Feldes und einen Teil quer dazu.'), L('Along the field there is no force.', 'Längs des Feldes gibt es keine Kraft.'), L('Across the field, the charge circles.', 'Quer zum Feld kreist die Ladung.')],
      solution: [how], solFig: `<div class="fig">${pathFig({ ...base, pts: right })}</div>`, p: { q, bx, ang, R, pt: pt.id },
    };
  }
  function pathGradient(seed) {
    const r = rng(seed * 53 + 23), q = r.pick([1, -1]), bz = r.pick([1, -1]), g = r.pick([0.25, 0.35]), R0 = r.pick([0.9, 1.1]), up = r.next() < 0.5, pt = particle(r, q);
    const Bz = (x, y) => bz * (1 + g * (up ? y : -y)), k = q / R0;
    const box = [-5, 5, -2.6, 2.6], opts0 = { x0: 0, y0: 0, vx: 0, vy: 1, dt: 0.02, n: 1700 };
    const right = path({ ...opts0, k, Bz }), mirror = right.map((p) => [-p[0], p[1]]);
    const closed = path({ ...opts0, k, Bz: () => bz, n: 400 }), spiral = [];
    // a spiral inwards from the start, turning the same way as the charge
    const c = closed.reduce((m, p) => [m[0] + p[0] / closed.length, m[1] + p[1] / closed.length], [0, 0]), th0 = Math.atan2(-c[1], -c[0]);
    const turn = Math.sign((closed[5][0] - c[0]) * (closed[10][1] - c[1]) - (closed[5][1] - c[1]) * (closed[10][0] - c[0]));
    for (let th = 0; th < 8 * Math.PI; th += 0.05) { const rr = R0 * Math.exp(-th / 10); spiral.push([c[0] + rr * Math.cos(th0 + turn * th), c[1] + rr * Math.sin(th0 + turn * th)]); }
    const base = { box, bz, grad: up ? g : -g, q, sym: pt.sym };
    const drift = Math.sign(right[right.length - 1][0]);
    const how = L(`Where the field is stronger (${up ? 'higher up' : 'further down'}), the circle is tighter; where it is weaker, wider. So the loops do not close: the charge drifts ${drift > 0 ? 'to the right' : 'to the left'}, the way it moves on its wide arcs in the weak field.`,
      `Wo das Feld stärker ist (${up ? 'weiter oben' : 'weiter unten'}), ist der Kreis enger; wo es schwächer ist, weiter. Also schliessen sich die Schleifen nicht: Die Ladung driftet ${drift > 0 ? 'nach rechts' : 'nach links'}, in die Richtung, in die sie sich auf ihren weiten Bögen im schwachen Feld bewegt.`);
    const opts = [{ pts: right, ok: true }, { pts: mirror, tag: 'mirror' }, { pts: closed, tag: 'closed' }, { pts: spiral, tag: 'spiral' }];
    return {
      kind: 'path', title: L('A field that grows', 'Ein Feld, das zunimmt'),
      text: L(`<p>${cap(pt.name())} starts upwards in a magnetic field ${dirName([0, 0, bz])} that gets stronger ${up ? 'upwards' : 'downwards'} (the symbols are closer together where it is stronger).</p>`, `<p>${cap(pt.name())} startet nach oben in einem Magnetfeld, das ${dirName([0, 0, bz])} zeigt und ${up ? 'nach oben' : 'nach unten'} stärker wird (wo es stärker ist, liegen die Symbole dichter).</p>`),
      figs: `<div class="fig">${pathFig({ ...base, pts: [[0, 0], [0, 0.6]] })}</div>`,
      questions: [{ type: 'pick', key: 'p', label: L('Which drawing shows its path?', 'Welche Zeichnung zeigt seine Bahn?'), options: r.shuffle(opts).map((o) => ({ html: drawPick({ ...base, pts: o.pts }), ok: !!o.ok, tag: o.tag, why: o.ok ? '' : `${WHYP[o.tag]()} ${how}` })) }],
      hints: [chargeOf(pt), L('The radius of the circle is r = m·v/(q·B): a stronger field, a tighter circle.', 'Der Radius des Kreises ist r = m·v/(q·B): ein stärkeres Feld, ein engerer Kreis.'), L('The speed does not change: the magnetic force does no work.', 'Der Betrag der Geschwindigkeit ändert sich nicht: Die magnetische Kraft verrichtet keine Arbeit.'), L('Which way does the charge turn? Where on its circle is it in the weak field?', 'In welche Richtung dreht die Ladung? Wo auf ihrem Kreis ist sie im schwachen Feld?')],
      solution: [how], solFig: `<div class="fig">${pathFig({ ...base, pts: right })}</div>`, p: { q, bz, g, R0, up, pt: pt.id },
    };
  }

  // ---------------------------------------------------------------- radius and period
  const PNAME = { electron: ['an electron', 'ein Elektron'], proton: ['a proton', 'ein Proton'], deuteron: ['a deuteron', 'ein Deuteron'], alpha: ['an alpha particle', 'ein Alphateilchen'] };
  const sci = (x) => { const e = Math.floor(Math.log10(Math.abs(x))), m = x / 10 ** e; return `${Number(m.toPrecision(3))} · 10<sup>${e < 0 ? '−' + -e : e}</sup>`; };
  const nice = (x) => String(Number(x.toPrecision(3)));
  function unitOf(x, kind) {
    const set = kind === 'len' ? [[1, 'm'], [1e-2, 'cm'], [1e-3, 'mm'], [1e-6, 'µm']] : [[1, 's'], [1e-3, 'ms'], [1e-6, 'µs'], [1e-9, 'ns'], [1e-12, 'ps']];
    return set.find(([f]) => x >= f * 0.999) || set[set.length - 1];
  }
  const show = (x, kind) => { const [f, u] = unitOf(x, kind); return `${nice(x / f)} ${u}`; };
  // the options of a value: the right one and the mistakes, apart by 15 %, sorted
  // (the other ones: how, the working)
  function values(right, mistakes, kind, how, extra = [2, 0.5, 4]) {
    const out = [{ value: right, ok: true, why: '' }];
    for (const m of [...mistakes, ...extra.map((k) => ({ value: right * k, tag: 'other', why: how }))]) {
      if (out.length === 4) break;
      if (Number.isFinite(m.value) && m.value > 0 && out.every((o) => Math.abs(Math.log(m.value / o.value)) > Math.log(1.15))) out.push({ ...m, ok: false });
    }
    return out.sort((a, b) => a.value - b.value).map((o) => ({ ...o, label: show(o.value, kind) }));
  }
  function radiusNum(seed) {
    const r = rng(seed * 59 + 29), name = r.pick(['electron', 'proton', 'proton', 'deuteron', 'alpha']), pt = PARTICLES[name];
    const v = name === 'electron' ? r.pick([2e6, 5e6, 1e7, 2e7]) : r.pick([2e5, 5e5, 1e6, 2e6]), B = name === 'electron' ? r.pick([1e-3, 2e-3, 5e-3, 1e-2]) : r.pick([0.1, 0.2, 0.5, 1]);
    const q = Math.abs(pt.q), R = (pt.m * v) / (q * B), T = (2 * Math.PI * pt.m) / (q * B);
    const how = L(`The magnetic force provides the centripetal force: q·v·B = m·v²/r, so r = m·v/(q·B) = ${sci(pt.m)} kg · ${sci(v)} m/s / (${sci(q)} C · ${nice(B)} T) = ${show(R, 'len')}.`,
      `Die magnetische Kraft liefert die Zentripetalkraft: q·v·B = m·v²/r, also r = m·v/(q·B) = ${sci(pt.m)} kg · ${sci(v)} m/s / (${sci(q)} C · ${nice(B)} T) = ${show(R, 'len')}.`);
    const howT = L(`One turn is 2π·r long: T = 2π·r/v = 2π·m/(q·B) = ${show(T, 'time')}. The speed cancels out.`, `Ein Umlauf ist 2π·r lang: T = 2π·r/v = 2π·m/(q·B) = ${show(T, 'time')}. Die Geschwindigkeit kürzt sich heraus.`);
    const mistakesR = [{ value: 2 * R, tag: 'diam', why: L(`That is the diameter. ${how}`, `Das ist der Durchmesser. ${how}`) }];
    if (name === 'alpha') mistakesR.push({ value: 2 * R, tag: 'charge', why: L(`An alpha particle has the charge 2e. ${how}`, `Ein Alphateilchen hat die Ladung 2e. ${how}`) });
    if (name === 'electron') mistakesR.push({ value: (PARTICLES.proton.m * v) / (q * B), tag: 'mass', why: L(`That is with the mass of a proton. ${how}`, `Das ist mit der Masse eines Protons. ${how}`) });
    mistakesR.push({ value: R / 2, tag: 'other', why: how });
    const qa = values(R, mistakesR, 'len', how), qb = values(T, [{ value: T / (2 * Math.PI), tag: 'twopi', why: L(`One turn is 2π·r long. ${howT}`, `Ein Umlauf ist 2π·r lang. ${howT}`) }, { value: T / 2, tag: 'half', why: howT }], 'time', howT);
    const qc = [[L('stay the same', 'gleich bleiben'), true, ''], [L('double', 'sich verdoppeln'), false, L('Twice as fast, the circle is twice as long: the time for one turn stays the same, T = 2π·m/(q·B).', 'Doppelt so schnell ist der Kreis doppelt so lang: Die Zeit für einen Umlauf bleibt gleich, T = 2π·m/(q·B).')], [L('halve', 'sich halbieren'), false, L('Twice as fast, the circle is twice as long: the time for one turn stays the same, T = 2π·m/(q·B).', 'Doppelt so schnell ist der Kreis doppelt so lang: Die Zeit für einen Umlauf bleibt gleich, T = 2π·m/(q·B).')]];
    return {
      kind: 'radius', title: L('Radius and period', 'Radius und Umlaufzeit'),
      text: L(`<p>${L(...PNAME[name]).replace(/^./, (c) => c.toUpperCase())} moves at ${sci(v)} m/s perpendicular to a uniform magnetic field of ${nice(B)} T. (m = ${sci(pt.m)} kg, q = ${name === 'alpha' ? '2e' : name === 'electron' ? '−e' : 'e'}, e = 1.602 · 10<sup>−19</sup> C)</p>`,
        `<p>${L(...PNAME[name]).replace(/^./, (c) => c.toUpperCase())} bewegt sich mit ${sci(v)} m/s senkrecht zu einem homogenen Magnetfeld von ${nice(B)} T. (m = ${sci(pt.m)} kg, q = ${name === 'alpha' ? '2e' : name === 'electron' ? '−e' : 'e'}, e = 1.602 · 10<sup>−19</sup> C)</p>`) + (WHAT[name] ? `<p class="note">${cap(L(...WHAT[name]))}.</p>` : ''),
      figs: '',
      questions: [choice('r', L('(a) the radius of its circle', '(a) der Radius seiner Kreisbahn'), qa), choice('T', L('(b) the time for one turn', '(b) die Zeit für einen Umlauf'), qb),
        choice('c', L('(c) If it were twice as fast, the time for one turn would', '(c) Wäre es doppelt so schnell, würde die Zeit für einen Umlauf'), r.shuffle(qc.map(([label, ok, why]) => ({ label, ok, why }))))],
      hints: [L('The magnetic force q·v·B is the centripetal force m·v²/r.', 'Die magnetische Kraft q·v·B ist die Zentripetalkraft m·v²/r.'), L('One turn: the distance 2π·r at the speed v.', 'Ein Umlauf: die Strecke 2π·r mit der Geschwindigkeit v.')],
      solution: [how, howT], p: { name, v, B },
    };
  }
  // [mass in u, charge in e, id, [en, de], the German genitive]
  const WHAT = {
    deuteron: ['a deuteron is the nucleus of heavy hydrogen (deuterium): one proton and one neutron', 'ein Deuteron ist der Kern von schwerem Wasserstoff (Deuterium): ein Proton und ein Neutron'],
    triton: ['a triton is the nucleus of the heaviest hydrogen (tritium): one proton and two neutrons', 'ein Triton ist der Kern des schwersten Wasserstoffs (Tritium): ein Proton und zwei Neutronen'],
    alpha: ['an alpha particle is a helium nucleus: two protons and two neutrons', 'ein Alphateilchen ist ein Heliumkern: zwei Protonen und zwei Neutronen'],
  };
  const RATIO = [[1, 1, 'proton', ['a proton', 'ein Proton'], 'eines Protons'], [2, 1, 'deuteron', ['a deuteron', 'ein Deuteron'], 'eines Deuterons'], [3, 1, 'triton', ['a triton', 'ein Triton'], 'eines Tritons'],
    [4, 2, 'alpha', ['an alpha particle', 'ein Alphateilchen'], 'eines Alphateilchens'], [4, 1, 'he', ['a He⁺ ion', 'ein He⁺-Ion'], 'eines He⁺-Ions'], [12, 6, 'c6', ['a C⁶⁺ ion', 'ein C⁶⁺-Ion'], 'eines C⁶⁺-Ions']];
  const frac = (x) => (Math.abs(x - 1) < 1e-9 ? L('the same', 'gleich gross') : x > 1 ? L(`${nice(x)} times as large`, `${nice(x)}-mal so gross`) : L(`1/${nice(1 / x)} as large`, `1/${nice(1 / x)} so gross`));
  function radiusCompare(seed) {
    const r = rng(seed * 61 + 31);
    for (;;) {
      const [a, b] = r.shuffle(RATIO.slice()).slice(0, 2), ratio = (b[0] / b[1]) / (a[0] / a[1]);
      if (Math.abs(ratio - 1) < 1e-9 && r.next() < 0.7) continue;
      const opt = (right, list) => {
        const all = [right, ...list].filter((x, i, arr) => arr.findIndex((y) => Math.abs(y - x) < 1e-9) === i).slice(0, 4);
        return all.sort((x, y) => x - y).map((x) => ({ label: frac(x), ok: Math.abs(x - right) < 1e-9, why: '' }));
      };
      const how = L(`At the same speed and in the same field, r = m·v/(q·B) is proportional to m/q: ${b[0]}u/${b[1]}e for the second, ${a[0]}u/${a[1]}e for the first, a ratio of ${nice(ratio)}. The period T = 2π·m/(q·B) has the same ratio.`,
        `Bei gleicher Geschwindigkeit und im selben Feld ist r = m·v/(q·B) proportional zu m/q: ${b[0]}u/${b[1]}e für das zweite, ${a[0]}u/${a[1]}e für das erste, ein Verhältnis von ${nice(ratio)}. Die Umlaufzeit T = 2π·m/(q·B) hat dasselbe Verhältnis.`);
      const change = r.pick(['v', 'B']), howC = change === 'v' ? L('Twice as fast: r = m·v/(q·B) doubles; the period T = 2π·m/(q·B) stays the same.', 'Doppelt so schnell: r = m·v/(q·B) verdoppelt sich; die Umlaufzeit T = 2π·m/(q·B) bleibt gleich.')
        : L('Twice the field: r = m·v/(q·B) and T = 2π·m/(q·B) both halve.', 'Doppeltes Feld: r = m·v/(q·B) und T = 2π·m/(q·B) halbieren sich beide.');
      const mk = (list, why) => list.map((o) => ({ ...o, why: o.ok ? '' : why }));
      return {
        kind: 'radius', title: L('Comparing circles', 'Kreise vergleichen'),
        text: L(`<p>${cap(L(...a[3]))} and ${L(...b[3])} move at the same speed perpendicular to the same uniform magnetic field.</p>`, `<p>${cap(L(...a[3]))} und ${L(...b[3])} bewegen sich mit derselben Geschwindigkeit senkrecht zum selben homogenen Magnetfeld.</p>`) +
          `<p class="note">${[a, b].map((x, i) => `${(i ? (y) => y : cap)(L(...x[3]).replace(/^(a|an|ein) /, ''))}: ${L('mass', 'Masse')} ${x[0]} u, ${L('charge', 'Ladung')} +${x[1] === 1 ? '' : x[1]}e`).join('; ')}.${[a, b].filter((x) => WHAT[x[2]]).map((x) => ` ${cap(L(...WHAT[x[2]]))}.`).join('')}</p>`,
        figs: '',
        questions: [
          choice('r', L(`(a) Compared with the circle of ${L(...a[3])}, the radius of the circle of ${L(...b[3])} is`, `(a) Verglichen mit der Kreisbahn ${a[4]} ist der Radius der Kreisbahn ${b[4]}`), mk(opt(ratio, [1 / ratio, ratio * ratio, ratio * 2, 1, 2, 0.5]), how)),
          choice('T', L(`(b) Compared with the time for one turn of ${L(...a[3])}, the time for one turn of ${L(...b[3])} is`, `(b) Verglichen mit der Umlaufzeit ${a[4]} ist die Umlaufzeit ${b[4]}`), mk(opt(ratio, [1, 1 / ratio, ratio * 2, 2, 0.5]), how)),
          choice('c', change === 'v' ? L(`(c) If ${L(...a[3])} were twice as fast, the radius of its circle would be`, `(c) Wäre ${L(...a[3])} doppelt so schnell, wäre der Radius seiner Kreisbahn`) : L(`(c) In a field twice as strong, the radius of the circle of ${L(...a[3])} would be`, `(c) In einem doppelt so starken Feld wäre der Radius der Kreisbahn ${a[4]}`),
            mk(opt(change === 'v' ? 2 : 0.5, [1, 4, 0.25, 2, 0.5]), howC)),
        ],
        hints: [L('r = m·v/(q·B) and T = 2π·m/(q·B).', 'r = m·v/(q·B) und T = 2π·m/(q·B).'), L('Compare m/q: u for the mass unit, e for the elementary charge.', 'Vergleiche m/q: u als Masseneinheit, e als Elementarladung.')],
        solution: [how, howC], p: { a: a[2], b: b[2], change },
      };
    }
  }
  function tracks(seed) {
    const r = rng(seed * 67 + 37), bz = r.pick([1, -1]), names = ['A', 'B', 'C', 'D'];
    for (;;) {
      const ts = names.map((name, i) => {
        const q = r.pick([1, -1]), R = r.pick([1.6, 2.4, 3.6, 6, 10]), spiral = r.next() < 0.3, a0 = ((i * 90 + r.int(-25, 25)) * Math.PI) / 180;
        const s = -Math.sign(q * bz); // a positive charge in a field out of the page turns clockwise
        const pts = [[0, 0]];
        let x = 0, y = 0, h = a0, rr = R, len = 0;
        while (len < (spiral ? 22 : Math.min(4.2, R * 2.6)) && Math.abs(x) < 5.4 && Math.abs(y) < 4.4) { x += 0.06 * Math.cos(h); y += 0.06 * Math.sin(h); h += (s * 0.06) / rr; len += 0.06; if (spiral) rr = Math.max(0.25, rr * 0.994); pts.push([x, y]); }
        return { name, q, R, spiral, pts };
      });
      const pos = ts.filter((t) => t.q > 0), bigR = Math.max(...ts.map((t) => t.R)), biggest = ts.filter((t) => t.R === bigR), spirals = ts.filter((t) => t.spiral);
      if (!pos.length || pos.length === 4 || biggest.length !== 1 || spirals.length !== 1 || spirals[0] === biggest[0]) continue;
      const turn = (q) => (q * bz > 0 ? L('clockwise', 'im Uhrzeigersinn') : L('anticlockwise', 'im Gegenuhrzeigersinn'));
      const howS = L(`In a field ${dirName([0, 0, bz])}, a positive charge turns ${turn(1)} (right hand), a negative one ${turn(-1)}: positive are ${pos.map((t) => t.name).join(', ')}.`, `In einem Feld, das ${dirName([0, 0, bz])} zeigt, dreht eine positive Ladung ${turn(1)} (rechte Hand), eine negative ${turn(-1)}: positiv sind ${pos.map((t) => t.name).join(', ')}.`);
      const howP = L(`r = p/(q·B): with the same charge, the largest momentum gives the straightest track, ${biggest[0].name}.`, `r = p/(q·B): Bei gleicher Ladung ergibt der grösste Impuls die geradeste Spur, ${biggest[0].name}.`);
      const howSp = L(`The particle of track ${spirals[0].name} loses energy in the liquid of the chamber: it slows down, and r = m·v/(q·B) shrinks.`, `Das Teilchen der Spur ${spirals[0].name} verliert in der Flüssigkeit der Kammer Energie: Es wird langsamer, und r = m·v/(q·B) schrumpft.`);
      return {
        kind: 'tracks', title: L('Tracks in a bubble chamber', 'Spuren in einer Blasenkammer'),
        text: L(`<p>Four charged particles start from the same point in a bubble chamber with a magnetic field ${dirName([0, 0, bz])}. All have a charge of the same size.</p>`, `<p>Vier geladene Teilchen starten im selben Punkt einer Blasenkammer mit einem Magnetfeld, das ${dirName([0, 0, bz])} zeigt. Alle haben eine Ladung vom selben Betrag.</p>`),
        figs: `<div class="fig">${tracksFig({ bz, tracks: ts })}</div>`,
        questions: [
          tiles('pos', L('(a) Which tracks belong to positive particles? Tick all.', '(a) Welche Spuren gehören zu positiven Teilchen? Kreuze alle an.'), ts.map((t) => ({ html: `<span class="dtile"><b>${t.name}</b></span>`, ok: t.q > 0, why: howS })), true),
          tiles('p', L('(b) Which particle has the largest momentum?', '(b) Welches Teilchen hat den grössten Impuls?'), ts.map((t) => ({ html: `<span class="dtile"><b>${t.name}</b></span>`, ok: t === biggest[0], why: howP }))),
          choice('sp', L(`(c) Track ${spirals[0].name} gets tighter and tighter because`, `(c) Spur ${spirals[0].name} wird immer enger, weil`), r.shuffle([
            { label: L('the particle slows down', 'das Teilchen langsamer wird'), ok: true, why: '' },
            { label: L('the field is stronger in the middle', 'das Feld in der Mitte stärker ist'), ok: false, why: howSp },
            { label: L('the particle’s charge grows', 'die Ladung des Teilchens wächst'), ok: false, why: howSp }])),
        ],
        hints: [RULE(), L('r = m·v/(q·B) = p/(q·B): a larger momentum, a wider circle.', 'r = m·v/(q·B) = p/(q·B): ein grösserer Impuls, ein weiterer Kreis.'), L('Moving through the liquid, a particle loses energy.', 'Auf dem Weg durch die Flüssigkeit verliert ein Teilchen Energie.')],
        solution: [howS, howP, howSp], p: { seed: seed % 997, bz },
      };
    }
  }

  // ---------------------------------------------------------------- the velocity selector
  // the particles flying in: [English, German, the symbol drawn (none: drawn with its sign)]
  const FLOCK = {
    1: [['positive ions', 'Positive Ionen', null], ['protons', 'Protonen', 'p'], ['sodium ions (Na⁺)', 'Natrium-Ionen (Na⁺)', 'Na⁺'], ['alpha particles', 'Alphateilchen', 'α']],
    '-1': [['negative ions', 'Negative Ionen', null], ['electrons', 'Elektronen', 'e⁻'], ['chloride ions (Cl⁻)', 'Chlorid-Ionen (Cl⁻)', 'Cl⁻']],
  };
  function selector(seed) {
    const r = rng(seed * 71 + 41), q = r.pick([1, -1]), who = r.pick(FLOCK[q]), Edown = r.next() < 0.5, E = r.pick([1, 2, 3, 4, 6]) * 1e4, B = r.pick([0.05, 0.1, 0.2, 0.25]), v = E / B;
    const bz = Edown ? -1 : 1; // the magnetic force on a positive charge moving right opposes the electric one
    const mag = force(q, [1, 0, 0], [0, 0, bz]), plate = (d) => (d[1] > 0 ? L('towards the upper plate', 'zur oberen Platte') : L('towards the lower plate', 'zur unteren Platte'));
    const how = L(`It passes straight when the two forces cancel: q·E = q·v·B, so v = E/B = ${sci(E)} V/m / ${nice(B)} T = ${sci(v)} m/s, whatever its charge and mass.`, `Es fliegt gerade durch, wenn sich die beiden Kräfte aufheben: q·E = q·v·B, also v = E/B = ${sci(E)} V/m / ${nice(B)} T = ${sci(v)} m/s, unabhängig von Ladung und Masse.`);
    const howFast = L(`For a faster particle, the magnetic force q·v·B is larger than the electric one: it is pushed ${plate(mag)}, the way the magnetic force points.`, `Bei einem schnelleren Teilchen ist die magnetische Kraft q·v·B grösser als die elektrische: Es wird ${plate(mag)} gedrückt, in Richtung der magnetischen Kraft.`);
    const howSame = L('Both forces are proportional to q and do not depend on the mass: at v = E/B they cancel for any particle.', 'Beide Kräfte sind proportional zu q und hängen nicht von der Masse ab: Bei v = E/B heben sie sich für jedes Teilchen auf.');
    const vals = [{ value: v, ok: true, why: '' }, { value: B / E, tag: 'inv', why: how }, { value: E * B, tag: 'prod', why: how }, { value: v * 2, tag: 'other', why: how }, { value: v / 2, tag: 'other', why: how }]
      .filter((o, i, arr) => arr.findIndex((x) => Math.abs(Math.log(x.value / o.value)) < 0.1) === i).slice(0, 4).sort((a, b) => a.value - b.value).map((o) => ({ ...o, label: `${sci(o.value)} m/s` }));
    const three = (rightLabel, why) => r.shuffle([[plate([0, 1, 0]), 'up'], [plate([0, -1, 0]), 'down'], [L('straight through', 'gerade durch'), 'straight']].map(([label, k]) => ({ label, ok: label === rightLabel, why })));
    return {
      kind: 'selector', title: L('The velocity selector', 'Das Geschwindigkeitsfilter'),
      text: L(`<p>Between two charged plates, the electric field (${sci(E)} V/m) points ${Edown ? 'down' : 'up'}; a magnetic field of ${nice(B)} T points ${dirName([0, 0, bz])}. ${cap(who[0])} fly in from the left.</p>`, `<p>Zwischen zwei geladenen Platten zeigt das elektrische Feld (${sci(E)} V/m) nach ${Edown ? 'unten' : 'oben'}; ein Magnetfeld von ${nice(B)} T zeigt ${dirName([0, 0, bz])}. ${who[1]} fliegen von links herein.</p>`),
      figs: `<div class="fig">${P.selectorFig({ Edown, bz, q, sym: who[2] })}</div>`,
      questions: [
        choice('v', L('(a) the speed of the particles that pass straight through', '(a) die Geschwindigkeit der Teilchen, die gerade durchfliegen'), vals),
        choice('fast', L('(b) A faster particle of the same kind is deflected', '(b) Ein schnelleres Teilchen derselben Art wird abgelenkt'), three(plate(mag), howFast)),
        choice('heavy', L('(c) A particle with twice the mass (same charge, speed v = E/B) flies', '(c) Ein Teilchen mit doppelter Masse (gleiche Ladung, Geschwindigkeit v = E/B) fliegt'), three(L('straight through', 'gerade durch'), howSame)),
        choice('sign', L('(d) A particle with a charge of the opposite sign and the speed v = E/B flies', '(d) Ein Teilchen mit einer Ladung umgekehrten Vorzeichens und der Geschwindigkeit v = E/B fliegt'), three(L('straight through', 'gerade durch'), howSame)),
      ],
      hints: [L('Electric force q·E, magnetic force q·v·B: in which directions do they point?', 'Elektrische Kraft q·E, magnetische Kraft q·v·B: In welche Richtungen zeigen sie?'), L('Straight through when they cancel.', 'Gerade durch, wenn sie sich aufheben.'), L('Only the magnetic force depends on the speed.', 'Nur die magnetische Kraft hängt von der Geschwindigkeit ab.')],
      solution: [how, howFast, howSame], p: { q, Edown, E, B, who: who[0] },
    };
  }

  // ---------------------------------------------------------------- statements
  const BANK = [
    [() => L('The magnetic force does no work on a moving charge.', 'Die magnetische Kraft verrichtet an einer bewegten Ladung keine Arbeit.'), true, () => L('It is always perpendicular to the velocity.', 'Sie steht immer senkrecht zur Geschwindigkeit.')],
    [() => L('In a magnetic field, the speed of a charge stays the same.', 'In einem Magnetfeld bleibt der Betrag der Geschwindigkeit einer Ladung gleich.'), true, () => L('The force changes only the direction of motion.', 'Die Kraft ändert nur die Bewegungsrichtung.')],
    [() => L('A magnetic field can speed up a charge at rest.', 'Ein Magnetfeld kann eine ruhende Ladung beschleunigen.'), false, () => L('There is no magnetic force on a charge at rest.', 'Auf eine ruhende Ladung wirkt keine magnetische Kraft.')],
    [() => L('A charge moving along the field lines feels no magnetic force.', 'Eine Ladung, die sich längs der Feldlinien bewegt, spürt keine magnetische Kraft.'), true, () => L('The force needs a part of the velocity across the field.', 'Die Kraft braucht einen Teil der Geschwindigkeit quer zum Feld.')],
    [() => L('The magnetic force on a charge points along the field lines.', 'Die magnetische Kraft auf eine Ladung zeigt längs der Feldlinien.'), false, () => L('It is perpendicular to the field.', 'Sie steht senkrecht zum Feld.')],
    [() => L('Twice as fast, a charge circles in the same field on a circle twice as large.', 'Doppelt so schnell kreist eine Ladung im selben Feld auf einem doppelt so grossen Kreis.'), true, () => L('r = m·v/(q·B).', 'r = m·v/(q·B).')],
    [() => L('Twice as fast, a charge needs twice the time for one turn.', 'Doppelt so schnell braucht eine Ladung die doppelte Zeit für einen Umlauf.'), false, () => L('T = 2π·m/(q·B) does not depend on the speed.', 'T = 2π·m/(q·B) hängt nicht von der Geschwindigkeit ab.')],
    [() => L('An electron and a proton at the same speed in the same field circle in opposite directions.', 'Ein Elektron und ein Proton mit derselben Geschwindigkeit kreisen im selben Feld in entgegengesetzte Richtungen.'), true, () => L('Their charges have opposite signs.', 'Ihre Ladungen haben entgegengesetzte Vorzeichen.')],
    [() => L('An electron and a proton at the same speed in the same field circle on equal circles.', 'Ein Elektron und ein Proton mit derselben Geschwindigkeit kreisen im selben Feld auf gleich grossen Kreisen.'), false, () => L('The electron is about 1800 times lighter: its circle is much smaller.', 'Das Elektron ist etwa 1800-mal leichter: Sein Kreis ist viel kleiner.')],
    [() => L('Two parallel wires with currents in the same direction attract each other.', 'Zwei parallele Drähte mit Strömen in derselben Richtung ziehen sich an.'), true, () => GRIP()],
    [() => L('Two parallel wires with currents in opposite directions attract each other.', 'Zwei parallele Drähte mit Strömen in entgegengesetzter Richtung ziehen sich an.'), false, () => L('Opposite currents repel each other.', 'Entgegengesetzte Ströme stossen sich ab.')],
    [() => L('A neutral particle is not deflected by a magnetic field.', 'Ein neutrales Teilchen wird von einem Magnetfeld nicht abgelenkt.'), true, () => L('The force is proportional to the charge.', 'Die Kraft ist proportional zur Ladung.')],
    [() => L('In a uniform field, a charge that starts at an angle to the field moves on a helix.', 'In einem homogenen Feld bewegt sich eine Ladung, die schräg zum Feld startet, auf einer Schraubenlinie.'), true, () => L('It circles across the field and moves on along it.', 'Sie kreist quer zum Feld und bewegt sich längs des Feldes weiter.')],
    [() => L('The magnetic force increases the kinetic energy of a charge circling in a field.', 'Die magnetische Kraft erhöht die kinetische Energie einer Ladung, die in einem Feld kreist.'), false, () => L('It does no work: the speed stays the same.', 'Sie verrichtet keine Arbeit: Der Betrag der Geschwindigkeit bleibt gleich.')],
    [() => L('For a negative charge, the force points the other way than for a positive one.', 'Bei einer negativen Ladung zeigt die Kraft in die Gegenrichtung als bei einer positiven.'), true, () => L(`${LAW()} changes sign with q: hence the left hand.`, `${LAW()} wechselt mit q das Vorzeichen: daher die linke Hand.`)],
    [() => L('The magnetic force on a current-carrying wire is perpendicular to the wire.', 'Die magnetische Kraft auf einen stromdurchflossenen Draht steht senkrecht zum Draht.'), true, () => L('Like the force on a moving charge, it is perpendicular to the current and to the field.', 'Wie die Kraft auf eine bewegte Ladung steht sie senkrecht zum Strom und zum Feld.')],
    [() => L('A wire carrying a current along the field lines feels no magnetic force.', 'Ein Draht, dessen Strom längs der Feldlinien fliesst, spürt keine magnetische Kraft.'), true, () => L('The current must have a part across the field.', 'Der Strom muss einen Teil quer zum Feld haben.')],
    [() => L('The field of a long straight current points away from the wire.', 'Das Feld eines langen geraden Stroms zeigt vom Draht weg.'), false, () => L('Its field lines are circles around the wire.', 'Seine Feldlinien sind Kreise um den Draht.')],
    [() => L('The field of a long straight current gets weaker further from the wire.', 'Das Feld eines langen geraden Stroms wird mit dem Abstand vom Draht schwächer.'), true, () => L('B = μ₀·I/(2π·r).', 'B = μ₀·I/(2π·r).')],
    [() => L('In a field twice as strong, a charge circles on a circle half as large.', 'In einem doppelt so starken Feld kreist eine Ladung auf einem halb so grossen Kreis.'), true, () => L('r = m·v/(q·B).', 'r = m·v/(q·B).')],
    [() => L('In a field twice as strong, a charge needs twice the time for one turn.', 'In einem doppelt so starken Feld braucht eine Ladung die doppelte Zeit für einen Umlauf.'), false, () => L('T = 2π·m/(q·B): the period halves.', 'T = 2π·m/(q·B): Die Umlaufzeit halbiert sich.')],
    [() => L('With the same charge and speed, a heavier particle moves on a larger circle.', 'Bei gleicher Ladung und Geschwindigkeit bewegt sich ein schwereres Teilchen auf einem grösseren Kreis.'), true, () => L('r = m·v/(q·B) grows with the mass.', 'r = m·v/(q·B) wächst mit der Masse.')],
    [() => L('A velocity selector lets through only particles of one particular mass.', 'Ein Geschwindigkeitsfilter lässt nur Teilchen einer bestimmten Masse durch.'), false, () => L('It lets through all particles with v = E/B, whatever their mass and charge.', 'Es lässt alle Teilchen mit v = E/B durch, unabhängig von Masse und Ladung.')],
    [() => L('A charge that starts at an angle to a uniform field keeps the part of its velocity along the field.', 'Eine Ladung, die schräg zu einem homogenen Feld startet, behält den Teil ihrer Geschwindigkeit längs des Feldes.'), true, () => L('Along the field there is no force.', 'Längs des Feldes gibt es keine Kraft.')],
    [() => L('Where the field gets stronger, a circling charge moves on tighter circles.', 'Wo das Feld stärker wird, bewegt sich eine kreisende Ladung auf engeren Kreisen.'), true, () => L('r = m·v/(q·B) shrinks as B grows.', 'r = m·v/(q·B) wird kleiner, wenn B wächst.')],
    [() => L('The force on a moving charge is largest when it moves perpendicular to the field.', 'Die Kraft auf eine bewegte Ladung ist am grössten, wenn sie sich senkrecht zum Feld bewegt.'), true, () => L('F = q·v·B·sin α, largest for α = 90°.', 'F = q·v·B·sin α, am grössten für α = 90°.')],
    [() => L('An electron beam and a proton beam with the same velocity are deflected the same way.', 'Ein Elektronenstrahl und ein Protonenstrahl mit derselben Geschwindigkeit werden in dieselbe Richtung abgelenkt.'), false, () => L('Their charges have opposite signs: they are deflected in opposite directions.', 'Ihre Ladungen haben entgegengesetzte Vorzeichen: Sie werden in entgegengesetzte Richtungen abgelenkt.')],
    [() => L('Two electrons moving side by side in the same direction attract each other magnetically.', 'Zwei Elektronen, die sich nebeneinander in dieselbe Richtung bewegen, ziehen sich magnetisch an.'), true, () => L('Like two parallel currents (though the electric repulsion between them is much stronger).', 'Wie zwei parallele Ströme (allerdings ist die elektrische Abstossung zwischen ihnen viel stärker).')],
    [() => L('A very strong magnetic field exerts a force on a charge at rest.', 'Ein sehr starkes Magnetfeld übt eine Kraft auf eine ruhende Ladung aus.'), false, () => L('Without motion there is no magnetic force, however strong the field.', 'Ohne Bewegung gibt es keine magnetische Kraft, wie stark das Feld auch ist.')],
    [() => L('In a cyclotron, the frequency must be raised as the protons get faster.', 'In einem Zyklotron muss die Frequenz erhöht werden, wenn die Protonen schneller werden.'), false, () => L('The period T = 2π·m/(q·B) does not depend on the speed (as long as the protons are much slower than light).', 'Die Umlaufzeit T = 2π·m/(q·B) hängt nicht von der Geschwindigkeit ab (solange die Protonen viel langsamer als das Licht sind).')],
  ];
  function statements(seed) {
    const r = rng(seed * 73 + 43);
    for (;;) {
      const pick = r.shuffle(BANK.slice()).slice(0, 5);
      if (pick.every((s) => s[1]) || pick.every((s) => !s[1])) continue;
      return {
        kind: 'stmts', title: L('Which statements are correct?', 'Welche Aussagen sind richtig?'),
        text: L('<p>Tick all the statements that are correct.</p>', '<p>Kreuze alle richtigen Aussagen an.</p>'), figs: '',
        questions: [{ type: 'multi', key: 's', label: L('Which statements are correct?', 'Welche Aussagen sind richtig?'), statements: pick.map(([h, ok, why]) => ({ html: h(), ok, why: why() })) }],
        hints: [PERP(), L('r = m·v/(q·B) and T = 2π·m/(q·B).', 'r = m·v/(q·B) und T = 2π·m/(q·B).')],
        solution: pick.map(([h, ok, why]) => `${ok ? '✓' : '✗'} ${h()} ${why()}`), p: { s: pick.map((s) => BANK.indexOf(s)) },
      };
    }
  }

  // ---------------------------------------------------------------- all types
  const TYPES = {
    'dir-current': [1, (s) => dirForce('I', s)], 'dir-particle': [2, (s) => dirForce('v', s)], 'dir-missing': [3, dirMissing],
    'pair-parallel': [2, (s) => pair('parallel', s)], 'pair-angle': [3, (s) => pair('angle', s)], 'pair-particles': [4, (s) => pair('particles', s)],
    'path-circle': [2, pathCircle], 'path-helix': [3, pathHelix], 'path-gradient': [4, pathGradient],
    'radius-compare': [2, radiusCompare], 'radius-num': [3, radiusNum], tracks: [3, tracks],
    selector: [3, selector], stmts: [2, statements],
  };
  function make(type, seed) {
    const [difficulty, f] = TYPES[type];
    return { ...f(seed), type, difficulty, id: `${type}-${seed}`, seed };
  }

  const api = { TYPES: Object.keys(TYPES), make, vec, LAW, dirName, howForce, RULE, PERP, GRIP, hand, signName, tile, sci, nice, show, values, PNAME };
  root.MagEx = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
