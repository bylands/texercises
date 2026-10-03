// Arcade mode: as many questions as possible in five minutes, of increasing difficulty. Each asks
// for one quantity of an exercise that needs no calculator, with four options (see quiz() in
// generator.js); one try each and no hints. A right answer earns 100 points per level of
// difficulty and a speed bonus of up to as much again. A wrong option that stems from a typical
// wrong idea is a misconception: choosing one of the same idea again costs points, while answering
// a question on that idea correctly after making the mistake once earns a bonus. At the end, a
// summary lists every question with the answer chosen and, on request, the worked solution.
// The arcade has its own look, after the animations of manim (see style.css).
(function (root) {
  'use strict';

  const FS = root.FS, { generateFor, quiz, SCENARIOS } = root.Forces;
  const $ = (sel) => document.querySelector(sel);

  const DURATION = 300; // s
  const PENALTY = 50, BONUS = 100;
  const REVEAL = 900; // ms the right option is shown before the next question
  // Difficulty of the situations, 1 to 5 (see scenarios.js); the game moves up one level every two questions.
  const DIFFICULTY = Object.fromEntries(SCENARIOS.map((s) => [s.id, s.difficulty]));
  const par = (d) => 15 + 15 * d; // s; the speed bonus is gone after this time
  // The idea behind each wrong-answer flag (g = 9.81 m/s² never comes up: the values are made for g = 10 m/s²).
  const CONCEPT = { swap: 'comp', whole: 'comp', flatN: 'normal', noFric: 'friction', noSlope: 'slope', oneMass: 'mass', hangW: 'rope', hangW2: 'rope', pass: 'pass', dirF: 'dir' };

  const T = {
    en: {
      start: 'Arcade',
      tag: 'Answer as many questions as you can in <b>5 minutes</b>: four answers each, no calculator.',
      more: 'How points work',
      rules: [
        'Questions get harder as you go. Choose one of four answers, or press 1–4. The numbers are made for mental arithmetic, with g = 10 m/s².',
        'A right answer earns <b>100 points per star</b> of difficulty, plus a speed bonus of up to as much again, which shrinks the longer you take.',
        'One try per question and no hints. If you are stuck, skip: that costs no points, but the question counts as not solved.',
        `Falling for the <b>same misconception again</b> (e.g. forgetting friction) costs ${PENALTY} points each time. After falling for one once, answering a question on the same idea correctly earns a <b>bonus of ${BONUS}</b> points.`,
        'At the end, you see all your answers and can look at the worked solutions.',
      ],
      best: (b) => (b ? `Your best score: ${b} points` : ''),
      go: 'Start', skip: 'Skip', quit: 'End game', again: 'Play again',
      time: (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`,
      score: (p) => `${p} points`, solvedN: (n) => `${n} solved`,
      ask: (what, sym) => `Find the ${what} ${sym}.`,
      right: (p, b, sp) => `✓ Correct: +${p} (${b} + ${sp} for speed)`,
      wrongMsg: '✗ Not correct',
      skipped: 'Skipped',
      penalty: (c) => `Same misconception again (${c}): −${PENALTY}`,
      bonus: (c) => `Misconception overcome (${c}): +${BONUS}`,
      over: 'Time is up!', ended: 'Game over',
      total: (p) => `${p} points`,
      stats: (ok, bad) => `${ok} solved, ${bad} not solved.`,
      record: ' New best score!',
      unfinished: 'not answered',
      question: 'Question', yours: 'Your answer', correctV: 'Right answer', none: '—',
      explain: 'Worked solution',
      concepts: {
        comp: 'components of a force', normal: 'normal force equal to the weight', friction: 'friction forgotten',
        slope: 'component down the slope forgotten', mass: 'only one mass accelerated', rope: 'rope force equal to a weight',
        pass: 'whole force passed on', dir: 'direction of a force',
      },
    },
    de: {
      start: 'Arcade',
      tag: 'Beantworte in <b>5 Minuten</b> so viele Fragen wie möglich: je vier Antworten, kein Taschenrechner.',
      more: 'So gibt es Punkte',
      rules: [
        'Die Fragen werden nach und nach schwieriger. Wähle eine von vier Antworten oder drücke 1–4. Die Zahlen sind fürs Kopfrechnen gemacht, mit g = 10 m/s².',
        'Eine richtige Antwort bringt <b>100 Punkte pro Stern</b> Schwierigkeit und einen Tempobonus von bis zu nochmals so viel, der kleiner wird, je länger du brauchst.',
        'Ein Versuch pro Frage, keine Tipps. Wenn du nicht weiterkommst, überspringe die Frage: Das kostet keine Punkte, aber sie gilt als nicht gelöst.',
        `Fällst du <b>nochmals auf dieselbe Fehlvorstellung</b> herein (z.B. die Reibung vergessen), kostet das jedes Mal ${PENALTY} Punkte. Bist du einmal auf eine hereingefallen und beantwortest danach eine Frage zur selben Idee richtig, gibt es einen <b>Bonus von ${BONUS}</b> Punkten.`,
        'Am Schluss siehst du alle deine Antworten und kannst die ausführlichen Lösungen anschauen.',
      ],
      best: (b) => (b ? `Dein bester Punktestand: ${b} Punkte` : ''),
      go: 'Start', skip: 'Überspringen', quit: 'Spiel beenden', again: 'Nochmals spielen',
      time: (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`,
      score: (p) => `${p} Punkte`, solvedN: (n) => `${n} gelöst`,
      ask: (what, sym) => `Wie gross ist die ${what} ${sym}?`,
      right: (p, b, sp) => `✓ Richtig: +${p} (${b} + ${sp} Tempobonus)`,
      wrongMsg: '✗ Nicht richtig',
      skipped: 'Übersprungen',
      penalty: (c) => `Dieselbe Fehlvorstellung nochmals (${c}): −${PENALTY}`,
      bonus: (c) => `Fehlvorstellung überwunden (${c}): +${BONUS}`,
      over: 'Die Zeit ist um!', ended: 'Spiel beendet',
      total: (p) => `${p} Punkte`,
      stats: (ok, bad) => `${ok} gelöst, ${bad} nicht gelöst.`,
      record: ' Neuer Bestwert!',
      unfinished: 'nicht beantwortet',
      question: 'Frage', yours: 'Deine Antwort', correctV: 'Richtige Antwort', none: '—',
      explain: 'Ausführliche Lösung',
      concepts: {
        comp: 'Komponenten einer Kraft', normal: 'Normalkraft gleich Gewichtskraft', friction: 'Reibung vergessen',
        slope: 'Hangabtriebskraft vergessen', mass: 'nur eine Masse beschleunigt', rope: 'Seilkraft gleich einer Gewichtskraft',
        pass: 'ganze Kraft weitergegeben', dir: 'Richtung einer Kraft',
      },
    },
  };
  const t = () => T[FS.getLang()];
  const stars = (d) => '★'.repeat(d) + '☆'.repeat(5 - d);
  const newSeed = () => 1 + Math.floor(Math.random() * 999999);

  // A question: the exercise (no calculator needed) and the multiple choice about it.
  function question(scenario, seed, qseed, difficulty) {
    const ex = generateFor(scenario, seed, { nice: true });
    return { ex, qz: quiz(ex, qseed), scenario, seed, qseed, difficulty };
  }
  const askHtml = (qz) => t().ask(qz.field.what, `$${FS.tex(...qz.field.sym)}$`);
  const optHtml = (o, f) => `$${FS.tq(o.value, f.unit)}$`;
  // The ideas a question tests: those of its wrong options.
  const tests = (qz) => new Set(qz.options.map((o) => CONCEPT[o.flag]).filter(Boolean));

  // h: helpers of the app { math, markScrollable, stored, store }.
  function createArcade(h) {
    let game = null, cur = null, timer = null, toastTimer = null, nextTimer = null;

    const show = (part) => { ['start', 'play', 'summary'].forEach((k) => { $(`#ar-${k}`).hidden = k !== part; }); };
    const left = () => Math.max(0, DURATION - Math.floor((Date.now() - game.t0) / 1000));
    // Restarts the entrance animations of an element (see style.css).
    const animate = (el) => { el.classList.remove('animate'); void el.offsetWidth; el.classList.add('animate'); };

    // The start page's picture: a box pulled up a slope with all its forces, drawn again and again,
    // with Newton's second law below it.
    let heroTimer = null;
    function hero() {
      const ex = generateFor('incline-pull', 7, { nice: true });
      $('#ar-hero').innerHTML = `${ex.solutionFigure()}<p class="ar-law">$${FS.tex('res')} = m\\,a$</p>`;
      h.math($('#ar-hero'));
    }
    function replay() {
      clearInterval(heroTimer);
      animate($('#ar-hero'));
      heroTimer = setInterval(() => { if ($('#arcade').hidden || $('#ar-start').hidden) clearInterval(heroTimer); else animate($('#ar-hero')); }, 7000);
    }

    function staticTexts() {
      $('#ar-start-title').textContent = t().start;
      $('#ar-tag').innerHTML = t().tag;
      $('#ar-more-sum').textContent = t().more;
      $('#ar-rules').innerHTML = `<ul>${t().rules.map((x) => `<li>${x}</li>`).join('')}</ul>`;
      hero();
      $('#ar-best').textContent = t().best(h.stored('fs-arcade-best', 0));
      $('#ar-go').textContent = t().go;
      $('#ar-skip').textContent = t().skip;
      $('#ar-quit').textContent = t().quit;
      $('#ar-again').textContent = t().again;
    }

    // ------------------------------------------------------------ the game
    function start() {
      clearTimeout(nextTimer);
      game = { t0: Date.now(), score: 0, items: [], counts: {}, redeemed: {}, notes: [], last: null, over: false };
      show('play');
      $('#ar-toast').textContent = '';
      next();
      tick();
      clearInterval(timer);
      timer = setInterval(tick, 250);
    }

    function tick() {
      if (!game || game.over) return;
      const s = left();
      $('#ar-time').textContent = t().time(s);
      $('#ar-time').classList.toggle('low', s <= 30);
      $('#ar-tbar').style.width = `${(100 * s) / DURATION}%`;
      if (s <= 0) finish();
    }

    function header() {
      $('#ar-score').textContent = t().score(game.score);
      $('#ar-level').textContent = `${stars(cur.difficulty)} · ${t().solvedN(game.items.filter((i) => i.ok).length)}`;
    }

    // The next question: one level up every two questions, not the same situation twice in a row.
    function next() {
      if (!game || game.over) return;
      const d = Math.min(5, 1 + Math.floor(game.items.length / 2));
      let list = Object.keys(DIFFICULTY).filter((k) => DIFFICULTY[k] === d);
      if (list.length > 1) list = list.filter((k) => k !== game.last);
      const scenario = list[Math.floor(Math.random() * list.length)];
      cur = question(scenario, newSeed(), newSeed(), d);
      game.last = scenario;
      game.since = Date.now();
      game.locked = false;
      render(true);
    }

    function render(fresh) {
      const { ex, qz } = cur;
      $('#ar-title').textContent = ex.title;
      $('#ar-prompt').innerHTML = ex.text;
      $('#ar-figure').innerHTML = ex.figure({ task: true, tight: true });
      $('#ar-ask').innerHTML = askHtml(qz);
      $('#ar-options').innerHTML = qz.options.map((o, k) =>
        `<button type="button" class="ar-opt" data-k="${k}"><span class="key">${k + 1}</span><span class="val">${optHtml(o, qz.field)}</span></button>`).join('');
      h.math($('#ar-stage'));
      h.markScrollable();
      header();
      if (fresh) animate($('#ar-stage'));
    }

    function choose(k) {
      if (!game || game.over || game.locked) return;
      game.locked = true;
      const { qz } = cur, o = qz.options[k];
      const time = (Date.now() - game.since) / 1000;
      const item = { scenario: cur.scenario, seed: cur.seed, qseed: cur.qseed, difficulty: cur.difficulty, chosen: k, ok: !!o.correct, time: Math.round(time), points: 0, notes: [] };
      const msgs = [];
      if (o.correct) {
        const base = 100 * cur.difficulty, speed = Math.round(base * Math.max(0, 1 - time / par(cur.difficulty)));
        item.points = base + speed;
        msgs.push(t().right(base + speed, base, speed));
        for (const c of tests(qz)) {
          if (game.counts[c] === 1 && !game.redeemed[c]) {
            game.redeemed[c] = true;
            item.points += BONUS;
            item.notes.push({ kind: 'bonus', c });
          }
        }
      } else {
        msgs.push(t().wrongMsg);
        const c = CONCEPT[o.flag];
        if (c) {
          game.counts[c] = (game.counts[c] || 0) + 1;
          if (game.counts[c] >= 2) {
            item.points -= PENALTY;
            item.notes.push({ kind: 'penalty', c });
          }
        }
      }
      item.notes.forEach((n) => msgs.push(t()[n.kind](t().concepts[n.c])));
      // show the right option (and the wrong one chosen) for a moment
      document.querySelectorAll('.ar-opt').forEach((b, j) => {
        b.disabled = true;
        if (qz.options[j].correct) b.classList.add('right');
        else if (j === k) b.classList.add('wrong');
      });
      record(item, o.correct ? 'ok' : 'bad', msgs);
      nextTimer = setTimeout(next, REVEAL);
    }

    function skip() {
      if (!game || game.over || game.locked) return;
      game.locked = true;
      record({ scenario: cur.scenario, seed: cur.seed, qseed: cur.qseed, difficulty: cur.difficulty, chosen: null, ok: false, skipped: true,
        time: Math.round((Date.now() - game.since) / 1000), points: 0, notes: [] }, 'bad', [t().skipped]);
      next();
    }

    function record(item, cls, msgs) {
      game.items.push(item);
      game.score += item.points;
      game.notes.push(...item.notes);
      header();
      toast(msgs.join(' · '), cls);
      if (item.points) pop(item.points);
    }

    function toast(text, cls) {
      const el = $('#ar-toast');
      el.textContent = text;
      el.className = `ar-toast ${cls} shown`;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => el.classList.remove('shown'), 3500);
    }
    // The points won or lost rise from the score and fade, as in a manim transform.
    function pop(points) {
      const el = document.createElement('span');
      el.className = `ar-pop ${points > 0 ? 'ok' : 'bad'}`;
      el.textContent = points > 0 ? `+${points}` : `−${-points}`;
      $('#ar-score').appendChild(el);
      setTimeout(() => el.remove(), 1400);
    }

    // Time up or ended: a question left open counts as not answered.
    function finish() {
      if (!game || game.over) return;
      clearTimeout(nextTimer);
      if (!game.locked) {
        game.items.push({ scenario: cur.scenario, seed: cur.seed, qseed: cur.qseed, difficulty: cur.difficulty, chosen: null, ok: false, unfinished: true,
          time: Math.round((Date.now() - game.since) / 1000), points: 0, notes: [] });
      }
      game.over = true;
      clearInterval(timer);
      game.timeUp = left() <= 0;
      const best = h.stored('fs-arcade-best', 0);
      game.record = game.score > best && game.items.some((i) => i.ok);
      if (game.record) h.store('fs-arcade-best', game.score);
      summary();
    }

    // ------------------------------------------------------------ the summary
    function summary() {
      show('summary');
      const ok = game.items.filter((i) => i.ok).length;
      $('#ar-sum-title').textContent = game.timeUp ? t().over : t().ended;
      $('#ar-sum-score').textContent = t().total(game.score);
      $('#ar-sum-stats').textContent = t().stats(ok, game.items.length - ok) + (game.record ? t().record : '');
      $('#ar-sum-notes').innerHTML = game.notes.map((n) => `<li class="${n.kind}">${t()[n.kind](t().concepts[n.c])}</li>`).join('');
      $('#ar-sum-list').innerHTML = game.items.map((it, k) => {
        const { ex } = question(it.scenario, it.seed, it.qseed, it.difficulty);
        const mark = it.ok ? '✓' : '✗', state = it.skipped ? ` · ${t().skipped}` : it.unfinished ? ` · ${t().unfinished}` : '';
        const pts = it.points > 0 ? `+${it.points}` : it.points < 0 ? `−${-it.points}` : '0';
        return `<details class="ar-item ${it.ok ? 'ok' : 'bad'}" data-k="${k}"><summary><span class="mark">${mark}</span> ${k + 1}. ${ex.title} <span class="stars">${stars(it.difficulty)}</span> <span class="meta">${it.time} s · ${pts}${state}</span></summary><div class="ar-explain"></div></details>`;
      }).join('');
      animate($('#ar-summary'));
    }

    // The question, the answer chosen against the right one, and the worked solution.
    function explain(det) {
      const it = game.items[Number(det.dataset.k)], { ex, qz } = question(it.scenario, it.seed, it.qseed, it.difficulty);
      const chosen = it.chosen == null ? null : qz.options[it.chosen], right = qz.options.find((o) => o.correct);
      const why = chosen && !chosen.correct && chosen.why ? `<div class="why">${chosen.why}</div>` : '';
      const box = det.querySelector('.ar-explain');
      box.innerHTML = `${ex.text}<p><b>${t().question}:</b> ${askHtml(qz)}</p>` +
        `<table class="ar-answers"><tbody>` +
        `<tr class="${chosen ? (chosen.correct ? 'ok' : 'bad') : ''}"><th>${t().yours}</th><td>${chosen ? optHtml(chosen, qz.field) : t().none}${why}</td></tr>` +
        `<tr><th>${t().correctV}</th><td>${optHtml(right, qz.field)}</td></tr></tbody></table>` +
        `<h4>${t().explain}</h4><div class="figs">${ex.solutionFigure()}</div><div class="steps">${ex.solution.join('')}</div>`;
      h.math(box);
      h.markScrollable();
    }

    // ------------------------------------------------------------ wiring
    $('#ar-go').addEventListener('click', start);
    $('#ar-again').addEventListener('click', start);
    $('#ar-options').addEventListener('click', (evt) => { const b = evt.target.closest('.ar-opt'); if (b) choose(Number(b.dataset.k)); });
    $('#ar-skip').addEventListener('click', skip);
    $('#ar-quit').addEventListener('click', finish);
    document.addEventListener('keydown', (evt) => {
      if ($('#arcade').hidden || $('#ar-play').hidden || evt.altKey || evt.ctrlKey || evt.metaKey) return;
      const k = '1234'.indexOf(evt.key);
      if (k >= 0) { evt.preventDefault(); choose(k); }
    });
    $('#ar-sum-list').addEventListener('toggle', (evt) => {
      const det = evt.target;
      if (det.open && !det.querySelector('.ar-explain').childElementCount) explain(det);
    }, true);
    staticTexts();

    return {
      // the start page, or the game or summary in progress
      show() { staticTexts(); if (!game) { show('start'); animate($('#ar-start')); replay(); } },
      // leaving the arcade ends a game in progress; its summary stays
      stop() {
        if (game && !game.over) { game.over = true; clearInterval(timer); clearTimeout(nextTimer); game = null; show('start'); }
        clearInterval(heroTimer);
      },
      relabel() {
        staticTexts();
        if (!game) return;
        if (!game.over) {
          cur = question(cur.scenario, cur.seed, cur.qseed, cur.difficulty);
          if (!game.locked) render(false);
          header();
          tick();
        } else summary();
      },
    };
  }

  root.createArcade = createArcade;
})(window);
