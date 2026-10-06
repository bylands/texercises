// Problems: energy conservation in sport, traffic and play, told as stories, solved as in this
// app: the energy in each state (the table), then energy conservation between two states. Each
// has random values that keep the numbers simple, a picture of the situation (artkit.js) and the
// energy bars of the states for the solution (draw.js):
//   { id, difficulty, title(), make(r), solve(p), zero(), states(p, v) [{pot, kin, el} in J],
//     spring, fields(), text(p), hints(p), steps(p, v), pic(p) }
// realOf(i, seed) gives an exercise as the practice ones (generator.js), with several numbers to
// find and no formulas to type.
(function (root) {
  'use strict';

  const EC = root.EC;
  const { L, G, rng, pick, num, sig, CIRCLED } = EC;
  const TU = { g: '\\mathrm{g}', cm: '\\mathrm{cm}', m: '\\mathrm{m}', v: '\\mathrm{\\tfrac{m}{s}}', kg: '\\mathrm{kg}', k: '\\mathrm{\\tfrac{N}{m}}', kmh: '\\mathrm{\\tfrac{km}{h}}', J: '\\mathrm{J}' };
  const UT = { g: 'g', cm: 'cm', m: 'm', v: 'm/s', kg: 'kg', k: 'N/m', kmh: 'km/h', J: 'J' };
  const q = (x, u) => `${num(x)}\u00a0${UT[u]}`; // in the text
  const tq = (x, u) => `${num(x)}\\,${TU[u]}`; // in formulas
  const exact = (x) => Math.abs(sig(x) - x) < 1e-9 * Math.max(1, Math.abs(x));
  const res = (x, u) => `${exact(x) ? '=' : '\\approx'} \\htmlClass{result}{${sig(x)}\\,${TU[u]}}`;
  const gq = `${G}\\,\\mathrm{\\tfrac{m}{s^2}}`;
  const step = (rule, html) => `<p class="step-rule">${rule}</p>${html}`;
  const p$ = (s) => `<p>${s}</p>`;
  const field = (key, sym, unit, what, traps = []) => ({ key, sym, unit, what, traps });
  const trap = (value, why) => ({ value, why });
  const sq = (x) => x * x;
  const E = (k) => EC.etex(k);

  // ---------------------------------------------------------------- pictures
  const A = () => root.Art;
  const lbl = (x, y, t, cls = 'lbl small', anchor = 'middle') => A().text(x, y, t, cls, anchor);
  // a dashed height arrow with its label
  const height = (x, y0, y1, t, side = -1) => A().line([x, y0], [x, y1], 'rp-hline') + A().path(`M${x - 4} ${y1 + (y1 < y0 ? 7 : -7)}L${x} ${y1}L${x + 4} ${y1 + (y1 < y0 ? 7 : -7)}`, 'rp-hline') + lbl(x + 6 * side, (y0 + y1) / 2 + 4, t, 'lbl small', side < 0 ? 'end' : 'start');
  const zigzag = (a, b, n = 10, w = 7) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]), u = [(b[0] - a[0]) / len, (b[1] - a[1]) / len], nn = [-u[1], u[0]];
    const pts = [a];
    for (let k = 0; k < 2 * n; k++) { const s = ((k + 0.5) * len) / (2 * n), side = k % 2 ? -w : w; pts.push([a[0] + s * u[0] + side * nn[0], a[1] + s * u[1] + side * nn[1]]); }
    pts.push(b);
    return A().path(`M${pts.map((pt) => pt.map(A().f).join(' ')).join('L')}`, 'rp-spring');
  };
  const skier = (x, y, s = 1, ang = 0) => `<g transform="translate(${x} ${y}) rotate(${ang})">${A().person(0, 0, s, { knee: 7, lean: 8, shirt: 'red', hands: [[-6 * s, -34 * s], [12 * s, -32 * s]] })}${A().line([-22 * s, 1], [24 * s, 1], 'rp-ski')}</g>`;

  // ---------------------------------------------------------------- 1 a crash test
  const crash = {
    id: 'crash', difficulty: 1, title: () => L('A crash test', 'Ein Crashtest'),
    make: (r) => ({ vk: pick(r, [30, 36, 45, 50, 54, 60]) }),
    solve: (p) => { const v = p.vk / 3.6; return { h: sq(v) / (2 * G), h2: sq(2 * v) / (2 * G) }; },
    zero: () => L('the ground', 'der Boden'),
    names: () => [L('the falling car at the start, at rest', 'das fallende Auto am Anfang, in Ruhe'), L('just before it hits the ground', 'kurz vor dem Aufprall')],
    states: (p, v) => [{ pot: G * v.h }, { kin: G * v.h }],
    fields: (p) => [
      field('h', 'h', 'm', L('height', 'Höhe'), [trap(sq(p.vk) / (2 * G), L('Convert the speed into m/s first: divide km/h by 3.6.', 'Rechne die Geschwindigkeit zuerst in m/s um: km/h durch 3.6 teilen.'))]),
      field('h2', "h'", 'm', L('at twice the speed', 'bei doppelter Geschwindigkeit'), [trap(2 * sq(p.vk / 3.6) / (2 * G), L('The kinetic energy grows with the square of the speed.', 'Die kinetische Energie wächst mit dem Quadrat der Geschwindigkeit.'))]),
    ],
    text: (p) => L(`In a crash test, a car hits a concrete block at ${q(p.vk, 'kmh')}. From what height would the car have to fall to hit the ground at the same speed? And from what height at twice the speed, ${q(2 * p.vk, 'kmh')}?`,
      `Bei einem Crashtest prallt ein Auto mit ${q(p.vk, 'kmh')} gegen einen Betonblock. Aus welcher Höhe müsste das Auto fallen, um mit derselben Geschwindigkeit auf dem Boden aufzuschlagen? Und aus welcher Höhe bei doppelter Geschwindigkeit, ${q(2 * p.vk, 'kmh')}?`),
    hints: () => [
      L('Think of the fall: at the top, the car has only potential energy; just before the ground, only kinetic energy.', 'Denk an den Fall: Oben hat das Auto nur Lageenergie, kurz vor dem Boden nur kinetische Energie.'),
      L('Speed in m/s: divide km/h by 3.6.', 'Geschwindigkeit in m/s: km/h durch 3.6 teilen.'),
    ],
    steps: (p, v) => [
      step(L('Energy conservation', 'Energieerhaltung'), p$(L(`Let $h$ be the height and $v$ the speed. At ①, the falling car has only potential energy, at ② only kinetic energy: $${E('pot')} = ${E('kin')}$, so`, `Sei $h$ die Höhe und $v$ die Geschwindigkeit. In ① hat das fallende Auto nur Lageenergie, in ② nur kinetische Energie: $${E('pot')} = ${E('kin')}$, also`)) +
        `$$m\\,g\\,h = \\tfrac{1}{2}\\,m\\,v^2 \\;\\Rightarrow\\; h = \\frac{v^2}{2\\,g}$$`),
      step(L('The numbers', 'Die Zahlen'), p$(L(`The speed is $v = ${p.vk}/3.6\\,\\mathrm{\\tfrac{m}{s}} \\approx ${sig(p.vk / 3.6)}\\,\\mathrm{\\tfrac{m}{s}}$:`, `Die Geschwindigkeit ist $v = ${p.vk}/3.6\\,\\mathrm{\\tfrac{m}{s}} \\approx ${sig(p.vk / 3.6)}\\,\\mathrm{\\tfrac{m}{s}}$:`)) +
        `$$h = \\frac{(${p.vk}/3.6\\,\\mathrm{\\tfrac{m}{s}})^2}{2\\cdot ${gq}} ${res(v.h, 'm')}$$`),
      step(L('Twice the speed', 'Doppelte Geschwindigkeit'), p$(L('The height grows with the square of the speed: twice the speed needs four times the height.', 'Die Höhe wächst mit dem Quadrat der Geschwindigkeit: Doppelte Geschwindigkeit braucht die vierfache Höhe.')) +
        `$$h' = \\frac{(2v)^2}{2\\,g} = 4\\,h ${res(v.h2, 'm')}$$` + p$(L(`That is about ${Math.round(v.h2 / 3)} floors of a building.`, `Das sind etwa ${Math.round(v.h2 / 3)} Stockwerke eines Gebäudes.`))),
    ],
    pic(p) {
      const a = A(), y = 180;
      return a.svg(420, 230, a.bg(0, 0, 420, 230) + a.rect(250, 20, 330, y, 'rp-building', 2) +
        [0, 1, 2, 3, 4, 5, 6, 7].map((k) => a.rect(262 + 34 * (k % 2), 30 + 19 * Math.floor(k / 2) * 2, 284 + 34 * (k % 2), 46 + 19 * Math.floor(k / 2) * 2, 'rp-window', 1)).join('') +
        a.ground(0, 420, y, 'asphalt', 50) + a.rect(184, y - 70, 214, y, 'rp-concrete-block', 2) +
        a.car(30, y, 150, 'red') + a.path(`M12 ${y - 40}h24M4 ${y - 26}h30M14 ${y - 12}h20`, 'rp-speed') + lbl(105, y - 82, q(p.vk, 'kmh'), 'lbl') +
        `<g opacity="0.45">${a.car(338, 52, 70, 'red')}</g>` + height(372, y, 60, '?'),
      L('A car driving into a concrete block, and a car high above the ground', 'Ein Auto fährt gegen einen Betonblock, und ein Auto hoch über dem Boden'));
    },
  };

  // ---------------------------------------------------------------- 2 a fountain
  const fountain = {
    id: 'fountain', difficulty: 2, title: () => L('A fountain', 'Ein Springbrunnen'),
    make: (r) => ({ H: pick(r, [5, 7.2, 12.8, 20, 31.25, 45]) }),
    solve: (p) => ({ v: Math.sqrt(2 * G * p.H), h: 0.75 * p.H }),
    zero: () => L('the nozzle', 'die Düse'),
    names: () => [L('the water at the nozzle', 'das Wasser an der Düse'), L('at half the speed', 'bei halber Geschwindigkeit'), L('at the top', 'zuoberst')],
    states: (p) => [{ kin: G * p.H }, { pot: G * p.H * 0.75, kin: G * p.H * 0.25 }, { pot: G * p.H }],
    fields: (p) => [
      field('v', 'v_0', 'v', L('speed at the nozzle', 'Geschwindigkeit an der Düse'), [trap(2 * G * p.H, L('The energy equation gives v²: take the square root.', 'Die Energiegleichung liefert v²: Zieh noch die Wurzel.'))]),
      field('h', 'h', 'm', L('height at half the speed', 'Höhe bei halber Geschwindigkeit'), [trap(p.H / 2, L('Half the speed is only a quarter of the kinetic energy.', 'Die halbe Geschwindigkeit ist nur ein Viertel der kinetischen Energie.'))]),
    ],
    text: (p) => L(`A fountain shoots its water straight up, ${q(p.H, 'm')} above the nozzle. How fast does the water leave the nozzle? At what height above the nozzle is the water half as fast?`,
      `Ein Springbrunnen spritzt sein Wasser senkrecht nach oben, ${q(p.H, 'm')} über die Düse. Wie schnell verlässt das Wasser die Düse? In welcher Höhe über der Düse ist das Wasser halb so schnell?`),
    hints: () => [
      L('Follow a little bit of water: at the nozzle it has only kinetic energy, at the top only potential energy.', 'Verfolge ein wenig Wasser: An der Düse hat es nur kinetische Energie, zuoberst nur Lageenergie.'),
      L('At half the speed, the kinetic energy is a quarter of what it was at the nozzle. The rest has become potential energy.', 'Bei halber Geschwindigkeit ist die kinetische Energie ein Viertel derjenigen an der Düse. Der Rest ist zu Lageenergie geworden.'),
    ],
    steps: (p, v) => [
      step(L('Speed at the nozzle', 'Geschwindigkeit an der Düse'), p$(L(`Let $H$ be the height of the jet and $v_0$ the speed at the nozzle. Between ① and ③, kinetic energy becomes potential energy:`, `Sei $H$ die Höhe des Strahls und $v_0$ die Geschwindigkeit an der Düse. Zwischen ① und ③ wird kinetische Energie zu Lageenergie:`)) +
        `$$\\tfrac{1}{2}\\,m\\,v_0^2 = m\\,g\\,H \\;\\Rightarrow\\; v_0 = \\sqrt{2\\,g\\,H} = \\sqrt{2\\cdot ${gq}\\cdot ${tq(p.H, 'm')}} ${res(v.v, 'v')}$$`),
      step(L('Half the speed', 'Halbe Geschwindigkeit'), p$(L(`At ②, at the height $h$, the speed is $v_0/2$. Energy conservation between ① and ②, with $\\tfrac{1}{2}\\,m\\,v_0^2 = m\\,g\\,H$:`, `In ②, auf der Höhe $h$, ist die Geschwindigkeit $v_0/2$. Energieerhaltung zwischen ① und ②, mit $\\tfrac{1}{2}\\,m\\,v_0^2 = m\\,g\\,H$:`)) +
        `$$m\\,g\\,H = m\\,g\\,h + \\tfrac{1}{2}\\,m\\left(\\frac{v_0}{2}\\right)^2 = m\\,g\\,h + \\tfrac{1}{4}\\,m\\,g\\,H \\;\\Rightarrow\\; h = \\tfrac{3}{4}\\,H ${res(v.h, 'm')}$$` +
        p$(L('Half the speed means a quarter of the kinetic energy: three quarters of the way up.', 'Halbe Geschwindigkeit heisst ein Viertel der kinetischen Energie: drei Viertel des Wegs nach oben.'))),
    ],
    pic(p) {
      const a = A(), y = 190, top = 34;
      const drops = [[-14, 50], [12, 44], [-22, 70], [20, 66], [-8, 30], [6, 28]].map(([dx, dy]) => a.circle(210 + dx, top + dy, 3, 'rp-drop')).join('');
      return a.svg(420, 230, a.bg(0, 0, 420, 230) + a.tree(60, y, 90) + a.tree(360, y, 70) + a.ground(0, 420, y, 'grass', 40) +
        a.path(`M120 ${y - 6}Q210 ${y - 26} 300 ${y - 6}L300 ${y + 10}H120Z`, 'rp-basin') + a.path(`M130 ${y - 8}Q210 ${y - 22} 290 ${y - 8}`, 'rp-waterline') +
        a.path(`M204 ${y - 18}L206 ${top + 6}Q210 ${top - 6} 214 ${top + 6}L216 ${y - 18}Z`, 'rp-jet') +
        a.path(`M210 ${top + 2}C190 ${top + 2} 180 ${top + 40} 176 ${y - 20}M210 ${top + 2}C230 ${top + 2} 240 ${top + 40} 244 ${y - 20}`, 'rp-spray') + drops +
        a.rect(200, y - 20, 220, y - 12, 'rp-dark', 2) + height(330, y - 16, top, q(p.H, 'm')),
      L('A fountain shooting water straight up', 'Ein Springbrunnen spritzt Wasser senkrecht nach oben'));
    },
  };

  // ---------------------------------------------------------------- 3 a roller coaster
  const coaster = {
    id: 'coaster', difficulty: 2, title: () => L('A roller coaster', 'Eine Achterbahn'),
    make: (r) => ({ H: pick(r, [45, 50, 60, 72, 80]), h2: pick(r, [20, 25, 30, 35]) }),
    solve: (p) => ({ v1: Math.sqrt(2 * G * p.H), v2: Math.sqrt(2 * G * (p.H - p.h2)) }),
    zero: () => L('the bottom of the valley', 'der tiefste Punkt des Tals'),
    names: () => [L('on the first hill', 'auf dem ersten Hügel'), L('at the bottom of the valley', 'zuunterst im Tal'), L('on the second hill', 'auf dem zweiten Hügel')],
    states: (p) => [{ pot: G * p.H }, { kin: G * p.H }, { pot: G * p.h2, kin: G * (p.H - p.h2) }],
    fields: (p) => [
      field('v1', 'v_1', 'v', L('speed at the bottom', 'Geschwindigkeit zuunterst'), [trap(2 * G * p.H, L('The energy equation gives v²: take the square root.', 'Die Energiegleichung liefert v²: Zieh noch die Wurzel.'))]),
      field('v2', 'v_2', 'v', L('speed on the second hill', 'Geschwindigkeit auf dem zweiten Hügel'), [trap(Math.sqrt(2 * G * p.H) - Math.sqrt(2 * G * p.h2), L('Speeds cannot be subtracted, energies can: what counts is the height the car has lost.', 'Geschwindigkeiten kann man nicht subtrahieren, Energien schon: Entscheidend ist die Höhe, die der Wagen verloren hat.'))]),
    ],
    text: (p) => L(`A roller coaster car rolls over the top of the first hill, ${q(p.H, 'm')} above the bottom of the valley that follows, almost at rest. How fast is it at the bottom of the valley? How fast is it on the top of the next hill, ${q(p.h2, 'm')} above the bottom of the valley?`,
      `Ein Achterbahnwagen rollt fast aus der Ruhe über die Spitze des ersten Hügels, ${q(p.H, 'm')} über dem tiefsten Punkt des folgenden Tals. Wie schnell ist er zuunterst im Tal? Wie schnell ist er auf der Spitze des nächsten Hügels, ${q(p.h2, 'm')} über dem tiefsten Punkt des Tals?`),
    hints: () => [
      L('Only the heights count, not the shape of the track.', 'Nur die Höhen zählen, nicht die Form der Bahn.'),
      L('On the second hill, the car has lost only part of its height: that part has become kinetic energy.', 'Auf dem zweiten Hügel hat der Wagen nur einen Teil seiner Höhe verloren: Dieser Teil ist zu kinetischer Energie geworden.'),
    ],
    steps: (p, v) => [
      step(L('At the bottom', 'Zuunterst'), p$(L(`Let $H$ be the height of the first hill and $v_1$ the speed at the bottom. All the potential energy at ① has become kinetic energy at ②:`, `Sei $H$ die Höhe des ersten Hügels und $v_1$ die Geschwindigkeit zuunterst. Die ganze Lageenergie in ① ist in ② zu kinetischer Energie geworden:`)) +
        `$$m\\,g\\,H = \\tfrac{1}{2}\\,m\\,v_1^2 \\;\\Rightarrow\\; v_1 = \\sqrt{2\\,g\\,H} = \\sqrt{2\\cdot ${gq}\\cdot ${tq(p.H, 'm')}} ${res(v.v1, 'v')}$$`),
      step(L('On the second hill', 'Auf dem zweiten Hügel'), p$(L(`Let $h_2$ be the height of the second hill. Between ① and ③:`, `Sei $h_2$ die Höhe des zweiten Hügels. Zwischen ① und ③:`)) +
        `$$m\\,g\\,H = m\\,g\\,h_2 + \\tfrac{1}{2}\\,m\\,v_2^2 \\;\\Rightarrow\\; v_2 = \\sqrt{2\\,g\\,(H - h_2)} = \\sqrt{2\\cdot ${gq}\\cdot ${tq(p.H - p.h2, 'm')}} ${res(v.v2, 'v')}$$`),
    ],
    pic(p) {
      const a = A(), y = 200, s = 150 / 80, top1 = y - p.H * s, top2 = y - p.h2 * s;
      const track = `M10 ${a.f(top1 + 6)}Q60 ${a.f(top1 - 10)} 100 ${a.f(top1 + 20)}Q150 ${y + 6} 200 ${y - 4}Q250 ${y - 14} 290 ${a.f(top2 + 10)}Q320 ${a.f(top2 - 8)} 350 ${a.f(top2 + 14)}Q380 ${a.f(top2 + 50)} 410 ${a.f(top2 + 70)}`;
      const posts = [40, 80, 120, 260, 300, 340, 380].map((x) => a.line([x, y], [x, y - 20], 'rp-post')).join('');
      return a.svg(420, 230, a.bg(0, 0, 420, 230) + a.ground(0, 420, y, 'grass', 30) + posts +
        a.path(track, 'rp-track') + a.path(track, 'rp-track-ties') +
        a.rect(40, top1 - 16, 72, top1 - 2, 'rp-car red', 4) + a.circle(48, top1 - 1, 4, 'rp-tyre') + a.circle(64, top1 - 1, 4, 'rp-tyre') +
        height(6, y, top1 + 4, q(p.H, 'm'), 1) + height(410, y, top2 + 6, q(p.h2, 'm')),
      L('A roller coaster with two hills', 'Eine Achterbahn mit zwei Hügeln'));
    },
  };

  // ---------------------------------------------------------------- 4 pole vault
  const vault = {
    id: 'vault', difficulty: 2, title: () => L('Pole vault', 'Stabhochsprung'),
    make: (r) => ({ v: pick(r, [8, 8.5, 9, 9.5]), h0: pick(r, [0.9, 1, 1.1]), H: pick(r, [5.5, 6, 6.2]) }),
    solve: (p) => ({ h: p.h0 + sq(p.v) / (2 * G), vn: Math.sqrt(2 * G * (p.H - p.h0)) }),
    zero: () => L('the height of the centre of mass while running', 'die Höhe des Schwerpunkts beim Anlauf'),
    names: () => [L('running', 'beim Anlauf'), L('at the highest point', 'im höchsten Punkt')],
    states: (p) => [{ kin: sq(p.v) / 2 }, { pot: sq(p.v) / 2 }],
    fields: (p) => [
      field('h', 'h_\\text{max}', 'm', L('highest point of the centre of mass', 'höchster Punkt des Schwerpunkts'), [trap(sq(p.v) / (2 * G), L('This is how much the centre of mass rises: it starts from its height while running.', 'Um so viel steigt der Schwerpunkt: Er startet auf seiner Höhe beim Anlauf.'))]),
      field('vn', 'v', 'v', L('speed needed', 'nötige Geschwindigkeit'), [trap(Math.sqrt(2 * G * p.H), L('The centre of mass rises less than the height of the bar: it starts at its height while running.', 'Der Schwerpunkt steigt weniger hoch als die Latte: Er startet auf seiner Höhe beim Anlauf.'))]),
    ],
    text: (p) => L(`A pole vaulter sprints at ${q(p.v, 'v')}; her centre of mass is ${q(p.h0, 'm')} above the ground. The pole turns her kinetic energy into potential energy (it bends and gives back the energy it stores). How high can her centre of mass rise at most? How fast would she have to run for her centre of mass to rise to ${q(p.H, 'm')}?`,
      `Eine Stabhochspringerin sprintet mit ${q(p.v, 'v')}; ihr Schwerpunkt ist ${q(p.h0, 'm')} über dem Boden. Der Stab wandelt ihre kinetische Energie in Lageenergie um (er biegt sich und gibt die gespeicherte Energie wieder ab). Wie hoch kann ihr Schwerpunkt höchstens steigen? Wie schnell müsste sie laufen, damit ihr Schwerpunkt bis auf ${q(p.H, 'm')} steigt?`),
    hints: () => [
      L('At the top, all the kinetic energy of the run-up has become potential energy (take her to be at rest there).', 'Zuoberst ist die ganze kinetische Energie des Anlaufs zu Lageenergie geworden (nimm an, sie sei dort in Ruhe).'),
      L('The centre of mass rises from its height while running: add that height.', 'Der Schwerpunkt steigt von seiner Höhe beim Anlauf aus: Addiere diese Höhe.'),
    ],
    steps: (p, v) => [
      step(L('How high', 'Wie hoch'), p$(L(`Let $v$ be her speed, $h_0$ the height of her centre of mass while running and $\\Delta h$ how much it rises. The kinetic energy at ① becomes potential energy at ②:`, `Sei $v$ ihre Geschwindigkeit, $h_0$ die Höhe ihres Schwerpunkts beim Anlauf und $\\Delta h$, um wie viel er steigt. Die kinetische Energie in ① wird zur Lageenergie in ②:`)) +
        `$$\\tfrac{1}{2}\\,m\\,v^2 = m\\,g\\,\\Delta h \\;\\Rightarrow\\; h_\\text{max} = h_0 + \\frac{v^2}{2\\,g} = ${tq(p.h0, 'm')} + \\frac{(${tq(p.v, 'v')})^2}{2\\cdot ${gq}} ${res(v.h, 'm')}$$`),
      step(L('The speed needed', 'Die nötige Geschwindigkeit'), p$(L(`Let $H$ be the height the centre of mass should reach. Solved for the speed:`, `Sei $H$ die Höhe, die der Schwerpunkt erreichen soll. Nach der Geschwindigkeit aufgelöst:`)) +
        `$$v = \\sqrt{2\\,g\\,(H - h_0)} = \\sqrt{2\\cdot ${gq}\\cdot ${tq(p.H - p.h0, 'm')}} ${res(v.vn, 'v')}$$` +
        p$(L('Top vaulters do sprint at about 10 m/s. They also push with their arms, and their centre of mass passes just under the bar.', 'Spitzenathletinnen sprinten tatsächlich mit etwa 10 m/s. Sie stossen sich zudem mit den Armen ab, und ihr Schwerpunkt passiert knapp unter der Latte.'))),
    ],
    pic() {
      const a = A(), y = 196;
      return a.svg(420, 230, a.bg(0, 0, 420, 230) + a.ground(0, 420, y, 'concrete', 34) + a.rect(300, y - 22, 410, y, 'rp-mat', 4) +
        a.line([318, y - 22], [318, 40], 'rp-post') + a.line([392, y - 22], [392, 40], 'rp-post') + a.line([314, 46], [396, 46], 'rp-bar') +
        a.person(110, y, 1.3, { lean: 10, knee: 10, shirt: 'blue', hands: [[100, y - 64], [122, y - 70]] }) + a.line([60, y - 50], [260, y - 96], 'rp-vaultpole') +
        a.path(`M40 ${y - 50}h30M30 ${y - 34}h36M42 ${y - 18}h22`, 'rp-speed') + a.path(`M262 ${y}l-12 -8h24z`, 'rp-dark'),
      L('A pole vaulter running towards the bar', 'Eine Stabhochspringerin beim Anlauf zur Latte'));
    },
  };

  // ---------------------------------------------------------------- 5 a cyclist rolling over two hills
  const cyclist = {
    id: 'cyclist', difficulty: 3, title: () => L('Rolling through a valley', 'Durch ein Tal rollen'),
    make: (r) => ({ v0: pick(r, [4, 5, 6, 8]), h1: pick(r, [10, 15, 20, 25]) }),
    solve: (p) => ({ v1: Math.sqrt(sq(p.v0) + 2 * G * p.h1), h2: p.h1 + sq(p.v0) / (2 * G) }),
    zero: () => L('the bottom of the valley', 'der tiefste Punkt des Tals'),
    names: () => [L('on the hill', 'auf der Kuppe'), L('in the valley', 'im Tal'), L('where she stops', 'wo sie anhält')],
    states: (p) => [{ pot: G * p.h1, kin: sq(p.v0) / 2 }, { kin: G * p.h1 + sq(p.v0) / 2 }, { pot: G * p.h1 + sq(p.v0) / 2 }],
    fields: (p) => [
      field('v1', 'v_1', 'v', L('speed in the valley', 'Geschwindigkeit im Tal'), [trap(p.v0 + Math.sqrt(2 * G * p.h1), L('Speeds do not add up, energies do: add ½ m v₀² and m g h₁, then find the speed.', 'Geschwindigkeiten addieren sich nicht, Energien schon: Addiere ½ m v₀² und m g h₁ und bestimme dann die Geschwindigkeit.')), trap(Math.sqrt(2 * G * p.h1), L('She is already moving at the top: her kinetic energy there counts too.', 'Sie fährt oben schon: Ihre kinetische Energie dort zählt auch.'))]),
      field('h2', 'h_2', 'm', L('height on the other side', 'Höhe auf der anderen Seite'), [trap(p.h1, L('She has more energy than just m g h₁: her kinetic energy at the start takes her higher.', 'Sie hat mehr Energie als nur m g h₁: Ihre kinetische Energie am Anfang bringt sie höher hinauf.'))]),
    ],
    text: (p) => L(`A cyclist rides over the top of a hill at ${q(p.v0, 'v')} and stops pedalling. She rolls down into a valley ${q(p.h1, 'm')} below and up the hill on the other side. How fast is she at the bottom of the valley? How high above the valley does she get on the other side before she stops?`,
      `Eine Velofahrerin fährt mit ${q(p.v0, 'v')} über eine Kuppe und hört auf zu treten. Sie rollt in ein Tal ${q(p.h1, 'm')} weiter unten und auf der anderen Seite den Hang hinauf. Wie schnell ist sie zuunterst im Tal? Wie hoch über dem Tal kommt sie auf der anderen Seite, bevor sie anhält?`),
    hints: () => [
      L('At the top, she has both potential and kinetic energy. Both count.', 'Auf der Kuppe hat sie Lageenergie und kinetische Energie. Beide zählen.'),
      L('On the other side, she stops: all her energy is then potential energy.', 'Auf der anderen Seite hält sie an: Ihre ganze Energie ist dann Lageenergie.'),
    ],
    steps: (p, v) => [
      step(L('In the valley', 'Im Tal'), p$(L(`Let $v_0$ be her speed on the hill, $h_1$ its height above the valley and $v_1$ her speed in the valley. Between ① and ②:`, `Sei $v_0$ ihre Geschwindigkeit auf der Kuppe, $h_1$ deren Höhe über dem Tal und $v_1$ ihre Geschwindigkeit im Tal. Zwischen ① und ②:`)) +
        `$$m\\,g\\,h_1 + \\tfrac{1}{2}\\,m\\,v_0^2 = \\tfrac{1}{2}\\,m\\,v_1^2 \\;\\Rightarrow\\; v_1 = \\sqrt{v_0^2 + 2\\,g\\,h_1} = \\sqrt{(${tq(p.v0, 'v')})^2 + 2\\cdot ${gq}\\cdot ${tq(p.h1, 'm')}} ${res(v.v1, 'v')}$$`),
      step(L('On the other side', 'Auf der anderen Seite'), p$(L(`Let $h_2$ be the height where she stops. Between ① and ③, all the energy becomes potential energy:`, `Sei $h_2$ die Höhe, wo sie anhält. Zwischen ① und ③ wird die ganze Energie zu Lageenergie:`)) +
        `$$m\\,g\\,h_1 + \\tfrac{1}{2}\\,m\\,v_0^2 = m\\,g\\,h_2 \\;\\Rightarrow\\; h_2 = h_1 + \\frac{v_0^2}{2\\,g} = ${tq(p.h1, 'm')} + \\frac{(${tq(p.v0, 'v')})^2}{2\\cdot ${gq}} ${res(v.h2, 'm')}$$` +
        p$(L('Higher than where she started: her kinetic energy at the start carries her further up.', 'Höher als dort, wo sie gestartet ist: Ihre kinetische Energie am Anfang trägt sie weiter hinauf.'))),
    ],
    pic(p) {
      const a = A(), y = 196, k = 110 / (p.h1 + sq(p.v0) / (2 * G)), top1 = y - p.h1 * k;
      const hill = `M0 ${a.f(top1)}Q50 ${a.f(top1 - 6)} 100 ${a.f(top1 + 30)}Q170 ${y + 4} 220 ${y}Q280 ${y - 4} 340 ${a.f(y - 80)}Q380 ${a.f(y - 120)} 420 ${a.f(y - 130)}V230H0Z`;
      return a.svg(420, 230, a.bg(0, 0, 420, 230) + a.path(hill, 'rp-hill') +
        `<g transform="translate(40 ${a.f(top1 - 2)}) rotate(4)">` + a.rim(-14, -9, 9) + a.rim(14, -9, 9) + a.path('M-14 -9L-3 -24L10 -24L14 -9M-3 -24L0 -9L-14 -9M10 -24L12 -30', 'rp-frame') +
        a.person(-2, -12, 0.55, { knee: 6, lean: 14, shirt: 'green', hands: [[9, -30], [11, -30]] }) + '</g>' +
        height(218, y, top1, q(p.h1, 'm'), 1) + lbl(70, top1 - 48, q(p.v0, 'v'), 'lbl small', 'start') + a.line([228, y], [6, y], 'rp-hline-dot'),
      L('A cyclist on a hill above a valley', 'Eine Velofahrerin auf einer Kuppe über einem Tal'));
    },
  };

  // ---------------------------------------------------------------- 6 a ski jump
  const skijump = {
    id: 'skijump', difficulty: 3, title: () => L('Ski jumping', 'Skispringen'),
    make: (r) => ({ h1: pick(r, [32, 36, 40, 45]), h2: pick(r, [30, 40, 50]) }),
    solve: (p) => ({ v1: Math.sqrt(2 * G * p.h1), v2: Math.sqrt(2 * G * (p.h1 + p.h2)) }),
    zero: () => L('the landing point', 'der Landepunkt'),
    names: () => [L('at the start', 'am Start'), L('at the take-off', 'beim Absprung'), L('at the landing', 'bei der Landung')],
    states: (p) => [{ pot: G * (p.h1 + p.h2) }, { pot: G * p.h2, kin: G * p.h1 }, { kin: G * (p.h1 + p.h2) }],
    fields: (p) => [
      field('v1', 'v_1', 'v', L('speed at take-off', 'Geschwindigkeit beim Absprung')),
      field('v2', 'v_2', 'v', L('speed at landing', 'Geschwindigkeit bei der Landung'), [trap(Math.sqrt(2 * G * p.h2), L('She already has kinetic energy at take-off: it counts too.', 'Sie hat beim Absprung schon kinetische Energie: Die zählt auch.')), trap(Math.sqrt(2 * G * p.h1) + Math.sqrt(2 * G * p.h2), L('Speeds do not add up, energies do.', 'Geschwindigkeiten addieren sich nicht, Energien schon.'))]),
    ],
    text: (p) => L(`A ski jumper starts at rest at the top of the in-run, ${q(p.h1, 'm')} higher than the take-off. She lands ${q(p.h2, 'm')} lower than the take-off. How fast is she at the take-off, and how fast when she lands? (In reality, friction and air resistance make her somewhat slower.)`,
      `Eine Skispringerin startet aus der Ruhe zuoberst im Anlauf, ${q(p.h1, 'm')} höher als der Schanzentisch. Sie landet ${q(p.h2, 'm')} tiefer als der Schanzentisch. Wie schnell ist sie beim Absprung, und wie schnell bei der Landung? (In Wirklichkeit machen Reibung und Luftwiderstand sie etwas langsamer.)`),
    hints: () => [
      L('The take-off is just a state in between: only the heights count, not the direction of her flight.', 'Der Absprung ist nur ein Zwischenzustand: Nur die Höhen zählen, nicht die Richtung ihres Flugs.'),
      L('From the start to the landing, she drops by the sum of both heights.', 'Vom Start bis zur Landung sinkt sie um die Summe der beiden Höhen.'),
    ],
    steps: (p, v) => [
      step(L('At the take-off', 'Beim Absprung'), p$(L(`Let $h_1$ be the height of the in-run and $v_1$ the speed at the take-off. Between ① and ②, she drops by $h_1$:`, `Sei $h_1$ die Höhe des Anlaufs und $v_1$ die Geschwindigkeit beim Absprung. Zwischen ① und ② sinkt sie um $h_1$:`)) +
        `$$m\\,g\\,h_1 = \\tfrac{1}{2}\\,m\\,v_1^2 \\;\\Rightarrow\\; v_1 = \\sqrt{2\\,g\\,h_1} = \\sqrt{2\\cdot ${gq}\\cdot ${tq(p.h1, 'm')}} ${res(v.v1, 'v')}$$` +
        p$(L(`That is ${Math.round(3.6 * v.v1)} km/h.`, `Das sind ${Math.round(3.6 * v.v1)} km/h.`))),
      step(L('At the landing', 'Bei der Landung'), p$(L(`Let $h_2$ be the height of the take-off above the landing point and $v_2$ the landing speed. Between ① and ③, she drops by $h_1 + h_2$:`, `Sei $h_2$ die Höhe des Schanzentischs über dem Landepunkt und $v_2$ die Landegeschwindigkeit. Zwischen ① und ③ sinkt sie um $h_1 + h_2$:`)) +
        `$$m\\,g\\,(h_1 + h_2) = \\tfrac{1}{2}\\,m\\,v_2^2 \\;\\Rightarrow\\; v_2 = \\sqrt{2\\,g\\,(h_1 + h_2)} = \\sqrt{2\\cdot ${gq}\\cdot ${tq(p.h1 + p.h2, 'm')}} ${res(v.v2, 'v')}$$`),
    ],
    pic(p) {
      const a = A(), k = 150 / (p.h1 + p.h2), yT = 30 + p.h1 * k, yL = yT + p.h2 * k;
      return a.svg(420, 230, a.bg(0, 0, 420, 230) + a.tree(330, 120, 60) + a.tree(380, 130, 50) +
        a.path(`M0 230V${a.f(yT + 70)}L150 ${a.f(yT + 8)}H176Q240 ${a.f(yT + 70)} 330 ${a.f(yL)}Q370 ${a.f(yL + 18)} 420 ${a.f(yL + 22)}V230Z`, 'rp-slope snow') +
        a.path(`M20 30L150 ${a.f(yT - 4)}Q160 ${a.f(yT)} 176 ${a.f(yT)}L176 ${a.f(yT + 8)}L20 38Z`, 'rp-inrun') +
        a.path(`M176 ${a.f(yT + 8)}Q260 ${a.f(yT + 30)} 330 ${a.f(yL)}`, 'rp-flight') +
        skier(48, a.f(30 + 30 * (yT - 34) / 130), 0.45, a.f((Math.atan2(yT - 34, 130) * 180) / Math.PI)) + skier(250, a.f(yT + 4), 0.5, 10) +
        height(14, yT, 30, q(p.h1, 'm'), 1) + a.line([176, yT], [400, yT], 'rp-hline-dot') + height(404, yL, yT, q(p.h2, 'm')),
      L('A ski jump: in-run, take-off and landing', 'Eine Skisprungschanze: Anlauf, Absprung und Landung'));
    },
  };

  // ---------------------------------------------------------------- 7 a rope swing
  const swing = {
    id: 'swing', difficulty: 3, title: () => L('A rope swing over a lake', 'Eine Seilschaukel über dem See'),
    make: (r) => ({ l: pick(r, [6, 8, 10, 12.5]), d: pick(r, [1.8, 2.5, 3.2]) }),
    solve: (p) => ({ v1: Math.sqrt(G * p.l), v2: Math.sqrt(G * p.l + 2 * G * p.d) }),
    zero: () => L('the surface of the lake', 'die Wasseroberfläche'),
    names: () => [L('at the start', 'am Start'), L('at the lowest point', 'im tiefsten Punkt'), L('entering the water', 'beim Eintauchen')],
    states: (p) => [{ pot: G * (p.l / 2 + p.d) }, { pot: G * p.d, kin: G * p.l / 2 }, { kin: G * (p.l / 2 + p.d) }],
    fields: (p) => [
      field('v1', 'v_1', 'v', L('speed at the lowest point', 'Geschwindigkeit im tiefsten Punkt'), [trap(Math.sqrt(2 * G * p.l), L('She does not drop by the length of the rope: find the height from the angle.', 'Sie sinkt nicht um die Seillänge: Bestimme die Höhe aus dem Winkel.'))]),
      field('v2', 'v_2', 'v', L('speed entering the water', 'Geschwindigkeit beim Eintauchen'), [trap(Math.sqrt(G * p.l) + Math.sqrt(2 * G * p.d), L('Speeds do not add up, energies do.', 'Geschwindigkeiten addieren sich nicht, Energien schon.'))]),
    ],
    text: (p) => L(`A girl holds on to a ${q(p.l, 'm')} long rope tied to a branch. She starts at rest with the rope taut at 60° to the vertical and swings down. At the lowest point, ${q(p.d, 'm')} above the lake, she lets go and falls into the water. How fast is she at the lowest point, and how fast when she enters the water? (Take her as a point at the end of the rope.)`,
      `Ein Mädchen hält sich an einem ${q(p.l, 'm')} langen Seil fest, das an einem Ast hängt. Sie startet aus der Ruhe mit gespanntem Seil, 60° gegen die Senkrechte, und schwingt hinunter. Im tiefsten Punkt, ${q(p.d, 'm')} über dem See, lässt sie los und fällt ins Wasser. Wie schnell ist sie im tiefsten Punkt, und wie schnell beim Eintauchen? (Betrachte sie als Punkt am Ende des Seils.)`),
    hints: () => [
      L('At 60° to the vertical, the end of the rope is ℓ cos 60° = ℓ/2 below the branch: she is ℓ/2 higher than at the lowest point.', 'Bei 60° gegen die Senkrechte ist das Seilende ℓ cos 60° = ℓ/2 unter dem Ast: Sie ist ℓ/2 höher als im tiefsten Punkt.'),
      L('Letting go does not change her energy: from the start to the water she drops by ℓ/2 plus the height above the lake.', 'Das Loslassen ändert ihre Energie nicht: Vom Start bis ins Wasser sinkt sie um ℓ/2 plus die Höhe über dem See.'),
    ],
    steps: (p, v) => [
      step(L('The height of the start', 'Die Höhe des Starts'), p$(L(`Let $\\ell$ be the length of the rope. At 60° the end of the rope is $\\ell\\cos 60° = \\ell/2$ below the branch, at the lowest point $\\ell$ below. So she drops by $\\ell - \\ell/2 = \\ell/2$.`, `Sei $\\ell$ die Seillänge. Bei 60° ist das Seilende $\\ell\\cos 60° = \\ell/2$ unter dem Ast, im tiefsten Punkt $\\ell$ darunter. Sie sinkt also um $\\ell - \\ell/2 = \\ell/2$.`))),
      step(L('At the lowest point', 'Im tiefsten Punkt'), p$(L('Between ① and ②, she drops by $\\ell/2$:', 'Zwischen ① und ② sinkt sie um $\\ell/2$:')) +
        `$$m\\,g\\,\\frac{\\ell}{2} = \\tfrac{1}{2}\\,m\\,v_1^2 \\;\\Rightarrow\\; v_1 = \\sqrt{g\\,\\ell} = \\sqrt{${gq}\\cdot ${tq(p.l, 'm')}} ${res(v.v1, 'v')}$$`),
      step(L('In the water', 'Im Wasser'), p$(L('Let $d$ be the height of the lowest point above the lake. Between ① and ③, she drops by $\\ell/2 + d$:', 'Sei $d$ die Höhe des tiefsten Punkts über dem See. Zwischen ① und ③ sinkt sie um $\\ell/2 + d$:')) +
        `$$m\\,g\\left(\\frac{\\ell}{2} + d\\right) = \\tfrac{1}{2}\\,m\\,v_2^2 \\;\\Rightarrow\\; v_2 = \\sqrt{g\\,\\ell + 2\\,g\\,d} = \\sqrt{${gq}\\cdot ${tq(p.l, 'm')} + 2\\cdot ${gq}\\cdot ${tq(p.d, 'm')}} ${res(v.v2, 'v')}$$`),
    ],
    pic(p) {
      const a = A(), P = [250, 30], R = 130, low = [P[0], P[1] + R], th = (60 * Math.PI) / 180, start = [P[0] - R * Math.sin(th), P[1] + R * Math.cos(th)], yw = low[1] + 30;
      return a.svg(420, 230, a.bg(0, 0, 420, 230) + a.rect(0, yw, 420, 230, 'rp-water', 0) + a.path(`M0 ${yw - 2}H420`, 'rp-waterline') +
        a.path(`M0 ${a.f(start[1] + 24)}Q60 ${a.f(start[1] + 20)} 110 ${a.f(start[1] + 30)}L130 ${yw}H0Z`, 'rp-hill') +
        a.path(`M420 18L${P[0] - 30} 26L${P[0] - 34} 32L420 30Z`, 'rp-branch') + a.rect(400, 0, 420, 230, 'rp-trunkwide', 0) +
        a.path(`M${P[0]} ${P[1]}L${a.f(start[0])} ${a.f(start[1])}`, 'rp-rope') + a.path(`M${P[0]} ${P[1]}V${low[1]}`, 'rp-rope ghost') +
        a.path(`M${a.f(start[0])} ${a.f(start[1])}A${R} ${R} 0 0 0 ${low[0]} ${low[1]}`, 'rp-hline-dot') +
        a.person(start[0], start[1] + 50, 0.66, { shirt: 'orange', hands: [[start[0] - 1, start[1] + 2], [start[0] + 3, start[1] + 4]] }) +
        a.circle(low[0], low[1], 4, 'rp-com') + lbl(low[0] + 30, low[1] + 4, L('lets go', 'lässt los')) +
        a.path(`M${P[0] - 2} ${P[1] + 40}A40 40 0 0 1 ${a.f(P[0] - 40 * Math.sin(th))} ${a.f(P[1] + 40 * Math.cos(th))}`, 'rp-hline') + lbl(P[0] - 22, P[1] + 56, '60°') +
        height(low[0] + 60, yw, low[1], q(p.d, 'm'), 1),
      L('A girl on a rope swing above a lake', 'Ein Mädchen an einer Seilschaukel über einem See'));
    },
  };

  // ---------------------------------------------------------------- 8 a slingshot
  const sling = {
    id: 'sling', difficulty: 3, spring: true, title: () => L('A slingshot', 'Eine Steinschleuder'),
    make: (r) => ({ k: pick(r, [200, 250, 400, 500]), s: pick(r, [0.15, 0.2, 0.25, 0.3]), m: pick(r, [0.02, 0.025, 0.05]) }),
    solve: (p) => ({ v: p.s * Math.sqrt(p.k / p.m), h: (p.k * sq(p.s)) / (2 * p.m * G) }),
    zero: () => L('the point where the stone leaves the rubber band', 'der Punkt, wo der Stein das Gummiband verlässt'),
    names: () => [L('the band pulled back', 'das Band gespannt'), L('the stone leaving the band', 'der Stein verlässt das Band'), L('at the highest point', 'im höchsten Punkt')],
    states: (p) => { const e = (p.k * sq(p.s)) / 2; return [{ el: e }, { kin: e }, { pot: e }]; },
    fields: (p) => [
      field('v', 'v', 'v', L('speed of the stone', 'Geschwindigkeit des Steins'), [trap(p.s * Math.sqrt(p.k / (2 * p.m)), L('Check the factor ½: it is in both ½ k s² and ½ m v², so it cancels.', 'Prüfe den Faktor ½: Er steht in ½ k s² und in ½ m v², kürzt sich also weg.')), trap(sq(p.s) * p.k / p.m, L('The energy equation gives v²: take the square root.', 'Die Energiegleichung liefert v²: Zieh noch die Wurzel.'))]),
      field('h', 'h', 'm', L('maximum height', 'maximale Höhe'), [trap((p.k * p.s) / (2 * p.m * G), L('The elastic energy grows with the square of the stretch: ½ k s².', 'Die Spannenergie wächst mit dem Quadrat der Dehnung: ½ k s².'))]),
    ],
    text: (p) => L(`The rubber band of a slingshot acts like a spring with a spring constant of ${q(p.k, 'k')}. It is pulled back by ${q(p.s, 'm')} and shoots a stone of ${q(p.m * 1000, 'g')} straight up. How fast does the stone leave the slingshot, and how high above that point does it rise? (Neglect the small change in height while the band contracts.)`,
      `Das Gummiband einer Steinschleuder wirkt wie eine Feder mit der Federkonstante ${q(p.k, 'k')}. Es wird um ${q(p.s, 'm')} zurückgezogen und schiesst einen Stein von ${q(p.m * 1000, 'g')} senkrecht nach oben. Wie schnell verlässt der Stein die Schleuder, und wie hoch über diesem Punkt steigt er? (Vernachlässige die kleine Höhenänderung, während sich das Band zusammenzieht.)`),
    hints: () => [
      L('The elastic energy of the band, ½ k s², becomes the kinetic energy of the stone, and then its potential energy.', 'Die Spannenergie des Bands, ½ k s², wird zur kinetischen Energie des Steins und dann zu seiner Lageenergie.'),
      L('Mass in kilograms!', 'Masse in Kilogramm!'),
    ],
    steps: (p, v) => [
      step(L('The speed', 'Die Geschwindigkeit'), p$(L(`Let $k$ be the spring constant, $s$ the stretch and $m$ the mass of the stone. The elastic energy at ① becomes kinetic energy at ②:`, `Sei $k$ die Federkonstante, $s$ die Dehnung und $m$ die Masse des Steins. Die Spannenergie in ① wird zur kinetischen Energie in ②:`)) +
        `$$\\tfrac{1}{2}\\,k\\,s^2 = \\tfrac{1}{2}\\,m\\,v^2 \\;\\Rightarrow\\; v = s\\,\\sqrt{\\frac{k}{m}} = ${tq(p.s, 'm')}\\cdot\\sqrt{\\frac{${tq(p.k, 'k')}}{${tq(p.m, 'kg')}}} ${res(v.v, 'v')}$$`),
      step(L('The height', 'Die Höhe'), p$(L('At the top, at ③, all of it has become potential energy:', 'Zuoberst, in ③, ist alles zu Lageenergie geworden:')) +
        `$$\\tfrac{1}{2}\\,k\\,s^2 = m\\,g\\,h \\;\\Rightarrow\\; h = \\frac{k\\,s^2}{2\\,m\\,g} = \\frac{${tq(p.k, 'k')}\\cdot (${tq(p.s, 'm')})^2}{2\\cdot ${tq(p.m, 'kg')}\\cdot ${gq}} ${res(v.h, 'm')}$$`),
    ],
    pic(p) {
      const a = A(), x = 200, y = 150;
      return a.svg(420, 230, a.bg(0, 0, 420, 230) + a.tree(60, 200, 80) + a.tree(360, 200, 66) + a.ground(0, 420, 200, 'grass', 30) +
        a.path(`M${x - 6} 230V${y}L${x - 40} ${y - 70}M${x + 6} 230V${y}L${x + 40} ${y - 70}M${x - 6} ${y}H${x + 6}`, 'rp-slingframe') +
        a.path(`M${x - 40} ${y - 68}L${x - 4} ${y - 14}M${x + 40} ${y - 68}L${x + 4} ${y - 14}`, 'rp-band-rubber') +
        a.rect(x - 9, y - 18, x + 9, y - 8, 'rp-dark', 2) + a.circle(x, y - 24, 8, 'rp-stone') +
        a.path(`M${x} ${y - 40}V24M${x - 5} 32L${x} 22L${x + 5} 32`, 'rp-hline') + lbl(x + 10, 50, L('straight up', 'senkrecht nach oben'), 'lbl small', 'start') +
        a.person(x + 70, 200, 1.1, { shirt: 'blue', hands: [[x + 46, y + 2], [x + 8, y - 12]] }),
      L('A slingshot pulled back, aimed straight up', 'Eine gespannte Steinschleuder, senkrecht nach oben gerichtet'));
    },
  };

  // ---------------------------------------------------------------- 9 a pinball machine
  const pinball = {
    id: 'pinball', difficulty: 3, spring: true, title: () => L('A pinball machine', 'Ein Flipperkasten'),
    make: (r) => {
      for (;;) {
        const p = { k: pick(r, [150, 200, 250]), s: pick(r, [0.04, 0.05, 0.06]), m: pick(r, [0.08, 0.1]), h: pick(r, [0.08, 0.1, 0.12]) };
        if ((p.k * sq(p.s)) / 2 > 1.5 * p.m * G * p.h) return p;
      }
    },
    solve: (p) => ({ v1: p.s * Math.sqrt(p.k / p.m), v2: Math.sqrt((p.k * sq(p.s)) / p.m - 2 * G * p.h) }),
    zero: () => L('the plunger', 'der Abschussbolzen'),
    names: () => [L('the spring pulled back', 'die Feder gespannt'), L('the ball leaving the spring', 'die Kugel verlässt die Feder'), L('at the top of the table', 'zuoberst auf dem Tisch')],
    states: (p) => { const e = (p.k * sq(p.s)) / 2; return [{ el: e }, { kin: e }, { pot: p.m * G * p.h, kin: e - p.m * G * p.h }]; },
    fields: (p) => [
      field('v1', 'v_1', 'v', L('speed when the ball leaves the spring', 'Geschwindigkeit, wenn die Kugel die Feder verlässt')),
      field('v2', 'v_2', 'v', L('speed at the top of the table', 'Geschwindigkeit zuoberst auf dem Tisch'), [trap(p.s * Math.sqrt(p.k / p.m) - Math.sqrt(2 * G * p.h), L('Speeds cannot be subtracted, energies can: subtract m g h from ½ k s².', 'Geschwindigkeiten kann man nicht subtrahieren, Energien schon: Ziehe m g h von ½ k s² ab.'))]),
    ],
    text: (p) => L(`In a pinball machine, the spring of the plunger (spring constant ${q(p.k, 'k')}) is pulled back by ${q(p.s * 100, 'cm')} and released. It shoots the ball (mass ${q(p.m * 1000, 'g')}) up the sloping table; at the top, the ball is ${q(p.h * 100, 'cm')} higher than at the plunger. How fast does the ball leave the spring, and how fast is it at the top? (Neglect its rolling and the height change while it is pushed.)`,
      `In einem Flipperkasten wird die Feder des Abschussbolzens (Federkonstante ${q(p.k, 'k')}) um ${q(p.s * 100, 'cm')} zurückgezogen und losgelassen. Sie schiesst die Kugel (Masse ${q(p.m * 1000, 'g')}) den schrägen Tisch hinauf; zuoberst ist die Kugel ${q(p.h * 100, 'cm')} höher als beim Bolzen. Wie schnell verlässt die Kugel die Feder, und wie schnell ist sie zuoberst? (Vernachlässige ihr Rollen und die Höhenänderung beim Abschuss.)`),
    hints: () => [
      L('Units first: centimetres into metres, grams into kilograms.', 'Zuerst die Einheiten: Zentimeter in Meter, Gramm in Kilogramm.'),
      L('At the top, part of the elastic energy has become potential energy; the rest is still kinetic energy.', 'Zuoberst ist ein Teil der Spannenergie zu Lageenergie geworden; der Rest ist noch kinetische Energie.'),
    ],
    steps: (p, v) => [
      step(L('Leaving the spring', 'Beim Verlassen der Feder'), p$(L(`Let $k$ be the spring constant, $s$ how far it is pulled back and $m$ the mass of the ball. The elastic energy at ① becomes kinetic energy at ②:`, `Sei $k$ die Federkonstante, $s$, wie weit sie zurückgezogen wird, und $m$ die Masse der Kugel. Die Spannenergie in ① wird zur kinetischen Energie in ②:`)) +
        `$$\\tfrac{1}{2}\\,k\\,s^2 = \\tfrac{1}{2}\\,m\\,v_1^2 \\;\\Rightarrow\\; v_1 = s\\,\\sqrt{\\frac{k}{m}} = ${tq(p.s, 'm')}\\cdot\\sqrt{\\frac{${tq(p.k, 'k')}}{${tq(p.m, 'kg')}}} ${res(v.v1, 'v')}$$`),
      step(L('At the top', 'Zuoberst'), p$(L('Let $h$ be the height of the top above the plunger. Between ① and ③:', 'Sei $h$ die Höhe des oberen Endes über dem Bolzen. Zwischen ① und ③:')) +
        `$$\\tfrac{1}{2}\\,k\\,s^2 = m\\,g\\,h + \\tfrac{1}{2}\\,m\\,v_2^2 \\;\\Rightarrow\\; v_2 = \\sqrt{\\frac{k\\,s^2}{m} - 2\\,g\\,h} = \\sqrt{\\frac{${tq(p.k, 'k')}\\cdot (${tq(p.s, 'm')})^2}{${tq(p.m, 'kg')}} - 2\\cdot ${gq}\\cdot ${tq(p.h, 'm')}} ${res(v.v2, 'v')}$$`),
    ],
    pic() {
      const a = A(), x0 = 40, y0 = 196, x1 = 380, y1 = 96;
      const at = (t, d = 0) => [x0 + t * (x1 - x0) - d * 0.28, y0 + t * (y1 - y0) - d * 0.96];
      const box = (t0, t1, d0, d1) => [at(t0, d0), at(t1, d0), at(t1, d1), at(t0, d1)].map((pt) => pt.map(a.f).join(' ')).join('L');
      return a.svg(420, 230, a.bg(0, 0, 420, 230, 'metal') + a.path(`M${box(0, 1, 0, 26)}Z`, 'rp-pintable') +
        a.path(`M${at(0.02, 13).map(a.f).join(' ')}L${at(0.12, 13).map(a.f).join(' ')}`, 'rp-plunger') + zigzag(at(0.12, 13), at(0.24, 13), 6, 5) +
        a.circle(...at(0.27, 13), 7, 'rp-ball') + a.circle(...at(0.6, 13), 9, 'rp-bumper') + a.circle(...at(0.8, 13), 9, 'rp-bumper') +
        a.line([x0, y0 + 18], [x1, y0 + 18], 'rp-hline-dot') + a.line([x1, y1 + 4], [x1, y0 + 18], 'rp-hline') + lbl(x1 + 6, (y0 + y1) / 2 + 26, 'h', 'lbl small', 'start') +
        a.path(`M${x0 - 10} ${y0 + 6}L${x0 + 30} 228H${x0 - 10}Z`, 'rp-dark') + a.path(`M${x1 - 30} ${y1 + 30}L${x1 + 4} 228H${x1 - 40}Z`, 'rp-dark'),
      L('A sloping pinball table with the plunger and its spring', 'Ein schräger Flippertisch mit dem Abschussbolzen und seiner Feder'));
    },
  };

  // ---------------------------------------------------------------- 10 a trampoline
  const trampoline = {
    id: 'trampoline', difficulty: 4, spring: true, title: () => L('A trampoline', 'Ein Trampolin'),
    make: (r) => ({ m: pick(r, [30, 40, 50]), h: pick(r, [1.25, 1.8, 2.45]), k: pick(r, [4000, 5000, 6000]) }),
    solve: (p) => { const W = p.m * G; return { v: Math.sqrt(2 * G * p.h), s: (W + Math.sqrt(sq(W) + 2 * p.k * W * p.h)) / p.k }; },
    zero: () => L('the lowest point', 'der tiefste Punkt'),
    names: () => [L('at her highest point', 'im höchsten Punkt'), L('reaching the mat', 'beim Auftreffen auf die Matte'), L('at the lowest point', 'im tiefsten Punkt')],
    states: (p, v) => [{ pot: p.m * G * (p.h + v.s) }, { pot: p.m * G * v.s, kin: p.m * G * p.h }, { el: (p.k * sq(v.s)) / 2 }],
    fields: (p) => [
      field('v', 'v', 'v', L('speed on reaching the mat', 'Geschwindigkeit beim Auftreffen')),
      field('s', 's', 'm', L('how deep the mat is pressed down', 'wie tief die Matte eingedrückt wird'), [trap(Math.sqrt((2 * p.m * G * p.h) / p.k), L('While the mat is pressed down, she drops by s more: m g (h + s) = ½ k s².', 'Während die Matte eingedrückt wird, sinkt sie um s weiter: m g (h + s) = ½ k s².')), trap((p.m * G) / p.k, L('That is where she would be at rest on the mat. At the lowest point the mat pushes harder than her weight: use energy conservation.', 'Dort wäre sie auf der Matte in Ruhe. Im tiefsten Punkt drückt die Matte stärker als ihr Gewicht: Verwende die Energieerhaltung.'))]),
    ],
    text: (p) => L(`A girl (${q(p.m, 'kg')}) jumps on a trampoline. From her highest point, she falls ${q(p.h, 'm')} down to the mat. The mat acts like a spring with a spring constant of ${q(p.k, 'k')}. How fast is she when she reaches the mat? How deep does she press the mat down?`,
      `Ein Mädchen (${q(p.m, 'kg')}) springt auf einem Trampolin. Von ihrem höchsten Punkt fällt sie ${q(p.h, 'm')} bis zur Matte. Die Matte wirkt wie eine Feder mit der Federkonstante ${q(p.k, 'k')}. Wie schnell ist sie, wenn sie die Matte erreicht? Wie tief drückt sie die Matte ein?`),
    hints: () => [
      L('Take the lowest point as the zero level: from the top, she falls h + s, and there all the energy is elastic energy.', 'Nimm den tiefsten Punkt als Nullniveau: Von oben fällt sie h + s, und dort ist die ganze Energie Spannenergie.'),
      L('m g (h + s) = ½ k s² is a quadratic equation in s: take the positive solution.', 'm g (h + s) = ½ k s² ist eine quadratische Gleichung in s: Nimm die positive Lösung.'),
    ],
    steps: (p, v) => {
      const W = p.m * G;
      return [
        step(L('Reaching the mat', 'Beim Auftreffen'), p$(L(`Let $h$ be the height of the fall to the mat and $v$ her speed there. Between ① and ②, she falls by $h$:`, `Sei $h$ die Fallhöhe bis zur Matte und $v$ ihre Geschwindigkeit dort. Zwischen ① und ② fällt sie um $h$:`)) +
          `$$v = \\sqrt{2\\,g\\,h} = \\sqrt{2\\cdot ${gq}\\cdot ${tq(p.h, 'm')}} ${res(v.v, 'v')}$$`),
        step(L('The lowest point', 'Der tiefste Punkt'), p$(L(`Let $s$ be how deep the mat is pressed down and $k$ its spring constant. From ① to ③, she falls by $h + s$, and all the energy becomes elastic energy of the mat:`, `Sei $s$, wie tief die Matte eingedrückt wird, und $k$ ihre Federkonstante. Von ① bis ③ fällt sie um $h + s$, und die ganze Energie wird zur Spannenergie der Matte:`)) +
          `$$m\\,g\\,(h + s) = \\tfrac{1}{2}\\,k\\,s^2 \\;\\Rightarrow\\; \\tfrac{1}{2}\\,k\\,s^2 - m\\,g\\,s - m\\,g\\,h = 0$$` +
          p$(L('The positive solution of this quadratic equation:', 'Die positive Lösung dieser quadratischen Gleichung:')) +
          `$$s = \\frac{m\\,g + \\sqrt{(m\\,g)^2 + 2\\,k\\,m\\,g\\,h}}{k} = \\frac{${num(W)}\\,\\mathrm{N} + \\sqrt{(${num(W)}\\,\\mathrm{N})^2 + 2\\cdot ${tq(p.k, 'k')}\\cdot ${num(W)}\\,\\mathrm{N}\\cdot ${tq(p.h, 'm')}}}{${tq(p.k, 'k')}} ${res(v.s, 'm')}$$`),
      ];
    },
    pic(p) {
      const a = A(), y = 150, x0 = 90, x1 = 330;
      return a.svg(420, 230, a.bg(0, 0, 420, 230) + a.tree(40, 196, 70) + a.tree(390, 196, 60) + a.ground(0, 420, 196, 'grass', 34) +
        a.line([x0 + 10, y], [x0 - 4, 196], 'rp-tlegs') + a.line([x1 - 10, y], [x1 + 4, 196], 'rp-tlegs') + a.line([x0 + 40, y], [x0 + 46, 196], 'rp-tlegs') + a.line([x1 - 40, y], [x1 - 46, 196], 'rp-tlegs') +
        a.path(`M${x0 + 10} ${y}Q210 ${y + 22} ${x1 - 10} ${y}`, 'rp-tmat') + a.rect(x0, y - 5, x0 + 20, y + 5, 'rp-tframe', 3) + a.rect(x1 - 20, y - 5, x1, y + 5, 'rp-tframe', 3) +
        a.person(210, 96, 1.05, { shirt: 'orange', hands: [[190, 44], [230, 44]] }) + height(282, y + 8, 96, q(p.h, 'm'), 1),
      L('A girl jumping on a trampoline', 'Ein Mädchen springt auf einem Trampolin'));
    },
  };

  const PROBLEMS = [crash, fountain, coaster, vault, cyclist, skijump, swing, sling, pinball, trampoline];

  // ---------------------------------------------------------------- exercises
  // The energy bars of the states, as in the solutions of practice (draw.js).
  function bars(states, forms, label) {
    const fg = new root.Draw.Fig(label);
    fg.see(0, 0); fg.see(Math.max(300, 150 * states.length), 0);
    fg.bars(states, forms);
    return fg.render();
  }

  function realOf(i, seed) {
    const pb = PROBLEMS[i], p = pb.make(rng(seed)), v = pb.solve(p), states = pb.states(p, v);
    const forms = pb.spring ? ['pot', 'kin', 'el'] : ['pot', 'kin'];
    // traps that give nearly the right value cannot be told apart from it
    const fields = pb.fields(p).map((f) => ({ ...f, value: v[f.key], traps: f.traps.filter((t) => Number.isFinite(t.value) && Math.abs(t.value - v[f.key]) > 0.05 * v[f.key]) }));
    const zero = pb.zero();
    const note = L('Neglect friction and air resistance. Take g = 10 m/s².', 'Vernachlässige Reibung und Luftwiderstand. Rechne mit g = 10 m/s².');
    const first = step(L('Energy in each state', 'Energie in jedem Zustand'), p$(`${L('Zero level of the potential energy', 'Nullniveau der Lageenergie')}: ${zero}.`) +
      p$(states.map((s, k) => `${CIRCLED[k]} ${forms.filter((f) => (s[f] || 0) > 1e-9).map((f) => `$${E(f)}$`).join(' + ')}`).join(', ')));
    return {
      scenario: 'real', difficulty: pb.difficulty, formal: false,
      title: pb.title(), text: `<p>${pb.text(p)}</p><p class="note">${L('States', 'Zustände')}: ${pb.names().map((n, k) => `${CIRCLED[k]} ${n}`).join(', ')}. ${note}</p>`,
      zero, forms, table: states.map((s) => forms.map((k) => (s[k] || 0) > 1e-9)),
      fields, traps: [],
      figure: () => (root.Art ? pb.pic(p) : ''),
      solutionFigure: () => bars(states, forms, pb.title()),
      hints: [
        `${L('Choose the zero level', 'Wähle das Nullniveau')} (${L('here', 'hier')}: ${zero}). ${L('Which forms of energy does each state have?', 'Welche Energieformen hat jeder Zustand?')} $${E('pot')} = m\\,g\\,h$, $${E('kin')} = \\tfrac{1}{2}\\,m\\,v^2$${pb.spring ? `, $${E('el')} = \\tfrac{1}{2}\\,k\\,s^2$` : ''}.`,
        ...pb.hints(p),
      ],
      solution: [first, ...pb.steps(p, v)],
      results: fields.map((f) => `$${f.sym} = ${sig(f.value)}\\,${TU[f.unit]}$`).join(', '),
      p, v,
    };
  }

  root.EnergyProblems = { PROBLEMS, realOf };
  if (typeof module !== 'undefined') module.exports = root.EnergyProblems;
})(typeof window !== 'undefined' ? window : globalThis);
