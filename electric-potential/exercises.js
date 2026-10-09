// The exercises of Electric Potential, with their texts, in the current language. The form is that
// of Electric Field (exercises.js there), with the physics and drawings of /electric-field/charges.js
// and the helpers of /electric-field/elec.js.
// The types:
//   points-v, which-way          potentials at points: voltage, energy, work; which way a charge moves
//   uniform-d, v2e, e2v          the uniform field: ΔV = E·d along the field lines; V(x) ↔ E(x)
//   equi-pick, lines-equi        equipotentials of an arrangement; field lines from equipotentials
//   point-v, scalar              the potential of point charges in units of V₀ (a sum of numbers, not of vectors)
//   accel, accel-compare, stop, ev   acceleration voltage, speeds and energies, electronvolt, relativity
//   closest, repel               energy conservation, two experiments compared: closest approach, repelled from a sphere
//   stmts                        which statements are correct?
(function (root) {
  'use strict';

  const E = root.Elec || require('../electric-field/elec.js');
  const C = root.Charges || require('../electric-field/charges.js');
  const { L, cap, rng, DIRS, dkey, dirName, dirOf, nice, sci, show, values, choice, tiles, words, K, particle, chargeOf, signName } = E;
  const fig = (html) => `<div class="fig">${html}</div>`;
  const vec = (s) => `<span class="vec"><i>${s}</i></span>`;
  const sgn = (x) => (x > 0 ? `+${nice(x)}` : x < 0 ? `−${nice(-x)}` : '0');
  const tile = (d, none) => `<span class="dtile">${C.icon(d)}<span>${dirName(d, none)}</span></span>`;
  const frac = (x) => (Math.abs(x - 1) < 1e-9 ? '×1' : x > 1 ? `×${nice(x)}` : `×1/${nice(1 / x)}`);
  const eV = (x) => `${sgn(x)} eV`;
  const RULE = () => L('The potential energy of a charge q at a point with potential V is q·V. Moving from A to B, the field does the work W = q·(V_A − V_B), and the kinetic energy changes by that much.', 'Die potentielle Energie einer Ladung q in einem Punkt mit dem Potential V ist q·V. Von A nach B verrichtet das Feld die Arbeit W = q·(V_A − V_B), und die kinetische Energie ändert sich um so viel.');
  const DOWNHILL = () => L('Left to itself, a positive charge moves towards lower potential, a negative charge towards higher potential; either way its potential energy decreases.', 'Sich selbst überlassen, bewegt sich eine positive Ladung zu tieferem Potential, eine negative zu höherem; so oder so nimmt ihre potentielle Energie ab.');

  // ---------------------------------------------------------------- graphs V(x) and E(x)
  // f on [0, 8] (x in mm), with jumps allowed at the breaks (dotted); y from lo to hi
  function lineGraph(f, breaks, o) {
    const W = o.small ? 250 : 320, H = o.small ? 170 : 210, L0 = 36, B = 24, T = 26, R = 34, lo = o.lo, hi = o.hi;
    const X = (x) => L0 + (x / 8) * (W - L0 - R), Y = (y) => T + ((hi - y) / (hi - lo)) * (H - T - B);
    let s = `<rect class="bg" x="0" y="0" width="${W}" height="${H}"/>`;
    for (let x = 1; x <= 8; x++) s += `<line class="grid" x1="${X(x)}" y1="${Y(hi)}" x2="${X(x)}" y2="${Y(lo)}"/>`;
    for (let y = lo; y <= hi; y += o.step || 1) if (y !== 0) s += `<line class="grid" x1="${X(0)}" y1="${Y(y)}" x2="${X(8)}" y2="${Y(y)}"/>`;
    s += `<line class="axisline" x1="${X(0)}" y1="${Y(lo)}" x2="${X(0)}" y2="${Y(hi) - 6}"/><line class="axisline" x1="${X(0)}" y1="${Y(0)}" x2="${X(8) + 6}" y2="${Y(0)}"/>`;
    for (let y = lo; y <= hi; y += o.label || 2) s += C.txt(X(0) - 5, Y(y) + 4, String(y).replace('-', '−'), 'tick', 'end');
    for (let x = 0; x <= 6; x += 2) s += C.txt(X(x), H - 6, String(x), 'tick'); // not 8: the axis name is there
    s += C.txt(W - 2, H - 6, '<tspan class="it">x</tspan> in mm', 'tick', 'end') + C.txt(L0 + 6, 15, o.yname, `lbl small ${o.cls || ''}`, 'start');
    let d = '';
    breaks.slice(0, -1).forEach((a, i) => {
      const b = breaks[i + 1], n = 20, pts = [];
      for (let k = 0; k <= n; k++) { const x = a + ((b - a) * k) / n; pts.push(`${X(x).toFixed(1)},${Y(f(Math.min(x, b - 1e-9))).toFixed(1)}`); }
      if (i > 0 && !o.joined) { const u = f(a - 1e-9), w = f(a); if (Math.abs(u - w) > 1e-6) s += `<line class="jump" x1="${X(a)}" y1="${Y(u)}" x2="${X(a)}" y2="${Y(w)}"/>`; }
      d += `${i && o.joined ? 'L' : 'M'}${pts.join(' L')} `;
    });
    s += `<path class="gcurve ${o.cls || ''}" d="${d.trim()}"/>`;
    return C.svg(W, H, s, o.label || '', o.small ? 'small' : '');
  }
  const vGraph = (f, br, small) => lineGraph(f, br, { lo: 0, hi: 8, step: 1, label: 2, yname: '<tspan class="it">V</tspan> in V', cls: 'c-v', joined: true, small });
  const eGraph = (f, br, small) => lineGraph(f, br, { lo: -3, hi: 3, step: 1, label: 1, yname: '<tspan class="it">E</tspan> in kV/m', cls: 'c-e', small });

  // ---------------------------------------------------------------- potentials at points
  // equipotential lines of a uniform field (vertical, V falling to the right) with points on them
  function pointsV(seed) {
    const r = rng(seed * 31 + 7), step = r.pick([20, 50, 100]), V0 = r.pick([1, 2]) * step, n = 6, levels = Array.from({ length: n }, (x, i) => V0 + (n - 1 - i) * step);
    const xs = [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5], pick = r.shuffle([0, 1, 2, 3, 4, 5]).slice(0, 3), ys = [1.2, -0.4, 0.6];
    const P = pick.map((k, i) => ({ x: xs[k], y: ys[i], V: levels[k], name: 'ABC'[i] }));
    const [A, B, Cc] = P, qn = r.pick([2, 3.4, 5]), pt = particle(r, r.pick([1, -1]), { generic: false });
    const dVAC = Cc.V - A.V, Epot = qn * B.V, Wp = pt.z * (A.V - B.V);
    const elec = B.V - Cc.V; // an electron from C to B: ΔE_kin = −e·(V_C − V_B), in eV
    const howU = L(`The potential difference is V_C − V_A = ${nice(Cc.V)} V − ${nice(A.V)} V = ${sgn(dVAC)} V.`, `Die Potentialdifferenz ist V_C − V_A = ${nice(Cc.V)} V − ${nice(A.V)} V = ${sgn(dVAC)} V.`);
    const howE = L(`E_pot = q·V_B = ${nice(qn)} nC · ${nice(B.V)} V = ${nice(Epot)} nJ.`, `E_pot = q·V_B = ${nice(qn)} nC · ${nice(B.V)} V = ${nice(Epot)} nJ.`);
    const howW = L(`W = q·(V_A − V_B) = ${pt.z > 0 ? (pt.z > 1 ? '2e' : 'e') : '−e'} · (${nice(A.V)} V − ${nice(B.V)} V) = ${eV(Wp)}.`, `W = q·(V_A − V_B) = ${pt.z > 0 ? (pt.z > 1 ? '2e' : 'e') : '−e'} · (${nice(A.V)} V − ${nice(B.V)} V) = ${eV(Wp)}.`);
    const howK = L(`ΔE_kin = W = q·(V_C − V_B) = −e · (${nice(Cc.V)} V − ${nice(B.V)} V) = ${eV(elec)}.`, `ΔE_kin = W = q·(V_C − V_B) = −e · (${nice(Cc.V)} V − ${nice(B.V)} V) = ${eV(elec)}.`);
    const fmtV = (v) => `${sgn(v)} V`, fmtJ = (v) => `${nice(v)} nJ`;
    const sgnTrap = (x, how) => ({ value: -x, tag: 'sign', why: L(`Mind the sign. ${how}`, `Achte auf das Vorzeichen. ${how}`) });
    return {
      kind: 'pot', title: L('Potentials at points', 'Potentiale in Punkten'),
      text: L(`<p>The figure shows equipotential lines of an electric field with their potentials, and three points A, B and C on them.</p>`, `<p>Die Abbildung zeigt Äquipotentiallinien eines elektrischen Feldes mit ihren Potentialen und drei Punkte A, B und C darauf.</p>`),
      figs: fig(C.fig({ kind: 'uniform', E: [1, 0] }, { box: [-3, 3, -1.8, 1.8], given: xs.map((x) => [[x, -3], [x, 3]]), equiLines: true, points: P.map((p) => ({ x: p.x, y: p.y, name: p.name })), tops: xs.map((x, i) => ({ x, label: `${levels[i]} V` })) })),
      questions: [
        choice('U', L('(a) the potential difference V_C − V_A', '(a) die Potentialdifferenz V_C − V_A'), values(dVAC, [sgnTrap(dVAC, howU), { value: Cc.V + A.V, tag: 'sum', why: howU }], null, howU, { signed: true, fmt: fmtV, extra: [2, 0.5] })),
        choice('Ep', L(`(b) the potential energy of a test charge of +${nice(qn)} nC at B`, `(b) die potentielle Energie einer Probeladung von +${nice(qn)} nC in B`), values(Epot, [{ value: B.V / qn, tag: 'div', why: howE }], null, howE, { fmt: fmtJ })),
        choice('W', L(`(c) the work done by the field on ${pt.name()} moving from A to B`, `(c) die Arbeit, die das Feld an ${pt.name().replace(/^ein /, 'einem ').replace(/^eine /, 'einer ')} verrichtet, das sich von A nach B bewegt`), values(Wp, [sgnTrap(Wp, howW), ...(Math.abs(pt.z) === 2 ? [{ value: Wp / 2, tag: 'z', why: L(`An alpha particle has the charge 2e. ${howW}`, `Ein Alphateilchen hat die Ladung 2e. ${howW}`) }] : [])], null, howW, { signed: true, fmt: eV, extra: [2, 0.5] })),
        choice('K', L('(d) the change of the kinetic energy of an electron moving from C to B', '(d) die Änderung der kinetischen Energie eines Elektrons, das sich von C nach B bewegt'), values(elec, [sgnTrap(elec, howK)], null, howK, { signed: true, fmt: eV, extra: [2, 0.5] })),
      ],
      hints: [RULE(), L('1 eV is the energy of a charge e moved through 1 V.', '1 eV ist die Energie einer Ladung e, die 1 V durchläuft.'), chargeOf(pt)],
      solution: [howU, howE, howW, howK], p: { step, V0, pick: pick.join(''), pt: pt.id, qn },
    };
  }
  function whichWay(seed) {
    const mv = (x) => String(x).replace('-', '−');
    const r = rng(seed * 37 + 11), q = r.pick([1, 1, -1, -1, 0]), pt = particle(r, q), Vl = r.pick([0, 100, 200]), Vr = Vl + r.pick([-1, 1]) * r.pick([100, 200, 300]);
    const Ed = Vl > Vr ? [1, 0] : [-1, 0]; // the field points from high to low potential
    const move = q > 0 ? Ed : q < 0 ? [-Ed[0], 0] : null, toHigh = q < 0;
    const how = q ? L(`${DOWNHILL()} The left plate is at ${mv(Vl)} V, the right one at ${mv(Vr)} V: ${q > 0 ? 'lower' : 'higher'} potential is ${dirName(move)}.`, `${DOWNHILL()} Die linke Platte liegt auf ${mv(Vl)} V, die rechte auf ${mv(Vr)} V: ${q > 0 ? 'Tieferes' : 'Höheres'} Potential liegt ${dirName(move)}.`)
      : L('A neutral particle feels no force: it stays where it is.', 'Ein neutrales Teilchen spürt keine Kraft: Es bleibt, wo es ist.');
    const opts = [{ d: move, ok: true }];
    for (const d of [move ? [-move[0], 0] : [1, 0], move ? null : [-1, 0], [0, 1]]) if (opts.length < 4 && !opts.some((o) => dkey(o.d) === dkey(d))) opts.push({ d });
    const howE = L('Released at rest, the charge speeds up: its kinetic energy grows, so its potential energy falls.', 'In Ruhe losgelassen, wird die Ladung schneller: Ihre kinetische Energie wächst, also nimmt ihre potentielle Energie ab.');
    const qs = [tiles('m', L('(a) Released at rest, it moves', '(a) In Ruhe losgelassen, bewegt es sich'), r.shuffle(opts).map((o) => ({ html: tile(o.d, L('it stays', 'es bleibt')), ok: !!o.ok, why: o.ok ? '' : how })))];
    if (q) {
      qs.push(choice('V', L('(b) It moves towards', '(b) Es bewegt sich zu'), words(r, [[L('higher potential', 'höherem Potential'), toHigh, how], [L('lower potential', 'tieferem Potential'), !toHigh, how]])));
      qs.push(choice('Ep', L('(c) Its potential energy', '(c) Seine potentielle Energie'), words(r, [[L('decreases', 'nimmt ab'), true, ''], [L('increases', 'nimmt zu'), false, howE], [L('stays the same', 'bleibt gleich'), false, howE]])));
    }
    return {
      kind: 'pot', title: L('Which way?', 'In welche Richtung?'),
      text: L(`<p>Between two parallel plates at ${mv(Vl)} V (left) and ${mv(Vr)} V (right), ${pt.name()} is released at rest.</p>`, `<p>Zwischen zwei parallelen Platten auf ${mv(Vl)} V (links) und ${mv(Vr)} V (rechts) wird ${pt.name()} in Ruhe losgelassen.</p>`),
      figs: fig(C.fig({ kind: 'uniform', E: Ed }, { box: [-2.75, 2.75, -1.6, 1.6], lines: true, rods: [[-2.6, -1.5, -2.6, 1.5], [2.6, -1.5, 2.6, 1.5]], parts: [{ x: 0, y: 0, q, sym: pt.sym }], tops: [{ x: -2.6, label: `${mv(Vl)} V` }, { x: 2.6, label: `${mv(Vr)} V` }] })),
      questions: qs, hints: [chargeOf(pt), DOWNHILL(), L('The field points from high to low potential.', 'Das Feld zeigt von hohem zu tiefem Potential.')],
      solution: q ? [how, howE] : [how], p: { q, Vl, Vr, pt: pt.id },
    };
  }

  // ---------------------------------------------------------------- the uniform field
  function uniformD(seed) {
    const r = rng(seed * 41 + 13);
    for (;;) {
      const Ef = r.pick([100, 200, 250, 400, 500]), ax = r.int(-2, 1), ay = r.int(-1, 1), bx = r.int(-2, 2), by = r.int(-1, 1);
      if (ax === bx || ay === by) continue;
      const dx = (bx - ax) / 100, dV = -Ef * dx, dist = Math.hypot(bx - ax, by - ay) / 100, Wel = dV; // electron from A to B: W = −e(V_A − V_B) = e·(V_B − V_A)
      const how = L(`Only the distance along the field lines counts: ${Math.abs(bx - ax)} cm. Along the field the potential falls: V_B − V_A = −E·Δx = −${Ef} V/m · (${sgn(bx - ax)} cm) = ${sgn(dV)} V.`, `Nur der Abstand längs der Feldlinien zählt: ${Math.abs(bx - ax)} cm. In Feldrichtung fällt das Potential: V_B − V_A = −E·Δx = −${Ef} V/m · (${sgn(bx - ax)} cm) = ${sgn(dV)} V.`);
      const howW = L(`W = q·(V_A − V_B) = −e · (${sgn(-dV)} V) = ${eV(Wel)}.`, `W = q·(V_A − V_B) = −e · (${sgn(-dV)} V) = ${eV(Wel)}.`);
      const fmtV = (v) => `${sgn(v)} V`;
      return {
        kind: 'uni', title: L('Along the field lines', 'Längs der Feldlinien'),
        text: L(`<p>A uniform field of ${Ef} V/m points to the right. The grid spacing is 1 cm.</p>`, `<p>Ein homogenes Feld von ${Ef} V/m zeigt nach rechts. Der Gitterabstand ist 1 cm.</p>`),
        figs: fig(C.fig({ kind: 'uniform', E: [1, 0] }, { box: [-3, 3, -1.6, 1.6], lines: true, lineOpts: { gap: 1 }, grid: true, points: [{ x: ax, y: ay, name: 'A' }, { x: bx, y: by, name: 'B' }] })),
        questions: [
          choice('U', L('(a) the potential difference V_B − V_A', '(a) die Potentialdifferenz V_B − V_A'), values(dV, [{ value: -dV, tag: 'sign', why: L(`The potential falls along the field. ${how}`, `Das Potential fällt in Feldrichtung. ${how}`) }, { value: -Ef * dist * Math.sign(dx), tag: 'straight', why: L(`Not the straight distance AB: only the part along the field lines counts. ${how}`, `Nicht der direkte Abstand AB: Nur der Teil längs der Feldlinien zählt. ${how}`) }, { value: -Ef * Math.abs(by - ay) / 100 * Math.sign(dx), tag: 'across', why: how }], null, how, { signed: true, fmt: fmtV, extra: [2, 0.5] })),
          choice('W', L('(b) the work done by the field on an electron moving from A to B', '(b) die Arbeit, die das Feld an einem Elektron verrichtet, das sich von A nach B bewegt'), values(Wel, [{ value: -Wel, tag: 'sign', why: L(`The electron is negative. ${howW}`, `Das Elektron ist negativ. ${howW}`) }], null, howW, { signed: true, fmt: eV, extra: [2, 0.5] })),
        ],
        hints: [L('In a uniform field: |ΔV| = E·d, with d the distance measured along the field lines.', 'Im homogenen Feld: |ΔV| = E·d, mit d dem Abstand längs der Feldlinien gemessen.'), L('Moving across the field lines changes nothing: those are equipotentials.', 'Eine Bewegung quer zu den Feldlinien ändert nichts: Das sind Äquipotentiallinien.'), L('The potential falls in the direction of the field.', 'Das Potential fällt in Feldrichtung.')],
        solution: [how, howW], p: { Ef, ax, ay, bx, by },
      };
    }
  }
  // V(x) straight pieces at whole mm, slopes in V/mm (= kV/m); E = −dV/dx
  function vPieces(r) {
    for (;;) {
      const br = [0], sl = [];
      while (br[br.length - 1] < 8) { const l = r.pick([1, 2, 2, 3]); if (br[br.length - 1] + l > 8) continue; br.push(br[br.length - 1] + l); sl.push(r.pick([-2, -1, 0, 1, 2])); }
      if (sl.some((s, i) => i && s === sl[i - 1]) || sl.filter((s) => s).length < 2) continue;
      let v = 0, lo = 0, hi = 0;
      const at = [0];
      sl.forEach((s, i) => { v += s * (br[i + 1] - br[i]); at.push(v); lo = Math.min(lo, v); hi = Math.max(hi, v); });
      if (hi - lo > 8) continue;
      const v0 = r.int(-lo, 8 - hi), V = (x) => { let i = sl.length - 1; while (i > 0 && x < br[i]) i--; return v0 + at[i] + sl[i] * (x - br[i]); };
      const Ef = (x) => { let i = sl.length - 1; while (i > 0 && x < br[i]) i--; return -sl[i]; };
      return { br, sl, v0, V, E: Ef };
    }
  }
  const WHYG = {
    sign: () => L(`The field points towards lower potential: E = −dV/dx. Where V rises, E is negative.`, `Das Feld zeigt zu tieferem Potential: E = −dV/dx. Wo V steigt, ist E negativ.`),
    copy: () => L('This graph has the shape of the other one. But E is the slope of V (with the opposite sign), not V itself: where V is constant, E = 0.', 'Dieser Graph hat die Form des anderen. Aber E ist die Steigung von V (mit umgekehrtem Vorzeichen), nicht V selbst: Wo V konstant ist, ist E = 0.'),
    steep: () => L('In one part, the value does not match the slope: read it off, ΔV/Δx in V/mm = kV/m.', 'In einem Teil passt der Wert nicht zur Steigung: Lies sie ab, ΔV/Δx in V/mm = kV/m.'),
  };
  function v2e(seed, back) {
    const r = rng(seed * (back ? 43 : 47) + 17), g = vPieces(r), br = g.br;
    const k = r.int(0, g.sl.length - 1), alt = { ...g, sl: g.sl.map((s, i) => (i === k ? (s === 0 ? r.pick([1, -1]) : Math.sign(s) * (3 - Math.abs(s))) : s)) };
    let a = 0; const atA = [0]; alt.sl.forEach((s, i) => { a += s * (br[i + 1] - br[i]); atA.push(a); });
    const Va = (x) => { let i = alt.sl.length - 1; while (i > 0 && x < br[i]) i--; return g.v0 + atA[i] + alt.sl[i] * (x - br[i]); };
    const Ea = (x) => { let i = alt.sl.length - 1; while (i > 0 && x < br[i]) i--; return -alt.sl[i]; };
    const pieces = g.sl.map((s, i) => L(`${br[i]}–${br[i + 1]} mm: V changes by ${sgn(s * (br[i + 1] - br[i]))} V, so E = ${sgn(-s)} kV/m`, `${br[i]}–${br[i + 1]} mm: V ändert sich um ${sgn(s * (br[i + 1] - br[i]))} V, also E = ${sgn(-s)} kV/m`));
    const sol = `${L('E = −dV/dx: the slope of the potential, with the opposite sign (1 V/mm = 1 kV/m).', 'E = −dV/dx: die Steigung des Potentials, mit umgekehrtem Vorzeichen (1 V/mm = 1 kV/m).')}<ul>${pieces.map((p) => `<li>${p}.</li>`).join('')}</ul>`;
    const fits = (f, lo, hi) => { for (let x = 0; x <= 8; x += 0.05) { const y = f(Math.min(x, 7.999)); if (y < lo - 1e-9 || y > hi + 1e-9) return false; } return true; };
    let opts;
    if (!back) {
      const [vlo, vhi] = [Math.min(...[0, 1, 2, 3, 4, 5, 6, 7, 8].map(g.V)), Math.max(...[0, 1, 2, 3, 4, 5, 6, 7, 8].map(g.V))], mid = (vlo + vhi) / 2, sc = 2.4 / Math.max(1, (vhi - vlo) / 2);
      opts = [{ f: g.E, ok: true }, { f: (x) => -g.E(x), tag: 'sign' }, { f: (x) => Math.max(-2.8, Math.min(2.8, sc * (g.V(x) - mid))), tag: 'copy' }, { f: Ea, tag: 'steep' }].map((o) => ({ ...o, html: eGraph(o.f, br, true) }));
    } else {
      const flip = (x) => 2 * g.v0 - g.V(x), cp = (x) => g.v0 + 1.2 * (g.E(x) - g.E(0));
      opts = [{ f: g.V, ok: true }, { f: flip, tag: 'sign' }, { f: cp, tag: 'copy' }, { f: Va, tag: 'steep' }].filter((o) => fits(o.f, 0, 8)).map((o) => ({ ...o, html: vGraph(o.f, br, true) }));
      if (opts.length < 3) return v2e(seed + 1000, back);
    }
    return {
      kind: 'graph', title: back ? L('From E back to V', 'Von E zurück zu V') : L('From V to E', 'Von V zu E'),
      text: back ? L(`<p>The graph shows the field E along the x axis. At x = 0 the potential is ${g.v0} V.</p>`, `<p>Der Graph zeigt das Feld E längs der x-Achse. Bei x = 0 ist das Potential ${g.v0} V.</p>`) : L('<p>The graph shows the potential V along the x axis (the field points along x).</p>', '<p>Der Graph zeigt das Potential V längs der x-Achse (das Feld zeigt längs x).</p>'),
      figs: fig(back ? eGraph(g.E, br) : vGraph(g.V, br)),
      questions: [{ type: 'pick', key: 'g', label: back ? L('Which graph shows the potential?', 'Welcher Graph zeigt das Potential?') : L('Which graph shows the field?', 'Welcher Graph zeigt das Feld?'), options: r.shuffle(opts).map((o) => ({ html: o.html, ok: !!o.ok, tag: o.tag, why: o.ok ? '' : WHYG[o.tag]() })) }],
      hints: [L('E = −dV/dx: the field is the slope of the potential graph, with the opposite sign.', 'E = −dV/dx: Das Feld ist die Steigung des Potentialgraphen, mit umgekehrtem Vorzeichen.'), back ? L('Going back: V changes by −E·Δx, minus the area under the E graph (1 kV/m · 1 mm = 1 V).', 'Zurück: V ändert sich um −E·Δx, minus die Fläche unter dem E-Graphen (1 kV/m · 1 mm = 1 V).') : L('Where V is constant, E = 0; where V falls, E is positive.', 'Wo V konstant ist, ist E = 0; wo V fällt, ist E positiv.')],
      solution: [sol], solFig: `<div class="figs">${fig(vGraph(g.V, br))}${fig(eGraph(g.E, br))}</div>`, p: { br: br.join(','), sl: g.sl.join(','), v0: g.v0 },
    };
  }

  // ---------------------------------------------------------------- equipotentials
  const EQ = {
    point: { c: { kind: 'points', charges: [{ q: 1, x: 0, y: 0 }] }, lv: [0.4, 0.6, 0.9, 1.4, 2.4], name: () => L('a positive point charge', 'eine positive Punktladung') },
    dipole: { c: { kind: 'points', charges: [{ q: 1, x: -1, y: 0 }, { q: -1, x: 1, y: 0 }] }, lv: [-1.6, -0.8, -0.4, -0.15, 0, 0.15, 0.4, 0.8, 1.6], name: () => L('a positive and a negative charge (a dipole)', 'eine positive und eine negative Ladung (ein Dipol)') },
    like: { c: { kind: 'points', charges: [{ q: 1, x: -1, y: 0 }, { q: 1, x: 1, y: 0 }] }, lv: [0.6, 0.85, 1, 1.2, 1.6, 2.4], name: () => L('two equal positive charges', 'zwei gleiche positive Ladungen') },
    plates: { c: { kind: 'plates', h: 0.9, w: 1.8, q: 1 }, lv: [-6, -3.5, -1.5, 0, 1.5, 3.5, 6], name: () => L('a plate capacitor', 'einen Plattenkondensator') },
  };
  const WHYE = {
    even: () => L('Around a point charge, V = k·Q/r: for equal steps of potential, the circles get farther apart outwards.', 'Um eine Punktladung ist V = k·Q/r: Für gleiche Potentialschritte liegen die Kreise nach aussen immer weiter auseinander.'),
    lines: () => L('These are field lines, not equipotentials: equipotentials cross the field lines at right angles.', 'Das sind Feldlinien, keine Äquipotentiallinien: Äquipotentiallinien kreuzen die Feldlinien senkrecht.'),
    swap: () => L('This pattern belongs to another arrangement.', 'Dieses Muster gehört zu einer anderen Anordnung.'),
    turned: () => L('Between the plates the field lines run from plate to plate; the equipotentials are parallel to the plates.', 'Zwischen den Platten verlaufen die Feldlinien von Platte zu Platte; die Äquipotentiallinien sind parallel zu den Platten.'),
  };
  function equiPick(seed) {
    const r = rng(seed * 53 + 23), key = r.pick(Object.keys(EQ)), Q = EQ[key], box = [-3, 3, -2.2, 2.2], small = (c, o) => C.fig(c, { box, small: true, ...o });
    const right = { html: small(Q.c, { equi: Q.lv }), ok: true }, cands = [];
    cands.push({ html: small(Q.c, { given: C.lines(Q.c, box), equiLines: true }), tag: 'lines' });
    if (key === 'point') cands.push({ html: small(Q.c, { circles: [0.5, 1, 1.5, 2, 2.5] }), tag: 'even' }, { html: small(Q.c, { equi: EQ.dipole.lv, alt: EQ.dipole.c }), tag: 'swap' });
    if (key === 'dipole') cands.push({ html: small(Q.c, { equi: EQ.like.lv, alt: EQ.like.c }), tag: 'swap' }, { html: small(Q.c, { circles: [0.4, 0.8, 1.2], centres: [[-1, 0], [1, 0]] }), tag: 'even' });
    if (key === 'like') cands.push({ html: small(Q.c, { equi: EQ.dipole.lv, alt: EQ.dipole.c }), tag: 'swap' }, { html: small(Q.c, { circles: [0.4, 0.8, 1.2], centres: [[-1, 0], [1, 0]] }), tag: 'even' });
    if (key === 'plates') cands.push({ html: small(Q.c, { vlines: [-1.4, -0.7, 0, 0.7, 1.4] }), tag: 'turned' }, { html: small(Q.c, { equi: EQ.dipole.lv, alt: EQ.dipole.c }), tag: 'swap' });
    const opts = [right, ...cands.slice(0, 3)];
    const how = L('Equipotential lines cross the field lines at right angles; for equal steps of potential they are closer together where the field is stronger.', 'Äquipotentiallinien kreuzen die Feldlinien senkrecht; für gleiche Potentialschritte liegen sie dort dichter, wo das Feld stärker ist.');
    return {
      kind: 'equi', title: L('Equipotential lines', 'Äquipotentiallinien'),
      text: L(`<p>Which diagram shows equipotential lines (equal steps of potential) of ${Q.name()}?</p>`, `<p>Welches Diagramm zeigt Äquipotentiallinien (gleiche Potentialschritte) für ${Q.name()}?</p>`), figs: '',
      questions: [{ type: 'pick', key: 'd', label: L('Which diagram is right?', 'Welches Diagramm stimmt?'), options: r.shuffle(opts).map((o) => ({ html: o.html, ok: !!o.ok, tag: o.tag, why: o.ok ? '' : `${WHYE[o.tag]()} ${how}` })) }],
      hints: [how, L('Around a single point charge, equipotentials are circles: V = k·Q/r.', 'Um eine einzelne Punktladung sind Äquipotentiallinien Kreise: V = k·Q/r.')],
      solution: [how], solFig: fig(C.fig(Q.c, { box, equi: Q.lv, lines: true })), p: { key, s: seed % 5 },
    };
  }
  function linesEqui(seed) {
    const r = rng(seed * 59 + 29), kind = r.pick(['uniform', 'point']), hiLeft = r.next() < 0.5, box = [-3, 3, -2.2, 2.2];
    let given, opts, how;
    if (kind === 'uniform') {
      const xs = [-2, -1, 0, 1, 2], vals = xs.map((x, i) => (hiLeft ? 400 - 100 * i : 100 * i)), Ed = hiLeft ? [1, 0] : [-1, 0];
      const lab = { tops: xs.map((x, i) => ({ x, label: `${vals[i]} V` })) };
      given = C.fig({ kind: 'uniform', E: Ed }, { box, given: xs.map((x) => [[x, -3], [x, 3]]), equiLines: true, ...lab });
      const horiz = [-1.6, -0.8, 0, 0.8, 1.6].map((y) => [[-3, y], [3, y]]), vert = [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5].map((x) => [[x, -3], [x, 3]]);
      const draw = (lines, rev, o = {}) => C.fig({ kind: 'uniform', E: Ed }, { box, given: xs.map((x) => [[x, -3], [x, 3]]), equiLines: true, extra: lines, extraRev: rev, small: true, ...lab, ...o });
      opts = [{ html: draw(Ed[0] > 0 ? horiz : horiz.map((l) => [...l].reverse()), false), ok: true }, { html: draw(Ed[0] > 0 ? horiz.map((l) => [...l].reverse()) : horiz, false), tag: 'up' }, { html: draw(vert.map((l) => [...l]), false), tag: 'along' }];
      how = L(`Field lines cross the equipotentials at right angles and point from high to low potential: ${hiLeft ? 'to the right' : 'to the left'}.`, `Feldlinien kreuzen die Äquipotentiallinien senkrecht und zeigen von hohem zu tiefem Potential: ${hiLeft ? 'nach rechts' : 'nach links'}.`);
    } else {
      const pos = hiLeft, c = { kind: 'points', charges: [{ q: pos ? 1 : -1, x: 0, y: 0 }] }, rs = [0.5, 0.9, 1.4, 2.1];
      const vlab = rs.map((rr) => ({ x: rr * 0.72, y: rr * 0.72, label: `${pos ? '+' : '−'}${nice(Math.round(90 / rr))} V` }));
      given = C.fig(c, { box, circles: rs, unknown: true, labelsAt: vlab });
      const rad = Array.from({ length: 8 }, (x, k) => { const a = (k * Math.PI) / 4 + 0.2; return [[0.15 * Math.cos(a), 0.15 * Math.sin(a)], [3.5 * Math.cos(a), 3.5 * Math.sin(a)]]; });
      const circ = [0.7, 1.15, 1.75].map((rr) => Array.from({ length: 61 }, (x, k) => [rr * Math.cos((k * Math.PI) / 30), rr * Math.sin((k * Math.PI) / 30)]));
      const draw = (lines, o = {}) => C.fig(c, { box, circles: rs, unknown: true, extra: lines, small: true, labelsAt: vlab, ...o });
      opts = [{ html: draw(pos ? rad : rad.map((l) => [...l].reverse())), ok: true }, { html: draw(pos ? rad.map((l) => [...l].reverse()) : rad), tag: 'up' }, { html: draw(circ), tag: 'along' }];
      how = L(`Field lines cross the equipotential circles at right angles: they run radially, from high to low potential, ${pos ? 'outwards (the charge is positive)' : 'inwards (the charge is negative)'}.`, `Feldlinien kreuzen die Äquipotentialkreise senkrecht: Sie verlaufen radial, von hohem zu tiefem Potential, ${pos ? 'nach aussen (die Ladung ist positiv)' : 'nach innen (die Ladung ist negativ)'}.`);
    }
    const W = { up: L('These point from low to high potential; the field points the other way.', 'Diese zeigen von tiefem zu hohem Potential; das Feld zeigt umgekehrt.'), along: L('These run along the equipotentials; field lines cross them at right angles.', 'Diese verlaufen längs der Äquipotentiallinien; Feldlinien kreuzen sie senkrecht.') };
    return {
      kind: 'equi', title: L('Field lines from equipotentials', 'Feldlinien aus Äquipotentiallinien'),
      text: L('<p>The figure shows equipotential lines (orange) with their potentials. Which diagram shows the field lines (blue)?</p>', '<p>Die Abbildung zeigt Äquipotentiallinien (orange) mit ihren Potentialen. Welches Diagramm zeigt die Feldlinien (blau)?</p>'),
      figs: fig(given),
      questions: [{ type: 'pick', key: 'd', label: L('Which diagram is right?', 'Welches Diagramm stimmt?'), options: r.shuffle(opts).map((o) => ({ html: o.html, ok: !!o.ok, tag: o.tag, why: o.ok ? '' : `${W[o.tag]} ${how}` })) }],
      hints: [L('Field lines and equipotentials meet at right angles.', 'Feldlinien und Äquipotentiallinien treffen sich senkrecht.'), L('The field points from high to low potential.', 'Das Feld zeigt von hohem zu tiefem Potential.')],
      solution: [how], p: { kind, hiLeft },
    };
  }

  // ---------------------------------------------------------------- point charges
  // ---------------------------------------------------------------- comparing two situations
  const it = (x) => `<i>${x}</i>`;
  const cmpTable = (heads, rows) => `<table class="cmp"><thead><tr><th></th>${heads.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(([n, ...v]) => `<tr><th>${n}</th>${v.map((x) => `<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const times = (f, sym) => (Math.abs(f - 1) < 1e-9 ? it(sym) : f > 1 ? `${nice(f)}${it(sym)}` : `${it(sym)}/${nice(1 / f)}`);
  const whole = (x) => x > 0 && [x, 1 / x].some((y) => Math.abs(y - Math.round(y)) < 1e-9);
  const rootable = (x) => whole(x) || [2, 3, 6].some((n) => Math.abs(x * x - n) < 1e-9 || Math.abs(x * x - 1 / n) < 1e-9);
  // a factor as ×2, ×1/3, ×√2 or ×1/√2
  const fac = (x) => (whole(x) ? frac(x) : x > 1 ? `×√${Math.round(x * x)}` : `×1/√${Math.round(1 / (x * x))}`);
  const FILL = [2, 0.5, 4, 0.25, 1, 3, 1 / 3, 8, 1 / 8, 6, 1 / 6];
  // four options: the right factor, the tempting ones (each one mistake, with its reason), fillers
  function factors(right, tempt, how) {
    const out = [{ x: right, ok: true }];
    for (const [x, why] of tempt) if (out.length < 4 && rootable(x) && !out.some((o) => Math.abs(o.x - x) < 1e-9)) out.push({ x, why });
    for (const x of FILL) if (out.length < 4 && !out.some((o) => Math.abs(o.x - x) < 1e-9)) out.push({ x, why: how });
    return out.sort((p, q) => p.x - q.x).map((o) => ({ label: fac(o.x), ok: !!o.ok, why: o.ok ? '' : o.why }));
  }
  // a multiple of V₀ as a fraction: +3/2 V₀
  function inV0(x) {
    if (Math.abs(x) < 1e-9) return '0';
    for (let d = 1; d <= 12; d++) if (Math.abs(x * d - Math.round(x * d)) < 1e-9) { const n = Math.abs(Math.round(x * d)); return `${x > 0 ? '+' : '−'}${d === 1 ? (n === 1 ? '' : n) : `${n}/${d}·`}V₀`; }
    return `${x > 0 ? '+' : '−'}${nice(Math.abs(x))}·V₀`;
  }
  const PROJ = { p: [['a proton', 'ein Proton'], 'p', 1, 1], d: [['a deuteron (a proton and a neutron)', 'ein Deuteron (ein Proton und ein Neutron)'], 'd', 1, 2], a: [['an alpha particle', 'ein Alphateilchen'], 'α', 2, 4] };
  const pname = (k) => L(...PROJ[k][0]).replace(/ \(.*\)$/, '').replace(/^(an?|ein) /, '');
  const pcell = (k) => `${pname(k)} (+${PROJ[k][2] > 1 ? PROJ[k][2] : ''}e)`;
  const massNote = (a, b) => (a === b ? '' : L(` Masses: ${pname(a)} about ${PROJ[a][3]} u, ${pname(b)} about ${PROJ[b][3]} u.`, ` Massen: ${pname(a)} etwa ${PROJ[a][3]} u, ${pname(b)} etwa ${PROJ[b][3]} u.`));

  function pointV(seed) {
    const r = rng(seed * 61 + 31);
    let sQ, k, m, s2, VP;
    for (;;) {
      sQ = r.pick([1, -1]); k = r.pick([2, 3, 4]); m = r.pick([-3, -2, -1, 1, 2, 3]); s2 = r.pick([1, 2, 3]); VP = sQ + m / s2;
      if (Math.abs(VP) > 1e-9 && Math.abs(sQ + m / (s2 * s2) - VP) > 1e-9) break;
    }
    const dBA = sQ * (1 / k - 1), qs = (x) => `${x < 0 ? '−' : '+'}${Math.abs(x) === 1 ? '' : Math.abs(x)}q`;
    const howK = L(`V = k·Q/r falls with 1/r: at ${k} times the distance, the potential is ${frac(1 / k)}.`, `V = k·Q/r nimmt mit 1/r ab: beim ${k}-fachen Abstand ist das Potential ${frac(1 / k)}.`);
    const howD = L(`V_A = ${inV0(sQ)}, V_B = ${inV0(sQ / k)}: V_B − V_A = ${inV0(dBA)}.`, `V_A = ${inV0(sQ)}, V_B = ${inV0(sQ / k)}: V_B − V_A = ${inV0(dBA)}.`);
    const howP = L(`Potentials add as numbers, with their signs: from Q ${inV0(sQ)}, from q₂ = ${qs(m)} at ${s2 === 1 ? 'the distance r' : `${s2}r`}: ${inV0(m / s2)}. Together V_P = ${inV0(VP)}.`, `Potentiale addieren sich als Zahlen, mit ihren Vorzeichen: von Q ${inV0(sQ)}, von q₂ = ${qs(m)} im Abstand ${s2 === 1 ? 'r' : `${s2}r`}: ${inV0(m / s2)}. Zusammen V_P = ${inV0(VP)}.`);
    const field = L('That is how the field falls off, with 1/r²; the potential falls with 1/r.', 'So nimmt das Feld ab, mit 1/r²; das Potential nimmt mit 1/r ab.');
    return {
      kind: 'pc', title: L('The potential of point charges', 'Das Potential von Punktladungen'),
      text: L(`<p>A point charge Q = ${qs(sQ)} (with q > 0; the potential is zero far away). Call V₀ = k·q/r. Point A is at the distance r from Q, point B at the distance ${k}r. Then a second charge q₂ = ${qs(m)} is added: the point P is at the distance r from Q and ${s2 === 1 ? 'r' : `${s2}r`} from q₂.</p>`, `<p>Eine Punktladung Q = ${qs(sQ)} (mit q > 0; weit weg ist das Potential null). Sei V₀ = k·q/r. Der Punkt A ist im Abstand r von Q, der Punkt B im Abstand ${k}r. Dann kommt eine zweite Ladung q₂ = ${qs(m)} dazu: Der Punkt P ist im Abstand r von Q und ${s2 === 1 ? 'r' : `${s2}r`} von q₂.</p>`),
      figs: '',
      questions: [
        choice('V', L('(a) Q alone: compared with A, the potential at B is', '(a) Q allein: Verglichen mit A ist das Potential in B'), factors(1 / k, [[1 / (k * k), field], [k, L('Further away, the potential is smaller in size.', 'Weiter weg ist das Potential dem Betrag nach kleiner.')]], howK)),
        choice('U', L('(b) Q alone: V_B − V_A', '(b) Q allein: V_B − V_A'), values(dBA, [{ value: -dBA, tag: 'sign', why: L('Mind the order: V_B − V_A, and the sign of Q.', 'Achte auf die Reihenfolge: V_B − V_A, und auf das Vorzeichen von Q.') }, { value: sQ * (1 / (k * k) - 1), tag: 'field', why: field }], null, howD, { signed: true, fmt: inV0, extra: [2, 0.5] })),
        choice('P', L('(c) both charges: the potential at P', '(c) beide Ladungen: das Potential in P'), values(VP, [{ value: sQ + Math.abs(m) / s2 * sQ, tag: 'abs', why: L('Mind the signs of the charges.', 'Achte auf die Vorzeichen der Ladungen.') }, { value: sQ + m / (s2 * s2), tag: 'field', why: field }, { value: sQ, tag: 'one', why: L('Both charges contribute.', 'Beide Ladungen tragen bei.') }], null, howP, { signed: true, fmt: inV0, extra: [2, 0.5] })),
      ],
      hints: [L('V = k·Q/r, with the sign of Q: it falls with 1/r.', 'V = k·Q/r, mit dem Vorzeichen von Q: Es nimmt mit 1/r ab.'), L('Potentials of several charges add as numbers (no directions).', 'Die Potentiale mehrerer Ladungen addieren sich als Zahlen (ohne Richtungen).')],
      solution: [howK, howD, howP], p: { sQ, k, m, s2 },
    };
  }

  const SC = [
    { id: 'four', c: [[1, 1, 1], [1, -1, 1], [1, -1, -1], [1, 1, -1]], name: () => L('four equal positive charges at the corners of a square', 'vier gleiche positive Ladungen an den Ecken eines Quadrats') },
    { id: 'alt', c: [[1, 1, 1], [-1, -1, 1], [1, -1, -1], [-1, 1, -1]], name: () => L('charges +q, −q, +q, −q in turn at the corners of a square', 'Ladungen +q, −q, +q, −q abwechselnd an den Ecken eines Quadrats') },
    { id: 'halves', c: [[1, -1, 1], [1, 1, 1], [-1, 1, -1], [-1, -1, -1]], name: () => L('two positive charges above and two negative ones below, at the corners of a square', 'zwei positive Ladungen oben und zwei negative unten, an den Ecken eines Quadrats') },
    { id: 'pair', c: [[1, -1.5, 0], [1, 1.5, 0]], name: () => L('two equal positive charges', 'zwei gleiche positive Ladungen') },
    { id: 'dip', c: [[1, -1.5, 0], [-1, 1.5, 0]], name: () => L('a positive and a negative charge of the same size', 'eine positive und eine negative Ladung gleichen Betrags') },
    { id: 'negpair', c: [[-1, -1.5, 0], [-1, 1.5, 0]], name: () => L('two equal negative charges', 'zwei gleiche negative Ladungen') },
    { id: 'tri', c: [[1, 0, 1.4], [1, -0.7 * Math.sqrt(3), -0.7], [1, 0.7 * Math.sqrt(3), -0.7]], name: () => L('three equal positive charges at the corners of an equilateral triangle', 'drei gleiche positive Ladungen an den Ecken eines gleichseitigen Dreiecks') },
  ];
  function scalar(seed) {
    const r = rng(seed * 67 + 37), S = r.pick(SC), flip = S.id === 'halves' && r.next() < 0.5;
    const ch = S.c.map(([q, x, y]) => ({ q, x: flip ? y : x, y: flip ? -x : y })), c = { kind: 'points', charges: ch };
    const Ev = C.field(c, 0, 0), d = Math.hypot(...Ev) < 1e-6 ? null : dirOf(Ev), V = C.potential(c, 0, 0), vs = Math.abs(V) < 1e-9 ? 0 : Math.sign(V);
    const opts = [{ d, ok: true }];
    for (const x of [null, [1, 0], [0, -1], [0, 1], [-1, 0]]) if (opts.length < 4 && !opts.some((o) => dkey(o.d) === dkey(x))) opts.push({ d: x });
    const howE = d ? L(`The fields add as vectors and do not cancel here: the net field points ${dirName(d)}, from the positive towards the negative charges.`, `Die Felder addieren sich als Vektoren und heben sich hier nicht auf: Das Gesamtfeld zeigt ${dirName(d)}, von den positiven zu den negativen Ladungen.`)
      : L('The fields add as vectors: by symmetry they cancel at the centre.', 'Die Felder addieren sich als Vektoren: Aus Symmetriegründen heben sie sich im Mittelpunkt auf.');
    const howV = vs ? L(`The potentials add as numbers: all the contributions have the same sign, so V ${vs > 0 ? '> 0' : '< 0'} although ${d ? 'the field points somewhere' : 'the field is zero'}.`, `Die Potentiale addieren sich als Zahlen: Alle Beiträge haben dasselbe Vorzeichen, also ist V ${vs > 0 ? '> 0' : '< 0'}, obwohl ${d ? 'das Feld irgendwohin zeigt' : 'das Feld null ist'}.`)
      : L(`The potentials add as numbers: equal positive and negative contributions at equal distances cancel, V = 0, although ${d ? 'the field is not zero' : 'the field is zero too'}.`, `Die Potentiale addieren sich als Zahlen: Gleiche positive und negative Beiträge in gleichen Abständen heben sich auf, V = 0, obwohl ${d ? 'das Feld nicht null ist' : 'auch das Feld null ist'}.`);
    const lab = (q) => (q > 0 ? '+' : '−');
    return {
      kind: 'pc', title: L('Field and potential at the centre', 'Feld und Potential im Mittelpunkt'),
      text: L(`<p>The figure shows ${S.name()}. M is the centre (the potential is zero far away).</p>`, `<p>Die Abbildung zeigt ${S.name()}. M ist der Mittelpunkt (weit weg ist das Potential null).</p>`),
      figs: fig(C.fig(c, { box: [-3, 3, -2.1, 2.1], labels: ch.map((s) => lab(s.q)), points: [{ x: 0, y: 0, name: 'M' }] })),
      questions: [
        tiles('E', L('(a) The field at M points', '(a) Das Feld in M zeigt'), r.shuffle(opts).map((o) => ({ html: tile(o.d, L('nowhere: it is zero', 'nirgends hin: Es ist null')), ok: !!o.ok, why: o.ok ? '' : howE }))),
        choice('V', L('(b) The potential at M is', '(b) Das Potential in M ist'), words(r, [[L('positive', 'positiv'), vs > 0, howV], [L('zero', 'null'), vs === 0, howV], [L('negative', 'negativ'), vs < 0, howV]])),
      ],
      hints: [L('Fields are vectors: they add with their directions and can cancel.', 'Felder sind Vektoren: Sie addieren sich mit ihren Richtungen und können sich aufheben.'), L('Potentials are numbers with a sign: V = k·q/r for each charge, then add.', 'Potentiale sind Zahlen mit Vorzeichen: V = k·q/r für jede Ladung, dann addieren.')],
      solution: [howE, howV], p: { S: S.id, flip },
    };
  }

  // ---------------------------------------------------------------- acceleration voltage
  const speed = (pt, U) => Math.sqrt((2 * Math.abs(pt.z) * K.e * U) / pt.m);
  function accel(seed) {
    const r = rng(seed * 71 + 41), pt = particle(r, r.pick([1, -1]), { generic: false }), U = r.pick(pt.m < 1e-29 ? [100, 500, 1500, 5000] : [1000, 5000, 20000, 50000]), z = Math.abs(pt.z), Ek = z * U, v = speed(pt, U);
    const fmtE = (x) => (x >= 1e3 ? `${nice(x / 1e3)} keV` : `${nice(x)} eV`);
    const howE = L(`E_kin = |q|·U = ${z === 2 ? '2e' : 'e'} · ${nice(U)} V = ${fmtE(Ek)}.`, `E_kin = |q|·U = ${z === 2 ? '2e' : 'e'} · ${nice(U)} V = ${fmtE(Ek)}.`);
    const howV = L(`½·m·v² = |q|·U, so v = √(2·|q|·U/m) = ${sci(v)} m/s.`, `½·m·v² = |q|·U, also v = √(2·|q|·U/m) = ${sci(v)} m/s.`);
    const howU = L('v = √(2·|q|·U/m) grows with the square root of U: twice the voltage, √2 times the speed (and twice the energy).', 'v = √(2·|q|·U/m) wächst mit der Wurzel aus U: doppelte Spannung, √2-fache Geschwindigkeit (und doppelte Energie).');
    return {
      kind: 'acc', title: L('Acceleration voltage', 'Beschleunigungsspannung'),
      text: L(`<p>${cap(pt.name())}, at rest at first, is accelerated through a voltage of ${nice(U)} V. (m = ${sci(pt.m)} kg)</p>`, `<p>${cap(pt.name())}, zuerst in Ruhe, wird mit einer Spannung von ${nice(U)} V beschleunigt. (m = ${sci(pt.m)} kg)</p>`), figs: '',
      questions: [
        choice('E', L('(a) its kinetic energy', '(a) seine kinetische Energie'), values(Ek, z === 2 ? [{ value: U, tag: 'z', why: L(`An alpha particle has the charge 2e. ${howE}`, `Ein Alphateilchen hat die Ladung 2e. ${howE}`) }] : [{ value: U / 2, tag: 'half', why: howE }], null, howE, { fmt: fmtE })),
        choice('v', L('(b) its speed', '(b) seine Geschwindigkeit'), values(v, [{ value: v / Math.SQRT2, tag: 'two', why: L(`Do not forget the 2 in v = √(2·|q|·U/m). ${howV}`, `Vergiss die 2 in v = √(2·|q|·U/m) nicht. ${howV}`) }, { value: v * v / 1e7, tag: 'root', why: howV }], 'speed', howV)),
        choice('k', L('(c) With twice the voltage, its speed would be', '(c) Mit der doppelten Spannung wäre seine Geschwindigkeit'), [1.4142, 2, 4, 1].map((x) => ({ label: x === 1.4142 ? '×√2' : frac(x), ok: x === 1.4142, why: howU }))),
      ],
      hints: [L('The field does the work |q|·U: E_kin = |q|·U.', 'Das Feld verrichtet die Arbeit |q|·U: E_kin = |q|·U.'), L('½·m·v² = |q|·U.', '½·m·v² = |q|·U.'), chargeOf(pt)],
      solution: [howE, howV, howU], p: { pt: pt.id, U },
    };
  }
  const CMP = [['p', ['a proton', 'ein Proton'], 1, 1], ['a', ['an alpha particle', 'ein Alphateilchen'], 2, 4], ['d', ['a deuteron', 'ein Deuteron'], 1, 2], ['he', ['a He⁺ ion', 'ein He⁺-Ion'], 1, 4], ['c', ['a C⁶⁺ ion', 'ein C⁶⁺-Ion'], 6, 12]];
  function accelCompare(seed) {
    const r = rng(seed * 73 + 43), [a, b] = r.shuffle(CMP.slice()).slice(0, 2), U = r.pick([1, 5, 10]) * 1e3;
    const kE = b[2] / a[2], kv = Math.sqrt((b[2] / b[3]) / (a[2] / a[3]));
    const opt = (right, list, how, lab = frac) => [right, ...list].filter((x, i, arr) => arr.findIndex((y) => Math.abs(y - x) < 1e-9) === i).slice(0, 4).sort((x, y) => x - y).map((x) => ({ label: lab(x), ok: Math.abs(x - right) < 1e-9, why: how }));
    const howE = L(`E_kin = |q|·U: the energy depends only on the charge: ${b[2]}e against ${a[2]}e.`, `E_kin = |q|·U: Die Energie hängt nur von der Ladung ab: ${b[2]}e gegen ${a[2]}e.`);
    const howV = L(`v = √(2·|q|·U/m) ∝ √(q/m): √((${b[2]}/${b[3]}) / (${a[2]}/${a[3]})) = ${nice(kv)}.`, `v = √(2·|q|·U/m) ∝ √(q/m): √((${b[2]}/${b[3]}) / (${a[2]}/${a[3]})) = ${nice(kv)}.`);
    const lab = (x) => (Math.abs(x - Math.SQRT1_2) < 1e-6 ? '×1/√2' : Math.abs(x - Math.SQRT2) < 1e-6 ? '×√2' : Math.abs(x - Math.sqrt(3)) < 1e-6 ? '×√3' : frac(x));
    return {
      kind: 'acc', title: L('The same voltage', 'Die gleiche Spannung'),
      text: L(`<p>${cap(L(...a[1]))} and ${L(...b[1])} are both accelerated from rest through ${nice(U)} V. (Masses: ${a[3]} u and ${b[3]} u; charges: ${a[2]}e and ${b[2]}e.)</p>`, `<p>${cap(L(...a[1]))} und ${L(...b[1])} werden beide aus der Ruhe mit ${nice(U)} V beschleunigt. (Massen: ${a[3]} u und ${b[3]} u; Ladungen: ${a[2]}e und ${b[2]}e.)</p>`), figs: '',
      questions: [
        choice('E', L(`(a) Compared with ${L(...a[1])}, the kinetic energy of ${L(...b[1])} is`, `(a) Verglichen mit ${L(...a[1]).replace(/^ein /, 'einem ')} ist die kinetische Energie von ${L(...b[1]).replace(/^ein /, 'einem ')}`), opt(kE, [b[3] / a[3], 1, kE * 2], howE)),
        choice('v', L(`(b) Compared with ${L(...a[1])}, the speed of ${L(...b[1])} is`, `(b) Verglichen mit ${L(...a[1]).replace(/^ein /, 'einem ')} ist die Geschwindigkeit von ${L(...b[1]).replace(/^ein /, 'einem ')}`), opt(kv, [kv * kv, 1 / kv, kE], howV, lab)),
      ],
      hints: [L('E_kin = |q|·U.', 'E_kin = |q|·U.'), L('v = √(2·|q|·U/m).', 'v = √(2·|q|·U/m).')],
      solution: [howE, howV], p: { a: a[0], b: b[0], U },
    };
  }
  function stop(seed) {
    const r = rng(seed * 79 + 47), pt = particle(r, r.pick([1, -1]), { generic: false }), Ek = r.pick([2, 5, 10, 50, 200]) * 1e3, z = Math.abs(pt.z), U = Ek / z;
    const fmtV = (x) => show(x, 'volt');
    const how = L(`The field must take away all the kinetic energy: |q|·U = E_kin, so U = ${nice(Ek / 1e3)} keV / ${z === 2 ? '2e' : 'e'} = ${fmtV(U)}.`, `Das Feld muss die ganze kinetische Energie wegnehmen: |q|·U = E_kin, also U = ${nice(Ek / 1e3)} keV / ${z === 2 ? '2e' : 'e'} = ${fmtV(U)}.`);
    const howD = pt.q > 0 ? L('A positive particle is slowed down when it moves towards higher potential.', 'Ein positives Teilchen wird abgebremst, wenn es sich zu höherem Potential bewegt.') : L('A negative particle is slowed down when it moves towards lower potential.', 'Ein negatives Teilchen wird abgebremst, wenn es sich zu tieferem Potential bewegt.');
    return {
      kind: 'acc', title: L('Stopping a particle', 'Ein Teilchen abbremsen'),
      text: L(`<p>${cap(pt.name())} with a kinetic energy of ${nice(Ek / 1e3)} keV flies towards a metal grid. What voltage between its start and the grid stops it just at the grid?</p>`, `<p>${cap(pt.name())} mit einer kinetischen Energie von ${nice(Ek / 1e3)} keV fliegt auf ein Metallgitter zu. Welche Spannung zwischen seinem Start und dem Gitter bremst es genau beim Gitter ab?</p>`), figs: '',
      questions: [
        choice('U', L('(a) the voltage', '(a) die Spannung'), values(U, z === 2 ? [{ value: Ek, tag: 'z', why: L(`An alpha particle has the charge 2e. ${how}`, `Ein Alphateilchen hat die Ladung 2e. ${how}`) }] : [{ value: Ek / 2, tag: 'half', why: how }], 'volt', how)),
        choice('d', L('(b) The grid must be at', '(b) Das Gitter muss liegen auf'), words(r, [[L('higher potential than the start', 'höherem Potential als der Start'), pt.q > 0, howD], [L('lower potential than the start', 'tieferem Potential als der Start'), pt.q < 0, howD]])),
      ],
      hints: [L('E_kin = |q|·U: an energy in eV divided by the charge in e gives a voltage in V.', 'E_kin = |q|·U: Eine Energie in eV geteilt durch die Ladung in e ergibt eine Spannung in V.'), DOWNHILL()],
      solution: [how, howD], p: { pt: pt.id, Ek },
    };
  }
  function ev(seed) {
    const r = rng(seed * 83 + 53), task = r.pick(['ion', 'joule', 'rel', 'mass']);
    if (task === 'ion') {
      const [name, z] = r.pick([['Pb²⁺', 2], ['Au³⁺', 3], ['U⁴⁺', 4], ['C⁶⁺', 6]]), Ek = r.pick([12, 30, 60, 120]), U = Ek / z;
      const how = L(`E_kin = z·e·U, so U = ${Ek} MeV / ${z}e = ${nice(U)} MV.`, `E_kin = z·e·U, also U = ${Ek} MeV / ${z}e = ${nice(U)} MV.`);
      return { kind: 'ev', title: L('The electronvolt', 'Das Elektronvolt'), text: L(`<p>A “${Ek} MeV ${name} ion” has gained its energy through an accelerating voltage.</p>`, `<p>Ein «${Ek}-MeV-${name}-Ion» hat seine Energie durch eine Beschleunigungsspannung erhalten.</p>`), figs: '',
        questions: [choice('U', L('the voltage', 'die Spannung'), values(U, [{ value: Ek, tag: 'z', why: L(`The ion carries ${z} elementary charges. ${how}`, `Das Ion trägt ${z} Elementarladungen. ${how}`) }, { value: Ek * z, tag: 'times', why: how }], null, how, { fmt: (x) => `${nice(x)} MV` }))],
        hints: [L('1 eV is the energy of one elementary charge moved through 1 V.', '1 eV ist die Energie einer Elementarladung, die 1 V durchläuft.')], solution: [how], p: { task, name, Ek } };
    }
    if (task === 'joule') {
      const Ek = r.pick([5, 25, 100, 511]), unit = r.pick(['keV', 'MeV']), J = Ek * (unit === 'keV' ? 1e3 : 1e6) * K.e;
      const how = L(`1 eV = 1.602 · 10⁻¹⁹ J: ${Ek} ${unit} = ${sci(J)} J.`, `1 eV = 1.602 · 10⁻¹⁹ J: ${Ek} ${unit} = ${sci(J)} J.`);
      return { kind: 'ev', title: L('The electronvolt', 'Das Elektronvolt'), text: L(`<p>Express ${Ek} ${unit} in joules.</p>`, `<p>Drücke ${Ek} ${unit} in Joule aus.</p>`), figs: '',
        questions: [choice('J', L('the energy in joules', 'die Energie in Joule'), values(J, [{ value: J / (unit === 'keV' ? 1e3 : 1e6), tag: 'prefix', why: L(`Mind the prefix ${unit[0]}. ${how}`, `Achte auf den Vorsatz ${unit[0]}. ${how}`) }, { value: (Ek * (unit === 'keV' ? 1e3 : 1e6)) / K.e * 1e-38, tag: 'div', why: how }], 'sci', how, { fmt: (x) => `${sci(x)} J` }))],
        hints: [L('1 eV = 1.602 · 10⁻¹⁹ J.', '1 eV = 1.602 · 10⁻¹⁹ J.')], solution: [how], p: { task, Ek, unit } };
    }
    if (task === 'rel') {
      const [name, E0, Eks] = r.pick([[['an electron', 'ein Elektron'], 511e3, [0.1e3, 5e3, 100e3, 1e6, 10e6]], [['a proton', 'ein Proton'], 938e6, [1e6, 20e6, 250e6, 7e12]]]), Ek = r.pick(Eks), ratio = Ek / E0, rel = ratio > 0.05;
      const fmt = (x) => (x >= 1e12 ? `${nice(x / 1e12)} TeV` : x >= 1e9 ? `${nice(x / 1e9)} GeV` : x >= 1e6 ? `${nice(x / 1e6)} MeV` : x >= 1e3 ? `${nice(x / 1e3)} keV` : `${nice(x)} eV`);
      const how = L(`Compare with the rest energy E₀ = ${fmt(E0)}: E_kin/E₀ = ${sci(ratio)}. The classical formula ½·m·v² is good only if E_kin ≪ E₀ (a few per cent at most).`, `Vergleiche mit der Ruheenergie E₀ = ${fmt(E0)}: E_kin/E₀ = ${sci(ratio)}. Die klassische Formel ½·m·v² ist nur gut, wenn E_kin ≪ E₀ (höchstens ein paar Prozent).`);
      return { kind: 'ev', title: L('Classical or relativistic?', 'Klassisch oder relativistisch?'), text: L(`<p>${cap(L(...name))} has a kinetic energy of ${fmt(Ek)}.</p>`, `<p>${cap(L(...name))} hat eine kinetische Energie von ${fmt(Ek)}.</p>`), figs: '',
        questions: [choice('r', L('To find its speed,', 'Um seine Geschwindigkeit zu finden,'), words(r, [[L('the classical formula ½·m·v² is good enough', 'genügt die klassische Formel ½·m·v²'), !rel, how], [L('relativity is needed', 'braucht es die Relativitätstheorie'), rel, how]]))],
        hints: [L('Electron: E₀ = 511 keV; proton: E₀ = 938 MeV.', 'Elektron: E₀ = 511 keV; Proton: E₀ = 938 MeV.')], solution: [how], p: { task, Ek, E0 } };
    }
    const [name, A] = r.pick([[['a carbon-12 atom', 'ein Kohlenstoff-12-Atom'], 12], [['a helium-4 atom', 'ein Helium-4-Atom'], 4.0026], [['an oxygen-16 atom', 'ein Sauerstoff-16-Atom'], 15.995], [['a uranium-238 atom', 'ein Uran-238-Atom'], 238.05]]);
    const p3 = (x) => Number(x.toPrecision(3)), mc2 = p3(A * 0.931494);
    const how = L(`1 u = 0.9315 GeV/c²: ${nice(A)} u = ${nice(mc2)} GeV/c².`, `1 u = 0.9315 GeV/c²: ${nice(A)} u = ${nice(mc2)} GeV/c².`);
    return { kind: 'ev', title: L('A mass in GeV/c²', 'Eine Masse in GeV/c²'), text: L(`<p>Express the mass of ${L(...name)} (${nice(A)} u) in GeV/c².</p>`, `<p>Drücke die Masse von ${L(...name).replace(/^ein /, 'einem ')} (${nice(A)} u) in GeV/c² aus.</p>`), figs: '',
      questions: [choice('m', L('the mass', 'die Masse'), values(mc2, [{ value: p3(A / 0.931494), tag: 'div', why: L('Multiply by the energy per u, do not divide.', 'Multipliziere mit der Energie pro u, teile nicht.') }, { value: p3(A * 931.494), tag: 'prefix', why: L('That would be in MeV/c²: mind the prefix.', 'Das wäre in MeV/c²: Achte auf den Vorsatz.') }], null, how, { fmt: (x) => `${nice(x)} GeV/c²`, extra: [2, 0.5] }))],
      hints: [L('1 u = 931.5 MeV/c² = 0.9315 GeV/c².', '1 u = 931.5 MeV/c² = 0.9315 GeV/c².')], solution: [how], p: { task, A } };
  }

  // ---------------------------------------------------------------- energy conservation
  function closest(seed) {
    const r = rng(seed * 89 + 59);
    let pa, pb, fE, fZ, kr;
    for (;;) {
      pa = r.pick(['p', 'a', 'd']); pb = r.next() < 0.6 ? r.pick(['p', 'a', 'd']) : pa; fE = r.pick([1, 2, 4, 0.5]); fZ = r.pick([1, 1, 2, 3, 0.5]);
      kr = (PROJ[pb][2] / PROJ[pa][2]) * fZ / fE;
      if ((pa !== pb) + (fE !== 1) + (fZ !== 1) >= 2 && whole(kr)) break;
    }
    const zr = PROJ[pb][2] / PROJ[pa][2], mr = PROJ[pb][3] / PROJ[pa][3];
    const parts = [];
    if (zr !== 1) parts.push(L(`the charge of the particle ${frac(zr)}`, `die Ladung des Teilchens ${frac(zr)}`));
    if (fZ !== 1) parts.push(L(`the charge of the nucleus ${frac(fZ)}`, `die Ladung des Kerns ${frac(fZ)}`));
    if (fE !== 1) parts.push(L(`the energy ${frac(fE)}, so ${frac(1 / fE)}`, `die Energie ${frac(fE)}, also ${frac(1 / fE)}`));
    const how = L(`At the closest point the particle stops for a moment: E_kin = k·q·Q/r_min, so r_min = k·q·Q/E_kin: ${parts.join('; ')}. Together: ${frac(kr)}. The mass does not matter.`, `Im nächsten Punkt hält das Teilchen kurz an: E_kin = k·q·Q/r_min, also r_min = k·q·Q/E_kin: ${parts.join('; ')}. Zusammen: ${frac(kr)}. Die Masse spielt keine Rolle.`);
    const howU = L(`At the closest point all the kinetic energy has become potential energy: ${frac(fE)}, like the kinetic energy.`, `Im nächsten Punkt ist die ganze kinetische Energie zu potentieller Energie geworden: ${frac(fE)}, wie die kinetische Energie.`);
    const rows = [[L('particle', 'Teilchen'), pcell(pa), pcell(pb)], [L('kinetic energy at the start', 'kinetische Energie am Start'), it('E'), times(fE, 'E')], [L('charge of the nucleus', 'Ladung des Kerns'), `${it('Z')}e`, `${fZ === 1 ? '' : fZ === 0.5 ? '½' : nice(fZ)}${it('Z')}e`]];
    return {
      kind: 'en', title: L('Closest approach', 'Kleinster Abstand'),
      text: L(`<p>In two experiments A and B, as in Rutherford's, a positive particle flies straight at a nucleus. The table compares them.${massNote(pa, pb)}</p>`, `<p>In zwei Versuchen A und B fliegt, wie bei Rutherford, ein positives Teilchen geradewegs auf einen Kern zu. Die Tabelle vergleicht sie.${massNote(pa, pb)}</p>`) + cmpTable(['A', 'B'], rows),
      figs: '',
      questions: [
        choice('r', L('(a) Compared with A, the closest distance in B is', '(a) Verglichen mit A ist der kleinste Abstand in B'), factors(kr, [[Math.sqrt(kr), L('The potential energy is k·q·Q/r, not /r².', 'Die potentielle Energie ist k·q·Q/r, nicht /r².')], [kr / mr, L('The mass does not matter: only the energy counts.', 'Die Masse spielt keine Rolle: Es zählt nur die Energie.')], [kr / zr, L('The charge of the particle counts too.', 'Die Ladung des Teilchens zählt auch.')], [1 / kr, L('A larger energy brings the particle closer.', 'Eine grössere Energie bringt das Teilchen näher heran.')]], how)),
        choice('U', L('(b) Compared with A, the potential energy at the closest point in B is', '(b) Verglichen mit A ist die potentielle Energie im nächsten Punkt in B'), factors(fE, [[zr * fZ, L('All the kinetic energy turns into potential energy.', 'Die ganze kinetische Energie wird zu potentieller Energie.')], [1, L('All the kinetic energy turns into potential energy.', 'Die ganze kinetische Energie wird zu potentieller Energie.')]], howU)),
      ],
      hints: [L('Energy conservation: at the closest point, E_kin = k·q·Q/r_min.', 'Energieerhaltung: Im nächsten Punkt ist E_kin = k·q·Q/r_min.'), L('Find the factor of each quantity in r_min = k·q·Q/E_kin.', 'Bestimme den Faktor jeder Grösse in r_min = k·q·Q/E_kin.')],
      solution: [how, howU], p: { pa, pb, fE, fZ },
    };
  }
  function repel(seed) {
    const r = rng(seed * 97 + 61);
    let pa, pb, fQ, fR, fV, fE, fv;
    for (;;) {
      pa = r.pick(['p', 'a', 'd']); pb = r.next() < 0.6 ? r.pick(['p', 'a', 'd']) : pa; fQ = r.pick([1, 2, 3, 4, 0.5]); fR = r.pick([1, 1, 2, 0.5]);
      fV = fQ / fR; fE = fV * PROJ[pb][2] / PROJ[pa][2]; fv = Math.sqrt(fE / (PROJ[pb][3] / PROJ[pa][3]));
      if ((pa !== pb) + (fQ !== 1) + (fR !== 1) >= 2 && whole(fV) && whole(fE) && rootable(fv)) break;
    }
    const zr = PROJ[pb][2] / PROJ[pa][2], mr = PROJ[pb][3] / PROJ[pa][3];
    const howV = L(`Outside, the sphere acts like a point charge at its centre: V = k·Q/R at its surface. Charge ${frac(fQ)}, radius ${frac(fR)}: ${frac(fV)}.`, `Aussen wirkt die Kugel wie eine Punktladung im Mittelpunkt: V = k·Q/R an ihrer Oberfläche. Ladung ${frac(fQ)}, Radius ${frac(fR)}: ${frac(fV)}.`);
    const howE = L(`The potential energy q·V at the surface becomes kinetic energy far away: E_kin = |q|·V. The potential ${frac(fV)}, the charge of the particle ${frac(zr)}: ${frac(fE)}.`, `Die potentielle Energie q·V an der Oberfläche wird weit weg zu kinetischer Energie: E_kin = |q|·V. Das Potential ${frac(fV)}, die Ladung des Teilchens ${frac(zr)}: ${frac(fE)}.`);
    const howS = L(`½·m·v² = E_kin, so v = √(2·E_kin/m): the energy ${frac(fE)}, the mass ${frac(mr)}: ${fac(fv)}.`, `½·m·v² = E_kin, also v = √(2·E_kin/m): die Energie ${frac(fE)}, die Masse ${frac(mr)}: ${fac(fv)}.`);
    const rows = [[L('charge of the sphere', 'Ladung der Kugel'), it('Q'), times(fQ, 'Q')], [L('radius of the sphere', 'Radius der Kugel'), it('R'), times(fR, 'R')], [L('particle', 'Teilchen'), pcell(pa), pcell(pb)]];
    return {
      kind: 'en', title: L('Repelled by a sphere', 'Von einer Kugel abgestossen'),
      text: L(`<p>In two experiments A and B, a positively charged metal sphere repels a positive particle that starts at rest at its surface and flies away. The table compares them.${massNote(pa, pb)}</p>`, `<p>In zwei Versuchen A und B stösst eine positiv geladene Metallkugel ein positives Teilchen ab, das in Ruhe an ihrer Oberfläche startet und davonfliegt. Die Tabelle vergleicht sie.${massNote(pa, pb)}</p>`) + cmpTable(['A', 'B'], rows),
      figs: '',
      questions: [
        choice('V', L('(a) Compared with A, the potential at the surface in B is', '(a) Verglichen mit A ist das Potential an der Oberfläche in B'), factors(fV, [[fQ / (fR * fR), L('That is how the field depends on the radius: k·Q/R². The potential is k·Q/R.', 'So hängt das Feld vom Radius ab: k·Q/R². Das Potential ist k·Q/R.')], [fQ * fR, L('A larger sphere with the same charge has a lower potential.', 'Eine grössere Kugel mit derselben Ladung hat ein tieferes Potential.')]], howV)),
        choice('E', L('(b) Compared with A, the kinetic energy far away in B is', '(b) Verglichen mit A ist die kinetische Energie weit weg in B'), factors(fE, [[fV, L('The energy depends on the charge of the particle too: E_kin = |q|·V.', 'Die Energie hängt auch von der Ladung des Teilchens ab: E_kin = |q|·V.')], [fE / mr, L('The mass does not matter for the energy.', 'Für die Energie spielt die Masse keine Rolle.')]], howE)),
        choice('v', L('(c) Compared with A, the speed far away in B is', '(c) Verglichen mit A ist die Geschwindigkeit weit weg in B'), factors(fv, [[fv * fv, L('The speed grows with the square root of the energy.', 'Die Geschwindigkeit wächst mit der Wurzel aus der Energie.')], [Math.sqrt(fE), L('A heavier particle is slower with the same energy.', 'Ein schwereres Teilchen ist bei gleicher Energie langsamer.')]], howS)),
      ],
      hints: [L('Outside, a charged sphere acts like a point charge at its centre: V = k·Q/R at its surface.', 'Aussen wirkt eine geladene Kugel wie eine Punktladung im Mittelpunkt: V = k·Q/R an ihrer Oberfläche.'), L('Energy conservation: |q|·V at the surface becomes ½·m·v² far away.', 'Energieerhaltung: |q|·V an der Oberfläche wird weit weg zu ½·m·v².')],
      solution: [howV, howE, howS], p: { pa, pb, fQ, fR },
    };
  }

  // ---------------------------------------------------------------- statements
  const BANK = [
    [() => L('The potential is a number with a sign, not a vector.', 'Das Potential ist eine Zahl mit Vorzeichen, kein Vektor.'), true, () => L('Potentials of several charges simply add.', 'Die Potentiale mehrerer Ladungen addieren sich einfach.')],
    [() => L('Where the field is zero, the potential is zero too.', 'Wo das Feld null ist, ist auch das Potential null.'), false, () => L('Between two equal positive charges, E = 0 at the middle, but V > 0.', 'Zwischen zwei gleichen positiven Ladungen ist in der Mitte E = 0, aber V > 0.')],
    [() => L('The potential falls in the direction of the field.', 'Das Potential fällt in Feldrichtung.'), true, () => L('E points from high to low potential.', 'E zeigt von hohem zu tiefem Potential.')],
    [() => L('Moving a charge along an equipotential line needs no work.', 'Eine Ladung längs einer Äquipotentiallinie zu bewegen, braucht keine Arbeit.'), true, () => L('The potential, and so the potential energy, stays the same.', 'Das Potential, und damit die potentielle Energie, bleibt gleich.')],
    [() => L('Equipotential lines and field lines meet at right angles.', 'Äquipotentiallinien und Feldlinien treffen sich senkrecht.'), true, () => L('Along an equipotential the field does no work.', 'Längs einer Äquipotentiallinie verrichtet das Feld keine Arbeit.')],
    [() => L('Around a point charge, equipotential circles for equal steps of potential are equally spaced.', 'Um eine Punktladung liegen Äquipotentialkreise für gleiche Potentialschritte gleich weit auseinander.'), false, () => L('V ∝ 1/r: they get farther apart outwards.', 'V ∝ 1/r: Sie liegen nach aussen immer weiter auseinander.')],
    [() => L('In a uniform field, the potential changes evenly along the field lines.', 'In einem homogenen Feld ändert sich das Potential längs der Feldlinien gleichmässig.'), true, () => L('ΔV = −E·Δx.', 'ΔV = −E·Δx.')],
    [() => L('A positive charge released at rest moves towards higher potential.', 'Eine in Ruhe losgelassene positive Ladung bewegt sich zu höherem Potential.'), false, () => L('Towards lower potential; a negative charge towards higher.', 'Zu tieferem Potential; eine negative Ladung zu höherem.')],
    [() => L('An electron accelerated through 1 V gains 1 eV.', 'Ein Elektron, das 1 V durchläuft, gewinnt 1 eV.'), true, () => L('That is the definition of the electronvolt.', 'Das ist die Definition des Elektronvolts.')],
    [() => L('An alpha particle accelerated through 1 kV gains 1 keV.', 'Ein Alphateilchen, das 1 kV durchläuft, gewinnt 1 keV.'), false, () => L('Its charge is 2e: it gains 2 keV.', 'Seine Ladung ist 2e: Es gewinnt 2 keV.')],
    [() => L('Through the same voltage, a proton and an electron gain the same kinetic energy.', 'Mit derselben Spannung gewinnen ein Proton und ein Elektron dieselbe kinetische Energie.'), true, () => L('E_kin = |q|·U, and both have |q| = e.', 'E_kin = |q|·U, und beide haben |q| = e.')],
    [() => L('Through the same voltage, a proton and an electron reach the same speed.', 'Mit derselben Spannung erreichen ein Proton und ein Elektron dieselbe Geschwindigkeit.'), false, () => L('Same energy, much smaller mass: the electron is about 43 times faster.', 'Gleiche Energie, viel kleinere Masse: Das Elektron ist etwa 43-mal schneller.')],
    [() => L('Doubling the accelerating voltage doubles the speed.', 'Verdoppelt man die Beschleunigungsspannung, verdoppelt sich die Geschwindigkeit.'), false, () => L('v ∝ √U: ×√2.', 'v ∝ √U: ×√2.')],
    [() => L('The work done by the field on a charge does not depend on its path.', 'Die Arbeit, die das Feld an einer Ladung verrichtet, hängt nicht von ihrem Weg ab.'), true, () => L('It depends only on q and the potentials at the start and the end.', 'Sie hängt nur von q und den Potentialen am Anfang und am Ende ab.')],
    [() => L('The zero of the potential can be chosen freely.', 'Der Nullpunkt des Potentials kann frei gewählt werden.'), true, () => L('Only differences of potential matter.', 'Nur Potentialdifferenzen zählen.')],
    [() => L('The potential of a negative point charge is negative everywhere (zero far away).', 'Das Potential einer negativen Punktladung ist überall negativ (weit weg null).'), true, () => L('V = k·Q/r with Q < 0.', 'V = k·Q/r mit Q < 0.')],
    [() => L('At the centre of a square of four equal positive charges, field and potential are both zero.', 'Im Mittelpunkt eines Quadrats aus vier gleichen positiven Ladungen sind Feld und Potential beide null.'), false, () => L('The field is zero, the potential is not: 4·k·q/r.', 'Das Feld ist null, das Potential nicht: 4·k·q/r.')],
    [() => L('Halfway between a positive and a negative charge of the same size, the potential is zero.', 'In der Mitte zwischen einer positiven und einer negativen Ladung gleichen Betrags ist das Potential null.'), true, () => L('Equal and opposite contributions; the field there is not zero.', 'Gleiche, entgegengesetzte Beiträge; das Feld dort ist nicht null.')],
    [() => L('The unit V/m for the field is the same as N/C.', 'Die Einheit V/m für das Feld ist dieselbe wie N/C.'), true, () => L('1 V/m = 1 J/(C·m) = 1 N/C.', '1 V/m = 1 J/(C·m) = 1 N/C.')],
    [() => L('Where the equipotential lines are closer together, the field is stronger.', 'Wo die Äquipotentiallinien dichter liegen, ist das Feld stärker.'), true, () => L('E = |ΔV|/Δx: the same ΔV over a shorter distance.', 'E = |ΔV|/Δx: dasselbe ΔV auf kürzerer Strecke.')],
    [() => L('Where the potential is constant along x, the field along x is zero.', 'Wo das Potential längs x konstant ist, ist das Feld längs x null.'), true, () => L('E = −dV/dx = 0.', 'E = −dV/dx = 0.')],
    [() => L('The potential energy of an electron is high where the potential is high.', 'Die potentielle Energie eines Elektrons ist dort hoch, wo das Potential hoch ist.'), false, () => L('q·V with q < 0: where V is high, its potential energy is low.', 'q·V mit q < 0: Wo V hoch ist, ist seine potentielle Energie tief.')],
    [() => L('A 1 MeV electron is relativistic.', 'Ein 1-MeV-Elektron ist relativistisch.'), true, () => L('Its kinetic energy exceeds its rest energy of 511 keV.', 'Seine kinetische Energie übersteigt seine Ruheenergie von 511 keV.')],
    [() => L('A 1 MeV proton is relativistic.', 'Ein 1-MeV-Proton ist relativistisch.'), false, () => L('1 MeV is about 0.1 % of its rest energy of 938 MeV: classical is fine.', '1 MeV ist etwa 0.1 % seiner Ruheenergie von 938 MeV: klassisch genügt.')],
    [() => L('Inside a charged metal sphere, the potential is zero.', 'Im Innern einer geladenen Metallkugel ist das Potential null.'), false, () => L('The field is zero inside, so the potential is constant: equal to that of the surface.', 'Das Feld ist innen null, also ist das Potential konstant: gleich dem der Oberfläche.')],
    [() => L('Two charges of the same sign have more potential energy when closer together.', 'Zwei Ladungen gleichen Vorzeichens haben mehr potentielle Energie, wenn sie näher beieinander sind.'), true, () => L('E_pot = k·q₁·q₂/r > 0 grows as r shrinks: it takes work to push them together.', 'E_pot = k·q₁·q₂/r > 0 wächst, wenn r kleiner wird: Es braucht Arbeit, sie zusammenzuschieben.')],
    [() => L('The voltage of a battery is a potential difference.', 'Die Spannung einer Batterie ist eine Potentialdifferenz.'), true, () => L('Between its two terminals.', 'Zwischen ihren beiden Polen.')],
    [() => L('In a uniform field, |ΔV| = E·d where d is the straight distance between the two points.', 'Im homogenen Feld ist |ΔV| = E·d, wobei d der direkte Abstand der beiden Punkte ist.'), false, () => L('d is measured along the field lines.', 'd wird längs der Feldlinien gemessen.')],
    [() => L('The potential of a point charge falls with 1/r², like its field.', 'Das Potential einer Punktladung fällt mit 1/r², wie ihr Feld.'), false, () => L('V ∝ 1/r, E ∝ 1/r².', 'V ∝ 1/r, E ∝ 1/r².')],
    [() => L('A negative charge gains kinetic energy when it moves towards higher potential.', 'Eine negative Ladung gewinnt kinetische Energie, wenn sie sich zu höherem Potential bewegt.'), true, () => L('W = q·(V_A − V_B) > 0 for q < 0 and V_B > V_A.', 'W = q·(V_A − V_B) > 0 für q < 0 und V_B > V_A.')],
  ];
  function statements(seed) {
    const r = rng(seed * 101 + 67);
    for (;;) {
      const pick = r.shuffle(BANK.slice()).slice(0, 5);
      if (pick.every((s) => s[1]) || pick.every((s) => !s[1])) continue;
      return {
        kind: 'stmts', title: L('Which statements are correct?', 'Welche Aussagen sind richtig?'), text: L('<p>Tick all the statements that are correct.</p>', '<p>Kreuze alle richtigen Aussagen an.</p>'), figs: '',
        questions: [{ type: 'multi', key: 's', label: L('Which statements are correct?', 'Welche Aussagen sind richtig?'), statements: pick.map(([h, ok, why]) => ({ html: h(), ok, why: why() })) }],
        hints: [RULE(), DOWNHILL()], solution: pick.map(([h, ok, why]) => `${ok ? '✓' : '✗'} ${h()} ${why()}`), p: { s: pick.map((x) => BANK.indexOf(x)) },
      };
    }
  }

  const TYPES = {
    'points-v': [2, pointsV], 'which-way': [1, whichWay], 'uniform-d': [2, uniformD], v2e: [2, (s) => v2e(s, false)], e2v: [3, (s) => v2e(s, true)],
    'equi-pick': [2, equiPick], 'lines-equi': [2, linesEqui], 'point-v': [3, pointV], scalar: [3, scalar],
    accel: [3, accel], 'accel-compare': [3, accelCompare], stop: [2, stop], ev: [2, ev], closest: [4, closest], repel: [4, repel], stmts: [2, statements],
  };
  function make(type, seed) {
    const [difficulty, f] = TYPES[type];
    return { ...f(seed), type, difficulty, id: `${type}-${seed}`, seed };
  }
  const api = { TYPES: Object.keys(TYPES), make, RULE, DOWNHILL, vGraph, eGraph, EQ, SC, vec, sgn, frac };
  root.PotEx = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
