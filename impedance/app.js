(function () {
  'use strict';

  const I = window.Impedance, P = window.Plot;
  const $ = (sel) => document.querySelector(sel);
  const MAX_TRIES = 3;
  const NAME = { series: 'Series', parallel: 'Parallel' };

  let ex = null, st = null, probe = null, tutor = null;

  // ---------------------------------------------------------------- persistence
  function stored(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; }
  }
  function store(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
  }
  function showScore() {
    const s = stored('imp-score', { solved: 0, clean: 0 });
    $('#score').textContent = s.solved ? `Solved: ${s.solved} · first try without hints: ${s.clean}` : '';
  }

  function math(el) {
    if (window.renderMathInElement) {
      window.renderMathInElement(el, {
        delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }],
        throwOnError: false,
      });
    }
  }

  const axesMode = () => (document.querySelector('input[name="axes"]:checked') || {}).value || 'lin';
  const figure = (c, ax, ann) => `<div class="fig">${P.schematic(c)}</div><div class="fig gwrap">${P.graph(c, ax, axesMode(), { ann })}</div>`;
  const and = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
  const list = (items) => `<ul>${items.map((x) => `<li>${x}</li>`).join('')}</ul>`;

  // ---------------------------------------------------------------- hints and solution
  // From the worked analysis (generator.js): what the graph does → which feature gives which
  // value → the formulas → the readings to check.
  function hints() {
    const an = ex.an, ks = I.UNKNOWNS[ex.c.kind];
    return [
      `${I.shape(ex.c)} ${an.intro}`,
      'Which feature of the graph gives which value:' + list(ks.map((k) => `<i>${k}</i>: ${an.plan[k]}`)),
      'Formulas:' + list(ks.map((k) => `$${an.formulas[k]}$`)) + 'The probe shows the slope of the tangent in Ω·s; since ω is in rad/s, 1 Ω·s = 1 H.',
      'Readings to check yours against:' + list(ks.map((k) => `<i>${k}</i>: ${an.readings[k]}`)),
    ];
  }

  function results() {
    const ks = I.UNKNOWNS[ex.c.kind];
    const unit = { R: 'ohm', L: 'H', C: 'F' };
    const est = ks.map((k) => `<i>${k}</i> ≈ ${I.H(ex.an.est[k], unit[k])}`).join(', ');
    const exact = ks.map((k) => `<i>${k}</i> = ${I.H(ex.c[k], unit[k])}`).join(', ');
    return `Read from the graph: ${est}. The graph was drawn with ${exact}.`;
  }

  // ---------------------------------------------------------------- input and feedback
  function parse(s) {
    s = s.trim().replace(/,/g, '.').replace(/−/g, '-').replace(/[^\d.)]+$/, '').trim();
    const m = s.match(/^([-+]?\d*\.?\d+(?:e[-+]?\d+)?)$/i);
    return m ? Number(m[1]) : NaN;
  }

  function judge(f, x) {
    const code = I.diagnose(ex, f.key, x);
    const msg = {
      ok: 'Correct',
      nan: 'Enter a number',
      sign: 'Enter a positive value',
      omega0: 'Use the square of ω₀: C = 1/(ω₀²L)',
      '2pi': 'Off by a factor 2π: ω is the angular frequency in rad/s, not the frequency f in Hz',
      prefix: `Off by a factor 1000: give ${f.sym} in ${f.unit}`,
      sqrt2: 'Off by a factor √2 or 2: check where the √2 belongs',
      close: 'Close: read the graph more precisely (use the probe and the tangent)',
      wrong: 'Not correct',
    }[code];
    const cls = code === 'ok' ? 'ok' : code === 'close' || code === 'prefix' || code === 'nan' ? 'warn' : 'bad';
    return { cls, msg };
  }

  // ---------------------------------------------------------------- exercise lifecycle
  const newSeed = () => 1 + Math.floor(Math.random() * 999999);
  const filter = () => (document.querySelector('input[name="filter"]:checked') || {}).value || 'mixed';

  function open(exercise) {
    ex = exercise;
    ex.hints = hints();
    st = { tries: 0, hints: 0, solved: false, revealed: false };
    const hash = `#${ex.id}`;
    if (location.hash !== hash) history.replaceState(null, '', hash);
    render();
  }

  function fresh() { open(I.generate(filter(), newSeed())); }

  // Narrow screens get a smaller drawing; redraw when that changes.
  const narrow = () => document.querySelector('main').clientWidth < 600;
  function relayout() {
    if ((P.W < 640) === narrow()) return;
    P.setNarrow(narrow());
    if (ex) drawGraph();
    if (ex && st.revealed) drawSolution();
    if (tutor.shown()) tutor.refresh();
  }

  function drawGraph() {
    $('#graph').innerHTML = P.graph(ex.c, ex.ax, axesMode());
    probe.draw();
  }

  function render() {
    const c = ex.c, ks = I.UNKNOWNS[c.kind];
    $('#title').textContent = `${NAME[c.conn]} ${c.kind} circuit`;
    $('#prompt').innerHTML = `The graph shows the impedance <i>Z</i> of the circuit against the angular frequency <i>ω</i>. Find ${and(ks.map((k) => `<i>${k}</i>`))} from the features of the graph.`;
    $('#schematic').innerHTML = P.schematic(c);
    probe.reset();
    drawGraph();
    $('#fields').innerHTML = ex.fields.map((f) => `
      <div class="field" data-key="${f.key}">
        <label for="in-${f.key}" class="sym"><i>${f.sym}</i>&nbsp;=</label>
        <input id="in-${f.key}" type="text" inputmode="decimal" autocomplete="off" spellcheck="false">
        <span class="unit">${f.unit}</span>
        <span class="fb" aria-live="polite"></span>
      </div>`).join('');
    $('#hint-list').innerHTML = '';
    $('#hints').hidden = true;
    $('#solution').hidden = true;
    $('#status').textContent = '';
    $('#status').className = 'status';
    updateButtons();
  }

  const canReveal = () => st.solved || st.tries >= MAX_TRIES || st.hints >= ex.hints.length;

  function updateButtons() {
    const left = ex.hints.length - st.hints;
    const hb = $('#hint');
    hb.disabled = left === 0 || st.revealed;
    hb.textContent = left ? `Hint (${left} left)` : 'No more hints';
    const rb = $('#reveal');
    rb.disabled = !canReveal() || st.revealed;
    rb.title = canReveal() ? '' : `Unlocks after all hints or ${MAX_TRIES} attempts`;
    $('#reveal-note').hidden = canReveal() || st.revealed;
  }

  function check(evt) {
    evt.preventDefault();
    let allOk = true, anyEmpty = false;
    for (const f of ex.fields) {
      const row = document.querySelector(`.field[data-key="${f.key}"]`);
      const raw = row.querySelector('input').value;
      if (!raw.trim()) anyEmpty = true;
      const r = judge(f, parse(raw));
      row.className = `field ${r.cls}`;
      row.querySelector('.fb').textContent = r.msg;
      if (r.cls !== 'ok') allOk = false;
    }
    const status = $('#status');
    if (anyEmpty && !allOk) {
      status.textContent = 'Fill in all fields, then check again.';
      status.className = 'status';
      return;
    }
    st.tries++;
    if (allOk) {
      if (!st.solved && !st.revealed) {
        const s = stored('imp-score', { solved: 0, clean: 0 });
        s.solved++;
        if (st.tries === 1 && st.hints === 0) s.clean++;
        store('imp-score', s);
        showScore();
      }
      st.solved = true;
      status.textContent = st.revealed ? 'All correct.' : 'All correct, well done! Compare your approach with the worked solution, or start a new exercise.';
      status.className = 'status ok';
    } else {
      const more = !canReveal() ? ' Try again, or take a hint.' : ' You can take a hint or look at the worked solution.';
      status.textContent = `Not quite yet (attempt ${st.tries}).${more}`;
      status.className = 'status bad';
    }
    updateButtons();
  }

  function hint() {
    if (st.hints >= ex.hints.length) return;
    const li = document.createElement('li');
    li.innerHTML = ex.hints[st.hints];
    $('#hint-list').appendChild(li);
    math(li);
    st.hints++;
    $('#hints').hidden = false;
    updateButtons();
    li.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function drawSolution() {
    $('#sol-figure').innerHTML = figure(ex.c, ex.ax, ex.an.steps.flatMap((s) => s.ann));
  }
  function reveal() {
    if (!canReveal()) return;
    st.revealed = true;
    drawSolution();
    $('#sol-steps').innerHTML = `<p>${ex.an.intro}</p>` + ex.an.steps.map((s) => `<h4>${s.title}</h4><p>${s.text}</p>`).join('');
    $('#sol-short').innerHTML = results();
    const sec = $('#solution');
    sec.hidden = false;
    math(sec);
    updateButtons();
    sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---------------------------------------------------------------- modes
  // Practice: random exercises; tutor: worked examples. Hints and solution belong to practice.
  const mode = () => (document.querySelector('input[name="mode"]:checked') || {}).value || 'practice';
  function setMode(m) {
    document.querySelector(`input[name="mode"][value="${m}"]`).checked = true;
    store('imp-mode', m);
    document.querySelectorAll('.practice').forEach((el) => { el.hidden = m !== 'practice'; });
    $('#tutor').hidden = m !== 'tutor';
    if (m === 'tutor') { $('#hints').hidden = true; $('#solution').hidden = true; }
  }
  function practise() {
    setMode('practice');
    if (ex) { history.replaceState(null, '', `#${ex.id}`); $('#hints').hidden = !st.hints; $('#solution').hidden = !st.revealed; } else fresh();
  }

  function fromHash() {
    const h = location.hash.slice(1);
    let m = h.match(/^tutor-(\d+)$/);
    if (m && Number(m[1]) >= 1 && Number(m[1]) <= tutor.count) {
      setMode('tutor');
      if (tutor.current() !== Number(m[1]) - 1 || !tutor.shown()) tutor.open(Number(m[1]) - 1);
      return true;
    }
    m = h.match(/^(mixed|RL|RC|RLC)-(\d+)$/);
    if (m) {
      setMode('practice');
      document.querySelector(`input[name="filter"][value="${m[1]}"]`).checked = true;
      if (!ex || ex.id !== h) open(I.generate(m[1], Number(m[2])));
      return true;
    }
    return false;
  }

  // Tutor examples: an overview frame, then one frame per step of the analysis.
  function lesson(e) {
    const c = e.circuit, ax = I.axesFor(c);
    return {
      ...e,
      frames: () => {
        const an = I.analysis(c, ax);
        const first = {
          text: `<div class="step-rule">The circuit</div><p>${an.intro}</p><p>${I.shape(c)}</p>`,
          get figure() { return figure(c, ax, []); },
        };
        return [first, ...an.steps.map((s) => ({
          text: `<div class="step-rule">${s.title}</div><p>${s.text}</p>`,
          get figure() { return figure(c, ax, s.ann); },
        }))];
      },
    };
  }

  // ---------------------------------------------------------------- init
  function init() {
    const savedFilter = stored('imp-filter', 'mixed');
    $('#filters').innerHTML = Object.entries(I.FILTERS).map(([k, name]) => `
      <label><input type="radio" name="filter" value="${k}"${k === savedFilter ? ' checked' : ''}><span>${name}</span></label>`).join('');
    document.querySelector(`input[name="axes"][value="${stored('imp-axes', 'lin')}"]`).checked = true;

    probe = window.createProbe($('#graph'), () => ({ c: ex.c, ax: ex.ax, mode: axesMode() }), $('#readout'), $('#pins'));
    $('#filters').addEventListener('change', () => { store('imp-filter', filter()); fresh(); });
    $('#axes').addEventListener('change', () => {
      store('imp-axes', axesMode());
      if (ex) drawGraph();
      if (ex && st.revealed) drawSolution();
      if (tutor.shown()) tutor.refresh();
    });
    $('#new').addEventListener('click', fresh);
    $('#answers').addEventListener('submit', check);
    $('#hint').addEventListener('click', hint);
    $('#reveal').addEventListener('click', reveal);
    window.addEventListener('hashchange', fromHash);
    window.addEventListener('resize', relayout);
    P.setNarrow(narrow());

    tutor = window.createTutor(window.Lessons.EXAMPLES.map(lesson), { after: () => math($('#tutor')), done: practise });
    $('#modes').addEventListener('change', () => {
      if (mode() === 'tutor') { setMode('tutor'); tutor.open(tutor.current()); } else practise();
    });
    showScore();
    if (fromHash()) return;
    // First visit: start with the first worked example.
    if (stored('imp-mode', 'tutor') === 'tutor') { setMode('tutor'); tutor.open(0); } else { setMode('practice'); fresh(); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
