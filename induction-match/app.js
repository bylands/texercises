(function () {
  'use strict';

  const { T, FLUX, FAMILIES, SHAPE, generate, diagnose, correlation, volt, curved } = window.Induction;
  const { fluxGraph, voltGraph, num } = window.Plot;
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
  const r1 = (x) => Math.round(x * 10) / 10;
  const fmt = (x) => String(Math.round(x * 100) / 100);
  const neg = (x) => (x === 0 ? 0 : -x);
  const graphOf = (id) => ex.flux.find((f) => f.id === id);
  const voltOf = (fluxId) => ex.answer[fluxId];
  const slopeAt = (p, x) => SHAPE[p.type].df(p, x);

  // Unordered pairs of flux graphs {f, g} such that pairing f with g's voltage graph is `kind`.
  function trapPairs(kind) {
    const out = [];
    for (const f of ex.flux) {
      for (const g of ex.flux) {
        if (f.id < g.id && [diagnose(ex, f.id, voltOf(g.id)), diagnose(ex, g.id, voltOf(f.id))].includes(kind)) out.push([f.id, g.id]);
      }
    }
    return out;
  }

  // What happens in one piece of a flux graph, and what that means for the voltage.
  function describe(p) {
    const L = p.t1 - p.t0, s0 = slopeAt(p, 0), s1 = slopeAt(p, L);
    const when = `${fmt(p.t0)}–${fmt(p.t1)} s`;
    if (p.type === 'poly' && p.d0 === p.d1) {
      return p.d0 === 0 ? `${when}: ${PHI} is constant, so ${V} = 0`
        : `${when}: ${PHI} changes at ${num(r1(p.d0))} mWb/s, so ${V} = ${num(r1(-p.d0))} mV`;
    }
    if (p.type === 'poly') {
      return `${when}: the slope of ${PHI} changes steadily from ${num(r1(s0))} to ${num(r1(s1))} mWb/s, so ${V} goes from ${num(r1(-s0))} to ${num(r1(-s1))} mV`;
    }
    if (p.type === 'exp' && p.q === 0) {
      return `${when}: ${PHI} ${p.r < 0 ? 'rises' : 'falls'} exponentially by up to ${fmt(Math.abs(p.r))} mWb (time constant ${fmt(p.tc)} s). It changes fastest right at the start, so ${V} jumps to ${num(r1(-s0))} mV and then decays towards 0`;
    }
    if (p.type === 'exp') {
      return `${when}: ${PHI} starts to change slowly, then at a steady ${num(r1(p.q))} mWb/s, so ${V} goes from ${num(r1(-s0))} mV towards ${num(r1(-p.q))} mV`;
    }
    const P = (2 * Math.PI) / p.w, A = Math.abs(p.A);
    return `${when}: ${PHI} oscillates with amplitude ${fmt(A)} mWb and period ${fmt(P)} s, so ${V} oscillates with amplitude 2π · ${fmt(A)} mWb / ${fmt(P)} s ≈ ${fmt(A * p.w)} mV`;
  }

  // Rule of thumb for the kind of graphs in this exercise.
  const RULE = {
    pieces: `Where a flux graph is curved, its slope changes steadily, so the voltage graph is a sloping straight line there. At a peak or a valley of ${PHI}, ${V} passes through zero.`,
    exp: `Right after a switch, ${PHI} changes fastest, so |${V}| is largest. As ${PHI} levels off, ${V} decays to zero. Where the slope of ${PHI} jumps (at a switch), ${V} jumps too. A shorter time constant means a faster change and a larger voltage.`,
    sine: `${V} = 0 at the peaks and valleys of ${PHI}, and |${V}| is largest where ${PHI} crosses its middle line, where it is steepest. So the voltage graph is shifted by a quarter period. A larger amplitude or a shorter period gives a larger voltage.`,
  };

  // Worked example for one piece: curved if possible, else sloped.
  function example() {
    const found = [];
    for (const f of ex.flux) for (const p of f.pieces) found.push([f, p]);
    const pick = (test) => found.find(([, p]) => test(p));
    const [f, p] = pick((q) => q.type === 'sine') || pick((q) => q.type === 'exp' && q.q === 0) || pick(curved)
      || pick((q) => q.d0 !== 0);
    const s0 = slopeAt(p, 0);
    if (p.type === 'sine') {
      const P = (2 * Math.PI) / p.w, A = Math.abs(p.A);
      return `Example: flux graph ${f.id} oscillates with amplitude ${fmt(A)} mWb and period ${fmt(P)} s. Its steepest slope is 2π · ${fmt(A)} mWb / ${fmt(P)} s ≈ ${fmt(A * p.w)} mWb/s, so ${V} reaches ±${fmt(A * p.w)} mV where ${PHI} crosses its middle line, and ${V} = 0 at its peaks and valleys.`;
    }
    if (p.type === 'exp') {
      return `Example: in flux graph ${f.id}, ${PHI} starts to ${p.r < 0 ? 'rise' : 'fall'} at ${fmt(p.t0)} s towards a value ${fmt(Math.abs(p.r))} mWb ${p.r < 0 ? 'higher' : 'lower'}, with time constant ${fmt(p.tc)} s. At first it changes at ${fmt(Math.abs(p.r))} mWb / ${fmt(p.tc)} s = ${fmt(Math.abs(s0))} mWb/s, so ${V} jumps to ${num(r1(-s0))} mV and then decays towards 0.`;
    }
    const when = `between ${fmt(p.t0)} s and ${fmt(p.t1)} s`;
    if (curved(p)) {
      return `Example: in flux graph ${f.id}, the slope of ${PHI} changes steadily from ${num(p.d0)} mWb/s to ${num(p.d1)} mWb/s ${when}. So ${V} changes steadily from ${num(neg(p.d0))} mV to ${num(neg(p.d1))} mV: a sloping straight line.`;
    }
    const dt = p.t1 - p.t0, p1 = p.p0 + p.d0 * dt;
    return `Example: in flux graph ${f.id}, ${PHI} changes from ${fmt(p.p0)} mWb to ${fmt(p1)} mWb ${when}, so ${V} = −(${num(p1 - p.p0)} mWb)/(${dt} s) = ${num(neg(p.d0))} mV there.`;
  }
  function hints() {
    const [a, b] = trapPairs('sign')[0];
    return [
      `The induced voltage only depends on how fast the flux changes: ${V} = −${DPHI}, the slope of the ${PHI}(<i>t</i>) graph with the opposite sign. The value of ${PHI} itself does not matter.`,
      `Where a flux graph is horizontal, ${V} = 0. Where ${PHI} increases, ${V} is negative; where it decreases, ${V} is positive. A steeper graph gives a larger voltage.`,
      RULE[ex.family],
      `Flux graphs ${a} and ${b} are mirror images of each other, so their voltage graphs are mirror images too.`,
      example(),
    ];
  }

  const INTRO = {
    pieces: `Where ${PHI} is a straight line, ${V} is constant. Where ${PHI} is curved, its slope changes steadily, so ${V} is a sloping straight line.`,
    exp: `The slope of an exponential approach is itself exponential: ${V} jumps when the field is switched and then decays with the same time constant.`,
    sine: `The slope of a sine curve is a cosine curve: ${V} oscillates with the same period, shifted by a quarter period, with amplitude 2π · (amplitude of ${PHI}) / period.`,
  };

  function solution() {
    const rows = ex.flux.map((f) => `<li><b>${f.id} ↔ ${voltOf(f.id)}</b>: ${f.pieces.map(describe).join('; ')}.</li>`);
    const labelled = ex.family !== 'sine'
      ? ' The numbers above the graphs are the slopes of the flux (in mWb/s) and the voltages (in mV) at the start and end of each part; “+2 → 0” means from +2 to 0.'
      : '';
    return `<p>The induced voltage is the slope of the flux graph with the opposite sign, ${V} = −${DPHI}. ${INTRO[ex.family]}${labelled}</p>` +
      `<ul class="pairs">${rows.join('')}</ul>` +
      `<p>Traps in this exercise:</p><ul class="pairs">${traps().map((t) => `<li>${t}</li>`).join('')}</ul>`;
  }

  // What a wrong pair suggests, by misconception (see diagnose() in generator.js).
  const WHY = {
    sign: () => `Check the sign. By Lenz's rule, ${V} = −${DPHI}: where ${PHI} increases, ${V} is negative, and where it decreases, ${V} is positive.`,
    copy: (f, u) => `Voltage graph ${u} has the same shape as flux graph ${f}. But ${V} does not depend on how large ${PHI} is, only on how fast it changes: where ${PHI} is constant or at a peak, ${V} = 0.`,
    average: () => `In a curved part, the slope of ${PHI} changes all the time, so ${V} is not constant there. It is a sloping line, not the average slope ΔΦ/Δ<i>t</i>.`,
    steepness: () => ({
      pieces: `The signs fit, but compare the steepness: a steeper flux graph gives a larger voltage.`,
      exp: `The signs fit, but compare how fast ${PHI} changes: with a shorter time constant, ${PHI} changes faster, so ${V} is larger at first and decays sooner.`,
      sine: `The signs fit, but compare the amplitudes: the amplitude of ${V} is 2π · (amplitude of ${PHI}) / period.`,
    })[ex.family],
    other: () => `Go through the graph step by step: where is ${PHI} constant (${V} = 0), increasing (${V} &lt; 0) or decreasing (${V} &gt; 0), and where is it steepest (|${V}| largest)?`,
  };

  // Voltage graphs of f and g have a similar shape (they differ mainly in size).
  const TS = Array.from({ length: 200 }, (x, k) => ((k + 0.5) * T) / 200);
  const similar = (f, g) => correlation(TS.map((t) => volt(graphOf(f), t)), TS.map((t) => volt(graphOf(g), t))) > 0.9;
  const and = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

  function traps() {
    const out = trapPairs('sign').map(([a, b]) => `Flux graphs ${a} and ${b} are mirror images: only the sign of the voltage tells their voltage graphs apart.`);
    for (const u of ex.volt) {
      const like = ex.flux.filter((f) => diagnose(ex, f.id, u.id) === 'copy').map((f) => f.id);
      if (like.length) out.push(`Voltage graph ${u.id} has the same shape as flux graph${like.length > 1 ? 's' : ''} ${and(like)}, but it belongs to ${u.of}: ${V} depends on how fast ${PHI} changes, not on how large it is.`);
      for (const f of ex.flux) {
        if (diagnose(ex, f.id, u.id) === 'average') out.push(`Voltage graph ${u.id} would fit flux graph ${f.id} if its curved part were straight. But where ${PHI} is curved, ${V} changes.`);
      }
    }
    for (const [a, b] of trapPairs('steepness').filter(([a, b]) => similar(a, b))) {
      out.push(`Flux graphs ${a} and ${b} change in the same way, but at different rates: only the size of the voltage tells them apart.`);
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
    $('#flux').innerHTML = ex.flux.map((f) => card('flux', f.id, fluxGraph(f, sol))).join('');
    $('#volt').innerHTML = ex.volt.map((u) => card('volt', u.id, voltGraph(graphOf(u.of), sol))).join('');
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
  const canReveal = () => st.solved || st.hints >= ex.hints.length || st.tries >= MAX_TRIES;

  function open(exercise) {
    ex = exercise;
    ex.hints = hints();
    st = { pairs: new Map(), sel: null, marks: {}, tries: 0, hints: 0, solved: false, revealed: false };
    const hash = `#${ex.id}`;
    if (location.hash !== hash) history.replaceState(null, '', hash);
    render();
  }

  const kind = () => (document.querySelector('input[name="family"]:checked') || {}).value || 'mixed';
  function fresh() {
    const k = kind(), families = Object.keys(FAMILIES);
    open(generate(k === 'mixed' ? families[Math.floor(Math.random() * families.length)] : k, newSeed()));
  }

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
    const m = location.hash.slice(1).match(/^(?:(pieces|exp|sine)-)?(\d+)$/);
    if (!m) return false;
    const id = `${m[1] || 'pieces'}-${m[2]}`;
    if (!ex || ex.id !== id) open(generate(m[1] || 'pieces', Number(m[2])));
    return true;
  }

  // ---------------------------------------------------------------- init
  function init() {
    const saved = stored('im-family', 'mixed');
    $('#families').innerHTML = Object.entries({ mixed: 'Mixed', ...FAMILIES }).map(([k, name]) => `
      <label><input type="radio" name="family" value="${k}"${k === saved ? ' checked' : ''}><span>${name}</span></label>`).join('');
    $('#families').addEventListener('change', () => { store('im-family', kind()); fresh(); });
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
