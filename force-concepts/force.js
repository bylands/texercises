// Net force: the net force points along the acceleration, not along the motion. Forces balance
// at constant speed (also while moving up, or falling); a constant sideways force bends the path
// into a parabola; two forces at an angle add as arrows.
(function (root) {
  'use strict';

  const FC = root.FC || require('./core.js');
  const D = root.Draw || require('./draw.js');
  const { T, F, FL, cap, num, qty, deg, noun, o, q, register } = FC;

  // ================================================================ balance: compare two forces
  // X acts forward (horizontal objects) or up (vertical ones), Y backward or down. dirs: the
  // directions the object may move in (+1 forward/up, −1 down). Built per exercise, since the
  // texts and symbols depend on the language.
  function objects() {
    return {
      crate: {
        vert: false, dirs: [1], name: 'crate', N: noun('f', 'Kiste'),
        X: { sym: FL('push'), html: F('push'), what: T('the push of the person', 'die Druckkraft der Person'), dat: 'der Druckkraft der Person' },
        Y: { sym: FL('f'), html: F('f'), what: T('the friction on the crate', 'die Reibungskraft auf die Kiste'), dat: 'der Reibungskraft auf die Kiste' },
        text: (ph) => T(`A person pushes a heavy crate across a level floor. ${{ speeding: 'The crate gets faster and faster.', constant: 'The crate slides at constant speed.', slowing: 'The crate is getting slower, but still sliding forward.' }[ph]}`,
          `Eine Person schiebt eine schwere Kiste über einen ebenen Boden. ${{ speeding: 'Die Kiste wird immer schneller.', constant: 'Die Kiste gleitet mit konstanter Geschwindigkeit.', slowing: 'Die Kiste wird langsamer, gleitet aber noch vorwärts.' }[ph]}`),
      },
      car: {
        vert: false, dirs: [1], name: 'car', N: noun('n', 'Auto'),
        X: { sym: FL('drive'), html: F('drive'), what: T('the driving force (the road pushing the wheels forward)', 'die Antriebskraft (die Strasse schiebt die Räder vorwärts)'), dat: 'der Antriebskraft' },
        Y: { sym: FL('res'), html: F('res'), what: T('the resistance (air resistance and rolling resistance)', 'der Fahrwiderstand (Luft- und Rollwiderstand)'), dat: 'dem Fahrwiderstand (Luft- und Rollwiderstand)' },
        text: (ph) => T(`A car drives along a straight, level road. ${{ speeding: 'It is speeding up.', constant: 'It drives at constant speed.', slowing: 'It is slowing down, with the engine still pulling a little.' }[ph]}`,
          `Ein Auto fährt auf einer geraden, ebenen Strasse. ${{ speeding: 'Es wird schneller.', constant: 'Es fährt mit konstanter Geschwindigkeit.', slowing: 'Es wird langsamer, wobei der Motor noch etwas zieht.' }[ph]}`),
      },
      elevator: {
        vert: true, dirs: [1, -1], name: 'elevator cabin', N: noun('f', 'Liftkabine'),
        X: { sym: FL('T'), html: F('T'), what: T('the pull of the cable', 'die Seilkraft'), dat: 'der Seilkraft' },
        Y: { sym: FL('G'), html: F('G'), what: T('the weight of the cabin', 'die Gewichtskraft der Kabine'), dat: 'der Gewichtskraft der Kabine' },
        text: (ph, d) => T(`An elevator cabin hangs on a cable and moves ${d > 0 ? 'up' : 'down'}. ${{ speeding: 'It is speeding up.', constant: 'It moves at constant speed.', slowing: 'It is slowing down before a stop.' }[ph]} Air resistance and friction are negligible.`,
          `Eine Liftkabine hängt an einem Seil und fährt ${d > 0 ? 'nach oben' : 'nach unten'}. ${{ speeding: 'Sie wird schneller.', constant: 'Sie fährt mit konstanter Geschwindigkeit.', slowing: 'Sie bremst vor einem Halt ab.' }[ph]} Luftwiderstand und Reibung sind vernachlässigbar.`),
      },
      skydiver: {
        vert: true, dirs: [-1], name: 'skydiver', N: noun('m', 'Fallschirmspringer'),
        X: { sym: FL('D'), html: F('D'), what: T('the air resistance (drag)', 'der Luftwiderstand'), dat: 'dem Luftwiderstand' },
        Y: { sym: FL('G'), html: F('G'), what: T('the weight of the skydiver', 'die Gewichtskraft des Fallschirmspringers'), dat: 'der Gewichtskraft des Fallschirmspringers' },
        text: (ph) => T({
          speeding: 'A skydiver has just jumped from the plane and falls faster and faster.',
          constant: 'A skydiver falls at a constant speed, with the parachute still closed.',
          slowing: 'A skydiver has just opened the parachute and is getting slower, while still falling.',
        }[ph], {
          speeding: 'Ein Fallschirmspringer ist eben aus dem Flugzeug gesprungen und fällt immer schneller.',
          constant: 'Ein Fallschirmspringer fällt mit konstanter Geschwindigkeit, der Fallschirm ist noch geschlossen.',
          slowing: 'Ein Fallschirmspringer hat eben den Fallschirm geöffnet und wird langsamer, fällt aber noch.',
        }[ph]),
      },
    };
  }
  const OBJECT_KEYS = ['crate', 'car', 'elevator', 'skydiver'];
  const PHASES = ['speeding', 'constant', 'slowing'];
  const PH_SIGN = { speeding: 1, constant: 0, slowing: -1 };

  function balance(r, p) {
    const key = p.obj || r.pick(OBJECT_KEYS), ob = objects()[key];
    const phase = p.phase || r.pick(PHASES);
    const d = p.dir || r.pick(ob.dirs);
    const acc = d * PH_SIGN[phase]; // sign of the acceleration along X: +1, 0, −1
    const { X, Y, N } = ob, name = ob.name;
    const Fnet = F('net');
    const fwd = ob.vert ? T('up', 'nach oben') : T('forward', 'nach vorn'), back = ob.vert ? T('down', 'nach unten') : T('backward', 'nach hinten');
    const motion = ob.vert ? (d > 0 ? T('up', 'nach oben') : T('down', 'nach unten')) : T('forward', 'nach vorn');
    const against = ob.vert ? (d > 0 ? T('down', 'nach unten') : T('up', 'nach oben')) : T('backward', 'nach hinten');
    const doing = T({ speeding: 'speeds up', constant: 'moves at constant speed', slowing: 'slows down' }[phase],
      { speeding: 'wird schneller', constant: 'bewegt sich mit konstanter Geschwindigkeit', slowing: 'wird langsamer' }[phase]);
    const rel = (c) => (c > 0 ? T('larger than', 'grösser als') : c < 0 ? T('smaller than', 'kleiner als') : T('equal to', 'gleich gross wie'));
    const marksWord = T('position every second', 'Position jede Sekunde');

    // ---------------------------------------------------------- figure
    const gaps = { speeding: [14, 22, 30, 38], constant: [26, 26, 26, 26], slowing: [38, 30, 22, 14] }[phase];
    const marks = [0];
    gaps.forEach((gp) => marks.push(marks[marks.length - 1] + gp));
    const LX = 46, LYf = 46 - 16 * acc; // drawn lengths of X and Y in the force diagram
    const label = T(`The ${name}, with its position every second`, `${cap(N.nom)}, mit der Position jede Sekunde`);
    function figure(o = {}) {
      let g = '';
      if (!ob.vert) {
        const yF = 150, x0 = 40, end = x0 + marks[4] * 1.6;
        g += D.ground(0, 380, yF);
        g += D.line(x0, 36, end, 36, 'guide') + marks.map((m) => D.line(x0 + m * 1.6, 30, x0 + m * 1.6, 42, 'ln')).join('') + D.words((x0 + end) / 2, 22, marksWord);
        g += D.arrow(end + 14, 36, end + 54, 36, 'm', '', { head: 8 });
        const bx = end - 26;
        if (key === 'crate') g += D.person(bx - 27, yF, 70, 1, 'push') + D.crate(bx, yF - 46, 52, 46);
        else g += D.car(bx - 30, yF, 96);
        const cx = key === 'crate' ? bx + 26 : bx + 18, cy = key === 'crate' ? yF - 23 : yF - 26;
        if (o.forces) {
          g += D.arrow(cx, cy, cx + LX, cy, 'f', X.sym, { at: [cx + LX + 6, cy - 8], anchor: 'start' });
          g += key === 'crate' ? D.arrow(cx, yF - 3, cx - LYf, yF - 3, 'f', Y.sym, { at: [cx - LYf - 4, yF - 10], anchor: 'end' }) : D.arrow(cx, cy, cx - LYf, cy, 'f', Y.sym, { at: [cx - LYf - 6, cy - 8], anchor: 'end' });
          g += D.dot(cx, cy, 3, 'pt');
        }
        if (o.net) g += acc ? D.arrow(cx - 16 * (acc < 0), yF + 26, cx + 32 * acc - 16 * (acc < 0), yF + 26, 'net', FL('net'), { at: [cx + 40, yF + 30], anchor: 'start' }) : D.text(cx, yF + 32, `${FL('net')} = 0`, 'lbl net');
        return D.svg(380, o.net ? 194 : 172, g, label);
      }
      // vertical: a column of position marks next to the object
      const W = 320, H = 300, xm = 70, base = d > 0 ? 260 : 60, sgn = d > 0 ? -1 : 1, k = 1.3;
      const ys = marks.map((m) => base + sgn * m * k), yEnd = ys[4];
      g += D.line(xm, Math.min(...ys), xm, Math.max(...ys), 'guide') + ys.map((y) => D.line(xm - 6, y, xm + 6, y, 'ln')).join('');
      g += `<text class="txt" x="${xm - 14}" y="${(ys[0] + ys[4]) / 2}" text-anchor="middle" transform="rotate(-90 ${xm - 14} ${(ys[0] + ys[4]) / 2})">${marksWord}</text>`;
      g += D.arrow(xm + 22, yEnd - sgn * 10, xm + 22, yEnd + sgn * 30, 'm', '', { head: 8 });
      const cx = 190, cy = yEnd;
      if (key === 'elevator') g += D.ceiling(140, 240, 14) + D.line(150, 14, 150, H, 'shaft') + D.line(230, 14, 230, H, 'shaft') + D.elevator(164, cy - 26, 52, 52, 14);
      else g += D.skydiver(cx, cy, phase === 'slowing');
      if (o.forces) {
        const ay = key === 'elevator' ? cy : cy - 2;
        g += D.arrow(cx, ay, cx, ay - LX, 'f', X.sym, { at: [cx + 10, ay - LX + 6], anchor: 'start' });
        g += D.arrow(cx, ay, cx, ay + LYf, 'f', Y.sym, { at: [cx + 10, ay + LYf], anchor: 'start' });
        g += D.dot(cx, ay, 3, 'pt');
        if (o.net) g += acc ? D.arrow(cx + 70, ay + 16 * acc, cx + 70, ay - 16 * acc, 'net', FL('net'), { at: [cx + 78, ay + 4], anchor: 'start' }) : D.text(cx + 66, ay + 4, `${FL('net')} = 0`, 'lbl net', 'start');
      }
      return D.svg(W, H, g, label);
    }

    // ---------------------------------------------------------- questions
    const actual = T(`it ${doing}`, `${N.er} ${doing}`);
    const effect = (c) => (c === 0 ? T('move at constant speed', 'sich mit konstanter Geschwindigkeit bewegen') : c * d > 0 ? T('speed up', 'schneller werden') : T('slow down', 'langsamer werden'));
    const notNeeded = T(`Moving ${motion} does not need a net force ${motion}. `, `Um sich ${motion} zu bewegen, braucht es keine resultierende Kraft ${motion}. `);
    function whyRel(c) {
      const imply = T(`If ${X.html} were ${rel(c)} ${Y.html}, the net force would ${c ? `point ${c > 0 ? fwd : back}` : 'be zero'}, and the ${name} would ${effect(c)}. But ${actual}.`,
        `Wäre ${X.html} ${rel(c)} ${Y.html}, dann wäre die resultierende Kraft ${c ? `${c > 0 ? fwd : back} gerichtet` : 'null'}, und ${N.nom} würde ${effect(c)}. Aber ${actual}.`);
      const misled = c * d > 0 && acc * d <= 0;
      return { code: misled ? 'active-force' : 'other', why: misled ? notNeeded + imply : imply };
    }
    const relOpt = (c) => {
      const label = T(`${X.html} is ${rel(c)} ${Y.html}.`, `${X.html} ist ${rel(c)} ${Y.html}.`);
      if (c === acc) {
        const tail = acc ? `: ${X.html} ${acc > 0 ? '>' : '<'} ${Y.html}` : T(` and ${X.html} = ${Y.html}`, `, also ${X.html} = ${Y.html}`);
        return o(label, 'ok', T(`Right: the ${name} ${doing}, so the net force ${acc ? `points ${acc > 0 ? fwd : back}` : 'is zero'}${tail}.`,
          `Richtig: ${cap(N.nom)} ${doing}, also ist die resultierende Kraft ${acc ? `${acc > 0 ? fwd : back} gerichtet` : 'null'}${tail}.`));
      }
      const w = whyRel(c);
      return o(label, w.code, w.why);
    };
    const netRight = acc === 0 ? 'none' : acc * d > 0 ? 'with' : 'against';
    const netOpt = (kind) => {
      const label = {
        with: T(`In the direction of motion (${motion}).`, `In Bewegungsrichtung (${motion}).`),
        against: T(`Against the direction of motion (${against}).`, `Gegen die Bewegungsrichtung (${against}).`),
        none: T('There is no net force.', 'Es gibt keine resultierende Kraft.'),
      }[kind];
      if (kind === netRight) {
        return o(label, 'ok', T(`Right: the net force points along the acceleration. The ${name} ${doing}${acc ? `, so its acceleration points ${kind === 'with' ? motion : against}` : ', so its acceleration is zero'}.`,
          `Richtig: Die resultierende Kraft zeigt in Richtung der Beschleunigung. ${cap(N.nom)} ${doing}${acc ? `, also zeigt die Beschleunigung ${kind === 'with' ? motion : against}` : ', also ist die Beschleunigung null'}.`));
      }
      const misled = kind === 'with';
      const why = (misled ? T(`A body moving ${motion} does not need a net force ${motion}. `, `Ein Körper, der sich ${motion} bewegt, braucht keine resultierende Kraft ${motion}. `) : '') +
        (kind === 'none'
          ? T('With no net force it would move at constant speed.', `Ohne resultierende Kraft würde ${N.er} sich mit konstanter Geschwindigkeit bewegen.`)
          : T(`A net force ${kind === 'with' ? motion : against} would make the ${name} ${kind === 'with' ? 'speed up' : 'slow down'}.`,
            `Eine resultierende Kraft ${kind === 'with' ? motion : against} würde ${N.acc} ${kind === 'with' ? 'schneller' : 'langsamer'} machen.`)) +
        T(` But ${actual}.`, ` Aber ${actual}.`);
      return o(label, misled ? 'active-force' : 'other', why);
    };
    // without numbers? The motion is enough.
    const enough = T(`The motion is enough: the ${name} ${doing}, so the net force ${acc ? `points ${acc > 0 ? fwd : back}` : 'is zero'}.`,
      `Die Bewegung genügt: ${cap(N.nom)} ${doing}, also ist die resultierende Kraft ${acc ? `${acc > 0 ? fwd : back} gerichtet` : 'null'}.`);
    const questions = [
      q(r, 'compare', T(`How does ${X.what} (${X.html}) compare with ${Y.what} (${Y.html})?`, `Wie gross ist ${X.what} (${X.html}) im Vergleich zu ${Y.dat} (${Y.html})?`), [...[1, 0, -1].map(relOpt),
        o(T('That cannot be told without the values of the forces.', 'Das lässt sich ohne die Werte der Kräfte nicht sagen.'), 'other', T(`It can: the forces need not be known. ${enough}`, `Doch: Die Kräfte muss man nicht kennen. ${enough}`))]),
      q(r, 'net', T(`Which way does the net force on the ${name} point?`, `Wohin zeigt die resultierende Kraft auf ${N.acc}?`), [...['with', 'against', 'none'].map(netOpt),
        o(T(`That depends on the mass of the ${name}.`, `Das hängt von der Masse ${{ f: 'der', m: 'des', n: 'des' }[N.g]} ${N.word}${N.g === 'f' ? '' : 's'} ab.`), 'other', T(`The mass sets how large the net force is for a given acceleration, not which way it points. ${enough}`, `Die Masse bestimmt, wie gross die resultierende Kraft für eine bestimmte Beschleunigung ist, nicht wohin sie zeigt. ${enough}`))]),
    ];

    const gapWord = T({ speeding: 'grow', constant: 'stay the same', slowing: 'shrink' }[phase], { speeding: 'wachsen', constant: 'bleiben gleich', slowing: 'schrumpfen' }[phase]);
    const extra = key === 'skydiver' && phase === 'slowing'
      ? T(': the open parachute gives a drag larger than the weight, until the skydiver is slow enough', ': Der offene Fallschirm erzeugt einen Luftwiderstand, der grösser ist als die Gewichtskraft, bis der Fallschirmspringer langsam genug ist')
      : key === 'elevator' && phase === 'slowing' && d > 0
        ? T(': the cable pulls less than the weight, although the cabin is still moving up', ': Das Seil zieht weniger stark, als die Gewichtskraft beträgt, obwohl die Kabine noch nach oben fährt')
        : '';
    const steps = [
      { title: T('How does it move?', 'Wie bewegt es sich?'), figure: figure(),
        text: T(`The marks show the position every second. The gaps ${gapWord}: the ${name} ${doing}. So its acceleration ${acc ? `points ${acc * d > 0 ? motion : against}, ${acc * d > 0 ? 'along' : 'against'} the motion` : 'is zero'}.`,
          `Die Marken zeigen die Position jede Sekunde. Die Abstände ${gapWord}: ${cap(N.nom)} ${doing}. Die Beschleunigung ${acc ? `zeigt also ${acc * d > 0 ? motion : against}, ${acc * d > 0 ? 'in' : 'gegen die'} Bewegungsrichtung` : 'ist also null'}.`) },
      { title: T('Net force', 'Resultierende Kraft'), figure: figure({ forces: true, net: true }),
        text: T(`Second law, ${Fnet} = <i>m·a</i>: the net force points the way the acceleration points — ${acc ? (acc > 0 ? fwd : back) : 'here it is zero'}. Which way the ${name} moves does not matter${phase !== 'speeding' ? `: moving ${motion} does not need a net force ${motion}` : ''}.`,
          `Zweites Newtonsches Gesetz, ${Fnet} = <i>m·a</i>: Die resultierende Kraft zeigt in die Richtung der Beschleunigung — ${acc ? (acc > 0 ? fwd : back) : 'hier ist sie null'}. In welche Richtung sich ${N.nom} bewegt, spielt keine Rolle${phase !== 'speeding' ? `: Um sich ${motion} zu bewegen, braucht es keine resultierende Kraft ${motion}` : ''}.`) },
      { title: T('Compare the forces', 'Kräfte vergleichen'), figure: figure({ forces: true, net: true }),
        text: T(`${ob.vert ? 'Only' : 'Along the motion, only'} ${X.html} (${fwd}) and ${Y.html} (${back}) act${ob.vert ? '' : '; the weight and the push of the ground are vertical and cancel'}. So ${acc ? `${X.html} ${acc > 0 ? '>' : '<'} ${Y.html}` : `${X.html} = ${Y.html}`}${extra}.`,
          `${ob.vert ? 'Es wirken nur' : 'In Bewegungsrichtung wirken nur'} ${X.html} (${fwd}) und ${Y.html} (${back})${ob.vert ? '' : '; Gewichtskraft und Normalkraft des Bodens sind vertikal und heben sich auf'}. Also ${acc ? `${X.html} ${acc > 0 ? '>' : '<'} ${Y.html}` : `${X.html} = ${Y.html}`}${extra}.`) },
    ];

    return {
      title: T({ crate: 'Pushing a crate', car: 'On the road', elevator: 'In the elevator shaft', skydiver: 'Skydiving' }[key],
        { crate: 'Eine Kiste schieben', car: 'Auf der Strasse', elevator: 'Im Liftschacht', skydiver: 'Fallschirmsprung' }[key]),
      situation: `<p>${ob.text(phase, d)}</p>`,
      figure: figure(),
      questions,
      hints: [
        T(`Look at the marks: how does the speed of the ${name} change? Which forces act on it along its motion?`,
          `Schau dir die Marken an: Wie ändert sich die Geschwindigkeit? Welche Kräfte wirken in Bewegungsrichtung auf ${N.acc}?`),
        T(`Plan: speed change → direction of the acceleration → direction of the net force (second law) → compare ${X.html} and ${Y.html}.`,
          `Plan: Geschwindigkeitsänderung → Richtung der Beschleunigung → Richtung der resultierenden Kraft (zweites Gesetz) → ${X.html} und ${Y.html} vergleichen.`),
        T(`${Fnet} = <i>m·a</i>: the net force points the way the acceleration points, not necessarily the way the body moves. If <i>a</i> = 0, the forces balance.`,
          `${Fnet} = <i>m·a</i>: Die resultierende Kraft zeigt in Richtung der Beschleunigung, nicht unbedingt in Bewegungsrichtung. Ist <i>a</i> = 0, heben sich die Kräfte auf.`),
        T(`Here the ${name} moves ${motion} and ${doing}. So the acceleration ${acc ? `points ${acc > 0 ? fwd : back}` : 'is zero'}. What does that say about ${X.html} − ${Y.html}?`,
          `Hier bewegt sich ${N.nom} ${motion} und ${doing}. Die Beschleunigung ${acc ? `zeigt also ${acc > 0 ? fwd : back}` : 'ist also null'}. Was sagt das über ${X.html} − ${Y.html}?`),
      ],
      steps,
    };
  }

  // ================================================================ thruster: constant sideways force
  function thruster(r, p) {
    const s = p.side || r.pick([1, -1]);
    const b = p.bend || r.pick([60, 90, 110]);
    const side = s > 0 ? 'north' : 'south', vS = `<i>v</i><sub>${s > 0 ? 'N' : 'S'}</sub>`;
    const dSide = s > 0 ? 'Norden' : 'Süden', dAdj = s > 0 ? 'nördlich' : 'südlich';
    const toSide = T(`toward the ${side}`, `nach ${dSide}`);
    const vE = T('<i>v</i><sub>E</sub>', '<i>v</i><sub>O</sub>');
    const Py = s > 0 ? 160 : 40, P = [60, Py], W = 220;
    const at = (u) => [P[0] + W * u, Py - s * b * u * u];
    const Q = at(1), tq = [W, -2 * s * b], lq = Math.hypot(...tq), tu = [tq[0] / lq, tq[1] / lq];
    const turn = deg(Math.atan2(2 * b, W));

    function figure(o = {}) {
      let g = D.rect(0, 0, 380, 200, 'space', 6) + D.arrow(352, 46, 352, 18, 'ax', 'N', { head: 7, at: [352, 58] });
      g += D.line(4, Py, P[0], Py, 'trace');
      [16, 38].forEach((x) => { g += D.ghost(D.probe(x, Py, [1, 0], null, 0.6)); });
      if (o.path) {
        g += D.poly(Array.from({ length: 31 }, (z, j) => at(j / 30)), 'trace strong');
        [0.25, 0.5, 0.75].forEach((u) => {
          const [x, y] = at(u);
          g += D.ghost(D.probe(x, y, [1, 0], [0, -s], 0.6));
          if (o.forces) g += D.arrow(x, y, x, y - s * 30, 'f', u === 0.5 ? 'F' : '', { at: [x + 8, y - s * 24 + 4], anchor: 'start' });
        });
      }
      // Q is where the engine is switched off: in every picture, as the text refers to it
      g += D.dot(Q[0], Q[1], 3.5, 'pt') + D.text(Q[0] + 6, Q[1] + s * 16 + 4, 'Q', 'lbl', 'start');
      if (o.after) {
        g += D.line(Q[0], Q[1], Q[0] + 110 * tu[0], Q[1] + 110 * tu[1], 'trace strong');
        g += D.probe(Q[0] + 60 * tu[0], Q[1] + 60 * tu[1], [1, 0], null, 0.6);
      }
      if (o.vel) [0, 0.5, 1].forEach((u) => {
        const [x, y] = at(u);
        g += D.arrow(x, y, x + 40, y, 'v', u === 0 ? T('v_E', 'v_O') : '', { cls: 'alt' }) + (u ? D.arrow(x, y, x, y - s * 40 * u * (2 * b / W), 'v', u === 1 ? (s > 0 ? 'v_N' : 'v_S') : '', { cls: 'alt', at: [x - 6, y - s * 14], anchor: 'end' }) : '') +
          D.arrow(x, y, x + 40, y - s * 40 * u * (2 * b / W), 'v', '', { cls: 'strong' });
      });
      g += D.probe(P[0], Py, [1, 0], o.path ? null : [0, -s], 0.75) + D.text(P[0] - 2, Py + s * 22 + 4, 'P', 'lbl', 'middle');
      if (!o.path && !o.vel) g += D.arrow(P[0], Py, P[0], Py - s * 44, 'f', 'F', { at: [P[0] + 8, Py - s * 36], anchor: 'start' }) + D.arrow(P[0] + 20, Py, P[0] + 70, Py, 'v', 'v');
      return D.svg(380, 200, g, T(`Top view: a probe drifting east, pushed ${side} from P on`, `Ansicht von oben: eine Sonde treibt nach Osten und wird ab P nach ${dSide} geschoben`));
    }

    const pic = (d) => {
      const y = s > 0 ? 96 : 14;
      return D.svg(150, 110, D.line(2, y, 16, y, 'trace') + D.path(d(16, y), 'opt-path') + D.probe(16, y, [1, 0], null, 0.42), T('path', 'Bahn'));
    };
    const bb = 70 * Math.min(1, b / 90);
    const PATH = {
      ok: (x, y) => 'M' + Array.from({ length: 21 }, (z, j) => `${D.n(x + 110 * (j / 20))} ${D.n(y - s * bb * (j / 20) ** 2)}`).join(' L'),
      straight: (x, y) => `M${x} ${y} L${x + 110} ${D.n(y - s * bb)}`,
      corner: (x, y) => `M${x} ${y} V${y - s * 76}`,
      arc: (x, y) => `M${x} ${y} A60 60 0 0 ${s > 0 ? 0 : 1} ${x + 60} ${y - s * 60}`,
    };
    const split = T(`Split the motion: east–west no force acts, so the velocity east stays the same; ${side}ward the constant force gives a constant acceleration`,
      `Zerlege die Bewegung: In Ost-West-Richtung wirkt keine Kraft, also bleibt die Geschwindigkeit nach Osten gleich; nach ${dSide} bewirkt die konstante Kraft eine konstante Beschleunigung`);
    const questions = [
      q(r, 'path', T(`Which path does the probe follow from P until the engine is switched off?`, 'Welche Bahn beschreibt die Sonde von P an, bis das Triebwerk abgeschaltet wird?'), [
        o(pic(PATH.ok), 'ok', T(`Right: ${split}. Together: a curve that bends more and more toward the ${side} — a parabola, like the path of a ball thrown horizontally.`,
          `Richtig: ${split}. Zusammen: eine Kurve, die sich immer stärker nach ${dSide} krümmt — eine Parabel, wie die Bahn eines horizontal geworfenen Balls.`),
          T(`a curve bending more and more to the ${side} (a parabola)`, `eine Kurve, die sich immer stärker nach ${dSide} krümmt (eine Parabel)`)),
        o(pic(PATH.straight), 'other', T(`A straight slanted line needs a constant velocity. But the velocity toward the ${side} keeps growing while the engine runs, so the path keeps getting steeper.`,
          `Eine schräge Gerade braucht eine konstante Geschwindigkeit. Die Geschwindigkeit nach ${dSide} wächst aber, solange das Triebwerk läuft, also wird die Bahn immer steiler.`),
          T('a straight slanted line', 'eine schräge Gerade')),
        o(pic(PATH.corner), 'last-force', T(`The probe does not lose its velocity east when the engine starts: no force acts east–west. The engine only adds a growing velocity toward the ${side}.`,
          `Die Sonde verliert ihre Geschwindigkeit nach Osten nicht, wenn das Triebwerk startet: In Ost-West-Richtung wirkt keine Kraft. Das Triebwerk fügt nur eine wachsende Geschwindigkeit nach ${dSide} hinzu.`),
          T(`straight ${side}`, `geradeaus nach ${dSide}`)),
        o(pic(PATH.arc), 'other', T(`A circle needs a force that always points to its centre, so it turns with the probe. Here the force keeps pointing ${side}: the probe keeps its velocity east, and the path is a parabola, not a circle.`,
          `Ein Kreis braucht eine Kraft, die immer zum Zentrum zeigt, sich also mit der Sonde dreht. Hier zeigt die Kraft immer nach ${dSide}: Die Sonde behält ihre Geschwindigkeit nach Osten, und die Bahn ist eine Parabel, kein Kreis.`),
          T('a quarter circle', 'ein Viertelkreis')),
      ], true),
      q(r, 'speed', T('How does the speed of the probe change while the engine runs?', 'Wie ändert sich der Betrag der Geschwindigkeit der Sonde, während das Triebwerk läuft?'), [
        o(T('It increases all the time.', 'Er nimmt die ganze Zeit zu.'), 'ok', T(`Right: the velocity east stays the same and the velocity toward the ${side} keeps growing, so the speed √(${vE}² + ${vS}²) increases.`,
          `Richtig: Die Geschwindigkeit nach Osten bleibt gleich, und die Geschwindigkeit nach ${dSide} wächst, also nimmt der Betrag √(${vE}² + ${vS}²) zu.`)),
        o(T('It stays the same: the force only changes the direction.', 'Er bleibt gleich: Die Kraft ändert nur die Richtung.'), 'other',
          T(`That is only so if the force is always at right angles to the velocity. Here the force keeps pointing ${side}, and the velocity toward the ${side} grows while the velocity east stays: the speed increases.`,
            `Das gilt nur, wenn die Kraft immer senkrecht zur Geschwindigkeit steht. Hier zeigt die Kraft immer nach ${dSide}, und die Geschwindigkeit nach ${dSide} wächst, während die nach Osten bleibt: Der Betrag nimmt zu.`)),
        o(T('It increases at first, then stays the same while the engine still runs.', 'Er nimmt zuerst zu und bleibt dann gleich, während das Triebwerk noch läuft.'), 'active-force',
          T(`As long as the force acts, the velocity keeps changing at the same rate: <i>a</i> = <i>F</i>/<i>m</i>. A constant force does not lead to a constant speed.`,
            `Solange die Kraft wirkt, ändert sich die Geschwindigkeit gleich schnell weiter: <i>a</i> = <i>F</i>/<i>m</i>. Eine konstante Kraft führt nicht zu einer konstanten Geschwindigkeit.`)),
        o(T('It decreases, because the probe is pushed off course.', 'Er nimmt ab, weil die Sonde vom Kurs abgedrängt wird.'), 'other',
          T(`The velocity east is not reduced: no force acts east–west. The velocity toward the ${side} only grows.`, `Die Geschwindigkeit nach Osten wird nicht kleiner: In Ost-West-Richtung wirkt keine Kraft. Die Geschwindigkeit nach ${dSide} wächst nur.`)),
      ]),
      q(r, 'after', T('How does the probe move after the engine has been switched off?', 'Wie bewegt sich die Sonde, nachdem das Triebwerk abgeschaltet wurde?'), [
        o(T('In a straight line, in the direction it had at that moment, at constant speed.', 'Geradlinig, in der Richtung, die sie in diesem Moment hatte, mit konstanter Geschwindigkeit.'), 'ok',
          T('Right: with no force, the probe keeps its velocity (first law).', 'Richtig: Ohne Kraft behält die Sonde ihre Geschwindigkeit (erstes Newtonsches Gesetz).')),
        o(T(`It keeps curving toward the ${side}, more and more gently.`, `Sie krümmt sich weiter nach ${dSide}, immer schwächer.`), 'impetus',
          T(`Without a force the path is not bent any more: there is no stored push that slowly wears off.`, 'Ohne Kraft wird die Bahn nicht mehr gekrümmt: Es gibt keinen gespeicherten Schub, der langsam nachlässt.')),
        o(T('It turns back to its original direction, east.', 'Sie dreht zurück in ihre ursprüngliche Richtung, nach Osten.'), 'other',
          T(`Nothing pushes it back. It keeps the velocity it had when the engine stopped, including the velocity toward the ${side}.`, `Nichts drückt sie zurück. Sie behält die Geschwindigkeit, die sie beim Abschalten hatte, auch die Geschwindigkeit nach ${dSide}.`)),
        o(T('It gets slower and slower and finally stops.', 'Sie wird immer langsamer und bleibt schliesslich stehen.'), 'active-force',
          T(`In space nothing slows the probe down. Without a force it keeps its velocity.`, 'Im Weltraum bremst nichts die Sonde. Ohne Kraft behält sie ihre Geschwindigkeit.')),
      ]),
    ];

    const steps = [
      { title: T('Before P', 'Vor P'), figure: figure(),
        text: T(`Far from any planet and with the engine off, no force acts: the probe moves in a straight line at constant speed, east (first law).`,
          'Weit weg von jedem Planeten und mit abgeschaltetem Triebwerk wirkt keine Kraft: Die Sonde bewegt sich geradlinig mit konstanter Geschwindigkeit nach Osten (erstes Newtonsches Gesetz).') },
      { title: T('From P on: split the motion', 'Ab P: Bewegung zerlegen'), figure: figure({ path: true, forces: true }),
        text: T(`The engine pushes with a constant force toward the ${side}. East–west no force acts: the velocity east stays the same. Toward the ${side} the force gives a constant acceleration: the velocity toward the ${side} grows steadily from zero, and the distance grows like <i>t</i>². Together: a parabola, like a ball thrown horizontally — only “falling” to the ${side}.`,
          `Das Triebwerk schiebt mit einer konstanten Kraft nach ${dSide}. In Ost-West-Richtung wirkt keine Kraft: Die Geschwindigkeit nach Osten bleibt gleich. Nach ${dSide} bewirkt die Kraft eine konstante Beschleunigung: Die Geschwindigkeit nach ${dSide} wächst gleichmässig von null an, und die Strecke wächst wie <i>t</i>². Zusammen: eine Parabel, wie bei einem horizontal geworfenen Ball — nur „fällt“ die Sonde nach ${dSide}.`) },
      { title: T('Speed', 'Betrag der Geschwindigkeit'), figure: figure({ path: true, vel: true }),
        text: T(`The velocity arrows: the part east stays, the part toward the ${side} grows. So the speed √(${vE}² + ${vS}²) increases all the time the engine runs.`,
          `Die Geschwindigkeitspfeile: Der Anteil nach Osten bleibt, der Anteil nach ${dSide} wächst. Also nimmt der Betrag √(${vE}² + ${vS}²) zu, solange das Triebwerk läuft.`) },
      { title: T('After the engine stops', 'Nach dem Abschalten'), figure: figure({ path: true, after: true }),
        text: T(`At Q the engine stops. No force acts any more, so the probe moves in a straight line at constant speed, in the direction it had at Q — here about ${turn}° ${side} of east.`,
          `In Q stoppt das Triebwerk. Es wirkt keine Kraft mehr, also bewegt sich die Sonde geradlinig mit konstanter Geschwindigkeit weiter, in der Richtung, die sie in Q hatte — hier etwa ${turn}° ${dAdj} von Osten.`) },
    ];

    return {
      title: T('Thrust to the side', 'Schub zur Seite'),
      situation: T(`<p>A space probe far from any planet drifts east with its engine off. At P its engine is switched on and pushes it with a constant force toward the ${side} (the probe is held so that the force always points ${side}). A little later, at Q, the engine is switched off again. The picture shows the probe from above.</p>`,
        `<p>Eine Raumsonde treibt weit weg von jedem Planeten mit abgeschaltetem Triebwerk nach Osten. In P wird ihr Triebwerk eingeschaltet und schiebt sie mit einer konstanten Kraft nach ${dSide} (die Sonde wird so ausgerichtet, dass die Kraft immer nach ${dSide} zeigt). Etwas später, in Q, wird das Triebwerk wieder abgeschaltet. Das Bild zeigt die Sonde von oben.</p>`),
      figure: figure(),
      questions,
      hints: [
        T(`Which forces act on the probe before P, between P and Q, and after Q? Which way do they point?`, 'Welche Kräfte wirken vor P, zwischen P und Q und nach Q auf die Sonde? Wohin zeigen sie?'),
        T(`Plan: split the motion into east–west and north–south. Use the first law where no force acts and the second law where the constant force acts.`,
          'Plan: Zerlege die Bewegung in Ost-West und Nord-Süd. Wende das erste Newtonsche Gesetz an, wo keine Kraft wirkt, und das zweite, wo die konstante Kraft wirkt.'),
        T(`First law: no force → constant velocity. Second law: constant force → constant acceleration; the velocity in the direction of the force grows steadily, the distance like <i>t</i>².`,
          'Erstes Gesetz: keine Kraft → konstante Geschwindigkeit. Zweites Gesetz: konstante Kraft → konstante Beschleunigung; die Geschwindigkeit in Kraftrichtung wächst gleichmässig, die Strecke wie <i>t</i>².'),
        T(`Here, between P and Q, the velocity east stays the same while the velocity ${side} grows from 0. It is the same as a ball thrown horizontally, turned on its side. After Q no force acts.`,
          `Hier bleibt zwischen P und Q die Geschwindigkeit nach Osten gleich, während die Geschwindigkeit ${toSide} von 0 an wächst. Das ist wie ein horizontal geworfener Ball, nur zur Seite gedreht. Nach Q wirkt keine Kraft.`),
      ],
      steps,
    };
  }

  // ================================================================ two forces at an angle
  const PAIRS = [[2, 4], [3, 6], [2, 6], [4, 8], [3, 5], [4, 6]];
  const angDiff = (a, b) => { const d = Math.abs(a - b) % (2 * Math.PI); return Math.min(d, 2 * Math.PI - d); };

  function twoForces(r, p) {
    let F1, F2, a1, a2, res, ar;
    for (let tries = 0; ; tries++) {
      const pair = p.pair || r.pick(PAIRS);
      [F1, F2] = p.pair ? pair : r.next() < 0.5 ? pair : [pair[1], pair[0]];
      a1 = ((p.a1 != null ? p.a1 : r.pick([0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330])) * Math.PI) / 180;
      const gamma = ((p.gamma || r.pick([60, 90, 120])) * Math.PI) / 180;
      a2 = a1 + (p.sense || r.pick([1, -1])) * gamma;
      res = [F1 * Math.cos(a1) + F2 * Math.cos(a2), F1 * Math.sin(a1) + F2 * Math.sin(a2)];
      ar = Math.atan2(res[1], res[0]);
      const big = F1 > F2 ? a1 : a2, small = F1 > F2 ? a2 : a1, bis = Math.atan2(Math.sin(a1) + Math.sin(a2), Math.cos(a1) + Math.cos(a2));
      if ((angDiff(ar, big) >= (15 * Math.PI) / 180 && angDiff(ar, bis) >= (12 * Math.PI) / 180 && angDiff(ar, small) >= (15 * Math.PI) / 180) || tries > 50) break;
    }
    const R = Math.hypot(...res), big = F1 > F2 ? 1 : 2;
    const aBig = big === 1 ? a1 : a2, aSmall = big === 1 ? a2 : a1;
    const bis = Math.atan2(Math.sin(a1) + Math.sin(a2), Math.cos(a1) + Math.cos(a2));
    const gammaDeg = deg(angDiff(a1, a2));
    const Fnet = F('net'), ratio = num(Math.max(F1, F2) / Math.min(F1, F2));

    // ---------------------------------------------------------- figure (top view)
    const C = [160, 135], k = 100 / Math.max(F1, F2);
    const tip = (Fv, a, c = C, kk = k) => [c[0] + kk * Fv * Math.cos(a), c[1] + kk * Fv * Math.sin(a)];
    const lab = (Fv, a) => { const [x, y] = tip(Fv + 1.3 * Math.max(F1, F2) / 6, a); return [x, y + 4]; };
    function figure(o = {}) {
      let g = D.rect(0, 0, 320, 270, 'ice', 6);
      const t1 = tip(F1, a1), t2 = tip(F2, a2), tr = [C[0] + k * res[0], C[1] + k * res[1]];
      if (o.parallelogram) g += D.line(t1[0], t1[1], tr[0], tr[1], 'guide') + D.line(t2[0], t2[1], tr[0], tr[1], 'guide');
      if (o.strobe) [0.35, 0.8, 1.45].forEach((f) => { g += D.ghost(D.puck(C[0] + f * 60 * Math.cos(ar), C[1] + f * 60 * Math.sin(ar), 13)); });
      g += D.puck(C[0], C[1], 13);
      g += D.arrow(C[0], C[1], t1[0], t1[1], 'f', '', {}) + D.text(...lab(F1, a1), `F_1 = ${F1} N`, 'lbl f small');
      g += D.arrow(C[0], C[1], t2[0], t2[1], 'f', '', {}) + D.text(...lab(F2, a2), `F_2 = ${F2} N`, 'lbl f small');
      if (o.parallelogram) {
        g += D.arrow(C[0], C[1], tr[0], tr[1], 'net', '');
        const [lx, ly] = [C[0] + (k * R + 22) * Math.cos(ar), C[1] + (k * R + 22) * Math.sin(ar) + 4];
        g += D.text(lx, ly, `${FL('net')} ≈ ${num(R)} N`, 'lbl net small');
      }
      if (o.acc) { const px = 26 * Math.sin(ar), py = -26 * Math.cos(ar); g += D.arrow(C[0] + px, C[1] + py, C[0] + px + 44 * Math.cos(ar), C[1] + py + 44 * Math.sin(ar), 'a', 'a'); }
      return D.svg(320, 270, g, T('Top view: two strings pull on a puck at an angle', 'Ansicht von oben: zwei Schnüre ziehen schräg an einem Puck'));
    }

    const c2 = [60, 60];
    const pic = (a) => {
      let g = D.line(c2[0], c2[1], c2[0] + 50 * Math.cos(a1), c2[1] + 50 * Math.sin(a1), 'guide faint') + D.line(c2[0], c2[1], c2[0] + 50 * Math.cos(a2), c2[1] + 50 * Math.sin(a2), 'guide faint');
      g += D.text(c2[0] + 56 * Math.cos(a1), c2[1] + 56 * Math.sin(a1) + 4, 'F_1', 'lbl small faint') + D.text(c2[0] + 56 * Math.cos(a2), c2[1] + 56 * Math.sin(a2) + 4, 'F_2', 'lbl small faint');
      g += D.puck(c2[0], c2[1], 7) + D.arrow(c2[0], c2[1], c2[0] + 44 * Math.cos(a), c2[1] + 44 * Math.sin(a), 'opt', '', { head: 9 });
      return D.svg(120, 120, g, T('direction', 'Richtung'));
    };
    const FBh = `<i>F</i><sub>${big}</sub>`, FSh = `<i>F</i><sub>${3 - big}</sub>`;
    const both = T(`Both forces act at the same time and add as arrows: the net force is the diagonal of the parallelogram they span. The puck starts moving along the net force.`,
      'Beide Kräfte wirken gleichzeitig und addieren sich als Pfeile: Die resultierende Kraft ist die Diagonale des Parallelogramms, das sie aufspannen. Der Puck setzt sich in Richtung der resultierenden Kraft in Bewegung.');
    const questions = [
      q(r, 'dir', T('In which direction does the puck start to move?', 'In welche Richtung setzt sich der Puck in Bewegung?'), [
        o(pic(ar), 'ok', `${T('Right:', 'Richtig:')} ${both}`, T('along the diagonal of the parallelogram of the two forces, closer to the larger one', 'entlang der Diagonale des Kräfteparallelogramms, näher bei der grösseren Kraft')),
        o(pic(aBig), 'largest-force', T(`${FSh} counts too, not just the larger force. ${both}`, `${FSh} zählt auch, nicht nur die grössere Kraft. ${both}`), T(`along the larger force ${FBh}`, `entlang der grösseren Kraft ${FBh}`)),
        o(pic(bis), 'other', T(`Exactly halfway between would be right for two equal forces. Here ${FBh} is ${ratio} times as large as ${FSh}, so the net force lies closer to ${FBh}.`,
          `Genau in der Mitte wäre richtig bei zwei gleich grossen Kräften. Hier ist ${FBh} ${ratio}-mal so gross wie ${FSh}, also liegt die resultierende Kraft näher bei ${FBh}.`),
          T('exactly halfway between the two forces', 'genau in der Mitte zwischen den beiden Kräften')),
        o(pic(aSmall), 'other', T(`${both} It lies closer to the larger force, ${FBh}.`, `${both} Sie liegt näher bei der grösseren Kraft ${FBh}.`), T('along the smaller force', 'entlang der kleineren Kraft')),
      ], true),
      q(r, 'motion', T('Both strings keep pulling in the same way. How does the puck move?', 'Beide Schnüre ziehen weiter gleich. Wie bewegt sich der Puck?'), [
        o(T('In a straight line, faster and faster.', 'Geradlinig, immer schneller.'), 'ok',
          T('Right: a constant net force gives a constant acceleration in its direction. Starting from rest, the puck moves in a straight line and gets faster and faster.',
            'Richtig: Eine konstante resultierende Kraft bewirkt eine konstante Beschleunigung in ihrer Richtung. Aus der Ruhe heraus bewegt sich der Puck geradlinig und wird immer schneller.')),
        o(T('In a straight line at constant speed.', 'Geradlinig mit konstanter Geschwindigkeit.'), 'active-force',
          T(`A constant net force does not give a constant speed; it changes the speed at a constant rate: <i>a</i> = ${Fnet}/<i>m</i>.`,
            `Eine konstante resultierende Kraft ergibt keine konstante Geschwindigkeit; sie ändert die Geschwindigkeit gleichmässig: <i>a</i> = ${Fnet}/<i>m</i>.`)),
        o(T('First along the larger force, then it turns toward the smaller one.', 'Zuerst entlang der grösseren Kraft, dann dreht er zur kleineren.'), 'largest-force',
          T('Both forces act from the start, so the net force — and the direction of motion — is the same from the start.', 'Beide Kräfte wirken von Anfang an, also ist die resultierende Kraft — und die Bewegungsrichtung — von Anfang an dieselbe.')),
        o(T('A short distance, then it stops.', 'Ein kurzes Stück, dann bleibt er stehen.'), 'impetus',
          T('The forces keep acting, so the puck keeps accelerating. It would not even stop if they stopped: on the air table nothing slows it down.',
            'Die Kräfte wirken weiter, also wird der Puck weiter beschleunigt. Er würde nicht einmal anhalten, wenn sie aufhörten: Auf dem Lufttisch bremst ihn nichts.')),
      ]),
    ];

    const steps = [
      { title: T('Net force', 'Resultierende Kraft'), figure: figure({ parallelogram: true }),
        text: T(`Both forces act at the same time; they add as arrows. Draw the parallelogram they span: its diagonal is the net force, here about ${qty(R, 'N')} (the forces are ${gammaDeg}° apart). It lies closer to the larger force ${FBh}, but not along it.`,
          `Beide Kräfte wirken gleichzeitig; sie addieren sich als Pfeile. Zeichne das Parallelogramm, das sie aufspannen: Seine Diagonale ist die resultierende Kraft, hier etwa ${qty(R, 'N')} (die Kräfte schliessen ${gammaDeg}° ein). Sie liegt näher bei der grösseren Kraft ${FBh}, aber nicht auf ihr.`) },
      { title: T('Direction of motion', 'Bewegungsrichtung'), figure: figure({ parallelogram: true, acc: true }),
        text: T(`Second law: the acceleration <i>a</i> = ${Fnet}/<i>m</i> points along the net force. The puck starts from rest, so it starts moving in this direction — not along the larger force, and not halfway between.`,
          `Zweites Newtonsches Gesetz: Die Beschleunigung <i>a</i> = ${Fnet}/<i>m</i> zeigt in Richtung der resultierenden Kraft. Der Puck startet aus der Ruhe, also bewegt er sich in diese Richtung — nicht entlang der grösseren Kraft und nicht genau in der Mitte.`) },
      { title: T('The motion', 'Die Bewegung'), figure: figure({ parallelogram: true, strobe: true }),
        text: T(`The forces do not change, so neither does the acceleration: the puck moves in a straight line along the net force, faster and faster.`,
          'Die Kräfte ändern sich nicht, also auch die Beschleunigung nicht: Der Puck bewegt sich geradlinig in Richtung der resultierenden Kraft, immer schneller.') },
    ];

    return {
      title: T('Two strings', 'Zwei Schnüre'),
      situation: T(`<p>A puck lies at rest on an air table (friction is negligible). Two strings pull on it at the same time, with <i>F</i><sub>1</sub> = ${F1} N and <i>F</i><sub>2</sub> = ${F2} N, in the directions shown. The picture shows the table from above.</p>`,
        `<p>Ein Puck liegt ruhig auf einem Lufttisch (Reibung vernachlässigbar). Zwei Schnüre ziehen gleichzeitig an ihm, mit <i>F</i><sub>1</sub> = ${F1} N und <i>F</i><sub>2</sub> = ${F2} N, in die gezeigten Richtungen. Das Bild zeigt den Tisch von oben.</p>`),
      figure: figure(),
      questions,
      hints: [
        T(`Which forces act on the puck in the plane of the table? Do they act one after the other or at the same time?`, 'Welche Kräfte wirken in der Tischebene auf den Puck? Wirken sie nacheinander oder gleichzeitig?'),
        T(`Plan: add the two forces to the net force, then use the second law for the direction of the acceleration.`, 'Plan: Addiere die beiden Kräfte zur resultierenden Kraft und bestimme dann mit dem zweiten Newtonschen Gesetz die Richtung der Beschleunigung.'),
        T(`Forces add as arrows (parallelogram rule): ${Fnet} = <i>F</i><sub>1</sub> + <i>F</i><sub>2</sub>. Then <i>a</i> = ${Fnet}/<i>m</i>, in the direction of ${Fnet}.`,
          `Kräfte addieren sich als Pfeile (Kräfteparallelogramm): ${Fnet} = <i>F</i><sub>1</sub> + <i>F</i><sub>2</sub>. Dann ist <i>a</i> = ${Fnet}/<i>m</i>, in Richtung von ${Fnet}.`),
        T(`Here ${FBh} is ${ratio} times as large as ${FSh}, and they are ${gammaDeg}° apart. The diagonal of the parallelogram (about ${qty(R, 'N')}) lies between them, closer to ${FBh}.`,
          `Hier ist ${FBh} ${ratio}-mal so gross wie ${FSh}, und sie schliessen ${gammaDeg}° ein. Die Diagonale des Parallelogramms (etwa ${qty(R, 'N')}) liegt zwischen ihnen, näher bei ${FBh}.`),
      ],
      steps,
    };
  }

  // ================================================================ centre: what keeps a body on its circle
  // A body moving at constant speed on a circle: the net force points to the centre, and one of
  // the forces that act provides it (friction, gravity, the string, the electric pull).
  function scenes() {
    return {
      car: {
        obj: 'car', N: noun('n', 'Auto'), sym: 'f', title: T('Round the bend', 'Durch die Kurve'),
        text: T('A car drives round a flat, circular bend at constant speed.', 'Ein Auto fährt mit konstanter Geschwindigkeit durch eine flache, kreisförmige Kurve.'),
        label: T('Top view: a car in a circular bend', 'Ansicht von oben: ein Auto in einer kreisförmigen Kurve'),
        force: T('the friction of the road on the tyres', 'die Reibungskraft der Strasse auf die Reifen'),
        others: T('Its weight and the normal force of the road are vertical and cancel; the driving force only makes up for the air resistance, along the motion.', 'Gewichtskraft und Normalkraft der Strasse sind vertikal und heben sich auf; die Antriebskraft gleicht in Bewegungsrichtung nur den Luftwiderstand aus.'),
        without: T('On black ice, without that friction, the car would slide straight on along the tangent.', 'Auf Glatteis, ohne diese Reibung, würde das Auto geradeaus entlang der Tangente weiterrutschen.'),
        options: (why) => [
          o(T('The friction of the road on the tyres.', 'Die Reibungskraft der Strasse auf die Reifen.'), 'ok', why.ok),
          o(T('The driving force of the engine.', 'Die Antriebskraft des Motors.'), 'active-force', T('The driving force points along the motion, not to the centre: at constant speed it only makes up for the air resistance.', 'Die Antriebskraft zeigt in Bewegungsrichtung, nicht zum Zentrum: Bei konstanter Geschwindigkeit gleicht sie nur den Luftwiderstand aus.')),
          o(T('The normal force of the road.', 'Die Normalkraft der Strasse.'), 'other', T('The normal force of a flat road points up: it balances the weight and cannot pull the car sideways.', 'Die Normalkraft einer flachen Strasse zeigt nach oben: Sie hält der Gewichtskraft das Gleichgewicht und kann das Auto nicht seitlich ziehen.')),
          o(T('A centrifugal force.', 'Eine Zentrifugalkraft.'), 'centrifugal', why.out),
        ],
      },
      moon: {
        obj: 'Moon', N: noun('m', 'Mond'), sym: 'G', title: T('The Moon', 'Der Mond'),
        text: T('The Moon goes round the Earth at constant speed on a (nearly) circular orbit.', 'Der Mond umkreist die Erde mit konstanter Geschwindigkeit auf einer (fast) kreisförmigen Bahn.'),
        label: T('The Moon on its orbit round the Earth', 'Der Mond auf seiner Bahn um die Erde'),
        force: T('the gravitational pull of the Earth on the Moon', 'die Gravitationskraft der Erde auf den Mond'),
        others: T('Far out in space, no other force of any size acts on the Moon.', 'Weit draussen im Weltraum wirkt keine andere nennenswerte Kraft auf den Mond.'),
        without: T('Without the pull of the Earth, the Moon would fly off along the tangent.', 'Ohne die Anziehung der Erde würde der Mond entlang der Tangente davonfliegen.'),
        options: (why) => [
          o(T('The gravitational pull of the Earth.', 'Die Gravitationskraft der Erde.'), 'ok', why.ok),
          o(T('A force along its orbit that keeps it moving.', 'Eine Kraft entlang der Bahn, die ihn in Bewegung hält.'), 'active-force', T('Moving on needs no force: in empty space the Moon keeps its speed by itself. A force along the orbit would make it faster.', 'Weiterbewegen braucht keine Kraft: Im leeren Weltraum behält der Mond sein Tempo von selbst. Eine Kraft entlang der Bahn würde ihn schneller machen.')),
          o(T('None: so far out in space, no force acts on it.', 'Keine: So weit draussen im Weltraum wirkt keine Kraft auf ihn.'), 'other', T('Without any force, the Moon would move in a straight line. The gravity of the Earth reaches far out into space and bends its path.', 'Ohne jede Kraft würde sich der Mond geradlinig bewegen. Die Gravitation der Erde reicht weit in den Weltraum hinaus und krümmt seine Bahn.')),
          o(T('A centrifugal force.', 'Eine Zentrifugalkraft.'), 'centrifugal', why.out),
        ],
      },
      stone: {
        obj: 'stone', N: noun('m', 'Stein'), sym: 'T', title: T('On a string', 'An der Schnur'),
        text: T('A stone tied to a string slides round a pin on smooth ice, at constant speed.', 'Ein Stein an einer Schnur gleitet auf glattem Eis mit konstanter Geschwindigkeit um einen Pfosten.'),
        label: T('Top view: a stone on a string sliding round a pin', 'Ansicht von oben: ein Stein an einer Schnur gleitet um einen Pfosten'),
        force: T('the pull of the string', 'die Seilkraft der Schnur'),
        others: T('Its weight and the push of the ice are vertical and cancel; friction is negligible.', 'Gewichtskraft und Normalkraft des Eises sind vertikal und heben sich auf; die Reibung ist vernachlässigbar.'),
        without: T('If the string broke, the stone would slide straight on along the tangent.', 'Risse die Schnur, würde der Stein geradeaus entlang der Tangente weitergleiten.'),
        options: (why) => [
          o(T('The pull of the string.', 'Die Seilkraft der Schnur.'), 'ok', why.ok),
          o(T('The push it was given at the start.', 'Der Stoss, den er am Anfang bekommen hat.'), 'impetus', T('The push is over: it is not stored in the stone. The stone keeps its speed by itself, and the string bends its path.', 'Der Stoss ist vorbei: Er ist nicht im Stein gespeichert. Der Stein behält sein Tempo von selbst, und die Schnur krümmt seine Bahn.')),
          o(T('Its weight.', 'Seine Gewichtskraft.'), 'other', T('The weight points down, not to the pin; the push of the ice balances it.', 'Die Gewichtskraft zeigt nach unten, nicht zum Pfosten; die Normalkraft des Eises hält ihr das Gleichgewicht.')),
          o(T('A centrifugal force.', 'Eine Zentrifugalkraft.'), 'centrifugal', why.out),
        ],
      },
      electron: {
        obj: 'electron', N: noun('n', 'Elektron'), sym: 'el', title: T('In the atom', 'Im Atom'),
        text: T('In a simple model of the hydrogen atom, the electron circles the nucleus, a proton, at constant speed.', 'In einem einfachen Modell des Wasserstoffatoms umkreist das Elektron den Kern, ein Proton, mit konstanter Geschwindigkeit.'),
        label: T('An electron circling a nucleus', 'Ein Elektron umkreist einen Kern'),
        force: T('the electric attraction of the nucleus', 'die elektrische Anziehung des Kerns'),
        others: T('The gravitational pull of the nucleus also points there, but it is about 10³⁹ times weaker: it plays no part.', 'Die Gravitationskraft des Kerns zeigt auch dorthin, ist aber etwa 10³⁹-mal schwächer: Sie spielt keine Rolle.'),
        without: T('Without the electric pull, the electron would fly off along the tangent.', 'Ohne die elektrische Anziehung würde das Elektron entlang der Tangente davonfliegen.'),
        options: (why) => [
          o(T('The electric attraction of the nucleus.', 'Die elektrische Anziehung des Kerns.'), 'ok', why.ok),
          o(T('The gravitational pull of the nucleus.', 'Die Gravitationskraft des Kerns.'), 'other', T('It does point to the nucleus, but it is about 10³⁹ times weaker than the electric pull: far too weak to matter.', 'Sie zeigt zwar zum Kern, ist aber etwa 10³⁹-mal schwächer als die elektrische Anziehung: viel zu schwach, um eine Rolle zu spielen.')),
          o(T('A force along its orbit that keeps it moving.', 'Eine Kraft entlang der Bahn, die es in Bewegung hält.'), 'active-force', T('Moving on needs no force; a force along the orbit would make the electron faster.', 'Weiterbewegen braucht keine Kraft; eine Kraft entlang der Bahn würde das Elektron schneller machen.')),
          o(T('A centrifugal force.', 'Eine Zentrifugalkraft.'), 'centrifugal', why.out),
        ],
      },
    };
  }

  function centre(r, p) {
    const key = p.scene || r.pick(['car', 'moon', 'stone', 'electron']), sc = scenes()[key], N = sc.N;
    const The = cap(T(`the ${sc.obj}`, N.nom)), acc = T(`the ${sc.obj}`, N.acc);
    const s = r.pick([1, -1]); // 1: clockwise in the picture
    const phi = (r.pick([0, 45, 90, 135, 180, 225, 270, 315]) * Math.PI) / 180;
    const C = [170, 130], R = 88;
    const pt = (a, rr = R) => [C[0] + rr * Math.cos(a), C[1] + rr * Math.sin(a)];
    const tan = (a) => [-s * Math.sin(a), s * Math.cos(a)], inw = (a) => [-Math.cos(a), -Math.sin(a)];
    const P = pt(phi), FS = F(sc.sym);

    // ---------------------------------------------------------- figure (top view)
    function body(x, y, a) {
      if (key === 'car') return `<g transform="rotate(${D.n((a * 180) / Math.PI + 90)} ${D.n(x)} ${D.n(y)})">${D.rect(x - 9, y - 15, 18, 30, 'obj', 4)}${D.rect(x - 7, y - 6 * s - 4, 14, 8, 'win', 2)}</g>`;
      if (key === 'moon') return D.ball(x, y, 10);
      if (key === 'electron') return `<circle class="mag-s" cx="${D.n(x)}" cy="${D.n(y)}" r="7"/>` + D.text(x, y + 4, '−', 'lbl small');
      return D.ball(x, y, 8);
    }
    function figure(o = {}) {
      let g = D.rect(0, 0, 340, 260, key === 'stone' ? 'ice' : key === 'car' ? 'table-top' : 'space', 6);
      if (key === 'car') g += `<circle class="channel" cx="${C[0]}" cy="${C[1]}" r="${R}"/>` + D.dot(C[0], C[1], 3, 'pt') + D.words(C[0], C[1] + 18, T('centre', 'Zentrum'));
      else g += `<circle class="trace" cx="${C[0]}" cy="${C[1]}" r="${R}" fill="none"/>`;
      if (key === 'moon') g += `<circle class="obj earth" cx="${C[0]}" cy="${C[1]}" r="26"/>` + D.words(C[0], C[1] + 44, T('Earth', 'Erde'));
      if (key === 'electron') g += `<circle class="mag-n" cx="${C[0]}" cy="${C[1]}" r="10"/>` + D.text(C[0], C[1] + 4, '+', 'lbl small');
      if (key === 'stone') g += D.dot(C[0], C[1], 3.5, 'pin') + D.line(C[0], C[1], P[0], P[1], 'cable');
      if (o.turn) [-0.9, -1.8].forEach((da) => {
        const a = phi + s * da, [x, y] = pt(a), t = tan(a);
        g += D.ghost(body(x, y, a)) + D.arrow(x, y, x + 40 * t[0], y + 40 * t[1], 'v', '');
      });
      g += body(P[0], P[1], phi) + D.text(P[0] - 22 * inw(phi)[0] - 10 * tan(phi)[0], P[1] - 22 * inw(phi)[1] - 10 * tan(phi)[1] + 4, 'P', 'lbl');
      const t = tan(phi), n = inw(phi);
      g += D.arrow(P[0] + 12 * t[0], P[1] + 12 * t[1], P[0] + 54 * t[0], P[1] + 54 * t[1], 'v', 'v');
      if (o.net) g += D.arrow(P[0] + 12 * n[0], P[1] + 12 * n[1], P[0] + 50 * n[0], P[1] + 50 * n[1], 'net', FL('net'), { at: [P[0] + 50 * n[0] + 10 * t[0], P[1] + 50 * n[1] + 10 * t[1] + 12], anchor: 'middle' });
      if (o.force) g += D.arrow(P[0] + 12 * n[0], P[1] + 12 * n[1], P[0] + 50 * n[0], P[1] + 50 * n[1], 'f', FL(sc.sym), { at: [P[0] + 50 * n[0] - 12 * t[0], P[1] + 50 * n[1] - 12 * t[1] + 4], anchor: 'middle' });
      if (o.tangent) g += D.line(P[0], P[1], P[0] + 150 * t[0], P[1] + 150 * t[1], 'guide');
      return D.svg(340, 260, g, sc.label);
    }

    // ---------------------------------------------------------- questions
    const turns = T(`${The} keeps its speed, but its direction of motion changes all the time.`, `${The} behält sein Tempo, aber die Bewegungsrichtung ändert sich ständig.`);
    const inward = T('The velocity changes towards the inside of the curve, so the acceleration — and with it the net force — points to the centre.', 'Die Geschwindigkeit ändert sich zur Innenseite der Kurve hin, also zeigt die Beschleunigung — und damit die resultierende Kraft — zum Zentrum.');
    const noOut = T(`No force pushes ${acc} outward: there is no “centrifugal force”. ${sc.without}`, `Keine Kraft drückt ${N.acc} nach aussen: Es gibt keine „Zentrifugalkraft“. ${sc.without}`);
    const why = {
      ok: T(`Right: ${sc.force} points to the centre; it provides the net force. ${sc.others}`, `Richtig: ${cap(sc.force)} zeigt zum Zentrum; sie liefert die resultierende Kraft. ${sc.others}`),
      out: T(`${noOut} The force towards the centre is ${sc.force}.`, `${noOut} Die Kraft zum Zentrum ist ${sc.force}.`),
    };
    const questions = [
      q(r, 'net', T(`Which way does the net force on ${acc} point at P?`, `Wohin zeigt die resultierende Kraft auf ${N.acc} im Punkt P?`), [
        o(T('Towards the centre of the circle.', 'Zum Zentrum des Kreises.'), 'ok', T(`Right: ${turns} ${inward}`, `Richtig: ${turns} ${inward}`)),
        o(T('Forward, along its velocity.', 'Nach vorn, in Richtung der Geschwindigkeit.'), 'active-force', T(`Moving on needs no force. A net force forward would make ${acc} faster, but its speed stays the same. ${inward}`, `Weiterbewegen braucht keine Kraft. Eine resultierende Kraft nach vorn würde ${N.acc} schneller machen, aber das Tempo bleibt gleich. ${inward}`)),
        o(T('Outward, away from the centre.', 'Nach aussen, weg vom Zentrum.'), 'centrifugal', T(`${noOut} ${inward}`, `${noOut} ${inward}`)),
        o(T('There is none, since its speed is constant.', 'Es gibt keine, weil das Tempo konstant ist.'), 'constant-speed', T(`${turns} So its velocity changes, and that takes a net force. ${inward}`, `${turns} Die Geschwindigkeit ändert sich also, und dazu braucht es eine resultierende Kraft. ${inward}`)),
      ]),
      q(r, 'source', T(`Which force provides this net force towards the centre?`, `Welche Kraft liefert diese resultierende Kraft zum Zentrum?`), sc.options(why)),
    ];

    const steps = [
      { title: T('The velocity turns', 'Die Geschwindigkeit dreht sich'), figure: figure({ turn: true, net: true }),
        text: T(`${turns} ${inward} Second law: ${F('net')} = <i>m·a</i>, towards the centre.`, `${turns} ${inward} Zweites Newtonsches Gesetz: ${F('net')} = <i>m·a</i>, zum Zentrum hin.`) },
      { title: T('Which force points there?', 'Welche Kraft zeigt dorthin?'), figure: figure({ force: true }),
        text: T(`List the forces on ${acc}: ${sc.force} (${FS}) points to the centre. ${sc.others} So ${FS} is the net force.`, `Zähle die Kräfte auf ${N.acc} auf: ${cap(sc.force)} (${FS}) zeigt zum Zentrum. ${sc.others} Also ist ${FS} die resultierende Kraft.`) },
      { title: T('Nothing pushes outward', 'Nichts drückt nach aussen'), figure: figure({ force: true, tangent: true }),
        text: T(`The force towards the centre is not an extra force: it is ${sc.force}. ${noOut}`, `Die Kraft zum Zentrum ist keine zusätzliche Kraft: Es ist ${sc.force}. ${noOut}`) },
    ];

    return {
      title: sc.title,
      situation: `<p>${sc.text}</p>`,
      figure: figure(),
      questions,
      hints: [
        T(`${The} moves at constant speed. Does its velocity change?`, `${The} bewegt sich mit konstantem Tempo. Ändert sich seine Geschwindigkeit?`),
        T('Plan: the change of velocity gives the direction of the acceleration, the second law the direction of the net force; then look for the force that points that way.', 'Plan: Die Änderung der Geschwindigkeit ergibt die Richtung der Beschleunigung, das zweite Gesetz die Richtung der resultierenden Kraft; suche dann die Kraft, die in diese Richtung zeigt.'),
        T(`Second law: ${F('net')} = <i>m·a</i>. On a circle at constant speed, the acceleration points to the centre.`, `Zweites Gesetz: ${F('net')} = <i>m·a</i>. Auf einer Kreisbahn mit konstantem Tempo zeigt die Beschleunigung zum Zentrum.`),
        T(`Here: which body pulls or pushes ${acc} towards the centre? ${sc.others}`, `Hier: Welcher Körper zieht oder drückt ${N.acc} zum Zentrum? ${sc.others}`),
      ],
      steps,
    };
  }

  register('inertia', 'balance', balance, { phase: 'constant' });
  register('force', 'balance', balance);
  register('force', 'thruster', thruster);
  register('force', 'two-forces', twoForces);
  register('force', 'centre', centre);
})(typeof window !== 'undefined' ? window : globalThis);
