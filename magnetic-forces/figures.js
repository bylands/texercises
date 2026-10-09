// The pictures of the problems (realproblems.js), in the manner of a physics textbook, drawn with
// the shared figure kit (figkit.js).
//   MagFigures.<name>(args)  an SVG in a <div class="fig">
//     earth({ aurora | cosmic }), spectro(), cyclo(), beam(), detector(), cables()
(function (root) {
  'use strict';

  const Fig = root.Fig || require('./figkit.js');
  const Lang = root.Lang || require('./lang.js');
  const { svg, path, line, circle, rect, text } = Fig;
  const L = (en, de) => Lang.L(en, de);
  const cap = (x, y, s, anchor = 'middle') => text(x, y, s, 'tb-cap', anchor);
  const f1 = (x) => Math.round(x * 10) / 10;
  function arrow(x1, y1, x2, y2, cls = 'mf-arrow') {
    const d = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / d, uy = (y2 - y1) / d, bx = x2 - 9 * ux, by = y2 - 9 * uy;
    return `<g class="${cls}"><line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(bx)}" y2="${f1(by)}"/><polygon points="${f1(x2)},${f1(y2)} ${f1(bx - 4 * uy)},${f1(by + 4 * ux)} ${f1(bx + 4 * uy)},${f1(by - 4 * ux)}"/></g>`;
  }
  const marks = (x0, y0, w, h, step, out) => {
    let s = '';
    for (let x = x0 + step / 2; x < x0 + w; x += step) for (let y = y0 + step / 2; y < y0 + h; y += step) s += out ? circle(x, y, 1.8, 'tb-line-fill') : path(`M${f1(x - 3)} ${f1(y - 3)}l6 6m0 -6l-6 6`, 'tb-thin');
    return s;
  };

  // ---------------------------------------------------------------- the Earth with its field lines
  function earth(o) {
    const cx = 180, cy = 130, R = 52;
    let s = '';
    // dipole field lines r = k·sin²θ, on both sides
    for (const k of [80, 115, 160]) for (const side of [1, -1]) {
      let d = '';
      for (let th = 0.12; th <= Math.PI - 0.12; th += 0.04) { const rr = k * Math.sin(th) ** 2; if (rr < R) continue; const x = cx + side * rr * Math.sin(th), y = cy - rr * Math.cos(th); d += `${d ? 'L' : 'M'}${f1(x)} ${f1(y)} `; }
      s += path(d, 'mf-fieldline');
    }
    s += circle(cx, cy, R, 'tb-blue') + path(`M${cx - 30} ${cy - 20} q20 -14 40 -4 q10 18 -12 26 q-18 6 -28 -22 Z`, 'tb-green') + cap(cx, cy + R + 16, L('Earth', 'Erde'));
    s += cap(cx, cy - R - 8, 'N');
    if (o.aurora) {
      // a particle spiralling along a field line towards the north pole, and the glow
      let d = '';
      for (let t = 0; t <= 1; t += 0.01) { const th = 0.55 + 0.6 * t, rr = 115 * Math.sin(th) ** 2, x = cx + rr * Math.sin(th) + 7 * Math.sin(t * 40), y = cy - rr * Math.cos(th) + 4 * Math.cos(t * 40); d += `${d ? 'L' : 'M'}${f1(x)} ${f1(y)} `; }
      s += path(d, 'mf-traj') + path(`M${cx - 26} ${cy - R + 6} q26 -16 52 0`, 'mf-glow') + cap(cx + 110, 30, L('solar wind', 'Sonnenwind'));
      s += arrow(340, 40, 300, 60) + arrow(340, 80, 300, 90);
    }
    if (o.cosmic) {
      s += arrow(cx, 6, cx, cy - R - 14) + arrow(cx + 120, cy - 40, cx + R + 10, cy - 10) + cap(cx + 26, 18, L('at the pole: along the field', 'am Pol: längs des Feldes'), 'start') + cap(cx + 124, cy - 48, L('at the equator: across the field', 'am Äquator: quer zum Feld'), 'start');
    }
    return svg(380, 260, s, L('The Earth with its magnetic field lines', 'Die Erde mit ihren Magnetfeldlinien'));
  }

  // ---------------------------------------------------------------- a mass spectrometer
  function spectro() {
    const s = rect(20, 30, 330, 150, 'mf-region', 4) + marks(20, 30, 330, 150, 22, true) + rect(20, 176, 330, 8, 'tb-dark') +
      path('M60 240 V180 A70 70 0 0 1 200 180', 'mf-traj') + path('M60 180 A90 90 0 0 1 240 180', 'mf-traj2') +
      arrow(60, 250, 60, 214) + cap(60, 262, L('ions', 'Ionen')) + cap(200, 198, L('light', 'leicht')) + cap(240, 198, L('heavy', 'schwer')) + cap(330, 22, L('field out of the page', 'Feld aus der Seite heraus'), 'end') + cap(300, 198, L('detector', 'Detektor'));
    return svg(370, 270, s, L('A mass spectrometer: ions on half circles in a magnetic field', 'Ein Massenspektrometer: Ionen auf Halbkreisen in einem Magnetfeld'));
  }

  // ---------------------------------------------------------------- a cyclotron
  function cyclo() {
    let sp = '';
    for (let th = 0; th < 6 * 2 * Math.PI; th += 0.05) { const r = 8 + 13 * th / (2 * Math.PI) * 1.0; sp += `${sp ? 'L' : 'M'}${f1(180 + r * Math.cos(th))} ${f1(120 + r * Math.sin(th))} `; }
    const s = path('M176 30 A90 90 0 0 0 176 210 Z', 'tb-metal') + path('M184 30 A90 90 0 0 1 184 210 Z', 'tb-metal') + path(sp, 'mf-traj') +
      cap(110, 228, L('dee', 'Duant')) + cap(250, 228, L('dee', 'Duant')) +
      line(176, 20, 176, 6, 'tb-thin') + line(184, 20, 184, 6, 'tb-thin') + circle(180, 6, 5, 'tb-thin') + cap(194, 10, '~', 'start') + cap(330, 30, L('field into the page', 'Feld in die Seite hinein'), 'end');
    return svg(360, 240, s, L('A cyclotron: two dees, the protons spiral outwards', 'Ein Zyklotron: zwei Duanten, die Protonen spiralen nach aussen'));
  }

  // ---------------------------------------------------------------- a fine-beam tube
  function beam() {
    const s = circle(180, 120, 96, 'tb-glass') + `<ellipse class="mf-coil" cx="180" cy="120" rx="118" ry="118"/>` + circle(180, 128, 58, 'mf-beam') +
      rect(170, 182, 20, 40, 'tb-dark', 3) + cap(180, 238, L('electron gun', 'Elektronenkanone')) + cap(320, 28, L('Helmholtz coils', 'Helmholtzspulen'), 'end') + cap(180, 118, L('glowing beam', 'leuchtender Strahl'));
    return svg(360, 250, s, L('A fine-beam tube: the electron beam forms a circle', 'Ein Fadenstrahlrohr: Der Elektronenstrahl bildet einen Kreis'));
  }

  // ---------------------------------------------------------------- a particle detector
  function detector() {
    let s = circle(180, 120, 104, 'tb-concrete') + circle(180, 120, 92, 'tb-glass') + circle(180, 120, 8, 'tb-dark');
    const track = (k, a0, len) => { let d = '', x = 180, y = 120, h = a0; for (let i = 0; i < len; i++) { x += 2 * Math.cos(h); y += 2 * Math.sin(h); h += k; d += `${d ? 'L' : 'M'}${f1(x)} ${f1(y)} `; } return path(d, 'mf-track'); };
    s += track(0.02, -0.4, 42) + track(-0.03, 2.2, 40) + track(0.002, 1.2, 44) + track(-0.008, 3.9, 44) + cap(180, 240, L('the field points out of the page, along the beam', 'das Feld zeigt aus der Seite heraus, längs des Strahls'));
    return svg(360, 250, s, L('A particle detector seen along the beam, with curved tracks', 'Ein Teilchendetektor längs des Strahls gesehen, mit gekrümmten Spuren'));
  }

  // ---------------------------------------------------------------- two cables
  function cables() {
    const s = rect(20, 60, 320, 14, 'mf-cable', 7) + rect(20, 130, 320, 14, 'mf-cable', 7) + arrow(140, 50, 220, 50) + arrow(220, 156, 140, 156) +
      cap(180, 40, `<tspan font-style="italic">I</tspan>`) + cap(180, 174, `<tspan font-style="italic">I</tspan>`) + Fig.dim([350, 67], [350, 137], `<tspan font-style="italic">d</tspan>`, -12);
    return svg(390, 190, s, L('Two parallel cables with currents in opposite directions', 'Zwei parallele Kabel mit Strömen in entgegengesetzter Richtung'));
  }

  const api = { earth, spectro, cyclo, beam, detector, cables };
  root.MagFigures = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
