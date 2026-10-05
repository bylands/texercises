(function () {
  'use strict';

  const Lang = window.Lang, Arcade = window.Arcade, L = Lang.L;
  const { LEVELS, generate, tutorial } = window.Switching;
  const { esc, fitText } = window.Circuit;
  const $ = (sel) => document.querySelector(sel);
  const MAX_TRIES = 3;

  // An exercise is { id, title, difficulty, text, situation, fields: [{key, sym, unit, value, abs}],
  // models: per field { wire, zero, same } (the answer under a typical wrong idea), tol,
  // figure(sol, ask), hints: [html], solution: [html], results: html }.

  // ---------------------------------------------------------------- interface texts
  const UI = {
    en: {
      title: 'Switching RL Circuits', mode: 'Mode', difficulty: 'Difficulty', example: 'Example', tutor: 'Tutor', practice: 'Practice', arcade: 'Arcade', new: 'New exercise',
      stars: (d) => `Difficulty: ${d} of 5`,
      tutorNote: 'Use the arrow keys ← → to step through. In the diagram, the parts a step is about are <span class="k-strong">highlighted</span>, the value just found is <span class="k-new">marked</span>, values used are <b>bold</b>, and parts without current are <span class="k-dim">greyed out</span>.',
      check: 'Check', reveal: 'Show solution', hints: 'Hints', solution: 'Solution', results: 'Results',
      solNote: 'The diagram shows the circuit right after switching, with all currents and the induced emf of each coil.',
      revealNote: 'The worked solution unlocks once you have solved the exercise, used all hints or made three attempts.',
      score: (s, c) => `Solved: ${s} · first try without hints: ${c}`,
      hint: (n) => `Hint (${n} left)`, noHints: 'No more hints', unlocks: (n) => `Unlocks after all hints or ${n} attempts`,
      fill: 'Fill in all fields, then check again.',
      ok: 'All correct.', okWell: 'All correct, well done! Compare your approach with the worked solution, or start a new exercise.',
      notYet: (n) => `Not quite yet (attempt ${n}).`, tryAgain: ' Try again, or take a hint.', canReveal: ' You can take a hint or look at the worked solution.',
      number: 'Enter a number', correct: 'Correct', close: 'Close: check your rounding', wrong: 'Not correct',
      size: 'Give the size (a positive number)', sign: 'Wrong sign: check the direction of the current against the arrow',
      tutorBtns: { example: (i, n) => `Example ${i} of ${n}`, back: '← Back', prevEx: '← Previous example', next: 'Next →', nextEx: 'Next example →', done: 'Practise on your own →' },
    },
    de: {
      title: 'Schaltvorgänge mit Spulen', mode: 'Modus', difficulty: 'Schwierigkeit', example: 'Beispiel', tutor: 'Tutor', practice: 'Üben', arcade: 'Arcade', new: 'Neue Aufgabe',
      stars: (d) => `Schwierigkeit: ${d} von 5`,
      tutorNote: 'Mit den Pfeiltasten ← → blätterst du weiter. In der Schaltung sind die Teile, um die es in einem Schritt geht, <span class="k-strong">hervorgehoben</span>, der eben gefundene Wert ist <span class="k-new">markiert</span>, verwendete Werte sind <b>fett</b>, und Teile ohne Strom sind <span class="k-dim">ausgegraut</span>.',
      check: 'Prüfen', reveal: 'Lösung zeigen', hints: 'Tipps', solution: 'Lösung', results: 'Resultate',
      solNote: 'Die Schaltung unmittelbar nach dem Schalten, mit allen Strömen und der induzierten Spannung jeder Spule.',
      revealNote: 'Die ausführliche Lösung wird freigeschaltet, sobald du die Aufgabe gelöst, alle Tipps genutzt oder drei Versuche gemacht hast.',
      score: (s, c) => `Gelöst: ${s} · beim ersten Versuch ohne Tipps: ${c}`,
      hint: (n) => `Tipp (${n} übrig)`, noHints: 'Keine Tipps mehr', unlocks: (n) => `Wird nach allen Tipps oder ${n} Versuchen freigeschaltet`,
      fill: 'Fülle alle Felder aus und prüfe dann nochmals.',
      ok: 'Alles richtig.', okWell: 'Alles richtig, gut gemacht! Vergleiche deinen Lösungsweg mit der ausführlichen Lösung oder starte eine neue Aufgabe.',
      notYet: (n) => `Noch nicht ganz (Versuch ${n}).`, tryAgain: ' Versuche es nochmals, oder nimm einen Tipp.', canReveal: ' Du kannst einen Tipp nehmen oder die ausführliche Lösung anschauen.',
      number: 'Gib eine Zahl ein', correct: 'Richtig', close: 'Knapp daneben: Prüfe deine Rundung', wrong: 'Nicht richtig',
      size: 'Gib den Betrag an (eine positive Zahl)', sign: 'Falsches Vorzeichen: Vergleiche die Richtung des Stroms mit dem Pfeil',
      tutorBtns: { example: (i, n) => `Beispiel ${i} von ${n}`, back: '← Zurück', prevEx: '← Vorheriges Beispiel', next: 'Weiter →', nextEx: 'Nächstes Beispiel →', done: 'Selbst üben →' },
    },
  };
  const ui = () => UI[Lang.get()];

  // What a wrong value suggests: the answer under a typical wrong idea (see models() in
  // generator.js).
  const WHY = {
    wire: () => L('That is the value long after switching: right after it, the inductor does not act like a wire yet.', 'Das ist der Wert lange nach dem Schalten: Unmittelbar danach wirkt die Spule noch nicht wie ein Draht.'),
    zero: () => L('Right after switching, the inductor still carries its old current: it does not drop to zero (or stay zero).', 'Unmittelbar nach dem Schalten führt die Spule noch ihren alten Strom: Er fällt nicht auf null (und bleibt nicht null).'),
    same: () => L('That is the value before switching. Only the inductor current is sure to stay the same; the other currents can jump.', 'Das ist der Wert vor dem Schalten. Nur der Spulenstrom bleibt sicher gleich; die anderen Ströme können springen.'),
    sign: () => L('Wrong direction: compare the direction of the current with the arrow.', 'Falsche Richtung: Vergleiche die Richtung des Stroms mit dem Pfeil.'),
  };

  let ex = null, st = null, tutor = null, arcade = null;

  // ---------------------------------------------------------------- persistence
  function stored(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; }
  }
  function store(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
  }
  function showScore() {
    const s = stored('rl-score', { solved: 0, clean: 0 });
    $('#score').textContent = s.solved ? ui().score(s.solved, s.clean) : '';
  }

  function math(el) {
    if (window.renderMathInElement) {
      window.renderMathInElement(el, {
        delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }],
        throwOnError: false,
      });
    }
    // circuit diagrams fit their labels to the rendered text
    el.querySelectorAll('svg.circuit').forEach((svg) => fitText(svg));
  }

  // Wide drawings scroll horizontally on small screens.
  function markScrollable() {
    document.querySelectorAll('.fig').forEach((fig) => {
      fig.classList.toggle('scrolls', fig.scrollWidth > fig.clientWidth + 1);
    });
  }

  // ---------------------------------------------------------------- input and feedback
  function parse(s) {
    s = s.trim().replace(/,/g, '.').replace(/[−–—‒]/g, '-').replace(/[^\d.)]+$/, '').trim();
    const m = s.match(/^([-+]?\d*\.?\d+(?:e[-+]?\d+)?)(?:\s*\/\s*(\d*\.?\d+))?$/i);
    if (!m) return NaN;
    return m[2] ? Number(m[1]) / Number(m[2]) : Number(m[1]);
  }

  // Right within the tolerance; else the answer under a typical wrong idea, a sign or a rounding error.
  function judge(x, f, model) {
    if (Number.isNaN(x)) return { cls: 'bad', msg: ui().number };
    const e = f.value, near = (y, z, tol) => Math.abs(y - z) <= tol * Math.max(Math.abs(z), 0.05);
    if (near(x, e, ex.tol)) return { cls: 'ok', msg: ui().correct };
    for (const k of ['wire', 'zero', 'same']) {
      if (model[k] !== null && !near(model[k], e, ex.tol) && near(x, model[k], ex.tol)) return { cls: 'bad', msg: WHY[k]() };
    }
    if (e !== 0 && near(-x, e, ex.tol)) return { cls: 'warn', msg: f.abs ? ui().size : ui().sign };
    if (e !== 0 && near(x, e, Math.max(0.05, 2 * ex.tol))) return { cls: 'warn', msg: ui().close };
    return { cls: 'bad', msg: ui().wrong };
  }

  // ---------------------------------------------------------------- exercise lifecycle
  const newSeed = () => 1 + Math.floor(Math.random() * 999999);
  const level = () => (document.querySelector('input[name="level"]:checked') || {}).value || 'easy';

  function open(exercise) {
    ex = exercise;
    st = { tries: 0, hints: 0, solved: false, revealed: false, checked: false };
    const hash = `#${ex.id}`;
    if (location.hash !== hash) history.replaceState(null, '', hash);
    render();
    $(`#in-${ex.fields[0].key}`).focus({ preventScroll: true });
  }

  function fresh() { open(generate(level(), newSeed())); }

  function render() {
    $('#title').textContent = ex.title;
    // the difficulty, as in the arcade: ★★★☆☆
    const stars = document.createElement('span');
    stars.className = 'stars';
    stars.textContent = '★'.repeat(ex.difficulty) + '☆'.repeat(5 - ex.difficulty);
    stars.title = ui().stars(ex.difficulty);
    stars.setAttribute('aria-label', ui().stars(ex.difficulty));
    stars.setAttribute('role', 'img');
    $('#title').append(' ', stars);
    $('#prompt').innerHTML = ex.text;
    $('#figure').innerHTML = ex.figure(false);
    $('#fields').innerHTML = ex.fields.map((f) => `
      <div class="field" data-key="${f.key}">
        <label for="in-${f.key}" class="sym">$${f.sym}$&nbsp;=</label>
        <input id="in-${f.key}" type="text" inputmode="decimal" autocomplete="off" enterkeyhint="done" spellcheck="false">
        <span class="unit">${esc(f.unit)}</span>
        <span class="fb" aria-live="polite"></span>
      </div>`).join('');
    $('#hint-list').innerHTML = '';
    $('#hints').hidden = true;
    $('#solution').hidden = true;
    showStatus(null);
    math($('#task'));
    markScrollable();
    updateButtons();
  }

  const canReveal = () => st.solved || st.tries >= MAX_TRIES || st.hints >= ex.hints.length;

  function updateButtons() {
    // once everything is right, Check becomes New exercise, like the button at the top
    $('#check').textContent = st.solved ? ui().new : ui().check;
    $('#check').classList.toggle('primary', !st.solved);
    $('#check').classList.toggle('new-btn', st.solved);
    const left = ex.hints.length - st.hints;
    const hb = $('#hint');
    hb.disabled = left === 0 || st.revealed;
    hb.textContent = left ? ui().hint(left) : ui().noHints;
    const rb = $('#reveal');
    rb.disabled = !canReveal() || st.revealed;
    rb.title = canReveal() ? '' : ui().unlocks(MAX_TRIES);
    $('#reveal-note').hidden = canReveal() || st.revealed;
  }

  // Marks every field; true if all are right, null if some are empty.
  function feedback() {
    let allOk = true, anyEmpty = false;
    ex.fields.forEach((f, k) => {
      const row = $('#fields').querySelector(`.field[data-key="${f.key}"]`);
      const raw = row.querySelector('input').value;
      if (!raw.trim()) { anyEmpty = true; allOk = false; row.className = 'field'; row.querySelector('.fb').textContent = ''; return; }
      const r = judge(parse(raw), f, ex.models[k]);
      row.className = `field ${r.cls}`;
      row.querySelector('.fb').textContent = r.msg;
      if (r.cls !== 'ok') allOk = false;
    });
    return allOk ? true : anyEmpty ? null : false;
  }

  // The status line: null (none), 'fill', 'ok' or 'bad'.
  function showStatus(kind) {
    const el = $('#status');
    st.status = kind;
    el.className = 'status' + (kind === 'ok' ? ' ok' : kind === 'bad' ? ' bad' : '');
    el.textContent = !kind ? '' : kind === 'fill' ? ui().fill
      : kind === 'ok' ? (st.revealed ? ui().ok : ui().okWell)
        : ui().notYet(st.tries) + (st.tries < MAX_TRIES && !canReveal() ? ui().tryAgain : ui().canReveal);
  }

  function check(evt) {
    evt.preventDefault();
    if (st.solved) { fresh(); return; } // the button reads New exercise
    const r = feedback();
    st.checked = true;
    if (r === null) { showStatus('fill'); return; }
    st.tries++;
    if (r) {
      if (!st.solved && !st.revealed) {
        const s = stored('rl-score', { solved: 0, clean: 0 });
        s.solved++;
        if (st.tries === 1 && st.hints === 0) s.clean++;
        store('rl-score', s);
        showScore();
      }
      st.solved = true;
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

  function showSolution() {
    $('#sol-figure').innerHTML = ex.figure(true);
    $('#sol-steps').innerHTML = ex.solution.map((p) => `<p>${p}</p>`).join('');
    $('#sol-short').innerHTML = `${ui().results}: ${ex.results}`;
    $('#solution').hidden = false;
    math($('#solution'));
    markScrollable();
  }
  function reveal() {
    if (!canReveal()) return;
    st.revealed = true;
    showSolution();
    updateButtons();
    $('#solution').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---------------------------------------------------------------- arcade
  // Each question asks for one current right after switching (or the size of an induced emf).
  // Wrong options: the values under the typical wrong ideas (the inductor acts like a wire at
  // once, its current drops to zero, nothing changes at the switch), the current in the wrong
  // direction, then simple slips.
  const LEVEL_OF = (d) => (d <= 2 ? 'easy' : d === 3 ? 'medium' : 'hard');
  function arcadeQuestion(kind, seed) {
    const d = Number(kind.slice(1));
    let e = null;
    for (let k = 0; k < 400 && !e; k++) {
      const c = generate(LEVEL_OF(d), seed * 37 + k);
      if (c.difficulty === d || k === 399) e = c;
    }
    // a quantity with at least one telling wrong idea, if there is one
    const cands = e.fields.map((f, k) => ({ f, m: e.models[k] }));
    const telling = cands.filter(({ f, m }) => ['wire', 'zero', 'same'].some((x) => m[x] !== null && Math.abs(m[x] - f.value) > 0.5));
    const pool = telling.length ? telling : cands, { f, m } = pool[seed % pool.length];
    const mA = f.unit === 'mA', gap = mA ? 0.5 : 0.05;
    const options = [{ value: f.value, correct: true }];
    const add = (value, flag) => {
      if (options.length < 4 && Number.isFinite(value) && !(f.abs && value < 0) && options.every((o) => Math.abs(o.value - value) > gap)) options.push({ value, flag, why: flag ? WHY[flag]() : undefined });
    };
    ['wire', 'zero', 'same'].forEach((x) => { if (m[x] !== null) add(m[x], x); });
    if (!f.abs) add(-f.value, 'sign');
    const step = mA ? (Math.abs(f.value) >= 100 ? 50 : 10) : (f.value >= 10 ? 5 : 1);
    [2 * f.value, f.value / 2, f.value + step, f.value - step, f.value + 2 * step, 3 * f.value].forEach((x) => add(Math.round(x * 10) / 10, null));
    options.sort((a, b) => a.value - b.value);
    const num = (x) => String(parseFloat(x.toFixed(2))).replace('-', '−');
    const unitTex = mA ? '\\mathrm{mA}' : '\\mathrm{V}';
    return {
      title: e.title,
      text: `<p>${e.situation}</p>`,
      figure: e.figure(false, f.key),
      ask: mA ? L(`Find $${f.sym}$ right after switching.`, `Wie gross ist $${f.sym}$ unmittelbar nach dem Schalten?`)
        : L(`Find the size of the induced emf, $${f.sym}$, right after switching.`, `Wie gross ist der Betrag der induzierten Spannung, $${f.sym}$, unmittelbar nach dem Schalten?`),
      options: options.map((o) => ({ html: `$${num(o.value)}\\,${unitTex}$`, correct: !!o.correct, flag: o.flag, why: o.why })),
      explain: () => `<div class="figs">${e.figure(true)}</div><div class="steps">${e.solution.map((p) => `<p>${p}</p>`).join('')}</div>`,
    };
  }
  const arcadeSource = {
    id: 'rl',
    kinds: [1, 2, 3, 4, 5].map((d) => ({ id: `d${d}`, difficulty: d })),
    question: arcadeQuestion,
    concept: { wire: 'wire', zero: 'zero', same: 'same', sign: 'sign' },
    concepts: () => ({
      wire: L('the inductor as a wire at once', 'die Spule sofort als Draht'),
      zero: L('the inductor current drops to zero', 'der Spulenstrom fällt auf null'),
      same: L('nothing changes at the switch', 'beim Schalten ändert sich nichts'),
      sign: L('the direction of the current', 'die Richtung des Stroms'),
    }),
    intro: () => ({
      tag: L('A switch flips: find the currents right after it, as many as you can in <b>5 minutes</b>, four answers each.',
        'Ein Schalter wird umgelegt: Bestimme die Ströme unmittelbar danach, so viele wie möglich in <b>5 Minuten</b>, je vier Antworten.'),
      rule: L('Questions get harder as you go. Choose one of four answers, or press 1–4. Currents count along the arrows: a current against its arrow is negative.',
        'Die Fragen werden nach und nach schwieriger. Wähle eine von vier Antworten oder drücke 1–4. Ströme zählen in Pfeilrichtung: Ein Strom gegen seinen Pfeil ist negativ.'),
      example: L('treating the inductor as a wire right away', 'die Spule sofort als Draht zu behandeln'),
    }),
    // an inductor switched off, with its currents and emf, and the law of induction
    hero: () => `<div class="figs">${tutorial(window.Lessons.EXAMPLES[1].circuit).ex.figure(true)}</div><p class="ar-law">$${L('\\mathcal{E}_\\mathrm{i}', 'U_\\mathrm{ind}')} = -L\\,\\frac{\\Delta I}{\\Delta t}$</p>`,
  };

  // ---------------------------------------------------------------- language
  const lessons = () => window.Lessons.EXAMPLES.map((e) => ({
    name: e.name[Lang.get()], idea: e.idea[Lang.get()], frames: () => tutorial(e.circuit).frames,
  }));

  function applyStatic() {
    document.title = ui().title;
    Lang.apply(ui());
    let cur = $('#levels').childElementCount ? level() : stored('rl-level', 'easy');
    if (!LEVELS[cur]) cur = 'easy';
    $('#levels').innerHTML = Object.entries(LEVELS).map(([k, lv]) => `
      <label><input type="radio" name="level" value="${k}"${k === cur ? ' checked' : ''}><span>${esc(lv.name())}</span></label>`).join('');
  }

  // The same exercise (same seed) in the other language, with the answers, hints and solution kept.
  function switchLang() {
    applyStatic();
    showScore();
    if (ex) {
      const values = ex.fields.map((f) => $(`#in-${f.key}`).value);
      const keep = { ...st }, [lv, seed] = ex.id.split('-');
      ex = generate(lv, Number(seed));
      render();
      st = keep;
      ex.fields.forEach((f, k) => { $(`#in-${f.key}`).value = values[k]; });
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
    store('rl-mode', m);
    document.querySelectorAll('.practice').forEach((el) => { el.hidden = m !== 'practice'; });
    $('#tutor').hidden = m !== 'tutor';
    $('#arcade').hidden = m !== 'arcade';
    if (m !== 'practice') { $('#hints').hidden = true; $('#solution').hidden = true; }
    if (m !== 'arcade') arcade.stop();
  }
  function play() {
    setMode('arcade');
    arcade.show();
    if (location.hash !== '#arcade') history.replaceState(null, '', '#arcade');
  }
  function practise() {
    setMode('practice');
    if (ex) { history.replaceState(null, '', `#${ex.id}`); $('#hints').hidden = !st.hints; $('#solution').hidden = !st.revealed; markScrollable(); } else fresh();
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
      if (!ex || ex.id !== h) open(generate(m[1], Number(m[2])));
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------- init
  function init() {
    Lang.init(); // see lang.js
    document.querySelector('main').insertAdjacentHTML('beforeend', Arcade.HTML);
    applyStatic();
    $('#levels').addEventListener('change', () => { store('rl-level', level()); fresh(); });
    Lang.wire(switchLang);
    $('#new').addEventListener('click', fresh);
    $('#answers').addEventListener('submit', check);
    $('#hint').addEventListener('click', hint);
    $('#reveal').addEventListener('click', reveal);
    window.addEventListener('hashchange', fromHash);
    window.addEventListener('resize', markScrollable);
    tutor = window.createTutor(lessons(), {
      after: () => { math($('#tutor')); markScrollable(); },
      done: practise,
      t: () => ui().tutorBtns,
    });
    arcade = Arcade.create(arcadeSource, { math, markScrollable, stored, store });
    $('#modes').addEventListener('change', () => {
      if (mode() === 'tutor') { setMode('tutor'); tutor.open(tutor.current()); } else if (mode() === 'arcade') play(); else practise();
    });
    showScore();
    if (fromHash()) return;
    // First visit: start with the first worked example.
    const last = stored('rl-mode', 'tutor');
    if (last === 'tutor') { setMode('tutor'); tutor.open(0); } else if (last === 'arcade') play(); else { setMode('practice'); fresh(); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
