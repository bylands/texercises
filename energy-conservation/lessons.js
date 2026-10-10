// The tutor's worked examples, on energy bookkeeping: the forms of energy in each state, the
// balance of two states solved with symbols, the path that does not matter, springs, and the
// turning point that is no equilibrium; the last one finds the error in a student's energy table.
// Examples 2 and 7 are the situations A and C of the worksheet “Übungen Energieerhaltung”, solved
// with symbols as there (scenario and parameters as in scenarios.js). Each is a topic of practice
// (topics.js); its stages are situations of scenarios.js or question kinds of concepts.js.
(function (root) {
  'use strict';

  const G = root.EC.G;
  const L = (en, de) => root.EC.L(en, de);
  const frame = (rule, text, figure) => ({ text: `<p class="step-rule">${rule}</p>${text}`, figure: figure || '' });

  const EXAMPLES = [
    {
      scenario: 'fall', formal: true, p: { dir: 'drop', ask: 'v', vk: 'v', V: { g: G, h: 5, v: Math.sqrt(2 * G * 5) } },
      practice: [{ types: ['fall'] }, { en: 'bar charts', de: 'Balkendiagramme', types: ['bars', 'forms'] }, { en: 'thrown from a tower', de: 'vom Turm geworfen', types: ['tower'] }],
      name: { en: 'The method', de: 'Das Vorgehen' },
      idea: { en: 'Initial and final state, the energy of each, equate the sums, solve with symbols, then insert numbers.', de: 'Anfangs- und Endzustand, die Energie jedes Zustands, Summen gleichsetzen, mit Symbolen auflösen, dann Zahlen einsetzen.' },
      more: (ex) => [frame(L('The method', 'Das Vorgehen'), `<ol class="method"><li>${L('Choose the initial and the final state, and the zero level of the potential energy.', 'Wähle den Anfangs- und den Endzustand und das Nullniveau der Lageenergie.')}</li>` +
        `<li>${L('Write down the energy of each state: only the forms that are not zero (bar charts).', 'Schreibe die Energie jedes Zustands auf: nur die Energieformen, die nicht null sind (Balkendiagramme).')}</li>` +
        `<li>${L('Equate the sums: $E_1 = E_2$.', 'Setze die Summen gleich: $E_1 = E_2$.')}</li>` +
        `<li>${L('Solve for the wanted quantity with symbols: $v = \\sqrt{2\\,g\\,h}$.', 'Löse mit Symbolen nach der gesuchten Grösse auf: $v = \\sqrt{2\\,g\\,h}$.')}</li>` +
        `<li>${L('Only then insert numbers: with $h = 5\\,\\mathrm{m}$, $v = \\sqrt{2\\cdot 10\\cdot 5}\\,\\mathrm{\\tfrac{m}{s}} = 10\\,\\mathrm{\\tfrac{m}{s}}$.', 'Erst dann Zahlen einsetzen: Mit $h = 5\\,\\mathrm{m}$ ist $v = \\sqrt{2\\cdot 10\\cdot 5}\\,\\mathrm{\\tfrac{m}{s}} = 10\\,\\mathrm{\\tfrac{m}{s}}$.')}</li></ol>` +
        `<p>${L('The formula shows more than the number: the mass cancels, and from four times the height the ball is only twice as fast.', 'Die Formel zeigt mehr als die Zahl: Die Masse kürzt sich weg, und aus vierfacher Höhe ist der Ball nur doppelt so schnell.')}</p>`, ex.figure({ bars: null }))],
    },
    {
      scenario: 'part-drop', formal: true, p: { fr: [2, 3], V: { g: G, h: 3, hp: 2, vp: Math.sqrt(2 * G) } },
      practice: [{ types: ['part-drop'] }, { en: 'the energy balance', de: 'die Energiebilanz', types: ['balance'] }, { en: 'kinetic and potential energy', de: 'kinetische und potentielle Energie', types: ['ekin-epot'] }, { en: 'three states', de: 'drei Zustände', types: ['speed-fraction'] }],
      name: { en: 'Part of the way down', de: 'Ein Teil des Wegs' },
      idea: { en: 'Halfway states have both kinds of energy; every height counts from the zero level.', de: 'Zwischenzustände haben beide Energieformen; jede Höhe zählt ab dem Nullniveau.' },
    },
    {
      scenario: 'incline', formal: true, p: { ask: 'h', ang: 40, V: { g: G, h: 1.8, v: 6 } },
      practice: [{ types: ['incline'] }, { en: 'path and friction', de: 'Weg und Reibung', types: ['path', 'friction'] }, { en: 'on a track', de: 'auf einer Bahn', types: ['ramp'] }, { en: 'pendulum', de: 'Pendel', types: ['pendulum'] }],
      name: { en: 'The path does not matter', de: 'Der Weg spielt keine Rolle' },
      idea: { en: 'Only the height counts, not the angle or the length of the slope; friction turns energy into thermal energy.', de: 'Nur die Höhe zählt, nicht der Winkel oder die Länge der Ebene; Reibung wandelt Energie in thermische Energie um.' },
      more: (ex) => [
        frame(L('Lifting work', 'Hubarbeit'), `<p>${L('The other way round, pushing the block slowly up the slope takes the work $W = m\\,g\\,h$, the potential energy it gains. On a slope $n$ times as long as it is high, the force needed is $n$ times smaller, $m\\,g/n$, but the path is $n$ times longer:', 'Umgekehrt braucht es die Arbeit $W = m\\,g\\,h$, um den Klotz langsam die Ebene hinaufzuschieben: die Lageenergie, die er gewinnt. Auf einer Ebene, die $n$-mal so lang wie hoch ist, braucht es eine $n$-mal kleinere Kraft, $m\\,g/n$, aber der Weg ist $n$-mal länger:')}</p>` +
          `$$W = \\frac{m\\,g}{n}\\cdot n\\,h = m\\,g\\,h$$<p>${L('Lifting work does not depend on the path: only the height difference counts.', 'Die Hubarbeit hängt nicht vom Weg ab: Nur der Höhenunterschied zählt.')}</p>`, ex.figure({})),
        frame(L('With friction', 'Mit Reibung'), `<p>${L('With friction the block arrives slower. The energy is not lost: the work done by friction becomes thermal energy $E_{\\mathrm{th}}$ of the block and the slope, and the balance gets one more term:', 'Mit Reibung kommt der Klotz langsamer unten an. Die Energie geht nicht verloren: Die Reibungsarbeit wird zu thermischer Energie $E_{\\mathrm{th}}$ von Klotz und Ebene, und die Bilanz bekommt einen Term mehr:')}</p>` +
          `$$m\\,g\\,h = \\tfrac{1}{2}\\,m\\,v^2 + E_{\\mathrm{th}}$$<p>${L('If the block arrives with only ¾ of m g h as kinetic energy, friction has produced ¼ m g h of thermal energy.', 'Kommt der Klotz nur mit ¾ von m g h als kinetischer Energie an, hat die Reibung ¼ m g h thermische Energie erzeugt.')}</p>`, ex.figure({ bars: null })),
      ],
    },
    {
      scenario: 'launcher', formal: true, p: { ask: 'v', V: { g: G, m: 0.5, s: 0.1, k: 200, v: 2 } },
      practice: [{ types: ['launcher'] }, { en: 'buffer, shot up', de: 'Puffer, hochgeschossen', types: ['buffer', 'spring-up'] }, { en: 'slopes and springs', de: 'Hänge und Federn', types: ['slope-launch', 'ramp-spring'] }],
      name: { en: 'Spring launcher', de: 'Federkatapult' },
      idea: { en: 'A compressed spring stores elastic energy, ½ k s², which it gives to the block.', de: 'Eine zusammengedrückte Feder speichert Spannenergie, ½ k s², die sie an den Klotz abgibt.' },
    },
    {
      scenario: 'twice', formal: true, p: { V: { g: G, h: 0.5, s: 0.05, m: 1, k: (2 * G * 0.55) / 0.0025, hp: 2.1 } },
      practice: [{ types: ['twice'] }, { en: 'ratios', de: 'Verhältnisse', types: ['scale'] }],
      name: { en: 'Twice the compression', de: 'Doppelte Stauchung' },
      idea: { en: 'Two experiments compared: the elastic energy grows with the square of the compression.', de: 'Zwei Versuche verglichen: Die Spannenergie wächst mit dem Quadrat der Stauchung.' },
    },
    {
      scenario: 'bungee', formal: true, p: { V: { g: G, m: 70, l: 20, s: 15, k: (2 * 70 * G * 35) / 225, v: Math.sqrt(2 * G * 20) } },
      practice: [{ types: ['bungee'] }, { en: 'turning point and equilibrium', de: 'Umkehrpunkt und Gleichgewicht', types: ['turn'] }, { en: 'dropped onto a spring', de: 'auf eine Feder fallen gelassen', types: ['drop-spring'] }],
      name: { en: 'Bungee jump', de: 'Bungee-Sprung' },
      idea: { en: 'Free fall first, then the rope stretches like a spring: count the whole drop. The lowest point is a turning point, not the equilibrium.', de: 'Zuerst freier Fall, dann dehnt sich das Seil wie eine Feder: Zähle die ganze Fallhöhe. Der tiefste Punkt ist ein Umkehrpunkt, nicht die Gleichgewichtslage.' },
      more: (ex) => [frame(L('Turning point and equilibrium', 'Umkehrpunkt und Gleichgewicht'), `<p>${L('At the lowest point ③ the jumper is at rest for an instant, $v = 0$: a turning point. The rope pulls with $k\\,s = \\frac{2\\,m\\,g\\,(\\ell + s)}{s}$, more than twice the weight, and the jumper goes back up.', 'Im tiefsten Punkt ③ ruht die Springerin für einen Augenblick, $v = 0$: ein Umkehrpunkt. Das Seil zieht mit $k\\,s = \\frac{2\\,m\\,g\\,(\\ell + s)}{s}$, mehr als doppelt so stark wie die Gewichtskraft, und sie geht wieder hoch.')}</p>` +
        `<p>${L('The equilibrium position, where she would hang at rest, is where the rope pulls as hard as the weight, $k\\,x_0 = m\\,g$, a short way below ②. Down to there she keeps speeding up: there her speed is largest, and from there the rope brakes her.', 'Die Gleichgewichtslage, in der sie in Ruhe hängen würde, ist dort, wo das Seil so stark zieht wie die Gewichtskraft, $k\\,x_0 = m\\,g$, ein Stück unter ②. Bis dorthin wird sie noch schneller: Dort ist ihre Geschwindigkeit am grössten, und von dort an bremst das Seil sie.')}</p>` +
        `<p>${L('So: turning point, $v = 0$ and no balance of forces; equilibrium, balance of forces and the largest speed.', 'Also: Umkehrpunkt, $v = 0$ und kein Kräftegleichgewicht; Gleichgewichtslage, Kräftegleichgewicht und grösste Geschwindigkeit.')}</p>`, ex.figure({ bars: null }))],
    },
    {
      scenario: 'spring-hang', formal: true, p: { ask: 'v', fr: [1, 2], V: { g: G, s: 0.4, m: 1, k: (2 * G) / 0.4, vp: Math.sqrt(G * 0.2), x: 0.2 } },
      practice: [{ types: ['spring-hang'] }, { en: 'equilibrium', de: 'Gleichgewichtslage', types: ['hang'] }],
      name: { en: 'A block on a spring', de: 'Ein Klotz an der Feder' },
      idea: { en: 'All three forms of energy at once: first find the spring constant from the lowest point.', de: 'Alle drei Energieformen zugleich: Zuerst folgt die Federkonstante aus dem tiefsten Punkt.' },
      more: (ex) => [frame(L('Lowest point and equilibrium', 'Tiefster Punkt und Ruhelage'), `<p>${L('Halfway down, the spring pulls with $k\\cdot\\tfrac{1}{2}\\,s = m\\,g$, as hard as the weight: that is where the block would hang at rest, its equilibrium. There it is fastest, $v\' = \\sqrt{\\tfrac{1}{2}\\,g\\,s}$. The lowest point is twice as far down: the block swings about the equilibrium and turns round at $s$, where the spring pulls with $2\\,m\\,g$.', 'Auf halbem Weg zieht die Feder mit $k\\cdot\\tfrac{1}{2}\\,s = m\\,g$, so stark wie die Gewichtskraft: Dort würde der Klotz in Ruhe hängen, seine Ruhelage. Dort ist er am schnellsten, $v\' = \\sqrt{\\tfrac{1}{2}\\,g\\,s}$. Der tiefste Punkt liegt doppelt so tief: Der Klotz schwingt um die Ruhelage und kehrt bei $s$ um, wo die Feder mit $2\\,m\\,g$ zieht.')}</p>`, ex.figure({ bars: null }))],
    },
    {
      frames: () => root.EnergyConcepts.errorLesson(),
      practice: [{ types: ['error'] }],
      name: { en: 'Find the error', de: 'Finde den Fehler' },
      idea: { en: 'Check an energy table state by state: at rest, no kinetic energy; heights from the zero level; a relaxed spring stores nothing.', de: 'Prüfe eine Energietabelle Zustand für Zustand: in Ruhe keine kinetische Energie; Höhen ab dem Nullniveau; eine entspannte Feder speichert nichts.' },
    },
  ];

  root.Lessons = { EXAMPLES };
  if (typeof module !== 'undefined') module.exports = { EXAMPLES };
})(typeof window !== 'undefined' ? window : globalThis);
