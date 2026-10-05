(function () {
  'use strict';

  const I = window.Impedance, P = window.Plot;
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
    },
  };
  const ui = () => UI[Lang.get()];

  let ex = null, st = null, probe = null, tutor = null, arcade = null;

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
  const circuitName = (c) => (c.conn === 'series' ? L(`Series ${c.kind} circuit`, `${c.kind}-Serieschaltung`) : L(`Parallel ${c.kind} circuit`, `${c.kind}-Parallelschaltung`));
  const starsOf = (d) => `<span class="stars" role="img" aria-label="${ui().stars(d)}" title="${ui().stars(d)}">${'★'.repeat(d)}${'☆'.repeat(5 - d)}</span>`;

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
  const level = () => (document.querySelector('input[name="level"]:checked') || {}).value || 'mixed';

  // Practice comes back more often to the types of exercise that were hard (shared practice.js).
  const PRACTICE = 'imp', typeOf = (e) => `${e.c.kind}-${e.c.conn}`;
  const finish = () => { if (ex && st) Practice.finish(PRACTICE, typeOf(ex), st); };

  function open(exercise) {
    finish(); // the student moves on
    ex = exercise;
    ex.hints = hints();
    st = { tries: 0, hints: 0, solved: false, revealed: false, checked: false, status: null };
    const hash = `#${ex.id}`;
    if (location.hash !== hash) history.replaceState(null, '', hash);
    render();
  }

  function fresh() { open(Practice.next(PRACTICE, (s) => I.generate(level(), s), typeOf, ex && typeOf(ex))); }

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
    $('#graph').innerHTML = P.graph(ex.c, ex.ax, axesMode());
    probe.draw();
  }

  function render() {
    const c = ex.c, ks = I.UNKNOWNS[c.kind];
    $('#title').innerHTML = `${circuitName(c)} ${starsOf(ex.difficulty)}`;
    $('#prompt').innerHTML = L(`The graph shows the impedance <i>Z</i> of the circuit against the angular frequency <i>ω</i>. Find ${and(ks.map((k) => `<i>${k}</i>`))} from the features of the graph and choose the matching values.`,
      `Der Graph zeigt die Impedanz <i>Z</i> der Schaltung gegen die Kreisfrequenz <i>ω</i>. Bestimme ${and(ks.map((k) => `<i>${k}</i>`))} aus den Merkmalen des Graphen und wähle die passenden Werte.`);
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
    $('#hint-list').innerHTML = '';
    $('#hints').hidden = true;
    $('#solution').hidden = true;
    showStatus(null);
    updateButtons();
  }

  const canReveal = () => st.solved || st.tries >= MAX_TRIES || st.hints >= ex.hints.length;

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
    el.textContent = !kind ? '' : kind === 'fill' ? ui().choose
      : kind === 'ok' ? (st.revealed ? ui().ok : ui().okWell)
        : ui().notYet(st.tries) + (!canReveal() ? ui().tryAgain : ui().canReveal);
  }

  function check(evt) {
    evt.preventDefault();
    if (st.solved) { fresh(); return; } // the button reads New exercise
    const r = feedback();
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
      finish();
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
    $('#sol-figure').innerHTML = figure(ex.c, ex.ax, ex.an.steps.flatMap((s) => s.ann));
  }
  function showSolution() {
    drawSolution();
    $('#sol-steps').innerHTML = solutionSteps(ex);
    $('#sol-short').innerHTML = results();
    $('#solution').hidden = false;
    math($('#solution'));
  }
  function reveal() {
    if (!canReveal()) return;
    st.revealed = true;
    finish();
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
  const lessons = () => window.Lessons.EXAMPLES.map(lesson);

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
  function arcadeQuestion(kind, seed) {
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
    kinds: [1, 2, 3, 4, 5].map((d) => ({ id: `d${d}`, difficulty: d })),
    question: arcadeQuestion,
    concept: { '2pi': 'twopi', inverse: 'inverse', secant: 'tangent', tangent: 'tangent', chord: 'tangent', corner: 'corner', sqrt2: 'corner', 'corner-z': 'corner', side: 'corner', reactance: 'resonance', square: 'square' },
    concepts: () => ({
      twopi: L('a 2π too many', 'ein 2π zu viel'),
      inverse: L('the slope upside down', 'die Steigung als Kehrwert'),
      tangent: L('the wrong line for the slope', 'die falsche Gerade für die Steigung'),
      corner: L('Z at the corner taken for R', 'Z bei der Grenzfrequenz für R gehalten'),
      resonance: L('the reactance at resonance taken for R', 'der Blindwiderstand bei Resonanz für R gehalten'),
      square: L('the square in ω₀ = 1/√(LC) forgotten', 'das Quadrat in ω₀ = 1/√(LC) vergessen'),
    }),
    intro: () => ({
      tag: L('Read <i>R</i>, <i>L</i> and <i>C</i> off impedance curves: as many as you can in <b>5 minutes</b>.', 'Lies <i>R</i>, <i>L</i> und <i>C</i> an Impedanzkurven ab: so viele wie möglich in <b>5 Minuten</b>.'),
      rule: L('Questions get harder as you go. The graph shows the helper lines you need; read the value off and choose one of four answers, or press 1–4.',
        'Die Fragen werden nach und nach schwieriger. Der Graph zeigt die nötigen Hilfslinien; lies den Wert ab und wähle eine von vier Antworten oder drücke 1–4.'),
      example: L('an extra 2π', 'ein zusätzliches 2π'),
    }),
    // the series RLC example with all its helper lines, and its impedance
    hero: () => {
      const c = window.Lessons.EXAMPLES[4].circuit, ax = I.axesFor(c), an = I.analysis(c, ax);
      return `<div class="figs"><div class="fig gwrap">${P.graph(c, ax, 'lin', { ann: an.steps.flatMap((s) => s.ann) })}</div></div>` +
        '<p class="ar-law">$Z = \\sqrt{R^2 + \\left(\\omega L - \\frac{1}{\\omega C}\\right)^2}$</p>';
    },
  };

  // ---------------------------------------------------------------- language
  function applyStatic() {
    document.title = ui().title;
    Lang.apply(ui());
    let cur = $('#levels').childElementCount ? level() : stored('imp-level', 'mixed');
    if (!ui().levels[cur]) cur = 'mixed';
    $('#levels').innerHTML = Object.entries(ui().levels).map(([k, n]) => `
      <label><input type="radio" name="level" value="${k}"${k === cur ? ' checked' : ''}><span>${n}</span></label>`).join('');
  }

  // The same exercise in the other language, with the choices, feedback, hints and solution kept.
  function switchLang() {
    applyStatic();
    showScore();
    if (ex) {
      const chosen = ex.fields.map((f) => { const r = document.querySelector(`input[name="opt-${f.key}"]:checked`); return r ? r.value : null; });
      const keep = st, [, lv, seed] = ex.id.match(/^(\w+)-(\d+)$/);
      ex = I.generate(lv, Number(seed));
      ex.hints = hints();
      render();
      st = keep;
      ex.fields.forEach((f, k) => { if (chosen[k] != null) document.querySelector(`input[name="opt-${f.key}"][value="${chosen[k]}"]`).checked = true; });
      if (st.checked) feedback();
      showStatus(st.status);
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
    m = h.match(/^(easy|medium|hard|mixed)-(\d+)$/);
    if (m) {
      setMode('practice');
      document.querySelector(`input[name="level"][value="${m[1]}"]`).checked = true;
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
    $('#levels').addEventListener('change', () => { store('imp-level', level()); fresh(); });
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
      const row = evt.target.closest('.field');
      row.className = 'field';
      row.querySelector('.fb').textContent = '';
    });
    $('#hint').addEventListener('click', hint);
    $('#reveal').addEventListener('click', reveal);
    window.addEventListener('hashchange', fromHash);
    window.addEventListener('resize', relayout);
    P.setNarrow(narrow());

    tutor = window.createTutor(lessons(), { after: () => math($('#tutor')), done: practise });
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
