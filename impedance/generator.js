// Impedance curves Z(ω) of ac circuits: R with L, C or both, in series or in parallel.
// The student reads R, L and C off the graph: the value at ω → 0, the asymptote for large ω, the
// slope of the tangent (dZ/dω in Ω·s, which is H since ω is in rad/s), the corner frequency where
// Z = √2·R or R/√2, and the minimum or maximum Z = R at resonance, ω₀ = 1/√(LC).
//
// A circuit is { kind: 'RL' | 'RC' | 'RLC', conn: 'series' | 'parallel', R (Ω), L (H), C (F) }
// (L or C null when missing). Its axes are fixed by its characteristic frequency (R/L, 1/(RC) or
// ω₀): linear axes 0 … wmax, 0 … ztop that show every feature the method needs, and log-log
// axes over whole decades. analysis() gives the worked method (steps with annotations for the
// graph, hints, the estimated values), shared by the tutor, the hints and the solution.
(function (root) {
  'use strict';

  const TOL = 0.05;                     // answers within 5 % are right
  const FILTERS = { mixed: 'Mixed', RL: 'RL', RC: 'RC', RLC: 'RLC' };
  const UNKNOWNS = { RL: ['R', 'L'], RC: ['R', 'C'], RLC: ['R', 'L', 'C'] };
  const NICE = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
  const E6 = [1, 1.5, 2.2, 3.3, 4.7, 6.8];
  const E12 = [1, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2];
  const p3 = (x) => Number(x.toPrecision(3));
  const R_VALUES = [10, 100].flatMap((k) => E12.map((m) => p3(m * k))).concat([1000]); // Ω
  const L_VALUES = [0.01, 0.1].flatMap((k) => E6.map((m) => p3(m * k)));              // H: 10 … 680 mH
  const C_VALUES = [1e-7, 1e-6, 1e-5].flatMap((k) => E6.map((m) => p3(m * k)));       // F: 0.1 … 68 µF

  // ---------------------------------------------------------------- random numbers
  function rng(seed) {
    let a = seed >>> 0;
    const next = () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    return { next, pick: (arr) => arr[Math.floor(next() * arr.length)] };
  }

  // ---------------------------------------------------------------- impedance
  // Series: Z = √(R² + X²), X = ωL − 1/(ωC). Parallel: 1/Z = √(1/R² + B²), B = ωC − 1/(ωL).
  function Z(c, w) {
    if (c.conn === 'series') {
      const X = (c.L ? w * c.L : 0) - (c.C ? 1 / (w * c.C) : 0);
      return Math.sqrt(c.R * c.R + X * X);
    }
    const B = (c.C ? w * c.C : 0) - (c.L ? 1 / (w * c.L) : 0);
    return 1 / Math.sqrt(1 / (c.R * c.R) + B * B);
  }
  // Slope of the tangent dZ/dω (Ω·s).
  function dZ(c, w) {
    if (c.conn === 'series') {
      const X = (c.L ? w * c.L : 0) - (c.C ? 1 / (w * c.C) : 0);
      const dX = (c.L || 0) + (c.C ? 1 / (w * w * c.C) : 0);
      return (X * dX) / Z(c, w);
    }
    const B = (c.C ? w * c.C : 0) - (c.L ? 1 / (w * c.L) : 0);
    const dB = (c.C || 0) + (c.L ? 1 / (w * w * c.L) : 0);
    const z = Z(c, w);
    return -z * z * z * B * dB;
  }
  // Characteristic frequency: corner R/L or 1/(RC), or the resonance ω₀ = 1/√(LC).
  function feature(c) {
    if (c.kind === 'RL') return c.R / c.L;
    if (c.kind === 'RC') return 1 / (c.R * c.C);
    return 1 / Math.sqrt(c.L * c.C);
  }
  // Quality factor of an RLC circuit (how sharp the minimum or maximum is).
  const quality = (c) => (c.conn === 'series' ? (feature(c) * c.L) / c.R : c.R / (feature(c) * c.L));

  function niceUp(x) {
    const e = Math.floor(Math.log10(x));
    for (const m of NICE) if (m * 10 ** e >= x * (1 - 1e-9)) return p3(m * 10 ** e);
    return 10 ** (e + 1);
  }

  // Axes: linear { wmax, ztop } and log-log { w0, w1, z0, z1 } (decades).
  function axesFor(c) {
    const wf = feature(c), rlc = c.kind === 'RLC';
    const wmax = niceUp((rlc ? (c.conn === 'series' ? 6.5 : 2.3) : 6) * wf);
    let ztop;
    if (c.conn === 'parallel') ztop = niceUp(1.15 * c.R);
    else if (c.kind === 'RC') ztop = niceUp(5 * c.R);
    else ztop = niceUp(1.05 * Z(c, wmax));
    const w0 = 10 ** Math.floor(Math.log10(wf / 30)), w1 = 10 ** Math.ceil(Math.log10(wf * 30));
    let lo = Infinity, hi = 0;
    for (let k = 0; k <= 200; k++) { const z = Z(c, w0 * (w1 / w0) ** (k / 200)); lo = Math.min(lo, z); hi = Math.max(hi, z); }
    // R (the minimum or maximum, or where the curve levels off) never lies on the edge
    let z0 = 10 ** Math.floor(Math.log10(Math.min(lo, c.R)) - 1e-9), z1 = 10 ** Math.ceil(Math.log10(Math.max(hi, c.R)) + 1e-9);
    if (z1 / z0 > 1e4) { if (c.conn === 'series') z1 = z0 * 1e4; else z0 = z1 / 1e4; }
    return { lin: { wmax, ztop }, log: { w0, w1, z0, z1 } };
  }

  // Every feature the method needs is on the graph and readable.
  function usable(c, ax) {
    const wf = feature(c), { wmax, ztop } = ax.lin;
    if (wf < 50 || wf > 50000) return false;
    if (c.kind === 'RLC') {
      const Q = quality(c);
      if (c.conn === 'series') return Q >= 0.7 && Q <= 1.6 && wmax / wf <= 8 && ztop / c.R <= 14;
      return Q >= 1.2 && Q <= 5 && wmax / wf <= 3;
    }
    if (wmax / wf > 9) return false;
    return !(c.conn === 'series' && c.kind === 'RL' && ztop / c.R > 12);
  }

  // ---------------------------------------------------------------- numbers
  const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const sup = (n) => String(n).split('').map((ch) => SUP[ch]).join('');
  // Three significant digits (trailing zeros kept), with a proper minus sign.
  function digits(x) {
    if (Math.abs(x) < 1e-12) return '0';
    let s = Math.abs(x).toPrecision(3);
    if (s.includes('e')) s = String(Number(Math.abs(x).toPrecision(3)));
    return (x < 0 ? '−' : '') + s;
  }
  const UNITS = {
    ohm: { html: 'Ω', tex: '\\Omega', prefixes: [0, 3] },
    H: { html: 'H', tex: '\\mathrm{H}', prefixes: [-3, 0] },
    F: { html: 'F', tex: '\\mathrm{F}', prefixes: [-9, -6] },
    ohms: { html: 'Ω·s', tex: '\\Omega\\,\\mathrm{s}', prefixes: [-6, -3, 0] },
  };
  const PREFIX = { '-9': ['n', '\\mathrm{n}'], '-6': ['µ', '\\mu'], '-3': ['m', '\\mathrm{m}'], 0: ['', ''], 3: ['k', '\\mathrm{k}'] };
  // A value with a unit: { html, tex }. Units: ohm, H, F, ohms (Ω·s) and w (rad/s).
  function q(x, unit) {
    if (unit === 'w') {
      if (Math.abs(x) < 1e4) return { html: `${digits(x)} rad/s`, tex: `${digits(x).replace('−', '-')}\\,\\mathrm{rad/s}` };
      const e = 3 * Math.floor(Math.log10(Math.abs(x) * (1 + 1e-12)) / 3), d = digits(x / 10 ** e);
      return { html: `${d}·10${sup(e)} rad/s`, tex: `${d.replace('−', '-')}\\cdot 10^{${e}}\\,\\mathrm{rad/s}` };
    }
    const u = UNITS[unit], ps = u.prefixes;
    let p = ps[0];
    for (const k of ps) if (Math.abs(x) >= 10 ** k * (1 - 5e-4)) p = k;
    const d = digits(x / 10 ** p), [ph, pt] = PREFIX[p];
    return { html: `${d} ${ph}${u.html}`, tex: `${d.replace('−', '-')}\\,${pt}${u.tex}` };
  }
  const H = (x, unit) => q(x, unit).html;
  const T = (x, unit) => q(x, unit).tex;

  // ---------------------------------------------------------------- the method
  // Annotations for the graph: pt (point), h (horizontal line), v (vertical line), line (straight
  // line through (w, z) with slope s), tan (tangent to the curve at w), fn (dashed curve f(ω)).
  const pt = (w, z, label) => ({ t: 'pt', w, z, label });
  const hl = (z, label) => ({ t: 'h', z, label });
  const vl = (w, label) => ({ t: 'v', w, label });
  const line = (w, z, s, label) => ({ t: 'line', w, z, s, label });
  const tan = (w, label) => ({ t: 'tan', w, label });
  const fn = (f, label) => ({ t: 'fn', f, label });

  // Worked analysis of circuit c with axes ax. Returns { intro, steps: [{ title, text, ann }],
  // plan, formulas, readings (per unknown), est (values found from the readings) }.
  function analysis(c, ax) {
    const { R, L, C } = c, wf = feature(c), wR = ax.lin.wmax, wS = ax.lin.wmax / 400;
    const series = c.conn === 'series';
    const Rh = H(R, 'ohm'), Rt = T(R, 'ohm');
    const sR = p3(dZ(c, wR)), sS = p3(dZ(c, wS)), w0 = p3(wf);
    const slopeNote = 'Since $\\omega$ is in rad/s, a slope of $1\\,\\Omega\\,\\mathrm{s}$ is $1\\,\\mathrm{H}$.';
    const steps = [], plan = {}, formulas = {}, readings = {}, est = { R };
    let intro;

    if (c.kind === 'RL') {
      const corner = { title: 'Check: the corner', ann: [vl(wf, 'ω = R/L')] };
      if (series) {
        intro = 'In series, resistance and reactance add like the sides of a right triangle: $$Z = \\sqrt{R^2 + (\\omega L)^2}$$';
        steps.push({ title: 'Small ω: the inductor is a wire', ann: [pt(0, R, 'Z(0) = R')],
          text: `At $\\omega = 0$ the reactance $\\omega L$ is zero, so the impedance is just the resistance: $Z(0) = R$. The graph starts at $Z(0) = ${Rt}$, so $R = ${Rt}$.` });
        est.L = sR;
        steps.push({ title: 'Large ω: the inductor dominates', ann: [line(0, 0, L, 'Z = ωL'), tan(wR, 'slope')],
          text: `For large $\\omega$, $\\omega L \\gg R$ and $Z \\approx \\omega L$: the graph approaches a straight line through the origin with slope $L$. The tangent at the right end, $\\omega = ${T(wR, 'w')}$, has the slope $\\frac{dZ}{d\\omega} \\approx ${T(sR, 'ohms')}$, so $L \\approx ${T(sR, 'H')}$. ${slopeNote}` });
        corner.ann.push(pt(wf, Math.SQRT2 * R, 'Z = √2·R'));
        corner.text = `Where $\\omega L = R$, at $\\omega = R/L = ${T(wf, 'w')}$, the impedance is $Z = \\sqrt{2}\\,R = ${T(Math.SQRT2 * R, 'ohm')}$: the graph passes through this point.`;
        plan.R = 'the value at ω = 0'; formulas.R = 'R = Z(0)'; readings.R = `Z(0) = ${Rh}`;
        plan.L = 'the slope of the tangent at the right end (the asymptote Z ≈ ωL)'; formulas.L = 'L = \\frac{dZ}{d\\omega}\\ \\text{(large } \\omega)';
        readings.L = `the tangent at ω = ${H(wR, 'w')} has the slope ${H(sR, 'ohms')}`;
      } else {
        intro = 'In parallel, the admittances add like the sides of a right triangle: $$\\frac{1}{Z} = \\sqrt{\\frac{1}{R^2} + \\frac{1}{(\\omega L)^2}}$$';
        est.L = sS;
        steps.push({ title: 'Small ω: the inductor short-circuits', ann: [line(0, 0, L, 'Z = ωL'), tan(wS, 'slope')],
          text: `For small $\\omega$ the inductor has a small reactance $\\omega L$ and takes almost all the current: $Z \\approx \\omega L$. So the graph starts at $Z = 0$ with the slope $L$. The tangent at the origin has the slope $\\frac{dZ}{d\\omega} \\approx ${T(sS, 'ohms')}$, so $L \\approx ${T(sS, 'H')}$. ${slopeNote}` });
        steps.push({ title: 'Large ω: only the resistor carries current', ann: [hl(R, 'Z → R')],
          text: `For large $\\omega$ the reactance $\\omega L$ is large and the current flows through the resistor: $Z \\to R$. The graph levels off at $${Rt}$, so $R = ${Rt}$.` });
        corner.ann.push(pt(wf, R / Math.SQRT2, 'Z = R/√2'));
        corner.text = `Where $\\omega L = R$, at $\\omega = R/L = ${T(wf, 'w')}$, the impedance is $Z = R/\\sqrt{2} = ${T(R / Math.SQRT2, 'ohm')}$: the graph passes through this point.`;
        plan.R = 'the value the graph levels off at for large ω'; formulas.R = 'R = Z(\\omega \\to \\infty)'; readings.R = `the graph levels off at ${Rh}`;
        plan.L = 'the slope of the tangent at the origin (Z ≈ ωL for small ω)'; formulas.L = 'L = \\frac{dZ}{d\\omega}\\ \\text{(at } \\omega = 0)';
        readings.L = `the tangent at the origin has the slope ${H(sS, 'ohms')}`;
      }
      steps.push(corner);
    } else if (c.kind === 'RC') {
      const wc = p3(wf), Zc = series ? Math.SQRT2 * R : R / Math.SQRT2;
      est.C = p3(1 / (wc * R));
      const cornerText = `The corner frequency is where the reactance $\\frac{1}{\\omega C}$ equals $R$; there $Z = ${series ? '\\sqrt{2}\\,R' : 'R/\\sqrt{2}'} = ${T(Zc, 'ohm')}$. The graph reaches this value at $\\omega_c \\approx ${T(wc, 'w')}$. From $\\frac{1}{\\omega_c C} = R$: $$C = \\frac{1}{\\omega_c R} = \\frac{1}{${T(wc, 'w')} \\cdot ${Rt}} = ${T(est.C, 'F')}$$`;
      if (series) {
        intro = 'In series, resistance and reactance add like the sides of a right triangle: $$Z = \\sqrt{R^2 + \\frac{1}{(\\omega C)^2}}$$';
        steps.push({ title: 'Small ω: the capacitor blocks', ann: [fn((w) => 1 / (w * C), 'Z ≈ 1/(ωC)')],
          text: 'For small $\\omega$ the reactance $\\frac{1}{\\omega C}$ of the capacitor is huge: $Z \\approx \\frac{1}{\\omega C}$ goes to infinity as $\\omega \\to 0$.' });
        steps.push({ title: 'Large ω: only the resistor is left', ann: [hl(R, 'Z → R')],
          text: `For large $\\omega$ the capacitor acts like a wire, and $Z \\to R$. The graph levels off at $${Rt}$, so $R = ${Rt}$.` });
        plan.R = 'the value the graph levels off at for large ω'; formulas.R = 'R = Z(\\omega \\to \\infty)'; readings.R = `the graph levels off at ${Rh}`;
      } else {
        intro = 'In parallel, the admittances add like the sides of a right triangle: $$\\frac{1}{Z} = \\sqrt{\\frac{1}{R^2} + (\\omega C)^2}$$';
        steps.push({ title: 'Small ω: the capacitor blocks', ann: [pt(0, R, 'Z(0) = R')],
          text: `At $\\omega = 0$ no current flows through the capacitor, only through the resistor: $Z(0) = R$. The graph starts at $${Rt}$, so $R = ${Rt}$.` });
        steps.push({ title: 'Large ω: the capacitor short-circuits', ann: [fn((w) => 1 / (w * C), 'Z ≈ 1/(ωC)')],
          text: 'For large $\\omega$ the capacitor takes almost all the current: $Z \\approx \\frac{1}{\\omega C} \\to 0$.' });
        plan.R = 'the value at ω = 0'; formulas.R = 'R = Z(0)'; readings.R = `Z(0) = ${Rh}`;
      }
      steps.push({ title: 'The corner frequency gives C', ann: [hl(Zc, series ? 'Z = √2·R' : 'Z = R/√2'), pt(wc, Zc, 'ω_c'), vl(wc, '')], text: cornerText });
      plan.C = `the corner frequency ω<sub>c</sub>, where Z = ${series ? '√2·R' : 'R/√2'}`; formulas.C = 'C = \\frac{1}{\\omega_c R}';
      readings.C = `Z = ${H(Zc, 'ohm')} at ω<sub>c</sub> ≈ ${H(wc, 'w')}`;
    } else {
      if (series) {
        intro = 'In series, the reactances of the coil and the capacitor partly cancel: $$Z = \\sqrt{R^2 + \\left(\\omega L - \\frac{1}{\\omega C}\\right)^2}$$';
        steps.push({ title: 'Small ω: the capacitor blocks', ann: [fn((w) => 1 / (w * C), 'Z ≈ 1/(ωC)')],
          text: 'For small $\\omega$ the reactance of the capacitor dominates: $Z \\approx \\frac{1}{\\omega C} \\to \\infty$.' });
        est.L = sR;
        steps.push({ title: 'Large ω: the inductor dominates', ann: [tan(wR, 'slope')],
          text: `For large $\\omega$, $Z \\approx \\omega L$: the slope of the tangent approaches $L$. At the right end, $\\omega = ${T(wR, 'w')}$, it is $\\frac{dZ}{d\\omega} \\approx ${T(sR, 'ohms')}$, so $L \\approx ${T(sR, 'H')}$. ${slopeNote}` });
        steps.push({ title: 'Resonance: the minimum', ann: [pt(w0, R, 'Z_min = R'), tan(w0, '')],
          text: `At the resonance frequency $\\omega_0$ the two reactances cancel, $\\omega_0 L = \\frac{1}{\\omega_0 C}$, and $Z$ is smallest: $Z_{\\min} = R$. The tangent is horizontal at $\\omega_0 \\approx ${T(w0, 'w')}$, where $Z = ${Rt}$. So $R = ${Rt}$.` });
        plan.R = 'the minimum of Z'; formulas.R = 'R = Z_{\\min}'; readings.R = `the minimum is Z = ${Rh}`;
        plan.L = 'the slope of the tangent at the right end (Z ≈ ωL for large ω)'; formulas.L = 'L = \\frac{dZ}{d\\omega}\\ \\text{(large } \\omega)';
        readings.L = `the tangent at ω = ${H(wR, 'w')} has the slope ${H(sR, 'ohms')}`;
      } else {
        intro = 'In parallel, the susceptances of the coil and the capacitor partly cancel: $$\\frac{1}{Z} = \\sqrt{\\frac{1}{R^2} + \\left(\\omega C - \\frac{1}{\\omega L}\\right)^2}$$';
        est.L = sS;
        steps.push({ title: 'Small ω: the inductor short-circuits', ann: [line(0, 0, L, 'Z = ωL'), tan(wS, 'slope')],
          text: `For small $\\omega$ the coil takes almost all the current: $Z \\approx \\omega L$. The tangent at the origin has the slope $\\frac{dZ}{d\\omega} \\approx ${T(sS, 'ohms')}$, so $L \\approx ${T(sS, 'H')}$. ${slopeNote}` });
        steps.push({ title: 'Large ω: the capacitor short-circuits', ann: [fn((w) => 1 / (w * C), 'Z ≈ 1/(ωC)')],
          text: 'For large $\\omega$ the capacitor takes almost all the current: $Z \\approx \\frac{1}{\\omega C} \\to 0$.' });
        steps.push({ title: 'Resonance: the maximum', ann: [pt(w0, R, 'Z_max = R'), tan(w0, '')],
          text: `At the resonance frequency $\\omega_0$ the currents through coil and capacitor cancel, and only the resistor counts: $Z_{\\max} = R$. The tangent is horizontal at $\\omega_0 \\approx ${T(w0, 'w')}$, where $Z = ${Rt}$. So $R = ${Rt}$.` });
        plan.R = 'the maximum of Z'; formulas.R = 'R = Z_{\\max}'; readings.R = `the maximum is Z = ${Rh}`;
        plan.L = 'the slope of the tangent at the origin (Z ≈ ωL for small ω)'; formulas.L = 'L = \\frac{dZ}{d\\omega}\\ \\text{(at } \\omega = 0)';
        readings.L = `the tangent at the origin has the slope ${H(sS, 'ohms')}`;
      }
      est.C = p3(1 / (w0 * w0 * est.L));
      steps.push({ title: 'C from the resonance frequency', ann: [vl(w0, 'ω₀')],
        text: `The resonance frequency is $\\omega_0 = \\frac{1}{\\sqrt{LC}}$, so $$C = \\frac{1}{\\omega_0^2 L} = \\frac{1}{(${T(w0, 'w')})^2 \\cdot ${T(est.L, 'H')}} = ${T(est.C, 'F')}$$` });
      plan.C = 'the resonance frequency ω₀ (horizontal tangent) together with L'; formulas.C = 'C = \\frac{1}{\\omega_0^2 L}';
      readings.C = `the tangent is horizontal at ω₀ ≈ ${H(w0, 'w')}`;
    }
    return { intro, steps, plan, formulas, readings, est };
  }

  // What Z does at the ends and in between, for the first hint.
  function shape(c) {
    const s = {
      'series RL': 'Z starts at R for ω = 0 and then grows, for large ω almost like the straight line ωL.',
      'parallel RL': 'Z starts at 0 with the slope L and levels off at R for large ω.',
      'series RC': 'Z comes down from infinity (like 1/(ωC)) and levels off at R for large ω.',
      'parallel RC': 'Z starts at R for ω = 0 and falls towards 0 (like 1/(ωC)) for large ω.',
      'series RLC': 'Z comes down from infinity (capacitor), has its minimum R at the resonance frequency ω₀ and grows again (coil), for large ω with the slope L.',
      'parallel RLC': 'Z starts at 0 with the slope L (coil), has its maximum R at the resonance frequency ω₀ and falls towards 0 (capacitor).',
    };
    return s[`${c.conn} ${c.kind}`];
  }

  // ---------------------------------------------------------------- exercises
  // Answer fields: R in Ω, L in mH, C in µF.
  const FIELD = {
    R: { sym: 'R', unit: 'Ω', scale: 1 },
    L: { sym: 'L', unit: 'mH', scale: 1e-3 },
    C: { sym: 'C', unit: 'µF', scale: 1e-6 },
  };

  function exercise(c, id) {
    const ax = axesFor(c), an = analysis(c, ax);
    const fields = UNKNOWNS[c.kind].map((k) => ({ key: k, ...FIELD[k], value: c[k] / FIELD[k].scale }));
    return { id, c, ax, an, fields };
  }

  function build(r, kind, conn) {
    const c = { kind, conn, R: r.pick(R_VALUES), L: kind === 'RC' ? null : r.pick(L_VALUES), C: kind === 'RL' ? null : r.pick(C_VALUES) };
    return usable(c, axesFor(c)) ? c : null;
  }

  function generate(filter, seed) {
    const r = rng(seed);
    // the kind of circuit first, so that every kind comes up equally often
    const kind = filter === 'mixed' ? r.pick(['RL', 'RC', 'RLC']) : filter, conn = r.pick(['series', 'parallel']);
    for (let k = 0; k < 100000; k++) {
      const c = build(r, kind, conn);
      if (c) return exercise(c, `${filter}-${seed}`);
    }
    throw new Error(`no exercise for ${filter}-${seed}`);
  }

  // What a wrong value x (in the field's unit) suggests.
  // ok, sign, omega0 (C = 1/(ω₀L)), 2pi (ω and f mixed up), prefix (factor 1000), sqrt2, close, wrong.
  function diagnose(ex, key, x) {
    const f = ex.fields.find((g) => g.key === key), v = f.value;
    const near = (a, b, tol) => Math.abs(a - b) <= tol * Math.abs(b);
    if (Number.isNaN(x)) return 'nan';
    if (near(x, v, TOL)) return 'ok';
    if (x < 0) return 'sign';
    const c = ex.c;
    if (key === 'C' && c.kind === 'RLC' && near(x, 1 / (feature(c) * c.L) / f.scale, TOL)) return 'omega0';
    for (const k of [2 * Math.PI, 1 / (2 * Math.PI), 4 * Math.PI * Math.PI, 1 / (4 * Math.PI * Math.PI)]) if (near(x, v * k, TOL)) return '2pi';
    for (const k of [1e3, 1e-3, 1e6, 1e-6]) if (near(x, v * k, TOL)) return 'prefix';
    for (const k of [Math.SQRT2, Math.SQRT1_2, 2, 0.5]) if (near(x, v * k, TOL)) return 'sqrt2';
    if (near(x, v, 3 * TOL)) return 'close';
    return 'wrong';
  }

  const api = {
    TOL, FILTERS, UNKNOWNS, FIELD, Z, dZ, feature, quality, axesFor, usable, analysis, shape, exercise, generate, diagnose,
    q, H, T, digits, sup, p3, niceUp,
  };
  root.Impedance = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
