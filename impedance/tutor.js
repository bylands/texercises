// Tutor mode: worked examples of increasing difficulty, explained step by step. The app gives
// the examples as { name, idea, frames() }, where frames() returns [{ text, figure }] (HTML);
// every frame marks in its figure what the text talks about. A frame's figure may be a getter,
// so that refresh() can redraw it (e.g. after switching between linear and log-log axes).
(function (root) {
  'use strict';

  const $ = (sel) => document.querySelector(sel);

  // helpers.after() runs once a frame is shown, helpers.done() once the last example is finished.
  function createTutor(examples, helpers) {
    let ex = 0, frame = 0;
    const cache = [];
    const load = (i) => (cache[i] = cache[i] || examples[i].frames());

    function show() {
      const frames = load(ex), f = frames[frame], last = frame === frames.length - 1;
      $('#t-title').textContent = `Example ${ex + 1} of ${examples.length}: ${examples[ex].name}`;
      $('#t-idea').innerHTML = examples[ex].idea;
      $('#t-figure').innerHTML = f.figure;
      $('#t-text').innerHTML = f.text;
      $('#t-count').textContent = `${frame + 1} / ${frames.length}`;
      $('#t-prev').disabled = frame === 0 && ex === 0;
      $('#t-prev').textContent = frame === 0 && ex > 0 ? '← Previous example' : '← Back';
      $('#t-next').textContent = !last ? 'Next →' : ex < examples.length - 1 ? 'Next example →' : 'Practise on your own →';
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
      else helpers.done();
    }
    function prev() {
      if (frame > 0) { frame--; show(); }
      else if (ex > 0) open(ex - 1, true);
    }

    $('#examples').innerHTML = examples.map((e, i) => `
      <label><input type="radio" name="example" value="${i}"><span>${i + 1} · ${e.name}</span></label>`).join('');
    $('#examples').addEventListener('change', (evt) => open(Number(evt.target.value)));
    $('#t-next').addEventListener('click', next);
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

    return { open, refresh: show, count: examples.length, current: () => ex, shown: () => !!$('#t-title').textContent };
  }

  root.createTutor = createTutor;
})(window);
