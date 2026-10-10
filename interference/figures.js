// The drawings of the app, in the manner of a physics textbook (the shared figure kit, figkit.js):
// thin even ink outlines and a few muted tints; wave fronts blue, the path difference red, the
// light on the screen in the colour of a laser. The colours follow the dark mode (style.css).
//   Figures.waves(o)         straight waves (wavelength lam px) meet a wall with a gap of o.a
//                            wavelengths; behind it o.behind: 'arcs' (circular waves), 'beam'
//                            (straight, bent only at the edges), 'shadow' (straight, cut off
//                            sharply) or nothing; o.short: a shorter wavelength behind the wall
//                            (a wrong picture); o.wavelets: Huygens' wavelets from points of the
//                            gap; o.dims: λ and a marked; o.small: a picture to choose
//   Figures.huygens()        Huygens' construction: wavelets from a wave front, and their envelope
//   Figures.sources(o)       two coherent sources (loudspeakers or slits) and a point P, with the
//                            distances r₁ and r₂ (o.r1, o.r2: labels); o.ds: the path difference
//   Figures.pathDiff()       a double slit seen close up: Δs = d·sin α
//   Figures.geometry(o)      a double slit and the screen: d, L, the angle α and the position y
//   Figures.pattern(list, o) the intensity on the screen against the position y, with a strip of
//                            the screen below (see pattern)
//   Figures.airy(sep)        the images of two point sources side by side (the Rayleigh criterion)
// Each returns an SVG in a <div class="fig">.
(function (root) {
  'use strict';

  const { f, svg, path, circle, rect, text, dim } = root.Fig;
  const L = (en, de) => root.IW.L(en, de);
  const it = (s) => `<tspan font-style="italic">${s}</tspan>`;
  const sub = (s, d) => `${it(s)}<tspan font-size="72%" dy="4">${d}</tspan><tspan dy="-4">​</tspan>`;

  // an arrow head at (x, y) along (ux, uy)
  const head = (x, y, ux, uy, H = 9, B = 3.6) => { const bx = x - H * ux, by = y - H * uy; return `<polygon points="${f(x)},${f(y)} ${f(bx - B * uy)},${f(by + B * ux)} ${f(bx + B * uy)},${f(by - B * ux)}"/>`; };
  // a clip to the rectangle (x0, y0)–(x1, y1); its id from its size (the same size, the same clip)
  const clipTo = (id, x0, y0, x1, y1) => `<clipPath id="${id}"><rect x="${f(x0)}" y="${f(y0)}" width="${f(x1 - x0)}" height="${f(y1 - y0)}"/></clipPath>`;
  // an arc of radius r around (cx, cy) from the angle a0 to a1 (degrees, counted up from the right)
  function arc(cx, cy, r, a0, a1) {
    const P = (a) => [cx + r * Math.cos((a * Math.PI) / 180), cy - r * Math.sin((a * Math.PI) / 180)];
    const [x0, y0] = P(a0), [x1, y1] = P(a1);
    return `M${f(x0)} ${f(y0)}A${f(r)} ${f(r)} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} ${a1 > a0 ? 0 : 1} ${f(x1)} ${f(y1)}`;
  }

  // ---------------------------------------------------------------- waves at a gap
  function waves(o = {}) {
    const sm = !!o.small, W = sm ? 240 : 440, H = sm ? 150 : 230, lam = sm ? 15 : 22, bx = sm ? 64 : 150, cy = H / 2, top = 6, bot = H - 6;
    const a = o.a * lam, g0 = cy - a / 2, g1 = cy + a / 2, l2 = o.short ? 0.55 * lam : lam;
    const id = `if-clip-${W}`;
    let s = `<defs>${clipTo(id, bx + 3, top, W - 4, bot)}${clipTo(`${id}-in`, 4, top, bx - 3, bot)}</defs>`;
    // the waves arriving: fronts a wavelength apart
    let d = '';
    for (let x = bx - lam / 2; x > 6; x -= lam) d += `M${f(x)} ${top}V${bot}`;
    s += `<g clip-path="url(#${id}-in)">${path(d, 'if-front')}</g>` + head(sm ? 26 : 48, top + 12, 1, 0, 8, 3.2).replace('<polygon', '<polygon class="if-arrow"') + path(`M${sm ? 8 : 18} ${top + 12}H${sm ? 20 : 42}`, 'if-arrowline');
    // the waves behind the wall
    d = '';
    const reach = W - bx;
    if (o.behind === 'arcs') for (let r = l2 / 2; r < reach + l2; r += l2) d += arc(bx, cy, r, -90, 90);
    if (o.behind === 'beam' || o.behind === 'shadow') {
      for (let r = l2 / 2; r < reach + l2; r += l2) {
        d += `M${f(bx + r)} ${f(g0)}V${f(g1)}`;
        // a little of the wave bends round the edges, the less the wider the gap
        if (o.behind === 'beam') { const th = Math.min(60, (90 * lam) / a + 12); d += arc(bx, g0, r, 0, th) + arc(bx, g1, r, 0, -th); }
      }
    }
    if (d) s += `<g clip-path="url(#${id})">${path(d, 'if-front')}</g>`;
    // Huygens' wavelets from points of the gap, a quarter of a wavelength behind it
    if (o.wavelets) {
      const n = Math.max(1, Math.round(a / (0.6 * lam))), ys = Array.from({ length: n }, (_, k) => (n === 1 ? cy : g0 + ((k + 0.5) * a) / n));
      s += ys.map((y) => path(arc(bx, y, 1.5 * lam, -90, 90), 'if-wavelet') + circle(bx, y, 2.2, 'if-dot')).join('');
    }
    // the wall, with the gap
    s += rect(bx - 3, top - 2, 6, g0 - top + 2, 'if-wall') + rect(bx - 3, g1, 6, bot + 2 - g1, 'if-wall');
    if (o.dims) {
      const x0 = bx - lam / 2 - 2 * lam;
      s += dim([x0, bot - 4], [x0 + lam, bot - 4], it('λ'), 0) + dim([bx - 6, g1], [bx - 6, g0], it('a'), 12);
    }
    const lab = o.behind === 'arcs' ? L('behind the gap, circular waves spread into the whole space', 'hinter der Öffnung breiten sich Kreiswellen im ganzen Raum aus')
      : o.behind === 'beam' ? L('behind the gap, straight waves bent only at their ends', 'hinter der Öffnung gerade Wellen, nur an ihren Enden gebogen')
        : o.behind === 'shadow' ? L('behind the gap, straight waves cut off sharply, nothing in the shadow', 'hinter der Öffnung gerade Wellen, scharf abgeschnitten, nichts im Schatten') : '';
    return svg(W, H, s, L('Straight waves arrive from the left at a wall with a gap', 'Gerade Wellen kommen von links zu einer Wand mit einer Öffnung') + (lab ? `; ${lab}` : '') + (o.short ? L(', with a shorter wavelength', ', mit kürzerer Wellenlänge') : ''));
  }

  // ---------------------------------------------------------------- Huygens' construction
  function huygens() {
    const x0 = 110, R = 70, ys = [56, 86, 116, 146, 176, 206];
    let s = path(`M${x0} ${ys[0] - 10}V${ys[ys.length - 1] + 10}`, 'if-front') + text(x0 - 8, 22, L('wave front now', 'Wellenfront jetzt'), 'tb-cap', 'end');
    s += ys.map((y) => path(arc(x0, y, R, -90, 90), 'if-wavelet') + circle(x0, y, 2.6, 'if-dot')).join('');
    // the envelope: the front a moment later, rounded at its ends
    s += path(`M${x0 + R} ${ys[0]}V${ys[ys.length - 1]}`, 'if-front if-new') + path(arc(x0, ys[0], R, 0, 40), 'if-front if-new') + path(arc(x0, ys[ys.length - 1], R, 0, -40), 'if-front if-new');
    s += text(x0 + R + 10, 22, L('a moment later: the envelope', 'kurz darauf: die Einhüllende'), 'tb-cap', 'start');
    s += `<g class="if-vec">${path(`M${x0 + R + 30} 131H${x0 + R + 78}`, '')}${head(x0 + R + 86, 131, 1, 0)}</g>`;
    return svg(400, 240, s, L('Huygens’ principle: every point of a wave front sends out a wavelet; the new wave front is the line that touches all the wavelets', 'Das Prinzip von Huygens: Jeder Punkt einer Wellenfront sendet eine Elementarwelle aus; die neue Wellenfront ist die Linie, die alle Elementarwellen berührt'));
  }

  // ---------------------------------------------------------------- two sources and a point
  function sources(o = {}) {
    const S1 = [70, 62], S2 = [70, 152], P = [340, o.py || 34];
    let s = '';
    if (o.kind === 'slit') s += rect(S1[0] - 3, 10, 6, S1[1] - 5 - 10, 'if-wall') + rect(S1[0] - 3, S1[1] + 5, 6, S2[1] - S1[1] - 10, 'if-wall') + rect(S1[0] - 3, S2[1] + 5, 6, 200 - S2[1] - 5, 'if-wall') + path(`M${P[0] + 4} 10V200`, 'if-screen-line');
    else for (const [x, y] of [S1, S2]) s += `<g class="if-speaker"><rect x="${x - 22}" y="${y - 9}" width="12" height="18"/><path d="M${x - 10} ${y - 6}L${x} ${y - 14}V${y + 14}L${x - 10} ${y + 6}Z"/></g>`;
    s += path(`M${S1[0]} ${S1[1]}L${P[0]} ${P[1]}M${S2[0]} ${S2[1]}L${P[0]} ${P[1]}`, 'if-ray');
    // the path difference: the part of the longer way that the shorter one does not have
    const r1 = Math.hypot(P[0] - S1[0], P[1] - S1[1]), r2 = Math.hypot(P[0] - S2[0], P[1] - S2[1]);
    if (o.ds) { const u = [(S2[0] - P[0]) / r2, (S2[1] - P[1]) / r2], Q = [P[0] + r1 * u[0], P[1] + r1 * u[1]]; const a0 = (Math.atan2(P[1] - S1[1], S1[0] - P[0]) * 180) / Math.PI, a1 = (Math.atan2(P[1] - Q[1], Q[0] - P[0]) * 180) / Math.PI; s += path(arc(P[0], P[1], r1, a0, a1), 'if-thin if-dash') + path(`M${f(Q[0])} ${f(Q[1])}L${S2[0]} ${S2[1]}`, 'if-ds') + text((Q[0] + S2[0]) / 2 + 4, (Q[1] + S2[1]) / 2 + 22, `Δ${it('s')}`, 'if-dslabel', 'middle'); }
    s += circle(S1[0], S1[1], 3, 'if-dot') + circle(S2[0], S2[1], 3, 'if-dot') + circle(P[0], P[1], 4, 'if-dot');
    s += text(S1[0] - (o.kind === 'slit' ? 10 : 28), S1[1] + 5, sub('S', '1'), 'tb-axis', 'end') + text(S2[0] - (o.kind === 'slit' ? 10 : 28), S2[1] + 5, sub('S', '2'), 'tb-axis', 'end') + text(P[0] + 10, P[1] + 5, it('P'), 'tb-axis', 'start');
    const m1 = [(S1[0] + P[0]) / 2, (S1[1] + P[1]) / 2], m2 = [(S2[0] + P[0]) / 2, (S2[1] + P[1]) / 2];
    s += text(m1[0], m1[1] - 10, `${sub('r', '1')}${o.r1 ? ` = ${o.r1}` : ''}`, 'if-label') + text(m2[0], m2[1] + 22, `${sub('r', '2')}${o.r2 ? ` = ${o.r2}` : ''}`, 'if-label');
    return svg(440, 210, s, L(`Two sources S1 and S2 send waves of the same frequency in step to a point P, at the distances r1 and r2${o.r1 ? ` (${o.r1} and ${o.r2})` : ''}`, `Zwei Quellen S1 und S2 senden Wellen derselben Frequenz im Gleichtakt zu einem Punkt P, in den Abständen r1 und r2${o.r1 ? ` (${o.r1} und ${o.r2})` : ''}`));
  }

  // ---------------------------------------------------------------- the path difference close up
  function pathDiff() {
    const al = (24 * Math.PI) / 180, ux = Math.cos(al), uy = -Math.sin(al), S1 = [150, 64], S2 = [150, 154], h = 6;
    let s = rect(146, 8, 8, S1[1] - h - 8, 'if-wall') + rect(146, S1[1] + h, 8, S2[1] - S1[1] - 2 * h, 'if-wall') + rect(146, S2[1] + h, 8, 214 - S2[1] - h, 'if-wall');
    const far = 300;
    s += path(`M${S1[0]} ${S1[1]}l${f(far * ux)} ${f(far * uy)}M${S2[0]} ${S2[1]}l${f(far * ux)} ${f(far * uy)}`, 'if-ray');
    // the foot F of the perpendicular from S1 onto the ray from S2: S2F = d·sin α
    const t = (S1[0] - S2[0]) * ux + (S1[1] - S2[1]) * uy, F = [S2[0] + t * ux, S2[1] + t * uy];
    s += path(`M${S1[0]} ${S1[1]}L${f(F[0])} ${f(F[1])}`, 'if-thin') + path(`M${S2[0]} ${S2[1]}L${f(F[0])} ${f(F[1])}`, 'if-ds');
    s += text(S2[0] + 20, S2[1] + 30, `Δ${it('s')} = ${it('d')}·sin ${it('α')}`, 'if-dslabel', 'start');
    // α at S2 between the ray and the axis, and again at S1 in the small triangle
    s += path(`M${S2[0]} ${S2[1]}H${S2[0] + 150}`, 'if-axis') + path(arc(S2[0], S2[1], 110, 0, 24), 'if-thin') + text(S2[0] + 118, S2[1] - 12, it('α'), 'tb-axis', 'start');
    s += path(arc(S1[0], S1[1], 30, -90, -66), 'if-thin') + text(S1[0] + 10, S1[1] + 46, it('α'), 'tb-axis', 'start');
    s += dim([S1[0] - 8, S2[1]], [S1[0] - 8, S1[1]], it('d'), 14);
    s += text(436, 206, L('to the screen, far away →', 'zum Schirm, weit weg →'), 'tb-cap', 'end');
    return svg(440, 218, s, L('Two slits at the distance d; the rays to a far point leave them at the angle α and are almost parallel. The lower ray is longer by Δs = d·sin α', 'Zwei Spalte im Abstand d; die Strahlen zu einem fernen Punkt verlassen sie unter dem Winkel α und sind fast parallel. Der untere Strahl ist um Δs = d·sin α länger'));
  }

  // ---------------------------------------------------------------- double slit and screen
  function geometry(o = {}) {
    const bx = 70, sx = 400, cy = 120, hd = 16, P = [sx, 52];
    let s = rect(bx - 3, 12, 6, cy - hd - 3 - 12, 'if-wall') + rect(bx - 3, cy - hd + 3, 6, 2 * hd - 6, 'if-wall') + rect(bx - 3, cy + hd + 3, 6, 222 - cy - hd - 3, 'if-wall');
    s += path(`M${sx} 12V222`, 'if-screen-line') + path(`M${bx} ${cy}H${sx}`, 'if-axis');
    s += path(`M${bx} ${cy - hd}L${P[0]} ${P[1]}M${bx} ${cy + hd}L${P[0]} ${P[1]}`, 'if-ray');
    const al = Math.atan2(cy - P[1], sx - bx) * (180 / Math.PI);
    s += path(arc(bx, cy, 140, 0, al), 'if-thin') + text(bx + 148, cy - 10, it('α'), 'tb-axis', 'start');
    s += circle(P[0], P[1], 4, 'if-dot') + text(P[0] - 10, P[1] - 8, it('P'), 'tb-axis', 'end');
    s += dim([bx - 6, cy + hd], [bx - 6, cy - hd], it('d'), 12) + dim([bx, 214], [sx, 214], it('L'), 0) + dim([sx + 6, cy], [sx + 6, P[1]], it('y'), -10);
    if (o.small !== false) s += text(sx - 6, 236, L('screen', 'Schirm'), 'tb-cap', 'end');
    return svg(440, 244, s, L('A double slit with the slit spacing d, at the distance L from a screen; the point P lies at the height y above the centre, at the angle α', 'Ein Doppelspalt mit dem Spaltabstand d, im Abstand L von einem Schirm; der Punkt P liegt in der Höhe y über der Mitte, unter dem Winkel α'));
  }

  // ---------------------------------------------------------------- the pattern on the screen
  // The intensity behind N slits (N = 1: a single slit) of width b (0: very narrow) at the spacing
  // d, at the position y on a screen at the distance L (small angles: sin α ≈ y/L), its central
  // maximum 1.
  const sinc = (x) => (Math.abs(x) < 1e-9 ? 1 : Math.sin(x) / x);
  function intensity(c, y) {
    const s = y / c.L, env = c.b ? sinc((Math.PI * c.b * s) / c.lam) ** 2 : 1;
    if (!c.N || c.N === 1) return env;
    const g = (Math.PI * c.d * s) / c.lam, den = c.N * Math.sin(g);
    const multi = Math.abs(den) < 1e-9 ? 1 : (Math.sin(c.N * g) / den) ** 2;
    return env * multi;
  }
  // list: [{ lam, L, d, b, N, cls ('new' or 'old', dashed) }]; o: { Y (the half width shown, m),
  // strip (the index of the curve whose brightness the strip below shows; null: none), dims:
  // [[y0, y1, label]] (above the graph), unit (the unit of y for the ticks), ticks: [y] }
  function pattern(list, o = {}) {
    const W = 440, x0 = 20, x1 = 420, cx = (x0 + x1) / 2, top = o.dims ? 34 : 14, base = 142, Y = o.Y;
    const X = (y) => cx + (y / Y) * (cx - x0), Yp = (i) => base - i * (base - top - 6);
    let s = path(`M${x0 - 6} ${base}H${x1 + 10}`, 'if-axis-solid') + head(x1 + 14, base, 1, 0, 8, 3.2).replace('<polygon', '<polygon class="if-arrowhead"') + path(`M${cx} ${base + 4}V${top - 4}`, 'if-axis');
    s += text(x1 + 14, base + 18, it('y'), 'tb-axis', 'end') + text(cx + 6, top + 2, it('I'), 'tb-axis', 'start') + text(cx, base + 16, '0', 'tb-cap');
    for (const [y, lab] of o.ticks || []) s += path(`M${f(X(y))} ${base}v5`, 'if-axis-solid') + (lab ? text(X(y), base + 16, lab, 'tb-cap') : '');
    list.forEach((c) => {
      let d = '';
      for (let px = x0; px <= x1; px += 0.5) { const y = ((px - cx) / (cx - x0)) * Y; d += `${d ? 'L' : 'M'}${f(px)} ${f(Yp(intensity(c, y)))}`; }
      s += path(d, `if-curve${c.cls === 'old' ? ' if-old' : ''}`);
    });
    for (const [ya, yb, lab] of o.dims || []) s += dim([X(ya), top - 4], [X(yb), top - 4], lab, 0);
    const k = o.strip === undefined ? list.length - 1 : o.strip;
    let h = 0;
    if (k !== null && list[k]) {
      h = 22;
      let st = rect(x0, base + 24, x1 - x0, 16, 'if-screen');
      for (let px = x0; px < x1; px += 1.5) { const v = intensity(list[k], ((px + 0.75 - cx) / (cx - x0)) * Y); if (v > 0.01) st += `<rect class="if-light" x="${f(px)}" y="${base + 24}" width="1.6" height="16" fill-opacity="${f(Math.min(1, v ** 0.6 * 1.05) * 100) / 100}"/>`; }
      s += st;
    }
    return svg(W, base + 26 + h, s, o.label || L('The intensity on the screen against the position y, with the screen below', 'Die Intensität auf dem Schirm gegen die Position y, darunter der Schirm'));
  }

  // ---------------------------------------------------------------- the Rayleigh criterion
  // J₁ by its integral; the image of a point source behind a round opening ∝ (2·J₁(u)/u)², its
  // first dark ring at u = 3.83
  function j1(x) { const n = 64; let s = 0; for (let k = 0; k <= n; k++) { const t = (Math.PI * k) / n, w = k === 0 || k === n ? 1 : k % 2 ? 4 : 2; s += w * Math.cos(t - x * Math.sin(t)); } return s / (3 * n); }
  const airyI = (u) => (Math.abs(u) < 1e-6 ? 1 : ((2 * j1(u)) / u) ** 2);
  // sep: the distance of the two images, in units of the radius of the first dark ring (or of
  // that radius before a change: o.scale is the radius now, in those units)
  function airy(sep, o = {}) {
    const W = 300, x0 = 16, x1 = 284, cx = (x0 + x1) / 2, base = 120, top = 20, R = 3.8317 / (o.scale || 1), span = 3.2;
    const pts = [];
    for (let px = x0; px <= x1; px += 1) { const r = ((px - cx) / (cx - x0)) * span; pts.push([px, airyI((r + sep / 2) * R), airyI((r - sep / 2) * R)]); }
    const peak = Math.max(...pts.map(([, i1, i2]) => i1 + i2)), Yp = (i) => base - (i / peak) * (base - top);
    let a = '', b = '', sum = '';
    for (const [px, i1, i2] of pts) { a += `${a ? 'L' : 'M'}${f(px)} ${f(Yp(i1))}`; b += `${b ? 'L' : 'M'}${f(px)} ${f(Yp(i2))}`; sum += `${sum ? 'L' : 'M'}${f(px)} ${f(Yp(i1 + i2))}`; }
    const s = path(`M${x0} ${base}H${x1}`, 'if-axis-solid') + path(a, 'if-curve if-old') + path(b, 'if-curve if-old') + path(sum, 'if-curve') +
      text(cx, base + 22, o.caption || '', 'tb-cap');
    return svg(W, base + 30, s, L('The images of two point sources: each is a blurred disc with dark rings; solid, the sum', 'Die Bilder zweier punktförmiger Quellen: Jedes ist ein verwaschenes Scheibchen mit dunklen Ringen; ausgezogen die Summe') + (o.caption ? `: ${o.caption}` : ''));
  }

  root.Figures = { waves, huygens, sources, pathDiff, geometry, pattern, intensity, airy, airyI };
})(typeof window !== 'undefined' ? window : globalThis);
