// Drawings: the states of a situation side by side, as on the worksheet, with balls, blocks,
// springs, tracks and pendulums, dashed height arrows from the zero level, velocity arrows, and
// under them (in solutions) an energy bar chart per state: one column per form of energy, all
// charts on the same scale, with the total energy as a dashed line. The drawing is cropped to
// what it contains.
(function (root) {
  'use strict';

  const EC = root.EC;
  const f = (x) => (Math.round(x * 10) / 10).toString();
  const HEAD = 9, BARB = 3.6;

  class Fig {
    constructor(label) { this.label = label || ''; this.parts = []; this.box0 = [Infinity, Infinity, -Infinity, -Infinity]; }
    see(x, y) { const b = this.box0; b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y); b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], y); }
    // A text's extent, roughly: 7.5 px per character of 13–16 px text.
    seeText(x, y, html, anchor) {
      const w = html.replace(/<[^>]*>/g, '').replace(/​/g, '').length * 7.5;
      const x0 = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
      this.see(x0, y - 14); this.see(x0 + w, y + 5);
    }
    add(svg) { this.parts.push(svg); return this; }
    line(x1, y1, x2, y2, cls = 'w') { this.see(x1, y1); this.see(x2, y2); return this.add(`<line class="${cls}" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}"/>`); }
    path(d, pts, cls = 'w') { pts.forEach((p) => this.see(...p)); return this.add(`<path class="${cls}" d="${d}"/>`); }
    rect(x, y, w, h, cls = 'body') { this.see(x, y); this.see(x + w, y + h); return this.add(`<rect class="${cls}" x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}"/>`); }
    circle(cx, cy, r, cls = 'body') { this.see(cx - r, cy - r); this.see(cx + r, cy + r); return this.add(`<circle class="${cls}" cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}"/>`); }
    text(x, y, html, cls = 'lbl', anchor = 'middle') { this.seeText(x, y, html, anchor); return this.add(`<text class="${cls}" x="${f(x)}" y="${f(y)}" text-anchor="${anchor}">${html}</text>`); }
    // The head of an arrow ending at (x2, y2) in the direction u; returns where its line ends.
    head(x2, y2, u, cls) {
      const n = [-u[1], u[0]], b = [x2 - HEAD * u[0], y2 - HEAD * u[1]], c = [x2 - 0.75 * HEAD * u[0], y2 - 0.75 * HEAD * u[1]];
      const pts = [[x2, y2], [b[0] + BARB * n[0], b[1] + BARB * n[1]], c, [b[0] - BARB * n[0], b[1] - BARB * n[1]]];
      this.add(`<polygon class="${cls}" points="${pts.map((p) => p.map(f).join(',')).join(' ')}"/>`);
      return c;
    }
    // An arrow from (x1, y1) to (x2, y2), with a slim notched head.
    arrow(x1, y1, x2, y2, cls = 'vel') {
      const len = Math.hypot(x2 - x1, y2 - y1), u = [(x2 - x1) / len, (y2 - y1) / len];
      this.see(x1, y1); this.see(x2, y2);
      this.add(`<g class="${cls}">`);
      const c = this.head(x2, y2, u, '');
      this.parts.splice(this.parts.length - 1, 0, `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(c[0])}" y2="${f(c[1])}"/>`);
      return this.add('</g>');
    }
    // A fixed surface from x1 to x2 at height y, hatched below (side 1) or above (side -1).
    surface(x1, x2, y, side = 1) {
      let d = '';
      for (let x = x1 + 5; x < x2; x += 8) d += `M${f(x)} ${f(y)}l-6 ${f(6 * side)}`;
      this.see(x1 - 6, y + 6 * side);
      this.add(`<path class="hatch" d="${d}"/>`);
      return this.line(x1, y, x2, y, 'ground');
    }
    // A wall at x from y1 to y2 (y1 below), hatched on the left.
    wall(x, y1, y2) {
      let d = '';
      for (let y = y1 - 5; y > y2; y -= 8) d += `M${f(x)} ${f(y)}l-6 -6`;
      this.see(x - 6, y2);
      this.add(`<path class="hatch" d="${d}"/>`);
      return this.line(x, y1, x, y2, 'ground');
    }
    // A coil spring from p1 to p2 (straight ends, zigzag between), drawn for any length.
    spring(p1, p2, width = 9, coils = 8) {
      const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), u = [(p2[0] - p1[0]) / len, (p2[1] - p1[1]) / len], n = [-u[1], u[0]];
      const end = Math.min(8, len * 0.12), zl = len - 2 * end, at = (s, w) => [p1[0] + s * u[0] + w * n[0], p1[1] + s * u[1] + w * n[1]];
      const pts = [at(0, 0), at(end, 0)];
      for (let k = 0; k < 2 * coils; k++) pts.push(at(end + ((k + 0.5) * zl) / (2 * coils), k % 2 ? -width : width));
      pts.push(at(len - end, 0), at(len, 0));
      pts.forEach((p) => this.see(...p));
      return this.add(`<polyline class="spring" points="${pts.map((p) => p.map(f).join(',')).join(' ')}"/>`);
    }
    // A dimension arrow along x from y1 (the zero level) to y2, dashed, labelled on the left.
    dim(x, y1, y2, label, side = -1) {
      const c = this.head(x, y2, [0, y2 < y1 ? -1 : 1], 'dimhead');
      this.line(x, y1, x, c[1], 'w dash');
      if (label) this.text(x + side * 7, (y1 + y2) / 2 + 5, label, 'lbl', side < 0 ? 'end' : 'start');
      return this;
    }
    // The label of a state, ①, highlighted if hl.
    state(x, y, i, hl) { (this.xs = this.xs || [])[i] = x; return this.text(x, y, EC.CIRCLED[i], `lbl state${hl ? ' hl' : ''}`); }

    // Energy bar charts under the drawing: per state { pot, kin, el } (J; zero or missing: none),
    // in the columns forms. Opts: only (indices of states to show; the others are left empty),
    // hl (indices to highlight).
    bars(states, forms, opts = {}) {
      const b = this.box0, total = Math.max(...states.map((s) => forms.reduce((a, k) => a + (s[k] || 0), 0))) || 1;
      const H = 64, cw = 18, gap = 12, gw = forms.length * cw + (forms.length - 1) * gap;
      const n = states.length, step = Math.max(gw + 56, Math.min(170, (b[2] - b[0]) / n));
      const cx0 = (b[0] + b[2]) / 2 - ((n - 1) * step) / 2, y0 = b[3] + 30 + H;
      // under the states, if they are far enough apart; else evenly spaced
      const xs = this.xs && this.xs.length === n && this.xs.every((x, i) => i === 0 || x - this.xs[i - 1] >= gw + 40) ? this.xs : null;
      states.forEach((s, i) => {
        const cx = xs ? xs[i] : cx0 + i * step, x0 = cx - gw / 2, shown = !opts.only || opts.only.has(i), hl = opts.hl && opts.hl.has(i);
        if (hl) this.rect(x0 - 12, y0 - H - 12, gw + 24, H + 56, 'bars-hl');
        // the total energy, the same in every state
        this.line(x0 - 6, y0 - H, x0 + gw + 6, y0 - H, 'w total');
        forms.forEach((k, j) => {
          const x = x0 + j * (cw + gap), e = shown ? s[k] || 0 : 0, h = (H * e) / total;
          if (h > 0.5) this.rect(x, y0 - h, cw, h, `bar e-${k}`);
          this.text(x + cw / 2, y0 + 15, EC.esvg(k), 'lbl tiny');
        });
        this.line(x0 - 6, y0, x0 + gw + 6, y0, 'w axis');
        this.text(cx, y0 + 44, EC.CIRCLED[i], `lbl state${hl ? ' hl' : ''}`);
      });
      return this;
    }

    // One energy bar chart for the current moment, its base at (x0, y0): E = { pot, kin, el } in the
    // columns forms, scaled so that the total energy is H high (the dashed line).
    meter(x0, y0, E, forms, total, H = 130) {
      const cw = 24, gap = 14, gw = forms.length * cw + (forms.length - 1) * gap;
      this.line(x0 - 8, y0 - H, x0 + gw + 8, y0 - H, 'w total');
      forms.forEach((k, j) => {
        const x = x0 + j * (cw + gap), h = Math.max(0, (H * (E[k] || 0)) / total);
        if (h > 0.3) this.rect(x, y0 - h, cw, h, `bar e-${k}`);
        this.text(x + cw / 2, y0 + 17, EC.esvg(k), 'lbl small');
      });
      this.text(x0 + gw + 12, y0 - H + 5, `<tspan font-style="italic">E</tspan>`, 'lbl small', 'start');
      return this.line(x0 - 8, y0, x0 + gw + 8, y0, 'w axis');
    }
    // the drawing's parts, without the <svg> around them (for animations, see motion.js)
    inner() { return this.parts.join(''); }

    // box: a fixed [x0, y0, x1, y1] instead of what the drawing contains (animations)
    render(box) {
      const m = 10, b = box || this.box0;
      const x = b[0] - m, y = b[1] - m, w = b[2] - b[0] + 2 * m, h = b[3] - b[1] + 2 * m;
      return `<figure class="fig"><svg viewBox="${f(x)} ${f(y)} ${f(w)} ${f(h)}" width="${f(w)}" height="${f(h)}" role="img" aria-label="${this.label}">${this.parts.join('')}</svg></figure>`;
    }
  }

  root.Draw = { Fig };
  if (typeof module !== 'undefined') module.exports = root.Draw;
})(typeof window !== 'undefined' ? window : globalThis);
