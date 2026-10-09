// The exercises of Photons, with their texts in the current language (the app rebuilds them when
// the language changes). Every exercise has the form
//   { id, type, difficulty, title, text, figs (HTML), questions, hints, solution (HTML paragraphs),
//     solFig, p (what makes it new to the student) }
// with questions of four kinds:
//   { type: 'num', key, label, sym, unit, value, tol, abs, scale, wrong: [{ value, tag, why }] }
//        a number in the unit shown (value in that unit, e.g. 4.62 for 4.62 · 10¹⁴ Hz with unit
//        10¹⁴ Hz and scale 1e14: the full number 4.62e14 counts as well); tol: the relative error
//        allowed, abs: an absolute one (for values read off a graph, or small differences); wrong: the results of typical mistakes, each with what went wrong
//   { type: 'choice', key, label, options: [{ label, ok, why, tag }] }   one of a few answers
//   { type: 'pick', key, label, options: [{ html, ok, why, tag }] }       one of a few drawings
//   { type: 'multi', key, statements: [{ html, ok, why }] }              statements to tick
// The tags name the wrong idea behind an answer (the arcade's misconceptions, app.js).
// The types, by topic:
//   energy, wavelength, count, rank             photon energy, wavelength, photons per second
//   photo-calc, photo-curve, photo-graph, photo-stmts   the photoelectric effect
//   momentum, sail                              photon momentum and radiation pressure
//   xray, xray-read, xray-change                the X-ray tube: cut-off and characteristic lines
//   compton, compton-compare                    the Compton effect
(function (root) {
  'use strict';

  const P = root.Photon || require('./physics.js');
  const G = root.PhotonPlot || require('./plot.js');
  const Lang = root.Lang || require('./lang.js');
  const L = (en, de) => Lang.L(en, de);
  const { rng, plain, sci, num, pow, HC, LC } = P;

  // ---------------------------------------------------------------- writing
  const i = (s) => `<i>${s}</i>`;
  const sb = (s) => `<sub>${s}</sub>`;
  const lam = i('λ'), E = i('E'), f = i('f'), h = i('h'), c = i('c'), W = i('W'), U0 = `${i('U')}${sb('0')}`, Ek = `${i('E')}${sb('kin')}`, fG = `${i('f')}${sb('G')}`;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const nameOf = (x) => L(x.en, x.de);
  const fig = (html) => `<div class="fig">${html}</div>`;
  const H = () => `${h} = 6.626 · 10<sup>−34</sup> J·s`, C = () => `${c} = 3.00 · 10<sup>8</sup> m/s`, EL = () => `${i('e')} = 1.602 · 10<sup>−19</sup> C`;
  const CONST = () => `<p class="consts">${H()}, ${C()}, ${EL()}</p>`;
  // the power of ten for a value: 10^k with 1 ≤ value/10^k < 10
  const expOf = (x) => Math.floor(Math.log10(Math.abs(x)) + 1e-9);

  // ---------------------------------------------------------------- questions
  const numQ = (key, label, sym, unit, value, o = {}) => ({ type: 'num', key, label, sym, unit, value, tol: o.tol || 0.012, abs: o.abs || 0, scale: o.scale || 1, wrong: (o.wrong || []).filter((w) => Number.isFinite(w.value) && Math.abs(w.value / value - 1) > 0.06) });
  const choice = (key, label, options) => ({ type: 'choice', key, label, options });
  const pick = (key, label, options) => ({ type: 'pick', key, label, options });
  const multi = (key, statements) => ({ type: 'multi', key, statements });
  // options from [label, ok, why, tag], shuffled (or in the order given)
  const opts = (r, list, keep) => { const o = list.map(([label, ok, why, tag]) => ({ label, ok, why: ok ? '' : why, tag: ok ? undefined : tag || 'other' })); return keep ? o : r.shuffle(o); };

  // ---------------------------------------------------------------- typical mistakes
  const WHY = {
    evJ: () => L('That is the energy in units of 10<sup>−19</sup> J, not in electronvolts: 1 eV = 1.602 · 10<sup>−19</sup> J.', 'Das ist die Energie in Einheiten von 10<sup>−19</sup> J, nicht in Elektronvolt: 1 eV = 1.602 · 10<sup>−19</sup> J.'),
    eVasJ: () => L('That is the energy in electronvolts, not in joules: 1 eV = 1.602 · 10<sup>−19</sup> J.', 'Das ist die Energie in Elektronvolt, nicht in Joule: 1 eV = 1.602 · 10<sup>−19</sup> J.'),
    inverse: () => L('The photon energy is inversely proportional to the wavelength: E = h·c/λ.', 'Die Photonenenergie ist umgekehrt proportional zur Wellenlänge: E = h·c/λ.'),
    noW: () => L('That is the whole photon energy: part of it is needed to free the electron from the metal.', 'Das ist die ganze Photonenenergie: Ein Teil davon wird gebraucht, um das Elektron aus dem Metall zu lösen.'),
    addW: () => L('The work function is used up in freeing the electron: subtract it.', 'Die Austrittsarbeit wird beim Herauslösen des Elektrons verbraucht: Ziehe sie ab.'),
    countJ: () => L('Divide the power by the energy of one photon in joules, not in electronvolts.', 'Teile die Leistung durch die Energie eines Photons in Joule, nicht in Elektronvolt.'),
    reflect: () => L('A reflected photon reverses its momentum: the change is twice its momentum, so the force is twice as large as for absorption.', 'Ein reflektiertes Photon kehrt seinen Impuls um: Die Änderung ist doppelt so gross wie sein Impuls, also ist die Kraft doppelt so gross wie bei Absorption.'),
    absorb: () => L('An absorbed photon only gives its momentum once: the factor 2 belongs to a reflecting surface.', 'Ein absorbiertes Photon gibt seinen Impuls nur einmal ab: Der Faktor 2 gehört zu einer reflektierenden Fläche.'),
    sinC: () => L('The Compton formula has 1 − cos θ, not sin θ.', 'In der Compton-Formel steht 1 − cos θ, nicht sin θ.'),
    shorter: () => L('The scattered photon has given energy to the electron: its wavelength is longer, not shorter.', 'Das gestreute Photon hat Energie an das Elektron abgegeben: Seine Wellenlänge ist länger, nicht kürzer.'),
    slopeE: () => L('The slope of the line is h/e: multiply it by e to get h.', 'Die Steigung der Geraden ist h/e: Multipliziere sie mit e, um h zu erhalten.'),
  };

  // ---------------------------------------------------------------- photon energy
  function energy(seed) {
    const r = rng(seed * 31 + 3);
    const src = r.next() < 0.5 ? r.pick(P.LINES) : null, nm = src ? src.nm : r.step(300, 900, 10);
    const fr = P.freq(nm), eJ = P.joule(nm), eV = P.eV(nm);
    const what = src ? cap(nameOf(src)) : L(`Light of wavelength ${nm} nm`, `Licht der Wellenlänge ${nm} nm`);
    return {
      title: L('The energy of a photon', 'Die Energie eines Photons'),
      text: `<p>${src ? L(`${what} emits light of wavelength ${lam} = ${nm} nm.`, `${what} sendet Licht der Wellenlänge ${lam} = ${nm} nm aus.`) : L(`${what} consists of photons.`, `${what} besteht aus Photonen.`)} ${L('Find the frequency of the light and the energy of one photon, in joules and in electronvolts.', 'Bestimme die Frequenz des Lichts und die Energie eines Photons, in Joule und in Elektronvolt.')}</p>${CONST()}`,
      figs: fig(G.bar([{ nm, label: `${nm} nm` }])),
      questions: [
        numQ('f', L('frequency', 'Frequenz'), f, `${pow(14)} Hz`, fr / 1e14, { scale: 1e14 }),
        numQ('EJ', L('photon energy', 'Photonenenergie'), E, `${pow(-19)} J`, eJ / 1e-19, { scale: 1e-19, wrong: [{ value: eV, tag: 'evJ', why: WHY.eVasJ() }] }),
        numQ('EeV', L('photon energy', 'Photonenenergie'), E, 'eV', eV, { wrong: [{ value: eJ / 1e-19, tag: 'evJ', why: WHY.evJ() }, { value: nm / HC, tag: 'inverse', why: WHY.inverse() }] }),
      ],
      hints: [L(`Light is a wave: ${c} = ${lam}·${f}. Write the wavelength in metres.`, `Licht ist eine Welle: ${c} = ${lam}·${f}. Schreibe die Wellenlänge in Metern.`), L(`Each photon carries the energy ${E} = ${h}·${f}.`, `Jedes Photon trägt die Energie ${E} = ${h}·${f}.`), L('1 eV is the energy of an electron accelerated through 1 V: 1 eV = 1.602 · 10<sup>−19</sup> J.', '1 eV ist die Energie eines Elektrons, das mit 1 V beschleunigt wird: 1 eV = 1.602 · 10<sup>−19</sup> J.')],
      solution: [
        L(`Frequency: ${f} = ${c}/${lam} = 3.00 · 10<sup>8</sup> m/s / (${nm} · 10<sup>−9</sup> m) = <b>${sci(fr)} Hz</b>.`, `Frequenz: ${f} = ${c}/${lam} = 3.00 · 10<sup>8</sup> m/s / (${nm} · 10<sup>−9</sup> m) = <b>${sci(fr)} Hz</b>.`),
        L(`Photon energy: ${E} = ${h}·${f} = 6.626 · 10<sup>−34</sup> J·s · ${sci(fr)} Hz = <b>${sci(eJ)} J</b>.`, `Photonenenergie: ${E} = ${h}·${f} = 6.626 · 10<sup>−34</sup> J·s · ${sci(fr)} Hz = <b>${sci(eJ)} J</b>.`),
        L(`In electronvolts: ${E} = ${sci(eJ)} J / (1.602 · 10<sup>−19</sup> J/eV) = <b>${plain(eV)} eV</b>. A shortcut: ${E} = 1240 eV·nm / ${lam} = 1240 / ${nm} eV.`, `In Elektronvolt: ${E} = ${sci(eJ)} J / (1.602 · 10<sup>−19</sup> J/eV) = <b>${plain(eV)} eV</b>. Eine Abkürzung: ${E} = 1240 eV·nm / ${lam} = 1240 / ${nm} eV.`),
      ],
      p: { nm },
    };
  }

  const REGION = {
    uv: () => L('ultraviolet', 'ultraviolett'), vis: () => L('visible', 'sichtbar'), ir: () => L('infrared', 'infrarot'),
  };
  function wavelength(seed) {
    const r = rng(seed * 37 + 5);
    for (;;) {
      const inJ = r.next() < 0.4, eV = r.step(1.2, 4.6, 0.05), nm = HC / eV, reg = P.region(nm);
      if (Math.abs(nm - 380) < 8 || Math.abs(nm - 750) < 10) continue; // no doubt about the region
      const given = inJ ? `${E} = ${sci(eV * P.e)} J` : `${E} = ${plain(eV)} eV`;
      const why = (x) => L(`${cap(REGION[x]())} light has wavelengths ${x === 'uv' ? 'below 380 nm' : x === 'vis' ? 'from 380 nm to 750 nm' : 'above 750 nm'}.`, `${cap(REGION[x]())}es Licht hat Wellenlängen ${x === 'uv' ? 'unter 380 nm' : x === 'vis' ? 'von 380 nm bis 750 nm' : 'über 750 nm'}.`);
      const col = P.colour(nm);
      return {
        title: L('From the energy to the wavelength', 'Von der Energie zur Wellenlänge'),
        text: `<p>${L(`A photon has the energy ${given}. What is its wavelength, and what kind of light is it?`, `Ein Photon hat die Energie ${given}. Welche Wellenlänge hat es, und was für Licht ist es?`)}</p>${CONST()}`,
        figs: '',
        questions: [
          numQ('nm', L('wavelength', 'Wellenlänge'), lam, 'nm', nm, { wrong: [{ value: eV * HC / 1e3, tag: 'inverse', why: WHY.inverse() }] }),
          choice('reg', L('The light is', 'Das Licht ist'), opts(r, ['uv', 'vis', 'ir'].map((x) => [REGION[x](), x === reg, why(x), (x === 'uv') === (reg === 'ir') && x !== 'vis' ? 'inverse' : 'other']), true)),
        ],
        hints: [inJ ? L('Convert the energy to electronvolts first, or work in joules with E = h·c/λ.', 'Rechne die Energie zuerst in Elektronvolt um, oder rechne in Joule mit E = h·c/λ.') : L(`${E} = ${h}·${c}/${lam}, so ${lam} = ${h}·${c}/${E}.`, `${E} = ${h}·${c}/${lam}, also ${lam} = ${h}·${c}/${E}.`), L('h·c = 1240 eV·nm.', 'h·c = 1240 eV·nm.'), L('Visible light: 380 nm (violet) to 750 nm (red).', 'Sichtbares Licht: 380 nm (violett) bis 750 nm (rot).')],
        solution: [
          inJ ? L(`In electronvolts: ${E} = ${sci(eV * P.e)} J / (1.602 · 10<sup>−19</sup> J/eV) = ${plain(eV)} eV.`, `In Elektronvolt: ${E} = ${sci(eV * P.e)} J / (1.602 · 10<sup>−19</sup> J/eV) = ${plain(eV)} eV.`) : '',
          L(`${lam} = ${h}·${c}/${E} = 1240 eV·nm / ${plain(eV)} eV = <b>${plain(nm)} nm</b>.`, `${lam} = ${h}·${c}/${E} = 1240 eV·nm / ${plain(eV)} eV = <b>${plain(nm)} nm</b>.`),
          L(`So the light is <b>${REGION[reg]()}</b>${col ? ` (${{ violet: 'violet', blue: 'blue', green: 'green', yellow: 'yellow', orange: 'orange', red: 'red' }[col]})` : ''}.`, `Das Licht ist also <b>${REGION[reg]()}</b>${col ? ` (${{ violet: 'violett', blue: 'blau', green: 'grün', yellow: 'gelb', orange: 'orange', red: 'rot' }[col]})` : ''}.`),
        ].filter(Boolean),
        solFig: fig(G.bar([{ nm, label: `${plain(nm)} nm` }])),
        p: { eV, inJ },
      };
    }
  }

  const SOURCES = [
    { en: 'a red laser pointer', de: 'ein roter Laserpointer', nm: 650, P: [1, 5] },
    { en: 'a green laser pointer', de: 'ein grüner Laserpointer', nm: 532, P: [1, 5] },
    { en: 'a violet laser pointer', de: 'ein violetter Laserpointer', nm: 405, P: [1, 5, 20] },
    { en: 'an infrared LED', de: 'eine Infrarot-LED', nm: 850, P: [10, 50, 100] },
    { en: 'a UV LED', de: 'eine UV-LED', nm: 365, P: [10, 50, 100] },
    { en: 'a blue LED', de: 'eine blaue LED', nm: 470, P: [10, 20, 50] },
  ];
  function count(seed) {
    const r = rng(seed * 41 + 9);
    const s = r.pick(SOURCES), mW = r.pick(s.P), Pw = mW * 1e-3, eJ = P.joule(s.nm), N = Pw / eJ, k = expOf(N);
    return {
      title: L('How many photons?', 'Wie viele Photonen?'),
      text: `<p>${L(`${cap(nameOf(s))} emits light of wavelength ${s.nm} nm with a power of ${mW} mW. How many photons does it emit per second?`, `${cap(nameOf(s))} sendet Licht der Wellenlänge ${s.nm} nm mit einer Leistung von ${mW} mW aus. Wie viele Photonen werden pro Sekunde ausgesendet?`)}</p>${CONST()}`,
      figs: '',
      questions: [
        numQ('E', L('energy of one photon', 'Energie eines Photons'), E, `${pow(-19)} J`, eJ / 1e-19, { scale: 1e-19, wrong: [{ value: P.eV(s.nm), tag: 'evJ', why: WHY.eVasJ() }] }),
        numQ('N', L('photons per second', 'Photonen pro Sekunde'), `${i('N')}/s`, pow(k), N / Math.pow(10, k), { scale: Math.pow(10, k), wrong: [{ value: Pw / P.eV(s.nm) / Math.pow(10, k), tag: 'evJ', why: WHY.countJ() }] }),
      ],
      hints: [L(`One photon: ${E} = ${h}·${c}/${lam}.`, `Ein Photon: ${E} = ${h}·${c}/${lam}.`), L('The power is the energy per second: 1 mW = 10<sup>−3</sup> J/s.', 'Die Leistung ist die Energie pro Sekunde: 1 mW = 10<sup>−3</sup> J/s.'), L('Photons per second = power / energy of one photon.', 'Photonen pro Sekunde = Leistung / Energie eines Photons.')],
      solution: [
        L(`One photon: ${E} = ${h}·${c}/${lam} = 6.626 · 10<sup>−34</sup> J·s · 3.00 · 10<sup>8</sup> m/s / (${s.nm} · 10<sup>−9</sup> m) = <b>${sci(eJ)} J</b>.`, `Ein Photon: ${E} = ${h}·${c}/${lam} = 6.626 · 10<sup>−34</sup> J·s · 3.00 · 10<sup>8</sup> m/s / (${s.nm} · 10<sup>−9</sup> m) = <b>${sci(eJ)} J</b>.`),
        L(`In one second the source emits the energy ${mW} · 10<sup>−3</sup> J, so ${i('N')} = ${sci(Pw)} J / ${sci(eJ)} J = <b>${sci(N)}</b> photons per second.`, `In einer Sekunde sendet die Quelle die Energie ${mW} · 10<sup>−3</sup> J aus, also ${i('N')} = ${sci(Pw)} J / ${sci(eJ)} J = <b>${sci(N)}</b> Photonen pro Sekunde.`),
        L('Even a weak light consists of an enormous number of photons: this is why we do not notice that light comes in portions.', 'Selbst schwaches Licht besteht aus einer riesigen Zahl von Photonen: Deshalb merken wir nicht, dass Licht in Portionen kommt.'),
      ],
      p: { s: s.nm, mW },
    };
  }

  // Three sources: the most energetic photons and the most photons per second are different ones.
  function rank(seed) {
    const r = rng(seed * 43 + 13);
    for (;;) {
      const srcs = r.shuffle(SOURCES).slice(0, 3).map((s) => ({ ...s, mW: r.pick([1, 2, 5, 10, 20, 50]) }));
      const Es = srcs.map((s) => P.eV(s.nm)), Ns = srcs.map((s) => s.mW * s.nm);
      const iE = Es.indexOf(Math.max(...Es)), iN = Ns.indexOf(Math.max(...Ns)), iP = srcs.map((s) => s.mW).indexOf(Math.max(...srcs.map((s) => s.mW)));
      if (iE === iN || new Set(Ns).size < 3 || new Set(srcs.map((s) => s.mW)).size < 3) continue;
      if (Ns.filter((n) => n > 0.8 * Ns[iN]).length > 1) continue; // a clear winner
      const tag = ['A', 'B', 'C'];
      const table = `<table class="data"><tr><th></th><th>${L('source', 'Quelle')}</th><th>${lam}</th><th>${i('P')}</th></tr>${srcs.map((s, k) => `<tr><td><b>${tag[k]}</b></td><td>${nameOf(s)}</td><td>${s.nm} nm</td><td>${s.mW} mW</td></tr>`).join('')}</table>`;
      const qE = srcs.map((s, k) => [tag[k], k === iE, k === iP ? L('The power is the energy per second, not the energy of one photon. That depends only on the wavelength.', 'Die Leistung ist die Energie pro Sekunde, nicht die Energie eines Photons. Diese hängt nur von der Wellenlänge ab.') : WHY.inverse(), k === iP ? 'intensity' : 'inverse']);
      qE.push([L('all the same', 'alle gleich'), false, L('Photons of different wavelengths carry different energies.', 'Photonen verschiedener Wellenlänge tragen verschiedene Energien.'), 'other']);
      const qN = srcs.map((s, k) => [tag[k], k === iN, k === iE ? L('Its photons carry the most energy each: the same power needs fewer of them.', 'Seine Photonen tragen je am meisten Energie: Für dieselbe Leistung braucht es weniger davon.') : L('Photons per second = power / photon energy: both matter.', 'Photonen pro Sekunde = Leistung / Photonenenergie: Beides zählt.'), k === iE ? 'inverse' : 'other']);
      return {
        title: L('Energetic photons or many photons?', 'Energiereiche Photonen oder viele Photonen?'),
        text: `<p>${L('Three light sources:', 'Drei Lichtquellen:')}</p>${table}`,
        figs: fig(G.bar(srcs.map((s, k) => ({ nm: s.nm, label: tag[k] })))),
        questions: [
          choice('E', L('(a) Which source emits the photons with the most energy?', '(a) Welche Quelle sendet die Photonen mit der grössten Energie aus?'), opts(r, qE, true)),
          choice('N', L('(b) Which source emits the most photons per second?', '(b) Welche Quelle sendet die meisten Photonen pro Sekunde aus?'), opts(r, qN.concat([[L('all the same', 'alle gleich'), false, L('Photons per second = power / photon energy: compare P·λ.', 'Photonen pro Sekunde = Leistung / Photonenenergie: Vergleiche P·λ.'), 'other']]), true)),
        ],
        hints: [L(`The energy of one photon: ${E} = ${h}·${c}/${lam}. It does not depend on the power.`, `Die Energie eines Photons: ${E} = ${h}·${c}/${lam}. Sie hängt nicht von der Leistung ab.`), L(`Photons per second: ${i('N')} = ${i('P')}/${E} = ${i('P')}·${lam}/(${h}·${c}), so compare ${i('P')}·${lam}.`, `Photonen pro Sekunde: ${i('N')} = ${i('P')}/${E} = ${i('P')}·${lam}/(${h}·${c}); vergleiche also ${i('P')}·${lam}.`)],
        solution: [
          L(`(a) The shorter the wavelength, the more energy each photon carries: <b>${tag[iE]}</b> (${srcs[iE].nm} nm, ${plain(Es[iE])} eV per photon). The power does not matter.`, `(a) Je kürzer die Wellenlänge, desto mehr Energie trägt jedes Photon: <b>${tag[iE]}</b> (${srcs[iE].nm} nm, ${plain(Es[iE])} eV pro Photon). Die Leistung spielt keine Rolle.`),
          L(`(b) ${i('N')} = ${i('P')}/${E} is proportional to ${i('P')}·${lam}: ${srcs.map((s, k) => `${tag[k]}: ${s.mW} · ${s.nm} = ${s.mW * s.nm}`).join(', ')}. The most photons per second: <b>${tag[iN]}</b>.`, `(b) ${i('N')} = ${i('P')}/${E} ist proportional zu ${i('P')}·${lam}: ${srcs.map((s, k) => `${tag[k]}: ${s.mW} · ${s.nm} = ${s.mW * s.nm}`).join(', ')}. Die meisten Photonen pro Sekunde: <b>${tag[iN]}</b>.`),
        ],
        p: { s: srcs.map((s) => `${s.nm}:${s.mW}`) },
      };
    }
  }

  // ---------------------------------------------------------------- the photoelectric effect
  function photoCalc(seed) {
    const r = rng(seed * 47 + 17);
    for (;;) {
      const m = r.pick(P.METALS), src = r.next() < 0.5 ? r.pick(P.LINES) : null, nm = src ? src.nm : r.step(200, 600, 10);
      const eV = P.eV(nm), ek = eV - m.W, out = ek > 0;
      if (Math.abs(ek) < 0.15) continue;
      if (!out && r.next() < 0.6) continue; // mostly electrons released
      const lg = HC / m.W, v = out ? P.speed(ek) : 0;
      const light = src ? nameOf(src) : L(`light of wavelength ${nm} nm`, `Licht der Wellenlänge ${nm} nm`);
      const yes = L('yes', 'ja'), no = L('no', 'nein');
      const qOut = choice('out', L('Are electrons released?', 'Werden Elektronen ausgelöst?'), opts(r, [
        [yes, out, L('Compare the energy of one photon with the work function: it is not enough.', 'Vergleiche die Energie eines Photons mit der Austrittsarbeit: Sie reicht nicht.'), 'threshold'],
        [no, !out, L('Compare the energy of one photon with the work function.', 'Vergleiche die Energie eines Photons mit der Austrittsarbeit.'), 'other'],
        [L('only if the light is bright enough', 'nur wenn das Licht hell genug ist'), false, L('Each electron takes the energy of one photon. A brighter light gives more photons, not more energetic ones.', 'Jedes Elektron nimmt die Energie eines Photons auf. Helleres Licht liefert mehr Photonen, nicht energiereichere.'), 'intensity'],
      ], true));
      const qs = [qOut];
      if (out) {
        qs.push(numQ('ek', L('kinetic energy of the fastest electrons', 'kinetische Energie der schnellsten Elektronen'), `${Ek}${sb(',max')}`, 'eV', ek, { tol: 0.02, abs: 0.012, wrong: [{ value: eV, tag: 'noW', why: WHY.noW() }, { value: eV + m.W, tag: 'addW', why: WHY.addW() }] }));
        qs.push(numQ('U0', L('stopping voltage', 'Gegenspannung'), U0, 'V', ek, { tol: 0.02, abs: 0.012, wrong: [{ value: eV, tag: 'noW', why: WHY.noW() }] }));
        qs.push(numQ('v', L('speed of the fastest electrons', 'Geschwindigkeit der schnellsten Elektronen'), `${i('v')}${sb('max')}`, 'km/s', v / 1e3, { tol: 0.03 }));
      } else qs.push(numQ('lg', L('the longest wavelength that releases electrons', 'die grösste Wellenlänge, die Elektronen auslöst'), `${lam}${sb('G')}`, 'nm', lg, { tol: 0.015, wrong: [{ value: m.W * 1240 / 1e3, tag: 'inverse', why: WHY.inverse() }] }));
      return {
        title: L('The photoelectric effect', 'Der Photoeffekt'),
        text: `<p>${L(`${cap(light)} falls on a ${m.en} cathode (work function ${W} = ${m.W} eV).`, `${cap(light)} fällt auf eine Kathode aus ${m.de} (Austrittsarbeit ${W} = ${m.W} eV).`)} ${src ? L(`The wavelength is ${nm} nm.`, `Die Wellenlänge ist ${nm} nm.`) : ''}</p>${CONST()}<p class="consts">${i('m')}${sb('e')} = 9.109 · 10<sup>−31</sup> kg</p>`,
        figs: fig(G.cell({ nm, counter: true })),
        questions: qs,
        hints: [L(`Energy of one photon: ${E} = ${h}·${c}/${lam} = 1240 eV·nm / ${lam}.`, `Energie eines Photons: ${E} = ${h}·${c}/${lam} = 1240 eV·nm / ${lam}.`), L(`Einstein: ${h}·${f} = ${W} + ${Ek}${sb(',max')}. If ${h}·${f} < ${W}, no electron gets out.`, `Einstein: ${h}·${f} = ${W} + ${Ek}${sb(',max')}. Ist ${h}·${f} < ${W}, kommt kein Elektron heraus.`),
          out ? L(`The stopping voltage just stops the fastest electrons: ${i('e')}·${U0} = ${Ek}${sb(',max')}. For the speed, ${Ek} = ½·${i('m')}·${i('v')}² with ${Ek} in joules.`, `Die Gegenspannung stoppt gerade die schnellsten Elektronen: ${i('e')}·${U0} = ${Ek}${sb(',max')}. Für die Geschwindigkeit: ${Ek} = ½·${i('m')}·${i('v')}² mit ${Ek} in Joule.`) : L(`At the threshold, ${h}·${c}/${lam}${sb('G')} = ${W}.`, `An der Grenze gilt ${h}·${c}/${lam}${sb('G')} = ${W}.`)],
        solution: [
          L(`Photon energy: ${E} = 1240 eV·nm / ${nm} nm = ${plain(eV)} eV.`, `Photonenenergie: ${E} = 1240 eV·nm / ${nm} nm = ${plain(eV)} eV.`),
          out ? L(`${plain(eV)} eV > ${m.W} eV: <b>electrons are released</b>. The fastest get ${Ek}${sb(',max')} = ${h}·${f} − ${W} = ${plain(eV)} eV − ${m.W} eV = <b>${plain(ek)} eV</b>.`, `${plain(eV)} eV > ${m.W} eV: <b>Es werden Elektronen ausgelöst</b>. Die schnellsten erhalten ${Ek}${sb(',max')} = ${h}·${f} − ${W} = ${plain(eV)} eV − ${m.W} eV = <b>${plain(ek)} eV</b>.`)
            : L(`${plain(eV)} eV < ${m.W} eV: one photon does not have enough energy, so <b>no electrons are released</b>, however bright the light.`, `${plain(eV)} eV < ${m.W} eV: Ein Photon hat nicht genug Energie, also werden <b>keine Elektronen ausgelöst</b>, wie hell das Licht auch ist.`),
          out ? L(`Stopping voltage: ${i('e')}·${U0} = ${Ek}${sb(',max')}, so ${U0} = <b>${plain(ek)} V</b> (an energy of ${plain(ek)} eV is stopped by ${plain(ek)} V).`, `Gegenspannung: ${i('e')}·${U0} = ${Ek}${sb(',max')}, also ${U0} = <b>${plain(ek)} V</b> (eine Energie von ${plain(ek)} eV wird von ${plain(ek)} V gestoppt).`)
            : L(`Threshold: ${lam}${sb('G')} = 1240 eV·nm / ${m.W} eV = <b>${plain(lg)} nm</b>. Only shorter wavelengths release electrons.`, `Grenzwellenlänge: ${lam}${sb('G')} = 1240 eV·nm / ${m.W} eV = <b>${plain(lg)} nm</b>. Nur kürzere Wellenlängen lösen Elektronen aus.`),
          out ? L(`Speed: ${i('v')} = √(2·${Ek}/${i('m')}) = √(2 · ${sci(ek * P.e)} J / 9.109 · 10<sup>−31</sup> kg) = ${sci(v)} m/s = <b>${plain(v / 1e3)} km/s</b>.`, `Geschwindigkeit: ${i('v')} = √(2·${Ek}/${i('m')}) = √(2 · ${sci(ek * P.e)} J / 9.109 · 10<sup>−31</sup> kg) = ${sci(v)} m/s = <b>${plain(v / 1e3)} km/s</b>.`) : '',
        ].filter(Boolean),
        solFig: fig(G.bars(eV, m.W)),
        p: { m: m.id, nm },
      };
    }
  }

  // The current of a photocell against the voltage, before and after a change: which curve?
  const CHANGES = ['brighter', 'dimmer', 'shorter', 'longer', 'metal'];
  function photoCurve(seed) {
    const r = rng(seed * 53 + 19);
    const ch = r.pick(CHANGES), U = r.step(0.8, 1.6, 0.1), I = r.pick([8, 10, 12]), dU = r.pick([0.6, 0.8, 1.0]);
    const nm = r.pick([365, 405, 436]), Wc = P.round(P.eV(nm) - U, 3);
    const after = {
      brighter: [U, 2 * I], dimmer: [U, I / 2], shorter: [U + dU, I], longer: [U - dU, I], metal: [U - dU, I],
    }[ch];
    const text = {
      brighter: L('The light is made twice as bright (same wavelength).', 'Das Licht wird doppelt so hell gemacht (gleiche Wellenlänge).'),
      dimmer: L('The light is made half as bright (same wavelength).', 'Das Licht wird halb so hell gemacht (gleiche Wellenlänge).'),
      shorter: L('Light of a shorter wavelength is used, with the same number of photons per second.', 'Es wird Licht kürzerer Wellenlänge verwendet, mit gleich vielen Photonen pro Sekunde.'),
      longer: L('Light of a longer wavelength is used (still releasing electrons), with the same number of photons per second.', 'Es wird Licht längerer Wellenlänge verwendet (das noch Elektronen auslöst), mit gleich vielen Photonen pro Sekunde.'),
      metal: L('The cathode is replaced by one with a larger work function; the light stays the same.', 'Die Kathode wird durch eine mit grösserer Austrittsarbeit ersetzt; das Licht bleibt gleich.'),
    }[ch];
    const cands = [[U, 2 * I], [U, I / 2], [U + dU, I], [U - dU, I], [U + dU, 2 * I], [U - dU, I / 2]];
    const right = cands.findIndex(([a, b]) => Math.abs(a - after[0]) < 1e-9 && b === after[1]);
    const light = ch === 'brighter' || ch === 'dimmer';
    const whyOf = ([a, b]) => {
      const uCh = Math.abs(a - U) > 1e-9, iCh = b !== I;
      if (light && uCh) return [L('The stopping voltage depends on the energy of one photon, not on how many there are: brightness does not change it.', 'Die Gegenspannung hängt von der Energie eines Photons ab, nicht davon, wie viele es sind: Die Helligkeit ändert sie nicht.'), 'intensity'];
      if (!light && iCh) return [L('The same number of photons per second releases the same number of electrons per second: the saturation current stays.', 'Gleich viele Photonen pro Sekunde lösen gleich viele Elektronen pro Sekunde aus: Der Sättigungsstrom bleibt.'), 'other'];
      if (light) return [L(`${ch === 'brighter' ? 'More' : 'Fewer'} photons per second release ${ch === 'brighter' ? 'more' : 'fewer'} electrons per second.`, `${ch === 'brighter' ? 'Mehr' : 'Weniger'} Photonen pro Sekunde lösen ${ch === 'brighter' ? 'mehr' : 'weniger'} Elektronen pro Sekunde aus.`), 'other'];
      return [L(`${Ek}${sb(',max')} = ${h}·${f} − ${W}: think about whether the fastest electrons get faster or slower.`, `${Ek}${sb(',max')} = ${h}·${f} − ${W}: Überlege, ob die schnellsten Elektronen schneller oder langsamer werden.`), 'addW'];
    };
    const wrongs = r.shuffle(cands.filter((_, k) => k !== right)).slice(0, 3);
    const options = r.shuffle([after, ...wrongs]).map((cd) => {
      const ok = cd === after, [why, tag] = ok ? ['', undefined] : whyOf(cd);
      return { html: G.ivGraph([{ U0: U, I, cls: 'old', dash: true }, { U0: cd[0], I: cd[1], cls: 'new' }], { Imax: 2.3 * I, small: true, w: 260, h: 180 }), ok, why, tag };
    });
    const eVnm = P.eV(nm);
    return {
      title: L('The characteristic of a photocell', 'Die Kennlinie einer Photozelle'),
      text: `<p>${L(`Light of wavelength ${nm} nm falls on the cathode of a photocell. The graph shows the current against the voltage between anode and cathode (negative: a counter-voltage that slows the electrons).`, `Licht der Wellenlänge ${nm} nm fällt auf die Kathode einer Photozelle. Der Graph zeigt den Strom gegen die Spannung zwischen Anode und Kathode (negativ: eine Gegenspannung, die die Elektronen bremst).`)}</p>`,
      figs: fig(G.ivGraph([{ U0: U, I, cls: 'new' }], { Imax: 2.3 * I })),
      questions: [
        numQ('U0', L('(a) the stopping voltage, read off', '(a) die Gegenspannung, abgelesen'), U0, 'V', U, { tol: 0.01, abs: 0.06 }),
        numQ('W', L('(b) the work function of the cathode', '(b) die Austrittsarbeit der Kathode'), W, 'eV', Wc, { tol: 0.01, abs: 0.07, wrong: [{ value: eVnm + U, tag: 'addW', why: WHY.addW() }, { value: U, tag: 'noW', why: L('That is the kinetic energy of the fastest electrons, not the work function.', 'Das ist die kinetische Energie der schnellsten Elektronen, nicht die Austrittsarbeit.') }] }),
        pick('new', L(`(c) ${text} Which graph shows the new current (solid) compared with the old one (dashed)?`, `(c) ${text} Welcher Graph zeigt den neuen Strom (ausgezogen) im Vergleich zum alten (gestrichelt)?`), options),
      ],
      hints: [
        L(`The current stops where the counter-voltage is just strong enough to stop the fastest electrons: at ${i('U')} = −${U0}.`, `Der Strom hört dort auf, wo die Gegenspannung gerade stark genug ist, um die schnellsten Elektronen zu stoppen: bei ${i('U')} = −${U0}.`),
        L(`${Ek}${sb(',max')} = ${i('e')}·${U0} and ${h}·${f} = ${W} + ${Ek}${sb(',max')}; the photon energy is 1240 eV·nm / ${lam}.`, `${Ek}${sb(',max')} = ${i('e')}·${U0} und ${h}·${f} = ${W} + ${Ek}${sb(',max')}; die Photonenenergie ist 1240 eV·nm / ${lam}.`),
        L('The saturation current counts the electrons per second (the photons per second); the stopping voltage measures the energy of the fastest electrons (the energy of one photon).', 'Der Sättigungsstrom zählt die Elektronen pro Sekunde (die Photonen pro Sekunde); die Gegenspannung misst die Energie der schnellsten Elektronen (die Energie eines Photons).'),
      ],
      solution: [
        L(`(a) The current drops to zero at ${i('U')} = −${plain(U)} V: ${U0} = <b>${plain(U)} V</b>, so the fastest electrons have ${plain(U)} eV.`, `(a) Der Strom fällt bei ${i('U')} = −${plain(U)} V auf null: ${U0} = <b>${plain(U)} V</b>; die schnellsten Elektronen haben also ${plain(U)} eV.`),
        L(`(b) ${W} = ${h}·${f} − ${i('e')}·${U0} = ${plain(eVnm)} eV − ${plain(U)} eV = <b>${plain(Wc)} eV</b>.`, `(b) ${W} = ${h}·${f} − ${i('e')}·${U0} = ${plain(eVnm)} eV − ${plain(U)} eV = <b>${plain(Wc)} eV</b>.`),
        `(c) ${{
          brighter: L('Twice as many photons per second release twice as many electrons: the saturation current doubles. Each photon still has the same energy, so the stopping voltage stays.', 'Doppelt so viele Photonen pro Sekunde lösen doppelt so viele Elektronen aus: Der Sättigungsstrom verdoppelt sich. Jedes Photon hat immer noch dieselbe Energie, also bleibt die Gegenspannung.'),
          dimmer: L('Half as many photons per second release half as many electrons: the saturation current halves. The stopping voltage stays.', 'Halb so viele Photonen pro Sekunde lösen halb so viele Elektronen aus: Der Sättigungsstrom halbiert sich. Die Gegenspannung bleibt.'),
          shorter: L('Each photon has more energy, so the fastest electrons are faster: a larger stopping voltage. The same number of photons per second gives the same saturation current.', 'Jedes Photon hat mehr Energie, also sind die schnellsten Elektronen schneller: eine grössere Gegenspannung. Gleich viele Photonen pro Sekunde ergeben denselben Sättigungsstrom.'),
          longer: L('Each photon has less energy, so the fastest electrons are slower: a smaller stopping voltage. The same number of photons per second gives the same saturation current.', 'Jedes Photon hat weniger Energie, also sind die schnellsten Elektronen langsamer: eine kleinere Gegenspannung. Gleich viele Photonen pro Sekunde ergeben denselben Sättigungsstrom.'),
          metal: L('More of each photon’s energy is needed to free the electron, so the fastest electrons are slower: a smaller stopping voltage. The number of electrons per second, and so the saturation current, stays the same (as long as electrons are released at all).', 'Ein grösserer Teil der Photonenenergie wird zum Herauslösen gebraucht, also sind die schnellsten Elektronen langsamer: eine kleinere Gegenspannung. Die Zahl der Elektronen pro Sekunde und damit der Sättigungsstrom bleibt gleich (solange überhaupt Elektronen ausgelöst werden).'),
        }[ch]}`,
      ],
      solFig: fig(G.ivGraph([{ U0: U, I, cls: 'old', dash: true }, { U0: after[0], I: after[1], cls: 'new' }], { Imax: 2.3 * I })),
      p: { ch, U, I, dU },
    };
  }

  // Measuring h: the stopping voltages of the mercury lines, U₀ against f, a straight line.
  const HG = [365.0, 404.7, 435.8, 546.1, 577.0];
  function fit(pts) {
    const n = pts.length, sx = pts.reduce((a, p) => a + p[0], 0), sy = pts.reduce((a, p) => a + p[1], 0);
    const sxx = pts.reduce((a, p) => a + p[0] * p[0], 0), sxy = pts.reduce((a, p) => a + p[0] * p[1], 0);
    const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
    return { slope, icept: (sy - slope * sx) / n };
  }
  function photoGraph(seed) {
    const r = rng(seed * 59 + 23);
    for (;;) {
      const Wt = r.step(1.6, 2.0, 0.05);
      const lines = HG.filter((nm) => P.eV(nm) - Wt > 0.2);
      if (lines.length < 4) continue;
      const pts = lines.map((nm) => { const fq = P.round(P.freq(nm) / 1e14, 3); return [fq, Math.round((P.eV(nm) - Wt + (r.next() - 0.5) * 0.03) * 100) / 100]; }).sort((a, b) => a[0] - b[0]);
      const ln = fit(pts), hh = ln.slope * 1e-14 * P.e, fg = -ln.icept / ln.slope, Wm = -ln.icept;
      const [a, b] = [pts[0], pts[pts.length - 1]];
      const table = `<table class="data"><tr><th>${lam} in nm</th>${lines.slice().sort((x, y) => y - x).map((nm) => `<td>${plain(nm, 4)}</td>`).join('')}</tr><tr><th>${f} in 10<sup>14</sup> Hz</th>${pts.map((p) => `<td>${p[0].toFixed(2)}</td>`).join('')}</tr><tr><th>${U0} in V</th>${pts.map((p) => `<td>${p[1].toFixed(2)}</td>`).join('')}</tr></table>`;
      return {
        title: L('Measuring Planck’s constant', 'Die Planck-Konstante messen'),
        text: `<p>${L(`The lines of a mercury lamp fall one after the other on a photocell; for each, the stopping voltage ${U0} is measured. ${E}${sb('kin,max')} = ${i('e')}·${U0} = ${h}·${f} − ${W}, so ${U0} = (${h}/${i('e')})·${f} − ${W}/${i('e')}: a straight line.`, `Die Linien einer Quecksilberdampflampe fallen nacheinander auf eine Photozelle; für jede wird die Gegenspannung ${U0} gemessen. ${E}${sb('kin,max')} = ${i('e')}·${U0} = ${h}·${f} − ${W}, also ${U0} = (${h}/${i('e')})·${f} − ${W}/${i('e')}: eine Gerade.`)}</p>${table}`,
        figs: fig(G.ufGraph({ pts, line: { slope: ln.slope, icept: ln.icept } })),
        questions: [
          numQ('h', L('(a) Planck’s constant from the slope', '(a) die Planck-Konstante aus der Steigung'), h, `${pow(-34)} J·s`, hh / 1e-34, { tol: 0.04, scale: 1e-34, wrong: [{ value: (ln.slope * 1e-14) / 1e-34, tag: 'slope', why: WHY.slopeE() }] }),
          numQ('fG', L('(b) the threshold frequency', '(b) die Grenzfrequenz'), fG, `${pow(14)} Hz`, fg, { tol: 0.04, scale: 1e14 }),
          numQ('W', L('(c) the work function of the cathode', '(c) die Austrittsarbeit der Kathode'), W, 'eV', Wm, { tol: 0.04, abs: 0.06 }),
        ],
        hints: [
          L(`Draw the best straight line through the points. Its slope is ${h}/${i('e')}: take two points far apart on the line, Δ${U0}/Δ${f}.`, `Lege die beste Gerade durch die Punkte. Ihre Steigung ist ${h}/${i('e')}: Nimm zwei weit auseinanderliegende Punkte auf der Geraden, Δ${U0}/Δ${f}.`),
          L(`Where the line meets the ${f}-axis (${U0} = 0), the electrons just get out: that is the threshold frequency.`, `Wo die Gerade die ${f}-Achse schneidet (${U0} = 0), kommen die Elektronen gerade noch heraus: Das ist die Grenzfrequenz.`),
          L(`${W} = ${h}·${fG}; or extend the line to ${f} = 0: it meets the ${U0}-axis at −${W}/${i('e')}.`, `${W} = ${h}·${fG}; oder verlängere die Gerade bis ${f} = 0: Sie schneidet die ${U0}-Achse bei −${W}/${i('e')}.`),
        ],
        solution: [
          L(`(a) Slope from the outer points: (${b[1].toFixed(2)} V − ${a[1].toFixed(2)} V) / ((${b[0].toFixed(2)} − ${a[0].toFixed(2)}) · 10<sup>14</sup> Hz) ≈ ${sci(ln.slope * 1e-14)} V·s (the best line through all points). ${h} = ${i('e')} · slope = 1.602 · 10<sup>−19</sup> C · ${sci(ln.slope * 1e-14)} V·s = <b>${sci(hh)} J·s</b>, close to the accepted 6.626 · 10<sup>−34</sup> J·s.`,
            `(a) Steigung aus den äussersten Punkten: (${b[1].toFixed(2)} V − ${a[1].toFixed(2)} V) / ((${b[0].toFixed(2)} − ${a[0].toFixed(2)}) · 10<sup>14</sup> Hz) ≈ ${sci(ln.slope * 1e-14)} V·s (die beste Gerade durch alle Punkte). ${h} = ${i('e')} · Steigung = 1.602 · 10<sup>−19</sup> C · ${sci(ln.slope * 1e-14)} V·s = <b>${sci(hh)} J·s</b>, nahe am Literaturwert 6.626 · 10<sup>−34</sup> J·s.`),
          L(`(b) The line meets the ${f}-axis at ${fG} = <b>${plain(fg)} · 10<sup>14</sup> Hz</b> (${lam}${sb('G')} = ${c}/${fG} = ${plain(P.c / (fg * 1e14) * 1e9)} nm).`, `(b) Die Gerade schneidet die ${f}-Achse bei ${fG} = <b>${plain(fg)} · 10<sup>14</sup> Hz</b> (${lam}${sb('G')} = ${c}/${fG} = ${plain(P.c / (fg * 1e14) * 1e9)} nm).`),
          L(`(c) Extended to ${f} = 0, the line meets the ${U0}-axis at −${plain(Wm)} V: ${W} = <b>${plain(Wm)} eV</b>. The same from ${W} = ${h}·${fG}.`, `(c) Bis ${f} = 0 verlängert, schneidet die Gerade die ${U0}-Achse bei −${plain(Wm)} V: ${W} = <b>${plain(Wm)} eV</b>. Dasselbe ergibt ${W} = ${h}·${fG}.`),
        ],
        solFig: fig(G.ufGraph({ pts, line: { slope: ln.slope, icept: ln.icept }, solve: true })),
        p: { Wt, pts: pts.map((x) => x[1]) },
      };
    }
  }

  const BANK = [
    [() => L('The energy of a photon depends only on the frequency of the light.', 'Die Energie eines Photons hängt nur von der Frequenz des Lichts ab.'), true, () => L('E = h·f.', 'E = h·f.')],
    [() => L('Brighter light consists of more energetic photons.', 'Helleres Licht besteht aus energiereicheren Photonen.'), false, () => L('Brighter light has more photons per second; each has the energy h·f.', 'Helleres Licht hat mehr Photonen pro Sekunde; jedes hat die Energie h·f.')],
    [() => L('Red light releases electrons from any metal if it is bright enough.', 'Rotes Licht löst aus jedem Metall Elektronen aus, wenn es hell genug ist.'), false, () => L('Below the threshold frequency no electrons are released, however bright the light.', 'Unterhalb der Grenzfrequenz werden keine Elektronen ausgelöst, wie hell das Licht auch ist.')],
    [() => L('With very dim light above the threshold frequency, electrons are released at once.', 'Mit sehr schwachem Licht oberhalb der Grenzfrequenz werden sofort Elektronen ausgelöst.'), true, () => L('One photon is enough to release an electron: there is no waiting time to collect energy.', 'Ein Photon genügt, um ein Elektron auszulösen: Es gibt keine Wartezeit, um Energie zu sammeln.')],
    [() => L('Doubling the brightness doubles the stopping voltage.', 'Doppelte Helligkeit verdoppelt die Gegenspannung.'), false, () => L('The stopping voltage depends on the photon energy, not on the number of photons.', 'Die Gegenspannung hängt von der Photonenenergie ab, nicht von der Zahl der Photonen.')],
    [() => L('Doubling the brightness doubles the saturation current.', 'Doppelte Helligkeit verdoppelt den Sättigungsstrom.'), true, () => L('Twice as many photons release twice as many electrons.', 'Doppelt so viele Photonen lösen doppelt so viele Elektronen aus.')],
    [() => L('Light of higher frequency releases faster electrons.', 'Licht höherer Frequenz löst schnellere Elektronen aus.'), true, () => L('E_kin,max = h·f − W grows with f.', 'E_kin,max = h·f − W wächst mit f.')],
    [() => L('The kinetic energy of the fastest electrons is proportional to the frequency.', 'Die kinetische Energie der schnellsten Elektronen ist proportional zur Frequenz.'), false, () => L('E_kin,max = h·f − W: a straight line, but not through the origin.', 'E_kin,max = h·f − W: eine Gerade, aber nicht durch den Ursprung.')],
    [() => L('The slope of the U₀(f) line is the same for every metal.', 'Die Steigung der U₀(f)-Geraden ist für jedes Metall gleich.'), true, () => L('The slope is h/e; only the threshold frequency differs.', 'Die Steigung ist h/e; nur die Grenzfrequenz ist verschieden.')],
    [() => L('A metal with a larger work function has a higher threshold frequency.', 'Ein Metall mit grösserer Austrittsarbeit hat eine höhere Grenzfrequenz.'), true, () => L('f_G = W/h.', 'f_G = W/h.')],
    [() => L('A photon of blue light has more energy than a photon of red light.', 'Ein Photon blauen Lichts hat mehr Energie als ein Photon roten Lichts.'), true, () => L('Blue light has the shorter wavelength, the higher frequency.', 'Blaues Licht hat die kürzere Wellenlänge, die höhere Frequenz.')],
    [() => L('A 100 W infrared lamp emits more energetic photons than a 1 mW UV LED.', 'Eine 100-W-Infrarotlampe sendet energiereichere Photonen aus als eine 1-mW-UV-LED.'), false, () => L('The power counts the photons, not their energy: UV photons carry more energy each.', 'Die Leistung zählt die Photonen, nicht ihre Energie: UV-Photonen tragen je mehr Energie.')],
    [() => L('One electron takes up the energy of exactly one photon.', 'Ein Elektron nimmt die Energie von genau einem Photon auf.'), true, () => L('That is why only the photon energy decides whether it gets out.', 'Deshalb entscheidet nur die Photonenenergie, ob es herauskommt.')],
    [() => L('The wave model of light explains the threshold frequency.', 'Das Wellenmodell des Lichts erklärt die Grenzfrequenz.'), false, () => L('In the wave model, any light would release electrons after enough time; the threshold needs photons.', 'Im Wellenmodell würde jedes Licht nach genügend langer Zeit Elektronen auslösen; die Grenzfrequenz braucht Photonen.')],
    [() => L('Not all released electrons have the largest kinetic energy.', 'Nicht alle ausgelösten Elektronen haben die grösste kinetische Energie.'), true, () => L('Electrons from deeper in the metal lose energy on the way out; W is the least energy needed.', 'Elektronen aus tieferen Schichten verlieren auf dem Weg nach aussen Energie; W ist die kleinste nötige Energie.')],
    [() => L('A photon has no momentum, since it has no mass.', 'Ein Photon hat keinen Impuls, da es keine Masse hat.'), false, () => L('p = h/λ: light pushes on what absorbs or reflects it.', 'p = h/λ: Licht drückt auf das, was es absorbiert oder reflektiert.')],
  ];
  function photoStmts(seed) {
    const r = rng(seed * 61 + 29);
    for (;;) {
      const pk = r.shuffle(BANK).slice(0, 5);
      if (pk.every((s) => s[1]) || pk.every((s) => !s[1])) continue;
      return {
        title: L('Which statements are correct?', 'Welche Aussagen sind richtig?'),
        text: L('<p>Tick all the statements that are correct.</p>', '<p>Kreuze alle richtigen Aussagen an.</p>'), figs: '',
        questions: [multi('s', pk.map(([t, ok, why]) => ({ html: t(), ok, why: why() })))],
        hints: [L('Photon energy: E = h·f. Brightness: the number of photons per second.', 'Photonenenergie: E = h·f. Helligkeit: die Zahl der Photonen pro Sekunde.'), L('Einstein: h·f = W + E_kin,max.', 'Einstein: h·f = W + E_kin,max.')],
        solution: pk.map(([t, ok, why]) => `${ok ? '✓' : '✗'} ${t()} ${why()}`),
        p: { s: pk.map((s) => BANK.indexOf(s)) },
      };
    }
  }

  // ---------------------------------------------------------------- photon momentum
  function momentum(seed) {
    const r = rng(seed * 67 + 31);
    const src = r.pick(SOURCES), Pw = r.pick([1, 5, 10, 100, 1000]) * 1e-3, nm = src.nm, p = P.momentum(nm), F = Pw / P.c;
    const Fu = F < 1e-9 ? ['pN', 1e-12] : ['nN', 1e-9];
    const other = r.pick(SOURCES.filter((s) => s.nm !== nm)), more = other.nm < nm;
    return {
      title: L('The momentum of light', 'Der Impuls des Lichts'),
      text: `<p>${L(`${cap(nameOf(src))} (${nm} nm) shines with a power of ${plain(Pw * 1e3)} mW on a black surface, which absorbs the light.`, `${cap(nameOf(src))} (${nm} nm) strahlt mit einer Leistung von ${plain(Pw * 1e3)} mW auf eine schwarze Fläche, die das Licht absorbiert.`)}</p>${CONST()}`,
      figs: fig(G.sail({ absorb: true })),
      questions: [
        numQ('p', L('(a) the momentum of one photon', '(a) der Impuls eines Photons'), i('p'), `${pow(-27)} kg·m/s`, p / 1e-27, { scale: 1e-27 }),
        numQ('F', L('(b) the force of the light on the surface', '(b) die Kraft des Lichts auf die Fläche'), i('F'), Fu[0], F / Fu[1], { scale: Fu[1], wrong: [{ value: (2 * F) / Fu[1], tag: 'absorb', why: WHY.absorb() }] }),
        choice('cmp', L(`(c) Compared with this photon, a photon of wavelength ${other.nm} nm has`, `(c) Verglichen mit diesem Photon hat ein Photon der Wellenlänge ${other.nm} nm`), opts(r, [
          [L('more momentum', 'mehr Impuls'), more, L('p = h/λ: the longer the wavelength, the smaller the momentum.', 'p = h/λ: Je länger die Wellenlänge, desto kleiner der Impuls.'), 'inverse'],
          [L('less momentum', 'weniger Impuls'), !more, L('p = h/λ: the shorter the wavelength, the larger the momentum.', 'p = h/λ: Je kürzer die Wellenlänge, desto grösser der Impuls.'), 'inverse'],
          [L('the same momentum: none', 'denselben Impuls: keinen'), false, L('Photons have no mass, but they have momentum: p = h/λ = E/c.', 'Photonen haben keine Masse, aber Impuls: p = h/λ = E/c.'), 'mass'],
        ], true)),
      ],
      hints: [L(`The momentum of a photon: ${i('p')} = ${h}/${lam} = ${E}/${c}.`, `Der Impuls eines Photons: ${i('p')} = ${h}/${lam} = ${E}/${c}.`), L(`The force is the momentum delivered per second. Each second the light brings the energy ${i('P')}·1 s, and so the momentum ${i('P')}·1 s/${c}.`, `Die Kraft ist der Impuls, der pro Sekunde abgegeben wird. Pro Sekunde bringt das Licht die Energie ${i('P')}·1 s und damit den Impuls ${i('P')}·1 s/${c}.`), L(`Absorbed light: ${i('F')} = ${i('P')}/${c}.`, `Absorbiertes Licht: ${i('F')} = ${i('P')}/${c}.`)],
      solution: [
        L(`(a) ${i('p')} = ${h}/${lam} = 6.626 · 10<sup>−34</sup> J·s / (${nm} · 10<sup>−9</sup> m) = <b>${sci(p)} kg·m/s</b>.`, `(a) ${i('p')} = ${h}/${lam} = 6.626 · 10<sup>−34</sup> J·s / (${nm} · 10<sup>−9</sup> m) = <b>${sci(p)} kg·m/s</b>.`),
        L(`(b) ${i('N')} = ${i('P')}/${E} photons per second each give their momentum ${i('p')} = ${E}/${c}: ${i('F')} = ${i('N')}·${i('p')} = ${i('P')}/${c} = ${sci(Pw)} W / 3.00 · 10<sup>8</sup> m/s = <b>${sci(F)} N</b>. Tiny, but measurable.`, `(b) ${i('N')} = ${i('P')}/${E} Photonen pro Sekunde geben je ihren Impuls ${i('p')} = ${E}/${c} ab: ${i('F')} = ${i('N')}·${i('p')} = ${i('P')}/${c} = ${sci(Pw)} W / 3.00 · 10<sup>8</sup> m/s = <b>${sci(F)} N</b>. Winzig, aber messbar.`),
        L(`(c) ${i('p')} = ${h}/${lam}: at ${other.nm} nm, <b>${more ? 'more' : 'less'} momentum</b> (${sci(P.momentum(other.nm))} kg·m/s).`, `(c) ${i('p')} = ${h}/${lam}: bei ${other.nm} nm <b>${more ? 'mehr' : 'weniger'} Impuls</b> (${sci(P.momentum(other.nm))} kg·m/s).`),
      ],
      p: { nm, Pw, o: other.nm },
    };
  }

  const PLACES = [
    { en: 'near the Earth', de: 'in Erdnähe', I: 1360 },
    { en: 'near Venus', de: 'in der Nähe der Venus', I: 2600 },
    { en: 'near Mars', de: 'in der Nähe des Mars', I: 590 },
  ];
  function sail(seed) {
    const r = rng(seed * 71 + 37);
    const pl = r.pick(PLACES), A = r.step(100, 1000, 50), m = r.step(10, 200, 10), absorb = r.next() < 0.4, k = absorb ? 1 : 2;
    const F = (k * pl.I * A) / P.c, a = F / m;
    return {
      title: L('A solar sail', 'Ein Sonnensegel'),
      text: `<p>${L(`A space probe of mass ${m} kg has a sail of ${A} m², ${absorb ? 'black (it absorbs all the light)' : 'a mirror (it reflects all the light straight back)'}. ${cap(pl.en)} the sunlight brings ${pl.I} W per square metre; the sail faces the Sun.`, `Eine Raumsonde der Masse ${m} kg hat ein Segel von ${A} m², ${absorb ? 'schwarz (es absorbiert das ganze Licht)' : 'ein Spiegel (es reflektiert das ganze Licht gerade zurück)'}. ${cap(pl.de)} bringt das Sonnenlicht ${pl.I} W pro Quadratmeter; das Segel ist der Sonne zugewandt.`)}</p>${CONST()}`,
      figs: fig(G.sail({ absorb })),
      questions: [
        choice('k', L('(a) The force on the sail, compared with a black sail, is', '(a) Die Kraft auf das Segel ist, verglichen mit einem schwarzen Segel,'), opts(r, [
          [L('the same', 'gleich gross'), absorb, WHY.reflect(), 'reflect'],
          [L('twice as large', 'doppelt so gross'), !absorb, WHY.absorb(), 'absorb'],
          [L('half as large', 'halb so gross'), false, L('A mirror does not take up the light, but it turns its momentum round: that pushes harder.', 'Ein Spiegel nimmt das Licht nicht auf, aber er kehrt seinen Impuls um: Das drückt stärker.'), 'reflect'],
        ], true)),
        numQ('F', L('(b) the force on the sail', '(b) die Kraft auf das Segel'), i('F'), 'mN', F * 1e3, { scale: 1e-3, wrong: [{ value: ((3 - k) * pl.I * A) / P.c * 1e3, tag: absorb ? 'absorb' : 'reflect', why: absorb ? WHY.absorb() : WHY.reflect() }] }),
        numQ('a', L('(c) the acceleration of the probe', '(c) die Beschleunigung der Sonde'), i('a'), 'mm/s²', a * 1e3, { scale: 1e-3 }),
      ],
      hints: [L(`The light brings the power ${i('P')} = ${i('I')}·${i('A')} onto the sail.`, `Das Licht bringt die Leistung ${i('P')} = ${i('I')}·${i('A')} auf das Segel.`), L(`Absorbed: ${i('F')} = ${i('P')}/${c}. Reflected straight back: each photon’s momentum changes from +${i('p')} to −${i('p')}, so ${i('F')} = 2${i('P')}/${c}.`, `Absorbiert: ${i('F')} = ${i('P')}/${c}. Gerade zurückreflektiert: Der Impuls jedes Photons ändert sich von +${i('p')} zu −${i('p')}, also ${i('F')} = 2${i('P')}/${c}.`), L(`${i('a')} = ${i('F')}/${i('m')}.`, `${i('a')} = ${i('F')}/${i('m')}.`)],
      solution: [
        absorb ? L(`(a) The sail is black: <b>the same</b> as a black sail, ${i('F')} = ${i('P')}/${c}.`, `(a) Das Segel ist schwarz: <b>gleich gross</b> wie bei einem schwarzen Segel, ${i('F')} = ${i('P')}/${c}.`) : L(`(a) A mirror sends every photon back: its momentum changes by 2${i('p')}. The force is <b>twice as large</b>: ${i('F')} = 2${i('P')}/${c}.`, `(a) Ein Spiegel schickt jedes Photon zurück: Sein Impuls ändert sich um 2${i('p')}. Die Kraft ist <b>doppelt so gross</b>: ${i('F')} = 2${i('P')}/${c}.`),
        L(`(b) ${i('P')} = ${pl.I} W/m² · ${A} m² = ${sci(pl.I * A)} W, so ${i('F')} = ${k === 2 ? '2 · ' : ''}${sci(pl.I * A)} W / 3.00 · 10<sup>8</sup> m/s = <b>${plain(F * 1e3)} mN</b>.`, `(b) ${i('P')} = ${pl.I} W/m² · ${A} m² = ${sci(pl.I * A)} W, also ${i('F')} = ${k === 2 ? '2 · ' : ''}${sci(pl.I * A)} W / 3.00 · 10<sup>8</sup> m/s = <b>${plain(F * 1e3)} mN</b>.`),
        L(`(c) ${i('a')} = ${i('F')}/${i('m')} = ${sci(F)} N / ${m} kg = ${sci(a)} m/s² = <b>${plain(a * 1e3)} mm/s²</b>. Small, but it acts for months: after 100 days the probe is ${plain(a * 8.64e6)} m/s faster.`, `(c) ${i('a')} = ${i('F')}/${i('m')} = ${sci(F)} N / ${m} kg = ${sci(a)} m/s² = <b>${plain(a * 1e3)} mm/s²</b>. Klein, aber sie wirkt monatelang: Nach 100 Tagen ist die Sonde ${plain(a * 8.64e6)} m/s schneller.`),
      ],
      p: { pl: pl.I, A, m, absorb },
    };
  }

  // ---------------------------------------------------------------- X-rays
  function xray(seed) {
    const r = rng(seed * 73 + 41);
    const U = r.step(15, 120, 5), lm = P.lambdaMin(U * 1e3), an = r.pick(P.ANODES);
    return {
      title: L('The X-ray tube', 'Die Röntgenröhre'),
      text: `<p>${L(`In an X-ray tube, electrons are accelerated through ${U} kV and stopped in a ${an.en} anode. Some electrons give all their energy to a single photon.`, `In einer Röntgenröhre werden Elektronen mit ${U} kV beschleunigt und in einer Anode aus ${an.de} abgebremst. Einige Elektronen geben ihre ganze Energie an ein einziges Photon ab.`)}</p>${CONST()}`,
      figs: fig(G.xray([{ U, anode: an, cls: 'new' }], { max: Math.max(100, Math.ceil((an.ka * 1.25) / 20) * 20), marks: [{ at: lm, label: '<tspan font-style="italic">λ</tspan><tspan font-size="72%" dy="4">min</tspan><tspan dy="-4">​</tspan>' }] })),
      questions: [
        numQ('E', L('(a) the largest photon energy', '(a) die grösste Photonenenergie'), `${E}${sb('max')}`, 'keV', U, { tol: 0.01 }),
        numQ('lm', L('(b) the shortest wavelength', '(b) die kürzeste Wellenlänge'), `${lam}${sb('min')}`, 'pm', lm, { tol: 0.015, wrong: [{ value: (U * 1e3) / HC, tag: 'inverse', why: WHY.inverse() }] }),
        choice('lines', L(`(c) The voltage is raised to ${U + 20} kV. The characteristic lines of the ${an.en} anode`, `(c) Die Spannung wird auf ${U + 20} kV erhöht. Die charakteristischen Linien der Anode aus ${an.de}`), opts(r, [
          [L('stay where they are', 'bleiben, wo sie sind'), true, '', null],
          [L('move to shorter wavelengths', 'verschieben sich zu kürzeren Wellenlängen'), false, L('The lines belong to the anode atoms: jumps between their inner shells. Only the cut-off moves with the voltage.', 'Die Linien gehören zu den Atomen der Anode: Übergänge zwischen ihren inneren Schalen. Nur die Grenzwellenlänge verschiebt sich mit der Spannung.'), 'lines'],
          [L('move to longer wavelengths', 'verschieben sich zu längeren Wellenlängen'), false, L('The lines belong to the anode atoms: they do not depend on the voltage.', 'Die Linien gehören zu den Atomen der Anode: Sie hängen nicht von der Spannung ab.'), 'lines'],
        ])),
      ],
      hints: [L(`An electron accelerated through ${i('U')} has the kinetic energy ${i('e')}·${i('U')}: ${U} kV gives ${U} keV.`, `Ein Elektron, das mit ${i('U')} beschleunigt wird, hat die kinetische Energie ${i('e')}·${i('U')}: ${U} kV ergeben ${U} keV.`), L(`The most energetic photon has the shortest wavelength: ${i('e')}·${i('U')} = ${h}·${c}/${lam}${sb('min')}.`, `Das energiereichste Photon hat die kürzeste Wellenlänge: ${i('e')}·${i('U')} = ${h}·${c}/${lam}${sb('min')}.`), L('h·c = 1240 eV·nm = 1240 keV·pm.', 'h·c = 1240 eV·nm = 1240 keV·pm.')],
      solution: [
        L(`(a) An electron gets ${i('e')}·${i('U')} = <b>${U} keV</b>; a photon can take at most all of it.`, `(a) Ein Elektron erhält ${i('e')}·${i('U')} = <b>${U} keV</b>; ein Photon kann höchstens alles davon übernehmen.`),
        L(`(b) ${lam}${sb('min')} = ${h}·${c}/(${i('e')}·${i('U')}) = 1240 keV·pm / ${U} keV = <b>${plain(lm)} pm</b>. Below this wavelength, the spectrum is dark (Duane–Hunt).`, `(b) ${lam}${sb('min')} = ${h}·${c}/(${i('e')}·${i('U')}) = 1240 keV·pm / ${U} keV = <b>${plain(lm)} pm</b>. Unterhalb dieser Wellenlänge ist das Spektrum dunkel (Duane–Hunt).`),
        L(`(c) The lines <b>stay where they are</b>: they come from jumps between the inner shells of the anode atoms. At ${U + 20} kV the cut-off moves to ${plain(P.lambdaMin((U + 20) * 1e3))} pm.`, `(c) Die Linien <b>bleiben, wo sie sind</b>: Sie stammen von Übergängen zwischen den inneren Schalen der Anodenatome. Bei ${U + 20} kV rückt die Grenzwellenlänge auf ${plain(P.lambdaMin((U + 20) * 1e3))} pm.`),
      ],
      solFig: fig(G.xray([{ U, anode: an, cls: 'old', dash: true }, { U: U + 20, anode: an, cls: 'new' }], { max: Math.max(100, Math.ceil((an.ka * 1.25) / 20) * 20) })),
      p: { U, an: an.id },
    };
  }

  // Reading a spectrum: the voltage from the cut-off, the anode from its lines.
  function xrayRead(seed) {
    const r = rng(seed * 79 + 43);
    for (;;) {
      const an = r.pick(P.ANODES), lm = r.pick([20, 25, 30, 35, 40, 45, 50]), U = HC / lm;
      if (U < an.edge + 4 || lm > an.kb - 8) continue;
      const max = an.id === 'cu' ? 200 : 100;
      const tableA = `<table class="data"><tr><th>${L('anode', 'Anode')}</th>${P.ANODES.map((a) => `<td>${nameOf(a)}</td>`).join('')}</tr><tr><th>K${sb('α')}</th>${P.ANODES.map((a) => `<td>${a.ka} pm</td>`).join('')}</tr><tr><th>K${sb('β')}</th>${P.ANODES.map((a) => `<td>${a.kb} pm</td>`).join('')}</tr></table>`;
      return {
        title: L('Reading an X-ray spectrum', 'Ein Röntgenspektrum lesen'),
        text: `<p>${L('The spectrum of an X-ray tube: a continuous part (bremsstrahlung) and two sharp lines. The table lists the lines of three anode materials.', 'Das Spektrum einer Röntgenröhre: ein kontinuierlicher Teil (Bremsstrahlung) und zwei scharfe Linien. Die Tabelle nennt die Linien dreier Anodenmaterialien.')}</p>${tableA}`,
        figs: fig(G.xray([{ U, anode: an, cls: 'new' }], { max })),
        questions: [
          numQ('lm', L('(a) the shortest wavelength, read off', '(a) die kürzeste Wellenlänge, abgelesen'), `${lam}${sb('min')}`, 'pm', lm, { tol: 0.01, abs: 2.5 }),
          numQ('U', L('(b) the voltage of the tube', '(b) die Spannung der Röhre'), i('U'), 'kV', U, { tol: 0.1, wrong: [{ value: lm / 1240 * 1e3, tag: 'inverse', why: WHY.inverse() }] }),
          choice('an', L('(c) The anode is made of', '(c) Die Anode besteht aus'), opts(r, P.ANODES.map((a) => [nameOf(a), a === an, L('Compare the positions of the two peaks with the table.', 'Vergleiche die Lage der beiden Spitzen mit der Tabelle.'), 'cutoff']), true)),
        ],
        hints: [L('Below the shortest wavelength the intensity is zero: find where the curve starts.', 'Unterhalb der kürzesten Wellenlänge ist die Intensität null: Suche, wo die Kurve beginnt.'), L(`${i('e')}·${i('U')} = ${h}·${c}/${lam}${sb('min')}, with ${h}·${c} = 1240 keV·pm.`, `${i('e')}·${i('U')} = ${h}·${c}/${lam}${sb('min')}, mit ${h}·${c} = 1240 keV·pm.`), L('The lines belong to the anode, not to the voltage.', 'Die Linien gehören zur Anode, nicht zur Spannung.')],
        solution: [
          L(`(a) The curve starts at ${lam}${sb('min')} = <b>${lm} pm</b>.`, `(a) Die Kurve beginnt bei ${lam}${sb('min')} = <b>${lm} pm</b>.`),
          L(`(b) ${i('e')}·${i('U')} = ${h}·${c}/${lam}${sb('min')} = 1240 keV·pm / ${lm} pm = ${plain(U)} keV, so ${i('U')} = <b>${plain(U)} kV</b>.`, `(b) ${i('e')}·${i('U')} = ${h}·${c}/${lam}${sb('min')} = 1240 keV·pm / ${lm} pm = ${plain(U)} keV, also ${i('U')} = <b>${plain(U)} kV</b>.`),
          L(`(c) The peaks are at ${an.kb} pm and ${an.ka} pm: <b>${an.en}</b>.`, `(c) Die Spitzen liegen bei ${an.kb} pm und ${an.ka} pm: <b>${an.de}</b>.`),
        ],
        solFig: fig(G.xray([{ U, anode: an, cls: 'new' }], { max, marks: [{ at: lm, label: `${lm}` }, { at: an.kb, label: `${an.kb}` }, { at: an.ka, label: `${an.ka}` }] })),
        p: { an: an.id, lm },
      };
    }
  }

  // Which spectrum after a change of the voltage (or of the anode)?
  function xrayChange(seed) {
    const r = rng(seed * 83 + 47);
    const an = r.pick(P.ANODES.filter((a) => a.id !== 'cu')), other = P.ANODES.find((a) => a.id === 'ag' && an.id !== 'ag') || P.ANODES.find((a) => a.id === 'mo');
    const U = r.pick([35, 40, 45]), ch = r.pick(['up', 'down', 'anode']), max = 100;
    const after = { up: { U: U + 15, anode: an }, down: { U: U - 8, anode: an }, anode: { U, anode: other } }[ch];
    const lie = (x, k) => ({ ...x, anode: { ...x.anode, ka: x.anode.ka * k, kb: x.anode.kb * k } });
    const cands = {
      up: [after, lie(after, 0.85), { U: U - 8, anode: an }, { U, anode: other }],
      down: [after, lie(after, 1.12), { U: U + 15, anode: an }, { U, anode: other }],
      anode: [after, { U: U + 15, anode: an }, { U: U + 15, anode: other }, lie({ U, anode: an }, 0.88)],
    }[ch];
    const why = {
      up: [null, [L('The lines belong to the anode atoms: they stay where they are.', 'Die Linien gehören zu den Atomen der Anode: Sie bleiben, wo sie sind.'), 'lines'], [L('A higher voltage gives more energetic photons: the cut-off moves to shorter wavelengths.', 'Eine höhere Spannung ergibt energiereichere Photonen: Die Grenzwellenlänge rückt zu kürzeren Wellenlängen.'), 'inverse'], [L('The anode is the same: its lines stay.', 'Die Anode ist dieselbe: Ihre Linien bleiben.'), 'lines']],
      down: [null, [L('The lines belong to the anode atoms: they stay where they are.', 'Die Linien gehören zu den Atomen der Anode: Sie bleiben, wo sie sind.'), 'lines'], [L('A lower voltage gives less energetic photons: the cut-off moves to longer wavelengths.', 'Eine tiefere Spannung ergibt weniger energiereiche Photonen: Die Grenzwellenlänge rückt zu längeren Wellenlängen.'), 'inverse'], [L('The anode is the same: its lines stay.', 'Die Anode ist dieselbe: Ihre Linien bleiben.'), 'lines']],
      anode: [null, [L('The voltage is the same: the cut-off stays. The new anode has its own lines.', 'Die Spannung ist dieselbe: Die Grenzwellenlänge bleibt. Die neue Anode hat ihre eigenen Linien.'), 'cutoff'], [L('The cut-off depends only on the voltage, not on the anode.', 'Die Grenzwellenlänge hängt nur von der Spannung ab, nicht von der Anode.'), 'cutoff'], [L('These lines are not those of the new anode: look them up.', 'Das sind nicht die Linien der neuen Anode: Schlag sie nach.'), 'lines']],
    }[ch];
    const options = r.shuffle(cands.map((s, k) => ({ html: G.xray([{ U, anode: an, cls: 'old', dash: true }, { ...s, cls: 'new' }], { max, small: true, w: 260, h: 170 }), ok: k === 0, why: k ? why[k][0] : '', tag: k ? why[k][1] : undefined })));
    const what = {
      up: L(`The voltage is raised from ${U} kV to ${U + 15} kV.`, `Die Spannung wird von ${U} kV auf ${U + 15} kV erhöht.`),
      down: L(`The voltage is lowered from ${U} kV to ${U - 8} kV.`, `Die Spannung wird von ${U} kV auf ${U - 8} kV gesenkt.`),
      anode: L(`The ${an.en} anode is replaced by one of ${other.en} (K${sb('α')} ${other.ka} pm, K${sb('β')} ${other.kb} pm); the voltage stays at ${U} kV.`, `Die Anode aus ${an.de} wird durch eine aus ${other.de} ersetzt (K${sb('α')} ${other.ka} pm, K${sb('β')} ${other.kb} pm); die Spannung bleibt bei ${U} kV.`),
    }[ch];
    return {
      title: L('A different spectrum', 'Ein anderes Spektrum'),
      text: `<p>${L(`An X-ray tube with a ${an.en} anode runs at ${U} kV: the spectrum below, dashed in the graphs to choose from. ${what}`, `Eine Röntgenröhre mit einer Anode aus ${an.de} läuft bei ${U} kV: das Spektrum unten, gestrichelt in den Graphen zur Auswahl. ${what}`)}</p>`,
      figs: fig(G.xray([{ U, anode: an, cls: 'new' }], { max })),
      questions: [pick('s', L('Which graph shows the new spectrum (solid)?', 'Welcher Graph zeigt das neue Spektrum (ausgezogen)?'), options)],
      hints: [L(`The cut-off: ${lam}${sb('min')} = ${h}·${c}/(${i('e')}·${i('U')}) depends only on the voltage.`, `Die Grenzwellenlänge: ${lam}${sb('min')} = ${h}·${c}/(${i('e')}·${i('U')}) hängt nur von der Spannung ab.`), L('The characteristic lines depend only on the anode material.', 'Die charakteristischen Linien hängen nur vom Anodenmaterial ab.')],
      solution: [
        ch === 'anode' ? L(`The voltage stays, so the cut-off stays at ${plain(P.lambdaMin(U * 1e3))} pm; the lines are now those of ${other.en}, at ${other.kb} pm and ${other.ka} pm.`, `Die Spannung bleibt, also bleibt die Grenzwellenlänge bei ${plain(P.lambdaMin(U * 1e3))} pm; die Linien sind jetzt jene von ${other.de}, bei ${other.kb} pm und ${other.ka} pm.`)
          : L(`The cut-off moves from ${plain(P.lambdaMin(U * 1e3))} pm to ${plain(P.lambdaMin(after.U * 1e3))} pm (${lam}${sb('min')} = 1240 keV·pm / ${i('e')}${i('U')}); the lines of ${an.en} stay where they are. ${ch === 'up' ? 'With faster electrons, the whole spectrum is brighter as well.' : 'With slower electrons, the whole spectrum is weaker as well.'}`, `Die Grenzwellenlänge rückt von ${plain(P.lambdaMin(U * 1e3))} pm auf ${plain(P.lambdaMin(after.U * 1e3))} pm (${lam}${sb('min')} = 1240 keV·pm / ${i('e')}${i('U')}); die Linien von ${an.de} bleiben, wo sie sind. ${ch === 'up' ? 'Mit schnelleren Elektronen wird auch das ganze Spektrum heller.' : 'Mit langsameren Elektronen wird auch das ganze Spektrum schwächer.'}`),
      ],
      solFig: fig(G.xray([{ U, anode: an, cls: 'old', dash: true }, { ...after, cls: 'new' }], { max })),
      p: { an: an.id, U, ch },
    };
  }

  // ---------------------------------------------------------------- the Compton effect
  const XLINES = [
    { en: 'Mo-Kα X-rays', de: 'Mo-Kα-Röntgenstrahlung', pm: 71 },
    { en: 'Cu-Kα X-rays', de: 'Cu-Kα-Röntgenstrahlung', pm: 154 },
    { en: 'Ag-Kα X-rays', de: 'Ag-Kα-Röntgenstrahlung', pm: 56 },
    { en: 'hard X-rays', de: 'harte Röntgenstrahlung', pm: 20 },
    { en: 'gamma rays', de: 'Gammastrahlung', pm: 5 },
  ];
  function compton(seed) {
    const r = rng(seed * 89 + 53);
    const src = r.pick(XLINES), th = r.pick([30, 45, 60, 90, 120, 135, 150, 180]), dl = P.compton(th), l2 = src.pm + dl;
    const Ein = HC / src.pm, Eout = HC / l2, Ee = Ein - Eout; // keV (λ in pm)
    const withE = dl / src.pm >= 0.02; // else the difference of two nearly equal energies
    return {
      title: L('The Compton effect', 'Der Comptoneffekt'),
      text: `<p>${L(`${src.en} (${lam} = ${src.pm} pm) are scattered by electrons that are practically free and at rest. A detector catches the photons scattered by ${i('θ')} = ${th}°.`, `${src.de} (${lam} = ${src.pm} pm) wird an Elektronen gestreut, die praktisch frei sind und ruhen. Ein Detektor fängt die Photonen auf, die um ${i('θ')} = ${th}° gestreut werden.`)}</p><p class="consts">${lam}${sb('C')} = ${h}/(${i('m')}${sb('e')}·${c}) = 2.43 pm</p>`,
      figs: fig(G.scatter(th)),
      questions: [
        numQ('dl', L('(a) the change of the wavelength', '(a) die Änderung der Wellenlänge'), `Δ${lam}`, 'pm', dl, { tol: 0.015, wrong: [{ value: LC * Math.sin((th * Math.PI) / 180), tag: 'formula', why: WHY.sinC() }] }),
        numQ('l2', L('(b) the wavelength of the scattered photons', '(b) die Wellenlänge der gestreuten Photonen'), `${lam}′`, 'pm', l2, { tol: 0.005, wrong: [{ value: src.pm - dl, tag: 'shorter', why: WHY.shorter() }] }),
        numQ('E2', L('(c) the energy of the scattered photons', '(c) die Energie der gestreuten Photonen'), `${E}′`, 'keV', Eout, { tol: 0.01 }),
        ...(withE ? [numQ('Ee', L('(d) the kinetic energy of the electron', '(d) die kinetische Energie des Elektrons'), Ek, 'keV', Ee, { tol: 0.04 })] : []),
      ],
      hints: [L(`Compton: Δ${lam} = ${lam}′ − ${lam} = ${lam}${sb('C')}·(1 − cos ${i('θ')}).`, `Compton: Δ${lam} = ${lam}′ − ${lam} = ${lam}${sb('C')}·(1 − cos ${i('θ')}).`), L('The photon loses energy: its wavelength gets longer.', 'Das Photon verliert Energie: Seine Wellenlänge wird länger.'), L(`${E}′ = ${h}·${c}/${lam}′ with ${h}·${c} = 1240 keV·pm. Energy is conserved: the electron gets what the photon lost.`, `${E}′ = ${h}·${c}/${lam}′ mit ${h}·${c} = 1240 keV·pm. Die Energie bleibt erhalten: Das Elektron erhält, was das Photon verloren hat.`)],
      solution: [
        L(`(a) Δ${lam} = 2.43 pm · (1 − cos ${th}°) = 2.43 pm · ${plain(1 - Math.cos((th * Math.PI) / 180))} = <b>${plain(dl)} pm</b>.`, `(a) Δ${lam} = 2.43 pm · (1 − cos ${th}°) = 2.43 pm · ${plain(1 - Math.cos((th * Math.PI) / 180))} = <b>${plain(dl)} pm</b>.`),
        L(`(b) ${lam}′ = ${lam} + Δ${lam} = ${src.pm} pm + ${plain(dl)} pm = <b>${plain(l2, 4)} pm</b>.`, `(b) ${lam}′ = ${lam} + Δ${lam} = ${src.pm} pm + ${plain(dl)} pm = <b>${plain(l2, 4)} pm</b>.`),
        L(`(c) ${E}′ = ${h}·${c}/${lam}′ = 1240 keV·pm / ${plain(l2, 4)} pm = <b>${plain(Eout)} keV</b> (before: ${plain(Ein)} keV).`, `(c) ${E}′ = ${h}·${c}/${lam}′ = 1240 keV·pm / ${plain(l2, 4)} pm = <b>${plain(Eout)} keV</b> (vorher: ${plain(Ein)} keV).`),
        withE ? L(`(d) The electron gets the difference: ${plain(Ein, 4)} keV − ${plain(Eout, 4)} keV = <b>${plain(Ee)} keV</b>.`, `(d) Das Elektron erhält die Differenz: ${plain(Ein, 4)} keV − ${plain(Eout, 4)} keV = <b>${plain(Ee)} keV</b>.`) : '',
      ].filter(Boolean),
      p: { pm: src.pm, th },
    };
  }

  function comptonCompare(seed) {
    const r = rng(seed * 97 + 59);
    const angles = r.shuffle([0, 30, 45, 60, 90, 120, 150, 180]).slice(0, 4).sort((a, b) => a - b);
    const top = angles[3], src = r.pick(XLINES.slice(0, 3)), th = r.pick([60, 90, 120]);
    const ang = (a) => `${a}°`;
    return {
      title: L('Comparing Compton shifts', 'Compton-Verschiebungen vergleichen'),
      text: `<p>${L(`Photons are scattered by free electrons at rest: Δ${lam} = ${lam}${sb('C')}·(1 − cos ${i('θ')}), ${lam}${sb('C')} = 2.43 pm.`, `Photonen werden an freien, ruhenden Elektronen gestreut: Δ${lam} = ${lam}${sb('C')}·(1 − cos ${i('θ')}), ${lam}${sb('C')} = 2.43 pm.`)}</p>`,
      figs: fig(G.scatter(th)),
      questions: [
        choice('ang', L('(a) At which scattering angle is the change of wavelength largest?', '(a) Bei welchem Streuwinkel ist die Änderung der Wellenlänge am grössten?'), opts(r, angles.map((a) => [ang(a), a === top, a === 90 ? L('1 − cos θ keeps growing beyond 90°: it is largest for a photon scattered straight back.', '1 − cos θ wächst über 90° hinaus weiter: Am grössten ist sie für ein gerade zurückgestreutes Photon.') : L('1 − cos θ grows with the angle, up to 180°.', '1 − cos θ wächst mit dem Winkel, bis 180°.'), 'angle']), true)),
        choice('lam', L(`(b) ${src.en} (${src.pm} pm) and gamma rays (5 pm) are scattered by ${th}°. The change of wavelength Δλ is`, `(b) ${src.de} (${src.pm} pm) und Gammastrahlung (5 pm) werden um ${th}° gestreut. Die Änderung der Wellenlänge Δλ ist`), opts(r, [
          [L('the same for both', 'für beide gleich'), true, '', null],
          [L('larger for the X-rays', 'grösser für die Röntgenstrahlung'), false, L('Δλ = λ_C·(1 − cos θ) does not depend on the wavelength.', 'Δλ = λ_C·(1 − cos θ) hängt nicht von der Wellenlänge ab.'), 'lambda'],
          [L('larger for the gamma rays', 'grösser für die Gammastrahlung'), false, L('Δλ = λ_C·(1 − cos θ) does not depend on the wavelength.', 'Δλ = λ_C·(1 − cos θ) hängt nicht von der Wellenlänge ab.'), 'lambda'],
        ])),
        choice('rel', L('(c) Which photons lose the larger fraction of their energy?', '(c) Welche Photonen verlieren den grösseren Teil ihrer Energie?'), opts(r, [
          [L('the gamma photons', 'die Gammaphotonen'), true, '', null],
          [L(`the X-ray photons`, 'die Röntgenphotonen'), false, L('The same Δλ is a larger part of a short wavelength.', 'Dasselbe Δλ ist ein grösserer Teil einer kurzen Wellenlänge.'), 'lambda'],
          [L('both the same fraction', 'beide denselben Teil'), false, L('The same Δλ is a larger part of a short wavelength.', 'Dasselbe Δλ ist ein grösserer Teil einer kurzen Wellenlänge.'), 'lambda'],
        ])),
      ],
      hints: [L('cos θ goes from 1 at 0° to −1 at 180°.', 'cos θ geht von 1 bei 0° bis −1 bei 180°.'), L('In the formula for Δλ, the wavelength itself does not appear.', 'In der Formel für Δλ kommt die Wellenlänge selbst nicht vor.'), L('Compare Δλ with λ: the energy is h·c/λ.', 'Vergleiche Δλ mit λ: Die Energie ist h·c/λ.')],
      solution: [
        L(`(a) 1 − cos θ is largest for the largest angle: <b>${ang(top)}</b> (Δλ = ${plain(P.compton(top) || 0)} pm)${top === 180 ? ', a photon scattered straight back' : ''}.`, `(a) 1 − cos θ ist für den grössten Winkel am grössten: <b>${ang(top)}</b> (Δλ = ${plain(P.compton(top) || 0)} pm)${top === 180 ? ', ein gerade zurückgestreutes Photon' : ''}.`),
        L(`(b) Δλ = 2.43 pm · (1 − cos ${th}°) = ${plain(P.compton(th))} pm: <b>the same for both</b>.`, `(b) Δλ = 2.43 pm · (1 − cos ${th}°) = ${plain(P.compton(th))} pm: <b>für beide gleich</b>.`),
        L(`(c) For the gamma rays, ${plain(P.compton(th))} pm is ${plain((100 * P.compton(th)) / 5, 2)} % of 5 pm; for the X-rays only ${plain((100 * P.compton(th)) / src.pm, 2)} % of ${src.pm} pm. The <b>gamma photons</b> lose the larger fraction of their energy. For visible light (500 nm) the shift is far too small to notice: that is why the Compton effect needs X-rays or gamma rays.`, `(c) Bei der Gammastrahlung sind ${plain(P.compton(th))} pm ${plain((100 * P.compton(th)) / 5, 2)} % von 5 pm; bei der Röntgenstrahlung nur ${plain((100 * P.compton(th)) / src.pm, 2)} % von ${src.pm} pm. Die <b>Gammaphotonen</b> verlieren den grösseren Teil ihrer Energie. Bei sichtbarem Licht (500 nm) ist die Verschiebung viel zu klein, um sie zu bemerken: Deshalb braucht der Comptoneffekt Röntgen- oder Gammastrahlung.`),
      ],
      p: { angles, src: src.pm, th },
    };
  }

  // ---------------------------------------------------------------- all types
  const TYPES = {
    energy: [1, energy], wavelength: [2, wavelength], count: [2, count], rank: [2, rank],
    'photo-calc': [2, photoCalc], 'photo-stmts': [2, photoStmts], 'photo-curve': [3, photoCurve], 'photo-graph': [4, photoGraph],
    momentum: [2, momentum], sail: [3, sail],
    xray: [2, xray], 'xray-read': [3, xrayRead], 'xray-change': [3, xrayChange],
    compton: [3, compton], 'compton-compare': [2, comptonCompare],
  };
  function make(type, seed) {
    const [difficulty, fn] = TYPES[type];
    return { ...fn(seed), type, difficulty, id: `${type}-${seed}`, seed };
  }

  const api = { TYPES: Object.keys(TYPES), make, BANK, WHY, fit, HG, SOURCES, XLINES, i, sb, CONST, numQ, choice, pick, opts, fig };
  root.PhotonEx = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
