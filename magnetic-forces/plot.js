// SVG drawings of magnetic forces. The page plane is x (right), y (up); out of the page is drawn ⊙,
// into it ⊗. Colours by quantity: velocity and current blue, field green, force red.
//   icon(d)          a direction as a small picture: an arrow in the page, or ⊙ / ⊗
//   scene(o)         charges and wires with their vectors: o = { field: { dir } (drawn as field
//                    lines or a grid of ⊙ / ⊗), items: [{ kind: 'particle', q, at, sym (a named
//                    particle's symbol, drawn instead of its sign) } | { kind: 'piece'
//                    (a short wire), d, at } | { kind: 'wire' (a long wire through at), d, at, name }],
//                    vecs: [{ of (item index), kind: 'v' | 'I' | 'F' | 'B', dir, unknown, name, len (px) }],
//                    points: [{ at, name }],
//                    links: [[i, j]] (a coil seen edge-on from item i to item j, turning about
//                    its middle) }
//   linesFig(o)      the field lines of a wire, a loop, a solenoid or a bar magnet, right or with
//                    a typical error (see there)
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
    // a coil seen edge-on, and the axis it turns about
    (o.links || []).forEach(([i, j]) => {
      const a = o.items[i].at, b = o.items[j].at;
      s += `<line class="coil" x1="${f1(X(a[0]))}" y1="${f1(Y(a[1]))}" x2="${f1(X(b[0]))}" y2="${f1(Y(b[1]))}"/><circle class="pt" cx="${f1(X((a[0] + b[0]) / 2))}" cy="${f1(Y((a[1] + b[1]) / 2))}" r="3.5"/>`;
    });
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
      const l = Math.hypot(v.dir[0], v.dir[1]), ux = v.dir[0] / l, uy = -v.dir[1] / l, r0 = ends[v.of] + 3, L0 = v.len || (v.kind === 'F' ? 66 : 74);
      s += arrow(x + ux * r0, y + uy * r0, x + ux * (r0 + L0), y + uy * (r0 + L0), cls) + txt(x + ux * (r0 + L0 + 14) - uy * 8, y + uy * (r0 + L0 + 14) + ux * 8 + 5, name, `lbl c-${v.kind === 'F' ? 'force' : v.kind === 'B' ? 'field' : 'vel'}`);
    });
    return svg(W, H, s, o.label || L('A drawing of the situation', 'Eine Zeichnung der Situation'));
  }

  // ---------------------------------------------------------------- field lines
  // The sources, axis along x: a wire seen end-on, a loop and a solenoid in cross-section (the
  // conductors of the top row carry the current out of the page for s = +1), a bar magnet (its
  // north pole at the right for s = +1, the field inside it like that of the solenoid).
  const SOL = [-1.5, -1, -0.5, 0, 0.5, 1, 1.5];
  const SOURCES = {
    wire: { wires: (s) => [{ x: 0, y: 0, s }], seeds: [0.55, 1.05, 1.6, 2.2], inside: () => false },
    loop: { wires: (s) => [{ x: 0, y: 0.85, s }, { x: 0, y: -0.85, s: -s }], seeds: [0, 0.3, -0.3, 0.6, -0.6], inside: (x, y) => Math.abs(x) < 0.4 && Math.abs(y) < 0.85 },
    solenoid: { wires: (s) => [...SOL.map((x) => ({ x, y: 0.7, s })), ...SOL.map((x) => ({ x, y: -0.7, s: -s }))], seeds: [0, 0.22, -0.22, 0.44, -0.44], inside: (x, y) => Math.abs(x) < 1.75 && Math.abs(y) < 0.7 },
  };
  SOURCES.magnet = SOURCES.solenoid;
  // o = { src, s, vertical (the axis up the page), wrong: null (the right field lines), 'reverse'
  // (every arrow turned round), 'inside' or 'outside' (the arrows turned round only inside or only
  // outside the loop, coil or magnet: lines that do not close), 'out' or 'in' (a wire: radial
  // lines), 'none' (no lines: the task), small }
  function linesFig(o) {
    const M = root.Magnet || require('./generator.js');
    const src = SOURCES[o.src], wires = src.wires(o.s), W = o.small ? 250 : 320, H = Math.round(W * (o.wrong === 'none' && (!o.vertical || o.src === 'loop') ? 0.42 : 0.78)), S = W / 5.8; // the task: only the source
    const rot = (p) => (o.vertical ? [-p[1], p[0]] : p), X = (p) => W / 2 + rot(p)[0] * S, Y = (p) => H / 2 - rot(p)[1] * S;
    const view = (p) => Math.abs(X(p) - W / 2) < W / 2 - 14 && Math.abs(Y(p) - H / 2) < H / 2 - 14;
    let s = `<rect class="bg" x="0" y="0" width="${W}" height="${H}"/>`, lines = '';
    const flip = (p) => (o.wrong === 'reverse' || (o.wrong === 'inside' && src.inside(p[0], p[1])) || (o.wrong === 'outside' && !src.inside(p[0], p[1])) ? -1 : 1);
    const headAt = (p, d) => { const a = rot(d), l = Math.hypot(a[0], a[1]); return head(X(p) + (6 * a[0]) / l, Y(p) - (6 * a[1]) / l, a[0] / l, -a[1] / l, 'v-field-head', 10, 4.5); };
    if (o.wrong === 'out' || o.wrong === 'in') {
      for (let k = 0; k < 8; k++) {
        const t = (k * Math.PI) / 4 + Math.PI / 8, u = [Math.cos(t), Math.sin(t)], a = [0.45 * u[0], 0.45 * u[1]], b = [2.6 * u[0], 2.6 * u[1]];
        lines += `<line class="fl" x1="${f1(X(a))}" y1="${f1(Y(a))}" x2="${f1(X(b))}" y2="${f1(Y(b))}"/>` + headAt([1.3 * u[0], 1.3 * u[1]], o.wrong === 'out' ? u : [-u[0], -u[1]]);
      }
    } else if (o.wrong !== 'none') {
      for (const y0 of src.seeds) {
        const ln = M.fieldLine(wires, 0, y0, [-7, 7, -7, 7]), pts = ln.pts;
        lines += `<path class="fl" d="M${pts.map((p) => `${f1(X(p))},${f1(Y(p))}`).join(' L')}"/>`;
        // arrows at the start (near the axis: not crowded) and at the point of the line in view
        // farthest from it
        const i0 = o.src === 'wire' || Math.abs(y0) < 0.3 ? pts.findIndex((p) => p[0] === 0 && p[1] === y0) : -1;
        let far = -1, best = 0;
        pts.forEach((p, i) => { const d = Math.hypot(p[0], p[1] - y0); if (view(p) && d > best) { best = d; far = i; } });
        for (const i of [i0, far]) {
          if (i < 0 || !view(pts[i])) continue;
          const b = M.planeField(wires, pts[i][0], pts[i][1]), k = flip(pts[i]);
          lines += headAt(pts[i], [k * b[0], k * b[1]]);
        }
      }
    }
    // the source
    let body = '';
    if (o.src === 'magnet') {
      const c = [[-1.75, -0.55], [1.75, 0.55]].map(rot), x0 = W / 2 + Math.min(c[0][0], c[1][0]) * S, y0 = H / 2 - Math.max(c[0][1], c[1][1]) * S;
      const w = Math.abs(c[1][0] - c[0][0]) * S, h = Math.abs(c[1][1] - c[0][1]) * S, n = o.s > 0 ? 1 : -1, np = [n * 0.9, 0], sp = [-n * 0.9, 0];
      // the halves: north red, south green-grey
      const half = (sign, cls) => { const q = [[0, -0.55], [sign * 1.75, 0.55]].map(rot); return `<rect class="${cls}" x="${f1(W / 2 + Math.min(q[0][0], q[1][0]) * S)}" y="${f1(H / 2 - Math.max(q[0][1], q[1][1]) * S)}" width="${f1(Math.abs(q[1][0] - q[0][0]) * S)}" height="${f1(Math.abs(q[1][1] - q[0][1]) * S)}"/>`; };
      body += half(n, 'pole-n') + half(-n, 'pole-s') + `<rect class="magnet" x="${f1(x0)}" y="${f1(y0)}" width="${f1(w)}" height="${f1(h)}"/>`;
      body += txt(X(np), Y(np) + 6, 'N', 'pole') + txt(X(sp), Y(sp) + 6, 'S', 'pole');
    } else {
      if (o.src !== 'wire') {
        // the outline of the loop or coil (cut open), drawn faintly
        const tw = wires.filter((w) => w.y > 0), x0 = Math.min(...tw.map((w) => w.x)), x1 = Math.max(...tw.map((w) => w.x)), yy = tw[0].y;
        for (const x of [...new Set([x0, x1])]) body += `<line class="coil-cut" x1="${f1(X([x, yy]))}" y1="${f1(Y([x, yy]))}" x2="${f1(X([x, -yy]))}" y2="${f1(Y([x, -yy]))}"/>`;
      }
      for (const w of wires) body += dotCross(X([w.x, w.y]), Y([w.x, w.y]), o.small ? 7 : 8.5, w.s > 0, 'v-wire');
    }
    // the magnet is drawn under its field lines, the wires over them
    s += o.src === 'magnet' ? body + `<g class="lines">${lines}</g>` : `<g class="lines">${lines}</g>` + body;
    return svg(W, H, s, o.label || L('Field lines', 'Feldlinien'), o.small ? 'small' : '');
  }

  const api = { icon, scene, linesFig, arrow, dotCross };
  root.MagPlot = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
