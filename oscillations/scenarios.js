// The exercise types of the app. Each:
//   { id, difficulty, title(p), make(r) → parameters p (or null: draw again), solve(p, o) → values v
//     (SI; with a flag of traps set in o: the result of that wrong idea), traps: [flag],
//     why: { flag: () => text }, fields(p, v) → [field], text(p), hints(p, v), steps(p, v) → [{ text,
//     show: [keys] }], figure(p, v, view) }
// A field is a number { key, type: 'num', sym, unit, what, signed } (its value in the unit), or a
// choice { key, type: 'choice', what, ask (for the arcade), options: [[value, html, why, flag]],
// after (shown once the field of that key is right), pics (the options are graphs) }; the value of
// a choice comes from v[key].
// view: { task: true } the task; { show: Set } the keys of what a step adds to the figure.
//
//   SHM or not       pick-shm, shm-1 … shm-3
//   equation, graph  match-1, match-2 (an equation and four graphs), match-back (a graph and four
//                    equations)
//   A, T and φ₀      read-3, read-4 (amplitude, period and phase off a graph)
//   where on y(t)    points (the point where v or a is largest, zero, positive or negative)
//   kinematics       vmax, back-w, back-A
//   energy           energy (the kinetic share at a displacement, or where both are equal)
(function (root) {
  'use strict';

  const OC = root.OC || require('./core.js');
  const Eq = root.Equations || require('./equations.js');
  const Plot = root.Plot || require('./plot.js');
  const { L, pick, shuffle, num, tnum, q, tq, sig, speedUnit, rng } = OC;
  const { MISTAKES, PWHY, FORMS, byId } = Eq;

  // ---------------------------------------------------------------- helpers
  const step = (rule, html, show = []) => ({ text: `<p class="step-rule">${rule}</p>${html}`, show });
  const p$ = (s) => `<p>${s}</p>`;
  const res = (x) => `\\htmlClass{result}{${x}}`;
  const num$ = (key, sym, unit, what, signed = false) => ({ key, type: 'num', sym, unit, what, signed });
  const choice = (key, what, options, o = {}) => ({ key, type: 'choice', what, options, ...o });
  const box = (tex) => `<div class="eqbox">$$${tex}$$</div>`;
  const PI2 = 2 * Math.PI;

  // ================================================================ 1 SHM or not
  // An equation (see equations.js) with the numbers for its graph.
  const formsOf = (filter) => FORMS.filter(filter);
  function eqMake(r, forms) {
    const eq = Eq.make(r, pick(r, forms));
    return { eq, P: Eq.numbers(r) };
  }
  const isShm = (p) => byId(p.eq.form).shm;

  // the graph of an equation's motion for its sample numbers: three periods (or as long)
  function eqGraph(p, o = {}) {
    const f = byId(p.eq.form), P = { ...p.P, c: f.id === 'Tform' ? 3 : p.P.c };
    const T = f.shm ? f.period(P) : PI2 / P.c;
    const tEnd = Math.max(1, Math.round(2.5 * T));
    const pts = Eq.trace(f.motion(P), tEnd, 240, 1);
    const ys = pts.map((t) => t[1]).filter((y) => Math.abs(y) < 50);
    const span = Math.max(1.2, ...ys.map(Math.abs));
    return Plot.graph([{ pts }], { tEnd, name: Plot.plain(p.eq.y), axis: Plot.niceAxis([-span, span]), label: L('The motion for sample numbers', 'Die Bewegung für Beispielzahlen'), ...o });
  }

  // the answers: yes or no, then the period or the mistake
  // where a shifted SHM oscillates around: x₀ = g/c² (ODE) or B (solution)
  const eqm = (p) => { const s = Eq.sym(p.eq); return p.eq.form === 'shift' ? `${s.y}_0 = \\frac{g}{${s.c}^2}` : `${s.y}_0 = B`; };
  // the wrong answer carries the idea behind it: a shifted equilibrium taken for no SHM, or the
  // mistake not seen
  const yesNo = (p) => {
    const f = byId(p.eq.form), again = L('Bring it into the form ÿ = −ω²·y (or compare the solution with y = A·cos(ωt + φ₀)) and look again.', 'Bring sie in die Form ÿ = −ω²·y (oder vergleiche die Lösung mit y = A·cos(ωt + φ₀)) und schau nochmals.');
    const noFlag = f.shifted ? 'shift' : f.kind === 'ode' && f.level >= 2 ? 'form' : null;
    return [['yes', L('yes', 'ja'), again, f.shm ? null : f.mistake], ['no', L('no', 'nein'), f.shifted ? L(`A constant only shifts the equilibrium, here to $${eqm(p)}$: around it, the motion is harmonic.`, `Eine Konstante verschiebt nur die Gleichgewichtslage, hier nach $${eqm(p)}$: Um sie herum ist die Bewegung harmonisch.`) : again, f.shm ? noFlag : null]];
  };
  function periodField(p, after, r) {
    const f = byId(p.eq.form), [right, ...wrong] = f.T(Eq.sym(p.eq));
    const opts = [['right', `$T = ${right}$`, '', null], ...wrong.map(([tex, flag]) => [flag, `$T = ${tex}$`, PWHY[flag](), flag])];
    return choice('T', L('Its period:', 'Ihre Periode:'), shuffle(r, opts), { after, ask: L('It describes an SHM. What is its period?', 'Sie beschreibt eine harmonische Schwingung. Wie gross ist ihre Periode?') });
  }
  // What is wrong: the real mistake, and three features the equation really has, but which are
  // harmless (blaming them is the wrong idea: flag 'form'). Each feature says why it is fine.
  const ODE_NO = ['plus', 'first', 'square', 'const', 'damp', 'plusinv', 'cube'];
  function decoys(eq) {
    const f = byId(eq.form), s = Eq.sym(eq), id = f.id, has = (list) => list.includes(id), out = [];
    const add = (key, short, why) => out.push([key, short, why]);
    if (has(ODE_NO)) add('csq', L(`The constant appears squared: $${s.c}^2$.`, `Die Konstante steht im Quadrat: $${s.c}^2$.`),
      L(`That is fine: in $\\ddot y = -\\omega^2\\cdot y$ the constant is squared too. Writing it as $${s.c}^2$ only makes sure it is positive.`, `Das ist in Ordnung: Auch in $\\ddot y = -\\omega^2\\cdot y$ steht die Konstante im Quadrat. Als $${s.c}^2$ geschrieben ist sie sicher positiv.`));
    if (has(['first', 'square', 'const', 'cube'])) add('minus', L('The minus sign on the right-hand side.', 'Das Minuszeichen auf der rechten Seite.'),
      L('The minus sign is right: the acceleration must point back towards the equilibrium.', 'Das Minuszeichen ist richtig: Die Beschleunigung muss zur Gleichgewichtslage zurück zeigen.'));
    if (has(['plus', 'square', 'const', 'damp', 'plusinv', 'cube'])) add('second', L('It contains the second derivative.', 'Sie enthält die zweite Ableitung.'),
      L('That is right: an equation of motion links the acceleration, the second derivative, to the displacement.', 'Das ist richtig: Eine Bewegungsgleichung verknüpft die Beschleunigung, die zweite Ableitung, mit der Auslenkung.'));
    if (has(['damp', 'plusinv'])) add('zero', L('All terms stand on one side (= 0).', 'Alle Terme stehen auf einer Seite (= 0).'),
      L('Rearranging changes nothing: $\\ddot y + \\omega^2\\cdot y = 0$ is the same as $\\ddot y = -\\omega^2\\cdot y$.', 'Umformen ändert nichts: $\\ddot y + \\omega^2\\cdot y = 0$ ist dasselbe wie $\\ddot y = -\\omega^2\\cdot y$.'));
    if (eq.note === 'leib') add('leib', L(`The derivative is written as $\\frac{\\mathrm{d}^2${s.y}}{\\mathrm{d}t^2}$.`, `Die Ableitung ist als $\\frac{\\mathrm{d}^2${s.y}}{\\mathrm{d}t^2}$ geschrieben.`),
      L(`Only another way of writing: $\\frac{\\mathrm{d}^2${s.y}}{\\mathrm{d}t^2} = \\ddot{${s.y}}$.`, `Nur eine andere Schreibweise: $\\frac{\\mathrm{d}^2${s.y}}{\\mathrm{d}t^2} = \\ddot{${s.y}}$.`));
    if (has(['tsq', 'amp', 'expamp'])) add('cos', L('A cosine instead of a sine.', 'Ein Kosinus statt eines Sinus.'),
      L('A cosine is a sine shifted in time: both describe harmonic oscillations.', 'Ein Kosinus ist ein zeitlich verschobener Sinus: Beide beschreiben harmonische Schwingungen.'));
    if (has(['amp', 'expamp'])) add('targ', L(`The argument $${s.c}\\cdot t$ grows with time.`, `Das Argument $${s.c}\\cdot t$ wächst mit der Zeit.`),
      L('It must: in an SHM, the phase ω·t grows evenly with time.', 'Das muss es: Bei einer harmonischen Schwingung wächst die Phase ω·t gleichmässig mit der Zeit.'));
    if (has(['tsq'])) add('aconst', L('The factor $A$ in front stays the same.', 'Der Faktor $A$ vorne bleibt gleich.'),
      L('That is right: an SHM has a constant amplitude.', 'Das ist richtig: Eine harmonische Schwingung hat eine konstante Amplitude.'));
    add('name', eq.y === 'x' ? L(`The letter $${s.c}$ instead of $\\omega$.`, `Der Buchstabe $${s.c}$ statt $\\omega$.`) : L(`The letters $${s.y}$ and $${s.c}$ instead of $x$ and $\\omega$.`, `Die Buchstaben $${s.y}$ und $${s.c}$ statt $x$ und $\\omega$.`),
      L('The names do not matter, only the form of the equation.', 'Die Namen spielen keine Rolle, nur die Form der Gleichung.'));
    return out;
  }
  function mistakeField(p, after, r) {
    const right = byId(p.eq.form).mistake;
    // a feature that is there to see (its notation) first, then any of the others
    const all = shuffle(r, decoys(p.eq)), wrong = [...all.filter((d) => d[0] === 'leib'), ...all.filter((d) => d[0] !== 'leib')].slice(0, 3);
    const opts = [[right, MISTAKES[right].short(), '', null], ...wrong.map(([key, short, why]) => [key, short, why, 'form'])];
    return choice('mistake', L('What is wrong?', 'Was stimmt nicht?'), shuffle(r, opts), { after, stack: true, ask: L('It describes no SHM. What is wrong?', 'Sie beschreibt keine harmonische Schwingung. Was stimmt nicht?') });
  }
  // a fresh random source for the order of the options (the same for the same parameters)
  const orderOf = (p) => rng(p.seed || 7);

  // The steps: the standard form, ω and T; or why not, with the motion's graph.
  function eqSteps(p, ask) {
    const f = byId(p.eq.form), s = Eq.sym(p.eq), given = Eq.tex(p.eq);
    const out = [];
    out.push(step(L('The test', 'Der Test'), p$(f.kind === 'ode'
      ? L('A simple harmonic motion has an equation of motion of the form $\\ddot y = -\\omega^2\\cdot y$: the acceleration is proportional to the displacement and points back to the equilibrium. Solve the equation for the second derivative.',
        'Eine harmonische Schwingung hat eine Bewegungsgleichung der Form $\\ddot y = -\\omega^2\\cdot y$: Die Beschleunigung ist proportional zur Auslenkung und zeigt zur Gleichgewichtslage zurück. Löse die Gleichung nach der zweiten Ableitung auf.')
      : L('A simple harmonic motion is a motion $y(t) = A\\cdot\\cos(\\omega\\, t + \\varphi_0)$ (a sine is a cosine shifted in time): a constant amplitude, and a phase that grows evenly with $t$.',
        'Eine harmonische Schwingung ist eine Bewegung $y(t) = A\\cdot\\cos(\\omega\\, t + \\varphi_0)$ (ein Sinus ist ein zeitlich verschobener Kosinus): eine konstante Amplitude und eine Phase, die gleichmässig mit $t$ wächst.'))));
    if (f.shm) {
      const sum = f.id === 'c1c2' ? p$(L('A sum of a cosine and a sine with the same $\\omega$ is again a cosine with this $\\omega$ (with another amplitude and phase).', 'Eine Summe von Kosinus und Sinus mit demselben $\\omega$ ist wieder ein Kosinus mit diesem $\\omega$ (mit anderer Amplitude und Phase).')) : '';
      const shift = f.shifted ? p$(L(`The constant only shifts the equilibrium to $${eqm(p)}$: around it, the body oscillates harmonically. It is an SHM.`, `Die Konstante verschiebt nur die Gleichgewichtslage nach $${eqm(p)}$: Um sie herum schwingt der Körper harmonisch. Es ist eine harmonische Schwingung.`)) : '';
      out.push(step(L('Compare', 'Vergleichen'), (f.kind === 'ode'
        ? `$$${given}\\quad\\Longrightarrow\\quad ${f.std(s)}$$` + p$(L(`This has the form $\\ddot y = -\\omega^2\\cdot y$ with $\\omega^2 = ${f.w2(s)}$, so $\\omega = ${f.w(s)}$.`, `Das hat die Form $\\ddot y = -\\omega^2\\cdot y$ mit $\\omega^2 = ${f.w2(s)}$, also $\\omega = ${f.w(s)}$.`))
        : `$$${given}$$` + p$(L(`Compare with $${f.std(s)}$: the angular frequency is $\\omega = ${f.w(s)}$.`, `Vergleiche mit $${f.std(s)}$: Die Kreisfrequenz ist $\\omega = ${f.w(s)}$.`))) + sum + shift));
      out.push(step(L('The period', 'Die Periode'), p$(L('In one period, the phase $\\omega\\, t$ grows by $2\\pi$:', 'In einer Periode wächst die Phase $\\omega\\, t$ um $2\\pi$:')) +
        `$$T = \\frac{2\\pi}{\\omega} = ${res(f.T(s)[0])}$$` + p$(L('The graph shows the motion for sample numbers: the same shape again and again, with a constant amplitude.', 'Der Graph zeigt die Bewegung für Beispielzahlen: immer wieder dieselbe Form, mit konstanter Amplitude.')), ['graph']));
    } else {
      const m = MISTAKES[f.mistake];
      out.push(step(L('What goes wrong', 'Was nicht passt'), `$$${given}$$` + p$(m.why()) + p$(ask === 'mistake' ? L(`So: <span class="result">${m.short()}</span>`, `Also: <span class="result">${m.short()}</span>`) : L('So the equation describes <span class="result">no SHM</span>.', 'Die Gleichung beschreibt also <span class="result">keine harmonische Schwingung</span>.'))));
      out.push(step(L('The motion', 'Die Bewegung'), p$(L('The graph shows the motion for sample numbers (starting at 1, at rest): no harmonic oscillation.', 'Der Graph zeigt die Bewegung für Beispielzahlen (Start bei 1, in Ruhe): keine harmonische Schwingung.')), ['graph']));
    }
    return out;
  }
  const eqHints = (p) => {
    const f = byId(p.eq.form), s = Eq.sym(p.eq);
    return [
      L('An SHM: $\\ddot y = -\\omega^2\\cdot y$ (the acceleration proportional to the displacement, opposite to it), or $y(t) = A\\cdot\\cos(\\omega\\, t + \\varphi_0)$.', 'Eine harmonische Schwingung: $\\ddot y = -\\omega^2\\cdot y$ (die Beschleunigung proportional zur Auslenkung, ihr entgegen), oder $y(t) = A\\cdot\\cos(\\omega\\, t + \\varphi_0)$.'),
      f.shm ? (f.kind === 'ode' ? L(`Solve for the second derivative: $${f.std(s)}$.`, `Löse nach der zweiten Ableitung auf: $${f.std(s)}$.`) : L(`Compare with $${f.std(s)}$.`, `Vergleiche mit $${f.std(s)}$.`))
        : L('Check the sign, the order of the derivative, the power of the displacement, and how t enters.', 'Prüfe das Vorzeichen, die Ordnung der Ableitung, die Potenz der Auslenkung und wie t vorkommt.'),
      f.shm ? L(`Here $\\omega = ${f.w(s)}$, and $T = 2\\pi/\\omega$.`, `Hier ist $\\omega = ${f.w(s)}$, und $T = 2\\pi/\\omega$.`) : MISTAKES[f.mistake].short(),
    ];
  };
  const eqFigure = (p, v, view) => box(Eq.tex(p.eq)) + (view.show && view.show.has('graph') ? `<div class="fig">${eqGraph(p)}</div>` : '');

  // yes or no, then the period or the mistake
  function shmScenario(id, difficulty, forms) {
    return {
      id, difficulty, kind: 'shm',
      title: () => L('Harmonic or not?', 'Harmonisch oder nicht?'),
      make: (r) => { const p = eqMake(r, formsOf(forms)); p.seed = Math.floor(r() * 1e9); return p; },
      solve: (p) => ({ shm: isShm(p) ? 'yes' : 'no', T: 'right', mistake: byId(p.eq.form).mistake }),
      traps: [],
      fields: (p) => [choice('shm', L('Does it describe a simple harmonic motion?', 'Beschreibt sie eine harmonische Schwingung?'), yesNo(p), { ask: L('Does this equation describe a simple harmonic motion?', 'Beschreibt diese Gleichung eine harmonische Schwingung?') }),
        isShm(p) ? periodField(p, 'shm', orderOf(p)) : mistakeField(p, 'shm', orderOf(p))],
      text: () => L('Does this equation describe a simple harmonic motion (SHM)? If yes, what is its period? If not, what is wrong?', 'Beschreibt diese Gleichung eine harmonische Schwingung? Wenn ja, wie gross ist ihre Periode? Wenn nicht, was stimmt nicht?'),
      hints: (p) => eqHints(p),
      steps: (p) => eqSteps(p, 'shm'),
      figure: eqFigure,
    };
  }
  // ★1: the standard forms and the worksheet's blatant mistakes; ★2: rearranged forms and
  // solutions; ★3: the subtle ones (shifted equilibrium, c·ÿ = −y, y³, a decaying amplitude)
  const shm1 = shmScenario('shm-1', 1, (f) => f.level === 1);
  const shm2 = shmScenario('shm-2', 2, (f) => f.level === 2 || (f.level === 1 && !f.shm));
  const shm3 = shmScenario('shm-3', 3, (f) => f.level === 3 || (f.level === 2 && f.shm));

  // four equations, one of them an SHM
  const pickShm = {
    id: 'pick-shm', difficulty: 1, kind: 'pick',
    title: () => L('Which one oscillates harmonically?', 'Welche schwingt harmonisch?'),
    make: (r) => {
      const right = pick(r, formsOf((f) => f.shm && f.level <= 2));
      const wrong = shuffle(r, formsOf((f) => !f.shm && f.level <= 2));
      const seen = new Set(), list = [];
      for (const f of wrong) if (!seen.has(f.mistake) && list.length < 3) { seen.add(f.mistake); list.push(f); }
      const y = pick(r, Eq.VARS.filter((x) => x !== '\\varphi')), c = pick(r, Eq.CONSTS);
      const eqs = shuffle(r, [right, ...list]).map((f) => ({ form: f.id, y, c, note: 'dot' }));
      return { eqs, P: Eq.numbers(r) };
    },
    solve: (p) => ({ which: String(p.eqs.findIndex((e) => byId(e.form).shm)) }),
    traps: [],
    fields: (p) => [choice('which', L('Which equation describes a simple harmonic motion?', 'Welche Gleichung beschreibt eine harmonische Schwingung?'),
      p.eqs.map((e, i) => { const f = byId(e.form); return [String(i), `$${Eq.tex(e)}$`, f.shm ? '' : MISTAKES[f.mistake].short(), f.shm ? null : f.mistake]; }), { stack: true })],
    text: () => L('Only one of these equations describes a simple harmonic motion. Which one?', 'Nur eine dieser Gleichungen beschreibt eine harmonische Schwingung. Welche?'),
    hints: () => [
      L('An SHM: $\\ddot y = -\\omega^2\\cdot y$, or $y(t) = A\\cdot\\cos(\\omega\\, t + \\varphi_0)$.', 'Eine harmonische Schwingung: $\\ddot y = -\\omega^2\\cdot y$, oder $y(t) = A\\cdot\\cos(\\omega\\, t + \\varphi_0)$.'),
      L('Check each one: the sign, the order of the derivative, the power of the displacement, how t enters.', 'Prüfe jede: das Vorzeichen, die Ordnung der Ableitung, die Potenz der Auslenkung, wie t vorkommt.'),
    ],
    steps: (p) => [step(L('One by one', 'Eine nach der anderen'), `<ul class="eqlist">${p.eqs.map((e) => { const f = byId(e.form); return `<li>$${Eq.tex(e)}$: ${f.shm ? `<span class="result">${L('an SHM', 'harmonisch')}</span>` : MISTAKES[f.mistake].short()}</li>`; }).join('')}</ul>`)],
    figure: () => '',
  };

  // ================================================================ 2 equation and graph
  // Qualitative only: equations with letters (ω, γ, k, g all positive) and graphs without
  // numbers. The body starts displaced (y(0) > 0), at rest. Each kind: its TeX and the motion
  // drawn (numbers only for the drawing).
  const Y0 = 2;
  const N = { w2: 1, G: 0.3, k: 0.35, g: 4 }; // the numbers of the drawings
  const NKINDS = {
    shm: { tex: (y) => `\\ddot ${y} = -\\omega^2\\cdot ${y}`, motion: () => ({ order: 2, acc: (y) => -N.w2 * y }) },
    damp: { tex: (y) => `\\ddot ${y} + \\gamma\\cdot\\dot ${y} + \\omega^2\\cdot ${y} = 0`, motion: () => ({ order: 2, acc: (y, v) => -N.G * v - N.w2 * y }) },
    anti: { tex: (y) => `\\ddot ${y} - \\gamma\\cdot\\dot ${y} + \\omega^2\\cdot ${y} = 0`, motion: () => ({ order: 2, acc: (y, v) => N.G * v - N.w2 * y }) },
    plus: { tex: (y) => `\\ddot ${y} = k^2\\cdot ${y}`, motion: () => ({ order: 2, acc: (y) => N.k * N.k * y }) },
    first: { tex: (y) => `\\dot ${y} = -k\\cdot ${y}`, motion: () => ({ order: 1, rate: (y) => -N.k * y }) },
    const: { tex: (y) => `\\ddot ${y} = -g`, motion: () => ({ order: 2, acc: () => -N.g / 10 }) },
    shift: { tex: (y) => `\\ddot ${y} = -\\omega^2\\cdot ${y} + g`, motion: () => ({ order: 2, acc: (y) => -N.w2 * y + N.g }) },
    unshift: { tex: (y) => `\\ddot ${y} = -\\omega^2\\cdot ${y}`, motion: () => ({ order: 2, acc: (y) => -N.w2 * y }) },
  };
  // what a graph shows, and why it is wrong when the right one is another
  function graphWhy(k, right) {
    const W = {
      shm: right === 'damp' ? L('Here the amplitude stays the same. But the term with ẏ damps the oscillation: the amplitude dies away.', 'Hier bleibt die Amplitude gleich. Der Term mit ẏ dämpft die Schwingung aber: Die Amplitude klingt ab.')
        : right === 'anti' ? L('Here the amplitude stays the same. But with −γ·ẏ the oscillation is driven: the amplitude grows.', 'Hier bleibt die Amplitude gleich. Mit −γ·ẏ wird die Schwingung aber angetrieben: Die Amplitude wächst.')
          : right === 'shift' ? L('This one oscillates around 0. The constant g shifts the equilibrium to g/ω², so the body oscillates around it.', 'Diese schwingt um 0. Die Konstante g verschiebt die Gleichgewichtslage nach g/ω², der Körper schwingt also um sie.')
            : right === 'plus' ? L('An oscillation needs a minus sign: ÿ = −ω²·y. With a plus sign, there is no restoring force: the body runs away.', 'Eine Schwingung braucht ein Minuszeichen: ÿ = −ω²·y. Mit Pluszeichen gibt es keine rücktreibende Kraft: Der Körper läuft davon.')
              : right === 'first' ? L('An oscillation needs the second derivative. With ẏ = −k·y, the body creeps towards 0 and never turns back.', 'Eine Schwingung braucht die zweite Ableitung. Mit ẏ = −k·y kriecht der Körper gegen 0 und kehrt nie um.')
                : L('A constant acceleration gives no oscillation: the graph is a parabola.', 'Eine konstante Beschleunigung gibt keine Schwingung: Der Graph ist eine Parabel.'),
      damp: L('The amplitude of this one dies away: that needs a term +γ·ẏ (damping).', 'Bei dieser klingt die Amplitude ab: Das braucht einen Term +γ·ẏ (Dämpfung).'),
      anti: L('The amplitude of this one grows: that would be −γ·ẏ, a damping term with the wrong sign.', 'Bei dieser wächst die Amplitude: Das wäre −γ·ẏ, ein Dämpfungsterm mit dem falschen Vorzeichen.'),
      plus: L('This one runs away exponentially: that would be ÿ = +k²·y, without a restoring force.', 'Diese läuft exponentiell davon: Das wäre ÿ = +k²·y, ohne rücktreibende Kraft.'),
      first: L('This one creeps towards 0 without turning back: that would be ẏ = −k·y, with the first derivative only.', 'Diese kriecht gegen 0, ohne umzukehren: Das wäre ẏ = −k·y, nur mit der ersten Ableitung.'),
      const: L('This is a parabola: a constant acceleration, ÿ = −g.', 'Das ist eine Parabel: eine konstante Beschleunigung, ÿ = −g.'),
      unshift: L('This one oscillates around 0, but the constant g shifts the equilibrium.', 'Diese schwingt um 0, aber die Konstante g verschiebt die Gleichgewichtslage.'),
      shift: L('This one oscillates around a shifted equilibrium: that needs a constant in the equation.', 'Diese schwingt um eine verschobene Gleichgewichtslage: Das braucht eine Konstante in der Gleichung.'),
    };
    return W[k] || '';
  }
  const FLAG = { damp: 'damp', anti: 'sign', plus: 'sign', first: 'order', const: 'const', shift: 'shift', unshift: 'shift', shm: null };

  // the given kind and the wrong ones, in the order they are tried (some may look alike)
  const MATCH1 = { shm: ['damp', 'plus', 'first', 'anti', 'const'], plus: ['shm', 'first', 'const', 'damp'], first: ['shm', 'plus', 'damp', 'const'] };
  const MATCH2 = { damp: ['shm', 'anti', 'first', 'plus'], anti: ['shm', 'damp', 'plus', 'first'], shift: ['unshift', 'damp', 'plus', 'const'], const: ['shm', 'plus', 'first', 'damp'] };
  const T_END = 20;
  const curveOf = (kind) => Eq.trace(NKINDS[kind].motion(), T_END, 240, Y0);
  // the axis: room for a shifted equilibrium only where one is among the graphs
  const AXIS = { lo: -3, hi: 9, step: 3 }, AXIS0 = { lo: -3, hi: 3, step: 1 };
  const axisOf = (kinds) => (kinds.some((k) => k === 'shift') ? AXIS : AXIS0);
  // a graph without numbers: only the axes, y(0) > 0 and the line y = 0
  const qGraph = (kind, y, axis, o = {}) => Plot.graph([{ pts: curveOf(kind) }], { tEnd: T_END, axis, name: y, bare: true, label: L('A graph of the motion', 'Ein Graph der Bewegung'), ...o });
  function matchOptions(given, wrongs) {
    const span = AXIS.hi - AXIS.lo, clip = (pts) => pts.map(([t, y]) => [t, Math.max(AXIS.lo, Math.min(AXIS.hi, y))]), kept = [[given, clip(curveOf(given))]];
    for (const k of wrongs) {
      if (kept.length === 4) break;
      const c = clip(curveOf(k));
      if (!kept.some(([, d]) => Plot.alike(c, d, span))) kept.push([k, c]);
    }
    return kept.map((k) => k[0]);
  }
  const KIND_TEXT = () => ({
    shm: L('ÿ = −ω²·y: the acceleration points back to 0 and grows with the displacement: an SHM around 0, with a constant amplitude.', 'ÿ = −ω²·y: Die Beschleunigung zeigt zu 0 zurück und wächst mit der Auslenkung: eine harmonische Schwingung um 0, mit konstanter Amplitude.'),
    damp: L('ÿ = −ω²·y with a term +γ·ẏ that brakes the motion like friction: a damped oscillation, its amplitude dies away.', 'ÿ = −ω²·y mit einem Term +γ·ẏ, der die Bewegung wie Reibung bremst: eine gedämpfte Schwingung, ihre Amplitude klingt ab.'),
    anti: L('ÿ = −ω²·y with a term −γ·ẏ that pushes in the direction of motion: the oscillation is driven, its amplitude grows.', 'ÿ = −ω²·y mit einem Term −γ·ẏ, der in Bewegungsrichtung schiebt: Die Schwingung wird angetrieben, ihre Amplitude wächst.'),
    shift: L('ÿ = −ω²·y plus a constant g: the acceleration is 0 at y = g/ω², not at 0. An SHM around this shifted equilibrium.', 'ÿ = −ω²·y plus eine Konstante g: Die Beschleunigung ist 0 bei y = g/ω², nicht bei 0. Eine harmonische Schwingung um diese verschobene Gleichgewichtslage.'),
    plus: L('ÿ = +k²·y: the acceleration points away from 0, the more the farther: the body runs away exponentially.', 'ÿ = +k²·y: Die Beschleunigung zeigt von 0 weg, umso stärker, je weiter: Der Körper läuft exponentiell davon.'),
    first: L('ẏ = −k·y: the velocity is proportional to the displacement; the body creeps towards 0 (exponentially) and never turns back.', 'ẏ = −k·y: Die Geschwindigkeit ist proportional zur Auslenkung; der Körper kriecht (exponentiell) gegen 0 und kehrt nie um.'),
    const: L('ÿ = −g: a constant acceleration, as in a throw: the graph is a parabola opening downwards.', 'ÿ = −g: eine konstante Beschleunigung, wie bei einem Wurf: Der Graph ist eine nach unten geöffnete Parabel.'),
  });
  const MATCH_HINTS = () => [
    L('Look at the form of the equation, not at numbers: is there ÿ = −ω²·y (an oscillation), a term with ẏ (damping or driving), a constant (a shifted equilibrium), a plus sign or only the first derivative (no oscillation)?', 'Schau auf die Form der Gleichung, nicht auf Zahlen: Gibt es ÿ = −ω²·y (eine Schwingung), einen Term mit ẏ (Dämpfung oder Antrieb), eine Konstante (eine verschobene Gleichgewichtslage), ein Pluszeichen oder nur die erste Ableitung (keine Schwingung)?'),
    L('In the graphs: does the amplitude stay the same, die away or grow? Around which line does it oscillate? Does it oscillate at all?', 'In den Graphen: Bleibt die Amplitude gleich, klingt sie ab oder wächst sie? Um welche Linie schwingt er? Schwingt er überhaupt?'),
    L('At the start the body is at rest above 0: the graph starts with a horizontal tangent.', 'Am Anfang ist der Körper oberhalb von 0 in Ruhe: Der Graph beginnt mit einer waagrechten Tangente.'),
  ];

  function matchScenario(id, difficulty, table) {
    return {
      id, difficulty, kind: 'match',
      title: () => L('Which graph?', 'Welcher Graph?'),
      make: (r) => {
        const given = pick(r, Object.keys(table)), y = pick(r, ['x', 'y', 'z', 'u']);
        const kinds = matchOptions(given, table[given]);
        if (kinds.length < 4) return null;
        return { given, y, kinds: shuffle(r, kinds) };
      },
      solve: (p) => ({ graph: p.given }),
      traps: [],
      fields: (p) => [choice('graph', L('Which graph shows the motion?', 'Welcher Graph zeigt die Bewegung?'), p.kinds.map((k) => [k, qGraph(k, p.y, axisOf(p.kinds)), k === p.given ? '' : graphWhy(k, p.given), k === p.given ? null : FLAG[k]]), { pics: true })],
      text: (p) => L(`A body moves according to the equation below (the constants are positive). At the start it is displaced to ${p.y} > 0 and at rest. Which graph shows its motion?`,
        `Ein Körper bewegt sich gemäss der Gleichung unten (die Konstanten sind positiv). Am Anfang ist er nach ${p.y} > 0 ausgelenkt und in Ruhe. Welcher Graph zeigt seine Bewegung?`),
      hints: () => MATCH_HINTS(),
      steps: (p) => [
        step(L('The form of the equation', 'Die Form der Gleichung'), p$(KIND_TEXT()[p.given])),
        step(L('The graph', 'Der Graph'), p$(L('So the graph is this one:', 'Der Graph ist also dieser:')), ['graph']),
      ],
      figure: (p, v, view) => box(NKINDS[p.given].tex(p.y)) + (view.show && view.show.has('graph') ? `<div class="fig">${qGraph(p.given, p.y, axisOf(p.kinds))}</div>` : ''),
    };
  }
  const match1 = matchScenario('match-1', 2, MATCH1);
  const match2 = matchScenario('match-2', 3, MATCH2);

  // a graph and four equations
  const BACK = { shm: ['damp', 'plus', 'anti', 'first'], damp: ['anti', 'shm', 'first', 'plus'], anti: ['damp', 'shm', 'plus', 'first'], shift: ['unshift', 'damp', 'plus', 'anti'] };
  const matchBack = {
    id: 'match-back', difficulty: 3, kind: 'back',
    title: () => L('Which equation?', 'Welche Gleichung?'),
    make: (r) => {
      const given = pick(r, Object.keys(BACK)), y = pick(r, ['x', 'y', 'z', 'u']);
      return { given, y, kinds: shuffle(r, [given, ...BACK[given].slice(0, 3)]) };
    },
    solve: (p) => ({ eq: p.given }),
    traps: [],
    fields: (p) => [choice('eq', L('Which equation belongs to the graph?', 'Welche Gleichung gehört zum Graphen?'), p.kinds.map((k) => [k, `$${NKINDS[k].tex(p.y)}$`, k === p.given ? '' : graphWhy(k, p.given), k === p.given ? null : FLAG[k]]), { stack: true })],
    text: (p) => L(`The graph shows the motion of a body; it starts at rest. Which equation of motion belongs to it (the constants are positive)?`, `Der Graph zeigt die Bewegung eines Körpers; er startet in Ruhe. Welche Bewegungsgleichung gehört dazu (die Konstanten sind positiv)?`),
    hints: () => [MATCH_HINTS()[1], MATCH_HINTS()[0]],
    steps: (p) => [
      step(L('What the graph shows', 'Was der Graph zeigt'), p$({
        shm: L('A constant amplitude around 0: an SHM.', 'Eine konstante Amplitude um 0: eine harmonische Schwingung.'),
        damp: L('An oscillation around 0 whose amplitude dies away: damped.', 'Eine Schwingung um 0, deren Amplitude abklingt: gedämpft.'),
        anti: L('An oscillation around 0 whose amplitude grows: driven.', 'Eine Schwingung um 0, deren Amplitude wächst: angetrieben.'),
        shift: L('A constant amplitude, but around a line above 0: a shifted equilibrium.', 'Eine konstante Amplitude, aber um eine Linie oberhalb von 0: eine verschobene Gleichgewichtslage.'),
      }[p.given])),
      step(L('The equation', 'Die Gleichung'), p$(KIND_TEXT()[p.given]) + `$$${res(NKINDS[p.given].tex(p.y))}$$`),
    ],
    figure: (p) => `<div class="fig">${qGraph(p.given, p.y, axisOf([p.given]))}</div>`,
  };

  // ================================================================ 3 kinematics
  // y(t) = A·sin(ωt), the angular frequency ω given (no 2π to work out): v̂ = A·ω, â = A·ω².
  const AS = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 15, 20].map((x) => x / 100); // m
  const WS = [2, 2.5, 3, 4, 5, 6, 8, 10, 12, 15, 20]; // s⁻¹
  const unitOfA = (A) => (A < 0.01 ? 'mm' : 'cm');
  const VH = '\\hat v', AH = '\\hat a', W = (w) => `${tnum(w)}\\,\\mathrm{s^{-1}}`;
  const xGraph = (p, o = {}) => {
    const f = p.w ? p.w / PI2 : p.f, w = PI2 * f, T = 1 / f, tEnd = 2 * T, cm = p.A * 100, ph = p.start === 'top' ? Math.PI / 2 : 0;
    const pts = Array.from({ length: 201 }, (z, k) => { const t = (k * tEnd) / 200; return [t, cm * Math.sin(w * t + ph)]; });
    return `<div class="fig">${Plot.graph([{ pts }], { tEnd, name: 'y', unit: 'cm', axis: Plot.niceAxis([-cm * 1.05, cm * 1.05]), label: L('Displacement against time', 'Auslenkung gegen die Zeit'), ...o })}</div>`;
  };
  const WHYK = {
    square: () => L('$\\hat v = A\\,\\omega$ and $\\hat a = A\\,\\omega^2$: the square belongs to the acceleration.', '$\\hat v = A\\,\\omega$ und $\\hat a = A\\,\\omega^2$: Das Quadrat gehört zur Beschleunigung.'),
    inverse: () => L('Upside down: from $\\hat v = A\\,\\omega$, $\\omega = \\hat v / A$.', 'Kehrwert verwechselt: Aus $\\hat v = A\\,\\omega$ folgt $\\omega = \\hat v / A$.'),
    inverseA: () => L('Upside down: $\\hat a / \\hat v = A\\omega^2 / (A\\omega) = \\omega$.', 'Kehrwert verwechselt: $\\hat a / \\hat v = A\\omega^2 / (A\\omega) = \\omega$.'),
  };
  const pickAW = (r) => ({ A: pick(r, AS), w: pick(r, WS) });
  const given = (p) => L(`an amplitude of ${q(p.A, unitOfA(p.A))} and an angular frequency of ${q(p.w, '')} s⁻¹`, `einer Amplitude von ${q(p.A, unitOfA(p.A))} und einer Kreisfrequenz von ${q(p.w, '')} s⁻¹`);
  const peaks = (p, view, key) => (view.show && view.show.has(key) ? (key === 'eq' ? [[0, 0], [Math.PI / p.w, 0]] : [[(Math.PI / 2) / p.w, p.A * 100], [(1.5 * Math.PI) / p.w, -p.A * 100]]) : []);

  const vmax = {
    id: 'vmax', difficulty: 2, kind: 'kin',
    title: () => L('Fastest and strongest', 'Am schnellsten, am stärksten'),
    make: pickAW,
    solve: (p, o = {}) => ({ vmax: o.square ? p.A * p.w * p.w : p.A * p.w, amax: o.square ? p.A * p.w : p.A * p.w * p.w }),
    traps: ['square'],
    why: { square: WHYK.square },
    fields: (p) => [num$('vmax', VH, speedUnit(p.A * p.w), L('largest speed', 'grösste Geschwindigkeit')), num$('amax', AH, 'm/s²', L('largest acceleration', 'grösste Beschleunigung'))],
    text: (p) => L(`A body oscillates harmonically with ${given(p)}. What are its largest speed and its largest acceleration?`, `Ein Körper schwingt harmonisch mit ${given(p)}. Wie gross sind seine grösste Geschwindigkeit und seine grösste Beschleunigung?`),
    hints: () => [
      L('From $y(t) = A\\cdot\\sin(\\omega t)$: $v(t) = A\\omega\\cdot\\cos(\\omega t)$ and $a(t) = -A\\omega^2\\cdot\\sin(\\omega t)$. Cosine and sine are at most 1.', 'Aus $y(t) = A\\cdot\\sin(\\omega t)$: $v(t) = A\\omega\\cdot\\cos(\\omega t)$ und $a(t) = -A\\omega^2\\cdot\\sin(\\omega t)$. Kosinus und Sinus sind höchstens 1.'),
      L('$\\hat v = A\\,\\omega$ and $\\hat a = A\\,\\omega^2$, the amplitude in metres.', '$\\hat v = A\\,\\omega$ und $\\hat a = A\\,\\omega^2$, die Amplitude in Metern.'),
    ],
    steps: (p, v) => [
      step(L('The largest speed', 'Die grösste Geschwindigkeit'), p$(L('With $y(t) = A\\cdot\\sin(\\omega t)$, the velocity is $v(t) = A\\omega\\cdot\\cos(\\omega t)$: largest where the cosine is ±1, at the equilibrium.', 'Mit $y(t) = A\\cdot\\sin(\\omega t)$ ist die Geschwindigkeit $v(t) = A\\omega\\cdot\\cos(\\omega t)$: am grössten, wo der Kosinus ±1 ist, in der Gleichgewichtslage.')) +
        `$$\\hat v = A\\,\\omega = ${tq(p.A, 'm')}\\cdot ${W(p.w)} = ${res(tq(v.vmax, speedUnit(v.vmax)))}$$`, ['eq']),
      step(L('The largest acceleration', 'Die grösste Beschleunigung'), p$(L('The acceleration $a(t) = -A\\omega^2\\cdot\\sin(\\omega t)$ is largest at the turning points.', 'Die Beschleunigung $a(t) = -A\\omega^2\\cdot\\sin(\\omega t)$ ist an den Umkehrpunkten am grössten.')) +
        `$$\\hat a = A\\,\\omega^2 = ${tq(p.A, 'm')}\\cdot (${W(p.w)})^2 = ${res(tq(v.amax, 'm/s²'))}$$`, ['top']),
    ],
    figure: (p, v, view) => (view.task ? '' : xGraph(p, { dots: [...peaks(p, view, 'eq'), ...peaks(p, view, 'top')] })),
  };

  // from the amplitude and the largest speed: ω, and then the largest acceleration
  const backW = {
    id: 'back-w', difficulty: 3, kind: 'kin',
    title: () => L('How fast does it oscillate?', 'Wie schnell schwingt er?'),
    make: pickAW,
    solve: (p, o = {}) => { const vm = p.A * p.w, w = o.flip ? p.A / vm : vm / p.A; return { vm, w, amax: o.square ? p.A * w : p.A * w * w }; },
    traps: ['flip', 'square'],
    why: { flip: WHYK.inverse, square: WHYK.square },
    fields: () => [num$('w', '\\omega', 'rad/s', L('angular frequency', 'Kreisfrequenz')), num$('amax', AH, 'm/s²', L('largest acceleration', 'grösste Beschleunigung'))],
    text: (p) => { const vm = p.A * p.w; return L(`A body oscillates harmonically with an amplitude of ${q(p.A, unitOfA(p.A))}. Its largest speed is ${q(vm, speedUnit(vm))}. What are its angular frequency and its largest acceleration?`, `Ein Körper schwingt harmonisch mit einer Amplitude von ${q(p.A, unitOfA(p.A))}. Seine grösste Geschwindigkeit beträgt ${q(vm, speedUnit(vm))}. Wie gross sind seine Kreisfrequenz und seine grösste Beschleunigung?`); },
    hints: () => [L('$\\hat v = A\\,\\omega$: solve for $\\omega$.', '$\\hat v = A\\,\\omega$: Löse nach $\\omega$ auf.'), L('Then $\\hat a = A\\,\\omega^2$ (or $\\hat a = \\hat v\\,\\omega$).', 'Dann $\\hat a = A\\,\\omega^2$ (oder $\\hat a = \\hat v\\,\\omega$).')],
    steps: (p, v) => [
      step(L('The angular frequency', 'Die Kreisfrequenz'), `$$\\omega = \\frac{\\hat v}{A} = \\frac{${tq(v.vm, 'm/s')}}{${tq(p.A, 'm')}} = ${res(W(v.w))}$$`),
      step(L('The largest acceleration', 'Die grösste Beschleunigung'), `$$\\hat a = A\\,\\omega^2 = ${tq(p.A, 'm')}\\cdot (${W(v.w)})^2 = ${res(tq(v.amax, 'm/s²'))}$$`, ['top']),
    ],
    figure: (p, v, view) => (view.task ? '' : xGraph(p, { dots: peaks(p, view, 'top') })),
  };

  const backA = {
    id: 'back-A', difficulty: 3, kind: 'kin',
    title: () => L('How far?', 'Wie weit?'),
    make: pickAW,
    solve: (p, o = {}) => { const vm = p.A * p.w, am = p.A * p.w * p.w, w = o.flip ? vm / am : am / vm; return { vm, am, w, A: vm / w }; },
    traps: ['flip'],
    why: { flip: WHYK.inverseA },
    fields: (p) => [num$('w', '\\omega', 'rad/s', L('angular frequency', 'Kreisfrequenz')), num$('A', 'A', unitOfA(p.A), L('amplitude', 'Amplitude'))],
    text: (p) => { const vm = p.A * p.w, am = vm * p.w; return L(`A body oscillates harmonically. Its largest speed is ${q(vm, speedUnit(vm))}, its largest acceleration ${q(am, 'm/s²')}. What are its angular frequency and its amplitude?`, `Ein Körper schwingt harmonisch. Seine grösste Geschwindigkeit beträgt ${q(vm, speedUnit(vm))}, seine grösste Beschleunigung ${q(am, 'm/s²')}. Wie gross sind seine Kreisfrequenz und seine Amplitude?`); },
    hints: () => [L('$\\hat v = A\\,\\omega$ and $\\hat a = A\\,\\omega^2$: two equations for $A$ and $\\omega$.', '$\\hat v = A\\,\\omega$ und $\\hat a = A\\,\\omega^2$: zwei Gleichungen für $A$ und $\\omega$.'), L('Divide them: $\\hat a / \\hat v = \\omega$.', 'Teile sie: $\\hat a / \\hat v = \\omega$.')],
    steps: (p, v) => [
      step(L('The angular frequency', 'Die Kreisfrequenz'), p$(L('Divide $\\hat a = A\\,\\omega^2$ by $\\hat v = A\\,\\omega$:', 'Teile $\\hat a = A\\,\\omega^2$ durch $\\hat v = A\\,\\omega$:')) + `$$\\omega = \\frac{\\hat a}{\\hat v} = \\frac{${tq(v.am, 'm/s²')}}{${tq(v.vm, 'm/s')}} = ${res(W(v.w))}$$`),
      step(L('The amplitude', 'Die Amplitude'), `$$A = \\frac{\\hat v}{\\omega} = \\frac{${tq(v.vm, 'm/s')}}{${W(v.w)}} = ${res(tq(v.A, unitOfA(p.A)))}$$`, ['top']),
    ],
    figure: (p, v, view) => (view.task ? '' : xGraph(p, { dots: peaks(p, view, 'top') })),
  };

  // ================================================================ 4 amplitude, period and phase
  // y(t) = A·sin(ωt + φ₀), −π < φ₀ ≤ π; the graph with numbers: A, T and φ₀ to read off.
  // ★3: φ₀ a multiple of π/2; ★4: of π/4 (from y(0) = A·sin φ₀ and the direction at t = 0).
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  // k·π/4 as TeX
  function piTex(k) {
    if (k === 0) return '0';
    const g = gcd(Math.abs(k), 4), n = k / g, d = 4 / g, sg = n < 0 ? '-' : '', a = Math.abs(n);
    return d === 1 ? `${sg}${a === 1 ? '' : a}\\pi` : `${sg}\\frac{${a === 1 ? '' : a}\\pi}{${d}}`;
  }
  const RA = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8], RT = [0.4, 0.5, 0.8, 1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6];
  // a time step for the grid that divides T (labels every step, lines every half step)
  const tickFor = (T) => [0.1, 0.2, 0.25, 0.5, 1, 2].find((x) => (2 * T) / x <= 10 && Math.abs(T / x - Math.round(T / x)) < 1e-9) || 0.5;
  function readScenario(id, difficulty, ks) {
    return {
      id, difficulty, kind: 'read',
      title: () => L('Amplitude, period and phase', 'Amplitude, Periode und Phase'),
      make: (r) => ({ A: pick(r, RA), T: pick(r, RT), k: pick(r, ks) }),
      solve: (p, o = {}) => {
        const phi = (p.k * Math.PI) / 4;
        return { A: (o.peak ? 2 : 1) * p.A / 100, T: o.half ? p.T / 2 : p.T, phi: o.sign ? -phi : o.cos ? phi - Math.PI / 2 : o.deg ? (phi * 180) / Math.PI : phi };
      },
      traps: ['peak', 'half', 'sign', 'cos', 'deg'],
      why: {
        peak: () => L('That is the distance from the highest to the lowest point: 2A. The amplitude is the largest displacement from the equilibrium.', 'Das ist der Abstand vom höchsten zum tiefsten Punkt: 2A. Die Amplitude ist die grösste Auslenkung aus der Gleichgewichtslage.'),
        half: () => L('That is only half a period, from a crest to a trough. One period goes from a crest to the next crest.', 'Das ist nur eine halbe Periode, von einem Berg zu einem Tal. Eine Periode geht von einem Berg zum nächsten Berg.'),
        sign: () => L('Check the direction at t = 0: does y increase or decrease there? sin(ωt + φ₀) increases where the cosine of the phase is positive.', 'Prüfe die Richtung bei t = 0: Nimmt y dort zu oder ab? sin(ωt + φ₀) nimmt zu, wo der Kosinus der Phase positiv ist.'),
        cos: () => L('That would be the phase for y(t) = A·cos(ωt + φ₀). Here the sine is asked for: sin(ωt + φ₀).', 'Das wäre die Phase für y(t) = A·cos(ωt + φ₀). Hier ist der Sinus gefragt: sin(ωt + φ₀).'),
        deg: () => L('That is in degrees. The phase is asked in radians: 90° = π/2.', 'Das ist in Grad. Die Phase ist im Bogenmass gefragt: 90° = π/2.'),
      },
      fields: (p) => [num$('A', 'A', 'cm', L('amplitude', 'Amplitude')), num$('T', 'T', 's', L('period', 'Periode')),
        { ...num$('phi', '\\varphi_0', 'rad', L('phase', 'Phase'), true), phase: true, show: piTex(p.k) }],
      text: () => L('The graph shows a harmonic oscillation. Write it as y(t) = A·sin(ωt + φ₀) with −π &lt; φ₀ ≤ π: what are the amplitude A, the period T and the phase φ₀? (Type the phase as pi/2, -3pi/4, …)',
        'Der Graph zeigt eine harmonische Schwingung. Schreib sie als y(t) = A·sin(ωt + φ₀) mit −π &lt; φ₀ ≤ π: Wie gross sind die Amplitude A, die Periode T und die Phase φ₀? (Tippe die Phase als pi/2, -3pi/4, …)'),
      hints: (p) => [
        L('The amplitude is the largest displacement from the equilibrium (the line y = 0).', 'Die Amplitude ist die grösste Auslenkung aus der Gleichgewichtslage (der Linie y = 0).'),
        L('The period is the time from one crest to the next.', 'Die Periode ist die Zeit von einem Berg zum nächsten.'),
        L('At t = 0: y(0) = A·sin φ₀, and y increases if cos φ₀ > 0, decreases if cos φ₀ < 0.', 'Bei t = 0: y(0) = A·sin φ₀, und y nimmt zu, wenn cos φ₀ > 0, ab, wenn cos φ₀ < 0.'),
      ],
      steps: (p) => {
        const phi = (p.k * Math.PI) / 4, x0 = p.A * Math.sin(phi), up = Math.cos(phi) > 1e-9, down = Math.cos(phi) < -1e-9;
        const tc = (((Math.PI / 2 - phi) / (2 * Math.PI)) % 1 + 1) % 1 * p.T; // the first crest
        return [
          step(L('The amplitude', 'Die Amplitude'), p$(L(`The largest displacement from y = 0: <span class="result">A = ${num(p.A)} cm</span>.`, `Die grösste Auslenkung aus y = 0: <span class="result">A = ${num(p.A)} cm</span>.`)), ['crest']),
          step(L('The period', 'Die Periode'), p$(L(`From one crest to the next: <span class="result">T = ${num(p.T)} s</span> (so ω = 2π/T = ${num(PI2 / p.T)} s⁻¹).`, `Von einem Berg zum nächsten: <span class="result">T = ${num(p.T)} s</span> (also ω = 2π/T = ${num(PI2 / p.T)} s⁻¹).`)), ['period']),
          step(L('The phase', 'Die Phase'), p$(L(`At t = 0 the graph is at y(0) = ${num(sig(x0, 2))} cm${up ? ' and rising' : down ? ' and falling' : p.k === 2 ? ', a crest' : ', a trough'}. So sin φ₀ = y(0)/A = ${num(sig(x0 / p.A, 2))}${up ? ' with cos φ₀ > 0' : down ? ' with cos φ₀ < 0' : ''}:`,
            `Bei t = 0 ist der Graph bei y(0) = ${num(sig(x0, 2))} cm${up ? ' und steigt' : down ? ' und fällt' : p.k === 2 ? ', ein Berg' : ', ein Tal'}. Also sin φ₀ = y(0)/A = ${num(sig(x0 / p.A, 2))}${up ? ' mit cos φ₀ > 0' : down ? ' mit cos φ₀ < 0' : ''}:`)) +
            `$$\\varphi_0 = ${res(piTex(p.k))},\\qquad y(t) = ${num(p.A)}\\,\\mathrm{cm}\\cdot\\sin\\!\\left(\\frac{2\\pi}{${num(p.T)}\\,\\mathrm{s}}\\,t ${p.k ? (p.k > 0 ? '+' : '-') + ' ' + piTex(Math.abs(p.k)) : ''}\\right)$$`, ['start']),
        ];
      },
      figure: (p, v, view) => {
        const phi = (p.k * Math.PI) / 4, tEnd = 2 * p.T, sh = view.show || new Set();
        const pts = Array.from({ length: 241 }, (z, j) => { const t = (j * tEnd) / 240; return [t, p.A * Math.sin((PI2 * t) / p.T + phi)]; });
        const tc = ((((Math.PI / 2 - phi) / PI2) % 1) + 1) % 1 * p.T;
        return `<div class="fig">${Plot.graph([{ pts }], { tEnd, tStep: tickFor(p.T), name: 'y', unit: 'cm', axis: Plot.niceAxis([-p.A * 1.15, p.A * 1.15]),
          dots: [...(sh.has('crest') ? [[tc, p.A]] : []), ...(sh.has('start') ? [[0, p.A * Math.sin(phi)]] : [])], marks: sh.has('period') ? [tc, tc + p.T].filter((t) => t <= tEnd + 1e-9) : [],
          label: L('Displacement against time', 'Auslenkung gegen die Zeit') })}</div>`;
      },
    };
  }
  const read3 = readScenario('read-3', 3, [0, 2, 4, -2]);
  const read4 = readScenario('read-4', 4, [1, 3, -1, -3]);

  // ================================================================ 5 where on the graph
  // y(t) = A·sin(ωt) with four named points; one question, one point the answer.
  const PTS = ['P', 'Q', 'R', 'S'];
  const ASK = {
    vmax: { q: () => L('At which point is the body fastest?', 'In welchem Punkt ist der Körper am schnellsten?'), ok: (u) => Math.abs(Math.cos(PI2 * u)) > 0.999 },
    v0: { q: () => L('At which point is the body at rest for a moment?', 'In welchem Punkt ist der Körper einen Moment lang in Ruhe?'), ok: (u) => Math.abs(Math.sin(PI2 * u)) > 0.999 },
    amax: { q: () => L('At which point is the acceleration largest (in size)?', 'In welchem Punkt ist die Beschleunigung (dem Betrag nach) am grössten?'), ok: (u) => Math.abs(Math.sin(PI2 * u)) > 0.999 },
    aplus: { q: () => L('At which point does the acceleration point in the positive direction?', 'In welchem Punkt zeigt die Beschleunigung in positive Richtung?'), ok: (u) => Math.sin(PI2 * u) < -1e-6 },
    vminus: { q: () => L('At which point does the body move in the negative direction?', 'In welchem Punkt bewegt sich der Körper in negativer Richtung?'), ok: (u) => Math.cos(PI2 * u) < -1e-6 },
  };
  // the state of the body at phase u (in periods), in words
  function stateAt(u) {
    const x = Math.sin(PI2 * u), v = Math.cos(PI2 * u);
    if (Math.abs(x) > 0.999) return x > 0 ? L('at the upper turning point: v = 0, the acceleration largest, pointing down (negative)', 'am oberen Umkehrpunkt: v = 0, die Beschleunigung am grössten, nach unten (negativ)') : L('at the lower turning point: v = 0, the acceleration largest, pointing up (positive)', 'am unteren Umkehrpunkt: v = 0, die Beschleunigung am grössten, nach oben (positiv)');
    if (Math.abs(x) < 1e-6) return v > 0 ? L('at the equilibrium, moving up: the speed largest, a = 0', 'in der Gleichgewichtslage, nach oben unterwegs: die Geschwindigkeit am grössten, a = 0') : L('at the equilibrium, moving down: the speed largest, a = 0', 'in der Gleichgewichtslage, nach unten unterwegs: die Geschwindigkeit am grössten, a = 0');
    return L(`${x > 0 ? 'above' : 'below'} the equilibrium, moving ${v > 0 ? 'up' : 'down'}: the acceleration points ${x > 0 ? 'down (negative)' : 'up (positive)'}`, `${x > 0 ? 'oberhalb' : 'unterhalb'} der Gleichgewichtslage, nach ${v > 0 ? 'oben' : 'unten'} unterwegs: Die Beschleunigung zeigt nach ${x > 0 ? 'unten (negativ)' : 'oben (positiv)'}`);
  }
  const points = {
    id: 'points', difficulty: 2, kind: 'points',
    title: () => L('Where on the graph?', 'Wo auf dem Graphen?'),
    make: (r) => {
      const ask = pick(r, Object.keys(ASK)), cand = Array.from({ length: 15 }, (z, k) => (k + 1) / 8); // phases 1/8 … 15/8 periods
      const us = shuffle(r, cand.slice()).slice(0, 4).sort((a, b) => a - b);
      if (us.filter(ASK[ask].ok).length !== 1) return null;
      if (us.some((u, i) => i && u - us[i - 1] < 0.24)) return null; // apart, so the letters do not crowd
      return { ask, us };
    },
    solve: (p) => ({ pt: PTS[p.us.findIndex(ASK[p.ask].ok)] }),
    traps: [],
    fields: (p) => [choice('pt', ASK[p.ask].q(), p.us.map((u, i) => [PTS[i], PTS[i], ASK[p.ask].ok(u) ? '' : L(`At ${PTS[i]} the body is ${stateAt(u)}.`, `In ${PTS[i]} ist der Körper ${stateAt(u)}.`), null]))],
    text: () => L('The graph shows the displacement y of a harmonic oscillation against time.', 'Der Graph zeigt die Auslenkung y einer harmonischen Schwingung gegen die Zeit.'),
    hints: () => [
      L('The velocity is the slope of y(t): largest where the graph crosses the t axis, zero at crests and troughs; negative where the graph falls.', 'Die Geschwindigkeit ist die Steigung von y(t): am grössten, wo der Graph die t-Achse kreuzt, null in Bergen und Tälern; negativ, wo der Graph fällt.'),
      L('The acceleration is a = −ω²·y: opposite to the displacement, largest in size at the turning points, zero at the equilibrium.', 'Die Beschleunigung ist a = −ω²·y: entgegen der Auslenkung, dem Betrag nach am grössten an den Umkehrpunkten, null in der Gleichgewichtslage.'),
    ],
    steps: (p) => [step(L('Point by point', 'Punkt für Punkt'), `<ul class="eqlist">${p.us.map((u, i) => `<li>${ASK[p.ask].ok(u) ? `<span class="result">${PTS[i]}</span>` : PTS[i]}: ${stateAt(u)}</li>`).join('')}</ul>`)],
    figure: (p) => {
      const pts = Array.from({ length: 241 }, (z, j) => { const t = (j * 2) / 240; return [t, Math.sin(PI2 * t)]; });
      return `<div class="fig">${Plot.graph([{ pts }], { tEnd: 2, axis: { lo: -1.4, hi: 1.4, step: 1 }, name: 'y', bare: true, points: p.us.map((u, i) => [u, Math.sin(PI2 * u), PTS[i], Math.sin(PI2 * u) < -0.5]), label: L('Displacement against time, with four points', 'Auslenkung gegen die Zeit, mit vier Punkten') })}</div>`;
    },
  };

  // ================================================================ 6 energy
  // A body on a spring: E = ½·D·A² all the time, E_pot = ½·D·y², E_kin = E − E_pot.
  const KS = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [3, 5], [4, 5]];
  const frac = (n, d) => `\\tfrac{${n}}{${d}}`;
  const energy = {
    id: 'energy', difficulty: 3, kind: 'energy',
    title: () => L('Energy in an oscillation', 'Energie in einer Schwingung'),
    make: (r) => (r() < 0.75 ? { kind: 'share', k: pick(r, KS) } : { kind: 'equal' }),
    solve: (p, o = {}) => {
      if (p.kind === 'equal') return { x: o.half ? 0.5 : 1 / Math.SQRT2 };
      const k = p.k[0] / p.k[1];
      return { kin: o.linear ? 1 - k : o.swap ? k * k : 1 - k * k };
    },
    traps: ['linear', 'swap', 'half'],
    why: {
      linear: () => L('The potential energy of a spring grows with y², not with y: E_pot = ½·D·y².', 'Die potentielle Energie einer Feder wächst mit y², nicht mit y: E_pot = ½·D·y².'),
      swap: () => L('That is the share of the potential energy, ½·D·y² / (½·D·A²). The kinetic energy is the rest.', 'Das ist der Anteil der potentiellen Energie, ½·D·y² / (½·D·A²). Die kinetische Energie ist der Rest.'),
      half: () => L('At half the amplitude, E_pot = (½)² = ¼ of the total. Equal shares need y² = A²/2.', 'Bei halber Amplitude ist E_pot = (½)² = ¼ der Gesamtenergie. Gleiche Anteile brauchen y² = A²/2.'),
    },
    fields: (p) => (p.kind === 'equal' ? [num$('x', 'y/A', '', L('displacement in units of the amplitude', 'Auslenkung in Einheiten der Amplitude'))]
      : [num$('kin', 'E_\\mathrm{kin}/E', '', L('share of the kinetic energy', 'Anteil der kinetischen Energie'))]),
    text: (p) => (p.kind === 'equal'
      ? L('A body on a spring oscillates harmonically with amplitude A. At what displacement are its kinetic and its potential energy equal? Give it in units of A.', 'Ein Körper an einer Feder schwingt harmonisch mit der Amplitude A. Bei welcher Auslenkung sind seine kinetische und seine potentielle Energie gleich gross? Gib sie in Einheiten von A an.')
      : L(`A body on a spring oscillates harmonically. What share of its total energy is kinetic when it is ${p.k[0]}/${p.k[1]} of the amplitude away from the equilibrium? (A fraction like 3/4 is fine.)`, `Ein Körper an einer Feder schwingt harmonisch. Welcher Anteil seiner Gesamtenergie ist kinetisch, wenn er ${p.k[0]}/${p.k[1]} der Amplitude von der Gleichgewichtslage entfernt ist? (Ein Bruch wie 3/4 geht auch.)`)),
    hints: () => [
      L('The total energy stays the same: at a turning point it is all potential, E = ½·D·A².', 'Die Gesamtenergie bleibt gleich: An einem Umkehrpunkt ist alles potentielle Energie, E = ½·D·A².'),
      L('At a displacement y: E_pot = ½·D·y², so E_pot/E = (y/A)².', 'Bei einer Auslenkung y: E_pot = ½·D·y², also E_pot/E = (y/A)².'),
      L('The kinetic energy is the rest: E_kin = E − E_pot.', 'Die kinetische Energie ist der Rest: E_kin = E − E_pot.'),
    ],
    steps: (p, v) => [
      step(L('The total energy', 'Die Gesamtenergie'), p$(L('At a turning point the body is at rest: all energy is potential. Let $D$ be the spring constant:', 'An einem Umkehrpunkt ruht der Körper: Alle Energie ist potentiell. Sei $D$ die Federkonstante:')) + '$$E = \\tfrac12\\,D\\,A^2$$', ['total']),
      p.kind === 'equal'
        ? step(L('Equal shares', 'Gleiche Anteile'), p$(L('Equal kinetic and potential energy means each is half of $E$:', 'Gleiche kinetische und potentielle Energie heisst: je die Hälfte von $E$:')) + `$$\\tfrac12\\,D\\,y^2 = \\tfrac12\\cdot\\tfrac12\\,D\\,A^2 \;\\Rightarrow\; y = \\frac{A}{\\sqrt 2} = ${res(`${num(1 / Math.SQRT2)}\\,A`)}$$`, ['equal'])
        : step(L('At this displacement', 'Bei dieser Auslenkung'), `$$\\frac{E_\\mathrm{pot}}{E} = \\frac{\\tfrac12 D y^2}{\\tfrac12 D A^2} = \\left(\\frac{y}{A}\\right)^2 = \\left(${frac(...p.k)}\\right)^2,\\qquad \\frac{E_\\mathrm{kin}}{E} = 1 - \\left(${frac(...p.k)}\\right)^2 = ${res(`${frac(p.k[1] ** 2 - p.k[0] ** 2, p.k[1] ** 2)} = ${num(v.kin)}`)}$$`, ['x']),
    ],
    figure: (p, v, view) => (view.task || !root.Figures ? '' : root.Figures.energyWell(p.kind === 'equal' ? 1 / Math.SQRT2 : p.k[0] / p.k[1])),
  };

  const SCENARIOS = [pickShm, shm1, shm2, shm3, match1, match2, matchBack, read3, read4, points, vmax, backW, backA, energy];

  root.Scenarios = { SCENARIOS, NKINDS, curveOf, Y0, AXIS, xGraph };
  if (typeof module !== 'undefined') module.exports = root.Scenarios;
})(typeof window !== 'undefined' ? window : globalThis);
