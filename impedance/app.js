(function () {
  'use strict';

  const I = window.Impedance, P = window.Plot, M = window.Match, Identify = window.Identify;
  const Lang = window.Lang, Arcade = window.Arcade, L = Lang.L;
  const $ = (sel) => document.querySelector(sel);
  const MAX_TRIES = 3;

  // ---------------------------------------------------------------- interface texts
  const UI = {
    en: {
      title: 'Impedance Curves', mode: 'Mode', difficulty: 'Difficulty', example: 'Example', axes: 'Axes',
      tutor: 'Tutor', practice: 'Practice', arcade: 'Arcade', new: 'New exercise', lin: 'Linear', log: 'Log-log',
      tutorNote: 'Use the arrow keys ← → to step through. In the graph, dashed lines are asymptotes and helper lines, the tangent is drawn in <span class="k-tan">orange</span>. Switch to log-log axes above to see the same steps there.',
      check: 'Check', reveal: 'Show solution', hints: 'Hints', solution: 'Solution',
      revealNote: 'The worked solution unlocks once you have solved the exercise, used all hints or made three attempts.',
      levels: { easy: 'Easy', medium: 'Medium', hard: 'Hard', mixed: 'Mixed' },
      stars: (d) => `Difficulty: ${d} of 5`,
      score: (s, c) => `Solved: ${s} · first try without hints: ${c}`,
      hint: (n) => `Hint (${n} left)`, noHints: 'No more hints', unlocks: (n) => `Unlocks after all hints or ${n} attempts`,
      choose: 'Choose a value for each quantity, then check again.',
      ok: 'All correct.', okWell: 'All correct, well done! Compare your approach with the worked solution, or start a new exercise.',
      notYet: (n) => `Not quite yet (attempt ${n}).`, tryAgain: ' Try again, or take a hint.', canReveal: ' You can take a hint or look at the worked solution.',
      correct: 'Correct',
      chooseCurve: 'Choose a curve, then check again.', idFirst: 'First answer the questions above.',
      whichCurve: 'Which curve?', thenChoose: 'Then choose the curve:', curve: (k) => `Curve ${k}`,
      whichCircuit: 'Which circuit?', thenChooseCircuit: 'Then choose the circuit:', circuit: (k) => `Circuit ${k}`, chooseCircuit: 'Choose a circuit, then check again.',
      inversePrompt: 'The curve shows the impedance <i>Z</i> of a circuit against the angular frequency <i>ω</i>. Which of the four circuits is it? First answer the questions: each right answer rules out the circuits that do not fit.',
      matchPrompt: 'Which of the four curves shows the impedance <i>Z</i> of this circuit against the angular frequency <i>ω</i>? First answer the questions: each right answer rules out the curves that do not fit.',
    },
    de: {
      title: 'Impedanzkurven', mode: 'Modus', difficulty: 'Schwierigkeit', example: 'Beispiel', axes: 'Achsen',
      tutor: 'Tutor', practice: 'Üben', arcade: 'Arcade', new: 'Neue Aufgabe', lin: 'Linear', log: 'Doppelt log.',
      tutorNote: 'Mit den Pfeiltasten ← → blätterst du weiter. Im Graphen sind gestrichelte Linien Asymptoten und Hilfslinien, die Tangente ist <span class="k-tan">orange</span>. Wechsle oben zu doppelt logarithmischen Achsen, um dieselben Schritte dort zu sehen.',
      check: 'Prüfen', reveal: 'Lösung zeigen', hints: 'Tipps', solution: 'Lösung',
      revealNote: 'Die ausführliche Lösung wird freigeschaltet, sobald du die Aufgabe gelöst, alle Tipps genutzt oder drei Versuche gemacht hast.',
      levels: { easy: 'Einfach', medium: 'Mittel', hard: 'Schwierig', mixed: 'Gemischt' },
      stars: (d) => `Schwierigkeit: ${d} von 5`,
      score: (s, c) => `Gelöst: ${s} · beim ersten Versuch ohne Tipps: ${c}`,
      hint: (n) => `Tipp (${n} übrig)`, noHints: 'Keine Tipps mehr', unlocks: (n) => `Wird nach allen Tipps oder ${n} Versuchen freigeschaltet`,
      choose: 'Wähle für jede Grösse einen Wert und prüfe dann nochmals.',
      ok: 'Alles richtig.', okWell: 'Alles richtig, gut gemacht! Vergleiche deinen Lösungsweg mit der ausführlichen Lösung oder starte eine neue Aufgabe.',
      notYet: (n) => `Noch nicht ganz (Versuch ${n}).`, tryAgain: ' Versuche es nochmals, oder nimm einen Tipp.', canReveal: ' Du kannst einen Tipp nehmen oder die ausführliche Lösung anschauen.',
      correct: 'Richtig',
      chooseCurve: 'Wähle eine Kurve und prüfe dann nochmals.', idFirst: 'Beantworte zuerst die Fragen oben.',
      whichCurve: 'Welche Kurve?', thenChoose: 'Dann wähle die Kurve:', curve: (k) => `Kurve ${k}`,
      whichCircuit: 'Welche Schaltung?', thenChooseCircuit: 'Dann wähle die Schaltung:', circuit: (k) => `Schaltung ${k}`, chooseCircuit: 'Wähle eine Schaltung und prüfe dann nochmals.',
      inversePrompt: 'Die Kurve zeigt die Impedanz <i>Z</i> einer Schaltung gegen die Kreisfrequenz <i>ω</i>. Welche der vier Schaltungen ist es? Beantworte zuerst die Fragen: Jede richtige Antwort schliesst die Schaltungen aus, die nicht passen.',
      matchPrompt: 'Welche der vier Kurven zeigt die Impedanz <i>Z</i> dieser Schaltung gegen die Kreisfrequenz <i>ω</i>? Beantworte zuerst die Fragen: Jede richtige Antwort schliesst die Kurven aus, die nicht passen.',
    },
  };
  const ui = () => UI[Lang.get()];

  let ex = null, st = null, probe = null, tutor = null, arcade = null, topics = null;

  // ---------------------------------------------------------------- persistence
  function stored(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; }
  }
  function store(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
  }
  function showScore() {
    const s = stored('imp-score', { solved: 0, clean: 0 });
    $('#score').textContent = s.solved ? ui().score(s.solved, s.clean) : '';
  }

  function math(el) {
    if (window.renderMathInElement) {
      window.renderMathInElement(el, {
        delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }],
        throwOnError: false,
      });
    }
  }
  const markScrollable = () => {};

  const axesMode = () => (document.querySelector('input[name="axes"]:checked') || {}).value || 'lin';
  const figure = (c, ax, ann, mode = axesMode()) => `<div class="fig">${P.schematic(c)}</div><div class="fig gwrap">${P.graph(c, ax, mode, { ann })}</div>`;
  const and = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} ${L('and', 'und')} ${xs[xs.length - 1]}`);
  const list = (items) => `<ul>${items.map((x) => `<li>${x}</li>`).join('')}</ul>`;
  const circuitName = (c) => P.name(c);
  const starsOf = (d) => `<span class="stars" role="img" aria-label="${ui().stars(d)}" title="${ui().stars(d)}">${'★'.repeat(d)}${'☆'.repeat(5 - d)}</span>`;

  // ---------------------------------------------------------------- matching (match.js)
  // The four options of a matching exercise, curves or (inverse) circuits: the ones that do not fit
  // the answers so far (keys of the questions) faded; with pick, as radio buttons; marks: labels on
  // the right curve.
  // A curve: with the level R and ω₀ where the circuit shown has them; the curve given in the
  // inverse has neither, which would tell whether there is a resistor or a resonance.
  const sketchOf = (e, id, o, label, marks) => P.sketch(M.circuit(id, e.q), o.mode || axesMode(), {
    w0: 1, zref: 1, R: !e.inverse && M.NETS[e.net].kind.includes('R') ? 1 : null, noW0: e.inverse || !M.resonant(e.net), marks, label,
  });
  function curves(e, answered, o = {}) {
    const name = e.inverse ? ui().circuit : ui().curve;
    return `<div class="cands${e.inverse ? ' circuits' : ''}"${o.pick ? ` role="radiogroup" aria-label="${e.inverse ? ui().whichCircuit : ui().whichCurve}"` : ''}>${e.cands.map((id, k) => {
      const tag = o.pick ? 'label' : 'div', cls = `cand${M.fits(e, k, answered) ? '' : ' out'}`;
      const svg = e.inverse ? P.schematic(M.circuit(id, e.q)) : sketchOf(e, id, o, name(M.letter(k)), o.marks && k === e.right ? M.marks(id) : null);
      return `<${tag} class="${cls}" data-k="${k}">${o.pick ? `<input type="radio" name="cand" value="${k}">` : ''}<span class="letter">${M.letter(k)}</span>${svg}</${tag}>`;
    }).join('')}</div>`;
  }
  // the circuit (or the curve) given, and the options
  const given = (e, o = {}) => (e.inverse ? `<div class="fig curve-big">${sketchOf(e, e.net, o, L('The curve', 'Die Kurve'), o.marks ? M.marks(e.net) : null)}</div>` : `<div class="fig">${P.schematic(M.circuit(e.net, e.q))}</div>`);
  const matchFigure = (e, answered, o = {}) => `${given(e, o)}<div class="fig cands-wrap">${curves(e, answered, o)}</div>`;
  // the questions answered right so far
  const answeredOf = () => ex.items.filter((it) => Identify.right(it, st.ident)).map((it) => it.key);
  const matchSolution = (e) => { const s = M.solution(e); return s.steps.map((x) => `<h4>${x.title}</h4><p>${x.text}</p>`).join('') + `<p>${s.verdict}</p><ul>${s.others.map((x) => `<li>${x}</li>`).join('')}</ul>`; };

  function renderMatch() {
    $('#title').innerHTML = `${ex.inverse ? ui().whichCircuit : ui().whichCurve} ${starsOf(ex.difficulty)}`;
    $('#prompt').innerHTML = ex.inverse ? ui().inversePrompt : ui().matchPrompt;
    $('#fields').innerHTML = `<div id="ident"></div><p class="match-head">${ex.inverse ? ui().thenChooseCircuit : ui().thenChoose}</p><div id="cands"></div><p id="cand-fb" class="ident-fb bad" aria-live="polite"></p>`;
  }
  // the questions and the curves, keeping the curve chosen
  function drawMatch() {
    const sel = document.querySelector('input[name="cand"]:checked');
    // the circuit given, or in the inverse the curve (redrawn when the axes change)
    $('#schematic').outerHTML = given(ex).replace('class="fig', 'id="schematic" class="fig');
    $('#ident').innerHTML = Identify.html(ex.items, st.ident, st.revealed);
    $('#cands').innerHTML = curves(ex, st.revealed ? M.phases(ex.net) : answeredOf(), { pick: true });
    if (sel) document.querySelector(`input[name="cand"][value="${sel.value}"]`).checked = true;
    if (st.checked && st.pick != null) matchFeedback();
  }
  // Marks the curve chosen; true if right, null if none is chosen.
  function matchFeedback() {
    const sel = document.querySelector('input[name="cand"]:checked');
    document.querySelectorAll('.cand').forEach((el) => el.classList.remove('ok', 'bad'));
    $('#cand-fb').innerHTML = '';
    if (!sel) return null;
    const k = Number(sel.value), ok = k === ex.right;
    st.pick = k;
    sel.closest('.cand').classList.add(ok ? 'ok' : 'bad');
    if (!ok) $('#cand-fb').innerHTML = M.mismatch(ex, k);
    return ok;
  }

  // ---------------------------------------------------------------- hints and solution
  // From the worked analysis (generator.js): what the graph does → which feature gives which
  // value → the formulas → the readings to check.
  function hints() {
    const an = ex.an, ks = I.UNKNOWNS[ex.c.kind];
    return [
      `${I.shape(ex.c)} ${an.intro}`,
      L('Which feature of the graph gives which value:', 'Welches Merkmal des Graphen liefert welchen Wert:') +
        list(ks.map((k) => L(`<i>${k}</i>: ${an.plan[k]}`, `<i>${k}</i> folgt aus ${an.plan[k]}`))),
      L('Formulas:', 'Formeln:') + list(ks.map((k) => `$${an.formulas[k]}$`)) +
        L('The probe shows the slope of the tangent in Ω·s; since ω is in rad/s, 1 Ω·s = 1 H.', 'Die Sonde zeigt die Steigung der Tangente in Ω·s; da ω in rad/s gemessen wird, ist 1 Ω·s = 1 H.'),
      L('Readings to check yours against:', 'Ablesungen zum Vergleich mit deinen:') + list(ks.map((k) => `<i>${k}</i>: ${an.readings[k]}`)),
    ];
  }

  function results(e = ex) {
    const ks = I.UNKNOWNS[e.c.kind];
    const unit = { R: 'ohm', L: 'H', C: 'F' };
    const est = ks.map((k) => `<i>${k}</i> ≈ ${I.H(e.an.est[k], unit[k])}`).join(', ');
    const exact = ks.map((k) => `<i>${k}</i> = ${I.H(e.c[k], unit[k])}`).join(', ');
    return L(`Read from the graph: ${est}. The graph was drawn with ${exact}.`, `Am Graphen abgelesen: ${est}. Gezeichnet wurde der Graph mit ${exact}.`);
  }
  const solutionSteps = (e) => `<p>${e.an.intro}</p>` + e.an.steps.map((s) => `<h4>${s.title}</h4><p>${s.text}</p>`).join('');

  // ---------------------------------------------------------------- exercise lifecycle
  const newSeed = () => 1 + Math.floor(Math.random() * 999999);

  // Practice comes back more often to the types of exercise that were hard (shared practice.js).
  // (imp2: the topics were regrouped, so practice starts afresh rather than in the wrong topic)
  const PRACTICE = 'imp2', typeOf = (e) => (e.match ? `${e.inverse ? 'inv' : 'match'}-${e.net}` : `${e.c.kind}-${e.c.conn}`);
  const finish = () => { if (ex && st) Practice.finish(PRACTICE, typeOf(ex), st); };

  function open(exercise) {
    finish(); // the student moves on
    ex = exercise;
    prepare(ex);
    st = { tries: 0, hints: 0, solved: false, revealed: false, checked: false, status: null, ident: {}, pick: null };
    const hash = `#${ex.id}`;
    if (location.hash !== hash) history.replaceState(null, '', hash);
    render();
    topics.shown(ex);
  }

  // the hints, and for a matching exercise its questions, in the current language
  function prepare(e) {
    if (e.match) { e.items = M.items(e); e.hints = M.hints(e); } else e.hints = hints();
  }

  // A new exercise of the topic chosen (topics.js), of another kind than the current one if possible.
  function fresh() { open(topics.next(ex)); }
  // the same exercise again (e.g. in the other language); links of earlier versions name a level
  const again = (e) => topics.parse(e.id) || I.generate(e.id.split('-')[0], Number(e.id.split('-')[1]));
  // an exercise of a kind of circuit: 'RL-series' and so on
  const ofType = (type, seed) => {
    if (type.startsWith('match-')) return M.generate(type.slice(6), seed);
    if (type.startsWith('inv-')) return M.generate(type.slice(4), seed, true);
    const [kind, conn] = type.split('-');
    return I.generate(`${conn} ${kind}`, seed);
  };

  // Narrow screens get a smaller drawing; redraw when that changes.
  const narrow = () => document.querySelector('main').clientWidth < 600;
  function relayout() {
    if ((P.W < 640) === narrow()) return;
    P.setNarrow(narrow());
    if (ex) drawGraph();
    if (ex && st.revealed) drawSolution();
    if (tutor.shown()) tutor.refresh();
  }

  function drawGraph() {
    // a matching exercise has its curves instead of the graph with the probe
    for (const el of ['#graph', '#readout']) $(el).hidden = !!ex.match;
    if (ex.match) { $('#graph').innerHTML = ''; $('#pins').hidden = true; drawMatch(); return; }
    $('#graph').innerHTML = P.graph(ex.c, ex.ax, axesMode());
    probe.draw();
  }

  function render() {
    if (ex.match) {
      probe.reset();
      renderMatch();
      drawGraph(); // the questions and the curves
      finishRender();
      return;
    }
    const c = ex.c, ks = I.UNKNOWNS[c.kind];
    $('#title').innerHTML = `${circuitName(c)} ${starsOf(ex.difficulty)}`;
    $('#prompt').innerHTML = L(`The graph shows the impedance <i>Z</i> of the circuit against the angular frequency <i>ω</i>. Find ${and(ks.map((k) => `<i>${k}</i>`))} from the features of the graph and choose the matching values.`,
      `Der Graph zeigt die Impedanz <i>Z</i> der Schaltung gegen die Kreisfrequenz <i>ω</i>. Bestimme ${and(ks.map((k) => `<i>${k}</i>`))} aus den Merkmalen des Graphen und wähle die passenden Werte.`);
    $('#schematic').className = 'fig'; // after a curve → circuit exercise, it held the curve
    $('#schematic').innerHTML = P.schematic(c);
    probe.reset();
    drawGraph();
    $('#fields').innerHTML = ex.fields.map((f) => `
      <div class="field" data-key="${f.key}">
        <span class="sym" id="sym-${f.key}"><i>${f.key}</i>&nbsp;=</span>
        <div class="opts" role="radiogroup" aria-labelledby="sym-${f.key}">${f.options.map((o, i) => `
          <label><input type="radio" name="opt-${f.key}" value="${i}"><span>${o.label}</span></label>`).join('')}
        </div>
        <span class="fb" aria-live="polite"></span>
      </div>`).join('');
    finishRender();
  }
  function finishRender() {
    $('#hint-list').innerHTML = '';
    $('#hints').hidden = true;
    $('#solution').hidden = true;
    showStatus(null);
    updateButtons();
  }

  // solved now, or solved before (its solution can be looked at again)
  const canReveal = () => st.solved || Practice.solvedBefore(PRACTICE, ex.id) || st.tries >= MAX_TRIES || st.hints >= ex.hints.length;

  function updateButtons() {
    const left = ex.hints.length - st.hints;
    const hb = $('#hint');
    hb.disabled = left === 0 || st.revealed;
    hb.textContent = left ? ui().hint(left) : ui().noHints;
    const rb = $('#reveal');
    rb.disabled = !canReveal() || st.revealed;
    rb.title = canReveal() ? '' : ui().unlocks(MAX_TRIES);
    $('#reveal-note').hidden = canReveal() || st.revealed;
    // once everything is right, Check becomes New exercise, like the button at the top
    $('#check').textContent = st.solved ? ui().new : ui().check;
    $('#check').classList.toggle('primary', !st.solved);
    $('#check').classList.toggle('new-btn', st.solved);
  }

  // Marks every choice; true if all are right, null if some are missing.
  function feedback() {
    let allOk = true, anyEmpty = false;
    for (const f of ex.fields) {
      const row = document.querySelector(`.field[data-key="${f.key}"]`);
      const sel = row.querySelector('input:checked');
      const o = sel && f.options[Number(sel.value)];
      if (!o) anyEmpty = true;
      row.className = `field${o ? (o.ok ? ' ok' : ' bad') : ''}`;
      row.querySelector('.fb').innerHTML = o ? (o.ok ? ui().correct : o.why) : '';
      if (!o || !o.ok) allOk = false;
    }
    return allOk ? true : anyEmpty ? null : false;
  }

  // The status line: null (none), 'fill', 'ok' or 'bad'.
  function showStatus(kind) {
    const el = $('#status');
    if (st) st.status = kind;
    el.className = 'status' + (kind === 'ok' ? ' ok' : kind === 'bad' ? ' bad' : '');
    el.textContent = !kind ? '' : kind === 'fill' ? (ex && ex.match ? (ex.inverse ? ui().chooseCircuit : ui().chooseCurve) : ui().choose) : kind === 'ident' ? ui().idFirst
      : kind === 'ok' ? (st.revealed ? ui().ok : ui().okWell) + (st.advance ? ` ${st.advance}` : '')
        : ui().notYet(st.tries) + (!canReveal() ? ui().tryAgain : ui().canReveal);
  }

  function check(evt) {
    evt.preventDefault();
    if (st.solved) { fresh(); return; } // the button reads New exercise
    if (ex.match && !Identify.ok(ex.items, st.ident)) { showStatus('ident'); return; }
    const r = ex.match ? matchFeedback() : feedback();
    st.checked = true;
    if (r === null) { showStatus('fill'); return; }
    st.tries++;
    if (r) {
      if (!st.revealed) {
        const s = stored('imp-score', { solved: 0, clean: 0 });
        s.solved++;
        if (st.tries === 1 && st.hints === 0) s.clean++;
        store('imp-score', s);
        showScore();
      }
      st.solved = true;
      Practice.markSolved(PRACTICE, ex.id);
      finish();
      st.advance = topics.solved(st, ex);
      showStatus('ok');
    } else showStatus('bad');
    updateButtons();
  }

  function showHints() {
    $('#hint-list').innerHTML = ex.hints.slice(0, st.hints).map((h) => `<li>${h}</li>`).join('');
    $('#hints').hidden = !st.hints;
    math($('#hints'));
  }
  function hint() {
    if (st.hints >= ex.hints.length) return;
    st.hints++;
    showHints();
    updateButtons();
    $('#hint-list').lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function drawSolution() {
    $('#sol-figure').innerHTML = ex.match ? matchFigure(ex, M.phases(ex.net), { marks: true }) : figure(ex.c, ex.ax, ex.an.steps.flatMap((s) => s.ann));
  }
  function showSolution() {
    drawSolution();
    $('#sol-steps').innerHTML = ex.match ? matchSolution(ex) : solutionSteps(ex);
    $('#sol-short').innerHTML = !ex.match ? results() : ex.inverse ? L(`The circuit is ${M.letter(ex.right)}.`, `Die Schaltung ist ${M.letter(ex.right)}.`) : L(`The curve is ${M.letter(ex.right)}.`, `Die Kurve ist ${M.letter(ex.right)}.`);
    $('#solution').hidden = false;
    math($('#solution'));
  }
  function reveal() {
    if (!canReveal()) return;
    st.revealed = true;
    finish();
    if (ex.match) drawMatch(); // the questions shown as answered
    showSolution();
    updateButtons();
    $('#solution').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---------------------------------------------------------------- tutor
  // Tutor examples: an overview frame, then one frame per step of the analysis.
  function lesson(e) {
    const c = e.circuit, ax = I.axesFor(c);
    return {
      name: e.name[Lang.get()], idea: e.idea[Lang.get()],
      frames: () => {
        const an = I.analysis(c, ax);
        const first = {
          text: `<div class="step-rule">${L('The circuit', 'Die Schaltung')}</div><p>${an.intro}</p><p>${I.shape(c)}</p>`,
          get figure() { return figure(c, ax, []); },
        };
        return [first, ...an.steps.map((s) => ({
          text: `<div class="step-rule">${s.title}</div><p>${s.text}</p>`,
          get figure() { return figure(c, ax, s.ann); },
        }))];
      },
    };
  }
  // The matching example: the curves, then one frame per question, each fading the curves it
  // rules out, and the curve that is left.
  function matchLesson(d) {
    const e = { ...d.match, match: true, right: d.match.cands.indexOf(d.match.net) }, ks = M.phases(e.net), inv = !!e.inverse;
    const opt = (j) => (inv ? L(`circuit ${M.letter(j)}`, `Schaltung ${M.letter(j)}`) : L(`curve ${M.letter(j)}`, `Kurve ${M.letter(j)}`));
    const title = { lo: L('Small ω', 'Kleines ω'), hi: L('Large ω', 'Grosses ω'), res: L('At the resonance frequency', 'Bei der Resonanzfrequenz') };
    const ruled = (k) => e.cands.map((x, j) => j).filter((j) => M.fits(e, j, ks.slice(0, ks.indexOf(k))) && !M.fits(e, j, ks.slice(0, ks.indexOf(k) + 1)));
    const out = (js) => (js.length ? L(`This rules out ${M.and(js.map(opt))}.`, `Das schliesst ${M.and(js.map(opt))} aus.`) : '');
    return {
      name: d.name[Lang.get()], idea: d.idea[Lang.get()],
      frames: () => [
        { text: `<div class="step-rule">${L('The question', 'Die Frage')}</div><p>${inv
          ? L('Which of the four circuits has this impedance curve? Instead of guessing, read the curve at both ends and at its minimum or maximum, and ask what each tells you about the circuit; each answer rules out circuits that do not fit.', 'Welche der vier Schaltungen hat diese Impedanzkurve? Statt zu raten, liest du die Kurve an beiden Enden und bei ihrem Minimum oder Maximum ab und fragst, was das über die Schaltung verrät; jede Antwort schliesst Schaltungen aus, die nicht passen.')
          : L('Which of the four curves shows the impedance of this circuit? Instead of guessing, ask three questions about the curve; each one rules out curves that do not fit.', 'Welche der vier Kurven zeigt die Impedanz dieser Schaltung? Statt zu raten, stellst du drei Fragen an die Kurve; jede schliesst Kurven aus, die nicht passen.')}</p>`,
          get figure() { return matchFigure(e, []); } },
        ...ks.map((k, i) => ({ text: `<div class="step-rule">${title[k]}</div><p>${inv ? M.inverseText(k, M.features(e.net)[k]).value : M.reason(e.net, k)}</p><p>${out(ruled(k))}</p>`,
          get figure() { return matchFigure(e, ks.slice(0, i + 1)); } })),
        { text: `<div class="step-rule">${L('The curve', 'Die Kurve')}</div><p>${M.solution(e).verdict} ${inv ? L('Backwards, the same rules:', 'Rückwärts gelten dieselben Regeln:') : ''} ${L('The rules in short: for ω → 0 a coil is a wire and a capacitor a gap, for ω → ∞ the other way round; at ω₀ coil and capacitor in series act like a wire, in parallel like a gap. A gap in series blocks (Z → ∞), a wire in parallel short-circuits (Z → 0).', 'Die Regeln kurz: Für ω → 0 ist eine Spule ein Draht und ein Kondensator ein Unterbruch, für ω → ∞ umgekehrt; bei ω₀ wirken Spule und Kondensator in Serie wie ein Draht, parallel wie ein Unterbruch. Ein Unterbruch in Serie sperrt (Z → ∞), ein Draht parallel schliesst kurz (Z → 0).')}</p>`,
          get figure() { return matchFigure(e, ks, { marks: true }); } },
      ],
    };
  }
  const lessons = () => window.Lessons.EXAMPLES.map((d) => ({ ...(d.match ? matchLesson(d) : lesson(d)), also: topics.also(d.topic) }));

  // ---------------------------------------------------------------- arcade
  // Each question asks for one of R, L, C with the four options of the practice exercise. The
  // graph (linear axes, no probe) shows the helper lines of the step that finds the value, but no
  // numbers: the value still has to be read off.
  const KINDS = Object.keys(I.DIFFICULTY);
  function annFor(an, key) {
    const has = (s, f) => s.ann.some(f);
    if (key === 'R') {
      const s = an.steps.find((x) => has(x, (a) => (a.t === 'pt' || a.t === 'h') && /R/.test(a.label || '') && !/√2/.test(a.label || '')));
      return s ? s.ann.filter((a) => a.t === 'pt' || a.t === 'h') : [];
    }
    if (key === 'L') {
      const s = an.steps.find((x) => has(x, (a) => a.t === 'tan' && a.label));
      return s ? s.ann.filter((a) => a.t === 'tan') : [];
    }
    const s = an.steps[an.steps.length - 1];
    return s.ann;
  }
  // Matching questions (kinds m2 to m4, of difficulty 2 to 4: two elements, RLC and LC, R with an
  // LC pair): the four curves are the options; a wrong one with series and parallel swapped, or
  // coil and capacitor, is a misconception.
  // Backwards (kinds i3 to i5: the curve is given, the options are circuits) one level harder.
  function matchQuestion(kind, seed) {
    const inv = kind[0] === 'i', level = Number(kind.slice(1)) - (inv ? 2 : 1), nets = M.IDS.filter((id) => M.NETS[id].level === level);
    const e = M.generate(nets[seed % nets.length], seed, inv), num = (k) => k + 1;
    return {
      title: inv ? ui().whichCircuit : circuitName(M.circuit(e.net, e.q)),
      text: `<p>${inv ? L('The curve shows <i>Z</i> against <i>ω</i>; the four options are circuits.', 'Die Kurve zeigt <i>Z</i> gegen <i>ω</i>; die vier Antworten sind Schaltungen.') : L('The four options are sketches of <i>Z</i> against <i>ω</i>.', 'Die vier Antworten sind Skizzen von <i>Z</i> gegen <i>ω</i>.')}</p>`,
      figure: given(e, { mode: 'lin' }),
      ask: inv ? L('Which circuit has this curve?', 'Welche Schaltung hat diese Kurve?') : L('Which curve belongs to this circuit?', 'Welche Kurve gehört zu dieser Schaltung?'),
      options: e.cands.map((id, k) => ({
        html: inv ? P.schematic(M.circuit(id, e.q)) : sketchOf(e, id, { mode: 'lin' }, ui().curve(k + 1), null),
        correct: k === e.right, flag: id === M.dual(e.net) ? 'dual' : id === M.swapLC(e.net) ? 'swap' : 'other', why: k === e.right ? '' : M.mismatch(e, k, num),
      })),
      key: `${e.net}|${e.cands.join(',')}`,
      explain: () => {
        const sol = M.solution(e);
        return `<div class="figs">${matchFigure(e, M.phases(e.net), { marks: true, mode: 'lin' })}</div><div class="steps">${sol.steps.map((x) => `<h4>${x.title}</h4><p>${x.text}</p>`).join('')}` +
          `<p>${inv ? L(`The circuit is option ${e.right + 1}.`, `Die Schaltung ist Antwort ${e.right + 1}.`) : L(`The curve is option ${e.right + 1}.`, `Die Kurve ist Antwort ${e.right + 1}.`)}</p></div>`;
      },
    };
  }
  function arcadeQuestion(kind, seed) {
    if (kind[0] === 'm' || kind[0] === 'i') return matchQuestion(kind, seed);
    const d = Number(kind.slice(1)), kinds = KINDS.filter((k) => I.DIFFICULTY[k] === d);
    const e = I.generate(kinds[seed % kinds.length], seed);
    const f = e.fields[Math.floor(seed / kinds.length) % e.fields.length];
    const quantity = { R: L('the resistance <i>R</i>', 'den Widerstand <i>R</i>'), L: L('the inductance <i>L</i>', 'die Induktivität <i>L</i>'), C: L('the capacitance <i>C</i>', 'die Kapazität <i>C</i>') }[f.key];
    return {
      title: circuitName(e.c),
      text: `<p>${L('The graph shows the impedance <i>Z</i> against the angular frequency <i>ω</i>, with helper lines.', 'Der Graph zeigt die Impedanz <i>Z</i> gegen die Kreisfrequenz <i>ω</i>, mit Hilfslinien.')}</p>`,
      figure: figure(e.c, e.ax, annFor(e.an, f.key), 'lin'),
      ask: L(`Read off ${quantity}.`, `Bestimme ${quantity}.`),
      options: f.options.map((o) => ({ html: o.label, correct: !!o.ok, flag: o.tag, why: o.why })),
      explain: () => `<div class="figs">${figure(e.c, e.ax, e.an.steps.flatMap((s) => s.ann), 'lin')}</div><div class="steps">${solutionSteps(e)}<p class="short">${results(e)}</p></div>`,
    };
  }
  const arcadeSource = {
    id: 'imp',
    kinds: [1, 2, 3, 4, 5].map((d) => ({ id: `d${d}`, difficulty: d })).concat([2, 3, 4].map((d) => ({ id: `m${d}`, difficulty: d })), [3, 4, 5].map((d) => ({ id: `i${d}`, difficulty: d }))),
    question: arcadeQuestion,
    concept: { '2pi': 'twopi', inverse: 'inverse', secant: 'tangent', tangent: 'tangent', chord: 'tangent', corner: 'corner', sqrt2: 'corner', 'corner-z': 'corner', side: 'corner', reactance: 'resonance', square: 'square', dual: 'serpar', swap: 'coilcap' },
    concepts: () => ({
      twopi: L('a 2π too many', 'ein 2π zu viel'),
      inverse: L('the slope upside down', 'die Steigung als Kehrwert'),
      tangent: L('the wrong line for the slope', 'die falsche Gerade für die Steigung'),
      corner: L('Z at the corner taken for R', 'Z bei der Grenzfrequenz für R gehalten'),
      resonance: L('the reactance at resonance taken for R', 'der Blindwiderstand bei Resonanz für R gehalten'),
      square: L('the square in ω₀ = 1/√(LC) forgotten', 'das Quadrat in ω₀ = 1/√(LC) vergessen'),
      serpar: L('series and parallel swapped', 'Serie und parallel vertauscht'),
      coilcap: L('coil and capacitor swapped', 'Spule und Kondensator vertauscht'),
    }),
    intro: () => ({
      tag: L('Read <i>R</i>, <i>L</i> and <i>C</i> off impedance curves, and match circuits to their curves: as many as you can in <b>5 minutes</b>.', 'Lies <i>R</i>, <i>L</i> und <i>C</i> an Impedanzkurven ab und ordne Schaltungen ihren Kurven zu: so viele wie möglich in <b>5 Minuten</b>.'),
      rule: L('Questions get harder as you go. Read a value off the graph, using the helper lines shown, or pick the curve that belongs to a circuit; choose one of four answers, or press 1–4.',
        'Die Fragen werden nach und nach schwieriger. Lies einen Wert am Graphen ab, mit den gezeigten Hilfslinien, oder wähle die Kurve, die zu einer Schaltung gehört; wähle eine von vier Antworten oder drücke 1–4.'),
      example: L('an extra 2π', 'ein zusätzliches 2π'),
    }),
    // the series RLC example with all its helper lines, and its impedance
    hero: () => {
      const c = window.Lessons.EXAMPLES.find((e) => e.circuit && e.circuit.kind === 'RLC' && e.circuit.conn === 'series').circuit, ax = I.axesFor(c), an = I.analysis(c, ax);
      return `<div class="figs"><div class="fig gwrap">${P.graph(c, ax, 'lin', { ann: an.steps.flatMap((s) => s.ann) })}</div></div>` +
        '<p class="ar-law">$Z = \\sqrt{R^2 + \\left(\\omega L - \\frac{1}{\\omega C}\\right)^2}$</p>';
    },
  };

  // ---------------------------------------------------------------- language
  function applyStatic() {
    document.title = ui().title;
    Lang.apply(ui());
    if (topics) topics.relabel();
  }

  // The same exercise in the other language, with the choices, feedback, hints and solution kept.
  function switchLang() {
    applyStatic();
    showScore();
    if (ex) {
      const fields = ex.fields || [];
      const chosen = fields.map((f) => { const r = document.querySelector(`input[name="opt-${f.key}"]:checked`); return r ? r.value : null; });
      const pick = document.querySelector('input[name="cand"]:checked');
      const keep = st, status = st.status; // render() clears the status line
      ex = again(ex);
      prepare(ex);
      render();
      st = keep;
      ex.fields && ex.fields.forEach((f, k) => { if (chosen[k] != null) document.querySelector(`input[name="opt-${f.key}"][value="${chosen[k]}"]`).checked = true; });
      if (ex.match) {
        drawMatch();
        if (pick) document.querySelector(`input[name="cand"][value="${pick.value}"]`).checked = true;
        if (st.checked) matchFeedback();
      } else if (st.checked) feedback();
      showStatus(status);
      showHints();
      if (st.revealed) showSolution();
      if ($('#task').hidden) { $('#hints').hidden = true; $('#solution').hidden = true; }
      updateButtons();
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
    store('imp-mode', m);
    document.querySelectorAll('.practice').forEach((el) => { el.hidden = m !== 'practice'; });
    $('#axes').hidden = m === 'arcade';
    $('#tutor').hidden = m !== 'tutor';
    $('#arcade').hidden = m !== 'arcade';
    if (m !== 'practice') { $('#hints').hidden = true; $('#solution').hidden = true; }
    if (m !== 'arcade') arcade.stop();
  }
  function practise() {
    setMode('practice');
    if (ex) { history.replaceState(null, '', `#${ex.id}`); $('#hints').hidden = !st.hints; $('#solution').hidden = !st.revealed; } else fresh();
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
    const te = topics.parse(h);
    if (te) {
      setMode('practice');
      if (!ex || ex.id !== h) open(te);
      return true;
    }
    m = h.match(/^(easy|medium|hard|mixed)-(\d+)$/);
    if (m) {
      setMode('practice');
      if (!ex || ex.id !== h) open(I.generate(m[1], Number(m[2])));
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------- init
  function init() {
    Lang.init(); // see lang.js
    document.querySelector('main').insertAdjacentHTML('beforeend', Arcade.HTML);
    applyStatic();
    Lang.wire(switchLang);
    document.querySelector(`input[name="axes"][value="${stored('imp-axes', 'lin')}"]`).checked = true;

    probe = window.createProbe($('#graph'), () => ({ c: ex.c, ax: ex.ax, mode: axesMode() }), $('#readout'), $('#pins'));
    topics = window.Topics.create({
      app: PRACTICE,
      topics: window.Lessons.TOPICS.map((t) => ({
        name: () => t.name[Lang.get()],
        stages: t.stages.map((st) => ({ name: () => st.name[Lang.get()], types: st.types })),
        // the worked example of the step (or of the topic, for all steps)
        example: (k) => { const i = t.stages[k] && t.stages[k].example != null ? t.stages[k].example : t.example; return { i, name: () => window.Lessons.EXAMPLES[i].name[Lang.get()] }; },
      })),
      make: ofType, typeOf,
      onChange: fresh,
      tutor: (i) => { setMode('tutor'); tutor.open(i); },
    });
    topics.mount($('#levels'));
    $('#axes').addEventListener('change', () => {
      store('imp-axes', axesMode());
      if (ex) drawGraph();
      if (ex && st.revealed) drawSolution();
      if (tutor.shown()) tutor.refresh();
    });
    $('#new').addEventListener('click', fresh);
    $('#answers').addEventListener('submit', check);
    // A new choice clears the feedback on the old one.
    $('#fields').addEventListener('change', (evt) => {
      if (evt.target.name === 'cand') { document.querySelectorAll('.cand').forEach((el) => el.classList.remove('ok', 'bad')); $('#cand-fb').innerHTML = ''; return; }
      const row = evt.target.closest('.field');
      if (!row) return;
      row.className = 'field';
      row.querySelector('.fb').textContent = '';
    });
    // the questions of a matching exercise: a right answer fades the curves that do not fit, a
    // wrong one counts as an attempt
    Identify.attach($('#fields'), () => (ex && ex.match ? ex.items : []), () => st.ident, (right) => {
      if (right) drawMatch(); else { st.tries++; updateButtons(); }
    });
    $('#hint').addEventListener('click', hint);
    $('#reveal').addEventListener('click', reveal);
    window.addEventListener('hashchange', fromHash);
    window.addEventListener('resize', relayout);
    P.setNarrow(narrow());

    tutor = window.createTutor(lessons(), { after: () => math($('#tutor')), done: practise, practise: (i) => {
      // the step of this example, where it has one
      const t = window.Lessons.EXAMPLES[i].topic, k = window.Lessons.TOPICS[t].stages.findIndex((st) => st.example === i);
      topics.go(t, k >= 0 ? k : null); setMode('practice'); fresh();
    } });
    arcade = Arcade.create(arcadeSource, { math, markScrollable, stored, store });
    $('#modes').addEventListener('change', () => {
      if (mode() === 'tutor') { setMode('tutor'); tutor.open(tutor.current()); } else if (mode() === 'arcade') play(); else practise();
    });
    showScore();
    if (fromHash()) return;
    // First visit: start with the first worked example.
    const last = stored('imp-mode', 'tutor');
    if (last === 'tutor') { setMode('tutor'); tutor.open(0); } else if (last === 'arcade') play(); else { setMode('practice'); fresh(); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
