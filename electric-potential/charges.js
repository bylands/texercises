// Electric fields and potentials of simple configurations, their field lines and equipotentials,
// and SVG drawings of them (taken over from Electric Field). Lengths in the drawing's units, charges
// in units of q; the field is k·q·r̂/r² and the potential k·q/r with k = 1 (the drawings only need
// shapes and directions).
//   config kinds:
//     { kind: 'points', charges: [{ q, x, y, name }] }
//     { kind: 'uniform', E: [ex, ey] }
//   field(c, x, y) → [Ex, Ey], potential(c, x, y)
//   lines(c, box, o)       field lines: arrays of points, from + to − (or to the edge)
//   contours(c, box, levels)  equipotential segments
//   fig(c, o)              an SVG: the configuration, its field lines and/or equipotentials
(function (root) {
  'use strict';

  const Lang = root.Lang || require('./lang.js');
  const L = (en, de) => Lang.L(en, de);
  const f1 = (x) => Math.round(x * 10) / 10;
  let uid = 0;

  // ---------------------------------------------------------------- fields and potentials
  const sources = (c) => (c.kind === 'points' ? c.charges : []);
  function field(c, x, y) {
    if (c.kind === 'uniform') return [...c.E];
    let ex = 0, ey = 0;
    for (const s of sources(c)) {
      const dx = x - s.x, dy = y - s.y, r2 = dx * dx + dy * dy, r3 = r2 * Math.sqrt(r2) || 1e-12;
      ex += (s.q * dx) / r3; ey += (s.q * dy) / r3;
    }
    return [ex, ey];
  }
  function potential(c, x, y) {
    if (c.kind === 'uniform') return -(c.E[0] * x + c.E[1] * y);
    let v = 0;
    for (const s of sources(c)) v += s.q / (Math.hypot(x - s.x, y - s.y) || 1e-9);
    return v;
  }
  // where a field line ends: at a charge, on a conductor, outside the box
  function blocked(c, x, y, box, sinkR) {
    if (x < box[0] - 0.3 || x > box[1] + 0.3 || y < box[2] - 0.3 || y > box[3] + 0.3) return true;
    return c.kind === 'points' && sources(c).some((s) => Math.hypot(x - s.x, y - s.y) < sinkR);
  }
  // one field line from (x, y), along the field (dir 1) or against it (−1), by RK4 on the unit field
  function trace(c, x, y, dir, box, o = {}) {
    const h = o.step || 0.03, pts = [[x, y]], sinkR = o.sinkR || 0.1;
    const u = (px, py) => { const [ex, ey] = field(c, px, py), n = Math.hypot(ex, ey) || 1e-12; return [(dir * ex) / n, (dir * ey) / n]; };
    for (let i = 0; i < (o.max || 900); i++) {
      const k1 = u(x, y), k2 = u(x + (h / 2) * k1[0], y + (h / 2) * k1[1]), k3 = u(x + (h / 2) * k2[0], y + (h / 2) * k2[1]), k4 = u(x + h * k3[0], y + h * k3[1]);
      x += (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); y += (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
      pts.push([x, y]);
      if (i > 2 && blocked(c, x, y, box, sinkR)) break;
    }
    return pts;
  }
  // Field lines, from + to −: o.per lines (default 8) for a charge of size 1. A drawing is a
  // section through the field in space: of N ∝ |q| lines evenly spread in space, about √N lie in
  // one plane, so a charge gets o.per·√|q| lines. From each positive charge, evenly spread; then
  // from each negative charge (backwards) where no line has arrived.
  function lines(c, box, o = {}) {
    const per = o.per || 8, r0 = 0.12, out = [];
    if (c.kind === 'uniform') {
      const [ex, ey] = c.E, n = Math.hypot(ex, ey), ux = ex / n, uy = ey / n;
      for (let k = -6; k <= 6; k++) {
        const ox = -uy * k * (o.gap || 0.7), oy = ux * k * (o.gap || 0.7);
        out.push([[ox - ux * 20, oy - uy * 20], [ox + ux * 20, oy + uy * 20]]);
      }
      return out;
    }
    const shown = sources(c), arrivals = new Map();
    for (const s of shown.filter((s) => s.q > 0)) {
      const n = Math.max(1, Math.round(per * Math.sqrt(s.q))), a0 = o.offset || Math.PI / n / 2;
      for (let k = 0; k < n; k++) {
        const a = a0 + (2 * Math.PI * k) / n, pts = trace(c, s.x + r0 * Math.cos(a), s.y + r0 * Math.sin(a), 1, box);
        out.push(pts);
        const e = pts[pts.length - 1], sink = shown.find((t) => t.q < 0 && Math.hypot(e[0] - t.x, e[1] - t.y) < 0.2);
        if (sink) { if (!arrivals.has(sink)) arrivals.set(sink, []); arrivals.get(sink).push(Math.atan2(e[1] - sink.y, e[0] - sink.x)); }
      }
    }
    for (const s of shown.filter((s) => s.q < 0)) {
      const n = Math.max(1, Math.round(per * Math.sqrt(-s.q))), got = arrivals.get(s) || [], gap = Math.PI / n;
      for (let k = 0; k < n; k++) {
        const a = (o.offset || gap / 2) + (2 * Math.PI * k) / n;
        if (got.some((b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b))) < gap * 0.9)) continue;
        out.push(trace(c, s.x + r0 * Math.cos(a), s.y + r0 * Math.sin(a), -1, box).reverse());
      }
    }
    return out;
  }
  // equipotential segments by marching squares on a grid
  function contours(c, box, levels, o = {}) {
    const n = o.n || 120, [x0, x1, y0, y1] = box, dx = (x1 - x0) / n, ny = Math.round((y1 - y0) / dx), segs = [];
    const V = [];
    for (let j = 0; j <= ny; j++) { V.push([]); for (let i = 0; i <= n; i++) V[j].push(potential(c, x0 + i * dx, y0 + j * dx)); }
    const near = (x, y) => c.kind === 'points' && sources(c).some((s) => Math.hypot(x - s.x, y - s.y) < 0.15);
    for (const lv0 of levels) {
      const lv = lv0 + 1e-7; // a grid point exactly on the level would break the line
      for (let j = 0; j < ny; j++) for (let i = 0; i < n; i++) {
        const xs = x0 + i * dx, ys = y0 + j * dx, v = [V[j][i], V[j][i + 1], V[j + 1][i + 1], V[j + 1][i]], p = [[xs, ys], [xs + dx, ys], [xs + dx, ys + dx], [xs, ys + dx]];
        if (near(xs, ys)) continue;
        const pts = [];
        for (let e = 0; e < 4; e++) {
          const a = v[e], b = v[(e + 1) % 4];
          if ((a - lv) * (b - lv) < 0) { const t = (lv - a) / (b - a), A = p[e], B = p[(e + 1) % 4]; pts.push([A[0] + t * (B[0] - A[0]), A[1] + t * (B[1] - A[1])]); }
        }
        if (pts.length >= 2) segs.push([pts[0], pts[1]]);
        if (pts.length === 4) segs.push([pts[2], pts[3]]);
      }
    }
    return segs;
  }

  // ---------------------------------------------------------------- drawing
  const svg = (w, h, body, label, cls = '') => `<svg class="ef ${cls}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}">${body}</svg>`;
  const txt = (x, y, s, cls = 'lbl', anchor = 'middle') => `<text class="${cls}" x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor}">${s}</text>`;
  const head = (x, y, ux, uy, cls, H = 9, B = 4) => { const bx = x - H * ux, by = y - H * uy; return `<polygon class="${cls}" points="${f1(x)},${f1(y)} ${f1(bx - B * uy)},${f1(by + B * ux)} ${f1(bx + B * uy)},${f1(by - B * ux)}"/>`; };
  function arrow(x1, y1, x2, y2, cls, w = 2.4) {
    const d = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / d, uy = (y2 - y1) / d;
    return `<line class="${cls}" stroke-width="${w}" x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2 - 7 * ux)}" y2="${f1(y2 - 7 * uy)}"/>` + head(x2, y2, ux, uy, `${cls}-head`);
  }
  // a charge: its sign (or its name, for a charge to be found), larger for a larger charge
  function charge(X, Y, q, o = {}) {
    const r = 9 + 3 * Math.min(2, Math.abs(q) - 1), cls = o.unknown ? 'neu' : q > 0 ? 'pos' : q < 0 ? 'neg' : 'neu';
    const lbl = o.label != null ? o.label : q > 0 ? (Math.abs(q) > 1 ? `+${Math.abs(q)}` : '+') : q < 0 ? (Math.abs(q) > 1 ? `−${Math.abs(q)}` : '−') : '0';
    return `<circle class="charge ${cls}" cx="${f1(X)}" cy="${f1(Y)}" r="${r}"/>` + txt(X, Y + 4.5, lbl, lbl.length > 2 ? 'sign small' : 'sign');
  }
  // o: { box, W, lines (or given: an array of lines), reverse (arrows the wrong way), equi (levels),
  //      labels (charge labels), unknown (charges grey with their names), points [{ x, y, name }],
  //      vecs [{ x, y, dx, dy (px), cls, name }], rods [[x1, y1, x2, y2]], parts [{ x, y, q, sym }]
  //      (particles), names [{ x, y, name }], small; equipotentials: equi (levels; of o.alt if given),
//      equiLines (o.given drawn as equipotentials), circles (radii, around o.centres), vlines,
//      tops [{ x, label }] (above the lines), labelsAt [{ x, y, label }]; extra (more field lines) }
  function fig(c, o = {}) {
    const box = o.box || [-3, 3, -2.2, 2.2], [x0, x1, y0, y1] = box, W = o.W || (o.small ? 260 : 380), S = W / (x1 - x0), H = Math.round((y1 - y0) * S);
    const X = (x) => (x - x0) * S, Y = (y) => (y1 - y) * S, id = `efc${++uid}`;
    let s = `<rect class="bg" x="0" y="0" width="${W}" height="${H}"/><clipPath id="${id}"><rect x="0" y="0" width="${W}" height="${H}"/></clipPath><g clip-path="url(#${id})">`;
    // a grid (o.grid: lines at whole units) or the axis through the charges (o.axis)
    if (o.grid) { for (let x = Math.ceil(x0); x <= x1; x++) s += `<line class="grid" x1="${f1(X(x))}" y1="0" x2="${f1(X(x))}" y2="${H}"/>`; for (let y = Math.ceil(y0); y <= y1; y++) s += `<line class="grid" x1="0" y1="${f1(Y(y))}" x2="${W}" y2="${f1(Y(y))}"/>`; }
    if (o.axis) s += `<line class="axisline" x1="0" y1="${f1(Y(0))}" x2="${W}" y2="${f1(Y(0))}"/>`;
    // equipotentials: contours (of o.alt, another arrangement, for a wrong picture), given lines
    // (o.equiLines), circles around the centres, vertical lines
    if (o.equi) for (const [a, b] of contours(o.alt || c, box, o.equi, { n: o.small ? 70 : 120 })) s += `<line class="equi" x1="${f1(X(a[0]))}" y1="${f1(Y(a[1]))}" x2="${f1(X(b[0]))}" y2="${f1(Y(b[1]))}"/>`;
    const poly = (ln, cls) => `<path class="${cls}" d="M${ln.map((p) => `${f1(X(p[0]))},${f1(Y(p[1]))}`).join(' L')}"/>`;
    if (o.equiLines) for (const ln of o.given || []) s += poly(ln, 'equi');
    for (const [cx, cy] of o.circles ? o.centres || [[0, 0]] : []) for (const rr of o.circles) s += `<circle class="equi" cx="${f1(X(cx))}" cy="${f1(Y(cy))}" r="${f1(rr * S)}" fill="none"/>`;
    for (const x of o.vlines || []) s += poly([[x, y0 - 1], [x, y1 + 1]], 'equi');
    // field lines with arrowheads
    // a straight line given by its two ends gets points in between (for its arrowhead)
    const dense = (ln) => (ln.length !== 2 ? ln : Array.from({ length: 161 }, (x, k) => [ln[0][0] + ((ln[1][0] - ln[0][0]) * k) / 160, ln[0][1] + ((ln[1][1] - ln[0][1]) * k) / 160]));
    const ls = (o.equiLines ? [] : o.given || (o.lines ? lines(c, box, o.lineOpts || {}) : [])).concat(o.extra || []).map(dense);
    for (const ln of ls) {
      const pts = ln.filter((p, i) => i % 2 === 0 || i === ln.length - 1);
      if (pts.length < 2) continue;
      s += `<path class="fline" d="M${pts.map((p) => `${f1(X(p[0]))},${f1(Y(p[1]))}`).join(' L')}"/>`;
      // the arrowhead where the line is in view, a third of the way along
      const vis = ln.filter((p) => p[0] > x0 + 0.1 && p[0] < x1 - 0.1 && p[1] > y0 + 0.1 && p[1] < y1 - 0.1);
      if (vis.length > 6) {
        const k = Math.floor(vis.length * (o.arrowAt || 0.45)), a = vis[k], b = vis[Math.min(vis.length - 1, k + 2)], d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
        const ux = ((b[0] - a[0]) / d) * (o.reverse ? -1 : 1), uy = (-(b[1] - a[1]) / d) * (o.reverse ? -1 : 1);
        s += head(X(a[0]) + 4 * ux, Y(a[1]) + 4 * uy, ux, uy, 'fline-head', 8, 3.6);
      }
    }
    s += '</g>';
    // the charges, the points, the vectors
    if (c.kind === 'points') {
      c.charges.forEach((ch, i) => { s += charge(X(ch.x), Y(ch.y), ch.q, { unknown: o.unknown, label: o.unknown ? ch.name || 'ABC'[i] : o.labels ? o.labels[i] : null }); });
    }
    for (const r of o.rods || []) s += `<line class="rod" x1="${f1(X(r[0]))}" y1="${f1(Y(r[1]))}" x2="${f1(X(r[2]))}" y2="${f1(Y(r[3]))}"/>`;
    for (const pt of o.parts || []) s += particle(X(pt.x), Y(pt.y), pt.r || 11, pt.q, pt.sym);
    for (const n of o.names || []) s += txt(X(n.x) + 14, Y(n.y) - 12, n.name, 'lbl name', 'start');
    for (const t of o.labelsAt || []) s += txt(X(t.x) + 4, Y(t.y), t.label, 'lbl small equi-lbl', 'start');
    for (const p of o.points || []) s += `<circle class="pt" cx="${f1(X(p.x))}" cy="${f1(Y(p.y))}" r="3.6"/>` + txt(X(p.x) + 8, Y(p.y) - 8, p.name, 'lbl', 'start');
    for (const v of o.vecs || []) s += arrow(X(v.x), Y(v.y), X(v.x) + v.dx, Y(v.y) - v.dy, v.cls || 'v-field') + (v.name ? txt(X(v.x) + v.dx + (v.dx >= 0 ? 8 : -8), Y(v.y) - v.dy - 6, v.name, `lbl ${v.cls || 'v-field'}-lbl`, v.dx >= 0 ? 'start' : 'end') : '');
    // labels above the picture (o.tops), in a strip of their own, kept inside at the edges
    if (o.tops) {
      const T = 24, tops = o.tops.map((t) => { const x = X(t.x); return txt(x, 17, String(t.label).replace(/-(?=\d)/g, '−'), 'lbl small', x < 36 ? 'start' : x > W - 36 ? 'end' : 'middle'); }).join('');
      s = `<rect class="bg" x="0" y="0" width="${W}" height="${H + T}"/>${tops}<g transform="translate(0,${T})">${s}</g>`;
      return svg(W, H + T, s, o.label || L('Field lines of the arrangement', 'Feldlinien der Anordnung'), o.small ? 'small' : '');
    }
    return svg(W, H, s, o.label || L('Field lines of the arrangement', 'Feldlinien der Anordnung'), o.small ? 'small' : '');
  }

  // a particle: its symbol (a named one, in a neutral colour, its sign not shown) or its sign
  function particle(X, Y, r, q, sym) {
    return `<circle class="charge ${sym ? 'named' : q > 0 ? 'pos' : q < 0 ? 'neg' : 'neu'}" cx="${f1(X)}" cy="${f1(Y)}" r="${r}"/>` +
      txt(X, Y + 4.5, sym || (q > 0 ? '+' : q < 0 ? '−' : '0'), `sign${sym && sym.length > 2 ? ' small' : ''}`);
  }
  // a direction as a small picture: an arrow in the page, or a dot for none
  function icon(d) {
    const c = 22;
    if (!d) return svg(44, 44, `<circle class="pt" cx="${c}" cy="${c}" r="4"/>`, L('none', 'keine'), 'icon');
    const l = Math.hypot(d[0], d[1]), ux = d[0] / l, uy = -d[1] / l;
    return svg(44, 44, arrow(c - 15 * ux, c - 15 * uy, c + 16 * ux, c + 16 * uy, 'v-dir', 3), L('an arrow', 'ein Pfeil'), 'icon');
  }
  const api = { sources, field, potential, trace, lines, contours, fig, arrow, txt, svg, charge, head, particle, icon };
  root.Charges = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
