(function () {
  'use strict';

  const P = window.Photon, X = window.PhotonEx, G = window.PhotonPlot;
  const Lang = window.Lang, Arcade = window.Arcade, L = Lang.L;
  const $ = (sel) => document.querySelector(sel);
  const { plain, sci } = P;

  // ---------------------------------------------------------------- interface texts
  const UI = {
    en: {
      title: 'Photons', mode: 'Mode', difficulty: 'Difficulty', example: 'Example',
      tutor: 'Tutor', practice: 'Practice', real: 'Problems', arcade: 'Arcade', new: 'New exercise', problem: 'Problem', newNumbers: 'New numbers', nextProblem: 'Next problem',
      tutorNote: 'Use the arrow keys ← → to step through. Numbers can be typed as 4.6e14 or 4.6·10^14; a comma works as a decimal point too.',
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
      title: 'Photonen', mode: 'Modus', difficulty: 'Schwierigkeit', example: 'Beispiel',
      tutor: 'Tutor', practice: 'Üben', real: 'Praxisaufgaben', arcade: 'Arcade', new: 'Neue Aufgabe', problem: 'Aufgabe', newNumbers: 'Neue Zahlen', nextProblem: 'Nächste Aufgabe',
      tutorNote: 'Mit den Pfeiltasten ← → blätterst du weiter. Zahlen kannst du als 4.6e14 oder 4.6·10^14 eingeben; ein Komma geht auch als Dezimalzeichen.',
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
  function showScore() { const s = stored('ph-score', { solved: 0, clean: 0 }); $('#score').textContent = s.solved ? ui().score(s.solved, s.clean) : ''; }
  const starsOf = (d) => `<span class="stars" role="img" aria-label="${ui().stars(d)}" title="${ui().stars(d)}">${'★'.repeat(d)}${'☆'.repeat(5 - d)}</span>`;
  // Wide pictures scroll on small screens; say so, since the cut-off part is invisible.
  function markScrollable() { document.querySelectorAll('.fig').forEach((el) => el.classList.toggle('scrolls', el.scrollWidth > el.clientWidth + 1)); }

  // ---------------------------------------------------------------- numbers typed in
  // 4.6e14, 4.6·10^14, 4.6 x 10^14, 4,6 · 10¹⁴, a minus as phones type it, a unit left over at the end
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
  const PRACTICE = 'ph', typeOf = (e) => e.type;
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
    const s = stored('ph-score', { solved: 0, clean: 0 });
    s.solved++;
    if (st.tries === 1 && st.hints === 0) s.clean++;
    store('ph-score', s);
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
  const lam = i('λ'), E = i('E'), f = i('f'), h = i('h'), c = i('c'), W = i('W'), U0 = `${i('U')}${sb('0')}`, Ek = `${i('E')}${sb('kin,max')}`;
  const LESSONS = [
    { topic: 0, stage: 0, name: () => L('The energy of a photon', 'Die Energie eines Photons'), idea: () => L('Light comes in portions, photons, each with the energy E = h·f = h·c/λ: the shorter the wavelength, the more energy.', 'Licht kommt in Portionen, Photonen, jedes mit der Energie E = h·f = h·c/λ: Je kürzer die Wellenlänge, desto mehr Energie.'),
      frames: () => {
        const nm = 532, fr = P.freq(nm), eJ = P.joule(nm);
        return [
          frame(L('Light in portions', 'Licht in Portionen'), `<p>${L(`Light is a wave, but it delivers its energy in portions: photons. A photon of light of frequency ${f} carries the energy ${E} = ${h}·${f}, with Planck’s constant ${h} = 6.626 · 10<sup>−34</sup> J·s. A green laser pointer emits light of ${nm} nm.`, `Licht ist eine Welle, aber es gibt seine Energie in Portionen ab: Photonen. Ein Photon von Licht der Frequenz ${f} trägt die Energie ${E} = ${h}·${f}, mit der Planck-Konstanten ${h} = 6.626 · 10<sup>−34</sup> J·s. Ein grüner Laserpointer sendet Licht von ${nm} nm aus.`)}</p>`, fig(G.bar([{ nm, label: `${nm} nm` }]))),
          frame(L('The frequency', 'Die Frequenz'), `<p>${L(`As for any wave, ${c} = ${lam}·${f}: ${f} = ${c}/${lam} = 3.00 · 10<sup>8</sup> m/s / (${nm} · 10<sup>−9</sup> m) = ${sci(fr)} Hz.`, `Wie bei jeder Welle gilt ${c} = ${lam}·${f}: ${f} = ${c}/${lam} = 3.00 · 10<sup>8</sup> m/s / (${nm} · 10<sup>−9</sup> m) = ${sci(fr)} Hz.`)}</p>`, fig(G.bar([{ nm, label: `${nm} nm` }]))),
          frame(L('The energy in joules', 'Die Energie in Joule'), `<p>${L(`${E} = ${h}·${f} = 6.626 · 10<sup>−34</sup> J·s · ${sci(fr)} Hz = ${sci(eJ)} J. A tiny amount: that is why we do not notice the portions.`, `${E} = ${h}·${f} = 6.626 · 10<sup>−34</sup> J·s · ${sci(fr)} Hz = ${sci(eJ)} J. Eine winzige Menge: Deshalb merken wir die Portionen nicht.`)}</p>`, fig(G.bar([{ nm, label: `${nm} nm` }]))),
          frame(L('The energy in electronvolts', 'Die Energie in Elektronvolt'), `<p>${L(`Photon energies are handier in electronvolts: 1 eV = 1.602 · 10<sup>−19</sup> J, the energy an electron gains through 1 V. ${E} = ${sci(eJ)} J / 1.602 · 10<sup>−19</sup> J/eV = ${plain(P.eV(nm))} eV. Shortcut: ${h}·${c} = 1240 eV·nm, so ${E} = 1240 eV·nm / ${lam}.`, `Photonenenergien sind in Elektronvolt handlicher: 1 eV = 1.602 · 10<sup>−19</sup> J, die Energie, die ein Elektron mit 1 V gewinnt. ${E} = ${sci(eJ)} J / 1.602 · 10<sup>−19</sup> J/eV = ${plain(P.eV(nm))} eV. Abkürzung: ${h}·${c} = 1240 eV·nm, also ${E} = 1240 eV·nm / ${lam}.`)}</p>`, fig(G.bar([{ nm, label: `${nm} nm` }]))),
          frame(L('Across the spectrum', 'Quer durchs Spektrum'), `<p>${L(`Red light (700 nm): ${plain(P.eV(700))} eV per photon; violet (400 nm): ${plain(P.eV(400))} eV; UV-C (250 nm): ${plain(P.eV(250))} eV. Shorter wavelength, higher frequency, more energy per photon.`, `Rotes Licht (700 nm): ${plain(P.eV(700))} eV pro Photon; violett (400 nm): ${plain(P.eV(400))} eV; UV-C (250 nm): ${plain(P.eV(250))} eV. Kürzere Wellenlänge, höhere Frequenz, mehr Energie pro Photon.`)}</p>`, fig(G.bar([{ nm: 700, label: `${plain(P.eV(700))} eV` }, { nm: 400, label: `${plain(P.eV(400))} eV` }, { nm: 250, label: `${plain(P.eV(250))} eV` }]))),
        ];
      } },
    { topic: 0, stage: 2, name: () => L('Counting photons', 'Photonen zählen'), idea: () => L('The power of a light source is the energy per second: divided by the energy of one photon, it gives the number of photons per second.', 'Die Leistung einer Lichtquelle ist die Energie pro Sekunde: Geteilt durch die Energie eines Photons ergibt sie die Zahl der Photonen pro Sekunde.'),
      frames: () => {
        const eR = P.joule(650), eV2 = P.joule(405);
        return [
          frame(L('A red laser pointer', 'Ein roter Laserpointer'), `<p>${L(`A red laser pointer emits 1 mW at 650 nm. One photon: ${E} = ${h}·${c}/${lam} = ${sci(eR)} J (${plain(P.eV(650))} eV).`, `Ein roter Laserpointer sendet 1 mW bei 650 nm aus. Ein Photon: ${E} = ${h}·${c}/${lam} = ${sci(eR)} J (${plain(P.eV(650))} eV).`)}</p>`, fig(G.bar([{ nm: 650, label: '650 nm' }]))),
          frame(L('Photons per second', 'Photonen pro Sekunde'), `<p>${L(`1 mW = 10<sup>−3</sup> J each second: ${i('N')} = ${i('P')}/${E} = 10<sup>−3</sup> J / ${sci(eR)} J = ${sci(1e-3 / eR)} photons per second.`, `1 mW = 10<sup>−3</sup> J pro Sekunde: ${i('N')} = ${i('P')}/${E} = 10<sup>−3</sup> J / ${sci(eR)} J = ${sci(1e-3 / eR)} Photonen pro Sekunde.`)}</p>`, fig(G.bar([{ nm: 650, label: '650 nm' }]))),
          frame(L('Bluer or brighter?', 'Blauer oder heller?'), `<p>${L(`A violet pointer of the same power (405 nm): each photon has ${plain(P.eV(405))} eV, more than the red ones, so there are fewer of them: ${sci(1e-3 / eV2)} per second. Brightness (power) and colour (photon energy) are two different things: a brighter light has more photons, a bluer light more energetic ones.`, `Ein violetter Pointer derselben Leistung (405 nm): Jedes Photon hat ${plain(P.eV(405))} eV, mehr als die roten, also sind es weniger: ${sci(1e-3 / eV2)} pro Sekunde. Helligkeit (Leistung) und Farbe (Photonenenergie) sind zwei verschiedene Dinge: Helleres Licht hat mehr Photonen, blaueres Licht energiereichere.`)}</p>`, fig(G.bar([{ nm: 650, label: '650 nm' }, { nm: 405, label: '405 nm' }]))),
        ];
      } },
    { topic: 1, stage: 0, name: () => L('The photoelectric effect', 'Der Photoeffekt'), idea: () => L('One photon frees one electron: h·f = W + E_kin,max. Below the threshold frequency nothing happens, however bright the light.', 'Ein Photon löst ein Elektron aus: h·f = W + E_kin,max. Unterhalb der Grenzfrequenz geschieht nichts, wie hell das Licht auch ist.'),
      frames: () => {
        const W0 = 4.27, nm = 200, eV = P.eV(nm), U = eV - W0;
        return [
          frame(L('Light frees electrons', 'Licht löst Elektronen aus'), `<p>${L('Light falling on a metal can knock electrons out of it. In a photocell, the electrons from the cathode fly to the anode: a current flows.', 'Licht, das auf ein Metall fällt, kann Elektronen herausschlagen. In einer Photozelle fliegen die Elektronen von der Kathode zur Anode: Es fliesst ein Strom.')}</p>`, fig(G.cell({ nm: 400 }))),
          frame(L('One photon, one electron', 'Ein Photon, ein Elektron'), `<p>${L(`An electron takes up the energy of one photon. To leave the metal it needs at least the work function ${W} (zinc: ${W0} eV); the rest is kinetic energy. UV light of ${nm} nm: ${h}·${f} = ${plain(eV)} eV, so ${Ek} = ${plain(eV)} eV − ${W0} eV = ${plain(U)} eV.`, `Ein Elektron nimmt die Energie eines Photons auf. Um das Metall zu verlassen, braucht es mindestens die Austrittsarbeit ${W} (Zink: ${W0} eV); der Rest ist kinetische Energie. UV-Licht von ${nm} nm: ${h}·${f} = ${plain(eV)} eV, also ${Ek} = ${plain(eV)} eV − ${W0} eV = ${plain(U)} eV.`)}</p><p class="law">${h}·${f} = ${W} + ${Ek}</p>`, fig(G.bars(eV, W0))),
          frame(L('The stopping voltage', 'Die Gegenspannung'), `<p>${L(`A voltage against the electrons slows them down. At the stopping voltage ${U0} even the fastest no longer reach the anode: ${i('e')}·${U0} = ${Ek}. Here ${U0} = ${plain(U)} V. Measuring ${U0} measures the energy of the fastest electrons.`, `Eine Spannung gegen die Elektronen bremst sie. Bei der Gegenspannung ${U0} erreichen auch die schnellsten die Anode nicht mehr: ${i('e')}·${U0} = ${Ek}. Hier ist ${U0} = ${plain(U)} V. Wer ${U0} misst, misst die Energie der schnellsten Elektronen.`)}</p>`, fig(G.cell({ nm: 400, counter: true }))),
          frame(L('The threshold', 'Die Grenze'), `<p>${L(`Red light (650 nm, ${plain(P.eV(650))} eV) on zinc: one photon has less than ${W0} eV, so no electron gets out, however bright the light. Brighter light means more photons, not more energetic ones. The threshold frequency is ${i('f')}${sb('G')} = ${W}/${h}; for zinc ${lam}${sb('G')} = 1240 eV·nm / ${W0} eV = ${plain(1240 / W0)} nm, in the UV.`, `Rotes Licht (650 nm, ${plain(P.eV(650))} eV) auf Zink: Ein Photon hat weniger als ${W0} eV, also kommt kein Elektron heraus, wie hell das Licht auch ist. Helleres Licht bedeutet mehr Photonen, nicht energiereichere. Die Grenzfrequenz ist ${i('f')}${sb('G')} = ${W}/${h}; für Zink ist ${lam}${sb('G')} = 1240 eV·nm / ${W0} eV = ${plain(1240 / W0)} nm, im UV.`)}</p>`, fig(G.bars(P.eV(650), W0))),
          frame(L('Brightness and colour in the current', 'Helligkeit und Farbe im Strom'), `<p>${L('The current against the voltage: twice as bright light gives twice the saturation current (twice as many electrons), but the same stopping voltage (the same photon energy). Light of a higher frequency gives a larger stopping voltage.', 'Der Strom gegen die Spannung: Doppelt so helles Licht ergibt den doppelten Sättigungsstrom (doppelt so viele Elektronen), aber dieselbe Gegenspannung (dieselbe Photonenenergie). Licht höherer Frequenz ergibt eine grössere Gegenspannung.')}</p>`,
            fig(G.ivGraph([{ U0: 1.2, I: 10, cls: 'old', dash: true }, { U0: 1.2, I: 20, cls: 'new' }, { U0: 2.0, I: 10, cls: 'alt' }], { Imax: 24 })) + `<p class="note legend"><span class="k-old">- - -</span> ${L('before', 'vorher')} · <span class="k-new">—</span> ${L('twice as bright', 'doppelt so hell')} · <span class="k-alt">—</span> ${L('higher frequency', 'höhere Frequenz')}</p>`),
        ];
      } },
    { topic: 1, stage: 3, name: () => L('Measuring h', 'h messen'), idea: () => L('The stopping voltage against the frequency is a straight line: its slope is h/e, the same for every metal; where it meets the f-axis is the threshold frequency.', 'Die Gegenspannung gegen die Frequenz ist eine Gerade: Ihre Steigung ist h/e, gleich für jedes Metall; wo sie die f-Achse schneidet, liegt die Grenzfrequenz.'),
      frames: () => {
        const e2 = X.make('photo-graph', 4), pts = e2.figs;
        return [
          frame(L('The measurements', 'Die Messungen'), `<p>${L(`The lines of a mercury lamp are shone one after the other on a photocell; for each, the stopping voltage is measured. Einstein: ${i('e')}·${U0} = ${h}·${f} − ${W}, so ${U0} = (${h}/${i('e')})·${f} − ${W}/${i('e')}: ${U0} against ${f} is a straight line.`, `Die Linien einer Quecksilberdampflampe werden nacheinander auf eine Photozelle gerichtet; für jede wird die Gegenspannung gemessen. Einstein: ${i('e')}·${U0} = ${h}·${f} − ${W}, also ${U0} = (${h}/${i('e')})·${f} − ${W}/${i('e')}: ${U0} gegen ${f} ist eine Gerade.`)}</p>`, pts),
          frame(L('The slope gives h', 'Die Steigung ergibt h'), `<p>${e2.solution[0]}</p>`, e2.solFig),
          frame(L('The threshold and the work function', 'Grenzfrequenz und Austrittsarbeit'), `<p>${e2.solution[1]}</p><p>${e2.solution[2]}</p><p>${L(`With another metal the line moves sideways, parallel: the slope ${h}/${i('e')} is a constant of nature.`, `Mit einem anderen Metall verschiebt sich die Gerade parallel: Die Steigung ${h}/${i('e')} ist eine Naturkonstante.`)}</p>`, e2.solFig),
        ];
      } },
    { topic: 2, stage: 0, name: () => L('Light pushes', 'Licht drückt'), idea: () => L('A photon carries the momentum p = h/λ = E/c. Absorbed light pushes with F = P/c, reflected light with 2P/c.', 'Ein Photon trägt den Impuls p = h/λ = E/c. Absorbiertes Licht drückt mit F = P/c, reflektiertes mit 2P/c.'),
      frames: () => [
        frame(L('The momentum of a photon', 'Der Impuls eines Photons'), `<p>${L(`A photon has no mass, but it has momentum: ${i('p')} = ${h}/${lam} = ${E}/${c}. Green light (532 nm): ${i('p')} = 6.626 · 10<sup>−34</sup> J·s / 532 · 10<sup>−9</sup> m = ${sci(P.momentum(532))} kg·m/s.`, `Ein Photon hat keine Masse, aber einen Impuls: ${i('p')} = ${h}/${lam} = ${E}/${c}. Grünes Licht (532 nm): ${i('p')} = 6.626 · 10<sup>−34</sup> J·s / 532 · 10<sup>−9</sup> m = ${sci(P.momentum(532))} kg·m/s.`)}</p>`, fig(G.sail({ absorb: true }))),
        frame(L('The force of a beam', 'Die Kraft eines Strahls'), `<p>${L(`A black surface absorbs the photons and takes up their momentum. Per second the light brings the energy ${i('P')}·1 s and so the momentum ${i('P')}·1 s/${c}: the force is ${i('F')} = ${i('P')}/${c}. A 1 W beam pushes with 1 W / 3 · 10<sup>8</sup> m/s = 3.3 · 10<sup>−9</sup> N.`, `Eine schwarze Fläche absorbiert die Photonen und übernimmt ihren Impuls. Pro Sekunde bringt das Licht die Energie ${i('P')}·1 s und damit den Impuls ${i('P')}·1 s/${c}: Die Kraft ist ${i('F')} = ${i('P')}/${c}. Ein Strahl von 1 W drückt mit 1 W / 3 · 10<sup>8</sup> m/s = 3.3 · 10<sup>−9</sup> N.`)}</p>`, fig(G.sail({ absorb: true }))),
        frame(L('A mirror pushes twice', 'Ein Spiegel drückt doppelt'), `<p>${L(`A mirror sends each photon back: its momentum changes from +${i('p')} to −${i('p')}, by 2${i('p')}. So ${i('F')} = 2${i('P')}/${c}. Solar sails are mirrors: near the Earth, sunlight (1360 W/m²) pushes on 1 m² with 2 · 1360 W / 3 · 10<sup>8</sup> m/s = 9 µN.`, `Ein Spiegel schickt jedes Photon zurück: Sein Impuls ändert sich von +${i('p')} zu −${i('p')}, um 2${i('p')}. Also ${i('F')} = 2${i('P')}/${c}. Sonnensegel sind Spiegel: In Erdnähe drückt das Sonnenlicht (1360 W/m²) auf 1 m² mit 2 · 1360 W / 3 · 10<sup>8</sup> m/s = 9 µN.`)}</p>`, fig(G.sail({ absorb: false }))),
      ] },
    { topic: 3, stage: 0, name: () => L('The X-ray tube', 'Die Röntgenröhre'), idea: () => L('Electrons accelerated through U give at most e·U to one photon: the spectrum ends at λ_min = h·c/(e·U). The sharp lines belong to the anode.', 'Elektronen, mit U beschleunigt, geben höchstens e·U an ein Photon ab: Das Spektrum endet bei λ_min = h·c/(e·U). Die scharfen Linien gehören zur Anode.'),
      frames: () => {
        const mo = P.ANODES.find((a) => a.id === 'mo'), U = 35, lm = P.lambdaMin(U * 1e3);
        const mk = (extra) => fig(G.xray([{ U, anode: mo, cls: 'new' }, ...extra], { max: 100, marks: [{ at: lm, label: `${plain(lm)}` }] }));
        return [
          frame(L('Bremsstrahlung', 'Bremsstrahlung'), `<p>${L(`In an X-ray tube, electrons are accelerated through ${U} kV and stopped in a metal anode. As they are braked they emit X-rays of all wavelengths: the continuous spectrum, bremsstrahlung.`, `In einer Röntgenröhre werden Elektronen mit ${U} kV beschleunigt und in einer Metallanode abgebremst. Beim Abbremsen senden sie Röntgenstrahlung aller Wellenlängen aus: das kontinuierliche Spektrum, die Bremsstrahlung.`)}</p>`, fig(G.xray([{ U, anode: null, cls: 'new' }], { max: 100 }))),
          frame(L('The shortest wavelength', 'Die kürzeste Wellenlänge'), `<p>${L(`An electron has the energy ${i('e')}·${i('U')} = ${U} keV. At most it gives all of it to one photon: ${i('e')}·${i('U')} = ${h}·${c}/${lam}${sb('min')}, so ${lam}${sb('min')} = 1240 keV·pm / ${U} keV = ${plain(lm)} pm. Below that the spectrum is dark (Duane–Hunt). The cut-off is a photon effect: in a wave picture, there would be no sharp end.`, `Ein Elektron hat die Energie ${i('e')}·${i('U')} = ${U} keV. Höchstens gibt es alles davon an ein Photon ab: ${i('e')}·${i('U')} = ${h}·${c}/${lam}${sb('min')}, also ${lam}${sb('min')} = 1240 keV·pm / ${U} keV = ${plain(lm)} pm. Darunter ist das Spektrum dunkel (Duane–Hunt). Die scharfe Grenze ist ein Photoneneffekt: Im Wellenbild gäbe es kein scharfes Ende.`)}</p>`, fig(G.xray([{ U, anode: null, cls: 'new' }], { max: 100, marks: [{ at: lm, label: `${plain(lm)}` }] }))),
          frame(L('The characteristic lines', 'Die charakteristischen Linien'), `<p>${L(`On top of it, sharp lines: an electron knocks an electron out of the inner shell of an anode atom, and another drops into the gap and emits a photon of a fixed energy. Molybdenum: K${sb('α')} at ${mo.ka} pm, K${sb('β')} at ${mo.kb} pm. The lines are the anode’s fingerprint.`, `Darüber scharfe Linien: Ein Elektron schlägt ein Elektron aus der innersten Schale eines Anodenatoms, ein anderes fällt in die Lücke und sendet ein Photon mit fester Energie aus. Molybdän: K${sb('α')} bei ${mo.ka} pm, K${sb('β')} bei ${mo.kb} pm. Die Linien sind der Fingerabdruck der Anode.`)}</p>`, mk([])),
          frame(L('A higher voltage', 'Eine höhere Spannung'), `<p>${L(`At ${U + 15} kV the cut-off moves to ${plain(P.lambdaMin((U + 15) * 1e3))} pm and the spectrum gets brighter; the lines stay where they are.`, `Bei ${U + 15} kV rückt die Grenze auf ${plain(P.lambdaMin((U + 15) * 1e3))} pm, und das Spektrum wird heller; die Linien bleiben, wo sie sind.`)}</p>`, fig(G.xray([{ U, anode: mo, cls: 'old', dash: true }, { U: U + 15, anode: mo, cls: 'new' }], { max: 100 }))),
        ];
      } },
    { topic: 4, stage: 0, name: () => L('Compton scattering', 'Comptonstreuung'), idea: () => L('A photon bounces off an electron like a ball: it gives away energy and its wavelength grows by Δλ = λ_C·(1 − cos θ).', 'Ein Photon prallt an einem Elektron ab wie eine Kugel: Es gibt Energie ab, und seine Wellenlänge wächst um Δλ = λ_C·(1 − cos θ).'),
      frames: () => {
        const l0 = 71, th = 90, dl = P.compton(th);
        return [
          frame(L('A collision', 'Ein Stoss'), `<p>${L('X-rays scattered by the electrons of a material come out with a longer wavelength. Compton explained it as a collision: the photon gives the electron a kick, and with it some energy and momentum.', 'Röntgenstrahlung, die an den Elektronen eines Materials gestreut wird, kommt mit grösserer Wellenlänge heraus. Compton erklärte das als Stoss: Das Photon gibt dem Elektron einen Stoss und damit etwas Energie und Impuls.')}</p>`, fig(G.scatter(th))),
          frame(L('The Compton formula', 'Die Compton-Formel'), `<p>${L(`Energy and momentum conservation give Δ${lam} = ${lam}′ − ${lam} = ${lam}${sb('C')}·(1 − cos ${i('θ')}), with the Compton wavelength ${lam}${sb('C')} = ${h}/(${i('m')}${sb('e')}·${c}) = 2.43 pm. Mo-Kα (${l0} pm) scattered by ${th}°: Δ${lam} = 2.43 pm, ${lam}′ = ${plain(l0 + dl, 4)} pm.`, `Energie- und Impulserhaltung ergeben Δ${lam} = ${lam}′ − ${lam} = ${lam}${sb('C')}·(1 − cos ${i('θ')}), mit der Compton-Wellenlänge ${lam}${sb('C')} = ${h}/(${i('m')}${sb('e')}·${c}) = 2.43 pm. Mo-Kα (${l0} pm) um ${th}° gestreut: Δ${lam} = 2.43 pm, ${lam}′ = ${plain(l0 + dl, 4)} pm.`)}</p><p class="law">Δ${lam} = ${lam}${sb('C')}·(1 − cos ${i('θ')})</p>`, fig(G.scatter(th))),
          frame(L('The angle decides', 'Der Winkel entscheidet'), `<p>${L(`Barely deflected (small ${i('θ')}): almost no change. Straight back (${i('θ')} = 180°): the largest change, 2 · 2.43 pm = 4.85 pm. The shift does not depend on the wavelength, so it only matters for short ones: for visible light (500 nm), 4.85 pm is one part in 100 000.`, `Kaum abgelenkt (kleines ${i('θ')}): fast keine Änderung. Gerade zurück (${i('θ')} = 180°): die grösste Änderung, 2 · 2.43 pm = 4.85 pm. Die Verschiebung hängt nicht von der Wellenlänge ab und zählt darum nur bei kurzen: Für sichtbares Licht (500 nm) sind 4.85 pm ein Hunderttausendstel.`)}</p>`, fig(G.scatter(180))),
          frame(L('Where the energy goes', 'Wohin die Energie geht'), `<p>${L(`The photon had 1240 keV·pm / ${l0} pm = ${plain(P.HC / l0)} keV and keeps ${plain(P.HC / (l0 + dl))} keV: the electron flies off with the difference, ${plain(P.HC / l0 - P.HC / (l0 + dl))} keV.`, `Das Photon hatte 1240 keV·pm / ${l0} pm = ${plain(P.HC / l0)} keV und behält ${plain(P.HC / (l0 + dl))} keV: Das Elektron fliegt mit der Differenz weg, ${plain(P.HC / l0 - P.HC / (l0 + dl))} keV.`)}</p>`, fig(G.scatter(th))),
        ];
      } },
  ];
  const stage = (name, types) => ({ name, types });
  const TOPICS = [
    { name: () => L('Photon energy', 'Photonenenergie'), example: (s) => (s >= 2 ? 1 : 0), stages: [stage(() => L('energy', 'Energie'), ['energy']), stage(() => L('wavelength', 'Wellenlänge'), ['wavelength']), stage(() => L('counting', 'zählen'), ['count', 'rank'])] },
    { name: () => L('The photoelectric effect', 'Der Photoeffekt'), example: (s) => (s >= 3 ? 3 : 2), stages: [stage(() => L('Einstein’s equation', 'Einsteins Gleichung'), ['photo-calc']), stage(() => L('statements', 'Aussagen'), ['photo-stmts']), stage(() => L('characteristic', 'Kennlinie'), ['photo-curve']), stage(() => L('measuring h', 'h messen'), ['photo-graph'])] },
    { name: () => L('The momentum of light', 'Der Impuls des Lichts'), example: () => 4, stages: [stage(() => L('momentum and force', 'Impuls und Kraft'), ['momentum']), stage(() => L('solar sail', 'Sonnensegel'), ['sail'])] },
    { name: () => L('X-rays', 'Röntgenstrahlung'), example: () => 5, stages: [stage(() => L('the cut-off', 'die Grenzwellenlänge'), ['xray']), stage(() => L('spectra', 'Spektren'), ['xray-read', 'xray-change'])] },
    { name: () => L('The Compton effect', 'Der Comptoneffekt'), example: () => 6, stages: [stage(() => L('comparing', 'vergleichen'), ['compton-compare']), stage(() => L('numbers', 'Zahlen'), ['compton'])] },
  ];
  const lessons = () => LESSONS.map((l) => ({ name: l.name(), idea: l.idea(), frames: l.frames, also: topics.also(l.topic) }));

  // ---------------------------------------------------------------- arcade
  // One question of an exercise: a number becomes four values (the right one, those of typical
  // mistakes, then multiples), choices and drawings stay; the statements become "which is correct?".
  const KINDS = [['energy', 1], ['wavelength', 2], ['count', 2], ['rank', 2], ['photo-calc', 2], ['photo-stmts', 2], ['momentum', 2], ['xray', 2], ['compton-compare', 2], ['photo-curve', 3], ['sail', 3], ['xray-read', 3], ['xray-change', 3], ['compton', 3], ['photo-graph', 4]];
  const CONCEPT = { intensity: 'intensity', inverse: 'inverse', evJ: 'units', countJ: 'units', noW: 'work', addW: 'work', threshold: 'intensity', mass: 'mass', reflect: 'reflect', absorb: 'reflect', lines: 'lines', cutoff: 'lines', angle: 'compton', lambda: 'compton', formula: 'compton', shorter: 'compton', slope: 'units' };
  const valueLabel = (v, q) => `${plain(v)}${q.unit ? (/^10/.test(q.unit) ? ` · ${q.unit}` : ` ${q.unit}`) : ''}`;
  function numOptions(q, seed) {
    const out = [{ value: q.value, correct: true }];
    const fits = (x) => Number.isFinite(x) && x > 0 && out.every((o) => Math.abs(Math.log(x / o.value)) > Math.log(1.18)) && !out.some((o) => valueLabel(o.value, q) === valueLabel(x, q));
    for (const w of q.wrong || []) if (out.length < 4 && fits(w.value)) out.push({ value: w.value, flag: w.tag, why: w.why });
    const factors = [[2, 0.5, 1.5, 3, 0.7], [0.5, 2, 0.7, 1.5, 4], [1.5, 0.7, 2, 0.5, 3]][seed % 3];
    for (const k of factors) if (out.length < 4 && fits(q.value * k)) out.push({ value: q.value * k, flag: null, why: null });
    return out.sort((a, b) => a.value - b.value).map((o) => ({ html: valueLabel(o.value, q), correct: !!o.correct, flag: o.flag || null, why: o.why || null }));
  }
  function arcadeQuestion(kind, seed) {
    const e = X.make(kind, seed);
    const explain = () => `${e.solFig ? `<div class="figs">${e.solFig}</div>` : ''}<div class="steps">${e.solution.map((s) => `<p>${s}</p>`).join('')}</div>`;
    if (kind === 'photo-stmts') {
      const r = P.rng(seed * 7 + 1), t = r.pick(X.BANK.filter((s) => s[1])), fs = r.shuffle(X.BANK.filter((s) => !s[1])).slice(0, 3);
      return {
        title: L('True or false', 'Richtig oder falsch'), text: '', figure: '', ask: L('Which statement is correct?', 'Welche Aussage ist richtig?'),
        options: r.shuffle([t, ...fs]).map((s) => ({ html: s[0](), correct: s[1], flag: s[1] ? null : 'other', why: s[1] ? null : s[2]() })),
        explain: () => `<div class="steps"><p>✓ ${t[0]()} ${t[2]()}</p>${fs.map((s) => `<p>✗ ${s[0]()} ${s[2]()}</p>`).join('')}</div>`, key: `stmt-${X.BANK.indexOf(t)}`,
      };
    }
    const qs = e.questions.filter((q) => q.type !== 'multi'), q = qs[seed % qs.length];
    const ask = `${q.label.replace(/^\([a-d]\) /, '')}${q.type === 'num' && q.sym ? ` ${q.sym}` : ''}`;
    const options = q.type === 'num' ? numOptions(q, seed) : q.options.map((o) => ({ html: o.html || o.label, correct: o.ok, flag: o.ok ? null : o.tag || 'other', why: o.why }));
    return { title: e.title, text: e.text, figure: `<div class="figs">${e.figs || ''}</div>`, ask, options, explain, key: `${kind}-${q.key}-${JSON.stringify(e.p)}` };
  }
  const arcadeSource = {
    id: 'ph', kinds: KINDS.map(([id, difficulty]) => ({ id, difficulty })), question: arcadeQuestion, concept: CONCEPT,
    concepts: () => ({
      intensity: L('brightness is not photon energy', 'Helligkeit ist nicht Photonenenergie'), inverse: L('shorter wavelength, more energy', 'kürzere Wellenlänge, mehr Energie'),
      units: L('joules and electronvolts', 'Joule und Elektronvolt'), work: L('the work function in Einstein’s equation', 'die Austrittsarbeit in Einsteins Gleichung'),
      mass: L('photons have momentum', 'Photonen haben Impuls'), reflect: L('absorbed or reflected light', 'absorbiertes oder reflektiertes Licht'),
      lines: L('cut-off and characteristic lines', 'Grenzwellenlänge und charakteristische Linien'), compton: L('the Compton shift', 'die Compton-Verschiebung'),
    }),
    intro: () => ({
      tag: L('Photon energies, the photoelectric effect, X-rays and Compton: answer as many questions as you can in <b>5 minutes</b>.', 'Photonenenergien, Photoeffekt, Röntgenstrahlung und Compton: Beantworte in <b>5 Minuten</b> so viele Fragen wie möglich.'),
      rule: L('Questions get harder as you go. Choose one of the answers: click it or press its number. Have a calculator ready.', 'Die Fragen werden nach und nach schwieriger. Wähle eine der Antworten: Klicke sie an oder drücke ihre Nummer. Halte einen Taschenrechner bereit.'),
      example: L('that brighter light has more energetic photons', 'dass helleres Licht energiereichere Photonen hat'),
    }),
    hero: () => `<div class="figs"><div class="fig">${G.bars(P.eV(300), 2.3)}</div></div><p class="ar-law">${i('h')}·${i('f')} = ${i('W')} + ${i('E')}${sb('kin')}</p>`,
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
    store('ph-mode', m);
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
      app: PRACTICE, problems: window.PhotonProblems.PROBLEMS, make: window.PhotonProblems.realOf,
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
    const last = stored('ph-mode', 'tutor');
    if (last === 'tutor') { setMode('tutor'); tutor.open(0); } else if (last === 'arcade') play(); else if (last === 'real') realMode(); else { setMode('practice'); fresh(); }
  }

  if (typeof document !== 'undefined' && typeof window.Lang !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  }
  window.PhotonApp = { parse, judge: (x, q) => judge(x, q), arcadeQuestion, KINDS, LESSONS, TOPICS };
})();
