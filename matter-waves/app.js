(function () {
  'use strict';

  const P = window.MatterWave, X = window.MatterEx, G = window.MatterPlot;
  const Lang = window.Lang, Arcade = window.Arcade, L = Lang.L;
  const $ = (sel) => document.querySelector(sel);
  const { plain, sci } = P;

  // ---------------------------------------------------------------- interface texts
  const UI = {
    en: {
      title: 'Matter Waves', mode: 'Mode', difficulty: 'Difficulty', example: 'Example',
      tutor: 'Tutor', practice: 'Practice', real: 'Problems', arcade: 'Arcade', new: 'New exercise', problem: 'Problem', newNumbers: 'New numbers', nextProblem: 'Next problem',
      tutorNote: 'Use the arrow keys ← → to step through. Numbers can be typed as 3.8e-24 or 3.8·10^-24; a comma works as a decimal point too.',
      check: 'Check', reveal: 'Show solution', hints: 'Hints', solution: 'Solution',
      revealNote: (n) => `The solution unlocks once you have solved the exercise, used all hints or made ${n} attempts.`,
      stars: (d) => `Difficulty: ${d} of 5`, score: (s, c) => `Solved: ${s} · first try without hints: ${c}`,
      hint: (n) => `Hint (${n} left)`, noHints: 'No more hints', unlocks: (n) => `Unlocks after all hints or ${n} attempts`,
      fill: 'Answer every question, then check.', okWell: 'All correct, well done!',
      notYet: (n) => `Not quite yet (attempt ${n}).`, tryAgain: ' Try again, or take a hint.', canReveal: ' You can take a hint or look at the solution.',
      correct: 'Correct', notThis: 'Not this one: check your reasoning, or take a hint.', notAll: 'Not all the answers that fit are chosen yet.', stmtsWrong: (n) => (n === 1 ? 'One statement is judged wrong.' : `${n} statements are judged wrong.`), missed: 'This one fits too:', shown: 'The right answers are filled in.',
      number: 'Enter a number', sign: 'Wrong sign', prefix: 'Off by a factor of 1000: check the unit prefix', power: 'Check the power of ten', close: 'Close: check your rounding', wrong: 'Not correct',
    },
    de: {
      title: 'Materiewellen', mode: 'Modus', difficulty: 'Schwierigkeit', example: 'Beispiel',
      tutor: 'Tutor', practice: 'Üben', real: 'Praxisaufgaben', arcade: 'Arcade', new: 'Neue Aufgabe', problem: 'Aufgabe', newNumbers: 'Neue Zahlen', nextProblem: 'Nächste Aufgabe',
      tutorNote: 'Mit den Pfeiltasten ← → blätterst du weiter. Zahlen kannst du als 3.8e-24 oder 3.8·10^-24 eingeben; ein Komma geht auch als Dezimalzeichen.',
      check: 'Prüfen', reveal: 'Lösung zeigen', hints: 'Tipps', solution: 'Lösung',
      revealNote: (n) => `Die Lösung wird freigeschaltet, sobald du die Aufgabe gelöst, alle Tipps genutzt oder ${n} Versuche gemacht hast.`,
      stars: (d) => `Schwierigkeit: ${d} von 5`, score: (s, c) => `Gelöst: ${s} · beim ersten Versuch ohne Tipps: ${c}`,
      hint: (n) => `Tipp (${n} übrig)`, noHints: 'Keine Tipps mehr', unlocks: (n) => `Wird nach allen Tipps oder ${n} Versuchen freigeschaltet`,
      fill: 'Beantworte jede Frage und prüfe dann.', okWell: 'Alles richtig, gut gemacht!',
      notYet: (n) => `Noch nicht ganz (Versuch ${n}).`, tryAgain: ' Versuche es nochmals, oder nimm einen Tipp.', canReveal: ' Du kannst einen Tipp nehmen oder die Lösung anschauen.',
      correct: 'Richtig', notThis: 'Das stimmt nicht: Überprüfe deine Überlegung, oder nimm einen Tipp.', notAll: 'Noch sind nicht alle passenden Antworten gewählt.', stmtsWrong: (n) => (n === 1 ? 'Eine Aussage ist falsch beurteilt.' : `${n} Aussagen sind falsch beurteilt.`), missed: 'Auch diese passt:', shown: 'Die richtigen Antworten sind eingetragen.',
      number: 'Gib eine Zahl ein', sign: 'Falsches Vorzeichen', prefix: 'Um den Faktor 1000 daneben: Prüfe die Einheit', power: 'Prüfe die Zehnerpotenz', close: 'Knapp daneben: Prüfe deine Rundung', wrong: 'Nicht richtig',
    },
  };
  const ui = () => UI[Lang.get()];

  let ex = null, st = null, tutor = null, arcade = null, topics = null, problems = null;
  function stored(key, fallback) { try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; } }
  function store(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ } }
  function showScore() { const s = stored('mw-score', { solved: 0, clean: 0 }); $('#score').textContent = s.solved ? ui().score(s.solved, s.clean) : ''; }
  const starsOf = (d) => `<span class="stars" role="img" aria-label="${ui().stars(d)}" title="${ui().stars(d)}">${'★'.repeat(d)}${'☆'.repeat(5 - d)}</span>`;
  // Wide pictures scroll on small screens; say so, since the cut-off part is invisible.
  function markScrollable() { document.querySelectorAll('.fig').forEach((el) => el.classList.toggle('scrolls', el.scrollWidth > el.clientWidth + 1)); }

  // ---------------------------------------------------------------- numbers typed in
  // 3.8e-24, 3.8·10^-24, 3.8 x 10^-24, 3,8 · 10⁻²⁴, a minus as phones type it, a unit left over at the end
  const SUPS = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-' };
  function parse(s) {
    s = String(s).trim().replace(/,/g, '.').replace(/[−–—‒]/g, '-').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g, (m) => `^${[...m].map((ch) => SUPS[ch]).join('')}`);
    s = s.replace(/\s*(?:[·*×x]|\\cdot)\s*10\s*\^?\s*\(?([-+]?\d+)\)?/i, 'e$1').replace(/\s+/g, '');
    s = s.replace(/^([-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)[^\d]*$/i, '$1');
    const m = s.match(/^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i);
    return m ? Number(s) : NaN;
  }
  // { cls: ok | warn | bad, msg, why }: why, the text of a typical mistake that fits
  function judge(x, q) {
    if (Number.isNaN(x)) return { cls: 'bad', msg: ui().number };
    const v = q.value;
    const near = (y, tol = q.tol, abs = q.abs) => Math.abs(y - v) <= Math.max(tol * Math.abs(v), abs || 0) + 1e-12;
    if (near(x) || (q.scale !== 1 && near(x / q.scale))) return { cls: 'ok', msg: ui().correct };
    for (const w of q.wrong || []) {
      if (Math.abs(x - w.value) <= Math.max(0.02 * Math.abs(w.value), q.abs || 0) || (q.scale !== 1 && Math.abs(x / q.scale - w.value) <= 0.02 * Math.abs(w.value))) return { cls: 'bad', msg: w.why, tag: w.tag };
    }
    if (near(-x)) return { cls: 'warn', msg: ui().sign };
    if (near(x / 1000) || near(x * 1000)) return { cls: 'warn', msg: ui().prefix };
    for (let k = -12; k <= 12; k++) if (k && (near(x * 10 ** k, q.tol * 1.5) || (q.scale !== 1 && near((x / q.scale) * 10 ** k, q.tol * 1.5)))) return { cls: 'warn', msg: ui().power };
    if (near(x, Math.max(0.05, 2 * q.tol), (q.abs || 0) * 2)) return { cls: 'warn', msg: ui().close };
    return { cls: 'bad', msg: ui().wrong };
  }
  // the right value as the student would type it
  const typed = (q) => String(P.round(q.value, 3));

  // ---------------------------------------------------------------- questions
  // num: a number field; choice: a row of options; pick: drawings; multi: statements to tick.
  // Number fields that follow each other share one grid, so that their inputs line up.
  function questionHtml(q) {
    if (q.type === 'num') {
      return `<div class="field" data-key="${q.key}"><span class="what">${q.label}</span><label class="sym" for="in-${q.key}">${q.sym ? `${q.sym}&nbsp;=` : ''}</label><input id="in-${q.key}" type="text" inputmode="decimal" autocomplete="off" enterkeyhint="done" spellcheck="false"><span class="unit">${q.unit}</span><span class="fb" aria-live="polite"></span></div>`;
    }
    if (q.type === 'pick') {
      return `<p class="ask">${q.label}</p><div class="cands" role="radiogroup">${q.options.map((o, k) => `<label class="cand" data-k="${k}"><input type="radio" name="q-${q.key}" value="${k}"><span class="letter">${k + 1}</span>${o.html}</label>`).join('')}</div><ul class="qfb" data-fb="${q.key}"></ul>`;
    }
    if (q.type === 'multi') {
      return `<ul class="stmts">${q.statements.map((s, k) => `<li data-k="${k}"><label><input type="checkbox" name="q-${q.key}" value="${k}"><span>${s.html}</span></label><span class="fb"></span></li>`).join('')}</ul><p class="fb stmts-fb" data-fb="${q.key}"></p>`;
    }
    return `<div class="qrow" data-key="${q.key}"><span class="what">${q.label}</span><div class="opts" role="radiogroup">${q.options.map((o, k) => `<label><input type="radio" name="q-${q.key}" value="${k}"><span>${o.label}</span></label>`).join('')}</div><span class="fb" aria-live="polite"></span></div>`;
  }
  function questionsHtml(qs) {
    let out = '', nums = '';
    const flush = () => { if (nums) out += `<div class="fields">${nums}</div>`; nums = ''; };
    for (const q of qs) { if (q.type === 'num') nums += questionHtml(q); else { flush(); out += questionHtml(q); } }
    flush();
    return out;
  }
  // Marks every answer; true if all are right, null if one is missing.
  // While the exercise is open, a wrong answer gets a nudge, not the solution: the steps of the
  // solution are taken out of its explanation, and single statements or missed options are not marked.
  function feedback() {
    let all = true, missing = false;
    const done = st && (st.solved || st.revealed);
    const nudge = (w) => {
      if (done) return w;
      let t = w || '';
      for (const s of ex.solution) if (s) t = t.split(s).join('');
      t = t.replace(/\s+/g, ' ').trim();
      return t || ui().notThis;
    };
    for (const q of ex.questions) {
      if (q.type === 'num') {
        const row = $(`.field[data-key="${q.key}"]`), raw = row.querySelector('input').value;
        if (!raw.trim()) { all = false; missing = true; row.className = 'field'; row.querySelector('.fb').textContent = ''; continue; }
        const r = judge(parse(raw), q);
        row.className = `field ${r.cls}`;
        row.querySelector('.fb').innerHTML = r.cls === 'bad' && r.tag ? nudge(r.msg) : r.msg;
        if (r.cls !== 'ok') all = false;
        continue;
      }
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
      if (q.type === 'pick') {
        const notes = [];
        inputs.forEach((x) => {
          const o = q.options[Number(x.value)], el = x.closest('.cand');
          el.classList.remove('ok', 'bad');
          if (x.checked) { el.classList.add(o.ok ? 'ok' : 'bad'); if (!o.ok) { notes.push(nudge(o.why)); all = false; } }
        });
        $(`[data-fb="${q.key}"]`).innerHTML = notes.map((n) => `<li>${n}</li>`).join('');
        continue;
      }
      const o = q.options[on[0]], row = $(`.qrow[data-key="${q.key}"]`);
      row.className = `qrow ${o.ok ? 'ok' : 'bad'}`;
      row.querySelector('.fb').innerHTML = o.ok ? ui().correct : nudge(o.why);
      if (!o.ok) all = false;
    }
    return all ? true : missing && !document.querySelector('#fields .field.bad, #fields .field.warn, .qrow.bad, .cand.bad, .stmts li.bad, .stmts-fb:not(:empty)') ? null : false;
  }

  // ---------------------------------------------------------------- exercises
  const PRACTICE = 'mw', typeOf = (e) => e.type;
  const MAX_TRIES = 3;
  const finish = () => { if (ex && st) Practice.finish(PRACTICE, typeOf(ex), st); };
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
    $('#figure').innerHTML = ex.figs || '';
    $('#fields').innerHTML = questionsHtml(ex.questions);
    $('#hint-list').innerHTML = '';
    $('#hints').hidden = true;
    $('#solution').hidden = true;
    showStatus(null);
    markScrollable();
    updateButtons();
  }
  const canReveal = () => st.solved || Practice.solvedBefore(PRACTICE, ex.id) || st.tries >= MAX_TRIES || st.hints >= ex.hints.length;
  function updateButtons() {
    const left = ex.hints.length - st.hints;
    $('#hint').disabled = left === 0 || st.revealed || st.solved;
    $('#hint').textContent = left ? ui().hint(left) : ui().noHints;
    $('#reveal').disabled = !canReveal() || st.revealed;
    $('#reveal').title = canReveal() ? '' : ui().unlocks(MAX_TRIES);
    $('#reveal-note').textContent = ui().revealNote(MAX_TRIES);
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
  const lock = () => document.querySelectorAll('#fields input').forEach((x) => { x.disabled = true; });
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
    const s = stored('mw-score', { solved: 0, clean: 0 });
    s.solved++;
    if (st.tries === 1 && st.hints === 0) s.clean++;
    store('mw-score', s);
    showScore();
    st.solved = true;
    Practice.markSolved(PRACTICE, ex.id);
    finish();
    st.advance = ex.real != null ? '' : topics.solved(st, ex);
    if (ex.real != null) problems.solved(ex);
    lock();
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
    markScrollable();
  }
  // The right answers filled in and marked.
  function markRight() {
    for (const q of ex.questions) {
      if (q.type === 'num') $(`#in-${q.key}`).value = typed(q);
      else if (q.type === 'multi') q.statements.forEach((s, k) => { $(`.stmts li[data-k="${k}"] input`).checked = s.ok; });
      else q.options.forEach((o, k) => { $(`input[name="q-${q.key}"][value="${k}"]`).checked = o.ok; });
    }
    feedback();
    lock();
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
  const frame = (title, text, figure) => ({ text: `<p class="step-rule">${title}</p>${text}`, figure: figure ? `<div class="figs">${figure}</div>` : '' });
  const fig = (html) => `<div class="fig">${html}</div>`;
  const { i, sb } = X;
  const lam = i('λ'), p = i('p'), m = i('m'), v = i('v'), h = i('h'), U = i('U'), Ek = `${i('E')}${sb('kin')}`, dx = `Δ${i('x')}`, dp = `Δ${i('p')}`, kap = i('κ'), T = i('T'), d = i('d');
  const LESSONS = [
    { topic: 0, stage: 0, name: () => L('Particles as waves', 'Teilchen als Wellen'), idea: () => L('Every particle has a wavelength λ = h/p. For an electron accelerated through U: p = √(2·m·e·U).', 'Jedes Teilchen hat eine Wellenlänge λ = h/p. Für ein Elektron, das mit U beschleunigt wird: p = √(2·m·e·U).'),
      frames: () => {
        const Uv = 150, pp = P.pOfU(P.me, Uv), vv = pp / P.me, lm = P.h / pp, lPh = (P.h * P.c) / (Uv * P.e), ball = P.h / (0.057 * 50);
        return [
          frame(L('De Broglie’s idea', 'De Broglies Idee'), `<p>${L(`Light is a wave, yet it comes in photons with the momentum ${p} = ${h}/${lam}. In 1924 Louis de Broglie turned this round: every particle with the momentum ${p} is a wave too, with the wavelength`, `Licht ist eine Welle, kommt aber in Photonen mit dem Impuls ${p} = ${h}/${lam}. 1924 drehte Louis de Broglie das um: Jedes Teilchen mit dem Impuls ${p} ist auch eine Welle, mit der Wellenlänge`)}</p><p class="law">${lam} = ${h}/${p} = ${h}/(${m}·${v})</p>`),
          frame(L('An electron through 150 V', 'Ein Elektron durch 150 V'), `<p>${L(`An electron accelerated through ${U} = ${Uv} V gains ${Ek} = ${i('e')}·${U} = ${Uv} eV = ½·${m}·${v}². So ${v} = √(2${i('e')}${U}/${m}) = ${sci(vv)} m/s and ${p} = ${m}·${v} = √(2·${m}·${i('e')}·${U}) = ${sci(pp)} kg·m/s.`, `Ein Elektron, das mit ${U} = ${Uv} V beschleunigt wird, gewinnt ${Ek} = ${i('e')}·${U} = ${Uv} eV = ½·${m}·${v}². Also ${v} = √(2${i('e')}${U}/${m}) = ${sci(vv)} m/s und ${p} = ${m}·${v} = √(2·${m}·${i('e')}·${U}) = ${sci(pp)} kg·m/s.`)}</p>`, fig(G.tube({ U: '150 V' }))),
          frame(L('Its wavelength', 'Seine Wellenlänge'), `<p>${L(`${lam} = ${h}/${p} = 6.626 · 10<sup>−34</sup> J·s / ${sci(pp)} kg·m/s = ${plain(lm * 1e9)} nm: about the distance between the atoms of a crystal. A crystal should diffract electrons as it diffracts X-rays, and it does.`, `${lam} = ${h}/${p} = 6.626 · 10<sup>−34</sup> J·s / ${sci(pp)} kg·m/s = ${plain(lm * 1e9)} nm: etwa der Abstand der Atome eines Kristalls. Ein Kristall sollte Elektronen beugen wie Röntgenstrahlung, und er tut es.`)}</p><p class="law">${lam} = ${h}/√(2·${m}·${i('e')}·${U})</p>`, fig(G.rings([12, 21], { label: true }))),
          frame(L('The trap', 'Die Falle'), `<p>${L(`For a photon ${p} = ${i('E')}/${i('c')}; for an electron that is wrong. With it, ${Uv} eV would give ${lam} = ${h}${i('c')}/${i('E')} = ${plain(lPh * 1e9)} nm, ${plain(lPh / lm, 2)} times too long. A particle with mass has ${p} = √(2·${m}·${Ek}).`, `Für ein Photon ist ${p} = ${i('E')}/${i('c')}; für ein Elektron ist das falsch. Damit ergäben ${Uv} eV ${lam} = ${h}${i('c')}/${i('E')} = ${plain(lPh * 1e9)} nm, ${plain(lPh / lm, 2)}-mal zu lang. Ein Teilchen mit Masse hat ${p} = √(2·${m}·${Ek}).`)}</p>`),
          frame(L('Why we do not see it', 'Warum wir es nicht sehen'), `<p>${L(`A tennis ball (57 g) at 50 m/s: ${lam} = 6.626 · 10<sup>−34</sup> J·s / (0.057 kg · 50 m/s) = ${sci(ball)} m, unimaginably shorter than anything it could be diffracted by. The heavier and faster, the shorter the wave: only for electrons, neutrons, atoms and small molecules is it long enough to show.`, `Ein Tennisball (57 g) mit 50 m/s: ${lam} = 6.626 · 10<sup>−34</sup> J·s / (0.057 kg · 50 m/s) = ${sci(ball)} m, unvorstellbar viel kürzer als alles, woran er gebeugt werden könnte. Je schwerer und schneller, desto kürzer die Welle: Nur bei Elektronen, Neutronen, Atomen und kleinen Molekülen ist sie lang genug, um sich zu zeigen.`)}</p>`),
        ];
      } },
    { topic: 0, stage: 2, name: () => L('Electrons diffracted by graphite', 'Elektronenbeugung an Graphit'), idea: () => L('Electrons passing a graphite foil make rings on the screen, as X-rays do. The rings shrink as the voltage grows: r ∝ λ ∝ 1/√U.', 'Elektronen, die eine Graphitfolie durchqueren, bilden Ringe auf dem Schirm, wie Röntgenstrahlung. Die Ringe schrumpfen, wenn die Spannung wächst: r ∝ λ ∝ 1/√U.'),
      frames: () => {
        const e2 = X.make('rings', 4);
        return [
          frame(L('The diffraction tube', 'Die Beugungsröhre'), `<p>${L('Electrons from a hot cathode are accelerated through a few kilovolts and pass a thin foil of graphite: tiny crystals in all orientations. On the screen, they make bright rings around the central spot.', 'Elektronen aus einer Glühkathode werden mit einigen Kilovolt beschleunigt und durchqueren eine dünne Graphitfolie: winzige Kristalle in allen Orientierungen. Auf dem Schirm bilden sie helle Ringe um den zentralen Fleck.')}</p>`, fig(G.tube()) + fig(G.rings([12, 21]))),
          frame(L('Bragg reflection', 'Bragg-Reflexion'), `<p>${L(`The lattice planes reflect the electron waves where 2${d}·sin θ = ${lam}. The beam is turned by 2θ, so for small angles a ring of radius ${i('r')} = ${i('L')}·2θ = ${i('L')}·${lam}/${d} appears. Two kinds of planes (${d} = 0.213 nm and 0.123 nm) give two rings.`, `Die Netzebenen reflektieren die Elektronenwellen dort, wo 2${d}·sin θ = ${lam} gilt. Der Strahl wird um 2θ abgelenkt; für kleine Winkel erscheint also ein Ring mit dem Radius ${i('r')} = ${i('L')}·2θ = ${i('L')}·${lam}/${d}. Zwei Arten von Ebenen (${d} = 0.213 nm und 0.123 nm) ergeben zwei Ringe.`)}</p><p class="law">${i('r')} = ${i('L')}·${lam}/${d}</p>`, fig(G.tube())),
          frame(L('The measurements', 'Die Messungen'), `<p>${e2.text}</p>`, e2.figs),
          frame(L('A straight line', 'Eine Gerade'), `<p>${e2.solution[1]}</p>`, e2.solFig),
          frame(L('The proof', 'Der Beweis'), `<p>${e2.solution[2]}</p>`, e2.solFig),
        ];
      } },
    { topic: 1, stage: 0, name: () => L('One electron at a time', 'Ein Elektron nach dem anderen'), idea: () => L('Each electron lands as one dot, at a random place; the fringes build up from many dots. Whoever finds out which slit the electron took destroys them.', 'Jedes Elektron landet als ein Punkt, an einem zufälligen Ort; die Streifen bauen sich aus vielen Punkten auf. Wer herausfindet, welchen Spalt das Elektron nahm, zerstört sie.'),
      frames: () => [
        frame(L('Very few electrons', 'Sehr wenige Elektronen'), `<p>${L('Electrons are sent through a double slit so rarely that only one is ever on its way. Each makes one dot on the screen: it arrives whole, at one place. After 20 electrons, the dots look scattered at random.', 'Elektronen werden so selten durch einen Doppelspalt geschickt, dass immer nur eines unterwegs ist. Jedes macht einen Punkt auf dem Schirm: Es kommt ganz an, an einem Ort. Nach 20 Elektronen sehen die Punkte zufällig verstreut aus.')}</p>`, fig(G.doubleSlit({ source: L('electron gun', 'Elektronenkanone') })) + fig(G.screen('double', 20, 1))),
        frame(L('More and more', 'Immer mehr'), `<p>${L('After 200 electrons a pattern begins to show; after thousands, there are clear fringes: the interference pattern of a wave through two slits. Yet no two electrons ever met.', 'Nach 200 Elektronen zeigt sich ein Muster; nach Tausenden gibt es klare Streifen: das Interferenzmuster einer Welle durch zwei Spalte. Dabei sind sich nie zwei Elektronen begegnet.')}</p>`, fig(G.screen('double', 200, 2)) + fig(G.screen('double', 1500, 3))),
        frame(L('A wave of probability', 'Eine Welle der Wahrscheinlichkeit'), `<p>${L('Where a single electron lands cannot be predicted. The wave, passing through both slits, only says how likely each place is: where it is bright, many electrons land, where it is dark, (almost) none. Each electron interferes with itself.', 'Wo ein einzelnes Elektron landet, lässt sich nicht vorhersagen. Die Welle, die durch beide Spalte geht, sagt nur, wie wahrscheinlich jeder Ort ist: Wo sie hell ist, landen viele Elektronen, wo sie dunkel ist, (fast) keine. Jedes Elektron interferiert mit sich selbst.')}</p>`, fig(G.screen('smear', 0, 1))),
        frame(L('Which slit?', 'Welcher Spalt?'), `<p>${L('A detector at the slits shows which slit each electron passes. The fringes are gone: a broad band remains, the sum of two single slits. Knowing the path, and having fringes, exclude each other. Little balls would give two narrow bands; electrons never do.', 'Ein Detektor an den Spalten zeigt, durch welchen Spalt jedes Elektron geht. Die Streifen sind weg: Ein breiter Bereich bleibt, die Summe zweier Einzelspalte. Den Weg kennen und Streifen haben schliessen sich aus. Kleine Kugeln ergäben zwei schmale Streifen; Elektronen nie.')}</p>`, fig(G.screen('which', 1500, 4)) + fig(G.screen('classical', 1500, 5))),
      ] },
    { topic: 2, stage: 0, name: () => L('The uncertainty relation', 'Die Unschärferelation'), idea: () => L('A particle never has an exact position and an exact momentum at once: Δx·Δp ≥ h/(4π). The tighter it is confined, the faster it must move.', 'Ein Teilchen hat nie zugleich einen genauen Ort und einen genauen Impuls: Δx·Δp ≥ h/(4π). Je enger es eingesperrt ist, desto schneller muss es sich bewegen.'),
      frames: () => {
        const dpe = P.minDp(1e-10), dve = dpe / P.me, dvg = P.minDp(1e-6) / 1e-9;
        return [
          frame(L('A narrower slit, a wider pattern', 'Schmalerer Spalt, breiteres Muster'), `<p>${L(`A slit of width ${i('b')} fixes where a quantum passes to within Δy ≈ ${i('b')}. Behind it the quanta spread: the first minimum is at sin α = ${lam}/${i('b')}. Make the slit narrower, and they spread more. Sideways they now have a momentum of up to ${p}·sin α = ${h}/${i('b')}.`, `Ein Spalt der Breite ${i('b')} legt fest, wo ein Quant durchgeht, auf Δy ≈ ${i('b')} genau. Dahinter streuen die Quanten: Das erste Minimum liegt bei sin α = ${lam}/${i('b')}. Wird der Spalt schmaler, streuen sie stärker. Seitwärts haben sie nun einen Impuls bis zu ${p}·sin α = ${h}/${i('b')}.`)}</p>`, fig(G.slitGraph([{ b: 20, lam: 0.633, cls: 'old', dash: true }, { b: 10, lam: 0.633, cls: 'new' }], { amax: 10 })) + `<p class="note legend"><span class="k-old">- - -</span> ${i('b')} = 20 µm · <span class="k-new">—</span> ${i('b')} = 10 µm</p>`),
          frame(L('Heisenberg', 'Heisenberg'), `<p>${L(`This holds for every quantum object: the more precisely its position is fixed, the larger the spread of its momentum. Heisenberg (1927):`, `Das gilt für jedes Quantenobjekt: Je genauer sein Ort festgelegt ist, desto grösser die Streuung seines Impulses. Heisenberg (1927):`)}</p><p class="law">${dx}·${dp} ≥ ${h}/(4π)</p><p>${L('It is not a flaw of the instruments: the particle does not have both an exact position and an exact momentum.', 'Das ist kein Mangel der Instrumente: Das Teilchen hat nicht zugleich einen genauen Ort und einen genauen Impuls.')}</p>`),
          frame(L('An electron in an atom', 'Ein Elektron im Atom'), `<p>${L(`Confined to ${dx} = 0.1 nm: ${dp} ≥ ${h}/(4π·${dx}) = ${sci(dpe)} kg·m/s, so Δ${v} = ${dp}/${m} = ${plain(dve / 1e3)} km/s. The velocity is hugely uncertain: an electron in an atom has no orbit. And it can never be at rest: a confined particle has a minimum kinetic energy.`, `Auf ${dx} = 0.1 nm beschränkt: ${dp} ≥ ${h}/(4π·${dx}) = ${sci(dpe)} kg·m/s, also Δ${v} = ${dp}/${m} = ${plain(dve / 1e3)} km/s. Die Geschwindigkeit ist riesig unscharf: Ein Elektron im Atom hat keine Bahn. Und es kann nie ruhen: Ein eingesperrtes Teilchen hat eine minimale kinetische Energie.`)}</p>`),
          frame(L('A grain of dust', 'Ein Staubkorn'), `<p>${L(`A grain of dust of 1 µg located to 1 µm: Δ${v} ≥ ${sci(dvg)} m/s. Far below anything measurable: for everyday things, h is too small to matter.`, `Ein Staubkorn von 1 µg, auf 1 µm genau lokalisiert: Δ${v} ≥ ${sci(dvg)} m/s. Weit unter allem Messbaren: Für Alltagsdinge ist h zu klein, um eine Rolle zu spielen.`)}</p>`),
        ];
      } },
    { topic: 3, stage: 0, name: () => L('Tunnelling', 'Der Tunneleffekt'), idea: () => L('A wave decays inside a barrier but does not stop: a particle gets through with the probability T ≈ e^(−2κd), κ = √(2m(V₀ − E))/ħ.', 'Eine Welle klingt in einer Barriere ab, hört aber nicht auf: Ein Teilchen kommt mit der Wahrscheinlichkeit T ≈ e^(−2κd) durch, κ = √(2m(V₀ − E))/ħ.'),
      frames: () => {
        const k1 = P.kappa(P.me, 1), t5 = P.trans(P.me, 1, 0.5e-9), t10 = P.trans(P.me, 1, 1e-9);
        return [
          frame(L('A wall too high', 'Eine zu hohe Wand'), `<p>${L(`A ball rolling at a hill higher than its energy rolls back, always. An electron of energy ${i('E')} meeting a barrier of height ${i('V')}${sb('0')} > ${i('E')} would, classically, do the same.`, `Eine Kugel, die gegen einen Hügel rollt, der höher ist als ihre Energie, rollt zurück, immer. Ein Elektron der Energie ${i('E')}, das auf eine Barriere der Höhe ${i('V')}${sb('0')} > ${i('E')} trifft, würde klassisch dasselbe tun.`)}</p>`, fig(G.barrier({ wave: false }))),
          frame(L('The wave goes on', 'Die Welle läuft weiter'), `<p>${L('But the electron is a wave. Inside the barrier it does not oscillate; it decays exponentially. If the barrier is thin, something is left at its end, and goes on as a wave of the same wavelength, only weaker. The electron may be found behind the barrier: it tunnels.', 'Aber das Elektron ist eine Welle. In der Barriere schwingt sie nicht; sie klingt exponentiell ab. Ist die Barriere dünn, bleibt an ihrem Ende etwas übrig und läuft als Welle derselben Wellenlänge weiter, nur schwächer. Das Elektron kann hinter der Barriere gefunden werden: Es tunnelt.')}</p>`, fig(G.barrier({ after: 'ok', labels: true }))),
          frame(L('How much gets through', 'Wie viel durchkommt'), `<p>${L(`The amplitude falls as e<sup>−${kap}x</sup> with ${kap} = √(2${m}(${i('V')}${sb('0')} − ${i('E')}))/ħ; the probability, its square, as e<sup>−2${kap}x</sup>. For 1 eV below the top: ${kap} = ${plain(k1 * 1e-9)} 1/nm. Width 0.5 nm: ${T} ≈ ${sci(t5, 2)}; width 1.0 nm: ${T} ≈ ${sci(t10, 2)}. Twice the width, the transmission squared.`, `Die Amplitude fällt wie e<sup>−${kap}x</sup> mit ${kap} = √(2${m}(${i('V')}${sb('0')} − ${i('E')}))/ħ; die Wahrscheinlichkeit, ihr Quadrat, wie e<sup>−2${kap}x</sup>. Für 1 eV unter der Oberkante: ${kap} = ${plain(k1 * 1e-9)} 1/nm. Breite 0.5 nm: ${T} ≈ ${sci(t5, 2)}; Breite 1.0 nm: ${T} ≈ ${sci(t10, 2)}. Doppelte Breite, quadrierte Transmission.`)}</p><p class="law">${T} ≈ e<sup>−2${kap}${d}</sup></p>`, fig(G.barrier({ after: 'ok', labels: true }))),
          frame(L('Where it matters', 'Wo es zählt'), `<p>${L(`Heavier particles have a larger ${kap} and hardly tunnel; electrons do it all the time. The scanning tunnelling microscope measures a tunnelling current that changes tenfold when the tip moves 0.1 nm, and sees single atoms. Alpha particles escape their nucleus by tunnelling; protons in the Sun fuse by tunnelling through their electric repulsion.`, `Schwerere Teilchen haben ein grösseres ${kap} und tunneln kaum; Elektronen tun es ständig. Das Rastertunnelmikroskop misst einen Tunnelstrom, der sich verzehnfacht, wenn sich die Spitze um 0.1 nm bewegt, und sieht einzelne Atome. Alphateilchen entkommen ihrem Kern durch Tunneln; Protonen in der Sonne verschmelzen, indem sie durch ihre elektrische Abstossung tunneln.`)}</p>`),
        ];
      } },
  ];
  const stage = (name, types) => ({ name, types });
  const TOPICS = [
    { name: () => L('The de Broglie wavelength', 'Die de-Broglie-Wellenlänge'), example: (s) => (s >= 2 ? 1 : 0), stages: [stage(() => L('electrons', 'Elektronen'), ['debroglie']), stage(() => L('other particles', 'andere Teilchen'), ['particle', 'same-lambda']), stage(() => L('diffraction rings', 'Beugungsringe'), ['rings'])] },
    { name: () => L('Single quanta', 'Einzelne Quanten'), example: () => 2, stages: [stage(() => L('screens', 'Schirme'), ['buildup']), stage(() => L('statements', 'Aussagen'), ['quanta-stmts']), stage(() => L('fringes', 'Streifen'), ['fringes'])] },
    { name: () => L('The uncertainty relation', 'Die Unschärferelation'), example: () => 3, stages: [stage(() => L('Δx and Δp', 'Δx und Δp'), ['uncert']), stage(() => L('single slit', 'Einzelspalt'), ['slit-spread']), stage(() => L('consequences', 'Folgen'), ['estimate', 'uncert-stmts'])] },
    { name: () => L('Tunnelling', 'Der Tunneleffekt'), example: () => 4, stages: [stage(() => L('the wave', 'die Welle'), ['tunnel-pick', 'tunnel-rank']), stage(() => L('numbers', 'Zahlen'), ['tunnel'])] },
  ];
  const lessons = () => LESSONS.map((l) => ({ name: l.name(), idea: l.idea(), frames: l.frames, also: topics.also(l.topic) }));

  // ---------------------------------------------------------------- arcade
  // One question of an exercise: a number becomes four values (the right one, those of typical
  // mistakes, then multiples), choices and drawings stay; the statements become "which is correct?".
  const KINDS = [['debroglie', 1], ['particle', 2], ['same-lambda', 2], ['buildup', 2], ['quanta-stmts', 2], ['uncert', 2], ['uncert-stmts', 2], ['tunnel-pick', 2], ['fringes', 3], ['slit-spread', 3], ['estimate', 3], ['tunnel-rank', 3], ['tunnel', 3], ['rings', 4]];
  const STMTS = { 'quanta-stmts': X.BANK_Q, 'uncert-stmts': X.BANK_U };
  const CONCEPT = {
    photonp: 'momentum', sqrt: 'momentum', inverse: 'momentum', units: 'momentum', mass: 'mass', charge: 'mass', scale: 'scale', particle: 'scale',
    classical: 'single', which: 'single', single: 'single', wave: 'single', determinism: 'chance',
    hbar: 'uncert', square: 'uncert', width: 'uncert', tunnel: 'tunnel', factor2: 'tunnel', linear: 'tunnel', energyloss: 'tunnel', inside: 'tunnel',
  };
  const valueLabel = (val, q) => `${plain(val)}${q.unit ? (/^10/.test(q.unit) ? ` · ${q.unit}` : ` ${q.unit}`) : ''}`;
  function numOptions(q, seed) {
    const out = [{ value: q.value, correct: true }];
    const fits = (x) => Number.isFinite(x) && x > 0 && out.every((o) => Math.abs(Math.log(x / o.value)) > Math.log(1.18)) && !out.some((o) => valueLabel(o.value, q) === valueLabel(x, q));
    for (const w of q.wrong || []) if (out.length < 4 && fits(w.value)) out.push({ value: w.value, flag: w.tag, why: w.why });
    const factors = [[2, 0.5, 1.5, 3, 0.7], [0.5, 2, 0.7, 1.5, 4], [1.5, 0.7, 2, 0.5, 3]][seed % 3];
    for (const k of factors) if (out.length < 4 && fits(q.value * k)) out.push({ value: q.value * k, flag: null, why: null });
    return out.sort((a, b) => a.value - b.value).map((o) => ({ html: valueLabel(o.value, q), correct: !!o.correct, flag: o.flag || null, why: o.why || null }));
  }
  function arcadeQuestion(kind, seed) {
    if (STMTS[kind]) {
      const bank = STMTS[kind], r = P.rng(seed * 7 + 1), t = r.pick(bank.filter((s) => s[1])), fs = r.shuffle(bank.filter((s) => !s[1])).slice(0, 3);
      return {
        title: L('True or false', 'Richtig oder falsch'), text: '', figure: '', ask: L('Which statement is correct?', 'Welche Aussage ist richtig?'),
        options: r.shuffle([t, ...fs]).map((s) => ({ html: s[0](), correct: s[1], flag: s[1] ? null : kind === 'quanta-stmts' ? 'single' : 'uncert', why: s[1] ? null : s[2]() })),
        explain: () => `<div class="steps"><p>✓ ${t[0]()} ${t[2]()}</p>${fs.map((s) => `<p>✗ ${s[0]()} ${s[2]()}</p>`).join('')}</div>`, key: `${kind}-${bank.indexOf(t)}`,
      };
    }
    const e = X.make(kind, seed);
    const explain = () => `${e.solFig ? `<div class="figs">${e.solFig}</div>` : ''}<div class="steps">${e.solution.map((s) => `<p>${s}</p>`).join('')}</div>`;
    const qs = e.questions.filter((q) => q.type !== 'multi'), q = qs[seed % qs.length];
    const ask = `${q.label.replace(/^\([a-d]\) /, '')}${q.type === 'num' && q.sym ? ` ${q.sym}` : ''}`;
    const options = q.type === 'num' ? numOptions(q, seed) : q.options.map((o) => ({ html: o.html || o.label, correct: o.ok, flag: o.ok ? null : o.tag || 'other', why: o.why }));
    return { title: e.title, text: e.text, figure: `<div class="figs">${e.figs || ''}</div>`, ask, options, explain, key: `${kind}-${q.key}-${JSON.stringify(e.p)}` };
  }
  const arcadeSource = {
    id: 'mw', kinds: KINDS.map(([id, difficulty]) => ({ id, difficulty })), question: arcadeQuestion, concept: CONCEPT,
    concepts: () => ({
      momentum: L('λ = h/p with p = √(2mE)', 'λ = h/p mit p = √(2mE)'), mass: L('heavier particles, shorter waves', 'schwerere Teilchen, kürzere Wellen'),
      scale: L('when the wave nature shows', 'wann sich die Wellennatur zeigt'), single: L('single quanta and the fringes', 'einzelne Quanten und die Streifen'),
      chance: L('only probabilities', 'nur Wahrscheinlichkeiten'), uncert: L('the uncertainty relation', 'die Unschärferelation'), tunnel: L('tunnelling', 'das Tunneln'),
    }),
    intro: () => ({
      tag: L('De Broglie waves, single quanta, the uncertainty relation and tunnelling: answer as many questions as you can in <b>5 minutes</b>.', 'De-Broglie-Wellen, einzelne Quanten, die Unschärferelation und das Tunneln: Beantworte in <b>5 Minuten</b> so viele Fragen wie möglich.'),
      rule: L('Questions get harder as you go. Choose one of the answers: click it or press its number. Have a calculator ready.', 'Die Fragen werden nach und nach schwieriger. Wähle eine der Antworten: Klicke sie an oder drücke ihre Nummer. Halte einen Taschenrechner bereit.'),
      example: L('that an electron has the momentum p = E/c, like a photon', 'dass ein Elektron den Impuls p = E/c hat, wie ein Photon'),
    }),
    hero: () => `<div class="figs"><div class="fig">${G.screen('double', 700, 11)}</div></div><p class="ar-law">${i('λ')} = ${i('h')}/${i('p')}</p>`,
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
      const keep = st, status = st.status;
      const typedIn = ex.questions.filter((q) => q.type === 'num').map((q) => [q.key, $(`#in-${q.key}`).value]);
      const chosen = [...document.querySelectorAll('#fields input:checked')].map((x) => [x.name, x.value]);
      ex = again(ex);
      render();
      st = keep;
      typedIn.forEach(([k, v]) => { const x = $(`#in-${k}`); if (x) x.value = v; });
      chosen.forEach(([n, v]) => { const x = document.querySelector(`input[name="${n}"][value="${v}"]`); if (x) x.checked = true; });
      if (st.revealed) markRight(); else if (st.checked) feedback();
      if (st.solved) lock();
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
    store('mw-mode', m);
    document.querySelectorAll('.practice, .real').forEach((el) => { el.hidden = !el.classList.contains(m); });
    $('#tutor').hidden = m !== 'tutor';
    $('#arcade').hidden = m !== 'arcade';
    if (m !== 'practice' && m !== 'real') { $('#hints').hidden = true; $('#solution').hidden = true; }
    if (m !== 'arcade') arcade.stop();
  }
  function practise() {
    setMode('practice');
    if (ex && ex.real == null) { history.replaceState(null, '', `#${ex.id}`); $('#hints').hidden = !st.hints; $('#solution').hidden = !st.revealed; markScrollable(); } else fresh();
  }
  function realMode() {
    setMode('real');
    if (problems.is(ex)) { history.replaceState(null, '', `#${ex.id}`); $('#hints').hidden = !st.hints; $('#solution').hidden = !st.revealed; markScrollable(); } else problems.resume();
  }
  function play() { setMode('arcade'); arcade.show(); if (location.hash !== '#arcade') history.replaceState(null, '', '#arcade'); }
  function fromHash() {
    const hsh = location.hash.slice(1);
    if (hsh === 'arcade') { if ($('#arcade').hidden) play(); return true; }
    const m = hsh.match(/^tutor-(\d+)$/);
    if (m && Number(m[1]) >= 1 && Number(m[1]) <= LESSONS.length) {
      setMode('tutor');
      if (tutor.current() !== Number(m[1]) - 1 || !tutor.shown()) tutor.open(Number(m[1]) - 1);
      return true;
    }
    const re = problems.parse(hsh);
    if (re) { setMode('real'); if (!ex || ex.id !== hsh) open(re); problems.menu(); return true; }
    const te = topics.parse(hsh);
    if (te) { setMode('practice'); if (!ex || ex.id !== hsh) open(te); return true; }
    const d = hsh.match(/^([a-z]+(?:-[a-z]+)*)-(\d+)$/);
    if (d && X.TYPES.includes(d[1])) { setMode('practice'); if (!ex || ex.id !== hsh) open(X.make(d[1], Number(d[2]))); return true; }
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
      tutor: (k) => { setMode('tutor'); tutor.open(k); },
    });
    topics.mount($('#levels'));
    problems = window.Problems.create({
      app: PRACTICE, problems: window.MatterProblems.PROBLEMS, make: window.MatterProblems.realOf,
      open, current: () => ex, pick: $('#real-pick'), renew: $('#real-new'),
    });
    applyStatic();
    Lang.wire(switchLang);
    $('#new').addEventListener('click', fresh);
    $('#answers').addEventListener('submit', check);
    $('#fields').addEventListener('input', (evt) => {
      const row = evt.target.closest('.field');
      if (row) { row.className = 'field'; row.querySelector('.fb').textContent = ''; }
    });
    $('#fields').addEventListener('change', (evt) => {
      const row = evt.target.closest('.qrow');
      if (row) { row.className = 'qrow'; row.querySelector('.fb').textContent = ''; }
      const box = evt.target.closest('.cands');
      if (box) { box.querySelectorAll('.cand').forEach((el) => el.classList.remove('ok', 'bad')); const fb = box.nextElementSibling; if (fb) fb.innerHTML = ''; }
      const li = evt.target.closest('.stmts li');
      if (li) { li.className = ''; li.querySelector('.fb').textContent = ''; }
    });
    $('#hint').addEventListener('click', hint);
    $('#reveal').addEventListener('click', reveal);
    window.addEventListener('hashchange', fromHash);
    window.addEventListener('resize', markScrollable);
    tutor = window.createTutor(lessons(), { after: markScrollable, done: practise, practise: (k) => { topics.go(LESSONS[k].topic, LESSONS[k].stage); setMode('practice'); fresh(); } });
    arcade = Arcade.create(arcadeSource, { math: () => {}, markScrollable, stored, store });
    $('#modes').addEventListener('change', () => {
      if (mode() === 'tutor') { setMode('tutor'); tutor.open(tutor.current()); } else if (mode() === 'arcade') play(); else if (mode() === 'real') realMode(); else practise();
    });
    showScore();
    if (fromHash()) return;
    const last = stored('mw-mode', 'tutor');
    if (last === 'tutor') { setMode('tutor'); tutor.open(0); } else if (last === 'arcade') play(); else if (last === 'real') realMode(); else { setMode('practice'); fresh(); }
  }

  if (typeof document !== 'undefined' && typeof window.Lang !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  }
  window.MatterApp = { parse, judge: (x, q) => judge(x, q), arcadeQuestion, KINDS, LESSONS, TOPICS };
})();
