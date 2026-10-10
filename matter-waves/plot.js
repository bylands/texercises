// The drawings of Matter Waves, as SVG strings (in user units, y down; the classes are in style.css):
//   graph(o)                 axes with a grid and ticks: o = { x: [lo, hi, step], y: [lo, hi, step],
//                            xl, yl (axis labels, SVG text), w, h, ml, minor, noXTicks, noYTicks };
//                            returns { X(x), Y(y), s (the SVG of the axes), svg(body, label, cls) }
//   rGraph(o)                ring radius r (mm) against 1/√U (1/√kV): o = { pts: [[x, r]], slope
//                            (mm·√kV, the line through the origin, drawn with o.solve) }
//   tube(o)                  an electron diffraction tube from the side: gun, graphite foil, the
//                            screen at the distance L, a ring of radius r
//   rings(radii, o)          the screen seen from the front: rings of the given radii (mm)
//   screen(kind, n, seed, o) a detector screen after n particles, one dot each: kind 'double' (both
//                            slits open: fringes), 'which' (which slit is measured: no fringes),
//                            'single' (one slit closed), 'classical' (two narrow bands, as for
//                            little balls), 'narrow' (one such band), 'smear' (a smooth intensity
//                            instead of dots)
//   doubleSlit(o)            source, double slit (spacing d) and screen at the distance L, fringes Δx
//   slitGraph(list, o)       intensity behind a single slit against the angle (degrees):
//                            list [{ b, lam (same unit), cls, dash }]
//   barrier(o)               a barrier of height V₀ and width d, the energy E below its top and,
//                            unless o.wave === false, the wavefunction: o.after 'ok' (same wavelength,
//                            smaller amplitude), 'longer', 'shorter', 'zero', 'same' (nothing lost),
//                            'inside' (oscillating inside the barrier)
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

  // ---------------------------------------------------------------- ring radius against 1/√U
  function rGraph(o) {
    const xHi = Math.ceil(Math.max(...o.pts.map((p) => p[0])) * 10 + 1) / 10, rHi = Math.ceil(Math.max(...o.pts.map((p) => p[1])) / 5 + 0.6) * 5;
    const g = graph({ x: [0, xHi, 0.1], y: [0, rHi, 5], xl: `1/√${it('U')} in 1/√kV`, yl: `${it('r')} in mm`, w: 360, h: 250, minor: 2 });
    let body = '';
    if (o.solve) body += `<line class="fit" x1="${g.X(0)}" y1="${g.Y(0)}" x2="${g.X(xHi)}" y2="${g.Y(o.slope * xHi)}"/>`;
    body += o.pts.map(([x, r]) => `<circle class="pt" cx="${g.X(x)}" cy="${g.Y(r)}" r="3.6"/>`).join('');
    return g.svg(body, L('Measured ring radius against 1/√U', 'Gemessener Ringradius gegen 1/√U'));
  }

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

  // ---------------------------------------------------------------- a screen with single hits
  const sinc2 = (x) => (Math.abs(x) < 1e-9 ? 1 : (Math.sin(x) / x) ** 2);
  const env = (x) => sinc2((Math.PI * x) / 0.85);
  const DIST = {
    double: (x) => env(x) * Math.cos((Math.PI * x) / 0.17) ** 2,
    which: (x) => 0.5 * (env(x - 0.04) + env(x + 0.04)),
    single: (x) => env(x - 0.04),
    classical: (x) => Math.exp(-(((x - 0.14) / 0.045) ** 2)) + Math.exp(-(((x + 0.14) / 0.045) ** 2)),
    narrow: (x) => Math.exp(-(((x - 0.14) / 0.045) ** 2)),
  };
  function screen(kind, n, seed, o = {}) {
    const w = o.w || 220, hh = o.h || 120, pad = 8, r = M.rng(seed * 13 + 7);
    const X = (x) => f1(pad + ((x + 1) / 2) * (w - 2 * pad)), Y = (y) => f1(pad + ((y + 1) / 2) * (hh - 2 * pad));
    let s = `<rect class="screenface" x="0" y="0" width="${w}" height="${hh}" rx="6"/>`;
    if (kind === 'smear') {
      for (let k = 0; k < 160; k++) { const x = -1 + (k + 0.5) / 80; s += `<rect class="glow" x="${X(x - 1 / 160)}" y="${pad}" width="${f1((w - 2 * pad) / 160 + 0.4)}" height="${hh - 2 * pad}" opacity="${(0.92 * DIST.double(x)).toFixed(2)}"/>`; }
    } else {
      const f = DIST[kind];
      let d = '', got = 0, guard = 0;
      while (got < n && guard++ < n * 60) {
        const x = -1 + 2 * r.next();
        if (r.next() > f(x)) continue;
        d += `M${X(x)} ${Y(-1 + 2 * r.next())}h0`; got++;
      }
      s += `<path class="dots${n > 400 ? ' many' : ''}" d="${d}"/>`;
    }
    if (o.label) s += `<text class="lbl small onscreen" x="${w - 8}" y="${hh - 8}" text-anchor="end">${o.label}</text>`;
    return `<svg class="mw screen${o.small ? ' small' : ''}" viewBox="0 0 ${w} ${hh}" width="${w}" role="img" aria-label="${L('A detector screen; each particle that arrives makes one dot', 'Ein Detektorschirm; jedes ankommende Teilchen macht einen Punkt')}">${s}</svg>`;
  }

  // ---------------------------------------------------------------- the double slit
  function doubleSlit(o = {}) {
    let s = '';
    s += `<circle class="source" cx="30" cy="90" r="9"/><text class="lbl small" x="6" y="122">${o.source || L('source', 'Quelle')}</text>`;
    for (const y of [70, 90, 110]) s += `<line class="beam" x1="42" y1="${y === 90 ? 90 : 90 + (y - 90) * 0.2}" x2="118" y2="${y}" opacity="0.6"/>`;
    s += '<path class="wall" d="M120 20 V78 M120 86 V94 M120 102 V160" />';
    s += span(108, 82, 108, 98, it('d'), -10, 4);
    s += '<line class="screen" x1="300" y1="20" x2="300" y2="160"/>';
    const pts = [];
    for (let y = 22; y <= 158; y += 1) { const x = (y - 90) / 70; pts.push([f1(300 + 24 * DIST.double(x * 0.9)), y]); }
    s += poly(pts, 'pattern');
    s += span(120, 172, 300, 172, it('L'), 0, -5);
    const dy = f1(70 * 0.17 / 0.9);
    s += `<line class="guide" x1="296" y1="90" x2="332" y2="90"/><line class="guide" x1="296" y1="${f1(90 - dy)}" x2="332" y2="${f1(90 - dy)}"/>`;
    s += span(330, f1(90 - dy), 330, 90, `Δ${it('x')}`, 16, 4);
    return `<svg class="mw dslit" viewBox="0 0 360 186" width="360" role="img" aria-label="${L('A double slit with the slit spacing d, the screen at the distance L, and the fringe spacing Δx on it', 'Ein Doppelspalt mit dem Spaltabstand d, der Schirm im Abstand L, und darauf der Streifenabstand Δx')}">${s}</svg>`;
  }

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

  // ---------------------------------------------------------------- a barrier and a wavefunction
  function barrier(o = {}) {
    const w = o.w || 340, hh = o.h || 190, base = hh - 34, top = 40, Ey = 92, a = 150, b = 200, lam = 42, amp = 22, kap = 0.022;
    const A = Math.exp(-kap * (b - a)), after = o.after || 'ok';
    let s = `<path class="pot" d="M26 ${base} H${a} V${top} H${b} V${base} H${w - 10}"/>`;
    s += `<line class="energy" x1="26" y1="${Ey}" x2="${w - 10}" y2="${Ey}"/>`;
    s += `<text class="lbl small" x="8" y="${Ey + 5}">${it('E')}</text><text class="lbl small" x="${b + 8}" y="${top + 4}">${it('V')}${sub('0')}</text>`;
    s += span(a, base + 14, b, base + 14, it('d'), 0, 16);
    if (o.wave !== false) {
      const pts = [];
      for (let x = 28; x <= a; x += 1) pts.push([x, f1(Ey - amp * Math.cos((2 * Math.PI * (x - a)) / lam))]);
      for (let x = a; x <= b; x += 1) pts.push([x, f1(Ey - amp * (after === 'inside' ? Math.cos((2 * Math.PI * (x - a)) / lam) : Math.exp(-kap * (x - a))))]);
      const lam2 = { longer: 1.7 * lam, shorter: 0.55 * lam }[after] || lam;
      const A2 = { zero: 0, same: 1, inside: Math.cos((2 * Math.PI * (b - a)) / lam) }[after];
      const amp2 = A2 == null ? A : A2;
      for (let x = b; x <= w - 12; x += 1) pts.push([x, f1(Ey - amp * amp2 * Math.cos((2 * Math.PI * (x - b)) / lam2))]);
      s += poly(pts, 'psi');
      if (o.labels) s += `<text class="lbl small" x="40" y="${Ey + amp + 18}">${it('ψ')}</text>`;
    }
    if (o.dE) s += span(a - 16, top, a - 16, Ey, `${it('V')}${sub('0')} − ${it('E')}`, -34, 4);
    return `<svg class="mw barrier${o.small ? ' small' : ''}" viewBox="0 0 ${w} ${hh}" width="${w}" role="img" aria-label="${L('A potential barrier of height V₀ and width d, the particle energy E below its top, and the wavefunction', 'Eine Potentialbarriere der Höhe V₀ und der Breite d, die Teilchenenergie E unter ihrer Oberkante, und die Wellenfunktion')}">${s}</svg>`;
  }

  const api = { graph, rGraph, tube, rings, screen, DIST, doubleSlit, slitGraph, barrier };
  root.MatterPlot = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
