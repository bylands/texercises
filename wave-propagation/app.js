(function () {
  'use strict';

  const W = window.Waves, P = window.WavePlot, Lang = window.Lang, Arcade = window.Arcade, L = Lang.L;
  const $ = (sel) => document.querySelector(sel);
  const MAX_TRIES = 3;

  // ---------------------------------------------------------------- interface texts
  const UI = {
    en: {
      title: 'Wave Propagation', mode: 'Mode', example: 'Example', tutor: 'Tutor', practice: 'Practice', arcade: 'Arcade', real: 'Problems', problem: 'Problem', newNumbers: 'New numbers', nextProblem: 'Next problem', new: 'New exercise', difficulty: 'Difficulty',
      check: 'Check', reveal: 'Show solution', hints: 'Hints', solution: 'Solution', clear: 'Clear drawing',
      revealNote: 'The worked solution unlocks once you have solved the exercise, used all hints or made three attempts.',
      stars: (d) => `Difficulty: ${d} of 5`, score: (s, c) => `Solved: ${s} · first try without hints: ${c}`,
      hint: (n) => `Hint (${n} left)`, noHints: 'No more hints', unlocks: (n) => `Unlocks after all hints or ${n} attempts`,
      fill: 'Answer every question, then check again.', ok: 'All correct.', okWell: 'All correct, well done! Compare your approach with the worked solution, or start a new exercise.',
      notYet: (n) => `Not quite yet (attempt ${n}).`, tryAgain: ' Try again, or take a hint.', canReveal: ' You can take a hint or look at the worked solution.',
      correct: 'Correct', option: (k) => `Option ${k}`, drawWrong: (n) => `${n} grid ${n === 1 ? 'line is' : 'lines are'} not right yet (marked).`,
      tutorNote: 'Use the arrow keys ← → to step through. ▶ plays an animation; the slider moves through time.',
      given: 'Given', animLead: 'The animation shows how the rope got there; ▶ plays it again.', animNote: 'The animation shows how the rope got there and stops at the state given. With ▶ or the slider you can move the crests on yourself (two crests running towards each other one by one); the time and the sum of the crests are not shown. The faded line is the rope in the state given.',
    },
    de: {
      title: 'Wellenausbreitung', mode: 'Modus', example: 'Beispiel', tutor: 'Tutor', practice: 'Üben', arcade: 'Arcade', real: 'Praxisaufgaben', problem: 'Aufgabe', newNumbers: 'Neue Zahlen', nextProblem: 'Nächste Aufgabe', new: 'Neue Aufgabe', difficulty: 'Schwierigkeit',
      check: 'Prüfen', reveal: 'Lösung zeigen', hints: 'Tipps', solution: 'Lösung', clear: 'Zeichnung löschen',
      revealNote: 'Die ausführliche Lösung wird freigeschaltet, sobald du die Aufgabe gelöst, alle Tipps genutzt oder drei Versuche gemacht hast.',
      stars: (d) => `Schwierigkeit: ${d} von 5`, score: (s, c) => `Gelöst: ${s} · beim ersten Versuch ohne Tipps: ${c}`,
      hint: (n) => `Tipp (${n} übrig)`, noHints: 'Keine Tipps mehr', unlocks: (n) => `Wird nach allen Tipps oder ${n} Versuchen freigeschaltet`,
      fill: 'Beantworte jede Frage und prüfe dann nochmals.', ok: 'Alles richtig.', okWell: 'Alles richtig, gut gemacht! Vergleiche deinen Lösungsweg mit der ausführlichen Lösung oder starte eine neue Aufgabe.',
      notYet: (n) => `Noch nicht ganz (Versuch ${n}).`, tryAgain: ' Versuche es nochmals, oder nimm einen Tipp.', canReveal: ' Du kannst einen Tipp nehmen oder die ausführliche Lösung anschauen.',
      correct: 'Richtig', option: (k) => `Antwort ${k}`, drawWrong: (n) => `${n} ${n === 1 ? 'Gitterlinie stimmt' : 'Gitterlinien stimmen'} noch nicht (markiert).`,
      tutorNote: 'Mit den Pfeiltasten ← → blätterst du weiter. ▶ spielt eine Animation ab; mit dem Schieber bewegst du dich durch die Zeit.',
      given: 'Gegeben', animLead: 'Die Animation zeigt, wie das Seil dorthin kam; ▶ spielt sie nochmals ab.', animNote: 'Die Animation zeigt, wie das Seil dorthin kam, und hält beim gegebenen Zustand an. Mit ▶ oder dem Schieber kannst du die Buckel selbst weiterbewegen (zwei aufeinander zulaufende Buckel einzeln); die Zeit und die Summe der Buckel werden nicht angezeigt. Die blasse Linie ist das Seil im gegebenen Zustand.',
    },
  };
  const ui = () => UI[Lang.get()];

  let ex = null, st = null, tutor = null, arcade = null, topics = null, problems = null;
  function stored(key, fallback) { try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; } }
  function store(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ } }
  function showScore() { const s = stored('wav-score', { solved: 0, clean: 0 }); $('#score').textContent = s.solved ? ui().score(s.solved, s.clean) : ''; }
  const starsOf = (d) => `<span class="stars" role="img" aria-label="${ui().stars(d)}" title="${ui().stars(d)}">${'★'.repeat(d)}${'☆'.repeat(5 - d)}</span>`;
  const TITLE = {
    move: () => L('A crest travels', 'Ein Buckel läuft'), yt: () => L('The y(t) graph', 'Das y(t)-Bild'), ty: () => L('From y(t) to the rope', 'Vom y(t)-Bild zum Seil'),
    medium: () => L('How the rope moves', 'Wie sich das Seil bewegt'), speed: () => L('Speed and timing', 'Geschwindigkeit und Zeit'), sup: () => L('Two crests meet', 'Zwei Buckel begegnen sich'),
    refl: () => L('Reflection', 'Reflexion'), reflsum: () => L('Reflection with overlap', 'Reflexion mit Überlagerung'), mirror: () => L('The mirror crest', 'Der Spiegelbuckel'),
    end: () => L('The end itself', 'Das Ende selbst'), draw: () => L('Draw the rope', 'Zeichne das Seil'),
  };

  // ---------------------------------------------------------------- animations
  // A slot in some HTML that becomes an animation once the HTML is on the page (mountAnims).
  const anims = new Map();
  let animId = 0, running = [];
  const animSlot = (a) => { const id = `a${++animId}`; anims.set(id, a); return `<div class="anim-slot" data-anim="${id}"></div>`; };
  function mountAnims(el) {
    el.querySelectorAll('.anim-slot[data-anim]').forEach((slot) => {
      const a = anims.get(slot.dataset.anim);
      if (!a) return;
      slot.removeAttribute('data-anim');
      running.push(P.Anim.mount(slot, a));
    });
  }
  const stopAnims = () => { running.forEach((r) => r.stop()); running = []; };

  // ---------------------------------------------------------------- figures
  const many = (f) => [].concat(f || []);
  const graphs = (specs, o) => many(specs).map((s) => `<div class="fig">${P.graph(s, o)}</div>`).join('');
  // the given situation: the animation of the lead-in, stopping at the state given, or the diagrams.
  // Its slider goes on until the crests have left the rope, well past the time asked about: the
  // student can move the crests on, but is not told the time, and has to find the right position.
  // Two crests running towards each other get a slider each. Once moved, only the crests are drawn
  // (and the given state faded), not the rope, their sum: that is for the student to work out. Not
  // where the question is how the rope moves at the given moment (moving the crests would show it).
  function given(e) {
    if (e.anim) {
      const f = many(e.fig)[0], base = { ...e.anim, arrows: true, Y: f.Y, mark: e.anim.mark != null ? e.anim.mark : f.marks && f.marks[0] ? f.marks[0].x : null, dots: e.anim.dots };
      if (e.kind === 'medium') return `<div class="fig">${animSlot(base)}</div>`;
      const sc = e.anim.sc, split = !sc.end && sc.pulses.length === 2 && sc.pulses[0].dir !== sc.pulses[1].dir;
      const t1 = Math.min(15, Math.max(gone(sc, f.hi), (e.t || 0) + 2, e.anim.t1 + 2));
      return `<div class="fig">${animSlot({ ...base, t1, hold: e.anim.t1, ref: e.anim.t1, noTime: true, split, show: e.anim.show, explore: split || sc.end || sc.pulses.length > 1 ? ['parts'] : null, Y: split ? Math.max(base.Y || 6, 11) : base.Y })}</div>`; // moved one by one, any parts may overlap
    }
    return graphs(e.fig);
  }
  // when every crest has left the rope shown (0 … hi): a crest towards an end comes back first
  function gone(sc, hi) {
    return Math.max(...sc.pulses.map((p) => (sc.end && p.dir > 0 ? (2 * sc.end.x - p.x0) / p.v : p.dir > 0 ? (hi - p.x0) / p.v : (p.x0 + p.sh.w) / p.v)));
  }
  // the solution's animation: it stops at the time the exercise asks about, and goes on beyond it
  // (with the given state faded as a reference, where the exercise gave the rope at its start)
  function solAnimOf(e) {
    const a = { ...e.solAnim, ...(e.anim && e.anim.t1 === e.solAnim.t0 ? { ref: e.solAnim.t0 } : {}) };
    if (e.t == null || a.trace != null || e.t <= a.t0 || e.t > a.t1 + 1e-9) return a;
    return { ...a, hold: e.t, t1: Math.max(a.t1, e.t + 1.5) };
  }

  // ---------------------------------------------------------------- questions
  function questionHtml(q) {
    if (q.type === 'pick') {
      return `<div class="cands" role="radiogroup">${q.options.map((o, k) => `<label class="cand" data-k="${k}"><input type="radio" name="q-${q.key}" value="${k}"><span class="letter">${k + 1}</span>${P.graph(o.fig, { small: true, label: ui().option(k + 1) })}</label>`).join('')}</div><p class="qfb" data-fb="${q.key}"></p>`;
    }
    return `<div class="field" data-key="${q.key}"><span class="what">${q.label}</span><div class="opts" role="radiogroup">${q.options.map((o, k) => `<label><input type="radio" name="q-${q.key}" value="${k}"><span>${o.label}</span></label>`).join('')}</div><span class="fb" aria-live="polite"></span></div>`;
  }
  // Marks every answer; true if all are right, null if one is missing.
  function feedback() {
    if (ex.kind === 'draw') return drawFeedback();
    let all = true, missing = false;
    for (const q of ex.questions) {
      const sel = document.querySelector(`input[name="q-${q.key}"]:checked`);
      if (!sel) { all = false; missing = true; continue; }
      const o = q.options[Number(sel.value)];
      if (q.type === 'pick') {
        document.querySelectorAll(`.cand`).forEach((el) => { if (el.querySelector(`input[name="q-${q.key}"]`)) el.classList.remove('ok', 'bad'); });
        sel.closest('.cand').classList.add(o.ok ? 'ok' : 'bad');
        $(`[data-fb="${q.key}"]`).innerHTML = o.ok ? '' : o.why;
      } else {
        const row = $(`.field[data-key="${q.key}"]`);
        row.className = `field ${o.ok ? 'ok' : 'bad'}`;
        row.querySelector('.fb').innerHTML = o.ok ? ui().correct : o.why;
      }
      if (!o.ok) all = false;
    }
    return all ? true : missing && !document.querySelector('.field.bad, .cand.bad') ? null : false;
  }

  // ---------------------------------------------------------------- drawing
  // The heights at the grid lines, set by clicking; Check marks the lines still wrong.
  const drawSpec = () => W.snap(() => 0, { hi: ex.draw.hi, end: ex.draw.end, label: ex.draw.label });
  function drawEditor() {
    const spec = drawSpec();
    spec.curves = [];
    let html = P.graph(spec, { values: st.values, xs: ex.xs, label: L('Your drawing of the rope', 'Deine Zeichnung des Seils') });
    if (st.wrong) {
      const sc = { W: P.SIZE.W, ML: P.SIZE.ML, MR: P.SIZE.MR, MT: P.SIZE.MT, MB: P.SIZE.MB }, PW = sc.W - sc.ML - sc.MR, PH = P.SIZE.H - sc.MT - sc.MB;
      html = html.replace('</svg>', st.wrong.map((i) => `<rect class="wrongcol" x="${(sc.ML + (ex.xs[i] / spec.hi) * PW - 5).toFixed(1)}" y="${sc.MT}" width="10" height="${PH}"/>`).join('') + '</svg>');
    }
    $('#draw-area').innerHTML = `<div class="fig">${html}</div><button type="button" id="draw-clear" class="linklike">${ui().clear}</button>`;
  }
  function onDrawClick(evt) {
    if (!ex || ex.kind !== 'draw' || st.solved || st.revealed) return;
    const svg = evt.target.closest('svg.drawing');
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    const q = pt.matrixTransform(svg.getScreenCTM().inverse()), hit = P.pointAt(drawSpec(), ex.xs, q.x, q.y);
    if (!hit) return;
    st.values[hit.i] = hit.y;
    st.wrong = null;
    drawEditor();
  }
  function drawFeedback() {
    const wrong = ex.xs.map((x, i) => i).filter((i) => st.values[i] !== ex.target[i]);
    st.wrong = wrong.length ? wrong : null;
    drawEditor();
    $('#draw-fb').textContent = wrong.length ? ui().drawWrong(wrong.length) : '';
    return wrong.length === 0;
  }

  // ---------------------------------------------------------------- exercises
  const PRACTICE = 'wav', typeOf = (e) => (e.real != null ? `real-${e.problem}` : e.type);
  const finish = () => { if (ex && st) Practice.finish(PRACTICE, typeOf(ex), st); };
  function open(exercise) {
    finish();
    ex = exercise;
    st = { tries: 0, hints: 0, solved: false, revealed: false, checked: false, status: null, values: ex.xs ? ex.xs.map(() => 0) : null, wrong: null };
    if (location.hash !== `#${ex.id}`) history.replaceState(null, '', `#${ex.id}`);
    render();
    if (ex.real == null) topics.shown(ex);
  }
  const fresh = () => open(topics.next(ex));
  const again = (e) => (e.real != null ? problems.parse(e.id) : topics.parse(e.id));

  function render() {
    stopAnims();
    $('#title').innerHTML = `${ex.real != null ? ex.title : TITLE[ex.kind]()} ${starsOf(ex.difficulty)}`;
    $('#prompt').innerHTML = ex.real != null ? ex.text : `<p>${ex.text}</p>`;
    const pic = ex.real != null && window.WaveFigures ? window.WaveFigures[ex.pic]() : '';
    $('#figure').innerHTML = pic + (ex.fig ? given(ex) : '');
    $('#anim-note').hidden = !ex.anim;
    $('#anim-note').textContent = ex.kind === 'medium' ? ui().animLead : ui().animNote;
    mountAnims($('#figure'));
    $('#draw-area').hidden = ex.kind !== 'draw';
    $('#draw-fb').textContent = '';
    if (ex.kind === 'draw') drawEditor();
    $('#fields').innerHTML = ex.questions.map(questionHtml).join('');
    $('#hint-list').innerHTML = '';
    $('#hints').hidden = true;
    $('#solution').hidden = true;
    showStatus(null);
    updateButtons();
  }

  const canReveal = () => st.solved || Practice.solvedBefore(PRACTICE, ex.id) || st.tries >= MAX_TRIES || st.hints >= ex.hints.length;
  function updateButtons() {
    const left = ex.hints.length - st.hints;
    $('#hint').disabled = left === 0 || st.revealed;
    $('#hint').textContent = left ? ui().hint(left) : ui().noHints;
    $('#reveal').disabled = !canReveal() || st.revealed;
    $('#reveal').title = canReveal() ? '' : ui().unlocks(MAX_TRIES);
    $('#reveal-note').hidden = canReveal() || st.revealed;
    $('#check').textContent = st.solved ? (ex.real != null ? ui().nextProblem : ui().new) : ui().check;
    $('#check').classList.toggle('primary', !st.solved);
    $('#check').classList.toggle('new-btn', st.solved);
  }
  function showStatus(kind) {
    const el = $('#status');
    if (st) st.status = kind;
    el.className = 'status' + (kind === 'ok' ? ' ok' : kind === 'bad' ? ' bad' : '');
    el.textContent = !kind ? '' : kind === 'fill' ? ui().fill
      : kind === 'ok' ? (st.revealed ? ui().ok : ui().okWell) + (st.advance ? ` ${st.advance}` : '')
        : ui().notYet(st.tries) + (!canReveal() ? ui().tryAgain : ui().canReveal);
  }
  function check(evt) {
    evt.preventDefault();
    if (st.solved) { if (ex.real != null) problems.next(); else fresh(); return; }
    const r = feedback();
    st.checked = true;
    if (r === null) { showStatus('fill'); return; }
    st.tries++;
    if (r) solved(); else showStatus('bad');
    updateButtons();
  }
  function solved() {
    if (!st.revealed) {
      const s = stored('wav-score', { solved: 0, clean: 0 });
      s.solved++;
      if (st.tries === 1 && st.hints === 0) s.clean++;
      store('wav-score', s);
      showScore();
    }
    st.solved = true;
    Practice.markSolved(PRACTICE, ex.id);
    finish();
    st.advance = ex.real != null ? '' : topics.solved(st, ex);
    if (ex.real != null) problems.solved(ex);
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
    $('#sol-figure').innerHTML = (ex.solFig ? graphs(ex.solFig) : '') + (ex.solAnim ? `<div class="fig">${animSlot({ ...solAnimOf(ex), arrows: true })}</div>` : '');
    $('#sol-steps').innerHTML = ex.solution.map((s) => `<p>${s}</p>`).join('');
    $('#solution').hidden = false;
    mountAnims($('#solution'));
  }
  function reveal() {
    if (!canReveal()) return;
    st.revealed = true;
    finish();
    if (ex.kind === 'draw') { st.values = [...ex.target]; st.wrong = null; drawEditor(); }
    showSolution();
    updateButtons();
    $('#solution').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---------------------------------------------------------------- tutor
  // The worksheet's crest (a block 5 cm high, then a slope down to −5 cm, from x = 1 m to 3 m) at
  // 2 m/s: how it travels, its y(t) graph at x = 4 m, two crests meeting, the reflection at a fixed
  // and a free end at x = 5 m, and the overlap at t = 1.5 s.
  const WS = () => W.pulse(W.LIN.ws, 1, 1, 2);
  const frame = (title, text, figure) => ({ text: `<div class="step-rule">${title}</div>${text}`, figure: `<div class="figs">${figure}</div>` });
  const fig = (html) => `<div class="fig">${html}</div>`;
  const anim = (a) => fig(animSlot({ arrows: true, ...a }));
  const EXAMPLES = [
    {
      topic: 0, name: () => L('A crest travels', 'Ein Buckel läuft'),
      idea: () => L('A crest moves along the rope without changing its shape; the rope itself only moves up and down.', 'Ein Buckel bewegt sich über das Seil, ohne seine Form zu ändern; das Seil selbst bewegt sich nur auf und ab.'),
      frames: () => {
        const p = WS(), sc = { pulses: [p], end: null };
        return [
          frame(L('The crest', 'Der Buckel'), `<p>${L('A crest made of straight pieces: a block 5 cm high, then a slope down to −5 cm, from x = 1 m to x = 3 m. It runs to the right at 2 m/s.', 'Ein Buckel aus geraden Stücken: ein Block von 5 cm Höhe, dann eine Rampe hinunter bis −5 cm, von x = 1 m bis x = 3 m. Er läuft mit 2 m/s nach rechts.')}</p>`, anim({ sc, t0: 0, t1: 2.5, show: ['sum'] })),
          frame(L('Distance = speed × time', 'Strecke = Geschwindigkeit × Zeit'), `<p>${W.RULE.move()} ${L('After 0.5 s it is 1 m further, after 1 s 2 m further.', 'Nach 0.5 s ist er 1 m weiter, nach 1 s 2 m weiter.')}</p>`,
            fig(P.graph(W.snap((x) => W.ev(p, x, 0), { label: W.tLabel(0), more: [{ f: (x) => W.ev(p, x, 0.5), cls: 'part' }, { f: (x) => W.ev(p, x, 1), cls: 'part2' }] }))) + `<p class="legend"><span class="k-main">t = 0</span> · <span class="k-part">t = 0.5 s</span> · <span class="k-part2">t = 1 s</span></p>`),
          frame(L('The rope moves up and down', 'Das Seil bewegt sich auf und ab'), `<p>${W.RULE.medium()}</p><p>${L('Watch the three points: each only moves up and down, while the crest passes.', 'Beobachte die drei Punkte: Jeder bewegt sich nur auf und ab, während der Buckel vorbeiläuft.')}</p>`,
            anim({ sc, t0: 0, t1: 2.5, show: ['sum'], dots: [{ x: 3.5, label: 'P' }, { x: 4.5, label: 'Q' }, { x: 5.5, label: 'R' }] })),
        ];
      },
    },
    {
      topic: 1, name: () => L('The y(t) graph', 'Das y(t)-Bild'),
      idea: () => L('At one place, the rope rises and falls as the crest passes: front first.', 'An einem Ort hebt und senkt sich das Seil, während der Buckel vorbeiläuft: die Front zuerst.'),
      frames: () => {
        const p = WS(), sc = { pulses: [p], end: null };
        return [
          frame(L('Watching one place', 'Einen Ort beobachten'), `<p>${L('How does the rope at x = 4 m move as the crest passes? Watch its y(t) graph grow alongside.', 'Wie bewegt sich das Seil bei x = 4 m, während der Buckel vorbeiläuft? Sieh zu, wie sein y(t)-Bild daneben entsteht.')}</p>`, anim({ sc, t0: 0, t1: 2, show: ['sum'], mark: 4, trace: 4 })),
          frame(L('The front comes first', 'Die Front kommt zuerst'), `<p>${W.RULE.yt()}</p><p>${L('The front (at x = 3 m) reaches 4 m after 0.5 s: the slope from −5 cm comes first. The block follows; the back (x = 1 m) passes after 1.5 s. The crest is 2 m long and runs 2 m/s: it takes 1 s to pass.', 'Die Front (bei x = 3 m) erreicht 4 m nach 0.5 s: Zuerst kommt die Rampe von −5 cm. Der Block folgt; der Rücken (x = 1 m) passiert nach 1.5 s. Der Buckel ist 2 m lang und läuft 2 m/s: Er braucht 1 s zum Vorbeilaufen.')}</p>`,
            fig(P.graph(W.graphT((t) => W.ev(p, 4, t), 3, { label: 'x = 4 m' })))),
        ];
      },
    },
    {
      topic: 4, name: () => L('Two crests meet', 'Zwei Buckel begegnen sich'),
      idea: () => L('Where crests overlap, their displacements add; afterwards each runs on as before.', 'Wo sich Buckel überlagern, addieren sich ihre Auslenkungen; danach läuft jeder weiter wie zuvor.'),
      frames: () => {
        const a = W.pulse(W.LIN.zig, 0.5, 1, 1), b = W.pulse(W.LIN.trap, 5, -1, 1), sc = { pulses: [a, b], end: null };
        const c = W.pulse(W.LIN.trap, 1, 1, 1), d = W.pulse(W.LIN.trap, 4.5, -1, 1, { sgn: -1 }), sc2 = { pulses: [c, d], end: null };
        return [
          frame(L('Superposition', 'Superposition'), `<p>${W.RULE.sup()}</p><p>${L('Dashed: each crest on its own; solid: the rope, their sum.', 'Gestrichelt: jeder Buckel für sich; ausgezogen: das Seil, ihre Summe.')}</p>`, anim({ sc, t0: 0, t1: 4.5, show: ['parts', 'sum'] })),
          frame(L('A crest meets its opposite', 'Ein Buckel trifft sein Gegenstück'), `<p>${L('A crest meets the same crest upside down: when they cover each other, the rope is straight for a moment. Yet it moves on: the rope is moving fast at that moment, and the crests come out again.', 'Ein Buckel trifft denselben Buckel umgedreht: Wenn sie sich decken, ist das Seil für einen Moment gerade. Trotzdem geht es weiter: Das Seil bewegt sich in diesem Moment schnell, und die Buckel kommen wieder heraus.')}</p>`, anim({ sc: sc2, t0: 0, t1: 4, show: ['parts', 'sum'] })),
        ];
      },
    },
    {
      topic: 5, name: () => L('Reflection at an end', 'Reflexion an einem Ende'),
      idea: () => L('At a fixed end the crest comes back upside down, at a free end upright; in both, reversed.', 'An einem festen Ende kommt der Buckel umgedreht zurück, an einem losen aufrecht; in beiden Fällen seitenverkehrt.'),
      frames: () => {
        const p = WS(), fixed = { pulses: [p], end: { x: 5, type: 'fixed' } }, free = { pulses: [p], end: { x: 5, type: 'free' } };
        return [
          frame(L('A fixed end', 'Ein festes Ende'), `<p>${L('The rope is tied to a wall at x = 5 m: the end cannot move.', 'Das Seil ist bei x = 5 m an einer Wand festgemacht: Das Ende kann sich nicht bewegen.')} ${W.RULE.fixed()}</p>`, anim({ sc: fixed, t0: 0, t1: 3.5, show: ['sum'], Y: 11 })),
          frame(L('The mirror trick', 'Der Spiegeltrick'), `<p>${W.RULE.mirror()}</p><p>${L('Behind the end (shaded) runs the mirror crest, upside down at a fixed end; on the rope the two add up, so the end stays at 0.', 'Hinter dem Ende (schattiert) läuft der Spiegelbuckel, bei einem festen Ende auf dem Kopf; auf dem Seil addieren sich die beiden, sodass das Ende bei 0 bleibt.')}</p>`, anim({ sc: fixed, t0: 0, t1: 3.5, show: ['parts', 'sum'], virtual: true, Y: 11 })),
          frame(L('A free end', 'Ein loses Ende'), `<p>${L('Now the end at x = 5 m is free (a ring on a pole): the mirror crest is upright, and the crest comes back upright. At the end the two add: it moves twice as far.', 'Jetzt ist das Ende bei x = 5 m lose (ein Ring an einer Stange): Der Spiegelbuckel steht aufrecht, und der Buckel kommt aufrecht zurück. Am Ende addieren sich die beiden: Es bewegt sich doppelt so weit.')}</p>`, anim({ sc: free, t0: 0, t1: 3.5, show: ['parts', 'sum'], virtual: true, Y: 11 })),
        ];
      },
    },
    {
      topic: 6, name: () => L('Reflection with overlap', 'Reflexion mit Überlagerung'),
      idea: () => L('While the crest is reflected, the incoming and the reflected part overlap and add.', 'Während der Buckel reflektiert wird, überlagern sich der einlaufende und der reflektierte Teil und addieren sich.'),
      frames: () => {
        const p = WS(), sc = { pulses: [p], end: { x: 5, type: 'free' } }, t = 1.5;
        return [
          frame(L('The rope at t = 1.5 s', 'Das Seil bei t = 1.5 s'), `<p>${L('After 1.5 s the crest has run 3 m: its front reached the end at t = 1 s and has come back 1 m; the block is still arriving. Green: the incoming part; orange: the reflected part (the mirror crest); blue: the rope, their sum.', 'Nach 1.5 s ist der Buckel 3 m gelaufen: Seine Front erreichte das Ende bei t = 1 s und ist 1 m zurückgekommen; der Block kommt noch an. Grün: der einlaufende Teil; orange: der reflektierte Teil (der Spiegelbuckel); blau: das Seil, ihre Summe.')}</p>`,
            fig(P.graph(W.snap((x) => W.y(sc, x, t), { hi: 5, end: sc.end, Y: 11, label: W.tLabel(t), more: [{ f: (x) => W.yIn(sc, x, t), cls: 'part' }, { f: (x) => W.yRef(sc, x, t), cls: 'part2' }] })))),
          frame(L('The whole reflection', 'Die ganze Reflexion'), `<p>${W.RULE.mirror()}</p>`, anim({ sc, t0: 0, t1: 3, show: ['parts', 'sum'], virtual: true, Y: 11 })),
          frame(L('The y(t) graph at x = 4 m', 'Das y(t)-Bild bei x = 4 m'), `<p>${L('With the free end, the rope at x = 4 m sees the crest pass and then its reflection come back over it. Its y(t) graph is the sum of both.', 'Mit dem losen Ende sieht das Seil bei x = 4 m den Buckel vorbeilaufen und dann seine Reflexion über ihn zurückkommen. Sein y(t)-Bild ist die Summe beider.')}</p>`,
            anim({ sc, t0: 0, t1: 3, show: ['sum'], mark: 4, trace: 4, Y: 11 })),
        ];
      },
    },
  ];

  // ---------------------------------------------------------------- practice topics
  const TOPICS = [
    { name: () => L('Propagation', 'Ausbreitung'), example: 0, stages: [{ name: () => L('straight crests', 'gerade Buckel'), types: ['move-lin'] }, { name: () => L('smooth crests', 'runde Buckel'), types: ['move-smooth'] }] },
    { name: () => L('y(t) and the rope', 'y(t)-Bild und Seil'), example: 1, stages: [{ name: () => L('rope → y(t)', 'Seil → y(t)'), types: ['yt-lin'] }, { name: () => L('y(t) → rope', 'y(t) → Seil'), types: ['ty-lin'] }, { name: () => L('smooth crests', 'runde Buckel'), types: ['yt-smooth', 'ty-smooth'] }] },
    { name: () => L('How the rope moves', 'Wie sich das Seil bewegt'), example: 0, stages: [{ name: () => L('straight crests', 'gerade Buckel'), types: ['medium-lin'] }, { name: () => L('smooth crests', 'runde Buckel'), types: ['medium-smooth'] }] },
    { name: () => L('Speed and timing', 'Geschwindigkeit und Zeit'), example: 1, stages: [{ name: () => L('two snapshots', 'zwei Momentbilder'), types: ['speed-x'] }, { name: () => L('the length', 'die Länge'), types: ['speed-len'] }, { name: () => L('two places', 'zwei Orte'), types: ['speed-t'] }] },
    { name: () => L('Superposition', 'Überlagerung'), example: 2, stages: [{ name: () => L('straight crests', 'gerade Buckel'), types: ['sup-lin'] }, { name: () => L('smooth crests', 'runde Buckel'), types: ['sup-smooth'] }, { name: () => L('draw it', 'zeichnen'), types: ['draw-sup'] }] },
    { name: () => L('Reflection', 'Reflexion'), example: 3, stages: [{ name: () => L('fixed end', 'festes Ende'), types: ['refl-fixed'] }, { name: () => L('free end', 'loses Ende'), types: ['refl-free'] }, { name: () => L('the mirror crest', 'der Spiegelbuckel'), types: ['mirror-lin', 'mirror-smooth'] }, { name: () => L('the end itself', 'das Ende selbst'), types: ['end-lin', 'end-smooth'] }, { name: () => L('smooth crests', 'runde Buckel'), types: ['refl-smooth'] }, { name: () => L('draw it', 'zeichnen'), types: ['draw-refl'] }] },
    { name: () => L('Reflection with overlap', 'Reflexion mit Überlagerung'), example: 4, stages: [{ name: () => L('straight crests', 'gerade Buckel'), types: ['reflsum-lin'] }, { name: () => L('smooth crests', 'runde Buckel'), types: ['reflsum-smooth'] }, { name: () => L('draw it', 'zeichnen'), types: ['draw-reflsum'] }] },
  ];

  // ---------------------------------------------------------------- arcade
  // Four options: diagrams, or values; how the rope moves as "which point moves up".
  const FLAG = { dist: 'distance', dir: 'direction', turn: 'turn', flip: 'flip', copy: 'yt', back: 'yt', dur: 'yt', time: 'distance', max: 'sum', apart: 'sum', sign: 'reflection', order: 'reflection', cut: 'sum', single: 'reflection', inverse: 'formula', total: 'formula' };
  const KINDS = [['move-lin', 1], ['move-smooth', 2], ['yt-lin', 2], ['medium-lin', 2], ['speed-x', 2], ['speed-len', 2], ['refl-fixed', 3], ['refl-free', 3], ['sup-lin', 3], ['mirror-lin', 3], ['speed-t', 3], ['ty-lin', 4], ['end-lin', 4], ['sup-smooth', 4], ['reflsum-lin', 5], ['refl-smooth', 5]];
  function arcadeQuestion(kind, seed) {
    const e = W.generate(kind, seed);
    const figure = `<div class="figs">${graphs(e.fig)}</div>`, explain = () => `<div class="figs">${e.solFig ? graphs(e.solFig) : ''}</div>${e.solution.map((s) => `<p>${s}</p>`).join('')}`;
    if (e.kind === 'medium') {
      const moves = e.questions.map((q) => q.options.find((o) => o.ok).label), want = moves.find((m) => moves.filter((x) => x === m).length === 1);
      if (!want) return arcadeQuestion(kind, seed + 1);
      return { title: TITLE.medium(), text: `<p>${e.text}</p>`, figure, ask: L(`Which point ${want}?`, `Welcher Punkt ${want}?`), options: e.questions.map((q) => ({ html: q.label, correct: q.options.find((o) => o.ok).label === want, flag: 'medium', why: q.options.find((o) => o.ok).why })), explain };
    }
    const q = e.questions[0];
    if (q.type === 'pick') return { title: TITLE[e.kind](), text: `<p>${e.text}</p>`, figure, ask: L('Which diagram is right?', 'Welches Diagramm stimmt?'), options: q.options.map((o) => ({ html: P.graph(o.fig, { small: true }), correct: o.ok, flag: FLAG[o.tag] || 'other', why: o.why })), explain };
    return { title: TITLE[e.kind](), text: `<p>${e.text}</p>`, figure, ask: q.label, options: q.options.map((o) => ({ html: o.label, correct: o.ok, flag: FLAG[o.tag] || 'other', why: o.why })), explain };
  }
  const arcadeSource = {
    id: 'wav',
    kinds: KINDS.map(([id, d]) => ({ id, difficulty: d })),
    question: arcadeQuestion,
    concept: { distance: 'distance', direction: 'direction', turn: 'turn', yt: 'yt', sum: 'sum', reflection: 'reflection', medium: 'medium' },
    concepts: () => ({
      distance: L('the distance v·t', 'die Strecke v·t'), direction: L('the direction of the crest', 'die Richtung des Buckels'), turn: L('a crest that turns round', 'einen Buckel, der sich umdreht'),
      yt: L('the y(t) graph not reversed', 'das y(t)-Bild nicht seitenverkehrt'), sum: L('the overlap not added', 'die Überlagerung nicht addiert'), reflection: L('the reflection wrong way up or not reversed', 'die Reflexion falsch herum oder nicht seitenverkehrt'), medium: L('how the rope moves', 'wie sich das Seil bewegt'),
    }),
    intro: () => ({
      tag: L('Crests on a rope: how they travel, add up and are reflected. As many as you can in <b>5 minutes</b>.', 'Buckel auf einem Seil: wie sie laufen, sich überlagern und reflektiert werden. So viele wie möglich in <b>5 Minuten</b>.'),
      rule: L('Questions get harder as you go. Choose one of four answers, or press 1–4.', 'Die Fragen werden nach und nach schwieriger. Wähle eine von vier Antworten oder drücke 1–4.'),
      example: L('a reflection at a fixed end drawn upright', 'eine Reflexion an einem festen Ende aufrecht gezeichnet'),
    }),
    hero: () => `<div class="figs"><div class="fig">${P.graph(W.snap((x) => W.ev(WS(), x, 0), { hi: 5, end: { x: 5, type: 'free' }, arrows: [W.arrowOf(WS(), 0)] }))}</div></div>`,
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
      if (ex.kind === 'draw') drawEditor();
      chosen.forEach(([n, v]) => { const x = document.querySelector(`input[name="${n}"][value="${v}"]`); if (x) x.checked = true; });
      if (st.checked) feedback();
      showStatus(status);
      showHints();
      if (st.revealed) showSolution();
      if ($('#task').hidden) { $('#hints').hidden = true; $('#solution').hidden = true; }
      updateButtons();
    }
    tutor.relabel(lessons());
    arcade.relabel();
  }
  const lessons = () => EXAMPLES.map((e) => ({ name: e.name(), idea: e.idea(), frames: e.frames, also: topics.also(e.topic) }));

  const mode = () => (document.querySelector('input[name="mode"]:checked') || {}).value || 'practice';
  function setMode(m) {
    document.querySelector(`input[name="mode"][value="${m}"]`).checked = true;
    store('wav-mode', m);
    document.querySelectorAll('.practice, .real').forEach((el) => { el.hidden = !el.classList.contains(m); });
    $('#tutor').hidden = m !== 'tutor';
    $('#arcade').hidden = m !== 'arcade';
    if (m !== 'practice' && m !== 'real') { $('#hints').hidden = true; $('#solution').hidden = true; stopAnims(); }
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
    if (m && Number(m[1]) >= 1 && Number(m[1]) <= EXAMPLES.length) {
      setMode('tutor');
      if (tutor.current() !== Number(m[1]) - 1 || !tutor.shown()) tutor.open(Number(m[1]) - 1);
      return true;
    }
    const re = problems.parse(h);
    if (re) { setMode('real'); if (!ex || ex.id !== h) open(re); problems.menu(); return true; }
    const te = topics.parse(h);
    if (te) { setMode('practice'); if (!ex || ex.id !== h) open(te); return true; }
    return false;
  }

  function init() {
    Lang.init();
    document.querySelector('main').insertAdjacentHTML('beforeend', Arcade.HTML);
    topics = window.Topics.create({
      app: PRACTICE,
      topics: TOPICS.map((t) => ({ name: t.name, stages: t.stages, example: { i: t.example, name: () => EXAMPLES[t.example].name() } })),
      make: (type, seed) => W.generate(type, seed), typeOf,
      onChange: fresh,
      tutor: (i) => { setMode('tutor'); tutor.open(i); },
    });
    topics.mount($('#levels'));
    problems = window.Problems.create({
      app: PRACTICE, problems: window.WaveProblems.PROBLEMS, make: window.WaveProblems.realOf,
      open, current: () => ex, pick: $('#real-pick'), renew: $('#real-new'),
    });
    applyStatic();
    Lang.wire(switchLang);
    $('#new').addEventListener('click', fresh);
    $('#answers').addEventListener('submit', check);
    $('#fields').addEventListener('change', (evt) => {
      const row = evt.target.closest('.field');
      if (row) { row.className = 'field'; row.querySelector('.fb').textContent = ''; }
      if (evt.target.closest('.cand')) { document.querySelectorAll('.cand').forEach((el) => el.classList.remove('ok', 'bad')); document.querySelectorAll('.qfb').forEach((el) => { el.textContent = ''; }); }
    });
    $('#draw-area').addEventListener('click', (evt) => {
      if (evt.target.id === 'draw-clear') { st.values = ex.xs.map(() => 0); st.wrong = null; drawEditor(); return; }
      onDrawClick(evt);
    });
    $('#hint').addEventListener('click', hint);
    $('#reveal').addEventListener('click', reveal);
    window.addEventListener('hashchange', fromHash);
    tutor = window.createTutor(lessons(), { after: () => { stopAnims(); mountAnims($('#tutor')); }, done: practise, practise: (i) => { topics.go(EXAMPLES[i].topic); setMode('practice'); fresh(); } });
    arcade = Arcade.create(arcadeSource, { math: () => {}, markScrollable: () => {}, stored, store });
    $('#modes').addEventListener('change', () => {
      if (mode() === 'tutor') { setMode('tutor'); tutor.open(tutor.current()); } else if (mode() === 'arcade') play(); else if (mode() === 'real') realMode(); else practise();
    });
    showScore();
    if (fromHash()) return;
    const last = stored('wav-mode', 'tutor');
    if (last === 'tutor') { setMode('tutor'); tutor.open(0); } else if (last === 'arcade') play(); else if (last === 'real') realMode(); else { setMode('practice'); fresh(); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
