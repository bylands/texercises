// Shared by the teachingphysics.ch apps (canonical copy in shared/, copied by sync.sh).
// Practice by topic: each topic belongs to a worked example of the tutor and has stages, from
// exercises like the example to variations that add new ideas. Two exercises of a stage solved
// without looking at the solution (hints are fine) move practice on to the next stage; the student
// can also choose a stage, or all topics mixed. Within a stage, exercise types that were hard
// come up more often (practice.js).
//   const T = Topics.create({
//     app,                    the app's storage prefix
//     topics: [{ name(), stages: [{ name(), types: [type] }] }],   in the order of the tutor
//     make(type, seed),       an exercise of a type
//     typeOf(ex),             the type of an exercise
//     onChange(),             the student chose another topic or stage (start a new exercise)
//     tutor(i),               show worked example i (the link next to the stages)
//     keyOf(ex),              (optional) what makes an exercise new to the student; by default
//                             its title and text. Exercises without either never run out.
//   })
// When a step has no new exercises left (e.g. exercises with symbols only, which do not vary with
// numbers), a note says so and suggests moving on; the exercises then come round again.
//   T.mount(el)               the topic menu, the stages and the link to the worked example, in el
//   T.relabel()               the texts in the current language
//   T.next(last)              a new exercise of the current topic and stage, its id 'p3.2-seed'
//                             (topic 3, stage 2) or 'mix-seed'
//   T.parse(id)               the exercise of such an id (and its topic and stage chosen), or null
//   T.shown(ex)               an exercise is shown (for the link to its worked example); exercises
//                             of T.next and T.parse carry ptopic and pstage
//   T.solved(st)              the current exercise is solved; once per exercise (st.won), not after
//                             the solution was shown. Returns a text when the stage is done.
//   T.go(i)                   practise topic i (from the tutor), at the stage reached
//   T.also(i)                 HTML for the tutor: what the practice of example i covers
(function (root) {
  'use strict';

  const WINS = 2;
  const TX = {
    en: { topic: 'Topic', mixed: 'All topics (mixed)', stage: 'Step', worked: (i, n) => `Worked example ${i} · ${n}`, like: 'like the example',
      done: (n) => `Well done! Next step: ${n}.`, none: 'You have seen all the exercises of this step: move on to the next step or to another topic.', noneLast: 'You have seen all the exercises of this step: move on to another topic.', last: 'Well done! You have reached the last step of this topic; practise on, or choose another topic.', also: 'Practice:' },
    de: { topic: 'Thema', mixed: 'Alle Themen (gemischt)', stage: 'Schritt', worked: (i, n) => `Beispiel ${i} · ${n}`, like: 'wie im Beispiel',
      done: (n) => `Gut gemacht! Nächster Schritt: ${n}.`, none: 'Du hast alle Aufgaben dieses Schritts gesehen: Mach mit dem nächsten Schritt oder einem anderen Thema weiter.', noneLast: 'Du hast alle Aufgaben dieses Schritts gesehen: Mach mit einem anderen Thema weiter.', last: 'Gut gemacht! Du hast den letzten Schritt dieses Themas erreicht; übe weiter oder wähle ein anderes Thema.', also: 'Üben:' },
  };
  const tx = () => TX[root.Lang && root.Lang.get() === 'de' ? 'de' : 'en'];
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

  function create(o) {
    const key = (k) => `${o.app}-${k}`;
    const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(key(k))); return v == null ? d : v; } catch (e) { return d; } };
    const write = (k, v) => { try { localStorage.setItem(key(k), JSON.stringify(v)); } catch (e) { /* storage unavailable */ } };
    const all = [...new Set(o.topics.flatMap((t) => t.stages.flatMap((s) => s.types)))];
    const topicOfType = (type) => o.topics.findIndex((t) => t.stages.some((s) => s.types.includes(type)));
    // the current choice { topic (−1: mixed), stage }, and per topic the stage reached and the wins in it
    let cur = read('topic', { topic: 0, stage: 0 }), progress = read('progress', {}), el = null, shownTopic = 0;
    // the exercises seen in this session, per step ('topic.stage': Set of keys), and whether the
    // current step has run out of new ones
    const seen = new Map();
    let runOut = false;
    const keyOf = (ex) => (o.keyOf ? o.keyOf(ex) : (ex.title || ex.text || ex.situation) ? `${ex.title || ''}|${ex.text || ex.situation || ''}` : null);
    const seenHere = () => { const k = `${cur.topic}.${cur.stage}`; if (!seen.has(k)) seen.set(k, new Set()); return seen.get(k); };
    if (!(cur.topic >= -1 && cur.topic < o.topics.length)) cur = { topic: 0, stage: 0 };
    const stagesOf = (t) => (t < 0 ? [] : o.topics[t].stages);
    const reached = (t) => Math.min((progress[t] || {}).stage || 0, stagesOf(t).length - 1);
    const typesOf = (t, s) => (t < 0 ? all : stagesOf(t)[Math.min(s, stagesOf(t).length - 1)].types);
    const stageName = (t, s) => { const n = stagesOf(t)[s].name; return n ? n() : tx().like; };

    function exercise(t, s, seed) {
      const types = typesOf(t, s), type = types[seed % types.length];
      const ex = o.make(type, seed);
      ex.id = t < 0 ? `mix-${seed}` : `p${t + 1}.${s + 1}-${seed}`;
      ex.ptopic = t; ex.pstage = s; ex.seed = seed;
      return ex;
    }

    function render() {
      if (!el) return;
      const t = cur.topic, X = tx();
      const opts = o.topics.map((tp, i) => `<option value="${i}"${i === t ? ' selected' : ''}>${i + 1} · ${esc(tp.name())}</option>`).join('') +
        `<option value="-1"${t < 0 ? ' selected' : ''}>${X.mixed}</option>`;
      const stages = stagesOf(t).length > 1 ? `<div class="levels small stages" role="radiogroup" aria-label="${X.stage}">${stagesOf(t).map((s, i) =>
        `<label><input type="radio" name="stage" value="${i}"${i === cur.stage ? ' checked' : ''}><span>${i < reached(t) ? '✓ ' : ''}${i + 1} · ${esc(stageName(t, i))}</span></label>`).join('')}</div>` : '';
      const w = t < 0 ? shownTopic : t;
      const last = t < 0 || cur.stage >= stagesOf(t).length - 1;
      el.innerHTML = `<label class="topic-pick"><span>${X.topic}</span><select id="topic-pick">${opts}</select></label>${stages}` +
        (w >= 0 && o.tutor ? `<button type="button" class="linklike worked">📖 ${esc(X.worked(w + 1, o.topics[w].name()))}</button>` : '') +
        (runOut ? `<p class="topic-note">${last ? X.noneLast : X.none}</p>` : '');
    }

    function choose(t, s) {
      cur = { topic: t, stage: t < 0 ? 0 : Math.max(0, Math.min(s, stagesOf(t).length - 1)) };
      runOut = false;
      write('topic', cur);
      render();
    }

    const T = {
      mount(element) {
        el = element;
        el.className = 'topics practice';
        el.removeAttribute('role');
        el.addEventListener('change', (evt) => {
          if (evt.target.id === 'topic-pick') { const t = Number(evt.target.value); choose(t, t < 0 ? 0 : reached(t)); } else if (evt.target.name === 'stage') choose(cur.topic, Number(evt.target.value));
          else return;
          o.onChange();
        });
        el.addEventListener('click', (evt) => { if (evt.target.closest('.worked')) o.tutor(cur.topic < 0 ? shownTopic : cur.topic); });
        render();
      },
      relabel: render,
      state: () => ({ ...cur }),
      // a new exercise, one not seen yet in this session if there is one
      next(last) {
        const t = cur.topic, s = cur.stage, was = runOut, here = seenHere();
        let ex = null, fresh = false;
        for (let k = 0; k < 25 && !fresh; k++) {
          ex = Practice.next(o.app, (seed) => exercise(t, s, seed), (e) => o.typeOf(e), last ? o.typeOf(last) : null);
          const key = keyOf(ex);
          fresh = key == null || !here.has(key);
        }
        if (!fresh) here.clear(); // all seen: they come round again
        const key = keyOf(ex);
        if (key != null) here.add(key);
        runOut = runOut || !fresh; // the note stays until another topic or step is chosen
        if (runOut !== was) render();
        return ex;
      },
      parse(id) {
        let m = /^p(\d+)\.(\d+)-(\d+)$/.exec(id);
        if (m) {
          const t = Number(m[1]) - 1, s = Number(m[2]) - 1;
          if (t < 0 || t >= o.topics.length || s < 0 || s >= stagesOf(t).length) return null;
          if (cur.topic !== t || cur.stage !== s) choose(t, s);
          return exercise(t, s, Number(m[3]));
        }
        m = /^mix-(\d+)$/.exec(id);
        if (m) { if (cur.topic !== -1) choose(-1, 0); return exercise(-1, 0, Number(m[1])); }
        return null;
      },
      shown(ex) {
        const t = ex && ex.ptopic >= 0 ? ex.ptopic : topicOfType(o.typeOf(ex));
        if (t !== shownTopic) { shownTopic = Math.max(0, t); if (cur.topic < 0) render(); }
      },
      solved(st, ex) {
        if (!st || st.won || st.revealed || !ex || !(ex.ptopic >= 0)) return '';
        st.won = true;
        const t = ex.ptopic, p = progress[t] || { stage: 0, wins: 0 };
        if (ex.pstage !== p.stage) return ''; // practising an earlier stage again, or one ahead
        p.wins = (p.wins || 0) + 1;
        let msg = '';
        if (p.wins >= WINS) {
          if (p.stage < stagesOf(t).length - 1) {
            p.stage++; p.wins = 0;
            if (cur.topic === t) cur.stage = p.stage;
            write('topic', cur);
            msg = tx().done(`${p.stage + 1} · ${stageName(t, p.stage)}`);
          } else if (p.wins === WINS) msg = tx().last;
        }
        progress[t] = p;
        write('progress', progress);
        render();
        return msg;
      },
      go(i) { choose(i, reached(i)); },
      also(i) {
        const st = o.topics[i].stages;
        if (st.length < 2) return '';
        return `${tx().also} ${st.map((s, k) => `${k + 1} · ${esc(stageName(i, k))}`).join(', ')}.`;
      },
      count: () => o.topics.length,
    };
    return T;
  }

  root.Topics = { create };
})(window);
