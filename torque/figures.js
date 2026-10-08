// The pictures of the problems (realproblems.js), as in a physics textbook, drawn with the shared
// figure kit (figkit.js): each a figure of the situation with its lengths as dimension lines and
// the forces that the text gives as arrows. Lengths are labelled with letters; the values are in
// the text. TorqueFigures[id](p) gives the SVG.
(function (root) {
  'use strict';

  const F = () => root.Fig;
  const L = (en, de) => root.TQ.L(en, de);
  const rad = (deg) => (deg * Math.PI) / 180;

  // ---------------------------------------------------------------- 1 a door, seen from above
  function door(p) {
    const { svg, rect, path, circle, force, dim, text, sym } = F();
    const H = [70, 90], len = 260, ang = rad(32), u = [Math.cos(ang), Math.sin(ang)], n = [-Math.sin(ang), Math.cos(ang)];
    const at = (cm) => [H[0] + (cm / 100) * len * u[0], H[1] + (cm / 100) * len * u[1]];
    const board = [[H[0] - 4 * n[0], H[1] - 4 * n[1]], [at(100)[0] - 4 * n[0], at(100)[1] - 4 * n[1]], [at(100)[0] + 4 * n[0], at(100)[1] + 4 * n[1]], [H[0] + 4 * n[0], H[1] + 4 * n[1]]];
    const hd = at(p.d);
    return svg(420, 250,
      rect(10, 80, 56, 20, 'tb-concrete') + rect(H[0] + len + 6, 80, 420 - H[0] - len - 16, 20, 'tb-concrete') +
      path(`M${H[0] + len} ${H[1]} A${len} ${len} 0 0 1 ${at(100)[0]} ${at(100)[1]}`, 'tb-ghost') +
      `<polygon class="tb-wood" points="${board.map((q) => q.map((v) => v.toFixed(1)).join(',')).join(' ')}"/>` +
      circle(H[0], H[1], 6, 'tb-metal') + circle(hd[0] + 6 * n[0], hd[1] + 6 * n[1], 4, 'tb-dark') +
      force([hd[0] + 52 * n[0], hd[1] + 52 * n[1]], [-n[0], -n[1]], 44, sym('F'), [10, 10]) +
      dim(H, hd, sym('d'), -22) +
      text(H[0] - 6, H[1] - 16, L('hinge', 'Scharnier'), 'tb-label', 'middle') + text(210, 242, L('seen from above', 'von oben gesehen')),
      L('A door seen from above: hinge, door and the push at the handle', 'Eine Tür von oben: Scharnier, Tür und der Stoss an der Klinke'));
  }

  // ---------------------------------------------------------------- 2 a wheel nut and a wrench
  function wrench(p) {
    const { svg, circle, rect, force, dim, ground, sym, poly } = F();
    const c = [100, 130], s = 2.8, l1 = p.l1 * s, l2 = p.l2 * s;
    const hex = Array.from({ length: 6 }, (z, k) => [c[0] + 9 * Math.cos(rad(60 * k + 30)), c[1] + 9 * Math.sin(rad(60 * k + 30))]);
    return svg(420, 250,
      ground(0, 420, 222) + circle(c[0], c[1], 88, 'tb-tyre') + circle(c[0], c[1], 54, 'tb-metal') + circle(c[0], c[1], 20, 'tb-concrete') +
      [0, 1, 2, 3, 4].map((k) => circle(c[0] + 36 * Math.cos(rad(72 * k - 90)), c[1] + 36 * Math.sin(rad(72 * k - 90)), 4.5, 'tb-dark')).join('') +
      rect(c[0] + l1 - 10, c[1] - 7, l2 - l1 + 10, 14, 'tb-ghost', 3) +
      rect(c[0], c[1] - 6, l1, 12, 'tb-metal', 4) + poly(hex, 'tb-dark') +
      force([c[0] + l1 - 8, c[1] - 64], [0, 1], 54, sym('F', '1'), [10, -44]) +
      dim([c[0], c[1] + 8], [c[0] + l1, c[1] + 8], sym('ℓ', '1'), -26) + dim([c[0], c[1] + 8], [c[0] + l2, c[1] + 8], sym('ℓ', '2'), -54),
      L('A wheel nut with a wrench and, dashed, an extension pipe', 'Eine Radmutter mit einem Radschlüssel und, gestrichelt, einem Verlängerungsrohr'));
  }

  // ---------------------------------------------------------------- 3 a seesaw
  function seesaw(p) {
    const { svg, rect, poly, ground, person, dim, text, sym, path } = F();
    const y = 150, x0 = 40, x1 = 380, mid = 210;
    const sitter = (x, s, shirt, dir) => person(x, y - 5, s, { shirt, dir, hands: [[x - 8 * s, y - 28 * s], [x + 8 * s, y - 28 * s]] });
    return svg(420, 240,
      ground(0, 420, 205) + poly([[mid, y + 5], [mid - 26, 205], [mid + 26, 205]], 'tb-concrete') +
      rect(x0, y - 5, x1 - x0, 10, 'tb-wood', 2) +
      sitter(x0 + 18, 0.85, 'red', 1) + sitter(x1 - 18, 0.7, 'green', -1) +
      path(`M${mid + 70} ${y - 6} m-14 0 a14 14 0 1 1 28 0`, 'tb-ghost') + text(mid + 70, y - 30, '?', 'tb-label') +
      dim([mid, y + 8], [mid + 70, y + 8], sym('x'), -24) + dim([x0, y + 30], [mid, y + 30], '2 m', -1) + dim([mid, y + 30], [x1, y + 30], '2 m', -1),
      L('A seesaw with a child at each end; where must the parent sit?', 'Eine Wippe mit einem Kind an jedem Ende; wo muss der Elternteil sitzen?'));
  }

  // ---------------------------------------------------------------- 4 the crank of a bicycle
  function bike(p) {
    const { svg, circle, path, rect, force, dim, sym, line } = F();
    const c = [170, 120], s = 5, R = p.r2 * s, cr = p.r1 * s;
    let teeth = ''; for (let k = 0; k < 36; k++) { const a = rad(10 * k); teeth += `M${(c[0] + R * Math.cos(a)).toFixed(1)} ${(c[1] + R * Math.sin(a)).toFixed(1)}l${(4 * Math.cos(a)).toFixed(1)} ${(4 * Math.sin(a)).toFixed(1)}`; }
    return svg(420, 250,
      path(`M${c[0]} ${c[1] - R - 2} L20 ${c[1] - 26} M${c[0]} ${c[1] + R + 2} L20 ${c[1] + 26}`, 'tb-chain') +
      path(teeth, 'tb-line') + circle(c[0], c[1], R, 'tb-metal') + circle(c[0], c[1], R * 0.45, 'tb-concrete') +
      rect(c[0], c[1] - 6, cr, 12, 'tb-dark', 6) + circle(c[0], c[1], 7, 'tb-metal') +
      rect(c[0] + cr - 4, c[1] - 14, 34, 10, 'tb-dark', 2) +
      force([c[0] + cr + 13, c[1] - 66], [0, 1], 52, sym('F'), [10, -40]) +
      dim([c[0], c[1]], [c[0] + cr, c[1]], sym('r', '1'), 22) + dim([c[0], c[1]], [c[0] - R * Math.SQRT1_2, c[1] + R * Math.SQRT1_2], sym('r', '2'), -10),
      L('The crank and chainring of a bicycle, the pedal pushed down', 'Kurbel und Kettenblatt eines Velos, das Pedal nach unten gedrückt'));
  }

  // ---------------------------------------------------------------- 5 two painters carry a plank
  function painters(p) {
    const { svg, rect, path, person, ground, dim, sym, text } = F();
    const y = 112, x0 = 70, x1 = 350, s = (x1 - x0) / p.len, bx = x1 - p.x * s;
    return svg(420, 240,
      ground(0, 420, 205) +
      person(x0 + 6, 205, 1.45, { shirt: 'blue', hands: [[x0 - 4, y - 3], [x0 + 14, y - 3]] }) +
      person(x1 - 6, 205, 1.45, { shirt: 'orange', dir: -1, hands: [[x1 - 14, y - 3], [x1 + 4, y - 3]] }) +
      rect(x0 - 12, y - 6, x1 - x0 + 24, 8, 'tb-wood', 2) + path(`M${bx - 13} ${y - 6} l3 -24 h20 l3 24 Z`, 'tb-blue') + path(`M${bx - 10} ${y - 30} q10 -14 20 0`, 'tb-rope') +
      dim([x0, y - 50], [x1, y - 50], sym('ℓ'), 0) + dim([bx, y + 14], [x1, y + 14], sym('x'), -8) +
      text(x0, y - 70, L('back', 'hinten'), 'tb-cap') + text(x1, y - 70, L('front', 'vorne'), 'tb-cap'),
      L('Two painters carrying a plank with a bucket on it', 'Zwei Maler tragen ein Brett mit einem Eimer darauf'));
  }

  // ---------------------------------------------------------------- 6 a tower crane
  function tower(p) {
    const { svg, path, rect, ground, dim, sym, text } = F();
    const mx = 120, top = 50, s = 260 / p.r2, cx = mx - p.c * s * 0.9;
    let lat = '';
    for (let y = 205; y > top + 10; y -= 18) lat += `M${mx - 8} ${y} L${mx + 8} ${y - 18} M${mx - 8} ${y} H${mx + 8}`;
    let jib = '';
    for (let x = mx; x < mx + p.r2 * s; x += 16) jib += `M${x} ${top} L${x + 8} ${top + 10} L${x + 16} ${top}`;
    const r1 = mx + p.r1 * s, r2 = mx + p.r2 * s;
    return svg(430, 240,
      ground(0, 430, 205) + path(`M${mx - 8} 205 V${top} M${mx + 8} 205 V${top}`, 'tb-line') + path(lat, 'tb-thin') +
      path(`M${cx - 10} ${top} H${r2 + 6} M${mx} ${top + 10} H${r2} M${mx - 8} ${top} L${mx} ${top - 22} L${mx + 8} ${top}`, 'tb-line') + path(jib, 'tb-thin') +
      path(`M${mx} ${top - 22} L${cx} ${top} M${mx} ${top - 22} L${r2 - 30} ${top}`, 'tb-thin') +
      rect(cx - 14, top + 2, 28, 26, 'tb-concrete') +
      path(`M${r1} ${top + 10} V${top + 70}`, 'tb-rope') + rect(r1 - 16, top + 70, 32, 22, 'tb-blue') +
      path(`M${r2} ${top + 10} V${top + 70}`, 'tb-ghost') + rect(r2 - 16, top + 70, 32, 22, 'tb-ghost') +
      dim([cx, top], [mx, top], sym('c'), 24) + dim([mx, 132], [r1, 132], sym('r', '1'), 0) + dim([mx, 160], [r2, 160], sym('r', '2'), 0) +
      text(cx, top + 44, L('counterweight', 'Gegengewicht'), 'tb-cap'),
      L('A tower crane with its counterweight and a load at two distances', 'Ein Turmdrehkran mit seinem Gegengewicht und einer Last in zwei Abständen'));
  }

  // ---------------------------------------------------------------- 7 the forearm as a lever
  function bag(p) {
    const { svg, path, circle, force, dim, sym, text, limb } = F();
    const E = [110, 120], s = 7, hand = [E[0] + p.a * s, E[1]], ms = [E[0] + p.d * s, E[1]];
    return svg(420, 250,
      limb([[E[0] - 10, 20], E], 20, 'tb-skinlimb') + limb([E, hand], 15, 'tb-skinlimb') + circle(hand[0] + 6, hand[1] + 2, 9, 'tb-skin') +
      path(`M${E[0] - 4} 40 Q${E[0] + 30} 70 ${ms[0]} ${E[1] - 6}`, 'tb-muscle') + circle(E[0], E[1], 6, 'tb-com') +
      path(`M${hand[0] + 6} ${hand[1] + 10} V${hand[1] + 40}`, 'tb-rope') + path(`M${hand[0] - 22} ${hand[1] + 40} h56 l-6 60 h-44 Z`, 'tb-concrete') +
      force([ms[0], E[1] - 8], [0, -1], 56, sym('F', 'B'), [10, 0]) +
      dim(E, ms, sym('d'), 24) + dim([E[0], E[1] + 46], [E[0] + p.c * s, E[1] + 46], sym('c'), 0) + dim([E[0], E[1] + 74], [hand[0] + 6, E[1] + 74], sym('a'), 0) +
      text(E[0] - 18, E[1] + 4, L('elbow', 'Ellbogen'), 'tb-label', 'end'),
      L('The forearm as a lever: elbow, biceps and the bag in the hand', 'Der Unterarm als Hebel: Ellbogen, Bizeps und die Tasche in der Hand'));
  }

  // ---------------------------------------------------------------- 8 a hammer on one finger
  function hammer(p) {
    const { svg, rect, path, dim, sym, text, limb } = F();
    const x0 = 60, len = 280, y = 110;
    return svg(420, 230,
      rect(x0, y - 7, len, 14, 'tb-wood', 6) + rect(x0 + len - 4, y - 32, 30, 64, 'tb-metal', 3) +
      limb([[222, 228], [222, y + 12]], 20, 'tb-skinlimb') + text(240, y + 40, '?', 'tb-label', 'start') +
      dim([x0, y - 44], [x0 + len, y - 44], sym('ℓ'), 0) + dim([x0, y + 26], [222, y + 26], sym('x'), -1),
      L('A hammer balanced on one finger', 'Ein Hammer auf einem Finger balanciert'));
  }

  // ---------------------------------------------------------------- 9 a diving board
  function board(p) {
    const { svg, rect, path, circle, person, dim, sym, text } = F();
    const x0 = 40, y = 110, s = 280 / p.len, sup = x0 + p.b * s, tip = x0 + 280;
    return svg(430, 250,
      rect(0, y + 34, sup + 30, 106, 'tb-concrete') + rect(sup + 30, 170, 430 - sup - 30, 80, 'tb-water') + path(`M${sup + 30} 170 H430`, 'tb-surface') +
      rect(x0 - 6, y + 5, 16, 29, 'tb-dark') + rect(sup - 7, y + 5, 14, 29, 'tb-dark') +
      rect(x0 - 8, y - 5, 290, 10, 'tb-metal', 3) + circle(x0 + 2, y, 3.5, 'tb-line-fill') +
      person(tip - 10, y - 5, 1.2, { shirt: 'red', hands: [[tip - 18, y - 112], [tip - 2, y - 112]] }) +
      dim([x0, y + 12], [sup, y + 12], sym('b'), -1) + dim([x0, y - 40], [tip, y - 40], sym('ℓ'), 0) +
      text(x0 + 2, y - 12, L('bolt', 'Bolzen'), 'tb-label', 'start'),
      L('A diving board held by a bolt and resting on a support, a diver at its tip', 'Ein Sprungbrett, mit einem Bolzen befestigt und auf einer Stütze aufliegend, ein Springer an der Spitze'));
  }

  // ---------------------------------------------------------------- 10 the tilt test of a bus
  function bus(p) {
    const { svg, path, rect, circle, dim, sym, text, poly, line } = F();
    // the bus seen from behind, drawn upright on the platform's surface (y = 0 there, x along it),
    // then turned with the platform by θ about the platform's lowest corner
    const th = 22, t = rad(th), o = [40, 232], s = 52, W = p.w * s, Hh = 2.9 * s, x0 = 120;
    const toWorld = (a, b) => [o[0] + a * Math.cos(t) + b * Math.sin(t), o[1] - a * Math.sin(t) + b * Math.cos(t)]; // (along, down) → screen
    const com = toWorld(x0 + W / 2, -p.h * s), foot = [com[0], o[1]];
    const tyre = (a) => rect(a, -30, 22, 30, 'tb-tyre', 5);
    const upright = rect(x0 - 6, -Hh, W + 12, Hh - 24, 'tb-yellow', 8) + rect(x0 + 6, -Hh + 12, W - 12, 50, 'tb-glass', 4) +
      rect(x0 + 2, -44, 18, 10, 'tb-red', 2) + rect(x0 + W - 20, -44, 18, 10, 'tb-red', 2) + rect(x0 + W / 2 - 18, -42, 36, 10, 'tb-concrete', 2) +
      rect(x0 - 8, -30, W + 16, 8, 'tb-dark', 3) + tyre(x0) + tyre(x0 + W - 22);
    const dims = dim(toWorld(x0 + 11, 0), toWorld(x0 + W - 11, 0), sym('w'), -20) + dim(toWorld(x0 + W / 2, 0), com, sym('h'), -16);
    return svg(430, 250,
      poly([o, [o[0] + 360 * Math.cos(t), o[1] - 360 * Math.sin(t)], [o[0] + 360 * Math.cos(t), o[1]]], 'tb-concrete') +
      `<g transform="rotate(${-th} ${o[0]} ${o[1]}) translate(${o[0]} ${o[1]})">${upright}</g>` +
      circle(com[0], com[1], 7, 'tb-com') + path(`M${com[0] - 7} ${com[1]} h14 M${com[0]} ${com[1] - 7} v14`, 'tb-line') + line(com[0], com[1] + 7, foot[0], foot[1], 'tb-ghost') +
      dims + path(`M${o[0] + 60} ${o[1]} A60 60 0 0 0 ${o[0] + 60 * Math.cos(t)} ${o[1] - 60 * Math.sin(t)}`, 'tb-line') + text(o[0] + 70, o[1] - 8, 'θ', 'tb-label', 'start'),
      L('A bus on a tilted platform, seen from behind, with its centre of mass', 'Ein Bus auf einer geneigten Plattform, von hinten gesehen, mit seinem Schwerpunkt'));
  }

  root.TorqueFigures = { door, wrench, seesaw, bike, painters, tower, bag, hammer, board, bus };
})(typeof window !== 'undefined' ? window : globalThis);
