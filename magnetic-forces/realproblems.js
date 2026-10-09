// Problems: magnetic forces in nature and technology, told as stories, each with a picture
// (figures.js) and questions with options from typical mistakes: the aurora (charges spiral along
// the field lines and are turned back near the poles), the mass spectrometer, the cyclotron, the
// fine-beam tube (e/m), a particle detector, a short circuit between two cables, and cosmic rays
// (the Earth's field shields the equator better than the poles).
//   PROBLEMS[i]  { id, difficulty, title(), make(r) }; realOf(i, seed) the exercise (app.js)
(function (root) {
  'use strict';

  const M = root.Magnet || require('./generator.js');
  const X = root.MagEx || require('./exercises.js');
  const Lang = root.Lang || require('./lang.js');
  const L = (en, de) => Lang.L(en, de);
  const { sci, nice, values } = X;
  const e = 1.602e-19, u = 1.661e-27, me = 9.109e-31, mp = 1.673e-27, MU0 = 4e-7 * Math.PI;

  const choice = (key, label, options) => ({ type: 'choice', key, label, options });
  const words = (r, list) => r.shuffle(list.map(([label, ok, why]) => ({ label, ok, why: ok ? '' : why })));
  // values in another unit than m or s
  function plain(right, mistakes, unit, how) {
    const out = [{ value: right, ok: true, why: '' }];
    for (const m of [...mistakes, ...[2, 0.5, 4].map((k) => ({ value: right * k, tag: 'other', why: how }))]) {
      if (out.length === 4) break;
      if (Number.isFinite(m.value) && m.value > 0 && out.every((o) => Math.abs(Math.log(m.value / o.value)) > Math.log(1.15))) out.push({ ...m, ok: false });
    }
    return out.sort((a, b) => a.value - b.value).map((o) => ({ ...o, label: `${sci(o.value)} ${unit}`.trim() }));
  }

  // ---------------------------------------------------------------- the aurora
  const aurora = {
    id: 'aurora', difficulty: 2, title: () => L('The aurora', 'Das Polarlicht'),
    make(r) {
      const helix = L('Across the field lines, the magnetic force makes them circle; along the field lines there is no force. So they spiral along the field lines.', 'Quer zu den Feldlinien lässt die magnetische Kraft sie kreisen; längs der Feldlinien gibt es keine Kraft. Also bewegen sie sich schraubenförmig längs der Feldlinien.');
      const poles = L('The field lines lead the particles to the regions around the poles, where they enter the atmosphere: there it glows.', 'Die Feldlinien führen die Teilchen in die Gebiete um die Pole, wo sie in die Atmosphäre eintreten: Dort leuchtet sie.');
      const mirror = L('Towards the poles the field lines crowd together: the field gets stronger, the circles tighter, and most particles are turned back before they reach the ground (a magnetic mirror). They bounce between north and south.', 'Zu den Polen hin rücken die Feldlinien zusammen: Das Feld wird stärker, die Kreise enger, und die meisten Teilchen werden umgelenkt, bevor sie den Boden erreichen (ein magnetischer Spiegel). Sie pendeln zwischen Nord und Süd.');
      return {
        text: L('<p>The solar wind carries electrons and protons to the Earth. Some are caught in the Earth’s magnetic field, and near the poles they make the air glow: the aurora.</p>', '<p>Der Sonnenwind bringt Elektronen und Protonen zur Erde. Einige werden im Magnetfeld der Erde eingefangen und bringen in der Nähe der Pole die Luft zum Leuchten: das Polarlicht.</p>'),
        questions: [
          choice('path', L('(a) The caught particles move', '(a) Die eingefangenen Teilchen bewegen sich'), words(r, [[L('on helices along the field lines', 'auf Schraubenlinien längs der Feldlinien'), true, ''], [L('straight along the field lines', 'gerade längs der Feldlinien'), false, helix], [L('on circles around the Earth’s centre', 'auf Kreisen um den Erdmittelpunkt'), false, helix]])),
          choice('where', L('(b) The aurora appears mostly near the poles, because', '(b) Das Polarlicht erscheint vor allem in Polnähe, weil'), words(r, [[L('the field lines lead the particles there', 'die Feldlinien die Teilchen dorthin führen'), true, ''], [L('it is colder there', 'es dort kälter ist'), false, poles], [L('the Sun shines on the poles more', 'die Sonne mehr auf die Pole scheint'), false, poles]])),
          choice('back', L('(c) Many particles never reach the ground near the poles, because', '(c) Viele Teilchen erreichen den Boden in Polnähe nie, weil'), words(r, [[L('the stronger field there turns them back', 'das stärkere Feld dort sie umkehren lässt'), true, ''], [L('the field slows them down', 'das Feld sie abbremst'), false, L(`The magnetic force does no work: it cannot slow them down. ${mirror}`, `Die magnetische Kraft verrichtet keine Arbeit: Sie kann sie nicht abbremsen. ${mirror}`)], [L('they lose their charge', 'sie ihre Ladung verlieren'), false, mirror]])),
        ],
        hints: [L('Split the velocity into a part along the field and a part across it.', 'Zerlege die Geschwindigkeit in einen Teil längs des Feldes und einen Teil quer dazu.'), L('Near the poles, the field lines come together.', 'In Polnähe laufen die Feldlinien zusammen.')],
        solution: [helix, poles, mirror], pic: ['earth', { aurora: true }],
      };
    },
  };

  // ---------------------------------------------------------------- a mass spectrometer
  const spectro = {
    id: 'spectro', difficulty: 3, title: () => L('A mass spectrometer', 'Ein Massenspektrometer'),
    make(r) {
      const [m1, m2, name] = r.pick([[12, 14, 'C'], [35, 37, 'Cl'], [235, 238, 'U'], [16, 18, 'O']]), v = r.pick([1, 2, 4]) * 1e5, B = r.pick([0.2, 0.5, 0.8, 1]);
      const r1 = (m1 * u * v) / (e * B), r2 = (m2 * u * v) / (e * B), d = 2 * (r2 - r1);
      const how = L(`r = m·v/(q·B) = ${m1} · 1.661 · 10<sup>−27</sup> kg · ${sci(v)} m/s / (1.602 · 10<sup>−19</sup> C · ${nice(B)} T) = ${X.show(r1, 'len')}.`, `r = m·v/(q·B) = ${m1} · 1.661 · 10<sup>−27</sup> kg · ${sci(v)} m/s / (1.602 · 10<sup>−19</sup> C · ${nice(B)} T) = ${X.show(r1, 'len')}.`);
      const howD = L(`The ions hit the plate after half a circle, at 2r from the entrance: 2·(${X.show(r2, 'len')} − ${X.show(r1, 'len')}) = ${X.show(d, 'len')}.`, `Die Ionen treffen nach einem Halbkreis auf die Platte, im Abstand 2r vom Eintritt: 2·(${X.show(r2, 'len')} − ${X.show(r1, 'len')}) = ${X.show(d, 'len')}.`);
      return {
        text: L(`<p>A mass spectrometer separates the isotopes <sup>${m1}</sup>${name}⁺ and <sup>${m2}</sup>${name}⁺: the singly charged ions enter a magnetic field of ${nice(B)} T at ${sci(v)} m/s, move on a half circle and hit a detector plate. (1 u = 1.661 · 10<sup>−27</sup> kg)</p>`,
          `<p>Ein Massenspektrometer trennt die Isotope <sup>${m1}</sup>${name}⁺ und <sup>${m2}</sup>${name}⁺: Die einfach geladenen Ionen treten mit ${sci(v)} m/s in ein Magnetfeld von ${nice(B)} T ein, bewegen sich auf einem Halbkreis und treffen eine Detektorplatte. (1 u = 1.661 · 10<sup>−27</sup> kg)</p>`),
        questions: [
          choice('r', L(`(a) the radius of the path of <sup>${m1}</sup>${name}⁺`, `(a) der Radius der Bahn von <sup>${m1}</sup>${name}⁺`), values(r1, [{ value: 2 * r1, tag: 'diam', why: L(`That is the diameter. ${how}`, `Das ist der Durchmesser. ${how}`) }, { value: (m1 * mp * v) / (e * B), tag: 'mp', why: how }], 'len', how)),
          choice('d', L('(b) how far apart the two isotopes hit the plate', '(b) wie weit auseinander die beiden Isotope auf die Platte treffen'), values(d, [{ value: d / 2, tag: 'radius', why: L(`They hit at twice the radius. ${howD}`, `Sie treffen im doppelten Radius auf. ${howD}`) }, { value: 2 * r2, tag: 'whole', why: howD }], 'len', howD)),
          choice('far', L('(c) The isotope that hits farther from the entrance is', '(c) Weiter vom Eintritt trifft das Isotop'), words(r, [[`<sup>${m2}</sup>${name}⁺`, true, ''], [`<sup>${m1}</sup>${name}⁺`, false, L('r = m·v/(q·B): the heavier ion moves on the larger circle.', 'r = m·v/(q·B): Das schwerere Ion bewegt sich auf dem grösseren Kreis.')]])),
        ],
        hints: [L('r = m·v/(q·B).', 'r = m·v/(q·B).'), L('After half a circle, an ion is 2r from where it entered.', 'Nach einem Halbkreis ist ein Ion 2r vom Eintritt entfernt.')],
        solution: [how, howD], pic: ['spectro', {}],
      };
    },
  };

  // ---------------------------------------------------------------- a cyclotron
  const cyclo = {
    id: 'cyclo', difficulty: 4, title: () => L('A cyclotron', 'Ein Zyklotron'),
    make(r) {
      const B = r.pick([1, 1.2, 1.5, 1.8]), R = r.pick([0.3, 0.5, 0.75]);
      const f = (e * B) / (2 * Math.PI * mp), v = (e * B * R) / mp, E = 0.5 * mp * v * v / e / 1e6;
      const howF = L(`The protons circle with the period T = 2π·m/(q·B), whatever their speed: f = q·B/(2π·m) = ${sci(f)} Hz.`, `Die Protonen kreisen mit der Umlaufzeit T = 2π·m/(q·B), unabhängig von ihrer Geschwindigkeit: f = q·B/(2π·m) = ${sci(f)} Hz.`);
      const howV = L(`At the edge, r = R: v = q·B·R/m = ${sci(v)} m/s, a kinetic energy of ½·m·v² = ${nice(E)} MeV.`, `Am Rand ist r = R: v = q·B·R/m = ${sci(v)} m/s, eine kinetische Energie von ½·m·v² = ${nice(E)} MeV.`);
      const howR = L('v = q·B·R/m grows with R, the energy ½·m·v² with R²: twice the radius, four times the energy.', 'v = q·B·R/m wächst mit R, die Energie ½·m·v² mit R²: doppelter Radius, vierfache Energie.');
      return {
        text: L(`<p>In a cyclotron, protons circle in a magnetic field of ${nice(B)} T between two hollow half discs (the “dees”); an alternating voltage between the dees speeds them up twice per turn, so they spiral outwards. The dees have a radius of ${nice(R)} m.</p>`,
          `<p>In einem Zyklotron kreisen Protonen in einem Magnetfeld von ${nice(B)} T zwischen zwei hohlen Halbscheiben (den «Duanten»); eine Wechselspannung zwischen den Duanten beschleunigt sie zweimal pro Umlauf, sodass sie nach aussen spiralen. Die Duanten haben einen Radius von ${nice(R)} m.</p>`),
        questions: [
          choice('f', L('(a) the frequency of the alternating voltage (one cycle per turn)', '(a) die Frequenz der Wechselspannung (eine Periode pro Umlauf)'), plain(f, [{ value: f * 2 * Math.PI, tag: 'omega', why: L(`That is the angular frequency. ${howF}`, `Das ist die Kreisfrequenz. ${howF}`) }, { value: 2 * f, tag: 'twice', why: howF }], 'Hz', howF)),
          choice('v', L('(b) the speed of the protons when they leave at the edge', '(b) die Geschwindigkeit der Protonen, wenn sie am Rand austreten'), plain(v, [{ value: v / 2, tag: 'half', why: howV }, { value: (e * B * R * R) / mp, tag: 'r2', why: howV }], 'm/s', howV)),
          choice('E', L('(c) With dees twice as large (same field), the final energy would be', '(c) Mit doppelt so grossen Duanten (gleiches Feld) wäre die Endenergie'), words(r, [[L('four times as large', 'viermal so gross'), true, ''], [L('twice as large', 'doppelt so gross'), false, howR], [L('the same', 'gleich gross'), false, howR]])),
        ],
        hints: [L('T = 2π·m/(q·B) does not depend on the speed.', 'T = 2π·m/(q·B) hängt nicht von der Geschwindigkeit ab.'), L('r = m·v/(q·B), so v = q·B·r/m.', 'r = m·v/(q·B), also v = q·B·r/m.')],
        solution: [howF, howV, howR], pic: ['cyclo', {}],
      };
    },
  };

  // ---------------------------------------------------------------- the fine-beam tube
  const beam = {
    id: 'beam', difficulty: 3, title: () => L('The fine-beam tube', 'Das Fadenstrahlrohr'),
    make(r) {
      const U = r.pick([150, 200, 250, 300]), B = r.pick([0.8, 1, 1.2]) * 1e-3, v = Math.sqrt((2 * e * U) / me), R = Math.round(((me * v) / (e * B)) * 1000) / 1000, em = (2 * U) / (B * B * R * R);
      const how = L(`The electrons get ½·m·v² = e·U, and circle with r = m·v/(e·B). Together: e/m = 2U/(B²·r²) = 2 · ${U} V / ((${nice(B * 1000)} · 10<sup>−3</sup> T)² · (${nice(R)} m)²) = ${sci(em)} C/kg.`,
        `Die Elektronen erhalten ½·m·v² = e·U und kreisen mit r = m·v/(e·B). Zusammen: e/m = 2U/(B²·r²) = 2 · ${U} V / ((${nice(B * 1000)} · 10<sup>−3</sup> T)² · (${nice(R)} m)²) = ${sci(em)} C/kg.`);
      const up = L('A higher voltage makes the electrons faster: r = m·v/(e·B) grows.', 'Eine höhere Spannung macht die Elektronen schneller: r = m·v/(e·B) wächst.');
      return {
        text: L(`<p>In a fine-beam tube, electrons accelerated by ${U} V make a thin glowing beam in a low-pressure gas. Helmholtz coils make a uniform field of ${nice(B * 1000)} mT perpendicular to the beam; the beam forms a circle with a radius of ${nice(R * 100)} cm.</p>`,
          `<p>In einem Fadenstrahlrohr erzeugen Elektronen, die mit ${U} V beschleunigt werden, in einem Gas niedrigen Drucks einen dünnen leuchtenden Strahl. Helmholtzspulen erzeugen ein homogenes Feld von ${nice(B * 1000)} mT senkrecht zum Strahl; der Strahl bildet einen Kreis mit einem Radius von ${nice(R * 100)} cm.</p>`),
        questions: [
          choice('why', L('(a) The beam is a circle because the magnetic force', '(a) Der Strahl ist ein Kreis, weil die magnetische Kraft'), words(r, [[L('is always perpendicular to the velocity', 'immer senkrecht zur Geschwindigkeit steht'), true, ''], [L('points towards the coils', 'zu den Spulen zeigt'), false, L('The force is perpendicular to the velocity and the field: it changes only the direction, so the electrons circle.', 'Die Kraft steht senkrecht zur Geschwindigkeit und zum Feld: Sie ändert nur die Richtung, also kreisen die Elektronen.')], [L('slows the electrons down', 'die Elektronen abbremst'), false, L('The magnetic force does no work; the speed stays the same.', 'Die magnetische Kraft verrichtet keine Arbeit; der Betrag der Geschwindigkeit bleibt gleich.')]])),
          choice('em', L('(b) the specific charge e/m of the electron from these values', '(b) die spezifische Ladung e/m des Elektrons aus diesen Werten'), plain(em, [{ value: em / 2, tag: 'half', why: how }, { value: U / (B * B * R * R) * 4, tag: 'four', why: how }], 'C/kg', how)),
          choice('U', L('(c) With a higher accelerating voltage, the circle gets', '(c) Mit einer höheren Beschleunigungsspannung wird der Kreis'), words(r, [[L('larger', 'grösser'), true, ''], [L('smaller', 'kleiner'), false, up], [L('no different', 'nicht anders'), false, up]])),
        ],
        hints: [L('Energy: ½·m·v² = e·U.', 'Energie: ½·m·v² = e·U.'), L('Circle: e·v·B = m·v²/r.', 'Kreis: e·v·B = m·v²/r.')],
        solution: [how, up], pic: ['beam', {}],
      };
    },
  };

  // ---------------------------------------------------------------- a particle detector
  const detector = {
    id: 'detector', difficulty: 3, title: () => L('A particle detector', 'Ein Teilchendetektor'),
    make(r) {
      const B = r.pick([2, 3.8, 4]), R = r.pick([0.5, 1, 2, 5]), p = e * B * R;
      const how = L(`r = p/(q·B), so p = q·B·r = 1.602 · 10<sup>−19</sup> C · ${nice(B)} T · ${nice(R)} m = ${sci(p)} kg·m/s.`, `r = p/(q·B), also p = q·B·r = 1.602 · 10<sup>−19</sup> C · ${nice(B)} T · ${nice(R)} m = ${sci(p)} kg·m/s.`);
      const straight = L('r = p/(q·B): the larger the momentum, the larger the radius, the straighter the track.', 'r = p/(q·B): Je grösser der Impuls, desto grösser der Radius, desto gerader die Spur.');
      return {
        text: L(`<p>In a particle detector at CERN, a field of ${nice(B)} T runs along the beam pipe. A singly charged particle leaves a track bent on a circle with a radius of ${nice(R)} m.</p>`,
          `<p>In einem Teilchendetektor am CERN verläuft ein Feld von ${nice(B)} T längs des Strahlrohrs. Ein einfach geladenes Teilchen hinterlässt eine Spur, die auf einem Kreis mit einem Radius von ${nice(R)} m gekrümmt ist.</p>`),
        questions: [
          choice('p', L('(a) the momentum of the particle', '(a) der Impuls des Teilchens'), plain(p, [{ value: p / B / B, tag: 'b2', why: how }, { value: e * R / B, tag: 'inv', why: how }], 'kg·m/s', how)),
          choice('st', L('(b) A nearly straight track belongs to a particle with', '(b) Eine fast gerade Spur gehört zu einem Teilchen mit'), words(r, [[L('a very large momentum', 'einem sehr grossen Impuls'), true, ''], [L('a very small momentum', 'einem sehr kleinen Impuls'), false, straight], [L('no charge', 'keiner Ladung'), false, L(`A neutral particle leaves no track in such a detector at all. ${straight}`, `Ein neutrales Teilchen hinterlässt in einem solchen Detektor gar keine Spur. ${straight}`)]])),
          choice('sign', L('(c) Two tracks bend in opposite directions. This tells', '(c) Zwei Spuren krümmen sich in entgegengesetzte Richtungen. Das zeigt'), words(r, [[L('that their charges have opposite signs', 'dass ihre Ladungen entgegengesetzte Vorzeichen haben'), true, ''], [L('that their masses differ', 'dass sich ihre Massen unterscheiden'), false, L('The direction of bending depends only on the sign of the charge (right or left hand).', 'Die Richtung der Krümmung hängt nur vom Vorzeichen der Ladung ab (rechte oder linke Hand).')], [L('that one is faster', 'dass eines schneller ist'), false, L('The direction of bending depends only on the sign of the charge (right or left hand).', 'Die Richtung der Krümmung hängt nur vom Vorzeichen der Ladung ab (rechte oder linke Hand).')]])),
        ],
        hints: [L('q·v·B = m·v²/r gives r = m·v/(q·B) = p/(q·B).', 'q·v·B = m·v²/r ergibt r = m·v/(q·B) = p/(q·B).')],
        solution: [how, straight], pic: ['detector', {}],
      };
    },
  };

  // ---------------------------------------------------------------- a short circuit
  const cables = {
    id: 'cables', difficulty: 3, title: () => L('A short circuit between two cables', 'Ein Kurzschluss zwischen zwei Kabeln'),
    make(r) {
      const I = r.pick([10, 20, 40]) * 1e3, d = r.pick([0.1, 0.2, 0.3]), I0 = r.pick([100, 200, 500]), F = (MU0 * I * I) / (2 * Math.PI * d), k = (I / I0) ** 2;
      const how = L(`F/l = μ₀·I²/(2π·d) = 4π · 10<sup>−7</sup> V·s/(A·m) · (${sci(I)} A)² / (2π · ${nice(d)} m) = ${sci(F)} N/m.`, `F/l = μ₀·I²/(2π·d) = 4π · 10<sup>−7</sup> V·s/(A·m) · (${sci(I)} A)² / (2π · ${nice(d)} m) = ${sci(F)} N/m.`);
      const rep = L('The current flows out in one cable and back in the other: opposite currents repel each other.', 'Der Strom fliesst im einen Kabel hin und im anderen zurück: Entgegengesetzte Ströme stossen sich ab.');
      const sq = L(`The force grows with I² (the field of one current acts on the other current): (${sci(I)} A / ${I0} A)² = ${sci(k)}.`, `Die Kraft wächst mit I² (das Feld des einen Stroms wirkt auf den anderen Strom): (${sci(I)} A / ${I0} A)² = ${sci(k)}.`);
      return {
        text: L(`<p>Two straight power cables run parallel, ${nice(d * 100)} cm apart; one carries the current out, the other back. In a short circuit, ${sci(I)} A flow for a moment instead of the usual ${I0} A. (μ₀ = 4π · 10<sup>−7</sup> V·s/(A·m))</p>`,
          `<p>Zwei gerade Stromkabel verlaufen parallel im Abstand von ${nice(d * 100)} cm; das eine führt den Strom hin, das andere zurück. Bei einem Kurzschluss fliessen für einen Moment ${sci(I)} A statt der üblichen ${I0} A. (μ₀ = 4π · 10<sup>−7</sup> V·s/(A·m))</p>`),
        questions: [
          choice('dir', L('(a) The cables', '(a) Die Kabel'), words(r, [[L('push each other apart', 'stossen sich ab'), true, ''], [L('pull each other together', 'ziehen sich an'), false, rep], [L('feel no force', 'spüren keine Kraft'), false, rep]])),
          choice('F', L('(b) the force on each metre of cable during the short circuit', '(b) die Kraft auf jeden Meter Kabel während des Kurzschlusses'), plain(F, [{ value: F * 2 * Math.PI, tag: 'twopi', why: how }, { value: F / I, tag: 'lin', why: how }], 'N/m', how)),
          choice('k', L('(c) Compared with the usual current, the force is larger by a factor of', '(c) Verglichen mit dem üblichen Strom ist die Kraft grösser um den Faktor'), plain(k, [{ value: I / I0, tag: 'lin', why: sq }], '', sq)),
        ],
        hints: [L('The field of a long straight current: B = μ₀·I/(2π·d).', 'Das Feld eines langen geraden Stroms: B = μ₀·I/(2π·d).'), L('The force on the other cable per metre: F/l = I·B.', 'Die Kraft auf das andere Kabel pro Meter: F/l = I·B.'), L('Out and back: opposite currents.', 'Hin und zurück: entgegengesetzte Ströme.')],
        solution: [rep, how, sq], pic: ['cables', {}],
      };
    },
  };

  // ---------------------------------------------------------------- cosmic rays
  const cosmic = {
    id: 'cosmic', difficulty: 3, title: () => L('Cosmic rays and the Earth’s field', 'Kosmische Strahlung und das Erdfeld'),
    make(r) {
      const why = L('Near the equator the field lines run parallel to the ground: particles from above move across them and are deflected. Near the poles the field lines point into the ground: particles coming down along them feel hardly any force.', 'In Äquatornähe verlaufen die Feldlinien parallel zum Boden: Teilchen von oben bewegen sich quer zu ihnen und werden abgelenkt. In Polnähe zeigen die Feldlinien in den Boden: Teilchen, die längs ihnen herunterkommen, spüren kaum eine Kraft.');
      const east = L('Right hand: thumb down (the motion), index finger north (the field): the middle finger points east.', 'Rechte Hand: Daumen nach unten (die Bewegung), Zeigefinger nach Norden (das Feld): Der Mittelfinger zeigt nach Osten.');
      return {
        text: L('<p>Cosmic rays are mostly fast protons from space. The Earth’s magnetic field shields us from part of them. At the equator, the field points north, parallel to the ground.</p>', '<p>Kosmische Strahlung besteht vor allem aus schnellen Protonen aus dem All. Das Magnetfeld der Erde schirmt uns von einem Teil davon ab. Am Äquator zeigt das Feld nach Norden, parallel zum Boden.</p>'),
        questions: [
          choice('where', L('(a) The shielding is weakest', '(a) Die Abschirmung ist am schwächsten'), words(r, [[L('near the poles', 'in Polnähe'), true, ''], [L('near the equator', 'in Äquatornähe'), false, why], [L('everywhere the same', 'überall gleich'), false, why]])),
          choice('why', L('(b) because there the particles come in', '(b) weil die Teilchen dort'), words(r, [[L('along the field lines', 'längs der Feldlinien hereinkommen'), true, ''], [L('across the field lines', 'quer zu den Feldlinien hereinkommen'), false, why], [L('where the field is weakest', 'dort hereinkommen, wo das Feld am schwächsten ist'), false, L(`Near the poles the field is in fact strongest. ${why}`, `In Polnähe ist das Feld sogar am stärksten. ${why}`)]])),
          choice('east', L('(c) A proton coming straight down at the equator is deflected', '(c) Ein Proton, das am Äquator senkrecht herunterkommt, wird abgelenkt nach'), words(r, [[L('to the east', 'Osten'), true, ''], [L('to the west', 'Westen'), false, east], [L('to the north', 'Norden'), false, L(`The force is perpendicular to the field. ${east}`, `Die Kraft steht senkrecht zum Feld. ${east}`)]])),
        ],
        hints: [L('No force on a charge moving along the field.', 'Keine Kraft auf eine Ladung, die sich längs des Feldes bewegt.'), L('Where do the field lines run parallel to the ground, where into it?', 'Wo verlaufen die Feldlinien parallel zum Boden, wo in ihn hinein?')],
        solution: [why, east], pic: ['earth', { cosmic: true }],
      };
    },
  };

  const PROBLEMS = [aurora, spectro, cyclo, beam, detector, cables, cosmic];
  function realOf(i, seed) {
    const p = PROBLEMS[i], ex = p.make(M.rng(seed * 61 + 31));
    return { ...ex, kind: 'real', type: `real-${p.id}`, problem: p.id, title: p.title(), difficulty: p.difficulty, figs: '' };
  }

  const api = { PROBLEMS, realOf };
  root.MagProblems = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
