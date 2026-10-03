// Random series-parallel resistor circuits with worked solutions.
//
// A circuit is a tree: leaves are resistors, inner nodes are series (S) or parallel (P)
// combinations, and the root is connected to the battery. Values are exact fractions in
// V, kΩ and mA (V = kΩ·mA); the battery voltage is chosen so that every current and
// voltage is a multiple of 0.5. A rule-based solver (Ohm's law, series and parallel
// rules) decides whether the unknowns can be found from the givens, and its derivation
// becomes the worked solution.
(function (root) {
  'use strict';

  const Circuit = root.Circuit || require('./circuit.js');
  // The page language (lang.js, shared by the apps); English where it is not loaded.
  const Lang = root.Lang || (typeof require === 'function' ? require('./lang.js') : null);
  const L = (en, de) => (Lang ? Lang.L(en, de) : en);
  const de = () => !!Lang && Lang.get() === 'de';
  const M = String.raw;
  const RS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20];
  const MAX_WIDTH = 15; // diagram width in drawing units

  const LEVELS = {
    easy: { name: () => L('Easy', 'Einfach'), n: [2, 3], V: [4, 40], depth: 1, inverse: 0.4, hidden: [1, 1], hideV: 0, targets: [1, 2], steps: [1, 5] },
    medium: { name: () => L('Medium', 'Mittel'), n: [3, 5], V: [6, 80], depth: 2, compact: true, inverse: 0.7, hidden: [1, 1], hideV: 0.3, targets: [2, 2], steps: [3, 9] },
    hard: { name: () => L('Hard', 'Schwierig'), n: [5, 7], V: [6, 120], depth: 3, compact: true, inverse: 1, hidden: [1, 2], hideV: 0.5, targets: [3, 3], steps: [7, 18] },
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
    return { n: n / g, d: d / g };
  }
  const fadd = (a, b) => F(a.n * b.d + b.n * a.d, a.d * b.d);
  const fsub = (a, b) => F(a.n * b.d - b.n * a.d, a.d * b.d);
  const fmul = (a, b) => F(a.n * b.n, a.d * b.d);
  const fdiv = (a, b) => F(a.n * b.d, a.d * b.n);
  const fval = (f) => f.n / f.d;

  // Numbers with a decimal point in English, a decimal comma in German.
  function fmt(x) {
    const s = Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x))
      : Math.abs(x) >= 1 ? String(parseFloat(x.toFixed(2))) : String(parseFloat(x.toPrecision(2)));
    return de() ? s.replace('.', ',') : s;
  }

  // Decimal if it terminates within two places, otherwise a fraction.
  function ftex(f) {
    if (f.d === 1 || (100 % f.d === 0)) return fmt(fval(f)).replace(',', '{,}');
    return M`\tfrac{${f.n}}{${f.d}}`;
  }

  // ---------------------------------------------------------------- circuit tree
  function buildTree(n, parentT, r) {
    if (n === 1) return { t: 'R' };
    const t = parentT === 'S' ? 'P' : parentT === 'P' ? 'S' : r.pick(['S', 'P']);
    const k = r.int(2, Math.min(n, 3));
    const parts = new Array(k).fill(1);
    for (let i = k; i < n; i++) parts[r.int(0, k - 1)]++;
    return { t, kids: parts.map((m) => buildTree(m, t, r)) };
  }

  // Series elements can be reordered freely. For the whole circuit, put half of the plain
  // resistors before the groups (drawn on the top wire) and half after (bottom wire).
  function arrangeRoot(tree) {
    if (tree.t !== 'S') return tree;
    const leaves = tree.kids.filter((k) => k.t === 'R'), groups = tree.kids.filter((k) => k.t !== 'R');
    if (!groups.length) return tree;
    const nTop = Math.ceil(leaves.length / 2);
    tree.kids = [...leaves.slice(0, nTop), ...groups, ...leaves.slice(nTop)];
    return tree;
  }

  const depth = (node) => (node.t === 'R' ? 0 : 1 + Math.max(...node.kids.map(depth)));

  function index(rootNode) {
    const nodes = [], leaves = [];
    (function walk(node, parent) {
      node.id = nodes.length;
      node.parent = parent;
      nodes.push(node);
      if (node.t === 'R') { leaves.push(node); node.idx = leaves.length; node.leaves = [node.idx]; return; }
      node.kids.forEach((k) => walk(k, node));
      node.leaves = node.kids.flatMap((k) => k.leaves);
    })(rootNode, null);
    return { nodes, leaves };
  }

  function resistance(node) {
    if (node.t === 'R') return node.R;
    const rs = node.kids.map(resistance);
    node.R = node.t === 'S' ? rs.reduce(fadd) : fdiv(F(1), rs.reduce((s, x) => fadd(s, fdiv(F(1), x)), F(0)));
    return node.R;
  }

  function flow(node, V, I) {
    node.V = V; node.I = I;
    if (node.t === 'S') node.kids.forEach((k) => flow(k, fmul(I, k.R), I));
    if (node.t === 'P') node.kids.forEach((k) => flow(k, V, fdiv(V, k.R)));
  }

  // Choose resistor values and a battery voltage so that all voltages and currents are nice.
  function assignValues(c, lv, r) {
    for (const leaf of c.leaves) leaf.R = F(r.pick(RS));
    resistance(c.root);
    flow(c.root, F(1), fdiv(F(1), c.root.R));
    let whole = 1, half = 1;
    for (const node of c.nodes) {
      for (const f of [node.V, node.I]) {
        whole = lcm(whole, f.d);
        half = lcm(half, f.d / gcd(f.d, 2));
      }
    }
    const [lo, hi] = lv.V;
    const options = (step) => { const out = []; for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) out.push(v); return out; };
    let choices = options(whole);
    if (!choices.length) choices = options(half);
    if (!choices.length) return false;
    const V = F(r.pick(choices));
    for (const node of c.nodes) { node.V = fmul(node.V, V); node.I = fmul(node.I, V); }
    return c.nodes.every((node) => fval(node.I) >= 0.5 && fval(node.I) <= 100 && fval(node.V) >= 0.5);
  }

  // ---------------------------------------------------------------- symbolic solver
  // Quantity keys: 'R3', 'I3', 'V3' for node id 3. Node 0 is the whole circuit (battery).
  // Each relation is an equation between quantities; `out` lists the keys it may be solved
  // for, `w` is the cost of using it in a solution (divider rules are cheapest, so they are
  // preferred), and `holds(g)` checks the equation numerically (used by the tests).
  // Divider rules only relate two resistors of the same group (V4/V5 = R4/R5, I4/I5 = R5/R4),
  // never a part to the whole.
  const W = { eqI: 0.2, eqV: 0.2, vratio: 1, iratio: 1, sumR: 1, invR: 1.2, sumV: 1.4, sumI: 1.4, ohm: 1.8 };
  const near = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));

  function relations(c) {
    const rels = [];
    const add = (rel) => {
      if (!(rel.rule in W)) throw new Error(`no cost for rule ${rel.rule}`);
      rels.push({ out: rel.keys, ...rel, w: W[rel.rule] });
    };
    const R = (n) => 'R' + n.id, V = (n) => 'V' + n.id, I = (n) => 'I' + n.id;
    for (const node of c.nodes) {
      add({ kind: 'ohm', rule: 'ohm', node, keys: [V(node), I(node), R(node)], holds: (g) => near(g(V(node)), g(I(node)) * g(R(node))) });
      if (node.t === 'R') continue;
      const kids = node.kids, rs = kids.map(R);
      const pairs = [];
      kids.forEach((a, i) => kids.slice(i + 1).forEach((b) => pairs.push([a, b])));
      if (node.t === 'S') {
        for (const k of kids) {
          add({ kind: 'eq', rule: 'eqI', q: 'I', parent: node, child: k, keys: [I(node), I(k)], holds: (g) => near(g(I(node)), g(I(k))) });
        }
        for (const [a, b] of pairs) {
          add({ kind: 'ratio', rule: 'vratio', q: 'V', parent: node, a, b, keys: [V(a), V(b), R(a), R(b)],
            holds: (g) => near(g(V(a)) * g(R(b)), g(V(b)) * g(R(a))) });
        }
        add({ kind: 'sum', rule: 'sumR', q: 'R', parent: node, keys: [R(node), ...rs], holds: (g) => near(g(R(node)), rs.reduce((sum, r) => sum + g(r), 0)) });
        add({ kind: 'sum', rule: 'sumV', q: 'V', parent: node, keys: [V(node), ...kids.map(V)], holds: (g) => near(g(V(node)), kids.reduce((sum, k) => sum + g(V(k)), 0)) });
      } else {
        const inv = (g) => rs.reduce((sum, r) => sum + 1 / g(r), 0);
        for (const k of kids) {
          add({ kind: 'eq', rule: 'eqV', q: 'V', parent: node, child: k, keys: [V(node), V(k)], holds: (g) => near(g(V(node)), g(V(k))) });
        }
        for (const [a, b] of pairs) {
          add({ kind: 'ratio', rule: 'iratio', q: 'I', parent: node, a, b, keys: [I(a), I(b), R(a), R(b)],
            holds: (g) => near(g(I(a)) * g(R(a)), g(I(b)) * g(R(b))) });
        }
        add({ kind: 'inv', rule: 'invR', q: 'R', parent: node, keys: [R(node), ...rs], holds: (g) => near(1 / g(R(node)), inv(g)) });
        add({ kind: 'sum', rule: 'sumI', q: 'I', parent: node, keys: [I(node), ...kids.map(I)], holds: (g) => near(g(I(node)), kids.reduce((sum, k) => sum + g(I(k)), 0)) });
      }
    }
    return rels;
  }

  // Cheapest derivation of every quantity that follows from `givens` (cost of a derivation =
  // cost of its relation + costs of its inputs). Positive costs keep derivations acyclic.
  function plan(rels, givens) {
    const cost = new Map([...givens].map((k) => [k, 0]));
    const best = new Map();
    for (let changed = true; changed;) {
      changed = false;
      for (const rel of rels) {
        for (const key of rel.out) {
          if (givens.has(key)) continue;
          const from = rel.keys.filter((k) => k !== key);
          if (!from.every((k) => cost.has(k))) continue;
          const c = rel.w + from.reduce((sum, k) => sum + cost.get(k), 0);
          if (!cost.has(key) || c < cost.get(key) - 1e-9) {
            cost.set(key, c);
            best.set(key, { key, rel, from });
            changed = true;
          }
        }
      }
    }
    return { known: new Set(cost.keys()), best };
  }

  // The steps needed for the targets, goal by goal: each target is preceded by its prerequisites.
  function neededSteps(best, targets) {
    const out = [], seen = new Set();
    const visit = (k) => {
      const s = best.get(k);
      if (!s || seen.has(k)) return;
      seen.add(k);
      s.from.forEach(visit);
      out.push(s);
    };
    targets.forEach(visit);
    return out;
  }

  // ---------------------------------------------------------------- problem selection
  // A circuit is padded if part of it could be replaced by a single resistor without changing
  // the exercise: a group in which nothing is measured or asked for, or several plain given
  // resistors in the same group whose currents and voltages play no role.
  function padded(c, givens, targets) {
    const involved = (node) => (node.t === 'R'
      ? targets.includes('R' + node.id) || ['I', 'V'].some((q) => givens.has(q + node.id) || targets.includes(q + node.id))
      : node.kids.some(involved));
    return c.nodes.some((node) => node.t !== 'R' && (
      (node !== c.root && !involved(node)) ||
      node.kids.filter((k) => k.t === 'R' && !involved(k)).length >= 2));
  }


  // Quantities in reading order: battery first, then by resistor number (R before I before V).
  const byReading = (a, b) => [a, b].map((k) => Number(k.slice(1)) * 3 + 'RIV'.indexOf(k[0])).reduce((x, y) => x - y);

  function chooseProblem(c, lv, r) {
    const rels = relations(c);
    const leafKeys = (q) => c.leaves.map((l) => q + l.id);
    const inverse = r.next() < lv.inverse;
    const nTargets = r.int(lv.targets[0], lv.targets[1]);
    let givens = new Set([...leafKeys('R'), 'V0']);
    const targets = [];

    if (inverse) {
      const hidden = r.shuffle(c.leaves.slice()).slice(0, r.int(lv.hidden[0], lv.hidden[1]));
      for (const leaf of hidden) { givens.delete('R' + leaf.id); targets.push('R' + leaf.id); }
      if (r.next() < lv.hideV) { givens.delete('V0'); targets.push('V0'); }
    }
    const extra = r.shuffle([...leafKeys('I'), ...leafKeys('V'), 'I0']);
    while (targets.length < nTargets && extra.length) targets.push(extra.pop());
    targets.splice(nTargets);
    if (!targets.length) return null;
    targets.sort(byReading);

    const solvable = (g) => { const k = plan(rels, g).known; return targets.every((t) => k.has(t)); };
    if (!solvable(givens)) {
      const measured = r.shuffle([...leafKeys('I'), ...leafKeys('V'), 'I0'].filter((k) => !targets.includes(k)));
      const added = [];
      for (const m of measured) {
        givens.add(m); added.push(m);
        if (solvable(givens)) break;
      }
      if (!solvable(givens)) return null;
      for (const m of r.shuffle(added)) {
        givens.delete(m);
        if (!solvable(givens)) givens.add(m);
      }
    }

    if (lv.compact && padded(c, givens, targets)) return null;
    const needed = neededSteps(plan(rels, givens).best, targets);
    if (needed.length < lv.steps[0] || needed.length > lv.steps[1]) return null;
    // A target that is just a given under another name (same current in series, ...) is too trivial.
    for (const t of targets) {
      let st = needed.find((x) => x.key === t);
      while (st && st.rel.kind === 'eq') {
        if (givens.has(st.from[0])) return null;
        st = needed.find((x) => x.key === st.from[0]);
      }
    }
    return { givens, targets, steps: needed };
  }

  // ---------------------------------------------------------------- naming and text
  const UNIT_TEX = { V: M`\mathrm{V}`, I: M`\mathrm{mA}`, R: M`\mathrm{k\Omega}` };
  const UNIT = { V: 'V', I: 'mA', R: 'kΩ' };

  function namer(c, targets) {
    const nodeOf = (key) => c.nodes[Number(key.slice(1))];
    const valueOf = (key) => nodeOf(key)[key[0]];
    const range = (node) => {
      const [a, b] = [node.leaves[0], node.leaves[node.leaves.length - 1]];
      return node.leaves.length <= 3 ? node.leaves.join('') : M`${a}\text{–}${b}`;
    };
    // Voltage is V in English and U in German, as in the textbooks; lang 'en' gives the English
    // symbol in any case (the names in the tutorial paths).
    const sym = (key, lang) => {
      const node = nodeOf(key), en = lang === 'en' || !de();
      const q = key[0] === 'V' && !en ? 'U' : key[0];
      if (node === c.root) return q === 'R' ? (en ? M`R_\text{tot}` : M`R_\text{ges}`) : q;
      return `${q}_{${node.t === 'R' ? node.idx : range(node)}}`;
    };
    const qtex = (key) => `${ftex(valueOf(key))}\\,${UNIT_TEX[key[0]]}`;
    const res = (key) => (targets.includes(key) ? `\\htmlClass{result}{${qtex(key)}}` : qtex(key));
    const who = (node) => {
      if (node === c.root) return L('the battery', 'die Batterie');
      if (node.t === 'R') return `$R_{${node.idx}}$`;
      return node.t === 'S' ? L(`the series combination $${sym('R' + node.id)}$`, `die Serieschaltung $${sym('R' + node.id)}$`)
        : L(`the parallel combination $${sym('R' + node.id)}$`, `die Parallelschaltung $${sym('R' + node.id)}$`);
    };
    return { nodeOf, valueOf, sym, qtex, res, who };
  }

  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  const al = (...lines) => M`$$\begin{aligned}` + lines.join(M` \\ `) + M`\end{aligned}$$`;
  const listing = (items) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} ${L('and', 'und')} ${items[items.length - 1]}`);

  function structure(c, nm) {
    const parts = [];
    (function walk(node) {
      if (node.t === 'R') return;
      node.kids.forEach(walk);
      const kids = listing(node.kids.map((k) => `$${nm.sym('R' + k.id)}$`));
      const name = node === c.root ? L(`the whole circuit, $${nm.sym('R0')}$`, `die ganze Schaltung, $${nm.sym('R0')}$`) : `$${nm.sym('R' + node.id)}$`;
      parts.push(node.t === 'S' ? L(`${kids} are in series (${name})`, `${kids} sind in Serie (${name})`) : L(`${kids} are in parallel (${name})`, `${kids} sind parallel (${name})`));
    })(c.root);
    return parts;
  }

  // The rules, as in “follows from …” (German: dative).
  const RULE = () => ({
    ohm: L("Ohm's law", 'dem ohmschen Gesetz'),
    eqI: L('the series rule (same current)', 'der Serieregel (gleicher Strom)'),
    eqV: L('the parallel rule (same voltage)', 'der Parallelregel (gleiche Spannung)'),
    vratio: L('the voltage divider rule (voltages in the ratio of the resistances)', 'der Spannungsteilerregel (Spannungen im Verhältnis der Widerstände)'),
    iratio: L('the current divider rule (currents in the inverse ratio of the resistances)', 'der Stromteilerregel (Ströme im umgekehrten Verhältnis der Widerstände)'),
    sumR: L('adding the series resistances', 'dem Addieren der Serienwiderstände'),
    invR: L('combining the parallel resistances', 'dem Zusammenfassen der Parallelwiderstände'),
    sumV: L('the voltage rule (voltages in series add up)', 'der Maschenregel (Spannungen in Serie addieren sich)'),
    sumI: L('the junction rule (currents in parallel add up)', 'der Knotenregel (Ströme parallel addieren sich)'),
    vdiv: L('the voltage divider rule (share of the total voltage)', 'der Spannungsteilerregel (Anteil an der Gesamtspannung)'),
  });
  const SHORT = () => ({
    ohm: L("Ohm's law", 'ohmsches Gesetz'), eqI: L('series', 'Serie'), eqV: L('parallel', 'parallel'),
    vratio: L('voltage divider', 'Spannungsteiler'), iratio: L('current divider', 'Stromteiler'), sumR: L('series resistances', 'Serienwiderstände'),
    invR: L('parallel resistances', 'Parallelwiderstände'), sumV: L('voltage rule', 'Maschenregel'), sumI: L('junction rule', 'Knotenregel'), vdiv: L('voltage divider', 'Spannungsteiler'),
  });
  const ruleOf = (rel) => rel.rule;

  // A solution step in parts: intro sentence, symbolic equation lhs = rhs, the same with numbers
  // (num) and the result. Equality steps are a single sentence (inline).
  function stepParts(step, nm) {
    const { key, rel } = step;
    const q = key[0], s = nm.sym, qt = nm.qtex;
    const out = { lhs: s(key), res: nm.res(key) };
    if (rel.kind === 'ohm') {
      const n = rel.node, V = 'V' + n.id, I = 'I' + n.id, R = 'R' + n.id;
      out.intro = n === nm.nodeOf('R0') ? L("Ohm's law for the whole circuit:", 'Ohmsches Gesetz für die ganze Schaltung:') : L(`Ohm's law for ${nm.who(n)}:`, `Ohmsches Gesetz für ${nm.who(n)}:`);
      if (q === 'V') return { ...out, rhs: M`${s(I)}\,${s(R)}`, num: M`${qt(I)}\times${qt(R)}` };
      if (q === 'I') return { ...out, rhs: M`\frac{${s(V)}}{${s(R)}}`, num: M`\frac{${qt(V)}}{${qt(R)}}` };
      return { ...out, rhs: M`\frac{${s(V)}}{${s(I)}}`, num: M`\frac{${qt(V)}}{${qt(I)}}` };
    }
    if (rel.kind === 'eq') {
      const other = step.from[0];
      const what = rel.q === 'I' ? L('carry the same current (series connection)', 'führen denselben Strom (Serieschaltung)')
        : L('are at the same voltage (parallel connection)', 'liegen an derselben Spannung (Parallelschaltung)');
      return { ...out, rhs: s(other), inline: `${cap(nm.who(rel.child))} ${L('and', 'und')} ${nm.who(rel.parent)} ${what}: $${s(key)} = ${s(other)} = ${nm.res(key)}$.` };
    }
    if (rel.kind === 'vdiv') {
      const Rk = 'R' + rel.child.id, Vp = 'V' + rel.parent.id, rs = rel.parent.kids.map((k) => 'R' + k.id);
      out.intro = L(`Voltage divider rule: ${listing(rs.map((r) => `$${s(r)}$`))} are in series, so they share $${s(Vp)}$ in the ratio of their resistances:`,
        `Spannungsteilerregel: ${listing(rs.map((r) => `$${s(r)}$`))} sind in Serie, teilen sich also $${s(Vp)}$ im Verhältnis ihrer Widerstände:`);
      return { ...out, rhs: M`\frac{${s(Rk)}}{${rs.map(s).join(' + ')}}\,${s(Vp)}`, num: M`\frac{${qt(Rk)}}{${rs.map(qt).join(' + ')}}\times ${qt(Vp)}`, split: true };
    }
    if (rel.kind === 'ratio') {
      const { a, b } = rel, Ra = 'R' + a.id, Rb = 'R' + b.id;
      const volt = rel.q === 'V';
      const x = [rel.q + a.id, rel.q + b.id], y = volt ? [Ra, Rb] : [Rb, Ra];
      out.intro = volt
        ? L(`Voltage divider rule: $${s(Ra)}$ and $${s(Rb)}$ are in series, so their voltages are in the ratio of their resistances, $${s(x[0])}/${s(x[1])} = ${s(Ra)}/${s(Rb)}$. Hence`,
          `Spannungsteilerregel: $${s(Ra)}$ und $${s(Rb)}$ sind in Serie, ihre Spannungen stehen also im Verhältnis ihrer Widerstände, $${s(x[0])}/${s(x[1])} = ${s(Ra)}/${s(Rb)}$. Somit`)
        : L(`Current divider rule: $${s(Ra)}$ and $${s(Rb)}$ are in parallel, so their currents are in the inverse ratio of their resistances, $${s(x[0])}/${s(x[1])} = ${s(Rb)}/${s(Ra)}$. Hence`,
          `Stromteilerregel: $${s(Ra)}$ und $${s(Rb)}$ sind parallel, ihre Ströme stehen also im umgekehrten Verhältnis ihrer Widerstände, $${s(x[0])}/${s(x[1])} = ${s(Rb)}/${s(Ra)}$. Somit`);
      // x0/x1 = y0/y1, solved for the unknown as num/den · mul
      const [n, d, m] = key === x[0] ? [y[0], y[1], x[1]] : key === x[1] ? [y[1], y[0], x[0]]
        : key === y[0] ? [x[0], x[1], y[1]] : [x[1], x[0], y[0]];
      return { ...out, rhs: M`\frac{${s(n)}}{${s(d)}}\,${s(m)}`, num: M`\frac{${qt(n)}}{${qt(d)}}\times ${qt(m)}` };
    }
    const P = rel.q + rel.parent.id;
    const kids = rel.parent.kids.map((k) => rel.q + k.id);
    const names = listing(rel.parent.kids.map((k) => `$${s('R' + k.id)}$`));
    if (rel.kind === 'inv') {
      if (key === P) {
        const f = (h) => M`\left(${kids.map((k) => M`\frac{1}{${h(k)}}`).join('+')}\right)^{-1}`;
        return { ...out, intro: L(`${names} are in parallel:`, `${names} sind parallel:`), rhs: f(s), num: f(qt), split: true };
      }
      const others = kids.filter((k) => k !== key);
      const f = (h) => M`\left(\frac{1}{${h(P)}} - ${others.map((k) => M`\frac{1}{${h(k)}}`).join(' - ')}\right)^{-1}`;
      return { ...out, intro: L(`The parallel resistances combine to $${s(P)}$, so`, `Die Parallelwiderstände ergeben zusammen $${s(P)}$, also`), rhs: f(s), num: f(qt), split: true };
    }
    // sums: series R, series V, parallel I
    out.intro = {
      R: key === P ? L(`${names} are in series:`, `${names} sind in Serie:`) : L(`The series resistances add up to $${s(P)}$, so`, `Die Serienwiderstände ergeben zusammen $${s(P)}$, also`),
      V: key === P ? L(`The voltages across ${names} add up (series connection):`, `Die Spannungen an ${names} addieren sich (Serieschaltung):`)
        : L(`The voltages in series add up to $${s(P)}$, so`, `Die Spannungen in Serie ergeben zusammen $${s(P)}$, also`),
      I: key === P ? L(`Junction rule: the currents through ${names} add up (parallel connection):`, `Knotenregel: Die Ströme durch ${names} addieren sich (Parallelschaltung):`)
        : L(`Junction rule: the branch currents add up to $${s(P)}$, so`, `Knotenregel: Die Zweigströme ergeben zusammen $${s(P)}$, also`),
    }[rel.q];
    const terms = key === P ? kids : [P, ...kids.filter((k) => k !== key)];
    const op = key === P ? ' + ' : ' - ';
    return { ...out, rhs: terms.map(s).join(op), num: terms.map(qt).join(op) };
  }

  function stepText(step, nm) {
    const p = stepParts(step, nm);
    if (p.inline) return p.inline;
    return p.intro + (p.split
      ? al(M`${p.lhs} &= ${p.rhs}`, M`&= ${p.num} = ${p.res}`)
      : al(M`${p.lhs} &= ${p.rhs} = ${p.num} = ${p.res}`));
  }

  // Hints, from general to specific, all derived from the worked solution.
  function makeHints(c, nm, prob, struct) {
    const { steps, targets, givens } = prob;
    const byKey = new Map(steps.map((st) => [st.key, st]));
    // Follow "same current / same voltage" steps back to where a quantity really comes from.
    const origin = (key) => {
      let st = byKey.get(key);
      while (st.rel.kind === 'eq' && byKey.has(st.from[0])) st = byKey.get(st.from[0]);
      return st;
    };
    const $ = (k) => `$${nm.sym(k)}$`;
    const formula = (st) => { const p = stepParts(st, nm); return `$\\displaystyle ${p.lhs} = ${p.rhs}$`; };
    const list = (items) => `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
    const hints = [`${L('Break the circuit down', 'Zerlege die Schaltung')}: ${struct.join('; ')}.`];

    const plan = targets.map((t) => {
      const st = origin(t);
      const via = byKey.get(t).rel.kind === 'eq' ? L(` (it equals ${$(st.key)})`, ` (gleich ${$(st.key)})`) : '';
      const all = st.from.every((k) => givens.has(k));
      return L(`${$(t)}${via} follows from ${RULE()[st.rel.rule]}, ${all ? 'directly from the given' : 'using'} ${listing(st.from.map($))}.`,
        `${$(t)}${via} folgt aus ${RULE()[st.rel.rule]}, ${all ? 'direkt aus den gegebenen Grössen' : 'mit'} ${listing(st.from.map($))}.`);
    });
    hints.push(`${L('Plan for each unknown', 'Plan für jede Unbekannte')}:${list(plan)}`);

    const real = steps.filter((st) => st.rel.kind !== 'eq');
    const first = real.slice(0, 3).map((st) => `${formula(st)} &nbsp;(${SHORT()[st.rel.rule]})`);
    hints.push(`${L('First steps', 'Erste Schritte')}:${list(first)}`);

    // Values of the intermediate quantities that the final steps rely on.
    const inputs = new Set(targets.flatMap((t) => origin(t).from));
    const key = real.filter((st) => !targets.includes(st.key) && !givens.has(st.key));
    const chosen = [...key.filter((st) => inputs.has(st.key)), ...key.filter((st) => !inputs.has(st.key))].slice(0, 3)
      .sort((a, b) => steps.indexOf(a) - steps.indexOf(b));
    if (chosen.length) hints.push(`${L('Check your intermediate results', 'Prüfe deine Zwischenresultate')}: ${listing(chosen.map((st) => `$${nm.sym(st.key)} = ${nm.qtex(st.key)}$`))}.`);
    return hints;
  }

  function describeTarget(key, nm) {
    const q = key[0], node = nm.nodeOf(key), s = nm.sym(key);
    // German: accusative (“Bestimme …”)
    if (node === nm.nodeOf('R0')) return q === 'V' ? L('the battery voltage $V$', 'die Batteriespannung $U$') : L('the battery current $I$', 'den Batteriestrom $I$');
    if (q === 'R') return L(`the resistance $${s}$`, `den Widerstand $${s}$`);
    if (q === 'I') return L(`the current $${s}$ through $R_{${node.idx}}$`, `den Strom $${s}$ durch $R_{${node.idx}}$`);
    return L(`the voltage $${s}$ across $R_{${node.idx}}$`, `die Spannung $${s}$ an $R_{${node.idx}}$`);
  }

  // ---------------------------------------------------------------- drawing
  const UNITS = (label) => Circuit.textWidth(label) / Circuit.S;

  // Labels of a node. known(key) tells whether a value is shown; unknown targets show their symbol.
  function labels(c, nm, prob, node, known) {
    const lab = (key) => {
      if (known(key)) return `${fmt(fval(nm.valueOf(key)))} ${UNIT[key[0]]}`;
      return prob.targets.includes(key) ? `$${nm.sym(key)}$` : null;
    };
    const rKey = 'R' + node.id;
    const r = known(rKey) ? `$${nm.sym(rKey)}$ = ${fmt(fval(node.R))} kΩ` : `$${nm.sym(rKey)}$ = ?`;
    return { r, i: lab('I' + node.id), v: lab('V' + node.id) };
  }
  const givenOnly = (prob) => (key) => prob.givens.has(key);
  const all = () => true;

  // Layout in the style of the textbook diagrams: parallel branches are vertical columns
  // between a top and a bottom rail, series parts inside a branch are stacked vertically.
  // Plain resistors before the first group run along the top wire, those after the last
  // group along the bottom wire. Layout y grows downwards; current flows top → bottom in
  // vertical blocks.
  const LEAF_H = 2.3, COL_GAP = 0.25;

  function labelWidths(node, c, nm, prob) {
    const w = (k) => Math.max(...[givenOnly(prob), all].map((known) => { const l = labels(c, nm, prob, node, known)[k]; return l ? UNITS(l) : 0; }));
    return { r: w('r'), i: w('i'), v: w('v') };
  }

  // Horizontal resistor on the top or bottom wire.
  function measureH(leaf, c, nm, prob) {
    const lw = labelWidths(leaf, c, nm, prob);
    // The current label sits beside the downstream lead and must clear the end of the voltage arc.
    leaf.hw = Math.max(3, lw.r + 0.9, lw.v + 0.8, (0.53 + lw.i / 2) / 0.32);
  }

  // Vertical block: terminals at the top and bottom of its attach column, ax from its left edge.
  // All vertical resistors get the same width so that columns of stacked groups line up.
  function measureV(node, col) {
    if (node.t === 'R') {
      node.vl = { ax: col.left, w: col.left + col.right, h: LEAF_H };
      return node.vl;
    }
    const kids = node.kids.map((k) => measureV(k, col));
    if (node.t === 'S') {
      const ax = Math.max(...kids.map((k) => k.ax));
      node.vl = { ax, w: Math.max(...kids.map((k) => ax - k.ax + k.w)), h: kids.reduce((sum, k) => sum + k.h, 0) };
    } else {
      node.cols = [];
      let x = 0;
      for (const k of kids) { node.cols.push(x); x += k.w + COL_GAP; }
      node.vl = { ax: kids[0].ax, w: x - COL_GAP, h: Math.max(...kids.map((k) => k.h)) };
    }
    return node.vl;
  }

  function layout(c, nm, prob) {
    let top = [], bottom = [], middle;
    if (c.root.t === 'P') {
      middle = c.root;
    } else {
      const kids = c.root.kids;
      const groups = kids.map((k, i) => (k.t === 'R' ? -1 : i)).filter((i) => i >= 0);
      if (!groups.length) {
        top = kids;
      } else {
        const a = groups[0], b = groups[groups.length - 1];
        top = kids.slice(0, a);
        bottom = kids.slice(b + 1);
        middle = a === b ? kids[a] : { t: 'S', kids: kids.slice(a, b + 1) };
      }
    }
    [...top, ...bottom].forEach((leaf) => measureH(leaf, c, nm, prob));
    if (middle) {
      const col = { left: 0, right: 0 };
      (function widest(node) {
        if (node.t !== 'R') return node.kids.forEach(widest);
        const lw = labelWidths(node, c, nm, prob);
        col.left = Math.max(col.left, 0.85 + lw.v);
        col.right = Math.max(col.right, 0.4 + Math.max(lw.r, lw.i));
      })(middle);
      measureV(middle, col);
    }
    const topW = top.reduce((sum, l) => sum + l.hw, 0), bottomW = bottom.reduce((sum, l) => sum + l.hw, 0);
    // Bottom-wire resistors start left of the column's labels, and leave room for the battery wire.
    const place = (x0) => {
      const col = x0 + topW + (middle ? 0.3 + middle.vl.ax : 0.6);
      return { x0, col, bottomStart: middle ? col - middle.vl.ax - 0.2 : col };
    };
    let g = place(1.8);
    if (g.bottomStart - bottomW < 1.2) g = place(1.8 + 1.2 - (g.bottomStart - bottomW));
    const bottomY = Math.max(middle ? middle.vl.h : 0, 2.6, top.length && bottom.length ? 2.9 : 0);
    // A parallel group on the right side reaches down to the bottom wire.
    if (middle && middle.t === 'P') middle.vl.h = bottomY;
    const width = g.col + (middle ? middle.vl.w - middle.vl.ax : 0);
    return { top, bottom, middle, ...g, bottomY, width };
  }

  function drawV(s, node, x, y, lab) {
    const g = node.vl;
    lab.at.set(node.id, [[x, -y], [x + g.w, -(y + g.h)]]);
    if (node.t === 'R') {
      const cx = x + g.ax, p = [cx, -y], q = [cx, -(y + g.h)];
      const L = lab(node);
      s.res(p, q, { l: L.r, ls: 'right', hl: L.hl });
      s.cur(p, q, L.i, 'right', 0.87);
      s.vol(p, q, L.v, 'left');
      return;
    }
    if (node.t === 'S') {
      let cy = y;
      for (const k of node.kids) { drawV(s, k, x + g.ax - k.vl.ax, cy, lab); cy += k.vl.h; }
      return;
    }
    const colX = (i) => x + node.cols[i] + node.kids[i].vl.ax;
    const last = node.kids.length - 1, bot = y + g.h;
    s.wire([colX(0), -y], [colX(last), -y]).wire([colX(0), -bot], [colX(last), -bot]);
    node.kids.forEach((k, i) => {
      drawV(s, k, x + node.cols[i], y, lab);
      if (k.vl.h < g.h) s.wire([colX(i), -(y + k.vl.h)], [colX(i), -bot]);
    });
  }

  // The diagram as a Sketch. view.known(key): values shown. For the tutorial also
  // view.mark: node id → 'strong' | 'light' (resistors highlighted, groups in a shaded zone) and
  // view.focus: key → 'new' | 'use' (labels highlighted).
  function draw(c, nm, prob, view) {
    const s = new Circuit.Sketch();
    s.autoDots = true;
    const L = c.layout, mark = view.mark || new Map(), focus = view.focus || new Map();
    const at = new Map(); // node id → corners of the area of its resistors and labels
    const lab = (node, p, q) => {
      if (p) at.set(node.id, [p, q]);
      const t = labels(c, nm, prob, node, view.known);
      const f = (q, l) => (l != null && focus.has(q + node.id) ? { t: l, cls: focus.get(q + node.id) } : l);
      return { r: f('R', t.r), i: f('I', t.i), v: f('V', t.v), hl: mark.has(node.id) };
    };
    lab.at = at;
    const bl = lab(c.root);
    s.wire([0, 0], [L.x0, 0]).cur([0, 0], [L.x0, 0], bl.i, 'above');
    let x = L.x0;
    for (const leaf of L.top) {
      const p = [x, 0], q = [x + leaf.hw, 0], t = lab(leaf, [x, 0.5], [x + leaf.hw, -0.5]);
      s.res(p, q, { l: t.r, hl: t.hl }).cur(p, q, t.i, 'below', 1 - 0.45 / leaf.hw).vol(p, q, t.v, 'below', [0.28, 0.68]);
      x += leaf.hw;
    }
    s.wire([x, 0], [L.col, 0]);
    if (L.middle) {
      drawV(s, L.middle, L.col - L.middle.vl.ax, 0, lab);
      if (L.middle.vl.h < L.bottomY) s.wire([L.col, -L.middle.vl.h], [L.col, -L.bottomY]);
    } else {
      s.wire([L.col, 0], [L.col, -L.bottomY]);
    }
    s.wire([L.col, -L.bottomY], [L.bottomStart, -L.bottomY]);
    x = L.bottomStart;
    for (const leaf of L.bottom) {
      const p = [x, -L.bottomY], q = [x - leaf.hw, -L.bottomY], t = lab(leaf, [x, 0.5 - L.bottomY], [x - leaf.hw, -0.5 - L.bottomY]);
      s.res(p, q, { l: t.r, ls: 'below', hl: t.hl }).cur(p, q, t.i, 'above', 1 - 0.45 / leaf.hw).vol(p, q, t.v, 'above', [0.28, 0.68]);
      x -= leaf.hw;
    }
    s.wire([x, -L.bottomY], [0, -L.bottomY]);
    s.bat([0, -L.bottomY], [0, 0]).vol([0, 0], [0, -L.bottomY], bl.v, 'left');
    zones(s, c, nm, view, at, [[0, 0], [L.width, -L.bottomY]]);
    return s;
  }

  // Shaded zones around the marked groups and the groups whose quantities are in focus, each
  // captioned with its resistance and the focused quantities. The zone of the whole circuit
  // spans the corners in whole, battery included; its voltage and current are labelled there.
  function zones(s, c, nm, view, at, whole) {
    const mark = view.mark || new Map(), focus = view.focus || new Map();
    const shown = new Map([...mark].filter(([id]) => c.nodes[id].t !== 'R'));
    for (const k of focus.keys()) {
      const n = nm.nodeOf(k);
      if (n.t !== 'R' && (n !== c.root || k[0] === 'R') && !shown.has(n.id)) shown.set(n.id, 'light');
    }
    const sym = (k) => nm.sym(k).replace('_\\text{tot}', '_{tot}');
    const caption = (n) => ['R' + n.id, ...(n === c.root ? [] : ['V' + n.id, 'I' + n.id].filter((k) => focus.has(k)))].map((k) => {
      const v = nm.valueOf(k), num = v.d === 1 || 100 % v.d === 0 ? fmt(fval(v)) : `${v.n}/${v.d}`; // as in the text (ftex)
      const t = view.known(k) ? `$${sym(k)}$ = ${num} ${UNIT[k[0]]}` : `$${sym(k)}$${focus.has(k) ? ' = ?' : ''}`;
      return focus.has(k) ? { t, cls: focus.get(k) } : t;
    });
    // Smaller zones first: each zone goes behind everything drawn so far.
    const nodes = [...shown.keys()].map((id) => c.nodes[id]).sort((a, b) => a.leaves.length - b.leaves.length);
    for (const n of nodes) {
      const pts = n.leaves.flatMap((idx) => at.get(c.leaves[idx - 1].id)).concat(at.get(n.id) || [], n === c.root ? whole : []);
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), m = 0.3 * depth(n) - 0.15; // nested zones: room for captions
      s.zone([Math.min(...xs) - m, Math.min(...ys) - m], [Math.max(...xs) + m, Math.max(...ys) + m], shown.get(n.id), caption(n));
    }
  }

  // ---------------------------------------------------------------- exercise assembly
  // level: easy, medium, hard, or mixed (one of them at random).
  function build(level, seed) {
    const r = rng(seed);
    const lv = LEVELS[level === 'mixed' ? r.pick(['easy', 'medium', 'hard']) : level];
    for (let attempt = 0; attempt < 5000; attempt++) {
      const n = r.int(lv.n[0], lv.n[1]);
      const tree = arrangeRoot(buildTree(n, null, r));
      if (depth(tree) < lv.depth) continue;
      const c = { root: tree, ...index(tree) };
      if (!assignValues(c, lv, r)) continue;
      const prob = chooseProblem(c, lv, r);
      if (!prob) continue;
      const nm = namer(c, prob.targets);
      c.layout = layout(c, nm, prob);
      if (c.layout.width > MAX_WIDTH) continue;
      return { c, prob, nm, lv };
    }
    throw new Error(`No ${level} exercise found for seed ${seed}`);
  }

  const taskText = (targets, nm) => L(`Applying the rules for series and parallel circuits, find ${listing(targets.map((t) => describeTarget(t, nm)))} in the circuit below.`,
    `Bestimme mit den Regeln für Serie- und Parallelschaltungen ${listing(targets.map((t) => describeTarget(t, nm)))} in der Schaltung unten.`);

  function generate(level, seed) {
    const { c, prob, nm, lv } = build(level, seed);
    const { targets, steps } = prob;
    const struct = structure(c, nm);
    const hints = makeHints(c, nm, prob, struct);
    return {
      id: `${level}-${seed}`,
      level,
      // 1–5 by the number of solution steps
      difficulty: steps.length <= 2 ? 1 : steps.length <= 4 ? 2 : steps.length <= 7 ? 3 : steps.length <= 11 ? 4 : 5,
      title: L(`Circuit with ${c.leaves.length} resistors`, `Schaltung mit ${c.leaves.length} Widerständen`),
      text: taskText(targets, nm),
      fields: targets.map((t) => ({ key: t, sym: nm.sym(t), unit: UNIT[t[0]], value: fval(nm.valueOf(t)) })),
      tol: 0.01,
      figure: (sol) => `<div class="fig">${draw(c, nm, prob, { known: sol ? all : givenOnly(prob) }).toSVG()}</div>`,
      hints,
      solution: [`${L('Structure of the circuit', 'Aufbau der Schaltung')}: ${struct.join('; ')}.`, ...steps.map((st) => stepText(st, nm))],
      results: targets.map((t) => `$${nm.sym(t)} = ${nm.qtex(t)}$`).join(', '),
      // for tests
      circuit: c, givens: prob.givens, targets, steps,
    };
  }

  // ---------------------------------------------------------------- tutorial
  // A worked example as frames { text, figure }: the task, the structure of the circuit group
  // by group (innermost first), each solution step, and the results. In each frame the
  // diagram shows what is known so far and marks what the text talks about: the parts being
  // combined are highlighted strongly, the group they belong to lightly; the value just found
  // is highlighted (new) and the values it is found from are set in bold (use).
  const TITLE = () => ({
    ohm: L("Ohm's law", 'ohmsches Gesetz'), eqI: L('same current in series', 'gleicher Strom in Serie'), eqV: L('same voltage in parallel', 'gleiche Spannung parallel'),
    vratio: L('voltage divider rule', 'Spannungsteilerregel'), vdiv: L('voltage divider rule', 'Spannungsteilerregel'), iratio: L('current divider rule', 'Stromteilerregel'),
    sumR: L('series resistances', 'Serienwiderstände'), invR: L('parallel resistances', 'Parallelwiderstände'), sumV: L('voltage rule', 'Maschenregel'), sumI: L('junction rule', 'Knotenregel'),
  });

  // Voltage divider rule between a part of a series group and the whole group,
  // V_k = R_k / (R_a + R_b + …) · V. Only the tutorial uses it: exercises divide pairwise.
  function dividers(c) {
    const out = [];
    for (const node of c.nodes.filter((n) => n.t === 'S')) {
      const rs = node.kids.map((k) => 'R' + k.id), V = 'V' + node.id;
      for (const k of node.kids) {
        out.push({ kind: 'vdiv', rule: 'vdiv', parent: node, child: k, keys: ['V' + k.id, V, ...rs], out: ['V' + k.id],
          holds: (g) => near(g('V' + k.id) * rs.reduce((sum, r) => sum + g(r), 0), g('R' + k.id) * g(V)) });
      }
    }
    return out;
  }

  // Solution steps along a given path: a list of frames, each a list of "name:rule" (V1:vdiv,
  // I:eqI, R23:invR, …; names as in the diagram without "_", {} or \text). Every step must
  // follow from what is known by then, and the path must reach all unknowns.
  function pathSteps(c, nm, prob, path, tag) {
    const rels = [...relations(c), ...dividers(c)];
    const byName = new Map();
    for (const node of c.nodes) {
      for (const q of 'RIV') byName.set(nm.sym(q + node.id, 'en').replace(/\\text\{([^}]*)\}/g, '$1').replace(/[_{}]/g, ''), q + node.id);
    }
    const known = new Set(prob.givens);
    const out = path.map((items) => items.map((item) => {
      const [name, rule] = item.split(':'), key = byName.get(name);
      if (!key) throw new Error(`${tag}: no quantity ${name}`);
      if (known.has(key)) throw new Error(`${tag}: ${name} is already known`);
      const rel = rels.find((r) => r.rule === rule && r.out.includes(key) && r.keys.every((k) => k === key || known.has(k)));
      if (!rel) throw new Error(`${tag}: ${name} does not follow by ${rule}`);
      known.add(key);
      return { key, rel, from: rel.keys.filter((k) => k !== key) };
    }));
    const missing = prob.targets.filter((t) => !known.has(t));
    if (missing.length) throw new Error(`${tag}: the path does not reach ${missing.join(', ')}`);
    return out;
  }

  const SERIES = () => L('<b>In series</b> the same current flows through every part, and the voltages across the parts add up to the voltage across the whole.',
    '<b>In Serie</b> fliesst durch jeden Teil derselbe Strom, und die Spannungen an den Teilen addieren sich zur Spannung am Ganzen.');
  const PARALLEL = () => L('<b>In parallel</b> every branch is at the same voltage, and the branch currents add up to the current into the whole.',
    '<b>Parallel</b> liegt jeder Zweig an derselben Spannung, und die Zweigströme addieren sich zum Strom ins Ganze.');

  // path: the solution steps to show, grouped into frames (see pathSteps); by default the
  // steps of the worked solution, one per frame.
  function tutorial(level, seed, path) {
    const { c, prob, nm } = build(level, seed);
    const { givens, targets } = prob;
    const groups = path ? pathSteps(c, nm, prob, path, `tutorial ${level}-${seed}`) : prob.steps.map((st) => [st]);
    const $ = (k) => `$${nm.sym(k)}$`;
    const frames = [];
    const frame = (text, known, mark = new Map(), focus = new Map()) => {
      const set = new Set(known);
      frames.push({ text, sketch: draw(c, nm, prob, { known: (k) => set.has(k), mark, focus }) });
    };

    const given = [...givens].sort(byReading).map((k) => `$${nm.sym(k)} = ${nm.qtex(k)}$`);
    frame(`<p>${taskText(targets, nm)}</p><p>${L('Given', 'Gegeben')}: ${listing(given)}.</p>`, givens);

    const explained = new Set();
    (function walk(node) {
      if (node.t === 'R') return;
      node.kids.forEach(walk);
      const mark = new Map([[node.id, 'light'], ...node.kids.map((k) => [k.id, 'strong'])]);
      const kids = listing(node.kids.map((k) => $('R' + k.id)));
      let t = node.t === 'S' ? L(`${kids} are connected in series: `, `${kids} sind in Serie geschaltet: `) : L(`${kids} are connected in parallel: `, `${kids} sind parallel geschaltet: `);
      t += node === c.root ? L(`together they make up the whole circuit, with the total resistance ${$('R0')}.`, `Zusammen bilden sie die ganze Schaltung mit dem Gesamtwiderstand ${$('R0')}.`)
        : L(`together they act like a single resistor ${$('R' + node.id)}.`, `Zusammen wirken sie wie ein einzelner Widerstand ${$('R' + node.id)}.`);
      if (!explained.has(node.t)) t += ' ' + (node.t === 'S' ? SERIES() : PARALLEL());
      explained.add(node.t);
      frame(`<p class="step-rule">${L('Structure of the circuit', 'Aufbau der Schaltung')}</p><p>${t}</p>`, givens, mark);
    })(c.root);

    const known = new Set(givens);
    groups.forEach((group, i) => {
      const mark = new Map(), focus = new Map();
      const put = (n, m) => { if (mark.get(n.id) !== 'strong') mark.set(n.id, m); };
      for (const { key, rel, from } of group) {
        known.add(key);
        if (rel.kind === 'ohm') put(rel.node, 'strong');
        else put(rel.parent, 'light');
        if (rel.kind === 'eq') put(rel.child, 'strong');
        if (rel.kind === 'ratio') [rel.a, rel.b].forEach((n) => put(n, 'strong'));
        if (rel.kind === 'sum' || rel.kind === 'inv' || rel.kind === 'vdiv') rel.parent.kids.forEach((n) => put(n, 'strong'));
        from.forEach((k) => { if (!focus.has(k)) focus.set(k, 'use'); });
        focus.set(key, 'new');
      }
      const title = cap(listing([...new Set(group.map((st) => TITLE()[st.rel.rule]))]));
      const goal = group.some((st) => targets.includes(st.key)) ? L(' · finds one of the unknowns', ' · liefert eine der Unbekannten') : '';
      const text = group.map((st) => `<p>${stepText(st, nm)}</p>`).join('');
      frame(`<p class="step-rule">${L(`Step ${i + 1} of ${groups.length}`, `Schritt ${i + 1} von ${groups.length}`)}: ${title}${goal}</p>${text}`, known, mark, focus);
    });

    frame(`<p class="step-rule">${L('Results', 'Resultate')}</p><p>${listing(targets.map((t) => `$${nm.sym(t)} = ${nm.res(t)}$`))}</p>`,
      known, new Map(), new Map(targets.map((t) => [t, 'new'])));

    // One viewBox for all frames, so that the diagram does not jump while stepping through.
    const box = frames.reduce((b, f) => {
      const x = f.sketch.box;
      return [Math.min(b[0], x[0]), Math.min(b[1], x[1]), Math.max(b[2], x[2]), Math.max(b[3], x[3])];
    }, [Infinity, Infinity, -Infinity, -Infinity]);
    return {
      id: `${level}-${seed}`,
      frames: frames.map((f) => ({ text: f.text, figure: `<div class="fig">${f.sketch.toSVG('circuit', box)}</div>` })),
      // for tests
      circuit: c, givens, targets, steps: groups.flat(),
    };
  }

  const api = { LEVELS, generate, tutorial, padded, F, fval, fmt, ftex };
  root.Generator = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
