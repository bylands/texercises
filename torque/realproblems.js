// Problems: torques and centres of mass in everyday life and technology, told as stories, solved
// with the ideas of this app (torque = force × lever arm, balance of torques and forces, centre of
// mass). Each has random values that keep the results round, a picture of the situation and a
// diagram for the solution (artkit.js):
//   { id, difficulty, title(), make(r), solve(p, o), traps, why, fields(p), text(p), hints(p, v),
//     steps(p, v), fbd(p, v) } (the picture of the task: figures.js)
// realOf(i, seed) gives an exercise as the practice ones (generator.js).
(function (root) {
  'use strict';

  const TQ = root.TQ;
  const { L, G, tex: T, rng, pick } = TQ;
  const num = (x) => String(Number(Number(x).toFixed(3)) + 0);
  const U = { N: 'N', kg: 'kg', cm: 'cm', m: 'm', Nm: 'N·m', '': '' }, TU = { N: '\\mathrm{N}', kg: '\\mathrm{kg}', cm: '\\mathrm{cm}', m: '\\mathrm{m}', Nm: '\\mathrm{N\\,m}', '': '' };
  const q = (x, u) => (u ? `${num(x)} ${U[u]}` : num(x));
  const tq = (x, u) => (u ? `${num(x)}\\,${TU[u]}` : num(x));
  const res = (x, u) => `\\htmlClass{result}{${tq(x, u)}}`;
  const m$ = (s) => `$${s}$`;
  const step = (rule, html) => `<p class="step-rule">${rule}</p>${html}`;
  const field = (key, sym, unit, what, dec = 1) => ({ key, sym, unit, what, dec });
  const A = () => root.Art;
  const sym = (l, s = '') => `<tspan font-style="italic">${l}</tspan>${s ? `<tspan class="sub" dy="4">${s}</tspan><tspan dy="-4">\u200b</tspan>` : ''}`;
  const Fsym = (k, i = '') => { const [l, s] = { G: ['F', L('g', 'G')], N: ['F', 'N'], H: ['F', L('h', 'H')], A: ['F', 'A'], B: ['F', 'B'], M: ['F', 'M'], F: ['F', ''] }[k]; return sym(l, `${s}${i}`); };

  // ---------------------------------------------------------------- 1 a door
  const door = {
    id: 'door', difficulty: 1, title: () => L('Opening a heavy door', 'Eine schwere Tür öffnen'),
    make: (r) => ({ M: pick(r, [6, 8, 9, 10, 12, 15, 16, 18, 20]), d: pick(r, [75, 80, 90]), n: pick(r, [15, 20, 25, 30]) }),
    solve: (p, o = {}) => ({ F1: o.mult ? p.M * p.d / 100 : p.M / (p.d / 100), F2: o.mult ? p.M * p.n / 100 : p.M / (p.n / 100) }),
    traps: ['mult'],
    why: { mult: () => L('Torque = force × lever arm, so the force is the torque divided by the lever arm.', 'Drehmoment = Kraft × Hebelarm, also ist die Kraft das Drehmoment geteilt durch den Hebelarm.') },
    fields: () => [field('F1', ['F', 1], 'N', L('force at the handle', 'Kraft an der Klinke')), field('F2', ['F', 2], 'N', L('force near the hinge', 'Kraft nahe beim Scharnier'))],
    text: (p) => L(`A fire door has a door closer: to open it, you need a torque of ${q(p.M, 'Nm')} about the hinges. How hard must you push at the handle, ${q(p.d, 'cm')} from the hinges, perpendicular to the door? And how hard if you push only ${q(p.n, 'cm')} from the hinges?`,
      `Eine Brandschutztür hat einen Türschliesser: Um sie zu öffnen, braucht es ein Drehmoment von ${q(p.M, 'Nm')} bezüglich der Scharniere. Wie stark musst du an der Klinke, ${q(p.d, 'cm')} von den Scharnieren entfernt, senkrecht zur Tür drücken? Und wie stark, wenn du nur ${q(p.n, 'cm')} von den Scharnieren entfernt drückst?`),
    hints: () => [
      L('The hinges are the axis. Pushing perpendicular to the door, the lever arm is the distance from the hinges.', 'Die Scharniere sind die Drehachse. Drückst du senkrecht zur Tür, ist der Hebelarm der Abstand von den Scharnieren.'),
      L(`${m$('M = F\\cdot d')}, so ${m$('F = M/d')}. Lengths in metres!`, `${m$('M = F\\cdot d')}, also ${m$('F = M/d')}. Längen in Metern!`),
    ],
    steps: (p, v) => [
      step(L('At the handle', 'An der Klinke'), `$$F_1 = \\frac{M}{d_1} = \\frac{${tq(p.M, 'Nm')}}{${tq(p.d / 100, 'm')}} = ${res(v.F1, 'N')}$$`),
      step(L('Near the hinge', 'Nahe beim Scharnier'), `$$F_2 = \\frac{M}{d_2} = \\frac{${tq(p.M, 'Nm')}}{${tq(p.n / 100, 'm')}} = ${res(v.F2, 'N')}$$<p>${L('A shorter lever arm needs a larger force: that is why handles are far from the hinges.', 'Ein kürzerer Hebelarm braucht eine grössere Kraft: Darum sind Klinken weit weg von den Scharnieren.')}</p>`),
    ],
    fbd(p) {
      const a = A(), x0 = 40, y = 80, s = 3.2;
      return a.svg(360, 170, a.line([x0, y], [x0 + 95 * s, y], 'rp-door') + a.circle(x0, y, 6, 'rp-hinge') +
        a.arrow([x0 + p.d * s, y - 50], [0, 1], 46, 'force k-s', sym('F', '1'), [8, -30]) +
        a.arrow([x0 + p.n * s, y - 50], [0, 1], 46, 'force k-s', sym('F', '2'), [8, -30]) +
        a.dim([x0, y], [x0 + p.n * s, y], q(p.n, 'cm'), -18) + a.dim([x0, y], [x0 + p.d * s, y], q(p.d, 'cm'), -44),
      L('The door from above with the two forces', 'Die Tür von oben mit den beiden Kräften'));
    },
  };

  // ---------------------------------------------------------------- 2 a wheel nut
  const wrench = {
    id: 'wrench', difficulty: 2, title: () => L('A stuck wheel nut', 'Eine festsitzende Radmutter'),
    make: (r) => ({ M: pick(r, [100, 110, 120, 140, 150, 160, 180]), l1: pick(r, [25, 30, 40]), l2: pick(r, [60, 75, 80, 100]) }),
    solve: (p, o = {}) => ({ F1: o.mult ? p.M * p.l1 / 100 : p.M / (p.l1 / 100), F2: o.mult ? p.M * p.l2 / 100 : p.M / (p.l2 / 100) }),
    traps: ['mult'],
    why: { mult: () => L('The force is the torque divided by the lever arm, not multiplied by it.', 'Die Kraft ist das Drehmoment geteilt durch den Hebelarm, nicht mal ihn.') },
    fields: () => [field('F1', ['F', 1], 'N', L('force with the wrench', 'Kraft mit dem Schlüssel')), field('F2', ['F', 2], 'N', L('force with the pipe', 'Kraft mit dem Rohr'))],
    text: (p) => L(`A wheel nut of a car is stuck: it only turns with a torque of ${q(p.M, 'Nm')}. How hard must you push on the end of the wheel wrench, ${q(p.l1, 'cm')} from the nut, perpendicular to it? You slide a pipe over the wrench, so that you can push ${q(p.l2, 'cm')} from the nut: how hard now?`,
      `Eine Radmutter eines Autos sitzt fest: Sie dreht sich erst bei einem Drehmoment von ${q(p.M, 'Nm')}. Wie stark musst du senkrecht auf das Ende des Radschlüssels drücken, ${q(p.l1, 'cm')} von der Mutter entfernt? Du schiebst ein Rohr über den Schlüssel, sodass du ${q(p.l2, 'cm')} von der Mutter entfernt drücken kannst: Wie stark jetzt?`),
    hints: () => [L('The nut is the axis; pushing perpendicular to the wrench, the lever arm is the distance from the nut.', 'Die Mutter ist die Drehachse; drückst du senkrecht zum Schlüssel, ist der Hebelarm der Abstand von der Mutter.'), L(`${m$('F = M/d')}, with d in metres.`, `${m$('F = M/d')}, mit d in Metern.`)],
    steps: (p, v) => [
      step(L('With the wrench', 'Mit dem Schlüssel'), `$$F_1 = \\frac{M}{d_1} = \\frac{${tq(p.M, 'Nm')}}{${tq(p.l1 / 100, 'm')}} = ${res(v.F1, 'N')}$$<p>${L(`About the weight of ${num(v.F1 / G)} kg: more than most people can push with their arms.`, `Etwa die Gewichtskraft von ${num(v.F1 / G)} kg: mehr, als die meisten mit den Armen drücken können.`)}</p>`),
      step(L('With the pipe', 'Mit dem Rohr'), `$$F_2 = \\frac{M}{d_2} = \\frac{${tq(p.M, 'Nm')}}{${tq(p.l2 / 100, 'm')}} = ${res(v.F2, 'N')}$$<p>${L('A longer lever arm: the same torque with less force.', 'Ein längerer Hebelarm: dasselbe Drehmoment mit weniger Kraft.')}</p>`),
    ],
    fbd(p) {
      const a = A(), x0 = 40, y = 90, s = 3;
      return a.svg(380, 170, a.line([x0, y], [x0 + p.l2 * s, y], 'rp-door') + a.circle(x0, y, 6, 'rp-hinge') +
        a.arrow([x0 + p.l1 * s, y - 50], [0, 1], 46, 'force k-s', sym('F', '1'), [8, -30]) + a.arrow([x0 + p.l2 * s, y - 50], [0, 1], 46, 'force k-s', sym('F', '2'), [-8, -30]) +
        a.dim([x0, y], [x0 + p.l1 * s, y], q(p.l1, 'cm'), -18) + a.dim([x0, y], [x0 + p.l2 * s, y], q(p.l2, 'cm'), -44), L('The wrench with the two forces', 'Der Schlüssel mit den beiden Kräften'));
    },
  };

  // ---------------------------------------------------------------- 3 a seesaw and a parent
  const seesaw = {
    id: 'seesaw', difficulty: 2, title: () => L('Seesaw with a parent', 'Wippe mit Elternteil'),
    make(r) {
      const m1 = pick(r, [25, 30, 35, 40]), m2 = pick(r, [15, 20, 25]), mP = pick(r, [60, 70, 75, 80]), half = 2;
      return m1 > m2 ? { m1, m2, mP, half } : null;
    },
    solve: (p, o = {}) => ({ x: o.one ? (p.m1 * p.half) / p.mP : ((p.m1 - p.m2) * p.half) / p.mP }),
    traps: ['one'],
    why: { one: () => L('Both children turn the seesaw: the lighter child helps the parent.', 'Beide Kinder drehen die Wippe: Das leichtere Kind hilft dem Elternteil.') },
    fields: () => [field('x', ['x'], 'm', L('distance of the parent from the middle', 'Abstand des Elternteils von der Mitte'), 2)],
    text: (p) => L(`A seesaw is 4 m long, with its pivot in the middle. A child of ${q(p.m1, 'kg')} sits at the left end, a child of ${q(p.m2, 'kg')} at the right end. Where on the right side must a parent of ${q(p.mP, 'kg')} sit, so that the seesaw balances? (The seesaw’s own weight acts at the pivot.)`,
      `Eine Wippe ist 4 m lang, mit dem Drehpunkt in der Mitte. Am linken Ende sitzt ein Kind von ${q(p.m1, 'kg')}, am rechten Ende ein Kind von ${q(p.m2, 'kg')}. Wo auf der rechten Seite muss sich ein Elternteil von ${q(p.mP, 'kg')} hinsetzen, damit die Wippe im Gleichgewicht ist? (Die Gewichtskraft der Wippe greift im Drehpunkt an.)`),
    hints: () => [L('Counterclockwise: the heavier child. Clockwise: the lighter child and the parent.', 'Im Gegenuhrzeigersinn: das schwerere Kind. Im Uhrzeigersinn: das leichtere Kind und der Elternteil.'), L(`${m$('m_1\\,g\\cdot 2\\,\\mathrm{m} = m_2\\,g\\cdot 2\\,\\mathrm{m} + m_\\mathrm{P}\\,g\\cdot x')}`, `${m$('m_1\\,g\\cdot 2\\,\\mathrm{m} = m_2\\,g\\cdot 2\\,\\mathrm{m} + m_\\mathrm{P}\\,g\\cdot x')}`)],
    steps: (p, v) => [
      step(L('Balance of torques', 'Gleichgewicht der Drehmomente'), `<p>${L('About the pivot, the heavier child turns the seesaw one way, the lighter child and the parent the other:', 'Bezüglich des Drehpunkts dreht das schwerere Kind die Wippe in die eine Richtung, das leichtere Kind und der Elternteil in die andere:')}</p>$$m_1\\,g\\cdot 2\\,\\mathrm{m} = m_2\\,g\\cdot 2\\,\\mathrm{m} + m_\\mathrm{P}\\,g\\cdot x$$`),
      step(L('Position', 'Position'), `$$x = \\frac{(m_1 - m_2)\\cdot 2\\,\\mathrm{m}}{m_\\mathrm{P}} = \\frac{${tq(p.m1 - p.m2, 'kg')}\\cdot ${tq(2, 'm')}}{${tq(p.mP, 'kg')}} = ${res(v.x, 'm')}$$<p>${L('The parent sits close to the middle: a heavy load needs only a short lever arm.', 'Der Elternteil sitzt nahe der Mitte: Eine grosse Last braucht nur einen kurzen Hebelarm.')}</p>`),
    ],
    fbd(p, v) {
      const a = A(), c = [200, 90], s = 80, k = 80 / p.mP;
      return a.svg(400, 200, a.rect(c[0] - 2 * s, c[1] - 4, c[0] + 2 * s, c[1] + 4, 'rp-crate', 2) + a.path(`M${c[0]} ${c[1] + 4}l-12 22h24Z`, 'rp-weight') +
        a.arrow([c[0] - 2 * s, c[1]], [0, 1], p.m1 * k, 'force k-g', sym('m', '1') + sym(' g'), [8, 2]) +
        a.arrow([c[0] + 2 * s, c[1]], [0, 1], p.m2 * k, 'force k-g', sym('m', '2') + sym(' g'), [8, 2]) +
        a.arrow([c[0] + v.x * s, c[1]], [0, 1], p.mP * k, 'force k-g', sym('m', 'P') + sym(' g'), [8, 2]) +
        a.dim([c[0] - 2 * s, c[1]], [c[0], c[1]], '2 m', 22) + a.dim([c[0], c[1]], [c[0] + v.x * s, c[1]], sym('x'), 22) + a.dim([c[0], c[1]], [c[0] + 2 * s, c[1]], '2 m', 46),
      L('The seesaw with the three weights', 'Die Wippe mit den drei Gewichtskräften'));
    },
  };

  // ---------------------------------------------------------------- 4 painters carrying a plank
  const painters = {
    id: 'painters', difficulty: 3, title: () => L('Carrying a plank', 'Ein Brett tragen'),
    make(r) {
      const len = pick(r, [3, 4, 5]), m = pick(r, [10, 15, 20, 25]), M = pick(r, [10, 15, 20, 25]), x = pick(r, [0.5, 1, 1.5, 2].filter((d) => d < len / 2));
      return x ? { len, m, M, x } : null;
    },
    solve(p, o = {}) {
      const W = o.noBeam ? 0 : p.m * G, B = (W * p.len / 2 + p.M * G * (p.len - p.x)) / p.len, Af = W + p.M * G - B;
      return o.swap ? { A: B, B: Af } : { A: Af, B };
    },
    traps: ['noBeam', 'swap'],
    why: { noBeam: () => L('The plank’s own weight is missing: it acts at its middle.', 'Die Gewichtskraft des Bretts fehlt: Sie greift in seiner Mitte an.'), swap: () => L('Swapped: the painter nearer the bucket carries more of it.', 'Vertauscht: Der Maler näher beim Eimer trägt mehr davon.') },
    fields: () => [field('A', ['A'], 'N', L('force of the front painter', 'Kraft des vorderen Malers')), field('B', ['B'], 'N', L('force of the rear painter', 'Kraft des hinteren Malers'))],
    text: (p) => L(`Two painters carry a plank ${q(p.len, 'm')} long with a mass of ${q(p.m, 'kg')} on their shoulders, one at each end. A paint bucket of ${q(p.M, 'kg')} stands on the plank, ${q(p.x, 'm')} from the front end. With which force does each painter have to hold the plank?`,
      `Zwei Maler tragen ein Brett von ${q(p.len, 'm')} Länge und ${q(p.m, 'kg')} Masse auf den Schultern, an jedem Ende einer. Auf dem Brett steht ${q(p.x, 'm')} vom vorderen Ende entfernt ein Farbeimer von ${q(p.M, 'kg')}. Mit welcher Kraft muss jeder Maler das Brett halten?`),
    hints: () => [L('Take one end as the axis: then that painter’s force drops out of the torques.', 'Nimm ein Ende als Drehachse: Dann fällt die Kraft dieses Malers aus den Drehmomenten heraus.'), L('The forces balance too: both painters together carry plank and bucket.', 'Auch die Kräfte heben sich auf: Beide Maler zusammen tragen Brett und Eimer.')],
    steps: (p, v) => [
      step(L('Torques about the front end', 'Drehmomente bezüglich des vorderen Endes'), `$$${T('B')}\\cdot\\ell = m\\,g\\cdot\\frac{\\ell}{2} + M\\,g\\cdot(\\ell - x) \\;\\Rightarrow\\; ${T('B')} = \\frac{${tq(p.m * G, 'N')}\\cdot ${tq(p.len / 2, 'm')} + ${tq(p.M * G, 'N')}\\cdot ${tq(p.len - p.x, 'm')}}{${tq(p.len, 'm')}} = ${res(v.B, 'N')}$$`),
      step(L('Forces', 'Kräfte'), `$$${T('A')} = m\\,g + M\\,g - ${T('B')} = ${tq((p.m + p.M) * G, 'N')} - ${tq(v.B, 'N')} = ${res(v.A, 'N')}$$<p>${L('The front painter, nearer the bucket, carries more.', 'Der vordere Maler, näher beim Eimer, trägt mehr.')}</p>`),
    ],
    fbd(p, v) {
      const a = A(), y = 90, x0 = 50, s = 300 / p.len, k = 60 / Math.max(v.A, v.B);
      return a.svg(400, 200, a.rect(x0, y - 4, x0 + 300, y + 4, 'rp-crate', 2) +
        a.arrow([x0 + 300, y], [0, -1], v.A * k, 'force k-h', Fsym('A'), [8, 0]) + a.arrow([x0, y], [0, -1], v.B * k, 'force k-h', Fsym('B'), [8, 0]) +
        a.arrow([x0 + 150, y], [0, 1], p.m * G * k, 'force k-g', sym('m') + sym(' g'), [8, 2]) + a.arrow([x0 + 300 - p.x * s, y], [0, 1], p.M * G * k, 'force k-g', sym('M') + sym(' g'), [8, 2]) +
        a.dim([x0 + 300 - p.x * s, y], [x0 + 300, y], q(p.x, 'm'), -84) + a.dim([x0, y], [x0 + 300, y], q(p.len, 'm'), -108), L('The plank with its forces (front end on the right)', 'Das Brett mit seinen Kräften (vorderes Ende rechts)'));
    },
  };

  // ---------------------------------------------------------------- 5 a diving board
  const board = {
    id: 'board', difficulty: 4, title: () => L('A diving board', 'Ein Sprungbrett'),
    make(r) {
      const len = pick(r, [3, 4, 5]), b = pick(r, [1, 1.5, 2].filter((x) => x < len - 1)), m = pick(r, [20, 30, 40]), M = pick(r, [50, 60, 70, 80]);
      return b ? { len, b, m, M } : null;
    },
    solve(p, o = {}) {
      const W = o.noBeam ? 0 : p.m * G, B = (W * p.len / 2 + p.M * G * p.len) / p.b;
      return { B, A: B - W - p.M * G };
    },
    traps: ['noBeam'],
    why: { noBeam: () => L('The board’s own weight is missing: it acts at its middle.', 'Die Gewichtskraft des Bretts fehlt: Sie greift in seiner Mitte an.') },
    fields: () => [field('B', ['B'], 'N', L('force of the support (up)', 'Kraft der Stütze (nach oben)')), field('A', ['A'], 'N', L('force of the bolt (down)', 'Kraft des Bolzens (nach unten)'))],
    text: (p) => L(`A diving board ${q(p.len, 'm')} long with a mass of ${q(p.m, 'kg')} is held by a bolt at its back end and rests on a support ${q(p.b, 'm')} from the back end. A diver of ${q(p.M, 'kg')} stands at the front tip. How large are the force of the support (up) and the force of the bolt (down) on the board?`,
      `Ein Sprungbrett von ${q(p.len, 'm')} Länge und ${q(p.m, 'kg')} Masse ist an seinem hinteren Ende mit einem Bolzen befestigt und liegt ${q(p.b, 'm')} vom hinteren Ende entfernt auf einer Stütze auf. Ein Springer von ${q(p.M, 'kg')} steht an der vorderen Spitze. Wie gross sind die Kraft der Stütze (nach oben) und die Kraft des Bolzens (nach unten) auf das Brett?`),
    hints: () => [L('Take the bolt as the axis: the support turns the board up, the weights of the board (at its middle) and of the diver turn it down.', 'Nimm den Bolzen als Drehachse: Die Stütze dreht das Brett nach oben, die Gewichtskräfte des Bretts (in seiner Mitte) und des Springers drehen es nach unten.'), L('Then the forces: support up = bolt down + both weights.', 'Dann die Kräfte: Stütze nach oben = Bolzen nach unten + beide Gewichtskräfte.')],
    steps: (p, v) => [
      step(L('Torques about the bolt', 'Drehmomente bezüglich des Bolzens'), `$$${T('B')}\\cdot b = m\\,g\\cdot\\frac{\\ell}{2} + M\\,g\\cdot\\ell \\;\\Rightarrow\\; ${T('B')} = \\frac{${tq(p.m * G, 'N')}\\cdot ${tq(p.len / 2, 'm')} + ${tq(p.M * G, 'N')}\\cdot ${tq(p.len, 'm')}}{${tq(p.b, 'm')}} = ${res(v.B, 'N')}$$`),
      step(L('Forces', 'Kräfte'), `<p>${L('Up: the support. Down: the bolt and the two weights.', 'Nach oben: die Stütze. Nach unten: der Bolzen und die beiden Gewichtskräfte.')}</p>$$${T('A')} = ${T('B')} - m\\,g - M\\,g = ${tq(v.B, 'N')} - ${tq((p.m + p.M) * G, 'N')} = ${res(v.A, 'N')}$$<p>${L('The support carries several times the diver’s weight: the board acts as a lever.', 'Die Stütze trägt ein Vielfaches der Gewichtskraft des Springers: Das Brett wirkt als Hebel.')}</p>`),
    ],
    fbd(p, v) {
      const a = A(), x0 = 40, y = 100, s = 320 / p.len, k = 70 / v.B;
      return a.svg(400, 220, a.rect(x0, y - 4, x0 + 320, y + 4, 'rp-board', 2) +
        a.arrow([x0 + p.b * s, y], [0, -1], v.B * k, 'force k-h', Fsym('B'), [8, 0]) + a.arrow([x0, y], [0, 1], v.A * k, 'force k-h', Fsym('A'), [8, 2]) +
        a.arrow([x0 + 160, y], [0, 1], p.m * G * k, 'force k-g', sym('m') + sym(' g'), [8, 2]) + a.arrow([x0 + 320, y], [0, 1], p.M * G * k, 'force k-g', sym('M') + sym(' g'), [8, 2]) +
        a.dim([x0, y], [x0 + p.b * s, y], q(p.b, 'm'), 22) + a.dim([x0, y], [x0 + 320, y], q(p.len, 'm'), -86), L('The board with its forces', 'Das Brett mit seinen Kräften'));
    },
  };

  // ---------------------------------------------------------------- 6 a tower crane
  const tower = {
    id: 'tower', difficulty: 3, title: () => L('A tower crane', 'Ein Turmdrehkran'),
    make(r) {
      const mG = pick(r, [6000, 8000, 10000, 12000]), c = pick(r, [8, 10, 12]), r1 = pick(r, [20, 25, 30, 40]), r2 = pick(r, [40, 48, 50, 60]);
      return r2 > r1 ? { mG, c, r1, r2 } : null;
    },
    solve: (p, o = {}) => ({ M1: o.swap ? p.mG * p.r1 / p.c : p.mG * p.c / p.r1, M2: o.swap ? p.mG * p.r2 / p.c : p.mG * p.c / p.r2 }),
    traps: ['swap'],
    why: { swap: () => L('Reversed: the load far out needs to be lighter than the counterweight close in.', 'Umgekehrt: Die Last weit draussen muss leichter sein als das Gegengewicht nahe am Turm.') },
    fields: () => [field('M1', ['m', 1], 'kg', L('load at the first distance', 'Last beim ersten Abstand')), field('M2', ['m', 2], 'kg', L('load at the second distance', 'Last beim zweiten Abstand'))],
    text: (p) => L(`The counterweight of a tower crane (${q(p.mG / 1000, '')} t) hangs ${q(p.c, 'm')} from the tower on the short arm. The crane is balanced when the torques of the load and the counterweight about the tower are equal. Which load balances it at ${q(p.r1, 'm')} from the tower, and which at ${q(p.r2, 'm')}? (The arms’ own weights balance each other.)`,
      `Das Gegengewicht eines Turmdrehkrans (${q(p.mG / 1000, '')} t) hängt am kurzen Arm ${q(p.c, 'm')} vom Turm entfernt. Der Kran ist im Gleichgewicht, wenn die Drehmomente von Last und Gegengewicht bezüglich des Turms gleich gross sind. Welche Last hält ihm ${q(p.r1, 'm')} vom Turm entfernt das Gleichgewicht, welche ${q(p.r2, 'm')} entfernt? (Die Gewichtskräfte der Arme heben sich gegenseitig auf.)`),
    hints: () => [L('Torque of the counterweight = torque of the load, about the tower.', 'Drehmoment des Gegengewichts = Drehmoment der Last, bezüglich des Turms.'), L(`${m$('m_\\mathrm{G}\\,g\\cdot c = m\\,g\\cdot r')}: g cancels.`, `${m$('m_\\mathrm{G}\\,g\\cdot c = m\\,g\\cdot r')}: g kürzt sich weg.`)],
    steps: (p, v) => [
      step(L('Balance', 'Gleichgewicht'), `$$m\\,g\\cdot r = m_\\mathrm{G}\\,g\\cdot c \\;\\Rightarrow\\; m = \\frac{m_\\mathrm{G}\\,c}{r}$$`),
      step(L('The two distances', 'Die beiden Abstände'), `$$m_1 = \\frac{${tq(p.mG, 'kg')}\\cdot ${tq(p.c, 'm')}}{${tq(p.r1, 'm')}} = ${res(v.M1, 'kg')},\\qquad m_2 = \\frac{${tq(p.mG, 'kg')}\\cdot ${tq(p.c, 'm')}}{${tq(p.r2, 'm')}} = ${res(v.M2, 'kg')}$$<p>${L('That is why a crane’s load chart allows less the farther out the load hangs.', 'Darum erlaubt die Lasttabelle eines Krans umso weniger, je weiter draussen die Last hängt.')}</p>`),
    ],
    fbd(p, v) {
      const a = A(), t = 120, y = 70, s = 250 / p.r2;
      return a.svg(420, 190, a.rect(t - p.c * s, y - 4, t + p.r2 * s, y + 4, 'rp-crate', 2) + a.path(`M${t} ${y + 4}l-10 20h20Z`, 'rp-weight') +
        a.arrow([t - p.c * s, y], [0, 1], 60, 'force k-g', sym('m', 'G') + sym(' g'), [8, 2]) + a.arrow([t + p.r1 * s, y], [0, 1], 60 * v.M1 / p.mG, 'force k-g', sym('m', '1') + sym(' g'), [8, 2]) +
        a.dim([t - p.c * s, y], [t, y], q(p.c, 'm'), 22) + a.dim([t, y], [t + p.r1 * s, y], q(p.r1, 'm'), 22) + a.dim([t, y], [t + p.r2 * s, y], q(p.r2, 'm'), 48), L('The jib with the counterweight and the load', 'Der Ausleger mit Gegengewicht und Last'));
    },
  };

  // ---------------------------------------------------------------- 7 holding a bag
  const bag = {
    id: 'bag', difficulty: 3, title: () => L('Holding a shopping bag', 'Eine Einkaufstasche halten'),
    make: (r) => ({ d: pick(r, [4, 5]), a: pick(r, [30, 32, 35]), c: 15, mA: pick(r, [1.5, 2]), M: pick(r, [3, 4, 5, 6, 8]) }),
    solve(p, o = {}) {
      const WA = o.noArm ? 0 : p.mA * G, Fm = (WA * p.c + p.M * G * p.a) / p.d;
      return { Fm };
    },
    traps: ['noArm'],
    why: { noArm: () => L('The forearm’s own weight is missing.', 'Die Gewichtskraft des Unterarms fehlt.') },
    fields: () => [field('Fm', ['Fm'], 'N', L('force of the biceps', 'Kraft des Bizeps'))],
    text: (p) => L(`You hold a shopping bag of ${q(p.M, 'kg')} with your forearm level; the bag hangs ${q(p.a, 'cm')} from the elbow. The forearm (${q(p.mA, 'kg')}) has its centre of mass ${q(p.c, 'cm')} from the elbow, and the biceps pulls straight up ${q(p.d, 'cm')} from the elbow. How large is the force of the biceps?`,
      `Du hältst eine Einkaufstasche von ${q(p.M, 'kg')} mit waagrechtem Unterarm; die Tasche hängt ${q(p.a, 'cm')} vom Ellbogen entfernt. Der Unterarm (${q(p.mA, 'kg')}) hat seinen Schwerpunkt ${q(p.c, 'cm')} vom Ellbogen entfernt, und der Bizeps zieht ${q(p.d, 'cm')} vom Ellbogen entfernt senkrecht nach oben. Wie gross ist die Kraft des Bizeps?`),
    hints: () => [L('The elbow is the axis. The biceps turns the forearm up; the weights of forearm and bag turn it down.', 'Der Ellbogen ist die Drehachse. Der Bizeps dreht den Unterarm nach oben, die Gewichtskräfte von Unterarm und Tasche nach unten.'), L(`${m$('F_\\mathrm{M}\\cdot d = m_\\mathrm{A}\\,g\\cdot c + M\\,g\\cdot a')}`, `${m$('F_\\mathrm{M}\\cdot d = m_\\mathrm{A}\\,g\\cdot c + M\\,g\\cdot a')}`)],
    steps: (p, v) => [
      step(L('Torques about the elbow', 'Drehmomente bezüglich des Ellbogens'), `$$${T('Fm')} = \\frac{m_\\mathrm{A}\\,g\\cdot c + M\\,g\\cdot a}{d} = \\frac{${tq(p.mA * G, 'N')}\\cdot ${tq(p.c, 'cm')} + ${tq(p.M * G, 'N')}\\cdot ${tq(p.a, 'cm')}}{${tq(p.d, 'cm')}} = ${res(v.Fm, 'N')}$$<p>${L(`About ${num(Math.round(v.Fm / (p.M * G)))} times the bag’s weight: muscles act on very short lever arms.`, `Etwa ${num(Math.round(v.Fm / (p.M * G)))}-mal die Gewichtskraft der Tasche: Muskeln wirken an sehr kurzen Hebelarmen.`)}</p>`),
    ],
    fbd(p, v) {
      const a = A(), x0 = 50, y = 90, s = 8.5, k = 70 / v.Fm;
      return a.svg(380, 200, a.rect(x0, y - 5, x0 + (p.a + 4) * s, y + 5, 'rp-crate', 3) + a.circle(x0, y, 6, 'rp-hinge') +
        a.arrow([x0 + p.d * s, y], [0, -1], v.Fm * k, 'force k-h', Fsym('M'), [8, 0]) +
        a.arrow([x0 + p.c * s, y], [0, 1], Math.max(18, p.mA * G * k * 3), 'force k-g', sym('m', 'A') + sym(' g'), [8, 2]) + a.arrow([x0 + p.a * s, y], [0, 1], Math.max(24, p.M * G * k * 3), 'force k-g', sym('M') + sym(' g'), [8, 2]) +
        a.dim([x0, y], [x0 + p.d * s, y], q(p.d, 'cm'), -24) + a.dim([x0, y], [x0 + p.c * s, y], q(p.c, 'cm'), -50) + a.dim([x0, y], [x0 + p.a * s, y], q(p.a, 'cm'), -76),
      L('The forearm with its forces (the weights drawn three times longer)', 'Der Unterarm mit seinen Kräften (die Gewichtskräfte dreimal länger gezeichnet)'));
    },
  };

  // ---------------------------------------------------------------- 8 a bicycle
  const bike = {
    id: 'bike', difficulty: 2, title: () => L('Pedalling uphill', 'Bergauf treten'),
    make: (r) => ({ F: pick(r, [300, 400, 500, 600, 800]), r1: pick(r, [16, 17.5, 20]), r2: pick(r, [8, 10, 12, 16]) }),
    solve: (p, o = {}) => { const M = p.F * p.r1 / 100; return { M, Fc: o.mult ? M * p.r2 / 100 : M / (p.r2 / 100) }; },
    traps: ['mult'],
    why: { mult: () => L('The chain force is the torque divided by the chainring’s radius.', 'Die Kettenkraft ist das Drehmoment geteilt durch den Radius des Kettenblatts.') },
    fields: () => [field('M', ['M'], 'Nm', L('torque on the crank', 'Drehmoment an der Kurbel')), field('Fc', ['F', L('chain', 'Kette')], 'N', L('force in the chain', 'Kraft in der Kette'))],
    text: (p) => L(`Riding uphill, a cyclist stands on the pedal and pushes it straight down with ${q(p.F, 'N')} while the crank (${q(p.r1, 'cm')} long) is level. How large is the torque on the crank axle? The chainring has a radius of ${q(p.r2, 'cm')}: with which force does the chain pull?`,
      `Am Berg steht eine Radfahrerin auf dem Pedal und drückt es mit ${q(p.F, 'N')} senkrecht nach unten, während die Kurbel (${q(p.r1, 'cm')} lang) waagrecht steht. Wie gross ist das Drehmoment an der Tretlagerachse? Das Kettenblatt hat einen Radius von ${q(p.r2, 'cm')}: Mit welcher Kraft zieht die Kette?`),
    hints: () => [L('With the crank level, the lever arm of the pedal force is the crank’s length.', 'Steht die Kurbel waagrecht, ist der Hebelarm der Pedalkraft die Kurbellänge.'), L('The chain holds the chainring against this torque: its lever arm is the chainring’s radius.', 'Die Kette hält dem Kettenblatt gegen dieses Drehmoment: Ihr Hebelarm ist der Radius des Kettenblatts.')],
    steps: (p, v) => [
      step(L('Torque of the pedal', 'Drehmoment am Pedal'), `$$M = F\\cdot r_\\mathrm{K} = ${tq(p.F, 'N')}\\cdot ${tq(p.r1 / 100, 'm')} = ${res(v.M, 'Nm')}$$`),
      step(L('Force in the chain', 'Kraft in der Kette'), `<p>${L('The crank and the chainring turn together; the chain pulls at the chainring’s edge:', 'Kurbel und Kettenblatt drehen sich zusammen; die Kette zieht am Rand des Kettenblatts:')}</p>$$F_\\mathrm{Kette} = \\frac{M}{r_\\mathrm{B}} = \\frac{${tq(v.M, 'Nm')}}{${tq(p.r2 / 100, 'm')}} = ${res(v.Fc, 'N')}$$`),
    ],
    fbd(p, v) {
      const a = A(), c = [140, 100], rc = p.r1 * 7, rb = p.r2 * 7;
      return a.svg(380, 210, a.circle(...c, rb, 'rp-chainring') + a.line(c, [c[0] + rc, c[1]], 'rp-crank') + a.circle(...c, 4, 'rp-hub') +
        a.arrow([c[0] + rc, c[1]], [0, 1], 60, 'force k-s', sym('F'), [8, 2]) + a.arrow([c[0], c[1] - rb], [-1, 0], 60 * Math.min(1.6, v.Fc / p.F), 'force k-k', sym('F', L('chain', 'Kette')), [-8, -8]) +
        a.dim(c, [c[0] + rc, c[1]], sym('r', 'K'), 20) + a.dim(c, [c[0], c[1] - rb], sym('r', 'B'), 14), L('Crank and chainring with the pedal force and the chain force', 'Kurbel und Kettenblatt mit Pedalkraft und Kettenkraft'));
    },
  };

  // ---------------------------------------------------------------- 9 balancing a hammer
  const hammer = {
    id: 'hammer', difficulty: 3, title: () => L('Balancing a hammer', 'Einen Hammer balancieren'),
    make: (r) => ({ len: pick(r, [30, 32, 35, 40]), m1: pick(r, [0.2, 0.25, 0.3]), m2: pick(r, [0.5, 0.6, 0.75, 1]) }),
    solve: (p, o = {}) => ({ x: o.count ? (p.len / 2 + p.len) / 2 : (p.m1 * p.len / 2 + p.m2 * p.len) / (p.m1 + p.m2) }),
    traps: ['count'],
    why: { count: () => L('The parts count with their masses: the heavy head pulls the centre of mass towards it.', 'Die Teile zählen mit ihren Massen: Der schwere Kopf zieht den Schwerpunkt zu sich.') },
    fields: () => [field('x', ['x'], 'cm', L('balance point from the handle’s end', 'Balancierpunkt vom Griffende'))],
    text: (p) => L(`A hammer has a wooden handle ${q(p.len, 'cm')} long with a mass of ${q(p.m1, 'kg')} and a steel head of ${q(p.m2, 'kg')}, whose centre of mass is at the end of the handle. At which distance from the handle’s end can you balance the hammer on one finger?`,
      `Ein Hammer hat einen Holzstiel von ${q(p.len, 'cm')} Länge und ${q(p.m1, 'kg')} Masse und einen Stahlkopf von ${q(p.m2, 'kg')}, dessen Schwerpunkt am Ende des Stiels liegt. In welchem Abstand vom Griffende kannst du den Hammer auf einem Finger balancieren?`),
    hints: () => [L('The hammer balances where its centre of mass is: there the torques of the two weights cancel.', 'Der Hammer balanciert in seinem Schwerpunkt: Dort heben sich die Drehmomente der beiden Gewichtskräfte auf.'), L('Combine handle (its middle) and head (the end): m₁ · a₁ = m₂ · a₂.', 'Fasse Stiel (seine Mitte) und Kopf (das Ende) zusammen: m₁ · a₁ = m₂ · a₂.')],
    steps: (p, v) => [
      step(L('The two parts', 'Die beiden Teile'), `<p>${L(`The handle’s centre of mass is ${q(p.len / 2, 'cm')} from its end, the head’s ${q(p.len, 'cm')}.`, `Der Schwerpunkt des Stiels liegt ${q(p.len / 2, 'cm')} vom Ende, der des Kopfs ${q(p.len, 'cm')}.`)}</p>`),
      step(L('Combined', 'Zusammengefasst'), `$$x = \\frac{m_1\\cdot\\frac{\\ell}{2} + m_2\\cdot\\ell}{m_1 + m_2} = \\frac{${tq(p.m1, 'kg')}\\cdot ${tq(p.len / 2, 'cm')} + ${tq(p.m2, 'kg')}\\cdot ${tq(p.len, 'cm')}}{${tq(p.m1 + p.m2, 'kg')}} = ${res(v.x, 'cm')}$$<p>${L('Close to the head: there the hammer balances, and there you hold it for strong blows with least effort.', 'Nahe beim Kopf: Dort balanciert der Hammer.')}</p>`),
    ],
    fbd(p, v) {
      const a = A(), x0 = 40, y = 80, s = 300 / p.len, k = 60 / p.m2;
      return a.svg(400, 200, a.rect(x0, y - 4, x0 + p.len * s, y + 4, 'rp-crate', 2) + a.path(`M${a.f(x0 + v.x * s)} ${y + 4}l-10 18h20Z`, 'rp-weight') +
        a.arrow([x0 + p.len * s / 2, y], [0, 1], p.m1 * k, 'force k-g', sym('m', '1') + sym(' g'), [8, 2]) + a.arrow([x0 + p.len * s, y], [0, 1], p.m2 * k, 'force k-g', sym('m', '2') + sym(' g'), [8, 2]) +
        a.dim([x0, y], [x0 + v.x * s, y], sym('x'), 20) + a.dim([x0, y], [x0 + p.len * s, y], q(p.len, 'cm'), 44), L('The hammer with its two weights and the balance point', 'Der Hammer mit seinen beiden Gewichtskräften und dem Balancierpunkt'));
    },
  };

  // ---------------------------------------------------------------- 10 tilting a bus
  const bus = {
    id: 'bus', difficulty: 4, title: () => L('The tilt test of a bus', 'Der Kipptest eines Busses'),
    make: (r) => ({ w: pick(r, [2, 2.1, 2.2, 2.4]), h: pick(r, [1, 1.1, 1.2, 1.4, 1.5]) }),
    solve: (p, o = {}) => ({ tan: o.full ? p.w / p.h : p.w / 2 / p.h }),
    traps: ['full'],
    why: { full: () => L('The centre of mass is in the middle: what counts is half the track width.', 'Der Schwerpunkt liegt in der Mitte: Es zählt die halbe Spurweite.') },
    fields: () => [{ ...field('tan', ['tanTheta'], '', L('at the tilt θ where it tips', 'bei der Neigung θ, bei der er kippt'), 2), exact: false }],
    text: (p) => L(`In a tilt test, a bus stands on a platform that is tilted slowly to one side. Its wheels are ${q(p.w, 'm')} apart (track width), and its centre of mass is ${q(p.h, 'm')} above the platform, in the middle between the wheels. At which tilt θ does it tip over? Give tan θ. (Buses must not tip before about 28°.)`,
      `Bei einem Kipptest steht ein Bus auf einer Plattform, die langsam zur Seite geneigt wird. Seine Räder sind ${q(p.w, 'm')} voneinander entfernt (Spurweite), und sein Schwerpunkt liegt ${q(p.h, 'm')} über der Plattform, in der Mitte zwischen den Rädern. Bei welcher Neigung θ kippt er? Gib tan θ an. (Busse dürfen erst ab etwa 28° kippen.)`),
    hints: () => [L('The bus tips about its lower wheels once its centre of mass is straight above them.', 'Der Bus kippt um seine unteren Räder, sobald sein Schwerpunkt senkrecht über ihnen liegt.'), L('Then tan θ = (half the track width) / (height of the centre of mass).', 'Dann ist tan θ = (halbe Spurweite) / (Höhe des Schwerpunkts).')],
    steps: (p, v) => [
      step(L('Tipping point', 'Kipppunkt'), `<p>${L('While the centre of mass is on the inner side of the lower wheels, its weight turns the bus back. It tips once the centre of mass is straight above them:', 'Solange der Schwerpunkt innerhalb der unteren Räder liegt, dreht ihn die Gewichtskraft zurück. Er kippt, sobald der Schwerpunkt senkrecht über ihnen liegt:')}</p>` +
        `$$\\tan\\theta = \\frac{w/2}{h} = \\frac{${tq(p.w / 2, 'm')}}{${tq(p.h, 'm')}} = ${res(v.tan, '')}\\;\\Rightarrow\\; \\theta \\approx ${num(Math.round(Math.atan(v.tan) * 1800 / Math.PI) / 10)}^\\circ$$` +
        `<p>${Math.atan(v.tan) * 180 / Math.PI >= 28 ? L('It passes the test.', 'Er besteht den Test.') : L('Too low: it fails the test (a load on the roof would make it worse).', 'Zu wenig: Er besteht den Test nicht (eine Last auf dem Dach würde es verschlimmern).')}</p>`),
    ],
    fbd(p) {
      const a = A(), s = Math.min(80, 95 / p.h), y = 185, w = p.w * s, h = p.h * s, x0 = 200 - w / 2;
      return a.svg(400, 230, a.rect(x0, y - h * 1.6, x0 + w, y, 'rp-cabin', 6) + a.circle(x0 + w / 2, y - h, 6, 'rp-com') + a.line([x0 - 20, y], [x0 + w + 20, y], 'rp-edge') +
        a.line([x0 + w, y], [x0 + w / 2, y - h], 'arm hl') + a.arrow([x0 + w / 2, y - h], [0, 1], 60, 'force k-g', sym('F', L('g', 'G')), [8, 2]) +
        a.dim([x0 + w / 2, y], [x0 + w, y], q(p.w / 2, 'm'), -18) + a.dim([x0 + w, y], [x0 + w, y - h], q(p.h, 'm'), -18), L('The bus upright: half the track width against the height of the centre of mass', 'Der Bus aufrecht: halbe Spurweite gegen die Höhe des Schwerpunkts'));
    },
  };

  const PROBLEMS = [door, wrench, seesaw, bike, painters, tower, bag, hammer, board, bus];

  // ---------------------------------------------------------------- exercises
  const exactTo = (x, dec) => Math.abs(x * 10 ** dec - Math.round(x * 10 ** dec)) < 1e-6;
  const same = (x, y) => Math.abs(x - y) <= 0.015 * Math.max(Math.abs(y), 0.05);
  function realOf(i, seed) {
    const pb = PROBLEMS[i], r = rng(seed);
    let p = null;
    for (let k = 0; k < 5000 && !p; k++) {
      const c = pb.make(r);
      if (c && pb.fields(c).every((fl) => (fl.exact === false || exactTo(pb.solve(c)[fl.key], fl.dec)) && pb.solve(c)[fl.key] > 0)) p = c;
    }
    const v = pb.solve(p);
    const wrong = pb.traps.map((flag) => ({ vals: pb.solve(p, { [flag]: true }), why: pb.why[flag](), flag }));
    const fields = pb.fields(p).map((fl) => ({
      ...fl, value: v[fl.key],
      traps: wrong.map((w) => ({ value: w.vals[fl.key], why: w.why, flag: w.flag })).filter((x) => Number.isFinite(x.value) && !same(x.value, v[fl.key])),
    }));
    return {
      id: `real${i + 1}-${seed}`, real: i, seed, scenario: `real-${pb.id}`, family: 'real', difficulty: pb.difficulty,
      title: pb.title(), text: `<p>${pb.text(p)}</p><p class="note">${L('Take g = 10 m/s².', 'Rechne mit g = 10 m/s².')}</p>`,
      fields, comps: [], figure: () => (root.TorqueFigures ? root.TorqueFigures[pb.id](p, v) : ''), solutionFigure: () => (root.Art ? pb.fbd(p, v) : ''),
      hints: pb.hints(p, v), solution: pb.steps(p, v), steps: [],
      results: fields.map((fl) => `$${T(...fl.sym)} = ${tq(fl.value, fl.unit)}$`).join(', '),
      p, v,
    };
  }

  root.TorqueProblems = { PROBLEMS, realOf };
  if (typeof module !== 'undefined') module.exports = root.TorqueProblems;
})(typeof window !== 'undefined' ? window : globalThis);
