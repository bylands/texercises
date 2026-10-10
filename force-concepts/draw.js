// SVG drawing primitives for the force-concept scenes: arrows for forces, velocities and
// accelerations, the ground, tables, vehicles, people, a space probe and the like. Everything
// returns SVG markup as a string; the colours come from style.css (classes f, v, a, net, …).
(function (root) {
  'use strict';

  const n = (x) => Number(x.toFixed(1));
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  function svg(w, h, body, label, cls = '') {
    return `<svg class="scene${cls ? ' ' + cls : ''}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(label)}">${body}</svg>`;
  }

  // "F_G" → F with subscript G. Words without an underscore are written as they are.
  function lab(s) {
    const k = s.indexOf('_');
    return k < 0 ? esc(s) : `${esc(s.slice(0, k))}<tspan class="sub" dy="4">${esc(s.slice(k + 1))}</tspan>`;
  }
  function text(x, y, s, cls = 'lbl', anchor = 'middle') {
    return `<text class="${cls}" x="${n(x)}" y="${n(y)}" text-anchor="${anchor}">${lab(s)}</text>`;
  }
  const words = (x, y, s, anchor = 'middle') => text(x, y, s, 'txt', anchor);

  // An arrow from (x1, y1) to (x2, y2). kind: f (force), v (velocity), a (acceleration),
  // net (net force), m (motion, thin). The label sits beyond the tip unless o.at says otherwise.
  function arrow(x1, y1, x2, y2, kind = 'f', label = '', o = {}) {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
    if (L < 0.5) return '';
    const ux = dx / L, uy = dy / L, hl = Math.min(o.head || 10, L * 0.55), hw = hl * 0.45;
    const bx = x2 - ux * hl, by = y2 - uy * hl;
    let s = `<g class="arr ${kind}${o.cls ? ' ' + o.cls : ''}"><line x1="${n(x1)}" y1="${n(y1)}" x2="${n(bx)}" y2="${n(by)}"/>` +
      `<polygon points="${n(x2)},${n(y2)} ${n(bx - uy * hw)},${n(by + ux * hw)} ${n(bx + uy * hw)},${n(by - ux * hw)}"/></g>`;
    if (label) {
      let at = o.at, anchor = o.anchor;
      if (!at) {
        if (Math.abs(ux) >= 0.5) { at = [x2 + ux * 6, y2 + 5 + uy * 12]; anchor = anchor || (ux > 0 ? 'start' : 'end'); }
        else { at = [x2 + 8, y2 + (uy > 0 ? 12 : 4)]; anchor = anchor || 'start'; }
      }
      s += text(at[0], at[1], label, `lbl ${kind}`, anchor || 'middle');
    }
    return s;
  }

  const line = (x1, y1, x2, y2, cls = 'ln') => `<line class="${cls}" x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}"/>`;
  const path = (d, cls = 'path') => `<path class="${cls}" d="${d}"/>`;
  const poly = (pts, cls = 'path') => `<polyline class="${cls}" points="${pts.map(([x, y]) => `${n(x)},${n(y)}`).join(' ')}"/>`;
  const dot = (x, y, r = 3, cls = 'pt') => `<circle class="${cls}" cx="${n(x)}" cy="${n(y)}" r="${r}"/>`;
  const ghost = (s) => `<g class="ghost">${s}</g>`;

  function ground(x1, x2, y) {
    let s = line(x1, y, x2, y, 'gline');
    for (let x = x1 + 6; x <= x2; x += 10) s += line(x, y, x - 7, y + 7, 'hatch');
    return s;
  }
  function ceiling(x1, x2, y) {
    let s = line(x1, y, x2, y, 'gline');
    for (let x = x1 + 6; x <= x2; x += 10) s += line(x, y, x - 7, y - 7, 'hatch');
    return s;
  }

  const ball = (x, y, r = 10, cls = 'obj') => `<circle class="${cls}" cx="${n(x)}" cy="${n(y)}" r="${r}"/>`;
  const rect = (x, y, w, h, cls = 'obj', rx = 2) => `<rect class="${cls}" x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${rx}"/>`;

  // Table whose top surface is at y, from x to x + w; legs down to the floor at yf.
  function table(x, y, w, yf) {
    return rect(x, y, w, 7, 'solid', 1) + rect(x + 5, y + 7, 6, yf - y - 7, 'solid', 0) + rect(x + w - 11, y + 7, 6, yf - y - 7, 'solid', 0);
  }

  function crate(x, y, w, h) {
    return rect(x, y, w, h, 'obj', 1) + line(x + 3, y + 3, x + w - 3, y + h - 3, 'thin') + line(x + w - 3, y + 3, x + 3, y + h - 3, 'thin');
  }

  // Car of length w standing on the road at height y (left end at x).
  function car(x, y, w) {
    const r = 0.1 * w, by = y - r, h = 0.2 * w;
    return `<polygon class="obj" points="${[[x + 0.24 * w, by - h], [x + 0.33 * w, by - h - 0.16 * w], [x + 0.68 * w, by - h - 0.16 * w], [x + 0.8 * w, by - h]].map((p) => p.map(n).join(',')).join(' ')}"/>` +
      rect(x, by - h, w, h, 'obj', 0.06 * w) + ball(x + 0.22 * w, by, r, 'wheel') + ball(x + 0.78 * w, by, r, 'wheel');
  }

  // Stick figure of height h standing at (x, y). pose: 'push' (arms forward toward dir), 'hold'
  // (arms forward but relaxed, bent), 'down'.
  function person(x, y, h, dir = 1, pose = 'down', skates = false) {
    const hy = y - 0.88 * h, sh = y - 0.72 * h, hip = y - 0.4 * h;
    let s = ball(x, hy, 0.1 * h, 'skin') + line(x, hy + 0.1 * h, x, hip, 'body') +
      line(x, hip, x - 0.12 * h, y, 'body') + line(x, hip, x + 0.12 * h, y, 'body');
    if (pose === 'push') s += line(x, sh, x + dir * 0.36 * h, sh - 0.02 * h, 'body');
    else if (pose === 'hold') s += `<polyline class="body" points="${n(x)},${n(sh)} ${n(x + dir * 0.16 * h)},${n(sh + 0.1 * h)} ${n(x + dir * 0.3 * h)},${n(sh + 0.02 * h)}"/>`;
    else s += line(x, sh, x - 0.14 * h, hip + 0.04 * h, 'body') + line(x, sh, x + 0.14 * h, hip + 0.04 * h, 'body');
    if (skates) s += line(x - 0.2 * h, y + 2, x + 0.2 * h, y + 2, 'skate');
    return s;
  }

  // Space probe pointing along dir (unit vector), centred at (x, y); flame behind it if the
  // engine pushes along dir, or a small side flame (side: unit vector of the thrust).
  function probe(x, y, dir = [1, 0], thrust = null, size = 1) {
    const [ux, uy] = dir, px = -uy, py = ux, L = 22 * size, W = 9 * size;
    const P = (a, b) => `${n(x + ux * a + px * b)},${n(y + uy * a + py * b)}`;
    let s = '';
    if (thrust) {
      const [tx, ty] = thrust;
      const fx = x - tx * (W + 6 * size), fy = y - ty * (W + 6 * size);
      s += `<polygon class="flame" points="${n(x - tx * W + ty * 5 * size)},${n(y - ty * W - tx * 5 * size)} ${n(fx - tx * 9 * size)},${n(fy - ty * 9 * size)} ${n(x - tx * W - ty * 5 * size)},${n(y - ty * W + tx * 5 * size)}"/>`;
    }
    s += `<polygon class="obj" points="${P(-L / 2, -W)} ${P(L / 2 - 4 * size, -W)} ${P(L / 2 + 8 * size, 0)} ${P(L / 2 - 4 * size, W)} ${P(-L / 2, W)}"/>`;
    s += `<polygon class="solid" points="${P(-L / 2, -W)} ${P(-L / 2 - 6 * size, -W - 5 * size)} ${P(-L / 2 - 6 * size, W + 5 * size)} ${P(-L / 2, W)}"/>`;
    return s;
  }

  // Small plane flying right with its belly at (x, y).
  function plane(x, y, k = 1) {
    const p = (pts) => pts.map(([a, b]) => `${n(x + a * k)},${n(y + b * k)}`).join(' ');
    return `<polygon class="obj" points="${p([[-34, -8], [-28, -20], [-22, -20], [-18, -10], [22, -10], [32, -4], [22, 0], [-30, 0]])}"/>` +
      `<polygon class="solid" points="${p([[-4, -6], [6, -6], [-8, 8], [-14, 8]])}"/>`;
  }

  // Puck seen from above.
  const puck = (x, y, r = 10) => ball(x, y, r) + `<circle class="thin" cx="${n(x)}" cy="${n(y)}" r="${n(r * 0.55)}" fill="none"/>`;

  // Elevator cabin of width w and height h with its top at y, hanging from a cable from y0.
  function elevator(x, y, w, h, y0) {
    return line(x + w / 2, y0, x + w / 2, y, 'cable') + rect(x, y, w, h, 'obj', 2) + rect(x + 0.2 * w, y + 0.18 * h, 0.6 * w, 0.64 * h, 'thin', 1);
  }

  // Skydiver falling feet down at (x, y) (centre of the body), with or without an open canopy.
  function skydiver(x, y, canopy) {
    let s = person(x, y + 34, 68, 1, 'down');
    if (canopy) {
      s += `<path class="canopy" d="M${n(x - 46)} ${n(y - 70)} Q${n(x)} ${n(y - 122)} ${n(x + 46)} ${n(y - 70)} Z"/>` +
        line(x - 46, y - 70, x - 5, y - 16, 'thin') + line(x + 46, y - 70, x + 5, y - 16, 'thin');
    }
    return s;
  }

  // Axes for a sketched graph: origin (x0, y0), width w, height h, axis names.
  function axes(x0, y0, w, h, xl, yl) {
    return arrow(x0, y0, x0 + w, y0, 'ax', '', { head: 7 }) + arrow(x0, y0, x0, y0 - h, 'ax', '', { head: 7 }) +
      text(x0 + w - 2, y0 + 16, xl, 'lbl ax', 'end') + text(x0 - 6, y0 - h + 10, yl, 'lbl ax', 'end');
  }

  const api = { n, esc, svg, lab, text, words, arrow, line, path, poly, dot, ghost, ground, ceiling, ball, rect, table, crate, car, person, probe, plane, puck, elevator, skydiver, axes };
  root.Draw = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
