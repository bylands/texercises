// Shared by the teachingphysics.ch apps (canonical copy in shared/, copied by sync.sh).
// Figures in the manner of a physics textbook, for the problems: thin even ink outlines, a few
// muted tints and brushed metal, hatched ground, people drawn simply, motion as slim double
// arrows, forces as red arrows, lengths as dimension lines. The classes tb-* are in ui.css, so
// the figures follow the dark mode. All strings are SVG; coordinates in px, y down.
//   Fig.svg(w, h, body, label)          the figure in a <div class="fig">
//   Fig.path(d, cls), Fig.line(x1, y1, x2, y2, cls), Fig.circle(x, y, r, cls),
//   Fig.rect(x, y, w, h, cls, rx), Fig.text(x, y, html, cls, anchor), Fig.poly(pts, cls)
//   Fig.motion(x1, y1, x2, y2)          a slim double arrow (the motion)
//   Fig.force(a, dir, len, label, off)  a force arrow from a along the unit vector dir
//   Fig.dim(a, b, label, off)           a dimension line, off px to the left of a → b
//   Fig.ground(x0, x1, y), Fig.wall(x, y0, y1, side)   a hatched floor or wall
//   Fig.spring(x, y0, y1, n, w)         a coil spring from (x, y0) to (x, y1)
//   Fig.wheel(x, y, r), Fig.car(x0, y, w, o), Fig.person(x, y, s, o), Fig.tree(x, y, h)
//   Fig.sym(l, sub)                     an italic letter with an upright subscript (SVG text)
(function (root) {
  'use strict';

  const f = (x) => Math.round(x * 10) / 10;
  const DEFS = '<defs><linearGradient id="tb-metal" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:var(--tb-metal1)"/>' +
    '<stop offset="0.45" style="stop-color:var(--tb-metal2)"/><stop offset="1" style="stop-color:var(--tb-metal1)"/></linearGradient>' +
    '<linearGradient id="tb-metal-v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--tb-metal2)"/><stop offset="1" style="stop-color:var(--tb-metal1)"/></linearGradient></defs>';
  const svg = (w, h, body, label) => `<div class="fig"><svg class="tb" viewBox="0 0 ${w} ${h}" width="${w}" role="img" aria-label="${label}">${DEFS}${body}</svg></div>`;
  const path = (d, cls, extra = '') => `<path class="${cls}" d="${d}"${extra}/>`;
  const line = (x1, y1, x2, y2, cls) => `<line class="${cls}" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}"/>`;
  const circle = (x, y, r, cls) => `<circle class="${cls}" cx="${f(x)}" cy="${f(y)}" r="${f(r)}"/>`;
  const rect = (x, y, w, h, cls, rx = 0) => `<rect class="${cls}" x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${rx}"/>`;
  const poly = (pts, cls) => `<polygon class="${cls}" points="${pts.map((p) => `${f(p[0])},${f(p[1])}`).join(' ')}"/>`;
  const text = (x, y, s, cls = 'tb-cap', anchor = 'middle') => `<text class="${cls}" x="${f(x)}" y="${f(y)}" text-anchor="${anchor}">${s}</text>`;
  const sym = (l, s = '') => `<tspan font-style="italic">${l}</tspan>${s ? `<tspan font-size="72%" dy="4">${s}</tspan><tspan dy="-4">​</tspan>` : ''}`;

  // an arrow head at (x, y) along (ux, uy), length H, half width B
  const head = (x, y, ux, uy, H = 9, B = 3.6) => { const bx = x - H * ux, by = y - H * uy; return `<polygon points="${f(x)},${f(y)} ${f(bx - B * uy)},${f(by + B * ux)} ${f(bx + B * uy)},${f(by - B * ux)}"/>`; };
  // a slim double arrow from (x1, y1) to (x2, y2): the motion
  function motion(x1, y1, x2, y2) {
    const d = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / d, uy = (y2 - y1) / d, H = 7;
    return `<g class="tb-motion"><line x1="${f(x1 + H * ux)}" y1="${f(y1 + H * uy)}" x2="${f(x2 - H * ux)}" y2="${f(y2 - H * uy)}"/>${head(x2, y2, ux, uy, H, 3)}${head(x1, y1, -ux, -uy, H, 3)}</g>`;
  }
  // a force: from a along dir (a unit vector), len px, its label beyond the tip (off: [dx, dy])
  function force(a, dir, len, label = '', off = [8, 0], cls = '') {
    const [ux, uy] = dir, tip = [a[0] + len * ux, a[1] + len * uy];
    const anchor = off[0] > 3 ? 'start' : off[0] < -3 ? 'end' : 'middle';
    return `<g class="tb-force${cls ? ` ${cls}` : ''}"><line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(tip[0] - 7 * ux)}" y2="${f(tip[1] - 7 * uy)}"/>${head(tip[0], tip[1], ux, uy, 10, 4)}` +
      `<circle cx="${f(a[0])}" cy="${f(a[1])}" r="2.2"/>${label ? `<text x="${f(tip[0] + off[0])}" y="${f(tip[1] + off[1] + 5)}" text-anchor="${anchor}">${label}</text>` : ''}</g>`;
  }
  // a dimension line between a and b, shifted off px to the left of a → b, with a label
  function dim(a, b, label, off = 14) {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]), u = [(b[0] - a[0]) / len, (b[1] - a[1]) / len], s = off < 0 ? -1 : 1, n = [s * u[1], -s * u[0]], o = Math.abs(off);
    const A = [a[0] + n[0] * o, a[1] + n[1] * o], B = [b[0] + n[0] * o, b[1] + n[1] * o];
    const tick = (P) => `M${f(P[0] - 5 * n[0])} ${f(P[1] - 5 * n[1])}L${f(P[0] + 5 * n[0])} ${f(P[1] + 5 * n[1])}`;
    const m = [(A[0] + B[0]) / 2 + n[0] * 10, (A[1] + B[1]) / 2 + n[1] * 10 + 5];
    return `<g class="tb-dim"><path d="M${f(A[0])} ${f(A[1])}L${f(B[0])} ${f(B[1])}${tick(A)}${tick(B)}"/>${head(B[0], B[1], u[0], u[1], 7, 2.6)}${head(A[0], A[1], -u[0], -u[1], 7, 2.6)}` +
      `${label ? `<text x="${f(m[0])}" y="${f(m[1])}" text-anchor="${Math.abs(n[0]) > 0.7 ? (n[0] > 0 ? 'start' : 'end') : 'middle'}">${label}</text>` : ''}</g>`;
  }
  // ground: a line with short hatches below it; a wall: hatches on one side ('left' or 'right')
  function ground(x0, x1, y) {
    let h = '';
    for (let x = x0 + 4; x < x1; x += 9) h += `M${f(x)} ${f(y)}l-7 9`;
    return path(`M${f(x0)} ${f(y)}H${f(x1)}`, 'tb-ground') + path(h, 'tb-hatch');
  }
  function wall(x, y0, y1, side = 'left') {
    let h = ''; const s = side === 'left' ? -1 : 1;
    for (let y = y0 + 4; y < y1; y += 9) h += `M${f(x)} ${f(y)}l${7 * s} 7`;
    return path(`M${f(x)} ${f(y0)}V${f(y1)}`, 'tb-ground') + path(h, 'tb-hatch');
  }
  // a coil spring from (x, y0) to (x, y1): n turns, width w
  function spring(x, y0, y1, n = 7, w = 9) {
    const end = 5, len = y1 - y0 - 2 * end, step = len / n;
    let d = `M${f(x)} ${f(y0)}v${end}`;
    for (let k = 0; k < n; k++) d += `l${w} ${f(step / 4)}l${-2 * w} ${f(step / 2)}l${w} ${f(step / 4)}`;
    return path(`${d}v${end}`, 'tb-spring');
  }
  const wheel = (x, y, r) => circle(x, y, r, 'tb-tyre') + circle(x, y, r * 0.55, 'tb-metal') + circle(x, y, r * 0.13, 'tb-line-fill');
  // a car in side view, its wheels on the ground y, w px long; o.dy lifts the body, o.ghost draws
  // only the dashed outline of the body, o.cls tints it
  function car(x0, y, w, o = {}) {
    const k = w / 302, X = (v) => f(x0 + (v - 60) * k), Y = (v) => f(y + (v - 202) * k - (o.dy || 0));
    const body = `M${X(60)} ${Y(150)} L${X(60)} ${Y(126)} Q${X(62)} ${Y(116)} ${X(76)} ${Y(114)} L${X(128)} ${Y(110)} L${X(162)} ${Y(80)} Q${X(168)} ${Y(76)} ${X(178)} ${Y(76)} L${X(262)} ${Y(76)} Q${X(272)} ${Y(76)} ${X(280)} ${Y(84)} L${X(310)} ${Y(110)} L${X(346)} ${Y(114)} Q${X(360)} ${Y(118)} ${X(362)} ${Y(130)} L${X(362)} ${Y(150)} ` +
      `L${X(330)} ${Y(150)} A${f(28 * k)} ${f(28 * k)} 0 0 0 ${X(274)} ${Y(150)} L${X(146)} ${Y(150)} A${f(28 * k)} ${f(28 * k)} 0 0 0 ${X(90)} ${Y(150)} Z`;
    if (o.ghost) return path(body, 'tb-ghost');
    const glass = `M${X(140)} ${Y(110)} L${X(168)} ${Y(84)} L${X(212)} ${Y(84)} L${X(212)} ${Y(110)} Z M${X(220)} ${Y(110)} L${X(220)} ${Y(84)} L${X(268)} ${Y(84)} L${X(292)} ${Y(110)} Z`;
    const wy = y - 24 * k;
    return path(body, `tb-body${o.cls ? ` ${o.cls}` : ''}`) + path(glass, 'tb-glass') + path(`M${X(216)} ${Y(112)} V${Y(146)}`, 'tb-trim') +
      (o.noWheels ? '' : wheel(x0 + 58 * k, wy, 24 * k) + wheel(x0 + 242 * k, wy, 24 * k));
  }
  // a limb: an outlined thick polyline through pts
  const limb = (pts, w, cls) => { const d = `M${pts.map((p) => `${f(p[0])} ${f(p[1])}`).join(' L')}`; return path(d, 'tb-limb-out', ` style="stroke-width:${f(w + 2.4)}"`) + path(d, `tb-limb ${cls}`, ` style="stroke-width:${f(w)}"`); };
  // a person standing at (x, y) (between the feet), about 80·s px tall, facing o.dir (1 right,
  // −1 left); o.hands: where the two hands are, o.lean: the upper body leaning forward (px),
  // o.knee: the knees bent forward (px), o.step: the feet apart (px), o.shirt: a tint class
  function person(x, y, s = 1, o = {}) {
    const k = (v) => v * s, d = o.dir || 1, lean = (o.lean || 0) * s * d, knee = (o.knee || 0) * s * d, st = (o.step || 6) * s;
    const hip = [x + lean * 0.3, y - k(38)], sh = [x + lean, y - k(62)], neck = [sh[0], sh[1] - k(4)];
    const feet = [[x - st, y], [x + st, y]], knees = feet.map((p) => [(p[0] + hip[0]) / 2 + knee, (p[1] + hip[1]) / 2]);
    const hands = o.hands || [[sh[0] - k(6), sh[1] + k(26)], [sh[0] + k(6), sh[1] + k(26)]];
    const elbow = (h) => [(sh[0] + h[0]) / 2 + (h[1] > sh[1] + k(8) ? -d * k(2) : 0), (sh[1] + h[1]) / 2 + k(3)];
    const shirt = `tb-shirt ${o.shirt || 'blue'}`;
    const torso = `M${f(hip[0] - k(7))} ${f(hip[1] + k(2))} Q${f(sh[0] - k(9))} ${f(sh[1] + k(12))} ${f(sh[0] - k(8))} ${f(sh[1] + k(2))} Q${f(sh[0])} ${f(sh[1] - k(3))} ${f(sh[0] + k(8))} ${f(sh[1] + k(2))} Q${f(sh[0] + k(9))} ${f(sh[1] + k(12))} ${f(hip[0] + k(7))} ${f(hip[1] + k(2))} Z`;
    return limb([feet[0], knees[0], hip], k(6.5), 'tb-trousers') + limb([feet[1], knees[1], hip], k(6.5), 'tb-trousers') +
      feet.map((p) => `<ellipse class="tb-shoe" cx="${f(p[0] + d * k(3))}" cy="${f(p[1] - k(1.6))}" rx="${f(k(5))}" ry="${f(k(2.4))}"/>`).join('') +
      limb([[sh[0] - d * k(5), sh[1] + k(3)], elbow(hands[0]), hands[0]], k(5), shirt) +
      path(torso, shirt) +
      limb([[sh[0] + d * k(5), sh[1] + k(3)], elbow(hands[1]), hands[1]], k(5), shirt) +
      hands.map((h) => circle(h[0], h[1], k(2.8), 'tb-skin')).join('') +
      circle(neck[0] + d * k(1), neck[1] - k(7), k(8), 'tb-skin') +
      path(`M${f(neck[0] + d * k(1) - k(8))} ${f(neck[1] - k(8))} A${f(k(8))} ${f(k(8))} 0 0 1 ${f(neck[0] + d * k(1) + k(8))} ${f(neck[1] - k(8))} Q${f(neck[0])} ${f(neck[1] - k(12))} ${f(neck[0] + d * k(1) - k(8))} ${f(neck[1] - k(8))} Z`, 'tb-hair');
  }
  const tree = (x, y, h) => path(`M${f(x)} ${f(y - h)} L${f(x + h * 0.3)} ${f(y - h * 0.15)} H${f(x - h * 0.3)} Z`, 'tb-tree') + path(`M${f(x)} ${f(y - h * 0.15)} V${f(y)}`, 'tb-trunk');

  root.Fig = { f, svg, path, line, circle, rect, poly, text, sym, motion, force, dim, ground, wall, spring, wheel, car, person, limb, tree };
  if (typeof module !== 'undefined') module.exports = root.Fig;
})(typeof window !== 'undefined' ? window : globalThis);
