// Shared by the learningphysics.ch apps (canonical copy in shared/, copied by sync.sh).
// Arcade mode: as many questions as possible in five minutes, of increasing difficulty, each with
// four options; one try each and no hints. A right answer earns 100 points per level of difficulty
// and a speed bonus of up to as much again. A wrong option that stems from a typical wrong idea is
// a misconception: choosing one of the same idea again costs points, while answering a question
// on that idea correctly after falling for it once earns a bonus. At the end, a summary lists every
// question with the answer chosen and, on request, an explanation. The look is that of manim (see
// ui.css); the page needs the #arcade section of the apps (see an app's index.html).
//
// The app supplies the questions, in the current language (see lang.js):
//   src.id                    a short name, for the best score in storage
//   src.kinds                 [{ id, difficulty: 1–5 }]; the game moves up one level every two
//                             questions and never asks the same kind twice in a row
//   src.question(kind, seed)  { title, text, figure, ask (all HTML), options: [{ html, correct,
//                             flag, why }] (four, one correct; flag: the wrong idea behind it, why:
//                             what is wrong), explain() (HTML: the worked solution), key
//                             (optional: questions with the same key count as repeats, e.g. the
//                             same circuit asking about another bulb) }
//   src.concept               { flag: idea } for the flags that count as misconceptions
//   src.concepts()            { idea: name }
//   src.intro()               { tag, rule, example }: the line under the start picture, the first
//                             rule (how to answer) and an example misconception
//   src.hero()                the start picture (HTML; its <g class="seq"> appear one by one)
// h: helpers of the app { math(el), markScrollable(), stored(key, fallback), store(key, value) }.
(function (root) {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const DURATION = 300; // s
  const PENALTY = 50, BONUS = 100;
  const REVEAL = 900; // ms the right option is shown before the next question
  const par = (d) => 15 + 15 * d; // s; the speed bonus is gone after this time

  const T = {
    en: {
      start: 'Arcade',
      more: 'How points work',
      rules: (i) => [
        i.rule,
        'A right answer earns <b>100 points per star</b> of difficulty, plus a speed bonus of up to as much again, which shrinks the longer you take.',
        'One try per question and no hints. If you are stuck, skip: that costs no points, but the question counts as not solved.',
        `Falling for the <b>same misconception again</b> (e.g. ${i.example}) costs ${PENALTY} points each time. After falling for one once, answering a question on the same idea correctly earns a <b>bonus of ${BONUS}</b> points.`,
        'At the end, you see all your answers and can look at the explanations.',
      ],
      best: (b) => (b ? `Your best score: ${b} points` : ''),
      go: 'Start', skip: 'Skip', quit: 'End game', again: 'Play again',
      score: (p) => `${p} points`, solvedN: (n) => `${n} solved`,
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
      explain: 'Explanation',
      stars: (d) => `Difficulty: ${d} of 5`,
    },
    de: {
      start: 'Arcade',
      more: 'So gibt es Punkte',
      rules: (i) => [
        i.rule,
        'Eine richtige Antwort bringt <b>100 Punkte pro Stern</b> Schwierigkeit und einen Tempobonus von bis zu nochmals so viel, der kleiner wird, je länger du brauchst.',
        'Ein Versuch pro Frage, keine Tipps. Wenn du nicht weiterkommst, überspringe die Frage: Das kostet keine Punkte, aber sie gilt als nicht gelöst.',
        `Fällst du <b>nochmals auf dieselbe Fehlvorstellung</b> herein (z.B. ${i.example}), kostet das jedes Mal ${PENALTY} Punkte. Bist du einmal auf eine hereingefallen und beantwortest danach eine Frage zur selben Idee richtig, gibt es einen <b>Bonus von ${BONUS}</b> Punkten.`,
        'Am Schluss siehst du alle deine Antworten und kannst die Erklärungen anschauen.',
      ],
      best: (b) => (b ? `Dein bester Punktestand: ${b} Punkte` : ''),
      go: 'Start', skip: 'Überspringen', quit: 'Spiel beenden', again: 'Nochmals spielen',
      score: (p) => `${p} Punkte`, solvedN: (n) => `${n} gelöst`,
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
      explain: 'Erklärung',
      stars: (d) => `Schwierigkeit: ${d} von 5`,
    },
  };
  const t = () => T[root.Lang ? root.Lang.get() : 'en'];
  const starText = (d) => '★'.repeat(d) + '☆'.repeat(5 - d);
  const stars = (d) => `<span class="stars" role="img" aria-label="${t().stars(d)}" title="${t().stars(d)}">${starText(d)}</span>`;
  const clock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const newSeed = () => 1 + Math.floor(Math.random() * 999999);

  function createArcade(src, h) {
    let game = null, cur = null, timer = null, toastTimer = null, nextTimer = null, heroTimer = null;
    const bestKey = `${src.id}-arcade-best`;

    const show = (part) => { ['start', 'play', 'summary'].forEach((k) => { $(`#ar-${k}`).hidden = k !== part; }); };
    const left = () => Math.max(0, DURATION - Math.floor((Date.now() - game.t0) / 1000));
    // Restarts the entrance animations of an element (see ui.css).
    const animate = (el) => { el.classList.remove('animate'); void el.offsetWidth; el.classList.add('animate'); };
    const question = (kind, seed, difficulty) => ({ kind, seed, difficulty, q: src.question(kind, seed) });
    // The ideas a question tests: those of its wrong options.
    const tests = (q) => new Set(q.options.map((o) => src.concept[o.flag]).filter(Boolean));

    // ------------------------------------------------------------ start page
    function hero() {
      $('#ar-hero').innerHTML = src.hero();
      h.math($('#ar-hero'));
    }
    function replay() {
      clearInterval(heroTimer);
      animate($('#ar-hero'));
      heroTimer = setInterval(() => { if ($('#arcade').hidden || $('#ar-start').hidden) clearInterval(heroTimer); else animate($('#ar-hero')); }, 7000);
    }
    function staticTexts() {
      const intro = src.intro();
      $('#ar-start-title').textContent = t().start;
      $('#ar-tag').innerHTML = intro.tag;
      $('#ar-more-sum').textContent = t().more;
      $('#ar-rules').innerHTML = `<ul>${t().rules(intro).map((x) => `<li>${x}</li>`).join('')}</ul>`;
      hero();
      $('#ar-best').textContent = t().best(h.stored(bestKey, 0));
      $('#ar-go').textContent = t().go;
      $('#ar-skip').textContent = t().skip;
      $('#ar-quit').textContent = t().quit;
      $('#ar-again').textContent = t().again;
    }

    // ------------------------------------------------------------ the game
    function start() {
      clearTimeout(nextTimer);
      game = { t0: Date.now(), score: 0, items: [], counts: {}, redeemed: {}, notes: [], last: null, over: false, asked: new Set() };
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
      $('#ar-time').textContent = clock(s);
      $('#ar-time').classList.toggle('low', s <= 30);
      $('#ar-tbar').style.width = `${(100 * s) / DURATION}%`;
      if (s <= 0) finish();
    }

    function header() {
      $('#ar-score').textContent = t().score(game.score);
      $('#ar-level').innerHTML = `${stars(cur.difficulty)} · ${t().solvedN(game.items.filter((i) => i.ok).length)}`;
    }

    // The next question: one level up every two questions (the nearest level with questions; at
    // the top, the two highest levels), not the same kind twice in a row.
    function next() {
      if (!game || game.over) return;
      const want = Math.min(5, 1 + Math.floor(game.items.length / 2));
      const levels = [...new Set(src.kinds.map((k) => k.difficulty))];
      let d = levels.reduce((a, b) => (Math.abs(b - want) < Math.abs(a - want) || (Math.abs(b - want) === Math.abs(a - want) && b < a) ? b : a));
      // at the top, the two highest levels take turns at random (the top one alone may have only
      // a few kinds of question)
      const top = [...levels].sort((a, b) => b - a);
      if (want >= top[0] && top.length > 1 && Math.random() < 0.5) d = top[1];
      let list = src.kinds.filter((k) => k.difficulty === d).map((k) => k.id);
      if (list.length > 1) list = list.filter((k) => k !== game.last);
      // a question not asked before in this game (an exercise type with few variants could
      // otherwise come up again and again)
      const sig = (c) => c.q.key || `${c.q.title}|${c.q.ask}|${c.q.figure}|${c.q.options.map((o) => o.html).join('|')}`;
      for (let k = 0; k < 12; k++) {
        const kind = list[Math.floor(Math.random() * list.length)];
        cur = question(kind, newSeed(), d);
        if (!game.asked.has(sig(cur))) break;
      }
      game.asked.add(sig(cur));
      const kind = cur.kind;
      game.last = kind;
      game.since = Date.now();
      game.locked = false;
      render(true);
    }

    function render(fresh) {
      const { q } = cur;
      $('#ar-title').textContent = q.title;
      $('#ar-prompt').innerHTML = q.text;
      $('#ar-figure').innerHTML = q.figure;
      $('#ar-ask').innerHTML = q.ask;
      $('#ar-options').innerHTML = q.options.map((o, k) =>
        `<button type="button" class="ar-opt" data-k="${k}"><span class="key">${k + 1}</span><span class="val">${o.html}</span></button>`).join('');
      h.math($('#ar-stage'));
      h.markScrollable();
      header();
      if (fresh) animate($('#ar-stage'));
    }

    const item = (extra) => ({ kind: cur.kind, seed: cur.seed, difficulty: cur.difficulty, chosen: null, ok: false,
      time: Math.round((Date.now() - game.since) / 1000), points: 0, notes: [], ...extra });

    function choose(k) {
      if (!game || game.over || game.locked) return;
      game.locked = true;
      const { q } = cur, o = q.options[k];
      const it = item({ chosen: k, ok: !!o.correct });
      const time = (Date.now() - game.since) / 1000;
      const msgs = [];
      if (o.correct) {
        const base = 100 * cur.difficulty, speed = Math.round(base * Math.max(0, 1 - time / par(cur.difficulty)));
        it.points = base + speed;
        msgs.push(t().right(base + speed, base, speed));
        for (const c of tests(q)) {
          if (game.counts[c] === 1 && !game.redeemed[c]) {
            game.redeemed[c] = true;
            it.points += BONUS;
            it.notes.push({ kind: 'bonus', c });
          }
        }
      } else {
        msgs.push(t().wrongMsg);
        const c = src.concept[o.flag];
        if (c) {
          game.counts[c] = (game.counts[c] || 0) + 1;
          if (game.counts[c] >= 2) {
            it.points -= PENALTY;
            it.notes.push({ kind: 'penalty', c });
          }
        }
      }
      const names = src.concepts();
      it.notes.forEach((n) => msgs.push(t()[n.kind](names[n.c])));
      // show the right option (and the wrong one chosen) for a moment
      document.querySelectorAll('.ar-opt').forEach((b, j) => {
        b.disabled = true;
        if (q.options[j].correct) b.classList.add('right');
        else if (j === k) b.classList.add('wrong');
      });
      record(it, o.correct ? 'ok' : 'bad', msgs);
      nextTimer = setTimeout(next, REVEAL);
    }

    function skip() {
      if (!game || game.over || game.locked) return;
      game.locked = true;
      record(item({ skipped: true }), 'bad', [t().skipped]);
      next();
    }

    function record(it, cls, msgs) {
      game.items.push(it);
      game.score += it.points;
      game.notes.push(...it.notes);
      header();
      toast(msgs.join(' · '), cls);
      if (it.points) pop(it.points);
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
      if (!game.locked) game.items.push(item({ unfinished: true }));
      game.over = true;
      clearInterval(timer);
      game.timeUp = left() <= 0;
      const best = h.stored(bestKey, 0);
      game.record = game.score > best && game.items.some((i) => i.ok);
      if (game.record) h.store(bestKey, game.score);
      summary();
    }

    // ------------------------------------------------------------ the summary
    function summary() {
      show('summary');
      const ok = game.items.filter((i) => i.ok).length, names = src.concepts();
      $('#ar-sum-title').textContent = game.timeUp ? t().over : t().ended;
      $('#ar-sum-score').textContent = t().total(game.score);
      $('#ar-sum-stats').textContent = t().stats(ok, game.items.length - ok) + (game.record ? t().record : '');
      $('#ar-sum-notes').innerHTML = game.notes.map((n) => `<li class="${n.kind}">${t()[n.kind](names[n.c])}</li>`).join('');
      $('#ar-sum-list').innerHTML = game.items.map((it, k) => {
        const { q } = question(it.kind, it.seed, it.difficulty);
        const mark = it.ok ? '✓' : '✗', state = it.skipped ? ` · ${t().skipped}` : it.unfinished ? ` · ${t().unfinished}` : '';
        const pts = it.points > 0 ? `+${it.points}` : it.points < 0 ? `−${-it.points}` : '0';
        return `<details class="ar-item ${it.ok ? 'ok' : 'bad'}" data-k="${k}"><summary><span class="mark">${mark}</span> ${k + 1}. ${q.title} ${stars(it.difficulty)} <span class="meta">${it.time} s · ${pts}${state}</span></summary><div class="ar-explain"></div></details>`;
      }).join('');
      animate($('#ar-summary'));
    }

    // The question, the answer chosen against the right one, and the explanation.
    function explain(det) {
      const it = game.items[Number(det.dataset.k)], { q } = question(it.kind, it.seed, it.difficulty);
      const chosen = it.chosen == null ? null : q.options[it.chosen], right = q.options.find((o) => o.correct);
      const why = chosen && !chosen.correct && chosen.why ? `<div class="why">${chosen.why}</div>` : '';
      const box = det.querySelector('.ar-explain');
      box.innerHTML = `${q.text}<div class="figs">${q.figure}</div><p><b>${t().question}:</b> ${q.ask}</p>` +
        `<table class="ar-answers"><tbody>` +
        `<tr class="${chosen ? (chosen.correct ? 'ok' : 'bad') : ''}"><th>${t().yours}</th><td>${chosen ? chosen.html : t().none}${why}</td></tr>` +
        `<tr><th>${t().correctV}</th><td>${right.html}</td></tr></tbody></table>` +
        `<h4>${t().explain}</h4>${q.explain()}`;
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
          cur = question(cur.kind, cur.seed, cur.difficulty);
          if (!game.locked) render(false);
          header();
          tick();
        } else summary();
      },
    };
  }

  // The markup of the arcade section, the same in every app: insert it with
  // document.querySelector('main').insertAdjacentHTML('beforeend', Arcade.HTML).
  const HTML = `
    <section id="arcade" class="card" hidden>
      <div id="ar-start">
        <h2 id="ar-start-title"></h2>
        <div id="ar-hero" class="ar-hero" aria-hidden="true"></div>
        <p id="ar-tag" class="ar-tag"></p>
        <details class="ar-more"><summary id="ar-more-sum"></summary><div id="ar-rules" class="steps"></div></details>
        <p id="ar-best" class="note"></p>
        <div class="actions"><button type="button" id="ar-go" class="primary"></button></div>
      </div>
      <div id="ar-play" hidden>
        <div class="ar-bar">
          <span id="ar-time" class="ar-time" aria-live="off"></span>
          <span id="ar-score" class="ar-score"></span>
          <span id="ar-level" class="ar-level"></span>
        </div>
        <div class="progress" aria-hidden="true"><div id="ar-tbar"></div></div>
        <p id="ar-toast" class="ar-toast" aria-live="polite"></p>
        <div id="ar-stage">
          <h2 id="ar-title"></h2>
          <div id="ar-prompt"></div>
          <div id="ar-figure" class="figs"></div>
          <p id="ar-ask" class="ar-ask"></p>
          <div id="ar-options" class="ar-options" role="group"></div>
        </div>
        <div class="actions ar-actions">
          <button type="button" id="ar-skip"></button>
          <button type="button" id="ar-quit"></button>
        </div>
      </div>
      <div id="ar-summary" hidden>
        <h2 id="ar-sum-title"></h2>
        <p id="ar-sum-score" class="ar-big"></p>
        <p id="ar-sum-stats"></p>
        <ul id="ar-sum-notes" class="ar-notes"></ul>
        <div id="ar-sum-list" class="ar-list"></div>
        <div class="actions"><button type="button" id="ar-again" class="primary"></button></div>
      </div>
    </section>`;

  root.Arcade = { create: createArcade, HTML, stars, starText };
})(window);
