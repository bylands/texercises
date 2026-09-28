(function () {
  'use strict';

  const { FLUX, generate, diagnose, curved } = window.Induction;
  const { fluxGraph, voltGraph, num, range } = window.Plot;
  const $ = (sel) => document.querySelector(sel);
  const MAX_TRIES = 3;
  const PHI = '<i>Φ</i>', V = '<i>V</i><sub>ind</sub>';

  let ex = null;
  // pairs: flux id → voltage id; sel: the card waiting for a partner; marks: flux id → 'ok' | 'bad'
  let st = null;

  // ---------------------------------------------------------------- persistence
  function stored(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; }
  }
  function store(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
  }
  function showScore() {
    const s = stored('im-score', { solved: 0, clean: 0 });
    $('#score').textContent = s.solved ? `Solved: ${s.solved} · first try without hints: ${s.clean}` : '';
  }

  // ---------------------------------------------------------------- hints and solution
  const DPHI = `d${PHI}/d<i>t</i>`;
  const mirrors = () => {
    const out = [];
    ex.flux.forEach((a, i) => ex.flux.slice(i + 1).forEach((b) => {
      if (a.segs.every((s, k) => s.d0 === -b.segs[k].d0 && s.d1 === -b.segs[k].d1)) out.push([a.id, b.id]);
    }));
    return out;
  };
  const between = (i) => `between ${ex.times[i]} s and ${ex.times[i + 1]} s`;

  // Worked example for one interval of graph A: a curved one if there is one, else a sloped one.
  function example() {
    const f = ex.flux[0];
    let i = f.segs.findIndex(curved);
    if (i >= 0) {
      const sg = f.segs[i];
      return `Example: in graph ${f.id}, the slope of ${PHI} changes steadily from ${num(sg.d0)} mWb/s to ${num(sg.d1)} mWb/s ${between(i)}. So ${V} changes steadily from ${num(-sg.d0)} mV to ${num(-sg.d1)} mV: a sloping straight line.`;
    }
    i = f.segs.findIndex((sg) => sg.d0 !== 0);
    const dt = ex.times[i + 1] - ex.times[i], dp = f.values[i + 1] - f.values[i];
    return `Example: in graph ${f.id}, ${PHI} changes from ${f.values[i]} mWb to ${f.values[i + 1]} mWb ${between(i)}, so ${V} = −(${num(dp)} mWb)/(${dt} s) = ${num(-dp / dt)} mV in this interval.`;
  }

  function hints() {
    const [a, b] = mirrors()[0];
    return [
      `The induced voltage only depends on how fast the flux changes: ${V} = −${DPHI}, the slope of the ${PHI}(<i>t</i>) graph with the opposite sign. The value of ${PHI} itself does not matter.`,
      `Where a flux graph is horizontal, ${V} = 0. Where ${PHI} increases, ${V} is negative; where it decreases, ${V} is positive. A steeper graph gives a larger voltage.`,
      `Where a flux graph is curved, its slope changes steadily, so the voltage graph is a sloping straight line there. At a peak or a valley of ${PHI}, ${V} passes through zero.`,
      `Flux graphs ${a} and ${b} are mirror images of each other, so their voltage graphs are mirror images too.`,
      example(),
    ];
  }

  function solution() {
    const list = (segs, k0, k1, unit) => segs.map((sg) => range(sg[k0], sg[k1])).join('; ') + ' ' + unit;
    const rows = ex.flux.map((f) => {
      const u = ex.volt.find((v) => v.id === ex.answer[f.id]);
      return `<li><b>${f.id} ↔ ${u.id}</b>: slopes of ${PHI}: ${list(f.segs, 'd0', 'd1', 'mWb/s')}, so ${V}: ${list(u.segs, 'v0', 'v1', 'mV')}.</li>`;
    });
    const [a, b] = mirrors()[0];
    return `<p>In each interval, the induced voltage is the slope of the flux graph with the opposite sign, ${V} = −${DPHI}. Where ${PHI} is a straight line, ${V} is constant. Where ${PHI} is curved, its slope changes steadily, so ${V} is a sloping straight line. The numbers on the graphs are the slopes (in mWb/s) and the voltages (in mV); “+2 → 0” means the value changes from +2 at the start of the interval to 0 at its end.</p>` +
      `<ul class="pairs">${rows.join('')}</ul>` +
      `<p>Traps in this exercise:</p><ul class="pairs">` +
      [`Graphs ${a} and ${b} are mirror images: only the sign of the voltage tells their voltage graphs apart.`, ...traps()].map((t) => `<li>${t}</li>`).join('') + '</ul>';
  }

  // What a wrong pair suggests, by misconception (see diagnose() in generator.js).
  const WHY = {
    sign: () => `Check the sign. By Lenz's rule, ${V} = −${DPHI}: where ${PHI} increases, ${V} is negative, and where it decreases, ${V} is positive.`,
    copy: (f, u) => `Voltage graph ${u} has the same shape as flux graph ${f}. But ${V} does not depend on how large ${PHI} is, only on how fast it changes: where ${PHI} is high but constant, ${V} = 0.`,
    average: () => `In a curved interval, the slope of ${PHI} changes all the time, so ${V} is not constant there. It is a sloping line, not the average slope ΔΦ/Δ<i>t</i>.`,
    steepness: () => `The signs fit, but compare the steepness: a steeper flux graph gives a larger voltage.`,
    other: () => `Go through the intervals one by one: is ${PHI} flat (${V} = 0), increasing (${V} &lt; 0) or decreasing (${V} &gt; 0)? Is it straight (${V} constant) or curved (${V} changes)?`,
  };

  // Voltage graphs that look like another flux graph, or like its average slope.
  function traps() {
    const out = [];
    for (const f of ex.flux) {
      for (const u of ex.volt) {
        const d = diagnose(ex, f.id, u.id);
        if (d === 'copy') out.push(`Voltage graph ${u.id} has the same shape as flux graph ${f.id}, but it belongs to ${u.of}: ${V} depends on how fast ${PHI} changes, not on how large it is.`);
        if (d === 'average') out.push(`Voltage graph ${u.id} would fit flux graph ${f.id} if its curved part were straight. But where ${PHI} is curved, ${V} changes.`);
      }
    }
    return out;
  }

  // ---------------------------------------------------------------- rendering
  const colour = (fluxId) => 'p' + (FLUX.indexOf(fluxId) + 1);
  const partnerOf = (side, id) => (side === 'flux' ? st.pairs.get(id) : [...st.pairs].find(([, v]) => v === id)?.[0]);

  function card(side, id, svg) {
    return `<button type="button" class="gcard" data-side="${side}" data-id="${id}">
      <span class="gname">${id}</span><span class="badge"></span>${svg}</button>`;
  }

  function render() {
    const sol = st.revealed;
    $('#flux').innerHTML = ex.flux.map((f) => card('flux', f.id, fluxGraph(ex.times, f.values, f.segs, sol))).join('');
    $('#volt').innerHTML = ex.volt.map((u) => card('volt', u.id, voltGraph(ex.times, u.segs, sol))).join('');
    $('#hint-list').innerHTML = '';
    $('#hints').hidden = true;
    $('#solution').hidden = !sol;
    $('#sol-text').innerHTML = sol ? solution() : '';
    if (!sol) { $('#status').textContent = ''; $('#status').className = 'status'; }
    $('#feedback').innerHTML = '';
    paint();
    updateButtons();
  }

  function paint() {
    document.querySelectorAll('.gcard').forEach((el) => {
      const { side, id } = el.dataset;
      const partner = partnerOf(side, id);
      const fluxId = side === 'flux' ? id : partner;
      const mark = fluxId && st.marks[fluxId];
      el.className = ['gcard',
        partner ? colour(fluxId) : '',
        st.sel && st.sel.side === side && st.sel.id === id ? 'sel' : '',
        mark || ''].filter(Boolean).join(' ');
      el.querySelector('.badge').textContent = partner ? `↔ ${partner}` : '';
      el.setAttribute('aria-pressed', String(!!st.sel && st.sel.side === side && st.sel.id === id));
      const what = side === 'flux' ? 'Flux graph' : 'Voltage graph';
      el.setAttribute('aria-label', `${what} ${id}${partner ? `, paired with ${partner}` : ''}${mark === 'ok' ? ', correct' : mark === 'bad' ? ', wrong' : ''}`);
      el.disabled = st.revealed;
    });
    $('#check').disabled = st.revealed;
  }

  // ---------------------------------------------------------------- pairing
  function pick(side, id) {
    const sel = st.sel;
    if (!sel || sel.side === side) {
      st.sel = sel && sel.side === side && sel.id === id ? null : { side, id };
      return paint();
    }
    const [f, u] = side === 'flux' ? [id, sel.id] : [sel.id, id];
    const same = st.pairs.get(f) === u;
    st.pairs.delete(f);
    for (const [k, v] of st.pairs) if (v === u) st.pairs.delete(k);
    if (!same) st.pairs.set(f, u);
    st.sel = null;
    st.marks = {};
    $('#status').textContent = '';
    $('#feedback').innerHTML = '';
    paint();
  }

  // ---------------------------------------------------------------- exercise lifecycle
  const newSeed = () => 1 + Math.floor(Math.random() * 999999);
  const canReveal = () => st.hints >= ex.hints.length || st.tries >= MAX_TRIES;

  function open(exercise) {
    ex = exercise;
    ex.hints = hints();
    st = { pairs: new Map(), sel: null, marks: {}, tries: 0, hints: 0, solved: false, revealed: false };
    const hash = `#${ex.id}`;
    if (location.hash !== hash) history.replaceState(null, '', hash);
    render();
  }

  function fresh() { open(generate(newSeed())); }

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

  function check() {
    const status = $('#status');
    if (st.pairs.size < ex.flux.length) {
      status.textContent = 'Pair every flux graph with a voltage graph, then check again.';
      status.className = 'status';
      return;
    }
    st.tries++;
    st.sel = null;
    let right = 0;
    for (const [f, u] of st.pairs) {
      st.marks[f] = ex.answer[f] === u ? 'ok' : 'bad';
      if (st.marks[f] === 'ok') right++;
    }
    if (right === ex.flux.length) {
      if (!st.solved) {
        const s = stored('im-score', { solved: 0, clean: 0 });
        s.solved++;
        if (st.tries === 1 && st.hints === 0) s.clean++;
        store('im-score', s);
        showScore();
      }
      st.solved = true;
      status.textContent = 'All pairs correct, well done!';
      status.className = 'status ok';
    } else {
      const more = canReveal() ? ' You can take a hint or look at the solution.' : ' Change the wrong pairs and check again, or take a hint.';
      status.textContent = `${right} of ${ex.flux.length} pairs are correct (attempt ${st.tries}).${more}`;
      status.className = 'status bad';
    }
    $('#feedback').innerHTML = [...st.pairs].filter(([f]) => st.marks[f] === 'bad')
      .map(([f, u]) => `<li><b>${f} ↔ ${u}</b>: ${WHY[diagnose(ex, f, u)](f, u)}</li>`).join('');
    paint();
    updateButtons();
  }

  function hint() {
    if (st.hints >= ex.hints.length) return;
    const li = document.createElement('li');
    li.innerHTML = ex.hints[st.hints];
    $('#hint-list').appendChild(li);
    st.hints++;
    $('#hints').hidden = false;
    updateButtons();
    li.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function reveal() {
    if (!canReveal()) return;
    const shown = $('#hint-list').innerHTML, hintsHidden = $('#hints').hidden;
    st.revealed = true;
    st.sel = null;
    st.marks = {};
    st.pairs = new Map(Object.entries(ex.answer));
    render();
    $('#hint-list').innerHTML = shown;
    $('#hints').hidden = hintsHidden;
    $('#status').textContent = 'The graphs now show the correct pairs.';
    $('#status').className = 'status';
    $('#solution').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function fromHash() {
    const m = location.hash.slice(1).match(/^(\d+)$/);
    if (!m) return false;
    if (!ex || ex.id !== m[1]) open(generate(Number(m[1])));
    return true;
  }

  // ---------------------------------------------------------------- init
  function init() {
    $('#new').addEventListener('click', fresh);
    $('#check').addEventListener('click', check);
    $('#hint').addEventListener('click', hint);
    $('#reveal').addEventListener('click', reveal);
    $('#board').addEventListener('click', (evt) => {
      const el = evt.target.closest('.gcard');
      if (el && !el.disabled) pick(el.dataset.side, el.dataset.id);
    });
    window.addEventListener('hashchange', fromHash);
    showScore();
    if (!fromHash()) fresh();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
