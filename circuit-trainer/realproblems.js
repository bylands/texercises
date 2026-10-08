// Problems: resistor circuits in everyday life and technology, told as stories, solved with the
// ideas of this app (series and parallel circuits, V = R I). Each has random values that keep the
// numbers simple, a picture of the situation (artkit.js) and a circuit diagram for the solution
// (circuit.js):
//   { id, difficulty, title(), make(r), solve(p), fields(p), text(p), hints(p), steps(p, v), circuit(p, v) } (the picture of the task: figures.js)
// realOf(i, seed) gives an exercise as the practice ones (generator.js).
(function (root) {
  'use strict';

  const Lang = root.Lang || (typeof require === 'function' ? require('./lang.js') : null);
  const L = (en, de) => (Lang ? Lang.L(en, de) : en);
  const Vs = () => L('V', 'U'); // the symbol of a voltage

  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const pick = (r, list) => list[Math.floor(r() * list.length)];

  // numbers: givens as they are, results to three significant figures
  const num = (x) => String(Number(Number(x).toFixed(3)) + 0);
  const sig = (x) => String(Number(Number(x).toPrecision(3)) + 0);
  const exact = (x) => Math.abs(Number(sig(x)) - x) < 1e-9 * Math.max(1, Math.abs(x));
  const TU = { mV: '\\mathrm{mV}', V: '\\mathrm{V}', A: '\\mathrm{A}', mA: '\\mathrm{mA}', 'Ω': '\\Omega', 'kΩ': '\\mathrm{k\\Omega}' };
  const q = (x, u) => `${num(x)}\u00a0${u}`; // in the text
  const tq = (x, u) => `${num(x)}\\,${TU[u]}`; // in formulas
  const eq = (x) => (exact(x) ? '=' : '\\approx');
  const res = (x, u) => `${eq(x)} \\htmlClass{result}{${sig(x)}\\,${TU[u]}}`;
  const m$ = (s) => `$${s}$`;
  const step = (rule, html) => `<b>${rule}.</b> ${html}`;
  const field = (key, sym, unit) => ({ key, sym, unit });

  // ---------------------------------------------------------------- circuit diagrams
  const C = () => root.Circuit;
  const val = (sym, x, u) => `$${sym}$ = ${sig(x)} ${u}`; // a label in a diagram (circuit.js markup)
  // an LED from p to q (left to right), drawn like a diode
  function led(s, p, q, label) {
    const g = s._two(p, q, 0.44), [x, y] = s.P(g.m);
    s.P([g.m[0] - 0.3, g.m[1] - 0.3]); s.P([g.m[0] + 0.3, g.m[1] + 0.5]);
    s.els.push(`<path class="c" d="M${x - 10} ${y - 10}L${x + 10} ${y}L${x - 10} ${y + 10}Z"/><path class="w" d="M${x + 10} ${y - 10}V${y + 10}M${x + 2} ${y - 13}l7 -8M${x + 8} ${y - 13}l7 -8"/>`);
    s.label([g.m[0], g.m[1] + 0.55], label, 'above');
    return s;
  }
  // A source (battery or socket) on the left, from the bottom (−) to the top (+), and the parts in
  // series along the top wire; the circuit closes along the right and the bottom.
  function series(src, parts, current, w = 2.1) {
    const s = new (C().Sketch)(), H = 2.2, W = 0.6 + w * parts.length;
    s.bat([0, -H], [0, 0], { l: src });
    s.wire([0, 0], [0.6, 0]).cur([0, 0], [0.6, 0], current, 'above', 0.5);
    parts.forEach((pt, k) => {
      const a = [0.6 + w * k, 0], b = [0.6 + w * (k + 1), 0];
      if (pt.led) led(s, a, b, pt.l); else s.res(a, b, { l: pt.l });
      if (pt.v) s.vol(a, b, pt.v, 'below', [0.25, 0.75]);
    });
    s.wire([W, 0], [W, -H], [0, -H]);
    return `<div class="fig">${s.toSVG()}</div>`;
  }
  // A source on the left and branches side by side between the top and the bottom wire; pre: parts
  // in series with all branches, on the top wire before them.
  function parallel(src, branches, current, pre = []) {
    const s = new (C().Sketch)(), H = 2.4, step0 = 0.6 + 2.1 * pre.length;
    s.autoDots = true;
    s.bat([0, -H], [0, 0], { l: src });
    s.wire([0, 0], [0.6, 0]).cur([0, 0], [0.6, 0], current, 'above', 0.5);
    pre.forEach((pt, k) => s.res([0.6 + 2.1 * k, 0], [0.6 + 2.1 * (k + 1), 0], { l: pt.l }));
    const xs = [];
    branches.forEach((b, k) => xs.push(k ? xs[k - 1] + 1.1 + C().textWidth(branches[k - 1].l) / C().S : step0 + 0.6));
    s.wire([step0, 0], [xs[xs.length - 1], 0]).wire([0, -H], [xs[xs.length - 1], -H]);
    branches.forEach((b, k) => {
      const a = [xs[k], 0], c = [xs[k], -H];
      if (b.lamp) s.lamp(a, c, { l: b.l, ls: 'right' }); else s.res(a, c, { l: b.l, ls: 'right' });
      if (b.i) s.cur(a, c, b.i, 'left', 0.12);
    });
    return `<div class="fig">${s.toSVG()}</div>`;
  }

  // ---------------------------------------------------------------- pictures
  const A = () => root.Art;
  const cable = (d, cls = '') => A().path(d, `rp-cable ${cls}`);
  function socket(x, y) {
    const a = A();
    return a.rect(x - 15, y - 15, x + 15, y + 15, 'rp-socket', 5) + a.circle(x, y, 10, 'rp-socket') + a.circle(x - 4, y, 1.8, 'rp-hole') + a.circle(x + 4, y, 1.8, 'rp-hole');
  }
  function resistor(x0, y, x1) {
    const a = A(), w = x1 - x0;
    return a.rect(x0, y - 7, x1, y + 7, 'rp-resistor', 6) +
      ['a', 'b', 'c', 'd'].map((c, k) => a.rect(x0 + w * (0.2 + 0.17 * k + (k === 3 ? 0.08 : 0)), y - 7, x0 + w * (0.2 + 0.17 * k + (k === 3 ? 0.08 : 0)) + 4, y + 7, `rp-band ${c}`, 0)).join('');
  }
  function bulb(x, y, r, colour) {
    const a = A();
    return a.circle(x, y, r * 2.4, `rp-glow ${colour}`) + a.circle(x, y, r, `rp-led ${colour}`);
  }
  const spark = (x, y, k = 1) => A().path(`M${x} ${y - 14 * k}l${4 * k} ${9 * k}l${10 * k} ${-3 * k}l${-6 * k} ${8 * k}l${8 * k} ${7 * k}l${-11 * k} ${-1 * k}l${-3 * k} ${10 * k}l${-4 * k} ${-9 * k}l${-10 * k} ${3 * k}l${6 * k} ${-8 * k}l${-8 * k} ${-7 * k}l${11 * k} ${1 * k}Z`, 'rp-spark');
  const label = (x, y, t, cls = 'lbl small', anchor = 'middle') => A().text(x, y, t, cls, anchor);

  // ---------------------------------------------------------------- 1 an LED
  const COLOURS = [{ c: 'red', VL: 2, en: 'red', de: 'rote' }, { c: 'green', VL: 2.2, en: 'green', de: 'grüne' }, { c: 'blue', VL: 3, en: 'blue', de: 'blaue' }];
  const ledPb = {
    id: 'led', difficulty: 1, title: () => L('A resistor for an LED', 'Ein Vorwiderstand für eine LED'),
    make: (r) => ({ col: pick(r, COLOURS), V0: pick(r, [5, 9, 12]), I: pick(r, [10, 20, 25]) }),
    solve: (p) => ({ VR: p.V0 - p.col.VL, R: (p.V0 - p.col.VL) / (p.I / 1000) }),
    fields: () => [field('VR', `${Vs()}_R`, 'V'), field('R', 'R', 'Ω')],
    text: (p) => L(`A ${p.col.en} LED is to light up on a ${q(p.V0, 'V')} battery. At its working current of ${q(p.I, 'mA')}, the potential drops by ${q(p.col.VL, 'V')} across the LED. A resistor in series with the LED limits the current to this value. What voltage is across the resistor, and what resistance must it have?`,
      `Eine ${p.col.de} LED soll an einer ${q(p.V0, 'V')}-Batterie leuchten. Bei ihrem Betriebsstrom von ${q(p.I, 'mA')} fällt das Potential über der LED um ${q(p.col.VL, 'V')} ab. Ein Widerstand in Serie zur LED begrenzt den Strom auf diesen Wert. Welche Spannung liegt am Widerstand, und welchen Widerstandswert muss er haben?`),
    hints: () => [
      L('LED and resistor are in series: the same current flows through both, and their voltages add up to the battery voltage.', 'LED und Widerstand sind in Serie: Durch beide fliesst derselbe Strom, und ihre Spannungen ergeben zusammen die Batteriespannung.'),
      L(`Find the voltage across the resistor first, then use ${m$(`R = ${Vs()}_R/I`)}, with the current in amperes.`, `Bestimme zuerst die Spannung am Widerstand, dann gilt ${m$(`R = ${Vs()}_R/I`)}, mit dem Strom in Ampere.`),
    ],
    steps: (p, v) => {
      const U = Vs();
      return [
        step(L('Voltage across the resistor', 'Spannung am Widerstand'), L(`Let $${U}_0$ be the battery voltage, $${U}_\\text{L}$ the voltage across the LED and $I$ the current. In series, the voltages add up to the battery voltage, $${U}_0 = ${U}_\\text{L} + ${U}_R$, so`,
          `Sei $${U}_0$ die Batteriespannung, $${U}_\\text{L}$ die Spannung an der LED und $I$ der Strom. In Serie ergeben die Spannungen zusammen die Batteriespannung, $${U}_0 = ${U}_\\text{L} + ${U}_R$, also`) +
          `$$${U}_R = ${U}_0 - ${U}_\\text{L} = ${tq(p.V0, 'V')} - ${tq(p.col.VL, 'V')} ${res(v.VR, 'V')}$$`),
        step(L('Resistance', 'Widerstandswert'), L('The same current flows through the resistor as through the LED:', 'Durch den Widerstand fliesst derselbe Strom wie durch die LED:') +
          `$$R = \\frac{${U}_R}{I} = \\frac{${U}_0 - ${U}_\\text{L}}{I} = \\frac{${tq(v.VR, 'V')}}{${num(p.I / 1000)}\\,\\mathrm{A}} ${res(v.R, 'Ω')}$$`),
      ];
    },
    circuit: (p, v) => series(`$${Vs()}_0$ = ${num(p.V0)} V`, [{ l: val('R', v.R, 'Ω'), v: val(`${Vs()}_R`, v.VR, 'V') }, { led: true, l: 'LED', v: val(`${Vs()}_L`, p.col.VL, 'V') }], `$I$ = ${num(p.I)} mA`),
  };

  // ---------------------------------------------------------------- 2 an electric shock
  const shock = {
    id: 'shock', difficulty: 1, title: () => L('Touching a live wire', 'Ein Stromschlag'),
    make: (r) => {
      const Rb = pick(r, [0.8, 1, 1.3, 1.5]);
      return { Rb, Rs1: pick(r, [23, 46, 115]) - Rb, Rs2: pick(r, [2.3, 4.6]) - Rb };
    },
    solve: (p) => ({ I1: 230 / (p.Rb + p.Rs1), I2: 230 / (p.Rb + p.Rs2) }),
    fields: () => [field('I1', 'I_1', 'mA'), field('I2', 'I_2', 'mA')],
    text: (p) => L(`A gardener cuts into the cable of an electric hedge trimmer and touches the bare live wire, which is at ${q(230, 'V')} against the ground. The current flows through the body (resistance ${q(p.Rb, 'kΩ')} from hand to feet) and then through the shoes into the ground. With dry rubber-soled shoes, shoes and ground have a resistance of ${q(p.Rs1, 'kΩ')}; barefoot on wet grass, only ${q(p.Rs2, 'kΩ')}. What current flows through the body in each case? (Currents above about 30 mA can kill.)`,
      `Ein Gärtner schneidet ins Kabel einer elektrischen Heckenschere und berührt den blanken Leiter, der gegenüber der Erde auf ${q(230, 'V')} liegt. Der Strom fliesst durch den Körper (Widerstand ${q(p.Rb, 'kΩ')} von der Hand zu den Füssen) und dann durch die Schuhe in den Boden. Mit trockenen Schuhen mit Gummisohlen haben Schuhe und Boden einen Widerstand von ${q(p.Rs1, 'kΩ')}, barfuss auf nassem Gras nur ${q(p.Rs2, 'kΩ')}. Welcher Strom fliesst jeweils durch den Körper? (Ströme über etwa 30 mA können tödlich sein.)`),
    hints: () => [
      L('Body and shoes are in series: their resistances add up.', 'Körper und Schuhe sind in Serie: Ihre Widerstände addieren sich.'),
      L(`${m$(`I = ${Vs()}/R`)}: with the resistance in kΩ, the current comes out in mA.`, `${m$(`I = ${Vs()}/R`)}: Mit dem Widerstand in kΩ kommt der Strom in mA heraus.`),
    ],
    steps: (p, v) => {
      const U = Vs();
      return [
        step(L('Dry shoes', 'Trockene Schuhe'), L(`Let $${U}$ be the voltage of the wire, $R_\\text{K}$ the resistance of the body and $R_\\text{S}$ that of shoes and ground. They are in series, so the resistances add up:`,
          `Sei $${U}$ die Spannung des Leiters, $R_\\text{K}$ der Widerstand des Körpers und $R_\\text{S}$ der von Schuhen und Boden. Sie sind in Serie, also addieren sich die Widerstände:`) +
          `$$I_1 = \\frac{${U}}{R_\\text{K} + R_{\\text{S},1}} = \\frac{230\\,\\mathrm{V}}{${tq(p.Rb, 'kΩ')} + ${tq(p.Rs1, 'kΩ')}} ${res(v.I1, 'mA')}$$`),
        step(L('Barefoot on wet grass', 'Barfuss auf nassem Gras'), L('The same with the much smaller resistance of the wet ground:', 'Dasselbe mit dem viel kleineren Widerstand des nassen Bodens:') +
          `$$I_2 = \\frac{${U}}{R_\\text{K} + R_{\\text{S},2}} = \\frac{230\\,\\mathrm{V}}{${tq(p.Rb, 'kΩ')} + ${tq(p.Rs2, 'kΩ')}} ${res(v.I2, 'mA')}$$` +
          L(`The current is ${sig(v.I2 / v.I1)} times larger, and deadly: dry insulating shoes protect.`, `Der Strom ist ${sig(v.I2 / v.I1)}-mal grösser und lebensgefährlich: Trockene, isolierende Schuhe schützen.`)),
      ];
    },
    circuit: (p, v) => series(`$${Vs()}$ = 230 V`, [{ l: `$R_\\text{K}$ = ${num(p.Rb)} kΩ` }, { l: `$R_\\text{S}$` }], '$I$', 2.2),
  };

  // ---------------------------------------------------------------- 3 a long extension cable
  const cablePb = {
    id: 'cable', difficulty: 2, title: () => L('A long extension cable', 'Ein langes Verlängerungskabel'),
    make: (r) => {
      const I = pick(r, [5, 10]), r0 = pick(r, [0.25, 0.5, 0.75, 1]);
      return { I0: I, r: r0, R: 230 / I - 2 * r0 };
    },
    solve: (p) => ({ I: 230 / (p.R + 2 * p.r), VH: 230 * p.R / (p.R + 2 * p.r) }),
    fields: () => [field('I', 'I', 'A'), field('VH', `${Vs()}_\\text{H}`, 'V')],
    text: (p) => L(`On a building site, an electric heater with a resistance of ${q(p.R, 'Ω')} is plugged into a ${q(230, 'V')} socket using a long extension cable. Each of the cable's two wires has a resistance of ${q(p.r, 'Ω')}. What current flows, and what voltage is left for the heater?`,
      `Auf einer Baustelle wird ein Heizlüfter mit einem Widerstand von ${q(p.R, 'Ω')} über ein langes Verlängerungskabel an eine ${q(230, 'V')}-Steckdose angeschlossen. Jeder der beiden Leiter des Kabels hat einen Widerstand von ${q(p.r, 'Ω')}. Welcher Strom fliesst, und welche Spannung bleibt für den Heizlüfter?`),
    hints: () => [
      L('The current flows through one wire to the heater and back through the other: wire, heater and wire are in series.', 'Der Strom fliesst durch den einen Leiter zum Heizlüfter und durch den anderen zurück: Leiter, Heizlüfter und Leiter sind in Serie.'),
      L('The current is the socket voltage divided by the total resistance; the heater gets its share of the voltage.', 'Der Strom ist die Spannung der Steckdose geteilt durch den Gesamtwiderstand; der Heizlüfter bekommt seinen Anteil der Spannung.'),
    ],
    steps: (p, v) => {
      const U = Vs();
      return [
        step(L('Current', 'Strom'), L(`Let $${U}_0$ be the voltage of the socket, $R$ the resistance of the heater and $r$ that of one wire. All three are in series, $R_\\text{tot} = R + 2r$, so`,
          `Sei $${U}_0$ die Spannung der Steckdose, $R$ der Widerstand des Heizlüfters und $r$ der eines Leiters. Alle drei sind in Serie, $R_\\text{tot} = R + 2r$, also`) +
          `$$I = \\frac{${U}_0}{R + 2r} = \\frac{230\\,\\mathrm{V}}{${tq(p.R, 'Ω')} + 2\\cdot ${tq(p.r, 'Ω')}} ${res(v.I, 'A')}$$`),
        step(L('Voltage at the heater', 'Spannung am Heizlüfter'), L('This current flows through the heater:', 'Dieser Strom fliesst durch den Heizlüfter:') +
          `$$${U}_\\text{H} = R\\,I = \\frac{R\\,${U}_0}{R + 2r} = \\frac{${tq(p.R, 'Ω')}\\cdot 230\\,\\mathrm{V}}{${tq(p.R + 2 * p.r, 'Ω')}} ${res(v.VH, 'V')}$$` +
          L(`Along each wire the potential drops by ${sig(p.r * v.I)} V: the heater gets ${sig(230 - v.VH)} V less than the socket.`, `Entlang jedes Leiters fällt das Potential um ${sig(p.r * v.I)} V ab: Der Heizlüfter bekommt ${sig(230 - v.VH)} V weniger als die Steckdose.`)),
      ];
    },
    circuit: (p, v) => series(`$${Vs()}_0$ = 230 V`, [{ l: `$r$ = ${num(p.r)} Ω` }, { l: `$R$ = ${num(p.R)} Ω`, v: val(`${Vs()}_H`, v.VH, 'V') }, { l: `$r$ = ${num(p.r)} Ω` }], val('I', v.I, 'A')),
  };

  // ---------------------------------------------------------------- 4 fairy lights
  const lights = {
    id: 'lights', difficulty: 2, title: () => L('Fairy lights', 'Eine Lichterkette'),
    make: (r) => ({ n: pick(r, [10, 20, 23, 46]), I: pick(r, [0.1, 0.2, 0.25, 0.5]) }),
    solve: (p) => ({ V1: 230 / p.n, R1: 230 / p.n / p.I, I2: p.n * p.I / (p.n - 1) }),
    fields: () => [field('V1', `${Vs()}_1`, 'V'), field('R1', 'R_1', 'Ω'), field('I2', "I'", 'A')],
    text: (p) => L(`An old string of fairy lights consists of ${p.n} identical small bulbs in series, plugged into the ${q(230, 'V')} mains. The current is ${q(p.I, 'A')}. (a) What is the voltage across each bulb, and what is the resistance of one bulb? (b) When a bulb burns out, a tiny wire inside it shorts it out, so that the others keep shining. What current flows then? (Take the resistance of the other bulbs to stay the same.)`,
      `Eine alte Lichterkette besteht aus ${p.n} gleichen Lämpchen in Serie und ist am ${q(230, 'V')}-Netz eingesteckt. Der Strom beträgt ${q(p.I, 'A')}. (a) Welche Spannung liegt an jedem Lämpchen, und welchen Widerstand hat ein Lämpchen? (b) Brennt ein Lämpchen durch, schliesst ein kleiner Draht in ihm es kurz, damit die anderen weiter leuchten. Welcher Strom fliesst dann? (Nimm an, der Widerstand der übrigen Lämpchen bleibe gleich.)`),
    hints: () => [
      L('In series, the mains voltage is shared equally among the identical bulbs, and the same current flows through all of them.', 'In Serie teilt sich die Netzspannung gleichmässig auf die gleichen Lämpchen auf, und durch alle fliesst derselbe Strom.'),
      L('Afterwards, one bulb fewer shares the same voltage: the total resistance is smaller.', 'Danach teilen sich ein Lämpchen weniger dieselbe Spannung: Der Gesamtwiderstand ist kleiner.'),
    ],
    steps: (p, v) => {
      const U = Vs();
      return [
        step(L('One bulb', 'Ein Lämpchen'), L(`Let $${U}$ be the mains voltage, $n$ the number of bulbs and $I$ the current. The voltage is shared equally among the $n$ bulbs in series, and the current $I$ flows through each:`,
          `Sei $${U}$ die Netzspannung, $n$ die Anzahl Lämpchen und $I$ der Strom. Die Spannung teilt sich gleichmässig auf die $n$ Lämpchen in Serie auf, und durch jedes fliesst der Strom $I$:`) +
          `$$${U}_1 = \\frac{${U}}{n} = \\frac{230\\,\\mathrm{V}}{${p.n}} ${res(v.V1, 'V')}, \\qquad R_1 = \\frac{${U}_1}{I} = \\frac{${U}}{n\\,I} = \\frac{230\\,\\mathrm{V}}{${p.n}\\cdot ${tq(p.I, 'A')}} ${res(v.R1, 'Ω')}$$`),
        step(L('One bulb shorted out', 'Ein Lämpchen kurzgeschlossen'), L('Now $n - 1$ bulbs are in series:', 'Jetzt sind $n - 1$ Lämpchen in Serie:') +
          `$$I' = \\frac{${U}}{(n - 1)\\,R_1} = \\frac{n}{n - 1}\\,I = \\frac{${p.n}}{${p.n - 1}}\\cdot ${tq(p.I, 'A')} ${res(v.I2, 'A')}$$` +
          L('The current grows a little: the remaining bulbs shine brighter and wear out faster.', 'Der Strom wird etwas grösser: Die übrigen Lämpchen leuchten heller und verschleissen schneller.')),
      ];
    },
    circuit: (p, v) => {
      const s = new (C().Sketch)(), H = 2.2, w = 1.5, n = 4, W = 0.6 + w * n + 1.2;
      s.bat([0, -H], [0, 0], { l: `$${Vs()}$ = 230 V` });
      s.wire([0, 0], [0.6, 0]).cur([0, 0], [0.6, 0], `$I$ = ${num(p.I)} A`, 'above', 0.5);
      for (let k = 0; k < n; k++) s.lamp([0.6 + w * k, 0], [0.6 + w * (k + 1), 0], { l: k === n - 1 ? null : '$R_1$' });
      s.label([0.6 + w * n + 0.6, 0], '…', 'above');
      s.wire([0.6 + w * n, 0], [W, 0], [W, -H], [0, -H]);
      s.label([W / 2, -H], L(`${p.n} bulbs in series, each $${Vs()}_1$ = ${sig(v.V1)} V`, `${p.n} Lämpchen in Serie, je $${Vs()}_1$ = ${sig(v.V1)} V`), 'below');
      return `<div class="fig">${s.toSVG()}</div>`;
    },
  };

  // ---------------------------------------------------------------- 5 a car's lights
  const car = {
    id: 'car', difficulty: 2, title: () => L('A car on a winter evening', 'Ein Auto an einem Winterabend'),
    make: (r) => ({ RH: pick(r, [2.4, 3]), RW: pick(r, [1, 1.2, 1.5]), RT: pick(r, [24, 30]) }),
    solve: (p) => { const I = 12 * (2 / p.RH + 1 / p.RW + 2 / p.RT); return { I, R: 12 / I }; },
    fields: () => [field('I', 'I', 'A'), field('R', 'R_\\text{tot}', 'Ω')],
    text: (p) => L(`On a winter evening, a car's two headlamps (each ${q(p.RH, 'Ω')}), its two tail lamps (each ${q(p.RT, 'Ω')}) and the rear window heater (${q(p.RW, 'Ω')}) are switched on. All of them are connected in parallel to the ${q(12, 'V')} battery. What current does the battery deliver? What is the resistance of all of them together?`,
      `An einem Winterabend sind bei einem Auto die beiden Scheinwerfer (je ${q(p.RH, 'Ω')}), die beiden Rücklichter (je ${q(p.RT, 'Ω')}) und die Heckscheibenheizung (${q(p.RW, 'Ω')}) eingeschaltet. Alle sind parallel an die ${q(12, 'V')}-Batterie angeschlossen. Welchen Strom liefert die Batterie? Welchen Widerstand haben alle zusammen?`),
    hints: () => [
      L('In parallel, every device is at the full battery voltage: find the current through each one.', 'Parallel liegt jedes Gerät an der vollen Batteriespannung: Bestimme den Strom durch jedes.'),
      L('The battery delivers the sum of all these currents. The total resistance is the battery voltage divided by this current.', 'Die Batterie liefert die Summe all dieser Ströme. Der Gesamtwiderstand ist die Batteriespannung geteilt durch diesen Strom.'),
    ],
    steps: (p, v) => {
      const U = Vs();
      return [
        step(L('Current', 'Strom'), L(`Let $${U}$ be the battery voltage, $R_\\text{S}$, $R_\\text{R}$ and $R_\\text{H}$ the resistances of a headlamp, a tail lamp and the heater. Each is at the voltage $${U}$; the currents add up:`,
          `Sei $${U}$ die Batteriespannung, $R_\\text{S}$, $R_\\text{R}$ und $R_\\text{H}$ die Widerstände eines Scheinwerfers, eines Rücklichts und der Heizung. Jedes liegt an der Spannung $${U}$; die Ströme addieren sich:`) +
          `$$I = ${U}\\left(\\frac{2}{R_\\text{S}} + \\frac{2}{R_\\text{R}} + \\frac{1}{R_\\text{H}}\\right) = 12\\,\\mathrm{V}\\left(\\frac{2}{${tq(p.RH, 'Ω')}} + \\frac{2}{${tq(p.RT, 'Ω')}} + \\frac{1}{${tq(p.RW, 'Ω')}}\\right) ${res(v.I, 'A')}$$`),
        step(L('Total resistance', 'Gesamtwiderstand'), L('All of them together draw this current at the battery voltage:', 'Alle zusammen ziehen bei der Batteriespannung diesen Strom:') +
          `$$R_\\text{tot} = \\frac{${U}}{I} = \\frac{1}{2/R_\\text{S} + 2/R_\\text{R} + 1/R_\\text{H}} = \\frac{12\\,\\mathrm{V}}{${tq(Number(sig(v.I)), 'A')}} ${res(v.R, 'Ω')}$$` +
          L('Smaller than the smallest single resistance, as always in parallel.', 'Kleiner als der kleinste einzelne Widerstand, wie immer bei Parallelschaltungen.')),
      ];
    },
    circuit: (p, v) => parallel(`$${Vs()}$ = 12 V`, [
      { lamp: true, l: `$R_\\text{S}$ = ${num(p.RH)} Ω` }, { lamp: true, l: `$R_\\text{S}$` },
      { lamp: true, l: `$R_\\text{R}$ = ${num(p.RT)} Ω` }, { lamp: true, l: `$R_\\text{R}$` },
      { l: `$R_\\text{H}$ = ${num(p.RW)} Ω` }], val('I', v.I, 'A')),
  };

  // ---------------------------------------------------------------- 6 a fuse in the kitchen
  const fuse = {
    id: 'fuse', difficulty: 3, title: () => L('Will the fuse blow?', 'Brennt die Sicherung durch?'),
    make: (r) => {
      for (;;) {
        const p = { RK: pick(r, [23, 25, 46]), RT: pick(r, [46, 57.5, 115]), F: pick(r, [13, 16]) };
        if (230 / p.RK + 230 / p.RT <= p.F - 1) return p;
      }
    },
    solve: (p) => { const I = 230 / p.RK + 230 / p.RT; return { I, R3: 230 / (p.F - I) }; },
    fields: () => [field('I', 'I', 'A'), field('R3', 'R_3', 'Ω')],
    text: (p) => L(`The sockets of a kitchen are on one circuit, protected by a ${q(p.F, 'A')} fuse; all appliances are connected in parallel to the ${q(230, 'V')} mains. The kettle (resistance ${q(p.RK, 'Ω')}) and the toaster (resistance ${q(p.RT, 'Ω')}) are on. (a) What current flows through the fuse? (b) A coffee machine is to be switched on as well. What is the smallest resistance it may have without the fuse blowing?`,
      `Die Steckdosen einer Küche sind an einem Stromkreis, der mit ${q(p.F, 'A')} abgesichert ist; alle Geräte sind parallel am ${q(230, 'V')}-Netz. Wasserkocher (Widerstand ${q(p.RK, 'Ω')}) und Toaster (Widerstand ${q(p.RT, 'Ω')}) sind eingeschaltet. (a) Welcher Strom fliesst durch die Sicherung? (b) Zusätzlich soll eine Kaffeemaschine eingeschaltet werden. Welchen Widerstand muss sie mindestens haben, damit die Sicherung nicht auslöst?`),
    hints: () => [
      L('The fuse is in series with all appliances together: the whole current flows through it, the sum of the currents of the appliances.', 'Die Sicherung ist in Serie mit allen Geräten zusammen: Durch sie fliesst der ganze Strom, die Summe der Ströme der Geräte.'),
      L('The coffee machine may draw at most what is left up to the rating of the fuse. The smaller its resistance, the larger its current.', 'Die Kaffeemaschine darf höchstens den Strom ziehen, der bis zum Nennstrom der Sicherung übrig bleibt. Je kleiner ihr Widerstand, desto grösser ihr Strom.'),
    ],
    steps: (p, v) => {
      const U = Vs();
      return [
        step(L('Current through the fuse', 'Strom durch die Sicherung'), L(`Let $${U}$ be the mains voltage, $R_\\text{W}$ and $R_\\text{T}$ the resistances of the kettle and the toaster. Each is at the full voltage, and the fuse carries the sum of their currents:`,
          `Sei $${U}$ die Netzspannung, $R_\\text{W}$ und $R_\\text{T}$ die Widerstände von Wasserkocher und Toaster. Beide liegen an der vollen Spannung, und durch die Sicherung fliesst die Summe ihrer Ströme:`) +
          `$$I = \\frac{${U}}{R_\\text{W}} + \\frac{${U}}{R_\\text{T}} = \\frac{230\\,\\mathrm{V}}{${tq(p.RK, 'Ω')}} + \\frac{230\\,\\mathrm{V}}{${tq(p.RT, 'Ω')}} ${res(v.I, 'A')}$$`),
        step(L('The coffee machine', 'Die Kaffeemaschine'), L(`Let $I_\\text{max}$ be the rating of the fuse. The coffee machine may draw at most $I_\\text{max} - I$, so its resistance must be at least`,
          `Sei $I_\\text{max}$ der Nennstrom der Sicherung. Die Kaffeemaschine darf höchstens $I_\\text{max} - I$ ziehen, also muss ihr Widerstand mindestens so gross sein:`) +
          `$$R_3 = \\frac{${U}}{I_\\text{max} - ${U}/R_\\text{W} - ${U}/R_\\text{T}} = \\frac{230\\,\\mathrm{V}}{${tq(p.F, 'A')} - ${tq(Number(sig(v.I)), 'A')}} ${res(v.R3, 'Ω')}$$` +
          L('Any machine with a smaller resistance draws more current, and the fuse blows.', 'Jede Maschine mit kleinerem Widerstand zieht mehr Strom, und die Sicherung löst aus.')),
      ];
    },
    circuit: (p, v) => parallel(`$${Vs()}$ = 230 V`, [{ l: `$R_\\text{W}$ = ${num(p.RK)} Ω` }, { l: `$R_\\text{T}$ = ${num(p.RT)} Ω` }, { l: '$R_3$' }], '$I$', [{ l: L('fuse', 'Sicherung') }]),
  };

  // ---------------------------------------------------------------- 7 a hair dryer with two settings
  const dryer = {
    id: 'dryer', difficulty: 3, title: () => L('A hair dryer with two settings', 'Ein Föhn mit zwei Stufen'),
    make: (r) => { const R1 = pick(r, [46, 57.5, 92, 115]); return { R1, R2: pick(r, [46, 57.5, 92, 115].filter((x) => x !== R1)) }; },
    solve: (p) => ({ Is: 230 / (p.R1 + p.R2), Ip: 230 / p.R1 + 230 / p.R2 }),
    fields: () => [field('Is', 'I_\\text{I}', 'A'), field('Ip', 'I_\\text{II}', 'A')],
    text: (p) => L(`A hair dryer has two heating wires with resistances of ${q(p.R1, 'Ω')} and ${q(p.R2, 'Ω')}. On setting I, the switch connects them in series; on setting II, in parallel. What current does the hair dryer draw from the ${q(230, 'V')} mains on each setting? (Leave out the fan.)`,
      `Ein Föhn hat zwei Heizdrähte mit den Widerständen ${q(p.R1, 'Ω')} und ${q(p.R2, 'Ω')}. Auf Stufe I schaltet der Schalter sie in Serie, auf Stufe II parallel. Welchen Strom zieht der Föhn auf jeder Stufe aus dem ${q(230, 'V')}-Netz? (Lass das Gebläse weg.)`),
    hints: () => [
      L('In series, the resistances add up.', 'In Serie addieren sich die Widerstände.'),
      L('In parallel, each wire is at the full mains voltage: add the currents through the two wires.', 'Parallel liegt jeder Draht an der vollen Netzspannung: Addiere die Ströme durch die beiden Drähte.'),
    ],
    steps: (p, v) => {
      const U = Vs();
      return [
        step(L('Setting I, in series', 'Stufe I, in Serie'), L(`Let $${U}$ be the mains voltage and $R_1$, $R_2$ the resistances of the wires. In series, the resistances add up:`, `Sei $${U}$ die Netzspannung und $R_1$, $R_2$ die Widerstände der Drähte. In Serie addieren sich die Widerstände:`) +
          `$$I_\\text{I} = \\frac{${U}}{R_1 + R_2} = \\frac{230\\,\\mathrm{V}}{${tq(p.R1, 'Ω')} + ${tq(p.R2, 'Ω')}} ${res(v.Is, 'A')}$$`),
        step(L('Setting II, in parallel', 'Stufe II, parallel'), L('Each wire is at the full mains voltage; the currents add up:', 'Jeder Draht liegt an der vollen Netzspannung; die Ströme addieren sich:') +
          `$$I_\\text{II} = \\frac{${U}}{R_1} + \\frac{${U}}{R_2} = \\frac{230\\,\\mathrm{V}}{${tq(p.R1, 'Ω')}} + \\frac{230\\,\\mathrm{V}}{${tq(p.R2, 'Ω')}} ${res(v.Ip, 'A')}$$` +
          L(`In parallel, the current is ${sig(v.Ip / v.Is)} times larger: setting II heats much more.`, `Parallel ist der Strom ${sig(v.Ip / v.Is)}-mal grösser: Stufe II heizt viel stärker.`)),
      ];
    },
    circuit: (p, v) => `<div class="figs">${series(`$${Vs()}$ = 230 V`, [{ l: `$R_1$ = ${num(p.R1)} Ω` }, { l: `$R_2$ = ${num(p.R2)} Ω` }], val('I_{I}', v.Is, 'A'), 2.2)}${parallel(`$${Vs()}$ = 230 V`, [{ l: `$R_1$` }, { l: `$R_2$` }], val('I_{II}', v.Ip, 'A'))}</div>`,
  };

  // ---------------------------------------------------------------- 8 a temperature sensor
  const sensor = {
    id: 'sensor', difficulty: 3, title: () => L('A temperature sensor', 'Ein Temperatursensor'),
    make: (r) => ({ R1: pick(r, [5, 10, 20]), VT: pick(r, [1, 1.5, 2, 2.5, 3, 4]) }),
    solve: (p) => ({ I: (5 - p.VT) / p.R1, RT: p.VT * p.R1 / (5 - p.VT) }),
    fields: () => [field('I', 'I', 'mA'), field('RT', 'R_\\text{T}', 'kΩ')],
    text: (p) => L(`A microcontroller measures the temperature of a cup of tea with a thermistor, a resistor whose resistance changes with temperature. Thermistor and a fixed resistor of ${q(p.R1, 'kΩ')} are connected in series to the ${q(5, 'V')} supply of the board. The microcontroller measures ${q(p.VT, 'V')} across the thermistor. What current flows through the thermistor, and what is its resistance?`,
      `Ein Mikrocontroller misst die Temperatur einer Tasse Tee mit einem Thermistor, einem Widerstand, dessen Widerstandswert sich mit der Temperatur ändert. Thermistor und ein fester Widerstand von ${q(p.R1, 'kΩ')} sind in Serie an die ${q(5, 'V')}-Versorgung des Boards angeschlossen. Der Mikrocontroller misst am Thermistor ${q(p.VT, 'V')}. Welcher Strom fliesst durch den Thermistor, und welchen Widerstand hat er?`),
    hints: () => [
      L('The rest of the supply voltage is across the fixed resistor; from it you get the current.', 'Der Rest der Versorgungsspannung liegt am festen Widerstand; daraus folgt der Strom.'),
      L('The same current flows through the thermistor. With kΩ and V, the current comes out in mA.', 'Derselbe Strom fliesst durch den Thermistor. Mit kΩ und V kommt der Strom in mA heraus.'),
    ],
    steps: (p, v) => {
      const U = Vs();
      return [
        step(L('Current', 'Strom'), L(`Let $${U}_0$ be the supply voltage, $R_1$ the fixed resistance and $${U}_\\text{T}$ the voltage across the thermistor. Across the fixed resistor, the potential drops by $${U}_0 - ${U}_\\text{T}$, so`,
          `Sei $${U}_0$ die Versorgungsspannung, $R_1$ der feste Widerstand und $${U}_\\text{T}$ die Spannung am Thermistor. Über dem festen Widerstand fällt das Potential um $${U}_0 - ${U}_\\text{T}$ ab, also`) +
          `$$I = \\frac{${U}_0 - ${U}_\\text{T}}{R_1} = \\frac{${tq(5, 'V')} - ${tq(p.VT, 'V')}}{${tq(p.R1, 'kΩ')}} ${res(v.I, 'mA')}$$`),
        step(L('Resistance of the thermistor', 'Widerstand des Thermistors'), L('The same current flows through the thermistor:', 'Derselbe Strom fliesst durch den Thermistor:') +
          `$$R_\\text{T} = \\frac{${U}_\\text{T}}{I} = \\frac{${U}_\\text{T}}{${U}_0 - ${U}_\\text{T}}\\,R_1 = \\frac{${tq(p.VT, 'V')}}{${tq(5 - p.VT, 'V')}}\\cdot ${tq(p.R1, 'kΩ')} ${res(v.RT, 'kΩ')}$$` +
          L('In a divider, the voltages are in the ratio of the resistances.', 'Bei einem Spannungsteiler stehen die Spannungen im Verhältnis der Widerstände.')),
      ];
    },
    circuit: (p, v) => series(`$${Vs()}_0$ = 5 V`, [{ l: `$R_1$ = ${num(p.R1)} kΩ`, v: val(`${Vs()}_0 - ${Vs()}_T`, 5 - p.VT, 'V') }, { l: '$R_T$', v: `$${Vs()}_T$ = ${num(p.VT)} V` }], val('I', v.I, 'mA'), 2.4),
  };

  // ---------------------------------------------------------------- 9 a tired battery
  const BAT = [{ V0: 4.5, VK: [4, 3.6], R: [4, 8, 12] }, { V0: 9, VK: [8, 7.5, 7.2], R: [12, 16, 24, 30] }];
  const battery = {
    id: 'battery', difficulty: 3, title: () => L('The resistance inside a battery', 'Der Innenwiderstand einer Batterie'),
    make: (r) => { const b = pick(r, BAT); return { V0: b.V0, VK: pick(r, b.VK), R: pick(r, b.R) }; },
    solve: (p) => ({ I: p.VK / p.R, r: p.R * (p.V0 - p.VK) / p.VK }),
    fields: () => [field('I', 'I', 'A'), field('r', 'r', 'Ω')],
    text: (p) => L(`A voltmeter on its own shows ${q(p.V0, 'V')} across a battery. When a lamp with a resistance of ${q(p.R, 'Ω')} is connected to it, the voltmeter shows only ${q(p.VK, 'V')}. The reason: a battery acts like an ideal source of ${q(p.V0, 'V')} in series with a small resistance inside the battery. What current flows through the lamp, and how large is the battery's internal resistance?`,
      `Ein Voltmeter allein zeigt an einer Batterie ${q(p.V0, 'V')}. Wird eine Lampe mit einem Widerstand von ${q(p.R, 'Ω')} angeschlossen, zeigt es nur noch ${q(p.VK, 'V')}. Der Grund: Eine Batterie verhält sich wie eine ideale Quelle von ${q(p.V0, 'V')} in Serie mit einem kleinen Widerstand im Inneren der Batterie. Welcher Strom fliesst durch die Lampe, und wie gross ist der Innenwiderstand der Batterie?`),
    hints: () => [
      L('The voltmeter with the lamp connected shows the voltage across the lamp: from it you get the current.', 'Das Voltmeter mit angeschlossener Lampe zeigt die Spannung an der Lampe: Daraus folgt der Strom.'),
      L('The missing voltage is across the internal resistance, and the same current flows through it.', 'Die fehlende Spannung liegt am Innenwiderstand, und durch ihn fliesst derselbe Strom.'),
    ],
    steps: (p, v) => {
      const U = Vs();
      return [
        step(L('Current', 'Strom'), L(`Let $${U}_0$ be the voltage of the ideal source, $${U}_\\text{K}$ the voltage across the lamp and $R$ its resistance. Then`, `Sei $${U}_0$ die Spannung der idealen Quelle, $${U}_\\text{K}$ die Spannung an der Lampe und $R$ ihr Widerstand. Dann ist`) +
          `$$I = \\frac{${U}_\\text{K}}{R} = \\frac{${tq(p.VK, 'V')}}{${tq(p.R, 'Ω')}} ${res(v.I, 'A')}$$`),
        step(L('Internal resistance', 'Innenwiderstand'), L(`Across the internal resistance $r$, the potential drops by $${U}_0 - ${U}_\\text{K}$; the same current flows through it:`, `Über dem Innenwiderstand $r$ fällt das Potential um $${U}_0 - ${U}_\\text{K}$ ab; durch ihn fliesst derselbe Strom:`) +
          `$$r = \\frac{${U}_0 - ${U}_\\text{K}}{I} = \\frac{${U}_0 - ${U}_\\text{K}}{${U}_\\text{K}}\\,R = \\frac{${tq(p.V0, 'V')} - ${tq(p.VK, 'V')}}{${tq(p.VK, 'V')}}\\cdot ${tq(p.R, 'Ω')} ${res(v.r, 'Ω')}$$`),
      ];
    },
    circuit: (p, v) => {
      const s = new (C().Sketch)(), H = 2.4;
      s.zone([-0.9, -H + 0.2], [2.2, 0.75], 'light', [L('battery', 'Batterie')]);
      s.bat([0, -H], [0, -0.2], { l: `$${Vs()}_0$ = ${num(p.V0)} V` });
      s.wire([0, -0.2], [0, 0]);
      s.res([0, 0], [1.9, 0], { l: val('r', v.r, 'Ω') });
      s.wire([1.9, 0], [4.4, 0]).cur([1.9, 0], [4.4, 0], val('I', v.I, 'A'), 'above', 0.7);
      s.lamp([4.4, 0], [4.4, -H], { l: `$R$ = ${num(p.R)} Ω`, ls: 'right' }).vol([4.4, 0], [4.4, -H], `$${Vs()}_K$ = ${num(p.VK)} V`, 'left');
      s.wire([4.4, -H], [0, -H]);
      return `<div class="fig">${s.toSVG()}</div>`;
    },
  };

  // ---------------------------------------------------------------- 10 a meter with a new range
  const meter = {
    id: 'meter', difficulty: 4, title: () => L('Building an ammeter and a voltmeter', 'Ein Amperemeter und ein Voltmeter bauen'),
    make: (r) => { const N = pick(r, [10, 50, 100]); return { N, Rm: pick(r, [0.5, 1, 2]) * (N - 1), Vmax: pick(r, [5, 10, 20]) }; },
    solve: (p) => ({ Vm: p.Rm, Rs: p.Rm / (p.N - 1), Rv: p.Vmax * 1000 - p.Rm }),
    fields: () => [field('Vm', `${Vs()}_\\text{m}`, 'mV'), field('Rs', 'R_\\text{P}', 'Ω'), field('Rv', 'R_\\text{S}', 'Ω')],
    text: (p) => L(`The needle of a moving-coil meter reaches the end of its scale at a current of ${q(1, 'mA')}; the coil has a resistance of ${q(p.Rm, 'Ω')}. (a) What voltage is across the meter when the needle is at the end of the scale? (b) To measure currents up to ${q(p.N, 'mA')}, a resistor is connected in parallel with the meter, so that most of the current bypasses it. What resistance must it have? (c) To use the meter as a voltmeter for up to ${q(p.Vmax, 'V')}, a resistor is connected in series with it instead. What resistance must this one have?`,
      `Die Nadel eines Drehspulmessgeräts erreicht das Ende der Skala bei einem Strom von ${q(1, 'mA')}; die Spule hat einen Widerstand von ${q(p.Rm, 'Ω')}. (a) Welche Spannung liegt am Messgerät, wenn die Nadel am Ende der Skala steht? (b) Um Ströme bis ${q(p.N, 'mA')} zu messen, wird ein Widerstand parallel zum Messgerät geschaltet, sodass der grösste Teil des Stroms daran vorbeifliesst. Welchen Widerstand muss er haben? (c) Um das Messgerät als Voltmeter für bis zu ${q(p.Vmax, 'V')} zu verwenden, wird stattdessen ein Widerstand in Serie geschaltet. Welchen Widerstand muss dieser haben?`),
    hints: () => [
      L('At the end of the scale, 1 mA flows through the coil. With Ω and mA, the voltage comes out in mV.', 'Am Ende der Skala fliesst 1 mA durch die Spule. Mit Ω und mA kommt die Spannung in mV heraus.'),
      L('In parallel, the resistor is at the same voltage as the meter and carries the rest of the current.', 'Parallel liegt der Widerstand an derselben Spannung wie das Messgerät und führt den Rest des Stroms.'),
      L('In series, the full voltage must drive just 1 mA through meter and resistor together.', 'In Serie muss die volle Spannung gerade 1 mA durch Messgerät und Widerstand zusammen treiben.'),
    ],
    steps: (p, v) => {
      const U = Vs();
      return [
        step(L('Voltage across the meter', 'Spannung am Messgerät'), L(`Let $I_\\text{m}$ be the current at the end of the scale and $R_\\text{m}$ the resistance of the coil. Then`, `Sei $I_\\text{m}$ der Strom am Ende der Skala und $R_\\text{m}$ der Widerstand der Spule. Dann ist`) +
          `$$${U}_\\text{m} = R_\\text{m}\\,I_\\text{m} = ${tq(p.Rm, 'Ω')}\\cdot ${tq(1, 'mA')} = \\htmlClass{result}{${num(v.Vm)}\\,\\mathrm{mV}}$$`),
        step(L('Resistor in parallel', 'Widerstand parallel'), L(`Let $I$ be the largest current to measure. The resistor in parallel carries $I - I_\\text{m}$ at the voltage $${U}_\\text{m}$:`, `Sei $I$ der grösste zu messende Strom. Der Widerstand parallel führt $I - I_\\text{m}$ bei der Spannung $${U}_\\text{m}$:`) +
          `$$R_\\text{P} = \\frac{R_\\text{m}\\,I_\\text{m}}{I - I_\\text{m}} = \\frac{${tq(p.Rm, 'Ω')}\\cdot ${tq(1, 'mA')}}{${tq(p.N, 'mA')} - ${tq(1, 'mA')}} ${res(v.Rs, 'Ω')}$$`),
        step(L('Resistor in series', 'Widerstand in Serie'), L(`Let $${U}$ be the largest voltage to measure. Meter and resistor in series must have $${U}/I_\\text{m}$ together:`, `Sei $${U}$ die grösste zu messende Spannung. Messgerät und Widerstand in Serie müssen zusammen $${U}/I_\\text{m}$ haben:`) +
          `$$R_\\text{S} = \\frac{${U}}{I_\\text{m}} - R_\\text{m} = \\frac{${tq(p.Vmax, 'V')}}{0.001\\,\\mathrm{A}} - ${tq(p.Rm, 'Ω')} ${res(v.Rv, 'Ω')}$$` +
          L('An ammeter must have a small resistance, a voltmeter a large one.', 'Ein Amperemeter muss einen kleinen Widerstand haben, ein Voltmeter einen grossen.')),
      ];
    },
    circuit: (p, v) => {
      const s = new (C().Sketch)();
      s.autoDots = true;
      s.wire([-1.2, 0], [0, 0]).cur([-1.2, 0], [0, 0], `$I$ = ${p.N} mA`, 'above', 0.5);
      s.wire([0, 0], [0, 0.8], [0.6, 0.8]).res([0.6, 0.8], [2.4, 0.8], { l: `$R_m$ = ${num(p.Rm)} Ω` }).wire([2.4, 0.8], [3, 0.8], [3, 0]);
      s.wire([0, 0], [0, -0.8], [0.6, -0.8]).res([0.6, -0.8], [2.4, -0.8], { l: val('R_P', v.Rs, 'Ω'), ls: 'below' }).wire([2.4, -0.8], [3, -0.8], [3, 0]);
      s.cur([0.6, 0.8], [2.4, 0.8], '$I_m$ = 1 mA', 'below', 0.88);
      s.wire([3, 0], [3.6, 0]);
      const t = new (C().Sketch)();
      t.wire([-1, 0], [0, 0]).cur([-1, 0], [0, 0], '$I_m$ = 1 mA', 'above', 0.5);
      t.res([0, 0], [1.8, 0], { l: `$R_m$` }).res([1.8, 0], [3.6, 0], { l: val('R_S', v.Rv, 'Ω') }).wire([3.6, 0], [4.2, 0]);
      t.vol([0, 0], [3.6, 0], `$${Vs()}$ = ${p.Vmax} V`, 'below', [0.05, 0.95]);
      return `<div class="figs"><div class="fig">${s.toSVG()}</div><div class="fig">${t.toSVG()}</div></div>`;
    },
  };

  const PROBLEMS = [ledPb, shock, cablePb, lights, car, fuse, dryer, sensor, battery, meter];

  // ---------------------------------------------------------------- exercises
  function realOf(i, seed) {
    const pb = PROBLEMS[i], p = pb.make(rng(seed)), v = pb.solve(p);
    const fields = pb.fields(p).map((f) => ({ ...f, value: v[f.key] }));
    return {
      ptype: 'real', difficulty: pb.difficulty, title: pb.title(), text: `<p>${pb.text(p)}</p>`,
      fields, tol: 0.01,
      // the picture of the situation; with the solution, the circuit diagram
      figure: (sol) => (sol ? pb.circuit(p, v) : root.CircuitFigures ? root.CircuitFigures[pb.id](p, v) : ''),
      hints: pb.hints(p), solution: pb.steps(p, v),
      results: fields.map((f) => `$${f.sym} = ${sig(f.value)}\\,${TU[f.unit] || `\\mathrm{${f.unit}}`}$`).join(', '),
      p, v,
    };
  }

  root.CircuitProblems = { PROBLEMS, realOf };
  if (typeof module !== 'undefined') module.exports = root.CircuitProblems;
})(typeof window !== 'undefined' ? window : globalThis);
