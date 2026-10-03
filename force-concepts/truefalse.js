// True/false sets: five statements about one situation, at least two true and two false. The false
// statements are common misconceptions; judging one wrongly is counted as that misconception.
(function (root) {
  'use strict';

  const FC = root.FC || require('./core.js');
  const D = root.Draw || require('./draw.js');
  const { T, F, FL, cap, noun, stmt, tf, register } = FC;

  // Five statements, at least two of each kind.
  function pickFive(r, all) {
    for (let tries = 0; ; tries++) {
      const five = r.shuffle(all).slice(0, 5), t = five.filter((x) => x.value).length;
      if ((t >= 2 && t <= 3) || tries > 100) return five;
    }
  }
  // Worked solution: the true statements, then the false ones, each with its reason.
  const steps = (items, figure) => [
    { title: T('True statements', 'Richtige Aussagen'), figure, text: `<ul>${items.filter((x) => x.value).map((x) => `<li><b>${x.text}</b> ${x.why}</li>`).join('')}</ul>` },
    { title: T('False statements', 'Falsche Aussagen'), figure, text: `<ul>${items.filter((x) => !x.value).map((x) => `<li><b>${x.text}</b> ${x.why}</li>`).join('')}</ul>` },
  ];
  const prompt = () => T('Decide for each statement whether it is true or false.', 'Entscheide bei jeder Aussage, ob sie richtig oder falsch ist.');

  // ================================================================ a ball thrown straight up
  function tfThrow(r) {
    const FG = F('G');
    const only = T('After release, only the weight acts on the ball.', 'Nach dem Loslassen wirkt nur die Gewichtskraft auf den Ball.');
    const all = [
      stmt(T('At the highest point, the acceleration of the ball is zero.', 'Im höchsten Punkt ist die Beschleunigung des Balls null.'), false,
        T('Its velocity is zero there for a moment, but it is changing from up to down: the acceleration is <i>g</i>, downward.', 'Die Geschwindigkeit ist dort kurz null, ändert sich aber gerade von oben nach unten: Die Beschleunigung ist <i>g</i>, nach unten.'), 'rest-no-force'),
      stmt(T('On the way up, a force from the throw pushes the ball upward.', 'Auf dem Weg nach oben drückt eine Wurfkraft den Ball nach oben.'), false,
        T(`The hand pushes only while it touches the ball. ${only} The ball rises because of its velocity.`, `Die Hand stösst nur, solange sie den Ball berührt. ${only} Der Ball steigt wegen seiner Geschwindigkeit.`), 'impetus'),
      stmt(T('The acceleration of the ball is the same at every point of its flight.', 'Die Beschleunigung des Balls ist in jedem Punkt seines Flugs gleich.'), true,
        T(`${only} So <i>a</i> = ${FG}/<i>m</i> = <i>g</i>, downward, all the time.`, `${only} Also ist <i>a</i> = ${FG}/<i>m</i> = <i>g</i>, nach unten, die ganze Zeit.`)),
      stmt(T('At the highest point, the velocity of the ball is zero.', 'Im höchsten Punkt ist die Geschwindigkeit des Balls null.'), true,
        T('It stops rising and starts falling: for a moment it is at rest.', 'Er hört auf zu steigen und beginnt zu fallen: Einen Moment lang ist er in Ruhe.')),
      stmt(T('On the way down, the ball gets faster by about 9.8 m/s every second.', 'Auf dem Weg nach unten wird der Ball jede Sekunde um etwa 9,8 m/s schneller.'), true,
        T('Its acceleration is <i>g</i> ≈ 9.8 m/s², downward.', 'Seine Beschleunigung ist <i>g</i> ≈ 9,8 m/s², nach unten.')),
      stmt(T('The weight of the ball is larger on the way down than on the way up.', 'Die Gewichtskraft des Balls ist auf dem Weg nach unten grösser als auf dem Weg nach oben.'), false,
        T(`${FG} = <i>m·g</i> does not depend on the motion.`, `${FG} = <i>m·g</i> hängt nicht von der Bewegung ab.`)),
      stmt(T('The ball keeps rising only as long as an upward force acts on it.', 'Der Ball steigt nur so lange, wie eine Kraft nach oben auf ihn wirkt.'), false,
        T(`There is no upward force at all: ${only.charAt(0).toLowerCase() + only.slice(1)} The ball rises because it already moves upward, and slows down because of its weight.`, `Es gibt gar keine Kraft nach oben: ${only.charAt(0).toLowerCase() + only.slice(1)} Der Ball steigt, weil er sich schon nach oben bewegt, und wird wegen der Gewichtskraft langsamer.`), 'active-force'),
      stmt(T('During the flight, the only force on the ball is its weight.', 'Während des Flugs ist die Gewichtskraft die einzige Kraft auf den Ball.'), true,
        T('Nothing touches it any more, and air resistance is negligible.', 'Nichts berührt ihn mehr, und der Luftwiderstand ist vernachlässigbar.'), 'impetus'),
      stmt(T('A heavier ball thrown up at the same speed reaches a lower height.', 'Ein schwererer Ball, mit gleicher Geschwindigkeit hochgeworfen, erreicht eine kleinere Höhe.'), false,
        T('A heavier ball is pulled harder but is also harder to slow down: its acceleration is <i>g</i> as well, so it rises just as high.', 'Ein schwererer Ball wird stärker gezogen, ist aber auch schwerer abzubremsen: Seine Beschleunigung ist ebenfalls <i>g</i>, also steigt er gleich hoch.'), 'heavier-faster'),
      stmt(T('On the way up, the ball loses about 9.8 m/s of speed every second.', 'Auf dem Weg nach oben verliert der Ball jede Sekunde etwa 9,8 m/s an Geschwindigkeit.'), true,
        T('The acceleration <i>g</i> points down, against the velocity: the ball slows down at that rate.', 'Die Beschleunigung <i>g</i> zeigt nach unten, gegen die Geschwindigkeit: Der Ball wird in diesem Mass langsamer.')),
    ];
    const items = pickFive(r, all);
    const fig = D.svg(260, 220, D.ground(10, 250, 210) + D.path('M100 200 V64 A30 30 0 0 1 160 64 V200', 'trace') + D.ball(130, 34, 9) + D.text(144, 32, T('highest point', 'höchster Punkt'), 'txt', 'start') +
      D.ghost(D.ball(100, 140, 8)) + D.arrow(100, 140, 100, 104, 'v', 'v') + D.ghost(D.ball(160, 140, 8)) + D.arrow(160, 140, 160, 176, 'v', 'v'), T('A ball thrown straight up', 'Ein senkrecht hochgeworfener Ball'));
    return {
      title: T('True or false: thrown up', 'Richtig oder falsch: hochgeworfen'),
      situation: T('<p>A ball is thrown straight up. It rises, stops for a moment at its highest point and falls back down. Air resistance is negligible.</p>', '<p>Ein Ball wird senkrecht nach oben geworfen. Er steigt, hält im höchsten Punkt kurz an und fällt wieder hinunter. Der Luftwiderstand ist vernachlässigbar.</p>'),
      figure: fig,
      questions: [tf(r, 'statements', prompt(), items)],
      hints: [
        T('Which forces act on the ball after it has left the hand?', 'Welche Kräfte wirken auf den Ball, nachdem er die Hand verlassen hat?'),
        T('Plan: find the forces, then the acceleration (second law); then check each statement against them. Keep force, velocity and acceleration apart.', 'Plan: Bestimme die Kräfte, dann die Beschleunigung (zweites Gesetz); prüfe dann jede Aussage daran. Halte Kraft, Geschwindigkeit und Beschleunigung auseinander.'),
        T(`<i>a</i> = ${F('net')}/<i>m</i>. The velocity can be zero while the acceleration is not.`, `<i>a</i> = ${F('net')}/<i>m</i>. Die Geschwindigkeit kann null sein, während die Beschleunigung es nicht ist.`),
        T(`Here only the weight acts, at every point: <i>a</i> = <i>g</i> ≈ 9.8 m/s², downward.`, `Hier wirkt in jedem Punkt nur die Gewichtskraft: <i>a</i> = <i>g</i> ≈ 9,8 m/s², nach unten.`),
      ],
      steps: steps(items, fig),
    };
  }

  // ================================================================ Newton's first and second law
  function tfMotion(r, p) {
    const first = p.law !== 2;
    const pool = first ? [
      stmt(T('If no force acts on a moving puck, it moves on in a straight line at constant speed.', 'Wirkt keine Kraft auf einen bewegten Puck, bewegt er sich geradlinig mit konstanter Geschwindigkeit weiter.'), true,
        T('That is the first law: without a net force, the velocity does not change.', 'Das ist das erste Newtonsche Gesetz: Ohne resultierende Kraft ändert sich die Geschwindigkeit nicht.'), 'active-force'),
      stmt(T('A puck sliding on frictionless ice slows down because its push wears off.', 'Ein Puck auf reibungsfreiem Eis wird langsamer, weil sein Schwung nachlässt.'), false,
        T('No push is stored in the puck. Without friction, nothing slows it down.', 'Im Puck ist kein Schwung gespeichert. Ohne Reibung bremst ihn nichts.'), 'impetus'),
      stmt(T('A book lying at rest on a table has no forces acting on it.', 'Auf ein Buch, das ruhig auf einem Tisch liegt, wirken keine Kräfte.'), false,
        T('Its weight and the push of the table act on it; they balance, so the net force is zero.', 'Die Gewichtskraft und die Normalkraft des Tisches wirken auf es; sie heben sich auf, also ist die resultierende Kraft null.'), 'rest-no-force'),
      stmt(T('A body can move at constant velocity while several forces act on it.', 'Ein Körper kann sich mit konstanter Geschwindigkeit bewegen, während mehrere Kräfte auf ihn wirken.'), true,
        T('If the forces balance, the net force is zero and the velocity stays the same — e.g. a car at constant speed.', 'Heben sich die Kräfte auf, ist die resultierende Kraft null, und die Geschwindigkeit bleibt gleich — z.B. ein Auto bei konstanter Geschwindigkeit.'), 'active-force'),
      stmt(T('If the net force on a body is zero, the body must be at rest.', 'Ist die resultierende Kraft auf einen Körper null, muss er in Ruhe sein.'), false,
        T('It can also move at constant velocity.', 'Er kann sich auch mit konstanter Geschwindigkeit bewegen.'), 'active-force'),
      stmt(T('A puck moving to the right must have a force to the right acting on it.', 'Auf einen Puck, der sich nach rechts bewegt, muss eine Kraft nach rechts wirken.'), false,
        T('Moving needs no force; only changing the velocity does.', 'Bewegung braucht keine Kraft; nur eine Änderung der Geschwindigkeit braucht eine.'), 'active-force'),
      stmt(T('To keep a crate sliding at constant speed on a rough floor, you must push as hard as friction pulls back.', 'Damit eine Kiste auf rauem Boden mit konstanter Geschwindigkeit gleitet, muss man so stark schieben, wie die Reibung zurückhält.'), true,
        T('Constant speed: the net force is zero, so push and friction are equal.', 'Konstante Geschwindigkeit: Die resultierende Kraft ist null, also sind Druckkraft und Reibung gleich.'), 'active-force'),
      stmt(T('A space probe far from all planets needs its engine running to keep moving.', 'Eine Raumsonde weit weg von allen Planeten braucht ein laufendes Triebwerk, um sich weiterzubewegen.'), false,
        T('Without any force it keeps its velocity for ever.', 'Ohne jede Kraft behält sie ihre Geschwindigkeit für immer.'), 'active-force'),
    ] : [
      stmt(T('A body can move to the right while the net force on it points to the left.', 'Ein Körper kann sich nach rechts bewegen, während die resultierende Kraft auf ihn nach links zeigt.'), true,
        T('Then it slows down — like a car braking.', 'Dann wird er langsamer — wie ein bremsendes Auto.'), 'active-force'),
      stmt(T('The net force on a body always points in its direction of motion.', 'Die resultierende Kraft auf einen Körper zeigt immer in seine Bewegungsrichtung.'), false,
        T('It points along the acceleration, which can be against the motion (braking) or sideways (curves).', 'Sie zeigt in Richtung der Beschleunigung, und die kann gegen die Bewegung (Bremsen) oder seitlich (Kurven) zeigen.'), 'active-force'),
      stmt(T('Twice the net force on the same body gives twice the acceleration.', 'Die doppelte resultierende Kraft auf denselben Körper ergibt die doppelte Beschleunigung.'), true,
        T('<i>a</i> = <i>F</i>/<i>m</i>: the acceleration is proportional to the net force.', '<i>a</i> = <i>F</i>/<i>m</i>: Die Beschleunigung ist proportional zur resultierenden Kraft.')),
      stmt(T('Twice the net force on the same body gives twice the speed.', 'Die doppelte resultierende Kraft auf denselben Körper ergibt die doppelte Geschwindigkeit.'), false,
        T('A force sets the acceleration, not the speed: twice the force makes the speed change twice as fast.', 'Eine Kraft bestimmt die Beschleunigung, nicht die Geschwindigkeit: Die doppelte Kraft ändert die Geschwindigkeit doppelt so schnell.'), 'active-force'),
      stmt(T('The same net force gives a heavier body a smaller acceleration.', 'Dieselbe resultierende Kraft gibt einem schwereren Körper eine kleinere Beschleunigung.'), true,
        T('<i>a</i> = <i>F</i>/<i>m</i>: more mass, less acceleration.', '<i>a</i> = <i>F</i>/<i>m</i>: mehr Masse, weniger Beschleunigung.')),
      stmt(T('When two forces act on a body, it moves in the direction of the larger one.', 'Wirken zwei Kräfte auf einen Körper, bewegt er sich in Richtung der grösseren.'), false,
        T('Both forces count: they add as arrows to the net force, and the acceleration points along that.', 'Beide Kräfte zählen: Sie addieren sich als Pfeile zur resultierenden Kraft, und die Beschleunigung zeigt in deren Richtung.'), 'largest-force'),
      stmt(T('If the net force is constant, the velocity changes by the same amount every second.', 'Ist die resultierende Kraft konstant, ändert sich die Geschwindigkeit jede Sekunde um gleich viel.'), true,
        T('A constant force gives a constant acceleration.', 'Eine konstante Kraft ergibt eine konstante Beschleunigung.'), 'active-force'),
      stmt(T('A ball at its highest point, momentarily at rest, has zero acceleration.', 'Ein Ball im höchsten Punkt, kurz in Ruhe, hat die Beschleunigung null.'), false,
        T('Its velocity is changing from up to down: the acceleration is <i>g</i>.', 'Seine Geschwindigkeit ändert sich gerade von oben nach unten: Die Beschleunigung ist <i>g</i>.'), 'rest-no-force'),
    ];
    const items = pickFive(r, pool);
    const fig = first
      ? D.svg(320, 120, D.rect(0, 0, 320, 120, 'ice', 6) + [40, 100, 160].map((x) => D.ghost(D.puck(x, 60, 12))).join('') + D.puck(220, 60, 12) + D.arrow(236, 60, 290, 60, 'v', 'v'), T('A puck sliding on ice', 'Ein Puck gleitet auf Eis'))
      : D.svg(320, 140, D.ground(0, 320, 110) + D.car(110, 110, 110) + D.arrow(190, 80, 140, 80, 'net', FL('net')) + D.arrow(150, 36, 210, 36, 'v', 'v') + D.words(160, 132, T('moving right, net force left: braking', 'fährt nach rechts, resultierende Kraft nach links: bremst')),
        T('A car braking', 'Ein bremsendes Auto'));
    return {
      title: first ? T('True or false: inertia', 'Richtig oder falsch: Trägheit') : T('True or false: net force', 'Richtig oder falsch: resultierende Kraft'),
      situation: first ? T('<p>Statements about bodies with no net force acting on them.</p>', '<p>Aussagen über Körper, auf die keine resultierende Kraft wirkt.</p>')
        : T('<p>Statements about the net force and the motion it causes.</p>', '<p>Aussagen über die resultierende Kraft und die Bewegung, die sie bewirkt.</p>'),
      figure: fig,
      questions: [tf(r, 'statements', prompt(), items)],
      hints: first ? [
        T('For each statement: is there a net force, and does the velocity change?', 'Bei jeder Aussage: Gibt es eine resultierende Kraft, und ändert sich die Geschwindigkeit?'),
        T('Plan: check each statement against the first law.', 'Plan: Prüfe jede Aussage am ersten Newtonschen Gesetz.'),
        T('First law: net force zero ⇔ the velocity stays the same (at rest, or moving in a straight line at constant speed).', 'Erstes Gesetz: resultierende Kraft null ⇔ die Geschwindigkeit bleibt gleich (Ruhe, oder geradlinige Bewegung mit konstanter Geschwindigkeit).'),
        T('Moving needs no force. “No net force” can mean no forces at all, or forces that balance.', 'Bewegung braucht keine Kraft. „Keine resultierende Kraft“ kann heissen: gar keine Kräfte, oder Kräfte, die sich aufheben.'),
      ] : [
        T('For each statement: what does the net force determine — the velocity or the change of velocity?', 'Bei jeder Aussage: Was bestimmt die resultierende Kraft — die Geschwindigkeit oder ihre Änderung?'),
        T('Plan: check each statement against the second law.', 'Plan: Prüfe jede Aussage am zweiten Newtonschen Gesetz.'),
        T(`Second law: ${F('net')} = <i>m·a</i>. The net force is the sum (as arrows) of all forces.`, `Zweites Gesetz: ${F('net')} = <i>m·a</i>. Die resultierende Kraft ist die Summe (als Pfeile) aller Kräfte.`),
        T('The net force points along the acceleration, which can be against the motion. Doubling it doubles the acceleration, not the speed.', 'Die resultierende Kraft zeigt in Richtung der Beschleunigung, die auch gegen die Bewegung zeigen kann. Doppelte Kraft heisst doppelte Beschleunigung, nicht doppelte Geschwindigkeit.'),
      ],
      steps: steps(items, fig),
    };
  }

  // ================================================================ interaction: two bodies pull on each other
  const PAIRS = {
    earthMoon: { A: ['f', 'Erde', 'der Erde'], B: ['m', 'Mond', 'des Mondes'], en: ['the Earth', 'the Moon'], gravity: true },
    earthApple: { A: ['f', 'Erde', 'der Erde'], B: ['m', 'Apfel', 'des Apfels'], en: ['the Earth', 'the apple'], gravity: true },
    magnetNail: { A: ['m', 'Magnet', 'des Magneten'], B: ['m', 'Nagel', 'des Nagels'], en: ['the magnet', 'the nail'], gravity: false },
  };

  function tfInteract(r, p) {
    const key = p.pair || r.pick(Object.keys(PAIRS)), P = PAIRS[key];
    const [a, b] = P.en, A = noun(P.A[0], P.A[1]), B = noun(P.B[0], P.B[1]);
    const Ag = P.A[2], Bg = P.B[2];
    const pairWhy = T(`The two forces are an interaction pair: equally large and opposite, whatever the masses.`, `Die beiden Kräfte sind ein Wechselwirkungspaar: gleich gross und entgegengesetzt, egal wie gross die Massen sind.`);
    const pulls = P.gravity ? T('pulls', 'zieht') : T('pulls', 'zieht');
    const all = [
      stmt(T(`${cap(a)} ${pulls} ${b} exactly as hard as ${b} ${pulls} ${a}.`, `${cap(A.nom)} zieht ${B.acc} genau so stark an wie ${B.nom} ${A.acc}.`), true, pairWhy, 'mass-wins'),
      stmt(T(`${cap(a)} ${pulls} ${b} harder than ${b} ${pulls} ${a}, because ${a} has more mass.`, `${cap(A.nom)} zieht ${B.acc} stärker an als ${B.nom} ${A.acc}, weil ${A.nom} mehr Masse hat.`), false, pairWhy, 'mass-wins'),
      stmt(T('The two forces cancel each other, because they are equally large and opposite.', 'Die beiden Kräfte heben sich auf, weil sie gleich gross und entgegengesetzt sind.'), false,
        T(`They act on different bodies — one on ${a}, one on ${b} — so they cannot cancel. Only forces on the same body add up.`, `Sie wirken auf verschiedene Körper — eine auf ${A.acc}, eine auf ${B.acc} —, also können sie sich nicht aufheben. Nur Kräfte auf denselben Körper addieren sich.`), 'pair-confusion'),
      stmt(T(`The acceleration of ${b} due to this force is larger than that of ${a}.`, `Die Beschleunigung ${Bg} durch diese Kraft ist grösser als die ${Ag}.`), true,
        T(`Same force, but <i>a</i> = <i>F</i>/<i>m</i>: ${b} has much less mass.`, `Gleiche Kraft, aber <i>a</i> = <i>F</i>/<i>m</i>: ${cap(B.nom)} hat viel weniger Masse.`)),
      stmt(T(`${cap(b)} does not pull on ${a} at all.`, `${cap(B.nom)} zieht überhaupt nicht an ${A.dat}.`), false,
        T(`Every force has a partner: ${b} pulls on ${a} just as hard. ${pairWhy}`, `Jede Kraft hat eine Gegenkraft: ${cap(B.nom)} zieht genauso stark an ${A.dat}. ${pairWhy}`), 'mass-wins'),
      stmt(T(`${cap(a)} gets the larger acceleration, because it pulls harder.`, `${cap(A.nom)} bekommt die grössere Beschleunigung, weil ${A.er} stärker zieht.`), false,
        T(`Neither pulls harder, and the larger mass gets the smaller acceleration. ${pairWhy}`, `Keiner der beiden zieht stärker, und die grössere Masse bekommt die kleinere Beschleunigung. ${pairWhy}`), 'mass-wins'),
      stmt(T('The two forces act on different bodies.', 'Die beiden Kräfte wirken auf verschiedene Körper.'), true,
        T(`One acts on ${b}, the other on ${a}: that is always so for an interaction pair.`, `Eine wirkt auf ${B.acc}, die andere auf ${A.acc}: Bei einem Wechselwirkungspaar ist das immer so.`), 'pair-confusion'),
      ...(P.gravity ? [stmt(T(`If ${b} had twice its mass, both forces would be twice as large.`, `Hätte ${B.nom} die doppelte Masse, wären beide Kräfte doppelt so gross.`), true,
        T(`The gravitational pull is proportional to both masses, and the two forces stay equal.`, `Die Gravitationskraft ist proportional zu beiden Massen, und die beiden Kräfte bleiben gleich gross.`))] : []),
    ];
    const items = pickFive(r, all);
    const draw = (forces) => {
      let g = '';
      if (key === 'magnetNail') {
        g += D.rect(0, 0, 340, 140, 'table-top', 6) + `<rect class="mag-n" x="60" y="54" width="70" height="32" rx="3"/>` + D.rect(226, 66, 70, 8, 'solid', 2) + D.rect(220, 62, 8, 16, 'solid', 1);
        g += D.words(95, 108, T('magnet', 'Magnet')) + D.words(260, 100, T('iron nail', 'Eisennagel'));
        if (forces) g += D.arrow(134, 70, 178, 70, 'f', '') + D.arrow(216, 70, 172, 70, 'f', '');
      } else {
        g += D.rect(0, 0, 340, 140, 'space', 6) + `<circle class="obj earth" cx="80" cy="70" r="46"/>` + `<circle class="obj" cx="${key === 'earthMoon' ? 270 : 220}" cy="70" r="${key === 'earthMoon' ? 13 : 7}"/>`;
        g += D.words(80, 132, T('Earth', 'Erde')) + D.words(key === 'earthMoon' ? 270 : 220, 104, key === 'earthMoon' ? T('Moon', 'Mond') : T('apple', 'Apfel'));
        const bx = key === 'earthMoon' ? 270 : 220, br = key === 'earthMoon' ? 13 : 7;
        if (forces) g += D.arrow(bx - br, 70, bx - br - 44, 70, 'f', '') + D.arrow(126, 70, 170, 70, 'f', '');
      }
      return D.svg(340, 140, g, T(`${cap(a)} and ${b}`, `${cap(A.nom)} und ${B.nom}`));
    };
    const situation = {
      earthMoon: T('<p>The Earth and the Moon attract each other by gravity. The Earth has about 80 times the mass of the Moon.</p>', '<p>Die Erde und der Mond ziehen sich durch die Gravitation an. Die Erde hat etwa die 80-fache Masse des Mondes.</p>'),
      earthApple: T('<p>An apple falls from a tree. The Earth and the apple attract each other by gravity.</p>', '<p>Ein Apfel fällt vom Baum. Die Erde und der Apfel ziehen sich durch die Gravitation an.</p>'),
      magnetNail: T('<p>A strong magnet and a small iron nail lie on a smooth table and attract each other. The magnet is much heavier than the nail.</p>', '<p>Ein starker Magnet und ein kleiner Eisennagel liegen auf einem glatten Tisch und ziehen sich an. Der Magnet ist viel schwerer als der Nagel.</p>'),
    }[key];
    return {
      title: T('True or false: pulling on each other', 'Richtig oder falsch: gegenseitige Anziehung'),
      situation,
      figure: draw(false),
      questions: [tf(r, 'statements', prompt(), items)],
      hints: [
        T(`Which force does ${a} exert on ${b}, and which does ${b} exert on ${a}?`, `Welche Kraft übt ${A.nom} auf ${B.acc} aus, und welche ${B.nom} auf ${A.acc}?`),
        T('Plan: the two forces form an interaction pair (third law); their effects follow from the second law, body by body.', 'Plan: Die beiden Kräfte bilden ein Wechselwirkungspaar (drittes Gesetz); ihre Wirkungen folgen aus dem zweiten Gesetz, für jeden Körper einzeln.'),
        T('Third law: equally large, opposite, on different bodies. Second law: <i>a</i> = <i>F</i>/<i>m</i>.', 'Drittes Gesetz: gleich gross, entgegengesetzt, auf verschiedene Körper. Zweites Gesetz: <i>a</i> = <i>F</i>/<i>m</i>.'),
        T(`Here ${a} has far more mass than ${b}: same force, very different accelerations.`, `Hier hat ${A.nom} viel mehr Masse als ${B.nom}: gleiche Kraft, sehr verschiedene Beschleunigungen.`),
      ],
      steps: steps(items, draw(true)),
    };
  }

  register('gravity', 'tf-throw', tfThrow, {}, 'tf');
  register('inertia', 'tf-motion', tfMotion, { law: 1 }, 'tf');
  register('force', 'tf-motion', tfMotion, { law: 2 }, 'tf');
  register('interact', 'tf-interact', tfInteract, {}, 'tf');
})(typeof window !== 'undefined' ? window : globalThis);
