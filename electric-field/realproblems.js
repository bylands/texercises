// Problems of Electric Field: in the lab, in nature and in technology, told as stories, each with a
// picture (figures.js) and questions with options from typical mistakes: Millikan's oil drop, the
// inkjet printer, a thundercloud, a car struck by lightning (a Faraday cage, not the tyres), an
// electrostatic precipitator, a laser printer and a jet of water bent by a charged rod.
//   PROBLEMS[i]  { id, difficulty, title(), make(r) }; realOf(i, seed) the exercise (app.js)
(function (root) {
  'use strict';

  const E = root.Elec || require('./elec.js');
  const { L, rng, nice, sci, show, values, choice, words, K } = E;

  // ---------------------------------------------------------------- Millikan
  const millikan = {
    id: 'millikan', difficulty: 3, title: () => L("Millikan's experiment", 'Millikans Versuch'),
    make(r) {
      const rad = r.pick([0.8, 1.0, 1.2]) * 1e-6, rho = 875, m = rho * (4 / 3) * Math.PI * rad ** 3, d = r.pick([5, 6, 8]) * 1e-3, n = r.int(1, 5);
      const U = Number(((m * K.g * d) / (n * K.e)).toPrecision(3)), q = (m * K.g * d) / U, nn = Math.round(q / K.e);
      const howM = L(`m = ρ·(4/3)·π·r³ = 875 kg/m³ · (4/3)·π·(${nice(rad * 1e6)} µm)³ = ${sci(m)} kg.`, `m = ρ·(4/3)·π·r³ = 875 kg/m³ · (4/3)·π·(${nice(rad * 1e6)} µm)³ = ${sci(m)} kg.`);
      const howQ = L(`It hovers: q·U/d = m·g, so q = m·g·d/U = ${sci(q)} C.`, `Es schwebt: q·U/d = m·g, also q = m·g·d/U = ${sci(q)} C.`);
      const howN = L(`q/e ≈ ${nn}: the charge is a whole number of elementary charges.`, `q/e ≈ ${nn}: Die Ladung ist ein ganzzahliges Vielfaches der Elementarladung.`);
      return {
        text: L(`<p>In Millikan's experiment, an oil drop (density 875 kg/m³) with a radius of ${nice(rad * 1e6)} µm is watched through a microscope between two horizontal plates ${nice(d * 1e3)} mm apart. At ${nice(U)} V it hovers.</p>`, `<p>In Millikans Versuch wird ein Öltröpfchen (Dichte 875 kg/m³) mit einem Radius von ${nice(rad * 1e6)} µm durch ein Mikroskop zwischen zwei waagrechten Platten im Abstand ${nice(d * 1e3)} mm beobachtet. Bei ${nice(U)} V schwebt es.</p>`),
        questions: [
          choice('m', L('(a) the mass of the drop', '(a) die Masse des Tröpfchens'), values(m, [{ value: rho * Math.PI * rad ** 3, tag: 'noFactor', why: howM }, { value: m * 8, tag: 'diam', why: L(`The radius, not the diameter. ${howM}`, `Der Radius, nicht der Durchmesser. ${howM}`) }], 'sci', howM, { fmt: (v) => `${sci(v)} kg` })),
          choice('q', L('(b) its charge (in size)', '(b) seine Ladung (Betrag)'), values(q, [{ value: (m * K.g) / U, tag: 'noD', why: L(`E = U/d. ${howQ}`, `E = U/d. ${howQ}`) }], 'sci', howQ, { fmt: (v) => `${sci(v)} C` })),
          choice('n', L('(c) the number of elementary charges', '(c) die Zahl der Elementarladungen'), [nn - 1, nn, nn + 1, nn + 2].filter((x) => x > 0).map((x) => ({ label: String(x), ok: x === nn, why: howN }))),
        ],
        hints: [L('Mass from the volume of a sphere: m = ρ·(4/3)·π·r³.', 'Masse aus dem Volumen einer Kugel: m = ρ·(4/3)·π·r³.'), L('Hovering: q·E = m·g with E = U/d.', 'Schweben: q·E = m·g mit E = U/d.')],
        solution: [howM, howQ, howN], pic: ['millikan', {}],
      };
    },
  };

  // ---------------------------------------------------------------- the inkjet printer
  const inkjet = {
    id: 'inkjet', difficulty: 4, title: () => L('An inkjet printer', 'Ein Tintenstrahldrucker'),
    make(r) {
      const m = r.pick([1.5, 2, 3]) * 1e-11, q = r.pick([1, 1.5, 2]) * 1e-13, v = r.pick([15, 20, 25]), Lp = 0.01, Ef = r.pick([1, 1.5, 2]) * 1e5;
      const y = (q * Ef * Lp * Lp) / (2 * m * v * v);
      const how = L(`t = L/v; across, a = q·E/m; y = ½·a·t² = q·E·L²/(2·m·v²) = ${show(y, 'len')}.`, `t = L/v; quer dazu a = q·E/m; y = ½·a·t² = q·E·L²/(2·m·v²) = ${show(y, 'len')}.`);
      const toward = L('The drops are negative: they are pulled towards the positive plate.', 'Die Tropfen sind negativ: Sie werden zur positiven Platte gezogen.');
      const neutral = L('A drop without charge feels no electric force: it flies straight on (and is caught by a gutter).', 'Ein Tropfen ohne Ladung spürt keine elektrische Kraft: Er fliegt geradeaus (und wird von einer Rinne aufgefangen).');
      return {
        text: L(`<p>In a continuous inkjet printer, tiny ink drops (mass ${sci(m)} kg) get a negative charge of ${sci(q)} C and fly at ${v} m/s between two plates 1.0 cm long, where the field is ${sci(Ef)} V/m. The deflection decides where a drop hits the paper.</p>`, `<p>In einem kontinuierlichen Tintenstrahldrucker erhalten winzige Tintentropfen (Masse ${sci(m)} kg) eine negative Ladung von ${sci(q)} C und fliegen mit ${v} m/s zwischen zwei 1.0 cm langen Platten hindurch, wo das Feld ${sci(Ef)} V/m beträgt. Die Ablenkung entscheidet, wo ein Tropfen auf das Papier trifft.</p>`),
        questions: [
          choice('y', L('(a) the deflection at the end of the plates', '(a) die Ablenkung am Ende der Platten'), values(y, [{ value: 2 * y, tag: 'noHalf', why: L(`Do not forget the ½ in y = ½·a·t². ${how}`, `Vergiss das ½ in y = ½·a·t² nicht. ${how}`) }, { value: y * v, tag: 'v', why: L(`The time is t = L/v, so v enters squared. ${how}`, `Die Zeit ist t = L/v, also geht v im Quadrat ein. ${how}`) }], 'len', how)),
          choice('dir', L('(b) The drops are deflected', '(b) Die Tropfen werden abgelenkt'), words(r, [[L('towards the positive plate', 'zur positiven Platte'), true, ''], [L('towards the negative plate', 'zur negativen Platte'), false, toward], [L('along the field', 'in Feldrichtung'), false, toward]])),
          choice('n', L('(c) A drop that has not been charged', '(c) Ein Tropfen, der nicht geladen wurde'), words(r, [[L('flies straight on', 'fliegt geradeaus'), true, ''], [L('is deflected less', 'wird weniger abgelenkt'), false, neutral], [L('is deflected the other way', 'wird in die andere Richtung abgelenkt'), false, neutral]])),
        ],
        hints: [L('Like a ball thrown horizontally: constant speed along, constant acceleration across.', 'Wie ein waagrecht geworfener Ball: konstante Geschwindigkeit längs, konstante Beschleunigung quer.')],
        solution: [how, toward, neutral], pic: ['inkjet', {}],
      };
    },
  };

  // ---------------------------------------------------------------- a thundercloud
  const cloud = {
    id: 'cloud', difficulty: 2, title: () => L('Under a thundercloud', 'Unter einer Gewitterwolke'),
    make(r) {
      const h = r.pick([1, 1.5, 2]) * 1e3, U = r.pick([50, 100, 150]) * 1e6, Ef = U / h;
      const how = L(`Roughly uniform: E = U/h = ${show(U, 'volt')} / ${nice(h)} m = ${show(Ef, 'field')}.`, `Ungefähr homogen: E = U/h = ${show(U, 'volt')} / ${nice(h)} m = ${show(Ef, 'field')}.`);
      const tips = L(`${show(Ef, 'field')} is far below the 3 MV/m at which air breaks down. But at sharp points (a tree, a mast, the tip of a growing leader) the field is many times stronger: there the discharge starts.`, `${show(Ef, 'field')} liegt weit unter den 3 MV/m, bei denen Luft durchschlägt. Aber an Spitzen (ein Baum, ein Mast, die Spitze eines wachsenden Leitblitzes) ist das Feld um ein Vielfaches stärker: Dort beginnt die Entladung.`);
      return {
        text: L(`<p>The base of a thundercloud is ${nice(h / 1000)} km above flat ground, with a voltage of ${show(U, 'volt')} between them. Air breaks down (it conducts, sparks form) at about 3 MV/m.</p>`, `<p>Die Unterseite einer Gewitterwolke liegt ${nice(h / 1000)} km über flachem Boden, mit einer Spannung von ${show(U, 'volt')} dazwischen. Luft schlägt bei etwa 3 MV/m durch (sie leitet, es bilden sich Funken).</p>`),
        questions: [
          choice('E', L('(a) the average field between cloud and ground', '(a) das mittlere Feld zwischen Wolke und Boden'), values(Ef, [{ value: U * h, tag: 'prod', why: how }, { value: Ef * 1000, tag: 'km', why: L(`h in metres. ${how}`, `h in Metern. ${how}`) }], 'field', how)),
          choice('why', L('(b) Lightning can still strike, because', '(b) Ein Blitz kann trotzdem einschlagen, weil'), words(r, [[L('the field is much stronger at sharp points', 'das Feld an Spitzen viel stärker ist'), true, ''], [L('the average field is above 3 MV/m', 'das mittlere Feld über 3 MV/m liegt'), false, tips], [L('lightning does not need a strong field', 'ein Blitz kein starkes Feld braucht'), false, tips]])),
        ],
        hints: [L('Treat cloud and ground like the plates of a capacitor: E = U/d.', 'Behandle Wolke und Boden wie die Platten eines Kondensators: E = U/d.')],
        solution: [how, tips], pic: ['cloud', {}],
      };
    },
  };

  // ---------------------------------------------------------------- a car struck by lightning
  const car = {
    id: 'car', difficulty: 2, title: () => L('Lightning strikes a car', 'Ein Blitz trifft ein Auto'),
    make(r) {
      const cage = L('The metal body is a closed conductor: the charges stay on its outside and flow round it into the ground, and inside there is no field (a Faraday cage).', 'Die Metallkarosserie ist ein geschlossener Leiter: Die Ladungen bleiben auf ihrer Aussenseite und fliessen um sie herum in den Boden, und im Innern gibt es kein Feld (ein Faradaykäfig).');
      const tyres = L('A few centimetres of rubber cannot stop lightning that has just crossed a kilometre of air.', 'Ein paar Zentimeter Gummi können einen Blitz nicht aufhalten, der gerade einen Kilometer Luft durchquert hat.');
      return {
        text: L('<p>During a thunderstorm, lightning strikes a car. The people inside are unharmed.</p>', '<p>Während eines Gewitters schlägt ein Blitz in ein Auto ein. Die Insassen bleiben unverletzt.</p>'),
        questions: [
          choice('why', L('(a) They are safe because', '(a) Sie sind sicher, weil'), words(r, [[L('the metal body shields them', 'die Metallkarosserie sie abschirmt'), true, ''], [L('the rubber tyres insulate the car', 'die Gummireifen das Auto isolieren'), false, `${tyres} ${cage}`], [L('lightning never enters metal', 'ein Blitz nie in Metall eindringt'), false, cage]])),
          choice('in', L('(b) Inside the car, the electric field during the strike is', '(b) Im Innern des Autos ist das elektrische Feld während des Einschlags'), words(r, [[L('practically zero', 'praktisch null'), true, ''], [L('as strong as outside', 'so stark wie aussen'), false, cage], [L('stronger than outside', 'stärker als aussen'), false, cage]])),
          choice('conv', L('(c) A convertible with a fabric roof', '(c) Ein Cabrio mit Stoffdach'), words(r, [[L('protects much less', 'schützt viel weniger'), true, ''], [L('protects just as well', 'schützt ebenso gut'), false, L('Without a closed metal shell, the field is not shielded.', 'Ohne geschlossene Metallhülle wird das Feld nicht abgeschirmt.')]])),
        ],
        hints: [L('What happens to charges on a conductor? Where is the field in a conductor?', 'Was geschieht mit Ladungen auf einem Leiter? Wo ist das Feld in einem Leiter?')],
        solution: [cage, tyres], pic: ['car', {}],
      };
    },
  };

  // ---------------------------------------------------------------- an electrostatic precipitator
  const filter = {
    id: 'filter', difficulty: 3, title: () => L('An electrostatic precipitator', 'Ein Elektrofilter'),
    make(r) {
      const q = r.pick([2, 5, 10]) * 1e-17, m = r.pick([1, 2, 5]) * 1e-15, Ef = r.pick([2, 3, 5]) * 1e5, F = q * Ef, ratio = F / (m * K.g);
      const how = L(`F = q·E = ${sci(q)} C · ${show(Ef, 'field')} = ${sci(F)} N.`, `F = q·E = ${sci(q)} C · ${show(Ef, 'field')} = ${sci(F)} N.`);
      const howR = L(`m·g = ${sci(m * K.g)} N: the electric force is about ${nice(ratio)} times the weight.`, `m·g = ${sci(m * K.g)} N: Die elektrische Kraft ist etwa ${nice(ratio)}-mal so gross wie das Gewicht.`);
      const where = L('The dust is charged negatively by the wires: the field pushes it to the positive plates, where it sticks and is knocked off from time to time.', 'Der Staub wird von den Drähten negativ geladen: Das Feld treibt ihn zu den positiven Platten, wo er haftet und von Zeit zu Zeit abgeklopft wird.');
      return {
        text: L(`<p>In the chimney of a power station, dust particles (mass ${sci(m)} kg) pass thin wires that charge them negatively (${sci(q)} C each). Between the wires and the collecting plates the field is ${show(Ef, 'field')}.</p>`, `<p>Im Kamin eines Kraftwerks passieren Staubteilchen (Masse ${sci(m)} kg) dünne Drähte, die sie negativ aufladen (je ${sci(q)} C). Zwischen den Drähten und den Sammelplatten beträgt das Feld ${show(Ef, 'field')}.</p>`),
        questions: [
          choice('F', L('(a) the electric force on a dust particle', '(a) die elektrische Kraft auf ein Staubteilchen'), values(F, [{ value: q * Ef * 1e-3, tag: 'kv', why: L(`E in V/m, not kV/m. ${how}`, `E in V/m, nicht kV/m. ${how}`) }], 'sci', how, { fmt: (v) => `${sci(v)} N` })),
          choice('r', L('(b) compared with its weight, about', '(b) verglichen mit seinem Gewicht etwa'), [ratio / 10, ratio, ratio * 10, ratio / 100].map((x) => ({ label: `${nice(x)} ×`, ok: x === ratio, why: howR }))),
          choice('w', L('(c) The dust collects on', '(c) Der Staub sammelt sich'), words(r, [[L('the positive plates', 'auf den positiven Platten'), true, ''], [L('the wires', 'auf den Drähten'), false, where], [L('the bottom of the chimney', 'am Boden des Kamins'), false, where]])),
        ],
        hints: [L('F = q·E; weight m·g.', 'F = q·E; Gewicht m·g.')],
        solution: [how, howR, where], pic: ['filter', {}],
      };
    },
  };

  // ---------------------------------------------------------------- a laser printer
  const printer = {
    id: 'printer', difficulty: 2, title: () => L('A laser printer', 'Ein Laserdrucker'),
    make(r) {
      const drum = L('The drum is charged negatively all over; where the laser shines, it becomes conducting and loses its charge. The negatively charged toner is repelled by the charged parts and settles only on the discharged ones: the image.', 'Die Trommel wird überall negativ geladen; wo der Laser auftrifft, wird sie leitend und verliert ihre Ladung. Der negativ geladene Toner wird von den geladenen Stellen abgestossen und setzt sich nur auf die entladenen: das Bild.');
      const paper = L('The paper behind is charged positively, more strongly: its field pulls the negative toner off the drum onto the paper.', 'Das Papier dahinter wird positiv geladen, stärker: Sein Feld zieht den negativen Toner von der Trommel auf das Papier.');
      return {
        text: L('<p>In a laser printer, a drum is charged negatively. A laser writes the page on it, and fine negatively charged toner powder is brought close to the drum. Then paper rolls past the drum.</p>', '<p>In einem Laserdrucker wird eine Trommel negativ geladen. Ein Laser schreibt die Seite darauf, und feiner, negativ geladener Toner wird nahe an die Trommel gebracht. Dann rollt Papier an der Trommel vorbei.</p>'),
        questions: [
          choice('t', L('(a) The toner sticks to the drum where', '(a) Der Toner haftet an der Trommel, wo'), words(r, [[L('the laser has removed the charge', 'der Laser die Ladung entfernt hat'), true, ''], [L('the drum is still negative', 'die Trommel noch negativ ist'), false, drum]])),
          choice('p', L('(b) To pull the toner onto the paper, the paper is charged', '(b) Um den Toner aufs Papier zu ziehen, wird das Papier geladen'), words(r, [[L('positively', 'positiv'), true, ''], [L('negatively', 'negativ'), false, paper], [L('not at all', 'gar nicht'), false, paper]])),
        ],
        hints: [L('Like charges repel, opposite charges attract.', 'Gleichnamige Ladungen stossen sich ab, ungleichnamige ziehen sich an.')],
        solution: [drum, paper], pic: ['printer', {}],
      };
    },
  };

  // ---------------------------------------------------------------- a bent jet of water
  const water = {
    id: 'water', difficulty: 3, title: () => L('A jet of water and a charged rod', 'Ein Wasserstrahl und ein geladener Stab'),
    make(r) {
      const why = L('Water molecules are dipoles. In the field of the rod they turn their end of opposite sign towards it; that end is in the stronger field, so the molecules, and the jet, are pulled towards the rod, whatever its sign.', 'Wassermoleküle sind Dipole. Im Feld des Stabs drehen sie ihr Ende mit entgegengesetztem Vorzeichen zu ihm hin; dieses Ende ist im stärkeren Feld, also werden die Moleküle, und der Strahl, zum Stab hingezogen, unabhängig von seinem Vorzeichen.');
      const sign = r.pick([1, -1]);
      return {
        text: L(`<p>A ${sign > 0 ? 'positively' : 'negatively'} charged rod is held next to a thin jet of water from a tap.</p>`, `<p>Ein ${sign > 0 ? 'positiv' : 'negativ'} geladener Stab wird neben einen dünnen Wasserstrahl aus einem Hahn gehalten.</p>`),
        questions: [
          choice('b', L('(a) The jet bends', '(a) Der Strahl biegt sich'), words(r, [[L('towards the rod', 'zum Stab hin'), true, ''], [L('away from the rod', 'vom Stab weg'), false, why], [L('not at all: water is neutral', 'gar nicht: Wasser ist neutral'), false, why]])),
          choice('o', L('(b) With a rod of the opposite charge, the jet bends', '(b) Mit einem Stab der entgegengesetzten Ladung biegt sich der Strahl'), words(r, [[L('towards the rod as well', 'ebenfalls zum Stab hin'), true, ''], [L('away from the rod', 'vom Stab weg'), false, why]])),
        ],
        hints: [L('A water molecule is neutral, but its charges are not evenly spread: it is a dipole.', 'Ein Wassermolekül ist neutral, aber seine Ladungen sind nicht gleichmässig verteilt: Es ist ein Dipol.'), L('What happens to a dipole in the field of a point charge?', 'Was geschieht mit einem Dipol im Feld einer Punktladung?')],
        solution: [why], pic: ['water', { sign }],
      };
    },
  };

  const PROBLEMS = [millikan, inkjet, cloud, car, filter, printer, water];
  function realOf(i, seed) {
    const p = PROBLEMS[i], ex = p.make(rng(seed * 61 + 31));
    return { ...ex, kind: 'real', type: `real-${p.id}`, problem: p.id, title: p.title(), difficulty: p.difficulty, figs: '' };
  }
  const api = { PROBLEMS, realOf };
  root.FieldProblems = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
