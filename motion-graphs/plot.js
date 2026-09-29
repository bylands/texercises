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

  // Grid (1 s by 1 unit, or 2 units on tall axes), axes, labels, breakpoints and piece numbers;
  // wrong pieces (marks[i] === 'bad') get a shaded band.
  function frame(ex, axis, q, marks) {
    const s = scales(axis);
    const minor = axis.hi - axis.lo > 40 ? 2 : 1;
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
  // opts.active (id of the selected or dragged handle), opts.locked (no handles).
  function targetGraph(ex, vals, opts) {
    const q = ex.to, o = opts || {};
    const { s, svg: grid } = frame(ex, ex.axes.target, q, o.marks);
    let body = grid;
    body += curve(ex, vals, s, ' drawn');
    if (o.solution) body += curve(ex, ex.answer, s, ' solution');
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

  const api = { get W() { return W; }, H, TOP, B, setNarrow, UNIT, scales, sourceGraph, targetGraph, handles, svg, num };
  root.Plot = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
