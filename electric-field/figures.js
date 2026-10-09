// The pictures of the problems of Electric Field (realproblems.js), in the manner of a physics
// textbook, drawn with the shared figure kit (figkit.js).
//   FieldFigures.<name>(args)  an SVG in a <div class="fig">
(function (root) {
  'use strict';

  const Fig = root.Fig || require('./figkit.js');
  const Lang = root.Lang || require('./lang.js');
  const { svg, path, line, circle, rect, text } = Fig;
  const L = (en, de) => Lang.L(en, de);
  const cap = (x, y, s, anchor = 'middle') => text(x, y, s, 'tb-cap', anchor);
  const f1 = (x) => Math.round(x * 10) / 10;
  const sign = (x, y, s) => `<text class="ef-sign" x="${x}" y="${y}" text-anchor="middle">${s}</text>`;
  function arrow(x1, y1, x2, y2, cls = 'ef-arrow') {
    const d = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / d, uy = (y2 - y1) / d, bx = x2 - 9 * ux, by = y2 - 9 * uy;
    return `<g class="${cls}"><line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(bx)}" y2="${f1(by)}"/><polygon points="${f1(x2)},${f1(y2)} ${f1(bx - 4 * uy)},${f1(by + 4 * ux)} ${f1(bx + 4 * uy)},${f1(by - 4 * ux)}"/></g>`;
  }

  const millikan = () => svg(360, 220,
    rect(60, 50, 220, 8, 'tb-metal') + rect(60, 160, 220, 8, 'tb-metal') + sign(48, 60, '+') + sign(48, 170, '−') +
    circle(170, 108, 6, 'ef-drop') + arrow(170, 100, 170, 72, 'ef-force') + arrow(170, 116, 170, 144, 'ef-weight') + text(178, 80, 'q·E', 'ef-lbl', 'start') + text(178, 140, 'm·g', 'ef-lbl', 'start') +
    rect(300, 90, 46, 18, 'tb-dark', 3) + path('M300 99 H290', 'tb-thin') + cap(323, 124, L('microscope', 'Mikroskop')) + cap(170, 200, L('an oil drop hovering between the plates', 'ein Öltröpfchen schwebt zwischen den Platten')),
    L('An oil drop hovering between two charged plates', 'Ein Öltröpfchen schwebt zwischen zwei geladenen Platten'));

  const inkjet = () => svg(400, 210,
    rect(14, 86, 40, 30, 'tb-dark', 4) + cap(34, 134, L('nozzle', 'Düse')) + rect(70, 82, 24, 8, 'tb-metal') + rect(70, 112, 24, 8, 'tb-metal') + cap(82, 74, L('charging', 'Aufladung')) +
    rect(130, 60, 120, 8, 'tb-metal') + rect(130, 134, 120, 8, 'tb-metal') + sign(120, 70, '+') + sign(120, 144, '−') +
    [64, 104, 140, 170, 200, 228].map((x, i) => circle(x, 101 - (i > 2 ? 2 * (i - 2) ** 2 : 0), 3, 'ef-drop')).join('') + path('M250 93 Q300 80 352 62', 'tb-thin') +
    rect(352, 30, 10, 150, 'tb-wood') + cap(357, 196, L('paper', 'Papier')) + cap(190, 166, L('deflecting plates', 'Ablenkplatten')),
    L('An inkjet: charged drops are deflected between two plates on their way to the paper', 'Ein Tintenstrahldrucker: Geladene Tropfen werden auf dem Weg zum Papier zwischen zwei Platten abgelenkt'));

  const cloud = () => svg(400, 220,
    path('M40 70 C30 40 80 25 110 40 C130 15 190 15 205 40 C230 25 290 30 290 60 C330 60 340 95 300 100 H60 C20 100 20 75 40 70 Z', 'ef-cloud') + [70, 120, 170, 220, 270].map((x) => sign(x, 92, '−')).join('') +
    [80, 140, 200, 260].map((x) => arrow(x, 180, x, 112, 'ef-field')).join('') + Fig.ground(10, 390, 190) + Fig.tree(340, 190, 46) + [80, 140, 200, 260].map((x) => sign(x + 18, 186, '+')).join('') +
    cap(320, 125, L('field', 'Feld'), 'start'),
    L('A thundercloud above the ground, with the field between them', 'Eine Gewitterwolke über dem Boden, mit dem Feld dazwischen'));

  const car = () => svg(400, 200,
    Fig.car(110, 165, 190, {}) + path('M250 10 L232 52 L248 52 L222 102 L238 102 L212 132', 'ef-bolt') + path('M214 132 C240 120 280 132 290 150 L300 165', 'ef-flow') + path('M130 132 C150 120 190 118 214 132', 'ef-flow') +
    Fig.ground(10, 390, 168) + cap(200, 192, L('the charge flows over the outside of the body into the ground', 'die Ladung fliesst über die Aussenseite der Karosserie in den Boden')),
    L('Lightning strikes a car; the charge flows round its metal body', 'Ein Blitz trifft ein Auto; die Ladung fliesst um seine Metallkarosserie'));

  const filter = () => svg(380, 230,
    rect(70, 20, 140, 190, 'tb-concrete') + rect(90, 30, 8, 170, 'tb-metal') + rect(182, 30, 8, 170, 'tb-metal') + sign(94, 22, '+') + sign(186, 22, '+') + line(140, 30, 140, 200, 'ef-wire') + sign(140, 22, '−') +
    [[120, 60], [160, 90], [115, 130], [165, 160], [125, 180]].map(([x, y]) => circle(x, y, 3, 'ef-dust')).join('') + arrow(115, 130, 102, 130, 'ef-force') + arrow(165, 160, 178, 160, 'ef-force') +
    arrow(140, 228, 140, 206, 'ef-arrow') + path('M190 60 H226', 'tb-thin') + cap(230, 64, L('collecting plates', 'Sammelplatten'), 'start') + path('M140 110 C180 110 200 120 226 120', 'tb-thin') + cap(230, 124, L('charging wire', 'Sprühdraht'), 'start') + cap(230, 214, L('dusty gas from below', 'staubiges Gas von unten'), 'start'),
    L('An electrostatic precipitator: charged dust is pulled onto the plates', 'Ein Elektrofilter: Geladener Staub wird auf die Platten gezogen'));

  const printer = () => svg(380, 200,
    circle(150, 100, 60, 'tb-metal') + [0, 1, 2, 3, 4, 5, 6, 7].map((k) => { const a = (k * Math.PI) / 4; return sign(150 + 48 * Math.cos(a), 105 + 48 * Math.sin(a), k === 1 || k === 2 ? '' : '−'); }).join('') +
    path('M60 20 L118 58', 'ef-laser') + cap(54, 16, L('laser', 'Laser'), 'end') + rect(40, 150, 60, 30, 'tb-dark', 4) + cap(70, 196, L('toner', 'Toner')) +
    rect(200, 156, 170, 6, 'tb-wood') + [230, 260, 290, 320].map((x) => sign(x, 176, '+')).join('') + cap(300, 150, L('paper', 'Papier')) + cap(150, 100, L('drum', 'Trommel')),
    L('A laser printer: a charged drum, the laser, the toner and the paper', 'Ein Laserdrucker: eine geladene Trommel, der Laser, der Toner und das Papier'));

  const water = ({ sign: s }) => svg(360, 230,
    rect(90, 10, 60, 20, 'tb-metal', 4) + path('M120 30 C120 90 124 140 150 210', 'ef-water') + rect(170, 120, 150, 14, s > 0 ? 'tb-red' : 'tb-blue', 6) +
    [190, 220, 250, 280].map((x) => sign(x, 131, s > 0 ? '+' : '−')).join('') + cap(250, 156, L('charged rod', 'geladener Stab')) + cap(120, 224, L('jet of water', 'Wasserstrahl')),
    L('A jet of water bending towards a charged rod', 'Ein Wasserstrahl biegt sich zu einem geladenen Stab'));

  const api = { millikan, inkjet, cloud, car, filter, printer, water };
  root.FieldFigures = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
