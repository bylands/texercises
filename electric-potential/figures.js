// The pictures of the problems of Electric Potential (realproblems.js), drawn with the shared
// figure kit (figkit.js).
//   PotFigures.<name>(args)  an SVG in a <div class="fig">
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
  const beam = (pts) => path(`M${pts.map((p) => p.join(' ')).join(' L')}`, 'ef-beam');

  const xray = () => svg(380, 200,
    path('M40 100 C40 40 340 40 340 100 C340 160 40 160 40 100 Z', 'tb-glass') + rect(60, 85, 26, 30, 'tb-dark', 3) + cap(73, 136, L('cathode', 'Kathode')) + path('M290 70 L320 70 L320 130 L270 130 Z', 'tb-metal') + cap(300, 150, L('anode', 'Anode')) +
    beam([[88, 100], [272, 100]]) + [0, 1, 2].map((k) => path(`M285 ${108 + k * 2} l${-20 + k * 20} 60`, 'ef-xray')).join('') + cap(190, 30, '− U +') + cap(250, 190, L('X-rays', 'Röntgenstrahlung')),
    L('An X-ray tube: electrons from the cathode hit the anode', 'Eine Röntgenröhre: Elektronen aus der Kathode treffen die Anode'));

  const gun = () => svg(380, 180,
    path('M20 90 L80 60 L360 60 L360 120 L80 120 Z', 'tb-glass') + rect(40, 80, 16, 20, 'tb-dark', 2) + rect(90, 70, 6, 40, 'tb-metal') + rect(100, 70, 6, 14, 'tb-metal') + rect(100, 96, 6, 14, 'tb-metal') + beam([[56, 90], [356, 90]]) +
    rect(355, 50, 8, 80, 'tb-green') + cap(359, 145, L('screen', 'Schirm')) + cap(80, 145, L('electron gun', 'Elektronenkanone')),
    L('An electron gun shooting electrons at a screen', 'Eine Elektronenkanone schiesst Elektronen auf einen Schirm'));

  const dawn = () => svg(380, 200,
    rect(150, 60, 90, 80, 'tb-metal', 6) + rect(40, 90, 110, 20, 'tb-blue') + rect(240, 90, 110, 20, 'tb-blue') + path('M175 140 L215 140 L222 160 L168 160 Z', 'tb-dark') +
    [-12, 0, 12].map((dx) => arrow(195 + dx, 164, 195 + dx * 2.2, 196, 'ef-ion')).join('') + arrow(195, 50, 195, 18, 'ef-arrow') + cap(214, 30, L('thrust', 'Schub'), 'start') + cap(260, 190, L('Xe⁺ ions', 'Xe⁺-Ionen'), 'start'),
    L('The ion thruster of a space probe: xenon ions shot out backwards push it forwards', 'Das Ionentriebwerk einer Raumsonde: Nach hinten ausgestossene Xenon-Ionen schieben sie vorwärts'));

  const therapy = () => svg(380, 200,
    path('M30 60 C30 20 120 20 120 60', 'tb-metal') + circle(75, 60, 40, 'tb-metal') + cap(75, 115, L('accelerator', 'Beschleuniger')) + beam([[115, 60], [250, 60], [270, 110]]) +
    rect(220, 120, 140, 18, 'tb-wood', 4) + path('M240 120 C240 100 300 100 330 112 L330 120 Z', 'tb-blue') + circle(282, 112, 6, 'ef-tumour') + cap(290, 158, L('patient', 'Patient')),
    L('Protons from an accelerator are aimed at a tumour', 'Protonen aus einem Beschleuniger werden auf einen Tumor gerichtet'));

  const vdg = () => svg(300, 230,
    rect(135, 90, 30, 120, 'tb-glass') + circle(150, 70, 50, 'tb-metal') + Fig.ground(60, 240, 210) + path('M192 40 l20 -8 l-8 14 l20 -6', 'ef-spark') + [0, 60, 120, 180, 240, 300].map((a) => { const t = (a * Math.PI) / 180; return sign(150 + 38 * Math.cos(t), 74 + 38 * Math.sin(t), '+'); }).join('') +
    Fig.dim([95, 70], [150, 70], 'R', 12) + cap(172, 180, L('insulating column', 'isolierende Säule'), 'start'),
    L('A Van de Graaff generator: a charged metal sphere on an insulating column', 'Ein Van-de-Graaff-Generator: eine geladene Metallkugel auf einer isolierenden Säule'));

  const nerve = () => svg(380, 200,
    rect(20, 80, 340, 40, 'ef-membrane') + cap(190, 104, L('membrane', 'Membran')) + cap(190, 40, L('outside', 'aussen')) + cap(190, 170, L('inside', 'innen')) +
    [60, 120, 250, 310].map((x) => sign(x, 72, '+') + sign(x, 140, '−')).join('') + arrow(120 + 60, 62, 180, 78, 'ef-field') + circle(330, 50, 7, 'ef-ion-c') + cap(330, 54, 'Na⁺'),
    L('The membrane of a nerve cell, positive outside and negative inside', 'Die Membran einer Nervenzelle, aussen positiv und innen negativ'));

  const tem = () => svg(260, 240,
    rect(100, 10, 60, 210, 'tb-metal', 6) + rect(110, 20, 40, 16, 'tb-dark', 3) + [70, 120, 170].map((y) => rect(92, y, 76, 14, 'tb-coil', 4)).join('') + beam([[130, 36], [130, 205]]) + rect(105, 205, 50, 8, 'tb-green') +
    cap(190, 30, L('electron gun', 'Elektronenkanone'), 'start') + cap(190, 130, L('magnetic lenses', 'magnetische Linsen'), 'start') + cap(190, 210, L('screen', 'Schirm'), 'start'),
    L('An electron microscope: an electron gun, lenses and a screen in a column', 'Ein Elektronenmikroskop: eine Elektronenkanone, Linsen und ein Schirm in einer Säule'));

  const rutherford = () => svg(380, 200,
    rect(20, 85, 40, 30, 'tb-dark', 4) + cap(40, 132, L('alpha source', 'Alphaquelle')) + rect(250, 30, 6, 140, 'ef-foil') + cap(253, 186, L('gold foil', 'Goldfolie')) +
    beam([[60, 100], [252, 100]]) + path('M60 95 L245 92 C250 92 252 80 330 40', 'ef-beam') + path('M60 105 L238 103 C246 100 246 100 70 140', 'ef-beam') + circle(252, 100, 3, 'tb-line-fill'),
    L("Rutherford's experiment: alpha particles hit a gold foil; a few bounce back", 'Rutherfords Versuch: Alphateilchen treffen eine Goldfolie; einige prallen zurück'));

  const api = { xray, gun, dawn, therapy, vdg, nerve, tem, rutherford };
  root.PotFigures = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
