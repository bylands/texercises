(function () {
  'use strict';

  const { generate, tutorial, fval, ftex } = window.Generator;
  const { esc, fitText } = window.Circuit;
  const Lang = window.Lang, Check = window.Check, L = Lang.L;
  const $ = (sel) => document.querySelector(sel);
  const MAX_TRIES = 3;

  // ---------------------------------------------------------------- interface texts
  const UI = {
    en: {
      title: 'Resistor Circuit Trainer', mode: 'Mode', difficulty: 'Difficulty', example: 'Example',
      tutor: 'Tutor', practice: 'Practice', checkMode: 'Check', new: 'New exercise',
      tutorNote: 'Use the arrow keys ← → to step through. In the diagram, the parts combined in a step are <span class="k-strong">highlighted</span>, the group they belong to is <span class="k-light">shaded</span>, the value just found is <span class="k-new">marked</span> and the values used are <b>bold</b>.',
      check: 'Check', reveal: 'Show solution', hints: 'Hints', solution: 'Solution', results: 'Results',
      revealNote: 'The worked solution unlocks once you have solved the exercise, used all hints or made three attempts.',
      solNote: 'The diagram shows all currents (<span class="c-cur">blue</span>) and voltages (<span class="c-vol">red</span>) in the circuit.',
      levels: { easy: 'Easy', medium: 'Medium', hard: 'Hard', mixed: 'Mixed' },
      stars: (d) => `Difficulty: ${d} of 5`,
      score: (s, c) => `Solved: ${s} · first try without hints: ${c}`,
      hint: (n) => `Hint (${n} left)`, noHints: 'No more hints', unlocks: (n) => `Unlocks after all hints or ${n} attempts`,
      fill: 'Fill in all fields, then check again.',
      ok: 'All correct.', okWell: 'All correct, well done! Compare your approach with the worked solution, or start a new exercise.',
      notYet: (n) => `Not quite yet (attempt ${n}).`, tryAgain: ' Try again, or take a hint.', canReveal: ' You can take a hint or look at the worked solution.',
      number: 'Enter a number', correct: 'Correct', sign: 'Wrong sign: check the direction', prefix: 'Off by a factor of 1000: check the unit prefix', close: 'Close: check your rounding', wrong: 'Not correct',
    },
    de: {
      title: 'Widerstandsschaltungen', mode: 'Modus', difficulty: 'Schwierigkeit', example: 'Beispiel',
      tutor: 'Tutor', practice: 'Üben', checkMode: 'Check', new: 'Neue Aufgabe',
      tutorNote: 'Mit den Pfeiltasten ← → blätterst du weiter. Im Schaltbild sind die Teile, die in einem Schritt zusammengefasst werden, <span class="k-strong">hervorgehoben</span>, ihre Gruppe ist <span class="k-light">schattiert</span>, der eben gefundene Wert ist <span class="k-new">markiert</span>, und die verwendeten Werte sind <b>fett</b>.',
      check: 'Prüfen', reveal: 'Lösung zeigen', hints: 'Tipps', solution: 'Lösung', results: 'Resultate',
      revealNote: 'Die ausführliche Lösung wird freigeschaltet, sobald du die Aufgabe gelöst, alle Tipps genutzt oder drei Versuche gemacht hast.',
      solNote: 'Das Schaltbild zeigt alle Ströme (<span class="c-cur">blau</span>) und Spannungen (<span class="c-vol">rot</span>) in der Schaltung.',
      levels: { easy: 'Einfach', medium: 'Mittel', hard: 'Schwierig', mixed: 'Gemischt' },
      stars: (d) => `Schwierigkeit: ${d} von 5`,
      score: (s, c) => `Gelöst: ${s} · beim ersten Versuch ohne Tipps: ${c}`,
      hint: (n) => `Tipp (${n} übrig)`, noHints: 'Keine Tipps mehr', unlocks: (n) => `Wird nach allen Tipps oder ${n} Versuchen freigeschaltet`,
      fill: 'Fülle alle Felder aus und prüfe dann nochmals.',
      ok: 'Alles richtig.', okWell: 'Alles richtig, gut gemacht! Vergleiche deinen Lösungsweg mit der ausführlichen Lösung oder starte eine neue Aufgabe.',
      notYet: (n) => `Noch nicht ganz (Versuch ${n}).`, tryAgain: ' Versuche es nochmals, oder nimm einen Tipp.', canReveal: ' Du kannst einen Tipp nehmen oder die ausführliche Lösung anschauen.',
      number: 'Gib eine Zahl ein', correct: 'Richtig', sign: 'Falsches Vorzeichen: Prüfe die Richtung', prefix: 'Um den Faktor 1000 daneben: Prüfe die Einheit', close: 'Knapp daneben: Prüfe deine Rundung', wrong: 'Nicht richtig',
    },
  };
  const ui = () => UI[Lang.get()];

  // An exercise is { id, difficulty, title, text, fields: [{key, sym, unit, value}], tol, figure(sol),
  // hints: [html], solution: [html], results: html }.
  let ex = null, st = null, tutor = null, checker = null, topics = null;

  // ---------------------------------------------------------------- persistence
  function stored(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; }
  }
  function store(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
  }
  function showScore() {
    const s = stored('rc-score', { solved: 0, clean: 0 });
    $('#score').textContent = s.solved ? ui().score(s.solved, s.clean) : '';
  }

  function math(el) {
    if (window.renderMathInElement) {
      window.renderMathInElement(el, {
        delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }],
        throwOnError: false,
        // \htmlClass marks the results (highlighted in ui.css).
        trust: (ctx) => ctx.command === '\\htmlClass',
        strict: (code) => (code === 'htmlExtension' ? 'ignore' : 'warn'),
      });
    }
  }

  // Wide circuits scroll horizontally on small screens; say so, since the cut-off part is invisible.
  function markScrollable() {
    document.querySelectorAll('.fig').forEach((fig) => {
      fig.classList.toggle('scrolls', fig.scrollWidth > fig.clientWidth + 1);
    });
  }

  // ---------------------------------------------------------------- input and feedback
  function parse(s) {
    s = s.trim().replace(/,/g, '.').replace(/[−–—‒]/g, '-').replace(/[^\d.)]+$/, '').trim(); // the minus as phones type it
    const m = s.match(/^([-+]?\d*\.?\d+(?:e[-+]?\d+)?)(?:\s*\/\s*(\d*\.?\d+))?$/i);
    if (!m) return NaN;
    return m[2] ? Number(m[1]) / Number(m[2]) : Number(m[1]);
  }

  function judge(x, e, tol) {
    if (Number.isNaN(x)) return { cls: 'bad', msg: ui().number };
    const off = (y) => Math.abs(y - e) / Math.abs(e);
    if (off(x) <= tol) return { cls: 'ok', msg: ui().correct };
    if (off(-x) <= tol) return { cls: 'warn', msg: ui().sign };
    if (off(x / 1000) <= tol || off(x * 1000) <= tol) return { cls: 'warn', msg: ui().prefix };
    if (off(x) <= Math.max(0.05, 2 * tol)) return { cls: 'warn', msg: ui().close };
    return { cls: 'bad', msg: ui().wrong };
  }

  // ---------------------------------------------------------------- exercise lifecycle
  const newSeed = () => 1 + Math.floor(Math.random() * 999999);
  const starsOf = (d) => `<span class="stars" role="img" aria-label="${ui().stars(d)}" title="${ui().stars(d)}">${'★'.repeat(d)}${'☆'.repeat(5 - d)}</span>`;

  // Practice comes back more often to the types of exercise that were hard (shared practice.js).
  const PRACTICE = 'rc', typeOf = (e) => e.ptype || `d${e.difficulty}`;
  // The kind of an exercise, as in the tutor: groups inside groups inside groups (nested), else
  // backwards (a resistance is wanted), else by the circuit: series or parallel only, or one group
  // inside the other (mixed).
  const depth = (node) => (node.t === 'R' ? 0 : 1 + Math.max(...node.kids.map(depth)));
  function kindOf(e) {
    const root = e.circuit.nodes[0], d = depth(root);
    if (d >= 3) return 'nested';
    if (e.targets.some((t) => t[0] === 'R')) return 'backwards';
    return d === 1 ? (root.t === 'S' ? 'series' : 'parallel') : 'mixed';
  }
  // An exercise of a practice type 'kind:level' (e.g. 'mixed:medium'): the first of that level,
  // from the seed on, of that kind.
  function ofType(type, seed) {
    const [kind, lv] = type.split(':');
    for (let k = 0; ; k++) {
      const e = generate(lv, seed * 1000 + k);
      if (kindOf(e) === kind || k >= 5000) { e.ptype = type; return e; }
    }
  }
  const finish = () => { if (ex && st) Practice.finish(PRACTICE, typeOf(ex), st); };

  function open(exercise) {
    finish(); // the student moves on
    ex = exercise;
    st = { tries: 0, hints: 0, solved: false, revealed: false, checked: false, status: null };
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
  const again = (e) => topics.parse(e.id) || generate(e.id.split('-')[0], Number(e.id.split('-')[1]));

  // The topics of practice: those of the tutor's examples, with their stages (lessons.js).
  const topicList = () => window.Lessons.EXAMPLES.map((e) => ({
    name: () => e.name[Lang.get()],
    stages: e.practice.map((s) => ({ name: s.en ? () => s[Lang.get()] : null, types: s.types })),
  }));

  function render() {
    $('#title').innerHTML = `${esc(ex.title)} ${starsOf(ex.difficulty)}`;
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

  // Marks every field; true if all are right, null if some are empty.
  function feedback() {
    let allOk = true, anyEmpty = false;
    for (const f of ex.fields) {
      const row = $('#fields').querySelector(`.field[data-key="${f.key}"]`);
      const raw = row.querySelector('input').value;
      if (!raw.trim()) { anyEmpty = true; allOk = false; row.className = 'field'; row.querySelector('.fb').textContent = ''; continue; }
      const r = judge(parse(raw), f.value, ex.tol);
      row.className = `field ${r.cls}`;
      row.querySelector('.fb').textContent = r.msg;
      if (r.cls !== 'ok') allOk = false;
    }
    return allOk ? true : anyEmpty ? null : false;
  }

  // The status line: null (none), 'fill', 'ok' or 'bad'.
  function showStatus(kind) {
    const el = $('#status');
    if (st) st.status = kind;
    el.className = 'status' + (kind === 'ok' ? ' ok' : kind === 'bad' ? ' bad' : '');
    el.textContent = !kind ? '' : kind === 'fill' ? ui().fill
      : kind === 'ok' ? (st.revealed ? ui().ok : ui().okWell) + (st.advance ? ` ${st.advance}` : '')
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
      if (!st.revealed) {
        const s = stored('rc-score', { solved: 0, clean: 0 });
        s.solved++;
        if (st.tries === 1 && st.hints === 0) s.clean++;
        store('rc-score', s);
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
    finish();
    showSolution();
    updateButtons();
    $('#solution').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---------------------------------------------------------------- check
  // The learning objectives (check.js), each with the practice types it is asked about, its worked
  // example and its practice topic (lessons.js). Each question asks for one unknown of a circuit
  // whose currents and voltages are multiples of 0.5 (no fractions to work with): a voltage or a
  // current, or for working backwards, a resistance. Wrong options: the whole battery voltage or
  // current for one part, the value of its partner in a divider (the ratio turned round), or
  // simple slips.
  const OBJECTIVES = [
    { id: 'divide', kinds: ['series:easy', 'parallel:easy'], tutor: 0, topic: 0,
      name: () => L('Split the voltage in series in the ratio of the resistances, and the current in parallel in the inverse ratio.',
        'Die Spannung in Serie im Verhältnis der Widerstände aufteilen und den Strom parallel im umgekehrten Verhältnis.') },
    { id: 'combine', kinds: ['mixed:medium', 'nested:medium'], tutor: 2, topic: 2,
      name: () => L('Reduce groups of resistors to one equivalent resistance and work out every current and voltage step by step.',
        'Gruppen von Widerständen durch einen Ersatzwiderstand ersetzen und alle Ströme und Spannungen Schritt für Schritt bestimmen.') },
    { id: 'backwards', kinds: ['backwards:easy', 'backwards:medium'], tutor: 3, topic: 3,
      name: () => L('Find an unknown resistance from measured currents and voltages.',
        'Einen unbekannten Widerstand aus gemessenen Strömen und Spannungen bestimmen.') },
  ];
  const half = (f) => Number.isFinite(fval(f)) && Math.abs(2 * fval(f) - Math.round(2 * fval(f))) < 1e-9;
  // A circuit of a practice type and the unknown asked for: a resistance when working backwards,
  // else a voltage or a current.
  function checkCircuit(type, seed) {
    const back = type.startsWith('backwards');
    let e = null, f = null;
    for (let k = 0; k < 400; k++) {
      const c = ofType(type, seed + 7919 * k);
      const ok = c.circuit.nodes.every((n) => half(n.V) && half(n.I));
      const nice = c.fields.filter((x) => (back ? x.key[0] === 'R' && Number.isInteger(x.value) : x.key[0] !== 'R'));
      if ((ok && nice.length) || k === 399) { e = c; f = (nice.length ? nice : c.fields)[seed % (nice.length || c.fields.length)]; break; }
    }
    return { e, f };
  }
  function checkQuestion(type, seed) {
    const { e, f } = checkCircuit(type, seed);
    const c = e.circuit, node = c.nodes[Number(f.key.slice(1))], q = f.key[0];
    const options = [{ value: f.value, correct: true }];
    // options: positive multiples of 0.5, clearly different from each other
    const fits = (x) => x > 0 && Math.abs(2 * x - Math.round(2 * x)) < 1e-9 && options.every((o) => Math.abs(o.value - x) > 0.01 * Math.max(o.value, x) + 1e-9);
    const add = (value, flag, why) => { if (options.length < 4 && fits(value)) options.push({ value, flag, why }); };
    if (q !== 'R' && node !== c.root) {
      add(fval(c.root[q]), 'whole', q === 'V'
        ? L('That is the whole battery voltage: a part in series only gets its share.', 'Das ist die ganze Batteriespannung: Ein Teil in Serie bekommt nur seinen Anteil.')
        : L('That is the whole battery current: a branch in parallel only carries its share.', 'Das ist der ganze Batteriestrom: Ein paralleler Zweig führt nur seinen Anteil.'));
    }
    const parent = c.nodes.find((n) => n.kids && n.kids.includes(node));
    if (parent && q !== 'R') {
      for (const sib of parent.kids) {
        if (sib !== node) add(fval(sib[q]), 'ratio', L('That belongs to the other part: in a divider, the larger share goes to the larger resistance (voltages in series) or the smaller one (currents in parallel).',
          'Das gehört zum anderen Teil: Beim Teiler bekommt der grössere Widerstand den grösseren Anteil (Spannungen in Serie) bzw. den kleineren (Ströme parallel).'));
      }
    }
    for (const n of c.nodes) if (n !== node) add(fval(n[q]), null, null);
    for (const x of [2 * f.value, f.value / 2, f.value + 1, f.value + 2, f.value - 1, 3 * f.value]) add(x, null, null);
    // the options in a fixed order: by size
    options.sort((a, b) => a.value - b.value);
    const unitTex = { V: '\\mathrm{V}', I: '\\mathrm{mA}', R: '\\mathrm{k\\Omega}' }[q];
    const num = (x) => String(parseFloat(x.toFixed(2)));
    return {
      title: e.title,
      // only the quantity asked for: the exercise text lists all its unknowns
      text: `<p>${L('Apply the rules for series and parallel circuits.', 'Wende die Regeln für Serie- und Parallelschaltungen an.')}</p>`,
      figure: e.figure(false, f.key),
      ask: L(`Find $${f.sym}$.`, `Wie gross ist $${f.sym}$?`),
      options: options.map((o) => ({ html: `$${num(o.value)}\\,${unitTex}$`, correct: !!o.correct, flag: o.flag, why: o.why })),
      explain: () => `<div class="figs">${e.figure(true)}</div><div class="steps">${e.solution.map((p) => `<p>${p}</p>`).join('')}</div>`,
      key: `${e.id}|${f.key}`,
    };
  }
  const checkSource = {
    id: 'rc',
    objectives: OBJECTIVES,
    question: checkQuestion,
    concept: { whole: 'whole', ratio: 'ratio' },
    concepts: () => ({
      whole: L('giving one part the whole battery voltage or current', 'einem Teil die ganze Batteriespannung oder den ganzen Strom geben'),
      ratio: L('a divider the wrong way round', 'ein Teiler falsch herum'),
    }),
  };

  // ---------------------------------------------------------------- language
  const lessons = () => window.Lessons.EXAMPLES.map((e, i) => ({
    name: e.name[Lang.get()], idea: e.idea[Lang.get()], also: topics.also(i), frames: () => tutorial(e.level, e.seed, e.path).frames,
  }));

  function applyStatic() {
    document.title = ui().title;
    Lang.apply(ui());
    if (topics) topics.relabel();
  }

  // The same exercise in the other language, with the answers, hints and solution kept.
  function switchLang() {
    applyStatic();
    showScore();
    if (ex) {
      const values = ex.fields.map((f) => $(`#in-${f.key}`).value), keep = st;
      ex = again(ex);
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
    checker.relabel();
  }

  // ---------------------------------------------------------------- modes
  // Practice: random exercises; tutor: worked examples; check: a short test on the learning
  // objectives (check.js). Hints and solution belong to practice.
  const mode = () => (document.querySelector('input[name="mode"]:checked') || {}).value || 'practice';
  function setMode(m) {
    document.querySelector(`input[name="mode"][value="${m}"]`).checked = true;
    store('rc-mode', m);
    document.querySelectorAll('.practice').forEach((el) => { el.hidden = m !== 'practice'; });
    $('#tutor').hidden = m !== 'tutor';
    $('#ck').hidden = m !== 'check';
    if (m !== 'practice') { $('#hints').hidden = true; $('#solution').hidden = true; }
  }
  function practise() {
    setMode('practice');
    if (ex) { history.replaceState(null, '', `#${ex.id}`); $('#hints').hidden = !st.hints; $('#solution').hidden = !st.revealed; markScrollable(); } else fresh();
  }
  function checkMode() {
    setMode('check');
    checker.show();
    if (location.hash !== '#check') history.replaceState(null, '', '#check');
  }

  function fromHash() {
    const h = location.hash.slice(1);
    // the arcade of earlier versions is now the check
    if (h === 'check' || h === 'arcade') { if ($('#ck').hidden) checkMode(); return true; }
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
      if (!ex || ex.id !== h) open(generate(m[1], Number(m[2])));
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------- init
  function init() {
    Lang.init(); // see lang.js
    document.querySelector('main').insertAdjacentHTML('beforeend', Check.HTML);
    applyStatic();
    Lang.wire(switchLang);
    topics = window.Topics.create({
      app: PRACTICE, topics: topicList(),
      make: ofType, typeOf,
      onChange: fresh,
      tutor: (i) => { setMode('tutor'); tutor.open(i); },
    });
    topics.mount($('#levels'));
    $('#new').addEventListener('click', fresh);
    $('#answers').addEventListener('submit', check);
    $('#hint').addEventListener('click', hint);
    $('#reveal').addEventListener('click', reveal);
    window.addEventListener('hashchange', fromHash);
    window.addEventListener('resize', markScrollable);
    tutor = window.createTutor(lessons(), {
      after: () => { fitText($('#t-figure svg')); math($('#tutor')); markScrollable(); },
      done: practise,
      practise: (i) => { topics.go(i); setMode('practice'); fresh(); },
    });
    // circuit diagrams fit their labels to the rendered text (fitText)
    const typeset = (el) => { el.querySelectorAll('.fig svg').forEach((svg) => fitText(svg)); math(el); };
    checker = Check.create(checkSource, {
      math: typeset, markScrollable, stored, store,
      tutor: (i) => { setMode('tutor'); tutor.open(i); },
      practise: (i) => { topics.go(i); setMode('practice'); fresh(); },
    });
    $('#modes').addEventListener('change', () => {
      if (mode() === 'tutor') { setMode('tutor'); tutor.open(tutor.current()); } else if (mode() === 'check') checkMode(); else practise();
    });
    showScore();
    if (fromHash()) return;
    // First visit: start with the first worked example.
    const last = stored('rc-mode', 'tutor');
    if (last === 'tutor') { setMode('tutor'); tutor.open(0); } else if (last === 'check' || last === 'arcade') checkMode(); else { setMode('practice'); fresh(); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
