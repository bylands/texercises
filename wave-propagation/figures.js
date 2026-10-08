// The pictures of the problems (realproblems.js), in the manner of a physics textbook, drawn with
// the shared figure kit (figkit.js); the crests are drawn in the colour of the app's curves.
//   WaveFigures.<name>()  an SVG in a <div class="fig">
(function (root) {
  'use strict';

  const { svg, path, line, circle, rect, text } = root.Fig;
  const L = (en, de) => (root.Lang ? root.Lang.L(en, de) : en);
  const cap = (x, y, s, anchor = 'middle') => text(x, y, s, 'tb-cap', anchor);
  // a rope from (x0, y) to (x1, y) with a crest of height h around xc, width w
  const ropeWith = (x0, x1, y, xc, w, h) => {
    let d = `M${x0} ${y}`;
    for (let x = x0; x <= x1; x += 2) { const u = (x - xc) / w; d += ` L${x} ${(y - (Math.abs(u) < 0.5 ? h * Math.cos(Math.PI * u) ** 2 : 0)).toFixed(1)}`; }
    return path(d, 'wv-rope');
  };
  const arrowR = (x, y, len, dir = 1) => path(`M${x} ${y} h${dir * len}`, 'wv-arrow') + path(`M${x + dir * (len + 6)} ${y} l${-dir * 9} -4 v8 z`, 'wv-arrowhead');

  // ---------------------------------------------------------------- the cable tester
  const cable = () => svg(400, 210,
    rect(20, 40, 110, 76, 'tb-dark', 6) + rect(31, 50, 88, 46, 'tb-lcd', 3) +
    path('M37 84 h10 q5 -24 10 0 h30 q5 12 10 0 h20', 'tb-line') + circle(116, 106, 4, 'tb-metal') +
    root.Fig.ground(20, 390, 128) +
    path('M116 110 C140 110 150 128 150 160 H360', 'tb-wire') + path('M306 152 l6 8 l6 -8', 'tb-line') + cap(312, 146, L('fault', 'Fehler')) +
    arrowR(200, 172, 40) + arrowR(280, 186, 40, -1) +
    cap(75, 32, L('cable tester', 'Kabeltester')) + cap(250, 206, L('buried cable', 'vergrabenes Kabel')),
    L('A cable tester sends a pulse into a buried cable; the echo comes back from the fault', 'Ein Kabeltester schickt einen Puls in ein vergrabenes Kabel; das Echo kommt vom Fehler zurück'));

  // ---------------------------------------------------------------- a rope on a wall, or on a ring
  const ropeScene = (ring) => svg(420, 210,
    root.Fig.person(50, 190, 1.4, { shirt: 'blue', hands: [[78, 128], [78, 132]] }) + line(10, 190, 410, 190, 'tb-line') +
    ropeWith(80, 360, 130, 150, 60, 26) + arrowR(140, 86, 34) +
    (ring ? rect(368, 38, 8, 152, 'tb-metal', 3) + `<ellipse class="tb-line" cx="372" cy="130" rx="9" ry="5"/>` + path('M360 130 H364', 'wv-rope')
      : rect(362, 30, 30, 160, 'tb-hatch') + line(362, 30, 362, 190, 'tb-line') + circle(360, 130, 3, 'tb-line-fill')) +
    cap(410, 22, ring ? L('ring on a pole', 'Ring an einer Stange') : L('wall', 'Wand'), 'end'),
    ring ? L('A person flicks a rope tied to a ring on a smooth pole', 'Eine Person schlägt ein Seil, das an einem Ring an einer glatten Stange befestigt ist') : L('A person flicks a rope tied to a wall', 'Eine Person schlägt ein Seil, das an einer Wand befestigt ist'));

  // ---------------------------------------------------------------- the harbour wall
  const harbour = () => svg(420, 210,
    rect(330, 40, 70, 160, 'tb-concrete') + line(330, 40, 330, 200, 'tb-line') +
    path('M10 150 H120 C150 150 160 110 190 110 C220 110 230 150 260 150 H330 V200 H10 Z', 'tb-water') + path('M10 150 H120 C150 150 160 110 190 110 C220 110 230 150 260 150 H330', 'tb-surface') +
    arrowR(170, 92, 40) + path('M318 140 q8 -40 4 -70 M326 140 q4 -30 -2 -50', 'tb-sound') +
    cap(365, 30, L('harbour wall', 'Hafenmauer')) + cap(190, 196, L('a single wave crest', 'ein einzelner Wellenberg')),
    L('A wave crest runs towards a vertical harbour wall', 'Ein Wellenberg läuft auf eine senkrechte Hafenmauer zu'));

  // ---------------------------------------------------------------- the stadium wave
  const stadium = () => {
    let people = '';
    for (let i = 0; i < 9; i++) {
      const x = 36 + 42 * i, u = (x - 222) / 84, up = Math.abs(u) < 0.5 ? Math.cos(Math.PI * u) ** 2 : 0, shirt = ['red', 'blue', 'green', 'orange', 'purple'][i % 5];
      // seated on the bench, or standing with the arms up (the wave), or half way
      people += up > 0.6 ? root.Fig.person(x, 176, 1.05, { shirt, hands: [[x - 9, 92], [x + 9, 92]] })
        : up > 0.2 ? root.Fig.person(x, 176, 1.05, { shirt, knee: 8, hands: [[x - 10, 118], [x + 10, 118]] })
          : root.Fig.person(x - 12, 152, 1.05, { shirt, sit: true });
    }
    return svg(420, 210, rect(10, 150, 400, 8, 'tb-wood') + line(10, 176, 410, 176, 'tb-line') + people + arrowR(250, 34, 50) + cap(275, 24, L('the wave', 'die Welle')) + cap(210, 200, L('each spectator stands up and sits down again', 'jeder Zuschauer steht auf und setzt sich wieder')),
      L('Spectators on a bench: those in the middle stand up with their arms raised, the wave runs to the right', 'Zuschauer auf einer Bank: die in der Mitte stehen mit erhobenen Armen auf, die Welle läuft nach rechts'));
  };

  // ---------------------------------------------------------------- the stop-and-go wave
  const traffic = () => {
    let cars = '';
    const xs = [20, 70, 120, 160, 190, 215, 240, 265, 300, 350];
    xs.forEach((x) => { cars += root.Fig.car(x, 140, 30, {}); });
    return svg(420, 200, rect(0, 140, 420, 30, 'tb-concrete') + path('M0 155 H420', 'tb-thin') + cars +
      arrowR(30, 100, 50) + cap(60, 90, L('the cars', 'die Autos')) + arrowR(260, 100, 50, -1) + cap(232, 90, L('the jam', 'der Stau')) +
      cap(210, 192, L('dense here: the cars crawl', 'hier dicht: die Autos kriechen')),
      L('Cars on a motorway, bunched up in a jam; the cars drive to the right, the jam moves to the left', 'Autos auf einer Autobahn, in einem Stau gedrängt; die Autos fahren nach rechts, der Stau wandert nach links'));
  };

  // ---------------------------------------------------------------- two pulses on a slinky
  const slinky = () => {
    let coils = '';
    for (let x = 70; x <= 350; x += 5) {
      const up = 22 * Math.max(0, Math.cos(Math.PI * (x - 140) / 50)) * (Math.abs(x - 140) < 25 ? 1 : 0), dn = 22 * (Math.abs(x - 280) < 25 ? Math.cos(Math.PI * (x - 280) / 50) : 0);
      coils += `<ellipse class="tb-thin" cx="${x}" cy="${(120 - up + dn).toFixed(1)}" rx="2.4" ry="9"/>`;
    }
    return svg(420, 210, line(10, 190, 410, 190, 'tb-line') + root.Fig.person(40, 190, 1.3, { shirt: 'red', hands: [[66, 122], [66, 118]] }) + root.Fig.person(380, 190, 1.3, { shirt: 'blue', dir: -1, hands: [[354, 122], [354, 118]] }) +
      coils + arrowR(130, 74, 30) + arrowR(292, 168, 30, -1) + cap(210, 206, L('a long slinky on the floor', 'eine lange Feder auf dem Boden')),
      L('Two students send pulses towards each other along a slinky, one up and one down', 'Zwei Schüler schicken Pulse entlang einer Feder aufeinander zu, einen nach oben und einen nach unten'));
  };

  root.WaveFigures = { cable, wall: () => ropeScene(false), ring: () => ropeScene(true), harbour, stadium, traffic, slinky };
})(window);
