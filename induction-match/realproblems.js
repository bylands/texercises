// Problems: induction in everyday life and technology, told as stories, each with a picture
// (figures.js) and questions with options from typical mistakes: a magnet falling through a coil
// (two pulses, the second larger and shorter, of equal area), the magnetic brake of a drop tower
// (it brakes going in and coming out, but cannot hold the car), a guitar pickup (no signal from
// nylon strings), an induction hob (only a changing field heats, only metal) and a bicycle dynamo.
//   PROBLEMS[i]  { id, difficulty, title(), make(r) }; realOf(i, seed) the exercise (app.js)
(function (root) {
  'use strict';

  const I = root.Induction || require('./generator.js');
  const P = root.Plot || require('./plot.js');
  const Lang = root.Lang || require('./lang.js');
  const L = (en, de) => Lang.L(en, de);
  const dec = (x) => String(Math.round(x * 1000) / 1000);
  const { T } = I;

  // the options of a value: the right one and the mistakes, apart by 15 %, sorted; the extra ones
  // get the reason of the last mistake, which gives the plain working
  function values(right, mistakes, unit, extra = [2, 0.5, 3]) {
    const out = [{ value: right, ok: true, why: '' }];
    for (const m of [...mistakes, ...extra.map((k) => ({ value: right * k, tag: 'other', why: mistakes.length ? mistakes[mistakes.length - 1].why : '' }))]) {
      if (out.length === 4) break;
      const v = Number(m.value.toPrecision(3));
      if (Number.isFinite(v) && v > 0 && out.every((o) => Math.abs(Math.log(v / o.value)) > Math.log(1.15))) out.push({ ...m, value: v, ok: false });
    }
    return out.sort((a, b) => a.value - b.value).map((o) => ({ ...o, label: `${dec(o.value)} ${unit}` }));
  }
  const choice = (key, label, options) => ({ type: 'choice', key, label, options });
  const words = (r, list) => r.shuffle(list.map(([label, ok, why]) => ({ label, ok, why: ok ? '' : why })));

  // ---------------------------------------------------------------- a magnet falls through a coil
  // The flux rises as the magnet comes in and falls as it leaves: a negative pulse, then a positive
  // one. The magnet is faster when it leaves: the second pulse is higher and shorter; both have
  // the same area (the flux rises and falls by the same amount).
  const bump = (t, c, w) => Math.exp(-(((t - c) / w) ** 2));
  const fall = {
    id: 'fall', difficulty: 3, title: () => L('A magnet falls through a coil', 'Ein Magnet fällt durch eine Spule'),
    make(r) {
      const c1 = r.pick([2.6, 3, 3.4]), w1 = 0.7, w2 = r.pick([0.4, 0.45, 0.5]), A1 = 1.3, A2 = (A1 * w1) / w2, c2 = c1 + r.pick([1.8, 2, 2.2]);
      const units = { tScale: 10, tUnit: 'ms', yUnit: 'V' }, br = [0, T];
      const g = (f) => P.optionGraph({ kind: 'volt', f, breaks: br }, { units });
      const opts = [
        { html: g((t) => -A1 * bump(t, c1, w1) + A2 * bump(t, c2, w2)), ok: true },
        { html: g((t) => -A1 * bump(t, c1, w1) + A1 * bump(t, c2, w1)), ok: false, why: L('The magnet speeds up while it falls: it leaves the coil faster than it came in, so the flux falls faster than it rose, and the second pulse is higher and shorter.', 'Der Magnet wird beim Fallen schneller: Er verlässt die Spule schneller, als er hineinkam, also sinkt der Fluss schneller, als er stieg, und der zweite Puls ist höher und kürzer.') },
        { html: g((t) => -A1 * bump(t, c1, w1) - A2 * bump(t, c2, w2)), ok: false, why: L('While the magnet comes in, the flux through the coil increases; while it leaves, the flux decreases: the two pulses have opposite signs.', 'Während der Magnet hineinkommt, nimmt der Fluss durch die Spule zu; während er hinausgeht, nimmt er ab: Die beiden Pulse haben entgegengesetzte Vorzeichen.') },
        { html: g((t) => -A1 * bump(t, c1, w1) + ((A1 * w1) / 1.1) * bump(t, c2 + 0.3, 1.1)), ok: false, why: L('The magnet speeds up while it falls, so it leaves the coil faster: the second pulse is shorter and higher, not longer and lower.', 'Der Magnet wird beim Fallen schneller, also verlässt er die Spule schneller: Der zweite Puls ist kürzer und höher, nicht länger und tiefer.') },
      ];
      const areaWhy = L('The flux through the coil rises from 0 to its largest value and falls back to 0: by the same amount. The area under each pulse is the change of the flux, so both areas are equal in size.', 'Der Fluss durch die Spule steigt von 0 auf seinen grössten Wert und sinkt zurück auf 0: um gleich viel. Die Fläche unter jedem Puls ist die Änderung des Flusses, also sind beide Flächen gleich gross.');
      return {
        text: L('<p>A small bar magnet is dropped, north pole down, through a plastic tube with a short coil wound around it. A data logger records the voltage induced in the coil (counted as minus the rate of change of the flux, with the magnet’s flux through the coil positive).</p>',
          '<p>Ein kleiner Stabmagnet wird mit dem Nordpol nach unten durch ein Kunststoffrohr fallen gelassen, um das eine kurze Spule gewickelt ist. Ein Datenlogger zeichnet die in der Spule induzierte Spannung auf (gezählt als minus die Änderungsrate des Flusses, der Fluss des Magneten durch die Spule positiv).</p>'),
        questions: [
          { type: 'pick', key: 'g', label: L('(a) Which graph shows the voltage?', '(a) Welcher Graph zeigt die Spannung?'), options: r.shuffle(opts) },
          choice('why', L('(b) The second pulse is higher because', '(b) Der zweite Puls ist höher, weil'), words(r, [
            [L('the magnet is faster when it leaves the coil', 'der Magnet schneller ist, wenn er die Spule verlässt'), true, ''],
            [L('the south pole is stronger than the north pole', 'der Südpol stärker ist als der Nordpol'), false, L('Both poles of a bar magnet are equally strong; but the magnet has sped up.', 'Beide Pole eines Stabmagneten sind gleich stark; aber der Magnet ist schneller geworden.')],
            [L('the current in the coil adds to the magnet’s field', 'der Strom in der Spule das Feld des Magneten verstärkt'), false, L("By Lenz's rule, the induced current opposes the change; the second pulse is higher because the magnet has sped up.", 'Nach der Lenzschen Regel wirkt der induzierte Strom der Änderung entgegen; der zweite Puls ist höher, weil der Magnet schneller geworden ist.')]])),
          choice('area', L('(c) The areas between the two pulses and the time axis are', '(c) Die Flächen zwischen den beiden Pulsen und der Zeitachse sind'), words(r, [
            [L('equal in size', 'gleich gross'), true, ''], [L('larger for the second pulse', 'beim zweiten Puls grösser'), false, areaWhy], [L('larger for the first pulse', 'beim ersten Puls grösser'), false, areaWhy]])),
        ],
        hints: [L('While the magnet comes into the coil, the flux through it increases; while it leaves, the flux decreases.', 'Während der Magnet in die Spule kommt, nimmt der Fluss durch sie zu; während er sie verlässt, nimmt er ab.'),
          L('The magnet falls faster and faster.', 'Der Magnet fällt immer schneller.'),
          L('The area under a voltage pulse is the change of the flux (with the opposite sign).', 'Die Fläche unter einem Spannungspuls ist die Änderung des Flusses (mit umgekehrtem Vorzeichen).')],
        solution: [L('While the magnet comes in, the flux through the coil increases: a negative voltage. While it leaves, the flux decreases again: a positive voltage. The magnet has sped up by then, so the flux changes faster: the second pulse is higher and shorter.', 'Während der Magnet hineinkommt, nimmt der Fluss durch die Spule zu: eine negative Spannung. Während er hinausgeht, nimmt der Fluss wieder ab: eine positive Spannung. Der Magnet ist inzwischen schneller, also ändert sich der Fluss schneller: Der zweite Puls ist höher und kürzer.'), areaWhy],
        pic: ['fall', {}],
      };
    },
  };

  // ---------------------------------------------------------------- the magnetic brake
  const brake = {
    id: 'brake', difficulty: 3, title: () => L('The magnetic brake of a drop tower', 'Die Magnetbremse eines Freifallturms'),
    make(r) {
      const B = r.pick([0.6, 0.8, 1.0]), h = r.pick([0.2, 0.25, 0.3]), v = r.pick([15, 20, 25]), U = B * h * v;
      const why = L(`Across the part of the fin between the magnets (${dec(h)} m), the voltage B · h · v = ${dec(B)} T · ${dec(h)} m · ${dec(v)} m/s = ${dec(U)} V is induced.`,
        `Über dem Teil der Finne zwischen den Magneten (${dec(h)} m) wird die Spannung B · h · v = ${dec(B)} T · ${dec(h)} m · ${dec(v)} m/s = ${dec(U)} V induziert.`);
      const lenz = L("By Lenz's rule, the currents induced in the fin (eddy currents) oppose the change that causes them: the motion of the fin through the field. So they always brake it, whether the fin moves into the field or out of it.",
        'Nach der Lenzschen Regel wirken die in der Finne induzierten Ströme (Wirbelströme) der Änderung entgegen, die sie verursacht: der Bewegung der Finne durch das Feld. Also bremsen sie immer, ob die Finne ins Feld hinein oder aus ihm heraus fährt.');
      const rest = L('At rest, the flux does not change: no current is induced, and there is no force. A magnetic brake can slow a car down, but it cannot hold it.', 'In Ruhe ändert sich der Fluss nicht: Es wird kein Strom induziert, und es gibt keine Kraft. Eine Magnetbremse kann einen Wagen abbremsen, aber nicht festhalten.');
      return {
        text: L(`<p>A drop-tower car falls freely and is then braked without contact: a copper fin under the car falls between strong magnets (${dec(B)} T). The car enters the brake at ${dec(v)} m/s; the fin is ${dec(h)} m wide where it passes between the magnets.</p>`,
          `<p>Ein Freifallturm-Wagen fällt frei und wird dann berührungslos gebremst: Eine Kupferfinne unter dem Wagen fällt zwischen starken Magneten (${dec(B)} T) hindurch. Der Wagen erreicht die Bremse mit ${dec(v)} m/s; die Finne ist dort, wo sie zwischen den Magneten durchgeht, ${dec(h)} m breit.</p>`),
        questions: [
          choice('u', L('(a) the voltage induced across the fin as it enters the field', '(a) die Spannung, die beim Eintritt ins Feld über der Finne induziert wird'), values(U, [{ value: B * v, tag: 'noh', why: L(`The width of the fin in the field counts too. ${why}`, `Die Breite der Finne im Feld zählt auch. ${why}`) }, { value: B * h, tag: 'nov', why }, { value: B * h * v * v, tag: 'v2', why }], 'V')),
          choice('in', L('(b) While the fin moves into the field, the magnets', '(b) Während die Finne ins Feld fährt, wird sie von den Magneten'), words(r, [[L('brake it', 'gebremst'), true, ''], [L('pull it in faster', 'schneller hineingezogen'), false, lenz], [L('do not act on it (copper is not magnetic)', 'nicht beeinflusst (Kupfer ist nicht magnetisch)'), false, L(`Copper is not attracted by magnets, but currents are induced in it. ${lenz}`, `Kupfer wird von Magneten nicht angezogen, aber in ihm werden Ströme induziert. ${lenz}`)]])),
          choice('out', L('(c) While the fin leaves the field, the magnets', '(c) Während die Finne das Feld verlässt, wird sie von den Magneten'), words(r, [[L('brake it', 'gebremst'), true, ''], [L('push it out faster', 'schneller hinausgestossen'), false, lenz], [L('do not act on it', 'nicht beeinflusst'), false, lenz]])),
          choice('rest', L('(d) If the car stopped with the fin between the magnets, the magnets would', '(d) Stünde der Wagen mit der Finne zwischen den Magneten still, würden ihn die Magnete'), words(r, [[L('exert no force on it', 'keine Kraft auf ihn ausüben'), true, ''], [L('hold it in place', 'festhalten'), false, rest], [L('push it upwards', 'nach oben drücken'), false, rest]])),
        ],
        hints: [L('A conductor of length h moving at v across a field B: the induced voltage is B · h · v.', 'Ein Leiter der Länge h, der sich mit v quer durch ein Feld B bewegt: Die induzierte Spannung ist B · h · v.'),
          L("Lenz's rule: the induced currents oppose the change that causes them.", 'Lenzsche Regel: Die induzierten Ströme wirken der Änderung entgegen, die sie verursacht.'), L('No change, no induction.', 'Keine Änderung, keine Induktion.')],
        solution: [why, lenz, rest],
        pic: ['brake', {}],
      };
    },
  };

  // ---------------------------------------------------------------- a guitar pickup
  const pickup = {
    id: 'pickup', difficulty: 2, title: () => L('A guitar pickup', 'Ein Gitarren-Tonabnehmer'),
    make(r) {
      const f = r.pick([82, 110, 147, 196, 247, 330]);
      const why = L(`The magnetised steel string changes the flux through the coil as it vibrates: once up and down per vibration, so the voltage has the frequency of the string, ${f} Hz.`, `Die magnetisierte Stahlsaite ändert beim Schwingen den Fluss durch die Spule: einmal auf und ab pro Schwingung, also hat die Spannung die Frequenz der Saite, ${f} Hz.`);
      const fast = L('The voltage depends on how fast the flux changes: that is where the string moves fastest, as it passes its middle position. At its turning points it stops for a moment: no voltage.', 'Die Spannung hängt davon ab, wie schnell sich der Fluss ändert: Das ist dort, wo sich die Saite am schnellsten bewegt, beim Durchgang durch die Mittellage. An den Umkehrpunkten steht sie kurz still: keine Spannung.');
      const nylon = L('Nylon is not magnetised by the pickup’s magnets: a vibrating nylon string does not change the flux through the coil, so no voltage is induced.', 'Nylon wird von den Magneten des Tonabnehmers nicht magnetisiert: Eine schwingende Nylonsaite ändert den Fluss durch die Spule nicht, also wird keine Spannung induziert.');
      return {
        text: L(`<p>An electric guitar's pickup is a set of small magnets with a coil wound around them. The magnets magnetise the steel string above them. The string vibrates ${f} times per second.</p>`, `<p>Der Tonabnehmer einer E-Gitarre besteht aus kleinen Magneten mit einer Spule darum. Die Magnete magnetisieren die Stahlsaite darüber. Die Saite schwingt ${f}-mal pro Sekunde.</p>`),
        questions: [
          choice('f', L('(a) the frequency of the voltage induced in the coil', '(a) die Frequenz der in der Spule induzierten Spannung'), values(f, [{ value: 2 * f, tag: 'twice', why }, { value: f / 2, tag: 'half', why }], 'Hz', [3])),
          choice('when', L('(b) The voltage is largest in size when the string', '(b) Die Spannung ist betragsmässig am grössten, wenn die Saite'), words(r, [[L('passes its middle position', 'durch die Mittellage geht'), true, ''], [L('is closest to the magnets', 'den Magneten am nächsten ist'), false, fast], [L('is furthest from the magnets', 'am weitesten von den Magneten entfernt ist'), false, fast]])),
          choice('nylon', L('(c) With a nylon string instead of steel, the coil gives', '(c) Mit einer Nylonsaite statt Stahl liefert die Spule'), words(r, [[L('no voltage', 'keine Spannung'), true, ''], [L('the same voltage', 'dieselbe Spannung'), false, nylon], [L('a voltage at a lower frequency', 'eine Spannung mit tieferer Frequenz'), false, nylon]])),
        ],
        hints: [L('The voltage depends on how fast the flux through the coil changes.', 'Die Spannung hängt davon ab, wie schnell sich der Fluss durch die Spule ändert.'), L('What changes the flux through the coil?', 'Was ändert den Fluss durch die Spule?')],
        solution: [why, fast, nylon],
        pic: ['pickup', {}],
      };
    },
  };

  // ---------------------------------------------------------------- an induction hob
  const hob = {
    id: 'hob', difficulty: 2, title: () => L('An induction hob', 'Ein Induktionskochfeld'),
    make(r) {
      const f = r.pick([20, 25, 30, 40]);
      const eddy = L('The alternating current in the coil makes a magnetic field that changes all the time. The changing flux through the base of the pan induces currents in it (eddy currents), and these heat the pan from inside.', 'Der Wechselstrom in der Spule erzeugt ein Magnetfeld, das sich ständig ändert. Der sich ändernde Fluss durch den Topfboden induziert darin Ströme (Wirbelströme), und diese heizen den Topf von innen.');
      const dc = L('A direct current would make a constant field: the flux would not change, so no currents would be induced, and the pan would stay cold.', 'Ein Gleichstrom würde ein konstantes Feld erzeugen: Der Fluss würde sich nicht ändern, also würden keine Ströme induziert, und der Topf bliebe kalt.');
      const glass = L('Glass does not conduct: no currents can flow in it, so a glass pan does not heat (the glass top stays cool too, apart from the heat of the pan).', 'Glas leitet nicht: In ihm können keine Ströme fliessen, also wird ein Glastopf nicht warm (auch die Glasplatte bleibt kühl, abgesehen von der Wärme des Topfs).');
      const turns = 2 * f * 1000;
      const turnWhy = L(`The current reverses twice in each period: 2 · ${f} kHz = ${turns} times per second.`, `Der Strom kehrt in jeder Periode zweimal um: 2 · ${f} kHz = ${turns}-mal pro Sekunde.`);
      return {
        text: L(`<p>Under the glass top of an induction hob lies a flat coil fed with alternating current of ${f} kHz. A steel pan on top gets hot, while the glass top stays fairly cool.</p>`, `<p>Unter der Glasplatte eines Induktionskochfelds liegt eine flache Spule, durch die ein Wechselstrom von ${f} kHz fliesst. Ein Stahltopf darauf wird heiss, während die Glasplatte ziemlich kühl bleibt.</p>`),
        questions: [
          choice('heat', L('(a) The pan gets hot because', '(a) Der Topf wird heiss, weil'), words(r, [[L('currents are induced in its base', 'in seinem Boden Ströme induziert werden'), true, ''], [L('heat flows from the hot coil into it', 'Wärme von der heissen Spule in ihn fliesst'), false, eddy], [L('the coil sends out microwaves', 'die Spule Mikrowellen aussendet'), false, eddy]])),
          choice('dc', L('(b) With a direct current in the coil, the pan would', '(b) Mit einem Gleichstrom in der Spule würde der Topf'), words(r, [[L('stay cold', 'kalt bleiben'), true, ''], [L('heat just the same', 'genauso heiss werden'), false, dc], [L('heat even faster', 'noch schneller heiss werden'), false, dc]])),
          choice('glass', L('(c) A glass pan on the hob', '(c) Ein Glastopf auf dem Kochfeld'), words(r, [[L('does not heat', 'wird nicht warm'), true, ''], [L('heats like the steel pan', 'wird wie der Stahltopf heiss'), false, glass], [L('heats faster, as glass lets the field through', 'wird schneller heiss, weil Glas das Feld durchlässt'), false, glass]])),
          choice('turn', L('(d) how often per second the field in the pan reverses', '(d) wie oft pro Sekunde das Feld im Topf umkehrt'), values(turns, [{ value: f * 1000, tag: 'once', why: turnWhy }, { value: f, tag: 'unit', why: turnWhy }], L('times', 'Mal'), [4])),
        ],
        hints: [L('Only a changing flux induces a voltage.', 'Nur ein sich ändernder Fluss induziert eine Spannung.'), L('An induced voltage drives a current only in a conductor.', 'Eine induzierte Spannung treibt nur in einem Leiter einen Strom an.')],
        solution: [eddy, dc, glass, turnWhy],
        pic: ['hob', {}],
      };
    },
  };

  // ---------------------------------------------------------------- a bicycle dynamo
  const dynamo = {
    id: 'dynamo', difficulty: 2, title: () => L('A bicycle dynamo', 'Ein Fahrraddynamo'),
    make(r) {
      const k = r.pick([2, 3]);
      const both = L(`In the dynamo, a magnet turns inside a coil. Turning ${k} times as fast, the flux changes ${k} times as fast: the voltage is ${k} times as large, and it alternates ${k} times as often.`, `Im Dynamo dreht sich ein Magnet in einer Spule. Dreht er ${k}-mal so schnell, ändert sich der Fluss ${k}-mal so schnell: Die Spannung ist ${k}-mal so gross, und sie wechselt ${k}-mal so oft.`);
      const still = L('When the wheel stands still, the magnet does not turn: the flux does not change, and no voltage is induced.', 'Steht das Rad still, dreht sich der Magnet nicht: Der Fluss ändert sich nicht, und es wird keine Spannung induziert.');
      const lenz = L("With the lamp on, a current flows in the coil. By Lenz's rule, it opposes the change that causes it, the turning of the magnet: you have to pedal harder. The energy for the light comes from your legs.", 'Mit eingeschalteter Lampe fliesst ein Strom in der Spule. Nach der Lenzschen Regel wirkt er der Änderung entgegen, die ihn verursacht, dem Drehen des Magneten: Du musst stärker treten. Die Energie für das Licht kommt aus deinen Beinen.');
      return {
        text: L(`<p>A bottle dynamo is pressed against the tyre of a bicycle; it lights the lamp. You ride ${k === 2 ? 'twice' : 'three times'} as fast as before.</p>`, `<p>Ein Seitenläuferdynamo wird an den Reifen eines Fahrrads gedrückt; er speist die Lampe. Du fährst ${k === 2 ? 'doppelt' : 'dreimal'} so schnell wie vorher.</p>`),
        questions: [
          choice('fast', L('(a) Compared with before, the voltage of the dynamo', '(a) Verglichen mit vorher hat die Spannung des Dynamos'), words(r, [[L(`is ${k} times as large and alternates ${k} times as often`, `den ${k}-fachen Betrag und wechselt ${k}-mal so oft`), true, ''], [L('is as large as before but alternates more often', 'denselben Betrag, wechselt aber öfter'), false, both], [L(`is ${k} times as large but alternates as often as before`, `den ${k}-fachen Betrag, wechselt aber gleich oft`), false, both]])),
          choice('still', L('(b) At a red light, standing still, the lamp', '(b) An einem Rotlicht, im Stillstand, ist die Lampe'), words(r, [[L('is off', 'aus'), true, ''], [L('stays on', 'weiter an'), false, still]])),
          choice('pedal', L('(c) With the lamp switched on, pedalling is', '(c) Mit eingeschalteter Lampe ist das Treten'), words(r, [[L("harder: the induced current opposes the magnet's turning", 'schwerer: Der induzierte Strom wirkt dem Drehen des Magneten entgegen'), true, ''], [L('just as easy: the dynamo only adds weight', 'gleich leicht: Der Dynamo bringt nur Gewicht'), false, lenz], [L('easier: the current helps the magnet turn', 'leichter: Der Strom hilft dem Magneten beim Drehen'), false, lenz]])),
        ],
        hints: [L('The voltage depends on how fast the flux through the coil changes.', 'Die Spannung hängt davon ab, wie schnell sich der Fluss durch die Spule ändert.'), L("Lenz's rule: the induced current opposes the change that causes it.", 'Lenzsche Regel: Der induzierte Strom wirkt der Änderung entgegen, die ihn verursacht.')],
        solution: [both, still, lenz],
        pic: ['dynamo', {}],
      };
    },
  };

  const PROBLEMS = [fall, brake, pickup, hob, dynamo];
  function realOf(i, seed) {
    const p = PROBLEMS[i], ex = p.make(I.rng(seed * 61 + 31));
    return { ...ex, kind: 'real', type: `real-${p.id}`, problem: p.id, title: p.title(), difficulty: p.difficulty, figs: '' };
  }

  const api = { PROBLEMS, realOf };
  root.IndProblems = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
