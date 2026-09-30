(function () {
  'use strict';

  const { LEVELS, ANSWERS, generate, make, diagnose, sameSpot, bulbsIn, canon: canonOf, ftext, cmp, isExact, isZero, ONE } = window.Bulbs;
  const { circuit } = window.Draw;
  const $ = (sel) => document.querySelector(sel);
  const MAX_TRIES = 3;
  const WORDS = { brighter: 'brighter', equal: 'equally bright', dimmer: 'less bright', off: 'off' };
  const GLOW = { brighter: 0.95, equal: 0.5, dimmer: 0.22, off: 0 };
  const V0 = '<i>V</i><sub>0</sub>';

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
    const s = stored('bb-score', { solved: 0, clean: 0 });
    $('#score').textContent = s.solved ? `Solved: ${s.solved} · first try without hints: ${s.clean}` : '';
  }

  // ---------------------------------------------------------------- text
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const volts = (f) => (isZero(f) ? '0' : cmp(f, ONE) === 0 ? V0 : `${ftext(f)} ${V0}`);
  const it = (name) => `<i>${name}</i>`;
  const and = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
  const cap = (s) => s.replace(/^(<i>)?([a-z])/, (m, tag, c) => (tag || '') + c.toUpperCase());

  // How a part of the circuit is called in the explanations.
  function name(part) {
    const bs = bulbsIn(part).map((b) => it(`L${b.i + 1}`));
    if (part.t === 'L') return bs[0];
    if (part.t === 'W') return 'the wire';
    const bridged = part.kids.find((k) => k.t !== 'W' && part.kids.some((w) => w.t === 'W'));
    if (bridged) return `${name(bridged)} (bridged)`;
    return part.t === 'P' ? `the parallel group of ${and(bs)}` : `the chain of ${and(bs)}`;
  }

  // How the circuit is built, from the inside out.
  function structure() {
    const out = [];
    (function walk(node) {
      if (!node.kids) return;
      node.kids.forEach(walk);
      const parts = node.kids.filter((k) => k.t !== 'W');
      if (parts.length < node.kids.length) out.push(`${name(parts[0])} is bridged by a wire`);
      else out.push(`${name(parts[0])} is in ${node.t === 'S' ? 'series' : 'parallel'} with ${and(parts.slice(1).map(name))}`);
    })(ex.load);
    return out;
  }
  const names = (parts) => and(parts.filter((p) => p.t !== 'W').map(name));
  const kind = (part) => (part.t === 'L' ? 'one bulb' : part.t === 'P' ? `${part.kids.length} branches side by side` : `${part.kids.length} parts in a row`);

  const PACK_TEXT = {
    1: `One battery gives ${V0}.`,
    S2: `The two batteries are in series: their voltages add up to 2 ${V0}.`,
    S3: `The three batteries are in series: their voltages add up to 3 ${V0}.`,
    R2: 'One battery is connected the other way round, so the two voltages cancel: 0.',
    R3: `One battery is connected the other way round and cancels one of the others: ${V0} in total.`,
  };

  // One reasoning step on the way from the batteries to a bulb.
  function stepText(s) {
    const part = name(s.part), others = s.others || s.group.kids.filter((k) => k !== s.part);
    if (s.kind === 'bridged') return `${part} is bridged by a wire, so there is no voltage across it`;
    if (s.kind === 'parallel') return `${part} is in parallel with ${names(others)}, so it gets the same voltage`;
    if (s.n === 1) return `the rest of its chain is bridged by a wire, so ${part} gets all of the voltage`;
    if (s.why === 'equal') return `${part} and ${names(others)} are identical and in series, so they share the voltage equally (voltage divider): ${part} gets 1/${s.n} of it`;
    if (s.why === 'larger') return `${part} (${kind(s.part)}) lets less current through than ${names(others)} (${and(others.map(kind))}), so in series it takes the larger share of the voltage (voltage divider): more than 1/${s.n}`;
    if (s.why === 'smaller') return `${part} (${kind(s.part)}) lets more current through than ${names(others)} (${and(others.map(kind))}), so in series it takes the smaller share of the voltage (voltage divider): less than 1/${s.n}`;
    return `${part} gets part of the voltage`;
  }

  function bounds(iv) {
    if (isExact(iv)) return `= ${volts(iv.lo)}`;
    if (isZero(iv.lo)) return `is less than ${volts(iv.hi)}`;
    if (cmp(iv.hi, ex.E) === 0) return `is more than ${volts(iv.lo)}`;
    return `is between ${volts(iv.lo)} and ${volts(iv.hi)}`;
  }

  // The same bounds as a phrase: “gets more than V0”.
  function gets(iv) {
    if (isExact(iv)) return `exactly ${volts(iv.lo)}`;
    if (isZero(iv.lo)) return `less than ${volts(iv.hi)}`;
    if (cmp(iv.hi, ex.E) === 0) return `more than ${volts(iv.lo)}`;
    return `between ${volts(iv.lo)} and ${volts(iv.hi)}`;
  }

  function explain(b) {
    if (isZero(ex.E)) return `${it(b.name)}: no current flows, so <b>off</b>.`;
    const steps = b.steps.map(stepText);
    const bridged = b.steps.find((s) => s.kind === 'bridged');
    const chain = bridged ? [stepText(bridged)] : steps;
    const V = `<i>V</i>(${it(b.name)})`;
    return `${it(b.name)}: ${chain.length ? cap(chain.join('; ')) + '. ' : ''}So ${V} ${bounds(b.iv)}: <b>${WORDS[b.answer]}</b>.`;
  }

  // Hints from general to specific, all taken from the worked solution: the batteries, how the
  // circuit is built, the voltage divider for the whole circuit, and the full reasoning for the
  // bulb that needs the most steps (without the answer).
  function hints() {
    const out = [`${PACK_TEXT[ex.packKey]} The reference bulb gets ${V0}, so compare each bulb's voltage with ${V0}.`];
    if (isZero(ex.E)) return [...out, 'With no voltage, no current flows anywhere.'];
    out.push(`How the circuit is built: ${structure().join('; ')}.`);

    const top = ex.load, live = top.kids.filter((k) => k.iv && !(isExact(k.iv) && isZero(k.iv.lo)));
    if (top.t === 'P') {
      out.push(`All branches are connected directly to the batteries, so each branch gets the full ${volts(ex.E)} (parallel parts have the same voltage).`);
    } else {
      const step = ex.bulbs.map((b) => b.steps[0]).find((st) => st && st.kind === 'series' && st.why !== 'some');
      const shares = live.map((k) => `${name(k)} gets ${gets(k.iv)}`);
      out.push(`Voltage divider for the whole circuit (the parts in series share ${volts(ex.E)}): ${step ? stepText(step) + '. ' : ''}So ${and(shares)}.`);
    }

    const deep = ex.bulbs.filter((b) => !b.shorted).sort((x, y) => y.steps.length - x.steps.length)[0];
    if (deep && deep.steps.length >= 2) {
      out.push(`For ${it(deep.name)}: ${deep.steps.map(stepText).join('; ')}. So <i>V</i>(${it(deep.name)}) ${bounds(deep.iv)}. Is that more or less than ${V0}?`);
    }
    return out;
  }

  function solution() {
    return '<p>The bulbs are not ohmic resistors (their resistance grows as they heat up), so we do not calculate with resistances. What we can use: identical bulbs behave identically, and a bulb lets more current through the more voltage it gets. ' +
      `The reference bulb gets ${V0}; a bulb with more voltage is brighter, one with less is less bright.</p>` +
      `<p>${PACK_TEXT[ex.packKey]}</p><ul>${ex.bulbs.map((b) => `<li>${explain(b)}</li>`).join('')}</ul>`;
  }

  // What a wrong answer suggests, by misconception (see diagnose() in generator.js).
  function why(code, b) {
    const exact = (c) => isExact(c.iv) && isExact(b.iv) && cmp(c.iv.lo, b.iv.lo) === 0;
    const same = ex.bulbs.find((c) => c !== b && (exact(c) || sameSpot(ex, b, c)));
    return {
      short: `${it(b.name)} is bridged by a wire. The current takes the wire, so there is no voltage across ${it(b.name)}: it is off.`,
      reversed: isZero(ex.E)
        ? 'One battery is connected the other way round: the two voltages cancel, so no current flows.'
        : 'One battery is connected the other way round: its voltage counts negative and cancels one of the others.',
      fixedCurrent: 'A battery does not deliver a fixed current; it keeps a fixed voltage. Bulbs in parallel each get the full voltage of their branch; bulbs in series share it (voltage divider).',
      same: `${it(b.name)} gets the same voltage as ${it(same ? same.name : '')}, so they are equally bright. The current is not used up by the first bulb it passes.`,
      other: `Work out the voltage across ${it(b.name)} with the voltage divider: which share of the battery voltage does it get?`,
    }[code];
  }

  // ---------------------------------------------------------------- rendering
  const ref = (glow) => circuit({ t: 'L', i: 0 }, { t: 'B', dir: 1 }, () => ({ label: 'L₀', glow }));
  // `glows[i]` is the answer shown for bulb i (none: unlit).
  const task = (glows) => circuit(clone(ex.load), clone(ex.pack), (i) => ({ label: ex.bulbs[i].name, glow: GLOW[glows[i]] || 0 }));
  const drawAnswers = () => { $('#figure').innerHTML = task(answers()); };

  function render() {
    $('#ref').innerHTML = ref(GLOW.equal);
    $('#figure').innerHTML = task([]);
    $('#fields').innerHTML = ex.bulbs.map((b) => `
      <div class="field" data-name="${b.name}">
        <span class="name">${b.name}</span>
        <span class="choices" role="radiogroup" aria-label="${b.name}">${ANSWERS.map((a) => `
          <label><input type="radio" name="ans-${b.name}" value="${a}"><span>${WORDS[a]}</span></label>`).join('')}
        </span>
        <span class="fb"></span>
      </div>`).join('');
    $('#hint-list').innerHTML = '';
    $('#hints').hidden = true;
    $('#solution').hidden = true;
    $('#status').textContent = '';
    $('#status').className = 'status';
    $('#feedback').innerHTML = '';
    updateButtons();
  }

  const answers = () => ex.bulbs.map((b) => (document.querySelector(`input[name="ans-${b.name}"]:checked`) || {}).value);

  // ---------------------------------------------------------------- exercise lifecycle
  const newSeed = () => 1 + Math.floor(Math.random() * 999999);
  const level = () => (document.querySelector('input[name="level"]:checked') || {}).value || 'medium';
  const canReveal = () => st.solved || st.hints >= ex.hints.length || st.tries >= MAX_TRIES;

  function open(exercise) {
    ex = exercise;
    ex.hints = hints();
    st = { tries: 0, hints: 0, solved: false, revealed: false };
    const hash = `#${ex.id}`;
    if (location.hash !== hash) history.replaceState(null, '', hash);
    render();
  }

  function fresh() { open(generate(level(), newSeed())); }

  function updateButtons() {
    const left = ex.hints.length - st.hints;
    const hb = $('#hint');
    hb.disabled = left === 0 || st.revealed;
    hb.textContent = left ? `Hint (${left} left)` : 'No more hints';
    const rb = $('#reveal');
    rb.disabled = !canReveal() || st.revealed;
    rb.title = canReveal() ? '' : `Unlocks after all hints or ${MAX_TRIES} attempts`;
    $('#reveal-note').hidden = canReveal() || st.revealed;
    $('#check').disabled = st.revealed;
  }

  function check() {
    const given = answers(), status = $('#status');
    if (given.some((a) => !a)) {
      status.textContent = 'Choose an answer for every bulb, then check again.';
      status.className = 'status';
      return;
    }
    st.tries++;
    const codes = diagnose(ex, given);
    codes.forEach((c, i) => { document.querySelector(`.field[data-name="${ex.bulbs[i].name}"]`).className = `field ${c === 'right' ? 'ok' : 'bad'}`; });
    const right = codes.filter((c) => c === 'right').length;
    if (right === codes.length) {
      if (!st.solved && !st.revealed) {
        const s = stored('bb-score', { solved: 0, clean: 0 });
        s.solved++;
        if (st.tries === 1 && st.hints === 0) s.clean++;
        store('bb-score', s);
        showScore();
      }
      st.solved = true;
      status.textContent = 'All correct, well done!';
      status.className = 'status ok';
    } else {
      const more = canReveal() ? ' You can take a hint or look at the solution.' : ' Change the wrong answers and check again, or take a hint.';
      status.textContent = `${right} of ${codes.length} bulbs are correct (attempt ${st.tries}).${more}`;
      status.className = 'status bad';
    }
    // One message per misconception, naming the bulbs it concerns.
    const seen = new Map();
    codes.forEach((c, i) => {
      if (c === 'right') return;
      const key = ['short', 'same', 'other'].includes(c) ? `${c}-${i}` : c;
      if (!seen.has(key)) seen.set(key, { c, bulbs: [] });
      seen.get(key).bulbs.push(ex.bulbs[i]);
    });
    $('#feedback').innerHTML = [...seen.values()]
      .map(({ c, bulbs }) => `<li><b>${and(bulbs.map((b) => b.name))}</b>: ${why(c, bulbs[0])}</li>`).join('');
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
    st.revealed = true;
    $('#sol-figure').innerHTML = `<figure class="fig ref">${ref(GLOW.equal)}<figcaption>Reference</figcaption></figure>` +
      `<figure class="fig">${task(ex.bulbs.map((b) => b.answer))}<figcaption>Your circuit</figcaption></figure>`;
    $('#sol-text').innerHTML = solution();
    $('#solution').hidden = false;
    updateButtons();
    $('#solution').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---------------------------------------------------------------- tutor
  // Worked examples: the batteries, then the circuit from the outside in (each group shares its
  // voltage among its parts), then the brightness of every bulb.
  const Lb = () => ({ t: 'L' }), Wire = () => ({ t: 'W' });
  const Ser = (...kids) => ({ t: 'S', kids }), Par = (...kids) => ({ t: 'P', kids });
  const LESSONS = [
    { name: 'Series', pack: '1', load: () => Ser(Lb(), Lb()),
      idea: 'Two identical bulbs in series on one battery share its voltage equally.' },
    { name: 'Parallel', pack: '1', load: () => Par(Lb(), Lb()),
      idea: 'Bulbs in parallel each get the full voltage of the battery, however many branches there are.' },
    { name: 'Mixed', pack: 'S2', load: () => Ser(Lb(), Par(Lb(), Lb())),
      idea: 'Two batteries in series double the voltage. A bulb in series with a parallel pair takes the larger share, because the pair lets more current through.' },
    { name: 'Bridged', pack: '1', load: () => Ser(Lb(), Par(Lb(), Wire())),
      idea: 'A wire across a bulb takes all the current: the bridged bulb goes off, and the rest of the circuit gets the whole voltage.' },
    { name: 'Reversed', pack: 'R3', load: () => Par(Lb(), Ser(Lb(), Lb())),
      idea: 'A battery connected the other way round cancels one of the others.' },
  ];

  // Voltage bounds as a note in the diagram (plain text).
  const vs = (f) => (isZero(f) ? '0' : cmp(f, ONE) === 0 ? 'V₀' : `${ftext(f)} V₀`);
  function noteOf(iv, E) {
    if (isExact(iv)) return `V = ${vs(iv.lo)}`;
    if (isZero(iv.lo)) return `V < ${vs(iv.hi)}`;
    if (cmp(iv.hi, E) === 0) return `V > ${vs(iv.lo)}`;
    return `${vs(iv.lo)} < V < ${vs(iv.hi)}`;
  }
  const zero = (iv) => isExact(iv) && isZero(iv.lo);
  const SHORT = { brighter: 'brighter', equal: 'equal', dimmer: 'dimmer', off: 'off' }; // fits under a bulb
  // Shown larger than in the exercises: the notes are small otherwise.
  const larger = (svg, k) => svg.replace(/width="([\d.]+)" height="([\d.]+)"/, (m, w, h) => `width="${(w * k).toFixed(1)}" height="${(h * k).toFixed(1)}"`);

  function lesson(def) {
    const e = make(def.pack, def.load(), 'tutor', 'tutor');
    const saved = ex; // the text helpers (bounds, gets) read the exercise from ex
    ex = e;
    try {
      const frames = [], notes = new Map(); // bulb index → note shown from now on
      const figure = (o = {}) => {
        const look = (i) => ({ label: e.bulbs[i].name, glow: o.lit ? GLOW[e.bulbs[i].answer] : 0,
          note: o.lit ? SHORT[e.bulbs[i].answer] : notes.get(i), hl: o.hl && o.hl.has(i), noteCls: o.lit ? '' : 'v' });
        const reference = circuit({ t: 'L', i: 0 }, { t: 'B', dir: 1 },
          () => ({ label: 'L₀', glow: o.lit ? GLOW.equal : 0, note: o.ref ? 'V = V₀' : '', noteCls: 'v' }), { zones: new Map() });
        const task = larger(circuit(e.load, e.pack, look, { zones: o.zones || new Map(), captions: o.captions, bat: o.bat }), 1.3);
        return `<div class="figs"><figure class="fig ref">${reference}<figcaption>Reference</figcaption></figure>` +
          `<figure class="fig">${task}<figcaption>Circuit</figcaption></figure></div>`;
      };
      const frame = (title, text, o) => frames.push({ text: `<p class="step-rule">${title}</p>${text}`, figure: figure(o) });

      frame('The task', `<p>All batteries are identical, and so are all bulbs. How bright is each bulb, compared with the reference bulb <i>L</i><sub>0</sub> on one battery?</p>` +
        `<p>A bulb is the brighter, the more voltage it gets. So we find the voltage across every bulb and compare it with the voltage ${V0} of the reference bulb.</p>`);
      frame('The batteries', `<p>${PACK_TEXT[e.packKey]} The reference bulb gets ${V0}.</p>`, { bat: 'strong', ref: true });

      // Groups from the outside in; a group without voltage is not taken apart any further.
      const queue = [e.load];
      while (queue.length) {
        const node = queue.shift();
        const parts = node.kids.filter((k) => k.t !== 'W');
        const zones = new Map([[node, 'light']]), captions = new Map(), hl = new Set();
        // Identical parts (and no wire): one sentence for all of them.
        const alike = parts.length === node.kids.length && parts.every((k) => canonOf(k) === canonOf(parts[0]));
        const lines = alike ? [] : parts.map((k) => {
          if (zero(k.iv)) {
            const bs = bulbsIn(k);
            bs.forEach((b) => notes.set(b.i, 'V = 0'));
            return `${cap(and(bs.map((b) => it(`L${b.i + 1}`))))} ${bs.length > 1 ? 'are' : 'is'} bridged by a wire: the current takes the wire, so there is no voltage across ${bs.length > 1 ? 'them' : 'it'}.`;
          }
          const step = e.bulbs.flatMap((b) => b.steps).find((st) => st.part === k && st.group === node);
          if (k.t === 'L') { hl.add(k.i); notes.set(k.i, noteOf(k.iv, e.E)); }
          else { zones.set(k, 'strong'); captions.set(k, noteOf(k.iv, e.E)); queue.push(k); }
          if (step.kind === 'series' && step.n === 1) return `Everything else in series with ${name(k)} is bridged, so ${name(k)} gets all of the voltage: ${gets(k.iv)}.`;
          return `${cap(stepText(step))}. So ${name(k)} gets ${gets(k.iv)}.`;
        });
        if (alike) {
          parts.forEach((k) => {
            if (k.t === 'L') { hl.add(k.i); notes.set(k.i, noteOf(k.iv, e.E)); } else { zones.set(k, 'strong'); captions.set(k, noteOf(k.iv, e.E)); queue.push(k); }
          });
          lines.push(node.t === 'P'
            ? `${cap(and(parts.map(name)))} are in parallel, so each of them gets the full voltage of ${node === e.load ? 'the batteries' : name(node)}: ${gets(node.iv)}.`
            : `${cap(and(parts.map(name)))} are identical and in series, so they share the voltage equally (voltage divider): each gets 1/${parts.length} of it, ${gets(parts[0].iv)}.`);
        }
        parts.forEach((k) => { if (zero(k.iv) && k.t !== 'L') zones.set(k, 'strong'); if (zero(k.iv) && k.t === 'L') hl.add(k.i); });
        const whole = node === e.load
          ? `<p>The whole circuit gets ${volts(e.E)} from the batteries. It is made of ${and(parts.map(name))}, ${node.t === 'S' ? 'in series' : 'in parallel'}.</p>`
          : `<p>${cap(name(node))} gets ${gets(node.iv)}. Inside it, ${and(parts.map(name))} are ${node.t === 'S' ? 'in series' : 'in parallel'}.</p>`;
        frame(node === e.load ? 'The whole circuit' : `Inside ${name(node)}`, whole + lines.map((l) => `<p>${l}</p>`).join(''), { zones, captions, hl });
      }

      // “is less than V0” already compares with V0; otherwise say how the bounds compare.
      const REL = { brighter: `, more than ${V0}`, equal: '', dimmer: `, less than ${V0}`, off: ', so no current flows' };
      const direct = (iv) => !isExact(iv) && ((isZero(iv.lo) && cmp(iv.hi, ONE) === 0) || (cmp(iv.hi, e.E) === 0 && cmp(iv.lo, ONE) === 0));
      const rows = e.bulbs.map((b) => `<li><i>V</i>(${it(b.name)}) ${bounds(b.iv)}${direct(b.iv) ? '' : REL[b.answer]}: <b>${WORDS[b.answer]}</b></li>`);
      frame('Brightness', `<p>Compare every bulb's voltage with ${V0}:</p><ul>${rows.join('')}</ul>`, { lit: true });
      return frames;
    } finally {
      ex = saved;
    }
  }

  // Practice: random exercises; tutor: worked examples. Hints and solution belong to practice.
  const mode = () => (document.querySelector('input[name="mode"]:checked') || {}).value || 'practice';
  let tutor = null;
  function setMode(m) {
    document.querySelector(`input[name="mode"][value="${m}"]`).checked = true;
    store('bb-mode', m);
    document.querySelectorAll('.practice').forEach((el) => { el.hidden = m !== 'practice'; });
    $('#tutor').hidden = m !== 'tutor';
    if (m === 'tutor') { $('#hints').hidden = true; $('#solution').hidden = true; }
  }
  function practise() {
    setMode('practice');
    if (ex) { history.replaceState(null, '', `#${ex.id}`); $('#hints').hidden = !st.hints; $('#solution').hidden = !st.revealed; } else fresh();
  }

  function fromHash() {
    let m = location.hash.slice(1).match(/^tutor-(\d+)$/);
    if (m && Number(m[1]) >= 1 && Number(m[1]) <= tutor.count) {
      setMode('tutor');
      if (tutor.current() !== Number(m[1]) - 1 || !tutor.shown()) tutor.open(Number(m[1]) - 1);
      return true;
    }
    m = location.hash.slice(1).match(/^(easy|medium|hard)-(\d+)$/);
    if (!m) return false;
    setMode('practice');
    document.querySelector(`input[name="level"][value="${m[1]}"]`).checked = true;
    if (!ex || ex.id !== `${m[1]}-${m[2]}`) open(generate(m[1], Number(m[2])));
    return true;
  }

  // ---------------------------------------------------------------- init
  function init() {
    const saved = stored('bb-level', 'easy');
    $('#levels').innerHTML = Object.entries(LEVELS).map(([k, lv]) => `
      <label><input type="radio" name="level" value="${k}"${k === saved ? ' checked' : ''}><span>${lv.name}</span></label>`).join('');
    $('#levels').addEventListener('change', () => { store('bb-level', level()); fresh(); });
    $('#new').addEventListener('click', fresh);
    $('#check').addEventListener('click', check);
    $('#hint').addEventListener('click', hint);
    $('#reveal').addEventListener('click', reveal);
    $('#fields').addEventListener('change', drawAnswers);
    window.addEventListener('hashchange', fromHash);
    tutor = window.createTutor(LESSONS.map((l) => ({ ...l, frames: () => lesson(l) })), { done: practise });
    $('#modes').addEventListener('change', () => {
      if (mode() === 'tutor') { setMode('tutor'); tutor.open(tutor.current()); } else practise();
    });
    showScore();
    if (fromHash()) return;
    // First visit: start with the first worked example.
    if (stored('bb-mode', 'tutor') === 'tutor') { setMode('tutor'); tutor.open(0); } else { setMode('practice'); fresh(); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
