// Exercise templates A–L, ported from resistor-circuits/*.md.
// All values use consistent units: V, kΩ, mA (V = kΩ·mA). Template I uses Ω for resistances.
(function (root) {
  'use strict';

  const M = String.raw;
  const RS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20];
  const Q = (sym, u) => ({ sym, u });
  const UNIT_TEX = { V: M`\mathrm{V}`, mA: M`\mathrm{mA}`, 'kΩ': M`\mathrm{k\Omega}`, 'Ω': M`\Omega` };

  function fmt(x) {
    if (Math.abs(x - Math.round(x)) < 1e-9) return String(Math.round(x));
    if (Math.abs(x) >= 1) return String(parseFloat(x.toFixed(2)));
    return String(parseFloat(x.toPrecision(2)));
  }

  const al = (...lines) => M`$$\begin{aligned}` + lines.join(M` \\ `) + M`\end{aligned}$$`;

  function helpers(tpl, v) {
    const qu = (x, u) => `${fmt(x)}\\,${UNIT_TEX[u]}`;
    const q = (k) => qu(v[k], tpl.q[k].u);
    return { q, qu, b: (k) => `\\boxed{${q(k)}}`, s: (k) => tpl.q[k].sym };
  }

  function rng(seed) {
    let a = seed >>> 0;
    const next = () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    return {
      next,
      int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
      pick: (arr) => arr[Math.floor(next() * arr.length)],
    };
  }

  const isDec = (x, d) => { const y = x * 10 ** d; return Math.abs(y - Math.round(y)) < 1e-7 * Math.max(1, Math.abs(y)); };

  function valid(tpl, v) {
    const lim = { V: tpl.maxV || 100, mA: tpl.maxI || 50, 'kΩ': 50, 'Ω': 5000 };
    for (const k of Object.keys(tpl.q)) {
      const x = v[k];
      if (!(Number.isFinite(x) && x >= 0.1 && x <= lim[tpl.q[k].u])) return false;
      if (tpl.given.includes(k)) { if (!isDec(x, 0)) return false; }
      else if (tpl.unknowns.includes(k)) { if (!isDec(x, 1)) return false; }
      else if (!(tpl.free || []).includes(k) && !isDec(x, 2)) return false;
    }
    return true;
  }

  function generate(tpl, seed) {
    const r = rng(seed);
    for (let n = 0; n < 200000; n++) {
      const v = tpl.compute(tpl.pick(r));
      if (valid(tpl, v)) return v;
    }
    throw new Error(`Template ${tpl.id}: no valid values found`);
  }

  const TEMPLATES = [];
  const T = (t) => TEMPLATES.push(t);

  // ---------------------------------------------------------------- A
  T({
    id: 'A', title: 'Series resistors',
    q: { V: Q('V', 'V'), Ra: Q('R_a', 'kΩ'), I: Q('I', 'mA'), R: Q('R', 'kΩ'), Va: Q('V_a', 'V'), VR: Q('V_R', 'V') },
    given: ['V', 'Ra', 'I'], unknowns: ['R'],
    prompt: 'find the resistance $R$',
    original: { Ra: 4, R: 2, I: 2 },
    pick: (r) => ({ Ra: r.pick(RS), R: r.pick(RS), I: r.int(1, 10) }),
    compute: ({ Ra, R, I }) => ({ V: I * (Ra + R), Ra, I, R, Va: I * Ra, VR: I * R }),
    draw(s, c) {
      s.bat([0, 0], [0, 2.5]).vol([0, 2.5], [0, 0], c.lab('V'), 'left');
      s.res([0, 2.5], [3, 2.5], { l: c.lab('Ra') }).vol([0, 2.5], [3, 2.5], c.lab('Va'), 'below');
      s.res([3, 2.5], [6, 2.5], { l: c.lab('R') }).vol([3, 2.5], [6, 2.5], c.lab('VR'), 'below');
      s.wire([6, 2.5], [6, 0], [0, 0]).cur([6, 2.5], [6, 0], c.lab('I'), 'right');
    },
    netlist: (v) => ({
      E: [['V', 'V', 1, 0, v.V], ['R', 'Ra', 1, 2, v.Ra], ['R', 'R', 2, 0, v.R]],
      probes: { I: (s) => s.i('Ra'), Va: (s) => s.v(1) - s.v(2), VR: (s) => s.v(2) },
    }),
    hints: (v, h) => [
      M`$R_a$ and $R$ are in series: the same current $I = ${h.q('I')}$ flows through both.`,
      M`In a series circuit the resistances add up: $R_a + R = \dfrac{V}{I}$.`,
      M`The voltage across $R_a$ is $I R_a = ${h.q('Va')}$, so $R$ gets the remaining $${h.q('VR')}$.`,
    ],
    solution: (v, h) => [
      M`Both resistors carry the same current $I = ${h.q('I')}$, so their resistances add up to the total resistance of the circuit:` +
        al(M`R_a + R &= \frac{V}{I}`),
      M`where $R_a = ${h.q('Ra')}$. Solving for $R$ yields` +
        al(M`R &= \frac{V}{I} - R_a`, M`&= \frac{${h.q('V')}}{${h.q('I')}} - ${h.q('Ra')}`, M`&= ${h.b('R')}`),
      M`Check with the voltage divider rule: the voltage across $R_a$ is $I R_a = ${h.q('Va')}$, leaving $${h.q('VR')}$ for $R$. The voltages are split in the same ratio as the resistances.`,
    ],
  });

  // ---------------------------------------------------------------- B
  T({
    id: 'B', title: 'Parallel resistors',
    q: { I: Q('I', 'mA'), Ia: Q('I_a', 'mA'), Ra: Q('R_a', 'kΩ'), V: Q('V', 'V'), IR: Q('I_R', 'mA'), R: Q('R', 'kΩ') },
    given: ['I', 'Ia', 'Ra'], unknowns: ['V', 'R'],
    prompt: 'find the voltage $V$ of the battery and the resistance $R$',
    original: { Ra: 15, R: 10, Ia: 2 },
    pick: (r) => ({ Ra: r.pick(RS), R: r.pick(RS), Ia: r.int(1, 10) }),
    compute: ({ Ra, R, Ia }) => { const V = Ia * Ra, IR = V / R; return { I: Ia + IR, Ia, Ra, V, IR, R }; },
    draw(s, c) {
      s.bat([0, 0], [0, 3]).vol([0, 3], [0, 0], c.lab('V'), 'left');
      s.wire([0, 3], [3, 3]).cur([0, 3], [3, 3], c.lab('I'), 'above');
      s.res([3, 3], [3, 0], { l: c.lab('Ra'), i: c.lab('Ia') }).vol([3, 3], [3, 0], c.lab('V'), 'left');
      s.wire([3, 3], [6.5, 3]);
      s.res([6.5, 3], [6.5, 0], { l: c.lab('R'), i: c.lab('IR') }).vol([6.5, 3], [6.5, 0], c.lab('V'), 'left');
      s.wire([6.5, 0], [0, 0]).dot([3, 3]).dot([3, 0]);
    },
    netlist: (v) => ({
      E: [['V', 'V', 1, 0, v.V], ['R', 'Ra', 1, 0, v.Ra], ['R', 'R', 1, 0, v.R]],
      probes: { Ia: (s) => s.i('Ra'), IR: (s) => s.i('R'), I: (s) => s.i('Ra') + s.i('R') },
    }),
    hints: (v, h) => [
      M`Both resistors are connected directly to the battery: they are in parallel and share the battery voltage $V$.`,
      M`Ohm's law for the known resistor gives the voltage, $V = I_a R_a$. The rest of the total current flows through $R$.`,
      M`The current through $R$ is $I_R = I - I_a = ${h.q('IR')}$.`,
    ],
    solution: (v, h) => [
      M`Both resistors are connected directly to the battery, so the battery voltage equals the voltage across $R_a = ${h.q('Ra')}$:` +
        al(M`V &= I_a R_a`, M`&= ${h.q('Ia')}\times${h.q('Ra')}`, M`&= ${h.b('V')}`),
      M`The total current splits at the junction, so the current through $R$ is` +
        al(M`I_R &= I - I_a = ${h.q('IR')}`),
      M`According to the current divider rule, the currents are inversely proportional to the resistances, $I_R/I_a = R_a/R$. Therefore` +
        al(M`R &= \frac{I_a}{I-I_a}\,R_a`, M`&= \frac{${h.q('Ia')}}{${h.q('I')}-${h.q('Ia')}}\times${h.q('Ra')}`, M`&= ${h.b('R')}`),
    ],
  });

  // ---------------------------------------------------------------- C
  T({
    id: 'C', title: 'Voltage divider with parallel load',
    q: {
      V: Q('V', 'V'), Ra: Q('R_a', 'kΩ'), Rb: Q('R_1', 'kΩ'), Rc: Q('R_2', 'kΩ'), Rp: Q('R_p', 'kΩ'), It: Q('I', 'mA'),
      Va: Q('V_a', 'V'), Vp: Q('V_p', 'V'), Ione: Q('I_1', 'mA'), Itwo: Q('I_2', 'mA'),
    },
    given: ['V', 'Ra', 'Rb', 'Rc'], unknowns: ['Ione', 'Itwo'], free: ['Rp'],
    prompt: 'find the currents $I_1$ and $I_2$',
    original: { V: 25, Ra: 2, Rb: 2, Rc: 4 },
    pick: (r) => ({ V: r.int(5, 60), Ra: r.pick(RS), Rb: r.pick(RS), Rc: r.pick(RS) }),
    compute: ({ V, Ra, Rb, Rc }) => {
      const Rp = 1 / (1 / Rb + 1 / Rc), It = V / (Ra + Rp), Va = It * Ra, Vp = V - Va;
      return { V, Ra, Rb, Rc, Rp, It, Va, Vp, Ione: Vp / Rb, Itwo: Vp / Rc };
    },
    draw(s, c) {
      s.bat([0, 0], [0, 3]).vol([0, 3], [0, 0], c.lab('V'), 'left');
      s.res([0, 3], [3, 3], { l: c.lab('Ra') }).vol([0, 3], [3, 3], c.lab('Va'), 'below');
      s.res([3, 3], [3, 0], { l: c.lab('Rb'), i: c.lab('Ione') }).vol([3, 3], [3, 0], c.lab('Vp'), 'left');
      s.wire([3, 3], [6.5, 3]);
      s.res([6.5, 3], [6.5, 0], { l: c.lab('Rc'), i: c.lab('Itwo') }).vol([6.5, 3], [6.5, 0], c.lab('Vp'), 'left');
      s.wire([6.5, 0], [0, 0]).cur([3, 0], [0, 0], c.lab('It'), 'below').dot([3, 3]).dot([3, 0]);
    },
    netlist: (v) => ({
      E: [['V', 'V', 1, 0, v.V], ['R', 'Ra', 1, 2, v.Ra], ['R', 'Rb', 2, 0, v.Rb], ['R', 'Rc', 2, 0, v.Rc]],
      probes: { Ione: (s) => s.i('Rb'), Itwo: (s) => s.i('Rc'), It: (s) => s.i('Ra'), Vp: (s) => s.v(2), Va: (s) => s.v(1) - s.v(2) },
    }),
    hints: (v, h) => [
      M`$R_1 = ${h.q('Rb')}$ and $R_2 = ${h.q('Rc')}$ are in parallel. The parallel pair is in series with $R_a$.`,
      M`Replace the pair by $R_p = \left(\frac{1}{R_1}+\frac{1}{R_2}\right)^{-1}$. Then $R_a$ and $R_p$ form a voltage divider.`,
      M`The pair has $R_p = ${h.q('Rp')}$, and the voltage across it is $V_p = ${h.q('Vp')}$.`,
    ],
    solution: (v, h) => [
      M`Let $R_a = ${h.q('Ra')}$ be the resistor in series with the battery, and $R_1 = ${h.q('Rb')}$ and $R_2 = ${h.q('Rc')}$ the two resistors in parallel. The parallel combination has the resistance` +
        al(M`R_p &= \left(\frac{1}{R_1}+\frac{1}{R_2}\right)^{-1}`, M`&= \left(\frac{1}{${h.q('Rb')}}+\frac{1}{${h.q('Rc')}}\right)^{-1}`, M`&= ${h.q('Rp')}`),
      M`$R_a$ and $R_p$ form a voltage divider. The voltage across the parallel resistors is` +
        al(M`V_p &= \frac{R_p}{R_a+R_p}\,V`, M`&= \frac{${h.q('Rp')}}{${h.q('Ra')}+${h.q('Rp')}}\times${h.q('V')}`, M`&= ${h.q('Vp')}`),
      M`Both parallel resistors are at the voltage $V_p$, so the currents follow from Ohm's law:` +
        al(M`I_1 &= \frac{V_p}{R_1} = \frac{${h.q('Vp')}}{${h.q('Rb')}} = ${h.b('Ione')}`, M`I_2 &= \frac{V_p}{R_2} = \frac{${h.q('Vp')}}{${h.q('Rc')}} = ${h.b('Itwo')}`),
      M`As expected from the current divider rule, the currents are inversely proportional to the resistances. Together they give the current $I = ${h.q('It')}$ through $R_a$, which drops $I R_a = ${h.q('Va')}$. Together with $V_p$, that adds up to the battery voltage.`,
    ],
  });

  // ---------------------------------------------------------------- D
  T({
    id: 'D', title: 'Parallel branches',
    q: {
      Itot: Q(M`I_{\text{tot}}`, 'mA'), Ib: Q('I_b', 'mA'), Ra: Q('R_a', 'kΩ'), Rb: Q('R_b', 'kΩ'),
      V: Q('V', 'V'), I: Q('I', 'mA'), R: Q('R', 'kΩ'), Va: Q('V_a', 'V'), VR: Q('V_R', 'V'),
    },
    given: ['Itot', 'Ib', 'Ra', 'Rb'], unknowns: ['V', 'R', 'I'],
    prompt: 'find the voltage $V$ of the battery, the resistance $R$ and the current $I$',
    original: { Ra: 1, R: 3, Rb: 3, I: 6 },
    pick: (r) => ({ Ra: r.pick(RS), R: r.pick(RS), Rb: r.pick(RS), I: r.int(1, 10) }),
    compute: ({ Ra, R, Rb, I }) => {
      const V = I * (R + Ra), Ib = V / Rb;
      return { Itot: I + Ib, Ib, Ra, Rb, V, I, R, Va: I * Ra, VR: I * R };
    },
    draw(s, c) {
      s.bat([0, 0], [0, 4]).vol([0, 4], [0, 0], c.lab('V'), 'left');
      s.wire([0, 4], [3, 4]).cur([0, 4], [3, 4], c.lab('Itot'), 'above');
      s.res([3, 4], [3, 2], { l: c.lab('R') }).vol([3, 4], [3, 2], c.lab('VR'), 'left');
      s.res([3, 2], [3, 0], { l: c.lab('Ra'), i: c.lab('I') }).vol([3, 2], [3, 0], c.lab('Va'), 'left');
      s.wire([3, 4], [6.5, 4]);
      s.res([6.5, 4], [6.5, 0], { l: c.lab('Rb'), i: c.lab('Ib') }).vol([6.5, 4], [6.5, 0], c.lab('V'), 'left');
      s.wire([6.5, 0], [0, 0]).dot([3, 4]).dot([3, 0]);
    },
    netlist: (v) => ({
      E: [['V', 'V', 1, 0, v.V], ['R', 'R', 1, 2, v.R], ['R', 'Ra', 2, 0, v.Ra], ['R', 'Rb', 1, 0, v.Rb]],
      probes: { I: (s) => s.i('Ra'), Ib: (s) => s.i('Rb'), Itot: (s) => s.i('Ra') + s.i('Rb'), Va: (s) => s.v(2), VR: (s) => s.v(1) - s.v(2) },
    }),
    hints: (v, h) => [
      M`There are two parallel branches, each connected directly to the battery: $R$ in series with $R_a$ on the left, and $R_b$ on the right.`,
      M`Start with the right branch: Ohm's law gives the battery voltage, $V = I_b R_b$. The junction rule gives $I = I_{\text{tot}} - I_b$.`,
      M`The battery voltage is $V = ${h.q('V')}$. The left branch then has the total resistance $R + R_a = V/I$.`,
    ],
    solution: (v, h) => [
      M`The right branch with $R_b = ${h.q('Rb')}$ is connected directly to the battery, so the battery voltage is` +
        al(M`V &= I_b R_b`, M`&= ${h.q('Ib')}\times${h.q('Rb')}`, M`&= ${h.b('V')}`),
      M`The total current $I_{\text{tot}}$ splits into the two branches. The current in the left branch is` +
        al(M`I &= I_{\text{tot}} - I_b`, M`&= ${h.q('Itot')} - ${h.q('Ib')}`, M`&= ${h.b('I')}`),
      M`The left branch consists of $R$ and $R_a = ${h.q('Ra')}$ in series and is also at the full battery voltage, $V = I\,(R+R_a)$. Hence` +
        al(M`R &= \frac{V}{I} - R_a`, M`&= \frac{${h.q('V')}}{${h.q('I')}} - ${h.q('Ra')}`, M`&= ${h.b('R')}`),
      M`According to the voltage divider rule, the left branch splits the battery voltage into $${h.q('VR')}$ across $R$ and $${h.q('Va')}$ across $R_a$.`,
    ],
  });

  // ---------------------------------------------------------------- E
  T({
    id: 'E', title: 'Three branches',
    q: {
      V: Q('V', 'V'), Ra: Q('R_a', 'kΩ'), Rb: Q('R_b', 'kΩ'), Ia: Q('I_a', 'mA'), Ib: Q('I_b', 'mA'), Ic: Q('I_c', 'mA'),
      Rone: Q('R_1', 'kΩ'), Ione: Q('I_1', 'mA'), Itwo: Q('I_2', 'mA'), Vb: Q('V_b', 'V'), Va: Q('V_a', 'V'), Rtwo: Q('R_2', 'kΩ'),
    },
    given: ['V', 'Ra', 'Rb', 'Ia', 'Ib', 'Ic'], unknowns: ['Rone', 'Rtwo', 'Ione', 'Itwo'],
    prompt: 'find the resistances $R_1$ and $R_2$ and the currents $I_1$ and $I_2$',
    original: { Rb: 4, Rtwo: 3, Ib: 6, Ra: 2, Rone: 4 },
    pick: (r) => ({ Rb: r.pick(RS), Rtwo: r.pick(RS), Ib: r.int(1, 10), Ra: r.pick(RS), Rone: r.pick(RS) }),
    compute: ({ Rb, Rtwo, Ib, Ra, Rone }) => {
      const Vb = Ib * Rb, Itwo = Vb / Rtwo, Ic = Ib + Itwo, Va = Ic * Ra, V = Va + Vb, Ia = V / Rone;
      return { V, Ra, Rb, Ia, Ib, Ic, Rone, Ione: Ia + Ic, Itwo, Vb, Va, Rtwo };
    },
    draw(s, c) {
      s.bat([0, 0], [0, 3]).vol([0, 3], [0, 0], c.lab('V'), 'left');
      s.wire([0, 3], [2, 3]).cur([0, 3], [2, 3], c.lab('Ione'), 'above');
      s.res([2, 3], [2, 0], { l: c.lab('Rone'), i: c.lab('Ia') }).vol([2, 3], [2, 0], c.lab('V'), 'left');
      s.res([2, 3], [5.5, 3], { l: c.lab('Ra') }).vol([2, 3], [5.5, 3], c.lab('Va'), 'below');
      s.res([5.5, 3], [5.5, 0], { l: c.lab('Rb'), i: c.lab('Ib') }).vol([5.5, 3], [5.5, 0], c.lab('Vb'), 'left');
      s.wire([5.5, 3], [9, 3]);
      s.res([9, 3], [9, 0], { l: c.lab('Rtwo'), i: c.lab('Itwo') }).vol([9, 3], [9, 0], c.lab('Vb'), 'left');
      s.wire([9, 0], [0, 0]).cur([5.5, 0], [2, 0], c.lab('Ic'), 'below');
      s.dot([2, 3]).dot([2, 0]).dot([5.5, 3]).dot([5.5, 0]);
    },
    netlist: (v) => ({
      E: [['V', 'V', 1, 0, v.V], ['R', 'Rone', 1, 0, v.Rone], ['R', 'Ra', 1, 2, v.Ra], ['R', 'Rb', 2, 0, v.Rb], ['R', 'Rtwo', 2, 0, v.Rtwo]],
      probes: {
        Ia: (s) => s.i('Rone'), Ic: (s) => s.i('Ra'), Ib: (s) => s.i('Rb'), Itwo: (s) => s.i('Rtwo'),
        Ione: (s) => s.i('Rone') + s.i('Ra'), Vb: (s) => s.v(2), Va: (s) => s.v(1) - s.v(2),
      },
    }),
    hints: (v, h) => [
      M`$R_1$ is connected directly to the battery. The current $I_c$ in the bottom wire is the current through $R_a$ into the right part, where $R_b$ and $R_2$ are in parallel.`,
      M`Use the junction rule twice: $I_1 = I_a + I_c$ and $I_c = I_b + I_2$. $R_b$ and $R_2$ share the voltage $V_b = I_b R_b$.`,
      M`The voltage across $R_b$ and $R_2$ is $V_b = ${h.q('Vb')}$.`,
    ],
    solution: (v, h) => [
      M`$R_1$ is connected directly to the battery. With the current $I_a = ${h.q('Ia')}$ through it we find` +
        al(M`R_1 &= \frac{V}{I_a} = \frac{${h.q('V')}}{${h.q('Ia')}} = ${h.b('Rone')}`),
      M`The current $I_c = ${h.q('Ic')}$ in the bottom wire is the current through $R_a = ${h.q('Ra')}$, i.e. the current that flows into the right part of the circuit. At the left junction the battery current splits into $I_a$ and $I_c$:` +
        al(M`I_1 &= I_a + I_c = ${h.q('Ia')} + ${h.q('Ic')} = ${h.b('Ione')}`),
      M`$I_c$ splits again into the currents through $R_b = ${h.q('Rb')}$ and $R_2$:` +
        al(M`I_2 &= I_c - I_b = ${h.q('Ic')} - ${h.q('Ib')} = ${h.b('Itwo')}`),
      M`$R_b$ and $R_2$ are in parallel and share the voltage $V_b = I_b R_b = ${h.q('Vb')}$. Hence` +
        al(M`R_2 &= \frac{V_b}{I_2} = \frac{I_b R_b}{I_c - I_b}`, M`&= \frac{${h.q('Ib')}\times${h.q('Rb')}}{${h.q('Ic')}-${h.q('Ib')}}`, M`&= ${h.b('Rtwo')}`),
      M`Check with the voltage divider rule: the voltage across $R_a$ is $V_a = I_c R_a = ${h.q('Va')}$. Together with $V_b = ${h.q('Vb')}$ it gives the battery voltage $${h.q('V')}$.`,
    ],
  });

  // ---------------------------------------------------------------- F
  T({
    id: 'F', title: 'Parallel pair between two series resistors',
    q: {
      V: Q('V', 'V'), I: Q('I', 'mA'), Ia: Q('I_a', 'mA'), Rb: Q('R_b', 'kΩ'), Rc: Q('R_c', 'kΩ'),
      Itwo: Q('I_2', 'mA'), Vp: Q('V_p', 'V'), Rone: Q('R_1', 'kΩ'), Vc: Q('V_c', 'V'), VR: Q('V_R', 'V'), R: Q('R', 'kΩ'),
    },
    given: ['V', 'I', 'Ia', 'Rb', 'Rc'], unknowns: ['R', 'Rone', 'Itwo'],
    prompt: 'find the resistances $R$ and $R_1$ and the current $I_2$',
    original: { Rone: 2, Rb: 1, Ia: 4, Rc: 1, R: 2 },
    pick: (r) => ({ Rone: r.pick(RS), Rb: r.pick(RS), Ia: r.int(1, 8), Rc: r.pick(RS), R: r.pick(RS) }),
    compute: ({ Rone, Rb, Ia, Rc, R }) => {
      const Vp = Ia * Rone, Itwo = Vp / Rb, I = Ia + Itwo, Vc = I * Rc, VR = I * R;
      return { V: VR + Vp + Vc, I, Ia, Rb, Rc, Itwo, Vp, Rone, Vc, VR, R };
    },
    draw(s, c) {
      s.bat([0, 0], [0, 3]).vol([0, 3], [0, 0], c.lab('V'), 'left');
      s.wire([0, 3], [1, 3]).cur([0, 3], [1, 3], c.lab('I'), 'above');
      s.res([1, 3], [4, 3], { l: c.lab('R') }).vol([1, 3], [4, 3], c.lab('VR'), 'below');
      s.res([4, 3], [4, 0], { l: c.lab('Rone'), i: c.lab('Ia') }).vol([4, 3], [4, 0], c.lab('Vp'), 'left');
      s.wire([4, 3], [7.5, 3]);
      s.res([7.5, 3], [7.5, 0], { l: c.lab('Rb'), i: c.lab('Itwo') }).vol([7.5, 3], [7.5, 0], c.lab('Vp'), 'left');
      s.wire([7.5, 0], [4, 0]);
      s.res([4, 0], [1, 0], { l: c.lab('Rc'), ls: 'below' }).vol([4, 0], [1, 0], c.lab('Vc'), 'above');
      s.wire([1, 0], [0, 0]).dot([4, 3]).dot([4, 0]);
    },
    netlist: (v) => ({
      E: [['V', 'V', 1, 0, v.V], ['R', 'R', 1, 2, v.R], ['R', 'Rone', 2, 3, v.Rone], ['R', 'Rb', 2, 3, v.Rb], ['R', 'Rc', 3, 0, v.Rc]],
      probes: { Ia: (s) => s.i('Rone'), Itwo: (s) => s.i('Rb'), I: (s) => s.i('R'), Vp: (s) => s.v(2) - s.v(3), Vc: (s) => s.v(3) },
    }),
    hints: (v, h) => [
      M`$R_1$ and $R_b$ are in parallel. $R$, this parallel pair and $R_c$ are in series and all carry the full current $I$.`,
      M`The junction rule gives $I_2 = I - I_a$. The parallel pair shares the voltage $V_p = I_2 R_b$.`,
      M`$V_p = ${h.q('Vp')}$, and the voltage across $R_c$ is $I R_c = ${h.q('Vc')}$. The rest of the battery voltage drops across $R$.`,
    ],
    solution: (v, h) => [
      M`The battery current $I = ${h.q('I')}$ splits into the currents through $R_1$ and through the parallel resistor $R_b = ${h.q('Rb')}$:` +
        al(M`I_2 &= I - I_a = ${h.q('I')} - ${h.q('Ia')} = ${h.b('Itwo')}`),
      M`$R_1$ and $R_b$ share the voltage $V_p = I_2 R_b = ${h.q('Vp')}$. Hence` +
        al(M`R_1 &= \frac{V_p}{I_a} = \frac{I-I_a}{I_a}\,R_b`, M`&= \frac{${h.q('I')}-${h.q('Ia')}}{${h.q('Ia')}}\times${h.q('Rb')}`, M`&= ${h.b('Rone')}`),
      M`The full current $I$ flows through $R$, the parallel pair and $R_c = ${h.q('Rc')}$ in series, so the battery voltage is divided as` +
        al(M`V &= I R + V_p + I R_c`),
      M`Solving for $R$:` +
        al(M`R &= \frac{V - I R_c - V_p}{I}`, M`&= \frac{${h.q('V')} - ${h.q('Vc')} - ${h.q('Vp')}}{${h.q('I')}}`, M`&= ${h.b('R')}`),
      M`The voltages across $R$, the parallel pair and $R_c$ are $${h.q('VR')}$, $${h.q('Vp')}$ and $${h.q('Vc')}$, which add up to $${h.q('V')}$.`,
    ],
  });

  // ---------------------------------------------------------------- G
  T({
    id: 'G', title: 'Branch with two series resistors',
    q: {
      Itot: Q(M`I_{\text{tot}}`, 'mA'), Ic: Q('I_c', 'mA'), Ra: Q('R_a', 'kΩ'), Rb: Q('R_b', 'kΩ'), Rc: Q('R_c', 'kΩ'),
      I: Q('I', 'mA'), Vp: Q('V_p', 'V'), R: Q('R', 'kΩ'), V: Q('V', 'V'), Va: Q('V_a', 'V'), Vc: Q('V_c', 'V'), VR: Q('V_R', 'V'),
    },
    given: ['Itot', 'Ic', 'Ra', 'Rb', 'Rc'], unknowns: ['V', 'R', 'I'],
    prompt: 'find the voltage $V$ of the battery, the resistance $R$ and the current $I$',
    original: { Rc: 4, R: 3, Ic: 2, Rb: 2, Ra: 2 },
    pick: (r) => ({ Rc: r.pick(RS), R: r.pick(RS), Ic: r.int(1, 8), Rb: r.pick(RS), Ra: r.pick(RS) }),
    compute: ({ Rc, R, Ic, Rb, Ra }) => {
      const Vp = Ic * (Rc + R), I = Vp / Rb, Itot = I + Ic, Va = Itot * Ra;
      return { Itot, Ic, Ra, Rb, Rc, I, Vp, R, V: Va + Vp, Va, Vc: Ic * Rc, VR: Ic * R };
    },
    draw(s, c) {
      s.bat([0, 0], [0, 3]).vol([0, 3], [0, 0], c.lab('V'), 'left');
      s.wire([0, 3], [3, 3]).cur([0, 3], [3, 3], c.lab('Itot'), 'above');
      s.res([3, 3], [3, 0], { l: c.lab('Rb'), i: c.lab('I') }).vol([3, 3], [3, 0], c.lab('Vp'), 'left');
      s.res([3, 3], [6.5, 3], { l: c.lab('Rc') }).vol([3, 3], [6.5, 3], c.lab('Vc'), 'below');
      s.res([6.5, 3], [6.5, 0], { l: c.lab('R'), i: c.lab('Ic') }).vol([6.5, 3], [6.5, 0], c.lab('VR'), 'left');
      s.wire([6.5, 0], [3, 0]);
      s.res([3, 0], [0, 0], { l: c.lab('Ra'), ls: 'below' }).vol([3, 0], [0, 0], c.lab('Va'), 'above');
      s.dot([3, 3]).dot([3, 0]);
    },
    netlist: (v) => ({
      E: [['V', 'V', 1, 0, v.V], ['R', 'Rb', 1, 2, v.Rb], ['R', 'Rc', 1, 3, v.Rc], ['R', 'R', 3, 2, v.R], ['R', 'Ra', 2, 0, v.Ra]],
      probes: { I: (s) => s.i('Rb'), Ic: (s) => s.i('Rc'), Itot: (s) => s.i('Ra'), Vp: (s) => s.v(1) - s.v(2), Va: (s) => s.v(2) },
    }),
    hints: (v, h) => [
      M`$R_b$ is in parallel with the branch made of $R_c$ and $R$ in series. $R_a$ carries the total current $I_{\text{tot}}$.`,
      M`The junction rule gives $I = I_{\text{tot}} - I_c$. Both parallel branches share the voltage $V_p = I R_b$.`,
      M`$V_p = ${h.q('Vp')}$, and the voltage across $R_a$ is $I_{\text{tot}} R_a = ${h.q('Va')}$.`,
    ],
    solution: (v, h) => [
      M`The total current $I_{\text{tot}} = ${h.q('Itot')}$ splits into the current $I$ through $R_b = ${h.q('Rb')}$ and the current $I_c = ${h.q('Ic')}$ through the right branch:` +
        al(M`I &= I_{\text{tot}} - I_c = ${h.q('Itot')} - ${h.q('Ic')} = ${h.b('I')}`),
      M`Both branches share the voltage $V_p = I R_b = ${h.q('Vp')}$. The right branch consists of $R_c = ${h.q('Rc')}$ and $R$ in series, so $V_p = I_c\,(R_c + R)$ and` +
        al(M`R &= \frac{V_p}{I_c} - R_c`, M`&= \frac{${h.q('Vp')}}{${h.q('Ic')}} - ${h.q('Rc')}`, M`&= ${h.b('R')}`),
      M`The battery voltage is the sum of the voltage across $R_a = ${h.q('Ra')}$, which carries the total current, and the voltage across the parallel part:` +
        al(M`V &= I_{\text{tot}} R_a + V_p`, M`&= ${h.q('Itot')}\times${h.q('Ra')} + ${h.q('Vp')}`, M`&= ${h.b('V')}`),
    ],
  });

  // ---------------------------------------------------------------- H
  T({
    id: 'H', title: 'Diagonal resistor',
    q: {
      V: Q('V', 'V'), I: Q('I', 'mA'), Ia: Q('I_a', 'mA'), Ra: Q('R_a', 'kΩ'), Rb: Q('R_b', 'kΩ'),
      Itwo: Q('I_2', 'mA'), Vp: Q('V_p', 'V'), Rone: Q('R_1', 'kΩ'), Rtwo: Q('R_2', 'kΩ'),
      Vone: Q('V_1', 'V'), Va: Q('V_a', 'V'), Vtwo: Q('V_2', 'V'),
    },
    given: ['V', 'I', 'Ia', 'Ra', 'Rb'], unknowns: ['Rone', 'Rtwo', 'Itwo'],
    prompt: 'find the resistances $R_1$ and $R_2$ and the current $I_2$',
    original: { Ia: 2, Ra: 8, Rone: 16, Rb: 12, Rtwo: 1 },
    pick: (r) => ({ Ia: r.int(1, 6), Ra: r.pick(RS), Rone: r.pick(RS), Rb: r.pick(RS), Rtwo: r.pick(RS) }),
    compute: ({ Ia, Ra, Rone, Rb, Rtwo }) => {
      const Vp = Ia * (Rone + Ra), Itwo = Vp / Rb, I = Ia + Itwo, Vtwo = I * Rtwo;
      return { V: Vtwo + Vp, I, Ia, Ra, Rb, Itwo, Vp, Rone, Rtwo, Vone: Ia * Rone, Va: Ia * Ra, Vtwo };
    },
    draw(s, c) {
      s.bat([0, 0], [0, 2.5]).vol([0, 2.5], [0, 0], c.lab('V'), 'left');
      s.wire([0, 2.5], [0, 5]).cur([0, 2.5], [0, 5], c.lab('I'), 'left');
      s.res([0, 5], [6.5, 5], { l: c.lab('Rone'), i: c.lab('Ia') }).vol([0, 5], [6.5, 5], c.lab('Vone'), 'below');
      s.res([6.5, 5], [6.5, 0], { l: c.lab('Ra'), ls: 'left' }).vol([6.5, 5], [6.5, 0], c.lab('Va'), 'right');
      s.res([6.5, 0], [0, 0], { l: c.lab('Rtwo'), ls: 'below' }).vol([6.5, 0], [0, 0], c.lab('Vtwo'), 'above');
      s.res([0, 5], [6.5, 0], { l: c.lab('Rb'), ls: [-1, -1], i: c.lab('Itwo'), is: [-1, -1], it: 0.7 })
        .vol([0, 5], [6.5, 0], c.lab('Vp'), [1, 1]);
      s.dot([0, 5]).dot([6.5, 0]);
    },
    netlist: (v) => ({
      E: [['V', 'V', 1, 0, v.V], ['R', 'Rone', 1, 2, v.Rone], ['R', 'Ra', 2, 3, v.Ra], ['R', 'Rb', 1, 3, v.Rb], ['R', 'Rtwo', 3, 0, v.Rtwo]],
      probes: { Ia: (s) => s.i('Rone'), Itwo: (s) => s.i('Rb'), I: (s) => s.i('Rtwo'), Vp: (s) => s.v(1) - s.v(3), Vtwo: (s) => s.v(3) },
    }),
    hints: (v, h) => [
      M`The diagonal resistor $R_b$ is in parallel with the series pair $R_1$ and $R_a$. This parallel part is in series with $R_2$, which carries the full current $I$.`,
      M`The battery current splits into $I_a$ (upper path) and $I_2$ (diagonal). The diagonal and the upper path share the voltage $V_p = I_2 R_b$.`,
      M`$V_p = ${h.q('Vp')}$. The rest of the battery voltage, $${h.q('Vtwo')}$, drops across $R_2$.`,
    ],
    solution: (v, h) => [
      M`The diagonal resistor $R_b = ${h.q('Rb')}$ is in parallel with the series combination of $R_1$ and $R_a = ${h.q('Ra')}$. This parallel part is in series with $R_2$, which carries the full battery current $I = ${h.q('I')}$.`,
      M`The battery current splits into the current $I_a = ${h.q('Ia')}$ through the upper path and the current through the diagonal:` +
        al(M`I_2 &= I - I_a = ${h.q('I')} - ${h.q('Ia')} = ${h.b('Itwo')}`),
      M`The voltage across the parallel part is $V_p = I_2 R_b = ${h.q('Vp')}$. The upper path carries $I_a$ at the same voltage, $V_p = I_a\,(R_1+R_a)$, so` +
        al(M`R_1 &= \frac{V_p}{I_a} - R_a`, M`&= \frac{${h.q('Vp')}}{${h.q('Ia')}} - ${h.q('Ra')}`, M`&= ${h.b('Rone')}`),
      M`The remaining battery voltage $V - V_p$ drops across $R_2$:` +
        al(M`R_2 &= \frac{V-V_p}{I}`, M`&= \frac{${h.q('V')}-${h.q('Vp')}}{${h.q('I')}}`, M`&= ${h.b('Rtwo')}`),
    ],
  });

  // ---------------------------------------------------------------- I
  // Bulb characteristic: I = 360 mA · sqrt(ΔV / 30 V)
  const bulbI = (u) => 360 * Math.sqrt(u / 30);

  function bulbPlot(v, sol) {
    const W = 300, H = 240, ml = 48, mt = 12, mr = 14, mb = 44;
    const X = (u) => (ml + (u / 150) * W).toFixed(1), Y = (i) => (mt + H - (i / 800) * H).toFixed(1);
    let g = '';
    for (let u = 0; u <= 150; u += 10) g += `<line class="grid${u % 50 ? '' : ' major'}" x1="${X(u)}" y1="${Y(0)}" x2="${X(u)}" y2="${Y(800)}"/>`;
    for (let i = 0; i <= 800; i += 40) g += `<line class="grid${i % 200 ? '' : ' major'}" x1="${X(0)}" y1="${Y(i)}" x2="${X(150)}" y2="${Y(i)}"/>`;
    for (let u = 0; u <= 150; u += 50) g += `<text class="tick" x="${X(u)}" y="${+Y(0) + 16}" text-anchor="middle">${u}</text>`;
    for (let i = 0; i <= 800; i += 200) g += `<text class="tick" x="${ml - 6}" y="${Y(i)}" dy="0.35em" text-anchor="end">${i}</text>`;
    const pts = [];
    for (let u = 0; u <= 148; u += 1) pts.push(`${X(u)},${Y(bulbI(u))}`);
    g += `<polyline class="curve" points="${pts.join(' ')}"/>`;
    if (sol) {
      g += `<path class="op" d="M${X(0)} ${Y(v.I)}H${X(v.VL)}V${Y(0)}"/>`;
      g += `<circle class="op-dot" cx="${X(v.VL)}" cy="${Y(v.I)}" r="4"/>`;
    }
    g += `<text class="axis" x="${ml + W / 2}" y="${mt + H + 36}" text-anchor="middle"><tspan font-style="italic">ΔV</tspan> in V</text>`;
    g += `<text class="axis" transform="translate(14 ${mt + H / 2}) rotate(-90)" text-anchor="middle"><tspan font-style="italic">I</tspan> in mA</text>`;
    const w = ml + W + mr, hh = mt + H + mb;
    return `<svg class="plot" viewBox="0 0 ${w} ${hh}" width="${w}" style="max-width:100%;height:auto" role="img" aria-label="Current–voltage characteristic of the light bulb">${g}</svg>`;
  }

  T({
    id: 'I', title: 'Light bulb',
    q: {
      V: Q('V', 'V'), I: Q('I', 'mA'), Rb: Q('R_b', 'Ω'), VL: Q('V_L', 'V'), Vp: Q('V_p', 'V'),
      Itwo: Q('I_2', 'mA'), Ione: Q('I_1', 'mA'), Rone: Q('R_1', 'Ω'),
    },
    given: ['V', 'I', 'Rb'], unknowns: ['Rone', 'Ione', 'Itwo'],
    maxV: 250, maxI: 800, tol: 0.05,
    text: 'A light bulb is connected in series with two resistors in parallel. Using the characteristic of the light bulb shown below, find the resistance $R_1$ and the currents $I_1$ and $I_2$.',
    original: { VL: 30, V: 85, Rb: 220 },
    pick: (r) => ({ VL: r.pick([30, 30, 120, 67.5]), V: 5 * r.int(8, 50), Rb: r.pick([100, 120, 150, 200, 220, 250, 300, 400, 500]) }),
    compute: ({ VL, V, Rb }) => {
      const I = bulbI(VL), Vp = V - VL, Itwo = (Vp / Rb) * 1000, Ione = I - Itwo;
      return { V, I, Rb, VL, Vp, Itwo, Ione, Rone: (Vp / Ione) * 1000 };
    },
    draw(s, c) {
      s.bat([0, 0], [0, 3]).vol([0, 3], [0, 0], c.lab('V'), 'left');
      s.wire([0, 3], [1, 3]).cur([0, 3], [1, 3], c.lab('I'), 'above');
      s.lamp([1, 3], [4, 3], { l: c.sol ? null : 'bulb' }).vol([1, 3], [4, 3], c.sol ? `≈ ${c.val('VL')}` : null, 'below');
      s.res([4, 3], [4, 0], { l: c.lab('Rone'), i: c.lab('Ione') }).vol([4, 3], [4, 0], c.lab('Vp'), 'left');
      s.wire([4, 3], [7.5, 3]);
      s.res([7.5, 3], [7.5, 0], { l: c.lab('Rb'), i: c.lab('Itwo') }).vol([7.5, 3], [7.5, 0], c.lab('Vp'), 'left');
      s.wire([7.5, 0], [0, 0]).dot([4, 3]).dot([4, 0]);
    },
    extra: bulbPlot,
    netlist: (v) => ({
      E: [['V', 'V', 1, 0, v.V], ['R', 'L', 1, 2, v.VL / v.I], ['R', 'Rone', 2, 0, v.Rone / 1000], ['R', 'Rb', 2, 0, v.Rb / 1000]],
      probes: { I: (s) => s.i('L'), Ione: (s) => s.i('Rone'), Itwo: (s) => s.i('Rb'), Vp: (s) => s.v(2) },
    }),
    hints: (v, h) => [
      M`The bulb carries the full current $I$. $R_1$ and $R_b$ are in parallel and share the rest of the battery voltage.`,
      M`Read the voltage $V_L$ across the bulb from the characteristic at $I = ${h.q('I')}$. The parallel resistors are at $V_p = V - V_L$.`,
      M`$V_L \approx ${h.q('VL')}$, so $V_p = ${h.q('Vp')}$. Ohm's law then gives $I_2$ through $R_b$.`,
    ],
    solution: (v, h) => [
      M`The full current $I = ${h.q('I')}$ flows through the light bulb. From the characteristic we read the voltage across the bulb at this current:` +
        al(M`V_L &\approx ${h.q('VL')}`),
      M`According to the voltage divider rule, the rest of the battery voltage drops across the two parallel resistors. Their common voltage is` +
        al(M`V_p &= V - V_L = ${h.q('V')} - ${h.q('VL')} = ${h.q('Vp')}`),
      M`The current through $R_b = ${h.q('Rb')}$ follows from Ohm's law:` +
        al(M`I_2 &= \frac{V_p}{R_b} = \frac{${h.q('Vp')}}{${h.q('Rb')}} = ${h.b('Itwo')}`),
      M`The rest of the current flows through $R_1$:` +
        al(M`I_1 &= I - I_2 = ${h.q('I')} - ${h.q('Itwo')} = ${h.b('Ione')}`),
      M`Finally,` + al(M`R_1 &= \frac{V_p}{I_1} = \frac{${h.q('Vp')}}{${h.q('Ione')}} = ${h.b('Rone')}`),
      M`Because the voltage is read from a graph, results that differ slightly from these values are accepted.`,
    ],
  });

  // ---------------------------------------------------------------- J
  T({
    id: 'J', title: 'Two parallel pairs in series',
    q: {
      Ra: Q('R_a', 'kΩ'), Rb: Q('R_b', 'kΩ'), Rc: Q('R_c', 'kΩ'), Ia: Q('I_a', 'mA'), Ic: Q('I_c', 'mA'),
      Vone: Q('V_1', 'V'), Vtwo: Q('V_2', 'V'), V: Q('V', 'V'), I: Q('I', 'mA'), Itot: Q(M`I_{\text{tot}}`, 'mA'),
      IR: Q('I_R', 'mA'), R: Q('R', 'kΩ'),
    },
    given: ['Ra', 'Rb', 'Rc', 'Ia', 'Ic'], unknowns: ['V', 'R', 'I'],
    prompt: 'find the voltage $V$ of the battery, the resistance $R$ and the current $I$',
    original: { Ra: 6, Rc: 6, Ia: 2, Ic: 4, Rb: 12 },
    pick: (r) => ({ Ra: r.pick(RS), Rc: r.pick(RS), Ia: r.int(1, 10), Ic: r.int(1, 10), Rb: r.pick(RS) }),
    compute: ({ Ra, Rc, Ia, Ic, Rb }) => {
      const Vone = Ia * Ra, Vtwo = Ic * Rc, I = Vtwo / Rb, Itot = I + Ic, IR = Itot - Ia;
      return { Ra, Rb, Rc, Ia, Ic, Vone, Vtwo, V: Vone + Vtwo, I, Itot, IR, R: Vone / IR };
    },
    draw(s, c) {
      s.bat([0, 0], [0, 5]).vol([0, 5], [0, 0], c.lab('V'), 'left');
      s.wire([0, 5], [2.5, 5]).cur([0, 5], [2.5, 5], c.lab('Itot'), 'above');
      s.res([2.5, 5], [2.5, 2.5], { l: c.lab('Ra'), i: c.lab('Ia') }).vol([2.5, 5], [2.5, 2.5], c.lab('Vone'), 'left');
      s.res([2.5, 2.5], [2.5, 0], { l: c.lab('Rb'), i: c.lab('I') }).vol([2.5, 2.5], [2.5, 0], c.lab('Vtwo'), 'left');
      s.wire([2.5, 5], [6, 5]);
      s.res([6, 5], [6, 2.5], { l: c.lab('R'), i: c.lab('IR') }).vol([6, 5], [6, 2.5], c.lab('Vone'), 'left');
      s.res([6, 2.5], [6, 0], { l: c.lab('Rc'), i: c.lab('Ic') }).vol([6, 2.5], [6, 0], c.lab('Vtwo'), 'left');
      s.wire([2.5, 2.5], [6, 2.5]).wire([6, 0], [0, 0]);
      s.dot([2.5, 5]).dot([2.5, 2.5]).dot([6, 2.5]).dot([2.5, 0]);
    },
    netlist: (v) => ({
      E: [['V', 'V', 1, 0, v.V], ['R', 'Ra', 1, 2, v.Ra], ['R', 'R', 1, 2, v.R], ['R', 'Rb', 2, 0, v.Rb], ['R', 'Rc', 2, 0, v.Rc]],
      probes: {
        Ia: (s) => s.i('Ra'), Ic: (s) => s.i('Rc'), I: (s) => s.i('Rb'), IR: (s) => s.i('R'),
        Itot: (s) => s.i('Rb') + s.i('Rc'), Vone: (s) => s.v(1) - s.v(2), Vtwo: (s) => s.v(2),
      },
    }),
    hints: (v, h) => [
      M`The circuit consists of two parallel pairs in series: $R_a$ and $R$ at the top, $R_b$ and $R_c$ at the bottom.`,
      M`Both resistors of a pair share their voltage: $V_1 = I_a R_a$ and $V_2 = I_c R_c$. The two pair voltages add up to $V$.`,
      M`$V_1 = ${h.q('Vone')}$ and $V_2 = ${h.q('Vtwo')}$. The battery current $I_{\text{tot}} = I + I_c$ also flows through the upper pair.`,
    ],
    solution: (v, h) => [
      M`The circuit consists of two parallel pairs connected in series. In the upper pair, $R_a = ${h.q('Ra')}$ carries $I_a = ${h.q('Ia')}$. In the lower pair, $R_c = ${h.q('Rc')}$ carries $I_c = ${h.q('Ic')}$.`,
      M`Both resistors of a pair are at the same voltage. The voltages across the upper and the lower pair follow from Ohm's law:` +
        al(M`V_1 &= I_a R_a = ${h.q('Ia')}\times${h.q('Ra')} = ${h.q('Vone')}`, M`V_2 &= I_c R_c = ${h.q('Ic')}\times${h.q('Rc')} = ${h.q('Vtwo')}`),
      M`The two pairs are in series, so their voltages add up to the battery voltage:` +
        al(M`V &= V_1 + V_2 = ${h.q('Vone')} + ${h.q('Vtwo')} = ${h.b('V')}`),
      M`The current through $R_b = ${h.q('Rb')}$ follows from the voltage across the lower pair:` +
        al(M`I &= \frac{V_2}{R_b} = \frac{${h.q('Vtwo')}}{${h.q('Rb')}} = ${h.b('I')}`),
      M`The battery current flows through both pairs. At the lower pair it splits into $I$ and $I_c$, so $I_{\text{tot}} = I + I_c = ${h.q('Itot')}$. At the upper pair, the part that does not flow through $R_a$ flows through $R$:` +
        al(M`I_R &= I_{\text{tot}} - I_a = ${h.q('Itot')} - ${h.q('Ia')} = ${h.q('IR')}`),
      M`$R$ is at the voltage $V_1$ of the upper pair. Hence` +
        al(M`R &= \frac{V_1}{I_R} = \frac{${h.q('Vone')}}{${h.q('IR')}} = ${h.b('R')}`),
    ],
  });

  // ---------------------------------------------------------------- K
  T({
    id: 'K', title: 'Three resistors in parallel',
    q: {
      V: Q('V', 'V'), Ra: Q('R_a', 'kΩ'), Rone: Q('R_1', 'kΩ'), Rtwo: Q('R_2', 'kΩ'), IR: Q('I_R', 'mA'),
      Vp: Q('V_p', 'V'), R: Q('R', 'kΩ'), Va: Q('V_a', 'V'), I: Q('I', 'mA'), Ione: Q('I_1', 'mA'), Itwo: Q('I_2', 'mA'),
    },
    given: ['V', 'Ra', 'Rone', 'Rtwo', 'IR'], unknowns: ['Vp', 'R', 'I'],
    prompt: 'find the voltage $V_p$ across the parallel resistors, the resistance $R$ and the battery current $I$',
    original: { V: 18, Ra: 2, Rone: 2, Rtwo: 3, R: 6 },
    pick: (r) => ({ V: r.int(5, 60), Ra: r.pick(RS), Rone: r.pick(RS), Rtwo: r.pick(RS), R: r.pick(RS) }),
    compute: ({ V, Ra, Rone, Rtwo, R }) => {
      const Rp = 1 / (1 / Rone + 1 / Rtwo + 1 / R), Vp = (V * Rp) / (Ra + Rp);
      return { V, Ra, Rone, Rtwo, IR: Vp / R, Vp, R, Va: V - Vp, I: (V - Vp) / Ra, Ione: Vp / Rone, Itwo: Vp / Rtwo };
    },
    draw(s, c) {
      s.bat([0, 0], [0, 3]).vol([0, 3], [0, 0], c.lab('V'), 'left');
      s.res([0, 3], [3, 3], { l: c.lab('Ra') }).vol([0, 3], [3, 3], c.lab('Va'), 'below');
      s.res([3, 3], [3, 0], { l: c.lab('Rone'), i: c.lab('Ione') }).vol([3, 3], [3, 0], c.lab('Vp'), 'left');
      s.wire([3, 3], [6, 3]);
      s.res([6, 3], [6, 0], { l: c.lab('Rtwo'), i: c.lab('Itwo') });
      s.wire([6, 3], [9, 3]);
      s.res([9, 3], [9, 0], { l: c.lab('R'), i: c.lab('IR') });
      s.wire([9, 0], [0, 0]).cur([3, 0], [0, 0], c.lab('I'), 'below');
      s.dot([3, 3]).dot([3, 0]).dot([6, 3]).dot([6, 0]);
    },
    netlist: (v) => ({
      E: [['V', 'V', 1, 0, v.V], ['R', 'Ra', 1, 2, v.Ra], ['R', 'Rone', 2, 0, v.Rone], ['R', 'Rtwo', 2, 0, v.Rtwo], ['R', 'R', 2, 0, v.R]],
      probes: { IR: (s) => s.i('R'), I: (s) => s.i('Ra'), Vp: (s) => s.v(2), Ione: (s) => s.i('Rone'), Itwo: (s) => s.i('Rtwo') },
    }),
    hints: (v, h) => [
      M`$R_1$, $R_2$ and $R$ are in parallel at the common voltage $V_p$. The parallel group is in series with $R_a$.`,
      M`Neither $V_p$ nor $I$ is known. Use the junction rule and Ohm's law: $\dfrac{V-V_p}{R_a} = \dfrac{V_p}{R_1} + \dfrac{V_p}{R_2} + I_R$, then solve for $V_p$.`,
      M`Collecting the $V_p$ terms: $V_p\left(\frac{1}{R_a}+\frac{1}{R_1}+\frac{1}{R_2}\right) = \frac{V}{R_a} - I_R = ${h.qu(v.V / v.Ra - v.IR, 'mA')}$.`,
    ],
    solution: (v, h) => [
      M`Let $R_a = ${h.q('Ra')}$ be the resistor in series with the battery, and $R_1 = ${h.q('Rone')}$ and $R_2 = ${h.q('Rtwo')}$ the two known resistors in parallel. The unknown resistor $R$ carries the current $I_R = ${h.q('IR')}$.`,
      M`Neither the battery current nor the voltage $V_p$ is known. We therefore use the junction rule: the current through $R_a$ equals the sum of the currents in the three parallel branches. With Ohm's law, and since $R_a$ is at the voltage $V - V_p$,` +
        al(M`\frac{V-V_p}{R_a} &= \frac{V_p}{R_1}+\frac{V_p}{R_2}+I_R`),
      M`Collecting the terms with $V_p$ on one side yields` +
        al(
          M`V_p &= \frac{\dfrac{V}{R_a}-I_R}{\dfrac{1}{R_a}+\dfrac{1}{R_1}+\dfrac{1}{R_2}}`,
          M`&= \frac{\dfrac{${h.q('V')}}{${h.q('Ra')}}-${h.q('IR')}}{\dfrac{1}{${h.q('Ra')}}+\dfrac{1}{${h.q('Rone')}}+\dfrac{1}{${h.q('Rtwo')}}}`,
          M`&= ${h.b('Vp')}`),
      M`The unknown resistor is at the same voltage, so` +
        al(M`R &= \frac{V_p}{I_R} = \frac{${h.q('Vp')}}{${h.q('IR')}} = ${h.b('R')}`),
      M`The remaining $${h.q('Va')}$ of the battery voltage drops across $R_a$:` +
        al(M`I &= \frac{V-V_p}{R_a} = \frac{${h.q('V')}-${h.q('Vp')}}{${h.q('Ra')}} = ${h.b('I')}`),
      M`Check: the currents through $R_1$ and $R_2$ are $V_p/R_1 = ${h.q('Ione')}$ and $V_p/R_2 = ${h.q('Itwo')}$. Together with $I_R$ they add up to the battery current $I$.`,
    ],
  });

  // ---------------------------------------------------------------- L
  T({
    id: 'L', title: 'Unknown series resistor',
    q: {
      V: Q('V', 'V'), Rone: Q('R_1', 'kΩ'), Rtwo: Q('R_2', 'kΩ'), Rthree: Q('R_3', 'kΩ'), Rfour: Q('R_4', 'kΩ'), Ifour: Q('I_4', 'mA'),
      Vq: Q('V_{34}', 'V'), Ithree: Q('I_3', 'mA'), Ib: Q('I_b', 'mA'), Vtwo: Q('V_2', 'V'), Vone: Q('V_1', 'V'),
      Ione: Q('I_1', 'mA'), I: Q('I', 'mA'), VR: Q('V_R', 'V'), R: Q('R', 'kΩ'),
    },
    given: ['V', 'Rone', 'Rtwo', 'Rthree', 'Rfour', 'Ifour'], unknowns: ['R', 'I', 'Vone'],
    prompt: 'find the resistance $R$, the battery current $I$ and the voltage $V_1$ across $R_1$',
    original: { Rthree: 3, Rfour: 6, Ifour: 1, Rtwo: 2, Rone: 4, R: 2 },
    pick: (r) => ({ Rthree: r.pick(RS), Rfour: r.pick(RS), Ifour: r.int(1, 6), Rtwo: r.pick(RS), Rone: r.pick(RS), R: r.pick(RS) }),
    compute: ({ Rthree, Rfour, Ifour, Rtwo, Rone, R }) => {
      const Vq = Ifour * Rfour, Ithree = Vq / Rthree, Ib = Ithree + Ifour, Vtwo = Ib * Rtwo, Vone = Vtwo + Vq;
      const Ione = Vone / Rone, I = Ione + Ib, VR = I * R;
      return { V: Vone + VR, Rone, Rtwo, Rthree, Rfour, Ifour, Vq, Ithree, Ib, Vtwo, Vone, Ione, I, VR, R };
    },
    draw(s, c) {
      s.bat([0, 0], [0, 3]).vol([0, 3], [0, 0], c.lab('V'), 'left');
      s.wire([0, 3], [1, 3]).cur([0, 3], [1, 3], c.lab('I'), 'above');
      s.res([1, 3], [4, 3], { l: c.lab('R') }).vol([1, 3], [4, 3], c.lab('VR'), 'below');
      s.res([4, 3], [4, 0], { l: c.lab('Rone'), i: c.lab('Ione') }).vol([4, 3], [4, 0], c.lab('Vone'), 'left');
      s.res([4, 3], [7.5, 3], { l: c.lab('Rtwo') }).vol([4, 3], [7.5, 3], c.lab('Vtwo'), 'below');
      s.res([7.5, 3], [7.5, 0], { l: c.lab('Rthree'), i: c.lab('Ithree') }).vol([7.5, 3], [7.5, 0], c.lab('Vq'), 'left');
      s.wire([7.5, 3], [10.5, 3]);
      s.res([10.5, 3], [10.5, 0], { l: c.lab('Rfour'), i: c.lab('Ifour') });
      s.wire([10.5, 0], [0, 0]).cur([7.5, 0], [4, 0], c.lab('Ib'), 'below');
      s.dot([4, 3]).dot([4, 0]).dot([7.5, 3]).dot([7.5, 0]);
    },
    netlist: (v) => ({
      E: [['V', 'V', 1, 0, v.V], ['R', 'R', 1, 2, v.R], ['R', 'Rone', 2, 0, v.Rone], ['R', 'Rtwo', 2, 3, v.Rtwo],
        ['R', 'Rthree', 3, 0, v.Rthree], ['R', 'Rfour', 3, 0, v.Rfour]],
      probes: {
        I: (s) => s.i('R'), Ione: (s) => s.i('Rone'), Ifour: (s) => s.i('Rfour'), Ithree: (s) => s.i('Rthree'),
        Ib: (s) => s.i('Rtwo'), Vone: (s) => s.v(2), Vq: (s) => s.v(3),
      },
    }),
    hints: (v, h) => [
      M`$R_3$ and $R_4$ are in parallel. That pair is in series with $R_2$, and this whole right branch is in parallel with $R_1$. $R$ carries the full battery current.`,
      M`The only known current is $I_4$, so start at the far right and work towards the battery: $V_{34} = I_4 R_4$, then $I_3 = V_{34}/R_3$, then $I_b = I_3 + I_4$ through $R_2$.`,
      M`$V_{34} = ${h.q('Vq')}$ and $I_b = ${h.q('Ib')}$, so $V_1 = I_b R_2 + V_{34}$.`,
    ],
    solution: (v, h) => [
      M`Let $R_1 = ${h.q('Rone')}$ be the resistor in the middle branch. The right branch consists of $R_2 = ${h.q('Rtwo')}$ in series with the parallel pair $R_3 = ${h.q('Rthree')}$ and $R_4 = ${h.q('Rfour')}$. The only given current is $I_4 = ${h.q('Ifour')}$ through $R_4$, so we start at the far right and work towards the battery.`,
      M`The voltage across the parallel pair is` +
        al(M`V_{34} &= I_4 R_4 = ${h.q('Ifour')}\times${h.q('Rfour')} = ${h.q('Vq')}`),
      M`$R_3$ is at the same voltage and carries` + al(M`I_3 &= \frac{V_{34}}{R_3} = \frac{${h.q('Vq')}}{${h.q('Rthree')}} = ${h.q('Ithree')}`),
      M`Both currents flow through $R_2$:` + al(M`I_b &= I_3 + I_4 = ${h.q('Ithree')} + ${h.q('Ifour')} = ${h.q('Ib')}`),
      M`so the voltage across $R_2$ is $V_2 = I_b R_2 = ${h.q('Vtwo')}$. The middle branch is in parallel with the whole right branch. Its voltage is` +
        al(M`V_1 &= V_2 + V_{34} = ${h.q('Vtwo')} + ${h.q('Vq')} = ${h.b('Vone')}`),
      M`The current through $R_1$ is $I_1 = V_1/R_1 = ${h.q('Ione')}$, and the battery current splits into $I_1$ and $I_b$:` +
        al(M`I &= I_1 + I_b = ${h.q('Ione')} + ${h.q('Ib')} = ${h.b('I')}`),
      M`The rest of the battery voltage drops across $R$, which carries the full battery current:` +
        al(M`R &= \frac{V - V_1}{I} = \frac{${h.q('V')} - ${h.q('Vone')}}{${h.q('I')}} = ${h.b('R')}`),
    ],
  });

  const api = { TEMPLATES, generate, valid, helpers, fmt, rng };
  root.Exercises = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
