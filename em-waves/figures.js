// The drawings of the app, in the manner of a physics textbook (the shared figure kit, figkit.js):
// thin even ink outlines and a few muted tints; the electric field red, the magnetic field blue,
// the direction of propagation in ink. The colours follow the dark mode (style.css).
//   Figures.spectrum(lambda)     the spectrum on a log scale, λ marked (or nothing: null)
//   Figures.wave3d()             an electromagnetic wave in space: E and B, in phase, ⟂ c
//   Figures.dirs(v)              the directions { E, B, c } (each [x, y, z] or null) from a point
//   Figures.lc(k)                an LC circuit in the k-th quarter of its period (0 … 3)
//   Figures.sphere(o)            a point source and the spheres its power spreads over
//   Figures.beam()               a laser beam with its diameter
//   Figures.polarizers(o)        filters one behind the other, with the polarization between
//   Figures.dipole(o)            a dipole antenna, its radiation and a receiving rod
//   Figures.standing(m)          a standing wave in front of a metal plate, m minima marked
//   Figures.medium(n)            light going from air into a medium: same f, shorter λ
//   Figures.echo(o)              a signal to a target and back
//   Figures.oven(), radio(), mast(), sun(), glasses(), router()   the problems' pictures
// Each returns an SVG in a <div class="fig">.
(function (root) {
  'use strict';

  const { f, svg, path, line, circle, rect, text, dim, ground } = root.Fig;
  const L = (en, de) => root.EW.L(en, de);
  const PI2 = 2 * Math.PI;
  const it = (s) => `<tspan font-style="italic">${s}</tspan>`;
  const sub = (s, d) => `${it(s)}<tspan font-size="72%" dy="4">${d}</tspan><tspan dy="-4">​</tspan>`;

  // an arrow head at (x, y) along (ux, uy)
  const head = (x, y, ux, uy, H = 10, B = 4) => { const bx = x - H * ux, by = y - H * uy; return `<polygon points="${f(x)},${f(y)} ${f(bx - B * uy)},${f(by + B * ux)} ${f(bx + B * uy)},${f(by - B * ux)}"/>`; };
  // a vector from (x1, y1) to (x2, y2) in a colour class (ew-e, ew-b, ew-c, ew-i), its label at (lx, ly)
  function vec(x1, y1, x2, y2, cls, label = '', lx = x2, ly = y2, anchor = 'middle') {
    const d = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / d, uy = (y2 - y1) / d;
    return `<g class="ew-vec ${cls}"><line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2 - 8 * ux)}" y2="${f(y2 - 8 * uy)}"/>${head(x2, y2, ux, uy)}${label ? `<text x="${f(lx)}" y="${f(ly)}" text-anchor="${anchor}">${label}</text>` : ''}</g>`;
  }
  // a double arrow (a direction of polarization or an axis), centre (x, y), half length h, angle a
  // from the vertical (degrees, clockwise as seen)
  function dbl(x, y, h, a, cls) {
    const r = (a * Math.PI) / 180, ux = Math.sin(r), uy = -Math.cos(r);
    return `<g class="ew-vec ${cls}"><line x1="${f(x - (h - 7) * ux)}" y1="${f(y - (h - 7) * uy)}" x2="${f(x + (h - 7) * ux)}" y2="${f(y + (h - 7) * uy)}"/>${head(x + h * ux, y + h * uy, ux, uy, 8, 3.4)}${head(x - h * ux, y - h * uy, -ux, -uy, 8, 3.4)}</g>`;
  }
  // a sine from x0 to x1 around y, amplitude A, wavelength lam (px), phase 0 at x0
  const sine = (x0, x1, y, A, lam, cls, ph = 0) => { let d = ''; for (let x = x0; x <= x1 + 0.01; x += 2) d += `${d ? 'L' : 'M'}${f(x)} ${f(y - A * Math.sin((PI2 * (x - x0)) / lam + ph))}`; return path(d, cls); };

  // ---------------------------------------------------------------- the spectrum
  // log₁₀ of the wavelength in m from −13 to 4; the regions' borders (approximate)
  const REGIONS = [
    { key: 'gamma', lo: -13, hi: -11, en: 'γ rays', de: 'Gamma' },
    { key: 'xray', lo: -11, hi: -8, en: 'X-rays', de: 'Röntgen' },
    { key: 'uv', lo: -8, hi: Math.log10(380e-9), en: 'UV', de: 'UV' },
    { key: 'vis', lo: Math.log10(380e-9), hi: Math.log10(780e-9), en: 'visible', de: 'sichtbar' },
    { key: 'ir', lo: Math.log10(780e-9), hi: -3, en: 'infrared', de: 'Infrarot' },
    { key: 'micro', lo: -3, hi: 0, en: 'microwaves', de: 'Mikrowellen' },
    { key: 'radio', lo: 0, hi: 4, en: 'radio waves', de: 'Radiowellen' },
  ];
  function spectrum(lambda) {
    const X = (lg) => 30 + ((lg + 13) / 17) * 580, y0 = 58, y1 = 86;
    let s = '<defs><linearGradient id="ew-rainbow" x1="0" y1="0" x2="1" y2="0">' +
      ['#7a2ba8', '#3b4fd6', '#1c9bd6', '#2fb04a', '#e8d43a', '#f08a24', '#d8342c'].map((c, i) => `<stop offset="${(i / 6).toFixed(3)}" stop-color="${c}"/>`).join('') + '</linearGradient></defs>';
    REGIONS.forEach((g, i) => {
      s += `<rect class="${g.key === 'vis' ? '' : `ew-band ew-band${i}`}"${g.key === 'vis' ? ' fill="url(#ew-rainbow)"' : ''} x="${f(X(g.lo))}" y="${y0}" width="${f(X(g.hi) - X(g.lo))}" height="${y1 - y0}"/>`;
      if (g.key === 'vis') s += text((X(g.lo) + X(g.hi)) / 2, y0 - 17, L(g.en, g.de), 'tb-cap ew-vislabel');
      else s += text((X(g.lo) + X(g.hi)) / 2, y0 + 18, L(g.en, g.de), 'ew-bandtext');
    });
    s += path(`M${X(-13)} ${y1} H${X(4) + 6}`, 'tb-line') + path(`M${f(X(4) + 1)} ${y1 - 4} L${f(X(4) + 9)} ${y1} L${f(X(4) + 1)} ${y1 + 4}`, 'tb-line');
    [[-12, '1 pm'], [-9, '1 nm'], [-6, '1 μm'], [-3, '1 mm'], [0, '1 m'], [3, '1 km']].forEach(([lg, lab]) => { s += path(`M${f(X(lg))} ${y1} v6`, 'tb-line') + text(X(lg), y1 + 22, lab, 'tb-cap'); });
    s += text(X(4) + 4, y1 + 22, it('λ'), 'tb-axis', 'end');
    if (lambda) {
      const x = X(Math.max(-13, Math.min(4, Math.log10(lambda))));
      s += `<polygon class="ew-mark" points="${f(x - 7)},${y0 - 13} ${f(x + 7)},${y0 - 13} ${f(x)},${y0 - 1}"/>` + path(`M${f(x)} ${y0} V${y1}`, 'ew-markline');
    }
    return svg(640, 130, s, L('The electromagnetic spectrum from γ rays to radio waves, the wavelength on a logarithmic scale', 'Das elektromagnetische Spektrum von Gammastrahlung bis zu Radiowellen, die Wellenlänge auf einer logarithmischen Skala') + (lambda ? L(', with the given wavelength marked', ', mit der gegebenen Wellenlänge markiert') : ''));
  }

  // ---------------------------------------------------------------- the wave in space
  // the axis of propagation to the right; E up and down in the page, B in the plane across it
  // (drawn slanting: towards the viewer is down and to the left)
  function wave3d() {
    const x0 = 40, x1 = 400, y = 120, A = 62, lam = 240, dz = [-0.5, 0.42];
    let e = '', b = '', ev = '', bv = '';
    for (let x = x0; x <= x1 + 0.01; x += 2) {
      const s = Math.sin((PI2 * (x - x0)) / lam);
      e += `${e ? 'L' : 'M'}${f(x)} ${f(y - A * s)}`;
      b += `${b ? 'L' : 'M'}${f(x + 0.9 * A * s * dz[0])} ${f(y + 0.9 * A * s * dz[1])}`;
    }
    for (let x = x0 + 10; x < x1; x += 15) {
      const s = Math.sin((PI2 * (x - x0)) / lam);
      if (Math.abs(s) > 0.08) { ev += `M${f(x)} ${y}V${f(y - A * s)}`; bv += `M${f(x)} ${y}L${f(x + 0.9 * A * s * dz[0])} ${f(y + 0.9 * A * s * dz[1])}`; }
    }
    const pk = x0 + lam / 4;
    return svg(460, 230,
      path(`M${x0 - 10} ${y} H${x1 + 20}`, 'tb-line') +
      `<g class="ew-e">${path(ev, 'ew-spoke')}${path(e, 'ew-wave')}</g><g class="ew-b">${path(bv, 'ew-spoke')}${path(b, 'ew-wave')}</g>` +
      vec(x1 + 4, y, x1 + 46, y, 'ew-c', it('c'), x1 + 30, y - 10) +
      `<g class="ew-vec ew-e"><text x="${f(pk + 8)}" y="${f(y - A - 4)}">${it('E')}</text></g><g class="ew-vec ew-b"><text x="${f(pk - 0.9 * A * 0.5 - 16)}" y="${f(y + 0.9 * A * 0.42 + 12)}">${it('B')}</text></g>` +
      dim([x0 + lam / 4, 30], [x0 + (5 * lam) / 4, 30], it('λ'), 0),
      L('An electromagnetic wave: the electric field (red) and the magnetic field (blue) oscillate in phase, perpendicular to each other and to the direction of propagation c', 'Eine elektromagnetische Welle: Das elektrische Feld (rot) und das magnetische Feld (blau) schwingen in Phase, senkrecht zueinander und zur Ausbreitungsrichtung c'));
  }

  // ---------------------------------------------------------------- directions at a point
  // x to the right, y up, z out of the page (⊙) or into it (⊗)
  const NAMES = { E: it('E'), B: it('B'), c: it('c') };
  function dirs(v) {
    const ox = 160, oy = 112, R = 74;
    let s = '', zs = '';
    for (const k of ['E', 'B', 'c']) {
      const d = v[k];
      if (!d) continue;
      const cls = k === 'E' ? 'ew-e' : k === 'B' ? 'ew-b' : 'ew-c';
      if (d[2]) {
        zs += `<g class="ew-vec ${cls}"><circle class="ew-z" cx="${ox}" cy="${oy}" r="12"/>${d[2] > 0 ? `<circle cx="${ox}" cy="${oy}" r="3.2"/>` : `<path class="ew-x" d="M${ox - 7} ${oy - 7}l14 14m0 -14l-14 14"/>`}<text x="${ox - 18}" y="${oy - 16}" text-anchor="end">${NAMES[k]}</text></g>`;
      } else {
        const ux = d[0], uy = -d[1];
        s += vec(ox + 14 * ux, oy + 14 * uy, ox + R * ux, oy + R * uy, cls, NAMES[k], ox + (R + 16) * ux + (uy ? 12 : 0), oy + (R + 16) * uy + 5 + (ux ? -8 : 0));
      }
    }
    if (!zs) s = circle(ox, oy, 3, 'tb-line-fill') + s;
    return svg(320, 220, s + zs,
      L('The given directions at one point of the wave; ⊙ points out of the page, ⊗ into it', 'Die gegebenen Richtungen an einem Punkt der Welle; ⊙ zeigt aus der Seite heraus, ⊗ hinein'));
  }

  // ---------------------------------------------------------------- the LC circuit
  // quarter k of the period: 0 charged (top plate +), 1 largest current (anticlockwise), 2 charged
  // the other way, 3 largest current (clockwise)
  function lc(k, o = {}) {
    const xl = 90, xr = 300, yt = 40, yb = 180, ym = 110;
    let s = path(`M${xl} ${ym - 10} V${yt} H${xr} V${ym - 46} M${xr} ${ym + 46} V${yb} H${xl} V${ym + 10}`, 'tb-line');
    s += path(`M${xl - 26} ${ym - 10} H${xl + 26} M${xl - 26} ${ym + 10} H${xl + 26}`, 'ew-plate');
    let coil = `M${xr} ${ym - 46}`;
    for (let j = 0; j < 6; j++) coil += ` c 22 0 22 ${f(46 / 3)} 0 ${f(46 / 3)}`;
    s += path(coil, 'tb-line') + text(xl - 34, ym + 5, it('C'), 'tb-axis', 'end') + text(xr + 26, ym + 5, it('L'), 'tb-axis', 'start');
    const charged = k % 2 === 0, top = k === 0 ? '+' : '−', bot = k === 0 ? '−' : '+';
    if (charged) {
      s += text(xl + 34, ym - 7, top, 'ew-charge', 'start') + text(xl + 34, ym + 21, bot, 'ew-charge', 'start');
      for (const dx of [-14, 0, 14]) s += k === 0 ? vec(xl + dx, ym - 8, xl + dx, ym + 9, 'ew-e ew-small') : vec(xl + dx, ym + 8, xl + dx, ym - 9, 'ew-e ew-small');
    } else {
      const acw = k === 1; // anticlockwise: up the left wire, along the top to the right, down the coil
      s += acw ? vec(150, yt, 230, yt, 'ew-i', it('I'), 190, yt - 9) + vec(230, yb, 150, yb, 'ew-i') : vec(230, yt, 150, yt, 'ew-i', it('I'), 190, yt - 9) + vec(150, yb, 230, yb, 'ew-i');
      s += `<g class="ew-b">${path(`M${xr + 11} ${ym - 64} C ${xr + 70} ${ym - 64} ${xr + 70} ${ym + 64} ${xr + 11} ${ym + 64} M${xr + 11} ${ym - 64} C ${xr - 48} ${ym - 64} ${xr - 48} ${ym + 64} ${xr + 11} ${ym + 64}`, 'ew-fieldline')}</g>`;
    }
    const cap = [L('capacitor charged, no current: the energy is in the electric field', 'Kondensator geladen, kein Strom: Die Energie steckt im elektrischen Feld'),
      L('capacitor empty, largest current: the energy is in the magnetic field of the coil', 'Kondensator leer, grösster Strom: Die Energie steckt im Magnetfeld der Spule'),
      L('capacitor charged the other way round, no current', 'Kondensator umgekehrt geladen, kein Strom'),
      L('largest current, the other way round', 'grösster Strom, in die andere Richtung')][k];
    const [c1, c2] = cap.split(': ');
    return svg(420, o.caption === false ? 200 : 240, s + (o.caption === false ? '' : text(210, 212, c2 ? `${c1}:` : c1, 'tb-cap') + (c2 ? text(210, 228, c2, 'tb-cap') : '')), L(`An LC circuit: ${cap}`, `Ein Schwingkreis: ${cap}`));
  }

  // ---------------------------------------------------------------- spheres around a point source
  function sphere(o = {}) {
    const x = 90, y = 120, r1 = 75, r2 = 150;
    const arc = (r, deg) => { const t = (deg * Math.PI) / 180; return `M${f(x + r * Math.cos(t))} ${f(y - r * Math.sin(t))} A${r} ${r} 0 0 1 ${f(x + r * Math.cos(t))} ${f(y + r * Math.sin(t))}`; };
    const at = (r, deg) => { const t = (deg * Math.PI) / 180; return [x + r * Math.cos(t), y - r * Math.sin(t)]; };
    let s = '';
    for (const a of [-40, 0, 40]) { const [x1, y1] = at(14, a), [x2, y2] = at(38, a); s += vec(x1, y1, x2, y2, 'ew-c ew-small'); }
    s += path(arc(r1, 80), 'ew-shell') + path(arc(r2, 50), 'ew-shell');
    s += dim([x, y], at(r1, 62), it(o.r1 || 'r'), 0);
    if (o.two !== false) s += dim([x, y], at(r2, -22), it(o.r2 || '2r'), 0);
    s += circle(x, y, 9, 'ew-source') + text(x - 16, y + 5, L('source', 'Quelle'), 'tb-cap', 'end');
    s += text(at(r1, 30)[0] + 8, at(r1, 30)[1] - 4, L('area 4πr²', 'Fläche 4πr²'), 'tb-cap', 'start');
    return svg(330, 240, s, L('A point source: its power spreads over spheres, of area 4πr² at the distance r', 'Eine punktförmige Quelle: Ihre Leistung verteilt sich auf Kugelflächen, mit der Fläche 4πr² im Abstand r'));
  }

  // ---------------------------------------------------------------- a laser beam
  function beam() {
    return svg(430, 150,
      rect(20, 52, 90, 46, 'tb-metal', 4) + text(65, 80, 'Laser', 'tb-cap') +
      `<rect class="ew-beam" x="110" y="64" width="290" height="22"/>` + `<ellipse class="ew-beamend" cx="330" cy="75" rx="7" ry="11"/>` +
      dim([352, 86], [352, 64], it('d'), -1) + vec(200, 75, 260, 75, 'ew-c ew-small'),
      L('A laser beam of diameter d', 'Ein Laserstrahl mit dem Durchmesser d'));
  }

  // ---------------------------------------------------------------- polarizers
  // o: { angles: [deg from the vertical, one per filter], names: [labels of the intensities, one
  // more than filters], unpol: the light before them is unpolarized (else polarized at angles0) }
  function polarizers(o) {
    const n = o.angles.length, step = 150, X = (i) => 160 + step * i, y = 96;
    let s = `<rect class="ew-beam" x="30" y="${y - 10}" width="${X(n - 1) + 110 - 30}" height="20"/>`;
    // the light before the filters
    if (o.unpol) s += [0, 45, 90, 135].map((a) => dbl(80, y, 20, a, 'ew-e ew-small')).join('');
    else s += dbl(80, y, 22, o.in || 0, 'ew-e ew-small');
    o.angles.forEach((a, i) => {
      const x = X(i), r = (a * Math.PI) / 180, ux = Math.sin(r), uy = -Math.cos(r), nx = -uy, ny = ux;
      let ch = '';
      for (const t of [-24, -12, 0, 12, 24]) { const h = Math.sqrt(40 * 40 - t * t); ch += `M${f(x + t * nx - h * ux)} ${f(y + t * ny - h * uy)}L${f(x + t * nx + h * ux)} ${f(y + t * ny + h * uy)}`; }
      s += circle(x, y, 40, 'ew-filter') + path(ch, 'ew-hatch') + dbl(x, y, 44, a, 'ew-c') + text(x, y - 52, `${o.labels ? o.labels[i] : `${a}°`}`, 'tb-cap');
      if (i < n) s += dbl(x + 75, y, 18, a, 'ew-e ew-small');
    });
    (o.names || []).forEach((nm, i) => { s += text(i === 0 ? 80 : X(i - 1) + 75, y + 60, nm, 'tb-axis'); });
    return svg(X(n - 1) + 130, 170, s,
      L(`${n} polarizing filters seen along the beam, their axes marked; between them, the direction in which the light is polarized`, `${n} Polarisationsfilter in Strahlrichtung gesehen, ihre Achsen markiert; dazwischen die Richtung, in der das Licht polarisiert ist`));
  }

  // ---------------------------------------------------------------- the dipole antenna
  // o: { rx: 'v' | 'h' | null (a receiving rod), lobes: true }
  function dipole(o = {}) {
    const x = 120, y = 120;
    let s = '';
    if (o.lobes !== false) {
      let d = '';
      for (const side of [1, -1]) { let p = ''; for (let k = 0; k <= 90; k++) { const th = (k / 90) * Math.PI, r = 92 * Math.sin(th) ** 2; p += `${p ? 'L' : 'M'}${f(x + side * r * Math.sin(th))} ${f(y - r * Math.cos(th))}`; } d += `${p}Z`; }
      s += path(d, 'ew-lobe');
    }
    s += path(`M${x} ${y - 6} V${y - 74} M${x} ${y + 6} V${y + 74}`, 'ew-rod') + circle(x, y, 6, 'ew-gen') + path(`M${x - 3.5} ${y} q1.75 -3 3.5 0 t3.5 0`, 'tb-thin');
    s += text(x, y - 84, L('no radiation along the rod', 'keine Strahlung längs des Stabs'), 'tb-cap');
    if (o.rx) {
      const rx = 350;
      s += o.rx === 'v' ? path(`M${rx} ${y - 40} V${y + 40}`, 'ew-rod') : path(`M${rx - 40} ${y} H${rx + 40}`, 'ew-rod');
      s += dbl(rx - 52, y, 26, 0, 'ew-e ew-small') + text(rx, y + 64, L('receiver', 'Empfänger'), 'tb-cap');
    }
    return svg(o.rx ? 420 : 250, 240, s, L('A vertical dipole antenna and how strongly it radiates in each direction: most across the rod, nothing along it', 'Eine senkrechte Dipolantenne und wie stark sie in jede Richtung abstrahlt: am meisten quer zum Stab, nichts längs davon') + (o.rx ? L('; at the receiver, the electric field is vertical', '; beim Empfänger ist das elektrische Feld senkrecht') : ''));
  }

  // ---------------------------------------------------------------- a standing wave in front of a plate
  // the envelope of the field: nodes at the plate and every half wavelength; m minima marked from
  // the k-th node on
  function standing(m = 3) {
    const xp = 430, sp = 52, A = 34, y = 100, x0 = 86;
    const xs = []; for (let x = x0; x <= xp + 0.01; x += 2) xs.push(x);
    const env = (x) => A * Math.abs(Math.sin((Math.PI * (xp - x)) / sp));
    const up = xs.map((x, i) => `${i ? 'L' : 'M'}${f(x)} ${f(y - env(x))}`).join(''), dn = xs.map((x, i) => `${i ? 'L' : 'M'}${f(x)} ${f(y + env(x))}`).join('');
    const fill = `${up}${xs.slice().reverse().map((x) => `L${f(x)} ${f(y + env(x))}`).join('')}Z`;
    const nodes = []; for (let j = 1; xp - j * sp > x0; j++) nodes.push(xp - j * sp);
    const marked = nodes.slice(0, m).reverse();
    let s = path(fill, 'ew-envfill') + path(up, 'ew-env') + path(dn, 'ew-env');
    s += path(`M24 ${y - 22} L66 ${y - 10} V${y + 10} L24 ${y + 22} Z`, 'tb-metal') + vec(68, y, 84, y, 'ew-c ew-small');
    s += `<rect class="tb-metal" x="${xp}" y="${y - 70}" width="10" height="140"/>` + text(xp + 10, y + 88, L('metal plate', 'Metallplatte'), 'tb-cap', 'end');
    marked.forEach((x) => { s += circle(x, y, 4, 'ew-node'); });
    if (marked.length > 1) s += dim([marked[0], y + 48], [marked[marked.length - 1], y + 48], it('d'), 0);
    s += text(45, y + 48, L('transmitter', 'Sender'), 'tb-cap');
    return svg(460, 200, s, L(`A standing wave in front of a metal plate: how strongly the field oscillates along the beam, with ${m} neighbouring minima marked`, `Eine stehende Welle vor einer Metallplatte: wie stark das Feld längs des Strahls schwingt, mit ${m} benachbarten Minima markiert`));
  }

  // ---------------------------------------------------------------- into a medium
  function medium(n) {
    const xs = 230, y = 92, lam0 = 96, lam = lam0 / n, A = 24;
    let s = `<rect class="tb-glass" x="${xs}" y="20" width="200" height="140"/>` + path(`M${xs} 20 V160`, 'tb-line');
    s += `<g class="ew-e">${sine(30, xs, y, A, lam0, 'ew-wave')}${sine(xs, 420, y, A, lam, 'ew-wave', (PI2 * (xs - 30)) / lam0)}</g>`;
    // a crest to the next (the phase is 0 at x = 30)
    const c0 = 30 + lam0 / 4, c1 = xs + ((Math.ceil(((xs - 30) / lam0) - 0.25) + 0.25) * lam0 - (xs - 30)) / n;
    s += dim([c0, y - A - 8], [c0 + lam0, y - A - 8], sub('λ', '0'), 0) + dim([c1, y - A - 8], [c1 + lam, y - A - 8], it('λ'), 0);
    s += text(125, 150, L('air', 'Luft'), 'tb-cap') + text(330, 150, `${L('medium', 'Medium')}, ${it('n')} = ${String(n)}`, 'tb-cap');
    return svg(440, 170, s, L('Light going from air into a medium: the frequency stays, the wavelength gets shorter', 'Licht geht von Luft in ein Medium: Die Frequenz bleibt, die Wellenlänge wird kürzer'));
  }

  // ---------------------------------------------------------------- a signal and its echo
  function echo(o = {}) {
    const earth = (x, y, r) => circle(x, y, r, 'ew-earth') + path(`M${x - r * 0.6} ${y - r * 0.3} q${r * 0.3} -${r * 0.3} ${r * 0.6} 0 t${r * 0.5} ${r * 0.2} M${x - r * 0.4} ${y + r * 0.4} q${r * 0.3} -${r * 0.2} ${r * 0.7} 0`, 'tb-thin');
    let tgt;
    if (o.target === 'plane') tgt = path('M352 74 l40 -6 l8 -10 h6 l-4 12 l20 -2 l4 -6 h5 l-2 8 l2 8 h-5 l-4 -6 l-20 -2 l4 12 h-6 l-8 -10 l-40 -6 z', 'tb-metal');
    else if (o.target === 'mars') tgt = circle(400, 80, 18, 'ew-mars') + circle(395, 74, 3, 'tb-thin') + circle(407, 86, 4, 'tb-thin');
    else tgt = circle(400, 80, 20, 'ew-moon') + circle(394, 74, 4, 'tb-thin') + circle(406, 88, 3, 'tb-thin');
    return svg(440, 160,
      earth(56, 80, 40) + tgt + vec(102, 70, 344, 70, 'ew-i', o.target === 'mars' ? L('command', 'Befehl') : L('signal', 'Signal'), 230, 62) + vec(344, 92, 102, 92, 'ew-i ew-faint', o.target === 'mars' ? L('picture', 'Bild') : L('echo', 'Echo'), 230, 110) + dim([56, 136], [400, 136], it('d'), 0),
      o.target === 'plane' ? L('A radar signal to an aeroplane and its echo, over the distance d', 'Ein Radarsignal zu einem Flugzeug und sein Echo, über die Distanz d')
        : o.target === 'mars' ? L('A command from the Earth to Mars and a picture back, over the distance d', 'Ein Befehl von der Erde zum Mars und ein Bild zurück, über die Distanz d') : L('A signal from the Earth to the Moon and back, over the distance d', 'Ein Signal von der Erde zum Mond und zurück, über die Distanz d'));
  }

  // ---------------------------------------------------------------- the problems' pictures
  // a microwave oven, its turntable taken out, a bar of chocolate with melted spots d apart
  function oven() {
    let s = rect(40, 30, 340, 170, 'tb-wall', 8) + rect(56, 46, 240, 138, 'tb-glass', 4) + rect(306, 46, 60, 138, 'tb-metal', 4);
    for (let k = 0; k < 3; k++) s += circle(336, 74 + 26 * k, 8, 'tb-dark');
    s += rect(84, 140, 184, 26, 'ew-choc', 3);
    [110, 170, 230].forEach((x) => { s += `<ellipse class="ew-melt" cx="${x}" cy="153" rx="12" ry="7"/>`; });
    s += dim([110, 130], [170, 130], it('d'), 0);
    return svg(420, 220, s, L('A microwave oven without its turntable; a bar of chocolate with melted spots, d apart', 'Ein Mikrowellenofen ohne Drehteller; eine Tafel Schokolade mit geschmolzenen Stellen im Abstand d'));
  }
  function radio() {
    let s = path('M300 60 L360 8', 'ew-rod') + rect(60, 60, 300, 140, 'tb-wood', 10) + circle(140, 130, 48, 'tb-dark');
    for (let r = 12; r < 48; r += 12) s += circle(140, 130, r, 'tb-thin');
    s += rect(210, 92, 130, 34, 'tb-glass', 3);
    for (let k = 0; k <= 8; k++) s += path(`M${222 + k * 13.5} 118 v${k % 2 ? -5 : -9}`, 'tb-thin');
    s += path('M262 96 V124', 'ew-needle') + text(275, 146, 'MHz', 'tb-cap') + circle(240, 172, 12, 'tb-metal') + circle(310, 172, 12, 'tb-metal');
    return svg(420, 220, s, L('A radio with a tuning dial and a telescopic antenna', 'Ein Radio mit Senderskala und Teleskopantenne'));
  }
  function mast() {
    let s = ground(10, 420, 200) + path('M80 200 L96 40 L112 200 M86 150 L108 110 M90 110 L104 80 M84 170 L110 150', 'tb-line');
    s += rect(78, 44, 8, 30, 'tb-metal', 1) + rect(106, 44, 8, 30, 'tb-metal', 1);
    for (let k = 1; k <= 3; k++) s += path(`M${120 + 16 * k} ${60 - 14 * k} q${12 + 6 * k} ${14 * k} 0 ${28 * k}`, 'tb-sound');
    s += path('M300 200 V140 L340 110 L380 140 V200 Z', 'tb-wall') + path('M290 146 L340 104 L390 146', 'tb-line') + rect(330, 160, 18, 40, 'tb-dark', 1);
    s += dim([96, 232], [340, 232], it('r'), 0);
    return svg(420, 246, s, L('A mobile phone mast and a house at the distance r', 'Eine Mobilfunkantenne und ein Haus im Abstand r'));
  }
  function sun() {
    let s = circle(40, 100, 70, 'ew-sun');
    for (let k = 0; k < 5; k++) s += vec(130, 60 + 20 * k, 330, 60 + 20 * k, 'ew-c ew-small ew-faint');
    s += circle(370, 100, 16, 'ew-earth') + text(370, 136, L('Earth', 'Erde'), 'tb-cap');
    return svg(420, 200, s, L('Sunlight reaching the Earth', 'Sonnenlicht erreicht die Erde'));
  }
  // a screen whose light is polarized, and sunglasses turned by an angle
  function glasses(o = {}) {
    const a = o.angle == null ? 30 : o.angle;
    let s = rect(30, 30, 140, 150, 'tb-dark', 8) + rect(40, 40, 120, 120, 'tb-glass', 3) + dbl(100, 100, 30, 0, 'ew-e');
    s += `<g transform="rotate(${a} 300 105)">${path('M210 100 Q230 70 266 82 Q280 100 266 122 Q236 136 214 116 Z M334 82 Q370 70 390 100 Q386 116 366 122 Q326 136 320 100 Q324 86 334 82 Z', 'ew-lens')}${path('M266 90 Q300 80 334 90', 'tb-line')}${dbl(240, 104, 22, 0, 'ew-c ew-small')}${dbl(358, 104, 22, 0, 'ew-c ew-small')}</g>`;
    return svg(420, 210, s, L('A screen whose light is polarized vertically, and polarizing sunglasses turned by an angle', 'Ein Bildschirm, dessen Licht senkrecht polarisiert ist, und polarisierende Sonnenbrillen, um einen Winkel gedreht'));
  }
  function router() {
    let s = rect(110, 140, 200, 46, 'tb-dark', 8) + path('M140 140 V40 M280 140 V40', 'ew-rod');
    for (let k = 0; k < 4; k++) s += circle(150 + 24 * k, 172, 3, 'ew-led');
    for (let k = 1; k <= 3; k++) s += path(`M${290 + 14 * k} ${70 - 10 * k} q${10 + 6 * k} ${10 * k + 20} 0 ${20 * k + 40}`, 'tb-sound');
    s += dim([130, 140], [130, 40], it('ℓ'), 0);
    return svg(420, 200, s, L('A Wi-Fi router with two rod antennas of length ℓ', 'Ein WLAN-Router mit zwei Stabantennen der Länge ℓ'));
  }

  root.Figures = { REGIONS, spectrum, wave3d, dirs, lc, sphere, beam, polarizers, dipole, standing, medium, echo, oven, radio, mast, sun, glasses, router, vec, dbl };
})(typeof window !== 'undefined' ? window : globalThis);
