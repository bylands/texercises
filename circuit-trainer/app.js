(function () {
  'use strict';

  const { LEVELS, generate } = window.Generator;
  const { esc } = window.Circuit;
  const $ = (sel) => document.querySelector(sel);
  const MAX_TRIES = 3;

  // An exercise is { id, title, text, fields: [{key, sym, unit, value}], tol, figure(sol),
  // hints: [html], solution: [html], results: html }.
  let ex = null;
  let st = null;

  // ---------------------------------------------------------------- persistence
  function stored(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; }
  }
  function store(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
  }
  function showScore() {
    const s = stored('rc-score', { solved: 0, clean: 0 });
    $('#score').textContent = s.solved ? `Solved: ${s.solved} · first try without hints: ${s.clean}` : '';
  }

  function math(el) {
    if (window.renderMathInElement) {
      window.renderMathInElement(el, {
        delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }],
        throwOnError: false,
        // \htmlClass marks the results (highlighted in style.css).
        trust: (ctx) => ctx.command === '\\htmlClass',
        strict: (code) => (code === 'htmlExtension' ? 'ignore' : 'warn'),
      });
    }
  }

  // Wide circuits scroll horizontally on small screens; say so, since the cut-off part is invisible.
  function markScrollable() {
    document.querySelectorAll('.fig').forEach((fig) => {
      fig.classList.toggle('scrolls', fig.scrollWidth > fig.clientWidth + 1);
    });
  }

  // ---------------------------------------------------------------- input and feedback
  function parse(s) {
    s = s.trim().replace(/,/g, '.').replace(/[^\d.)]+$/, '').trim();
    const m = s.match(/^([-+]?\d*\.?\d+(?:e[-+]?\d+)?)(?:\s*\/\s*(\d*\.?\d+))?$/i);
    if (!m) return NaN;
    return m[2] ? Number(m[1]) / Number(m[2]) : Number(m[1]);
  }

  function judge(x, e, tol) {
    if (Number.isNaN(x)) return { cls: 'bad', msg: 'Enter a number' };
    const off = (y) => Math.abs(y - e) / Math.abs(e);
    if (off(x) <= tol) return { cls: 'ok', msg: 'Correct' };
    if (off(-x) <= tol) return { cls: 'warn', msg: 'Wrong sign: check the direction' };
    if (off(x / 1000) <= tol || off(x * 1000) <= tol) return { cls: 'warn', msg: 'Off by a factor of 1000: check the unit prefix' };
    if (off(x) <= Math.max(0.05, 2 * tol)) return { cls: 'warn', msg: 'Close: check your rounding' };
    return { cls: 'bad', msg: 'Not correct' };
  }

  // ---------------------------------------------------------------- exercise lifecycle
  const newSeed = () => 1 + Math.floor(Math.random() * 999999);
  const level = () => (document.querySelector('input[name="level"]:checked') || {}).value || 'medium';
  const mode = () => (document.querySelector('input[name="mode"]:checked') || {}).value || 'practice';
  let tutor = null;

  // Practice: random exercises; tutor: worked examples. Hints and solution belong to practice.
  function setMode(m) {
    document.querySelector(`input[name="mode"][value="${m}"]`).checked = true;
    store('rc-mode', m);
    document.querySelectorAll('.practice').forEach((el) => { el.hidden = m !== 'practice'; });
    $('#tutor').hidden = m !== 'tutor';
    if (m === 'tutor') { $('#hints').hidden = true; $('#solution').hidden = true; }
  }
  function practise() {
    setMode('practice');
    if (ex) { history.replaceState(null, '', `#${ex.id}`); render(); } else fresh();
  }

  function open(exercise) {
    ex = exercise;
    st = { tries: 0, hints: 0, solved: false, revealed: false };
    const hash = `#${ex.id}`;
    if (location.hash !== hash) history.replaceState(null, '', hash);
    render();
  }

  function fresh() { open(generate(level(), newSeed())); }

  function render() {
    $('#title').textContent = ex.title;
    $('#prompt').innerHTML = ex.text;
    $('#figure').innerHTML = ex.figure(false);
    $('#fields').innerHTML = ex.fields.map((f) => `
      <div class="field" data-key="${f.key}">
        <label for="in-${f.key}" class="sym">$${f.sym}$&nbsp;=</label>
        <input id="in-${f.key}" type="text" inputmode="decimal" autocomplete="off" spellcheck="false">
        <span class="unit">${esc(f.unit)}</span>
        <span class="fb" aria-live="polite"></span>
      </div>`).join('');
    $('#hint-list').innerHTML = '';
    $('#hints').hidden = true;
    $('#solution').hidden = true;
    $('#status').textContent = '';
    $('#status').className = 'status';
    math($('#task'));
    markScrollable();
    updateButtons();
    $(`#in-${ex.fields[0].key}`).focus({ preventScroll: true });
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
      const r = judge(parse(raw), f.value, ex.tol);
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
        const s = stored('rc-score', { solved: 0, clean: 0 });
        s.solved++;
        if (st.tries === 1 && st.hints === 0) s.clean++;
        store('rc-score', s);
        showScore();
      }
      st.solved = true;
      status.textContent = st.revealed ? 'All correct.' : 'All correct, well done! Compare your approach with the worked solution, or start a new exercise.';
      status.className = 'status ok';
    } else {
      const more = st.tries < MAX_TRIES && !canReveal() ? ' Try again, or take a hint.' : ' You can take a hint or look at the worked solution.';
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

  function reveal() {
    if (!canReveal()) return;
    st.revealed = true;
    $('#sol-figure').innerHTML = ex.figure(true);
    $('#sol-steps').innerHTML = ex.solution.map((p) => `<p>${p}</p>`).join('');
    $('#sol-short').innerHTML = 'Results: ' + ex.results;
    const sec = $('#solution');
    sec.hidden = false;
    math(sec);
    markScrollable();
    updateButtons();
    sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function fromHash() {
    const h = location.hash.slice(1);
    let m = h.match(/^tutor-(\d+)$/);
    if (m && Number(m[1]) >= 1 && Number(m[1]) <= tutor.count) {
      setMode('tutor');
      if (tutor.current() !== Number(m[1]) - 1 || !$('#t-title').textContent) tutor.open(Number(m[1]) - 1);
      return true;
    }
    m = h.match(/^(easy|medium|hard)-(\d+)$/);
    if (m) {
      setMode('practice');
      document.querySelector(`input[name="level"][value="${m[1]}"]`).checked = true;
      open(generate(m[1], Number(m[2])));
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------- init
  function init() {
    const saved = stored('rc-level', 'medium');
    $('#levels').innerHTML = Object.entries(LEVELS).map(([k, lv]) => `
      <label><input type="radio" name="level" value="${k}"${k === saved ? ' checked' : ''}><span>${esc(lv.name)}</span></label>`).join('');
    $('#levels').addEventListener('change', () => { store('rc-level', level()); fresh(); });
    $('#new').addEventListener('click', fresh);
    $('#answers').addEventListener('submit', check);
    $('#hint').addEventListener('click', hint);
    $('#reveal').addEventListener('click', reveal);
    window.addEventListener('hashchange', fromHash);
    window.addEventListener('resize', markScrollable);
    tutor = window.createTutor({ math, after: markScrollable, done: practise });
    $('#modes').addEventListener('change', () => {
      if (mode() === 'tutor') { setMode('tutor'); tutor.open(tutor.current()); } else practise();
    });
    showScore();
    if (fromHash()) return;
    // First visit: start with the first worked example.
    if (stored('rc-mode', 'tutor') === 'tutor') { setMode('tutor'); tutor.open(0); } else { setMode('practice'); fresh(); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
