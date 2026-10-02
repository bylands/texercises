// Drawings: boxes, floors, slopes and pulleys with their force arrows. A scene collects the fixed
// parts and the forces; render(view) draws it either as the task (only the given forces and
// accelerations, labelled with their values) or as a free-body diagram (the forces in view.show,
// those in view.hl highlighted). Arrow lengths are proportional to the forces within a scene.
// The drawing is cropped to what it contains, counting all its forces whether shown or not, so
// that it keeps its size from one tutor step to the next; with view.tight, only what is shown.
(function (root) {
  'use strict';

  const { svgSym } = root.FS;
  const f = (x) => (Math.round(x * 10) / 10).toString();
  const MAX_LEN = 96, MIN_LEN = 30, HEAD = 10;

  class Scene {
    constructor(w, h, label) {
      this.w = w; this.h = h; this.label = label || '';
      this.parts = []; this.forces = []; this.marks = [];
      this.box0 = [Infinity, Infinity, -Infinity, -Infinity];
    }
    // Extends the bounding box.
    see(x, y) { const b = this.box0; b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y); b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], y); }
    // A text's extent, roughly: 7.5 px per character of 13–16 px text.
    seeText(x, y, html, anchor) {
      const w = html.replace(/<[^>]*>/g, '').replace(/\u200b/g, '').length * 7.5;
      const x0 = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
      this.see(x0, y - 14); this.see(x0 + w, y + 5);
    }
    add(svg) { this.parts.push(svg); return this; }
    line(x1, y1, x2, y2, cls = 'w') { this.see(x1, y1); this.see(x2, y2); return this.add(`<line class="${cls}" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}"/>`); }
    poly(pts, cls = 'body') { pts.forEach((p) => this.see(...p)); return this.add(`<polygon class="${cls}" points="${pts.map((p) => p.map(f).join(',')).join(' ')}"/>`); }
    text(x, y, html, cls = 'lbl', anchor = 'middle') { this.seeText(x, y, html, anchor); return this.add(`<text class="${cls}" x="${f(x)}" y="${f(y)}" text-anchor="${anchor}">${html}</text>`); }
    circle(cx, cy, r, cls = 'pulley') { this.see(cx - r, cy - r); this.see(cx + r, cy + r); return this.add(`<circle class="${cls}" cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}"/>`); }
    // A box from its bottom-left corner, along the unit vector u (its base) and n (upwards).
    box(o, u, n, w, h, label) {
      const at = (s, t) => [o[0] + s * u[0] + t * n[0], o[1] + s * u[1] + t * n[1]];
      this.poly([at(0, 0), at(w, 0), at(w, h), at(0, h)]);
      // the mass in the top-left corner, clear of the arrows that start at the centre and the base
      if (label) this.text(...at(6, h - 17), label, 'lbl mass', 'start');
      return at;
    }
    // A force { id, kind: g|n|r|s|k|comp, at, dir (unit vector), mag (N), sym: [key, index],
    // value (its label in the task), task: 'value'|'sym' (shown in the task), lab: offset of the
    // label from the tip }. The arrow starts where the force acts, also for pushes.
    force(spec) { this.forces.push(spec); return this; }
    // An acceleration arrow { id, at, dir, sym, value, task, lab }, drawn with a fixed length.
    accel(spec) { this.marks.push(spec); return this; }
    // An angle: arc around c from direction a0 to a1 (degrees, counter-clockwise, y up).
    angle(c, r, a0, a1, label, dist = 14) {
      const pt = (a, rr) => [c[0] + rr * Math.cos((a * Math.PI) / 180), c[1] - rr * Math.sin((a * Math.PI) / 180)];
      const [x0, y0] = pt(a0, r), [x1, y1] = pt(a1, r);
      this.add(`<path class="w thin" d="M${f(x0)} ${f(y0)} A${f(r)} ${f(r)} 0 0 0 ${f(x1)} ${f(y1)}"/>`);
      const [lx, ly] = pt((a0 + a1) / 2, r + dist);
      return this.text(lx, ly + 5, label, 'lbl small');
    }

    render(view = {}) {
      const task = !!view.task, hl = view.hl || new Set();
      const cls = (s, kind) => `force k-${kind}${hl.has(s.id) ? ' hl' : hl.size ? ' dim' : ''}`;
      const shown = (s) => (task ? !!s.task : !view.show || view.show.has(s.id));
      const mags = this.forces.filter((s) => s.mag > 1e-9).map((s) => s.mag);
      const scale = MAX_LEN / Math.max(...mags, 1e-9);
      const out = [], bounds = new Scene(0, 0);
      bounds.box0 = [...this.box0];
      const label = (s, tip, draw, count) => {
        const html = task ? (s.task === 'value' ? s.value : svgSym(...s.sym)) : svgSym(...s.sym);
        const [dx, dy] = s.lab || [8, 0];
        const anchor = dx > 3 ? 'start' : dx < -3 ? 'end' : 'middle';
        // the task's value labels and the diagram's symbols both count for the size
        if (count) {
          bounds.seeText(tip[0] + dx, tip[1] + dy + 5, s.value && s.task ? s.value : html, anchor);
          bounds.seeText(tip[0] + dx, tip[1] + dy + 5, 'Fxxx', anchor);
        }
        return draw ? `<text class="flbl" x="${f(tip[0] + dx)}" y="${f(tip[1] + dy + 5)}" text-anchor="${anchor}">${html}</text>` : '';
      };
      const arrow = (s, len, cls, draw = true) => {
        const [ux, uy] = s.dir;
        const a = s.at;
        const tip = [a[0] + len * ux, a[1] + len * uy];
        const count = draw || !view.tight;
        if (count) { bounds.see(...a); bounds.see(...tip); }
        const lbl = label(s, tip, draw, count);
        if (!draw) return;
        const end = [tip[0] - HEAD * ux, tip[1] - HEAD * uy];
        const head = [tip, [end[0] - 5 * uy, end[1] + 5 * ux], [end[0] + 5 * uy, end[1] - 5 * ux]];
        out.push(`<g class="${cls}"><line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(end[0])}" y2="${f(end[1])}"/>` +
          `<polygon points="${head.map((p) => p.map(f).join(',')).join(' ')}"/>` +
          `<circle cx="${f(a[0])}" cy="${f(a[1])}" r="2.2"/>` + lbl + '</g>');
      };
      for (const s of this.forces) {
        if (!(s.mag > 1e-9)) continue;
        arrow(s, Math.max(MIN_LEN, s.mag * scale), cls(s, s.kind), shown(s));
      }
      for (const s of this.marks) arrow(s, s.len || 46, cls(s, 'acc'), shown(s));
      const PAD = 10, [x0, y0, x1, y1] = bounds.box0.map((v, k) => Math.round(v + (k < 2 ? -PAD : PAD)));
      return `<div class="fig"><svg viewBox="${x0} ${y0} ${x1 - x0} ${y1 - y0}" width="${x1 - x0}" role="img" aria-label="${this.label}">` +
        this.parts.join('') + out.join('') + '</svg></div>';
    }
  }

  root.Draw = { Scene };
  if (typeof module !== 'undefined') module.exports = root.Draw;
})(typeof window !== 'undefined' ? window : globalThis);
