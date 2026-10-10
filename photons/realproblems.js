// Problems: photons in everyday life, technology and space, told as stories: a laser pointer in
// the eye, a solar cell (only photons above the band gap count, the rest of their energy is heat),
// sunburn from UV but not from a heater (one photon at a time), the solar sail IKAROS, a dental
// X-ray tube, a night-vision device (the photocathode's threshold) and the backscatter of gamma rays.
//   PROBLEMS[i]  { id, difficulty, title(), make(r) }; realOf(i, seed) the exercise (app.js)
(function (root) {
  'use strict';

  const P = root.Photon || require('./physics.js');
  const G = root.PhotonPlot || require('./plot.js');
  const X = root.PhotonEx || require('./exercises.js');
  const Lang = root.Lang || require('./lang.js');
  const L = (en, de) => Lang.L(en, de);
  const { plain, sci, pow, HC } = P;
  const { i, sb, CONST, numQ, choice, opts, fig, WHY } = X;
  const lam = i('λ'), E = i('E'), h = i('h'), c = i('c');
  const expOf = (x) => Math.floor(Math.log10(Math.abs(x)) + 1e-9);

  // ---------------------------------------------------------------- a laser pointer
  const pointer = {
    id: 'pointer', difficulty: 2, title: () => L('A laser pointer in the eye', 'Ein Laserpointer im Auge'),
    make(r) {
      const green = r.next() < 0.5, nm = green ? 532 : 650, mW = r.pick([1, 2, 5]), t = r.pick([0.1, 0.2, 0.25]);
      const eJ = P.joule(nm), N = (mW * 1e-3) / eJ, k = expOf(N), Nt = N * t, kt = expOf(Nt);
      const other = green ? 650 : 532, more = other > nm;
      return {
        text: `<p>${L(`A ${green ? 'green' : 'red'} laser pointer (${nm} nm, ${mW} mW) shines into someone’s eye by mistake. The blink reflex closes the eye after about ${t} s. (Never point a laser at people: even a few milliwatts focused on the retina can harm it.)`, `Ein ${green ? 'grüner' : 'roter'} Laserpointer (${nm} nm, ${mW} mW) leuchtet aus Versehen jemandem ins Auge. Der Lidschlussreflex schliesst das Auge nach etwa ${t} s. (Richte nie einen Laser auf Menschen: Schon wenige Milliwatt, auf die Netzhaut gebündelt, können sie schädigen.)`)}</p>${CONST()}`,
        figs: fig(G.bar([{ nm, label: `${nm} nm` }])),
        questions: [
          numQ('N', L('(a) photons per second', '(a) Photonen pro Sekunde'), `${i('N')}/s`, pow(k), N / 10 ** k, { scale: 10 ** k, wrong: [{ value: (mW * 1e-3) / P.eV(nm) / 10 ** k, tag: 'evJ', why: WHY.countJ() }] }),
          numQ('Nt', L('(b) photons entering the eye before it closes', '(b) Photonen, die ins Auge gelangen, bevor es sich schliesst'), i('N'), pow(kt), Nt / 10 ** kt, { scale: 10 ** kt }),
          choice('other', L(`(c) A ${green ? 'red (650 nm)' : 'green (532 nm)'} pointer of the same power emits per second`, `(c) Ein ${green ? 'roter (650 nm)' : 'grüner (532 nm)'} Pointer derselben Leistung sendet pro Sekunde`), opts(r, [
            [L('more photons', 'mehr Photonen aus'), more, L('Its photons carry more energy each: the same power needs fewer of them.', 'Seine Photonen tragen je mehr Energie: Dieselbe Leistung braucht weniger davon.'), 'inverse'],
            [L('fewer photons', 'weniger Photonen aus'), !more, L('Its photons carry less energy each: the same power needs more of them.', 'Seine Photonen tragen je weniger Energie: Dieselbe Leistung braucht mehr davon.'), 'inverse'],
            [L('the same number of photons', 'gleich viele Photonen aus'), false, L('The same power, but photons of a different energy: N = P/E.', 'Dieselbe Leistung, aber Photonen anderer Energie: N = P/E.'), 'intensity'],
          ], true)),
        ],
        hints: [L(`One photon: ${E} = ${h}·${c}/${lam}.`, `Ein Photon: ${E} = ${h}·${c}/${lam}.`), L('Photons per second = power / energy of one photon; then multiply by the time.', 'Photonen pro Sekunde = Leistung / Energie eines Photons; dann mit der Zeit multiplizieren.')],
        solution: [
          L(`(a) ${E} = ${h}·${c}/${lam} = ${sci(eJ)} J per photon, so ${i('N')} = ${mW} · 10<sup>−3</sup> W / ${sci(eJ)} J = <b>${sci(N)}</b> per second.`, `(a) ${E} = ${h}·${c}/${lam} = ${sci(eJ)} J pro Photon, also ${i('N')} = ${mW} · 10<sup>−3</sup> W / ${sci(eJ)} J = <b>${sci(N)}</b> pro Sekunde.`),
          L(`(b) In ${t} s: ${sci(N)} · ${t} = <b>${sci(Nt)}</b> photons.`, `(b) In ${t} s: ${sci(N)} · ${t} = <b>${sci(Nt)}</b> Photonen.`),
          L(`(c) At ${other} nm each photon has ${plain(P.eV(other))} eV instead of ${plain(P.eV(nm))} eV: the same power means <b>${more ? 'more' : 'fewer'} photons</b>, ${sci((mW * 1e-3) / P.joule(other))} per second.`, `(c) Bei ${other} nm hat jedes Photon ${plain(P.eV(other))} eV statt ${plain(P.eV(nm))} eV: Dieselbe Leistung bedeutet <b>${more ? 'mehr' : 'weniger'} Photonen</b>, ${sci((mW * 1e-3) / P.joule(other))} pro Sekunde.`),
        ],
      };
    },
  };

  // ---------------------------------------------------------------- a solar cell
  const solar = {
    id: 'solar', difficulty: 3, title: () => L('A silicon solar cell', 'Eine Silizium-Solarzelle'),
    make(r) {
      const Eg = 1.12, lg = HC / Eg, nm = r.step(400, 700, 25), Eph = P.eV(nm), loss = (Eph - Eg) / Eph, ir = r.pick([1300, 1500, 2000]);
      return {
        text: `<p>${L(`In a silicon solar cell, a photon can lift one electron across the band gap of ${Eg} eV, so that it can drive a current. A photon with less energy does nothing; of a photon with more energy, only ${Eg} eV are used and the rest turns into heat.`, `In einer Silizium-Solarzelle kann ein Photon ein Elektron über die Bandlücke von ${Eg} eV heben, so dass es einen Strom antreiben kann. Ein Photon mit weniger Energie bewirkt nichts; von einem Photon mit mehr Energie werden nur ${Eg} eV genutzt, und der Rest wird zu Wärme.`)}</p>`,
        figs: fig(G.bar([{ nm, label: `${nm} nm` }, { nm: lg, label: '<tspan font-style="italic">λ</tspan><tspan font-size="72%" dy="4">G</tspan>' }])),
        questions: [
          numQ('lg', L('(a) the longest wavelength the cell can use', '(a) die grösste Wellenlänge, die die Zelle nutzen kann'), `${lam}${sb('G')}`, 'nm', lg, { tol: 0.015, wrong: [{ value: Eg * 1240 / 1e3, tag: 'inverse', why: WHY.inverse() }] }),
          choice('ir', L(`(b) Infrared light of ${ir} nm falls on the cell. It`, `(b) Infrarotes Licht von ${ir} nm fällt auf die Zelle. Es`), opts(r, [
            [L('produces no current, however bright it is', 'erzeugt keinen Strom, wie hell es auch ist'), true, '', null],
            [L('produces a current if it is bright enough', 'erzeugt einen Strom, wenn es hell genug ist'), false, L('Each electron needs one photon with at least the band gap energy: more weak photons do not help.', 'Jedes Elektron braucht ein Photon mit mindestens der Energie der Bandlücke: Mehr schwache Photonen helfen nicht.'), 'intensity'],
            [L('produces a larger current than visible light', 'erzeugt einen grösseren Strom als sichtbares Licht'), false, L('Its photons have less energy than the band gap.', 'Seine Photonen haben weniger Energie als die Bandlücke.'), 'inverse'],
          ])),
          numQ('loss', L(`(c) the part of the energy of a ${nm} nm photon that turns into heat`, `(c) der Teil der Energie eines Photons von ${nm} nm, der zu Wärme wird`), '', '%', loss * 100, { tol: 0.02, abs: 0.6, wrong: [{ value: (Eg / Eph) * 100, tag: 'other', why: L('That is the part that is used; the rest becomes heat.', 'Das ist der genutzte Teil; der Rest wird zu Wärme.') }] }),
        ],
        hints: [L(`At the threshold, the photon energy equals the band gap: ${h}·${c}/${lam}${sb('G')} = ${Eg} eV.`, `An der Grenze ist die Photonenenergie gleich der Bandlücke: ${h}·${c}/${lam}${sb('G')} = ${Eg} eV.`), L('h·c = 1240 eV·nm.', 'h·c = 1240 eV·nm.'), L(`A photon of ${nm} nm has 1240/${nm} eV; ${Eg} eV of it are used.`, `Ein Photon von ${nm} nm hat 1240/${nm} eV; davon werden ${Eg} eV genutzt.`)],
        solution: [
          L(`(a) ${lam}${sb('G')} = 1240 eV·nm / ${Eg} eV = <b>${plain(lg)} nm</b>, in the near infrared.`, `(a) ${lam}${sb('G')} = 1240 eV·nm / ${Eg} eV = <b>${plain(lg)} nm</b>, im nahen Infrarot.`),
          L(`(b) ${ir} nm is longer than ${plain(lg)} nm: each photon has only ${plain(P.eV(ir))} eV, less than the band gap. It <b>produces no current</b>, however bright the light.`, `(b) ${ir} nm ist länger als ${plain(lg)} nm: Jedes Photon hat nur ${plain(P.eV(ir))} eV, weniger als die Bandlücke. Es <b>erzeugt keinen Strom</b>, wie hell das Licht auch ist.`),
          L(`(c) The photon has ${plain(Eph)} eV; ${plain(Eph - Eg)} eV are left over: (${plain(Eph)} − ${Eg})/${plain(Eph)} = <b>${plain(loss * 100)} %</b> become heat. These two losses are the main reason why a silicon cell turns at most about a third of the sunlight into electric energy.`, `(c) Das Photon hat ${plain(Eph)} eV; ${plain(Eph - Eg)} eV bleiben übrig: (${plain(Eph)} − ${Eg})/${plain(Eph)} = <b>${plain(loss * 100)} %</b> werden zu Wärme. Diese beiden Verluste sind der Hauptgrund, warum eine Siliziumzelle höchstens etwa einen Drittel des Sonnenlichts in elektrische Energie umwandelt.`),
        ],
      };
    },
  };

  // ---------------------------------------------------------------- sunburn
  const sunburn = {
    id: 'sunburn', difficulty: 2, title: () => L('Sunburn, but not from a heater', 'Sonnenbrand, aber nicht vom Heizstrahler'),
    make(r) {
      const uv = r.step(290, 315, 5), ir = r.pick([1000, 1500, 2000, 3000]), need = 3.5;
      return {
        text: `<p>${L(`UV-B light (${uv} nm) from the Sun gives you a sunburn within an hour, while hours in front of a strong infrared heater (${ir} nm) do not. To change a molecule in a skin cell (break or rearrange a bond in its DNA), about ${need} eV are needed.`, `UV-B-Licht (${uv} nm) der Sonne verursacht innert einer Stunde einen Sonnenbrand, Stunden vor einem starken Infrarot-Heizstrahler (${ir} nm) jedoch nicht. Um ein Molekül in einer Hautzelle zu verändern (eine Bindung in ihrer DNA aufzubrechen oder umzulagern), braucht es etwa ${need} eV.`)}</p>`,
        figs: fig(G.bar([{ nm: uv, label: 'UV-B' }, { nm: Math.min(ir, 1000), label: ir > 1000 ? `→ ${ir}` : 'IR' }])),
        questions: [
          numQ('uv', L('(a) the energy of a UV-B photon', '(a) die Energie eines UV-B-Photons'), E, 'eV', P.eV(uv), { wrong: [{ value: P.joule(uv) / 1e-19, tag: 'evJ', why: WHY.evJ() }] }),
          numQ('ir', L('(b) the energy of an infrared photon', '(b) die Energie eines Infrarot-Photons'), E, 'eV', P.eV(ir), { wrong: [{ value: P.joule(ir) / 1e-19, tag: 'evJ', why: WHY.evJ() }] }),
          choice('why', L('(c) The heater causes no sunburn, because', '(c) Der Heizstrahler verursacht keinen Sonnenbrand, weil'), opts(r, [
            [L('no single infrared photon has enough energy to change a molecule', 'kein einzelnes Infrarot-Photon genug Energie hat, um ein Molekül zu verändern'), true, '', null],
            [L('it is not bright enough', 'er nicht hell genug ist'), false, L('A brighter heater gives more photons, but each one still has too little energy.', 'Ein hellerer Strahler liefert mehr Photonen, aber jedes hat immer noch zu wenig Energie.'), 'intensity'],
            [L('infrared light carries no energy', 'Infrarotlicht keine Energie transportiert'), false, L('It does: it warms you. But it comes in small portions.', 'Doch: Es wärmt dich. Aber es kommt in kleinen Portionen.'), 'other'],
          ])),
        ],
        hints: [L(`${E} = ${h}·${c}/${lam} = 1240 eV·nm / ${lam}.`, `${E} = ${h}·${c}/${lam} = 1240 eV·nm / ${lam}.`), L('A molecule is changed by one photon at a time: compare the energy of one photon with what is needed.', 'Ein Molekül wird von einem Photon aufs Mal verändert: Vergleiche die Energie eines Photons mit der nötigen.')],
        solution: [
          L(`(a) ${E} = 1240 eV·nm / ${uv} nm = <b>${plain(P.eV(uv))} eV</b>: more than ${need} eV.`, `(a) ${E} = 1240 eV·nm / ${uv} nm = <b>${plain(P.eV(uv))} eV</b>: mehr als ${need} eV.`),
          L(`(b) ${E} = 1240 eV·nm / ${ir} nm = <b>${plain(P.eV(ir))} eV</b>: far less than ${need} eV.`, `(b) ${E} = 1240 eV·nm / ${ir} nm = <b>${plain(P.eV(ir))} eV</b>: viel weniger als ${need} eV.`),
          L('(c) Each molecule takes the energy of one photon. <b>No infrared photon has enough</b>; more of them only warm the skin. As in the photoelectric effect, the energy of one photon decides, not the brightness.', '(c) Jedes Molekül nimmt die Energie eines Photons auf. <b>Kein Infrarot-Photon hat genug</b>; mehr davon erwärmen die Haut nur. Wie beim Photoeffekt entscheidet die Energie eines Photons, nicht die Helligkeit.'),
        ],
      };
    },
  };

  // ---------------------------------------------------------------- the solar sail IKAROS
  const ikaros = {
    id: 'ikaros', difficulty: 3, title: () => L('The solar sail IKAROS', 'Das Sonnensegel IKAROS'),
    make(r) {
      const A = 196, m = 310, I = r.pick([1360, 1900, 2600]), days = r.pick([30, 100, 180]);
      const F = (2 * I * A) / P.c, a = F / m, dv = a * days * 86400;
      return {
        text: `<p>${L(`In 2010 the Japanese probe IKAROS (${m} kg) sailed towards Venus with a square sail of 14 m × 14 m, a thin reflecting film. Take the sail as a perfect mirror facing the Sun, where the sunlight brings ${I} W per square metre.`, `2010 segelte die japanische Sonde IKAROS (${m} kg) mit einem quadratischen Segel von 14 m × 14 m, einer dünnen spiegelnden Folie, Richtung Venus. Nimm das Segel als perfekten Spiegel an, der Sonne zugewandt, wo das Sonnenlicht ${I} W pro Quadratmeter bringt.`)}</p>${CONST()}`,
        figs: fig(G.sail({ absorb: false })),
        questions: [
          numQ('F', L('(a) the force of the sunlight on the sail', '(a) die Kraft des Sonnenlichts auf das Segel'), i('F'), 'mN', F * 1e3, { scale: 1e-3, wrong: [{ value: (F / 2) * 1e3, tag: 'reflect', why: WHY.reflect() }] }),
          numQ('a', L('(b) the acceleration of the probe', '(b) die Beschleunigung der Sonde'), i('a'), `${pow(-6)} m/s²`, a / 1e-6, { scale: 1e-6 }),
          numQ('dv', L(`(c) its gain in speed after ${days} days (the light kept constant)`, `(c) ihr Geschwindigkeitsgewinn nach ${days} Tagen (das Licht gleich gehalten)`), `Δ${i('v')}`, 'm/s', dv, { tol: 0.015 }),
        ],
        hints: [L(`The power on the sail: ${i('P')} = ${i('I')}·${i('A')}.`, `Die Leistung auf dem Segel: ${i('P')} = ${i('I')}·${i('A')}.`), L(`A mirror reverses the momentum of each photon: ${i('F')} = 2${i('P')}/${c}.`, `Ein Spiegel kehrt den Impuls jedes Photons um: ${i('F')} = 2${i('P')}/${c}.`), L(`${i('a')} = ${i('F')}/${i('m')} and Δ${i('v')} = ${i('a')}·${i('t')}; a day has 86 400 s.`, `${i('a')} = ${i('F')}/${i('m')} und Δ${i('v')} = ${i('a')}·${i('t')}; ein Tag hat 86 400 s.`)],
        solution: [
          L(`(a) ${i('P')} = ${I} W/m² · ${A} m² = ${sci(I * A)} W; ${i('F')} = 2${i('P')}/${c} = 2 · ${sci(I * A)} W / 3.00 · 10<sup>8</sup> m/s = <b>${plain(F * 1e3)} mN</b>, about the weight of a tenth of a gram.`, `(a) ${i('P')} = ${I} W/m² · ${A} m² = ${sci(I * A)} W; ${i('F')} = 2${i('P')}/${c} = 2 · ${sci(I * A)} W / 3.00 · 10<sup>8</sup> m/s = <b>${plain(F * 1e3)} mN</b>, etwa die Gewichtskraft eines Zehntelgramms.`),
          L(`(b) ${i('a')} = ${i('F')}/${i('m')} = ${sci(F)} N / ${m} kg = <b>${sci(a)} m/s²</b>.`, `(b) ${i('a')} = ${i('F')}/${i('m')} = ${sci(F)} N / ${m} kg = <b>${sci(a)} m/s²</b>.`),
          L(`(c) Δ${i('v')} = ${i('a')}·${i('t')} = ${sci(a)} m/s² · ${days} · 86 400 s = <b>${plain(dv)} m/s</b>, without any fuel.`, `(c) Δ${i('v')} = ${i('a')}·${i('t')} = ${sci(a)} m/s² · ${days} · 86 400 s = <b>${plain(dv)} m/s</b>, ganz ohne Treibstoff.`),
        ],
      };
    },
  };

  // ---------------------------------------------------------------- the dentist's X-ray tube
  const dentist = {
    id: 'dentist', difficulty: 2, title: () => L('X-rays at the dentist', 'Röntgen beim Zahnarzt'),
    make(r) {
      const U = r.pick([60, 65, 70]), lm = P.lambdaMin(U * 1e3), up = U + 10;
      return {
        text: `<p>${L(`A dental X-ray unit accelerates electrons through ${U} kV onto a tungsten anode.`, `Ein Zahnröntgengerät beschleunigt Elektronen mit ${U} kV auf eine Wolframanode.`)}</p>`,
        figs: fig(G.xray([{ U, anode: null, cls: 'new' }], { max: 100 })),
        questions: [
          numQ('E', L('(a) the largest photon energy', '(a) die grösste Photonenenergie'), `${E}${sb('max')}`, 'keV', U),
          numQ('lm', L('(b) the shortest wavelength', '(b) die kürzeste Wellenlänge'), `${lam}${sb('min')}`, 'pm', lm, { tol: 0.015, wrong: [{ value: (U * 1e3) / HC, tag: 'inverse', why: WHY.inverse() }] }),
          choice('up', L(`(c) At ${up} kV the X-rays get through thicker tissue, because`, `(c) Bei ${up} kV durchdringen die Röntgenstrahlen dickeres Gewebe, weil`), opts(r, [
            [L('the photons are more energetic', 'die Photonen energiereicher sind'), true, '', null],
            [L('the tube emits more photons of the same energies', 'die Röhre mehr Photonen derselben Energien aussendet'), false, L('More photons alone would not get through more tissue; the new, more energetic photons do.', 'Mehr Photonen allein kämen nicht durch mehr Gewebe; die neuen, energiereicheren Photonen schon.'), 'intensity'],
            [L('the photons have longer wavelengths', 'die Photonen längere Wellenlängen haben'), false, WHY.inverse(), 'inverse'],
          ])),
        ],
        hints: [L(`An electron accelerated through ${i('U')} gets ${i('e')}·${i('U')}; a photon can take all of it.`, `Ein Elektron, das mit ${i('U')} beschleunigt wird, erhält ${i('e')}·${i('U')}; ein Photon kann alles davon übernehmen.`), L('h·c = 1240 keV·pm.', 'h·c = 1240 keV·pm.')],
        solution: [
          L(`(a) ${E}${sb('max')} = ${i('e')}·${i('U')} = <b>${U} keV</b>.`, `(a) ${E}${sb('max')} = ${i('e')}·${i('U')} = <b>${U} keV</b>.`),
          L(`(b) ${lam}${sb('min')} = 1240 keV·pm / ${U} keV = <b>${plain(lm)} pm</b>, about a tenth of the size of an atom.`, `(b) ${lam}${sb('min')} = 1240 keV·pm / ${U} keV = <b>${plain(lm)} pm</b>, etwa ein Zehntel der Grösse eines Atoms.`),
          L(`(c) At ${up} kV the spectrum reaches up to ${up} keV (${plain(P.lambdaMin(up * 1e3))} pm): <b>more energetic photons</b>, which are absorbed less.`, `(c) Bei ${up} kV reicht das Spektrum bis ${up} keV (${plain(P.lambdaMin(up * 1e3))} pm): <b>energiereichere Photonen</b>, die weniger absorbiert werden.`),
        ],
        solFig: fig(G.xray([{ U, anode: null, cls: 'old', dash: true }, { U: up, anode: null, cls: 'new' }], { max: 100 })),
      };
    },
  };

  // ---------------------------------------------------------------- a night-vision device
  const night = {
    id: 'night', difficulty: 3, title: () => L('A night-vision device', 'Ein Nachtsichtgerät'),
    make(r) {
      const W = r.pick([1.30, 1.35, 1.38, 1.42]), lg = HC / W, leds = [850, 940];
      const sees = leds.map((nm) => P.eV(nm) > W), ek = P.eV(850) - W;
      const label = sees[0] && sees[1] ? L('both', 'beide') : sees[0] ? L('only the 850 nm lamp', 'nur die 850-nm-Lampe') : L('neither', 'keine');
      return {
        text: `<p>${L(`In a night-vision device, faint light falls on a photocathode with a work function of ${W} eV; the electrons it releases are multiplied and make a screen glow. Security cameras light the scene with infrared lamps of 850 nm or 940 nm, invisible to the eye.`, `In einem Nachtsichtgerät fällt schwaches Licht auf eine Photokathode mit einer Austrittsarbeit von ${W} eV; die ausgelösten Elektronen werden vervielfacht und bringen einen Schirm zum Leuchten. Überwachungskameras beleuchten die Szene mit Infrarotlampen von 850 nm oder 940 nm, unsichtbar für das Auge.`)}</p>`,
        figs: fig(G.bar([{ nm: 850, label: '850' }, { nm: 940, label: '940' }])),
        questions: [
          numQ('lg', L('(a) the longest wavelength the device can see', '(a) die grösste Wellenlänge, die das Gerät sieht'), `${lam}${sb('G')}`, 'nm', lg, { tol: 0.015, wrong: [{ value: W * 1240 / 1e3, tag: 'inverse', why: WHY.inverse() }] }),
          choice('see', L('(b) Which infrared lamps does the device see?', '(b) Welche Infrarotlampen sieht das Gerät?'), opts(r, [
            [L('both', 'beide'), sees[0] && sees[1], L('Compare 940 nm with the longest wavelength the device can see.', 'Vergleiche 940 nm mit der grössten Wellenlänge, die das Gerät sieht.'), 'threshold'],
            [L('only the 850 nm lamp', 'nur die 850-nm-Lampe'), sees[0] && !sees[1], sees[1] ? L('Compare 940 nm with the longest wavelength the device can see: it is shorter.', 'Vergleiche 940 nm mit der grössten Wellenlänge, die das Gerät sieht: Sie ist kürzer.') : L('Compare 850 nm with the longest wavelength the device can see.', 'Vergleiche 850 nm mit der grössten Wellenlänge, die das Gerät sieht.'), 'threshold'],
            [L('only the 940 nm lamp', 'nur die 940-nm-Lampe'), false, L('The 940 nm photons have less energy than the 850 nm ones.', 'Die 940-nm-Photonen haben weniger Energie als die 850-nm-Photonen.'), 'inverse'],
            [L('neither', 'keine'), !sees[0], L('Compare the photon energy at 850 nm with the work function.', 'Vergleiche die Photonenenergie bei 850 nm mit der Austrittsarbeit.'), 'threshold'],
          ], true)),
          numQ('ek', L('(c) the largest kinetic energy of electrons released by 850 nm light', '(c) die grösste kinetische Energie der Elektronen, die Licht von 850 nm auslöst'), `${i('E')}${sb('kin,max')}`, 'eV', ek, { tol: 0.03, abs: 0.012, wrong: [{ value: P.eV(850), tag: 'noW', why: WHY.noW() }] }),
        ],
        hints: [L(`At the threshold, ${h}·${c}/${lam}${sb('G')} = ${i('W')}.`, `An der Grenze gilt ${h}·${c}/${lam}${sb('G')} = ${i('W')}.`), L('Only photons with at least the work function release electrons: wavelengths up to the threshold.', 'Nur Photonen mit mindestens der Austrittsarbeit lösen Elektronen aus: Wellenlängen bis zur Grenze.'), L(`${i('E')}${sb('kin,max')} = ${h}·${i('f')} − ${i('W')}.`, `${i('E')}${sb('kin,max')} = ${h}·${i('f')} − ${i('W')}.`)],
        solution: [
          L(`(a) ${lam}${sb('G')} = 1240 eV·nm / ${W} eV = <b>${plain(lg)} nm</b>.`, `(a) ${lam}${sb('G')} = 1240 eV·nm / ${W} eV = <b>${plain(lg)} nm</b>.`),
          L(`(b) 850 nm (${plain(P.eV(850))} eV) and 940 nm (${plain(P.eV(940))} eV) against ${W} eV: <b>${label}</b>. Lamps of 940 nm are used where an intruder’s device should not see them.`, `(b) 850 nm (${plain(P.eV(850))} eV) und 940 nm (${plain(P.eV(940))} eV) gegen ${W} eV: <b>${label}</b>. Lampen von 940 nm werden dort eingesetzt, wo ein Gerät eines Eindringlings sie nicht sehen soll.`),
          L(`(c) ${i('E')}${sb('kin,max')} = ${plain(P.eV(850))} eV − ${W} eV = <b>${plain(ek)} eV</b>: just enough to get out.`, `(c) ${i('E')}${sb('kin,max')} = ${plain(P.eV(850))} eV − ${W} eV = <b>${plain(ek)} eV</b>: knapp genug, um herauszukommen.`),
        ],
      };
    },
  };

  // ---------------------------------------------------------------- gamma rays scattered back
  const GAMMA = [
    { en: 'caesium-137', de: 'Cäsium-137', keV: 662 },
    { en: 'sodium-22 (annihilation)', de: 'Natrium-22 (Paarvernichtung)', keV: 511 },
    { en: 'americium-241', de: 'Americium-241', keV: 59.5 },
  ];
  const back = {
    id: 'back', difficulty: 4, title: () => L('Gamma rays scattered back', 'Zurückgestreute Gammastrahlung'),
    make(r) {
      const g = r.pick(GAMMA), th = r.pick([90, 120, 180]), l1 = HC / g.keV, dl = P.compton(th), l2 = l1 + dl, E2 = HC / l2, Ee = g.keV - E2;
      return {
        text: `<p>${L(`A ${g.en} source emits gamma photons of ${g.keV} keV. In a detector, some of them are Compton-scattered by an electron; a second detector catches the photons scattered by ${th}°.`, `Eine Quelle mit ${g.de} sendet Gammaphotonen von ${g.keV} keV aus. In einem Detektor werden einige davon an einem Elektron Compton-gestreut; ein zweiter Detektor fängt die um ${th}° gestreuten Photonen auf.`)}</p><p class="consts">${h}·${c} = 1240 keV·pm, ${lam}${sb('C')} = 2.43 pm</p>`,
        figs: fig(G.scatter(th)),
        questions: [
          numQ('l1', L('(a) the wavelength of the gamma photons', '(a) die Wellenlänge der Gammaphotonen'), lam, 'pm', l1, { tol: 0.01, wrong: [{ value: g.keV / 1240, tag: 'inverse', why: WHY.inverse() }] }),
          numQ('E2', L('(b) the energy of the scattered photons', '(b) die Energie der gestreuten Photonen'), `${E}′`, 'keV', E2, { tol: 0.015, wrong: [{ value: HC / (l1 - dl), tag: 'shorter', why: WHY.shorter() }] }),
          numQ('Ee', L('(c) the energy given to the electron', '(c) die Energie, die das Elektron erhält'), `${i('E')}${sb('kin')}`, 'keV', Ee, { tol: 0.02 }),
        ],
        hints: [L(`${lam} = ${h}·${c}/${E}.`, `${lam} = ${h}·${c}/${E}.`), L(`${lam}′ = ${lam} + 2.43 pm · (1 − cos ${i('θ')}), then ${E}′ = ${h}·${c}/${lam}′.`, `${lam}′ = ${lam} + 2.43 pm · (1 − cos ${i('θ')}), dann ${E}′ = ${h}·${c}/${lam}′.`), L('The electron gets what the photon lost.', 'Das Elektron erhält, was das Photon verloren hat.')],
        solution: [
          L(`(a) ${lam} = 1240 keV·pm / ${g.keV} keV = <b>${plain(l1)} pm</b>.`, `(a) ${lam} = 1240 keV·pm / ${g.keV} keV = <b>${plain(l1)} pm</b>.`),
          L(`(b) Δ${lam} = 2.43 pm · (1 − cos ${th}°) = ${plain(dl)} pm, so ${lam}′ = ${plain(l2)} pm and ${E}′ = 1240 keV·pm / ${plain(l2)} pm = <b>${plain(E2)} keV</b>.`, `(b) Δ${lam} = 2.43 pm · (1 − cos ${th}°) = ${plain(dl)} pm, also ${lam}′ = ${plain(l2)} pm und ${E}′ = 1240 keV·pm / ${plain(l2)} pm = <b>${plain(E2)} keV</b>.`),
          L(`(c) ${g.keV} keV − ${plain(E2)} keV = <b>${plain(Ee)} keV</b>.${th === 180 ? ' Scattered straight back, the photon gives the electron as much energy as it can (the Compton edge in a gamma spectrum).' : ''}`, `(c) ${g.keV} keV − ${plain(E2)} keV = <b>${plain(Ee)} keV</b>.${th === 180 ? ' Gerade zurückgestreut gibt das Photon dem Elektron so viel Energie wie möglich (die Compton-Kante in einem Gammaspektrum).' : ''}`),
        ],
      };
    },
  };

  const PROBLEMS = [pointer, sunburn, solar, night, ikaros, dentist, back];
  function realOf(k, seed) {
    const p = PROBLEMS[k], ex = p.make(P.rng(seed * 61 + 31));
    return { ...ex, type: `real-${p.id}`, problem: p.id, title: p.title(), difficulty: p.difficulty };
  }

  const api = { PROBLEMS, realOf };
  root.PhotonProblems = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
