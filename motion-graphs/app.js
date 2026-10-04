(function () {
  'use strict';

  const { generate, ofDifficulty, quiz, evaluate, copied, sloped, len, rate, area } = window.Motion;
  const Concepts = window.Concepts, Quiz = window.Quiz;
  const Plot = window.Plot, { sourceGraph, UNIT, dec } = Plot;
  const Lang = window.Lang, Arcade = window.Arcade, L = Lang.L;
  const NARROW = 560;
  const $ = (sel) => document.querySelector(sel);
  const MAX_TRIES = 3;
  const LABEL = { sv: 's → v', va: 'v → a', vs: 'v → s', av: 'a → v' };

  // ---------------------------------------------------------------- interface texts
  const UI = {
    en: {
      title: 'Motion Graphs', mode: 'Mode', difficulty: 'Difficulty', example: 'Example',
      tutor: 'Tutor', practice: 'Practice', arcade: 'Arcade', new: 'New exercise',
      tutorNote: 'Use the arrow keys ← → to step through. The piece a step is about is <span class="k-band">highlighted</span> in both graphs; dashed lines are chords (mean values), short lines tangents, and shaded areas count <span class="k-pos">positive</span> above and <span class="k-neg">negative</span> below the time axis.',
      given: 'Given', yours: 'Your graph', answer: 'Answer',
      check: 'Check', reset: 'Reset drawing', reveal: 'Show solution', hints: 'Hints', solution: 'Solution',
      revealNote: 'The solution unlocks once you have solved the exercise, used all hints or made three attempts.',
      levels: { easy: 'Easy', medium: 'Medium', hard: 'Hard', mixed: 'Mixed' },
      stars: (d) => `Difficulty: ${d} of 5`,
      score: (s, c) => `Solved: ${s} · first try without hints: ${c}`,
      hint: (n) => `Hint (${n} left)`, noHints: 'No more hints', unlocks: (n) => `Unlocks after all hints or ${n} attempts`,
      ok: 'All five pieces are correct, well done!',
      some: (r, n, k) => `${r} of ${n} pieces are correct (attempt ${k}).`,
      canReveal: ' You can take a hint or look at the solution.', tryAgain: ' Correct the pieces marked ✗ and check again, or take a hint.',
      shown: 'The correct graph is now shown as a dashed black line.',
      choose: 'Answer every question, then check again.',
      qOk: 'All answers are correct, well done!',
      qSome: (r, n, k) => `${r} of ${n} answers are correct (attempt ${k}).`,
      qTry: ' Correct the answers marked ✗ and check again, or take a hint.',
      qShown: 'The worked solution is shown below.',
      answers: 'Answers', wrongs: 'Typical wrong answers',
    },
    de: {
      title: 'Bewegungsdiagramme', mode: 'Modus', difficulty: 'Schwierigkeit', example: 'Beispiel',
      tutor: 'Tutor', practice: 'Üben', arcade: 'Arcade', new: 'Neue Aufgabe',
      tutorNote: 'Mit den Pfeiltasten ← → blätterst du weiter. Das Stück, um das es in einem Schritt geht, ist in beiden Graphen <span class="k-band">hervorgehoben</span>; gestrichelte Linien sind Sekanten (Mittelwerte), kurze Linien Tangenten, und schattierte Flächen zählen über der Zeitachse <span class="k-pos">positiv</span> und darunter <span class="k-neg">negativ</span>.',
      given: 'Gegeben', yours: 'Dein Graph', answer: 'Lösung',
      check: 'Prüfen', reset: 'Zeichnung zurücksetzen', reveal: 'Lösung zeigen', hints: 'Tipps', solution: 'Lösung',
      revealNote: 'Die Lösung wird freigeschaltet, sobald du die Aufgabe gelöst, alle Tipps genutzt oder drei Versuche gemacht hast.',
      levels: { easy: 'Einfach', medium: 'Mittel', hard: 'Schwierig', mixed: 'Gemischt' },
      stars: (d) => `Schwierigkeit: ${d} von 5`,
      score: (s, c) => `Gelöst: ${s} · beim ersten Versuch ohne Tipps: ${c}`,
      hint: (n) => `Tipp (${n} übrig)`, noHints: 'Keine Tipps mehr', unlocks: (n) => `Wird nach allen Tipps oder ${n} Versuchen freigeschaltet`,
      ok: 'Alle fünf Stücke sind richtig, gut gemacht!',
      some: (r, n, k) => `${r} von ${n} Stücken sind richtig (Versuch ${k}).`,
      canReveal: ' Du kannst einen Tipp nehmen oder die Lösung anschauen.', tryAgain: ' Korrigiere die mit ✗ markierten Stücke und prüfe nochmals, oder nimm einen Tipp.',
      shown: 'Der richtige Graph ist jetzt schwarz gestrichelt eingezeichnet.',
      choose: 'Beantworte jede Frage und prüfe dann nochmals.',
      qOk: 'Alle Antworten sind richtig, gut gemacht!',
      qSome: (r, n, k) => `${r} von ${n} Antworten sind richtig (Versuch ${k}).`,
      qTry: ' Korrigiere die mit ✗ markierten Antworten und prüfe nochmals, oder nimm einen Tipp.',
      qShown: 'Die ausführliche Lösung steht unten.',
      answers: 'Antworten', wrongs: 'Typische falsche Antworten',
    },
  };
  const ui = () => UI[Lang.get()];

  let ex = null, editor = null, tutor = null, arcade = null;
  // tries, hints used, solved, revealed, res: the result of the last check (null after an edit)
  let st = null;

  // ---------------------------------------------------------------- persistence
  function stored(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; }
  }
  function store(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
  }
  function showScore() {
    const s = stored('mg-score', { solved: 0, clean: 0 });
    $('#score').textContent = s.solved ? ui().score(s.solved, s.clean) : '';
  }

  // ---------------------------------------------------------------- names and formatting
  const NAME = () => L({ s: 'position', v: 'velocity', a: 'acceleration' }, { s: 'Ort', v: 'Geschwindigkeit', a: 'Beschleunigung' });
  // “its position”, in German in the accusative
  const its = (q) => L(`its ${NAME()[q]}`, { s: 'seinen Ort', v: 'seine Geschwindigkeit', a: 'seine Beschleunigung' }[q]);
  // “the velocity–time graph”, German “den Graphen der Geschwindigkeit” (accusative)
  const graphOf = (q) => L(`the matching ${NAME()[q]}–time graph`, `den passenden Graphen ${{ s: 'des Orts', v: 'der Geschwindigkeit', a: 'der Beschleunigung' }[q]}`);
  // the mean velocity (or acceleration), with the article; c: the German case (nom, acc, dat)
  const M = (c = 'nom') => L(`the mean ${NAME()[ex.to]}`, `${c === 'dat' ? 'der mittleren' : 'die mittlere'} ${NAME()[ex.to]}`);
  const MB = () => L(`Mean ${NAME()[ex.to]}`, `Mittlere ${NAME()[ex.to]}`);
  const Q = (q) => `<i>${q}</i>`;
  const r2 = (x) => Math.round(x * 100) / 100 + 0;
  const fmt = (x) => (r2(x) < 0 ? '−' + dec(-r2(x)) : dec(r2(x)));
  const sgn = (x) => (r2(x) > 0 ? '+' + dec(r2(x)) : fmt(x));
  const val = (x, q) => `${fmt(x)} ${UNIT[q]}`;
  const sval = (x, q) => `${sgn(x)} ${UNIT[q]}`;
  const plus = (a, b) => `${fmt(a)} ${b < 0 ? '−' : '+'} ${fmt(Math.abs(b))}`;
  const at = (q, t) => `${Q(q)}(${t ? fmt(t) + ' s' : 0})`;
  const when = (p) => `${p.t0}–${p.t1} s`;
  const and = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} ${L('and', 'und')} ${xs[xs.length - 1]}`);
  // “Pieces 1 and 3”; c: 'nom' (start of a sentence) or 'in' (after “in”)
  const pieceList = (is, c = 'nom') => {
    const many = is.length > 1, ns = and(is.map((i) => i + 1));
    if (c === 'in') return L(`${many ? 'pieces' : 'piece'} ${ns}`, `${many ? 'den Stücken' : 'Stück'} ${ns}`);
    return L(`${many ? 'Pieces' : 'Piece'} ${ns}`, `${many ? 'Die Stücke' : 'Stück'} ${ns}`);
  };
  const piece = (i) => L(`Piece ${i}`, `Stück ${i}`);
  const times = (ts) => and(ts.map((t) => `${fmt(t)} s`));
  const indices = (test) => ex.pieces.map((p, i) => i).filter((i) => test(ex.pieces[i], i));
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  // Where g is zero inside a sloped piece or at one of its ends (G has a horizontal tangent).
  function zeros() {
    const out = [];
    for (const p of ex.pieces) {
      if (!sloped(p)) continue;
      const x = -p.g0 / rate(p);
      if (x >= 0 && x <= len(p) && !out.includes(p.t0 + x)) out.push(p.t0 + x);
    }
    return out.sort((a, b) => a - b);
  }

  // The text helpers read the exercise from ex; withEx(e, f) runs f for another exercise.
  function withEx(e, f) {
    const saved = ex;
    ex = e;
    try { return f(); } finally { ex = saved; }
  }

  // ---------------------------------------------------------------- derivative: s → v, v → a
  // F is the given graph (G), f the one to draw (g). Parabolas are solved with the mean velocity
  // (or mean acceleration) f̄ = ΔF/Δt: f changes linearly, so f̄ is the mean of f at the start and
  // at the end, and f passes through f̄ in the middle of the piece.
  const BAR = { v: '<i class="bar">v</i>', a: '<i class="bar">a</i>' };
  const mean = (p) => (p.G1 - p.G0) / len(p);
  const paren = (x) => (r2(x) < 0 ? `(${fmt(x)})` : fmt(x));

  // Why f is known at one end of piece i; `withValue` also names the value (in the solution).
  function whyEnd(p, i, end, withValue) {
    const F = Q(ex.from), f = Q(ex.to), t = end === 'start' ? p.t0 : p.t1;
    const why = ex.how[i][end], k = end === 'start' ? i : i + 2;
    if (why === 'vertex') return L(`${F} has a horizontal tangent at ${fmt(t)} s, so ${at(ex.to, t)} = 0.`, `${F} hat bei ${fmt(t)} s eine waagrechte Tangente, also ${at(ex.to, t)} = 0.`);
    if (why === 'join' && withValue) {
      const v = sval(end === 'start' ? p.g0 : p.g1, ex.to);
      return L(`${F} joins piece ${k} smoothly at ${fmt(t)} s (no kink), so ${at(ex.to, t)} = ${v}, the same as in piece ${k}.`,
        `${F} geht bei ${fmt(t)} s glatt (ohne Knick) in Stück ${k} über, also ${at(ex.to, t)} = ${v}, gleich wie in Stück ${k}.`);
    }
    if (why === 'join') {
      return L(`${F} joins piece ${k} smoothly at ${fmt(t)} s (no kink), so ${f} has the same value on both sides.`,
        `${F} geht bei ${fmt(t)} s glatt (ohne Knick) in Stück ${k} über, also hat ${f} auf beiden Seiten denselben Wert.`);
    }
    return L(`${at(ex.to, t)} follows from ${M()} ${BAR[ex.to]} = (${at(ex.to, p.t0)} + ${at(ex.to, p.t1)})/2.`,
      `${at(ex.to, t)} folgt aus ${M('dat')} ${BAR[ex.to]} = (${at(ex.to, p.t0)} + ${at(ex.to, p.t1)})/2.`);
  }

  function hintsDiff() {
    const F = Q(ex.from), f = Q(ex.to), fb = BAR[ex.to], ps = ex.pieces;
    const straight = indices((p) => !sloped(p)), curved = indices(sloped);
    const many = (is) => is.length > 1;
    const h1 = L(`${F}(<i>t</i>) has five pieces. ${pieceList(straight)} ${many(straight) ? 'are' : 'is'} straight, so ${f} is constant there. ` +
      `${pieceList(curved)} ${many(curved) ? 'are parabolas' : 'is a parabola'}: there the slope of ${F} changes steadily, so ${f} is a sloped straight line. ` +
      `At every breakpoint, ${F} joins smoothly (no kink), so ${f} does not jump: the ${f} graph is one connected line.`,
    `${F}(<i>t</i>) hat fünf Stücke. ${pieceList(straight)} ${many(straight) ? 'sind' : 'ist'} gerade, also ist ${f} dort konstant. ` +
      `${pieceList(curved)} ${many(curved) ? 'sind Parabeln' : 'ist eine Parabel'}: Dort ändert sich die Steigung von ${F} gleichmässig, also ist ${f} eine schräge Gerade. ` +
      `An jeder Übergangsstelle geht ${F} glatt (ohne Knick) weiter, also springt ${f} nicht: Der ${f}-Graph ist eine zusammenhängende Linie.`);
    const plan = curved.map((i) => {
      const p = ps[i], h = ex.how[i];
      const first = h.start === 'mean' ? 'end' : 'start', second = first === 'start' ? 'end' : 'start';
      return `<li>${piece(i + 1)}: ${whyEnd(p, i, first)} ${h[second] === 'mean' ? `${L('Then', 'Dann:')} ${whyEnd(p, i, second)}` : whyEnd(p, i, second)}</li>`;
    });
    const h2 = L(`${f} is the slope of the ${F}(<i>t</i>) graph. In every piece, ${M()} is ${fb} = Δ${F}/Δ<i>t</i>. In a straight piece, ${f} = ${fb}. ` +
      `In a parabola, ${f} changes linearly, so ${fb} is the mean of ${f} at the start and at the end (and ${f} = ${fb} in the middle of the piece). ` +
      `Read ${f} at the end where you can (a horizontal tangent, or the smooth join to a piece you know), then get the other end from ${fb}:`,
    `${f} ist die Steigung des ${F}(<i>t</i>)-Graphen. In jedem Stück ist ${M()} ${fb} = Δ${F}/Δ<i>t</i>. In einem geraden Stück ist ${f} = ${fb}. ` +
      `In einer Parabel ändert sich ${f} linear, also ist ${fb} der Mittelwert von ${f} am Anfang und am Ende (und in der Mitte des Stücks ist ${f} = ${fb}). ` +
      `Lies ${f} an dem Ende ab, wo das geht (eine waagrechte Tangente oder der glatte Übergang zu einem bekannten Stück), und bestimme dann das andere Ende aus ${fb}:`) +
      `<ul>${plan.join('')}</ul>`;
    const formulas = ps.map((p, i) => {
      const dF = `(${at(ex.from, p.t1)} − ${at(ex.from, p.t0)}) / ${len(p)} s`;
      if (!sloped(p)) return `<li>${piece(i + 1)}: ${f} = ${fb} = ${dF}</li>`;
      const known = ex.how[i].start === 'mean' ? 'end' : 'start', other = known === 'start' ? p.t1 : p.t0;
      return `<li>${piece(i + 1)}: ${fb} = ${dF}, ${L('then', 'dann')} ${at(ex.to, other)} = 2 · ${fb} − ${at(ex.to, known === 'start' ? p.t0 : p.t1)}</li>`;
    });
    const h3 = `${L('Formulas, piece by piece:', 'Formeln, Stück für Stück:')}<ul>${formulas.join('')}</ul>`;
    const avgs = ps.map((p, i) => `${L('piece', 'Stück')} ${i + 1}: ${sval(mean(p), ex.to)}`);
    const h4 = L(`${MB()} ${fb} per piece: ${and(avgs)}. In a straight piece, this is ${f}; in a parabola, it is ${f} in the middle of the piece, halfway between the start and end values.`,
      `${MB()} ${fb} pro Stück: ${and(avgs)}. In einem geraden Stück ist das ${f}; in einer Parabel ist es ${f} in der Mitte des Stücks, halbwegs zwischen Anfangs- und Endwert.`);
    return [h1, h2, h3, h4];
  }

  function describeDiff(p, i) {
    const F = Q(ex.from), f = Q(ex.to), fb = BAR[ex.to], dF = p.G1 - p.G0, T = len(p), m = mean(p);
    const head = `<b>${piece(i + 1)} (${when(p)})</b>: `;
    const meanIs = `${fb} = Δ${F}/Δ<i>t</i> = ${sval(dF, ex.from)} / ${T} s = ${sval(m, ex.to)}`;
    if (!sloped(p)) {
      if (p.g0 === 0) {
        return head + L(`${F} stays at ${val(p.G0, ex.from)}${ex.from === 's' ? ' (the body is at rest)' : ' (the velocity is constant)'}, so ${f} = 0.`,
          `${F} bleibt bei ${val(p.G0, ex.from)}${ex.from === 's' ? ' (der Körper ist in Ruhe)' : ' (die Geschwindigkeit ist konstant)'}, also ${f} = 0.`);
      }
      return head + L(`${F} changes steadily from ${val(p.G0, ex.from)} to ${val(p.G1, ex.from)}, so ${f} is constant and equal to ${M()}: ${f} = ${meanIs}.`,
        `${F} ändert sich gleichmässig von ${val(p.G0, ex.from)} auf ${val(p.G1, ex.from)}, also ist ${f} konstant und gleich ${M('dat')}: ${f} = ${meanIs}.`);
    }
    const tm = (p.t0 + p.t1) / 2, up = p.g1 > p.g0;
    const out = head + L(`${F} is a parabola (it curves ${up ? 'upward' : 'downward'}), so ${f} changes linearly. ${cap(M())} is ${meanIs}. ` +
      `Because ${f} changes linearly, ${fb} is the mean of the start and end values, ${fb} = (${at(ex.to, p.t0)} + ${at(ex.to, p.t1)})/2, and ${f} = ${fb} in the middle of the piece, at ${fmt(tm)} s. `,
    `${F} ist eine Parabel (sie krümmt sich nach ${up ? 'oben' : 'unten'}), also ändert sich ${f} linear. ${cap(M())} ist ${meanIs}. ` +
      `Weil sich ${f} linear ändert, ist ${fb} der Mittelwert von Anfangs- und Endwert, ${fb} = (${at(ex.to, p.t0)} + ${at(ex.to, p.t1)})/2, und in der Mitte des Stücks, bei ${fmt(tm)} s, ist ${f} = ${fb}. `);
    const h = ex.how[i];
    if (h.start !== 'mean' && h.end !== 'mean') {
      return out + `${whyEnd(p, i, 'start', true)} ${whyEnd(p, i, 'end', true)} ${L('Check', 'Kontrolle')}: (${plus(p.g0, p.g1)})/2 ${UNIT[ex.to]} = ${sval(m, ex.to)} = ${fb}.`;
    }
    const known = h.start === 'mean' ? 'end' : 'start';
    const [tk, vk, to, vo] = known === 'start' ? [p.t0, p.g0, p.t1, p.g1] : [p.t1, p.g1, p.t0, p.g0];
    return out + `${whyEnd(p, i, known, true)} ${L('So', 'Also')} ${at(ex.to, to)} = 2 · ${fb} − ${at(ex.to, tk)} = 2 · ${paren(m)} − ${paren(vk)} = ${sval(vo, ex.to)}.`;
  }

  function whyDiff(code, p, i) {
    const F = Q(ex.from), f = Q(ex.to), fb = BAR[ex.to];
    switch (code) {
      case 'sign': return L(`Check the sign: where ${F} increases, ${f} is positive; where it decreases, ${f} is negative.`,
        `Achte auf das Vorzeichen: Wo ${F} zunimmt, ist ${f} positiv; wo ${F} abnimmt, ist ${f} negativ.`);
      case 'notConst': return L(`${F} is a straight line here, so its slope does not change: ${f} is constant (a horizontal line).`,
        `${F} ist hier eine Gerade, also ändert sich die Steigung nicht: ${f} ist konstant (eine waagrechte Linie).`);
      case 'value': return p.g0 === 0
        ? L(`${F} is horizontal here${ex.from === 's' ? ' (the body is at rest)' : ''}, so ${f} = 0.`, `${F} ist hier waagrecht${ex.from === 's' ? ' (der Körper ist in Ruhe)' : ''}, also ${f} = 0.`)
        : L(`${f} is constant here, but check its value: ${f} equals ${M()} ${fb} = Δ${F}/Δ<i>t</i>. Read the change of ${F} and the duration of the piece from the graph.`,
          `${f} ist hier konstant, aber prüfe den Wert: ${f} ist gleich ${M('dat')} ${fb} = Δ${F}/Δ<i>t</i>. Lies die Änderung von ${F} und die Dauer des Stücks am Graphen ab.`);
      case 'average': return L(`You drew ${M()} ${fb} = Δ${F}/Δ<i>t</i> for the whole piece. But ${F} is curved here, so ${f} changes steadily: it equals ${fb} only in the middle of the piece and is a sloped straight line through that point.`,
        `Du hast ${M('acc')} ${fb} = Δ${F}/Δ<i>t</i> für das ganze Stück gezeichnet. Aber ${F} ist hier gekrümmt, also ändert sich ${f} gleichmässig: Es ist nur in der Mitte des Stücks gleich ${fb} und ist eine schräge Gerade durch diesen Punkt.`);
      case 'notLinear': return L(`${F} is curved here, so its slope changes: ${f} is not constant, but a sloped straight line.`,
        `${F} ist hier gekrümmt, also ändert sich die Steigung: ${f} ist nicht konstant, sondern eine schräge Gerade.`);
      case 'direction': return p.g1 > p.g0
        ? L(`${F} curves upward here (its slope increases), so ${f} must increase.`, `${F} krümmt sich hier nach oben (die Steigung nimmt zu), also muss ${f} zunehmen.`)
        : L(`${F} curves downward here (its slope decreases), so ${f} must decrease.`, `${F} krümmt sich hier nach unten (die Steigung nimmt ab), also muss ${f} abnehmen.`);
      case 'start': case 'end': return `${L(`The value at the ${code} of the piece is off.`, `Der Wert am ${code === 'start' ? 'Anfang' : 'Ende'} des Stücks stimmt nicht.`)} ${whyEnd(p, i, code)}`;
      default: return `${L(`Both end values are off: ${f} is the slope of the tangent to ${F} at the start and at the end of the piece, and their mean is ${M()} ${fb} = Δ${F}/Δ<i>t</i>.`,
        `Beide Endwerte stimmen nicht: ${f} ist die Steigung der Tangente an ${F} am Anfang und am Ende des Stücks, und ihr Mittelwert ist ${M()} ${fb} = Δ${F}/Δ<i>t</i>.`)} ${whyEnd(p, i, ex.how[i].start === 'mean' ? 'end' : 'start')}`;
    }
  }

  // ---------------------------------------------------------------- integral: v → s, a → v
  // g is the given graph, G the one to draw.
  function hintsInt() {
    const g = Q(ex.from), G = Q(ex.to), ps = ex.pieces;
    const constant = indices((p) => !sloped(p)), changing = indices(sloped);
    const zs = zeros(), rest = indices((p) => !sloped(p) && p.g0 === 0);
    const h1 = L(`${g}(<i>t</i>) has five straight pieces. In ${pieceList(constant, 'in')}, ${g} is constant, so ${G} is a straight line there. ` +
      `In ${pieceList(changing, 'in')}, ${g} changes steadily, so ${G} is a parabola there. ${g} does not jump, so ${G} joins smoothly (without a kink) at every breakpoint.` +
      (zs.length ? ` ${g} = 0 at ${times(zs)}: ${G} has a horizontal tangent there.` : '') +
      (rest.length ? ` In ${pieceList(rest, 'in')}, ${g} = 0, so ${G} stays constant.` : ''),
    `${g}(<i>t</i>) hat fünf gerade Stücke. In ${pieceList(constant, 'in')} ist ${g} konstant, also ist ${G} dort eine Gerade. ` +
      `In ${pieceList(changing, 'in')} ändert sich ${g} gleichmässig, also ist ${G} dort eine Parabel. ${g} springt nicht, also geht ${G} an jeder Übergangsstelle glatt (ohne Knick) weiter.` +
      (zs.length ? ` Bei ${times(zs)} ist ${g} = 0: Dort hat ${G} eine waagrechte Tangente.` : '') +
      (rest.length ? ` In ${pieceList(rest, 'in')} ist ${g} = 0, also bleibt ${G} konstant.` : ''));
    const h2 = L(`Start at ${at(ex.to, 0)} = ${val(ex.pieces[0].G0, ex.to)}. In every piece, the change Δ${G} is the area between the ${g} graph and the <i>t</i> axis (area below the axis counts negative). ` +
      `Mark ${G} at the breakpoints piece by piece, then draw the shape: straight where ${g} is constant; where ${g} increases, ${G} curves upward, and where ${g} decreases, ${G} curves downward. ` +
      `At every instant, the slope of ${G} is ${g}.`,
    `Beginne bei ${at(ex.to, 0)} = ${val(ex.pieces[0].G0, ex.to)}. In jedem Stück ist die Änderung Δ${G} die Fläche zwischen dem ${g}-Graphen und der <i>t</i>-Achse (Fläche unter der Achse zählt negativ). ` +
      `Markiere ${G} an den Übergangsstellen Stück für Stück und zeichne dann die Form: gerade, wo ${g} konstant ist; wo ${g} zunimmt, krümmt sich ${G} nach oben, und wo ${g} abnimmt, nach unten. ` +
      `In jedem Moment ist die Steigung von ${G} gleich ${g}.`);
    const formulas = ps.map((p, i) => {
      if (!sloped(p)) return `<li>${piece(i + 1)} (${L('rectangle', 'Rechteck')}): Δ${G} = ${g} · Δ<i>t</i> = ${at(ex.from, p.t0)} · ${len(p)} s</li>`;
      const cross = p.g0 * p.g1 < 0 ? L('; the triangles above and below the axis partly cancel', '; die Dreiecke über und unter der Achse heben sich teilweise auf') : '';
      return `<li>${piece(i + 1)} (${L('trapezoid', 'Trapez')}): Δ${G} = (${at(ex.from, p.t0)} + ${at(ex.from, p.t1)})/2 · ${len(p)} s${cross}</li>`;
    });
    const h3 = `${L('Formulas, piece by piece:', 'Formeln, Stück für Stück:')}<ul>${formulas.join('')}</ul>`;
    const h4 = `Δ${G} ${L('per piece', 'pro Stück')}: ${and(ps.map((p, i) => `${L('piece', 'Stück')} ${i + 1}: ${sval(area(p), ex.to)}`))}.`;
    return [h1, h2, h3, h4];
  }

  function describeInt(p, i) {
    const g = Q(ex.from), G = Q(ex.to), T = len(p), dG = area(p);
    const head = `<b>${piece(i + 1)} (${when(p)})</b>: `;
    const span = L(`from ${val(p.G0, ex.to)} to ${val(p.G1, ex.to)}`, `von ${val(p.G0, ex.to)} auf ${val(p.G1, ex.to)}`);
    if (!sloped(p)) {
      if (p.g0 === 0) return head + L(`${g} = 0, so ${G} stays at ${val(p.G0, ex.to)}.`, `${g} = 0, also bleibt ${G} bei ${val(p.G0, ex.to)}.`);
      return head + L(`${g} = ${sval(p.g0, ex.from)} is constant, so ${G} is a straight line: Δ${G} = ${sval(p.g0, ex.from)} · ${T} s = ${sval(dG, ex.to)}, ${span}.`,
        `${g} = ${sval(p.g0, ex.from)} ist konstant, also ist ${G} eine Gerade: Δ${G} = ${sval(p.g0, ex.from)} · ${T} s = ${sval(dG, ex.to)}, ${span}.`);
    }
    const x = -p.g0 / rate(p), up = p.g1 > p.g0;
    const turn = x > 0 && x < T ? L(` ${g} = 0 at ${fmt(p.t0 + x)} s, where ${G} has a horizontal tangent.`, ` Bei ${fmt(p.t0 + x)} s ist ${g} = 0; dort hat ${G} eine waagrechte Tangente.`) : '';
    return head + L(`${g} changes from ${sval(p.g0, ex.from)} to ${sval(p.g1, ex.from)}, so ${G} is a parabola that curves ${up ? 'upward' : 'downward'}. `,
      `${g} ändert sich von ${sval(p.g0, ex.from)} auf ${sval(p.g1, ex.from)}, also ist ${G} eine Parabel, die sich nach ${up ? 'oben' : 'unten'} krümmt. `) +
      `Δ${G} = (${plus(p.g0, p.g1)})/2 ${UNIT[ex.from]} · ${T} s = ${sval(dG, ex.to)}, ${span}.${turn}`;
  }

  function whyInt(code, p) {
    const g = Q(ex.from), G = Q(ex.to), dG = area(p), pos = dG > 0;
    switch (code) {
      case 'sign': return p.g0 * p.g1 < 0
        ? L(`${G} changes the wrong way. The area ${pos ? 'above' : 'below'} the <i>t</i> axis is larger than the one ${pos ? 'below' : 'above'}, so ${G} ${pos ? 'increases' : 'decreases'} overall.`,
          `${G} ändert sich in die falsche Richtung. Die Fläche ${pos ? 'über' : 'unter'} der <i>t</i>-Achse ist grösser als jene ${pos ? 'darunter' : 'darüber'}, also nimmt ${G} insgesamt ${pos ? 'zu' : 'ab'}.`)
        : L(`${G} changes the wrong way: ${g} is ${pos ? 'positive' : 'negative'} here, so ${G} ${pos ? 'increases' : 'decreases'}.`,
          `${G} ändert sich in die falsche Richtung: ${g} ist hier ${pos ? 'positiv' : 'negativ'}, also nimmt ${G} ${pos ? 'zu' : 'ab'}.`);
      case 'rectStart': case 'rectEnd': {
        const t = code === 'rectStart' ? p.t0 : p.t1;
        return L(`Your change of ${G} is ${at(ex.from, t)} · Δ<i>t</i>. But ${g} changes in this piece: Δ${G} is the area of the trapezoid under the ${g} graph, (${at(ex.from, p.t0)} + ${at(ex.from, p.t1)})/2 · Δ<i>t</i>.`,
          `Deine Änderung von ${G} ist ${at(ex.from, t)} · Δ<i>t</i>. Aber ${g} ändert sich in diesem Stück: Δ${G} ist die Fläche des Trapezes unter dem ${g}-Graphen, (${at(ex.from, p.t0)} + ${at(ex.from, p.t1)})/2 · Δ<i>t</i>.`);
      }
      case 'unsigned': return L(`${g} changes sign in this piece: the area below the <i>t</i> axis counts negative.`, `${g} wechselt in diesem Stück das Vorzeichen: Die Fläche unter der <i>t</i>-Achse zählt negativ.`);
      case 'area': return L(`Check the change of ${G}: Δ${G} is the area between the ${g} graph and the <i>t</i> axis from ${p.t0} s to ${p.t1} s.`,
        `Prüfe die Änderung von ${G}: Δ${G} ist die Fläche zwischen dem ${g}-Graphen und der <i>t</i>-Achse von ${p.t0} s bis ${p.t1} s.`);
      case 'straight': return L(`${g} is constant here, so ${G} is a straight line: drag the diamond back onto the line between the ends.`,
        `${g} ist hier konstant, also ist ${G} eine Gerade: Zieh die Raute zurück auf die Linie zwischen den Enden.`);
      case 'curve': return L(`${g} changes here, so ${G} is curved (a parabola): drag the diamond to bend the piece.`,
        `${g} ändert sich hier, also ist ${G} gekrümmt (eine Parabel): Zieh an der Raute, um das Stück zu biegen.`);
      case 'bendDir': return p.g1 > p.g0
        ? L(`${g} increases here, so the slope of ${G} increases: ${G} curves upward (the middle lies below the straight line between the ends).`,
          `${g} nimmt hier zu, also nimmt die Steigung von ${G} zu: ${G} krümmt sich nach oben (die Mitte liegt unter der Geraden zwischen den Enden).`)
        : L(`${g} decreases here, so the slope of ${G} decreases: ${G} curves downward (the middle lies above the straight line between the ends).`,
          `${g} nimmt hier ab, also nimmt die Steigung von ${G} ab: ${G} krümmt sich nach unten (die Mitte liegt über der Geraden zwischen den Enden).`);
      default: return L(`${G} bends the right way, but too ${code === 'bendMore' ? 'little' : 'much'}. At the start and at the end of the piece, the slope of ${G} must equal ${g} there.`,
        `${G} krümmt sich in die richtige Richtung, aber zu ${code === 'bendMore' ? 'wenig' : 'stark'}. Am Anfang und am Ende des Stücks muss die Steigung von ${G} gleich dem dortigen Wert von ${g} sein.`);
    }
  }

  // The drawing (or an arcade option) has the shape of the given graph.
  function copiedText(start) {
    const F = Q(ex.from), f = Q(ex.to);
    return start + ' ' + (ex.dir === 'diff'
      ? L(`But ${f} is the <em>slope</em> of ${F}, not its value: where ${F} is large but constant, ${f} = 0.`,
        `Aber ${f} ist die <em>Steigung</em> von ${F}, nicht sein Wert: Wo ${F} gross, aber konstant ist, ist ${f} = 0.`)
      : L(`But ${F} is the <em>slope</em> of ${f}: where ${F} is constant, ${f} changes steadily.`,
        `Aber ${F} ist die <em>Steigung</em> von ${f}: Wo ${F} konstant ist, ändert sich ${f} gleichmässig.`));
  }

  // ---------------------------------------------------------------- exercise text
  const taskTitle = (e) => `${LABEL[e.task]}: ${e.dir === 'diff' ? L('from a graph to its slope', 'vom Graphen zu seiner Steigung') : L('from a graph to the area under it', 'vom Graphen zur Fläche darunter')}`;
  function statement() {
    const { from, to } = ex;
    if (ex.dir === 'diff') {
      return L(`A body moves along a straight line. The graph shows ${its(from)} ${Q(from)}(<i>t</i>), made of straight and parabolic pieces. Draw ${graphOf(to)} ${Q(to)}(<i>t</i>).`,
        `Ein Körper bewegt sich auf einer Geraden. Der Graph zeigt ${its(from)} ${Q(from)}(<i>t</i>), zusammengesetzt aus geraden und parabelförmigen Stücken. Zeichne ${graphOf(to)} ${Q(to)}(<i>t</i>).`);
    }
    return L(`A body moves along a straight line. The graph shows ${its(from)} ${Q(from)}(<i>t</i>), made of straight pieces. At <i>t</i> = 0, ${at(to, 0)} = ${val(ex.pieces[0].G0, to)}. Draw ${graphOf(to)} ${Q(to)}(<i>t</i>).`,
      `Ein Körper bewegt sich auf einer Geraden. Der Graph zeigt ${its(from)} ${Q(from)}(<i>t</i>), zusammengesetzt aus geraden Stücken. Bei <i>t</i> = 0 ist ${at(to, 0)} = ${val(ex.pieces[0].G0, to)}. Zeichne ${graphOf(to)} ${Q(to)}(<i>t</i>).`);
  }
  function howTo() {
    const q = Q(ex.to);
    const keys = L(' Keyboard: Tab to the graph, ←/→ choose a point, ↑/↓ move it.', ' Tastatur: Mit Tab zum Graphen, ←/→ wählt einen Punkt, ↑/↓ verschiebt ihn.');
    if (ex.dir === 'diff') {
      return L(`Drag the dots at the breakpoints to set ${q} there, or drag the line of a piece to move both of its ends.`,
        `Zieh die Punkte an den Übergangsstellen, um ${q} dort festzulegen, oder zieh die Linie eines Stücks, um beide Enden zu verschieben.`) + keys;
    }
    return L(`Drag the dots at the breakpoints to set ${q} there (${at(ex.to, 0)} is given), and the diamond in the middle of a piece to bend it into a parabola. Each piece is judged by how much ${q} changes in it, so a mistake only counts once.`,
      `Zieh die Punkte an den Übergangsstellen, um ${q} dort festzulegen (${at(ex.to, 0)} ist gegeben), und die Raute in der Mitte eines Stücks, um es zu einer Parabel zu biegen. Jedes Stück wird danach beurteilt, wie stark sich ${q} darin ändert, also zählt ein Fehler nur einmal.`) + keys;
  }

  const ruleText = () => {
    const F = Q(ex.from), f = Q(ex.to);
    return ex.dir === 'diff'
      ? L(`${f} is the slope of the ${F}(<i>t</i>) graph: constant where ${F} is straight, a sloped straight line where ${F} is a parabola. ${F} has no kinks, so ${f} does not jump.`,
        `${f} ist die Steigung des ${F}(<i>t</i>)-Graphen: konstant, wo ${F} gerade ist, eine schräge Gerade, wo ${F} eine Parabel ist. ${F} hat keine Knicke, also springt ${f} nicht.`)
      : L(`The change of ${f} is the area under the ${F}(<i>t</i>) graph, and the slope of ${f} is ${F}: a straight line where ${F} is constant, a parabola where it changes linearly. ${F} does not jump, so ${f} has no kinks.`,
        `Die Änderung von ${f} ist die Fläche unter dem ${F}(<i>t</i>)-Graphen, und die Steigung von ${f} ist ${F}: eine Gerade, wo ${F} konstant ist, eine Parabel, wo sich ${F} linear ändert. ${F} springt nicht, also hat ${f} keine Knicke.`);
  };

  const describe = (p, i) => (ex.dir === 'diff' ? describeDiff : describeInt)(p, i);
  // the worked steps of a quiz exercise, then the answers
  const stepsHtml = (e) => e.steps.map((x) => `<p class="step-rule">${x.title}</p><div class="figs">${x.figure.startsWith('<div') ? x.figure : `<figure class="fig">${x.figure}</figure>`}</div><p>${x.text}</p>`).join('') +
    `<ul class="short">${e.questions.map((q, k) => `<li><span class="qn">${k + 1}</span>${e.answers[k]}</li>`).join('')}</ul>`;
  function solution() {
    if (isQuiz()) return `<div class="steps">${stepsHtml(ex)}</div>`;
    const rows = ex.pieces.map((p, i) => `<li>${describe(p, i)}</li>`);
    return `<p>${ruleText()} ${L('The correct graph is drawn as a dashed black line.', 'Der richtige Graph ist schwarz gestrichelt eingezeichnet.')}</p><ul class="pieces">${rows.join('')}</ul>`;
  }

  // ---------------------------------------------------------------- rendering
  const starsOf = (d) => `<span class="stars" role="img" aria-label="${ui().stars(d)}" title="${ui().stars(d)}">${'★'.repeat(d)}${'☆'.repeat(5 - d)}</span>`;
  const qc = (q) => `<span class="qc-${q}">${NAME()[q]} ${Q(q)}(<i>t</i>)</span>`;

  // The exercise as it stands (st): texts, graphs, the drawing (saved: the editor's drawing to keep).
  // The exercises of concepts.js (ex.kind) are answered by choosing and entering numbers (quiz.js),
  // the others by drawing.
  const isQuiz = () => !!(ex && ex.kind);

  function render(saved) {
    $('#drawing').hidden = isQuiz();
    $('#quiz').hidden = !isQuiz();
    $('#reset').hidden = isQuiz();
    if (isQuiz()) { renderQuiz(saved); return; }
    $('#title').innerHTML = `${taskTitle(ex)} ${starsOf(ex.difficulty)}`;
    $('#statement').innerHTML = statement();
    $('#howto').innerHTML = howTo();
    $('#given-title').innerHTML = `${ui().given}: ${qc(ex.from)}`;
    $('#draw-title').innerHTML = `${ui().yours}: ${qc(ex.to)}`;
    Plot.setNarrow(narrow());
    $('#given').innerHTML = sourceGraph(ex);

    const old = $('#draw');
    const el = old.cloneNode(false); // drop the listeners of the previous editor
    old.replaceWith(el);
    el.setAttribute('viewBox', `0 0 ${Plot.W} ${Plot.H}`);
    el.setAttribute('aria-label', L(`Graph of ${NAME()[ex.to]} against time to draw. ${ex.dir === 'diff' ? 'Handles at the breakpoints.' : 'Handles at the breakpoints and in the middle of each piece.'} Use the arrow keys.`,
      `Zu zeichnender Graph ${{ s: 'des Orts', v: 'der Geschwindigkeit', a: 'der Beschleunigung' }[ex.to]} gegen die Zeit. ${ex.dir === 'diff' ? 'Griffe an den Übergangsstellen.' : 'Griffe an den Übergangsstellen und in der Mitte jedes Stücks.'} Mit den Pfeiltasten bedienbar.`));
    editor = window.createEditor(el, ex, onEdit);
    if (saved) editor.restore(saved);
    showDrawing();
    showHints();
    showFeedback();
    $('#solution').hidden = !st.revealed;
    $('#sol-text').innerHTML = st.revealed ? solution() : '';
    updateButtons();
  }

  // saved: the answers to keep, by question key
  function renderQuiz(saved) {
    $('#title').innerHTML = `${ex.title} ${starsOf(ex.difficulty)}`;
    $('#statement').innerHTML = ex.text;
    $('#q-figure').innerHTML = ex.figure.startsWith('<div') ? ex.figure : `<figure class="fig">${ex.figure}</figure>`;
    $('#q-fields').innerHTML = ex.questions.map((q, k) => Quiz.html(q, k)).join('');
    if (saved) ex.questions.forEach((q) => { if (q.key in saved) Quiz.setState(q, saved[q.key]); });
    showHints();
    showFeedback();
    $('#solution').hidden = !st.revealed;
    $('#sol-text').innerHTML = st.revealed ? solution() : '';
    updateButtons();
  }
  const quizAnswers = () => Object.fromEntries(ex.questions.map((q) => [q.key, Quiz.state(q)]));

  // Marks, solution and lock of the drawing.
  function showDrawing() {
    const marks = st.res ? st.res.map((r) => (r.ok ? 'ok' : 'bad')) : null;
    if (st.revealed) editor.show({ solution: true, locked: true, marks: evaluate(ex, editor.values()).map((r) => (r.ok ? 'ok' : 'bad')) });
    else editor.show({ marks, locked: st.solved });
  }

  // The result of the last check (kept when the language changes).
  function showFeedback() {
    const status = $('#status');
    status.className = 'status';
    status.textContent = '';
    $('#feedback').innerHTML = '';
    if (isQuiz()) { showQuizFeedback(); return; }
    if (st.revealed && !st.solved) { status.textContent = ui().shown; return; }
    if (!st.res) return;
    const right = st.res.filter((r) => r.ok).length;
    if (right === st.res.length) {
      status.textContent = ui().ok;
      status.className = 'status ok';
      return;
    }
    status.textContent = ui().some(right, st.res.length, st.tries) + (canReveal() ? ui().canReveal : ui().tryAgain);
    status.className = 'status bad';
    const why = ex.dir === 'diff' ? whyDiff : whyInt;
    const items = st.res.map((r, i) => (r.ok ? '' : `<li><b>${piece(i + 1)} (${when(ex.pieces[i])})</b>: ${r.codes.map((c) => why(c, ex.pieces[i], i)).join(' ')}</li>`));
    if (st.copied) items.unshift(`<li>${copiedText(L('Your graph has the same shape as the given one.', 'Dein Graph hat dieselbe Form wie der gegebene.'))}</li>`);
    $('#feedback').innerHTML = items.join('');
  }

  // The marks of the last check, on the questions whose answers have not changed since.
  function showQuizFeedback() {
    const status = $('#status');
    const now = quizAnswers();
    ex.questions.forEach((q) => {
      const then = st.checked && st.checked[q.key];
      const same = st.checked && JSON.stringify(then) === JSON.stringify(now[q.key]);
      Quiz.paint(q, same ? Quiz.evaluate(q, then) : null, now[q.key]);
    });
    if (st.revealed && !st.solved) { status.textContent = ui().qShown; return; }
    if (!st.checked) return;
    const evs = ex.questions.map((q) => Quiz.evaluate(q, st.checked[q.key]));
    if (evs.some((e) => !e.complete)) { status.textContent = ui().choose; return; }
    const right = evs.filter((e) => e.ok).length;
    if (right === evs.length) { status.textContent = ui().qOk; status.className = 'status ok'; return; }
    status.textContent = ui().qSome(right, evs.length, st.tries) + (canReveal() ? ui().canReveal : ui().qTry);
    status.className = 'status bad';
  }

  function onEdit() {
    if (st.revealed) return;
    if (st.res && !st.solved) { st.res = null; st.copied = false; showFeedback(); }
  }

  // Redraw both graphs when the screen gets narrow or wide (the drawing is kept).
  const narrow = () => $('#given').clientWidth < NARROW;
  function relayout() {
    if (!ex || isQuiz() || $('#task').hidden || (Plot.W < 640) === narrow()) return;
    Plot.setNarrow(narrow());
    $('#given').innerHTML = sourceGraph(ex);
    $('#draw').setAttribute('viewBox', `0 0 ${Plot.W} ${Plot.H}`);
    editor.show({});
  }

  // Coordinates of the grid point or crossing under the mouse on the given graph.
  function hoverGiven(evt) {
    const el = $('#given svg');
    if (!ex || isQuiz() || !el) return;
    const old = el.querySelector('.hover');
    if (old) old.remove();
    if (evt.type === 'pointerleave' || evt.pointerType === 'touch') return;
    const pt = Plot.svgPoint(el, evt), axis = ex.axes.source;
    el.firstElementChild.insertAdjacentHTML('beforeend', Plot.hoverMark(axis, ex.from, Plot.hoverPoint(ex, axis, [ex.source], pt.x, pt.y)));
  }

  // ---------------------------------------------------------------- exercise lifecycle
  const newSeed = () => 1 + Math.floor(Math.random() * 999999);
  const level = () => (document.querySelector('input[name="level"]:checked') || {}).value || 'easy';
  const canReveal = () => st.solved || st.hints >= ex.hints.length || st.tries >= MAX_TRIES;
  const hintsOf = () => (isQuiz() ? ex.hints : ex.dir === 'diff' ? hintsDiff() : hintsInt());

  function open(exercise) {
    ex = exercise;
    ex.hints = hintsOf();
    st = { tries: 0, hints: 0, solved: false, revealed: false, res: null, copied: false, checked: null };
    const hash = `#${ex.id}`;
    if (location.hash !== hash) history.replaceState(null, '', hash);
    render();
  }

  function fresh() { open(generate(level(), newSeed())); }

  function updateButtons() {
    const left = ex.hints.length - st.hints;
    const hb = $('#hint');
    hb.disabled = left === 0 || st.revealed;
    hb.textContent = left ? ui().hint(left) : ui().noHints;
    const rb = $('#reveal');
    rb.disabled = !canReveal() || st.revealed;
    rb.title = canReveal() ? '' : ui().unlocks(MAX_TRIES);
    $('#reveal-note').hidden = canReveal() || st.revealed;
    $('#reset').disabled = st.revealed || st.solved;
    // once everything is right, Check becomes New exercise, like the button at the top
    const cb = $('#check');
    cb.textContent = st.solved ? ui().new : ui().check;
    cb.classList.toggle('primary', !st.solved);
    cb.classList.toggle('new-btn', st.solved);
    cb.disabled = st.revealed && !st.solved;
  }

  function check() {
    if (st.solved) { fresh(); return; } // the button reads New exercise
    if (isQuiz()) { checkQuiz(); return; }
    const ans = editor.values();
    st.tries++;
    st.res = evaluate(ex, ans);
    st.copied = copied(ex, ans);
    if (st.res.every((r) => r.ok)) {
      if (!st.revealed) {
        const s = stored('mg-score', { solved: 0, clean: 0 });
        s.solved++;
        if (st.tries === 1 && st.hints === 0) s.clean++;
        store('mg-score', s);
        showScore();
      }
      st.solved = true;
    }
    showDrawing();
    showFeedback();
    updateButtons();
  }

  function checkQuiz() {
    const ans = quizAnswers(), evs = ex.questions.map((q) => Quiz.evaluate(q, ans[q.key]));
    st.checked = ans;
    if (evs.every((e) => e.complete)) {
      st.tries++;
      if (evs.every((e) => e.ok)) {
        if (!st.revealed) {
          const s = stored('mg-score', { solved: 0, clean: 0 });
          s.solved++;
          if (st.tries === 1 && st.hints === 0) s.clean++;
          store('mg-score', s);
          showScore();
        }
        st.solved = true;
      }
    }
    showFeedback();
    updateButtons();
  }

  function showHints() {
    $('#hint-list').innerHTML = ex.hints.slice(0, st.hints).map((h) => `<li>${h}</li>`).join('');
    $('#hints').hidden = !st.hints;
  }
  function hint() {
    if (st.hints >= ex.hints.length) return;
    st.hints++;
    showHints();
    updateButtons();
    $('#hint-list').lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function reveal() {
    if (!canReveal()) return;
    st.revealed = true;
    if (!isQuiz()) showDrawing();
    $('#sol-text').innerHTML = solution();
    $('#solution').hidden = false;
    showFeedback();
    updateButtons();
    $('#solution').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---------------------------------------------------------------- tutor
  // Worked examples, one per task: the given graph and the answer graph piece by piece. The piece
  // is highlighted in both graphs; derivative: the chord of the given graph (its mean slope)
  // and, for a parabola, the tangents at its ends; integral: the area under the given graph.
  const LESSONS = [
    { name: () => L('Faster', 'Schneller'), kind: 'compare', d: 2, seed: 1,
      idea: () => L('The speed is the steepness of the s(t) graph, not its height; a falling graph means motion in the negative direction.',
        'Die Geschwindigkeit ist die Steilheit des s(t)-Graphen, nicht seine Höhe; ein fallender Graph bedeutet Bewegung in negativer Richtung.') },
    { name: () => L('Direction', 'Richtung'), kind: 'direction', d: 2, seed: 1,
      idea: () => L('The sign of v is the direction of motion: negative where s decreases, wherever the graph lies.',
        'Das Vorzeichen von v ist die Bewegungsrichtung: negativ, wo s abnimmt, egal wo der Graph liegt.') },
    { name: () => L('Value table', 'Wertetabelle'), kind: 'table', d: 2, seed: 1,
      idea: () => L('In a value table, the direction shows in the changes from one time to the next, not in the signs of the positions.',
        'In einer Wertetabelle zeigt sich die Richtung in den Änderungen von einem Zeitpunkt zum nächsten, nicht in den Vorzeichen der Orte.') },
    { name: () => L('Stroboscope', 'Stroboskop'), kind: 'strobe', d: 3, seed: 1,
      idea: () => L('With constant acceleration, the distances between neighbouring dots change by the same amount each second; each is the mean velocity in that second, and v(t) is a straight line.',
        'Bei konstanter Beschleunigung ändern sich die Abstände benachbarter Punkte jede Sekunde um gleich viel; jeder ist die mittlere Geschwindigkeit in dieser Sekunde, und v(t) ist eine Gerade.') },
    { name: 's → v', task: 'sv', seed: 17,
      idea: () => L('The velocity is the slope of the position graph: read it piece by piece, from straight lines and from the tangents to the curves.',
        'Die Geschwindigkeit ist die Steigung des Ort-Zeit-Graphen: Lies sie Stück für Stück ab, an Geraden und an den Tangenten der Kurven.') },
    { name: () => L('Area', 'Fläche'), kind: 'area', d: 4, seed: 1,
      idea: () => L('The area under v(t) is the displacement (below the axis negative); counting all areas positive gives the distance travelled.',
        'Die Fläche unter v(t) ist die Verschiebung (unter der Achse negativ); zählt man alle Flächen positiv, erhält man den zurückgelegten Weg.') },
    { name: 'v → s', task: 'vs', seed: 45,
      idea: () => L('The change of position in a piece is the area between the velocity graph and the time axis; below the axis it counts negative.',
        'Die Ortsänderung in einem Stück ist die Fläche zwischen dem Geschwindigkeit-Zeit-Graphen und der Zeitachse; unter der Achse zählt sie negativ.') },
    { name: 'a → v', task: 'av', seed: 12,
      idea: () => L('The change of velocity is the area under the acceleration graph, and the acceleration is the slope of the velocity graph.',
        'Die Geschwindigkeitsänderung ist die Fläche unter dem Beschleunigung-Zeit-Graphen, und die Beschleunigung ist die Steigung des Geschwindigkeit-Zeit-Graphen.') },
  ];
  const bar = (q) => `${q}̄`; // q with a bar: the mean value
  // A given graph and its answer side by side.
  const pairFigure = (e, given, answer) => `<div class="tgraphs"><div><h3>${ui().given}: ${qc(e.from)}</h3><div class="plot">${given}</div></div>` +
    `<div><h3>${ui().answer}: ${qc(e.to)}</h3><div class="plot">${answer}</div></div></div>`;

  function lesson(def) {
    const e = generate(def.task, def.seed);
    return withEx(e, () => {
      const { Tut } = Plot, f = e.from, g = e.to, ps = e.pieces, n = ps.length;
      const marks = (i) => ps.map((p, k) => (k === i ? 'focus' : ''));
      const num = (x) => (r2(x) > 0 ? '+' : '') + fmt(x);
      const frames = [{
        text: `<p class="step-rule">${L('The task', 'Die Aufgabe')}</p><p>${statement()}</p><p>${ruleText()} ${L('We go through the graph piece by piece.', 'Wir gehen den Graphen Stück für Stück durch.')}</p>`,
        figure: pairFigure(e, sourceGraph(e), Plot.answerGraph(e, { upto: 0 })),
      }];
      ps.forEach((p, i) => {
        const tm = (p.t0 + p.t1) / 2;
        let over, under = () => '', ans;
        if (e.dir === 'diff') {
          const m = (p.G1 - p.G0) / len(p);
          over = (s) => Tut.chord(s, p.t0, p.G0, p.t1, p.G1) + Tut.dot(s, p.t0, p.G0) + Tut.dot(s, p.t1, p.G1) +
            (sloped(p) ? Tut.tangent(s, p.t0, p.G0, p.g0) + Tut.tangent(s, p.t1, p.G1, p.g1) : '') +
            Tut.tag(s, tm, (p.G0 + p.G1) / 2, `${sloped(p) ? bar(g) : g} = ${num(m)} ${UNIT[g]}`, m >= 0 ? 'left' : 'right');
          ans = (s) => Tut.dot(s, p.t0, p.g0) + Tut.dot(s, p.t1, p.g1) +
            (sloped(p) ? Tut.dot(s, tm, m, 'mean') + Tut.tag(s, tm, m, bar(g), p.g1 > p.g0 ? 'left' : 'right') : '') +
            Tut.tag(s, p.t1, p.g1, num(p.g1), p.g1 >= p.g0 ? 'above' : 'below');
        } else {
          const dG = area(p);
          under = (s) => Tut.area(s, p.t0, p.g0, p.t1, p.g1);
          // the label just outside the shaded area: above it if the area counts positive, else below
          over = (s) => Tut.tag(s, tm, dG >= 0 ? Math.max(p.g0, p.g1, 0) : Math.min(p.g0, p.g1, 0), `Δ${g} = ${num(dG)} ${UNIT[g]}`, dG >= 0 ? 'above' : 'below');
          ans = (s) => Tut.dot(s, p.t0, p.G0) + Tut.dot(s, p.t1, p.G1) +
            Tut.tangent(s, p.t0, p.G0, p.g0) + Tut.tangent(s, p.t1, p.G1, p.g1) +
            Tut.tag(s, p.t1, p.G1, `${num(p.G1)} ${UNIT[g]}`, dG >= 0 ? 'above' : 'below');
        }
        const text = describe(p, i).replace(/^<b>[^<]*<\/b>: /, '');
        frames.push({
          text: `<p class="step-rule">${L(`Piece ${i + 1} of ${n}`, `Stück ${i + 1} von ${n}`)} (${when(p)})</p><p>${text}</p>`,
          figure: pairFigure(e, sourceGraph(e, { marks: marks(i), under, overlay: over }), Plot.answerGraph(e, { upto: i + 1, marks: marks(i), overlay: ans })),
        });
      });
      const F = Q(f), G = Q(g);
      const check = e.dir === 'diff'
        ? L(`Check: where ${F} has a horizontal tangent, ${G} = 0; where ${F} rises, ${G} &gt; 0; where it falls, ${G} &lt; 0.`,
          `Kontrolle: Wo ${F} eine waagrechte Tangente hat, ist ${G} = 0; wo ${F} steigt, ist ${G} &gt; 0; wo ${F} fällt, ist ${G} &lt; 0.`)
        : L(`Check: where ${F} = 0, the ${G} graph is horizontal; where ${F} &gt; 0, ${G} rises; where ${F} &lt; 0, it falls.`,
          `Kontrolle: Wo ${F} = 0 ist, ist der ${G}-Graph waagrecht; wo ${F} &gt; 0 ist, steigt ${G}; wo ${F} &lt; 0 ist, fällt ${G}.`);
      frames.push({ text: `<p class="step-rule">${L('The whole graph', 'Der ganze Graph')}</p><p>${ruleText()}</p><p>${check}</p>`, figure: pairFigure(e, sourceGraph(e), Plot.answerGraph(e)) });
      return frames;
    });
  }
  // On a phone, the worked examples use the narrow drawings too (see Plot.setNarrow).
  const phone = () => window.matchMedia('(max-width: 640px)').matches;
  // A worked example of a quiz exercise: the task, its worked steps, then the answers with the
  // typical wrong ones and the misconception behind each.
  const figOf = (f) => `<div class="figs">${f.startsWith('<div') ? f : `<figure class="fig">${f}</figure>`}</div>`;
  function quizLesson(def) {
    const e = Concepts.make(def.kind, def.seed, def.d);
    const task = { text: `<p class="step-rule">${L('The task', 'Die Aufgabe')}</p>${e.text}<ol class="tq">${e.questions.map((q) => `<li>${q.prompt}</li>`).join('')}</ol>`, figure: figOf(e.figure) };
    const steps = e.steps.map((x) => ({ text: `<p class="step-rule">${x.title}</p><p>${x.text}</p>`, figure: figOf(x.figure) }));
    const wrongs = (q) => (q.type === 'num' ? q.traps.map((t) => ({ html: `${fmt(t.value)} ${q.unit}`, flag: t.flag, why: t.why })) : q.options.filter((o) => !o.correct))
      .filter((o) => o.flag).map((o) => `<li>${o.html.startsWith('<svg') ? '' : `<i>${o.html}</i> `}<span class="tag">${Concepts.FLAGS[o.flag]()}</span><br>${o.why}</li>`).join('');
    const answers = e.questions.map((q, k) => `<p><span class="qn">${k + 1}</span>${q.prompt} <b>${e.answers[k]}</b></p>` +
      (wrongs(q) ? `<details><summary>${ui().wrongs}</summary><ul class="wrong">${wrongs(q)}</ul></details>` : '')).join('');
    return [task, ...steps, { text: `<p class="step-rule">${ui().answers}</p>${answers}`, figure: steps[steps.length - 1].figure }];
  }
  const nameOf = (l) => (typeof l.name === 'function' ? l.name() : l.name);
  const lessons = () => LESSONS.map((l) => ({ name: nameOf(l), idea: l.idea(), frames: () => (l.kind ? quizLesson(l) : phone() ? narrowed(() => lesson(l)) : lesson(l)) }));

  // ---------------------------------------------------------------- arcade
  // Each question shows a given graph; the options are the right graph and three from typical
  // mistakes (see quiz() in generator.js). The graphs are drawn narrow, to fit two side by side.
  function narrowed(f) {
    const wide = Plot.W >= 640;
    Plot.setNarrow(true);
    try { return f(); } finally { Plot.setNarrow(!wide); }
  }
  // What a wrong option shows, by its flag.
  function arcadeWhy(flag) {
    const F = Q(ex.from), f = Q(ex.to), fb = BAR[ex.to];
    switch (flag) {
      case 'copy': return copiedText(L('This graph has the shape of the given one.', 'Dieser Graph hat die Form des gegebenen.'));
      case 'sign': return ex.dir === 'diff' ? whyDiff('sign')
        : L(`This graph changes the wrong way: where ${F} is positive, ${f} increases; where it is negative, ${f} decreases.`,
          `Dieser Graph ändert sich in die falsche Richtung: Wo ${F} positiv ist, nimmt ${f} zu; wo ${F} negativ ist, nimmt ${f} ab.`);
      case 'average': return L(`This graph shows ${M()} ${fb} = Δ${F}/Δ<i>t</i> for each whole piece. But where ${F} is curved, ${f} changes steadily: it equals ${fb} only in the middle of the piece.`,
        `Dieser Graph zeigt für jedes ganze Stück ${M('acc')} ${fb} = Δ${F}/Δ<i>t</i>. Aber wo ${F} gekrümmt ist, ändert sich ${f} gleichmässig: Es ist nur in der Mitte des Stücks gleich ${fb}.`);
      case 'rectStart': return L(`This graph takes the change of ${f} in each piece as the value of ${F} at its start times Δ<i>t</i>. But where ${F} changes, Δ${f} is the area of a trapezoid: (start + end)/2 · Δ<i>t</i>.`,
        `Dieser Graph nimmt als Änderung von ${f} in jedem Stück den Wert von ${F} am Anfang mal Δ<i>t</i>. Aber wo sich ${F} ändert, ist Δ${f} die Fläche eines Trapezes: (Anfang + Ende)/2 · Δ<i>t</i>.`);
      default: return L(`The values at the breakpoints are right, but where ${F} changes, the slope of ${f} changes too: ${f} is a parabola there, not a straight line.`,
        `Die Werte an den Übergangsstellen stimmen, aber wo sich ${F} ändert, ändert sich auch die Steigung von ${f}: ${f} ist dort eine Parabel, keine Gerade.`);
    }
  }
  function arcadeQuestion(kind, seed) {
    const d = Number(kind.slice(1));
    let e = null, q = null;
    for (let k = 0; !q; k++) {
      e = ofDifficulty(d, (seed + 7919 * k) >>> 0);
      if (e.kind) break;
      q = quiz(e, seed);
    }
    if (e.kind) {
      // a quiz exercise: one of its questions with four options (concepts.js)
      const a = Concepts.arcade(e, seed);
      return {
        title: e.title, text: e.text, figure: e.figure.startsWith('<div') ? e.figure : `<figure class="fig">${e.figure}</figure>`, ask: a.ask,
        options: a.options.map((o) => ({ html: o.html, correct: o.correct, flag: o.correct ? null : o.flag, why: o.correct ? '' : o.why })),
        explain: () => `<div class="steps">${stepsHtml(e)}</div>`,
      };
    }
    return withEx(e, () => narrowed(() => ({
      title: taskTitle(e),
      text: `<p>${statement().replace(/ (Draw|Zeichne) .*$/, '')}</p>`,
      figure: `<figure class="fig">${sourceGraph(e)}</figure>`,
      ask: L(`Which graph shows ${its(e.to)} ${Q(e.to)}(<i>t</i>)?`, `Welcher Graph zeigt ${its(e.to)} ${Q(e.to)}(<i>t</i>)?`),
      options: q.options.map((o) => ({ html: Plot.answerGraph(e, { vals: o.vals, axis: o.axis }), correct: !!o.correct, flag: o.flag, why: o.correct ? '' : arcadeWhy(o.flag) })),
      explain: () => withEx(e, () => narrowed(() => `${pairFigure(e, sourceGraph(e), Plot.answerGraph(e))}` +
        `<div class="steps"><p>${ruleText()}</p><ul>${e.pieces.map((p, i) => `<li>${describe(p, i)}</li>`).join('')}</ul></div>`)),
    })));
  }
  const arcadeSource = {
    id: 'mg',
    kinds: [1, 2, 3, 4, 5].map((d) => ({ id: `d${d}`, difficulty: d })),
    question: arcadeQuestion,
    concept: {
      copy: 'copy', sign: 'sign', average: 'mean', rectStart: 'area', curve: 'shape', rect: 'area',
      ...Object.fromEntries(['position', 'magnitude', 'crossing', 'below', 'negpos', 'nodt', 'origin', 'gaps', 'order', 'height', 'unsigned'].map((f) => [f, f])),
    },
    concepts: () => ({
      ...Object.fromEntries(['position', 'magnitude', 'crossing', 'below', 'negpos', 'nodt', 'origin', 'gaps', 'order', 'height', 'unsigned'].map((f) => [f, Concepts.FLAGS[f]()])),
      copy: L('the value instead of the slope', 'der Wert statt der Steigung'),
      sign: L('the sign', 'das Vorzeichen'),
      mean: L('the mean value for a whole piece', 'der Mittelwert für ein ganzes Stück'),
      area: L('the area under a changing graph', 'die Fläche unter einem veränderlichen Graphen'),
      shape: L('straight instead of curved', 'gerade statt gekrümmt'),
    }),
    intro: () => ({
      tag: L('Position, velocity and their graphs: answer as many questions as you can in <b>5 minutes</b>.', 'Ort, Geschwindigkeit und ihre Graphen: Beantworte in <b>5 Minuten</b> so viele Fragen wie möglich.'),
      rule: L('Questions get harder as you go: speeds and directions, value tables and stroboscope pictures first, then slopes and areas of graphs. Choose one of four answers: click it or press 1–4.',
        'Die Fragen werden nach und nach schwieriger: zuerst Tempo und Richtung, Wertetabellen und Stroboskopaufnahmen, dann Steigungen und Flächen von Graphen. Wähle eine von vier Antworten: Klicke sie an oder drücke 1–4.'),
      example: L('copying the shape of the given graph', 'die Form des gegebenen Graphen übernehmen'),
    }),
    // the position and velocity of the first worked example, and the velocity as a slope
    hero: () => narrowed(() => {
      const e = generate('sv', 17);
      return `<div class="figs"><figure class="fig">${sourceGraph(e)}</figure><figure class="fig">${Plot.answerGraph(e)}</figure></div>` +
        '<p class="ar-law"><i>v</i> = d<i>s</i>/d<i>t</i></p>';
    }),
  };

  // ---------------------------------------------------------------- language
  function applyStatic() {
    document.title = ui().title;
    Lang.apply(ui());
    const cur = $('#levels').childElementCount ? level() : stored('mg-level', 'easy');
    $('#levels').innerHTML = Object.entries(ui().levels).map(([k, n]) => `
      <label><input type="radio" name="level" value="${k}"${k === cur ? ' checked' : ''}><span>${n}</span></label>`).join('');
  }

  // The same exercise in the other language, with the drawing, feedback, hints and solution kept.
  function switchLang() {
    applyStatic();
    showScore();
    if (ex && isQuiz()) {
      const keep = quizAnswers(), id = ex.id, [, key, seed] = id.match(/^([a-z]+)-(\d+)$/);
      ex = generate(key, Number(seed));
      ex.id = id;
      render(keep);
      if ($('#task').hidden) { $('#hints').hidden = true; $('#solution').hidden = true; }
    } else if (ex) {
      ex.hints = hintsOf();
      render(editor.state());
      if ($('#task').hidden) { $('#hints').hidden = true; $('#solution').hidden = true; }
    }
    tutor.relabel(lessons());
    arcade.relabel();
  }

  // ---------------------------------------------------------------- modes
  // Practice: random exercises; tutor: worked examples; arcade: a timed game (arcade.js). Hints
  // and solution belong to practice. Leaving the arcade ends a running game.
  const mode = () => (document.querySelector('input[name="mode"]:checked') || {}).value || 'practice';
  function setMode(m) {
    document.querySelector(`input[name="mode"][value="${m}"]`).checked = true;
    store('mg-mode', m);
    document.querySelectorAll('.practice').forEach((el) => { el.hidden = m !== 'practice'; });
    $('#tutor').hidden = m !== 'tutor';
    $('#arcade').hidden = m !== 'arcade';
    if (m !== 'practice') { $('#hints').hidden = true; $('#solution').hidden = true; }
    if (m !== 'arcade') arcade.stop();
  }
  function practise() {
    setMode('practice');
    if (ex) { history.replaceState(null, '', `#${ex.id}`); $('#hints').hidden = !st.hints; $('#solution').hidden = !st.revealed; relayout(); } else fresh();
  }
  function play() {
    setMode('arcade');
    arcade.show();
    if (location.hash !== '#arcade') history.replaceState(null, '', '#arcade');
  }

  function fromHash() {
    const h = location.hash.slice(1);
    if (h === 'arcade') { if ($('#arcade').hidden) play(); return true; }
    let m = h.match(/^tutor-(\d+)$/);
    if (m && Number(m[1]) >= 1 && Number(m[1]) <= tutor.count) {
      setMode('tutor');
      if (tutor.current() !== Number(m[1]) - 1 || !tutor.shown()) tutor.open(Number(m[1]) - 1);
      return true;
    }
    // a level, or (older links) a task
    m = h.match(/^(easy|medium|hard|mixed|sv|va|vs|av|compare|direction|table|strobe|area)-(\d+)$/);
    if (!m) return false;
    setMode('practice');
    const lv = document.querySelector(`input[name="level"][value="${m[1]}"]`);
    if (lv) lv.checked = true;
    if (!ex || ex.id !== h) open(generate(m[1], Number(m[2])));
    return true;
  }

  // ---------------------------------------------------------------- init
  function init() {
    Lang.init(); // see lang.js
    document.querySelector('main').insertAdjacentHTML('beforeend', Arcade.HTML);
    applyStatic();
    Lang.wire(switchLang);
    $('#levels').addEventListener('change', () => { store('mg-level', level()); fresh(); });
    $('#new').addEventListener('click', fresh);
    $('#q-fields').addEventListener('input', () => { if (st && !st.solved) showFeedback(); });
    $('#q-fields').addEventListener('change', () => { if (st && !st.solved) showFeedback(); });
    $('#given').addEventListener('pointermove', hoverGiven);
    $('#given').addEventListener('pointerleave', hoverGiven);
    $('#check').addEventListener('click', check);
    $('#hint').addEventListener('click', hint);
    $('#reset').addEventListener('click', () => editor.reset());
    $('#reveal').addEventListener('click', reveal);
    window.addEventListener('hashchange', fromHash);
    window.addEventListener('resize', relayout);
    tutor = window.createTutor(lessons(), { done: practise });
    arcade = Arcade.create(arcadeSource, { math: () => {}, markScrollable: () => {}, stored, store });
    $('#modes').addEventListener('change', () => {
      if (mode() === 'tutor') { setMode('tutor'); tutor.open(tutor.current()); } else if (mode() === 'arcade') play(); else practise();
    });
    showScore();
    if (fromHash()) return;
    // First visit: start with the first worked example.
    const last = stored('mg-mode', 'tutor');
    if (last === 'tutor') { setMode('tutor'); tutor.open(0); } else if (last === 'arcade') play(); else { setMode('practice'); fresh(); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
