// Questions on energy bookkeeping, with four options each: for the check (check.js) and as choice
// exercises in practice. The situations are those of scenarios.js, with symbols; what is asked is
// the bookkeeping, not a result to calculate:
//   bars      which bar chart shows the energy in the states
//   forms     which forms of energy a state has
//   balance   which equation is the energy balance of two states
//   error     a student's energy table with one wrong entry: which
//   scale     a ratio: the compression, the speed or the height n times as large
//   path      lifting work and speed do not depend on the path
//   friction  where the work done by friction goes
//   turn      the turning point of a bungee jump (v = 0) and its equilibrium (largest speed)
//   hang      a block on a spring: the lowest point is twice as far down as the equilibrium
// question(kind, seed) gives { title, text, figure, ask, options: [{ html, correct, flag, why }],
// explain(), hints }, exercise(kind, seed) the same as a practice exercise; CHECK is the source of
// the check (objectives, question, concepts), errorLesson() the frames of the tutor's example.
(function (root) {
  'use strict';

  const EC = root.EC, Energy = root.Energy, { Fig } = root.Draw;
  const { L, rng, pick, CIRCLED, etex } = EC;

  const byId = (id) => Energy.SCENARIOS.find((s) => s.id === id);
  const shuffle = (r, a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const kin = (v) => `\\tfrac{1}{2}\\,m\\,${v}^2`;
  const FORMS3 = ['pot', 'kin', 'el'];

  // A situation of scenarios.js with symbols: the exercise, its energies as formulas and values.
  function situation(id, seed) {
    const ex = Energy.generateFor(id, seed, true), scn = byId(id);
    return { ex, scn, p: ex.p, en: scn.energies(ex.p), states: scn.states(ex.p), forms: ex.forms };
  }
  // the situation in words and the zero level, without the question of the exercise
  const zeroNote = (s) => `<p class="note">${L('Zero level of the potential energy', 'Nullniveau der Lageenergie')}: ${s.ex.zero}. ${L('No friction, no air resistance.', 'Ohne Reibung und Luftwiderstand.')}</p>`;
  // the questions of the exercise (what to find, in terms of what) are left out: only the energy is asked
  const ASKS = /^(Find|Give|Gib)\b|\b([Ee]xpress|[Dd]rücke)\b/;
  const situationText = (s) => s.ex.text.replace(/<p class="note">.*?<\/p>/, '').replace(/^<p>|<\/p>$/g, '')
    .split(/(?<=[.?!])\s+(?=[A-Z])/).filter((x) => !/\?$/.test(x) && !ASKS.test(x)).join(' ');
  const prompt = (s) => `<p>${situationText(s)}</p>${zeroNote(s)}`;
  const sum = (e) => FORMS3.filter((k) => e[k]).map((k) => e[k]).join(' + ') || '0';

  // ---------------------------------------------------------------- why a state has a form or not
  // In state i the form k is there (has) or not.
  const reason = {
    kin: (c, has) => (has ? L(`In ${c} the body is moving: it has kinetic energy.`, `In ${c} bewegt sich der Körper: Er hat kinetische Energie.`)
      : L(`In ${c} the body is at rest ($v = 0$, a turning point): it has no kinetic energy.`, `In ${c} ruht der Körper ($v = 0$, ein Umkehrpunkt): Er hat keine kinetische Energie.`)),
    pot: (c, has) => (has ? L(`In ${c} the body is above the zero level: it has potential energy.`, `In ${c} ist der Körper über dem Nullniveau: Er hat Lageenergie.`)
      : L(`In ${c} the body is at the zero level ($h = 0$): it has no potential energy.`, `In ${c} ist der Körper auf dem Nullniveau ($h = 0$): Er hat keine Lageenergie.`)),
    el: (c, has) => (has ? L(`In ${c} the spring is stretched or compressed: it stores elastic energy.`, `In ${c} ist die Feder gedehnt oder gestaucht: Sie speichert Spannenergie.`)
      : L(`In ${c} the spring is relaxed: it stores no elastic energy.`, `In ${c} ist die Feder entspannt: Sie speichert keine Spannenergie.`)),
  };
  // the wrong idea of a form put where it is not: kinetic energy at rest, potential energy at the
  // zero level, elastic energy in a relaxed spring; a form left out: forgotten
  const ADDED = { kin: 'rest', pot: 'level', el: 'relaxed' };

  // Wrong entries of the energy table: [{ i, k, tex, flag, why }]. A form that is there is left
  // out (only where the state has another), one that is not is put in (with a formula of another
  // state), and a height is measured from the wrong level (the scenario's slips).
  function slipsOf(s) {
    const out = [];
    s.en.forEach((e, i) => {
      const c = CIRCLED[i], here = s.forms.filter((k) => e[k]);
      s.forms.forEach((k) => {
        if (e[k]) {
          if (here.length > 1) out.push({ i, k, tex: '0', flag: 'forgot', why: reason[k](c, true) });
          return;
        }
        const other = s.en.map((x) => x[k]).find(Boolean) || (k === 'kin' ? kin('v') : null);
        if (other) out.push({ i, k, tex: other, flag: ADDED[k], why: reason[k](c, false) });
      });
    });
    for (const x of s.scn.slips ? s.scn.slips(s.p) : []) if (x.tex !== s.en[x.i][x.k]) out.push({ ...x, flag: 'level', why: x.why() });
    return out;
  }
  const cellTex = (s, i, k) => s.en[i][k] || '0';
  const withSlip = (s, x) => s.en.map((e, i) => (i === x.i ? { ...e, [x.k]: x.tex === '0' ? null : x.tex } : e));

  // The energy table as HTML: a row per state, a column per form; mark: { i, k } a cell to point out.
  function tableHtml(s, en, mark) {
    const head = s.forms.map((k) => `<th scope="col" class="k-${k}">$${etex(k)}$</th>`).join('');
    const rows = en.map((e, i) => `<tr><th scope="row">${CIRCLED[i]}</th>${s.forms.map((k) => `<td${mark && mark.i === i && mark.k === k ? ' class="mark"' : ''}>$${e[k] || '0'}$</td>`).join('')}</tr>`).join('');
    return `<table class="etable etex"><thead><tr><th></th>${head}</tr></thead><tbody>${rows}</tbody></table>`;
  }

  // ---------------------------------------------------------------- bar charts
  // The energy bar charts of the states, as in the solutions, on their own.
  function chart(states, forms) {
    const fig = new Fig(L('Energy bar charts', 'Energie-Balkendiagramme'));
    fig.see(0, 0);
    fig.see(states.length * 120, 0);
    return fig.bars(states, forms).render();
  }
  // Charts with the energy of one state shared out wrongly, the total kept: all of it in a form it
  // does not have, half of it moved there, or all of it in one of two forms it has.
  function wrongCharts(s) {
    const out = [];
    s.states.forEach((st, i) => {
      const c = CIRCLED[i], here = s.forms.filter((k) => (st[k] || 0) > 1e-9), T = here.reduce((a, k) => a + st[k], 0);
      s.forms.filter((k) => !here.includes(k)).forEach((k) => {
        out.push({ i, st: { [k]: T }, flag: ADDED[k], why: `${reason[k](c, false)} ${here.map((x) => reason[x](c, true)).join(' ')}` });
        if (here.length === 1) out.push({ i, st: { [here[0]]: T / 2, [k]: T / 2 }, flag: ADDED[k], why: reason[k](c, false) });
      });
      if (here.length > 1) here.forEach((k) => out.push({ i, st: { [k]: T }, flag: 'forgot', why: here.filter((x) => x !== k).map((x) => reason[x](c, true)).join(' ') }));
    });
    return out;
  }
  // three of a list, from different states and wrong ideas first
  function three(r, list, key) {
    const pool = shuffle(r, [...list]), picked = [];
    const rounds = [(x) => !picked.some((y) => y.i === x.i || y.flag === x.flag), (x) => !picked.some((y) => y.i === x.i && y.flag === x.flag), () => true];
    for (const ok of rounds) for (const x of pool) if (picked.length < 3 && !picked.some((y) => key(y) === key(x)) && ok(x)) picked.push(x);
    return picked;
  }
  const explainTable = (s, note) => () => `<div class="figs">${s.ex.solutionFigure()}</div>${note ? `<p>${note}</p>` : ''}${tableHtml(s, s.en)}`;
  const hintForms = () => L('Go through the states one by one: moving → kinetic energy; above the zero level → potential energy; spring stretched or compressed → elastic energy.',
    'Geh die Zustände einzeln durch: in Bewegung → kinetische Energie; über dem Nullniveau → Lageenergie; Feder gedehnt oder gestaucht → Spannenergie.');

  const SPRINGS = ['launcher', 'buffer', 'spring-up', 'drop-spring', 'bungee', 'twice', 'spring-hang', 'slope-launch', 'ramp-spring'];
  const ALL = [...SPRINGS, 'fall', 'part-drop', 'ekin-epot', 'incline', 'pendulum', 'ramp', 'tower', 'speed-fraction'];

  function bars(seed) {
    const r = rng(seed), s = situation(pick(r, ALL), seed), opts = three(r, wrongCharts(s), (x) => JSON.stringify([x.i, x.st]));
    const right = { html: chart(s.states, s.forms), correct: true };
    const wrong = opts.map((x) => ({ html: chart(s.states.map((st, i) => (i === x.i ? x.st : st)), s.forms), correct: false, flag: x.flag, why: x.why }));
    return {
      title: s.ex.title, text: prompt(s), figure: s.ex.figure({}),
      ask: L(`Which bar charts show the energy in the states ${CIRCLED.slice(0, s.states.length).join(', ')}?`, `Welche Balkendiagramme zeigen die Energie in den Zuständen ${CIRCLED.slice(0, s.states.length).join(', ')}?`),
      options: shuffle(r, [right, ...wrong]),
      explain: explainTable(s, s.states.map((st, i) => s.forms.filter((k) => (st[k] || 0) > 1e-9).map((k) => reason[k](CIRCLED[i], true)).join(' ')).join(' ')),
      hints: [hintForms(), L('The total energy, the dashed line, is the same in every state.', 'Die Gesamtenergie, die gestrichelte Linie, ist in jedem Zustand gleich.')],
    };
  }

  // ---------------------------------------------------------------- forms of one state
  const setName = (set) => (set.length ? set.map((k) => `$${etex(k)}$`).join(', ') : '–');
  function forms(seed) {
    const r = rng(seed), s = situation(pick(r, SPRINGS), seed), i = Math.floor(r() * s.states.length), c = CIRCLED[i];
    const has = FORMS3.filter((k) => (s.states[i][k] || 0) > 1e-9);
    // the sets that differ by one form (or two), none empty
    const sets = [];
    for (let m = 1; m < 8; m++) {
      const set = FORMS3.filter((_, j) => m & (1 << j)), diff = FORMS3.filter((k) => set.includes(k) !== has.includes(k));
      if (diff.length) sets.push({ set, diff });
    }
    const near = shuffle(r, sets.filter((x) => x.diff.length === 1)), far = shuffle(r, sets.filter((x) => x.diff.length > 1));
    const wrong = [...near, ...far].slice(0, 3).map(({ set, diff }) => {
      const added = diff.find((k) => set.includes(k));
      return { html: setName(set), correct: false, flag: added ? ADDED[added] : 'forgot', why: diff.map((k) => reason[k](c, has.includes(k))).join(' ') };
    });
    return {
      title: s.ex.title, text: prompt(s), figure: s.ex.figure({ hl: new Set([i]) }),
      ask: L(`Which forms of energy are not zero in state ${c}?`, `Welche Energieformen sind im Zustand ${c} nicht null?`),
      options: shuffle(r, [{ html: setName(has), correct: true }, ...wrong]),
      explain: explainTable(s, FORMS3.map((k) => reason[k](c, has.includes(k))).join(' ')),
      hints: [hintForms()],
    };
  }

  // ---------------------------------------------------------------- the energy balance
  function balance(seed) {
    const r = rng(seed);
    for (let k = 0; ; k++) {
      const s = situation(pick(r, ALL), seed + k), n = s.en.length;
      // initial and final state, or (with three states) another pair
      const [a, b] = n === 3 && r() < 0.35 ? pick(r, [[0, 1], [1, 2]]) : [0, n - 1];
      const eq = (en) => `${sum(en[a])} = ${sum(en[b])}`, right = eq(s.en);
      const cand = slipsOf(s).filter((x) => x.i === a || x.i === b);
      const opts = three(r, cand.map((x) => ({ ...x, eq: eq(withSlip(s, x)) })).filter((x) => x.eq !== right), (x) => x.eq);
      if (opts.length < 3 && k < 50) continue;
      return {
        title: s.ex.title, text: prompt(s), figure: s.ex.figure({ hl: new Set([a, b]) }),
        ask: L(`Which equation is the energy balance $E_${a + 1} = E_${b + 1}$?`, `Welche Gleichung ist die Energiebilanz $E_${a + 1} = E_${b + 1}$?`),
        options: shuffle(r, [{ html: `$${right}$`, correct: true }, ...opts.map((x) => ({ html: `$${x.eq}$`, correct: false, flag: x.flag, why: x.why }))]),
        explain: explainTable(s, L(`Add up the energy of each state and set the sums equal: $${right}$. Only then solve for the wanted quantity, with symbols.`, `Addiere die Energie jedes Zustands und setze die Summen gleich: $${right}$. Erst dann nach der gesuchten Grösse auflösen, mit Symbolen.`)),
        hints: [hintForms(), L('Write the energy of each of the two states as a sum, then set the sums equal.', 'Schreibe die Energie jedes der beiden Zustände als Summe und setze die Summen gleich.')],
      };
    }
  }

  // ---------------------------------------------------------------- find the error
  function error(seed) {
    const r = rng(seed), s = situation(pick(r, ALL), seed), list = slipsOf(s);
    // kinetic energy at a turning point and heights from the wrong level come up more often
    const weighted = list.flatMap((x) => (x.flag === 'rest' || x.flag === 'level' ? [x, x] : [x]));
    const x = pick(r, weighted), en = withSlip(s, x);
    // three right entries, from other states first, not all of them zero
    const cells = shuffle(r, s.en.flatMap((_, i) => s.forms.map((k) => ({ i, k }))).filter((c) => !(c.i === x.i && c.k === x.k)));
    cells.sort((u, v) => (u.i === x.i) - (v.i === x.i) || !s.en[u.i][u.k] - !s.en[v.i][v.k]);
    const right = cells.slice(0, 3);
    const label = (i, k, tex) => `${CIRCLED[i]} $${etex(k)} = ${tex}$`;
    return {
      title: L('Find the error', 'Finde den Fehler'),
      text: `${prompt(s)}<p>${L('A student has filled in this energy table:', 'Ein Schüler hat diese Energietabelle ausgefüllt:')}</p>${tableHtml(s, en)}`,
      figure: s.ex.figure({}),
      ask: L('One entry of the table is wrong. Which one?', 'Ein Eintrag der Tabelle ist falsch. Welcher?'),
      options: shuffle(r, [{ html: label(x.i, x.k, x.tex), correct: true },
        ...right.map((c) => ({ html: label(c.i, c.k, cellTex(s, c.i, c.k)), correct: false, flag: 'table', why: reason[c.k](CIRCLED[c.i], !!s.en[c.i][c.k]) }))]),
      explain: () => `<div class="figs">${s.ex.solutionFigure()}</div><p>${L('Wrong', 'Falsch')}: ${label(x.i, x.k, x.tex)}. ${x.why}</p><p>${L('The right table:', 'Die richtige Tabelle:')}</p>${tableHtml(s, s.en, { i: x.i, k: x.k })}`,
      hints: [hintForms(), L('Check every entry against the drawing: is the body moving, how high is it above the zero level, is the spring stretched?', 'Prüfe jeden Eintrag an der Zeichnung: Bewegt sich der Körper, wie hoch ist er über dem Nullniveau, ist die Feder gedehnt?')],
    };
  }

  // ---------------------------------------------------------------- ratios
  const N = { 2: { en: 'twice', de: 'doppelt so' }, 3: { en: 'three times', de: 'dreimal so' } };
  const times = (n) => N[n][EC.getLang()];
  const FACTORS = (n) => [
    { id: 'sq', v: n * n, tex: String(n * n) }, { id: 'lin', v: n, tex: String(n) }, { id: 'root', v: Math.sqrt(n), tex: `\\sqrt{${n}}` },
    { id: 'cube', v: n * n * n, tex: String(n * n * n) }, { id: 'dbl', v: 2 * n, tex: String(2 * n) },
  ];
  // what changes n times, what is asked, the right factor ('sq', 'lin' or 'root') and why
  const SCALE = [
    { what: () => L((n) => `A spring is compressed ${times(n)} as far.`, (n) => `Eine Feder wird ${times(n)} weit zusammengedrückt.`), ask: () => L('By what factor does its elastic energy grow?', 'Um welchen Faktor wächst ihre Spannenergie?'),
      ans: 'sq', why: (n) => `E_{\\mathrm{S}} = \\tfrac{1}{2}\\,k\\,(${n}s)^2 = ${n * n}\\cdot\\tfrac{1}{2}\\,k\\,s^2` },
    { what: () => L((n) => `A spring launcher is compressed ${times(n)} as far before it shoots the same block across a smooth table.`, (n) => `Ein Federkatapult wird ${times(n)} weit gespannt, bevor es denselben Klotz über einen glatten Tisch schiesst.`), ask: () => L('By what factor does the launch speed grow?', 'Um welchen Faktor wächst die Abschussgeschwindigkeit?'),
      ans: 'lin', why: (n) => `\\tfrac{1}{2}\\,m\\,v^2 = \\tfrac{1}{2}\\,k\\,s^2 \\;\\Rightarrow\\; v = s\\sqrt{k/m} \\propto s:\\; ${n}s \\to ${n}v` },
    { what: () => L((n) => `A ball is shot straight up by a spring compressed ${times(n)} as far.`, (n) => `Ein Ball wird von einer Feder senkrecht hochgeschossen, die ${times(n)} weit zusammengedrückt ist.`), ask: () => L('By what factor does the height it reaches grow (measured from where it starts)?', 'Um welchen Faktor wächst die Höhe, die er erreicht (ab dem Startpunkt gemessen)?'),
      ans: 'sq', why: (n) => `m\\,g\\,h = \\tfrac{1}{2}\\,k\\,s^2 \\;\\Rightarrow\\; h \\propto s^2:\\; ${n}s \\to ${n * n}h` },
    { what: () => L((n) => `A ball is thrown straight up ${times(n)} as fast.`, (n) => `Ein Ball wird ${times(n)} schnell senkrecht hochgeworfen.`), ask: () => L('By what factor does the height it reaches grow?', 'Um welchen Faktor wächst die Höhe, die er erreicht?'),
      ans: 'sq', why: (n) => `m\\,g\\,h = \\tfrac{1}{2}\\,m\\,v_0^2 \\;\\Rightarrow\\; h \\propto v_0^2:\\; ${n}v_0 \\to ${n * n}h` },
    { what: () => L((n) => `A ball is dropped from ${n === 2 ? 'twice' : 'three times'} the height.`, (n) => `Ein Ball wird aus der ${n === 2 ? 'doppelten' : 'dreifachen'} Höhe fallen gelassen.`), ask: () => L('By what factor does its speed at the ground grow?', 'Um welchen Faktor wächst seine Geschwindigkeit am Boden?'),
      ans: 'root', why: (n) => `\\tfrac{1}{2}\\,m\\,v^2 = m\\,g\\,h \\;\\Rightarrow\\; v = \\sqrt{2\\,g\\,h} \\propto \\sqrt{h}:\\; ${n}h \\to \\sqrt{${n}}\\,v` },
    { what: () => L((n) => `A cart runs into a spring buffer ${times(n)} as fast.`, (n) => `Ein Wagen fährt ${times(n)} schnell auf einen Federpuffer.`), ask: () => L('By what factor does the largest compression of the buffer grow?', 'Um welchen Faktor wächst die grösste Stauchung des Puffers?'),
      ans: 'lin', why: (n) => `\\tfrac{1}{2}\\,k\\,s^2 = \\tfrac{1}{2}\\,m\\,v^2 \\;\\Rightarrow\\; s = v\\sqrt{m/k} \\propto v:\\; ${n}v \\to ${n}s` },
  ];
  function scale(seed) {
    const r = rng(seed), t = pick(r, SCALE), n = pick(r, [2, 3]), all = FACTORS(n), right = all.find((f) => f.id === t.ans);
    const others = shuffle(r, all.filter((f, j) => f.v !== right.v && all.findIndex((g) => g.v === f.v) === j));
    // the wrong idea first: energy proportional to the compression or speed, or the square once too often
    const first = { sq: 'lin', lin: 'sq', root: 'lin' }[t.ans];
    others.sort((a, b) => (b.id === first) - (a.id === first));
    const flag = (f) => (f.id === first ? (t.ans === 'lin' ? 'square' : 'linear') : 'ratio');
    const opt = (f) => L(`$${f.tex}$ times`, `$${f.tex}$-mal`);
    const why = `$${t.why(n)}$`;
    return {
      title: L('Ratios', 'Verhältnisse'), text: `<p>${t.what()(n)}</p>`, figure: '', ask: t.ask(),
      options: shuffle(r, [{ html: opt(right), correct: true }, ...others.slice(0, 3).map((f) => ({ html: opt(f), correct: false, flag: flag(f), why: L(`The energy grows with the square of the speed and of the compression: ${why}.`, `Die Energie wächst mit dem Quadrat der Geschwindigkeit und der Stauchung: ${why}.`) }))]),
      explain: () => `<p>${L('Set up the energy balance with symbols and see how the wanted quantity depends on the changed one:', 'Stelle die Energiebilanz mit Symbolen auf und schau, wie die gesuchte Grösse von der veränderten abhängt:')}</p><p>${why}</p>`,
      hints: [L('Write the energy balance with symbols first; then put in the changed quantity.', 'Schreibe zuerst die Energiebilanz mit Symbolen auf; setze dann die veränderte Grösse ein.'), L('Kinetic and elastic energy grow with the square: ½ m v², ½ k s².', 'Kinetische und Spannenergie wachsen mit dem Quadrat: ½ m v², ½ k s².')],
    };
  }

  // ---------------------------------------------------------------- the path does not matter
  // a question of fixed options: { title, text, ask, right, wrong: [[html, flag, why]], explain }
  const choice = (r, q) => ({
    title: q.title, text: q.text, figure: q.figure || '', ask: q.ask,
    options: shuffle(r, [{ html: q.right, correct: true }, ...q.wrong.map(([html, flag, why]) => ({ html, correct: false, flag, why }))]),
    explain: () => q.explain, hints: q.hints || [],
  });
  const PATH_EXPLAIN = () => L('Lifting work changes the potential energy, and that depends only on the height: $W = m\\,g\\,h$ on every path. On a ramp $n$ times as long as it is high, the force needed is $n$ times smaller, $m\\,g/n$, but it acts over an $n$ times longer path: $W = \\frac{m\\,g}{n}\\cdot n\\,h = m\\,g\\,h$.',
    'Die Hubarbeit ändert die Lageenergie, und die hängt nur von der Höhe ab: $W = m\\,g\\,h$ auf jedem Weg. Auf einer Rampe, die $n$-mal so lang wie hoch ist, braucht es eine $n$-mal kleinere Kraft, $m\\,g/n$, aber über einen $n$-mal längeren Weg: $W = \\frac{m\\,g}{n}\\cdot n\\,h = m\\,g\\,h$.');
  function path(seed) {
    const r = rng(seed), v = Math.floor(r() * 3);
    const hints = [L('What changes between the start and the end? Only that counts in the energy balance.', 'Was ändert sich zwischen Anfang und Ende? Nur das zählt in der Energiebilanz.')];
    if (v === 0) {
      const n = pick(r, [2, 3, 4, 5]);
      return choice(r, {
        title: L('Lifting work', 'Hubarbeit'), hints,
        text: L(`<p>A crate of mass $m$ is raised by a height $h$, once lifted straight up (work $W_A$), once pushed slowly up a smooth ramp ${n} times as long as it is high (work $W_B$).</p>`, `<p>Eine Kiste der Masse $m$ wird um die Höhe $h$ angehoben, einmal senkrecht hochgehoben (Arbeit $W_A$), einmal langsam eine glatte Rampe hinaufgeschoben, die ${n}-mal so lang wie hoch ist (Arbeit $W_B$).</p>`),
        ask: L('How do the two works compare?', 'Wie verhalten sich die beiden Arbeiten?'),
        right: '$W_B = W_A = m\\,g\\,h$',
        wrong: [[`$W_B = ${n}\\,W_A$`, 'path', L('The path is longer, but the force needed on the ramp is smaller by the same factor.', 'Der Weg ist länger, aber die nötige Kraft auf der Rampe ist um denselben Faktor kleiner.')],
          [`$W_B = \\tfrac{1}{${n}}\\,W_A$`, 'path', L('The force is smaller, but it acts over a longer path, by the same factor.', 'Die Kraft ist kleiner, aber sie wirkt über einen längeren Weg, um denselben Faktor.')],
          ['$W_B = 0$', 'other', L('The ramp carries part of the weight, but the crate still gains the potential energy m g h.', 'Die Rampe trägt einen Teil des Gewichts, aber die Kiste gewinnt trotzdem die Lageenergie m g h.')]],
        explain: `<p>${PATH_EXPLAIN()}</p>`,
      });
    }
    if (v === 1) {
      const [a, b] = pick(r, [[L('a steep slide', 'eine steile Rutsche'), L('a gentle one', 'eine flache')], [L('a straight slide', 'eine gerade Rutsche'), L('a curved one', 'eine gekrümmte')], [L('a short, steep slide', 'eine kurze, steile Rutsche'), L('a long, gentle one', 'eine lange, flache')]]);
      return choice(r, {
        title: L('Two slides', 'Zwei Rutschen'), hints,
        text: L(`<p>Two children start at rest from the same height $h$, one down ${a}, the other down ${b}. Friction is negligible.</p>`, `<p>Zwei Kinder starten in Ruhe auf derselben Höhe $h$, eines auf ${a}, das andere auf ${b}. Die Reibung ist vernachlässigbar.</p>`),
        ask: L('How fast are they at the bottom?', 'Wie schnell sind sie unten?'),
        right: L('Equally fast: $v = \\sqrt{2\\,g\\,h}$ for both', 'Gleich schnell: $v = \\sqrt{2\\,g\\,h}$ für beide'),
        wrong: [[L('The one on the steeper or straighter slide is faster', 'Das Kind auf der steileren oder geraderen Rutsche ist schneller'), 'path', L('It gets there sooner, but not faster: only the height counts.', 'Es ist früher unten, aber nicht schneller: Nur die Höhe zählt.')],
          [L('The one on the longer slide is faster: it speeds up for longer', 'Das Kind auf der längeren Rutsche ist schneller: Es beschleunigt länger'), 'path', L('On the longer slide it speeds up for longer, but more gently: only the height counts.', 'Auf der längeren Rutsche beschleunigt es länger, aber schwächer: Nur die Höhe zählt.')],
          [L('The heavier child is faster', 'Das schwerere Kind ist schneller'), 'other', L('The mass cancels out: $m\\,g\\,h = \\tfrac{1}{2}\\,m\\,v^2$.', 'Die Masse kürzt sich weg: $m\\,g\\,h = \\tfrac{1}{2}\\,m\\,v^2$.')]],
        explain: `<p>${L('$E_1 = E_2$: $m\\,g\\,h = \\tfrac{1}{2}\\,m\\,v^2$, so $v = \\sqrt{2\\,g\\,h}$ on every slide. The shape decides how long the ride takes, not the speed at the bottom.', '$E_1 = E_2$: $m\\,g\\,h = \\tfrac{1}{2}\\,m\\,v^2$, also $v = \\sqrt{2\\,g\\,h}$ auf jeder Rutsche. Die Form bestimmt, wie lange die Fahrt dauert, nicht die Geschwindigkeit unten.')}</p>`,
      });
    }
    return choice(r, {
      title: L('Lifting work', 'Hubarbeit'), hints,
      text: `<p>${L('Without friction, the work needed to lift a body by a height $h$ is $m\\,g\\,h$, whatever the path.', 'Ohne Reibung ist die Arbeit, um einen Körper um die Höhe $h$ anzuheben, $m\\,g\\,h$, egal auf welchem Weg.')}</p>`,
      ask: L('Why does the path not matter?', 'Warum spielt der Weg keine Rolle?'),
      right: L('The work becomes potential energy, which depends only on the height; on a longer path the force needed is smaller by the same factor', 'Die Arbeit wird zu Lageenergie, die nur von der Höhe abhängt; auf einem längeren Weg ist die nötige Kraft um denselben Faktor kleiner'),
      wrong: [[L('The force is the same, m g, on every path', 'Die Kraft ist auf jedem Weg gleich, m g'), 'path', L('On a ramp the force needed is smaller than m g; the path is longer.', 'Auf einer Rampe ist die nötige Kraft kleiner als m g; dafür ist der Weg länger.')],
        [L('The path is the same length on every route', 'Der Weg ist auf jeder Route gleich lang'), 'path', L('The paths differ in length; the force differs too, by the inverse factor.', 'Die Wege sind verschieden lang; die Kraft unterscheidet sich auch, um den umgekehrten Faktor.')],
        [L('Work does not depend on the force', 'Die Arbeit hängt nicht von der Kraft ab'), 'other', L('Work is force times path: both change on a ramp, and their product stays m g h.', 'Arbeit ist Kraft mal Weg: Beide ändern sich auf einer Rampe, und ihr Produkt bleibt m g h.')]],
      explain: `<p>${PATH_EXPLAIN()}</p>`,
    });
  }

  // ---------------------------------------------------------------- friction
  const FR = [[1, 4], [1, 3], [1, 2], [2, 3], [3, 4]];
  const ftex = (n, d) => (n === 0 ? '0' : n === d ? '' : `\\tfrac{${n}}{${d}}\\,`);
  function friction(seed) {
    const r = rng(seed);
    const hints = [L('Energy is not lost: what the sled lacks at the bottom has gone somewhere else.', 'Energie geht nicht verloren: Was dem Schlitten unten fehlt, steckt anderswo.')];
    if (r() < 0.45) {
      return choice(r, {
        title: L('Friction', 'Reibung'), hints,
        text: L('<p>A sled starts at rest at a height $h$ and slides down a slope with friction. At the bottom its kinetic energy is less than $m\\,g\\,h$.</p>', '<p>Ein Schlitten startet in Ruhe auf der Höhe $h$ und gleitet mit Reibung einen Hang hinunter. Unten ist seine kinetische Energie kleiner als $m\\,g\\,h$.</p>'),
        ask: L('Where has the rest of the energy gone?', 'Wo ist der Rest der Energie?'),
        right: L('Into thermal energy: the work done by friction warms the runners and the snow', 'In thermische Energie: Die Reibungsarbeit erwärmt die Kufen und den Schnee'),
        wrong: [[L('Nowhere: friction destroys it', 'Nirgends: Die Reibung vernichtet sie'), 'lost', L('Energy is never destroyed: friction turns it into thermal energy.', 'Energie wird nie vernichtet: Die Reibung wandelt sie in thermische Energie um.')],
          [L('It is still stored as potential energy in the sled', 'Sie ist noch als Lageenergie im Schlitten gespeichert'), 'other', L('At the bottom the sled is at the zero level: it has no potential energy left.', 'Unten ist der Schlitten auf dem Nullniveau: Er hat keine Lageenergie mehr.')],
          [L('It was never there: on a slope the potential energy is only $m\\,g\\,h\\sin\\alpha$', 'Sie war nie da: Auf einem Hang ist die Lageenergie nur $m\\,g\\,h\\sin\\alpha$'), 'path', L('The potential energy is m g h, whatever the slope: only the height counts.', 'Die Lageenergie ist m g h, egal wie steil der Hang ist: Nur die Höhe zählt.')]],
        explain: `<p>${L('The energy balance with friction: $m\\,g\\,h = \\tfrac{1}{2}\\,m\\,v^2 + E_{\\mathrm{th}}$. The work done by friction, $E_{\\mathrm{th}}$, is the thermal energy of runners and snow: the total energy stays the same.', 'Die Energiebilanz mit Reibung: $m\\,g\\,h = \\tfrac{1}{2}\\,m\\,v^2 + E_{\\mathrm{th}}$. Die Reibungsarbeit, $E_{\\mathrm{th}}$, ist die thermische Energie von Kufen und Schnee: Die Gesamtenergie bleibt gleich.')}</p>`,
      });
    }
    const [n, d] = pick(r, FR), e = (k) => `$${ftex(k, d)}m\\,g\\,h$`;
    const cand = [[d - n, 'right'], [n, 'swap'], [0, 'lost'], [d, 'all'], [d + n, 'sum']];
    const seen = new Set([d - n]), wrong = [];
    for (const [k, tag] of cand.slice(1)) if (!seen.has(k) && wrong.length < 3) { seen.add(k); wrong.push([k, tag]); }
    const WHY = {
      swap: L('That is the kinetic energy at the bottom; the thermal energy is the rest of m g h.', 'Das ist die kinetische Energie unten; die thermische Energie ist der Rest von m g h.'),
      lost: L('Energy is not lost: what is missing from the kinetic energy has become thermal energy.', 'Energie geht nicht verloren: Was der kinetischen Energie fehlt, ist thermische Energie geworden.'),
      all: L('Not all of m g h: part of it is the kinetic energy at the bottom.', 'Nicht das ganze m g h: Ein Teil davon ist die kinetische Energie unten.'),
      sum: L('The thermal energy and the kinetic energy at the bottom add up to m g h, not more.', 'Thermische und kinetische Energie unten ergeben zusammen m g h, nicht mehr.'),
    };
    return choice(r, {
      title: L('Friction', 'Reibung'), hints,
      text: L(`<p>A sled starts at rest at a height $h$ and slides down a slope with friction. At the bottom its kinetic energy is only ${e(n)}.</p>`, `<p>Ein Schlitten startet in Ruhe auf der Höhe $h$ und gleitet mit Reibung einen Hang hinunter. Unten hat er nur noch die kinetische Energie ${e(n)}.</p>`),
      ask: L('How much thermal energy has friction produced?', 'Wie viel thermische Energie hat die Reibung erzeugt?'),
      right: e(d - n),
      wrong: wrong.map(([k, tag]) => [e(k), tag === 'lost' ? 'lost' : 'other', WHY[tag]]),
      explain: `<p>${L('The energy balance with friction', 'Die Energiebilanz mit Reibung')}: $m\\,g\\,h = ${ftex(n, d)}m\\,g\\,h + E_{\\mathrm{th}}$, ${L('so', 'also')} $E_{\\mathrm{th}} = ${ftex(d - n, d)}m\\,g\\,h$.</p>`,
    });
  }

  // ---------------------------------------------------------------- turning point and equilibrium
  const EQ_EXPLAIN = () => L('At the lowest point the jumper is at rest for an instant ($v = 0$, all the energy is in the rope) and the rope pulls harder than the weight: the jumper turns round. Where the rope pulls exactly as hard as the weight, $k\\,x_0 = m\\,g$, the jumper stops speeding up: there the speed is largest. That equilibrium position lies above the lowest point.',
    'Im tiefsten Punkt ruht die Springerin für einen Augenblick ($v = 0$, die ganze Energie steckt im Seil), und das Seil zieht stärker als die Gewichtskraft: Sie kehrt um. Wo das Seil genau so stark zieht wie die Gewichtskraft, $k\\,x_0 = m\\,g$, wird sie nicht mehr schneller: Dort ist die Geschwindigkeit am grössten. Diese Gleichgewichtslage liegt über dem tiefsten Punkt.');
  function turn(seed) {
    const r = rng(seed), s = situation('bungee', seed), v = Math.floor(r() * 3);
    const base = { title: L('Bungee jump', 'Bungee-Sprung'), text: `<p>${L('A bungee jumper steps off a bridge: free fall until ②, where the rope starts to stretch; at ③ the jumper is at the lowest point.', 'Eine Bungee-Springerin lässt sich von einer Brücke fallen: freier Fall bis ②, wo sich das Seil zu dehnen beginnt; in ③ ist sie im tiefsten Punkt.')}</p>`,
      figure: s.ex.figure({}), explain: `<p>${EQ_EXPLAIN()}</p>`, hints: [L('Where does the rope pull harder than the weight, and where less?', 'Wo zieht das Seil stärker als die Gewichtskraft, wo schwächer?')] };
    if (v === 0) return choice(r, { ...base,
      ask: L('Where is the jumper fastest?', 'Wo ist die Springerin am schnellsten?'),
      right: L('Between ② and ③, where the rope pulls as hard as the weight ($k\\,x = m\\,g$)', 'Zwischen ② und ③, wo das Seil so stark zieht wie die Gewichtskraft ($k\\,x = m\\,g$)'),
      wrong: [[L('At ②, where the rope starts to stretch', 'In ②, wo sich das Seil zu dehnen beginnt'), 'stretch', L('Just below ② the rope still pulls less than the weight: the jumper keeps speeding up.', 'Knapp unter ② zieht das Seil noch schwächer als die Gewichtskraft: Die Springerin wird noch schneller.')],
        [L('At ③, the lowest point', 'In ③, im tiefsten Punkt'), 'turn', L('At the lowest point the jumper turns round: the speed is zero there.', 'Im tiefsten Punkt kehrt die Springerin um: Dort ist die Geschwindigkeit null.')],
        [L('Halfway between ① and ③', 'In der Mitte zwischen ① und ③'), 'other', L('The jumper speeds up as long as the weight is larger than the pull of the rope, which is below ②.', 'Die Springerin wird schneller, solange die Gewichtskraft grösser ist als der Zug des Seils, also bis unter ②.')]] });
    if (v === 1) return choice(r, { ...base,
      ask: L('What holds at the lowest point ③?', 'Was gilt im tiefsten Punkt ③?'),
      right: L('$v = 0$, and the rope pulls harder than the weight', '$v = 0$, und das Seil zieht stärker als die Gewichtskraft'),
      wrong: [[L('$v = 0$, and the rope pulls as hard as the weight', '$v = 0$, und das Seil zieht so stark wie die Gewichtskraft'), 'equil', L('Then the jumper would stay there. The lowest point is not the equilibrium: the rope pulls harder, and the jumper goes back up.', 'Dann bliebe die Springerin dort. Der tiefste Punkt ist nicht die Gleichgewichtslage: Das Seil zieht stärker, und sie geht wieder hoch.')],
        [L('The speed is largest', 'Die Geschwindigkeit ist am grössten'), 'turn', L('At the lowest point the jumper turns round: v = 0.', 'Im tiefsten Punkt kehrt die Springerin um: v = 0.')],
        [L('The elastic energy is zero', 'Die Spannenergie ist null'), 'forgot', L('The rope is stretched most there: all the energy is elastic energy.', 'Das Seil ist dort am stärksten gedehnt: Die ganze Energie ist Spannenergie.')]] });
    return choice(r, { ...base,
      ask: L('What holds where the rope pulls as hard as the weight ($k\\,x_0 = m\\,g$)?', 'Was gilt dort, wo das Seil so stark zieht wie die Gewichtskraft ($k\\,x_0 = m\\,g$)?'),
      right: L('The speed is largest; the jumper passes through', 'Die Geschwindigkeit ist am grössten; die Springerin fliegt durch'),
      wrong: [[L('The jumper is at rest: $v = 0$', 'Die Springerin ruht: $v = 0$'), 'equil', L('v = 0 only at the turning points. In the equilibrium position the jumper stops speeding up, at the largest speed.', 'v = 0 nur in den Umkehrpunkten. In der Gleichgewichtslage wird die Springerin nicht mehr schneller, sie hat dort die grösste Geschwindigkeit.')],
        [L('It is the lowest point of the jump', 'Es ist der tiefste Punkt des Sprungs'), 'equil', L('The jumper passes it with the largest speed and goes on down to the lowest point.', 'Die Springerin passiert sie mit der grössten Geschwindigkeit und sinkt weiter bis zum tiefsten Punkt.')],
        [L('The rope is not stretched yet', 'Das Seil ist noch nicht gedehnt'), 'stretch', L('A slack rope does not pull; at the equilibrium it is stretched by $x_0 = m\\,g/k$.', 'Ein schlaffes Seil zieht nicht; in der Gleichgewichtslage ist es um $x_0 = m\\,g/k$ gedehnt.')]] });
  }
  function hang(seed) {
    const r = rng(seed), s = situation('spring-hang', seed), v = Math.floor(r() * 3);
    const why = L('From the energy: $m\\,g\\,s = \\tfrac{1}{2}\\,k\\,s^2$, so $k = \\frac{2\\,m\\,g}{s}$. At rest: $k\\,x_0 = m\\,g$, so $x_0 = \\frac{m\\,g}{k} = \\tfrac{1}{2}\\,s$. The block swings about the equilibrium, from $0$ down to $s = 2\\,x_0$ and back; it is fastest at $x_0$.',
      'Aus der Energie: $m\\,g\\,s = \\tfrac{1}{2}\\,k\\,s^2$, also $k = \\frac{2\\,m\\,g}{s}$. In Ruhe: $k\\,x_0 = m\\,g$, also $x_0 = \\frac{m\\,g}{k} = \\tfrac{1}{2}\\,s$. Der Klotz schwingt um die Gleichgewichtslage, von $0$ bis $s = 2\\,x_0$ hinunter und zurück; bei $x_0$ ist er am schnellsten.');
    const base = { title: L('A block on a spring', 'Ein Klotz an der Feder'), figure: '', explain: `<p>${why}</p>`,
      hints: [L('Lowest point: energy, $m\\,g\\,s = \\tfrac{1}{2}\\,k\\,s^2$. At rest: forces, $k\\,x_0 = m\\,g$.', 'Tiefster Punkt: Energie, $m\\,g\\,s = \\tfrac{1}{2}\\,k\\,s^2$. In Ruhe: Kräfte, $k\\,x_0 = m\\,g$.')] };
    const start = L('<p>A block hangs on a relaxed spring and is released from rest. It drops by $s$ to its lowest point and turns round there.</p>', '<p>Ein Klotz hängt an einer entspannten Feder und wird aus der Ruhe losgelassen. Er sinkt um $s$ bis zum tiefsten Punkt und kehrt dort um.</p>');
    if (v === 0) return choice(r, { ...base, text: start, figure: s.ex.figure({}),
      ask: L('How far below the start would the block hang at rest?', 'Wie weit unter dem Start würde der Klotz in Ruhe hängen?'),
      right: '$\\tfrac{1}{2}\\,s$',
      wrong: [['$s$', 'equil', L('The lowest point is not the equilibrium: there the spring pulls with 2 m g, twice the weight.', 'Der tiefste Punkt ist nicht die Ruhelage: Dort zieht die Feder mit 2 m g, doppelt so stark wie die Gewichtskraft.')],
        ['$\\tfrac{1}{4}\\,s$', 'other', L('At rest k x₀ = m g with k = 2 m g/s, so x₀ = s/2.', 'In Ruhe gilt k x₀ = m g mit k = 2 m g/s, also x₀ = s/2.')],
        ['$\\tfrac{1}{\\sqrt{2}}\\,s$', 'other', L('The spring force grows in proportion to the stretch: k x₀ = m g gives x₀ = s/2.', 'Die Federkraft wächst proportional zur Dehnung: k x₀ = m g ergibt x₀ = s/2.')]] });
    if (v === 1) return choice(r, { ...base, text: start, figure: s.ex.figure({}),
      ask: L('Where is the block fastest?', 'Wo ist der Klotz am schnellsten?'),
      right: L('$\\tfrac{1}{2}\\,s$ below the start, where the spring pulls as hard as the weight', '$\\tfrac{1}{2}\\,s$ unter dem Start, wo die Feder so stark zieht wie die Gewichtskraft'),
      wrong: [[L('At the lowest point, $s$ below the start', 'Im tiefsten Punkt, $s$ unter dem Start'), 'turn', L('The block turns round there: v = 0.', 'Dort kehrt der Klotz um: v = 0.')],
        [L('Just after the release', 'Gleich nach dem Loslassen'), 'other', L('It starts from rest and speeds up as long as the weight is larger than the spring force.', 'Er startet aus der Ruhe und wird schneller, solange die Gewichtskraft grösser ist als die Federkraft.')],
        [L('$\\tfrac{1}{4}\\,s$ below the start', '$\\tfrac{1}{4}\\,s$ unter dem Start'), 'other', L('There the spring pulls less than the weight: the block is still speeding up.', 'Dort zieht die Feder schwächer als die Gewichtskraft: Der Klotz wird noch schneller.')]] });
    return choice(r, { ...base,
      text: L('<p>A block hangs at rest on a spring, which is stretched by $x_0$. It is lifted until the spring is relaxed and released from rest there.</p>', '<p>Ein Klotz hängt in Ruhe an einer Feder, die um $x_0$ gedehnt ist. Er wird angehoben, bis die Feder entspannt ist, und dort aus der Ruhe losgelassen.</p>'),
      ask: L('How far does it drop before it turns round?', 'Wie weit sinkt er, bevor er umkehrt?'),
      right: '$2\\,x_0$',
      wrong: [['$x_0$', 'equil', L('At x₀ it passes the equilibrium with its largest speed and drops further.', 'Bei x₀ passiert er die Ruhelage mit der grössten Geschwindigkeit und sinkt weiter.')],
        ['$4\\,x_0$', 'other', L('Energy: m g s = ½ k s² with k = m g/x₀ gives s = 2 x₀.', 'Energie: m g s = ½ k s² mit k = m g/x₀ ergibt s = 2 x₀.')],
        ['$\\sqrt{2}\\,x_0$', 'other', L('Energy: m g s = ½ k s² with k = m g/x₀ gives s = 2 x₀.', 'Energie: m g s = ½ k s² mit k = m g/x₀ ergibt s = 2 x₀.')]] });
  }

  const KINDS = { bars, forms, balance, error, scale, path, friction, turn, hang };
  const DIFFICULTY = { bars: 2, forms: 2, balance: 3, error: 3, scale: 3, path: 2, friction: 3, turn: 4, hang: 4 };
  const question = (kind, seed) => KINDS[kind](seed);

  // A choice exercise of practice: the question, its hints and its explanation as the solution.
  function exercise(kind, seed) {
    const q = question(kind, seed);
    return {
      choice: true, scenario: kind, difficulty: DIFFICULTY[kind], formal: true, seed,
      title: q.title, text: q.text, ask: q.ask, options: q.options,
      figure: () => q.figure, solutionFigure: () => '', hints: q.hints,
      solution: [q.explain()], results: q.options.find((o) => o.correct).html,
      key: `${q.title}|${q.text}|${q.ask}|${q.options.map((o) => o.html).join('|')}`,
    };
  }

  // ---------------------------------------------------------------- the tutor's example
  // Find the error: a student's energy table of the bungee jump, checked entry by entry.
  function errorLesson() {
    const s = situation('bungee', 7), slip = slipsOf(s).find((x) => x.flag === 'rest' && x.i === 2);
    const level = (s.scn.slips(s.p))[0];
    const wrong = withSlip(s, slip), fig = s.ex.figure({});
    const bars = s.ex.figure({ bars: null });
    const frame = (rule, text, figure) => ({ text: `<p class="step-rule">${rule}</p>${text}`, figure });
    return [
      frame(L('The student’s table', 'Die Tabelle des Schülers'), `${prompt(s)}<p>${L('A student has filled in the energy table of the jump. One entry is wrong: which one?', 'Ein Schüler hat die Energietabelle des Sprungs ausgefüllt. Ein Eintrag ist falsch: welcher?')}</p>${tableHtml(s, wrong)}`, fig),
      frame(L('Check systematically', 'Systematisch prüfen'), `<p>${L('Check every state against the drawing, one form at a time:', 'Prüfe jeden Zustand an der Zeichnung, eine Energieform nach der anderen:')}</p><ul><li>${L('Is the body moving? Then it has kinetic energy, else none.', 'Bewegt sich der Körper? Dann hat er kinetische Energie, sonst keine.')}</li><li>${L('How high is it above the zero level? That height goes into $m\\,g\\,h$.', 'Wie hoch ist er über dem Nullniveau? Diese Höhe gehört in $m\\,g\\,h$.')}</li><li>${L('Is the spring (the rope) stretched? By how much?', 'Ist die Feder (das Seil) gedehnt? Um wie viel?')}</li></ul>`, fig),
      frame('①, ②', `<p>${L('① The jumper is at rest on the bridge, $\\ell + s$ above the lowest point; the rope is slack: only $m\\,g\\,(\\ell + s)$. ② After the free fall: moving, $s$ above the lowest point, rope still slack: $m\\,g\\,s + \\tfrac{1}{2}\\,m\\,v^2$. Both rows are right.', '① Die Springerin ruht auf der Brücke, $\\ell + s$ über dem tiefsten Punkt; das Seil ist schlaff: nur $m\\,g\\,(\\ell + s)$. ② Nach dem freien Fall: in Bewegung, $s$ über dem tiefsten Punkt, Seil noch schlaff: $m\\,g\\,s + \\tfrac{1}{2}\\,m\\,v^2$. Beide Zeilen stimmen.')}</p>${tableHtml(s, wrong)}`, bars),
      frame('③', `<p>${L('③ is the lowest point, a turning point: $v = 0$, so the kinetic energy is zero. The student’s ③ has $\\tfrac{1}{2}\\,m\\,v^2$ in it: that is the error. All the energy is in the rope there.', '③ ist der tiefste Punkt, ein Umkehrpunkt: $v = 0$, die kinetische Energie ist also null. In der Zeile ③ des Schülers steht $\\tfrac{1}{2}\\,m\\,v^2$: Das ist der Fehler. Die ganze Energie steckt dort im Seil.')}</p>${tableHtml(s, s.en, { i: slip.i, k: slip.k })}`, bars),
      frame(L('Another typical error', 'Ein anderer typischer Fehler'), `<p>${L(`Measuring a height from the wrong level: $${level.tex}$ in ① would count the height above ②, where the rope starts to stretch. The zero level is the lowest point, so ① is $\\ell + s$ above it. Choose the zero level once and measure every height from it.`, `Eine Höhe vom falschen Niveau aus messen: $${level.tex}$ in ① zählte die Höhe über ②, wo sich das Seil zu dehnen beginnt. Das Nullniveau ist der tiefste Punkt, ① liegt also $\\ell + s$ darüber. Wähle das Nullniveau einmal und miss jede Höhe von ihm aus.`)}</p>`, fig),
    ];
  }

  // ---------------------------------------------------------------- the check
  // The learning objectives, each with its question kinds, worked example and practice topic
  // (lessons.js).
  const OBJECTIVES = [
    { id: 'forms', kinds: ['bars', 'forms'], tutor: 0, topic: 0,
      name: () => L('Identify the forms of energy (kinetic, gravitational, elastic) in the initial and the final state, and show them in bar charts.', 'Die Energieformen (kinetische, Lage- und Spannenergie) im Anfangs- und im Endzustand erkennen und in Balkendiagrammen darstellen.') },
    { id: 'balance', kinds: ['balance', 'scale'], tutor: 1, topic: 1,
      name: () => L('Set up the energy balance of two states and solve it with symbols before inserting numbers, e.g. to see how a height or speed scales.', 'Die Energiebilanz zweier Zustände aufstellen und mit Symbolen auflösen, bevor Zahlen eingesetzt werden, z. B. um zu sehen, wie eine Höhe oder Geschwindigkeit skaliert.') },
    { id: 'path', kinds: ['path', 'friction'], tutor: 2, topic: 2,
      name: () => L('Explain why lifting work does not depend on the path, and where the work done by friction goes.', 'Erklären, warum die Hubarbeit nicht vom Weg abhängt und wohin die Reibungsarbeit geht.') },
    { id: 'turn', kinds: ['turn', 'hang'], tutor: 5, topic: 5,
      name: () => L('Tell the turning point of a bungee jump or a spring (v = 0) from its equilibrium position (largest speed).', 'Den Umkehrpunkt eines Bungee-Sprungs oder einer Feder (v = 0) von der Gleichgewichtslage (grösste Geschwindigkeit) unterscheiden.') },
    { id: 'error', kinds: ['error'], tutor: 7, topic: 7,
      name: () => L('Find the wrong entry in an energy table.', 'Den falschen Eintrag in einer Energietabelle finden.') },
  ];
  const CHECK = {
    id: 'ec',
    objectives: OBJECTIVES,
    question,
    concept: { rest: 'rest', level: 'level', relaxed: 'relaxed', forgot: 'forgot', linear: 'linear', path: 'path', lost: 'lost', equil: 'equil', turn: 'equil', stretch: 'stretch' },
    concepts: () => ({
      rest: L('kinetic energy where the body is at rest (a turning point)', 'kinetische Energie, wo der Körper ruht (in einem Umkehrpunkt)'),
      level: L('a height not measured from the zero level', 'eine Höhe nicht vom Nullniveau aus gemessen'),
      relaxed: L('elastic energy in a relaxed spring', 'Spannenergie in einer entspannten Feder'),
      forgot: L('a form of energy overlooked', 'eine Energieform übersehen'),
      linear: L('energy taken as proportional to the speed or the compression, not to its square', 'Energie proportional zur Geschwindigkeit oder Stauchung statt zu deren Quadrat'),
      path: L('the work or the speed taken to depend on the path', 'Arbeit oder Geschwindigkeit hängen angeblich vom Weg ab'),
      lost: L('energy taken as destroyed by friction', 'Energie wird angeblich durch Reibung vernichtet'),
      equil: L('the turning point (v = 0) taken for the equilibrium position (largest speed)', 'den Umkehrpunkt (v = 0) mit der Gleichgewichtslage (grösste Geschwindigkeit) verwechselt'),
      stretch: L('the rope taken to brake as soon as it starts to stretch', 'das Seil bremst angeblich, sobald es sich zu dehnen beginnt'),
    }),
  };

  root.EnergyConcepts = { KINDS: Object.keys(KINDS), question, exercise, errorLesson, tableHtml, CHECK };
  if (typeof module !== 'undefined') module.exports = root.EnergyConcepts;
})(typeof window !== 'undefined' ? window : globalThis);
