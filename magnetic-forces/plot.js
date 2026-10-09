// SVG drawings of magnetic forces. The page plane is x (right), y (up); out of the page is drawn ⊙,
// into it ⊗. Colours by quantity: velocity and current blue, field green, force red.
//   icon(d)          a direction as a small picture: an arrow in the page, or ⊙ / ⊗
//   scene(o)         charges and wires with their vectors: o = { field: { dir } (drawn as field
//                    lines or a grid of ⊙ / ⊗), items: [{ kind: 'particle', q, at } | { kind: 'piece'
//                    (a short wire), d, at } | { kind: 'wire' (a long wire through at), d, at, name }],
//                    vecs: [{ of (item index), kind: 'v' | 'I' | 'F' | 'B', dir, unknown, name }],
//                    points: [{ at, name }] }
//   pathFig(o)       a trajectory: o = { box: [x0, x1, y0, y1], region: [x0, x1, y0, y1] (the field;
//                    the whole box by default), bz (+1 ⊙, −1 ⊗), grad (the field grows upwards),
//                    bx (+1: field lines to the right), pts (the path), q (the charge drawn at the
//                    start), small }
//   tracksFig(o)     a bubble chamber: tracks from a point, named A–D
(function (root) {
  'use strict';

  const Lang = root.Lang || require('./lang.js');
  const L = (en, de) => Lang.L(en, de);
  const f1 = (x) => Math.round(x * 10) / 10;
  let uid = 0;

  // ---------------------------------------------------------------- pieces
  const head = (x, y, ux, uy, cls, H = 10, B = 4.5) => {
    const bx = x - H * ux, by = y - H * uy;
    return `<polygon class="${cls}" points="${f1(x)},${f1(y)} ${f1(bx - B * uy)},${f1(by + B * ux)} ${f1(bx + B * uy)},${f1(by - B * ux)}"/>`;
  };
  // an arrow from (x1, y1) to (x2, y2) in SVG coordinates
  function arrow(x1, y1, x2, y2, cls, w = 2.6) {
    const d = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / d, uy = (y2 - y1) / d;
    return `<line class="${cls}" stroke-width="${w}" x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2 - 8 * ux)}" y2="${f1(y2 - 8 * uy)}"/>` + head(x2, y2, ux, uy, `${cls}-head`);
  }
  // ⊙ (out of the page) or ⊗ (into it) at (x, y), radius r
  function dotCross(x, y, r, out, cls) {
    return `<circle class="${cls} sym" cx="${f1(x)}" cy="${f1(y)}" r="${r}"/>` + (out
      ? `<circle class="${cls}-head" cx="${f1(x)}" cy="${f1(y)}" r="${f1(r * 0.28)}"/>`
      : `<path class="${cls}" stroke-width="1.8" d="M${f1(x - r * 0.62)} ${f1(y - r * 0.62)} L${f1(x + r * 0.62)} ${f1(y + r * 0.62)} M${f1(x + r * 0.62)} ${f1(y - r * 0.62)} L${f1(x - r * 0.62)} ${f1(y + r * 0.62)}"/>`);
  }
  const svg = (w, h, body, label, cls = '') => `<svg class="mf ${cls}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}">${body}</svg>`;
  const txt = (x, y, s, cls = 'lbl', anchor = 'middle') => `<text class="${cls}" x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor}">${s}</text>`;

  // ---------------------------------------------------------------- a direction
  function icon(d) {
    const c = 22;
    if (!d) return svg(44, 44, txt(c, c + 5, '0', 'lbl'), L('no direction', 'keine Richtung'), 'icon');
    if (d[2]) return svg(44, 44, dotCross(c, c, 14, d[2] > 0, 'v-dir'), d[2] > 0 ? L('out of the page', 'aus der Seite heraus') : L('into the page', 'in die Seite hinein'), 'icon');
    const l = Math.hypot(d[0], d[1]), ux = d[0] / l, uy = -d[1] / l;
    return svg(44, 44, arrow(c - 15 * ux, c - 15 * uy, c + 16 * ux, c + 16 * uy, 'v-dir', 3), L('an arrow', 'ein Pfeil'), 'icon');
  }

  // ---------------------------------------------------------------- a scene
  const NAME = { v: 'v', I: 'I', F: 'F', B: 'B' }, CLS = { v: 'v-vel', I: 'v-vel', F: 'v-force', B: 'v-field' };
  function scene(o) {
    const W = 340, H = 250, S = 62, cx = W / 2, cy = H / 2 + 6, X = (x) => cx + x * S, Y = (y) => cy - y * S;
    let s = '';
    const fd = o.field && o.field.dir;
    if (fd && fd[2]) {
      for (let x = 22; x < W; x += 34) for (let y = 22; y < H; y += 34) s += dotCross(x, y, 5, fd[2] > 0, 'v-field faint');
      s += txt(W - 8, 16, `<tspan class="it">B</tspan>`, 'lbl c-field', 'end');
    } else if (fd) {
      const l = Math.hypot(fd[0], fd[1]), ux = fd[0] / l, uy = -fd[1] / l, nx = -uy, ny = ux;
      for (let k = -4; k <= 4; k++) {
        const ox = cx + nx * k * 34, oy = cy + ny * k * 34;
        s += `<line class="v-field faint" x1="${f1(ox - ux * 400)}" y1="${f1(oy - uy * 400)}" x2="${f1(ox + ux * 400)}" y2="${f1(oy + uy * 400)}"/>`;
        for (const t of [-120, 0, 120]) { const px = ox + ux * t, py = oy + uy * t; if (px > 8 && px < W - 8 && py > 8 && py < H - 8) s += head(px + ux * 6, py + uy * 6, ux, uy, 'v-field-head faint', 8, 3.5); }
      }
      s += txt(W - 8, 16, `<tspan class="it">B</tspan>`, 'lbl c-field', 'end');
    }
    s = `<rect class="bg" x="0" y="0" width="${W}" height="${H}"/>` + `<g clip-path="url(#mfc${++uid})"><clipPath id="mfc${uid}"><rect x="0" y="0" width="${W}" height="${H}"/></clipPath>${s}</g>`;
    // the items
    const R = 13, ends = [];
    (o.items || []).forEach((it) => {
      const x = X(it.at[0]), y = Y(it.at[1]);
      if (it.kind === 'particle') {
        s += `<circle class="particle ${it.q > 0 ? 'pos' : it.q < 0 ? 'neg' : 'neu'}" cx="${f1(x)}" cy="${f1(y)}" r="${R}"/>` + txt(x, y + 5, it.q > 0 ? '+' : it.q < 0 ? '−' : '0', 'sign');
        if (it.name) s += txt(x - R - 4, y - R - 2, it.name, 'lbl', 'end');
        ends.push(R);
      } else if (it.d[2]) {
        s += dotCross(x, y, R, it.d[2] > 0, 'v-wire') + (it.name ? txt(x - R - 4, y - R - 2, it.name, 'lbl', 'end') : '');
        ends.push(R);
      } else {
        const l = Math.hypot(it.d[0], it.d[1]), ux = it.d[0] / l, uy = -it.d[1] / l, half = it.kind === 'wire' ? 400 : 1.1 * S;
        s += `<line class="v-wire" x1="${f1(x - ux * half)}" y1="${f1(y - uy * half)}" x2="${f1(x + ux * half)}" y2="${f1(y + uy * half)}"/>` + head(x + ux * 12, y + uy * 12, ux, uy, 'v-wire-head', 12, 5.5);
        if (it.name) {
          const nx = -uy, ny = ux, tx = it.kind === 'wire' ? x - ux * 90 + nx * 14 : x + nx * 16, ty = it.kind === 'wire' ? y - uy * 90 + ny * 14 + 4 : y + ny * 16 + 4;
          s += txt(tx, ty, it.name, 'lbl');
        }
        ends.push(6);
      }
    });
    (o.points || []).forEach((p) => { s += `<circle class="pt" cx="${f1(X(p.at[0]))}" cy="${f1(Y(p.at[1]))}" r="4"/>` + txt(X(p.at[0]) + 9, Y(p.at[1]) - 8, p.name, 'lbl', 'start'); });
    // the vectors at their items
    let zSlot = 0;
    (o.vecs || []).forEach((v) => {
      const it = o.items[v.of], x = X(it.at[0]), y = Y(it.at[1]), cls = CLS[v.kind], name = `<tspan class="it">${v.name || NAME[v.kind]}</tspan>`;
      // a current is drawn on its wire (named there)
      if (v.kind === 'I') return;
      if (v.unknown) { s += txt(x + 22, y + 30 + 16 * zSlot++, `${name} = ?`, `lbl c-${v.kind === 'F' ? 'force' : v.kind === 'B' ? 'field' : 'vel'}`, 'start'); return; }
      if (v.dir[2]) {
        const sx = x + 30 + 30 * zSlot, sy = y - 30; zSlot++;
        s += dotCross(sx, sy, 9, v.dir[2] > 0, cls) + txt(sx + 13, sy - 8, name, `lbl c-${v.kind === 'F' ? 'force' : v.kind === 'B' ? 'field' : 'vel'}`, 'start');
        return;
      }
      const l = Math.hypot(v.dir[0], v.dir[1]), ux = v.dir[0] / l, uy = -v.dir[1] / l, r0 = ends[v.of] + 3, L0 = v.kind === 'F' ? 66 : 74;
      s += arrow(x + ux * r0, y + uy * r0, x + ux * (r0 + L0), y + uy * (r0 + L0), cls) + txt(x + ux * (r0 + L0 + 14) - uy * 8, y + uy * (r0 + L0 + 14) + ux * 8 + 5, name, `lbl c-${v.kind === 'F' ? 'force' : v.kind === 'B' ? 'field' : 'vel'}`);
    });
    return svg(W, H, s, o.label || L('A drawing of the situation', 'Eine Zeichnung der Situation'));
  }

  // ---------------------------------------------------------------- a trajectory
  function pathFig(o) {
    const [x0, x1, y0, y1] = o.box, W = o.small ? 260 : 340, S = W / (x1 - x0), H = Math.round((y1 - y0) * S);
    const X = (x) => (x - x0) * S, Y = (y) => (y1 - y) * S;
    const reg = o.region || o.box, [rx0, rx1, ry0, ry1] = [Math.max(reg[0], x0), Math.min(reg[1], x1), Math.max(reg[2], y0), Math.min(reg[3], y1)];
    let s = `<rect class="bg" x="0" y="0" width="${W}" height="${H}"/>`;
    s += `<rect class="region" x="${f1(X(rx0))}" y="${f1(Y(ry1))}" width="${f1(X(rx1) - X(rx0))}" height="${f1(Y(ry0) - Y(ry1))}"/>`;
    if (o.bz) {
      // the symbols: closer together where the field is stronger
      for (let y = ry0 + 0.25; y < ry1; ) {
        const g0 = o.grad ? 0.85 : 0.55, gap = o.grad ? g0 / Math.min(2.2, 1 + 0.6 * Math.abs(o.grad) * (o.grad > 0 ? y - ry0 : ry1 - y)) : g0;
        for (let x = rx0 + 0.25; x < rx1; x += gap) s += dotCross(X(x), Y(y), o.small ? 3.4 : 4.2, o.bz > 0, 'v-field faint');
        y += gap;
      }
    }
    if (o.bx) {
      for (let y = ry0 + 0.4; y < ry1; y += 0.8) s += `<line class="v-field faint" x1="${f1(X(rx0))}" y1="${f1(Y(y))}" x2="${f1(X(rx1))}" y2="${f1(Y(y))}"/>` + head(X((rx0 + rx1) / 2) * (o.bx > 0 ? 1 : 1), Y(y), o.bx > 0 ? 1 : -1, 0, 'v-field-head faint', 8, 3.5);
    }
    s += txt(W - 6, 14, `<tspan class="it">B</tspan>`, 'lbl c-field', 'end');
    const pts = o.pts; // clipped to the frame below
    if (pts.length > 1) {
      s += `<g clip-path="url(#mfp${++uid})"><clipPath id="mfp${uid}"><rect x="0" y="0" width="${W}" height="${H}"/></clipPath><path class="traj" d="M${pts.map((p) => `${f1(X(p[0]))},${f1(Y(p[1]))}`).join(' L')}"/></g>`;
      // an arrowhead part way along
      const k = Math.min(pts.length - 2, Math.max(1, Math.round(pts.length * 0.12))), a = pts[k], b = pts[k + 1], d = Math.hypot(X(b[0]) - X(a[0]), Y(b[1]) - Y(a[1])) || 1;
      s += head(X(b[0]), Y(b[1]), (X(b[0]) - X(a[0])) / d, (Y(b[1]) - Y(a[1])) / d, 'traj-head', 11, 5);
    }
    const p0 = o.pts[0], R = o.small ? 8 : 10;
    s += `<circle class="particle ${o.q > 0 ? 'pos' : o.q < 0 ? 'neg' : 'neu'}" cx="${f1(X(p0[0]))}" cy="${f1(Y(p0[1]))}" r="${R}"/>` + txt(X(p0[0]), Y(p0[1]) + 4.5, o.q > 0 ? '+' : o.q < 0 ? '−' : '0', 'sign');
    return svg(W, H, s, o.label || L('The path of the particle', 'Die Bahn des Teilchens'), o.small ? 'small' : '');
  }

  // ---------------------------------------------------------------- a bubble chamber
  function tracksFig(o) {
    const W = 340, H = 280, S = 30, cx = W / 2, cy = H / 2, X = (x) => cx + x * S, Y = (y) => cy - y * S;
    let s = `<rect class="bg chamber" x="0" y="0" width="${W}" height="${H}" rx="12"/>`;
    for (let x = 20; x < W; x += 40) for (let y = 20; y < H; y += 40) s += dotCross(x, y, 4, o.bz > 0, 'v-field faint');
    o.tracks.forEach((t) => {
      s += `<path class="track" d="M${t.pts.map((p) => `${f1(X(p[0]))},${f1(Y(p[1]))}`).join(' L')}"/>`;
      // the name at the point farthest from the start, a little further out
      const e = t.pts.reduce((a, p) => (Math.hypot(p[0], p[1]) > Math.hypot(a[0], a[1]) ? p : a)), d = Math.hypot(e[0], e[1]) || 1;
      s += txt(X(e[0] + (0.45 * e[0]) / d), Y(e[1] + (0.45 * e[1]) / d) + 5, t.name, 'lbl');
    });
    s += `<circle class="pt" cx="${cx}" cy="${cy}" r="3.5"/>`;
    return svg(W, H, s, L('Tracks in a bubble chamber', 'Spuren in einer Blasenkammer'));
  }

  // ---------------------------------------------------------------- a velocity selector
  // Two plates (the upper one + when the field points down), E arrows, the magnetic field, an ion.
  function selectorFig(o) {
    const W = 340, H = 200, top = 40, bot = 160;
    let s = `<rect class="bg" x="0" y="0" width="${W}" height="${H}"/>`;
    for (let x = 70; x < 330; x += 30) for (let y = 62; y < 150; y += 28) s += dotCross(x, y, 4.5, o.bz > 0, 'v-field faint');
    s += `<rect class="plate" x="60" y="${top - 8}" width="270" height="8"/><rect class="plate" x="60" y="${bot}" width="270" height="8"/>`;
    s += txt(46, top + 2, o.Edown ? '+' : '−', 'sign big') + txt(46, bot + 10, o.Edown ? '−' : '+', 'sign big');
    for (const x of [110, 200, 290]) s += o.Edown ? arrow(x, top + 6, x, top + 40, 'v-efield', 2) : arrow(x, bot - 6, x, bot - 40, 'v-efield', 2);
    s += txt(300, o.Edown ? top + 28 : bot - 22, `<tspan class="it">E</tspan>`, 'lbl c-efield', 'start');
    s += `<circle class="particle ${o.q > 0 ? 'pos' : 'neg'}" cx="26" cy="${(top + bot) / 2}" r="11"/>` + txt(26, (top + bot) / 2 + 5, o.q > 0 ? '+' : '−', 'sign');
    s += arrow(40, (top + bot) / 2, 96, (top + bot) / 2, 'v-vel') + txt(70, (top + bot) / 2 - 10, `<tspan class="it">v</tspan>`, 'lbl c-vel');
    s += txt(W - 6, 16, `<tspan class="it">B</tspan>`, 'lbl c-field', 'end');
    return svg(W, H, s, L('A velocity selector: two charged plates in a magnetic field', 'Ein Geschwindigkeitsfilter: zwei geladene Platten in einem Magnetfeld'));
  }

  const api = { icon, scene, pathFig, tracksFig, selectorFig, arrow, dotCross };
  root.MagPlot = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
