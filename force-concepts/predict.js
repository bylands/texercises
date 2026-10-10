// Predict and explain: a prediction and the reason behind it, both chosen from options. A right
// prediction with a wrong reason counts as wrong, and the feedback says so. A ball shot straight
// up from a moving cart, a pendulum whose string is cut, and the net force on a ball rolling up
// and down a ramp.
(function (root) {
  'use strict';

  const FC = root.FC || require('./core.js');
  const D = root.Draw || require('./draw.js');
  const { T, FL, o, two, register } = FC;
  const RIGHT = () => T('Right.', 'Richtig.');

  // ================================================================ cart with a ball launcher
  function cartLauncher(r, p) {
    const phase = p.phase || r.pick(['constant', 'speeding', 'slowing']);
    const c = { constant: 0, speeding: 0.3, slowing: -0.3 }[phase]; // extra cart travel, as a fraction
    const right = { constant: 'in', speeding: 'behind', slowing: 'front' }[phase];

    // ---------------------------------------------------------- figure
    const yT = 170, x0 = 70, W = 230;
    const cart = (x, cls) => {
      const g = D.rect(x - 34, yT - 30, 68, 22, 'obj', 3) + D.ball(x - 20, yT - 6, 6, 'wheel') + D.ball(x + 20, yT - 6, 6, 'wheel') + D.rect(x - 5, yT - 50, 10, 20, 'solid', 1);
      return cls ? D.ghost(g) : g;
    };
    function figure(o = {}) {
      let g = D.line(0, yT, 420, yT, 'gline');
      if (o.strobe) {
        const us = [0, 0.25, 0.5, 0.75, 1];
        g += D.poly(Array.from({ length: 21 }, (z, j) => { const u = j / 20; return [x0 + W * u, yT - 56 - 150 * u * (1 - u) * 1.0]; }), 'trace');
        us.forEach((u, k) => {
          const xb = x0 + W * u, yb = yT - 56 - 150 * u * (1 - u), xc = x0 + W * (u + c * u * u);
          g += k === us.length - 1 ? cart(xc) : cart(xc, true);
          g += k === us.length - 1 ? D.ball(xb, yb, 7) : D.ghost(D.ball(xb, yb, 7));
        });
        const land = x0 + W, cl = x0 + W * (1 + c);
        if (Math.abs(land - cl) > 1) g += D.line(land, yT + 8, cl, yT + 8, 'guide') + D.text((land + cl) / 2, yT + 22, T('gap', 'Abstand'), 'txt');
        return D.svg(420, 200, g, T('The ball and the cart at equal time intervals', 'Ball und Wagen in gleichen Zeitabständen'));
      }
      g += cart(x0) + D.ball(x0, yT - 58, 7) + D.arrow(x0 + 40, yT - 18, x0 + 90, yT - 18, 'v', 'v');
      g += D.arrow(x0 + 14, yT - 58, x0 + 14, yT - 100, 'v', T('launch', 'Abschuss'), { cls: 'alt', at: [x0 + 20, yT - 92], anchor: 'start' });
      if (phase === 'speeding') g += D.arrow(x0 - 80, yT - 20, x0 - 36, yT - 20, 'f', 'F');
      if (phase === 'slowing') g += D.words(x0, yT + 22, T('braking', 'bremst'));
      return D.svg(420, 200, g, T('A cart with a ball launcher', 'Ein Wagen mit Ballwerfer'));
    }

    // ---------------------------------------------------------- the two tiers
    const cartDoes = { constant: T('keeps its speed', 'behält seine Geschwindigkeit'), speeding: T('gets faster', 'wird schneller'), slowing: T('gets slower', 'wird langsamer') }[phase];
    const deHere = { constant: 'behält der Wagen seine Geschwindigkeit', speeding: 'wird der Wagen schneller', slowing: 'wird der Wagen langsamer' }[phase]; // after “Hier”
    const keeps = T('After launch the ball keeps the horizontal velocity the cart had at that moment: no horizontal force acts on it.', 'Nach dem Abschuss behält der Ball die horizontale Geschwindigkeit, die der Wagen in diesem Moment hatte: Horizontal wirkt keine Kraft auf ihn.');
    const whereWhy = {
      in: T(`${keeps} The cart ${cartDoes}${phase === 'constant' ? ' too' : ''}, so ${phase === 'constant' ? 'both stay level horizontally: the ball drops back into the launcher' : `the cart ${phase === 'speeding' ? 'pulls ahead of' : 'falls behind'} the ball`}.`,
        `${keeps} Der Wagen ${cartDoes}, also ${phase === 'constant' ? 'bleiben beide horizontal gleichauf: Der Ball fällt zurück in den Werfer' : `${phase === 'speeding' ? 'fährt der Wagen dem Ball davon' : 'bleibt der Wagen hinter dem Ball zurück'}`}.`),
    };
    const preds = [
      o(T('Back into the launcher.', 'Zurück in den Werfer.'), right === 'in' ? 'ok' : 'other', whereWhy.in),
      o(T('Behind the launcher.', 'Hinter dem Werfer.'), right === 'behind' ? 'ok' : phase === 'constant' ? 'active-force' : 'other',
        right === 'behind' ? whereWhy.in : T(`Nothing has to carry the ball forward: it keeps its horizontal velocity. ${whereWhy.in}`, `Nichts muss den Ball vorwärts tragen: Er behält seine horizontale Geschwindigkeit. ${whereWhy.in}`)),
      o(T('In front of the launcher.', 'Vor dem Werfer.'), right === 'front' ? 'ok' : 'other', whereWhy.in),
    ];
    const R = {
      constant: T('The ball keeps the cart’s horizontal velocity, and the cart keeps it too.', 'Der Ball behält die horizontale Geschwindigkeit des Wagens, und der Wagen behält sie auch.'),
      speeding: T('The ball keeps the horizontal velocity the cart had at launch, while the cart gets faster.', 'Der Ball behält die horizontale Geschwindigkeit, die der Wagen beim Abschuss hatte, während der Wagen schneller wird.'),
      slowing: T('The ball keeps the horizontal velocity the cart had at launch, while the cart gets slower.', 'Der Ball behält die horizontale Geschwindigkeit, die der Wagen beim Abschuss hatte, während der Wagen langsamer wird.'),
    };
    const reasons = [o(R[phase], 'ok', `${RIGHT()} ${whereWhy.in}`)];
    const wrongs = [
      ...['constant', 'speeding', 'slowing'].filter((k) => k !== phase).map((k) => o(R[k], 'other', T(`That describes a cart that ${({ constant: 'keeps its speed', speeding: 'gets faster', slowing: 'gets slower' })[k]}. Here the cart ${cartDoes}.`, `Das beschreibt einen Wagen, der ${({ constant: 'seine Geschwindigkeit behält', speeding: 'schneller wird', slowing: 'langsamer wird' })[k]}. Hier ${deHere}.`))),
      o(T('Once the ball has left the cart, nothing carries it forward any more.', 'Sobald der Ball den Wagen verlassen hat, trägt ihn nichts mehr vorwärts.'), 'active-force', T(`The ball does not need anything to carry it forward: it keeps its horizontal velocity (inertia). ${whereWhy.in}`, `Der Ball braucht nichts, das ihn vorwärts trägt: Er behält seine horizontale Geschwindigkeit (Trägheit). ${whereWhy.in}`)),
      o(T('The ball’s forward motion slowly wears off in the air.', 'Die Vorwärtsbewegung des Balls lässt in der Luft langsam nach.'), 'impetus', T(`Nothing slows the ball down horizontally (air resistance negligible). ${whereWhy.in}`, `Horizontal bremst nichts den Ball (Luftwiderstand vernachlässigbar). ${whereWhy.in}`)),
    ];
    reasons.push(...r.shuffle(wrongs).slice(0, 3));
    const qu = two(r, 'land', T('Where does the ball land?', 'Wo landet der Ball?'), T('Why?', 'Warum?'), preds, reasons);

    const steps = [
      { title: T('The ball', 'Der Ball'), figure: figure({ strobe: true }),
        text: T(`At launch the ball moves forward with the cart and gets an extra velocity straight up. In the air only gravity acts (vertically): horizontally the ball keeps the velocity it had at launch.`,
          `Beim Abschuss bewegt sich der Ball mit dem Wagen vorwärts und bekommt zusätzlich eine Geschwindigkeit senkrecht nach oben. In der Luft wirkt nur die Schwerkraft (vertikal): Horizontal behält der Ball die Geschwindigkeit, die er beim Abschuss hatte.`) },
      { title: T('The cart', 'Der Wagen'), figure: figure({ strobe: true }),
        text: { constant: T('No horizontal force acts on the cart either: it keeps its speed and stays exactly below the ball. The ball lands back in the launcher.', 'Auch auf den Wagen wirkt horizontal keine Kraft: Er behält seine Geschwindigkeit und bleibt genau unter dem Ball. Der Ball landet wieder im Werfer.'),
          speeding: T('The force keeps speeding the cart up, but it does not act on the ball in the air. The cart pulls ahead, and the ball lands behind the launcher.', 'Die Kraft beschleunigt den Wagen weiter, wirkt aber nicht auf den Ball in der Luft. Der Wagen fährt davon, und der Ball landet hinter dem Werfer.'),
          slowing: T('The brakes slow the cart down, but not the ball in the air. The cart falls behind, and the ball lands in front of the launcher.', 'Die Bremsen verlangsamen den Wagen, aber nicht den Ball in der Luft. Der Wagen bleibt zurück, und der Ball landet vor dem Werfer.') }[phase] },
    ];
    return {
      title: T('Ball from a moving cart', 'Ball vom fahrenden Wagen'),
      situation: T(`<p>A cart rolls along a level track. A launcher on the cart shoots a ball straight up (as seen from the cart). ${{ constant: 'The cart rolls on at constant speed (friction negligible).', speeding: 'While the ball is in the air, a constant force keeps pushing the cart forward.', slowing: 'Right after the launch, the cart brakes gently.' }[phase]} Air resistance is negligible.</p>`,
        `<p>Ein Wagen rollt auf einer ebenen Schiene. Ein Werfer auf dem Wagen schiesst einen Ball senkrecht nach oben (vom Wagen aus gesehen). ${{ constant: 'Der Wagen rollt mit konstanter Geschwindigkeit weiter (Reibung vernachlässigbar).', speeding: 'Während der Ball in der Luft ist, schiebt eine konstante Kraft den Wagen weiter vorwärts.', slowing: 'Direkt nach dem Abschuss bremst der Wagen sanft.' }[phase]} Der Luftwiderstand ist vernachlässigbar.</p>`),
      figure: figure(),
      questions: [qu],
      hints: [
        T('Treat ball and cart separately. Which horizontal forces act on the ball while it is in the air? Which on the cart?', 'Betrachte Ball und Wagen getrennt. Welche horizontalen Kräfte wirken auf den Ball, solange er in der Luft ist? Welche auf den Wagen?'),
        T('Plan: compare the horizontal motion of the ball with that of the cart during the flight.', 'Plan: Vergleiche während des Flugs die horizontale Bewegung des Balls mit der des Wagens.'),
        T('First law: without a horizontal force, the horizontal velocity stays the same.', 'Erstes Newtonsches Gesetz: Ohne horizontale Kraft bleibt die horizontale Geschwindigkeit gleich.'),
        T(`Here the ball keeps the cart’s velocity at launch, and the cart ${cartDoes}.`, `Hier behält der Ball die Geschwindigkeit des Wagens beim Abschuss, und der Wagen ${cartDoes}.`),
      ],
      steps,
    };
  }

  // ================================================================ pendulum: the string is cut
  const POS = { bottom: 0, mid: 25, top: 45 }; // angle from the vertical, swinging to the right

  function pendulumCut(r, p) {
    const pos = p.pos || r.pick(['bottom', 'mid', 'top']);
    const th = (POS[pos] * Math.PI) / 180, amp = (45 * Math.PI) / 180;
    const speed = Math.sqrt(Math.max(0, Math.cos(th) - Math.cos(amp)) / (1 - Math.cos(amp)));
    const tang = [Math.cos(th), -Math.sin(th)], rad = [Math.sin(th), Math.cos(th)];

    // a small pendulum picture with a path from the bob
    function scene(W, H, pv, L, path, o = {}) {
      const P = [pv[0] + L * rad[0], pv[1] + L * rad[1]];
      const arc = (a0, a1) => `M${D.n(pv[0] + L * Math.sin(a0))} ${D.n(pv[1] + L * Math.cos(a0))} A${L} ${L} 0 0 0 ${D.n(pv[0] + L * Math.sin(a1))} ${D.n(pv[1] + L * Math.cos(a1))}`;
      let g = D.ceiling(pv[0] - 30, pv[0] + 30, pv[1]) + D.path(arc(-amp, amp), 'trace') + D.ground(0, W, H - 8);
      if (o.string !== false) g += D.line(pv[0], pv[1], P[0], P[1], 'cable');
      if (path) g += D.path(path(P, L), 'opt-path');
      if (o.vel && speed > 0.01) g += D.arrow(P[0], P[1], P[0] + 40 * speed * tang[0], P[1] + 40 * speed * tang[1], 'v', 'v');
      if (o.vel && speed <= 0.01) g += D.text(P[0] + 12, P[1] - 6, 'v = 0', 'lbl v', 'start');
      if (o.force) g += D.arrow(P[0], P[1], P[0], P[1] + 34, 'f', FL('G'));
      return g + D.ball(P[0], P[1], o.small ? 5 : 8) + (o.label ? D.text(P[0] - 12, P[1] + 4, 'P', 'lbl', 'end') : '');
    }
    const ground = (H) => H - 8;
    const parabola = (H, s0) => (P) => {
      const v = [s0 * tang[0], s0 * tang[1]], g = 90, pts = [];
      for (let t = 0; t < 3; t += 0.02) { const y = P[1] + v[1] * t + 0.5 * g * t * t; pts.push([P[0] + v[0] * t, Math.min(y, ground(H))]); if (y >= ground(H)) break; }
      return 'M' + pts.map(([x, y]) => `${D.n(x)} ${D.n(y)}`).join(' L');
    };
    const PATHS = {
      down: (H) => (P) => `M${D.n(P[0])} ${D.n(P[1])} V${ground(H)}`,
      throwOff: (H) => parabola(H, 70 * Math.max(speed, 0.6)),
      arc: () => (P, L) => { const pv = [P[0] - L * rad[0], P[1] - L * rad[1]], a1 = th + 0.5; return `M${D.n(P[0])} ${D.n(P[1])} A${L} ${L} 0 0 0 ${D.n(pv[0] + L * Math.sin(a1))} ${D.n(pv[1] + L * Math.cos(a1))}`; },
      outward: () => (P) => `M${D.n(P[0])} ${D.n(P[1])} L${D.n(P[0] + 30 * rad[0] + 14 * tang[0])} ${D.n(P[1] + 30 * rad[1] + 14 * tang[1])}`,
      straight: () => (P) => `M${D.n(P[0])} ${D.n(P[1])} L${D.n(P[0] + 60 * tang[0])} ${D.n(P[1] + 60 * tang[1])}`,
    };
    const pic = (k) => D.svg(150, 150, scene(150, 150, [60, 12], 74, PATHS[k](150), { string: false, small: true }), T('path', 'Bahn'));
    function figure(o = {}) {
      const path = o.path ? PATHS[o.path](250) : null;
      return D.svg(320, 250, scene(320, 250, [140, 26], 140, path, { vel: !o.path || o.vel, label: true, force: o.force, string: !o.path }), T('A pendulum; the string is cut when the bob is at P', 'Ein Pendel; die Schnur wird durchgeschnitten, wenn der Körper in P ist'));
    }

    const where = { bottom: T('at the lowest point, where it moves horizontally and fastest', 'im tiefsten Punkt, wo er sich horizontal und am schnellsten bewegt'),
      mid: T('on its way up, moving up and to the right', 'auf dem Weg nach oben, wenn er sich schräg nach rechts oben bewegt'),
      top: T('at the right end of the swing, where it turns round (its velocity is zero there)', 'am rechten Ende der Schwingung, wo er umkehrt (seine Geschwindigkeit ist dort null)') }[pos];
    const rule = T('From the moment the string is cut, only gravity acts. The bob keeps the velocity it has at that moment and falls like a thrown ball.', 'Vom Moment an, in dem die Schnur durchgeschnitten wird, wirkt nur die Schwerkraft. Der Körper behält die Geschwindigkeit, die er in diesem Moment hat, und fällt wie ein geworfener Ball.');
    const result = { bottom: T('Its velocity is horizontal: it flies off on a parabola that starts horizontally.', 'Seine Geschwindigkeit ist horizontal: Er fliegt auf einer Parabel davon, die horizontal beginnt.'),
      mid: T('Its velocity points along the circle, up and to the right: it flies off along a parabola that starts in this direction, rises a little and then falls.', 'Seine Geschwindigkeit zeigt entlang des Kreises nach rechts oben: Er fliegt auf einer Parabel in diese Richtung davon, steigt noch etwas und fällt dann.'),
      top: T('Its velocity is zero at this moment: it falls straight down.', 'Seine Geschwindigkeit ist in diesem Moment null: Er fällt senkrecht hinunter.') }[pos];
    const okPath = { bottom: 'throwOff', mid: 'throwOff', top: 'down' }[pos];
    const predCodes = { down: 'other', throwOff: 'other', arc: 'circular-impetus', outward: 'centrifugal', straight: 'other' };
    const keysFor = { bottom: ['throwOff', 'down', 'arc', 'straight'], mid: ['throwOff', 'down', 'arc', 'outward'], top: ['down', 'throwOff', 'arc', 'outward'] }[pos];
    const pathWords = { down: T('straight down', 'senkrecht hinunter'), throwOff: pos === 'top' ? T('off sideways on a curve', 'seitlich auf einer Kurve davon') : T('on a parabola, starting along its velocity', 'auf einer Parabel, die in Richtung der Geschwindigkeit beginnt'),
      arc: T('on along the circle', 'weiter auf dem Kreis'), outward: T('outward, away from the pivot', 'nach aussen, weg vom Aufhängepunkt'), straight: T('in a straight line along its velocity', 'geradlinig in Richtung der Geschwindigkeit') };
    const predWhy = {
      down: T(`${rule} ${result}`, `${rule} ${result}`),
      throwOff: T(`${rule} ${result}`, `${rule} ${result}`),
      arc: T(`Nothing keeps the bob on the circle once the string is cut. ${rule} ${result}`, `Nichts hält den Körper auf dem Kreis, sobald die Schnur durch ist. ${rule} ${result}`),
      outward: T(`There is no force pushing the bob outward. ${rule} ${result}`, `Keine Kraft drückt den Körper nach aussen. ${rule} ${result}`),
      straight: T(`Gravity bends the path down from the first moment. ${rule} ${result}`, `Die Schwerkraft krümmt die Bahn vom ersten Moment an nach unten. ${rule} ${result}`),
    };
    const preds = keysFor.map((k) => o(pic(k), k === okPath ? 'ok' : predCodes[k], k === okPath ? `${RIGHT()} ${rule} ${result}` : predWhy[k], pathWords[k]));
    const reasons = [
      o(T('It keeps the velocity it has at that moment, and from then on only gravity acts.', 'Er behält die Geschwindigkeit, die er in diesem Moment hat, und von da an wirkt nur die Schwerkraft.'), 'ok', `${RIGHT()} ${rule} ${result}`),
      o(T('Once the string is cut, only gravity acts, so it falls straight down.', 'Sobald die Schnur durch ist, wirkt nur die Schwerkraft, also fällt er senkrecht hinunter.'), 'other',
        pos === 'top' ? T('The prediction is right here, but only because the velocity is zero at this point. Only gravity acting does not mean falling straight down: a body that is moving keeps its velocity and falls on a parabola.', 'Die Vorhersage stimmt hier, aber nur, weil die Geschwindigkeit in diesem Punkt null ist. Dass nur die Schwerkraft wirkt, heisst nicht, dass der Körper senkrecht fällt: Ein Körper in Bewegung behält seine Geschwindigkeit und fällt auf einer Parabel.')
          : T(`Only gravity acts, yes — but the bob keeps its velocity. ${result}`, `Ja, nur die Schwerkraft wirkt — aber der Körper behält seine Geschwindigkeit. ${result}`)),
      o(T('It keeps swinging along the circle for a moment.', 'Er schwingt noch einen Moment auf dem Kreis weiter.'), 'circular-impetus', predWhy.arc),
      o(T('The centrifugal force flings it outward.', 'Die Zentrifugalkraft schleudert ihn nach aussen.'), 'centrifugal', predWhy.outward),
    ];

    return {
      title: T('Cutting the pendulum string', 'Pendelschnur durchschneiden'),
      situation: T(`<p>A heavy bob swings on a string. The string is cut when the bob is at P, ${where}. Air resistance is negligible.</p>`, `<p>Ein schwerer Pendelkörper schwingt an einer Schnur. Die Schnur wird durchgeschnitten, wenn der Körper in P ist, ${where}. Der Luftwiderstand ist vernachlässigbar.</p>`),
      figure: figure(),
      questions: [two(r, 'path', T('Which path does the bob follow after the string is cut?', 'Welche Bahn beschreibt der Körper, nachdem die Schnur durchgeschnitten wurde?'), T('Why?', 'Warum?'), preds, reasons, true)],
      hints: [
        T('Which forces act on the bob before the string is cut, and which after?', 'Welche Kräfte wirken auf den Körper, bevor die Schnur durchgeschnitten wird, und welche danach?'),
        T('Plan: find the velocity at P (direction and whether it is zero), then use what you know about bodies that move under gravity alone.', 'Plan: Bestimme die Geschwindigkeit in P (Richtung, und ob sie null ist), dann nutze, was du über Körper weisst, auf die nur die Schwerkraft wirkt.'),
        T('Under gravity alone, a body keeps its horizontal velocity and falls with acceleration g: from rest straight down, otherwise on a parabola.', 'Wirkt nur die Schwerkraft, behält ein Körper seine horizontale Geschwindigkeit und fällt mit der Beschleunigung g: aus der Ruhe senkrecht, sonst auf einer Parabel.'),
        T(`Here at P the velocity is ${speed > 0.01 ? (pos === 'bottom' ? 'horizontal' : 'along the circle, up and to the right') : 'zero'}.`, `Hier in P ist die Geschwindigkeit ${speed > 0.01 ? (pos === 'bottom' ? 'horizontal' : 'entlang des Kreises nach rechts oben gerichtet') : 'null'}.`),
      ],
      steps: [
        { title: T('At the moment of the cut', 'Im Moment des Schnitts'), figure: figure({ force: true }),
          text: T(`Before the cut, the string pulls the bob toward the pivot and keeps it on the circle. After the cut, only the weight acts. ${speed > 0.01 ? 'At P the bob moves along the circle (velocity arrow).' : 'At P the bob turns round: its velocity is zero.'}`,
            `Vor dem Schnitt zieht die Schnur den Körper zum Aufhängepunkt und hält ihn auf dem Kreis. Nach dem Schnitt wirkt nur noch die Gewichtskraft. ${speed > 0.01 ? 'In P bewegt sich der Körper entlang des Kreises (Geschwindigkeitspfeil).' : 'In P kehrt der Körper um: Seine Geschwindigkeit ist null.'}`) },
        { title: T('The path', 'Die Bahn'), figure: figure({ path: okPath, vel: true }), text: `${rule} ${result}` },
      ],
    };
  }

  // ================================================================ ramp: net force while rolling up and down
  function ramp(r, p) {
    const phase = p.phase || r.pick(['rising', 'top', 'falling']);
    const ang = 22 * Math.PI / 180, A = [40, 210], Bp = [360, 210 - 320 * Math.tan(ang)];
    const u = [Math.cos(ang), -Math.sin(ang)], nrm = [Math.sin(ang), Math.cos(ang)]; // up the ramp; out of the surface (svg: up is −y)
    const s = { rising: 0.4, top: 0.72, falling: 0.4 }[phase];
    const P = [A[0] + (Bp[0] - A[0]) * s - 11 * nrm[0], A[1] + (Bp[1] - A[1]) * s - 11 * nrm[1]];
    function figure(o = {}) {
      let g = `<polygon class="solid" points="${A[0]},${A[1]} ${D.n(Bp[0])},${D.n(Bp[1])} ${Bp[0]},${A[1]}"/>` + D.ground(0, 400, A[1]);
      g += D.ball(P[0], P[1], 11) + D.text(P[0] - 14, P[1] - 12, 'P', 'lbl', 'end');
      if (!o.forces) {
        if (phase === 'top') g += D.text(P[0] + 14, P[1] - 14, 'v = 0', 'lbl v', 'start');
        else { const d = phase === 'rising' ? 1 : -1; g += D.arrow(P[0] + 14 * d * u[0], P[1] + 14 * d * u[1], P[0] + 56 * d * u[0], P[1] + 56 * d * u[1], 'v', 'v'); }
      } else {
        const Gl = 50, Nl = Gl * Math.cos(ang), Sl = Gl * Math.sin(ang);
        g += D.arrow(P[0], P[1], P[0], P[1] + Gl, 'f', FL('G'));
        g += D.arrow(P[0], P[1], P[0] - Nl * nrm[0], P[1] - Nl * nrm[1], 'f', FL('N'));
        g += D.arrow(P[0] - 22 * nrm[0], P[1] - 22 * nrm[1], P[0] - 22 * nrm[0] - Sl * u[0] * 1.6, P[1] - 22 * nrm[1] - Sl * u[1] * 1.6, 'net', FL('net'));
      }
      return D.svg(400, 230, g, T('A ball on a ramp at the point P', 'Eine Kugel auf einer Rampe im Punkt P'));
    }
    const motion = { rising: T('rolls up the ramp and gets slower', 'rollt die Rampe hinauf und wird langsamer'), top: T('turns round at its highest point (its velocity is zero there)', 'kehrt im höchsten Punkt um (ihre Geschwindigkeit ist dort null)'), falling: T('rolls back down and gets faster', 'rollt wieder hinunter und wird schneller') }[phase];
    const deMotion = { rising: 'rollt die Kugel die Rampe hinauf und wird langsamer', top: 'kehrt die Kugel im höchsten Punkt um (ihre Geschwindigkeit ist dort null)', falling: 'rollt die Kugel wieder hinunter und wird schneller' }[phase]; // after “Hier” or “Im Punkt P”
    const rule = T('The ball slows down on the way up and speeds up on the way down: its acceleration points down the ramp all the time — also at the top, where its velocity is changing from up to down. So the net force points down the ramp.',
      'Die Kugel wird auf dem Weg nach oben langsamer und auf dem Weg nach unten schneller: Ihre Beschleunigung zeigt die ganze Zeit die Rampe hinunter — auch oben, wo sich ihre Geschwindigkeit von hinauf nach hinunter ändert. Also zeigt die resultierende Kraft die Rampe hinunter.');
    const parts = T('Weight (straight down) and the push of the ramp (at right angles to it) add up to a net force along the ramp, downward.', 'Gewichtskraft (senkrecht nach unten) und Normalkraft der Rampe (senkrecht zur Rampe) ergeben zusammen eine resultierende Kraft entlang der Rampe nach unten.');
    const preds = [
      o(T('Down the ramp.', 'Die Rampe hinunter.'), 'ok', `${RIGHT()} ${rule}`),
      o(T('Up the ramp.', 'Die Rampe hinauf.'), phase === 'rising' ? 'active-force' : 'other', `${phase === 'rising' ? T('Rolling up does not need a net force up the ramp. ', 'Um hinaufzurollen, braucht es keine resultierende Kraft die Rampe hinauf. ') : ''}${rule}`),
      o(T('It is zero.', 'Sie ist null.'), phase === 'top' ? 'rest-no-force' : 'other', rule),
      o(T('Straight down.', 'Senkrecht nach unten.'), 'other', `${parts} ${rule}`),
    ];
    const reasons = [
      o(T('Its acceleration points down the ramp the whole time, so the net force does too.', 'Ihre Beschleunigung zeigt die ganze Zeit die Rampe hinunter, also auch die resultierende Kraft.'), 'ok', `${RIGHT()} ${rule}`),
      o(T('It moves up the ramp, so the net force must point up the ramp.', 'Sie bewegt sich die Rampe hinauf, also muss die resultierende Kraft die Rampe hinauf zeigen.'), 'active-force', rule),
      o(T('At the top it is at rest, so no net force acts there.', 'Oben ist sie in Ruhe, also wirkt dort keine resultierende Kraft.'), 'rest-no-force', rule),
      o(T('Only the weight counts, and it points straight down.', 'Nur die Gewichtskraft zählt, und die zeigt senkrecht nach unten.'), 'other', `${parts} ${rule}`),
      o(T('The push of the throw is used up at the top.', 'Der Schwung des Anstossens ist oben aufgebraucht.'), 'impetus', T(`There is no stored push: after the start only the weight and the push of the ramp act. ${rule}`, `Es gibt keinen gespeicherten Schwung: Nach dem Anstossen wirken nur Gewichtskraft und Normalkraft der Rampe. ${rule}`)),
    ];
    const must = phase === 'rising' ? 1 : phase === 'top' ? 2 : 3;
    const pickReasons = [reasons[0], reasons[must], ...r.shuffle(reasons.slice(1).filter((x, i) => i + 1 !== must)).slice(0, 2)];
    return {
      title: T('Up and down the ramp', 'Die Rampe hinauf und hinunter'),
      situation: T(`<p>A ball is given a push up a straight ramp. It rolls up, stops and rolls back down. Friction and air resistance are negligible. At the point P, the ball ${motion}.</p>`, `<p>Eine Kugel wird eine gerade Rampe hinauf angestossen. Sie rollt hinauf, hält an und rollt wieder hinunter. Reibung und Luftwiderstand sind vernachlässigbar. Im Punkt P ${deMotion}.</p>`),
      figure: figure(),
      questions: [two(r, 'net', T('Which way does the net force on the ball point at P?', 'Wohin zeigt die resultierende Kraft auf die Kugel im Punkt P?'), T('Why?', 'Warum?'), preds, pickReasons)],
      hints: [
        T('How does the velocity of the ball change on the way up, at the top and on the way down?', 'Wie ändert sich die Geschwindigkeit der Kugel auf dem Weg nach oben, oben und auf dem Weg nach unten?'),
        T('Plan: change of velocity → direction of the acceleration → direction of the net force.', 'Plan: Änderung der Geschwindigkeit → Richtung der Beschleunigung → Richtung der resultierenden Kraft.'),
        T('Second law: the net force points along the acceleration, not along the velocity.', 'Zweites Newtonsches Gesetz: Die resultierende Kraft zeigt in Richtung der Beschleunigung, nicht der Geschwindigkeit.'),
        T(`Here the ball ${motion}. Which way does its velocity change?`, `Hier ${deMotion}. In welche Richtung ändert sich ihre Geschwindigkeit?`),
      ],
      steps: [
        { title: T('Acceleration', 'Beschleunigung'), figure: figure(), text: rule },
        { title: T('Forces', 'Kräfte'), figure: figure({ forces: true }), text: parts },
      ],
    };
  }

  register('inertia', 'cart-launcher', cartLauncher);
  register('gravity', 'pendulum-cut', pendulumCut);
  register('force', 'ramp', ramp);
})(typeof window !== 'undefined' ? window : globalThis);
