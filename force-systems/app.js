(function () {
  'use strict';

  const FS = window.FS, Lang = window.Lang, Arcade = window.Arcade, { generate, tutorial, practiceOf } = window.Forces;
  const $ = (sel) => document.querySelector(sel);
  const MAX_TRIES = 3;

  // ---------------------------------------------------------------- interface texts
  const LEGEND = {
    en: '<span class="k-g">weight</span>, <span class="k-n">normal force</span>, <span class="k-r">friction</span>, <span class="k-s">pull</span>, <span class="k-k">rope and contact forces</span>, <span class="k-acc">acceleration</span>',
    de: '<span class="k-g">Gewichtskraft</span>, <span class="k-n">Normalkraft</span>, <span class="k-r">Reibung</span>, <span class="k-s">Zugkraft</span>, <span class="k-k">Seil- und Kontaktkräfte</span>, <span class="k-acc">Beschleunigung</span>',
  };
  const UI = {
    en: {
      title: 'Force Systems', mode: 'Mode', difficulty: 'Difficulty', calc: 'Calculator', stars: (d) => `Difficulty: ${d} of 5`, example: 'Example', tutor: 'Tutor', practice: 'Practice', arcade: 'Arcade', new: 'New exercise',
      tutorNote: `Use the arrow keys ← → to step through. The forces a step is about are highlighted. Colours: ${LEGEND.en}.`,
      check: 'Check', reveal: 'Show solution', hints: 'Hints', solution: 'Solution', results: 'Results',
      revealNote: 'The worked solution unlocks once you have solved the exercise, used all hints or made three attempts.',
      score: (s, c) => `Solved: ${s} · first try without hints: ${c}`,
      hint: (n) => `Hint (${n} left)`, noHints: 'No more hints', unlocks: (n) => `Unlocks after all hints or ${n} attempts`,
      fill: 'Fill in all fields, then check again.',
      forcesHead: '1 · Forces on each box', compsHead: '2 · Components', compsNote: 'Choose the right expression for each component; its value is then given.', idFirst: 'First choose the right expression for each component.', resultsHead: (n) => `${n} · Results`, forcesNote: (n) => (n > 1 ? 'Tick every force that acts on each box. Each force you tick appears in the drawing.' : 'Tick every force that acts on the box. Each force you tick appears in the drawing.'), box: 'Box',
      tableOk: '✓ The forces are right.', tableBad: (n) => `✗ ${n === 1 ? 'One entry is' : `${n} entries are`} not right yet.`,
      ok: 'All correct.', okWell: 'All correct, well done! Compare your approach with the worked solution, or start a new exercise.',
      notYet: (n) => `Not quite yet (attempt ${n}).`, tryAgain: ' Try again, or take a hint.', canReveal: ' You can take a hint or look at the worked solution.',
      number: 'Enter a number', correct: 'Correct', sign: 'Give the size of the force (a positive number)', close: 'Close: check your rounding', wrong: 'Not correct',
      tutorBtns: { example: (i, n) => `Example ${i} of ${n}`, back: '← Back', prevEx: '← Previous example', next: 'Next →', nextEx: 'Next example →', done: 'Practise on your own →' },
    },
    de: {
      title: 'Kräftesysteme', mode: 'Modus', difficulty: 'Schwierigkeit', calc: 'Taschenrechner', stars: (d) => `Schwierigkeit: ${d} von 5`, example: 'Beispiel', tutor: 'Tutor', practice: 'Üben', arcade: 'Arcade', new: 'Neue Aufgabe',
      tutorNote: `Mit den Pfeiltasten ← → blätterst du weiter. Die Kräfte, um die es in einem Schritt geht, sind hervorgehoben. Farben: ${LEGEND.de}.`,
      check: 'Prüfen', reveal: 'Lösung zeigen', hints: 'Tipps', solution: 'Lösung', results: 'Resultate',
      revealNote: 'Die ausführliche Lösung wird freigeschaltet, sobald du die Aufgabe gelöst, alle Tipps genutzt oder drei Versuche gemacht hast.',
      score: (s, c) => `Gelöst: ${s} · beim ersten Versuch ohne Tipps: ${c}`,
      hint: (n) => `Tipp (${n} übrig)`, noHints: 'Keine Tipps mehr', unlocks: (n) => `Wird nach allen Tipps oder ${n} Versuchen freigeschaltet`,
      fill: 'Fülle alle Felder aus und prüfe dann nochmals.',
      forcesHead: '1 · Kräfte auf jede Kiste', compsHead: '2 · Komponenten', compsNote: 'Wähle für jede Komponente den richtigen Ausdruck; ihr Wert wird dann angegeben.', idFirst: 'Wähle zuerst für jede Komponente den richtigen Ausdruck.', resultsHead: (n) => `${n} · Resultate`, forcesNote: (n) => (n > 1 ? 'Kreuze jede Kraft an, die auf die jeweilige Kiste wirkt. Jede angekreuzte Kraft erscheint in der Zeichnung.' : 'Kreuze jede Kraft an, die auf die Kiste wirkt. Jede angekreuzte Kraft erscheint in der Zeichnung.'), box: 'Kiste',
      tableOk: '✓ Die Kräfte stimmen.', tableBad: (n) => `✗ ${n === 1 ? 'Ein Feld stimmt' : `${n} Felder stimmen`} noch nicht.`,
      ok: 'Alles richtig.', okWell: 'Alles richtig, gut gemacht! Vergleiche deinen Lösungsweg mit der ausführlichen Lösung oder starte eine neue Aufgabe.',
      notYet: (n) => `Noch nicht ganz (Versuch ${n}).`, tryAgain: ' Versuche es nochmals, oder nimm einen Tipp.', canReveal: ' Du kannst einen Tipp nehmen oder die ausführliche Lösung anschauen.',
      number: 'Gib eine Zahl ein', correct: 'Richtig', sign: 'Gib den Betrag der Kraft an (eine positive Zahl)', close: 'Knapp daneben: Prüfe deine Rundung', wrong: 'Nicht richtig',
      tutorBtns: { example: (i, n) => `Beispiel ${i} von ${n}`, back: '← Zurück', prevEx: '← Vorheriges Beispiel', next: 'Weiter →', nextEx: 'Nächstes Beispiel →', done: 'Selbst üben →' },
    },
  };
  const ui = () => UI[FS.getLang()];

  let ex = null, st = null, tutor = null, arcade = null, topics = null;

  // ---------------------------------------------------------------- persistence
  function stored(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; }
  }
  function store(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
  }
  function showScore() {
    const s = stored('fs-score', { solved: 0, clean: 0 });
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

  // Right within 2 % or when rounded to one decimal place; otherwise the answer under a typical wrong idea, a sign or a rounding error.
  function judge(x, f) {
    if (Number.isNaN(x)) return { cls: 'bad', msg: ui().number };
    const e = f.value, near = (y, z, tol) => Math.abs(y - z) <= tol * Math.max(Math.abs(z), 0.05);
    if (near(x, e, 0.02) || Math.abs(x - e) <= 0.05 + 1e-9) return { cls: 'ok', msg: ui().correct };
    for (const t of f.traps) if (near(x, t.value, 0.015)) return { cls: 'bad', msg: t.why };
    if (e !== 0 && near(-x, e, 0.02)) return { cls: 'warn', msg: ui().sign };
    if (e !== 0 && near(x, e, 0.06)) return { cls: 'warn', msg: ui().close };
    return { cls: 'bad', msg: ui().wrong };
  }

  // ---------------------------------------------------------------- exercise lifecycle
  const newSeed = () => 1 + Math.floor(Math.random() * 999999);

  // Practice comes back more often to the types of exercise that were hard (shared practice.js).
  const PRACTICE = 'fs', typeOf = (e) => e.scenario;
  const finish = () => { if (ex && st) Practice.finish(PRACTICE, typeOf(ex), st); };

  function open(exercise) {
    finish(); // the student moves on
    ex = exercise;
    st = { tries: 0, hints: 0, solved: false, revealed: false, checked: false, ident: {} };
    const hash = `#${ex.id}`;
    if (location.hash !== hash) history.replaceState(null, '', hash);
    render();
    topics.shown(ex);
    $(`#in-${ex.fields[0].key}`).focus({ preventScroll: true });
  }

  // A new exercise of the topic and stage chosen (topics.js), of another type than the current
  // one if possible.
  function fresh() { open(topics.next(ex)); }
  // the same exercise again (e.g. in the other language); links of earlier versions name a level
  const again = (e) => topics.parse(e.id) || generate(e.level, e.seed, e.calc);

  // The topics of practice: those of the tutor's examples, with their stages (lessons.js).
  const topicList = () => window.Lessons.EXAMPLES.map((e) => ({
    name: () => e.name[FS.getLang()],
    stages: e.practice.map((s) => ({ name: s.en ? () => s[FS.getLang()] : null, types: s.types })),
  }));

  // The answer fields; their inputs have the ids `${prefix}-${key}`.
  const fieldsHtml = (exercise, prefix) => exercise.fields.map((f) => `
      <div class="field" data-key="${f.key}">
        <label for="${prefix}-${f.key}" class="sym"><span class="what">${f.what}</span> $${FS.tex(...f.sym)}$&nbsp;=</label>
        <input id="${prefix}-${f.key}" type="text" inputmode="decimal" autocomplete="off" enterkeyhint="done" spellcheck="false">
        <span class="unit">${FS.UNITS[f.unit]}</span>
        <span class="fb" aria-live="polite"></span>
      </div>`).join('');

  // The table of forces: a row per kind of force, a column per box (at most two, so that it fits
  // a phone), a box to tick per cell.
  function forcesHtml() {
    const t = ex.forces;
    const head = t.boxes.map((b) => `<th scope="col">${b}</th>`).join('');
    const rows = t.kinds.map((k, j) => `<tr><th scope="row" class="k-${k.kind}">${k.name}</th>${t.boxes.map((b, i) => `
      <td><label class="cell"><input type="checkbox" data-i="${i}" data-j="${j}" aria-label="${b}: ${k.name}"><span aria-hidden="true"></span></label></td>`).join('')}</tr>`).join('');
    return `<table class="ftable"><thead><tr><th></th>${head}</tr></thead><tbody>${rows}</tbody></table>`;
  }

  // The task's drawing with every force ticked in the table drawn in, whether it acts or not:
  // the drawing shows what the student claims.
  function drawTicked() {
    const ticked = new Set([...document.querySelectorAll('#ftable input:checked')].map((b) => `${b.dataset.i}:${b.dataset.j}`));
    $('#figure').innerHTML = ex.taskFigure(ticked, identified());
    markScrollable();
  }

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
    $('#figure').innerHTML = ex.taskFigure(new Set());
    $('#forces-note').textContent = ui().forcesNote(ex.forces.boxes.length);
    $('#ftable').innerHTML = forcesHtml();
    $('#ftable-fb').textContent = '';
    $('#ftable-fb').className = 'table-fb';
    $('#fields').innerHTML = fieldsHtml(ex, 'in');
    showComps();
    $('#hint-list').innerHTML = '';
    $('#hints').hidden = true;
    $('#solution').hidden = true;
    showStatus(null);
    math($('#task'));
    markScrollable();
    updateButtons();
  }

  // The components to identify first (angled forces, see identify.js): the app gives their values.
  const identItems = () => ex.comps.map((c) => Identify.trig({ ...c, alpha: ex.p.alpha, num: (x) => FS.num(x), unit: '\\mathrm{N}' }));
  // the forces of the components identified so far (drawn in), all once the solution is shown
  const identified = () => ex.comps.filter((c) => (st && st.revealed) || (st && Identify.right(identItems().find((it) => it.key === c.key), st.ident))).map((c) => c.fig);
  function showComps() {
    $('#comps-part').hidden = !ex.comps.length;
    $('#results-head').textContent = ui().resultsHead(ex.comps.length ? 3 : 2);
    $('#comps').innerHTML = Identify.html(identItems(), st ? st.ident || {} : {}, st && st.revealed);
    math($('#comps'));
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
    let allOk = true, anyEmpty = false, wrongCells = 0;
    document.querySelectorAll('#ftable input').forEach((box) => {
      const right = box.checked === ex.forces.table[box.dataset.i][box.dataset.j];
      box.closest('td').className = right ? 'ok' : 'bad';
      if (!right) wrongCells++;
    });
    $('#ftable-fb').className = `table-fb ${wrongCells ? 'bad' : 'ok'}`;
    $('#ftable-fb').textContent = wrongCells ? ui().tableBad(wrongCells) : ui().tableOk;
    if (wrongCells) allOk = false;
    ex.fields.forEach((f) => {
      const row = $('#fields').querySelector(`.field[data-key="${f.key}"]`);
      const raw = row.querySelector('input').value;
      if (!raw.trim()) { anyEmpty = true; allOk = false; row.className = 'field'; row.querySelector('.fb').textContent = ''; return; }
      const r = judge(parse(raw), f);
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
    el.textContent = !kind ? '' : kind === 'fill' ? ui().fill : kind === 'ident' ? ui().idFirst
      : kind === 'ok' ? (st.revealed ? ui().ok : ui().okWell) + (st.advance ? ` ${st.advance}` : '')
        : ui().notYet(st.tries) + (st.tries < MAX_TRIES && !canReveal() ? ui().tryAgain : ui().canReveal);
  }

  function check(evt) {
    evt.preventDefault();
    if (st.solved) { fresh(); return; } // the button reads New exercise
    if (!Identify.ok(identItems(), st.ident)) { showStatus('ident'); return; }
    const r = feedback();
    st.checked = true;
    if (r === null) { showStatus('fill'); return; }
    st.tries++;
    if (r) {
      if (!st.solved && !st.revealed) {
        const s = stored('fs-score', { solved: 0, clean: 0 });
        s.solved++;
        if (st.tries === 1 && st.hints === 0) s.clean++;
        store('fs-score', s);
        showScore();
      }
      st.solved = true;
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

  function showSolution() {
    showComps();
    $('#sol-figure').innerHTML = ex.solutionFigure();
    $('#sol-steps').innerHTML = ex.solution.join('');
    $('#sol-short').innerHTML = `${ui().results}: ${ex.results}`;
    $('#solution').hidden = false;
    math($('#solution'));
    markScrollable();
  }
  function reveal() {
    if (!canReveal()) return;
    st.revealed = true;
    finish();
    showSolution();
    updateButtons();
    $('#solution').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---------------------------------------------------------------- language
  const lessons = () => window.Lessons.EXAMPLES.map((e, i) => ({
    name: e.name[FS.getLang()], idea: e.idea[FS.getLang()], also: topics.also(i), frames: () => tutorial(e).frames,
  }));

  function applyStatic() {
    document.title = ui().title;
    Lang.apply(ui());
    if (topics) topics.relabel();
  }

  // The same exercise (same seed) in the other language, with the answers, hints and solution kept.
  function switchLang() {
    applyStatic();
    showScore();
    if (ex) {
      const values = ex.fields.map((f) => $(`#in-${f.key}`).value), ticks = [...document.querySelectorAll('#ftable input')].map((b) => b.checked);
      const keep = { ...st };
      ex = again(ex);
      render();
      st = keep;
      ex.fields.forEach((f, k) => { $(`#in-${f.key}`).value = values[k]; });
      document.querySelectorAll('#ftable input').forEach((b, k) => { b.checked = ticks[k]; });
      drawTicked();
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
    store('fs-mode', m);
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
    const te = topics.parse(h);
    if (te) {
      setMode('practice');
      if (!ex || ex.id !== h) open(te);
      return true;
    }
    m = h.match(/^(easy|medium|hard|mixed)(-nocalc)?-(\d+)$/);
    if (m) {
      setMode('practice');
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
    topics = window.Topics.create({
      app: PRACTICE, topics: topicList(),
      make: (type, seed) => practiceOf(type, seed), typeOf,
      onChange: fresh,
      tutor: (i) => { setMode('tutor'); tutor.open(i); },
    });
    topics.mount($('#levels'));
    Identify.attach($('#comps'), identItems, () => st.ident, (right) => {
      math($('#comps'));
      if (right) drawTicked(); // the component appears in the drawing
      else { st.tries++; updateButtons(); } // a wrong choice counts as an attempt
    });
    Lang.wire(switchLang);
    $('#new').addEventListener('click', fresh);
    $('#answers').addEventListener('submit', check);
    $('#ftable').addEventListener('change', drawTicked);
    $('#hint').addEventListener('click', hint);
    $('#reveal').addEventListener('click', reveal);
    window.addEventListener('hashchange', fromHash);
    window.addEventListener('resize', markScrollable);
    tutor = window.createTutor(lessons(), {
      after: () => { math($('#tutor')); markScrollable(); },
      done: practise,
      practise: (i) => { topics.go(i); setMode('practice'); fresh(); },
      t: () => ui().tutorBtns,
    });
    arcade = Arcade.create(window.ArcadeSource, { math, markScrollable, stored, store });
    $('#modes').addEventListener('change', () => {
      if (mode() === 'tutor') { setMode('tutor'); tutor.open(tutor.current()); } else if (mode() === 'arcade') play(); else practise();
    });
    showScore();
    if (fromHash()) return;
    // First visit: start with the first worked example.
    const last = stored('fs-mode', 'tutor');
    if (last === 'tutor') { setMode('tutor'); tutor.open(0); } else if (last === 'arcade') play(); else { setMode('practice'); fresh(); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
