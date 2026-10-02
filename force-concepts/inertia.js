// Inertia: without a net force a body keeps its velocity. A brief kick adds a velocity (as an
// arrow), a body released from a circle goes straight on along the tangent, and a probe whose
// engine is switched off keeps its speed.
(function (root) {
  'use strict';

  const FC = root.FC || require('./core.js');
  const D = root.Draw || require('./draw.js');
  const { T, F, FL, cap, num, qty, deg, noun, o, q, register } = FC;
  // German possessive for a feminine thing (Geschwindigkeit) owned by N: seine/ihre.
  const poss = (N) => (N.g === 'f' ? 'ihre' : 'seine');

  // ================================================================ kick: a brief push sideways
  const TRIPLES = [[4, 3], [3, 4], [8, 6], [6, 8], [12, 5], [5, 12]];

  function kick(r, p) {
    const obj = p.obj || r.pick(['puck', 'probe']);
    const [v, u] = p.vu || r.pick(TRIPLES);
    const s = p.side || r.pick([1, -1]); // 1: kick to the north (up in the picture)
    const side = s > 0 ? 'north' : 'south';
    const w = Math.hypot(v, u), th = Math.atan2(u, v);
    const puckish = obj === 'puck';
    const name = puckish ? 'puck' : 'probe';
    const N = puckish ? noun('m', 'Puck') : noun('f', 'Sonde');
    const K = puckish ? noun('m', 'Schlag') : noun('m', 'Schub'); // the kick, in German
    const dSide = s > 0 ? 'Norden' : 'Süden', dAdj = s > 0 ? 'nördlich' : 'südlich';

    // ---------------------------------------------------------- figure (top view, north up)
    const Py = s > 0 ? 150 : 50, P = [150, Py], k = 64 / Math.max(v, u);
    const body = (x, y, cls, fire) => {
      const b = puckish ? D.puck(x, y, 10) : D.probe(x, y, [1, 0], fire ? [0, -s] : null, 0.75);
      return cls ? D.ghost(b) : b;
    };
    function figure(o = {}) {
      let g = D.rect(0, 0, 380, 200, puckish ? 'ice' : 'space', 6);
      g += D.arrow(352, 46, 352, 18, 'ax', 'N', { head: 7, at: [352, 58] });
      g += D.line(10, Py, P[0], Py, 'trace');
      [30, 70, 110].forEach((x) => { g += body(x, Py, 'ghost'); });
      if (o.after) {
        // to the edge of the picture; ghosts every 50 px along the way
        const len = Math.min(200 / Math.cos(th), (Py - 10 > 0 && s > 0 ? Py - 10 : 190 - Py) / Math.sin(th));
        const step = 50;
        const ex = P[0] + len * Math.cos(th), ey = Py - s * len * Math.sin(th);
        g += D.line(P[0], Py, ex, ey, 'trace strong');
        [1, 2, 3].filter((j) => j * step < len - 12).forEach((j) => { g += body(P[0] + j * step * Math.cos(th), Py - s * j * step * Math.sin(th), 'ghost'); });
        g += D.line(P[0], Py, P[0] + 60, Py, 'guide') + D.text(P[0] + 64, Py - s * 12 + 4, `θ ≈ ${deg(th)}°`, 'lbl small', 'start');
      }
      if (o.triangle) {
        const tx = P[0] + k * v;
        g += D.arrow(P[0], Py, tx, Py, 'v', 'v', { at: [(P[0] + tx) / 2, Py + s * 18 + 4] });
        g += D.arrow(tx, Py, tx, Py - s * k * u, 'v', 'u', { cls: 'alt', at: [tx + 10, Py - s * k * u * 0.5 + 4], anchor: 'start' });
        g += D.arrow(P[0], Py, tx, Py - s * k * u, 'v', "v'", { cls: 'strong', at: [P[0] + k * v * 0.45 - 10, Py - s * k * u * 0.5 - 4], anchor: 'end' });
      } else if (!o.after) {
        g += D.arrow(P[0] + 16, Py, P[0] + 16 + k * v, Py, 'v', 'v');
      }
      if (o.kick !== false && !o.after && !o.triangle) g += D.arrow(P[0] + (puckish ? 0 : 26), Py + s * 50, P[0] + (puckish ? 0 : 26), Py + s * 15, 'f', puckish ? T('kick', 'Schlag') : T('burst', 'Schub'), { at: [P[0] + (puckish ? 8 : 34), Py + s * 40 + 4], anchor: 'start', head: 12 });
      g += body(P[0], Py, false, !puckish && o.kick !== false && !o.after && !o.triangle) + D.text(P[0] - 14, Py + s * 16 + 4, 'P', 'lbl', 'end');
      return D.svg(380, 200, g, T(`Top view: the ${name} moves east and is pushed ${side} at P`, `Ansicht von oben: ${N.nom} bewegt sich nach Osten und wird in P nach ${dSide} gestossen`));
    }

    // Options: paths from P (small top views).
    const pic = (d) => {
      const y = s > 0 ? 92 : 18;
      const g = D.line(2, y, 28, y, 'trace') + D.path(d(28, y), 'opt-path') + (puckish ? D.puck(28, y, 6) : D.probe(28, y, [1, 0], null, 0.45));
      return D.svg(150, 110, g, T('path', 'Bahn'));
    };
    const L = 82;
    const PATH = {
      ok: (x, y) => `M${x} ${y} L${D.n(x + L * Math.cos(th))} ${D.n(y - s * L * Math.sin(th))}`,
      north: (x, y) => `M${x} ${y} V${y - s * 74}`,
      east: (x, y) => `M${x} ${y} H${x + 112}`,
      curve: (x, y) => `M${x} ${y} Q${x + 62} ${y} ${x + 68} ${y - s * 74}`,
    };
    const kickWord = puckish ? 'kick' : 'burst of the thruster';
    const nach = T('after the ' + kickWord, `nach ${K.dat}`); // “nach dem Schlag”
    const after = T(`After the ${kickWord}, no force acts any more, so the ${name} moves in a straight line at constant speed`,
      `Nach ${K.dat} wirkt keine Kraft mehr, also bewegt sich ${N.nom} geradlinig mit konstanter Geschwindigkeit`);
    const root2 = `√(${v}² + ${u}²)`;
    const questions = [
      q(r, 'path', T(`Which path does the ${name} follow after the ${kickWord}?`, `Welche Bahn beschreibt ${N.nom} ${nach}?`), [
        o(pic(PATH.ok), 'ok', T(`Right: the ${kickWord} adds a velocity ${side}ward to the velocity east. ${after}, in the direction of the new velocity.`,
          `Richtig: ${cap(K.nom)} fügt zur Geschwindigkeit nach Osten eine Geschwindigkeit nach ${dSide} hinzu. ${after}, in Richtung der neuen Geschwindigkeit.`),
          T(`a straight line, slanting ${side} of east by about ${deg(th)}°`, `eine Gerade, etwa ${deg(th)}° ${dAdj} von Osten`)),
        o(pic(PATH.north), 'last-force', T(`The ${name} does not forget its velocity east: the ${kickWord} only adds a velocity ${side}ward. The new velocity is the sum of both.`,
          `${cap(N.nom)} vergisst ${poss(N)} Geschwindigkeit nach Osten nicht: ${cap(K.nom)} fügt nur eine Geschwindigkeit nach ${dSide} hinzu. Die neue Geschwindigkeit ist die Summe von beiden.`),
          T(`straight ${side}`, `geradeaus nach ${dSide}`)),
        o(pic(PATH.east), 'other', T(`The ${kickWord} is short, but it does change the velocity: it adds ${qty(u, 'm/s')} ${side}ward, which stays after the ${kickWord}.`,
          `${cap(K.nom)} ist kurz, aber er ändert die Geschwindigkeit: Er fügt ${qty(u, 'm/s')} nach ${dSide} hinzu, und das bleibt auch ${nach}.`),
          T('straight on to the east', 'geradeaus weiter nach Osten')),
        o(pic(PATH.curve), 'impetus', T(`There is no old motion that dies away and a new one that takes over. ${after}: a straight line.`,
          `Es gibt keine alte Bewegung, die abklingt, und keine neue, die übernimmt. ${after}: eine Gerade.`),
          T(`a curve that turns from east to ${side}`, `eine Kurve, die von Osten nach ${dSide} dreht`)),
      ], true),
      q(r, 'speed', T(`What is the speed of the ${name} right after the ${kickWord}?`, `Wie gross ist die Geschwindigkeit ${puckish ? 'des Pucks' : 'der Sonde'} direkt ${nach}?`), [
        o(qty(w, 'm/s'), 'ok', T(`Right: the velocities add as arrows at right angles: ${root2} m/s = ${num(w)} m/s.`, `Richtig: Die Geschwindigkeiten addieren sich als Pfeile im rechten Winkel: ${root2} m/s = ${num(w)} m/s.`)),
        o(qty(v + u, 'm/s'), 'vector-add', T(`${v} + ${u} would be right if both velocities pointed the same way. At right angles they add as arrows: ${root2}.`,
          `${v} + ${u} wäre richtig, wenn beide Geschwindigkeiten in dieselbe Richtung zeigten. Im rechten Winkel addieren sie sich als Pfeile: ${root2}.`)),
        o(qty(v, 'm/s'), 'other', T(`The ${kickWord} does not only turn the velocity, it adds a velocity ${side}ward: the speed becomes ${root2}.`,
          `${cap(K.nom)} dreht die Geschwindigkeit nicht nur, er fügt eine Geschwindigkeit nach ${dSide} hinzu: Der Betrag wird ${root2}.`)),
        o(qty(u, 'm/s'), 'last-force', T(`The velocity east is not lost: the new velocity is the sum of ${v} m/s east and ${u} m/s ${side}.`,
          `Die Geschwindigkeit nach Osten geht nicht verloren: Die neue Geschwindigkeit ist die Summe von ${v} m/s nach Osten und ${u} m/s nach ${dSide}.`)),
        o(qty(Math.abs(v - u), 'm/s'), 'vector-add', T(`Subtracting would be right if the two velocities pointed in opposite directions. At right angles they add as arrows: ${root2}.`,
          `Subtrahieren wäre richtig, wenn die beiden Geschwindigkeiten entgegengesetzt wären. Im rechten Winkel addieren sie sich als Pfeile: ${root2}.`)),
      ]),
    ];

    const steps = [
      { title: T('Before the kick', `Vor ${K.dat}`), figure: figure({ kick: false }),
        text: T(`${puckish ? `On the smooth ice no horizontal force acts on the puck (its weight and the push of the ice cancel).` : `Far from any planet, with the engine off, no force acts on the probe.`} So it moves in a straight line at constant speed, <i>v</i> = ${qty(v, 'm/s')} east.`,
          `${puckish ? 'Auf dem glatten Eis wirkt keine horizontale Kraft auf den Puck (Gewichtskraft und Normalkraft des Eises heben sich auf).' : 'Weit weg von jedem Planeten und mit abgeschaltetem Triebwerk wirkt keine Kraft auf die Sonde.'} Also bewegt ${puckish ? 'er' : 'sie'} sich geradlinig mit konstanter Geschwindigkeit, <i>v</i> = ${qty(v, 'm/s')} nach Osten.`) },
      { title: T(`During the ${kickWord}`, `Während ${puckish ? 'des Schlags' : 'des Schubs'}`), figure: figure({ triangle: true }),
        text: T(`For a moment a force acts ${side}ward. It changes the velocity: on its own it would give the ${name} ${qty(u, 'm/s')} ${side}ward, so it adds <i>u</i> = ${qty(u, 'm/s')} ${side}ward to the velocity. Velocities add as arrows: <i>v'</i> = <i>v</i> + <i>u</i> (head to tail), with size ${root2} m/s = ${qty(w, 'm/s')}.`,
          `Einen Moment lang wirkt eine Kraft nach ${dSide}. Sie ändert die Geschwindigkeit: Allein würde sie ${N.dat} ${qty(u, 'm/s')} nach ${dSide} geben, also fügt sie der Geschwindigkeit <i>u</i> = ${qty(u, 'm/s')} nach ${dSide} hinzu. Geschwindigkeiten addieren sich als Pfeile: <i>v'</i> = <i>v</i> + <i>u</i> (Pfeile aneinanderhängen), mit dem Betrag ${root2} m/s = ${qty(w, 'm/s')}.`) },
      { title: T(`After the ${kickWord}`, cap(nach)), figure: figure({ after: true }),
        text: T(`Again no force acts: the ${name} moves on in a straight line at constant speed ${qty(w, 'm/s')}, in the direction of <i>v'</i>: tan θ = <i>u</i>/<i>v</i> = ${u}/${v}, so θ ≈ ${deg(th)}° ${side} of east.`,
          `Wieder wirkt keine Kraft: ${cap(N.nom)} bewegt sich geradlinig mit konstant ${qty(w, 'm/s')} weiter, in Richtung von <i>v'</i>: tan θ = <i>u</i>/<i>v</i> = ${u}/${v}, also θ ≈ ${deg(th)}° ${dAdj} von Osten.`) },
    ];

    return {
      title: puckish ? T('A kick on the ice', 'Ein Schlag auf dem Eis') : T('A side thruster', 'Eine Seitendüse'),
      situation: puckish
        ? T(`<p>A puck slides east on smooth ice (friction is negligible) at <i>v</i> = ${qty(v, 'm/s')}. At the point P it gets a short, sharp kick toward the ${side}. On its own, this kick would give a resting puck a speed of <i>u</i> = ${qty(u, 'm/s')}. The picture shows the ice from above.</p>`,
          `<p>Ein Puck gleitet mit <i>v</i> = ${qty(v, 'm/s')} auf glattem Eis nach Osten (Reibung vernachlässigbar). Im Punkt P bekommt er einen kurzen, harten Schlag nach ${dSide}. Allein würde dieser Schlag einem ruhenden Puck die Geschwindigkeit <i>u</i> = ${qty(u, 'm/s')} geben. Das Bild zeigt das Eis von oben.</p>`)
        : T(`<p>A space probe drifts east with its engine off, far from any planet, at <i>v</i> = ${qty(v, 'm/s')}. At the point P a side thruster fires a short burst toward the ${side}. On its own, this burst would give a resting probe a speed of <i>u</i> = ${qty(u, 'm/s')}. The picture shows the probe from above.</p>`,
          `<p>Eine Raumsonde treibt weit weg von jedem Planeten mit abgeschaltetem Triebwerk nach Osten, mit <i>v</i> = ${qty(v, 'm/s')}. Im Punkt P gibt eine Seitendüse einen kurzen Schub nach ${dSide}. Allein würde dieser Schub einer ruhenden Sonde die Geschwindigkeit <i>u</i> = ${qty(u, 'm/s')} geben. Das Bild zeigt die Sonde von oben.</p>`),
      figure: figure(),
      questions,
      hints: [
        T(`Split the motion into three parts: before, during and after the ${kickWord}. Which forces act on the ${name} in each part?`,
          `Teile die Bewegung in drei Abschnitte: vor, während und ${nach}. Welche Kräfte wirken in jedem Abschnitt auf ${N.acc}?`),
        T(`Plan: before and after, the first law applies (no force). During the ${kickWord}, a short force adds a velocity in its own direction.`,
          `Plan: Vorher und nachher gilt das erste Newtonsche Gesetz (keine Kraft). Während ${puckish ? 'des Schlags' : 'des Schubs'} fügt eine kurze Kraft eine Geschwindigkeit in ihrer eigenen Richtung hinzu.`),
        T(`Velocities add as arrows: <i>v'</i> = <i>v</i> + <i>u</i>. At right angles, the size is √(<i>v</i>² + <i>u</i>²) and tan θ = <i>u</i>/<i>v</i>.`,
          `Geschwindigkeiten addieren sich als Pfeile: <i>v'</i> = <i>v</i> + <i>u</i>. Im rechten Winkel ist der Betrag √(<i>v</i>² + <i>u</i>²) und tan θ = <i>u</i>/<i>v</i>.`),
        T(`Here: ${qty(v, 'm/s')} east plus ${qty(u, 'm/s')} ${side}. Draw the two arrows head to tail. After the ${kickWord}, no force acts.`,
          `Hier: ${qty(v, 'm/s')} nach Osten plus ${qty(u, 'm/s')} nach ${dSide}. Zeichne die beiden Pfeile aneinandergehängt. ${cap(nach)} wirkt keine Kraft.`),
      ],
      steps,
    };
  }

  // ================================================================ circle: leaving a circular path
  function circle(r, p) {
    const variant = p.variant || r.pick(['channel', 'string']);
    const s = p.sense || r.pick([1, -1]); // 1: clockwise in the picture
    const phi = ((p.angle != null ? p.angle : r.pick([0, 45, 90, 135, 180, 225, 270, 315])) * Math.PI) / 180;
    const channel = variant === 'channel', obj = channel ? 'ball' : 'stone';
    const N = channel ? noun('f', 'Kugel') : noun('m', 'Stein');
    const n = [Math.cos(phi), Math.sin(phi)], t = [-s * Math.sin(phi), s * Math.cos(phi)];
    const FN = F('N'), FT = F('T');

    const pt = (c, R, a) => [c[0] + R * Math.cos(a), c[1] + R * Math.sin(a)];
    // Arc of radius R around c from angle a0 to a1 (in the sense s).
    const arc = (c, R, a0, a1) => {
      const [x0, y0] = pt(c, R, a0), [x1, y1] = pt(c, R, a1);
      return `M${D.n(x0)} ${D.n(y0)} A${R} ${R} 0 ${Math.abs(a1 - a0) > Math.PI ? 1 : 0} ${s > 0 ? 1 : 0} ${D.n(x1)} ${D.n(y1)}`;
    };
    const start = phi - s * 1.5 * Math.PI;
    function track(c, R, wide) {
      if (channel) return D.path(arc(c, R, start, phi), 'channel' + (wide ? '' : ' thin-ch')) + D.path(arc(c, R, start, phi), 'channel-mid');
      return `<circle class="trace" cx="${D.n(c[0])}" cy="${D.n(c[1])}" r="${R}" fill="none"/>` + D.dot(c[0], c[1], 3.5, 'pin');
    }

    // ---------------------------------------------------------- figure (top view)
    const C = [170, 135], R = 80, P = pt(C, R, phi);
    function figure(o = {}) {
      let g = D.rect(0, 0, 340, 270, channel ? 'table-top' : 'ice', 6) + track(C, R, true);
      if (o.inward) [-0.5, -1.1, -1.7].forEach((da, i) => {
        const a = phi + s * da, [x, y] = pt(C, R, a);
        g += D.ghost(D.ball(x, y, 8)) + D.arrow(x, y, x - 34 * Math.cos(a), y - 34 * Math.sin(a), 'f', i ? '' : channel ? FL('N') : FL('T'), { at: [x - 44 * Math.cos(a), y - 44 * Math.sin(a) + 4], anchor: 'middle' });
      });
      if (o.tangent) {
        g += D.line(P[0], P[1], P[0] + 170 * t[0], P[1] + 170 * t[1], 'trace strong');
        [1, 2, 3].forEach((j) => { g += D.ghost(D.ball(P[0] + 42 * j * t[0], P[1] + 42 * j * t[1], 8)); });
      }
      if (o.compare) {
        g += D.path(arc(C, R, phi, phi + s * 0.5 * Math.PI), 'guide');
        g += D.line(P[0], P[1], P[0] + 60 * n[0], P[1] + 60 * n[1], 'guide');
      }
      if (!channel && !o.tangent) g += D.line(C[0], C[1], P[0], P[1], 'cable');
      g += D.ball(P[0], P[1], 8) + D.text(P[0] + 16 * n[0] - 10 * t[0], P[1] + 16 * n[1] - 10 * t[1] + 4, 'P', 'lbl');
      if (!o.inward && !o.tangent) g += D.arrow(P[0], P[1], P[0] + 46 * t[0], P[1] + 46 * t[1], 'v', 'v');
      return D.svg(340, 270, g, channel
        ? T('Top view: a ball rolls through a curved channel and leaves it at P', 'Ansicht von oben: Eine Kugel rollt durch eine gebogene Rinne und verlässt sie in P')
        : T('Top view: a stone whirled on a string; the string breaks at P', 'Ansicht von oben: ein Stein an einer Schnur im Kreis; in P reisst die Schnur'));
    }

    const c2 = [75, 75], R2 = 34, P2 = pt(c2, R2, phi);
    const pic = (d) => D.svg(150, 150, track(c2, R2, false) + D.path(d, 'opt-path') + D.ball(P2[0], P2[1], 5), T('path', 'Bahn'));
    const seg = (dx, dy) => `M${D.n(P2[0])} ${D.n(P2[1])} L${D.n(P2[0] + dx)} ${D.n(P2[1] + dy)}`;
    const PATH = {
      tangent: seg(56 * t[0], 56 * t[1]),
      circle: arc(c2, R2, phi, phi + s * 0.47 * Math.PI),
      radial: seg(38 * n[0], 38 * n[1]),
      outward: `M${D.n(P2[0])} ${D.n(P2[1])} Q${D.n(P2[0] + 28 * t[0])} ${D.n(P2[1] + 28 * t[1])} ${D.n(P2[0] + 30 * t[0] + 32 * n[0])} ${D.n(P2[1] + 30 * t[1] + 32 * n[1])}`,
    };
    const release = channel ? T('leaves the channel', 'die Rinne verlassen hat') : T('is released', 'losgelassen wurde');
    const noSide = T(`After P nothing pushes the ${obj} sideways any more${channel ? ': the channel wall is gone' : ': the string no longer pulls'}.`,
      `Nach P drückt nichts mehr seitlich auf ${N.acc}${channel ? ': Die Wand der Rinne ist weg' : ': Die Schnur zieht nicht mehr'}.`);
    const holder = channel ? T('The channel wall', 'Die Wand der Rinne') : T('The string', 'Die Schnur');
    const surface = channel ? T('table', 'Tisches') : T('ice', 'Eises');
    const questions = [
      q(r, 'path', T(`Which path does the ${obj} follow after it ${release} at P?`, `Welche Bahn beschreibt ${N.nom}, nachdem ${N.er} in P ${release}?`), [
        o(pic(PATH.tangent), 'ok', T(`Right: ${noSide} With no horizontal force, it goes straight on in the direction it had at P — along the tangent.`,
          `Richtig: ${noSide} Ohne horizontale Kraft bewegt ${N.er} sich geradeaus weiter, in der Richtung, die ${N.er} in P hatte — entlang der Tangente.`),
          T('straight on along the tangent', 'geradeaus entlang der Tangente')),
        o(pic(PATH.circle), 'circular-impetus', T(`The ${obj} does not “remember” the circle. ${noSide} Without a force toward the centre, the path is not bent any more.`,
          `${cap(N.nom)} „erinnert“ sich nicht an den Kreis. ${noSide} Ohne Kraft zum Zentrum hin wird die Bahn nicht mehr gekrümmt.`),
          T('on along the circle', 'weiter auf dem Kreis')),
        o(pic(PATH.radial), 'centrifugal', T(`There is no outward force. ${holder} only pulled toward the centre. When that stops, the ${obj} keeps the velocity it had at P, which points along the tangent.`,
          `Es gibt keine Kraft nach aussen. ${holder} hat nur zum Zentrum hin ${channel ? 'gedrückt' : 'gezogen'}. Fällt das weg, behält ${N.nom} die Geschwindigkeit, die ${N.er} in P hatte — und die zeigt entlang der Tangente.`),
          T('straight outward, away from the centre', 'geradlinig nach aussen, weg vom Zentrum')),
        o(pic(PATH.outward), 'centrifugal', T(`No force pushes the ${obj} outward, so its path does not bend outward. Without any horizontal force, it moves in a straight line along the tangent.`,
          `Keine Kraft drückt ${N.acc} nach aussen, also krümmt sich die Bahn nicht nach aussen. Ohne horizontale Kraft bewegt ${N.er} sich geradlinig entlang der Tangente.`),
          T('a curve bending outward', 'eine nach aussen gekrümmte Kurve')),
      ], true),
      q(r, 'force', T(`Which horizontal forces act on the ${obj} after P?`, `Welche horizontalen Kräfte wirken nach P auf ${N.acc}?`), [
        o(T('None.', 'Keine.'), 'ok', T(`Right: ${noSide} (Its weight and the push of the ${surface} act vertically and cancel.)`, `Richtig: ${noSide} (Gewichtskraft und Normalkraft des ${surface} wirken vertikal und heben sich auf.)`)),
        o(T('A force in its direction of motion, which keeps it moving.', 'Eine Kraft in Bewegungsrichtung, die die Bewegung aufrechterhält.'), 'active-force',
          T(`The ${obj} keeps moving without a force (inertia). A force along the motion would make it faster.`, `${cap(N.nom)} bewegt sich ohne Kraft weiter (Trägheit). Eine Kraft in Bewegungsrichtung würde ${N.ihn} schneller machen.`)),
        o(T('A centrifugal force, outward from the centre.', 'Eine Zentrifugalkraft, vom Zentrum weg nach aussen.'), 'centrifugal',
          T(`Nothing pushes the ${obj} outward. In the circle, ${channel ? 'the wall pushed it' : 'the string pulled it'} inward; after P, no horizontal force acts at all.`,
            `Nichts drückt ${N.acc} nach aussen. Auf dem Kreis hat ${channel ? `die Wand ${N.ihn} nach innen gedrückt` : `die Schnur ${N.ihn} nach innen gezogen`}; nach P wirkt gar keine horizontale Kraft.`)),
        o(T('A force toward the centre that slowly fades away.', 'Eine Kraft zum Zentrum hin, die langsam abklingt.'), 'circular-impetus',
          T(`${holder} can only pull or push while ${channel ? 'it touches the ball' : 'it is attached'}. ${noSide}`, `${holder} kann nur ziehen oder drücken, solange ${channel ? 'sie die Kugel berührt' : 'sie befestigt ist'}. ${noSide}`)),
      ]),
    ];

    const steps = [
      { title: T('In the circle', 'Auf dem Kreis'), figure: figure({ inward: true }),
        text: T(`While the ${obj} goes round, ${channel ? `the outer wall of the channel pushes it toward the centre (normal force ${FN})` : `the string pulls it toward the centre (tension ${FT})`}. This sideways force keeps bending its path. Without it, the ${obj} would go straight on.`,
          `Solange ${N.nom} im Kreis läuft, ${channel ? `drückt die äussere Wand der Rinne ${N.ihn} zum Zentrum hin (Normalkraft ${FN})` : `zieht die Schnur ${N.ihn} zum Zentrum hin (Seilkraft ${FT})`}. Diese seitliche Kraft krümmt die Bahn ständig. Ohne sie würde ${N.nom} geradeaus weiterlaufen.`) },
      { title: T('After P', 'Nach P'), figure: figure({ tangent: true }),
        text: T(`${noSide} No horizontal force acts (the weight and the push of the ${surface} are vertical and cancel). First law: the ${obj} moves in a straight line at constant speed, with the velocity it had at P — along the tangent.`,
          `${noSide} Keine horizontale Kraft wirkt (Gewichtskraft und Normalkraft des ${surface} sind vertikal und heben sich auf). Erstes Newtonsches Gesetz: ${cap(N.nom)} bewegt sich geradlinig mit konstanter Geschwindigkeit, mit der Geschwindigkeit aus P — entlang der Tangente.`) },
      { title: T('Neither curved nor outward', 'Weder gekrümmt noch nach aussen'), figure: figure({ tangent: true, compare: true }),
        text: T(`To keep curving (dashed arc) it would need a force toward the centre. To fly outward (dashed line) it would need a force pointing outward. Neither exists after P: there is no “centrifugal force” that pushes it out.`,
          `Um weiter im Bogen zu laufen (gestrichelter Bogen), bräuchte ${N.nom} eine Kraft zum Zentrum. Um nach aussen zu fliegen (gestrichelte Linie), bräuchte ${N.er} eine Kraft nach aussen. Nach P gibt es keine von beiden: Es gibt keine „Zentrifugalkraft“, die ${N.ihn} hinausdrückt.`) },
    ];

    const sense = s > 0 ? T('clockwise', 'im Uhrzeigersinn') : T('counterclockwise', 'im Gegenuhrzeigersinn');
    return {
      title: channel ? T('Out of the channel', 'Aus der Rinne') : T('The string breaks', 'Die Schnur reisst'),
      situation: channel
        ? T(`<p>A curved channel lies flat on a table. A ball rolls through it, ${sense} as seen from above, and leaves it at P. Friction is negligible.</p>`,
          `<p>Eine gebogene Rinne liegt flach auf einem Tisch. Eine Kugel rollt hindurch, von oben gesehen ${sense}, und verlässt sie in P. Die Reibung ist vernachlässigbar.</p>`)
        : T(`<p>A stone tied to a string slides around a pin on smooth ice, in a circle, ${sense} as seen from above. At P the string breaks. Friction is negligible.</p>`,
          `<p>Ein Stein an einer Schnur gleitet auf glattem Eis im Kreis um einen Pfosten, von oben gesehen ${sense}. In P reisst die Schnur. Die Reibung ist vernachlässigbar.</p>`),
      figure: figure(),
      questions,
      hints: [
        T(`Compare the forces on the ${obj} before and after P. What made it move in a circle?`, `Vergleiche die Kräfte auf ${N.acc} vor und nach P. Was hat ${N.ihn} auf der Kreisbahn gehalten?`),
        T(`Plan: before P, find the force that bends the path. After P, check which horizontal forces are left, and use the first law.`,
          `Plan: Finde vor P die Kraft, die die Bahn krümmt. Prüfe nach P, welche horizontalen Kräfte übrig bleiben, und wende das erste Newtonsche Gesetz an.`),
        T(`First law: with no net force, a body moves in a straight line at constant speed. A curved path needs a force toward the inside of the curve.`,
          `Erstes Newtonsches Gesetz: Ohne resultierende Kraft bewegt sich ein Körper geradlinig mit konstanter Geschwindigkeit. Eine gekrümmte Bahn braucht eine Kraft zur Innenseite der Kurve.`),
        T(`Here, after P, ${channel ? 'the wall no longer touches the ball' : 'the string no longer pulls'}. Which velocity does the ${obj} have at P, and which way does it point?`,
          `Hier ${channel ? 'berührt die Wand die Kugel nach P nicht mehr' : 'zieht die Schnur nach P nicht mehr'}. Welche Geschwindigkeit hat ${N.nom} in P, und wohin zeigt sie?`),
      ],
      steps,
    };
  }

  // ================================================================ engine: on, then off
  function engine(r, p) {
    const obj = p.obj || r.pick(['probe', 'glider']);
    const start = p.start || r.pick(['rest', 'drift']);
    const probeObj = obj === 'probe', name = probeObj ? 'probe' : 'glider';
    const N = probeObj ? noun('f', 'Sonde') : noun('m', 'Gleiter');
    const E = probeObj ? noun('n', 'Triebwerk') : noun('m', 'Propeller');
    const rest = start === 'rest';
    const t1 = '<i>t</i><sub>1</sub>', t2 = '<i>t</i><sub>2</sub>';

    // ---------------------------------------------------------- figure
    function figure() {
      let g = '';
      const y = 64;
      if (probeObj) g += D.rect(0, 0, 380, 150, 'space', 6) + D.probe(150, y, [1, 0], [1, 0]);
      else g += D.rect(20, y + 16, 340, 10, 'solid', 2) + D.rect(128, y - 12, 50, 28, 'obj', 3) + D.rect(146, y - 26, 4, 14, 'solid', 1) + `<ellipse class="fan" cx="148" cy="${y - 28}" rx="3" ry="11"/>`;
      g += D.arrow(probeObj ? 168 : 180, y, probeObj ? 226 : 236, y, 'f', 'F', {});
      if (!rest) g += D.arrow(probeObj ? 132 : 190, probeObj ? y - 30 : y - 26, probeObj ? 176 : 234, probeObj ? y - 30 : y - 26, 'v', 'v_0');
      const ty = 128;
      g += D.line(30, ty, 350, ty, 'gline') + D.rect(130, ty - 4, 120, 8, 'on', 2);
      g += D.text(130, ty - 9, 't_1', 'lbl small') + D.text(250, ty - 9, 't_2', 'lbl small') + D.words(190, ty + 18, probeObj ? T('engine on', 'Triebwerk an') : T('fan on', 'Propeller an'));
      return D.svg(380, 150, g, T(`The ${name} with its engine running from t1 to t2`, `${cap(N.nom)}; ${E.nom} läuft von t1 bis t2`));
    }

    // v–t graphs: shapes as paths in a small frame (origin 20/92), t1 at 56, t2 at 100.
    const y0 = rest ? 92 : 74, top = 34;
    const SHAPES = {
      ok: `M20 ${y0} H56 L100 ${top} H146`,
      fade: `M20 ${y0} H56 L100 ${top} L146 ${y0}`,
      drop: `M20 ${y0} H56 L100 ${top} V${y0} H146`,
      step: `M20 ${y0} H56 V${top + 10} H100 V${y0} H146`,
      level: `M20 ${y0} H56 Q66 ${top} 80 ${top} H146`,
    };
    const vt = T('speed against time', 'Geschwindigkeit gegen Zeit');
    const graph = (d) => {
      let g = D.axes(20, 92, 132, 84, 't', 'v') + D.line(56, 92, 56, 95, 'ln') + D.line(100, 92, 100, 95, 'ln');
      g += D.text(56, 106, 't_1', 'lbl small') + D.text(100, 106, 't_2', 'lbl small') + D.path(d, 'opt-path');
      return D.svg(160, 112, g, vt);
    };
    const bigGraph = (stage) => {
      const X = (x) => 30 + (x - 20) * 2.1, Y = (y) => 24 + (y - 10) * 1.85;
      let g = D.axes(X(20), Y(92), 290, 160, 't', 'v') + D.text(X(56), Y(92) + 18, 't_1', 'lbl small') + D.text(X(100), Y(92) + 18, 't_2', 'lbl small');
      g += D.line(X(56), Y(92), X(56), Y(top), 'guide faint') + D.line(X(100), Y(92), X(100), Y(top), 'guide faint');
      const segs = [[[20, y0], [56, y0]], [[56, y0], [100, top]], [[100, top], [146, top]]];
      segs.forEach((sg, i) => { if (i <= stage) g += D.poly(sg.map(([x, y]) => [X(x), Y(y)]), i === stage ? 'opt-path' : 'trace strong'); });
      if (!rest) g += D.text(X(20) - 6, Y(y0) + 4, 'v_0', 'lbl small', 'end');
      return D.svg(360, 200, g, vt);
    };

    const noFriction = probeObj ? T('In space nothing slows the probe down', 'Im Weltraum bremst nichts die Sonde') : T('On the air track nothing slows the glider down (friction is negligible)', 'Auf der Luftkissenbahn bremst nichts den Gleiter (Reibung vernachlässigbar)');
    const lower = noFriction.charAt(0).toLowerCase() + noFriction.slice(1);
    const questions = [
      q(r, 'graph', T(`Which graph shows the speed of the ${name} against time?`, `Welcher Graph zeigt die Geschwindigkeit ${probeObj ? 'der Sonde' : 'des Gleiters'} in Abhängigkeit von der Zeit?`), [
        o(graph(SHAPES.ok), 'ok', T(`Right: while the engine runs, the constant force gives a constant acceleration, so the speed rises steadily. After ${t2}, no force acts and the speed stays the same.`,
          `Richtig: Solange ${E.nom} läuft, bewirkt die konstante Kraft eine konstante Beschleunigung, also steigt die Geschwindigkeit gleichmässig. Nach ${t2} wirkt keine Kraft, und die Geschwindigkeit bleibt gleich.`),
          T('rises steadily from t₁ to t₂, then stays constant', 'steigt von t₁ bis t₂ gleichmässig, bleibt dann konstant')),
        o(graph(SHAPES.fade), 'impetus', T(`${noFriction}: there is no force after ${t2}, so the speed does not change. The push is not stored up and used up.`,
          `${noFriction}: Nach ${t2} wirkt keine Kraft, also ändert sich die Geschwindigkeit nicht. Der Schub wird nicht gespeichert und aufgebraucht.`),
          T('rises, then slowly falls again', 'steigt, fällt dann langsam wieder')),
        o(graph(SHAPES.drop), 'active-force', T(`The ${name} does not need a force to keep moving. After ${t2}, no force acts, so its speed stays what it was at ${t2}.`,
          `${cap(N.nom)} braucht keine Kraft, um sich weiterzubewegen. Nach ${t2} wirkt keine Kraft, also bleibt die Geschwindigkeit so, wie sie bei ${t2} war.`),
          T('rises, then drops back at once', 'steigt, fällt dann sofort zurück')),
        o(graph(SHAPES.step), 'active-force', T(`A force does not set a speed, it changes the speed: a constant force gives a steadily rising speed, not a jump to a fixed value.`,
          `Eine Kraft legt keine Geschwindigkeit fest, sie ändert die Geschwindigkeit: Eine konstante Kraft ergibt eine gleichmässig steigende Geschwindigkeit, keinen Sprung auf einen festen Wert.`),
          T('jumps up at t₁ and back down at t₂', 'springt bei t₁ hoch und bei t₂ zurück')),
        o(graph(SHAPES.level), 'active-force', T(`As long as the force acts, the speed keeps rising at the same rate: <i>a</i> = <i>F</i>/<i>m</i> stays the same. ${noFriction}, so nothing balances the force.`,
          `Solange die Kraft wirkt, steigt die Geschwindigkeit gleich schnell weiter: <i>a</i> = <i>F</i>/<i>m</i> bleibt gleich. ${noFriction}, also hebt nichts die Kraft auf.`),
          T('rises and levels off while the engine still runs', 'steigt und flacht ab, während der Antrieb noch läuft')),
      ], true),
      q(r, 'after', T(`What does it take to keep the ${name} moving at constant speed after ${t2}?`, `Was braucht es, damit sich ${N.nom} nach ${t2} mit konstanter Geschwindigkeit weiterbewegt?`), [
        o(T('Nothing: no force is needed.', 'Nichts: Es braucht keine Kraft.'), 'ok', T(`Right: ${lower}, so without any force it keeps its velocity (first law).`, `Richtig: ${lower}, also behält ${N.nom} ohne jede Kraft ${poss(N)} Geschwindigkeit (erstes Newtonsches Gesetz).`)),
        o(T(`A force as large as the engine's force.`, `Eine Kraft so gross wie die ${probeObj ? 'des Triebwerks' : 'des Propellers'}.`), 'active-force',
          T(`That force would keep speeding the ${name} up. To move at constant speed, the net force must be zero.`, `Diese Kraft würde ${N.acc} weiter beschleunigen. Für konstante Geschwindigkeit muss die resultierende Kraft null sein.`)),
        o(T('A smaller force, to make up for the push that wears off.', 'Eine kleinere Kraft, die den nachlassenden Schwung ausgleicht.'), 'impetus',
          T(`There is no push that wears off. ${noFriction}: with no force at all, the speed stays constant.`, `Es gibt keinen Schwung, der nachlässt. ${noFriction}: Ganz ohne Kraft bleibt die Geschwindigkeit konstant.`)),
      ]),
    ];

    const steps = [
      { title: T('Before t₁', 'Vor t₁'), figure: bigGraph(0),
        text: T(`${noFriction}, and no other force acts: the ${name} ${rest ? 'stays at rest' : `keeps its speed <i>v</i><sub>0</sub>`} (first law).`,
          `${noFriction}, und keine andere Kraft wirkt: ${cap(N.nom)} ${rest ? 'bleibt in Ruhe' : `behält ${poss(N)} Geschwindigkeit <i>v</i><sub>0</sub>`} (erstes Newtonsches Gesetz).`) },
      { title: T('From t₁ to t₂', 'Von t₁ bis t₂'), figure: bigGraph(1),
        text: T(`The engine pushes with a constant force <i>F</i> in the direction of motion. Second law: constant acceleration <i>a</i> = <i>F</i>/<i>m</i>, so the speed rises at a steady rate: a straight rising line.`,
          `${cap(E.nom)} schiebt mit einer konstanten Kraft <i>F</i> in Bewegungsrichtung. Zweites Newtonsches Gesetz: konstante Beschleunigung <i>a</i> = <i>F</i>/<i>m</i>, also steigt die Geschwindigkeit gleichmässig: eine steigende Gerade.`) },
      { title: T('After t₂', 'Nach t₂'), figure: bigGraph(2),
        text: T(`No force acts any more. First law: the ${name} keeps the speed it has at ${t2}, for ever — a horizontal line. It does not slow down: there is nothing that would slow it.`,
          `Es wirkt keine Kraft mehr. Erstes Newtonsches Gesetz: ${cap(N.nom)} behält die Geschwindigkeit, die ${N.er} bei ${t2} hat, für immer — eine horizontale Linie. ${cap(N.er)} wird nicht langsamer: Es gibt nichts, was ${N.ihn} bremsen würde.`) },
    ];

    return {
      title: probeObj ? T('Engine on, engine off', 'Triebwerk an, Triebwerk aus') : T('A glider with a fan', 'Ein Gleiter mit Propeller'),
      situation: probeObj
        ? T(`<p>A space probe far from any planet ${rest ? 'is at rest' : `drifts at speed <i>v</i><sub>0</sub>`}. From the time ${t1} to ${t2} its engine pushes it with a constant force in the direction of ${rest ? 'the arrow' : 'motion'}; then the engine is switched off.</p>`,
          `<p>Eine Raumsonde weit weg von jedem Planeten ${rest ? 'ist in Ruhe' : `treibt mit der Geschwindigkeit <i>v</i><sub>0</sub>`}. Vom Zeitpunkt ${t1} bis ${t2} schiebt ihr Triebwerk sie mit einer konstanten Kraft in ${rest ? 'Pfeilrichtung' : 'Bewegungsrichtung'}; danach wird das Triebwerk abgeschaltet.</p>`)
        : T(`<p>A glider on an air track (friction is negligible) ${rest ? 'is at rest' : `moves at speed <i>v</i><sub>0</sub>`}. From the time ${t1} to ${t2} a fan on the glider pushes it with a constant force in the direction of ${rest ? 'the arrow' : 'motion'}; then the fan is switched off.</p>`,
          `<p>Ein Gleiter auf einer Luftkissenbahn (Reibung vernachlässigbar) ${rest ? 'ist in Ruhe' : `bewegt sich mit der Geschwindigkeit <i>v</i><sub>0</sub>`}. Vom Zeitpunkt ${t1} bis ${t2} schiebt ein Propeller auf dem Gleiter ihn mit einer konstanten Kraft in ${rest ? 'Pfeilrichtung' : 'Bewegungsrichtung'}; danach wird der Propeller abgeschaltet.</p>`),
      figure: figure(),
      questions,
      hints: [
        T(`Split the motion into three parts: before ${t1}, from ${t1} to ${t2}, and after ${t2}. Which forces act in each part?`,
          `Teile die Bewegung in drei Abschnitte: vor ${t1}, von ${t1} bis ${t2} und nach ${t2}. Welche Kräfte wirken in jedem Abschnitt?`),
        T(`Plan: where no force acts, use the first law; where the constant force acts, use the second law. Then draw the speed part by part.`,
          `Plan: Wo keine Kraft wirkt, gilt das erste Newtonsche Gesetz; wo die konstante Kraft wirkt, das zweite. Zeichne dann die Geschwindigkeit Abschnitt für Abschnitt.`),
        T(`First law: no force → constant velocity. Second law: <i>a</i> = <i>F</i>/<i>m</i>; a constant force gives a constant acceleration, a steadily rising speed.`,
          `Erstes Gesetz: keine Kraft → konstante Geschwindigkeit. Zweites Gesetz: <i>a</i> = <i>F</i>/<i>m</i>; eine konstante Kraft ergibt eine konstante Beschleunigung, eine gleichmässig steigende Geschwindigkeit.`),
        T(`Here, ${lower}. So between ${t1} and ${t2} the speed rises steadily — and what happens to it once the force is gone?`,
          `Hier gilt: ${lower}. Zwischen ${t1} und ${t2} steigt die Geschwindigkeit also gleichmässig — und was passiert mit ihr, wenn die Kraft weg ist?`),
      ],
      steps,
    };
  }

  register('inertia', 'kick', kick);
  register('inertia', 'circle', circle);
  register('inertia', 'engine', engine);
})(typeof window !== 'undefined' ? window : globalThis);
