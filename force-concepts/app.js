(function () {
  'use strict';

  const FC = window.FC, Q = window.Questions, Lang = window.Lang, Arcade = window.Arcade, L = Lang.L;
  const $ = (sel) => document.querySelector(sel);
  const MAX_TRIES = 3;

  // ---------------------------------------------------------------- interface texts
  const UI = {
    en: {
      title: 'Force Concepts', mode: 'Mode', difficulty: 'Difficulty', example: 'Example', tutor: 'Tutor', practice: 'Practice', arcade: 'Arcade', new: 'New exercise',
      levels: { easy: 'Easy', medium: 'Medium', hard: 'Hard', mixed: 'Mixed' },
      stars: (d) => `Difficulty: ${d} of 5`,
      tutorNote: 'Use the arrow keys ← → to step through. Arrows in the pictures: <span class="k-f">forces</span>, <span class="k-v">velocities</span>, <span class="k-a">accelerations</span> and the <span class="k-net">net force</span>.',
      check: 'Check', reveal: 'Show solution', hints: 'Hints', solution: 'Solution', reset: 'Reset', close: 'Close',
      revealNote: 'The worked solution unlocks once you have solved the exercise, used all hints or made three attempts.',
      profile: 'Your typical slips', correct: 'Correct:',
      profileEmpty: 'Nothing recorded yet. Wrong answers that stem from a misconception, and exercise types you find hard, will show up here.',
      profileNote: 'How often each misconception was behind one of your wrong answers, and what is correct instead. The exercises are written in the spirit of the Force Concept Inventory; they are not its items.',
      score: (s, c) => `Solved: ${s} · first try without hints: ${c}`,
      hint: (n) => `Hint (${n} left)`, noHints: 'No more hints', unlocks: (n) => `Unlocks after all hints or ${n} attempts`,
      choose: 'Answer every question (every statement, item and reason), then check again.',
      ok: 'All correct.', okWell: 'All correct, well done! Compare your reasoning with the worked solution, or start a new exercise.',
      notYet: (n) => `Not quite yet (attempt ${n}).`, tryAgain: ' Read the feedback and try again, or take a hint.', canReveal: ' You can take a hint or look at the worked solution.',
      task: 'The task', answers: 'The answers', wrong: 'Typical wrong answers',
      profileTypes: 'Coming up more often',
      profileTypesNote: 'Exercise types you found hard come up more often in practice, until you solve them easily.',
      often: (w) => `about ${Math.round(w * 10) / 10}× as often as a mastered type`,
    },
    de: {
      title: 'Kraftkonzepte', mode: 'Modus', difficulty: 'Schwierigkeit', example: 'Beispiel', tutor: 'Tutor', practice: 'Üben', arcade: 'Arcade', new: 'Neue Aufgabe',
      levels: { easy: 'Einfach', medium: 'Mittel', hard: 'Schwierig', mixed: 'Gemischt' },
      stars: (d) => `Schwierigkeit: ${d} von 5`,
      tutorNote: 'Mit den Pfeiltasten ← → blätterst du weiter. Pfeile in den Bildern: <span class="k-f">Kräfte</span>, <span class="k-v">Geschwindigkeiten</span>, <span class="k-a">Beschleunigungen</span> und die <span class="k-net">resultierende Kraft</span>.',
      check: 'Prüfen', reveal: 'Lösung zeigen', hints: 'Tipps', solution: 'Lösung', reset: 'Zurücksetzen', close: 'Schliessen',
      revealNote: 'Die ausführliche Lösung wird freigeschaltet, sobald du die Aufgabe gelöst, alle Tipps genutzt oder drei Versuche gemacht hast.',
      profile: 'Deine typischen Fehler', correct: 'Richtig:',
      profileEmpty: 'Noch nichts erfasst. Falsche Antworten, hinter denen eine Fehlvorstellung steckt, und Aufgabentypen, die dir schwerfallen, erscheinen hier.',
      profileNote: 'Wie oft jede Fehlvorstellung hinter einer deiner falschen Antworten steckte, und was stattdessen richtig ist. Die Aufgaben sind im Sinne des Force Concept Inventory geschrieben; sie stammen nicht daraus.',
      score: (s, c) => `Gelöst: ${s} · beim ersten Versuch ohne Tipps: ${c}`,
      hint: (n) => `Tipp (${n} übrig)`, noHints: 'Keine Tipps mehr', unlocks: (n) => `Wird nach allen Tipps oder ${n} Versuchen freigeschaltet`,
      choose: 'Beantworte jede Frage (jede Aussage, jedes Element und die Begründung) und prüfe dann nochmals.',
      ok: 'Alles richtig.', okWell: 'Alles richtig, gut gemacht! Vergleiche deine Überlegungen mit der ausführlichen Lösung oder starte eine neue Aufgabe.',
      notYet: (n) => `Noch nicht ganz (Versuch ${n}).`, tryAgain: ' Lies die Rückmeldungen und versuche es nochmals, oder nimm einen Tipp.', canReveal: ' Du kannst einen Tipp nehmen oder die ausführliche Lösung anschauen.',
      task: 'Die Aufgabe', answers: 'Die Antworten', wrong: 'Typische falsche Antworten',
      profileTypes: 'Kommt häufiger dran',
      profileTypesNote: 'Aufgabentypen, die dir schwergefallen sind, kommen beim Üben häufiger, bis du sie mühelos löst.',
      often: (w) => `etwa ${String(Math.round(w * 10) / 10)}-mal so oft wie ein beherrschter Typ`,
    },
  };
  const ui = () => UI[FC.getLang()];

  let ex = null, st = null, tutor = null, arcade = null;

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
    const slips = rows.reduce((n, [, k]) => n + k, 0);
    $('#profile-empty').hidden = rows.length > 0 || hard.length > 0;
    $('#profile-btn-label').textContent = ui().profile;
    $('#profile-badge').textContent = slips;
    $('#profile-badge').hidden = !slips;
    $('#profile-list').innerHTML = rows.map(([c, k]) =>
      `<li><span class="count">${k}×</span> <b>${FC.mis(c).name}</b>: ${FC.mis(c).text}<span class="fix"><b>${ui().correct}</b> ${FC.mis(c).fix}</span></li>`).join('');
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
  const starsOf = (d) => `<span class="stars" role="img" aria-label="${ui().stars(d)}" title="${ui().stars(d)}">${'★'.repeat(d)}${'☆'.repeat(5 - d)}</span>`;

  function render() {
    $('#title').innerHTML = `${ex.title} ${starsOf(ex.difficulty)}`;
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
  const level = () => (document.querySelector('input[name="level"]:checked') || {}).value || 'easy';

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
    const lv = level();
    open(FC.generate(lv, FC.freshSeed(lv, 'all', stored('fc-recent', []), Math.random, stored('fc-types', {}))));
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
    const cb = $('#check');
    cb.textContent = st.solved ? ui().new : ui().check;
    cb.classList.toggle('primary', !st.solved);
    cb.classList.toggle('new-btn', st.solved);
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
    if (st.solved) { fresh(); return; } // the button reads New exercise
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

  // ---------------------------------------------------------------- arcade
  // Each question is a single-choice question with four options (a prediction counts too) from
  // an exercise of the right difficulty; the misconception codes of the wrong options are the
  // arcade's misconceptions.
  const arcadeTypes = (d) => FC.pool('mixed').filter((g) => FC.DIFFICULTY[g.name] === d);
  function arcadeQuestion(kind, seed) {
    const types = arcadeTypes(Number(kind.slice(1)));
    for (let k = 0; ; k++) {
      const s = (seed + 7919 * k) >>> 0, r = FC.rng(s), g = r.pick(types), e = FC.build(g.name, g.params, s);
      const qs = FC.arcadeQuestions(e, r);
      if (!qs.length) continue;
      const qu = r.pick(qs);
      return {
        title: e.title,
        text: e.situation,
        figure: `<figure class="fig">${e.figure}</figure>`,
        ask: qu.ask,
        options: qu.options.map((x) => ({ html: x.html, correct: x.ok, flag: FC.MIS[x.code] ? x.code : null, why: x.ok ? '' : x.why })),
        explain: () => `<div class="steps">${e.steps.map(stepHtml).join('')}</div>`,
      };
    }
  }
  const arcadeSource = {
    id: 'fc',
    kinds: [1, 2, 3, 4, 5].map((d) => ({ id: `d${d}`, difficulty: d })),
    question: arcadeQuestion,
    concept: Object.fromEntries(Object.keys(FC.MIS).map((c) => [c, c])),
    concepts: () => Object.fromEntries(Object.keys(FC.MIS).map((c) => [c, FC.mis(c).name.toLowerCase()])),
    intro: () => ({
      tag: L('Forces and motion: answer as many questions as you can in <b>5 minutes</b>.', 'Kräfte und Bewegung: Beantworte in <b>5 Minuten</b> so viele Fragen wie möglich.'),
      rule: L('Questions get harder as you go. Each describes a situation; choose one of four answers. Click an answer or press 1–4.',
        'Die Fragen werden nach und nach schwieriger. Jede beschreibt eine Situation; wähle eine von vier Antworten. Klicke eine Antwort an oder drücke 1–4.'),
      example: L('thinking that motion needs a force', 'denken, dass Bewegung eine Kraft braucht'),
    }),
    // the ball at the top of its throw (the first worked example), and Newton's second law
    hero: () => {
      const e = FC.build('throw', { kind: 'vertical', phase: 'top', obj: 'ball' });
      return `<div class="figs"><figure class="fig">${e.steps[e.steps.length - 1].figure}</figure></div><p class="ar-law">${FC.F('net')} = <i>m</i> · <i>a</i></p>`;
    },
  };

  // ---------------------------------------------------------------- language
  function applyStatic() {
    document.title = ui().title;
    Lang.apply(ui());
    const cur = $('#levels').childElementCount ? level() : stored('fc-level', 'easy');
    $('#levels').innerHTML = Object.entries(ui().levels).map(([k, n]) => `
      <label><input type="radio" name="level" value="${k}"${k === cur ? ' checked' : ''}><span>${n}</span></label>`).join('');
  }

  // Same exercise (same seed) in the other language: the options keep their order, so the
  // chosen answers, feedback, hints and solution carry over.
  function switchLang() {
    applyStatic();
    showScore();
    showProfile();
    if (ex) {
      const states = ex.questions.map(Q.state);
      const [, key, f, seed] = ex.id.match(ID);
      ex = FC.generate(key, Number(seed), f || 'all');
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
    arcade.relabel();
  }

  // Exercise ids: level-seed; older links topic-seed or topic-format-seed.
  const ID = /^(easy|medium|hard|mixed|gravity|inertia|force|interact)(?:-(choice|sort|predict|tf))?-(\d+)$/;

  // ---------------------------------------------------------------- modes
  // Practice: random exercises; tutor: worked examples; arcade: a timed game (arcade.js). Hints,
  // solution and profile belong to practice. Leaving the arcade ends a running game.
  const mode = () => (document.querySelector('input[name="mode"]:checked') || {}).value || 'practice';
  function setMode(m) {
    document.querySelector(`input[name="mode"][value="${m}"]`).checked = true;
    store('fc-mode', m);
    document.querySelectorAll('.practice').forEach((el) => { el.hidden = m !== 'practice'; });
    $('#tutor').hidden = m !== 'tutor';
    $('#arcade').hidden = m !== 'arcade';
    if (m !== 'practice') { $('#hints').hidden = true; $('#solution').hidden = true; }
    if (m !== 'arcade') arcade.stop();
    if (m !== 'practice' && $('#profile').open) $('#profile').close();
    showProfile();
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
    m = h.match(ID);
    if (m) {
      setMode('practice');
      const lv = document.querySelector(`input[name="level"][value="${m[1]}"]`);
      if (lv) lv.checked = true;
      if (!ex || ex.id !== h) open(FC.generate(m[1], Number(m[3]), m[2] || 'all'));
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
    $('#levels').addEventListener('change', () => { store('fc-level', level()); fresh(); });
    $('#new').addEventListener('click', fresh);
    $('#answers').addEventListener('submit', check);
    // A new answer clears the marks on that part of the question.
    $('#fields').addEventListener('change', (evt) => Q.clearAt(evt.target));
    Q.attach($('#fields'));
    $('#hint').addEventListener('click', hint);
    $('#reveal').addEventListener('click', reveal);
    $('#reset-profile').addEventListener('click', () => { store('fc-mis', {}); store('fc-types', {}); showProfile(); });
    // The “typical slips” overlay: closes with ×, Escape or a click on the backdrop.
    const profile = $('#profile');
    $('#profile-btn').addEventListener('click', () => { showProfile(); profile.showModal(); });
    $('#close-profile').addEventListener('click', () => profile.close());
    profile.addEventListener('click', (evt) => {
      if (evt.target !== profile) return;
      const r = profile.getBoundingClientRect();
      if (evt.clientX < r.left || evt.clientX > r.right || evt.clientY < r.top || evt.clientY > r.bottom) profile.close();
    });
    window.addEventListener('hashchange', fromHash);

    tutor = window.createTutor(lessons(), { done: practise });
    arcade = Arcade.create(arcadeSource, { math: () => {}, markScrollable: () => {}, stored, store });
    $('#modes').addEventListener('change', () => {
      if (mode() === 'tutor') { setMode('tutor'); tutor.open(tutor.current()); } else if (mode() === 'arcade') play(); else practise();
    });
    showScore();
    if (fromHash()) return;
    // First visit: start with the first worked example.
    const last = stored('fc-mode', 'tutor');
    if (last === 'tutor') { setMode('tutor'); tutor.open(0); } else if (last === 'arcade') play(); else { setMode('practice'); fresh(); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
