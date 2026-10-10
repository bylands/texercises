// Matching: match forces with their third-law partners (dragged into pairs, see questions.js).
(function (root) {
  'use strict';

  const FC = root.FC || require('./core.js');
  const D = root.Draw || require('./draw.js');
  const { T, match, register } = FC;

  // ================================================================ third-law partners
  function scenes() {
    return {
      book: {
        title: T('Book on a table', 'Buch auf dem Tisch'),
        text: T('A book lies at rest on a table. Four forces are numbered in the picture.', 'Ein Buch liegt ruhig auf einem Tisch. Im Bild sind vier Kräfte nummeriert.'),
        forces: [T('The Earth pulls the book down.', 'Die Erde zieht das Buch nach unten.'), T('The table pushes the book up.', 'Der Tisch drückt das Buch nach oben.'),
          T('The book pushes the table down.', 'Das Buch drückt den Tisch nach unten.'), T('The book pulls the Earth up.', 'Das Buch zieht die Erde nach oben.')],
        pairs: [[0, 3], [1, 2]], balance: [0, 1],
        draw: () => D.ground(20, 340, 200) + D.table(110, 120, 140, 200) + D.rect(150, 104, 60, 16, 'obj', 2) +
          D.arrow(172, 112, 172, 160, 'f', '') + D.arrow(188, 120, 188, 72, 'f', '') + D.arrow(230, 122, 230, 162, 'f', '', { cls: 'pair' }) + D.arrow(60, 200, 60, 152, 'f', '', { cls: 'pair' }) +
          D.text(164, 160, '1', 'lbl f', 'end') + D.text(196, 76, '2', 'lbl f', 'start') + D.text(238, 160, '3', 'lbl f', 'start') + D.text(68, 156, '4', 'lbl f', 'start') + D.words(68, 216, T('(on the Earth)', '(auf die Erde)'), 'start'),
      },
      lamp: {
        title: T('Hanging lamp', 'Hängende Lampe'),
        text: T('A lamp hangs at rest from a cord. Four forces are numbered in the picture.', 'Eine Lampe hängt ruhig an einem Kabel. Im Bild sind vier Kräfte nummeriert.'),
        forces: [T('The Earth pulls the lamp down.', 'Die Erde zieht die Lampe nach unten.'), T('The cord pulls the lamp up.', 'Das Kabel zieht die Lampe nach oben.'),
          T('The lamp pulls the cord down.', 'Die Lampe zieht das Kabel nach unten.'), T('The lamp pulls the Earth up.', 'Die Lampe zieht die Erde nach oben.')],
        pairs: [[0, 3], [1, 2]], balance: [0, 1],
        draw: () => D.ceiling(110, 250, 18) + D.line(180, 18, 180, 104, 'cable') + `<polygon class="obj" points="164,104 196,104 214,140 146,140"/>` + D.ground(20, 340, 210) +
          D.arrow(172, 122, 172, 170, 'f', '') + D.arrow(188, 106, 188, 60, 'f', '') + D.arrow(200, 60, 200, 96, 'f', '', { cls: 'pair' }) + D.arrow(60, 210, 60, 162, 'f', '', { cls: 'pair' }) +
          D.text(164, 170, '1', 'lbl f', 'end') + D.text(180, 62, '2', 'lbl f', 'end') + D.text(208, 80, '3', 'lbl f', 'start') + D.text(68, 166, '4', 'lbl f', 'start') + D.words(68, 226, T('(on the Earth)', '(auf die Erde)'), 'start'),
      },
      wall: {
        title: T('Pushing a wall', 'Gegen eine Wand drücken'),
        text: T('A person stands still and pushes against a wall with both hands. Four forces are numbered in the picture.', 'Eine Person steht still und drückt mit beiden Händen gegen eine Wand. Im Bild sind vier Kräfte nummeriert.'),
        forces: [T('The person pushes the wall to the right.', 'Die Person drückt die Wand nach rechts.'), T('The wall pushes the person to the left.', 'Die Wand drückt die Person nach links.'),
          T('The floor pushes the person’s feet to the right (friction).', 'Der Boden drückt die Füsse der Person nach rechts (Reibung).'), T('The person’s feet push the floor to the left.', 'Die Füsse der Person drücken den Boden nach links.')],
        pairs: [[0, 1], [2, 3]], balance: [1, 2],
        draw: () => D.ground(20, 340, 190) + D.rect(250, 40, 20, 150, 'solid', 0) + `<g transform="rotate(14 190 190)">${D.person(190, 190, 120, 1, 'push')}</g>` +
          D.arrow(252, 100, 296, 100, 'f', '', { cls: 'pair' }) + D.arrow(244, 112, 200, 112, 'f', '') + D.arrow(170, 182, 214, 182, 'f', '') + D.arrow(176, 198, 132, 198, 'f', '', { cls: 'pair' }) +
          D.text(300, 96, '1', 'lbl f', 'start') + D.text(196, 108, '2', 'lbl f', 'end') + D.text(218, 178, '3', 'lbl f', 'start') + D.text(128, 202, '4', 'lbl f', 'end'),
      },
      car: {
        title: T('A car speeding up', 'Ein Auto beschleunigt'),
        text: T('A car speeds up on a level road. Four forces are numbered in the picture.', 'Ein Auto beschleunigt auf einer ebenen Strasse. Im Bild sind vier Kräfte nummeriert.'),
        forces: [T('The road pushes the car’s tyres forward.', 'Die Strasse drückt die Reifen des Autos nach vorn.'), T('The tyres push the road backward.', 'Die Reifen drücken die Strasse nach hinten.'),
          T('The air pushes the car backward (air resistance).', 'Die Luft drückt das Auto nach hinten (Luftwiderstand).'), T('The car pushes the air forward.', 'Das Auto drückt die Luft nach vorn.')],
        pairs: [[0, 1], [2, 3]], balance: [0, 2],
        draw: () => D.line(0, 170, 360, 170, 'gline') + D.car(110, 170, 140) +
          D.arrow(146, 168, 190, 168, 'f', '') + D.arrow(146, 178, 102, 178, 'f', '', { cls: 'pair' }) + D.arrow(250, 130, 214, 130, 'f', '') + D.arrow(256, 116, 300, 116, 'f', '', { cls: 'pair' }) +
          D.text(194, 166, '1', 'lbl f', 'start') + D.text(98, 182, '2', 'lbl f', 'end') + D.text(210, 126, '3', 'lbl f', 'end') + D.text(304, 120, '4', 'lbl f', 'start') + D.arrow(30, 40, 80, 40, 'm', '', { head: 7 }) + D.words(88, 44, T('speeding up', 'wird schneller'), 'start'),
      },
    };
  }

  function matchPartners(r, p) {
    const key = p.scene || r.pick(['book', 'lamp', 'wall', 'car']);
    const sc = scenes()[key];
    const partner = (i) => { const pr = sc.pairs.find((x) => x.includes(i)); return pr[0] === i ? pr[1] : pr[0]; };
    const num = (i) => String(i + 1);
    const choices = sc.forces.map((f, i) => ({ id: num(i), label: `<b>${i + 1}</b> ${f}`, name: num(i) }));
    const swap = T('Third-law partners belong to the same interaction: the same two bodies, swapped.', 'Kraft und Gegenkraft gehören zur selben Wechselwirkung: dieselben zwei Körper, vertauscht.');
    const items = sc.forces.map((f, i) => {
      const wrong = {};
      if (sc.balance.includes(i)) {
        const other = sc.balance[0] === i ? sc.balance[1] : sc.balance[0];
        wrong[num(other)] = { code: 'pair-confusion', why: T(`Forces ${i + 1} and ${other + 1} both act on the same body. ${key === 'car' ? 'They may even balance' : 'They balance'}, but they are not a third-law pair. ${swap}`,
          `Die Kräfte ${i + 1} und ${other + 1} wirken beide auf denselben Körper. ${key === 'car' ? 'Sie können sich sogar aufheben' : 'Sie heben sich auf'}, sind aber kein Kraft-Gegenkraft-Paar. ${swap}`) };
      }
      wrong[num(i)] = { code: 'other', why: T('A force is not its own partner: the partner acts on the other body.', 'Eine Kraft ist nicht ihre eigene Gegenkraft: Die Gegenkraft wirkt auf den anderen Körper.') };
      return { label: `<b>${i + 1}</b> ${f}`, name: num(i), answer: num(partner(i)), wrong,
        other: T(`That is not its partner. ${swap}`, `Das ist nicht ihre Gegenkraft. ${swap}`),
        why: T(`${i + 1} ↔ ${partner(i) + 1}: ${swap}`, `${i + 1} ↔ ${partner(i) + 1}: ${swap}`) };
    });
    const figure = (o = {}) => D.svg(360, 232, sc.draw(o), sc.title);
    const pairsText = sc.pairs.map(([a, b]) => `${a + 1} ↔ ${b + 1}`).join(T(' and ', ' und '));
    const q = match('partners', T('Match each force with its third-law partner (the force with which the other body pushes or pulls back).', 'Ordne jeder Kraft ihre Gegenkraft zu (die Kraft, mit der der andere Körper zurückdrückt oder zurückzieht).'), items, choices);
    q.same = true; // the choices are the items themselves
    return {
      title: sc.title,
      situation: `<p>${sc.text}</p>`,
      figure: figure(),
      questions: [q],
      hints: [
        T('For each force, name the two bodies: who exerts it, and on whom?', 'Nenne für jede Kraft die beiden Körper: Wer übt sie aus, und auf wen?'),
        T('Plan: the partner of “A acts on B” is “B acts on A” — find the force with the two bodies swapped.', 'Plan: Die Gegenkraft zu „A wirkt auf B“ ist „B wirkt auf A“ — suche die Kraft mit den vertauschten Körpern.'),
        T('Third law: partners are equally large, opposite, of the same kind, and act on different bodies. Two forces on the same body are never partners.', 'Drittes Gesetz: Kraft und Gegenkraft sind gleich gross, entgegengesetzt, von derselben Art und wirken auf verschiedene Körper. Zwei Kräfte auf denselben Körper sind nie ein Paar.'),
        T(`Here force ${sc.balance[0] + 1} and force ${sc.balance[1] + 1} act on the same body — so they cannot be partners.`, `Hier wirken Kraft ${sc.balance[0] + 1} und Kraft ${sc.balance[1] + 1} auf denselben Körper — also können sie kein Paar sein.`),
      ],
      steps: [
        { title: T('Interactions', 'Wechselwirkungen'), figure: figure(),
          text: T(`Each force belongs to an interaction between two bodies. Swapping the bodies gives the partner: ${pairsText}.`, `Jede Kraft gehört zu einer Wechselwirkung zwischen zwei Körpern. Vertauscht man die Körper, erhält man die Gegenkraft: ${pairsText}.`) },
        { title: T('Balanced is not a pair', 'Gleichgewicht ist kein Paar'), figure: figure(),
          text: T(`Forces ${sc.balance[0] + 1} and ${sc.balance[1] + 1} both act on the same body. ${key === 'car' ? 'At constant speed they would balance' : 'They balance, because the body is at rest'} — but they belong to different interactions, so they are not partners.`,
            `Die Kräfte ${sc.balance[0] + 1} und ${sc.balance[1] + 1} wirken beide auf denselben Körper. ${key === 'car' ? 'Bei konstanter Geschwindigkeit würden sie sich aufheben' : 'Sie heben sich auf, weil der Körper in Ruhe ist'} — aber sie gehören zu verschiedenen Wechselwirkungen, also sind sie kein Paar.`) },
      ],
    };
  }

  register('interact', 'match-partners', matchPartners);
})(typeof window !== 'undefined' ? window : globalThis);
