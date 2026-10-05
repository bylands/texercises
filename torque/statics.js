// More situations, beyond the worksheets (same form as in scenarios.js, which they join):
// a plank on two supports, forearm and biceps, crowbar and wheelbarrow, a winch, a mobile, a box
// that tips over, a crane boom held by a cable, and a ladder against a wall.
(function (root) {
  'use strict';

  const TQ = root.TQ, { Pic } = root.Draw, { SCENARIOS, H } = root.Scenarios;
  const { L, G, tex: T, tq, q, num, svgSym, pick, rad } = TQ;
  const { step, res, exact, beamPic, kg, cm, N } = H;
  const m_ = (x) => q(x, 'm', 2);
  const g_ = (x) => q(x, 'g', 1);
  const deg = (x) => (x * 180) / Math.PI;
  // a field: key, symbol, unit, decimals, what
  const field = (key, sym, unit, dec, what) => ({ key, sym, unit, dec, what });
  // a box standing on the beam at x (world units), w × h px, with a label
  function block(P, x, y, w, h, label) {
    P.rect([x - w / 2 / P.s, y], [x + w / 2 / P.s, y + h / P.s], 'load', 2);
    if (label) P.text([x, y + h / P.s], label, 'lbl mass', 'middle', [0, -12]);
  }

  // ================================================================ plank on two supports
  // A uniform plank (length len, mass m) on supports A (its left end) and B (b from A); a load M
  // stands at x from A. The supports push up with F_A and F_B. Lengths in m.
  const plank = {
    id: 'plank', family: 'supports', difficulty: 3,
    make(r) {
      const len = pick(r, [2, 3, 4, 5, 6]), b = len - pick(r, [0, 0, 0.5, 1]), x = pick(r, [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].filter((v) => v < len));
      const m = pick(r, [10, 15, 20, 25, 30, 40]), M = pick(r, [20, 30, 40, 50, 60, 70, 80]);
      const v = plank.solve({ len, b, x, m, M });
      if (v.A < 20 || v.B < 20 || Math.abs(x - b) < 0.2 || x === len / 2) return null;
      return { len, b, x, m, M };
    },
    solve(p, o = {}) {
      const W = o.noBeam ? 0 : p.m * G, B = (W * p.len / 2 + p.M * G * p.x) / p.b, A = W + p.M * G - B;
      return o.swap ? { A: exact(B), B: exact(A) } : { A: exact(A), B: exact(B) };
    },
    traps: ['noBeam', 'swap'],
    why: {
      noBeam: () => L('The plank’s own weight is missing: it acts at the plank’s middle.', 'Die Gewichtskraft des Bretts fehlt: Sie greift in der Mitte des Bretts an.'),
      swap: () => L('Swapped: the support nearer to a load carries more of it.', 'Vertauscht: Die Stütze, die näher bei einer Last ist, trägt mehr davon.'),
    },
    fields: () => [field('A', ['A'], 'N', 1, L('force of support A', 'Kraft der Stütze A')), field('B', ['B'], 'N', 1, L('force of support B', 'Kraft der Stütze B'))],
    title: () => L('A plank on two supports', 'Ein Brett auf zwei Stützen'),
    text: (p) => L(`A uniform plank ${m_(p.len)} long with a mass of ${kg(p.m)} rests on two supports: A at its left end and B ${m_(p.b)} from A${p.b === p.len ? ', at its right end' : ''}. A person of ${kg(p.M)} stands ${m_(p.x)} from A. With which forces do the supports push on the plank? Take g = 10 m/s².`,
      `Ein gleichmässiges Brett von ${m_(p.len)} Länge und ${kg(p.m)} Masse liegt auf zwei Stützen: A an seinem linken Ende und B ${m_(p.b)} von A entfernt${p.b === p.len ? ', an seinem rechten Ende' : ''}. Eine Person von ${kg(p.M)} steht ${m_(p.x)} von A entfernt. Mit welchen Kräften drücken die Stützen auf das Brett? Rechne mit g = 10 m/s².`),
    figure(p, v, view = {}) {
      const B = beamPic(p.len, L('A plank on two supports with a person on it', 'Ein Brett auf zwei Stützen mit einer Person darauf')), P = B.P, show = view.show || new Set();
      P.support(B.bottom(0)); P.support(B.bottom(p.b));
      P.text(B.bottom(0), 'A', 'lbl', 'end', [-14, 14]); P.text(B.bottom(p.b), 'B', 'lbl', 'start', [14, 14]);
      block(P, p.x, B.h, 26, 34, kg(p.M));
      if (!show.has('G')) P.text(B.bottom(p.len / 2), `m = ${kg(p.m)}`, 'lbl mass', 'middle', [0, 16]);
      P.dim(B.top(0), B.top(p.x), m_(p.x), 56);
      P.dim(B.bottom(0), B.bottom(p.b), m_(p.b), -50);
      if (p.b !== p.len) P.dim(B.bottom(0), B.bottom(p.len), m_(p.len), -72);
      if (show.has('G')) {
        P.arrow(B.mid(p.len / 2), [0, -1], 30, 'force k-g', svgSym('G'), [8, 4]);
        P.arrow([p.x, B.h], [0, -1], 30, 'force k-g', `${svgSym('G', '')}<tspan dy="0">′</tspan>`, [8, 8]);
      }
      if (show.has('AB')) {
        P.arrow(B.top(0), [0, 1], 46, `force k-h${view.hl && view.hl.has('A') ? ' hl' : ''}`, svgSym('A'), [8, 2]);
        P.arrow(B.top(p.b), [0, 1], 46, `force k-h${view.hl && view.hl.has('B') ? ' hl' : ''}`, svgSym('B'), [8, 2]);
      }
      return P.svg();
    },
    hints: () => [
      L('Three forces push down (the plank’s weight at its middle and the person’s weight), two push up (the supports). At rest, both the forces and the torques balance.', 'Nach unten wirken die Gewichtskraft des Bretts (in seiner Mitte) und die der Person, nach oben die Kräfte der zwei Stützen. In Ruhe heben sich die Kräfte und die Drehmomente auf.'),
      L('Choose A as the axis: then F_A has no lever arm, and only F_B is unknown: F_B · b = m g · ℓ/2 + M g · x.', 'Wähle A als Drehachse: Dann hat F_A keinen Hebelarm, und nur F_B ist unbekannt: F_B · b = m g · ℓ/2 + M g · x.'),
      L('Then F_A from the forces: F_A + F_B = m g + M g.', 'Dann F_A aus den Kräften: F_A + F_B = m g + M g.'),
    ],
    steps(p, v) {
      const W = p.m * G, Wp = p.M * G;
      return [
        step(L('Forces', 'Kräfte'), `<p>${L(`Down: the plank’s weight $m\\,g = ${tq(W, 'N')}$ at its middle and the person’s weight $M\\,g = ${tq(Wp, 'N')}$. Up: the supports, with ${'$' + T('A') + '$'} and ${'$' + T('B') + '$'}.`, `Nach unten: die Gewichtskraft des Bretts $m\\,g = ${tq(W, 'N')}$ in seiner Mitte und die der Person $M\\,g = ${tq(Wp, 'N')}$. Nach oben: die Stützen mit ${'$' + T('A') + '$'} und ${'$' + T('B') + '$'}.`)}</p>`, ['G', 'AB'], ['G']),
        step(L('Torques about A', 'Drehmomente bezüglich A'), `<p>${L('With A as the axis, F_A has no lever arm. F_B turns the plank counterclockwise, the weights clockwise:', 'Mit A als Drehachse hat F_A keinen Hebelarm. F_B dreht das Brett im Gegenuhrzeigersinn, die Gewichtskräfte im Uhrzeigersinn:')}</p>` +
          `$$${T('B')}\\cdot b = m\\,g\\cdot\\frac{\\ell}{2} + M\\,g\\cdot x\\;\\Rightarrow\\; ${T('B')} = \\frac{${tq(W, 'N')}\\cdot ${tq(p.len / 2, 'm')} + ${tq(Wp, 'N')}\\cdot ${tq(p.x, 'm')}}{${tq(p.b, 'm')}} = ${res(v.B, 'N', 1)}$$`, ['G', 'AB'], ['B']),
        step(L('Forces', 'Kräfte'), `<p>${L('Up equals down:', 'Nach oben gleich nach unten:')}</p>$$${T('A')} = m\\,g + M\\,g - ${T('B')} = ${tq(W + Wp, 'N')} - ${tq(v.B, 'N', 1)} = ${res(v.A, 'N', 1)}$$`, ['G', 'AB'], ['A']),
      ];
    },
  };

  // ================================================================ forearm and biceps
  // The forearm held level, with the elbow as the axis; the biceps pulls straight up at d from the
  // elbow, the forearm's weight acts at c, a ball in the hand at a. Find the muscle force and the
  // force of the joint on the forearm (down). Lengths in cm.
  const arm = {
    id: 'arm', family: 'supports', difficulty: 3,
    make(r) {
      const d = pick(r, [3, 4, 5]), a = pick(r, [30, 32, 33, 34, 35, 36]), c = pick(r, [14, 15, 16]), mA = pick(r, [1, 1.2, 1.5, 2]), M = pick(r, [1, 2, 3, 4, 5, 6]);
      return { d, a, c, mA, M };
    },
    solve(p, o = {}) {
      const WA = o.noArm ? 0 : p.mA * G, Fm = (WA * p.c + p.M * G * p.a) / p.d;
      return { Fm: exact(Fm), E: exact(o.jointUp ? Fm + WA + p.M * G : Fm - WA - p.M * G) };
    },
    traps: ['noArm', 'jointUp'],
    why: {
      noArm: () => L('The forearm’s own weight is missing.', 'Die Gewichtskraft des Unterarms fehlt.'),
      jointUp: () => L('The joint pushes down on the forearm: the muscle pulls up more than the weights pull down, and the joint takes up the difference.', 'Das Gelenk drückt auf den Unterarm nach unten: Der Muskel zieht stärker nach oben, als die Gewichtskräfte nach unten ziehen, und das Gelenk nimmt die Differenz auf.'),
    },
    fields: () => [field('Fm', ['Fm'], 'N', 1, L('muscle force', 'Muskelkraft')), field('E', ['E'], 'N', 1, L('force in the elbow joint', 'Kraft im Ellbogengelenk'))],
    title: () => L('Holding a ball', 'Einen Ball halten'),
    text: (p) => L(`A forearm is held level and carries a ball of ${kg(p.M)} in the hand, ${cm(p.a)} from the elbow. The forearm’s mass is ${kg(p.mA)}, with its centre of mass ${cm(p.c)} from the elbow. The biceps pulls straight up on the forearm ${cm(p.d)} from the elbow. How large is the muscle force, and how large the force with which the elbow joint pushes down on the forearm? Take g = 10 m/s².`,
      `Ein Unterarm wird waagrecht gehalten und trägt in der Hand, ${cm(p.a)} vom Ellbogen entfernt, einen Ball von ${kg(p.M)}. Der Unterarm hat die Masse ${kg(p.mA)}, sein Schwerpunkt liegt ${cm(p.c)} vom Ellbogen entfernt. Der Bizeps zieht ${cm(p.d)} vom Ellbogen entfernt senkrecht nach oben am Unterarm. Wie gross ist die Muskelkraft, und wie gross die Kraft, mit der das Ellbogengelenk auf den Unterarm nach unten drückt? Rechne mit g = 10 m/s².`),
    figure(p, v, view = {}) {
      const len = p.a + 6, B = beamPic(len, L('A forearm held level with a ball in the hand; the biceps pulls up near the elbow', 'Ein waagrecht gehaltener Unterarm mit einem Ball in der Hand; der Bizeps zieht nahe am Ellbogen nach oben')), P = B.P, show = view.show || new Set();
      const up = 120 / P.s;
      P.rect([-6 / P.s, B.h], [6 / P.s, B.h + up], 'beam', 4); // the upper arm
      P.line(B.top(p.d), [6 / P.s, B.h + up * 0.75], 'muscle', true);
      P.pivot(B.mid(0)); P.text(B.mid(0), L('elbow', 'Ellbogen'), 'lbl small', 'end', [-12, 8]);
      P.circle([p.a, B.h + 13 / P.s], 13 / P.s, 'ball');
      P.text([p.a, B.h + 26 / P.s], kg(p.M), 'lbl mass', 'middle', [0, -10]);
      P.dot(B.mid(p.c), 'dot', 2.2);
      P.dim(B.bottom(0), B.bottom(p.d), cm(p.d), -48);
      P.dim(B.bottom(0), B.bottom(p.c), cm(p.c), -70);
      P.dim(B.bottom(0), B.bottom(p.a), cm(p.a), -92);
      if (show.has('F')) {
        P.arrow(B.top(p.d), [0, 1], 70, `force k-h${view.hl && view.hl.has('Fm') ? ' hl' : ''}`, svgSym('Fm'), [8, 4]);
        P.arrow(B.mid(p.c), [0, -1], 30, 'force k-g', svgSym('G'), [8, 2]);
        P.arrow([p.a, B.h / 2], [0, -1], 30, 'force k-g', `${svgSym('G')}<tspan>′</tspan>`, [8, 6]);
      }
      if (show.has('E')) P.arrow(B.mid(0), [0, -1], 34, `force k-s${view.hl && view.hl.has('E') ? ' hl' : ''}`, svgSym('E'), [-8, 6]);
      return P.svg();
    },
    hints: () => [
      L('Take the elbow as the axis. The muscle turns the forearm up, the weights of forearm and ball turn it down.', 'Nimm den Ellbogen als Drehachse. Der Muskel dreht den Unterarm nach oben, die Gewichtskräfte von Unterarm und Ball drehen ihn nach unten.'),
      L('F_M · d = m_A g · c + M g · a: the muscle’s lever arm is tiny, so its force is large.', 'F_M · d = m_A g · c + M g · a: Der Hebelarm des Muskels ist winzig, darum ist seine Kraft gross.'),
      L('The forces balance too: the joint pushes down with F_E = F_M − m_A g − M g.', 'Auch die Kräfte heben sich auf: Das Gelenk drückt mit F_E = F_M − m_A g − M g nach unten.'),
    ],
    steps(p, v) {
      const WA = p.mA * G, WB = p.M * G;
      return [
        step(L('Torques about the elbow', 'Drehmomente bezüglich des Ellbogens'),
          `<p>${L('The joint’s force acts at the axis and has no torque. The muscle turns the forearm counterclockwise, the two weights clockwise:', 'Die Kraft des Gelenks greift in der Drehachse an und hat kein Drehmoment. Der Muskel dreht den Unterarm im Gegenuhrzeigersinn, die zwei Gewichtskräfte im Uhrzeigersinn:')}</p>` +
          `$$${T('Fm')}\\cdot d = m_\\mathrm{A}\\,g\\cdot c + M\\,g\\cdot a$$ $$${T('Fm')} = \\frac{${tq(WA, 'N')}\\cdot ${tq(p.c, 'cm')} + ${tq(WB, 'N')}\\cdot ${tq(p.a, 'cm')}}{${tq(p.d, 'cm')}} = ${res(v.Fm, 'N', 1)}$$` +
          `<p>${L(`About ${num(v.Fm / WB, 0)} times the ball’s weight: the muscle has a very short lever arm.`, `Etwa ${num(v.Fm / WB, 0)}-mal die Gewichtskraft des Balls: Der Muskel hat einen sehr kurzen Hebelarm.`)}</p>`, ['F'], ['Fm']),
        step(L('Force in the joint', 'Kraft im Gelenk'),
          `<p>${L('The forces balance as well: the muscle pulls up more than the weights pull down, so the joint pushes down on the forearm:', 'Auch die Kräfte heben sich auf: Der Muskel zieht stärker nach oben, als die Gewichtskräfte nach unten ziehen, also drückt das Gelenk auf den Unterarm nach unten:')}</p>` +
          `$$${T('E')} = ${T('Fm')} - m_\\mathrm{A}\\,g - M\\,g = ${tq(v.Fm, 'N', 1)} - ${tq(WA, 'N')} - ${tq(WB, 'N')} = ${res(v.E, 'N', 1)}$$`, ['F', 'E'], ['E']),
      ];
    },
  };

  // ================================================================ crowbar and wheelbarrow
  // A crowbar of length len on a fulcrum a from its tip lifts a stone (force F_L at the tip); the
  // hand pushes down at the other end. A wheelbarrow: the axle is the axis, the load (mass M) is a
  // from the axle, the hands lift at b. Lengths in cm.
  const crowbar = {
    id: 'crowbar', family: 'lever', difficulty: 2,
    make(r) {
      const len = pick(r, [80, 100, 120, 150]), a = pick(r, [10, 15, 20, 25]), FL = pick(r, [200, 300, 400, 500, 600, 800, 1000]);
      return { len, a, FL };
    },
    solve(p, o = {}) { return { F: exact(o.whole ? (p.FL * p.a) / p.len : o.swap ? (p.FL * (p.len - p.a)) / p.a : (p.FL * p.a) / (p.len - p.a)) }; },
    traps: ['whole', 'swap'],
    why: {
      whole: () => L('The hand’s lever arm is measured from the fulcrum, not from the tip of the bar.', 'Der Hebelarm der Hand wird vom Drehpunkt aus gemessen, nicht von der Spitze der Stange.'),
      swap: () => L('Reversed: the long lever arm needs the small force.', 'Umgekehrt: Der lange Hebelarm braucht die kleine Kraft.'),
    },
    fields: () => [field('F', ['F'], 'N', 1, L('force of the hand', 'Kraft der Hand'))],
    title: () => L('A crowbar', 'Ein Brecheisen'),
    text: (p) => L(`A crowbar ${cm(p.len)} long rests on a stone as a fulcrum, ${cm(p.a)} from its tip. To lift a heavy rock, its tip must push up on the rock with ${N(p.FL)}; the rock pushes down on the tip just as hard. With which force must the hand push down at the other end?`,
      `Ein Brecheisen von ${cm(p.len)} Länge liegt ${cm(p.a)} von seiner Spitze entfernt auf einem Stein als Drehpunkt. Um einen schweren Felsen anzuheben, muss seine Spitze mit ${N(p.FL)} nach oben auf den Felsen drücken; der Felsen drückt gleich stark auf die Spitze. Mit welcher Kraft muss die Hand am anderen Ende nach unten drücken?`),
    figure(p, v, view = {}) {
      const B = beamPic(p.len, L('A crowbar on a fulcrum near its tip', 'Ein Brecheisen auf einem Drehpunkt nahe seiner Spitze')), P = B.P;
      P.support(B.bottom(p.a));
      // the rock pushes down on the tip as hard as the tip pushes it up
      P.arrow([0, B.h + 46 / P.s], [0, -1], 46, 'force k-s', `${svgSym('F', 'L')} = ${N(p.FL)}`, [-8, -34]);
      P.arrow([p.len, B.h + 50 / P.s], [0, -1], 50, `force k-h${view.task ? '' : ' hl'}`, view.task ? `${svgSym('F')} = ?` : svgSym('F'), [8, -34]);
      P.dim(B.bottom(0), B.bottom(p.a), cm(p.a), -34);
      P.dim(B.bottom(0), B.bottom(p.len), cm(p.len), -56);
      return P.svg();
    },
    hints: () => [
      L('The fulcrum is the axis. The rock pushes down on the short arm, the hand on the long arm.', 'Der Drehpunkt ist die Drehachse. Der Fels drückt auf den kurzen Arm, die Hand auf den langen.'),
      L('Lever arms from the fulcrum: a on the rock’s side, ℓ − a on the hand’s side.', 'Hebelarme vom Drehpunkt aus: a auf der Seite des Felsens, ℓ − a auf der Seite der Hand.'),
      L('F · (ℓ − a) = F_L · a.', 'F · (ℓ − a) = F_L · a.'),
    ],
    steps: (p, v) => [
      step(L('Lever arms', 'Hebelarme'), `<p>${L(`Measured from the fulcrum: the rock’s force acts ${cm(p.a)} away, the hand ${cm(p.len - p.a)} away.`, `Vom Drehpunkt aus gemessen: Die Kraft des Felsens greift ${cm(p.a)} entfernt an, die Hand ${cm(p.len - p.a)} entfernt.`)}</p>`),
      step(L('Balance', 'Gleichgewicht'), `$$F\\cdot(\\ell - a) = F_\\mathrm{L}\\cdot a\\;\\Rightarrow\\; F = \\frac{F_\\mathrm{L}\\,a}{\\ell - a} = \\frac{${tq(p.FL, 'N')}\\cdot ${tq(p.a, 'cm')}}{${tq(p.len - p.a, 'cm')}} = ${res(v.F, 'N', 1)}$$` +
        `<p>${L('A long lever arm turns a small force into a large one.', 'Ein langer Hebelarm macht aus einer kleinen Kraft eine grosse.')}</p>`),
    ],
  };

  const wheelbarrow = {
    id: 'wheelbarrow', family: 'lever', difficulty: 2,
    make(r) { return { a: pick(r, [30, 40, 50, 60]), b: pick(r, [120, 130, 140, 150, 160]), M: pick(r, [30, 40, 50, 60, 80, 100]) }; },
    solve(p, o = {}) { return { F: exact(o.swap ? (p.M * G * p.b) / p.a : o.fromHands ? (p.M * G * (p.b - p.a)) / p.b : (p.M * G * p.a) / p.b) }; },
    traps: ['swap', 'fromHands'],
    why: {
      swap: () => L('Reversed: the hands have the long lever arm, so they need the small force.', 'Umgekehrt: Die Hände haben den langen Hebelarm, also brauchen sie die kleine Kraft.'),
      fromHands: () => L('The axis is the wheel’s axle: measure the load’s lever arm from there, not from the hands.', 'Die Drehachse ist die Radachse: Miss den Hebelarm der Last von dort aus, nicht von den Händen.'),
    },
    fields: () => [field('F', ['F'], 'N', 1, L('lifting force of the hands', 'Hebekraft der Hände'))],
    title: () => L('A wheelbarrow', 'Eine Schubkarre'),
    text: (p) => L(`A wheelbarrow carries a load of ${kg(p.M)} (with the barrow), whose centre of mass is ${cm(p.a)} from the wheel’s axle. The hands hold the handles ${cm(p.b)} from the axle. With which force must they lift? Take g = 10 m/s².`,
      `Eine Schubkarre trägt eine Last von ${kg(p.M)} (mit der Karre), deren Schwerpunkt ${cm(p.a)} von der Radachse entfernt ist. Die Hände halten die Griffe ${cm(p.b)} von der Achse entfernt. Mit welcher Kraft müssen sie anheben? Rechne mit g = 10 m/s².`),
    figure(p, v, view = {}) {
      const B = beamPic(p.b + 10, L('A wheelbarrow: the wheel, the load and the handles', 'Eine Schubkarre: Rad, Last und Griffe')), P = B.P, r = 26 / P.s;
      P.surface([-r - 20 / P.s, -r], [p.b * 0.4, -r]);
      P.circle([0, B.h / 2], r, 'wheel'); P.pivot(B.mid(0));
      P.poly([[p.a - 30 / P.s, B.h], [p.a + 34 / P.s, B.h], [p.a + 44 / P.s, B.h + 40 / P.s], [p.a - 40 / P.s, B.h + 40 / P.s]], 'load');
      P.text([p.a, B.h + 20 / P.s], kg(p.M), 'lbl mass', 'middle', [0, 0]);
      P.dot(B.mid(p.a), 'dot', 2.2);
      P.arrow(B.top(p.b), [0, 1], 46, `force k-h${view.task ? '' : ' hl'}`, view.task ? `${svgSym('F')} = ?` : svgSym('F'), [8, 4]);
      if (!view.task) P.arrow(B.mid(p.a), [0, -1], 32, 'force k-g', svgSym('G'), [8, 2]);
      P.dim(B.bottom(0), B.bottom(p.a), cm(p.a), -52);
      P.dim(B.bottom(0), B.bottom(p.b), cm(p.b), -74);
      return P.svg();
    },
    hints: () => [
      L('The axis is the wheel’s axle. The load’s weight turns the barrow one way, the hands the other.', 'Die Drehachse ist die Radachse. Die Gewichtskraft der Last dreht die Karre in die eine Richtung, die Hände in die andere.'),
      L('Both lever arms are measured from the axle: F · b = M g · a.', 'Beide Hebelarme werden von der Achse aus gemessen: F · b = M g · a.'),
    ],
    steps: (p, v) => [
      step(L('Balance about the axle', 'Gleichgewicht bezüglich der Achse'),
        `<p>${L('Load and hands are on the same side of the axle (a one-sided lever), but they turn the barrow in opposite senses:', 'Last und Hände liegen auf derselben Seite der Achse (ein einseitiger Hebel), drehen die Karre aber in entgegengesetzte Richtungen:')}</p>` +
        `$$F\\cdot b = M\\,g\\cdot a\\;\\Rightarrow\\; F = \\frac{M\\,g\\,a}{b} = \\frac{${tq(p.M * G, 'N')}\\cdot ${tq(p.a, 'cm')}}{${tq(p.b, 'cm')}} = ${res(v.F, 'N', 1)}$$` +
        `<p>${L('The wheel carries the rest.', 'Das Rad trägt den Rest.')}</p>`),
    ],
  };

  // ================================================================ winch
  // A crank of radius R turns a drum of radius r; the rope round the drum holds a load M.
  const winch = {
    id: 'winch', family: 'lever', difficulty: 2,
    make(r) { return { r: pick(r, [4, 5, 6, 8, 10]), R: pick(r, [20, 25, 30, 40]), M: pick(r, [10, 20, 30, 40, 50, 60, 80]) }; },
    solve(p, o = {}) { return { F: exact(o.swap ? (p.M * G * p.R) / p.r : (p.M * G * p.r) / p.R) }; },
    traps: ['swap'],
    why: { swap: () => L('Reversed: the crank has the long lever arm, so the hand needs only a small force.', 'Umgekehrt: Die Kurbel hat den langen Hebelarm, also braucht die Hand nur eine kleine Kraft.') },
    fields: () => [field('F', ['F'], 'N', 1, L('force on the crank', 'Kraft an der Kurbel'))],
    title: () => L('A winch', 'Eine Seilwinde'),
    text: (p) => L(`A winch holds a load of ${kg(p.M)} on a rope wound round a drum of radius ${cm(p.r)}. The crank is ${cm(p.R)} long. Which force, perpendicular to the crank, holds the load? Take g = 10 m/s².`,
      `Eine Seilwinde hält eine Last von ${kg(p.M)} an einem Seil, das um eine Trommel mit dem Radius ${cm(p.r)} gewickelt ist. Die Kurbel ist ${cm(p.R)} lang. Welche Kraft senkrecht zur Kurbel hält die Last? Rechne mit g = 10 m/s².`),
    figure(p, v, view = {}) {
      const P = new Pic(4, L('A winch: a drum with a rope and a load, turned by a crank', 'Eine Seilwinde: eine Trommel mit Seil und Last, gedreht mit einer Kurbel'));
      P.circle([0, 0], p.r, 'drum');
      P.line([0, 0], [p.R, 0], 'crank', true);
      P.circle([p.R, 0], 1.6, 'hub', true);
      P.pivot([0, 0]);
      P.line([-p.r, 0], [-p.r, -70 / P.s], 'w rope', true);
      P.rect([-p.r - 15 / P.s, -70 / P.s], [-p.r + 15 / P.s, -96 / P.s], 'load', 2);
      P.text([-p.r, -96 / P.s], kg(p.M), 'lbl mass', 'middle', [0, 16]);
      P.arrow([p.R, 0], [0, -1], 46, `force k-h${view.task ? '' : ' hl'}`, view.task ? `${svgSym('F')} = ?` : svgSym('F'), [8, 4]);
      P.dim([0, 0], [p.R, 0], `R = ${cm(p.R)}`, 14 + p.r * 4);
      P.dim([-p.r, 0], [0, 0], `r = ${cm(p.r)}`, 14 + p.r * 4);
      return P.svg();
    },
    hints: () => [
      L('The axle of the drum is the axis. The rope pulls at the edge of the drum (lever arm r), the hand at the end of the crank (lever arm R).', 'Die Achse der Trommel ist die Drehachse. Das Seil zieht am Rand der Trommel (Hebelarm r), die Hand am Ende der Kurbel (Hebelarm R).'),
      L('F · R = M g · r.', 'F · R = M g · r.'),
    ],
    steps: (p, v) => [
      step(L('Balance about the axle', 'Gleichgewicht bezüglich der Achse'),
        `<p>${L('The rope leaves the drum at its edge, so the load’s lever arm is the drum’s radius r; the hand’s is the crank’s length R:', 'Das Seil verlässt die Trommel an ihrem Rand, also ist der Hebelarm der Last der Trommelradius r; der der Hand ist die Kurbellänge R:')}</p>` +
        `$$F\\cdot R = M\\,g\\cdot r\\;\\Rightarrow\\; F = \\frac{M\\,g\\,r}{R} = \\frac{${tq(p.M * G, 'N')}\\cdot ${tq(p.r, 'cm')}}{${tq(p.R, 'cm')}} = ${res(v.F, 'N', 1)}$$`),
    ],
  };

  // ================================================================ mobile
  // Two light rods: the top one hangs at its string; m1 hangs a1 to its left, the lower rod a2 (x,
  // wanted) to its right. The lower rod holds m2 at b1 left and m3 (wanted) at b2 right of its
  // string. Masses in g, lengths in cm.
  const mobile = {
    id: 'mobile', family: 'lever', difficulty: 4,
    make(r) {
      const m2 = pick(r, [10, 20, 30, 40]), b1 = pick(r, [6, 8, 10, 12]), b2 = pick(r, [4, 5, 6, 8, 10, 12, 15]);
      if (b1 === b2) return null;
      const m3 = (m2 * b1) / b2, m1 = pick(r, [20, 30, 40, 50, 60, 80]), a1 = pick(r, [8, 10, 12, 15, 20]);
      const x = (m1 * a1) / (m2 + m3);
      if (x < 5 || x > 30 || m3 < 5) return null;
      return { m1, a1, m2, b1, b2 };
    },
    solve(p, o = {}) {
      const m3 = o.swap ? (p.m2 * p.b2) / p.b1 : (p.m2 * p.b1) / p.b2;
      return { m3: exact(m3), x: exact((p.m1 * p.a1) / (o.lower ? p.m2 : p.m2 + (o.swap ? (p.m2 * p.b2) / p.b1 : m3))) };
    },
    traps: ['swap', 'lower'],
    why: {
      swap: () => L('Reversed: the heavier mass hangs on the shorter arm.', 'Umgekehrt: Die schwerere Masse hängt am kürzeren Arm.'),
      lower: () => L('The whole lower part hangs at the end of the top rod: both of its masses count.', 'Der ganze untere Teil hängt am Ende des oberen Stabs: Beide seiner Massen zählen.'),
    },
    fields: () => [field('m3', ['m', 3], 'g', 1, L('mass', 'Masse')), field('x', ['x'], 'cm', 1, L('distance', 'Abstand'))],
    title: () => L('A mobile', 'Ein Mobile'),
    text: (p) => L(`A mobile is made of two light rods. On the lower rod, a mass of ${g_(p.m2)} hangs ${cm(p.b1)} to the left of its string and a mass m₃ ${cm(p.b2)} to the right. The lower rod hangs from the right end of the top rod, at the distance x from the top rod’s string; a mass of ${g_(p.m1)} hangs ${cm(p.a1)} to the left of that string. Find m₃ and x so that both rods hang level.`,
      `Ein Mobile besteht aus zwei leichten Stäben. Am unteren Stab hängt ${cm(p.b1)} links von seiner Schnur eine Masse von ${g_(p.m2)} und ${cm(p.b2)} rechts davon eine Masse m₃. Der untere Stab hängt am rechten Ende des oberen Stabs, im Abstand x von dessen Schnur; ${cm(p.a1)} links dieser Schnur hängt eine Masse von ${g_(p.m1)}. Bestimme m₃ und x so, dass beide Stäbe waagrecht hängen.`),
    figure(p, v, view = {}) {
      const x = view.task ? Math.max(12, p.b1 + 3) : v.x, P = new Pic(Math.min(7, 330 / (p.a1 + x + p.b2 + 6)), L('A mobile of two rods', 'Ein Mobile aus zwei Stäben'));
      const y1 = 0, y2 = -55 / P.s, drop = 34 / P.s, ball = (c, m, lbl) => { P.line(c, [c[0], c[1] - drop], 'w rope', true); P.circle([c[0], c[1] - drop - 9 / P.s], 9 / P.s, 'ball'); P.text([c[0], c[1] - drop - 18 / P.s], lbl, 'lbl mass', 'middle', [0, 14]); void m; };
      P.line([0, y1 + 40 / P.s], [0, y1], 'w rope', true);
      P.line([-p.a1, y1], [x, y1], 'rod', true);
      ball([-p.a1, y1], p.m1, g_(p.m1));
      P.line([x, y1], [x, y2], 'w rope', true);
      P.line([x - p.b1, y2], [x + p.b2, y2], 'rod', true);
      ball([x - p.b1, y2], p.m2, g_(p.m2));
      ball([x + p.b2, y2], 0, view.task ? `${svgSym('m', 3)} = ?` : g_(v.m3));
      P.dim([-p.a1, y1], [0, y1], cm(p.a1), 14);
      P.dim([0, y1], [x, y1], view.task ? `${svgSym('x')} = ?` : `${svgSym('x')} = ${cm(v.x)}`, 14, 'dimline hl');
      P.dim([x - p.b1, y2], [x, y2], cm(p.b1), 14);
      P.dim([x, y2], [x + p.b2, y2], cm(p.b2), 14);
      return P.svg();
    },
    hints: () => [
      L('Start at the bottom: the lower rod hangs level if m₂ g b₁ = m₃ g b₂.', 'Beginne unten: Der untere Stab hängt waagrecht, wenn m₂ g b₁ = m₃ g b₂.'),
      L('The lower rod with both masses hangs at the end of the top rod: it pulls there with (m₂ + m₃) g.', 'Der untere Stab mit beiden Massen hängt am Ende des oberen Stabs: Er zieht dort mit (m₂ + m₃) g.'),
      L('Top rod: m₁ g a₁ = (m₂ + m₃) g x.', 'Oberer Stab: m₁ g a₁ = (m₂ + m₃) g x.'),
    ],
    steps: (p, v) => [
      step(L('The lower rod', 'Der untere Stab'), `$$m_2\\,g\\,b_1 = m_3\\,g\\,b_2\\;\\Rightarrow\\; m_3 = \\frac{m_2\\,b_1}{b_2} = \\frac{${tq(p.m2, 'g')}\\cdot ${tq(p.b1, 'cm')}}{${tq(p.b2, 'cm')}} = ${res(v.m3, 'g', 1)}$$`),
      step(L('The top rod', 'Der obere Stab'), `<p>${L('At its right end hangs the whole lower part, with the mass m₂ + m₃ (the rod and strings are light):', 'An seinem rechten Ende hängt der ganze untere Teil mit der Masse m₂ + m₃ (Stab und Schnüre sind leicht):')}</p>` +
        `$$m_1\\,g\\,a_1 = (m_2 + m_3)\\,g\\,x\\;\\Rightarrow\\; x = \\frac{m_1\\,a_1}{m_2 + m_3} = \\frac{${tq(p.m1, 'g')}\\cdot ${tq(p.a1, 'cm')}}{${tq(p.m2 + v.m3, 'g', 1)}} = ${res(v.x, 'cm', 1)}$$`),
    ],
  };

  // ================================================================ tipping over
  // A box (width w, height h, mass m) on the floor, pushed horizontally at the height y; the floor
  // is rough enough that it does not slide. At which force does it start to tip over its edge?
  const tip = {
    id: 'tip', family: 'tipping', difficulty: 3,
    make(r) {
      const w = pick(r, [40, 50, 60, 80]), h = pick(r, [80, 100, 120, 150, 180]), y = pick(r, [50, 60, 80, 100, 120, 150].filter((v) => v <= h && v !== h));
      if (!y) return null;
      return { w, h, y, m: pick(r, [10, 20, 30, 40, 50, 60]) };
    },
    solve(p, o = {}) { return { F: exact((p.m * G * (o.full ? p.w : p.w / 2)) / (o.top ? p.h : p.y)) }; },
    traps: ['full', 'top'],
    why: {
      full: () => L('The weight acts at the centre of mass: its lever arm about the edge is half the width.', 'Die Gewichtskraft greift im Schwerpunkt an: Ihr Hebelarm bezüglich der Kante ist die halbe Breite.'),
      top: () => L('The push acts at the height given, not at the top of the box.', 'Die Kraft greift in der angegebenen Höhe an, nicht oben an der Kiste.'),
    },
    fields: () => [field('F', ['F'], 'N', 1, L('smallest force that tips it', 'kleinste Kraft, die sie kippt'))],
    title: () => L('Tipping over', 'Kippen'),
    text: (p) => L(`A box ${cm(p.w)} wide and ${cm(p.h)} high with a mass of ${kg(p.m)} stands on the floor. It is pushed horizontally ${cm(p.y)} above the floor. The floor is rough, so the box does not slide. With which force does it start to tip over? Take g = 10 m/s² and the centre of mass in the middle of the box.`,
      `Eine Kiste von ${cm(p.w)} Breite und ${cm(p.h)} Höhe und ${kg(p.m)} Masse steht auf dem Boden. Sie wird ${cm(p.y)} über dem Boden waagrecht gestossen. Der Boden ist rau, sodass die Kiste nicht rutscht. Bei welcher Kraft beginnt sie zu kippen? Rechne mit g = 10 m/s² und dem Schwerpunkt in der Mitte der Kiste.`),
    figure(p, v, view = {}) {
      const P = new Pic(1.4, L('A box on the floor, pushed sideways', 'Eine Kiste auf dem Boden, seitlich gestossen')), show = view.show || new Set();
      P.surface([-60, 0], [p.w + 50, 0]);
      P.rect([0, 0], [p.w, p.h], 'load', 2);
      P.text([p.w / 2, p.h], kg(p.m), 'lbl mass', 'middle', [0, 16]);
      P.com([p.w / 2, p.h / 2], show.has('G') ? 'S' : '');
      P.arrow([-56 / P.s, p.y], [1, 0], 56, `force k-h${view.task ? '' : ' hl'}`, view.task ? `${svgSym('F')} = ?` : svgSym('F'), [-60, -12]);
      P.dot([p.w, 0], 'dot', 3);
      P.text([p.w, 0], L('edge', 'Kante'), 'lbl small', 'start', [6, 12]);
      P.dim([p.w, 0], [p.w, p.y], cm(p.y), -16 - 0);
      P.dim([0, p.h], [p.w, p.h], cm(p.w), 14);
      P.dim([p.w, 0], [p.w, p.h], cm(p.h), -64);
      if (show.has('G')) {
        P.arrow([p.w / 2, p.h / 2], [0, -1], 50, 'force k-g', svgSym('G'), [8, 6]);
        P.dim([p.w / 2, 0], [p.w, 0], `${cm(p.w / 2)}`, -30, 'dimline hl');
      }
      return P.svg();
    },
    hints: () => [
      L('When it starts to tip, the box rests only on its edge on the far side: that edge is the axis.', 'Wenn sie zu kippen beginnt, steht die Kiste nur noch auf der Kante auf der anderen Seite: Diese Kante ist die Drehachse.'),
      L('About that edge, the push has the lever arm y (its height); the weight, acting at the centre, has the lever arm w/2.', 'Bezüglich dieser Kante hat die Kraft den Hebelarm y (ihre Höhe); die Gewichtskraft, die im Schwerpunkt angreift, den Hebelarm w/2.'),
      L('It tips when F · y > m g · w/2.', 'Sie kippt, wenn F · y > m g · w/2.'),
    ],
    steps: (p, v) => [
      step(L('The axis', 'Die Drehachse'), `<p>${L('As the box starts to tip, it stands only on its far edge; the floor’s forces act there and have no torque about it. The push turns the box over the edge, the weight turns it back:', 'Beginnt die Kiste zu kippen, steht sie nur noch auf der gegenüberliegenden Kante; die Kräfte des Bodens greifen dort an und haben bezüglich dieser Kante kein Drehmoment. Die Kraft dreht die Kiste über die Kante, die Gewichtskraft dreht sie zurück:')}</p>`, ['G']),
      step(L('The force', 'Die Kraft'), `$$F\\cdot y = m\\,g\\cdot\\frac{w}{2}\\;\\Rightarrow\\; F = \\frac{m\\,g\\,w}{2\\,y} = \\frac{${tq(p.m * G, 'N')}\\cdot ${tq(p.w, 'cm')}}{2\\cdot ${tq(p.y, 'cm')}} = ${res(v.F, 'N', 1)}$$` +
        `<p>${L('The higher the push, the smaller the force that tips the box.', 'Je höher die Kraft angreift, desto kleiner ist die Kraft, die die Kiste kippt.')}</p>`, ['G']),
    ],
  };

  // A cabinet (w × h) tilted on one edge: it falls over by itself once its centre of mass is beyond
  // the edge, i.e. at the tilt θ with tan θ = w/h (from the vertical).
  const tilt = {
    id: 'tilt', family: 'tipping', difficulty: 4, calc: 'always',
    make(r) { const w = pick(r, [30, 40, 50, 60, 80]), h = pick(r, [100, 120, 150, 180, 200]); return { w, h }; },
    solve(p, o = {}) { return { theta: exact(deg(Math.atan(o.swap ? p.h / p.w : o.full ? (2 * p.w) / p.h : p.w / p.h))) }; },
    traps: ['swap', 'full'],
    why: {
      swap: () => L('That is the angle measured the other way: from the floor, not from the vertical.', 'Das ist der Winkel von der anderen Seite gemessen: vom Boden aus, nicht von der Senkrechten.'),
      full: () => L('The centre of mass is in the middle: what counts is half the width against half the height.', 'Der Schwerpunkt liegt in der Mitte: Es zählt die halbe Breite gegen die halbe Höhe.'),
    },
    fields: () => [field('theta', ['theta'], 'deg', 1, L('tilt from the vertical', 'Neigung gegen die Senkrechte'))],
    title: () => L('How far can it lean?', 'Wie weit kann er sich neigen?'),
    text: (p) => L(`A cabinet ${cm(p.w)} wide and ${cm(p.h)} high, with its centre of mass in its middle, is tilted on one of its bottom edges. From which tilt angle θ against the vertical does it fall over by itself?`,
      `Ein Schrank von ${cm(p.w)} Breite und ${cm(p.h)} Höhe, mit dem Schwerpunkt in seiner Mitte, wird über eine seiner unteren Kanten gekippt. Ab welchem Neigungswinkel θ gegen die Senkrechte fällt er von selbst um?`),
    figure(p, v, view = {}) {
      const P = new Pic(1.2, L('A cabinet tilted on its edge', 'Ein über seine Kante gekippter Schrank')), show = view.show || new Set();
      // the edge at the origin; the cabinet extends to the left of it, tilted clockwise by th
      const th = rad(view.task ? Math.min(v.theta * 0.6, 12) : v.theta);
      const rotCw = ([x, y]) => [x * Math.cos(-th) - y * Math.sin(-th), x * Math.sin(-th) + y * Math.cos(-th)];
      const C = (x, y) => rotCw([x - p.w, y]);
      P.surface([-p.w - 60, 0], [p.h * 0.6, 0]);
      P.poly([C(0, 0), C(p.w, 0), C(p.w, p.h), C(0, p.h)], 'load');
      P.com(C(p.w / 2, p.h / 2), 'S');
      P.dot([0, 0], 'dot', 3); P.text([0, 0], L('edge', 'Kante'), 'lbl small', 'start', [6, 12]);
      if (view.task) {
        P.dim(C(0, p.h), C(p.w, p.h), cm(p.w), 14);
        P.dim(C(0, 0), C(0, p.h), cm(p.h), 14);
      }
      if (show.has('S')) {
        P.line([0, 0], [0, p.h * 1.05], 'action', true);
        P.line([0, 0], C(p.w / 2, p.h / 2), 'arm hl', true);
        P.arc([0, 0], 46, 90 - v.theta, 90, 'θ', 12);
      }
      return P.svg();
    },
    hints: () => [
      L('Standing on its edge, the cabinet turns about that edge. Its weight acts at the centre of mass S.', 'Auf der Kante stehend dreht sich der Schrank um diese Kante. Seine Gewichtskraft greift im Schwerpunkt S an.'),
      L('As long as S is above the base (on the inner side of the edge), the weight turns it back. It falls once S is straight above the edge.', 'Solange S über der Standfläche liegt (innerhalb der Kante), dreht ihn die Gewichtskraft zurück. Er fällt, sobald S senkrecht über der Kante liegt.'),
      L('Then the line from the edge to S is vertical: tan θ = (w/2) / (h/2) = w/h.', 'Dann ist die Linie von der Kante zu S senkrecht: tan θ = (w/2) / (h/2) = w/h.'),
    ],
    steps: (p, v) => [
      step(L('Tipping point', 'Kipppunkt'), `<p>${L('The weight acts at S. While S is on the inner side of the edge, its torque turns the cabinet back; once S is straight above the edge, the torque is zero, and beyond that the cabinet falls.', 'Die Gewichtskraft greift in S an. Solange S innerhalb der Kante liegt, dreht ihr Drehmoment den Schrank zurück; liegt S senkrecht über der Kante, ist das Drehmoment null, und darüber hinaus fällt der Schrank.')}</p>`, ['S']),
      step(L('The angle', 'Der Winkel'), `<p>${L('The line from the edge to S is then vertical. In the cabinet, it runs w/2 across and h/2 up, so it leans by θ with', 'Die Linie von der Kante zu S ist dann senkrecht. Im Schrank läuft sie w/2 quer und h/2 hoch, sie ist also um θ geneigt mit')}</p>` +
        `$$\\tan\\theta = \\frac{w/2}{h/2} = \\frac{w}{h} = \\frac{${tq(p.w, 'cm')}}{${tq(p.h, 'cm')}}\\;\\Rightarrow\\; \\theta = ${res(v.theta, 'deg', 1)}$$` +
        `<p>${L('A low, wide body is stable: its centre of mass must be lifted far before it is above the edge.', 'Ein niedriger, breiter Körper ist stabil: Sein Schwerpunkt muss weit angehoben werden, bis er über der Kante liegt.')}</p>`, ['S']),
    ],
  };

  // ================================================================ crane boom with a cable
  // A uniform boom (length len, mass m), hinged to a wall at its left end and held level by a cable
  // from its right end to the wall, at the angle α to the boom; a load M hangs at its right end.
  // Find the cable force and the horizontal force of the hinge. Lengths in m.
  const crane = {
    id: 'crane', family: 'supports', difficulty: 5, calc: 'trig',
    make(r, o = {}) {
      return { len: pick(r, [1, 1.5, 2, 2.5, 3]), m: pick(r, [10, 20, 30, 40]), M: pick(r, [20, 30, 40, 50, 60, 80, 100]), alpha: o.nice ? 30 : pick(r, [25, 30, 35, 40, 45, 50, 60]) };
    },
    solve(p, o = {}) {
      const s = o.cos ? Math.cos(rad(p.alpha)) : o.noAngle ? 1 : Math.sin(rad(p.alpha));
      const T = ((o.noBeam ? 0 : p.m / 2) + p.M) * G / s;
      return { T: exact(T), Hx: exact(T * (o.cos ? Math.sin(rad(p.alpha)) : Math.cos(rad(p.alpha)))) };
    },
    traps: ['noBeam', 'cos', 'noAngle'],
    why: {
      noBeam: () => L('The boom’s own weight is missing: it acts at its middle.', 'Die Gewichtskraft des Auslegers fehlt: Sie greift in seiner Mitte an.'),
      cos: () => L('Cosine instead of sine? Only the cable’s component perpendicular to the boom turns it.', 'Kosinus statt Sinus? Nur die Komponente der Seilkraft senkrecht zum Ausleger dreht ihn.'),
      noAngle: () => L('The cable pulls at an angle: only its vertical component F sin α holds the boom up.', 'Das Seil zieht schräg: Nur seine senkrechte Komponente F sin α hält den Ausleger.'),
    },
    fields: (p) => [field('T', ['T'], 'N', 1, L('cable force', 'Seilkraft')), ...(p.alpha === 30 && p.nice ? [] : [field('Hx', ['H'], 'N', 1, L('horizontal force of the hinge', 'horizontale Kraft des Gelenks'))])],
    title: () => L('A crane boom', 'Ein Kranausleger'),
    text: (p) => L(`A uniform boom ${m_(p.len)} long with a mass of ${kg(p.m)} is fixed to a wall by a hinge at its left end. A cable from its right end to the wall holds it level; the cable makes an angle of ${q(p.alpha, 'deg')} with the boom. A load of ${kg(p.M)} hangs at the right end. Find the force in the cable and the horizontal force with which the hinge pushes on the boom. Take g = 10 m/s².`,
      `Ein gleichmässiger Ausleger von ${m_(p.len)} Länge und ${kg(p.m)} Masse ist mit seinem linken Ende über ein Gelenk an einer Wand befestigt. Ein Seil von seinem rechten Ende zur Wand hält ihn waagrecht; das Seil bildet mit dem Ausleger einen Winkel von ${q(p.alpha, 'deg')}. Am rechten Ende hängt eine Last von ${kg(p.M)}. Bestimme die Kraft im Seil und die horizontale Kraft, mit der das Gelenk auf den Ausleger drückt. Rechne mit g = 10 m/s².`),
    figure(p, v, view = {}) {
      const B = beamPic(p.len, L('A boom hinged to a wall, held by a cable, with a load at its end', 'Ein an einer Wand angelenkter Ausleger, von einem Seil gehalten, mit einer Last am Ende')), P = B.P, show = view.show || new Set();
      const top = p.len * Math.tan(rad(p.alpha)) + B.h;
      P.surface([0, -50 / P.s], [0, top + 20 / P.s], -1);
      P.pivot(B.mid(0));
      P.line(B.top(p.len), [0, top], 'w rope', true);
      P.arc(B.top(p.len), 34, 180 - p.alpha, 180, q(p.alpha, 'deg'), 12);
      P.mass(B.bottom(p.len), 30, kg(p.M));
      if (!show.has('G')) P.text(B.bottom(p.len / 2), `m = ${kg(p.m)}`, 'lbl mass', 'middle', [0, 16]);
      P.dim(B.bottom(0), B.bottom(p.len), m_(p.len), -88);
      if (show.has('G')) P.arrow(B.mid(p.len / 2), [0, -1], 40, 'force k-g', svgSym('G'), [8, 6]);
      if (show.has('T')) {
        const u = [-Math.cos(rad(p.alpha)), Math.sin(rad(p.alpha))];
        P.arrow(B.top(p.len), u, 60, `force k-h${view.hl && view.hl.has('T') ? ' hl' : ''}`, svgSym('T'), [u[0] * 12 - 6, -u[1] * 12]);
      }
      if (show.has('H')) P.arrow(B.mid(0), [1, 0], 50, `force k-s${view.hl && view.hl.has('H') ? ' hl' : ''}`, svgSym('H'), [6, -12]);
      return P.svg();
    },
    hints: () => [
      L('Take the hinge as the axis: the hinge’s force then has no torque, and only the cable force is unknown.', 'Nimm das Gelenk als Drehachse: Dann hat die Kraft des Gelenks kein Drehmoment, und nur die Seilkraft ist unbekannt.'),
      L('The cable’s lever arm about the hinge is ℓ sin α (or: only F sin α, the component perpendicular to the boom, turns it).', 'Der Hebelarm des Seils bezüglich des Gelenks ist ℓ sin α (oder: Nur F sin α, die Komponente senkrecht zum Ausleger, dreht ihn).'),
      L('F_S sin α · ℓ = m g · ℓ/2 + M g · ℓ. Horizontally, the hinge pushes against the cable’s horizontal component F_S cos α.', 'F_S sin α · ℓ = m g · ℓ/2 + M g · ℓ. Horizontal drückt das Gelenk gegen die horizontale Komponente F_S cos α des Seils.'),
    ],
    steps(p, v) {
      const out = [
        step(L('Torques about the hinge', 'Drehmomente bezüglich des Gelenks'),
          `<p>${L('The hinge’s force has no lever arm. The weights turn the boom down (clockwise); the cable, with its component perpendicular to the boom, turns it up:', 'Die Kraft des Gelenks hat keinen Hebelarm. Die Gewichtskräfte drehen den Ausleger nach unten (im Uhrzeigersinn), das Seil mit seiner Komponente senkrecht zum Ausleger nach oben:')}</p>` +
          `$$${T('T')}\\sin\\alpha\\cdot\\ell = m\\,g\\cdot\\frac{\\ell}{2} + M\\,g\\cdot\\ell\\;\\Rightarrow\\; ${T('T')} = \\frac{(m/2 + M)\\,g}{\\sin\\alpha} = \\frac{${tq((p.m / 2 + p.M) * G, 'N')}}{\\sin${tq(p.alpha, 'deg')}} = ${res(v.T, 'N', 1)}$$` +
          `<p>${L('ℓ cancels: the length of the boom does not matter.', 'ℓ kürzt sich weg: Die Länge des Auslegers spielt keine Rolle.')}</p>`, ['G', 'T'], ['T']),
      ];
      if (crane.fields(p).length > 1) out.push(step(L('Horizontal forces', 'Horizontale Kräfte'),
        `<p>${L('The cable also pulls the boom toward the wall with F_S cos α; the hinge pushes back just as hard:', 'Das Seil zieht den Ausleger auch mit F_S cos α zur Wand hin; das Gelenk drückt gleich stark zurück:')}</p>` +
        `$$${T('H')} = ${T('T')}\\cos\\alpha = ${tq(v.T, 'N', 1)}\\cdot\\cos${tq(p.alpha, 'deg')} = ${res(v.Hx, 'N', 1)}$$`, ['G', 'T', 'H'], ['H']));
      return out;
    },
  };
  // without a calculator (30°), only the cable force: its cosine is not a simple number
  crane.make = ((make) => (r, o = {}) => ({ ...make(r, o), nice: !!o.nice }))(crane.make);

  // ================================================================ ladder against a wall
  // A uniform ladder (length len, mass m) leans against a smooth wall; its foot is a from the
  // wall, its top h up the wall (a, h, len a right triangle). The wall pushes horizontally with
  // F_W, the floor up with F_N and sideways with friction F_R = F_W. Optionally a person of mass M
  // stands at the fraction f of the way up. Lengths in m.
  // the ladder alone: foot, height and length 3 : 4 : 5, so that μ = a/(2h) = 0.375 exactly; with
  // a person, other right triangles too (μ then needs a calculator)
  const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17]];
  function ladderMake(r, person) {
    const t = person ? pick(r, TRIPLES) : TRIPLES[0], k = pick(r, [0.25, 0.5, 1]), [a, h, len] = t.map((x) => x * k);
    if (len < 2.5 || len > 9) return null;
    const p = { a, h, len, m: person ? pick(r, [8, 10, 12, 15, 20]) : pick(r, [8, 12, 16, 20]) };
    if (person) { p.M = pick(r, [50, 60, 70, 80]); p.f = pick(r, [0.5, 0.75]); }
    return p;
  }
  function ladderSolve(p, o = {}) {
    const arm = o.full ? 1 : 0.5, M = p.M || 0, f = p.f || 0, [a, h] = o.swap ? [p.h, p.a] : [p.a, p.h];
    const W = ((p.m * arm + M * f) * G * a) / h;
    return { W: exact(W), mu: exact(W / ((p.m + M) * G)) };
  }
  function ladderFigure(p, v, view = {}) {
    const P = new Pic(Math.min(60, 260 / p.h), L('A ladder leaning against a wall', 'Eine Leiter, die an einer Wand lehnt')), show = view.show || new Set();
    P.surface([0, -0.2], [0, p.h + 0.3], -1);
    P.surface([0, 0], [p.a + 0.8, 0]);
    P.line([p.a, 0], [0, p.h], 'ladder', true);
    const at = (s) => [p.a * (1 - s), p.h * s];
    P.dot(at(0.5), 'dot', 2.4);
    if (p.M) { const c = at(p.f); P.circle([c[0] + 0.12, c[1] + 0.35], 0.12, 'ball'); P.line([c[0] + 0.12, c[1] + 0.23], [c[0] + 0.12, c[1]], 'w', true); P.text([c[0] + 0.12, c[1] + 0.5], kg(p.M), 'lbl mass', 'start', [10, -6]); }
    P.text(at(0.5), `m = ${kg(p.m)}`, 'lbl mass', 'start', [14, 22]);
    P.dim([0, 0], [p.a, 0], m_(p.a), -18);
    P.dim([0, 0], [0, p.h], m_(p.h), 30);
    P.dim([p.a, 0], [0, p.h], m_(p.len), 22);
    const hl = view.hl || new Set();
    if (show.has('F')) {
      P.arrow([0, p.h], [1, 0], 50, `force k-h${hl.has('W') ? ' hl' : ''}`, svgSym('W'), [6, -10]);
      P.arrow([p.a, 0], [0, 1], 50, 'force k-h', svgSym('N'), [8, 0]);
      P.arrow([p.a, 0], [-1, 0], 44, `force k-s${hl.has('R') ? ' hl' : ''}`, svgSym('R'), [-4, 14]);
      P.arrow(at(0.5), [0, -1], 40, 'force k-g', svgSym('G'), [8, 8]);
    }
    return P.svg();
  }
  function ladder(id, difficulty, person) {
    return {
      id, family: 'ladder', difficulty, calc: person ? 'always' : undefined,
      make: (r) => ladderMake(r, person),
      solve: ladderSolve,
      traps: ['full', 'swap'],
      why: {
        full: () => L('The weight acts at the middle of the ladder: its lever arm about the foot is half the distance a.', 'Die Gewichtskraft greift in der Mitte der Leiter an: Ihr Hebelarm bezüglich des Fusspunkts ist die halbe Distanz a.'),
        swap: () => L('Lever arms swapped: the wall’s horizontal force has the height h as its lever arm, the weights horizontal distances.', 'Hebelarme vertauscht: Die horizontale Kraft der Wand hat die Höhe h als Hebelarm, die Gewichtskräfte horizontale Abstände.'),
      },
      fields: () => [field('W', ['W'], 'N', 1, L('force of the wall', 'Kraft der Wand')), field('mu', ['mu'], '', person ? 2 : 3, L('smallest coefficient of static friction', 'kleinste Haftreibungszahl'))],
      title: () => (person ? L('Climbing a ladder', 'Auf der Leiter') : L('A ladder against a wall', 'Eine Leiter an der Wand')),
      text: (p) => L(`A uniform ladder ${m_(p.len)} long with a mass of ${kg(p.m)} leans against a smooth wall (no friction there); its foot stands ${m_(p.a)} from the wall, its top touches the wall ${m_(p.h)} above the floor.${person ? ` A person of ${kg(p.M)} stands ${p.f === 0.5 ? 'halfway' : 'three quarters of the way'} up the ladder.` : ''} How large is the force of the wall on the ladder, and which coefficient of static friction at the floor is needed at least so that the ladder does not slip? Take g = 10 m/s².`,
        `Eine gleichmässige Leiter von ${m_(p.len)} Länge und ${kg(p.m)} Masse lehnt an einer glatten Wand (dort keine Reibung); ihr Fuss steht ${m_(p.a)} von der Wand entfernt, ihr oberes Ende berührt die Wand ${m_(p.h)} über dem Boden.${person ? ` Eine Person von ${kg(p.M)} steht ${p.f === 0.5 ? 'auf halber Höhe der Leiter' : 'auf drei Vierteln der Leiter'}.` : ''} Wie gross ist die Kraft der Wand auf die Leiter, und welche Haftreibungszahl am Boden ist mindestens nötig, damit die Leiter nicht rutscht? Rechne mit g = 10 m/s².`),
      figure: ladderFigure,
      hints: () => [
        L('Forces on the ladder: its weight (at its middle), the wall’s force (horizontal, since the wall is smooth), and at the foot the floor’s normal force and friction.', 'Kräfte auf die Leiter: ihre Gewichtskraft (in der Mitte), die Kraft der Wand (horizontal, da die Wand glatt ist) und am Fuss die Normalkraft und die Reibung des Bodens.'),
        L('Take the foot as the axis: the floor’s forces have no torque there. The wall’s force has the lever arm h, the ladder’s weight a/2.', 'Nimm den Fusspunkt als Drehachse: Dort haben die Kräfte des Bodens kein Drehmoment. Die Kraft der Wand hat den Hebelarm h, die Gewichtskraft der Leiter a/2.'),
        L('Horizontally, friction balances the wall’s force: F_R = F_W. Vertically, F_N carries all the weight. Then μ ≥ F_R / F_N.', 'Horizontal hält die Reibung der Kraft der Wand das Gleichgewicht: F_R = F_W. Vertikal trägt F_N die ganze Gewichtskraft. Dann μ ≥ F_R / F_N.'),
      ],
      steps(p, v) {
        const W1 = p.m * G, W2 = (p.M || 0) * G, Nn = W1 + W2;
        const rhs = person ? `m\\,g\\cdot\\frac{a}{2} + M\\,g\\cdot ${num(p.f, 2)}\\,a` : 'm\\,g\\cdot\\frac{a}{2}';
        const nums = person ? `${tq(W1, 'N')}\\cdot ${tq(p.a / 2, 'm')} + ${tq(W2, 'N')}\\cdot ${tq(p.f * p.a, 'm', 3)}` : `${tq(W1, 'N')}\\cdot ${tq(p.a / 2, 'm')}`;
        return [
          step(L('Torques about the foot', 'Drehmomente bezüglich des Fusspunkts'),
            `<p>${L('The floor’s forces act at the foot and have no torque. The wall pushes horizontally at the height h; the weights act at horizontal distances from the foot (the ladder’s at its middle, a/2):', 'Die Kräfte des Bodens greifen im Fusspunkt an und haben kein Drehmoment. Die Wand drückt in der Höhe h horizontal; die Gewichtskräfte greifen in horizontalen Abständen vom Fusspunkt an (die der Leiter in ihrer Mitte, a/2):')}</p>` +
            `$$${T('W')}\\cdot h = ${rhs}\\;\\Rightarrow\\; ${T('W')} = \\frac{${nums}}{${tq(p.h, 'm')}} = ${res(v.W, 'N', 1)}$$`, ['F'], ['W']),
          step(L('Friction', 'Reibung'),
            `<p>${L('Horizontally, only the wall and friction act, so friction must be as large as the wall’s force; vertically, the floor carries all the weight:', 'Horizontal wirken nur die Wand und die Reibung, also muss die Reibung so gross sein wie die Kraft der Wand; vertikal trägt der Boden die ganze Gewichtskraft:')}</p>` +
            `$$${T('R')} = ${T('W')} = ${tq(v.W, 'N', 1)},\\qquad ${T('N')} = ${tq(Nn, 'N')}$$ $$${T('mu')} \\ge \\frac{${T('R')}}{${T('N')}} = \\frac{${tq(v.W, 'N', 1)}}{${tq(Nn, 'N')}} = ${res(v.mu, '', 2)}$$` +
            `<p>${L('The flatter the ladder (larger a), the more friction it needs.', 'Je flacher die Leiter (grösseres a), desto mehr Reibung braucht sie.')}</p>`, ['F'], ['R']),
        ];
      },
    };
  }

  SCENARIOS.push(winch, crowbar, wheelbarrow, plank, arm, tip, mobile, tilt, ladder('ladder', 4, false), ladder('ladder-person', 5, true), crane);
})(typeof window !== 'undefined' ? window : globalThis);
