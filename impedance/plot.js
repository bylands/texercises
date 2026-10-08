// SVG drawings: the impedance graph Z(ω) on linear or log-log axes, with annotations for the
// tutor and the solution and a probe marker (point, tangent, guides), and the circuit schematic.
(function (root) {
  'use strict';

  const I = root.Impedance || require('./generator.js');
  // the page language (lang.js, shared by the apps); English where it is not loaded
  const L = (en, de) => (root.Lang ? root.Lang.L(en, de) : en);
  const ML = 64, MR = 20, MT = 22, MB = 46;
  let W = 640, H = 360, PW = W - ML - MR, PH = H - MT - MB;
  // Narrow screens get a smaller drawing (larger text once scaled down).
  function setNarrow(narrow) {
    W = narrow ? 440 : 640;
    H = narrow ? 330 : 360;
    PW = W - ML - MR;
    PH = H - MT - MB;
  }
  const f1 = (x) => Math.round(x * 10) / 10;
  const lg = Math.log10;
  let uid = 0;

  // ---------------------------------------------------------------- axes
  // The ranges of the axes in a mode: 'lin' (ax.lin: 0 or wlo … wmax, 0 … ztop), 'log' (ax.log:
  // w0 … w1, z0 … z1, whole decades for the exercises), and for the problems 'semilog' (ax.semi:
  // log w0 … w1, linear 0 … ztop, as in a loudspeaker's datasheet) and 'ylog' (ax.ylog: linear
  // wlo … wmax, log z0 … z1, a narrow window of frequencies). ax.x (optional): the variable of
  // the horizontal axis, { name, unit }, e.g. the frequency f in Hz; by default ω in rad/s.
  function range(ax, mode) {
    if (mode === 'log') return { xlog: true, ylog: true, x0: ax.log.w0, x1: ax.log.w1, y0: ax.log.z0, y1: ax.log.z1 };
    if (mode === 'semilog') return { xlog: true, ylog: false, x0: ax.semi.w0, x1: ax.semi.w1, y0: 0, y1: ax.semi.ztop };
    if (mode === 'ylog') return { xlog: false, ylog: true, x0: ax.ylog.wlo, x1: ax.ylog.wmax, y0: ax.ylog.z0, y1: ax.ylog.z1 };
    return { xlog: false, ylog: false, x0: ax.lin.wlo || 0, x1: ax.lin.wmax, y0: 0, y1: ax.lin.ztop };
  }
  // Scales of the plot area for axes ax and a mode: x(ω), y(Z), w(px), z(py) and the smallest ω
  // that can be drawn (ω = 0 is drawn as a tiny ω on linear axes).
  function scales(ax, mode) {
    const r = range(ax, mode);
    const X = r.xlog ? lg : (v) => v, Xi = r.xlog ? (v) => 10 ** v : (v) => v;
    const Y = r.ylog ? lg : (v) => v, Yi = r.ylog ? (v) => 10 ** v : (v) => v;
    const [a0, a1, b0, b1] = [X(r.x0), X(r.x1), Y(r.y0), Y(r.y1)];
    return {
      x: (w) => ML + ((X(w) - a0) / (a1 - a0)) * PW,
      y: (z) => MT + (1 - (Y(z) - b0) / (b1 - b0)) * PH,
      w: (px) => Xi(a0 + ((px - ML) / PW) * (a1 - a0)),
      z: (py) => Yi(b0 + (1 - (py - MT) / PH) * (b1 - b0)),
      wmin: r.x0 > 0 ? r.x0 : r.x1 * 1e-5, wmax: r.x1, r,
    };
  }
  const STEPS = [1, 2, 2.5, 5, 10];
  function step(max) {
    const e = Math.floor(lg(max / 5));
    for (const m of STEPS) if (m * 10 ** e >= (max / 5) * (1 - 1e-9)) return m * 10 ** e;
    return 10 ** (e + 1);
  }
  const trim = (x) => String(Number(x.toPrecision(6))).replace('-', '−');
  const PREF = { 0: '', 3: 'k', 6: 'M' };

  // Grid, ticks and axis labels.
  function grid(ax, mode, s) {
    let out = '';
    const bottom = MT + PH, right = ML + PW, r = s.r;
    const xv = ax.x || { name: 'ω', unit: 'rad/s' }, hz = xv.unit === 'Hz';
    const vline = (v, major) => `<line class="grid${major ? ' major' : ''}" x1="${f1(s.x(v))}" y1="${MT}" x2="${f1(s.x(v))}" y2="${bottom}"/>`;
    const hline = (v, major) => `<line class="grid${major ? ' major' : ''}" x1="${ML}" y1="${f1(s.y(v))}" x2="${right}" y2="${f1(s.y(v))}"/>`;
    const xtick = (v, t) => `<text class="tick" x="${f1(s.x(v))}" y="${bottom + 17}" text-anchor="middle">${t}</text>`;
    const ytick = (v, t) => `<text class="tick" x="${ML - 6}" y="${f1(s.y(v) + 4)}" text-anchor="end">${t}</text>`;
    // decades with their minor lines, labelled 10ⁿ
    const decades = (v0, v1, line, tick) => {
      let o = '';
      for (let d = 10 ** Math.floor(lg(v0) + 1e-9); d < v1 * 1.001; d *= 10) {
        for (let m = 1; m < 10; m++) if (d * m >= v0 * 0.999 && d * m <= v1 * 1.001) o += line(d * m, m === 1);
        if (d >= v0 * 0.999) o += tick(d, `10${I.sup(Math.round(lg(d)))}`);
      }
      return o;
    };
    let xunit = xv.unit, zunit = 'Ω';
    if (r.xlog) out += decades(r.x0, r.x1, vline, xtick);
    else {
      // in Hz with a prefix (kHz, MHz); in rad/s with a power of ten
      const e = hz ? (r.x1 >= 1e6 ? 6 : r.x1 >= 1e3 ? 3 : 0) : r.x1 >= 1e4 ? 3 * Math.floor(lg(r.x1) / 3) : 0;
      const sw = step(r.x1 - r.x0);
      for (let k = Math.ceil(r.x0 / sw - 1e-9); k * sw <= r.x1 * 1.0001; k++) out += vline(k * sw, k === 0) + xtick(k * sw, trim((k * sw) / 10 ** e));
      if (e) xunit = hz ? `${PREF[e]}Hz` : `10${I.sup(e)} rad/s`;
    }
    if (r.ylog) out += decades(r.y0, r.y1, hline, ytick);
    else {
      const ez = r.y1 >= 2e6 ? 6 : r.y1 >= 2000 ? 3 : 0, sz = step(r.y1);
      for (let k = 0; k * sz <= r.y1 * 1.0001; k++) out += hline(k * sz, k === 0) + ytick(k * sz, trim((k * sz) / 10 ** ez));
      zunit = `${PREF[ez]}Ω`;
    }
    out += `<text class="axis" x="${right}" y="${H - 6}" text-anchor="end"><tspan class="it">${xv.name}</tspan> in ${xunit}</text>`;
    out += `<text class="axis" x="6" y="${MT - 8}"><tspan class="it">Z</tspan> in ${zunit}</text>`;
    return out;
  }

  // Path of f(ω) across the plot (sampled per pixel; the plot area clips it).
  function path(s, f, from, to) {
    const a = Math.max(ML, from === undefined ? ML : s.x(Math.max(from, s.wmin))), b = Math.min(ML + PW, to === undefined ? ML + PW : s.x(to));
    const pts = [];
    for (let px = a; px <= b + 1e-9; px += 1.5) {
      const w = Math.max(s.w(px), s.wmin), z = f(w);
      if (!(z > 0) && z !== 0) continue;
      const py = z <= 0 ? MT + PH + 50 : Math.max(MT - 50, Math.min(MT + PH + 50, s.y(z)));
      pts.push(`${f1(px)},${f1(py)}`);
    }
    return pts.length > 1 ? `M${pts.join(' L')}` : '';
  }

  // Tangent to the curve at ω: a straight line in the plot (on log axes, in the logarithm), so a
  // power law on log-log axes.
  function tangentPath(c, ax, mode, s, w) {
    w = Math.max(w, s.wmin);
    const z = I.Z(c, w), d = I.dZ(c, w), r = s.r;
    const X = r.xlog ? Math.log : (v) => v, slope = d * (r.ylog ? 1 / z : 1) * (r.xlog ? w : 1);
    const at = (u) => { const Yv = (r.ylog ? Math.log(z) : z) + slope * (X(u) - X(w)); return r.ylog ? Math.exp(Yv) : Yv; };
    if (r.xlog) return path(s, at, w / 6, w * 6);
    const span = 0.3 * (r.x1 - r.x0);
    return path(s, at, w - span, w + span);
  }

  // Label of an annotation; X_sub is written with a subscript.
  function label(x, y, text, anchor) {
    const t = text.replace(/_(\w+)/g, '<tspan class="sub" dy="4">$1</tspan><tspan dy="-4">\u200b</tspan>');
    return `<text class="ann" x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor || 'start'}">${t}</text>`;
  }

  // Annotations (see analysis() in generator.js).
  function annotation(c, ax, mode, s, a) {
    const clampX = (w) => s.x(Math.max(w, s.wmin));
    switch (a.t) {
      case 'pt': {
        const x = clampX(a.w), y = s.y(a.z);
        return `<circle class="apt" cx="${f1(x)}" cy="${f1(y)}" r="5"/>` + (a.label ? label(x + 9, y - 9, a.label) : '');
      }
      case 'h': {
        const y = s.y(a.z);
        return `<line class="aline" x1="${ML}" y1="${f1(y)}" x2="${ML + PW}" y2="${f1(y)}"/>` + (a.label ? label(ML + PW - 4, y - 6, a.label, 'end') : '');
      }
      case 'v': {
        const x = clampX(a.w);
        return `<line class="aline" x1="${f1(x)}" y1="${MT}" x2="${f1(x)}" y2="${MT + PH}"/>` + (a.label ? label(x + 5, MT + PH - 8, a.label) : '');
      }
      case 'line': case 'fn': {
        const f = a.t === 'fn' ? a.f : (w) => a.z + a.s * (w - a.w);
        const d = path(s, f);
        // label where the curve is inside the plot, towards the right
        let lx = null, ly = null;
        for (let px = ML + PW * 0.9; px > ML + PW * 0.1; px -= 8) {
          const z = f(s.w(px)), py = z > 0 ? s.y(z) : NaN;
          if (py > MT + 14 && py < MT + PH - 6) { lx = px; ly = py; break; }
        }
        return `<path class="aline" d="${d}"/>` + (a.label && lx !== null ? label(lx - 6, ly - 8, a.label, 'end') : '');
      }
      case 'tan': {
        const w = Math.max(a.w, s.wmin), x = s.x(w), y = s.y(I.Z(c, w));
        const text = a.label === 'slope' ? `dZ/dω ≈ ${I.H(I.p3(I.dZ(c, w)), 'ohms')}` : a.label;
        const right = x < ML + PW - 170;
        return `<path class="atan" d="${tangentPath(c, ax, mode, s, w)}"/><circle class="apt" cx="${f1(x)}" cy="${f1(y)}" r="5"/>` +
          (text ? label(x + (right ? 10 : -10), y + (y < MT + 40 ? 22 : -12), text, right ? 'start' : 'end') : '');
      }
      default: return '';
    }
  }

  // The graph of circuit c: opts.ann (annotations), opts.label (aria label), opts.extra (more
  // circuits, drawn dashed for comparison).
  // The <g class="probe"> layer is filled by probeMark().
  function graph(c, ax, mode, opts) {
    const o = opts || {}, s = scales(ax, mode), id = `clip${++uid}`;
    const anns = (o.ann || []).map((a) => annotation(c, ax, mode, s, a)).join('');
    return `<svg class="zgraph" viewBox="0 0 ${W} ${H}" role="img" aria-label="${o.label || L('Impedance against angular frequency', 'Impedanz gegen Kreisfrequenz')}">` +
      `<defs><clipPath id="${id}"><rect x="${ML}" y="${MT}" width="${PW}" height="${PH}"/></clipPath></defs>` +
      grid(ax, mode, s) +
      `<rect class="frame" x="${ML}" y="${MT}" width="${PW}" height="${PH}"/>` +
      `<g clip-path="url(#${id})">${(o.extra || []).map((x) => `<path class="curve2" d="${path(s, (w) => I.Z(x, w))}"/>`).join('')}<path class="curve" d="${path(s, (w) => I.Z(c, w))}"/>${anns}</g>` +
      `<g class="probe" clip-path="url(#${id})"></g></svg>`;
  }

  // Probe at ω (or null) and pinned points [{ w, n }]: guides to the axes, the point on the curve,
  // the tangent; pins as numbered dots.
  function probeMark(c, ax, mode, w, pins) {
    const s = scales(ax, mode);
    let out = '';
    for (const p of pins || []) {
      const x = s.x(Math.max(p.w, s.wmin)), y = s.y(I.Z(c, Math.max(p.w, s.wmin)));
      out += `<circle class="pin" cx="${f1(x)}" cy="${f1(y)}" r="8"/><text class="pin-n" x="${f1(x)}" y="${f1(y + 4)}" text-anchor="middle">${p.n}</text>`;
    }
    if (w !== null && w !== undefined) {
      w = Math.max(w, s.wmin);
      const x = s.x(w), y = s.y(I.Z(c, w)), yb = Math.min(MT + PH, Math.max(MT, y));
      out += `<line class="guide" x1="${ML}" y1="${f1(y)}" x2="${f1(x)}" y2="${f1(y)}"/><line class="guide" x1="${f1(x)}" y1="${f1(yb)}" x2="${f1(x)}" y2="${MT + PH}"/>`;
      out += `<path class="ptan" d="${tangentPath(c, ax, mode, s, w)}"/><circle class="pdot" cx="${f1(x)}" cy="${f1(y)}" r="5"/>`;
    }
    return out;
  }

  // Readout of the probe at ω: { w, z, d, p } with p the log-log slope d ln Z / d ln ω.
  function readout(c, ax, mode, w) {
    w = Math.max(w, scales(ax, mode).wmin);
    const z = I.Z(c, w), d = I.dZ(c, w);
    return { w, z, d, p: (w * d) / z };
  }

  // ω under the pointer at svg x px (null outside the plot area).
  function omegaAt(ax, mode, px) {
    if (px < ML - 6 || px > ML + PW + 6) return null;
    const s = scales(ax, mode);
    return Math.max(s.w(Math.min(ML + PW, Math.max(ML, px))), s.wmin);
  }

  // ---------------------------------------------------------------- schematic
  // Horizontal (series) or vertical (parallel) symbols of R, L, C centred at (x, y).
  function part(k, x, y, vertical) {
    const lbl = (dx, dy) => `<text class="lbl" x="${f1(x + dx)}" y="${f1(y + dy)}" text-anchor="${vertical ? 'start' : 'middle'}"><tspan class="it">${k}</tspan></text>`;
    if (k === 'R') {
      return vertical
        ? `<rect class="c" x="${x - 7}" y="${y - 18}" width="14" height="36"/>${lbl(14, 5)}`
        : `<rect class="c" x="${x - 18}" y="${y - 7}" width="36" height="14"/>${lbl(0, -13)}`;
    }
    if (k === 'L') {
      const arcs = vertical
        ? `M${x},${y - 18}` + ' a4.5,4.5 0 0 1 0,9'.repeat(4)
        : `M${x - 18},${y}` + ' a4.5,4.5 0 0 1 9,0'.repeat(4);
      const mask = vertical ? `<rect class="mask" x="${x - 3}" y="${y - 18}" width="12" height="36"/>` : `<rect class="mask" x="${x - 18}" y="${y - 9}" width="36" height="12"/>`;
      return `${mask}<path class="coil" d="${arcs}"/>${vertical ? lbl(14, 5) : lbl(0, -13)}`;
    }
    return vertical
      ? `<rect class="mask" x="${x - 12}" y="${y - 4}" width="24" height="8"/><line class="w" x1="${x - 12}" y1="${y - 4}" x2="${x + 12}" y2="${y - 4}"/><line class="w" x1="${x - 12}" y1="${y + 4}" x2="${x + 12}" y2="${y + 4}"/>${lbl(16, 5)}`
      : `<rect class="mask" x="${x - 4}" y="${y - 12}" width="8" height="24"/><line class="w" x1="${x - 4}" y1="${y - 12}" x2="${x - 4}" y2="${y + 12}"/><line class="w" x1="${x + 4}" y1="${y - 12}" x2="${x + 4}" y2="${y + 12}"/>${lbl(0, -17)}`;
  }

  function source(x, y) {
    return `<circle class="c" cx="${x}" cy="${y}" r="13"/><path class="w" d="M${x - 7},${y} q3.5,-6 7,0 t7,0"/>`;
  }

  // The name of a circuit, e.g. "Series RL circuit".
  function name(c) {
    if (c.conn === 'series-parallel') return L('R in series with L ∥ C', 'R in Serie mit L ∥ C');
    if (c.conn === 'parallel-series') return L('R in parallel with L and C in series', 'R parallel zu L und C in Serie');
    return c.conn === 'series' ? L(`Series ${c.kind} circuit`, `${c.kind}-Serieschaltung`) : L(`Parallel ${c.kind} circuit`, `${c.kind}-Parallelschaltung`);
  }

  function schematic(c) {
    const ks = I.UNKNOWNS[c.kind], n = ks.length;
    let out = '', w;
    if (c.conn === 'series-parallel') {
      // R on the top wire, then the pair L ∥ C as two branches on the right
      const top = 30, bot = 110, left = 30, xs = [left + 124, left + 186];
      w = xs[1] + 36;
      out += `<path class="w" d="M${left},${top} H${xs[1]} M${left},${bot} H${xs[1]} M${left},${top} V${bot}"/>` + source(left, (top + bot) / 2) + part('R', left + 62, top, false);
      ['L', 'C'].forEach((k, i) => { out += `<line class="w" x1="${xs[i]}" y1="${top}" x2="${xs[i]}" y2="${bot}"/>` + part(k, xs[i], (top + bot) / 2, true); });
      out += `<circle class="dot" cx="${xs[0]}" cy="${top}" r="3"/><circle class="dot" cx="${xs[0]}" cy="${bot}" r="3"/>`;
    } else if (c.conn === 'parallel-series') {
      // R in one branch, L and C one above the other in the second
      const top = 18, bot = 106, left = 30, xs = [left + 64, left + 126];
      w = xs[1] + 36;
      out += `<path class="w" d="M${left},${top} H${xs[1]} M${left},${bot} H${xs[1]} M${left},${top} V${bot}"/>` + source(left, (top + bot) / 2);
      xs.forEach((x) => { out += `<line class="w" x1="${x}" y1="${top}" x2="${x}" y2="${bot}"/>`; });
      out += part('R', xs[0], (top + bot) / 2, true) + part('L', xs[1], 42, true) + part('C', xs[1], 84, true);
      out += `<circle class="dot" cx="${xs[0]}" cy="${top}" r="3"/><circle class="dot" cx="${xs[0]}" cy="${bot}" r="3"/>`;
    } else if (c.conn === 'series') {
      const top = 32, bot = 108, left = 30, right = left + 40 + 64 * n;
      w = right + 24;
      out += `<path class="w" d="M${left},${top} H${right} V${bot} H${left} Z"/>` + source(left, (top + bot) / 2);
      ks.forEach((k, i) => { out += part(k, left + 20 + 64 * (i + 0.5), top, false); });
    } else {
      const top = 18, bot = 106, left = 30, gap = 62;
      const xs = ks.map((k, i) => left + 64 + i * gap);
      w = xs[n - 1] + 36;
      out += `<path class="w" d="M${left},${top} H${xs[n - 1]} M${left},${bot} H${xs[n - 1]} M${left},${top} V${bot}"/>` + source(left, (top + bot) / 2);
      ks.forEach((k, i) => {
        out += `<line class="w" x1="${xs[i]}" y1="${top}" x2="${xs[i]}" y2="${bot}"/>` + part(k, xs[i], (top + bot) / 2, true);
        if (i < n - 1) out += `<circle class="dot" cx="${xs[i]}" cy="${top}" r="3"/><circle class="dot" cx="${xs[i]}" cy="${bot}" r="3"/>`;
      });
    }
    return `<svg class="schematic" viewBox="0 0 ${w} 124" width="${w}" height="124" role="img" aria-label="${name(c)}">${out}</svg>`;
  }

  // ---------------------------------------------------------------- sketch
  // A qualitative graph of Z(ω) for the matching exercise (match.js): no numbers, only the level
  // o.R (dashed, labelled R; left out without o.R) and the resonance frequency o.w0 (labelled ω₀;
  // left out with o.noW0). Linear axes 0 … 4ω₀ and 0 … 3R, log-log ω₀/20 … 20ω₀ and R/20 … 20R
  // (o.w0 and o.zref set the scale even where no R or ω₀ is shown). o.marks: labels at the left
  // end lo and the right end hi ({ text, v: what Z goes to }), and at ω₀ res (text), for the solution.
  const SK = { W: 280, H: 180, L: 34, R: 18, T: 18, B: 30 };
  function sketch(c, mode, o) {
    const pw = SK.W - SK.L - SK.R, ph = SK.H - SK.T - SK.B, x0 = SK.L, y0 = SK.T + ph, id = `sk${++uid}`;
    const w0 = o.w0, zr = o.zref, log = mode === 'log';
    const x = log ? (w) => x0 + ((lg(w / w0) + lg(20)) / (2 * lg(20))) * pw : (w) => x0 + (w / (4 * w0)) * pw;
    const y = log ? (z) => y0 - ((lg(z / zr) + lg(20)) / (2 * lg(20))) * ph : (z) => y0 - (z / (3 * zr)) * ph;
    const wAt = log ? (px) => w0 * 20 ** (2 * (px - x0) / pw - 1) : (px) => Math.max(((px - x0) / pw) * 4 * w0, w0 * 1e-4);
    const pts = [];
    for (let px = x0; px <= x0 + pw + 1e-9; px += 1) {
      const z = I.Z(c, wAt(px));
      const py = !(z > 0) ? y0 + 40 : Math.max(SK.T - 40, Math.min(y0 + 40, y(z)));
      pts.push(`${f1(px)},${f1(py)}`);
    }
    let out = `<defs><clipPath id="${id}"><rect x="${x0}" y="${SK.T - 6}" width="${pw + 6}" height="${ph + 6}"/></clipPath></defs>`;
    const tx = (px, py, t, anchor, cls = 'axis') => `<text class="${cls}" x="${f1(px)}" y="${f1(py)}" text-anchor="${anchor}">${t}</text>`;
    if (o.R) out += `<line class="aline" x1="${x0}" y1="${f1(y(o.R))}" x2="${x0 + pw}" y2="${f1(y(o.R))}"/>` + tx(x0 - 7, y(o.R) + 5, '<tspan class="it">R</tspan>', 'end');
    if (!o.noW0) out += `<line class="aline" x1="${f1(x(w0))}" y1="${SK.T}" x2="${f1(x(w0))}" y2="${y0}"/>` + tx(x(w0), y0 + 18, '<tspan class="it">ω</tspan><tspan class="sub" dy="4">0</tspan>', 'middle');
    if (!log) out += tx(x0 - 7, y0 + 5, '0', 'end');
    out += `<path class="w" d="M${x0},${y0} H${x0 + pw + 8} M${x0 + pw + 2},${y0 - 4} L${x0 + pw + 8},${y0} L${x0 + pw + 2},${y0 + 4} M${x0},${y0} V${SK.T - 10} M${x0 - 4},${SK.T - 4} L${x0},${SK.T - 10} L${x0 + 4},${SK.T - 4}"/>`;
    out += tx(x0 + pw + 6, y0 + 20, '<tspan class="it">ω</tspan>', 'end') + tx(x0 + 8, SK.T - 2, '<tspan class="it">Z</tspan>', 'start');
    out += `<g clip-path="url(#${id})"><path class="curve" d="M${pts.join(' L')}"/></g>`;
    // labels for the solution, by what the curve does at each end (v: '0', 'R' or 'inf'): beside
    // where it leaves the plot at the top, on the bottom edge where it has risen from 0, else just
    // above it; at ω₀ next to the point
    const yc = (px) => y(I.Z(c, wAt(px)));
    const m = o.marks || {}, px0 = x0 + 6, px1 = x0 + pw - 2;
    const place = (e, left) => {
      const dir = left ? 1 : -1, from = left ? px0 : px1, anchor = left ? 'start' : 'end';
      const scan = (ok) => { for (let px = from; Math.abs(px - from) < pw * 0.6; px += dir * 2) if (ok(px)) return px; return from; };
      if (e.v === 'inf') return label(scan((px) => yc(px) > SK.T + 2) + dir * 6, SK.T + 12, e.text, anchor);
      if (e.v === '0' && left) return label(scan((px) => yc(px) < y0 - 20) + 4, y0 - 6, e.text, anchor);
      return label(from, Math.max(SK.T + 12, Math.min(y0 - 8, yc(from + dir * 12) - 8)), e.text, anchor);
    };
    if (m.lo) out += place(m.lo, true);
    if (m.hi) out += place(m.hi, false);
    if (m.res) { const yr = Math.max(SK.T + 14, Math.min(y0 - 8, yc(x(w0)))); out += `<circle class="apt" cx="${f1(x(w0))}" cy="${f1(yr)}" r="4.5"/>` + label(x(w0) + 8, yr < SK.T + 40 ? yr + 20 : yr - 10, m.res, 'start'); }
    return `<svg class="sketch" viewBox="0 0 ${SK.W} ${SK.H}" role="img" aria-label="${o.label || L('Impedance against angular frequency', 'Impedanz gegen Kreisfrequenz')}">${out}</svg>`;
  }

  const api = { get W() { return W; }, get H() { return H; }, ML, MT, get PW() { return PW; }, get PH() { return PH; }, setNarrow, scales, graph, probeMark, readout, omegaAt, schematic, name, sketch };
  root.Plot = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
