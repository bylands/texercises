// Tutor mode: worked examples of increasing difficulty, explained step by step. Every step
// marks the parts of the circuit it talks about, and the diagram fills in the values found.
(function (root) {
  'use strict';

  const $ = (sel) => document.querySelector(sel);

  // Each example is solved along its path: frames of "quantity:rule" steps (see pathSteps in
  // generator.js), checked by test/check-generator.js.
  const EXAMPLES = [
    {
      name: 'Series', level: 'easy', seed: 12,
      idea: 'Two resistors in series share the battery voltage in the ratio of their resistances. Knowing the voltage across one resistor gives the current.',
      path: [['V1:vdiv'], ['I1:ohm', 'I:eqI']],
    },
    {
      name: 'Parallel', level: 'easy', seed: 54,
      idea: 'Two resistors in parallel both have the full battery voltage. The currents are shared in the inverse ratio of the resistances, and they add up to the total current.',
      path: [['V2:eqV', 'I2:ohm'], ['I1:iratio'], ['I:sumI']],
    },
    {
      name: 'Mixed', level: 'medium', seed: 35,
      idea: 'A resistor in series with a parallel pair. Replace the pair by one resistor, and the voltage divider rule gives the voltage across the pair.',
      path: [['R23:invR'], ['V23:vdiv', 'V3:eqV'], ['V1:sumV'], ['I1:ohm', 'I:eqI']],
    },
    {
      name: 'Backwards', level: 'medium', seed: 2,
      idea: 'Here a resistance is unknown, but two currents are measured. Start where enough is known, and work towards the unknowns.',
      path: [['I12:eqI'], ['I3:sumI'], ['V3:ohm'], ['V:eqV'], ['I2:eqI', 'V2:ohm'], ['V12:eqV', 'V1:sumV'], ['R1:ohm']],
    },
    {
      name: 'Nested', level: 'hard', seed: 22,
      idea: 'Groups inside groups. Name each group, share voltages with the divider rule, and follow the current from branch to branch.',
      path: [['V1:vratio'], ['V234:sumV'], ['V2:eqV'], ['I2:ohm'], ['I1:ohm'], ['I:eqI', 'I234:eqI', 'I34:sumI'],
        ['I3:eqI', 'V3:ohm'], ['V34:eqV', 'V4:sumV'], ['R4:vratio']],
    },
  ];
  if (typeof module !== 'undefined') module.exports = { EXAMPLES };
  if (typeof document === 'undefined') return;

  const { tutorial } = root.Generator;
  const { Circuit } = root;

  // helpers.math(el) typesets formulas, helpers.after() runs once a frame is shown, and
  // helpers.done() once the last example is finished.
  function createTutor(helpers) {
    let ex = 0, frame = 0, cache = [];

    const load = (i) => (cache[i] = cache[i] || tutorial(EXAMPLES[i].level, EXAMPLES[i].seed, EXAMPLES[i].path));

    function show() {
      const t = load(ex), f = t.frames[frame], last = frame === t.frames.length - 1;
      $('#t-title').textContent = `Example ${ex + 1} of ${EXAMPLES.length}: ${EXAMPLES[ex].name}`;
      $('#t-idea').textContent = EXAMPLES[ex].idea;
      $('#t-figure').innerHTML = f.figure;
      Circuit.fitText($('#t-figure svg'));
      $('#t-text').innerHTML = f.text;
      $('#t-count').textContent = `${frame + 1} / ${t.frames.length}`;
      $('#t-prev').disabled = frame === 0 && ex === 0;
      $('#t-prev').textContent = frame === 0 && ex > 0 ? '← Previous example' : '← Back';
      $('#t-next').textContent = !last ? 'Next →' : ex < EXAMPLES.length - 1 ? 'Next example →' : 'Practise on your own →';
      $('#t-bar').style.width = `${(100 * (frame + 1)) / t.frames.length}%`;
      document.querySelectorAll('input[name="example"]').forEach((r) => { r.checked = Number(r.value) === ex; });
      helpers.math($('#tutor'));
      helpers.after();
      const hash = `#tutor-${ex + 1}`;
      if (location.hash !== hash) history.replaceState(null, '', hash);
    }

    function open(i, atEnd) {
      ex = i;
      frame = atEnd ? load(i).frames.length - 1 : 0;
      show();
    }

    function next() {
      if (frame < load(ex).frames.length - 1) { frame++; show(); }
      else if (ex < EXAMPLES.length - 1) open(ex + 1);
      else helpers.done();
    }
    function prev() {
      if (frame > 0) { frame--; show(); }
      else if (ex > 0) open(ex - 1, true);
    }

    $('#examples').innerHTML = EXAMPLES.map((e, i) => `
      <label><input type="radio" name="example" value="${i}"><span>${i + 1} · ${e.name}</span></label>`).join('');
    $('#examples').addEventListener('change', (evt) => open(Number(evt.target.value)));
    $('#t-next').addEventListener('click', next);
    $('#t-prev').addEventListener('click', prev);
    document.addEventListener('keydown', (evt) => {
      if ($('#tutor').hidden || evt.altKey || evt.ctrlKey || evt.metaKey || /^(INPUT|TEXTAREA|SELECT)$/.test(evt.target.tagName) && evt.target.type !== 'radio') return;
      if (evt.key === 'ArrowRight') next();
      else if (evt.key === 'ArrowLeft') prev();
      else return;
      evt.preventDefault();
    });

    return { open, count: EXAMPLES.length, current: () => ex };
  }

  root.createTutor = createTutor;
})(typeof window !== 'undefined' ? window : globalThis);
