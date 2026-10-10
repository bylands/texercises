// The drawings of Matter Waves, as SVG strings (in user units, y down; the classes are in style.css):
//   graph(o)                 axes with a grid and ticks: o = { x: [lo, hi, step], y: [lo, hi, step],
//                            xl, yl (axis labels, SVG text), w, h, ml, minor, noXTicks, noYTicks };
//                            returns { X(x), Y(y), s (the SVG of the axes), svg(body, label, cls) }
//   tube(o)                  an electron diffraction tube from the side: gun, graphite foil, the
//                            screen at the distance L, a ring of radius r
//   rings(radii, o)          the screen seen from the front: rings of the given radii (mm), drawn
//                            to the scale o.max (the radius at the edge of the screen)
//   slitGraph(list, o)       intensity behind a single slit against the angle (degrees):
//                            list [{ b, lam (same unit), cls, dash }]
//   box(o)                   a particle in a box of width L (infinite walls) and its wavefunction:
//                            o = { n, sq (|ψ|² instead of ψ), kind, ticks (L/4, L/2, 3L/4) }; kind
//                            'ok', or a wrong drawing: 'walls' (antinodes at the walls), 'onewall'
//                            (zero at one wall only), 'outside' (the wave goes on beyond the walls),
//                            'flat' (|ψ|² the same everywhere), 'psi' (ψ where |ψ|² is asked)
//   levels(nmax)             the energy levels of the box, E_n ∝ n², each with its standing wave
//   packet(mu, sigma, o)     a probability density |ψ|² of the shape of a bell around mu, of width
//                            sigma (x from 0 to 1, area 1), drawn to the height o.ymax
(function (root) {
  'use strict';

  const M = root.MatterWave || require('./physics.js');
  const Lang = root.Lang || require('./lang.js');
  const L = (en, de) => Lang.L(en, de);
  const f1 = (x) => Math.round(x * 10) / 10;
  const dec = (x) => String(Math.round(x * 1000) / 1000).replace('-', '−');
  const it = (s) => `<tspan font-style="italic">${s}</tspan>`;
  const sub = (s) => `<tspan font-size="72%" dy="4">${s}</tspan><tspan dy="-4">​</tspan>`;

  // ---------------------------------------------------------------- axes
  function graph(o) {
    const w = o.w || 340, h = o.h || 230, ml = o.ml || 44, mr = 16, mt = 22, mb = 36;
    const [x0, x1, xs] = o.x, [y0, y1, ys] = o.y;
    const X = (x) => f1(ml + ((x - x0) / (x1 - x0)) * (w - ml - mr));
    const Y = (y) => f1(mt + ((y1 - y) / (y1 - y0)) * (h - mt - mb));
    let s = '';
    const minor = o.minor || 1;
    for (let k = 0; k <= Math.round(((x1 - x0) / xs) * minor); k++) { const x = x0 + (k * xs) / minor; s += `<line class="${k % minor ? 'grid minor' : 'grid'}" x1="${X(x)}" y1="${Y(y0)}" x2="${X(x)}" y2="${Y(y1)}"/>`; }
    for (let k = 0; k <= Math.round(((y1 - y0) / ys) * minor); k++) { const y = y0 + (k * ys) / minor; s += `<line class="${k % minor ? 'grid minor' : 'grid'}" x1="${X(x0)}" y1="${Y(y)}" x2="${X(x1)}" y2="${Y(y)}"/>`; }
    const ax = Math.max(x0, Math.min(x1, 0)), ay = Math.max(y0, Math.min(y1, 0));
    s += `<line class="ax" x1="${X(x0)}" y1="${Y(ay)}" x2="${X(x1) + 8}" y2="${Y(ay)}"/><path class="axhead" d="M${X(x1) + 12} ${Y(ay)} l-7 -3.5 v7 z"/>`;
    s += `<line class="ax" x1="${X(ax)}" y1="${Y(y0)}" x2="${X(ax)}" y2="${Y(y1) - 8}"/><path class="axhead" d="M${X(ax)} ${Y(y1) - 12} l-3.5 7 h7 z"/>`;
    if (!o.noXTicks) for (let k = 0; k <= Math.round((x1 - x0) / xs); k++) { const x = x0 + k * xs; if (Math.abs(x) > 1e-9 || ay !== y0) s += `<text class="tick" x="${X(x)}" y="${Y(y0) + 16}" text-anchor="middle">${dec(x)}</text>`; }
    if (!o.noYTicks) for (let k = 0; k <= Math.round((y1 - y0) / ys); k++) { const y = y0 + k * ys; s += `<text class="tick" x="${X(x0) - 6}" y="${Y(y) + 4}" text-anchor="end">${dec(y)}</text>`; }
    s += `<text class="lbl" x="${w - 4}" y="${h - 4}" text-anchor="end">${o.xl}</text>`;
    s += `<text class="lbl" x="${X(ax) + 10}" y="14" text-anchor="start">${o.yl}</text>`;
    const svg = (body, label, cls = '') => `<svg class="mw graph ${cls}" viewBox="0 0 ${w} ${h}" width="${w}" role="img" aria-label="${label}">${s}${body}</svg>`;
    return { X, Y, s, svg, w, h };
  }
  const poly = (pts, cls, extra = '') => `<polyline class="${cls}" points="${pts.map(([x, y]) => `${x},${y}`).join(' ')}"${extra}/>`;
  const arrow = (x1, y1, x2, y2, cls = 'dim') => {
    const a = Math.atan2(y2 - y1, x2 - x1), hx = (dx, dy) => `${f1(x2 + dx * Math.cos(a) - dy * Math.sin(a))} ${f1(y2 + dx * Math.sin(a) + dy * Math.cos(a))}`;
    return `<line class="${cls}" x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}"/><path class="${cls}head" d="M${f1(x2)} ${f1(y2)} L${hx(-7, -3)} L${hx(-7, 3)} z"/>`;
  };
  // a dimension line with arrows at both ends and a label
  const span = (x1, y1, x2, y2, label, dx = 0, dy = -6) => `${arrow((x1 + x2) / 2, (y1 + y2) / 2, x1, y1)}${arrow((x1 + x2) / 2, (y1 + y2) / 2, x2, y2)}<text class="lbl small" x="${f1((x1 + x2) / 2 + dx)}" y="${f1((y1 + y2) / 2 + dy)}" text-anchor="middle">${label}</text>`;

  // ---------------------------------------------------------------- the diffraction tube
  function tube(o = {}) {
    let s = '<path class="glass" d="M20 70 h80 C150 70 190 18 290 14 H300 V166 H290 C190 162 150 110 100 110 h-80 z"/>';
    s += '<rect class="gun" x="28" y="80" width="40" height="20" rx="3"/>';
    s += `<text class="lbl small" x="48" y="128" text-anchor="middle">${L('electron gun', 'Elektronenkanone')}</text>`;
    s += '<line class="beam" x1="68" y1="90" x2="140" y2="90"/><line class="foil" x1="142" y1="76" x2="142" y2="104"/>';
    s += `<text class="lbl small" x="142" y="120" text-anchor="middle">${L('graphite', 'Graphit')}</text>`;
    s += '<line class="beam" x1="142" y1="90" x2="300" y2="90" opacity="0.5"/><line class="beam diff" x1="142" y1="90" x2="300" y2="44"/><line class="beam diff" x1="142" y1="90" x2="300" y2="136"/>';
    s += '<line class="screen" x1="300" y1="14" x2="300" y2="166"/>';
    s += `<circle class="spot" cx="300" cy="90" r="3"/><circle class="spot" cx="300" cy="44" r="3"/><circle class="spot" cx="300" cy="136" r="3"/>`;
    s += span(142, 176, 300, 176, it('L'), 0, -5);
    s += span(314, 90, 314, 44, it('r'), 10, 4);
    if (o.U) s += `<text class="lbl small" x="96" y="160" text-anchor="middle">${it('U')} = ${o.U}</text>`;
    return `<svg class="mw tube" viewBox="0 0 340 190" width="340" role="img" aria-label="${L('An electron diffraction tube: electrons pass a thin graphite foil and make rings on the screen at the distance L', 'Eine Elektronenbeugungsröhre: Elektronen durchqueren eine dünne Graphitfolie und erzeugen Ringe auf dem Schirm im Abstand L')}">${s}</svg>`;
  }
  function rings(radii, o = {}) {
    const R = 80, k = R / (o.max || Math.max(...radii) * 1.6), cx = 100, cy = 95;
    let s = `<circle class="screenface" cx="${cx}" cy="${cy}" r="${R + 6}"/><circle class="spot" cx="${cx}" cy="${cy}" r="4"/>`;
    radii.forEach((r, j) => { s += `<circle class="ring${j ? ' outer' : ''}" cx="${cx}" cy="${cy}" r="${f1(r * k)}"/>`; });
    if (o.label) s += span(cx, cy, cx + radii[0] * k * 0.707, cy - radii[0] * k * 0.707, '', 0, 0) + `<text class="lbl small" x="${f1(cx + radii[0] * k * 0.35 - 10)}" y="${f1(cy - radii[0] * k * 0.35 - 6)}">${it('r')}</text>`;
    return `<svg class="mw rings" viewBox="0 0 200 190" width="200" role="img" aria-label="${L('The screen: a bright spot in the middle and diffraction rings around it', 'Der Schirm: ein heller Fleck in der Mitte und Beugungsringe darum')}">${s}</svg>`;
  }

  const sinc2 = (x) => (Math.abs(x) < 1e-9 ? 1 : (Math.sin(x) / x) ** 2);

  // ---------------------------------------------------------------- the single slit
  function slitGraph(list, o = {}) {
    const amax = o.amax || 10;
    const step = amax > 20 ? 10 : amax > 8 ? 5 : amax > 4 ? 2 : 1;
    const g = graph({ x: [-amax, amax, step], y: [0, 1, 0.5], xl: `${it('α')} in °`, yl: L('intensity', 'Intensität'), noYTicks: true, w: o.w || 360, h: o.h || 200, ml: 18 });
    const body = list.map((k) => {
      const pts = [];
      for (let a = -amax; a <= amax + 1e-9; a += amax / 200) pts.push([g.X(a), g.Y(sinc2((Math.PI * k.b * Math.sin((a * Math.PI) / 180)) / k.lam))]);
      return poly(pts, `curve ${k.cls || ''}`, k.dash ? ' stroke-dasharray="5 4"' : '');
    }).join('');
    return g.svg(body, L('Intensity behind a single slit against the angle', 'Intensität hinter einem Einzelspalt gegen den Winkel'), o.small ? 'small' : '');
  }

  // ---------------------------------------------------------------- the particle in a box
  const psiLabel = (sq) => (sq ? `|${it('ψ')}|²` : it('ψ'));
  const WAVE = {
    ok: (n, t) => Math.sin(n * Math.PI * t), psi: (n, t) => Math.sin(n * Math.PI * t), outside: (n, t) => Math.sin(n * Math.PI * t),
    walls: (n, t) => Math.cos(n * Math.PI * t), onewall: (n, t) => Math.sin((n - 0.5) * Math.PI * t), flat: () => Math.SQRT1_2,
  };
  function box(o = {}) {
    const n = o.n || 1, kind = o.kind || 'ok', w = o.w || 300, hh = o.h || 150, a = 50, b = w - 50, top = 14, bot = hh - 30;
    const signed = !o.sq || kind === 'psi';
    const y0 = signed ? (top + bot) / 2 : bot, amp = signed ? (bot - top) / 2 - 6 : bot - top - 8;
    const X = (t) => f1(a + t * (b - a));
    const val = (t) => { const f = WAVE[kind](n, t); return signed ? f : f * f; };
    let s = `<line class="ax0" x1="${a - 26}" y1="${y0}" x2="${b + 26}" y2="${y0}"/>`;
    const [t0, t1] = kind === 'outside' ? [-0.16, 1.16] : [0, 1];
    const pts = [];
    for (let k = 0; k <= 240; k++) { const t = t0 + ((t1 - t0) * k) / 240; pts.push([X(t), f1(y0 - amp * val(t))]); }
    if (!signed) s += `<path class="dens" d="M${X(t0)} ${y0} ${pts.map(([x, y]) => `L${x} ${y}`).join(' ')} L${X(t1)} ${y0} Z"/>`;
    s += poly(pts, 'psi');
    s += `<path class="boxwall" d="M${a} ${top - 6} V${bot + 6} M${b} ${top - 6} V${bot + 6}"/>`;
    for (let y = top; y <= bot; y += 12) s += `<path class="hatch" d="M${a} ${y} l-8 8 M${b} ${y} l8 8"/>`;
    s += `<text class="lbl small" x="${a}" y="${hh - 8}" text-anchor="middle">0</text><text class="lbl small" x="${b}" y="${hh - 8}" text-anchor="middle">${it('L')}</text>`;
    if (o.ticks) {
      [['L/4', 0.25], ['L/2', 0.5], ['3L/4', 0.75]].forEach(([t, x]) => {
        const [num, den] = t.split('/');
        s += `<line class="dim" x1="${X(x)}" y1="${bot}" x2="${X(x)}" y2="${bot + 5}"/><text class="lbl small" x="${X(x)}" y="${hh - 8}" text-anchor="middle">${num.replace('L', '')}${it('L')}/${den}</text>`;
      });
    }
    s += `<text class="lbl small" x="8" y="${top + 8}">${psiLabel(!!o.sq)}</text>`;
    const what = !o.sq ? L('the wavefunction ψ', 'die Wellenfunktion ψ') : L('the probability density |ψ|²', 'die Wahrscheinlichkeitsdichte |ψ|²');
    return `<svg class="mw box${o.small ? ' small' : ''}" viewBox="0 0 ${w} ${hh}" width="${w}" role="img" aria-label="${L(`A box of width L with infinitely high walls, and ${what}`, `Ein Kasten der Breite L mit unendlich hohen Wänden, und ${what}`)}">${s}</svg>`;
  }
  // The levels E_n = n²·E₁ of the box, each with its standing wave drawn on it.
  function levels(nmax = 3) {
    const w = 320, hh = 250, a = 70, b = 250, top = 20, bot = hh - 26, amp = Math.min(14, ((bot - top) / (nmax * nmax)) * 1.4);
    const Y = (E) => f1(bot - ((bot - top - 34) * E) / (nmax * nmax));
    let s = `<line class="ax" x1="30" y1="${bot}" x2="30" y2="${top - 4}"/><path class="axhead" d="M30 ${top - 10} l-3.5 7 h7 z"/><text class="lbl small" x="38" y="${top}">${it('E')}</text>`;
    for (let n = 1; n <= nmax; n++) {
      const y = Y(n * n), pts = [];
      for (let k = 0; k <= 160; k++) { const t = k / 160; pts.push([f1(a + t * (b - a)), f1(y - amp * Math.sin(n * Math.PI * t))]); }
      s += `<line class="energy" x1="${a}" y1="${y}" x2="${b}" y2="${y}"/>${poly(pts, 'psi')}`;
      s += `<text class="lbl small" x="${b + 10}" y="${y + 4}">${it('n')} = ${n}: ${n === 1 ? '' : n * n}${it('E')}${sub('1')}</text>`;
    }
    s += `<path class="boxwall" d="M${a} ${top - 6} V${bot} H${b} V${top - 6}"/>`;
    s += `<text class="lbl small" x="${a}" y="${hh - 6}" text-anchor="middle">0</text><text class="lbl small" x="${b}" y="${hh - 6}" text-anchor="middle">${it('L')}</text>`;
    return `<svg class="mw levels" viewBox="0 0 ${w + 50} ${hh}" width="${w + 50}" role="img" aria-label="${L('The energy levels of a particle in a box, E_n = n²·E₁, each with its standing wave: one, two, three half waves', 'Die Energieniveaus eines Teilchens im Kasten, E_n = n²·E₁, jedes mit seiner stehenden Welle: eine, zwei, drei halbe Wellen')}">${s}</svg>`;
  }

  // ---------------------------------------------------------------- a probability density
  function packet(mu, sigma, o = {}) {
    const w = o.w || 240, hh = o.h || 110, a = 14, b = w - 14, bot = hh - 18, top = 10, ymax = o.ymax || 1 / (sigma * Math.sqrt(2 * Math.PI));
    const X = (x) => f1(a + x * (b - a)), Y = (y) => f1(bot - ((bot - top) * y) / ymax);
    const pts = [];
    for (let k = 0; k <= 200; k++) { const x = k / 200; pts.push([X(x), Y(Math.exp(-(((x - mu) / sigma) ** 2) / 2) / (sigma * Math.sqrt(2 * Math.PI)))]); }
    let s = `<path class="dens" d="M${X(0)} ${bot} ${pts.map(([x, y]) => `L${x} ${y}`).join(' ')} L${X(1)} ${bot} Z"/>${poly(pts, 'psi')}`;
    s += `<line class="ax" x1="${a}" y1="${bot}" x2="${b + 4}" y2="${bot}"/><path class="axhead" d="M${b + 10} ${bot} l-7 -3.5 v7 z"/><text class="lbl small" x="${b - 2}" y="${hh - 2}" text-anchor="end">${it('x')}</text>`;
    s += `<text class="lbl small" x="${a + 2}" y="${top + 8}">${psiLabel(true)}</text>`;
    return `<svg class="mw packet${o.small ? ' small' : ''}" viewBox="0 0 ${w} ${hh}" width="${w}" role="img" aria-label="${L('A probability density |ψ|² against x, shaped like a bell', 'Eine Wahrscheinlichkeitsdichte |ψ|² gegen x, glockenförmig')}">${s}</svg>`;
  }

  const api = { graph, tube, rings, slitGraph, box, levels, packet };
  root.MatterPlot = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
