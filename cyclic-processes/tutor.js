// Shared by the learningphysics.ch apps (canonical copy in shared/, copied by sync.sh).
// Tutor mode: worked examples of increasing difficulty, explained step by step. The app gives
// the examples as { name, idea, frames() }, where frames() returns [{ text, figure }] (HTML);
// every frame marks in its figure what the text talks about. A frame's figure may be a getter,
// so that refresh() can redraw it (e.g. after switching between linear and log-log axes).
// The button texts follow the page language (see lang.js; helpers.t may give others); relabel(examples)
// swaps in the same examples in another language and stays on the current frame.
// An example may say what its practice covers (also: HTML, shown under its idea); with
// helpers.practise(i), the last frame of each example has a button to practise example i's topic
// (on the last example, the final button does that).
(function (root) {
  'use strict';

  const $ = (sel) => document.querySelector(sel);

  const TEXTS = {
    en: { example: (i, n) => `Example ${i} of ${n}`, back: '← Back', prevEx: '← Previous example', next: 'Next →', nextEx: 'Next example →', done: 'Practise on your own →', practise: 'Practise this →' },
    de: { example: (i, n) => `Beispiel ${i} von ${n}`, back: '← Zurück', prevEx: '← Vorheriges Beispiel', next: 'Weiter →', nextEx: 'Nächstes Beispiel →', done: 'Selbst üben →', practise: 'Dies üben →' },
  };

  // helpers.after() runs once a frame is shown, helpers.done() once the last example is finished.
  function createTutor(examples, helpers) {
    let ex = 0, frame = 0;
    let cache = [];
    const lang = () => TEXTS[root.Lang ? root.Lang.get() : 'en'];
    const t = () => ({ ...lang(), ...(helpers.t ? helpers.t() : {}) });
    // the line on what the practice covers, under the idea, and the button to practise
    if (!$('#t-also')) $('#t-idea').insertAdjacentHTML('afterend', '<p id="t-also" class="note also" hidden></p>');
    if (helpers.practise && !$('#t-practise')) $('#t-next').insertAdjacentHTML('beforebegin', '<button type="button" id="t-practise" class="new-btn" hidden></button>');
    const load = (i) => (cache[i] = cache[i] || examples[i].frames());

    function show() {
      const frames = load(ex), f = frames[frame], last = frame === frames.length - 1;
      $('#t-title').textContent = `${t().example(ex + 1, examples.length)}: ${examples[ex].name}`;
      $('#t-idea').innerHTML = examples[ex].idea;
      $('#t-also').innerHTML = examples[ex].also || '';
      $('#t-also').hidden = !examples[ex].also;
      if ($('#t-practise')) {
        $('#t-practise').hidden = !last || ex === examples.length - 1;
        $('#t-practise').textContent = t().practise;
      }
      $('#t-figure').innerHTML = f.figure;
      $('#t-text').innerHTML = f.text;
      $('#t-count').textContent = `${frame + 1} / ${frames.length}`;
      $('#t-prev').disabled = frame === 0 && ex === 0;
      $('#t-prev').textContent = frame === 0 && ex > 0 ? t().prevEx : t().back;
      $('#t-next').textContent = !last ? t().next : ex < examples.length - 1 ? t().nextEx : t().done;
      $('#t-bar').style.width = `${(100 * (frame + 1)) / frames.length}%`;
      document.querySelectorAll('input[name="example"]').forEach((r) => { r.checked = Number(r.value) === ex; });
      if (helpers.after) helpers.after();
      const hash = `#tutor-${ex + 1}`;
      if (location.hash !== hash) history.replaceState(null, '', hash);
    }

    function open(i, atEnd) {
      ex = i;
      frame = atEnd ? load(i).length - 1 : 0;
      show();
    }
    function next() {
      if (frame < load(ex).length - 1) { frame++; show(); }
      else if (ex < examples.length - 1) open(ex + 1);
      else if (helpers.practise) helpers.practise(ex);
      else helpers.done();
    }
    function prev() {
      if (frame > 0) { frame--; show(); }
      else if (ex > 0) open(ex - 1, true);
    }

    const buttons = () => {
      $('#examples').innerHTML = examples.map((e, i) => `
        <label><input type="radio" name="example" value="${i}"${i === ex ? ' checked' : ''}><span>${i + 1} · ${e.name}</span></label>`).join('');
    };
    buttons();
    $('#examples').addEventListener('change', (evt) => open(Number(evt.target.value)));
    $('#t-next').addEventListener('click', next);
    if ($('#t-practise')) $('#t-practise').addEventListener('click', () => helpers.practise(ex));
    $('#t-prev').addEventListener('click', prev);
    document.addEventListener('keydown', (evt) => {
      const el = evt.target;
      if ($('#tutor').hidden || evt.altKey || evt.ctrlKey || evt.metaKey) return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) && el.type !== 'radio') return;
      if (el.closest && el.closest('svg[tabindex]')) return; // a graph that uses the arrow keys itself
      if (evt.key === 'ArrowRight') next();
      else if (evt.key === 'ArrowLeft') prev();
      else return;
      evt.preventDefault();
    });

    function relabel(list) {
      examples = list;
      cache = [];
      buttons();
      if ($('#t-title').textContent) show();
    }

    return { open, refresh: show, relabel, count: examples.length, current: () => ex, shown: () => !!$('#t-title').textContent };
  }

  root.createTutor = createTutor;
})(window);
