// SVG drawings of magnetic forces. The page plane is x (right), y (up); out of the page is drawn ⊙,
// into it ⊗. Colours by quantity: velocity and current blue, field green, force red.
//   icon(d)          a direction as a small picture: an arrow in the page, or ⊙ / ⊗
//   scene(o)         charges and wires with their vectors: o = { field: { dir } (drawn as field
//                    lines or a grid of ⊙ / ⊗), items: [{ kind: 'particle', q, at, sym (a named
//                    particle's symbol, drawn instead of its sign) } | { kind: 'piece'
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
  // a charged particle at (x, y): its symbol (a named particle, in a neutral colour, its sign not
  // shown) or its sign (+, −, 0) on a colour by sign
  const particle = (x, y, r, q, sym) => `<circle class="particle ${sym ? 'named' : q > 0 ? 'pos' : q < 0 ? 'neg' : 'neu'}" cx="${f1(x)}" cy="${f1(y)}" r="${r}"/>` +
    txt(x, y + (sym ? 4.5 : 5), sym || (q > 0 ? '+' : q < 0 ? '−' : '0'), `sign${sym && sym.length > 2 ? ' long' : ''}`);
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
        s += particle(x, y, R, it.q, it.sym);
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
    s += particle(X(p0[0]), Y(p0[1]), o.sym ? R + 2 : R, o.q, o.sym);
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
    s += particle(26, (top + bot) / 2, 12, o.q, o.sym);
    s += arrow(40, (top + bot) / 2, 96, (top + bot) / 2, 'v-vel') + txt(70, (top + bot) / 2 - 10, `<tspan class="it">v</tspan>`, 'lbl c-vel');
    s += txt(W - 6, 16, `<tspan class="it">B</tspan>`, 'lbl c-field', 'end');
    return svg(W, H, s, L('A velocity selector: two charged plates in a magnetic field', 'Ein Geschwindigkeitsfilter: zwei geladene Platten in einem Magnetfeld'));
  }

  // ---------------------------------------------------------------- a helix in 3D
  // The field along x (to the right); y up, z towards the viewer, drawn down and to the left
  // (an oblique view). The charge winds around a field line: o = { R (radius), pitch, turns, q }.
  // A positive charge turns clockwise seen with the field pointing at the viewer (right hand).
  // The back half of each turn (z < 0) is lighter.
  function helix3d(o) {
    const W = 520, H = 300, S = 54, ox = 80, oy = 150;
    const P2 = (x, y, z) => [ox + S * (x - 0.42 * z), oy - S * (y - 0.32 * z)];
    const len = o.pitch * o.turns, R = o.R, sgn = o.q > 0 ? -1 : 1;
    let s = `<rect class="bg" x="0" y="0" width="${W}" height="${H}"/>`;
    // field lines around the axis, and the axis with B
    for (const [y, z] of [[1.9, 0], [-1.9, 0], [0, 2.3], [0, -2.3]]) {
      const a = P2(-0.6, y, z), b = P2(len + 0.8, y, z);
      s += `<line class="v-field faint" x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}"/>`;
    }
    const a0 = P2(-0.6, 0, 0), a1 = P2(len + 1.2, 0, 0);
    s += arrow(a0[0], a0[1], a1[0], a1[1], 'v-field', 1.6) + txt(a1[0] + 4, a1[1] - 8, '<tspan class="it">B</tspan>', 'lbl c-field', 'start');
    // the cylinder the path winds on: its outline, and its end circles
    for (const y of [R, -R]) { const a = P2(0, y, 0), b = P2(len, y, 0); s += `<line class="cyl" x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}"/>`; }
    for (const x of [0, len]) {
      let d = '';
      for (let k = 0; k <= 48; k++) { const th = (2 * Math.PI * k) / 48, p = P2(x, R * Math.cos(th), R * Math.sin(th)); d += `${k ? 'L' : 'M'}${f1(p[0])},${f1(p[1])}`; }
      s += `<path class="cyl" d="${d}"/>`;
    }
    // the helix: runs in front (z ≥ 0) and behind (z < 0)
    let runs = [], cur = null;
    for (let k = 0; k <= 60 * o.turns; k++) {
      const th = (2 * Math.PI * k) / 60, x = (o.pitch * th) / (2 * Math.PI), y = R * Math.cos(th), z = sgn * R * Math.sin(th), front = z >= -1e-9;
      if (!cur || cur.front !== front) { cur = { front, pts: cur ? [cur.pts[cur.pts.length - 1]] : [] }; runs.push(cur); }
      cur.pts.push(P2(x, y, z));
    }
    runs.filter((r) => !r.front).forEach((r) => { s += `<path class="traj back" d="M${r.pts.map((p) => `${f1(p[0])},${f1(p[1])}`).join(' L')}"/>`; });
    runs.filter((r) => r.front).forEach((r) => { s += `<path class="traj" d="M${r.pts.map((p) => `${f1(p[0])},${f1(p[1])}`).join(' L')}"/>`; });
    // the start, and the velocity there split into its parts along and across the field
    const p0 = P2(0, R, 0), along = P2(o.pitch * 0.35, R, 0), across = P2(0, R, sgn * 1.8); // dz/dθ = sgn·R at the start
    s += arrow(p0[0], p0[1], along[0], along[1], 'v-vel', 2.2) + txt(along[0] + 2, along[1] - 8, 'v<tspan class="sub" dy="3">∥</tspan>', 'lbl c-vel it', 'start');
    s += arrow(p0[0], p0[1], across[0], across[1], 'v-vel', 2.2) + txt(across[0] + 8, across[1] + 4, 'v<tspan class="sub" dy="3">⊥</tspan>', 'lbl c-vel it', 'start');
    s += `<circle class="particle ${o.q > 0 ? 'pos' : 'neg'}" cx="${f1(p0[0])}" cy="${f1(p0[1])}" r="9"/>` + txt(p0[0], p0[1] + 4.5, o.q > 0 ? '+' : '−', 'sign');
    // one pitch
    const q1 = P2(0, -R - 0.55, 0), q2 = P2(o.pitch, -R - 0.55, 0);
    s += `<line class="dimline" x1="${f1(q1[0])}" y1="${f1(q1[1])}" x2="${f1(q2[0])}" y2="${f1(q2[1])}"/>` + `<path class="dimline" d="M${f1(q1[0])} ${f1(q1[1] - 5)} v10 M${f1(q2[0])} ${f1(q2[1] - 5)} v10"/>` +
      txt((q1[0] + q2[0]) / 2, q1[1] + 18, L('one turn: v<tspan class="sub" dy="3">∥</tspan><tspan dy="-3">·T</tspan>', 'ein Umlauf: v<tspan class="sub" dy="3">∥</tspan><tspan dy="-3">·T</tspan>'), 'lbl small');
    return svg(W, H, s, L('The helix in three dimensions: the charge winds around a field line', 'Die Schraubenlinie räumlich: Die Ladung windet sich um eine Feldlinie'), 'wide');
  }

  const api = { icon, scene, pathFig, tracksFig, selectorFig, helix3d, arrow, dotCross };
  root.MagPlot = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
