// Drawings for the exercises of concepts.js: v(t) graphs (lines solid or dashed, areas under v
// shaded by sign, times marked). They use the classes and colours of plot.js (grid, ax, tick,
// axis, qlabel, curve, qc-v, area pos / neg), so the styles, the dark mode and fit.js apply as
// they do to the drawing exercises.
(function (root) {
  'use strict';

  const Lang = root.Lang || require('./lang.js');
  const L = (en, de) => Lang.L(en, de);
  const UNIT = { s: 'm', v: 'm/s', a: 'm/s²' };
  const f1 = (x) => Math.round(x * 10) / 10;
  const dec = (x) => String(x); // decimal point in both languages
  const num = (x) => (x < 0 ? '−' + dec(-x) : dec(x));

  // ---------------------------------------------------------------- graphs
  // A graph of quantity q ('s', 'v' or 'a') over 0 … T s, the vertical axis from lo to hi with a label
  // every `step`. lines: [{ pts: [[t, y], …] (straight between them), name, dash, at: t (where the
  // name goes) }]. opts.areas: [[t0, v0, t1, v1], …] shaded between v and the t axis, by sign;
  // opts.marks: times with a dashed vertical line; opts.dots: [[t, y], …] marked points;
  // opts.tStep, opts.tLabel: a grid line and a label on the time axis every so many seconds (by
// default every 1 and 2 s, or 0.5 and 1 s up to T = 6 s); opts.label: an aria label.
  const GW = 360, GH = 230, GL = 48, GR = 36, GT = 30, GB = 38;
  function graph(q, axis, T, lines, opts = {}) {
    const { lo, hi, step } = axis;
    const x = (t) => f1(GL + (t / T) * (GW - GL - GR));
    const y = (v) => f1(GT + ((hi - v) / (hi - lo)) * (GH - GT - GB));
    let s = '';
    const tStep = opts.tStep || (T > 6 ? 1 : 0.5), tLabel = opts.tLabel || (T > 6 ? 2 : 1);
    for (let t = tStep; t <= T + 1e-9; t += tStep) s += `<line class="grid${Math.abs(t / tLabel - Math.round(t / tLabel)) < 1e-9 ? ' major' : ''}" x1="${x(t)}" y1="${y(hi)}" x2="${x(t)}" y2="${y(lo)}"/>`;
    const vMinor = step >= 2 ? step / 2 : step;
    for (let v = lo; v <= hi + 1e-9; v += vMinor) if (Math.abs(v) > 1e-9) s += `<line class="grid${Math.abs(v / step - Math.round(v / step)) < 1e-9 ? ' major' : ''}" x1="${x(0)}" y1="${y(v)}" x2="${x(T)}" y2="${y(v)}"/>`;
    for (const [t0, v0, t1, v1] of opts.areas || []) s += area(x, y, t0, v0, t1, v1);
    for (const t of opts.marks || []) s += `<line class="vline" x1="${x(t)}" y1="${y(hi)}" x2="${x(t)}" y2="${y(lo)}"/>`;
    s += `<line class="ax" x1="${x(0)}" y1="${y(lo)}" x2="${x(0)}" y2="${y(hi) - 6}"/>`;
    s += `<line class="ax" x1="${x(0)}" y1="${y(0)}" x2="${x(T) + 8}" y2="${y(0)}"/>`;
    for (let v = lo; v <= hi + 1e-9; v += step) s += `<text class="tick" x="${x(0) - 6}" y="${y(v) + 4}" text-anchor="end">${num(f1(v))}</text>`;
    for (let t = 0; t <= T + 1e-9; t += tLabel) s += `<text class="tick" x="${x(t)}" y="${y(lo) + 16}" text-anchor="middle">${num(t)}</text>`;
    s += `<text class="axis" x="${GW - 4}" y="${GH - 4}" text-anchor="end"><tspan class="it">t</tspan> in s</text>`;
    s += `<text class="axis qlabel" x="6" y="16"><tspan class="it">${q}</tspan> in ${UNIT[q]}</text>`;
    for (const ln of lines) {
      s += `<path class="curve${ln.dash ? ' dashed' : ''}" d="M${ln.pts.map(([t, v]) => `${x(t)},${y(v)}`).join(' L')}"/>`;
      if (ln.name) {
        // the name next to the line at time `at`, on the side away from the other lines
        const at = ln.at != null ? ln.at : (ln.pts[0][0] + ln.pts[ln.pts.length - 1][0]) / 2;
        const v = valueAt(ln.pts, at), above = ln.below ? 16 : -8;
        s += `<text class="lname" x="${x(at)}" y="${f1(y(v) + above)}" text-anchor="middle">${ln.name}</text>`;
      }
    }
    for (const [t, v] of opts.dots || []) s += `<circle class="tdot" cx="${x(t)}" cy="${y(v)}" r="3.6"/>`;
    return `<svg class="cgraph" viewBox="0 0 ${GW} ${GH}" role="img" aria-label="${opts.label || ''}"><g class="qc-${q}">${s}</g></svg>`;
  }

  // the value of a polyline at time t
  function valueAt(pts, t) {
    for (let i = 1; i < pts.length; i++) {
      const [t0, v0] = pts[i - 1], [t1, v1] = pts[i];
      if (t <= t1 + 1e-9) return t1 === t0 ? v1 : v0 + ((v1 - v0) * (t - t0)) / (t1 - t0);
    }
    return pts[pts.length - 1][1];
  }

  // The area between a straight piece from (t0, v0) to (t1, v1) and the t axis, split by sign.
  function area(x, y, t0, v0, t1, v1) {
    const poly = (pts, cls) => `<polygon class="area ${cls}" points="${pts.map(([t, v]) => `${x(t)},${y(v)}`).join(' ')}"/>`;
    if (v0 * v1 >= 0) return v0 === 0 && v1 === 0 ? '' : poly([[t0, 0], [t0, v0], [t1, v1], [t1, 0]], v0 + v1 >= 0 ? 'pos' : 'neg');
    const tc = t0 + ((t1 - t0) * v0) / (v0 - v1);
    return poly([[t0, 0], [t0, v0], [tc, 0]], v0 > 0 ? 'pos' : 'neg') + poly([[tc, 0], [t1, v1], [t1, 0]], v1 > 0 ? 'pos' : 'neg');
  }

  const api = { graph, valueAt, num, dec };
  root.Figs = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
