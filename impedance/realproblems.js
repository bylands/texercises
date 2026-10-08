// Problems: impedance curves of real devices, told as stories. Each device has a model (its
// impedance as a function of the frequency f in Hz), random values from lists, and a measured
// curve to read with the probe; the answers are chosen from values, the wrong ones from typical
// mistakes (a 2π forgotten, the square in f₀ = 1/(2π√(LC)) forgotten, a reading at the wrong place),
// each with the explanation shown when it is picked, as in practice (generator.js).
//   PROBLEMS[i]   { id, difficulty, title(), make(r), solve(p), model(p), text(p, v), fields(p, v),
//                   hints(p, v), steps(p, v), ann(p, v), pic() }
//     model(p)    { fn (Z of f), ax (the axes: lin, semilog or ylog, see plot.js), extra: [fn]
//                   (a curve drawn dashed for comparison) }
//     fields      [{ key, sym, what, unit, value, mistakes: [{ tag, value, why }], how }]: the
//                   value read or worked out the way taught, from the curve itself
//   realOf(i, seed)  the exercise of problem i (see app.js)
(function (root) {
  'use strict';

  const I = root.Impedance || require('./generator.js');
  const Lang = root.Lang || (typeof require === 'function' ? require('./lang.js') : null);
  const L = (en, de) => (Lang ? Lang.L(en, de) : en);
  const PI2 = 2 * Math.PI;
  const T = (x, u, n = 3) => I.q(x, u, n).tex, H = (x, u, n = 3) => I.q(x, u, n).html;
  const pick = (r, xs) => r.pick(xs);

  // ---------------------------------------------------------------- complex numbers [re, im]
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const mul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  const inv = (a) => { const d = a[0] * a[0] + a[1] * a[1]; return [a[0] / d, -a[1] / d]; };
  const abs = (a) => Math.hypot(a[0], a[1]);
  const par = (a, b) => inv(add(inv(a), inv(b)));
  const coil = (Lh, f) => [0, PI2 * f * Lh], cap = (C, f) => [0, -1 / (PI2 * f * C)];

  // ---------------------------------------------------------------- the curve, as read
  // the frequency of the largest (sign 1) or smallest (−1) Z between a and b, sampled and refined
  function extremum(fn, a, b, sign = 1, log = false) {
    const at = (k, n) => (log ? a * (b / a) ** (k / n) : a + ((b - a) * k) / n);
    let best = a, bz = -Infinity;
    for (let k = 0; k <= 4000; k++) { const f = at(k, 4000), z = sign * fn(f); if (z > bz) { bz = z; best = f; } }
    let lo = Math.max(a, best - (b - a) / 2000), hi = Math.min(b, best + (b - a) / 2000);
    if (log) { lo = Math.max(a, best / (b / a) ** (1 / 2000)); hi = Math.min(b, best * (b / a) ** (1 / 2000)); }
    for (let k = 0; k < 80; k++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; if (sign * fn(m1) < sign * fn(m2)) lo = m1; else hi = m2; }
    return (lo + hi) / 2;
  }
  // the frequency between a and b where Z = z (Z monotonic there)
  function where(fn, z, a, b) {
    const up = fn(b) > fn(a);
    for (let k = 0; k < 100; k++) { const m = (a + b) / 2; if ((fn(m) < z) === up) a = m; else b = m; }
    return (a + b) / 2;
  }
  const maxOn = (fn, a, b) => { let m = 0; for (let k = 0; k <= 400; k++) m = Math.max(m, fn(a + ((b - a) * k) / 400)); return m; };

  // the axes of a problem: the frequency f in Hz, in one mode (no switch)
  const X = { name: 'f', unit: 'Hz' };
  const linAx = (wlo, wmax, ztop) => ({ x: X, mode: 'lin', lin: { wlo, wmax, ztop } });
  const semiAx = (w0, w1, ztop) => ({ x: X, mode: 'semilog', semi: { w0, w1, ztop } });
  const ylogAx = (wlo, wmax, z0, z1) => ({ x: X, mode: 'ylog', ylog: { wlo, wmax, z0, z1 } });
  const decadeUp = (z) => 10 ** Math.ceil(Math.log10(z) - 1e-9), decadeDown = (z) => 10 ** Math.floor(Math.log10(z) + 1e-9);

  // annotations of the solution's graph (plot.js)
  const pt = (w, z, label) => ({ t: 'pt', w, z, label }), hl = (z, label) => ({ t: 'h', z, label }), vl = (w, label) => ({ t: 'v', w, label });

  // ---------------------------------------------------------------- texts used by several
  const W2PI = () => L('The axis shows the frequency f in Hz; ω = 2πf is the angular frequency.', 'Die Achse zeigt die Frequenz f in Hz; ω = 2πf ist die Kreisfrequenz.');
  const OMEGA = () => L('That is ω = 2πf, the angular frequency. The axis shows the frequency f.', 'Das ist ω = 2πf, die Kreisfrequenz. Die Achse zeigt die Frequenz f.');
  const NO2PI = (what) => L(`The 2π is missing: ${what}`, `Das 2π fehlt: ${what}`);
  const SQUARE = () => L('The square is missing: from 2πf₀ = 1/√(LC) follows C = 1/((2πf₀)²L), and L = 1/((2πf₀)²C).', 'Das Quadrat fehlt: Aus 2πf₀ = 1/√(LC) folgt C = 1/((2πf₀)²L) und L = 1/((2πf₀)²C).');
  const F0 = () => L('ω₀ = 2πf₀ = 1/√(LC), so C = 1/((2πf₀)²L).', 'ω₀ = 2πf₀ = 1/√(LC), also C = 1/((2πf₀)²L).');
  const SQRT_LC = '2\\pi f_0 = \\frac{1}{\\sqrt{LC}}';
  const step = (title, text) => ({ title, text });

  // ---------------------------------------------------------------- a loudspeaker
  // The voice coil (R, L in series) and the cone on its suspension, a parallel resonance (Res,
  // Lces, Cmes) at fs with the quality Qms, as in the datasheets (Thiele–Small).
  const speaker = {
    id: 'speaker', difficulty: 4, title: () => L('A loudspeaker’s datasheet', 'Das Datenblatt eines Lautsprechers'),
    make: (r) => ({ R: pick(r, [5.6, 6, 6.4, 6.8]), L: pick(r, [0.3, 0.4, 0.5, 0.6, 0.8]) * 1e-3, fs: pick(r, [40, 45, 50, 55, 60, 70, 80]), Res: pick(r, [20, 25, 30, 40]), Q: pick(r, [3, 4, 5]) }),
    model(p) {
      const Lm = p.Res / (p.Q * PI2 * p.fs), Cm = 1 / ((PI2 * p.fs) ** 2 * Lm);
      const fn = (f) => abs(add(add([p.R, 0], coil(p.L, f)), inv(add(add([1 / p.Res, 0], inv(coil(Lm, f))), inv(cap(Cm, f))))));
      return { fn, ax: semiAx(10, 20000, I.niceUp(1.1 * fn(p.fs))) };
    },
    solve(p) {
      const { fn } = speaker.model(p), fpk = extremum(fn, 10, 1000, 1, true), fmin = extremum(fn, fpk, 3000, -1, true);
      const R = fn(fmin), f1 = 10000, Z1 = fn(f1), X1 = Math.sqrt(Z1 * Z1 - R * R);
      return { fpk, Zpk: fn(fpk), fmin, R, f1, Z1, X1, L: X1 / (PI2 * f1) };
    },
    text: (p) => L(`The datasheet of a loudspeaker labelled “8 Ω” shows its impedance against the frequency (measured, below). The voice coil is a coil of wire, with a resistance <i>R</i> and an inductance <i>L</i>, that sits in a magnet and drives the cone; the cone hangs on a soft suspension. (a) What is the resistance <i>R</i> of the voice coil? (b) At which frequency <i>f</i><sub>s</sub> does the cone resonate on its suspension? (c) At high frequencies, the inductance of the voice coil makes <i>Z</i> rise: find <i>L</i> from <i>Z</i> at 10 kHz.`,
      `Das Datenblatt eines Lautsprechers mit der Aufschrift «8 Ω» zeigt seine Impedanz gegen die Frequenz (gemessen, unten). Die Schwingspule ist eine Drahtspule mit einem Widerstand <i>R</i> und einer Induktivität <i>L</i>; sie sitzt in einem Magneten und treibt die Membran an, die an einer weichen Aufhängung hängt. (a) Wie gross ist der Widerstand <i>R</i> der Schwingspule? (b) Bei welcher Frequenz <i>f</i><sub>s</sub> schwingt die Membran in ihrer Aufhängung in Resonanz? (c) Bei hohen Frequenzen lässt die Induktivität der Schwingspule <i>Z</i> ansteigen: Bestimme <i>L</i> aus <i>Z</i> bei 10 kHz.`),
    fields: (p, v) => [
      { key: 'R', sym: '<i>R</i>', what: L('(a) the resistance of the voice coil', '(a) der Widerstand der Schwingspule'), unit: 'ohm', value: v.R,
        how: L('R is the flat bottom of the curve above the peak.', 'R ist der flache Boden der Kurve über der Spitze.'),
        mistakes: [
          { tag: 'nominal', value: 8, why: L('8 Ω is the nominal impedance printed on the speaker, a rounded value for the whole audio range. The resistance of the coil is the flat bottom of the curve above the peak.', '8 Ω ist die aufgedruckte Nennimpedanz, ein gerundeter Wert für den ganzen Hörbereich. Der Widerstand der Spule ist der flache Boden der Kurve über der Spitze.') },
          { tag: 'peak', value: v.Zpk, why: L('That is the peak at the resonance, where the moving cone adds to the impedance.', 'Das ist die Spitze bei der Resonanz, wo die schwingende Membran zur Impedanz beiträgt.') },
          { tag: 'end', value: v.Z1, why: L('At high frequencies the inductance of the coil adds to Z.', 'Bei hohen Frequenzen trägt die Induktivität der Spule zu Z bei.') },
        ] },
      { key: 'fs', sym: '<i>f</i><sub>s</sub>', what: L('(b) the resonance frequency of the cone', '(b) die Resonanzfrequenz der Membran'), unit: 'Hz', value: v.fpk,
        how: L('The cone resonates where Z has its peak.', 'Die Membran schwingt dort in Resonanz, wo Z seine Spitze hat.'),
        mistakes: [
          { tag: '2pi', value: PI2 * v.fpk, why: OMEGA() },
          { tag: 'min', value: v.fmin, why: L('That is where Z is smallest. The cone resonates where Z has its peak.', 'Dort ist Z am kleinsten. Die Membran schwingt dort in Resonanz, wo Z seine Spitze hat.') },
          { tag: '2pi', value: v.fpk / PI2, why: W2PI() },
        ] },
      { key: 'L', sym: '<i>L</i>', what: L('(c) the inductance of the voice coil, from <i>Z</i> at 10 kHz', '(c) die Induktivität der Schwingspule, aus <i>Z</i> bei 10 kHz'), unit: 'H', value: v.L,
        how: L('At 10 kHz, Z = √(R² + (2πfL)²).', 'Bei 10 kHz ist Z = √(R² + (2πfL)²).'),
        mistakes: [
          { tag: '2pi', value: v.X1 / v.f1, why: NO2PI(L('the reactance of a coil is 2πfL.', 'Der Blindwiderstand einer Spule ist 2πfL.')) },
          { tag: 'sub', value: (v.Z1 - v.R) / (PI2 * v.f1), why: L('Resistance and reactance do not add like numbers but like the sides of a right triangle: X = √(Z² − R²).', 'Widerstand und Blindwiderstand addieren sich nicht wie Zahlen, sondern wie die Seiten eines rechtwinkligen Dreiecks: X = √(Z² − R²).') },
          { tag: '2pi', value: (v.X1 * PI2) / v.f1, why: L('The reactance of a coil is 2πfL, so L = X/(2πf).', 'Der Blindwiderstand einer Spule ist 2πfL, also L = X/(2πf).') },
        ] },
    ],
    hints: () => [
      L('Above the peak and below a few kHz the cone hardly moves, and the reactance 2πfL of the voice coil is still small: only R is left. The flat bottom of the curve is R.', 'Über der Spitze und unter einigen kHz bewegt sich die Membran kaum, und der Blindwiderstand 2πfL der Schwingspule ist noch klein: Nur R bleibt. Der flache Boden der Kurve ist R.'),
      L('The cone on its suspension acts like a parallel resonant circuit: it adds a peak to Z at its resonance frequency f<sub>s</sub>.', 'Die Membran in ihrer Aufhängung wirkt wie ein Parallelschwingkreis: Sie fügt Z bei ihrer Resonanzfrequenz f<sub>s</sub> eine Spitze hinzu.'),
      L('At 10 kHz the coil counts: Z = √(R² + (2πfL)²), so L = √(Z² − R²)/(2πf).', 'Bei 10 kHz zählt die Spule: Z = √(R² + (2πfL)²), also L = √(Z² − R²)/(2πf).'),
    ],
    steps: (p, v) => [
      step(L('The flat bottom: R', 'Der flache Boden: R'), L(`Above the peak the cone hardly moves, and at a few hundred Hz the reactance of the voice coil is still small. The bottom of the curve, at about ${H(v.fmin, 'Hz', 2)}, is the resistance of the coil: $R \\approx ${T(v.R, 'ohm', 2)}$.`,
        `Über der Spitze bewegt sich die Membran kaum, und bei einigen hundert Hz ist der Blindwiderstand der Schwingspule noch klein. Der Boden der Kurve, bei etwa ${H(v.fmin, 'Hz', 2)}, ist der Widerstand der Spule: $R \\approx ${T(v.R, 'ohm', 2)}$.`)),
      step(L('The peak: f<sub>s</sub>', 'Die Spitze: f<sub>s</sub>'), L(`The cone resonates on its suspension where $Z$ has its peak, $${T(v.Zpk, 'ohm')}$: $f_s \\approx ${T(v.fpk, 'Hz', 2)}$.`, `Die Membran schwingt dort in Resonanz, wo $Z$ seine Spitze hat, $${T(v.Zpk, 'ohm')}$: $f_s \\approx ${T(v.fpk, 'Hz', 2)}$.`)),
      step(L('The rise: L', 'Der Anstieg: L'), L(`At 10 kHz, $Z = ${T(v.Z1, 'ohm')}$. Resistance and reactance add like the sides of a right triangle:`, `Bei 10 kHz ist $Z = ${T(v.Z1, 'ohm')}$. Widerstand und Blindwiderstand addieren sich wie die Seiten eines rechtwinkligen Dreiecks:`) +
        ` $$X = \\sqrt{Z^2 - R^2} = \\sqrt{(${T(v.Z1, 'ohm')})^2 - (${T(v.R, 'ohm')})^2} = ${T(v.X1, 'ohm')}$$ $$L = \\frac{X}{2\\pi f} = \\frac{${T(v.X1, 'ohm')}}{2\\pi\\cdot ${T(v.f1, 'Hz')}} = ${T(v.L, 'H')}$$`),
      step(L('Why “8 Ω”?', 'Warum «8 Ω»?'), L(`Over most of the audio range $Z$ lies close to $R$, a little above it; the nominal 8 Ω is a rounded value for that, which amplifiers are built for. An ohmmeter would show only $R$.`, `Über den grössten Teil des Hörbereichs liegt $Z$ nahe bei $R$, etwas darüber; die Nennimpedanz 8 Ω ist ein gerundeter Wert dafür, auf den Verstärker ausgelegt sind. Ein Ohmmeter würde nur $R$ anzeigen.`)),
    ],
    ann: (p, v) => [pt(v.fmin, v.R, 'R'), pt(v.fpk, v.Zpk, 'f_s'), pt(v.f1, v.Z1, '10 kHz')],
    pic: () => root.ImpFigures.speaker(),
  };

  // ---------------------------------------------------------------- a guitar pickup and its cable
  // The pickup coil (R and L in series) with the capacitance of its windings and of the cable in
  // parallel: a resonance peak at a few kHz.
  const CSELF = 100e-12, CPM = 100e-12;
  const guitar = {
    id: 'guitar', difficulty: 3, title: () => L('An electric guitar and its cable', 'Eine E-Gitarre und ihr Kabel'),
    make: (r) => ({ L: pick(r, [2.2, 2.5, 3, 3.5, 4]), R: pick(r, [6, 7, 8, 9, 10]) * 1e3, len: pick(r, [3, 4, 5, 6]) }),
    model(p) {
      const C = CSELF + CPM * p.len, fn = (f) => abs(par(add([p.R, 0], coil(p.L, f)), cap(C, f)));
      return { fn, ax: linAx(0, 20000, I.niceUp(1.1 * maxOn(fn, 1000, 10000))) };
    },
    solve(p) {
      const { fn } = guitar.model(p), f0 = extremum(fn, 500, 20000), C = 1 / ((PI2 * f0) ** 2 * p.L);
      return { f0, Z0: fn(f0), C, len: (C - CSELF) / CPM };
    },
    text: (p) => L(`The pickup of an electric guitar is a coil of thin wire: <i>L</i> = ${H(p.L, 'H', 2)}, <i>R</i> = ${H(p.R, 'ohm', 2)}. The cable to the amplifier adds a capacitance in parallel, 100 pF per metre; the windings of the pickup add another 100 pF. The graph shows the impedance at the plug of the cable (measured). (a) At which frequency <i>f</i>₀ is the resonance peak? (b) What is the capacitance <i>C</i> of pickup and cable together? (c) How long is the cable?`,
      `Der Tonabnehmer einer E-Gitarre ist eine Spule aus dünnem Draht: <i>L</i> = ${H(p.L, 'H', 2)}, <i>R</i> = ${H(p.R, 'ohm', 2)}. Das Kabel zum Verstärker fügt parallel eine Kapazität hinzu, 100 pF pro Meter; die Wicklungen des Tonabnehmers weitere 100 pF. Der Graph zeigt die Impedanz am Stecker des Kabels (gemessen). (a) Bei welcher Frequenz <i>f</i>₀ liegt die Resonanzspitze? (b) Wie gross ist die Kapazität <i>C</i> von Tonabnehmer und Kabel zusammen? (c) Wie lang ist das Kabel?`),
    fields: (p, v) => [
      { key: 'f0', sym: '<i>f</i>₀', what: L('(a) the frequency of the peak', '(a) die Frequenz der Spitze'), unit: 'Hz', value: v.f0, how: L('Read the frequency of the peak.', 'Lies die Frequenz der Spitze ab.'),
        mistakes: [{ tag: '2pi', value: PI2 * v.f0, why: OMEGA() }, { tag: 'half', value: v.f0 / 2, why: L('Read the frequency of the peak itself.', 'Lies die Frequenz der Spitze selbst ab.') }, { tag: '2pi', value: v.f0 / PI2, why: W2PI() }] },
      { key: 'C', sym: '<i>C</i>', what: L('(b) the capacitance of pickup and cable together', '(b) die Kapazität von Tonabnehmer und Kabel zusammen'), unit: 'F', value: v.C, how: F0(),
        mistakes: [{ tag: '2pi', value: 1 / (v.f0 ** 2 * p.L), why: NO2PI(F0()) }, { tag: 'square', value: 1 / (PI2 * v.f0 * p.L), why: SQUARE() }, { tag: 'prefix', value: v.C * 1000, why: L('Off by a factor 1000: check the unit prefixes (1 nF = 1000 pF).', 'Um den Faktor 1000 daneben: Prüfe die Vorsilben (1 nF = 1000 pF).') }] },
      { key: 'len', sym: 'ℓ', what: L('(c) the length of the cable', '(c) die Länge des Kabels'), unit: 'm', value: v.len, how: L('The cable has C − 100 pF, at 100 pF per metre.', 'Das Kabel hat C − 100 pF, mit 100 pF pro Meter.'),
        mistakes: [{ tag: 'self', value: v.C / CPM, why: L('The windings of the pickup have 100 pF of their own; only the rest is the cable’s.', 'Die Wicklungen des Tonabnehmers haben selbst 100 pF; nur der Rest gehört zum Kabel.') }, { tag: 'self', value: (v.C + CSELF) / CPM, why: L('The 100 pF of the pickup are part of C: subtract them.', 'Die 100 pF des Tonabnehmers sind Teil von C: Zieh sie ab.') }] },
    ],
    hints: () => [
      L('Coil and capacitance form a parallel resonant circuit: Z has its peak where 2πf₀ = 1/√(LC). (R is small compared with 2πf₀L here.)', 'Spule und Kapazität bilden einen Parallelschwingkreis: Z hat seine Spitze dort, wo 2πf₀ = 1/√(LC). (R ist hier klein gegenüber 2πf₀L.)'),
      F0(),
      L('The cable has C − 100 pF; at 100 pF per metre, that gives its length.', 'Das Kabel hat C − 100 pF; mit 100 pF pro Meter ergibt das seine Länge.'),
    ],
    steps: (p, v) => [
      step(L('The peak', 'Die Spitze'), L(`The peak lies at $f_0 \\approx ${T(v.f0, 'Hz', 2)}$, where $Z = ${T(v.Z0, 'ohm', 2)}$.`, `Die Spitze liegt bei $f_0 \\approx ${T(v.f0, 'Hz', 2)}$, wo $Z = ${T(v.Z0, 'ohm', 2)}$.`)),
      step(L('The capacitance', 'Die Kapazität'), L('Coil and capacitance form a parallel resonant circuit:', 'Spule und Kapazität bilden einen Parallelschwingkreis:') + ` $$${SQRT_LC} \\quad\\Rightarrow\\quad C = \\frac{1}{(2\\pi f_0)^2 L} = \\frac{1}{(2\\pi\\cdot ${T(v.f0, 'Hz')})^2\\cdot ${T(p.L, 'H', 2)}} = ${T(v.C, 'F')}$$`),
      step(L('The cable', 'Das Kabel'), L(`Without the 100 pF of the pickup, the cable has $${T(v.C - CSELF, 'F')}$: at 100 pF per metre, it is $\\ell \\approx ${T(v.len, 'm', 2)}$ long.`, `Ohne die 100 pF des Tonabnehmers hat das Kabel $${T(v.C - CSELF, 'F')}$: Mit 100 pF pro Meter ist es $\\ell \\approx ${T(v.len, 'm', 2)}$ lang.`) +
        `<p>${L('The peak boosts the frequencies around f₀ and gives the guitar its bright sound. A longer cable means more C and a lower peak: the sound gets duller — guitarists hear the difference between a 3 m and a 10 m cable.', 'Die Spitze verstärkt die Frequenzen um f₀ und gibt der Gitarre ihren hellen Klang. Ein längeres Kabel bedeutet mehr C und eine tiefere Spitze: Der Klang wird dumpfer — Gitarristen hören den Unterschied zwischen einem 3-m- und einem 10-m-Kabel.')}</p>`),
    ],
    ann: (p, v) => [pt(v.f0, v.Z0, 'f₀')],
    pic: () => root.ImpFigures.guitar(),
  };

  // ---------------------------------------------------------------- tuning a radio
  // A parallel resonant circuit (coil, variable capacitor and the losses as R) at the antenna of an
  // AM radio, in the medium wave band.
  const radio = {
    id: 'radio', difficulty: 3, title: () => L('Tuning a radio', 'Ein Radio einstellen'),
    make(r) { const f0 = pick(r, [600, 700, 800, 900, 1000, 1100, 1200]) * 1e3; return { L: pick(r, [150, 200, 250, 300]) * 1e-6, R: pick(r, [50, 80, 100]) * 1e3, f0, f2: pick(r, [540, 650, 750, 950, 1300, 1500].map((x) => x * 1e3).filter((x) => Math.abs(x - f0) > 80e3)) }; },
    model(p) {
      const C = 1 / ((PI2 * p.f0) ** 2 * p.L), fn = (f) => 1 / abs(add(add([1 / p.R, 0], inv(coil(p.L, f))), inv(cap(C, f))));
      return { fn, ax: linAx(400e3, 1700e3, I.niceUp(1.1 * p.R)) };
    },
    solve(p) { const { fn } = radio.model(p), f0 = extremum(fn, 400e3, 1700e3), C = 1 / ((PI2 * f0) ** 2 * p.L); return { f0, Z0: fn(f0), C, C2: 1 / ((PI2 * p.f2) ** 2 * p.L) }; },
    text: (p) => L(`In a simple AM radio, a coil (<i>L</i> = ${H(p.L, 'H', 2)}) and a variable capacitor form a parallel resonant circuit at the antenna. Its impedance is large only near its resonance frequency: there, the signal of a station builds up a voltage across the circuit, while all others are short-circuited. Turning the knob changes <i>C</i>. The graph shows the impedance of the circuit (measured). (a) To which frequency <i>f</i>₀ is the radio tuned? (b) What is <i>C</i> now? (c) Which capacitance <i>C</i>₂ tunes the radio to a station at ${H(p.f2, 'Hz')}?`,
      `In einem einfachen Mittelwellenradio bilden eine Spule (<i>L</i> = ${H(p.L, 'H', 2)}) und ein Drehkondensator an der Antenne einen Parallelschwingkreis. Seine Impedanz ist nur nahe seiner Resonanzfrequenz gross: Dort baut das Signal eines Senders eine Spannung über dem Kreis auf, während alle anderen kurzgeschlossen werden. Der Drehknopf verändert <i>C</i>. Der Graph zeigt die Impedanz des Kreises (gemessen). (a) Auf welche Frequenz <i>f</i>₀ ist das Radio eingestellt? (b) Wie gross ist <i>C</i> jetzt? (c) Welche Kapazität <i>C</i>₂ stellt das Radio auf einen Sender bei ${H(p.f2, 'Hz')} ein?`),
    fields: (p, v) => [
      { key: 'f0', sym: '<i>f</i>₀', what: L('(a) the frequency the radio is tuned to', '(a) die eingestellte Frequenz'), unit: 'Hz', value: v.f0, how: L('Read the frequency of the peak.', 'Lies die Frequenz der Spitze ab.'),
        mistakes: [{ tag: '2pi', value: PI2 * v.f0, why: OMEGA() }, { tag: '2pi', value: v.f0 / PI2, why: W2PI() }, { tag: 'other', value: v.f0 * 1.5, why: L('Read the frequency of the peak.', 'Lies die Frequenz der Spitze ab.') }] },
      { key: 'C', sym: '<i>C</i>', what: L('(b) the capacitance now', '(b) die Kapazität jetzt'), unit: 'F', value: v.C, how: F0(),
        mistakes: [{ tag: '2pi', value: 1 / (v.f0 ** 2 * p.L), why: NO2PI(F0()) }, { tag: 'square', value: 1 / (PI2 * v.f0 * p.L), why: SQUARE() }] },
      { key: 'C2', sym: '<i>C</i>₂', what: L(`(c) the capacitance for the station at ${H(p.f2, 'Hz')}`, `(c) die Kapazität für den Sender bei ${H(p.f2, 'Hz')}`), unit: 'F', value: v.C2, how: F0(),
        mistakes: [{ tag: 'linear', value: (v.C * v.f0) / p.f2, why: L('C goes with 1/f²: twice the frequency needs a quarter of the capacitance.', 'C geht mit 1/f²: Die doppelte Frequenz braucht einen Viertel der Kapazität.') },
          { tag: 'inverse', value: v.C * (p.f2 / v.f0) ** 2, why: L('Upside down: a higher frequency needs a smaller capacitance.', 'Umgekehrt: Eine höhere Frequenz braucht eine kleinere Kapazität.') }, { tag: 'square', value: 1 / (PI2 * p.f2 * p.L), why: SQUARE() }] },
    ],
    hints: () => [
      L('The impedance of a parallel resonant circuit has its peak at the resonance frequency: there, coil and capacitor carry no net current.', 'Die Impedanz eines Parallelschwingkreises hat ihre Spitze bei der Resonanzfrequenz: Dort führen Spule und Kondensator zusammen keinen Strom.'),
      F0(),
      L('C₂ = 1/((2πf₂)²L): the same coil, another frequency.', 'C₂ = 1/((2πf₂)²L): dieselbe Spule, eine andere Frequenz.'),
    ],
    steps: (p, v) => [
      step(L('The peak', 'Die Spitze'), L(`The peak lies at $f_0 \\approx ${T(v.f0, 'Hz', 2)}$: the radio receives the station on this frequency.`, `Die Spitze liegt bei $f_0 \\approx ${T(v.f0, 'Hz', 2)}$: Das Radio empfängt den Sender auf dieser Frequenz.`)),
      step(L('The capacitance', 'Die Kapazität'), `$$${SQRT_LC} \\quad\\Rightarrow\\quad C = \\frac{1}{(2\\pi f_0)^2 L} = \\frac{1}{(2\\pi\\cdot ${T(v.f0, 'Hz')})^2\\cdot ${T(p.L, 'H', 2)}} = ${T(v.C, 'F')}$$`),
      step(L('Another station', 'Ein anderer Sender'), `$$C_2 = \\frac{1}{(2\\pi f_2)^2 L} = \\frac{1}{(2\\pi\\cdot ${T(p.f2, 'Hz')})^2\\cdot ${T(p.L, 'H', 2)}} = ${T(v.C2, 'F')}$$` +
        `<p>${L('From 540 to 1600 kHz the frequency changes by a factor of 3, so C by a factor of 9: that is why tuning capacitors have many interleaved plates.', 'Von 540 bis 1600 kHz ändert sich die Frequenz um den Faktor 3, C also um den Faktor 9: Deshalb haben Drehkondensatoren viele ineinandergreifende Platten.')}</p>`),
    ],
    ann: (p, v) => [pt(v.f0, v.Z0, 'f₀')],
    pic: () => root.ImpFigures.radio(),
  };

  // ---------------------------------------------------------------- a wireless charger
  // A series resonant circuit driven at its minimum; the phone's ferrite sheet raises L.
  const charger = {
    id: 'charger', difficulty: 4, title: () => L('A wireless charger', 'Ein kabelloses Ladegerät'),
    make: (r) => ({ L0: pick(r, [6.3, 8.2, 10, 12]) * 1e-6, f0: pick(r, [100, 110, 120, 130, 140]) * 1e3, R: pick(r, [0.5, 0.8, 1]), k: pick(r, [1.08, 1.12, 1.15, 1.2]) }),
    model(p) {
      const C = 1 / ((PI2 * p.f0) ** 2 * p.L0), z = (Lh) => (f) => abs(add(add([p.R, 0], coil(Lh, f)), cap(C, f)));
      return { fn: z(p.L0 * p.k), extra: [z(p.L0)], ax: linAx(0.6 * p.f0, 1.4 * p.f0, I.niceUp(10 * p.R)) };
    },
    solve(p) {
      const { fn, extra } = charger.model(p), C = 1 / ((PI2 * p.f0) ** 2 * p.L0), f1 = extremum(fn, 0.6 * p.f0, 1.4 * p.f0, -1);
      return { C, f1, Z1: fn(f1), L1: 1 / ((PI2 * f1) ** 2 * C), Zold: fn(p.f0), Z0: extra[0](p.f0) };
    },
    text: (p) => L(`A wireless charger drives an alternating current through a flat coil (<i>L</i> = ${H(p.L0, 'H', 2)} without a phone), in series with a capacitor. It works at the resonance frequency, <i>f</i>₀ = ${H(p.f0, 'Hz')}, where the impedance is smallest and the current largest. The graph shows the impedance without a phone (dashed) and with a phone on the pad (solid): the ferrite sheet in the phone changes the inductance of the coil. (a) What is the capacitance <i>C</i>? (b) Where is the minimum with the phone? (c) What is the inductance <i>L</i>₁ of the coil with the phone?`,
      `Ein kabelloses Ladegerät treibt einen Wechselstrom durch eine flache Spule (<i>L</i> = ${H(p.L0, 'H', 2)} ohne Handy), in Serie mit einem Kondensator. Es arbeitet bei der Resonanzfrequenz, <i>f</i>₀ = ${H(p.f0, 'Hz')}, wo die Impedanz am kleinsten und der Strom am grössten ist. Der Graph zeigt die Impedanz ohne Handy (gestrichelt) und mit einem Handy auf der Ladefläche (ausgezogen): Die Ferritfolie im Handy verändert die Induktivität der Spule. (a) Wie gross ist die Kapazität <i>C</i>? (b) Wo liegt das Minimum mit dem Handy? (c) Wie gross ist die Induktivität <i>L</i>₁ der Spule mit dem Handy?`),
    fields: (p, v) => [
      { key: 'C', sym: '<i>C</i>', what: L('(a) the capacitance of the charger', '(a) die Kapazität des Ladegeräts'), unit: 'F', value: v.C, how: F0(),
        mistakes: [{ tag: '2pi', value: 1 / (p.f0 ** 2 * p.L0), why: NO2PI(F0()) }, { tag: 'square', value: 1 / (PI2 * p.f0 * p.L0), why: SQUARE() }] },
      { key: 'f1', sym: '<i>f</i>₁', what: L('(b) the minimum with the phone', '(b) das Minimum mit dem Handy'), unit: 'Hz', value: v.f1, gap: 1.02, digits: 3, how: L('Read the minimum of the solid curve.', 'Lies das Minimum der ausgezogenen Kurve ab.'),
        mistakes: [{ tag: 'old', value: p.f0, why: L('That is the minimum of the dashed curve, without the phone.', 'Das ist das Minimum der gestrichelten Kurve, ohne Handy.') }, { tag: '2pi', value: PI2 * v.f1, why: OMEGA() }, { tag: 'other', value: v.f1 * 0.7, why: L('Read the minimum of the solid curve.', 'Lies das Minimum der ausgezogenen Kurve ab.') }] },
      { key: 'L1', sym: '<i>L</i>₁', what: L('(c) the inductance with the phone', '(c) die Induktivität mit dem Handy'), unit: 'H', value: v.L1, how: L('L₁ = 1/((2πf₁)²C).', 'L₁ = 1/((2πf₁)²C).'),
        mistakes: [{ tag: 'linear', value: (p.L0 * p.f0) / v.f1, why: L('L goes with 1/f²: (f₀/f₁)² times L, not f₀/f₁ times.', 'L geht mit 1/f²: das (f₀/f₁)²-fache von L, nicht das f₀/f₁-fache.') }, { tag: '2pi', value: 1 / (v.f1 ** 2 * v.C), why: NO2PI(L('L₁ = 1/((2πf₁)²C).', 'L₁ = 1/((2πf₁)²C).')) }, { tag: 'old', value: p.L0, why: L('That is the inductance without the phone; the minimum has moved.', 'Das ist die Induktivität ohne Handy; das Minimum hat sich verschoben.') }] },
    ],
    hints: () => [
      L('In series, coil and capacitor cancel at the resonance: Z has its minimum where 2πf₀ = 1/√(LC).', 'In Serie heben sich Spule und Kondensator bei der Resonanz auf: Z hat sein Minimum dort, wo 2πf₀ = 1/√(LC).'),
      F0(),
      L('The capacitor stays the same: L₁ = 1/((2πf₁)²C) with the new minimum f₁.', 'Der Kondensator bleibt derselbe: L₁ = 1/((2πf₁)²C) mit dem neuen Minimum f₁.'),
    ],
    steps: (p, v) => [
      step(L('The capacitance', 'Die Kapazität'), `$$${SQRT_LC} \\quad\\Rightarrow\\quad C = \\frac{1}{(2\\pi f_0)^2 L} = \\frac{1}{(2\\pi\\cdot ${T(p.f0, 'Hz')})^2\\cdot ${T(p.L0, 'H', 2)}} = ${T(v.C, 'F')}$$`),
      step(L('The new minimum', 'Das neue Minimum'), L(`With the phone, the minimum lies at $f_1 \\approx ${T(v.f1, 'Hz')}$.`, `Mit dem Handy liegt das Minimum bei $f_1 \\approx ${T(v.f1, 'Hz')}$.`)),
      step(L('The new inductance', 'Die neue Induktivität'), `$$L_1 = \\frac{1}{(2\\pi f_1)^2 C} = \\frac{1}{(2\\pi\\cdot ${T(v.f1, 'Hz')})^2\\cdot ${T(v.C, 'F')}} = ${T(v.L1, 'H')}$$` +
        `<p>${L(`At the old frequency, the impedance is now ${H(v.Zold, 'ohm', 2)} instead of ${H(v.Z0, 'ohm', 2)}: the current would drop to about a ${Math.max(2, Math.round(v.Zold / v.Z0))}th. That is why a charger searches for the new minimum and adjusts its frequency when a phone is placed on it.`,
          `Bei der alten Frequenz beträgt die Impedanz jetzt ${H(v.Zold, 'ohm', 2)} statt ${H(v.Z0, 'ohm', 2)}: Der Strom würde auf etwa einen ${Math.max(2, Math.round(v.Zold / v.Z0))}tel sinken. Deshalb sucht ein Ladegerät das neue Minimum und passt seine Frequenz an, wenn ein Handy darauf liegt.`)}</p>`),
    ],
    ann: (p, v) => [pt(p.f0, v.Z0, 'f₀'), pt(v.f1, v.Z1, 'f₁')],
    pic: () => root.ImpFigures.charger(),
  };

  // ---------------------------------------------------------------- a body-fat scale
  // Tissue: the water outside the cells (Re) in parallel with the cells, the water inside (Ri)
  // behind the membranes (C).
  const scale = {
    id: 'scale', difficulty: 3, title: () => L('A body-fat scale', 'Eine Körperfettwaage'),
    make: (r) => ({ Re: pick(r, [500, 550, 600, 650, 700]), Ri: pick(r, [300, 400, 500, 600]), C: pick(r, [2, 3, 4, 5]) * 1e-9 }),
    model(p) { const fn = (f) => abs(par([p.Re, 0], add([p.Ri, 0], cap(p.C, f)))); return { fn, ax: semiAx(100, 1e8, I.niceUp(1.1 * p.Re)) }; },
    solve(p) { const { fn } = scale.model(p), lo = fn(100), hi = fn(1e8); return { lo, hi, Ri: (lo * hi) / (lo - hi), Z50: fn(50e3) }; },
    text: () => L('A body-fat scale sends a tiny alternating current through the feet and legs (you don’t feel it). The water outside the cells conducts like a resistor <i>R</i><sub>e</sub>. The cells add a second path: the water inside them, a resistor <i>R</i><sub>i</sub>, behind their membranes, which act like a capacitor <i>C</i>. The graph shows the measured impedance against the frequency. (a) What is <i>R</i><sub>e</sub>? (b) What is <i>R</i><sub>i</sub>? (c) Most scales measure at 50 kHz: which impedance do they see?',
      'Eine Körperfettwaage schickt einen winzigen Wechselstrom durch Füsse und Beine (man spürt ihn nicht). Das Wasser ausserhalb der Zellen leitet wie ein Widerstand <i>R</i><sub>e</sub>. Die Zellen bieten einen zweiten Weg: das Wasser in ihnen, ein Widerstand <i>R</i><sub>i</sub>, hinter ihren Membranen, die wie ein Kondensator <i>C</i> wirken. Der Graph zeigt die gemessene Impedanz gegen die Frequenz. (a) Wie gross ist <i>R</i><sub>e</sub>? (b) Wie gross ist <i>R</i><sub>i</sub>? (c) Die meisten Waagen messen bei 50 kHz: Welche Impedanz sehen sie?'),
    fields: (p, v) => [
      { key: 'Re', sym: '<i>R</i><sub>e</sub>', what: L('(a) the resistance of the water outside the cells', '(a) der Widerstand des Wassers ausserhalb der Zellen'), unit: 'ohm', value: v.lo, how: L('At low frequencies the membranes block: only R<sub>e</sub> conducts.', 'Bei tiefen Frequenzen sperren die Membranen: Nur R<sub>e</sub> leitet.'),
        mistakes: [{ tag: 'high', value: v.hi, why: L('At high frequencies the membranes let the current through: that is R<sub>e</sub> and R<sub>i</sub> in parallel.', 'Bei hohen Frequenzen lassen die Membranen den Strom durch: Das sind R<sub>e</sub> und R<sub>i</sub> parallel.') }, { tag: 'mid', value: v.Z50, why: L('That is Z at 50 kHz, in the middle of the step. At low frequencies only R<sub>e</sub> conducts.', 'Das ist Z bei 50 kHz, mitten in der Stufe. Bei tiefen Frequenzen leitet nur R<sub>e</sub>.') }] },
      { key: 'Ri', sym: '<i>R</i><sub>i</sub>', what: L('(b) the resistance of the water inside the cells', '(b) der Widerstand des Wassers in den Zellen'), unit: 'ohm', value: v.Ri, how: L('At high frequencies, 1/Z = 1/R<sub>e</sub> + 1/R<sub>i</sub>.', 'Bei hohen Frequenzen ist 1/Z = 1/R<sub>e</sub> + 1/R<sub>i</sub>.'),
        mistakes: [{ tag: 'parallel', value: v.hi, why: L('That is R<sub>e</sub> and R<sub>i</sub> in parallel, what the curve shows at high frequencies. Solve 1/Z = 1/R<sub>e</sub> + 1/R<sub>i</sub> for R<sub>i</sub>.', 'Das sind R<sub>e</sub> und R<sub>i</sub> parallel, was die Kurve bei hohen Frequenzen zeigt. Löse 1/Z = 1/R<sub>e</sub> + 1/R<sub>i</sub> nach R<sub>i</sub> auf.') },
          { tag: 'diff', value: v.lo - v.hi, why: L('In parallel, resistances do not subtract: 1/Z = 1/R<sub>e</sub> + 1/R<sub>i</sub>.', 'Parallel subtrahieren sich Widerstände nicht: 1/Z = 1/R<sub>e</sub> + 1/R<sub>i</sub>.') }] },
      { key: 'Z50', sym: '<i>Z</i>', what: L('(c) the impedance at 50 kHz', '(c) die Impedanz bei 50 kHz'), unit: 'ohm', value: v.Z50, how: L('Read Z at 50 kHz.', 'Lies Z bei 50 kHz ab.'),
        mistakes: [{ tag: 'lo', value: v.lo, why: L('That is Z at low frequencies. Read Z at 50 kHz.', 'Das ist Z bei tiefen Frequenzen. Lies Z bei 50 kHz ab.') }, { tag: 'hi', value: v.hi, why: L('That is Z at high frequencies. Read Z at 50 kHz.', 'Das ist Z bei hohen Frequenzen. Lies Z bei 50 kHz ab.') }] },
    ],
    hints: () => [
      L('At low frequencies the membranes (the capacitor) block: the current only flows outside the cells, so Z = R<sub>e</sub>.', 'Bei tiefen Frequenzen sperren die Membranen (der Kondensator): Der Strom fliesst nur ausserhalb der Zellen, also Z = R<sub>e</sub>.'),
      L('At high frequencies the capacitor acts like a wire: R<sub>e</sub> and R<sub>i</sub> are in parallel, 1/Z = 1/R<sub>e</sub> + 1/R<sub>i</sub>, so R<sub>i</sub> = R<sub>e</sub>Z/(R<sub>e</sub> − Z).', 'Bei hohen Frequenzen wirkt der Kondensator wie ein Draht: R<sub>e</sub> und R<sub>i</sub> sind parallel, 1/Z = 1/R<sub>e</sub> + 1/R<sub>i</sub>, also R<sub>i</sub> = R<sub>e</sub>Z/(R<sub>e</sub> − Z).'),
    ],
    steps: (p, v) => [
      step(L('Low frequencies: R<sub>e</sub>', 'Tiefe Frequenzen: R<sub>e</sub>'), L(`The membranes block, the current only flows outside the cells: $R_e \\approx ${T(v.lo, 'ohm', 2)}$.`, `Die Membranen sperren, der Strom fliesst nur ausserhalb der Zellen: $R_e \\approx ${T(v.lo, 'ohm', 2)}$.`)),
      step(L('High frequencies: R<sub>i</sub>', 'Hohe Frequenzen: R<sub>i</sub>'), L(`The membranes let the current through: $R_e$ and $R_i$ are in parallel, $Z \\approx ${T(v.hi, 'ohm', 2)}$.`, `Die Membranen lassen den Strom durch: $R_e$ und $R_i$ sind parallel, $Z \\approx ${T(v.hi, 'ohm', 2)}$.`) +
        ` $$\\frac{1}{Z} = \\frac{1}{R_e} + \\frac{1}{R_i} \\quad\\Rightarrow\\quad R_i = \\frac{R_e Z}{R_e - Z} = \\frac{${T(v.lo, 'ohm')}\\cdot ${T(v.hi, 'ohm')}}{${T(v.lo, 'ohm')} - ${T(v.hi, 'ohm')}} = ${T(v.Ri, 'ohm')}$$`),
      step(L('At 50 kHz', 'Bei 50 kHz'), L(`$Z \\approx ${T(v.Z50, 'ohm', 2)}$: part of the current already passes through the cells.`, `$Z \\approx ${T(v.Z50, 'ohm', 2)}$: Ein Teil des Stroms fliesst schon durch die Zellen.`) +
        `<p>${L('Fat holds little water: the more fat, the fewer conducting paths and the larger the impedance. With height, weight and age, the scale estimates the body water, and from it the fat.', 'Fett enthält wenig Wasser: Je mehr Fett, desto weniger leitende Wege und desto grösser die Impedanz. Mit Grösse, Gewicht und Alter schätzt die Waage das Körperwasser und daraus das Fett.')}</p>`),
    ],
    ann: (p, v) => [pt(200, v.lo, 'R_e'), pt(5e7, v.hi, ''), pt(50e3, v.Z50, '50 kHz')],
    pic: () => root.ImpFigures.scale(),
  };

  // ---------------------------------------------------------------- a metal detector
  // The search coil in a parallel resonant circuit; a coin lowers its inductance.
  const detector = {
    id: 'detector', difficulty: 3, title: () => L('A metal detector', 'Ein Metalldetektor'),
    make: (r) => ({ L0: pick(r, [300, 350, 400, 470]) * 1e-6, C: pick(r, [10, 15, 22]) * 1e-9, R: pick(r, [20, 30, 40]) * 1e3, d: pick(r, [0.015, 0.02, 0.025, 0.03]) }),
    model(p) {
      const z = (Lh) => (f) => 1 / abs(add(add([1 / p.R, 0], inv(coil(Lh, f))), inv(cap(p.C, f)))), f0 = 1 / (PI2 * Math.sqrt(p.L0 * p.C));
      return { fn: z(p.L0 * (1 - p.d)), extra: [z(p.L0)], ax: linAx(0.96 * f0, 1.05 * f0, I.niceUp(1.1 * p.R)) };
    },
    solve(p) {
      const { fn, extra } = detector.model(p), f0 = 1 / (PI2 * Math.sqrt(p.L0 * p.C)), f1 = extremum(fn, 0.96 * f0, 1.05 * f0), L1 = 1 / ((PI2 * f1) ** 2 * p.C);
      return { f0, Z0: extra[0](f0), f1, Z1: fn(f1), L1, dL: p.L0 - L1 };
    },
    text: (p) => L(`The search coil of a metal detector (<i>L</i>₀ = ${H(p.L0, 'H', 2)} without metal) forms a parallel resonant circuit with a capacitor (<i>C</i> = ${H(p.C, 'F', 2)}). Eddy currents in a coin under the coil weaken its magnetic field: the inductance drops a little, and the resonance moves. The graph shows the impedance without the coin (dashed) and with the coin (solid). (a) Where is the resonance <i>f</i>₁ with the coin? (b) What is the inductance <i>L</i>₁ with the coin? (c) By how much did the coin lower the inductance?`,
      `Die Suchspule eines Metalldetektors (<i>L</i>₀ = ${H(p.L0, 'H', 2)} ohne Metall) bildet mit einem Kondensator (<i>C</i> = ${H(p.C, 'F', 2)}) einen Parallelschwingkreis. Wirbelströme in einer Münze unter der Spule schwächen ihr Magnetfeld: Die Induktivität sinkt ein wenig, und die Resonanz verschiebt sich. Der Graph zeigt die Impedanz ohne Münze (gestrichelt) und mit Münze (ausgezogen). (a) Wo liegt die Resonanz <i>f</i>₁ mit der Münze? (b) Wie gross ist die Induktivität <i>L</i>₁ mit der Münze? (c) Um wie viel hat die Münze die Induktivität gesenkt?`),
    fields: (p, v) => [
      { key: 'f1', sym: '<i>f</i>₁', what: L('(a) the resonance with the coin', '(a) die Resonanz mit der Münze'), unit: 'Hz', value: v.f1, gap: 1.005, digits: 3, how: L('Read the peak of the solid curve.', 'Lies die Spitze der ausgezogenen Kurve ab.'),
        mistakes: [{ tag: 'old', value: v.f0, why: L('That is the peak of the dashed curve, without the coin.', 'Das ist die Spitze der gestrichelten Kurve, ohne Münze.') }, { tag: '2pi', value: PI2 * v.f1, why: OMEGA() }, { tag: '2pi', value: v.f1 / PI2, why: W2PI() }] },
      { key: 'L1', sym: '<i>L</i>₁', what: L('(b) the inductance with the coin', '(b) die Induktivität mit der Münze'), unit: 'H', value: v.L1, how: L('L₁ = 1/((2πf₁)²C).', 'L₁ = 1/((2πf₁)²C).'),
        mistakes: [{ tag: '2pi', value: 1 / (v.f1 ** 2 * p.C), why: NO2PI(L('L₁ = 1/((2πf₁)²C).', 'L₁ = 1/((2πf₁)²C).')) }, { tag: 'square', value: 1 / (PI2 * v.f1 * p.C), why: SQUARE() }] },
      { key: 'dL', sym: 'Δ<i>L</i>', what: L('(c) how much the coin lowered the inductance', '(c) um wie viel die Münze die Induktivität gesenkt hat'), unit: 'H', value: v.dL, how: L('ΔL = L₀ − L₁.', 'ΔL = L₀ − L₁.'),
        mistakes: [{ tag: 'linear', value: p.L0 * (1 - v.f0 / v.f1), why: L('L goes with 1/f²: a change of f by 1 % changes L by about 2 %. Work out L₁, then ΔL = L₀ − L₁.', 'L geht mit 1/f²: Eine Änderung von f um 1 % ändert L um etwa 2 %. Berechne L₁, dann ΔL = L₀ − L₁.') }, { tag: 'other', value: v.dL * 3, why: L('ΔL = L₀ − L₁, with L₁ = 1/((2πf₁)²C).', 'ΔL = L₀ − L₁, mit L₁ = 1/((2πf₁)²C).') }] },
    ],
    hints: () => [
      L('The impedance of a parallel resonant circuit has its peak at 2πf = 1/√(LC).', 'Die Impedanz eines Parallelschwingkreises hat ihre Spitze bei 2πf = 1/√(LC).'),
      L('The capacitor stays the same: L₁ = 1/((2πf₁)²C).', 'Der Kondensator bleibt derselbe: L₁ = 1/((2πf₁)²C).'),
      L('ΔL = L₀ − L₁. Read f₁ as precisely as you can: a small error in f changes L twice as much.', 'ΔL = L₀ − L₁. Lies f₁ so genau wie möglich ab: Ein kleiner Fehler in f ändert L doppelt so stark.'),
    ],
    steps: (p, v) => [
      step(L('The peak with the coin', 'Die Spitze mit der Münze'), L(`Without the coin the peak lies at ${H(v.f0, 'Hz', 4)}, with the coin at $f_1 \\approx ${T(v.f1, 'Hz', 4)}$: the coin raises the frequency.`, `Ohne Münze liegt die Spitze bei ${H(v.f0, 'Hz', 4)}, mit Münze bei $f_1 \\approx ${T(v.f1, 'Hz', 4)}$: Die Münze erhöht die Frequenz.`)),
      step(L('The inductance', 'Die Induktivität'), `$$L_1 = \\frac{1}{(2\\pi f_1)^2 C} = \\frac{1}{(2\\pi\\cdot ${T(v.f1, 'Hz', 4)})^2\\cdot ${T(p.C, 'F', 2)}} = ${T(v.L1, 'H', 4)}$$`),
      step(L('The change', 'Die Änderung'), `$$\\Delta L = L_0 - L_1 = ${T(p.L0, 'H', 3)} - ${T(v.L1, 'H', 4)} = ${T(v.dL, 'H', 2)}$$` +
        `<p>${L('A change of a few percent is enough: the detector compares the frequency with a reference and beeps. Iron does the opposite: it raises L, and the frequency drops — so a detector can tell iron from coins.', 'Eine Änderung von wenigen Prozent genügt: Der Detektor vergleicht die Frequenz mit einer Referenz und piepst. Eisen bewirkt das Gegenteil: Es erhöht L, und die Frequenz sinkt — so unterscheidet ein Detektor Eisen von Münzen.')}</p>`),
    ],
    ann: (p, v) => [pt(v.f0, v.Z0, 'f₀'), pt(v.f1, v.Z1, 'f₁')],
    pic: () => root.ImpFigures.detector(),
  };

  // ---------------------------------------------------------------- a speaker crossover
  // A tweeter (a resistor R) behind a capacitor in series: a high-pass.
  const crossover = {
    id: 'crossover', difficulty: 2, title: () => L('A tweeter and its capacitor', 'Ein Hochtöner und sein Kondensator'),
    // the capacitor (a value of the E6 series) for a crossover at 1.5 to 2.5 kHz; the new one at 3 to 5 kHz
    make(r) {
      const R = pick(r, [4, 6, 8]), fc = pick(r, [1500, 2000, 2500]), c = 1 / (PI2 * fc * R), e = 10 ** Math.floor(Math.log10(c));
      const C = [1, 1.5, 2.2, 3.3, 4.7, 6.8, 10].map((m) => m * e).reduce((a, b) => (Math.abs(Math.log(b / c)) < Math.abs(Math.log(a / c)) ? b : a));
      return { R, C, fx: pick(r, [3000, 3500, 4000, 5000]) };
    },
    model(p) { const fn = (f) => abs(add([p.R, 0], cap(p.C, f))); return { fn, ax: linAx(0, 20000, I.niceUp(5 * p.R)) }; },
    solve(p) { const { fn } = crossover.model(p), R = p.R, fc = where(fn, Math.SQRT2 * R, 100, 20000); return { R, fc, f2R: where(fn, 2 * R, 50, 20000), Cx: 1 / (PI2 * p.fx * R) }; },
    text: (p) => L(`A tweeter can only handle high notes: low notes, with their large amplitudes, would destroy it. A capacitor in series keeps them away. The tweeter acts like a resistor <i>R</i>; below the crossover frequency <i>f</i><sub>c</sub>, where the reactance of the capacitor equals <i>R</i>, the capacitor blocks. The graph shows the impedance of tweeter and capacitor (measured). (a) What is <i>R</i>? (b) What is the crossover frequency? (c) The woofer plays the notes up to ${H(p.fx, 'Hz', 2)}: which capacitor puts the crossover there?`,
      `Ein Hochtöner verträgt nur hohe Töne: Tiefe Töne mit ihren grossen Amplituden würden ihn zerstören. Ein Kondensator in Serie hält sie fern. Der Hochtöner wirkt wie ein Widerstand <i>R</i>; unterhalb der Trennfrequenz <i>f</i><sub>c</sub>, wo der Blindwiderstand des Kondensators gleich <i>R</i> ist, sperrt der Kondensator. Der Graph zeigt die Impedanz von Hochtöner und Kondensator (gemessen). (a) Wie gross ist <i>R</i>? (b) Wie gross ist die Trennfrequenz? (c) Der Tieftöner spielt die Töne bis ${H(p.fx, 'Hz', 2)}: Welcher Kondensator legt die Trennfrequenz dorthin?`),
    fields: (p, v) => [
      { key: 'R', sym: '<i>R</i>', what: L('(a) the resistance of the tweeter', '(a) der Widerstand des Hochtöners'), unit: 'ohm', value: v.R, how: L('At high frequencies the capacitor acts like a wire: Z → R.', 'Bei hohen Frequenzen wirkt der Kondensator wie ein Draht: Z → R.'),
        mistakes: [{ tag: 'corner', value: Math.SQRT2 * v.R, why: L('That is Z at the crossover, √2·R. For high frequencies the capacitor acts like a wire: Z → R.', 'Das ist Z bei der Trennfrequenz, √2·R. Für hohe Frequenzen wirkt der Kondensator wie ein Draht: Z → R.') }, { tag: 'other', value: 2 * v.R, why: L('For high frequencies the capacitor acts like a wire: Z → R.', 'Für hohe Frequenzen wirkt der Kondensator wie ein Draht: Z → R.') }] },
      { key: 'fc', sym: '<i>f</i><sub>c</sub>', what: L('(b) the crossover frequency', '(b) die Trennfrequenz'), unit: 'Hz', value: v.fc, how: L('Where the reactance equals R, Z = √(R² + R²) = √2·R.', 'Wo der Blindwiderstand gleich R ist, ist Z = √(R² + R²) = √2·R.'),
        mistakes: [{ tag: 'double', value: v.f2R, why: L('There Z = 2R. Where the reactance equals R, Z = √2·R: resistance and reactance add like the sides of a right triangle.', 'Dort ist Z = 2R. Wo der Blindwiderstand gleich R ist, ist Z = √2·R: Widerstand und Blindwiderstand addieren sich wie die Seiten eines rechtwinkligen Dreiecks.') }, { tag: '2pi', value: PI2 * v.fc, why: OMEGA() }] },
      { key: 'Cx', sym: '<i>C</i>', what: L(`(c) the capacitor for a crossover at ${H(p.fx, 'Hz', 2)}`, `(c) der Kondensator für eine Trennfrequenz von ${H(p.fx, 'Hz', 2)}`), unit: 'F', value: v.Cx, how: L('1/(2πf<sub>c</sub>C) = R, so C = 1/(2πf<sub>c</sub>R).', '1/(2πf<sub>c</sub>C) = R, also C = 1/(2πf<sub>c</sub>R).'),
        mistakes: [{ tag: '2pi', value: 1 / (p.fx * v.R), why: NO2PI(L('the reactance of a capacitor is 1/(2πfC).', 'Der Blindwiderstand eines Kondensators ist 1/(2πfC).')) }, { tag: 'corner', value: 1 / (PI2 * p.fx * Math.SQRT2 * v.R), why: L('At the crossover the reactance equals R, not √2·R.', 'Bei der Trennfrequenz ist der Blindwiderstand gleich R, nicht √2·R.') }, { tag: '2pi', value: PI2 / (p.fx * v.R), why: L('The reactance of a capacitor is 1/(2πfC), so C = 1/(2πf<sub>c</sub>R).', 'Der Blindwiderstand eines Kondensators ist 1/(2πfC), also C = 1/(2πf<sub>c</sub>R).') }] },
    ],
    hints: () => [
      L('For high frequencies the capacitor acts like a wire: Z levels off at R.', 'Für hohe Frequenzen wirkt der Kondensator wie ein Draht: Z nähert sich R.'),
      L('At the crossover the reactance 1/(2πfC) equals R: Z = √(R² + R²) = √2·R.', 'Bei der Trennfrequenz ist der Blindwiderstand 1/(2πfC) gleich R: Z = √(R² + R²) = √2·R.'),
      L('C = 1/(2πf<sub>c</sub>R).', 'C = 1/(2πf<sub>c</sub>R).'),
    ],
    steps: (p, v) => [
      step(L('The level: R', 'Das Niveau: R'), L(`For high frequencies the capacitor acts like a wire: $Z \\to R \\approx ${T(v.R, 'ohm', 2)}$.`, `Für hohe Frequenzen wirkt der Kondensator wie ein Draht: $Z \\to R \\approx ${T(v.R, 'ohm', 2)}$.`)),
      step(L('The crossover', 'Die Trennfrequenz'), L(`Where the reactance equals $R$, $Z = \\sqrt{2}\\,R = ${T(Math.SQRT2 * v.R, 'ohm')}$: at $f_c \\approx ${T(v.fc, 'Hz', 2)}$.`, `Wo der Blindwiderstand gleich $R$ ist, ist $Z = \\sqrt{2}\\,R = ${T(Math.SQRT2 * v.R, 'ohm')}$: bei $f_c \\approx ${T(v.fc, 'Hz', 2)}$.`)),
      step(L('The new capacitor', 'Der neue Kondensator'), `$$\\frac{1}{2\\pi f_c C} = R \\quad\\Rightarrow\\quad C = \\frac{1}{2\\pi f_c R} = \\frac{1}{2\\pi\\cdot ${T(p.fx, 'Hz', 2)}\\cdot ${T(v.R, 'ohm', 2)}} = ${T(v.Cx, 'F')}$$`),
    ],
    ann: (p, v) => [hl(v.R, 'R'), pt(v.fc, Math.SQRT2 * v.R, 'f_c')],
    pic: () => root.ImpFigures.crossover(),
  };

  // ---------------------------------------------------------------- a contactless card
  // The card's coil and capacitor tuned to 13.56 MHz, the chip as the resistor in parallel.
  const NFC = 13.56e6;
  const nfc = {
    id: 'nfc', difficulty: 4, title: () => L('A contactless card', 'Eine kontaktlose Karte'),
    make: (r) => ({ L: pick(r, [1, 1.5, 2, 2.5, 3]) * 1e-6, R: pick(r, [1.5, 2, 3, 4]) * 1e3 }),
    model(p) {
      const C = 1 / ((PI2 * NFC) ** 2 * p.L), fn = (f) => 1 / abs(add(add([1 / p.R, 0], inv(coil(p.L, f))), inv(cap(C, f))));
      return { fn, ax: linAx(10e6, 17e6, I.niceUp(1.1 * p.R)) };
    },
    solve(p) {
      const { fn } = nfc.model(p), f0 = extremum(fn, 10e6, 17e6), Zm = fn(f0), z = Zm / Math.SQRT2, zh = Zm / 2;
      const lo = where(fn, z, 10e6, f0), hi = where(fn, z, f0, 17e6), dfh = where(fn, zh, f0, 17e6) - where(fn, zh, 10e6, f0);
      return { C: 1 / ((PI2 * NFC) ** 2 * p.L), f0, Zm, lo, hi, df: hi - lo, dfh, Q: NFC / (hi - lo) };
    },
    text: (p) => L(`A contactless bank card has no battery: a flat coil in the card (<i>L</i> = ${H(p.L, 'H', 2)}) picks up the field of the reader, at 13.56 MHz. With a capacitor, the coil forms a parallel resonant circuit tuned to that frequency; the chip acts as the resistor. The graph shows the impedance of the circuit (measured). (a) Which capacitance <i>C</i> is built into the card? (b) Read the bandwidth Δ<i>f</i>, the width of the peak where <i>Z</i> = <i>Z</i><sub>max</sub>/√2. (c) What is the quality factor <i>Q</i> = <i>f</i>₀/Δ<i>f</i>?`,
      `Eine kontaktlose Bankkarte hat keine Batterie: Eine flache Spule in der Karte (<i>L</i> = ${H(p.L, 'H', 2)}) nimmt das Feld des Lesegeräts auf, bei 13.56 MHz. Mit einem Kondensator bildet die Spule einen Parallelschwingkreis, der auf diese Frequenz abgestimmt ist; der Chip wirkt als Widerstand. Der Graph zeigt die Impedanz des Kreises (gemessen). (a) Welche Kapazität <i>C</i> ist in die Karte eingebaut? (b) Lies die Bandbreite Δ<i>f</i> ab, die Breite der Spitze dort, wo <i>Z</i> = <i>Z</i><sub>max</sub>/√2. (c) Wie gross ist die Güte <i>Q</i> = <i>f</i>₀/Δ<i>f</i>?`),
    fields: (p, v) => [
      { key: 'C', sym: '<i>C</i>', what: L('(a) the capacitance in the card', '(a) die Kapazität in der Karte'), unit: 'F', value: v.C, how: F0(),
        mistakes: [{ tag: '2pi', value: 1 / (NFC ** 2 * p.L), why: NO2PI(F0()) }, { tag: 'square', value: 1 / (PI2 * NFC * p.L), why: SQUARE() }, { tag: 'prefix', value: v.C * 1000, why: L('Off by a factor 1000: check the unit prefixes (1 nF = 1000 pF).', 'Um den Faktor 1000 daneben: Prüfe die Vorsilben (1 nF = 1000 pF).') }] },
      { key: 'df', sym: 'Δ<i>f</i>', what: L('(b) the bandwidth', '(b) die Bandbreite'), unit: 'Hz', value: v.df, how: L('Find the two frequencies where Z = Z<sub>max</sub>/√2; Δf is their difference.', 'Suche die zwei Frequenzen, bei denen Z = Z<sub>max</sub>/√2; Δf ist ihre Differenz.'),
        mistakes: [{ tag: 'half', value: v.dfh, why: L('That is the width at half the height. The bandwidth is the width at Z<sub>max</sub>/√2.', 'Das ist die Breite auf halber Höhe. Die Bandbreite ist die Breite bei Z<sub>max</sub>/√2.') }, { tag: '2pi', value: PI2 * v.df, why: OMEGA() }, { tag: 'side', value: v.df / 2, why: L('That is only half of the width: from the peak to one side.', 'Das ist nur die halbe Breite: von der Spitze zu einer Seite.') }] },
      { key: 'Q', sym: '<i>Q</i>', what: L('(c) the quality factor', '(c) die Güte'), unit: null, value: v.Q, how: L('Q = f₀/Δf, with f₀ = 13.56 MHz.', 'Q = f₀/Δf, mit f₀ = 13.56 MHz.'),
        mistakes: [{ tag: '2pi', value: (PI2 * NFC) / v.df, why: L('Both in Hz: Q = f₀/Δf, without 2π.', 'Beide in Hz: Q = f₀/Δf, ohne 2π.') }, { tag: 'half', value: NFC / v.dfh, why: L('That uses the width at half the height. The bandwidth is the width at Z<sub>max</sub>/√2.', 'Das verwendet die Breite auf halber Höhe. Die Bandbreite ist die Breite bei Z<sub>max</sub>/√2.') }] },
    ],
    hints: () => [
      F0(),
      L('Z<sub>max</sub> is the height of the peak. Pin the two points on either side of the peak where Z = Z<sub>max</sub>/√2 ≈ 0.71·Z<sub>max</sub>.', 'Z<sub>max</sub> ist die Höhe der Spitze. Halte die zwei Punkte links und rechts der Spitze fest, bei denen Z = Z<sub>max</sub>/√2 ≈ 0.71·Z<sub>max</sub>.'),
      L('Q = f₀/Δf: the larger Q, the narrower the peak.', 'Q = f₀/Δf: Je grösser Q, desto schmaler die Spitze.'),
    ],
    steps: (p, v) => [
      step(L('The capacitance', 'Die Kapazität'), `$$${SQRT_LC} \\quad\\Rightarrow\\quad C = \\frac{1}{(2\\pi f_0)^2 L} = \\frac{1}{(2\\pi\\cdot 13.56\\,\\mathrm{MHz})^2\\cdot ${T(p.L, 'H', 2)}} = ${T(v.C, 'F')}$$`),
      step(L('The bandwidth', 'Die Bandbreite'), L(`The peak is $Z_{\\max} = ${T(v.Zm, 'ohm')}$; $Z = Z_{\\max}/\\sqrt{2} = ${T(v.Zm / Math.SQRT2, 'ohm')}$ at ${H(v.lo, 'Hz', 4)} and ${H(v.hi, 'Hz', 4)}: $\\Delta f \\approx ${T(v.df, 'Hz', 2)}$.`,
        `Die Spitze ist $Z_{\\max} = ${T(v.Zm, 'ohm')}$; $Z = Z_{\\max}/\\sqrt{2} = ${T(v.Zm / Math.SQRT2, 'ohm')}$ bei ${H(v.lo, 'Hz', 4)} und ${H(v.hi, 'Hz', 4)}: $\\Delta f \\approx ${T(v.df, 'Hz', 2)}$.`)),
      step(L('The quality factor', 'Die Güte'), `$$Q = \\frac{f_0}{\\Delta f} = \\frac{13.56\\,\\mathrm{MHz}}{${T(v.df, 'Hz')}} = ${I.digits(v.Q, 2)}$$` +
        `<p>${L('The reader sends data by switching its field on and off quickly; the card answers the same way. A large Q gives a strong signal but lets fast changes through badly: Q is a compromise, typically 10 to 30.', 'Das Lesegerät sendet Daten, indem es sein Feld schnell ein- und ausschaltet; die Karte antwortet ebenso. Eine grosse Güte gibt ein starkes Signal, lässt aber schnelle Änderungen schlecht durch: Q ist ein Kompromiss, typisch 10 bis 30.')}</p>`),
    ],
    ann: (p, v) => [pt(v.f0, v.Zm, 'Z_max'), hl(v.Zm / Math.SQRT2, 'Z_max/√2'), vl(v.lo, ''), vl(v.hi, '')],
    pic: () => root.ImpFigures.nfc(),
  };

  // ---------------------------------------------------------------- a quartz crystal
  // L1, C1, R1 in series (the vibration) in parallel with C0 (the electrodes): the series resonance
  // fs (minimum) and the parallel resonance fp (maximum), close together.
  const quartz = {
    id: 'quartz', difficulty: 5, title: () => L('A quartz crystal', 'Ein Schwingquarz'),
    make: (r) => ({ fs: pick(r, [4, 8, 10]) * 1e6, C1: pick(r, [10, 15, 20]) * 1e-15, C0: pick(r, [3, 4, 5]) * 1e-12, R1: pick(r, [20, 30, 40]) }),
    model(p) {
      const L1 = 1 / ((PI2 * p.fs) ** 2 * p.C1), fn = (f) => abs(par(add(add([p.R1, 0], coil(L1, f)), cap(p.C1, f)), cap(p.C0, f)));
      const d = (p.fs * p.C1) / (2 * p.C0), lo = p.fs - 1.5 * d, hi = p.fs + 2.5 * d;
      return { fn, ax: ylogAx(lo, hi, decadeDown(0.5 * p.R1), decadeUp(2 * maxOn(fn, lo, hi))) };
    },
    solve(p) {
      const { fn } = quartz.model(p), d = (p.fs * p.C1) / (2 * p.C0), fs = extremum(fn, p.fs - 1.5 * d, p.fs + d, -1), fp = extremum(fn, p.fs + 0.2 * d, p.fs + 2.5 * d);
      const df = fp - fs, C1 = (2 * p.C0 * df) / fs;
      return { fsr: fs, fp, df, C1, L1: 1 / ((PI2 * fs) ** 2 * C1), Zs: fn(fs), Zp: fn(fp) };
    },
    text: (p) => L(`The clock of a computer or a watch counts the oscillations of a quartz crystal. The crystal behaves like a series circuit of <i>L</i>₁, <i>C</i>₁ and <i>R</i>₁, from its elastic vibration, in parallel with the capacitance <i>C</i>₀ = ${H(p.C0, 'F', 2)} of its electrodes. The graph shows its impedance near <i>f</i><sub>s</sub> = ${H(p.fs, 'Hz', 2)} (measured). (a) Read <i>f</i><sub>p</sub> − <i>f</i><sub>s</sub>, the distance between the minimum (the series resonance) and the maximum (the parallel resonance). (b) With <i>f</i><sub>p</sub> − <i>f</i><sub>s</sub> ≈ <i>f</i><sub>s</sub>·<i>C</i>₁/(2<i>C</i>₀): what is <i>C</i>₁? (c) What is <i>L</i>₁?`,
      `Die Uhr eines Computers oder einer Armbanduhr zählt die Schwingungen eines Schwingquarzes. Der Quarz verhält sich wie eine Serienschaltung aus <i>L</i>₁, <i>C</i>₁ und <i>R</i>₁, von seiner elastischen Schwingung, parallel zur Kapazität <i>C</i>₀ = ${H(p.C0, 'F', 2)} seiner Elektroden. Der Graph zeigt seine Impedanz nahe <i>f</i><sub>s</sub> = ${H(p.fs, 'Hz', 2)} (gemessen). (a) Lies <i>f</i><sub>p</sub> − <i>f</i><sub>s</sub> ab, den Abstand zwischen dem Minimum (der Serienresonanz) und dem Maximum (der Parallelresonanz). (b) Mit <i>f</i><sub>p</sub> − <i>f</i><sub>s</sub> ≈ <i>f</i><sub>s</sub>·<i>C</i>₁/(2<i>C</i>₀): Wie gross ist <i>C</i>₁? (c) Wie gross ist <i>L</i>₁?`),
    fields: (p, v) => [
      { key: 'df', sym: '<i>f</i><sub>p</sub> − <i>f</i><sub>s</sub>', what: L('(a) the distance between minimum and maximum', '(a) der Abstand zwischen Minimum und Maximum'), unit: 'Hz', value: v.df, how: L('Read the frequencies of the minimum and of the maximum.', 'Lies die Frequenzen des Minimums und des Maximums ab.'),
        mistakes: [{ tag: '2pi', value: PI2 * v.df, why: OMEGA() }, { tag: 'half', value: v.df / 2, why: L('Read the frequencies of the minimum and the maximum themselves.', 'Lies die Frequenzen des Minimums und des Maximums selbst ab.') }, { tag: 'other', value: v.df * 3, why: L('Read the frequencies of the minimum and the maximum themselves.', 'Lies die Frequenzen des Minimums und des Maximums selbst ab.') }] },
      { key: 'C1', sym: '<i>C</i>₁', what: L('(b) the capacitance of the vibration', '(b) die Kapazität der Schwingung'), unit: 'F', value: v.C1, how: L('C₁ = 2C₀(f<sub>p</sub> − f<sub>s</sub>)/f<sub>s</sub>.', 'C₁ = 2C₀(f<sub>p</sub> − f<sub>s</sub>)/f<sub>s</sub>.'),
        mistakes: [{ tag: 'two', value: (p.C0 * v.df) / v.fsr, why: L('The 2 is missing: C₁ = 2C₀(f<sub>p</sub> − f<sub>s</sub>)/f<sub>s</sub>.', 'Die 2 fehlt: C₁ = 2C₀(f<sub>p</sub> − f<sub>s</sub>)/f<sub>s</sub>.') }, { tag: 'prefix', value: v.C1 * 1000, why: L('Off by a factor 1000: check the unit prefixes (1 pF = 1000 fF).', 'Um den Faktor 1000 daneben: Prüfe die Vorsilben (1 pF = 1000 fF).') }, { tag: 'half', value: (p.C0 * v.df) / (2 * v.fsr), why: L('Solve f<sub>p</sub> − f<sub>s</sub> = f<sub>s</sub>·C₁/(2C₀) for C₁: C₁ = 2C₀(f<sub>p</sub> − f<sub>s</sub>)/f<sub>s</sub>.', 'Löse f<sub>p</sub> − f<sub>s</sub> = f<sub>s</sub>·C₁/(2C₀) nach C₁ auf: C₁ = 2C₀(f<sub>p</sub> − f<sub>s</sub>)/f<sub>s</sub>.') }] },
      { key: 'L1', sym: '<i>L</i>₁', what: L('(c) the inductance of the vibration', '(c) die Induktivität der Schwingung'), unit: 'H', value: v.L1, how: L('2πf<sub>s</sub> = 1/√(L₁C₁).', '2πf<sub>s</sub> = 1/√(L₁C₁).'),
        mistakes: [{ tag: '2pi', value: 1 / (v.fsr ** 2 * v.C1), why: NO2PI(L('L₁ = 1/((2πf<sub>s</sub>)²C₁).', 'L₁ = 1/((2πf<sub>s</sub>)²C₁).')) }, { tag: 'two', value: 2 * v.L1, why: L('That uses C₁ without the 2: C₁ = 2C₀(f<sub>p</sub> − f<sub>s</sub>)/f<sub>s</sub>.', 'Das verwendet C₁ ohne die 2: C₁ = 2C₀(f<sub>p</sub> − f<sub>s</sub>)/f<sub>s</sub>.') }] },
    ],
    hints: () => [
      L('The minimum is the series resonance f<sub>s</sub> of L₁ and C₁; the maximum, a little higher, the parallel resonance f<sub>p</sub>, where C₀ joins in.', 'Das Minimum ist die Serienresonanz f<sub>s</sub> von L₁ und C₁; das Maximum, etwas höher, die Parallelresonanz f<sub>p</sub>, wo C₀ mitspielt.'),
      L('C₁ = 2C₀(f<sub>p</sub> − f<sub>s</sub>)/f<sub>s</sub>.', 'C₁ = 2C₀(f<sub>p</sub> − f<sub>s</sub>)/f<sub>s</sub>.'),
      L('L₁ = 1/((2πf<sub>s</sub>)²C₁).', 'L₁ = 1/((2πf<sub>s</sub>)²C₁).'),
    ],
    steps: (p, v) => [
      step(L('Minimum and maximum', 'Minimum und Maximum'), L(`The minimum lies at $f_s \\approx ${T(v.fsr, 'Hz', 6)}$, the maximum at $f_p \\approx ${T(v.fp, 'Hz', 6)}$: $f_p - f_s \\approx ${T(v.df, 'Hz', 2)}$.`, `Das Minimum liegt bei $f_s \\approx ${T(v.fsr, 'Hz', 6)}$, das Maximum bei $f_p \\approx ${T(v.fp, 'Hz', 6)}$: $f_p - f_s \\approx ${T(v.df, 'Hz', 2)}$.`)),
      step(L('The capacitance C₁', 'Die Kapazität C₁'), `$$C_1 = \\frac{2C_0\\,(f_p - f_s)}{f_s} = \\frac{2\\cdot ${T(p.C0, 'F', 2)}\\cdot ${T(v.df, 'Hz')}}{${T(v.fsr, 'Hz')}} = ${T(v.C1, 'F')}$$`),
      step(L('The inductance L₁', 'Die Induktivität L₁'), `$$L_1 = \\frac{1}{(2\\pi f_s)^2 C_1} = \\frac{1}{(2\\pi\\cdot ${T(v.fsr, 'Hz')})^2\\cdot ${T(v.C1, 'F')}} = ${T(v.L1, 'H')}$$` +
        `<p>${L('A tenth of a henry and a few femtofarads: no coil and capacitor could be built like that. Because the vibration loses so little energy, the resonance is extremely sharp — and the clock precise to a few seconds a month.', 'Ein Zehntel Henry und einige Femtofarad: So könnte man keine Spule und keinen Kondensator bauen. Weil die Schwingung so wenig Energie verliert, ist die Resonanz extrem scharf — und die Uhr auf wenige Sekunden pro Monat genau.')}</p>`),
    ],
    ann: (p, v) => [pt(v.fsr, v.Zs, 'f_s'), pt(v.fp, v.Zp, 'f_p')],
    pic: () => root.ImpFigures.quartz(),
  };

  const PROBLEMS = [crossover, guitar, radio, scale, detector, charger, speaker, nfc, quartz];

  // ---------------------------------------------------------------- exercises
  // The options of a field: the right value and wrong ones from the mistakes, all apart by the
  // factor GAP (generator.js), two significant digits (Q without a unit). A frequency read off
  // precisely with the probe may have closer options (f.gap) with more digits (f.digits), so that
  // the reading of the other curve can be one of them.
  function choices(f) {
    const opts = [{ value: f.value, ok: true, tag: 'ok' }], n = f.digits || 2, gap = f.gap || I.GAP;
    const apart = (x) => opts.every((o) => Math.abs(Math.log(x / o.value)) >= Math.log(gap) * (1 - 1e-9));
    const extra = [2, 0.5, 3, 1 / 3, 5, 0.2].map((k) => ({ tag: 'other', value: f.value * k, why: `${L('Not correct.', 'Nicht richtig.')} ${f.how}` }));
    for (const m of [...f.mistakes, ...extra]) {
      if (opts.length === I.OPTIONS) break;
      const x = Number(m.value.toPrecision(n));
      if (Number.isFinite(x) && x > 0 && apart(x)) opts.push({ value: x, ok: false, tag: m.tag, why: m.why });
    }
    return opts.sort((a, b) => a.value - b.value).map((o) => ({ ...o, label: f.unit ? I.H(o.value, f.unit, n) : I.digits(o.value, n) }));
  }

  function realOf(i, seed) {
    const pb = PROBLEMS[i], r = I.rng(seed), p = pb.make(r), v = pb.solve(p), m = pb.model(p);
    const fields = pb.fields(p, v).map((f) => ({ key: f.key, sym: f.sym, what: f.what, options: choices(f) }));
    return {
      problem: pb.id, difficulty: pb.difficulty, title: pb.title(), text: `<p>${pb.text(p, v)}</p>`,
      c: { fn: m.fn }, ax: m.ax, extra: (m.extra || []).map((fn) => ({ fn })), fields,
      hints: pb.hints(p, v), steps: pb.steps(p, v), ann: pb.ann(p, v),
      results: fields.map((f) => `${f.sym} = ${f.options.find((o) => o.ok).label}`).join(', '),
      pic: pb.pic, p, v,
    };
  }

  root.ImpProblems = { PROBLEMS, realOf, choices };
  if (typeof module !== 'undefined') module.exports = root.ImpProblems;
})(typeof window !== 'undefined' ? window : globalThis);
