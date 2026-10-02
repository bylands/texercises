(function () {
  'use strict';

  const FC = window.FC, Q = window.Questions;
  const $ = (sel) => document.querySelector(sel);
  const MAX_TRIES = 3;

  // ---------------------------------------------------------------- interface texts
  const UI = {
    en: {
      title: 'Force Concepts', mode: 'Mode', topic: 'Topic', format: 'Format', example: 'Example', tutor: 'Tutor', practice: 'Practice', new: 'New exercise',
      tutorNote: 'Use the arrow keys ← → to step through. Arrows in the pictures: <span class="k-f">forces</span>, <span class="k-v">velocities</span>, <span class="k-a">accelerations</span> and the <span class="k-net">net force</span>.',
      check: 'Check', reveal: 'Show solution', hints: 'Hints', solution: 'Solution', reset: 'Reset',
      revealNote: 'The worked solution unlocks once you have solved the exercise, used all hints or made three attempts.',
      profile: 'Your typical slips',
      profileNote: 'How often each misconception was behind one of your wrong answers. The exercises are written in the spirit of the Force Concept Inventory; they are not its items.',
      score: (s, c) => `Solved: ${s} · first try without hints: ${c}`,
      hint: (n) => `Hint (${n} left)`, noHints: 'No more hints', unlocks: (n) => `Unlocks after all hints or ${n} attempts`,
      choose: 'Answer every question (every statement, item and reason), then check again.',
      ok: 'All correct.', okWell: 'All correct, well done! Compare your reasoning with the worked solution, or start a new exercise.',
      notYet: (n) => `Not quite yet (attempt ${n}).`, tryAgain: ' Read the feedback and try again, or take a hint.', canReveal: ' You can take a hint or look at the worked solution.',
      task: 'The task', answers: 'The answers', wrong: 'Typical wrong answers',
      profileTypes: 'Coming up more often',
      profileTypesNote: 'Exercise types you found hard come up more often in practice, until you solve them easily.',
      often: (w) => `about ${Math.round(w * 10) / 10}× as often as a mastered type`,
      tutorBtns: { example: (i, n) => `Example ${i} of ${n}`, back: '← Back', prevEx: '← Previous example', next: 'Next →', nextEx: 'Next example →', done: 'Practise on your own →' },
    },
    de: {
      title: 'Kraftkonzepte', mode: 'Modus', topic: 'Thema', format: 'Format', example: 'Beispiel', tutor: 'Tutor', practice: 'Üben', new: 'Neue Aufgabe',
      tutorNote: 'Mit den Pfeiltasten ← → blätterst du weiter. Pfeile in den Bildern: <span class="k-f">Kräfte</span>, <span class="k-v">Geschwindigkeiten</span>, <span class="k-a">Beschleunigungen</span> und die <span class="k-net">resultierende Kraft</span>.',
      check: 'Prüfen', reveal: 'Lösung zeigen', hints: 'Tipps', solution: 'Lösung', reset: 'Zurücksetzen',
      revealNote: 'Die ausführliche Lösung wird freigeschaltet, sobald du die Aufgabe gelöst, alle Tipps genutzt oder drei Versuche gemacht hast.',
      profile: 'Deine typischen Fehler',
      profileNote: 'Wie oft jede Fehlvorstellung hinter einer deiner falschen Antworten steckte. Die Aufgaben sind im Sinne des Force Concept Inventory geschrieben; sie stammen nicht daraus.',
      score: (s, c) => `Gelöst: ${s} · beim ersten Versuch ohne Tipps: ${c}`,
      hint: (n) => `Tipp (${n} übrig)`, noHints: 'Keine Tipps mehr', unlocks: (n) => `Wird nach allen Tipps oder ${n} Versuchen freigeschaltet`,
      choose: 'Beantworte jede Frage (jede Aussage, jedes Element und die Begründung) und prüfe dann nochmals.',
      ok: 'Alles richtig.', okWell: 'Alles richtig, gut gemacht! Vergleiche deine Überlegungen mit der ausführlichen Lösung oder starte eine neue Aufgabe.',
      notYet: (n) => `Noch nicht ganz (Versuch ${n}).`, tryAgain: ' Lies die Rückmeldungen und versuche es nochmals, oder nimm einen Tipp.', canReveal: ' Du kannst einen Tipp nehmen oder die ausführliche Lösung anschauen.',
      task: 'Die Aufgabe', answers: 'Die Antworten', wrong: 'Typische falsche Antworten',
      profileTypes: 'Kommt häufiger dran',
      profileTypesNote: 'Aufgabentypen, die dir schwergefallen sind, kommen beim Üben häufiger, bis du sie mühelos löst.',
      often: (w) => `etwa ${String(Math.round(w * 10) / 10)}-mal so oft wie ein beherrschter Typ`,
      tutorBtns: { example: (i, n) => `Beispiel ${i} von ${n}`, back: '← Zurück', prevEx: '← Vorheriges Beispiel', next: 'Weiter →', nextEx: 'Nächstes Beispiel →', done: 'Selbst üben →' },
    },
  };
  const ui = () => UI[FC.getLang()];

  let ex = null, st = null, tutor = null;

  // ---------------------------------------------------------------- persistence
  function stored(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; }
  }
  function store(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
  }
  function showScore() {
    const s = stored('fc-score', { solved: 0, clean: 0 });
    $('#score').textContent = s.solved ? ui().score(s.solved, s.clean) : '';
  }

  // How often each misconception showed up in wrong answers (once per option and exercise).
  function showProfile() {
    const tally = stored('fc-mis', {});
    const rows = Object.entries(tally).filter(([c]) => FC.MIS[c]).sort((a, b) => b[1] - a[1]);
    // the types that come up more often, because they were hard
    const hard = Object.entries(stored('fc-types', {})).filter(([g, x]) => x.s >= 0.4 && FC.TYPE_NAMES[g]).sort((a, b) => b[1].s - a[1].s);
    $('#profile').hidden = (!rows.length && !hard.length) || $('#task').hidden;
    $('#profile-list').innerHTML = rows.map(([c, k]) =>
      `<li><span class="count">${k}×</span> <b>${FC.mis(c).name}</b>: ${FC.mis(c).text}</li>`).join('');
    $('#profile-mis').hidden = !rows.length;
    $('#profile-types').hidden = !hard.length;
    $('#profile-types-list').innerHTML = hard.map(([g, x]) => `<li><b>${FC.typeName(g)}</b> <span class="count">${ui().often(FC.weightOf(stored('fc-types', {}), g))}</span></li>`).join('');
  }

  // How the exercise went, for choosing the next ones: 0 right at once … 1 solution needed.
  function record(score) {
    if (!ex || st.recorded) return;
    st.recorded = true;
    store('fc-types', FC.recordResult(stored('fc-types', {}), ex.gen, score));
    showProfile();
  }
  const tag = Q.tag;

  // ---------------------------------------------------------------- rendering

  function render() {
    $('#title').textContent = ex.title;
    $('#situation').innerHTML = ex.situation;
    $('#figure').innerHTML = ex.figure;
    $('#fields').innerHTML = ex.questions.map((qu, k) => Q.html(qu, k)).join('');
    $('#hint-list').innerHTML = '';
    $('#hints').hidden = true;
    $('#solution').hidden = true;
    showStatus();
    updateButtons();
  }

  const stepHtml = (s) => `<h4>${s.title}</h4><div class="figs">${s.figure}</div><p>${s.text}</p>`;
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  // ---------------------------------------------------------------- exercise lifecycle
  const topic = () => (document.querySelector('input[name="topic"]:checked') || {}).value || 'mixed';
  const format = () => (document.querySelector('input[name="format"]:checked') || {}).value || 'all';

  function open(exercise) {
    if (ex && st.tries > 0 && !st.recorded) record(0.75); // left unsolved after trying
    ex = exercise;
    st = { tries: 0, hints: 0, solved: false, revealed: false, counted: new Set(), status: null, checked: [] };
    // the types shown last, so that a new exercise is of a different type
    store('fc-recent', [...stored('fc-recent', []), ex.gen].slice(-10));
    const hash = `#${ex.id}`;
    if (location.hash !== hash) history.replaceState(null, '', hash);
    render();
  }

  function fresh() {
    const t = topic(), f = format();
    open(FC.generate(t, FC.freshSeed(t, f, stored('fc-recent', []), Math.random, stored('fc-types', {})), f));
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
  }

  // The status line, kept as a state so that it can be rewritten in the other language.
  function showStatus() {
    const s = $('#status'), k = st && st.status;
    s.textContent = !k ? '' : k === 'choose' ? ui().choose : k === 'ok' ? (st.okPlain ? ui().ok : ui().okWell)
      : ui().notYet(st.tries) + (canReveal() ? ui().canReveal : ui().tryAgain);
    s.className = `status${k === 'ok' ? ' ok' : k === 'bad' ? ' bad' : ''}`;
  }

  // Marks the checked answers right or wrong, with the explanations; a question whose answer
  // changed since the last check stays unmarked.
  function showFeedback() {
    ex.questions.forEach((qu, k) => {
      const now = Q.state(qu);
      if (st.checked[k] !== undefined && same(now, st.checked[k])) Q.paint(qu, Q.evaluate(qu, now)); else Q.clear(qu);
    });
  }

  function check(evt) {
    evt.preventDefault();
    const states = ex.questions.map(Q.state), evs = ex.questions.map((qu, k) => Q.evaluate(qu, states[k]));
    const allOk = evs.every((e) => e.ok), anyEmpty = evs.some((e) => !e.complete);
    const tally = stored('fc-mis', {});
    ex.questions.forEach((qu, k) => {
      for (const m of evs[k].misses) {
        const key = `${qu.key}|${m.id}`;
        if (st.counted.has(key) || st.revealed) continue;
        st.counted.add(key);
        tally[m.code] = (tally[m.code] || 0) + 1;
      }
    });
    store('fc-mis', tally);
    st.checked = states;
    showFeedback();
    showProfile();
    if (anyEmpty && !allOk) {
      st.status = 'choose';
      showStatus();
      return;
    }
    st.tries++;
    if (allOk) {
      if (!st.solved && !st.revealed) {
        const s = stored('fc-score', { solved: 0, clean: 0 });
        s.solved++;
        if (st.tries === 1 && st.hints === 0) s.clean++;
        store('fc-score', s);
        showScore();
      }
      st.okPlain = st.revealed;
      if (!st.revealed) record(Math.min(1, 0.3 * (st.tries - 1) + 0.2 * st.hints));
      st.solved = true;
      st.status = 'ok';
    } else st.status = 'bad';
    showStatus();
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

  function showSolution() {
    $('#sol-steps').innerHTML = ex.steps.map(stepHtml).join('');
    $('#sol-short').innerHTML = ex.questions.map((qu, k) => `<li><span class="qn">${k + 1}</span>${FC.answerText(qu)}</li>`).join('');
    $('#solution').hidden = false;
  }
  function reveal() {
    if (!canReveal()) return;
    st.revealed = true;
    if (!st.solved) record(1);
    showSolution();
    updateButtons();
    $('#solution').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---------------------------------------------------------------- tutor
  // Frames: the task, the steps of the worked solution, then the answers and the typical wrong
  // answers with the misconception behind each.
  function lesson(def) {
    const lang = FC.getLang();
    return {
      name: def.name[lang],
      idea: def.idea[lang],
      frames: () => {
        const e = FC.build(def.gen, def.params);
        // The questions as in practice, but read-only; single-choice ones as a list of prompts.
        const simple = e.questions.every((qu) => qu.type === 'choice');
        const task = {
          text: `<div class="step-rule">${ui().task}</div>${e.situation}` + (simple
            ? `<ol class="tq">${e.questions.map((qu) => `<li>${qu.prompt}</li>`).join('')}</ol>`
            : `<div class="preview">${e.questions.map((qu, k) => Q.html(qu, k, true)).join('')}</div>`),
          figure: `<div class="fig">${e.figure}</div>`,
        };
        const steps = e.steps.map((s) => ({ text: `<div class="step-rule">${s.title}</div><p>${s.text}</p>`, figure: `<div class="fig">${s.figure}</div>` }));
        const answers = e.questions.map((qu, k) => {
          const [lq, rq] = lang === 'de' ? ['„', '“'] : ['“', '”'];
          const wrong = FC.misreads(qu).map((x) => `<li><i>${lq}${x.text}${rq}</i>${tag(x.code)}<br>${x.why}</li>`).join('');
          const answer = FC.answerText(qu);
          return `<p><span class="qn">${k + 1}</span>${qu.prompt} ${qu.type === 'tf' ? `<br>${answer}` : `<b>${answer}</b>`}</p><details><summary>${ui().wrong}</summary><ul class="wrong">${wrong}</ul></details>`;
        }).join('');
        const last = { text: `<div class="step-rule">${ui().answers}</div>${answers}`, figure: steps[steps.length - 1].figure };
        return [task, ...steps, last];
      },
    };
  }
  const lessons = () => window.Lessons.EXAMPLES.map(lesson);

  // ---------------------------------------------------------------- language
  function applyStatic(cur = topic()) {
    const lang = FC.getLang();
    document.documentElement.lang = lang;
    document.title = ui().title;
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = ui()[el.dataset.i18n]; });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = ui()[el.dataset.i18nHtml]; });
    document.querySelectorAll('[data-i18n-label]').forEach((el) => { el.setAttribute('aria-label', ui()[el.dataset.i18nLabel]); });
    document.querySelector(`input[name="lang"][value="${lang}"]`).checked = true;
    $('#topics').innerHTML = Object.keys(FC.TOPICS).map((k) => `
      <label><input type="radio" name="topic" value="${k}"${k === cur ? ' checked' : ''}><span>${FC.topicName(k)}</span></label>`).join('');
    const curF = $('#formats').childElementCount ? format() : stored('fc-format', 'all');
    $('#formats').innerHTML = Object.keys(FC.FORMATS).map((k) => `
      <label><input type="radio" name="format" value="${k}"${k === curF ? ' checked' : ''}><span>${FC.formatName(k)}</span></label>`).join('');
  }

  // Same exercise (same seed) in the other language: the options keep their order, so the
  // chosen answers, feedback, hints and solution carry over.
  function switchLang(lang) {
    FC.setLang(lang);
    store('fc-lang', lang);
    applyStatic();
    showScore();
    showProfile();
    if (ex) {
      const states = ex.questions.map(Q.state);
      const [, t, f, seed] = ex.id.match(ID);
      ex = FC.generate(t, Number(seed), f || 'all');
      const keep = { ...st };
      render();
      st = keep;
      ex.questions.forEach((qu, k) => Q.setState(qu, states[k]));
      showFeedback();
      showStatus();
      showHints();
      if (st.revealed) showSolution();
      if ($('#task').hidden) { $('#hints').hidden = true; $('#solution').hidden = true; }
      updateButtons();
    }
    tutor.relabel(lessons());
  }

  // Exercise ids: topic-seed, or topic-format-seed.
  const ID = /^(mixed|gravity|inertia|force|interact)(?:-(choice|sort|predict|tf))?-(\d+)$/;

  // ---------------------------------------------------------------- modes
  // Practice: random exercises; tutor: worked examples. Hints, solution and profile belong to practice.
  const mode = () => (document.querySelector('input[name="mode"]:checked') || {}).value || 'practice';
  function setMode(m) {
    document.querySelector(`input[name="mode"][value="${m}"]`).checked = true;
    store('fc-mode', m);
    document.querySelectorAll('.practice').forEach((el) => { el.hidden = m !== 'practice'; });
    $('#tutor').hidden = m !== 'tutor';
    if (m === 'tutor') { $('#hints').hidden = true; $('#solution').hidden = true; }
    showProfile();
  }
  function practise() {
    setMode('practice');
    if (ex) { history.replaceState(null, '', `#${ex.id}`); $('#hints').hidden = !st.hints; $('#solution').hidden = !st.revealed; } else fresh();
  }

  function fromHash() {
    const h = location.hash.slice(1);
    let m = h.match(/^tutor-(\d+)$/);
    if (m && Number(m[1]) >= 1 && Number(m[1]) <= tutor.count) {
      setMode('tutor');
      if (tutor.current() !== Number(m[1]) - 1 || !tutor.shown()) tutor.open(Number(m[1]) - 1);
      return true;
    }
    m = h.match(ID);
    if (m) {
      setMode('practice');
      document.querySelector(`input[name="topic"][value="${m[1]}"]`).checked = true;
      document.querySelector(`input[name="format"][value="${m[2] || 'all'}"]`).checked = true;
      if (!ex || ex.id !== h) open(FC.generate(m[1], Number(m[3]), m[2] || 'all'));
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------- init
  function init() {
    // Language: ?lang=de in the address, else the last choice, else the browser's language.
    const asked = new URLSearchParams(location.search).get('lang');
    const browser = (navigator.language || 'en').toLowerCase().startsWith('de') ? 'de' : 'en';
    FC.setLang(FC.LANGS.includes(asked) ? asked : stored('fc-lang', browser));
    applyStatic(stored('fc-topic', 'mixed'));
    $('#topics').addEventListener('change', () => { store('fc-topic', topic()); fresh(); });
    $('#formats').addEventListener('change', () => { store('fc-format', format()); fresh(); });
    $('#langs').addEventListener('change', (evt) => switchLang(evt.target.value));
    $('#new').addEventListener('click', fresh);
    $('#answers').addEventListener('submit', check);
    // A new answer clears the marks on that part of the question.
    $('#fields').addEventListener('change', (evt) => Q.clearAt(evt.target));
    $('#hint').addEventListener('click', hint);
    $('#reveal').addEventListener('click', reveal);
    $('#reset-profile').addEventListener('click', () => { store('fc-mis', {}); store('fc-types', {}); showProfile(); });
    window.addEventListener('hashchange', fromHash);

    tutor = window.createTutor(lessons(), { done: practise, t: () => ui().tutorBtns });
    $('#modes').addEventListener('change', () => {
      if (mode() === 'tutor') { setMode('tutor'); tutor.open(tutor.current()); } else practise();
    });
    showScore();
    if (fromHash()) return;
    // First visit: start with the first worked example.
    if (stored('fc-mode', 'tutor') === 'tutor') { setMode('tutor'); tutor.open(0); } else { setMode('practice'); fresh(); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
