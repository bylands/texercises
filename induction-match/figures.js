// The pictures of the exercises, in the manner of a physics textbook, drawn with the
// shared figure kit (figkit.js).
//   IndFigures.<name>(args)  an SVG in a <div class="fig">
//     loop({ s, w, d, v, B })      a square loop (side s cm) at distance d from a field region w cm wide
//     magnet({ pole, move, who, show })  a bar magnet in front of a ring (pole facing it; toward, away,
//                                  still; who moves: magnet, ring, or for still: rest, together); for the
//                                  tutor, show: 'poles' (the ring's induced poles) or 'current' (also the
//                                  induced current, and the ring as seen from the magnet)
//     field({ into, how, show })   a loop in a field into or out of the page (how: up, down, off, out, in,
//                                  shrink); show: 'current' (the induced current and its field)
//     gradient({ into, strong, move })  a loop in a field that is stronger on one side (strong: left,
//                                  right, top, bottom; crosses or dots bigger and closer together there),
//                                  moved left, right, up or down
// The induced marks carry data-sense (acw or cw, as seen from the magnet or in the figure) and
// data-face (the pole of the ring's side facing the magnet), for the tests.
(function (root) {
  'use strict';

  const Fig = root.Fig || require('./figkit.js');
  const Lang = root.Lang || require('./lang.js');
  const { svg, path, circle, rect, text, dim } = Fig;
  const L = (en, de) => Lang.L(en, de);
  const dec = (x) => String(Math.round(x * 100) / 100);
  const f1 = (x) => Math.round(x * 10) / 10;
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

  // the pole of the ring's side facing the magnet: an approaching pole is repeated (they repel),
  // a retreating one reversed (they attract); none without relative motion
  const faceOf = (pole, move) => (move === 'toward' ? pole : move === 'away' ? (pole === 'N' ? 'S' : 'N') : null);
  // a small arrowhead at (x, y) pointing along (ux, uy): the induced current
  const head = (x, y, ux, uy, k = 1) => { const H = 9 * k, B = 4.5 * k; return `<polygon class="ind-current" points="${x + (H / 2) * ux},${y + (H / 2) * uy} ${x - (H / 2) * ux - B * uy},${y - (H / 2) * uy + B * ux} ${x - (H / 2) * ux + B * uy},${y - (H / 2) * uy - B * ux}"/>`; };
  // a pole as a small tag, coloured like the bar magnet
  const poleTag = (x, y, p, side) => `<g class="ind-pole" data-side="${side}" data-pole="${p}">${rect(x - 9, y - 10, 18, 20, p === 'N' ? 'tb-red' : 'tb-green', 3)}${lbl(x, y + 5, p)}</g>`;

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
  // who moves (magnet, ring); for no relative motion: both at rest, or both carried together
  function magnet({ pole, move, who = move === 'still' ? 'rest' : 'magnet', show = '' }) {
    const y = 90, ring = 300, face = show ? faceOf(pole, move) : null;
    const ringGo = move === 'toward' ? arrow(330, 30, 270, 30) : arrow(270, 30, 330, 30);
    const go = who === 'together' ? arrow(70, 44, 160, 44) + arrow(270, 30, 330, 30) + cap(115, 140, L('both at the same speed', 'beide gleich schnell'))
      : who === 'ring' ? ringGo + cap(115, 48, L('at rest', 'in Ruhe'))
        : who === 'magnet' ? (move === 'toward' ? arrow(70, 44, 160, 44) : arrow(160, 44, 70, 44)) : cap(115, 48, L('at rest', 'in Ruhe'));
    // with the current: the near half of the ring solid, the far half dashed (the near half is on
    // the right); seen from the magnet, anticlockwise (a north pole facing it) runs up the near half
    const current = show === 'current' && face, acw = face === 'N';
    const ringShape = current ? `<path class="ind-ring back" d="M${ring},${y + 46} A12,46 0 0 1 ${ring},${y - 46}"/><path class="ind-ring" d="M${ring},${y - 46} A12,46 0 0 1 ${ring},${y + 46}"/>`
      : `<ellipse class="ind-ring" cx="${ring}" cy="${y}" rx="12" ry="46"/>`;
    let induced = '';
    if (face) induced += poleTag(ring - 30, y, face, 'magnet') + poleTag(ring + 30, y, face === 'N' ? 'S' : 'N', 'far');
    if (current) {
      const ix = 410, iy = 84;
      induced += `<g class="ind-sense" data-sense="${acw ? 'acw' : 'cw'}" data-face="${face}">${head(ring + 12, y, 0, acw ? -1 : 1, 1.3)}${lbl(ring + 13, y + (acw ? 30 : -22), '<tspan font-style="italic">I</tspan>', 'start')}` +
        `<circle class="ind-ring thin" cx="${ix}" cy="${iy}" r="24"/>${head(ix + 24, iy, 0, acw ? -1 : 1, 0.9)}${head(ix - 24, iy, 0, acw ? 1 : -1, 0.9)}${lbl(ix, iy + 5, face)}` +
        `${cap(ix, iy + 44, L('seen from', 'vom Magneten'))}${cap(ix, iy + 58, L('the magnet', 'aus gesehen'))}</g>`;
    }
    const body = barMagnet(40, y, 150, 34, pole) + go + ringShape + induced + cap(ring, y + 66, L('metal ring', 'Metallring'));
    return svg(current ? 460 : 360, 170, body, L('A bar magnet in front of a metal ring', 'Ein Stabmagnet vor einem Metallring'));
  }

  // ---------------------------------------------------------------- a loop in a field
  // the induced current around a square loop (arrowheads at the middle of its sides, anticlockwise
  // or clockwise as seen in the figure) and its field inside, a large dot or cross
  function loopCurrent(lx, ly, ls, acw) {
    const cx = lx + ls / 2, cy = ly + ls / 2, k = acw ? 1 : -1;
    return `<g class="ind-sense" data-sense="${acw ? 'acw' : 'cw'}">${head(cx, ly, -k, 0, 1.4)}${head(lx, cy, 0, k, 1.4)}${head(cx, ly + ls, k, 0, 1.4)}${head(lx + ls, cy, 0, -k, 1.4)}` +
      `<circle class="ind-bind" cx="${cx}" cy="${cy}" r="10"/>${acw ? circle(cx, cy, 2.6, 'ind-bdot') : path(`M${cx - 5} ${cy - 5}l10 10m0 -10l-10 10`, 'ind-bx')}` +
      `${lbl(cx + 14, cy + 5, '<tspan font-style="italic">B</tspan><tspan font-size="10" dy="3">ind</tspan>', 'start')}</g>`;
  }
  function field({ into, how, show = '' }) {
    const pulled = how === 'out', pushed = how === 'in';
    const fx = pushed ? 124 : 20, fy = 20, fw = pulled || pushed ? 170 : 240, fh = 150, lx = pulled ? 110 : pushed ? 20 : 70, ly = 50, ls = 90;
    const note = { up: L('the field gets stronger', 'das Feld wird stärker'), down: L('the field gets weaker', 'das Feld wird schwächer'), off: L('switched off', 'wird ausgeschaltet'), shrink: L('the loop shrinks', 'die Schleife wird kleiner') }[how] || '';
    // squeezed: an arrow pointing in at the middle of each side
    const cx = lx + ls / 2, cy = ly + ls / 2, h = ls / 2;
    const squeeze = how === 'shrink' ? arrow(cx - h - 26, cy, cx - h - 4, cy) + arrow(cx + h + 26, cy, cx + h + 4, cy) + arrow(cx, cy - h - 26, cx, cy - h - 4) + arrow(cx, cy + h + 26, cx, cy + h + 4) : '';
    // the induced field opposes a growing flux and supports a shrinking one; anticlockwise (as seen)
    // goes with a field out of the page inside the loop
    const grows = how === 'up' || how === 'in', indInto = grows ? !into : into;
    const current = show === 'current' ? loopCurrent(lx, ly, ls, !indInto) : '';
    const more = current ? cap(fx + 10, fy + fh + 36, L(`induced: a current ${indInto ? 'clockwise' : 'anticlockwise'},`, `induziert: ein Strom im ${indInto ? 'Uhrzeigersinn' : 'Gegenuhrzeigersinn'},`), 'start') +
      cap(fx + 10, fy + fh + 52, L(`its field ${indInto ? 'into the page' : 'out of the page'}`, `sein Feld ${indInto ? 'in die Seite hinein' : 'aus der Seite heraus'}`), 'start') : '';
    const body = region(fx, fy, fw, fh) + marks(fx, fy, fw, fh, into, 18) + rect(lx, ly, ls, ls, 'ind-loop') + squeeze + current +
      (pulled ? arrow(lx + ls + 6, ly + ls / 2, lx + ls + 66, ly + ls / 2) : '') + (pushed ? arrow(lx + 15, ly - 16, lx + 75, ly - 16) : '') +
      lbl(pushed ? fx : fx + 10, fy + fh + 18, `<tspan font-style="italic">B</tspan> ${into ? L('into the page', 'in die Seite hinein') : L('out of the page', 'aus der Seite heraus')}${note ? ` · ${note}` : ''}`, 'start') + more;
    return svg(pulled || pushed ? 300 : 280, fy + fh + (current ? 62 : 30), body, L('A loop in a magnetic field', 'Eine Schleife in einem Magnetfeld'));
  }

  // ---------------------------------------------------------------- a loop in a field stronger on one side
  // The marks get bigger and closer together towards the strong side: along the gradient, the
  // spacing goes from 30 to 14 and the size grows by a factor of about 1.9.
  function gradient({ into, strong, move }) {
    const fx = 26, fy = 24, fw = 270, fh = 200, ls = 80, cx = fx + fw / 2, cy = fy + fh / 2, lx = cx - ls / 2, ly = cy - ls / 2;
    const across = strong === 'left' || strong === 'right';
    // u: 0 on the weak side, 1 on the strong side, of a position along the gradient
    const u = (a) => { const v = across ? (a - fx) / fw : (a - fy) / fh; return strong === 'right' || strong === 'bottom' ? v : 1 - v; };
    const sp = (a) => 30 - 16 * u(a);
    let m = '';
    const [a0, a1, b0, b1] = across ? [fx, fx + fw, fy, fy + fh] : [fy, fy + fh, fx, fx + fw];
    for (let a = a0 + sp(a0) / 2; a < a1 - 4; a += sp(a)) {
      const k = 1 + 0.9 * u(a), step = sp(a), n = Math.floor((b1 - b0) / step), off = b0 + (b1 - b0 - (n - 1) * step) / 2;
      for (let j = 0; j < n; j++) {
        const [x, y] = across ? [a, off + j * step] : [off + j * step, a], d = 2.3 * k;
        m += into ? path(`M${f1(x - d)} ${f1(y - d)}l${f1(2 * d)} ${f1(2 * d)}m0 ${f1(-2 * d)}l${f1(-2 * d)} ${f1(2 * d)}`, 'tb-thin', ` style="stroke-width:${f1(0.6 + 0.6 * k)}"`) : circle(x, y, 1.3 * k, 'tb-line-fill');
      }
    }
    const go = { right: [lx + ls + 6, cy, lx + ls + 56, cy], left: [lx - 6, cy, lx - 56, cy], up: [cx, ly - 6, cx, ly - 52], down: [cx, ly + ls + 6, cx, ly + ls + 52] }[move];
    // "stronger" and "weaker" written along the two sides
    // outside the field region: above or below it, or upright beside it
    const side = (where) => ({ left: [fx - 7, cy, -90], right: [fx + fw + 7, cy, 90], top: [cx, fy - 7, 0], bottom: [cx, fy + fh + 15, 0] }[where]);
    const weak = { left: 'right', right: 'left', top: 'bottom', bottom: 'top' }[strong];
    const tag = (where, s) => { const [x, y, a] = side(where); return `<text class="ind-side" x="${x}" y="${y}" text-anchor="middle"${a ? ` transform="rotate(${a} ${x} ${y})"` : ''}>${s}</text>`; };
    const where = { left: L('on the left', 'links'), right: L('on the right', 'rechts'), top: L('at the top', 'oben'), bottom: L('at the bottom', 'unten') }[strong];
    const body = region(fx, fy, fw, fh) + m + rect(lx, ly, ls, ls, 'ind-loop') + arrow(...go) +
      tag(strong, L('stronger', 'stärker')) + tag(weak, L('weaker', 'schwächer')) +
      lbl(fx, fy + fh + 36, `<tspan font-style="italic">B</tspan> ${into ? L('into the page', 'in die Seite hinein') : L('out of the page', 'aus der Seite heraus')}, ${L('stronger', 'stärker')} ${where}`, 'start');
    return svg(fx + fw + 26, fy + fh + 46, body, L('A loop moved in a magnetic field that is stronger on one side', 'Eine Schleife wird in einem Magnetfeld bewegt, das auf einer Seite stärker ist'));
  }

  const api = { loop, magnet, field, gradient, faceOf };
  root.IndFigures = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
