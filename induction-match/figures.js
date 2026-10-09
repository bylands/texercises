// The pictures of the exercises and problems, in the manner of a physics textbook, drawn with the
// shared figure kit (figkit.js).
//   IndFigures.<name>(args)  an SVG in a <div class="fig">
//     loop({ s, w, d, v, B })      a square loop (side s cm) at distance d from a field region w cm wide
//     magnet({ pole, move })       a bar magnet in front of a ring (pole facing it; toward, away, still)
//     field({ into, how })         a loop in a field into or out of the page (how: up, down, out)
//     fall(), brake(), pickup(), hob(), dynamo()   the problems (realproblems.js)
(function (root) {
  'use strict';

  const Fig = root.Fig || require('./figkit.js');
  const Lang = root.Lang || require('./lang.js');
  const { svg, path, line, circle, rect, text, dim } = Fig;
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

  // ---------------------------------------------------------------- the problems
  // a magnet falling through a coil, the coil wired to a data logger
  function fall() {
    let coil = '';
    for (let y = 120; y <= 170; y += 6) coil += `<ellipse class="ind-turn" cx="120" cy="${y}" rx="30" ry="6"/>`;
    const body = rect(104, 20, 32, 220, 'tb-glass', 3) + coil +
      rect(110, 30, 20, 18, 'tb-green') + rect(110, 48, 20, 18, 'tb-red') + lbl(120, 44, 'S') + lbl(120, 62, 'N') +
      arrow(160, 40, 160, 90) + path('M150 125 C200 120 220 110 250 110 M150 165 C200 170 220 150 250 150', 'tb-thin') +
      rect(250, 95, 90, 70, 'tb-dark', 6) + rect(260, 105, 70, 40, 'ind-screen', 3) + path('M264 125 h12 q4 14 8 0 q4 -22 8 0 h28', 'ind-trace') +
      cap(120, 258, L('tube with a coil', 'Rohr mit Spule')) + cap(295, 182, L('data logger', 'Datenlogger'));
    return svg(360, 270, body, L('A magnet falls through a tube with a coil; the coil is connected to a data logger', 'Ein Magnet fällt durch ein Rohr mit einer Spule; die Spule ist an einen Datenlogger angeschlossen'));
  }
  // a drop-tower car with a metal fin, braked between magnets
  function brake() {
    const body = rect(20, 10, 14, 226, 'tb-concrete') + rect(56, 30, 84, 56, 'tb-blue', 6) + path('M66 30 v-12 h64 v12', 'tb-thin') +
      rect(92, 86, 12, 100, 'tb-metal') + rect(72, 150, 16, 50, 'tb-magnet') + rect(108, 150, 16, 50, 'tb-magnet') +
      arrow(200, 40, 200, 110) + cap(110, 122, L('copper fin', 'Kupferfinne'), 'start') +
      cap(44, 222, L('magnets on both sides of the fin', 'Magnete auf beiden Seiten der Finne'), 'start') + cap(27, 250, L('tower', 'Turm'));
    return svg(260, 260, body, L('A drop-tower car with a metal fin falling between magnets', 'Ein Freifallturm-Wagen mit einer Metallfinne, die zwischen Magneten fällt'));
  }
  // a guitar string over a pickup
  function pickup() {
    let coil = '';
    for (let x = 140; x <= 220; x += 7) coil += `<ellipse class="ind-turn" cx="${x}" cy="118" rx="4" ry="16"/>`;
    const body = path('M20 70 Q180 46 340 70', 'ind-string') + path('M20 70 Q180 94 340 70', 'tb-thin') + line(20, 70, 340, 70, 'tb-thin') +
      rect(130, 100, 100, 36, 'tb-dark', 4) + coil + [150, 170, 190, 210].map((x) => rect(x - 4, 92, 8, 10, 'tb-metal')).join('') +
      path('M230 118 C270 118 280 160 320 160', 'tb-thin') + rect(300, 150, 50, 30, 'tb-dark', 4) + cap(325, 196, L('amplifier', 'Verstärker')) +
      cap(180, 156, L('pickup: magnets with a coil', 'Tonabnehmer: Magnete mit Spule')) + cap(180, 30, L('vibrating steel string', 'schwingende Stahlsaite'));
    return svg(360, 205, body, L('A vibrating guitar string over a pickup', 'Eine schwingende Gitarrensaite über einem Tonabnehmer'));
  }
  // a pan on an induction hob
  function hob() {
    let coil = '';
    for (let r = 16; r <= 90; r += 12) coil += `<ellipse class="ind-turn" cx="180" cy="150" rx="${r}" ry="${r * 0.14}"/>`;
    const body = rect(70, 70, 220, 56, 'tb-metal', 4) + path('M70 80 h-30 M290 80 h30', 'tb-handle') + rect(30, 126, 300, 10, 'tb-glass') + coil +
      path('M120 150 C110 100 150 100 150 126 M240 150 C250 100 210 100 210 126', 'ind-fieldline') + rect(150, 170, 60, 20, 'tb-dark', 3) +
      cap(180, 206, L('coil with alternating current', 'Spule mit Wechselstrom')) + cap(180, 60, L('steel pan', 'Stahltopf')) + cap(340, 150, L('glass top', 'Glasplatte'), 'end');
    return svg(360, 215, body, L('A pan on an induction hob, with the coil below the glass top', 'Ein Topf auf einem Induktionskochfeld, mit der Spule unter der Glasplatte'));
  }
  // a bicycle wheel with a bottle dynamo and a lamp
  function dynamo() {
    const body = circle(130, 120, 90, 'tb-wheel') + circle(130, 120, 84, 'tb-wheel') + circle(130, 120, 6, 'tb-line-fill') +
      [0, 30, 60, 90, 120, 150].map((a) => { const t = (a * Math.PI) / 180; return line(130 - 84 * Math.cos(t), 120 - 84 * Math.sin(t), 130 + 84 * Math.cos(t), 120 + 84 * Math.sin(t), 'tb-thin'); }).join('') +
      rect(215, 50, 22, 50, 'tb-metal', 6) + circle(226, 100, 6, 'tb-dark') + path('M226 50 C230 20 290 20 300 50', 'tb-thin') +
      path('M290 50 h24 l8 12 h-40 z', 'tb-yellow') + cap(238, 120, L('dynamo', 'Dynamo'), 'start') + cap(302, 80, L('lamp', 'Lampe'));
    return svg(360, 220, body, L('A bicycle wheel with a bottle dynamo connected to a lamp', 'Ein Fahrradrad mit einem Seitenläuferdynamo, der an eine Lampe angeschlossen ist'));
  }

  const api = { loop, magnet, field, fall, brake, pickup, hob, dynamo };
  root.IndFigures = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
