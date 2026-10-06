(function () {
  'use strict';

  const { T, FLUX, SHAPE, generate, ofDifficulty, diagnose, correlation, flux, volt, curved } = window.Induction;
  const { fluxGraph, voltGraph, num, dec, Tut, V_MAX, PHI_MAX } = window.Plot;
  const Lang = window.Lang, Arcade = window.Arcade, L = Lang.L;
  const $ = (sel) => document.querySelector(sel);
  const MAX_TRIES = 3;

  // ---------------------------------------------------------------- interface texts
  const UI = {
    en: {
      title: 'Induction Matching', mode: 'Mode', difficulty: 'Difficulty', example: 'Example',
      tutor: 'Tutor', practice: 'Practice', arcade: 'Arcade', new: 'New exercise',
      tutorNote: 'Use the arrow keys ← → to step through. The part of the graph a step is about is <span class="k-band">highlighted</span> in both graphs; short lines are tangents (the slope at that point), and triangles show the change of <i>Φ</i> over a time span.',
      task: 'Flux and induced voltage',
      taskText: 'The graphs A–D show the magnetic flux <i>Φ</i> through a conducting loop, and the graphs 1–4 the voltage <i>V</i><sub>ind</sub> induced in it, in a different order. Find the matching pairs: click a flux graph, then the voltage graph that belongs to it. Click a pair again to undo it.',
      fluxH: 'Magnetic flux', voltH: 'Induced voltage', fluxG: 'Flux graph', voltG: 'Voltage graph',
      paired: (p) => `, paired with ${p}`, right: ', correct', wrong: ', wrong',
      check: 'Check', reveal: 'Show solution', hints: 'Hints', solution: 'Solution',
      revealNote: 'The solution unlocks once you have solved the exercise, used all hints or made three attempts.',
      levels: { easy: 'Easy', medium: 'Medium', hard: 'Hard', mixed: 'Mixed' },
      stars: (d) => `Difficulty: ${d} of 5`,
      score: (s, c) => `Solved: ${s} · first try without hints: ${c}`,
      hint: (n) => `Hint (${n} left)`, noHints: 'No more hints', unlocks: (n) => `Unlocks after all hints or ${n} attempts`,
      choose: 'Pair every flux graph with a voltage graph, then check again.',
      ok: 'All pairs correct, well done!',
      some: (r, n, k) => `${r} of ${n} pairs are correct (attempt ${k}).`,
      canReveal: ' You can take a hint or look at the solution.', tryAgain: ' Change the wrong pairs and check again, or take a hint.',
      shown: 'The graphs now show the correct pairs.',
    },
    de: {
      title: 'Induktion zuordnen', mode: 'Modus', difficulty: 'Schwierigkeit', example: 'Beispiel',
      tutor: 'Tutor', practice: 'Üben', arcade: 'Arcade', new: 'Neue Aufgabe',
      tutorNote: 'Mit den Pfeiltasten ← → blätterst du weiter. Der Teil des Graphen, um den es in einem Schritt geht, ist in beiden Graphen <span class="k-band">hervorgehoben</span>; kurze Linien sind Tangenten (die Steigung an dieser Stelle), und Dreiecke zeigen die Änderung von <i>Φ</i> in einer Zeitspanne.',
      task: 'Fluss und induzierte Spannung',
      taskText: 'Die Graphen A–D zeigen den magnetischen Fluss <i>Φ</i> durch eine Leiterschleife, die Graphen 1–4 in anderer Reihenfolge die darin induzierte Spannung <i>U</i><sub>ind</sub>. Finde die zusammengehörenden Paare: Klicke einen Flussgraphen an, dann den Spannungsgraphen, der dazu gehört. Klicke ein Paar nochmals an, um es aufzulösen.',
      fluxH: 'Magnetischer Fluss', voltH: 'Induzierte Spannung', fluxG: 'Flussgraph', voltG: 'Spannungsgraph',
      paired: (p) => `, gepaart mit ${p}`, right: ', richtig', wrong: ', falsch',
      check: 'Prüfen', reveal: 'Lösung zeigen', hints: 'Tipps', solution: 'Lösung',
      revealNote: 'Die Lösung wird freigeschaltet, sobald du die Aufgabe gelöst, alle Tipps genutzt oder drei Versuche gemacht hast.',
      levels: { easy: 'Einfach', medium: 'Mittel', hard: 'Schwierig', mixed: 'Gemischt' },
      stars: (d) => `Schwierigkeit: ${d} von 5`,
      score: (s, c) => `Gelöst: ${s} · beim ersten Versuch ohne Tipps: ${c}`,
      hint: (n) => `Tipp (${n} übrig)`, noHints: 'Keine Tipps mehr', unlocks: (n) => `Wird nach allen Tipps oder ${n} Versuchen freigeschaltet`,
      choose: 'Ordne jedem Flussgraphen einen Spannungsgraphen zu und prüfe dann nochmals.',
      ok: 'Alle Paare richtig, gut gemacht!',
      some: (r, n, k) => `${r} von ${n} Paaren sind richtig (Versuch ${k}).`,
      canReveal: ' Du kannst einen Tipp nehmen oder die Lösung anschauen.', tryAgain: ' Ändere die falschen Paare und prüfe nochmals, oder nimm einen Tipp.',
      shown: 'Die Graphen zeigen jetzt die richtigen Paare.',
    },
  };
  const ui = () => UI[Lang.get()];

  let ex = null, tutor = null, arcade = null, topics = null;
  // pairs: flux id → voltage id; sel: the card waiting for a partner; marks: flux id → 'ok' | 'bad'
  let st = null;

  // ---------------------------------------------------------------- persistence
  function stored(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; }
  }
  function store(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
  }
  function showScore() {
    const s = stored('im-score', { solved: 0, clean: 0 });
    $('#score').textContent = s.solved ? ui().score(s.solved, s.clean) : '';
  }

  // ---------------------------------------------------------------- hints and solution
  // Voltage is V in English and U in German, as in the textbooks.
  const PHI = '<i>Φ</i>', DPHI = `d${PHI}/d<i>t</i>`;
  const Vi = () => L('<i>V</i><sub>ind</sub>', '<i>U</i><sub>ind</sub>');
  const r1 = (x) => Math.round(x * 10) / 10;
  const fmt = (x) => dec(Math.round(x * 100) / 100);
  const neg = (x) => (x === 0 ? 0 : -x);
  const graphOf = (id) => ex.flux.find((f) => f.id === id);
  const voltOf = (fluxId) => ex.answer[fluxId];
  const slopeAt = (p, x) => SHAPE[p.type].df(p, x);
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const and = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} ${L('and', 'und')} ${xs[xs.length - 1]}`);

  // The text helpers read the exercise from ex; withEx(e, f) runs f for another exercise.
  function withEx(e, f) {
    const saved = ex;
    ex = e;
    try { return f(); } finally { ex = saved; }
  }

  // Unordered pairs of flux graphs {f, g} such that pairing f with g's voltage graph is `kind`.
  function trapPairs(kind) {
    const out = [];
    for (const f of ex.flux) {
      for (const g of ex.flux) {
        if (f.id < g.id && [diagnose(ex, f.id, voltOf(g.id)), diagnose(ex, g.id, voltOf(f.id))].includes(kind)) out.push([f.id, g.id]);
      }
    }
    return out;
  }

  // What happens in one piece of a flux graph, and what that means for the voltage.
  function describe(p) {
    const len = p.t1 - p.t0, s0 = slopeAt(p, 0), s1 = slopeAt(p, len), V = Vi();
    const when = `${fmt(p.t0)}–${fmt(p.t1)} s`;
    if (p.type === 'poly' && p.d0 === p.d1) {
      return Math.abs(p.d0) < 1e-9 ? L(`${when}: ${PHI} is constant, so ${V} = 0`, `${when}: ${PHI} ist konstant, also ${V} = 0`)
        : L(`${when}: ${PHI} changes at ${num(r1(p.d0))} mWb/s, so ${V} = ${num(r1(-p.d0))} mV`,
          `${when}: ${PHI} ändert sich mit ${num(r1(p.d0))} mWb/s, also ${V} = ${num(r1(-p.d0))} mV`);
    }
    if (p.type === 'poly') {
      return L(`${when}: the slope of ${PHI} changes steadily from ${num(r1(s0))} to ${num(r1(s1))} mWb/s, so ${V} goes from ${num(r1(-s0))} to ${num(r1(-s1))} mV`,
        `${when}: Die Steigung von ${PHI} ändert sich gleichmässig von ${num(r1(s0))} auf ${num(r1(s1))} mWb/s, also geht ${V} von ${num(r1(-s0))} auf ${num(r1(-s1))} mV`);
    }
    if (p.type === 'exp' && p.q === 0) {
      return L(`${when}: ${PHI} ${p.r < 0 ? 'rises' : 'falls'} exponentially by up to ${fmt(Math.abs(p.r))} mWb (time constant ${fmt(p.tc)} s). It changes fastest right at the start, so ${V} jumps to ${num(r1(-s0))} mV and then decays towards 0`,
        `${when}: ${PHI} ${p.r < 0 ? 'steigt' : 'sinkt'} exponentiell um bis zu ${fmt(Math.abs(p.r))} mWb (Zeitkonstante ${fmt(p.tc)} s). Er ändert sich gleich zu Beginn am schnellsten, also springt ${V} auf ${num(r1(-s0))} mV und klingt dann gegen 0 ab`);
    }
    if (p.type === 'exp') {
      return L(`${when}: ${PHI} starts to change slowly, then at a steady ${num(r1(p.q))} mWb/s, so ${V} goes from ${num(r1(-s0))} mV towards ${num(r1(-p.q))} mV`,
        `${when}: ${PHI} ändert sich zuerst langsam, dann gleichmässig mit ${num(r1(p.q))} mWb/s, also geht ${V} von ${num(r1(-s0))} mV gegen ${num(r1(-p.q))} mV`);
    }
    const P = (2 * Math.PI) / p.w, A = Math.abs(p.A);
    return L(`${when}: ${PHI} oscillates with amplitude ${fmt(A)} mWb and period ${fmt(P)} s, so ${V} oscillates with amplitude 2π · ${fmt(A)} mWb / ${fmt(P)} s ≈ ${fmt(A * p.w)} mV`,
      `${when}: ${PHI} schwingt mit der Amplitude ${fmt(A)} mWb und der Periode ${fmt(P)} s, also schwingt ${V} mit der Amplitude 2π · ${fmt(A)} mWb / ${fmt(P)} s ≈ ${fmt(A * p.w)} mV`);
  }

  // Rule of thumb for the kind of graphs in an exercise.
  const RULE = {
    straight: () => L(`Each straight piece of a flux graph gives a constant voltage: the steeper the piece, the larger |${Vi()}|. Rising flux gives a negative voltage, falling flux a positive one.`,
      `Jedes gerade Stück eines Flussgraphen ergibt eine konstante Spannung: Je steiler das Stück, desto grösser |${Vi()}|. Steigender Fluss ergibt eine negative Spannung, sinkender eine positive.`),
    pieces: () => L(`Where a flux graph is curved, its slope changes steadily, so the voltage graph is a sloping straight line there. At a peak or a valley of ${PHI}, ${Vi()} passes through zero.`,
      `Wo ein Flussgraph gekrümmt ist, ändert sich seine Steigung gleichmässig, also ist der Spannungsgraph dort eine schräge Gerade. Bei einem Hoch- oder Tiefpunkt von ${PHI} geht ${Vi()} durch null.`),
    exp: () => L(`Right after a switch, ${PHI} changes fastest, so |${Vi()}| is largest. As ${PHI} levels off, ${Vi()} decays to zero. Where the slope of ${PHI} jumps (at a switch), ${Vi()} jumps too. A shorter time constant means a faster change and a larger voltage.`,
      `Direkt nach dem Umschalten ändert sich ${PHI} am schnellsten, also ist |${Vi()}| am grössten. Während sich ${PHI} seinem Endwert nähert, klingt ${Vi()} gegen null ab. Wo die Steigung von ${PHI} springt (beim Umschalten), springt auch ${Vi()}. Eine kürzere Zeitkonstante bedeutet eine schnellere Änderung und eine grössere Spannung.`),
    sine: () => L(`${Vi()} = 0 at the peaks and valleys of ${PHI}, and |${Vi()}| is largest where ${PHI} crosses its middle line, where it is steepest. So the voltage graph is shifted by a quarter period. A larger amplitude or a shorter period gives a larger voltage.`,
      `Bei den Hoch- und Tiefpunkten von ${PHI} ist ${Vi()} = 0, und |${Vi()}| ist am grössten, wo ${PHI} seine Mittellinie kreuzt, denn dort ist der Graph am steilsten. Der Spannungsgraph ist also um eine Viertelperiode verschoben. Eine grössere Amplitude oder eine kürzere Periode ergibt eine grössere Spannung.`),
  };

  const INTRO = {
    straight: () => L(`Where ${PHI} is a straight line, ${Vi()} is constant: a horizontal line at the slope of ${PHI}, with the opposite sign.`,
      `Wo ${PHI} eine Gerade ist, ist ${Vi()} konstant: eine waagrechte Linie auf der Höhe der Steigung von ${PHI}, mit umgekehrtem Vorzeichen.`),
    pieces: () => L(`Where ${PHI} is a straight line, ${Vi()} is constant. Where ${PHI} is curved, its slope changes steadily, so ${Vi()} is a sloping straight line.`,
      `Wo ${PHI} eine Gerade ist, ist ${Vi()} konstant. Wo ${PHI} gekrümmt ist, ändert sich seine Steigung gleichmässig, also ist ${Vi()} eine schräge Gerade.`),
    exp: () => L(`The slope of an exponential approach is itself exponential: ${Vi()} jumps when the field is switched and then decays with the same time constant.`,
      `Die Steigung einer exponentiellen Annäherung ist selbst exponentiell: ${Vi()} springt, wenn das Feld umgeschaltet wird, und klingt dann mit derselben Zeitkonstante ab.`),
    sine: () => L(`The slope of a sine curve is a cosine curve: ${Vi()} oscillates with the same period, shifted by a quarter period, with amplitude 2π · (amplitude of ${PHI}) / period.`,
      `Die Steigung einer Sinuskurve ist eine Kosinuskurve: ${Vi()} schwingt mit derselben Periode, um eine Viertelperiode verschoben, mit der Amplitude 2π · (Amplitude von ${PHI}) / Periode.`),
  };

  // Worked example for one piece: curved if possible, else sloped.
  function example() {
    const found = [], V = Vi();
    for (const f of ex.flux) for (const p of f.pieces) found.push([f, p]);
    const pick = (test) => found.find(([, p]) => test(p));
    const [f, p] = pick((q) => q.type === 'sine') || pick((q) => q.type === 'exp' && q.q === 0) || pick(curved)
      || pick((q) => Math.abs(q.d0) > 1e-9);
    const s0 = slopeAt(p, 0);
    if (p.type === 'sine') {
      const P = (2 * Math.PI) / p.w, A = Math.abs(p.A);
      return L(`Example: flux graph ${f.id} oscillates with amplitude ${fmt(A)} mWb and period ${fmt(P)} s. Its steepest slope is 2π · ${fmt(A)} mWb / ${fmt(P)} s ≈ ${fmt(A * p.w)} mWb/s, so ${V} reaches ±${fmt(A * p.w)} mV where ${PHI} crosses its middle line, and ${V} = 0 at its peaks and valleys.`,
        `Beispiel: Flussgraph ${f.id} schwingt mit der Amplitude ${fmt(A)} mWb und der Periode ${fmt(P)} s. Seine grösste Steigung ist 2π · ${fmt(A)} mWb / ${fmt(P)} s ≈ ${fmt(A * p.w)} mWb/s, also erreicht ${V} ±${fmt(A * p.w)} mV, wo ${PHI} seine Mittellinie kreuzt, und bei den Hoch- und Tiefpunkten ist ${V} = 0.`);
    }
    if (p.type === 'exp') {
      const up = p.r < 0;
      return L(`Example: in flux graph ${f.id}, ${PHI} starts to ${up ? 'rise' : 'fall'} at ${fmt(p.t0)} s towards a value ${fmt(Math.abs(p.r))} mWb ${up ? 'higher' : 'lower'}, with time constant ${fmt(p.tc)} s. At first it changes at ${fmt(Math.abs(p.r))} mWb / ${fmt(p.tc)} s = ${fmt(Math.abs(s0))} mWb/s, so ${V} jumps to ${num(r1(-s0))} mV and then decays towards 0.`,
        `Beispiel: In Flussgraph ${f.id} beginnt ${PHI} bei ${fmt(p.t0)} s zu ${up ? 'steigen' : 'sinken'}, gegen einen Wert, der ${fmt(Math.abs(p.r))} mWb ${up ? 'höher' : 'tiefer'} liegt, mit der Zeitkonstante ${fmt(p.tc)} s. Zuerst ändert er sich mit ${fmt(Math.abs(p.r))} mWb / ${fmt(p.tc)} s = ${fmt(Math.abs(s0))} mWb/s, also springt ${V} auf ${num(r1(-s0))} mV und klingt dann gegen 0 ab.`);
    }
    const when = L(`between ${fmt(p.t0)} s and ${fmt(p.t1)} s`, `zwischen ${fmt(p.t0)} s und ${fmt(p.t1)} s`);
    if (curved(p)) {
      return L(`Example: in flux graph ${f.id}, the slope of ${PHI} changes steadily from ${num(p.d0)} mWb/s to ${num(p.d1)} mWb/s ${when}. So ${V} changes steadily from ${num(neg(p.d0))} mV to ${num(neg(p.d1))} mV: a sloping straight line.`,
        `Beispiel: In Flussgraph ${f.id} ändert sich die Steigung von ${PHI} ${when} gleichmässig von ${num(p.d0)} mWb/s auf ${num(p.d1)} mWb/s. Also ändert sich ${V} gleichmässig von ${num(neg(p.d0))} mV auf ${num(neg(p.d1))} mV: eine schräge Gerade.`);
    }
    const dt = p.t1 - p.t0, p1 = p.p0 + p.d0 * dt;
    return L(`Example: in flux graph ${f.id}, ${PHI} changes from ${fmt(p.p0)} mWb to ${fmt(p1)} mWb ${when}, so ${V} = −(${num(p1 - p.p0)} mWb)/(${fmt(dt)} s) = ${num(neg(p.d0))} mV there.`,
      `Beispiel: In Flussgraph ${f.id} ändert sich ${PHI} ${when} von ${fmt(p.p0)} mWb auf ${fmt(p1)} mWb, also ist dort ${V} = −(${num(p1 - p.p0)} mWb)/(${fmt(dt)} s) = ${num(neg(p.d0))} mV.`);
  }

  function hints() {
    const [a, b] = trapPairs('sign')[0], V = Vi();
    return [
      L(`The induced voltage only depends on how fast the flux changes: ${V} = −${DPHI}, the slope of the ${PHI}(<i>t</i>) graph with the opposite sign. The value of ${PHI} itself does not matter.`,
        `Die induzierte Spannung hängt nur davon ab, wie schnell sich der Fluss ändert: ${V} = −${DPHI}, die Steigung des ${PHI}(<i>t</i>)-Graphen mit umgekehrtem Vorzeichen. Der Wert von ${PHI} selbst spielt keine Rolle.`),
      L(`Where a flux graph is horizontal, ${V} = 0. Where ${PHI} increases, ${V} is negative; where it decreases, ${V} is positive. A steeper graph gives a larger voltage.`,
        `Wo ein Flussgraph waagrecht ist, ist ${V} = 0. Wo ${PHI} zunimmt, ist ${V} negativ; wo er abnimmt, ist ${V} positiv. Ein steilerer Graph ergibt eine grössere Spannung.`),
      RULE[ex.family](),
      L(`Flux graphs ${a} and ${b} are mirror images of each other, so their voltage graphs are mirror images too.`,
        `Die Flussgraphen ${a} und ${b} sind Spiegelbilder voneinander, also sind auch ihre Spannungsgraphen Spiegelbilder.`),
      example(),
    ];
  }

  function solution() {
    const rows = ex.flux.map((f) => `<li><b>${f.id} ↔ ${voltOf(f.id)}</b>: ${f.pieces.map(describe).join('; ')}.</li>`);
    const labelled = ex.family !== 'sine'
      ? L(' The numbers above the graphs are the slopes of the flux (in mWb/s) and the voltages (in mV) at the start and end of each part; “+2 → 0” means from +2 to 0.',
        ' Die Zahlen über den Graphen sind die Steigungen des Flusses (in mWb/s) und die Spannungen (in mV) am Anfang und am Ende jedes Teils; «+2 → 0» heisst von +2 auf 0.')
      : '';
    return `<p>${L('The induced voltage is the slope of the flux graph with the opposite sign', 'Die induzierte Spannung ist die Steigung des Flussgraphen mit umgekehrtem Vorzeichen')}, ${Vi()} = −${DPHI}. ${INTRO[ex.family]()}${labelled}</p>` +
      `<ul class="pairs">${rows.join('')}</ul>` +
      `<p>${L('Traps in this exercise:', 'Fallen in dieser Aufgabe:')}</p><ul class="pairs">${traps().map((t) => `<li>${t}</li>`).join('')}</ul>`;
  }

  // What a wrong pair suggests, by misconception (see diagnose() in generator.js). Without the
  // names f and u (in the arcade), the graphs are “this graph” and “the flux graph”.
  const WHY = {
    sign: () => L(`Check the sign. By Lenz's rule, ${Vi()} = −${DPHI}: where ${PHI} increases, ${Vi()} is negative, and where it decreases, ${Vi()} is positive.`,
      `Achte auf das Vorzeichen. Nach der Lenzschen Regel ist ${Vi()} = −${DPHI}: Wo ${PHI} zunimmt, ist ${Vi()} negativ, und wo er abnimmt, ist ${Vi()} positiv.`),
    copy: (f, u) => (f ? L(`Voltage graph ${u} has the same shape as flux graph ${f}.`, `Spannungsgraph ${u} hat dieselbe Form wie Flussgraph ${f}.`)
      : L('This graph has the same shape as the flux graph.', 'Dieser Graph hat dieselbe Form wie der Flussgraph.')) +
      L(` But ${Vi()} does not depend on how large ${PHI} is, only on how fast it changes: where ${PHI} is constant or at a peak, ${Vi()} = 0.`,
        ` Aber ${Vi()} hängt nicht davon ab, wie gross ${PHI} ist, sondern nur davon, wie schnell er sich ändert: Wo ${PHI} konstant ist oder einen Hochpunkt hat, ist ${Vi()} = 0.`),
    average: () => L(`In a curved part, the slope of ${PHI} changes all the time, so ${Vi()} is not constant there. It is a sloping line, not the average slope ΔΦ/Δ<i>t</i>.`,
      `In einem gekrümmten Teil ändert sich die Steigung von ${PHI} laufend, also ist ${Vi()} dort nicht konstant. Es ist eine schräge Gerade, nicht die mittlere Steigung ΔΦ/Δ<i>t</i>.`),
    steepness: () => {
      if (ex.family === 'exp') {
        return L(`The signs fit, but compare how fast ${PHI} changes: with a shorter time constant, ${PHI} changes faster, so ${Vi()} is larger at first and decays sooner.`,
          `Die Vorzeichen passen, aber vergleiche, wie schnell sich ${PHI} ändert: Mit einer kürzeren Zeitkonstante ändert sich ${PHI} schneller, also ist ${Vi()} zuerst grösser und klingt früher ab.`);
      }
      if (ex.family === 'sine') {
        return L(`The signs fit, but compare the amplitudes: the amplitude of ${Vi()} is 2π · (amplitude of ${PHI}) / period.`,
          `Die Vorzeichen passen, aber vergleiche die Amplituden: Die Amplitude von ${Vi()} ist 2π · (Amplitude von ${PHI}) / Periode.`);
      }
      return L('The signs fit, but compare the steepness: a steeper flux graph gives a larger voltage.',
        'Die Vorzeichen passen, aber vergleiche die Steilheit: Ein steilerer Flussgraph ergibt eine grössere Spannung.');
    },
    other: () => L(`Go through the graph step by step: where is ${PHI} constant (${Vi()} = 0), increasing (${Vi()} &lt; 0) or decreasing (${Vi()} &gt; 0), and where is it steepest (|${Vi()}| largest)?`,
      `Geh den Graphen Schritt für Schritt durch: Wo ist ${PHI} konstant (${Vi()} = 0), steigend (${Vi()} &lt; 0) oder fallend (${Vi()} &gt; 0), und wo ist er am steilsten (|${Vi()}| am grössten)?`),
  };

  // Voltage graphs of f and g have a similar shape (they differ mainly in size).
  const TS = Array.from({ length: 200 }, (x, k) => ((k + 0.5) * T) / 200);
  const similar = (f, g) => correlation(TS.map((t) => volt(graphOf(f), t)), TS.map((t) => volt(graphOf(g), t))) > 0.9;

  function traps() {
    const out = trapPairs('sign').map(([a, b]) => L(`Flux graphs ${a} and ${b} are mirror images: only the sign of the voltage tells their voltage graphs apart.`,
      `Die Flussgraphen ${a} und ${b} sind Spiegelbilder: Nur das Vorzeichen der Spannung unterscheidet ihre Spannungsgraphen.`));
    for (const u of ex.volt) {
      const like = ex.flux.filter((f) => diagnose(ex, f.id, u.id) === 'copy').map((f) => f.id);
      if (like.length) {
        out.push(L(`Voltage graph ${u.id} has the same shape as flux graph${like.length > 1 ? 's' : ''} ${and(like)}, but it belongs to ${u.of}: ${Vi()} depends on how fast ${PHI} changes, not on how large it is.`,
          `Spannungsgraph ${u.id} hat dieselbe Form wie Flussgraph${like.length > 1 ? 'en' : ''} ${and(like)}, gehört aber zu ${u.of}: ${Vi()} hängt davon ab, wie schnell sich ${PHI} ändert, nicht davon, wie gross er ist.`));
      }
      for (const f of ex.flux) {
        if (diagnose(ex, f.id, u.id) === 'average') {
          out.push(L(`Voltage graph ${u.id} would fit flux graph ${f.id} if its curved part were straight. But where ${PHI} is curved, ${Vi()} changes.`,
            `Spannungsgraph ${u.id} würde zu Flussgraph ${f.id} passen, wenn dessen gekrümmter Teil gerade wäre. Aber wo ${PHI} gekrümmt ist, ändert sich ${Vi()}.`));
        }
      }
    }
    for (const [a, b] of trapPairs('steepness').filter(([x, y]) => similar(x, y))) {
      out.push(L(`Flux graphs ${a} and ${b} change in the same way, but at different rates: only the size of the voltage tells them apart.`,
        `Die Flussgraphen ${a} und ${b} ändern sich auf dieselbe Art, aber verschieden schnell: Nur die Grösse der Spannung unterscheidet sie.`));
    }
    return out;
  }

  // ---------------------------------------------------------------- rendering
  const colour = (fluxId) => 'p' + (FLUX.indexOf(fluxId) + 1);
  const partnerOf = (side, id) => (side === 'flux' ? st.pairs.get(id) : [...st.pairs].find(([, v]) => v === id)?.[0]);
  const starsOf = (d) => `<span class="stars" role="img" aria-label="${ui().stars(d)}" title="${ui().stars(d)}">${'★'.repeat(d)}${'☆'.repeat(5 - d)}</span>`;

  function card(side, id, svg) {
    return `<button type="button" class="gcard" data-side="${side}" data-id="${id}">
      <span class="gname">${id}</span><span class="badge"></span>${svg}</button>`;
  }

  function render() {
    const sol = st.revealed;
    $('#title').innerHTML = `${ui().task} ${starsOf(ex.difficulty)}`;
    $('#flux').innerHTML = ex.flux.map((f) => card('flux', f.id, fluxGraph(f, sol))).join('');
    $('#volt').innerHTML = ex.volt.map((u) => card('volt', u.id, voltGraph(graphOf(u.of), sol))).join('');
    showHints();
    $('#solution').hidden = !sol;
    $('#sol-text').innerHTML = sol ? solution() : '';
    showFeedback();
    paint();
    updateButtons();
  }

  function paint() {
    document.querySelectorAll('#board .gcard').forEach((el) => {
      const { side, id } = el.dataset;
      const partner = partnerOf(side, id);
      const fluxId = side === 'flux' ? id : partner;
      const mark = fluxId && st.marks[fluxId];
      const selected = !!st.sel && st.sel.side === side && st.sel.id === id;
      el.className = ['gcard', partner ? colour(fluxId) : '', selected ? 'sel' : '', mark || ''].filter(Boolean).join(' ');
      el.querySelector('.badge').textContent = partner ? `↔ ${partner}` : '';
      el.setAttribute('aria-pressed', String(selected));
      const what = side === 'flux' ? ui().fluxG : ui().voltG;
      el.setAttribute('aria-label', `${what} ${id}${partner ? ui().paired(partner) : ''}${mark === 'ok' ? ui().right : mark === 'bad' ? ui().wrong : ''}`);
      el.disabled = st.revealed || st.solved;
    });
  }

  // The result of the last check (kept when the language changes).
  function showFeedback() {
    const status = $('#status');
    status.className = 'status';
    status.textContent = '';
    $('#feedback').innerHTML = '';
    if (st.revealed && !st.solved) { status.textContent = ui().shown; return; }
    if (!st.checked) return;
    const right = Object.values(st.marks).filter((m) => m === 'ok').length;
    if (right === ex.flux.length) {
      status.textContent = ui().ok + (st.advance ? ` ${st.advance}` : '');
      status.className = 'status ok';
      return;
    }
    status.textContent = ui().some(right, ex.flux.length, st.tries) + (canReveal() ? ui().canReveal : ui().tryAgain);
    status.className = 'status bad';
    $('#feedback').innerHTML = [...st.pairs].filter(([f]) => st.marks[f] === 'bad')
      .map(([f, u]) => `<li><b>${f} ↔ ${u}</b>: ${WHY[diagnose(ex, f, u)](f, u)}</li>`).join('');
  }

  // ---------------------------------------------------------------- pairing
  function pick(side, id) {
    const sel = st.sel;
    if (!sel || sel.side === side) {
      st.sel = sel && sel.side === side && sel.id === id ? null : { side, id };
      return paint();
    }
    const [f, u] = side === 'flux' ? [id, sel.id] : [sel.id, id];
    const same = st.pairs.get(f) === u;
    st.pairs.delete(f);
    for (const [k, v] of st.pairs) if (v === u) st.pairs.delete(k);
    if (!same) st.pairs.set(f, u);
    st.sel = null;
    st.marks = {};
    st.checked = false;
    showFeedback();
    paint();
  }

  // ---------------------------------------------------------------- exercise lifecycle
  const newSeed = () => 1 + Math.floor(Math.random() * 999999);
  // solved now, or solved before (its solution can be looked at again)
  const canReveal = () => st.solved || Practice.solvedBefore(PRACTICE, ex.id) || st.hints >= ex.hints.length || st.tries >= MAX_TRIES;

  // Practice comes back more often to the types of exercise that were hard (shared practice.js).
  const PRACTICE = 'im', typeOf = (e) => e.family;
  const finish = () => { if (ex && st) Practice.finish(PRACTICE, typeOf(ex), st); };

  function open(exercise) {
    finish(); // the student moves on
    ex = exercise;
    ex.hints = hints();
    st = { pairs: new Map(), sel: null, marks: {}, checked: false, tries: 0, hints: 0, solved: false, revealed: false };
    const hash = `#${ex.id}`;
    if (location.hash !== hash) history.replaceState(null, '', hash);
    render();
    topics.shown(ex);
  }

  // A new exercise of the topic and stage chosen (topics.js), of another type than the current one if possible.
  function fresh() { open(topics.next(ex)); }

  function updateButtons() {
    const left = ex.hints.length - st.hints;
    const hb = $('#hint');
    hb.disabled = left === 0 || st.revealed;
    hb.textContent = left ? ui().hint(left) : ui().noHints;
    const rb = $('#reveal');
    rb.disabled = !canReveal() || st.revealed;
    rb.title = canReveal() ? '' : ui().unlocks(MAX_TRIES);
    $('#reveal-note').hidden = canReveal() || st.revealed;
    // once everything is right, Check becomes New exercise, like the button at the top
    const cb = $('#check');
    cb.textContent = st.solved ? ui().new : ui().check;
    cb.classList.toggle('primary', !st.solved);
    cb.classList.toggle('new-btn', st.solved);
    cb.disabled = st.revealed && !st.solved;
  }

  function check() {
    if (st.solved) { fresh(); return; } // the button reads New exercise
    if (st.pairs.size < ex.flux.length) {
      $('#status').textContent = ui().choose;
      $('#status').className = 'status';
      return;
    }
    st.tries++;
    st.sel = null;
    st.checked = true;
    for (const [f, u] of st.pairs) st.marks[f] = ex.answer[f] === u ? 'ok' : 'bad';
    if (Object.values(st.marks).every((m) => m === 'ok')) {
      if (!st.revealed) {
        const s = stored('im-score', { solved: 0, clean: 0 });
        s.solved++;
        if (st.tries === 1 && st.hints === 0) s.clean++;
        store('im-score', s);
        showScore();
      }
      st.solved = true;
      Practice.markSolved(PRACTICE, ex.id);
      finish();
      st.advance = topics.solved(st, ex);
    }
    showFeedback();
    paint();
    updateButtons();
  }

  function showHints() {
    $('#hint-list').innerHTML = ex.hints.slice(0, st.hints).map((h) => `<li>${h}</li>`).join('');
    $('#hints').hidden = !st.hints;
  }
  function hint() {
    if (st.hints >= ex.hints.length) return;
    st.hints++;
    showHints();
    updateButtons();
    $('#hint-list').lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function reveal() {
    if (!canReveal()) return;
    st.revealed = true;
    finish();
    st.sel = null;
    st.marks = {};
    st.checked = false;
    st.pairs = new Map(Object.entries(ex.answer));
    render();
    $('#solution').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---------------------------------------------------------------- tutor
  // Worked examples: four flux graphs turned into their voltage graphs piece by piece (the piece
  // is highlighted in both graphs, with its slope drawn in), then a whole matching exercise.
  const LESSONS = [
    { name: () => L('Straight', 'Gerade'), family: 'pieces', seed: 25, graph: 'A', practice: [{ types: ['straight'] }],
      idea: () => L('Where the flux changes steadily, the induced voltage is constant: its size is the slope of the flux graph, and its sign is the opposite.',
        'Wo sich der Fluss gleichmässig ändert, ist die induzierte Spannung konstant: Ihr Betrag ist die Steigung des Flussgraphen, ihr Vorzeichen das umgekehrte.') },
    { name: () => L('Curved', 'Gekrümmt'), family: 'pieces', seed: 8, graph: 'C', practice: [{ types: ['pieces'] }],
      idea: () => L('Where the flux graph is curved, its slope changes steadily, so the induced voltage changes steadily too: a sloping straight line.',
        'Wo der Flussgraph gekrümmt ist, ändert sich seine Steigung gleichmässig, also ändert sich auch die induzierte Spannung gleichmässig: eine schräge Gerade.') },
    { name: () => L('Exponential', 'Exponentiell'), family: 'exp', seed: 2, graph: 'A', practice: [{ types: ['exp'] }],
      idea: () => L('When a field is switched on or off, the flux changes fastest at first: the voltage jumps, then decays.',
        'Wenn ein Feld ein- oder ausgeschaltet wird, ändert sich der Fluss zuerst am schnellsten: Die Spannung springt und klingt dann ab.') },
    { name: () => L('Sinusoidal', 'Sinusförmig'), family: 'sine', seed: 1, graph: 'B', practice: [{ types: ['sine'] }],
      idea: () => L('The slope of a sine curve is a cosine curve: the voltage oscillates with the same period, shifted by a quarter period.',
        'Die Steigung einer Sinuskurve ist eine Kosinuskurve: Die Spannung schwingt mit derselben Periode, um eine Viertelperiode verschoben.') },
    { name: () => L('Matching', 'Zuordnen'), family: 'pieces', seed: 6, practice: [{ types: ['straight', 'pieces'] }, { name: () => L('all kinds of graphs', 'alle Arten von Graphen'), types: ['straight', 'pieces', 'exp', 'sine'] }],
      idea: () => L('In the exercises, four flux graphs have to be matched with four voltage graphs, and some of the voltage graphs are traps.',
        'In den Aufgaben müssen vier Flussgraphen vier Spannungsgraphen zugeordnet werden, und einige der Spannungsgraphen sind Fallen.') },
  ];

  // Times in piece p where the flux has a peak or valley (V = 0) and where it is steepest (sine pieces).
  function sineTimes(p) {
    const out = { flat: [], steep: [] };
    for (let k = -2; k < 20; k++) {
      const flat = (Math.PI / 2 + k * Math.PI - p.ph) / p.w, steep = (k * Math.PI - p.ph) / p.w;
      if (flat > 1e-9 && flat < p.t1 - p.t0 - 1e-9) out.flat.push(p.t0 + flat);
      if (steep > -1e-9 && steep < p.t1 - p.t0 - 1e-9) out.steep.push(p.t0 + steep);
    }
    return out;
  }

  // A flux graph and its voltage graph side by side.
  const pairFigure = (fl, vo) => `<div class="tgraphs"><div><h3 class="qc-flux">${ui().fluxH} ${PHI}</h3>${fl}</div><div><h3 class="qc-volt">${ui().voltH} ${Vi()}</h3>${vo}</div></div>`;

  function graphLesson(def) {
    const e = generate(def.family, def.seed), f = e.flux.find((x) => x.id === def.graph), ps = f.pieces, V = Vi();
    const frames = [{
      text: `<p class="step-rule">${L('The task', 'Die Aufgabe')}</p>` +
        L(`<p>The graph shows the magnetic flux ${PHI} through a conducting loop. What voltage is induced in the loop?</p><p>${V} = −${DPHI}: the induced voltage is the slope of the flux graph, with the opposite sign (Lenz's rule). The value of ${PHI} itself does not matter. We go through the graph piece by piece.</p>`,
          `<p>Der Graph zeigt den magnetischen Fluss ${PHI} durch eine Leiterschleife. Welche Spannung wird in der Schleife induziert?</p><p>${V} = −${DPHI}: Die induzierte Spannung ist die Steigung des Flussgraphen mit umgekehrtem Vorzeichen (Lenzsche Regel). Der Wert von ${PHI} selbst spielt keine Rolle. Wir gehen den Graphen Stück für Stück durch.</p>`),
      figure: pairFigure(fluxGraph(f), voltGraph(f, false, { upto: 0 })),
    }];
    ps.forEach((p, i) => {
      const len = p.t1 - p.t0, band = [p.t0, p.t1], y0 = p.p0, y1 = flux(f, p.t1 - 1e-9);
      const v0 = volt(f, p.t0), v1 = volt(f, p.t1 - 1e-9);
      let fo = () => '', vo = (g) => Tut.dot(g, p.t0, v0) + Tut.dot(g, p.t1, v1), extra = '';
      if (p.type === 'poly' && !curved(p)) {
        if (Math.abs(p.d0) > 1e-9) {
          fo = (g) => Tut.triangle(g, p.t0, y0, p.t1, y1) + Tut.tag(g, (p.t0 + p.t1) / 2, y0, `Δt = ${fmt(len)} s`, y1 > y0 ? 'below' : 'above') +
            Tut.tag(g, p.t1, (y0 + y1) / 2, `ΔΦ = ${num(r1(y1 - y0))} mWb`, 'right');
          extra = L(` Slope: ${PHI} changes by ${num(r1(y1 - y0))} mWb in ${fmt(len)} s, so ${DPHI} = ${num(r1(y1 - y0))} mWb / ${fmt(len)} s = ${num(r1(p.d0))} mWb/s.`,
            ` Steigung: ${PHI} ändert sich in ${fmt(len)} s um ${num(r1(y1 - y0))} mWb, also ${DPHI} = ${num(r1(y1 - y0))} mWb / ${fmt(len)} s = ${num(r1(p.d0))} mWb/s.`);
        }
        vo = (g) => Tut.dot(g, p.t0, v0) + Tut.dot(g, p.t1, v1) + Tut.tag(g, (p.t0 + p.t1) / 2, v0, `${num(r1(v0))} mV`, v0 >= 0 ? 'above' : 'below');
      } else if (p.type === 'poly' || p.type === 'exp') {
        const s0 = SHAPE[p.type].df(p, 0), s1 = SHAPE[p.type].df(p, len);
        fo = (g) => Tut.tangent(g, p.t0, y0, s0) + Tut.dot(g, p.t0, y0) + (p.type === 'poly' ? Tut.tangent(g, p.t1, y1, s1) + Tut.dot(g, p.t1, y1) : '');
        vo = (g) => Tut.dot(g, p.t0, v0) + Tut.tag(g, p.t0, v0, `${num(r1(v0))} mV`, 'right') + (p.type === 'poly' ? Tut.dot(g, p.t1, v1) + Tut.tag(g, p.t1, v1, `${num(r1(v1))} mV`, 'left') : '');
        extra = p.type === 'poly'
          ? L(` The tangents show the slope at the start (${num(r1(s0))} mWb/s) and at the end (${num(r1(s1))} mWb/s).`,
            ` Die Tangenten zeigen die Steigung am Anfang (${num(r1(s0))} mWb/s) und am Ende (${num(r1(s1))} mWb/s).`)
          : L(` The tangent shows the slope right after the switch: ${num(r1(s0))} mWb/s.`, ` Die Tangente zeigt die Steigung direkt nach dem Umschalten: ${num(r1(s0))} mWb/s.`);
      } else {
        const ts = sineTimes(p), yv = (t) => flux(f, t);
        fo = (g) => ts.flat.map((t) => Tut.vline(g, t, 0, PHI_MAX) + Tut.dot(g, t, yv(t), 'flat')).join('') +
          ts.steep.map((t) => Tut.tangent(g, t, yv(t), SHAPE.sine.df(p, t - p.t0))).join('');
        vo = (g) => ts.flat.map((t) => Tut.vline(g, t, -V_MAX, V_MAX) + Tut.dot(g, t, 0, 'flat')).join('') +
          ts.steep.map((t) => Tut.dot(g, t, volt(f, t))).join('');
        extra = L(` At the peaks and valleys of ${PHI} (dashed lines), the flux graph is horizontal, so ${V} = 0. Where ${PHI} crosses its middle line it is steepest (short lines), so |${V}| is largest there.`,
          ` Bei den Hoch- und Tiefpunkten von ${PHI} (gestrichelte Linien) ist der Flussgraph waagrecht, also ${V} = 0. Wo ${PHI} seine Mittellinie kreuzt, ist der Graph am steilsten (kurze Linien), also ist |${V}| dort am grössten.`);
      }
      const text = describe(p).replace(/^[^:]*: /, '');
      frames.push({
        text: `<p class="step-rule">${L(`Piece ${i + 1} of ${ps.length}`, `Stück ${i + 1} von ${ps.length}`)} (${fmt(p.t0)}–${fmt(p.t1)} s)</p><p>${cap(text)}.${extra}</p>`,
        figure: pairFigure(fluxGraph(f, false, { band, overlay: fo }), voltGraph(f, false, { band, upto: i + 1, overlay: vo })),
      });
    });
    frames.push({
      text: `<p class="step-rule">${L('The whole graph', 'Der ganze Graph')}</p><p>${INTRO[def.family]()}</p><p>${RULE[def.family]()}</p>`,
      figure: pairFigure(fluxGraph(f), voltGraph(f)),
    });
    return frames;
  }

  // A whole exercise: the pairs one by one, with the traps next to each.
  function matchingLesson(def) {
    const e = generate(def.family, def.seed), V = Vi();
    return withEx(e, () => {
      const cards = (lit) => {
        const cls = (side, id) => {
          const fluxId = side === 'flux' ? id : e.volt.find((u) => u.id === id).of;
          if (lit === 'all' || (lit && lit.f === fluxId && (side === 'flux' || lit.u === id))) return `gcard ${colour(fluxId)}`;
          if (lit && lit.traps && side === 'volt' && lit.traps.includes(id)) return 'gcard trap';
          return 'gcard';
        };
        const badge = (side, id) => {
          if (side === 'volt' && lit && lit !== 'all' && lit.traps && lit.traps.includes(id)) return L('trap', 'Falle');
          const partner = side === 'flux' ? voltOf(id) : e.volt.find((u) => u.id === id).of;
          return lit === 'all' || (lit && (side === 'flux' ? lit.f === id : lit.u === id)) ? `↔ ${partner}` : '';
        };
        const one = (side, id, svg) => `<div class="${cls(side, id)}"><span class="gname">${id}</span><span class="badge">${badge(side, id)}</span>${svg}</div>`;
        return `<h3 class="qc-flux">${ui().fluxH}</h3><div class="graphs">${e.flux.map((f) => one('flux', f.id, fluxGraph(f))).join('')}</div>` +
          `<h3 class="qc-volt">${ui().voltH}</h3><div class="graphs">${e.volt.map((u) => one('volt', u.id, voltGraph(graphOf(u.of)))).join('')}</div>`;
      };
      const frames = [{
        text: `<p class="step-rule">${L('The task', 'Die Aufgabe')}</p>` +
          L(`<p>Match each flux graph A–D with its voltage graph 1–4.</p><p>Do not compare the shapes of the graphs: ${V} depends on how fast ${PHI} changes, not on how large it is. For each flux graph, find where it is constant (${V} = 0), rising (${V} &lt; 0) and falling (${V} &gt; 0), and where it is steepest.</p>`,
            `<p>Ordne jedem Flussgraphen A–D seinen Spannungsgraphen 1–4 zu.</p><p>Vergleiche nicht die Formen der Graphen: ${V} hängt davon ab, wie schnell sich ${PHI} ändert, nicht davon, wie gross er ist. Finde für jeden Flussgraphen, wo er konstant (${V} = 0), steigend (${V} &lt; 0) und fallend (${V} &gt; 0) ist, und wo er am steilsten ist.</p>`),
        figure: cards(null),
      }];
      for (const f of e.flux) {
        const u = voltOf(f.id);
        const tr = e.volt.filter((w) => w.id !== u && ['sign', 'copy', 'average', 'steepness'].includes(diagnose(e, f.id, w.id)));
        const warn = tr.map((w) => `<li>${L('Not', 'Nicht')} ${w.id}: ${WHY[diagnose(e, f.id, w.id)](f.id, w.id)}</li>`).join('');
        frames.push({
          text: `<p class="step-rule">${ui().fluxG} ${f.id}</p><p><b>${f.id} ↔ ${u}</b>: ${f.pieces.map(describe).join('; ')}.</p>` +
            (warn ? `<p>${L(`Traps for ${f.id}:`, `Fallen für ${f.id}:`)}</p><ul>${warn}</ul>` : ''),
          figure: cards({ f: f.id, u, traps: tr.map((w) => w.id) }),
        });
      }
      frames.push({
        text: `<p class="step-rule">${L('All pairs', 'Alle Paare')}</p><p>${L('Traps in this exercise:', 'Fallen in dieser Aufgabe:')}</p><ul>${traps().map((t) => `<li>${t}</li>`).join('')}</ul>`,
        figure: cards('all'),
      });
      return frames;
    });
  }
  const lessons = () => LESSONS.map((l, i) => ({ name: l.name(), idea: l.idea(), also: topics.also(i), frames: () => (l.graph ? graphLesson(l) : matchingLesson(l)) }));

  // ---------------------------------------------------------------- arcade
  // Each question shows one flux graph of an exercise; the options are the exercise's four voltage
  // graphs (in their order 1–4). A wrong option is a misconception when diagnose() names one.
  function arcadeQuestion(kind, seed) {
    const e = ofDifficulty(Number(kind.slice(1)), seed);
    return withEx(e, () => {
      // the flux graph with the most traps among the other voltage graphs
      const traps = (f) => e.volt.filter((u) => !['right', 'other'].includes(diagnose(e, f.id, u.id))).length;
      const most = Math.max(...e.flux.map(traps)), pool = e.flux.filter((f) => traps(f) === most);
      const f = pool[seed % pool.length];
      return {
        title: ui().task,
        text: L('<p>The graph shows the magnetic flux <i>Φ</i> through a conducting loop.</p>', '<p>Der Graph zeigt den magnetischen Fluss <i>Φ</i> durch eine Leiterschleife.</p>'),
        figure: `<figure class="fig">${fluxGraph(f)}</figure>`,
        ask: L(`Which graph shows the induced voltage ${Vi()}?`, `Welcher Graph zeigt die induzierte Spannung ${Vi()}?`),
        options: e.volt.map((u) => {
          const code = diagnose(e, f.id, u.id), flag = code === 'right' || code === 'other' ? null : code;
          return { html: voltGraph(graphOf(u.of)), correct: code === 'right', flag, why: code === 'right' ? '' : withEx(e, () => WHY[code]()) };
        }),
        explain: () => withEx(e, () => `${pairFigure(fluxGraph(f, true), voltGraph(f, true))}` +
          `<div class="steps"><p>${Vi()} = −${DPHI}. ${INTRO[e.family]()}</p><ul>${f.pieces.map((p) => `<li>${describe(p)}.</li>`).join('')}</ul></div>`),
      };
    });
  }
  const arcadeSource = {
    id: 'im',
    kinds: [1, 2, 3, 4, 5].map((d) => ({ id: `d${d}`, difficulty: d })),
    question: arcadeQuestion,
    concept: { sign: 'lenz', copy: 'copy', steepness: 'rate', average: 'average' },
    concepts: () => ({
      lenz: L("the sign of the voltage (Lenz's rule)", 'das Vorzeichen der Spannung (Lenzsche Regel)'),
      copy: L('the voltage graph copies the flux graph', 'der Spannungsgraph kopiert den Flussgraphen'),
      rate: L('how fast the flux changes', 'wie schnell sich der Fluss ändert'),
      average: L('the average slope of a curved part', 'die mittlere Steigung eines gekrümmten Teils'),
    }),
    intro: () => ({
      tag: L('Which voltage graph belongs to the flux graph? Answer as many questions as you can in <b>5 minutes</b>.',
        'Welcher Spannungsgraph gehört zum Flussgraphen? Beantworte in <b>5 Minuten</b> so viele Fragen wie möglich.'),
      rule: L('Questions get harder as you go. Each shows the magnetic flux through a loop; pick the graph of the induced voltage from four. Click a graph or press 1–4.',
        'Die Fragen werden nach und nach schwieriger. Jede zeigt den magnetischen Fluss durch eine Schleife; wähle aus vier Graphen jenen der induzierten Spannung. Klicke einen Graphen an oder drücke 1–4.'),
      example: L('a voltage graph with the shape of the flux graph', 'ein Spannungsgraph mit der Form des Flussgraphen'),
    }),
    // a sinusoidal flux (the fourth worked example), its voltage, and the law of induction
    hero: () => {
      const f = generate('sine', 1).flux.find((x) => x.id === 'B');
      return `<div class="figs"><figure class="fig">${fluxGraph(f)}</figure><figure class="fig">${voltGraph(f)}</figure></div>` +
        `<p class="ar-law">${Vi()} = −${DPHI}</p>`;
    },
  };

  // ---------------------------------------------------------------- language
  function applyStatic() {
    document.title = ui().title;
    Lang.apply(ui());
    if (topics) topics.relabel();
  }

  // The same exercise in the other language, with the pairs, feedback, hints and solution kept.
  function switchLang() {
    applyStatic();
    showScore();
    if (ex) {
      ex.hints = hints();
      render();
      if ($('#task').hidden) { $('#hints').hidden = true; $('#solution').hidden = true; }
    }
    tutor.relabel(lessons());
    arcade.relabel();
  }

  // ---------------------------------------------------------------- modes
  // Practice: random exercises; tutor: worked examples; arcade: a timed game (arcade.js). Hints
  // and solution belong to practice. Leaving the arcade ends a running game.
  const mode = () => (document.querySelector('input[name="mode"]:checked') || {}).value || 'practice';
  function setMode(m) {
    document.querySelector(`input[name="mode"][value="${m}"]`).checked = true;
    store('im-mode', m);
    document.querySelectorAll('.practice').forEach((el) => { el.hidden = m !== 'practice'; });
    $('#tutor').hidden = m !== 'tutor';
    $('#arcade').hidden = m !== 'arcade';
    if (m !== 'practice') { $('#hints').hidden = true; $('#solution').hidden = true; }
    if (m !== 'arcade') arcade.stop();
  }
  function practise() {
    setMode('practice');
    if (ex) { history.replaceState(null, '', `#${ex.id}`); $('#hints').hidden = !st.hints; $('#solution').hidden = !st.revealed; } else fresh();
  }
  function play() {
    setMode('arcade');
    arcade.show();
    if (location.hash !== '#arcade') history.replaceState(null, '', '#arcade');
  }

  function fromHash() {
    const h = location.hash.slice(1);
    if (h === 'arcade') { if ($('#arcade').hidden) play(); return true; }
    let m = h.match(/^tutor-(\d+)$/);
    if (m && Number(m[1]) >= 1 && Number(m[1]) <= tutor.count) {
      setMode('tutor');
      if (tutor.current() !== Number(m[1]) - 1 || !tutor.shown()) tutor.open(Number(m[1]) - 1);
      return true;
    }
    const te = topics.parse(h);
    if (te) {
      setMode('practice');
      if (!ex || ex.id !== h) open(te);
      return true;
    }
    // a level, or (older links) a family
    m = h.match(/^(easy|medium|hard|mixed|straight|pieces|exp|sine)-(\d+)$/);
    if (!m) return false;
    setMode('practice');
    if (!ex || ex.id !== h) open(generate(m[1], Number(m[2])));
    return true;
  }

  // ---------------------------------------------------------------- init
  function init() {
    Lang.init(); // see lang.js
    document.querySelector('main').insertAdjacentHTML('beforeend', Arcade.HTML);
    applyStatic();
    Lang.wire(switchLang);
    topics = window.Topics.create({
      app: PRACTICE,
      topics: LESSONS.map((l) => ({ name: l.name, stages: l.practice.map((st) => ({ name: st.name || null, types: st.types })) })),
      make: (type, seed) => generate(type, seed), typeOf,
      onChange: fresh,
      tutor: (i) => { setMode('tutor'); tutor.open(i); },
    });
    topics.mount($('#levels'));
    $('#new').addEventListener('click', fresh);
    $('#check').addEventListener('click', check);
    $('#hint').addEventListener('click', hint);
    $('#reveal').addEventListener('click', reveal);
    $('#board').addEventListener('click', (evt) => {
      const el = evt.target.closest('.gcard');
      if (el && !el.disabled) pick(el.dataset.side, el.dataset.id);
    });
    window.addEventListener('hashchange', fromHash);
    tutor = window.createTutor(lessons(), { done: practise, practise: (i) => { topics.go(i); setMode('practice'); fresh(); } });
    arcade = Arcade.create(arcadeSource, { math: () => {}, markScrollable: () => {}, stored, store });
    $('#modes').addEventListener('change', () => {
      if (mode() === 'tutor') { setMode('tutor'); tutor.open(tutor.current()); } else if (mode() === 'arcade') play(); else practise();
    });
    showScore();
    if (fromHash()) return;
    // First visit: start with the first worked example.
    const last = stored('im-mode', 'tutor');
    if (last === 'tutor') { setMode('tutor'); tutor.open(0); } else if (last === 'arcade') play(); else { setMode('practice'); fresh(); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
