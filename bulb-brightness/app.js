(function () {
  'use strict';

  const { ANSWERS, generate, make, diagnose, sameSpot, bulbsIn, canon: canonOf, ftext, cmp, isExact, isZero, ONE } = window.Bulbs;
  const { circuit } = window.Draw;
  const Lang = window.Lang, Check = window.Check, L = Lang.L;
  const $ = (sel) => document.querySelector(sel);
  const MAX_TRIES = 3;
  const GLOW = { brighter: 0.95, equal: 0.5, dimmer: 0.22, off: 0 };

  // ---------------------------------------------------------------- interface texts
  const UI = {
    en: {
      title: 'Bulb Brightness', mode: 'Mode', difficulty: 'Difficulty', example: 'Example',
      tutor: 'Tutor', practice: 'Practice', checkMode: 'Check', new: 'New exercise',
      tutorNote: 'Use the arrow keys ← → to step through. In the diagram, the <span class="k-light">dashed box</span> marks the part whose voltage is being shared, the <span class="k-strong">highlights</span> mark the parts it is shared among, and each part shows its voltage as soon as it is known.',
      task: 'How bright are the bulbs?',
      introShow: 'Instructions',
      taskText: 'All batteries are identical, and so are all bulbs. Compare each bulb with the reference circuit: one bulb connected to one battery. Is it brighter, equally bright, less bright, or off?',
      reference: 'Reference', yours: 'Your circuit', circuit: 'Circuit',
      check: 'Check', reveal: 'Show solution', hints: 'Hints', solution: 'Solution',
      revealNote: 'The solution unlocks once you have solved the exercise, used all hints or made three attempts.',
      power: 'The bulbs glow according to their power.',
      levels: { easy: 'Easy', medium: 'Medium', hard: 'Hard', mixed: 'Mixed' },
      stars: (d) => `Difficulty: ${d} of 5`,
      score: (s, c) => `Solved: ${s} · first try without hints: ${c}`,
      hint: (n) => `Hint (${n} left)`, noHints: 'No more hints', unlocks: (n) => `Unlocks after all hints or ${n} attempts`,
      choose: 'Choose an answer for every bulb, then check again.',
      ok: 'All correct, well done!',
      some: (r, n, k) => `${r} of ${n} bulbs are correct (attempt ${k}).`,
      canReveal: ' You can take a hint or look at the solution.', tryAgain: ' Change the wrong answers and check again, or take a hint.',
    },
    de: {
      title: 'Helligkeit von Lampen', mode: 'Modus', difficulty: 'Schwierigkeit', example: 'Beispiel',
      tutor: 'Tutor', practice: 'Üben', checkMode: 'Check', new: 'Neue Aufgabe',
      tutorNote: 'Mit den Pfeiltasten ← → blätterst du weiter. Im Schaltbild markiert der <span class="k-light">gestrichelte Rahmen</span> den Teil, dessen Spannung aufgeteilt wird, die <span class="k-strong">Hervorhebungen</span> markieren die Teile, auf die sie aufgeteilt wird, und jeder Teil zeigt seine Spannung, sobald sie bekannt ist.',
      task: 'Wie hell leuchten die Lampen?',
      introShow: 'Anleitung',
      taskText: 'Alle Batterien sind gleich, ebenso alle Lampen. Vergleiche jede Lampe mit der Vergleichsschaltung: eine Lampe an einer Batterie. Leuchtet sie heller, gleich hell, weniger hell, oder ist sie aus?',
      reference: 'Vergleich', yours: 'Deine Schaltung', circuit: 'Schaltung',
      check: 'Prüfen', reveal: 'Lösung zeigen', hints: 'Tipps', solution: 'Lösung',
      revealNote: 'Die Lösung wird freigeschaltet, sobald du die Aufgabe gelöst, alle Tipps genutzt oder drei Versuche gemacht hast.',
      power: 'Die Lampen leuchten entsprechend ihrer Leistung.',
      levels: { easy: 'Einfach', medium: 'Mittel', hard: 'Schwierig', mixed: 'Gemischt' },
      stars: (d) => `Schwierigkeit: ${d} von 5`,
      score: (s, c) => `Gelöst: ${s} · beim ersten Versuch ohne Tipps: ${c}`,
      hint: (n) => `Tipp (${n} übrig)`, noHints: 'Keine Tipps mehr', unlocks: (n) => `Wird nach allen Tipps oder ${n} Versuchen freigeschaltet`,
      choose: 'Wähle für jede Lampe eine Antwort und prüfe dann nochmals.',
      ok: 'Alles richtig, gut gemacht!',
      some: (r, n, k) => `${r} von ${n} Lampen sind richtig (Versuch ${k}).`,
      canReveal: ' Du kannst einen Tipp nehmen oder die Lösung anschauen.', tryAgain: ' Ändere die falschen Antworten und prüfe nochmals, oder nimm einen Tipp.',
    },
  };
  const ui = () => UI[Lang.get()];
  const WORDS = () => ({ brighter: L('brighter', 'heller'), equal: L('equally bright', 'gleich hell'), dimmer: L('less bright', 'weniger hell'), off: L('off', 'aus') });

  let ex = null, st = null, tutor = null, checker = null, topics = null;

  // ---------------------------------------------------------------- folded introductions
  const SMALL = window.matchMedia('(max-width: 640px)');
  function syncFold() {
    document.querySelectorAll('details.intro').forEach((d) => {
      const box = d.closest('#task');
      if (box) box.classList.toggle('folded', !d.open);
    });
  }

  // ---------------------------------------------------------------- persistence
  function stored(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; }
  }
  function store(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
  }
  function showScore() {
    const s = stored('bb-score', { solved: 0, clean: 0 });
    $('#score').textContent = s.solved ? ui().score(s.solved, s.clean) : '';
  }

  // ---------------------------------------------------------------- text
  // Voltage is V in English and U in German, as in the textbooks.
  const V0 = () => L('<i>V</i><sub>0</sub>', '<i>U</i><sub>0</sub>');
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const volts = (f) => (isZero(f) ? '0' : cmp(f, ONE) === 0 ? V0() : `${ftext(f)} ${V0()}`);
  // A bulb's name with its index as a subscript (L2 → L₂), in a text and in a drawing (upright
  // index, see style.css).
  const it = (name) => { const m = /^([A-Za-z]+)(\d+)$/.exec(name); return m ? `<i>${m[1]}</i><sub>${m[2]}</sub>` : `<i>${name}</i>`; };
  const svgName = (name) => { const m = /^([A-Za-z]+)(\d+)$/.exec(name); return m ? `${m[1]}<tspan class="sub" dy="0.3em">${m[2]}</tspan><tspan dy="-0.3em">\u200b</tspan>` : name; };
  const Vof = (name) => `${L('<i>V</i>', '<i>U</i>')}(${it(name)})`;
  const and = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} ${L('and', 'und')} ${xs[xs.length - 1]}`);
  const cap = (s) => s.replace(/^(<i>)?([a-zäöü])/, (m, tag, c) => (tag || '') + c.toUpperCase());

  // How a part of the circuit is called in the explanations; c: the German case (nom, dat).
  function name(part, c = 'nom') {
    const bs = bulbsIn(part).map((b) => it(`L${b.i + 1}`));
    if (part.t === 'L') return bs[0];
    if (part.t === 'W') return L('the wire', c === 'dat' ? 'dem Draht' : 'der Draht');
    const bridged = part.kids.find((k) => k.t !== 'W' && part.kids.some((w) => w.t === 'W'));
    if (bridged) return `${name(bridged, c)} (${L('bridged', 'überbrückt')})`;
    const art = c === 'dat' ? 'der' : 'die';
    return part.t === 'P' ? L(`the parallel group of ${and(bs)}`, `${art} Parallelschaltung von ${and(bs)}`)
      : L(`the chain of ${and(bs)}`, `${art} Serieschaltung von ${and(bs)}`);
  }
  const names = (parts, c) => and(parts.filter((p) => p.t !== 'W').map((p) => name(p, c)));

  // How the circuit is built, from the inside out.
  function structure() {
    const out = [];
    (function walk(node) {
      if (!node.kids) return;
      node.kids.forEach(walk);
      const parts = node.kids.filter((k) => k.t !== 'W');
      if (parts.length < node.kids.length) out.push(L(`${name(parts[0])} is bridged by a wire`, `${name(parts[0])} ist durch einen Draht überbrückt`));
      else if (node.t === 'S') out.push(L(`${name(parts[0])} is in series with ${names(parts.slice(1))}`, `${name(parts[0])} ist in Serie mit ${names(parts.slice(1), 'dat')}`));
      else out.push(L(`${name(parts[0])} is in parallel with ${names(parts.slice(1))}`, `${name(parts[0])} ist parallel zu ${names(parts.slice(1), 'dat')}`));
    })(ex.load);
    return out;
  }
  const kind = (part) => (part.t === 'L' ? L('one bulb', 'eine Lampe')
    : part.t === 'P' ? L(`${part.kids.length} branches side by side`, `${part.kids.length} Zweige nebeneinander`)
      : L(`${part.kids.length} parts in a row`, `${part.kids.length} Teile hintereinander`));

  const PACK_TEXT = {
    1: () => L(`One battery gives ${V0()}.`, `Eine Batterie liefert ${V0()}.`),
    S2: () => L(`The two batteries are in series: their voltages add up to 2 ${V0()}.`, `Die zwei Batterien sind in Serie: Ihre Spannungen addieren sich zu 2 ${V0()}.`),
    S3: () => L(`The three batteries are in series: their voltages add up to 3 ${V0()}.`, `Die drei Batterien sind in Serie: Ihre Spannungen addieren sich zu 3 ${V0()}.`),
    S4: () => L(`The four batteries are in series: their voltages add up to 4 ${V0()}.`, `Die vier Batterien sind in Serie: Ihre Spannungen addieren sich zu 4 ${V0()}.`),
    R2: () => L('One battery is connected the other way round, so the two voltages cancel: 0.', 'Eine Batterie ist verkehrt herum angeschlossen, also heben sich die zwei Spannungen auf: 0.'),
    R3: () => L(`One battery is connected the other way round and cancels one of the others: ${V0()} in total.`, `Eine Batterie ist verkehrt herum angeschlossen und hebt eine der anderen auf: insgesamt ${V0()}.`),
    R4: () => L(`One of the four batteries is connected the other way round and cancels one of the others: 2 ${V0()} in total.`, `Eine der vier Batterien ist verkehrt herum angeschlossen und hebt eine der anderen auf: insgesamt 2 ${V0()}.`),
  };

  // One reasoning step on the way from the batteries to a bulb.
  function stepText(s) {
    const part = name(s.part), others = s.others || s.group.kids.filter((k) => k !== s.part);
    if (s.kind === 'bridged') return L(`${part} is bridged by a wire, so there is no voltage across it`, `${part} ist durch einen Draht überbrückt, also liegt daran keine Spannung an`);
    if (s.kind === 'parallel') return L(`${part} is in parallel with ${names(others)}, so it gets the same voltage`, `${part} ist parallel zu ${names(others, 'dat')}, bekommt also dieselbe Spannung`);
    if (s.n === 1) return L(`the rest of its chain is bridged by a wire, so ${part} gets all of the voltage`, `der Rest der Serieschaltung ist überbrückt, also bekommt ${part} die ganze Spannung`);
    if (s.why === 'equal') return L(`${part} and ${names(others)} are identical and in series, so they share the voltage equally (voltage divider): ${part} gets 1/${s.n} of it`,
      `${part} und ${names(others)} sind gleich und in Serie, teilen sich die Spannung also gleichmässig (Spannungsteiler): ${part} bekommt 1/${s.n} davon`);
    if (s.why === 'larger') return L(`${part} (${kind(s.part)}) would let less current through than ${names(others)} (${and(others.map(kind))}) at the same voltage, but in series the same current flows through every part, so ${part} takes the larger share of the voltage (voltage divider): more than 1/${s.n}`,
      `${part} (${kind(s.part)}) würde bei gleicher Spannung weniger Strom durchlassen als ${names(others)} (${and(others.map(kind))}), in Serie fliesst aber durch jeden Teil derselbe Strom, also bekommt ${part} den grösseren Teil der Spannung (Spannungsteiler): mehr als 1/${s.n}`);
    if (s.why === 'smaller') return L(`${part} (${kind(s.part)}) would let more current through than ${names(others)} (${and(others.map(kind))}) at the same voltage, but in series the same current flows through every part, so ${part} takes the smaller share of the voltage (voltage divider): less than 1/${s.n}`,
      `${part} (${kind(s.part)}) würde bei gleicher Spannung mehr Strom durchlassen als ${names(others)} (${and(others.map(kind))}), in Serie fliesst aber durch jeden Teil derselbe Strom, also bekommt ${part} den kleineren Teil der Spannung (Spannungsteiler): weniger als 1/${s.n}`);
    return L(`${part} gets part of the voltage`, `${part} bekommt einen Teil der Spannung`);
  }

  // The bounds of a voltage as a statement: “V(L1) is less than V0”, “U(L1) < U0”.
  function relation(V, iv) {
    if (isExact(iv)) return `${V} = ${volts(iv.lo)}`;
    if (isZero(iv.lo)) return L(`${V} is less than ${volts(iv.hi)}`, `${V} &lt; ${volts(iv.hi)}`);
    if (cmp(iv.hi, ex.E) === 0) return L(`${V} is more than ${volts(iv.lo)}`, `${V} &gt; ${volts(iv.lo)}`);
    return L(`${V} is between ${volts(iv.lo)} and ${volts(iv.hi)}`, `${volts(iv.lo)} &lt; ${V} &lt; ${volts(iv.hi)}`);
  }
  // The same bounds as a phrase: “more than V0”.
  function gets(iv) {
    if (isExact(iv)) return L(`exactly ${volts(iv.lo)}`, `genau ${volts(iv.lo)}`);
    if (isZero(iv.lo)) return L(`less than ${volts(iv.hi)}`, `weniger als ${volts(iv.hi)}`);
    if (cmp(iv.hi, ex.E) === 0) return L(`more than ${volts(iv.lo)}`, `mehr als ${volts(iv.lo)}`);
    return L(`between ${volts(iv.lo)} and ${volts(iv.hi)}`, `zwischen ${volts(iv.lo)} und ${volts(iv.hi)}`);
  }

  function explain(b) {
    if (isZero(ex.E)) return L(`${it(b.name)}: no current flows, so <b>off</b>.`, `${it(b.name)}: Es fliesst kein Strom, also <b>aus</b>.`);
    const steps = b.steps.map(stepText);
    const bridged = b.steps.find((s) => s.kind === 'bridged');
    const chain = bridged ? [stepText(bridged)] : steps;
    return `${it(b.name)}: ${chain.length ? cap(chain.join('; ')) + '. ' : ''}${L('So', 'Somit gilt')} ${relation(Vof(b.name), b.iv)}: <b>${WORDS()[b.answer]}</b>.`;
  }

  // Hints from general to specific, all taken from the worked solution: the batteries, how the
  // circuit is built, the voltage divider for the whole circuit, and the full reasoning for the
  // bulb that needs the most steps (without the answer).
  function hints() {
    const out = [`${PACK_TEXT[ex.packKey]()} ${L(`The reference bulb gets ${V0()}, so compare each bulb's voltage with ${V0()}.`, `Die Vergleichslampe bekommt ${V0()}, vergleiche also die Spannung jeder Lampe mit ${V0()}.`)}`];
    if (isZero(ex.E)) return [...out, L('With no voltage, no current flows anywhere.', 'Ohne Spannung fliesst nirgends Strom.')];
    out.push(`${L('How the circuit is built', 'So ist die Schaltung aufgebaut')}: ${structure().join('; ')}.`);

    const top = ex.load, live = top.kids.filter((k) => k.iv && !(isExact(k.iv) && isZero(k.iv.lo)));
    if (top.t === 'P') {
      out.push(L(`All branches are connected directly to the batteries, so each branch gets the full ${volts(ex.E)} (parallel parts have the same voltage).`,
        `Alle Zweige sind direkt mit den Batterien verbunden, also bekommt jeder Zweig die vollen ${volts(ex.E)} (parallele Teile haben dieselbe Spannung).`));
    } else {
      const step = ex.bulbs.map((b) => b.steps[0]).find((s) => s && s.kind === 'series' && s.why !== 'some');
      const shares = live.map((k) => L(`${name(k)} gets ${gets(k.iv)}`, `${name(k)} bekommt ${gets(k.iv)}`));
      out.push(L(`Voltage divider for the whole circuit (the parts in series share ${volts(ex.E)}): ${step ? stepText(step) + '. ' : ''}So ${and(shares)}.`,
        `Spannungsteiler für die ganze Schaltung (die Teile in Serie teilen sich ${volts(ex.E)}): ${step ? cap(stepText(step)) + '. ' : ''}Also: ${and(shares)}.`));
    }

    const deep = ex.bulbs.filter((b) => !b.shorted).sort((x, y) => y.steps.length - x.steps.length)[0];
    if (deep && deep.steps.length >= 2) {
      out.push(L(`For ${it(deep.name)}: ${deep.steps.map(stepText).join('; ')}. So ${relation(Vof(deep.name), deep.iv)}. Is that more or less than ${V0()}?`,
        `Für ${it(deep.name)}: ${cap(deep.steps.map(stepText).join('; '))}. Somit gilt ${relation(Vof(deep.name), deep.iv)}. Ist das mehr oder weniger als ${V0()}?`));
    }
    return out;
  }

  function solution() {
    return `<p>${L('The bulbs are not ohmic resistors (their resistance grows as they heat up), so we do not calculate with resistances. What we can use: identical bulbs behave identically, and a bulb lets more current through the more voltage it gets. ',
      'Die Lampen sind keine ohmschen Widerstände (ihr Widerstand wächst, wenn sie warm werden), darum rechnen wir nicht mit Widerständen. Was wir verwenden können: Gleiche Lampen verhalten sich gleich, und eine Lampe lässt umso mehr Strom durch, je mehr Spannung sie bekommt. ')}` +
      `${L(`The reference bulb gets ${V0()}; a bulb with more voltage is brighter, one with less is less bright.`, `Die Vergleichslampe bekommt ${V0()}; eine Lampe mit mehr Spannung leuchtet heller, eine mit weniger leuchtet weniger hell.`)}</p>` +
      `<p>${PACK_TEXT[ex.packKey]()}</p><ul>${ex.bulbs.map((b) => `<li>${explain(b)}</li>`).join('')}</ul>`;
  }

  // What a wrong answer suggests, by misconception (see diagnose() in generator.js). nudge: a hint
  // that does not give the brightness away, while the exercise is open (not in the check).
  function why(code, b, nudge = !!st && !st.solved && !st.revealed) {
    const exact = (c) => isExact(c.iv) && isExact(b.iv) && cmp(c.iv.lo, b.iv.lo) === 0;
    const same = ex.bulbs.find((c) => c !== b && (exact(c) || sameSpot(ex, b, c)));
    if (nudge) {
      const nudge = {
        short: L(`Follow the wires around ${it(b.name)}: does the current have to pass through it?`, `Verfolge die Drähte um ${it(b.name)}: Muss der Strom durch sie hindurch?`),
        reversed: L('Look at the batteries: are they all connected the same way round?', 'Schau die Batterien an: Sind alle gleich herum angeschlossen?'),
        same: L(`The current is not used up by the first bulb it passes: compare the voltage across ${it(b.name)} with those across the other bulbs.`, `Der Strom wird von der ersten Lampe nicht verbraucht: Vergleiche die Spannung an ${it(b.name)} mit denen an den anderen Lampen.`),
      }[code];
      if (nudge) return nudge;
    }
    return {
      short: L(`${it(b.name)} is bridged by a wire. The current takes the wire, so there is no voltage across ${it(b.name)}: it is off.`,
        `${it(b.name)} ist durch einen Draht überbrückt. Der Strom nimmt den Draht, also liegt an ${it(b.name)} keine Spannung an: Sie ist aus.`),
      reversed: isZero(ex.E)
        ? L('One battery is connected the other way round: the two voltages cancel, so no current flows.', 'Eine Batterie ist verkehrt herum angeschlossen: Die zwei Spannungen heben sich auf, also fliesst kein Strom.')
        : L('One battery is connected the other way round: its voltage counts negative and cancels one of the others.', 'Eine Batterie ist verkehrt herum angeschlossen: Ihre Spannung zählt negativ und hebt eine der anderen auf.'),
      fixedCurrent: L('A battery does not deliver a fixed current; it keeps a fixed voltage. Bulbs in parallel each get the full voltage of their branch; bulbs in series share it (voltage divider).',
        'Eine Batterie liefert keinen festen Strom, sondern eine feste Spannung. Lampen in parallelen Zweigen bekommen je die volle Spannung ihres Zweigs; Lampen in Serie teilen sie sich (Spannungsteiler).'),
      same: L(`${it(b.name)} gets the same voltage as ${it(same ? same.name : '')}, so they are equally bright. The current is not used up by the first bulb it passes.`,
        `${it(b.name)} bekommt dieselbe Spannung wie ${it(same ? same.name : '')}, also leuchten sie gleich hell. Der Strom wird von der ersten Lampe nicht verbraucht.`),
      other: L(`Work out the voltage across ${it(b.name)} with the voltage divider: which share of the battery voltage does it get?`,
        `Bestimme die Spannung an ${it(b.name)} mit dem Spannungsteiler: Welchen Teil der Batteriespannung bekommt sie?`),
    }[code];
  }

  // The text helpers read the exercise from ex; with(e, f) runs f for another exercise.
  function withEx(e, f) {
    const saved = ex;
    ex = e;
    try { return f(); } finally { ex = saved; }
  }

  // ---------------------------------------------------------------- rendering
  const ref = (glow) => circuit({ t: 'L', i: 0 }, { t: 'B', dir: 1 }, () => ({ label: svgName('L0'), glow }));
  // `glows[i]` is the answer shown for bulb i (none: unlit).
  // asked: the names of the bulbs to mark (the ones a check question is about)
  const taskOf = (e, glows, asked = []) => circuit(clone(e.load), clone(e.pack), (i) => ({ label: svgName(e.bulbs[i].name), glow: GLOW[glows[i]] || 0, asked: asked.includes(e.bulbs[i].name) }));
  const drawAnswers = () => { $('#figure').innerHTML = taskOf(ex, answers()); };
  const starsOf = (d) => `<span class="stars" role="img" aria-label="${ui().stars(d)}" title="${ui().stars(d)}">${'★'.repeat(d)}${'☆'.repeat(5 - d)}</span>`;

  function render() {
    $('#title').innerHTML = `${ui().task} ${starsOf(ex.difficulty)}`;
    $('#ref').innerHTML = ref(GLOW.equal);
    $('#figure').innerHTML = taskOf(ex, []);
    $('#fields').innerHTML = ex.bulbs.map((b) => `
      <div class="field" data-name="${b.name}">
        <span class="name">${it(b.name)}</span>
        <span class="choices" role="radiogroup" aria-label="${b.name}">${ANSWERS.map((a) => `
          <label><input type="radio" name="ans-${b.name}" value="${a}"><span>${WORDS()[a]}</span></label>`).join('')}
        </span>
        <span class="fb"></span>
      </div>`).join('');
    $('#hint-list').innerHTML = '';
    $('#hints').hidden = true;
    $('#solution').hidden = true;
    $('#status').textContent = '';
    $('#status').className = 'status';
    $('#feedback').innerHTML = '';
    updateButtons();
  }

  const answers = () => ex.bulbs.map((b) => (document.querySelector(`input[name="ans-${b.name}"]:checked`) || {}).value);

  // ---------------------------------------------------------------- exercise lifecycle
  const newSeed = () => 1 + Math.floor(Math.random() * 999999);
  // solved now, or solved before (its solution can be looked at again)
  const canReveal = () => st.solved || Practice.solvedBefore(PRACTICE, ex.id) || st.hints >= ex.hints.length || st.tries >= MAX_TRIES;

  // Practice comes back more often to the types of exercise that were hard (shared practice.js).
  const PRACTICE = 'bb', typeOf = (e) => e.ptype || `${e.packKey}-d${e.difficulty}`;
  // The kind of an exercise, as in the tutor: a battery the other way round, a bulb bridged by a
  // wire, else only series, only parallel, or both (mixed).
  const hasWire = (n) => n.t === 'W' || (n.kids || []).some(hasWire);
  function kindOf(e) {
    if (e.packKey[0] === 'R') return 'reversed';
    if (hasWire(e.load)) return 'bridged';
    const l = e.load;
    if (l.kids && l.kids.every((k) => k.t === 'L')) return l.t === 'S' ? 'series' : 'parallel';
    return 'mixed';
  }
  // An exercise of a practice type 'kind:level' (e.g. 'bridged:medium'): the first of that level,
  // from the seed on, of that kind.
  function ofType(type, seed) {
    const [kind, lv] = type.split(':');
    for (let k = 0; ; k++) {
      const e = generate(lv, seed * 1000 + k);
      if (kindOf(e) === kind || k >= 5000) { e.ptype = type; return e; }
    }
  }
  const finish = () => { if (ex && st) Practice.finish(PRACTICE, typeOf(ex), st); };

  function open(exercise) {
    finish(); // the student moves on
    ex = exercise;
    ex.hints = hints();
    st = { tries: 0, hints: 0, solved: false, revealed: false, codes: null };
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

  // Marks the bulbs and explains the wrong answers, one message per misconception.
  function showFeedback() {
    const codes = st.codes, status = $('#status');
    if (!codes) return;
    codes.forEach((c, i) => { document.querySelector(`.field[data-name="${ex.bulbs[i].name}"]`).className = `field ${c === 'right' ? 'ok' : 'bad'}`; });
    const right = codes.filter((c) => c === 'right').length;
    if (right === codes.length) {
      status.textContent = ui().ok + (st.advance ? ` ${st.advance}` : '');
      status.className = 'status ok';
    } else {
      status.textContent = ui().some(right, codes.length, st.tries) + (canReveal() ? ui().canReveal : ui().tryAgain);
      status.className = 'status bad';
    }
    const seen = new Map();
    codes.forEach((c, i) => {
      if (c === 'right') return;
      const key = ['short', 'same', 'other'].includes(c) ? `${c}-${i}` : c;
      if (!seen.has(key)) seen.set(key, { c, bulbs: [] });
      seen.get(key).bulbs.push(ex.bulbs[i]);
    });
    $('#feedback').innerHTML = [...seen.values()]
      .map(({ c, bulbs }) => `<li><b>${and(bulbs.map((b) => it(b.name)))}</b>: ${why(c, bulbs[0])}</li>`).join('');
  }

  function check() {
    if (st.solved) { fresh(); return; } // the button reads New exercise
    const given = answers();
    if (given.some((a) => !a)) {
      $('#status').textContent = ui().choose;
      $('#status').className = 'status';
      return;
    }
    st.tries++;
    st.codes = diagnose(ex, given);
    if (st.codes.every((c) => c === 'right')) {
      if (!st.solved && !st.revealed) {
        const s = stored('bb-score', { solved: 0, clean: 0 });
        s.solved++;
        if (st.tries === 1 && st.hints === 0) s.clean++;
        store('bb-score', s);
        showScore();
      }
      st.solved = true;
      Practice.markSolved(PRACTICE, ex.id);
      finish();
      st.advance = topics.solved(st, ex);
    }
    showFeedback();
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

  function showSolution() {
    $('#sol-figure').innerHTML = `<figure class="fig ref">${ref(GLOW.equal)}<figcaption>${ui().reference}</figcaption></figure>` +
      `<figure class="fig">${taskOf(ex, ex.bulbs.map((b) => b.answer))}<figcaption>${ui().yours}</figcaption></figure>`;
    $('#sol-text').innerHTML = solution();
    $('#solution').hidden = false;
  }
  function reveal() {
    if (!canReveal()) return;
    st.revealed = true;
    finish();
    showFeedback(); // now with the full explanations
    showSolution();
    updateButtons();
    $('#solution').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---------------------------------------------------------------- tutor
  // Worked examples: the batteries, then the circuit from the outside in (each group shares its
  // voltage among its parts), then the brightness of every bulb.
  const Lb = () => ({ t: 'L' }), Wire = () => ({ t: 'W' });
  const Ser = (...kids) => ({ t: 'S', kids }), Par = (...kids) => ({ t: 'P', kids });
  const LESSONS = [
    { name: () => L('Series', 'Serie'), pack: '1', practice: [{ types: ['series:easy'] }], load: () => Ser(Lb(), Lb()),
      idea: () => L('Two identical bulbs in series on one battery share its voltage equally.', 'Zwei gleiche Lampen in Serie an einer Batterie teilen sich deren Spannung gleichmässig.') },
    { name: () => L('Parallel', 'Parallel'), pack: '1', practice: [{ types: ['parallel:easy'] }], load: () => Par(Lb(), Lb()),
      idea: () => L('Bulbs in parallel each get the full voltage of the battery, however many branches there are.', 'Parallele Lampen bekommen je die volle Spannung der Batterie, egal wie viele Zweige es sind.') },
    { name: () => L('Mixed', 'Gemischt'), pack: 'S2', practice: [{ types: ['mixed:medium'] }, { name: () => L('more bulbs', 'mehr Lampen'), types: ['mixed:hard'] }], load: () => Ser(Lb(), Par(Lb(), Lb())),
      idea: () => L('Two batteries in series double the voltage. A bulb in series with a parallel pair takes the larger share: at the same voltage the pair would let more current through, but in series both carry the same current.',
        'Zwei Batterien in Serie verdoppeln die Spannung. Eine Lampe in Serie mit einem parallelen Paar bekommt den grösseren Teil: Bei gleicher Spannung würde das Paar mehr Strom durchlassen, in Serie fliesst aber durch beide derselbe Strom.') },
    { name: () => L('Bridged', 'Überbrückt'), pack: '1', practice: [{ types: ['bridged:medium'] }, { name: () => L('more bulbs', 'mehr Lampen'), types: ['bridged:hard'] }], load: () => Ser(Lb(), Par(Lb(), Wire())),
      idea: () => L('A wire across a bulb takes all the current: the bridged bulb goes off, and the rest of the circuit gets the whole voltage.',
        'Ein Draht parallel zu einer Lampe nimmt den ganzen Strom: Die überbrückte Lampe geht aus, und der Rest der Schaltung bekommt die ganze Spannung.') },
    { name: () => L('Reversed', 'Verkehrt herum'), pack: 'R3', practice: [{ types: ['reversed:medium'] }, { name: () => L('more bulbs', 'mehr Lampen'), types: ['reversed:hard'] }], load: () => Par(Lb(), Ser(Lb(), Lb())),
      idea: () => L('A battery connected the other way round cancels one of the others.', 'Eine verkehrt herum angeschlossene Batterie hebt eine der anderen auf.') },
  ];

  // Voltage bounds as a note in the diagram (plain text).
  const vs = (f) => { const v0 = L('V₀', 'U₀'); return isZero(f) ? '0' : cmp(f, ONE) === 0 ? v0 : `${ftext(f)} ${v0}`; };
  function noteOf(iv, E) {
    const V = L('V', 'U');
    if (isExact(iv)) return `${V} = ${vs(iv.lo)}`;
    if (isZero(iv.lo)) return `${V} < ${vs(iv.hi)}`;
    if (cmp(iv.hi, E) === 0) return `${V} > ${vs(iv.lo)}`;
    return `${vs(iv.lo)} < ${V} < ${vs(iv.hi)}`;
  }
  const zero = (iv) => isExact(iv) && isZero(iv.lo);
  const SHORT = () => ({ brighter: L('brighter', 'heller'), equal: L('equal', 'gleich'), dimmer: L('dimmer', 'weniger'), off: L('off', 'aus') }); // fits under a bulb
  // Shown larger than in the exercises: the notes are small otherwise.
  const larger = (svg, k) => svg.replace(/width="([\d.]+)" height="([\d.]+)"/, (m, w, h) => `width="${(w * k).toFixed(1)}" height="${(h * k).toFixed(1)}"`);

  function lesson(def) {
    const e = make(def.pack, def.load(), 'tutor', 'tutor');
    return withEx(e, () => {
      const frames = [], notes = new Map(); // bulb index → note shown from now on
      const figure = (o = {}) => {
        const look = (i) => ({ label: svgName(e.bulbs[i].name), glow: o.lit ? GLOW[e.bulbs[i].answer] : 0,
          note: o.lit ? SHORT()[e.bulbs[i].answer] : notes.get(i), hl: o.hl && o.hl.has(i), noteCls: o.lit ? '' : 'v' });
        const reference = circuit({ t: 'L', i: 0 }, { t: 'B', dir: 1 },
          () => ({ label: svgName('L0'), glow: o.lit ? GLOW.equal : 0, note: o.ref ? `${L('V', 'U')} = ${L('V₀', 'U₀')}` : '', noteCls: 'v' }), { zones: new Map() });
        const task = larger(circuit(e.load, e.pack, look, { zones: o.zones || new Map(), captions: o.captions, bat: o.bat }), 1.3);
        return `<div class="figs"><figure class="fig ref">${reference}<figcaption>${ui().reference}</figcaption></figure>` +
          `<figure class="fig">${task}<figcaption>${ui().circuit}</figcaption></figure></div>`;
      };
      const frame = (title, text, o) => frames.push({ text: `<p class="step-rule">${title}</p>${text}`, figure: figure(o) });

      frame(L('The task', 'Die Aufgabe'), L(`<p>All batteries are identical, and so are all bulbs. How bright is each bulb, compared with the reference bulb <i>L</i><sub>0</sub> on one battery?</p><p>A bulb is the brighter, the more voltage it gets. So we find the voltage across every bulb and compare it with the voltage ${V0()} of the reference bulb.</p>`,
        `<p>Alle Batterien sind gleich, ebenso alle Lampen. Wie hell leuchtet jede Lampe, verglichen mit der Vergleichslampe <i>L</i><sub>0</sub> an einer Batterie?</p><p>Eine Lampe leuchtet umso heller, je mehr Spannung sie bekommt. Wir bestimmen also die Spannung an jeder Lampe und vergleichen sie mit der Spannung ${V0()} der Vergleichslampe.</p>`));
      frame(L('The batteries', 'Die Batterien'), `<p>${PACK_TEXT[e.packKey]()} ${L(`The reference bulb gets ${V0()}.`, `Die Vergleichslampe bekommt ${V0()}.`)}</p>`, { bat: 'strong', ref: true });

      // Groups from the outside in; a group without voltage is not taken apart any further.
      const queue = [e.load];
      while (queue.length) {
        const node = queue.shift();
        const parts = node.kids.filter((k) => k.t !== 'W');
        const zones = new Map([[node, 'light']]), captions = new Map(), hl = new Set();
        // Identical parts (and no wire): one sentence for all of them.
        const alike = parts.length === node.kids.length && parts.every((k) => canonOf(k) === canonOf(parts[0]));
        const lines = alike ? [] : parts.map((k) => {
          if (zero(k.iv)) {
            const bs = bulbsIn(k), many = bs.length > 1, list = cap(and(bs.map((b) => it(`L${b.i + 1}`))));
            bs.forEach((b) => notes.set(b.i, `${L('V', 'U')} = 0`));
            return L(`${list} ${many ? 'are' : 'is'} bridged by a wire: the current takes the wire, so there is no voltage across ${many ? 'them' : 'it'}.`,
              `${list} ${many ? 'sind' : 'ist'} durch einen Draht überbrückt: Der Strom nimmt den Draht, also liegt daran keine Spannung an.`);
          }
          const step = e.bulbs.flatMap((b) => b.steps).find((s) => s.part === k && s.group === node);
          if (k.t === 'L') { hl.add(k.i); notes.set(k.i, noteOf(k.iv, e.E)); }
          else { zones.set(k, 'strong'); captions.set(k, noteOf(k.iv, e.E)); queue.push(k); }
          if (step.kind === 'series' && step.n === 1) return L(`Everything else in series with ${name(k)} is bridged, so ${name(k)} gets all of the voltage: ${gets(k.iv)}.`,
            `Alles andere in Serie mit ${name(k, 'dat')} ist überbrückt, also bekommt ${name(k)} die ganze Spannung: ${gets(k.iv)}.`);
          return `${cap(stepText(step))}. ${L(`So ${name(k)} gets ${gets(k.iv)}.`, `Also bekommt ${name(k)} ${gets(k.iv)}.`)}`;
        });
        if (alike) {
          parts.forEach((k) => {
            if (k.t === 'L') { hl.add(k.i); notes.set(k.i, noteOf(k.iv, e.E)); } else { zones.set(k, 'strong'); captions.set(k, noteOf(k.iv, e.E)); queue.push(k); }
          });
          const list = cap(and(parts.map((k) => name(k))));
          lines.push(node.t === 'P'
            ? L(`${list} are in parallel, so each of them gets the full voltage of ${node === e.load ? 'the batteries' : name(node)}: ${gets(node.iv)}.`,
              `${list} sind parallel, also bekommt jeder Teil die volle Spannung ${node === e.load ? 'der Batterien' : `von ${name(node, 'dat')}`}: ${gets(node.iv)}.`)
            : L(`${list} are identical and in series, so they share the voltage equally (voltage divider): each gets 1/${parts.length} of it, ${gets(parts[0].iv)}.`,
              `${list} sind gleich und in Serie, teilen sich die Spannung also gleichmässig (Spannungsteiler): Jeder Teil bekommt 1/${parts.length} davon, ${gets(parts[0].iv)}.`));
        }
        parts.forEach((k) => { if (zero(k.iv) && k.t !== 'L') zones.set(k, 'strong'); if (zero(k.iv) && k.t === 'L') hl.add(k.i); });
        const how = node.t === 'S' ? L('in series', 'in Serie') : L('in parallel', 'parallel');
        const whole = node === e.load
          ? L(`<p>The whole circuit gets ${volts(e.E)} from the batteries. It is made of ${and(parts.map((k) => name(k)))}, ${how}.</p>`,
            `<p>Die ganze Schaltung bekommt ${volts(e.E)} von den Batterien. Sie besteht aus ${and(parts.map((k) => name(k, 'dat')))}, ${how}.</p>`)
          : L(`<p>${cap(name(node))} gets ${gets(node.iv)}. Inside it, ${and(parts.map((k) => name(k)))} are ${how}.</p>`,
            `<p>${cap(name(node))} bekommt ${gets(node.iv)}. Darin sind ${and(parts.map((k) => name(k)))} ${how}.</p>`);
        frame(node === e.load ? L('The whole circuit', 'Die ganze Schaltung') : L(`Inside ${name(node)}`, `In ${name(node, 'dat')}`), whole + lines.map((l) => `<p>${l}</p>`).join(''), { zones, captions, hl });
      }

      // “is less than V0” already compares with V0; otherwise say how the bounds compare.
      const REL = {
        brighter: L(`, more than ${V0()}`, `, also mehr als ${V0()}`), equal: '',
        dimmer: L(`, less than ${V0()}`, `, also weniger als ${V0()}`), off: L(', so no current flows', ', also fliesst kein Strom'),
      };
      const direct = (iv) => !isExact(iv) && ((isZero(iv.lo) && cmp(iv.hi, ONE) === 0) || (cmp(iv.hi, e.E) === 0 && cmp(iv.lo, ONE) === 0));
      const rows = e.bulbs.map((b) => `<li>${relation(Vof(b.name), b.iv)}${direct(b.iv) ? '' : REL[b.answer]}: <b>${WORDS()[b.answer]}</b></li>`);
      frame(L('Brightness', 'Helligkeit'), `<p>${L(`Compare every bulb's voltage with ${V0()}:`, `Vergleiche die Spannung jeder Lampe mit ${V0()}:`)}</p><ul>${rows.join('')}</ul>`, { lit: true });
      return frames;
    });
  }
  const lessons = () => LESSONS.map((l, i) => ({ name: l.name(), idea: l.idea(), also: topics.also(i), frames: () => lesson(l) }));

  // ---------------------------------------------------------------- check
  // The learning objectives (check.js), each with the question kinds it is asked about, its worked
  // example and its practice topic (LESSONS). A kind is a practice type ('mixed:hard'): how bright
  // one bulb is compared with the reference bulb; or 'pair:' and a practice type: how bright one
  // bulb is compared with another one in series with it, on the other side of a bulb or a group.
  const OBJECTIVES = [
    { id: 'current', kinds: ['pair:series:easy', 'pair:mixed:hard', 'pair:bridged:hard'], tutor: 0, topic: 0,
      name: () => L('Explain that the current is the same before and after a bulb or a group of bulbs: it is not used up.',
        'Erklären, dass der Strom vor und nach einer Lampe oder einer Gruppe von Lampen gleich gross ist: Er wird nicht verbraucht.') },
    { id: 'power', kinds: ['mixed:medium', 'mixed:hard', 'reversed:medium'], tutor: 2, topic: 2,
      name: () => L('Rank the brightness of bulbs by their power ΔV · I.', 'Die Helligkeit von Lampen nach ihrer Leistung ΔU · I ordnen.') },
    { id: 'change', kinds: ['series:easy', 'parallel:easy', 'bridged:medium'], tutor: 3, topic: 3,
      name: () => L('Predict how the brightness changes when a bulb is added, removed or short-circuited, in series or in parallel.',
        'Vorhersagen, wie sich die Helligkeit ändert, wenn eine Lampe in Serie oder parallel dazukommt, wegfällt oder überbrückt wird.') },
  ];

  // Two bulbs in the same chain, in identical positions, with current through them (generator.js
  // sameSpot): [b, c], preferring two with a bulb or a group between them.
  function pairOf(e) {
    if (isZero(e.E)) return null;
    const pairs = e.bulbs.flatMap((b, i) => e.bulbs.slice(i + 1).filter((c) => !b.shorted && b.steps.length &&
      b.steps[b.steps.length - 1].kind === 'series' && sameSpot(e, b, c)).map((c) => [b, c]));
    const at = (x) => e.bulbs.indexOf(x);
    return pairs.find(([b, c]) => at(c) - at(b) > 1) || pairs[0] || null;
  }

  // The bulb most worth asking about: one a misconception gets wrong, if there is one. Wrong
  // options stem from a misconception when that misconception predicts them for this bulb.
  function bulbQuestion(type, seed) {
    const e = ofType(type, seed);
    const r = (seed * 2654435761 >>> 0) / 4294967296;
    const tricky = e.bulbs.filter((b) => b.shorted || (e.reversed && b.models.forward !== b.answer) || b.models.fixedCurrent !== b.answer);
    const pool = tricky.length ? tricky : e.bulbs, b = pool[Math.floor(r * pool.length)];
    const flagOf = (a) => (b.shorted && a !== 'off' ? 'short' : e.reversed && a === b.models.forward ? 'reversed' : a === b.models.fixedCurrent ? 'fixedCurrent' : null);
    return withEx(e, () => ({
      title: ui().task,
      key: `${e.packKey} ${canonOf(e.load)}`, // the same circuit counts as a repeat, whichever bulb is asked
      // a plain paragraph: the check's list of questions catches the toggling of any <details> in it
      text: `<p>${ui().taskText}</p>`,
      figure: `<figure class="fig ref">${ref(GLOW.equal)}<figcaption>${ui().reference}</figcaption></figure><figure class="fig">${taskOf(e, [], [b.name])}</figure>`,
      ask: L(`How bright is ${it(b.name)} compared with the reference bulb?`, `Wie hell leuchtet ${it(b.name)} im Vergleich zur Vergleichslampe?`),
      options: ANSWERS.map((a) => {
        const flag = a === b.answer ? null : flagOf(a);
        return { html: WORDS()[a], correct: a === b.answer, flag, why: why(flag || 'other', b, false) };
      }),
      explain: () => withEx(e, () => `<div class="figs"><figure class="fig ref">${ref(GLOW.equal)}<figcaption>${ui().reference}</figcaption></figure>` +
        `<figure class="fig">${taskOf(e, e.bulbs.map((x) => x.answer), [b.name])}</figure></div><div class="steps">${solution()}</div>`),
    }));
  }

  // Two bulbs in series, on either side of a bulb or a group: equally bright. Brighter or less
  // bright is what a current used up along the way would give (whichever way it flows).
  function pairQuestion(type, seed) {
    let e = null, p = null;
    for (let k = 0; k < 200 && !p; k++) { e = ofType(type, seed + 7919 * k); p = pairOf(e); }
    const [b, c] = p;
    return withEx(e, () => ({
      title: L('Two bulbs in series', 'Zwei Lampen in Serie'),
      key: `pair ${e.packKey} ${canonOf(e.load)}`,
      text: `<p>${L('All batteries are identical, and so are all bulbs.', 'Alle Batterien sind gleich, ebenso alle Lampen.')}</p>`,
      figure: `<figure class="fig">${taskOf(e, [], [b.name, c.name])}</figure>`,
      ask: L(`How bright is ${it(c.name)} compared with ${it(b.name)}?`, `Wie hell leuchtet ${it(c.name)} im Vergleich zu ${it(b.name)}?`),
      options: ANSWERS.map((a) => {
        const flag = a === 'brighter' || a === 'dimmer' ? 'used' : null;
        return { html: WORDS()[a], correct: a === 'equal', flag, why: why('same', c, false) };
      }),
      explain: () => withEx(e, () => `<div class="figs"><figure class="fig">${taskOf(e, e.bulbs.map((x) => x.answer), [b.name, c.name])}</figure></div>` +
        `<p>${L(`${it(b.name)} and ${it(c.name)} are in series: the same current flows through both of them, before and after the parts between them. The current is not used up on the way; what the bulbs turn into light and heat is energy, at the rate <i>P</i> = Δ<i>V</i> · <i>I</i>. Identical bulbs with the same current get the same voltage, so they have the same power: they are <b>equally bright</b>.`,
          `${it(b.name)} und ${it(c.name)} sind in Serie: Durch beide fliesst derselbe Strom, vor und nach den Teilen dazwischen. Der Strom wird unterwegs nicht verbraucht; was die Lampen in Licht und Wärme umwandeln, ist Energie, mit der Leistung <i>P</i> = Δ<i>U</i> · <i>I</i>. Gleiche Lampen mit demselben Strom bekommen dieselbe Spannung, haben also dieselbe Leistung: Sie leuchten <b>gleich hell</b>.`)}</p>` +
        `<div class="steps">${solution()}</div>`),
    }));
  }

  const checkSource = {
    id: 'bb',
    objectives: OBJECTIVES,
    question: (kind, seed) => (kind.startsWith('pair:') ? pairQuestion(kind.slice(5), seed) : bulbQuestion(kind, seed)),
    concept: { short: 'short', reversed: 'reversed', fixedCurrent: 'current', used: 'used' },
    concepts: () => ({
      short: L('a bridged bulb still lights', 'eine überbrückte Lampe leuchtet noch'),
      reversed: L('a reversed battery ignored', 'eine verkehrte Batterie übersehen'),
      current: L('the battery as a source of fixed current', 'die Batterie als Quelle eines festen Stroms'),
      used: L('the current used up along the circuit', 'der Strom wird im Stromkreis verbraucht'),
    }),
  };

  // ---------------------------------------------------------------- language
  function applyStatic() {
    document.title = ui().title;
    Lang.apply(ui());
    if (topics) topics.relabel();
  }

  // The same exercise in the other language, with the answers, feedback, hints and solution kept.
  function switchLang() {
    applyStatic();
    showScore();
    if (ex) {
      const given = answers(), keep = st;
      ex.hints = hints();
      render();
      st = keep;
      ex.bulbs.forEach((b, i) => { if (given[i]) document.querySelector(`input[name="ans-${b.name}"][value="${given[i]}"]`).checked = true; });
      drawAnswers();
      showFeedback();
      showHints();
      if (st.revealed) showSolution();
      if ($('#task').hidden) { $('#hints').hidden = true; $('#solution').hidden = true; }
      updateButtons();
    }
    tutor.relabel(lessons());
    checker.relabel();
  }

  // ---------------------------------------------------------------- modes
  // Practice: random exercises; tutor: worked examples; check: a short test on the learning
  // objectives (check.js). Hints and solution belong to practice.
  const mode = () => (document.querySelector('input[name="mode"]:checked') || {}).value || 'practice';
  function setMode(m) {
    document.querySelector(`input[name="mode"][value="${m}"]`).checked = true;
    store('bb-mode', m);
    document.querySelectorAll('.practice').forEach((el) => { el.hidden = m !== 'practice'; });
    $('#tutor').hidden = m !== 'tutor';
    $('#ck').hidden = m !== 'check';
    if (m !== 'practice') { $('#hints').hidden = true; $('#solution').hidden = true; }
  }
  function practise() {
    setMode('practice');
    if (ex) { history.replaceState(null, '', `#${ex.id}`); $('#hints').hidden = !st.hints; $('#solution').hidden = !st.revealed; } else fresh();
  }
  function checkMode() {
    setMode('check');
    checker.show();
    if (location.hash !== '#check') history.replaceState(null, '', '#check');
  }

  function fromHash() {
    const h = location.hash.slice(1);
    // the arcade of earlier versions is now the check
    if (h === 'check' || h === 'arcade') { if ($('#ck').hidden) checkMode(); return true; }
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
    m = h.match(/^(easy|medium|hard|mixed)-(\d+)$/);
    if (!m) return false;
    setMode('practice');
    if (!ex || ex.id !== h) open(generate(m[1], Number(m[2])));
    return true;
  }

  // ---------------------------------------------------------------- init
  function init() {
    Lang.init(); // see lang.js
    // The introductions (practice) are open on wide screens and folded on small ones,
    // until opened there; a folded one also hides the reference circuit (class folded, style.css).
    SMALL.addEventListener('change', () => { document.querySelectorAll('details.intro').forEach((d) => { d.open = !SMALL.matches; }); syncFold(); });
    document.addEventListener('toggle', (evt) => { if (evt.target.matches && evt.target.matches('details.intro')) syncFold(); }, true);
    $('#intro').open = !SMALL.matches;
    syncFold();
    document.querySelector('main').insertAdjacentHTML('beforeend', Check.HTML);
    applyStatic();
    Lang.wire(switchLang);
    topics = window.Topics.create({
      app: PRACTICE,
      topics: LESSONS.map((l) => ({ name: l.name, stages: l.practice.map((st) => ({ name: st.name || null, types: st.types })) })),
      make: ofType, typeOf,
      onChange: fresh,
      tutor: (i) => { setMode('tutor'); tutor.open(i); },
    });
    topics.mount($('#levels'));
    $('#new').addEventListener('click', fresh);
    $('#check').addEventListener('click', check);
    $('#hint').addEventListener('click', hint);
    $('#reveal').addEventListener('click', reveal);
    $('#fields').addEventListener('change', drawAnswers);
    window.addEventListener('hashchange', fromHash);
    tutor = window.createTutor(lessons(), { done: practise, practise: (i) => { topics.go(i); setMode('practice'); fresh(); } });
    checker = Check.create(checkSource, {
      math: () => {}, markScrollable: () => {}, stored, store, // no formulas to typeset
      tutor: (i) => { setMode('tutor'); tutor.open(i); },
      practise: (i) => { topics.go(i); setMode('practice'); fresh(); },
    });
    $('#modes').addEventListener('change', () => {
      if (mode() === 'tutor') { setMode('tutor'); tutor.open(tutor.current()); } else if (mode() === 'check') checkMode(); else practise();
    });
    showScore();
    if (fromHash()) return;
    // First visit: start with the first worked example.
    const last = stored('bb-mode', 'tutor');
    if (last === 'tutor') { setMode('tutor'); tutor.open(0); } else if (last === 'check' || last === 'arcade') checkMode(); else { setMode('practice'); fresh(); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
