// Random switching RL circuits: find the currents immediately after a switch is closed or opened.
//
// A circuit is a battery (voltage V, + at the top) and a main line along the top wire with an
// optional resistor R1, followed by a group of parallel branches between a top and a bottom
// rail. A branch is a resistor, an inductor, or both in series. The switch S sits in the main
// line, in a branch without an inductor, or across R1 (closed, it bridges R1).
//
// Before t = 0 the switch has been in its first state for a long time: the currents are
// constant, so no emf is induced and the inductors act like wires. At t = 0 the switch
// changes. The current through an inductor cannot jump, so immediately afterwards every
// inductor keeps its current (it acts like a current source), and the other currents follow
// from Kirchhoff's rules. With U the voltage across the branches (top rail − bottom rail):
//   junction rule   I = Σ I_L + Σ U/R_k    (branches without an inductor that are closed)
//   loop rule       V = r·I + U            (main line closed; r = R1, or 0 if R1 is bridged)
// Currents count along the arrows in the diagram: to the right through R1, down through the
// branches, so a current flowing the other way is negative. V_L is the voltage across an
// inductor in the direction of its arrow, V_L = L·ΔI/Δt; the self-induced emf of the coil is
// 𝓔_i = −L·ΔI/Δt = −V_L. Values are exact fractions
// (V, Ω, A); V is chosen so that every value in the solution is a multiple of 0.1.
(function (root) {
  'use strict';

  const Circuit = root.Circuit || require('./circuit.js');
  const M = String.raw;
  const RS = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20]; // Ω
  const LS = [0.2, 0.5, 1, 2, 5];                // H: irrelevant right after switching
  const LEVELS = {
    easy: { name: 'Easy', vl: false },
    medium: { name: 'Medium', vl: true },
    hard: { name: 'Hard', vl: true },
  };

  // ---------------------------------------------------------------- random numbers
  function rng(seed) {
    let a = seed >>> 0;
    const next = () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
    return {
      next, int,
      pick: (arr) => arr[Math.floor(next() * arr.length)],
      shuffle: (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = int(0, i); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; },
    };
  }

  // ---------------------------------------------------------------- exact fractions
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const lcm = (a, b) => (a / gcd(a, b)) * b;
  function F(n, d = 1) {
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d) || 1;
    return { n: n / g + 0, d: d / g };
  }
  const ZERO = F(0), ONE = F(1);
  const fadd = (a, b) => F(a.n * b.d + b.n * a.d, a.d * b.d);
  const fsub = (a, b) => F(a.n * b.d - b.n * a.d, a.d * b.d);
  const fmul = (a, b) => F(a.n * b.n, a.d * b.d);
  const fdiv = (a, b) => F(a.n * b.d, a.d * b.n);
  const fneg = (a) => F(-a.n, a.d);
  const fabs = (a) => F(Math.abs(a.n), a.d);
  const fval = (f) => f.n / f.d;
  const isZero = (f) => f.n === 0;
  const feq = (a, b) => a.n === b.n && a.d === b.d;

  function fmt(x) {
    if (Math.abs(x - Math.round(x)) < 1e-9) return String(Math.round(x));
    return String(parseFloat(x.toFixed(2)));
  }
  // Decimal if it terminates within two places, otherwise a fraction (LaTeX).
  const ftex = (f) => (f.d === 1 || 100 % f.d === 0 ? fmt(fval(f)) : `${f.n < 0 ? '-' : ''}\\tfrac{${Math.abs(f.n)}}{${f.d}}`);
  // The same as plain text (diagram labels): 2/3 instead of \tfrac.
  const ftxt = (f) => (f.d === 1 || 100 % f.d === 0 ? fmt(fval(f)) : `${f.n}/${f.d}`).replace('-', '−');

  // ---------------------------------------------------------------- the physics
  // c = { r1: F | null, branches: [{ R: F | null, L: bool, H: henry, sw: bool }],
  //       sw: { at: 'main' | 'branch' | 'bridge', j: branch, before: 'open' | 'closed' }, V: F }
  function config(c, closed) {
    const main = !(c.sw.at === 'main' && !closed);
    const bridged = c.sw.at === 'bridge' && closed;
    const r = c.r1 && !bridged ? c.r1 : ZERO;
    const active = c.branches.map((b, j) => !(c.sw.at === 'branch' && c.sw.j === j && !closed));
    return { main, bridged, r, active };
  }

  // Long after the switch was set (inductors act like wires): { I, U, Ib, IR1 }, or null if the
  // battery would be shorted or two inductors would share a current in an undefined way.
  function steady(c, closed) {
    const { main, bridged, r, active } = config(c, closed), V = c.V, n = c.branches.length;
    const zeros = { I: ZERO, U: ZERO, Ib: new Array(n).fill(ZERO), IR1: ZERO };
    if (!main) return zeros;
    const on = c.branches.map((b, j) => j).filter((j) => active[j]);
    const wires = on.filter((j) => c.branches[j].L && !c.branches[j].R);
    if (wires.length > 1) return null;
    if (wires.length === 1) {
      if (isZero(r)) return null;
      const I = fdiv(V, r), Ib = zeros.Ib.slice();
      Ib[wires[0]] = I;
      return { I, U: ZERO, Ib, IR1: bridged ? ZERO : I };
    }
    if (!on.length) return zeros;
    const G = on.reduce((s, j) => fadd(s, fdiv(ONE, c.branches[j].R)), ZERO);
    const U = isZero(r) ? V : fdiv(V, fadd(ONE, fmul(r, G))); // V = r·I + U with I = U·G
    const I = fmul(U, G);
    return { I, U, Ib: c.branches.map((b, j) => (active[j] ? fdiv(U, b.R) : ZERO)), IR1: bridged ? ZERO : I, G };
  }

  // Immediately after the switch was set, with the inductor currents IL (per branch, zero where
  // there is no inductor): { I, U, Ib, VL, IR1 }, or null if an inductor current has no path.
  function after(c, closed, IL) {
    const { main, bridged, r, active } = config(c, closed), V = c.V;
    const sumIL = IL.reduce(fadd, ZERO);
    const res = c.branches.map((b, j) => j).filter((j) => active[j] && !c.branches[j].L);
    const G = res.reduce((s, j) => fadd(s, fdiv(ONE, c.branches[j].R)), ZERO);
    let U;
    if (main && !isZero(r)) U = fdiv(fsub(V, fmul(r, sumIL)), fadd(ONE, fmul(r, G)));
    else if (main) U = V;
    else if (isZero(G)) return null;
    else U = fdiv(fneg(sumIL), G);
    const Ib = c.branches.map((b, j) => (b.L ? IL[j] : active[j] ? fdiv(U, b.R) : ZERO));
    const I = main ? Ib.reduce(fadd, ZERO) : ZERO;
    const VL = c.branches.map((b, j) => (b.L ? fsub(U, b.R ? fmul(b.R, IL[j]) : ZERO) : null));
    return { I, U, Ib, VL, IR1: bridged ? ZERO : I, sumIL, G, main, r, bridged, res };
  }

  // ---------------------------------------------------------------- names
  // Resistors R1, R2, … in reading order (main line first), inductors L (or L1, L2, …).
  function namer(c) {
    let k = 0, m = 0;
    const nL = c.branches.filter((b) => b.L).length;
    const r1 = c.r1 ? ++k : null;
    const br = c.branches.map((b) => ({ R: b.R ? ++k : null, L: b.L ? (nL > 1 ? ++m : 0) : null }));
    const Lname = (m) => (m ? `L_{${m}}` : 'L');
    const Lsub = (m) => (m ? `L${m}` : 'L');
    return {
      r1, br,
      R: (k) => `R_{${k}}`,
      L: (j) => Lname(br[j].L),
      // current through branch j: named after its resistor, or its inductor
      Ib: (j) => (br[j].R ? `I_{${br[j].R}}` : `I_{${Lsub(br[j].L)}}`),
      IL: (j) => `I_{${Lsub(br[j].L)}}`,
      VL: (j) => `V_{${Lsub(br[j].L)}}`,
      EMF: (j) => (br[j].L ? `\\mathcal{E}_{\\mathrm{i},${br[j].L}}` : '\\mathcal{E}_\\mathrm{i}'),
      IR1: () => `I_{${r1}}`,
      main: () => (r1 ? `I_{${r1}}` : 'I'),
    };
  }

  // ---------------------------------------------------------------- random circuits
  const branch = (r, R, L) => ({ R: R ? F(r.pick(RS)) : null, L, H: L ? r.pick(LS) : null, sw: false });

  function randomCircuit(level, r) {
    if (level === 'easy') {
      const shape = r.pick(['loop', 'RL', 'RL', 'RRL', 'RRL', 'noR1']);
      const b = {
        loop: () => [branch(r, false, true)],
        RL: () => [branch(r, true, false), branch(r, false, true)],
        RRL: () => [branch(r, true, true), branch(r, true, false)],
        noR1: () => [branch(r, true, false), branch(r, true, true)],
      }[shape]();
      return { r1: shape === 'noR1' ? null : F(r.pick(RS)), branches: r.shuffle(b), sw: { at: 'main', before: 'open' } };
    }
    if (level === 'medium') {
      const b = r.shuffle([branch(r, r.next() < 0.6, true), branch(r, true, false)]);
      return { r1: r.next() < 0.75 ? F(r.pick(RS)) : null, branches: b, sw: { at: 'main', before: r.pick(['open', 'closed']) } };
    }
    const n = r.int(2, 3), nL = n === 3 && r.next() < 0.5 ? 2 : 1;
    const b = [];
    for (let j = 0; j < n; j++) b.push(j < nL ? branch(r, j > 0 || r.next() < 0.6, true) : branch(r, true, false));
    r.shuffle(b);
    const c = { r1: r.next() < 0.85 ? F(r.pick(RS)) : null, branches: b, sw: { at: 'main', before: r.pick(['open', 'closed']) } };
    const at = r.pick(['main', 'branch', 'branch', 'bridge', 'bridge']);
    const plain = b.map((x, j) => j).filter((j) => !b[j].L);
    if (at === 'branch' && plain.length) { c.sw = { at, j: r.pick(plain), before: c.sw.before }; b[c.sw.j].sw = true; }
    if (at === 'bridge' && c.r1) c.sw = { at, before: c.sw.before };
    return c;
  }

  // ---------------------------------------------------------------- exercises
  // Everything about circuit c (with its voltage set): the states and the answers, or null if
  // the circuit is not usable (a short, or an inductor current without a path).
  function solve(c) {
    const first = c.sw.before === 'closed', then = !first;
    const s0 = steady(c, first), s2 = steady(c, then);
    if (!s0 || !s2) return null;
    const IL = c.branches.map((b, j) => (b.L ? s0.Ib[j] : ZERO));
    const s1 = after(c, then, IL);
    if (!s1) return null;
    return { s0, s1, s2, IL, first, then };
  }

  // The quantities asked for, in reading order: currents through the resistors and through
  // inductors without a resistor (signed along the arrows), then |V_L| if the level asks for it.
  function targets(c, nm, st, vl) {
    const out = [];
    if (c.r1) out.push({ key: 'IR1', sym: nm.IR1(), unit: 'A', value: st.s1.IR1 });
    c.branches.forEach((b, j) => out.push({ key: `I${j}`, sym: nm.Ib(j), unit: 'A', value: st.s1.Ib[j], j }));
    if (vl) c.branches.forEach((b, j) => { if (b.L) out.push({ key: `V${j}`, sym: `|${nm.VL(j)}|`, unit: 'V', value: fabs(st.s1.VL[j]), j, abs: true }); });
    return out;
  }

  // Values of the targets under the typical wrong ideas, for feedback: the inductor acts like a
  // wire at once (wire), its current drops to zero (zero), or nothing changes (same).
  function models(c, st, list) {
    const zero = after(c, st.then, c.branches.map(() => ZERO));
    const pick = (s, t) => {
      if (!s) return null;
      if (t.key === 'IR1') return s.IR1;
      if (t.key[0] === 'I') return s.Ib[t.j];
      return s.VL ? fabs(s.VL[t.j]) : ZERO; // an inductor acting like a wire has no voltage
    };
    return list.map((t) => ({ wire: pick(st.s2, t), zero: pick(zero, t), same: pick(st.s0, t) }));
  }

  // Choose V so that every value is a multiple of 0.1 (all values are proportional to V).
  function withVoltage(c, r) {
    c.V = ONE;
    const st = solve(c);
    if (!st) return null;
    const vals = [st.s0.I, st.s0.U, ...st.s0.Ib, st.s1.I, st.s1.U, ...st.s1.Ib, ...st.s1.VL.filter(Boolean), st.s2.I, ...st.s2.Ib];
    let step = 1;
    for (const v of vals) step = lcm(step, v.d / gcd(v.d, 10));
    const choices = [];
    for (let V = 4; V <= 60; V++) if (V % step === 0) choices.push(V);
    if (!choices.length) return null;
    c.V = F(r.pick(choices));
    return solve(c);
  }

  function usable(c, st, level) {
    const all = [...st.s1.Ib, st.s1.I, ...st.s0.Ib, st.s0.I].map(fval);
    if (all.some((x) => Math.abs(x) > 10 || (x !== 0 && Math.abs(x) < 0.1 - 1e-9))) return false;
    if (st.s1.VL.some((v) => v && Math.abs(fval(v)) > 150)) return false;
    if (level === 'easy') return true;
    // The inductor matters: right after switching, some current has changed (so “nothing
    // changes” is wrong) and some current is not yet at its final value (so “the inductor acts
    // like a wire at once” is wrong).
    const cur = (s) => [s.IR1, ...s.Ib].map(fval);
    const a = cur(st.s0), b = cur(st.s1), z = cur(st.s2);
    return b.some((x, k) => Math.abs(x - a[k]) > 1e-9) && b.some((x, k) => Math.abs(x - z[k]) > 1e-9);
  }

  function build(level, seed) {
    const r = rng(seed);
    for (let attempt = 0; attempt < 5000; attempt++) {
      const c = randomCircuit(level, r);
      const st = withVoltage(c, r);
      if (st && usable(c, st, level)) return { c, st };
    }
    throw new Error(`No ${level} exercise found for seed ${seed}`);
  }

  // ---------------------------------------------------------------- text
  const UNIT_TEX = { A: M`\mathrm{A}`, V: M`\mathrm{V}`, O: M`\Omega` };
  const q = (f, u) => `${ftex(f)}\\,${UNIT_TEX[u]}`;
  const listing = (items) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);
  const al = (...lines) => M`$$\begin{aligned}` + lines.join(M` \\ `) + M`\end{aligned}$$`;
  const verb = (closed) => (closed ? 'closed' : 'opened');

  function where(c, nm) {
    if (c.sw.at === 'main') return 'in the main line';
    if (c.sw.at === 'bridge') return `across $${nm.R(nm.r1)}$`;
    return `in the branch of $${nm.R(nm.br[c.sw.j].R)}$`;
  }

  function taskText(c, nm, list) {
    const first = c.sw.before === 'closed';
    const cur = list.filter((t) => t.unit === 'A').map((t) => `$${t.sym}$`);
    const volt = list.filter((t) => t.unit === 'V').map((t) => `$${t.sym.replace(/\|/g, '')}$`);
    return `The switch S ${where(c, nm)} has been ${first ? 'closed' : 'open'} for a long time. At $t = 0$ it is ${verb(!first)}. ` +
      `Find the currents ${listing(cur)} immediately after the switch is ${verb(!first)}` +
      (volt.length ? `, and the size of the voltage ${listing(volt)} across the inductor${volt.length > 1 ? 's' : ''}` : '') +
      '. The arrows show the positive direction of the currents.';
  }

  // Before t = 0: the steady currents, in particular the inductor currents.
  const EMF = M`\mathcal{E}_\mathrm{i}`;

  function beforeText(c, nm, st) {
    const { main, r, active, bridged } = config(c, st.first), s = st.s0, V = c.V;
    const Ls = c.branches.map((b, j) => j).filter((j) => c.branches[j].L);
    const ILs = listing(Ls.map((j) => `$${nm.IL(j)} = ${q(s.Ib[j], 'A')}$`));
    const out = [`Before $t = 0$, the switch has been ${st.first ? 'closed' : 'open'} for a long time.`];
    if (!main) {
      out.push(`The circuit is open, so no current flows: ${ILs}.`);
      return out;
    }
    out.push(`The currents have become constant, so the self-induced emf $${EMF} = -L\\,\\frac{\\Delta I}{\\Delta t}$ is zero, and so is the voltage across ${Ls.length > 1 ? 'each coil' : 'the coil'}: the inductor${Ls.length > 1 ? 's act like wires' : ' acts like a wire'}.`);
    if (!active.every(Boolean)) out.push(`The branch of $${nm.R(nm.br[c.sw.j].R)}$ is open, so no current flows through it.`);
    if (bridged) out.push(`The closed switch bridges $${nm.R(nm.r1)}$: no current flows through $${nm.R(nm.r1)}$.`);
    const on = c.branches.map((b, j) => j).filter((j) => active[j]);
    const wire = on.find((j) => c.branches[j].L && !c.branches[j].R);
    if (wire !== undefined) {
      out.push(`The inductor $${nm.L(wire)}$ alone connects the rails like a wire, so there is no voltage across the other branches and no current through them. ` +
        `All the current flows through $${nm.R(nm.r1)}$ and $${nm.L(wire)}$:` + al(M`${nm.IL(wire)} &= \frac{V}{${nm.R(nm.r1)}} = \frac{${q(V, 'V')}}{${q(c.r1, 'O')}} = ${q(s.I, 'A')}`));
      return out;
    }
    const Rs = on.map((j) => nm.R(nm.br[j].R));
    const Rp = fdiv(ONE, s.G);
    if (isZero(r)) {
      out.push(`The battery is connected directly across the branches, so $U = V = ${q(V, 'V')}$.`);
    } else {
      const rp = on.length > 1
        ? M`R_\text{p} &= \left(${Rs.map((x) => M`\frac{1}{${x}}`).join(' + ')}\right)^{-1} = ${q(Rp, 'O')}`
        : M`R_\text{p} &= ${Rs[0]} = ${q(Rp, 'O')}`;
      out.push(`With the inductor${Ls.length > 1 ? 's' : ''} as ${Ls.length > 1 ? 'wires' : 'a wire'}, ${on.length > 1 ? `the branches ${listing(Rs.map((x) => `$${x}$`))} are in parallel` : `the branch is just $${Rs[0]}$`}, in series with $${nm.R(nm.r1)}$:` +
        al(rp, M`${nm.main()} &= \frac{V}{${nm.R(nm.r1)} + R_\text{p}} = \frac{${q(V, 'V')}}{${q(c.r1, 'O')} + ${q(Rp, 'O')}} = ${q(s.I, 'A')}`,
          M`U &= R_\text{p}\,${nm.main()} = ${q(s.U, 'V')}`));
    }
    const lines = Ls.map((j) => M`${nm.IL(j)} &= \frac{U}{${nm.R(nm.br[j].R)}} = \frac{${q(s.U, 'V')}}{${q(c.branches[j].R, 'O')}} = ${q(s.Ib[j], 'A')}`);
    out.push(`$U$ is the voltage across the branches. The current through ${Ls.length > 1 ? 'each inductor' : 'the inductor'} is the current through the resistor in its branch:` + al(...lines));
    return out;
  }

  // At t = 0: the inductor currents do not jump.
  function jumpText(c, nm, st) {
    const Ls = c.branches.map((b, j) => j).filter((j) => c.branches[j].L);
    const vals = listing(Ls.map((j) => `$${nm.IL(j)} = ${q(st.IL[j], 'A')}$`));
    const zero = Ls.every((j) => isZero(st.IL[j]));
    return [`At $t = 0$ the switch is ${verb(st.then)}. The current through an inductor cannot change suddenly: a jump ($\\Delta t \\to 0$) would induce an infinite emf $${EMF} = -L\\,\\frac{\\Delta I}{\\Delta t}$. ` +
      `So right after switching, ${Ls.length > 1 ? 'the inductors still carry' : 'the inductor still carries'} ${vals}.` +
      (zero ? ` A branch with an inductor therefore carries no current yet, as if it were cut.` : ` The inductor acts like a current source.`)];
  }

  // The voltage across the branches: U, or V_L if an inductor forms a branch on its own (then
  // the two are the same, and V_L is the quantity asked for).
  function uSym(c, nm) {
    const j = c.branches.findIndex((b) => b.L && !b.R);
    return j < 0 ? 'U' : nm.VL(j);
  }
  function uIs(c, nm) {
    const j = c.branches.findIndex((b) => b.L && !b.R);
    return j < 0 ? '$U$ the voltage across the branches' : `$${nm.VL(j)}$ the voltage across $${nm.L(j)}$, which is the voltage across all branches`;
  }

  // Right after t = 0: the other currents from Kirchhoff's rules.
  function afterText(c, nm, st) {
    const s = st.s1, V = c.V, out = [], U = uSym(c, nm), Uis = uIs(c, nm);
    const Ls = c.branches.map((b, j) => j).filter((j) => c.branches[j].L);
    const IL = Ls.map((j) => nm.IL(j)), ILv = Ls.map((j) => q(st.IL[j], 'A'));
    const sumSym = IL.join(' + '), sumNum = ILv.map((x) => (x.startsWith('-') ? `(${x})` : x)).join(' + ');
    const res = s.res, Rs = res.map((j) => nm.R(nm.br[j].R));
    const currents = res.map((j) => M`${nm.Ib(j)} &= \frac{${U}}{${nm.R(nm.br[j].R)}} = \frac{${q(s.U, 'V')}}{${q(c.branches[j].R, 'O')}} = ${q(s.Ib[j], 'A')}`);
    if (c.sw.at === 'branch' && !config(c, st.then).active[c.sw.j]) out.push(`The branch of $${nm.R(nm.br[c.sw.j].R)}$ is open now: $${nm.Ib(c.sw.j)} = 0$.`);
    if (!s.main) {
      out.push(`The main line is open now: no current flows through the battery${c.r1 ? ` or $${nm.R(nm.r1)}$ ($${nm.IR1()} = 0$)` : ''}. ` +
        `The inductor current has to flow back through the other branch${res.length > 1 ? 'es' : ''}. Junction rule at the top rail, with ${Uis}:` +
        al(M`0 &= ${sumSym} + ${Rs.map((x) => M`\frac{${U}}{${x}}`).join(' + ')}`,
          res.length > 1
            ? M`${U} &= -\frac{${sumSym}}{${Rs.map((x) => M`\frac{1}{${x}}`).join(' + ')}} = ${q(s.U, 'V')}`
            : M`${U} &= -${Rs[0]}\,${Ls.length > 1 ? `(${sumSym})` : sumSym} = -${q(c.branches[res[0]].R, 'O')}\cdot ${Ls.length > 1 ? `(${sumNum})` : sumNum} = ${q(s.U, 'V')}`,
          ...currents) +
        `The negative sign${res.length > 1 ? 's' : ''}: the current flows upwards, against the arrow.`);
      return out;
    }
    if (isZero(s.r)) {
      out.push((s.bridged ? `The closed switch bridges $${nm.R(nm.r1)}$ ($${nm.IR1()} = 0$), so the battery` : 'The battery') +
        ` is connected directly across the branches: $${U} = V = ${q(V, 'V')}$.` + (currents.length ? al(...currents) : ''));
      return out;
    }
    const R1 = nm.R(nm.r1), sumIsZero = isZero(s.sumIL);
    if (!res.length) {
      out.push(`No other branch can take current, so $${nm.IR1()} = ${sumSym} = ${q(s.I, 'A')}$, and the rest of the battery voltage is across the branch${Ls.length > 1 ? 'es' : ''}:` +
        al(M`${U} &= V - ${R1}\,${nm.IR1()} = ${q(V, 'V')} - ${q(c.r1, 'O')}\cdot${q(s.I, 'A')} = ${q(s.U, 'V')}`));
      return out;
    }
    if (sumIsZero) {
      const Rp = fdiv(ONE, s.G);
      const rp = res.length > 1 ? M`R_\text{p} &= \left(${Rs.map((x) => M`\frac{1}{${x}}`).join(' + ')}\right)^{-1} = ${q(Rp, 'O')}` : null;
      const wire = c.branches.findIndex((b) => b.L && !b.R);
      const why = wire < 0 ? '' : ` The inductor $${nm.L(wire)}$ is in parallel with ${listing(Rs.map((x) => `$${x}$`))}, so ${res.length > 1 ? 'they all have' : 'both have'} the same voltage $${U}$.`;
      out.push(`The inductor branch${Ls.length > 1 ? 'es carry' : ' carries'} no current, so the current flows through $${R1}$ and ${res.length > 1 ? `the parallel branches ${listing(Rs.map((x) => `$${x}$`))}` : `$${Rs[0]}$, in series`}.${why}` +
        al(...(rp ? [rp] : []), M`${nm.IR1()} &= \frac{V}{${R1} + ${rp ? M`R_\text{p}` : Rs[0]}} = \frac{${q(V, 'V')}}{${q(c.r1, 'O')} + ${q(Rp, 'O')}} = ${q(s.I, 'A')}`,
          M`${U} &= ${rp ? M`R_\text{p}` : Rs[0]}\,${nm.IR1()} = ${q(s.U, 'V')}`, ...currents));
      return out;
    }
    out.push(`With ${Uis}, the loop rule through the battery and the junction rule at the top rail give` +
      al(M`V &= ${R1}\,${nm.IR1()} + ${U}`, M`${nm.IR1()} &= ${sumSym} + ${Rs.map((x) => M`\frac{${U}}{${x}}`).join(' + ')}`) +
      `Put the second equation into the first and solve for $${U}$:` +
      al(M`${U} &= \frac{V - ${R1}\,${Ls.length > 1 ? `(${sumSym})` : sumSym}}{1 + ${Rs.map((x) => M`\frac{${R1}}{${x}}`).join(' + ')}} = \frac{${q(V, 'V')} - ${q(c.r1, 'O')}\cdot ${sumNum}}{1 + ${res.map((j) => M`\frac{${q(c.r1, 'O')}}{${q(c.branches[j].R, 'O')}}`).join(' + ')}} = ${q(s.U, 'V')}`,
        ...currents, M`${nm.IR1()} &= \frac{V - ${U}}{${R1}} = \frac{${q(V, 'V')} - ${q(s.U, 'V')}}{${q(c.r1, 'O')}} = ${q(s.I, 'A')}`));
    return out;
  }

  function voltText(c, nm, st) {
    const s = st.s1, U = uSym(c, nm);
    const Ls = c.branches.map((b, j) => j).filter((j) => c.branches[j].L);
    const wire = Ls.find((j) => !c.branches[j].R), series = Ls.filter((j) => c.branches[j].R);
    const out = wire !== undefined ? [`The inductor $${nm.L(wire)}$ is a branch on its own, so the voltage across it is the voltage across the branches, found above: $${nm.VL(wire)} = ${q(s.VL[wire], 'V')}$.`] : [];
    if (series.length) {
      out.push(`The voltage across ${series.length > 1 ? 'an inductor' : 'the inductor'} in series with a resistor is the voltage $${U}$ across the branch minus the voltage across the resistor:` +
        al(...series.map((j) => M`${nm.VL(j)} &= ${U} - ${nm.R(nm.br[j].R)}\,${nm.IL(j)} = ${q(s.U, 'V')} - ${q(c.branches[j].R, 'O')}\cdot ${q(st.IL[j], 'A')} = ${q(s.VL[j], 'V')}`)));
    }
    out.push(`Its size: ${listing(Ls.map((j) => `$|${nm.VL(j)}| = ${q(fabs(s.VL[j]), 'V')}$`))}.`);
    // The emf and the rate of change: only here does the inductance matter.
    for (const j of Ls) {
      const H = c.branches[j].H, vl = fval(s.VL[j]), E = nm.EMF(j);
      const how = vl > 0
        ? 'the current is growing in the direction of the arrow, and the emf acts against the arrow, against this growth (Lenz\'s rule)'
        : vl < 0 ? 'the current is falling in the direction of the arrow, and the emf acts along the arrow, against this fall (Lenz\'s rule)'
          : 'the current does not change at this moment';
      out.push(`The self-induced emf of $${nm.L(j)}$: ${how}. The inductance decides how fast the current changes; it does not change the values right after switching.` +
        al(M`${E} &= -${nm.VL(j)} = ${q(fneg(s.VL[j]), 'V')}`,
          M`\frac{\Delta ${nm.IL(j)}}{\Delta t} &= \frac{${nm.VL(j)}}{${nm.L(j)}} = \frac{${q(s.VL[j], 'V')}}{${fmt(H)}\,\mathrm{H}} = ${fmt(vl / H)}\,\mathrm{A/s}`));
    }
    return out;
  }

  function hints(c, nm, st) {
    const U = uSym(c, nm), Uis = uIs(c, nm);
    const Ls = c.branches.map((b, j) => j).filter((j) => c.branches[j].L);
    const IL = listing(Ls.map((j) => `$${nm.IL(j)}$`));
    return [
      `Before $t = 0$, the switch has been ${st.first ? 'closed' : 'open'} for a long time: the currents are constant, so there is no self-induced emf and an inductor acts like a wire. Find ${IL} before $t = 0$.`,
      `Before $t = 0$: ${listing(Ls.map((j) => `$${nm.IL(j)} = ${q(st.IL[j], 'A')}$`))}. An inductor current cannot jump, so it still has this value right after the switch is ${verb(st.then)}.`,
      `Right after switching, the inductor${Ls.length > 1 ? 's act like current sources' : ' acts like a current source'}. Use the junction rule and the loop rule, with ${Uis}.`,
      `Right after switching, the voltage across the branches is $${U} = ${q(st.s1.U, 'V')}$.`,
    ];
  }

  // ---------------------------------------------------------------- drawing
  const UNIT = { A: 'A', V: 'V' };
  const label = (f, u) => `${ftxt(f)} ${u}`;

  // Layout: battery on the left wire, the main line (switch, R1) along the top, branches as
  // columns between the top and the bottom rail. view: { closed (switch drawn closed),
  // cur: key → label text or null (keys IR1, I0, I1, …), focus: key → 'new' | 'use', notes:
  // branch → text next to the inductor, hl: Set of 'R1' | 'S' | branch index, dim: Set of
  // branch indices | 'main', swNote: text under the switch }.
  function draw(c, nm, view) {
    const s = new Circuit.Sketch();
    s.autoDots = true;
    const focus = view.focus || new Map(), hl = view.hl || new Set(), dim = view.dim || new Set();
    const cur = (key) => {
      const t = view.cur ? view.cur[key] : null;
      return t != null && focus.has(key) ? { t, cls: focus.get(key) } : t;
    };
    const elems = (b) => (b.sw ? 1 : 0) + (b.R ? 1 : 0) + (b.L ? 1 : 0);
    const H = Math.max(3.2, 0.9 + Math.max(...c.branches.map(elems)) * 1.3);
    const sw = (p, q2, extra) => s.sw(p, q2, { l: 'S', closed: view.closed, note: view.swNote, hl: hl.has('S'), ...extra });

    s.dim = dim.has('main');
    s.wire([0, 0], [1, 0]);
    let x = 1;
    if (c.sw.at === 'main') { sw([x, 0], [x + 1.4, 0]); x += 1.4; }
    if (c.r1) {
      const R1 = `$${nm.R(nm.r1)}$ = ${ftxt(c.r1)} Ω`;
      if (c.sw.at === 'bridge') {
        s.wire([x, 0], [x + 0.4, 0]);
        s.dim = dim.has('main') || dim.has('R1');
        s.res([x + 0.4, 0], [x + 2.6, 0], { l: R1, ls: 'below', hl: hl.has('R1'), i: cur('IR1'), is: 'above', it: 0.86 });
        s.dim = dim.has('main');
        s.wire([x + 0.4, 0], [x + 0.4, 1.2]).wire([x + 2.6, 1.2], [x + 2.6, 0]).wire([x + 2.6, 0], [x + 3, 0]);
        sw([x + 0.4, 1.2], [x + 2.6, 1.2]);
        x += 3;
      } else {
        s.res([x, 0], [x + 2.2, 0], { l: R1, hl: hl.has('R1'), i: cur('IR1'), is: 'below', it: 0.86 });
        x += 2.2;
      }
    }
    x += 0.5;
    const cols = c.branches.map((b, j) => x + j * 2.9), last = cols[cols.length - 1];
    s.wire([x - 0.5, 0], [x, 0]);
    s.dim = false;
    s.wire([x, 0], [last, 0]).wire([last, -H], [x, -H]);
    c.branches.forEach((b, j) => {
      const cx = cols[j];
      s.dim = dim.has(j);
      s.wire([cx, 0], [cx, -0.9]).cur([cx, 0], [cx, -0.9], cur(`I${j}`), 'right', 0.5);
      const parts = [b.sw && 'S', b.R && 'R', b.L && 'L'].filter(Boolean), seg = (H - 0.9) / parts.length;
      parts.forEach((kind, k) => {
        const p = [cx, -0.9 - k * seg], q2 = [cx, -0.9 - (k + 1) * seg];
        if (kind === 'S') sw(p, q2, { ls: 'right' });
        if (kind === 'R') s.res(p, q2, { l: `$${nm.R(nm.br[j].R)}$ = ${ftxt(b.R)} Ω`, ls: 'right', hl: hl.has(j) && !b.L });
        if (kind === 'L') s.ind(p, q2, { l: `$${nm.L(j).replace(/[{}]/g, '')}$ = ${b.H} H`, ls: 'right', hl: hl.has(j), note: view.notes && view.notes[j] });
      });
    });
    s.dim = dim.has('main');
    s.wire([x, -H], [0, -H]);
    s.bat([0, -H], [0, 0], { l: `${ftxt(c.V)} V` });
    s.dim = false;
    return s;
  }

  // ---------------------------------------------------------------- assembly
  // Parts without current in switch state `closed`, for view.dim: the main line, open
  // branches, a bridged R1.
  function dead(c, closed) {
    const { main, active, bridged } = config(c, closed), out = new Set();
    if (!main) out.add('main');
    c.branches.forEach((b, j) => { if (!active[j]) out.add(j); });
    if (bridged) out.add('R1');
    return out;
  }

  function exercise(c, st, level, id) {
    const nm = namer(c), list = targets(c, nm, st, LEVELS[level] ? LEVELS[level].vl : true);
    const syms = (show) => Object.fromEntries(list.filter((t) => t.unit === 'A').map((t) => [t.key, show(t)]));
    const figure = (sol) => {
      const view = sol
        ? { closed: st.then, dim: dead(c, st.then), cur: syms((t) => label(t.value, 'A')), notes: Object.fromEntries(c.branches.map((b, j) => [j, b.L ? `$${nm.VL(j)}$ = ${label(st.s1.VL[j], 'V')}` : null])) }
        : { closed: st.first, cur: syms((t) => `$${t.sym}$`), swNote: `${st.first ? 'opens' : 'closes'} at t = 0` };
      return `<div class="fig">${draw(c, nm, view).toSVG()}</div>`;
    };
    return {
      id, level, circuit: c, st, nm,
      title: `${LEVELS[level] ? LEVELS[level].name : 'Example'} · switch ${st.first ? 'opened' : 'closed'}`,
      text: taskText(c, nm, list),
      fields: list.map((t) => ({ key: t.key, sym: t.sym, unit: t.unit, value: fval(t.value), abs: !!t.abs })),
      models: models(c, st, list).map((m) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v === null ? null : fval(v)]))),
      tol: 0.01,
      figure,
      hints: hints(c, nm, st),
      solution: [...beforeText(c, nm, st), ...jumpText(c, nm, st), ...afterText(c, nm, st), ...(list.some((t) => t.unit === 'V') ? voltText(c, nm, st) : [])],
      results: list.map((t) => `$${t.sym} = ${q(t.value, t.unit)}$`).join(', '),
    };
  }

  function generate(level, seed) {
    const { c, st } = build(level, seed);
    return exercise(c, st, level, `${level}-${seed}`);
  }

  // ---------------------------------------------------------------- tutorial
  // A worked example as frames { text, figure }: the task, the state before t = 0 (inductors
  // as wires), the moment of switching (inductor currents kept), the currents right after, the
  // inductor voltage, and a comparison of before / right after / long after.
  // def = { r1, branches: [[R, L, H?, sw?]], sw: { at, j, before }, V }
  function fromDef(def) {
    const c = {
      r1: def.r1 ? F(def.r1) : null,
      branches: def.branches.map(([R, L, H, sw]) => ({ R: R ? F(R) : null, L: !!L, H: L ? H || 1 : null, sw: !!sw })),
      sw: { ...def.sw }, V: F(def.V),
    };
    return c;
  }

  function tutorial(def) {
    const c = fromDef(def), st = solve(c);
    if (!st) throw new Error('tutorial circuit not usable');
    const ex = exercise(c, st, 'tutor', 'tutor'), nm = ex.nm, list = targets(c, nm, st, true);
    const frames = [];
    const Ls = c.branches.map((b, j) => j).filter((j) => c.branches[j].L);
    const curs = (s) => ({ IR1: c.r1 ? label(s.IR1, 'A') : null, ...Object.fromEntries(c.branches.map((b, j) => [`I${j}`, label(s.Ib[j], 'A')])) });
    const symbols = () => ({ IR1: c.r1 ? `$${nm.IR1()}$` : null, ...Object.fromEntries(c.branches.map((b, j) => [`I${j}`, `$${nm.Ib(j)}$`])) });
    const frame = (title, paras, view) => frames.push({ text: `<p class="step-rule">${title}</p>${paras.map((p) => `<p>${p}</p>`).join('')}`, sketch: draw(c, nm, view) });
    const hlL = new Set(Ls);

    frame('The task', [ex.text], { closed: st.first, cur: symbols(), swNote: `${st.first ? 'opens' : 'closes'} at t = 0` });
    frame('Before t = 0', beforeText(c, nm, st), {
      closed: st.first, cur: curs(st.s0), dim: dead(c, st.first), hl: hlL,
      focus: new Map(Ls.map((j) => [`I${j}`, 'new'])),
      notes: Object.fromEntries(Ls.map((j) => [j, config(c, st.first).main ? 'acts like a wire' : 'no current'])),
    });
    const kept = Object.fromEntries(Ls.map((j) => [j, `keeps ${label(st.IL[j], 'A')}`]));
    frame('The moment of switching', jumpText(c, nm, st), {
      closed: st.then, hl: new Set([...hlL, 'S']), dim: dead(c, st.then), notes: kept,
      cur: { ...symbols(), ...Object.fromEntries(Ls.map((j) => [`I${j}`, label(st.IL[j], 'A')])) },
      focus: new Map(Ls.map((j) => [`I${j}`, 'use'])),
    });
    frame('Right after switching', afterText(c, nm, st), {
      closed: st.then, cur: curs(st.s1), dim: dead(c, st.then), notes: kept,
      focus: new Map([...list.filter((t) => t.unit === 'A' && !(t.j !== undefined && c.branches[t.j].L)).map((t) => [t.key, 'new']), ...Ls.map((j) => [`I${j}`, 'use'])]),
    });
    frame('The voltage across the inductor', voltText(c, nm, st), {
      closed: st.then, cur: curs(st.s1), dim: dead(c, st.then), hl: hlL,
      notes: Object.fromEntries(Ls.map((j) => [j, `$${nm.VL(j)}$ = ${label(st.s1.VL[j], 'V')}`])),
    });
    const row = (name, s) => `<tr><th>${name}</th>${list.filter((t) => t.unit === 'A').map((t) => `<td>${ftxt(t.key === 'IR1' ? s.IR1 : s.Ib[t.j])} A</td>`).join('')}</tr>`;
    const table = `<table class="compare"><tr><th></th>${list.filter((t) => t.unit === 'A').map((t) => `<th>$${t.sym}$</th>`).join('')}</tr>` +
      row('before $t = 0$', st.s0) + row('right after', st.s1) + row('long after', st.s2) + '</table>';
    frame('Before, right after, long after', [
      `Only the inductor current${Ls.length > 1 ? 's are' : ' is'} the same just before and right after switching; the other currents jump. ` +
      `Long after switching, the currents are constant again and the inductor${Ls.length > 1 ? 's act' : ' acts'} like a wire once more.` + table,
    ], { closed: st.then, cur: curs(st.s2), dim: dead(c, st.then), notes: Object.fromEntries(Ls.map((j) => [j, 'long after: a wire'])) });

    // One viewBox for all frames, so that the diagram does not jump while stepping through.
    const box = frames.reduce((b, f) => {
      const x = f.sketch.box;
      return [Math.min(b[0], x[0]), Math.min(b[1], x[1]), Math.max(b[2], x[2]), Math.max(b[3], x[3])];
    }, [Infinity, Infinity, -Infinity, -Infinity]);
    return { frames: frames.map((f) => ({ text: f.text, figure: `<div class="fig">${f.sketch.toSVG('circuit', box)}</div>` })), ex };
  }

  const api = { LEVELS, generate, tutorial, solve, fromDef, steady, after, config, F, fval };
  root.Switching = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
