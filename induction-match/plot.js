// SVG diagrams: flux Φ(t) made of straight and parabolic pieces, induced voltage V_ind(t) made
// of straight pieces. For the solution, the slopes of Φ (mWb/s) and the voltages (mV) of every
// interval are written in a row above the plot.
(function (root) {
  'use strict';

  const { T, PHI_MAX, V_MAX } = root.Induction || require('./generator.js');
  const W = 280, H = 196, L = 34, R = 44, TOP = 44, B = 26;
  const num = (x) => (x > 0 ? '+' + x : x < 0 ? '−' + -x : '0');
  const f1 = (x) => Math.round(x * 10) / 10;

  function frame(yMin, yMax, yLabelStep, yLabel) {
    const x = (t) => f1(L + (t / T) * (W - L - R));
    const y = (v) => f1(TOP + ((yMax - v) / (yMax - yMin)) * (H - TOP - B));
    let s = '';
    for (let t = 1; t <= T; t++) s += `<line class="grid" x1="${x(t)}" y1="${y(yMax)}" x2="${x(t)}" y2="${y(yMin)}"/>`;
    for (let v = yMin; v <= yMax; v++) if (v !== 0) s += `<line class="grid" x1="${x(0)}" y1="${y(v)}" x2="${x(T)}" y2="${y(v)}"/>`;
    s += `<line class="ax" x1="${x(0)}" y1="${y(yMin)}" x2="${x(0)}" y2="${y(yMax) - 8}"/>`;
    s += `<line class="ax" x1="${x(0)}" y1="${y(0)}" x2="${x(T) + 8}" y2="${y(0)}"/>`;
    for (let v = yMin; v <= yMax; v += yLabelStep) s += `<text class="tick" x="${x(0) - 5}" y="${y(v) + 4}" text-anchor="end">${num(v).replace('+', '')}</text>`;
    for (let t = 0; t <= T; t += 2) s += `<text class="tick" x="${x(t)}" y="${H - B + 16}" text-anchor="middle">${t}</text>`;
    s += `<text class="axis" x="${W - 4}" y="${H - B + 16}" text-anchor="end"><tspan class="it">t</tspan> in s</text>`;
    s += `<text class="axis" x="6" y="15">${yLabel}</text>`;
    return { x, y, s };
  }

  const svg = (body, label) =>
    `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">${body}</svg>`;

  // Solution labels: one per interval, in a row above the plot, with separators at the breakpoints.
  function labels(g, times, texts) {
    let s = '';
    times.slice(1, -1).forEach((t) => { s += `<line class="jump" x1="${g.x(t)}" y1="${TOP - 17}" x2="${g.x(t)}" y2="${TOP - 3}"/>`; });
    texts.forEach((text, i) => { s += `<text class="ann" x="${g.x((times[i] + times[i + 1]) / 2)}" y="${TOP - 6}" text-anchor="middle">${text}</text>`; });
    return s;
  }
  const range = (a, b) => (a === b ? num(a) : `${num(a)} → ${num(b)}`);

  // A curved interval is a parabola: one quadratic Bézier segment whose control point is where
  // the tangents at both ends meet (in the middle of the interval).
  function fluxGraph(times, values, segs, annotate) {
    const g = frame(0, PHI_MAX, 2, '<tspan class="it">Φ</tspan> in mWb');
    let d = `M${g.x(times[0])},${g.y(values[0])}`;
    segs.forEach((sg, i) => {
      const t0 = times[i], t1 = times[i + 1], len = t1 - t0, p0 = values[i], p1 = values[i + 1];
      d += sg.d0 === sg.d1
        ? ` L${g.x(t1)},${g.y(p1)}`
        : ` Q${g.x(t0 + len / 2)},${g.y(p0 + (sg.d0 * len) / 2)} ${g.x(t1)},${g.y(p1)}`;
    });
    const ann = annotate ? labels(g, times, segs.map((sg) => range(sg.d0, sg.d1))) : '';
    return svg(g.s + `<path class="curve" d="${d}"/>` + ann, 'Graph of the magnetic flux against time');
  }

  function voltGraph(times, segs, annotate) {
    const g = frame(-V_MAX, V_MAX, 1, '<tspan class="it">V</tspan><tspan class="sub" dy="3">ind</tspan><tspan dy="-3"> in mV</tspan>');
    let s = g.s;
    segs.forEach((sg, i) => {
      const prev = segs[i - 1];
      if (prev && prev.v1 !== sg.v0) s += `<line class="jump" x1="${g.x(times[i])}" y1="${g.y(prev.v1)}" x2="${g.x(times[i])}" y2="${g.y(sg.v0)}"/>`;
    });
    segs.forEach((sg, i) => {
      const x0 = g.x(times[i]), x1 = g.x(times[i + 1]), y0 = g.y(sg.v0), y1 = g.y(sg.v1);
      s += `<line class="curve" x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}"/>`;
    });
    if (annotate) s += labels(g, times, segs.map((sg) => range(sg.v0, sg.v1)));
    return svg(s, 'Graph of the induced voltage against time');
  }

  const api = { fluxGraph, voltGraph, num, range };
  root.Plot = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
