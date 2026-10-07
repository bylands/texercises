// Problems: harmonic oscillations in everyday life, technology and nature, told as stories and
// solved with the kinematics of this app (ω = 2πf = 2π/T, v_max = A·ω, a_max = A·ω²,
// v = ω·√(A² − x²), a = −ω²·x). Each has random values from a list and a picture (artkit.js):
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
  const A = () => root.Art;
  const w$ = (f) => `\\omega = 2\\pi f = 2\\pi\\cdot ${tq(f, 'Hz')} = ${tnum(PI2 * f)}\\,\\mathrm{s^{-1}}`;
  const wT$ = (T) => `\\omega = \\frac{2\\pi}{T} = \\frac{2\\pi}{${tq(T, 's')}} = ${tnum(PI2 / T)}\\,\\mathrm{s^{-1}}`;
  const vmax$ = (Am, w, u) => `v_\\mathrm{max} = A\\,\\omega = ${tq(Am, 'm')}\\cdot ${tnum(w)}\\,\\mathrm{s^{-1}} = ${res(tq(Am * w, u))}`;
  const amax$ = (Am, w) => `a_\\mathrm{max} = A\\,\\omega^2 = ${tq(Am, 'm')}\\cdot (${tnum(w)}\\,\\mathrm{s^{-1}})^2 = ${res(tq(Am * w * w, 'm/s²'))}`;
  const HINT_MAX = () => L('From $x = A\\sin(\\omega t)$: $v_\\mathrm{max} = A\\,\\omega$ and $a_\\mathrm{max} = A\\,\\omega^2$, with $\\omega = 2\\pi f = 2\\pi/T$.', 'Aus $x = A\\sin(\\omega t)$: $v_\\mathrm{max} = A\\,\\omega$ und $a_\\mathrm{max} = A\\,\\omega^2$, mit $\\omega = 2\\pi f = 2\\pi/T$.');
  const HINT_SI = () => L('Lengths in metres, times in seconds.', 'Längen in Metern, Zeiten in Sekunden.');
  // the displacement against time, two periods, with the times of the solution marked
  function xfig(Am, T, o = {}) {
    const u = Am >= 0.1 ? 'm' : Am >= 1e-3 ? (Am >= 0.01 ? 'cm' : 'mm') : 'pm', k = OC.UNITS[u][0], Au = Am / k;
    const pts = Array.from({ length: 201 }, (z, j) => { const t = (j * 2 * T) / 200; return [t / T, Au * Math.sin((PI2 * t) / T)]; });
    return `<div class="fig">${Plot.graph([{ pts }], { tEnd: 2, tStep: 0.5, name: 'x', unit: u, axis: Plot.niceAxis([-Au * 1.05, Au * 1.05]), label: L('Displacement against time (t in periods)', 'Auslenkung gegen die Zeit (t in Perioden)'), dots: (o.dots || []).map(([t, x]) => [t / T, x / k]), tLabel: '<tspan class="it">t</tspan> / <tspan class="it">T</tspan>' })}</div>`;
  }

  // ---------------------------------------------------------------- pictures
  const caption = (x, y, t, night) => A().text(x, y, t, night ? 'rp-caption' : 'rp-caption-dark');
  const updown = (x, y0, y1) => A().arrow([x, (y0 + y1) / 2], [0, -1], (y1 - y0) / 2, 'rp-motion') + A().arrow([x, (y0 + y1) / 2], [0, 1], (y1 - y0) / 2, 'rp-motion');
  const leftright = (y, x0, x1) => A().arrow([(x0 + x1) / 2, y], [-1, 0], (x1 - x0) / 2, 'rp-motion') + A().arrow([(x0 + x1) / 2, y], [1, 0], (x1 - x0) / 2, 'rp-motion');
  const PIC = {
    fork: () => { const a = A(); return a.svg(420, 220, a.bg(0, 0, 420, 220) + a.rect(196, 150, 224, 205, 'os-metal', 4) +
      a.path('M190 152 L190 40 Q190 28 200 28 L200 150 Z', 'os-metal') + a.path('M230 152 L230 40 Q230 28 220 28 L220 150 Z', 'os-metal') + a.path('M190 150 Q210 170 230 150', 'os-metal') +
      leftright(40, 150, 190) + leftright(40, 230, 270) + caption(210, 214, L('the prongs swing in and out', 'die Zinken schwingen hin und her')), L('A tuning fork', 'Eine Stimmgabel')); },
    speaker: () => { const a = A(); return a.svg(420, 220, a.bg(0, 0, 420, 220) + a.rect(120, 30, 300, 190, 'rp-device', 10) + a.circle(210, 110, 64, 'rp-tyre') + a.circle(210, 110, 50, 'rp-rim') + a.circle(210, 110, 16, 'rp-hub') +
      leftright(110, 300, 380) + caption(210, 212, L('the cone moves in and out', 'die Membran bewegt sich vor und zurück')), L('A loudspeaker', 'Ein Lautsprecher')); },
    needle: () => { const a = A(); return a.svg(420, 220, a.bg(0, 0, 420, 220) + a.rect(60, 40, 360, 90, 'rp-device', 12) + a.rect(300, 90, 340, 180, 'rp-device', 6) + a.rect(40, 180, 380, 196, 'os-metal', 2) +
      a.rect(207, 90, 213, 150, 'rp-needle', 1) + a.rect(140, 170, 280, 180, 'os-cloth', 1) + updown(240, 92, 168) + caption(210, 214, L('the needle moves up and down', 'die Nadel bewegt sich auf und ab')), L('A sewing machine', 'Eine Nähmaschine')); },
    brush: () => { const a = A(); return a.svg(420, 220, a.bg(0, 0, 420, 220) + a.rect(60, 95, 300, 125, 'rp-device', 14) + a.rect(300, 103, 350, 117, 'os-metal', 4) + a.rect(340, 85, 362, 103, 'rp-fibre', 3) +
      a.circle(150, 110, 6, 'rp-led') + updown(385, 70, 120) + caption(210, 200, L('the head vibrates', 'der Kopf vibriert')), L('An electric toothbrush', 'Eine elektrische Zahnbürste')); },
    boat: () => { const a = A(); return a.svg(420, 220, a.bg(0, 0, 420, 220) + a.path('M0 150 Q35 135 70 150 T140 150 T210 150 T280 150 T350 150 T420 150 L420 220 L0 220 Z', 'rp-water') +
      a.path('M150 140 L270 140 L255 165 L165 165 Z', 'rp-wagon') + a.rect(205, 85, 209, 140, 'rp-pole', 1) + a.path('M209 88 L250 132 L209 132 Z', 'rp-flag') + updown(310, 100, 170) + caption(210, 36, L('the waves lift the boat up and down', 'die Wellen heben das Boot auf und ab')), L('A boat on waves', 'Ein Boot auf Wellen')); },
    quake: () => { const a = A(); return a.svg(420, 220, a.bg(0, 0, 420, 220) + a.ground(0, 420, 170, 'concrete') + a.rect(130, 60, 290, 170, 'rp-building', 3) +
      [0, 1, 2].map((i) => a.rect(150 + 50 * i, 80, 180 + 50 * i, 105, 'rp-window', 2) + a.rect(150 + 50 * i, 120, 180 + 50 * i, 145, 'rp-window', 2)).join('') + leftright(184, 60, 360) + caption(210, 36, L('the ground shakes back and forth', 'der Boden schwingt hin und her')), L('A house in an earthquake', 'Ein Haus bei einem Erdbeben')); },
    tower: () => { const a = A(); return a.svg(420, 240, a.bg(0, 0, 420, 240) + a.ground(0, 420, 210, 'concrete') + a.path('M180 210 L190 40 L230 40 L240 210 Z', 'rp-building') + a.rect(203, 15, 217, 40, 'os-metal', 2) +
      a.path('M180 210 L170 40 L210 40', 'os-ghost') + leftright(28, 160, 260) + caption(330, 110, L('the top sways in the wind', 'die Spitze schwankt im Wind')), L('A skyscraper', 'Ein Wolkenkratzer')); },
    atoms: () => { const a = A(); let s = a.bg(0, 0, 420, 220, 'night'); for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) s += a.circle(60 + 60 * i, 60 + 55 * j, 13, `rp-part ${(i + j) % 2 ? 'proton' : 'neutron'}`);
      return a.svg(420, 220, s + leftright(115, 200, 280) + caption(210, 212, L('atoms vibrate around their places', 'Atome schwingen um ihre Plätze'), true), L('Atoms in a crystal', 'Atome in einem Kristall')); },
    bird: () => { const a = A(); return a.svg(420, 220, a.bg(0, 0, 420, 220) + a.path('M150 120 Q200 95 260 110 Q290 115 300 108 L330 104 L300 118 Q280 130 250 130 Q200 140 150 120 Z', 'os-bird') +
      a.path('M215 112 Q190 40 150 30 Q195 70 205 118 Z', 'rp-glass') + a.path('M215 118 Q200 180 160 195 Q200 170 208 120 Z', 'rp-glass') + a.circle(287, 108, 3, 'rp-hub') + updown(120, 30, 195) + caption(300, 205, L('the wings beat up and down', 'die Flügel schlagen auf und ab')), L('A hummingbird', 'Ein Kolibri')); },
    bouncer: () => { const a = A(); return a.svg(420, 240, a.bg(0, 0, 420, 240) + a.rect(130, 10, 290, 22, 'rp-wall', 2) + a.path('M210 22 L210 40 L200 46 L220 54 L200 62 L220 70 L200 78 L220 86 L210 92 L210 105', 'rp-spring') +
      a.person(210, 200, 1, { shirt: 'orange', hands: [[198, 118], [222, 118]] }) + updown(280, 90, 190) + caption(210, 232, L('the baby bounces up and down', 'das Baby federt auf und ab')), L('A baby bouncer', 'Ein Babyhopser')); },
    car: () => { const a = A(); return a.svg(420, 220, a.bg(0, 0, 420, 220) + a.ground(0, 420, 170, 'asphalt') + a.car(90, 170, 240, 'blue') + updown(360, 80, 150) + caption(210, 212, L('the body bounces on its springs', 'die Karosserie federt auf und ab')), L('A car on its springs', 'Ein Auto auf seinen Federn')); },
  };

  // a problem with v_max and a_max, from the amplitude A (m) and the frequency f or period T
  function maxima(o) {
    return {
      id: o.id, difficulty: o.difficulty, title: o.title,
      make: o.make,
      solve: (p) => { const Am = o.amp(p), w = p.T ? PI2 / p.T : PI2 * p.f; return { Am, w, vmax: Am * w, amax: Am * w * w, g: (Am * w * w) / G }; },
      fields: (p) => [num$('vmax', 'v_\\mathrm{max}', o.vunit || speedUnit(o.amp(p) * (p.T ? PI2 / p.T : PI2 * p.f)), L('largest speed', 'grösste Geschwindigkeit'), !!o.sci), num$('amax', 'a_\\mathrm{max}', 'm/s²', L('largest acceleration', 'grösste Beschleunigung'), !!o.sci), ...(o.inG ? [num$('g', 'a_\\mathrm{max}/g', '', L('in units of g', 'in Einheiten von g'), !!o.sci)] : [])],
      text: o.text,
      hints: (p) => [HINT_MAX(), ...(o.hint ? [o.hint(p)] : []), HINT_SI()],
      steps: (p, v) => [
        step(L('The angular frequency', 'Die Kreisfrequenz'), (o.pre ? p$(o.pre(p, v)) : '') + `$$${p.T ? wT$(p.T) : w$(p.f)}$$`),
        step(L('The largest speed', 'Die grösste Geschwindigkeit'), p$(L('It is reached at the equilibrium:', 'Sie wird in der Gleichgewichtslage erreicht:')) + `$$${vmax$(v.Am, v.w, o.vunit || speedUnit(v.vmax))}$$`),
        step(L('The largest acceleration', 'Die grösste Beschleunigung'), p$(L('It is reached at the turning points:', 'Sie wird an den Umkehrpunkten erreicht:')) + `$$${amax$(v.Am, v.w)}$$` +
          (o.inG ? ` $$\\frac{a_\\mathrm{max}}{g} = \\frac{${tq(v.amax, 'm/s²')}}{9.81\\,\\mathrm{m/s^2}} = ${res(tnum(v.g))}$$` : '') + (o.after ? p$(o.after(p, v)) : '')),
      ],
      pic: o.pic,
      fig: (p, v) => xfig(v.Am, 1 / (v.w / PI2), { dots: [[0, 0], [0.25 / (v.w / PI2), v.Am]] }),
    };
  }

  const fork = maxima({
    id: 'fork', difficulty: 2, title: () => L('A tuning fork', 'Eine Stimmgabel'), pic: PIC.fork, inG: true,
    make: (r) => ({ f: pick(r, [256, 384, 440, 512]), a: pick(r, [0.3, 0.5, 0.8, 1]) * 1e-3 }), amp: (p) => p.a,
    text: (p) => L(`A tuning fork sounds at ${q(p.f, 'Hz')}. The tips of its prongs oscillate harmonically with an amplitude of ${q(p.a, 'mm')}. What are the largest speed and the largest acceleration of a tip? How many times the acceleration of gravity is that?`,
      `Eine Stimmgabel tönt mit ${q(p.f, 'Hz')}. Die Spitzen ihrer Zinken schwingen harmonisch mit einer Amplitude von ${q(p.a, 'mm')}. Wie gross sind die grösste Geschwindigkeit und die grösste Beschleunigung einer Spitze? Das Wievielfache der Fallbeschleunigung ist das?`),
    after: () => L('Hundreds of g, with a speed of only a few m/s: at high frequencies, small oscillations mean huge accelerations.', 'Hunderte von g, bei einer Geschwindigkeit von nur wenigen m/s: Bei hohen Frequenzen bedeuten kleine Schwingungen riesige Beschleunigungen.'),
  });
  const speaker = maxima({
    id: 'speaker', difficulty: 2, title: () => L('A loudspeaker', 'Ein Lautsprecher'), pic: PIC.speaker, inG: true,
    make: (r) => ({ f: pick(r, [40, 50, 60, 80, 100]), a: pick(r, [1, 2, 3, 4]) * 1e-3 }), amp: (p) => p.a,
    text: (p) => L(`For a deep bass note of ${q(p.f, 'Hz')}, the cone of a loudspeaker oscillates harmonically with an amplitude of ${q(p.a, 'mm')}. What are its largest speed and its largest acceleration? How many times g is that?`,
      `Für einen tiefen Basston von ${q(p.f, 'Hz')} schwingt die Membran eines Lautsprechers harmonisch mit einer Amplitude von ${q(p.a, 'mm')}. Wie gross sind ihre grösste Geschwindigkeit und ihre grösste Beschleunigung? Das Wievielfache von g ist das?`),
  });
  const needle = maxima({
    id: 'needle', difficulty: 3, title: () => L('A sewing machine', 'Eine Nähmaschine'), pic: PIC.needle,
    make: (r) => { const n = pick(r, [600, 750, 900, 1200]); return { n, f: n / 60, stroke: pick(r, [2.4, 3, 3.6]) * 1e-2 }; }, amp: (p) => p.stroke / 2,
    text: (p) => L(`A sewing machine makes ${p.n} stitches per minute. Its needle moves up and down harmonically; from its highest to its lowest point it travels ${q(p.stroke, 'cm')}. What are the largest speed and the largest acceleration of the needle?`,
      `Eine Nähmaschine macht ${p.n} Stiche pro Minute. Ihre Nadel bewegt sich harmonisch auf und ab; von ihrem höchsten zu ihrem tiefsten Punkt legt sie ${q(p.stroke, 'cm')} zurück. Wie gross sind die grösste Geschwindigkeit und die grösste Beschleunigung der Nadel?`),
    hint: () => L('One stitch is one oscillation. From top to bottom is twice the amplitude.', 'Ein Stich ist eine Schwingung. Von oben bis unten ist das Doppelte der Amplitude.'),
    pre: (p, v) => L(`One stitch is one oscillation: $f = ${p.n}/(60\\,\\mathrm{s}) = ${tnum(p.n / 60)}\\,\\mathrm{Hz}$. From top to bottom is $2A$, so $A = ${tq(v.Am, 'cm')}$.`, `Ein Stich ist eine Schwingung: $f = ${p.n}/(60\\,\\mathrm{s}) = ${tnum(p.n / 60)}\\,\\mathrm{Hz}$. Von oben bis unten ist $2A$, also $A = ${tq(v.Am, 'cm')}$.`),
  });
  const brush = maxima({
    id: 'brush', difficulty: 2, title: () => L('An electric toothbrush', 'Eine elektrische Zahnbürste'), pic: PIC.brush, inG: true,
    make: (r) => ({ f: pick(r, [200, 230, 260]), a: pick(r, [1, 1.5, 2]) * 1e-3 }), amp: (p) => p.a,
    text: (p) => L(`The head of a sonic toothbrush vibrates harmonically at ${q(p.f, 'Hz')} with an amplitude of ${q(p.a, 'mm')}. What are its largest speed and its largest acceleration? How many times g is that?`,
      `Der Kopf einer Schallzahnbürste vibriert harmonisch mit ${q(p.f, 'Hz')} und einer Amplitude von ${q(p.a, 'mm')}. Wie gross sind seine grösste Geschwindigkeit und seine grösste Beschleunigung? Das Wievielfache von g ist das?`),
  });
  const boat = maxima({
    id: 'boat', difficulty: 3, title: () => L('A boat on waves', 'Ein Boot auf Wellen'), pic: PIC.boat,
    make: (r) => ({ T: pick(r, [4, 5, 6, 8]), h: pick(r, [0.8, 1, 1.2, 1.6, 2]) }), amp: (p) => p.h / 2,
    text: (p) => L(`A small boat bobs up and down harmonically on long waves: from the crest to the trough it sinks by ${q(p.h, 'm')}, and a wave passes every ${q(p.T, 's')}. What are its largest vertical speed and its largest vertical acceleration?`,
      `Ein kleines Boot schaukelt auf langen Wellen harmonisch auf und ab: Vom Wellenberg ins Wellental sinkt es um ${q(p.h, 'm')}, und alle ${q(p.T, 's')} läuft eine Welle vorbei. Wie gross sind seine grösste vertikale Geschwindigkeit und seine grösste vertikale Beschleunigung?`),
    hint: () => L('From crest to trough is twice the amplitude; the time between two waves is the period.', 'Vom Berg ins Tal ist das Doppelte der Amplitude; die Zeit zwischen zwei Wellen ist die Periode.'),
    pre: (p, v) => L(`From crest to trough is $2A$: $A = ${tq(v.Am, 'm')}$; the period is $T = ${tq(p.T, 's')}$.`, `Vom Berg ins Tal ist $2A$: $A = ${tq(v.Am, 'm')}$; die Periode ist $T = ${tq(p.T, 's')}$.`),
  });
  const quake = maxima({
    id: 'quake', difficulty: 3, title: () => L('An earthquake', 'Ein Erdbeben'), pic: PIC.quake, inG: true,
    make: (r) => ({ f: pick(r, [1, 1.5, 2, 2.5, 3]), a: pick(r, [2, 3, 5, 8, 10]) * 1e-2 }), amp: (p) => p.a,
    text: (p) => L(`In a strong earthquake, the ground moves back and forth roughly harmonically, with an amplitude of ${q(p.a, 'cm')} at ${q(p.f, 'Hz')}. What are the largest speed and the largest acceleration of the ground? How many times g is that? (Buildings are at risk from about 0.3 g.)`,
      `Bei einem starken Erdbeben bewegt sich der Boden ungefähr harmonisch hin und her, mit einer Amplitude von ${q(p.a, 'cm')} bei ${q(p.f, 'Hz')}. Wie gross sind die grösste Geschwindigkeit und die grösste Beschleunigung des Bodens? Das Wievielfache von g ist das? (Ab etwa 0.3 g sind Gebäude gefährdet.)`),
  });
  const tower = maxima({
    id: 'tower', difficulty: 3, title: () => L('A swaying skyscraper', 'Ein schwankender Wolkenkratzer'), pic: PIC.tower, vunit: 'cm/s',
    make: (r) => ({ T: pick(r, [6, 6.8, 7, 8]), a: pick(r, [0.2, 0.3, 0.5, 0.7]) }), amp: (p) => p.a,
    text: (p) => L(`In a typhoon, the top of a skyscraper sways harmonically with a period of ${q(p.T, 's')} and an amplitude of ${q(p.a, 'm')}. What are the largest speed and the largest acceleration at the top? (People feel accelerations from about 0.05 m/s².)`,
      `In einem Taifun schwankt die Spitze eines Wolkenkratzers harmonisch mit einer Periode von ${q(p.T, 's')} und einer Amplitude von ${q(p.a, 'm')}. Wie gross sind die grösste Geschwindigkeit und die grösste Beschleunigung an der Spitze? (Menschen spüren Beschleunigungen ab etwa 0.05 m/s².)`),
    after: (p, v) => (v.amax > 0.05 ? L('Clearly more than people can feel: that is why such towers carry huge pendulums that damp the swaying.', 'Deutlich mehr, als Menschen spüren: Deshalb tragen solche Türme riesige Pendel, die das Schwanken dämpfen.') : L('Just below what people can feel.', 'Knapp unter dem, was Menschen spüren.')),
  });
  const atoms = maxima({
    id: 'atoms', difficulty: 4, title: () => L('Atoms in a crystal', 'Atome in einem Kristall'), pic: PIC.atoms, sci: true, vunit: 'm/s',
    make: (r) => ({ f: pick(r, [2, 5, 8, 10]) * 1e12, a: pick(r, [0.5, 1, 2]) * 1e-11 }), amp: (p) => p.a,
    text: (p) => L(`The atoms of a crystal vibrate around their places, roughly harmonically, with a frequency of ${q(p.f, 'Hz')} and an amplitude of ${q(p.a, 'm')} (a few percent of the distance between neighbours). What are their largest speed and their largest acceleration?`,
      `Die Atome eines Kristalls schwingen ungefähr harmonisch um ihre Plätze, mit einer Frequenz von ${q(p.f, 'Hz')} und einer Amplitude von ${q(p.a, 'm')} (einige Prozent des Abstands zu den Nachbarn). Wie gross sind ihre grösste Geschwindigkeit und ihre grösste Beschleunigung?`),
    after: () => L('Speeds of a few hundred m/s, like those of the molecules in the air, and accelerations of about 10¹⁶ m/s².', 'Geschwindigkeiten von einigen hundert m/s, wie die der Moleküle in der Luft, und Beschleunigungen von etwa 10¹⁶ m/s².'),
  });
  const bird = maxima({
    id: 'bird', difficulty: 2, title: () => L('A hummingbird', 'Ein Kolibri'), pic: PIC.bird, inG: true,
    make: (r) => ({ f: pick(r, [40, 50, 60, 70]), a: pick(r, [2, 2.5, 3, 4]) * 1e-2 }), amp: (p) => p.a,
    text: (p) => L(`A hovering hummingbird beats its wings ${p.f} times per second. The wing tips move up and down roughly harmonically with an amplitude of ${q(p.a, 'cm')}. What are the largest speed and the largest acceleration of a wing tip? How many times g is that?`,
      `Ein schwebender Kolibri schlägt seine Flügel ${p.f}-mal pro Sekunde. Die Flügelspitzen bewegen sich ungefähr harmonisch auf und ab, mit einer Amplitude von ${q(p.a, 'cm')}. Wie gross sind die grösste Geschwindigkeit und die grösste Beschleunigung einer Flügelspitze? Das Wievielfache von g ist das?`),
  });

  // speed and acceleration at a displacement x
  function atX(o) {
    return {
      id: o.id, difficulty: 4, title: o.title,
      make: o.make,
      solve: (p) => { const w = PI2 / p.T; return { w, v: w * Math.sqrt(p.a ** 2 - p.x ** 2), acc: w * w * p.x, vmax: w * p.a }; },
      fields: (p) => [num$('v', 'v', speedUnit((PI2 / p.T) * p.a), L('speed there', 'Geschwindigkeit dort')), num$('acc', 'a', 'm/s²', L('size of the acceleration there', 'Betrag der Beschleunigung dort'))],
      text: o.text,
      hints: () => [L('Between the equilibrium and a turning point: $v = \\omega\\sqrt{A^2 - x^2}$ (from $\\sin^2 + \\cos^2 = 1$).', 'Zwischen Gleichgewichtslage und Umkehrpunkt: $v = \\omega\\sqrt{A^2 - x^2}$ (aus $\\sin^2 + \\cos^2 = 1$).'), L('$a = -\\omega^2 x$: proportional to the displacement, pointing back.', '$a = -\\omega^2 x$: proportional zur Auslenkung, zurück gerichtet.'), HINT_SI()],
      steps: (p, v) => [
        step(L('The angular frequency', 'Die Kreisfrequenz'), `$$${wT$(p.T)}$$`),
        step(L('The speed', 'Die Geschwindigkeit'), `$$v = \\omega\\sqrt{A^2 - x^2} = ${tnum(v.w)}\\,\\mathrm{s^{-1}}\\cdot\\sqrt{(${tq(p.a, 'm')})^2 - (${tq(p.x, 'm')})^2} = ${res(tq(v.v, speedUnit(v.vmax)))}$$` +
          p$(L(`Less than the largest speed $A\\omega = ${tq(v.vmax, speedUnit(v.vmax))}$ at the equilibrium.`, `Weniger als die grösste Geschwindigkeit $A\\omega = ${tq(v.vmax, speedUnit(v.vmax))}$ in der Gleichgewichtslage.`))),
        step(L('The acceleration', 'Die Beschleunigung'), `$$|a| = \\omega^2\\, x = (${tnum(v.w)}\\,\\mathrm{s^{-1}})^2\\cdot ${tq(p.x, 'm')} = ${res(tq(v.acc, 'm/s²'))}$$` + p$(L('It points back to the equilibrium.', 'Sie zeigt zur Gleichgewichtslage zurück.'))),
      ],
      pic: o.pic,
      fig: (p) => { const t1 = (Math.asin(p.x / p.a) * p.T) / PI2; return xfig(p.a, p.T, { dots: [[t1, p.x], [p.T / 2 - t1, p.x]] }); },
    };
  }
  const bouncer = atX({
    id: 'bouncer', title: () => L('A baby bouncer', 'Ein Babyhopser'), pic: PIC.bouncer,
    make: (r) => ({ T: pick(r, [0.8, 1, 1.2]), a: pick(r, [8, 10, 12, 15]) * 1e-2, k: pick(r, [0.4, 0.5, 0.6]) }),
    text: (p) => L(`A baby in a bouncer hangs from a spring and bounces up and down harmonically, ${q(p.a, 'cm')} above and below its resting point, once every ${q(p.T, 's')}. How fast is the baby, and how large is its acceleration, when it is ${q(p.x, 'cm')} above the resting point?`,
      `Ein Baby in einem Babyhopser hängt an einer Feder und federt harmonisch auf und ab, ${q(p.a, 'cm')} über und unter seinen Ruhepunkt, einmal alle ${q(p.T, 's')}. Wie schnell ist das Baby, und wie gross ist seine Beschleunigung, wenn es ${q(p.x, 'cm')} über dem Ruhepunkt ist?`),
  });
  const carx = atX({
    id: 'car', title: () => L('A car on its springs', 'Ein Auto auf seinen Federn'), pic: PIC.car,
    make: (r) => ({ T: pick(r, [0.8, 1, 1.25]), a: pick(r, [2, 3, 4]) * 1e-2, k: pick(r, [0.5, 0.6, 0.75]) }),
    text: (p) => L(`After a bump, the body of a car bounces harmonically on its springs: ${q(p.a, 'cm')} up and down, with a period of ${q(p.T, 's')}. How fast does it move, and how large is its acceleration, when it is ${q(p.x, 'cm')} below its resting position?`,
      `Nach einer Bodenwelle federt die Karosserie eines Autos harmonisch auf und ab: ${q(p.a, 'cm')} nach oben und nach unten, mit einer Periode von ${q(p.T, 's')}. Wie schnell bewegt sie sich, und wie gross ist ihre Beschleunigung, wenn sie ${q(p.x, 'cm')} unter ihrer Ruhelage ist?`),
  });
  for (const pb of [bouncer, carx]) { const mk = pb.make; pb.make = (r) => { const p = mk(r); p.x = sig(p.k * p.a, 2); return p; }; }

  const PROBLEMS = [fork, speaker, brush, bird, needle, boat, quake, tower, bouncer, carx, atoms];

  // ---------------------------------------------------------------- exercises
  function realOf(i, seed) {
    const pb = PROBLEMS[i], p = pb.make(rng(seed)), v = pb.solve(p);
    const fields = pb.fields(p).map((f) => ({ ...f, value: OC.inUnit(v[f.key], f.unit), traps: [] }));
    return {
      scenario: 'real', difficulty: pb.difficulty, title: pb.title(), text: `<p>${pb.text(p)}</p>`,
      fields,
      figure: () => (root.Art ? pb.pic(p) : ''),
      solutionFigure: () => pb.fig(p, v),
      hints: pb.hints(p), solution: pb.steps(p, v),
      results: fields.map((f) => `$${f.sym} = ${tq(v[f.key], f.unit)}$`).join(', '),
      p, v,
    };
  }

  root.OscProblems = { PROBLEMS, realOf };
  if (typeof module !== 'undefined') module.exports = root.OscProblems;
})(typeof window !== 'undefined' ? window : globalThis);
