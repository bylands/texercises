// Drawings for the exercises of concepts.js: s(t) and v(t) graphs of one or more motions (named
// lines, solid or dashed, areas under v shaded by sign), the stroboscope picture (a number line
// with one dot per second) and the value table. They use the classes and colours of plot.js
// (grid, ax, tick, axis, qlabel, curve, qc-s / qc-v, area pos / neg), so the styles, the dark
// mode, the arcade's colours and fit.js apply as they do to the drawing exercises.
(function (root) {
  'use strict';

  const Lang = root.Lang || require('./lang.js');
  const L = (en, de) => Lang.L(en, de);
  const UNIT = { s: 'm', v: 'm/s' };
  const f1 = (x) => Math.round(x * 10) / 10;
  const dec = (x) => String(x); // decimal point in both languages
  const num = (x) => (x < 0 ? '−' + dec(-x) : dec(x));

  // ---------------------------------------------------------------- graphs
  // A graph of quantity q ('s' or 'v') over 0 … T s, the vertical axis from lo to hi with a label
  // every `step`. lines: [{ pts: [[t, y], …] (straight between them), name, dash, at: t (where the
  // name goes) }]. opts.areas: [[t0, v0, t1, v1], …] shaded between v and the t axis, by sign;
  // opts.band: [t0, t1] highlighted; opts.marks: times with a dashed vertical line; opts.dots:
  // [[t, y], …] marked points; opts.label: an aria label.
  const GW = 360, GH = 230, GL = 48, GR = 36, GT = 30, GB = 38;
  function graph(q, axis, T, lines, opts = {}) {
    const { lo, hi, step } = axis;
    const x = (t) => f1(GL + (t / T) * (GW - GL - GR));
    const y = (v) => f1(GT + ((hi - v) / (hi - lo)) * (GH - GT - GB));
    let s = '';
    if (opts.band) s += `<rect class="band focus" x="${x(opts.band[0])}" y="${y(hi)}" width="${f1(x(opts.band[1]) - x(opts.band[0]))}" height="${f1(y(lo) - y(hi))}"/>`;
    const tStep = T > 6 ? 1 : 0.5, tLabel = T > 6 ? 2 : 1;
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

  // ---------------------------------------------------------------- stroboscope picture
  // Dots at the positions xs (m) at t = 0, 1, 2, … s on a number line from lo to hi, each with its
  // time above it; dots that would overlap an earlier one are lifted to a row of their own.
  const SW = 380, SH = 104, SL = 16, SR = 34;
  function strobe(xs, lo, hi, opts = {}) {
    const x = (v) => f1(SL + ((v - lo) / (hi - lo)) * (SW - SL - SR));
    const base = SH - 34;
    let s = `<line class="ax" x1="${x(lo) - 6}" y1="${base}" x2="${x(hi) + 14}" y2="${base}"/>`;
    s += `<polygon class="axhead" points="${x(hi) + 22},${base} ${x(hi) + 12},${base - 5} ${x(hi) + 12},${base + 5}"/>`;
    for (let v = lo; v <= hi; v++) {
      s += `<line class="ax" x1="${x(v)}" y1="${base - 5}" x2="${x(v)}" y2="${base + 5}"/>`;
      if (v % (hi - lo > 16 ? 2 : 1) === 0) s += `<text class="tick" x="${x(v)}" y="${base + 20}" text-anchor="middle">${num(v)}</text>`;
    }
    s += `<text class="axis" x="${SW - 2}" y="${SH - 2}" text-anchor="end"><tspan class="it">s</tspan> in m</text>`;
    const rows = [];
    xs.forEach((v, k) => {
      let row = 0;
      while ((rows[row] || []).some((w) => Math.abs(w - v) < 0.9)) row++;
      (rows[row] = rows[row] || []).push(v);
      const cy = base - row * 22;
      s += `<circle class="sdot" cx="${x(v)}" cy="${cy}" r="6.5"/>`;
      if (!opts.noTimes) s += `<text class="stime" x="${x(v)}" y="${cy - 11}" text-anchor="middle">${k}</text>`;
    });
    // just enough room above the highest row of dots and its times
    const top = base - (rows.length - 1) * 22 - 26;
    return `<svg class="strobe" viewBox="0 ${top} ${SW} ${SH - top}" role="img" aria-label="${opts.label || ''}"><g class="qc-s">${s}</g></svg>`;
  }

  // ---------------------------------------------------------------- value table
  // times: [t, …] (s); rows: [{ name, values: [s, null (asked for: shown by its name) or '' (empty)] }].
  // A row with head (HTML) is a row of its own kind (e.g. the differences in a solution), its
  // values plain numbers or strings; name may be '' for a single body (s instead of s_A).
  function table(times, rows) {
    const sym = (r) => (r.name ? `<i>s</i><sub>${r.name}</sub>` : '<i>s</i>');
    const cell = (v, r, t) => (v === '' ? '<td></td>' : v == null ? `<td class="missing">${sym(r)}(${num(t)} s)</td>` : `<td>${typeof v === 'number' ? num(v) : v}</td>`);
    return `<table class="vtable"><thead><tr><th><i>t</i> in s</th>${times.map((t) => `<th>${num(t)}</th>`).join('')}</tr></thead>` +
      `<tbody>${rows.map((r) => `<tr${r.head ? ' class="diff"' : ''}><th>${r.head || `${sym(r)} in m`}</th>${r.values.map((v, k) => cell(v, r, times[k])).join('')}</tr>`).join('')}</tbody></table>`;
  }

  const api = { graph, strobe, table, valueAt, num, dec };
  root.Figs = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
