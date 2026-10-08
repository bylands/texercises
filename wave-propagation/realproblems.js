// Problems: crests in everyday life and technology, told as stories, each with a picture
// (figures.js), numbers from lists, and questions with options from typical mistakes, as in
// practice (generator.js): the cable tester (an echo: its time gives the distance, its sign the
// kind of fault), a rope on a wall or a ring, the harbour wall (a free end: twice the height), the
// stadium wave (people only stand up and sit down), the stop-and-go wave (running against the
// traffic) and two pulses on a slinky (a straight spring that still moves).
//   PROBLEMS[i]  { id, difficulty, title(), make(r) }; realOf(i, seed) the exercise (app.js)
(function (root) {
  'use strict';

  const W = root.Waves || require('./generator.js');
  const Lang = root.Lang || (typeof require === 'function' ? require('./lang.js') : null);
  const L = (en, de) => (Lang ? Lang.L(en, de) : en);
  const num = W.num;

  // the options of a value: the right one and the mistakes, apart by 15 %, sorted
  function values(right, mistakes, unit, extra = [2, 0.5, 3]) {
    const out = [{ value: right, ok: true, why: '' }];
    for (const m of [...mistakes, ...extra.map((k) => ({ value: right * k, tag: 'other', why: mistakes.length ? mistakes[0].why : '' }))]) {
      if (out.length === 4) break;
      const v = Number(m.value.toPrecision(3));
      if (Number.isFinite(v) && v > 0 && out.every((o) => Math.abs(Math.log(v / o.value)) > Math.log(1.15))) out.push({ ...m, value: v, ok: false });
    }
    return out.sort((a, b) => a.value - b.value).map((o) => ({ ...o, label: `${num(o.value)} ${unit}` }));
  }
  const choice = (key, label, options) => ({ type: 'choice', key, label, options });
  const words = (r, list) => r.shuffle(list.map(([label, ok, why]) => ({ label, ok, why })));

  // ---------------------------------------------------------------- the cable tester
  // A pulse sent into a cable comes back from a fault; v = 2·10⁸ m/s. An open end reflects like a
  // free end (the echo upright), a short circuit like a fixed end (the echo upside down).
  const cable = {
    id: 'cable', difficulty: 3, title: () => L('Finding a break in a cable', 'Einen Kabelbruch finden'),
    make(r) {
      const d = r.pick([120, 180, 250, 300, 450, 600]), short = r.next() < 0.5, dt = (2 * d) / 2e8 * 1e6; // µs
      const T = Math.ceil(dt * 1.4 + 0.5), bump = (t, t0, h) => (t >= t0 && t <= t0 + 0.4 ? h * Math.sin((Math.PI * (t - t0)) / 0.4) ** 2 : 0);
      const f = (t) => bump(t, 0.2, 4) + bump(t, 0.2 + dt, short ? -2.5 : 2.5);
      const why = L(`The echo arrives ${num(dt)} µs after the pulse. In that time the pulse ran to the fault and back: d = v·t/2 = 2·10⁸ m/s · ${num(dt)} µs / 2 = ${num(d)} m.`, `Das Echo kommt ${num(dt)} µs nach dem Puls an. In dieser Zeit lief der Puls zum Fehler und zurück: d = v·t/2 = 2·10⁸ m/s · ${num(dt)} µs / 2 = ${num(d)} m.`);
      const kind = L(`An open end lets the cable's end swing freely, like a free end: the echo comes back upright. A short circuit holds the voltage at 0, like a fixed end: the echo comes back upside down. Here it is ${short ? 'upside down' : 'upright'}.`, `Ein offenes Ende lässt das Kabelende frei, wie ein loses Ende: Das Echo kommt aufrecht zurück. Ein Kurzschluss hält die Spannung auf 0, wie ein festes Ende: Das Echo kommt umgedreht zurück. Hier ist es ${short ? 'umgedreht' : 'aufrecht'}.`);
      return {
        text: L(`A buried cable has stopped working. A technician sends a short voltage pulse into it and records the voltage at its start (below): the pulse, and later its echo from the fault. Pulses run along the cable at 2·10⁸ m/s. (a) How far from the start is the fault? (b) Is it a break (an open end) or a short circuit?`,
          `Ein vergrabenes Kabel funktioniert nicht mehr. Ein Techniker schickt einen kurzen Spannungspuls hinein und zeichnet die Spannung an seinem Anfang auf (unten): den Puls und später sein Echo vom Fehler. Pulse laufen mit 2·10⁸ m/s durch das Kabel. (a) Wie weit vom Anfang entfernt ist der Fehler? (b) Ist es ein Bruch (ein offenes Ende) oder ein Kurzschluss?`),
        fig: { axis: 't', lo: 0, hi: T, Y: 5, curves: [{ f, cls: 'main' }], end: null, arrows: [], marks: [], dots: [], label: L('the start of the cable', 'Anfang des Kabels'), u: { x: 'µs', y: 'V', yname: 'U', dx: 0.5, xl: 1, dy: 1, yl: 2 } },
        questions: [
          choice('d', L('(a) the distance to the fault', '(a) der Abstand zum Fehler'), values(d, [{ value: 2 * d, tag: 'twice', why: L(`The pulse ran there and back. ${why}`, `Der Puls lief hin und zurück. ${why}`) }, { value: d / 2, tag: 'half', why }], 'm')),
          choice('kind', L('(b) the fault', '(b) der Fehler'), words(r, [[L('a break (open end)', 'ein Bruch (offenes Ende)'), !short, kind], [L('a short circuit', 'ein Kurzschluss'), short, kind]])),
        ],
        hints: [L('The echo has run to the fault and back.', 'Das Echo ist zum Fehler und zurück gelaufen.'), W.RULE.fixed(), L('An open end is like a free end; a short circuit holds the voltage at 0, like a fixed end.', 'Ein offenes Ende ist wie ein loses Ende; ein Kurzschluss hält die Spannung auf 0, wie ein festes Ende.')],
        solution: [why, kind, L('Cable testers (time-domain reflectometers) find faults this way, to within a metre.', 'Kabeltester (Zeitbereichsreflektometer) finden Fehler auf diese Weise, auf einen Meter genau.')],
        pic: 'cable',
      };
    },
  };

  // ---------------------------------------------------------------- a rope on a wall or a ring
  const rope = {
    id: 'rope', difficulty: 2, title: () => L('A rope on a wall or a ring', 'Ein Seil an Wand oder Ring'),
    make(r) {
      const len = r.pick([6, 8, 10, 12]), v = r.pick([4, 5, 8]), ring = r.next() < 0.5, T = (2 * len) / v;
      const why = L(`The crest runs ${num(len)} m to the end and ${num(len)} m back: t = 2·${num(len)} m / ${num(v)} m/s = ${num(T)} s.`, `Der Buckel läuft ${num(len)} m zum Ende und ${num(len)} m zurück: t = 2·${num(len)} m / ${num(v)} m/s = ${num(T)} s.`);
      const how = ring ? L('The ring slides freely up and down the pole: a free end. The crest comes back upright.', 'Der Ring gleitet frei an der Stange auf und ab: ein loses Ende. Der Buckel kommt aufrecht zurück.') : L('The knot on the wall cannot move: a fixed end. The crest comes back upside down.', 'Der Knoten an der Wand kann sich nicht bewegen: ein festes Ende. Der Buckel kommt umgedreht zurück.');
      const sc = { pulses: [W.pulse(W.SMOOTH.skew, 0.2, 1, 1)], end: { x: 6.5, type: ring ? 'free' : 'fixed' } };
      return {
        text: ring ? L(`A rope, ${num(len)} m long, is tied to a ring that can slide up and down a smooth pole. You flick the other end once upwards: a crest runs along the rope at ${num(v)} m/s. (a) After how long does it come back to your hand? (b) How does it come back?`,
          `Ein Seil, ${num(len)} m lang, ist an einem Ring festgemacht, der an einer glatten Stange auf und ab gleiten kann. Du schlägst das andere Ende einmal nach oben: Ein Buckel läuft mit ${num(v)} m/s über das Seil. (a) Nach welcher Zeit kommt er zu deiner Hand zurück? (b) Wie kommt er zurück?`)
          : L(`A rope, ${num(len)} m long, is tied to a hook in a wall. You flick the other end once upwards: a crest runs along the rope at ${num(v)} m/s. (a) After how long does it come back to your hand? (b) How does it come back?`,
            `Ein Seil, ${num(len)} m lang, ist an einem Haken in einer Wand festgebunden. Du schlägst das andere Ende einmal nach oben: Ein Buckel läuft mit ${num(v)} m/s über das Seil. (a) Nach welcher Zeit kommt er zu deiner Hand zurück? (b) Wie kommt er zurück?`),
        questions: [
          choice('t', L('(a) the time until it is back', '(a) die Zeit, bis er zurück ist'), values(T, [{ value: len / v, tag: 'once', why: L(`That is only the way to the end. ${why}`, `Das ist nur der Weg bis zum Ende. ${why}`) }, { value: v / len, tag: 'inverse', why }], 's')),
          choice('how', L('(b) the crest that comes back', '(b) der zurückkommende Buckel'), words(r, [[L('upright', 'aufrecht'), ring, how], [L('upside down', 'umgedreht'), !ring, how], [L('it does not come back', 'er kommt nicht zurück'), false, L('At the end the crest is reflected: it has nowhere else to go.', 'Am Ende wird der Buckel reflektiert: Er kann nirgends sonst hin.')]])),
        ],
        hints: [L('To the end and back: twice the length.', 'Bis zum Ende und zurück: die doppelte Länge.'), W.RULE.fixed()],
        solution: [why, how],
        solAnim: { sc, t0: 0, t1: 13, show: ['sum'] },
        pic: ring ? 'ring' : 'wall',
      };
    },
  };

  // ---------------------------------------------------------------- the harbour wall
  // For water, a vertical wall is a free end: at the wall the water rises twice as high.
  const harbour = {
    id: 'harbour', difficulty: 3, title: () => L('A wave at the harbour wall', 'Eine Welle an der Hafenmauer'),
    make(r) {
      const h = r.pick([0.5, 0.8, 1, 1.2, 1.5]), v = r.pick([4, 5, 6]);
      const why = L(`The water can rise and fall freely at the wall, it is only stopped sideways: the wall is a free end for the wave. The incoming and the reflected crest add up there: ${num(h)} m + ${num(h)} m = ${num(2 * h)} m.`, `Das Wasser kann an der Mauer frei steigen und sinken, es wird nur seitlich gestoppt: Die Mauer ist für die Welle ein loses Ende. Der einlaufende und der reflektierte Buckel addieren sich dort: ${num(h)} m + ${num(h)} m = ${num(2 * h)} m.`);
      const sh = { w: 3, lin: false, f: (u) => h * Math.sin((Math.PI * u) / 3) ** 2 }, p = W.pulse(sh, 0, 1, 1), E = 6, sc = { pulses: [p], end: { x: E, type: 'free' } };
      const g = (fn) => ({ axis: 't', lo: 0, hi: 8, Y: 3.2, curves: [{ f: fn, cls: 'main' }], end: null, arrows: [], marks: [], dots: [], label: L('at the wall', 'an der Mauer'), u: { x: 's', y: 'm', dx: 0.5, xl: 1, dy: 0.5, yl: 1 } });
      const at = (t) => W.ev(p, E, t);
      return {
        text: L(`A single wave crest, ${num(h)} m high, runs at ${num(v)} m/s towards a vertical harbour wall. (a) How high does the water rise at the wall as the crest arrives? (b) Which graph shows the height of the water at the wall against time?`,
          `Ein einzelner Wellenberg, ${num(h)} m hoch, läuft mit ${num(v)} m/s auf eine senkrechte Hafenmauer zu. (a) Wie hoch steigt das Wasser an der Mauer, wenn der Wellenberg ankommt? (b) Welcher Graph zeigt die Höhe des Wassers an der Mauer gegen die Zeit?`),
        questions: [
          choice('h', L('(a) the height at the wall', '(a) die Höhe an der Mauer'), values(2 * h, [{ value: h, tag: 'single', why }, { value: 4 * h, tag: 'other', why }], 'm', [1.5, 3])),
          { type: 'pick', key: 'fig', options: r.shuffle([
            { fig: g((t) => 2 * at(t)), ok: true, why: '' },
            { fig: g(at), ok: false, tag: 'single', why },
            { fig: g(() => 0), ok: false, tag: 'fixed', why: L(`Only a fixed end stays at rest. ${why}`, `Nur ein festes Ende bleibt in Ruhe. ${why}`) },
            { fig: g((t) => -2 * at(t)), ok: false, tag: 'sign', why: L(`At a free end the crest is reflected upright. ${why}`, `An einem losen Ende wird der Buckel aufrecht reflektiert. ${why}`) },
          ]) },
        ],
        hints: [L('At the wall the water can move up and down freely: what kind of end is that?', 'An der Mauer kann sich das Wasser frei auf und ab bewegen: Was für ein Ende ist das?'), L('At a free end the incoming and the reflected crest are there at the same time, and add up.', 'An einem losen Ende sind der einlaufende und der reflektierte Buckel gleichzeitig dort und addieren sich.')],
        solution: [why, L('That is why spray shoots up at harbour walls and cliffs.', 'Darum spritzt die Gischt an Hafenmauern und Klippen hoch.')],
        solAnim: { sc, t0: 0, t1: 8, show: ['parts', 'sum'], virtual: true, Y: 2 * h * 1.3 },
        pic: 'harbour',
      };
    },
  };

  // ---------------------------------------------------------------- the stadium wave
  const stadium = {
    id: 'stadium', difficulty: 2, title: () => L('The stadium wave', 'Die La-Ola-Welle'),
    make(r) {
      const v = r.pick([10, 12, 15]), tau = r.pick([0.6, 0.8, 1, 1.2]), C = r.pick([480, 600, 720]), width = v * tau, lap = C / v;
      const whyW = L(`Each spectator is up for ${num(tau)} s; in that time the wave moves on ${num(v)} m/s · ${num(tau)} s = ${num(width)} m: that is its width.`, `Jeder Zuschauer ist ${num(tau)} s lang oben; in dieser Zeit läuft die Welle ${num(v)} m/s · ${num(tau)} s = ${num(width)} m weiter: Das ist ihre Breite.`);
      const whyL = L(`One lap: ${num(C)} m / ${num(v)} m/s = ${num(lap)} s.`, `Eine Runde: ${num(C)} m / ${num(v)} m/s = ${num(lap)} s.`);
      const bump = (d) => (t) => (t >= 1 && t <= 1 + d ? 0.6 * Math.sin((Math.PI * (t - 1)) / d) ** 2 : 0);
      const g = (fn, hi = 4) => ({ axis: 't', lo: 0, hi, Y: 1, curves: [{ f: fn, cls: 'main' }], end: null, arrows: [], marks: [], dots: [], label: L('one spectator', 'ein Zuschauer'), u: { x: 's', y: 'm', dx: 0.5, xl: 1, dy: 0.2, yl: 0.5, yname: 'h' } });
      return {
        text: L(`In a stadium, the spectators make a wave: each stands up and sits down again, taking ${num(tau)} s, just after the neighbour. The wave runs round the stadium at ${num(v)} m/s; the stadium is ${num(C)} m round. (a) How wide is the wave? (b) How long does a lap take? (c) Which graph shows how one spectator's head moves up and down?`,
          `In einem Stadion machen die Zuschauer eine La-Ola-Welle: Jeder steht auf und setzt sich wieder, was ${num(tau)} s dauert, kurz nach seinem Nachbarn. Die Welle läuft mit ${num(v)} m/s ums Stadion; der Umfang beträgt ${num(C)} m. (a) Wie breit ist die Welle? (b) Wie lange dauert eine Runde? (c) Welcher Graph zeigt, wie sich der Kopf eines Zuschauers auf und ab bewegt?`),
        questions: [
          choice('w', L('(a) the width of the wave', '(a) die Breite der Welle'), values(width, [{ value: tau / v, tag: 'inverse', why: whyW }, { value: v / tau, tag: 'inverse', why: whyW }], 'm')),
          choice('lap', L('(b) one lap', '(b) eine Runde'), values(lap, [{ value: C * v / 1000, tag: 'inverse', why: whyL }, { value: lap / 2, tag: 'half', why: whyL }], 's')),
          { type: 'pick', key: 'fig', options: r.shuffle([
            { fig: g(bump(tau)), ok: true, why: '' },
            { fig: g(bump(Math.min(2.8, 2 * tau))), ok: false, tag: 'dur', why: L(`Each spectator is up for ${num(tau)} s.`, `Jeder Zuschauer ist ${num(tau)} s lang oben.`) },
            { fig: g((t) => (t >= 1 ? 0.6 : 0)), ok: false, tag: 'stay', why: L('Each spectator sits down again: only the wave moves on.', 'Jeder Zuschauer setzt sich wieder: Nur die Welle läuft weiter.') },
            { fig: g((t) => 0.6 * Math.sin((Math.PI * t) / 0.8) ** 2), ok: false, tag: 'periodic', why: L('A single wave passes: each spectator stands up once.', 'Eine einzelne Welle läuft vorbei: Jeder Zuschauer steht einmal auf.') },
          ]) },
        ],
        hints: [L('Width: how far the wave moves while one spectator is up.', 'Breite: Wie weit die Welle läuft, während ein Zuschauer oben ist.'), W.RULE.medium()],
        solution: [whyW, whyL, L('Nobody runs round the stadium: each spectator only moves up and down, a moment after the neighbour. The wave is the pattern that moves.', 'Niemand läuft ums Stadion: Jeder Zuschauer bewegt sich nur auf und ab, einen Moment nach seinem Nachbarn. Die Welle ist das Muster, das sich bewegt.')],
        pic: 'stadium',
      };
    },
  };

  // ---------------------------------------------------------------- the stop-and-go wave
  const traffic = {
    id: 'traffic', difficulty: 4, title: () => L('A stop-and-go wave', 'Eine Stauwelle'),
    make(r) {
      const u = r.pick([12, 15, 18, 20]), km0 = r.pick([14, 16, 18]), mins = r.pick([6, 12, 18]), km1 = km0 - (u * mins) / 60;
      const len = r.pick([1, 1.5, 2]), vin = r.pick([6, 10, 12]), tin = (len / (vin + u)) * 60;
      const whyU = L(`The end of the jam moved from km ${num(km0)} to km ${num(km1)}, ${num(km0 - km1)} km backwards, in ${num(mins)} min: ${num(km0 - km1)} km / ${num(mins / 60)} h = ${num(u)} km/h, against the traffic.`, `Das Stauende ist von km ${num(km0)} nach km ${num(km1)} gewandert, ${num(km0 - km1)} km rückwärts, in ${num(mins)} min: ${num(km0 - km1)} km / ${num(mins / 60)} h = ${num(u)} km/h, gegen die Fahrtrichtung.`);
      const whyT = L(`The car crawls forwards at ${num(vin)} km/h while the jam moves backwards at ${num(u)} km/h: they pass each other at ${num(vin + u)} km/h. Through ${num(len)} km of jam: ${num(len)} km / ${num(vin + u)} km/h = ${num(len / (vin + u))} h = ${num(tin)} min.`, `Das Auto kriecht mit ${num(vin)} km/h vorwärts, während der Stau mit ${num(u)} km/h rückwärts wandert: Sie bewegen sich mit ${num(vin + u)} km/h aneinander vorbei. Durch ${num(len)} km Stau: ${num(len)} km / ${num(vin + u)} km/h = ${num(len / (vin + u))} h = ${num(tin)} min.`);
      return {
        text: L(`On a busy motorway a jam forms out of nothing and moves as a wave. At 8:00 its end is at km ${num(km0)}, at 8:${String(mins).padStart(2, '0')} at km ${num(km1)} (the traffic drives towards higher km). (a) How fast does the jam move, and which way? (b) The jam is ${num(len)} km long; in it, the cars crawl at ${num(vin)} km/h. How long is a car stuck in it?`,
          `Auf einer vollen Autobahn entsteht ein Stau aus dem Nichts und wandert als Welle. Um 8:00 ist sein Ende bei km ${num(km0)}, um 8:${String(mins).padStart(2, '0')} bei km ${num(km1)} (der Verkehr fährt zu höheren km). (a) Wie schnell bewegt sich der Stau, und in welche Richtung? (b) Der Stau ist ${num(len)} km lang; darin kriechen die Autos mit ${num(vin)} km/h. Wie lange steckt ein Auto darin fest?`),
        questions: [
          choice('u', L('(a) the jam moves', '(a) der Stau bewegt sich'), words(r, [
            [L(`${num(u)} km/h backwards, against the traffic`, `${num(u)} km/h rückwärts, gegen den Verkehr`), true, whyU],
            [L(`${num(u)} km/h forwards, with the traffic`, `${num(u)} km/h vorwärts, mit dem Verkehr`), false, whyU],
            [L(`${num((km0 - km1) / mins)} km/h backwards`, `${num((km0 - km1) / mins)} km/h rückwärts`), false, L(`Minutes are not hours. ${whyU}`, `Minuten sind keine Stunden. ${whyU}`)],
            [L('it does not move: only the cars do', 'er bewegt sich nicht: nur die Autos'), false, whyU],
          ])),
          choice('t', L('(b) the time in the jam', '(b) die Zeit im Stau'), values(tin, [{ value: (len / vin) * 60, tag: 'still', why: L(`That would hold if the jam stood still. ${whyT}`, `Das gälte, wenn der Stau stillstünde. ${whyT}`) }, { value: (len / Math.abs(vin - u)) * 60, tag: 'diff', why: whyT }], 'min')),
        ],
        hints: [L('Speed of the wave: how far its end moves, divided by the time.', 'Geschwindigkeit der Welle: wie weit sich ihr Ende bewegt, geteilt durch die Zeit.'), L('The car and the jam move towards each other: their speeds add.', 'Das Auto und der Stau bewegen sich aufeinander zu: Ihre Geschwindigkeiten addieren sich.')],
        solution: [whyU, whyT, L('The cars (the medium) move forwards, the jam (the wave) backwards: a wave is not carried along by its medium.', 'Die Autos (das Medium) fahren vorwärts, der Stau (die Welle) wandert rückwärts: Eine Welle wird nicht von ihrem Medium mitgetragen.')],
        pic: 'traffic',
      };
    },
  };

  // ---------------------------------------------------------------- two pulses on a slinky
  const slinky = {
    id: 'slinky', difficulty: 3, title: () => L('Two pulses on a slinky', 'Zwei Pulse auf einer Feder'),
    make(r) {
      const v = r.pick([1, 2]), sh = W.LIN.trap, gapHalf = r.pick([0.5, 1, 1.5]); // both pulses whole on the 8 m shown
      const a = W.pulse(sh, 4 - gapHalf - sh.w, 1, v), b = W.pulse(sh, 4 + gapHalf, -1, v, { sgn: -1 }); // the first upside down: at full overlap they cancel
      const sc = { pulses: [a, b], end: null }, tm = gapHalf / v + sh.w / (2 * v);
      const why = L(`The fronts are ${num(2 * gapHalf)} m apart and close in at 2·${num(v)} m/s; the pulses cover each other completely when each has moved ${num(gapHalf + sh.w / 2)} m: t = ${num(gapHalf + sh.w / 2)} m / ${num(v)} m/s = ${num(tm)} s.`, `Die Fronten sind ${num(2 * gapHalf)} m voneinander entfernt und nähern sich mit 2·${num(v)} m/s; die Pulse decken sich ganz, wenn jeder ${num(gapHalf + sh.w / 2)} m zurückgelegt hat: t = ${num(gapHalf + sh.w / 2)} m / ${num(v)} m/s = ${num(tm)} s.`);
      const energy = L('At that moment the spring is straight, but its coils are moving fast (up where one pulse was rising, …): all the energy is kinetic. A moment later the pulses come out again.', 'In diesem Moment ist die Feder gerade, aber ihre Windungen bewegen sich schnell: Die ganze Energie ist Bewegungsenergie. Einen Moment später kommen die Pulse wieder heraus.');
      return {
        text: L(`Two students stretch a long slinky and each sends a pulse, one up and one down, of the same shape, towards the other at ${num(v)} m/s. The diagram shows the spring at t = 0. (a) When is the spring straight for a moment? (b) Where is the energy of the pulses at that moment?`,
          `Zwei Schüler spannen eine lange Feder und schicken je einen Puls, einen nach oben und einen nach unten, von gleicher Form, mit ${num(v)} m/s zueinander. Das Diagramm zeigt die Feder zur Zeit t = 0. (a) Wann ist die Feder für einen Moment gerade? (b) Wo ist die Energie der Pulse in diesem Moment?`),
        fig: W.snap((x) => W.y(sc, x, 0), { arrows: [W.arrowOf(a, 0), W.arrowOf(b, 0, { up: true })], label: W.tLabel(0) }),
        questions: [
          choice('t', L('(a) the spring is straight at', '(a) die Feder ist gerade bei'), values(tm, [{ value: gapHalf / v, tag: 'touch', why: L(`That is when their fronts meet. ${why}`, `Dann treffen sich ihre Fronten. ${why}`) }, { value: (2 * gapHalf + sh.w) / v, tag: 'apart', why }], 's', [1.5, 0.5])),
          choice('e', L('(b) the energy', '(b) die Energie'), words(r, [
            [L('in the motion of the coils', 'in der Bewegung der Windungen'), true, energy],
            [L('it is lost, and comes back from nowhere', 'sie ist verloren und kommt aus dem Nichts zurück'), false, L(`Energy is never lost. ${energy}`, `Energie geht nie verloren. ${energy}`)],
            [L('in the stretched coils', 'in den gedehnten Windungen'), false, energy],
            [L('in the students’ hands', 'in den Händen der Schüler'), false, energy],
          ])),
        ],
        hints: [W.RULE.sup(), L('A straight spring can still be moving.', 'Eine gerade Feder kann sich trotzdem bewegen.')],
        solution: [why, energy],
        solAnim: { sc, t0: 0, t1: 2 * tm, show: ['parts', 'sum'], hold: tm },
        pic: 'slinky',
      };
    },
  };

  const PROBLEMS = [stadium, rope, cable, harbour, slinky, traffic];

  function realOf(i, seed) {
    const pb = PROBLEMS[i], r = W.rng(seed), e = pb.make(r);
    return { ...e, kind: 'real', problem: pb.id, title: pb.title(), difficulty: pb.difficulty, text: `<p>${e.text}</p>` };
  }

  root.WaveProblems = { PROBLEMS, realOf };
  if (typeof module !== 'undefined') module.exports = root.WaveProblems;
})(typeof window !== 'undefined' ? window : globalThis);
