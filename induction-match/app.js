(function () {
  'use strict';

  const I = window.Induction, X = window.IndEx, P = window.Plot, Figs = window.IndFigures;
  const { flux, volt, curved } = I;
  const { fluxGraph, voltGraph, optionGraph, num, Tut } = P;
  const { describe, describeBack, RULE, fmt, neg, Vi, PHI, DPHI, zeroOf, cap, when, endOf, pairFigure } = X;
  const Lang = window.Lang, Arcade = window.Arcade, L = Lang.L;
  const $ = (sel) => document.querySelector(sel);
  const r1 = (x) => Math.round(x * 10) / 10;

  // ---------------------------------------------------------------- interface texts
  const UI = {
    en: {
      title: 'Electromagnetic Induction', mode: 'Mode', difficulty: 'Difficulty', example: 'Example',
      tutor: 'Tutor', practice: 'Practice', real: 'Problems', arcade: 'Arcade', new: 'New exercise', problem: 'Problem', newNumbers: 'New numbers', nextProblem: 'Next problem',
      tutorNote: 'Use the arrow keys ← → to step through. The part of the graph a step is about is <span class="k-band">highlighted</span> in both graphs; short lines are tangents (the slope at that point), triangles show the change of <i>Φ</i> over a time span, and shaded areas the area under the voltage graph.',
      fluxH: 'Magnetic flux', voltH: 'Induced voltage', option: (k) => `Graph ${k}`, clear: 'Reset the drawing', yours: 'Your graph',
      check: 'Check', reveal: 'Show solution', hints: 'Hints', solution: 'Solution',
      revealNote: (n) => `The solution unlocks once you have solved the exercise, used all hints or made ${n} attempts.`,
      stars: (d) => `Difficulty: ${d} of 5`,
      score: (s, c) => `Solved: ${s} · first try without hints: ${c}`,
      hint: (n) => `Hint (${n} left)`, noHints: 'No more hints', unlocks: (n) => `Unlocks after all hints or ${n} attempts`,
      fill: 'Answer every question, then check.', ok: 'All correct.', okWell: 'All correct, well done!',
      notYet: (n) => `Not quite yet (attempt ${n}).`, tryAgain: ' Try again, or take a hint.', canReveal: ' You can take a hint or look at the solution.',
      correct: 'Correct', missed: 'This one is correct too:', shown: 'The right answers are marked.',
      drawWrong: (n) => `${n} ${n === 1 ? 'handle is' : 'handles are'} not right yet (marked).`,
    },
    de: {
      title: 'Elektromagnetische Induktion', mode: 'Modus', difficulty: 'Schwierigkeit', example: 'Beispiel',
      tutor: 'Tutor', practice: 'Üben', real: 'Praxisaufgaben', arcade: 'Arcade', new: 'Neue Aufgabe', problem: 'Aufgabe', newNumbers: 'Neue Zahlen', nextProblem: 'Nächste Aufgabe',
      tutorNote: 'Mit den Pfeiltasten ← → blätterst du weiter. Der Teil des Graphen, um den es in einem Schritt geht, ist in beiden Graphen <span class="k-band">hervorgehoben</span>; kurze Linien sind Tangenten (die Steigung an dieser Stelle), Dreiecke zeigen die Änderung von <i>Φ</i> in einer Zeitspanne und schattierte Flächen die Fläche unter dem Spannungsgraphen.',
      fluxH: 'Magnetischer Fluss', voltH: 'Induzierte Spannung', option: (k) => `Graph ${k}`, clear: 'Zeichnung zurücksetzen', yours: 'Dein Graph',
      check: 'Prüfen', reveal: 'Lösung zeigen', hints: 'Tipps', solution: 'Lösung',
      revealNote: (n) => `Die Lösung wird freigeschaltet, sobald du die Aufgabe gelöst, alle Tipps genutzt oder ${n} Versuche gemacht hast.`,
      stars: (d) => `Schwierigkeit: ${d} von 5`,
      score: (s, c) => `Gelöst: ${s} · beim ersten Versuch ohne Tipps: ${c}`,
      hint: (n) => `Tipp (${n} übrig)`, noHints: 'Keine Tipps mehr', unlocks: (n) => `Wird nach allen Tipps oder ${n} Versuchen freigeschaltet`,
      fill: 'Beantworte jede Frage und prüfe dann.', ok: 'Alles richtig.', okWell: 'Alles richtig, gut gemacht!',
      notYet: (n) => `Noch nicht ganz (Versuch ${n}).`, tryAgain: ' Versuche es nochmals, oder nimm einen Tipp.', canReveal: ' Du kannst einen Tipp nehmen oder die Lösung anschauen.',
      correct: 'Richtig', missed: 'Auch diese ist richtig:', shown: 'Die richtigen Antworten sind markiert.',
      drawWrong: (n) => `${n} ${n === 1 ? 'Griff stimmt' : 'Griffe stimmen'} noch nicht (markiert).`,
    },
  };
  const ui = () => UI[Lang.get()];

  let ex = null, st = null, tutor = null, arcade = null, topics = null, problems = null;
  function stored(key, fallback) { try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; } }
  function store(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ } }
  function showScore() { const s = stored('im-score', { solved: 0, clean: 0 }); $('#score').textContent = s.solved ? ui().score(s.solved, s.clean) : ''; }
  const starsOf = (d) => `<span class="stars" role="img" aria-label="${ui().stars(d)}" title="${ui().stars(d)}">${'★'.repeat(d)}${'☆'.repeat(5 - d)}</span>`;
  const pic = (e) => (e.pic ? Figs[e.pic[0]](e.pic[1]) : '');

  // ---------------------------------------------------------------- questions
  // pick: graphs as options; choice: a row of options; multi: statements to tick.
  function questionHtml(q) {
    if (q.type === 'pick') {
      return `<p class="ask">${q.label}</p><div class="cands four" role="radiogroup">${q.options.map((o, k) => `<label class="cand" data-k="${k}"><input type="radio" name="q-${q.key}" value="${k}"><span class="letter">${k + 1}</span>${o.html}</label>`).join('')}</div><p class="qfb" data-fb="${q.key}"></p>`;
    }
    if (q.type === 'multi') {
      return `<ul class="stmts">${q.statements.map((s, k) => `<li data-k="${k}"><label><input type="checkbox" name="q-${q.key}" value="${k}"><span>${s.html}</span></label><span class="fb"></span></li>`).join('')}</ul>`;
    }
    return `<div class="field" data-key="${q.key}"><span class="what">${q.label}</span><div class="opts" role="radiogroup">${q.options.map((o, k) => `<label><input type="radio" name="q-${q.key}" value="${k}"><span>${o.label}</span></label>`).join('')}</div><span class="fb" aria-live="polite"></span></div>`;
  }
  // Marks every answer; true if all are right, null if one is missing.
  function feedback() {
    if (ex.kind === 'draw') return drawFeedback();
    let all = true, missing = false;
    for (const q of ex.questions) {
      if (q.type === 'multi') {
        q.statements.forEach((s, k) => {
          const li = $(`.stmts li[data-k="${k}"]`), on = li.querySelector('input').checked, good = on === s.ok;
          li.className = good ? (on ? 'ok' : '') : 'bad';
          li.querySelector('.fb').innerHTML = good ? '' : on ? s.why : `${ui().missed} ${s.why}`;
          if (!good) all = false;
        });
        continue;
      }
      const sel = document.querySelector(`input[name="q-${q.key}"]:checked`);
      if (!sel) { all = false; missing = true; continue; }
      const o = q.options[Number(sel.value)];
      if (q.type === 'pick') {
        document.querySelectorAll(`input[name="q-${q.key}"]`).forEach((x) => x.closest('.cand').classList.remove('ok', 'bad'));
        sel.closest('.cand').classList.add(o.ok ? 'ok' : 'bad');
        $(`[data-fb="${q.key}"]`).innerHTML = o.ok ? '' : o.why;
      } else {
        const row = $(`.field[data-key="${q.key}"]`);
        row.className = `field ${o.ok ? 'ok' : 'bad'}`;
        row.querySelector('.fb').innerHTML = o.ok ? ui().correct : o.why;
      }
      if (!o.ok) all = false;
    }
    return all ? true : missing && !document.querySelector('.field.bad, .cand.bad, .stmts li.bad') ? null : false;
  }

  // ---------------------------------------------------------------- drawing
  const drawSpec = () => ({ ...ex.draw, values: st.values, wrong: st.wrong, label: ui().yours });
  function drawEditor() {
    const h = ex.draw.kind === 'flux' ? `<h3 class="qc-flux">${ui().fluxH} ${PHI}</h3>` : `<h3 class="qc-volt">${ui().voltH} ${Vi()}</h3>`;
    $('#draw-area').innerHTML = `<div class="given">${h}${P.drawGraph(drawSpec())}</div><button type="button" id="draw-clear" class="linklike">${ui().clear}</button>`;
  }
  function onDrawClick(evt) {
    if (!ex || ex.kind !== 'draw' || st.solved || st.revealed) return;
    const svg = evt.target.closest('svg.drawing');
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    const q = pt.matrixTransform(svg.getScreenCTM().inverse()), hit = P.pointAt(ex.draw, q.x, q.y);
    if (!hit) return;
    st.values[hit.i] = hit.y;
    st.wrong = null;
    $('#draw-fb').textContent = '';
    drawEditor();
  }
  function drawFeedback() {
    const wrong = ex.draw.at.map((x, i) => i).filter((i) => Math.abs(st.values[i] - ex.draw.target[i]) > 1e-9);
    st.wrong = wrong.length ? wrong : null;
    drawEditor();
    $('#draw-fb').textContent = wrong.length ? ui().drawWrong(wrong.length) : '';
    return wrong.length === 0;
  }

  // ---------------------------------------------------------------- exercises
  const PRACTICE = 'im', typeOf = (e) => e.type;
  const finish = () => { if (ex && st) Practice.finish(PRACTICE, typeOf(ex), st); };
  const maxTries = () => (ex.questions.length === 1 && ex.questions[0].type === 'pick' ? 2 : 3);
  function open(exercise) {
    finish();
    ex = exercise;
    st = { tries: 0, hints: 0, solved: false, revealed: false, checked: false, status: null, values: ex.draw ? [...ex.draw.init] : null, wrong: null };
    if (location.hash !== `#${ex.id}`) history.replaceState(null, '', `#${ex.id}`);
    render();
    if (ex.real == null) topics.shown(ex);
  }
  const fresh = () => open(topics.next(ex));
  const again = (e) => (e.real != null ? problems.parse(e.id) : topics.parse(e.id) || X.make(e.type, e.seed));

  function render() {
    $('#title').innerHTML = `${ex.title} ${starsOf(ex.difficulty)}`;
    $('#prompt').innerHTML = ex.text;
    $('#figure').innerHTML = pic(ex) + (ex.figs || '');
    $('#draw-area').hidden = ex.kind !== 'draw';
    $('#draw-fb').textContent = '';
    if (ex.kind === 'draw') drawEditor();
    $('#fields').innerHTML = ex.questions.map(questionHtml).join('');
    $('#hint-list').innerHTML = '';
    $('#hints').hidden = true;
    $('#solution').hidden = true;
    showStatus(null);
    updateButtons();
  }

  const canReveal = () => st.solved || Practice.solvedBefore(PRACTICE, ex.id) || st.tries >= maxTries() || st.hints >= ex.hints.length;
  function updateButtons() {
    const left = ex.hints.length - st.hints;
    $('#hint').disabled = left === 0 || st.revealed || st.solved;
    $('#hint').textContent = left ? ui().hint(left) : ui().noHints;
    $('#reveal').disabled = !canReveal() || st.revealed;
    $('#reveal').title = canReveal() ? '' : ui().unlocks(maxTries());
    $('#reveal-note').textContent = ui().revealNote(maxTries());
    $('#reveal-note').hidden = canReveal() || st.revealed;
    $('#check').textContent = st.solved ? (ex.real != null ? ui().nextProblem : ui().new) : ui().check;
    $('#check').classList.toggle('primary', !st.solved);
    $('#check').classList.toggle('new-btn', st.solved);
    $('#check').disabled = st.revealed && !st.solved;
  }
  function showStatus(kind) {
    const el = $('#status');
    if (st) st.status = kind;
    el.className = 'status' + (kind === 'ok' ? ' ok' : kind === 'bad' ? ' bad' : '');
    el.textContent = !kind ? '' : kind === 'fill' ? ui().fill : kind === 'shown' ? ui().shown
      : kind === 'ok' ? ui().okWell + (st.advance ? ` ${st.advance}` : '')
        : ui().notYet(st.tries) + (!canReveal() ? ui().tryAgain : ui().canReveal);
  }
  function check(evt) {
    evt.preventDefault();
    if (st.solved) { if (ex.real != null) problems.next(); else fresh(); return; }
    if (st.revealed) return;
    const r = feedback();
    st.checked = true;
    if (r === null) { showStatus('fill'); return; }
    st.tries++;
    if (r) solved(); else showStatus('bad');
    updateButtons();
  }
  function solved() {
    const s = stored('im-score', { solved: 0, clean: 0 });
    s.solved++;
    if (st.tries === 1 && st.hints === 0) s.clean++;
    store('im-score', s);
    showScore();
    st.solved = true;
    Practice.markSolved(PRACTICE, ex.id);
    finish();
    st.advance = ex.real != null ? '' : topics.solved(st, ex);
    if (ex.real != null) problems.solved(ex);
    document.querySelectorAll('#fields input').forEach((x) => { x.disabled = true; });
    showStatus('ok');
  }
  function showHints() { $('#hint-list').innerHTML = ex.hints.slice(0, st.hints).map((h) => `<li>${h}</li>`).join(''); $('#hints').hidden = !st.hints; }
  function hint() {
    if (st.hints >= ex.hints.length) return;
    st.hints++;
    showHints();
    updateButtons();
    $('#hint-list').lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function showSolution() {
    $('#sol-figure').innerHTML = ex.solFig || '';
    $('#sol-steps').innerHTML = ex.solution.map((s) => (s.startsWith('<ul') ? s : `<p>${s}</p>`)).join('');
    $('#solution').hidden = false;
  }
  // The right answers marked: chosen and checked, the statements ticked, the drawing set.
  function markRight() {
    for (const q of ex.questions) {
      if (q.type === 'multi') q.statements.forEach((s, k) => { document.querySelector(`.stmts li[data-k="${k}"] input`).checked = s.ok; });
      else document.querySelector(`input[name="q-${q.key}"][value="${q.options.findIndex((o) => o.ok)}"]`).checked = true;
    }
    if (ex.kind === 'draw') { st.values = [...ex.draw.target]; st.wrong = null; drawEditor(); $('#draw-fb').textContent = ''; } else feedback();
    document.querySelectorAll('#fields input').forEach((x) => { x.disabled = true; });
  }
  function reveal() {
    if (!canReveal()) return;
    st.revealed = true;
    finish();
    markRight();
    showStatus('shown');
    showSolution();
    updateButtons();
    $('#solution').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---------------------------------------------------------------- tutor: graphs
  // The given graph and the four options of an exercise (generator.js); with marks, the right one
  // and the traps are marked.
  function optionsFigure(e, marks) {
    const cards = e.options.map((o, k) => {
      const cls = marks ? (o.ok ? 'ok' : 'bad') : '', badge = marks ? (o.ok ? '✓' : L('trap', 'Falle')) : '';
      return `<div class="cand ${cls}"><span class="letter">${k + 1}</span>${badge ? `<span class="badge">${badge}</span>` : ''}${optionGraph(o, { label: ui().option(k + 1) })}</div>`;
    }).join('');
    return `${X.given(e.dir, e.g)}<div class="cands four">${cards}</div>`;
  }
  // the area between the voltage graph and the axis over piece p
  function area(fg, p) {
    return (gr) => {
      const n = 24, pts = Array.from({ length: n + 1 }, (x, k) => { const t = p.t0 + ((p.t1 - p.t0) * k) / n; return `${gr.x(t)},${gr.y(volt(fg, Math.min(t, p.t1 - 1e-9)))}`; });
      return `<path class="tarea" d="M${gr.x(p.t0)},${gr.y(0)} L${pts.join(' L')} L${gr.x(p.t1)},${gr.y(0)} Z"/>`;
    };
  }
  function graphLesson(def) {
    const e = I.generate(def.type, def.seed), f = e.g, ps = f.pieces, back = e.dir === 'v2phi';
    const frames = [{
      text: `<p class="step-rule">${L('The task', 'Die Aufgabe')}</p>${X.prompt(e.dir, e.phi0)}<p>${X.askGraph(e.dir)}</p>` +
        (back ? L(`<p>${DPHI} = −${Vi()}: the voltage gives the slope of the flux graph, with the opposite sign. We build the flux graph piece by piece, starting at ${fmt(e.phi0)} mWb, and then compare it with the four graphs.</p>`,
          `<p>${DPHI} = −${Vi()}: Die Spannung gibt die Steigung des Flussgraphen an, mit umgekehrtem Vorzeichen. Wir bauen den Flussgraphen Stück für Stück auf, beginnend bei ${fmt(e.phi0)} mWb, und vergleichen ihn dann mit den vier Graphen.</p>`)
          : L(`<p>${Vi()} = −${DPHI}: the induced voltage is the slope of the flux graph, with the opposite sign (Lenz's rule). The value of ${PHI} itself does not matter. We work out the voltage graph piece by piece, and then compare it with the four graphs.</p>`,
            `<p>${Vi()} = −${DPHI}: Die induzierte Spannung ist die Steigung des Flussgraphen mit umgekehrtem Vorzeichen (Lenzsche Regel). Der Wert von ${PHI} selbst spielt keine Rolle. Wir bestimmen den Spannungsgraphen Stück für Stück und vergleichen ihn dann mit den vier Graphen.</p>`)),
      figure: optionsFigure(e, false),
    }, {
      text: `<p class="step-rule">${L('Piece by piece', 'Stück für Stück')}</p><p>${back
        ? L(`The voltage graph has ${ps.length} parts, separated at ${ps.slice(1).map((p) => `${fmt(p.t0)} s`).join(', ')}. The flux starts at ${fmt(e.phi0)} mWb.`, `Der Spannungsgraph hat ${ps.length} Teile, getrennt bei ${ps.slice(1).map((p) => `${fmt(p.t0)} s`).join(', ')}. Der Fluss beginnt bei ${fmt(e.phi0)} mWb.`)
        : L(`The flux graph has ${ps.length} parts, separated at ${ps.slice(1).map((p) => `${fmt(p.t0)} s`).join(', ')}.`, `Der Flussgraph hat ${ps.length} Teile, getrennt bei ${ps.slice(1).map((p) => `${fmt(p.t0)} s`).join(', ')}.`)}</p>`,
      figure: back ? pairFigure(fluxGraph(f, false, { upto: 0, overlay: (g) => Tut.dot(g, 0, e.phi0) }), voltGraph(f)) : pairFigure(fluxGraph(f), voltGraph(f, false, { upto: 0 })),
    }];
    ps.forEach((p, i) => {
      const band = [p.t0, p.t1], y0 = p.p0, y1 = endOf(f, p), v0 = volt(f, p.t0), v1 = volt(f, p.t1 - 1e-9), len = p.t1 - p.t0;
      let fo, vo, extra = '';
      if (!curved(p)) {
        fo = (g) => (p.d0 !== 0 ? Tut.triangle(g, p.t0, y0, p.t1, y1) + Tut.tag(g, (p.t0 + p.t1) / 2, y0, `Δt = ${fmt(len)} s`, y1 > y0 ? 'below' : 'above') +
          Tut.tag(g, p.t1, (y0 + y1) / 2, `ΔΦ = ${num(r1(y1 - y0))} mWb`, 'right') : '') + Tut.dot(g, p.t0, y0) + Tut.dot(g, p.t1, y1);
        vo = (g) => Tut.dot(g, p.t0, v0) + Tut.dot(g, p.t1, v1) + Tut.tag(g, (p.t0 + p.t1) / 2, v0, `${num(r1(v0))} mV`, v0 >= 0 ? 'above' : 'below');
        if (!back && p.d0 !== 0) {
          extra = L(` Slope: ${PHI} changes by ${num(r1(y1 - y0))} mWb in ${fmt(len)} s, so ${DPHI} = ${num(r1(y1 - y0))} mWb / ${fmt(len)} s = ${num(p.d0)} mWb/s.`,
            ` Steigung: ${PHI} ändert sich in ${fmt(len)} s um ${num(r1(y1 - y0))} mWb, also ${DPHI} = ${num(r1(y1 - y0))} mWb / ${fmt(len)} s = ${num(p.d0)} mWb/s.`);
        }
      } else {
        const z = zeroOf(p);
        fo = (g) => Tut.tangent(g, p.t0, y0, p.d0) + Tut.dot(g, p.t0, y0) + Tut.tangent(g, p.t1, y1, p.d1) + Tut.dot(g, p.t1, y1) +
          (z === null ? '' : Tut.vline(g, z, 0, flux(f, z)) + Tut.dot(g, z, flux(f, z), 'flat'));
        vo = (g) => Tut.dot(g, p.t0, v0) + Tut.tag(g, p.t0, v0, `${num(r1(v0))} mV`, 'right') + Tut.dot(g, p.t1, v1) + Tut.tag(g, p.t1, v1, `${num(r1(v1))} mV`, 'left') +
          (z === null ? '' : Tut.dot(g, z, 0, 'flat'));
        if (!back) {
          extra = L(` The tangents show the slope at the start (${num(p.d0)} mWb/s) and at the end (${num(p.d1)} mWb/s).`,
            ` Die Tangenten zeigen die Steigung am Anfang (${num(p.d0)} mWb/s) und am Ende (${num(p.d1)} mWb/s).`);
        }
      }
      const vArea = back && (p.d0 !== 0 || curved(p)) ? area(f, p) : () => '';
      const text = (back ? describeBack(f, p) : describe(p)).replace(/^[^:]*: /, '');
      frames.push({
        text: `<p class="step-rule">${L(`Piece ${i + 1} of ${ps.length}`, `Stück ${i + 1} von ${ps.length}`)} (${when(p)})</p><p>${cap(text)}.${extra}</p>`,
        figure: back ? pairFigure(fluxGraph(f, false, { band, upto: i + 1, overlay: fo }), voltGraph(f, false, { band, overlay: (g) => vArea(g) + vo(g) }))
          : pairFigure(fluxGraph(f, false, { band, overlay: fo }), voltGraph(f, false, { band, upto: i + 1, overlay: vo })),
      });
    });
    const traps = e.options.map((o, k) => `<li><b>${ui().option(k + 1)}</b>: ${o.ok ? L('this is the graph we found.', 'das ist der Graph, den wir gefunden haben.') : X.WHY[e.dir][o.tag]()}</li>`).join('');
    frames.push({
      text: `<p class="step-rule">${L('The four graphs', 'Die vier Graphen')}</p><p>${RULE[e.dir][e.family]()}</p><ul>${traps}</ul>`,
      figure: optionsFigure(e, true),
    });
    return frames;
  }

  // ---------------------------------------------------------------- tutor: a loop through a field
  function loopOf(s, te, tw, V, t0) {
    const v = s / te, B = Math.round(((V * 1e-3 * te) / (s / 100) ** 2) * 1000) / 1000, m = Math.min(te, tw);
    return { s, te, tw, V, t0, B, v, w: v * tw, d: v * t0, m, t1: t0 + m, t2: t0 + m + Math.abs(te - tw), t3: t0 + te + tw };
  }
  function loopLesson() {
    const A = loopOf(10, 2, 4, 1, 1), g = X.loopGraph(A), ex1 = X.loopExplain(A);
    const Bn = loopOf(20, 4, 2, 1, 1), gn = X.loopGraph(Bn), exn = X.loopExplain(Bn);
    const fig = (L0) => Figs.loop({ s: L0.s, w: L0.w, d: L0.d, v: L0.v, B: L0.B });
    const step = (gr, band, upto) => pairFigure(fluxGraph(gr, false, { band, upto }), voltGraph(gr, false, { band, upto }));
    return [
      { text: `<p class="step-rule">${L('The situation', 'Die Situation')}</p>${L(`<p>A square loop, 10 cm on a side, is pulled at 5 cm/s through a field region 20 cm wide (0.2 T). How do the flux through it and the induced voltage change?</p><p>${ex1[0]}</p>`, `<p>Eine quadratische Schleife mit 10 cm Seitenlänge wird mit 5 cm/s durch ein 20 cm breites Feldgebiet (0.2 T) gezogen. Wie ändern sich der Fluss durch sie und die induzierte Spannung?</p><p>${ex1[0]}</p>`)}`,
        figure: fig(A) + step(g, [0, A.t0], 1) },
      { text: `<p class="step-rule">${L('Moving in', 'Hineinfahren')}</p><p>${ex1[1]}</p>`, figure: step(g, [A.t0, A.t1], 2) },
      { text: `<p class="step-rule">${L('Inside, then out', 'Drinnen, dann hinaus')}</p><p>${ex1[2]}</p>`, figure: step(g, [A.t1, A.t3]) },
      { text: `<p class="step-rule">${L('A field narrower than the loop', 'Ein Feld, schmaler als die Schleife')}</p><p>${L('Now the loop (20 cm) is wider than the field region (10 cm). The flux grows until the loop covers the whole field region, after 2 s, and stays constant while the field region lies inside the loop.', 'Jetzt ist die Schleife (20 cm) breiter als das Feldgebiet (10 cm). Der Fluss wächst, bis die Schleife das ganze Feldgebiet überdeckt, nach 2 s, und bleibt konstant, solange das Feldgebiet innerhalb der Schleife liegt.')}</p><p>${exn[1]}</p><p>${exn[2]}</p>`,
        figure: fig(Bn) + pairFigure(fluxGraph(gn, true), voltGraph(gn, true)) },
    ];
  }

  // ---------------------------------------------------------------- tutor: Lenz's rule
  function lenzLesson() {
    const north = L('north pole', 'Nordpol'), south = L('south pole', 'Südpol');
    return [
      { text: `<p class="step-rule">${L("Lenz's rule", 'Lenzsche Regel')}</p><p>${X.LENZ()}</p><p>${L(`A magnet approaches a ring, north pole first: the flux through the ring increases. The induced current makes the ring a magnet that pushes the approaching magnet back: the side facing it becomes a ${north}.`, `Ein Magnet nähert sich einem Ring, mit dem Nordpol voran: Der Fluss durch den Ring nimmt zu. Der induzierte Strom macht den Ring zu einem Magneten, der den nahenden Magneten abstösst: Die Seite zum Magneten wird ein ${north}.`)}</p>`,
        figure: Figs.magnet({ pole: 'N', move: 'toward' }) },
      { text: `<p class="step-rule">${L('The magnet moves away', 'Der Magnet entfernt sich')}</p><p>${L(`Pulled away, the magnet's flux through the ring decreases. Now the ring holds the magnet back: the side facing the north pole becomes a ${south}, and the ring is pulled after the magnet. Held still, the magnet induces nothing: the flux does not change.`, `Wird der Magnet weggezogen, nimmt sein Fluss durch den Ring ab. Jetzt hält der Ring den Magneten zurück: Die Seite zum Nordpol wird ein ${south}, und der Ring wird dem Magneten nachgezogen. Ruhig gehalten induziert der Magnet nichts: Der Fluss ändert sich nicht.`)}</p>`,
        figure: Figs.magnet({ pole: 'N', move: 'away' }) },
      { text: `<p class="step-rule">${L('The direction of the current', 'Die Richtung des Stroms')}</p><p>${X.RIGHTHAND()}</p><p>${L('So when the side facing the magnet becomes a north pole, the current flows anticlockwise, seen from the magnet; a south pole: clockwise.', 'Wird also die Seite zum Magneten ein Nordpol, fliesst der Strom vom Magneten aus gesehen im Gegenuhrzeigersinn; bei einem Südpol im Uhrzeigersinn.')}</p>`,
        figure: Figs.magnet({ pole: 'N', move: 'toward' }) },
      { text: `<p class="step-rule">${L('A changing field', 'Ein sich änderndes Feld')}</p><p>${L('A loop lies in a field into the page that gets stronger: the flux increases. The induced current makes its own field against the outer one, out of the page inside the loop: it flows anticlockwise. If the field got weaker, or the loop were pulled out of it, the current would support the field: clockwise.', 'Eine Schleife liegt in einem Feld in die Seite hinein, das stärker wird: Der Fluss nimmt zu. Der induzierte Strom erzeugt sein eigenes Feld gegen das äussere, innerhalb der Schleife aus der Seite heraus: Er fliesst im Gegenuhrzeigersinn. Würde das Feld schwächer oder die Schleife hinausgezogen, würde der Strom das Feld unterstützen: im Uhrzeigersinn.')}</p>`,
        figure: Figs.field({ into: true, how: 'up' }) },
    ];
  }

  // ---------------------------------------------------------------- the worked examples and practice topics
  const LESSONS = [
    { topic: 0, stage: 0, name: () => L('Straight flux graphs', 'Gerade Flussgraphen'), frames: () => graphLesson({ type: 'phi2v-lin', seed: 3 }),
      idea: () => L('Where the flux changes steadily, the induced voltage is constant: its size is the slope of the flux graph, and its sign is the opposite.', 'Wo sich der Fluss gleichmässig ändert, ist die induzierte Spannung konstant: Ihr Betrag ist die Steigung des Flussgraphen, ihr Vorzeichen das umgekehrte.') },
    { topic: 0, stage: 3, name: () => L('Smooth flux graphs', 'Glatte Flussgraphen'), frames: () => graphLesson({ type: 'phi2v-smooth', seed: 3 }),
      idea: () => L('Where the flux graph is curved, its slope changes steadily, so the induced voltage changes steadily too: a sloping straight line.', 'Wo der Flussgraph gekrümmt ist, ändert sich seine Steigung gleichmässig, also ändert sich auch die induzierte Spannung gleichmässig: eine schräge Gerade.') },
    { topic: 1, stage: 0, name: () => L('Back to the flux: straight', 'Zurück zum Fluss: gerade'), frames: () => graphLesson({ type: 'v2phi-lin', seed: 3 }),
      idea: () => L('The voltage tells how fast the flux changes; the area under the voltage graph tells by how much.', 'Die Spannung sagt, wie schnell sich der Fluss ändert; die Fläche unter dem Spannungsgraphen sagt, um wie viel.') },
    { topic: 1, stage: 3, name: () => L('Back to the flux: smooth', 'Zurück zum Fluss: glatt'), frames: () => graphLesson({ type: 'v2phi-smooth', seed: 3 }),
      idea: () => L('Where the voltage changes steadily, the flux graph is curved; where the voltage passes through zero, the flux has a peak or a valley.', 'Wo sich die Spannung gleichmässig ändert, ist der Flussgraph gekrümmt; wo die Spannung durch null geht, hat der Fluss einen Hoch- oder Tiefpunkt.') },
    { topic: 2, stage: 0, name: () => L('A loop through a field', 'Eine Schleife durch ein Feld'), frames: loopLesson,
      idea: () => L('The flux is B times the area in the field: it changes only while the loop moves in or out.', 'Der Fluss ist B mal die Fläche im Feld: Er ändert sich nur, während die Schleife hinein- oder hinausfährt.') },
    { topic: 3, stage: 0, name: () => L("Lenz's rule", 'Lenzsche Regel'), frames: lenzLesson,
      idea: () => L('The induced current opposes the change that causes it.', 'Der induzierte Strom wirkt der Änderung entgegen, die ihn verursacht.') },
  ];
  const stage = (name, types) => ({ name, types });
  const TOPICS = [
    { name: () => L('Flux → voltage', 'Fluss → Spannung'), example: (s) => (s === 3 || s === 4 ? 1 : 0), stages: [
      stage(() => L('straight', 'gerade'), ['phi2v-lin']), stage(() => L('read off values', 'Werte ablesen'), ['value-v-lin']), stage(() => L('draw it', 'zeichnen'), ['draw-v-lin']),
      stage(() => L('smooth', 'glatt'), ['phi2v-smooth', 'value-v-smooth']), stage(() => L('draw smooth graphs', 'glatte Graphen zeichnen'), ['draw-v-smooth']),
      stage(() => L('true or false', 'richtig oder falsch'), ['stmts-phi-lin', 'stmts-phi-smooth'])] },
    { name: () => L('Voltage → flux', 'Spannung → Fluss'), example: (s) => (s === 3 ? 3 : 2), stages: [
      stage(() => L('straight', 'gerade'), ['v2phi-lin']), stage(() => L('the change of the flux', 'die Änderung des Flusses'), ['value-dphi-lin']), stage(() => L('draw it', 'zeichnen'), ['draw-phi-lin']),
      stage(() => L('smooth', 'glatt'), ['v2phi-smooth', 'value-dphi-smooth']), stage(() => L('true or false', 'richtig oder falsch'), ['stmts-v-lin', 'stmts-v-smooth'])] },
    { name: () => L('A loop through a field', 'Eine Schleife durch ein Feld'), example: () => 4, stages: [
      stage(() => L('wide field', 'breites Feld'), ['loop-wide']), stage(() => L('narrow field', 'schmales Feld'), ['loop-narrow']), stage(() => L('the numbers', 'die Zahlen'), ['loop-num'])] },
    { name: () => L("Lenz's rule", 'Lenzsche Regel'), example: () => 5, stages: [
      stage(() => L('magnet and ring', 'Magnet und Ring'), ['lenz-magnet']), stage(() => L('a changing field', 'ein sich änderndes Feld'), ['lenz-field'])] },
  ];
  const lessons = () => LESSONS.map((l) => ({ name: l.name(), idea: l.idea(), frames: l.frames, also: topics.also(l.topic) }));

  // ---------------------------------------------------------------- arcade
  // One question of an exercise: four graphs, or a few values or words.
  const KINDS = [['phi2v-lin', 1], ['value-v-lin', 1], ['lenz-magnet', 1], ['v2phi-lin', 2], ['value-dphi-lin', 2], ['loop-wide', 2], ['lenz-field', 2],
    ['phi2v-smooth', 3], ['value-v-smooth', 3], ['loop-narrow', 3], ['loop-num', 3], ['v2phi-smooth', 4], ['value-dphi-smooth', 4]];
  const CONCEPT = { sign: 'lenz', copy: 'copy', copyF: 'copy', copyV: 'copy', steep: 'rate', delta: 'rate', zero: 'rate', average: 'curve', straight: 'curve',
    height: 'area', notime: 'area', nostart: 'area', start: 'area', inside: 'loop', once: 'loop', stay: 'loop', width: 'loop', side: 'loop', triangle: 'loop' };
  function arcadeQuestion(kind, seed) {
    const e = X.make(kind, seed), q = e.questions[seed % e.questions.length];
    const options = q.type === 'pick' ? q.options.map((o) => ({ html: o.html, correct: o.ok, flag: o.ok ? null : o.tag || 'other', why: o.why }))
      : q.options.map((o) => ({ html: o.label, correct: o.ok, flag: o.ok ? null : o.tag || 'other', why: o.why }));
    return {
      title: e.title, text: e.text, figure: `<div class="figs">${pic(e)}${e.figs || ''}</div>`, ask: q.label.replace(/^\([a-d]\) /, ''), options,
      explain: () => `${e.solFig || ''}<div class="steps">${e.solution.map((s) => (s.startsWith('<ul') ? s : `<p>${s}</p>`)).join('')}</div>`,
    };
  }
  const arcadeSource = {
    id: 'im',
    kinds: KINDS.map(([id, difficulty]) => ({ id, difficulty })),
    question: arcadeQuestion,
    concept: CONCEPT,
    concepts: () => ({
      lenz: L("the sign of the voltage (Lenz's rule)", 'das Vorzeichen der Spannung (Lenzsche Regel)'),
      copy: L('the shape of the other graph copied', 'die Form des anderen Graphen kopiert'),
      rate: L('how fast the flux changes', 'wie schnell sich der Fluss ändert'),
      curve: L('curved flux, changing voltage', 'gekrümmter Fluss, sich ändernde Spannung'),
      area: L('the change of the flux as minus the area', 'die Änderung des Flusses als minus die Fläche'),
      loop: L('when the flux through a moving loop changes', 'wann sich der Fluss durch eine bewegte Schleife ändert'),
    }),
    intro: () => ({
      tag: L('Flux and induced voltage, graphs and numbers: answer as many questions as you can in <b>5 minutes</b>.',
        'Fluss und induzierte Spannung, Graphen und Zahlen: Beantworte in <b>5 Minuten</b> so viele Fragen wie möglich.'),
      rule: L('Questions get harder as you go. Choose one of the answers: click it or press its number.',
        'Die Fragen werden nach und nach schwieriger. Wähle eine der Antworten: Klicke sie an oder drücke ihre Nummer.'),
      example: L('a voltage graph with the shape of the flux graph', 'ein Spannungsgraph mit der Form des Flussgraphen'),
    }),
    hero: () => {
      const f = I.graphOf('smooth', 4);
      return `<div class="figs"><figure class="fig">${fluxGraph(f)}</figure><figure class="fig">${voltGraph(f)}</figure></div><p class="ar-law">${Vi()} = −${DPHI}</p>`;
    },
  };

  // ---------------------------------------------------------------- language and modes
  function applyStatic() {
    document.title = ui().title;
    Lang.apply(ui());
    if (topics) topics.relabel();
    if (problems) problems.menu();
  }
  // The same exercise in the other language, with the answers, feedback, hints and solution kept.
  function switchLang() {
    applyStatic();
    showScore();
    if (ex) {
      const keep = st, status = st.status, chosen = [...document.querySelectorAll('#fields input:checked')].map((x) => [x.name, x.value]);
      ex = again(ex);
      render();
      st = keep;
      if (ex.kind === 'draw') drawEditor();
      chosen.forEach(([n, v]) => { const x = document.querySelector(`input[name="${n}"][value="${v}"]`); if (x) x.checked = true; });
      if (st.revealed) markRight(); else if (st.checked) feedback();
      if (st.solved) document.querySelectorAll('#fields input').forEach((x) => { x.disabled = true; });
      showStatus(status);
      showHints();
      if (st.revealed) showSolution();
      if ($('#task').hidden) { $('#hints').hidden = true; $('#solution').hidden = true; }
      updateButtons();
    }
    tutor.relabel(lessons());
    arcade.relabel();
  }

  const mode = () => (document.querySelector('input[name="mode"]:checked') || {}).value || 'practice';
  function setMode(m) {
    document.querySelector(`input[name="mode"][value="${m}"]`).checked = true;
    store('im-mode', m);
    document.querySelectorAll('.practice, .real').forEach((el) => { el.hidden = !el.classList.contains(m); });
    $('#tutor').hidden = m !== 'tutor';
    $('#arcade').hidden = m !== 'arcade';
    if (m !== 'practice' && m !== 'real') { $('#hints').hidden = true; $('#solution').hidden = true; }
    if (m !== 'arcade') arcade.stop();
  }
  function practise() {
    setMode('practice');
    if (ex && ex.real == null) { history.replaceState(null, '', `#${ex.id}`); $('#hints').hidden = !st.hints; $('#solution').hidden = !st.revealed; } else fresh();
  }
  function realMode() {
    setMode('real');
    if (problems.is(ex)) { history.replaceState(null, '', `#${ex.id}`); $('#hints').hidden = !st.hints; $('#solution').hidden = !st.revealed; } else problems.resume();
  }
  function play() { setMode('arcade'); arcade.show(); if (location.hash !== '#arcade') history.replaceState(null, '', '#arcade'); }
  function fromHash() {
    const h = location.hash.slice(1);
    if (h === 'arcade') { if ($('#arcade').hidden) play(); return true; }
    const m = h.match(/^tutor-(\d+)$/);
    if (m && Number(m[1]) >= 1 && Number(m[1]) <= LESSONS.length) {
      setMode('tutor');
      if (tutor.current() !== Number(m[1]) - 1 || !tutor.shown()) tutor.open(Number(m[1]) - 1);
      return true;
    }
    const re = problems.parse(h);
    if (re) { setMode('real'); if (!ex || ex.id !== h) open(re); problems.menu(); return true; }
    const te = topics.parse(h);
    if (te) { setMode('practice'); if (!ex || ex.id !== h) open(te); return true; }
    const d = h.match(/^([a-z0-9]+(?:-[a-z0-9]+)+)-(\d+)$/);
    if (d && X.TYPES.includes(d[1])) { setMode('practice'); if (!ex || ex.id !== h) open(X.make(d[1], Number(d[2]))); return true; }
    return false;
  }

  function init() {
    Lang.init();
    document.querySelector('main').insertAdjacentHTML('beforeend', Arcade.HTML);
    topics = window.Topics.create({
      app: PRACTICE,
      topics: TOPICS.map((t) => ({ name: t.name, stages: t.stages, example: (s) => ({ i: t.example(s), name: () => LESSONS[t.example(s)].name() }) })),
      make: (type, seed) => X.make(type, seed), typeOf,
      onChange: fresh,
      tutor: (i) => { setMode('tutor'); tutor.open(i); },
    });
    topics.mount($('#levels'));
    problems = window.Problems.create({
      app: PRACTICE, problems: window.IndProblems.PROBLEMS, make: window.IndProblems.realOf,
      open, current: () => ex, pick: $('#real-pick'), renew: $('#real-new'),
    });
    applyStatic();
    Lang.wire(switchLang);
    $('#new').addEventListener('click', fresh);
    $('#answers').addEventListener('submit', check);
    $('#fields').addEventListener('change', (evt) => {
      const row = evt.target.closest('.field');
      if (row) { row.className = 'field'; row.querySelector('.fb').textContent = ''; }
      const cand = evt.target.closest('.cand');
      if (cand) { cand.parentNode.querySelectorAll('.cand').forEach((el) => el.classList.remove('ok', 'bad')); const fb = cand.parentNode.nextElementSibling; if (fb) fb.textContent = ''; }
      const li = evt.target.closest('.stmts li');
      if (li) { li.className = ''; li.querySelector('.fb').textContent = ''; }
    });
    $('#draw-area').addEventListener('click', (evt) => {
      if (evt.target.id === 'draw-clear') { if (st.solved || st.revealed) return; st.values = [...ex.draw.init]; st.wrong = null; $('#draw-fb').textContent = ''; drawEditor(); return; }
      onDrawClick(evt);
    });
    $('#hint').addEventListener('click', hint);
    $('#reveal').addEventListener('click', reveal);
    window.addEventListener('hashchange', fromHash);
    tutor = window.createTutor(lessons(), { done: practise, practise: (i) => { topics.go(LESSONS[i].topic, LESSONS[i].stage); setMode('practice'); fresh(); } });
    arcade = Arcade.create(arcadeSource, { math: () => {}, markScrollable: () => {}, stored, store });
    $('#modes').addEventListener('change', () => {
      if (mode() === 'tutor') { setMode('tutor'); tutor.open(tutor.current()); } else if (mode() === 'arcade') play(); else if (mode() === 'real') realMode(); else practise();
    });
    showScore();
    if (fromHash()) return;
    const last = stored('im-mode', 'tutor');
    if (last === 'tutor') { setMode('tutor'); tutor.open(0); } else if (last === 'arcade') play(); else if (last === 'real') realMode(); else { setMode('practice'); fresh(); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
