(function () {
  'use strict';

  const M = window.Magnet, X = window.MagEx, P = window.MagPlot, Figs = window.MagFigures;
  const { scene, pathFig } = P;
  const Lang = window.Lang, Arcade = window.Arcade, L = Lang.L;
  const $ = (sel) => document.querySelector(sel);

  // ---------------------------------------------------------------- interface texts
  const UI = {
    en: {
      title: 'Magnetic Forces', mode: 'Mode', difficulty: 'Difficulty', example: 'Example',
      tutor: 'Tutor', practice: 'Practice', real: 'Problems', arcade: 'Arcade', new: 'New exercise', problem: 'Problem', newNumbers: 'New numbers', nextProblem: 'Next problem',
      tutorNote: 'Use the arrow keys ← → to step through. Blue: velocity or current, green: magnetic field, red: force; ⊙ points out of the page, ⊗ into it.',
      check: 'Check', reveal: 'Show solution', hints: 'Hints', solution: 'Solution', option: (k) => `Option ${k}`,
      revealNote: (n) => `The solution unlocks once you have solved the exercise, used all hints or made ${n} attempts.`,
      stars: (d) => `Difficulty: ${d} of 5`, score: (s, c) => `Solved: ${s} · first try without hints: ${c}`,
      hint: (n) => `Hint (${n} left)`, noHints: 'No more hints', unlocks: (n) => `Unlocks after all hints or ${n} attempts`,
      fill: 'Answer every question, then check.', okWell: 'All correct, well done!',
      notYet: (n) => `Not quite yet (attempt ${n}).`, tryAgain: ' Try again, or take a hint.', canReveal: ' You can take a hint or look at the solution.',
      correct: 'Correct', missed: 'This one fits too:', shown: 'The right answers are marked.',
    },
    de: {
      title: 'Magnetische Kräfte', mode: 'Modus', difficulty: 'Schwierigkeit', example: 'Beispiel',
      tutor: 'Tutor', practice: 'Üben', real: 'Praxisaufgaben', arcade: 'Arcade', new: 'Neue Aufgabe', problem: 'Aufgabe', newNumbers: 'Neue Zahlen', nextProblem: 'Nächste Aufgabe',
      tutorNote: 'Mit den Pfeiltasten ← → blätterst du weiter. Blau: Geschwindigkeit oder Strom, grün: Magnetfeld, rot: Kraft; ⊙ zeigt aus der Seite heraus, ⊗ hinein.',
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
  function showScore() { const s = stored('mf-score', { solved: 0, clean: 0 }); $('#score').textContent = s.solved ? ui().score(s.solved, s.clean) : ''; }
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
  const PRACTICE = 'mf', typeOf = (e) => e.type;
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
    const s = stored('mf-score', { solved: 0, clean: 0 });
    s.solved++;
    if (st.tries === 1 && st.hints === 0) s.clean++;
    store('mf-score', s);
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
  const dn = X.dirName;
  const IN = [0, 0, -1], OUT = [0, 0, 1], RIGHT = [1, 0, 0], LEFT = [-1, 0, 0], UP = [0, 1, 0], DOWN = [0, -1, 0];
  const LESSONS = [
    { topic: 0, stage: 0, name: () => L('The hand rules', 'Die Handregeln'), idea: () => L('Right hand for positive charges and currents, left hand for negative charges: thumb along the motion, index finger along the field, middle finger: the force.', 'Rechte Hand für positive Ladungen und Ströme, linke Hand für negative Ladungen: Daumen in Bewegungsrichtung, Zeigefinger in Feldrichtung, Mittelfinger: die Kraft.'),
      frames: () => [
        frame(L('A positive charge', 'Eine positive Ladung'), `<p>${X.RULE()}</p><p>${X.howForce(1, 'v', RIGHT, IN)}</p>`, fig(scene({ field: { dir: IN }, items: [{ kind: 'particle', q: 1, at: [0, 0] }], vecs: [{ of: 0, kind: 'v', dir: RIGHT }, { of: 0, kind: 'F', dir: M.force(1, RIGHT, IN) }] }))),
        frame(L('A negative charge', 'Eine negative Ladung'), `<p>${X.howForce(-1, 'v', RIGHT, IN)}</p><p>${L(`The same motion and field, the opposite force: ${X.LAW()} changes sign with the charge.`, `Dieselbe Bewegung und dasselbe Feld, die entgegengesetzte Kraft: ${X.LAW()} wechselt mit der Ladung das Vorzeichen.`)}</p>`, fig(scene({ field: { dir: IN }, items: [{ kind: 'particle', q: -1, at: [0, 0] }], vecs: [{ of: 0, kind: 'v', dir: RIGHT }, { of: 0, kind: 'F', dir: M.force(-1, RIGHT, IN) }] }))),
        frame(L('A current', 'Ein Strom'), `<p>${L('A current is moving positive charge: the right hand, thumb along the current.', 'Ein Strom ist bewegte positive Ladung: die rechte Hand, Daumen in Stromrichtung.')} ${X.howForce(1, 'I', UP, OUT)}</p>`, fig(scene({ field: { dir: OUT }, items: [{ kind: 'piece', d: UP, at: [0, 0], name: '<tspan class="it">I</tspan>' }], vecs: [{ of: 0, kind: 'F', dir: M.force(1, UP, OUT) }] }))),
        frame(L('No force', 'Keine Kraft'), `<p>${X.PERP()}</p>`, fig(scene({ field: { dir: RIGHT }, items: [{ kind: 'particle', q: 1, at: [0, 0] }], vecs: [{ of: 0, kind: 'v', dir: RIGHT }] }))),
      ] },
    { topic: 0, stage: 2, name: () => L('Which directions fit?', 'Welche Richtungen passen?'), idea: () => L('Only the part of the field across the motion matters: several field directions can give the same force.', 'Nur der Teil des Feldes quer zur Bewegung zählt: Mehrere Feldrichtungen können dieselbe Kraft ergeben.'),
      frames: () => {
        const v = RIGHT, F = OUT, fit = M.fitting('B', 1, v, F);
        return [
          frame(L('The field is missing', 'Das Feld fehlt'), `<p>${L(`A positive charge moves ${dn(v)}; the force points ${dn(F)}. Which field gives this force? Right hand: thumb ${dn(v)}, middle finger ${dn(F)}: the index finger points ${dn(UP)}.`, `Eine positive Ladung bewegt sich ${dn(v)}; die Kraft zeigt ${dn(F)}. Welches Feld ergibt diese Kraft? Rechte Hand: Daumen ${dn(v)}, Mittelfinger ${dn(F)}: Der Zeigefinger zeigt ${dn(UP)}.`)}</p>`,
            fig(scene({ items: [{ kind: 'particle', q: 1, at: [0, 0] }], vecs: [{ of: 0, kind: 'v', dir: v }, { of: 0, kind: 'F', dir: F }, { of: 0, kind: 'B', dir: UP }] }))),
          frame(L('But not only that one', 'Aber nicht nur dieses'), `<p>${L(`A field ${dn([1, 1, 0])} has a part ${dn(UP)} and a part ${dn(RIGHT)}, along the motion. The part along the motion gives no force: this field gives a force ${dn(F)} as well. All these fit: ${fit.map(dn).join(', ')}.`, `Ein Feld ${dn([1, 1, 0])} hat einen Teil ${dn(UP)} und einen Teil ${dn(RIGHT)}, längs der Bewegung. Der Teil längs der Bewegung ergibt keine Kraft: Auch dieses Feld ergibt eine Kraft ${dn(F)}. Alle diese passen: ${fit.map(dn).join(', ')}.`)}</p>`,
            fig(scene({ items: [{ kind: 'particle', q: 1, at: [0, 0] }], vecs: [{ of: 0, kind: 'v', dir: v }, { of: 0, kind: 'F', dir: F }, ...fit.map((d, i) => ({ of: 0, kind: 'B', dir: d, name: `B<tspan class="sub" dy="3">${i + 1}</tspan>` }))] }))),
          frame(L('In the exercises', 'In den Aufgaben'), `<p>${L('When the field or the velocity is missing, tick all the directions that fit. Rule out those that are not perpendicular to the force, then check the rest with the hand rule.', 'Wenn das Feld oder die Geschwindigkeit fehlt, kreuze alle Richtungen an, die passen. Schliesse jene aus, die nicht senkrecht zur Kraft stehen, und prüfe die übrigen mit der Handregel.')}</p>`,
            fig(scene({ items: [{ kind: 'particle', q: 1, at: [0, 0] }], vecs: [{ of: 0, kind: 'v', dir: v }, { of: 0, kind: 'F', dir: F }, { of: 0, kind: 'B', unknown: true }] }))),
        ];
      } },
    { topic: 1, stage: 0, name: () => L('Two currents', 'Zwei Ströme'), idea: () => L('First the field of one current at the other, then the force on the other.', 'Zuerst das Feld des einen Stroms beim anderen, dann die Kraft auf den anderen.'),
      frames: () => {
        const w1 = { kind: 'wire', d: OUT, at: [-1.2, 0], name: '1' };
        return [
          frame(L('The field of a current', 'Das Feld eines Stroms'), `<p>${X.GRIP()} ${L(`Wire 1 carries a current out of the page: at wire 2, to its right, the field points ${dn(UP)}.`, `Draht 1 führt einen Strom aus der Seite heraus: Bei Draht 2, rechts davon, zeigt das Feld ${dn(UP)}.`)}</p>`,
            fig(scene({ items: [w1, { kind: 'wire', d: OUT, at: [1.2, 0], name: '2' }], vecs: [{ of: 1, kind: 'B', dir: UP }] }))),
          frame(L('The force on the other', 'Die Kraft auf den anderen'), `<p>${X.howForce(1, 'I', OUT, UP)} ${L('Currents in the same direction attract each other.', 'Gleich gerichtete Ströme ziehen sich an.')}</p>`,
            fig(scene({ items: [w1, { kind: 'wire', d: OUT, at: [1.2, 0], name: '2' }], vecs: [{ of: 1, kind: 'B', dir: UP }, { of: 1, kind: 'F', dir: M.force(1, OUT, UP) }] }))),
          frame(L('Opposite currents', 'Entgegengesetzte Ströme'), `<p>${X.howForce(1, 'I', IN, UP)} ${L('Opposite currents repel each other.', 'Entgegengesetzte Ströme stossen sich ab.')}</p>`,
            fig(scene({ items: [w1, { kind: 'wire', d: IN, at: [1.2, 0], name: '2' }], vecs: [{ of: 1, kind: 'B', dir: UP }, { of: 1, kind: 'F', dir: M.force(1, IN, UP) }] }))),
          frame(L('At an angle', 'Schräg zueinander'), `<p>${L(`The currents need not be parallel. Wire 1 runs ${dn(UP)}; a piece of wire 2 to its right carries a current ${dn(RIGHT)}. The field of wire 1 there points ${dn(M.wireField(UP, [1.6, 0, 0]))}. ${X.howForce(1, 'I', RIGHT, M.wireField(UP, [1.6, 0, 0]))}`, `Die Ströme müssen nicht parallel sein. Draht 1 verläuft ${dn(UP)}; ein Stück von Draht 2 rechts davon führt einen Strom ${dn(RIGHT)}. Das Feld von Draht 1 zeigt dort ${dn(M.wireField(UP, [1.6, 0, 0]))}. ${X.howForce(1, 'I', RIGHT, M.wireField(UP, [1.6, 0, 0]))}`)}</p>`,
            fig(scene({ items: [{ kind: 'wire', d: UP, at: [-0.8, 0], name: '1' }, { kind: 'piece', d: RIGHT, at: [1.2, 0], name: '2' }], vecs: [{ of: 1, kind: 'B', dir: M.wireField(UP, [1.6, 0, 0]) }, { of: 1, kind: 'F', dir: M.force(1, RIGHT, M.wireField(UP, [1.6, 0, 0])) }] }))),
        ];
      } },
    { topic: 2, stage: 0, name: () => L('On a circle', 'Auf einem Kreis'), idea: () => L('The magnetic force is always perpendicular to the velocity: the charge circles at constant speed, r = m·v/(q·B).', 'Die magnetische Kraft steht immer senkrecht zur Geschwindigkeit: Die Ladung kreist mit konstantem Betrag der Geschwindigkeit, r = m·v/(q·B).'),
      frames: () => {
        const run = (k) => M.path({ x0: -0.6, y0: 0.5, vx: 1, vy: 0, k, Bz: () => -1, inside: (x) => x >= 1, dt: 0.02, n: 900, stop: (x, y) => x < -1.2 || Math.abs(y) > 3.5 });
        const base = { box: [-1, 6, -3.2, 3.2], region: [1, 6, -3.2, 3.2], bz: -1, q: 1 };
        return [
          frame(L('Into the field', 'Ins Feld hinein'), `<p>${L('A proton flies into a field that points into the page. Right hand: the force points up, perpendicular to the velocity. As the proton turns, the force turns with it: always towards the centre of a circle.', 'Ein Proton fliegt in ein Feld, das in die Seite hinein zeigt. Rechte Hand: Die Kraft zeigt nach oben, senkrecht zur Geschwindigkeit. Während sich das Proton dreht, dreht die Kraft mit: immer zum Mittelpunkt eines Kreises.')}</p>`, fig(pathFig({ ...base, pts: run(1 / 1.4) }))),
          frame(L('The radius', 'Der Radius'), `<p>${L('The magnetic force is the centripetal force: q·v·B = m·v²/r, so r = m·v/(q·B). Faster or heavier: a wider circle; more charge or a stronger field: a tighter one.', 'Die magnetische Kraft ist die Zentripetalkraft: q·v·B = m·v²/r, also r = m·v/(q·B). Schneller oder schwerer: ein weiterer Kreis; mehr Ladung oder ein stärkeres Feld: ein engerer.')}</p>`, fig(pathFig({ ...base, pts: run(1 / 2) }))),
          frame(L('The period', 'Die Umlaufzeit'), `<p>${L('One turn takes T = 2π·r/v = 2π·m/(q·B): the speed cancels out. A faster charge runs a larger circle in the same time. The cyclotron is built on this.', 'Ein Umlauf dauert T = 2π·r/v = 2π·m/(q·B): Die Geschwindigkeit kürzt sich heraus. Eine schnellere Ladung läuft einen grösseren Kreis in derselben Zeit. Darauf beruht das Zyklotron.')}</p>`, fig(pathFig({ ...base, q: -1, pts: run(-1 / 1.4) }))),
        ];
      } },
    { topic: 2, stage: 1, name: () => L('Helix and growing field', 'Schraube und wachsendes Feld'), idea: () => L('Along the field nothing changes: a slanting start gives a helix. Where the field grows, the circles get tighter.', 'Längs des Feldes ändert sich nichts: Ein schräger Start ergibt eine Schraube. Wo das Feld wächst, werden die Kreise enger.'),
      frames: () => {
        const helix = [], R = 0.8;
        for (let t = 0; t <= 60; t += 0.05) helix.push([0.7 * t, R * Math.sin((0.7 / R) * t)]);
        const grow = M.path({ x0: 0, y0: 0, vx: 0, vy: 1, dt: 0.02, n: 1700, k: 1 / 1, Bz: (x, y) => 1 + 0.3 * y });
        return [
          frame(L('A slanting start', 'Ein schräger Start'), `<p>${L('Split the velocity into a part along the field and a part across it. Along the field there is no force: that part stays. Across it the charge circles. Together: a helix around the field lines.', 'Zerlege die Geschwindigkeit in einen Teil längs des Feldes und einen Teil quer dazu. Längs des Feldes gibt es keine Kraft: Dieser Teil bleibt. Quer dazu kreist die Ladung. Zusammen: eine Schraubenlinie um die Feldlinien.')}</p>`, fig(pathFig({ box: [-0.5, 7.5, -2.4, 2.4], bx: 1, q: 1, pts: helix }))),
          frame(L('Seen along the field', 'Längs des Feldes gesehen'), `<p>${L('Look at the same path along the field lines (the field now points towards you): you see its projection onto the plane perpendicular to the field. The part of the velocity along the field disappears, the part across it remains: the path is a circle with r = m·v<sub>⊥</sub>/(q·B), where v<sub>⊥</sub> is the part of the velocity across the field. A positive charge circles clockwise here, a negative one anticlockwise.',
            'Betrachte dieselbe Bahn längs der Feldlinien (das Feld zeigt jetzt auf dich zu): Du siehst ihre Projektion auf die Ebene senkrecht zum Feld. Der Teil der Geschwindigkeit längs des Feldes verschwindet, der Teil quer dazu bleibt: Die Bahn ist ein Kreis mit r = m·v<sub>⊥</sub>/(q·B), wobei v<sub>⊥</sub> der Teil der Geschwindigkeit quer zum Feld ist. Eine positive Ladung kreist hier im Uhrzeigersinn, eine negative im Gegenuhrzeigersinn.')}</p>`,
            fig(pathFig({ box: [-2.4, 2.4, -2.1, 1.5], bz: 1, q: 1, pts: M.path({ x0: 0, y0: 0.8, vx: 1, vy: 0, k: 1 / 0.8, Bz: () => 1, dt: 0.02, n: 330 }) }))),
          frame(L('A growing field', 'Ein wachsendes Feld'), `<p>${L('Here the field (out of the page) gets stronger upwards. In the strong field the circle is tighter, in the weak field wider: the loops do not close, and the charge drifts sideways.', 'Hier wird das Feld (aus der Seite heraus) nach oben stärker. Im starken Feld ist der Kreis enger, im schwachen weiter: Die Schleifen schliessen sich nicht, und die Ladung driftet seitwärts.')}</p>`, fig(pathFig({ box: [-5, 5, -2.6, 2.6], bz: 1, grad: 0.3, q: 1, pts: grow }))),
          frame(L('A magnetic mirror', 'Ein magnetischer Spiegel'), `<p>${L('A charge spiralling along field lines that crowd together meets a stronger and stronger field: its circles get tighter and it can be turned back. This is how the Earth’s field traps charged particles, which make the aurora near the poles.', 'Eine Ladung, die längs zusammenlaufender Feldlinien schraubt, trifft auf ein immer stärkeres Feld: Ihre Kreise werden enger, und sie kann umgekehrt werden. So fängt das Erdfeld geladene Teilchen ein, die in Polnähe das Polarlicht erzeugen.')}</p>`, Figs.earth({ aurora: true })),
        ];
      } },
    { topic: 4, stage: 0, name: () => L('The velocity selector', 'Das Geschwindigkeitsfilter'), idea: () => L('An electric and a magnetic force in opposite directions cancel at exactly one speed, v = E/B.', 'Eine elektrische und eine magnetische Kraft in entgegengesetzten Richtungen heben sich bei genau einer Geschwindigkeit auf, v = E/B.'),
      frames: () => [
        frame(L('Two forces', 'Zwei Kräfte'), `<p>${L('A positive ion flies between two plates. The electric field pushes it down with q·E; the magnetic field (into the page) pushes it up with q·v·B (right hand).', 'Ein positives Ion fliegt zwischen zwei Platten. Das elektrische Feld drückt es mit q·E nach unten; das Magnetfeld (in die Seite hinein) drückt es mit q·v·B nach oben (rechte Hand).')}</p>`, fig(P.selectorFig({ Edown: true, bz: -1, q: 1 }))),
        frame(L('Straight through', 'Gerade durch'), `<p>${L('The forces cancel when q·E = q·v·B, so at v = E/B: the same for every charge and every mass. Faster ions are pushed the way of the magnetic force, slower ones the way of the electric force.', 'Die Kräfte heben sich auf, wenn q·E = q·v·B, also bei v = E/B: gleich für jede Ladung und jede Masse. Schnellere Ionen werden in Richtung der magnetischen Kraft gedrückt, langsamere in Richtung der elektrischen.')}</p>`, fig(P.selectorFig({ Edown: true, bz: -1, q: -1 }))),
      ] },
  ];
  const stage = (name, types) => ({ name, types });
  const TOPICS = [
    { name: () => L('The direction of the force', 'Die Richtung der Kraft'), example: (s) => (s >= 2 && s < 3 ? 1 : 0), stages: [stage(() => L('currents', 'Ströme'), ['dir-current']), stage(() => L('charges', 'Ladungen'), ['dir-particle']), stage(() => L('field or velocity missing', 'Feld oder Geschwindigkeit fehlt'), ['dir-missing'])] },
    { name: () => L('Two currents or charges', 'Zwei Ströme oder Ladungen'), example: () => 2, stages: [stage(() => L('parallel currents', 'parallele Ströme'), ['pair-parallel']), stage(() => L('at an angle', 'schräg zueinander'), ['pair-angle']), stage(() => L('moving charges', 'bewegte Ladungen'), ['pair-particles'])] },
    { name: () => L('Paths', 'Bahnen'), example: (s) => (s === 0 ? 3 : 4), stages: [stage(() => L('circle', 'Kreis'), ['path-circle']), stage(() => L('helix', 'Schraube'), ['path-helix']), stage(() => L('growing field', 'wachsendes Feld'), ['path-gradient'])] },
    { name: () => L('Radius and period', 'Radius und Umlaufzeit'), example: () => 3, stages: [stage(() => L('comparing', 'vergleichen'), ['radius-compare']), stage(() => L('numbers', 'Zahlen'), ['radius-num']), stage(() => L('tracks', 'Spuren'), ['tracks'])] },
    { name: () => L('The velocity selector', 'Das Geschwindigkeitsfilter'), example: () => 5, stages: [stage(() => L('selector', 'Filter'), ['selector'])] },
    { name: () => L('True or false', 'Richtig oder falsch'), example: () => 0, stages: [stage(() => L('statements', 'Aussagen'), ['stmts'])] },
  ];
  const lessons = () => LESSONS.map((l) => ({ name: l.name(), idea: l.idea(), frames: l.frames, also: topics.also(l.topic) }));

  // ---------------------------------------------------------------- arcade
  // One question of an exercise with a single right answer: directions, drawings or values.
  const KINDS = [['dir-current', 1], ['dir-particle', 2], ['pair-parallel', 2], ['path-circle', 2], ['radius-compare', 2], ['pair-angle', 3], ['path-helix', 3], ['radius-num', 3], ['selector', 3], ['tracks', 3], ['pair-particles', 4], ['path-gradient', 4]];
  const CONCEPT = { hand: 'hand', alongV: 'perp', alongB: 'perp', none: 'none', some: 'none', radial: 'grip', along: 'grip', parabola: 'circle', straight: 'circle', bent: 'none', circle: 'helix', line: 'helix', tilted: 'helix', mirror: 'grad', closed: 'grad', spiral: 'work', diam: 'radius', twopi: 'radius', half: 'radius', inv: 'selector', prod: 'selector' };
  function arcadeQuestion(kind, seed) {
    const e = X.make(kind, seed), qs = e.questions.filter((q) => q.type !== 'multi' && !q.multi), q = qs[seed % qs.length];
    return {
      title: e.title, text: e.text, figure: `<div class="figs">${e.figs || ''}</div>`, ask: q.label.replace(/^\([a-d]\) /, ''),
      options: q.options.map((o) => ({ html: o.html || o.label, correct: o.ok, flag: o.ok ? null : o.tag || 'other', why: o.why })),
      explain: () => `${e.solFig || ''}<div class="steps">${e.solution.map((s) => `<p>${s}</p>`).join('')}</div>`,
    };
  }
  const arcadeSource = {
    id: 'mf', kinds: KINDS.map(([id, difficulty]) => ({ id, difficulty })), question: arcadeQuestion, concept: CONCEPT,
    concepts: () => ({
      hand: L('which hand (the sign of the charge)', 'welche Hand (das Vorzeichen der Ladung)'), perp: L('the force perpendicular to motion and field', 'die Kraft senkrecht zu Bewegung und Feld'),
      none: L('when there is no force', 'wann es keine Kraft gibt'), grip: L('the field around a current', 'das Feld um einen Strom'), circle: L('a circle, not a parabola', 'ein Kreis, keine Parabel'),
      helix: L('the helix along the field', 'die Schraube längs des Feldes'), grad: L('the drift in a growing field', 'die Drift in einem wachsenden Feld'), work: L('no work, constant speed', 'keine Arbeit, konstante Geschwindigkeit'),
      radius: L('radius and period', 'Radius und Umlaufzeit'), selector: L('the velocity selector', 'das Geschwindigkeitsfilter'),
    }),
    intro: () => ({
      tag: L('Hand rules, currents, paths and circles: answer as many questions as you can in <b>5 minutes</b>.', 'Handregeln, Ströme, Bahnen und Kreise: Beantworte in <b>5 Minuten</b> so viele Fragen wie möglich.'),
      rule: L('Questions get harder as you go. Choose one of the answers: click it or press its number.', 'Die Fragen werden nach und nach schwieriger. Wähle eine der Antworten: Klicke sie an oder drücke ihre Nummer.'),
      example: L('a force along the field lines', 'eine Kraft längs der Feldlinien'),
    }),
    hero: () => `<div class="figs"><div class="fig">${scene({ field: { dir: IN }, items: [{ kind: 'particle', q: 1, at: [0, 0] }], vecs: [{ of: 0, kind: 'v', dir: RIGHT }, { of: 0, kind: 'F', dir: UP }] })}</div></div><p class="ar-law">${X.LAW()}</p>`,
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
    store('mf-mode', m);
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
    const d = h.match(/^([a-z]+(?:-[a-z]+)*)-(\d+)$/);
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
      app: PRACTICE, problems: window.MagProblems.PROBLEMS, make: window.MagProblems.realOf,
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
    const last = stored('mf-mode', 'tutor');
    if (last === 'tutor') { setMode('tutor'); tutor.open(0); } else if (last === 'arcade') play(); else if (last === 'real') realMode(); else { setMode('practice'); fresh(); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
