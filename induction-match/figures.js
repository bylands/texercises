// The pictures of the exercises, in the manner of a physics textbook, drawn with the
// shared figure kit (figkit.js).
//   IndFigures.<name>(args)  an SVG in a <div class="fig">
//     loop({ s, w, d, v, B })      a square loop (side s cm) at distance d from a field region w cm wide
//     magnet({ pole, move })       a bar magnet in front of a ring (pole facing it; toward, away, still)
//     field({ into, how })         a loop in a field into or out of the page (how: up, down, out)
(function (root) {
  'use strict';

  const Fig = root.Fig || require('./figkit.js');
  const Lang = root.Lang || require('./lang.js');
  const { svg, path, circle, rect, text, dim } = Fig;
  const L = (en, de) => Lang.L(en, de);
  const dec = (x) => String(Math.round(x * 100) / 100);
  const cap = (x, y, s, anchor = 'middle') => text(x, y, s, 'tb-cap', anchor);
  const lbl = (x, y, s, anchor = 'middle') => `<text class="ind-lbl" x="${x}" y="${y}" text-anchor="${anchor}">${s}</text>`;
  // the field: crosses (into the page) or dots (out of it) on a grid inside a rectangle
  function marks(x0, y0, w, h, into, step = 18) {
    let s = '';
    for (let x = x0 + step / 2; x < x0 + w; x += step) {
      for (let y = y0 + step / 2; y < y0 + h; y += step) {
        s += into ? path(`M${x - 3} ${y - 3}l6 6m0 -6l-6 6`, 'tb-thin') : circle(x, y, 1.8, 'tb-line-fill');
      }
    }
    return s;
  }
  const region = (x, y, w, h) => rect(x, y, w, h, 'ind-field', 3);
  // a single arrow from (x1, y1) to (x2, y2): the direction of a motion
  function arrow(x1, y1, x2, y2) {
    const d = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / d, uy = (y2 - y1) / d, H = 9, B = 4, bx = x2 - H * ux, by = y2 - H * uy;
    return `<g class="ind-arrow"><line x1="${x1}" y1="${y1}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}"/><polygon points="${x2},${y2} ${(bx - B * uy).toFixed(1)},${(by + B * ux).toFixed(1)} ${(bx + B * uy).toFixed(1)},${(by - B * ux).toFixed(1)}"/></g>`;
  }

  // ---------------------------------------------------------------- a loop through a field
  function loop({ s, w, d, v, B }) {
    const k = Math.min(5, 340 / (d + s + w + 6)), x0 = 64, side = s * k, fx = x0 + side + d * k, fw = w * k, H = Math.max(side + 60, 120), top = 30, cy = top + H / 2;
    const body = region(fx, top, fw, H) + marks(fx, top, fw, H, true, Math.max(12, Math.min(20, fw / 4))) +
      rect(x0, cy - side / 2, side, side, 'ind-loop') +
      arrow(x0 + side / 2 - 22, cy - side / 2 - 12, x0 + side / 2 + 22, cy - side / 2 - 12) + lbl(x0 + side / 2, cy - side / 2 - 24, `<tspan font-style="italic">v</tspan> = ${dec(v)} cm/s`) +
      dim([x0, cy + side / 2], [x0, cy - side / 2], `${dec(s)} cm`, 12) +
      dim([fx, top + H], [fx + fw, top + H], `${dec(w)} cm`, -14) +
      (d > 0 ? dim([x0 + side, cy + side / 2], [fx, cy + side / 2], `${dec(d)} cm`, -14) : '') +
      lbl(fx + fw / 2, top - 8, `<tspan font-style="italic">B</tspan> = ${dec(B)} T`);
    const W = Math.max(fx + fw + 24, 260);
    return svg(W, top + H + 40, body, L('A square loop moves towards a region with a magnetic field into the page', 'Eine quadratische Schleife bewegt sich auf ein Gebiet mit einem Magnetfeld in die Seite hinein zu'));
  }

  // ---------------------------------------------------------------- a magnet and a ring
  function barMagnet(x, y, len, h, rightPole) {
    const left = rightPole === 'N' ? 'S' : 'N', half = len / 2, cls = (p) => (p === 'N' ? 'tb-red' : 'tb-green');
    return rect(x, y - h / 2, half, h, cls(left)) + rect(x + half, y - h / 2, half, h, cls(rightPole)) +
      lbl(x + half / 2, y + 5, left) + lbl(x + half * 1.5, y + 5, rightPole);
  }
  function magnet({ pole, move }) {
    const y = 90, ring = 300;
    const go = move === 'toward' ? arrow(70, 44, 160, 44) : move === 'away' ? arrow(160, 44, 70, 44) : '';
    const body = barMagnet(40, y, 150, 34, pole) + go + (move === 'still' ? cap(115, 48, L('at rest', 'in Ruhe')) : '') +
      `<ellipse class="ind-ring" cx="${ring}" cy="${y}" rx="12" ry="46"/>` + cap(ring, y + 66, L('metal ring', 'Metallring'));
    return svg(360, 170, body, L('A bar magnet in front of a metal ring', 'Ein Stabmagnet vor einem Metallring'));
  }

  // ---------------------------------------------------------------- a loop in a field
  function field({ into, how }) {
    const pulled = how === 'out';
    const fx = 20, fy = 20, fw = pulled ? 170 : 240, fh = 150, lx = pulled ? 110 : 70, ly = 50, ls = 90;
    const note = how === 'up' ? L('the field gets stronger', 'das Feld wird stärker') : how === 'down' ? L('the field gets weaker', 'das Feld wird schwächer') : '';
    const body = region(fx, fy, fw, fh) + marks(fx, fy, fw, fh, into, 18) + rect(lx, ly, ls, ls, 'ind-loop') +
      (pulled ? arrow(lx + ls + 6, ly + ls / 2, lx + ls + 66, ly + ls / 2) : '') +
      lbl(fx + 10, fy + fh + 18, `<tspan font-style="italic">B</tspan> ${into ? L('into the page', 'in die Seite hinein') : L('out of the page', 'aus der Seite heraus')}${note ? ` · ${note}` : ''}`, 'start');
    return svg(pulled ? 300 : 280, fy + fh + 30, body, L('A loop in a magnetic field', 'Eine Schleife in einem Magnetfeld'));
  }

  const api = { loop, magnet, field };
  root.IndFigures = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
