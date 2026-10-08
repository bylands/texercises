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
  const wave = (x, y0, a, lam, ph) => y0 - a * Math.cos((2 * Math.PI * (x - ph)) / lam);

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

  // ---------------------------------------------------------------- boat on waves
  function boatAt(x, y, cls) {
    // a small sailing boat, its waterline at (x, y)
    const hull = `M${x - 40} ${y - 10} L${x + 42} ${y - 10} L${x + 30} ${y + 6} L${x - 30} ${y + 6} Z`;
    const mast = `M${x} ${y - 10} V${y - 74}`, sail = `M${x + 3} ${y - 70} L${x + 3} ${y - 14} L${x + 36} ${y - 14} Z`, jib = `M${x - 3} ${y - 66} L${x - 3} ${y - 14} L${x - 30} ${y - 14} Z`;
    return cls === 'ghost' ? path(`${hull}${mast}${sail}${jib}`, 'tb-ghost')
      : path(sail, 'tb-sail') + path(jib, 'tb-sail') + path(mast, 'tb-line') + path(hull, 'tb-hull') + path(`M${x - 38} ${y - 6} H${x + 39}`, 'tb-trim');
  }
  function boat() {
    const y0 = 150, a = 16, lam = 220, ph = 140;
    const pts = []; for (let x = 0; x <= 420; x += 4) pts.push(`${x},${f(wave(x, y0, a, lam, ph))}`);
    const water = `M0 220 L${pts.join(' L')} L420 220 Z`;
    const crest = y0 - a, trough = y0 + a;
    return svg(420, 240,
      boatAt(140, crest + 2) + path(water, 'tb-water') + path(`M${pts.join(' L')}`, 'tb-surface') +
      line(20, crest, 400, crest, 'tb-eq') + line(20, trough, 400, trough, 'tb-eq') +
      boatAt(250, trough, 'ghost') +
      motion(345, crest - 2, 345, trough + 2),
      L('A sailing boat on a wave crest; dashed, the same boat in the trough', 'Ein Segelboot auf einem Wellenberg; gestrichelt dasselbe Boot im Wellental'));
  }

  // ---------------------------------------------------------------- car on its springs
  function carBody(dy, cls) {
    const y = (v) => f(v + dy);
    const d = `M60 ${y(150)} L60 ${y(126)} Q62 ${y(116)} 76 ${y(114)} L128 ${y(110)} L162 ${y(80)} Q168 ${y(76)} 178 ${y(76)} L262 ${y(76)} Q272 ${y(76)} 280 ${y(84)} L310 ${y(110)} L346 ${y(114)} Q360 ${y(118)} 362 ${y(130)} L362 ${y(150)} ` +
      `L330 ${y(150)} A28 28 0 0 0 274 ${y(150)} L146 ${y(150)} A28 28 0 0 0 90 ${y(150)} Z`;
    if (cls === 'ghost') return path(d, 'tb-ghost');
    const glass = `M140 ${y(110)} L168 ${y(84)} L212 ${y(84)} L212 ${y(110)} Z M220 ${y(110)} L220 ${y(84)} L268 ${y(84)} L292 ${y(110)} Z`;
    return path(d, 'tb-body') + path(glass, 'tb-glass') + path(`M216 ${y(112)} V${y(146)} M64 ${y(132)} H90 M330 ${y(132)} H358`, 'tb-trim');
  }
  function car() {
    const wheel = (x) => circle(x, 178, 24, 'tb-tyre') + circle(x, 178, 13, 'tb-metal') + circle(x, 178, 3, 'tb-line-fill');
    return svg(420, 240,
      ground(20, 400, 202) +
      carBody(-10, 'ghost') +
      spring(118, 124, 172, 5, 7) + spring(302, 124, 172, 5, 7) +
      carBody(0) + wheel(118) + wheel(302) +
      motion(392, 70, 392, 130),
      L('A car whose body bounces on its springs', 'Ein Auto, dessen Karosserie auf den Federn auf und ab federt'));
  }


  // ---------------------------------------------------------------- loudspeaker (cross-section)
  function speakerCone(dx, cls) {
    const x = (v) => f(v + dx);
    const cone = `M${x(196)} 104 L${x(262)} 46 M${x(196)} 136 L${x(262)} 194`;
    if (cls === 'ghost') return path(`${cone} M${x(196)} 104 V136`, 'tb-ghost');
    return path(`M${x(196)} 104 L${x(262)} 46 L${x(262)} 194 L${x(196)} 136 Z`, 'tb-cone') + path(`M${x(196)} 106 Q${x(208)} 120 ${x(196)} 134`, 'tb-body') +
      path(`M${x(262)} 46 q8 -6 12 2 M${x(262)} 194 q8 6 12 -2`, 'tb-line');
  }
  const speaker = () => svg(420, 240,
    `<rect class="tb-metal" x="120" y="86" width="40" height="68" rx="3"/><rect class="tb-magnet" x="160" y="92" width="14" height="56"/>` +
    `<rect class="tb-coil" x="174" y="104" width="22" height="32"/>` +
    path('M174 92 L270 36 M174 148 L270 204', 'tb-frame') +
    speakerCone(12, 'ghost') + speakerCone(0) +
    motion(214, 214, 254, 214) +
    [0, 1, 2].map((k) => path(`M${300 + 14 * k} ${84 - 8 * k} q${12 + 4 * k} ${36 + 8 * k} 0 ${72 + 16 * k}`, 'tb-sound')).join(''),
    L('A loudspeaker in cross-section: magnet, coil and cone; dashed, the cone pushed forward', 'Ein Lautsprecher im Querschnitt: Magnet, Spule und Membran; gestrichelt die nach vorne geschobene Membran'));

  // ---------------------------------------------------------------- toothbrush
  function brushHead(dy, cls) {
    const y = (v) => f(v + dy);
    const neck = `M250 ${y(126)} Q290 ${y(120)} 318 ${y(118)} L350 ${y(117)} Q360 ${y(117)} 360 ${y(124)} Q360 ${y(131)} 350 ${y(131)} L318 ${y(132)} Q290 ${y(134)} 250 ${y(136)}`;
    if (cls === 'ghost') return path(`${neck} M322 ${y(118)} V${y(98)} H356 V${y(118)}`, 'tb-ghost');
    let b = ''; for (let x = 324; x <= 354; x += 4) b += `M${x} ${y(117)} V${y(99)}`;
    return path(neck, 'tb-metal') + path(b, 'tb-bristle');
  }
  const brush = () => svg(420, 240,
    brushHead(-12, 'ghost') +
    path('M60 118 Q60 108 74 108 L240 116 Q256 117 256 131 Q256 145 240 146 L74 154 Q60 154 60 144 Z', 'tb-body') +
    `<rect class="tb-button" x="150" y="122" width="26" height="14" rx="7"/>` + path('M96 112 V150', 'tb-trim') +
    brushHead(0) + motion(380, 92, 380, 132),
    L('An electric toothbrush; dashed, its head in the highest position', 'Eine elektrische Zahnbürste; gestrichelt ihr Kopf in der höchsten Lage'));

  // ---------------------------------------------------------------- hummingbird
  const wing = (down) => (down
    ? 'M212 120 Q236 150 226 206 Q212 178 196 128 Z'
    : 'M212 116 Q232 70 220 22 Q204 56 194 112 Z');
  const bird = () => svg(420, 240,
    path(wing(true), 'tb-ghost') +
    path('M168 132 L128 160 L136 142 L122 138 Z', 'tb-feather') +
    path('M160 132 Q170 108 206 106 Q232 106 246 116 Q252 130 236 140 Q206 154 172 146 Q160 142 160 132 Z', 'tb-bird') +
    circle(246, 108, 13, 'tb-bird') + path('M258 106 L320 96 L258 112 Z', 'tb-line-fill') + circle(250, 105, 2.2, 'tb-eye') +
    path('M190 140 Q206 150 224 138', 'tb-trim') + path(wing(false), 'tb-wing') +
    motion(150, 34, 150, 196),
    L('A hovering hummingbird with its wing up; dashed, the wing down', 'Ein schwebender Kolibri mit erhobenem Flügel; gestrichelt der gesenkte Flügel'));

  // ---------------------------------------------------------------- sewing machine needle
  function needleBar(dy, cls) {
    const y = (v) => f(v + dy);
    if (cls === 'ghost') return path(`M206 ${y(84)} V${y(150)} M210 ${y(150)} V${y(182)}`, 'tb-ghost');
    return `<rect class="tb-metal" x="202" y="${y(70)}" width="12" height="70" rx="2"/>` + `<rect class="tb-metal" x="200" y="${y(136)}" width="16" height="12" rx="2"/>` +
      path(`M208 ${y(148)} L208 ${y(184)} L207 ${y(190)} L209 ${y(190)} L208 ${y(184)}`, 'tb-needle') + `<ellipse class="tb-eye-hole" cx="208" cy="${y(178)}" rx="1" ry="3"/>`;
  }
  const needle = () => svg(420, 240,
    path('M80 30 H330 Q346 30 346 46 V70 H80 Z', 'tb-body') + path('M60 214 H380 V226 H60 Z', 'tb-body') +
    needleBar(-30, 'ghost') + needleBar(0) +
    `<rect class="tb-metal" x="186" y="196" width="44" height="6" rx="2"/>` + path('M120 208 H300', 'tb-cloth') + path('M120 204 H300 V210 H120 Z', 'tb-fabric') +
    motion(250, 92, 250, 182),
    L('The needle of a sewing machine above the cloth; dashed, its highest position', 'Die Nadel einer Nähmaschine über dem Stoff; gestrichelt ihre höchste Lage'));

  // ---------------------------------------------------------------- house in an earthquake
  function house(dx, cls) {
    const x = (v) => f(v + dx);
    const walls = `M${x(150)} 180 V110 H${x(270)} V180 Z`, roof = `M${x(138)} 112 L${x(210)} 56 L${x(282)} 112 Z`;
    if (cls === 'ghost') return path(walls + roof, 'tb-ghost');
    return path(walls, 'tb-wall') + path(roof, 'tb-roof') + `<rect class="tb-glass" x="${x(166)}" y="124" width="30" height="26"/><rect class="tb-glass" x="${x(224)}" y="124" width="30" height="26"/>` +
      `<rect class="tb-door" x="${x(198)}" y="146" width="24" height="34"/>` + path(`M${x(181)} 124 V150 M${x(166)} 137 H${x(196)} M${x(239)} 124 V150 M${x(224)} 137 H${x(254)}`, 'tb-trim');
  }
  const quake = () => svg(420, 240, house(-14, 'ghost') + house(14, 'ghost') + ground(40, 380, 180) + house(0) + motion(150, 206, 270, 206),
    L('A house on shaking ground; dashed, its extreme positions', 'Ein Haus auf schwankendem Boden; gestrichelt seine äussersten Lagen'));

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

  root.Figures = { fork, boat, car, speaker, brush, bird, needle, quake, tower, atoms, bouncer, energyWell };
})(typeof window !== 'undefined' ? window : globalThis);
