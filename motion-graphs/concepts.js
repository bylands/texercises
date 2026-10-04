// Exercises on uniform motion from the worksheets C1 (speed as a rate), C2 (velocity as a vector
// in one dimension) and C4 (distance as the area under v(t)), answered by choosing or entering
// numbers instead of drawing:
//   compare    two motions in one s(t) graph: which is faster, and the velocity of one (★1–2)
//   direction  a piecewise uniform s(t): when is v negative, and v in one interval (★2)
//   table      value tables: which vehicles always move backwards, velocities, missing positions (★2–3)
//   strobe     a stroboscope picture of a constantly accelerated cart: its s(t) or v(t) graph,
//              the motion, and (★3) the acceleration (★2–3)
//   area       v(t): displacement and distance between two times, or who is farther from the start (★3–4)
// make(kind, seed, d) gives { kind, id, difficulty, title, text, figure, questions, hints, steps,
// answers, data } in the current language (Lang); data: the motion behind it, for the tests.
// Questions:
//   { type: 'choice', key, prompt, options: [{ html, correct, flag, why }], pics }
//   { type: 'multi', key, prompt, single, options: [...] } (any number right; single: the prompt
//     for one right answer, in the arcade); for a right option, why says why it belongs
//   { type: 'num', key, prompt, ask, sym, unit, value, traps: [{ value, flag, why }], why }
// A wrong option's flag names the misconception behind it (FLAGS), or is null. The numbers need
// no calculator: whole seconds, whole metres, velocities in tenths or halves of m/s.
(function (root) {
  'use strict';

  const Motion = root.Motion || require('./generator.js');
  const Figs = root.Figs || require('./figs.js');
  const Lang = root.Lang || require('./lang.js');
  const L = (en, de) => Lang.L(en, de);
  const { rng } = Motion;
  const { graph, strobe, table, num } = Figs;

  // The misconceptions, with what is right instead.
  const FLAGS = {
    position: () => L('a higher graph means faster or farther', 'ein höherer Graph bedeutet schneller oder weiter'),
    magnitude: () => L('a falling s(t) graph means slower', 'ein fallender s(t)-Graph bedeutet langsamer'),
    crossing: () => L('where the graphs cross, the speeds are equal', 'wo sich die Graphen schneiden, sind die Geschwindigkeiten gleich'),
    below: () => L('s < 0 means v < 0', 's < 0 bedeutet v < 0'),
    negpos: () => L('negative positions mean motion in the negative direction', 'negative Orte bedeuten Bewegung in negativer Richtung'),
    nodt: () => L('Δs instead of Δs/Δt', 'Δs statt Δs/Δt'),
    origin: () => L('s/t instead of Δs/Δt', 's/t statt Δs/Δt'),
    sign: () => L('the sign of the velocity', 'das Vorzeichen der Geschwindigkeit'),
    gaps: () => L('large gaps read as slow', 'grosse Abstände als langsam gelesen'),
    order: () => L('the time order of the dots', 'die zeitliche Reihenfolge der Punkte'),
    height: () => L('the velocity taken for the distance', 'die Geschwindigkeit für den Weg gehalten'),
    unsigned: () => L('distance and displacement mixed up', 'Weg und Verschiebung verwechselt'),
    rect: () => L('a rectangle instead of the trapezoid', 'ein Rechteck statt des Trapezes'),
  };

  // ---------------------------------------------------------------- helpers
  const it = (s) => `<i>${s}</i>`;
  const sub = (q, i) => `<i>${q}</i><sub>${i}</sub>`;
  const val = (x, u) => `${num(round(x))}&nbsp;${u}`;
  const sval = (x, u) => `${round(x) > 0 ? '+' : ''}${num(round(x))}&nbsp;${u}`;
  const round = (x) => Math.round(x * 100) / 100 + 0;
  // a number as plain as the answers (a multiple of 0.05): other trap values would give themselves away
  const nice = (x) => Math.abs(x * 20 - Math.round(x * 20)) < 1e-9;
  const and = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} ${L('and', 'und')} ${xs[xs.length - 1]}`);
  // a right option keeps its flag only in a multi: there, missing it is the mistake
  const opt = (html, correct, flag, why) => ({ html, correct, flag: flag || null, why });
  const choice = (key, prompt, options, pics = false) => ({ type: 'choice', key, prompt, options: options.map((o) => (o.correct ? { ...o, flag: null } : o)), pics });
  const multi = (key, prompt, single, options) => ({ type: 'multi', key, prompt, single, options });
  const numQ = (key, prompt, ask, sym, unit, value, traps, why) =>
    ({ type: 'num', key, prompt, ask, sym, unit, value: round(value), traps: traps.filter((t) => Math.abs(t.value - value) > 0.05 && nice(t.value)).map((t) => ({ ...t, value: round(t.value) })), why });
  const step = (title, text, figure) => ({ title, text, figure });
  const interval = (t0, t1) => `${num(t0)}–${num(t1)}&nbsp;s`;

  // the right answer to a question, as HTML
  function answerOf(q) {
    if (q.type === 'num') return `${q.sym} = ${val(q.value, q.unit)}`;
    const right = q.options.filter((o) => o.correct).map((o) => o.html);
    return q.type === 'multi' ? (right.length ? and(right) : L('none', 'keines')) : right[0];
  }
  function finish(kind, seed, d, ex) {
    ex = { kind, id: `${kind}-${seed}`, seed, difficulty: d, ...ex };
    ex.answers = ex.questions.map(answerOf);
    return ex;
  }

  // The usual explanations.
  const WHY = {
    position: () => L('A graph that lies higher shows a larger position, not a larger speed. The speed is the steepness of the s(t) graph: how many metres s changes per second.',
      'Ein höher liegender Graph zeigt einen grösseren Ort, keine grössere Geschwindigkeit. Die Geschwindigkeit ist die Steilheit des s(t)-Graphen: um wie viele Meter sich s pro Sekunde ändert.'),
    magnitude: () => L('A falling s(t) graph means motion in the negative direction, not slower motion. For the speed, compare how steep the graphs are, whichever way they go.',
      'Ein fallender s(t)-Graph bedeutet Bewegung in negativer Richtung, nicht langsamere Bewegung. Für das Tempo vergleichst du, wie steil die Graphen sind, egal in welche Richtung.'),
    crossing: () => L('Where the graphs cross, both are at the same place at the same moment; that says nothing about their speeds. A straight s(t) graph means a speed that stays the same all the time.',
      'Wo sich die Graphen schneiden, sind beide im selben Moment am selben Ort; das sagt nichts über ihre Geschwindigkeiten. Ein gerader s(t)-Graph bedeutet eine Geschwindigkeit, die die ganze Zeit gleich bleibt.'),
    nodt: () => L('That is the change of position Δs. The velocity is the change per second: divide by the time Δt it takes.',
      'Das ist die Ortsänderung Δs. Die Geschwindigkeit ist die Änderung pro Sekunde: Teile durch die Zeit Δt, die sie dauert.'),
    origin: () => L('That is s/t, the position divided by the time. But the body did not start at s = 0: the velocity is the change of position Δs divided by Δt.',
      'Das ist s/t, der Ort geteilt durch die Zeit. Der Körper startete aber nicht bei s = 0: Die Geschwindigkeit ist die Ortsänderung Δs geteilt durch Δt.'),
    sign: () => L('Check the sign: where s decreases, the body moves in the negative direction, so v is negative.',
      'Achte auf das Vorzeichen: Wo s abnimmt, bewegt sich der Körper in negativer Richtung, also ist v negativ.'),
    position1: () => L('That is a position read off the graph, not a velocity. The velocity is how fast the position changes: Δs/Δt.',
      'Das ist ein am Graphen abgelesener Ort, keine Geschwindigkeit. Die Geschwindigkeit sagt, wie schnell sich der Ort ändert: Δs/Δt.'),
  };

  // ---------------------------------------------------------------- compare (C1.1)
  // Two uniform motions A and B over 10 s, s between −4 and 4 m. ★1: both forward, the slower one
  // always higher. ★2: the faster one moves backwards, and the graphs cross.
  function compare(seed, d) {
    const r = rng(seed);
    d = d || r.pick([1, 2]);
    const T = 10, ints = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
    let fast, slow;
    for (;;) {
      fast = [r.pick(ints), r.pick(ints)];
      slow = [r.pick(ints), r.pick(ints)];
      const vf = (fast[1] - fast[0]) / T, vs = (slow[1] - slow[0]) / T;
      if (Math.abs(vf) - Math.abs(vs) < 0.25 || Math.abs(vs) < 0.2) continue;
      if (d === 1 && !(vf > 0 && vs > 0 && slow[0] > fast[0] && slow[1] > fast[1])) continue;
      if (d === 2 && !(vf < 0 && vs > 0 && (fast[0] - slow[0]) * (fast[1] - slow[1]) < 0 && slow[1] > fast[1])) continue;
      break;
    }
    const fastIsA = r.next() < 0.5;
    const A = fastIsA ? fast : slow, B = fastIsA ? slow : fast;
    const vA = (A[1] - A[0]) / T, vB = (B[1] - B[0]) / T;
    const [F, Sl] = fastIsA ? ['A', 'B'] : ['B', 'A'];
    const cross = (A[0] - B[0]) * (A[1] - B[1]) < 0;
    // both names where the lines are farthest apart, each on the side away from the other line
    const gap = (t) => A[0] + vA * t - (B[0] + vB * t), at = Math.abs(gap(1)) > Math.abs(gap(9)) ? 1 : 9;
    const lines = () => [
      { pts: [[0, A[0]], [T, A[1]]], name: 'A', at, below: gap(at) < 0 },
      { pts: [[0, B[0]], [T, B[1]]], name: 'B', dash: true, at, below: gap(at) > 0 },
    ];
    const axis = { lo: -4, hi: 4, step: 2 };
    const fig = (o = {}) => graph('s', axis, T, lines(), { label: L('Positions of A and B against time', 'Orte von A und B gegen die Zeit'), ...o });
    const wrongSlow = d === 2 ? 'magnitude' : 'position';
    const q1 = choice('faster', L('Which of the two is faster?', 'Welches der beiden ist schneller?'), r.shuffle([
      opt(L(`${F} is faster`, `${F} ist schneller`), true, null, ''),
      opt(L(`${Sl} is faster`, `${Sl} ist schneller`), false, wrongSlow, WHY[wrongSlow]()),
      opt(L('Both are equally fast', 'Beide sind gleich schnell'), false, cross ? 'crossing' : null,
        cross ? WHY.crossing() : L('Compare the steepness of the two lines: one changes its position by more metres per second.', 'Vergleiche die Steilheit der beiden Geraden: Eine ändert ihren Ort um mehr Meter pro Sekunde.')),
      opt(L(`First ${Sl}, then ${F}`, `Zuerst ${Sl}, dann ${F}`), false, 'crossing',
        L('Each graph is a straight line, so each speed stays the same all the time. Where the graphs cross, the two are only at the same place.', 'Jeder Graph ist eine Gerade, also bleibt jede Geschwindigkeit die ganze Zeit gleich. Wo sich die Graphen schneiden, sind die beiden nur am selben Ort.')),
    ]));
    const Q = d === 2 ? F : r.pick(['A', 'B']), P = Q === 'A' ? A : B, vQ = Q === 'A' ? vA : vB;
    const q2 = numQ('v', L(`The velocity of ${Q}:`, `Die Geschwindigkeit von ${Q}:`), L(`What is the velocity of ${Q}?`, `Wie gross ist die Geschwindigkeit von ${Q}?`),
      sub('v', Q), 'm/s', vQ, [
        { value: P[1], flag: 'position', why: WHY.position1() },
        { value: P[1] - P[0], flag: 'nodt', why: WHY.nodt() },
        { value: -vQ, flag: 'sign', why: WHY.sign() },
        { value: P[1] / T, flag: 'origin', why: WHY.origin() },
      ], L(`Read where ${Q} is at t = 0 and at t = 10 s; v = Δs/Δt.`, `Lies ab, wo ${Q} bei t = 0 und bei t = 10 s ist; v = Δs/Δt.`));
    const line = (n, p, v) => L(`${n}: from ${val(p[0], 'm')} at t = 0 to ${val(p[1], 'm')} at t = 10 s, so ${sub('v', n)} = (${num(p[1])} m − ${p[0] < 0 ? `(${num(p[0])} m)` : `${num(p[0])} m`}) / 10 s = ${sval(v, 'm/s')}`,
      `${n}: von ${val(p[0], 'm')} bei t = 0 nach ${val(p[1], 'm')} bei t = 10 s, also ${sub('v', n)} = (${num(p[1])} m − ${p[0] < 0 ? `(${num(p[0])} m)` : `${num(p[0])} m`}) / 10 s = ${sval(v, 'm/s')}`);
    const dots = [[0, A[0]], [T, A[1]], [0, B[0]], [T, B[1]]];
    return finish('compare', seed, d, {
      data: { A, B, fast: F, asked: Q },
      title: L('Who is faster?', 'Wer ist schneller?'),
      text: L('<p>Two vehicles A and B move uniformly along a straight road. The graph shows their positions against time.</p>',
        '<p>Zwei Fahrzeuge A und B bewegen sich gleichförmig auf einer geraden Strasse. Der Graph zeigt ihre Orte gegen die Zeit.</p>'),
      figure: fig(),
      questions: [q1, q2],
      hints: [
        L('The speed is the steepness of the s(t) graph: how many metres the position changes per second. How high a graph lies is the position, not the speed.',
          'Die Geschwindigkeit ist die Steilheit des s(t)-Graphen: um wie viele Meter sich der Ort pro Sekunde ändert. Wie hoch ein Graph liegt, ist der Ort, nicht die Geschwindigkeit.'),
        L('Read off where each line is at t = 0 and at t = 10 s. The change Δs divided by Δt = 10 s is the velocity.', 'Lies ab, wo jede Gerade bei t = 0 und bei t = 10 s ist. Die Änderung Δs geteilt durch Δt = 10 s ist die Geschwindigkeit.'),
        `${line('A', A, vA)}; ${line('B', B, vB)}.`,
        L(`Compare the sizes |${sub('v', 'A')}| = ${val(Math.abs(vA), 'm/s')} and |${sub('v', 'B')}| = ${val(Math.abs(vB), 'm/s')}: for the speed, the direction (the sign) does not count.`,
          `Vergleiche die Beträge |${sub('v', 'A')}| = ${val(Math.abs(vA), 'm/s')} und |${sub('v', 'B')}| = ${val(Math.abs(vB), 'm/s')}: Für das Tempo zählt die Richtung (das Vorzeichen) nicht.`),
      ],
      steps: [
        step(L('Reading off', 'Ablesen'), L('Where is each vehicle at the start and at the end? The marked points can be read from the grid.', 'Wo ist jedes Fahrzeug am Anfang und am Ende? Die markierten Punkte lassen sich am Raster ablesen.'), fig({ dots })),
        step(L('Velocities', 'Geschwindigkeiten'), `${line('A', A, vA)}.<br>${line('B', B, vB)}.`, fig({ dots })),
        step(L('Comparing', 'Vergleichen'), L(`${F} changes its position by ${val(Math.abs(fastIsA ? vA : vB), 'm')} per second, ${Sl} only by ${val(Math.abs(fastIsA ? vB : vA), 'm')}: <b>${F} is faster</b>.${d === 2 ? ` ${F} moves in the negative direction, but that does not make it slower.` : ` ${Sl} lies higher, but that is its position, not its speed.`}`,
          `${F} ändert seinen Ort pro Sekunde um ${val(Math.abs(fastIsA ? vA : vB), 'm')}, ${Sl} nur um ${val(Math.abs(fastIsA ? vB : vA), 'm')}: <b>${F} ist schneller</b>.${d === 2 ? ` ${F} fährt in negativer Richtung, ist deshalb aber nicht langsamer.` : ` ${Sl} liegt höher, aber das ist sein Ort, nicht sein Tempo.`}`), fig()),
      ],
    });
  }

  // ---------------------------------------------------------------- direction (C2.1)
  // A piecewise uniform motion over 10 s: v < 0 where s decreases, also above the t axis, and
  // v > 0 where s increases, also below it.
  function direction(seed, d) {
    const r = rng(seed);
    d = d || 2;
    let ts, ps;
    for (;;) {
      const n = r.pick([4, 5]);
      ts = [0];
      while (ts.length < n) ts.push(ts[ts.length - 1] + r.pick([1, 2, 3]));
      if (ts[ts.length - 1] >= 10) continue;
      ts.push(10);
      ps = ts.map(() => r.pick([-4, -3, -2, -1, 0, 1, 2, 3, 4]));
      const pieces = ts.slice(1).map((t1, i) => ({ t0: ts[i], t1, s0: ps[i], s1: ps[i + 1] }));
      if (pieces.some((p, i) => i && (p.s1 - p.s0) / (p.t1 - p.t0) === (pieces[i - 1].s1 - pieces[i - 1].s0) / (pieces[i - 1].t1 - pieces[i - 1].t0))) continue;
      const negAbove = pieces.some((p) => p.s1 < p.s0 && Math.min(p.s0, p.s1) >= 0);
      const posBelow = pieces.some((p) => p.s1 > p.s0 && Math.max(p.s0, p.s1) <= 0);
      const nNeg = pieces.filter((p) => p.s1 < p.s0).length;
      // no calculator: every velocity a multiple of 0.5 m/s
      if (pieces.some((p) => !Number.isInteger((2 * (p.s1 - p.s0)) / (p.t1 - p.t0)))) continue;
      if (negAbove && posBelow && nNeg >= 1 && nNeg <= pieces.length - 2) break;
    }
    const pieces = ts.slice(1).map((t1, i) => ({ t0: ts[i], t1, s0: ps[i], s1: ps[i + 1], v: (ps[i + 1] - ps[i]) / (t1 - ts[i]) }));
    const pts = ts.map((t, i) => [t, ps[i]]);
    const fig = (o = {}) => graph('s', { lo: -4, hi: 4, step: 2 }, 10, [{ pts }], { label: L('Position against time', 'Ort gegen die Zeit'), ...o });
    const options = pieces.map((p) => {
      const neg = p.v < 0, below = Math.max(p.s0, p.s1) <= 0, above = Math.min(p.s0, p.s1) >= 0;
      if (neg) {
        return opt(interval(p.t0, p.t1), true, above ? 'below' : null, above
          ? L(`Here s is positive, but it decreases: the body moves in the negative direction, so v < 0. The sign of v is the direction of the slope, not the sign of s.`,
            `Hier ist s positiv, nimmt aber ab: Der Körper bewegt sich in negativer Richtung, also v < 0. Das Vorzeichen von v ist die Richtung der Steigung, nicht das Vorzeichen von s.`)
          : L('Here s decreases, so v is negative.', 'Hier nimmt s ab, also ist v negativ.'));
      }
      if (p.v === 0) return opt(interval(p.t0, p.t1), false, null, L('Here s stays the same: the body is at rest, v = 0.', 'Hier bleibt s gleich: Der Körper ruht, v = 0.'));
      return opt(interval(p.t0, p.t1), false, below ? 'below' : null, below
        ? L('Here s is negative, but it increases: the body moves in the positive direction, so v > 0.', 'Hier ist s negativ, nimmt aber zu: Der Körper bewegt sich in positiver Richtung, also v > 0.')
        : L('Here s increases, so v is positive.', 'Hier nimmt s zu, also ist v positiv.'));
    });
    const q1 = multi('neg', L('In which time intervals is the velocity negative? Choose all.', 'In welchen Zeitintervallen ist die Geschwindigkeit negativ? Wähle alle.'),
      L('In which time interval is the velocity negative?', 'In welchem Zeitintervall ist die Geschwindigkeit negativ?'), options);
    const negs = pieces.filter((p) => p.v < 0), P = negs.find((p) => Math.min(p.s0, p.s1) >= 0) || negs[0];
    const q2 = numQ('v', L(`The velocity between ${interval(P.t0, P.t1)}:`, `Die Geschwindigkeit zwischen ${interval(P.t0, P.t1)}:`),
      L(`What is the velocity between ${interval(P.t0, P.t1)}?`, `Wie gross ist die Geschwindigkeit zwischen ${interval(P.t0, P.t1)}?`), it('v'), 'm/s', P.v, [
        { value: -P.v, flag: 'sign', why: WHY.sign() },
        { value: P.s1 - P.s0, flag: 'nodt', why: WHY.nodt() },
        { value: P.s1, flag: 'position', why: WHY.position1() },
      ], L('v = Δs/Δt for this interval.', 'v = Δs/Δt für dieses Intervall.'));
    const desc = (p) => (p.v === 0 ? L(`${interval(p.t0, p.t1)}: s stays at ${val(p.s0, 'm')}, the body is at rest (v = 0)`, `${interval(p.t0, p.t1)}: s bleibt bei ${val(p.s0, 'm')}, der Körper ruht (v = 0)`)
      : L(`${interval(p.t0, p.t1)}: from ${val(p.s0, 'm')} to ${val(p.s1, 'm')}, ${p.v > 0 ? 'forward' : 'backward'}, v = ${num(p.s1 - p.s0)} m / ${num(p.t1 - p.t0)} s = ${sval(p.v, 'm/s')}`,
        `${interval(p.t0, p.t1)}: von ${val(p.s0, 'm')} nach ${val(p.s1, 'm')}, ${p.v > 0 ? 'vorwärts' : 'rückwärts'}, v = ${num(p.s1 - p.s0)} m / ${num(p.t1 - p.t0)} s = ${sval(p.v, 'm/s')}`));
    return finish('direction', seed, d, {
      data: { pieces, asked: P },
      title: L('Forward and backward', 'Vorwärts und rückwärts'),
      text: L('<p>A body moves along a straight line, at constant velocity in each time interval. The graph shows its position against time.</p>',
        '<p>Ein Körper bewegt sich auf einer Geraden, in jedem Zeitintervall mit konstanter Geschwindigkeit. Der Graph zeigt seinen Ort gegen die Zeit.</p>'),
      figure: fig(),
      questions: [q1, q2],
      hints: [
        L('The sign of v tells the direction of motion: v > 0 where s increases (the graph rises), v < 0 where s decreases (the graph falls).', 'Das Vorzeichen von v gibt die Bewegungsrichtung an: v > 0, wo s zunimmt (der Graph steigt), v < 0, wo s abnimmt (der Graph fällt).'),
        L('Whether s itself is positive or negative does not matter: that is where the body is, not where it is going.', 'Ob s selbst positiv oder negativ ist, spielt keine Rolle: Das sagt, wo der Körper ist, nicht wohin er sich bewegt.'),
        L(`Go through the intervals one by one: ${pieces.map((p) => interval(p.t0, p.t1)).join(', ')}. Does s rise, fall or stay the same?`, `Geh die Intervalle einzeln durch: ${pieces.map((p) => interval(p.t0, p.t1)).join(', ')}. Steigt s, fällt s oder bleibt s gleich?`),
        L(`The graph falls in ${and(negs.map((p) => interval(p.t0, p.t1)))}.`, `Der Graph fällt in ${and(negs.map((p) => interval(p.t0, p.t1)))}.`),
      ],
      steps: [
        ...pieces.map((p, i) => step(L(`Interval ${i + 1}`, `Intervall ${i + 1}`), `${desc(p)}.`, fig({ band: [p.t0, p.t1], dots: [[p.t0, p.s0], [p.t1, p.s1]] }))),
        step(L('Negative velocity', 'Negative Geschwindigkeit'), L(`v < 0 in ${and(negs.map((p) => interval(p.t0, p.t1)))}: there the graph falls, wherever it lies.`, `v < 0 in ${and(negs.map((p) => interval(p.t0, p.t1)))}: Dort fällt der Graph, egal wo er liegt.`), fig()),
      ],
    });
  }

  // ---------------------------------------------------------------- table (C2.3, C2.5)
  // ★2: four vehicles every 5 s; which move backwards all the time, and the velocity of the
  // uniform one. ★3: two uniform vehicles with gaps in the table; their velocities and two
  // missing positions.
  function tableEx(seed, d) {
    const r = rng(seed);
    d = d || r.pick([2, 3]);
    return d === 2 ? table4(r, seed) : table2(r, seed);
  }

  function table4(r, seed) {
    const times = [0, 5, 10, 15, 20, 25, 30];
    const make = {
      down: () => { const s0 = r.pick([18, 20, 24, 25, 30]), ds = r.pick([-2, -3, -4]); return { kind: 'down', values: times.map((t, k) => s0 + ds * k), back: true, uniform: true }; },
      negdown: () => { const gaps = r.pick([[8, 7, 6, 5, 4, 3], [2, 3, 4, 5, 6, 7], [5, 5, 4, 4, 3, 3]]), s0 = r.pick([0, -2, 3]); let s = s0; return { kind: 'negdown', values: [s0, ...gaps.map((g) => (s -= g))], back: true }; },
      negup: () => { const s0 = r.pick([-30, -28, -25]), ds = r.pick([3, 4]); return { kind: 'negup', values: times.map((t, k) => s0 + ds * k), back: false, uniform: true }; },
      backforth: () => { const s0 = r.pick([-10, -6]), ds = r.pick([4, 5]); return { kind: 'backforth', values: times.map((t, k) => s0 - ds * Math.min(k, 3) + ds * Math.max(0, k - 3)), back: false }; },
      forthback: () => { const s0 = r.pick([-8, -6]), up = r.pick([6, 5]); return { kind: 'forthback', values: [s0, s0 + up, s0 + 2 * up, s0 + 2 * up - 2, s0 + 2 * up - 4, s0 + 2 * up - 6, s0 + 2 * up - 8], back: false }; },
    };
    const kinds = r.shuffle(['down', 'negdown', 'negup', r.pick(['backforth', 'forthback'])]);
    const names = ['A', 'B', 'C', 'D'];
    const rows = kinds.map((k, i) => ({ name: names[i], ...make[k]() }));
    const fig = () => table(times, rows.map((x) => ({ name: x.name, values: x.values })));
    const allNeg = (x) => x.values.every((v) => v < 0);
    const options = rows.map((x) => {
      if (x.back) {
        return opt(x.name, true, x.values.some((v) => v > 0) ? 'negpos' : null, x.values.some((v) => v > 0)
          ? L(`${x.name}: the positions are positive, but they decrease every time: ${x.name} moves in the negative direction all the time.`, `${x.name}: Die Orte sind positiv, nehmen aber jedes Mal ab: ${x.name} bewegt sich die ganze Zeit in negativer Richtung.`)
          : L(`${x.name}: the position decreases from one time to the next, every time.`, `${x.name}: Der Ort nimmt von einem Zeitpunkt zum nächsten jedes Mal ab.`));
      }
      if (x.kind === 'negup') {
        return opt(x.name, false, 'negpos', L(`${x.name}: the positions are negative, but they increase: ${x.name} moves in the positive direction. The direction is in the change of s, not in its sign.`,
          `${x.name}: Die Orte sind negativ, nehmen aber zu: ${x.name} bewegt sich in positiver Richtung. Die Richtung steckt in der Änderung von s, nicht in seinem Vorzeichen.`));
      }
      return opt(x.name, false, allNeg(x) ? 'negpos' : null, L(`${x.name}: the position decreases only for a while and then increases again: ${x.name} turns around.`, `${x.name}: Der Ort nimmt nur eine Zeit lang ab und dann wieder zu: ${x.name} kehrt um.`));
    });
    const q1 = multi('back', L('Which vehicles move in the negative direction all the time? Choose all.', 'Welche Fahrzeuge bewegen sich die ganze Zeit in negativer Richtung? Wähle alle.'),
      L('Which vehicle moves in the negative direction all the time?', 'Welches Fahrzeug bewegt sich die ganze Zeit in negativer Richtung?'), options);
    const U = rows.find((x) => x.kind === 'down'), v = (U.values[1] - U.values[0]) / 5;
    const q2 = numQ('v', L(`The velocity of ${U.name}:`, `Die Geschwindigkeit von ${U.name}:`), L(`What is the velocity of ${U.name}?`, `Wie gross ist die Geschwindigkeit von ${U.name}?`), sub('v', U.name), 'm/s', v, [
      { value: U.values[1] - U.values[0], flag: 'nodt', why: WHY.nodt() },
      { value: -v, flag: 'sign', why: WHY.sign() },
      { value: U.values[6] / 30, flag: 'origin', why: WHY.origin() },
    ], L(`${U.name} moves uniformly: v = Δs/Δt between any two times.`, `${U.name} bewegt sich gleichförmig: v = Δs/Δt zwischen zwei beliebigen Zeitpunkten.`));
    const backs = rows.filter((x) => x.back).map((x) => x.name);
    return finish('table', seed, 2, {
      data: { times, rows, uniform: U.name },
      title: L('Four vehicles', 'Vier Fahrzeuge'),
      text: L('<p>The table gives the positions of four vehicles A, B, C and D on a straight road every 5 seconds.</p>', '<p>Die Tabelle gibt die Orte von vier Fahrzeugen A, B, C und D auf einer geraden Strasse alle 5 Sekunden an.</p>'),
      figure: fig(),
      questions: [q1, q2],
      hints: [
        L('A vehicle moves in the negative direction when its position decreases. Look at the changes from one column to the next, not at the signs of the positions.', 'Ein Fahrzeug bewegt sich in negativer Richtung, wenn sein Ort abnimmt. Schau auf die Änderungen von einer Spalte zur nächsten, nicht auf die Vorzeichen der Orte.'),
        L('"All the time" means: every change must be negative. One increase is enough to rule a vehicle out.', '«Die ganze Zeit» heisst: Jede Änderung muss negativ sein. Eine einzige Zunahme genügt, um ein Fahrzeug auszuschliessen.'),
        L(`${U.name} changes by the same amount every 5 s, so it moves uniformly: v = Δs/Δt.`, `${U.name} ändert sich alle 5 s um gleich viel, bewegt sich also gleichförmig: v = Δs/Δt.`),
        L(`${U.name}: Δs = ${num(U.values[1] - U.values[0])} m in Δt = 5 s.`, `${U.name}: Δs = ${num(U.values[1] - U.values[0])} m in Δt = 5 s.`),
      ],
      steps: [
        step(L('The changes', 'Die Änderungen'), rows.map((x) => `${x.name}: ${x.values.slice(1).map((v2, k) => `${v2 - x.values[k] > 0 ? '+' : ''}${num(v2 - x.values[k])}`).join(', ')} m`).join('<br>'), fig()),
        step(L('Always backwards', 'Immer rückwärts'), L(`Only ${and(backs)} ${backs.length > 1 ? 'decrease' : 'decreases'} every time. Negative positions alone do not mean negative direction.`, `Nur ${and(backs)} ${backs.length > 1 ? 'nehmen' : 'nimmt'} jedes Mal ab. Negative Orte allein bedeuten keine negative Richtung.`), fig()),
        step(L('Velocity', 'Geschwindigkeit'), L(`${U.name}: v = Δs/Δt = ${num(U.values[1] - U.values[0])} m / 5 s = ${sval(v, 'm/s')}.`, `${U.name}: v = Δs/Δt = ${num(U.values[1] - U.values[0])} m / 5 s = ${sval(v, 'm/s')}.`), fig()),
      ],
    });
  }

  function table2(r, seed) {
    const times = [0, 2, 4, 6, 10, 20];
    const vs = [-3, -2.5, -2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 2.5, 3];
    let A, B;
    for (;;) {
      A = { s0: r.pick([-6, -4, -2, 0, 2, 4, 6]), v: r.pick(vs) };
      B = { s0: r.pick([-8, -5, 5, 8, 10]), v: r.pick(vs) };
      if (A.v !== B.v && Math.sign(A.v) !== Math.sign(B.v) && A.s0 !== 0) break;
    }
    const s = (m, t) => m.s0 + m.v * t;
    // known: A at t = 0 and 4 s; B at 2 and 6 s (as in C2.5: the start of B is missing)
    const known = { A: [0, 2], B: [1, 3] };
    // the positions asked for are named in the table; the other gaps stay empty
    const asked = { A: [5], B: [0] };
    const rows = [['A', A], ['B', B]].map(([n, m]) => ({ name: n, values: times.map((t, k) => (known[n].includes(k) ? s(m, t) : asked[n].includes(k) ? null : '')) }));
    const fig = () => table(times, rows);
    const dtB = 4, dsB = s(B, 6) - s(B, 2);
    const qs = [
      numQ('vA', L('The velocity of A:', 'Die Geschwindigkeit von A:'), L('What is the velocity of A?', 'Wie gross ist die Geschwindigkeit von A?'), sub('v', 'A'), 'm/s', A.v, [
        { value: s(A, 4) - s(A, 0), flag: 'nodt', why: WHY.nodt() }, { value: -A.v, flag: 'sign', why: WHY.sign() }, { value: s(A, 4) / 4, flag: 'origin', why: WHY.origin() },
      ], L('v = Δs/Δt from the two known positions of A.', 'v = Δs/Δt aus den zwei bekannten Orten von A.')),
      numQ('vB', L('The velocity of B:', 'Die Geschwindigkeit von B:'), L('What is the velocity of B?', 'Wie gross ist die Geschwindigkeit von B?'), sub('v', 'B'), 'm/s', B.v, [
        { value: dsB, flag: 'nodt', why: WHY.nodt() }, { value: -B.v, flag: 'sign', why: WHY.sign() }, { value: s(B, 6) / 6, flag: 'origin', why: WHY.origin() },
      ], L('v = Δs/Δt from the two known positions of B.', 'v = Δs/Δt aus den zwei bekannten Orten von B.')),
      numQ('sA', L('The position of A at 20 s:', 'Der Ort von A bei 20 s:'), L('Where is A at t = 20 s?', 'Wo ist A bei t = 20 s?'), `${sub('s', 'A')}(20&nbsp;s)`, 'm', s(A, 20), [
        { value: A.v * 20, flag: 'origin', why: L('v · t is how far A has moved since t = 0; add the position where it started.', 'v · t ist, wie weit sich A seit t = 0 bewegt hat; zähle den Ort dazu, wo es gestartet ist.') },
        { value: A.s0 - A.v * 20, flag: 'sign', why: WHY.sign() },
      ], L('s = s₀ + v · t, with the position s₀ at t = 0.', 's = s₀ + v · t, mit dem Ort s₀ bei t = 0.')),
      numQ('sB', L('The position of B at 0 s:', 'Der Ort von B bei 0 s:'), L('Where was B at t = 0?', 'Wo war B bei t = 0?'), `${sub('s', 'B')}(0)`, 'm', B.s0, [
        { value: s(B, 2) + B.v * 2, flag: 'sign', why: L('Going back in time, the position changes the other way: s(0) = s(2 s) − v · 2 s.', 'Rückwärts in der Zeit ändert sich der Ort umgekehrt: s(0) = s(2 s) − v · 2 s.') },
        { value: s(B, 2), flag: null, why: L('That is the position at 2 s. B was already moving before.', 'Das ist der Ort bei 2 s. B war schon vorher unterwegs.') },
      ], L('Go back 2 s from the position at 2 s.', 'Geh von dem Ort bei 2 s um 2 s zurück.')),
    ];
    return finish('table', seed, 3, {
      data: { A, B },
      title: L('Completing a value table', 'Wertetabelle ergänzen'),
      text: L('<p>Two vehicles A and B move uniformly. The table gives some of their positions; complete it.</p>', '<p>Zwei Fahrzeuge A und B bewegen sich gleichförmig. Die Tabelle gibt einige ihrer Orte an; ergänze sie.</p>'),
      figure: fig(),
      questions: qs,
      hints: [
        L('Uniform motion: the position changes by the same amount in every second. So v = Δs/Δt from any two known positions.', 'Gleichförmige Bewegung: Der Ort ändert sich in jeder Sekunde um gleich viel. Also v = Δs/Δt aus zwei beliebigen bekannten Orten.'),
        L(`A: Δs = ${num(s(A, 4))} m − ${A.s0 < 0 ? `(${num(A.s0)} m)` : `${num(A.s0)} m`} in Δt = 4 s. B: Δs = ${num(s(B, 6))} m − ${s(B, 2) < 0 ? `(${num(s(B, 2))} m)` : `${num(s(B, 2))} m`} in Δt = 4 s.`,
          `A: Δs = ${num(s(A, 4))} m − ${A.s0 < 0 ? `(${num(A.s0)} m)` : `${num(A.s0)} m`} in Δt = 4 s. B: Δs = ${num(s(B, 6))} m − ${s(B, 2) < 0 ? `(${num(s(B, 2))} m)` : `${num(s(B, 2))} m`} in Δt = 4 s.`),
        L('A missing position: start from a known one and add v · Δt (going back in time, Δt is negative).', 'Ein fehlender Ort: Geh von einem bekannten aus und zähle v · Δt dazu (rückwärts in der Zeit ist Δt negativ).'),
      ],
      steps: [
        step(L('Velocity of A', 'Geschwindigkeit von A'), L(`${sub('v', 'A')} = Δs/Δt = (${num(s(A, 4))} m − ${A.s0 < 0 ? `(${num(A.s0)} m)` : `${num(A.s0)} m`}) / 4 s = ${sval(A.v, 'm/s')}.`, `${sub('v', 'A')} = Δs/Δt = (${num(s(A, 4))} m − ${A.s0 < 0 ? `(${num(A.s0)} m)` : `${num(A.s0)} m`}) / 4 s = ${sval(A.v, 'm/s')}.`), fig()),
        step(L('Velocity of B', 'Geschwindigkeit von B'), L(`${sub('v', 'B')} = (${num(s(B, 6))} m − ${s(B, 2) < 0 ? `(${num(s(B, 2))} m)` : `${num(s(B, 2))} m`}) / ${dtB} s = ${sval(B.v, 'm/s')}.`, `${sub('v', 'B')} = (${num(s(B, 6))} m − ${s(B, 2) < 0 ? `(${num(s(B, 2))} m)` : `${num(s(B, 2))} m`}) / ${dtB} s = ${sval(B.v, 'm/s')}.`), fig()),
        step(L('Missing positions', 'Fehlende Orte'), L(`${sub('s', 'A')}(20 s) = ${num(A.s0)} m + (${sval(A.v, 'm/s')}) · 20 s = ${val(s(A, 20), 'm')}. ${sub('s', 'B')}(0) = ${num(s(B, 2))} m − (${sval(B.v, 'm/s')}) · 2 s = ${val(B.s0, 'm')}.`,
          `${sub('s', 'A')}(20 s) = ${num(A.s0)} m + (${sval(A.v, 'm/s')}) · 20 s = ${val(s(A, 20), 'm')}. ${sub('s', 'B')}(0) = ${num(s(B, 2))} m − (${sval(B.v, 'm/s')}) · 2 s = ${val(B.s0, 'm')}.`), fig()),
      ],
    });
  }

  // ---------------------------------------------------------------- strobe (C1.3, C1.4)
  // A cart with constant acceleration, one dot per second on a number line from −7 to 7 m:
  // s(t) = s₀ + v₀·t + a·t²/2. The distances moved in successive seconds then change by the same
  // amount a·(1 s)² each second; each one is the mean velocity in that second, which the cart
  // reaches in its middle, so v(t) is the straight line through them. The patterns below keep
  // the positions whole metres. ★2: which s(t) graph fits; ★3: which v(t) graph, and the
  // acceleration.
  const PATTERNS = [
    { gaps: [1, 2, 3, 4], how: 'speedup' },
    { gaps: [2, 3, 4, 5], how: 'speedup' },
    { gaps: [1, 3, 5], how: 'speedup' }, // from rest
    { gaps: [4, 3, 2, 1], how: 'slowdown' },
    { gaps: [5, 3, 1], how: 'slowdown' }, // to rest
    { gaps: [3, 1, -1, -3, -5], how: 'turn' },
    { gaps: [5, 3, 1, -1, -3], how: 'turn' },
  ];
  function strobeEx(seed, d) {
    const r = rng(seed);
    d = d || r.pick([2, 3]);
    const pat = r.pick(PATTERNS), dir = r.pick([1, -1]);
    const gaps = pat.gaps.map((g) => dir * g), n = gaps.length;
    const acc = gaps[1] - gaps[0];                       // m/s²
    const v0 = gaps[0] - acc / 2;                        // m/s, at t = 0
    const posOf = (gs, x0) => gs.reduce((xs, g) => [...xs, xs[xs.length - 1] + g], [x0]);
    // the wrong patterns: the distances in the opposite order (large ↔ small, the opposite
    // acceleration), the time order reversed, and a steady motion between the same ends
    const inv = gaps.slice().reverse();
    // a start that keeps the motion and the reversed one on the number line
    const span = [...posOf(gaps, 0), ...posOf(inv, 0)], lo = Math.min(...span), hi = Math.max(...span);
    const x0 = r.pick(Array.from({ length: 15 }, (x, k) => k - 7).filter((x) => x + lo >= -7 && x + hi <= 7));
    const xs = posOf(gaps, x0);
    const sAt = (gs, x, t) => { const a = gs[1] - gs[0], u = gs[0] - a / 2; return x + u * t + (a * t * t) / 2; };
    const curve = (gs, x) => Array.from({ length: 4 * n + 1 }, (z, k) => [k / 4, sAt(gs, x, k / 4)]);
    const sAxis = { lo: -8, hi: 8, step: 4 }, vAxis = { lo: -6, hi: 6, step: 2 };
    const sGraph = (pts, o = {}) => graph('s', sAxis, n, [{ pts }], { label: L('Position against time', 'Ort gegen die Zeit'), ...o });
    const vLine = (gs) => { const a = gs[1] - gs[0], u = gs[0] - a / 2; return [[0, u], [n, u + a * n]]; };
    const vGraph = (pts, o = {}) => graph('v', vAxis, n, [{ pts }], { label: L('Velocity against time', 'Geschwindigkeit gegen die Zeit'), ...o });
    const steps = (gs) => gs.flatMap((g, k) => [[k, g], [k + 1, g]]);
    const means = gaps.map((g, k) => [k + 0.5, g]);
    const WHYG = {
      gaps: () => L('Large gaps between neighbouring dots mean many metres in one second: fast, not slow. Read the dots in the order of their times.', 'Grosse Abstände zwischen benachbarten Punkten bedeuten viele Meter in einer Sekunde: schnell, nicht langsam. Lies die Punkte in der Reihenfolge ihrer Zeiten.'),
      order: () => L('Start at t = 0: the graph starts where the dot of t = 0 is, and follows the dots in the order of their times.', 'Beginne bei t = 0: Der Graph beginnt dort, wo der Punkt von t = 0 liegt, und folgt den Punkten in der Reihenfolge ihrer Zeiten.'),
      steady: () => L('This graph has the right start and end, but a constant velocity. In the picture, the distances between the dots change: the velocity changes.', 'Dieser Graph hat den richtigen Anfang und das richtige Ende, aber eine konstante Geschwindigkeit. Im Bild ändern sich die Abstände zwischen den Punkten: Die Geschwindigkeit ändert sich.'),
      sign: () => L(`At first the dots move towards ${dir > 0 ? 'larger' : 'smaller'} s, so v starts ${dir > 0 ? 'positive' : 'negative'}.`, `Zuerst wandern die Punkte zu ${dir > 0 ? 'grösseren' : 'kleineren'} s, also ist v zuerst ${dir > 0 ? 'positiv' : 'negativ'}.`),
      jumps: () => L('With a constant acceleration, the velocity changes steadily, not in jumps once a second: the distance per second is only its mean in that second, reached in its middle.', 'Bei konstanter Beschleunigung ändert sich die Geschwindigkeit gleichmässig, nicht sprunghaft einmal pro Sekunde: Der Abstand pro Sekunde ist nur ihr Mittelwert in dieser Sekunde, erreicht in deren Mitte.'),
    };
    const questions = [];
    if (d === 2) {
      questions.push(choice('graph', L('Which s(t) graph belongs to this motion?', 'Welcher s(t)-Graph gehört zu dieser Bewegung?'), r.shuffle([
        opt(sGraph(curve(gaps, x0)), true, null, ''),
        opt(sGraph(curve(inv, x0)), false, 'gaps', WHYG.gaps()),
        opt(sGraph(curve(gaps, x0).map(([t]) => [t, sAt(gaps, x0, n - t)])), false, 'order', WHYG.order()),
        opt(sGraph([[0, xs[0]], [n, xs[n]]]), false, null, WHYG.steady()),
      ]), true));
    } else {
      questions.push(choice('graph', L('Which v(t) graph belongs to this motion?', 'Welcher v(t)-Graph gehört zu dieser Bewegung?'), r.shuffle([
        opt(vGraph(vLine(gaps)), true, null, ''),
        opt(vGraph(vLine(inv)), false, 'gaps', WHYG.gaps()),
        opt(vGraph(vLine(gaps.map((g) => -g))), false, 'sign', WHYG.sign()),
        opt(vGraph(steps(gaps)), false, null, WHYG.jumps()),
      ]), true));
    }
    // how the cart moves, as the answer and in the sentence "So the cart …"
    const HOW = {
      speedup: () => L('gets faster and faster', 'wird immer schneller'),
      slowdown: () => L('gets slower and slower', 'wird immer langsamer'),
      steady: () => L('moves at a steady speed', 'fährt immer gleich schnell'),
      turn: () => L('slows down and turns back', 'bremst ab und kehrt um'),
    };
    const invHow = { speedup: 'slowdown', slowdown: 'speedup', turn: 'steady' }[pat.how];
    questions.push(choice('how', L('How does the cart move?', 'Wie bewegt sich der Wagen?'), r.shuffle(['speedup', 'slowdown', 'steady', 'turn'].map((h) =>
      opt(HOW[h](), h === pat.how, h === invHow && pat.how !== 'turn' ? 'gaps' : null, h === invHow && pat.how !== 'turn' ? WHYG.gaps()
        : h === 'turn' ? L('The dots keep moving the same way; the cart does not come back.', 'Die Punkte wandern immer in dieselbe Richtung; der Wagen kommt nicht zurück.')
          : pat.how === 'turn' ? L('Look at the times: after a while the dots come back towards the start.', 'Schau auf die Zeiten: Nach einer Weile kommen die Punkte zum Start zurück.')
            : L('Compare the distances between neighbouring dots: they are not all the same.', 'Vergleiche die Abstände zwischen benachbarten Punkten: Sie sind nicht alle gleich.'))))));
    if (d === 3) {
      questions.push(numQ('a', L('The acceleration of the cart:', 'Die Beschleunigung des Wagens:'), L('What is the acceleration of the cart?', 'Wie gross ist die Beschleunigung des Wagens?'), it('a'), 'm/s²', acc, [
        { value: -acc, flag: 'sign', why: L(`The distances per second ${acc * dir > 0 ? 'grow' : 'shrink'} in the direction of motion${pat.how === 'turn' ? ' at first' : ''}: work out the sign from how the signed distance changes, from ${sval(gaps[0], 'm')} to ${sval(gaps[1], 'm')}.`,
          `Die Abstände pro Sekunde ${acc * dir > 0 ? 'wachsen' : 'schrumpfen'}${pat.how === 'turn' ? ' zuerst' : ''} in Bewegungsrichtung: Bestimme das Vorzeichen daraus, wie sich der Abstand mit Vorzeichen ändert, von ${sval(gaps[0], 'm')} auf ${sval(gaps[1], 'm')}.`) },
        { value: gaps[n - 1], flag: null, why: L('That is the distance moved in the last second, a mean velocity. The acceleration is how much this distance changes from one second to the next, per second squared.', 'Das ist der Abstand in der letzten Sekunde, eine mittlere Geschwindigkeit. Die Beschleunigung ist, um wie viel sich dieser Abstand von einer Sekunde zur nächsten ändert, pro Sekunde im Quadrat.') },
        { value: acc / 2, flag: null, why: L('The distances per second change by a · (1 s)² from one second to the next, so a is that change itself, not half of it.', 'Die Abstände pro Sekunde ändern sich von einer Sekunde zur nächsten um a · (1 s)², also ist a diese Änderung selbst, nicht die Hälfte davon.') },
      ], L('a = (change of the distance per second) / (1 s)².', 'a = (Änderung des Abstands pro Sekunde) / (1 s)².')));
    }
    const fig = () => strobe(xs, -7, 7, { label: L('Stroboscope picture: one dot per second', 'Stroboskopaufnahme: ein Punkt pro Sekunde') });
    const gapText = gaps.map((g, k) => `${k}–${k + 1} s: ${g > 0 ? '+' : ''}${num(g)} m`).join(', ');
    return finish('strobe', seed, d, {
      data: { xs, gaps, how: pat.how, acc, v0 },
      title: L('Stroboscope picture', 'Stroboskopaufnahme'),
      text: L('<p>A cart moves along a straight track with constant acceleration. The stroboscope picture shows where it is every second, from t = 0 (the numbers above the dots are the times in s).</p>',
        '<p>Ein Wagen bewegt sich mit konstanter Beschleunigung auf einer geraden Bahn. Die Stroboskopaufnahme zeigt, wo er jede Sekunde ist, ab t = 0 (die Zahlen über den Punkten sind die Zeiten in s).</p>'),
      figure: fig(),
      questions,
      hints: [
        L('The distance between two neighbouring dots is how far the cart moves in one second, its mean velocity in that second: a large distance means fast, a small one slow.', 'Der Abstand zwischen zwei benachbarten Punkten ist, wie weit der Wagen in einer Sekunde fährt, seine mittlere Geschwindigkeit in dieser Sekunde: Ein grosser Abstand bedeutet schnell, ein kleiner langsam.'),
        L('With constant acceleration, the distances per second change by the same amount each second, and s(t) is a parabola.', 'Bei konstanter Beschleunigung ändern sich die Abstände pro Sekunde jede Sekunde um gleich viel, und s(t) ist eine Parabel.'),
        L(`The changes of position per second: ${gapText}.`, `Die Ortsänderungen pro Sekunde: ${gapText}.`),
        d === 2 ? L(`So the s(t) graph goes through ${xs.map((x, k) => `(${k} s, ${num(x)} m)`).join(', ')}, curved like a parabola.`, `Der s(t)-Graph geht also durch ${xs.map((x, k) => `(${k} s, ${num(x)} m)`).join(', ')}, gekrümmt wie eine Parabel.`)
          : L(`The mean velocity in each second is reached in its middle: v(0.5 s) = ${sval(gaps[0], 'm/s')}, v(1.5 s) = ${sval(gaps[1], 'm/s')}, …; v(t) is the straight line through these points.`,
            `Die mittlere Geschwindigkeit jeder Sekunde wird in deren Mitte erreicht: v(0,5 s) = ${sval(gaps[0], 'm/s')}, v(1,5 s) = ${sval(gaps[1], 'm/s')}, …; v(t) ist die Gerade durch diese Punkte.`),
      ],
      steps: [
        step(L('Distances per second', 'Abstände pro Sekunde'), L(`From one dot to the next, the cart moves: ${gapText}. They change by ${sval(acc, 'm')} each second: a constant acceleration a = ${sval(acc, 'm/s²')}.`,
          `Von einem Punkt zum nächsten fährt der Wagen: ${gapText}. Sie ändern sich jede Sekunde um ${sval(acc, 'm')}: eine konstante Beschleunigung a = ${sval(acc, 'm/s²')}.`), fig()),
        step(L('The s(t) graph', 'Der s(t)-Graph'), L('Each dot gives a point (t, s). With constant acceleration, s(t) is a parabola through these points.', 'Jeder Punkt gibt einen Punkt (t, s). Bei konstanter Beschleunigung ist s(t) eine Parabel durch diese Punkte.'),
          sGraph(curve(gaps, x0), { dots: xs.map((x, k) => [k, x]) })),
        step(L('The v(t) graph', 'Der v(t)-Graph'), L(`The distance in each second is the mean velocity in that second, reached in its middle (dots). v(t) is the straight line through them, from ${sval(v0, 'm/s')} at t = 0 with slope a = ${sval(acc, 'm/s²')}. So the cart ${HOW[pat.how]()}.`,
          `Der Abstand in jeder Sekunde ist die mittlere Geschwindigkeit in dieser Sekunde, erreicht in deren Mitte (Punkte). v(t) ist die Gerade durch sie, von ${sval(v0, 'm/s')} bei t = 0 mit der Steigung a = ${sval(acc, 'm/s²')}. Der Wagen ${HOW[pat.how]()}.`),
          vGraph(vLine(gaps), { dots: means })),
      ],
    });
  }

  // ---------------------------------------------------------------- area (C4.1, C4.2)
  // The displacement is the area between v(t) and the t axis, below the axis negative; the
  // distance counts every area positive. ★3: v ≥ 0, with a trapezoid; ★4: v changes sign
  // (displacement and distance), or two motions A and B: which is farther from the start.
  function integrate(pts, a, b, abs) {
    let sum = 0;
    for (let i = 1; i < pts.length; i++) {
      const [t0, v0] = pts[i - 1], [t1, v1] = pts[i];
      const lo = Math.max(a, t0), hi = Math.min(b, t1);
      if (hi <= lo) continue;
      const at = (t) => v0 + ((v1 - v0) * (t - t0)) / (t1 - t0);
      const va = at(lo), vb = at(hi);
      if (!abs || va * vb >= 0) sum += (abs ? Math.abs(va + vb) : va + vb) / 2 * (hi - lo);
      else { const tc = lo + ((hi - lo) * va) / (va - vb); sum += (Math.abs(va) * (tc - lo) + Math.abs(vb) * (hi - tc)) / 2; }
    }
    return sum;
  }
  // A v(t) of 3–4 straight pieces over 10 s, whole values at whole seconds; where it changes sign,
  // it does so at a whole second (so all areas are multiples of 0.5 m).
  function vProfile(r, signs) {
    for (;;) {
      const ts = [0];
      while (ts[ts.length - 1] < 10) ts.push(Math.min(10, ts[ts.length - 1] + r.pick([2, 3, 4])));
      if (ts.length < 4 || ts.length > 5) continue;
      const vs = ts.map(() => r.pick(signs === 'pos' ? [0, 1, 2, 3] : [-3, -2, -1, 0, 1, 2, 3]));
      const pts = ts.map((t, i) => [t, vs[i]]);
      let ok = true;
      for (let i = 1; i < pts.length; i++) {
        const [t0, v0] = pts[i - 1], [t1, v1] = pts[i];
        if (v0 * v1 < 0 && !Number.isInteger(t0 + ((t1 - t0) * v0) / (v0 - v1))) ok = false;
      }
      if (ok) return pts;
    }
  }
  function areaEx(seed, d) {
    const r = rng(seed);
    d = d || r.pick([3, 4]);
    if (d === 4 && r.next() < 0.4) return race(r, seed);
    let pts, a, b, ds, dist;
    for (let k = 0; ; k++) {
      pts = vProfile(r, d === 3 ? 'pos' : 'any');
      a = r.pick([0, 1, 2, 3]); b = r.pick([6, 7, 8, 9, 10]);
      ds = integrate(pts, a, b, false); dist = integrate(pts, a, b, true);
      const sloped = pts.some((p, i) => i && p[1] !== pts[i - 1][1] && pts[i - 1][0] < b && p[0] > a);
      if (!sloped || dist < 2) continue;
      if (!Number.isInteger(2 * ds) || !Number.isInteger(2 * dist)) continue; // no calculator: halves of metres
      if (d === 3 && Math.abs(ds - dist) < 1e-9) break;
      if (d === 4 && dist - Math.abs(ds) >= 1 && Math.abs(ds) >= 0.5) break;
    }
    const at = (t) => Figs.valueAt(pts, t);
    const pieces = pts.slice(1).map((p, i) => [pts[i][0], pts[i][1], p[0], p[1]]);
    const clipped = pieces.map(([t0, v0, t1, v1]) => {
      const lo = Math.max(a, t0), hi = Math.min(b, t1);
      return hi > lo ? [lo, Figs.valueAt([[t0, v0], [t1, v1]], lo), hi, Figs.valueAt([[t0, v0], [t1, v1]], hi)] : null;
    }).filter(Boolean);
    const fig = (o = {}) => graph('v', { lo: -4, hi: 4, step: 2 }, 10, [{ pts }], { label: L('Velocity against time', 'Geschwindigkeit gegen die Zeit'), marks: [a, b], ...o });
    const rectV = at(a) * (b - a);
    const qs = [numQ('ds', L(`The displacement between ${num(a)} s and ${num(b)} s:`, `Die Verschiebung zwischen ${num(a)} s und ${num(b)} s:`), L(`What is the displacement Δs between ${num(a)} s and ${num(b)} s?`, `Wie gross ist die Verschiebung Δs zwischen ${num(a)} s und ${num(b)} s?`),
      'Δ<i>s</i>', 'm', ds, [
        { value: dist, flag: 'unsigned', why: L('That is the distance travelled. For the displacement, the area below the t axis counts negative: the body moves backwards there.', 'Das ist der zurückgelegte Weg. Für die Verschiebung zählt die Fläche unter der t-Achse negativ: Dort bewegt sich der Körper rückwärts.') },
        { value: at(b), flag: 'height', why: L('That is the velocity at the end, read off the graph. The displacement is the area under the v(t) graph.', 'Das ist die Geschwindigkeit am Ende, am Graphen abgelesen. Die Verschiebung ist die Fläche unter dem v(t)-Graphen.') },
        { value: rectV, flag: 'rect', why: L('That is v at the start times Δt, a rectangle. But v changes: add up the areas piece by piece, trapezoids and triangles included.', 'Das ist v am Anfang mal Δt, ein Rechteck. Aber v ändert sich: Zähle die Flächen Stück für Stück zusammen, Trapeze und Dreiecke eingeschlossen.') },
      ], L('The area between the v(t) graph and the t axis, below the axis negative.', 'Die Fläche zwischen dem v(t)-Graphen und der t-Achse, unter der Achse negativ.'))];
    if (d === 4) {
      qs.push(numQ('dist', L(`The distance travelled between ${num(a)} s and ${num(b)} s:`, `Der zurückgelegte Weg zwischen ${num(a)} s und ${num(b)} s:`), L(`What distance does the body travel between ${num(a)} s and ${num(b)} s?`, `Welchen Weg legt der Körper zwischen ${num(a)} s und ${num(b)} s zurück?`),
        L('distance', 'Weg'), 'm', dist, [
          { value: Math.abs(ds), flag: 'unsigned', why: L('That is the size of the displacement: forward and backward cancel there. The distance counts every metre, so all areas count positive.', 'Das ist der Betrag der Verschiebung: Dabei heben sich vorwärts und rückwärts auf. Der Weg zählt jeden Meter, also zählen alle Flächen positiv.') },
          { value: ds, flag: 'unsigned', why: L('That is the displacement. The distance counts every metre, so the area below the axis counts positive too.', 'Das ist die Verschiebung. Der Weg zählt jeden Meter, also zählt auch die Fläche unter der Achse positiv.') },
        ], L('The areas between the v(t) graph and the t axis, all counted positive.', 'Die Flächen zwischen dem v(t)-Graphen und der t-Achse, alle positiv gezählt.')));
    }
    const pieceText = clipped.map(([t0, v0, t1, v1]) => `${interval(t0, t1)}: ${v0 === v1 ? `${num(v0)} m/s · ${num(t1 - t0)} s` : `(${num(v0)} + ${num(v1)}) / 2 m/s · ${num(t1 - t0)} s`} = ${sval((v0 + v1) / 2 * (t1 - t0), 'm')}`).join('<br>');
    return finish('area', seed, d, {
      data: { pts, a, b },
      title: L('Distance as an area', 'Weg als Fläche'),
      text: L(`<p>A body moves along a straight line. The graph shows its velocity against time.</p>`, `<p>Ein Körper bewegt sich auf einer Geraden. Der Graph zeigt seine Geschwindigkeit gegen die Zeit.</p>`),
      figure: fig(),
      questions: qs,
      hints: [
        L('In every short time, the body moves v · Δt: the area of a narrow strip under the v(t) graph. So the change of position is the area under the graph.', 'In jeder kurzen Zeit bewegt sich der Körper um v · Δt: die Fläche eines schmalen Streifens unter dem v(t)-Graphen. Die Ortsänderung ist also die Fläche unter dem Graphen.'),
        L(`Split the area between ${num(a)} s and ${num(b)} s into rectangles, triangles and trapezoids.`, `Teile die Fläche zwischen ${num(a)} s und ${num(b)} s in Rechtecke, Dreiecke und Trapeze.`),
        d === 4 ? L('Below the t axis, the body moves backwards: that area counts negative for the displacement, but positive for the distance.', 'Unter der t-Achse bewegt sich der Körper rückwärts: Diese Fläche zählt für die Verschiebung negativ, für den Weg aber positiv.')
          : L('A trapezoid under a sloped piece: (v at the start + v at the end) / 2 · Δt.', 'Ein Trapez unter einem schrägen Stück: (v am Anfang + v am Ende) / 2 · Δt.'),
        L(`Piece by piece: ${clipped.map(([t0, v0, t1, v1]) => sval((v0 + v1) / 2 * (t1 - t0), 'm')).join(', ')}.`, `Stück für Stück: ${clipped.map(([t0, v0, t1, v1]) => sval((v0 + v1) / 2 * (t1 - t0), 'm')).join(', ')}.`),
      ],
      steps: [
        step(L('The area', 'Die Fläche'), L(`The change of position between ${num(a)} s and ${num(b)} s is the area between the graph and the t axis (shaded; below the axis negative).`, `Die Ortsänderung zwischen ${num(a)} s und ${num(b)} s ist die Fläche zwischen dem Graphen und der t-Achse (schattiert; unter der Achse negativ).`), fig({ areas: clipped })),
        step(L('Piece by piece', 'Stück für Stück'), pieceText, fig({ areas: clipped })),
        step(L('Result', 'Resultat'), d === 4
          ? L(`Displacement Δs = ${sval(ds, 'm')} (the areas with their signs). Distance = ${val(dist, 'm')} (all areas positive): the body went forward and back.`, `Verschiebung Δs = ${sval(ds, 'm')} (die Flächen mit ihren Vorzeichen). Weg = ${val(dist, 'm')} (alle Flächen positiv): Der Körper fuhr vorwärts und zurück.`)
          : L(`Δs = ${sval(ds, 'm')}. The body only moves forward here, so the distance is the same.`, `Δs = ${sval(ds, 'm')}. Der Körper bewegt sich hier nur vorwärts, also ist der Weg gleich gross.`), fig({ areas: clipped })),
      ],
    });
  }

  // Two motions A and B from the same start: which is farther from it at time t*? The one with the
  // larger velocity at t* is not (the trap).
  function race(r, seed) {
    let A, B, tq, sA, sB;
    for (;;) {
      A = vProfile(r, 'any'); B = vProfile(r, 'any');
      tq = r.pick([4, 5, 6, 7, 8]);
      sA = integrate(A, 0, tq, false); sB = integrate(B, 0, tq, false);
      const vA = Figs.valueAt(A, tq), vB = Figs.valueAt(B, tq);
      if (Math.abs(Math.abs(sA) - Math.abs(sB)) < 1) continue;
      if (!Number.isInteger(2 * sA) || !Number.isInteger(2 * sB) || !Number.isInteger(2 * integrate(B, 0, tq, true))) continue;
      const farA = Math.abs(sA) > Math.abs(sB);
      if ((farA ? vB > vA : vA > vB) && Math.abs(sB) >= 0.5) break; // the closer one is faster at t*
    }
    const far = Math.abs(sA) > Math.abs(sB) ? 'A' : 'B', near = far === 'A' ? 'B' : 'A';
    const areasOf = (pts) => pts.slice(1).map((p, i) => [pts[i][0], pts[i][1], p[0], p[1]]).filter(([t0]) => t0 < tq).map(([t0, v0, t1, v1]) => [t0, v0, Math.min(t1, tq), Figs.valueAt([[t0, v0], [t1, v1]], Math.min(t1, tq))]);
    const two = (o = {}) => `<div class="figs pair">${['A', 'B'].map((n) => `<figure class="fig">${graph('v', { lo: -4, hi: 4, step: 2 }, 10, [{ pts: n === 'A' ? A : B }], { marks: [tq], label: n, ...(o.areas ? { areas: areasOf(n === 'A' ? A : B) } : {}) })}<figcaption>${n}</figcaption></figure>`).join('')}</div>`;
    const q1 = choice('far', L(`Both start at the same point at t = 0. Which is farther from the start at t = ${num(tq)} s?`, `Beide starten bei t = 0 am selben Punkt. Welcher ist bei t = ${num(tq)} s weiter vom Start entfernt?`), r.shuffle([
      opt('A', far === 'A', 'height', L(`At ${num(tq)} s, ${near} is faster, but the distance from the start is the area under the v(t) graph up to then, not the height of the graph.`, `Bei ${num(tq)} s ist ${near} schneller, aber die Entfernung vom Start ist die Fläche unter dem v(t)-Graphen bis dahin, nicht die Höhe des Graphen.`)),
      opt('B', far === 'B', 'height', L(`At ${num(tq)} s, ${near} is faster, but the distance from the start is the area under the v(t) graph up to then, not the height of the graph.`, `Bei ${num(tq)} s ist ${near} schneller, aber die Entfernung vom Start ist die Fläche unter dem v(t)-Graphen bis dahin, nicht die Höhe des Graphen.`)),
      opt(L('Equally far', 'Gleich weit'), false, null, L('Compare the areas under the two graphs up to that time.', 'Vergleiche die Flächen unter den beiden Graphen bis zu diesem Zeitpunkt.')),
      opt(L('Both are back at the start', 'Beide sind wieder am Start'), false, 'unsigned', L('Only areas above and below the axis that are equal would cancel. Add up the areas with their signs.', 'Nur gleich grosse Flächen über und unter der Achse würden sich aufheben. Zähle die Flächen mit ihren Vorzeichen zusammen.')),
    ]));
    const q2 = numQ('sB', L(`The displacement of B from 0 to ${num(tq)} s:`, `Die Verschiebung von B von 0 bis ${num(tq)} s:`), L(`What is the displacement of B from 0 to ${num(tq)} s?`, `Wie gross ist die Verschiebung von B von 0 bis ${num(tq)} s?`),
      `Δ${sub('s', 'B')}`, 'm', sB, [
        { value: integrate(B, 0, tq, true), flag: 'unsigned', why: L('That is the distance travelled: the area below the t axis counts negative for the displacement.', 'Das ist der zurückgelegte Weg: Für die Verschiebung zählt die Fläche unter der t-Achse negativ.') },
        { value: Figs.valueAt(B, tq), flag: 'height', why: L('That is the velocity at that time. The displacement is the area under the graph.', 'Das ist die Geschwindigkeit zu diesem Zeitpunkt. Die Verschiebung ist die Fläche unter dem Graphen.') },
      ], L('The area under the v(t) graph of B, below the axis negative.', 'Die Fläche unter dem v(t)-Graphen von B, unter der Achse negativ.'));
    return finish('area', seed, 4, {
      data: { A, B, tq, far },
      title: L('Who is farther?', 'Wer ist weiter weg?'),
      text: L('<p>The graphs show the velocities of two bodies A and B moving along the same straight line.</p>', '<p>Die Graphen zeigen die Geschwindigkeiten von zwei Körpern A und B, die sich auf derselben Geraden bewegen.</p>'),
      figure: two(),
      questions: [q1, q2],
      hints: [
        L('How far a body is from its start is its displacement: the area under its v(t) graph from t = 0, below the axis negative.', 'Wie weit ein Körper von seinem Start entfernt ist, ist seine Verschiebung: die Fläche unter seinem v(t)-Graphen ab t = 0, unter der Achse negativ.'),
        L(`The velocity at ${num(tq)} s only says how fast each moves right then, not how far it has come.`, `Die Geschwindigkeit bei ${num(tq)} s sagt nur, wie schnell sich jeder gerade dann bewegt, nicht wie weit er schon gekommen ist.`),
        L(`Add up the areas up to ${num(tq)} s for A and for B, piece by piece.`, `Zähle die Flächen bis ${num(tq)} s für A und für B Stück für Stück zusammen.`),
        L(`Δs_A = ${sval(sA, 'm')}, Δs_B = ${sval(sB, 'm')}.`, `Δs_A = ${sval(sA, 'm')}, Δs_B = ${sval(sB, 'm')}.`),
      ],
      steps: [
        step(L('The areas', 'Die Flächen'), L(`Up to ${num(tq)} s, A has moved ${sval(sA, 'm')} and B ${sval(sB, 'm')} (the areas with their signs).`, `Bis ${num(tq)} s hat sich A um ${sval(sA, 'm')} und B um ${sval(sB, 'm')} bewegt (die Flächen mit ihren Vorzeichen).`), two({ areas: true })),
        step(L('Comparing', 'Vergleichen'), L(`${far} is farther from the start (${val(Math.abs(far === 'A' ? sA : sB), 'm')} against ${val(Math.abs(far === 'A' ? sB : sA), 'm')}), although ${near} is faster at ${num(tq)} s.`, `${far} ist weiter vom Start entfernt (${val(Math.abs(far === 'A' ? sA : sB), 'm')} gegen ${val(Math.abs(far === 'A' ? sB : sA), 'm')}), obwohl ${near} bei ${num(tq)} s schneller ist.`), two({ areas: true })),
      ],
    });
  }

  // ---------------------------------------------------------------- arcade: one question, four options
  // A choice question with four options as it is; else a number question, with the right value
  // and three trap values (or nearby values); else one right and three wrong options of a multi.
  function arcade(ex, seed) {
    const r = rng((seed ^ 0x2f1e) >>> 0);
    const four = ex.questions.find((q) => q.type === 'choice' && q.options.length === 4);
    if (four) return { ask: four.prompt, options: four.options, pics: four.pics };
    const m = ex.questions.find((q) => q.type === 'multi' && q.options.some((o) => o.correct) && q.options.filter((o) => !o.correct).length >= 3);
    const n = ex.questions.find((q) => q.type === 'num');
    if (m && (!n || r.next() < 0.5)) {
      const right = r.pick(m.options.filter((o) => o.correct)), wrong = r.shuffle(m.options.filter((o) => !o.correct)).slice(0, 3);
      return { ask: m.single, options: r.shuffle([right, ...wrong]) };
    }
    const vals = [{ value: n.value, correct: true }];
    for (const t of n.traps) if (vals.length < 4 && !vals.some((v) => Math.abs(v.value - t.value) < 0.05)) vals.push(t);
    for (let k = 1; vals.length < 4; k++) for (const v of [n.value + k, n.value - k]) if (vals.length < 4 && !vals.some((w) => Math.abs(w.value - v) < 0.05)) vals.push({ value: v, flag: null, why: n.why });
    return { ask: n.ask, options: r.shuffle(vals.map((v) => ({ html: val(v.value, n.unit), correct: !!v.correct, flag: v.correct ? null : v.flag, why: v.correct ? '' : v.why }))) };
  }

  const BUILD = { compare, direction, table: tableEx, strobe: strobeEx, area: areaEx };
  const DIFF = { compare: [1, 2], direction: [2], table: [2, 3], strobe: [2, 3], area: [3, 4] };
  const make = (kind, seed, d) => BUILD[kind](seed, d);
  for (const k of Object.keys(BUILD)) Motion.register(k, { difficulties: DIFF[k], make: (seed, d) => make(k, seed, d) });

  const api = { KINDS: Object.keys(BUILD), DIFF, FLAGS, make, arcade, integrate };
  root.Concepts = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
