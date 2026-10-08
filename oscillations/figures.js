// The pictures of the problems, in the manner of a physics textbook: thin even ink outlines, a few
// muted tints and brushed metal, the ground hatched, and the oscillation drawn in: the extreme
// positions as dashed outlines, the equilibrium as a dashed line, the motion as a slim double
// arrow, drawn with the shared figure kit (figkit.js). The colours follow the dark mode.
//   Figures.<name>()  an SVG in a <div class="fig">
(function (root) {
  'use strict';

  const { f, svg, path, line, circle, text, motion, ground, spring } = root.Fig;
  const L = (en, de) => root.OC.L(en, de);

  // y on a sine water surface

  // ---------------------------------------------------------------- tuning fork
  function forkPath(dx = 0) {
    // the prongs 11 wide with a gap of 18, the crotch a half circle, the stem 8 wide
    const L0 = 190 - dx, R0 = 230 + dx;
    return `M${L0} 36 Q${L0} 30 ${L0 + 5} 30 Q${L0 + 11} 30 ${L0 + 11} 36 L201 140 A9 9 0 0 0 219 140 L${R0 - 11} 36 Q${R0 - 11} 30 ${R0 - 5} 30 Q${R0} 30 ${R0} 36 ` +
      'L230 140 A20 20 0 0 1 214 159.6 L214 196 L206 196 L206 159.6 A20 20 0 0 1 190 140 Z';
  }
  const fork = () => svg(420, 240,
    path(forkPath(8), 'tb-ghost') + path(forkPath(), 'tb-metal') + path('M194 38 V138 M226 38 V138', 'tb-shine') +
    `<rect class="tb-metal" x="204" y="194" width="12" height="16" rx="3"/>` + circle(210, 214, 7, 'tb-metal') +
    motion(150, 44, 182, 44) + motion(238, 44, 270, 44) +
    [0, 1, 2].map((k) => path(`M${292 + 14 * k} ${70 - 6 * k} q${12 + 4 * k} ${30 + 6 * k} 0 ${60 + 12 * k}`, 'tb-sound')).join(''),
    L('A tuning fork with its prongs in their extreme positions', 'Eine Stimmgabel mit ihren Zinken in den äussersten Lagen'));

  // ---------------------------------------------------------------- skyscraper
  const tower = () => {
    let win = ''; for (let y = 44; y < 200; y += 14) win += `M182 ${y} H238`;
    for (let x = 196; x < 238; x += 14) win += `M${x} 36 V206`;
    // the building bent to either side: its top moved by ±18
    const lean = (d) => `M176 206 Q176 120 ${176 + d} 30 H${244 + d} Q244 120 244 206`;
    return svg(420, 230,
      path(lean(22), 'tb-ghost') +
      `<rect class="tb-wall" x="176" y="30" width="68" height="176"/>` + path(win, 'tb-trim') +
      ground(60, 360, 206) + motion(170, 16, 270, 16),
      L('A skyscraper; dashed, bent by the wind', 'Ein Wolkenkratzer; gestrichelt vom Wind gebogen'));
  };

  // ---------------------------------------------------------------- atoms in a crystal: balls and springs
  const atoms = () => {
    const X = (i) => 90 + 60 * i, Y = (j) => 50 + 60 * j;
    let s = '';
    const hspring = (x0, y, x1) => { let d = `M${x0} ${y}h5`; const st = (x1 - x0 - 10) / 6; for (let k = 0; k < 6; k++) d += `l${f(st / 4)} -5l${f(st / 2)} 10l${f(st / 4)} -5`; return path(`${d}h5`, 'tb-spring'); };
    const vspring = (x, y0, y1) => { let d = `M${x} ${y0}v5`; const st = (y1 - y0 - 10) / 6; for (let k = 0; k < 6; k++) d += `l-5 ${f(st / 4)}l10 ${f(st / 2)}l-5 ${f(st / 4)}`; return path(`${d}v5`, 'tb-spring'); };
    for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) { if (i < 4) s += hspring(X(i) + 14, Y(j), X(i + 1) - 14); if (j < 2) s += vspring(X(i), Y(j) + 14, Y(j + 1) - 14); }
    s += circle(X(2) - 12, Y(1), 14, 'tb-ghost') + circle(X(2) + 12, Y(1), 14, 'tb-ghost');
    for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) if (!(i === 2 && j === 1)) s += circle(X(i), Y(j), 14, 'tb-atom');
    s += circle(X(2), Y(1), 14, 'tb-atom hl') + motion(X(2) - 30, Y(1) + 30, X(2) + 30, Y(1) + 30);
    return svg(420, 220, s, L('Atoms in a crystal as balls joined by springs; dashed, one atom in its extreme positions', 'Atome in einem Kristall als Kugeln, durch Federn verbunden; gestrichelt ein Atom in seinen äussersten Lagen'));
  };

  // ---------------------------------------------------------------- baby bouncer
  function baby(dy, cls) {
    const y = (v) => f(v + dy);
    const seat = `M186 ${y(150)} Q210 ${y(168)} 234 ${y(150)} L230 ${y(176)} Q210 ${y(186)} 190 ${y(176)} Z`;
    const body = `M196 ${y(120)} Q210 ${y(112)} 224 ${y(120)} L228 ${y(160)} Q210 ${y(168)} 192 ${y(160)} Z`;
    const legs = `M200 ${y(176)} Q198 ${y(196)} 192 ${y(206)} M220 ${y(176)} Q222 ${y(196)} 228 ${y(206)}`;
    if (cls === 'ghost') return path(`${seat}${body}${legs}`, 'tb-ghost') + circle(210, +y(100), 17, 'tb-ghost');
    return path(`M186 ${y(150)} L198 ${y(110)} M234 ${y(150)} L222 ${y(110)}`, 'tb-line') + path(body, 'tb-body') + circle(210, +y(100), 17, 'tb-skin') +
      path(legs, 'tb-limb') + path(seat, 'tb-seat') + path(`M196 ${y(132)} Q186 ${y(140)} 190 ${y(150)} M224 ${y(132)} Q234 ${y(140)} 230 ${y(150)}`, 'tb-limb');
  }
  const bouncer = () => svg(420, 240,
    path('M120 14 H300', 'tb-ground') + path(Array.from({ length: 20 }, (z, k) => `M${124 + 9 * k} 14l-7 -9`).join(''), 'tb-hatch') +
    spring(210, 14, 82, 8, 8) + path('M210 82 V96', 'tb-line') + baby(24, 'ghost') + baby(0) + motion(290, 90, 290, 190),
    L('A baby in a bouncer, hanging from a spring; dashed, its lowest position', 'Ein Baby in einem Babyhopser, an einer Feder hängend; gestrichelt seine tiefste Lage'));

  // ---------------------------------------------------------------- the energy diagram of a spring
  // E_pot = ½·D·y² as a parabola from −A to A, the total energy E as a line, and at y = k·A the
  // split of E into E_pot (from the axis to the parabola) and E_kin (from the parabola to E).
  function energyWell(k) {
    const X = (u) => 210 + 150 * u, Y = (e) => 200 - 160 * e;
    let d = ''; for (let i = 0; i <= 60; i++) { const u = -1.05 + (2.1 * i) / 60; d += `${i ? 'L' : 'M'}${f(X(u))} ${f(Y(u * u))}`; }
    const x = X(k), ep = Y(k * k);
    return svg(420, 240,
      path(`M40 200 H392 M${X(0)} 214 V18`, 'tb-line') + path('M386 196 L394 200 L386 204', 'tb-line') + path(`M${X(0) - 4} 24 L${X(0)} 16 L${X(0) + 4} 24`, 'tb-line') +
      text(398, 216, '<tspan font-style="italic">y</tspan>', 'tb-axis', 'end') + text(X(0) + 8, 22, '<tspan font-style="italic">E</tspan>', 'tb-axis', 'start') +
      path(d, 'tb-curve') + line(X(-1), Y(1), X(1), Y(1), 'tb-eq') + text(X(1) + 6, Y(1) + 4, '<tspan font-style="italic">E</tspan>', 'tb-axis', 'start') +
      line(X(-1), 200, X(-1), Y(1), 'tb-eq') + line(X(1), 200, X(1), Y(1), 'tb-eq') + text(X(-1), 216, '−<tspan font-style="italic">A</tspan>', 'tb-axis') + text(X(1), 216, '<tspan font-style="italic">A</tspan>', 'tb-axis') +
      `<rect class="tb-epot" x="${f(x - 7)}" y="${f(ep)}" width="14" height="${f(200 - ep)}"/><rect class="tb-ekin" x="${f(x - 7)}" y="${f(Y(1))}" width="14" height="${f(ep - Y(1))}"/>` +
      text(x + 12, (ep + 200) / 2 + 4, '<tspan font-style="italic">E</tspan><tspan font-size="70%" dy="3">pot</tspan>', 'tb-axis', 'start') +
      text(x + 12, (ep + Y(1)) / 2 + 4, '<tspan font-style="italic">E</tspan><tspan font-size="70%" dy="3">kin</tspan>', 'tb-axis', 'start'),
      L('The potential energy of a spring as a parabola, the total energy as a line, and their split at the given displacement', 'Die potentielle Energie einer Feder als Parabel, die Gesamtenergie als Gerade, und ihre Aufteilung bei der gegebenen Auslenkung'));
  }

  // ---------------------------------------------------------------- salt on a loudspeaker
  // a loudspeaker on its back, its membrane up, grains of salt on it; dashed, the membrane at
  // its highest and lowest
  function salt() {
    const membrane = (dy, cls) => path(`M120 ${110 + dy} Q210 ${150 + dy} 300 ${110 + dy}`, cls);
    return svg(420, 240,
      path('M100 106 L320 106 L290 176 H130 Z', 'tb-cone') + `<rect class="tb-metal" x="170" y="176" width="80" height="36" rx="3"/>` + `<rect class="tb-magnet" x="180" y="212" width="60" height="10"/>` +
      membrane(-10, 'tb-ghost') + membrane(10, 'tb-ghost') + membrane(0, 'tb-membrane') +
      [[170, 112], [198, 96], [226, 104], [250, 90], [186, 82]].map(([x, y]) => `<rect class="tb-grain" x="${x - 2.5}" y="${y - 2.5}" width="5" height="5" transform="rotate(30 ${x} ${y})"/>`).join('') +
      motion(340, 92, 340, 136) + ground(40, 380, 222),
      L('A loudspeaker on its back with grains of salt on its membrane; dashed, the membrane at its highest and lowest', 'Ein Lautsprecher auf dem Rücken mit Salzkörnern auf der Membran; gestrichelt die Membran in ihrer höchsten und tiefsten Lage'));
  }

  // ---------------------------------------------------------------- the tide in a harbour
  // a quay wall with a tide gauge, the levels at high and low tide dashed, a boat on the water
  function tide(R, h) {
    const yh = 70, yl = 190, s = (yl - yh) / R, yb = yl - h * s;
    const { force } = root.Fig;
    let gauge = ''; for (let k = 0; k <= R; k++) gauge += `M300 ${f(yl - k * s)} h10`;
    return svg(430, 240,
      `<rect class="tb-water" x="0" y="${yh}" width="290" height="${240 - yh}"/>` + path(`M0 ${yh} H290`, 'tb-surface') +
      `<rect class="tb-concrete" x="290" y="30" width="140" height="210"/>` + path(gauge, 'tb-line') + path(`M300 ${yl} V${yh}`, 'tb-line') +
      line(10, yl, 290, yl, 'tb-eq') + line(150, yb, 290, yb, 'tb-eq') +
      root.Fig.dim([340, yl], [340, yh], root.Fig.sym('R'), 0) + root.Fig.dim([270, yl], [270, yb], root.Fig.sym('h'), -1) +
      text(14, yh - 8, L('high tide (now)', 'Flut (jetzt)'), 'tb-cap', 'start') + text(14, yl - 6, L('low tide', 'Ebbe'), 'tb-cap', 'start') +
      path(`M150 ${yh - 10} L250 ${yh - 10} L238 ${yh + 8} L162 ${yh + 8} Z`, 'tb-hull') + path(`M200 ${yh - 10} V${yh - 64}`, 'tb-line') + path(`M203 ${yh - 60} L203 ${yh - 14} L234 ${yh - 14} Z`, 'tb-sail'),
      L('A harbour at high tide: the water levels at high and low tide, and the level the boat needs', 'Ein Hafen bei Flut: die Wasserstände bei Flut und Ebbe, und der Stand, den das Boot braucht'));
  }

  // ---------------------------------------------------------------- a bouncing ball
  function ball() {
    const y0 = 210, top = 50, w = 70;
    let d = ''; for (let k = 0; k < 4; k++) { const x = 40 + 2 * w * k; d += `M${x} ${y0} Q${x + w} ${2 * top - y0} ${x + 2 * w} ${y0}`; }
    return svg(430, 240,
      ground(20, 420, y0 + 10) + path(d, 'tb-ghost') + circle(40 + w, top + 2, 10, 'tb-ballred') + line(40 + w, top, 400, top, 'tb-eq') +
      root.Fig.dim([400, y0 + 10], [400, top - 8], root.Fig.sym('h'), 0) + motion(40 + w + 20, top + 30, 40 + w + 20, top + 80),
      L('A ball bouncing on the floor; dashed, its path', 'Ein Ball hüpft auf dem Boden; gestrichelt seine Bahn'));
  }

  root.Figures = { fork, tower, atoms, bouncer, energyWell, salt, tide, ball };
})(typeof window !== 'undefined' ? window : globalThis);
