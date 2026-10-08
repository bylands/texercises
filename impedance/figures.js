// The pictures of the problems (realproblems.js), in the manner of a physics textbook: thin even
// ink outlines and a few muted tints, drawn with the shared figure kit (figkit.js), following the
// dark mode. The coils of the devices are drawn in the colour of a current.
//   ImpFigures.<name>()  an SVG in a <div class="fig">
(function (root) {
  'use strict';

  const { svg, path, line, circle, rect, text, poly } = root.Fig;
  const L = (en, de) => (root.Lang ? root.Lang.L(en, de) : en);
  const cap = (x, y, s, anchor = 'middle') => text(x, y, s, 'tb-cap', anchor);
  // sound or field waves: arcs to the right of (x, y)
  const waves = (x, y, n = 3, h = 22) => Array.from({ length: n }, (z, k) => path(`M${x + 12 * k} ${y - h - 6 * k} q${10 + 4 * k} ${h + 6 * k} 0 ${2 * h + 12 * k}`, 'tb-sound')).join('');

  // ---------------------------------------------------------------- a loudspeaker, cut open
  const speaker = () => svg(380, 220,
    // the magnet with its pole piece, the voice coil in the gap
    rect(40, 78, 56, 74, 'tb-dark') + rect(96, 100, 14, 30, 'tb-metal') +
    rect(112, 96, 10, 38, 'tb-yellow') + path('M114 98 V132 M117 98 V132 M120 98 V132', 'tb-coil') +
    // the cone, the dust cap and the surround; the basket
    poly([[122, 96], [250, 34], [250, 196], [122, 134]], 'tb-body') + path('M122 96 Q146 115 122 134', 'tb-line') +
    path('M250 34 q10 -8 16 2 M250 196 q10 8 16 -2', 'tb-line') + path('M96 78 L250 26 M96 152 L250 204', 'tb-thin') +
    waves(290, 115, 3, 26) +
    cap(66, 170, L('magnet', 'Magnet')) + path('M112 186 L116 136', 'tb-thin') + cap(112, 198, L('voice coil', 'Schwingspule')) + cap(200, 216, L('cone', 'Membran')) + cap(262, 20, L('suspension', 'Aufhängung')),
    L('A loudspeaker cut open: the magnet, the voice coil in its gap, the cone on its suspension', 'Ein aufgeschnittener Lautsprecher: der Magnet, die Schwingspule in seinem Spalt, die Membran an ihrer Aufhängung'));

  // ---------------------------------------------------------------- an electric guitar and its cable
  const guitar = () => svg(420, 210,
    // the neck and the head
    rect(20, 92, 150, 18, 'tb-wood', 3) + rect(4, 86, 22, 30, 'tb-wood', 4) + [40, 70, 100, 130, 160].map((x) => line(x, 92, x, 110, 'tb-thin')).join('') +
    // the body with its pickups and the strings
    path('M160 72 C170 40 230 36 250 58 C268 50 300 52 300 82 C312 100 312 118 300 132 C300 162 266 166 250 150 C228 172 168 166 160 130 C150 118 150 86 160 72 Z', 'tb-red') +
    rect(196, 86, 14, 30, 'tb-dark', 3) + rect(226, 86, 14, 30, 'tb-dark', 3) + rect(262, 90, 16, 22, 'tb-metal', 2) +
    [96, 100, 104, 108].map((y) => line(26, y - 2, 270, y - 2, 'tb-thin')).join('') +
    // the cable from the jack to the amplifier
    circle(286, 140, 4, 'tb-metal') + path('M288 144 C300 196 352 196 360 160 S372 120 384 128', 'tb-wire') +
    rect(372, 118, 40, 56, 'tb-dark', 4) + circle(392, 150, 13, 'tb-metal') +
    cap(203, 64, L('pickups', 'Tonabnehmer')) + cap(330, 206, L('cable', 'Kabel')) + cap(392, 112, L('amplifier', 'Verstärker')),
    L('An electric guitar with its pickups, connected by a cable to an amplifier', 'Eine E-Gitarre mit ihren Tonabnehmern, mit einem Kabel an einen Verstärker angeschlossen'));

  // ---------------------------------------------------------------- an old radio
  const radio = () => svg(360, 220,
    line(300, 66, 340, 10, 'tb-wire') + circle(340, 10, 3, 'tb-line-fill') + waves(242, 34, 3, 12) +
    rect(40, 66, 280, 140, 'tb-wood', 14) +
    // the loudspeaker behind its grille, the dial and the tuning knob
    circle(110, 136, 46, 'tb-body') + [-30, -15, 0, 15, 30].map((d) => line(110 + d, 136 - Math.sqrt(46 * 46 - d * d) + 4, 110 + d, 136 + Math.sqrt(46 * 46 - d * d) - 4, 'tb-thin')).join('') +
    rect(176, 92, 120, 40, 'tb-lcd', 4) + [0, 1, 2, 3, 4, 5, 6].map((k) => line(186 + 16.5 * k, 96, 186 + 16.5 * k, 104, 'tb-thin')).join('') +
    line(236, 94, 236, 130, 'tb-coil') + text(236, 125, 'kHz', 'tb-cap') +
    circle(236, 170, 18, 'tb-metal') + line(236, 154, 236, 164, 'tb-line') +
    cap(236, 205, L('tuning knob: C', 'Drehknopf: C')),
    L('An old radio with its dial and its tuning knob, which turns a variable capacitor', 'Ein altes Radio mit seiner Skala und seinem Drehknopf, der einen Drehkondensator verstellt'));

  // ---------------------------------------------------------------- a wireless charger with a phone
  const charger = () => svg(380, 220,
    line(20, 176, 360, 176, 'tb-line') + rect(30, 176, 320, 14, 'tb-wood') +
    // the pad, cut open: its flat coil; the phone on top
    path('M90 176 L104 150 H276 L290 176 Z', 'tb-dark') +
    [0, 1, 2, 3, 4].map((k) => rect(130 + 6 * k, 158 + 0, 120 - 12 * k, 10, 'tb-coil', 4)).join('') +
    rect(116, 130, 148, 20, 'tb-dark', 6) + rect(124, 133, 132, 14, 'tb-glass', 3) +
    [0, 1, 2].map((k) => path(`M${150 - 24 * k} 150 C${150 - 24 * k} ${110 - 22 * k} ${230 + 24 * k} ${110 - 22 * k} ${230 + 24 * k} 150`, 'tb-current')).join('') +
    cap(190, 62, L('magnetic field', 'Magnetfeld')) + cap(190, 208, L('charging pad with its coil', 'Ladefläche mit ihrer Spule')) + cap(318, 138, L('phone', 'Handy')),
    L('A phone on a wireless charging pad; the coil in the pad and its magnetic field', 'Ein Handy auf einer kabellosen Ladefläche; die Spule in der Ladefläche und ihr Magnetfeld'));

  // ---------------------------------------------------------------- a body-fat scale
  const scale = () => svg(320, 250,
    root.Fig.person(160, 208, 0.9, { shirt: 'green' }) +
    rect(96, 208, 128, 16, 'tb-body', 6) + rect(104, 210, 34, 6, 'tb-metal', 2) + rect(182, 210, 34, 6, 'tb-metal', 2) +
    rect(144, 213, 32, 8, 'tb-lcd', 2) + line(20, 224, 300, 224, 'tb-line') +
    path('M121 206 C121 150 160 140 160 140 C160 140 199 150 199 206', 'tb-current') +
    cap(262, 200, L('electrodes', 'Elektroden')) + cap(160, 244, L('a tiny current through the legs', 'ein winziger Strom durch die Beine')),
    L('A person on a body-fat scale; a tiny current flows from one foot through the legs to the other', 'Eine Person auf einer Körperfettwaage; ein winziger Strom fliesst von einem Fuss durch die Beine zum anderen'));

  // ---------------------------------------------------------------- a metal detector over a coin
  const detector = () => svg(380, 220,
    // the ground and the coin in it
    rect(20, 160, 340, 50, 'tb-yellow') + path('M20 160 H360', 'tb-line') + path('M196 186 a18 5 0 1 0 0.1 0', 'tb-metal') +
    path('M178 186 a18 5 0 1 0 36 0', 'tb-line') +
    // the stick, the control box and the search coil
    line(70, 30, 170, 128, 'tb-wire') + rect(60, 30, 40, 24, 'tb-dark', 4) +
    path('M146 136 a50 9 0 1 0 100 0 a50 9 0 1 0 -100 0', 'tb-metal') + path('M150 136 a46 7 0 1 0 92 0 a46 7 0 1 0 -92 0', 'tb-coil') +
    // its magnetic field reaching the coin; the eddy currents in the coin
    [0, 1].map((k) => path(`M${160 - 14 * k} 140 C${160 - 14 * k} ${196 + 14 * k} ${232 + 14 * k} ${196 + 14 * k} ${232 + 14 * k} 140`, 'tb-current')).join('') +
    path('M186 179 a10 3 0 1 0 20 0', 'tb-coil') +
    cap(280, 120, L('search coil', 'Suchspule')) + cap(270, 196, L('coin', 'Münze')) + cap(80, 22, L('electronics', 'Elektronik')),
    L('A metal detector: its search coil above a coin in the ground', 'Ein Metalldetektor: seine Suchspule über einer Münze im Boden'));

  // ---------------------------------------------------------------- a speaker box with its tweeter
  const crossover = () => svg(360, 240,
    rect(60, 20, 140, 210, 'tb-wood', 6) +
    // the tweeter at the top, the woofer below
    circle(130, 62, 22, 'tb-dark') + circle(130, 62, 12, 'tb-body') +
    circle(130, 160, 52, 'tb-dark') + circle(130, 160, 40, 'tb-body') + circle(130, 160, 12, 'tb-dark') +
    // the capacitor in the line to the tweeter (seen through the box)
    path('M152 62 H250 V96 M250 120 V200 H170', 'tb-wire') + rect(240, 96, 20, 24, 'tb-blue', 4) + line(242, 104, 258, 104, 'tb-line') + line(242, 112, 258, 112, 'tb-line') +
    cap(130, 14, L('tweeter', 'Hochtöner')) + cap(130, 238, L('woofer', 'Tieftöner')) + cap(268, 104, 'C', 'start') + cap(268, 120, L('capacitor', 'Kondensator'), 'start'),
    L('A speaker box with a woofer and a tweeter; a capacitor in the line to the tweeter', 'Eine Lautsprecherbox mit einem Tieftöner und einem Hochtöner; ein Kondensator in der Leitung zum Hochtöner'));

  // ---------------------------------------------------------------- a contactless card over a reader
  const nfc = () => svg(380, 220,
    // the reader on the counter, its field
    rect(120, 160, 160, 40, 'tb-dark', 8) + rect(150, 168, 100, 12, 'tb-lcd', 2) + line(20, 200, 360, 200, 'tb-line') +
    [0, 1, 2].map((k) => path(`M${170 - 16 * k} 156 C${170 - 16 * k} ${120 - 12 * k} ${230 + 16 * k} ${120 - 12 * k} ${230 + 16 * k} 156`, 'tb-current')).join('') +
    // the card, tilted above it, with its coil and its chip
    `<g transform="rotate(-8 200 70)">${rect(120, 30, 160, 96, 'tb-blue', 8)}${[0, 1, 2].map((k) => rect(128 + 5 * k, 38 + 5 * k, 144 - 10 * k, 80 - 10 * k, 'tb-coil', 6)).join('')}${rect(146, 64, 26, 20, 'tb-yellow', 3)}</g>` +
    cap(300, 40, L('coil in the card', 'Spule in der Karte'), 'start') + cap(110, 78, L('chip', 'Chip'), 'end') + cap(200, 216, L('reader: 13.56 MHz', 'Lesegerät: 13.56 MHz')),
    L('A contactless card above a reader; the coil and the chip in the card', 'Eine kontaktlose Karte über einem Lesegerät; die Spule und der Chip in der Karte'));

  // ---------------------------------------------------------------- a quartz crystal
  const quartz = () => svg(380, 220,
    // the can on its leads, and the crystal inside, cut open
    rect(40, 50, 90, 110, 'tb-metal', 10) + line(68, 160, 68, 206, 'tb-wire') + line(102, 160, 102, 206, 'tb-wire') +
    path('M190 110 a70 26 0 1 0 140 0 a70 26 0 1 0 -140 0', 'tb-glass') + path('M220 110 a40 15 0 1 0 80 0 a40 15 0 1 0 -80 0', 'tb-metal') +
    path('M190 110 H170 V190 M330 110 H350 V190', 'tb-wire') +
    path('M215 136 q45 14 90 0', 'tb-sound') + path('M215 84 q45 -14 90 0', 'tb-sound') +
    cap(85, 40, L('the can', 'das Gehäuse')) + cap(260, 60, L('quartz disc', 'Quarzscheibe')) + cap(260, 162, L('electrodes on both faces', 'Elektroden auf beiden Seiten')),
    L('A quartz crystal: its metal can, and the quartz disc inside with an electrode on each face', 'Ein Schwingquarz: sein Metallgehäuse und darin die Quarzscheibe mit einer Elektrode auf jeder Seite'));

  root.ImpFigures = { speaker, guitar, radio, charger, scale, detector, crossover, nfc, quartz };
})(window);
