(function () {
  'use strict';

  const { TASKS, generate, evaluate, copied, sloped, len, rate, area } = window.Motion;
  const Plot = window.Plot, { sourceGraph, UNIT } = Plot;
  const NARROW = 560;
  const $ = (sel) => document.querySelector(sel);
  const MAX_TRIES = 3;
  const NAME = { s: 'position', v: 'velocity', a: 'acceleration' };
  const LABEL = { sv: 's → v', va: 'v → a', vs: 'v → s', av: 'a → v' };

  let ex = null, editor = null;
  // tries, hints used, solved, revealed
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
    $('#score').textContent = s.solved ? `Solved: ${s.solved} · first try without hints: ${s.clean}` : '';
  }

  // ---------------------------------------------------------------- formatting
  const Q = (q) => `<i>${q}</i>`;
  const r2 = (x) => Math.round(x * 100) / 100 + 0;
  const fmt = (x) => (r2(x) < 0 ? '−' + -r2(x) : String(r2(x)));
  const sgn = (x) => (r2(x) > 0 ? '+' + r2(x) : fmt(x));
  const val = (x, q) => `${fmt(x)} ${UNIT[q]}`;
  const sval = (x, q) => `${sgn(x)} ${UNIT[q]}`;
  const plus = (a, b) => `${fmt(a)} ${b < 0 ? '−' : '+'} ${fmt(Math.abs(b))}`;
  const at = (q, t) => `${Q(q)}(${t ? fmt(t) + ' s' : 0})`;
  const when = (p) => `${p.t0}–${p.t1} s`;
  const and = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
  const pieceList = (is) => `${is.length > 1 ? 'Pieces' : 'Piece'} ${and(is.map((i) => i + 1))}`;
  const times = (ts) => and(ts.map((t) => `${fmt(t)} s`));
  const indices = (test) => ex.pieces.map((p, i) => i).filter((i) => test(ex.pieces[i], i));
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

  // ---------------------------------------------------------------- derivative: s → v, v → a
  // F is the given graph (G), f the one to draw (g). Parabolas are solved with the mean velocity
  // (or mean acceleration) f̄ = ΔF/Δt: f changes linearly, so f̄ is the mean of f at the start and
  // at the end, and f passes through f̄ in the middle of the piece.
  const MEAN = { v: 'mean velocity', a: 'mean acceleration' };
  const BAR = { v: '<i class="bar">v</i>', a: '<i class="bar">a</i>' };
  const mean = (p) => (p.G1 - p.G0) / len(p);
  const paren = (x) => (r2(x) < 0 ? `(${fmt(x)})` : fmt(x));

  // Why f is known at one end of piece i; `withValue` also names the value (in the solution).
  function whyEnd(p, i, end, withValue) {
    const F = Q(ex.from), f = Q(ex.to), t = end === 'start' ? p.t0 : p.t1;
    const why = ex.how[i][end], k = end === 'start' ? i : i + 2;
    if (why === 'vertex') return `${F} has a horizontal tangent at ${fmt(t)} s, so ${at(ex.to, t)} = 0.`;
    if (why === 'join' && withValue) return `${F} joins piece ${k} smoothly at ${fmt(t)} s (no kink), so ${at(ex.to, t)} = ${sval(end === 'start' ? p.g0 : p.g1, ex.to)}, the same as in piece ${k}.`;
    if (why === 'join') return `${F} joins piece ${k} smoothly at ${fmt(t)} s (no kink), so ${f} has the same value on both sides.`;
    return `${at(ex.to, t)} follows from the ${MEAN[ex.to]} ${BAR[ex.to]} = (${at(ex.to, p.t0)} + ${at(ex.to, p.t1)})/2.`;
  }

  function hintsDiff() {
    const F = Q(ex.from), f = Q(ex.to), fb = BAR[ex.to], ps = ex.pieces;
    const straight = indices((p) => !sloped(p)), curved = indices(sloped);
    const h1 = `${F}(<i>t</i>) has five pieces. ${pieceList(straight)} ${straight.length > 1 ? 'are' : 'is'} straight, so ${f} is constant there. ` +
      `${pieceList(curved)} ${curved.length > 1 ? 'are parabolas' : 'is a parabola'}: there the slope of ${F} changes steadily, so ${f} is a sloped straight line. ` +
      `At every breakpoint, ${F} joins smoothly (no kink), so ${f} does not jump: the ${f} graph is one connected line.`;
    const plan = curved.map((i) => {
      const p = ps[i], h = ex.how[i];
      const first = h.start === 'mean' ? 'end' : 'start', second = first === 'start' ? 'end' : 'start';
      return `<li>Piece ${i + 1}: ${whyEnd(p, i, first)} ${h[second] === 'mean' ? `Then ${whyEnd(p, i, second)}` : whyEnd(p, i, second)}</li>`;
    });
    const h2 = `${f} is the slope of the ${F}(<i>t</i>) graph. In every piece, the ${MEAN[ex.to]} is ${fb} = Δ${F}/Δ<i>t</i>. In a straight piece, ${f} = ${fb}. ` +
      `In a parabola, ${f} changes linearly, so ${fb} is the mean of ${f} at the start and at the end (and ${f} = ${fb} in the middle of the piece). ` +
      `Read ${f} at the end where you can (a horizontal tangent, or the smooth join to a piece you know), then get the other end from ${fb}:<ul>${plan.join('')}</ul>`;
    const formulas = ps.map((p, i) => {
      const dF = `(${at(ex.from, p.t1)} − ${at(ex.from, p.t0)}) / ${len(p)} s`;
      if (!sloped(p)) return `<li>Piece ${i + 1}: ${f} = ${fb} = ${dF}</li>`;
      const known = ex.how[i].start === 'mean' ? 'end' : 'start', other = known === 'start' ? p.t1 : p.t0;
      return `<li>Piece ${i + 1}: ${fb} = ${dF}, then ${at(ex.to, other)} = 2 · ${fb} − ${at(ex.to, known === 'start' ? p.t0 : p.t1)}</li>`;
    });
    const h3 = `Formulas, piece by piece:<ul>${formulas.join('')}</ul>`;
    const avgs = ps.map((p, i) => `piece ${i + 1}: ${sval(mean(p), ex.to)}`);
    const h4 = `${MEAN[ex.to].replace(/^./, (c) => c.toUpperCase())} ${fb} per piece: ${and(avgs)}. In a straight piece, this is ${f}; in a parabola, it is ${f} in the middle of the piece, halfway between the start and end values.`;
    return [h1, h2, h3, h4];
  }

  function describeDiff(p, i) {
    const F = Q(ex.from), f = Q(ex.to), fb = BAR[ex.to], dF = p.G1 - p.G0, L = len(p), m = mean(p);
    const head = `<b>Piece ${i + 1} (${when(p)})</b>: `;
    const meanIs = `${fb} = Δ${F}/Δ<i>t</i> = ${sval(dF, ex.from)} / ${L} s = ${sval(m, ex.to)}`;
    if (!sloped(p)) {
      if (p.g0 === 0) return head + `${F} stays at ${val(p.G0, ex.from)}${ex.from === 's' ? ' (the body is at rest)' : ' (the velocity is constant)'}, so ${f} = 0.`;
      return head + `${F} changes steadily from ${val(p.G0, ex.from)} to ${val(p.G1, ex.from)}, so ${f} is constant and equal to the ${MEAN[ex.to]}: ${f} = ${meanIs}.`;
    }
    const tm = (p.t0 + p.t1) / 2;
    let out = head + `${F} is a parabola (it curves ${p.g1 > p.g0 ? 'upward' : 'downward'}), so ${f} changes linearly. The ${MEAN[ex.to]} is ${meanIs}. ` +
      `Because ${f} changes linearly, ${fb} is the mean of the start and end values, ${fb} = (${at(ex.to, p.t0)} + ${at(ex.to, p.t1)})/2, and ${f} = ${fb} in the middle of the piece, at ${fmt(tm)} s. `;
    const h = ex.how[i];
    if (h.start !== 'mean' && h.end !== 'mean') {
      return out + `${whyEnd(p, i, 'start', true)} ${whyEnd(p, i, 'end', true)} Check: (${plus(p.g0, p.g1)})/2 ${UNIT[ex.to]} = ${sval(m, ex.to)} = ${fb}.`;
    }
    const known = h.start === 'mean' ? 'end' : 'start';
    const [tk, vk, to, vo] = known === 'start' ? [p.t0, p.g0, p.t1, p.g1] : [p.t1, p.g1, p.t0, p.g0];
    return out + `${whyEnd(p, i, known, true)} So ${at(ex.to, to)} = 2 · ${fb} − ${at(ex.to, tk)} = 2 · ${paren(m)} − ${paren(vk)} = ${sval(vo, ex.to)}.`;
  }

  function whyDiff(code, p, i) {
    const F = Q(ex.from), f = Q(ex.to), fb = BAR[ex.to];
    switch (code) {
      case 'sign': return `Check the sign: where ${F} increases, ${f} is positive; where it decreases, ${f} is negative.`;
      case 'notConst': return `${F} is a straight line here, so its slope does not change: ${f} is constant (a horizontal line).`;
      case 'value': return p.g0 === 0
        ? `${F} is horizontal here${ex.from === 's' ? ' (the body is at rest)' : ''}, so ${f} = 0.`
        : `${f} is constant here, but check its value: ${f} equals the ${MEAN[ex.to]} ${fb} = Δ${F}/Δ<i>t</i>. Read the change of ${F} and the duration of the piece from the graph.`;
      case 'average': return `You drew the ${MEAN[ex.to]} ${fb} = Δ${F}/Δ<i>t</i> for the whole piece. But ${F} is curved here, so ${f} changes steadily: it equals ${fb} only in the middle of the piece and is a sloped straight line through that point.`;
      case 'notLinear': return `${F} is curved here, so its slope changes: ${f} is not constant, but a sloped straight line.`;
      case 'direction': return p.g1 > p.g0
        ? `${F} curves upward here (its slope increases), so ${f} must increase.`
        : `${F} curves downward here (its slope decreases), so ${f} must decrease.`;
      case 'start': case 'end': return `The value at the ${code} of the piece is off. ${whyEnd(p, i, code)}`;
      default: return `Both end values are off: ${f} is the slope of the tangent to ${F} at the start and at the end of the piece, and their mean is the ${MEAN[ex.to]} ${fb} = Δ${F}/Δ<i>t</i>. ${whyEnd(p, i, ex.how[i].start === 'mean' ? 'end' : 'start')}`;
    }
  }

  // ---------------------------------------------------------------- integral: v → s, a → v
  // g is the given graph, G the one to draw.
  function hintsInt() {
    const g = Q(ex.from), G = Q(ex.to), ps = ex.pieces;
    const constant = indices((p) => !sloped(p)), changing = indices(sloped);
    const zs = zeros(), rest = indices((p) => !sloped(p) && p.g0 === 0);
    const h1 = `${g}(<i>t</i>) has five straight pieces. In ${pieceList(constant).toLowerCase()}, ${g} is constant, so ${G} is a straight line there. ` +
      `In ${pieceList(changing).toLowerCase()}, ${g} changes steadily, so ${G} is a parabola there. ${g} does not jump, so ${G} joins smoothly (without a kink) at every breakpoint.` +
      (zs.length ? ` ${g} = 0 at ${times(zs)}: ${G} has a horizontal tangent there.` : '') +
      (rest.length ? ` In ${pieceList(rest).toLowerCase()}, ${g} = 0, so ${G} stays constant.` : '');
    const h2 = `Start at ${at(ex.to, 0)} = ${val(ex.pieces[0].G0, ex.to)}. In every piece, the change Δ${G} is the area between the ${g} graph and the <i>t</i> axis (area below the axis counts negative). ` +
      `Mark ${G} at the breakpoints piece by piece, then draw the shape: straight where ${g} is constant; where ${g} increases, ${G} curves upward, and where ${g} decreases, ${G} curves downward. ` +
      `At every instant, the slope of ${G} is ${g}.`;
    const formulas = ps.map((p, i) => {
      if (!sloped(p)) return `<li>Piece ${i + 1} (rectangle): Δ${G} = ${g} · Δ<i>t</i> = ${at(ex.from, p.t0)} · ${len(p)} s</li>`;
      const cross = p.g0 * p.g1 < 0 ? '; the triangles above and below the axis partly cancel' : '';
      return `<li>Piece ${i + 1} (trapezoid): Δ${G} = (${at(ex.from, p.t0)} + ${at(ex.from, p.t1)})/2 · ${len(p)} s${cross}</li>`;
    });
    const h3 = `Formulas, piece by piece:<ul>${formulas.join('')}</ul>`;
    const h4 = `Δ${G} per piece: ${and(ps.map((p, i) => `piece ${i + 1}: ${sval(area(p), ex.to)}`))}.`;
    return [h1, h2, h3, h4];
  }

  function describeInt(p, i) {
    const g = Q(ex.from), G = Q(ex.to), L = len(p), dG = area(p);
    const head = `<b>Piece ${i + 1} (${when(p)})</b>: `;
    if (!sloped(p)) {
      if (p.g0 === 0) return head + `${g} = 0, so ${G} stays at ${val(p.G0, ex.to)}.`;
      return head + `${g} = ${sval(p.g0, ex.from)} is constant, so ${G} is a straight line: Δ${G} = ${sval(p.g0, ex.from)} · ${L} s = ${sval(dG, ex.to)}, from ${val(p.G0, ex.to)} to ${val(p.G1, ex.to)}.`;
    }
    const x = -p.g0 / rate(p);
    const turn = x > 0 && x < L ? ` ${g} = 0 at ${fmt(p.t0 + x)} s, where ${G} has a horizontal tangent.` : '';
    return head + `${g} changes from ${sval(p.g0, ex.from)} to ${sval(p.g1, ex.from)}, so ${G} is a parabola that curves ${p.g1 > p.g0 ? 'upward' : 'downward'}. ` +
      `Δ${G} = (${plus(p.g0, p.g1)})/2 ${UNIT[ex.from]} · ${L} s = ${sval(dG, ex.to)}, from ${val(p.G0, ex.to)} to ${val(p.G1, ex.to)}.${turn}`;
  }

  function whyInt(code, p) {
    const g = Q(ex.from), G = Q(ex.to), dG = area(p);
    const up = dG > 0 ? 'increases' : 'decreases';
    switch (code) {
      case 'sign': return p.g0 * p.g1 < 0
        ? `${G} changes the wrong way. The area ${dG > 0 ? 'above' : 'below'} the <i>t</i> axis is larger than the one ${dG > 0 ? 'below' : 'above'}, so ${G} ${up} overall.`
        : `${G} changes the wrong way: ${g} is ${dG > 0 ? 'positive' : 'negative'} here, so ${G} ${up}.`;
      case 'rectStart': case 'rectEnd': return `Your change of ${G} is ${at(ex.from, code === 'rectStart' ? p.t0 : p.t1)} · Δ<i>t</i>. But ${g} changes in this piece: Δ${G} is the area of the trapezoid under the ${g} graph, (${at(ex.from, p.t0)} + ${at(ex.from, p.t1)})/2 · Δ<i>t</i>.`;
      case 'unsigned': return `${g} changes sign in this piece: the area below the <i>t</i> axis counts negative.`;
      case 'area': return `Check the change of ${G}: Δ${G} is the area between the ${g} graph and the <i>t</i> axis from ${p.t0} s to ${p.t1} s.`;
      case 'straight': return `${g} is constant here, so ${G} is a straight line: drag the diamond back onto the line between the ends.`;
      case 'curve': return `${g} changes here, so ${G} is curved (a parabola): drag the diamond to bend the piece.`;
      case 'bendDir': return p.g1 > p.g0
        ? `${g} increases here, so the slope of ${G} increases: ${G} curves upward (the middle lies below the straight line between the ends).`
        : `${g} decreases here, so the slope of ${G} decreases: ${G} curves downward (the middle lies above the straight line between the ends).`;
      default: return `${G} bends the right way, but too ${code === 'bendMore' ? 'little' : 'much'}. At the start and at the end of the piece, the slope of ${G} must equal ${g} there.`;
    }
  }

  // ---------------------------------------------------------------- exercise text
  function statement() {
    const { from, to } = ex;
    if (ex.dir === 'diff') {
      return `A body moves along a straight line. The graph shows its ${NAME[from]} ${Q(from)}(<i>t</i>), made of straight and parabolic pieces. Draw the matching ${NAME[to]}–time graph ${Q(to)}(<i>t</i>).`;
    }
    return `A body moves along a straight line. The graph shows its ${NAME[from]} ${Q(from)}(<i>t</i>), made of straight pieces. At <i>t</i> = 0, ${at(to, 0)} = ${val(ex.pieces[0].G0, to)}. Draw the matching ${NAME[to]}–time graph ${Q(to)}(<i>t</i>).`;
  }
  function howTo() {
    const q = Q(ex.to);
    const keys = ' Keyboard: Tab to the graph, ←/→ choose a point, ↑/↓ move it.';
    if (ex.dir === 'diff') return `Drag the dots at the breakpoints to set ${q} there, or drag the line of a piece to move both of its ends.${keys}`;
    return `Drag the dots at the breakpoints to set ${q} there (${at(ex.to, 0)} is given), and the diamond in the middle of a piece to bend it into a parabola. Each piece is judged by how much ${q} changes in it, so a mistake only counts once.${keys}`;
  }

  function solution() {
    const rule = ex.dir === 'diff'
      ? `${Q(ex.to)} is the slope of the ${Q(ex.from)}(<i>t</i>) graph: constant where ${Q(ex.from)} is straight, a sloped straight line where ${Q(ex.from)} is a parabola. ${Q(ex.from)} has no kinks, so ${Q(ex.to)} does not jump.`
      : `The change of ${Q(ex.to)} is the area under the ${Q(ex.from)}(<i>t</i>) graph, and the slope of ${Q(ex.to)} is ${Q(ex.from)}: a straight line where ${Q(ex.from)} is constant, a parabola where it changes linearly. ${Q(ex.from)} does not jump, so ${Q(ex.to)} has no kinks.`;
    const rows = ex.pieces.map((p, i) => `<li>${(ex.dir === 'diff' ? describeDiff : describeInt)(p, i)}</li>`);
    return `<p>${rule} The correct graph is drawn as a dashed black line.</p><ul class="pieces">${rows.join('')}</ul>`;
  }

  // ---------------------------------------------------------------- exercise lifecycle
  const newSeed = () => 1 + Math.floor(Math.random() * 999999);
  const canReveal = () => st.solved || st.hints >= ex.hints.length || st.tries >= MAX_TRIES;

  function open(exercise) {
    ex = exercise;
    ex.hints = ex.dir === 'diff' ? hintsDiff() : hintsInt();
    st = { tries: 0, hints: 0, solved: false, revealed: false };
    const hash = `#${ex.id}`;
    if (location.hash !== hash) history.replaceState(null, '', hash);

    $('#task-title').textContent = `${LABEL[ex.task]}: ${ex.dir === 'diff' ? 'from a graph to its slope' : 'from a graph to the area under it'}`;
    $('#statement').innerHTML = statement();
    $('#howto').innerHTML = howTo();
    const qc = (q) => `<span class="qc-${q}">${NAME[q]} ${Q(q)}(<i>t</i>)</span>`;
    $('#given-title').innerHTML = `Given: ${qc(ex.from)}`;
    $('#draw-title').innerHTML = `Your graph: ${qc(ex.to)}`;
    Plot.setNarrow(narrow());
    $('#given').innerHTML = sourceGraph(ex);

    const old = $('#draw');
    const fresh = old.cloneNode(false); // drop the listeners of the previous editor
    old.replaceWith(fresh);
    fresh.setAttribute('viewBox', `0 0 ${Plot.W} ${Plot.H}`);
    fresh.setAttribute('aria-label', `Graph of ${NAME[ex.to]} against time to draw. ${ex.dir === 'diff' ? 'Handles at the breakpoints.' : 'Handles at the breakpoints and in the middle of each piece.'} Use the arrow keys.`);
    editor = window.createEditor(fresh, ex, onEdit);

    $('#hint-list').innerHTML = '';
    $('#hints').hidden = true;
    $('#solution').hidden = true;
    $('#sol-text').innerHTML = '';
    $('#status').textContent = '';
    $('#status').className = 'status';
    $('#feedback').innerHTML = '';
    updateButtons();
  }

  function onEdit() {
    if (st.revealed) return;
    $('#feedback').innerHTML = '';
    if ($('#status').classList.contains('bad')) { $('#status').textContent = ''; $('#status').className = 'status'; }
  }

  // Redraw both graphs when the screen gets narrow or wide (the drawing is kept).
  const narrow = () => $('#given').clientWidth < NARROW;
  function relayout() {
    if (!ex || (Plot.W < 640) === narrow()) return;
    Plot.setNarrow(narrow());
    $('#given').innerHTML = sourceGraph(ex);
    $('#draw').setAttribute('viewBox', `0 0 ${Plot.W} ${Plot.H}`);
    editor.show({});
  }

  // Coordinates of the grid point or crossing under the mouse on the given graph.
  function hoverGiven(evt) {
    const el = $('#given svg');
    if (!ex || !el) return;
    const old = el.querySelector('.hover');
    if (old) old.remove();
    if (evt.type === 'pointerleave' || evt.pointerType === 'touch') return;
    const pt = Plot.svgPoint(el, evt), axis = ex.axes.source;
    el.firstElementChild.insertAdjacentHTML('beforeend', Plot.hoverMark(axis, ex.from, Plot.hoverPoint(ex, axis, [ex.source], pt.x, pt.y)));
  }

  const task = () => (document.querySelector('input[name="task"]:checked') || {}).value || 'mixed';
  function fresh() {
    const k = task(), keys = Object.keys(TASKS);
    open(generate(k === 'mixed' ? keys[Math.floor(Math.random() * keys.length)] : k, newSeed()));
  }

  function updateButtons() {
    const left = ex.hints.length - st.hints;
    const hb = $('#hint');
    hb.disabled = left === 0 || st.revealed;
    hb.textContent = left ? `Hint (${left} left)` : 'No more hints';
    const rb = $('#reveal');
    rb.disabled = !canReveal() || st.revealed;
    rb.title = canReveal() ? '' : `Unlocks after all hints or ${MAX_TRIES} attempts`;
    $('#reveal-note').hidden = canReveal() || st.revealed;
    $('#check').disabled = st.revealed;
    $('#reset').disabled = st.revealed;
  }

  function check() {
    const ans = editor.values(), res = evaluate(ex, ans), status = $('#status');
    st.tries++;
    const right = res.filter((r) => r.ok).length;
    editor.show({ marks: res.map((r) => (r.ok ? 'ok' : 'bad')) });
    if (right === res.length) {
      if (!st.solved) {
        const s = stored('mg-score', { solved: 0, clean: 0 });
        s.solved++;
        if (st.tries === 1 && st.hints === 0) s.clean++;
        store('mg-score', s);
        showScore();
      }
      st.solved = true;
      status.textContent = 'All five pieces are correct, well done!';
      status.className = 'status ok';
      $('#feedback').innerHTML = '';
    } else {
      const more = canReveal() ? ' You can take a hint or look at the solution.' : ' Correct the pieces marked ✗ and check again, or take a hint.';
      status.textContent = `${right} of ${res.length} pieces are correct (attempt ${st.tries}).${more}`;
      status.className = 'status bad';
      const why = ex.dir === 'diff' ? whyDiff : whyInt;
      const items = res.map((r, i) => (r.ok ? '' : `<li><b>Piece ${i + 1} (${when(ex.pieces[i])})</b>: ${r.codes.map((c) => why(c, ex.pieces[i], i)).join(' ')}</li>`));
      if (copied(ex, ans)) {
        items.unshift(`<li>Your graph has the same shape as the given one. But ${ex.dir === 'diff'
          ? `${Q(ex.to)} is the <em>slope</em> of ${Q(ex.from)}, not its value: where ${Q(ex.from)} is large but constant, ${Q(ex.to)} = 0.`
          : `${Q(ex.from)} is the <em>slope</em> of ${Q(ex.to)}: where ${Q(ex.from)} is constant, ${Q(ex.to)} changes steadily.`}</li>`);
      }
      $('#feedback').innerHTML = items.join('');
    }
    updateButtons();
  }

  function hint() {
    if (st.hints >= ex.hints.length) return;
    const li = document.createElement('li');
    li.innerHTML = ex.hints[st.hints];
    $('#hint-list').appendChild(li);
    st.hints++;
    $('#hints').hidden = false;
    updateButtons();
    li.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function reveal() {
    if (!canReveal()) return;
    st.revealed = true;
    editor.show({ solution: true, locked: true, marks: evaluate(ex, editor.values()).map((r) => (r.ok ? 'ok' : 'bad')) });
    $('#sol-text').innerHTML = solution();
    $('#solution').hidden = false;
    $('#feedback').innerHTML = '';
    $('#status').textContent = 'The correct graph is now shown as a dashed black line.';
    $('#status').className = 'status';
    updateButtons();
    $('#solution').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function fromHash() {
    const m = location.hash.slice(1).match(/^(sv|va|vs|av)-(\d+)$/);
    if (!m) return false;
    if (!ex || ex.id !== m[0]) open(generate(m[1], Number(m[2])));
    return true;
  }

  // ---------------------------------------------------------------- init
  function init() {
    const saved = stored('mg-task', 'mixed');
    $('#tasks').innerHTML = Object.entries({ mixed: 'Mixed', ...LABEL }).map(([k, name]) => `
      <label><input type="radio" name="task" value="${k}"${k === saved ? ' checked' : ''}><span>${name}</span></label>`).join('');
    $('#tasks').addEventListener('change', () => { store('mg-task', task()); fresh(); });
    $('#new').addEventListener('click', fresh);
    $('#given').addEventListener('pointermove', hoverGiven);
    $('#given').addEventListener('pointerleave', hoverGiven);
    $('#check').addEventListener('click', check);
    $('#hint').addEventListener('click', hint);
    $('#reset').addEventListener('click', () => editor.reset());
    $('#reveal').addEventListener('click', reveal);
    window.addEventListener('hashchange', fromHash);
    window.addEventListener('resize', relayout);
    showScore();
    if (!fromHash()) fresh();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
