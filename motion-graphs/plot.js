// SVG diagrams for the motion graphs: the given graph, and the graph being drawn with its handles.
// A graph is a list of pieces {y0, ym, y1}; each piece is drawn as a quadratic Bézier curve
// through its three points (a parabola, or a straight line when ym is on the chord).
// Every quantity has its colour (class qc-s, qc-v, qc-a): s red, v blue, a green. Right and
// wrong pieces are therefore marked with ✓ / ✗ and a shaded band, not with colours.
(function (root) {
  'use strict';

  const { T } = root.Motion || require('./generator.js');
  const H = 250, L = 58, R = 20, TOP = 26, B = 34;
  let W = 640, R_HANDLE = 7;
  // Narrow screens get a narrower drawing (larger text and handles once scaled down).
  function setNarrow(narrow) { W = narrow ? 420 : 640; R_HANDLE = narrow ? 9 : 7; }
  const UNIT = { s: 'm', v: 'm/s', a: 'm/s²' };
  const f1 = (x) => Math.round(x * 10) / 10;
  const num = (x) => (x < 0 ? '−' + -x : String(x));

  const X = (t) => f1(L + (t / T) * (W - L - R));
  function scales(axis) {
    const h = H - TOP - B, span = axis.hi - axis.lo;
    return {
      x: X,
      y: (v) => f1(TOP + ((axis.hi - v) / span) * h),
      inv: (py) => axis.hi - ((py - TOP) / h) * span,
    };
  }

  // Spacing of the horizontal grid lines: 1 unit, or 2 units on tall axes.
  const gridStep = (axis) => (axis.hi - axis.lo > 40 ? 2 : 1);

  // Grid (1 s by gridStep), axes, labels, breakpoints and piece numbers;
  // wrong pieces (marks[i] === 'bad') get a shaded band.
  function frame(ex, axis, q, marks) {
    const s = scales(axis);
    const minor = gridStep(axis);
    let out = '';
    ex.pieces.forEach((p, i) => {
      if (marks && marks[i] === 'bad') out += `<rect class="band" x="${s.x(p.t0)}" y="${TOP - 24}" width="${f1(s.x(p.t1) - s.x(p.t0))}" height="${f1(s.y(axis.lo) - TOP + 24)}"/>`;
    });
    for (let t = 1; t <= T; t++) out += `<line class="grid" x1="${s.x(t)}" y1="${s.y(axis.hi)}" x2="${s.x(t)}" y2="${s.y(axis.lo)}"/>`;
    for (let v = axis.lo; v <= axis.hi; v += minor) if (v !== 0) out += `<line class="grid${v % axis.label === 0 ? ' major' : ''}" x1="${s.x(0)}" y1="${s.y(v)}" x2="${s.x(T)}" y2="${s.y(v)}"/>`;
    ex.pieces.forEach((p, i) => {
      if (i > 0) out += `<line class="bp" x1="${s.x(p.t0)}" y1="${TOP - 6}" x2="${s.x(p.t0)}" y2="${s.y(axis.lo)}"/>`;
      const mark = marks ? marks[i] : '';
      const sym = mark === 'ok' ? ' ✓' : mark === 'bad' ? ' ✗' : '';
      out += `<text class="pnum${mark ? ' ' + mark : ''}" x="${s.x((p.t0 + p.t1) / 2)}" y="${TOP - 10}" text-anchor="middle">${i + 1}${sym}</text>`;
    });
    out += `<line class="ax" x1="${s.x(0)}" y1="${s.y(axis.lo)}" x2="${s.x(0)}" y2="${s.y(axis.hi) - 6}"/>`;
    out += `<line class="ax" x1="${s.x(0)}" y1="${s.y(0)}" x2="${s.x(T) + 8}" y2="${s.y(0)}"/>`;
    for (let v = axis.lo; v <= axis.hi; v += axis.label) out += `<text class="tick" x="${s.x(0) - 6}" y="${s.y(v) + 4}" text-anchor="end">${num(v)}</text>`;
    for (let t = 0; t <= T; t++) out += `<text class="tick" x="${s.x(t)}" y="${s.y(axis.lo) + 16}" text-anchor="middle">${t}</text>`;
    out += `<text class="axis" x="${W - 4}" y="${H - 3}" text-anchor="end"><tspan class="it">t</tspan> in s</text>`;
    out += `<text class="axis qlabel" x="6" y="${TOP - 10}"><tspan class="it">${q}</tspan> in ${UNIT[q]}</text>`;
    return { s, svg: out };
  }

  // Path of a graph.
  function curve(ex, vals, s, extra) {
    let out = '';
    ex.pieces.forEach((p, i) => {
      const v = vals[i];
      const cy = 2 * v.ym - (v.y0 + v.y1) / 2;
      out += `<path class="curve${extra}" d="M${s.x(p.t0)},${s.y(v.y0)} Q${s.x((p.t0 + p.t1) / 2)},${s.y(cy)} ${s.x(p.t1)},${s.y(v.y1)}"/>`;
    });
    return out;
  }

  // Pointer position of a mouse event in the coordinates of the <svg> element el.
  function svgPoint(el, evt) {
    const pt = el.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    return pt.matrixTransform(el.getScreenCTM().inverse());
  }

  // The grid point nearest to (px, py), or null when the pointer is outside the plot area.
  function gridPoint(axis, px, py) {
    const s = scales(axis), step = gridStep(axis), m = 8;
    if (px < s.x(0) - m || px > s.x(T) + m || py < s.y(axis.hi) - m || py > s.y(axis.lo) + m) return null;
    const t = Math.min(T, Math.max(0, Math.round(((px - L) / (W - L - R)) * T)));
    const v = Math.min(axis.hi, Math.max(axis.lo, axis.lo + Math.round((s.inv(py) - axis.lo) / step) * step)) + 0; // + 0: no −0
    return { t, v, x: s.x(t), y: s.y(v) };
  }

  // Points where the graph vals crosses a grid line or the t axis (marked on: true).
  // Each piece y(u) = (1−u)²·y0 + 2u(1−u)·c + u²·y1 with t = t0 + u·(t1 − t0), as drawn by curve().
  function crossings(ex, axis, vals) {
    const s = scales(axis), step = gridStep(axis), levels = [0], out = [];
    for (let v = axis.lo; v <= axis.hi; v += step) if (v !== 0) levels.push(v);
    ex.pieces.forEach((p, i) => {
      const { y0, ym, y1 } = vals[i], c = 2 * ym - (y0 + y1) / 2, d = p.t1 - p.t0;
      const at = (u) => (1 - u) * (1 - u) * y0 + 2 * u * (1 - u) * c + u * u * y1;
      for (let t = Math.ceil(p.t0); t <= p.t1; t++) out.push({ t, v: at((t - p.t0) / d) });
      const a = y0 - 2 * c + y1, b = 2 * (c - y0);
      for (const v of levels) {
        let us;
        if (Math.abs(a) > 1e-9) {
          const D = b * b - 4 * a * (y0 - v);
          us = D < 0 ? [] : [(-b - Math.sqrt(D)) / (2 * a), (-b + Math.sqrt(D)) / (2 * a)];
        } else {
          us = Math.abs(b) > 1e-9 ? [(v - y0) / b] : []; // a flat piece on a grid line: its ends are grid points
        }
        for (const u of us) if (u > -1e-9 && u < 1 + 1e-9) out.push({ t: p.t0 + u * d, v });
      }
    });
    return out.map((g) => ({ ...g, x: s.x(g.t), y: s.y(g.v), on: true }));
  }

  // The point to show under the pointer: the nearest grid point, or a crossing of one of the
  // graphs in curves with the grid when that is nearer. null outside the plot area.
  function hoverPoint(ex, axis, curves, px, py) {
    const g = gridPoint(axis, px, py);
    if (!g) return null;
    let best = g, dist = Math.hypot(px - g.x, py - g.y);
    for (const vals of curves) {
      for (const c of crossings(ex, axis, vals)) {
        const dc = Math.hypot(px - c.x, py - c.y);
        if (dc <= dist) { best = c; dist = dc; } // on a tie, the point on the graph
      }
    }
    return best;
  }

  // Marker of the point g under the pointer: dot (ring on a graph), guides to the axes and its
  // coordinates, rounded to 0.01 with ≈ where that is not exact.
  function hoverMark(axis, q, g) {
    if (!g) return '';
    const s = scales(axis), x0 = s.x(0), y0 = s.y(Math.max(axis.lo, Math.min(axis.hi, 0)));
    const right = g.x < W - 150, above = g.y > TOP + 26;
    const val = (x) => {
      const r = Math.round(x * 100) / 100 + 0;
      return `${Math.abs(r - x) > 1e-9 ? '≈' : '='} ${num(r)}`;
    };
    const dot = g.on ? `<circle class="gp on" cx="${g.x}" cy="${g.y}" r="4.5"/>` : `<circle class="gp" cx="${g.x}" cy="${g.y}" r="3.5"/>`;
    return `<g class="hover"><line class="guide" x1="${x0}" y1="${g.y}" x2="${g.x}" y2="${g.y}"/>`
      + `<line class="guide" x1="${g.x}" y1="${y0}" x2="${g.x}" y2="${g.y}"/>${dot}`
      + `<text class="val" x="${f1(g.x + (right ? 10 : -10))}" y="${f1(g.y + (above ? -10 : 20))}" text-anchor="${right ? 'start' : 'end'}">`
      + `<tspan class="it">t</tspan> ${val(g.t)} s, <tspan class="it">${q}</tspan> ${val(g.v)} ${UNIT[q]}</text></g>`;
  }

  const svg = (body, label, attrs) => `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}"${attrs || ''}>${body}</svg>`;

  function sourceGraph(ex) {
    const q = ex.from;
    const { s, svg: grid } = frame(ex, ex.axes.source, q);
    return svg(`<g class="qc-${q}">${grid}${curve(ex, ex.source, s, '')}</g>`, `Given graph of ${q} against time`);
  }

  // Handles of the drawing, in the order the arrow keys go through them.
  // Derivative: the breakpoints n0 … n5. Integral: the breakpoints n1 … n5 (n0 is given) and
  // the middles m0 … m4, which bend the pieces.
  function handles(ex, vals) {
    const s = scales(ex.axes.target), out = [];
    if (ex.dir === 'diff') out.push({ id: 'n0', kind: 'n', i: 0, x: s.x(0), y: s.y(vals[0].y0), value: vals[0].y0, t: 0 });
    ex.pieces.forEach((p, i) => {
      const v = vals[i];
      if (ex.dir === 'int') out.push({ id: `m${i}`, kind: 'm', i, x: s.x((p.t0 + p.t1) / 2), y: s.y(v.ym), value: v.ym, t: (p.t0 + p.t1) / 2 });
      out.push({ id: `n${i + 1}`, kind: 'n', i: i + 1, x: s.x(p.t1), y: s.y(v.y1), value: v.y1, t: p.t1 });
    });
    return out;
  }

  function handleShape(h, cls) {
    const r = R_HANDLE;
    if (h.kind === 'm') return `<path class="${cls} mid" d="M${h.x},${f1(h.y - r)} L${f1(h.x + r)},${h.y} L${h.x},${f1(h.y + r)} L${f1(h.x - r)},${h.y} Z"/>`;
    return `<circle class="${cls}" cx="${h.x}" cy="${h.y}" r="${r}"/>`;
  }

  // The drawing: opts.marks (per piece 'ok' | 'bad'), opts.solution (show the correct graph),
  // opts.active (id of the selected or dragged handle), opts.locked (no handles),
  // opts.hover (grid point under the pointer).
  function targetGraph(ex, vals, opts) {
    const q = ex.to, o = opts || {};
    const { s, svg: grid } = frame(ex, ex.axes.target, q, o.marks);
    let body = grid;
    body += curve(ex, vals, s, ' drawn');
    if (o.solution) body += curve(ex, ex.answer, s, ' solution');
    body += hoverMark(ex.axes.target, q, o.hover);
    if (ex.dir === 'int') body += `<circle class="fixed" cx="${s.x(0)}" cy="${s.y(vals[0].y0)}" r="${R_HANDLE - 1}"/>`;
    if (!o.locked) {
      const hs = handles(ex, vals);
      for (const h of hs) body += handleShape(h, `handle${h.id === o.active ? ' active' : ''}`);
      const h = hs.find((x) => x.id === o.active);
      if (h) {
        const text = `${q}(${h.t} s) = ${num(Math.round(h.value * 100) / 100)} ${UNIT[q]}`;
        const right = h.x < W - 150, above = h.y > TOP + 26;
        body += `<text class="val" x="${f1(h.x + (right ? 12 : -12))}" y="${f1(h.y + (above ? -12 : 22))}" text-anchor="${right ? 'start' : 'end'}">${text}</text>`;
      }
    }
    return `<g class="qc-${q}">${body}</g>`;
  }

  const api = { get W() { return W; }, H, TOP, B, setNarrow, UNIT, scales, sourceGraph, targetGraph, handles, svg, num, svgPoint, hoverPoint, hoverMark };
  root.Plot = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
