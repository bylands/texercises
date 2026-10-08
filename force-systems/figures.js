// The pictures of the problems (realproblems.js), as in a physics textbook, drawn with the shared
// figure kit (figkit.js): the situation, its velocity (blue) and acceleration (purple) as arrows,
// and the lengths of slopes and ropes as dimension lines. The forces belong to the solution
// (realpictures.js draws them). ForceFigures[id](p) gives the SVG.
(function (root) {
  'use strict';

  const F = () => root.Fig;
  const L = (en, de) => root.FS.L(en, de);
  const f = (x) => Math.round(x * 10) / 10;
  const vel = (a, dir, len, off = [8, 0]) => F().force(a, dir, len, F().sym('v'), off, 'v');
  const accel = (a, dir, len, off = [8, 0]) => F().force(a, dir, len, F().sym('a'), off, 'a');
  // a group turned by deg about (x, y)
  const turn = (deg, x, y, body) => `<g transform="rotate(${f(deg)} ${f(x)} ${f(y)})">${body}</g>`;

  // ---------------------------------------------------------------- 1 a scale in a lift
  function scale(p) {
    const { svg, rect, path, person, line } = F();
    const up = { upStart: [1, 1], upStop: [1, -1], downStart: [-1, -1], downStop: [-1, 1] }[p.ph]; // [v, a]: +1 up
    return svg(420, 260,
      path('M210 0 V24', 'tb-rope') + rect(120, 24, 180, 220, 'tb-cabin', 4) + rect(132, 36, 156, 196, 'tb-cabin-in') +
      rect(170, 214, 80, 12, 'tb-metal', 3) + person(210, 214, 1.55, { shirt: 'blue', hands: [[194, 160], [226, 160]] }) +
      line(120, 244, 300, 244, 'tb-line') +
      vel([340, 130], [0, -up[0]], 50, [8, up[0] > 0 ? 10 : -6]) + accel([380, 130], [0, -up[1]], 40, [8, up[1] > 0 ? 10 : -6]),
      L('A person on a bathroom scale in a lift, with the lift’s velocity and acceleration', 'Eine Person auf einer Personenwaage im Lift, mit Geschwindigkeit und Beschleunigung des Lifts'));
  }

  // ---------------------------------------------------------------- 2 a crane lifts a container
  function crane() {
    const { svg, rect, path, ground } = F();
    let lat = ''; for (let x = 100; x < 330; x += 16) lat += `M${x} 30 L${x + 8} 40 L${x + 16} 30`;
    return svg(420, 250,
      ground(0, 420, 222) + path('M60 222 V30 M76 222 V30 M60 30 H340 M60 40 H330', 'tb-line') + path(lat, 'tb-thin') +
      path('M290 40 V100', 'tb-rope') + path('M282 100 h16 M290 100 l-40 12 M290 100 l40 12', 'tb-rope') +
      rect(240, 112, 100, 44, 'tb-blue', 2) + path('M258 116 V152 M276 116 V152 M294 116 V152 M312 116 V152', 'tb-trim') +
      accel([370, 160], [0, -1], 46),
      L('A crane lifting a container on its cable', 'Ein Kran hebt einen Container an seinem Seil'));
  }

  // ---------------------------------------------------------------- 3 a crate on a truck
  function truck() {
    const { svg, rect, path, ground, wheel } = F();
    return svg(420, 220,
      ground(0, 420, 190) + rect(40, 138, 250, 22, 'tb-metal', 2) + path('M290 160 V96 Q290 88 298 88 H330 L358 120 V160 Z', 'tb-yellow') + path('M300 96 H328 L348 120 H300 Z', 'tb-glass') +
      rect(40, 160, 318, 8, 'tb-dark', 2) + wheel(80, 172, 18) + wheel(120, 172, 18) + wheel(320, 172, 18) +
      rect(120, 98, 50, 40, 'tb-wood', 2) + path('M120 118 H170 M145 98 V138', 'tb-trim') +
      accel([300, 60], [1, 0], 50, [6, -8]),
      L('A crate standing on the platform of a truck that drives off', 'Eine Kiste steht auf der Ladefläche eines anfahrenden Lastwagens'));
  }

  // ---------------------------------------------------------------- 4 emergency braking
  function braking() {
    const { svg, car, ground } = F();
    return svg(420, 200, ground(0, 420, 170) + car(100, 170, 200) + vel([250, 40], [1, 0], 56, [6, -8]) + accel([290, 70], [-1, 0], 44, [-8, -8]),
      L('A braking car: velocity forwards, acceleration backwards', 'Ein bremsendes Auto: Geschwindigkeit nach vorne, Beschleunigung nach hinten'));
  }

  // ---------------------------------------------------------------- 5 towing a car
  function tow() {
    const { svg, car, ground, line } = F();
    return svg(430, 200, ground(0, 430, 170) + car(20, 170, 160, { cls: 'tb-faintfill' }) + line(176, 150, 236, 150, 'tb-rope') + car(234, 170, 160) + accel([330, 70], [1, 0], 50, [6, -8]),
      L('A car towing a broken-down car on a tow rope', 'Ein Auto schleppt ein Pannenfahrzeug an einem Abschleppseil'));
  }

  // ---------------------------------------------------------------- 6 a freight train
  function train(p) {
    const { svg, rect, path, ground, wheel, text } = F();
    const wagon = (x) => rect(x, 120, 70, 40, 'tb-metal', 2) + wheel(x + 15, 166, 8) + wheel(x + 55, 166, 8) + path(`M${x + 70} 150 h10`, 'tb-line');
    return svg(430, 220,
      ground(0, 430, 176) + path('M0 174 H430', 'tb-thin') + wagon(10) + wagon(90) + text(186, 146, '…', 'tb-label') + wagon(206) +
      rect(286, 100, 120, 60, 'tb-red', 3) + rect(366, 76, 40, 32, 'tb-red', 2) + rect(372, 82, 26, 18, 'tb-glass') + wheel(306, 166, 10) + wheel(346, 166, 10) + wheel(386, 166, 10) +
      text(120, 104, L(`${p.n} wagons`, `${p.n} Wagen`), 'tb-cap') + accel([300, 60], [1, 0], 50, [6, -8]),
      L('A locomotive pulling a row of freight wagons', 'Eine Lokomotive zieht eine Reihe von Güterwagen'));
  }

  // ---------------------------------------------------------------- 7 a skydiver
  function skydiver() {
    const { svg, path, person } = F();
    let lines = ''; for (const x of [130, 170, 250, 290]) lines += `M${x} 74 L${x < 210 ? 200 : 220} 160`;
    return svg(420, 260,
      path('M110 80 Q210 -10 310 80 Q290 66 270 74 Q240 60 210 66 Q180 60 150 74 Q130 66 110 80 Z', 'tb-canopy') + path(lines, 'tb-thin') +
      person(210, 236, 1.1, { shirt: 'orange', hands: [[198, 160], [222, 160]] }) +
      vel([360, 90], [0, 1], 60, [10, 6]),
      L('A skydiver hanging on her opened parachute', 'Eine Fallschirmspringerin hängt an ihrem geöffneten Schirm'));
  }

  // ---------------------------------------------------------------- 8 a rocket lifts off
  function rocket() {
    const { svg, path, rect, ground, circle } = F();
    let lat = ''; for (let y = 210; y > 40; y -= 16) lat += `M70 ${y} L86 ${y - 16} M70 ${y} H86`;
    return svg(420, 250,
      ground(0, 420, 222) + path('M70 222 V36 M86 222 V36', 'tb-line') + path(lat, 'tb-thin') + path('M86 90 H170 M86 150 H170', 'tb-line') +
      path('M210 20 Q236 46 236 90 V180 H184 V90 Q184 46 210 20 Z', 'tb-rocket') + path('M184 150 L164 196 H184 Z M236 150 L256 196 H236 Z', 'tb-red') + circle(210, 80, 9, 'tb-glass') +
      rect(196, 180, 28, 10, 'tb-dark') + path('M198 190 Q210 240 222 190 Z', 'tb-flame') +
      accel([300, 150], [0, -1], 60, [10, 4]),
      L('A rocket lifting off from its pad', 'Eine Rakete hebt von ihrer Startrampe ab'));
  }

  // ---------------------------------------------------------------- 9 parked on a ramp
  function parking(p) {
    const { svg, poly, car, dim, sym } = F();
    const a = Math.atan2(p.h, p.run), o = [30, 220], L0 = 360, top = [o[0] + L0 * Math.cos(a), o[1] - L0 * Math.sin(a)];
    return svg(430, 250,
      poly([o, top, [top[0], o[1]]], 'tb-concrete') +
      turn(-(a * 180) / Math.PI, o[0], o[1], car(o[0] + 110, o[1], 150)) +
      dim(o, top, sym('ℓ'), -22) + dim([top[0] + 6, o[1]], [top[0] + 6, top[1]], sym('h'), 0),
      L('A car parked on a ramp that rises h over the length ℓ', 'Ein Auto auf einer Rampe, die auf der Länge ℓ um h steigt'));
  }

  // ---------------------------------------------------------------- 10 down the piste
  function skier(p) {
    const { svg, poly, person, dim, sym, line } = F();
    const a = Math.atan2(p.h, p.run), o = [30, 40], L0 = 360, bot = [o[0] + L0 * Math.cos(a), o[1] + L0 * Math.sin(a)];
    const at = [o[0] + 150 * Math.cos(a), o[1] + 150 * Math.sin(a)], u = [Math.cos(a), Math.sin(a)];
    return svg(430, 250,
      poly([o, bot, [o[0], bot[1]]], 'tb-snowfill') +
      turn((a * 180) / Math.PI, at[0], at[1], person(at[0], at[1] - 3, 1, { shirt: 'red', knee: 6, lean: 6, hands: [[at[0] - 14, at[1] - 34], [at[0] + 18, at[1] - 34]] }) + line(at[0] - 26, at[1] - 2, at[0] + 30, at[1] - 2, 'tb-ski')) +
      vel([at[0] + 50 * u[0] - 10, at[1] + 50 * u[1] - 40], u, 50, [6, 10]) +
      dim(o, bot, sym('ℓ'), -24) + dim([o[0] - 6, o[1]], [o[0] - 6, bot[1]], sym('h'), -1),
      L('A skier gliding down a piste that drops h over the length ℓ', 'Ein Skifahrer gleitet eine Piste hinunter, die auf der Länge ℓ um h abfällt'));
  }

  // ---------------------------------------------------------------- 11 pulling a sled
  function sled() {
    const { svg, path, rect, person, dim, ground, text, line } = F();
    const tie = [170, 168], hand = [320, 108];
    return svg(430, 240,
      ground(0, 430, 200) + path('M60 196 H200 Q214 196 214 184', 'tb-runner') + rect(70, 168, 110, 14, 'tb-wood', 3) + path('M90 182 V196 M160 182 V196', 'tb-line') +
      person(110, 168, 0.7, { shirt: 'green', hands: [[100, 140], [124, 140]] }) +
      line(tie[0], tie[1], hand[0], hand[1], 'tb-rope') + person(330, 200, 1.2, { shirt: 'blue', dir: 1, lean: 6, hands: [[hand[0], hand[1]], [hand[0] + 4, hand[1] + 4]] }) +
      dim(tie, hand, '1 m', 14) + dim([hand[0] + 70, tie[1]], [hand[0] + 70, hand[1]], '60 cm', 0) + line(tie[0], tie[1], hand[0] + 76, tie[1], 'tb-eq') + line(hand[0], hand[1], hand[0] + 76, hand[1], 'tb-eq'),
      L('Pulling a sled on a rope across level snow', 'Einen Schlitten an einem Seil über ebenen Schnee ziehen'));
  }

  // ---------------------------------------------------------------- 12 a lift and its counterweight
  function counterweight() {
    const { svg, path, rect, circle, person, text } = F();
    return svg(420, 270,
      rect(150, 6, 120, 14, 'tb-dark') + circle(210, 40, 26, 'tb-metal') + circle(210, 40, 5, 'tb-line-fill') + path('M210 20 V14', 'tb-line') +
      path('M184 40 V110 M236 40 V80', 'tb-rope') +
      rect(140, 110, 88, 120, 'tb-cabin', 3) + person(184, 226, 0.95, { shirt: 'blue', hands: [[172, 182], [196, 182]] }) +
      rect(222, 80, 30, 70, 'tb-dark', 2) +
      text(184, 250, L('cabin', 'Kabine'), 'tb-cap') + text(237, 166, L('counter-', 'Gegen-'), 'tb-cap') + text(237, 180, L('weight', 'gewicht'), 'tb-cap') +
      F().force([110, 140], [0, 1], 46, F().sym('a'), [-12, 4], 'a') + F().force([290, 130], [0, -1], 46, F().sym('a'), [10, 4], 'a'),
      L('A lift cabin and its counterweight on a cable over a pulley', 'Eine Liftkabine und ihr Gegengewicht an einem Seil über eine Rolle'));
  }

  root.ForceFigures = { scale, crane, truck, braking, tow, train, skydiver, rocket, parking, skier, sled, counterweight };
})(typeof window !== 'undefined' ? window : globalThis);
