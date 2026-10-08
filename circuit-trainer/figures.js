// The pictures of the problems (realproblems.js), as in a physics textbook, drawn with the shared
// figure kit (figkit.js): the devices as they look, joined by wires, with the given values as
// labels; the circuit diagram belongs to the solution. CircuitFigures[id](p) gives the SVG.
(function (root) {
  'use strict';

  const F = () => root.Fig;
  const Lang = root.Lang;
  const L = (en, de) => (Lang ? Lang.L(en, de) : en);
  const f = (x) => Math.round(x * 10) / 10;
  const wire = (d, cls = '') => F().path(d, `tb-wire${cls ? ` ${cls}` : ''}`);
  // a battery block with + and − terminals, its voltage written on it
  function battery(x, y, w, h, label) {
    const { rect, text } = F();
    return rect(x, y, w, h, 'tb-dark', 4) + rect(x + 6, y - 7, 10, 7, 'tb-metal', 1) + rect(x + w - 16, y - 7, 10, 7, 'tb-metal', 1) +
      text(x + 11, y - 11, '+', 'tb-label') + text(x + w - 11, y - 11, '−', 'tb-label') + text(x + w / 2, y + h / 2 + 5, label, 'tb-onDark');
  }
  // a resistor (beige body with colour bands) from (x, y), horizontal, length 50
  const resistor = (x, y) => { const { path, rect } = F(); return path(`M${x - 14} ${y} H${x + 64}`, 'tb-wire') + rect(x, y - 7, 50, 14, 'tb-resistor', 6) + [12, 20, 28, 38].map((d, k) => rect(x + d, y - 7, 4, 14, ['tb-band1', 'tb-band2', 'tb-band3', 'tb-band4'][k])).join(''); };
  // a wall socket at (x, y)
  const socket = (x, y) => F().rect(x - 18, y - 18, 36, 36, 'tb-socket', 5) + F().circle(x - 6, y, 2.6, 'tb-line-fill') + F().circle(x + 6, y, 2.6, 'tb-line-fill');
  const bulb = (x, y, r = 9, cls = 'tb-bulb') => F().circle(x, y, r, cls) + F().rect(x - r * 0.5, y + r * 0.8, r, r * 0.7, 'tb-metal', 1);

  // ---------------------------------------------------------------- 1 an LED and its resistor
  function led(p) {
    const { svg, path, circle, text } = F();
    return svg(420, 230,
      battery(40, 110, 70, 100, `${p.V0} V`) +
      wire('M51 103 V60 H180') + resistor(194, 60) + wire('M258 60 H296 V150 H314') +
      path('M308 128 V96 Q308 84 320 84 Q332 84 332 96 V128 Z', `tb-led ${p.col.c}`) + path('M304 128 H336', 'tb-line') +
      path('M314 128 V150 M326 128 V150', 'tb-line') + wire('M326 150 V190 H150 V92 H99 V103') +
      text(219, 44, L('resistor', 'Widerstand'), 'tb-label') + text(352, 104, 'LED', 'tb-label', 'start'),
      L('An LED with a resistor in series on a battery', 'Eine LED mit Vorwiderstand an einer Batterie'));
  }

  // ---------------------------------------------------------------- 2 touching a live wire
  function shock() {
    const { svg, path, rect, person, ground, wall, text } = F();
    return svg(430, 250,
      ground(0, 430, 220) + wall(30, 20, 220, 'left') + socket(52, 120) +
      wire('M66 122 Q120 200 200 200 Q230 200 238 170') + path('M238 170 l10 -10 M244 176 l8 -12', 'tb-spark') +
      person(270, 220, 1.4, { shirt: 'green', dir: -1, lean: 12, hands: [null, [244, 166]] }) +
      path('M246 162 L248 142 Q258 140 264 150 L266 168 L262 214', 'tb-current') + path('M260 222 l-8 6 M270 222 l8 6', 'tb-current') +
      rect(330, 196, 70, 24, 'tb-green', 6) + text(365, 188, L('hedge trimmer', 'Heckenschere'), 'tb-cap') +
      text(110, 238, '230 V', 'tb-label') + text(420, 70, L('current through the body', 'Strom durch den Körper'), 'tb-cap', 'end'),
      L('A gardener touching the cut cable of a hedge trimmer; the current flows through the body into the ground', 'Ein Gärtner berührt das durchgeschnittene Kabel einer Heckenschere; der Strom fliesst durch den Körper in den Boden'));
  }

  // ---------------------------------------------------------------- 3 a long extension cable
  function cable() {
    const { svg, rect, path, ground, wall, text } = F();
    let coil = ''; for (let k = 0; k < 6; k++) coil += `M${150 + 12 * k} 196 a22 14 0 1 1 1 0`;
    return svg(430, 240,
      ground(0, 430, 220) + wall(30, 20, 220, 'left') + socket(52, 120) +
      wire('M66 122 Q110 200 150 196') + path(coil, 'tb-wire') + wire('M232 196 Q280 200 300 170') +
      rect(300, 110, 90, 108, 'tb-heater', 6) + path('M318 122 V206 M336 122 V206 M354 122 V206 M372 122 V206', 'tb-trim') +
      text(52, 92, '230 V', 'tb-label') + text(345, 100, L('heater', 'Heizofen'), 'tb-label') + text(190, 236, L('long extension cable', 'langes Verlängerungskabel'), 'tb-cap'),
      L('A heater on a long extension cable', 'Ein Heizofen an einem langen Verlängerungskabel'));
  }

  // ---------------------------------------------------------------- 4 fairy lights
  function lights(p) {
    const { svg, path, wall, text } = F();
    // a bulb hanging from the wire in its socket, the wire running through the socket
    const hanging = (x, yw) => F().rect(x - 3.5, yw - 2, 7, 9, 'tb-metal', 1) + F().circle(x, yw + 13, 6.5, 'tb-bulb');
    const xs = Array.from({ length: 11 }, (z, k) => 90 + 30 * k), y = (x) => 70 + 50 * Math.sin(((x - 90) / 300) * Math.PI);
    return svg(430, 220,
      wall(30, 20, 200, 'left') + socket(52, 110) + wire(`M66 112 Q78 ${y(90) - 10} 90 ${f(y(90))}`) +
      wire(`M${xs.map((x) => `${x} ${f(y(x))}`).join(' L')}`) +
      xs.slice(1, -1).map((x) => hanging(x, y(x))).join('') + text(xs[5], y(xs[5]) + 46, '…', 'tb-label') +
      text(250, 200, L(`${p.n} bulbs in series`, `${p.n} Lämpchen in Serie`), 'tb-cap') + text(52, 82, '230 V', 'tb-label'),
      L('A string of fairy lights: small bulbs in series on the mains', 'Eine Lichterkette: kleine Lämpchen in Serie am Netz'));
  }

  // ---------------------------------------------------------------- 5 a car on a winter evening
  function car() {
    const { svg, car: carSide, ground, path, text, line } = F();
    return svg(430, 230,
      ground(0, 430, 200) + carSide(70, 200, 290) +
      path('M356 148 l30 -8 M356 152 h32 M356 156 l30 8', 'tb-beam') + path('M74 150 l-22 -6 M74 154 h-24', 'tb-beam red') +
      path('M246 98 L262 98 M244 104 L266 104', 'tb-heat') +
      line(372, 120, 396, 80, 'tb-thin') + text(398, 74, L('headlamps', 'Scheinwerfer'), 'tb-cap', 'end') +
      line(62, 130, 40, 90, 'tb-thin') + text(30, 84, L('tail lamps', 'Rücklichter'), 'tb-cap', 'start') +
      line(256, 96, 270, 50, 'tb-thin') + text(270, 44, L('rear window heater', 'Heckscheibenheizung'), 'tb-cap') +
      text(210, 222, L('all in parallel on the 12 V battery', 'alle parallel an der 12-V-Batterie'), 'tb-cap'),
      L('A car with its headlamps, tail lamps and rear window heater on', 'Ein Auto mit eingeschalteten Scheinwerfern, Rücklichtern und Heckscheibenheizung'));
  }

  // ---------------------------------------------------------------- 6 will the fuse blow?
  function fuse(p) {
    const { svg, rect, path, text, line } = F();
    return svg(430, 240,
      rect(20, 30, 50, 80, 'tb-socket', 4) + rect(32, 46, 26, 14, 'tb-dark', 2) + text(45, 126, L(`fuse ${p.F} A`, `Sicherung ${p.F} A`), 'tb-cap') +
      wire('M70 70 H110 V130') + rect(100, 120, 290, 30, 'tb-socket', 6) + [140, 200, 260, 320].map((x) => F().circle(x, 135, 9, 'tb-metal')).join('') +
      line(20, 196, 420, 196, 'tb-line') + rect(20, 196, 400, 30, 'tb-wood') +
      path('M150 196 V160 Q150 150 162 150 H186 Q198 150 198 160 V196 Z', 'tb-metal') + path('M198 164 q14 0 14 14 q0 10 -12 12', 'tb-line') + text(174, 214, L('kettle', 'Wasserkocher'), 'tb-cap') +
      rect(232, 156, 60, 40, 'tb-metal', 8) + path('M244 156 V150 M268 156 V150', 'tb-line') + text(262, 214, L('toaster', 'Toaster'), 'tb-cap') +
      rect(318, 136, 52, 60, 'tb-ghost', 6) + text(344, 214, L('coffee machine?', 'Kaffeemaschine?'), 'tb-cap') +
      wire('M140 144 Q140 160 160 160') + wire('M200 144 Q210 160 240 158') + wire('M320 144 Q334 150 336 136', 'dashed'),
      L('A kitchen circuit with a fuse: kettle and toaster on, a coffee machine to be added', 'Ein Küchenstromkreis mit Sicherung: Wasserkocher und Toaster eingeschaltet, eine Kaffeemaschine soll dazukommen'));
  }

  // ---------------------------------------------------------------- 7 a hair dryer with two settings
  function dryer() {
    const { svg, path, rect, circle, text } = F();
    let c1 = '', c2 = ''; for (let k = 0; k < 9; k++) { c1 += `M${150 + 18 * k} 70 l9 18 l9 -18`; c2 += `M${150 + 18 * k} 100 l9 18 l9 -18`; }
    return svg(430, 240,
      path('M100 60 H330 L380 80 V110 L330 130 H180 L200 220 H150 L120 130 H100 Z', 'tb-red') + rect(330, 70, 52, 50, 'tb-ghost', 4) +
      circle(130, 95, 26, 'tb-metal') + path('M130 72 L130 118 M108 84 L152 106 M108 106 L152 84', 'tb-thin') +
      path(c1, 'tb-coil') + path(c2, 'tb-coil') + rect(160, 150, 26, 30, 'tb-dark', 4) + text(173, 146, 'I / II', 'tb-label') +
      text(230, 50, L('two heating wires', 'zwei Heizdrähte'), 'tb-cap') + wire('M175 220 Q180 236 240 236'),
      L('A hair dryer cut open: the fan and two heating wires, the switch on the handle', 'Ein aufgeschnittener Föhn: der Ventilator und zwei Heizdrähte, der Schalter am Griff'));
  }

  // ---------------------------------------------------------------- 8 a temperature sensor
  function sensor() {
    const { svg, rect, path, text, circle } = F();
    return svg(430, 240,
      rect(30, 70, 190, 110, 'tb-pcb', 6) + rect(70, 100, 50, 40, 'tb-dark', 3) + [0, 1, 2, 3, 4, 5].map((k) => rect(74 + 8 * k, 140, 3, 8, 'tb-metal')).join('') + resistor(150, 120) +
      text(125, 196, L('fixed resistor', 'fester Widerstand'), 'tb-cap') + text(60, 88, '5 V', 'tb-onDark') +
      wire('M214 120 Q280 120 300 60 L330 140') + path('M290 140 H380 L372 220 H298 Z', 'tb-cup') + path('M294 156 H376', 'tb-tea') + path('M380 156 q24 4 20 30 q-4 18 -24 14', 'tb-line') +
      rect(326, 140, 8, 40, 'tb-dark', 3) + circle(330, 182, 6, 'tb-dark') + text(336, 128, L('thermistor', 'Thermistor'), 'tb-cap'),
      L('A microcontroller board with a fixed resistor, wired to a thermistor in a cup of tea', 'Eine Mikrocontroller-Platine mit festem Widerstand, verbunden mit einem Thermistor in einer Tasse Tee'));
  }

  // ---------------------------------------------------------------- 9 the resistance inside a battery
  function batteryPb(p) {
    const { svg, rect, circle, path, text } = F();
    return svg(430, 240,
      battery(60, 120, 80, 90, '') +
      rect(260, 40, 120, 80, 'tb-socket', 6) + rect(274, 54, 92, 34, 'tb-lcd', 3) + text(320, 78, 'V', 'tb-label') + text(320, 108, L('voltmeter', 'Voltmeter'), 'tb-cap') +
      wire('M71 113 V90 Q71 70 120 70 H260') + wire('M129 113 V100 Q140 96 270 110', '') +
      bulb(220, 170, 14) + wire('M71 113 Q60 200 214 194') + wire('M129 113 Q160 150 226 186') + text(250, 176, L('lamp', 'Lampe'), 'tb-cap', 'start'),
      L('A battery with a voltmeter across it and a lamp connected', 'Eine Batterie mit einem Voltmeter daran und einer angeschlossenen Lampe'));
  }

  // ---------------------------------------------------------------- 10 a moving-coil meter
  function meter() {
    const { svg, rect, path, circle, text, line } = F();
    const c = [210, 160], R = 110;
    let ticks = ''; for (let k = 0; k <= 10; k++) { const a = Math.PI * (0.8 - 0.06 * k); ticks += `M${f(c[0] + R * Math.cos(a))} ${f(c[1] - R * Math.sin(a))}L${f(c[0] + (R - (k % 5 ? 8 : 14)) * Math.cos(a))} ${f(c[1] - (R - (k % 5 ? 8 : 14)) * Math.sin(a))}`; }
    const na = Math.PI * 0.35;
    return svg(420, 240,
      rect(60, 20, 300, 200, 'tb-socket', 10) + path(`M${f(c[0] + R * Math.cos(Math.PI * 0.8))} ${f(c[1] - R * Math.sin(Math.PI * 0.8))} A${R} ${R} 0 0 1 ${f(c[0] + R * Math.cos(Math.PI * 0.2))} ${f(c[1] - R * Math.sin(Math.PI * 0.2))}`, 'tb-line') + path(ticks, 'tb-line') +
      text(c[0] + (R + 12) * Math.cos(Math.PI * 0.8), c[1] - (R + 12) * Math.sin(Math.PI * 0.8), '0', 'tb-label') + text(c[0] + (R + 12) * Math.cos(Math.PI * 0.2), c[1] - (R + 12) * Math.sin(Math.PI * 0.2), '1', 'tb-label') + text(c[0], 110, 'mA', 'tb-label') +
      line(c[0], c[1], c[0] + (R - 6) * Math.cos(na), c[1] - (R - 6) * Math.sin(na), 'tb-needle') + circle(c[0], c[1], 7, 'tb-dark') +
      circle(110, 200, 8, 'tb-metal') + circle(310, 200, 8, 'tb-metal') + text(110, 186, '+', 'tb-label') + text(310, 186, '−', 'tb-label'),
      L('A moving-coil meter: its needle reaches the end of the scale at 1 mA', 'Ein Drehspulinstrument: Sein Zeiger erreicht das Skalenende bei 1 mA'));
  }

  root.CircuitFigures = { led, shock, cable, lights, car, fuse, dryer, sensor, battery: batteryPb, meter };
})(typeof window !== 'undefined' ? window : globalThis);
