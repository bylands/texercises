// Problems: oscillations in everyday life, technology and nature, told as stories and solved with
// the ideas of this app: v̂ = A·ω and â = A·ω² (a tuning fork, a skyscraper, atoms), a graph read
// off (an earthquake), â = g (salt on a loudspeaker), the cosine and its phase (the tide), the
// energy (a baby bouncer), and a periodic motion that is not harmonic (a bouncing ball). Each has
// random values from a list and a picture (figures.js):
//   { id, difficulty, title(), make(r), solve(p), fields(p), text(p), hints(p), steps(p, v), pic(p), fig(p, v) }
// realOf(i, seed) gives an exercise as the practice ones (generator.js).
(function (root) {
  'use strict';

  const OC = root.OC, { L, rng, pick, num, tnum, q, tq, sig, speedUnit } = OC;
  const Plot = root.Plot;
  const PI2 = 2 * Math.PI, G = 9.81;
  const res = (x) => `\\htmlClass{result}{${x}}`;
  const step = (rule, html) => `<p class="step-rule">${rule}</p>${html}`;
  const p$ = (s) => `<p>${s}</p>`;
  const num$ = (key, sym, unit, what, sci = false) => ({ key, type: 'num', sym, unit, what, sci });
  const w$ = (f) => `\\omega = 2\\pi f = 2\\pi\\cdot ${tq(f, 'Hz')} = ${tnum(PI2 * f)}\\,\\mathrm{s^{-1}}`;
  const wT$ = (T) => `\\omega = \\frac{2\\pi}{T} = \\frac{2\\pi}{${tq(T, 's')}} = ${tnum(PI2 / T)}\\,\\mathrm{s^{-1}}`;
  const vmax$ = (Am, w, u) => `\\hat v = A\\,\\omega = ${tq(Am, 'm')}\\cdot ${tnum(w)}\\,\\mathrm{s^{-1}} = ${res(tq(Am * w, u))}`;
  const amax$ = (Am, w) => `\\hat a = A\\,\\omega^2 = ${tq(Am, 'm')}\\cdot (${tnum(w)}\\,\\mathrm{s^{-1}})^2 = ${res(tq(Am * w * w, 'm/s²'))}`;
  const HINT_MAX = () => L('From $y = A\\cos(\\omega t)$: $\\hat v = A\\,\\omega$ and $\\hat a = A\\,\\omega^2$, with $\\omega = 2\\pi f = 2\\pi/T$.', 'Aus $y = A\\cos(\\omega t)$: $\\hat v = A\\,\\omega$ und $\\hat a = A\\,\\omega^2$, mit $\\omega = 2\\pi f = 2\\pi/T$.');
  const HINT_SI = () => L('Lengths in metres, times in seconds.', 'Längen in Metern, Zeiten in Sekunden.');
  // the displacement against time, two periods, with the times of the solution marked
  function xfig(Am, T, o = {}) {
    const u = Am >= 0.1 ? 'm' : Am >= 0.01 ? 'cm' : Am >= 1e-4 ? 'mm' : Am >= 1e-7 ? 'μm' : 'pm', k = OC.UNITS[u][0], Au = Am / k;
    const pts = Array.from({ length: 201 }, (z, j) => { const t = (j * 2 * T) / 200; return [t / T, Au * Math.cos((PI2 * t) / T)]; });
    return `<div class="fig">${Plot.graph([{ pts }], { tEnd: 2, tStep: 0.5, name: 'y', unit: u, axis: Plot.niceAxis([-Au * 1.05, Au * 1.05]), label: L('Displacement against time (t in periods)', 'Auslenkung gegen die Zeit (t in Perioden)'), dots: (o.dots || []).map(([t, x]) => [t / T, x / k]), tLabel: '<tspan class="it">t</tspan> / <tspan class="it">T</tspan>' })}</div>`;
  }

  // ---------------------------------------------------------------- pictures
  // the pictures: textbook drawings (figures.js)
  const PIC = (name) => () => root.Figures[name]();

  // a problem with v̂ and â, from the amplitude A (m) and the frequency f or period T
  function maxima(o) {
    return {
      id: o.id, difficulty: o.difficulty, title: o.title,
      make: o.make,
      solve: (p) => { const Am = o.amp(p), w = p.T ? PI2 / p.T : PI2 * p.f; return { Am, w, vmax: Am * w, amax: Am * w * w, g: (Am * w * w) / G }; },
      fields: (p) => [num$('vmax', '\\hat v', o.vunit || speedUnit(o.amp(p) * (p.T ? PI2 / p.T : PI2 * p.f)), L('largest speed', 'grösste Geschwindigkeit'), !!o.sci), num$('amax', '\\hat a', 'm/s²', L('largest acceleration', 'grösste Beschleunigung'), !!o.sci), ...(o.inG ? [num$('g', '\\hat a/g', '', L('in units of g', 'in Einheiten von g'), !!o.sci)] : [])],
      text: o.text,
      hints: (p) => [HINT_MAX(), ...(o.hint ? [o.hint(p)] : []), HINT_SI()],
      steps: (p, v) => [
        step(L('The angular frequency', 'Die Kreisfrequenz'), (o.pre ? p$(o.pre(p, v)) : '') + `$$${p.T ? wT$(p.T) : w$(p.f)}$$`),
        step(L('The largest speed', 'Die grösste Geschwindigkeit'), p$(L('It is reached at the equilibrium:', 'Sie wird in der Gleichgewichtslage erreicht:')) + `$$${vmax$(v.Am, v.w, o.vunit || speedUnit(v.vmax))}$$`),
        step(L('The largest acceleration', 'Die grösste Beschleunigung'), p$(L('It is reached at the turning points:', 'Sie wird an den Umkehrpunkten erreicht:')) + `$$${amax$(v.Am, v.w)}$$` +
          (o.inG ? ` $$\\frac{\\hat a}{g} = \\frac{${tq(v.amax, 'm/s²')}}{9.81\\,\\mathrm{m/s^2}} = ${res(tnum(v.g))}$$` : '') + (o.after ? p$(o.after(p, v)) : '')),
      ],
      pic: o.pic,
      fig: (p, v) => xfig(v.Am, 1 / (v.w / PI2), { dots: [[0, 0], [0.25 / (v.w / PI2), v.Am]] }),
    };
  }

  const fork = maxima({
    id: 'fork', difficulty: 2, title: () => L('A tuning fork', 'Eine Stimmgabel'), pic: PIC('fork'), inG: true,
    make: (r) => ({ f: pick(r, [256, 384, 440, 512]), a: pick(r, [0.3, 0.5, 0.8, 1]) * 1e-3 }), amp: (p) => p.a,
    text: (p) => L(`A tuning fork sounds at ${q(p.f, 'Hz')}. The tips of its prongs oscillate harmonically with an amplitude of ${q(p.a, 'mm')}. What are the largest speed and the largest acceleration of a tip? How many times the acceleration of gravity is that?`,
      `Eine Stimmgabel tönt mit ${q(p.f, 'Hz')}. Die Spitzen ihrer Zinken schwingen harmonisch mit einer Amplitude von ${q(p.a, 'mm')}. Wie gross sind die grösste Geschwindigkeit und die grösste Beschleunigung einer Spitze? Das Wievielfache der Fallbeschleunigung ist das?`),
    after: () => L('Hundreds of g, with a speed of only a few m/s: at high frequencies, small oscillations mean huge accelerations.', 'Hunderte von g, bei einer Geschwindigkeit von nur wenigen m/s: Bei hohen Frequenzen bedeuten kleine Schwingungen riesige Beschleunigungen.'),
  });
  const tower = maxima({
    id: 'tower', difficulty: 3, title: () => L('A swaying skyscraper', 'Ein schwankender Wolkenkratzer'), pic: PIC('tower'), vunit: 'cm/s',
    make: (r) => ({ T: pick(r, [6, 6.8, 7, 8]), a: pick(r, [0.2, 0.3, 0.5, 0.7]) }), amp: (p) => p.a,
    text: (p) => L(`In a typhoon, the top of a skyscraper sways harmonically with a period of ${q(p.T, 's')} and an amplitude of ${q(p.a, 'm')}. What are the largest speed and the largest acceleration at the top? (People feel accelerations from about 0.05 m/s².)`,
      `In einem Taifun schwankt die Spitze eines Wolkenkratzers harmonisch mit einer Periode von ${q(p.T, 's')} und einer Amplitude von ${q(p.a, 'm')}. Wie gross sind die grösste Geschwindigkeit und die grösste Beschleunigung an der Spitze? (Menschen spüren Beschleunigungen ab etwa 0.05 m/s².)`),
    after: (p, v) => (v.amax > 0.05 ? L('Clearly more than people can feel: that is why such towers carry huge pendulums that damp the swaying.', 'Deutlich mehr, als Menschen spüren: Deshalb tragen solche Türme riesige Pendel, die das Schwanken dämpfen.') : L('Just below what people can feel.', 'Knapp unter dem, was Menschen spüren.')),
  });
  const atoms = maxima({
    id: 'atoms', difficulty: 4, title: () => L('Atoms in a crystal', 'Atome in einem Kristall'), pic: PIC('atoms'), sci: true, vunit: 'm/s',
    make: (r) => ({ f: pick(r, [2, 5, 8, 10]) * 1e12, a: pick(r, [0.5, 1, 2]) * 1e-11 }), amp: (p) => p.a,
    text: (p) => L(`The atoms of a crystal vibrate around their places, roughly harmonically, with a frequency of ${q(p.f, 'Hz')} and an amplitude of ${q(p.a, 'm')} (a few percent of the distance between neighbours). What are their largest speed and their largest acceleration?`,
      `Die Atome eines Kristalls schwingen ungefähr harmonisch um ihre Plätze, mit einer Frequenz von ${q(p.f, 'Hz')} und einer Amplitude von ${q(p.a, 'm')} (einige Prozent des Abstands zu den Nachbarn). Wie gross sind ihre grösste Geschwindigkeit und ihre grösste Beschleunigung?`),
    after: () => L('Speeds of a few hundred m/s, like those of the molecules in the air, and accelerations of about 10¹⁶ m/s².', 'Geschwindigkeiten von einigen hundert m/s, wie die der Moleküle in der Luft, und Beschleunigungen von etwa 10¹⁶ m/s².'),
  });

  // ---------------------------------------------------------------- an earthquake: read the seismogram
  // The ground's displacement recorded against time: A and T read off, then â and â/g.
  const quake = {
    id: 'quake', difficulty: 3, title: () => L('An earthquake', 'Ein Erdbeben'),
    make: (r) => ({ A: pick(r, [2, 3, 4, 5]) / 100, T: pick(r, [0.4, 0.5, 0.8, 1]) }),
    solve: (p) => { const w = PI2 / p.T; return { w, amax: p.A * w * w, g: (p.A * w * w) / G }; },
    fields: () => [num$('amax', '\\hat a', 'm/s²', L('largest acceleration of the ground', 'grösste Beschleunigung des Bodens')), num$('g', '\\hat a/g', '', L('in units of g', 'in Einheiten von g'))],
    text: () => L('A seismograph in a house records the ground moving back and forth during an earthquake (below). Take the motion as harmonic. What is the largest acceleration of the ground? How many times g is that? (Buildings are at risk from about 0.3 g.)',
      'Ein Seismograph in einem Haus zeichnet auf, wie sich der Boden bei einem Erdbeben hin und her bewegt (unten). Nimm die Bewegung als harmonisch an. Wie gross ist die grösste Beschleunigung des Bodens? Das Wievielfache von g ist das? (Ab etwa 0.3 g sind Gebäude gefährdet.)'),
    hints: (p) => [L('Read the amplitude A (the largest displacement) and the period T (from crest to crest) off the recording.', 'Lies die Amplitude A (die grösste Auslenkung) und die Periode T (von Berg zu Berg) an der Aufzeichnung ab.'), L('$\\omega = 2\\pi/T$ and $\\hat a = A\\,\\omega^2$.', '$\\omega = 2\\pi/T$ und $\\hat a = A\\,\\omega^2$.'), HINT_SI()],
    steps: (p, v) => [
      step(L('From the recording', 'Aus der Aufzeichnung'), p$(L(`Amplitude $A = ${tq(p.A, 'cm')}$, period $T = ${tq(p.T, 's')}$ (from crest to crest).`, `Amplitude $A = ${tq(p.A, 'cm')}$, Periode $T = ${tq(p.T, 's')}$ (von Berg zu Berg).`)) + `$$${wT$(p.T)}$$`),
      step(L('The largest acceleration', 'Die grösste Beschleunigung'), `$$${amax$(p.A, v.w)},\\qquad \\frac{\\hat a}{g} = ${res(tnum(v.g))}$$` +
        p$(v.g >= 0.3 ? L('More than 0.3 g: a dangerous earthquake for buildings.', 'Mehr als 0.3 g: ein für Gebäude gefährliches Erdbeben.') : L('Less than 0.3 g: buildings should withstand it.', 'Weniger als 0.3 g: Gebäude sollten das aushalten.'))),
    ],
    pic: (p) => seismogram(p, true),
    fig: (p) => seismogram(p, false),
  };
  // the recording: the displacement in cm against the time in s, with a grid to read it off
  function seismogram(p, task) {
    const tEnd = 3 * p.T, pts = Array.from({ length: 301 }, (z, j) => { const t = (j * tEnd) / 300; return [t, p.A * 100 * Math.cos((PI2 * t) / p.T)]; });
    const ts = [0.1, 0.2, 0.25, 0.5].find((x) => tEnd / x <= 12 && Math.abs(p.T / x - Math.round(p.T / x)) < 1e-9) || 0.5;
    return `<div class="fig">${Plot.graph([{ pts }], { tEnd, tStep: ts, name: 'y', unit: 'cm', axis: { lo: -6, hi: 6, step: 2 }, dots: task ? [] : [[0, p.A * 100], [p.T, p.A * 100]], marks: task ? [] : [p.T], label: L('The ground’s displacement against time', 'Die Auslenkung des Bodens gegen die Zeit') })}</div>`;
  }

  // ---------------------------------------------------------------- salt on a loudspeaker
  // Salt grains on a membrane facing up lift off once the membrane accelerates downwards faster
  // than g: â = g, so ω = √(g/A).
  const salt = {
    id: 'salt', difficulty: 3, title: () => L('Salt on a loudspeaker', 'Salz auf einem Lautsprecher'),
    make: (r) => ({ A: pick(r, [0.2, 0.3, 0.5, 1]) * 1e-3, f2: pick(r, [40, 50, 60, 80]) }),
    solve: (p) => { const w = Math.sqrt(G / p.A), w2 = PI2 * p.f2; return { w, f: w / PI2, A2: G / (w2 * w2) }; },
    fields: (p) => [num$('f', 'f', 'Hz', L('frequency at which the salt starts to jump', 'Frequenz, bei der das Salz zu hüpfen beginnt')), num$('A2', 'A_2', 'mm', L(`amplitude for jumping at ${p.f2} Hz`, `Amplitude für Hüpfen bei ${p.f2} Hz`))],
    text: (p) => L(`A loudspeaker lies on its back with a few grains of salt on its membrane. Played a tone, the membrane oscillates harmonically up and down with an amplitude of ${q(p.A, 'mm')}. Above which frequency do the grains start to jump? Which amplitude would make them jump at ${q(p.f2, 'Hz')}?`,
      `Ein Lautsprecher liegt auf dem Rücken, ein paar Salzkörner auf seiner Membran. Spielt er einen Ton, schwingt die Membran harmonisch auf und ab, mit einer Amplitude von ${q(p.A, 'mm')}. Ab welcher Frequenz beginnen die Körner zu hüpfen? Welche Amplitude liesse sie bei ${q(p.f2, 'Hz')} hüpfen?`),
    hints: () => [
      L('A grain only follows the membrane as long as the membrane does not accelerate downwards faster than g: at the top, the grain simply falls.', 'Ein Korn folgt der Membran nur, solange diese nicht schneller als mit g nach unten beschleunigt: Oben fällt das Korn einfach.'),
      L('So the grains lift off when $\\hat a = A\\,\\omega^2 = g$.', 'Die Körner heben also ab, wenn $\\hat a = A\\,\\omega^2 = g$.'),
      L('$\\omega = 2\\pi f$; lengths in metres.', '$\\omega = 2\\pi f$; Längen in Metern.'),
    ],
    steps: (p, v) => [
      step(L('When the grains lift off', 'Wann die Körner abheben'), p$(L('At the top of its swing, the membrane accelerates downwards with $\\hat a$. A grain on it falls only with $g$: once $\\hat a > g$, the membrane drops away below it.', 'Am oberen Umkehrpunkt beschleunigt die Membran mit $\\hat a$ nach unten. Ein Korn darauf fällt nur mit $g$: Sobald $\\hat a > g$, sinkt die Membran unter ihm weg.')) +
        `$$A\\,\\omega^2 = g\;\\Rightarrow\;\\omega = \\sqrt{\\frac{g}{A}} = \\sqrt{\\frac{9.81\\,\\mathrm{m/s^2}}{${tq(p.A, 'm')}}} = ${tnum(v.w)}\\,\\mathrm{s^{-1}},\\qquad f = \\frac{\\omega}{2\\pi} = ${res(tq(v.f, 'Hz'))}$$`),
      step(L(`At ${p.f2} Hz`, `Bei ${p.f2} Hz`), `$$A_2 = \\frac{g}{\\omega_2^2} = \\frac{9.81\\,\\mathrm{m/s^2}}{(2\\pi\\cdot ${p.f2}\\,\\mathrm{Hz})^2} = ${res(tq(v.A2, 'mm'))}$$` +
        p$(L('At higher frequencies, a tiny amplitude is enough: that is why salt dances on loudspeakers for deep bass notes already.', 'Bei höheren Frequenzen genügt eine winzige Amplitude: Darum tanzt Salz auf Lautsprechern schon bei tiefen Bässen.'))),
    ],
    pic: PIC('salt'),
    fig: (p, v) => xfig(p.A, 1 / v.f, { dots: [[0, p.A]] }),
  };

  // ---------------------------------------------------------------- the tide in a harbour
  // The water level y(t) = A·cos(ωt) around its mean, high tide at t = 0, T = 12.4 h. A boat needs
  // the level above y₁ = h − A (h: above low tide): until t = arccos(y₁/A)/ω.
  const TIDE = 12.4;
  const tide = {
    id: 'tide', difficulty: 4, title: () => L('The tide in a harbour', 'Die Gezeiten in einem Hafen'),
    make: (r) => { const R = pick(r, [3, 4, 5, 6]), h = pick(r, [1, 1.5, 2, 2.5, 3, 3.5, 4]); return h < R - 0.4 && h > 0.4 ? { R, h } : null; },
    // (in SI: t in s, v̂ in m/s; w in h⁻¹ for the steps)
    solve: (p) => { const A = p.R / 2, w = PI2 / TIDE, y1 = p.h - A; return { A, w, y1, t: (Math.acos(y1 / A) / w) * 3600, vmax: (A * w) / 3600 }; },
    fields: () => [num$('t', 't', 'h', L('time the boat has left', 'Zeit, die dem Boot bleibt')), num$('vmax', '\\hat v', 'm/h', L('fastest change of the water level', 'schnellste Änderung des Wasserstands'))],
    text: (p) => L(`In a harbour, the water rises and falls harmonically by ${q(p.R, 'm')} between low and high tide, with a period of ${TIDE} h. It is high tide now. A boat can only leave while the water is at least ${q(p.h, 'm')} above the low-tide level. How much time is left? How fast (in metres per hour) does the water level change at most?`,
      `In einem Hafen steigt und fällt das Wasser harmonisch um ${q(p.R, 'm')} zwischen Ebbe und Flut, mit einer Periode von ${TIDE} h. Jetzt ist Flut. Ein Boot kann nur auslaufen, solange das Wasser mindestens ${q(p.h, 'm')} über dem Stand bei Ebbe ist. Wie viel Zeit bleibt? Wie schnell (in Metern pro Stunde) ändert sich der Wasserstand höchstens?`),
    hints: () => [
      L('Measure the level y from the middle between low and high tide: $y(t) = A\\cos(\\omega t)$ with high tide at $t = 0$, $A$ half the difference, $\\omega = 2\\pi/T$.', 'Miss den Wasserstand y von der Mitte zwischen Ebbe und Flut aus: $y(t) = A\\cos(\\omega t)$ mit Flut bei $t = 0$, $A$ die halbe Differenz, $\\omega = 2\\pi/T$.'),
      L('The boat needs $y \\ge y_1$ with $y_1$ = (height above low tide) − A. Solve $A\\cos(\\omega t) = y_1$ for t, in radians.', 'Das Boot braucht $y \\ge y_1$ mit $y_1$ = (Höhe über Ebbe) − A. Löse $A\\cos(\\omega t) = y_1$ nach t auf, im Bogenmass.'),
      L('$\\hat v = A\\,\\omega$, with ω in h⁻¹.', '$\\hat v = A\\,\\omega$, mit ω in h⁻¹.'),
    ],
    steps: (p, v) => [
      step(L('The water level', 'Der Wasserstand'), p$(L('Measured from the middle between low and high tide, with high tide now:', 'Von der Mitte zwischen Ebbe und Flut aus gemessen, mit Flut jetzt:')) +
        `$$y(t) = A\\cos(\\omega t),\\qquad A = \\frac{${tq(p.R, 'm')}}{2} = ${tq(v.A, 'm')},\\qquad \\omega = \\frac{2\\pi}{${TIDE}\\,\\mathrm{h}} = ${tnum(v.w)}\\,\\mathrm{h^{-1}}$$`),
      step(L('The time left', 'Die verbleibende Zeit'), p$(L(`The boat needs at least ${q(p.h, 'm')} above low tide, that is $y_1 = ${tq(p.h, 'm')} - ${tq(v.A, 'm')} = ${tq(v.y1, 'm')}$ around the middle:`, `Das Boot braucht mindestens ${q(p.h, 'm')} über Ebbe, das heisst $y_1 = ${tq(p.h, 'm')} - ${tq(v.A, 'm')} = ${tq(v.y1, 'm')}$ um die Mitte:`)) +
        `$$A\\cos(\\omega t) = y_1\;\\Rightarrow\; t = \\frac{1}{\\omega}\\arccos\\frac{y_1}{A} = \\frac{${tnum(Math.acos(v.y1 / v.A))}}{${tnum(v.w)}\\,\\mathrm{h^{-1}}} = ${res(tq(v.t, 'h'))}$$`),
      step(L('The fastest change', 'Die schnellste Änderung'), `$$\\hat v = A\\,\\omega = ${tq(v.A, 'm')}\\cdot ${tnum(v.w)}\\,\\mathrm{h^{-1}} = ${res(tq(v.vmax, 'm/h'))}$$` +
        p$(L('Halfway between low and high tide, the water rises or falls fastest; near low and high tide it hardly changes.', 'Auf halbem Weg zwischen Ebbe und Flut steigt oder fällt das Wasser am schnellsten; bei Ebbe und Flut ändert es sich kaum.'))),
    ],
    pic: (p) => root.Figures.tide(p.R, p.h),
    fig: (p, v) => { const pts = Array.from({ length: 201 }, (z, j) => { const t = (j * TIDE) / 200; return [t, v.A * Math.cos(v.w * t)]; });
      return `<div class="fig">${Plot.graph([{ pts }], { tEnd: TIDE, tStep: 2, name: 'y', unit: 'm', axis: Plot.niceAxis([-v.A * 1.1, v.A * 1.1]), tLabel: '<tspan class="it">t</tspan> in h', marks: [v.t / 3600], dots: [[v.t / 3600, v.y1]], label: L('The water level against time', 'Der Wasserstand gegen die Zeit') })}</div>`; },
  };

  // ---------------------------------------------------------------- a baby bouncer: where is it half as fast?
  // From energy: E_kin/E = 1 − (y/A)², so v = v̂/2 where (y/A)² = 3/4.
  const bouncer = {
    id: 'bouncer', difficulty: 3, title: () => L('A baby bouncer', 'Ein Babyhopser'),
    make: (r) => ({ T: pick(r, [0.8, 1, 1.2]), a: pick(r, [8, 10, 12, 15]) * 1e-2 }),
    solve: (p) => { const w = PI2 / p.T; return { w, vmax: p.a * w, y: (Math.sqrt(3) / 2) * p.a }; },
    fields: (p) => [num$('vmax', '\\hat v', 'm/s', L('largest speed', 'grösste Geschwindigkeit')), num$('y', 'y', 'cm', L('distance from the resting point at half that speed', 'Abstand vom Ruhepunkt bei halber Geschwindigkeit'))],
    text: (p) => L(`A baby in a bouncer hangs from a spring and bounces up and down harmonically, ${q(p.a, 'cm')} above and below its resting point, once every ${q(p.T, 's')}. What is the baby's largest speed? How far from the resting point is the baby when it moves at half that speed?`,
      `Ein Baby in einem Babyhopser hängt an einer Feder und federt harmonisch auf und ab, ${q(p.a, 'cm')} über und unter seinen Ruhepunkt, einmal alle ${q(p.T, 's')}. Wie gross ist die grösste Geschwindigkeit des Babys? Wie weit vom Ruhepunkt entfernt ist es, wenn es sich halb so schnell bewegt?`),
    hints: () => [
      L('$\\hat v = A\\,\\omega$ with $\\omega = 2\\pi/T$.', '$\\hat v = A\\,\\omega$ mit $\\omega = 2\\pi/T$.'),
      L('Half the speed means a quarter of the kinetic energy: $E_\\mathrm{kin} = \\tfrac14 E$, so $E_\\mathrm{pot} = \\tfrac34 E$.', 'Halbe Geschwindigkeit heisst ein Viertel der kinetischen Energie: $E_\\mathrm{kin} = \\tfrac14 E$, also $E_\\mathrm{pot} = \\tfrac34 E$.'),
      L('$E_\\mathrm{pot}/E = (y/A)^2$.', '$E_\\mathrm{pot}/E = (y/A)^2$.'),
    ],
    steps: (p, v) => [
      step(L('The largest speed', 'Die grösste Geschwindigkeit'), `$$${wT$(p.T)},\\qquad ${vmax$(p.a, v.w, 'm/s')}$$`),
      step(L('Half as fast', 'Halb so schnell'), p$(L('The kinetic energy grows with the square of the speed: at half the speed it is a quarter of the total energy, so the potential energy (of the spring, around the resting point) is three quarters:', 'Die kinetische Energie wächst mit dem Quadrat der Geschwindigkeit: Bei halber Geschwindigkeit ist sie ein Viertel der Gesamtenergie, die potentielle Energie (der Feder, um den Ruhepunkt) also drei Viertel:')) +
        `$$\\left(\\frac{y}{A}\\right)^2 = \\frac34\;\\Rightarrow\; y = \\frac{\\sqrt3}{2}\\,A = ${res(tq(v.y, 'cm'))}$$` + p$(L('Surprisingly far out: the baby keeps half its top speed until it is 87 % of the way to the turning point.', 'Überraschend weit draussen: Das Baby hat noch die halbe Höchstgeschwindigkeit, bis es 87 % des Wegs zum Umkehrpunkt zurückgelegt hat.'))),
    ],
    pic: PIC('bouncer'),
    fig: () => root.Figures.energyWell(Math.sqrt(3) / 2),
  };

  // ---------------------------------------------------------------- a bouncing ball: periodic, but not harmonic
  const ball = {
    id: 'ball', difficulty: 3, title: () => L('A bouncing ball', 'Ein hüpfender Ball'),
    make: (r) => ({ h: pick(r, [0.5, 0.8, 1, 1.25, 1.8, 2]) }),
    solve: (p) => { const T = 2 * Math.sqrt((2 * p.h) / G); return { harm: 'no', T, T4: 2 * T }; },
    fields: (p) => [
      { key: 'harm', type: 'choice', what: L('Is the motion harmonic?', 'Ist die Bewegung harmonisch?'), stack: true, options: [
        ['no', L('No: between the bounces, the acceleration is g, the same all the time.', 'Nein: Zwischen den Aufprallen ist die Beschleunigung g, die ganze Zeit gleich.'), '', null],
        ['yes', L('Yes: it moves up and down again and again.', 'Ja: Er bewegt sich immer wieder auf und ab.'), L('Periodic is not enough: harmonic needs an acceleration proportional to the displacement, a = −ω²·y. Here a = −g, whatever the height.', 'Periodisch genügt nicht: Harmonisch braucht eine Beschleunigung proportional zur Auslenkung, a = −ω²·y. Hier ist a = −g, egal in welcher Höhe.'), 'form'],
        ['loss', L('No: it loses some energy at every bounce.', 'Nein: Er verliert bei jedem Aufprall etwas Energie.'), L('Even a ball that bounced without any losses would not oscillate harmonically: its acceleration between the bounces is constant.', 'Auch ein Ball, der ganz ohne Verluste hüpfte, schwänge nicht harmonisch: Seine Beschleunigung zwischen den Aufprallen ist konstant.'), null],
      ] },
      num$('T', 'T', 's', L(`time between two bounces from ${q(p.h, 'm')}`, `Zeit zwischen zwei Aufprallen aus ${q(p.h, 'm')}`)),
      num$('T4', 'T_4', 's', L('the same from four times the height', 'dasselbe aus der vierfachen Höhe')),
    ],
    text: (p) => L(`A ball bounces on the floor, up to ${q(p.h, 'm')} each time (assume it loses no energy). Is its up-and-down motion a harmonic oscillation? How long does it take from one bounce to the next? How long from four times the height?`,
      `Ein Ball hüpft auf dem Boden, jedes Mal ${q(p.h, 'm')} hoch (nimm an, er verliert keine Energie). Ist seine Auf-und-ab-Bewegung eine harmonische Schwingung? Wie lange dauert es von einem Aufprall zum nächsten? Wie lange aus der vierfachen Höhe?`),
    hints: () => [
      L('In an SHM, the acceleration is a = −ω²·y. What is the ball’s acceleration in the air?', 'Bei einer harmonischen Schwingung ist die Beschleunigung a = −ω²·y. Wie gross ist die Beschleunigung des Balls in der Luft?'),
      L('Up and down are a free fall each: from the top, $h = \\tfrac12 g\\,t^2$.', 'Hinauf und hinunter sind je ein freier Fall: vom höchsten Punkt aus $h = \\tfrac12 g\\,t^2$.'),
      L('In an SHM, the period does not depend on the amplitude. Here?', 'Bei einer harmonischen Schwingung hängt die Periode nicht von der Amplitude ab. Und hier?'),
    ],
    steps: (p, v) => [
      step(L('Harmonic?', 'Harmonisch?'), p$(L('In the air, the ball accelerates with $g$ downwards, at every height: $a = -g$, not $a = -\\omega^2 y$. Its graph is a row of parabolas, not a cosine. <span class="result">Periodic, but not harmonic.</span>', 'In der Luft beschleunigt der Ball mit $g$ nach unten, in jeder Höhe: $a = -g$, nicht $a = -\\omega^2 y$. Sein Graph ist eine Reihe von Parabeln, kein Kosinus. <span class="result">Periodisch, aber nicht harmonisch.</span>'))),
      step(L('The time between bounces', 'Die Zeit zwischen den Aufprallen'), p$(L('Falling from the top takes $t = \\sqrt{2h/g}$; rising takes as long:', 'Das Fallen vom höchsten Punkt dauert $t = \\sqrt{2h/g}$; das Steigen gleich lang:')) +
        `$$T = 2\\sqrt{\\frac{2h}{g}} = 2\\sqrt{\\frac{2\\cdot ${tq(p.h, 'm')}}{9.81\\,\\mathrm{m/s^2}}} = ${res(tq(v.T, 's'))},\\qquad T_4 = 2\\sqrt{\\frac{2\\cdot 4h}{g}} = 2\\,T = ${res(tq(v.T4, 's'))}$$` +
        p$(L('Four times as high, twice as long: the period depends on the amplitude, unlike in an SHM.', 'Viermal so hoch, doppelt so lang: Die Periode hängt von der Amplitude ab, anders als bei einer harmonischen Schwingung.'))),
    ],
    pic: (p) => root.Figures.ball(),
    fig: (p, v) => { const T = v.T, pts = Array.from({ length: 241 }, (z, j) => { const t = (j * 3 * T) / 240, u = ((t % T) + T) % T; return [t, (G / 2) * u * (T - u)]; });
      return `<div class="fig">${Plot.graph([{ pts }], { tEnd: 3 * T, name: 'y', unit: 'm', axis: Plot.niceAxis([0, p.h * 1.1]), label: L('The height of the ball against time: parabolas', 'Die Höhe des Balls gegen die Zeit: Parabeln') })}</div>`; },
  };

  const PROBLEMS = [fork, ball, salt, quake, bouncer, tower, tide, atoms];

  // ---------------------------------------------------------------- exercises
  function realOf(i, seed) {
    const pb = PROBLEMS[i], r = rng(seed);
    let p = null;
    for (let k = 0; k < 1000 && !p; k++) p = pb.make(r);
    const v = pb.solve(p);
    const fields = pb.fields(p).map((f) => (f.type === 'choice' ? { ...f, value: v[f.key] } : { ...f, value: OC.inUnit(v[f.key], f.unit), traps: [] }));
    return {
      scenario: 'real', difficulty: pb.difficulty, title: pb.title(), text: `<p>${pb.text(p)}</p>`,
      fields,
      figure: () => (root.Figures ? pb.pic(p) : ''),
      solutionFigure: () => pb.fig(p, v),
      hints: pb.hints(p), solution: pb.steps(p, v),
      results: fields.map((f) => (f.type === 'choice' ? f.options.find((o) => o[0] === f.value)[1] : `$${f.sym} = ${tq(v[f.key], f.unit)}$`)).join(', '),
      p, v,
    };
  }

  root.OscProblems = { PROBLEMS, realOf };
  if (typeof module !== 'undefined') module.exports = root.OscProblems;
})(typeof window !== 'undefined' ? window : globalThis);
