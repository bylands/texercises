// The situations of the worksheet “Übungen Kräftesysteme”: one box at rest or pulled across the
// floor, two boxes pushed or joined by a rope, pulleys and slopes. A scenario has an id, a
// difficulty from 1 to 5 (for practice levels and the arcade), trig if its results need sine or
// cosine, and:
//   make(r, o)         random parameters (null if they do not fit); with o.nice, angles are
//                      the 3-4-5 angle, so that no calculator is needed
//   solve(p, o)        the wanted quantities; o switches on a typical wrong idea (see WHY in
//                      generator.js) or g = 9.81 m/s², so that wrong answers can be recognised
//   traps              the wrong ideas worth checking
//   fields(p)          the wanted quantities, in order: { key, sym: [symbol, index], unit, what }
//   text(p), scene(p)  the situation, in words and as a drawing (see draw.js)
//   hints(p, v), steps(p, v)  hints and the worked solution: steps { text, show, hl } that say
//                      which forces of the drawing to show and highlight
//   boxes(p)           (two boxes) the names of box 1 and box 2, for the table of forces;
//                      forceOn { id: box } where a force without index 2 acts on box 2 (index 1)
// Values come out exact; the texts round them.
(function (root) {
  'use strict';

  const FS = root.FS, { Scene } = root.Draw;
  const { L, G, tex: T, tq, q, num, svgSym, pick, rad } = FS;
  const res = (x, u) => `\\htmlClass{result}{${tq(x, u)}}`;
  // Box sizes [width, height]: within a drawing, the area is proportional to the mass and all boxes
  // have the same shape. The scale suits the drawing's masses ms, so that the lightest box is big
  // enough for its arrows.
  const dims = (m, ms = [m]) => { const h = Math.max(44, 64 / Math.sqrt(Math.min(...ms))) * Math.sqrt(m); return [1.25 * h, h]; };
  const kg = (m) => q(m, 'kg');

  const WHAT = {
    G: () => L('weight of the box', 'Gewichtskraft auf die Kiste'),
    N: () => L('normal force on the box', 'Normalkraft auf die Kiste'),
    R: () => L('friction force', 'Reibungskraft'),
    res: () => L('net force on the whole system', 'resultierende Kraft auf das ganze System'),
    a: () => L('acceleration', 'Beschleunigung'),
    F: () => L('pulling force', 'Zugkraft'),
    S: () => L('rope force', 'Seilkraft'),
    K: () => L('force between the boxes', 'Kraft zwischen den Kisten'),
  };
  const field = (key, idx = '', what) => ({ key: key + idx, sym: [key === 'a' ? 'a' : key, idx], unit: key === 'a' ? 'a' : 'N', what: what || WHAT[key]() });
  const m$ = (s) => `$${s}$`;

  // The 3-4-5 angle (sin α = 0.6, cos α = 0.8): with it, components need no calculator. Exercises
  // that use it state sin α and cos α instead of the angle.
  const A345 = (Math.asin(0.6) * 180) / Math.PI;
  const is345 = (p) => Math.abs(p.alpha - A345) < 1e-9;
  const angleLabel = (p) => (is345(p) ? '<tspan font-style="italic">α</tspan>' : q(p.alpha, 'deg'));
  const trig = (fn, p) => (is345(p) ? FS.texNum(fn === 'sin' ? 0.6 : 0.8) : `\\${fn}${tq(p.alpha, 'deg')}`);
  const sinCos = () => L('sin α = 0.6 and cos α = 0.8', 'sin α = 0.6 und cos α = 0.8');

  const step = (rule, text, show, hl) => ({ text: (rule ? `<p class="step-rule">${rule}</p>` : '') + text, show, hl: hl || show });

  // ---------------------------------------------------------------- one box on the floor
  // The floor, a box and the usual points where forces act.
  function floorBox(m, mu, w = 500, h = 300) {
    const sc = new Scene(w, h, L('A box on the floor', 'Eine Kiste auf dem Boden'));
    const y0 = h - 76, [bw, bh] = dims(m), x0 = (w - bw) / 2;
    sc.surface([40, y0], [w - 40, y0]);
    const at = sc.box([x0, y0], [1, 0], [0, -1], bw, bh, kg(m));
    if (mu != null) sc.text(48, y0 + 22, `${svgSym('mu')} = ${num(mu, 2)}`, 'lbl small', 'start');
    const c = at(bw / 2, bh / 2);
    return {
      sc, at, bw, bh, y0, c,
      weight: (id = 'G', sym = ['G']) => sc.force({ id, kind: 'g', at: [c[0] - 6, c[1]], dir: [0, 1], sym, lab: [6, 6] }),
      normal: (id = 'N', sym = ['N']) => sc.force({ id, kind: 'n', at: [c[0] + 6, y0], dir: [0, -1], sym, lab: [8, 4] }),
      friction: (id = 'R', sym = ['R']) => sc.force({ id, kind: 'r', at: [x0 + 0.3 * bw, y0], dir: [-1, 0], sym, lab: [-4, 16] }),
    };
  }
  // Fills in the magnitudes of a scene's forces from { id: value }.
  const sized = (sc, mags) => { sc.forces.forEach((s) => { if (mags[s.id] != null) s.mag = mags[s.id]; }); return sc; };

  const restUp = {
    id: 'rest-up', difficulty: 1,
    make(r) {
      const m = pick(r, [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8]), dir = pick(r, ['up', 'down']);
      const list = [2, 3, 4, 5, 6, 8, 10, 12, 15, 18, 20, 25, 30, 40, 50].filter((F) => F >= 0.1 * m * G && F <= (dir === 'up' ? 0.85 : 1.2) * m * G);
      return list.length ? { m, dir, F: pick(r, list) } : null;
    },
    solve(p, o = {}) {
      const g = o.g || G, FG = p.m * g, up = (p.dir === 'up') !== !!o.dirF;
      return { G: FG, N: o.flatN ? FG : up ? FG - p.F : FG + p.F };
    },
    traps: ['g', 'flatN', 'dirF'],
    why: {
      flatN: () => L('The floor does not carry the whole weight here: the rope or hand also pushes or pulls on the box.', 'Der Boden trägt hier nicht die ganze Gewichtskraft: Auch das Seil oder die Hand übt eine Kraft auf die Kiste aus.'),
      dirF: () => L('Check the direction of the force: does it relieve the floor or press the box harder onto it?', 'Achte auf die Richtung der Kraft: Entlastet sie den Boden, oder drückt sie die Kiste stärker auf ihn?'),
    },
    fields: () => [field('G'), field('N')],
    title: (p) => (p.dir === 'up' ? L('Lifted, but not enough', 'Angehoben, aber zu wenig') : L('Pressed onto the floor', 'Auf den Boden gedrückt')),
    text: (p) => (p.dir === 'up'
      ? L(`A box with a mass of ${kg(p.m)} stands still on the floor. A rope pulls it vertically upwards with a force of ${q(p.F, 'N')}.`,
        `Eine Kiste mit der Masse ${kg(p.m)} steht still auf dem Boden. Ein Seil zieht sie mit einer Kraft von ${q(p.F, 'N')} senkrecht nach oben.`)
      : L(`A box with a mass of ${kg(p.m)} stands still on the floor. A hand pushes it vertically downwards with a force of ${q(p.F, 'N')}.`,
        `Eine Kiste mit der Masse ${kg(p.m)} steht still auf dem Boden. Eine Hand drückt sie mit einer Kraft von ${q(p.F, 'N')} senkrecht nach unten.`)),
    scene(p, v) {
      const b = floorBox(p.m, null);
      b.weight(); b.normal();
      // the rope pulls at the top, in line with the weight; the hand pushes on the top, right of the normal force
      if (p.dir === 'up') b.sc.force({ id: 'F', kind: 's', at: b.at(b.bw / 2 - 6, b.bh), dir: [0, -1], sym: ['F'], value: q(p.F, 'N'), task: 'value', lab: [-8, 4] });
      else b.sc.force({ id: 'F', kind: 's', at: b.at(b.bw / 2 + 20, b.bh), dir: [0, 1], max: 0.75 * b.bh, labTail: true, sym: ['F'], value: q(p.F, 'N'), task: 'value', lab: [6, -12] });
      return sized(b.sc, { G: v.G, N: v.N, F: p.F });
    },
    hints: (p) => [
      L('Find all forces on the box: its weight, the force of the floor and the force of the rope or hand.', 'Bestimme alle Kräfte auf die Kiste: die Gewichtskraft, die Kraft des Bodens und die Kraft des Seils bzw. der Hand.'),
      L(`The box stands still, so the net force on it is zero: the upward forces balance the downward ones.`, `Die Kiste ruht, also ist die resultierende Kraft null: Die Kräfte nach oben heben die Kräfte nach unten auf.`),
      p.dir === 'up' ? m$(`${T('N')} + ${T('F')} = ${T('G')}`) : m$(`${T('N')} = ${T('G')} + ${T('F')}`),
    ],
    steps(p, v) {
      const up = p.dir === 'up';
      return [
        step(L('Weight', 'Gewichtskraft'), `<p>${L('The Earth pulls the box down with', 'Die Erde zieht die Kiste nach unten mit')} $$${T('G')} = ${T('m')}\\,g = ${tq(p.m, 'kg')}\\cdot ${tq(G, 'a')} = ${res(v.G, 'N')}.$$</p>`, ['G']),
        step(L('Forces on the box', 'Kräfte auf die Kiste'),
          `<p>${up ? L(`The rope pulls up with ${m$(T('F'))}, the floor pushes up with the normal force ${m$(T('N'))}.`, `Das Seil zieht mit ${m$(T('F'))} nach oben, der Boden drückt mit der Normalkraft ${m$(T('N'))} nach oben.`)
            : L(`The hand pushes down with ${m$(T('F'))}, the floor pushes up with the normal force ${m$(T('N'))}.`, `Die Hand drückt mit ${m$(T('F'))} nach unten, der Boden drückt mit der Normalkraft ${m$(T('N'))} nach oben.`)}</p>`,
          ['G', 'F', 'N'], ['F', 'N']),
        step(L('Balance', 'Gleichgewicht'),
          `<p>${L('The box stands still, so the net force is zero: up equals down.', 'Die Kiste ruht, also ist die resultierende Kraft null: Die Kräfte nach oben sind gleich gross wie die nach unten.')}</p>` +
          (up ? `$$${T('N')} + ${T('F')} = ${T('G')} \\;\\Rightarrow\\; ${T('N')} = ${T('G')} - ${T('F')} = ${tq(v.G, 'N')} - ${tq(p.F, 'N')} = ${res(v.N, 'N')}$$`
            : `$$${T('N')} = ${T('G')} + ${T('F')} = ${tq(v.G, 'N')} + ${tq(p.F, 'N')} = ${res(v.N, 'N')}$$`) +
          `<p>${up ? L('The rope carries part of the weight, so the floor has to push less.', 'Das Seil trägt einen Teil der Gewichtskraft, darum muss der Boden weniger stark drücken.')
            : L('The floor has to hold the box and the hand.', 'Der Boden muss die Kiste und die Hand halten.')}</p>`,
          ['G', 'F', 'N'], ['N']),
      ];
    },
  };

  const restAngle = {
    id: 'rest-angle', difficulty: 2, trig: true,
    make(r, o = {}) {
      const m = pick(r, [1, 1.5, 2, 2.5, 3, 4, 5]), ref = pick(r, ['v', 'h']), alpha = o.nice ? A345 : pick(r, [20, 25, 30, 35, 40, 45, 50, 60]);
      const F = pick(r, o.nice ? [5, 10, 15, 20, 25, 30, 40] : [4, 5, 6, 8, 10, 12, 14, 15, 16, 18, 20, 25, 30, 40]);
      const up = F * (ref === 'v' ? Math.cos(rad(alpha)) : Math.sin(rad(alpha)));
      if (up > 0.8 * m * G || F * Math.min(Math.sin(rad(alpha)), Math.cos(rad(alpha))) < 1.5) return null;
      return { m, F, alpha, ref };
    },
    solve(p, o = {}) {
      const g = o.g || G, a = rad(p.alpha);
      let [up, side] = p.ref === 'v' ? [Math.cos(a), Math.sin(a)] : [Math.sin(a), Math.cos(a)];
      if (o.swap) [up, side] = [side, up];
      return { N: o.flatN ? p.m * g : o.whole ? p.m * g - p.F : p.m * g - p.F * up, R: o.whole ? p.F : p.F * side };
    },
    traps: ['g', 'swap', 'flatN', 'whole'],
    why: {
      flatN: () => L('The pull is partly upwards: it carries part of the weight, so the floor pushes less.', 'Die Zugkraft zeigt teilweise nach oben: Sie trägt einen Teil der Gewichtskraft, darum drückt der Boden weniger.'),
      whole: () => L('Only a component of the pull acts in this direction: split it into a vertical and a horizontal part.', 'In diese Richtung wirkt nur eine Komponente der Zugkraft: Zerlege sie in einen senkrechten und einen waagrechten Teil.'),
    },
    fields: () => [field('N'), field('R', '', L('static friction force', 'Haftreibungskraft'))],
    title: () => L('Pulled at an angle', 'Schräg gezogen'),
    text: (p) => L(`A box with a mass of ${kg(p.m)} stands still on the floor, although a rope pulls on it with a force of ${q(p.F, 'N')}, at an angle ${is345(p) ? 'α' : `of ${q(p.alpha, 'deg')}`} to the ${p.ref === 'v' ? 'vertical' : 'horizontal'}${is345(p) ? `, where ${sinCos()}` : ''}.`,
      `Eine Kiste mit der Masse ${kg(p.m)} steht still auf dem Boden, obwohl ein Seil mit einer Kraft von ${q(p.F, 'N')} unter einem Winkel ${is345(p) ? 'α' : `von ${q(p.alpha, 'deg')}`} zur ${p.ref === 'v' ? 'Senkrechten' : 'Waagrechten'} an ihr zieht${is345(p) ? `, wobei ${sinCos()}` : ''}.`),
    scene(p, v) {
      const b = floorBox(p.m, null), a = rad(p.alpha);
      b.weight(); b.normal(); b.friction();
      const top = b.at(b.bw / 2, b.bh);
      const dir = p.ref === 'v' ? [Math.sin(a), -Math.cos(a)] : [Math.cos(a), -Math.sin(a)];
      if (p.ref === 'v') { b.sc.line(top[0], top[1], top[0], top[1] - 62, 'w dash'); b.sc.angle(top, 34, 90 - p.alpha, 90, angleLabel(p), 16); }
      else { b.sc.line(top[0], top[1], top[0] + 70, top[1], 'w dash'); b.sc.angle(top, 34, 0, p.alpha, angleLabel(p), 16); }
      b.sc.force({ id: 'F', kind: 's', at: top, dir, sym: ['F'], value: q(p.F, 'N'), task: 'value', lab: [8, -6] });
      return sized(b.sc, { G: p.m * G, N: v.N, R: v.R, F: p.F });
    },
    hints: (p) => [
      L('Split the pull into a vertical and a horizontal component.', 'Zerlege die Zugkraft in eine senkrechte und eine waagrechte Komponente.'),
      L('The box stands still: vertically, the floor and the pull together balance the weight; horizontally, static friction balances the pull.', 'Die Kiste ruht: Senkrecht halten Boden und Zugkraft zusammen der Gewichtskraft das Gleichgewicht, waagrecht hält die Haftreibung der Zugkraft das Gleichgewicht.'),
      p.ref === 'v' ? L(`The angle is measured from the vertical: the vertical component is ${m$(`${T('F')}\\cos\\alpha`)}.`, `Der Winkel ist von der Senkrechten aus gemessen: Die senkrechte Komponente ist ${m$(`${T('F')}\\cos\\alpha`)}.`)
        : L(`The angle is measured from the horizontal: the vertical component is ${m$(`${T('F')}\\sin\\alpha`)}.`, `Der Winkel ist von der Waagrechten aus gemessen: Die senkrechte Komponente ist ${m$(`${T('F')}\\sin\\alpha`)}.`),
    ],
    steps(p, v) {
      const [up, sd] = p.ref === 'v' ? ['\\cos', '\\sin'] : ['\\sin', '\\cos'];
      const FG = p.m * G;
      return [
        step(L('Forces on the box', 'Kräfte auf die Kiste'),
          `<p>${L(`Weight ${m$(`${T('G')} = ${T('m')}\\,g = ${tq(FG, 'N')}`)} down, the pull ${m$(T('F'))} at an angle, the normal force ${m$(T('N'))} up, and static friction ${m$(T('R'))} along the floor, against the horizontal part of the pull.`,
            `Gewichtskraft ${m$(`${T('G')} = ${T('m')}\\,g = ${tq(FG, 'N')}`)} nach unten, die Zugkraft ${m$(T('F'))} schräg, die Normalkraft ${m$(T('N'))} nach oben und die Haftreibung ${m$(T('R'))} entlang des Bodens, gegen den waagrechten Teil der Zugkraft.`)}</p>`,
          ['G', 'F', 'N', 'R']),
        step(L('Components of the pull', 'Komponenten der Zugkraft'),
          `<p>${L(`The angle is measured from the ${p.ref === 'v' ? 'vertical' : 'horizontal'}, so`, `Der Winkel ist von der ${p.ref === 'v' ? 'Senkrechten' : 'Waagrechten'} aus gemessen, also`)}</p>` +
          `$$F_\\uparrow = ${T('F')}${up}\\alpha = ${tq(p.F, 'N')}\\cdot ${trig(up.slice(1), p)} = ${tq(FG - v.N, 'N')}$$` +
          `$$F_\\rightarrow = ${T('F')}${sd}\\alpha = ${tq(p.F, 'N')}\\cdot ${trig(sd.slice(1), p)} = ${tq(v.R, 'N')}$$`,
          ['F'], ['F']),
        step(L('Vertical: balance', 'Senkrecht: Gleichgewicht'),
          `<p>${L('The box stands still, so up equals down:', 'Die Kiste ruht, also sind die Kräfte nach oben und unten gleich gross:')}</p>` +
          `$$${T('N')} + F_\\uparrow = ${T('G')} \\;\\Rightarrow\\; ${T('N')} = ${T('m')}\\,g - ${T('F')}${up}\\alpha = ${tq(FG, 'N')} - ${tq(FG - v.N, 'N')} = ${res(v.N, 'N')}$$`,
          ['G', 'F', 'N'], ['G', 'N']),
        step(L('Horizontal: balance', 'Waagrecht: Gleichgewicht'),
          `<p>${L('Horizontally, too, the forces balance: static friction holds the box against the horizontal part of the pull.', 'Auch waagrecht heben sich die Kräfte auf: Die Haftreibung hält die Kiste gegen den waagrechten Teil der Zugkraft fest.')}</p>` +
          `$$${T('R')} = F_\\rightarrow = ${T('F')}${sd}\\alpha = ${res(v.R, 'N')}$$`,
          ['G', 'F', 'N', 'R'], ['R']),
      ];
    },
  };

  const pullFriction = {
    id: 'pull-friction', difficulty: 2,
    make(r) {
      const m = pick(r, [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8]), mu = pick(r, [0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6]);
      if (r() < 0.5) return { m, mu, given: 'a', a: pick(r, [0.5, 1, 1.5, 2, 2.5, 3, 4]) };
      const lo = Math.ceil(mu * m * G + 0.5 * m), hi = Math.floor(mu * m * G + 4 * m);
      if (hi < lo) return null;
      return { m, mu, given: 'F', F: lo + Math.floor(r() * (hi - lo + 1)) };
    },
    solve(p, o = {}) {
      const g = o.g || G, R = o.noFric ? 0 : p.mu * p.m * g;
      if (p.given === 'a') return { res: p.m * p.a, R: p.mu * p.m * g, F: p.m * p.a + R };
      return { R: p.mu * p.m * g, res: p.F - R, a: (p.F - R) / p.m };
    },
    traps: ['g', 'noFric'],
    why: { noFric: () => L('Friction is missing: the pull has to overcome friction as well, only the rest accelerates the box.', 'Die Reibung fehlt: Die Zugkraft muss auch die Reibung überwinden, nur der Rest beschleunigt die Kiste.') },
    fields: (p) => (p.given === 'a' ? [field('res', '', L('net force on the box', 'resultierende Kraft auf die Kiste')), field('R'), field('F')] : [field('R'), field('res', '', L('net force on the box', 'resultierende Kraft auf die Kiste')), field('a')]),
    title: () => L('Pulled across the floor', 'Über den Boden gezogen'),
    text: (p) => L(`A box with a mass of ${kg(p.m)} is pulled horizontally across the floor${p.given === 'a' ? `, with an acceleration of ${q(p.a, 'a')}` : ` with a force of ${q(p.F, 'N')}`}. The coefficient of kinetic friction between box and floor is ${num(p.mu, 2)}.`,
      `Eine Kiste mit der Masse ${kg(p.m)} wird ${p.given === 'a' ? `mit einer Beschleunigung von ${q(p.a, 'a')} ` : `mit einer Kraft von ${q(p.F, 'N')} `}horizontal über den Boden gezogen. Die Gleitreibungszahl zwischen Kiste und Boden beträgt ${num(p.mu, 2)}.`),
    scene(p, v) {
      const b = floorBox(p.m, p.mu);
      b.weight(); b.normal(); b.friction();
      const right = b.at(b.bw, b.bh / 2), top = b.at(b.bw / 2, b.bh);
      const F = p.given === 'a' ? v.F : p.F;
      b.sc.force({ id: 'F', kind: 's', at: right, dir: [1, 0], sym: ['F'], value: q(F, 'N'), task: p.given === 'F' ? 'value' : 'sym', lab: [0, -12] });
      b.sc.accel({ id: 'a', at: [top[0] - 76, top[1] - 18], dir: [1, 0], sym: ['a'], value: q(p.a || v.a, 'a'), task: p.given === 'a' ? 'value' : 'sym', lab: [0, -12] });
      return sized(b.sc, { G: p.m * G, N: p.m * G, R: v.R, F });
    },
    hints: (p) => [
      L('Find all forces on the box. Vertically, weight and normal force balance; horizontally, the pull and friction act.', 'Bestimme alle Kräfte auf die Kiste. Senkrecht heben sich Gewichtskraft und Normalkraft auf, waagrecht wirken Zugkraft und Reibung.'),
      L(`Friction: ${m$(`${T('R')} = ${T('mu')}\\,${T('N')}`)}, and here the normal force equals the weight.`, `Reibung: ${m$(`${T('R')} = ${T('mu')}\\,${T('N')}`)}, und hier ist die Normalkraft gleich der Gewichtskraft.`),
      L(`Only what is left of the pull after friction accelerates the box: ${m$(`${T('res')} = ${T('F')} - ${T('R')} = ${T('m')}\\,${T('a')}`)}.`, `Nur was nach Abzug der Reibung von der Zugkraft übrig bleibt, beschleunigt die Kiste: ${m$(`${T('res')} = ${T('F')} - ${T('R')} = ${T('m')}\\,${T('a')}`)}.`),
    ],
    steps(p, v) {
      const FG = p.m * G, all = ['G', 'N', 'R', 'F', 'a'];
      const s = [
        step(L('Forces on the box', 'Kräfte auf die Kiste'),
          `<p>${L(`Weight ${m$(T('G'))} down, normal force ${m$(T('N'))} up, the pull ${m$(T('F'))} forward and friction ${m$(T('R'))} backward, against the motion.`, `Gewichtskraft ${m$(T('G'))} nach unten, Normalkraft ${m$(T('N'))} nach oben, die Zugkraft ${m$(T('F'))} nach vorn und die Reibung ${m$(T('R'))} nach hinten, gegen die Bewegung.`)}</p>`,
          ['G', 'N', 'R', 'F']),
        step(L('Vertical: balance', 'Senkrecht: Gleichgewicht'),
          `<p>${L('The box does not move up or down, so the normal force balances the weight:', 'Die Kiste bewegt sich weder nach oben noch nach unten, also hält die Normalkraft der Gewichtskraft das Gleichgewicht:')} $$${T('N')} = ${T('G')} = ${T('m')}\\,g = ${tq(FG, 'N')}$$</p>`,
          ['G', 'N', 'R', 'F'], ['G', 'N']),
        step(L('Friction', 'Reibung'),
          `<p>${L('The box slides over the floor, so friction acts against the motion: the friction coefficient times the normal force, which here equals the weight:', 'Die Kiste gleitet über den Boden, also wirkt die Reibung gegen die Bewegung: die Reibungszahl mal die Normalkraft, die hier gleich der Gewichtskraft ist:')}</p>` +
          `$$${T('R')} = ${T('mu')}\\,${T('N')} = ${T('mu')}\\,${T('m')}\\,g = ${FS.texNum(p.mu, 2)}\\cdot${tq(FG, 'N')} = ${res(v.R, 'N')}$$`,
          ['G', 'N', 'R', 'F'], ['R']),
      ];
      if (p.given === 'a') {
        s.push(step(L('Newton’s second law', 'Aktionsprinzip'),
          `<p>${L('The net force accelerates the box:', 'Die resultierende Kraft beschleunigt die Kiste:')} $$${T('res')} = ${T('m')}\\,${T('a')} = ${tq(p.m, 'kg')}\\cdot${tq(p.a, 'a')} = ${res(v.res, 'N')}$$</p>`, all, ['a']));
        s.push(step(L('Pulling force', 'Zugkraft'),
          `<p>${L('The pull has to overcome friction and provide the net force:', 'Die Zugkraft muss die Reibung überwinden und die resultierende Kraft liefern:')}</p>$$${T('res')} = ${T('F')} - ${T('R')} \\;\\Rightarrow\\; ${T('F')} = ${T('m')}\\,${T('a')} + ${T('mu')}\\,${T('m')}\\,g = ${tq(v.res, 'N')} + ${tq(v.R, 'N')} = ${res(v.F, 'N')}$$`, all, ['F', 'R']));
      } else {
        s.push(step(L('Net force', 'Resultierende Kraft'),
          `<p>${L('Pull and friction point in opposite directions:', 'Zugkraft und Reibung zeigen in entgegengesetzte Richtungen:')} $$${T('res')} = ${T('F')} - ${T('R')} = ${tq(p.F, 'N')} - ${tq(v.R, 'N')} = ${res(v.res, 'N')}$$</p>`, all, ['F', 'R']));
        s.push(step(L('Newton’s second law', 'Aktionsprinzip'),
          `<p>${L('Only the net force accelerates the box: divide it by the mass.', 'Nur die resultierende Kraft beschleunigt die Kiste: Teile sie durch die Masse.')}</p>` +
          `$$${T('a')} = \\frac{${T('res')}}{${T('m')}} = \\frac{${T('F')} - ${T('mu')}\\,${T('m')}\\,g}{${T('m')}} = \\frac{${tq(v.res, 'N')}}{${tq(p.m, 'kg')}} = ${res(v.a, 'a')}$$`, all, ['a']));
      }
      return s;
    },
  };

  // ---------------------------------------------------------------- two boxes on the floor
  function floorPair(p, gap) {
    const w = 720, h = 330, sc = new Scene(w, h, L('Two boxes on the floor', 'Zwei Kisten auf dem Boden'));
    const y0 = h - 80, [w1, h1] = dims(p.m1, [p.m1, p.m2]), [w2, h2] = dims(p.m2, [p.m1, p.m2]);
    const x1 = (w - w1 - gap - w2) / 2, x2 = x1 + w1 + gap;
    sc.surface([30, y0], [w - 30, y0]);
    const at1 = sc.box([x1, y0], [1, 0], [0, -1], w1, h1, kg(p.m1));
    const at2 = sc.box([x2, y0], [1, 0], [0, -1], w2, h2, kg(p.m2));
    const c1 = at1(w1 / 2, h1 / 2), c2 = at2(w2 / 2, h2 / 2);
    for (const [i, c] of [[1, c1], [2, c2]]) {
      sc.force({ id: `G${i}`, kind: 'g', at: [c[0] - 6, c[1]], dir: [0, 1], sym: ['G', i], lab: [6, 6] });
      sc.force({ id: `N${i}`, kind: 'n', at: [c[0] + 6, y0], dir: [0, -1], sym: ['N', i], lab: [7, 4] });
      sc.force({ id: `R${i}`, kind: 'r', at: [c[0] - 0.2 * (i === 1 ? w1 : w2), y0], dir: [-1, 0], sym: ['R', i], lab: [-4, 16] });
    }
    const top = Math.min(at1(0, h1)[1], at2(0, h2)[1]);
    sc.accel({ id: 'a', at: [x1 + 4, top - 22], dir: [1, 0], sym: ['a'], value: p.a != null ? q(p.a, 'a') : '', task: p.a != null ? 'value' : 'sym', lab: [0, -12] });
    return { sc, at1, at2, w1, h1, w2, h2, y0, x1, x2 };
  }

  const pushPair = {
    id: 'push-pair', difficulty: 3,
    boxes: (p) => [L(`left box (${kg(p.m1)})`, `linke Kiste (${kg(p.m1)})`), L(`right box (${kg(p.m2)})`, `rechte Kiste (${kg(p.m2)})`)],
    make(r) {
      const m1 = pick(r, [1, 2, 3, 4, 5, 6]), m2 = pick(r, [1, 1.5, 2, 3, 4]);
      const mu = r() < 0.5 ? 0 : pick(r, [0.1, 0.2, 0.3]);
      const fr = mu * (m1 + m2) * G;
      const F = Math.round(fr + (m1 + m2) * pick(r, [0.5, 1, 1.5, 2, 3, 4]));
      return F > fr + 0.3 * (m1 + m2) ? { m1, m2, mu, F } : null;
    },
    solve(p, o = {}) {
      const g = o.g || G, M = p.m1 + p.m2, mu = o.noFric ? 0 : p.mu;
      const R = mu * M * g, net = p.F - R, a = net / (o.oneMass ? p.m1 : M);
      const K = o.pass ? p.F : p.m2 * a + mu * p.m2 * g;
      const v = { res: net, a, K };
      if (p.mu) v.R = p.mu * M * g;
      return v;
    },
    traps: ['g', 'noFric', 'oneMass', 'pass'],
    why: {
      oneMass: () => L('The push accelerates both boxes: divide by the total mass.', 'Die Kraft beschleunigt beide Kisten: Teile durch die gesamte Masse.'),
      pass: () => L('The left box passes on only part of the push: the rest accelerates the left box itself.', 'Die linke Kiste gibt nur einen Teil der Kraft weiter: Der Rest beschleunigt die linke Kiste selbst.'),
      noFric: () => L('Friction acts on both boxes and is missing here.', 'Auf beide Kisten wirkt Reibung, und die fehlt hier.'),
    },
    fields: (p) => [...(p.mu ? [field('R', '', L('total friction force', 'gesamte Reibungskraft'))] : []), field('res'), field('a'), field('K', '', L('force of the left box on the right box', 'Kraft der linken auf die rechte Kiste'))],
    title: () => L('Pushing two boxes', 'Zwei Kisten schieben'),
    text: (p) => L(`Two boxes with masses of ${kg(p.m1)} (left) and ${kg(p.m2)} (right) stand next to each other on the floor. A force of ${q(p.F, 'N')} pushes the left box horizontally to the right, so that it pushes the right box along. ${p.mu ? `The coefficient of kinetic friction for both boxes is ${num(p.mu, 2)}.` : 'There is no friction.'}`,
      `Zwei Kisten mit den Massen ${kg(p.m1)} (links) und ${kg(p.m2)} (rechts) stehen nebeneinander auf dem Boden. Eine Kraft von ${q(p.F, 'N')} schiebt die linke Kiste horizontal nach rechts, sodass sie die rechte Kiste mitschiebt. ${p.mu ? `Die Gleitreibungszahl beträgt für beide Kisten ${num(p.mu, 2)}.` : 'Es gibt keine Reibung.'}`),
    // In the free-body diagram, the boxes are drawn apart, so that each contact force sits on its box.
    scene(p, v, view = {}) {
      const b = floorPair(p, view.task ? 0 : 64), sc = b.sc;
      if (p.mu) sc.text(36, b.y0 + 22, `${svgSym('mu')} = ${num(p.mu, 2)}`, 'lbl small', 'start'); // else the text says: no friction
      sc.force({ id: 'F', kind: 's', at: b.at1(0, 0.36 * b.h1), dir: [1, 0], sym: ['F'], value: q(p.F, 'N'), task: 'value', lab: [0, -12] });
      const hm = Math.min(b.h1, b.h2);
      sc.force({ id: 'K2', kind: 'k', at: [b.x2, b.y0 - 0.38 * hm], dir: [1, 0], sym: ['K'], lab: [0, -12] });
      sc.force({ id: 'K1', kind: 'k', at: [b.x1 + b.w1, b.y0 - 0.62 * hm], dir: [-1, 0], sym: ['K'], lab: [0, -12] });
      return sized(sc, { G1: p.m1 * G, G2: p.m2 * G, N1: p.m1 * G, N2: p.m2 * G, R1: p.mu * p.m1 * G, R2: p.mu * p.m2 * G, F: p.F, K1: v.K, K2: v.K });
    },
    hints: (p) => [
      L('First look at both boxes together: they move together, with the same acceleration.', 'Betrachte zuerst beide Kisten zusammen: Sie bewegen sich gemeinsam, mit derselben Beschleunigung.'),
      L(`For both boxes together, ${m$(`${T('res')} = ${p.mu ? `${T('F')} - ${T('R')}` : T('F')}`)} and ${m$(`${T('res')} = (${T('m')}_1 + ${T('m')}_2)\\,${T('a')}`)}.`, `Für beide Kisten zusammen gilt ${m$(`${T('res')} = ${p.mu ? `${T('F')} - ${T('R')}` : T('F')}`)} und ${m$(`${T('res')} = (${T('m')}_1 + ${T('m')}_2)\\,${T('a')}`)}.`),
      L(`Then look at the right box alone: only ${m$(T('K'))}${p.mu ? ' and its own friction act' : ' acts'} on it horizontally, and it has the same acceleration.`, `Betrachte dann die rechte Kiste allein: Waagrecht wirkt auf sie nur ${m$(T('K'))}${p.mu ? ' und ihre eigene Reibung' : ''}, und sie hat dieselbe Beschleunigung.`),
    ],
    steps(p, v) {
      const M = p.m1 + p.m2, fr = p.mu > 0;
      const vert = ['G1', 'N1', 'G2', 'N2'], hor = fr ? ['F', 'R1', 'R2'] : ['F'], all = [...vert, ...hor, 'K1', 'K2', 'a'];
      const s = [
        step(L('Forces', 'Kräfte'),
          `<p>${L(`On each box: its weight and the normal force from the floor, which balance${fr ? ', and friction against the motion' : ''}. The push ${m$(T('F'))} acts on the left box only. Where the boxes touch, they push each other with ${m$(T('K'))}: the left box pushes the right one forward, the right box pushes the left one back.`,
            `Auf jede Kiste: ihre Gewichtskraft und die Normalkraft des Bodens, die sich aufheben${fr ? ', und die Reibung gegen die Bewegung' : ''}. Die Kraft ${m$(T('F'))} wirkt nur auf die linke Kiste. Wo sich die Kisten berühren, drücken sie mit ${m$(T('K'))} aufeinander: Die linke Kiste schiebt die rechte nach vorn, die rechte drückt die linke zurück.`)}</p>`,
          [...vert, ...hor, 'K1', 'K2']),
      ];
      if (fr) {
        s.push(step(L('Friction', 'Reibung'),
          `<p>${L('Both boxes slide over the floor. For the two together, the friction is the friction coefficient times their total normal force, which equals their total weight:', 'Beide Kisten gleiten über den Boden. Für beide zusammen ist die Reibung die Reibungszahl mal ihre gesamte Normalkraft, die gleich ihrer gesamten Gewichtskraft ist:')}</p>` +
          `$$${T('R')} = ${T('mu')}\\,(${T('m')}_1 + ${T('m')}_2)\\,g = ${FS.texNum(p.mu, 2)}\\cdot${tq(M, 'kg')}\\cdot${tq(G, 'a')} = ${res(v.R, 'N')}$$`, all.filter((x) => x !== 'a'), ['R1', 'R2']));
      }
      s.push(step(L('Both boxes together', 'Beide Kisten zusammen'),
        `<p>${L('Seen as one system, the two forces between the boxes cancel: they are internal forces. Only the push' + (fr ? ' and friction' : '') + ' remain:', 'Als ein System betrachtet, heben sich die beiden Kräfte zwischen den Kisten auf: Es sind innere Kräfte. Es bleiben nur die äussere Kraft' + (fr ? ' und die Reibung' : '') + ':')}</p>` +
        `$$${T('res')} = ${fr ? `${T('F')} - ${T('R')} = ${tq(p.F, 'N')} - ${tq(v.R, 'N')} = ` : `${T('F')} = `}${res(v.res, 'N')}$$` +
        `$$${T('a')} = \\frac{${T('res')}}{${T('m')}_1 + ${T('m')}_2} = \\frac{${tq(v.res, 'N')}}{${tq(M, 'kg')}} = ${res(v.a, 'a')}$$`,
        all, ['F', ...(fr ? ['R1', 'R2'] : []), 'a']));
      s.push(step(L('The right box alone', 'Die rechte Kiste allein'),
        `<p>${L(`The right box is accelerated only by ${m$(T('K'))}${fr ? ', minus its own friction' : ''}:`, `Die rechte Kiste wird nur durch ${m$(T('K'))} beschleunigt${fr ? ', abzüglich ihrer eigenen Reibung' : ''}:`)}</p>` +
        `$$${fr ? `${T('K')} - ${T('mu')}\\,${T('m')}_2\\,g = ${T('m')}_2\\,${T('a')} \\;\\Rightarrow\\; ${T('K')} = ${T('m')}_2\\,(${T('a')} + ${T('mu')}\\,g)` : `${T('K')} = ${T('m')}_2\\,${T('a')}`} = ${res(v.K, 'N')}$$` +
        `<p>${L(`The left box passes on only part of the push; the rest, ${m$(`${T('F')} - ${T('K')} = ${tq(p.F - v.K, 'N')}`)}, accelerates${fr ? ' and drags' : ''} the left box itself.`, `Die linke Kiste gibt nur einen Teil der Kraft weiter; der Rest, ${m$(`${T('F')} - ${T('K')} = ${tq(p.F - v.K, 'N')}`)}, beschleunigt${fr ? ' und schleift' : ''} die linke Kiste selbst.`)}</p>`,
        all, ['K2', ...(fr ? ['R2'] : [])]));
      return s;
    },
  };

  const ropePair = {
    id: 'rope-pair', difficulty: 3,
    boxes: (p) => [L(`left box (${kg(p.m1)})`, `linke Kiste (${kg(p.m1)})`), L(`right box (${kg(p.m2)})`, `rechte Kiste (${kg(p.m2)})`)],
    forceOn: { F: 1 }, // the pull acts on the right box
    make(r) {
      const m1 = pick(r, [2, 3, 4, 5, 6]), m2 = pick(r, [1, 2, 3, 4]);
      const mu1 = pick(r, [0.1, 0.2, 0.3, 0.4, 0.5]), mu2 = r() < 0.6 ? 0 : pick(r, [0.1, 0.2, 0.3]);
      const fr = (mu1 * m1 + mu2 * m2) * G;
      const F = Math.round(fr + (m1 + m2) * pick(r, [0.5, 1, 1.5, 2, 3]));
      return F > fr + 0.3 * (m1 + m2) ? { m1, m2, mu1, mu2, F } : null;
    },
    solve(p, o = {}) {
      const g = o.g || G, f = o.noFric ? 0 : 1;
      const R1 = p.mu1 * p.m1 * g, R2 = p.mu2 * p.m2 * g, net = p.F - f * (R1 + R2);
      const a = net / (o.oneMass ? p.m2 : p.m1 + p.m2);
      const v = { R1, res: net, a, S: o.pass ? p.F : p.m1 * a + f * R1 };
      if (p.mu2) v.R2 = R2;
      return v;
    },
    traps: ['g', 'noFric', 'oneMass', 'pass'],
    why: {
      oneMass: () => L('The pull accelerates both boxes: divide by the total mass.', 'Die Zugkraft beschleunigt beide Kisten: Teile durch die gesamte Masse.'),
      pass: () => L('The rope only has to accelerate the left box and overcome its friction; it does not pass on the whole pull.', 'Das Seil muss nur die linke Kiste beschleunigen und ihre Reibung überwinden; es gibt nicht die ganze Zugkraft weiter.'),
      noFric: () => L('Friction is missing: it acts against the motion and has to be overcome as well.', 'Die Reibung fehlt: Sie wirkt gegen die Bewegung und muss ebenfalls überwunden werden.'),
    },
    fields: (p) => [field('R', 1, L('friction on the left box', 'Reibung auf die linke Kiste')), ...(p.mu2 ? [field('R', 2, L('friction on the right box', 'Reibung auf die rechte Kiste'))] : []), field('res'), field('a'), field('S')],
    title: () => L('Two boxes on a rope', 'Zwei Kisten am Seil'),
    text: (p) => L(`Two boxes with masses of ${kg(p.m1)} (left) and ${kg(p.m2)} (right) are joined by a rope. A force of ${q(p.F, 'N')} pulls the right box horizontally to the right. The coefficient of kinetic friction is ${num(p.mu1, 2)} for the left box and ${num(p.mu2, 2)} for the right box.`,
      `Zwei Kisten mit den Massen ${kg(p.m1)} (links) und ${kg(p.m2)} (rechts) sind durch ein Seil verbunden. Eine Kraft von ${q(p.F, 'N')} zieht die rechte Kiste horizontal nach rechts. Die Gleitreibungszahl beträgt ${num(p.mu1, 2)} für die linke und ${num(p.mu2, 2)} für die rechte Kiste.`),
    scene(p, v) {
      const b = floorPair(p, 110), sc = b.sc;
      const yr = b.y0 - Math.min(b.h1, b.h2) / 2;
      sc.line(b.x1 + b.w1, yr, b.x2, yr, 'w rope');
      sc.text(b.x1 - 6, b.y0 + 40, `${svgSym('mu')} = ${num(p.mu1, 2)}`, 'lbl small', 'end');
      sc.text(b.x2 - 6, b.y0 + 40, `${svgSym('mu')} = ${num(p.mu2, 2)}`, 'lbl small', 'end');
      sc.force({ id: 'S1', kind: 'k', at: [b.x1 + b.w1, yr], dir: [1, 0], sym: ['S'], lab: [-4, 18] });
      sc.force({ id: 'S2', kind: 'k', at: [b.x2, yr], dir: [-1, 0], sym: ['S'], lab: [4, -12] });
      sc.force({ id: 'F', kind: 's', at: b.at2(b.w2, b.h2 / 2), dir: [1, 0], sym: ['F'], value: q(p.F, 'N'), task: 'value', lab: [0, -12] });
      return sized(sc, { G1: p.m1 * G, G2: p.m2 * G, N1: p.m1 * G, N2: p.m2 * G, R1: v.R1, R2: p.mu2 * p.m2 * G, F: p.F, S1: v.S, S2: v.S });
    },
    hints: (p) => [
      L('Friction on each box: coefficient times normal force, and here the normal force equals the weight of that box.', 'Reibung auf jede Kiste: Reibungszahl mal Normalkraft, und hier ist die Normalkraft gleich der Gewichtskraft der Kiste.'),
      L(`Both boxes together: ${m$(`${T('res')} = ${T('F')} - ${T('R', 1)}${p.mu2 ? ` - ${T('R', 2)}` : ''} = (${T('m')}_1 + ${T('m')}_2)\\,${T('a')}`)}; the rope forces are internal and cancel.`, `Beide Kisten zusammen: ${m$(`${T('res')} = ${T('F')} - ${T('R', 1)}${p.mu2 ? ` - ${T('R', 2)}` : ''} = (${T('m')}_1 + ${T('m')}_2)\\,${T('a')}`)}; die Seilkräfte sind innere Kräfte und heben sich auf.`),
      L(`The left box alone: the rope pulls it forward, friction holds it back, ${m$(`${T('S')} - ${T('R', 1)} = ${T('m')}_1\\,${T('a')}`)}.`, `Die linke Kiste allein: Das Seil zieht sie nach vorn, die Reibung hält sie zurück, ${m$(`${T('S')} - ${T('R', 1)} = ${T('m')}_1\\,${T('a')}`)}.`),
    ],
    steps(p, v) {
      const M = p.m1 + p.m2, f2 = p.mu2 > 0;
      const vert = ['G1', 'N1', 'G2', 'N2'], all = [...vert, 'R1', 'R2', 'F', 'S1', 'S2', 'a'];
      return [
        step(L('Forces', 'Kräfte'),
          `<p>${L(`On each box: weight and normal force, which balance, and friction against the motion${f2 ? '' : ' (none on the right box)'}. The rope pulls the left box forward with ${m$(T('S'))} and the right box back with the same force. The pull ${m$(T('F'))} acts on the right box.`,
            `Auf jede Kiste: Gewichtskraft und Normalkraft, die sich aufheben, und die Reibung gegen die Bewegung${f2 ? '' : ' (keine auf die rechte Kiste)'}. Das Seil zieht die linke Kiste mit ${m$(T('S'))} nach vorn und die rechte mit gleich grosser Kraft zurück. Die Zugkraft ${m$(T('F'))} wirkt auf die rechte Kiste.`)}</p>`,
          all.filter((x) => x !== 'a')),
        step(L('Friction', 'Reibung'),
          `<p>${L('A box sliding over the floor feels friction against its motion: its friction coefficient times its normal force, which here equals its weight:', 'Eine Kiste, die über den Boden gleitet, erfährt Reibung gegen ihre Bewegung: ihre Reibungszahl mal ihre Normalkraft, die hier gleich ihrer Gewichtskraft ist:')}</p>` +
          `$$${T('R', 1)} = ${T('mu', 1)}\\,${T('m')}_1\\,g = ${FS.texNum(p.mu1, 2)}\\cdot${tq(p.m1 * G, 'N')} = ${res(v.R1, 'N')}$$` +
          (f2 ? `$$${T('R', 2)} = ${T('mu', 2)}\\,${T('m')}_2\\,g = ${FS.texNum(p.mu2, 2)}\\cdot${tq(p.m2 * G, 'N')} = ${res(v.R2, 'N')}$$` : ''),
          all.filter((x) => x !== 'a'), ['R1', 'R2']),
        step(L('Both boxes together', 'Beide Kisten zusammen'),
          `<p>${L('The rope forces are internal forces of the system and cancel. The pull minus friction accelerates both boxes:', 'Die Seilkräfte sind innere Kräfte des Systems und heben sich auf. Die Zugkraft minus die Reibung beschleunigt beide Kisten:')}</p>` +
          `$$${T('res')} = ${T('F')} - ${T('R', 1)}${f2 ? ` - ${T('R', 2)}` : ''} = ${res(v.res, 'N')}$$` +
          `$$${T('a')} = \\frac{${T('res')}}{${T('m')}_1 + ${T('m')}_2} = \\frac{${tq(v.res, 'N')}}{${tq(M, 'kg')}} = ${res(v.a, 'a')}$$`,
          all, ['F', 'R1', 'R2', 'a']),
        step(L('The left box alone', 'Die linke Kiste allein'),
          `<p>${L('Only the rope pulls the left box forward; friction holds it back:', 'Nur das Seil zieht die linke Kiste nach vorn, die Reibung hält sie zurück:')}</p>` +
          `$$${T('S')} - ${T('R', 1)} = ${T('m')}_1\\,${T('a')} \\;\\Rightarrow\\; ${T('S')} = ${T('m')}_1\\,${T('a')} + ${T('R', 1)} = ${tq(p.m1 * v.a, 'N')} + ${tq(v.R1, 'N')} = ${res(v.S, 'N')}$$`,
          all, ['S1', 'R1']),
      ];
    },
  };

  // ---------------------------------------------------------------- pulleys
  const atwood = {
    id: 'atwood', difficulty: 3,
    boxes: (p) => [L(`left box (${kg(p.m1)})`, `linke Kiste (${kg(p.m1)})`), L(`right box (${kg(p.m2)})`, `rechte Kiste (${kg(p.m2)})`)],
    make(r) {
      const ms = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 9, 10, 12], m1 = pick(r, ms), m2 = pick(r, ms);
      // at most 6 times heavier, so that both boxes fit the drawing (sizes follow the masses)
      return m1 === m2 || Math.max(m1, m2) > 6 * Math.min(m1, m2) ? null : { m1, m2 };
    },
    solve(p, o = {}) {
      const g = o.g || G, hv = Math.max(p.m1, p.m2), lt = Math.min(p.m1, p.m2);
      const net = (hv - lt) * g, a = net / (o.oneMass ? hv : p.m1 + p.m2);
      return { res: net, a, S: o.hangW ? hv * g : o.hangW2 ? lt * g : lt * (g + a) };
    },
    traps: ['g', 'oneMass', 'hangW', 'hangW2'],
    why: {
      oneMass: () => L('The difference of the weights accelerates both boxes: divide by the total mass.', 'Die Differenz der Gewichtskräfte beschleunigt beide Kisten: Teile durch die gesamte Masse.'),
      hangW: () => L('The boxes accelerate, so the rope force is not equal to the weight of either box.', 'Die Kisten werden beschleunigt, darum ist die Seilkraft nicht gleich der Gewichtskraft einer der Kisten.'),
      hangW2: () => L('The boxes accelerate, so the rope force is not equal to the weight of either box.', 'Die Kisten werden beschleunigt, darum ist die Seilkraft nicht gleich der Gewichtskraft einer der Kisten.'),
    },
    fields: () => [field('res'), field('a'), field('S')],
    title: () => L('Two boxes over a pulley', 'Zwei Kisten über eine Rolle'),
    text: (p) => L(`Two boxes hang from a rope over a pulley: ${kg(p.m1)} on the left and ${kg(p.m2)} on the right. The pulley and the rope have no mass and there is no friction.`,
      `Zwei Kisten hängen an einem Seil über einer Rolle: ${kg(p.m1)} links und ${kg(p.m2)} rechts. Rolle und Seil sind masselos, und es gibt keine Reibung.`),
    scene(p, v) {
      const sc = new Scene(440, 400, L('Two boxes over a pulley', 'Zwei Kisten über eine Rolle'));
      // the lighter box hangs higher; the pulley is just wide enough for the heavier box's rope to pass it
      const [wl, hl] = dims(Math.min(p.m1, p.m2), [p.m1, p.m2]), r = Math.max(28, wl / 4 + 8), cx = 220, cy = 24 + r;
      sc.surface([cx - r - 40, 14], [cx + r + 40, 14], -1); sc.line(cx, 14, cx, cy, 'w');
      sc.pulley(cx, cy, r);
      const heavyLeft = p.m1 > p.m2;
      const box = (i, m, x, ytop) => {
        const [bw, bh] = dims(m, [p.m1, p.m2]), at = sc.box([x - bw / 2, ytop + bh], [1, 0], [0, -1], bw, bh, kg(m));
        sc.line(x, cy, x, ytop, 'w rope');
        const c = at(bw / 2, bh / 2), down = (i === 1) === heavyLeft;
        sc.force({ id: `G${i}`, kind: 'g', at: c, dir: [0, 1], sym: ['G', i], lab: [8, 6] });
        sc.force({ id: `S${i}`, kind: 'k', at: [x, ytop], dir: [0, -1], sym: ['S'], lab: [8, 10] });
        const ax = i === 1 ? x - bw / 2 - 22 : x + bw / 2 + 22;
        sc.accel({ id: `a${i}`, at: [ax, c[1] + (down ? -23 : 23)], dir: [0, down ? 1 : -1], sym: ['a'], task: 'sym', lab: [i === 1 ? -8 : 8, 0] });
      };
      const yl = cy + r + 36, yh = yl + hl + 24;
      box(1, p.m1, cx - r, heavyLeft ? yh : yl);
      box(2, p.m2, cx + r, heavyLeft ? yl : yh);
      return sized(sc, { G1: p.m1 * G, G2: p.m2 * G, S1: v.S, S2: v.S });
    },
    hints: () => [
      L('The heavier box goes down, the lighter one up, both with the same acceleration.', 'Die schwerere Kiste sinkt, die leichtere steigt, beide mit derselben Beschleunigung.'),
      L(`Seen as one system along the rope, the difference of the two weights accelerates both masses: ${m$(`${T('res')} = (${T('m')}_\\text{heavy} - ${T('m')}_\\text{light})\\,g`)}.`, `Als ein System entlang des Seils betrachtet, beschleunigt die Differenz der Gewichtskräfte beide Massen: ${m$(`${T('res')} = (${T('m')}_\\text{schwer} - ${T('m')}_\\text{leicht})\\,g`)}.`),
      L(`For the rope force, look at one box alone, e.g. the lighter one: ${m$(`${T('S')} - ${T('m')}\\,g = ${T('m')}\\,${T('a')}`)}.`, `Für die Seilkraft betrachte eine Kiste allein, z.B. die leichtere: ${m$(`${T('S')} - ${T('m')}\\,g = ${T('m')}\\,${T('a')}`)}.`),
    ],
    steps(p, v) {
      const hi = p.m1 > p.m2 ? 1 : 2, lo = 3 - hi, mh = Math.max(p.m1, p.m2), ml = Math.min(p.m1, p.m2), all = ['G1', 'G2', 'S1', 'S2', 'a1', 'a2'];
      return [
        step(L('Forces', 'Kräfte'),
          `<p>${L(`On each box: its weight down and the rope force up. The rope is massless, so it pulls both boxes with the same force ${m$(T('S'))}.`, `Auf jede Kiste: ihre Gewichtskraft nach unten und die Seilkraft nach oben. Das Seil ist masselos, also zieht es beide Kisten mit derselben Kraft ${m$(T('S'))}.`)}</p>`,
          ['G1', 'G2', 'S1', 'S2']),
        step(L('Both boxes together', 'Beide Kisten zusammen'),
          `<p>${L(`The ${kg(mh)} box goes down, the ${kg(ml)} box up. Along the rope, the weight of the heavier box drives the motion, the weight of the lighter box acts against it; the rope forces are internal and cancel.`, `Die Kiste mit ${kg(mh)} sinkt, die mit ${kg(ml)} steigt. Entlang des Seils treibt die Gewichtskraft der schwereren Kiste die Bewegung an, die der leichteren wirkt dagegen; die Seilkräfte sind innere Kräfte und heben sich auf.`)}</p>` +
          `$$${T('res')} = ${T('G', hi)} - ${T('G', lo)} = (${T('m')}_${hi} - ${T('m')}_${lo})\\,g = ${tq(mh * G, 'N')} - ${tq(ml * G, 'N')} = ${res(v.res, 'N')}$$`,
          all, [`G${hi}`, `G${lo}`]),
        step(L('Acceleration', 'Beschleunigung'),
          `<p>${L('The net force accelerates both masses:', 'Die resultierende Kraft beschleunigt beide Massen:')}</p>$$${T('a')} = \\frac{${T('res')}}{${T('m')}_1 + ${T('m')}_2} = \\frac{${tq(v.res, 'N')}}{${tq(p.m1 + p.m2, 'kg')}} = ${res(v.a, 'a')}$$`,
          all, ['a1', 'a2']),
        step(L('Rope force', 'Seilkraft'),
          `<p>${L(`The lighter box alone: the rope pulls it up, its weight down, and it accelerates upwards:`, `Die leichtere Kiste allein: Das Seil zieht sie nach oben, die Gewichtskraft nach unten, und sie wird nach oben beschleunigt:`)}</p>` +
          `$$${T('S')} - ${T('m')}_${lo}\\,g = ${T('m')}_${lo}\\,${T('a')} \\;\\Rightarrow\\; ${T('S')} = ${T('m')}_${lo}\\,(g + ${T('a')}) = ${tq(ml, 'kg')}\\cdot${tq(G + v.a, 'a')} = ${res(v.S, 'N')}$$` +
          `<p>${L(`Check with the heavier box: ${m$(`${T('m')}_${hi}\\,(g - ${T('a')}) = ${tq(mh * (G - v.a), 'N')}`)}. The rope force lies between the two weights.`, `Kontrolle mit der schwereren Kiste: ${m$(`${T('m')}_${hi}\\,(g - ${T('a')}) = ${tq(mh * (G - v.a), 'N')}`)}. Die Seilkraft liegt zwischen den beiden Gewichtskräften.`)}</p>`,
          all, [`S${lo}`, `G${lo}`, `a${lo}`]),
      ];
    },
  };

  const tablePulley = {
    id: 'table-pulley', difficulty: 4,
    boxes: (p) => [L(`box on the table (${kg(p.m1)})`, `Kiste auf dem Tisch (${kg(p.m1)})`), L(`hanging box (${kg(p.m2)})`, `hängende Kiste (${kg(p.m2)})`)],
    make(r) {
      const m1 = pick(r, [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8]), m2 = pick(r, [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6]), mu = pick(r, [0.1, 0.2, 0.25, 0.3, 0.4, 0.5]);
      if (Math.max(m1, m2) > 6 * Math.min(m1, m2)) return null; // see atwood
      return m2 * G > mu * m1 * G + 0.3 * (m1 + m2) ? { m1, m2, mu } : null;
    },
    solve(p, o = {}) {
      const g = o.g || G, R = o.noFric ? 0 : p.mu * p.m1 * g, net = p.m2 * g - R;
      const a = net / (o.oneMass ? p.m2 : p.m1 + p.m2);
      return { R: p.mu * p.m1 * g, res: net, a, S: o.hangW ? p.m2 * g : p.m1 * a + R };
    },
    traps: ['g', 'noFric', 'oneMass', 'hangW'],
    why: {
      oneMass: () => L('The weight of the hanging box accelerates both boxes: divide by the total mass.', 'Die Gewichtskraft der hängenden Kiste beschleunigt beide Kisten: Teile durch die gesamte Masse.'),
      hangW: () => L('The hanging box accelerates downwards, so the rope holds it with less than its weight.', 'Die hängende Kiste wird nach unten beschleunigt, darum hält das Seil sie mit weniger als ihrer Gewichtskraft.'),
      noFric: () => L('Friction on the table is missing.', 'Die Reibung auf dem Tisch fehlt.'),
    },
    fields: () => [field('R', '', L('friction on the box on the table', 'Reibung auf die Kiste auf dem Tisch')), field('res'), field('a'), field('S')],
    title: () => L('Pulled off the table', 'Vom Tisch gezogen'),
    text: (p) => L(`A box with a mass of ${kg(p.m1)} lies on a table. A rope runs from it over a pulley at the edge of the table to a hanging box with a mass of ${kg(p.m2)}, which pulls it along. The coefficient of kinetic friction between box and table is ${num(p.mu, 2)}.`,
      `Eine Kiste mit der Masse ${kg(p.m1)} liegt auf einem Tisch. Ein Seil führt von ihr über eine Rolle an der Tischkante zu einer hängenden Kiste mit der Masse ${kg(p.m2)}, die sie mitzieht. Die Gleitreibungszahl zwischen Kiste und Tisch beträgt ${num(p.mu, 2)}.`),
    scene(p, v) {
      const sc = new Scene(480, 420, L('A box on a table, pulled by a hanging box', 'Eine Kiste auf einem Tisch, von einer hängenden Kiste gezogen'));
      const y0 = 200, xe = 350, r = 16, [w1, h1] = dims(p.m1, [p.m1, p.m2]), x1 = 100;
      const yr = y0 - h1 / 2, cx = xe + 4, cy = yr + r;
      sc.surface([20, y0], [xe, y0]); sc.surface([xe, y0], [xe, y0 + 60], 1, 'w');
      sc.line(xe - 6, y0, cx, cy, 'w'); sc.pulley(cx, cy, r);
      const at1 = sc.box([x1, y0], [1, 0], [0, -1], w1, h1, kg(p.m1));
      sc.text(28, y0 + 42, `${svgSym('mu')} = ${num(p.mu, 2)}`, 'lbl small', 'start');
      sc.line(x1 + w1, yr, cx, yr, 'w rope');
      const [w2, h2] = dims(p.m2, [p.m1, p.m2]), x2 = cx + r, ytop = y0 + 90;
      sc.line(x2, cy, x2, ytop, 'w rope');
      const at2 = sc.box([x2 - w2 / 2, ytop + h2], [1, 0], [0, -1], w2, h2, kg(p.m2));
      const c1 = at1(w1 / 2, h1 / 2), c2 = at2(w2 / 2, h2 / 2);
      sc.force({ id: 'G1', kind: 'g', at: [c1[0] - 6, c1[1]], dir: [0, 1], sym: ['G', 1], lab: [6, 6] });
      sc.force({ id: 'N', kind: 'n', at: [c1[0] + 6, y0], dir: [0, -1], sym: ['N'], lab: [8, 4] });
      sc.force({ id: 'R', kind: 'r', at: [x1 + 0.3 * w1, y0], dir: [-1, 0], sym: ['R'], lab: [-4, 16] });
      sc.force({ id: 'S1', kind: 'k', at: [x1 + w1, yr], dir: [1, 0], sym: ['S'], lab: [0, -10] });
      sc.force({ id: 'G2', kind: 'g', at: c2, dir: [0, 1], sym: ['G', 2], lab: [8, 6] });
      sc.force({ id: 'S2', kind: 'k', at: [x2, ytop], dir: [0, -1], sym: ['S'], lab: [8, 10] });
      sc.accel({ id: 'a1', at: [c1[0] - 23, y0 - h1 - 16], dir: [1, 0], sym: ['a'], task: 'sym', lab: [0, -12] });
      sc.accel({ id: 'a2', at: [x2 + w2 / 2 + 22, c2[1] - 23], dir: [0, 1], sym: ['a'], task: 'sym', lab: [8, 0] });
      return sized(sc, { G1: p.m1 * G, N: p.m1 * G, R: v.R, S1: v.S, G2: p.m2 * G, S2: v.S });
    },
    hints: () => [
      L('The weight of the hanging box drives both boxes; friction on the table holds them back.', 'Die Gewichtskraft der hängenden Kiste treibt beide Kisten an; die Reibung auf dem Tisch bremst sie.'),
      L(`Along the rope: ${m$(`${T('res')} = ${T('m')}_2\\,g - ${T('R')} = (${T('m')}_1 + ${T('m')}_2)\\,${T('a')}`)}.`, `Entlang des Seils: ${m$(`${T('res')} = ${T('m')}_2\\,g - ${T('R')} = (${T('m')}_1 + ${T('m')}_2)\\,${T('a')}`)}.`),
      L(`The box on the table alone: ${m$(`${T('S')} - ${T('R')} = ${T('m')}_1\\,${T('a')}`)}.`, `Die Kiste auf dem Tisch allein: ${m$(`${T('S')} - ${T('R')} = ${T('m')}_1\\,${T('a')}`)}.`),
    ],
    steps(p, v) {
      const all = ['G1', 'N', 'R', 'S1', 'G2', 'S2', 'a1', 'a2'];
      return [
        step(L('Forces', 'Kräfte'),
          `<p>${L(`On the box on the table: weight and normal force, which balance, friction ${m$(T('R'))} backwards and the rope force ${m$(T('S'))} forwards. On the hanging box: its weight down and the rope force up. The pulley only turns the rope around: the rope pulls both boxes with the same force.`,
            `Auf die Kiste auf dem Tisch: Gewichtskraft und Normalkraft, die sich aufheben, die Reibung ${m$(T('R'))} nach hinten und die Seilkraft ${m$(T('S'))} nach vorn. Auf die hängende Kiste: ihre Gewichtskraft nach unten und die Seilkraft nach oben. Die Rolle lenkt das Seil nur um: Es zieht beide Kisten mit derselben Kraft.`)}</p>`,
          all.filter((x) => x[0] !== 'a')),
        step(L('Friction', 'Reibung'),
          `<p>${L('Only the box on the table rubs: its friction is the friction coefficient times its normal force, which equals its weight, as the table is level:', 'Nur die Kiste auf dem Tisch reibt: Ihre Reibung ist die Reibungszahl mal ihre Normalkraft, die gleich ihrer Gewichtskraft ist, weil der Tisch waagrecht ist:')}</p>` +
          `$$${T('R')} = ${T('mu')}\\,${T('N')} = ${T('mu')}\\,${T('m')}_1\\,g = ${FS.texNum(p.mu, 2)}\\cdot${tq(p.m1 * G, 'N')} = ${res(v.R, 'N')}$$`,
          all.filter((x) => x[0] !== 'a'), ['N', 'R']),
        step(L('Both boxes together', 'Beide Kisten zusammen'),
          `<p>${L('Along the rope, the weight of the hanging box drives the motion and friction acts against it:', 'Entlang des Seils treibt die Gewichtskraft der hängenden Kiste die Bewegung an, und die Reibung wirkt dagegen:')}</p>` +
          `$$${T('res')} = ${T('m')}_2\\,g - ${T('R')} = ${tq(p.m2 * G, 'N')} - ${tq(v.R, 'N')} = ${res(v.res, 'N')}$$` +
          `$$${T('a')} = \\frac{${T('res')}}{${T('m')}_1 + ${T('m')}_2} = \\frac{${tq(v.res, 'N')}}{${tq(p.m1 + p.m2, 'kg')}} = ${res(v.a, 'a')}$$`,
          all, ['G2', 'R', 'a1', 'a2']),
        step(L('Rope force', 'Seilkraft'),
          `<p>${L('The box on the table alone:', 'Die Kiste auf dem Tisch allein:')}</p>` +
          `$$${T('S')} - ${T('R')} = ${T('m')}_1\\,${T('a')} \\;\\Rightarrow\\; ${T('S')} = ${T('m')}_1\\,${T('a')} + ${T('R')} = ${tq(p.m1 * v.a, 'N')} + ${tq(v.R, 'N')} = ${res(v.S, 'N')}$$` +
          `<p>${L(`Check with the hanging box: ${m$(`${T('m')}_2\\,(g - ${T('a')}) = ${tq(p.m2 * (G - v.a), 'N')}`)}, less than its weight, because it accelerates downwards.`, `Kontrolle mit der hängenden Kiste: ${m$(`${T('m')}_2\\,(g - ${T('a')}) = ${tq(p.m2 * (G - v.a), 'N')}`)}, weniger als ihre Gewichtskraft, weil sie nach unten beschleunigt wird.`)}</p>`,
          all, ['S1', 'S2']),
      ];
    },
  };

  // ---------------------------------------------------------------- slopes
  // A slope rising to the right at angle α from the corner O; the box sits at distance s along it.
  function slope(p, w, h, len, o, label, groundEnd) {
    const sc = new Scene(w, h, label), a = rad(p.alpha);
    const u = [Math.cos(a), -Math.sin(a)], n = [-Math.sin(a), -Math.cos(a)];
    const top = [o[0] + len * u[0], o[1] + len * u[1]];
    sc.poly([o, top, [top[0], o[1]]], 'slope');
    sc.surface([o[0] - 20, o[1]], [groundEnd || top[0] + 20, o[1]]);
    sc.angle(o, 40, 0, p.alpha, angleLabel(p), 16);
    return { sc, u, n, top };
  }
  // The box on the slope with weight (and its components), normal force and friction.
  function slopeBox(sl, p, o, s, m, i = '', ms = [m]) {
    const { sc, u, n } = sl, [bw, bh] = dims(m, ms);
    const base = [o[0] + s * u[0], o[1] + s * u[1]];
    const at = sc.box(base, u, n, bw, bh, kg(m));
    const c = at(bw / 2, bh / 2), a = rad(p.alpha);
    // the coefficient of friction inside the slope, clear of the box and its arrows
    const mu = [o[0] + 0.8 * (sl.top[0] - o[0]) + 28 * n[0] * -1, o[1] + 0.8 * (sl.top[1] - o[1]) + 28 * n[1] * -1];
    sc.text(mu[0], mu[1], `${svgSym('mu')} = ${num(p.mu, 2)}`, 'lbl small', 'end');
    sc.force({ id: 'G', kind: 'g', at: c, dir: [0, 1], sym: ['G', i], lab: [-6, 8] });
    sc.force({ id: 'Gp', kind: 'comp', at: c, dir: [-u[0], -u[1]], sym: ['G', i ? `${i}∥` : '∥'], lab: [-6, -8] });
    sc.force({ id: 'Gn', kind: 'comp', at: c, dir: [-n[0], -n[1]], sym: ['G', i ? `${i}⊥` : '⊥'], lab: [8, 6] });
    sc.force({ id: 'N', kind: 'n', at: at(bw / 2 + 6, 0), dir: n, sym: ['N'], lab: [-8, -4] });
    sc.force({ id: 'R', kind: 'r', at: at(0.3 * bw, 0), dir: [-u[0], -u[1]], sym: ['R'], lab: [-8, -6] });
    return { at, bw, bh, c, mags: { G: m * G, Gp: m * G * Math.sin(a), Gn: m * G * Math.cos(a), N: m * G * Math.cos(a) } };
  }
  const slopeMake = (r, o = {}) => ({ alpha: o.nice ? A345 : pick(r, [15, 20, 25, 30, 35, 40, 45]), mu: pick(r, o.nice ? [0.1, 0.2, 0.25, 0.5] : [0.1, 0.2, 0.3, 0.4, 0.5]) });

  const inclinePull = {
    id: 'incline-pull', difficulty: 4, trig: true,
    make(r, o = {}) {
      const { alpha, mu } = slopeMake(r, o);
      return { m: pick(r, [1, 2, 3, 4, 5, 6, 8]), alpha, mu, a: r() < 0.2 ? 0 : pick(r, [0.5, 1, 1.5, 2, 3]) };
    },
    solve(p, o = {}) {
      const g = o.g || G, a = rad(p.alpha);
      let [sn, cs] = [Math.sin(a), Math.cos(a)];
      if (o.swap) [sn, cs] = [cs, sn];
      const N = o.flatN ? p.m * g : p.m * g * cs, R = p.mu * N;
      return { res: p.m * p.a, N, R, F: p.m * p.a + (o.noSlope ? 0 : p.m * g * sn) + (o.noFric ? 0 : R) };
    },
    traps: ['g', 'swap', 'flatN', 'noSlope', 'noFric'],
    why: {
      flatN: () => L('On a slope, the normal force only balances the component of the weight perpendicular to the slope.', 'Auf einer schiefen Ebene hält die Normalkraft nur der Komponente der Gewichtskraft senkrecht zur Unterlage das Gleichgewicht.'),
      noSlope: () => L('The component of the weight down the slope is missing: the pull has to overcome it as well.', 'Die Hangabtriebskraft fehlt: Die Zugkraft muss sie ebenfalls überwinden.'),
      noFric: () => L('Friction is missing: it acts down the slope, against the motion.', 'Die Reibung fehlt: Sie wirkt hangabwärts, gegen die Bewegung.'),
    },
    fields: () => [field('res', '', L('net force on the box', 'resultierende Kraft auf die Kiste')), field('N'), field('R'), field('F')],
    title: () => L('Pulled up a slope', 'Den Hang hinauf gezogen'),
    text: (p) => L(`A box with a mass of ${kg(p.m)} is pulled up a slope ${is345(p) ? `with ${sinCos()}` : `of ${q(p.alpha, 'deg')}`} by a rope parallel to the slope${p.a ? `, with an acceleration of ${q(p.a, 'a')}` : ', at constant speed'}. The coefficient of kinetic friction is ${num(p.mu, 2)}.`,
      `Eine Kiste mit der Masse ${kg(p.m)} wird von einem Seil parallel zur Unterlage ${p.a ? `mit einer Beschleunigung von ${q(p.a, 'a')} ` : 'mit konstanter Geschwindigkeit '}einen Hang ${is345(p) ? `mit ${sinCos()}` : `mit ${q(p.alpha, 'deg')} Neigung`} hinaufgezogen. Die Gleitreibungszahl beträgt ${num(p.mu, 2)}.`),
    scene(p, v) {
      const a = rad(p.alpha), len = Math.min(440, 250 / Math.sin(a)), o = [50, 290];
      const w = Math.ceil(o[0] + len * Math.cos(a) + 70), sl = slope(p, w, 320, len, o, L('A box on a slope', 'Eine Kiste auf einer schiefen Ebene'));
      const b = slopeBox(sl, p, o, len * 0.38, p.m);
      sl.sc.force({ id: 'F', kind: 's', at: b.at(b.bw, b.bh / 2), dir: sl.u, sym: ['F'], task: 'sym', lab: [-6, -12] });
      if (p.a) sl.sc.accel({ id: 'a', at: b.at(b.bw / 2 - 23, b.bh + 18), dir: sl.u, sym: ['a'], value: q(p.a, 'a'), task: 'value', lab: [-6, -12] });
      return sized(sl.sc, { ...b.mags, R: v.R, F: v.F });
    },
    hints: (p) => [
      L('Split the weight into a component down the slope and one perpendicular to it.', 'Zerlege die Gewichtskraft in eine Komponente hangabwärts und eine senkrecht zur Unterlage.'),
      L(`Perpendicular to the slope, nothing moves: ${m$(`${T('N')} = ${T('m')}\\,g\\cos\\alpha`)}; friction ${m$(`${T('R')} = ${T('mu')}\\,${T('N')}`)}.`, `Senkrecht zur Unterlage bewegt sich nichts: ${m$(`${T('N')} = ${T('m')}\\,g\\cos\\alpha`)}; Reibung ${m$(`${T('R')} = ${T('mu')}\\,${T('N')}`)}.`),
      L(`Along the slope: ${m$(`${T('F')} - ${T('m')}\\,g\\sin\\alpha - ${T('R')} = ${T('m')}\\,${T('a')}`)}.`, `Entlang der Unterlage: ${m$(`${T('F')} - ${T('m')}\\,g\\sin\\alpha - ${T('R')} = ${T('m')}\\,${T('a')}`)}.`),
    ],
    steps(p, v) {
      const FG = p.m * G, a = rad(p.alpha), all = ['G', 'N', 'R', 'F', 'a'];
      return [
        step(L('Forces', 'Kräfte'),
          `<p>${L(`Weight ${m$(`${T('G')} = ${tq(FG, 'N')}`)} straight down, the normal force ${m$(T('N'))} perpendicular to the slope, friction ${m$(T('R'))} down the slope (against the motion) and the pull ${m$(T('F'))} up the slope.`, `Gewichtskraft ${m$(`${T('G')} = ${tq(FG, 'N')}`)} senkrecht nach unten, die Normalkraft ${m$(T('N'))} senkrecht zur Unterlage, die Reibung ${m$(T('R'))} hangabwärts (gegen die Bewegung) und die Zugkraft ${m$(T('F'))} hangaufwärts.`)}</p>`,
          ['G', 'N', 'R', 'F']),
        step(L('Components of the weight', 'Komponenten der Gewichtskraft'),
          `<p>${L('Split the weight into a part along the slope and a part perpendicular to it:', 'Zerlege die Gewichtskraft in einen Teil entlang und einen Teil senkrecht zur Unterlage:')}</p>` +
          `$$${T('G', '∥')} = ${T('m')}\\,g\\sin\\alpha = ${tq(FG, 'N')}\\cdot ${trig('sin', p)} = ${tq(FG * Math.sin(a), 'N')}$$` +
          `$$${T('G', '⊥')} = ${T('m')}\\,g\\cos\\alpha = ${tq(FG, 'N')}\\cdot ${trig('cos', p)} = ${tq(FG * Math.cos(a), 'N')}$$`,
          ['G', 'Gp', 'Gn', 'N', 'R', 'F'], ['G', 'Gp', 'Gn']),
        step(L('Perpendicular to the slope', 'Senkrecht zur Unterlage'),
          `<p>${L('The box does not move into the slope or away from it, so the normal force balances the perpendicular component:', 'Die Kiste bewegt sich weder in die Unterlage hinein noch von ihr weg, also hält die Normalkraft der senkrechten Komponente das Gleichgewicht:')}</p>` +
          `$$${T('N')} = ${T('G', '⊥')} = ${T('m')}\\,g\\cos\\alpha = ${res(v.N, 'N')}$$`,
          ['Gp', 'Gn', 'N', 'R', 'F'], ['Gn', 'N']),
        step(L('Friction', 'Reibung'),
          `<p>${L('The box slides up the slope, so friction acts down the slope: the friction coefficient times the normal force found above (not times the weight):', 'Die Kiste gleitet den Hang hinauf, also wirkt die Reibung hangabwärts: die Reibungszahl mal die oben bestimmte Normalkraft (nicht mal die Gewichtskraft):')}</p>` +
          `$$${T('R')} = ${T('mu')}\\,${T('N')} = ${FS.texNum(p.mu, 2)}\\cdot${tq(v.N, 'N')} = ${res(v.R, 'N')}$$`,
          ['Gp', 'Gn', 'N', 'R', 'F'], ['R']),
        step(L('Along the slope', 'Entlang der Unterlage'),
          `<p>${p.a ? L('The net force accelerates the box up the slope:', 'Die resultierende Kraft beschleunigt die Kiste hangaufwärts:') : L('The box moves at constant speed, so the net force is zero:', 'Die Kiste bewegt sich mit konstanter Geschwindigkeit, also ist die resultierende Kraft null:')}` +
          ` $$${T('res')} = ${T('m')}\\,${T('a')} = ${res(v.res, 'N')}$$</p>` +
          `<p>${L('The pull has to overcome the component down the slope and friction, and provide the net force:', 'Die Zugkraft muss die Hangabtriebskraft und die Reibung überwinden und die resultierende Kraft liefern:')}</p>` +
          `$$${T('F')} = ${T('m')}\\,${T('a')} + ${T('m')}\\,g\\sin\\alpha + ${T('R')} = ${tq(v.res, 'N')} + ${tq(FG * Math.sin(a), 'N')} + ${tq(v.R, 'N')} = ${res(v.F, 'N')}$$`,
          ['Gp', 'Gn', 'N', 'R', 'F', 'a'], ['Gp', 'R', 'F']),
      ];
    },
  };

  const inclinePulley = {
    id: 'incline-pulley', difficulty: 5, trig: true,
    boxes: (p) => [L(`box on the slope (${kg(p.m1)})`, `Kiste auf dem Hang (${kg(p.m1)})`), L(`hanging box (${kg(p.m2)})`, `hängende Kiste (${kg(p.m2)})`)],
    make(r, o = {}) {
      const { alpha, mu } = slopeMake(r, o), m1 = pick(r, [1, 2, 3, 4, 5, 6]), m2 = pick(r, [1, 2, 3, 4, 5, 6, 8]);
      const a = rad(alpha), drive = m2 * G - m1 * G * (Math.sin(a) + mu * Math.cos(a));
      return drive > 0.3 * (m1 + m2) ? { alpha, mu, m1, m2 } : null;
    },
    solve(p, o = {}) {
      const g = o.g || G, a = rad(p.alpha);
      let [sn, cs] = [Math.sin(a), Math.cos(a)];
      if (o.swap) [sn, cs] = [cs, sn];
      const N = o.flatN ? p.m1 * g : p.m1 * g * cs, R = p.mu * N;
      const net = p.m2 * g - (o.noSlope ? 0 : p.m1 * g * sn) - (o.noFric ? 0 : R);
      const acc = net / (o.oneMass ? p.m2 : p.m1 + p.m2);
      return { N, R, res: net, a: acc, S: o.hangW ? p.m2 * g : p.m2 * (g - acc) };
    },
    traps: ['g', 'swap', 'flatN', 'noSlope', 'noFric', 'oneMass', 'hangW'],
    why: {
      flatN: () => L('On a slope, the normal force only balances the component of the weight perpendicular to the slope.', 'Auf einer schiefen Ebene hält die Normalkraft nur der Komponente der Gewichtskraft senkrecht zur Unterlage das Gleichgewicht.'),
      noSlope: () => L('The component of the weight of the box on the slope, down the slope, is missing.', 'Die Hangabtriebskraft der Kiste auf der Unterlage fehlt.'),
      noFric: () => L('Friction on the slope is missing.', 'Die Reibung auf der Unterlage fehlt.'),
      oneMass: () => L('The net force accelerates both boxes: divide by the total mass.', 'Die resultierende Kraft beschleunigt beide Kisten: Teile durch die gesamte Masse.'),
      hangW: () => L('The hanging box accelerates downwards, so the rope holds it with less than its weight.', 'Die hängende Kiste wird nach unten beschleunigt, darum hält das Seil sie mit weniger als ihrer Gewichtskraft.'),
    },
    fields: () => [field('N', '', L('normal force on the box on the slope', 'Normalkraft auf die Kiste auf der Unterlage')), field('R', '', L('friction on the box on the slope', 'Reibung auf die Kiste auf der Unterlage')), field('res'), field('a'), field('S')],
    title: () => L('Pulled up by a hanging box', 'Von einer hängenden Kiste hinaufgezogen'),
    text: (p) => L(`A box with a mass of ${kg(p.m1)} lies on a slope ${is345(p) ? `with ${sinCos()}` : `of ${q(p.alpha, 'deg')}`}. A rope parallel to the slope runs from it over a pulley at the top to a hanging box with a mass of ${kg(p.m2)}, which goes down and pulls the first box up the slope. The coefficient of kinetic friction on the slope is ${num(p.mu, 2)}.`,
      `Eine Kiste mit der Masse ${kg(p.m1)} liegt auf einer schiefen Ebene ${is345(p) ? `mit ${sinCos()}` : `mit ${q(p.alpha, 'deg')} Neigung`}. Ein Seil parallel zur Unterlage führt von ihr über eine Rolle oben am Hang zu einer hängenden Kiste mit der Masse ${kg(p.m2)}, die sinkt und die erste Kiste den Hang hinaufzieht. Die Gleitreibungszahl auf der Unterlage beträgt ${num(p.mu, 2)}.`),
    scene(p, v) {
      const a = rad(p.alpha), len = Math.min(380, 230 / Math.sin(a)), o = [40, 300], r = 16;
      const sl0 = { w: Math.ceil(o[0] + len * Math.cos(a) + 120) };
      const [w2, h2] = dims(p.m2, [p.m1, p.m2]), endX = o[0] + len * Math.cos(a);
      const sl = slope(p, sl0.w, 440, len, o, L('A box on a slope, pulled by a hanging box', 'Eine Kiste auf einer schiefen Ebene, von einer hängenden Kiste gezogen'), endX);
      const { sc, u, n, top } = sl;
      const b = slopeBox(sl, p, o, len * 0.3, p.m1, 1, [p.m1, p.m2]);
      // the pulley sticks out past the top, so that the box hangs clear of the slope
      const d = b.bh / 2, out = Math.max(0, (w2 / 2 - r + 8 - (d - r) * n[0]) / u[0]);
      const C = [top[0] + (d - r) * n[0] + out * u[0], top[1] + (d - r) * n[1] + out * u[1]];
      sc.line(top[0], top[1], C[0], C[1], 'w'); sc.pulley(C[0], C[1], r);
      const att = b.at(b.bw, d), tan = [C[0] + r * n[0], C[1] + r * n[1]];
      sc.line(att[0], att[1], tan[0], tan[1], 'w rope');
      const x2 = C[0] + r, ytop = C[1] + 0.5 * (o[1] - C[1]);
      sc.line(x2, C[1], x2, ytop, 'w rope');
      const at2 = sc.box([x2 - w2 / 2, ytop + h2], [1, 0], [0, -1], w2, h2, kg(p.m2)), c2 = at2(w2 / 2, h2 / 2);
      sc.force({ id: 'S1', kind: 'k', at: att, dir: u, sym: ['S'], lab: [-6, -12] });
      sc.force({ id: 'G2', kind: 'g', at: c2, dir: [0, 1], sym: ['G', 2], lab: [8, 6] });
      sc.force({ id: 'S2', kind: 'k', at: [x2, ytop], dir: [0, -1], sym: ['S'], lab: [8, 10] });
      sc.accel({ id: 'a1', at: b.at(b.bw / 2 - 23, b.bh + 18), dir: u, sym: ['a'], task: 'sym', lab: [-6, -12] });
      sc.accel({ id: 'a2', at: [x2 + w2 / 2 + 20, c2[1] - 23], dir: [0, 1], sym: ['a'], task: 'sym', lab: [8, 0] });
      return sized(sc, { ...b.mags, R: v.R, S1: v.S, S2: v.S, G2: p.m2 * G });
    },
    hints: () => [
      L('The box on the slope: split its weight into a component down the slope and one perpendicular to it.', 'Die Kiste auf der Unterlage: Zerlege ihre Gewichtskraft in eine Komponente hangabwärts und eine senkrecht zur Unterlage.'),
      L(`Along the rope, the weight of the hanging box drives both boxes; the component down the slope and friction act against it: ${m$(`${T('res')} = ${T('m')}_2\\,g - ${T('m')}_1\\,g\\sin\\alpha - ${T('R')}`)}.`, `Entlang des Seils treibt die Gewichtskraft der hängenden Kiste beide Kisten an; Hangabtriebskraft und Reibung wirken dagegen: ${m$(`${T('res')} = ${T('m')}_2\\,g - ${T('m')}_1\\,g\\sin\\alpha - ${T('R')}`)}.`),
      L(`The hanging box alone: ${m$(`${T('m')}_2\\,g - ${T('S')} = ${T('m')}_2\\,${T('a')}`)}.`, `Die hängende Kiste allein: ${m$(`${T('m')}_2\\,g - ${T('S')} = ${T('m')}_2\\,${T('a')}`)}.`),
    ],
    steps(p, v) {
      const F1 = p.m1 * G, a = rad(p.alpha), base = ['G', 'N', 'R', 'S1', 'G2', 'S2'], comp = ['Gp', 'Gn', 'N', 'R', 'S1', 'G2', 'S2'], all = [...comp, 'a1', 'a2'];
      return [
        step(L('Forces', 'Kräfte'),
          `<p>${L(`On the box on the slope: its weight, the normal force, friction down the slope and the rope force up the slope. On the hanging box: its weight and the rope force. The pulley turns the rope around: it pulls both boxes with the same force ${m$(T('S'))}.`, `Auf die Kiste auf der Unterlage: ihre Gewichtskraft, die Normalkraft, die Reibung hangabwärts und die Seilkraft hangaufwärts. Auf die hängende Kiste: ihre Gewichtskraft und die Seilkraft. Die Rolle lenkt das Seil um: Es zieht beide Kisten mit derselben Kraft ${m$(T('S'))}.`)}</p>`,
          base),
        step(L('Components of the weight', 'Komponenten der Gewichtskraft'),
          `<p>${L('Split the weight of box 1 into a part along the slope, which pulls it down the slope, and a part perpendicular to it, which presses it onto the slope:', 'Zerlege die Gewichtskraft von Kiste 1 in einen Teil entlang der Unterlage, der sie hangabwärts zieht, und einen Teil senkrecht dazu, der sie auf die Unterlage drückt:')}</p>` +
          `$$${T('G', '1∥')} = ${T('m')}_1\\,g\\sin\\alpha = ${tq(F1 * Math.sin(a), 'N')}, \\qquad ${T('G', '1⊥')} = ${T('m')}_1\\,g\\cos\\alpha = ${tq(F1 * Math.cos(a), 'N')}$$`,
          ['G', ...comp], ['G', 'Gp', 'Gn']),
        step(L('Normal force and friction', 'Normalkraft und Reibung'),
          `<p>${L('Perpendicular to the slope, the forces balance:', 'Senkrecht zur Unterlage heben sich die Kräfte auf:')}</p>` +
          `$$${T('N')} = ${T('m')}_1\\,g\\cos\\alpha = ${res(v.N, 'N')}, \\qquad ${T('R')} = ${T('mu')}\\,${T('N')} = ${FS.texNum(p.mu, 2)}\\cdot${tq(v.N, 'N')} = ${res(v.R, 'N')}$$`,
          comp, ['Gn', 'N', 'R']),
        step(L('Both boxes together', 'Beide Kisten zusammen'),
          `<p>${L('Along the rope, the weight of the hanging box drives the motion; the component down the slope and friction act against it:', 'Entlang des Seils treibt die Gewichtskraft der hängenden Kiste die Bewegung an; Hangabtriebskraft und Reibung wirken dagegen:')}</p>` +
          `$$${T('res')} = ${T('m')}_2\\,g - ${T('m')}_1\\,g\\sin\\alpha - ${T('R')} = ${tq(p.m2 * G, 'N')} - ${tq(F1 * Math.sin(a), 'N')} - ${tq(v.R, 'N')} = ${res(v.res, 'N')}$$` +
          `$$${T('a')} = \\frac{${T('res')}}{${T('m')}_1 + ${T('m')}_2} = \\frac{${tq(v.res, 'N')}}{${tq(p.m1 + p.m2, 'kg')}} = ${res(v.a, 'a')}$$`,
          all, ['G2', 'Gp', 'R', 'a1', 'a2']),
        step(L('Rope force', 'Seilkraft'),
          `<p>${L('The hanging box alone: its weight pulls it down, the rope holds it back.', 'Die hängende Kiste allein: Ihre Gewichtskraft zieht sie nach unten, das Seil hält sie zurück.')}</p>` +
          `$$${T('m')}_2\\,g - ${T('S')} = ${T('m')}_2\\,${T('a')} \\;\\Rightarrow\\; ${T('S')} = ${T('m')}_2\\,(g - ${T('a')}) = ${tq(p.m2, 'kg')}\\cdot${tq(G - v.a, 'a')} = ${res(v.S, 'N')}$$`,
          all, ['S2', 'G2']),
      ];
    },
  };

  const SCENARIOS = [restUp, restAngle, pullFriction, pushPair, ropePair, atwood, tablePulley, inclinePull, inclinePulley];

  root.Scenarios = { SCENARIOS };
  if (typeof module !== 'undefined') module.exports = root.Scenarios;
})(typeof window !== 'undefined' ? window : globalThis);
