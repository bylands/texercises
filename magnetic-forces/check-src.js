// The check (see check.js, shared by the apps): the learning objectives, each with the kinds of
// question that test it, its worked example and its practice topic (app.js), and the questions.
// Each question is one question of a practice exercise (exercises.js) with a single right answer
// out of four: field lines to choose, a direction, the size of a force, a coil, two currents, or
// the wrong step in a student's hand rule.
(function (root) {
  'use strict';

  const X = root.MagEx || require('./exercises.js');
  const Lang = root.Lang || require('./lang.js');
  const L = (en, de) => Lang.L(en, de);

  const OBJECTIVES = [
    { id: 'lines', kinds: ['lines-wire', 'lines-loop', 'lines-solenoid', 'lines-magnet'], tutor: 0, topic: 0,
      name: () => L('Sketch the field lines of a bar magnet, a straight wire, a loop and a solenoid, with the right-hand grip rule for the currents.',
        'Die Feldlinien eines Stabmagneten, eines geraden Drahts, einer Leiterschleife und einer Spule skizzieren, mit der Rechte-Hand-Regel für die Ströme.') },
    { id: 'wire', kinds: ['dir-current', 'size-num', 'size-ratio'], tutor: 3, topic: 2,
      name: () => L('Find the direction and the size of the force on a current-carrying wire, F = I·L·B·sin θ, by mental arithmetic or as a ratio.',
        'Richtung und Betrag der Kraft auf einen stromdurchflossenen Draht bestimmen, F = I·L·B·sin θ, im Kopf oder als Verhältnis.') },
    { id: 'charge', kinds: ['dir-particle'], tutor: 1, topic: 1,
      name: () => L('Find the direction of the force on a moving charge, reversed for a negative charge.',
        'Die Richtung der Kraft auf eine bewegte Ladung bestimmen, umgekehrt für eine negative Ladung.') },
    { id: 'coil', kinds: ['coil-turn', 'coil-max', 'coil-use'], tutor: 5, topic: 4,
      name: () => L('Explain the torque on a coil in a magnetic field and when it is largest, as in the electric motor, the loudspeaker and the moving-coil meter.',
        'Das Drehmoment auf eine Spule im Magnetfeld erklären und wann es am grössten ist, wie im Elektromotor, im Lautsprecher und im Drehspulinstrument.') },
    { id: 'pair', kinds: ['pair-parallel'], tutor: 4, topic: 3,
      name: () => L('Predict whether two parallel currents attract or repel each other.', 'Voraussagen, ob sich zwei parallele Ströme anziehen oder abstossen.') },
    { id: 'error', kinds: ['error-charge', 'error-current'], tutor: 6, topic: 5,
      name: () => L('Find the wrong step in a student’s hand rule: the wrong hand, or the sign of the charge ignored.',
        'Den falschen Schritt in der Handregel einer Schülerin finden: die falsche Hand oder das Vorzeichen der Ladung übersehen.') },
  ];

  // the practice type of a kind, and the question of its exercise that is asked
  const ASK = {
    'lines-wire': ['p'], 'lines-loop': ['p'], 'lines-solenoid': ['p'], 'lines-magnet': ['p'],
    'dir-current': ['F'], 'dir-particle': ['F'], 'size-num': ['F'], 'size-ratio': ['k'], 'pair-parallel': ['A', 'F'],
    'coil-turn': ['t'], 'coil-max': ['m'], 'coil-use': ['u'], 'error-charge': ['e'], 'error-current': ['e'],
  };
  const typeOf = (kind) => (kind.startsWith('coil-') ? 'coil' : kind);
  function question(kind, seed) {
    const e = X.make(typeOf(kind), seed), keys = ASK[kind], q = e.questions.find((x) => x.key === keys[seed % keys.length]);
    return {
      title: e.title, text: e.text, figure: e.figs || '', ask: q.label.replace(/^\([a-d]\) /, ''),
      options: q.options.map((o) => ({ html: o.html || o.label, correct: o.ok, flag: o.ok ? null : o.tag || 'other', why: o.why })),
      explain: () => `${e.solFig ? `<div class="figs">${e.solFig}</div>` : ''}<div class="steps">${e.solution.map((s) => `<p>${s}</p>`).join('')}</div>`,
      key: `${kind}|${JSON.stringify(e.p)}|${q.key}`,
    };
  }

  // the wrong answers that show a typical wrong idea
  const concept = {
    hand: 'hand', alongV: 'perp', alongB: 'perp', none: 'none', some: 'none', grip: 'grip', radial: 'grip', along: 'grip', ns: 'ns', closed: 'closed',
    sin: 'sin', max: 'torque', net: 'torque', newton3: 'newton3', neutral: 'neutral', pair: 'pair',
  };
  const concepts = () => ({
    hand: L('the wrong hand (the sign of the charge)', 'die falsche Hand (das Vorzeichen der Ladung)'), perp: L('a force along the motion or the field', 'eine Kraft längs der Bewegung oder des Feldes'),
    none: L('when there is no force', 'wann es keine Kraft gibt'), grip: L('the field around a current', 'das Feld um einen Strom'),
    ns: L('field lines outside a magnet from S to N', 'Feldlinien ausserhalb eines Magneten von S nach N'),
    closed: L('field lines that start or end at a pole', 'Feldlinien, die an einem Pol beginnen oder enden'), sin: L('the angle θ (sin θ) left out', 'den Winkel θ (sin θ) weggelassen'),
    torque: L('where the torque on a coil is largest', 'wo das Drehmoment auf eine Spule am grössten ist'), newton3: L('a larger current pulling harder', 'ein grösserer Strom, der stärker zieht'),
    neutral: L('no force between uncharged wires', 'keine Kraft zwischen ungeladenen Drähten'), pair: L('attract and repel mixed up', 'Anziehung und Abstossung verwechselt'),
  });

  const api = { id: 'mf', objectives: OBJECTIVES, question, concept, concepts };
  root.MagCheck = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
