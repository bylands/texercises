(function () {
  'use strict';

  const EC = window.EC, Expr = window.Expr, Lang = window.Lang, Arcade = window.Arcade;
  const { LEVELS, generate, tutorial, judgeFormula, judgeNumber } = window.Energy;
  const $ = (sel) => document.querySelector(sel);
  const MAX_TRIES = 3;

  // ---------------------------------------------------------------- interface texts
  const LEGEND = {
    en: '<span class="k-pot">gravitational potential energy</span>, <span class="k-kin">kinetic energy</span>, <span class="k-el">elastic energy</span>',
    de: '<span class="k-pot">Lageenergie</span>, <span class="k-kin">kinetische Energie</span>, <span class="k-el">Spannenergie</span>',
  };
  const UI = {
    en: {
      title: 'Energy Conservation', mode: 'Mode', difficulty: 'Difficulty', formal: 'Formulas', stars: (d) => `Difficulty: ${d} of 5`, example: 'Example', tutor: 'Tutor', practice: 'Practice', arcade: 'Arcade', new: 'New exercise',
      tutorNote: `Use the arrow keys ← → to step through. The bars show the energy in each state: ${LEGEND.en}; the dashed line is the total energy.`,
      check: 'Check', reveal: 'Show solution', hints: 'Hints', solution: 'Solution', result: 'Result',
      revealNote: 'The worked solution unlocks once you have solved the exercise, used all hints or made three attempts.',
      score: (s, c) => `Solved: ${s} · first try without hints: ${c}`,
      hint: (n) => `Hint (${n} left)`, noHints: 'No more hints', unlocks: (n) => `Unlocks after all hints or ${n} attempts`,
      tableHead: '1 · Energy in each state', answerHead: '2 · Result',
      tableNote: (z) => `Tick the forms of energy that are not zero in each state. Zero level: ${z}.`,
      state: 'State',
      tableOk: '✓ The energy table is right.', tableBad: (n) => `✗ ${n === 1 ? 'One box is' : `${n} boxes are`} not right yet.`,
      fill: 'Fill in the result, then check again.',
      ok: 'All correct.', okWell: 'All correct, well done! Compare your approach with the worked solution, or start a new exercise.',
      notYet: (n) => `Not quite yet (attempt ${n}).`, tryAgain: ' Try again, or take a hint.', canReveal: ' You can take a hint or look at the worked solution.',
      number: 'Enter a number', correct: 'Correct', close: 'Close: check your rounding', wrong: 'Not correct',
      empty: 'Type a formula', syntax: 'This formula cannot be read: check the brackets and operators',
      unknown: (v, ok) => `${v} is not given here: use only ${ok}`,
      wanted: (v) => `Express ${v} by the given quantities`,
      typeHelp: (ex) => `For example sqrt(2*g*h) or √(2gh), v0^2 or v0², 1/2 or 0.5.${ex ? ` Type ${ex}.` : ''}`,
      preview: 'Read as',
      tutorBtns: { example: (i, n) => `Example ${i} of ${n}`, back: '← Back', prevEx: '← Previous example', next: 'Next →', nextEx: 'Next example →', done: 'Practise on your own →' },
    },
    de: {
      title: 'Energieerhaltung', mode: 'Modus', difficulty: 'Schwierigkeit', formal: 'Formeln', stars: (d) => `Schwierigkeit: ${d} von 5`, example: 'Beispiel', tutor: 'Tutor', practice: 'Üben', arcade: 'Arcade', new: 'Neue Aufgabe',
      tutorNote: `Mit den Pfeiltasten ← → blätterst du weiter. Die Balken zeigen die Energie in jedem Zustand: ${LEGEND.de}; die gestrichelte Linie ist die Gesamtenergie.`,
      check: 'Prüfen', reveal: 'Lösung zeigen', hints: 'Tipps', solution: 'Lösung', result: 'Resultat',
      revealNote: 'Die ausführliche Lösung wird freigeschaltet, sobald du die Aufgabe gelöst, alle Tipps genutzt oder drei Versuche gemacht hast.',
      score: (s, c) => `Gelöst: ${s} · beim ersten Versuch ohne Tipps: ${c}`,
      hint: (n) => `Tipp (${n} übrig)`, noHints: 'Keine Tipps mehr', unlocks: (n) => `Wird nach allen Tipps oder ${n} Versuchen freigeschaltet`,
      tableHead: '1 · Energie in jedem Zustand', answerHead: '2 · Resultat',
      tableNote: (z) => `Kreuze in jedem Zustand die Energieformen an, die nicht null sind. Nullniveau: ${z}.`,
      state: 'Zustand',
      tableOk: '✓ Die Energietabelle stimmt.', tableBad: (n) => `✗ ${n === 1 ? 'Ein Feld stimmt' : `${n} Felder stimmen`} noch nicht.`,
      fill: 'Gib das Resultat ein und prüfe dann nochmals.',
      ok: 'Alles richtig.', okWell: 'Alles richtig, gut gemacht! Vergleiche deinen Lösungsweg mit der ausführlichen Lösung oder starte eine neue Aufgabe.',
      notYet: (n) => `Noch nicht ganz (Versuch ${n}).`, tryAgain: ' Versuche es nochmals, oder nimm einen Tipp.', canReveal: ' Du kannst einen Tipp nehmen oder die ausführliche Lösung anschauen.',
      number: 'Gib eine Zahl ein', correct: 'Richtig', close: 'Knapp daneben: Prüfe deine Rundung', wrong: 'Nicht richtig',
      empty: 'Gib eine Formel ein', syntax: 'Diese Formel ist nicht lesbar: Prüfe Klammern und Rechenzeichen',
      unknown: (v, ok) => `${v} ist hier nicht gegeben: Verwende nur ${ok}`,
      wanted: (v) => `Drücke ${v} durch die gegebenen Grössen aus`,
      typeHelp: (ex) => `Zum Beispiel sqrt(2*g*h) oder √(2gh), v0^2 oder v0², 1/2 oder 0.5.${ex ? ` Tippe ${ex}.` : ''}`,
      preview: 'Gelesen als',
      tutorBtns: { example: (i, n) => `Beispiel ${i} von ${n}`, back: '← Zurück', prevEx: '← Vorheriges Beispiel', next: 'Weiter →', nextEx: 'Nächstes Beispiel →', done: 'Selbst üben →' },
    },
  };
  const ui = () => UI[EC.getLang()];

  let ex = null, st = null, tutor = null, arcade = null;

  // ---------------------------------------------------------------- persistence
  function stored(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; }
  }
  function store(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
  }
  function showScore() {
    const s = stored('ec-score', { solved: 0, clean: 0 });
    $('#score').textContent = s.solved ? ui().score(s.solved, s.clean) : '';
  }

  function math(el) {
    if (window.renderMathInElement) {
      window.renderMathInElement(el, {
        delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }],
        throwOnError: false,
        trust: (ctx) => ctx.command === '\\htmlClass',
        strict: false,
      });
    }
  }
  const katex1 = (tex) => (window.katex ? window.katex.renderToString(tex, { throwOnError: false, strict: false }) : tex);

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

  const symList = (keys) => keys.map((k) => EC.plainSym(k)).join(', ');
  // The symbols as typed: "v0 for v₀, l for ℓ"
  const typeHints = (keys) => keys.filter((k) => EC.typed(k) !== EC.plainSym(k)).map((k) => `${EC.typed(k)} ${EC.L('for', 'für')} ${EC.plainSym(k)}`);

  function judge(raw) {
    if (!ex.formal) {
      const r = judgeNumber(ex, parse(raw));
      return { cls: r.cls, msg: r.msg || { ok: ui().correct, number: ui().number, close: ui().close, wrong: ui().wrong }[r.key] };
    }
    const r = judgeFormula(ex, raw), allowed = [...new Set([...ex.vars, 'g'])];
    const named = (v) => (EC.SYM[v] ? EC.plainSym(v) : v.replace(/p/, '′'));
    const msg = r.msg || {
      ok: ui().correct, empty: ui().empty, syntax: ui().syntax, wrong: ui().wrong,
      unknown: r.vars && ui().unknown(named(r.vars[0]), symList(allowed)),
      wanted: ui().wanted(EC.plainSym(ex.want.key)),
    }[r.key];
    return { cls: r.cls, msg };
  }

  // ---------------------------------------------------------------- exercise lifecycle
  const newSeed = () => 1 + Math.floor(Math.random() * 999999);
  const level = () => (document.querySelector('input[name="level"]:checked') || {}).value || 'mixed';
  const formal = () => $('#formal').checked;

  function open(exercise) {
    ex = exercise;
    st = { tries: 0, hints: 0, solved: false, revealed: false, checked: false };
    const hash = `#${ex.id}`;
    if (location.hash !== hash) history.replaceState(null, '', hash);
    render();
  }

  // A new exercise, of another situation than the current one if possible.
  function fresh() {
    let next = generate(level(), newSeed(), formal());
    for (let k = 0; k < 6 && ex && next.scenario === ex.scenario; k++) next = generate(level(), newSeed(), formal());
    open(next);
  }

  // The energy table: a row per state, a column per form of energy, a box per cell.
  function tableHtml() {
    const head = ex.forms.map((k) => `<th scope="col" class="k-${k}" title="${EC.ENAME[k]()}">$${EC.etex(k)}$</th>`).join('');
    const rows = ex.table.map((row, i) => `<tr><th scope="row">${EC.CIRCLED[i]}</th>${row.map((_, j) => `
      <td><label class="cell"><input type="checkbox" data-i="${i}" data-j="${j}" aria-label="${ui().state} ${i + 1}: ${EC.ENAME[ex.forms[j]]()}"><span aria-hidden="true"></span></label></td>`).join('')}</tr>`).join('');
    return `<table class="etable"><thead><tr><th></th>${head}</tr></thead><tbody>${rows}</tbody></table>`;
  }

  function fieldHtml() {
    const w = ex.want, label = `<label for="in-ans" class="sym"><span class="what">${w.what}</span> $${EC.tex(w.key)}$&nbsp;=</label>`;
    if (!ex.formal) return `<div class="field" data-key="ans">${label}
        <input id="in-ans" type="text" inputmode="decimal" autocomplete="off" enterkeyhint="done" spellcheck="false">
        <span class="unit">${EC.UNITS[w.unit]}</span><span class="fb" aria-live="polite"></span></div>`;
    const keys = [...new Set([...ex.vars, 'g'])], th = typeHints(keys);
    return `<div class="field formula" data-key="ans">${label}
        <input id="in-ans" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" enterkeyhint="done" spellcheck="false">
        <span class="fb" aria-live="polite"></span></div>
      <p class="preview" id="preview" aria-live="polite"></p>
      <p class="note type-help">${ui().typeHelp(th.join(', '))}</p>`;
  }

  // The typed formula as KaTeX, so that the student sees how it is read.
  function preview() {
    const el = $('#preview');
    if (!el) return;
    const raw = $('#in-ans').value, r = Expr.parse(raw);
    el.innerHTML = raw.trim() && r.tree ? `${ui().preview}: ${katex1(`${EC.tex(ex.want.key)} = ${Expr.tex(r.tree)}`)}` : '';
  }

  function render() {
    $('#title').textContent = ex.title;
    const stars = document.createElement('span');
    stars.className = 'stars';
    stars.textContent = '★'.repeat(ex.difficulty) + '☆'.repeat(5 - ex.difficulty);
    stars.title = ui().stars(ex.difficulty);
    stars.setAttribute('aria-label', ui().stars(ex.difficulty));
    stars.setAttribute('role', 'img');
    $('#title').append(' ', stars);
    $('#prompt').innerHTML = ex.text;
    $('#figure').innerHTML = ex.figure({});
    $('#table-note').textContent = ui().tableNote(ex.zero);
    $('#etable').innerHTML = tableHtml();
    $('#table-fb').textContent = '';
    $('#table-fb').className = 'table-fb';
    $('#fields').className = `fields${ex.formal ? ' formula' : ''}`;
    $('#fields').innerHTML = fieldHtml();
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

  // Marks the table and the result; true if all is right, null if the result is empty.
  function feedback() {
    let wrongCells = 0;
    document.querySelectorAll('#etable input').forEach((box) => {
      const right = box.checked === ex.table[box.dataset.i][box.dataset.j];
      box.closest('td').className = right ? 'ok' : 'bad';
      if (!right) wrongCells++;
    });
    $('#table-fb').className = `table-fb ${wrongCells ? 'bad' : 'ok'}`;
    $('#table-fb').textContent = wrongCells ? ui().tableBad(wrongCells) : ui().tableOk;
    const row = $('#fields .field'), raw = $('#in-ans').value;
    if (!raw.trim()) { row.className = row.className.replace(/ (ok|warn|bad)/g, ''); row.querySelector('.fb').textContent = ''; return null; }
    const r = judge(raw);
    row.className = `field${ex.formal ? ' formula' : ''} ${r.cls}`;
    row.querySelector('.fb').textContent = r.msg;
    return r.cls === 'ok' && !wrongCells;
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
        const s = stored('ec-score', { solved: 0, clean: 0 });
        s.solved++;
        if (st.tries === 1 && st.hints === 0) s.clean++;
        store('ec-score', s);
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
    $('#sol-figure').innerHTML = ex.solutionFigure();
    $('#sol-steps').innerHTML = ex.solution.join('');
    $('#sol-short').innerHTML = `${ui().result}: ${ex.results}`;
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

  // ---------------------------------------------------------------- language
  const lessons = () => window.Lessons.EXAMPLES.map((e) => ({
    name: e.name[EC.getLang()], idea: e.idea[EC.getLang()], frames: () => tutorial(e).frames,
  }));

  function applyStatic() {
    document.title = ui().title;
    Lang.apply(ui());
    let cur = $('#levels').childElementCount ? level() : stored('ec-level', 'easy');
    if (!LEVELS[cur]) cur = 'easy';
    $('#levels').innerHTML = Object.entries(LEVELS).map(([k, lv]) => `
      <label><input type="radio" name="level" value="${k}"${k === cur ? ' checked' : ''}><span>${lv.name()}</span></label>`).join('');
  }

  // The same exercise (same seed) in the other language, with the answers, hints and solution kept.
  function switchLang() {
    applyStatic();
    showScore();
    if (ex) {
      const value = $('#in-ans').value, boxes = [...document.querySelectorAll('#etable input')].map((b) => b.checked);
      const keep = { ...st };
      ex = generate(ex.level, ex.seed, ex.formal);
      render();
      st = keep;
      $('#in-ans').value = value;
      document.querySelectorAll('#etable input').forEach((b, k) => { b.checked = boxes[k]; });
      preview();
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
    store('ec-mode', m);
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
    m = h.match(/^(easy|medium|hard|mixed)(-num)?-(\d+)$/);
    if (m) {
      setMode('practice');
      document.querySelector(`input[name="level"][value="${m[1]}"]`).checked = true;
      $('#formal').checked = !m[2];
      if (!ex || ex.id !== h) open(generate(m[1], Number(m[3]), !m[2]));
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------- init
  function init() {
    Lang.init(); // see lang.js
    document.querySelector('main').insertAdjacentHTML('beforeend', Arcade.HTML);
    applyStatic();
    $('#levels').addEventListener('change', () => { store('ec-level', level()); fresh(); });
    $('#formal').checked = stored('ec-formal', true);
    $('#formal').addEventListener('change', () => { store('ec-formal', formal()); fresh(); });
    Lang.wire(switchLang);
    $('#new').addEventListener('click', fresh);
    $('#answers').addEventListener('submit', check);
    $('#answers').addEventListener('input', (evt) => { if (evt.target.id === 'in-ans') preview(); });
    $('#hint').addEventListener('click', hint);
    $('#reveal').addEventListener('click', reveal);
    window.addEventListener('hashchange', fromHash);
    window.addEventListener('resize', markScrollable);
    tutor = window.createTutor(lessons(), {
      after: () => { math($('#tutor')); markScrollable(); },
      done: practise,
      t: () => ui().tutorBtns,
    });
    arcade = Arcade.create(window.ArcadeSource, { math, markScrollable, stored, store });
    $('#modes').addEventListener('change', () => {
      if (mode() === 'tutor') { setMode('tutor'); tutor.open(tutor.current()); } else if (mode() === 'arcade') play(); else practise();
    });
    showScore();
    if (fromHash()) return;
    // First visit: start with the first worked example.
    const last = stored('ec-mode', 'tutor');
    if (last === 'tutor') { setMode('tutor'); tutor.open(0); } else if (last === 'arcade') play(); else { setMode('practice'); fresh(); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
