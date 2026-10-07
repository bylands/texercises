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
//   SHM or not       pick-shm, shm-1 … shm-3, period-1, period-2, mistake-1, mistake-2
//   equation, graph  match-1, match-2 (an equation and four graphs), match-back (a graph and four
//                    equations)
//   kinematics       vmax, back-f, back-A, speed-x, speed-t
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
  // the wrong answer carries the idea behind it: a shifted equilibrium taken for no SHM, or the
  // mistake not seen
  const yesNo = (p) => {
    const f = byId(p.eq.form), again = L('Bring it into the form ÿ = −ω²·y (or compare the solution with y = A·cos(ωt + φ₀)) and look again.', 'Bring sie in die Form ÿ = −ω²·y (oder vergleiche die Lösung mit y = A·cos(ωt + φ₀)) und schau nochmals.');
    const noFlag = f.shifted ? 'shift' : f.kind === 'ode' && f.level >= 2 ? 'form' : null;
    return [['yes', L('yes', 'ja'), again, f.shm ? null : f.mistake], ['no', L('no', 'nein'), f.shifted ? L('A constant only shifts the equilibrium: around it, the motion can still be harmonic.', 'Eine Konstante verschiebt nur die Gleichgewichtslage: Um sie herum kann die Bewegung trotzdem harmonisch sein.') : again, f.shm ? noFlag : null]];
  };
  function periodField(p, after, r) {
    const f = byId(p.eq.form), [right, ...wrong] = f.T(Eq.sym(p.eq));
    const opts = [['right', `$T = ${right}$`, '', null], ...wrong.map(([tex, flag]) => [flag, `$T = ${tex}$`, PWHY[flag](), flag])];
    return choice('T', L('Its period:', 'Ihre Periode:'), shuffle(r, opts), { after, ask: L('It describes an SHM. What is its period?', 'Sie beschreibt eine harmonische Schwingung. Wie gross ist ihre Periode?') });
  }
  function mistakeField(p, after, r) {
    const right = byId(p.eq.form).mistake;
    const others = shuffle(r, Object.keys(MISTAKES).filter((m) => m !== right)).slice(0, 3);
    const opts = [right, ...others].map((m) => [m, MISTAKES[m].short(), m === right ? '' : L('That is not what differs here. Compare term by term with ÿ = −ω²·y, or with y = A·cos(ωt + φ₀).', 'Das ist hier nicht der Unterschied. Vergleiche Term für Term mit ÿ = −ω²·y oder mit y = A·cos(ωt + φ₀).'), null]);
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
      const shift = f.shifted ? p$(L('The constant only shifts the equilibrium: around it, the body oscillates harmonically. It is an SHM.', 'Die Konstante verschiebt nur die Gleichgewichtslage: Um sie herum schwingt der Körper harmonisch. Es ist eine harmonische Schwingung.')) : '';
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

  // the period only (the equation is an SHM)
  function periodScenario(id, difficulty, forms) {
    return {
      id, difficulty, kind: 'period',
      title: () => L('The period', 'Die Periode'),
      make: (r) => { const p = eqMake(r, formsOf((f) => f.shm && forms(f))); p.seed = Math.floor(r() * 1e9); return p; },
      solve: () => ({ T: 'right' }),
      traps: [],
      fields: (p) => [periodField(p, null, orderOf(p))],
      text: () => L('This equation describes a simple harmonic motion. What is its period?', 'Diese Gleichung beschreibt eine harmonische Schwingung. Wie gross ist ihre Periode?'),
      hints: (p) => eqHints(p).slice(1).concat([L('The period is the time for the phase ω·t to grow by 2π.', 'Die Periode ist die Zeit, in der die Phase ω·t um 2π wächst.')]),
      steps: (p) => eqSteps(p, 'T').slice(1),
      figure: eqFigure,
    };
  }
  const period1 = periodScenario('period-1', 1, (f) => f.level === 1);
  const period2 = periodScenario('period-2', 2, (f) => f.level >= 2);

  // the mistake only (the equation is no SHM)
  function mistakeScenario(id, difficulty, forms) {
    return {
      id, difficulty, kind: 'mistake',
      title: () => L('What goes wrong?', 'Was stimmt nicht?'),
      make: (r) => { const p = eqMake(r, formsOf((f) => !f.shm && forms(f))); p.seed = Math.floor(r() * 1e9); return p; },
      solve: (p) => ({ mistake: byId(p.eq.form).mistake }),
      traps: [],
      fields: (p) => [mistakeField(p, null, orderOf(p))],
      text: () => L('This equation does not describe a simple harmonic motion. Why not?', 'Diese Gleichung beschreibt keine harmonische Schwingung. Warum nicht?'),
      hints: (p) => [eqHints(p)[0], eqHints(p)[1], L('Compare with ÿ = −ω²·y term by term: the sign, the derivative, the power of y.', 'Vergleiche Term für Term mit ÿ = −ω²·y: das Vorzeichen, die Ableitung, die Potenz von y.')],
      steps: (p) => eqSteps(p, 'mistake'),
      figure: eqFigure,
    };
  }
  const mistake1 = mistakeScenario('mistake-1', 1, (f) => f.level === 1);
  const mistake2 = mistakeScenario('mistake-2', 2, (f) => f.level >= 2);

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
  // Equations with numbers (t in s, y in cm), from y(0) = Y0 and ẏ(0) = 0. Each kind: its TeX
  // (K: the factor ω², G: damping, g: the constant), its motion, and why it would be wrong.
  const Y0 = 2;
  // a factor before a variable: 1 is left out
  const k$ = (K) => (K === 1 ? '' : `${K}\\cdot `);
  const NKINDS = {
    shm: { tex: (y, n) => `\\ddot ${y} = -${k$(n.K)}${y}`, motion: (n) => ({ order: 2, acc: (y) => -n.K * y }), period: (n) => PI2 / Math.sqrt(n.K) },
    omega: { tex: (y, n) => `\\ddot ${y} = -${k$(n.K * n.K)}${y}`, motion: (n) => ({ order: 2, acc: (y) => -n.K * n.K * y }) },
    root: { tex: (y, n) => `\\ddot ${y} = -${k$(sig(Math.sqrt(n.K)))}${y}`, motion: (n) => ({ order: 2, acc: (y) => -Math.sqrt(n.K) * y }) },
    damp: { tex: (y, n) => `\\ddot ${y} + ${n.G}\\cdot\\dot ${y} + ${k$(n.K)}${y} = 0`, motion: (n) => ({ order: 2, acc: (y, v) => -n.G * v - n.K * y }) },
    anti: { tex: (y, n) => `\\ddot ${y} - ${n.G}\\cdot\\dot ${y} + ${k$(n.K)}${y} = 0`, motion: (n) => ({ order: 2, acc: (y, v) => n.G * v - n.K * y }) },
    plus: { tex: (y, n) => `\\ddot ${y} = ${k$(n.K)}${y}`, motion: (n) => ({ order: 2, acc: (y) => n.K * y }) },
    first: { tex: (y, n) => `\\dot ${y} = -${k$(n.K)}${y}`, motion: (n) => ({ order: 1, rate: (y) => -n.K * y }) },
    const: { tex: (y, n) => `\\ddot ${y} = -${n.K}`, motion: (n) => ({ order: 2, acc: () => -n.K }) },
    shift: { tex: (y, n) => `\\ddot ${y} = -${k$(n.K)}${y} + ${n.g}`, motion: (n) => ({ order: 2, acc: (y) => -n.K * y + n.g }), period: (n) => PI2 / Math.sqrt(n.K) },
    unshift: { tex: (y, n) => `\\ddot ${y} = -${k$(n.K)}${y}`, motion: (n) => ({ order: 2, acc: (y) => -n.K * y }) },
    cube: { tex: (y, n) => `\\ddot ${y} = -${k$(n.K)}${y}^3`, motion: (n) => ({ order: 2, acc: (y) => -n.K * y * y * y }) },
  };
  // why a graph (or an equation) of kind k is wrong when the right one is of kind right
  function graphWhy(k, right) {
    const W = {
      omega: L('This one oscillates too fast: in ÿ = −K·y, the factor K is ω², so ω = √K.', 'Diese schwingt zu schnell: In ÿ = −K·y ist der Faktor K gleich ω², also ω = √K.'),
      root: L('This one oscillates too slowly: in ÿ = −K·y, the factor K is ω² itself, so ω = √K, not ⁴√K.', 'Diese schwingt zu langsam: In ÿ = −K·y ist der Faktor K gleich ω², also ω = √K, nicht ⁴√K.'),
      shm: right === 'damp' ? L('Here the amplitude stays the same. But the term with ẏ damps the oscillation: the amplitude dies away.', 'Hier bleibt die Amplitude gleich. Der Term mit ẏ dämpft die Schwingung aber: Die Amplitude klingt ab.')
        : right === 'shift' ? L('This one oscillates around 0. The constant shifts the equilibrium to g/K: the body oscillates around it.', 'Diese schwingt um 0. Die Konstante verschiebt die Gleichgewichtslage zu g/K: Der Körper schwingt um sie.')
          : right === 'plus' ? L('An oscillation needs ÿ = −K·y. With a plus sign, there is no restoring force: the body runs away.', 'Eine Schwingung braucht ÿ = −K·y. Mit Pluszeichen gibt es keine rücktreibende Kraft: Der Körper läuft davon.')
            : right === 'first' ? L('An oscillation needs the second derivative. With ẏ = −K·y, the body creeps towards 0 and never turns back.', 'Eine Schwingung braucht die zweite Ableitung. Mit ẏ = −K·y kriecht der Körper gegen 0 und kehrt nie um.')
              : L('A constant acceleration gives no oscillation: the graph is a parabola.', 'Eine konstante Beschleunigung gibt keine Schwingung: Der Graph ist eine Parabel.'),
      damp: L('The amplitude of this one dies away: that needs a term with ẏ (damping).', 'Bei dieser klingt die Amplitude ab: Das braucht einen Term mit ẏ (Dämpfung).'),
      anti: L('The amplitude of this one grows: the damping term has the wrong sign.', 'Bei dieser wächst die Amplitude: Der Dämpfungsterm hat das falsche Vorzeichen.'),
      plus: L('This one runs away exponentially: that would be ÿ = +K·y, without a restoring force.', 'Diese läuft exponentiell davon: Das wäre ÿ = +K·y, ohne rücktreibende Kraft.'),
      first: L('This one creeps towards 0 without turning back: that would be ẏ = −K·y, with the first derivative only.', 'Diese kriecht gegen 0, ohne umzukehren: Das wäre ẏ = −K·y, nur mit der ersten Ableitung.'),
      const: L('This is a parabola: a constant acceleration, ÿ = −K.', 'Das ist eine Parabel: eine konstante Beschleunigung, ÿ = −K.'),
      unshift: L('This one oscillates around 0, but the constant shifts the equilibrium to g/K.', 'Diese schwingt um 0, aber die Konstante verschiebt die Gleichgewichtslage zu g/K.'),
      shift: L('This one oscillates around a shifted equilibrium: that needs a constant in the equation.', 'Diese schwingt um eine verschobene Gleichgewichtslage: Das braucht eine Konstante in der Gleichung.'),
      cube: L('Its peaks are flattened, and its period depends on the amplitude: that is ÿ = −K·y³, not harmonic.', 'Ihre Spitzen sind abgeflacht, und ihre Periode hängt von der Amplitude ab: Das ist ÿ = −K·y³, nicht harmonisch.'),
    };
    return W[k] || '';
  }
  const FLAG = { omega: 'omega2', root: 'omega2', damp: 'damp', anti: 'sign', plus: 'sign', first: 'order', const: 'const', shift: 'shift', unshift: 'shift', cube: 'power', shm: null };

  // the given kind and the wrong ones, in the order they are tried (some may look alike)
  const MATCH1 = { shm: ['omega', 'root', 'damp', 'plus', 'first'], plus: ['shm', 'first', 'const', 'damp'], first: ['shm', 'plus', 'damp', 'const'] };
  const MATCH2 = { damp: ['shm', 'anti', 'omega', 'first'], shift: ['unshift', 'omega', 'damp', 'plus'], const: ['shm', 'plus', 'first', 'damp'] };
  const KS = [1, 4, 9, 16, 0.25];
  function matchNums(r, given) {
    const K = given === 'first' || given === 'plus' || given === 'const' ? pick(r, [0.5, 1, 2]) : pick(r, KS);
    const w = Math.sqrt(K), T = PI2 / w;
    return { K, G: sig(pick(r, [0.15, 0.2, 0.3]) * w, 2), g: sig(K * pick(r, [1, 1.5, 3]), 2), T };
  }
  // the time axis: about three periods of the given oscillation
  const tEndOf = (n) => { const t = 3 * n.T; return [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30].find((x) => x >= t * 0.95) || 40; };
  function curveOf(kind, n, tEnd) { return Eq.trace(NKINDS[kind].motion(n), tEnd, 240, Y0); }
  // four graphs: the right one and the first three wrong ones that do not look like another
  function matchOptions(given, wrongs, n, tEnd, axis) {
    const span = axis.hi - axis.lo, kept = [[given, curveOf(given, n, tEnd)]];
    for (const k of wrongs) {
      if (kept.length === 4) break;
      const c = curveOf(k, n, tEnd), clipped = (pts) => pts.map(([t, y]) => [t, Math.max(axis.lo, Math.min(axis.hi, y))]);
      if (kept.some(([, d]) => Plot.alike(clipped(c), clipped(d), span))) continue;
      kept.push([k, c]);
    }
    return kept;
  }
  const yAxis = (n, given) => {
    const pts = curveOf(given, n, tEndOf(n)).map((p) => p[1]);
    return Plot.niceAxis([...pts, -Y0 * 1.1, Y0 * 1.1].filter((y) => Math.abs(y) < 40));
  };

  function matchScenario(id, difficulty, table) {
    return {
      id, difficulty, kind: 'match',
      title: () => L('Which graph?', 'Welcher Graph?'),
      make: (r) => {
        const given = pick(r, Object.keys(table)), n = matchNums(r, given), y = pick(r, ['x', 'y', 'z', 'u']);
        const tEnd = tEndOf(n), axis = yAxis(n, given);
        const kinds = matchOptions(given, table[given], n, tEnd, axis).map((k) => k[0]);
        if (kinds.length < 4) return null;
        return { given, n, y, tEnd, axis, kinds: shuffle(r, kinds) };
      },
      solve: (p) => ({ graph: p.given }),
      traps: [],
      fields: (p) => [choice('graph', L('Which graph shows the motion?', 'Welcher Graph zeigt die Bewegung?'), p.kinds.map((k) => [k,
        Plot.graph([{ pts: curveOf(k, p.n, p.tEnd) }], { tEnd: p.tEnd, axis: p.axis, name: p.y, unit: 'cm', label: L('A graph to choose', 'Ein Graph zur Auswahl') }),
        k === p.given ? '' : graphWhy(k, p.given), k === p.given ? null : FLAG[k]]), { pics: true })],
      text: (p) => L(`A body moves according to the equation below (t in s, ${p.y} in cm). At t = 0 it is at ${p.y} = ${Y0} cm, at rest. Which graph shows its motion?`,
        `Ein Körper bewegt sich gemäss der Gleichung unten (t in s, ${p.y} in cm). Bei t = 0 ist er bei ${p.y} = ${Y0} cm, in Ruhe. Welcher Graph zeigt seine Bewegung?`),
      hints: (p) => matchHints(p),
      steps: (p) => matchSteps(p),
      figure: (p, v, view) => box(NKINDS[p.given].tex(p.y, p.n)) + (view.show && view.show.has('graph') ? `<div class="fig">${Plot.graph([{ pts: curveOf(p.given, p.n, p.tEnd) }], { tEnd: p.tEnd, axis: p.axis, name: p.y, unit: 'cm', marks: NKINDS[p.given].period ? [p.n.T] : [], label: L('The motion', 'Die Bewegung') })}</div>` : ''),
    };
  }
  const T$ = (n) => `T = \\frac{2\\pi}{\\sqrt{${n.K}}}\\,\\mathrm{s} = ${tnum(n.T)}\\,\\mathrm{s}`;
  function matchHints(p) {
    const g = p.given, n = p.n;
    return [
      L('First the kind of motion: an oscillation needs ÿ = −K·y. A term with ẏ damps it, a constant shifts the equilibrium, a plus sign or the first derivative alone gives no oscillation.', 'Zuerst die Art der Bewegung: Eine Schwingung braucht ÿ = −K·y. Ein Term mit ẏ dämpft sie, eine Konstante verschiebt die Gleichgewichtslage, ein Pluszeichen oder nur die erste Ableitung geben keine Schwingung.'),
      NKINDS[g].period ? L(`Then the period: K = ω², so ω = √K and $${T$(n)}$.`, `Dann die Periode: K = ω², also ω = √K und $${T$(n)}$.`)
        : g === 'damp' ? L(`The period is about that without damping: $${T$(n)}$.`, `Die Periode ist etwa die ohne Dämpfung: $${T$(n)}$.`)
          : L('Where does the body go from rest at y(0)? Look at the sign of the acceleration there.', 'Wohin geht der Körper aus der Ruhe bei y(0)? Schau auf das Vorzeichen der Beschleunigung dort.'),
      g === 'shift' ? L(`The equilibrium is where ÿ = 0: at ${p.y} = g/K = ${sig(n.g / n.K)} cm.`, `Die Gleichgewichtslage ist dort, wo ÿ = 0 ist: bei ${p.y} = g/K = ${sig(n.g / n.K)} cm.`)
        : L(`Start: ${p.y}(0) = ${Y0} cm, at rest.`, `Start: ${p.y}(0) = ${Y0} cm, in Ruhe.`),
    ];
  }
  function matchSteps(p) {
    const g = p.given, n = p.n, kind = {
      shm: L('The equation has the form ÿ = −K·y: an SHM.', 'Die Gleichung hat die Form ÿ = −K·y: eine harmonische Schwingung.'),
      damp: L('ÿ = −K·y plus a term with ẏ: a damped oscillation, its amplitude dies away.', 'ÿ = −K·y plus ein Term mit ẏ: eine gedämpfte Schwingung, ihre Amplitude klingt ab.'),
      shift: L('ÿ = −K·y plus a constant: an SHM around a shifted equilibrium.', 'ÿ = −K·y plus eine Konstante: eine harmonische Schwingung um eine verschobene Gleichgewichtslage.'),
      plus: L('ÿ = +K·y: the acceleration points away from 0, the body runs away exponentially.', 'ÿ = +K·y: Die Beschleunigung zeigt von 0 weg, der Körper läuft exponentiell davon.'),
      first: L('ẏ = −K·y: the velocity is proportional to the displacement; the body creeps towards 0 (exponentially) and never turns back.', 'ẏ = −K·y: Die Geschwindigkeit ist proportional zur Auslenkung; der Körper kriecht (exponentiell) gegen 0 und kehrt nie um.'),
      const: L('ÿ = −K: a constant acceleration, as in a throw; the graph is a parabola opening downwards.', 'ÿ = −K: eine konstante Beschleunigung, wie bei einem Wurf; der Graph ist eine nach unten geöffnete Parabel.'),
    }[g];
    const out = [step(L('The kind of motion', 'Die Art der Bewegung'), p$(kind))];
    if (NKINDS[g].period || g === 'damp') {
      out.push(step(L('The period', 'Die Periode'), p$(L(`With K = ω²: ω = √K, so`, `Mit K = ω²: ω = √K, also`)) + `$$${T$(n)}$$` +
        (g === 'shift' ? p$(L(`The equilibrium: ÿ = 0 at ${p.y} = g/K = ${sig(n.g / n.K)} cm. The body starts at ${Y0} cm and oscillates around it.`, `Die Gleichgewichtslage: ÿ = 0 bei ${p.y} = g/K = ${sig(n.g / n.K)} cm. Der Körper startet bei ${Y0} cm und schwingt um sie.`)) : '') +
        (g === 'damp' ? p$(L('(With weak damping, the period is nearly the same as without.)', '(Bei schwacher Dämpfung ist die Periode fast gleich wie ohne.)')) : '')));
    }
    out.push(step(L('The graph', 'Der Graph'), p$(L('So the graph is this one:', 'Der Graph ist also dieser:')), ['graph']));
    return out;
  }
  const match1 = matchScenario('match-1', 2, MATCH1);
  const match2 = matchScenario('match-2', 3, MATCH2);

  // a graph and four equations
  const BACK = { shm: ['omega', 'root', 'plus', 'damp'], damp: ['anti', 'shm', 'omega', 'first'], shift: ['unshift', 'omega', 'damp', 'plus'] };
  const matchBack = {
    id: 'match-back', difficulty: 4, kind: 'back',
    title: () => L('Which equation?', 'Welche Gleichung?'),
    make: (r) => {
      const given = pick(r, Object.keys(BACK)), y = pick(r, ['x', 'y', 'z', 'u']);
      const K = pick(r, [1, 4, 9, 16]), w = Math.sqrt(K), n = { K, G: sig(pick(r, [0.15, 0.2, 0.3]) * w, 2), g: sig(K * pick(r, [1, 1.5, 3]), 2), T: PI2 / w };
      const tEnd = tEndOf(n), axis = yAxis(n, given);
      // equations that differ from the right one, as TeX
      const kinds = [given, ...BACK[given].filter((k) => NKINDS[k].tex(y, n) !== NKINDS[given].tex(y, n))].slice(0, 4);
      if (new Set(kinds.map((k) => NKINDS[k].tex(y, n))).size < 4) return null;
      return { given, n, y, tEnd, axis, kinds: shuffle(r, kinds) };
    },
    solve: (p) => ({ eq: p.given }),
    traps: [],
    fields: (p) => [choice('eq', L('Which equation belongs to the graph?', 'Welche Gleichung gehört zum Graphen?'), p.kinds.map((k) => [k, `$${NKINDS[k].tex(p.y, p.n)}$`, k === p.given ? '' : graphWhy(k, p.given), k === p.given ? null : FLAG[k]]), { stack: true })],
    text: (p) => L(`The graph shows the motion of a body (t in s, ${p.y} in cm). It starts at rest. Which equation of motion belongs to it?`, `Der Graph zeigt die Bewegung eines Körpers (t in s, ${p.y} in cm). Er startet in Ruhe. Welche Bewegungsgleichung gehört dazu?`),
    hints: (p) => [
      L('First the kind: a constant amplitude (SHM), a dying amplitude (damping, a term with ẏ), or an oscillation around a shifted equilibrium (a constant).', 'Zuerst die Art: eine konstante Amplitude (harmonisch), eine abklingende Amplitude (Dämpfung, ein Term mit ẏ) oder eine Schwingung um eine verschobene Gleichgewichtslage (eine Konstante).'),
      L('Read the period T off the graph. Then ω = 2π/T, and the factor in ÿ = −K·y is K = ω².', 'Lies die Periode T am Graphen ab. Dann ist ω = 2π/T, und der Faktor in ÿ = −K·y ist K = ω².'),
      L(`Here T ≈ ${sig(p.n.T, 2)} s.`, `Hier ist T ≈ ${sig(p.n.T, 2)} s.`),
    ],
    steps: (p) => [
      step(L('The period', 'Die Periode'), p$(L(`From the graph: T ≈ ${sig(p.n.T, 2)} s. So`, `Aus dem Graphen: T ≈ ${sig(p.n.T, 2)} s. Also`)) + `$$\\omega = \\frac{2\\pi}{T} = ${sig(Math.sqrt(p.n.K))}\\,\\mathrm{s^{-1}},\\qquad K = \\omega^2 = ${p.n.K}\\,\\mathrm{s^{-2}}$$`, ['marks']),
      step(L('The equation', 'Die Gleichung'), p$({
        shm: L('A constant amplitude around 0: an SHM, ÿ = −K·y.', 'Eine konstante Amplitude um 0: eine harmonische Schwingung, ÿ = −K·y.'),
        damp: L('The amplitude dies away: a damping term with ẏ, with a plus sign on the left.', 'Die Amplitude klingt ab: ein Dämpfungsterm mit ẏ, mit Pluszeichen auf der linken Seite.'),
        shift: L('A constant amplitude, but around a shifted equilibrium: ÿ = −K·y + g.', 'Eine konstante Amplitude, aber um eine verschobene Gleichgewichtslage: ÿ = −K·y + g.'),
      }[p.given]) + `$$${res(NKINDS[p.given].tex(p.y, p.n))}$$`, ['marks']),
    ],
    figure: (p, v, view) => `<div class="fig">${Plot.graph([{ pts: curveOf(p.given, p.n, p.tEnd) }], { tEnd: p.tEnd, axis: p.axis, name: p.y, unit: 'cm', marks: view.show && view.show.has('marks') ? [p.n.T, 2 * p.n.T].filter((t) => t <= p.tEnd) : [], label: L('The motion', 'Die Bewegung') })}</div>`,
  };

  // ================================================================ 3 kinematics
  // x(t) = A·sin(ωt) (or A·cos(ωt)), ω = 2π/T = 2πf, v_max = A·ω, a_max = A·ω².
  const AS = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 15, 20].map((x) => x / 100); // m
  const FS = [0.2, 0.25, 0.4, 0.5, 0.8, 1, 1.25, 1.5, 2, 2.5, 4, 5];
  const unitOfA = (A) => (A < 0.01 ? 'mm' : 'cm');
  const wT = (p) => (p.giveT ? `\\frac{2\\pi}{T} = \\frac{2\\pi}{${tq(1 / p.f, 's')}}` : `2\\pi f = 2\\pi\\cdot ${tq(p.f, 'Hz')}`);
  const givenFT = (p) => (p.giveT ? L(`a period of ${q(1 / p.f, 's')}`, `einer Periode von ${q(1 / p.f, 's')}`) : L(`a frequency of ${q(p.f, 'Hz')}`, `einer Frequenz von ${q(p.f, 'Hz')}`));
  const xGraph = (p, o = {}) => {
    const w = PI2 * p.f, T = 1 / p.f, tEnd = 2 * T, cm = p.A * 100, ph = p.start === 'top' ? Math.PI / 2 : 0;
    const pts = Array.from({ length: 201 }, (z, k) => { const t = (k * tEnd) / 200; return [t, cm * Math.sin(w * t + ph)]; });
    return `<div class="fig">${Plot.graph([{ pts }], { tEnd, name: 'x', unit: 'cm', axis: Plot.niceAxis([-cm * 1.05, cm * 1.05]), label: L('Displacement against time', 'Auslenkung gegen die Zeit'), ...o })}</div>`;
  };
  const WHYK = {
    noTwoPi: () => L('The angular frequency is ω = 2πf, not f: the 2π is missing.', 'Die Kreisfrequenz ist ω = 2πf, nicht f: Es fehlt der Faktor 2π.'),
    twopiT: () => L('ω = 2π/T, not 2π·T.', 'ω = 2π/T, nicht 2π·T.'),
    square: () => L('v_max = A·ω and a_max = A·ω²: the square belongs to the acceleration.', 'v_max = A·ω und a_max = A·ω²: Das Quadrat gehört zur Beschleunigung.'),
    inverse: () => L('Upside down: from v_max = A·ω, ω = v_max/A.', 'Kehrwert verwechselt: Aus v_max = A·ω folgt ω = v_max/A.'),
    freq: () => L('That is the frequency f = ω/(2π); the angular frequency is ω = a_max/v_max.', 'Das ist die Frequenz f = ω/(2π); die Kreisfrequenz ist ω = a_max/v_max.'),
    vx: () => L('v = ω·x would be largest at the turning point, where the body stands still. The speed is largest at the equilibrium: v = ω·√(A² − x²).', 'v = ω·x wäre am Umkehrpunkt am grössten, wo der Körper stillsteht. Die Geschwindigkeit ist in der Gleichgewichtslage am grössten: v = ω·√(A² − x²).'),
    linear: () => L('The speed does not fall off linearly with x: v = ω·√(A² − x²) (from energy, or from sin² + cos² = 1).', 'Die Geschwindigkeit nimmt nicht linear mit x ab: v = ω·√(A² − x²) (aus der Energie, oder aus sin² + cos² = 1).'),
    plus: () => L('A minus under the root: v = ω·√(A² − x²); at x = A the speed is 0.', 'Unter der Wurzel ein Minus: v = ω·√(A² − x²); bei x = A ist die Geschwindigkeit 0.'),
    amax: () => L('That is the largest acceleration, at the turning point. At x, a = ω²·x.', 'Das ist die grösste Beschleunigung, am Umkehrpunkt. Bei x ist a = ω²·x.'),
    swap: () => L('Sine and cosine swapped: check where the body is at t = 0.', 'Sinus und Kosinus vertauscht: Prüfe, wo der Körper bei t = 0 ist.'),
    deg: () => L('Your calculator is set to degrees: ω·t is in radians.', 'Dein Taschenrechner steht auf Grad: ω·t ist im Bogenmass.'),
  };
  const pickAF = (r) => ({ A: pick(r, AS), f: pick(r, FS), giveT: r() < 0.5 });

  const vmax = {
    id: 'vmax', difficulty: 2, kind: 'kin',
    title: () => L('Fastest and strongest', 'Am schnellsten, am stärksten'),
    make: pickAF,
    solve: (p, o = {}) => { const w = o.noTwoPi ? p.f : o.twopiT && p.giveT ? PI2 / p.f : PI2 * p.f; return { w, vmax: o.square ? p.A * w * w : p.A * w, amax: o.square ? p.A * w : p.A * w * w }; },
    traps: ['noTwoPi', 'twopiT', 'square'],
    why: { noTwoPi: WHYK.noTwoPi, twopiT: WHYK.twopiT, square: WHYK.square },
    fields: (p) => { const w = PI2 * p.f; return [num$('vmax', 'v_\\mathrm{max}', speedUnit(p.A * w), L('largest speed', 'grösste Geschwindigkeit')), num$('amax', 'a_\\mathrm{max}', 'm/s²', L('largest acceleration', 'grösste Beschleunigung'))]; },
    text: (p) => L(`A body oscillates harmonically with an amplitude of ${q(p.A, unitOfA(p.A))} and ${givenFT(p)}. What are its largest speed and its largest acceleration?`,
      `Ein Körper schwingt harmonisch mit einer Amplitude von ${q(p.A, unitOfA(p.A))} und ${givenFT(p)}. Wie gross sind seine grösste Geschwindigkeit und seine grösste Beschleunigung?`),
    hints: () => [
      L('From $x(t) = A\\cdot\\sin(\\omega t)$: $v(t) = A\\omega\\cdot\\cos(\\omega t)$ and $a(t) = -A\\omega^2\\cdot\\sin(\\omega t)$. Cosine and sine are at most 1.', 'Aus $x(t) = A\\cdot\\sin(\\omega t)$: $v(t) = A\\omega\\cdot\\cos(\\omega t)$ und $a(t) = -A\\omega^2\\cdot\\sin(\\omega t)$. Kosinus und Sinus sind höchstens 1.'),
      L('$\\omega = 2\\pi f = 2\\pi/T$. The amplitude in metres.', '$\\omega = 2\\pi f = 2\\pi/T$. Die Amplitude in Metern.'),
    ],
    steps: (p, v) => [
      step(L('The angular frequency', 'Die Kreisfrequenz'), `$$\\omega = ${wT(p)} = ${tnum(v.w)}\\,\\mathrm{s^{-1}}$$`),
      step(L('The largest speed', 'Die grösste Geschwindigkeit'), p$(L('With $x(t) = A\\cdot\\sin(\\omega t)$, the velocity is $v(t) = A\\omega\\cdot\\cos(\\omega t)$: largest where the cosine is ±1, at the equilibrium.', 'Mit $x(t) = A\\cdot\\sin(\\omega t)$ ist die Geschwindigkeit $v(t) = A\\omega\\cdot\\cos(\\omega t)$: am grössten, wo der Kosinus ±1 ist, in der Gleichgewichtslage.')) +
        `$$v_\\mathrm{max} = A\\,\\omega = ${tq(p.A, 'm')}\\cdot ${tnum(v.w)}\\,\\mathrm{s^{-1}} = ${res(tq(v.vmax, speedUnit(v.vmax)))}$$`, ['eq']),
      step(L('The largest acceleration', 'Die grösste Beschleunigung'), p$(L('The acceleration $a(t) = -A\\omega^2\\cdot\\sin(\\omega t)$ is largest at the turning points.', 'Die Beschleunigung $a(t) = -A\\omega^2\\cdot\\sin(\\omega t)$ ist an den Umkehrpunkten am grössten.')) +
        `$$a_\\mathrm{max} = A\\,\\omega^2 = ${tq(p.A, 'm')}\\cdot (${tnum(v.w)}\\,\\mathrm{s^{-1}})^2 = ${res(tq(v.amax, 'm/s²'))}$$`, ['top']),
    ],
    figure: (p, v, view) => (view.task ? '' : xGraph({ ...p, start: 'eq' }, { dots: view.show && view.show.has('eq') ? [[0, 0], [0.5 / p.f, 0]] : view.show && view.show.has('top') ? [[0.25 / p.f, p.A * 100], [0.75 / p.f, -p.A * 100]] : [] })),
  };

  const backF = {
    id: 'back-f', difficulty: 3, kind: 'kin',
    title: () => L('How often?', 'Wie oft?'),
    make: pickAF,
    solve: (p, o = {}) => { const vm = p.A * PI2 * p.f, w = o.inverse ? p.A / vm : vm / p.A, f = o.noTwoPi ? w : w / PI2; return { vm, w, f, T: 1 / f }; },
    traps: ['inverse', 'noTwoPi'],
    why: { inverse: WHYK.inverse, noTwoPi: WHYK.noTwoPi },
    fields: () => [num$('f', 'f', 'Hz', L('frequency', 'Frequenz')), num$('T', 'T', 's', L('period', 'Periode'))],
    text: (p) => { const vm = p.A * PI2 * p.f; return L(`A body oscillates harmonically with an amplitude of ${q(p.A, unitOfA(p.A))}. Its largest speed is ${q(vm, speedUnit(vm))}. What are its frequency and its period?`, `Ein Körper schwingt harmonisch mit einer Amplitude von ${q(p.A, unitOfA(p.A))}. Seine grösste Geschwindigkeit beträgt ${q(vm, speedUnit(vm))}. Wie gross sind seine Frequenz und seine Periode?`); },
    hints: () => [L('$v_\\mathrm{max} = A\\,\\omega$: solve for $\\omega$.', '$v_\\mathrm{max} = A\\,\\omega$: Löse nach $\\omega$ auf.'), L('$f = \\omega/(2\\pi)$ and $T = 1/f$.', '$f = \\omega/(2\\pi)$ und $T = 1/f$.')],
    steps: (p, v) => [
      step(L('The angular frequency', 'Die Kreisfrequenz'), `$$\\omega = \\frac{v_\\mathrm{max}}{A} = \\frac{${tq(v.vm, 'm/s')}}{${tq(p.A, 'm')}} = ${tnum(v.w)}\\,\\mathrm{s^{-1}}$$`),
      step(L('Frequency and period', 'Frequenz und Periode'), `$$f = \\frac{\\omega}{2\\pi} = ${res(tq(v.f, 'Hz'))},\\qquad T = \\frac{1}{f} = ${res(tq(v.T, 's'))}$$`, ['T']),
    ],
    figure: (p, v, view) => (view.task ? '' : xGraph({ ...p, start: 'eq' }, { marks: view.show && view.show.has('T') ? [1 / p.f] : [] })),
  };

  const backA = {
    id: 'back-A', difficulty: 3, kind: 'kin',
    title: () => L('How far?', 'Wie weit?'),
    make: pickAF,
    solve: (p, o = {}) => { const w0 = PI2 * p.f, vm = p.A * w0, am = p.A * w0 * w0, w = o.inverse ? vm / am : o.freq ? am / vm / PI2 : am / vm; return { vm, am, w, A: vm / w }; },
    traps: ['inverse', 'freq'],
    why: { inverse: () => L('Upside down: a_max/v_max = Aω²/(Aω) = ω.', 'Kehrwert verwechselt: a_max/v_max = Aω²/(Aω) = ω.'), freq: WHYK.freq },
    fields: (p) => [num$('w', '\\omega', 'rad/s', L('angular frequency', 'Kreisfrequenz')), num$('A', 'A', unitOfA(p.A), L('amplitude', 'Amplitude'))],
    text: (p) => { const w = PI2 * p.f, vm = p.A * w, am = p.A * w * w; return L(`A body oscillates harmonically. Its largest speed is ${q(vm, speedUnit(vm))}, its largest acceleration ${q(am, 'm/s²')}. What are its angular frequency and its amplitude?`, `Ein Körper schwingt harmonisch. Seine grösste Geschwindigkeit beträgt ${q(vm, speedUnit(vm))}, seine grösste Beschleunigung ${q(am, 'm/s²')}. Wie gross sind seine Kreisfrequenz und seine Amplitude?`); },
    hints: () => [L('$v_\\mathrm{max} = A\\,\\omega$ and $a_\\mathrm{max} = A\\,\\omega^2$: two equations for $A$ and $\\omega$.', '$v_\\mathrm{max} = A\\,\\omega$ und $a_\\mathrm{max} = A\\,\\omega^2$: zwei Gleichungen für $A$ und $\\omega$.'), L('Divide them: $a_\\mathrm{max}/v_\\mathrm{max} = \\omega$.', 'Teile sie: $a_\\mathrm{max}/v_\\mathrm{max} = \\omega$.')],
    steps: (p, v) => [
      step(L('The angular frequency', 'Die Kreisfrequenz'), p$(L('Divide $a_\\mathrm{max} = A\\,\\omega^2$ by $v_\\mathrm{max} = A\\,\\omega$:', 'Teile $a_\\mathrm{max} = A\\,\\omega^2$ durch $v_\\mathrm{max} = A\\,\\omega$:')) + `$$\\omega = \\frac{a_\\mathrm{max}}{v_\\mathrm{max}} = \\frac{${tq(v.am, 'm/s²')}}{${tq(v.vm, 'm/s')}} = ${res(`${tnum(v.w)}\\,\\mathrm{s^{-1}}`)}$$`),
      step(L('The amplitude', 'Die Amplitude'), `$$A = \\frac{v_\\mathrm{max}}{\\omega} = \\frac{${tq(v.vm, 'm/s')}}{${tnum(v.w)}\\,\\mathrm{s^{-1}}} = ${res(tq(v.A, unitOfA(p.A)))}$$`, ['top']),
    ],
    figure: (p, v, view) => (view.task ? '' : xGraph({ ...p, start: 'eq' }, { dots: view.show && view.show.has('top') ? [[0.25 / p.f, p.A * 100]] : [] })),
  };

  const speedX = {
    id: 'speed-x', difficulty: 4, kind: 'kin',
    title: () => L('On the way', 'Unterwegs'),
    make: (r) => { const p = pickAF(r); p.k = pick(r, [0.2, 0.25, 0.4, 0.5, 0.6, 0.75, 0.8]); return p; },
    solve: (p, o = {}) => {
      const w = PI2 * p.f, x = p.k * p.A;
      const v = o.vx ? w * x : o.linearv ? p.A * w * (1 - p.k) : o.rootplus ? w * Math.sqrt(p.A ** 2 + x ** 2) : w * Math.sqrt(p.A ** 2 - x ** 2);
      return { w, x, v, a: o.amax ? w * w * p.A : w * w * x };
    },
    traps: ['vx', 'linearv', 'rootplus', 'amax'],
    why: { vx: WHYK.vx, linearv: WHYK.linear, rootplus: WHYK.plus, amax: WHYK.amax },
    fields: (p) => { const w = PI2 * p.f; return [num$('v', 'v', speedUnit(w * p.A), L('speed there', 'Geschwindigkeit dort')), num$('a', 'a', 'm/s²', L('size of the acceleration there', 'Betrag der Beschleunigung dort'))]; },
    text: (p) => L(`A body oscillates harmonically with an amplitude of ${q(p.A, unitOfA(p.A))} and ${givenFT(p)}. How fast is it, and how large is its acceleration, when it is ${q(p.k * p.A, unitOfA(p.A))} from the equilibrium?`,
      `Ein Körper schwingt harmonisch mit einer Amplitude von ${q(p.A, unitOfA(p.A))} und ${givenFT(p)}. Wie schnell ist er, und wie gross ist seine Beschleunigung, wenn er ${q(p.k * p.A, unitOfA(p.A))} von der Gleichgewichtslage entfernt ist?`),
    hints: () => [
      L('$x = A\\sin(\\omega t)$ and $v = A\\omega\\cos(\\omega t)$. With $\\sin^2 + \\cos^2 = 1$: $v = \\omega\\sqrt{A^2 - x^2}$.', '$x = A\\sin(\\omega t)$ und $v = A\\omega\\cos(\\omega t)$. Mit $\\sin^2 + \\cos^2 = 1$: $v = \\omega\\sqrt{A^2 - x^2}$.'),
      L('The acceleration is proportional to the displacement: $a = -\\omega^2 x$.', 'Die Beschleunigung ist proportional zur Auslenkung: $a = -\\omega^2 x$.'),
    ],
    steps: (p, v) => [
      step(L('The angular frequency', 'Die Kreisfrequenz'), `$$\\omega = ${wT(p)} = ${tnum(v.w)}\\,\\mathrm{s^{-1}}$$`),
      step(L('The speed at x', 'Die Geschwindigkeit bei x'), p$(L('From $x = A\\sin(\\omega t)$ and $v = A\\omega\\cos(\\omega t)$ with $\\sin^2 + \\cos^2 = 1$:', 'Aus $x = A\\sin(\\omega t)$ und $v = A\\omega\\cos(\\omega t)$ mit $\\sin^2 + \\cos^2 = 1$:')) +
        `$$v = \\omega\\sqrt{A^2 - x^2} = ${tnum(v.w)}\\,\\mathrm{s^{-1}}\\cdot\\sqrt{(${tq(p.A, 'm')})^2 - (${tq(v.x, 'm')})^2} = ${res(tq(v.v, speedUnit(PI2 * p.f * p.A)))}$$`, ['x']),
      step(L('The acceleration at x', 'Die Beschleunigung bei x'), `$$|a| = \\omega^2\\, x = (${tnum(v.w)}\\,\\mathrm{s^{-1}})^2\\cdot ${tq(v.x, 'm')} = ${res(tq(v.a, 'm/s²'))}$$` + p$(L('It points back to the equilibrium.', 'Sie zeigt zur Gleichgewichtslage zurück.')), ['x']),
    ],
    figure: (p, v, view) => {
      if (view.task) return '';
      const T = 1 / p.f, t1 = Math.asin(p.k) / (PI2 * p.f), cm = p.k * p.A * 100;
      return xGraph({ ...p, start: 'eq' }, { dots: view.show && view.show.has('x') ? [[t1, cm], [T / 2 - t1, cm], [T + t1, cm], [1.5 * T - t1, cm]] : [] });
    },
  };

  const speedT = {
    id: 'speed-t', difficulty: 5, kind: 'kin',
    title: () => L('At a given moment', 'In einem bestimmten Moment'),
    make: (r) => { const p = pickAF(r); p.start = r() < 0.5 ? 'eq' : 'top'; p.u = pick(r, [0.1, 0.15, 0.2, 0.3, 0.35, 0.4, 0.55, 0.6, 0.65, 0.7, 0.8, 0.85, 0.9]); return p; },
    solve: (p, o = {}) => {
      const w = PI2 * p.f, t = sig(p.u / p.f, 2), ph = o.deg ? (w * t * Math.PI) / 180 : w * t;
      const top = o.swap ? p.start !== 'top' : p.start === 'top';
      return { w, t, x: top ? p.A * Math.cos(ph) : p.A * Math.sin(ph), v: top ? -p.A * w * Math.sin(ph) : p.A * w * Math.cos(ph) };
    },
    traps: ['swap', 'deg'],
    why: { swap: WHYK.swap, deg: WHYK.deg },
    fields: (p) => [num$('x', 'x', unitOfA(p.A), L('displacement', 'Auslenkung'), true), num$('v', 'v', speedUnit(PI2 * p.f * p.A), L('velocity', 'Geschwindigkeit'), true)],
    text: (p) => { const t = sig(p.u / p.f, 2); return L(`A body oscillates harmonically with an amplitude of ${q(p.A, unitOfA(p.A))} and ${givenFT(p)}. At t = 0 it is ${p.start === 'top' ? 'at its highest point (x = A)' : 'at the equilibrium, moving in the positive direction'}. Where is it at t = ${q(t, 's')}, and what is its velocity then (with signs)?`,
      `Ein Körper schwingt harmonisch mit einer Amplitude von ${q(p.A, unitOfA(p.A))} und ${givenFT(p)}. Bei t = 0 ist er ${p.start === 'top' ? 'an seinem höchsten Punkt (x = A)' : 'in der Gleichgewichtslage und bewegt sich in positiver Richtung'}. Wo ist er bei t = ${q(t, 's')}, und wie gross ist dann seine Geschwindigkeit (mit Vorzeichen)?`); },
    hints: (p) => [
      p.start === 'top' ? L('Starting at x = A: $x(t) = A\\cos(\\omega t)$, $v(t) = -A\\omega\\sin(\\omega t)$.', 'Start bei x = A: $x(t) = A\\cos(\\omega t)$, $v(t) = -A\\omega\\sin(\\omega t)$.')
        : L('Starting at the equilibrium: $x(t) = A\\sin(\\omega t)$, $v(t) = A\\omega\\cos(\\omega t)$.', 'Start in der Gleichgewichtslage: $x(t) = A\\sin(\\omega t)$, $v(t) = A\\omega\\cos(\\omega t)$.'),
      L('$\\omega t$ is in radians: set the calculator to RAD.', '$\\omega t$ ist im Bogenmass: Stell den Taschenrechner auf RAD.'),
    ],
    steps: (p, v) => {
      const top = p.start === 'top', x$ = top ? 'A\\cos(\\omega t)' : 'A\\sin(\\omega t)', v$ = top ? '-A\\omega\\sin(\\omega t)' : 'A\\omega\\cos(\\omega t)';
      return [
        step(L('The motion', 'Die Bewegung'), p$(top ? L('At t = 0 at the top: a cosine.', 'Bei t = 0 oben: ein Kosinus.') : L('At t = 0 at the equilibrium, moving up: a sine.', 'Bei t = 0 in der Gleichgewichtslage, nach oben unterwegs: ein Sinus.')) +
          `$$x(t) = ${x$},\\qquad v(t) = ${v$},\\qquad \\omega = ${wT(p)} = ${tnum(v.w)}\\,\\mathrm{s^{-1}}$$`),
        step(L('At that moment', 'In diesem Moment'), `$$\\omega t = ${tnum(v.w)}\\,\\mathrm{s^{-1}}\\cdot ${tq(v.t, 's')} = ${tnum(v.w * v.t)}\\;(\\mathrm{rad})$$` +
          ` $$x = ${res(tq(v.x, unitOfA(p.A)))},\\qquad v = ${res(tq(v.v, speedUnit(PI2 * p.f * p.A)))}$$`, ['t']),
      ];
    },
    figure: (p, v, view) => (view.task ? '' : xGraph(p, { marks: view.show && view.show.has('t') ? [v.t] : [], dots: view.show && view.show.has('t') ? [[v.t, v.x * 100]] : [] })),
  };

  const SCENARIOS = [pickShm, shm1, period1, mistake1, shm2, period2, mistake2, shm3, match1, match2, matchBack, vmax, backF, backA, speedX, speedT];

  root.Scenarios = { SCENARIOS, NKINDS, curveOf, Y0, xGraph };
  if (typeof module !== 'undefined') module.exports = root.Scenarios;
})(typeof window !== 'undefined' ? window : globalThis);
