// Minimal SVG drawing kit for circuit diagrams, modelled on circuitikz.
// Coordinates are in "units" with y pointing up (like TikZ); 1 unit = S px.
(function (root) {
  'use strict';

  const S = 52;
  const FONT = 14;

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // Label markup: text between $...$ is set in italics, "_x" and "_{xy}" become subscripts.
  function tokens(label) {
    const out = [];
    String(label).split('$').forEach((part, i) => {
      if (!part) return;
      if (i % 2 === 0) { out.push({ t: part }); return; }
      part = part.replace(/\\text\{([^}]*)\}/g, '$1');
      let k = 0;
      while (k < part.length) {
        if (part[k] === '_') {
          let sub;
          if (part[k + 1] === '{') {
            const end = part.indexOf('}', k);
            sub = part.slice(k + 2, end);
            k = end + 1;
          } else {
            sub = part[k + 1];
            k += 2;
          }
          out.push({ t: sub, sub: true });
        } else {
          let j = k;
          while (j < part.length && part[j] !== '_') j++;
          out.push({ t: part.slice(k, j), it: true });
          k = j;
        }
      }
    });
    return out;
  }

  function richText(label) {
    let shifted = false;
    return tokens(label).map((tk) => {
      let attrs = '';
      if (tk.sub && !shifted) { attrs = ' dy="0.3em"'; shifted = true; }
      else if (!tk.sub && shifted) { attrs = ' dy="-0.3em"'; shifted = false; }
      if (tk.sub) attrs += ' font-size="0.72em"';
      if (tk.it) attrs += ' font-style="italic"';
      return `<tspan${attrs}>${esc(tk.t)}</tspan>`;
    }).join('');
  }

  function textWidth(label) {
    return tokens(label).reduce((w, tk) => w + tk.t.length * FONT * (tk.sub ? 0.42 : 0.58), 0);
  }

  const SIDES = { right: [1, 0], left: [-1, 0], above: [0, 1], below: [0, -1] };
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const mul = (a, k) => [a[0] * k, a[1] * k];
  const len = (a) => Math.hypot(a[0], a[1]);
  const unit = (a) => mul(a, 1 / len(a));
  const lerp = (a, b, t) => add(a, mul(sub(b, a), t));

  function sideVec(side) {
    if (typeof side === 'string') return SIDES[side];
    return unit(side);
  }

  // Unit normal of direction d pointing towards the requested side.
  function normalTowards(d, side) {
    const s = sideVec(side);
    const dot = s[0] * d[0] + s[1] * d[1];
    const n = sub(s, mul(d, dot));
    return len(n) < 1e-6 ? [-d[1], d[0]] : unit(n);
  }

  class Sketch {
    constructor() {
      this.els = [];
      this.box = [Infinity, Infinity, -Infinity, -Infinity];
      this.segs = [];
      this.autoDots = false;
    }

    _grow(x, y) {
      const b = this.box;
      b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y);
      b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], y);
    }

    // unit coordinates -> px (y flipped)
    P(p) {
      const x = p[0] * S, y = -p[1] * S;
      this._grow(x, y);
      return [x, y];
    }

    _path(pts, cls) {
      const d = pts.map((p, i) => { const [x, y] = this.P(p); return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`; }).join('');
      this.els.push(`<path class="${cls}" d="${d}"/>`);
    }

    // Arrow head with its tip at p (units), pointing along d (units).
    _head(p, d, cls) {
      const [x, y] = this.P(p);
      const u = unit([d[0], -d[1]]);
      const n = [-u[1], u[0]];
      const b = [x - u[0] * 9, y - u[1] * 9];
      const pts = [[x, y], [b[0] + n[0] * 4, b[1] + n[1] * 4], [b[0] - n[0] * 4, b[1] - n[1] * 4]];
      this.els.push(`<polygon class="${cls}" points="${pts.map((q) => q.map((c) => c.toFixed(1)).join(',')).join(' ')}"/>`);
    }

    // Text at point p (units), pushed away from p in direction n.
    _text(p, n, label, cls) {
      if (label == null) return;
      const [x, y] = this.P(p);
      const w = textWidth(label);
      let anchor = 'middle', dy = '0.35em', x0 = x - w / 2, y0 = y - FONT / 2;
      if (Math.abs(n[0]) > 0.5) {
        anchor = n[0] > 0 ? 'start' : 'end';
        x0 = n[0] > 0 ? x : x - w;
      } else if (n[1] > 0) {
        dy = '0em'; y0 = y - FONT;
      } else {
        dy = '0.8em'; y0 = y;
      }
      this._grow(x0, y0); this._grow(x0 + w, y0 + FONT * 1.2);
      this.els.push(`<text class="${cls}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" dy="${dy}" text-anchor="${anchor}">${richText(label)}</text>`);
    }

    label(p, text, side = 'above', cls = 'lbl') {
      this._text(p, sideVec(side), text, cls);
      return this;
    }

    wire(...pts) {
      for (let i = 1; i < pts.length; i++) this.segs.push([pts[i - 1], pts[i]]);
      this._path(pts, 'w');
      return this;
    }

    // Junction dots wherever three or more wire ends meet (a point inside another wire counts twice).
    _junctions() {
      const eq = (a, b) => Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6;
      const inside = (p, [a, b]) => {
        const cross = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
        const dot = (p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1]);
        return Math.abs(cross) < 1e-6 && dot > 1e-6 && dot < len(sub(b, a)) ** 2 - 1e-6;
      };
      const done = [];
      for (const p of this.segs.flat()) {
        if (done.some((q) => eq(p, q))) continue;
        done.push(p);
        const degree = this.segs.reduce((n, seg) => n + seg.filter((e) => eq(e, p)).length + (inside(p, seg) ? 2 : 0), 0);
        if (degree >= 3) this.dot(p);
      }
    }

    dot(p) {
      const [x, y] = this.P(p);
      this.els.push(`<circle class="dot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3"/>`);
      return this;
    }

    // Two-terminal element from p to q; draws leads and returns geometry for the body.
    _two(p, q, body) {
      const L = len(sub(q, p)), d = unit(sub(q, p));
      const a = add(p, mul(d, (L - body) / 2)), b = add(p, mul(d, (L + body) / 2));
      this.wire(p, a); this.wire(b, q);
      return { L, d, a, b, m: lerp(p, q, 0.5) };
    }

    _defaultSide(d) { return Math.abs(d[0]) >= Math.abs(d[1]) ? 'above' : 'right'; }

    // Resistor (European box). o.l label, o.ls label side, o.i current label, o.is side, o.it position (0..1).
    res(p, q, o = {}) {
      const g = this._two(p, q, Math.min(0.9, len(sub(q, p)) * 0.5));
      const [x, y] = this.P(g.m);
      this.P(g.a); this.P(g.b);
      const ang = Math.atan2(-g.d[1], g.d[0]) * 180 / Math.PI;
      const w = len(sub(g.b, g.a)) * S, h = 0.3 * S;
      this.els.push(`<rect class="c" x="${(-w / 2).toFixed(1)}" y="${(-h / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang.toFixed(2)})"/>`);
      const n = normalTowards(g.d, o.ls || this._defaultSide(g.d));
      this._text(add(g.m, mul(n, 0.3)), n, o.l, 'lbl');
      if (o.i != null) this.cur(p, q, o.i, o.is || o.ls || this._defaultSide(g.d), o.it || 0.84);
      return this;
    }

    // Battery from p (−) to q (+): long plate on the + side.
    bat(p, q, o = {}) {
      const g = this._two(p, q, 0.16);
      const n = [-g.d[1], g.d[0]];
      this._path([add(g.b, mul(n, 0.32)), sub(g.b, mul(n, 0.32))], 'w');
      this._path([add(g.a, mul(n, 0.16)), sub(g.a, mul(n, 0.16))], 'w thick');
      const ns = normalTowards(g.d, o.ls || 'left');
      this._text(add(add(g.b, mul(g.d, 0.14)), mul(ns, -0.42)), mul(ns, -1), '+', 'lbl small');
      this._text(add(g.m, mul(ns, 0.45)), ns, o.l, 'lbl');
      return this;
    }

    lamp(p, q, o = {}) {
      const r = 0.28;
      const g = this._two(p, q, 2 * r);
      const [x, y] = this.P(g.m);
      this.P(add(g.m, [r, r])); this.P(sub(g.m, [r, r]));
      const k = r * S * Math.SQRT1_2;
      this.els.push(`<circle class="c" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r * S).toFixed(1)}"/>`);
      this.els.push(`<path class="w" d="M${x - k} ${y - k}L${x + k} ${y + k}M${x - k} ${y + k}L${x + k} ${y - k}"/>`);
      const n = normalTowards(g.d, o.ls || this._defaultSide(g.d));
      this._text(add(g.m, mul(n, r + 0.12)), n, o.l, 'lbl');
      return this;
    }

    // Current arrow (blue) on the segment p→q, centred at fraction t.
    cur(p, q, label, side, t = 0.5) {
      if (label == null) return this;
      const d = unit(sub(q, p));
      const c = lerp(p, q, t);
      const a = sub(c, mul(d, 0.22)), b = add(c, mul(d, 0.22));
      this._path([a, b], 'cur');
      this._head(b, d, 'cur-h');
      const n = normalTowards(d, side || this._defaultSide(d));
      this._text(add(c, mul(n, 0.22)), n, label, 'cur-t');
      return this;
    }

    // Voltage arrow (red, curved) beside the element p→q, pointing from p to q.
    vol(p, q, label, side, span = [0.24, 0.76]) {
      if (label == null) return this;
      const d = unit(sub(q, p));
      const n = normalTowards(d, side || this._defaultSide(d));
      const a = add(lerp(p, q, span[0]), mul(n, 0.42));
      const b = add(lerp(p, q, span[1]), mul(n, 0.42));
      const arcLen = len(sub(b, a));
      const c = add(lerp(a, b, 0.5), mul(n, Math.min(0.6, 0.35 * arcLen)));
      const [ax, ay] = this.P(a), [bx, by] = this.P(b), [cx, cy] = this.P(c);
      this.els.push(`<path class="vol" d="M${ax.toFixed(1)} ${ay.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}"/>`);
      this._head(b, sub(b, c), 'vol-h');
      const mid = add(mul(add(a, b), 0.25), mul(c, 0.5));
      this._text(add(mid, mul(n, 0.12)), n, label, 'vol-t');
      return this;
    }

    toSVG(cls = 'circuit') {
      if (this.autoDots) this._junctions();
      const pad = 10;
      const [x0, y0, x1, y1] = this.box;
      const w = x1 - x0 + 2 * pad, h = y1 - y0 + 2 * pad;
      // Shown 1.3× larger than drawn; on narrow screens it shrinks, but not below 75 % so the
      // labels stay legible (the page then lets the figure scroll horizontally).
      const display = (w * 1.3).toFixed(0), min = (w * 0.75).toFixed(0);
      return `<svg class="${cls}" viewBox="${(x0 - pad).toFixed(1)} ${(y0 - pad).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}" width="${display}" style="width:${display}px;max-width:100%;min-width:${min}px;height:auto" role="img">${this.els.join('')}</svg>`;
    }
  }

  const Circuit = { Sketch, richText, esc, textWidth, S };
  root.Circuit = Circuit;
  if (typeof module !== 'undefined') module.exports = Circuit;
})(typeof window !== 'undefined' ? window : globalThis);
