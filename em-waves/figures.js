// The drawings of the app, in the manner of a physics textbook (the shared figure kit, figkit.js):
// thin even ink outlines and a few muted tints; the electric field red, the magnetic field blue,
// the direction of propagation in ink. The colours follow the dark mode (style.css).
//   Figures.spectrum(lambda, o)  the spectrum on a log scale, λ marked (or nothing: null); with
//                                o.trend, an arrow for the growing frequency and photon energy
//   Figures.wave3d()             an electromagnetic wave in space: E and B, in phase, ⟂ c
//   Figures.dirs(v)              the directions { E, B, c } (each [x, y, z] or null) from a point
//   Figures.medium(n)            light going from air into a medium: same f, shorter λ
// Each returns an SVG in a <div class="fig">.
(function (root) {
  'use strict';

  const { f, svg, path, circle, text, dim } = root.Fig;
  const L = (en, de) => root.EW.L(en, de);
  const PI2 = 2 * Math.PI;
  const it = (s) => `<tspan font-style="italic">${s}</tspan>`;
  const sub = (s, d) => `${it(s)}<tspan font-size="72%" dy="4">${d}</tspan><tspan dy="-4">​</tspan>`;

  // an arrow head at (x, y) along (ux, uy)
  const head = (x, y, ux, uy, H = 10, B = 4) => { const bx = x - H * ux, by = y - H * uy; return `<polygon points="${f(x)},${f(y)} ${f(bx - B * uy)},${f(by + B * ux)} ${f(bx + B * uy)},${f(by - B * ux)}"/>`; };
  // a vector from (x1, y1) to (x2, y2) in a colour class (ew-e, ew-b, ew-c), its label at (lx, ly)
  function vec(x1, y1, x2, y2, cls, label = '', lx = x2, ly = y2, anchor = 'middle') {
    const d = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / d, uy = (y2 - y1) / d;
    return `<g class="ew-vec ${cls}"><line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2 - 8 * ux)}" y2="${f(y2 - 8 * uy)}"/>${head(x2, y2, ux, uy)}${label ? `<text x="${f(lx)}" y="${f(ly)}" text-anchor="${anchor}">${label}</text>` : ''}</g>`;
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
  function spectrum(lambda, o = {}) {
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
    // to the left: shorter waves, higher frequency, larger photon energy
    if (o.trend) s += vec(X(4) - 20, 26, X(-13) + 10, 26, 'ew-c ew-small') + text((X(-13) + X(4)) / 2, 15, L(`higher frequency ${it('f')}, larger photon energy ${it('E')}`, `höhere Frequenz ${it('f')}, grössere Photonenenergie ${it('E')}`), 'tb-cap ew-vislabel');
    return svg(640, 130, s, L('The electromagnetic spectrum from γ rays to radio waves, the wavelength on a logarithmic scale', 'Das elektromagnetische Spektrum von Gammastrahlung bis zu Radiowellen, die Wellenlänge auf einer logarithmischen Skala') + (o.trend ? L('; to the left, the frequency and the photon energy grow', '; nach links wachsen die Frequenz und die Photonenenergie') : '') + (lambda ? L(', with the given wavelength marked', ', mit der gegebenen Wellenlänge markiert') : ''));
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

  root.Figures = { REGIONS, spectrum, wave3d, dirs, medium, vec };
})(typeof window !== 'undefined' ? window : globalThis);
