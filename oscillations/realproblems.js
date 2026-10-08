// Problems: harmonic oscillations in everyday life, technology and nature, told as stories and
// solved with the kinematics of this app (ω = 2πf = 2π/T, v̂ = A·ω, â = A·ω²,
// v = ω·√(A² − y²), a = −ω²·y). Each has random values from a list and a picture (figures.js):
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
  const HINT_MAX = () => L('From $y = A\\sin(\\omega t)$: $\\hat v = A\\,\\omega$ and $\\hat a = A\\,\\omega^2$, with $\\omega = 2\\pi f = 2\\pi/T$.', 'Aus $y = A\\sin(\\omega t)$: $\\hat v = A\\,\\omega$ und $\\hat a = A\\,\\omega^2$, mit $\\omega = 2\\pi f = 2\\pi/T$.');
  const HINT_SI = () => L('Lengths in metres, times in seconds.', 'Längen in Metern, Zeiten in Sekunden.');
  // the displacement against time, two periods, with the times of the solution marked
  function xfig(Am, T, o = {}) {
    const u = Am >= 0.1 ? 'm' : Am >= 1e-3 ? (Am >= 0.01 ? 'cm' : 'mm') : 'pm', k = OC.UNITS[u][0], Au = Am / k;
    const pts = Array.from({ length: 201 }, (z, j) => { const t = (j * 2 * T) / 200; return [t / T, Au * Math.sin((PI2 * t) / T)]; });
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
  const speaker = maxima({
    id: 'speaker', difficulty: 2, title: () => L('A loudspeaker', 'Ein Lautsprecher'), pic: PIC('speaker'), inG: true,
    make: (r) => ({ f: pick(r, [40, 50, 60, 80, 100]), a: pick(r, [1, 2, 3, 4]) * 1e-3 }), amp: (p) => p.a,
    text: (p) => L(`For a deep bass note of ${q(p.f, 'Hz')}, the cone of a loudspeaker oscillates harmonically with an amplitude of ${q(p.a, 'mm')}. What are its largest speed and its largest acceleration? How many times g is that?`,
      `Für einen tiefen Basston von ${q(p.f, 'Hz')} schwingt die Membran eines Lautsprechers harmonisch mit einer Amplitude von ${q(p.a, 'mm')}. Wie gross sind ihre grösste Geschwindigkeit und ihre grösste Beschleunigung? Das Wievielfache von g ist das?`),
  });
  const needle = maxima({
    id: 'needle', difficulty: 3, title: () => L('A sewing machine', 'Eine Nähmaschine'), pic: PIC('needle'),
    make: (r) => { const n = pick(r, [600, 750, 900, 1200]); return { n, f: n / 60, stroke: pick(r, [2.4, 3, 3.6]) * 1e-2 }; }, amp: (p) => p.stroke / 2,
    text: (p) => L(`A sewing machine makes ${p.n} stitches per minute. Its needle moves up and down harmonically; from its highest to its lowest point it travels ${q(p.stroke, 'cm')}. What are the largest speed and the largest acceleration of the needle?`,
      `Eine Nähmaschine macht ${p.n} Stiche pro Minute. Ihre Nadel bewegt sich harmonisch auf und ab; von ihrem höchsten zu ihrem tiefsten Punkt legt sie ${q(p.stroke, 'cm')} zurück. Wie gross sind die grösste Geschwindigkeit und die grösste Beschleunigung der Nadel?`),
    hint: () => L('One stitch is one oscillation. From top to bottom is twice the amplitude.', 'Ein Stich ist eine Schwingung. Von oben bis unten ist das Doppelte der Amplitude.'),
    pre: (p, v) => L(`One stitch is one oscillation: $f = ${p.n}/(60\\,\\mathrm{s}) = ${tnum(p.n / 60)}\\,\\mathrm{Hz}$. From top to bottom is $2A$, so $A = ${tq(v.Am, 'cm')}$.`, `Ein Stich ist eine Schwingung: $f = ${p.n}/(60\\,\\mathrm{s}) = ${tnum(p.n / 60)}\\,\\mathrm{Hz}$. Von oben bis unten ist $2A$, also $A = ${tq(v.Am, 'cm')}$.`),
  });
  const brush = maxima({
    id: 'brush', difficulty: 2, title: () => L('An electric toothbrush', 'Eine elektrische Zahnbürste'), pic: PIC('brush'), inG: true,
    make: (r) => ({ f: pick(r, [200, 230, 260]), a: pick(r, [1, 1.5, 2]) * 1e-3 }), amp: (p) => p.a,
    text: (p) => L(`The head of a sonic toothbrush vibrates harmonically at ${q(p.f, 'Hz')} with an amplitude of ${q(p.a, 'mm')}. What are its largest speed and its largest acceleration? How many times g is that?`,
      `Der Kopf einer Schallzahnbürste vibriert harmonisch mit ${q(p.f, 'Hz')} und einer Amplitude von ${q(p.a, 'mm')}. Wie gross sind seine grösste Geschwindigkeit und seine grösste Beschleunigung? Das Wievielfache von g ist das?`),
  });
  const boat = maxima({
    id: 'boat', difficulty: 3, title: () => L('A boat on waves', 'Ein Boot auf Wellen'), pic: PIC('boat'),
    make: (r) => ({ T: pick(r, [4, 5, 6, 8]), h: pick(r, [0.8, 1, 1.2, 1.6, 2]) }), amp: (p) => p.h / 2,
    text: (p) => L(`A small boat bobs up and down harmonically on long waves: from the crest to the trough it sinks by ${q(p.h, 'm')}, and a wave passes every ${q(p.T, 's')}. What are its largest vertical speed and its largest vertical acceleration?`,
      `Ein kleines Boot schaukelt auf langen Wellen harmonisch auf und ab: Vom Wellenberg ins Wellental sinkt es um ${q(p.h, 'm')}, und alle ${q(p.T, 's')} läuft eine Welle vorbei. Wie gross sind seine grösste vertikale Geschwindigkeit und seine grösste vertikale Beschleunigung?`),
    hint: () => L('From crest to trough is twice the amplitude; the time between two waves is the period.', 'Vom Berg ins Tal ist das Doppelte der Amplitude; die Zeit zwischen zwei Wellen ist die Periode.'),
    pre: (p, v) => L(`From crest to trough is $2A$: $A = ${tq(v.Am, 'm')}$; the period is $T = ${tq(p.T, 's')}$.`, `Vom Berg ins Tal ist $2A$: $A = ${tq(v.Am, 'm')}$; die Periode ist $T = ${tq(p.T, 's')}$.`),
  });
  const quake = maxima({
    id: 'quake', difficulty: 3, title: () => L('An earthquake', 'Ein Erdbeben'), pic: PIC('quake'), inG: true,
    make: (r) => ({ f: pick(r, [1, 1.5, 2, 2.5, 3]), a: pick(r, [2, 3, 5, 8, 10]) * 1e-2 }), amp: (p) => p.a,
    text: (p) => L(`In a strong earthquake, the ground moves back and forth roughly harmonically, with an amplitude of ${q(p.a, 'cm')} at ${q(p.f, 'Hz')}. What are the largest speed and the largest acceleration of the ground? How many times g is that? (Buildings are at risk from about 0.3 g.)`,
      `Bei einem starken Erdbeben bewegt sich der Boden ungefähr harmonisch hin und her, mit einer Amplitude von ${q(p.a, 'cm')} bei ${q(p.f, 'Hz')}. Wie gross sind die grösste Geschwindigkeit und die grösste Beschleunigung des Bodens? Das Wievielfache von g ist das? (Ab etwa 0.3 g sind Gebäude gefährdet.)`),
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
  const bird = maxima({
    id: 'bird', difficulty: 2, title: () => L('A hummingbird', 'Ein Kolibri'), pic: PIC('bird'), inG: true,
    make: (r) => ({ f: pick(r, [40, 50, 60, 70]), a: pick(r, [2, 2.5, 3, 4]) * 1e-2 }), amp: (p) => p.a,
    text: (p) => L(`A hovering hummingbird beats its wings ${p.f} times per second. The wing tips move up and down roughly harmonically with an amplitude of ${q(p.a, 'cm')}. What are the largest speed and the largest acceleration of a wing tip? How many times g is that?`,
      `Ein schwebender Kolibri schlägt seine Flügel ${p.f}-mal pro Sekunde. Die Flügelspitzen bewegen sich ungefähr harmonisch auf und ab, mit einer Amplitude von ${q(p.a, 'cm')}. Wie gross sind die grösste Geschwindigkeit und die grösste Beschleunigung einer Flügelspitze? Das Wievielfache von g ist das?`),
  });

  const bouncer = maxima({
    id: 'bouncer', difficulty: 3, title: () => L('A baby bouncer', 'Ein Babyhopser'), pic: PIC('bouncer'),
    make: (r) => ({ T: pick(r, [0.8, 1, 1.2]), a: pick(r, [8, 10, 12, 15]) * 1e-2 }), amp: (p) => p.a,
    text: (p) => L(`A baby in a bouncer hangs from a spring and bounces up and down harmonically, ${q(p.a, 'cm')} above and below its resting point, once every ${q(p.T, 's')}. What are the baby's largest speed and its largest acceleration?`,
      `Ein Baby in einem Babyhopser hängt an einer Feder und federt harmonisch auf und ab, ${q(p.a, 'cm')} über und unter seinen Ruhepunkt, einmal alle ${q(p.T, 's')}. Wie gross sind die grösste Geschwindigkeit und die grösste Beschleunigung des Babys?`),
    after: (p, v) => (v.amax < 9.81 ? L('Less than g: the baby never leaves the seat.', 'Weniger als g: Das Baby hebt nie vom Sitz ab.') : L('More than g at the top: without the harness, the baby would lift off.', 'Oben mehr als g: Ohne Gurt würde das Baby abheben.')),
  });
  const carx = maxima({
    id: 'car', difficulty: 3, title: () => L('A car on its springs', 'Ein Auto auf seinen Federn'), pic: PIC('car'),
    make: (r) => ({ T: pick(r, [0.8, 1, 1.25]), a: pick(r, [2, 3, 4]) * 1e-2 }), amp: (p) => p.a,
    text: (p) => L(`After a bump, the body of a car bounces harmonically on its springs: ${q(p.a, 'cm')} up and down, with a period of ${q(p.T, 's')}. What are its largest speed and its largest acceleration?`,
      `Nach einer Bodenwelle federt die Karosserie eines Autos harmonisch auf und ab: ${q(p.a, 'cm')} nach oben und nach unten, mit einer Periode von ${q(p.T, 's')}. Wie gross sind ihre grösste Geschwindigkeit und ihre grösste Beschleunigung?`),
  });

  const PROBLEMS = [fork, speaker, brush, bird, needle, boat, quake, tower, bouncer, carx, atoms];

  // ---------------------------------------------------------------- exercises
  function realOf(i, seed) {
    const pb = PROBLEMS[i], p = pb.make(rng(seed)), v = pb.solve(p);
    const fields = pb.fields(p).map((f) => ({ ...f, value: OC.inUnit(v[f.key], f.unit), traps: [] }));
    return {
      scenario: 'real', difficulty: pb.difficulty, title: pb.title(), text: `<p>${pb.text(p)}</p>`,
      fields,
      figure: () => (root.Figures ? pb.pic(p) : ''),
      solutionFigure: () => pb.fig(p, v),
      hints: pb.hints(p), solution: pb.steps(p, v),
      results: fields.map((f) => `$${f.sym} = ${tq(v[f.key], f.unit)}$`).join(', '),
      p, v,
    };
  }

  root.OscProblems = { PROBLEMS, realOf };
  if (typeof module !== 'undefined') module.exports = root.OscProblems;
})(typeof window !== 'undefined' ? window : globalThis);
