// Graphs y(t) as SVG, in the manner of Motion Graphs: a light grid, the axes with their labels,
// and one or more curves (in the colour of the quantity: class qc-y, qc-v or qc-a).
//   Plot.graph(curves, o)   curves: [{ pts: [[t, y], …], cls }]; o: { name (the vertical
//                           quantity, plain text: 'x', 'ξ', 'v', …), unit, tEnd, axis { lo, hi,
//                           step } (else from the curves), tStep, q ('y', 'v' or 'a'), label (aria),
//                           marks: [t] (dashed vertical lines), dots: [[t, y]], band: [t0, t1],
//                           tLabel: the label of the time axis (SVG), by default "t in s" }
//   Plot.niceAxis(values)   an axis with room for the values and 0
//   Plot.alike(a, b, span)  two curves (same times) nowhere more than 6 % of span apart
//   Plot.plain(tex)         a variable's TeX as plain text (\xi → ξ)
(function (root) {
  'use strict';

  const f1 = (x) => Math.round(x * 10) / 10;
  const num = (x) => { const s = String(Math.round(x * 1000) / 1000); return s.startsWith('-') ? `−${s.slice(1)}` : s; };
  const PLAIN = { '\\xi': 'ξ', '\\psi': 'ψ', '\\varphi': 'φ', '\\alpha': 'α', '\\beta': 'β', '\\delta': 'δ', '\\kappa': 'κ', '\\lambda': 'λ', '\\omega': 'ω', '\\gamma': 'γ' };
  const plain = (tex) => PLAIN[tex] || tex;

  const STEPS = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500];
  function niceAxis(vals) {
    let lo = Math.min(0, ...vals), hi = Math.max(0, ...vals);
    const pad = 0.1 * (hi - lo || 1);
    if (lo < 0) lo -= pad;
    if (hi > 0) hi += pad;
    const step = STEPS.find((x) => (hi - lo) / x <= 6) || 1000;
    return { lo: Math.floor(lo / step + 1e-9) * step, hi: Math.ceil(hi / step - 1e-9) * step, step };
  }
  // a step for the time axis: about five to ten labels
  const tStepOf = (T) => STEPS.find((x) => T / x <= 10) || 1000;

  const alike = (a, b, span) => Math.max(...a.map((p, i) => Math.abs(p[1] - b[i][1]))) < 0.06 * span;

  const GW = 360, GH = 210, GL = 46, GR = 30, GT = 28, GB = 36;
  function graph(curves, o = {}) {
    const T = o.tEnd, axis = o.axis || niceAxis(curves.flatMap((c) => c.pts.map((p) => p[1])));
    const { lo, hi, step } = axis;
    const clip = (v) => Math.max(lo - 0.04 * (hi - lo), Math.min(hi + 0.04 * (hi - lo), v));
    const x = (t) => f1(GL + (t / T) * (GW - GL - GR));
    const y = (v) => f1(GT + ((hi - clip(v)) / (hi - lo)) * (GH - GT - GB));
    const ts = o.tStep || tStepOf(T);
    let s = '';
    if (o.band) s += `<rect class="band" x="${x(o.band[0])}" y="${y(hi)}" width="${f1(x(o.band[1]) - x(o.band[0]))}" height="${f1(y(lo) - y(hi))}"/>`;
    for (let t = ts / 2; t <= T + 1e-9; t += ts / 2) s += `<line class="grid${Math.abs(t / ts - Math.round(t / ts)) < 1e-9 ? ' major' : ''}" x1="${x(t)}" y1="${y(hi)}" x2="${x(t)}" y2="${y(lo)}"/>`;
    for (let v = lo; v <= hi + 1e-9; v += step / 2) if (Math.abs(v) > 1e-9) s += `<line class="grid${Math.abs(v / step - Math.round(v / step)) < 1e-9 ? ' major' : ''}" x1="${x(0)}" y1="${y(v)}" x2="${x(T)}" y2="${y(v)}"/>`;
    for (const t of o.marks || []) s += `<line class="vline" x1="${x(t)}" y1="${y(hi)}" x2="${x(t)}" y2="${y(lo)}"/>`;
    s += `<line class="ax" x1="${x(0)}" y1="${y(lo)}" x2="${x(0)}" y2="${y(hi) - 6}"/>`;
    s += `<line class="ax" x1="${x(0)}" y1="${y(0)}" x2="${x(T) + 8}" y2="${y(0)}"/>`;
    for (let v = lo; v <= hi + 1e-9; v += step) s += `<text class="tick" x="${x(0) - 6}" y="${y(v) + 4}" text-anchor="end">${num(v)}</text>`;
    for (let t = 0; t <= T + 1e-9; t += ts) s += `<text class="tick" x="${x(t)}" y="${y(lo) + 16}" text-anchor="middle">${num(t)}</text>`;
    s += `<text class="axis" x="${GW - 4}" y="${GH - 4}" text-anchor="end">${o.tLabel || '<tspan class="it">t</tspan> in s'}</text>`;
    s += `<text class="axis qlabel" x="6" y="16"><tspan class="it">${o.name || 'y'}</tspan>${o.unit ? ` in ${o.unit}` : ''}</text>`;
    // a curve that leaves the axis ends at its edge
    const inside = (v) => v >= lo - 0.04 * (hi - lo) && v <= hi + 0.04 * (hi - lo);
    for (const c of curves) {
      const out = c.pts.findIndex(([, v]) => !inside(v)), pts = out < 0 ? c.pts : c.pts.slice(0, out + 1);
      if (pts.length > 1) s += `<path class="curve${c.cls ? ` ${c.cls}` : ''}" d="M${pts.map(([t, v]) => `${x(t)},${y(v)}`).join(' L')}"/>`;
    }
    for (const [t, v] of o.dots || []) s += `<circle class="tdot" cx="${x(t)}" cy="${y(v)}" r="3.6"/>`;
    return `<svg class="ygraph" viewBox="0 0 ${GW} ${GH}" role="img" aria-label="${o.label || ''}"><g class="qc-${o.q || 'y'}">${s}</g></svg>`;
  }

  root.Plot = { graph, niceAxis, alike, plain, tStepOf };
  if (typeof module !== 'undefined') module.exports = root.Plot;
})(typeof window !== 'undefined' ? window : globalThis);
