// The tutor's worked examples: one fixed exercise per big idea, from gravity via inertia and net
// force to interaction. The frames come from the exercise's own worked solution (app.js). Each is a
// topic of practice (topics.js): its stages list exercise types as 'topic/generator'.
(function (root) {
  'use strict';

  const EXAMPLES = [
    {
      name: { en: 'Thrown up', de: 'Hochgeworfen' },
      idea: {
        en: 'After the throw, only gravity acts on the ball: on the way up, at the top and on the way down. The ball keeps moving because of its velocity, not because of a force.',
        de: 'Nach dem Wurf wirkt nur die Schwerkraft auf den Ball: auf dem Weg nach oben, im höchsten Punkt und auf dem Weg nach unten. Der Ball bewegt sich wegen seiner Geschwindigkeit weiter, nicht wegen einer Kraft.',
      },
      gen: 'throw', params: { kind: 'vertical', phase: 'top', obj: 'ball' },
      practice: [{ types: ['gravity/throw'] }, { types: ['gravity/drop', 'gravity/tf-throw'] }, { types: ['gravity/rank-launch', 'force/ramp'] }],
    },
    {
      name: { en: 'Constant speed', de: 'Konstante Geschwindigkeit' },
      idea: {
        en: 'Moving at constant speed needs no net force: the forward and backward forces balance.',
        de: 'Für eine Bewegung mit konstanter Geschwindigkeit braucht es keine resultierende Kraft: Die Kräfte nach vorn und nach hinten heben sich auf.',
      },
      gen: 'balance', params: { obj: 'crate', phase: 'constant', dir: 1 },
      practice: [{ types: ['inertia/balance'] }, { types: ['inertia/engine', 'inertia/tf-motion'] }],
    },
    {
      name: { en: 'Slowing down', de: 'Abbremsen' },
      idea: {
        en: 'The net force points along the acceleration, not along the motion: a cabin that moves up and slows down has a net force pointing down.',
        de: 'Die resultierende Kraft zeigt in Richtung der Beschleunigung, nicht in Bewegungsrichtung: Auf eine Kabine, die nach oben fährt und abbremst, wirkt eine resultierende Kraft nach unten.',
      },
      gen: 'balance', params: { obj: 'elevator', phase: 'slowing', dir: 1 },
      practice: [{ types: ['force/balance'] }, { types: ['force/tf-motion'] }],
    },
    {
      name: { en: 'Two forces at an angle', de: 'Zwei Kräfte im Winkel' },
      idea: {
        en: 'Forces add as arrows: put them tip to tail, or draw the parallelogram. The net force — and so the acceleration — points along the diagonal: not along the larger force, and not halfway between the two.',
        de: 'Kräfte addieren sich als Pfeile: Hänge sie aneinander oder zeichne das Parallelogramm. Die resultierende Kraft — und damit die Beschleunigung — zeigt entlang der Diagonale: nicht in Richtung der grösseren Kraft und nicht genau zwischen die beiden.',
      },
      gen: 'two-forces', params: { pair: [3, 6], a1: 0, gamma: 90, sense: -1 },
      practice: [{ types: ['force/two-forces'] }],
    },
    {
      name: { en: 'Off the edge', de: 'Über die Kante' },
      idea: {
        en: 'Horizontally no force acts, vertically gravity does: the ball keeps its forward speed while it falls faster and faster — a parabola.',
        de: 'Horizontal wirkt keine Kraft, vertikal die Schwerkraft: Die Kugel behält ihre Geschwindigkeit nach vorn und fällt dabei immer schneller — eine Parabel.',
      },
      gen: 'rolloff', params: { variant: 'table', v: 1.5, h: 0.8 },
      practice: [{ types: ['gravity/rolloff'] }, { types: ['force/thruster', 'inertia/cart-launcher'] }],
    },
    {
      name: { en: 'Leaving a circle', de: 'Aus dem Kreis' },
      idea: {
        en: 'Without the pull toward the centre, the stone goes straight on along the tangent — neither outward nor on a curve.',
        de: 'Ohne die Kraft zum Zentrum fliegt der Stein geradeaus entlang der Tangente weiter — weder nach aussen noch im Bogen.',
      },
      gen: 'circle', params: { variant: 'string', sense: 1, angle: 315 },
      practice: [{ types: ['inertia/circle'] }, { types: ['inertia/kick', 'gravity/pendulum-cut'] }],
    },
    {
      name: { en: 'Collision', de: 'Zusammenstoss' },
      idea: {
        en: 'Two bodies that interact push on each other equally hard. The lighter one is affected more, because the same force changes its velocity more.',
        de: 'Zwei Körper, die wechselwirken, drücken gleich stark aufeinander. Der leichtere wird stärker beeinflusst, weil dieselbe Kraft seine Geschwindigkeit stärker ändert.',
      },
      gen: 'collision', params: { case: 'parkedTruck', mC: 1.2, k: 10 },
      practice: [{ types: ['interact/collision'] }, { types: ['interact/push-apart', 'interact/push-car', 'interact/support'] }],
    },
    {
      name: { en: 'Sort and match', de: 'Ordnen und zuordnen' },
      idea: {
        en: 'Ranking: the cable force follows the acceleration, not the motion — cases that look very different can rank equal. Matching: each case gets the direction of its net force.',
        de: 'Ordnen: Die Seilkraft folgt der Beschleunigung, nicht der Bewegung — ganz verschieden aussehende Fälle können gleichrangig sein. Zuordnen: Jeder Fall bekommt die Richtung seiner resultierenden Kraft.',
      },
      gen: 'rank-elevator', params: {},
      practice: [{ types: ['force/rank-elevator'] }, { types: ['force/match-diagrams', 'inertia/match-diagrams'] }],
    },
    {
      name: { en: 'Predict and explain', de: 'Vorhersagen und begründen' },
      idea: {
        en: 'First predict, then choose the reason. A right prediction counts only with the right reason: “both are magnets” gives the right answer for the wrong reason.',
        de: 'Zuerst vorhersagen, dann die Begründung wählen. Eine richtige Vorhersage zählt nur mit der richtigen Begründung: „Beides sind Magnete“ führt zur richtigen Antwort aus dem falschen Grund.',
      },
      gen: 'magnets', params: { variant: 'two', masses: [1, 2] },
      practice: [{ types: ['interact/magnets'] }],
    },
    {
      name: { en: 'True or false', de: 'Richtig oder falsch' },
      idea: {
        en: 'Check each statement on its own against the laws. The Earth and the Moon pull on each other equally hard — but the forces act on different bodies and do not cancel.',
        de: 'Prüfe jede Aussage für sich an den Gesetzen. Erde und Mond ziehen gleich stark aneinander — aber die Kräfte wirken auf verschiedene Körper und heben sich nicht auf.',
      },
      gen: 'tf-interact', params: { pair: 'earthMoon' },
      practice: [{ types: ['interact/tf-interact'] }, { types: ['interact/match-partners'] }],
    },
  ];

  root.Lessons = { EXAMPLES };
  if (typeof module !== 'undefined') module.exports = { EXAMPLES };
})(typeof window !== 'undefined' ? window : globalThis);
