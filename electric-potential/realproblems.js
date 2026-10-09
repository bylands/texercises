// Problems of Electric Potential: accelerators and fields in medicine, space and research, told as
// stories, each with a picture (figures.js): an X-ray tube, an electron gun, the ion thruster of the
// Dawn probe, proton therapy (relativistic), a Van de Graaff generator (limited by the breakdown of
// air), the membrane of a nerve cell, an electron microscope and Rutherford's experiment.
//   PROBLEMS[i]  { id, difficulty, title(), make(r) }; realOf(i, seed) the exercise (app.js)
(function (root) {
  'use strict';

  const E = root.Elec || require('../electric-field/elec.js');
  const { L, rng, nice, sci, show, values, choice, words, K } = E;
  const h = 6.626e-34;
  const keV = (x) => `${nice(x / 1e3)} keV`;

  const xray = {
    id: 'xray', difficulty: 3, title: () => L('An X-ray tube', 'Eine Röntgenröhre'),
    make(r) {
      const U = r.pick([30, 50, 80, 120]) * 1e3, lam = (h * K.c) / (K.e * U);
      const how = L(`Each electron gains e·U = ${keV(U)} on its way to the anode.`, `Jedes Elektron gewinnt auf dem Weg zur Anode e·U = ${keV(U)}.`);
      const howL = L(`The shortest wavelength belongs to a photon carrying an electron's whole energy: h·c/λ = e·U, λ = h·c/(e·U) = ${show(lam, 'len')}.`, `Die kürzeste Wellenlänge gehört zu einem Photon mit der ganzen Energie eines Elektrons: h·c/λ = e·U, λ = h·c/(e·U) = ${show(lam, 'len')}.`);
      return {
        text: L(`<p>In an X-ray tube, electrons from a hot cathode are accelerated through ${nice(U / 1e3)} kV and hit a metal anode, where they produce X-rays. (h = 6.63 · 10⁻³⁴ J·s, c = 3.00 · 10⁸ m/s)</p>`, `<p>In einer Röntgenröhre werden Elektronen aus einer Glühkathode mit ${nice(U / 1e3)} kV beschleunigt und treffen auf eine Metallanode, wo sie Röntgenstrahlung erzeugen. (h = 6.63 · 10⁻³⁴ J·s, c = 3.00 · 10⁸ m/s)</p>`),
        questions: [
          choice('E', L('(a) the kinetic energy of an electron at the anode', '(a) die kinetische Energie eines Elektrons an der Anode'), values(U, [{ value: U / 2, tag: 'half', why: how }], null, how, { fmt: keV })),
          choice('l', L('(b) the shortest wavelength of the X-rays', '(b) die kürzeste Wellenlänge der Röntgenstrahlung'), values(lam, [{ value: lam * 1e3, tag: 'prefix', why: howL }], 'len', howL)),
          choice('U', L('(c) With a higher voltage, the shortest wavelength', '(c) Mit einer höheren Spannung wird die kürzeste Wellenlänge'), words(r, [[L('gets shorter', 'kürzer'), true, ''], [L('gets longer', 'länger'), false, howL], [L('stays the same', 'gleich'), false, howL]])),
        ],
        hints: [L('Through a voltage U, an electron gains e·U.', 'Mit einer Spannung U gewinnt ein Elektron e·U.'), L('A photon has the energy E = h·c/λ.', 'Ein Photon hat die Energie E = h·c/λ.')],
        solution: [how, howL], pic: ['xray', {}],
      };
    },
  };

  const gun = {
    id: 'gun', difficulty: 2, title: () => L('An electron gun', 'Eine Elektronenkanone'),
    make(r) {
      const U = r.pick([1, 2, 5, 10]) * 1e3, v = Math.sqrt((2 * K.e * U) / K.me);
      const how = L(`½·m·v² = e·U, v = √(2·e·U/m) = ${sci(v)} m/s.`, `½·m·v² = e·U, v = √(2·e·U/m) = ${sci(v)} m/s.`);
      const rel = L(`${keV(U)} is only ${nice((U / 511e3) * 100)} % of the electron's rest energy (511 keV): the classical formula is good.`, `${keV(U)} sind nur ${nice((U / 511e3) * 100)} % der Ruheenergie des Elektrons (511 keV): Die klassische Formel ist gut.`);
      return {
        text: L(`<p>In an old television tube or an oscilloscope, an electron gun accelerates electrons through ${nice(U / 1e3)} kV.</p>`, `<p>In einer alten Fernsehröhre oder einem Oszilloskop beschleunigt eine Elektronenkanone Elektronen mit ${nice(U / 1e3)} kV.</p>`),
        questions: [
          choice('v', L('(a) the speed of the electrons', '(a) die Geschwindigkeit der Elektronen'), values(v, [{ value: v / Math.SQRT2, tag: 'two', why: how }, { value: v * Math.sqrt(1836), tag: 'mass', why: how }], 'speed', how)),
          choice('rel', L('(b) For this speed,', '(b) Für diese Geschwindigkeit'), words(r, [[L('the classical formula is good enough', 'genügt die klassische Formel'), true, ''], [L('relativity is needed', 'braucht es die Relativitätstheorie'), false, rel]])),
        ],
        hints: [L('½·m·v² = e·U; m = 9.11 · 10⁻³¹ kg.', '½·m·v² = e·U; m = 9.11 · 10⁻³¹ kg.')],
        solution: [how, rel], pic: ['gun', {}],
      };
    },
  };

  const dawn = {
    id: 'dawn', difficulty: 4, title: () => L('The ion thruster of Dawn', 'Das Ionentriebwerk von Dawn'),
    make(r) {
      const U = r.pick([1, 1.2, 1.5]) * 1e3, I = r.pick([1.5, 1.8, 2]), m = 131.3 * K.u, v = Math.sqrt((2 * K.e * U) / m), mdot = (I * m) / K.e, F = mdot * v;
      const how = L(`½·m·v² = e·U with the mass of a xenon ion, 131 u: v = √(2·e·U/m) = ${sci(v)} m/s.`, `½·m·v² = e·U mit der Masse eines Xenon-Ions, 131 u: v = √(2·e·U/m) = ${sci(v)} m/s.`);
      const howF = L(`The current I = ${nice(I)} A carries I/e ions per second, a mass flow of I·m/e = ${sci(mdot)} kg/s. The thrust is F = (mass flow)·v = ${show(F, 'force')}.`, `Der Strom I = ${nice(I)} A trägt I/e Ionen pro Sekunde, einen Massenstrom von I·m/e = ${sci(mdot)} kg/s. Der Schub ist F = (Massenstrom)·v = ${show(F, 'force')}.`);
      return {
        text: L(`<p>The space probe Dawn was driven by ion thrusters: xenon ions (Xe⁺, 131 u) are accelerated through ${nice(U)} V and shot out backwards, as a current of ${nice(I)} A. (1 u = 1.661 · 10⁻²⁷ kg)</p>`, `<p>Die Raumsonde Dawn wurde von Ionentriebwerken angetrieben: Xenon-Ionen (Xe⁺, 131 u) werden mit ${nice(U)} V beschleunigt und als Strom von ${nice(I)} A nach hinten ausgestossen. (1 u = 1.661 · 10⁻²⁷ kg)</p>`),
        questions: [
          choice('v', L('(a) the speed of the ions', '(a) die Geschwindigkeit der Ionen'), values(v, [{ value: v / Math.SQRT2, tag: 'two', why: how }], 'speed', how)),
          choice('F', L('(b) the thrust', '(b) der Schub'), values(F, [{ value: F / 2, tag: 'half', why: howF }], 'force', howF)),
        ],
        hints: [L('½·m·v² = e·U.', '½·m·v² = e·U.'), L('The current is the charge per second; each ion carries e.', 'Der Strom ist die Ladung pro Sekunde; jedes Ion trägt e.'), L('Thrust = mass per second × speed.', 'Schub = Masse pro Sekunde × Geschwindigkeit.')],
        solution: [how, howF], pic: ['dawn', {}],
      };
    },
  };

  const therapy = {
    id: 'therapy', difficulty: 4, title: () => L('Proton therapy', 'Protonentherapie'),
    make(r) {
      const Ek = r.pick([150, 200, 230]), E0 = 938.3, g = 1 + Ek / E0, beta = Math.sqrt(1 - 1 / (g * g)), cl = Math.sqrt((2 * Ek) / E0);
      const how = L(`E_kin/E₀ = ${Ek} MeV / 938 MeV = ${nice(Ek / E0)}: far from small. Relativistically, E = E₀ + E_kin = γ·E₀, γ = ${nice(g)}, v = c·√(1 − 1/γ²) = ${nice(beta)} c. The classical formula would give ${nice(cl)} c.`, `E_kin/E₀ = ${Ek} MeV / 938 MeV = ${nice(Ek / E0)}: alles andere als klein. Relativistisch ist E = E₀ + E_kin = γ·E₀, γ = ${nice(g)}, v = c·√(1 − 1/γ²) = ${nice(beta)} c. Die klassische Formel ergäbe ${nice(cl)} c.`);
      const howU = L(`A proton (charge e) with ${Ek} MeV has the energy of a single acceleration through ${Ek} MV.`, `Ein Proton (Ladung e) mit ${Ek} MeV hat die Energie einer einzigen Beschleunigung mit ${Ek} MV.`);
      return {
        text: L(`<p>In proton therapy, protons with ${Ek} MeV are aimed at a tumour. (Rest energy of the proton: 938 MeV)</p>`, `<p>In der Protonentherapie werden Protonen mit ${Ek} MeV auf einen Tumor gerichtet. (Ruheenergie des Protons: 938 MeV)</p>`),
        questions: [
          choice('U', L('(a) the voltage that would give them this energy in one go', '(a) die Spannung, die ihnen diese Energie in einem Schritt gäbe'), values(Ek * 1e6, [{ value: Ek * 1e3, tag: 'prefix', why: howU }], 'volt', howU)),
          choice('v', L('(b) their speed', '(b) ihre Geschwindigkeit'), [beta, cl, 1, beta / 2].map((x) => ({ label: x === 1 ? 'c' : `${nice(x)} c`, ok: x === beta, why: how }))),
        ],
        hints: [L('Compare the kinetic energy with the rest energy.', 'Vergleiche die kinetische Energie mit der Ruheenergie.'), L('E = γ·E₀ with γ = 1/√(1 − v²/c²).', 'E = γ·E₀ mit γ = 1/√(1 − v²/c²).')],
        solution: [howU, how], pic: ['therapy', {}],
      };
    },
  };

  const vdg = {
    id: 'vdg', difficulty: 3, title: () => L('A Van de Graaff generator', 'Ein Van-de-Graaff-Generator'),
    make(r) {
      const R = r.pick([10, 15, 20, 25]) / 100, Eb = 3e6, V = Eb * R, Q = (V * R) / K.k;
      const how = L(`At the surface of a sphere, E = k·Q/R² and V = k·Q/R, so E = V/R. Air breaks down at 3 MV/m: V_max = 3 MV/m · ${nice(R * 100)} cm = ${show(V, 'volt')}.`, `An der Oberfläche einer Kugel ist E = k·Q/R² und V = k·Q/R, also E = V/R. Luft schlägt bei 3 MV/m durch: V_max = 3 MV/m · ${nice(R * 100)} cm = ${show(V, 'volt')}.`);
      const howQ = L(`Q = V·R/k = ${sci(Q)} C.`, `Q = V·R/k = ${sci(Q)} C.`);
      const big = L('V_max = E_breakdown·R: a larger sphere reaches a higher voltage. Sharp points do the opposite: there sparks start early.', 'V_max = E_Durchschlag·R: Eine grössere Kugel erreicht eine höhere Spannung. Spitzen bewirken das Gegenteil: Dort beginnen Funken früh.');
      return {
        text: L(`<p>A Van de Graaff generator charges a metal sphere of radius ${nice(R * 100)} cm until sparks jump: air breaks down at about 3 MV/m.</p>`, `<p>Ein Van-de-Graaff-Generator lädt eine Metallkugel mit dem Radius ${nice(R * 100)} cm, bis Funken überspringen: Luft schlägt bei etwa 3 MV/m durch.</p>`),
        questions: [
          choice('V', L('(a) the highest potential the sphere reaches', '(a) das höchste Potential, das die Kugel erreicht'), values(V, [{ value: Eb * R * R, tag: 'r2', why: how }, { value: Eb / R, tag: 'inv', why: how }], 'volt', how)),
          choice('Q', L('(b) its charge then', '(b) ihre Ladung dann'), values(Q, [{ value: (V * R * R) / K.k, tag: 'r2', why: howQ }], 'charge', howQ)),
          choice('big', L('(c) A larger sphere', '(c) Eine grössere Kugel'), words(r, [[L('reaches a higher voltage', 'erreicht eine höhere Spannung'), true, ''], [L('reaches a lower voltage', 'erreicht eine tiefere Spannung'), false, big], [L('makes no difference', 'macht keinen Unterschied'), false, big]])),
        ],
        hints: [L('Outside, the sphere acts like a point charge at its centre.', 'Aussen wirkt die Kugel wie eine Punktladung im Mittelpunkt.'), L('At its surface: E = V/R.', 'An ihrer Oberfläche: E = V/R.')],
        solution: [how, howQ, big], pic: ['vdg', {}],
      };
    },
  };

  const nerve = {
    id: 'nerve', difficulty: 3, title: () => L('The membrane of a nerve cell', 'Die Membran einer Nervenzelle'),
    make(r) {
      const U = r.pick([60, 70, 80]) * 1e-3, d = r.pick([5, 7, 8]) * 1e-9, Ef = U / d;
      const how = L(`E = U/d = ${nice(U * 1e3)} mV / ${nice(d * 1e9)} nm = ${show(Ef, 'field')}: more than the breakdown field of air.`, `E = U/d = ${nice(U * 1e3)} mV / ${nice(d * 1e9)} nm = ${show(Ef, 'field')}: mehr als das Durchschlagsfeld von Luft.`);
      const howW = L(`Going in, the Na⁺ ion (charge e) moves to a potential lower by ${nice(U * 1e3)} mV: it gains ${nice(U * 1e3)} meV.`, `Beim Eintreten bewegt sich das Na⁺-Ion (Ladung e) zu einem um ${nice(U * 1e3)} mV tieferen Potential: Es gewinnt ${nice(U * 1e3)} meV.`);
      const dir = L('The inside is negative: the field points from the outside (higher potential) inwards.', 'Das Innere ist negativ: Das Feld zeigt von aussen (höheres Potential) nach innen.');
      return {
        text: L(`<p>At rest, the inside of a nerve cell is at −${nice(U * 1e3)} mV compared with the outside. The cell membrane is ${nice(d * 1e9)} nm thick.</p>`, `<p>In Ruhe liegt das Innere einer Nervenzelle auf −${nice(U * 1e3)} mV gegenüber aussen. Die Zellmembran ist ${nice(d * 1e9)} nm dick.</p>`),
        questions: [
          choice('E', L('(a) the field in the membrane', '(a) das Feld in der Membran'), values(Ef, [{ value: Ef / 1e3, tag: 'prefix', why: how }], 'field', how)),
          choice('d', L('(b) The field in the membrane points', '(b) Das Feld in der Membran zeigt'), words(r, [[L('inwards', 'nach innen'), true, ''], [L('outwards', 'nach aussen'), false, dir]])),
          choice('W', L('(c) A sodium ion (Na⁺) passing in through the membrane gains', '(c) Ein Natrium-Ion (Na⁺), das durch die Membran hineinkommt, gewinnt'), values(U * 1e3, [{ value: U * 1e3 * 2, tag: 'two', why: howW }], null, howW, { fmt: (x) => `${nice(x)} meV` })),
        ],
        hints: [L('Across the thin membrane, the field is nearly uniform: E = U/d.', 'In der dünnen Membran ist das Feld fast homogen: E = U/d.'), L('The field points from high to low potential.', 'Das Feld zeigt von hohem zu tiefem Potential.')],
        solution: [how, dir, howW], pic: ['nerve', {}],
      };
    },
  };

  const tem = {
    id: 'tem', difficulty: 3, title: () => L('An electron microscope', 'Ein Elektronenmikroskop'),
    make(r) {
      const U = r.pick([100, 200, 300]) * 1e3, cl = Math.sqrt((2 * U) / 511e3), g = 1 + U / 511e3, beta = Math.sqrt(1 - 1 / (g * g));
      const how = L(`${keV(U)} is ${nice((U / 511e3) * 100)} % of the electron's rest energy of 511 keV: not small. The classical formula would give v = ${nice(cl)} c; relativity gives ${nice(beta)} c.`, `${keV(U)} sind ${nice((U / 511e3) * 100)} % der Ruheenergie des Elektrons von 511 keV: nicht klein. Die klassische Formel ergäbe v = ${nice(cl)} c; die Relativitätstheorie ergibt ${nice(beta)} c.`);
      return {
        text: L(`<p>A transmission electron microscope accelerates its electrons through ${nice(U / 1e3)} kV.</p>`, `<p>Ein Transmissionselektronenmikroskop beschleunigt seine Elektronen mit ${nice(U / 1e3)} kV.</p>`),
        questions: [
          choice('E', L('(a) their kinetic energy', '(a) ihre kinetische Energie'), values(U, [{ value: U / 1e3, tag: 'prefix', why: how }], null, how, { fmt: keV })),
          choice('rel', L('(b) To find their speed,', '(b) Um ihre Geschwindigkeit zu finden,'), words(r, [[L('relativity is needed', 'braucht es die Relativitätstheorie'), true, ''], [L('the classical formula is good enough', 'genügt die klassische Formel'), false, how]])),
          choice('v', L('(c) their speed', '(c) ihre Geschwindigkeit'), [beta, cl, beta / 2, 1].map((x) => ({ label: x === 1 ? 'c' : `${nice(x)} c`, ok: x === beta, why: how }))),
        ],
        hints: [L('Rest energy of the electron: 511 keV.', 'Ruheenergie des Elektrons: 511 keV.'), L('E = E₀ + E_kin = γ·E₀.', 'E = E₀ + E_kin = γ·E₀.')],
        solution: [how], pic: ['tem', {}],
      };
    },
  };

  const rutherford = {
    id: 'rutherford', difficulty: 4, title: () => L("Rutherford's experiment", 'Rutherfords Versuch'),
    make(r) {
      const Ek = r.pick([5, 7.7]), Z = 79, rmin = (K.k * 2 * Z * K.e * K.e) / (Ek * 1e6 * K.e);
      const how = L(`Head-on, the alpha particle stops where E_kin = k·(2e)·(79e)/r: r = ${show(rmin, 'len')}.`, `Bei frontalem Stoss hält das Alphateilchen dort an, wo E_kin = k·(2e)·(79e)/r: r = ${show(rmin, 'len')}.`);
      const concl = L('The alpha particle comes this close and is still repelled as by a point charge: the positive charge of the gold atom (a million times larger, 10⁻¹⁰ m) sits in a tiny nucleus, smaller than this distance.', 'Das Alphateilchen kommt so nahe und wird immer noch wie von einer Punktladung abgestossen: Die positive Ladung des Goldatoms (eine Million Mal grösser, 10⁻¹⁰ m) sitzt in einem winzigen Kern, kleiner als dieser Abstand.');
      return {
        text: L(`<p>In Rutherford's experiment, alpha particles (charge 2e) with ${nice(Ek)} MeV were shot at a thin gold foil (gold: 79 protons). A few bounced straight back.</p>`, `<p>In Rutherfords Versuch wurden Alphateilchen (Ladung 2e) mit ${nice(Ek)} MeV auf eine dünne Goldfolie geschossen (Gold: 79 Protonen). Einige prallten geradewegs zurück.</p>`),
        questions: [
          choice('r', L('(a) the closest distance to a gold nucleus in a head-on collision', '(a) der kleinste Abstand zu einem Goldkern bei frontalem Stoss'), values(rmin, [{ value: rmin / 2, tag: 'z', why: how }], 'len', how)),
          choice('c', L('(b) This shows that the positive charge of an atom', '(b) Das zeigt, dass die positive Ladung eines Atoms'), words(r, [[L('sits in a very small nucleus', 'in einem sehr kleinen Kern sitzt'), true, ''], [L('is spread over the whole atom', 'über das ganze Atom verteilt ist'), false, concl], [L('is carried by the electrons', 'von den Elektronen getragen wird'), false, concl]])),
        ],
        hints: [L('Energy conservation: E_kin = k·q·Q/r at the closest point.', 'Energieerhaltung: E_kin = k·q·Q/r im nächsten Punkt.')],
        solution: [how, concl], pic: ['rutherford', {}],
      };
    },
  };

  const PROBLEMS = [xray, gun, dawn, therapy, vdg, nerve, tem, rutherford];
  function realOf(i, seed) {
    const p = PROBLEMS[i], ex = p.make(rng(seed * 61 + 31));
    return { ...ex, kind: 'real', type: `real-${p.id}`, problem: p.id, title: p.title(), difficulty: p.difficulty, figs: '' };
  }
  const api = { PROBLEMS, realOf };
  root.PotProblems = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
