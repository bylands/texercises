// Real problems: situations from everyday life and from technology, told as a story, solved with
// the ideas of this section only (forces, F_res = m a, friction, slopes, ropes and pulleys). Each
// has random values that keep the results round:
//   { id, difficulty, title(), make(r) (parameters or null), solve(p, o) (o: a typical wrong idea),
//     traps, why, fields(p), text(p), hints(p, v), steps(p, v) (HTML) }
// realOf(i, seed) gives an exercise as the practice ones (generator.js), without a drawing or a
// table of forces; its id is real<i+1>-<seed>.
(function (root) {
  'use strict';

  const FS = root.FS;
  const { L, G, tex: T, rng, pick } = FS;
  // numbers with up to three decimals (Force Systems rounds to one), with units
  const num = (x) => String(Number(Number(x).toFixed(3)) + 0);
  const U = { N: 'N', a: 'm/s²', kg: 'kg', m: 'm', '': '' }, TU = { N: '\\mathrm{N}', a: '\\mathrm{m/s^2}', kg: '\\mathrm{kg}', m: '\\mathrm{m}', '': '' };
  const q = (x, u) => (u ? `${num(x)} ${U[u]}` : num(x));
  const tq = (x, u) => (u ? `${num(x)}\\,${TU[u]}` : num(x));
  const m$ = (s) => `$${s}$`;
  const res = (x, u) => `\\htmlClass{result}{${tq(x, u)}}`;
  const step = (rule, html) => `<p class="step-rule">${rule}</p>${html}`;
  const field = (key, sym, unit, what, dec = 1) => ({ key, sym, unit, what, dec });
  const kg = (m) => q(m, 'kg'), N = (F) => q(F, 'N'), acc = (a) => q(a, 'a');
  const t = (m) => `${num(m / 1000)} t`, kN = (F) => `${num(F / 1000)} kN`;
  // a slope that drops h for every len along it: sin α = h/len, cos α = run/len (whole sides)
  const SLOPES = [[7, 24, 25], [3, 4, 5], [6, 8, 10], [14, 48, 50]];

  // ---------------------------------------------------------------- 1 the scale in a lift
  const PHASES = {
    upStart: { up: true, en: 'starts to move up and gets faster', de: 'fährt nach oben an und wird schneller' },
    upStop: { up: false, en: 'moves up and slows down before it stops', de: 'fährt nach oben und bremst vor dem Halt ab' },
    downStart: { up: false, en: 'starts to move down and gets faster', de: 'fährt nach unten an und wird schneller' },
    downStop: { up: true, en: 'moves down and slows down before it stops', de: 'fährt nach unten und bremst vor dem Halt ab' },
  };
  const scale = {
    id: 'scale', difficulty: 2, title: () => L('A scale in a lift', 'Eine Waage im Lift'),
    make: (r) => ({ m: pick(r, [45, 50, 55, 60, 65, 70, 75, 80]), a: pick(r, [0.5, 1, 1.5, 2, 2.5]), ph: pick(r, Object.keys(PHASES)) }),
    solve(p, o = {}) {
      const up = PHASES[p.ph].up !== !!o.sign, FN = o.noA ? p.m * G : p.m * (G + (up ? p.a : -p.a));
      return { N: FN, mS: FN / G };
    },
    traps: ['noA', 'sign'],
    why: {
      noA: () => L('The lift accelerates, so the forces on the person do not balance: the scale pushes harder or less hard than the weight.', 'Der Lift beschleunigt, also heben sich die Kräfte auf die Person nicht auf: Die Waage drückt stärker oder schwächer als die Gewichtskraft.'),
      sign: () => L('Which way does the acceleration point? Getting faster: in the direction of motion; slowing down: against it.', 'Wohin zeigt die Beschleunigung? Schneller werden: in Bewegungsrichtung; abbremsen: dagegen.'),
    },
    fields: () => [field('N', ['N'], 'N', L('force of the scale on the person', 'Kraft der Waage auf die Person')), field('mS', ['mS'], 'kg', L('mass shown', 'angezeigte Masse'))],
    text: (p) => L(`A person with a mass of ${kg(p.m)} stands on a bathroom scale in a lift. The lift ${PHASES[p.ph].en}, with an acceleration of ${acc(p.a)}. With which force does the scale push on the person, and which mass does it show? (A scale measures the force on it and divides it by g = 10 m/s².)`,
      `Eine Person mit der Masse ${kg(p.m)} steht in einem Lift auf einer Personenwaage. Der Lift ${PHASES[p.ph].de}, mit einer Beschleunigung von ${acc(p.a)}. Mit welcher Kraft drückt die Waage auf die Person, und welche Masse zeigt sie an? (Eine Waage misst die Kraft auf sie und teilt sie durch g = 10 m/s².)`),
    hints: (p) => [
      L('Two forces act on the person: the weight down and the force of the scale up (the normal force).', 'Auf die Person wirken zwei Kräfte: die Gewichtskraft nach unten und die Kraft der Waage nach oben (die Normalkraft).'),
      L(`Which way does the acceleration point? Getting faster: in the direction of motion; slowing down: against it. Here: ${PHASES[p.ph].up ? 'up' : 'down'}.`, `Wohin zeigt die Beschleunigung? Schneller werden: in Bewegungsrichtung; abbremsen: dagegen. Hier: nach ${PHASES[p.ph].up ? 'oben' : 'unten'}.`),
      L(`Newton’s second law along the acceleration: ${m$(PHASES[p.ph].up ? `${T('N')} - ${T('G')} = m\\,a` : `${T('G')} - ${T('N')} = m\\,a`)}.`, `Aktionsprinzip in Richtung der Beschleunigung: ${m$(PHASES[p.ph].up ? `${T('N')} - ${T('G')} = m\\,a` : `${T('G')} - ${T('N')} = m\\,a`)}.`),
    ],
    steps(p, v) {
      const up = PHASES[p.ph].up;
      return [
        step(L('Forces and acceleration', 'Kräfte und Beschleunigung'), `<p>${L(`On the person: the weight ${m$(`${T('G')} = m\\,g = ${tq(p.m * G, 'N')}`)} down and the force of the scale ${m$(T('N'))} up. The lift ${up ? 'speeds up upwards or slows down on its way down' : 'speeds up downwards or slows down on its way up'}: the acceleration points ${up ? 'up' : 'down'}.`, `Auf die Person: die Gewichtskraft ${m$(`${T('G')} = m\\,g = ${tq(p.m * G, 'N')}`)} nach unten und die Kraft der Waage ${m$(T('N'))} nach oben. Der Lift ${up ? 'wird nach oben schneller oder bremst auf dem Weg nach unten' : 'wird nach unten schneller oder bremst auf dem Weg nach oben'}: Die Beschleunigung zeigt nach ${up ? 'oben' : 'unten'}.`)}</p>`),
        step(L('Newton’s second law', 'Aktionsprinzip'), `<p>${L('The net force points along the acceleration:', 'Die resultierende Kraft zeigt in Richtung der Beschleunigung:')}</p>` +
          (up ? `$$${T('N')} - m\\,g = m\\,a \\;\\Rightarrow\\; ${T('N')} = m\\,(g + a) = ${tq(p.m, 'kg')}\\cdot ${tq(G + p.a, 'a')} = ${res(v.N, 'N')}$$`
            : `$$m\\,g - ${T('N')} = m\\,a \\;\\Rightarrow\\; ${T('N')} = m\\,(g - a) = ${tq(p.m, 'kg')}\\cdot ${tq(G - p.a, 'a')} = ${res(v.N, 'N')}$$`)),
        step(L('What the scale shows', 'Was die Waage anzeigt'), `<p>${L(`The person pushes on the scale just as hard (interaction), and the scale divides by g:`, 'Die Person drückt gleich stark auf die Waage (Wechselwirkung), und die Waage teilt durch g:')}</p>` +
          `$$${T('mS')} = \\frac{${T('N')}}{g} = ${res(v.mS, 'kg')}$$<p>${up ? L('More than the person’s mass: they feel heavier.', 'Mehr als die Masse der Person: Sie fühlt sich schwerer.') : L('Less than the person’s mass: they feel lighter.', 'Weniger als die Masse der Person: Sie fühlt sich leichter.')}</p>`),
      ];
    },
  };

  // ---------------------------------------------------------------- 2 a crane lifts a container
  const crane = {
    id: 'crane', difficulty: 2, title: () => L('A crane lifts a container', 'Ein Kran hebt einen Container'),
    make(r) {
      const M = pick(r, [1500, 2000, 2500, 3000, 4000, 5000]), a = pick(r, [0.2, 0.4, 0.5, 0.8, 1]), a2 = pick(r, [1, 1.5, 2, 2.5, 3]);
      return a2 > a ? { M, a, Fmax: M * (G + a2) } : null;
    },
    solve: (p, o = {}) => ({ S: o.noG ? p.M * p.a : p.M * (G + p.a), amax: o.noG ? p.Fmax / p.M : p.Fmax / p.M - G }),
    traps: ['noG'],
    why: { noG: () => L('The cable has to carry the container’s weight as well, not only accelerate it.', 'Das Seil muss auch die Gewichtskraft des Containers tragen, nicht nur ihn beschleunigen.') },
    fields: () => [field('S', ['S'], 'N', L('force in the cable', 'Kraft im Seil')), field('amax', ['a', 'max'], 'a', L('largest acceleration', 'grösste Beschleunigung'))],
    text: (p) => L(`A harbour crane lifts a container with a mass of ${t(p.M)} from the quay, starting from rest with an acceleration of ${acc(p.a)}. How large is the force in the crane’s cable? The cable may carry at most ${kN(p.Fmax)}: with which acceleration could the crane lift the container at most?`,
      `Ein Hafenkran hebt einen Container mit der Masse ${t(p.M)} aus der Ruhe mit einer Beschleunigung von ${acc(p.a)} vom Kai. Wie gross ist die Kraft im Seil des Krans? Das Seil darf höchstens mit ${kN(p.Fmax)} belastet werden: Mit welcher Beschleunigung könnte der Kran den Container höchstens heben?`),
    hints: () => [
      L('Two forces act on the container: its weight down, the cable force up.', 'Auf den Container wirken zwei Kräfte: seine Gewichtskraft nach unten, die Seilkraft nach oben.'),
      L(`The acceleration points up: ${m$(`${T('S')} - m\\,g = m\\,a`)}.`, `Die Beschleunigung zeigt nach oben: ${m$(`${T('S')} - m\\,g = m\\,a`)}.`),
      L(`At the cable’s limit: ${m$(`a_\\mathrm{max} = (F_\\mathrm{max} - m\\,g)/m`)}. Watch the units: 1 t = 1000 kg, 1 kN = 1000 N.`, `An der Grenze des Seils: ${m$(`a_\\mathrm{max} = (F_\\mathrm{max} - m\\,g)/m`)}. Achte auf die Einheiten: 1 t = 1000 kg, 1 kN = 1000 N.`),
    ],
    steps: (p, v) => [
      step(L('Cable force', 'Seilkraft'), `<p>${L('Weight down, cable force up; the net force accelerates the container upwards:', 'Gewichtskraft nach unten, Seilkraft nach oben; die resultierende Kraft beschleunigt den Container nach oben:')}</p>` +
        `$$${T('S')} - m\\,g = m\\,a \\;\\Rightarrow\\; ${T('S')} = m\\,(g + a) = ${tq(p.M, 'kg')}\\cdot ${tq(G + p.a, 'a')} = ${res(v.S, 'N')}$$`),
      step(L('Largest acceleration', 'Grösste Beschleunigung'), `$$a_\\mathrm{max} = \\frac{F_\\mathrm{max} - m\\,g}{m} = \\frac{${tq(p.Fmax, 'N')} - ${tq(p.M * G, 'N')}}{${tq(p.M, 'kg')}} = ${res(v.amax, 'a')}$$` +
        `<p>${L('Most of what the cable can carry goes into holding the container up.', 'Das meiste, was das Seil tragen kann, braucht es, um den Container zu halten.')}</p>`),
    ],
  };

  // ---------------------------------------------------------------- 3 a crate on a truck
  const truck = {
    id: 'truck', difficulty: 2, title: () => L('A crate on a truck', 'Eine Kiste auf dem Lastwagen'),
    make(r) {
      const m = pick(r, [20, 30, 40, 50, 80, 100]), mu = pick(r, [0.3, 0.4, 0.5, 0.6]), a = pick(r, [1, 1.5, 2, 2.5]);
      return a < mu * G - 0.5 ? { m, mu, a } : null;
    },
    solve: (p, o = {}) => ({ R: o.maxR ? p.mu * p.m * G : p.m * p.a, amax: p.mu * G }),
    traps: ['maxR'],
    why: { maxR: () => L('Static friction is only as large as needed: here just enough to accelerate the crate along with the truck. μ_s·F_N is its largest possible value.', 'Die Haftreibung ist nur so gross wie nötig: hier gerade so gross, dass die Kiste mit dem Lastwagen mitbeschleunigt. μ_H·F_N ist ihr grösstmöglicher Wert.') },
    fields: () => [field('R', ['R'], 'N', L('static friction on the crate', 'Haftreibung auf die Kiste')), field('amax', ['a', 'max'], 'a', L('largest acceleration', 'grösste Beschleunigung'))],
    text: (p) => L(`A crate of ${kg(p.m)} stands on the open platform of a truck, not tied down. The coefficient of static friction between crate and platform is ${num(p.mu, 2)}. The truck drives off with an acceleration of ${acc(p.a)}, and the crate moves along with it. Which force accelerates the crate, and how large is it? With which acceleration at most may the truck drive off, so that the crate does not slide?`,
      `Eine Kiste von ${kg(p.m)} steht ungesichert auf der offenen Ladefläche eines Lastwagens. Die Haftreibungszahl zwischen Kiste und Ladefläche beträgt ${num(p.mu, 2)}. Der Lastwagen fährt mit einer Beschleunigung von ${acc(p.a)} an, und die Kiste fährt mit. Welche Kraft beschleunigt die Kiste, und wie gross ist sie? Mit welcher Beschleunigung darf der Lastwagen höchstens anfahren, damit die Kiste nicht rutscht?`),
    hints: () => [
      L('Horizontally, only one force acts on the crate: static friction from the platform. It must accelerate the crate.', 'Waagrecht wirkt nur eine Kraft auf die Kiste: die Haftreibung der Ladefläche. Sie muss die Kiste beschleunigen.'),
      L(`${m$(`${T('R')} = m\\,a`)}; at most, static friction is ${m$(`${T('mus')}\\,${T('N')} = ${T('mus')}\\,m\\,g`)}.`, `${m$(`${T('R')} = m\\,a`)}; höchstens ist die Haftreibung ${m$(`${T('mus')}\\,${T('N')} = ${T('mus')}\\,m\\,g`)}.`),
    ],
    steps: (p, v) => [
      step(L('Static friction accelerates the crate', 'Die Haftreibung beschleunigt die Kiste'), `<p>${L('Vertically, weight and normal force balance. Horizontally, only static friction acts, so it is the net force:', 'Senkrecht heben sich Gewichtskraft und Normalkraft auf. Waagrecht wirkt nur die Haftreibung, also ist sie die resultierende Kraft:')}</p>` +
        `$$${T('R')} = m\\,a = ${tq(p.m, 'kg')}\\cdot ${tq(p.a, 'a')} = ${res(v.R, 'N')}$$`),
      step(L('Before the crate slides', 'Bevor die Kiste rutscht'), `<p>${L('Static friction can be at most μ_s times the normal force, here μ_s m g. So:', 'Die Haftreibung kann höchstens μ_H mal die Normalkraft sein, hier μ_H m g. Also:')}</p>` +
        `$$m\\,a_\\mathrm{max} = ${T('mus')}\\,m\\,g \\;\\Rightarrow\\; a_\\mathrm{max} = ${T('mus')}\\,g = ${num(p.mu, 2)}\\cdot ${tq(G, 'a')} = ${res(v.amax, 'a')}$$` +
        `<p>${L('The mass cancels: a light crate slides just as soon as a heavy one.', 'Die Masse kürzt sich weg: Eine leichte Kiste rutscht genauso früh wie eine schwere.')}</p>`),
    ],
  };

  // ---------------------------------------------------------------- 4 towing a car
  const tow = {
    id: 'tow', difficulty: 3, title: () => L('Towing a car', 'Abschleppen'),
    make(r) {
      const m1 = pick(r, [1000, 1200, 1500, 1800]), m2 = pick(r, [800, 1000, 1200, 1500]), mu = 0.02, F = pick(r, [1000, 1200, 1500, 1800, 2000, 2500, 3000]);
      return F > mu * (m1 + m2) * G + 200 ? { m1, m2, mu, F } : null;
    },
    solve(p, o = {}) {
      const a = (p.F - (o.noFric ? 0 : p.mu * (p.m1 + p.m2) * G)) / (o.oneMass ? p.m1 : p.m1 + p.m2);
      return { a, S: o.pass ? p.F : p.m2 * a + (o.noFric ? 0 : p.mu * p.m2 * G) };
    },
    traps: ['oneMass', 'pass', 'noFric'],
    why: {
      oneMass: () => L('The driving force accelerates both cars: divide by their total mass.', 'Die Antriebskraft beschleunigt beide Autos: Teile durch ihre gesamte Masse.'),
      pass: () => L('The rope only passes on what the towed car needs: its share of the acceleration and its own rolling resistance.', 'Das Seil gibt nur weiter, was das abgeschleppte Auto braucht: seinen Anteil an der Beschleunigung und seinen eigenen Rollwiderstand.'),
      noFric: () => L('The rolling resistance is missing.', 'Der Rollwiderstand fehlt.'),
    },
    fields: () => [field('a', ['a'], 'a', L('acceleration', 'Beschleunigung')), field('S', ['S'], 'N', L('force in the tow rope', 'Kraft im Abschleppseil'))],
    text: (p) => L(`A car (${kg(p.m1)}) tows a broken-down car (${kg(p.m2)}) with a tow rope. The towing car’s driving force is ${N(p.F)}; for each car, the rolling resistance is ${num(p.mu, 2)} times its weight. With which acceleration do the cars drive off, and how large is the force in the tow rope?`,
      `Ein Auto (${kg(p.m1)}) schleppt ein Pannenauto (${kg(p.m2)}) mit einem Abschleppseil ab. Die Antriebskraft des schleppenden Autos beträgt ${N(p.F)}; bei jedem Auto ist der Rollwiderstand ${num(p.mu, 2)}-mal seine Gewichtskraft. Mit welcher Beschleunigung fahren die Autos an, und wie gross ist die Kraft im Abschleppseil?`),
    hints: () => [
      L('First both cars together as one system: the driving force against both rolling resistances accelerates the total mass.', 'Zuerst beide Autos zusammen als ein System: Die Antriebskraft gegen beide Rollwiderstände beschleunigt die gesamte Masse.'),
      L('Then the towed car alone: only the rope pulls it forward, its rolling resistance holds it back.', 'Dann das abgeschleppte Auto allein: Nur das Seil zieht es nach vorn, sein Rollwiderstand hält es zurück.'),
    ],
    steps: (p, v) => [
      step(L('Both cars together', 'Beide Autos zusammen'), `$$a = \\frac{F - ${num(p.mu, 2)}\\,(m_1 + m_2)\\,g}{m_1 + m_2} = \\frac{${tq(p.F, 'N')} - ${tq(p.mu * (p.m1 + p.m2) * G, 'N')}}{${tq(p.m1 + p.m2, 'kg')}} = ${res(v.a, 'a')}$$` +
        `<p>${L('The rope force is an inner force of this system: it does not appear.', 'Die Seilkraft ist eine innere Kraft dieses Systems: Sie kommt nicht vor.')}</p>`),
      step(L('The towed car alone', 'Das abgeschleppte Auto allein'), `<p>${L('The rope pulls it forward, its rolling resistance holds it back:', 'Das Seil zieht es nach vorn, sein Rollwiderstand hält es zurück:')}</p>` +
        `$$${T('S')} - ${num(p.mu, 2)}\\,m_2\\,g = m_2\\,a \\;\\Rightarrow\\; ${T('S')} = ${tq(p.m2, 'kg')}\\cdot ${tq(v.a, 'a')} + ${tq(p.mu * p.m2 * G, 'N')} = ${res(v.S, 'N')}$$`),
    ],
  };

  // ---------------------------------------------------------------- 5 a freight train
  const train = {
    id: 'train', difficulty: 3, title: () => L('A freight train', 'Ein Güterzug'),
    make(r) {
      // a freight train speeds up gently: 0.1 to 0.5 m/s²
      const mL = pick(r, [80, 90, 100, 120]) * 1000, n = pick(r, [8, 10, 12, 15, 20, 25]), mW = pick(r, [20, 25, 30, 40, 50, 60]) * 1000, F = pick(r, [150, 200, 240, 250, 300, 320, 360, 400]) * 1000;
      const a = F / (mL + n * mW);
      return a >= 0.1 && a <= 0.5 ? { mL, n, mW, F } : null;
    },
    solve(p, o = {}) {
      const a = p.F / (o.oneMass ? p.mL : p.mL + p.n * p.mW);
      return { a, K1: o.pass ? p.F : p.n * p.mW * a, Kn: o.pass ? p.F : p.mW * a };
    },
    traps: ['oneMass', 'pass'],
    why: {
      oneMass: () => L('The driving force accelerates the whole train: locomotive and wagons.', 'Die Antriebskraft beschleunigt den ganzen Zug: Lokomotive und Wagen.'),
      pass: () => L('A coupling only pulls the wagons behind it: their mass times the acceleration.', 'Eine Kupplung zieht nur die Wagen hinter ihr: deren Masse mal die Beschleunigung.'),
    },
    fields: (p) => [field('a', ['a'], 'a', L('acceleration', 'Beschleunigung'), 2), field('K1', ['K', 1], 'N', L('force in the first coupling', 'Kraft in der ersten Kupplung')), field('Kn', ['K', p.n], 'N', L('force in the last coupling', 'Kraft in der letzten Kupplung'))],
    text: (p) => L(`A locomotive with a mass of ${t(p.mL)} pulls ${p.n} freight wagons of ${t(p.mW)} each. Its driving force is ${kN(p.F)}; friction and air resistance are negligible. Find the acceleration of the train, the force in the first coupling (between the locomotive and the first wagon) and in the last coupling (in front of the last wagon).`,
      `Eine Lokomotive mit der Masse ${t(p.mL)} zieht ${p.n} Güterwagen zu je ${t(p.mW)}. Ihre Antriebskraft beträgt ${kN(p.F)}; Reibung und Luftwiderstand sind vernachlässigbar. Bestimme die Beschleunigung des Zuges, die Kraft in der ersten Kupplung (zwischen Lokomotive und erstem Wagen) und in der letzten Kupplung (vor dem letzten Wagen).`),
    hints: () => [
      L('The whole train as one system: the driving force accelerates the total mass.', 'Der ganze Zug als ein System: Die Antriebskraft beschleunigt die gesamte Masse.'),
      L('A coupling pulls all the wagons behind it, and only those: their mass times the acceleration.', 'Eine Kupplung zieht alle Wagen hinter ihr, und nur diese: deren Masse mal die Beschleunigung.'),
    ],
    steps: (p, v) => [
      step(L('The whole train', 'Der ganze Zug'), `$$a = \\frac{F}{m_\\mathrm{L} + ${p.n}\\,m_\\mathrm{W}} = \\frac{${tq(p.F, 'N')}}{${tq(p.mL + p.n * p.mW, 'kg')}} = ${res(v.a, 'a')}$$`),
      step(L('The couplings', 'Die Kupplungen'), `<p>${L(`The first coupling pulls all ${p.n} wagons, the last one only the last wagon:`, `Die erste Kupplung zieht alle ${p.n} Wagen, die letzte nur den letzten Wagen:`)}</p>` +
        `$$${T('K', 1)} = ${p.n}\\,m_\\mathrm{W}\\,a = ${tq(p.n * p.mW, 'kg')}\\cdot ${tq(v.a, 'a')} = ${res(v.K1, 'N')}, \\qquad ${T('K', p.n)} = m_\\mathrm{W}\\,a = ${res(v.Kn, 'N')}$$` +
        `<p>${L('The couplings at the front carry the most: that is where trains tear apart.', 'Die vorderen Kupplungen tragen am meisten: Dort reissen Züge auseinander.')}</p>`),
    ],
  };

  // ---------------------------------------------------------------- 6 a skier
  const skier = {
    id: 'skier', difficulty: 4, title: () => L('Down the piste', 'Die Piste hinunter'),
    make(r) {
      const [h, run, len] = pick(r, SLOPES), k = pick(r, [1, 2, 4]);
      return { m: pick(r, [50, 60, 70, 80, 90]), h: h * k, run: run * k, len: len * k, mu: pick(r, [0.05, 0.1, 0.15]) };
    },
    solve(p, o = {}) {
      const sn = p.h / p.len, cs = p.run / p.len;
      return { N: o.flatN ? p.m * G : p.m * G * cs, a: G * (sn - (o.noFric ? 0 : p.mu * (o.flatN ? 1 : cs))) };
    },
    traps: ['flatN', 'noFric'],
    why: {
      flatN: () => L('On a slope, the normal force only balances the part of the weight perpendicular to the slope.', 'Auf einem Hang hält die Normalkraft nur dem Teil der Gewichtskraft senkrecht zum Hang das Gleichgewicht.'),
      noFric: () => L('Friction on the snow is missing.', 'Die Reibung auf dem Schnee fehlt.'),
    },
    fields: () => [field('N', ['N'], 'N', L('normal force', 'Normalkraft')), field('a', ['a'], 'a', L('acceleration', 'Beschleunigung'), 2)],
    text: (p) => L(`A skier with a mass of ${kg(p.m)} (with equipment) glides straight down a piste that drops by ${q(p.h, 'm')} in height for every ${q(p.len, 'm')} along the slope. The coefficient of friction between skis and snow is ${num(p.mu, 2)}; air resistance is negligible. How large is the normal force, and with which acceleration does the skier get faster?`,
      `Ein Skifahrer mit der Masse ${kg(p.m)} (mit Ausrüstung) gleitet in Falllinie eine Piste hinunter, die pro ${q(p.len, 'm')} entlang des Hangs um ${q(p.h, 'm')} an Höhe verliert. Die Reibungszahl zwischen Ski und Schnee beträgt ${num(p.mu, 2)}; der Luftwiderstand ist vernachlässigbar. Wie gross ist die Normalkraft, und mit welcher Beschleunigung wird der Skifahrer schneller?`),
    hints: (p) => [
      L(`The slope is a right triangle: ${q(p.len, 'm')} along the slope, ${q(p.h, 'm')} down, and so (Pythagoras) ${q(p.run, 'm')} across. So sin α = ${p.h}/${p.len} and cos α = ${p.run}/${p.len}.`, `Der Hang ist ein rechtwinkliges Dreieck: ${q(p.len, 'm')} entlang des Hangs, ${q(p.h, 'm')} nach unten und darum (Pythagoras) ${q(p.run, 'm')} waagrecht. Also sin α = ${p.h}/${p.len} und cos α = ${p.run}/${p.len}.`),
      L('Split the weight: m g sin α down the slope, m g cos α into the slope. The normal force balances the second; friction is μ times the normal force.', 'Zerlege die Gewichtskraft: m g sin α hangabwärts, m g cos α in den Hang hinein. Die Normalkraft hält der zweiten das Gleichgewicht; die Reibung ist μ mal die Normalkraft.'),
      L(`Along the slope: ${m$('m\\,g\\sin\\alpha - \\mu\\,m\\,g\\cos\\alpha = m\\,a')}.`, `Entlang des Hangs: ${m$('m\\,g\\sin\\alpha - \\mu\\,m\\,g\\cos\\alpha = m\\,a')}.`),
    ],
    steps: (p, v) => [
      step(L('The slope', 'Der Hang'), `<p>${L(`${q(p.len, 'm')} along the slope, ${q(p.h, 'm')} down: across, √(${p.len}² − ${p.h}²) m = ${q(p.run, 'm')}. So`, `${q(p.len, 'm')} entlang des Hangs, ${q(p.h, 'm')} nach unten: waagrecht √(${p.len}² − ${p.h}²) m = ${q(p.run, 'm')}. Also`)}</p>$$\\sin\\alpha = \\frac{${p.h}}{${p.len}} = ${num(p.h / p.len, 2)},\\qquad \\cos\\alpha = \\frac{${p.run}}{${p.len}} = ${num(p.run / p.len, 2)}$$`),
      step(L('Normal force', 'Normalkraft'), `$$${T('N')} = m\\,g\\cos\\alpha = ${tq(p.m * G, 'N')}\\cdot ${num(p.run / p.len, 2)} = ${res(v.N, 'N')}$$`),
      step(L('Along the slope', 'Entlang des Hangs'), `<p>${L('The component of the weight down the slope against friction:', 'Die Hangabtriebskraft gegen die Reibung:')}</p>` +
        `$$m\\,a = m\\,g\\sin\\alpha - \\mu\\,${T('N')} \\;\\Rightarrow\\; a = g\\,(\\sin\\alpha - \\mu\\cos\\alpha) = ${tq(G, 'a')}\\cdot(${num(p.h / p.len, 2)} - ${num(p.mu, 2)}\\cdot ${num(p.run / p.len, 2)}) = ${res(v.a, 'a')}$$` +
        `<p>${L('The mass cancels: a heavy and a light skier get faster equally quickly (without air resistance).', 'Die Masse kürzt sich weg: Ein schwerer und ein leichter Skifahrer werden gleich schnell schneller (ohne Luftwiderstand).')}</p>`),
    ],
  };

  // ---------------------------------------------------------------- 7 parking on a ramp
  const parking = {
    id: 'parking', difficulty: 3, title: () => L('Parked on a ramp', 'Auf der Rampe geparkt'),
    make: (r) => ({ m: pick(r, [900, 1000, 1200, 1250, 1500, 1600, 2000]), h: 7, run: 24, len: 25 }),
    solve(p, o = {}) {
      const sn = p.h / p.len, cs = p.run / p.len, [s, c] = o.swap ? [cs, sn] : [sn, cs];
      return { R: p.m * G * s, N: p.m * G * c, mus: s / c };
    },
    traps: ['swap'],
    why: { swap: () => L('Sine and cosine swapped: the part of the weight down the ramp belongs to the height, the part into the ramp to the horizontal run.', 'Sinus und Kosinus vertauscht: Der Teil der Gewichtskraft entlang der Rampe gehört zur Höhe, der Teil in die Rampe hinein zur waagrechten Strecke.') },
    fields: () => [field('R', ['R'], 'N', L('static friction that holds the car', 'Haftreibung, die das Auto hält')), field('N', ['N'], 'N', L('normal force', 'Normalkraft')), { ...field('mus', ['mus'], '', L('smallest coefficient of static friction', 'kleinste Haftreibungszahl'), 2), exact: false }],
    text: (p) => L(`A car with a mass of ${kg(p.m)} is parked with its handbrake on, on a ramp in a car park that rises by ${q(p.h, 'm')} for every ${q(p.len, 'm')} of ramp. How large are the static friction that holds it and the normal force? Which coefficient of static friction between tyres and ramp is needed at least?`,
      `Ein Auto mit der Masse ${kg(p.m)} steht mit angezogener Handbremse auf einer Rampe in einem Parkhaus, die pro ${q(p.len, 'm')} Rampe um ${q(p.h, 'm')} ansteigt. Wie gross sind die Haftreibung, die es hält, und die Normalkraft? Welche Haftreibungszahl zwischen Reifen und Rampe ist mindestens nötig?`),
    hints: (p) => [
      L(`The ramp is a right triangle: ${q(p.len, 'm')} along it, ${q(p.h, 'm')} up, so ${q(p.run, 'm')} across (Pythagoras).`, `Die Rampe ist ein rechtwinkliges Dreieck: ${q(p.len, 'm')} entlang, ${q(p.h, 'm')} hoch, also ${q(p.run, 'm')} waagrecht (Pythagoras).`),
      L('At rest: static friction balances the component of the weight down the ramp, the normal force the component into it.', 'In Ruhe: Die Haftreibung hält der Hangabtriebskraft das Gleichgewicht, die Normalkraft der Komponente in die Rampe hinein.'),
      L('The car holds if the needed friction is at most μ_s·F_N.', 'Das Auto hält, wenn die nötige Reibung höchstens μ_H·F_N ist.'),
    ],
    steps: (p, v) => [
      step(L('The ramp', 'Die Rampe'), `$$\\sin\\alpha = \\frac{${p.h}}{${p.len}} = ${num(p.h / p.len, 2)},\\qquad \\cos\\alpha = \\frac{\\sqrt{${p.len}^2 - ${p.h}^2}}{${p.len}} = \\frac{${p.run}}{${p.len}} = ${num(p.run / p.len, 2)}$$`),
      step(L('Forces at rest', 'Kräfte in Ruhe'), `$$${T('R')} = m\\,g\\sin\\alpha = ${tq(p.m * G, 'N')}\\cdot ${num(p.h / p.len, 2)} = ${res(v.R, 'N')},\\qquad ${T('N')} = m\\,g\\cos\\alpha = ${res(v.N, 'N')}$$`),
      step(L('Enough friction?', 'Genug Reibung?'), `$$${T('R')} \\le ${T('mus')}\\,${T('N')} \\;\\Rightarrow\\; ${T('mus')} \\ge \\frac{${T('R')}}{${T('N')}} = \\frac{${p.h}}{${p.run}} = ${res(v.mus, '')}$$` +
        `<p>${L('The mass cancels: whether a car slips depends only on the slope and the tyres.', 'Die Masse kürzt sich weg: Ob ein Auto rutscht, hängt nur von der Steigung und den Reifen ab.')}</p>`),
    ],
  };

  // ---------------------------------------------------------------- 8 a skydiver
  const skydiver = {
    id: 'skydiver', difficulty: 3, title: () => L('A skydiver', 'Eine Fallschirmspringerin'),
    make: (r) => ({ m: pick(r, [60, 70, 80, 90, 100]), k: pick(r, [1.5, 2, 2.5, 3, 4]) }),
    solve: (p, o = {}) => ({ D: p.m * G, a: o.noG ? p.k * G : (p.k - 1) * G }),
    traps: ['noG'],
    why: { noG: () => L('The weight still pulls down: only the difference between air resistance and weight brakes the fall.', 'Die Gewichtskraft zieht weiterhin nach unten: Nur die Differenz zwischen Luftwiderstand und Gewichtskraft bremst den Fall.') },
    fields: () => [field('D', ['D'], 'N', L('air resistance at constant speed', 'Luftwiderstand bei konstanter Geschwindigkeit')), field('a', ['a'], 'a', L('deceleration when the parachute opens', 'Verzögerung beim Öffnen des Fallschirms'))],
    text: (p) => L(`A skydiver with equipment (${kg(p.m)}) falls at a constant speed of about 50 m/s before opening the parachute. How large is the air resistance then? When the parachute opens, the air resistance suddenly rises to ${N(p.k * p.m * G)}. How large is the deceleration at that moment?`,
      `Eine Fallschirmspringerin mit Ausrüstung (${kg(p.m)}) fällt vor dem Öffnen des Fallschirms mit konstanter Geschwindigkeit von etwa 50 m/s. Wie gross ist dann der Luftwiderstand? Wenn sich der Fallschirm öffnet, steigt der Luftwiderstand plötzlich auf ${N(p.k * p.m * G)}. Wie gross ist in diesem Moment die Verzögerung?`),
    hints: () => [
      L('Constant speed means no acceleration: the forces balance.', 'Konstante Geschwindigkeit heisst keine Beschleunigung: Die Kräfte heben sich auf.'),
      L(`When the parachute opens, the air resistance is larger than the weight: the net force points up, ${m$(`${T('D')} - m\\,g = m\\,a`)}.`, `Wenn sich der Fallschirm öffnet, ist der Luftwiderstand grösser als die Gewichtskraft: Die resultierende Kraft zeigt nach oben, ${m$(`${T('D')} - m\\,g = m\\,a`)}.`),
    ],
    steps: (p, v) => [
      step(L('Constant speed', 'Konstante Geschwindigkeit'), `<p>${L('No acceleration, so the net force is zero: the air resistance balances the weight.', 'Keine Beschleunigung, also ist die resultierende Kraft null: Der Luftwiderstand hält der Gewichtskraft das Gleichgewicht.')}</p>$$${T('D')} = m\\,g = ${res(v.D, 'N')}$$`),
      step(L('The parachute opens', 'Der Fallschirm öffnet sich'), `$$${T('D')} - m\\,g = m\\,a \\;\\Rightarrow\\; a = \\frac{${tq(p.k * p.m * G, 'N')} - ${tq(p.m * G, 'N')}}{${tq(p.m, 'kg')}} = ${res(v.a, 'a')}$$` +
        `<p>${L(`The acceleration points up: she is braked by ${num(v.a / G)} g.`, `Die Beschleunigung zeigt nach oben: Sie wird mit ${num(v.a / G)} g abgebremst.`)}</p>`),
    ],
  };

  // ---------------------------------------------------------------- 9 a rocket launch
  const rocket = {
    id: 'rocket', difficulty: 3, title: () => L('Lift-off', 'Raketenstart'),
    make(r) {
      const M = pick(r, [300, 400, 500, 550, 600]) * 1000, a = pick(r, [2, 3, 4, 5]);
      return { M, a, Th: M * (G + a), ma: pick(r, [60, 70, 75, 80, 90]) };
    },
    solve: (p, o = {}) => {
      const a = o.noG ? p.Th / p.M : p.Th / p.M - G;
      return { a, N: o.noG ? p.ma * G : p.ma * (G + a) };
    },
    traps: ['noG'],
    why: { noG: () => L('The weight acts against the thrust: only their difference accelerates the rocket.', 'Die Gewichtskraft wirkt gegen den Schub: Nur ihre Differenz beschleunigt die Rakete.') },
    fields: () => [field('a', ['a'], 'a', L('acceleration', 'Beschleunigung')), field('N', ['N'], 'N', L('force of the seat on the astronaut', 'Kraft des Sitzes auf die Astronautin'))],
    text: (p) => L(`At lift-off, a rocket with a mass of ${t(p.M)} has a thrust of ${kN(p.Th)}. With which acceleration does it lift off (air resistance negligible)? With which force does her seat push on an astronaut of ${kg(p.ma)}?`,
      `Beim Start hat eine Rakete mit der Masse ${t(p.M)} einen Schub von ${kN(p.Th)}. Mit welcher Beschleunigung hebt sie ab (Luftwiderstand vernachlässigbar)? Mit welcher Kraft drückt ihr Sitz auf eine Astronautin von ${kg(p.ma)}?`),
    hints: () => [
      L('The rocket: thrust up, weight down; the difference accelerates it.', 'Die Rakete: Schub nach oben, Gewichtskraft nach unten; die Differenz beschleunigt sie.'),
      L('The astronaut has the same acceleration: her seat pushes up, her weight pulls down.', 'Die Astronautin hat dieselbe Beschleunigung: Ihr Sitz drückt nach oben, ihre Gewichtskraft zieht nach unten.'),
    ],
    steps: (p, v) => [
      step(L('The rocket', 'Die Rakete'), `$$${T('Th')} - m\\,g = m\\,a \\;\\Rightarrow\\; a = \\frac{${T('Th')}}{m} - g = \\frac{${tq(p.Th, 'N')}}{${tq(p.M, 'kg')}} - ${tq(G, 'a')} = ${res(v.a, 'a')}$$`),
      step(L('The astronaut', 'Die Astronautin'), `$$${T('N')} - m_\\mathrm{A}\\,g = m_\\mathrm{A}\\,a \\;\\Rightarrow\\; ${T('N')} = m_\\mathrm{A}\\,(g + a) = ${tq(p.ma, 'kg')}\\cdot ${tq(G + v.a, 'a')} = ${res(v.N, 'N')}$$` +
        `<p>${L(`${num((G + v.a) / G)} times her weight: she feels ${num((G + v.a) / G)} g.`, `${num((G + v.a) / G)}-mal ihre Gewichtskraft: Sie spürt ${num((G + v.a) / G)} g.`)}</p>`),
    ],
  };

  // ---------------------------------------------------------------- 10 pulling a sled
  const sled = {
    id: 'sled', difficulty: 4, title: () => L('Pulling a sled', 'Einen Schlitten ziehen'),
    make: (r) => { const [mu, ms] = pick(r, [[0.1, [43]], [0.2, [23, 46]], [0.25, [19, 38, 57]]]); return { mu, m: pick(r, ms) }; },
    // the rope: 1 m long, the hand 0.6 m higher than where it is tied, so sin α = 0.6, cos α = 0.8
    solve(p, o = {}) {
      const s = 0.6, c = 0.8, F = o.flat ? (p.mu * p.m * G) / c : o.whole ? p.mu * p.m * G : (p.mu * p.m * G) / (c + p.mu * s);
      return { F, N: p.m * G - F * s };
    },
    traps: ['flat', 'whole'],
    why: {
      flat: () => L('The rope also pulls a little upwards: the sled presses less on the snow, and friction is smaller.', 'Das Seil zieht auch etwas nach oben: Der Schlitten drückt weniger auf den Schnee, und die Reibung ist kleiner.'),
      whole: () => L('Only the horizontal part of the pull, F cos α, moves the sled forward.', 'Nur der waagrechte Teil der Zugkraft, F cos α, bewegt den Schlitten vorwärts.'),
    },
    fields: () => [field('F', ['F'], 'N', L('pulling force', 'Zugkraft')), field('N', ['N'], 'N', L('normal force on the sled', 'Normalkraft auf den Schlitten'))],
    text: (p) => L(`You pull a sled with a child on it (together ${kg(p.m)}) at constant speed across level snow. The rope is 1 m long, and your hand is 60 cm higher than where the rope is tied to the sled. The coefficient of friction between sled and snow is ${num(p.mu, 2)}. How hard must you pull, and how large is the normal force on the sled?`,
      `Du ziehst einen Schlitten mit einem Kind darauf (zusammen ${kg(p.m)}) mit konstanter Geschwindigkeit über ebenen Schnee. Das Seil ist 1 m lang, und deine Hand ist 60 cm höher als die Stelle, an der das Seil am Schlitten befestigt ist. Die Reibungszahl zwischen Schlitten und Schnee beträgt ${num(p.mu, 2)}. Wie stark musst du ziehen, und wie gross ist die Normalkraft auf den Schlitten?`),
    hints: () => [
      L('The rope is the hypotenuse of a right triangle: 1 m long, 0.6 m up, so 0.8 m across. sin α = 0.6, cos α = 0.8.', 'Das Seil ist die Hypotenuse eines rechtwinkligen Dreiecks: 1 m lang, 0.6 m hoch, also 0.8 m waagrecht. sin α = 0.6, cos α = 0.8.'),
      L('Vertically: F_N + 0.6 F = m g. Horizontally (constant speed): 0.8 F = μ F_N.', 'Senkrecht: F_N + 0.6 F = m g. Waagrecht (konstante Geschwindigkeit): 0.8 F = μ F_N.'),
      L('Insert F_N = m g − 0.6 F into the second equation and solve for F.', 'Setze F_N = m g − 0.6 F in die zweite Gleichung ein und löse nach F auf.'),
    ],
    steps: (p, v) => [
      step(L('The rope’s angle', 'Der Winkel des Seils'), `<p>${L('1 m along the rope, 0.6 m up, so 0.8 m across:', '1 m entlang des Seils, 0.6 m hoch, also 0.8 m waagrecht:')} $\\sin\\alpha = 0.6$, $\\cos\\alpha = 0.8$.</p>`),
      step(L('Two balances', 'Zwei Gleichgewichte'), `<p>${L('Vertically, the floor and the upward part of the pull carry the weight; horizontally (constant speed), the forward part of the pull balances friction:', 'Senkrecht tragen der Boden und der nach oben gerichtete Teil der Zugkraft die Gewichtskraft; waagrecht (konstante Geschwindigkeit) hält der Teil nach vorn der Reibung das Gleichgewicht:')}</p>` +
        `$$${T('N')} + 0.6\\,F = m\\,g,\\qquad 0.8\\,F = \\mu\\,${T('N')}$$`),
      step(L('Solved for F', 'Nach F aufgelöst'), `$$0.8\\,F = \\mu\\,(m\\,g - 0.6\\,F) \\;\\Rightarrow\\; F = \\frac{\\mu\\,m\\,g}{0.8 + 0.6\\,\\mu} = \\frac{${num(p.mu, 2)}\\cdot ${tq(p.m * G, 'N')}}{${num(0.8 + 0.6 * p.mu, 3)}} = ${res(v.F, 'N')}$$` +
        `$$${T('N')} = m\\,g - 0.6\\,F = ${tq(p.m * G, 'N')} - 0.6\\cdot ${tq(v.F, 'N')} = ${res(v.N, 'N')}$$` +
        `<p>${L('Pulling slightly upwards helps: it presses the sled less onto the snow.', 'Leicht nach oben zu ziehen hilft: Es drückt den Schlitten weniger auf den Schnee.')}</p>`),
    ],
  };

  // ---------------------------------------------------------------- 11 a lift and its counterweight
  const counterweight = {
    id: 'counterweight', difficulty: 4, title: () => L('Lift and counterweight', 'Lift und Gegengewicht'),
    make(r) {
      const mC = pick(r, [600, 700, 750, 800, 900, 1000, 1100, 1200, 1300, 1400]), mG = pick(r, [400, 500, 600, 700, 800, 900, 1000]);
      return mG < mC ? { mC, mG } : null;
    },
    solve(p, o = {}) {
      const a = ((p.mC - p.mG) * G) / (o.oneMass ? p.mC : p.mC + p.mG);
      return { a, S: o.hangW ? p.mG * G : p.mG * (G + a) };
    },
    traps: ['oneMass', 'hangW'],
    why: {
      oneMass: () => L('Both the cabin and the counterweight are accelerated: divide by both masses.', 'Kabine und Gegengewicht werden beide beschleunigt: Teile durch beide Massen.'),
      hangW: () => L('The counterweight accelerates upwards, so the cable pulls it with more than its weight.', 'Das Gegengewicht wird nach oben beschleunigt, also zieht das Seil es mit mehr als seiner Gewichtskraft.'),
    },
    fields: () => [field('a', ['a'], 'a', L('acceleration', 'Beschleunigung'), 2), field('S', ['S'], 'N', L('force in the cable', 'Kraft im Seil'))],
    text: (p) => L(`In a lift, the cabin (with passengers ${kg(p.mC)}) and a counterweight (${kg(p.mG)}) hang on the two ends of a cable over a pulley at the top of the shaft. Suppose the motor fails, the pulley turns freely and the safety brakes have not yet engaged. With which acceleration does the cabin start to move down, and how large is the force in the cable? (Friction and the masses of cable and pulley are negligible.)`,
      `In einem Lift hängen die Kabine (mit Fahrgästen ${kg(p.mC)}) und ein Gegengewicht (${kg(p.mG)}) an den beiden Enden eines Seils über eine Rolle oben im Schacht. Angenommen, der Motor fällt aus, die Rolle dreht sich frei, und die Fangbremsen greifen noch nicht. Mit welcher Beschleunigung beginnt die Kabine zu sinken, und wie gross ist die Kraft im Seil? (Reibung und die Massen von Seil und Rolle sind vernachlässigbar.)`),
    hints: () => [
      L('Along the cable, cabin and counterweight form one system: the difference of their weights accelerates both.', 'Entlang des Seils bilden Kabine und Gegengewicht ein System: Die Differenz ihrer Gewichtskräfte beschleunigt beide.'),
      L(`Then the counterweight alone: it goes up, so ${m$(`${T('S')} - m_\\mathrm{G}\\,g = m_\\mathrm{G}\\,a`)}.`, `Dann das Gegengewicht allein: Es geht nach oben, also ${m$(`${T('S')} - m_\\mathrm{G}\\,g = m_\\mathrm{G}\\,a`)}.`),
    ],
    steps: (p, v) => [
      step(L('Both together', 'Beide zusammen'), `$$a = \\frac{(m_\\mathrm{K} - m_\\mathrm{G})\\,g}{m_\\mathrm{K} + m_\\mathrm{G}} = \\frac{${tq((p.mC - p.mG) * G, 'N')}}{${tq(p.mC + p.mG, 'kg')}} = ${res(v.a, 'a')}$$` +
        `<p>${L('The counterweight makes the motor’s job easier, and the fall slower.', 'Das Gegengewicht erleichtert dem Motor die Arbeit und macht den Fall langsamer.')}</p>`),
      step(L('The cable force', 'Die Seilkraft'), `$$${T('S')} = m_\\mathrm{G}\\,(g + a) = ${tq(p.mG, 'kg')}\\cdot ${tq(G + v.a, 'a')} = ${res(v.S, 'N')}$$` +
        `<p>${L('Check with the cabin: m_K g − F_S = m_K a.', 'Kontrolle mit der Kabine: m_K g − F_S = m_K a.')}</p>`),
    ],
  };

  // ---------------------------------------------------------------- 12 emergency braking
  const ROADS = { dry: [0.8, 'dry', 'trockener'], wet: [0.5, 'wet', 'nasser'], snow: [0.2, 'snowy', 'verschneiter'] };
  const braking = {
    id: 'braking', difficulty: 2, title: () => L('Emergency braking', 'Notbremsung'),
    make: (r) => ({ m: pick(r, [800, 1000, 1200, 1500, 1800, 2000]), road: pick(r, Object.keys(ROADS)) }),
    solve: (p) => ({ R: ROADS[p.road][0] * p.m * G, a: ROADS[p.road][0] * G }),
    traps: [],
    why: {},
    fields: () => [field('R', ['R'], 'N', L('largest braking force', 'grösste Bremskraft')), field('a', ['a'], 'a', L('largest deceleration', 'grösste Verzögerung'))],
    text: (p) => L(`A car of ${kg(p.m)} brakes as hard as it can on a ${ROADS[p.road][1]} road, without the wheels locking (ABS). The coefficient of static friction between tyres and road is ${num(ROADS[p.road][0], 2)}. How large are the braking force and the deceleration? Would a heavier car stop sooner?`,
      `Ein Auto von ${kg(p.m)} bremst auf ${ROADS[p.road][2]} Strasse so stark wie möglich, ohne dass die Räder blockieren (ABS). Die Haftreibungszahl zwischen Reifen und Strasse beträgt ${num(ROADS[p.road][0], 2)}. Wie gross sind die Bremskraft und die Verzögerung? Würde ein schwereres Auto früher anhalten?`),
    hints: () => [
      L('The only horizontal force on the car is the friction of the road on the tyres: at most μ_s times the normal force.', 'Die einzige waagrechte Kraft auf das Auto ist die Reibung der Strasse an den Reifen: höchstens μ_H mal die Normalkraft.'),
      L('On a level road, the normal force equals the weight; then a = F/m.', 'Auf ebener Strasse ist die Normalkraft gleich der Gewichtskraft; dann a = F/m.'),
    ],
    steps: (p, v) => [
      step(L('Braking force', 'Bremskraft'), `$$${T('R')} = ${T('mus')}\\,${T('N')} = ${T('mus')}\\,m\\,g = ${num(ROADS[p.road][0], 2)}\\cdot ${tq(p.m * G, 'N')} = ${res(v.R, 'N')}$$`),
      step(L('Deceleration', 'Verzögerung'), `$$a = \\frac{${T('R')}}{m} = ${T('mus')}\\,g = ${res(v.a, 'a')}$$` +
        `<p>${L('The mass cancels: a heavier car needs more braking force, but the road gives it just as much more. It stops no sooner (in reality, the tyres and brakes decide).', 'Die Masse kürzt sich weg: Ein schwereres Auto braucht mehr Bremskraft, aber die Strasse liefert entsprechend mehr. Es hält nicht früher an (in Wirklichkeit entscheiden Reifen und Bremsen).')}</p>`),
    ],
  };

  const PROBLEMS = [scale, crane, truck, braking, tow, train, skydiver, rocket, parking, skier, sled, counterweight];

  // ---------------------------------------------------------------- exercises
  const exactTo = (x, dec) => Math.abs(x * 10 ** dec - Math.round(x * 10 ** dec)) < 1e-6;
  const same = (x, y) => Math.abs(x - y) <= 0.015 * Math.max(Math.abs(y), 0.05);
  function realOf(i, seed) {
    const pb = PROBLEMS[i], r = rng(seed);
    let p = null;
    for (let k = 0; k < 5000 && !p; k++) {
      const c = pb.make(r);
      if (c && pb.fields(c).every((f) => (f.exact === false || exactTo(pb.solve(c)[f.key], f.dec)) && pb.solve(c)[f.key] > 0)) p = c;
    }
    const v = pb.solve(p);
    const wrong = pb.traps.map((flag) => ({ vals: pb.solve(p, { [flag]: true }), why: pb.why[flag](), flag }));
    const fields = pb.fields(p).map((f) => ({
      ...f, value: v[f.key],
      traps: wrong.map((w) => ({ value: w.vals[f.key], why: w.why, flag: w.flag })).filter((x) => Number.isFinite(x.value) && !same(x.value, v[f.key])),
    }));
    return {
      id: `real${i + 1}-${seed}`, real: i, seed, scenario: `real-${pb.id}`, difficulty: pb.difficulty,
      title: pb.title(), text: `<p>${pb.text(p)}</p><p class="note">${L('Take g = 10 m/s².', 'Rechne mit g = 10 m/s².')}</p>`,
      // the picture of the situation (figures.js) and the force diagrams (realpictures.js)
      fields, forces: null, comps: [],
      taskFigure: () => (root.ForceFigures ? root.ForceFigures[pb.id](p, v) : ''),
      solutionFigure: () => (root.RealPictures && root.RealPictures[pb.id] ? root.RealPictures[pb.id].fbd(p, v) : ''),
      hints: pb.hints(p, v), solution: pb.steps(p, v),
      results: fields.map((f) => `$${T(...f.sym)} = ${tq(f.value, f.unit)}$`).join(', '),
      p, v,
    };
  }

  root.RealProblems = { PROBLEMS, realOf };
  if (typeof module !== 'undefined') module.exports = root.RealProblems;
})(typeof window !== 'undefined' ? window : globalThis);
