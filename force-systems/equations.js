// The equations of each situation (scenarios.js): Newton's second law for a chosen system along
// one axis, and the law of friction. Each is a choice of four (see identify.js): the right equation
// and three with a typical wrong idea, flagged:
//   flatN     normal force taken equal to the weight     rope      rope force taken equal to a weight
//   noFric    friction forgotten                         noSlope   component down the slope forgotten
//   swap      sine and cosine swapped                    whole     whole force instead of a component
//   internal  an internal force in the whole system      mass      the mass of another system
//   pass      the whole pull passed on                   balance   forces balanced while accelerating
//   axis, dir, noK, fric, other: slips without a name (an acceleration where there is none, a
//   sign, a missing rope or contact force, the law of friction, a force on the wrong box).
// Equations.of(id, p) gives [{ key, what, options: [{ html, right, flag, why, n }], value, sys, want,
// extra }]: sys names the system, want the force between the boxes the equation contains ('S' or
// 'K'); extra marks the equation of both boxes together where practice does without it.
(function (root) {
  'use strict';

  const FS = root.FS, { L, tex: T } = FS;

  const WHY = {
    flatN: () => L('The normal force is not equal to the weight here: it balances only what presses the box onto the surface (and friction is μ times the normal force).', 'Die Normalkraft ist hier nicht gleich der Gewichtskraft: Sie hält nur dem das Gleichgewicht, was die Kiste auf die Unterlage drückt (und die Reibung ist μ mal die Normalkraft).'),
    rope: () => L('The rope force is not equal to the weight of the hanging box: the box accelerates, so the rope does not hold it in balance.', 'Die Seilkraft ist nicht gleich der Gewichtskraft der hängenden Kiste: Die Kiste wird beschleunigt, also hält ihr das Seil nicht das Gleichgewicht.'),
    noFric: () => L('Friction is missing: it acts against the motion.', 'Die Reibung fehlt: Sie wirkt gegen die Bewegung.'),
    noSlope: () => L('The component of the weight down the slope is missing.', 'Die Hangabtriebskraft fehlt.'),
    swap: () => L('Sine and cosine swapped: the component next to the angle is the force times cos α, the one opposite it times sin α.', 'Sinus und Kosinus vertauscht: Die Komponente am Winkel ist die Kraft mal cos α, die gegenüber mal sin α.'),
    whole: () => L('Only a component of the pull acts along this axis.', 'Entlang dieser Achse wirkt nur eine Komponente der Zugkraft.'),
    internal: () => L('For both boxes together, the forces between them are internal forces: they cancel and do not appear.', 'Für beide Kisten zusammen sind die Kräfte zwischen ihnen innere Kräfte: Sie heben sich auf und kommen nicht vor.'),
    mass: () => L('m a belongs to the system whose forces you add: take the mass of that system.', 'm a gehört zum System, dessen Kräfte du addierst: Nimm die Masse dieses Systems.'),
    pass: () => L('The box in front does not pass on the whole force: part of it accelerates the box itself.', 'Die vordere Kiste gibt nicht die ganze Kraft weiter: Ein Teil davon beschleunigt die Kiste selbst.'),
    balance: () => L('The box accelerates: along the motion the forces do not balance, they add up to m a.', 'Die Kiste wird beschleunigt: Entlang der Bewegung heben sich die Kräfte nicht auf, sie ergeben zusammen m a.'),
    axis: () => L('Nothing accelerates perpendicular to the motion: there the forces balance.', 'Senkrecht zur Bewegung wird nichts beschleunigt: Dort heben sich die Kräfte auf.'),
    dir: () => L('A sign is wrong: a force against the positive direction counts negative.', 'Ein Vorzeichen stimmt nicht: Eine Kraft gegen die positive Richtung zählt negativ.'),
    noK: () => L('The rope or contact force on this box is missing.', 'Die Seil- oder Kontaktkraft auf diese Kiste fehlt.'),
    fric: () => L('Kinetic friction is the friction coefficient times the normal force.', 'Die Gleitreibung ist die Reibungszahl mal die Normalkraft.'),
    other: () => L('That force does not act on this box.', 'Diese Kraft wirkt nicht auf diese Kiste.'),
  };

  // An equation to choose: wrongs [[TeX, flag, why]] (why: if the flag's does not say it well).
  // The options are sorted by their text, so that the right one is not always first; n is their
  // place before (0 the right one), the same in both languages.
  function eq(key, what, right, note, wrongs, more = {}) {
    const options = [{ html: `$${right}$`, right: true, n: 0 }, ...wrongs.map(([tex, flag, why], k) => ({ html: `$${tex}$`, right: false, flag, why: why || WHY[flag](), n: k + 1 }))];
    options.sort((a, b) => (a.html < b.html ? -1 : 1));
    return { key, what, options, value: `$${right}$. ${note}`, ...more };
  }

  const mg = (i = '') => `m${i ? `_${i}` : ''}\\,g`, ma = (i = '') => `m${i ? `_${i}` : ''}\\,a`;
  const Ma = '(m_1 + m_2)\\,a', sin = '\\sin\\alpha', cos = '\\cos\\alpha';

  const EQS = {
    'rest-up': (p, N, R, S, K, F) => {
      const up = p.dir === 'up';
      return [eq('v', L('The box, vertically (upwards positive):', 'Die Kiste, senkrecht (nach oben positiv):'),
        `${N} ${up ? '+' : '-'} ${F} - ${mg()} = 0`,
        up ? L('The rope carries part of the weight, so the floor pushes less than the weight.', 'Das Seil trägt einen Teil der Gewichtskraft, darum drückt der Boden weniger als die Gewichtskraft.')
          : L('The floor holds the box and the hand, so it pushes more than the weight.', 'Der Boden hält die Kiste und die Hand, darum drückt er mehr als die Gewichtskraft.'),
        [[`${N} - ${mg()} = 0`, 'flatN'], [`${N} ${up ? '-' : '+'} ${F} - ${mg()} = 0`, 'dir'],
          up ? [`${F} - ${mg()} = 0`, 'noK', L('The normal force of the floor is missing.', 'Die Normalkraft des Bodens fehlt.')] : [`${N} - ${F} = 0`, 'other', L('The weight is missing.', 'Die Gewichtskraft fehlt.')]])];
    },
    'rest-angle': (p, N, R, S, K, F) => {
      const [up, side] = p.ref === 'v' ? ['\\cos', '\\sin'] : ['\\sin', '\\cos'];
      return [
        eq('v', L('The box, vertically (upwards positive):', 'Die Kiste, senkrecht (nach oben positiv):'), `${N} + ${F}${up}\\alpha - ${mg()} = 0`,
          L('The box stands still: the normal force and the vertical component of the pull together balance the weight.', 'Die Kiste ruht: Die Normalkraft und die senkrechte Komponente der Zugkraft halten zusammen der Gewichtskraft das Gleichgewicht.'),
          [[`${N} - ${mg()} = 0`, 'flatN'], [`${N} + ${F}${side}\\alpha - ${mg()} = 0`, 'swap'], [`${N} + ${F} - ${mg()} = 0`, 'whole']]),
        eq('h', L('The box, horizontally (in the direction of the pull positive):', 'Die Kiste, waagrecht (in Richtung der Zugkraft positiv):'), `${F}${side}\\alpha - ${R} = 0`,
          L('Static friction is just as large as the horizontal component of the pull.', 'Die Haftreibung ist genau so gross wie die waagrechte Komponente der Zugkraft.'),
          [[`${F} - ${R} = 0`, 'whole'], [`${F}${up}\\alpha - ${R} = 0`, 'swap'], [`${F}${side}\\alpha + ${R} = 0`, 'dir']]),
      ];
    },
    'pull-friction': (p, N, R, S, K, F) => [
      eq('v', L('The box, vertically:', 'Die Kiste, senkrecht:'), `${N} - ${mg()} = 0`,
        L('Nothing accelerates vertically, and the pull is horizontal: here the normal force equals the weight.', 'Senkrecht wird nichts beschleunigt, und die Zugkraft ist waagrecht: Hier ist die Normalkraft gleich der Gewichtskraft.'),
        [[`${N} - ${mg()} = ${ma()}`, 'axis'], [`${N} + ${F} - ${mg()} = 0`, 'other', L('The pull is horizontal: it has no vertical part.', 'Die Zugkraft ist waagrecht: Sie hat keinen senkrechten Teil.')],
          [`${N} - ${mg()} - ${R} = 0`, 'other', L('Friction acts along the floor, not vertically.', 'Die Reibung wirkt entlang des Bodens, nicht senkrecht.')]]),
      eq('fric', L('The friction on the box:', 'Die Reibung auf die Kiste:'), `${R} = ${T('mu')}\\,${N}`,
        L('Kinetic friction: the friction coefficient times the normal force.', 'Gleitreibung: die Reibungszahl mal die Normalkraft.'),
        [[`${R} = ${T('mu')}\\,${F}`, 'fric'], [`${R} = ${T('mu')}\\,${ma()}`, 'fric'], [`${R} = ${F}`, 'fric']]),
      eq('h', L('The box, horizontally (in the direction of motion positive):', 'Die Kiste, waagrecht (in Bewegungsrichtung positiv):'), `${F} - ${R} = ${ma()}`,
        L('The pull minus friction is the net force, which accelerates the box.', 'Die Zugkraft minus die Reibung ist die resultierende Kraft, die die Kiste beschleunigt.'),
        [[`${F} = ${ma()}`, 'noFric'], [`${F} + ${R} = ${ma()}`, 'dir'], [`${F} - ${R} = 0`, 'balance']]),
    ],
    'push-pair': (p, N, R, S, K, F) => {
      const fr = p.mu > 0, f = (m) => (fr ? ` - ${T('mu')}\\,${m}\\,g` : ''), fM = f('(m_1 + m_2)'), f1 = f('m_1'), f2 = f('m_2');
      return [
        eq('both', L('Both boxes together, horizontally (to the right positive):', 'Beide Kisten zusammen, waagrecht (nach rechts positiv):'), `${F}${fM} = ${Ma}`,
          L('The contact forces between the boxes are internal forces: they cancel.', 'Die Kontaktkräfte zwischen den Kisten sind innere Kräfte: Sie heben sich auf.'),
          [[`${F} - ${K}${fM} = ${Ma}`, 'internal'], [`${F}${fM} = ${ma(1)}`, 'mass'], fr ? [`${F} = ${Ma}`, 'noFric'] : [`${F} + ${K} = ${Ma}`, 'internal']],
          { sys: L('both boxes together', 'beide Kisten zusammen') }),
        eq('right', L('The right box alone, horizontally (to the right positive):', 'Die rechte Kiste allein, waagrecht (nach rechts positiv):'), `${K}${f2} = ${ma(2)}`,
          L(`Only the contact force${fr ? ', minus its own friction,' : ''} accelerates the right box.`, `Nur die Kontaktkraft${fr ? ', abzüglich ihrer eigenen Reibung,' : ''} beschleunigt die rechte Kiste.`),
          [[`${K} = ${F}`, 'pass'], [`${F} - ${K}${f2} = ${ma(2)}`, 'other', L('The push acts on the left box only.', 'Die äussere Kraft wirkt nur auf die linke Kiste.')], [`${K}${f2} = ${Ma}`, 'mass']],
          { sys: L('the right box alone', 'die rechte Kiste allein'), want: 'K' }),
        eq('left', L('The left box alone, horizontally (to the right positive):', 'Die linke Kiste allein, waagrecht (nach rechts positiv):'), `${F} - ${K}${f1} = ${ma(1)}`,
          L('The right box pushes back on the left box with the contact force.', 'Die rechte Kiste drückt mit der Kontaktkraft auf die linke Kiste zurück.'),
          [[`${F}${f1} = ${ma(1)}`, 'noK'], [`${F} + ${K}${f1} = ${ma(1)}`, 'dir'], [`${F} - ${K}${f1} = 0`, 'balance']],
          { sys: L('the left box alone', 'die linke Kiste allein'), want: 'K' }),
      ];
    },
    'rope-pair': (p, N, R, S, K, F) => {
      const R1 = T('R', 1), r2 = p.mu2 > 0 ? ` - ${T('R', 2)}` : '';
      return [
        eq('both', L('Both boxes together, horizontally (to the right positive):', 'Beide Kisten zusammen, waagrecht (nach rechts positiv):'), `${F} - ${R1}${r2} = ${Ma}`,
          L('The rope forces are internal forces: they cancel.', 'Die Seilkräfte sind innere Kräfte: Sie heben sich auf.'),
          [[`${F} - ${S} - ${R1}${r2} = ${Ma}`, 'internal'], [`${F} - ${R1}${r2} = ${ma(2)}`, 'mass'], [`${F} = ${Ma}`, 'noFric']],
          { sys: L('both boxes together', 'beide Kisten zusammen') }),
        eq('left', L('The left box alone, horizontally (to the right positive):', 'Die linke Kiste allein, waagrecht (nach rechts positiv):'), `${S} - ${R1} = ${ma(1)}`,
          L('Only the rope pulls the left box forward; its friction holds it back.', 'Nur das Seil zieht die linke Kiste nach vorn; ihre Reibung hält sie zurück.'),
          [[`${F} - ${R1} = ${ma(1)}`, 'pass', L('The pull acts on the right box; the left box is pulled by the rope only, with less than the pull.', 'Die Zugkraft wirkt auf die rechte Kiste; die linke Kiste zieht nur das Seil, mit weniger als der Zugkraft.')],
            [`${S} - ${R1} = ${Ma}`, 'mass'], [`${S} = ${ma(1)}`, 'noFric']],
          { sys: L('the left box alone', 'die linke Kiste allein'), want: 'S' }),
        eq('right', L('The right box alone, horizontally (to the right positive):', 'Die rechte Kiste allein, waagrecht (nach rechts positiv):'), `${F} - ${S}${r2} = ${ma(2)}`,
          L('The rope pulls the right box back.', 'Das Seil zieht die rechte Kiste zurück.'),
          [[`${F}${r2} = ${ma(2)}`, 'noK'], [`${F} + ${S}${r2} = ${ma(2)}`, 'dir'], [`${F} - ${S}${r2} = 0`, 'balance']],
          { sys: L('the right box alone', 'die rechte Kiste allein'), want: 'S' }),
      ];
    },
    atwood: (p, N, R, S, K, F) => {
      const h = p.m1 > p.m2 ? 1 : 2, l = 3 - h, side = (i) => (i === 1 ? L('left', 'links') : L('right', 'rechts'));
      return [
        eq('light', L(`The lighter box (${side(l)}) alone (upwards positive):`, `Die leichtere Kiste (${side(l)}) allein (nach oben positiv):`), `${S} - ${mg(l)} = ${ma(l)}`,
          L('The lighter box accelerates upwards: the rope pulls it with more than its weight.', 'Die leichtere Kiste wird nach oben beschleunigt: Das Seil zieht sie mit mehr als ihrer Gewichtskraft.'),
          [[`${S} - ${mg(l)} = 0`, 'rope', L('The rope force is not equal to the weight of the box: the box accelerates, so the rope does not hold it in balance.', 'Die Seilkraft ist nicht gleich der Gewichtskraft der Kiste: Die Kiste wird beschleunigt, also hält ihr das Seil nicht das Gleichgewicht.')],
            [`${S} + ${mg(l)} = ${ma(l)}`, 'dir'], [`${S} - ${mg(l)} = ${Ma}`, 'mass']],
          { sys: L('the lighter box alone', 'die leichtere Kiste allein'), want: 'S' }),
        eq('heavy', L(`The heavier box (${side(h)}) alone (downwards positive):`, `Die schwerere Kiste (${side(h)}) allein (nach unten positiv):`), `${mg(h)} - ${S} = ${ma(h)}`,
          L('The heavier box accelerates downwards: the rope holds it with less than its weight.', 'Die schwerere Kiste wird nach unten beschleunigt: Das Seil hält sie mit weniger als ihrer Gewichtskraft.'),
          [[`${mg(h)} - ${S} = 0`, 'rope'], [`${mg(h)} = ${ma(h)}`, 'noK'], [`${mg(h)} + ${S} = ${ma(h)}`, 'dir']],
          { sys: L('the heavier box alone', 'die schwerere Kiste allein'), want: 'S' }),
        eq('both', L('Both boxes together, along the rope (towards the heavier box positive):', 'Beide Kisten zusammen, entlang des Seils (zur schwereren Kiste hin positiv):'), `${mg(h)} - ${mg(l)} = ${Ma}`,
          L('The difference of the weights accelerates both boxes; the rope forces are internal.', 'Die Differenz der Gewichtskräfte beschleunigt beide Kisten; die Seilkräfte sind innere Kräfte.'),
          [[`${mg(h)} - ${mg(l)} = ${ma(h)}`, 'mass'], [`${mg(h)} = ${Ma}`, 'other', L('The weight of the lighter box acts against the motion.', 'Die Gewichtskraft der leichteren Kiste wirkt gegen die Bewegung.')], [`${mg(h)} - ${S} = ${Ma}`, 'internal']],
          { sys: L('both boxes together', 'beide Kisten zusammen') }),
      ];
    },
    'table-pulley': (p, N, R, S, K, F) => {
      const only = L('Only the box on the table rubs, and its normal force is its own weight.', 'Nur die Kiste auf dem Tisch reibt, und ihre Normalkraft ist ihre eigene Gewichtskraft.');
      return [
        eq('fric', L('The friction on the box on the table:', 'Die Reibung auf die Kiste auf dem Tisch:'), `${R} = ${T('mu')}\\,${mg(1)}`,
          L('The table is level, so the normal force on the box equals its weight.', 'Der Tisch ist waagrecht, also ist die Normalkraft auf die Kiste gleich ihrer Gewichtskraft.'),
          [[`${R} = ${T('mu')}\\,(m_1 + m_2)\\,g`, 'fric', only], [`${R} = ${T('mu')}\\,${mg(2)}`, 'fric', only], [`${R} = ${T('mu')}\\,${ma(1)}`, 'fric']]),
        eq('table', L('The box on the table alone, horizontally (towards the pulley positive):', 'Die Kiste auf dem Tisch allein, waagrecht (zur Rolle hin positiv):'), `${S} - ${R} = ${ma(1)}`,
          L('The rope pulls the box forward, friction holds it back.', 'Das Seil zieht die Kiste nach vorn, die Reibung hält sie zurück.'),
          [[`${mg(2)} - ${R} = ${ma(1)}`, 'rope'], [`${S} = ${ma(1)}`, 'noFric'], [`${S} - ${R} = ${Ma}`, 'mass']],
          { sys: L('the box on the table alone', 'die Kiste auf dem Tisch allein'), want: 'S' }),
        eq('hanging', L('The hanging box alone (downwards positive):', 'Die hängende Kiste allein (nach unten positiv):'), `${mg(2)} - ${S} = ${ma(2)}`,
          L('The hanging box accelerates downwards: the rope holds it with less than its weight.', 'Die hängende Kiste wird nach unten beschleunigt: Das Seil hält sie mit weniger als ihrer Gewichtskraft.'),
          [[`${mg(2)} - ${S} = 0`, 'rope'], [`${mg(2)} - ${S} - ${R} = ${ma(2)}`, 'other', L('Friction acts on the box on the table, not on the hanging box.', 'Die Reibung wirkt auf die Kiste auf dem Tisch, nicht auf die hängende Kiste.')], [`${mg(2)} - ${S} = ${Ma}`, 'mass']],
          { sys: L('the hanging box alone', 'die hängende Kiste allein'), want: 'S' }),
        eq('both', L('Both boxes together, along the rope:', 'Beide Kisten zusammen, entlang des Seils:'), `${mg(2)} - ${R} = ${Ma}`,
          L('The weight of the hanging box drives both boxes, friction acts against it; the rope forces are internal.', 'Die Gewichtskraft der hängenden Kiste treibt beide Kisten an, die Reibung wirkt dagegen; die Seilkräfte sind innere Kräfte.'),
          [[`${mg(2)} - ${R} = ${ma(2)}`, 'mass'], [`${mg(2)} = ${Ma}`, 'noFric'], [`${mg(2)} - ${S} - ${R} = ${Ma}`, 'internal']],
          { sys: L('both boxes together', 'beide Kisten zusammen'), extra: true }),
      ];
    },
    'incline-pull': (p, N, R, S, K, F) => {
      const rhs = p.a ? ma() : '0';
      return [
        eq('perp', L('The box, perpendicular to the slope:', 'Die Kiste, senkrecht zur Unterlage:'), `${N} - ${mg()}${cos} = 0`,
          L('Nothing accelerates into the slope: the normal force balances the component of the weight perpendicular to it.', 'In die Unterlage hinein wird nichts beschleunigt: Die Normalkraft hält der Komponente der Gewichtskraft senkrecht zur Unterlage das Gleichgewicht.'),
          [[`${N} - ${mg()} = 0`, 'flatN'], [`${N} - ${mg()}${sin} = 0`, 'swap'], p.a ? [`${N} - ${mg()}${cos} = ${ma()}`, 'axis'] : [`${N} + ${mg()}${cos} = 0`, 'dir']]),
        eq('fric', L('The friction on the box:', 'Die Reibung auf die Kiste:'), `${R} = ${T('mu')}\\,${mg()}${cos}`,
          L('Friction is μ times the normal force, which on the slope is m g cos α.', 'Die Reibung ist μ mal die Normalkraft, und die ist auf der schiefen Ebene m g cos α.'),
          [[`${R} = ${T('mu')}\\,${mg()}`, 'flatN'], [`${R} = ${T('mu')}\\,${mg()}${sin}`, 'swap'], [`${R} = ${T('mu')}\\,${F}`, 'fric']]),
        eq('along', L('The box, along the slope (up the slope positive):', 'Die Kiste, entlang der Unterlage (hangaufwärts positiv):'), `${F} - ${mg()}${sin} - ${R} = ${rhs}`,
          p.a ? L('The pull, the component down the slope and friction together accelerate the box.', 'Zugkraft, Hangabtriebskraft und Reibung zusammen beschleunigen die Kiste.')
            : L('At constant speed, the forces along the slope balance.', 'Bei konstanter Geschwindigkeit heben sich die Kräfte entlang der Unterlage auf.'),
          [[`${F} - ${R} = ${rhs}`, 'noSlope'], [`${F} - ${mg()}${sin} = ${rhs}`, 'noFric'], [`${F} - ${mg()}${cos} - ${R} = ${rhs}`, 'swap']]),
      ];
    },
    'incline-pulley': (p, N, R, S, K, F) => [
      eq('perp', L('The box on the slope, perpendicular to the slope:', 'Die Kiste auf dem Hang, senkrecht zur Unterlage:'), `${N} - ${mg(1)}${cos} = 0`,
        L('The normal force balances the component of the weight perpendicular to the slope.', 'Die Normalkraft hält der Komponente der Gewichtskraft senkrecht zur Unterlage das Gleichgewicht.'),
        [[`${N} - ${mg(1)} = 0`, 'flatN'], [`${N} - ${mg(1)}${sin} = 0`, 'swap'], [`${N} - ${mg(1)}${cos} = ${ma(1)}`, 'axis']]),
      eq('fric', L('The friction on the box on the slope:', 'Die Reibung auf die Kiste auf dem Hang:'), `${R} = ${T('mu')}\\,${mg(1)}${cos}`,
        L('Friction is μ times the normal force, which on the slope is m₁ g cos α.', 'Die Reibung ist μ mal die Normalkraft, und die ist auf der schiefen Ebene m₁ g cos α.'),
        [[`${R} = ${T('mu')}\\,${mg(1)}`, 'flatN'], [`${R} = ${T('mu')}\\,${mg(1)}${sin}`, 'swap'], [`${R} = ${T('mu')}\\,${S}`, 'fric']]),
      eq('along', L('The box on the slope alone, along the slope (up the slope positive):', 'Die Kiste auf dem Hang allein, entlang der Unterlage (hangaufwärts positiv):'), `${S} - ${mg(1)}${sin} - ${R} = ${ma(1)}`,
        L('The rope pulls the box up the slope; the component down the slope and friction act against it.', 'Das Seil zieht die Kiste hangaufwärts; Hangabtriebskraft und Reibung wirken dagegen.'),
        [[`${mg(2)} - ${mg(1)}${sin} - ${R} = ${ma(1)}`, 'rope'], [`${S} - ${R} = ${ma(1)}`, 'noSlope'], [`${S} - ${mg(1)}${sin} = ${ma(1)}`, 'noFric']],
        { sys: L('the box on the slope alone', 'die Kiste auf dem Hang allein'), want: 'S' }),
      eq('hanging', L('The hanging box alone (downwards positive):', 'Die hängende Kiste allein (nach unten positiv):'), `${mg(2)} - ${S} = ${ma(2)}`,
        L('The hanging box accelerates downwards: the rope holds it with less than its weight.', 'Die hängende Kiste wird nach unten beschleunigt: Das Seil hält sie mit weniger als ihrer Gewichtskraft.'),
        [[`${mg(2)} - ${S} = 0`, 'rope'], [`${mg(2)} - ${S} = ${Ma}`, 'mass'], [`${mg(2)} + ${S} = ${ma(2)}`, 'dir']],
        { sys: L('the hanging box alone', 'die hängende Kiste allein'), want: 'S' }),
      eq('both', L('Both boxes together, along the rope:', 'Beide Kisten zusammen, entlang des Seils:'), `${mg(2)} - ${mg(1)}${sin} - ${R} = ${Ma}`,
        L('The weight of the hanging box drives both boxes; the component down the slope and friction act against it.', 'Die Gewichtskraft der hängenden Kiste treibt beide Kisten an; Hangabtriebskraft und Reibung wirken dagegen.'),
        [[`${mg(2)} - ${mg(1)}${sin} - ${R} = ${ma(2)}`, 'mass'], [`${mg(2)} - ${R} = ${Ma}`, 'noSlope'], [`${mg(2)} - ${S} - ${mg(1)}${sin} - ${R} = ${Ma}`, 'internal']],
        { sys: L('both boxes together', 'beide Kisten zusammen'), extra: true }),
    ],
  };

  const of = (id, p) => EQS[id](p, T('N'), T('R'), T('S'), T('K'), T('F'));

  root.Equations = { of, WHY };
  if (typeof module !== 'undefined') module.exports = root.Equations;
})(typeof window !== 'undefined' ? window : globalThis);
