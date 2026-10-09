// The questions of the arcade (see arcade.js, shared by the apps): each asks for one answer of an
// exercise, with four options (see quiz() in generator.js): a region of the spectrum, a direction
// of a field, an idea, or a number.
(function (root) {
  'use strict';

  const EW = root.EW, { practiceOf, quiz, SCENARIOS } = root.EWaves;
  const L = (en, de) => EW.L(en, de);

  // The idea behind each wrong-answer flag.
  const concept = {
    inv: 'clf', ninv: 'medium', region: 'spectrum', echo: 'echo',
    mult: 'medium', same: 'medium',
    nopi: 'thomson', nosqrt: 'thomson', twopi: 'thomson', root: 'thomson', dirn: 'thomson', prop: 'thomson',
    nohalfW: 'lcenergy', invLC: 'lcenergy', rootI: 'lcenergy', lcphase: 'lcenergy',
    perp: 'dirs', hand: 'dirs', transverse: 'dirs',
    einv: 'ecb', ratio: 'ecb', phase: 'ecb', phaseother: 'ecb',
    circle: 'spread', lin: 'spread', linR: 'spread', field: 'spread', diam: 'spread',
    nohalfI: 'intensity', rootE: 'intensity',
    nohalfP: 'malus', cos1: 'malus', sin2: 'malus', noroot: 'malus', same3: 'malus', zero: 'malus', pol: 'malus',
    full: 'antenna', other: 'antenna', dipole: 'antenna', source: 'antenna',
    halfS: 'standing', count: 'standing',
    vacuum: 'vacuum', speed: 'vacuum',
  };
  const concepts = () => ({
    clf: L('c = λ·f: λ and f mixed up', 'c = λ·f: λ und f verwechselt'),
    spectrum: L('the order of the spectrum', 'die Reihenfolge des Spektrums'),
    echo: L('an echo travels there and back', 'ein Echo läuft hin und zurück'),
    medium: L('in matter: f stays, v = c/n and λ shrink', 'in Materie: f bleibt, v = c/n und λ werden kleiner'),
    thomson: L('Thomson: T = 2π√(LC)', 'Thomson: T = 2π√(LC)'),
    lcenergy: L('the energy in the LC circuit', 'die Energie im Schwingkreis'),
    dirs: L('E, B and c perpendicular, as a right-handed set', 'E, B und c senkrecht, als Rechtssystem'),
    ecb: L('E = c·B, in phase', 'E = c·B, in Phase'),
    spread: L('spreading over a sphere: I ∝ 1/r²', 'Verteilung auf eine Kugel: I ∝ 1/r²'),
    intensity: L('I = ½ ε₀ c Ê²', 'I = ½ ε₀ c Ê²'),
    malus: L('polarizers: ½, then cos²', 'Polarisationsfilter: ½, dann cos²'),
    antenna: L('antennas: λ/2 and λ/4, accelerated charges', 'Antennen: λ/2 und λ/4, beschleunigte Ladungen'),
    standing: L('standing waves: nodes λ/2 apart', 'stehende Wellen: Knoten im Abstand λ/2'),
    vacuum: L('all electromagnetic waves travel at c, also in vacuum', 'alle elektromagnetischen Wellen laufen mit c, auch im Vakuum'),
  });

  // the exercise types of the arcade: all of them
  const KINDS = SCENARIOS.map((s) => s.id);
  const plain = (s) => s.replace(/<[^>]*>/g, '').replace(/:$/, '');

  function question(kind, seed) {
    const ex = practiceOf(kind, seed), qz = quiz(ex, seed), f = qz.field;
    const ask = f.type === 'num' ? L(`Find the ${plain(f.what)} $${f.sym}$.`, `Wie gross ist $${f.sym}$ (${plain(f.what)})?`) : f.ask || f.what;
    return {
      title: ex.title,
      text: kind === 'concept' ? '' : ex.text,
      figure: ex.figure({ task: true }),
      ask,
      pics: !!f.pics,
      options: qz.options.map((o) => ({ html: o.html, correct: !!o.correct, flag: o.flag, why: o.why })),
      explain: () => `<div class="figs">${ex.solutionFigure() || ''}</div><div class="steps">${ex.solution.join('')}</div>`,
    };
  }

  root.ArcadeSource = {
    id: 'emw',
    kinds: KINDS.map((id) => ({ id, difficulty: SCENARIOS.find((s) => s.id === id).difficulty })),
    question,
    concept,
    concepts,
    intro: () => ({
      tag: L('Answer as many questions as you can in <b>5 minutes</b>: four answers each.', 'Beantworte in <b>5 Minuten</b> so viele Fragen wie möglich: je vier Antworten.'),
      rule: L('Questions get harder as you go: the spectrum, LC circuits, the fields of the wave, intensity, polarizers and antennas. Choose one of four answers, or press 1–4.',
        'Die Fragen werden nach und nach schwieriger: das Spektrum, Schwingkreise, die Felder der Welle, Intensität, Polarisationsfilter und Antennen. Wähle eine von vier Antworten oder drücke 1–4.'),
      example: L('mixing up λ and f', 'λ und f zu verwechseln'),
    }),
    // a wave with its fields, and its law
    hero: () => `${root.Figures.wave3d()}<p class="ar-law">$c = \\lambda\\cdot f$</p>`,
  };
})(window);
