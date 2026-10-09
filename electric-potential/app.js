(function () {
  'use strict';

  const C = window.Charges, X = window.PotEx, Figs = window.PotFigures;
  const Lang = window.Lang, Arcade = window.Arcade, L = Lang.L;
  const $ = (sel) => document.querySelector(sel);

  // ---------------------------------------------------------------- interface texts
  const UI = {
    en: {
      title: 'Electric Potential', mode: 'Mode', difficulty: 'Difficulty', example: 'Example',
      tutor: 'Tutor', practice: 'Practice', real: 'Problems', arcade: 'Arcade', new: 'New exercise', problem: 'Problem', newNumbers: 'New numbers', nextProblem: 'Next problem',
      tutorNote: 'Use the arrow keys ← → to step through. Blue: field lines, orange: equipotential lines, red: force.',
      check: 'Check', reveal: 'Show solution', hints: 'Hints', solution: 'Solution', option: (k) => `Option ${k}`,
      revealNote: (n) => `The solution unlocks once you have solved the exercise, used all hints or made ${n} attempts.`,
      stars: (d) => `Difficulty: ${d} of 5`, score: (s, c) => `Solved: ${s} · first try without hints: ${c}`,
      hint: (n) => `Hint (${n} left)`, noHints: 'No more hints', unlocks: (n) => `Unlocks after all hints or ${n} attempts`,
      fill: 'Answer every question, then check.', okWell: 'All correct, well done!',
      notYet: (n) => `Not quite yet (attempt ${n}).`, tryAgain: ' Try again, or take a hint.', canReveal: ' You can take a hint or look at the solution.',
      correct: 'Correct', notThis: 'Not this one: check your reasoning, or take a hint.', notAll: 'Not all the answers that fit are chosen yet.', stmtsWrong: (n) => (n === 1 ? 'One statement is judged wrong.' : `${n} statements are judged wrong.`), missed: 'This one fits too:', shown: 'The right answers are marked.',
    },
    de: {
      title: 'Elektrisches Potential', mode: 'Modus', difficulty: 'Schwierigkeit', example: 'Beispiel',
      tutor: 'Tutor', practice: 'Üben', real: 'Praxisaufgaben', arcade: 'Arcade', new: 'Neue Aufgabe', problem: 'Aufgabe', newNumbers: 'Neue Zahlen', nextProblem: 'Nächste Aufgabe',
      tutorNote: 'Mit den Pfeiltasten ← → blätterst du weiter. Blau: Feldlinien, orange: Äquipotentiallinien, rot: Kraft.',
      check: 'Prüfen', reveal: 'Lösung zeigen', hints: 'Tipps', solution: 'Lösung', option: (k) => `Antwort ${k}`,
      revealNote: (n) => `Die Lösung wird freigeschaltet, sobald du die Aufgabe gelöst, alle Tipps genutzt oder ${n} Versuche gemacht hast.`,
      stars: (d) => `Schwierigkeit: ${d} von 5`, score: (s, c) => `Gelöst: ${s} · beim ersten Versuch ohne Tipps: ${c}`,
      hint: (n) => `Tipp (${n} übrig)`, noHints: 'Keine Tipps mehr', unlocks: (n) => `Wird nach allen Tipps oder ${n} Versuchen freigeschaltet`,
      fill: 'Beantworte jede Frage und prüfe dann.', okWell: 'Alles richtig, gut gemacht!',
      notYet: (n) => `Noch nicht ganz (Versuch ${n}).`, tryAgain: ' Versuche es nochmals, oder nimm einen Tipp.', canReveal: ' Du kannst einen Tipp nehmen oder die Lösung anschauen.',
      correct: 'Richtig', notThis: 'Das stimmt nicht: Überprüfe deine Überlegung, oder nimm einen Hinweis.', notAll: 'Noch sind nicht alle passenden Antworten gewählt.', stmtsWrong: (n) => (n === 1 ? 'Eine Aussage ist falsch beurteilt.' : `${n} Aussagen sind falsch beurteilt.`), missed: 'Auch diese passt:', shown: 'Die richtigen Antworten sind markiert.',
    },
  };
  const ui = () => UI[Lang.get()];

  let ex = null, st = null, tutor = null, arcade = null, topics = null, problems = null;
  function stored(key, fallback) { try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; } }
  function store(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ } }
  function showScore() { const s = stored('ep-score', { solved: 0, clean: 0 }); $('#score').textContent = s.solved ? ui().score(s.solved, s.clean) : ''; }
  const starsOf = (d) => `<span class="stars" role="img" aria-label="${ui().stars(d)}" title="${ui().stars(d)}">${'★'.repeat(d)}${'☆'.repeat(5 - d)}</span>`;
  const pic = (e) => (e.pic ? Figs[e.pic[0]](e.pic[1]) : '');

  // ---------------------------------------------------------------- questions
  // tiles: directions or names (one, or all that fit); pick: drawings; choice: a row of options;
  // multi: statements to tick.
  function questionHtml(q) {
    if (q.type === 'tiles') {
      return `<p class="ask">${q.label}</p><div class="tiles" role="${q.multi ? 'group' : 'radiogroup'}">${q.options.map((o, k) => `<label class="tile" data-k="${k}"><input type="${q.multi ? 'checkbox' : 'radio'}" name="q-${q.key}" value="${k}">${o.html}</label>`).join('')}</div><ul class="qfb" data-fb="${q.key}"></ul>`;
    }
    if (q.type === 'pick') {
      return `<p class="ask">${q.label}</p><div class="cands" role="radiogroup">${q.options.map((o, k) => `<label class="cand" data-k="${k}"><input type="radio" name="q-${q.key}" value="${k}"><span class="letter">${k + 1}</span>${o.html}</label>`).join('')}</div><ul class="qfb" data-fb="${q.key}"></ul>`;
    }
    if (q.type === 'multi') {
      return `<ul class="stmts">${q.statements.map((s, k) => `<li data-k="${k}"><label><input type="checkbox" name="q-${q.key}" value="${k}"><span>${s.html}</span></label><span class="fb"></span></li>`).join('')}</ul><p class="fb stmts-fb" data-fb="${q.key}"></p>`;
    }
    return `<div class="field" data-key="${q.key}"><span class="what">${q.label}</span><div class="opts" role="radiogroup">${q.options.map((o, k) => `<label><input type="radio" name="q-${q.key}" value="${k}"><span>${o.label}</span></label>`).join('')}</div><span class="fb" aria-live="polite"></span></div>`;
  }
  // Marks every answer; true if all are right, null if one is missing.
  // While the exercise is open, a wrong answer gets a nudge, not the solution: the steps of the
  // solution are taken out of its explanation, and single statements or missed tiles are not marked.
  function feedback() {
    let all = true, missing = false;
    const done = st && (st.solved || st.revealed);
    const nudge = (w) => {
      if (done) return w;
      let t = w || '';
      // whole steps, then single sentences of the solution
      for (const s of ex.solution) if (s) t = t.split(s).join('');
      for (const s of ex.solution) for (const x of String(s || '').split(/(?<=[.!?])\s+/)) if (x.length > 3) t = t.split(x).join('');
      t = t.replace(/\s+/g, ' ').trim();
      return t || ui().notThis;
    };
    for (const q of ex.questions) {
      if (q.type === 'multi') {
        let wrong = 0;
        q.statements.forEach((s, k) => {
          const li = $(`.stmts li[data-k="${k}"]`), on = li.querySelector('input').checked, good = on === s.ok;
          if (!good) { all = false; wrong++; }
          li.className = done || good ? (good ? (on ? 'ok' : '') : 'bad') : '';
          li.querySelector('.fb').innerHTML = done && !good ? (on ? s.why : `${ui().missed.replace(/:$/, '')}: ${s.why}`) : '';
        });
        $(`[data-fb="${q.key}"]`).innerHTML = !done && wrong ? ui().stmtsWrong(wrong) : '';
        continue;
      }
      const inputs = [...document.querySelectorAll(`input[name="q-${q.key}"]`)], on = inputs.filter((x) => x.checked).map((x) => Number(x.value));
      if (!on.length) { all = false; missing = true; continue; }
      if (q.type === 'tiles' || q.type === 'pick') {
        const notes = [];
        inputs.forEach((x) => {
          const k = Number(x.value), o = q.options[k], el = x.closest('.tile, .cand'), chosen = x.checked;
          el.classList.remove('ok', 'bad', 'miss');
          if (chosen) el.classList.add(o.ok ? 'ok' : 'bad');
          else if (q.multi && o.ok && done) el.classList.add('miss');
          if (chosen && !o.ok) notes.push(nudge(o.why));
          if (!chosen && q.multi && o.ok) notes.push(done ? `${ui().missed} ${o.why}` : ui().notAll);
          if (chosen !== o.ok && (chosen || q.multi)) all = false;
        });
        $(`[data-fb="${q.key}"]`).innerHTML = [...new Set(notes)].map((n) => `<li>${n}</li>`).join('');
        continue;
      }
      const o = q.options[on[0]], row = $(`.field[data-key="${q.key}"]`);
      row.className = `field ${o.ok ? 'ok' : 'bad'}`;
      row.querySelector('.fb').innerHTML = o.ok ? ui().correct : nudge(o.why);
      if (!o.ok) all = false;
    }
    return all ? true : missing && !document.querySelector('.field.bad, .cand.bad, .tile.bad, .tile.miss, .stmts li.bad, .stmts-fb:not(:empty)') ? null : false;
  }

  // ---------------------------------------------------------------- exercises
  const PRACTICE = 'ep', typeOf = (e) => e.type;
  const finish = () => { if (ex && st) Practice.finish(PRACTICE, typeOf(ex), st); };
  const maxTries = () => (ex.questions.length === 1 && !ex.questions[0].multi && ex.questions[0].type !== 'multi' ? 2 : 3);
  function open(exercise) {
    finish();
    ex = exercise;
    st = { tries: 0, hints: 0, solved: false, revealed: false, checked: false, status: null };
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
      : kind === 'ok' ? ui().okWell + (st.advance ? ` ${st.advance}` : '') : ui().notYet(st.tries) + (!canReveal() ? ui().tryAgain : ui().canReveal);
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
    const s = stored('ep-score', { solved: 0, clean: 0 });
    s.solved++;
    if (st.tries === 1 && st.hints === 0) s.clean++;
    store('ep-score', s);
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
    $('#sol-steps').innerHTML = ex.solution.map((s) => `<p>${s}</p>`).join('');
    $('#solution').hidden = false;
  }
  // The right answers chosen and marked.
  function markRight() {
    for (const q of ex.questions) {
      if (q.type === 'multi') q.statements.forEach((s, k) => { document.querySelector(`.stmts li[data-k="${k}"] input`).checked = s.ok; });
      else q.options.forEach((o, k) => { document.querySelector(`input[name="q-${q.key}"][value="${k}"]`).checked = o.ok; });
    }
    feedback();
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

  // ---------------------------------------------------------------- tutor
  const frame = (title, text, figure) => ({ text: `<p class="step-rule">${title}</p>${text}`, figure: `<div class="figs">${figure}</div>` });
  const fig = (html) => `<div class="fig">${html}</div>`;
  const BOX = [-3, 3, -2.2, 2.2], xs = [-2, -1, 0, 1, 2];
  const LESSONS = [
    { topic: 0, stage: 0, name: () => L('Potential and voltage', 'Potential und Spannung'), idea: () => L('The potential is the potential energy per charge; a voltage is a difference of potentials.', 'Das Potential ist die potentielle Energie pro Ladung; eine Spannung ist eine Potentialdifferenz.'),
      frames: () => [
        frame(L('Energy in a field', 'Energie im Feld'), `<p>${L('Like a mass in the gravitational field, a charge in an electric field has a potential energy that depends on where it is. Moving it, the field does work: W = −ΔE_pot, whatever the path.', 'Wie eine Masse im Schwerefeld hat eine Ladung im elektrischen Feld eine potentielle Energie, die davon abhängt, wo sie ist. Bewegt man sie, verrichtet das Feld Arbeit: W = −ΔE_pot, unabhängig vom Weg.')}</p>`,
          fig(C.fig({ kind: 'uniform', E: [1, 0] }, { box: BOX, lines: true, parts: [{ x: -1.5, y: 0, q: 1 }], vecs: [{ x: -1.5, y: 0, dx: 60, dy: 0, cls: 'v-force', name: 'F⃗' }] }))),
        frame(L('Potential', 'Potential'), `<p>${L('The potential energy is proportional to the charge: V = E_pot/q depends only on the point, the potential (in volts, 1 V = 1 J/C). The voltage between two points is the difference of their potentials. The lines of equal potential here are vertical; the potential falls along the field.', 'Die potentielle Energie ist proportional zur Ladung: V = E_pot/q hängt nur vom Punkt ab, das Potential (in Volt, 1 V = 1 J/C). Die Spannung zwischen zwei Punkten ist die Differenz ihrer Potentiale. Die Linien gleichen Potentials sind hier senkrecht; in Feldrichtung fällt das Potential.')}</p>`,
          fig(C.fig({ kind: 'uniform', E: [1, 0] }, { box: BOX, given: xs.map((x) => [[x, -3], [x, 3]]), equiLines: true, extra: [-1.2, 0, 1.2].map((y) => [[-3, y], [3, y]]), tops: xs.map((x, i) => ({ x, label: `${400 - 100 * i} V` })) }))),
        frame(L('Work and energy', 'Arbeit und Energie'), `<p>${X.RULE()} ${L('An electron (q = −e) moved from 100 V to 300 V: W = −e·(100 V − 300 V) = +200 eV: it gains 200 eV of kinetic energy.', 'Ein Elektron (q = −e) von 100 V nach 300 V: W = −e·(100 V − 300 V) = +200 eV: Es gewinnt 200 eV kinetische Energie.')} ${X.DOWNHILL()}</p>`,
          fig(C.fig({ kind: 'uniform', E: [1, 0] }, { box: BOX, given: xs.map((x) => [[x, -3], [x, 3]]), equiLines: true, tops: xs.map((x, i) => ({ x, label: `${400 - 100 * i} V` })), parts: [{ x: 1, y: 0, q: -1, sym: 'e⁻' }], vecs: [{ x: 1, y: 0, dx: -76, dy: 0, cls: 'v-force', name: 'F⃗' }] }))),
      ] },
    { topic: 1, stage: 0, name: () => L('The uniform field', 'Das homogene Feld'), idea: () => L('In a uniform field the potential changes evenly along the field lines: |ΔV| = E·d, d along the lines.', 'Im homogenen Feld ändert sich das Potential längs der Feldlinien gleichmässig: |ΔV| = E·d, d längs der Linien.'),
      frames: () => [
        frame(L('Along the field lines', 'Längs der Feldlinien'), `<p>${L('Between A and B, only the distance along the field lines counts: moving across them, the potential stays the same. Here A and B are 2 cm apart along the field: with E = 500 V/m, V_B − V_A = −500 V/m · 2 cm = −10 V.', 'Zwischen A und B zählt nur der Abstand längs der Feldlinien: Quer dazu bleibt das Potential gleich. Hier liegen A und B längs des Feldes 2 cm auseinander: Mit E = 500 V/m ist V_B − V_A = −500 V/m · 2 cm = −10 V.')}</p>`,
          fig(C.fig({ kind: 'uniform', E: [1, 0] }, { box: [-3, 3, -1.6, 1.6], lines: true, lineOpts: { gap: 1 }, grid: true, points: [{ x: -1, y: 1, name: 'A' }, { x: 1, y: -1, name: 'B' }] }))),
        frame(L('V(x) and E(x)', 'V(x) und E(x)'), `<p>${L('The field is the slope of the potential, with the opposite sign: E = −dV/dx. Where V falls by 2 V per mm, E = +2 kV/m; where V is constant, E = 0. Going back, V changes by minus the area under E(x).', 'Das Feld ist die Steigung des Potentials, mit umgekehrtem Vorzeichen: E = −dV/dx. Wo V um 2 V pro mm fällt, ist E = +2 kV/m; wo V konstant ist, ist E = 0. Zurück ändert sich V um minus die Fläche unter E(x).')}</p>`,
          `<div class="fig">${X.vGraph((x) => (x < 2 ? 6 - 2 * x : x < 5 ? 2 : 2 + (x - 5)), [0, 2, 5, 8])}</div><div class="fig">${X.eGraph((x) => (x < 2 ? 2 : x < 5 ? 0 : -1), [0, 2, 5, 8])}</div>`),
      ] },
    { topic: 2, stage: 0, name: () => L('Equipotentials', 'Äquipotentiallinien'), idea: () => L('Lines of equal potential cross the field lines at right angles.', 'Linien gleichen Potentials kreuzen die Feldlinien senkrecht.'),
      frames: () => [
        frame(L('A point charge', 'Eine Punktladung'), `<p>${L('Around a point charge the equipotentials are circles. For equal steps of potential (V = k·Q/r) they get farther apart outwards, where the field is weaker.', 'Um eine Punktladung sind die Äquipotentiallinien Kreise. Für gleiche Potentialschritte (V = k·Q/r) liegen sie nach aussen immer weiter auseinander, wo das Feld schwächer ist.')}</p>`, fig(C.fig(X.EQ.point.c, { box: BOX, equi: X.EQ.point.lv, lines: true }))),
        frame(L('A dipole', 'Ein Dipol'), `<p>${L('Around a positive and a negative charge: the field lines (blue) run from + to −, the equipotentials (orange) cross them at right angles. Halfway between, V = 0.', 'Um eine positive und eine negative Ladung: Die Feldlinien (blau) laufen von + nach −, die Äquipotentiallinien (orange) kreuzen sie senkrecht. In der Mitte ist V = 0.')}</p>`, fig(C.fig(X.EQ.dipole.c, { box: BOX, equi: X.EQ.dipole.lv, lines: true }))),
        frame(L('Two equal charges', 'Zwei gleiche Ladungen'), `<p>${L('Around two equal positive charges the equipotentials first surround each charge, then both together.', 'Um zwei gleiche positive Ladungen umschliessen die Äquipotentiallinien zuerst jede Ladung, dann beide zusammen.')}</p>`, fig(C.fig(X.EQ.like.c, { box: BOX, equi: X.EQ.like.lv, lines: true }))),
      ] },
    { topic: 3, stage: 0, name: () => L('Potential of point charges', 'Potential von Punktladungen'), idea: () => L('V = k·Q/r; the potentials of several charges add as numbers, not as vectors.', 'V = k·Q/r; die Potentiale mehrerer Ladungen addieren sich als Zahlen, nicht als Vektoren.'),
      frames: () => [
        frame(L('V = k·Q/r', 'V = k·Q/r'), `<p>${L('With the zero far away, the potential of a point charge is V = k·Q/r: positive around a positive charge, negative around a negative one, falling with 1/r (more slowly than the field, 1/r²).', 'Mit dem Nullpunkt weit weg ist das Potential einer Punktladung V = k·Q/r: positiv um eine positive Ladung, negativ um eine negative, abnehmend mit 1/r (langsamer als das Feld, 1/r²).')}</p>`, fig(C.fig(X.EQ.point.c, { box: BOX, equi: X.EQ.point.lv }))),
        frame(L('Numbers, not vectors', 'Zahlen, keine Vektoren'), `<p>${L('At the centre of four equal positive charges on a square, the four fields cancel (vectors), but the potentials add up: V = 4·k·q/r > 0. With +q, −q, +q, −q in turn, both the field and the potential are zero.', 'Im Mittelpunkt von vier gleichen positiven Ladungen auf einem Quadrat heben sich die vier Felder auf (Vektoren), aber die Potentiale addieren sich: V = 4·k·q/r > 0. Mit +q, −q, +q, −q abwechselnd sind Feld und Potential beide null.')}</p>`,
          fig(C.fig({ kind: 'points', charges: [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([x, y]) => ({ q: 1, x, y })) }, { box: BOX, equi: [1.5, 2, 2.5, 3, 4], points: [{ x: 0, y: 0, name: 'M' }] }))),
        frame(L('In units of V₀', 'In Einheiten von V₀'), `<p>${L('Without a calculator, count in units: with V₀ = k·q/r, a charge +q at the distance r gives +V₀, a charge −2q at the distance 2r gives −2/2·V₀ = −V₀. At P between them: V = +V₀ − V₀ = 0, although the field there is not zero.', 'Ohne Taschenrechner zählt man in Einheiten: Mit V₀ = k·q/r gibt eine Ladung +q im Abstand r den Beitrag +V₀, eine Ladung −2q im Abstand 2r den Beitrag −2/2·V₀ = −V₀. In P dazwischen: V = +V₀ − V₀ = 0, obwohl das Feld dort nicht null ist.')}</p>`,
          fig(C.fig({ kind: 'points', charges: [{ q: 1, x: -1, y: 0 }, { q: -2, x: 2, y: 0 }] }, { box: BOX, lines: true, labels: ['+', '−2'], points: [{ x: 0, y: 0, name: 'P' }] }))),
      ] },
    { topic: 4, stage: 0, name: () => L('Acceleration voltage', 'Beschleunigungsspannung'), idea: () => L('Through a voltage U, a charge gains |q|·U of kinetic energy: in eV, simply the charge in e times U in V.', 'Mit einer Spannung U gewinnt eine Ladung |q|·U kinetische Energie: in eV einfach die Ladung in e mal U in V.'),
      frames: () => [
        frame(L('Energy and speed', 'Energie und Geschwindigkeit'), `<p>${L('A charge accelerated from rest through U gains E_kin = |q|·U, whatever the path. Then ½·m·v² = |q|·U gives v = √(2·|q|·U/m): twice the voltage, √2 times the speed.', 'Eine aus der Ruhe mit U beschleunigte Ladung gewinnt E_kin = |q|·U, unabhängig vom Weg. Dann gibt ½·m·v² = |q|·U die Geschwindigkeit v = √(2·|q|·U/m): doppelte Spannung, √2-fache Geschwindigkeit.')}</p>`,
          fig(C.fig({ kind: 'uniform', E: [1, 0] }, { box: [-3, 3, -1.6, 1.6], lines: true, rods: [[-2.6, -1.5, -2.6, 1.5], [2.6, -1.5, 2.6, 1.5]], parts: [{ x: -2.2, y: 0, q: 1, sym: 'p' }], tops: [{ x: -2.6, label: 'U' }, { x: 2.6, label: '0 V' }] }))),
        frame(L('The electronvolt', 'Das Elektronvolt'), `<p>${L('1 eV is the energy of one elementary charge moved through 1 V: 1 eV = 1.602 · 10⁻¹⁹ J. A “30 MeV Pb²⁺ ion” has gone through 15 MV. Masses too can be given in eV/c²: electron 511 keV/c², proton 938 MeV/c², 1 u = 931.5 MeV/c².', '1 eV ist die Energie einer Elementarladung, die 1 V durchläuft: 1 eV = 1.602 · 10⁻¹⁹ J. Ein «30-MeV-Pb²⁺-Ion» hat 15 MV durchlaufen. Auch Massen kann man in eV/c² angeben: Elektron 511 keV/c², Proton 938 MeV/c², 1 u = 931.5 MeV/c².')}</p>`, ''),
        frame(L('Relativistic particles', 'Relativistische Teilchen'), `<p>${L('½·m·v² holds only while the kinetic energy is small compared with the rest energy E₀ = m·c². An electron through 1 MV (1 MeV, twice its 511 keV) is relativistic: it does not move faster than light, as the classical formula would say.', '½·m·v² gilt nur, solange die kinetische Energie klein ist gegen die Ruheenergie E₀ = m·c². Ein Elektron nach 1 MV (1 MeV, doppelt so viel wie seine 511 keV) ist relativistisch: Es bewegt sich nicht schneller als Licht, wie die klassische Formel sagen würde.')}</p>`, ''),
      ] },
    { topic: 5, stage: 0, name: () => L('Energy conservation', 'Energieerhaltung'), idea: () => L('Kinetic plus potential energy stays the same: E_kin + q·V = constant.', 'Kinetische plus potentielle Energie bleibt gleich: E_kin + q·V = konstant.'),
      frames: () => [
        frame(L('Closest approach', 'Kleinster Abstand'), `<p>${L('An alpha particle flying straight at a nucleus is slowed down by the repulsion. At the closest point it stops for a moment: all its kinetic energy has become potential energy, E_kin = k·q·Q/r_min. Rutherford found nuclei this way.', 'Ein Alphateilchen, das geradewegs auf einen Kern zufliegt, wird von der Abstossung abgebremst. Im nächsten Punkt hält es kurz an: Seine ganze kinetische Energie ist potentielle Energie geworden, E_kin = k·q·Q/r_min. So fand Rutherford die Atomkerne.')}</p>`,
          fig(C.fig({ kind: 'points', charges: [{ q: 3, x: 1.5, y: 0 }] }, { box: BOX, equi: [1.2, 1.6, 2.2, 3.2, 5], labels: ['+Ze'], parts: [{ x: -1.8, y: 0, q: 1, sym: 'α' }], vecs: [{ x: -1.8, y: 0, dx: 50, dy: 0, cls: 'v-vel', name: 'v' }] }))),
        frame(L('Comparing experiments', 'Versuche vergleichen'), `<p>${L('From E_kin = k·q·Q/r_min: r_min = k·q·Q/E_kin. Twice the energy, half the closest distance; an alpha particle (2e) with the same energy as a proton stops twice as far away. The mass does not matter here, only the energy. A particle repelled from a sphere gains |q|·V with V = k·Q/R; its speed grows with the square root of the energy: v = √(2·E_kin/m).', 'Aus E_kin = k·q·Q/r_min folgt r_min = k·q·Q/E_kin. Doppelte Energie, halber kleinster Abstand; ein Alphateilchen (2e) mit derselben Energie wie ein Proton hält doppelt so weit weg an. Die Masse spielt hier keine Rolle, nur die Energie. Ein von einer Kugel abgestossenes Teilchen gewinnt |q|·V mit V = k·Q/R; seine Geschwindigkeit wächst mit der Wurzel aus der Energie: v = √(2·E_kin/m).')}</p>`,
          fig(C.fig({ kind: 'points', charges: [{ q: 3, x: 1.5, y: 0 }] }, { box: BOX, equi: [1.2, 1.6, 2.2, 3.2, 5], labels: ['+Ze'], parts: [{ x: -1.8, y: 0.7, q: 1, sym: 'α' }, { x: -1.8, y: -0.7, q: 1, sym: 'p' }] }))),
      ] },
  ];
  const stage = (name, types) => ({ name, types });
  const TOPICS = [
    { name: () => L('Potential and energy', 'Potential und Energie'), example: () => 0, stages: [stage(() => L('which way', 'welche Richtung'), ['which-way']), stage(() => L('at points', 'in Punkten'), ['points-v'])] },
    { name: () => L('The uniform field', 'Das homogene Feld'), example: () => 1, stages: [stage(() => L('along the field', 'längs des Feldes'), ['uniform-d']), stage(() => L('V → E', 'V → E'), ['v2e']), stage(() => L('E → V', 'E → V'), ['e2v'])] },
    { name: () => L('Equipotentials', 'Äquipotentiallinien'), example: () => 2, stages: [stage(() => L('which diagram', 'welches Diagramm'), ['equi-pick']), stage(() => L('field lines', 'Feldlinien'), ['lines-equi'])] },
    { name: () => L('Point charges', 'Punktladungen'), example: () => 3, stages: [stage(() => L('scalar, not vector', 'Skalar, kein Vektor'), ['scalar']), stage(() => L('in units of V₀', 'in Einheiten von V₀'), ['point-v'])] },
    { name: () => L('Acceleration voltage', 'Beschleunigungsspannung'), example: () => 4, stages: [stage(() => L('electronvolt', 'Elektronvolt'), ['ev']), stage(() => L('stopping', 'abbremsen'), ['stop']), stage(() => L('speed', 'Geschwindigkeit'), ['accel']), stage(() => L('comparing', 'vergleichen'), ['accel-compare'])] },
    { name: () => L('Energy conservation', 'Energieerhaltung'), example: () => 5, stages: [stage(() => L('closest approach', 'kleinster Abstand'), ['closest']), stage(() => L('repelled', 'abgestossen'), ['repel'])] },
    { name: () => L('True or false', 'Richtig oder falsch'), example: () => 0, stages: [stage(() => L('statements', 'Aussagen'), ['stmts'])] },
  ];
  const lessons = () => LESSONS.map((l) => ({ name: l.name(), idea: l.idea(), frames: l.frames, also: topics.also(l.topic) }));

  // ---------------------------------------------------------------- arcade
  const KINDS = [['which-way', 1], ['ev', 2], ['stop', 2], ['uniform-d', 2], ['equi-pick', 2], ['lines-equi', 2], ['v2e', 2], ['points-v', 2],
    ['scalar', 3], ['point-v', 3], ['accel', 3], ['accel-compare', 3], ['e2v', 3], ['closest', 3], ['repel', 3]];
  const CONCEPT = { sign: 'sign', straight: 'along', across: 'along', even: 'equi', lines: 'equi', turned: 'equi', swap: 'equi', up: 'equi', along: 'equi', copy: 'slope', steep: 'slope',
    z: 'charge', two: 'formula', field: 'vr', abs: 'scalar', one: 'scalar', half: 'charge', prefix: 'units' };
  function arcadeQuestion(kind, seed) {
    const e = X.make(kind, seed), qs = e.questions.filter((q) => q.type !== 'multi' && !q.multi), q = qs[seed % qs.length];
    return {
      title: e.title, text: e.text, figure: `<div class="figs">${e.figs || ''}</div>`, ask: q.label.replace(/^\([a-d]\) /, ''),
      options: q.options.map((o) => ({ html: o.html || o.label, correct: o.ok, flag: o.ok ? null : o.tag || 'other', why: o.why })),
      explain: () => `${e.solFig || ''}<div class="steps">${e.solution.map((s) => (s.startsWith('<ul') || s.includes('<ul>') ? s : `<p>${s}</p>`)).join('')}</div>`,
    };
  }
  const arcadeSource = {
    id: 'ep', kinds: KINDS.map(([id, difficulty]) => ({ id, difficulty })), question: arcadeQuestion, concept: CONCEPT,
    concepts: () => ({
      sign: L('the sign of the charge and of ΔV', 'das Vorzeichen der Ladung und von ΔV'), along: L('the distance along the field lines', 'der Abstand längs der Feldlinien'), equi: L('equipotentials and field lines', 'Äquipotential- und Feldlinien'),
      slope: L('E as the slope of V', 'E als Steigung von V'), charge: L('the charge in e', 'die Ladung in e'), formula: L('v = √(2qU/m)', 'v = √(2qU/m)'), vr: L('V = kQ/r, not kQ/r²', 'V = kQ/r, nicht kQ/r²'),
      scalar: L('potentials add as numbers', 'Potentiale addieren sich als Zahlen'), units: L('units and prefixes', 'Einheiten und Vorsätze'),
    }),
    intro: () => ({
      tag: L('Potentials, voltages, equipotentials and accelerated particles: answer as many questions as you can in <b>5 minutes</b>.', 'Potentiale, Spannungen, Äquipotentiallinien und beschleunigte Teilchen: Beantworte in <b>5 Minuten</b> so viele Fragen wie möglich.'),
      rule: L('Questions get harder as you go. Choose one of the answers: click it or press its number.', 'Die Fragen werden nach und nach schwieriger. Wähle eine der Antworten: Klicke sie an oder drücke ihre Nummer.'),
      example: L('the straight distance in a uniform field', 'der direkte Abstand im homogenen Feld'),
    }),
    hero: () => `<div class="figs"><div class="fig">${C.fig(X.EQ.dipole.c, { box: BOX, equi: X.EQ.dipole.lv, lines: true })}</div></div><p class="ar-law">W = q·(V<sub>A</sub> − V<sub>B</sub>)</p>`,
  };

  // ---------------------------------------------------------------- language and modes
  function applyStatic() {
    document.title = ui().title;
    Lang.apply(ui());
    if (topics) topics.relabel();
    if (problems) problems.menu();
  }
  function switchLang() {
    applyStatic();
    showScore();
    if (ex) {
      const keep = st, status = st.status, chosen = [...document.querySelectorAll('#fields input:checked')].map((x) => [x.name, x.value]);
      ex = again(ex);
      render();
      st = keep;
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
    store('ep-mode', m);
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
    const d = h.match(/^([a-z0-9]+(?:-[a-z0-9]+)*)-(\d+)$/);
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
      app: PRACTICE, problems: window.PotProblems.PROBLEMS, make: window.PotProblems.realOf,
      open, current: () => ex, pick: $('#real-pick'), renew: $('#real-new'),
    });
    applyStatic();
    Lang.wire(switchLang);
    $('#new').addEventListener('click', fresh);
    $('#answers').addEventListener('submit', check);
    $('#fields').addEventListener('change', (evt) => {
      const row = evt.target.closest('.field');
      if (row) { row.className = 'field'; row.querySelector('.fb').textContent = ''; }
      const box = evt.target.closest('.tiles, .cands');
      if (box) { box.querySelectorAll('.tile, .cand').forEach((el) => el.classList.remove('ok', 'bad', 'miss')); const fb = box.nextElementSibling; if (fb) fb.innerHTML = ''; }
      const li = evt.target.closest('.stmts li');
      if (li) { li.className = ''; li.querySelector('.fb').textContent = ''; }
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
    const last = stored('ep-mode', 'tutor');
    if (last === 'tutor') { setMode('tutor'); tutor.open(0); } else if (last === 'arcade') play(); else if (last === 'real') realMode(); else { setMode('practice'); fresh(); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
