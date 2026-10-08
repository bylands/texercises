// SVG drawings: state diagrams p(V), p(T) and V(T) in the manner of the worksheet: axes with
// ticks, the states as labelled dots, each step with an arrow in the middle.
//   diagram(f, o)  f: { cycle, diagram, reverse (arrows the other way), straight (the index of a
//                  step drawn as a straight line), copyFrom (the shape taken from another diagram,
//                  the axes named as this one), upTo (only the first steps), ax (the axes) }
//                  o: { small (an option), grid (dots on the tick crossings, for drawing),
//                  placed (the number of states shown, for drawing), label }; for drawing, upTo
//                  and placed grow as the student places the states
//   linesDiagram(d, ls)  lines of constant p, V or T, numbered (the exercise "which line is which")
//   pointAt(ax, px, py)  the tick crossing nearest to a point of the drawing, or null outside
(function (root) {
  'use strict';

  const C = root.Cycles || require('./generator.js');
  const L = (en, de) => (root.Lang ? root.Lang.L(en, de) : en);
  const f1 = (x) => Math.round(x * 10) / 10;
  const W = 320, H = 270, ML = 40, MR = 22, MT = 26, MB = 34, PW = W - ML - MR, PH = H - MT - MB;
  let uid = 0;

  const sx = (ax, x) => ML + (x / ax.x.max) * PW, sy = (ax, y) => MT + PH - (y / ax.y.max) * PH;
  const it = (v) => `<tspan class="it">${v}</tspan>`;

  // the axes with their ticks, and their names: p(V) means p up, V across
  function axes(d, ax, grid) {
    const [xv, yv] = C.AXES[d];
    let out = '';
    if (grid) {
      for (let i = 1; i <= ax.x.ticks; i++) for (let j = 1; j <= ax.y.ticks; j++) out += `<circle class="gdot" cx="${f1(sx(ax, i * ax.x.step))}" cy="${f1(sy(ax, j * ax.y.step))}" r="1.6"/>`;
    }
    out += `<path class="ax" d="M${ML} ${MT + PH} H${ML + PW + 12} M${ML} ${MT + PH} V${MT - 12}"/>`;
    out += `<path class="axhead" d="M${ML + PW + 14} ${MT + PH} l-8 -4 v8 z M${ML} ${MT - 14} l-4 8 h8 z"/>`;
    for (let i = 1; i <= ax.x.ticks; i++) out += `<line class="ax" x1="${f1(sx(ax, i * ax.x.step))}" y1="${MT + PH - 4}" x2="${f1(sx(ax, i * ax.x.step))}" y2="${MT + PH + 4}"/>`;
    for (let j = 1; j <= ax.y.ticks; j++) out += `<line class="ax" x1="${ML - 4}" y1="${f1(sy(ax, j * ax.y.step))}" x2="${ML + 4}" y2="${f1(sy(ax, j * ax.y.step))}"/>`;
    out += `<text class="axl" x="${ML + PW + 14}" y="${MT + PH + 22}" text-anchor="end">${it(xv)}</text>`;
    out += `<text class="axl" x="${ML + 8}" y="${MT - 10}">${it(yv)}(${it(xv)})</text>`;
    out += `<text class="axl" x="${ML - 8}" y="${MT + PH + 16}" text-anchor="end">0</text>`;
    return out;
  }

  // an arrow head at the middle of a polyline of points [x, y], along it
  function arrowAt(pts) {
    const m = Math.floor(pts.length / 2), a = pts[Math.max(0, m - 2)], b = pts[Math.min(pts.length - 1, m + 2)];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ux = (b[0] - a[0]) / len, uy = (b[1] - a[1]) / len, [x, y] = pts[m];
    const H0 = 9, B = 4.5, bx = x - H0 * ux / 2, by = y - H0 * uy / 2, tx = x + H0 * ux / 2, ty = y + H0 * uy / 2;
    return `<path class="arr" d="M${f1(tx)} ${f1(ty)} L${f1(bx - B * uy)} ${f1(by + B * ux)} L${f1(bx + B * uy)} ${f1(by - B * ux)} Z"/>`;
  }

  function diagram(fig, o = {}) {
    const c = fig.cycle, d = fig.diagram, g = fig.copyFrom || d, id = `cl${++uid}`;
    const ax = fig.ax || C.axesFor(g, c.states);
    const pt = (s) => { const [x, y] = C.coord(g, s); return [sx(ax, x), sy(ax, y)]; };
    const nStates = o.placed != null ? o.placed : c.states.length;
    const segs = c.segs.filter((s, i) => fig.upTo == null || i < fig.upTo);
    let body = '';
    for (const s of segs) {
      const pts = C.sample(c, s, 60, fig.straight === c.segs.indexOf(s)).map(pt);
      const run = fig.reverse ? [...pts].reverse() : pts;
      body += `<path class="seg" d="M${pts.map((q) => `${f1(q[0])},${f1(q[1])}`).join(' L')}"/>` + arrowAt(run);
    }
    // the states, their letters outside the loop
    const cx = c.states.reduce((a, s) => a + pt(s)[0], 0) / c.states.length, cy = c.states.reduce((a, s) => a + pt(s)[1], 0) / c.states.length;
    c.states.slice(0, nStates).forEach((s, i) => {
      const [x, y] = pt(s), dx = x - cx, dy = y - cy, n = Math.hypot(dx, dy) || 1;
      body += `<circle class="st" cx="${f1(x)}" cy="${f1(y)}" r="3.6"/><text class="stl" x="${f1(x + (dx / n) * 13)}" y="${f1(y + (dy / n) * 13 + 5)}" text-anchor="middle">${C.nameOf(i)}</text>`;
    });
    return `<svg class="pv${o.small ? ' small' : ''}${o.grid ? ' drawing' : ''}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${o.label || L(`A cyclic process in a ${C.AXES[d][1]}(${C.AXES[d][0]}) diagram`, `Ein Kreisprozess in einem ${C.AXES[d][1]}(${C.AXES[d][0]})-Diagramm`)}">` +
      `<defs><clipPath id="${id}"><rect x="${ML - 6}" y="${MT - 16}" width="${PW + 22}" height="${PH + 22}"/></clipPath></defs>` +
      axes(d, ax, o.grid) + `<g clip-path="url(#${id})">${body}</g>${o.pick || ''}</svg>`;
  }

  // Lines of constant p, V or T across the diagram, numbered at their ends.
  const LAX = { p: { v: 'p', step: 1, ticks: 8, max: 8 }, V: { v: 'V', step: 1, ticks: 8, max: 8 }, T: { v: 'T', step: 4, ticks: 8, max: 32 } };
  function linesDiagram(d, ls, o = {}) {
    const [xv, yv] = C.AXES[d], ax = { x: LAX[xv], y: LAX[yv] }, id = `cl${++uid}`;
    let body = '';
    const placed = [];
    ls.forEach((ln, i) => {
      const pts = [];
      for (let k = 1; k <= 600; k++) {
        const u = 0.02 * 1.012 ** k; // 0.02 … 26, denser near 0
        const s = ln.type === 'isobaric' ? { p: ln.c, V: u } : ln.type === 'isochoric' ? { p: u, V: ln.c } : { p: ln.c / u, V: u };
        const [x, y] = C.coord(d, s);
        if (x <= ax.x.max * 1.05 && y <= ax.y.max * 1.05) pts.push([sx(ax, x), sy(ax, y)]);
      }
      body += `<path class="ln ln${i + 1}" d="M${pts.map((q) => `${f1(q[0])},${f1(q[1])}`).join(' L')}"/>`;
      // the number near the far end of the line (towards the top right), away from the others
      const inside = pts.filter((q) => q[0] <= ML + PW - 12 && q[1] >= MT + 12 && q[0] >= ML + 12 && q[1] <= MT + PH - 12);
      const score = (q) => (q[0] - ML) / PW + (MT + PH - q[1]) / PH;
      const cands = [...inside].sort((a, b) => score(b) - score(a));
      const q = cands.find((a) => placed.every((b) => Math.hypot(a[0] - b[0], a[1] - b[1]) > 24)) || cands[0] || pts[pts.length - 1];
      placed.push(q);
      body += `<circle class="lnum" cx="${f1(q[0])}" cy="${f1(q[1])}" r="9"/><text class="lnumt" x="${f1(q[0])}" y="${f1(q[1] + 4)}" text-anchor="middle">${i + 1}</text>`;
    });
    return `<svg class="pv" viewBox="0 0 ${W} ${H}" role="img" aria-label="${o.label || L('Four lines in a state diagram', 'Vier Linien in einem Zustandsdiagramm')}">` +
      `<defs><clipPath id="${id}"><rect x="${ML}" y="${MT}" width="${PW}" height="${PH}"/></clipPath></defs>${axes(d, ax, false)}<g clip-path="url(#${id})">${body}</g></svg>`;
  }

  // The tick crossing nearest to the point (px, py) of the drawing, as values of the axes.
  function pointAt(ax, px, py) {
    if (px < ML - 10 || px > ML + PW + 10 || py < MT - 10 || py > MT + PH + 10) return null;
    const i = Math.round(((px - ML) / PW) * ax.x.max / ax.x.step), j = Math.round(((MT + PH - py) / PH) * ax.y.max / ax.y.step);
    if (i < 1 || j < 1 || i > ax.x.ticks || j > ax.y.ticks) return null;
    return { x: i * ax.x.step, y: j * ax.y.step, px: sx(ax, i * ax.x.step), py: sy(ax, j * ax.y.step) };
  }

  const api = { W, H, diagram, linesDiagram, pointAt };
  root.Diagram = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
