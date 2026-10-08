// Exercises on uniform motion from the worksheets C1 (speed as a rate), C2 (velocity as a vector
// in one dimension) and C4 (distance as the area under v(t)), answered by choosing or entering
// numbers instead of drawing:
//   compare    two motions in one s(t) graph: which is faster, and the velocity of one (★1–2)
//   direction  a piecewise uniform s(t): when is v negative, and v in one interval (★2)
//   table      value tables: which vehicles always move backwards, velocities, missing positions (★2–3)
//   atable     value table of a constantly accelerated cart: missing positions and the acceleration
//              (★3: steps of 1 or 2 s; ★4: of 0.5–5 s, and a velocity)
//   strobe     a stroboscope picture of a constantly accelerated cart: in which second it is
//              fastest (★2), how it moves, and (★3) its acceleration
//   tablegraph, atablegraph, strobegraph   the same tables and pictures with one graph to choose:
//              s(t) of the vehicle that turns or v(t) of two (★2–3); s(t), v(t) or a(t) (★3–4);
//              s(t) (★2), v(t) or a(t) (★3)
//   area       v(t): displacement and distance between two times, or who is farther from the start (★3–4)
//   match      a graph and the one of its slope: s(t) → v(t) (★2), v(t) → a(t) (★3), s(t) → a(t) (★4)
// make(kind, seed, d) gives { kind, id, difficulty, title, text, figure, questions, hints, steps,
// answers, data } in the current language (Lang); data: the motion behind it, for the tests.
// Questions:
//   { type: 'choice', key, prompt, options: [{ html, correct, flag, why }], pics (the options are graphs) }
//   { type: 'multi', key, prompt, single, options: [...] } (any number right; single: the prompt
//     for one right answer, in the arcade); for a right option, why says why it belongs
//   { type: 'num', key, prompt, ask, sym, unit, value, traps: [{ value, flag, why }], why }
// A wrong option's flag names the misconception behind it (FLAGS), or is null. The numbers need
// no calculator: whole seconds (or halves), whole metres (or halves), velocities in tenths or
// halves of m/s.
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
    linear: () => L('a steady velocity assumed (continued in a straight line)', 'eine konstante Geschwindigkeit angenommen (linear fortgesetzt)'),
    steps: () => L('the time step forgotten: Δ(Δs) = a · (Δt)²', 'den Zeitschritt vergessen: Δ(Δs) = a · (Δt)²'),
    copy: () => L('the shape of the given graph copied', 'die Form des gegebenen Graphen übernommen'),
    value: () => L('the value of v instead of its slope', 'der Wert von v statt seiner Steigung'),
    skip: () => L('v(t) taken for a(t)', 'v(t) für a(t) gehalten'),
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
    // a slope triangle for each line over the same 5 s, A's in the first half, B's in the second,
    // so that they do not lie on top of each other
    const H = T / 2, sA = (t) => A[0] + vA * t, sB = (t) => B[0] + vB * t;
    const dsA = vA * H, dsB = vB * H;
    const ds = (x) => `Δ<tspan class="it">s</tspan> = ${x > 0 ? '+' : ''}${num(round(x))} m`, dt = `Δ<tspan class="it">t</tspan> = ${num(H)} s`;
    const tris = [
      { t0: 0, y0: sA(0), t1: H, y1: sA(H), corner: 'end', dt, dy: ds(dsA) },
      // B's Δt inside its triangle: where the lines cross, A passes just outside it
      { t0: H, y0: sB(H), t1: T, y1: sB(T), corner: 'end', dt, dy: ds(dsB), dtIn: true },
    ];
    const rises = (v) => (v > 0 ? L('rises', 'steigt') : L('falls', 'fällt'));
    const dirOf = (v) => (v > 0 ? L('in the positive direction', 'in positiver Richtung') : L('in the negative direction', 'in negativer Richtung'));
    const PQ = Q === 'A' ? A : B, dsQ = PQ[1] - PQ[0];
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
        step(L('The slope is the velocity', 'Die Steigung ist die Geschwindigkeit'),
          L('In an s(t) graph, the slope of the line is the velocity. Its <b>sign</b> gives the direction: a rising line means motion in the positive direction (v &gt; 0), a falling line motion in the negative direction (v &lt; 0). Its <b>steepness</b> gives the speed: the steeper the line, the more metres per second. How high a line lies is only the position.',
            'Im s(t)-Diagramm ist die Steigung der Geraden die Geschwindigkeit. Ihr <b>Vorzeichen</b> gibt die Richtung an: Eine steigende Gerade bedeutet Bewegung in positiver Richtung (v &gt; 0), eine fallende Bewegung in negativer Richtung (v &lt; 0). Ihre <b>Steilheit</b> gibt das Tempo an: Je steiler die Gerade, desto mehr Meter pro Sekunde. Wie hoch eine Gerade liegt, ist nur der Ort.'), fig()),
        step(L('The sign of the slope', 'Das Vorzeichen der Steigung'),
          L(`A ${rises(vA)}: it moves ${dirOf(vA)}, ${sub('v', 'A')} ${vA > 0 ? '&gt;' : '&lt;'} 0. B ${rises(vB)}: it moves ${dirOf(vB)}, ${sub('v', 'B')} ${vB > 0 ? '&gt;' : '&lt;'} 0.${d === 2 ? ' The direction says nothing yet about who is faster.' : ''}`,
            `A ${rises(vA)}: Es bewegt sich ${dirOf(vA)}, ${sub('v', 'A')} ${vA > 0 ? '&gt;' : '&lt;'} 0. B ${rises(vB)}: Es bewegt sich ${dirOf(vB)}, ${sub('v', 'B')} ${vB > 0 ? '&gt;' : '&lt;'} 0.${d === 2 ? ' Über das Tempo sagt die Richtung noch nichts.' : ''}`), fig({ dots })),
        step(L('The steepness: who is faster', 'Die Steilheit: Wer ist schneller'),
          L(`The slope triangles over the same ${num(H)} s: A changes its position by ${val(Math.abs(dsA), 'm')}, B by ${val(Math.abs(dsB), 'm')}. ${F}'s line is steeper, so <b>${F} is faster</b>.${d === 2 ? ` That ${F}'s line falls only means that ${F} moves in the negative direction; it does not make ${F} slower.` : ` ${Sl}'s line lies higher, but that is its position, not its speed.`}`,
            `Die Steigungsdreiecke über dieselben ${num(H)} s: A ändert seinen Ort um ${val(Math.abs(dsA), 'm')}, B um ${val(Math.abs(dsB), 'm')}. Die Gerade von ${F} ist steiler, also <b>ist ${F} schneller</b>.${d === 2 ? ` Dass die Gerade von ${F} fällt, heisst nur, dass sich ${F} in negativer Richtung bewegt; langsamer ist ${F} deshalb nicht.` : ` Die Gerade von ${Sl} liegt höher, aber das ist der Ort, nicht das Tempo.`}`), fig({ tris })),
        step(L(`The value of ${Q}'s slope`, `Der Wert der Steigung von ${Q}`),
          L(`The slope is Δs/Δt, with its sign: from the triangle, ${sub('v', Q)} = ${ds(vQ * H).replace(/<[^>]+>/g, '').replace('Δs = ', '')} / ${num(H)} s = ${sval(vQ, 'm/s')} (or over the whole graph: ${line(Q, PQ, vQ).replace(/^[AB]: /, '')}). The sign ${vQ > 0 ? '+' : '−'} is the direction (the line ${rises(vQ)}), the size ${val(Math.abs(vQ), 'm/s')} the speed (${val(Math.abs(dsQ), 'm')} in 10 s).`,
            `Die Steigung ist Δs/Δt, mit Vorzeichen: aus dem Dreieck ${sub('v', Q)} = ${ds(vQ * H).replace(/<[^>]+>/g, '').replace('Δs = ', '')} / ${num(H)} s = ${sval(vQ, 'm/s')} (oder über den ganzen Graphen: ${line(Q, PQ, vQ).replace(/^[AB]: /, '')}). Das Vorzeichen ${vQ > 0 ? '+' : '−'} ist die Richtung (die Gerade ${rises(vQ)}), der Betrag ${val(Math.abs(vQ), 'm/s')} das Tempo (${val(Math.abs(dsQ), 'm')} in 10 s).`), fig({ tris: tris.filter((t, k) => (k === 0) === (Q === 'A')) })),
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
    // each interval by the slope of its line: the sign is the direction, the steepness the speed
    const desc = (p) => (p.v === 0
      ? L(`${interval(p.t0, p.t1)}: the line is horizontal (slope 0): s stays at ${val(p.s0, 'm')}, the body is at rest, v = 0`,
        `${interval(p.t0, p.t1)}: Die Gerade ist waagrecht (Steigung 0): s bleibt bei ${val(p.s0, 'm')}, der Körper ruht, v = 0`)
      : L(`${interval(p.t0, p.t1)}: the line ${p.v > 0 ? 'rises' : 'falls'}, so its slope is ${p.v > 0 ? 'positive' : 'negative'}: the body moves ${p.v > 0 ? 'forward' : 'backward'}. Its steepness: s changes from ${val(p.s0, 'm')} to ${val(p.s1, 'm')}, by ${num(p.s1 - p.s0)} m in ${num(p.t1 - p.t0)} s, so v = ${num(p.s1 - p.s0)} m / ${num(p.t1 - p.t0)} s = ${sval(p.v, 'm/s')}`,
        `${interval(p.t0, p.t1)}: Die Gerade ${p.v > 0 ? 'steigt' : 'fällt'}, ihre Steigung ist also ${p.v > 0 ? 'positiv' : 'negativ'}: Der Körper bewegt sich ${p.v > 0 ? 'vorwärts' : 'rückwärts'}. Ihre Steilheit: s ändert sich von ${val(p.s0, 'm')} auf ${val(p.s1, 'm')}, um ${num(p.s1 - p.s0)} m in ${num(p.t1 - p.t0)} s, also v = ${num(p.s1 - p.s0)} m / ${num(p.t1 - p.t0)} s = ${sval(p.v, 'm/s')}`));
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
        step(L('Negative velocity', 'Negative Geschwindigkeit'), L(`v < 0 in ${and(negs.map((p) => interval(p.t0, p.t1)))}: there the slope is negative, the graph falls, wherever it lies (also above the t axis).`, `v < 0 in ${and(negs.map((p) => interval(p.t0, p.t1)))}: Dort ist die Steigung negativ, der Graph fällt, egal wo er liegt (auch über der t-Achse).`), fig()),
      ],
    });
  }

  // ---------------------------------------------------------------- table (C2.3, C2.5)
  // ★2: four vehicles every 5 s; which move backwards all the time, and the velocity of the
  // uniform one. ★3: two uniform vehicles with gaps in the table; their velocities and two
  // missing positions. The same tables with a graph to choose instead (graph: kind tablegraph):
  // ★2 the s(t) graph of the vehicle that turns, ★3 the v(t) graph of both.
  function tableEx(seed, d, gmode = false) {
    const r = rng(seed);
    d = d || r.pick([2, 3]);
    return d === 2 ? table4(r, seed, gmode) : table2(r, seed, gmode);
  }
  const tableGraph = (seed, d) => tableEx(seed, d, true);

  function table4(r, seed, gmode) {
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
    // the s(t) graph of the vehicle that turns: straight between the times of the table
    const Tn = rows.find((x) => x.kind === 'backforth' || x.kind === 'forthback');
    const others = (k) => rows.find((x) => x.kind === k);
    const ptsOf = (vals) => times.map((t, k) => [t, vals[k]]);
    const G = graphChoice(r, 'graph', L(`Which s(t) graph belongs to ${Tn.name}?`, `Welcher s(t)-Graph gehört zu ${Tn.name}?`), 's', 30, [
      [ptsOf(Tn.values), true],
      [ptsOf(Tn.values.slice().reverse()), 'order', L('This graph runs backwards in time: it starts with the last position of the table. Start at t = 0.', 'Dieser Graph läuft rückwärts in der Zeit: Er beginnt mit dem letzten Ort der Tabelle. Beginne bei t = 0.')],
      [ptsOf(Tn.values.map((v) => -v)), 'sign', L('This graph is mirrored: its positions have the wrong sign. Read the positions with their signs.', 'Dieser Graph ist gespiegelt: Seine Orte haben das falsche Vorzeichen. Lies die Orte mit ihren Vorzeichen.')],
      [ptsOf([0, ...Tn.values.slice(1).map((x, k) => x - Tn.values[k])]), null, L('This graph shows the changes of position from one column to the next, not the positions themselves.', 'Dieser Graph zeigt die Ortsänderungen von einer Spalte zur nächsten, nicht die Orte selbst.')],
      [[[0, Tn.values[0]], [30, Tn.values[6]]], null, L(`This graph joins the first and the last position with a straight line. But in between, ${Tn.name} turns around: draw a point for every column.`, `Dieser Graph verbindet den ersten und den letzten Ort mit einer Geraden. Dazwischen kehrt ${Tn.name} aber um: Zeichne für jede Spalte einen Punkt.`)],
      // (as a last resort, the graphs of other vehicles, on a larger scale)
      [ptsOf(others('negup').values), null, L(`That is the graph of ${others('negup').name}, which moves in the positive direction all the time.`, `Das ist der Graph von ${others('negup').name}, das sich die ganze Zeit in positiver Richtung bewegt.`)],
      [ptsOf(others('down').values), null, L(`That is the graph of ${others('down').name}, which moves in the negative direction all the time.`, `Das ist der Graph von ${others('down').name}, das sich die ganze Zeit in negativer Richtung bewegt.`)],
    ]);
    const graphStep = step(L(`The s(t) graph of ${Tn.name}`, `Der s(t)-Graph von ${Tn.name}`), L(`Each column of the table gives a point (t, s) of ${Tn.name}: ${Tn.values.map((x, k) => `(${times[k]} s, ${num(x)} m)`).join(', ')}. The graph ${Tn.kind === 'backforth' ? 'falls first and then rises' : 'rises first and then falls'}: ${Tn.name} turns around.`,
      `Jede Spalte der Tabelle gibt einen Punkt (t, s) von ${Tn.name}: ${Tn.values.map((x, k) => `(${times[k]} s, ${num(x)} m)`).join(', ')}. Der Graph ${Tn.kind === 'backforth' ? 'fällt zuerst und steigt dann' : 'steigt zuerst und fällt dann'}: ${Tn.name} kehrt um.`), G.right({ dots: ptsOf(Tn.values) }));
    const text = L('<p>The table gives the positions of four vehicles A, B, C and D on a straight road every 5 seconds.</p>', '<p>Die Tabelle gibt die Orte von vier Fahrzeugen A, B, C und D auf einer geraden Strasse alle 5 Sekunden an.</p>');
    if (gmode) {
      return finish('tablegraph', seed, 2, {
        data: { times, rows, turning: Tn.name },
        title: L('From the table to the graph', 'Von der Tabelle zum Graphen'),
        text, figure: fig(), questions: [G.question],
        hints: [
          L('Each column of the table gives a point (t, s) of the graph.', 'Jede Spalte der Tabelle gibt einen Punkt (t, s) des Graphen.'),
          L(`Read the row of ${Tn.name} from left to right: where does s increase, where does it decrease?`, `Lies die Zeile von ${Tn.name} von links nach rechts: Wo nimmt s zu, wo nimmt es ab?`),
          L(`${Tn.name} starts at ${val(Tn.values[0], 'm')} and ends at ${val(Tn.values[6], 'm')}.`, `${Tn.name} startet bei ${val(Tn.values[0], 'm')} und endet bei ${val(Tn.values[6], 'm')}.`),
        ],
        steps: [step(L('The changes', 'Die Änderungen'), `${Tn.name}: ${Tn.values.slice(1).map((v2, k) => `${v2 - Tn.values[k] > 0 ? '+' : ''}${num(v2 - Tn.values[k])}`).join(', ')} m`, fig()), graphStep],
      });
    }
    return finish('table', seed, 2, {
      data: { times, rows, uniform: U.name },
      title: L('Four vehicles', 'Vier Fahrzeuge'),
      text,
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

  // ★3: the times vary; each vehicle has two known positions and one asked for, before, between
  // or after them (not at the same time for both).
  const TIMES = [[0, 2, 4, 6, 10, 20], [0, 1, 3, 5, 8, 12], [0, 3, 6, 9, 12, 15], [0, 5, 10, 15, 20, 30], [0, 2, 5, 8, 10, 16], [0, 4, 8, 10, 14, 20], [0, 1, 2, 4, 7, 10]];
  function table2(r, seed, gmode) {
    const times = r.pick(TIMES), T = times[times.length - 1];
    const vs = [-3, -2.5, -2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 2.5, 3];
    const s = (m, t) => round(m.s0 + m.v * t);
    const cols = Array.from(times, (t, k) => k);
    // two known columns and one asked for
    const plan = () => {
      const [i, j] = r.shuffle(cols.slice()).slice(0, 2).sort((p, q) => p - q);
      return { known: [i, j], asked: r.pick(cols.filter((k) => k !== i && k !== j)) };
    };
    let A, B;
    for (;;) {
      A = { s0: r.int(-12, 12), v: r.pick(vs), ...plan() };
      B = { s0: r.int(-12, 12), v: r.pick(vs), ...plan() };
      // opposite directions, and different speeds (else swapping A and B would look like swapping the signs)
      if (Math.sign(A.v) === Math.sign(B.v) || Math.abs(A.v) === Math.abs(B.v) || A.asked === B.asked) continue;
      const shown = (m) => [...m.known, m.asked].map((k) => s(m, times[k]));
      if (![A, B].every((m) => shown(m).every((x) => Number.isInteger(x) && Math.abs(x) <= 40))) continue;
      // at least one of the asked positions outside the two known ones (going back or forward)
      if ([A, B].every((m) => m.asked > m.known[0] && m.asked < m.known[1])) continue;
      break;
    }
    const M = { A, B };
    // (with a graph to choose, no position is asked for: the gaps stay empty)
    const rows = ['A', 'B'].map((n) => ({ name: n, values: times.map((t, k) => (M[n].known.includes(k) ? s(M[n], t) : M[n].asked === k && !gmode ? null : '')) }));
    const fig = () => table(times, rows);
    const br = (x) => (x < 0 ? `(${num(x)} m)` : `${num(x)} m`);
    // the velocity from the two known positions; the asked one from the nearer known one
    const facts = (n) => {
      const m = M[n], [i, j] = m.known, k = m.asked;
      const base = Math.abs(times[k] - times[i]) <= Math.abs(times[k] - times[j]) ? i : j;
      return { m, ti: times[i], tj: times[j], si: s(m, times[i]), sj: s(m, times[j]), tk: times[k], sk: s(m, times[k]), tb: times[base], sb: s(m, times[base]) };
    };
    const F = { A: facts('A'), B: facts('B') };
    const vQ = (n) => {
      const f = F[n], dt = f.tj - f.ti, ds = f.sj - f.si;
      return numQ(`v${n}`, L(`The velocity of ${n}:`, `Die Geschwindigkeit von ${n}:`), L(`What is the velocity of ${n}?`, `Wie gross ist die Geschwindigkeit von ${n}?`), sub('v', n), 'm/s', f.m.v, [
        { value: ds, flag: 'nodt', why: WHY.nodt() }, { value: -f.m.v, flag: 'sign', why: WHY.sign() }, ...(f.ti ? [{ value: f.sj / f.tj, flag: 'origin', why: WHY.origin() }] : []),
        ...(dt !== 1 ? [{ value: ds / f.tj, flag: null, why: L(`Divide by the time between the two positions, Δt = ${num(f.tj)} s − ${num(f.ti)} s = ${num(dt)} s.`, `Teile durch die Zeit zwischen den beiden Orten, Δt = ${num(f.tj)} s − ${num(f.ti)} s = ${num(dt)} s.`) }] : []),
      ], L(`v = Δs/Δt from the two known positions of ${n}.`, `v = Δs/Δt aus den zwei bekannten Orten von ${n}.`));
    };
    const sQ = (n) => {
      const f = F[n], dt = f.tk - f.tb, back = dt < 0;
      return numQ(`s${n}`, L(`The position of ${n} at ${num(f.tk)} s:`, `Der Ort von ${n} bei ${num(f.tk)} s:`), L(`Where is ${n} at t = ${num(f.tk)} s?`, `Wo ist ${n} bei t = ${num(f.tk)} s?`), `${sub('s', n)}(${num(f.tk)}&nbsp;s)`, 'm', f.sk, [
        { value: f.sb - f.m.v * dt, flag: 'sign', why: back
          ? L(`Going back in time, the position changes the other way: Δt = ${num(f.tk)} s − ${num(f.tb)} s = ${num(dt)} s is negative.`, `Rückwärts in der Zeit ändert sich der Ort umgekehrt: Δt = ${num(f.tk)} s − ${num(f.tb)} s = ${num(dt)} s ist negativ.`)
          : WHY.sign() },
        ...(f.tb ? [{ value: f.sb + f.m.v * f.tk, flag: 'origin', why: L(`From ${num(f.tb)} s to ${num(f.tk)} s, the time is Δt = ${num(dt)} s, not ${num(f.tk)} s.`, `Von ${num(f.tb)} s bis ${num(f.tk)} s vergeht Δt = ${num(dt)} s, nicht ${num(f.tk)} s.`) }] : []),
        ...(f.tb === 0 && f.sb ? [{ value: f.m.v * f.tk, flag: 'origin', why: L(`v · t is how far ${n} has moved since t = 0; add the position where it started.`, `v · t ist, wie weit sich ${n} seit t = 0 bewegt hat; zähle den Ort dazu, wo es gestartet ist.`) }] : []),
        { value: f.sb, flag: null, why: L(`That is the position at ${num(f.tb)} s. ${n} moves on in between.`, `Das ist der Ort bei ${num(f.tb)} s. ${n} bewegt sich dazwischen weiter.`) },
      ], L(`Start from a known position of ${n} and add v · Δt.`, `Geh von einem bekannten Ort von ${n} aus und zähle v · Δt dazu.`));
    };
    const vLine = (n) => { const f = F[n]; return `${sub('v', n)} = (${num(f.sj)} m − ${br(f.si)}) / (${num(f.tj)} s − ${num(f.ti)} s) = ${sval(f.m.v, 'm/s')}`; };
    const sLine = (n) => { const f = F[n], dt = f.tk - f.tb; return `${sub('s', n)}(${num(f.tk)} s) = ${num(f.sb)} m + (${sval(f.m.v, 'm/s')}) · ${dt < 0 ? `(${num(dt)} s)` : `${num(dt)} s`} = ${val(f.sk, 'm')}`; };
    // the v(t) graph of both: two horizontal lines
    const vAx = { lo: -4, hi: 4, step: 2 };
    const vFig = (a, b) => graph('v', vAx, T, [
      { pts: [[0, a], [T, a]], name: 'A', at: T * 0.2, below: a < b },
      { pts: [[0, b], [T, b]], name: 'B', dash: true, at: T * 0.8, below: b < a },
    ], { label: L('Velocities of A and B against time', 'Geschwindigkeiten von A und B gegen die Zeit'), ...tTicks(T) });
    const q5 = choice('graph', L('Which v(t) graph belongs to A and B?', 'Welcher v(t)-Graph gehört zu A und B?'), r.shuffle([
      opt(vFig(A.v, B.v), true, null, ''),
      opt(vFig(-A.v, -B.v), false, 'sign', L('The signs are swapped: a vehicle whose position increases has v > 0, one whose position decreases v < 0.', 'Die Vorzeichen sind vertauscht: Ein Fahrzeug, dessen Ort zunimmt, hat v > 0, eines, dessen Ort abnimmt, v < 0.')),
      opt(vFig(B.v, A.v), false, null, L('This graph swaps A and B.', 'Dieser Graph vertauscht A und B.')),
      opt(vFig(Math.abs(A.v), Math.abs(B.v)), false, 'sign', L(`Both velocities are positive here. But ${A.v < 0 ? 'A' : 'B'} moves in the negative direction: its position decreases, so its v is negative.`, `Hier sind beide Geschwindigkeiten positiv. ${A.v < 0 ? 'A' : 'B'} bewegt sich aber in negativer Richtung: Sein Ort nimmt ab, also ist sein v negativ.`)),
    ]), true);
    const velSteps = [
      step(L('Velocity of A', 'Geschwindigkeit von A'), L(`A moves uniformly, so the velocity follows from its two known positions: ${vLine('A')}.`, `A bewegt sich gleichförmig, also folgt die Geschwindigkeit aus seinen zwei bekannten Orten: ${vLine('A')}.`), fig()),
      step(L('Velocity of B', 'Geschwindigkeit von B'), L(`The same for B: ${vLine('B')}.`, `Dasselbe für B: ${vLine('B')}.`), fig()),
    ];
    if (gmode) {
      return finish('tablegraph', seed, 3, {
        data: { times, A, B },
        title: L('From the table to the graph', 'Von der Tabelle zum Graphen'),
        text: L('<p>Two vehicles A and B move uniformly. The table gives some of their positions.</p>', '<p>Zwei Fahrzeuge A und B bewegen sich gleichförmig. Die Tabelle gibt einige ihrer Orte an.</p>'),
        figure: fig(), questions: [q5],
        hints: [
          L('Uniform motion: the velocity is the same all the time, v = Δs/Δt from the two known positions.', 'Gleichförmige Bewegung: Die Geschwindigkeit ist die ganze Zeit gleich, v = Δs/Δt aus den zwei bekannten Orten.'),
          ['A', 'B'].map((n) => { const f = F[n]; return L(`${n}: Δs = ${num(f.sj)} m − ${br(f.si)} in Δt = ${num(f.tj - f.ti)} s.`, `${n}: Δs = ${num(f.sj)} m − ${br(f.si)} in Δt = ${num(f.tj - f.ti)} s.`); }).join(' '),
          L('In a v(t) graph, a uniform motion is a horizontal line at the height of its velocity, with its sign.', 'Im v(t)-Diagramm ist eine gleichförmige Bewegung eine waagrechte Gerade auf der Höhe ihrer Geschwindigkeit, mit Vorzeichen.'),
        ],
        steps: [...velSteps, step(L('The v(t) graph', 'Der v(t)-Graph'), L(`Each velocity stays the same all the time: two horizontal lines, A at ${sval(A.v, 'm/s')} and B at ${sval(B.v, 'm/s')}.`, `Jede Geschwindigkeit bleibt die ganze Zeit gleich: zwei waagrechte Geraden, A bei ${sval(A.v, 'm/s')} und B bei ${sval(B.v, 'm/s')}.`), vFig(A.v, B.v))],
      });
    }
    return finish('table', seed, 3, {
      data: { times, A, B },
      title: L('Completing a value table', 'Wertetabelle ergänzen'),
      text: L('<p>Two vehicles A and B move uniformly. The table gives some of their positions; complete it.</p>', '<p>Zwei Fahrzeuge A und B bewegen sich gleichförmig. Die Tabelle gibt einige ihrer Orte an; ergänze sie.</p>'),
      figure: fig(),
      questions: [vQ('A'), vQ('B'), sQ('A'), sQ('B')],
      hints: [
        L('Uniform motion: the position changes by the same amount in every second. So v = Δs/Δt from any two known positions.', 'Gleichförmige Bewegung: Der Ort ändert sich in jeder Sekunde um gleich viel. Also v = Δs/Δt aus zwei beliebigen bekannten Orten.'),
        ['A', 'B'].map((n) => { const f = F[n]; return L(`${n}: Δs = ${num(f.sj)} m − ${br(f.si)} in Δt = ${num(f.tj - f.ti)} s.`, `${n}: Δs = ${num(f.sj)} m − ${br(f.si)} in Δt = ${num(f.tj - f.ti)} s.`); }).join(' '),
        L('A missing position: start from a known one and add v · Δt (going back in time, Δt is negative).', 'Ein fehlender Ort: Geh von einem bekannten aus und zähle v · Δt dazu (rückwärts in der Zeit ist Δt negativ).'),
      ],
      steps: [
        ...velSteps,
        step(L('Missing positions', 'Fehlende Orte'), L(`From the nearest known position, add v · Δt (Δt negative when going back in time): ${sLine('A')}; ${sLine('B')}.`,
          `Vom nächsten bekannten Ort aus zählt man v · Δt dazu (Δt negativ, wenn man in der Zeit zurückgeht): ${sLine('A')}; ${sLine('B')}.`), fig()),
      ],
    });
  }

  // ---------------------------------------------------------------- graphs of a constantly accelerated motion
  // The s(t), v(t) or a(t) graph of s(t) = s₀ + v₀·t + a·t²/2 over 0 … T, to choose among three
  // wrong ones from typical mistakes, all four on one axis (so that the scale gives nothing away).
  // tau: the time step of the table or the picture (for the v(t) made of the mean velocities of
  // the steps, and for Δ(Δs) = a·τ² taken for a). A wrong graph that looks like one already
  // chosen is left out. Gives { question, right (the right graph, for the solution) }.
  const AXIS_STEPS = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100];
  function niceAxis(vals) {
    let lo = Math.min(0, ...vals), hi = Math.max(0, ...vals);
    const pad = 0.12 * (hi - lo || 1);
    if (lo < 0) lo -= pad;
    if (hi > 0) hi += pad;
    const step = AXIS_STEPS.find((x) => (hi - lo) / x <= 5) || 200;
    return { lo: round(Math.floor(lo / step + 1e-9) * step), hi: round(Math.ceil(hi / step - 1e-9) * step), step };
  }
  // the time axis: a label every tau (or a step that divides T), grid lines in between
  function tTicks(T, tau) {
    if (tau) return { tLabel: tau, tStep: tau / 2 };
    if (T <= 6) return {};
    const lab = [1, 2, 5, 10].find((x) => T / x <= 8 && Number.isInteger(T / x)) || 5;
    return { tLabel: lab, tStep: lab >= 5 ? lab / 5 : lab / 2 };
  }
  // four graphs of quantity q, one right: options [[pts, flag (true: the right one), why], …];
  // the ones that look like an earlier one are left out
  const QLABEL = {
    s: () => L('Position against time', 'Ort gegen die Zeit'),
    v: () => L('Velocity against time', 'Geschwindigkeit gegen die Zeit'),
    a: () => L('Acceleration against time', 'Beschleunigung gegen die Zeit'),
  };
  function graphChoice(r, key, prompt, q, T, cands, o = {}) {
    const ts = Array.from({ length: 81 }, (z, k) => (k * T) / 80);
    const ys = (pts) => ts.map((t) => Figs.valueAt(pts, t));
    // alike: nowhere more than 6 % of the range of the right graph apart
    const own = niceAxis(cands[0][0].map((p) => p[1]));
    const span = own.hi - own.lo, kept = [], seen = [];
    for (const c of cands) {
      if (kept.length === 4) break;
      const y = ys(c[0]);
      if (seen.some((z) => Math.max(...z.map((w, i) => Math.abs(w - y[i]))) < 0.06 * span)) continue;
      kept.push(c); seen.push(y);
    }
    const axis = o.axis || niceAxis(kept.flatMap(([pts]) => pts.map((p) => p[1])));
    const draw = (pts, extra = {}) => graph(q, axis, T, [{ pts }], { label: QLABEL[q](), ...tTicks(T, o.tau), ...extra });
    return {
      question: choice(key, prompt, r.shuffle(kept.map(([pts, flag, why]) => opt(draw(pts), flag === true, flag === true ? null : flag, why || ''))), true),
      right: (extra) => draw(cands[0][0], extra),
    };
  }
  function accChoice(r, key, q, m) {
    const { s0, v0, a, T, tau } = m;
    const s = (t) => s0 + v0 * t + (a * t * t) / 2, vT = v0 + a * T;
    const curve = (f) => Array.from({ length: 41 }, (z, k) => [(k * T) / 40, f((k * T) / 40)]);
    const flat = (y) => [[0, y], [T, y]];
    const n = Math.round(T / tau);
    const means = Array.from({ length: n }, (z, k) => (s((k + 1) * tau) - s(k * tau)) / tau);
    const jumps = means.flatMap((g, k) => [[k * tau, g], [(k + 1) * tau, g]]);
    const dd = a * tau * tau;
    const prompt = L(`Which ${q}(t) graph belongs to this motion?`, `Welcher ${q}(t)-Graph gehört zu dieser Bewegung?`);
    const steadyWhy = L('This graph has the right start and end, but is a straight line: a constant velocity. The changes of position in equal times are not all the same, so the velocity changes.',
      'Dieser Graph hat den richtigen Anfang und das richtige Ende, ist aber eine Gerade: eine konstante Geschwindigkeit. Die Ortsänderungen in gleichen Zeiten sind nicht alle gleich, also ändert sich die Geschwindigkeit.');
    let cands, axis;
    if (q === 's') {
      cands = [
        [curve(s), true],
        [curve((t) => s0 + vT * t - (a * t * t) / 2), 'gaps', L('This graph has the right start and end, but it curves the other way: in it, the changes of position in equal times shrink where they grow in the motion, or grow where they shrink.',
          'Dieser Graph hat den richtigen Anfang und das richtige Ende, ist aber andersherum gekrümmt: In ihm schrumpfen die Ortsänderungen in gleichen Zeiten, wo sie in der Bewegung wachsen, oder wachsen, wo sie schrumpfen.')],
        [curve((t) => s(T - t)), 'order', L('This graph runs backwards in time: it starts where the motion ends. Start at t = 0 and follow the positions in the order of their times.',
          'Dieser Graph läuft rückwärts in der Zeit: Er beginnt, wo die Bewegung endet. Beginne bei t = 0 und folge den Orten in der Reihenfolge ihrer Zeiten.')],
        [[[0, s0], [T, s(T)]], null, steadyWhy],
        [curve((t) => s0 + v0 * t - (a * t * t) / 2), 'sign', L('This graph starts right, but curves the wrong way: the acceleration has the wrong sign. Where the changes of position in equal times grow (with their signs), a > 0.',
          'Dieser Graph beginnt richtig, ist aber falsch gekrümmt: Die Beschleunigung hat das falsche Vorzeichen. Wo die Ortsänderungen in gleichen Zeiten (mit Vorzeichen) wachsen, ist a > 0.')],
        [curve((t) => -s(t)), 'sign', L('This graph is mirrored: its positions have the wrong sign. Read the positions with their signs.', 'Dieser Graph ist gespiegelt: Seine Orte haben das falsche Vorzeichen. Lies die Orte mit ihren Vorzeichen.')],
      ];
    } else if (q === 'v') {
      cands = [
        [[[0, v0], [T, vT]], true],
        [[[0, vT], [T, v0]], 'gaps', L('This graph has the opposite slope: it starts with the final velocity and ends with the initial one. Large changes of position in equal times mean a large velocity.',
          'Dieser Graph hat die entgegengesetzte Steigung: Er beginnt mit der End- und endet mit der Anfangsgeschwindigkeit. Grosse Ortsänderungen in gleichen Zeiten bedeuten eine grosse Geschwindigkeit.')],
        [[[0, -v0], [T, -vT]], 'sign', L('Check the sign: where the position increases, v is positive; where it decreases, v is negative.', 'Achte auf das Vorzeichen: Wo der Ort zunimmt, ist v positiv; wo er abnimmt, ist v negativ.')],
        [jumps, null, L('With a constant acceleration, the velocity changes steadily, not in jumps: the change of position per time step is only its mean in that step, reached in its middle.',
          'Bei konstanter Beschleunigung ändert sich die Geschwindigkeit gleichmässig, nicht sprunghaft: Die Ortsänderung pro Zeitschritt ist nur ihr Mittelwert in diesem Schritt, erreicht in dessen Mitte.')],
        [[[0, 0], [T, vT]], null, L('This graph starts at rest. But already in the first time step the position changes: v is not 0 at t = 0.', 'Dieser Graph beginnt in Ruhe. Aber schon im ersten Zeitschritt ändert sich der Ort: v ist bei t = 0 nicht 0.')],
        [flat((s(T) - s0) / T), null, L('That is the mean velocity over the whole time, a constant. But the changes of position in equal times change, and so does v.', 'Das ist die mittlere Geschwindigkeit über die ganze Zeit, eine Konstante. Aber die Ortsänderungen in gleichen Zeiten ändern sich, und damit auch v.')],
      ];
    } else {
      const aVals = [a, -a, 0, ...(tau !== 1 && Math.abs(dd) <= 4 * Math.abs(a) ? [dd] : [])];
      axis = niceAxis(aVals);
      // v(t) taken for a(t): its shape, squeezed onto the axis of a if need be
      const k = Math.min(1, ...[v0, vT].map((y) => (y > 0 ? (0.9 * axis.hi) / y : y < 0 ? (0.9 * axis.lo) / y : 1)));
      cands = [
        [flat(a), true],
        [flat(-a), 'sign', L('The sign of a: a > 0 when v increases (with its sign), a < 0 when it decreases. Look at how the changes of position in equal times change, with their signs.',
          'Das Vorzeichen von a: a > 0, wenn v zunimmt (mit Vorzeichen), a < 0, wenn v abnimmt. Schau, wie sich die Ortsänderungen in gleichen Zeiten ändern, mit ihren Vorzeichen.')],
        [[[0, k * v0], [T, k * vT]], 'skip', L('That has the shape of the v(t) graph, a sloped line. The acceleration is the slope of v(t): with constant acceleration, a(t) is a horizontal line.',
          'Das hat die Form des v(t)-Graphen, eine schräge Gerade. Die Beschleunigung ist die Steigung von v(t): Bei konstanter Beschleunigung ist a(t) eine waagrechte Gerade.')],
        ...(aVals.length > 3 ? [[flat(dd), 'steps', L(`That is Δ(Δs) itself, in m. With time steps of ${num(tau)} s, Δ(Δs) = a · (${num(tau)} s)².`, `Das ist Δ(Δs) selbst, in m. Bei Zeitschritten von ${num(tau)} s ist Δ(Δs) = a · (${num(tau)} s)².`)]] : []),
        [flat(0), null, L('a = 0 would mean a constant velocity: equal changes of position in equal times. Here they change.', 'a = 0 hiesse konstante Geschwindigkeit: gleiche Ortsänderungen in gleichen Zeiten. Hier ändern sie sich.')],
      ];
    }
    return graphChoice(r, key, prompt, q, T, cands, { tau, axis });
  }

  // ---------------------------------------------------------------- atable: value table, constant acceleration
  // A cart (or, with long time steps, a car) with constant acceleration a, its positions at six
  // times τ apart: s(t) = s₀ + v₀·t + a·t²/2. The changes of position Δs over successive steps
  // change by the same Δ(Δs) = a·τ². Three neighbouring positions are given, so two Δs and their
  // change; of the other three, two are asked for (before, between or after them) and one is
  // given. Then the acceleration a = Δ(Δs)/τ², (★4) the velocity in the middle of the three, and
  // the s(t), v(t) or a(t) graph. ★3: τ = 1 or 2 s; ★4: τ = 0.5, 2, 3, 4 or 5 s.
  const TAU = {
    0.5: { as: [-4, -2, 2, 4], g: 3, max: 20 },
    1: { as: [-2, -1, 1, 2], g: 6, max: 40 },
    2: { as: [-2, -1, -0.5, 0.5, 1, 2], g: 12, max: 60 },
    3: { as: [-2, -1, 1, 2], g: 20, max: 120 },
    4: { as: [-1, -0.5, 0.5, 1], g: 30, max: 150 },
    5: { as: [-0.8, -0.4, 0.4, 0.8], g: 40, max: 200 },
  };
  function atable(seed, d, gmode = false) {
    const r = rng(seed);
    d = d || r.pick([3, 4]);
    const tau = r.pick(d === 3 ? [1, 2] : [0.5, 2, 3, 4, 5]), P = TAU[tau], n = 6;
    const times = Array.from({ length: n }, (z, k) => k * tau), cols = times.map((t, k) => k);
    const u = tau < 1 ? 0.5 : 1; // the first Δs in steps of u
    let a, g0, xs, b, asked, extra, vm;
    for (;;) {
      a = r.pick(P.as);
      g0 = u * r.int(-P.g / u, P.g / u);
      if (!g0) continue;
      xs = [r.int(-Math.round(P.max / 4), Math.round(P.max / 4))];
      for (let k = 0; k < n - 1; k++) xs.push(round(xs[k] + g0 + a * tau * tau * k));
      if (xs.some((x) => Math.abs(x) > P.max) || new Set(xs).size < n - 1) continue;
      b = r.int(0, n - 3); // the three neighbouring positions b, b + 1, b + 2
      const others = cols.filter((k) => k < b || k > b + 2);
      asked = r.shuffle(others.slice()).slice(0, 2).sort((p, q) => p - q);
      extra = others.find((k) => !asked.includes(k));
      vm = round((xs[b + 2] - xs[b]) / (2 * tau)); // the velocity at the middle one, (b + 1)·τ
      if (d === 4 && !nice(vm)) continue;
      break;
    }
    const DD = round(a * tau * tau), v0 = g0 / tau - (a * tau) / 2;
    const gaps = xs.slice(1).map((x, k) => round(x - xs[k]));
    // with a graph to choose, the table is complete
    if (gmode) asked = [];
    const known = gmode ? cols.slice() : [b, b + 1, b + 2, extra];
    // each missing position from a neighbour already known: forward from the left or back from the right
    const how = {}, have = new Set(known), order = [];
    while (order.length < asked.length) {
      for (const k of asked) {
        if (k in how) continue;
        if (have.has(k - 1)) how[k] = 'fwd';
        else if (have.has(k + 1)) how[k] = 'back';
        else continue;
        have.add(k); order.push(k);
      }
    }
    const car = tau >= 3;
    const body = () => (car ? L('car', 'Wagen') : L('cart', 'Wagen'));
    const sv = (x, unit) => sval(x, unit), dif = (x) => `${x > 0 ? '+' : ''}${num(x)}`;
    const pm = (x) => `${x < 0 ? '−' : '+'} ${num(Math.abs(x))}`;
    const ts = `${num(tau)}&nbsp;s`;
    const sAt = (k) => `${it('s')}(${num(times[k])}&nbsp;s)`;
    const row = (all) => ({ name: '', values: times.map((t, k) => (known.includes(k) || all ? xs[k] : asked.includes(k) ? null : '')) });
    const shown = (k) => known.includes(k) && known.includes(k + 1); // Δs from column k to k + 1 given at the start
    const dsRow = (all) => ({ head: 'Δ<i>s</i> in m', values: ['', ...gaps.map((g, k) => (all || shown(k) ? dif(g) : ''))] });
    const ddRow = (all) => ({ head: 'Δ(Δ<i>s</i>) in m', values: ['', '', ...gaps.slice(1).map((g, k) => (all || (shown(k) && shown(k + 1)) ? dif(DD) : ''))] });
    const fig = (o = {}) => table(times, [row(!!o.all), ...(o.rows || [])]);
    const linear = L(`That continues with the neighbouring change of position, as if the velocity stayed the same. But with the acceleration, Δs changes by Δ(Δs) every ${num(tau)} s.`,
      `Das setzt mit der benachbarten Ortsänderung fort, als bliebe die Geschwindigkeit gleich. Mit der Beschleunigung ändert sich Δs aber alle ${num(tau)} s um Δ(Δs).`);
    const questions = order.map((k) => {
      const fwd = how[k] === 'fwd';
      const traps = fwd
        ? (k >= 2 ? [
          { value: xs[k - 1] + gaps[k - 2], flag: 'linear', why: linear },
          { value: xs[k - 1] + gaps[k - 2] - DD, flag: 'sign', why: L('Δs changes by Δ(Δs) every step, with its sign: the next Δs is the one before plus Δ(Δs).', 'Δs ändert sich jeden Schritt um Δ(Δs), mit Vorzeichen: Das nächste Δs ist das vorherige plus Δ(Δs).') },
        ] : [])
        : (k + 1 <= n - 2 ? [
          { value: xs[k + 1] - gaps[k + 1], flag: 'linear', why: linear },
          { value: xs[k + 1] - gaps[k + 1] - DD, flag: 'sign', why: L('Going back, each Δs is the one after it minus Δ(Δs), with its sign.', 'Rückwärts ist jedes Δs das nachfolgende minus Δ(Δs), mit Vorzeichen.') },
        ] : []).concat([
          { value: xs[k + 1] + gaps[k], flag: null, why: L(`Going back in time from ${sAt(k + 1)}, subtract the Δs of that step.`, `Rückwärts in der Zeit von ${sAt(k + 1)} aus ziehst du das Δs dieses Schritts ab.`) },
        ]);
      return numQ(`s${k}`, L(`The position at ${num(times[k])} s:`, `Der Ort bei ${num(times[k])} s:`), L(`Where is the ${body()} at t = ${num(times[k])} s?`, `Wo ist der Wagen bei t = ${num(times[k])} s?`), sAt(k), 'm', xs[k], traps,
        fwd ? L('The next Δs is the one before plus Δ(Δs).', 'Das nächste Δs ist das vorherige plus Δ(Δs).') : L('Going back, each Δs is the one after it minus Δ(Δs).', 'Rückwärts ist jedes Δs das nachfolgende minus Δ(Δs).'));
    });
    questions.push(numQ('a', L(`The acceleration of the ${body()}:`, 'Die Beschleunigung des Wagens:'), L(`What is the acceleration of the ${body()}?`, 'Wie gross ist die Beschleunigung des Wagens?'), it('a'), 'm/s²', a, [
      { value: -a, flag: 'sign', why: L(`Take the changes with their signs: from ${sv(gaps[b], 'm')} to ${sv(gaps[b + 1], 'm')} is a change of ${sv(DD, 'm')}.`, `Nimm die Änderungen mit Vorzeichen: Von ${sv(gaps[b], 'm')} zu ${sv(gaps[b + 1], 'm')} ist eine Änderung von ${sv(DD, 'm')}.`) },
      ...(tau !== 1 ? [
        { value: DD, flag: 'steps', why: L(`That is Δ(Δs) itself. The time step is ${ts}, so Δ(Δs) = a · (${ts})²: divide by ${num(tau * tau)} s².`, `Das ist Δ(Δs) selbst. Der Zeitschritt ist ${ts}, also ist Δ(Δs) = a · (${ts})²: Teile durch ${num(tau * tau)} s².`) },
        { value: DD / tau, flag: 'steps', why: L(`Δ(Δs) = a · (${ts})²: divide by the square of the time step, not by the time step.`, `Δ(Δs) = a · (${ts})²: Teile durch das Quadrat des Zeitschritts, nicht durch den Zeitschritt.`) },
      ] : [
        { value: a / 2, flag: null, why: L('The Δs change by a · (1 s)² from one second to the next: a is that change itself, not half of it.', 'Die Δs ändern sich von einer Sekunde zur nächsten um a · (1 s)²: a ist diese Änderung selbst, nicht die Hälfte davon.') },
        { value: gaps[b + 1], flag: null, why: L('That is a change of position in one second, a mean velocity. The acceleration is how much it changes from one second to the next, divided by (1 s)².', 'Das ist eine Ortsänderung in einer Sekunde, eine mittlere Geschwindigkeit. Die Beschleunigung ist, um wie viel sie sich von einer Sekunde zur nächsten ändert, geteilt durch (1 s)².') },
      ]),
    ], L(`a = Δ(Δs) / (${ts})².`, `a = Δ(Δs) / (${ts})².`)));
    const tm = times[b + 1];
    if (d === 4) {
      questions.push(numQ('vm', L(`The velocity at ${num(tm)} s:`, `Die Geschwindigkeit bei ${num(tm)} s:`), L(`What is the velocity of the ${body()} at t = ${num(tm)} s?`, `Wie gross ist die Geschwindigkeit des Wagens bei t = ${num(tm)} s?`), `${it('v')}(${num(tm)}&nbsp;s)`, 'm/s', vm, [
        { value: gaps[b] / tau, flag: null, why: L(`That is the mean velocity from ${num(times[b])} s to ${num(tm)} s, reached in the middle of that step. For ${num(tm)} s, take the interval around it: from ${num(times[b])} s to ${num(times[b + 2])} s.`, `Das ist die mittlere Geschwindigkeit von ${num(times[b])} s bis ${num(tm)} s, erreicht in der Mitte dieses Schritts. Für ${num(tm)} s nimm das Intervall darum herum: von ${num(times[b])} s bis ${num(times[b + 2])} s.`) },
        { value: gaps[b + 1] / tau, flag: null, why: L(`That is the mean velocity from ${num(tm)} s to ${num(times[b + 2])} s, reached in the middle of that step. For ${num(tm)} s, take the interval around it: from ${num(times[b])} s to ${num(times[b + 2])} s.`, `Das ist die mittlere Geschwindigkeit von ${num(tm)} s bis ${num(times[b + 2])} s, erreicht in der Mitte dieses Schritts. Für ${num(tm)} s nimm das Intervall darum herum: von ${num(times[b])} s bis ${num(times[b + 2])} s.`) },
        { value: xs[b + 1] / tm, flag: 'origin', why: WHY.origin() },
        ...(tau !== 1 ? [{ value: (xs[b + 2] - xs[b]) / 2, flag: 'nodt', why: WHY.nodt() }] : []),
      ], L(`With constant acceleration, the mean velocity from ${num(times[b])} s to ${num(times[b + 2])} s is the velocity in the middle, at ${num(tm)} s.`, `Bei konstanter Beschleunigung ist die mittlere Geschwindigkeit von ${num(times[b])} s bis ${num(times[b + 2])} s die Geschwindigkeit in der Mitte, bei ${num(tm)} s.`)));
    }
    const gq = r.pick(['s', 'v', 'a']);
    const G = accChoice(r, 'graph', gq, { s0: xs[0], v0, a, T: times[n - 1], tau });
    const fill = order.map((k) => (how[k] === 'fwd'
      ? `${sAt(k)} = ${num(xs[k - 1])} m ${pm(gaps[k - 1])} m = ${val(xs[k], 'm')}`
      : `${sAt(k)} = ${num(xs[k + 1])} m ${pm(-gaps[k])} m = ${val(xs[k], 'm')}`));
    const back = order.some((k) => how[k] === 'back'), fwd = order.some((k) => how[k] === 'fwd');
    const graphText = {
      s: L(`With constant acceleration, s(t) is a parabola through the points of the table, curved ${a > 0 ? 'upwards (a &gt; 0)' : 'downwards (a &lt; 0)'}.`, `Bei konstanter Beschleunigung ist s(t) eine Parabel durch die Punkte der Tabelle, ${a > 0 ? 'nach oben gekrümmt (a &gt; 0)' : 'nach unten gekrümmt (a &lt; 0)'}.`),
      v: L(`With constant acceleration, v(t) is a straight line with slope a = ${sv(a, 'm/s²')}, from ${sv(v0, 'm/s')} at t = 0 to ${sv(v0 + a * times[n - 1], 'm/s')} at ${num(times[n - 1])} s.`, `Bei konstanter Beschleunigung ist v(t) eine Gerade mit der Steigung a = ${sv(a, 'm/s²')}, von ${sv(v0, 'm/s')} bei t = 0 bis ${sv(v0 + a * times[n - 1], 'm/s')} bei ${num(times[n - 1])} s.`),
      a: L(`The acceleration is the same all the time: a(t) is a horizontal line at a = ${sv(a, 'm/s²')}.`, `Die Beschleunigung ist die ganze Zeit gleich: a(t) ist eine waagrechte Gerade bei a = ${sv(a, 'm/s²')}.`),
    }[gq];
    const hints = [
      L(`The positions are given every ${ts}. Where two neighbouring positions are given, work out the change of position Δs from one column to the next.`, `Die Orte sind alle ${ts} gegeben. Wo zwei benachbarte Orte gegeben sind, bestimme die Ortsänderung Δs von einer Spalte zur nächsten.`),
      L(`From ${sAt(b)} to ${sAt(b + 2)}: Δs = ${dif(gaps[b])} m and ${dif(gaps[b + 1])} m, a change of Δ(Δs) = ${dif(DD)} m. With constant acceleration, Δs changes by this same amount every ${ts}.`,
        `Von ${sAt(b)} bis ${sAt(b + 2)}: Δs = ${dif(gaps[b])} m und ${dif(gaps[b + 1])} m, eine Änderung von Δ(Δs) = ${dif(DD)} m. Bei konstanter Beschleunigung ändert sich Δs alle ${ts} um genau so viel.`),
      L(`Continue the Δs${fwd ? ' forwards (add Δ(Δs))' : ''}${fwd && back ? ' and' : ''}${back ? ' backwards (subtract Δ(Δs))' : ''}, and add them to the positions. The acceleration follows from Δ(Δs) = a · (${ts})².`,
        `Setze die Δs fort${fwd ? ' vorwärts (Δ(Δs) dazuzählen)' : ''}${fwd && back ? ' und' : ''}${back ? ' rückwärts (Δ(Δs) abziehen)' : ''}, und zähle sie zu den Orten dazu. Die Beschleunigung folgt aus Δ(Δs) = a · (${ts})².`),
      ...(d === 4 ? [L(`With constant acceleration, the mean velocity over an interval is the velocity in its middle: v(${num(tm)} s) = (${sAt(b + 2)} − ${sAt(b)}) / ${num(2 * tau)} s.`, `Bei konstanter Beschleunigung ist die mittlere Geschwindigkeit über ein Intervall gleich der Geschwindigkeit in seiner Mitte: v(${num(tm)} s) = (${sAt(b + 2)} − ${sAt(b)}) / ${num(2 * tau)} s.`)] : []),
    ];
    const steps = [
      step(L(`Changes of position per ${num(tau)} s`, `Ortsänderungen pro ${num(tau)} s`),
        L(`The positions are given at times ${ts} apart. So first work out how far the ${body()} moves in each step: Δs = s(t + ${ts}) − s(t), from one column to the next, where both positions are given.`,
          `Die Orte sind zu Zeiten im Abstand von ${ts} gegeben. Bestimme also zuerst, wie weit der Wagen in jedem Schritt fährt: Δs = s(t + ${ts}) − s(t), von einer Spalte zur nächsten, wo beide Orte gegeben sind.`),
        fig({ rows: [dsRow(false)] })),
      step(L('A constant change of Δs', 'Eine konstante Änderung von Δs'),
        L(`The Δs themselves change by the same amount from one step to the next: Δ(Δs) = ${dif(DD)} m. That is what constant acceleration means, and it lets us continue the table.`, `Die Δs ändern sich selbst von einem Schritt zum nächsten um gleich viel: Δ(Δs) = ${dif(DD)} m. Das bedeutet konstante Beschleunigung, und damit lässt sich die Tabelle fortsetzen.`),
        fig({ rows: [dsRow(false), ddRow(false)] })),
      step(L('The missing Δs', 'Die fehlenden Δs'),
        L(`${fwd ? `Forwards, each Δs is the one before plus Δ(Δs) = ${dif(DD)} m. ` : ''}${back ? `Backwards, each Δs is the one after it minus Δ(Δs). ` : ''}So the Δs are ${gaps.map(dif).join(', ')} m.`,
          `${fwd ? `Vorwärts ist jedes Δs das vorherige plus Δ(Δs) = ${dif(DD)} m. ` : ''}${back ? `Rückwärts ist jedes Δs das nachfolgende minus Δ(Δs). ` : ''}Die Δs sind also ${gaps.map(dif).join(', ')} m.`),
        fig({ rows: [dsRow(true), ddRow(true)] })),
      step(L('The missing positions', 'Die fehlenden Orte'),
        L(`Step by step from a known neighbour: ${fill.join(', ')}.`, `Schritt für Schritt von einem bekannten Nachbarn aus: ${fill.join(', ')}.`),
        fig({ all: true, rows: [dsRow(true), ddRow(true)] })),
      step(L('The acceleration', 'Die Beschleunigung'),
        tau === 1
          ? L(`Each Δs is the mean velocity in that second, so Δ(Δs) is how much this velocity grows from one second to the next: Δ(Δs) = a · (1 s)², so a = ${dif(DD)} m / (1 s)² = ${sv(a, 'm/s²')}.`, `Jedes Δs ist die mittlere Geschwindigkeit in dieser Sekunde, also sagt Δ(Δs), um wie viel diese Geschwindigkeit von einer Sekunde zur nächsten zunimmt: Δ(Δs) = a · (1 s)², also a = ${dif(DD)} m / (1 s)² = ${sv(a, 'm/s²')}.`)
          : L(`Each Δs is the mean velocity in its step times ${ts}, and that mean velocity changes by a · ${ts} from one step to the next. So Δ(Δs) = a · (${ts})² = a · ${num(tau * tau)} s²: a = ${dif(DD)} m / ${num(tau * tau)} s² = ${sv(a, 'm/s²')}.`,
            `Jedes Δs ist die mittlere Geschwindigkeit in seinem Schritt mal ${ts}, und diese mittlere Geschwindigkeit ändert sich von einem Schritt zum nächsten um a · ${ts}. Also ist Δ(Δs) = a · (${ts})² = a · ${num(tau * tau)} s²: a = ${dif(DD)} m / ${num(tau * tau)} s² = ${sv(a, 'm/s²')}.`),
        fig({ all: true, rows: [dsRow(true), ddRow(true)] })),
      ...(d === 4 ? [step(L(`The velocity at ${num(tm)} s`, `Die Geschwindigkeit bei ${num(tm)} s`),
        L(`With constant acceleration, the mean velocity over an interval is reached in its middle. ${num(tm)} s is the middle of ${interval(times[b], times[b + 2])}: v(${num(tm)} s) = (${num(xs[b + 2])} m − ${xs[b] < 0 ? `(${num(xs[b])} m)` : `${num(xs[b])} m`}) / ${num(2 * tau)} s = ${sv(vm, 'm/s')}.`,
          `Bei konstanter Beschleunigung wird die mittlere Geschwindigkeit eines Intervalls in seiner Mitte erreicht. ${num(tm)} s ist die Mitte von ${interval(times[b], times[b + 2])}: v(${num(tm)} s) = (${num(xs[b + 2])} m − ${xs[b] < 0 ? `(${num(xs[b])} m)` : `${num(xs[b])} m`}) / ${num(2 * tau)} s = ${sv(vm, 'm/s')}.`),
        fig({ all: true, rows: [dsRow(true), ddRow(true)] }))] : []),
    ];
    const graphStep = step(L(`The ${gq}(t) graph`, `Der ${gq}(t)-Graph`), graphText, G.right(gq === 's' ? { dots: xs.map((x, k) => [times[k], x]) } : {}));
    if (gmode) {
      // the changes of position, their constant change and the acceleration, then the graph
      return finish('atablegraph', seed, d, {
        data: { times, xs, a, step: tau, graph: gq },
        title: L('From the table to the graph', 'Von der Tabelle zum Graphen'),
        text: L(`<p>A ${body()} moves along a straight ${car ? 'road' : 'track'} with constant acceleration. The table gives its position every ${ts}.</p>`,
          `<p>Ein Wagen bewegt sich mit konstanter Beschleunigung auf einer geraden ${car ? 'Strasse' : 'Bahn'}. Die Tabelle gibt seinen Ort alle ${ts} an.</p>`),
        figure: fig(), questions: [G.question],
        hints: [hints[0], L(`The Δs change by Δ(Δs) = ${dif(DD)} m from step to step: Δ(Δs) = a · (${ts})².`, `Die Δs ändern sich von Schritt zu Schritt um Δ(Δs) = ${dif(DD)} m: Δ(Δs) = a · (${ts})².`),
          { s: L('s(t) is a parabola through the points of the table.', 's(t) ist eine Parabel durch die Punkte der Tabelle.'), v: L('With constant acceleration, v(t) is a straight line; each Δs/Δt is the velocity in the middle of its step.', 'Bei konstanter Beschleunigung ist v(t) eine Gerade; jedes Δs/Δt ist die Geschwindigkeit in der Mitte seines Schritts.'), a: L('With constant acceleration, a(t) is a horizontal line at the value of a.', 'Bei konstanter Beschleunigung ist a(t) eine waagrechte Gerade beim Wert von a.') }[gq]],
        steps: [steps[0], steps[1], steps[4], graphStep],
      });
    }
    return finish('atable', seed, d, {
      data: { times, xs, a, step: tau, b, asked, order, vm },
      title: L('Value table with acceleration', 'Wertetabelle mit Beschleunigung'),
      text: L(`<p>A ${body()} moves along a straight ${car ? 'road' : 'track'} with constant acceleration. The table gives its position every ${ts}, with gaps; complete it.</p>`,
        `<p>Ein Wagen bewegt sich mit konstanter Beschleunigung auf einer geraden ${car ? 'Strasse' : 'Bahn'}. Die Tabelle gibt seinen Ort alle ${ts} an, mit Lücken; ergänze sie.</p>`),
      figure: fig(),
      questions,
      hints,
      steps,
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
  function strobeEx(seed, d, gmode = false) {
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
    // with a graph to choose: ★2 the s(t) graph, ★3 the v(t) or the a(t) graph; else questions
    const gq = d === 2 ? 's' : r.pick(['v', 'a']);
    const graphQs = [];
    if (gq === 's') {
      graphQs.push(choice('graph', L('Which s(t) graph belongs to this motion?', 'Welcher s(t)-Graph gehört zu dieser Bewegung?'), r.shuffle([
        opt(sGraph(curve(gaps, x0)), true, null, ''),
        opt(sGraph(curve(inv, x0)), false, 'gaps', WHYG.gaps()),
        opt(sGraph(curve(gaps, x0).map(([t]) => [t, sAt(gaps, x0, n - t)])), false, 'order', WHYG.order()),
        opt(sGraph([[0, xs[0]], [n, xs[n]]]), false, null, WHYG.steady()),
      ]), true));
    } else if (gq === 'v') {
      graphQs.push(choice('graph', L('Which v(t) graph belongs to this motion?', 'Welcher v(t)-Graph gehört zu dieser Bewegung?'), r.shuffle([
        opt(vGraph(vLine(gaps)), true, null, ''),
        opt(vGraph(vLine(inv)), false, 'gaps', WHYG.gaps()),
        opt(vGraph(vLine(gaps.map((g) => -g))), false, 'sign', WHYG.sign()),
        opt(vGraph(steps(gaps)), false, null, WHYG.jumps()),
      ]), true));
    }
    const A = gq === 'a' ? accChoice(r, 'graph', 'a', { s0: x0, v0, a: acc, T: n, tau: 1 }) : null;
    if (A) graphQs.push(A.question);
    const questions = [];
    // ★2: in which second the cart is fastest (the largest distance between neighbouring dots)
    if (d === 2) {
      const ks = gaps.map((g, k) => k), fast = ks.reduce((m, k) => (Math.abs(gaps[k]) > Math.abs(gaps[m]) ? k : m), 0);
      const slow = ks.reduce((m, k) => (Math.abs(gaps[k]) < Math.abs(gaps[m]) ? k : m), 0);
      const pickK = [fast, slow, ...r.shuffle(ks.filter((k) => k !== fast && k !== slow))].slice(0, 4).sort((x, y) => x - y);
      questions.push(choice('fastest', L('In which second does the cart move fastest?', 'In welcher Sekunde fährt der Wagen am schnellsten?'), pickK.map((k) =>
        opt(interval(k, k + 1), k === fast, k === slow ? 'gaps' : null, k === slow ? WHYG.gaps()
          : L(`In this second the cart moves ${val(Math.abs(gaps[k]), 'm')}; in ${interval(fast, fast + 1)} it moves ${val(Math.abs(gaps[fast]), 'm')}, farther.`, `In dieser Sekunde fährt der Wagen ${val(Math.abs(gaps[k]), 'm')}; in ${interval(fast, fast + 1)} fährt er ${val(Math.abs(gaps[fast]), 'm')}, weiter.`)))));
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
    const S = {
      gaps: step(L('Distances per second', 'Abstände pro Sekunde'), L(`From one dot to the next, the cart moves: ${gapText}. They change by ${sval(acc, 'm')} each second: a constant acceleration a = ${sval(acc, 'm/s²')}.`,
        `Von einem Punkt zum nächsten fährt der Wagen: ${gapText}. Sie ändern sich jede Sekunde um ${sval(acc, 'm')}: eine konstante Beschleunigung a = ${sval(acc, 'm/s²')}.`), fig()),
      s: step(L('The s(t) graph', 'Der s(t)-Graph'), L('Each dot gives a point (t, s). With constant acceleration, s(t) is a parabola through these points.', 'Jeder Punkt gibt einen Punkt (t, s). Bei konstanter Beschleunigung ist s(t) eine Parabel durch diese Punkte.'),
        sGraph(curve(gaps, x0), { dots: xs.map((x, k) => [k, x]) })),
      v: step(L('The v(t) graph', 'Der v(t)-Graph'), L(`The distance in each second is the mean velocity in that second, reached in its middle (dots). v(t) is the straight line through them, from ${sval(v0, 'm/s')} at t = 0 with slope a = ${sval(acc, 'm/s²')}. So the cart ${HOW[pat.how]()}.`,
        `Der Abstand in jeder Sekunde ist die mittlere Geschwindigkeit in dieser Sekunde, erreicht in deren Mitte (Punkte). v(t) ist die Gerade durch sie, von ${sval(v0, 'm/s')} bei t = 0 mit der Steigung a = ${sval(acc, 'm/s²')}. Der Wagen ${HOW[pat.how]()}.`),
        vGraph(vLine(gaps), { dots: means })),
      a: () => step(L('The a(t) graph', 'Der a(t)-Graph'), L(`The acceleration is the slope of v(t), the same all the time: a(t) is a horizontal line at a = ${sval(acc, 'm/s²')}.`,
        `Die Beschleunigung ist die Steigung von v(t), die ganze Zeit gleich: a(t) ist eine waagrechte Gerade bei a = ${sval(acc, 'm/s²')}.`), A.right()),
    };
    const text = L('<p>A cart moves along a straight track with constant acceleration. The stroboscope picture shows where it is every second, from t = 0 (the numbers above the dots are the times in s).</p>',
      '<p>Ein Wagen bewegt sich mit konstanter Beschleunigung auf einer geraden Bahn. Die Stroboskopaufnahme zeigt, wo er jede Sekunde ist, ab t = 0 (die Zahlen über den Punkten sind die Zeiten in s).</p>');
    const hint0 = L('The distance between two neighbouring dots is how far the cart moves in one second, its mean velocity in that second: a large distance means fast, a small one slow.', 'Der Abstand zwischen zwei benachbarten Punkten ist, wie weit der Wagen in einer Sekunde fährt, seine mittlere Geschwindigkeit in dieser Sekunde: Ein grosser Abstand bedeutet schnell, ein kleiner langsam.');
    if (gmode) {
      return finish('strobegraph', seed, d, {
        data: { xs, gaps, acc, v0, graph: gq },
        title: L('From the picture to the graph', 'Vom Bild zum Graphen'),
        text, figure: fig(), questions: graphQs,
        hints: [hint0, L(`The changes of position per second: ${gapText}.`, `Die Ortsänderungen pro Sekunde: ${gapText}.`), {
          s: L(`So the s(t) graph goes through ${xs.map((x, k) => `(${k} s, ${num(x)} m)`).join(', ')}, curved like a parabola.`, `Der s(t)-Graph geht also durch ${xs.map((x, k) => `(${k} s, ${num(x)} m)`).join(', ')}, gekrümmt wie eine Parabel.`),
          v: L(`The mean velocity in each second is reached in its middle: v(0.5 s) = ${sval(gaps[0], 'm/s')}, v(1.5 s) = ${sval(gaps[1], 'm/s')}, …; v(t) is the straight line through these points.`, `Die mittlere Geschwindigkeit jeder Sekunde wird in deren Mitte erreicht: v(0.5 s) = ${sval(gaps[0], 'm/s')}, v(1.5 s) = ${sval(gaps[1], 'm/s')}, …; v(t) ist die Gerade durch diese Punkte.`),
          a: L('The distances per second change by the same amount each second: a constant acceleration, a horizontal line in the a(t) graph.', 'Die Abstände pro Sekunde ändern sich jede Sekunde um gleich viel: eine konstante Beschleunigung, eine waagrechte Gerade im a(t)-Graphen.'),
        }[gq]],
        steps: gq === 's' ? [S.gaps, S.s] : gq === 'v' ? [S.gaps, S.v] : [S.gaps, S.v, S.a()],
      });
    }
    return finish('strobe', seed, d, {
      data: { xs, gaps, how: pat.how, acc, v0 },
      title: L('Stroboscope picture', 'Stroboskopaufnahme'),
      text: L('<p>A cart moves along a straight track with constant acceleration. The stroboscope picture shows where it is every second, from t = 0 (the numbers above the dots are the times in s).</p>',
        '<p>Ein Wagen bewegt sich mit konstanter Beschleunigung auf einer geraden Bahn. Die Stroboskopaufnahme zeigt, wo er jede Sekunde ist, ab t = 0 (die Zahlen über den Punkten sind die Zeiten in s).</p>'),
      figure: fig(),
      questions,
      hints: [
        hint0,
        L('With constant acceleration, the distances per second change by the same amount each second.', 'Bei konstanter Beschleunigung ändern sich die Abstände pro Sekunde jede Sekunde um gleich viel.'),
        L(`The changes of position per second: ${gapText}.`, `Die Ortsänderungen pro Sekunde: ${gapText}.`),
      ],
      steps: [S.gaps, S.v],
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

  // ---------------------------------------------------------------- match: from one graph to the next
  // A graph and four graphs to choose from, over 10 s. ★2: a piecewise uniform s(t) and its v(t);
  // ★3: a piecewise linear v(t) and its a(t); ★4: an s(t) of pieces with constant acceleration
  // (parabolas and straight lines, joined without kinks) and its a(t), by way of v(t). The wrong
  // ones: the sign, the shape of the given graph copied, all v positive (★2), the mean values of
  // v instead of its slopes (★3), v(t) instead of a(t) (★4).
  function matchEx(seed, d) {
    const r = rng(seed);
    d = d || r.pick([2, 3, 4]);
    return d === 2 ? matchSV(r, seed) : d === 3 ? matchVA(r, seed) : matchSA(r, seed);
  }
  const T10 = 10, AX4 = { lo: -4, hi: 4, step: 2 };
  // breakpoints 0 < … < 10 s: four pieces of 2–4 s
  function breaks(r) {
    for (;;) {
      const ts = [0];
      while (ts.length < 4) ts.push(ts[ts.length - 1] + r.pick([2, 3, 4]));
      if (ts[3] < 9 && ts[3] >= 6) return [...ts, T10];
    }
  }
  const stepsOf = (ps, f) => ps.flatMap((p) => [[p.t0, f(p)], [p.t1, f(p)]]);
  const matchText = (q) => ({
    s: L('<p>A body moves along a straight line. The graph shows its position against time.</p>', '<p>Ein Körper bewegt sich auf einer Geraden. Der Graph zeigt seinen Ort gegen die Zeit.</p>'),
    v: L('<p>A body moves along a straight line. The graph shows its velocity against time.</p>', '<p>Ein Körper bewegt sich auf einer Geraden. Der Graph zeigt seine Geschwindigkeit gegen die Zeit.</p>'),
  }[q]);
  const matchPrompt = (q) => L(`Which ${q}(t) graph belongs to it?`, `Welcher ${q}(t)-Graph gehört dazu?`);
  const copyWhy = (from, to) => L(`This graph has the shape of the ${from}(t) graph. But ${to} is the slope of ${from}, not its value: ${to} is constant where ${from}(t) is a straight line.`,
    `Dieser Graph hat die Form des ${from}(t)-Graphen. ${to} ist aber die Steigung von ${from}, nicht sein Wert: ${to} ist konstant, wo ${from}(t) eine Gerade ist.`);

  function matchSV(r, seed) {
    let ts, ss, ps;
    for (;;) {
      ts = breaks(r);
      ss = ts.map(() => r.int(-4, 4));
      ps = ts.slice(1).map((t1, i) => ({ t0: ts[i], t1, s0: ss[i], s1: ss[i + 1], v: (ss[i + 1] - ss[i]) / (t1 - ts[i]) }));
      if (ps.some((p) => !Number.isInteger(2 * p.v) || Math.abs(p.v) > 3)) continue;
      if (ps.some((p, i) => i && p.v === ps[i - 1].v)) continue;
      if (ps.some((p) => p.v < 0) && ps.some((p) => p.v > 0)) break;
    }
    const sPts = ts.map((t, i) => [t, ss[i]]);
    const sFig = (o = {}) => graph('s', AX4, T10, [{ pts: sPts }], { label: QLABEL.s(), ...o });
    const G = graphChoice(r, 'graph', matchPrompt('v'), 'v', T10, [
      [stepsOf(ps, (p) => p.v), true],
      [stepsOf(ps, (p) => -p.v), 'sign', WHY.sign()],
      [stepsOf(ps, (p) => Math.abs(p.v)), 'sign', L('Here every velocity is positive. But where s decreases, the body moves in the negative direction: v < 0 there.', 'Hier ist jede Geschwindigkeit positiv. Wo s abnimmt, bewegt sich der Körper aber in negativer Richtung: Dort ist v < 0.')],
      [sPts, 'copy', copyWhy('s', 'v')],
      [stepsOf(ps, (p) => p.s1), 'position', WHY.position1()],
    ], { axis: AX4 });
    const desc = (p) => (p.v === 0
      ? L(`${interval(p.t0, p.t1)}: s stays at ${val(p.s0, 'm')}: v = 0.`, `${interval(p.t0, p.t1)}: s bleibt bei ${val(p.s0, 'm')}: v = 0.`)
      : L(`${interval(p.t0, p.t1)}: s ${p.v > 0 ? 'rises' : 'falls'} from ${val(p.s0, 'm')} to ${val(p.s1, 'm')}: v = ${num(p.s1 - p.s0)} m / ${num(p.t1 - p.t0)} s = ${sval(p.v, 'm/s')}.`,
        `${interval(p.t0, p.t1)}: s ${p.v > 0 ? 'steigt' : 'fällt'} von ${val(p.s0, 'm')} auf ${val(p.s1, 'm')}: v = ${num(p.s1 - p.s0)} m / ${num(p.t1 - p.t0)} s = ${sval(p.v, 'm/s')}.`));
    return finish('match', seed, 2, {
      data: { pieces: ps },
      title: L('From s(t) to v(t)', 'Von s(t) zu v(t)'),
      text: matchText('s'),
      figure: sFig(),
      questions: [G.question],
      hints: [
        L('The velocity is the slope of the s(t) graph: its sign is the direction, its steepness the speed.', 'Die Geschwindigkeit ist die Steigung des s(t)-Graphen: Ihr Vorzeichen ist die Richtung, ihre Steilheit das Tempo.'),
        L('Each straight piece of s(t) has one slope, so v is constant there: v(t) is made of horizontal pieces.', 'Jedes gerade Stück von s(t) hat eine Steigung, also ist v dort konstant: v(t) besteht aus waagrechten Stücken.'),
        L('Where s falls, v is negative, wherever the graph lies; where s is horizontal, v = 0.', 'Wo s fällt, ist v negativ, egal wo der Graph liegt; wo s waagrecht ist, ist v = 0.'),
        L(`The velocities: ${ps.map((p) => `${interval(p.t0, p.t1)}: ${sval(p.v, 'm/s')}`).join(', ')}.`, `Die Geschwindigkeiten: ${ps.map((p) => `${interval(p.t0, p.t1)}: ${sval(p.v, 'm/s')}`).join(', ')}.`),
      ],
      steps: [
        step(L('The slope is the velocity', 'Die Steigung ist die Geschwindigkeit'), L('Each piece of the s(t) graph is a straight line, so the velocity is constant in each piece: v = Δs/Δt, with its sign.', 'Jedes Stück des s(t)-Graphen ist eine Gerade, also ist die Geschwindigkeit in jedem Stück konstant: v = Δs/Δt, mit Vorzeichen.'), sFig()),
        ...ps.map((p, i) => step(L(`Piece ${i + 1}`, `Stück ${i + 1}`), desc(p), sFig({ band: [p.t0, p.t1], dots: [[p.t0, p.s0], [p.t1, p.s1]] }))),
        step(L('The v(t) graph', 'Der v(t)-Graph'), L('One horizontal piece for each straight piece of s(t), at the height of its velocity.', 'Ein waagrechtes Stück für jedes gerade Stück von s(t), auf der Höhe seiner Geschwindigkeit.'), G.right()),
      ],
    });
  }

  function matchVA(r, seed) {
    let ts, vs, ps;
    for (;;) {
      ts = breaks(r);
      vs = ts.map(() => r.int(-3, 3));
      ps = ts.slice(1).map((t1, i) => ({ t0: ts[i], t1, v0: vs[i], v1: vs[i + 1], a: (vs[i + 1] - vs[i]) / (t1 - ts[i]) }));
      if (ps.some((p) => !Number.isInteger(2 * p.a) || Math.abs(p.a) > 3)) continue;
      if (ps.some((p, i) => i && p.a === ps[i - 1].a)) continue;
      if (ps.filter((p) => p.a === 0).length > 1) continue;
      if (ps.some((p) => p.a < 0) && ps.some((p) => p.a > 0)) break;
    }
    const vPts = ts.map((t, i) => [t, vs[i]]);
    const vFig = (o = {}) => graph('v', AX4, T10, [{ pts: vPts }], { label: QLABEL.v(), ...o });
    const G = graphChoice(r, 'graph', matchPrompt('a'), 'a', T10, [
      [stepsOf(ps, (p) => p.a), true],
      [stepsOf(ps, (p) => -p.a), 'sign', L('Check the sign: where v increases, a is positive; where v decreases, a is negative, wherever the graph lies.', 'Achte auf das Vorzeichen: Wo v zunimmt, ist a positiv; wo v abnimmt, ist a negativ, egal wo der Graph liegt.')],
      [vPts, 'copy', copyWhy('v', 'a')],
      [stepsOf(ps, (p) => (p.v0 + p.v1) / 2), 'value', L('This shows the mean value of v in each piece, not its slope. The acceleration is how fast v changes: Δv/Δt.', 'Das zeigt den Mittelwert von v in jedem Stück, nicht seine Steigung. Die Beschleunigung sagt, wie schnell sich v ändert: Δv/Δt.')],
      [stepsOf(ps, (p) => p.v1), 'value', L('This shows the value of v at the end of each piece, not its slope. The acceleration is how fast v changes: Δv/Δt.', 'Das zeigt den Wert von v am Ende jedes Stücks, nicht seine Steigung. Die Beschleunigung sagt, wie schnell sich v ändert: Δv/Δt.')],
    ], { axis: AX4 });
    const desc = (p) => (p.a === 0
      ? L(`${interval(p.t0, p.t1)}: v stays at ${sval(p.v0, 'm/s')}: a = 0.`, `${interval(p.t0, p.t1)}: v bleibt bei ${sval(p.v0, 'm/s')}: a = 0.`)
      : L(`${interval(p.t0, p.t1)}: v ${p.a > 0 ? 'rises' : 'falls'} from ${sval(p.v0, 'm/s')} to ${sval(p.v1, 'm/s')}: a = ${num(p.v1 - p.v0)} m/s / ${num(p.t1 - p.t0)} s = ${sval(p.a, 'm/s²')}.`,
        `${interval(p.t0, p.t1)}: v ${p.a > 0 ? 'steigt' : 'fällt'} von ${sval(p.v0, 'm/s')} auf ${sval(p.v1, 'm/s')}: a = ${num(p.v1 - p.v0)} m/s / ${num(p.t1 - p.t0)} s = ${sval(p.a, 'm/s²')}.`));
    return finish('match', seed, 3, {
      data: { pieces: ps },
      title: L('From v(t) to a(t)', 'Von v(t) zu a(t)'),
      text: matchText('v'),
      figure: vFig(),
      questions: [G.question],
      hints: [
        L('The acceleration is the slope of the v(t) graph: how many m/s the velocity changes per second.', 'Die Beschleunigung ist die Steigung des v(t)-Graphen: um wie viele m/s sich die Geschwindigkeit pro Sekunde ändert.'),
        L('Each straight piece of v(t) has one slope, so a is constant there: a(t) is made of horizontal pieces.', 'Jedes gerade Stück von v(t) hat eine Steigung, also ist a dort konstant: a(t) besteht aus waagrechten Stücken.'),
        L('Where v falls, a is negative, also above the t axis; where v rises, a is positive, also below it.', 'Wo v fällt, ist a negativ, auch über der t-Achse; wo v steigt, ist a positiv, auch darunter.'),
        L(`The accelerations: ${ps.map((p) => `${interval(p.t0, p.t1)}: ${sval(p.a, 'm/s²')}`).join(', ')}.`, `Die Beschleunigungen: ${ps.map((p) => `${interval(p.t0, p.t1)}: ${sval(p.a, 'm/s²')}`).join(', ')}.`),
      ],
      steps: [
        step(L('The slope is the acceleration', 'Die Steigung ist die Beschleunigung'), L('Each piece of the v(t) graph is a straight line, so the acceleration is constant in each piece: a = Δv/Δt, with its sign. How high the graph lies does not matter.', 'Jedes Stück des v(t)-Graphen ist eine Gerade, also ist die Beschleunigung in jedem Stück konstant: a = Δv/Δt, mit Vorzeichen. Wie hoch der Graph liegt, spielt keine Rolle.'), vFig()),
        ...ps.map((p, i) => step(L(`Piece ${i + 1}`, `Stück ${i + 1}`), desc(p), vFig({ band: [p.t0, p.t1], dots: [[p.t0, p.v0], [p.t1, p.v1]] }))),
        step(L('The a(t) graph', 'Der a(t)-Graph'), L('One horizontal piece for each straight piece of v(t), at the height of its slope.', 'Ein waagrechtes Stück für jedes gerade Stück von v(t), auf der Höhe seiner Steigung.'), G.right()),
      ],
    });
  }

  // three pieces with constant accelerations, v continuous: s is a parabola where a ≠ 0
  const SA_LENGTHS = [[3, 3, 4], [4, 3, 3], [3, 4, 3], [2, 4, 4], [4, 2, 4], [4, 4, 2]];
  function matchSA(r, seed) {
    let ps, sPts, axis;
    for (;;) {
      const ls = r.pick(SA_LENGTHS), as = ls.map(() => r.pick([-2, -1, 0, 1, 2]));
      if (as.some((a, i) => i && a === as[i - 1]) || !as.some((a) => a > 0) || !as.some((a) => a < 0)) continue;
      let t = 0, v = r.int(-3, 3), s = r.int(-4, 4);
      ps = ls.map((l, i) => {
        const p = { t0: t, t1: t + l, a: as[i], v0: v, s0: s };
        v += as[i] * l; s += p.v0 * l + (as[i] * l * l) / 2; t += l;
        return { ...p, v1: v, s1: s };
      });
      if (ps.some((p) => Math.abs(p.v1) > 4)) continue;
      sPts = Array.from({ length: 81 }, (z, k) => {
        const tt = k / 8, p = ps.find((q) => tt <= q.t1 + 1e-9), x = tt - p.t0;
        return [tt, p.s0 + p.v0 * x + (p.a * x * x) / 2];
      });
      axis = niceAxis(sPts.map((p) => p[1]));
      // every bend visible: the parabola leaves its chord by at least 4 % of the axis
      if (ps.some((p) => p.a && (Math.abs(p.a) * (p.t1 - p.t0) ** 2) / 8 < 0.04 * (axis.hi - axis.lo))) continue;
      if (axis.hi - axis.lo > 40) continue;
      break;
    }
    const vPts = [[0, ps[0].v0], ...ps.map((p) => [p.t1, p.v1])];
    const sFig = (o = {}) => graph('s', axis, T10, [{ pts: sPts }], { label: QLABEL.s(), ...o });
    const vFig = (o = {}) => graph('v', niceAxis(vPts.map((p) => p[1])), T10, [{ pts: vPts }], { label: QLABEL.v(), ...o });
    const sMin = Math.min(...sPts.map((p) => p[1])), sMax = Math.max(...sPts.map((p) => p[1]));
    const G = graphChoice(r, 'graph', matchPrompt('a'), 'a', T10, [
      [stepsOf(ps, (p) => p.a), true],
      [stepsOf(ps, (p) => -p.a), 'sign', L('Check the sign: where s(t) curves upwards (its slope grows), a > 0; where it curves downwards, a < 0.', 'Achte auf das Vorzeichen: Wo s(t) nach oben gekrümmt ist (seine Steigung wächst), ist a > 0; wo es nach unten gekrümmt ist, a < 0.')],
      [vPts, 'skip', L('That is the v(t) graph, the slope of s(t). The acceleration is one step further: the slope of v(t).', 'Das ist der v(t)-Graph, die Steigung von s(t). Die Beschleunigung ist einen Schritt weiter: die Steigung von v(t).')],
      [sPts.map(([t, y]) => [t, -3 + (6 * (y - sMin)) / (sMax - sMin)]), 'copy', copyWhy('s', 'a')],
      [stepsOf(ps, (p) => (p.v0 + p.v1) / 2), 'skip', L('This shows the mean velocity in each piece, the slope of its chord in s(t). The acceleration is how fast v changes: the slope of v(t).', 'Das zeigt die mittlere Geschwindigkeit in jedem Stück, die Steigung seiner Sehne in s(t). Die Beschleunigung sagt, wie schnell sich v ändert: die Steigung von v(t).')],
    ], { axis: AX4 });
    const shape = (p) => (p.a === 0
      ? L('a straight line: v is constant, a = 0', 'eine Gerade: v ist konstant, a = 0')
      : p.a > 0 ? L('curved upwards: its slope v grows, a &gt; 0', 'nach oben gekrümmt: Seine Steigung v wächst, a &gt; 0')
        : L('curved downwards: its slope v shrinks, a &lt; 0', 'nach unten gekrümmt: Seine Steigung v nimmt ab, a &lt; 0'));
    const aLine = (p) => (p.a === 0
      ? `${interval(p.t0, p.t1)}: a = 0`
      : `${interval(p.t0, p.t1)}: a = (${num(p.v1)} m/s − ${p.v0 < 0 ? `(${num(p.v0)} m/s)` : `${num(p.v0)} m/s`}) / ${num(p.t1 - p.t0)} s = ${sval(p.a, 'm/s²')}`);
    return finish('match', seed, 4, {
      data: { pieces: ps },
      title: L('From s(t) to a(t)', 'Von s(t) zu a(t)'),
      text: matchText('s'),
      figure: sFig(),
      questions: [G.question],
      hints: [
        L('Two steps: the velocity is the slope of s(t), and the acceleration is the slope of v(t).', 'Zwei Schritte: Die Geschwindigkeit ist die Steigung von s(t), und die Beschleunigung ist die Steigung von v(t).'),
        L('Where s(t) is a straight line, v is constant and a = 0. Where s(t) curves upwards, its slope grows: a > 0; where it curves downwards, a < 0.', 'Wo s(t) eine Gerade ist, ist v konstant und a = 0. Wo s(t) nach oben gekrümmt ist, wächst seine Steigung: a > 0; wo es nach unten gekrümmt ist, a < 0.'),
        L('With constant acceleration in a piece, a(t) is horizontal there; s(t) is a parabola in that piece.', 'Bei konstanter Beschleunigung in einem Stück ist a(t) dort waagrecht; s(t) ist in diesem Stück eine Parabel.'),
        L(`The pieces: ${ps.map((p) => `${interval(p.t0, p.t1)}: ${p.a === 0 ? L('straight', 'gerade') : p.a > 0 ? L('curved upwards', 'nach oben gekrümmt') : L('curved downwards', 'nach unten gekrümmt')}`).join(', ')}.`,
          `Die Stücke: ${ps.map((p) => `${interval(p.t0, p.t1)}: ${p.a === 0 ? L('straight', 'gerade') : p.a > 0 ? L('curved upwards', 'nach oben gekrümmt') : L('curved downwards', 'nach unten gekrümmt')}`).join(', ')}.`),
      ],
      steps: [
        step(L('Two steps', 'Zwei Schritte'), L('From s(t) to a(t) takes two steps: v is the slope of s(t), and a is the slope of v(t). The shape of s(t) already tells the sign of a: straight means a = 0, curved upwards a &gt; 0, curved downwards a &lt; 0.',
          'Von s(t) zu a(t) braucht es zwei Schritte: v ist die Steigung von s(t), und a ist die Steigung von v(t). Die Form von s(t) verrät schon das Vorzeichen von a: gerade heisst a = 0, nach oben gekrümmt a &gt; 0, nach unten gekrümmt a &lt; 0.'), sFig()),
        ...ps.map((p, i) => step(L(`Piece ${i + 1}`, `Stück ${i + 1}`), L(`${interval(p.t0, p.t1)}: s(t) is ${shape(p)}.`, `${interval(p.t0, p.t1)}: s(t) ist ${shape(p)}.`), sFig({ band: [p.t0, p.t1] }))),
        step(L('The v(t) graph', 'Der v(t)-Graph'), L(`The slope of s(t): v changes steadily in each piece, without jumps (s(t) has no kinks). It goes through ${vPts.map(([t, v]) => `(${num(t)} s, ${sval(v, 'm/s')})`).join(', ')}.`,
          `Die Steigung von s(t): v ändert sich in jedem Stück gleichmässig, ohne Sprünge (s(t) hat keine Knicke). Es geht durch ${vPts.map(([t, v]) => `(${num(t)} s, ${sval(v, 'm/s')})`).join(', ')}.`), vFig({ dots: vPts })),
        step(L('The a(t) graph', 'Der a(t)-Graph'), L(`The slope of v(t) in each piece: ${ps.map(aLine).join('; ')}.`, `Die Steigung von v(t) in jedem Stück: ${ps.map(aLine).join('; ')}.`), G.right()),
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

  const BUILD = { compare, direction, table: tableEx, tablegraph: tableGraph, atable, atablegraph: (seed, d) => atable(seed, d, true), strobe: strobeEx, strobegraph: (seed, d) => strobeEx(seed, d, true), area: areaEx, match: matchEx };
  const DIFF = { compare: [1, 2], direction: [2], table: [2, 3], tablegraph: [2, 3], atable: [3, 4], atablegraph: [3, 4], strobe: [2, 3], strobegraph: [2, 3], area: [3, 4], match: [2, 3, 4] };
  const make = (kind, seed, d) => BUILD[kind](seed, d);
  for (const k of Object.keys(BUILD)) Motion.register(k, { difficulties: DIFF[k], make: (seed, d) => make(k, seed, d) });

  const api = { KINDS: Object.keys(BUILD), DIFF, FLAGS, make, arcade, integrate };
  root.Concepts = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
