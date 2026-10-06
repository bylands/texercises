// The situations of the worksheets “Übungen Drehmomente” and “Übungen Schwerpunkt”: torques of
// forces on a plate, levers in balance, where to hang a beam, and the centre of mass of wire
// figures. A scenario has an id, a family (torque, lever, hang or com: the kind of task), a
// difficulty from 1 to 5 (for practice levels and the arcade), calc ('always' if its results need a
// calculator, 'trig' if only some of its angles do), and:
//   make(r, o)         random parameters (null if they do not fit); with o.nice, no calculator
//                      is needed (angles of 30°, 90° or 150°)
//   solve(p, o)        the wanted quantities, exact; o switches on a typical wrong idea (see why)
//                      so that wrong answers can be recognised
//   traps, why         the wrong ideas worth checking, and what each answer suggests
//   fields(p)          the wanted quantities, in order: { key, sym: [symbol, index], unit, dec,
//                      what, sense (a torque: its size and its sense of rotation) }
//   title(p), text(p)  the situation in words
//   figure(p, v, view) the drawing: view.task (the situation only) or view.show (a Set of the
//                      parts of the solution to draw in) and view.hl (those to highlight)
//   hints(p, v), steps(p, v)  hints and the worked solution: steps { text, show, hl }
//   comps(p)           what the student identifies first in practice (identify.js), whose value
//                      the app then gives: a component { key, what, sym, base, baseVal, fn, unit,
//                      why } or a ready item { key, what, options, value }
(function (root) {
  'use strict';

  const TQ = root.TQ, { Pic } = root.Draw;
  const { L, G, tex: T, tq, q, num, svgSym, pick, rad } = TQ;
  const res = (x, u, dec) => `\\htmlClass{result}{${tq(x, u, dec)}}`;
  const m$ = (s) => `$${s}$`;
  // Angles of right triangles with whole sides (3-4-5, 5-12-13, …): with a length that is a multiple
  // of the hypotenuse, the lever arm is a whole number.
  const TRIANGLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]];
  const PYTH = TRIANGLES.flatMap(([a, b]) => [Math.atan2(a, b), Math.atan2(b, a)].map((x) => (x * 180) / Math.PI));
  const A345 = (Math.atan2(3, 4) * 180) / Math.PI;
  const step = (rule, text, show = [], hl) => ({ text: (rule ? `<p class="step-rule">${rule}</p>` : '') + text, show, hl: hl || show });
  const exact = (x) => Math.round(x * 1e6) / 1e6;
  const CCW = () => L('counterclockwise', 'im Gegenuhrzeigersinn'), CW = () => L('clockwise', 'im Uhrzeigersinn');
  const senseWord = (M) => (Math.abs(M) < 1e-9 ? L('no rotation', 'keine Drehung') : M > 0 ? CCW() : CW());

  // ================================================================ torques on a plate
  // A plate that can turn about an axis through D, on a grid of 10 cm squares; forces F_i act at
  // grid points, along the grid (axis) or in 3-4-5 directions (oblique). The torque M = F·d,
  // with d the lever arm: the distance from D to the line of action. Positive: counterclockwise.
  const UNIT = 10; // cm per square
  const PX = 30; // px per square
  const AXIS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const OBLIQUE = [[3, 4], [4, 3], [-3, 4], [-4, 3], [3, -4], [4, -3], [-3, -4], [-4, -3]].map(([a, b]) => [a / 5, b / 5]);
  const arrowLen = (F) => 16 + 9 * F; // px
  const segDist = (p, a, b) => {
    const d = [b[0] - a[0], b[1] - a[1]], t = Math.max(0, Math.min(1, ((p[0] - a[0]) * d[0] + (p[1] - a[1]) * d[1]) / (d[0] ** 2 + d[1] ** 2)));
    return Math.hypot(p[0] - a[0] - t * d[0], p[1] - a[1] - t * d[1]);
  };
  const cross = (a, b, c, d) => {
    const o = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
    return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0;
  };
  // the torque about D (N·m) of a force F (N) along u at the grid point P
  const torqueOf = (f) => exact(((f.P[0] * f.u[1] - f.P[1] * f.u[0]) * f.F * UNIT) / 100);

  function plateMake(r, n, oblique) {
    const fs = [], zero = oblique && r() < 0.5 ? Math.floor(r() * n) : -1;
    for (let i = 0; i < n; i++) {
      let P, u;
      if (i === zero) { // its line of action passes through D
        const k = pick(r, [2, 3]), a = pick(r, AXIS);
        P = [a[0] * k, a[1] * k]; u = pick(r, [a, [-a[0], -a[1]]]);
      } else {
        P = [Math.floor(r() * 9) - 4, Math.floor(r() * 7) - 3];
        u = oblique && (i < 2 || r() < 0.4) ? pick(r, OBLIQUE) : pick(r, AXIS);
      }
      const F = 2 + Math.floor(r() * 7);
      const f = { P, u, F };
      f.tip = [P[0] + (u[0] * arrowLen(F)) / PX, P[1] + (u[1] * arrowLen(F)) / PX];
      f.M = torqueOf(f);
      fs.push(f);
    }
    const ok = fs.every((f, i) => {
      if (Math.hypot(...f.P) < 1.5 || Math.abs(f.tip[0]) > 6.2 || Math.abs(f.tip[1]) > 4.6) return false;
      if (i !== zero && (Math.abs(f.M) < 0.05 || segDist([0, 0], f.P, f.tip) < 0.8)) return false;
      if (i === zero && segDist([0, 0], f.P, f.tip) < 0.8) return false;
      return fs.every((g, j) => j <= i || (Math.hypot(f.P[0] - g.P[0], f.P[1] - g.P[1]) >= 2 && Math.hypot(f.tip[0] - g.tip[0], f.tip[1] - g.tip[1]) >= 2.4
        && !cross(f.P, f.tip, g.P, g.tip) && segDist(g.tip, f.P, f.tip) > 1 && segDist(f.tip, g.P, g.tip) > 1
        && segDist(g.P, f.P, f.tip) > 0.6 && segDist(f.P, g.P, g.tip) > 0.6 && Math.abs(Math.abs(f.M) - Math.abs(g.M)) >= 0.03));
    });
    // the distance to the point of application must mislead for at least one force
    if (!ok || !fs.some((f) => Math.abs(Math.abs(f.M) - (f.F * Math.hypot(...f.P) * UNIT) / 100) > 0.05)) return null;
    return { forces: fs.map(({ P, u, F }) => ({ P, u, F })) };
  }

  // The lever arm (cm) and the foot of the perpendicular from D onto the line of action (grid units).
  const armOf = (f) => {
    const t = -(f.P[0] * f.u[0] + f.P[1] * f.u[1]), foot = [f.P[0] + t * f.u[0], f.P[1] + t * f.u[1]];
    return { d: exact(Math.hypot(...foot) * UNIT), foot };
  };
  const isAxis = (f) => f.u[0] === 0 || f.u[1] === 0;

  function plateFigure(p, v, view = {}) {
    const P = new Pic(PX, L('A plate that can turn about D, with the forces acting on it', 'Eine um D drehbare Platte mit den Kräften, die auf sie wirken'));
    const show = view.show || new Set(), hl = view.hl || new Set();
    const xs = p.forces.flatMap((f) => [f.P[0], f.tip ? f.tip[0] : f.P[0]]);
    P.grid(-6.5, -5, 6.5, 5, 1);
    // the plate: a rounded rectangle around D and the points of application
    const px = [0, ...p.forces.map((f) => f.P[0])], py = [0, ...p.forces.map((f) => f.P[1])];
    P.rect([Math.min(...px) - 0.9, Math.min(...py) - 0.9], [Math.max(...px) + 0.9, Math.max(...py) + 0.9], 'plate', 16);
    void xs;
    p.forces.forEach((f, i) => {
      const k = i + 1, tip = [f.P[0] + (f.u[0] * arrowLen(f.F)) / PX, f.P[1] + (f.u[1] * arrowLen(f.F)) / PX];
      if (show.has(`arm${k}`)) {
        const { foot } = armOf(f);
        // the line of action, as far as the grid goes
        const ts = [[-6.5, 6.5, 0], [-5, 5, 1]].flatMap(([lo, hi, k]) => (Math.abs(f.u[k]) < 1e-9 ? [] : [(lo - f.P[k]) / f.u[k], (hi - f.P[k]) / f.u[k]]));
        const inside = (t) => Math.abs(f.P[0] + t * f.u[0]) <= 6.5 + 1e-9 && Math.abs(f.P[1] + t * f.u[1]) <= 5 + 1e-9;
        const tt = ts.filter(inside), t0 = Math.min(...tt), t1 = Math.max(...tt);
        P.line([f.P[0] + t0 * f.u[0], f.P[1] + t0 * f.u[1]], [f.P[0] + t1 * f.u[0], f.P[1] + t1 * f.u[1]], 'action', true);
        if (v.M[i] !== 0) {
          P.line([0, 0], foot, `arm${hl.has(`arm${k}`) ? ' hl' : ''}`, true);
          P.dot(foot, 'dot small', 2);
          P.text([foot[0] / 2, foot[1] / 2], `<tspan font-style="italic">d</tspan><tspan class="sub" dy="4">${k}</tspan>`, 'lbl arm-lbl', 'middle', [foot[1] >= 0 && Math.abs(foot[0]) > 0.1 ? -10 : 10, Math.abs(foot[0]) < 0.1 ? 0 : -10]);
        }
      }
      const cls = `force${hl.size && !hl.has(`F${k}`) && !hl.has(`arm${k}`) ? ' dim' : ''}${hl.has(`F${k}`) || hl.has(`arm${k}`) ? ' hl' : ''}`;
      const off = [f.u[0] * 12 + (Math.abs(f.u[0]) < 0.5 ? 8 : 0), -f.u[1] * 12 + (Math.abs(f.u[1]) < 0.5 ? 0 : f.u[1] > 0 ? -2 : 4)];
      P.arrow(f.P, f.u, arrowLen(f.F), cls, `${svgSym('F', k)} = ${f.F} N`, off);
      if (show.has(`turn${k}`) && v.M[i] !== 0) P.turn([0, 0], 26, Math.sign(v.M[i]), 'turn hl', v.M[i] > 0 ? 120 : 0); // open at the top right, where D's label is
      void tip;
    });
    P.pivot([0, 0]);
    P.text([0, 0], 'D', 'lbl', 'start', [7, -10]);
    P.text([-6.5, -5], L('squares: 10 cm', 'Kästchen: 10 cm'), 'lbl note', 'start', [0, 16]);
    return P.svg();
  }

  const plateWhat = (k) => L(`torque of $F_${k}$`, `Drehmoment von $F_${k}$`);
  function plate(id, difficulty, n, oblique) {
    return {
      id, family: 'torque', difficulty,
      make: (r) => plateMake(r, n, oblique),
      solve(p, o = {}) {
        const out = { M: p.forces.map((f) => (o.arm ? Math.sign(torqueOf(f)) * exact((f.F * Math.hypot(...f.P) * UNIT) / 100) : torqueOf(f))) };
        p.forces.forEach((f, i) => { out[`M${i + 1}`] = out.M[i]; });
        return out;
      },
      traps: ['arm'],
      why: { arm: () => L('That is the force times the distance from D to where the force acts. The lever arm is the distance from D to the line of action.', 'Das ist die Kraft mal den Abstand von D zum Angriffspunkt. Der Hebelarm ist der Abstand von D zur Wirkungslinie.') },
      fields: (p) => p.forces.map((f, i) => ({ key: `M${i + 1}`, sym: ['M', i + 1], unit: 'Nm', dec: 2, what: plateWhat(i + 1), sense: true })),
      title: () => (oblique ? L('Torques on a plate', 'Drehmomente auf eine Platte') : L('Forces along the grid', 'Kräfte entlang des Gitters')),
      text: () => L(`A flat plate can turn about a fixed axis through D, perpendicular to the plate. ${n} forces act on it, drawn on a grid of 10 cm squares. Find the torque of each force about D and the sense in which it would turn the plate. Then rank the torques by size.`,
        `Eine flache Platte ist um eine feste Achse durch D drehbar, die senkrecht zur Platte steht. ${n === 3 ? 'Drei' : n === 4 ? 'Vier' : 'Fünf'} Kräfte wirken auf sie, gezeichnet auf einem Gitter aus Kästchen von 10 cm. Bestimme das Drehmoment jeder Kraft bezüglich D und den Drehsinn, in dem sie die Platte drehen würde. Ordne die Drehmomente dann nach ihrem Betrag.`),
      figure: plateFigure,
      hints: (p) => [
        L('The torque of a force is M = F · d, where the lever arm d is the distance from the axis D to the line of action of the force (not to the point where it acts).',
          'Das Drehmoment einer Kraft ist M = F · d; der Hebelarm d ist der Abstand der Drehachse D von der Wirkungslinie der Kraft (nicht vom Angriffspunkt).'),
        L('Extend each arrow to a line: the line of action. For a force along the grid, the lever arm is the number of squares from D to that line (times 10 cm).',
          'Verlängere jeden Pfeil zu einer Geraden, der Wirkungslinie. Bei einer Kraft entlang des Gitters ist der Hebelarm die Anzahl Kästchen von D bis zu dieser Geraden (mal 10 cm).'),
        ...(oblique ? [L('An oblique force has the steepness 3 : 4 or 4 : 3. Split it into a horizontal and a vertical component (0.6 F and 0.8 F). Each has a lever arm you can read off the grid; their torques add, or subtract if they turn opposite ways.',
          'Eine schräge Kraft hat die Steigung 3 : 4 oder 4 : 3. Zerlege sie in eine horizontale und eine vertikale Komponente (0.6 F und 0.8 F). Jede hat einen Hebelarm, den du am Gitter ablesen kannst; ihre Drehmomente addieren sich, oder sie subtrahieren sich, wenn sie gegeneinander drehen.')] : []),
        L(`Sense of rotation: imagine the plate pinned at D and pushed only by this force. If the line of action passes through D, the torque is zero.`,
          'Drehsinn: Stell dir vor, die Platte sei in D festgesteckt und nur diese Kraft wirke. Geht die Wirkungslinie durch D, ist das Drehmoment null.'),
      ],
      steps(p, v) {
        const out = [step(L('Torque', 'Drehmoment'),
          `<p>${L('The torque of a force about D is the force times its lever arm, the distance from D to the line of action:', 'Das Drehmoment einer Kraft bezüglich D ist die Kraft mal ihr Hebelarm, der Abstand von D zur Wirkungslinie:')}</p>$$M = F\\cdot d$$` +
          `<p>${L('Its sense is the way the force alone would turn the plate about D.', 'Sein Drehsinn ist die Richtung, in die die Kraft allein die Platte um D drehen würde.')}</p>`)];
        p.forces.forEach((f, i) => {
          const k = i + 1, M = v.M[i], { d } = armOf(f), sh = [`arm${k}`, `turn${k}`];
          let body;
          if (M === 0) {
            body = L(`The line of action of $F_${k}$ passes through D: its lever arm is zero, so $M_${k} = ${res(0, 'Nm')}$. It does not turn the plate.`,
              `Die Wirkungslinie von $F_${k}$ geht durch D: Ihr Hebelarm ist null, also $M_${k} = ${res(0, 'Nm')}$. Sie dreht die Platte nicht.`);
          } else if (isAxis(f)) {
            body = L(`The line of action of $F_${k}$ is ${f.u[0] === 0 ? 'vertical' : 'horizontal'}, ${d / UNIT} squares from D: $d_${k} = ${tq(d, 'cm')} = ${tq(d / 100, 'm')}$.`,
              `Die Wirkungslinie von $F_${k}$ ist ${f.u[0] === 0 ? 'senkrecht' : 'waagrecht'}, ${d / UNIT} Kästchen von D entfernt: $d_${k} = ${tq(d, 'cm')} = ${tq(d / 100, 'm')}$.`) +
              `$$M_${k} = F_${k}\\cdot d_${k} = ${tq(f.F, 'N')}\\cdot ${tq(d / 100, 'm')} = ${res(Math.abs(M), 'Nm')}$$` +
              L(`It turns the plate ${senseWord(M)}.`, `Sie dreht die Platte ${senseWord(M)}.`);
          } else {
            const Fx = exact(f.F * f.u[0]), Fy = exact(f.F * f.u[1]), dx = f.P[0] * UNIT, dy = f.P[1] * UNIT;
            const Mx = exact((-f.P[1] * Fx * UNIT) / 100), My = exact((f.P[0] * Fy * UNIT) / 100);
            const part = (Mc) => `${q(Math.abs(Mc), 'Nm')} ${Mc > 0 ? '↺' : Mc < 0 ? '↻' : ''}`;
            body = L(`$F_${k}$ is oblique. Split it into a horizontal component of ${q(Math.abs(Fx), 'N')} and a vertical one of ${q(Math.abs(Fy), 'N')}. ` +
              `The horizontal component acts ${Math.abs(dy)} cm ${dy >= 0 ? 'above' : 'below'} D, the vertical one ${Math.abs(dx)} cm ${dx >= 0 ? 'right of' : 'left of'} D; so their torques are ${part(Mx)} and ${part(My)}.`,
            `$F_${k}$ ist schräg. Zerlege sie in eine horizontale Komponente von ${q(Math.abs(Fx), 'N')} und eine vertikale von ${q(Math.abs(Fy), 'N')}. ` +
              `Die horizontale Komponente greift ${Math.abs(dy)} cm ${dy >= 0 ? 'über' : 'unter'} D an, die vertikale ${Math.abs(dx)} cm ${dx >= 0 ? 'rechts' : 'links'} von D; ihre Drehmomente sind also ${part(Mx)} und ${part(My)}.`) +
              `$$M_${k} = ${res(Math.abs(M), 'Nm')}$$` +
              L(`together, ${senseWord(M)}. The lever arm of the whole force is $d_${k} = M_${k}/F_${k} = ${tq(d, 'cm', 1)}$ (drawn in): less than the distance from D to where the force acts.`,
                `zusammen, ${senseWord(M)}. Der Hebelarm der ganzen Kraft ist $d_${k} = M_${k}/F_${k} = ${tq(d, 'cm', 1)}$ (eingezeichnet): kleiner als der Abstand von D zum Angriffspunkt.`);
          }
          out.push(step(L(`Force ${k}`, `Kraft ${k}`), `<p>${body}</p>`, sh, [`arm${k}`]));
        });
        const order = v.M.map((M, i) => ({ M, i })).sort((a, b) => Math.abs(a.M) - Math.abs(b.M));
        out.push(step(L('Ranking', 'Rangfolge'),
          `$$${order.map((o) => `M_${o.i + 1}`).join(' < ')}$$<p>${order.map((o) => `$M_${o.i + 1} = ${tq(Math.abs(o.M), 'Nm')}$ ${o.M > 0 ? '↺' : o.M < 0 ? '↻' : ''}`).join(', ')}</p>`,
          p.forces.map((f, i) => `arm${i + 1}`), []));
        return out;
      },
    };
  }

  // ================================================================ levers in balance
  // A beam on a support or an axis: the torques that turn it one way balance those that turn it
  // the other way. Beams are drawn at a scale that fits them into about 360 px.
  const BEAM_PX = 360;
  const kg = (m) => q(m, 'kg', 2);
  const cm = (x) => q(x, 'cm', 1);
  const N = (F) => q(F, 'N', 1);

  // A beam from x = 0 to len (cm), its scale, and helpers: the support or axis at s, loads.
  function beamPic(len, label, thick = 3) {
    const P = new Pic(BEAM_PX / len, label), h = 10 / P.s;
    P.rect([0, 0], [len, h], 'beam', 2);
    void thick;
    return { P, h, top: (x) => [x, h], bottom: (x) => [x, 0], mid: (x) => [x, h / 2] };
  }

  // the seesaw: a light beam on a support in its middle; m1 at a1 on the left; on the right m2 at
  // x (find x) or at a2 (find m2)
  const seesaw = {
    id: 'seesaw', family: 'lever', difficulty: 1,
    make(r) {
      const find = pick(r, ['x', 'm']), m1 = pick(r, [0.5, 1, 1.5, 2, 2.5, 3, 4]), a1 = pick(r, [10, 15, 20, 25, 30, 40, 45, 50]);
      const m2 = pick(r, [0.5, 1, 1.5, 2, 2.5, 3, 4, 5]);
      if (m2 === m1) return null;
      const x = (m1 * a1) / m2;
      if (x > 60 || x < 5) return null;
      return find === 'x' ? { find, m1, a1, m2 } : { find, m1, a1, a2: x, m2 };
    },
    solve(p, o = {}) {
      if (p.find === 'x') return { x: exact(o.swap ? (p.m2 * p.a1) / p.m1 : (p.m1 * p.a1) / p.m2) };
      return { m: exact(o.swap ? (p.m1 * p.a2) / p.a1 : (p.m1 * p.a1) / p.a2) };
    },
    traps: ['swap'],
    why: { swap: () => L('Reversed: the heavier mass needs the shorter lever arm.', 'Umgekehrt: Die schwerere Masse braucht den kürzeren Hebelarm.') },
    fields: (p) => (p.find === 'x' ? [{ key: 'x', sym: ['x'], unit: 'cm', dec: 1, what: L('distance from the support', 'Abstand von der Stütze') }]
      : [{ key: 'm', sym: ['m', 2], unit: 'kg', dec: 2, what: L('mass on the right', 'Masse rechts') }]),
    title: () => L('Balancing a lever', 'Ein Hebel im Gleichgewicht'),
    text: (p) => (p.find === 'x'
      ? L(`A light beam rests on a support in its middle. A mass of ${kg(p.m1)} hangs ${cm(p.a1)} to the left of the support. How far to the right of the support must a mass of ${kg(p.m2)} hang so that the beam is balanced?`,
        `Ein leichter Balken liegt in seiner Mitte auf einer Stütze. ${cm(p.a1)} links der Stütze hängt eine Masse von ${kg(p.m1)}. Wie weit rechts der Stütze muss eine Masse von ${kg(p.m2)} hängen, damit der Balken im Gleichgewicht ist?`)
      : L(`A light beam rests on a support in its middle. A mass of ${kg(p.m1)} hangs ${cm(p.a1)} to the left of the support. Which mass must hang ${cm(p.a2)} to the right of the support so that the beam is balanced?`,
        `Ein leichter Balken liegt in seiner Mitte auf einer Stütze. ${cm(p.a1)} links der Stütze hängt eine Masse von ${kg(p.m1)}. Welche Masse muss ${cm(p.a2)} rechts der Stütze hängen, damit der Balken im Gleichgewicht ist?`)),
    figure(p, v, view = {}) {
      const a2 = p.find === 'x' ? (view.task ? null : v.x) : p.a2, half = Math.max(p.a1, a2 || 0, p.find === 'x' ? 40 : 0) + 10;
      const B = beamPic(2 * half, L('A beam on a support with a load on each side', 'Ein Balken auf einer Stütze mit einer Last auf jeder Seite')), P = B.P, c = half;
      P.support(B.bottom(c));
      P.mass(B.bottom(c - p.a1), 40, kg(p.m1));
      const m2 = p.find === 'm' ? (view.task ? '?' : kg(v.m)) : kg(p.m2);
      if (a2 != null) P.mass(B.bottom(c + a2), 40, m2, `load${p.find === 'm' ? ' unknown' : ''}`);
      else P.mass(B.bottom(c + 30), 40, m2, 'load ghost');
      P.dim(B.top(c - p.a1), B.top(c), cm(p.a1), 14);
      if (a2 != null) P.dim(B.top(c), B.top(c + a2), p.find === 'x' && view.task ? svgSym('x') : cm(a2), 14, `dimline${p.find === 'x' ? ' hl' : ''}`);
      else P.dim(B.top(c), B.top(c + 30), svgSym('x') + ' = ?', 14, 'dimline hl');
      return P.svg();
    },
    hints: (p) => [
      L('Each weight turns the beam about the support: the left one counterclockwise, the right one clockwise. In balance the two torques are equal.', 'Jede Gewichtskraft dreht den Balken um die Stütze: die linke im Gegenuhrzeigersinn, die rechte im Uhrzeigersinn. Im Gleichgewicht sind die beiden Drehmomente gleich gross.'),
      L('Torque = weight × lever arm, and the weight is m g. So m₁ g a₁ = m₂ g a₂: g cancels.', 'Drehmoment = Gewichtskraft × Hebelarm, und die Gewichtskraft ist m g. Also m₁ g a₁ = m₂ g a₂: g kürzt sich weg.'),
      p.find === 'x' ? L('Solve for the unknown arm: x = m₁ a₁ / m₂.', 'Löse nach dem unbekannten Hebelarm auf: x = m₁ a₁ / m₂.') : L('Solve for the unknown mass: m₂ = m₁ a₁ / a₂.', 'Löse nach der unbekannten Masse auf: m₂ = m₁ a₁ / a₂.'),
    ],
    steps(p, v) {
      const law = `m_1\\,g\\,a_1 = m_2\\,g\\,${p.find === 'x' ? 'x' : 'a_2'}`;
      return [
        step(L('Balance of torques', 'Gleichgewicht der Drehmomente'),
          `<p>${L('The left load turns the beam counterclockwise about the support, the right one clockwise. The beam is balanced if both torques are equal; each is the weight m g times its lever arm:', 'Die linke Last dreht den Balken im Gegenuhrzeigersinn um die Stütze, die rechte im Uhrzeigersinn. Der Balken ist im Gleichgewicht, wenn beide Drehmomente gleich gross sind; jedes ist die Gewichtskraft m g mal ihr Hebelarm:')}</p>$$${law}$$`),
        p.find === 'x'
          ? step(L('Formula, then numbers', 'Formel, dann Zahlen'), `<p>${L('g cancels; solve for x:', 'g kürzt sich weg; nach x auflösen:')}</p>$$x = \\frac{m_1\\,a_1}{m_2} = \\frac{${tq(p.m1, 'kg')}\\cdot ${tq(p.a1, 'cm')}}{${tq(p.m2, 'kg')}} = ${res(v.x, 'cm', 1)}$$<p>${L('The lighter mass needs the longer lever arm.', 'Die leichtere Masse braucht den längeren Hebelarm.')}</p>`)
          : step(L('Formula, then numbers', 'Formel, dann Zahlen'), `<p>${L('g cancels; solve for m₂:', 'g kürzt sich weg; nach m₂ auflösen:')}</p>$$m_2 = \\frac{m_1\\,a_1}{a_2} = \\frac{${tq(p.m1, 'kg')}\\cdot ${tq(p.a1, 'cm')}}{${tq(p.a2, 'cm')}} = ${res(v.m, 'kg', 2)}$$`),
      ];
    },
  };

  // three loads: m1 at a1 and m2 at a2 on the left, m3 on the right at x (find x)
  const lever3 = {
    id: 'lever3', family: 'lever', difficulty: 2,
    make(r) {
      const m1 = pick(r, [0.5, 1, 1.5, 2, 3]), m2 = pick(r, [0.5, 1, 1.5, 2, 3]), a1 = pick(r, [10, 20, 30]), a2 = a1 + pick(r, [10, 20, 30]);
      const m3 = pick(r, [1, 1.5, 2, 2.5, 3, 4, 5]), x = (m1 * a1 + m2 * a2) / m3;
      if (x > 70 || x < 10) return null;
      return { m1, m2, a1, a2, m3 };
    },
    solve(p, o = {}) {
      if (o.oneLoad) return { x: exact((p.m2 * p.a2) / p.m3) };
      if (o.sumMass) return { x: exact(((p.m1 + p.m2) * p.a2) / p.m3) };
      return { x: exact((p.m1 * p.a1 + p.m2 * p.a2) / p.m3) };
    },
    traps: ['oneLoad', 'sumMass'],
    why: {
      oneLoad: () => L('Both loads on the left turn the beam: add their torques.', 'Beide Lasten links drehen den Balken: Addiere ihre Drehmomente.'),
      sumMass: () => L('Each load has its own lever arm: add the torques, not the masses.', 'Jede Last hat ihren eigenen Hebelarm: Addiere die Drehmomente, nicht die Massen.'),
    },
    fields: () => [{ key: 'x', sym: ['x'], unit: 'cm', dec: 1, what: L('distance from the support', 'Abstand von der Stütze') }],
    title: () => L('Two loads against one', 'Zwei Lasten gegen eine'),
    text: (p) => L(`A light beam rests on a support in its middle. On the left, a mass of ${kg(p.m1)} hangs ${cm(p.a1)} from the support and a mass of ${kg(p.m2)} ${cm(p.a2)} from it. How far to the right of the support must a mass of ${kg(p.m3)} hang so that the beam is balanced?`,
      `Ein leichter Balken liegt in seiner Mitte auf einer Stütze. Links hängt eine Masse von ${kg(p.m1)} ${cm(p.a1)} von der Stütze entfernt und eine Masse von ${kg(p.m2)} ${cm(p.a2)} von ihr entfernt. Wie weit rechts der Stütze muss eine Masse von ${kg(p.m3)} hängen, damit der Balken im Gleichgewicht ist?`),
    figure(p, v, view = {}) {
      const x = view.task ? null : v.x, half = Math.max(p.a2, x || 40) + 10;
      const B = beamPic(2 * half, L('A beam on a support with two loads on the left and one on the right', 'Ein Balken auf einer Stütze mit zwei Lasten links und einer rechts')), P = B.P, c = half;
      P.support(B.bottom(c));
      P.mass(B.bottom(c - p.a1), 34, kg(p.m1));
      P.mass(B.bottom(c - p.a2), 34, kg(p.m2));
      P.dim(B.top(c - p.a1), B.top(c), cm(p.a1), 14);
      P.dim(B.top(c - p.a2), B.top(c), cm(p.a2), 38);
      const xr = x == null ? 30 : x;
      P.mass(B.bottom(c + xr), 34, kg(p.m3), x == null ? 'load ghost' : 'load');
      P.dim(B.top(c), B.top(c + xr), x == null ? svgSym('x') + ' = ?' : cm(x), 14, 'dimline hl');
      return P.svg();
    },
    hints: () => [
      L('Both loads on the left turn the beam counterclockwise; the load on the right turns it clockwise.', 'Beide Lasten links drehen den Balken im Gegenuhrzeigersinn, die Last rechts im Uhrzeigersinn.'),
      L('In balance, the sum of the counterclockwise torques equals the sum of the clockwise ones: m₁ g a₁ + m₂ g a₂ = m₃ g x.', 'Im Gleichgewicht ist die Summe der Drehmomente im Gegenuhrzeigersinn gleich der Summe derjenigen im Uhrzeigersinn: m₁ g a₁ + m₂ g a₂ = m₃ g x.'),
    ],
    steps: (p, v) => [
      step(L('Balance of torques', 'Gleichgewicht der Drehmomente'),
        `<p>${L('Both loads on the left turn the beam counterclockwise, the one on the right clockwise. In balance the torques of both senses are equal:', 'Beide Lasten links drehen den Balken im Gegenuhrzeigersinn, die rechte im Uhrzeigersinn. Im Gleichgewicht sind die Drehmomente beider Drehsinne gleich gross:')}</p>$$m_1\\,g\\,a_1 + m_2\\,g\\,a_2 = m_3\\,g\\,x$$`),
      step(L('Formula, then numbers', 'Formel, dann Zahlen'),
        `$$x = \\frac{m_1\\,a_1 + m_2\\,a_2}{m_3} = \\frac{${tq(p.m1, 'kg')}\\cdot ${tq(p.a1, 'cm')} + ${tq(p.m2, 'kg')}\\cdot ${tq(p.a2, 'cm')}}{${tq(p.m3, 'kg')}} = ${res(v.x, 'cm', 1)}$$`),
    ],
  };

  // a heavy beam (mass mb, length len) on a support at s from its left end (left of the middle);
  // a load m hangs at the left end. Find m (the beam's mass given) or mb (the load given).
  const beamWeight = {
    id: 'beam-weight', family: 'lever', difficulty: 3,
    make(r) {
      const len = pick(r, [60, 80, 100, 120]), s = pick(r, [10, 15, 20, 25, 30, 40].filter((x) => x < len / 2 - 5)), find = pick(r, ['m', 'mb']);
      const mb = pick(r, [0.5, 1, 1.5, 2, 3, 4]), m = (mb * (len / 2 - s)) / s;
      if (m > 10 || m < 0.2) return null;
      if (find === 'mb' && Math.abs(m * 20 - Math.round(m * 20)) > 1e-9) return null; // a given mass in steps of 50 g
      return find === 'm' ? { len, s, find, mb } : { len, s, find, m: exact(m) };
    },
    solve(p, o = {}) {
      const arm = o.end ? p.len / 2 : p.len / 2 - p.s;
      return p.find === 'm' ? { m: exact((p.mb * arm) / p.s) } : { mb: exact((p.m * p.s) / arm) };
    },
    traps: ['end'],
    why: { end: () => L('The lever arm of the beam’s weight is measured from the support to the middle of the beam, not from the end.', 'Der Hebelarm der Gewichtskraft des Balkens wird von der Stütze bis zur Balkenmitte gemessen, nicht vom Ende.') },
    fields: (p) => (p.find === 'm' ? [{ key: 'm', sym: ['m'], unit: 'kg', dec: 2, what: L('mass of the load', 'Masse der Last') }]
      : [{ key: 'mb', sym: ['m', 'B'], unit: 'kg', dec: 2, what: L('mass of the beam', 'Masse des Balkens') }]),
    title: () => L('A heavy beam', 'Ein schwerer Balken'),
    text: (p) => (p.find === 'm'
      ? L(`A uniform beam ${cm(p.len)} long with a mass of ${kg(p.mb)} rests on a support ${cm(p.s)} from its left end. Which mass must hang at the left end so that the beam is balanced?`,
        `Ein gleichmässiger Balken von ${cm(p.len)} Länge und ${kg(p.mb)} Masse liegt ${cm(p.s)} von seinem linken Ende entfernt auf einer Stütze. Welche Masse muss am linken Ende hängen, damit der Balken im Gleichgewicht ist?`)
      : L(`A uniform beam ${cm(p.len)} long rests on a support ${cm(p.s)} from its left end. With a mass of ${kg(p.m)} hanging at its left end, it is balanced. What is the mass of the beam?`,
        `Ein gleichmässiger Balken von ${cm(p.len)} Länge liegt ${cm(p.s)} von seinem linken Ende entfernt auf einer Stütze. Hängt an seinem linken Ende eine Masse von ${kg(p.m)}, ist er im Gleichgewicht. Wie gross ist die Masse des Balkens?`)),
    figure(p, v, view = {}) {
      const B = beamPic(p.len, L('A beam on a support near its left end, with a load at that end', 'Ein Balken auf einer Stütze nahe seinem linken Ende, mit einer Last an diesem Ende')), P = B.P;
      const show = view.show || new Set();
      P.support(B.bottom(p.s));
      P.mass(B.bottom(0), 40, p.find === 'm' ? (view.task ? '?' : kg(v.m)) : kg(p.m), `load${p.find === 'm' ? ' unknown' : ''}`);
      P.text(B.bottom(p.len * 0.78), p.find === 'mb' ? (view.task ? `${svgSym('m', 'B')} = ?` : `${svgSym('m', 'B')} = ${kg(v.mb)}`) : `${svgSym('m', 'B')} = ${kg(p.mb)}`, 'lbl mass', 'middle', [0, 16]);
      P.dim(B.top(0), B.top(p.len), cm(p.len), 38);
      P.dim(B.top(0), B.top(p.s), cm(p.s), 14);
      if (show.has('G')) {
        P.dot(B.mid(p.len / 2), 'dot', 2.4);
        P.arrow(B.mid(p.len / 2), [0, -1], 50, 'force k-g hl', svgSym('G', 'B'), [8, 0]);
        P.dim(B.top(p.s), B.top(p.len / 2), L('arm', 'Arm'), 14, 'dimline hl');
      }
      return P.svg();
    },
    hints: () => [
      L('The beam’s own weight acts at its middle. It turns the beam the other way than the load.', 'Die Gewichtskraft des Balkens greift in seiner Mitte an. Sie dreht den Balken in die andere Richtung als die Last.'),
      L('Lever arms are measured from the support: the load’s is the distance from the support to the left end, the beam’s is the distance from the support to the middle.', 'Hebelarme werden von der Stütze aus gemessen: Der der Last ist der Abstand von der Stütze zum linken Ende, der des Balkens der Abstand von der Stütze zur Mitte.'),
      L('Balance: m g s = m_B g (ℓ/2 − s).', 'Gleichgewicht: m g s = m_B g (ℓ/2 − s).'),
    ],
    steps(p, v) {
      const arm = p.len / 2 - p.s;
      return [
        step(L('The beam’s weight', 'Die Gewichtskraft des Balkens'),
          `<p>${L(`The beam’s weight acts at its middle, ${cm(p.len / 2)} from the left end, so ${cm(arm)} to the right of the support. It turns the beam clockwise; the load at the left end turns it counterclockwise, with the lever arm ${cm(p.s)}.`, `Die Gewichtskraft des Balkens greift in seiner Mitte an, ${cm(p.len / 2)} vom linken Ende entfernt, also ${cm(arm)} rechts der Stütze. Sie dreht den Balken im Uhrzeigersinn; die Last am linken Ende dreht ihn im Gegenuhrzeigersinn, mit dem Hebelarm ${cm(p.s)}.`)}</p>`, ['G']),
        step(L('Balance of torques', 'Gleichgewicht der Drehmomente'), `$$m\\,g\\cdot s = m_\\mathrm{B}\\,g\\cdot\\left(\\tfrac{\\ell}{2} - s\\right)$$ ` +
          (p.find === 'm'
            ? `$$m = \\frac{m_\\mathrm{B}\\,(\\ell/2 - s)}{s} = \\frac{${tq(p.mb, 'kg')}\\cdot ${tq(arm, 'cm')}}{${tq(p.s, 'cm')}} = ${res(v.m, 'kg', 2)}$$`
            : `$$m_\\mathrm{B} = \\frac{m\\,s}{\\ell/2 - s} = \\frac{${tq(p.m, 'kg')}\\cdot ${tq(p.s, 'cm')}}{${tq(arm, 'cm')}} = ${res(v.mb, 'kg', 2)}$$`), ['G']),
      ];
    },
  };

  // The worksheet's beam b: a uniform beam (mass m) on an axis D, held level by a force F that
  // pulls at the angle α to the beam, at the distance b from D; the beam's middle is a from D.
  const angled = {
    id: 'angle', family: 'lever', difficulty: 4, calc: 'trig',
    make(r, o = {}) {
      const m = pick(r, [1, 2, 3, 4, 5]), len = pick(r, [40, 60, 80, 100, 120]);
      const a = pick(r, [5, 10, 15, 20, 25, 30].filter((x) => x <= len / 2 - 5)), b = pick(r, (o.pyth ? [10, 13, 15, 17, 20, 25, 26, 29, 30, 34, 39, 40, 50, 51, 52] : [10, 20, 30, 40, 50, 60]).filter((x) => x <= len / 2 + a && x > a));
      if (!a || !b) return null;
      const alpha = o.nice ? pick(r, [30, 90, 150]) : o.pyth ? pick(r, [...PYTH, ...PYTH.map((x) => 180 - x)]) : pick(r, [30, 40, 45, 50, 60, 70, 110, 120, 135, 150]);
      return { m, len, a, b, alpha };
    },
    solve(p, o = {}) {
      const s = o.cos ? Math.abs(Math.cos(rad(p.alpha))) : o.noAngle ? 1 : Math.sin(rad(p.alpha));
      return { F: exact((p.m * G * p.a) / (p.b * s)) };
    },
    traps: ['cos', 'noAngle'],
    why: {
      cos: () => L('Cosine instead of sine? Only the component of F perpendicular to the beam turns it.', 'Kosinus statt Sinus? Nur die Komponente von F senkrecht zum Balken dreht ihn.'),
      noAngle: () => L('F pulls at an angle: its lever arm is b · sin α, not b.', 'F zieht schräg: Ihr Hebelarm ist b · sin α, nicht b.'),
    },
    fields: () => [{ key: 'F', sym: ['F'], unit: 'N', dec: 1, what: L('force', 'Kraft') }],
    comps: (p) => [{ key: 'd', what: L('The lever arm of F about D:', 'Der Hebelarm von F bezüglich D:'), sym: 'd', base: 'b', baseVal: p.b, fn: 'sin', unit: '\\mathrm{cm}', fig: 'arm',
      why: {
        sc: L('The lever arm is the distance from D to the line of action of F; in the right triangle with the hypotenuse b, it lies opposite the angle α.', 'Der Hebelarm ist der Abstand von D zur Wirkungslinie von F; im rechtwinkligen Dreieck mit der Hypotenuse b liegt er dem Winkel α gegenüber.'),
        whole: L('b is the distance to the point where F acts, not to its line of action.', 'b ist der Abstand zum Angriffspunkt von F, nicht zu seiner Wirkungslinie.'),
      } }],
    title: () => L('Held at an angle', 'Schräg gehalten'),
    text: (p) => L(`A uniform beam with a mass of ${kg(p.m)} can turn about an axis through D. Its middle is ${cm(p.a)} to the left of D. A rope pulls on the beam ${cm(p.b)} to the left of D, at an angle of ${q(p.alpha, 'deg', 1)} to the beam, and holds it level. How large is the force F of the rope? Take g = 10 m/s².`,
      `Ein gleichmässiger Balken mit der Masse ${kg(p.m)} ist um eine Achse durch D drehbar. Seine Mitte liegt ${cm(p.a)} links von D. Ein Seil zieht ${cm(p.b)} links von D unter einem Winkel von ${q(p.alpha, 'deg', 1)} zum Balken am Balken und hält ihn waagrecht. Wie gross ist die Kraft F des Seils? Rechne mit g = 10 m/s².`),
    figure(p, v, view = {}) {
      const D = p.len / 2 + p.a; // the axis, from the left end
      const B = beamPic(p.len, L('A beam on an axis D, held by a force at an angle', 'Ein Balken auf einer Achse D, schräg gehalten von einer Kraft')), P = B.P;
      const show = view.show || new Set(), xF = D - p.b, c = p.len / 2;
      P.pivot(B.mid(D)); P.text(B.mid(D), 'D', 'lbl', 'start', [8, 12]);
      P.dot(B.mid(c), 'dot', 2.4);
      if (!show.has('G')) P.text(B.bottom(c), `m = ${kg(p.m)}`, 'lbl mass', 'middle', [0, 16]);
      // the force: from the point of application, at α to the beam, measured from the beam's
      // direction toward D (to the right) — the rope pulls up
      const dir = [Math.cos(rad(180 - p.alpha)), Math.sin(rad(180 - p.alpha))];
      P.arrow(B.mid(xF), dir, 70, `force k-s${show.has('perp') ? ' dim' : ''}`, view.task ? `${svgSym('F')} = ?` : svgSym('F'), [dir[0] * 10 - 4, -dir[1] * 10 - 4]);
      P.arc(B.mid(xF), 24, 180 - p.alpha, 180, q(p.alpha, 'deg', 1), 12);
      P.dim(B.top(xF), B.top(D), cm(p.b), 40);
      P.dim(B.top(c), B.top(D), cm(p.a), 16);
      if (show.has('G')) P.arrow(B.mid(c), [0, -1], 50, 'force k-g hl', svgSym('G'), [8, 0]);
      // the lever arm of F: from D perpendicular to the line of action (once identified)
      if (show.has('arm')) {
        const A = B.mid(xF), Dp = B.mid(D), t = (Dp[0] - A[0]) * dir[0] + (Dp[1] - A[1]) * dir[1], foot = [A[0] + t * dir[0], A[1] + t * dir[1]];
        const back = Math.min(0, t) - 20 / P.s, ahead = Math.max(0, t) + 20 / P.s;
        P.line([A[0] + back * dir[0], A[1] + back * dir[1]], [A[0] + ahead * dir[0], A[1] + ahead * dir[1]], 'action', true);
        P.line(Dp, foot, 'arm hl', true);
        P.dot(foot, 'dot small', 2);
        P.text([(Dp[0] + foot[0]) / 2, (Dp[1] + foot[1]) / 2], '<tspan font-style="italic">d</tspan>', 'lbl arm-lbl', 'start', [8, 4]);
      }
      if (show.has('perp')) {
        const s = Math.sin(rad(p.alpha));
        P.arrow(B.mid(xF), [0, 1], 70 * s, 'force k-s hl', `${svgSym('F')}<tspan class="sub" dy="4">⊥</tspan><tspan dy="-4">​</tspan>`, [-10, 0]);
      }
      return P.svg();
    },
    hints: (p) => [
      L('Two torques about D: the beam’s weight (at its middle) and the rope force. In balance they are equal.', 'Zwei Drehmomente bezüglich D: das der Gewichtskraft des Balkens (in seiner Mitte) und das der Seilkraft. Im Gleichgewicht sind sie gleich gross.'),
      L('Only the part of F perpendicular to the beam turns it: F⊥ = F · sin α. Equivalently, the lever arm of F is b · sin α.', 'Nur der Anteil von F senkrecht zum Balken dreht ihn: F⊥ = F · sin α. Gleichwertig: Der Hebelarm von F ist b · sin α.'),
      L(`Balance: m g · a = F · sin α · b, so F = m g a / (b sin α).${p.alpha === 90 ? '' : ''}`, 'Gleichgewicht: m g · a = F · sin α · b, also F = m g a / (b sin α).'),
    ],
    steps(p, v) {
      return [
        step(L('Torque of the weight', 'Drehmoment der Gewichtskraft'),
          `<p>${L(`The weight acts at the middle, ${cm(p.a)} from D, and turns the beam counterclockwise:`, `Die Gewichtskraft greift in der Mitte an, ${cm(p.a)} von D entfernt, und dreht den Balken im Gegenuhrzeigersinn:`)}</p>$$M_\\mathrm{G} = m\\,g\\,a = ${tq(p.m, 'kg')}\\cdot ${tq(G, 'N')}/\\mathrm{kg}\\cdot ${tq(p.a / 100, 'm')} = ${tq(p.m * G * p.a / 100, 'Nm')}$$`, ['G']),
        step(L('Torque of the rope', 'Drehmoment der Seilkraft'),
          `<p>${L('Only the component of F perpendicular to the beam turns it (the other pulls along the beam, through D):', 'Nur die Komponente von F senkrecht zum Balken dreht ihn (die andere zieht entlang des Balkens, durch D):')}</p>$$F_\\perp = F\\sin\\alpha,\\qquad M_F = F\\sin\\alpha\\cdot b$$<p>${L('It turns the beam clockwise.', 'Sie dreht den Balken im Uhrzeigersinn.')}</p>`, ['G', 'perp'], ['perp']),
        step(L('Balance', 'Gleichgewicht'),
          `$$F\\sin\\alpha\\cdot b = m\\,g\\,a\\;\\Rightarrow\\; F = \\frac{m\\,g\\,a}{b\\,\\sin\\alpha} = \\frac{${tq(p.m * G, 'N')}\\cdot ${tq(p.a, 'cm')}}{${tq(p.b, 'cm')}\\cdot\\sin${tq(p.alpha, 'deg', 1)}} = ${res(v.F, 'N', 1)}$$`, ['G', 'perp'], []),
      ];
    },
  };

  // ================================================================ hanging a beam
  // A uniform beam (mass m, length len) with a load F at its right end (and F1 at its left end):
  // where must it hang (x from the left end), and with which force F_H must it be held?
  function hangMake(r, two) {
    const len = pick(r, [20, 24, 30, 40, 50, 60, 80, 100]), m = pick(r, [0.5, 1, 1.5, 2, 3, 4, 5]);
    const F2 = pick(r, [5, 10, 15, 20, 25, 30, 40]), F1 = two ? pick(r, [5, 10, 15, 20, 30]) : 0;
    if (two && F1 === F2) return null;
    return two ? { len, m, F1, F2 } : { len, m, F2 };
  }
  const hangSolve = (p, o = {}) => {
    const W = o.noBeam ? 0 : p.m * G, F1 = p.F1 || 0;
    return { x: exact((W * p.len / 2 + p.F2 * p.len) / (W + F1 + p.F2)), H: exact(o.onlyLoads ? F1 + p.F2 : W + F1 + p.F2) };
  };
  function hangFigure(p, v, view = {}) {
    const B = beamPic(p.len, L('A beam with loads at its ends, to be hung up', 'Ein Balken mit Lasten an den Enden, der aufgehängt werden soll')), P = B.P;
    const show = view.show || new Set();
    if (!show.has('G')) P.text(B.bottom(p.len / 2), `m = ${kg(p.m)}`, 'lbl mass', 'middle', [0, 16]);
    P.dim(B.bottom(0), B.bottom(p.len), cm(p.len), -62);
    P.arrow(B.bottom(p.len), [0, -1], 46, 'force k-s', N(p.F2), [8, 2]);
    if (p.F1) P.arrow(B.bottom(0), [0, -1], 46, 'force k-s', N(p.F1), [-8, 2]);
    if (show.has('G')) { P.dot(B.mid(p.len / 2), 'dot', 2.4); P.arrow(B.mid(p.len / 2), [0, -1], 46, 'force k-g hl', svgSym('G'), [8, 6]); }
    if (!view.task) {
      P.line(B.top(v.x), [v.x, B.h + 44 / P.s], 'w rope', true);
      P.dot(B.top(v.x), 'dot', 2.4);
      if (show.has('H')) P.arrow(B.top(v.x), [0, 1], 46, 'force k-h hl', svgSym('H'), [8, 4]);
      P.dim(B.top(0), B.top(v.x), `${svgSym('x')} = ${cm(v.x)}`, 18, 'dimline hl');
    } else P.text(B.top(p.len * 0.4), `${svgSym('x')} = ?`, 'lbl', 'middle', [0, -22]);
    return P.svg();
  }
  function hang(id, difficulty, two) {
    return {
      id, family: 'hang', difficulty,
      make: (r) => hangMake(r, two),
      solve: hangSolve,
      traps: ['noBeam', 'onlyLoads'],
      why: {
        noBeam: () => L('The beam’s own weight is missing: it acts at the beam’s middle.', 'Die Gewichtskraft des Balkens fehlt: Sie greift in der Balkenmitte an.'),
        onlyLoads: () => L('The holding force carries everything: the loads and the beam itself.', 'Die Haltekraft trägt alles: die Lasten und den Balken selbst.'),
      },
      fields: () => [{ key: 'x', sym: ['x'], unit: 'cm', dec: 1, what: L('distance from the left end', 'Abstand vom linken Ende') }, { key: 'H', sym: ['H'], unit: 'N', dec: 1, what: L('holding force', 'Haltekraft') }],
      title: () => (two ? L('Loads at both ends', 'Lasten an beiden Enden') : L('Where to hang the beam?', 'Wo aufhängen?')),
      text: (p) => (two
        ? L(`A uniform beam ${cm(p.len)} long with a mass of ${kg(p.m)} carries a load of ${N(p.F1)} at its left end and one of ${N(p.F2)} at its right end. At which distance from the left end must it be hung up so that it stays level? How large is the force with which it must be held? Take g = 10 m/s².`,
          `Ein gleichmässiger Balken von ${cm(p.len)} Länge und ${kg(p.m)} Masse trägt an seinem linken Ende eine Last von ${N(p.F1)} und an seinem rechten eine von ${N(p.F2)}. In welchem Abstand vom linken Ende muss er aufgehängt werden, damit er waagrecht bleibt? Wie gross ist die Kraft, mit der er gehalten werden muss? Rechne mit g = 10 m/s².`)
        : L(`A uniform beam ${cm(p.len)} long with a mass of ${kg(p.m)} carries a load of ${N(p.F2)} at its right end. At which distance from the left end must it be hung up so that it stays level? How large is the force with which it must be held? Take g = 10 m/s².`,
          `Ein gleichmässiger Balken von ${cm(p.len)} Länge und ${kg(p.m)} Masse trägt an seinem rechten Ende eine Last von ${N(p.F2)}. In welchem Abstand vom linken Ende muss er aufgehängt werden, damit er waagrecht bleibt? Wie gross ist die Kraft, mit der er gehalten werden muss? Rechne mit g = 10 m/s².`)),
      figure: hangFigure,
      hints: () => [
        L('Two conditions: the forces balance (the holding force carries everything), and the torques balance about the suspension point.', 'Zwei Bedingungen: Die Kräfte heben sich auf (die Haltekraft trägt alles), und die Drehmomente bezüglich des Aufhängepunkts heben sich auf.'),
        L('The beam’s weight m g acts at its middle. Choose the left end as the axis: the holding force F_H at x balances the torques of the weight and the loads.', 'Die Gewichtskraft m g des Balkens greift in seiner Mitte an. Wähle das linke Ende als Drehachse: Die Haltekraft F_H bei x hält den Drehmomenten der Gewichtskraft und der Lasten das Gleichgewicht.'),
        L('About the left end: F_H · x = m g · ℓ/2 + F · ℓ. Solve for x.', 'Bezüglich des linken Endes: F_H · x = m g · ℓ/2 + F · ℓ. Nach x auflösen.'),
      ],
      steps(p, v) {
        const W = p.m * G;
        const sumF = two ? `${tq(W, 'N')} + ${tq(p.F1, 'N')} + ${tq(p.F2, 'N')}` : `${tq(W, 'N')} + ${tq(p.F2, 'N')}`;
        return [
          step(L('Holding force', 'Haltekraft'),
            `<p>${L('The beam stays at rest, so the holding force carries the beam’s weight and the loads:', 'Der Balken bleibt in Ruhe, also trägt die Haltekraft die Gewichtskraft des Balkens und die Lasten:')}</p>` +
            `$$${T('H')} = m\\,g + ${two ? 'F_1 + F_2' : 'F'} = ${sumF} = ${res(v.H, 'N', 1)}$$`, ['G', 'H'], ['H']),
          step(L('Torques about the left end', 'Drehmomente bezüglich des linken Endes'),
            `<p>${L('Any point can serve as the axis when nothing turns. About the left end, the left load has no lever arm; the holding force turns the beam one way, the weight (at the middle) and the right load the other way:', 'Dreht sich nichts, kann jeder Punkt als Drehachse dienen. Bezüglich des linken Endes hat die linke Last keinen Hebelarm; die Haltekraft dreht den Balken in die eine Richtung, die Gewichtskraft (in der Mitte) und die rechte Last in die andere:')}</p>` +
            `$$${T('H')}\\cdot x = m\\,g\\cdot\\frac{\\ell}{2} + ${two ? 'F_2' : 'F'}\\cdot \\ell$$`, ['G', 'H'], ['G']),
          step(L('Position', 'Position'),
            `$$x = \\frac{m\\,g\\,\\ell/2 + ${two ? 'F_2' : 'F'}\\,\\ell}{${T('H')}} = \\frac{${tq(W, 'N')}\\cdot ${tq(p.len / 2, 'cm')} + ${tq(p.F2, 'N')}\\cdot ${tq(p.len, 'cm')}}{${tq(v.H, 'N')}} = ${res(v.x, 'cm', 1)}$$` +
            `<p>${L('The beam hangs closer to the heavier end.', 'Der Balken hängt näher am schwereren Ende.')}</p>`, ['G', 'H'], ['H']),
        ];
      },
    };
  }

  // ================================================================ centre of mass of wire figures
  // A figure of thin wire of the same kind throughout: the mass of each part is proportional to its
  // length, and each part's own centre of mass is its middle (a ring: its centre). The centre of
  // mass is the length-weighted mean: x_S = Σ ℓ_i x_i / Σ ℓ_i. Coordinates in cm from the
  // origin O, x to the right and y up.
  // A part: { kind: 'seg', a, b } or { kind: 'ring', c, r }.
  // a part: a straight piece { kind: 'seg', a, b }, a ring { kind: 'ring', c, r } or a square
  // { kind: 'square', c, s } (its four sides as one part: opposite sides meet in the middle, so its
  // centre of mass is its centre)
  const lengthOf = (pt) => (pt.kind === 'seg' ? Math.hypot(pt.b[0] - pt.a[0], pt.b[1] - pt.a[1]) : pt.kind === 'square' ? 4 * pt.s : 2 * Math.PI * pt.r);
  const centreOf = (pt) => (pt.kind === 'seg' ? [(pt.a[0] + pt.b[0]) / 2, (pt.a[1] + pt.b[1]) / 2] : pt.c);
  function comOf(parts, o = {}) {
    const w = parts.map((pt) => (o.count ? 1 : o.diam && pt.kind === 'ring' ? 2 * pt.r : lengthOf(pt)));
    const W = w.reduce((s, x) => s + x, 0);
    return [0, 1].map((k) => exact(parts.reduce((s, pt, i) => s + w[i] * centreOf(pt)[k], 0) / W));
  }

  const seg = (a, b) => ({ kind: 'seg', a, b });
  // a right triangle with whole sides [base, height, slant], in either orientation, scaled so that
  // the slant is at most max (cm); with div, the base and height are multiples of div
  function triangle(r, max, div = 1) {
    const list = [];
    for (const [x, y, z] of TRIANGLES) for (const k of [1, 2, 3, 4]) if (k * z <= max) for (const [b, h] of [[x, y], [y, x]]) if ((k * b) % div === 0 && (k * h) % div === 0) list.push([k * b, k * h, k * z]);
    return pick(r, list);
  }
  // two sides of different lengths: with equal ones, weighting by length would make no difference
  const differ = (p) => (p.h === p.b ? null : p);
  // Step by step, as in class: combine two parts (or groups) at a time. Their common centre lies on
  // the line between their centres, closer to the heavier one: m_A a_A = m_B a_B, where a_A, a_B are
  // the distances from the common centre to each, and a_A + a_B = D. Two parts of equal mass are
  // combined first (they meet in their middle). Masses are the lengths (proportional to them).
  // Gives [{ A, B, D, aA, aB, S }] with A, B, S = { m, c, name } (name: the parts' numbers, '' for
  // the whole figure).
  function combos(parts) {
    const dirOf = (pt) => { if (pt.kind !== 'seg') return null; const d = [pt.b[0] - pt.a[0], pt.b[1] - pt.a[1]], n = Math.hypot(...d); return [d[0] / n, d[1] / n]; };
    let items = parts.map((pt, i) => ({ m: lengthOf(pt), c: centreOf(pt), name: `${i + 1}`, dir: dirOf(pt) }));
    const out = [];
    while (items.length > 1) {
      // the pair to combine: equal masses first, then a pair whose distance and common centre
      // come out in round numbers, else the first two
      const tenth = (x) => Math.abs(10 * x - Math.round(10 * x)) < 1e-9;
      let best = null;
      for (let a = 0; a < items.length; a++) {
        for (let b = a + 1; b < items.length; b++) {
          const A = items[a], B = items[b], M = A.m + B.m, D = Math.hypot(B.c[0] - A.c[0], B.c[1] - A.c[1]);
          const c = [A.c[0] + ((B.c[0] - A.c[0]) * B.m) / M, A.c[1] + ((B.c[1] - A.c[1]) * B.m) / M];
          const parallel = A.dir && B.dir && Math.abs(Math.abs(A.dir[0] * B.dir[0] + A.dir[1] * B.dir[1]) - 1) < 1e-9;
          // centres at the same point first, then mirror images (equal, parallel, the farthest apart),
          // then equal masses, then round numbers
          const score = D < 1e-9 ? 4 : Math.abs(A.m - B.m) < 1e-9 ? (parallel ? 3 + D / 1e4 : 2) : tenth(D) && c.every(tenth) ? 1 : 0;
          if (!best || score > best.score) best = { score, a, b };
        }
      }
      const i = best.a, j = best.b;
      const A = items[i], B = items[j], M = A.m + B.m, D = Math.hypot(B.c[0] - A.c[0], B.c[1] - A.c[1]);
      const S = { m: M, c: [A.c[0] + ((B.c[0] - A.c[0]) * B.m) / M, A.c[1] + ((B.c[1] - A.c[1]) * B.m) / M], name: items.length === 2 ? '' : [...(A.name + B.name)].sort().join('') };
      out.push({ A, B, D, aA: (D * B.m) / M, aB: (D * A.m) / M, S });
      items = [S, ...items.filter((x, k) => k !== i && k !== j)];
    }
    return out;
  }

  const SHAPES = {
    // the worksheet's a): a vertical side and a top bar to the right, as Γ
    L: { difficulty: 2, make: (r) => differ({ h: pick(r, [6, 8, 10, 12, 16, 20]), b: pick(r, [4, 6, 8, 10, 12]) }),
      parts: (p) => [{ kind: 'seg', a: [0, 0], b: [0, p.h], name: 'a' }, { kind: 'seg', a: [0, p.h], b: [p.b, p.h], name: 'b' }],
      title: () => L('An angle of wire', 'Ein Drahtwinkel'), ask: ['x', 'y'], offWire: true },
    U: { difficulty: 3, make: (r) => differ({ h: pick(r, [6, 8, 10, 12, 16]), b: pick(r, [6, 8, 10, 12, 16]) }),
      parts: (p) => [{ kind: 'seg', a: [0, 0], b: [0, p.h] }, { kind: 'seg', a: [0, p.h], b: [p.b, p.h] }, { kind: 'seg', a: [p.b, p.h], b: [p.b, 0] }],
      title: () => L('A gate of wire', 'Ein Drahttor'), ask: ['x', 'y'], offWire: true },
    T: { difficulty: 2, make: (r) => differ({ h: pick(r, [6, 8, 10, 12, 16]), b: pick(r, [6, 8, 10, 12, 16]) }),
      parts: (p) => [{ kind: 'seg', a: [0, p.h], b: [p.b, p.h] }, { kind: 'seg', a: [p.b / 2, 0], b: [p.b / 2, p.h] }],
      title: () => L('A T of wire', 'Ein T aus Draht'), ask: ['x', 'y'] },
    tri: { difficulty: 3, make: (r) => ({ k: pick(r, [1, 2, 3, 4]), t: pick(r, [[3, 4, 5], [4, 3, 5]]) }),
      // a right triangle with the right angle at the bottom right, legs (base, height) and hypotenuse
      parts: (p) => { const [bx, hy] = [p.t[1] * p.k, p.t[0] * p.k]; return [{ kind: 'seg', a: [0, 0], b: [bx, 0] }, { kind: 'seg', a: [bx, 0], b: [bx, hy] }, { kind: 'seg', a: [bx, hy], b: [0, 0] }]; },
      title: () => L('A triangle of wire', 'Ein Drahtdreieck'), ask: ['x', 'y'], offWire: true },
    // E: a vertical bar and three equal bars to the right, at the bottom, middle and top
    E: { difficulty: 3, make: (r) => ({ a: pick(r, [4, 5, 6, 8, 10]), b: pick(r, [4, 6, 8, 10, 12]) }),
      parts: (p) => [seg([0, 0], [0, 2 * p.a]), seg([0, 0], [p.b, 0]), seg([0, p.a], [p.b, p.a]), seg([0, 2 * p.a], [p.b, 2 * p.a])],
      title: () => L('An E of wire', 'Ein E aus Draht'), ask: ['x', 'y'] },
    // an isosceles triangle: base 2b, slanted sides c, height h (b, h, c a right triangle)
    iso: { difficulty: 3, make: (r) => { const [b, h, c] = triangle(r, 17); return { b, h, c }; },
      parts: (p) => [seg([0, 0], [2 * p.b, 0]), seg([0, 0], [p.b, p.h]), seg([2 * p.b, 0], [p.b, p.h])],
      title: () => L('A gable of wire', 'Ein Giebel aus Draht'), ask: ['x', 'y'], offWire: true },
    // a house: floor 2b, walls w, a gable roof (b, h, c a right triangle)
    house: { difficulty: 4, make: (r) => { const [b, h, c] = triangle(r, 12); return { b, h, c, w: pick(r, [4, 6, 8, 10, 12]) }; },
      parts: (p) => [seg([0, 0], [2 * p.b, 0]), seg([0, 0], [0, p.w]), seg([2 * p.b, 0], [2 * p.b, p.w]), seg([0, p.w], [p.b, p.w + p.h]), seg([2 * p.b, p.w], [p.b, p.w + p.h])],
      title: () => L('A house of wire', 'Ein Haus aus Draht'), ask: ['x', 'y'], offWire: true },
    // a square on a stick: the origin at the foot of the stick
    sqstick: { difficulty: 4, make: (r) => ({ h: pick(r, [6, 8, 10, 12, 15, 16, 20]), s: pick(r, [2, 3, 4, 5, 6, 8]) }),
      parts: (p) => [seg([0, 0], [0, p.h]), { kind: 'square', c: [0, p.h + p.s / 2], s: p.s }],
      title: () => L('A square on a stick', 'Ein Quadrat auf einem Stab'), ask: ['y'] },
    // an isosceles triangle on a stick (b, t, c a right triangle), apex up
    tristick: { difficulty: 4, make: (r) => { const [b, t, c] = triangle(r, 10); return { h: pick(r, [6, 8, 10, 12, 15, 16, 20]), b, t, c }; },
      parts: (p) => [seg([0, 0], [0, p.h]), seg([-p.b, p.h], [p.b, p.h]), seg([-p.b, p.h], [0, p.h + p.t]), seg([p.b, p.h], [0, p.h + p.t])],
      title: () => L('A triangle on a stick', 'Ein Dreieck auf einem Stab'), ask: ['y'] },
    // a dumbbell: two squares of different sizes joined by a bar; the origin at the left end
    bell: { difficulty: 5, make: (r) => { const s1 = pick(r, [2, 3, 4, 5]), s2 = s1 + pick(r, [1, 2, 3, 4]); return { s1, s2, c: pick(r, [4, 5, 6, 8, 10, 12]) }; },
      parts: (p) => [{ kind: 'square', c: [p.s1 / 2, 0], s: p.s1 }, seg([p.s1, 0], [p.s1 + p.c, 0]), { kind: 'square', c: [p.s1 + p.c + p.s2 / 2, 0], s: p.s2 }],
      title: () => L('A dumbbell of wire', 'Eine Hantel aus Draht'), ask: ['x'] },
  };

  function comFigure(shape, p, v, view = {}) {
    const S = SHAPES[shape], parts = S.parts(p), show = view.show || new Set();
    const half = (pt) => (pt.kind === 'square' ? pt.s / 2 : pt.r);
    const ext = parts.flatMap((pt) => (pt.kind === 'seg' ? [pt.a, pt.b] : [[pt.c[0] - half(pt), pt.c[1] - half(pt)], [pt.c[0] + half(pt), pt.c[1] + half(pt)]]));
    const W = Math.max(...ext.map((e) => e[0])) - Math.min(...ext.map((e) => e[0])), H = Math.max(...ext.map((e) => e[1])) - Math.min(...ext.map((e) => e[1]));
    const P = new Pic(Math.min(230 / Math.max(W, H, 1), 26), L('A figure of wire with the origin O', 'Eine Figur aus Draht mit dem Ursprung O'));
    const s = P.s, xMin = Math.min(...ext.map((e) => e[0])), yMin = Math.min(...ext.map((e) => e[1]));
    // the axes from O
    P.arrow([Math.min(0, xMin) - 12 / s, 0], [1, 0], (Math.max(...ext.map((e) => e[0])) - Math.min(0, xMin)) * s + 40, 'axis', svgSym('x'), [4, 12]);
    P.arrow([0, Math.min(0, yMin) - 12 / s], [0, 1], (Math.max(...ext.map((e) => e[1])) - Math.min(0, yMin)) * s + 40, 'axis', svgSym('y'), [-12, 2]);
    parts.forEach((pt, i) => {
      const cls = `wire${show.has(`part${i}`) ? ' hl' : ''}`;
      if (pt.kind === 'seg') P.path([pt.a, pt.b], cls);
      else if (pt.kind === 'square') { const q = pt.s / 2, [x, y] = pt.c; P.path([[x - q, y - q], [x + q, y - q], [x + q, y + q], [x - q, y + q], [x - q, y - q]], cls); } else P.circle(pt.c, pt.r, cls);
    });
    // dimensions: each length once, next to a side of that length, outside the figure (away from
    // its middle); the rings' radii
    const cx = (Math.max(...ext.map((e) => e[0])) + xMin) / 2, cy = (Math.max(...ext.map((e) => e[1])) + yMin) / 2, labelled = new Set();
    // the side of a straight piece away from the middle of the figure (for its length); its centre's
    // label goes on the other side
    const outward = (pt) => {
      const len = lengthOf(pt), m = centreOf(pt);
      let n = [-(pt.b[1] - pt.a[1]) / len, (pt.b[0] - pt.a[0]) / len];
      const dot = n[0] * (m[0] - cx) + n[1] * (m[1] - cy);
      if (dot < -1e-9 || (Math.abs(dot) <= 1e-9 && (n[0] < -1e-9 || (Math.abs(n[0]) <= 1e-9 && n[1] < 0)))) n = [-n[0], -n[1]];
      return n;
    };
    parts.forEach((pt) => {
      if (pt.kind === 'square') { P.text([pt.c[0], pt.c[1] + pt.s / 2], cm(pt.s), 'lbl small dimtext', 'middle', [0, -12]); return; }
      if (pt.kind === 'seg') {
        // each length once per direction (the bars of an E, the walls of a house: one label)
        const len = lengthOf(pt), mid = centreOf(pt), d0 = [(pt.b[0] - pt.a[0]) / len, (pt.b[1] - pt.a[1]) / len];
        const tag = `${num(len, 2)}:${num(Math.abs(d0[0]), 2)}:${num(d0[0] * d0[1] >= 0 ? 1 : -1, 0)}`;
        if (labelled.has(tag)) return;
        labelled.add(tag);
        const n = outward(pt), off = [14 * n[0], -14 * n[1]];
        P.text(mid, cm(len), 'lbl small dimtext', Math.abs(off[0]) < 5 ? 'middle' : off[0] > 0 ? 'start' : 'end', [off[0], off[1] + (off[1] > 0 ? 2 : 0)]);
      } else {
        P.line(pt.c, [pt.c[0] + pt.r * Math.cos(rad(45)), pt.c[1] + pt.r * Math.sin(rad(45))], 'w thin', true);
        P.dot(pt.c, 'dot', 1.8);
        P.text([pt.c[0] + pt.r * 0.35, pt.c[1] + pt.r * 0.35], `r = ${cm(pt.r)}`, 'lbl small dimtext', 'end', [-2, -6]);
      }
    });
    P.dot([0, 0], 'dot', 2.4);
    P.text([0, 0], 'O', 'lbl', 'end', [-6, 12]);
    const sName = (n) => `S<tspan class="sub" dy="4">${n}</tspan><tspan dy="-4">\u200b</tspan>`;
    if (show.has('mids')) {
      parts.forEach((pt, i) => {
        const n = pt.kind === 'seg' ? outward(pt) : [0.7, -0.7], off = [-12 * n[0], 12 * n[1] + 4];
        P.dot(centreOf(pt), `dot mid${show.has(`part${i}`) ? ' hl' : ''}`, 3);
        P.text(centreOf(pt), sName(i + 1), 'lbl small com-lbl', Math.abs(off[0]) < 4 ? 'middle' : off[0] > 0 ? 'start' : 'end', off);
      });
    }
    combos(parts).forEach((k, i) => {
      if (!show.has(`comb${i}`)) return;
      P.line(k.A.c, k.B.c, `join${view.hl && view.hl.has(`comb${i}`) ? ' hl' : ''}`, true);
      if (k.S.name) { P.dot(k.S.c, 'dot mid', 3.4); P.text(k.S.c, sName(k.S.name), 'lbl small com-lbl', 'end', [-6, -9]); }
    });
    if (show.has('S')) P.com(v.S, 'S');
    return P.svg();
  }

  function com(shape) {
    const S = SHAPES[shape];
    const fieldsOf = () => S.ask.map((k) => ({ key: k, sym: [k === 'x' ? 'xS' : 'yS'], unit: 'cm', dec: 1, what: L('centre of mass', 'Schwerpunkt') }));
    return {
      id: `com-${shape}`, family: 'com', difficulty: S.difficulty, calc: S.calc,
      make: (r) => S.make(r),
      solve(p, o = {}) { const c = comOf(S.parts(p), o); return { x: c[0], y: c[1], S: c }; },
      traps: S.calc ? ['count', 'diam'] : ['count'],
      // a ring's wire is as long as its circumference: identified first, the app gives its length
      comps: (p) => S.parts(p).map((pt, i) => [pt, i]).filter(([pt]) => pt.kind === 'ring').map(([pt, i]) => ({
        key: `ring${i}`, what: L(`The length of the wire of the ring with r = ${cm(pt.r)}:`, `Die Länge des Drahts des Rings mit r = ${cm(pt.r)}:`),
        options: [
          { html: '$2\\pi r$', right: true },
          { html: '$\\pi r$', why: L('That is half the circumference.', 'Das ist der halbe Umfang.') },
          { html: '$2r$', why: L('That is the diameter: the wire runs all the way round.', 'Das ist der Durchmesser: Der Draht läuft ganz herum.') },
          { html: '$\\pi r^2$', why: L('That is the area of the disc, not a length.', 'Das ist die Fläche der Scheibe, keine Länge.') },
        ],
        value: `$\\ell = 2\\pi r = 2\\pi\\cdot ${tq(pt.r, 'cm')} \\approx ${tq(lengthOf(pt), 'cm', 1)}$`,
      })),
      why: {
        count: () => L('Each part counts with its mass, which is proportional to its length, not each part the same.', 'Jedes Teil zählt mit seiner Masse, und die ist proportional zu seiner Länge; nicht jedes Teil gleich viel.'),
        diam: () => L('A ring’s wire is as long as its circumference, 2πr.', 'Der Draht eines Rings ist so lang wie sein Umfang, 2πr.'),
      },
      fields: fieldsOf,
      title: () => S.title(),
      text: () => L(`A figure is bent from one piece of uniform wire. Find its centre of mass S: its coordinates in the system drawn, with the origin O.${S.ask.length === 1 ? ` (By symmetry, ${S.ask[0] === 'x' ? 'y' : 'x'}<sub>S</sub> = 0.)` : ''}`,
        `Eine Figur ist aus einem gleichmässigen Draht gebogen. Bestimme ihren Schwerpunkt S: seine Koordinaten im eingezeichneten System mit dem Ursprung O.${S.ask.length === 1 ? ` (Aus Symmetriegründen ist ${S.ask[0] === 'x' ? 'y' : 'x'}<sub>S</sub> = 0.)` : ''}`),
      figure: (p, v, view) => comFigure(shape, p, v, view),
      hints: (p) => { const hasSquare = S.parts(p).some((pt) => pt.kind === 'square'); return [
        hasSquare ? L('Split the figure into simple parts: straight pieces and squares. The mass of each part is proportional to its length (a square: its four sides).', 'Zerlege die Figur in einfache Teile: gerade Stücke und Quadrate. Die Masse jedes Teils ist proportional zu seiner Länge (beim Quadrat: seine vier Seiten).')
          : L('Split the figure into simple parts: its straight pieces. The mass of each part is proportional to its length.', 'Zerlege die Figur in einfache Teile: ihre geraden Stücke. Die Masse jedes Teils ist proportional zu seiner Länge.'),
        hasSquare ? L('Find the centre of mass of each part: the middle of a straight piece, the centre of a square (its opposite sides meet in the middle).', 'Bestimme den Schwerpunkt jedes Teils: die Mitte eines geraden Stücks, den Mittelpunkt eines Quadrats (seine gegenüberliegenden Seiten treffen sich in der Mitte).')
          : L('Find the centre of mass of each part: the middle of each straight piece.', 'Bestimme den Schwerpunkt jedes Teils: die Mitte jedes geraden Stücks.'),
        L('Combine the parts two at a time. The common centre of mass lies on the line between their centres, closer to the heavier part: m₁ · a₁ = m₂ · a₂, where a₁ and a₂ are its distances from the two centres. Then combine the result with the next part.',
          'Fasse die Teile schrittweise zu zweit zusammen. Der gemeinsame Schwerpunkt liegt auf der Verbindungslinie ihrer Schwerpunkte, näher beim schwereren Teil: m₁ · a₁ = m₂ · a₂, wobei a₁ und a₂ seine Abstände von den beiden Schwerpunkten sind. Fasse das Ergebnis dann mit dem nächsten Teil zusammen.'),
      ]; },
      steps(p, v) {
        const parts = S.parts(p), lens = parts.map(lengthOf), cs = parts.map(centreOf), total = lens.reduce((a, b) => a + b, 0);
        const lenTex = (pt) => (pt.kind === 'ring' ? `2\\pi\\cdot ${tq(pt.r, 'cm')} = ${tq(lengthOf(pt), 'cm', 1)}` : pt.kind === 'square' ? `4\\cdot ${tq(pt.s, 'cm')} = ${tq(lengthOf(pt), 'cm')}` : tq(lengthOf(pt), 'cm'));
        const pt$ = (c) => `(${num(c[0], 1)}\\,|\\,${num(c[1], 1)})`;
        const rows = parts.map((pt, i) => `<li>${pt.kind === 'ring' ? L('ring', 'Ring') : pt.kind === 'square' ? L('square (its centre: opposite sides meet in the middle)', 'Quadrat (sein Mittelpunkt: gegenüberliegende Seiten treffen sich in der Mitte)') : L('straight piece', 'gerades Stück')} ${i + 1}: ${L('length', 'Länge')} $${lenTex(pt)}$, ${L('centre of mass', 'Schwerpunkt')} $S_${i + 1} = ${pt$(cs[i])}$</li>`).join('');
        void lens; void total;
        const out = [step(L('1 · Split into parts', '1 · In Teile zerlegen'),
          `<p>${(parts.some((pt) => pt.kind === 'square') ? L('The figure consists of these parts. Each part’s mass is proportional to its length, so the lengths can stand for the masses. A straight piece has its centre of mass in its middle, a square in its centre:', 'Die Figur besteht aus diesen Teilen. Die Masse jedes Teils ist proportional zu seiner Länge, also können die Längen für die Massen stehen. Ein gerades Stück hat seinen Schwerpunkt in seiner Mitte, ein Quadrat in seinem Mittelpunkt:') : L('The figure consists of these parts. Each part’s mass is proportional to its length, so the lengths can stand for the masses. A straight piece has its centre of mass in its middle:', 'Die Figur besteht aus diesen Teilen. Die Masse jedes Teils ist proportional zu seiner Länge, also können die Längen für die Massen stehen. Ein gerades Stück hat seinen Schwerpunkt in seiner Mitte:'))}</p><ul>${rows}</ul>`,
          ['mids', ...parts.map((x, i) => `part${i}`)], ['mids'])];
        const ks = combos(parts), sTex = (n) => (n ? `S_{${n}}` : 'S'), mTex = (n) => `m_{${n}}`;
        ks.forEach((k, i) => {
          const A = k.A.name, B = k.B.name, equal = Math.abs(k.A.m - k.B.m) < 1e-9;
          const shown = ['mids', ...ks.slice(0, i + 1).map((x, j) => `comb${j}`), ...(k.S.name ? [] : ['S'])];
          const where = `$${sTex(k.S.name)} = ${k.S.name ? pt$(k.S.c) : `(${res(k.S.c[0], 'cm', 1)}\\,|\\,${res(k.S.c[1], 'cm', 1)})`}$`;
          const straight = Math.abs(k.A.c[0] - k.B.c[0]) < 1e-9 || Math.abs(k.A.c[1] - k.B.c[1]) < 1e-9;
          const f = k.B.m / (k.A.m + k.B.m), dx = k.B.c[0] - k.A.c[0], dy = k.B.c[1] - k.A.c[1];
          // an oblique line: the lever rule divides its horizontal and vertical extents alike
          const oblique = L(`The masses at $${sTex(A)}$ and $${sTex(B)}$ are in the ratio of the lengths, $${mTex(A)} : ${mTex(B)} = ${num(k.A.m, 1)} : ${num(k.B.m, 1)}$. Their common centre of mass lies on the line between them, closer to the heavier part, with $${mTex(A)}\\cdot a_{${A}} = ${mTex(B)}\\cdot a_{${B}}$: it is the fraction $\\frac{${mTex(B)}}{${mTex(A)} + ${mTex(B)}} = \\frac{${num(k.B.m, 1)}}{${num(k.A.m + k.B.m, 1)}}$ of the way from $${sTex(A)}$ to $${sTex(B)}$. The line runs ${q(Math.abs(dx), 'cm', 1)} ${dx > 0 ? 'to the right' : 'to the left'} and ${q(Math.abs(dy), 'cm', 1)} ${dy > 0 ? 'up' : 'down'}; both are divided in the same ratio:`,
            `Die Massen in $${sTex(A)}$ und $${sTex(B)}$ stehen im Verhältnis der Längen, $${mTex(A)} : ${mTex(B)} = ${num(k.A.m, 1)} : ${num(k.B.m, 1)}$. Ihr gemeinsamer Schwerpunkt liegt auf ihrer Verbindungslinie, näher beim schwereren Teil, mit $${mTex(A)}\\cdot a_{${A}} = ${mTex(B)}\\cdot a_{${B}}$: Er liegt beim Bruchteil $\\frac{${mTex(B)}}{${mTex(A)} + ${mTex(B)}} = \\frac{${num(k.B.m, 1)}}{${num(k.A.m + k.B.m, 1)}}$ des Wegs von $${sTex(A)}$ nach $${sTex(B)}$. Die Linie verläuft ${q(Math.abs(dx), 'cm', 1)} nach ${dx > 0 ? 'rechts' : 'links'} und ${q(Math.abs(dy), 'cm', 1)} nach ${dy > 0 ? 'oben' : 'unten'}; beides wird im gleichen Verhältnis geteilt:`) +
            `$$\\Delta x = ${tq(dx, 'cm', 1)}\\cdot\\frac{${num(k.B.m, 1)}}{${num(k.A.m + k.B.m, 1)}} = ${tq(dx * f, 'cm', 2)},\\qquad \\Delta y = ${tq(dy, 'cm', 1)}\\cdot\\frac{${num(k.B.m, 1)}}{${num(k.A.m + k.B.m, 1)}} = ${tq(dy * f, 'cm', 2)}$$` +
            L(`from $${sTex(A)}$: `, `von $${sTex(A)}$ aus: `);
          const body = k.D < 1e-9
            ? L(`$${sTex(A)}$ and $${sTex(B)}$ are at the same point, so their common centre of mass is there too: ${where}.`,
              `$${sTex(A)}$ und $${sTex(B)}$ liegen im selben Punkt, also liegt auch ihr gemeinsamer Schwerpunkt dort: ${where}.`)
            : equal
            ? L(`$${sTex(A)}$ and $${sTex(B)}$ belong to parts of equal mass, so their common centre of mass lies in the middle between them: ${where}.`,
              `$${sTex(A)}$ und $${sTex(B)}$ gehören zu Teilen gleicher Masse, also liegt ihr gemeinsamer Schwerpunkt in der Mitte dazwischen: ${where}.`)
            : !straight ? `${oblique}${where}.` : L(`The masses at $${sTex(A)}$ and $${sTex(B)}$ are in the ratio of the lengths, $${mTex(A)} : ${mTex(B)} = ${num(k.A.m, 1)} : ${num(k.B.m, 1)}$. Their common centre of mass lies on the line between them, ${q(k.D, 'cm', 2)} long, closer to the heavier part:`,
              `Die Massen in $${sTex(A)}$ und $${sTex(B)}$ stehen im Verhältnis der Längen, $${mTex(A)} : ${mTex(B)} = ${num(k.A.m, 1)} : ${num(k.B.m, 1)}$. Ihr gemeinsamer Schwerpunkt liegt auf ihrer Verbindungslinie, die ${q(k.D, 'cm', 2)} lang ist, näher beim schwereren Teil:`) +
              `$$${mTex(A)}\\cdot a_{${A}} = ${mTex(B)}\\cdot a_{${B}},\\quad a_{${A}} + a_{${B}} = ${tq(k.D, 'cm', 2)}$$ ` +
              `$$a_{${A}} = ${tq(k.D, 'cm', 2)}\\cdot\\frac{${mTex(B)}}{${mTex(A)} + ${mTex(B)}} = ${tq(k.D, 'cm', 2)}\\cdot\\frac{${num(k.B.m, 1)}}{${num(k.A.m + k.B.m, 1)}} = ${tq(k.aA, 'cm', 2)}$$` +
              L(`from $${sTex(A)}$ toward $${sTex(B)}$: ${where}.`, `von $${sTex(A)}$ aus in Richtung $${sTex(B)}$: ${where}.`);
          const more = k.S.name ? L(` Together they count as one part at $${sTex(k.S.name)}$, with the mass $${mTex(k.S.name)} = ${mTex(A)} + ${mTex(B)}$ (length ${q(k.S.m, 'cm', 1)}).`, ` Zusammen zählen sie als ein Teil in $${sTex(k.S.name)}$ mit der Masse $${mTex(k.S.name)} = ${mTex(A)} + ${mTex(B)}$ (Länge ${q(k.S.m, 'cm', 1)}).`)
            : S.offWire ? `</p><p>${L('S need not lie on the wire.', 'S muss nicht auf dem Draht liegen.')}` : '';
          out.push(step(L(`${i + 2} · Combine ${sTex(A).replace(/[{}]/g, '')} and ${sTex(B).replace(/[{}]/g, '')}`, `${i + 2} · ${sTex(A).replace(/[{}]/g, '')} und ${sTex(B).replace(/[{}]/g, '')} zusammenfassen`).replace(/S_(\d+)/g, (x, n) => `S${n.replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[d])}`),
            `<p>${body}${more}</p>`, shown, [`comb${i}`, ...(k.S.name ? [] : ['S'])]));
        });
        return out;
      },
    };
  }

  const SCENARIOS = [
    plate('plate-axis', 2, 3, false),
    plate('plate', 4, 4, true),
    seesaw,
    lever3,
    beamWeight,
    angled,
    hang('hang', 3, false),
    hang('hang2', 4, true),
    com('L'), com('T'), com('U'), com('E'), com('tri'), com('iso'), com('house'), com('sqstick'), com('tristick'), com('bell'),
  ];

  // helpers for the situations of statics.js, which adds its own to SCENARIOS
  const H = { step, res, exact, beamPic, kg, cm, N, senseWord };
  root.Scenarios = { SCENARIOS, SHAPES, comOf, armOf, torqueOf, UNIT, H };
  if (typeof module !== 'undefined') module.exports = root.Scenarios;
})(typeof window !== 'undefined' ? window : globalThis);
