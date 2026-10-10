// Random bulb-brightness exercises. A circuit is a row of batteries and a load, connected in a
// loop. Both are trees: leaves are cells ('B', dir = +1 or −1 for a reversed cell), bulbs ('L')
// or plain wires ('W'); inner nodes are series ('S') or parallel ('P') groups.
//
// All cells are ideal and identical (voltage V0). All bulbs are identical, but not ohmic: their
// resistance changes with the current. So bulb voltages are not worked out with resistances,
// only with rules that hold for any bulb whose current increases with its voltage:
//   voltage divider: identical parts in series share the voltage equally; otherwise the part
//     that lets less current through (at the same voltage) takes the larger share,
//   current divider: identical branches in parallel share the current equally,
//   parallel parts have the same voltage, and a part bridged by a wire has none.
// Every bulb voltage gets lower and upper bounds (in units of V0) from these rules, and only
// circuits where the bounds decide every bulb (brighter, equally bright, less bright than one
// bulb on one battery, or off) are used. Which of two parts lets more current through (at the same voltage) is
// decided by comparing them for bulbs with very different characteristics I ∝ V^p.
//
// diagnose() compares a student's answers with what typical misconceptions predict: current
// used up along a chain, the battery as a source of fixed current, a short-circuited bulb
// still lighting, a reversed battery ignored.
(function (root) {
  'use strict';

  const ANSWERS = ['brighter', 'equal', 'dimmer', 'off'];
  // Batteries in series; R2, R3 and R4 have one reversed cell.
  const PACKS = {
    1: { t: 'B', dir: 1 },
    S2: { t: 'S', kids: [{ t: 'B', dir: 1 }, { t: 'B', dir: 1 }] },
    S3: { t: 'S', kids: [{ t: 'B', dir: 1 }, { t: 'B', dir: 1 }, { t: 'B', dir: 1 }] },
    R2: { t: 'S', kids: [{ t: 'B', dir: 1 }, { t: 'B', dir: -1 }] },
    S4: { t: 'S', kids: [{ t: 'B', dir: 1 }, { t: 'B', dir: 1 }, { t: 'B', dir: 1 }, { t: 'B', dir: 1 }] },
    R3: { t: 'S', kids: [{ t: 'B', dir: 1 }, { t: 'B', dir: 1 }, { t: 'B', dir: -1 }] },
    R4: { t: 'S', kids: [{ t: 'B', dir: 1 }, { t: 'B', dir: 1 }, { t: 'B', dir: 1 }, { t: 'B', dir: -1 }] },
  };
  // easy: only bulbs in series or only bulbs in parallel (flat). medium: four bulbs only without
  // a wire and without a group inside a group inside a group (plain4); now and then every bulb
  // gets the same answer (sameOk), as long as the fixed-current model gets one wrong.
  const LEVELS = {
    easy: { name: 'Easy', bulbs: [2, 4], flat: true, packs: ['1', '1', 'S2', 'S2', 'S3', 'S4'], shorts: 0 },
    medium: { name: 'Medium', bulbs: [2, 4], plain4: true, sameOk: 0.4, packs: ['1', '1', 'S2', 'S2', 'S3', 'R3', 'R4'], shorts: 0.3 },
    hard: { name: 'Hard', bulbs: [3, 4], packs: ['1', '1', 'S2', 'S2', 'S2', 'S3', 'S3', 'R3', 'R3', 'R2'], shorts: 0.3 },
  };
  const PS = [0.3, 0.5, 0.7, 1, 1.5, 2, 3]; // bulb characteristics I ∝ V^p used to compare parts

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
    return { next, int, pick: (arr) => arr[Math.floor(next() * arr.length)] };
  }

  // ---------------------------------------------------------------- exact fractions
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  function F(n, d = 1) {
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d) || 1;
    return { n: n / g + 0, d: d / g };
  }
  const add = (a, b) => F(a.n * b.d + b.n * a.d, a.d * b.d);
  const mul = (a, b) => F(a.n * b.n, a.d * b.d);
  const cmp = (a, b) => Math.sign(a.n * b.d - b.n * a.d);
  const ZERO = F(0), ONE = F(1);
  const isZero = (a) => a.n === 0;
  const ftext = (f) => (f.d === 1 ? String(f.n) : `${f.n}/${f.d}`);

  // ---------------------------------------------------------------- intervals
  // Bounds lo … hi; loS / hiS: the bound itself is excluded.
  const exactly = (x) => ({ lo: x, hi: x, loS: false, hiS: false });
  const isExact = (iv) => cmp(iv.lo, iv.hi) === 0 && !iv.loS && !iv.hiS;
  const scale = (iv, s) => (isExact(iv) && isZero(iv.lo) ? iv // nothing to share
    : { lo: mul(iv.lo, s.lo), hi: mul(iv.hi, s.hi), loS: iv.loS || s.loS, hiS: iv.hiS || s.hiS });
  const same = (a, b) => cmp(a.lo, b.lo) === 0 && cmp(a.hi, b.hi) === 0 && a.loS === b.loS && a.hiS === b.hiS;

  // Compared with 1 (one battery's voltage, or the reference current): an answer, or null if
  // the bounds do not decide it.
  function answerFor(iv) {
    if (isExact(iv)) return isZero(iv.lo) ? 'off' : ['dimmer', 'equal', 'brighter'][cmp(iv.lo, ONE) + 1];
    if (cmp(iv.hi, ONE) < 0 || (cmp(iv.hi, ONE) === 0 && iv.hiS)) return isZero(iv.lo) && !iv.loS ? null : 'dimmer';
    if (cmp(iv.lo, ONE) > 0 || (cmp(iv.lo, ONE) === 0 && iv.loS)) return 'brighter';
    return null;
  }

  // ---------------------------------------------------------------- circuit parts
  const clone = (x) => JSON.parse(JSON.stringify(x));

  // Series and parallel groups alternate, as in a circuit drawn from rules.
  function buildLoad(n, parentT, r) {
    if (n === 1) return { t: 'L' };
    const t = parentT === 'S' ? 'P' : parentT === 'P' ? 'S' : r.pick(['S', 'P']);
    const k = r.int(2, Math.min(n, 3));
    const parts = new Array(k).fill(1);
    for (let i = k; i < n; i++) parts[r.int(0, k - 1)]++;
    return { t, kids: parts.map((m) => buildLoad(m, t, r)) };
  }

  // Bridge a bulb or a group (not the whole load) with a wire.
  function addShort(load, r) {
    const spots = [];
    (function walk(node, parent, i) {
      if (parent) spots.push([parent, i]);
      if (node.kids) node.kids.forEach((k, j) => walk(k, node, j));
    })(load, null, 0);
    const [parent, i] = r.pick(spots);
    parent.kids[i] = { t: 'P', kids: [parent.kids[i], { t: 'W' }] };
  }

  // In the whole load, bulbs in series with the groups go half on the top wire (before the
  // groups) and half on the bottom wire (after them); order in series does not matter.
  function arrange(load) {
    if (load.t !== 'S') return;
    const leaves = load.kids.filter((k) => k.t === 'L'), groups = load.kids.filter((k) => k.t !== 'L');
    const top = Math.ceil(leaves.length / 2);
    load.kids = [...leaves.slice(0, top), ...groups, ...leaves.slice(top)];
  }

  // Bulbs are numbered in reading order.
  function number(load) {
    let n = 0;
    (function walk(node) { if (node.t === 'L') node.i = n++; if (node.kids) node.kids.forEach(walk); })(load);
    return n;
  }

  function emf(pack, forward) {
    if (pack.t === 'B') return F(forward ? 1 : pack.dir);
    return pack.kids.map((k) => emf(k, forward)).reduce(add);
  }

  // A part with no voltage across it: a wire, or a group bridged by one.
  const shorted = (node) => node.t === 'W' || (node.t === 'P' ? node.kids.some(shorted) : node.t === 'S' && node.kids.every(shorted));
  // Same structure (order within a group does not matter).
  const canon = (node) => (node.kids ? `${node.t}(${node.kids.map(canon).sort().join(',')})` : node.t);
  const bulbsIn = (node) => (node.t === 'L' ? [node] : node.kids ? node.kids.flatMap(bulbsIn) : []);

  // Current at unit voltage for bulbs with I = V^p (any such network has I = K·V^p).
  // A part bridged by a wire lets any current through.
  function conductance(node, p) {
    if (shorted(node)) return Infinity;
    if (node.t === 'L') return 1;
    const ks = node.kids.map((k) => conductance(k, p));
    return node.t === 'P' ? ks.reduce((s, k) => s + k, 0) : Math.pow(ks.reduce((s, k) => s + Math.pow(k, -1 / p), 0), -p);
  }
  // −1: a lets less current through than b for every characteristic; +1: more; 0: identical;
  // null: it depends on the characteristic.
  function compare(a, b) {
    if (canon(a) === canon(b)) return 0;
    const d = PS.map((p) => conductance(a, p) - conductance(b, p));
    if (d.every((x) => x < -1e-9)) return -1;
    if (d.every((x) => x > 1e-9)) return 1;
    return null;
  }

  // Share of a group's voltage (series) or current (parallel) that the kid c gets, from the
  // divider rules. `less` = −1: c's share is the larger one if c lets less current through
  // (voltage divider); +1: if c lets more through (current divider). Returns the share and why.
  function share(kids, c, less) {
    const m = kids.length, iso = kids.filter((k) => canon(k) === canon(c)).length;
    const rel = kids.filter((k) => canon(k) !== canon(c)).map((k) => compare(c, k));
    if (!rel.length) return { s: exactly(F(1, m)), why: 'equal' };
    if (rel.every((x) => x === less)) return { s: { lo: F(1, m), hi: F(1, iso), loS: true, hiS: true }, why: 'larger' };
    if (rel.every((x) => x === -less)) return { s: { lo: ZERO, hi: F(1, m), loS: true, hiS: true }, why: 'smaller' };
    return { s: { lo: ZERO, hi: F(1, iso), loS: true, hiS: true }, why: 'some' };
  }

  // Voltage bounds for every bulb, with the reasoning steps that lead there. With `record`,
  // every part of the load keeps its bounds too (node.iv).
  function voltages(load, E, record) {
    const out = [];
    (function walk(node, iv, steps) {
      if (record) node.iv = iv;
      if (node.t === 'L') { out[node.i] = { iv, steps }; return; }
      if (node.t === 'W') return;
      if (node.t === 'P') {
        const wire = node.kids.some(shorted);
        for (const k of node.kids) {
          const step = wire ? { kind: 'bridged', part: k, group: node } : { kind: 'parallel', part: k, group: node };
          walk(k, wire ? exactly(ZERO) : iv, [...steps, step]);
        }
        return;
      }
      const live = node.kids.filter((k) => !shorted(k));
      for (const k of node.kids) {
        if (shorted(k)) { walk(k, exactly(ZERO), steps); continue; }
        const { s, why } = share(live, k, -1);
        walk(k, scale(iv, s), [...steps, { kind: 'series', part: k, group: node, others: live.filter((x) => x !== k), why, n: live.length }]);
      }
    })(load, isZero(E) ? exactly(ZERO) : exactly(E), []);
    return out;
  }

  // “Fixed current” model: the batteries always drive the reference current times their
  // voltage, passed on unchanged in series and split by the current divider in parallel.
  function fixedCurrents(load, E) {
    const out = [];
    (function walk(node, iv) {
      if (node.t === 'L') { out[node.i] = iv; return; }
      if (node.t === 'W') return;
      if (node.t === 'S') { node.kids.forEach((k) => walk(k, iv)); return; }
      const wire = node.kids.some(shorted);
      for (const k of node.kids) walk(k, wire ? exactly(ZERO) : scale(iv, share(node.kids, k, 1).s));
    })(load, exactly(E));
    return out;
  }

  // The exercise for the batteries packKey and a load (a tree as built by buildLoad; it gets
  // arranged and numbered), or null if some bulb depends on the bulbs' characteristic.
  function make(packKey, load, id, level) {
    const pack = PACKS[packKey];
    arrange(load);
    number(load);
    const E = emf(pack);
    const V = voltages(load, E, true);
    const answers = V.map((v) => answerFor(v.iv));
    if (answers.includes(null)) return null;
    const models = {
      forward: voltages(load, emf(pack, true)).map((v) => answerFor(v.iv)),
      fixedCurrent: fixedCurrents(load, E).map(answerFor),
    };
    const bulbs = V.map((v, i) => ({
      name: `L${i + 1}`,
      iv: v.iv,
      steps: v.steps,
      answer: answers[i],
      shorted: answers[i] === 'off' && !isZero(E),
      models: { forward: models.forward[i], fixedCurrent: models.fixedCurrent[i] },
    }));
    const reversed = packKey.startsWith('R');
    return { id, level, packKey, pack: clone(pack), load, bulbs, E, reversed, difficulty: difficulty(load, bulbs, reversed) };
  }

  // Difficulty from 1 to 5: two bulbs 1, three 2, four 3; one more for a bulb bridged by a wire,
  // a reversed battery, and groups inside groups inside groups.
  const depth = (node) => (node.kids ? 1 + Math.max(...node.kids.map(depth)) : 0);
  function difficulty(load, bulbs, reversed) {
    const d = (bulbs.length - 1) + (bulbs.some((b) => b.shorted) ? 1 : 0) + (reversed ? 1 : 0) + (depth(load) >= 3 ? 1 : 0);
    return Math.max(1, Math.min(5, d));
  }

  // level: easy, medium, hard, or mixed (one of them at random).
  function generate(level, seed) {
    const r = rng(seed);
    const lv = LEVELS[level === 'mixed' ? r.pick(['easy', 'medium', 'hard']) : level];
    // The batteries are chosen once, so that retries do not favour easily decided ones.
    const packKey = r.pick(lv.packs);
    for (;;) {
      const n = r.int(lv.bulbs[0], lv.bulbs[1]);
      const load = lv.flat ? { t: r.pick(['S', 'P']), kids: Array.from({ length: n }, () => ({ t: 'L' })) } : buildLoad(n, null, r);
      if (lv.plain4 && n === 4 && depth(load) > 2) continue;
      if (r.next() < lv.shorts && !(lv.plain4 && n === 4)) addShort(load, r);
      if (shorted(load)) continue; // the batteries would be short-circuited
      const ex = make(packKey, load, `${level}-${seed}`, level);
      if (!ex) continue;
      // Beyond the easy level: not every bulb gets the same answer (unless no current flows; at
      // the medium level, such a circuit is kept with the probability sameOk), and the
      // fixed-current model predicts something wrong for at least one bulb.
      if (lv !== LEVELS.easy && !isZero(ex.E)) {
        if (new Set(ex.bulbs.map((b) => b.answer)).size < 2 && !(lv.sameOk && r.next() < lv.sameOk)) continue;
        if (ex.bulbs.every((b) => b.models.fixedCurrent === b.answer)) continue;
      }
      return ex;
    }
  }

  // Why a student may have given `answers` (one per bulb): 'right' or a misconception.
  function diagnose(ex, answers) {
    return ex.bulbs.map((b, i) => {
      const a = answers[i];
      if (a === b.answer) return 'right';
      if (b.shorted && a !== 'off') return 'short';
      if (ex.reversed && a === b.models.forward) return 'reversed';
      if (a === b.models.fixedCurrent) return 'fixedCurrent';
      if (ex.bulbs.some((c, j) => j !== i && isExact(c.iv) && same(c.iv, b.iv) && answers[j] === c.answer)) return 'same';
      if (ex.bulbs.some((c, j) => j !== i && sameSpot(ex, b, c) && answers[j] === c.answer)) return 'same';
      return 'other';
    });
  }

  // Two bulbs in identical positions: swapping them leaves the circuit unchanged, so they are
  // equally bright (e.g. two identical branches, or identical bulbs in one chain).
  function sameSpot(ex, b, c) {
    return b.steps.length === c.steps.length && same(b.iv, c.iv) &&
      b.steps.every((s, k) => s.group === c.steps[k].group && canon(s.part) === canon(c.steps[k].part));
  }

  const api = { LEVELS, ANSWERS, PS, generate, make, diagnose, sameSpot, bulbsIn, canon, compare, ftext, cmp, isExact, isZero, ONE };
  root.Bulbs = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
