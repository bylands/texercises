(function () {
  'use strict';

  const C = window.Charges, X = window.FieldEx, Figs = window.FieldFigures;
  const Lang = window.Lang, Arcade = window.Arcade, L = Lang.L;
  const $ = (sel) => document.querySelector(sel);

  // ---------------------------------------------------------------- interface texts
  const UI = {
    en: {
      title: 'Electric Field', mode: 'Mode', difficulty: 'Difficulty', example: 'Example',
      tutor: 'Tutor', practice: 'Practice', real: 'Problems', arcade: 'Arcade', new: 'New exercise', problem: 'Problem', newNumbers: 'New numbers', nextProblem: 'Next problem',
      tutorNote: 'Use the arrow keys ← → to step through. Blue: field lines and field, red: force.',
      check: 'Check', reveal: 'Show solution', hints: 'Hints', solution: 'Solution', option: (k) => `Option ${k}`,
      revealNote: (n) => `The solution unlocks once you have solved the exercise, used all hints or made ${n} attempts.`,
      stars: (d) => `Difficulty: ${d} of 5`, score: (s, c) => `Solved: ${s} · first try without hints: ${c}`,
      hint: (n) => `Hint (${n} left)`, noHints: 'No more hints', unlocks: (n) => `Unlocks after all hints or ${n} attempts`,
      fill: 'Answer every question, then check.', okWell: 'All correct, well done!',
      notYet: (n) => `Not quite yet (attempt ${n}).`, tryAgain: ' Try again, or take a hint.', canReveal: ' You can take a hint or look at the solution.',
      correct: 'Correct', missed: 'This one fits too:', shown: 'The right answers are marked.',
    },
    de: {
      title: 'Elektrisches Feld', mode: 'Modus', difficulty: 'Schwierigkeit', example: 'Beispiel',
      tutor: 'Tutor', practice: 'Üben', real: 'Praxisaufgaben', arcade: 'Arcade', new: 'Neue Aufgabe', problem: 'Aufgabe', newNumbers: 'Neue Zahlen', nextProblem: 'Nächste Aufgabe',
      tutorNote: 'Mit den Pfeiltasten ← → blätterst du weiter. Blau: Feldlinien und Feld, rot: Kraft.',
      check: 'Prüfen', reveal: 'Lösung zeigen', hints: 'Tipps', solution: 'Lösung', option: (k) => `Antwort ${k}`,
      revealNote: (n) => `Die Lösung wird freigeschaltet, sobald du die Aufgabe gelöst, alle Tipps genutzt oder ${n} Versuche gemacht hast.`,
      stars: (d) => `Schwierigkeit: ${d} von 5`, score: (s, c) => `Gelöst: ${s} · beim ersten Versuch ohne Tipps: ${c}`,
      hint: (n) => `Tipp (${n} übrig)`, noHints: 'Keine Tipps mehr', unlocks: (n) => `Wird nach allen Tipps oder ${n} Versuchen freigeschaltet`,
      fill: 'Beantworte jede Frage und prüfe dann.', okWell: 'Alles richtig, gut gemacht!',
      notYet: (n) => `Noch nicht ganz (Versuch ${n}).`, tryAgain: ' Versuche es nochmals, oder nimm einen Tipp.', canReveal: ' Du kannst einen Tipp nehmen oder die Lösung anschauen.',
      correct: 'Richtig', missed: 'Auch diese passt:', shown: 'Die richtigen Antworten sind markiert.',
    },
  };
  const ui = () => UI[Lang.get()];

  let ex = null, st = null, tutor = null, arcade = null, topics = null, problems = null;
  function stored(key, fallback) { try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; } }
  function store(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ } }
  function showScore() { const s = stored('ef-score', { solved: 0, clean: 0 }); $('#score').textContent = s.solved ? ui().score(s.solved, s.clean) : ''; }
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
      return `<ul class="stmts">${q.statements.map((s, k) => `<li data-k="${k}"><label><input type="checkbox" name="q-${q.key}" value="${k}"><span>${s.html}</span></label><span class="fb"></span></li>`).join('')}</ul>`;
    }
    return `<div class="field" data-key="${q.key}"><span class="what">${q.label}</span><div class="opts" role="radiogroup">${q.options.map((o, k) => `<label><input type="radio" name="q-${q.key}" value="${k}"><span>${o.label}</span></label>`).join('')}</div><span class="fb" aria-live="polite"></span></div>`;
  }
  // Marks every answer; true if all are right, null if one is missing.
  function feedback() {
    let all = true, missing = false;
    for (const q of ex.questions) {
      if (q.type === 'multi') {
        q.statements.forEach((s, k) => {
          const li = $(`.stmts li[data-k="${k}"]`), on = li.querySelector('input').checked, good = on === s.ok;
          li.className = good ? (on ? 'ok' : '') : 'bad';
          li.querySelector('.fb').innerHTML = good ? '' : on ? s.why : `${ui().missed.replace(/:$/, '')}: ${s.why}`;
          if (!good) all = false;
        });
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
          else if (q.multi && o.ok) el.classList.add('miss');
          if (chosen && !o.ok) notes.push(o.why);
          if (!chosen && q.multi && o.ok) notes.push(`${ui().missed} ${o.why}`);
          if (chosen !== o.ok && (chosen || q.multi)) all = false;
        });
        $(`[data-fb="${q.key}"]`).innerHTML = [...new Set(notes)].map((n) => `<li>${n}</li>`).join('');
        continue;
      }
      const o = q.options[on[0]], row = $(`.field[data-key="${q.key}"]`);
      row.className = `field ${o.ok ? 'ok' : 'bad'}`;
      row.querySelector('.fb').innerHTML = o.ok ? ui().correct : o.why;
      if (!o.ok) all = false;
    }
    return all ? true : missing && !document.querySelector('.field.bad, .cand.bad, .tile.bad, .tile.miss, .stmts li.bad') ? null : false;
  }

  // ---------------------------------------------------------------- exercises
  const PRACTICE = 'ef', typeOf = (e) => e.type;
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
    const s = stored('ef-score', { solved: 0, clean: 0 });
    s.solved++;
    if (st.tries === 1 && st.hints === 0) s.clean++;
    store('ef-score', s);
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
  const BOX = X.BOX, one = (q) => ({ kind: 'points', charges: [{ q, x: 0, y: 0 }] }), two = (a, b) => X.pts2([[a, -1], [b, 1]]);
  const LESSONS = [
    { topic: 0, stage: 0, name: () => L('Field and force', 'Feld und Kraft'), idea: () => L('The field at a point is the force per charge, <span class="vec"><i>E</i></span> = <span class="vec"><i>F</i></span>/q: it belongs to the point, not to the test charge.', 'Das Feld in einem Punkt ist die Kraft pro Ladung, <span class="vec"><i>E</i></span> = <span class="vec"><i>F</i></span>/q: Es gehört zum Punkt, nicht zur Probeladung.'),
      frames: () => [
        frame(L('The field', 'Das Feld'), `<p>${L('A charge changes the space around it: another charge placed anywhere near it feels a force. The force on a small test charge q at a point P is proportional to q, so the ratio <span class="vec"><i>E</i></span> = <span class="vec"><i>F</i></span>/q depends only on the point: the electric field there.', 'Eine Ladung verändert den Raum um sich: Eine andere Ladung irgendwo in ihrer Nähe spürt eine Kraft. Die Kraft auf eine kleine Probeladung q in einem Punkt P ist proportional zu q, also hängt das Verhältnis <span class="vec"><i>E</i></span> = <span class="vec"><i>F</i></span>/q nur vom Punkt ab: das elektrische Feld dort.')}</p>`,
          fig(C.fig(one(2), { box: BOX, lines: true, labels: ['+2'], parts: [{ x: 1.6, y: 0.9, q: 1, r: 8 }], vecs: [{ x: 1.6, y: 0.9, dx: 52, dy: 30, cls: 'v-force', name: 'F⃗' }] }))),
        frame(L('A negative test charge', 'Eine negative Probeladung'), `<p>${X.RULE()} ${L('The field at P is the same; the force on a negative test charge points the other way.', 'Das Feld in P ist dasselbe; die Kraft auf eine negative Probeladung zeigt in die andere Richtung.')}</p>`,
          fig(C.fig(one(2), { box: BOX, lines: true, labels: ['+2'], parts: [{ x: 1.6, y: 0.9, q: -1, r: 8 }], vecs: [{ x: 1.6, y: 0.9, dx: -52, dy: -30, cls: 'v-force', name: 'F⃗' }] }))),
        frame(L('Units', 'Einheiten'), `<p>${L('The field is measured in N/C, which is the same as V/m. A field of 1000 N/C pushes a charge of 1 µC with 1 mN.', 'Das Feld wird in N/C gemessen, was dasselbe ist wie V/m. Ein Feld von 1000 N/C drückt eine Ladung von 1 µC mit 1 mN.')}</p>`,
          fig(C.fig({ kind: 'uniform', E: [1, 0] }, { box: BOX, lines: true, parts: [{ x: 0, y: 0, q: 1 }], vecs: [{ x: 0, y: 0, dx: 70, dy: 0, cls: 'v-force', name: 'F⃗' }] }))),
      ] },
    { topic: 1, stage: 0, name: () => L('Field lines', 'Feldlinien'), idea: () => L('Field lines show the direction of the field; their density shows its strength.', 'Feldlinien zeigen die Richtung des Feldes; ihre Dichte zeigt seine Stärke.'),
      frames: () => [
        frame(L('A single charge', 'Eine einzelne Ladung'), `<p>${L('Field lines run along the field: each is tangent to the field vector at every point. From a positive charge they run straight outwards, evenly spread; further out they are farther apart: the field is weaker there.', 'Feldlinien verlaufen längs des Feldes: Jede ist in jedem Punkt tangential zum Feldvektor. Von einer positiven Ladung laufen sie gerade nach aussen, gleichmässig verteilt; weiter aussen liegen sie weiter auseinander: Dort ist das Feld schwächer.')}</p>`, fig(C.fig(one(1), { box: BOX, lines: true }))),
        frame(L('Opposite charges', 'Entgegengesetzte Ladungen'), `<p>${L('Lines start at the positive charge and end at the negative one. They never cross: at each point, the fields of both charges add up to one field with one direction.', 'Linien beginnen bei der positiven Ladung und enden bei der negativen. Sie kreuzen sich nie: In jedem Punkt addieren sich die Felder beider Ladungen zu einem Feld mit einer Richtung.')}</p>`, fig(C.fig(two(1, -1), { box: BOX, lines: true }))),
        frame(L('Like charges', 'Gleichnamige Ladungen'), `<p>${L('Between two positive charges the lines push apart; halfway between them the field is zero.', 'Zwischen zwei positiven Ladungen weichen sich die Linien aus; in der Mitte zwischen ihnen ist das Feld null.')}</p>`, fig(C.fig(two(1, 1), { box: BOX, lines: true }))),
        frame(L('Unequal charges', 'Ungleiche Ladungen'), `<p>${L('Near +2q, its field dominates; some of its lines end at −q, the others go off to infinity: from far away, the pair looks like a single charge +q. In space, the number of lines at a charge is proportional to its size. A drawing shows only the lines in one plane, about √2 times as many at +2q as at −q, so you cannot read off the ratio of the charges by counting.', 'In der Nähe von +2q überwiegt ihr Feld; einige ihrer Linien enden bei −q, die anderen gehen ins Unendliche: Von weitem sieht das Paar aus wie eine einzelne Ladung +q. Im Raum ist die Zahl der Linien bei einer Ladung proportional zu ihrem Betrag. Eine Zeichnung zeigt nur die Linien in einer Ebene, bei +2q etwa √2-mal so viele wie bei −q; das Verhältnis der Ladungen lässt sich also nicht durch Abzählen bestimmen.')}</p>`, fig(C.fig(two(2, -1), { box: BOX, lines: true, labels: ['+2', '−'] }))),
        frame(L('Conductors', 'Leiter'), `<p>${L('In a metal, the free charges move until the field inside is zero. Field lines end on its surface, at right angles.', 'In einem Metall bewegen sich die freien Ladungen, bis das Feld im Innern null ist. Feldlinien enden auf seiner Oberfläche, senkrecht.')}</p>`, fig(C.fig({ kind: 'cylinder', a: 0.8, E0: 1 }, { box: [-3, 3, -2, 2], lines: true, lineOpts: { count: 13 } }))),
      ] },
    { topic: 2, stage: 0, name: () => L('Fields add up', 'Felder addieren sich'), idea: () => L('The field of several charges is the vector sum of their fields.', 'Das Feld mehrerer Ladungen ist die Vektorsumme ihrer Felder.'),
      frames: () => {
        const c = { kind: 'points', charges: [{ q: 1, x: -1, y: 1 }, { q: -1, x: 1, y: 1 }] };
        return [
          frame(L('Two fields at a point', 'Zwei Felder in einem Punkt'), `<p>${L('At P, the field of A (+) points away from A, that of B (−) towards B. Both are equally strong (same charge, same distance): their sum points to the right.', 'In P zeigt das Feld von A (+) von A weg, das von B (−) zu B hin. Beide sind gleich stark (gleiche Ladung, gleicher Abstand): Ihre Summe zeigt nach rechts.')}</p>`,
            fig(C.fig(c, { box: [-3, 3, -1.8, 1.8], grid: true, names: [{ x: -1, y: 1, name: 'A' }, { x: 1, y: 1, name: 'B' }], points: [{ x: 0, y: 0, name: 'P' }], vecs: [{ x: 0, y: 0, dx: 40, dy: -40, cls: 'v-part' }, { x: 0, y: 0, dx: 40, dy: 40, cls: 'v-part' }, { x: 0, y: 0, dx: 80, dy: 0, cls: 'v-field', name: 'E⃗' }] }))),
          frame(L('Where the field is zero', 'Wo das Feld null ist'), `<p>${L('Between two charges of the same sign, the fields point opposite ways and cancel at one point, closer to the smaller charge: there k·|q₁|/r₁² = k·|q₂|/r₂². Between opposite charges they point the same way; they can cancel only outside, beyond the smaller charge.', 'Zwischen zwei Ladungen gleichen Vorzeichens zeigen die Felder in entgegengesetzte Richtungen und heben sich in einem Punkt auf, näher bei der kleineren Ladung: Dort ist k·|q₁|/r₁² = k·|q₂|/r₂². Zwischen entgegengesetzten Ladungen zeigen sie in dieselbe Richtung; sie können sich nur ausserhalb aufheben, jenseits der kleineren Ladung.')}</p>`,
            fig(C.fig(X.pts2([[1, -1.5], [4, 1.5]]), { box: BOX, lines: true, lineOpts: { per: 5 }, labels: ['+', '+4'], points: [{ x: -0.5, y: 0, name: 'E = 0' }] }))),
        ];
      } },
    { topic: 3, stage: 0, name: () => L('Comparing fields', 'Felder vergleichen'), idea: () => L('What the field depends on, and how: compare with factors instead of calculating.', 'Wovon das Feld abhängt, und wie: mit Faktoren vergleichen statt rechnen.'),
      frames: () => [
        frame(L('A point charge', 'Eine Punktladung'), `<p>${L('E = k·Q/r²: twice the charge, twice the field; twice the distance, a quarter of the field.', 'E = k·Q/r²: doppelte Ladung, doppeltes Feld; doppelter Abstand, ein Viertel des Feldes.')}</p>`, fig(C.fig(one(1), { box: BOX, lines: true }))),
        frame(L('A wire and a large plate', 'Ein Draht und eine grosse Platte'), `<p>${L('A long wire: E = λ/(2π·ε₀·r), twice the distance, half the field. A large plate: E = σ/(2ε₀), the same at every distance (as long as the plate is large compared with the distance).', 'Ein langer Draht: E = λ/(2π·ε₀·r), doppelter Abstand, halbes Feld. Eine grosse Platte: E = σ/(2ε₀), bei jedem Abstand gleich (solange die Platte gross ist im Vergleich zum Abstand).')}</p>`, fig(C.fig({ kind: 'uniform', E: [0, 1] }, { box: BOX, lines: true }))),
        frame(L('A capacitor, disconnected', 'Ein Kondensator, getrennt'), `<p>${L('Between two plates with charges ±Q the fields of both plates add up; outside they cancel. Once the capacitor is disconnected from the source, its charge stays: E = Q/(ε₀·A) = σ/ε₀. Pulling the plates apart does not change the field; twice the area, half the field.', 'Zwischen zwei Platten mit den Ladungen ±Q addieren sich die Felder beider Platten; aussen heben sie sich auf. Ist der Kondensator von der Quelle getrennt, bleibt seine Ladung: E = Q/(ε₀·A) = σ/ε₀. Die Platten auseinanderzuziehen ändert das Feld nicht; doppelte Fläche, halbes Feld.')}</p>`, fig(C.fig({ kind: 'plates', h: 0.8, w: 1.8, q: 1 }, { box: BOX, lines: true }))),
        frame(L('A capacitor, connected', 'Ein Kondensator, angeschlossen'), `<p>${L('Connected to a source, the voltage stays: E = U/d. Twice the distance, half the field; the area does not matter.', 'An einer Quelle angeschlossen bleibt die Spannung: E = U/d. Doppelter Abstand, halbes Feld; die Fläche spielt keine Rolle.')}</p>`, fig(C.fig({ kind: 'plates', h: 0.8, w: 1.8, q: 1 }, { box: BOX, lines: true }))),
      ] },
    { topic: 4, stage: 0, name: () => L('Dipoles', 'Dipole'), idea: () => L('In a uniform field a dipole turns but is not pulled; in a non-uniform field it is pulled too.', 'In einem homogenen Feld dreht sich ein Dipol, wird aber nicht gezogen; in einem inhomogenen Feld wird er auch gezogen.'),
      frames: () => [
        frame(L('In a uniform field', 'Im homogenen Feld'), `<p>${L('The forces on the two ends are equal and opposite: no net force. But they do not act along one line: they turn the dipole until its + end points along the field.', 'Die Kräfte auf die beiden Enden sind gleich und entgegengesetzt: keine Gesamtkraft. Aber sie wirken nicht auf einer Geraden: Sie drehen den Dipol, bis sein +-Ende in Feldrichtung zeigt.')}</p>`,
          fig(C.fig({ kind: 'uniform', E: [1, 0] }, { box: BOX, lines: true, rods: [[-0.5, -0.5, 0.5, 0.5]], parts: [{ x: 0.5, y: 0.5, q: 1 }, { x: -0.5, y: -0.5, q: -1 }], vecs: [{ x: 0.5, y: 0.5, dx: 50, dy: 0, cls: 'v-force', name: 'F⃗' }, { x: -0.5, y: -0.5, dx: -50, dy: 0, cls: 'v-force', name: 'F⃗' }] }))),
        frame(L('Near a charge', 'Nahe einer Ladung'), `<p>${L('In the field of a point charge, the nearer end is in the stronger field: if it is the end of opposite sign, the dipole is attracted. A free dipole always ends up attracted: that is why a charged rod picks up scraps of paper, and why a charged rod bends a thin jet of water.', 'Im Feld einer Punktladung ist das nähere Ende im stärkeren Feld: Ist es das Ende mit entgegengesetztem Vorzeichen, wird der Dipol angezogen. Ein freier Dipol wird am Ende immer angezogen: Darum hebt ein geladener Stab Papierschnipsel auf, und darum lenkt er einen dünnen Wasserstrahl ab.')}</p>`,
          fig(C.fig({ kind: 'points', charges: [{ q: 2, x: -1.8, y: 0 }] }, { box: BOX, lines: true, lineOpts: { per: 6 }, labels: ['+2'], rods: [[0.3, 0, 1.5, 0]], parts: [{ x: 0.3, y: 0, q: -1 }, { x: 1.5, y: 0, q: 1 }] }))),
      ] },
    { topic: 5, stage: 0, name: () => L('Charges in a uniform field', 'Ladungen im homogenen Feld'), idea: () => L('A constant force: a charge flying across a capacitor moves on a parabola, like a ball thrown horizontally.', 'Eine konstante Kraft: Eine Ladung, die quer durch einen Kondensator fliegt, bewegt sich auf einer Parabel, wie ein waagrecht geworfener Ball.'),
      frames: () => [
        frame(L('A parabola', 'Eine Parabel'), `<p>${L('Between the plates the force q·E is the same everywhere. Along the plates the speed stays the same, across them the charge accelerates evenly with a = q·E/m: a parabola, towards the negative plate for a positive charge. The deflection is y = q·E·L²/(2·m·v²).', 'Zwischen den Platten ist die Kraft q·E überall gleich. Längs der Platten bleibt die Geschwindigkeit gleich, quer dazu wird die Ladung gleichmässig mit a = q·E/m beschleunigt: eine Parabel, zur negativen Platte für eine positive Ladung. Die Ablenkung ist y = q·E·L²/(2·m·v²).')}</p>`,
          fig(C.capFig({ top: 1, q: 1, field: true, pts: (() => { const o = [[0, 0]]; for (let x = 0; x <= 1.0001; x += 0.02) o.push([x, x < 0.09 ? 0 : -0.85 * ((x - 0.09) / 0.91) ** 2]); return o; })() }))),
        frame(L("Millikan's oil drop", 'Millikans Öltröpfchen'), `<p>${L('A tiny charged oil drop hovers between two plates when the electric force balances its weight: q·U/d = m·g. Millikan found that the charge is always a whole number of elementary charges, e = 1.602 · 10⁻¹⁹ C.', 'Ein winziges geladenes Öltröpfchen schwebt zwischen zwei Platten, wenn die elektrische Kraft seinem Gewicht das Gleichgewicht hält: q·U/d = m·g. Millikan fand, dass die Ladung immer ein ganzzahliges Vielfaches der Elementarladung e = 1.602 · 10⁻¹⁹ C ist.')}</p>`,
          fig(C.capFig({ top: 1, q: -1, field: true, sym: '·' }))),
        frame(L('Comparing deflections', 'Ablenkungen vergleichen'), `<p>${L('The deflection is y = |q|·U·L²/(2·m·d·v²). To compare two experiments, take the factor of each quantity: an alpha particle has twice the charge and four times the mass of a proton, so at the same speed it is deflected half as far. Twice as fast: a quarter of the deflection.', 'Die Ablenkung ist y = |q|·U·L²/(2·m·d·v²). Um zwei Versuche zu vergleichen, nimm den Faktor jeder Grösse: Ein Alphateilchen hat die doppelte Ladung und die vierfache Masse eines Protons, wird also bei gleicher Geschwindigkeit halb so weit abgelenkt. Doppelt so schnell: ein Viertel der Ablenkung.')}</p>`,
          fig(C.capFig({ top: 1, q: 1, sym: 'α', field: true, pts: (() => { const o = [[0, 0]]; for (let x = 0; x <= 1.0001; x += 0.02) o.push([x, x < 0.09 ? 0 : -0.42 * ((x - 0.09) / 0.91) ** 2]); return o; })() }))),
      ] },
  ];
  const stage = (name, types) => ({ name, types });
  const TOPICS = [
    { name: () => L('Field and force', 'Feld und Kraft'), example: () => 0, stages: [stage(() => L('direction', 'Richtung'), ['force-dir']), stage(() => L('numbers', 'Zahlen'), ['force-num'])] },
    { name: () => L('Field lines', 'Feldlinien'), example: () => 1, stages: [stage(() => L('which diagram', 'welches Diagramm'), ['lines-pick']), stage(() => L('reading a diagram', 'ein Diagramm lesen'), ['lines-read']), stage(() => L('conductors', 'Leiter'), ['conductor'])] },
    { name: () => L('Fields add up', 'Felder addieren sich'), example: () => 2, stages: [stage(() => L('at a point', 'in einem Punkt'), ['superpose']), stage(() => L('where it is zero', 'wo es null ist'), ['zero'])] },
    { name: () => L('Comparing fields', 'Felder vergleichen'), example: () => 3, stages: [stage(() => L('factors', 'Faktoren'), ['factor']), stage(() => L('two capacitors', 'zwei Kondensatoren'), ['plates-compare'])] },
    { name: () => L('Dipoles', 'Dipole'), example: () => 4, stages: [stage(() => L('uniform field', 'homogenes Feld'), ['dipole-uniform']), stage(() => L('near a charge', 'nahe einer Ladung'), ['dipole-point'])] },
    { name: () => L('Charges in a uniform field', 'Ladungen im homogenen Feld'), example: () => 5, stages: [stage(() => L('the path', 'die Bahn'), ['deflect-path']), stage(() => L("Millikan's drop", 'Millikans Tröpfchen'), ['millikan']), stage(() => L('two deflections', 'zwei Ablenkungen'), ['deflect-compare'])] },
    { name: () => L('True or false', 'Richtig oder falsch'), example: () => 1, stages: [stage(() => L('statements', 'Aussagen'), ['stmts'])] },
  ];
  const lessons = () => LESSONS.map((l) => ({ name: l.name(), idea: l.idea(), frames: l.frames, also: topics.also(l.topic) }));

  // ---------------------------------------------------------------- arcade
  const KINDS = [['force-dir', 1], ['factor', 2], ['lines-pick', 2], ['deflect-path', 2], ['dipole-uniform', 2], ['conductor', 2], ['force-num', 2],
    ['superpose', 3], ['zero', 3], ['lines-read', 3], ['plates-compare', 3], ['millikan', 3], ['dipole-point', 4], ['deflect-compare', 3]];
  const CONCEPT = { sign: 'sign', perp: 'perp', none: 'none', some: 'none', bent: 'none', straight: 'none', reverse: 'lines', separate: 'lines', swap: 'lines', equal: 'lines',
    plate: 'conductor', away: 'conductor', flow: 'conductor', through: 'conductor', inside: 'conductor', largest: 'sum', miss: 'sum', linear: 'square', circle: 'parabola', half: 'cap', same: 'eq', prefix: 'eq', noHalf: 'parabola' };
  function arcadeQuestion(kind, seed) {
    const e = X.make(kind, seed), qs = e.questions.filter((q) => q.type !== 'multi' && !q.multi), q = qs[seed % qs.length];
    return {
      title: e.title, text: e.text, figure: `<div class="figs">${e.figs || ''}</div>`, ask: q.label.replace(/^\([a-d]\) /, ''),
      options: q.options.map((o) => ({ html: o.html || o.label, correct: o.ok, flag: o.ok ? null : o.tag || 'other', why: o.why })),
      explain: () => `${e.solFig || ''}<div class="steps">${e.solution.map((s) => `<p>${s}</p>`).join('')}</div>`,
    };
  }
  const arcadeSource = {
    id: 'ef', kinds: KINDS.map(([id, difficulty]) => ({ id, difficulty })), question: arcadeQuestion, concept: CONCEPT,
    concepts: () => ({
      sign: L('the force on a negative charge', 'die Kraft auf eine negative Ladung'), perp: L('the force along the field', 'die Kraft längs des Feldes'), none: L('when there is a force', 'wann es eine Kraft gibt'),
      lines: L('the rules of field lines', 'die Regeln der Feldlinien'), conductor: L('conductors', 'Leiter'), sum: L('adding fields as vectors', 'Felder als Vektoren addieren'),
      square: L('the square of the distance', 'das Quadrat des Abstands'), parabola: L('a parabola in a uniform field', 'eine Parabel im homogenen Feld'), cap: L('the field of a capacitor', 'das Feld eines Kondensators'), eq: L('E = F/q', 'E = F/q'),
    }),
    intro: () => ({
      tag: L('Field lines, forces, superposition and capacitors: answer as many questions as you can in <b>5 minutes</b>.', 'Feldlinien, Kräfte, Überlagerung und Kondensatoren: Beantworte in <b>5 Minuten</b> so viele Fragen wie möglich.'),
      rule: L('Questions get harder as you go. Choose one of the answers: click it or press its number.', 'Die Fragen werden nach und nach schwieriger. Wähle eine der Antworten: Klicke sie an oder drücke ihre Nummer.'),
      example: L('field lines that cross', 'Feldlinien, die sich kreuzen'),
    }),
    hero: () => `<div class="figs"><div class="fig">${C.fig(two(1, -1), { box: BOX, lines: true })}</div></div><p class="ar-law"><span class="vec"><i>E</i></span> = <span class="vec"><i>F</i></span>/q</p>`,
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
    store('ef-mode', m);
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
      app: PRACTICE, problems: window.FieldProblems.PROBLEMS, make: window.FieldProblems.realOf,
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
    const last = stored('ef-mode', 'tutor');
    if (last === 'tutor') { setMode('tutor'); tutor.open(0); } else if (last === 'arcade') play(); else if (last === 'real') realMode(); else { setMode('practice'); fresh(); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
